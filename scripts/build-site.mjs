#!/usr/bin/env node
// Builds the static Agentic Team Protocol site into _site/.
//
//   site/**                 Markdown pages rendered with site/templates/layout.html;
//                           other files (styles, images) copied as-is.
//   spec/<YYYY-MM-DD>/**    every dated version rendered at its own URL; the newest
//                           date is "current" (spec/current/ points at it).
//   packages/**, examples/** copied byte-for-byte, plus a generated index.html
//                           listing for every directory.
//   schema/**, corpus/**,   generated Domios artifacts (PROVENANCE.md), copied
//   validator/**            byte-for-byte with listings, each only when it exists.
//   catalog.json            generated from the served packages/ bytes and the commit
//                           at HEAD by scripts/build-catalog.mjs (never committed),
//                           plus the catalog/ page rendered from it.
//   LICENSE                 copied byte-for-byte to LICENSE.txt.
//
// Every page gets the same documentation layout: a left navigation of pages, a section
// list for pages with at least three h2 sections (on the right from 1200px, nested
// under the page's own navigation item below that), and an anchor link on every h2
// to h4. Navigation never changes an
// output path or a copied byte.
//
//   search-index.json       the h1 to h3 sections of every rendered page as plain text,
//                           read by site/assets/search.js (self-hosted, same origin).
//
// Absent or empty spec/, packages/ and examples/ are valid inputs. The output is
// deterministic (sorted entries, no timestamps) and static apart from site search:
// the build refuses a rendered page with any script, form, input, textarea, button
// or iframe element other than the layout's one search script and one search field.

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
// Elements a static page must not carry, with one exact allowlist: the layout's
// search script tag (one per page, at that page's root) and its one search field in
// the header. Anything else, and any of these elements in page content, fails the build.
const FORBIDDEN_ELEMENT = /<\s*(script|form|input|textarea|button|iframe)\b/i;
const FORBIDDEN_TAGS = /<\s*(script|form|input|textarea|button|iframe)\b[^>]*>/gi;
const searchScript = (root) => `<script src="${root}assets/search.js" defer></script>`;

const layout = fs.readFileSync(path.join(TEMPLATE_DIR, 'layout.html'), 'utf8');
const SEARCH_INPUT = checkLayoutAllowlist(layout);
const renderedPages = [];
const unsafeContent = [];
const searchPages = [];
const warnings = [];

// The layout must hold exactly the allowed elements: the search script in the head and
// one <input type="search"> inside the header. Returns that input tag.
function checkLayoutAllowlist(template) {
  const tags = [...template.matchAll(FORBIDDEN_TAGS)].map((m) => m[0]);
  const inputs = tags.filter((t) => /^<input\b/i.test(t));
  const header = template.match(/<header\b[\s\S]*?<\/header>/i)?.[0] ?? '';
  const ok = tags.length === 2
    && template.split(searchScript('{{root}}')).length === 2
    && tags.includes(searchScript('{{root}}').replace('</script>', ''))
    && inputs.length === 1
    && /^<input type="search"[\s>]/.test(inputs[0])
    && header.includes(inputs[0]);
  if (!ok) {
    console.error('error: site/templates/layout.html must hold exactly the search script and one <input type="search"> in the header');
    process.exit(1);
  }
  return inputs[0];
}

// A rendered page passes when its only script/form/input/textarea/button/iframe
// elements are the layout's search script (for its own root) and search field.
function pageIsAllowed(html, root) {
  const tags = [...html.matchAll(FORBIDDEN_TAGS)].map((m) => m[0]);
  const script = searchScript(root);
  return tags.length === 2
    && tags.filter((t) => t === SEARCH_INPUT).length === 1
    && tags.filter((t) => t === script.replace('</script>', '')).length === 1
    && html.split(script).length === 2;
}

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
    .replace(/\./g, '') // GitHub-compatible: "10.1 Role names and kinds" -> 101-role-names-and-kinds
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function isRelativeMarkdownLink(href) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('/') && !href.startsWith('#') && /\.md(#.*)?$/i.test(href);
}

const linkedNames = new Map();

