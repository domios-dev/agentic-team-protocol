# Changelog

All notable changes to the Agentic Team Protocol repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The
specification is versioned by date (`spec/<YYYY-MM-DD>/`) rather than by semantic version.

## [Unreleased]: Phase 4

### Changed

- Site: a documentation layout in the domios.dev visual language, with a left navigation
  of the specification sections, an on-page section list, heading anchors, dark and light
  themes from `prefers-color-scheme`, and a "Contents" menu on narrow screens. Site
  search is a self-hosted script reading a build-time index (`search-index.json`), with
  no external requests; the build allows only that script and its search field. Results
  list the normative package format before host behaviour within each ranking tier and
  name their page ("Package format 2026-11-11", "Host behaviour", "Catalog") instead of
  a URL path. On rendered pages, a link whose text is the bare file name of its `.md`
  target shows that page's name ("host-behaviour.md" reads "Host behaviour"); the
  Markdown sources are unchanged. There are no font files, and every URL and served
  artifact byte is unchanged.

## [Unreleased]: Phase 3

Phase 3 releases the roles map in place under specification version 2026-11-11: a team
declares its roles as one map of managers and workers. The first release had no users,
so the owner allowed a one-time first-release exception. Every published 2026-11-11
artifact is rewritten in place instead of versioned. Names, versions, the schema `$id`
and the release tag stay the same, and there is no migration.

### Pending

- Roles map, released in place under the one-time first-release owner exception.
  `PROVENANCE.md` records the exception and the superseded checksums.
  `packages/IMMUTABILITY-EXCEPTIONS.json` lists every added, modified and deleted file.
  - Specification `spec/2026-11-11/`: roles are one map of managers and workers
    (section 10), and section 15 gives the final validator codes.
  - JSON Schema `schema/2026-11-11/team.schema.json`, conformance corpus
    `corpus/2026-11-11/` and reference validator 2026.11.11: regenerated from Domios
    `fafc45b8b68808530d6c2fe4956af0fa9d23dd54`. The schema and the WebAssembly module
    come from `validator.yml` run 43468853771, and the corpus is a `git archive` of that
    commit.
  - Release `validator-2026.11.11`: after the merge to `main`, the binaries and
    `SHA256SUMS` of run 43468853771 replace the first release's under the same tag. The
    tag moves to the merge commit on `main`.
  - `packages/`: com.example/research-desk 2.1.0 and dev.domios/default 1.0.0 are rewritten
    in the `roles` shape, every form byte for byte as the Domios exporter wrote it. Their
    versions are unchanged, and `scripts/pack-team.mjs` no longer packs any package
    version.
  - `examples/`: rewritten for the roles map, with 30 invalid cases and one warning case.
    Their codes and locations come from the reference validator.
  - `atp-validate` and the WebAssembly functions take no host profile. `validator.yml`,
    `scripts/conformance.mjs` and the catalog build check each input once. In corpus
    mode, `scripts/conformance.mjs` requires a listed code only for errors, as the
    reference implementation's corpus test does.
  - `scripts/check-immutability.mjs` also keeps `validator/<YYYY.MM.DD>/` immutable. It
    accepts an exact-file exception entry (`directory`, `reason`, `approver`, and the
    exact `added`, `modified` and `deleted` file lists) under `packages/`, `schema/`,
    `corpus/` and `validator/`. The entry admits exactly those changes, and only while it
    is new against the base. Existing entries behave as before.
  - `scripts/check-links.mjs`: checks every internal link and anchor of the built site.
    With `--markdown`, it checks the repository's Markdown files that the site does not
    render, as GitHub shows them.

## [Unreleased]: Phase 2

Phase 2 adds the generated JSON Schema, conformance corpus and reference validator
(recorded in `PROVENANCE.md`; see Pending below) and makes them a CI gate that an
outside consumer can reproduce without Domios.

### Added

- `scripts/conformance.mjs`: runs the released `atp-validate` 2026.11.11 (its SHA-256
  checked against `validator/README.md` and `PROVENANCE.md`) and the committed
  WebAssembly module over every package version in every form it ships, every
  `examples/` case and every corpus case, one run per input with no host input
  (specification section 10.7). Packages must be
  valid with no diagnostic; examples must produce exactly their listed diagnostics,
  locations included; corpus cases must match `valid`, report every listed diagnostic
  and no unlisted code; the WebAssembly report must equal the command-line report. It
  also checks that every example quote appears in the cited specification section.
- `.github/workflows/conformance.yml`: on fresh Linux, macOS and Windows runners without
  Domios, installs the validator from the GitHub Release `validator-2026.11.11` with the
  install commands of `validator/README.md`, verifies `SHA256SUMS`, runs
  `scripts/conformance.mjs`, and requires identical result summaries on every platform.
- `scripts/check-served.mjs <base-url>`: fetches every schema, corpus and validator file
  recorded in `PROVENANCE.md` and every path in the served `catalog.json`, and compares
  their SHA-256 with the records and this checkout. `PUBLICATION.md` is the evidence
  template filled from it after the owner's publication approval.

### Changed

- The catalog build validates every entry's `.team` ZIP and single file with the
  reference validator, one run per form, and fails on any error;
  each entry records the validator version in `validation`. The catalog page no longer
  says validation is pending.
- `validator/README.md` links the release `validator-2026.11.11` and gives copyable
  install commands for Linux, macOS and Windows.
- The specification (section 15) and `examples/README.md` state that accept or refuse
  plus the error and warning codes are normative, and locations informative.
- `examples/**/expected.yaml` cite the public specification by section number with a
  verbatim quote; internal planning references are removed. Codes, locations and
  inputs are unchanged.

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
- Generated artifacts (Phase 2), recorded in `PROVENANCE.md`: the JSON Schema
  `schema/2026-11-11/team.schema.json`, the conformance corpus `corpus/2026-11-11/` and
  the reference validator `validator/` (version `2026.11.11`,
  chosen by the owner), built by `.github/workflows/validator.yml` from Domios
  `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` and licensed Apache-2.0 like the Domios
  components they come from. The stable codes in
  `examples/**/expected.yaml` and specification section 15 come from the corpus and from
  the validator's run over the examples. Catalog entries are validated by the reference
  validator (see Phase 2).
- Builtin package `dev.domios/default` 1.0.0 (Phase 2): published in the folder and
  `.team` ZIP forms, byte-identical to `src-tauri/team-templates/default/` at Domios
  commit `46078622b77e6bbb4aeca70a779e7cef819fd60d`.
- `dev.domios/default` 1.0.0 single-file form `default.team.yaml`: the Domios exporter's
  output byte for byte (`team export dev.domios/default --format yaml` at Domios commit
  `a7374d38447289ded47f01849bbdb45799720ce8`, SHA-256
  `55dd56f313a78fc666f304bfd9d613cbcf6804a394487815f592cfa012b45a91`), added before first
  public serving. The version now ships all three forms; its packed `.team` ZIP is unchanged.
- `scripts/check-immutability.mjs`: a one-time entry may carry an `"added"` array of exact
  file paths; only those files may then be added to the published version, each must be
  added, and any other change still fails. A malformed `"added"` array exits 2.
- From the next published package version on, the `.team` archive is the Domios exporter's
  output as-is (`team export --format team`) and is never re-packed in this repository.
- The single-file form is optional per published version. The format still defines three
  forms; the ZIP and folder forms stay mandatory. `scripts/check-forms.mjs` prints a
  `note` for a version without a single file. `scripts/build-catalog.mjs` emits
  `forms.single_file: null` for it, and `--verify` accepts null only when no single file
  is served. The catalog page shows "no single-file form" for such a version.
