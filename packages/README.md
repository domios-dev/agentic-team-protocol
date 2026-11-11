# Agentic Team Protocol packages

Canonical Agentic Team Protocol (ATP) packages, each published in three forms:

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

YAML bytes are copied verbatim from the canonical sources and never reformatted.
The root `.gitattributes` disables line-ending conversion for `packages/**` and
`examples/**`, so the bytes and their checksums survive any checkout.

## Status

| Package | Form | Status |
| --- | --- | --- |
| dev.domios/default 1.0.0 | `default.team.yaml` | Canonical single file, every prompt inline. |
| dev.domios/default 1.0.0 | `default/`, `default.team` | Canonical `team.yaml` (the `instructions_file` variant) plus the canonical `managers/*.md` and `workers/*.md`. |
| com.example/research-desk 2.1.0 | `research-desk/`, `research-desk.team` | Canonical `team.yaml` plus authored placeholder files for the path-only references (see below). |
| com.example/research-desk 2.1.0 | `research-desk.team.yaml` | Canonical bytes. **Open question:** this file names five path-only references (`data/competitors.csv`, `assets/logo.png`, `skills/market-sizing`, `blueprints/digest.yaml`, `workers/checker.md`) that a single file cannot carry. Whether the single-file form is valid with them is not yet decided; it is published as the canonical example and awaits the reference validator. |

## Authored placeholder files (research-desk folder and ZIP only)

The canonical package references these paths without inline content, so the
folder and ZIP forms carry minimal neutral placeholders. They are illustrative,
not normative; automation content is host-defined.

- `data/competitors.csv`: three fictional competitors
- `assets/logo.png`: a 16x16 PNG
- `workers/checker.md`: instructions for the checker worker
- `skills/market-sizing/SKILL.md`: a skill named `market-sizing`
- `blueprints/digest.yaml`: an hourly digest automation, in the shape of the inline `stale-task-nudge` entry

Files that `team.yaml` already carries inline through `content` (for example
`assets/icon.svg` and the `source-check` skill's `scripts/fetch.py`) are not
duplicated as folder files.