// The page name a relative .md link shows on the rendered page when its visible text is
// exactly the target's file name: [host-behaviour.md](host-behaviour.md) reads
// "Host behaviour". Any other link text, or a target without an h1, keeps its text.
// fromRel is the source file relative to the repository root. The Markdown source is
// never changed; this applies to the rendered HTML only.
function linkedPageName(fromRel, { href, text }) {
  let file;
  try {
    file = decodeURIComponent(href.split('#')[0]);
  } catch {
    return null;
  }
  if (text !== path.posix.basename(file)) return null;
  const targetRel = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), file));
  if (!linkedNames.has(targetRel)) {
    const abs = path.join(ROOT, ...targetRel.split('/'));
    let name = null;
    if (!targetRel.startsWith('../') && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const { title } = renderMarkdown(fs.readFileSync(abs, 'utf8'));
      const outRel = (targetRel.startsWith('site/') ? targetRel.slice('site/'.length) : targetRel).replace(/\.md$/i, '.html');
      if (title) name = pageName(outRel, title);
    }
    linkedNames.set(targetRel, name);
  }
  return linkedNames.get(targetRel);
}

// Renders Markdown to HTML. Every heading gets a stable id; h2 to h4 also get a
// visible anchor link to themselves. Returns the first h1 as the title and the
// h2/h3 headings for the navigation and the on-page section list. With fromRel (the
// source path relative to the repository root), a relative .md link whose text is
// its target's file name shows the target's page name instead (linkedPageName).
function renderMarkdown(source, fromRel = null) {
  const used = new Map();
  const headings = [];
  let title = null;
  const marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link' && isRelativeMarkdownLink(token.href)) {
        const name = fromRel ? linkedPageName(fromRel, token) : null;
        if (name) {
          token.text = name;
          token.tokens = [{ type: 'text', raw: name, text: name, escaped: false }];
        }
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
        const text = inner.replace(/<[^>]*>/g, '');
        if (depth === 2 || depth === 3) headings.push({ depth, id, text });
        const anchor = depth >= 2 && depth <= 4
          ? `<a class="heading-anchor" href="#${id}" aria-label="Link to this section: ${text.replace(/"/g, '&quot;')}">#</a>`
          : '';
        return `<h${depth} id="${id}">${inner}${anchor}</h${depth}>\n`;
      },
    },
  });
  const html = marked.parse(source);
  return { html, title, headings };
}

// --- Navigation -----------------------------------------------------------

const REPOSITORY_URL = 'https://github.com/domios-dev/agentic-team-protocol';

// "Agentic Team Protocol: host behaviour (non-normative), version 2026-11-11"
// -> "Host behaviour (non-normative)" for the navigation.
function shortSpecTitle(title) {
  const short = title.replace(/^Agentic Team Protocol:\s*/, '').replace(/,\s*version\s+\d{4}-\d{2}-\d{2}\s*$/, '');
  return short.charAt(0).toUpperCase() + short.slice(1);
}

// The short name of a rendered page, shown under search results and as the text of a
// link written as a bare file name. A dated specification page titled "Agentic Team
// Protocol: package format, version 2026-11-11" is "Package format 2026-11-11" for the
// version's index and "Host behaviour" for a companion page; any other page keeps its
// title.
function pageName(outRel, title) {
  const m = outRel.match(/^spec\/(\d{4}-\d{2}-\d{2})\/(.+)$/);
  if (!m || !/^Agentic Team Protocol:/.test(title)) return title;
  const short = shortSpecTitle(title).replace(/\s*\([^)]*\)\s*$/, '');
  return m[2] === 'index.html' ? `${short} ${m[1]}` : short;
}

