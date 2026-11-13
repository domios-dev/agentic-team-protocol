#!/usr/bin/env node
// Runs the Agentic Team Protocol reference validator over everything this repository
// publishes and fails on any difference from the recorded expectations.
//
//   node scripts/conformance.mjs [--validator <path>] [--summary <file>]
//
// The validator is the released `atp-validate` command-line tool, installed as
// validator/README.md describes (default: `atp-validate` on PATH, or $ATP_VALIDATE).
// Its SHA-256 must be one of the release checksums recorded in validator/README.md and
// PROVENANCE.md. The committed WebAssembly module validator/<version>/ (SHA-256 checked
// against PROVENANCE.md) runs on every single-file and ZIP input as well, and its report
// must equal the command-line tool's. Domios is never installed or called.
//
// Inputs (a reader takes no host input such as a host profile; specification
// section 10.7):
//  - packages/<scope>/<name>/<version>/: every form the version ships (<name>.team.yaml
//    when present, <name>.team, <name>/). Each must be valid with no diagnostic, and the
//    report's name and version must be the directory's.
//  - examples/{invalid,warnings}/<case>/: the input named by expected.yaml. The report
//    must hold exactly the diagnostics listed there (errors with severity error,
//    warnings with severity warning), matched on code, severity, file, path, and line
//    and column where listed.
//    The package is valid exactly when no error is expected. This is the strict
//    regression oracle for the generated artifacts; for other implementations only
//    accept/refuse and the codes are normative (examples/README.md).
//  - corpus/<spec version>/cases.json: every case, read as the reference
//    implementation's own corpus test reads it: `valid` must match, every listed
//    diagnostic must be reported (matched on code, path, and line where listed), and
//    every reported error must carry a listed code; unlisted warnings are not checked,
//    as that test checks its unlisted-code rule over errors only. A case's `expect` list is not
//    exhaustive: invalid/default-path-only.team.yaml lists 2 of its 8 missing_file errors.
//
// Exit codes: 0 every check matched; 1 any mismatch; 2 usage error or the validator
// cannot be found, run or identified.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { initSync, check_yaml, check_archive } from '../validator/2026.11.11/atp_validate.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VALIDATOR_VERSION = '2026.11.11';
export const SPEC_VERSION = '2026-11-11';
const WASM_DIR = `validator/${VALIDATOR_VERSION}`;

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const byteOrder = (a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
const posix = (p) => p.split(path.sep).join('/');

// Recorded checksums: file name -> Set of SHA-256, from table rows "| `name` | ... | `hex` |".
export function recordedChecksums(file, root = ROOT) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const out = new Map();
  for (const line of text.split('\n')) {
    const m = /^\| `([^`]+)`[^|]*\|.*`([0-9a-f]{64})` \|\s*$/.exec(line);
    if (!m) continue;
    if (!out.has(m[1])) out.set(m[1], new Set());
    out.get(m[1]).add(m[2]);
  }
  return out;
}

let wasmReady = false;
// Initializes the committed WebAssembly reference validator after checking its bytes
// against PROVENANCE.md. Returns {checkYaml, checkArchive}, each returning the parsed report.
export function referenceWasm(root = ROOT) {
  if (!wasmReady) {
    const recorded = recordedChecksums('PROVENANCE.md', root);
    for (const name of ['atp_validate.js', 'atp_validate_bg.wasm']) {
      const rel = `${WASM_DIR}/${name}`;
      const actual = sha256(fs.readFileSync(path.join(root, rel)));
      if (!recorded.get(rel)?.has(actual)) {
        throw new Error(`${rel}: SHA-256 ${actual} is not the one recorded in PROVENANCE.md`);
      }
    }
    initSync({ module: fs.readFileSync(path.join(root, WASM_DIR, 'atp_validate_bg.wasm')) });
    wasmReady = true;
  }
  return {
    checkYaml: (text) => JSON.parse(check_yaml(text)),
    checkArchive: (bytes) => JSON.parse(check_archive(bytes)),
  };
}

// Runs the WebAssembly module on a single-file or ZIP input; null for a folder.
export function wasmReport(abs, wasm = referenceWasm()) {
  if (fs.statSync(abs).isDirectory()) return null;
  const bytes = fs.readFileSync(abs);
  return abs.endsWith('.team') ? wasm.checkArchive(bytes) : wasm.checkYaml(bytes.toString('utf8'));
}

function which(cmd) {
  if (path.isAbsolute(cmd) || cmd.includes('/') || cmd.includes('\\')) return fs.existsSync(cmd) ? path.resolve(cmd) : null;
  const exts = process.platform === 'win32' ? ['.exe', ''] : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const p = path.join(dir, cmd + ext);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    }
  }
  return null;
}

// Resolves the command-line validator and checks it is a recorded release binary.
function resolveCli(cmd) {
  const abs = which(cmd);
  if (!abs) throw new Error(`validator \`${cmd}\` not found; install it as validator/README.md describes, or pass --validator <path>`);
  const actual = sha256(fs.readFileSync(abs));
  const readme = [...recordedChecksums('validator/README.md').entries()].find(([, sums]) => sums.has(actual));
  const prov = [...recordedChecksums('PROVENANCE.md').entries()].find(([, sums]) => sums.has(actual));
  if (!readme || !prov) {
    throw new Error(`${abs}: SHA-256 ${actual} is not a release binary recorded in validator/README.md and PROVENANCE.md`);
  }
  return { abs, sha256: actual, file: readme[0] };
}

