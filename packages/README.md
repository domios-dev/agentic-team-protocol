# Agentic Team Protocol packages

Published Agentic Team Protocol packages. The specification defines three package
forms ([section 4](../spec/2026-11-11/index.md#4-package-forms)), and each version is
published in every form its package ships:

```
packages/<scope>/<name>/<version>/
  <name>.team.yaml   single file, everything inline (optional)
  <name>.team        ZIP: root team.yaml plus only the files team.yaml references
  <name>/            folder with the same entries as the ZIP
```

The ZIP and folder forms are always present. A version may lack the single-file
form when its package does not ship one, for example because its document uses
`instructions_file` references, which are valid only in the ZIP and folder forms.
`node scripts/check-forms.mjs` prints a `note` line for each such version, and its
catalog entry has `forms.single_file: null`.

Every file of every form is the output of the Domios exporter, byte for byte; nothing
here is authored, re-packed or reformatted. `scripts/pack-team.mjs` packs no package
version (its `PACK_TEAM_VERSIONS` is empty) and only builds the archive-only invalid
examples. `node scripts/check-forms.mjs` checks that each ZIP holds exactly the
folder's files byte for byte and matches the exporter's container profile, and that
text files use LF only. The [reference validator](../validator/) checks every
form: `node scripts/conformance.mjs` runs it on each form, and the catalog build fails
when a version does not validate.

The root `.gitattributes` disables line-ending conversion for `packages/**` and
`examples/**`, so the bytes and their checksums survive any checkout.

The rules for publishing and changing a package version are in
[CONTRIBUTING.md](../CONTRIBUTING.md#packages).

## Export provenance

Both versions were rewritten in place in the `roles` shape of specification
2026-11-11 under a one-time owner exception recorded in `IMMUTABILITY-EXCEPTIONS.json`;
their versions did not change. Every form was exported by a Domios development build
at Domios commit `16d5277f4ff083d487a7c55ba351f9bb72b8f084` with the Domios CLI:

- `team export <name> --format yaml --out <name>.team.yaml`
- `team export <name> --format team --out <name>.team`
- `team export <name> --format folder --out <name>`

For com.example/research-desk the ZIP and folder forms come from the package with the
binary logo, which the yaml format refuses; its single file comes from the separate
fully inline variant ([below](#single-file-research-deskteamyaml)), imported into the
same build and exported with `--format yaml`.

`team check` on each exported form reported it valid with no diagnostics. A second
export of every form was byte-identical to the first.

| Version | Form | SHA-256 |
| --- | --- | --- |
| dev.domios/default 1.0.0 | `default.team.yaml` | `7c2f600f5f7599f37dfc45198ff76e408066e8b743b1b08813bb1972092fc3ce` |
| dev.domios/default 1.0.0 | `default.team` | `5ff976fc98a85b6391ab631157b216b2f57f0ee95ea3ba5647b5c21cbd552e88` |
| dev.domios/default 1.0.0 | `default/team.yaml` | `1f3fd08ef8aa2bfb921be441765b459fa9fa3540660ddc963acf5da49b02a7c9` |
| com.example/research-desk 2.1.0 | `research-desk.team.yaml` | `037165fc8f812b5899e214e76da2c6ea64f3b3d1ba8d7cb90e62f46ba51f31c1` |
| com.example/research-desk 2.1.0 | `research-desk.team` | `783fd17bfd89462cf4964594114f97ccf51e2fddb69bbb29ea40aaa3c77cb1bb` |
| com.example/research-desk 2.1.0 | `research-desk/team.yaml` | `d31b57c2a48976456433b6e57f78dc884cf4b4e637948feb1e567b80b24c818b` |

Each folder holds exactly the files of the exporter's folder export, and the ZIP holds
the same entries with the same bytes.

## dev.domios/default 1.0.0

The builtin default team of Domios, the reference implementation, as the exporter
writes it.

- `team.yaml`: one `roles` map with the managers orchestrator, planner, cartographer
  and curator and the workers worker, qa, reviewer and release_manager, each with its
  own instructions
- `icon.svg`: the package icon
- `managers/*.md`, `workers/*.md`: each role's `instructions_file`
- `default.team.yaml`: the same package in one file, with the icon and every role's
  instructions inline

## com.example/research-desk 2.1.0

The canonical example package, with the neutral author identities of `com.example`.

### Folder and ZIP: `research-desk/`, `research-desk.team`

The exporter writes every file, skill and automation entry and every role's
instructions as a file referenced from `team.yaml`: `assets/`, `essences/`,
`templates/`, `data/`, `skills/`, `blueprints/`, and `managers/<role>.md` and
`workers/<role>.md` for the instructions of each manager and worker. The data,
logo, skill and automation contents are minimal neutral placeholders; they are
illustrative, not normative, and automation content is host-defined.

### Single file: `research-desk.team.yaml`

A single file must resolve every reference inline, so this form is the fully
inline variant of the package. Its inline text equals the folder files above
except where the table says otherwise:

| Folder and ZIP | Single file |
| --- | --- |
| `files` entries by path | the same entries with inline `content` |
| `files`: `assets/logo.png` (binary) | replaced by `assets/logo.svg` with inline SVG `content`; same description |
| `skills`: `- path: skills/<name>` | inline `{name, description, content}` (and `files` for `source-check`) |
| `automation`: `- path: blueprints/<name>.yaml` | inline `{name, description, content}` |
| `instructions_file: managers/<role>.md`, `workers/<role>.md` | `instructions: \|` with the role's text |
