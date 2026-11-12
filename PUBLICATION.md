# Publication evidence

This file records the evidence that the published Agentic Team Protocol site serves
exactly the bytes this repository records. It is filled in once per publication, after the
owner's approval to publish on GitHub Pages, from the published site itself and not from a
local build:

```sh
node scripts/check-served.mjs https://atp.domios.dev
```

`scripts/check-served.mjs` fetches every JSON Schema, conformance corpus and WebAssembly
validator file recorded in [PROVENANCE.md](PROVENANCE.md) and every path in the served
`catalog.json`, and compares each SHA-256 with PROVENANCE.md, catalog.json and this
checkout. It prints the evidence below. Publication is proven only when it exits 0; on any
mismatch, record the output here and do not announce the site.

Before publication, the same command against a static server over `_site/` is a dry run
(for example `node scripts/check-served.mjs http://localhost:8080`).

## Publication 1

Status: not yet published (waiting for the owner's Pages approval).

| Evidence | Value |
| --- | --- |
| Date (UTC) | _to be filled_ |
| Site URL | _to be filled_ (`https://atp.domios.dev`) |
| Published commit on `main` | _to be filled_ |
| Pages workflow run | _to be filled_ (URL of the `pages.yml` run that deployed it) |
| Conformance workflow run at that commit | _to be filled_ (URL of the `conformance.yml` run; every job green) |
| Spec version | _to be filled_ (expected `2026-11-11`) |
| Validator version | _to be filled_ (expected `2026.11.11`) |
| Schema URL | _to be filled_ (expected `https://atp.domios.dev/schema/2026-11-11/team.schema.json`) |
| Schema served SHA-256 | _to be filled_ (must equal `4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300`, PROVENANCE.md) |
| `catalog.json` served SHA-256 and `source_commit` | _to be filled_ (`source_commit` must be the published commit) |
| `check-served.mjs` result | _to be filled_ (exit code, number of files checked, any note) |

`check-served.mjs` output:

```text
to be filled
```
