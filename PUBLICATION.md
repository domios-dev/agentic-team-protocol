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

Status: published. HTTPS is enforced; the GitHub Pages certificate for `atp.domios.dev`
expires 2027-02-11.

| Evidence | Value |
| --- | --- |
| Date (UTC) | 2026-11-13 |
| Site URL | `https://atp.domios.dev` |
| Published commit on `main` | `dae9513cce89219064e758c60769b3751dc6ad83` |
| Pages workflow run | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43276122724 (success) |
| Conformance workflow run at that commit | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43276122650 (success, every job green) |
| Spec version | `2026-11-11` |
| Validator version | `2026.11.11` |
| Schema URL | `https://atp.domios.dev/schema/2026-11-11/team.schema.json` |
| Schema served SHA-256 | `4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300` (equals PROVENANCE.md) |
| `catalog.json` served SHA-256 and `source_commit` | `92aefffe56ed2c3fbacf2b99ae40e3f5fe1ce873637d832c231e40a6845602b4`, `source_commit` `dae9513cce89219064e758c60769b3751dc6ad83` (the published commit), 2 entries |
| `check-served.mjs` result | exit 0, 69 served files checked, no notes |

`check-served.mjs` output:

```text
checked 69 served files under https://atp.domios.dev/

Evidence:
  spec version: 2026-11-11
  validator version: 2026.11.11
  schema URL: https://atp.domios.dev/schema/2026-11-11/team.schema.json
  schema served SHA-256: 4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300
  catalog.json served SHA-256: 92aefffe56ed2c3fbacf2b99ae40e3f5fe1ce873637d832c231e40a6845602b4 (source_commit dae9513cce89219064e758c60769b3751dc6ad83, 2 entries)

all served bytes match the recorded checksums
```

## Publication 2

Status: _to be filled_.

Publication 2 supersedes the checksums recorded in Publication 1. Publication 1 stays
above unchanged as the record of what was served at that time; from Publication 2 on, its
schema, corpus, validator, catalog and package checksums are no longer the served bytes.

### Owner decision

2026-11-11 is the first release of the Agentic Team Protocol. By decision of the goal
owner, the roles map (one `roles` map of managers and workers) is applied to 2026-11-11 in
place: there is no new spec version, no validator version bump and no migration.
Publication 2 is a one-time exception to immutability, granted by the goal owner for the
first release only.

### Scope of the in-place change

- Spec text: `spec/2026-11-11/`, with the site and README pages that describe it.
- JSON Schema: `schema/2026-11-11/`.
- Conformance corpus: `corpus/2026-11-11/`.
- Validator `2026.11.11`: the WebAssembly build in `validator/2026.11.11/` and the native
  binaries of the GitHub release `validator-2026.11.11`.
- Catalog packages, rewritten in place in all three forms: `com.example/research-desk`
  `2.1.0` and `dev.domios/default` `1.0.0`.

### Release replacement log

The old values were read from the live GitHub release on 2026-11-13 12:48 UTC, before its
recreation: `gh release view validator-2026.11.11`, `git ls-remote origin
refs/tags/validator-2026.11.11` and `gh release download validator-2026.11.11` followed by
`sha256sum -c SHA256SUMS` (all four binaries `OK`). Every binary SHA-256 below equals the
GitHub asset digest and the values in PROVENANCE.md and validator/README.md at that time.

| Evidence | Old release | New release |
| --- | --- | --- |
| Tag `validator-2026.11.11` | lightweight tag at `dcab5843fb7a4721e17a5008d1d063533f788557` (merge of pull request #8) | _to be filled_ (the main merge commit) |
| Published (UTC) | 2026-11-12T17:35:06Z | _to be filled_ (recreation time) |
| Source workflow run | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43267871169 (Validator, success) | _to be filled_ |
| Domios source commit | `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` | _to be filled_ |
| Authority | not applicable | goal owner (one-time first-release exception) |

| Asset | Old size (bytes) | Old SHA-256 | New size (bytes) | New SHA-256 |
| --- | --- | --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | 1724856 | `66a196322b0dd0bf3529a0506caac004fb61c9d99311ba824a3b008e19e420c4` | _to be filled_ | _to be filled_ |
| `atp-validate-aarch64-apple-darwin` | 1428720 | `ac5a8ffb51986022e09ea49e7c648bc641a75bee79553a1e2ec33baee25d2f61` | _to be filled_ | _to be filled_ |
| `atp-validate-x86_64-apple-darwin` | 1484664 | `9cbaf22a66458ae116008614dd39a292d20c961322747c9ca1e1d03bd367d50e` | _to be filled_ | _to be filled_ |
| `atp-validate-x86_64-pc-windows-msvc.exe` | 1200128 | `71e09ed921b5d7a17b24a6f6b30d55f3271f017a54de201c438fc388a0a501d7` | _to be filled_ | _to be filled_ |
| `SHA256SUMS` | 410 | `53cdcb7b55ea9275b0e959df1f67b25e652cf5ce3caca90eb4f30ecbc710976f` | _to be filled_ | _to be filled_ |

### Evidence

| Evidence | Value |
| --- | --- |
| Date (UTC) | _to be filled_ |
| Site URL | `https://atp.domios.dev` |
| Published commit on `main` | _to be filled_ |
| Integration merge commit | _to be filled_ |
| Domios source commit | _to be filled_ |
| `validator.yml` workflow run | _to be filled_ |
| Pages workflow run | _to be filled_ |
| Conformance workflow run at that commit | _to be filled_ |
| Conformance rerun on `main` after the release recreation | _to be filled_ |
| DEV team check and export receipts, `com.example/research-desk` `2.1.0` | _to be filled_ |
| DEV team check and export receipts, `dev.domios/default` `1.0.0` | _to be filled_ |
| Spec version | `2026-11-11` |
| Validator version | `2026.11.11` |
| Schema URL | `https://atp.domios.dev/schema/2026-11-11/team.schema.json` |
| Schema served SHA-256 | _to be filled_ |
| `catalog.json` served SHA-256 and `source_commit` | _to be filled_ |
| Validator release | _to be filled_ (tag commit, asset checksums against SHA256SUMS, PROVENANCE.md and validator/README.md) |
| Install without Domios | _to be filled_ (validator/README.md install run in a fresh directory: one catalog package in three forms, one `examples/invalid` case) |
| `check-served.mjs` result | _to be filled_ |

`check-served.mjs` output:

```text
_to be filled_
```
