#!/usr/bin/env node
// Checks every internal link and anchor of the built Agentic Team Protocol site.
//
//   node scripts/check-links.mjs [site-dir] [--fetch-external]
//
// site-dir defaults to _site/ (run `npm run build` first). For every rendered HTML page,
// each href and src attribute is classified:
//
//   internal   a relative or root-relative URL. Its path must name a built file, or a
//              built directory with an index.html; a #fragment must name an id (or an
//              anchor name) in the target page. Paths are matched case-sensitively, as
//              GitHub Pages serves them, and may not leave the site root.
//   external   a URL with a scheme or a scheme-relative //host URL. http(s) links are
//              listed but not fetched, unless --fetch-external is given; then each
//              unique one must answer with a status below 400.
//
//   node scripts/check-links.mjs --markdown
//
// The Markdown mode checks the repository's own Markdown files that build-site does not
// render, as GitHub shows them: every tracked .md file outside site/ and spec/<date>/,
// except package and fixture content (corpus/, schema/, validator/<version>/,
// packages/<scope>/, examples/<group>/<case>/). For example README.md, PROVENANCE.md,
// examples/README.md and validator/README.md. In each, every link and image
// target is classified:
//
//   internal   a relative URL, or a root-relative one that GitHub resolves from the
//              repository root. Its path must name a tracked file or a directory that
//              holds one, and may not leave the repository. A #fragment into a .md file
//              (or the file itself) must equal the GitHub heading slug of one of its
//              headings; into another file only a line anchor (#L12, #L12-L20) is allowed.
//   external   a URL with a scheme or a scheme-relative //host URL: http(s) links are
//              listed, never fetched.
//
// The Markdown mode reads Markdown with marked, as build-site does; the site mode
// needs Node.js 22 built-ins only.
//
// Exit codes: 0 when every checked link resolves, 1 when any does not, 2 on a usage error.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const markdownMode = args.includes('--markdown');
const fetchExternal = args.includes('--fetch-external');
const positional = args.filter((a) => !a.startsWith('--'));
const unknown = args.filter((a) => a.startsWith('--') && a !== '--fetch-external' && a !== '--markdown');
if (unknown.length || positional.length > 1 || (markdownMode && (fetchExternal || positional.length))) {
  console.error('usage: node scripts/check-links.mjs [site-dir] [--fetch-external]\n       node scripts/check-links.mjs --markdown');
  process.exit(2);
}

// GitHub's heading slug (github-slugger): lowercase, drop every character that is not a
// letter, mark, number, connector punctuation, space or hyphen, then spaces to hyphens.
// For the spec's numbered headings it equals build-site's ids, for example
// "10.8 Scope: package format only" -> 108-scope-package-format-only.
function githubSlug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-');
}

// The text GitHub shows for inline tokens: markup removed, code and link text kept.
function plainText(tokens) {
  return (tokens ?? [])
    .map((t) => {
      if (t.type === 'html') return '';
      if (t.tokens) return plainText(t.tokens);
      return t.text ?? '';
    })
    .join('');
}