// The left navigation, planned once before any page is written. Items name their
// target as an output path relative to _site/ ("dir/" for a directory index) or an
// absolute URL. It lists pages only; a page's own sections are added per page.
function planNavigation() {
  const specDir = path.join(ROOT, 'spec');
  const dates = sortedEntries(specDir).filter((e) => e.isDirectory() && DATE_DIR.test(e.name)).map((e) => e.name);
  const current = dates.at(-1) ?? null;
  const specItems = [{ label: 'All versions', target: 'spec/' }];
  if (current) {
    const dateDir = path.join(specDir, current);
    const pages = sortedEntries(dateDir).filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name);
    // index.md first, then the companion pages in name order.
    pages.sort((a, b) => (a === 'index.md' ? -1 : b === 'index.md' ? 1 : byName(a, b)));
    for (const rel of pages) {
      const { title } = renderMarkdown(fs.readFileSync(path.join(dateDir, ...rel.split('/')), 'utf8'));
      const outRel = rel.replace(/\.md$/, '.html');
      const target = outRel === 'index.html' ? `spec/${current}/` : `spec/${current}/${outRel}`;
      specItems.push({ label: shortSpecTitle(title ?? fallbackTitle(rel)), target });
    }
  }
  const exists = (name) => fs.existsSync(path.join(ROOT, name));
  const groups = [
    { label: 'Start', items: [{ label: 'Introduction', target: '' }] },
    { label: current ? `Specification ${current}` : 'Specification', items: specItems },
    {
      label: 'Packages',
      items: [
        { label: 'Catalog', target: 'catalog/' },
        { label: 'Packages', target: 'packages/' },
        { label: 'Examples', target: 'examples/' },
      ],
    },
    {
      label: 'Generated artifacts',
      items: [
        exists('schema') && { label: 'JSON Schema', target: 'schema/' },
        exists('corpus') && { label: 'Conformance corpus', target: 'corpus/' },
        exists('validator') && { label: 'Reference validator', target: 'validator/' },
      ].filter(Boolean),
    },
    {
      label: 'Project',
      items: [
        { label: 'License', target: 'LICENSE.txt' },
        { label: 'Repository', target: REPOSITORY_URL },
      ],
    },
  ].filter((g) => g.items.length);
  return { groups, current };
}

const navigation = planNavigation();

const isExternal = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target);

// The output path a target names: "spec/" -> "spec/index.html", "" -> "index.html".
function pageOf(target) {
  const p = target.split('#')[0];
  return p === '' || p.endsWith('/') ? `${p}index.html` : p;
}

const isPageTarget = (target) => !isExternal(target) && !target.includes('#');

// The one target of a link set marked current on page outRel, with its aria-current
// value: "page" for the page itself, otherwise "true" for the deepest directory the
// page sits in (packages/ for packages/com.example/), or null.
function activeTarget(targets, outRel) {
  const pages = targets.filter(isPageTarget);
  const exact = pages.find((t) => pageOf(t) === outRel);
  if (exact !== undefined) return { target: exact, state: 'page' };
  const parent = pages
    .filter((t) => t.endsWith('/') && outRel.startsWith(t))
    .sort((a, b) => b.length - a.length)[0];
  return parent ? { target: parent, state: 'true' } : null;
}

function navLink({ label, target }, root, active) {
  const href = isExternal(target) ? target : `${root}${hrefFor(target)}`.replace(/%23/g, '#');
  const state = active && active.target === target ? active.state : null;
  return `<a href="${href}"${state ? ` aria-current="${state}"` : ''}>${escapeHtml(label)}</a>`;
}

function renderHeaderNav(outRel, root) {
  const active = activeTarget(HEADER_LINKS.map((l) => l.target), outRel);
  return HEADER_LINKS.map((l) => navLink(l, root, active)).join('\n');
}

// The page's h2 sections, when it has enough of them for a section list.
function pageSections(headings) {
  const h2 = (headings ?? []).filter((h) => h.depth === 2);
  return h2.length >= 3 ? h2 : [];
}

