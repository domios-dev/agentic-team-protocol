#!/usr/bin/env node
// Packs every Agentic Team Protocol package folder into its `.team` ZIP, and
// builds the archive-only invalid fixtures, deterministically.
//
// Folder  packages/<scope>/<name>/<version>/<name>/   ->  <name>.team beside it
//
// Determinism: entries sorted by byte order of their POSIX path, files only
// (no directory entries), stored without compression, fixed DOS timestamp
// 1980-01-01 00:00:00, zero attributes, no extra fields, no comments.
// Re-running yields byte-identical archives. Node 22, no dependencies.

import { readdirSync, readFileSync, writeFileSync, lstatSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0x0000; // 00:00:00
const DOS_DATE = 0x0021; // 1980-01-01
const VERSION = 20; // 2.0, MS-DOS host
const FLAG_UTF8 = 0x0800;

const byteOrder = (a, b) => Buffer.compare(Buffer.from(a.name, 'utf8'), Buffer.from(b.name, 'utf8'));

// entries: [{ name: 'posix/path', data: Buffer }]
export function buildZip(entries) {
  const sorted = [...entries].sort(byteOrder);
  const seen = new Set();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of sorted) {
    if (seen.has(name)) throw new Error(`duplicate entry ${name}`);
    seen.add(name);
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION, 4);
    local.writeUInt16LE(FLAG_UTF8, 6);
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, nameBuf, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(VERSION, 4); // made by
    central.writeUInt16LE(VERSION, 6); // needed
    central.writeUInt16LE(FLAG_UTF8, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + data.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, cd, end]);
}

// All regular files under dir as [{ name, data }]; symlinks are refused.
export function readFolder(dir) {
  const out = [];
  const walk = (d) => {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, ent.name);
      const st = lstatSync(p);
      if (st.isSymbolicLink()) throw new Error(`symlink not allowed: ${p}`);
      if (st.isDirectory()) walk(p);
      else if (st.isFile()) out.push({ name: relative(dir, p).split(sep).join('/'), data: readFileSync(p) });
      else throw new Error(`not a regular file: ${p}`);
    }
  };
  walk(dir);
  return out.sort(byteOrder);
}

// [{ folder, zip, single }] for packages/<scope>/<name>/<version>/<name>/
export function packageForms() {
  const base = join(ROOT, 'packages');
  const dirs = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const forms = [];
  for (const scope of dirs(base))
    for (const name of dirs(join(base, scope)))
      for (const version of dirs(join(base, scope, name))) {
        const vdir = join(base, scope, name, version);
        forms.push({
          id: `${scope}/${name}@${version}`,
          folder: join(vdir, name),
          zip: join(vdir, `${name}.team`),
          single: join(vdir, `${name}.team.yaml`),
        });
      }
  return forms;
}

// Archive-only invalid fixtures: their defect cannot exist in a folder, so
// their entries are declared here. Authored content uses com.example identities.
const fixtureTeam = (files) =>
  [
    'name: com.example/archive-fixture',
    'version: 1.0.0',
    'description: Minimal package whose archive breaks exactly one rule.',
    'authors:',
    '  - name: Example Author',
    '    url: https://example.com',
    ...(files.length ? ['files:', ...files.flatMap((f) => [`  - path: ${f}`, '    description: Notes for the orchestrator'])] : []),
    'managers:',
    '  orchestrator:',
    '    instructions: |',
    '      Coordinate the team and read the notes before planning.',
    '',
  ].join('\n');

const NOTES = '# Notes\nPrimary sources first.\n';

export const ZIP_FIXTURES = [
  {
    zip: 'examples/invalid/zip-entry-dotdot/input.team',
    entries: [
      { name: 'team.yaml', text: fixtureTeam(['../shared/notes.md']) },
      { name: '../shared/notes.md', text: NOTES },
    ],
  },
  {
    zip: 'examples/invalid/zip-entry-absolute/input.team',
    entries: [
      { name: 'team.yaml', text: fixtureTeam(['/shared/notes.md']) },
      { name: '/shared/notes.md', text: NOTES },
    ],
  },
  {
    zip: 'examples/invalid/unreferenced-zip-entry/input.team',
    entries: [
      { name: 'team.yaml', text: fixtureTeam(['notes/guide.md']) },
      { name: 'notes/guide.md', text: NOTES },
      { name: 'notes/stray.md', text: '# Stray\nNot referenced by team.yaml.\n' },
    ],
  },
].map((f) => ({ zip: join(ROOT, f.zip), entries: f.entries.map((e) => ({ name: e.name, data: Buffer.from(e.text, 'utf8') })) }));

// Every archive this script owns: [{ zip, bytes }]
export function allArchives() {
  const out = [];
  for (const f of packageForms()) {
    if (!existsSync(f.folder)) throw new Error(`missing folder form for ${f.id}: ${f.folder}`);
    out.push({ zip: f.zip, bytes: buildZip(readFolder(f.folder)) });
  }
  for (const f of ZIP_FIXTURES) out.push({ zip: f.zip, bytes: buildZip(f.entries) });
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const { zip, bytes } of allArchives()) {
    mkdirSync(dirname(zip), { recursive: true });
    writeFileSync(zip, bytes);
    console.log(`packed ${relative(ROOT, zip).split(sep).join('/')} (${bytes.length} bytes)`);
  }
}
