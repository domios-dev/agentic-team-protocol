# Changelog

All notable changes to the Agentic Team Protocol repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The
specification is versioned by date (`spec/<YYYY-MM-DD>/`) rather than by semantic version.

## [Unreleased]: Phase 1

Phase 1 publishes the static, read-only Agentic Team Protocol site: overview, the dated
specification, examples, invalid fixtures and the package catalog. The generated
artifacts (JSON Schema, conformance corpus, reference validator) are pending.

### Added

- Dated specification `spec/2026-11-11/`: the normative package format page and a
  separate non-normative host behaviour page. The version stays a draft until its first
  publication on the site; after that its text is immutable.
- Example package `com.example/research-desk` 2.1.0 in all three forms (single file
  `.team.yaml`, `.team` ZIP and folder), with `scripts/pack-team.mjs` (deterministic
  archives) and `scripts/check-forms.mjs` (ZIP and folder hold identical entries).
- Invalid fixtures `examples/invalid/` (22 cases) and the warning fixture
  `examples/warnings/unresolved-skill`, each with its expected result; stable error and
  warning codes are marked pending.
- Package catalog `catalog.json` (`scripts/build-catalog.mjs`), generated in CI from git
  on every build and never committed: one entry per published version
  `packages/<scope>/<name>/<version>/` with name, version, title, description and
  derived_from parsed from `team.yaml`, and the path and SHA-256 checksum of the `.team`
  package plus every file of every form. A CI step re-hashes every catalog path in the
  built site and fails on any mismatch. The catalog page lists the entries and marks
  validation by the reference validator as pending.
- Version immutability (`scripts/check-immutability.mjs`): CI fails when a pull request
  or push modifies, deletes or adds a file in a package version that already exists on
  the base commit; a change is published as a new version.

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

### Pending

- `com.example/research-desk` 2.1.0 author URL is `https://example.com/jane`, corrected before first public serving through a one-time entry in `packages/IMMUTABILITY-EXCEPTIONS.json` honoured by `scripts/check-immutability.mjs`.
- JSON Schema, conformance corpus and reference validator: pending, generated from the
  Domios reference implementation in Phase 2. Until then catalog entries are not
  validated by the reference validator.