// The left navigation lists pages only. Under the current page's own item it nests
// that page's h2 sections, which CSS shows only below 1200px (wider screens have the
// "On this page" list instead). No other page's sections are ever listed.
function renderNav(outRel, root, headings) {
  const all = navigation.groups.flatMap((g) => g.items);
  const active = activeTarget(all.map((it) => it.target), outRel);
  const sections = pageSections(headings);
  const item = (it) => {
    const own = active?.state === 'page' && active.target === it.target && sections.length
      ? `\n<ul class="nav-sections">\n${sections.map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`).join('\n')}\n</ul>`
      : '';
    return `<li>${navLink(it, root, active)}${own}</li>`;
  };
  return navigation.groups
    .map((g) => `<p class="nav-group">${escapeHtml(g.label)}</p>\n<ul>\n${g.items.map(item).join('\n')}\n</ul>`)
    .join('\n');
}

const HEADER_LINKS = [
  { label: 'Specification', target: 'spec/' },
  { label: 'Catalog', target: 'catalog/' },
  { label: 'Repository', target: REPOSITORY_URL },
];

// The on-page section list, for pages with at least three h2 sections.
function renderToc(headings) {
  if (!pageSections(headings).length) return '';
  const items = headings
    .map((h) => `<li class="toc-${h.depth}"><a href="#${h.id}">${h.text}</a></li>`)
    .join('\n');
  return `<nav class="toc" aria-label="On this page">\n<p class="nav-group">On this page</p>\n<ul>\n${items}\n</ul>\n</nav>`;
}

// --- Pages ----------------------------------------------------------------

function rootFor(outRel) {
  const depth = outRel.split('/').length - 1;
  return depth === 0 ? './' : '../'.repeat(depth);
}

// outRel: output path relative to _site/, POSIX separators.
// name is the page name search results show (pageName by default).
function writePage(outRel, { title, body, notice = '', headings = null, name = pageName(outRel, title) }) {
  const root = rootFor(outRel);
  if (FORBIDDEN_ELEMENT.test(body) || FORBIDDEN_ELEMENT.test(notice)) unsafeContent.push(outRel);
  searchPages.push({ outRel, body, name });
  const pageTitle = title === 'Agentic Team Protocol' ? title : `${title} | Agentic Team Protocol`;
  const toc = renderToc(headings);
  const values = {
    title: escapeHtml(pageTitle),
    root,
    nav: renderNav(outRel, root, headings),
    header_nav: renderHeaderNav(outRel, root),
    toc,
    layout_class: toc ? 'layout has-toc' : 'layout',
    notice: notice ? `<p class="notice">${notice.replaceAll('{{root}}', root)}</p>` : '',
    content: body,
  };
  const html = layout.replace(/\{\{(title|root|nav|header_nav|toc|layout_class|notice|content)\}\}/g, (_, key) => values[key]);
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
      const { html, title, headings } = renderMarkdown(fs.readFileSync(abs, 'utf8'), `site/${rel}`);
      writePage(rel.replace(/\.md$/, '.html'), { title: title ?? fallbackTitle(rel), body: html, headings });
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
        const { html, title, headings } = renderMarkdown(fs.readFileSync(abs, 'utf8'), `spec/${date}/${rel}`);
        const outRel = rel.replace(/\.md$/, '.html');
        const pageTitle = title ?? fallbackTitle(rel);
        pages.push({ outRel, title: pageTitle });
        writePage(`spec/${date}/${outRel}`, { title: pageTitle, body: html, notice, headings });
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
      name: outDir.split('/').at(-1),
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
    body: [
      '<h1>Catalog</h1>',
      '<p>The Agentic Team Protocol catalog is a static, read-only JSON file, <a href="../catalog.json">catalog.json</a>, generated from this repository in CI on every build and never committed. It has one entry per published package version with its identity fields parsed from <code>team.yaml</code>, and a SHA-256 checksum of the exact bytes this site serves for every file of every form. A published version never changes; a change is a new version. There is no write, upload or authentication endpoint.</p>',
      `<p>Every entry is valid under the <a href="../validator/">reference validator</a> ${escapeHtml(catalog.reference_validation.validator_version)}; the build fails when an entry does not validate, and each entry records the validator version that validated it.</p>`,
      `<p>Source commit: <code>${escapeHtml(catalog.source_commit)}</code>. Full checksums are in catalog.json.</p>`,
      rows.length
        ? `<table class="catalog">\n<thead><tr><th>Name</th><th>Version</th><th>Package</th><th>Derived from</th><th>Forms (SHA-256)</th></tr></thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`
        : '<p>No package version is published yet.</p>',
    ].join('\n'),
  });
  return catalog.packages.length;
}

// --- search index ---------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

function plainText(html) {
  return html
    .replace(/<(br|\/p|\/li|\/tr|\/td|\/th|\/pre|\/h\d)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9#]+);/gi, (m, name) => {
      if (/^#x/i.test(name)) return String.fromCodePoint(parseInt(name.slice(2), 16));
      if (/^#\d+$/.test(name) && name !== '#39') return String.fromCodePoint(Number(name.slice(1)));
      return ENTITIES[name.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

// search-index.json: one entry per h1, h2 and h3 section of every rendered page, in
// build order (deterministic). url is the page relative to the site root, title the
// page name (pageName; a listing's directory name), anchor the heading id ("" for the
// page top), text the section's plain text up to the next h1 to h3 (a listing's entry
// names). Read only by site/assets/search.js, which renders every field as text.
function buildSearchIndex() {
  const HEADING = /<h([1-3])(?: id="([^"]*)")?>([\s\S]*?)<\/h\1>/g;
  const entries = [];
  for (const { outRel, body, name } of searchPages) {
    const url = hrefFor(outRel.replace(/(^|\/)index\.html$/, '$1'));
    // Listings contribute entry names only: no parent row, no file sizes.
    const html = body
      .replace(/<a class="heading-anchor"[^>]*>#<\/a>/g, '')
      .replace(/<li><a href="\.\.\/">\.\.\/<\/a><\/li>/g, '')
      .replace(/<span class="size">[^<]*<\/span>/g, '');
    const marks = [...html.matchAll(HEADING)];
    marks.forEach((m, i) => {
      const end = i + 1 < marks.length ? marks[i + 1].index : html.length;
      entries.push({
        url,
        title: name,
        anchor: m[1] === '1' ? '' : (m[2] ?? ''),
        heading: plainText(m[3]),
        text: plainText(html.slice(m.index + m[0].length, end)),
      });
    });
  }
  const json = `${JSON.stringify(entries)}\n`;
  fs.writeFileSync(path.join(OUT, 'search-index.json'), json);
  return { entries: entries.length, bytes: Buffer.byteLength(json) };
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
// Generated artifacts from the Domios reference implementation (PROVENANCE.md),
// served byte-for-byte only once they exist in the repository.
const GENERATED = [
  ['schema', '<p>JSON Schema for Agentic Team Protocol packages, generated from the Domios reference implementation, laid out as <code>schema/&lt;spec version&gt;/team.schema.json</code>. Files are served exactly as committed. A published dated schema never changes.</p>'],
  ['corpus', '<p>Agentic Team Protocol conformance corpus, generated from the Domios reference implementation, laid out as <code>corpus/&lt;spec version&gt;/</code>. <code>cases.json</code> lists every case with its expected codes. Files are served exactly as committed. A published dated corpus never changes.</p>'],
  ['validator', '<p>Agentic Team Protocol reference validator, built from the Domios reference implementation. Files are served exactly as committed.</p>'],
];
const generatedFiles = {};
for (const [name, intro] of GENERATED) {
  if (fs.existsSync(path.join(ROOT, name))) generatedFiles[name] = buildCollection(name, intro);
}
const catalog = buildCatalog();
copyExact(path.join(ROOT, 'LICENSE'), path.join(OUT, 'LICENSE.txt'));

const unsafe = [...new Set([
  ...unsafeContent,
  ...renderedPages.filter((rel) => !pageIsAllowed(fs.readFileSync(path.join(OUT, ...rel.split('/')), 'utf8'), rootFor(rel))),
])].sort(byName);
if (unsafe.length) {
  console.error(`error: the site must be static apart from the search script and field; script/form/input/textarea/button/iframe elements found in: ${unsafe.join(', ')}`);
  process.exit(1);
}
const searchIndex = buildSearchIndex();
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('error: site/index.md did not produce _site/index.html');
  process.exit(1);
}

for (const w of warnings) console.warn(`warning: ${w}`);
console.log(
  `built _site/: ${renderedPages.length} pages; spec versions: ${spec.dates.length}` +
    `${spec.current ? ` (current ${spec.current})` : ''}; packages files: ${packageFiles}; ` +
    `examples files: ${exampleFiles}; ` +
    Object.entries(generatedFiles).map(([name, count]) => `${name} files: ${count}; `).join('') +
    `catalog.json: ${catalog} entries; search-index.json: ${searchIndex.entries} sections, ${searchIndex.bytes} bytes`,
);
