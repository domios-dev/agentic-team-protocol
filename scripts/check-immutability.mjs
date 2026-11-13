#!/usr/bin/env node
// Keeps every published Agentic Team Protocol package version, dated JSON Schema,
// dated conformance corpus and reference validator version immutable.
//
//   node scripts/check-immutability.mjs --base <ref> [--head <ref>]
//
// A published version is a directory that exists in --base (the pull request base,
// or the previous main commit on a push) and is one of:
//   packages/<scope>/<name>/<version>/
//   schema/<YYYY-MM-DD>/     (the generated JSON Schema for that spec version)
//   corpus/<YYYY-MM-DD>/     (the generated conformance corpus for that spec version)
//   validator/<YYYY.MM.DD>/  (the generated reference validator of that version)
// Compared with --head (default: the working tree, including untracked files), any
// modified, deleted, type-changed or added file inside a published version fails; a
// change needs a new version directory. Adding files in a new version directory
// passes. Files outside version directories (for example packages/README.md or
// validator/README.md) are not published versions and are not checked.
//
// Exit codes: 0 no published version changed; 1 a published version changed;
// 2 usage error or an unresolvable ref (fails closed).

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['packages/', 'schema/', 'corpus/', 'validator/'];
const DATED = new Set(['schema', 'corpus']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DOTTED_DATE = /^\d{4}\.\d{2}\.\d{2}$/;

const git = (args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
const nul = (s) => s.split('\0').filter(Boolean);
const versionDir = (file) => {
  const parts = file.split('/');
  if (parts[0] === 'packages') return parts.length >= 5 ? parts.slice(0, 4).join('/') : null;
  if (DATED.has(parts[0])) return parts.length >= 3 && DATE.test(parts[1]) ? parts.slice(0, 2).join('/') : null;
  if (parts[0] === 'validator') return parts.length >= 3 && DOTTED_DATE.test(parts[1]) ? parts.slice(0, 2).join('/') : null;
  return null;
};

function usage(message) {
  console.error(`error: ${message}\nusage: node scripts/check-immutability.mjs --base <ref> [--head <ref>]`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key !== '--base' && key !== '--head') usage(`unknown argument ${key}`);
    const value = argv[++i];
    if (!value) usage(`${key} needs a value`);
    opts[key.slice(2)] = value;
  }
  if (!opts.base) usage('--base is required');
  return opts;
}

function resolveCommit(ref, label) {
  if (/^0+$/.test(ref)) usage(`${label} ${ref} is the all-zero object id; there is no commit to compare against`);
  try {
    return git(['rev-parse', '--verify', '--quiet', '--end-of-options', `${ref}^{commit}`]).trim();
  } catch {
    usage(`${label} ${ref} does not resolve to a commit in this clone (fetch it, e.g. checkout with fetch-depth: 0)`);
  }
}

// One-time exceptions, recorded in packages/IMMUTABILITY-EXCEPTIONS.json:
//   { "exceptions": [ { "version": "packages/<scope>/<name>/<version>",
//                       "reason": "...", "approver": "...",
//                       "added": ["<path relative to the version directory>"] } ] }
// An entry lets files of that published version be modified (status M only; adding,
// deleting or type-changing a file still fails), and only while the entry is new:
// its version is not listed in the file at --base. Once merged, the entry is in every
// later base and allows nothing. An entry with the optional "added" array instead
// allows only those exact files to be added (status A), and each listed file must
// really be added; any other change to that version, a modification included, still
// fails. A malformed file at --base or --head exits 2.
//
// Exact-file entries name any published version directory (packages/, schema/,
// corpus/ or validator/) and list every file the change touches:
//   { "directory": "<version directory>", "reason": "...", "approver": "...",
//     "added": [...], "modified": [...], "deleted": [...] }
// All six keys are required. The three arrays hold distinct relative paths; one may
// be empty, not all three, and no path appears in two of them. Each listed file must
// have exactly that change (A, M or D) and any other change to that directory fails.
// An exact-file entry applies only while new: no exact-file entry for its directory
// is in the file at --base (entries of the forms above do not count). A directory has
// at most one new entry; a new entry of each form for one directory exits 2.
const EXCEPTIONS = 'packages/IMMUTABILITY-EXCEPTIONS.json';
const VERSION_DIR = /^packages\/[^/]+\/[^/]+\/[^/]+$/;
const EXACT_DIR = /^(packages\/[^/]+\/[^/]+\/[^/]+|(schema|corpus)\/\d{4}-\d{2}-\d{2}|validator\/\d{4}\.\d{2}\.\d{2})$/;
const EXACT_LISTS = { added: 'A', modified: 'M', deleted: 'D' };
const isExact = (e) => e !== null && typeof e === 'object' && !Array.isArray(e) && 'directory' in e;

function readExceptions(ref) {
  const where = `${EXCEPTIONS} at ${ref ?? 'the working tree'}`;
  let text;
  if (ref) {
    if (!git(['ls-tree', '--name-only', ref, '--', EXCEPTIONS]).trim()) return [];
    text = git(['show', `${ref}:${EXCEPTIONS}`]);
  } else {
    const file = path.join(ROOT, EXCEPTIONS);
    if (!existsSync(file)) return [];
    text = readFileSync(file, 'utf8');
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    usage(`${where} is not valid JSON: ${e.message}`);
  }
  const keys = (o) => Object.keys(o).sort().join(',');
  const isObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);
  if (!isObject(data) || keys(data) !== 'exceptions' || !Array.isArray(data.exceptions)) {
    usage(`${where} must be an object with only an "exceptions" array`);
  }
  const seen = new Set();
  const seenExact = new Set();
  const safeFile = (f) =>
    typeof f === 'string' && !/[\\:\0]/.test(f) && f.split('/').every((p) => p !== '' && p !== '.' && p !== '..');
  for (const [i, e] of data.exceptions.entries()) {
    if (isExact(e)) {
      const lists = Object.keys(EXACT_LISTS).map((k) => e[k]);
      const all = lists.every(Array.isArray) ? lists.flat() : [];
      const ok =
        keys(e) === 'added,approver,deleted,directory,modified,reason' &&
        lists.every((l) => Array.isArray(l) && l.every(safeFile)) &&
        all.length > 0 &&
        new Set(all).size === all.length &&
        [e.directory, e.reason, e.approver].every((v) => typeof v === 'string' && v.trim() !== '') &&
        EXACT_DIR.test(e.directory);
      if (!ok) {
        usage(
          `${where}: exceptions[${i}] needs exactly non-empty "directory" (packages/<scope>/<name>/<version>, schema/<YYYY-MM-DD>, ` +
            'corpus/<YYYY-MM-DD> or validator/<YYYY.MM.DD>), "reason" and "approver", and the arrays "added", "modified" and ' +
            '"deleted" of relative file paths without "", ".", ".." segments, not all empty, no path listed twice',
        );
      }
      if (seenExact.has(e.directory)) usage(`${where}: exceptions[${i}] repeats ${e.directory}`);
      seenExact.add(e.directory);
      continue;
    }
    const ok =
      isObject(e) &&
      (keys(e) === 'approver,reason,version' ||
        (keys(e) === 'added,approver,reason,version' &&
          Array.isArray(e.added) &&
          e.added.length > 0 &&
          e.added.every(safeFile) &&
          new Set(e.added).size === e.added.length)) &&
      [e.version, e.reason, e.approver].every((v) => typeof v === 'string' && v.trim() !== '') &&
      VERSION_DIR.test(e.version) &&
      !e.version.split('/').some((p) => p === '.' || p === '..');
    if (!ok) {
      usage(
        `${where}: exceptions[${i}] needs exactly non-empty "version" (packages/<scope>/<name>/<version>), "reason" and "approver", ` +
          'and optionally "added": a non-empty array of distinct relative file paths without "", ".", ".." segments',
      );
    }
    if (seen.has(e.version)) usage(`${where}: exceptions[${i}] repeats ${e.version}`);
    seen.add(e.version);
  }
  return data.exceptions;
}