function runCli(cli, abs) {
  const r = spawnSync(cli, [abs, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`cannot run ${cli}: ${r.error.message}`);
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    /* reported below */
  }
  return { exit: r.status, report, stderr: r.stderr.trim() };
}

const canonical = (v) =>
  JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));

const show = (d) =>
  `${d.severity ?? '?'} ${d.code}@${d.file ?? '?'}:${d.path ?? ''}${d.line != null ? `:${d.line}` : ''}${d.column != null ? `:${d.column}` : ''}`;

// Matches each expectation to a distinct diagnostic; returns problem strings. With
// `exact`, every diagnostic must be matched; otherwise (the corpus) every unmatched
// error must still carry one of the expected codes, and unmatched warnings are not
// checked.
function matchDiagnostics(expected, actual, exact) {
  const problems = [];
  const left = [...actual];
  // Most specific expectations first, so a wildcard never takes another's diagnostic.
  const ordered = [...expected].sort((a, b) => Object.keys(b.fields).length - Object.keys(a.fields).length);
  for (const e of ordered) {
    const i = left.findIndex((d) => Object.entries(e.fields).every(([k, v]) => d[k] === v));
    if (i < 0) problems.push(`expected ${e.label}, not reported`);
    else left.splice(i, 1);
  }
  const codes = new Set(expected.map((e) => e.fields.code));
  for (const d of left) {
    if (exact || (d.severity === 'error' && !codes.has(d.code))) problems.push(`unexpected ${show(d)}`);
  }
  return problems;
}

// One validator run of one input: exit code and validity agree, the WebAssembly module
// agrees, then the case-specific check. Returns the result record.
function check({ cli, wasm, kind, name, form, input, expectValid, expected, exact = true, identity }) {
  const abs = path.join(ROOT, input);
  const problems = [];
  const { exit, report, stderr } = runCli(cli, abs);
  if (!report) {
    problems.push(`no JSON report (exit ${exit}${stderr ? `, stderr: ${stderr}` : ''})`);
  } else {
    if (exit !== (report.valid ? 0 : 1)) problems.push(`exit ${exit} does not match valid=${report.valid}`);
    if (report.valid !== expectValid) problems.push(`valid=${report.valid}, expected ${expectValid}`);
    problems.push(...matchDiagnostics(expected, report.diagnostics ?? [], exact));
    if (identity && (report.name !== identity.name || report.version !== identity.version)) {
      problems.push(`report names ${report.name}@${report.version}, expected ${identity.name}@${identity.version}`);
    }
    const w = wasmReport(abs, wasm);
    if (w && canonical(w) !== canonical(report)) problems.push('WebAssembly report differs from the command-line report');
  }
  return {
    kind,
    case: name,
    form,
    input,
    exit,
    valid: report?.valid ?? null,
    wasm: !fs.statSync(abs).isDirectory(),
    diagnostics: (report?.diagnostics ?? []).map(show).sort(byteOrder),
    problems,
  };
}

function packageRuns() {
  const runs = [];
  const base = path.join(ROOT, 'packages');
  for (const scope of fs.readdirSync(base).sort(byteOrder)) {
    if (!fs.statSync(path.join(base, scope)).isDirectory()) continue;
    for (const pkg of fs.readdirSync(path.join(base, scope)).sort(byteOrder)) {
      for (const version of fs.readdirSync(path.join(base, scope, pkg)).sort(byteOrder)) {
        const dir = `packages/${scope}/${pkg}/${version}`;
        const forms = [
          ['single-file', `${dir}/${pkg}.team.yaml`],
          ['team-zip', `${dir}/${pkg}.team`],
          ['folder', `${dir}/${pkg}`],
        ].filter(([, p]) => fs.existsSync(path.join(ROOT, p)));
        for (const [form, input] of forms) {
          runs.push({ kind: 'package', name: `${scope}/${pkg}@${version}`, form, input, expectValid: true, expected: [], identity: { name: `${scope}/${pkg}`, version } });
        }
      }
    }
  }
  return runs;
}

