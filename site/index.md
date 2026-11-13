# Agentic Team Protocol

The Agentic Team Protocol is an open format for portable AI agent teams. One package
describes a whole team so that any host that implements the format can start it:

- **Roles**: one map of named roles, each a manager or a worker, with exactly one
  orchestrator. A team has exactly the roles its package lists
  ([section 10](spec/2026-11-11/index.md#10-roles)).
- **Instructions**: each role carries its own. Text a host adds at runtime is appended by
  the host and is never part of a package
  ([section 13](spec/2026-11-11/index.md#13-host-runtime-text)).
- **Models**: an optional, ordered list of `harness:model` ids per role, or a reference to
  another role's model ([section 10.5](spec/2026-11-11/index.md#105-model)).
- **Payload**: reference files, memory items, skills and automation that travel with the
  team ([section 9](spec/2026-11-11/index.md#9-payload-block)).
- **Start asks**: the permissions a team needs and the secrets it uses, by name only, so the
  host can ask its owner before starting it
  ([section 8](spec/2026-11-11/index.md#8-start-asks-block)).

A package is one YAML file, a ZIP archive or a folder
([section 4](spec/2026-11-11/index.md#4-package-forms)).

## Scope

The format standardizes the package only: its roles with their kind, start, model and
instructions, and the files, skills and tools the team carries. It does not standardize
orchestration commands. Role instructions are opaque text for the host, so a package built
for one host may use that host's commands, as `dev.domios/default` uses Domios plan,
dispatch and report commands. See
[Scope: package format only](spec/2026-11-11/index.md#108-scope-package-format-only) and the
informative [Future direction](spec/2026-11-11/index.md#141-future-direction-informative)
note.

## Contents

- [Specification](spec/): the normative format rules, versioned by date. Each dated
  version keeps its own URL, and the newest is the current version. A companion page
  describes [host behaviour](spec/2026-11-11/host-behaviour.md) (non-normative).
- [Packages](packages/): published packages, served byte-for-byte as committed.
- [Examples](examples/): example inputs, including invalid packages with their expected errors.
- [Catalog](catalog/): a static, read-only JSON index of published packages, generated in CI.
- [License](LICENSE.txt): the specification is licensed under Apache-2.0. Each package
  carries its own license in its `license` field.

Site address: https://atp.domios.dev/

## Generated artifacts

These artifacts are generated from the reference implementation, not written by hand
([section 16](spec/2026-11-11/index.md#16-generated-artifacts)), and licensed under
Apache-2.0:

- [JSON Schema](schema/2026-11-11/team.schema.json) for specification version
  2026-11-11, at its immutable URL
  `https://atp.domios.dev/schema/2026-11-11/team.schema.json`.
- [Conformance corpus](corpus/2026-11-11/): valid and invalid packages for specification
  version 2026-11-11, with the codes each case expects in `cases.json`.
- [Reference validator](validator/): the `atp-validate` command-line tool and a
  WebAssembly module, usable without Domios.

## Reference implementation

Domios is the reference implementation of the Agentic Team Protocol and uses the format for
its own teams. Domios is not required to read, write, validate or host a package: the format
is open to any host.
