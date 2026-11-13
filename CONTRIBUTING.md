# Contributing to the Agentic Team Protocol

Thank you for helping improve the Agentic Team Protocol. These rules keep the
specification and published packages stable for everyone who depends on them.

## Pull requests

- Every change lands through a pull request to `main`. Nobody pushes to `main` directly.
- The repository owner reviews and merges every pull request.
- The Pages workflow builds the site and checks its internal links for every pull request;
  it must be green. Check it locally first, as described in
  [Building the site](README.md#building-the-site).

## Specification versions

- The specification is versioned by date under `spec/<YYYY-MM-DD>/`, under the rules of
  [section 3 of the specification](spec/2026-11-11/index.md#3-versioning): a change to a
  published dated version goes into a new dated version.

## Packages

- Published package versions under `packages/<scope>/<name>/<version>/` are immutable.
  To change a package, publish a new version.
- The only exception is a one-time entry in
  [`packages/IMMUTABILITY-EXCEPTIONS.json`](packages/IMMUTABILITY-EXCEPTIONS.json), added in
  the same pull request as the change and enforced by `scripts/check-immutability.mjs`. An
  entry applies only while it is new relative to the base commit, so once merged it allows
  nothing further; a malformed exceptions file fails the check. Every entry names a reason
  and an approver, in one of two forms:
  - Keyed `"version"` (the version directory): allows only modified files in that version,
    or, with an `"added"` array of exact file paths, only adding exactly those files.
  - Keyed `"directory"`, with `"added"`, `"modified"` and `"deleted"` arrays of exact paths
    relative to it: each listed file must have exactly that change against the base, any
    unlisted change in the directory fails, and a directory takes one new entry.
- Every package version publishes the bytes the Domios exporter writes
  (`team export --format yaml|team|folder`) as-is, in every form it ships; they are never
  authored, re-packed or reformatted here, and `scripts/check-forms.mjs` checks every `.team`
  against the exporter's container profile.
- Package files are served exactly as committed. Do not reformat or re-encode them.
- Each package states its own license. Published packages and examples contain no personal
  names, handles or personal URLs; use `com.example` and neutral authors.

## Generated artifacts

The JSON Schema, conformance corpus and reference validator are generated from the Domios
reference implementation and never edited by hand; [PROVENANCE.md](PROVENANCE.md) records
how each was produced. A mismatch is fixed at the source and the artifacts are regenerated.

## Naming

Always write the full name "Agentic Team Protocol" in public text: documents, pages,
headings, commit messages and pull request titles. Never use the acronym on its own: it is
shared with unrelated projects, so the full name must always appear with it.

## License

By contributing, you agree that your contributions to the specification and this
repository are licensed under the Apache License 2.0 (see [LICENSE](LICENSE)). Packages
keep their own stated licenses.
