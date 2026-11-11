#!/usr/bin/env node
// Generates and verifies the static Agentic Team Protocol package catalog,
// _site/catalog.json. The catalog is a pure function of git: it is generated in CI
// on every build and never committed.
//
//   node scripts/build-catalog.mjs           regenerate _site/catalog.json from _site/
//   node scripts/build-catalog.mjs --verify  re-hash every catalog path in _site/ and
//                                            check the file is exactly what the
//                                            generator produces; exit 1 on any mismatch
//
// `npm run build` (scripts/build-site.mjs) calls generateCatalog() after copying
// packages/ into _site/, so a separate run is only needed for --verify.
//
// One entry per published version, packages/<scope>/<name>/<version>/ in the
// commit at HEAD. For each version:
//  - the served files under _site/packages/<scope>/<name>/<version>/ must be exactly
//    the files git has at HEAD, with identical bytes (compared by git object id),
//    so a dirty, untracked or hand-edited file fails the build (the index.html
//    listing pages build-site.mjs generates are not package files and are skipped);
//  - the version holds <name>.team (ZIP) and <name>/ (folder), optionally
//    <name>.team.yaml (single file), and nothing else; a version may lack the
//    single-file form when its package ships none;
//  - identity fields (name, version, title, description, derived_from) are parsed
//    from team.yaml (YAML 1.2, no duplicate keys, no aliases) in every form present;
//    they must agree, name must be "<scope>/<name>" and version the directory name;
//  - every checksum is the SHA-256 (lowercase hex) of the bytes served at that path.
// `path` and `checksum` name the .team ZIP, the complete package. `forms` lists
// every served file of the version; `forms.single_file` is null exactly when the
// version has no single-file form. Paths are relative to the site root (the
// directory serving catalog.json). Output is deterministic: entries and files in
// byte order of their path, fixed key order, no timestamps; the only commit-bound
// value is source_commit.
//
// This is not the reference validator, which is pending (generated from the
// Domios reference implementation in Phase 2); `reference_validation` says so.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CATALOG_FILE = 'catalog.json';
const PACKAGES = 'packages';

const byteOrder = (a, b) => Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function git(root, args) {
  return execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
}

// Git object id of bytes as a blob, in the repository's object format.
function blobId(bytes, format) {
  return crypto
    .createHash(format)
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes]))
    .digest('hex');
}

// Published versions at HEAD: Map "packages/<scope>/<name>/<version>" -> Map(fileRel -> {mode, oid}).
function gitVersions(root) {
  const out = git(root, ['ls-tree', '-r', '-z', '--full-tree', 'HEAD', '--', `${PACKAGES}/`]).toString('utf8');
  const versions = new Map();
  for (const record of out.split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    const [mode, type, oid] = record.slice(0, tab).split(' ');
    const file = record.slice(tab + 1);
    const parts = file.split('/');
    if (parts.length < 5) continue; // e.g. packages/README.md: not part of a version
    const dir = parts.slice(0, 4).join('/');
    if (!versions.has(dir)) versions.set(dir, new Map());
    versions.get(dir).set(parts.slice(4).join('/'), { mode, type, oid });
  }
  return versions;
}

// Every entry under dir as sorted POSIX paths; symbolic links are reported, never followed.
function servedFiles(dir, errors, label, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) errors.push(`${label}/${rel}: symbolic link in served output`);
    else if (entry.isDirectory()) files.push(...servedFiles(abs, errors, label, rel));
    else if (entry.isFile()) files.push(rel);
    else errors.push(`${label}/${rel}: not a regular file`);
  }
  return files.sort(byteOrder);
}

