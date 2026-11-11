#!/usr/bin/env node
// Builds the static Agentic Team Protocol site into _site/.
//
//   site/**                 Markdown pages rendered with site/templates/layout.html;
//                           other files (styles, images) copied as-is.
//   spec/<YYYY-MM-DD>/**    every dated version rendered at its own URL; the newest
//                           date is "current" (spec/current/ points at it).
//   packages/**, examples/** copied byte-for-byte, plus a generated index.html
//                           listing for every directory.
//   catalog.json            generated from the served packages/ bytes and the commit
//                           at HEAD by scripts/build-catalog.mjs (never committed),
//                           plus the catalog/ page rendered from it.
//   LICENSE                 copied byte-for-byte to LICENSE.txt.
//
// Absent or empty spec/, packages/ and examples/ are valid inputs. The output is
// deterministic (sorted entries, no timestamps) and static only: the build refuses
// to emit a rendered page containing a script, form or input element.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { generateCatalog } from './build-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const SITE_DIR = path.join(ROOT, 'site');
const TEMPLATE_DIR = path.join(SITE_DIR, 'templates');
const DATE_DIR = /^\d{4}-\d{2}-\d{2}$/;
const FORBIDDEN_ELEMENT = /<\s*(script|form|input|textarea|button|iframe)\b/i;

const layout = fs.readFileSync(path.join(TEMPLATE_DIR, 'layout.html'), 'utf8');
const renderedPages = [];
const warnings = [];

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hrefFor(relPath) {
  return relPath.split('/').map(encodeURIComponent).join('/');
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function sortedEntries(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => byName(a.name, b.name));
}

