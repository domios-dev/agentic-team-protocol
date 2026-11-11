# Agentic Team Protocol reference validator

_Pending: built from the Domios reference implementation. No validator bytes are published
yet. This page describes the interface the build will have; file names, versions and
checksums are filled in from the build record when the artifacts land, and every command
below is checked against the real artifact before this notice is removed._

The reference validator checks an Agentic Team Protocol package in any of its three forms
(`name.team.yaml`, `name.team` ZIP archive, or folder) and reports every error and warning
with the stable codes listed in section 15 of the specification. It is built from the
`codeterm-team-package` crate of the Domios reference implementation; see
[PROVENANCE.md](../PROVENANCE.md) for the source commit, build command and checksums.
Domios is not needed to install or run it.

It comes in two builds:

| Build | Where | Status |
| --- | --- | --- |
| `atp-validate` command-line tool (Linux, macOS, Windows) | GitHub Release of this repository | pending |
| WebAssembly module for browsers and JavaScript runtimes | `validator/<version>/` on this site | pending |

The artifact version is pending owner confirmation.

## Command-line tool

### Install

1. Download the binary for your platform from the GitHub Release (file names: pending).
2. Check its SHA-256 against the table below, for example `sha256sum <file>`.
3. Put it on your `PATH` as `atp-validate` (on Linux and macOS, `chmod +x` it first).

| File | Platform | SHA-256 |
| --- | --- | --- |
| pending | pending | pending |

### Use

```sh
atp-validate <path> [--host-profile none|domios] [--json]
```

- `<path>` is a `name.team.yaml` file, a `name.team` archive or a package folder.
- `--host-profile` names the host whose built-in worker names apply. With `none` (no host
  profile), a worker without instructions is a warning; with `domios`, a worker that is
  not a Domios built-in worker needs instructions.
- `--json` prints the report as JSON instead of text.

Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | The package is valid. Warnings may be reported. |
| 1 | The package has at least one error. |
| 2 | Usage error, or the path cannot be read. |

To print the JSON Schema for a specification version:

```sh
atp-validate schema --spec-version 2026-11-11
```

## WebAssembly module

The WebAssembly build is a `wasm-bindgen` module for the web target. It exposes
`check_yaml` (a single-file package as text) and `check_archive` (a `.team` archive as
bytes), each returning the same JSON report as `atp-validate --json`. Module file names,
the import example and checksums: pending.

## Report format

Each diagnostic names its stable code, its severity (`error` or `warning`), the
package-relative file, the YAML path of the node, and the line and column where known.
The conformance corpus in `corpus/<spec version>/` lists the codes, paths and lines each
case expects.

## License

Pending: owner decision.