// Report `file` for an expected location: the archive or folder entry, else the
// package-relative path of the named file (a single file is reported as team.yaml).
function expectedFile(loc, inputName) {
  const input = inputName.replace(/\/$/, '');
  if (loc.entry != null) return loc.entry;
  if (loc.file === input) return 'team.yaml';
  if (loc.file?.startsWith(`${input}/`)) return loc.file.slice(input.length + 1);
  return loc.file;
}

// The public specification as plain text by section: Markdown emphasis and links removed.
function specSections() {
  const text = fs.readFileSync(path.join(ROOT, 'spec', SPEC_VERSION, 'index.md'), 'utf8')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  const sections = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    const m = /^(#{2,3}) (\d+(?:\.\d+)?)\.? /.exec(line);
    if (m) {
      current = m[2];
      // A subsection's lines also belong to its parent section.
      for (const key of [current, current.split('.')[0]]) if (!sections.has(key)) sections.set(key, []);
      continue;
    }
    if (current) {
      sections.get(current).push(line);
      if (current.includes('.')) sections.get(current.split('.')[0]).push(line);
    }
  }
  return sections;
}

// Published fixture metadata: each diagnostic cites the public specification, its quote
// appears verbatim in the cited section (and numbered rule, as in "4.2.3"), and the
// file carries no internal planning id, agent name or pending wording.
export function lintExpected(file, text, spec, sections) {
  const problems = [];
  const banned = /\bsp_[a-z0-9]{6}\b|\bpl_[a-z0-9]{6}\b|Orchestrator-relayed|\bElgar\b|\bpending\b/i;
  text.split('\n').forEach((line, i) => {
    if (banned.test(line)) problems.push(`${file}:${i + 1}: internal or pending wording: ${line.trim()}`);
  });
  for (const e of [...(spec.errors ?? []), ...(spec.warnings ?? [])]) {
    const where = `${file}: ${e.code}`;
    for (const key of ['decision', 'also', 'also_section', 'note']) if (key in e) problems.push(`${where}: unexpected key ${key}`);
    if (e.spec !== `spec/${SPEC_VERSION}`) problems.push(`${where}: spec is "${e.spec}", expected spec/${SPEC_VERSION}`);
    const parts = String(e.spec_section ?? '').split('.');
    let section = null;
    let rule = null;
    for (let n = parts.length; n > 0 && !section; n--) {
      const key = parts.slice(0, n).join('.');
      if (sections.has(key)) {
        section = sections.get(key);
        rule = parts.slice(n).join('.') || null;
      }
    }
    if (!section || (rule && !/^\d+$/.test(rule))) {
      problems.push(`${where}: spec_section "${e.spec_section}" is not a section (or section.rule) of spec/${SPEC_VERSION}`);
      continue;
    }
    // A numbered rule is its "N. " line plus the indented lines nested under it.
    let scope = section;
    if (rule) {
      const start = section.findIndex((l) => l.startsWith(`${rule}. `));
      let end = start + 1;
      while (start >= 0 && end < section.length && /^\s+\S/.test(section[end])) end += 1;
      scope = start >= 0 ? section.slice(start, end) : [];
    }
    if (typeof e.quote !== 'string' || !scope.some((l) => l.includes(e.quote))) {
      problems.push(`${where}: quote not found in spec/${SPEC_VERSION} section ${e.spec_section}: ${e.quote}`);
    }
  }
  return problems;
}

export const metadataProblems = [];

