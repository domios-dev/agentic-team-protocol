#!/usr/bin/env node
// Checks the published Agentic Team Protocol package forms:
//  - every package version has its folder and `.team` ZIP form; the single-file
//    form is optional (a version may lack it when its package ships none), and
//    its absence is reported as a note, never skipped silently;
//  - each ZIP holds exactly the folder's files, byte for byte, with one root
//    team.yaml, safe relative paths and only entries team.yaml references
//    (lexical check: a path, or a file inside a referenced skill folder);
//  - published text files use LF line endings only;
//  - each ZIP matches the container profile of its one writer: versions listed in
//    PACK_TEAM_VERSIONS (scripts/pack-team.mjs) the pack-team profile, and
//    re-packing them and the archive fixtures is byte-identical; every other
//    version the Domios exporter profile (`team export --format team`), whose
//    bytes are published as-is and never re-packed.
// This is a form check; scripts/conformance.mjs runs the reference validator.
// Node 22, no dependencies. Exits 1 on any failure.

import { readFileSync, existsSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { ROOT, crc32, readFolder, packageForms, allArchives } from './pack-team.mjs';

const failures = [];
const fail = (msg) => failures.push(msg);
const rel = (p) => relative(ROOT, p).split(sep).join('/');

// The exact header values each writer emits for every entry. Both store files
// only, uncompressed, at DOS time 1980-01-01 00:00:00 (time 0x0000, date 0x0021),
// with no extra fields or comments, on one disk.
export const PROFILES = Object.freeze({
  // scripts/pack-team.mjs: made-by and needed 2.0 (MS-DOS host), UTF-8 name flag,
  // zero attributes; entries in byte order of their path.
  'pack-team': { madeBy: 20, needed: 20, flags: 0x0800, external: 0, teamYamlFirst: false },
  // Domios exporter: made-by 0x030A (Unix host, 1.0), needed 1.0, no flags,
  // external attributes 0100644 (regular file, rw-r--r--) in the high 16 bits;
  // team.yaml first, then the other entries in byte order of their path.
  exporter: { madeBy: 0x030a, needed: 10, flags: 0, external: 0o100644 * 0x10000, teamYamlFirst: true },
});

const DOS_TIME = 0x0000;
const DOS_DATE = 0x0021;
const hex = (n, w = 4) => `0x${n.toString(16).padStart(w, '0')}`;

// Reads a stored ZIP whose every header field matches `profile` exactly; throws
// on the first deviation. Entry order is checked by checkOrder().
export function readZip(buf, profile) {
  const eocd = buf.length - 22;
  if (eocd < 0 || buf.readUInt32LE(eocd) !== 0x06054b50) throw new Error('no end-of-central-directory record at the end (comments are not allowed)');
  if (buf.readUInt16LE(eocd + 4) || buf.readUInt16LE(eocd + 6)) throw new Error('multi-disk archive');
  if (buf.readUInt16LE(eocd + 20)) throw new Error('archive comment present');
  const count = buf.readUInt16LE(eocd + 10);
  if (buf.readUInt16LE(eocd + 8) !== count) throw new Error('entry counts in the end record disagree');
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  let p = cdOffset;
  if (p + cdSize !== eocd) throw new Error('central directory does not end at the end record');
  const entries = [];
  let expectedOffset = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > eocd || buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad central header ${i}`);
    const madeBy = buf.readUInt16LE(p + 4);
    const needed = buf.readUInt16LE(p + 6);
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const time = buf.readUInt16LE(p + 12);
    const date = buf.readUInt16LE(p + 14);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const disk = buf.readUInt16LE(p + 34);
    const internal = buf.readUInt16LE(p + 36);
    const external = buf.readUInt32LE(p + 38);
    const off = buf.readUInt32LE(p + 42);
    const nameBuf = buf.subarray(p + 46, p + 46 + nameLen);
    const name = nameBuf.toString('utf8');
    if (method !== 0) throw new Error(`${name}: compression method ${method}, expected stored (0)`);
    if (extraLen || commentLen) throw new Error(`${name}: extra field or comment present`);
    if (madeBy !== profile.madeBy) throw new Error(`${name}: version made by ${hex(madeBy)}, expected ${hex(profile.madeBy)}`);
    if (needed !== profile.needed) throw new Error(`${name}: version needed ${needed}, expected ${profile.needed}`);
    if (flags !== profile.flags) throw new Error(`${name}: flags ${hex(flags)}, expected ${hex(profile.flags)}`);
    if (external !== profile.external || internal || disk) throw new Error(`${name}: attributes ${hex(external, 8)}/${hex(internal)}, expected ${hex(profile.external, 8)}/0x0000`);
    if (time !== DOS_TIME || date !== DOS_DATE) throw new Error(`${name}: DOS time ${hex(date)} ${hex(time)}, expected 1980-01-01 00:00:00`);
    if (csize !== size) throw new Error(`${name}: compressed and uncompressed sizes differ`);
    if (off !== expectedOffset) throw new Error(`${name}: entries are not contiguous`);
    if (buf.readUInt32LE(off) !== 0x04034b50) throw new Error(`${name}: bad local header`);
    const lNameLen = buf.readUInt16LE(off + 26);
    const lExtraLen = buf.readUInt16LE(off + 28);
    if (lExtraLen) throw new Error(`${name}: extra field present in the local header`);
    if (!buf.subarray(off + 30, off + 30 + lNameLen).equals(nameBuf)) throw new Error(`${name}: local header name differs from the central directory`);
    const same = [[4, needed], [6, flags], [8, method], [10, time], [12, date]].every(([o, v]) => buf.readUInt16LE(off + o) === v) &&
      [[14, crc], [18, csize], [22, size]].every(([o, v]) => buf.readUInt32LE(off + o) === v);
    if (!same) throw new Error(`${name}: local header differs from the central directory`);
    const start = off + 30 + lNameLen;
    if (start + size > cdOffset) throw new Error(`${name}: data overruns the central directory`);
    const data = buf.subarray(start, start + size);
    if (crc32(data) !== crc) throw new Error(`${name}: CRC mismatch`);
    entries.push({ name, data });
    expectedOffset = start + size;
    p += 46 + nameLen;
  }
  if (p !== eocd) throw new Error('central directory size does not match its entries');
  if (expectedOffset !== cdOffset) throw new Error('bytes between entries and central directory');
  return entries;
}

// Entry order of `profile`: byte order of the path, after team.yaml when the
// profile puts it first. Returns what is out of order, or null.
export function checkOrder(names, profile) {
  if (profile.teamYamlFirst && names[0] !== 'team.yaml') return 'team.yaml is not the first entry';
  const rest = profile.teamYamlFirst ? names.slice(1) : names;
  for (let i = 1; i < rest.length; i++)
    if (Buffer.compare(Buffer.from(rest[i - 1], 'utf8'), Buffer.from(rest[i], 'utf8')) >= 0) return `entry ${rest[i]} is not in byte order after ${rest[i - 1]}`;
  return null;
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

  // The writer is fixed per version: pack-team for the listed legacy versions
  // (re-packed below), the Domios exporter for every other version.
  const profileName = f.packTeam ? 'pack-team' : 'exporter';
  const profile = PROFILES[profileName];
  let zip;
  try {
    zip = readZip(readFileSync(f.zip), profile);
  } catch (err) {
    fail(`${rel(f.zip)}: ${profileName} container profile: ${err.message}`);
    continue;
  }

  const names = zip.map((e) => e.name);
  const outOfOrder = checkOrder(names, profile);
  if (outOfOrder !== null) fail(`${rel(f.zip)}: ${profileName} container profile: ${outOfOrder}`);
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
  if (!f.packTeam && outOfOrder === null) console.log(`ok exporter container profile, not re-packed: ${rel(f.zip)}`);
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
