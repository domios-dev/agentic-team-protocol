# Agentic Team Protocol

The Agentic Team Protocol is an open format for portable AI agent teams. One package
describes a whole team so that any host that implements the format can start it:

- **Managers**: fixed slots with known duties. Every team has an orchestrator; planner,
  cartographer and curator are optional, and an omitted slot falls back to the host's default.
- **Workers**: freely named roles, started on demand unless they say otherwise.
- **Models**: an optional, ordered list of `harness:model` ids per role, or a reference to
  another role's model. A role without models leaves the choice to the host and its owner.
- **Files**: reference files, memory items, skills and automation that travel with the team.
- **Consent asks**: the permissions a team needs (network, repository writes, shell, browser)
  and the secrets it uses, by name only, so the host can ask its owner before starting it.

Each role carries its own instructions. Text a host adds at runtime is appended by the host
and is never part of a package, so packages stay portable between hosts.

## Three package forms

The format defines three equivalent forms. A published version may lack the single-file form when its package does not ship one.

| Form | Layout |
| --- | --- |
| `name.team.yaml` | One YAML file with everything inline. The default export and exchange form. |
| `name.team` | A ZIP archive with `team.yaml` at its root plus only the files `team.yaml` references. |
| Folder | The same layout as the ZIP archive. |

Binary assets, such as a PNG icon, need the archive or folder form.

## Specification

The specification is versioned by date, and each dated version keeps its own URL. The
[current specification](spec/) is the newest dated version.

- [Specification](spec/): normative format rules, published by date.
- [Packages](packages/): published packages, served byte-for-byte as committed.
- [Examples](examples/): example inputs, including invalid packages with their expected errors.
- [Catalog](catalog/): a static, read-only JSON index of published packages, generated in CI.
- [License](LICENSE.txt): the specification is licensed under Apache-2.0. Each package
  carries its own license in its `license` field.

Site address: https://atp.domios.dev/

## Generated artifacts

These artifacts are generated from the reference implementation, not written by hand:

- [JSON Schema](schema/2026-11-11/team.schema.json) for specification version
  2026-11-11 (JSON Schema draft-07), at its immutable URL
  `https://atp.domios.dev/schema/2026-11-11/team.schema.json`.
- [Conformance corpus](corpus/2026-11-11/): valid and invalid packages for specification
  version 2026-11-11, with the codes each case expects in `cases.json`.
- [Reference validator](validator/): the `atp-validate` command-line tool and a
  WebAssembly module, usable without Domios.

Like the specification, these artifacts are licensed under Apache-2.0.

## Reference implementation

Domios is the reference implementation of the Agentic Team Protocol and uses the format for
its own teams. Domios is not required to read, write, validate or host a package: the format
is open to any host.