const opts = parseArgs(process.argv.slice(2));
const base = resolveCommit(opts.base, '--base');
const head = opts.head ? resolveCommit(opts.head, '--head') : null;

const published = new Set(
  nul(git(['ls-tree', '-r', '-z', '--name-only', '--full-tree', base, '--', ...ROOTS])).map(versionDir).filter(Boolean),
);

// [status, path] pairs; statuses A, D, M, T (rename detection off).
const changes = [];
const diff = nul(git(['diff', '--name-status', '-z', '--no-renames', base, ...(head ? [head] : []), '--', ...ROOTS]));
for (let i = 0; i + 1 < diff.length; i += 2) changes.push([diff[i], diff[i + 1]]);
if (!head) {
  for (const file of nul(git(['ls-files', '-z', '--others', '--exclude-standard', '--', ...ROOTS]))) changes.push(['A', file]);
}

const VERB = { A: 'added to', D: 'deleted from', M: 'modified in', T: 'type changed in' };
const violations = [];
const added = new Set();
const baseAll = readExceptions(base);
const headAll = readExceptions(head);
const baseExceptions = new Set(baseAll.filter((e) => !isExact(e)).map((e) => e.version));
const excepted = new Map(
  headAll.filter((e) => !isExact(e) && !baseExceptions.has(e.version)).map((e) => [e.version, e]),
);
// New exact-file entries: directory -> Map(relative path -> expected status).
const baseExact = new Set(baseAll.filter(isExact).map((e) => e.directory));
const exact = new Map(
  headAll
    .filter((e) => isExact(e) && !baseExact.has(e.directory))
    .map((e) => [e.directory, new Map(Object.entries(EXACT_LISTS).flatMap(([k, s]) => e[k].map((f) => [f, s])))]),
);
for (const dir of exact.keys()) {
  if (excepted.has(dir)) usage(`${EXCEPTIONS} at ${head ?? 'the working tree'}: ${dir} has two new entries`);
}
const exactMatched = new Set();
// Files a new entry's "added" array lists, as full paths; each must really be added.
const listed = new Set([...excepted.values()].flatMap((e) => (e.added ?? []).map((f) => `${e.version}/${f}`)));
const applied = new Set();
const addedListed = new Set();
for (const [status, file] of changes) {
  const dir = versionDir(file);
  if (!dir) continue;
  const expect = published.has(dir) ? exact.get(dir) : undefined;
  if (expect) {
    if (expect.get(file.slice(dir.length + 1)) === status) {
      applied.add(dir);
      exactMatched.add(file);
    } else {
      violations.push(`${file}: ${VERB[status[0]] ?? `changed (${status}) in`} published version ${dir}, not as its exact-file entry lists`);
    }
    continue;
  }
  const entry = published.has(dir) ? excepted.get(dir) : undefined;
  if (entry && !entry.added && status === 'M') applied.add(dir);
  else if (entry?.added && status === 'A' && listed.has(file)) {
    applied.add(dir);
    addedListed.add(file);
  } else if (published.has(dir)) violations.push(`${file}: ${VERB[status[0]] ?? `changed (${status}) in`} published version ${dir}`);
  else if (status === 'A') added.add(dir);
}
for (const file of listed) {
  if (!addedListed.has(file)) violations.push(`${file}: listed in "added" in ${EXCEPTIONS} but not added to a published version`);
}
const LIST_OF = Object.fromEntries(Object.entries(EXACT_LISTS).map(([k, s]) => [s, k]));
for (const [dir, expect] of exact) {
  for (const [rel, status] of expect) {
    const file = `${dir}/${rel}`;
    if (!exactMatched.has(file)) {
      violations.push(`${file}: listed in "${LIST_OF[status]}" in ${EXCEPTIONS} but not ${VERB[status]} published version ${dir}`);
    }
  }
}

const target = head ? head : 'the working tree';
if (violations.length) {
  console.error(
    `error: published package versions, dated schemas, dated corpora and validator versions are immutable (base ${base}, compared with ${target}).`,
  );
  console.error('Publish the change as a new version directory instead.');
  for (const v of violations.sort()) console.error(`  ${v}`);
  process.exit(1);
}
console.log(
  `ok: ${published.size} published version(s) at base ${base} unchanged in ${target}` +
    (added.size ? `; new version(s): ${[...added].sort().join(', ')}` : '; no new versions') +
    (applied.size ? `; except changes under a new one-time entry in ${EXCEPTIONS} for ${[...applied].sort().join(', ')}` : '') +
    (addedListed.size ? ` (added: ${[...addedListed].sort().join(', ')})` : ''),
);
