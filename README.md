# Agentic Team Protocol

The Agentic Team Protocol is an open format for portable AI agent teams. One package
describes a whole team: one map of roles, each a manager or a worker with its own
instructions and optional models, the files, memory, skills and automation it brings, and the permissions and named
secrets it asks its host to grant. The format defines three equivalent forms: a single
`name.team.yaml` file, a `name.team` ZIP archive, or a folder with the same layout. A
published version may lack the single-file form when its package does not ship one. Domios is
the reference implementation; any host can implement the format.

Site: https://atp.domios.dev/

## Repository layout

| Path | Contents |
| --- | --- |
| `spec/<YYYY-MM-DD>/` | The specification, versioned by date. The newest date is the current version. |
| `packages/<scope>/<name>/<version>/` | Published packages, served byte-for-byte as committed. |
| `examples/` | Example inputs, including invalid packages with their expected errors. |
| `schema/<YYYY-MM-DD>/` | The JSON Schema for that spec version, generated from the Domios reference implementation and committed byte-for-byte. Immutable once published. |
| `corpus/<YYYY-MM-DD>/` | The conformance corpus for that spec version, generated from the Domios reference implementation and committed byte-for-byte. Immutable once published. |
| `validator/` | The reference validator: installation and use, and the WebAssembly build. |
| `.github/workflows/validator.yml` | Builds the validator, the WebAssembly module and the JSON Schema from a pinned Domios commit, as workflow artifacts. |
| `PROVENANCE.md` | Source commit, generator command and SHA-256 of every generated artifact. |
| `site/` | Overview page, page template and styles for the static site. |
| `scripts/build-site.mjs` | Builds the static site into `_site/`. |
| `.github/workflows/pages.yml` | Builds the site on every pull request and push to `main`; deploys to GitHub Pages only from `main` when the owner enables publication. |
| `CHANGELOG.md`, `CONTRIBUTING.md` | Change history and contribution rules. |

The JSON Schema, conformance corpus and reference validator are generated from the
Domios reference implementation; see [PROVENANCE.md](PROVENANCE.md).

## Building the site

Requires Node.js 22.

```sh
npm ci
npm run build
```

The build writes a static site to `_site/`. Missing or empty `spec/`, `packages/` and
`examples/` directories are allowed.

## License

The Agentic Team Protocol specification is licensed under the Apache License 2.0; see
[LICENSE](LICENSE). The generated JSON Schema, conformance corpus and reference validator
(`schema/`, `corpus/`, `validator/`) are licensed under the Apache License 2.0 as well; see
[PROVENANCE.md](PROVENANCE.md#licenses). Each package carries its own license.
