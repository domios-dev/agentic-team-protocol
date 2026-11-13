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

Status: published. HTTPS is enforced (plain HTTP answers 301 to `https://atp.domios.dev/`);
the GitHub Pages certificate for `atp.domios.dev` expires 2027-02-11.

Publication 2 supersedes the checksums recorded in Publication 1 under the one-time
first-release owner exception below; for example the served schema SHA-256 changes from
`4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300` to
`97b2ff9d69c70add556ba79399f8bae563098160f810ad16bdf4b0373ba0e1f5`. Publication 1 stays
above unchanged as the record of what was served at that time; from Publication 2 on, its
schema, corpus, validator, catalog and package checksums are no longer the served bytes.
Every deploy of `main` rebuilds `catalog.json` with that commit as its `source_commit`, its
only commit-bound value, so the served `catalog.json` SHA-256 changes on each deploy even
when no package changes (for example
`f659b4c9785ea8e5544fddf75439b9651f3f6bd0413cf4907af69ba4839315a5` at `0111ff8` after pull
request #12). Each publication records the value at its own published commit.

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

The change reached `main` as one merge, pull request #14
(`7b33488fb87d3bd5341458ae84b391d9e71d8e0d`), which integrates pull request #13 (spec
text), #16 (catalog packages) and #15 (examples).

### Release replacement log

The old values were read from the live GitHub release on 2026-11-13 12:48 UTC, before its
recreation: `gh release view validator-2026.11.11`, `git ls-remote origin
refs/tags/validator-2026.11.11` and `gh release download validator-2026.11.11` followed by
`sha256sum -c SHA256SUMS` (all four binaries `OK`). Every binary SHA-256 below equals the
GitHub asset digest and the values in PROVENANCE.md and validator/README.md at that time.

The old release was then deleted together with its tag, and the new release was published
under the same tag on the main merge commit, under the goal owner's one-time first-release
exception. The new values were read from the live release on 2026-11-13
17:20 UTC with the same commands: `git ls-remote origin refs/tags/validator-2026.11.11`
returns `7b33488fb87d3bd5341458ae84b391d9e71d8e0d`, equal to `refs/heads/main`, with no
peeled entry (a lightweight tag); `sha256sum -c SHA256SUMS` reports all four binaries
`OK`; and every binary SHA-256 equals the GitHub asset digest, PROVENANCE.md and
validator/README.md at `7b33488fb87d3bd5341458ae84b391d9e71d8e0d`.

