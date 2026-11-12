# Agentic Team Protocol reference validator

The reference validator checks an Agentic Team Protocol package in any of its three forms
(`name.team.yaml`, `name.team` ZIP archive, or folder) and reports every error and warning
with the stable codes in section 15 of the specification. It is built from the
`codeterm-team-package` crate of the Domios reference implementation by this repository's
workflow `.github/workflows/validator.yml`; [PROVENANCE.md](../PROVENANCE.md) records the
source commit, build commands, toolchain and checksums. Domios is not needed to install or
run it.

Version: `2026.11.11`, the artifact version the owner chose (the crates are version 0.0.0;
the generated files embed no version string). License: pending owner decision.

| Build | Where |
| --- | --- |
| `atp-validate` command-line tool (Linux, macOS, Windows) | GitHub Release of this repository (pending: created on owner approval) |
| WebAssembly module for browsers and JavaScript runtimes | [`2026.11.11/`](2026.11.11/) |

## Command-line tool

### Install

1. Download the binary for your platform from the GitHub Release.
2. Check its SHA-256 against the table below, for example `sha256sum <file>` (on macOS,
   `shasum -a 256 <file>`).
3. Rename it to `atp-validate` (`atp-validate.exe` on Windows) and put it on your `PATH`.
   On Linux and macOS, run `chmod +x atp-validate` first.

| File | Platform | SHA-256 |
| --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | x86_64 Linux (static, musl) | `66a196322b0dd0bf3529a0506caac004fb61c9d99311ba824a3b008e19e420c4` |
| `atp-validate-aarch64-apple-darwin` | Apple silicon macOS | `ac5a8ffb51986022e09ea49e7c648bc641a75bee79553a1e2ec33baee25d2f61` |
| `atp-validate-x86_64-apple-darwin` | Intel macOS | `9cbaf22a66458ae116008614dd39a292d20c961322747c9ca1e1d03bd367d50e` |
| `atp-validate-x86_64-pc-windows-msvc.exe` | x86_64 Windows | `71e09ed921b5d7a17b24a6f6b30d55f3271f017a54de201c438fc388a0a501d7` |

### Use

```text
usage: atp-validate <path> [--host-profile none|domios] [--json]
       atp-validate schema --spec-version <YYYY-MM-DD>
```

- `<path>` is a `name.team.yaml` file, a `name.team` archive or a package folder.
- `--host-profile` names the host whose built-in worker names apply; the default is `none`.
  With `none`, a worker without instructions is a warning (`inherits_host_role`); with
  `domios`, a worker that is not a Domios built-in worker needs instructions
  (`missing_field`).
- `--json` prints the report as JSON instead of text.
- `atp-validate schema --spec-version 2026-11-11` prints the JSON Schema of that
  specification version, byte-identical to `schema/2026-11-11/team.schema.json`.

Text output names the file, line and column, severity, code and YAML path of each
diagnostic, then a summary line:

```text
team.yaml:21:7: error[same_as_cycle] workers.checker.model.same_as: `same_as` from `checker` leads back to itself
invalid com.example/same-as-cycle@1.0.0: 2 error(s), 0 warning(s)
```

Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | The package is valid. Warnings may be reported. |
| 1 | The package has at least one error. |
| 2 | Usage error, or the path cannot be read. |

## WebAssembly module

[`2026.11.11/`](2026.11.11/) holds a `wasm-bindgen --target web` module:
`atp_validate.js`, `atp_validate_bg.wasm` and their TypeScript declarations. It exports:

- `check_yaml(text, profile)`: checks the single-file form given as text.
- `check_archive(bytes, profile)`: checks the `.team` ZIP form given as bytes.

`profile` is `none` or `domios`; any other value throws. Each returns the same JSON report as
`atp-validate --json`. The module has no folder entry point.

In a browser, the default export loads `atp_validate_bg.wasm` from next to the module:

```js
import init, { check_yaml } from './atp_validate.js';
await init();
const report = JSON.parse(check_yaml(text, 'none'));
```

In Node.js, pass the WebAssembly bytes to `initSync`:

```js
import { readFileSync } from 'node:fs';
import { initSync, check_yaml } from './atp_validate.js';
initSync({ module: readFileSync(new URL('./atp_validate_bg.wasm', import.meta.url)) });
const report = JSON.parse(check_yaml(readFileSync('team.yaml', 'utf8'), 'domios'));
```

## Report format

The JSON report has `format`, `valid`, `name` and `version` (when readable) and
`diagnostics`. Each diagnostic has `code`, `severity` (`error` or `warning`), the
package-relative `file`, the YAML `path` of the node, `line` and `column` where known, and a
`message`. The conformance corpus in `corpus/<spec version>/cases.json` lists the codes,
paths and lines each case expects.
