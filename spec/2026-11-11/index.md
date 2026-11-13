# Agentic Team Protocol: package format, version 2026-11-11

- **Version:** 2026-11-11
- **Status:** Draft. This version stays a draft until its first publication on the Agentic Team Protocol site. After that publication its text is immutable, and any change requires a new dated version.
- **Companion page:** [Host behaviour (non-normative)](host-behaviour.md)
- **Generated artifacts:** the JSON Schema is published at [https://atp.domios.dev/schema/2026-11-11/team.schema.json](../../schema/2026-11-11/team.schema.json) (JSON Schema draft-07), the conformance corpus at [corpus/2026-11-11/](../../corpus/2026-11-11/), and the reference validator at [validator/](../../validator/). The corpus and the validator define the stable codes in [section 15](#15-error-and-warning-conditions) (see [section 16](#16-generated-artifacts)).

## 1. Scope

The Agentic Team Protocol defines a portable package that describes an agent team: its identity, what it asks a host for at start, the content it carries, and its roles, each of which is a manager or a worker. This document defines the package format and the rules a conforming reader and writer follow. A host's runtime policy is not part of this format, and neither are the orchestration commands a host offers its roles ([section 10.8](#108-scope-package-format-only)). The companion page [host-behaviour.md](host-behaviour.md) describes how a host treats a package and uses Domios as the reference host. That page is non-normative.

Version 2026-11-11 covers roles of two kinds, managers and workers, with per-role instructions, plus optional files, memory, skills and automation. It defines no plan, spec or task templates and no plan export (see [section 14](#14-out-of-scope-for-this-version)).

## 2. Conventions and terms

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY" and "OPTIONAL" in this document are to be interpreted as described in BCP 14 ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals, as shown here.

- **Package:** one Agentic Team Protocol team definition, in one of the three forms of [section 4](#4-package-forms).
- **Package document:** the YAML document that defines the package. It is the whole `name.team.yaml` file, or the root `team.yaml` entry of a ZIP or folder package.
- **Reader:** software that parses and validates a package, such as a validator or a host's importer.
- **Writer:** software that produces a package, such as a host's exporter.
- **Host:** software that starts a team from a package. Domios is the reference host.
- **Role:** one entry of the `roles` mapping: a role name and its definition ([section 10](#10-roles)).
- **Kind:** the class of a role, `manager` or `worker` ([section 10.1](#101-role-names-and-kinds)).
- **Manager:** a role of kind `manager`. It lives with the team across tasks.
- **Worker:** a role of kind `worker`. It takes one task, or one assignment, and ends.
- **Built-in manager name:** one of the names `orchestrator`, `planner`, `cartographer` and `curator` ([section 10.2](#102-orchestrator-and-built-in-manager-names)).
- **Reference:** a key in the package document that points at other package content ([section 4.4](#44-references)).
- **Error:** a condition that makes a package invalid. A reader MUST refuse an invalid package.
- **Warning:** a condition that a reader MUST report and that leaves the package valid.

Error and warning conditions are named by the rule that defines them. [Section 15](#15-error-and-warning-conditions) lists them with their stable codes, taken from the conformance corpus and the reference validator; a condition that neither covers keeps its code pending.

## 3. Versioning

1. This specification is versioned by date (`YYYY-MM-DD`). The version of this document is 2026-11-11.
2. A dated version is a draft until its first publication on the Agentic Team Protocol site. After that publication its text MUST NOT change. A change requires a new dated version.
3. Package versions are separate from specification versions. A package carries its own `version` ([section 7](#7-identity-block)).

## 4. Package forms

One package has three forms. The package document is the same in every form in which the package is valid.

| Form | Name | Layout |
|---|---|---|
| Single file | `<name>.team.yaml` | One YAML file. Every reference resolves inline. |
| ZIP archive | `<name>.team` | A ZIP archive with exactly one `team.yaml` at its root, plus only the files that `team.yaml` references. |
| Folder | `<name>/` | A directory with the same layout as the ZIP archive: exactly one root `team.yaml`, plus only referenced files. |

### 4.1 Single-file form

1. A `.team.yaml` file is the package document itself.
2. In the single-file form, every reference ([section 4.4](#44-references)) MUST resolve inline. Inline resolution means one of the following:
   - a `files` entry with `content`
   - an inline skill with `content`, whose own `files` entries each have `content`
   - an inline automation entry with `content`
   - a role's inline `instructions`
3. In the single-file form, a reference with no inline content is an error (**missing referenced file**). This covers a `files` entry without `content`, a path-form skill, a path-form automation entry, a role's `instructions_file`, and an `icon` that does not match an inline `files` entry.
4. A package with path-only references or binary content (for example a PNG icon) is valid only as a ZIP archive or a folder.

### 4.2 ZIP and folder forms

1. A ZIP or folder package MUST contain exactly one `team.yaml` at its root. That entry is the package document. A missing or second root `team.yaml` is an error (**missing or duplicate root team.yaml**).
2. A reference may resolve inline, as in the single-file form, or to an entry at the referenced path.
3. Every entry other than the root `team.yaml` MUST be the target of a reference ([section 4.4](#44-references)). An unreferenced entry is an error (**unreferenced entry**).
4. Every entry path MUST be relative. A path containing a `..` segment, an absolute path, and a symbolic link are errors (**unsafe path**).
5. A writer MUST write ZIP entries in a deterministic order, so that export, then import, then export again produces byte-identical output. The exact ordering is pending: generated from the Domios reference implementation.

### 4.3 Bounds

A package has explicit bounds on size and entry count. A reader MUST refuse a package that exceeds a bound (**bound exceeded**) before it admits any of the package's content. The bound values are pending: generated from the Domios reference implementation.

### 4.4 References

These keys are references:

| Key | Target |
|---|---|
| `icon` | A package-relative SVG or PNG file ([section 7.1](#71-icon)). |
| `files[].path` | A knowledge document given to roles. It is inline when the entry has `content` ([section 9.1](#91-files)). |
| `skills[].path` | A skill folder holding a `SKILL.md` ([section 9.3](#93-skills)). |
| `skills[].files[].path` | A file that belongs to an inline skill. It is inline when the entry has `content`. |
| `automation[].path` | A host-defined automation file ([section 9.4](#94-automation)). |
| role `instructions_file` | A file that holds the role's instructions ([section 10.6](#106-instructions)). |

1. `instructions_file`, a skill `path` and an automation `path` are references in their own right. Their targets need not appear under `files`. `files` lists the knowledge documents given to roles.
2. A reference whose target is missing is an error (**missing referenced file**). This applies to a `files` entry, `instructions_file`, a skill `path`, an automation `path`, `icon`, and a skill's own `files` entry.
3. Paths are package-relative and follow the safety rule of [section 4.2](#42-zip-and-folder-forms).

A package also uses names to point inside the package document:

- A role's `files` list names entries of the top-level `files` list ([section 10.3](#103-role-fields)).
- A role's `skills` list names package skills. An unresolved skill name is a warning ([section 10.3](#103-role-fields)).
- `model: {same_as: <role>}` names another role ([section 10.5](#105-model)).

## 5. YAML rules

1. A package document MUST be YAML 1.2.
2. A package document MUST NOT contain anchors or aliases (**YAML anchor or alias**).
3. A mapping MUST NOT contain a duplicate key (**duplicate key**). Two definitions of the same role name are duplicate keys.
4. Tabs MUST NOT be used for indentation (**tab indentation**).
5. A reader MUST normalize CRLF line endings to LF. A writer MUST write LF line endings.
6. A writer MUST write multi-line text as a literal block scalar (`|`). When the first line of the text starts with whitespace, the writer MUST add an indentation indicator (for example `|2`). A reader MUST accept every YAML 1.2 scalar style, including folded scalars (`>-`).
7. The format has no substitution syntax. A host MUST NOT perform interpolation or placeholder substitution in instructions or any other text. A brace sequence such as `{Question}` in a file's content is ordinary text.
8. A package MUST NOT contain host placeholders such as `{plan_task_flags}` that stand for text a host would insert. A reader cannot tell such a token from ordinary text, so it treats the token as literal text. No reader error is defined for it.
9. A document that is not well-formed YAML is an error (**malformed YAML**).
10. Size bounds apply to the package document and to inline text ([section 4.3](#43-bounds)).

## 6. Top-level structure

The package document is a mapping. Its top-level blocks, in canonical order, are:

| # | Block | Keys, in canonical order |
|---|---|---|
| 1 | Identity | `name`, `version`, `title`, `description`, `icon`, `authors`, `links`, `license`, `when`, `derived_from` |
| 2 | Start asks | `project`, `requires`, `inputs`, `permissions`, `secrets` |
| 3 | Payload | `files`, `memory`, `skills`, `automation` |
| 4 | Roles | `roles` |
| 5 | Extensions | `x-*` |

1. A writer MUST emit top-level keys in this canonical order. A reader MUST accept keys in any order.
2. The REQUIRED keys are `name`, `version`, `description` and `roles.orchestrator`. All other top-level keys are OPTIONAL. A missing required key is an error (**missing required key**).
3. A top-level key that does not start with `x-` MUST be one listed above. An unknown key is an error (**unknown key**). A top-level `coordinator` or `planner` key, for example, is unknown. Roles exist only under `roles`.
4. Every key has the type this document gives it. A value of the wrong type, or a value outside its enumeration or grammar, is an error (**invalid value**).
5. Keys that earlier drafts of the format used are rejected as removed fields ([section 11](#11-removed-fields)).

A minimal valid package (neutral example):

```yaml
name: com.example/minimal
version: 1.0.0
description: Smallest valid Agentic Team Protocol package.
roles:
  orchestrator:
    kind: manager
    instructions: |
      Agree the goal with the owner, then delegate one task per worker.
```

## 7. Identity block

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | required | none | `<owner>/<slug>`. `<owner>` matches `[a-z0-9.-]+` and is written reverse-DNS style. `<slug>` matches `[a-z0-9-]+`. Example: `com.example/research-desk`. A value that does not match is an error (**invalid package name**). |
| `version` | string | required | none | A semantic version (`MAJOR.MINOR.PATCH`), for example `2.1.0`. |
| `title` | string | optional | none | A human-readable title, for example `Research desk`. |
| `description` | string | required | none | What the team does. |
| `icon` | string (path) | optional | none | A package-relative SVG or PNG file. See [section 7.1](#71-icon). |
| `authors` | list of author objects | optional | none | See the author table below. |
| `links` | mapping | optional | none | Keys `homepage`, `repository`, `issues`, `docs`. Each value is a URL string. Each key is optional. |
| `license` | string | optional | none | The package's own license, for example `Apache-2.0`. It is separate from the license of this specification. |
| `when` | list of strings | optional | none | Requests the team is meant for, for example `research a market question`. A host can use them to match the package to a request. |
| `derived_from` | mapping | optional | none | The package this one was derived from. Keys: `name` (same grammar as top-level `name`) and `version` (a semantic version). |

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

1. `icon` is a package-relative path to an SVG or PNG file. It is a reference ([section 4.4](#44-references)).
2. A missing icon target is an error (**missing referenced file**).
3. A reader MUST validate the icon by its content, not by its file name. A target that is not an SVG or PNG image is an error (**invalid icon**).
4. In the single-file form, an SVG icon resolves inline through a `files` entry whose `path` equals the `icon` path and which has `content` ([section 9.1](#91-files)).
5. A PNG icon needs the ZIP or folder form. A PNG icon whose path names a `files` entry with inline `content` is an error (**inline binary icon**): only an SVG icon can be inline. A PNG icon path with no inline content and no package file is a missing referenced file (item 2).

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
| `project` | string | optional | `none` | One of `required`, `none`. |
| `requires` | mapping | optional | none | The only key is `harnesses`. |
| `requires.harnesses` | list of strings | optional | none | Harness ids the team needs, for example `[claude, codex]`. Each matches `[a-z0-9-]+`, the harness grammar of a model id ([section 10.5](#105-model)). |
| `inputs` | mapping of input key to input | optional | none | Each value takes the short or full form below. |
| `permissions` | mapping | optional | nothing asked | See the permissions table below. |
| `secrets` | list of secret objects | optional | none | See the secrets table below. |

Input value (`inputs.<key>`). Canonical keys: `question` (short form) and `depth` (full form).

- **Short form:** a string that is the input's description, for example `question: The market question to research`. It is equivalent to the full form with only `description` set.
- **Full form:** a mapping with the keys below.

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `description` | string | required | none | What the input is. |
| `required` | boolean | optional | `true` | Whether the input must be given before start. |
| `default` | a value | optional | none | The value used when none is given. When `choices` is present, `default` MUST be one of the choices (**input default not in choices**). |
| `choices` | list of values | optional | none | The allowed values. |

Canonical full form:

```yaml
inputs:
  depth:
    description: How deep to go
    required: false
    default: standard
    choices: [quick, standard, deep]
```

Permissions (`permissions`):

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `network` | boolean, or list of host patterns | optional | not asked | `true` asks for network access, `false` asks for none, and a list asks for those hosts only. A host pattern may use a `*` wildcard, for example `"*.wikipedia.org"`. |
| `repo_write` | boolean | optional | not asked | Asks to write to the project repository. |
| `shell` | boolean | optional | not asked | Asks for shell access. |
| `browser` | boolean | optional | not asked | Asks for browser access. |

Secret object (`secrets[]`):

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | string | required | none | The secret's name, for example `SEARCH_API_KEY`. |
| `purpose` | string | required | none | Why the team needs the secret. |
| `required` | boolean | optional | `true` | Whether the team needs the secret in order to start. |

A package carries secret names only. A package MUST NOT contain a secret value.

## 9. Payload block

The payload is content the package brings to the team: `files`, `memory`, `skills` and `automation`.

### 9.1 Files

`files` lists the knowledge documents given to roles. Each entry is an object:

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `path` | string (path) | required | none | A package-relative path. The path rules of [section 4.2](#42-zip-and-folder-forms) apply. |
| `description` | string | required | none | What the file is for. |
| `content` | string | optional | none | The file's text, inline. Without `content`, the file is a ZIP or folder entry at `path`. |

1. Binary files are carried by path only, so they need the ZIP or folder form.
2. An entry without `content` whose path has no matching entry is an error (**missing referenced file**). In the single-file form, every entry without `content` is that error ([section 4.1](#41-single-file-form)).

### 9.2 Memory

`memory` is a list of memory items that the team starts with.

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `title` | string | required | none | A short title. |
| `kind` | string | required | none | One of `fact`, `rule`, `learning`. |
| `body` | string | required | none | The memory text. |
| `tags` | list of strings | optional | none | Free tags, for example `[sources]`. |

### 9.3 Skills

`skills` is a list of skill objects. Each entry takes one of two forms:

| Form | Fields | Meaning |
|---|---|---|
| Path | `path` | A package-relative folder that holds a `SKILL.md`. The skill's name is the `name` in the frontmatter of that `SKILL.md`. Canonical example: `- path: skills/market-sizing`. |
| Inline | `name` (string), `description` (string), `content` (string: the `SKILL.md` text), `files` (list of `{path, content}`) | A skill defined in the package document. `files` holds the skill's own files, for example a script. |

1. Every top-level `skills` entry MUST be an object. A bare string is an error (**bare-string skill**).
2. A path-form skill is a reference ([section 4.4](#44-references)). It cannot be used in the single-file form.
3. The `SKILL.md` of a path-form skill MUST have a `name` in its frontmatter. A `SKILL.md` without one is an error (**skill without name**). There is no fallback to the folder name.
4. A role refers to a package skill by its bare name in the role's `skills` list ([section 10.3](#103-role-fields)).

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
| Path | `path` (string), `description` (string) | A package file with host-defined automation, for example `blueprints/digest.yaml`. It is a reference and cannot be used in the single-file form. |
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

## 10. Roles

`roles` is a mapping from a role name to a role definition. Every role is either a manager or a worker. Both are open classes of roles: a package names its own managers and its own workers.

Canonical example (neutral):

```yaml
roles:
  orchestrator:
    kind: manager
    name: Lead
    model: [claude:opus, codex:gpt-6.1-sol]
    instructions: |
      Agree the question with the owner, then delegate one task per angle.
  planner:
    kind: manager
    name: Atlas
    instructions: |
      Split the question into one task per angle.
  editor:
    kind: manager
    description: Keeps the report consistent across tasks.
    instructions: |
      Keep one structure and one voice across every section of the report.
  researcher:
    kind: worker
    model: [claude:sonnet]
    instructions: |
      Research exactly one angle. Every claim gets a source link and a date.
  checker:
    kind: worker
    instructions: |
      Verify every claim in a researcher's report against its cited source.
```

`orchestrator` and `planner` use built-in manager names. `editor` is a manager with a name of the package's own. `researcher` and `checker` are workers.

### 10.1 Role names and kinds

1. A role name MUST match `[a-z][a-z0-9_]*` (**invalid role name**). This applies to managers and workers alike. Canonical names: `orchestrator`, `planner`, `editor`, `researcher`, `checker`, `qa`, `writer`.
2. Every role MUST set `kind` (**missing role kind**). Its value MUST be `manager` or `worker`; any other value is an error (**invalid value**).
3. Role names are the keys of one mapping, so a name names exactly one role, and no name is both a manager and a worker. A repeated role name is a duplicate key ([section 5](#5-yaml-rules)).
4. The two kinds differ by lifecycle, not by authority:
   - A manager lives with the team across tasks. Each manager is one agent in the team.
   - A worker takes one task, or one assignment, and ends. A host may run several instances of a worker. A worker that must run alone says so in its instructions.
5. The format gives no role any authority. What a host lets a role do is host policy (see [host-behaviour.md](host-behaviour.md)).

### 10.2 Orchestrator and built-in manager names

1. `roles.orchestrator` MUST be present (**missing required key**). The orchestrator anchors the team. Because role names are unique ([section 10.1](#101-role-names-and-kinds)), a team has exactly one orchestrator.
2. The orchestrator always starts with the team. A `start` other than `with_team` on `roles.orchestrator` is an error (**invalid start**).
3. `orchestrator`, `planner`, `cartographer` and `curator` are the built-in manager names. A role with one of these names MUST be of kind `manager`. A built-in manager name with `kind: worker` is an error (**reserved worker name**). This includes `orchestrator` with `kind: worker`.
4. Apart from `orchestrator`, every built-in manager name is optional. A package that does not list one has no role of that name.
5. A built-in manager name supplies no field values. A role with a built-in manager name sets its fields like any other role, instructions included. Its only difference from other managers is its default `start` ([section 10.4](#104-start)).
6. A host may attach its own duties and authority to a built-in manager name that the package lists. A manager with any other name gets no such host authority (see [host-behaviour.md](host-behaviour.md)).

### 10.3 Role fields

Managers and workers use the same role fields, and only these fields. A key in a role that is not listed here is an error (**unknown key**), unless it is an `x-*` extension key ([section 12](#12-extensions)) or a removed field ([section 11](#11-removed-fields)).

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `kind` | `manager` or `worker` | required | none | See [section 10.1](#101-role-names-and-kinds). |
| `name` | string | optional | none | A display name, for example `Lead` or `Atlas`. |
| `description` | string | optional | none | What the role does. |
| `start` | `with_team`, `on_demand`, or `{schedule: "<min>..<max>"}` | optional | by role, see [section 10.4](#104-start) | See [section 10.4](#104-start). A worker's only valid value is `on_demand`. |
| `model` | list of model ids, `{same_as: <role>}`, or omitted | optional | omitted | See [section 10.5](#105-model). |
| `reasoning` | string | optional | none | Requested reasoning effort, for example `medium` or `high`. The value set is pending: generated from the Domios reference implementation. |
| `skills` | list of strings | optional | none | Bare names of package skills ([section 9.3](#93-skills)). A name that matches no package skill is a warning, not an error (**unresolved skill reference**). |
| `tools` | list of strings | optional | none | Tool references in the form `mcp:<registry name>`, for example `mcp:io.github.example/search`. |
| `files` | list of strings (paths) | optional | none | Paths of top-level `files` entries ([section 9.1](#91-files)) that this role uses. A path the package does not contain is an error (**missing referenced file**). |
| `instructions` | string | required unless `instructions_file` is set | none | The role's instructions as literal text. MUST NOT appear together with `instructions_file`. |
| `instructions_file` | string (path) | required unless `instructions` is set | none | A package-relative file that holds the role's instructions. It is a reference ([section 4.4](#44-references)). MUST NOT appear together with `instructions`. |

1. A role MAY narrow `skills` and `files` to itself by listing them.
2. Every role MUST set `instructions` or `instructions_file`. A role that sets neither is an error (**missing instructions**), whatever its kind and name.
3. Setting both `instructions` and `instructions_file` is an error (**conflicting fields**).

### 10.4 Start

| Value | Meaning |
|---|---|
| `with_team` | The role starts when the team starts. |
| `on_demand` | The role is available. The orchestrator starts it when it is needed. |
| `{schedule: "<min>..<max>"}` | The role runs on a schedule. The interval lies between `<min>` and `<max>`, for example `45m..2h`. |

Each value means the same for every manager, whether its name is built in or the package's own. A manager with `start: with_team` starts when the team starts, whatever its name.

A role that omits `start` takes this default:

| Role | Default `start` |
|---|---|
| `orchestrator` | `with_team` (the only valid value, [section 10.2](#102-orchestrator-and-built-in-manager-names)) |
| `planner` | `with_team` |
| `cartographer` | `on_demand` |
| `curator` | `{schedule: 45m..2h}` |
| any other manager | `on_demand` |
| every worker | `on_demand` (the only valid value, rule 4) |

Canonical scheduled form:

```yaml
curator:
  kind: manager
  start:
    schedule: 45m..2h
  instructions: |
    Review the team's health and report to the orchestrator.
```

1. Each duration MUST match `<positive integer>(m|h)`, where `m` means minutes and `h` means hours, for example `45m` or `2h`. Any other duration is an error (**invalid schedule**).
2. `<min>` MUST NOT be greater than `<max>`. A greater `<min>` is an error (**invalid schedule**).
3. A host may clamp a valid range to its own bounds. Clamping is host policy, not a format error (see [host-behaviour.md](host-behaviour.md)).
4. A worker starts only on demand. A role of kind `worker` whose `start` is `with_team` or a schedule is an error (**invalid start**). A worker that omits `start` is `on_demand`.

### 10.5 Model

`model` takes one of three forms:

1. **List.** An ordered list of model ids, most preferred first. A model id is `<harness>:<model>`:
   - `<harness>` matches `[a-z0-9-]+`.
   - `<model>` is a non-empty, provider-defined token with no whitespace. It may contain `/`, `.`, `-` and `_`.
   - Examples: `claude:opus`, `codex:gpt-6.1-sol`.
   - A value that does not match is an error (**invalid model id**).
2. **`same_as`.** A mapping `{same_as: <role>}`. The role uses the resolved model of another role in the same package. `<role>` is the name of any role in the package, manager or worker, for example `same_as: orchestrator`.
   - A target that names no role in the package is an error (**unknown same_as role**).
   - A chain of `same_as` references that returns to a role already in the chain, including a role that names itself, is an error (**same_as cycle**).
3. **Omitted.** A package is valid without any model. When a role has no model, the host chooses one. That choice is host policy (see [host-behaviour.md](host-behaviour.md)).

Canonical examples:

```yaml
orchestrator:
  model: [claude:opus, codex:gpt-6.1-sol]
curator:
  model:
    same_as: orchestrator
```

### 10.6 Instructions

1. Instructions are per role only. Every role carries its own `instructions` or `instructions_file` ([section 10.3](#103-role-fields), rule 2). A host supplies no instructions for a role. The package has no top-level instructions and no brief.
2. The team's overall way of working is written in the orchestrator's instructions. A starting hint for the planner is written in the planner's instructions.
3. Instructions are literal text ([section 5](#5-yaml-rules), rules 7 and 8). A line inside an instructions block that looks like a key, such as `carries:` or `principles:`, is text, not a package key.
4. `instructions_file` is a reference. In the single-file form it is an error (**missing referenced file**). In the ZIP or folder form, a missing target is the same error.
5. A host appends its own runtime text to a role's instructions ([section 13](#13-host-runtime-text)). Package instructions do not replace or override that text.

### 10.7 A team has exactly its listed roles

1. A team has exactly the roles its package lists under `roles`. A host MUST NOT add a role to the team, and MUST NOT fill in a field of a listed role from its own role definitions.
2. A field that a role omits takes the default this document gives in [section 10.3](#103-role-fields) and [section 10.4](#104-start), or has no value. The host's choice of a model for a role without one ([section 10.5](#105-model)) is host policy, not a field value.
3. The result of reading a package depends only on the package. A reader takes no host input, such as a list of a host's own role names, that changes whether a package is valid.

### 10.8 Scope: package format only

This format standardizes the package: its roles with their `kind`, `start`, `model` and instructions, and the files, skills and tools the team carries. It does not standardize orchestration. The commands a host offers its roles, for example to dispatch tasks, edit plans, review work or report results, are host-defined.

1. Role instructions are opaque to this format. Whether a package is valid never depends on what its instructions say: a reader, a validator included, MUST NOT refuse a package or report a diagnostic because of the content of its instructions.
2. Instructions are written for a host, so a package built for one host may use that host's commands. For example, the instructions of `dev.domios/default` use Domios plan, dispatch and report commands. Such a package is valid; a different host may not be able to run it as intended.

[Section 14.1](#141-future-direction-informative) describes a possible future direction for host-portable packages.

## 11. Removed fields

The following fields are removed from the format. A package that contains one is invalid (**removed field**):

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

The error is reported at the removed key. `model: inherit` is reported with its own code ([section 15.1](#151-conditions-as-the-reference-implementation-reports-them)).

Role count follows the role's kind ([section 10.1](#101-role-names-and-kinds)). Machine placement is not an author field in this version. Placement is host-side registration data.

## 12. Extensions

1. A key that starts with `x-` is a vendor extension, for example `x-domios`. Extension keys are allowed at the top level and inside role objects. Anywhere else, an `x-*` key is an unknown key ([section 6](#6-top-level-structure), [section 10.3](#103-role-fields)).
2. A reader MUST accept extension keys in those places and MUST NOT report them as unknown keys.
3. The content of an extension is opaque to this format. A host that does not own an extension MUST ignore it.
4. In the canonical reference package, `x-domios` holds `min_version`, a Domios-specific key:

```yaml
x-domios:
  min_version: "1.20"
```

## 13. Host runtime text

A host appends its own runtime text to a role's instructions when it composes the role's prompt. That text includes the host's primer, routing contract, reporting rules and similar runtime material. The host appends it per kind (managers, workers) and, for a built-in manager name that the package lists, per that name.

1. Host runtime text is never part of a package.
2. A writer MUST NOT export host runtime text into a package.
3. A host MUST append its runtime text to a role's instructions and MUST NOT substitute it into them ([section 5](#5-yaml-rules), rules 7 and 8).

## 14. Out of scope for this version

- Plan, spec and task templates are not part of version 2026-11-11.
- Plan export is not part of version 2026-11-11.
- Machine placement is not an author field ([section 11](#11-removed-fields)).
- Orchestration commands, such as task dispatch, plan editing, review and reporting, are host-defined ([section 10.8](#108-scope-package-format-only)).

### 14.1 Future direction (informative)

This section is informative and sets no requirement. Host capabilities such as task dispatch, plan editing, review and reporting may later become typed capabilities: a package would declare the capabilities its roles use, and a host would implement them. Packages written against declared capabilities instead of one host's commands would then be portable between hosts. This version defines no such capabilities.

## 15. Error and warning conditions

Each condition below is named by its rule. Its stable code is the one the conformance corpus ([section 16](#16-generated-artifacts)) expects for that condition or, where the corpus has no case, the one the reference validator reports for the matching example under `examples/`. A condition that neither covers yet keeps the code pending: generated from the Domios reference implementation.

| Condition | Kind | Rule | Code |
|---|---|---|---|
| malformed YAML | error | [5](#5-yaml-rules).9 | `yaml_syntax` |
| more than one YAML document | error | [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `multiple_documents` |
| YAML anchor or alias | error | [5](#5-yaml-rules).2 | `yaml_anchor`, `yaml_alias` |
| duplicate key | error | [5](#5-yaml-rules).3 | `duplicate_key` |
| tab indentation | error | [5](#5-yaml-rules).4 | `tab_indentation` |
| missing required key | error | [6](#6-top-level-structure).2, [10.2](#102-orchestrator-and-built-in-manager-names).1 | `missing_field` |
| unknown key | error | [6](#6-top-level-structure).3, [10.3](#103-role-fields), [12](#12-extensions).1 | `unknown_field` |
| invalid value | error | [6](#6-top-level-structure).4, [10.1](#101-role-names-and-kinds).2 | `invalid_value` |
| invalid package name | error | [7](#7-identity-block) (`name`) | pending |
| invalid derived_from | error | [7](#7-identity-block) (`derived_from.name`, `derived_from.version`) | `invalid_derived_from` |
| invalid model id | error | [10.5](#105-model).1 | `invalid_model` |
| invalid role name | error | [10.1](#101-role-names-and-kinds).1 | `invalid_role_name` |
| missing role kind | error | [10.1](#101-role-names-and-kinds).2 | `missing_role_kind` |
| reserved worker name (a built-in manager name with `kind: worker`) | error | [10.2](#102-orchestrator-and-built-in-manager-names).3 | `reserved_worker_name` |
| missing instructions (any role) | error | [10.3](#103-role-fields).2 | `missing_instructions` |
| skill without name | error | [9.3](#93-skills).3 | `missing_field` |
| invalid schedule | error | [10.4](#104-start).1, [10.4](#104-start).2 | `invalid_schedule` |
| invalid start (orchestrator not `with_team`, or a worker not `on_demand`) | error | [10.2](#102-orchestrator-and-built-in-manager-names).2, [10.4](#104-start).4, [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `invalid_start` |
| plan, spec or task template | error | [14](#14-out-of-scope-for-this-version), [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `plan_template_unsupported` |
| input default not in choices | error | [8](#8-start-asks-block) (`inputs` full form) | pending |
| removed field | error | [11](#11-removed-fields) | `removed_field` |
| removed `model: inherit` | error | [11](#11-removed-fields), [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `removed_inherit` |
| bare-string skill | error | [9.3](#93-skills).1 | `expected_mapping` |
| unknown same_as role | error | [10.5](#105-model).2 | `unknown_same_as` |
| same_as cycle | error | [10.5](#105-model).2 | `same_as_cycle` |
| conflicting fields (`instructions` and `instructions_file` both set) | error | [10.3](#103-role-fields).3 | `conflicting_fields` |
| invalid icon | error | [7.1](#71-icon).3 | `icon_not_image` |
| SVG icon with script | error | [7.1](#71-icon).3, [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `svg_script` |
| SVG icon with external reference | error | [7.1](#71-icon).3, [15.1](#151-conditions-as-the-reference-implementation-reports-them) | `svg_external_reference` |
| inline binary icon | error | [7.1](#71-icon).5 | `binary_inline` |
| missing referenced file | error | [4.1](#41-single-file-form).3, [4.4](#44-references).2, [7.1](#71-icon).2, [9.1](#91-files).2, [10.3](#103-role-fields), [10.6](#106-instructions).4 | `missing_file` |
| missing or duplicate root team.yaml | error | [4.2](#42-zip-and-folder-forms).1 | pending |
| unreferenced entry | error | [4.2](#42-zip-and-folder-forms).3 | `unreferenced_entry` |
| unsafe path (`..`, absolute path, symbolic link) | error | [4.2](#42-zip-and-folder-forms).4 | `..`: `path_escape`; absolute path: `absolute_path`; symbolic link: pending |
| bound exceeded | error | [4.3](#43-bounds) | pending |
| unresolved skill reference | warning | [10.3](#103-role-fields) | `unresolved_skill` |

A reader MUST refuse a package that has any error. A warning leaves the package valid. A host can, for example, start a team whose role names a skill that does not exist yet.

Conformance is judged per case of the conformance corpus and of the examples ([section 16](#16-generated-artifacts), [section 17](#17-examples)). For any implementation, the normative result of a case is whether the package is accepted or refused, and the error and warning codes reported: each code the case lists, and no other. The location of a diagnostic (file, YAML path, archive entry, line and column) and its message are informative.

### 15.1 Conditions as the reference implementation reports them

The reference implementation is normative for the conditions below. Each names the conformance corpus case or the example that shows it.

- **malformed YAML** (`yaml_syntax`): reported at the line and column where the YAML parser detects the error, which can be after the construct that causes it. Example: `examples/invalid/malformed-yaml/` (an unclosed flow sequence on line 9, reported on line 10).
- **skill without name** (`missing_field`): reported in the package document at the skill's `skills[].path`, not inside `SKILL.md`. Example: `examples/invalid/path-skill-without-name/`.
- **unsafe path** (`path_escape`, `absolute_path`): reported for the archive entry and for each reference that names it; such a reference is also a missing referenced file (`missing_file`). Examples: `examples/invalid/zip-entry-dotdot/`, `examples/invalid/zip-entry-absolute/`.
- **YAML anchor or alias** (`yaml_anchor`, `yaml_alias`): an anchor is reported at its node; an alias is reported at its position and read as an empty value, so the key that holds it usually also has a type error. Corpus: `invalid/anchor-alias.team.yaml`; example: `examples/invalid/yaml-alias-anchor/`.

- **more than one YAML document** (`multiple_documents`): a package document holds exactly one YAML document. A second document start is an error, reported at that line. Corpus: `invalid/build-owner.md`.
- **tab indentation** (`tab_indentation`): a line that starts with a tab character is an error, reported at the first such line. Corpus: `invalid/tab-indentation.team.yaml`.
- **unknown key** (`unknown_field`): reported at the key. Corpus: `invalid/unknown-field.team.yaml` (top-level `colour`).
- **invalid derived_from** (`invalid_derived_from`): `derived_from.name` that does not follow the package name grammar of [section 7](#7-identity-block), or `derived_from.version` that is not a semantic version. Each is reported at its own key. Corpus: `invalid/invalid-derived-from.team.yaml`.
- **invalid model id** (`invalid_model`): a model list entry that is not `<harness>:<model>`, reported at that entry; also an empty model list, or a `model` scalar other than `inherit`. Corpus: `invalid/invalid-model.team.yaml` (`model: [opus]`).
- **removed `model: inherit`** (`removed_inherit`): the removed form `model: inherit`; use `model: {same_as: <role>}`. Corpus: `invalid/removed-inherit.team.yaml`.
- **invalid start** (`invalid_start`): the orchestrator always starts with the team, so a `start` other than `with_team` on `roles.orchestrator` is an error, reported at `roles.orchestrator.start`. Corpus: `invalid/orchestrator-on-demand.team.yaml`. A worker starts only on demand, so `with_team` or a schedule on a role of kind `worker` is the same error ([section 10.4](#104-start).4); its corpus case is pending.
- **plan, spec or task template** (`plan_template_unsupported`): a top-level `plan`, `plans`, `spec`, `specs`, `tasks` or `goal` key is an error ([section 14](#14-out-of-scope-for-this-version)). Corpus: `invalid/plan-template.team.yaml`.
- **SVG icon with script** (`svg_script`): an SVG icon that contains a `script` or `foreignObject` element, or an attribute whose name starts with `on`. Reported at `icon`. Corpus: `invalid/icon-svg-script.team.yaml`.
- **SVG icon with external reference** (`svg_external_reference`): an SVG icon with an `href`, `*:href` or `src` attribute, or a CSS `url(...)`, whose target is not an in-document `#` reference; or one that uses `@import` or `javascript:`, or declares a DTD. Reported at `icon`. Corpus: `invalid/icon-svg-external.team.yaml`.
- **inline binary icon** (`binary_inline`): a PNG icon whose path names a `files` entry with inline `content` ([section 7.1](#71-icon).5). Reported at `icon`. Corpus: `invalid/icon-png-inline.team.yaml`.

## 16. Generated artifacts

The following artifacts come from the Domios reference implementation. Each one is generated, never written by hand; until it is generated and published, it is pending:

- **Conformance corpus:** [corpus/2026-11-11/](../../corpus/2026-11-11/). Valid and invalid packages; `cases.json` lists each case with the codes, paths and lines it expects. Its source commit and checksums are in `PROVENANCE.md` in the repository.
- **Stable error codes** for the conditions in [section 15](#15-error-and-warning-conditions): taken from the conformance corpus, or, for a condition without a corpus case, from the reference validator's report on the examples. A condition that neither covers keeps its code pending.
- **JSON Schema:** [https://atp.domios.dev/schema/2026-11-11/team.schema.json](../../schema/2026-11-11/team.schema.json), which is also its `$id`. It is written in JSON Schema draft-07 (`$schema`: `http://json-schema.org/draft-07/schema#`); the generator has no 2020-12 mode. The schema describes the structure of a package document. The rules in this document that the schema cannot express, such as references, `same_as` resolution and archive rules, are checked by the reference validator. A published dated schema never changes.
- **Reference validator:** [validator/](../../validator/): the `atp-validate` command-line tool and a WebAssembly module, with installation and use described there.
- **Bound values** ([section 4.3](#43-bounds)) and the **ZIP entry order** ([section 4.2](#42-zip-and-folder-forms).5): pending: generated from the Domios reference implementation.
- **`reasoning` value set** ([section 10.3](#103-role-fields)): pending: generated from the Domios reference implementation.

## 17. Examples

The published example is the canonical reference package `com.example/research-desk` 2.1.0, which shows every field and form.

Its package document (the root `team.yaml` of the ZIP and folder forms) has path-only and binary references: `data/competitors.csv`, `assets/logo.png`, `skills/market-sizing`, `blueprints/digest.yaml` and `workers/checker.md`. By [section 4.1](#41-single-file-form), that document as written is invalid as a lone `.team.yaml` file (**missing referenced file**). The invalid fixture `examples/invalid/path-only-in-single-file/` is this exact case.

The single-file form is therefore a separate, fully inline variant of the package:

- every `files` entry has inline `content`
- the skill and the automation entry are inline
- the `checker` worker's instructions are inline
- the logo is an inline SVG at `assets/logo.svg`

`packages/README.md` lists every difference between this variant and the package document.

| Form | Path |
|---|---|
| Single file (fully inline variant) | `packages/com.example/research-desk/2.1.0/research-desk.team.yaml` |
| ZIP | `packages/com.example/research-desk/2.1.0/research-desk.team` |
| Folder | `packages/com.example/research-desk/2.1.0/research-desk/team.yaml` |

Its role definitions show both kinds of role:

- `orchestrator`, `planner`, `cartographer` and `curator` are managers with built-in manager names.
- `researcher`, `checker`, `qa` and `writer` are workers.
- Every role sets its `kind` and carries its own instructions.
