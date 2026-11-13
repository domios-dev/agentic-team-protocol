# Agentic Team Protocol

The Agentic Team Protocol is an open format for portable AI agent teams. One package
describes a whole team: one map of roles, each a manager or a worker with its own
instructions and optional models, the files, memory, skills and automation it brings, and
the permissions and named secrets it asks its host to grant. The
[specification](spec/2026-11-11/index.md) defines the format and its three equivalent
package forms. Domios is the reference implementation; any host can implement the format.

The format standardizes the package, not orchestration. Role instructions are opaque text
for the host, so a package built for one host may use that host's commands; see
[Scope: package format only](spec/2026-11-11/index.md#108-scope-package-format-only).

Site: https://atp.domios.dev/

## Repository layout

| Path | Contents |
| --- | --- |
| `spec/<YYYY-MM-DD>/` | The specification, versioned by date ([section 3](spec/2026-11-11/index.md#3-versioning)), and its non-normative host behaviour page. |
| `packages/<scope>/<name>/<version>/` | Published packages; see [packages/README.md](packages/README.md). |
| `examples/` | Example inputs, including invalid packages with their expected errors; see [examples/README.md](examples/README.md). |
| `schema/<YYYY-MM-DD>/` | The generated JSON Schema for that specification version. |
| `corpus/<YYYY-MM-DD>/` | The generated conformance corpus for that specification version. |
| `validator/` | The generated reference validator: installation and use, and the WebAssembly build; see [validator/README.md](validator/README.md). |
| `site/` | Overview page, page template and styles for the static site. |
| `scripts/` | The site build, the catalog generator and the checks CI runs. |
| `.github/workflows/` | `pages.yml` builds and checks the site on every pull request and deploys it from `main` when the owner enables publication, `conformance.yml` runs the reference validator over everything published, `validator.yml` builds the generated artifacts from a pinned Domios commit. |
| `PROVENANCE.md` | Source commit, generator command and SHA-256 of every generated artifact. |
| `PUBLICATION.md` | Evidence that the published site serves the recorded bytes. |
| `CHANGELOG.md`, `CONTRIBUTING.md` | Change history and contribution rules. |

The JSON Schema, conformance corpus and reference validator are generated from the
Domios reference implementation and never edited by hand; see [PROVENANCE.md](PROVENANCE.md).

## Building the site

Requires Node.js 22.

```sh
npm ci
npm run build
node scripts/check-links.mjs
node scripts/check-links.mjs --markdown
```

The build writes a static site to `_site/`. Missing or empty `spec/`, `packages/` and
`examples/` directories are allowed. `scripts/check-links.mjs` fails when an internal
link or anchor in `_site/` does not resolve; with `--markdown` it checks the links of
the repository Markdown the site does not render, as GitHub shows it.

## License

The Agentic Team Protocol specification is licensed under the Apache License 2.0; see
[LICENSE](LICENSE). The generated JSON Schema, conformance corpus and reference validator
are licensed under the Apache License 2.0 as well; see
[PROVENANCE.md](PROVENANCE.md#licenses). Each package carries its own license.
