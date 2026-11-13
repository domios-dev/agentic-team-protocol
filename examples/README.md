# Agentic Team Protocol conformance fixtures

These fixtures check the package format only. They never test what a host does with
a team, and role instructions in a fixture are opaque text (specification
[scope](../spec/2026-11-11/index.html#108-scope-package-format-only); see also its
[future direction](../spec/2026-11-11/index.html#141-future-direction-informative)).

Each case directory holds one input in the form it tests (`input.team.yaml`, `input/`
folder or `input.team` ZIP) and an `expected.yaml`:

- `invalid/`: inputs that must be refused.
- `warnings/`: valid inputs that must report the listed warnings and no errors.

`expected.yaml` lists every diagnostic of its input. For each one it gives:

- the rule;
- where the specification states it: `spec_section` and a verbatim `quote`;
- the location: file, YAML path or archive entry, line;
- the severity and the code;
- the source of the code: `corpus_case` (a case of the conformance corpus that defines
  the same rule) or `validator_run` (a recorded run of the reference validator).

Rules and codes are defined only in the specification, not here. See its
[error and warning conditions](../spec/2026-11-11/index.html#15-error-and-warning-conditions),
which also say what an implementation must match for a case, and its
[generated artifacts](../spec/2026-11-11/index.html#16-generated-artifacts).

To run the cases against the reference validator, use
[`scripts/conformance.mjs`](https://github.com/domios-dev/agentic-team-protocol/blob/main/scripts/conformance.mjs).
Its header gives the usage. Two more scripts generate and check the archive cases
(`zip-entry-dotdot`, `zip-entry-absolute`, `unreferenced-zip-entry`):

- [`scripts/pack-team.mjs`](https://github.com/domios-dev/agentic-team-protocol/blob/main/scripts/pack-team.mjs)
  declares their entries and generates them.
- [`scripts/check-forms.mjs`](https://github.com/domios-dev/agentic-team-protocol/blob/main/scripts/check-forms.mjs)
  checks that a re-pack is byte-identical.

Authored fixtures use `com.example` identities and a neutral author.