function checkMarkdown() {
  return import('marked').then(({ Marked }) => {
    const marked = new Marked({ gfm: true });
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
    const trackedFiles = new Set(tracked);
    const trackedDirs = new Set(['']);
    for (const f of tracked) for (let d = path.posix.dirname(f); d !== '.'; d = path.posix.dirname(d)) trackedDirs.add(d);

    const rendered = /^(site\/|spec\/\d{4}-\d{2}-\d{2}\/)/;
    const content = /^(corpus\/|schema\/|validator\/[^/]+\/|packages\/[^/]+\/|examples\/[^/]+\/[^/]+\/)/;
    const sources = tracked.filter((f) => f.endsWith('.md') && !rendered.test(f) && !content.test(f)).sort();

    const lexed = new Map();
    const lex = (rel) => {
      if (!lexed.has(rel)) lexed.set(rel, marked.lexer(fs.readFileSync(path.join(ROOT, ...rel.split('/')), 'utf8')));
      return lexed.get(rel);
    };
    const slugCache = new Map();
    const slugsOf = (rel) => {
      if (!slugCache.has(rel)) {
        const slugs = new Set();
        const used = new Map();
        marked.walkTokens(lex(rel), (t) => {
          if (t.type !== 'heading') return;
          const base = githubSlug(plainText(t.tokens));
          const n = used.get(base) ?? 0;
          used.set(base, n + 1);
          slugs.add(n ? `${base}-${n}` : base);
        });
        slugCache.set(rel, slugs);
      }
      return slugCache.get(rel);
    };

    const broken = [];
    const external = new Map();
    let internalCount = 0;
    let anchorCount = 0;
    for (const file of sources) {
      const hrefs = [];
      marked.walkTokens(lex(file), (t) => {
        if (t.type === 'link' || t.type === 'image') hrefs.push(t.href);
        else if (t.type === 'html') for (const m of t.raw.matchAll(/\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) hrefs.push(m[1] ?? m[2]);
      });
      const baseDir = path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file);
      for (const link of hrefs) {
        const href = (link ?? '').trim();
        if (href === '') {
          broken.push([file, link, 'empty URL']);
          continue;
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
          const url = href.startsWith('//') ? `https:${href}` : href;
          if (/^https?:/i.test(url) && !external.has(url)) external.set(url, file);
          continue;
        }
        internalCount += 1;
        const hashAt = href.indexOf('#');
        const decodedPath = safeDecode((hashAt === -1 ? href : href.slice(0, hashAt)).split('?')[0]);
        const fragment = hashAt === -1 ? null : safeDecode(href.slice(hashAt + 1));
        if (decodedPath === null || (hashAt !== -1 && fragment === null)) {
          broken.push([file, link, 'malformed percent-encoding']);
          continue;
        }
        let target = file;
        if (decodedPath !== '') {
          const joined = decodedPath.startsWith('/')
            ? path.posix.normalize(decodedPath.slice(1) || '.')
            : path.posix.normalize(path.posix.join(baseDir || '.', decodedPath));
          if (joined === '..' || joined.startsWith('../')) {
            broken.push([file, link, 'leaves the repository']);
            continue;
          }
          const rel = joined === '.' ? '' : joined.replace(/\/+$/, '');
          if (trackedFiles.has(rel) && !decodedPath.endsWith('/')) target = rel;
          else if (trackedDirs.has(rel)) target = null;
          else {
            broken.push([file, link, `no tracked file at ${rel || '/'}`]);
            continue;
          }
        }
        if (fragment === null || fragment === '') continue;
        anchorCount += 1;
        if (target !== null && target.endsWith('.md')) {
          if (!slugsOf(target).has(fragment)) broken.push([file, link, `no heading "${fragment}" in ${target}`]);
        } else if (target === null || !/^L\d+(-L\d+)?$/.test(fragment)) {
          broken.push([file, link, `fragment on ${target === null ? 'a directory' : `non-Markdown file ${target}`}`]);
        }
      }
    }

    console.log(`external links (${external.size} unique, not fetched):`);
    for (const [url, file] of [...external.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
      console.log(`  ${url}  (first in ${file})`);
    }
    for (const [file, link, reason] of broken) console.error(`broken: ${file}: ${link} (${reason})`);
    console.log(
      `checked ${sources.length} Markdown files (${sources.join(', ')}): ` +
        `${internalCount} internal links, ${anchorCount} anchors; ${broken.length} broken`,
    );
    process.exit(broken.length ? 1 : 0);
  });
}

if (markdownMode) await checkMarkdown();
const SITE = path.resolve(positional[0] ?? path.join(ROOT, '_site'));
if (!fs.existsSync(SITE) || !fs.statSync(SITE).isDirectory()) {
  console.error(`error: ${SITE} is not a directory; run \`npm run build\` first`);
  process.exit(2);
}

// Every file and directory of the site as POSIX paths relative to its root, so that
// lookups are exact and case-sensitive on every operating system.
const files = new Set();
const dirs = new Set(['']);
(function walk(abs, rel) {
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      dirs.add(childRel);
      walk(path.join(abs, entry.name), childRel);
    } else if (entry.isFile()) {
      files.add(childRel);
    }
  }
})(SITE, '');

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeEntities(value) {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, name) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[name.toLowerCase()] ?? match;
  });
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

