// Agentic Team Protocol site search. Self-hosted, no dependencies, no storage, no
// tracking. The only request it makes is for search-index.json on this site, and only
// the first time the search field is focused or typed in, never on page load. The
// field ships hidden, so a visitor without JavaScript never sees it.
(function () {
  'use strict';
  const script = document.currentScript;
  const box = document.getElementById('site-search');
  if (!script || !box) return;
  const root = new URL('../', script.src); // assets/search.js -> the site root
  const input = document.getElementById('site-search-input');
  const panel = document.getElementById('site-search-results');
  const status = document.getElementById('site-search-status');
  const SHOWN = 20;
  let entries = null;
  let loading = null;
  let announceTimer = 0;

  function load() {
    if (!loading) {
      loading = fetch(new URL('search-index.json', root), { credentials: 'same-origin' })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((data) => {
          entries = data.map((e) => ({ e, h: e.heading.toLowerCase(), t: e.text.toLowerCase() }));
        })
        .catch(() => {
          loading = null;
          announce('Search is unavailable.', 0);
        });
    }
    return loading;
  }

  function announce(message, delay) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => { status.textContent = message; }, delay);
  }

  const words = (q) => q.toLowerCase().split(/\s+/).filter(Boolean);

  const LISTINGS_SHOWN = 3;
  const isListing = (x) => x.h.endsWith('/'); // a directory listing's heading is its path

  // Every query word must appear in the heading or the text. Order:
  //   0 specification sections (spec/**, host behaviour included) matched in the heading,
  //   1 specification sections matched in the text only,
  //   2 the other pages: home, catalog and package pages,
  //   3 the other directory listings (examples, schema, corpus, validator).
  // Within a group, sections whose heading holds all words come first, then those whose
  // heading holds some. Within each of those tiers the normative package format
  // (spec/<version>/) comes before host behaviour and every other page; remaining ties
  // keep document order. At most LISTINGS_SHOWN directory listings (package directories
  // included) are returned.
  const isPackageFormat = (url) => /^spec\/\d{4}-\d{2}-\d{2}\/$/.test(url);
  function search(ws) {
    const hits = [];
    entries.forEach((x, i) => {
      let inHeading = 0;
      for (const w of ws) {
        const h = x.h.includes(w);
        if (!h && !x.t.includes(w)) return;
        if (h) inHeading += 1;
      }
      const strength = inHeading === ws.length ? 0 : inHeading > 0 ? 1 : 2;
      const url = x.e.url;
      const group = url.startsWith('spec/') ? (inHeading > 0 ? 0 : 1)
        : url === '' || url.startsWith('catalog/') || url.startsWith('packages/') ? 2
          : 3;
      hits.push({ x, i, rank: group * 3 + strength, page: isPackageFormat(url) ? 0 : 1 });
    });
    hits.sort((a, b) => a.rank - b.rank || a.page - b.page || a.i - b.i);
    let listings = 0;
    return hits.filter((hit) => !isListing(hit.x) || ++listings <= LISTINGS_SHOWN);
  }

  function snippet(text, ws) {
    const lower = text.toLowerCase();
    let at = -1;
    for (const w of ws) {
      const p = lower.indexOf(w);
      if (p !== -1 && (at === -1 || p < at)) at = p;
    }
    let start = at > 50 ? at - 50 : 0;
    if (start > 0) {
      const space = text.indexOf(' ', start);
      if (space !== -1 && space < at) start = space + 1;
    }
    const end = Math.min(text.length, start + 150);
    return (start > 0 ? '… ' : '') + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
  }

  // Appends text to parent with every query word wrapped in <mark>, without HTML parsing.
  function appendMarked(parent, text, ws) {
    const pattern = new RegExp(`(${ws.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    text.split(pattern).forEach((part, i) => {
      if (!part) return;
      if (i % 2 === 1) {
        const m = document.createElement('mark');
        m.textContent = part;
        parent.append(m);
      } else {
        parent.append(part);
      }
    });
  }

  function span(className) {
    const s = document.createElement('span');
    s.className = className;
    return s;
  }

  function close() {
    panel.hidden = true;
  }

  function render() {
    const q = input.value.trim();
    if (!q) {
      close();
      panel.textContent = '';
      announce('', 0);
      return;
    }
    if (!entries) {
      load().then(() => { if (entries && input.value.trim() === q) render(); });
      return;
    }
    const ws = words(q);
    const hits = search(ws);
    panel.textContent = '';
    if (hits.length) {
      const list = document.createElement('ul');
      for (const { x } of hits.slice(0, SHOWN)) {
        const e = x.e;
        const a = document.createElement('a');
        a.href = new URL(e.url + (e.anchor ? `#${e.anchor}` : ''), root).href;
        const heading = span('search-hit-heading');
        appendMarked(heading, e.heading, ws);
        a.append(heading);
        // The page name from the build (search-index.json "title"), as text only.
        if (e.title && e.title !== e.heading) {
          const page = span('search-hit-page');
          page.textContent = e.title;
          a.append(page);
        }
        if (e.text) {
          const snip = span('search-hit-snippet');
          appendMarked(snip, snippet(e.text, ws), ws);
          a.append(snip);
        }
        const li = document.createElement('li');
        li.append(a);
        list.append(li);
      }
      panel.append(list);
      if (hits.length > SHOWN) {
        const more = document.createElement('p');
        more.className = 'search-note';
        more.textContent = `Showing the first ${SHOWN} of ${hits.length} results. Add a word to narrow them.`;
        panel.append(more);
      }
    } else {
      const none = document.createElement('p');
      none.className = 'search-note';
      none.textContent = 'No results.';
      panel.append(none);
    }
    panel.hidden = false;
    const count = hits.length === 1 ? '1 result' : `${hits.length} results`;
    announce(`${count} for ${q}`, 500);
  }

  function clear() {
    input.value = '';
    render();
  }

  box.hidden = false;

  input.addEventListener('focus', () => {
    load();
    if (input.value.trim()) render();
  });
  input.addEventListener('input', () => {
    load();
    render();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (input.value || !panel.hidden) event.preventDefault();
      clear();
    } else if (event.key === 'Enter') {
      const first = panel.hidden ? null : panel.querySelector('a');
      if (first) {
        event.preventDefault();
        first.click();
      }
    }
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      clear();
      input.focus();
    }
  });
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  box.addEventListener('focusout', (event) => {
    if (!box.contains(event.relatedTarget)) close();
  });

  // "/" focuses the field unless the visitor is typing somewhere.
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    const t = event.target;
    if (t instanceof Element && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    event.preventDefault();
    input.focus();
    input.select();
  });
})();
