#!/usr/bin/env node
// Keeps every published Agentic Team Protocol package version immutable.
//
//   node scripts/check-immutability.mjs --base <ref> [--head <ref>]
//
// A published version is a directory packages/<scope>/<name>/<version>/ that exists
// in --base (the pull request base, or the previous main commit on a push). Compared
// with --head (default: the working tree, including untracked files), any modified,
// deleted, type-changed or added file inside a published version fails; a change
// needs a new version directory. Adding files in a new version directory passes.
// Files outside version directories (for example packages/README.md) are not
// published versions and are not checked.
//
// Exit codes: 0 no published version changed; 1 a published version changed;
// 2 usage error or an unresolvable ref (fails closed).

import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGES = 'packages/';

const git = (args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 256 * 1024 * 1024 }).toString('utf8');
const nul = (s) => s.split('\0').filter(Boolean);
const versionDir = (file) => {
  const parts = file.split('/');
  return parts.length >= 5 && parts[0] === 'packages' ? parts.slice(0, 4).join('/') : null;
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

const opts = parseArgs(process.argv.slice(2));
const base = resolveCommit(opts.base, '--base');
const head = opts.head ? resolveCommit(opts.head, '--head') : null;

const published = new Set(
  nul(git(['ls-tree', '-r', '-z', '--name-only', '--full-tree', base, '--', PACKAGES])).map(versionDir).filter(Boolean),
);

// [status, path] pairs; statuses A, D, M, T (rename detection off).
const changes = [];
const diff = nul(git(['diff', '--name-status', '-z', '--no-renames', base, ...(head ? [head] : []), '--', PACKAGES]));
for (let i = 0; i + 1 < diff.length; i += 2) changes.push([diff[i], diff[i + 1]]);
if (!head) {
  for (const file of nul(git(['ls-files', '-z', '--others', '--exclude-standard', '--', PACKAGES]))) changes.push(['A', file]);
}

const VERB = { A: 'added to', D: 'deleted from', M: 'modified in', T: 'type changed in' };
const violations = [];
const added = new Set();
for (const [status, file] of changes) {
  const dir = versionDir(file);
  if (!dir) continue;
  if (published.has(dir)) violations.push(`${file}: ${VERB[status[0]] ?? `changed (${status}) in`} published version ${dir}`);
  else if (status === 'A') added.add(dir);
}

const target = head ? head : 'the working tree';
if (violations.length) {
  console.error(`error: published package versions are immutable (base ${base}, compared with ${target}).`);
  console.error('Publish the change as a new version directory instead.');
  for (const v of violations.sort()) console.error(`  ${v}`);
  process.exit(1);
}
console.log(
  `ok: ${published.size} published version(s) at base ${base} unchanged in ${target}` +
    (added.size ? `; new version(s): ${[...added].sort().join(', ')}` : '; no new versions'),
);
