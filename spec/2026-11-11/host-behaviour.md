# Agentic Team Protocol: host behaviour (non-normative), version 2026-11-11

> **Non-normative.** This page describes how a host treats an Agentic Team Protocol package, using Domios as the reference host. Nothing here is a conformance requirement of the package format, and RFC 2119 keywords are not used here. The portable format is defined only in [index.md](index.md). This specification defines no permission authority: a package asks, and each host decides what to grant under its own policy.

## 1. Portable format and host policy

The package format ([index.md](index.md)) says what a package contains and when it is valid. Everything else is host policy:

- what a host grants
- where secret values come from
- how teams start, recover and are updated
- which models are chosen
- how packages are found
- which orchestration commands roles use, for example to dispatch tasks, edit plans, review work and report results

Hosts can differ on all of these points and still read the same packages.

To the format, role instructions are opaque text for the host ([index.md section 10.8](index.md#108-scope-package-format-only)). A package built for one host may use that host's commands: the instructions of `dev.domios/default` use Domios plan, dispatch and report commands, so that package is written for Domios. Another host can read and validate it, but it may not be able to run those roles as intended. A possible future direction, typed host capabilities that packages declare, is described in [index.md section 14.1](index.md#141-future-direction-informative).

## 2. Practices for any host

### 2.1 Imported permissions start at zero

A package's `permissions`, `secrets`, `requires` and `inputs` are requests, not grants. Domios grants nothing by default when it imports a package. A package from another person counts as unverified and starts with zero default grants. It goes through the same owner preview and consent as any package that needs new grants. Opening a preview is not consent.

### 2.2 Secrets by name only

A package names the secrets it needs (`secrets[].name`, with `purpose` and `required`). It never carries their values. The host binds each named secret to a value from its own local secret store, on the machine where the role runs. Exports leave out every secret value, from instructions, files, memory and skills alike. Secret values never travel with a package and never cross machines with it.

Domios also refuses to import a package that carries a secret value in its text, instructions included, even when the package is valid. This is host safety policy, not a format diagnostic: the package format treats instructions as opaque ([index.md section 10.8](index.md#108-scope-package-format-only)), and another host may apply a different import policy.

### 2.3 Version updates never change running teams

A package version is immutable once published. Domios pins each team's role registrations to the package identity (`name` and `version`). A new package version, or an updated template, does not change a team that is already running. Re-running a start on an existing team skips the managers and registrations that already exist and reports them. A registration pinned to a different package version is reported and never overwritten.

### 2.4 Runtime recovery

- If a manager fails to start, for example because no usable model or harness is available, the failure goes back to the caller.
- Once the orchestrator is up, any later start failures go to it once, as one summary of the roles that started and the roles that failed, with reasons. The host does not retry silently.
- The orchestrator recovers through respawn and model substitution, and asks the owner about anything outside its own authority.
- If a model becomes unusable mid-run (sign-out, quota, removal), the coordinator is respawned on the next eligible model in the role's list. When the list runs out, the owner is asked.
- A peer that goes offline before or during a run is reported explicitly. There is no false-ready member, no duplicate Worker and no blind replay.

### 2.5 Literal instructions plus host runtime text

A role's instructions reach the agent exactly as written: nothing is substituted. The host then appends its own runtime text per kind (managers, workers) and, for a built-in manager name that the package lists, per that name. In Domios this text is the primer, routing contract, AgentPad, plan-task flags, Worker context, rendering and reporting rules. Package instructions cannot replace or override host text: the host text is appended after them, never replaced by them. The host runtime text is never written into an exported package.

### 2.6 Default-package semantics

When a team is created without a package, Domios uses its builtin default package, `dev.domios/default`. It is an ordinary package: Domios starts exactly the roles it lists, as for any other package. Its roles behave as follows:

- The managers `orchestrator` and `planner` (`with_team`) start with the team.
- The manager `cartographer` (`on_demand`) and the workers `worker`, `qa`, `reviewer` and `release_manager` (`on_demand`) are registered, not pre-spawned. The orchestrator starts them when it needs them.
- The manager `curator` runs on its `45m..2h` schedule with `model: {same_as: orchestrator}`.
- Every role carries its own instructions in the package.
- The package defines no other models. The owner picks a model for each `with_team` manager at start, and workers use the host's dispatch defaults.
- Teams with no role registrations, including Teams restored from before packages existed, resolve to the default package.

A team started from any other package has only that package's roles. Domios adds no manager or worker to it and fills in no field from its own role definitions ([index.md section 10.7](index.md#107-a-team-has-exactly-its-listed-roles)).

## 3. Domios-specific behaviour

The rest of this page describes Domios as the reference host. Other hosts are not expected to copy it.

### 3.1 Team lifecycle

- A template is one package in any of its three forms. Starting a team from a template uses Domios's existing Team-creation primitive. Without a template, it uses the builtin default package. There is no separate template rail and no pre-spawned fleet.
- On start, Domios creates the `with_team` roles and records the remaining roles in a durable, per-Team role-registration store. That store survives restart and restore.
- The orchestrator starts registered `on_demand` roles when it needs them, through ordinary `agent spawn --role` and `plan task dispatch --role`, including on mesh peers.
- Domios runs scheduled rounds only for `curator`. It refuses a schedule on any other role (`schedule_unsupported_role`). This is Domios host policy, not a format error: the format allows a schedule on any manager.
- Payload items are applied at start:
  - `files` land in the Team's knowledge directory and are listed, with their descriptions, in role prompts.
  - `memory` items are seeded into `domios mem`, scoped to the Team.
  - `skills` register as Team-scoped skills.
  - `automation` is applied as Domios Blueprints.
  - The preview lists every payload item with a per-item opt-out and flags scripts as executable. Items the owner opts out of are never applied.
- The `x-domios` extension holds only Domios-specific keys, such as `min_version`. Other hosts ignore it.
- `domios team check` validates all three forms. `team export` and "Save as template" write any form (`--format yaml|team|folder`; yaml by default). A binary asset such as a PNG icon requires `team` or `folder`. Export, then import, then export is byte-identical. Baking a team records `derived_from` from the template it started from. The exporter shows a scrub report of the personal data and secrets it removed.

### 3.2 Authority

- Domios's built-in manager names are `orchestrator`, `planner`, `cartographer` and `curator`. When a package lists one of them, that manager carries the duties and authority that Domios attaches to the name. The authority comes from the host, never from the package.
- A built-in manager name that the package does not list is absent from the team. Domios does not stand in for it.
- A manager with any other name is a custom manager. It gets no Domios authority, and it works through the orchestrator. It starts as its `start` says, like any manager: a `with_team` custom manager starts with the team, and an `on_demand` custom manager waits for the orchestrator to start it.
- Role precedence is task > team. A task's personality, role guidance and model override the role's own.
- Machine placement is Domios registration data that the owner chooses. Packages do not set it.

### 3.3 Consent

- The Domios server enforces consent. A package that is unverified, or that needs new grants, starts only with a recorded owner decision issued by the preview.
- Missing inputs are gathered first.
- Domios's General agent asks the owner for choices and never grants permissions to itself.
- An unresolved skill reference is shown as a warning in the preview and returned by start. A malformed package is refused.

### 3.4 Model policy

- One decision service chooses each role's model. It takes the role's model list, the target machine's catalogue and the role's hard needs (reasoning effort, `requires.harnesses`, tool presence). It returns the chosen model with a reason, ranked eligible alternatives, or a blocked reason.
- Falling back within the role's list happens automatically and is always shown to the owner. A model outside the list needs a human pick.
- A `with_team` manager with no model gets the owner's pick at start. A worker with no model uses the dispatch defaults.
- `{same_as: <role>}` resolves to that role's resolved model on the target machine.
- An unsupported `reasoning` value is quietly clamped to the nearest supported value.
- Renamed model ids get ranked suggestions of close ids. Remote roles use the target peer's catalogue.
- Owner choices are kept in the Team's registrations or in local preferences, never in the package.
- Domios clamps a valid curator `schedule` range to its own bounds and keeps the existing Curator modes (Auto, Heartbeat, Off). Clamping is host policy. It is not a format error: the format rejects only malformed durations and a `<min>` greater than `<max>`.

### 3.5 Memory recall

Builtin and saved templates are indexed in `domios mem` by `title`, `description` and `when`. When a team is created, Domios suggests the best-matching template first, and the default package is always available as a fallback. There is no separate search index.
