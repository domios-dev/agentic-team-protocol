# Agentic Team Protocol packages

Agentic Team Protocol (ATP) packages. The specification defines three forms, and
each version is published in every form its package ships:

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

`node scripts/pack-team.mjs` builds every `.team` from its folder. Archives are
deterministic: entries sorted by byte order of their path, files only, stored
without compression, fixed timestamp 1980-01-01 00:00, zero attributes, no extra
fields or comments. `node scripts/check-forms.mjs` checks that each ZIP holds
exactly the folder's files byte for byte, that a re-pack is byte-identical, and
that text files use LF only. The [reference validator](../validator/) checks every
form: `node scripts/conformance.mjs` runs it on each form under host profiles `none`
and `domios`, and the catalog build fails when a version does not validate.

The root `.gitattributes` disables line-ending conversion for `packages/**` and
`examples/**`, so the bytes and their checksums survive any checkout.

Phase 1 published com.example/research-desk 2.1.0. Phase 2 adds the builtin
dev.domios/default 1.0.0 from the Domios tree, in all three forms.

Both versions above keep the `.team` ZIP packed here by `scripts/pack-team.mjs`.
Every later published version publishes the `.team` bytes of the Domios exporter
as-is (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

## dev.domios/default 1.0.0

### Folder and ZIP: `default/`, `default.team`

The builtin default team of Domios, the reference implementation. Every file in
`default/` is the Domios file of the same path under
`src-tauri/team-templates/default/` at Domios commit
`46078622b77e6bbb4aeca70a779e7cef819fd60d`, byte for byte (same git object id), including
the header comment of `team.yaml`. Nothing is added, removed or reformatted.
`default.team` is packed from that folder by `scripts/pack-team.mjs`.

- `team.yaml`: Orchestrator, Planner, Cartographer and Curator managers; worker, qa,
  reviewer and release_manager workers
- `icon.svg`: the package icon
- `managers/*.md`, `workers/*.md`: each role's `instructions_file`

### Single file: `default.team.yaml`

`default.team.yaml` is the output of the Domios exporter, byte for byte. It was not
authored, derived or reformatted here. It was added after the version's first
commit through a one-time entry in `IMMUTABILITY-EXCEPTIONS.json` that allows
exactly this file to be added; no other byte of the version changed.

Provenance:

- Domios commit: `a7374d38447289ded47f01849bbdb45799720ce8`
- Command: `team export dev.domios/default --format yaml` (Domios CLI)
- SHA-256: `55dd56f313a78fc666f304bfd9d613cbcf6804a394487815f592cfa012b45a91`
  (LF line endings only)
- `team check` on the exported file at export time: valid, 0 warnings
- The same export with `--format folder` wrote the 10 files of `default/`, each
  byte-identical to the file committed here.

### ZIP: packed here, same entries as the exporter's

For this version the contract is the per-file contents, and `default.team` stays
the archive packed here (SHA-256
`10ac7cf261e66da38c885ddcf85bacaae0689b4632f8aed7dddab7f413a2bb9b`). The same
export with `--format team` produced an archive with SHA-256
`575bd0e4f1105c85e4a6a566fd0c78abb73cdfc82e86ee8dfa5f52744b6c6fd4`. Both hold the same
10 entry names with identical bytes, both are 60675 bytes long, store every entry
uncompressed with the timestamp 1980-01-01 00:00:00 and carry no extra fields,
comments or data descriptors. The containers differ only in these fields:

| Field | Packed here | Domios exporter |
| --- | --- | --- |
| Entry order | byte order of the path (`team.yaml` sixth) | `team.yaml` first, then byte order |
| Version made by | 20 (2.0), MS-DOS host | 10 (1.0), Unix host |
| Version needed to extract | 20 (2.0) | 10 (1.0) |
| General purpose flags | `0x0800` (UTF-8 names) | `0x0000` (all names are ASCII) |
| External attributes | `0` | `0x81A40000` (Unix regular file, mode 0644) |

## com.example/research-desk 2.1.0

### Folder and ZIP: `research-desk/`, `research-desk.team`

`team.yaml` is the canonical example byte for byte. The canonical package
references five paths without inline content, which is valid only in the folder
and ZIP forms. These forms carry minimal neutral placeholders for them. The
placeholders are illustrative, not normative; automation content is host-defined.

- `data/competitors.csv`: three fictional competitors
- `assets/logo.png`: a 16x16 PNG
- `workers/checker.md`: instructions for the checker worker
- `skills/market-sizing/SKILL.md`: a skill named `market-sizing`
- `blueprints/digest.yaml`: an hourly digest automation, in the shape of the inline `stale-task-nudge` entry

Files that `team.yaml` already carries inline through `content` (for example
`assets/icon.svg` and the `source-check` skill's `scripts/fetch.py`) are not
duplicated as folder files.

### Single file: `research-desk.team.yaml`

A single file must resolve every reference inline, so this form is a fully
inline variant of the canonical `team.yaml`. Its inline text is byte-identical
to the folder files above. It differs from the canonical bytes in exactly
these places:

| Canonical `team.yaml` | Single file |
| --- | --- |
| `files`: `data/competitors.csv` (path only) | same entry plus `content` (the folder file's text) |
| `files`: `assets/logo.png` (path only, binary) | replaced by `assets/logo.svg` with inline SVG `content`; same description |
| `skills`: `- path: skills/market-sizing` | inline `{name: market-sizing, description, content}` (content is the folder's `SKILL.md`) |
| `automation`: `- path: blueprints/digest.yaml` + description | inline `{name: digest, description, content}` (same description; content is the folder's `digest.yaml`) |
| `workers.checker.instructions_file: workers/checker.md` | `instructions: \|` with the text of `workers/checker.md` |

Every other line is unchanged. The canonical bytes used as a single file are
the invalid fixture `examples/invalid/path-only-in-single-file`.