| Evidence | Old release | New release |
| --- | --- | --- |
| Tag `validator-2026.11.11` | lightweight tag at `dcab5843fb7a4721e17a5008d1d063533f788557` (merge of pull request #8) | lightweight tag at `7b33488fb87d3bd5341458ae84b391d9e71d8e0d` (merge of pull request #14, the published commit on `main`) |
| Published (UTC) | 2026-11-12T17:35:06Z | 2026-11-13T17:17:22Z (not draft, not prerelease) |
| Source workflow run | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43267871169 (Validator, success) | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43468853771 (Validator, success) |
| Domios source commit | `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` | `fafc45b8b68808530d6c2fe4956af0fa9d23dd54` |
| Authority | not applicable | goal owner (one-time first-release exception) |

| Asset | Old size (bytes) | Old SHA-256 | New size (bytes) | New SHA-256 |
| --- | --- | --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | 1724856 | `66a196322b0dd0bf3529a0506caac004fb61c9d99311ba824a3b008e19e420c4` | 1703856 | `6adfa021bda8bd56a46805025c424d75891f523a44af238f8b1572aff082dc7d` |
| `atp-validate-aarch64-apple-darwin` | 1428720 | `ac5a8ffb51986022e09ea49e7c648bc641a75bee79553a1e2ec33baee25d2f61` | 1408816 | `c8b52eae2040016837182923eaf94486e4424c37bebaf6f8880dcac4e04955cc` |
| `atp-validate-x86_64-apple-darwin` | 1484664 | `9cbaf22a66458ae116008614dd39a292d20c961322747c9ca1e1d03bd367d50e` | 1463320 | `03e4f3e3f5ce92a023d18ef9fb960e2b64353cd494a4df543d00469777eec9dc` |
| `atp-validate-x86_64-pc-windows-msvc.exe` | 1200128 | `71e09ed921b5d7a17b24a6f6b30d55f3271f017a54de201c438fc388a0a501d7` | 1171968 | `f1da9f500caacda004545332a0224428906cc5dcd64a94c6449b1215aaf2eacc` |
| `SHA256SUMS` | 410 | `53cdcb7b55ea9275b0e959df1f67b25e652cf5ce3caca90eb4f30ecbc710976f` | 410 | `99b5fcc06aa69ffa21b283c0dfbccfec444a0f66546a6153a0c7e1faa54495d1` |

### Evidence

| Evidence | Value |
| --- | --- |
| Date (UTC) | 2026-11-13 |
| Site URL | `https://atp.domios.dev` |
| Published commit on `main` | `7b33488fb87d3bd5341458ae84b391d9e71d8e0d` |
| Integration merge commit | `7b33488fb87d3bd5341458ae84b391d9e71d8e0d`, pull request #14 from integration head `b78e04dd11dada345bc1e050841d4ff5a0c91932` (integrates pull requests #13, #16 and #15) |
| Domios source commit | `fafc45b8b68808530d6c2fe4956af0fa9d23dd54` for the schema, corpus, WebAssembly validator and release binaries (`DOMIOS_SHA` in `.github/workflows/validator.yml`, PROVENANCE.md); `16d5277f4ff083d487a7c55ba351f9bb72b8f084` for the catalog package exports (packages/README.md) |
| `validator.yml` workflow runs | build https://github.com/domios-dev/agentic-team-protocol/actions/runs/43468853771 (success, at `d2db069610800fed454668c44ea58b97623c5ffc`; the schema, WebAssembly module and release binaries come from it); pull request #14 head https://github.com/domios-dev/agentic-team-protocol/actions/runs/43470288001 (success, at `b78e04dd11dada345bc1e050841d4ff5a0c91932`) |
| Pages workflow run | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43471124152 (success) |
| Conformance workflow run at that commit | https://github.com/domios-dev/agentic-team-protocol/actions/runs/43471124135, attempt 1 failed: it ran before the release recreation, installed the old release binaries, and each of the three clean consumers stopped because that binary's SHA-256 is not recorded in validator/README.md (Same results on every platform skipped) |
| Conformance rerun on `main` after the release recreation | the same run, attempt 2: success; Clean consumer (ubuntu-24.04), Clean consumer (macos-15), Clean consumer (windows-2025) and Same results on every platform all green |
| DEV team check and export receipts, `com.example/research-desk` `2.1.0` | exported by a Domios development build at `16d5277f4ff083d487a7c55ba351f9bb72b8f084` (`team export --format yaml`, `team`, `folder`); `team check` valid with no diagnostics on each form; a second export byte-identical (packages/README.md). Served SHA-256 equal the recorded exports: `research-desk.team.yaml` `037165fc8f812b5899e214e76da2c6ea64f3b3d1ba8d7cb90e62f46ba51f31c1`, `research-desk.team` `783fd17bfd89462cf4964594114f97ccf51e2fddb69bbb29ea40aaa3c77cb1bb`, `research-desk/team.yaml` `d31b57c2a48976456433b6e57f78dc884cf4b4e637948feb1e567b80b24c818b` |
| DEV team check and export receipts, `dev.domios/default` `1.0.0` | same build, commands and `team check` result (packages/README.md). Served SHA-256 equal the recorded exports: `default.team.yaml` `7c2f600f5f7599f37dfc45198ff76e408066e8b743b1b08813bb1972092fc3ce`, `default.team` `5ff976fc98a85b6391ab631157b216b2f57f0ee95ea3ba5647b5c21cbd552e88`, `default/team.yaml` `1f3fd08ef8aa2bfb921be441765b459fa9fa3540660ddc963acf5da49b02a7c9` |
| Spec version | `2026-11-11` |
| Validator version | `2026.11.11` |
| Schema URL | `https://atp.domios.dev/schema/2026-11-11/team.schema.json` |
| Schema served SHA-256 | `97b2ff9d69c70add556ba79399f8bae563098160f810ad16bdf4b0373ba0e1f5` (equals PROVENANCE.md) |
| `catalog.json` served SHA-256 and `source_commit` | `044ed94f11abea85494f7d3b5ba7e6e5cb1c6817200ec1aba921cdbf94bf3b09`, `source_commit` `7b33488fb87d3bd5341458ae84b391d9e71d8e0d` (the published commit), 2 entries |
| Validator release | tag at the published commit; all four binaries and `SHA256SUMS` as in the release replacement log above |
| Install without Domios | passed, see below |
| `check-served.mjs` result | exit 0, 91 served files checked, no notes |

`check-served.mjs` output, from a clean clone of `main` checked out at
`7b33488fb87d3bd5341458ae84b391d9e71d8e0d` (no local changes), 2026-11-13 17:20 UTC:

```text
checked 91 served files under https://atp.domios.dev/

Evidence:
  spec version: 2026-11-11
  validator version: 2026.11.11
  schema URL: https://atp.domios.dev/schema/2026-11-11/team.schema.json
  schema served SHA-256: 97b2ff9d69c70add556ba79399f8bae563098160f810ad16bdf4b0373ba0e1f5
  catalog.json served SHA-256: 044ed94f11abea85494f7d3b5ba7e6e5cb1c6817200ec1aba921cdbf94bf3b09 (source_commit 7b33488fb87d3bd5341458ae84b391d9e71d8e0d, 2 entries)

all served bytes match the recorded checksums
```

### Install without Domios

On Windows, in a new empty directory with `HOME` pointing to a new empty directory, the
PowerShell install snippet of validator/README.md ran verbatim and exited 0; the installed
`atp-validate.exe` has SHA-256
`f1da9f500caacda004545332a0224428906cc5dcd64a94c6449b1215aaf2eacc`. With only that
directory and the Windows system directory on `PATH` (no Domios), it validated the three
forms of `com.example/research-desk` `2.1.0` and the input of `examples/invalid/missing-role-kind`,
all downloaded from `https://atp.domios.dev` (every package file's SHA-256 equal to
`catalog.json`):

```text
$ atp-validate pkg/research-desk.team.yaml
valid com.example/research-desk@2.1.0 (0 warning(s))
exit=0
$ atp-validate pkg/research-desk.team
valid com.example/research-desk@2.1.0 (0 warning(s))
exit=0
$ atp-validate pkg/research-desk
valid com.example/research-desk@2.1.0 (0 warning(s))
exit=0
$ atp-validate invalid/input.team.yaml --json
{
  "format": "yaml",
  "valid": false,
  "name": "com.example/missing-role-kind",
  "version": "1.0.0",
  "diagnostics": [
    {
      "code": "missing_role_kind",
      "severity": "error",
      "file": "team.yaml",
      "path": "roles.researcher.kind",
      "line": 13,
      "column": 16,
      "message": "`roles.researcher.kind` is required: `manager` or `worker`"
    }
  ]
}
exit=1
```

The served `expected.yaml` lists one error, `missing_role_kind` at `roles.researcher.kind`
line 13 column 16, and no warnings; the report has exactly that diagnostic. Its `file` is
`team.yaml` because the validator names a single file `team.yaml`, the mapping
`scripts/conformance.mjs` applies.
