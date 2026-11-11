# Agentic Team Protocol: package format, version 2026-11-11

- **Version:** 2026-11-11
- **Status:** Draft. This version stays a draft until its first publication on the Agentic Team Protocol site. After that publication its text is immutable, and any change requires a new dated version.
- **Companion page:** [Host behaviour (non-normative)](host-behaviour.md)
- **Generated artifacts:** the JSON Schema (`$schema` URL), stable error codes, conformance corpus and reference validator are pending: generated from the Domios reference implementation (see [section 16](#16-pending-generated-artifacts)).

## 1. Scope

The Agentic Team Protocol defines a portable package that describes an agent team: its identity, what it asks a host for at start, the content it carries, its manager roles and its worker roles. This document defines the package format and the rules a conforming reader and writer follow. A host's runtime policy is not part of this format. The companion page [host-behaviour.md](host-behaviour.md) describes how a host treats a package and uses Domios as the reference host. That page is non-normative.

Version 2026-11-11 covers managers and workers with per-role instructions, plus optional files, memory, skills and automation. It defines no plan, spec or task templates and no plan export (see [section 14](#14-out-of-scope-for-this-version)).

## 2. Conventions and terms

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in BCP 14 ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals, as shown here.

- **Package:** one Agentic Team Protocol team definition in one of the three forms of [section 4](#4-package-forms).
- **Package document:** the YAML document that defines the package. It is the whole `name.team.yaml` file, or the root `team.yaml` entry of a ZIP or folder package.
- **Reader:** software that parses and validates a package, such as a validator or a host's importer.
- **Writer:** software that produces a package, such as a host's exporter.
- **Host:** software that starts a team from a package. Domios is the reference host.
- **Role:** one manager slot or one worker definition ([section 10](#10-managers-and-workers)).
- **Reference:** a package-relative path or name inside the package document that points at other package content ([section 4.4](#44-references)).
- **Error:** a condition that makes a package invalid. A reader MUST refuse an invalid package.
- **Warning:** a condition that a reader MUST report and that leaves the package valid.

Error and warning conditions are named by the rule that defines them. [Section 15](#15-error-and-warning-conditions) lists them. Their stable error codes are pending.

## 3. Versioning

1. This specification is versioned by date (`YYYY-MM-DD`). The version of this document is 2026-11-11.
2. A dated version is a draft until its first publication on the Agentic Team Protocol site. After that publication its text MUST NOT change. A change requires a new dated version.
3. Package versions are separate from specification versions. A package carries its own `version` ([section 7](#7-identity-block)).

## 4. Package forms

One package has three forms. Each form carries the same package document and the same content.

| Form | Name | Layout |
|---|---|---|
| Single file | `<name>.team.yaml` | One YAML file with all content inline. |
| ZIP archive | `<name>.team` | A ZIP archive with exactly one `team.yaml` at its root, plus only the files that `team.yaml` references. |
| Folder | `<name>/` | A directory with the same layout as the ZIP archive: exactly one root `team.yaml`, plus only referenced files. |

### 4.1 Single-file form

1. A `.team.yaml` file is the package document itself. All package content is inline.
2. Content that can only be carried by path, including any binary file such as a PNG, needs the ZIP or folder form ([section 9.1](#91-files), [section 7.1](#71-icon)).

### 4.2 ZIP and folder forms

1. A ZIP or folder package MUST contain exactly one `team.yaml` at its root. That entry is the package document.
2. Every other entry MUST be a file that the package document references ([section 4.4](#44-references)). An unreferenced entry is an error (**unreferenced entry**).
3. Every entry path MUST be relative. A path containing a `..` segment, an absolute path, and a symbolic link are errors (**unsafe path**).
4. A referenced file that is missing from the package is an error (**missing referenced file**).
5. A writer MUST write ZIP entries in a deterministic order, so that export, then import, then export again produces byte-identical output. The exact ordering is pending: generated from the Domios reference implementation.

### 4.3 Bounds

A package has explicit bounds on size and entry count. A reader MUST refuse a package that exceeds a bound (**bound exceeded**) before it admits any of the package's content. The bound values are pending: generated from the Domios reference implementation.

### 4.4 References

A package document refers to other package content through these keys:

| Key | Refers to |
|---|---|
| `icon` | A package-relative SVG or PNG file ([section 7.1](#71-icon)). |
| `files[].path` | A package file. With `content`, the file is inline. Without `content`, the file is a ZIP or folder entry at that path ([section 9.1](#91-files)). |
| `skills[].path` | A skill folder holding a `SKILL.md` ([section 9.3](#93-skills)). |
| `skills[].files[].path` | A file that belongs to an inline skill. |
| `automation[].path` | A host-defined automation file ([section 9.4](#94-automation)). |
| role `files[]` | A package file ([section 10.3](#103-role-fields)). |
| role `instructions_file` | A file that holds the role's instructions ([section 10.6](#106-instructions)). |
| role `skills[]` | A package skill, by name. An unresolved name is a warning, not an error ([section 10.3](#103-role-fields)). |
| role `model: {same_as: <role>}` | Another role in the same package ([section 10.5](#105-model)). |

Paths are package-relative. They follow the safety rule of [section 4.2](#42-zip-and-folder-forms).

## 5. YAML rules

1. A package document MUST be YAML 1.2.
2. A package document MUST NOT contain anchors or aliases (**YAML anchor or alias**).
3. A mapping MUST NOT contain a duplicate key (**duplicate key**). Two definitions of the same manager slot or worker name are duplicate keys.
4. Tabs MUST NOT be used for indentation (**tab indentation**).
5. A reader MUST normalize CRLF line endings to LF. A writer MUST write LF line endings.
6. A writer MUST write multi-line text as a literal block scalar (`|`). When the first line of the text starts with whitespace, the writer MUST add an indentation indicator (for example `|2`). Readers accept the other YAML 1.2 scalar styles: the canonical reference package writes its `description` as a folded scalar (`>-`).
7. Text is literal. A host MUST NOT perform interpolation or placeholder substitution in instructions or other text. A brace sequence such as `{name}` is ordinary text.
8. A document that is not well-formed YAML is an error (**malformed YAML**).
9. Size bounds apply to the package document and to inline text ([section 4.3](#43-bounds)).

## 6. Top-level structure

The package document is a mapping. Its top-level blocks, in canonical order, are:

| # | Block | Keys, in canonical order |
|---|---|---|
| 1 | Identity | `name`, `version`, `title`, `description`, `icon`, `authors`, `links`, `license`, `when`, `derived_from` |
| 2 | Start asks | `project`, `requires`, `inputs`, `permissions`, `secrets` |
| 3 | Payload | `files`, `memory`, `skills`, `automation` |
| 4 | Managers | `managers` |
| 5 | Workers | `workers` |
| 6 | Extensions | `x-*` |

1. A writer MUST emit top-level keys in this canonical order.
2. The REQUIRED keys are `name`, `version`, `description` and `managers.orchestrator`. All other top-level keys are OPTIONAL. A missing required key is an error (**missing required key**).
3. Every top-level key that does not start with `x-` MUST be one listed above. An unknown key is an error (**unknown key**). A top-level `coordinator` or `planner` key, for example, is unknown. Manager slots exist only under `managers`.
4. Every key has the type that this document gives it. A value of the wrong type, or a value outside its enumeration, is an error (**invalid value**).
5. Keys that earlier drafts of the format used are rejected as removed fields ([section 11](#11-removed-fields)).

A minimal valid package (neutral example):

```yaml
name: com.example/minimal
version: 1.0.0
description: Smallest valid Agentic Team Protocol package.
managers:
  orchestrator:
    instructions: |
      Agree the goal with the owner, then delegate one task per worker.
```

## 7. Identity block

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | required | none | The package identity, written as a reverse-DNS scope, a `/`, and a package name. Examples: `com.example/research-desk`, `dev.domios/default`. |
| `version` | string | required | none | A semantic version (`MAJOR.MINOR.PATCH`), for example `2.1.0`. |
| `title` | string | optional | none | A human-readable title, for example `Research desk`. |
| `description` | string | required | none | What the team does. |
| `icon` | string (path) | optional | none | A package-relative SVG or PNG file. See [section 7.1](#71-icon). |
| `authors` | list of author objects | optional | none | See the author table below. |
| `links` | mapping | optional | none | Keys `homepage`, `repository`, `issues`, `docs`. Each value is a URL string. Each key is optional. |
| `license` | string | optional | none | The package's own license, for example `Apache-2.0`. It is separate from the license of this specification. |
| `when` | list of strings | optional | none | Requests the team is meant for, for example `research a market question`. A host can use them to match the package to a request. |
| `derived_from` | mapping | optional | none | The package this one was derived from, with keys `name` (same reverse-DNS form as top-level `name`) and `version` (a semantic version). |

Author object (`authors[]`):

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | required | none | A person's or organisation's name. |
| `email` | string | optional | none | An email address. |
| `url` | string | optional | none | A URL. |
| `role` | string | optional | none | One of `author`, `maintainer`, `contributor`. |

Canonical example (from `com.example/research-desk` 2.1.0):

```yaml
derived_from:
  name: com.example/research-desk
  version: 2.0.3
```

### 7.1 Icon

1. `icon` is a package-relative path to an SVG or PNG file.
2. A reader MUST validate the icon by its content, not by its file name. A missing target, or a target that is not an SVG or PNG image, is an error (**invalid icon**).
3. In the single-file form, an SVG icon MAY be inline: it is carried by a `files` entry whose `path` equals the `icon` path and which has `content` ([section 9.1](#91-files)).
4. A PNG icon needs the ZIP or folder form.

Canonical example:

```yaml
icon: assets/icon.svg
files:
  - path: assets/icon.svg
    description: Package icon
    content: |
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">...</svg>
```

## 8. Start-asks block

The start asks are what the package asks a host for before the team starts. A package asks, and the host decides what to grant. This specification defines no permission authority: no field grants anything by itself (see [host-behaviour.md](host-behaviour.md)).

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `project` | string | optional | not specified in this version | One of `required`, `none`. |
| `requires` | mapping | optional | none | The only key is `harnesses`. |
| `requires.harnesses` | list of strings | optional | none | Harness ids the team needs, for example `[claude, codex]`. The harness id is the part before `:` in a model id ([section 10.5](#105-model)). |
| `inputs` | mapping of input key to input | optional | none | Each value is the short or full form below. |
| `permissions` | mapping | optional | nothing asked | See the permissions table below. |
| `secrets` | list of secret objects | optional | none | See the secrets table below. |

Input value (`inputs.<key>`). Canonical keys: `question` (short form) and `depth` (full form).

| Form | Type | Meaning |
|---|---|---|
| Short | string | The input's description, for example `question: The market question to research`. |
| Full | mapping | Keys `description` (string), `required` (boolean), `default` (a value), `choices` (list of allowed values). |

Canonical full form:

```yaml
inputs:
  depth:
    description: How deep to go
    required: false
    default: standard
    choices: [quick, standard, deep]
```

Which keys of the full form are required, and the defaults of `required` and `default`, are not specified by the canonical sources. They are pending: generated from the Domios reference implementation.

Permissions (`permissions`):

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `network` | boolean, or list of host patterns | optional | not asked | `true` asks for network access, `false` asks for none. A list asks for those hosts only. A host pattern may use a `*` wildcard, for example `"*.wikipedia.org"`. |
| `repo_write` | boolean | optional | not asked | Asks to write to the project repository. |
| `shell` | boolean | optional | not asked | Asks for shell access. |
| `browser` | boolean | optional | not asked | Asks for browser access. |

Secret object (`secrets[]`):

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | required (it identifies the secret) | none | The secret's name, for example `SEARCH_API_KEY`. |
| `purpose` | string | pending | none | Why the team needs the secret. |
| `required` | boolean | pending | pending | Whether the team needs the secret in order to start. |

A package carries secret names only. A package MUST NOT contain a secret value.

## 9. Payload block

The payload is content the package brings to the team: `files`, `memory`, `skills` and `automation`.

### 9.1 Files

`files` is a list of file entries.

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `path` | string (path) | required | none | A package-relative path. The path rules of [section 4.2](#42-zip-and-folder-forms) apply. |
| `description` | string | required | none | What the file is for. |
| `content` | string | optional | none | The file's text, inline. Without `content`, the file is a ZIP or folder entry at `path`. |

Binary files are carried by path only, so they need the ZIP or folder form. A `path` entry without `content` that has no matching entry is an error (**missing referenced file**).

### 9.2 Memory

`memory` is a list of memory items that the team starts with.

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `title` | string | pending | none | A short title. |
| `kind` | string | pending | none | One of `fact`, `rule`, `learning`. |
| `body` | string | pending | none | The memory text. |
| `tags` | list of strings | optional | none | Free tags, for example `[sources]`. The canonical reference omits `tags` on one item. |

### 9.3 Skills

`skills` is a list of skill objects. Each entry has one of two forms:

| Form | Fields | Meaning |
|---|---|---|
| Path | `path` | A package-relative folder that holds a `SKILL.md`. Canonical example: `- path: skills/market-sizing`. |
| Inline | `name` (string), `description` (string), `content` (string: the `SKILL.md` text), `files` (list of `{path, content}`) | A skill defined in the package document. `files` holds the skill's own files, for example a script. |

1. Every top-level `skills` entry MUST be an object. A bare string is an error (**bare-string skill**).
2. A role refers to a package skill by its bare name in the role's `skills` list ([section 10.3](#103-role-fields)).

Canonical inline skill:

```yaml
skills:
  - name: source-check
    description: Verify a claim against its cited source.
    content: |
      ---
      name: source-check
      description: Verify a claim against its cited source.
      ---
      1. Open the source. 2. Quote the exact sentence. 3. Mark verified, partial or wrong.
    files:
      - path: scripts/fetch.py
        content: |
          import sys, urllib.request
          print(urllib.request.urlopen(sys.argv[1]).read()[:2000])
```

### 9.4 Automation

`automation` is a list of automation entries. Their content is host-defined. A host that does not understand it MAY ignore it.

| Form | Fields | Meaning |
|---|---|---|
| Path | `path` (string), `description` (string) | A package file with host-defined automation, for example `blueprints/digest.yaml`. |
| Inline | `name` (string), `description` (string), `content` (string) | Host-defined automation text, inline. |

The text inside `content` is opaque to this format. For example, the keys `trigger` and `action` in the canonical `stale-task-nudge` entry are host-defined content, not package keys:

```yaml
automation:
  - name: stale-task-nudge
    description: Nudges the lead when a task has been idle for two hours
    content: |
      trigger: { idle_task: 2h }
      action: { notify: orchestrator }
```

## 10. Managers and workers

### 10.1 Manager slots

`managers` is a mapping from a fixed slot name to a role definition. A host knows the duties of each slot.

| Slot | Required | Default `start` | Count |
|---|---|---|---|
| `orchestrator` | required | `with_team` | exactly one |
| `planner` | optional | `with_team` | at most one |
| `cartographer` | optional | not specified in this version | at most one |
| `curator` | optional | not specified in this version | at most one |

1. `managers.orchestrator` MUST be present (**missing required key**).
2. A key under `managers` other than these four slots is an error (**unknown key**).
3. Each slot holds one role. A repeated slot is a duplicate key ([section 5](#5-yaml-rules)).
4. When the package omits an optional slot, the host's default manager for that slot applies.

### 10.2 Workers

`workers` is a mapping from a worker name to a role definition.

1. Worker names are free. Canonical names include `researcher`, `checker`, `qa`, `writer` (reference package) and `worker`, `qa`, `reviewer`, `release_manager` (default package).
2. When a worker has the same name as one of the host's builtin workers, the package's definition replaces that builtin entirely. Builtin workers that the package does not name stay available.
3. A host may run several instances of a worker. A worker that must run alone says so in its instructions.
4. Workers default to `start: on_demand`.

### 10.3 Role fields

Managers and workers use the same role fields, and only these fields. Any other key in a role is an error (**unknown key**), or (**removed field**) for the keys listed in [section 11](#11-removed-fields). Every role field is optional.

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | optional | none | A display name, for example `Lead` or `Atlas`. The canonical packages set it on managers. |
| `description` | string | optional | none | What the role does. |
| `start` | `with_team`, `on_demand`, or `{schedule: "<min>..<max>"}` | optional | `with_team` for `orchestrator` and `planner`; `on_demand` for workers | See [section 10.4](#104-start). |
| `model` | list of model ids, `{same_as: <role>}`, or omitted | optional | omitted | See [section 10.5](#105-model). |
| `reasoning` | string | optional | none | Requested reasoning effort, for example `medium` or `high`. The value set is pending: generated from the Domios reference implementation. |
| `skills` | list of strings | optional | none | Bare names of package skills ([section 9.3](#93-skills)). A name that matches no package skill is a warning, not an error (**unresolved skill reference**). |
| `tools` | list of strings | optional | none | Tool references in the form `mcp:<registry name>`, for example `mcp:io.github.example/search`. |
| `files` | list of strings (paths) | optional | none | References to package files ([section 9.1](#91-files)) that this role uses. A reference to a file the package does not contain is an error (**missing referenced file**). |
| `instructions` | string | optional | none | The role's instructions as literal text. MUST NOT appear together with `instructions_file`. |
| `instructions_file` | string (path) | optional | none | A package-relative file that holds the role's instructions. MUST NOT appear together with `instructions`. |

A role MAY narrow `skills` and `files` to itself by listing them.

### 10.4 Start

| Value | Meaning |
|---|---|
| `with_team` | The role starts when the team starts. |
| `on_demand` | The role is available. The orchestrator starts it when it is needed. |
| `{schedule: "<min>..<max>"}` | The role runs on a schedule. The interval lies between `<min>` and `<max>`, for example `45m..2h`. |

Canonical scheduled form:

```yaml
curator:
  start:
    schedule: 45m..2h
```

The canonical examples write durations with `m` (minutes) and `h` (hours). The full duration grammar is pending: generated from the Domios reference implementation. A host can clamp a schedule to its own bounds (see [host-behaviour.md](host-behaviour.md)).

### 10.5 Model

`model` has three forms:

1. **List.** An ordered list of model ids, most preferred first. A model id is a harness id, a colon, and the harness's model id (`harness:model`), for example `claude:opus` or `codex:gpt-6.1-sol`.
2. **`same_as`.** A mapping `{same_as: <role>}`. The role uses the resolved model of another role in the same package. `<role>` is a manager slot name or a worker name, for example `same_as: orchestrator`.
   - A `same_as` target that names no role in the package is an error (**unknown same_as role**).
   - A chain of `same_as` references that returns to a role already in the chain, including a role that names itself, is an error (**same_as cycle**).
3. **Omitted.** A package is valid without any model. The canonical default package defines none. When a model is omitted, the host chooses one (see [host-behaviour.md](host-behaviour.md)).

Canonical examples:

```yaml
orchestrator:
  model: [claude:opus, codex:gpt-6.1-sol]
curator:
  model:
    same_as: orchestrator
```

### 10.6 Instructions

1. Instructions are per role only. Each role carries its own `instructions` or `instructions_file`. The package has no top-level instructions and no brief.
2. The team's overall way of working is written in the orchestrator's instructions. A starting hint for the planner is written in the planner's instructions.
3. Instructions are literal text ([section 5](#5-yaml-rules), rule 7). A line inside an instructions block that looks like a key is text, not a package key. For example, the lines starting `carries:` and `principles:` in the default package's planner instructions are text.
4. `instructions_file` refers to a package file. In the ZIP or folder form it is an entry at that path. A missing file is an error (**missing referenced file**).
5. A host appends its own runtime text to a role's instructions ([section 13](#13-host-runtime-text)). Package instructions do not replace or override that text.

## 11. Removed fields

The following fields are removed from the format. A package that contains one is invalid (**removed field**):

- `kind`
- `persona`
- `extends`
- `single`
- `includes`
- `intent`
- `needs`
- `inherit`
- top-level `instructions` (a role's own `instructions` stays valid)
- top-level `instructions_file` (a role's own `instructions_file` stays valid)
- top-level `brief`

Role count is set by the group instead ([section 10.1](#101-manager-slots), [section 10.2](#102-workers)). Machine placement is not an author field in this version. Placement is host-side registration data.

## 12. Extensions

1. A top-level key that starts with `x-` is a vendor extension, for example `x-domios`.
2. A reader MUST accept extension keys and MUST NOT report them as unknown keys.
3. A host that does not own an extension MUST ignore it.
4. The content of an extension is defined by its owner. In the canonical reference package, `x-domios` holds `min_version`, a Domios-specific key:

```yaml
x-domios:
  min_version: "1.20"
```

## 13. Host runtime text

A host appends its own runtime text to a role's instructions when it composes the role's prompt. That text includes the host's primer, routing contract, reporting rules and similar runtime material. The host appends it per group (managers, workers) and per manager slot.

1. Host runtime text is never part of a package.
2. A writer MUST NOT export host runtime text into a package.
3. A package's role instructions are literal text that the host appends its runtime text to ([section 10.6](#106-instructions)).

## 14. Out of scope for this version

- Plan, spec and task templates are not part of version 2026-11-11.
- Plan export is not part of version 2026-11-11.
- Machine placement is not an author field ([section 11](#11-removed-fields)).

## 15. Error and warning conditions

Each condition below is named by its rule. Stable error codes are pending: generated from the Domios reference implementation.

| Condition | Kind | Rule |
|---|---|---|
| malformed YAML | error | [5](#5-yaml-rules).8 |
| YAML anchor or alias | error | [5](#5-yaml-rules).2 |
| duplicate key | error | [5](#5-yaml-rules).3 |
| tab indentation | error | [5](#5-yaml-rules).4 |
| missing required key | error | [6](#6-top-level-structure).2, [10.1](#101-manager-slots).1 |
| unknown key | error | [6](#6-top-level-structure).3, [10.1](#101-manager-slots).2, [10.3](#103-role-fields) |
| invalid value | error | [6](#6-top-level-structure).4 |
| removed field | error | [11](#11-removed-fields) |
| bare-string skill | error | [9.3](#93-skills).1 |
| unknown same_as role | error | [10.5](#105-model) |
| same_as cycle | error | [10.5](#105-model) |
| instructions and instructions_file both set | error | [10.3](#103-role-fields) |
| invalid icon | error | [7.1](#71-icon).2 |
| missing referenced file | error | [4.2](#42-zip-and-folder-forms).4, [9.1](#91-files), [10.3](#103-role-fields), [10.6](#106-instructions).4 |
| missing or duplicate root team.yaml | error | [4.2](#42-zip-and-folder-forms).1 |
| unreferenced entry | error | [4.2](#42-zip-and-folder-forms).2 |
| unsafe path (`..`, absolute path, symbolic link) | error | [4.2](#42-zip-and-folder-forms).3 |
| bound exceeded | error | [4.3](#43-bounds) |
| unresolved skill reference | warning | [10.3](#103-role-fields) |

A reader MUST refuse a package that has any error. A warning leaves the package valid. A host can, for example, start a team whose role names a skill that does not exist yet.

## 16. Pending generated artifacts

The following artifacts come from the Domios reference implementation. Until they are generated and published, each one is pending:

- **JSON Schema and `$schema` URL:** pending: generated from the Domios reference implementation.
- **Stable error codes** for the conditions in [section 15](#15-error-and-warning-conditions): pending: generated from the Domios reference implementation.
- **Bound values** ([section 4.3](#43-bounds)) and the **ZIP entry order** ([section 4.2](#42-zip-and-folder-forms).5): pending: generated from the Domios reference implementation.
- **Conformance corpus and reference validator:** pending: generated from the Domios reference implementation.

## 17. Examples

The published examples are the two canonical packages, each in all three forms. They are added to this repository separately at these paths:

| Package | Single file | ZIP | Folder |
|---|---|---|---|
| `com.example/research-desk` 2.1.0 (every field and form) | `packages/com.example/research-desk/2.1.0/research-desk.team.yaml` | `packages/com.example/research-desk/2.1.0/research-desk.team` | `packages/com.example/research-desk/2.1.0/research-desk/team.yaml` |
| `dev.domios/default` 1.0.0 (the default package) | `packages/dev.domios/default/1.0.0/default.team.yaml` | `packages/dev.domios/default/1.0.0/default.team` | `packages/dev.domios/default/1.0.0/default/team.yaml` |

The default package (`dev.domios/default`) defines all four manager slots and the workers `worker`, `qa`, `reviewer` and `release_manager`. It defines no models, except that `curator` uses `model: {same_as: orchestrator}`:

```yaml
managers:
  orchestrator:
    start: with_team
  planner:
    start: with_team
  cartographer:
    start: on_demand
  curator:
    start:
      schedule: 45m..2h
    model:
      same_as: orchestrator
workers:
  worker:
    description: Implements one task in its lane.
```

(Excerpt. Instructions are omitted here. Every role in the published package carries its own instructions.)

## Appendix A. Open issues (non-normative)

The canonical sources leave these points open. They are recorded here and are not resolved in this version:

1. **Path-only references in the single-file form.** The canonical `research-desk` package document contains references with no inline content: `files` entries `data/competitors.csv` and `assets/logo.png`, `skills` entry `path: skills/market-sizing`, `automation` entry `path: blueprints/digest.yaml`, and `instructions_file: workers/checker.md`. That content cannot be carried in a lone `.team.yaml` file. This version does not settle whether such a single file is valid on its own.
2. **Name of a path-form skill.** The canonical sources do not say how the name of a `{path}` skill, which role `skills` lists refer to, is determined.
3. **Required keys and defaults of nested objects.** The canonical sources do not settle these: full-form `inputs`, `secrets[].purpose` and `secrets[].required`, `memory[]`, `project`, and the default `start` of `cartographer` and `curator`. Each is marked pending in its table.
4. **Top-level key order on read.** Writers emit the canonical order. The canonical sources do not say whether a reader rejects another order.
5. **Extension keys below the top level.** This version defines `x-*` keys at the top level only.
6. **Namespace of `same_as` targets.** The canonical sources do not say whether a worker may share a name with a manager slot.
7. **A defined role without instructions.** The canonical `research-desk` slots `cartographer` and `curator` set no instructions. The canonical sources do not define the effect.
8. **Brace tokens in the default package.** The canonical default package's orchestrator and planner instructions still contain brace tokens such as `{plan_task_flags}` and `{task_routing_line}`. Under [section 5](#5-yaml-rules), rule 7, those tokens are literal text and no host substitutes them. Whether they stay in the published default package is for its owner to decide.
