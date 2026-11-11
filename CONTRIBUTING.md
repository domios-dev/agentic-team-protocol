# Contributing to the Agentic Team Protocol

Thank you for helping improve the Agentic Team Protocol. These rules keep the
specification and published packages stable for everyone who depends on them.

## Pull requests

- Every change lands through a pull request to `main`. Nobody pushes to `main` directly.
- The repository owner reviews and merges every pull request.
- The Pages workflow builds the site for every pull request; the build must be green.
  Check it locally first with `npm ci && npm run build`.

## Specification versions

- The specification is versioned by date under `spec/<YYYY-MM-DD>/`.
- A dated version is a draft until it is first published on the site. Once published it is
  immutable: corrections and changes go into a new dated version.

## Packages

- Published package versions under `packages/<scope>/<name>/<version>/` are immutable.
  To change a package, publish a new version.
- The only exception is a one-time entry in `packages/IMMUTABILITY-EXCEPTIONS.json` naming the
  exact version directory, the reason and the approver, added in the same pull request as the
  change. `scripts/check-immutability.mjs` then accepts modified (not added or deleted) files
  in that version, and only while the entry is new relative to the base commit, so once merged
  it allows nothing further; a malformed exceptions file fails the check.
- Package files are served exactly as committed. Do not reformat or re-encode them.
- Each package states its own license. Published packages and examples contain no personal
  names, handles or personal URLs; use `com.example` and neutral authors.

## Generated artifacts

The JSON Schema, conformance corpus and reference validator are generated from the Domios
reference implementation. They are never edited by hand. A mismatch is fixed at the source
and the artifacts are regenerated.

## Naming

Always write the full name "Agentic Team Protocol" in public text: documents, pages,
headings, commit messages and pull request titles. Never use the acronym on its own: it is
shared with unrelated projects, so the full name must always appear with it.

## License

By contributing, you agree that your contributions to the specification and this
repository are licensed under the Apache License 2.0 (see [LICENSE](LICENSE)). Packages
keep their own stated licenses.