const TAG = /<[a-z][a-z0-9-]*\b[^>]*>/gi;
const ATTR = /\s(href|src|id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

// Links and ids of one HTML page. Attributes are read only inside tags, so text that
// merely shows markup (escaped by the renderer) is never taken for a link.
function scanPage(html) {
  const links = [];
  const ids = new Set();
  for (const tag of html.match(TAG) ?? []) {
    const isAnchor = /^<a\b/i.test(tag);
    for (const [, attr, dq, sq] of tag.matchAll(ATTR)) {
      const value = decodeEntities(dq ?? sq ?? '');
      const name = attr.toLowerCase();
      if (name === 'href' || name === 'src') links.push(value);
      else if (name === 'id' || (name === 'name' && isAnchor)) ids.add(value);
    }
  }
  return { links, ids };
}

const idCache = new Map();
function idsOf(rel) {
  if (!idCache.has(rel)) idCache.set(rel, scanPage(fs.readFileSync(path.join(SITE, ...rel.split('/')), 'utf8')).ids);
  return idCache.get(rel);
}

// The built file a site path names, or null. A directory names its index.html.
function resolveTarget(rel) {
  if (files.has(rel)) return rel;
  const dir = rel.replace(/\/$/, '');
  if (dirs.has(dir)) {
    const index = dir ? `${dir}/index.html` : 'index.html';
    return files.has(index) ? index : null;
  }
  return null;
}

const isHtml = (rel) => /\.html?$/i.test(rel);

const broken = [];
const external = new Map(); // url -> first page that links it
let internalCount = 0;
let anchorCount = 0;

const pages = [...files].filter(isHtml).sort();
for (const page of pages) {
  const html = fs.readFileSync(path.join(SITE, ...page.split('/')), 'utf8');
  const { links, ids } = scanPage(html);
  idCache.set(page, ids);
  const baseDir = path.posix.dirname(page) === '.' ? '' : path.posix.dirname(page);

  for (const link of links) {
    const href = link.trim();
    if (href === '') {
      broken.push([page, link, 'empty URL']);
      continue;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) {
      const url = href.startsWith('//') ? `https:${href}` : href;
      if (/^https?:/i.test(url) && !external.has(url)) external.set(url, page);
      continue;
    }

    internalCount += 1;
    const hashAt = href.indexOf('#');
    const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt);
    const fragment = hashAt === -1 ? null : href.slice(hashAt + 1);
    const rawPath = beforeHash.split('?')[0];
    const decodedPath = safeDecode(rawPath);
    if (decodedPath === null) {
      broken.push([page, link, 'malformed percent-encoding']);
      continue;
    }

    let target = page;
    if (decodedPath !== '') {
      const joined = decodedPath.startsWith('/')
        ? path.posix.normalize(decodedPath.slice(1) || '.')
        : path.posix.normalize(path.posix.join(baseDir || '.', decodedPath));
      if (joined === '..' || joined.startsWith('../')) {
        broken.push([page, link, 'leaves the site root']);
        continue;
      }
      const rel = joined === '.' || joined === './' ? '' : joined.replace(/\/+$/, '');
      const wantsDir = decodedPath.endsWith('/');
      target = resolveTarget(wantsDir && rel ? `${rel}/` : rel);
      if (target === null) {
        broken.push([page, link, `no built file at ${rel || '/'}`]);
        continue;
      }
    }

    if (fragment === null || fragment === '') continue;
    anchorCount += 1;
    const id = safeDecode(fragment);
    if (id === null) {
      broken.push([page, link, 'malformed percent-encoding in fragment']);
    } else if (!isHtml(target)) {
      broken.push([page, link, `fragment on non-HTML file ${target}`]);
    } else if (!idsOf(target).has(id)) {
      broken.push([page, link, `no id "${id}" in ${target}`]);
    }
  }
}

const externalBroken = [];
if (fetchExternal) {
  for (const url of [...external.keys()].sort()) {
    try {
      let response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (response.status === 405 || response.status === 403) {
        response = await fetch(url, { method: 'GET', redirect: 'follow' });
      }
      if (response.status >= 400) externalBroken.push([url, `HTTP ${response.status}`]);
    } catch (e) {
      externalBroken.push([url, e.cause?.code ?? e.message]);
    }
  }
}

console.log(`external links (${external.size} unique, ${fetchExternal ? 'fetched' : 'not fetched'}):`);
for (const [url, page] of [...external.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
  console.log(`  ${url}  (first on ${page})`);
}
for (const [page, link, reason] of broken) console.error(`broken: ${page}: ${link} (${reason})`);
for (const [url, reason] of externalBroken) console.error(`broken external: ${url} (${reason})`);
console.log(
  `checked ${pages.length} pages: ${internalCount} internal links, ${anchorCount} anchors; ` +
    `${broken.length} broken` +
    (fetchExternal ? `; ${externalBroken.length} broken external` : ''),
);
process.exit(broken.length || externalBroken.length ? 1 : 0);
