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