// Every regular file under dir as a sorted list of POSIX paths relative to dir.
// Symbolic links are never followed or published.
function walkFiles(dir, prefix = '') {
  const files = [];
  for (const entry of sortedEntries(dir)) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      warnings.push(`skipped symbolic link ${toPosix(path.relative(ROOT, abs))}`);
    } else if (entry.isDirectory()) {
      files.push(...walkFiles(abs, rel));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files;
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function copyExact(from, to) {
  ensureDir(to);
  fs.copyFileSync(from, to);
}

// --- Markdown -------------------------------------------------------------

function slugify(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function isRelativeMarkdownLink(href) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('/') && !href.startsWith('#') && /\.md(#.*)?$/i.test(href);
}

function renderMarkdown(source) {
  const used = new Map();
  let title = null;
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link' && isRelativeMarkdownLink(token.href)) {
        token.href = token.href.replace(/\.md(#.*)?$/i, '.html$1');
      }
    },
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1 && title === null) title = inner.replace(/<[^>]*>/g, '');
        const base = slugify(inner);
        const count = used.get(base) ?? 0;
        used.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count}`;
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
    },
  });
  const html = marked.parse(source);
  return { html, title };
}

// --- Pages ----------------------------------------------------------------

// outRel: output path relative to _site/, POSIX separators.
function writePage(outRel, { title, body, notice = '' }) {
  const depth = outRel.split('/').length - 1;
  const root = depth === 0 ? './' : '../'.repeat(depth);
  const pageTitle = title === 'Agentic Team Protocol' ? title : `${title} | Agentic Team Protocol`;
  const values = {
    title: escapeHtml(pageTitle),
    root,
    notice: notice ? `<p class="notice">${notice.replaceAll('{{root}}', root)}</p>` : '',
    content: body,
  };
  const html = layout.replace(/\{\{(title|root|notice|content)\}\}/g, (_, key) => values[key]);
  const target = path.join(OUT, ...outRel.split('/'));
  ensureDir(target);
  fs.writeFileSync(target, html);
  renderedPages.push(outRel);
}

function fallbackTitle(relPath) {
  return path.posix.basename(relPath, '.md');
}

// --- site/ ----------------------------------------------------------------

function buildSitePages() {
  for (const rel of walkFiles(SITE_DIR)) {
    if (rel.startsWith('templates/')) continue;
    const abs = path.join(SITE_DIR, ...rel.split('/'));
    if (rel.endsWith('.md')) {
      const { html, title } = renderMarkdown(fs.readFileSync(abs, 'utf8'));
      writePage(rel.replace(/\.md$/, '.html'), { title: title ?? fallbackTitle(rel), body: html });
    } else {
      copyExact(abs, path.join(OUT, ...rel.split('/')));
    }
  }
}

// --- spec/ ----------------------------------------------------------------

function buildSpec() {
  const specDir = path.join(ROOT, 'spec');
  const dates = [];
  for (const entry of sortedEntries(specDir)) {
    if (entry.isDirectory() && DATE_DIR.test(entry.name)) dates.push(entry.name);
    else warnings.push(`ignored spec/${entry.name}: not a spec/<YYYY-MM-DD>/ directory`);
  }
  const current = dates.at(-1) ?? null;

  for (const date of dates) {
    const dateDir = path.join(specDir, date);
    const pages = [];
    const notice = date === current
      ? `Current dated version: ${date}.`
      : `Earlier dated version ${date}, kept unchanged. The current version is <a href="{{root}}spec/${current}/">${current}</a>.`;
    for (const rel of walkFiles(dateDir)) {
      const abs = path.join(dateDir, ...rel.split('/'));
      if (rel.endsWith('.md')) {
        const { html, title } = renderMarkdown(fs.readFileSync(abs, 'utf8'));
        const outRel = rel.replace(/\.md$/, '.html');
        const pageTitle = title ?? fallbackTitle(rel);
        pages.push({ outRel, title: pageTitle });
        writePage(`spec/${date}/${outRel}`, { title: pageTitle, body: html, notice });
      } else {
        copyExact(abs, path.join(OUT, 'spec', date, ...rel.split('/')));
      }
    }
    if (!pages.some((p) => p.outRel === 'index.html')) {
      const items = pages
        .map((p) => `<li><a href="${hrefFor(p.outRel)}">${escapeHtml(p.title)}</a></li>`)
        .join('\n');
      writePage(`spec/${date}/index.html`, {
        title: `Specification ${date}`,
        notice,
        body: `<h1>Specification ${date}</h1>\n${items ? `<ul>\n${items}\n</ul>` : '<p>This dated version has no pages.</p>'}`,
      });
    }
  }

  const versions = [...dates]
    .reverse()
    .map((date) => `<li><a href="${date}/">${date}</a>${date === current ? ' <strong>(current)</strong>' : ''}</li>`)
    .join('\n');
  writePage('spec/index.html', {
    title: 'Specification',
    body: [
      '<h1>Specification</h1>',
      '<p>The Agentic Team Protocol specification is versioned by date. Each dated version keeps its own URL; the newest date is the current version.</p>',
      versions ? `<ul>\n${versions}\n</ul>` : '<p>No dated version of the specification is in this build yet.</p>',
    ].join('\n'),
  });

  if (current) {
    writePage('spec/current/index.html', {
      title: `Specification (current: ${current})`,
      body: `<h1>Current specification</h1>\n<p>The current dated version is <a href="../${current}/">${current}</a>.</p>`,
    });
  }
  return { dates, current };
}

// --- packages/ and examples/ ----------------------------------------------

function formatSize(bytes) {
  return bytes === 1 ? '1 byte' : `${bytes} bytes`;
}

function buildCollection(name, intro) {
  const srcRoot = path.join(ROOT, name);
  let copied = 0;

  function visit(rel) {
    const absDir = rel ? path.join(srcRoot, ...rel.split('/')) : srcRoot;
    const dirs = [];
    const files = [];
    for (const entry of sortedEntries(absDir)) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const abs = path.join(absDir, entry.name);
      if (entry.isSymbolicLink()) {
        warnings.push(`skipped symbolic link ${name}/${childRel}`);
      } else if (entry.isDirectory()) {
        dirs.push(entry.name);
        visit(childRel);
      } else if (entry.isFile()) {
        copyExact(abs, path.join(OUT, name, ...childRel.split('/')));
        files.push({ name: entry.name, size: fs.statSync(abs).size });
        copied += 1;
      }
    }

    const outDir = rel ? `${name}/${rel}` : name;
    if (files.some((f) => f.name === 'index.html')) {
      warnings.push(`${outDir}/index.html is a published file; no listing generated for that directory`);
      return;
    }
    const heading = rel ? `${name}/${rel}/` : `${name}/`;
    const rows = [
      ...(rel ? ['<li><a href="../">../</a></li>'] : []),
      ...dirs.map((d) => `<li><a href="${hrefFor(d)}/">${escapeHtml(d)}/</a></li>`),
      ...files.map((f) => `<li><a href="${hrefFor(f.name)}">${escapeHtml(f.name)}</a> <span class="size">${formatSize(f.size)}</span></li>`),
    ];
    const empty = dirs.length === 0 && files.length === 0;
    writePage(`${outDir}/index.html`, {
      title: heading,
      body: [
        `<h1>${escapeHtml(heading)}</h1>`,
        rel ? '' : intro,
        empty ? '<p>Nothing is published here yet.</p>' : '',
        rows.length ? `<ul class="listing">\n${rows.join('\n')}\n</ul>` : '',
      ].filter(Boolean).join('\n'),
    });
  }

  visit('');
  return copied;
}

// --- catalog and license --------------------------------------------------

// Generates _site/catalog.json from the served package bytes and the commit at HEAD
// (scripts/build-catalog.mjs) and renders the catalog page from it.
function buildCatalog() {
  let catalog;
  try {
    catalog = generateCatalog({ root: ROOT, out: OUT });
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
  const link = (rel, text) => `<a href="../${hrefFor(rel)}">${escapeHtml(text)}</a>`;
  const short = (sum) => `<code title="${sum}">${sum.slice(0, 12)}…</code>`;
  const rows = catalog.packages.map((e) => {
    const derived = e.derived_from
      ? escapeHtml([e.derived_from.name, e.derived_from.version].filter(Boolean).join(' '))
      : '—';
    const forms = [
      `${link(e.forms.zip.path, '.team')} ${short(e.forms.zip.checksum)}`,
      e.forms.single_file
        ? `${link(e.forms.single_file.path, '.team.yaml')} ${short(e.forms.single_file.checksum)}`
        : 'no single-file form',
      `${link(e.forms.folder.path, 'folder')} (${e.forms.folder.files.length} files)`,
    ].join('<br>');
    return [
      '<tr>',
      `<td><code>${escapeHtml(e.name)}</code></td>`,
      `<td>${escapeHtml(e.version)}</td>`,
      `<td><strong>${escapeHtml(e.title ?? e.name)}</strong><br>${escapeHtml(e.description)}</td>`,
      `<td>${derived}</td>`,
      `<td>${forms}</td>`,
      '</tr>',
    ].join('');
  });
  writePage('catalog/index.html', {
    title: 'Catalog',
    notice: 'Validation by the reference validator is pending (Phase 2): the validator is generated from the Domios reference implementation. Entries are listed, not yet validated.',
    body: [
      '<h1>Catalog</h1>',
      '<p>The Agentic Team Protocol catalog is a static, read-only JSON file, <a href="../catalog.json">catalog.json</a>, generated from this repository in CI on every build and never committed. It has one entry per published package version with its identity fields parsed from <code>team.yaml</code>, and a SHA-256 checksum of the exact bytes this site serves for every file of every form. A published version never changes; a change is a new version. There is no write, upload or authentication endpoint.</p>',
      `<p>Source commit: <code>${escapeHtml(catalog.source_commit)}</code>. Full checksums are in catalog.json.</p>`,
      rows.length
        ? `<table class="catalog">\n<thead><tr><th>Name</th><th>Version</th><th>Package</th><th>Derived from</th><th>Forms (SHA-256)</th></tr></thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`
        : '<p>No package version is published yet.</p>',
    ].join('\n'),
  });
  return catalog.packages.length;
}

// --- main -----------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

buildSitePages();
const spec = buildSpec();
const packageFiles = buildCollection(
  'packages',
  '<p>Published Agentic Team Protocol packages, laid out as <code>packages/&lt;scope&gt;/&lt;name&gt;/&lt;version&gt;/</code>. Files are served exactly as committed. A published version never changes.</p>',
);
const exampleFiles = buildCollection(
  'examples',
  '<p>Example inputs for the Agentic Team Protocol, including invalid packages with their expected errors. Files are served exactly as committed.</p>',
);
const catalog = buildCatalog();
copyExact(path.join(ROOT, 'LICENSE'), path.join(OUT, 'LICENSE.txt'));

const unsafe = renderedPages.filter((rel) => FORBIDDEN_ELEMENT.test(fs.readFileSync(path.join(OUT, ...rel.split('/')), 'utf8')));
if (unsafe.length) {
  console.error(`error: the site must be static; script/form/input elements found in: ${unsafe.join(', ')}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('error: site/index.md did not produce _site/index.html');
  process.exit(1);
}

for (const w of warnings) console.warn(`warning: ${w}`);
console.log(
  `built _site/: ${renderedPages.length} pages; spec versions: ${spec.dates.length}` +
    `${spec.current ? ` (current ${spec.current})` : ''}; packages files: ${packageFiles}; ` +
    `examples files: ${exampleFiles}; catalog.json: ${catalog} entries`,
);