function exampleRuns() {
  const runs = [];
  const sections = specSections();
  for (const group of ['invalid', 'warnings']) {
    const base = path.join(ROOT, 'examples', group);
    for (const name of fs.readdirSync(base).sort(byteOrder)) {
      const dir = `examples/${group}/${name}`;
      const text = fs.readFileSync(path.join(ROOT, dir, 'expected.yaml'), 'utf8');
      const spec = parseYaml(text);
      metadataProblems.push(...lintExpected(`${dir}/expected.yaml`, text, spec, sections));
      if (spec.case !== name) throw new Error(`${dir}/expected.yaml: case "${spec.case}" is not the directory name`);
      const expected = [];
      for (const [list, severity] of [[spec.errors ?? [], 'error'], [spec.warnings ?? [], 'warning']]) {
        for (const e of list) {
          if (e.severity !== severity) throw new Error(`${dir}/expected.yaml: ${e.code} listed under ${severity}s has severity ${e.severity}`);
          const loc = e.location ?? {};
          const fields = { code: e.code, severity, file: expectedFile(loc, spec.input), path: loc.path ?? '' };
          if (loc.line != null) fields.line = loc.line;
          if (loc.column != null) fields.column = loc.column;
          expected.push({ fields, label: show(fields) });
        }
      }
      const expectValid = !expected.some((e) => e.fields.severity === 'error');
      if (group === 'invalid' && expectValid) throw new Error(`${dir}: an invalid case expects no error`);
      if (group === 'warnings' && !expectValid) throw new Error(`${dir}: a warning case expects an error`);
      runs.push({ kind: `example/${group}`, name, form: spec.form, input: `${dir}/${spec.input}`, expectValid, expected });
    }
  }
  return runs;
}

function corpusRuns() {
  const dir = `corpus/${SPEC_VERSION}`;
  const { cases } = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'cases.json'), 'utf8'));
  return cases.map((c) => {
    const abs = path.join(ROOT, dir, c.path);
    const form = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? 'folder' : c.path.endsWith('.team') ? 'team-zip' : 'single-file';
    const expected = (c.expect ?? []).map((e) => {
      const fields = { code: e.code, path: e.path ?? '' };
      if (e.line != null) fields.line = e.line;
      return { fields, label: `${e.code}@${fields.path}${e.line != null ? `:${e.line}` : ''}` };
    });
    return { kind: 'corpus', name: c.path, form, input: `${dir}/${c.path}`, expectValid: c.valid, expected, exact: false };
  });
}

function parseArgs(argv) {
  const opts = { validator: process.env.ATP_VALIDATE || 'atp-validate', summary: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '--validator' || a === '--summary') && argv[i + 1]) opts[a.slice(2)] = argv[++i];
    else throw new Error(`usage: node scripts/conformance.mjs [--validator <path>] [--summary <file>]`);
  }
  return opts;
}

function main() {
  let opts, cli, wasm, runs;
  try {
    opts = parseArgs(process.argv.slice(2));
    cli = resolveCli(opts.validator);
    wasm = referenceWasm();
    runs = [...packageRuns(), ...exampleRuns(), ...corpusRuns()];
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(2);
  }
  console.log(`reference validator ${VALIDATOR_VERSION}: ${cli.abs} (${cli.file}, sha256 ${cli.sha256}) and ${WASM_DIR}/atp_validate_bg.wasm`);

  let results;
  try {
    results = runs.map((r) => check({ cli: cli.abs, wasm, ...r }));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(2);
  }

  const groups = new Map();
  for (const r of results) {
    const key = `${r.kind}\t${r.form}`;
    if (!groups.has(key)) groups.set(key, { cases: new Set(), runs: 0, failed: 0 });
    const g = groups.get(key);
    g.cases.add(r.case);
    g.runs += 1;
    if (r.problems.length) g.failed += 1;
  }
  console.log('\n| Kind | Form | Cases | Runs | Failed |\n| --- | --- | --- | --- | --- |');
  for (const [key, g] of [...groups].sort(([a], [b]) => byteOrder(a, b))) {
    const [kind, form] = key.split('\t');
    console.log(`| ${kind} | ${form} | ${g.cases.size} | ${g.runs} | ${g.failed} |`);
  }
  const failed = results.filter((r) => r.problems.length);
  for (const r of failed) {
    console.log(`\nFAIL ${r.kind} ${r.input}`);
    for (const p of r.problems) console.log(`  ${p}`);
  }
  for (const p of metadataProblems) console.log(`\nFAIL metadata ${p}`);
  const wasmRuns = results.filter((r) => r.wasm).length;
  console.log(`\n${results.length} runs (${wasmRuns} also through the WebAssembly module), ${failed.length} failed; ${metadataProblems.length} fixture metadata problem(s)`);

  if (opts.summary) {
    const summary = {
      validator_version: VALIDATOR_VERSION,
      spec_version: SPEC_VERSION,
      runs: results.map(({ kind, case: c, form, input, exit, valid, diagnostics, problems }) => ({
        kind, case: c, form, input, exit, valid, diagnostics, pass: problems.length === 0,
      })),
    };
    fs.writeFileSync(opts.summary, `${JSON.stringify(summary, null, 2)}\n`);
  }
  process.exit(failed.length || metadataProblems.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
