#!/usr/bin/env node
// Compares the bytes a published Agentic Team Protocol site serves with the recorded
// checksums, as an outside consumer would see them.
//
//   node scripts/check-served.mjs <base-url>
//
// <base-url> is the site root, for example https://atp.domios.dev or, as a dry run
// before publication, a static server over _site/ (http://localhost:8080).
//
// Checks, each fetched over HTTP from <base-url>:
//  - every file PROVENANCE.md records under schema/, corpus/ and validator/ (every
//    dated JSON Schema file, the conformance corpus and the WebAssembly reference
//    validator): served SHA-256 equals the recorded SHA-256. Every schema/ file in this
//    checkout must be recorded there.
//  - catalog.json: for every entry, the .team path, the single file (when not null) and
//    every folder file: served SHA-256 equals the catalog checksum, and equals the
//    SHA-256 of the same path in this checkout (published versions never change).
//    A published version in this checkout that the served catalog lacks is a note.
// Then it prints the evidence PUBLICATION.md asks for.
//
// Node 22, no dependencies. Exit codes: 0 every served byte matches; 1 any mismatch or
// fetch failure; 2 usage error.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (args) => execFileSync('git', args, { cwd: ROOT }).toString('utf8');

// PROVENANCE.md checksums: rows "| `path` | ... | `hex` |" and, in field tables,
// "| File | `path` |" followed by "| SHA-256 | `hex` |".
function provenance() {
  const recorded = new Map();
  let file = null;
  for (const line of fs.readFileSync(path.join(ROOT, 'PROVENANCE.md'), 'utf8').split('\n')) {
    let m = /^\| File \| `([^`]+)` \|/.exec(line);
    if (m) {
      file = m[1];
      continue;
    }
    m = /^\| SHA-256 \| `([0-9a-f]{64})` \|/.exec(line);
    if (m && file) {
      recorded.set(file, m[1]);
      file = null;
      continue;
    }
    m = /^\| `((?:schema|corpus|validator)\/[^`]+)`[^|]*\|.*`([0-9a-f]{64})` \|\s*$/.exec(line);
    if (m) recorded.set(m[1], m[2]);
    if (!line.startsWith('|')) file = null;
  }
  return recorded;
}

async function fetchBytes(base, rel) {
  const url = new URL(rel.split('/').map(encodeURIComponent).join('/'), base);
  const res = await fetch(url, { redirect: 'follow', cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return { url: url.href, bytes: Buffer.from(await res.arrayBuffer()) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !/^https?:\/\//.test(args[0])) {
    console.error('usage: node scripts/check-served.mjs <base-url>');
    process.exit(2);
  }
  const base = args[0].endsWith('/') ? args[0] : `${args[0]}/`;
  const failures = [];
  const notes = [];
  let checked = 0;

  const compare = async (rel, expected, source) => {
    try {
      const { url, bytes } = await fetchBytes(base, rel);
      const actual = sha256(bytes);
      checked += 1;
      if (actual !== expected) failures.push(`${url}: served sha256 ${actual} != ${source} ${expected}`);
      return actual;
    } catch (e) {
      failures.push(e.message);
      return null;
    }
  };

  // Generated artifacts recorded in PROVENANCE.md.
  const recorded = provenance();
  for (const f of git(['ls-files', '-z', '--', 'schema/']).split('\0').filter(Boolean)) {
    if (!recorded.has(f)) failures.push(`${f}: no SHA-256 recorded in PROVENANCE.md`);
  }
  const served = new Map();
  for (const [rel, sum] of [...recorded].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    served.set(rel, await compare(rel, sum, 'PROVENANCE.md'));
  }

  // Catalog paths.
  let catalog = null;
  let catalogSum = null;
  try {
    const { bytes } = await fetchBytes(base, 'catalog.json');
    catalogSum = sha256(bytes);
    catalog = JSON.parse(bytes.toString('utf8'));
  } catch (e) {
    failures.push(`catalog.json: ${e.message}`);
  }
  const listed = new Set();
  for (const [i, e] of (catalog?.packages ?? []).entries()) {
    const where = `catalog packages[${i}] ${e.name}@${e.version}`;
    const refs = [{ path: e.path, checksum: e.checksum }, e.forms?.zip, ...(e.forms?.folder?.files ?? [])];
    if (e.forms?.single_file) refs.push(e.forms.single_file);
    if (!e.forms?.folder?.files?.length) failures.push(`${where}: no folder files listed`);
    for (const ref of refs) {
      if (typeof ref?.path !== 'string' || !/^[0-9a-f]{64}$/.test(ref.checksum ?? '') || ref.path.split('/').includes('..')) {
        failures.push(`${where}: malformed path or checksum`);
        continue;
      }
      await compare(ref.path, ref.checksum, 'catalog.json');
      const local = path.join(ROOT, ...ref.path.split('/'));
      if (!fs.existsSync(local)) failures.push(`${where}: ${ref.path} is not in this checkout`);
      else if (sha256(fs.readFileSync(local)) !== ref.checksum) failures.push(`${where}: ${ref.path} in this checkout differs from catalog.json`);
    }
    listed.add(path.posix.dirname(e.path));
  }
  const versions = new Set(
    git(['ls-files', '-z', '--', 'packages/']).split('\0').filter(Boolean)
      .map((f) => f.split('/')).filter((p) => p.length >= 5).map((p) => p.slice(0, 4).join('/')),
  );
  for (const v of [...versions].sort()) if (!listed.has(v)) notes.push(`${v} is in this checkout but not in the served catalog`);

  const schemaRel = [...recorded.keys()].filter((f) => f.startsWith('schema/')).sort().at(-1);
  console.log(`checked ${checked} served files under ${base}`);
  for (const n of notes) console.log(`note: ${n}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  console.log('\nEvidence:');
  console.log(`  spec version: ${schemaRel?.split('/')[1] ?? 'unknown'}`);
  console.log(`  validator version: ${catalog?.reference_validation?.validator_version ?? 'unknown'}`);
  console.log(`  schema URL: ${schemaRel ? new URL(schemaRel, base).href : 'unknown'}`);
  console.log(`  schema served SHA-256: ${served.get(schemaRel) ?? 'not served'}`);
  console.log(`  catalog.json served SHA-256: ${catalogSum ?? 'not served'} (source_commit ${catalog?.source_commit ?? 'unknown'}, ${catalog?.packages?.length ?? 0} entries)`);
  console.log(failures.length ? `\n${failures.length} mismatch(es)` : '\nall served bytes match the recorded checksums');
  process.exit(failures.length ? 1 : 0);
}

main();
