# Agentic Team Protocol reference validator

The reference validator checks an Agentic Team Protocol package in any of its three forms
(`name.team.yaml`, `name.team` ZIP archive, or folder) and reports every error and warning
with the stable codes in section 15 of the specification. It is built from the
`codeterm-team-package` crate of the Domios reference implementation by this repository's
workflow `.github/workflows/validator.yml`; [PROVENANCE.md](../PROVENANCE.md) records the
source commit, build commands, toolchain and checksums. Domios is not needed to install or
run it.

Version: `2026.11.11`, the artifact version the owner chose (the crates are version 0.0.0;
the generated files embed no version string). License: Apache-2.0, the license of this
repository ([LICENSE](../LICENSE)); the Domios crates `codeterm-team-package` and
`codeterm-team-package-wasm` and the team templates they embed are licensed Apache-2.0 at
the source commit, see [PROVENANCE.md](../PROVENANCE.md#licenses).

| Build | Where |
| --- | --- |
| `atp-validate` command-line tool (Linux, macOS, Windows) | GitHub Release [`validator-2026.11.11`](https://github.com/domios-dev/agentic-team-protocol/releases/tag/validator-2026.11.11) of this repository: four binaries and `SHA256SUMS` |
| WebAssembly module for browsers and JavaScript runtimes | [`2026.11.11/`](2026.11.11/) |

## Command-line tool

### Install

1. Download the binary for your platform and `SHA256SUMS` from the release
   [`validator-2026.11.11`](https://github.com/domios-dev/agentic-team-protocol/releases/tag/validator-2026.11.11).
2. Check the binary's SHA-256 against `SHA256SUMS` and the table below.
3. Rename it to `atp-validate` (`atp-validate.exe` on Windows) and put it in a directory
   on your `PATH`. On Linux and macOS, make it executable first.

On Linux or macOS (set `target` to `aarch64-apple-darwin` on Apple silicon or
`x86_64-apple-darwin` on an Intel Mac):

<!-- install:posix -->
```sh
target=x86_64-unknown-linux-musl
release=https://github.com/domios-dev/agentic-team-protocol/releases/download/validator-2026.11.11
curl -fsSLO "$release/atp-validate-$target"
curl -fsSLO "$release/SHA256SUMS"
grep " atp-validate-$target\$" SHA256SUMS | shasum -a 256 -c -
chmod +x "atp-validate-$target"
mkdir -p "$HOME/.local/bin"
mv "atp-validate-$target" "$HOME/.local/bin/atp-validate"
```

On Windows (PowerShell):

<!-- install:powershell -->
```powershell
$file = 'atp-validate-x86_64-pc-windows-msvc.exe'
$release = 'https://github.com/domios-dev/agentic-team-protocol/releases/download/validator-2026.11.11'
Invoke-WebRequest "$release/$file" -OutFile $file
Invoke-WebRequest "$release/SHA256SUMS" -OutFile SHA256SUMS
$expected = (Select-String -Path SHA256SUMS -Pattern " $file$").Line.Split(' ')[0]
if ((Get-FileHash $file -Algorithm SHA256).Hash -ne $expected) { throw "SHA-256 mismatch: $file" }
New-Item -ItemType Directory -Force "$HOME\bin" | Out-Null
Move-Item -Force $file "$HOME\bin\atp-validate.exe"
```

Then add `$HOME/.local/bin` (Windows: `$HOME\bin`) to your `PATH` if it is not on it, and
run `atp-validate <path>`. The binaries are not code-signed; on macOS, remove the
quarantine attribute if the system blocks the binary
(`xattr -d com.apple.quarantine "$HOME/.local/bin/atp-validate"`).

The release binaries and their SHA-256:

| File | Platform | SHA-256 |
| --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | x86_64 Linux (static, musl) | `6adfa021bda8bd56a46805025c424d75891f523a44af238f8b1572aff082dc7d` |
| `atp-validate-aarch64-apple-darwin` | Apple silicon macOS | `c8b52eae2040016837182923eaf94486e4424c37bebaf6f8880dcac4e04955cc` |
| `atp-validate-x86_64-apple-darwin` | Intel macOS | `03e4f3e3f5ce92a023d18ef9fb960e2b64353cd494a4df543d00469777eec9dc` |
| `atp-validate-x86_64-pc-windows-msvc.exe` | x86_64 Windows | `f1da9f500caacda004545332a0224428906cc5dcd64a94c6449b1215aaf2eacc` |

They come from build run
[43468853771](https://github.com/domios-dev/agentic-team-protocol/actions/runs/43468853771)
at Domios commit `fafc45b8b68808530d6c2fe4956af0fa9d23dd54`. The release was replaced once,
in place, under the owner's first-release exception recorded in
[PROVENANCE.md](../PROVENANCE.md#owner-exception), which also lists the superseded
checksums.

### Use

```text
usage: atp-validate <path> [--json]
       atp-validate schema --spec-version <YYYY-MM-DD>
```

- `<path>` is a `name.team.yaml` file, a `name.team` archive or a package folder. The
  validator takes no host input such as a host profile.
- `--json` prints the report as JSON instead of text.
- `atp-validate schema --spec-version 2026-11-11` prints the JSON Schema of that
  specification version, byte-identical to `schema/2026-11-11/team.schema.json`.

Text output names the file, line and column, severity, code and YAML path of each
diagnostic, then a summary line:

```text
team.yaml:23:7: error[same_as_cycle] roles.checker.model.same_as: `same_as` from `checker` leads back to itself
team.yaml:16:7: error[same_as_cycle] roles.researcher.model.same_as: `same_as` from `researcher` leads back to itself
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

- `check_yaml(text)`: checks the single-file form given as text.
- `check_archive(bytes)`: checks the `.team` ZIP form given as bytes.

Each returns the same JSON report as `atp-validate --json`. The module has no folder entry
point.

In a browser, the default export loads `atp_validate_bg.wasm` from next to the module:

```js
import init, { check_yaml } from './atp_validate.js';
await init();
const report = JSON.parse(check_yaml(text));
```

In Node.js, pass the WebAssembly bytes to `initSync`:

```js
import { readFileSync } from 'node:fs';
import { initSync, check_yaml } from './atp_validate.js';
initSync({ module: readFileSync(new URL('./atp_validate_bg.wasm', import.meta.url)) });
const report = JSON.parse(check_yaml(readFileSync('team.yaml', 'utf8')));
```

## Report format

The JSON report has `format`, `valid`, `name` and `version` (when readable) and
`diagnostics`. Each diagnostic has `code`, `severity` (`error` or `warning`), the
package-relative `file`, the YAML `path` of the node, `line` and `column` where known, and a
`message`. The conformance corpus in `corpus/<spec version>/cases.json` lists the codes,
paths and lines each case expects.

## Conformance run

With the command-line tool installed as above, `npm ci` and then
`node scripts/conformance.mjs` in a checkout of this repository run it, and the
WebAssembly module, over every package form, every example and every corpus case, and
fail on any difference from the recorded results. The workflow
`.github/workflows/conformance.yml` does the same on fresh Linux, macOS and Windows
runners, installing the tool with the commands above.
