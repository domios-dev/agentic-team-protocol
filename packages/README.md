# Agentic Team Protocol packages

Agentic Team Protocol (ATP) packages. Each one is published in three forms:

```
packages/<scope>/<name>/<version>/
  <name>.team.yaml   single file, everything inline
  <name>.team        ZIP: root team.yaml plus only the files team.yaml references
  <name>/            folder with the same entries as the ZIP
```

`node scripts/pack-team.mjs` builds every `.team` from its folder. Archives are
deterministic: entries sorted by byte order of their path, files only, stored
without compression, fixed timestamp 1980-01-01 00:00, zero attributes, no extra
fields or comments. `node scripts/check-forms.mjs` checks that each ZIP holds
exactly the folder's files byte for byte, that a re-pack is byte-identical, and
that text files use LF only. The reference validator is pending (generated from
the Domios reference implementation in Phase 2).

The root `.gitattributes` disables line-ending conversion for `packages/**` and
`examples/**`, so the bytes and their checksums survive any checkout.

Phase 1 publishes com.example/research-desk 2.1.0 only. The builtin
dev.domios/default package is published in Phase 2 from the Domios tree.

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
