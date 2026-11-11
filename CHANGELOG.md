# Changelog

All notable changes to the Agentic Team Protocol repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The
specification is versioned by date (`spec/<YYYY-MM-DD>/`) rather than by semantic version.

## [Unreleased]

### Added

- Static site build (`npm run build`, `scripts/build-site.mjs`) with Node.js 22 and one
  pinned Markdown dependency. It renders the overview, every dated specification version
  (the newest date as current), listing pages for `packages/` and `examples/`, and copies
  package and example files byte-for-byte.
- GitHub Pages workflow (`.github/workflows/pages.yml`): builds on every pull request and
  push to `main`; deploys only from `main` when the repository variable `PAGES_PUBLISH` is
  `true`.
- Overview page describing the Agentic Team Protocol, its three package forms and the
  pending generated artifacts (JSON Schema, conformance corpus, reference validator).
- README, changelog and contributing notes.
