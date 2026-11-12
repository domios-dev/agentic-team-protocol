#!/usr/bin/env node
// Checks the published Agentic Team Protocol package forms:
//  - every package version has its folder and `.team` ZIP form; the single-file
//    form is optional (a version may lack it when its package ships none), and
//    its absence is reported as a note, never skipped silently;
//  - each ZIP holds exactly the folder's files, byte for byte, with one root
//    team.yaml, safe relative paths and only entries team.yaml references
//    (lexical check: a path, or a file inside a referenced skill folder);
//  - published text files use LF line endings only;
//  - re-packing every archive (packages and archive fixtures) is byte-identical.
// This is a form check, not the reference validator (pending, Phase 2).
// Node 22, no dependencies. Exits 1 on any failure.

import { readFileSync, existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { ROOT, crc32, readFolder, packageForms, allArchives } from './pack-team.mjs';

const failures = [];
const fail = (msg) => failures.push(msg);
const rel = (p) => relative(ROOT, p).split(sep).join('/');

export function readZip(buf) {
  const eocd = buf.length - 22;
  if (eocd < 0 || buf.readUInt32LE(eocd) !== 0x06054b50) throw new Error('no end-of-central-directory record at the end (comments are not allowed)');
  const count = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  let p = buf.readUInt32LE(eocd + 16);
  if (p + cdSize !== eocd) throw new Error('central directory does not end at the end record');
  const entries = [];
  let expectedOffset = 0;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central header ${i}`);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const external = buf.readUInt32LE(p + 38);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    if (method !== 0) throw new Error(`${name}: compression method ${method}, expected stored (0)`);
    if (extraLen || commentLen || external) throw new Error(`${name}: extra field, comment or attributes present`);
    if (off !== expectedOffset) throw new Error(`${name}: entries are not contiguous`);
    if (buf.readUInt32LE(off) !== 0x04034b50) throw new Error(`${name}: bad local header`);
    const lNameLen = buf.readUInt16LE(off + 26);
    const lExtraLen = buf.readUInt16LE(off + 28);
    const start = off + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(start, start + size);
    if (crc32(data) !== crc) throw new Error(`${name}: CRC mismatch`);
    entries.push({ name, data });
    expectedOffset = start + size;
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (expectedOffset !== buf.readUInt32LE(eocd + 16)) throw new Error('bytes between entries and central directory');
  return entries;
}

const unsafe = (name) =>
  name.startsWith('/') || /^[A-Za-z]:/.test(name) || name.includes('\\') || name.split('/').some((s) => s === '..' || s === '.' || s === '') || name.endsWith('/');

// Lexical references in team.yaml: `path:`, `instructions_file:`, `icon:` values
// and `files: [a, b]` flow lists.
export function references(teamYaml) {
  const refs = new Set();
  const clean = (v) => v.replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
  for (const line of teamYaml.split('\n')) {
    const m = line.match(/^\s*(?:-\s+)?(?:path|instructions_file|icon):\s*(\S.*)$/);
    if (m) refs.add(clean(m[1]));
    const f = line.match(/^\s*files:\s*\[(.*)\]\s*(#.*)?$/);
    if (f) for (const v of f[1].split(',')) if (v.trim()) refs.add(clean(v));
  }
  return refs;
}

const isReferenced = (name, refs) => [...refs].some((r) => name === r || name.startsWith(`${r}/`));

const TEXT = /\.(ya?ml|md|csv|svg|txt|py)$/;

for (const f of packageForms()) {
  const missing = [f.folder, f.zip].filter((p) => !existsSync(p));
  for (const p of missing) fail(`${f.id}: missing ${rel(p)}`);
  if (missing.length) continue;

  // The single-file form is optional per version: a package whose document uses
  // path references (for example instructions_file) may ship without one.
  if (existsSync(f.single)) {
    const single = readFileSync(f.single);
    if (single.includes(0x0d)) fail(`${rel(f.single)}: contains CR; LF line endings only`);
  } else {
    console.log(`note ${f.id}: no single-file form (${rel(f.single)} absent); folder and ZIP checked`);
  }

  const folder = readFolder(f.folder);
  for (const e of folder) if (TEXT.test(e.name) && e.data.includes(0x0d)) fail(`${rel(f.folder)}/${e.name}: contains CR; LF line endings only`);

  let zip;
  try {
    zip = readZip(readFileSync(f.zip));
  } catch (err) {
    fail(`${rel(f.zip)}: ${err.message}`);
    continue;
  }

  const names = zip.map((e) => e.name);
  if (new Set(names).size !== names.length) fail(`${rel(f.zip)}: duplicate entries`);
  const roots = names.filter((n) => n === 'team.yaml');
  if (roots.length !== 1) fail(`${rel(f.zip)}: expected exactly one root team.yaml, found ${roots.length}`);
  for (const n of names) if (unsafe(n)) fail(`${rel(f.zip)}: unsafe entry name ${JSON.stringify(n)}`);

  const folderMap = new Map(folder.map((e) => [e.name, e.data]));
  const zipMap = new Map(zip.map((e) => [e.name, e.data]));
  for (const [n, d] of zipMap) {
    if (!folderMap.has(n)) fail(`${rel(f.zip)}: entry ${n} is not in the folder form`);
    else if (!folderMap.get(n).equals(d)) fail(`${rel(f.zip)}: entry ${n} differs from the folder file`);
  }
  for (const n of folderMap.keys()) if (!zipMap.has(n)) fail(`${rel(f.zip)}: folder file ${n} is missing from the ZIP`);

  if (zipMap.has('team.yaml')) {
    const refs = references(zipMap.get('team.yaml').toString('utf8'));
    for (const n of names) if (n !== 'team.yaml' && !isReferenced(n, refs)) fail(`${rel(f.zip)}: entry ${n} is not referenced by team.yaml`);
  }
  console.log(`ok ${f.id}: ${names.length} entries (${names.join(', ')})`);
}

for (const { zip, bytes } of allArchives()) {
  if (!existsSync(zip)) fail(`${rel(zip)}: missing; run node scripts/pack-team.mjs`);
  else if (!readFileSync(zip).equals(bytes)) fail(`${rel(zip)}: re-pack is not byte-identical; run node scripts/pack-team.mjs`);
  else console.log(`ok re-pack identical: ${rel(zip)}`);
}

if (failures.length) {
  for (const m of failures) console.error(`FAIL ${m}`);
  process.exit(1);
}
console.log('check-forms: all forms consistent');