// Bytes of the single root team.yaml entry of a ZIP archive.
function zipTeamYaml(buf) {
  const min = Math.max(0, buf.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('no ZIP end-of-central-directory record');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const found = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`bad ZIP central directory header ${i}`);
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    if (name === 'team.yaml') found.push({ method, compressed, local });
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (found.length !== 1) throw new Error(`expected one root team.yaml entry, found ${found.length}`);
  const { method, compressed, local } = found[0];
  if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error('bad ZIP local header for team.yaml');
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(start, start + compressed);
  if (method === 0) return data;
  if (method === 8) return zlib.inflateRawSync(data);
  throw new Error(`team.yaml uses unsupported compression method ${method}`);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort(byteOrder).map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

// Identity fields of a team.yaml, in catalog key order.
function identity(bytes, label) {
  const doc = parseDocument(bytes.toString('utf8'), { version: '1.2', uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length) throw new Error(`${label}: YAML error: ${doc.errors[0].message.split('\n')[0]}`);
  const data = doc.toJS({ maxAliasCount: 0 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${label}: top level is not a mapping`);
  const str = (key, required) => {
    const v = data[key];
    if (v === undefined || v === null) {
      if (required) throw new Error(`${label}: required field "${key}" is missing`);
      return null;
    }
    if (typeof v !== 'string') throw new Error(`${label}: field "${key}" is not a string`);
    return v;
  };
  const derived = data.derived_from ?? null;
  if (derived !== null && (typeof derived !== 'object' || Array.isArray(derived))) {
    throw new Error(`${label}: field "derived_from" is not a mapping`);
  }
  return {
    name: str('name', true),
    version: str('version', true),
    title: str('title', false),
    description: str('description', true),
    derived_from: derived === null ? null : sortKeys(derived),
  };
}

function formatFor(root) {
  try {
    return git(root, ['rev-parse', '--show-object-format']).toString().trim() || 'sha1';
  } catch {
    return 'sha1';
  }
}

// Builds the catalog object from the served bytes in out/ and the commit at HEAD.
export function buildCatalogData({ root = ROOT, out = path.join(ROOT, '_site') } = {}) {
  const errors = [];
  const commit = git(root, ['rev-parse', 'HEAD']).toString().trim();
  const format = formatFor(root);

  const tracked = git(root, ['ls-files', '-z', '--', CATALOG_FILE, `site/${CATALOG_FILE}`]).toString('utf8');
  for (const f of tracked.split('\0').filter(Boolean)) {
    errors.push(`${f} is committed; the catalog is generated in CI and must never be committed`);
  }

  const versions = gitVersions(root);
  const entries = [];
  for (const dir of [...versions.keys()].sort(byteOrder)) {
    const [, scope, pkg, version] = dir.split('/');
    const gitFiles = versions.get(dir);
    const servedDir = path.join(out, ...dir.split('/'));
    // build-site.mjs adds an index.html listing page to every directory that has no
    // committed index.html; those generated pages are site navigation, not package bytes.
    const isListing = (rel) => path.posix.basename(rel) === 'index.html' && !gitFiles.has(rel);
    const served = servedFiles(servedDir, errors, dir).filter((rel) => !isListing(rel));
    const before = errors.length;

    for (const [rel, { mode, type }] of gitFiles) {
      if (type !== 'blob' || (mode !== '100644' && mode !== '100755')) errors.push(`${dir}/${rel}: git mode ${mode} ${type} is not a regular file`);
    }
    for (const rel of served) {
      const g = gitFiles.get(rel);
      if (!g) {
        errors.push(`${dir}/${rel}: served but not committed at HEAD`);
        continue;
      }
      const bytes = fs.readFileSync(path.join(servedDir, ...rel.split('/')));
      if (blobId(bytes, format) !== g.oid) errors.push(`${dir}/${rel}: served bytes differ from the committed bytes at HEAD`);
    }
    for (const rel of gitFiles.keys()) {
      if (!served.includes(rel)) errors.push(`${dir}/${rel}: committed at HEAD but not served in _site/`);
    }

    const single = `${pkg}.team.yaml`;
    const zip = `${pkg}.team`;
    const folder = `${pkg}/`;
    const folderFiles = served.filter((rel) => rel.startsWith(folder));
    for (const rel of served) {
      if (rel !== single && rel !== zip && !rel.startsWith(folder)) {
        errors.push(`${dir}/${rel}: not part of a package form (${single}, ${zip}, ${folder})`);
      }
    }
    for (const required of [zip, `${folder}team.yaml`]) {
      if (!served.includes(required)) errors.push(`${dir}: missing ${required}`);
    }
    if (errors.length > before) continue;
    const hasSingle = served.includes(single);

    const read = (rel) => fs.readFileSync(path.join(servedDir, ...rel.split('/')));
    let ids;
    try {
      const zipBytes = read(zip);
      let zipYaml;
      try {
        zipYaml = zipTeamYaml(zipBytes);
      } catch (e) {
        throw new Error(`${dir}/${zip}: ${e.message}`);
      }
      ids = [
        identity(zipYaml, `${dir}/${zip}!team.yaml`),
        identity(read(`${folder}team.yaml`), `${dir}/${folder}team.yaml`),
        ...(hasSingle ? [identity(read(single), `${dir}/${single}`)] : []),
      ];
    } catch (e) {
      errors.push(e.message);
      continue;
    }
    const [id] = ids;
    const canonical = JSON.stringify(id);
    if (ids.some((other) => JSON.stringify(other) !== canonical)) {
      const forms = [zip, `${folder}team.yaml`, ...(hasSingle ? [single] : [])];
      errors.push(`${dir}: identity fields differ between ${forms.join(', ')}`);
      continue;
    }
    if (id.name !== `${scope}/${pkg}`) errors.push(`${dir}: name "${id.name}" does not match the directory ${scope}/${pkg}`);
    if (id.version !== version) errors.push(`${dir}: version "${id.version}" does not match the directory ${version}`);

    const ref = (rel) => ({ path: `${dir}/${rel}`, checksum: sha256(read(rel)) });
    const zipRef = ref(zip);
    entries.push({
      name: id.name,
      version: id.version,
      title: id.title,
      description: id.description,
      derived_from: id.derived_from,
      path: zipRef.path,
      checksum: zipRef.checksum,
      forms: {
        single_file: hasSingle ? ref(single) : null,
        zip: zipRef,
        folder: { path: `${dir}/${folder}`, files: folderFiles.map(ref) },
      },
    });
  }

  if (errors.length) {
    throw new Error(`catalog: ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  }
  return {
    source_commit: commit,
    checksum_algorithm: 'sha256',
    reference_validation: 'pending: the reference validator is generated from the Domios reference implementation in Phase 2',
    packages: entries,
  };
}

export function serializeCatalog(catalog) {
  return Buffer.from(`${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

// Writes out/catalog.json and returns the catalog object.
export function generateCatalog({ root = ROOT, out = path.join(ROOT, '_site') } = {}) {
  const catalog = buildCatalogData({ root, out });
  fs.writeFileSync(path.join(out, CATALOG_FILE), serializeCatalog(catalog));
  return catalog;
}

// Re-hashes every catalog path in out/ and checks out/catalog.json is byte-identical
// to a fresh generation. Returns {failures, checked, entries}; failures is empty
// when everything matches.
export function verifyCatalog({ root = ROOT, out = path.join(ROOT, '_site') } = {}) {
  const failures = [];
  const file = path.join(out, CATALOG_FILE);
  if (!fs.existsSync(file)) return { failures: [`${CATALOG_FILE} is missing from ${out}`], checked: 0, entries: 0 };
  const bytes = fs.readFileSync(file);
  let catalog;
  try {
    catalog = JSON.parse(bytes.toString('utf8'));
  } catch (e) {
    return { failures: [`${CATALOG_FILE} is not valid JSON: ${e.message}`], checked: 0, entries: 0 };
  }
  const outAbs = path.resolve(out);

  let checked = 0;
  const check = (where, ref) => {
    const rel = ref?.path;
    if (typeof rel !== 'string' || !/^[0-9a-f]{64}$/.test(ref.checksum ?? '')) {
      failures.push(`${where}: missing path or checksum`);
      return;
    }
    const abs = path.resolve(outAbs, ...rel.split('/'));
    if (path.isAbsolute(rel) || rel.split('/').includes('..') || !abs.startsWith(outAbs + path.sep)) {
      failures.push(`${where}: path ${rel} is outside the site`);
      return;
    }
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      failures.push(`${where}: ${rel} is not served`);
      return;
    }
    const actual = sha256(fs.readFileSync(abs));
    checked += 1;
    if (actual !== ref.checksum) failures.push(`${where}: ${rel} sha256 ${actual} != catalog ${ref.checksum}`);
  };
  for (const [i, e] of (catalog.packages ?? []).entries()) {
    const where = `packages[${i}] ${e.name}@${e.version}`;
    check(where, { path: e.path, checksum: e.checksum });
    if (e.forms?.single_file === null) {
      // null is accepted only when the version really has no single file: the
      // ZIP path <dir>/<name>.team implies the single file <dir>/<name>.team.yaml.
      const single = typeof e.path === 'string' && e.path.endsWith('.team') ? `${e.path}.yaml` : null;
      const abs = single && path.resolve(outAbs, ...single.split('/'));
      if (!abs || path.isAbsolute(single) || single.split('/').includes('..') || !abs.startsWith(outAbs + path.sep)) {
        failures.push(`${where} forms.single_file: null, but the ZIP path ${e.path} does not name the single-file path`);
      } else if (fs.existsSync(abs)) {
        failures.push(`${where} forms.single_file: null, but ${single} is served`);
      }
    } else {
      check(`${where} forms.single_file`, e.forms?.single_file);
    }
    check(`${where} forms.zip`, e.forms?.zip);
    if (!e.forms?.folder?.files?.length) failures.push(`${where}: forms.folder lists no files`);
    for (const f of e.forms?.folder?.files ?? []) check(`${where} forms.folder`, f);
  }

  const versions = gitVersions(root).size;
  if ((catalog.packages ?? []).length !== versions) {
    failures.push(`catalog has ${(catalog.packages ?? []).length} entries; git has ${versions} published versions`);
  }
  try {
    if (!serializeCatalog(buildCatalogData({ root, out })).equals(bytes)) {
      failures.push(`${CATALOG_FILE} differs from a fresh generation from git and the served bytes (hand-edited or stale)`);
    }
  } catch (e) {
    failures.push(e.message);
  }
  return { failures, checked, entries: (catalog.packages ?? []).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.join(ROOT, '_site');
  const args = process.argv.slice(2);
  if (args.some((a) => a !== '--verify')) {
    console.error('usage: node scripts/build-catalog.mjs [--verify]');
    process.exit(2);
  }
  if (!fs.existsSync(out)) {
    console.error('error: _site/ does not exist; run `npm run build` first');
    process.exit(1);
  }
  if (args.includes('--verify')) {
    const result = verifyCatalog({ out });
    if (result.failures.length) {
      console.error(`error: catalog verification failed:\n  ${result.failures.join('\n  ')}`);
      process.exit(1);
    }
    console.log(`verified _site/${CATALOG_FILE}: ${result.entries} entries, ${result.checked} served files re-hashed, all checksums match; byte-identical to a fresh generation`);
  } else {
    try {
      const catalog = generateCatalog({ out });
      console.log(`wrote _site/${CATALOG_FILE}: ${catalog.packages.length} entries from ${catalog.source_commit}`);
    } catch (e) {
      console.error(`error: ${e.message}`);
      process.exit(1);
    }
  }
}
