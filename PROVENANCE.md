# Provenance of generated artifacts

The Agentic Team Protocol JSON Schema, conformance corpus and reference validator come
from the Domios reference implementation. They are committed here byte-for-byte as the
reference implementation produced them: never written, reformatted or edited by hand. This
file records, for each artifact, the Domios source commit, the crate, the command that
produced the bytes, the builder, and the SHA-256 of every committed file.

A published dated directory (`schema/<YYYY-MM-DD>/`, `corpus/<YYYY-MM-DD>/`) never changes;
`scripts/check-immutability.mjs` enforces it. A correction is a new dated directory.

## Licenses

`schema/`, `corpus/` and `validator/` are licensed under the Apache License 2.0, the
license of this repository ([LICENSE](LICENSE)). Each Domios component they are generated
from is licensed Apache-2.0 at Domios commit `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49`
(`domios-dev/domios`). That commit is also the source commit of every artifact below.

| Component (Domios path) | Used for | License | Taken from, at `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` |
| --- | --- | --- | --- |
| Crate `codeterm-team-package` (`src-tauri/crates/codeterm-team-package`) | the corpus (its `fixtures/corpus/`), the JSON Schema generator, the `atp-validate` binaries, the validation code in the WebAssembly module | Apache-2.0 | `Cargo.toml` (`license = "Apache-2.0"`) and the crate's `LICENSE` |
| Crate `codeterm-team-package-wasm` (`src-tauri/crates/codeterm-team-package-wasm`) | the WebAssembly wrapper in `validator/2026.11.11/` | Apache-2.0 | `Cargo.toml` (`license = "Apache-2.0"`) and the crate's `LICENSE` |
| Team templates (`src-tauri/team-templates`), embedded in the crate through `include_dir!` | the built-in templates compiled into the binaries and the WebAssembly module | Apache-2.0 | `LICENSE` and the notice in `README.md` of that directory |

## Conformance corpus 2026-11-11

| Field | Value |
| --- | --- |
| Directory | `corpus/2026-11-11/` |
| Spec version | 2026-11-11 |
| Domios commit | `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` (Domios integration branch `feature/atp-1.20.0`, repository `domios-dev/domios`) |
| Crate | `codeterm-team-package` 0.0.0 (`src-tauri/crates/codeterm-team-package`) |
| Source path | `src-tauri/crates/codeterm-team-package/fixtures/corpus/` |
| Generator command | `git -c core.autocrlf=false -c core.eol=lf archive --format=tar abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49 -- src-tauri/crates/codeterm-team-package/fixtures/corpus \| tar -x --strip-components=5 -C corpus/2026-11-11` |
| Builder | none (git export) |
| License | Apache-2.0 (see [Licenses](#licenses)) |
| Files | 41 |

The corpus is exported without line-ending conversion: with `core.autocrlf=true`, a plain
`git archive` writes CRLF into text files that have no `eol` attribute
(`invalid/unreferenced-entry/notes.txt`, `valid/reference/data/competitors.csv`), and the
bytes no longer match the source blobs.

The corpus case `valid/reference/` is a separate fixture, not a copy of the published
package `packages/com.example/research-desk/2.1.0/`. Its `team.yaml` is byte-identical to that
version's folder-form `team.yaml`. Its other files (`assets/logo.png`, `blueprints/digest.yaml`,
`data/competitors.csv`, `skills/market-sizing/SKILL.md`, `workers/checker.md`) and
`valid/reference-inline.team.yaml` differ from the published package's files.

Each SHA-256 below is of the source blob (`git cat-file blob <blob>` in the Domios
repository) and equals the SHA-256 of the committed file.

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `corpus/2026-11-11/cases.json` | `f2182999a2054525a3529de29d7307b5d08cb7e8` | `dec45f8d4750fc84ec5c9e42d6fa94eacbc250b0adf3f29b6e82043283720cc5` |
| `corpus/2026-11-11/invalid/anchor-alias.team.yaml` | `484f00c437db6a41400a5a4debb1253a2078de6b` | `8691851bee216e910fe124dc72edbe2871b99d5feaa6119936102a2202f2dc48` |
| `corpus/2026-11-11/invalid/bare-skill.team.yaml` | `858ca737e507a0e32c262def55024b9868f34d4f` | `915224da97d53630b3987eda2612afbcf7143f350092d4b55f06e4c0b1fb312a` |
| `corpus/2026-11-11/invalid/build-owner.md` | `11a125105cbe2294ea3239c28c220bb046db5293` | `157380650c8177bf98ac24c5ce17e268d38b49ae19d2c19bd6bb12c7df2e0e1e` |
| `corpus/2026-11-11/invalid/default-path-only.team.yaml` | `88055b1b01e00fe3d792fa736c73b6a927c7586a` | `1f7a603be4e756a4c4a8349581ae661461e80fc4d03c74cfd28dcb1d829bfb1a` |
| `corpus/2026-11-11/invalid/distributed-bets.team.yaml` | `6d855fa7147ce5e4c1b917969f4a6f9d492884dc` | `c55e1bcfe2851dcb4606d8759d5aeb406d1b46f3ec482bb6494bb61fa21510c1` |
| `corpus/2026-11-11/invalid/duplicate-key.team.yaml` | `96882c2c2041781fb3b117d6d4252dfe22f05172` | `9683fda3b85f1cf3c7763264b71ebd14b738181786b2b1e3dfe085001ffa83ea` |
| `corpus/2026-11-11/invalid/icon-missing.team.yaml` | `0e5ed8035240347fb35d39ffc947db9808e5fea2` | `b71eaea63f3c3fcc9fa78c8902cc4494be3c6d6576a7ccb6de628995b859342c` |
| `corpus/2026-11-11/invalid/icon-not-image.team.yaml` | `dc00d6cde630fe71c75f9d1ec11d1b967bbc599a` | `32cb55c804c1fadcaa000a149f2ca4f7c8246375a8f281c56b02604bc9cd55e1` |
| `corpus/2026-11-11/invalid/icon-png-inline.team.yaml` | `12a4f3de6800afac1ae4420cc4c3572e18de7ab8` | `0bfb0b2a4953d3e39a1c66c8c66ff1705a57537b248a4b9586064ca2f8a4efae` |
| `corpus/2026-11-11/invalid/icon-svg-external.team.yaml` | `33e894640aab399db93149ffbcd0d3a3136d52cd` | `b7eaeb3cfbe9909c0c23c5cd159df61649b112c83fa8362cc5f1b9b6d2397179` |
| `corpus/2026-11-11/invalid/icon-svg-script.team.yaml` | `38e8dbe6a2421a9497056f1626f6be68a00f29aa` | `48824f21823d3a4ee20ec1520d174462e990d30951937dcd7b1fb33f47bfc0c0` |
| `corpus/2026-11-11/invalid/invalid-derived-from.team.yaml` | `6a6230b68aa8151591c11133effda595b4dbfe37` | `29379c6bcaf5263ee08c559c4c7c34271f82cfbb0c4097d23cda9527708a0908` |
| `corpus/2026-11-11/invalid/invalid-model.team.yaml` | `51922d76d7721e34f19708246db348c0d938ed82` | `f6e1530e5635b564664dfcab81c9e093610ff62b29967a1e3e16c4357ef534fe` |
| `corpus/2026-11-11/invalid/invalid-schedule.team.yaml` | `d9aa578d93544edc244cb541a5b499badf26f91c` | `1c27ce2d3a0c326d8efff9cc29e284e75fe6929867b365fac8601b2fc1961e6d` |
| `corpus/2026-11-11/invalid/missing-file.team.yaml` | `a52d684437bc295f0be9d90ed262bf9b10e56ceb` | `16d404661f13d1a0f9cfa07e1e57c667fc3accf2d7efcde455ae16669f9dfdbc` |
| `corpus/2026-11-11/invalid/missing-orchestrator.team.yaml` | `23ba0c6e7a28a891e9bfdfed39ce1513bbe677ec` | `e7ab76492f0ea9ccb113f8daa012d6e357dfe645f8e9454820914a654de4dfe2` |
| `corpus/2026-11-11/invalid/new-worker-no-instructions.team.yaml` | `f92f79381d704abe537a384495c9782cf8a992db` | `a788cf395549523ef2b5c710d2427280263e4e99ee361f7a2ce5c6e8403d48f4` |
| `corpus/2026-11-11/invalid/orchestrator-on-demand.team.yaml` | `05cbfa7c9fcaf409e0974d86b06cb989e7fd3e33` | `21f1df451c83322a1ca80e4d22457fca5587ed9473d9210658254cc54ecf27a8` |
| `corpus/2026-11-11/invalid/plan-template.team.yaml` | `f02cd349f96adc916d511d608935fc37be936041` | `09f01f36aa22952ef654e1ba9a5cb217bd2f10b78858a28992089cf0c504ab4a` |
| `corpus/2026-11-11/invalid/release-train.team.yaml` | `c8feed318580154eb68f3c3bafd4c547de18c8f8` | `73a733ebd7a482b649fbe733cc1fb2848951f28707dff0a518325c503a2ff640` |
| `corpus/2026-11-11/invalid/removed-inherit.team.yaml` | `b62a0c012497c98d26daafd147496d0f96e88c73` | `137af715b793a72a43df968adc71de3a2d447da4bf3945ab2093ad1a58fc0dae` |
| `corpus/2026-11-11/invalid/removed-kind.team.yaml` | `9ac29177a702e2bc8202f9e062badc2ac2fa5eb7` | `d3150b7eba9814c6582c0e97b56e429bc87d262f9b7219b7770acd4adceeddd4` |
| `corpus/2026-11-11/invalid/removed-top-instructions.team.yaml` | `162496ed831e7d1be410b149899a38485f566b08` | `dc3aff2316eed32afad72ec5fbfc9ddf810987fa7ea1197661e1047ec1d55a3d` |
| `corpus/2026-11-11/invalid/reserved-worker.team.yaml` | `28b8a10a0ea4df50e1e84387f1f5d4b3046d97ce` | `35c08eaa130206b030a1f4ff5eaf70c805d268645bd923ccb2eda7f5b82e171f` |
| `corpus/2026-11-11/invalid/role-includes.team.yaml` | `e335587a8c48da5cbe9b7f284389bc98a22bb9bb` | `5b7f50230ab740984fcf176577c75613bc417f08d49f1561349400881e29dc1c` |
| `corpus/2026-11-11/invalid/same-as-cycle.team.yaml` | `2abe619fc87ab2307ab9cce3a8e524357efcba38` | `15c49fe5a719dfa8c702f5cf9e2da328849bafe53e94f94e75c6ec0ca98f0a38` |
| `corpus/2026-11-11/invalid/same-as-unknown.team.yaml` | `20b9ee1fb6f0c7d6af33b708694407cb73078cbf` | `58e1fd7674cb623a62935289358b5519a74f6fc8dab5ff11738c000905adfdee` |
| `corpus/2026-11-11/invalid/tab-indentation.team.yaml` | `24fea7aac07f91db32bf85024b288a8a3289e791` | `093f7a4f97ca651855a55519475222800a006f0706f35c7baa87afd7c215ddaa` |
| `corpus/2026-11-11/invalid/unknown-field.team.yaml` | `1398a83737cc3da8bf3bbdd67c89166d84b66efe` | `a9fd130168e9839bdb9080222e952f0b334896924bba59651e9c2ffc9acc3a09` |
| `corpus/2026-11-11/invalid/unreferenced-entry/notes.txt` | `946d7b47aae57046fe26beb6d856067e76c1e2d7` | `43bab6c26bc03299f3e5108f37cfa190ef6446cfe38f4229204a0d6b88e4b102` |
| `corpus/2026-11-11/invalid/unreferenced-entry/team.yaml` | `8b91ef61b8f1b399aec316ec9cf9d664ac9a9b7e` | `53a70bceb79ecddb4c29caf82290bdffb96397e20ad78867868fb36fd633975d` |
| `corpus/2026-11-11/valid/reference-inline.team.yaml` | `0d3c58215b28a4473708965a107bc5ac1ce22858` | `9c848278cdf7964f85b338aea8462e04a86edb9e3e7dc492ad7f1e988a4698d6` |
| `corpus/2026-11-11/valid/reference/assets/logo.png` | `613754cfaf74a7a2d86984231479d5671731f18a` | `497790947d4666760ce38f3c00e852c71fdb66cae849bae8e9ede352719e1581` |
| `corpus/2026-11-11/valid/reference/blueprints/digest.yaml` | `33db99a8f9042de8c767b79e06db0f029153add9` | `8ffc07ed088bd011e252b5878ecbd075277abc1d1d24c5a2a441c01753c1c2f2` |
| `corpus/2026-11-11/valid/reference/data/competitors.csv` | `568bb0e26e5d8507e4ba0810a0bd08d542adf260` | `22fd8510dd5a2e5a6129583b88cb70d7a9eb68a5d433b5425cb6ee4523963d09` |
| `corpus/2026-11-11/valid/reference/skills/market-sizing/SKILL.md` | `eb39887b8ebb91f13b7eaf80c34a668247ddb93b` | `4d89ff3c06f9a26b99cfd4952a35bc93d5a4983441dd4258007a3c0e16b20d3e` |
| `corpus/2026-11-11/valid/reference/team.yaml` | `1cdfc55266e16eb93879398abdc0de6434c00e7a` | `ed147579d4390b8177780a0f4082e60d4c95263e0d6c9be7772db56c628aaed4` |
| `corpus/2026-11-11/valid/reference/workers/checker.md` | `92f1eb0513e6c8278af6bf1762c6a3507ec64798` | `2a508fa5190dac37730490d6b96638bfeb3959ffeefade5b03dfc4ede0e2a02e` |
| `corpus/2026-11-11/valid/role-extension.team.yaml` | `fcf73a5cb0480c0752e2ecccdd8b999ce235062e` | `27ae22dcc86ebba91ddb733bc114f9e18322af02a26a7182edeaa4f1130c8465` |
| `corpus/2026-11-11/valid/unresolved-skill.team.yaml` | `14e8947b9c8173f4762ca3549e4d350c62c126c6` | `87adafcda790c974345b83befc96bbbe322b60d676d86d8055bcf62c38206fe0` |

Check the committed bytes against this table:

```sh
sha256sum $(git ls-files corpus/2026-11-11)
```

## Build run

The JSON Schema and the reference validator are built by this repository's workflow
[`.github/workflows/validator.yml`](.github/workflows/validator.yml) on GitHub-hosted
runners, never on a developer machine. Its `manifest` artifact lists the SHA-256 of every
file the run produced, the exact commands, the toolchains and the run URL.

| Field | Value |
| --- | --- |
| Run | <https://github.com/domios-dev/agentic-team-protocol/actions/runs/43267871169> (attempt 1) |
| Workflow commit | `45603470b0f8195ccc4943507abf097f7ed3e905` (pull request head; the run's merge commit is `f1d4bef264912191090038156a90afc8adba53f3`) |
| Domios commit | `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49` (`domios-dev/domios`, pinned in `DOMIOS_SHA`) |
| Crates | `codeterm-team-package` 0.0.0 (`atp-validate` binary), `codeterm-team-package-wasm` 0.0.0 |
| Toolchain | rustc 1.99.1 (58cf8f9c3 2026-10-13), cargo 1.99.1 (5f94df478 2026-08-27), from Domios `rust-toolchain.toml` |
| wasm-bindgen | crate and CLI 0.2.130 (resolved in the generated `Cargo.lock`) |
| Builder | GitHub Actions, workflow `validator.yml` |
| License | Apache-2.0 (see [Licenses](#licenses)) |

| Target | Runner image | Command (run in the Domios checkout) |
| --- | --- | --- |
| `x86_64-unknown-linux-musl` | ubuntu24/20261101.360.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-unknown-linux-musl` |
| `aarch64-apple-darwin` | macos15/20261104.0514.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target aarch64-apple-darwin` |
| `x86_64-apple-darwin` | macos15/20261104.0514.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-apple-darwin` |
| `x86_64-pc-windows-msvc` | win25-vs2026/20261103.298.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-pc-windows-msvc` |
| `wasm32-unknown-unknown` | ubuntu24/20261111.370.1 | `cd src-tauri/crates/codeterm-team-package-wasm && cargo build --release --target wasm32-unknown-unknown`; `cargo install wasm-bindgen-cli --version 0.2.130 --locked`; `wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/atp_validate.wasm` |

## JSON Schema 2026-11-11

| Field | Value |
| --- | --- |
| File | `schema/2026-11-11/team.schema.json` |
| URL | <https://atp.domios.dev/schema/2026-11-11/team.schema.json> (its `$id`) |
| Dialect | JSON Schema draft-07 (`$schema`: `http://json-schema.org/draft-07/schema#`); the generator (schemars 0.8) has no 2020-12 mode |
| Command | `atp-validate-x86_64-unknown-linux-musl schema --spec-version 2026-11-11 > schema/2026-11-11/team.schema.json` (job "Schema and example run" of the build run) |
| SHA-256 | `4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300` |

The file is committed exactly as the command wrote it, and its SHA-256 equals the
`schema-and-example-run` artifact entry in the manifest.

## Reference validator 2026.11.11

`2026.11.11` is the artifact version the owner chose. The crates are version 0.0.0, and
the generated files embed no version string.

WebAssembly module, committed under `validator/2026.11.11/` (artifact `atp-validate-wasm`):

| File | SHA-256 |
| --- | --- |
| `validator/2026.11.11/atp_validate.js` | `9947d825f0abecb45815c89daa4cb8b5aad46530b95bc4e8d19e1ff2a0522747` |
| `validator/2026.11.11/atp_validate_bg.wasm` | `fccc197c36eeeae7631a5f053ca37ed96a9cf9a3e15515668e19bca9231b36f7` |
| `validator/2026.11.11/atp_validate.d.ts` | `0fe6081a9f2cef13b68011a267d29062bbec25fcbe13e0e5a31aef6d52831708` |
| `validator/2026.11.11/atp_validate_bg.wasm.d.ts` | `2130f3faaab00462c0e7bcce5ae0866421028403cb73d15bb01f805ee40848c9` |
| `validator/2026.11.11/Cargo.lock` (generated by the wasm build) | `6fb8f436c7d1f917d07b3d047a6256acf444b645ad38f16dcff3e1379bdb31dc` |

Command-line binaries, not committed (for a GitHub Release; see
[validator/README.md](validator/README.md)):

| File | Target | SHA-256 |
| --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | x86_64 Linux (static, musl) | `66a196322b0dd0bf3529a0506caac004fb61c9d99311ba824a3b008e19e420c4` |
| `atp-validate-aarch64-apple-darwin` | Apple silicon macOS | `ac5a8ffb51986022e09ea49e7c648bc641a75bee79553a1e2ec33baee25d2f61` |
| `atp-validate-x86_64-apple-darwin` | Intel macOS | `9cbaf22a66458ae116008614dd39a292d20c961322747c9ca1e1d03bd367d50e` |
| `atp-validate-x86_64-pc-windows-msvc.exe` | x86_64 Windows | `71e09ed921b5d7a17b24a6f6b30d55f3271f017a54de201c438fc388a0a501d7` |

## Example run

The same build run checks every input under `examples/` and every form of every package
under `packages/` with the Linux binary, under host profiles `none` and `domios`
(`atp-validate <input> --host-profile <profile> --json`). Its report is the
`examples-report.jsonl` file of the `schema-and-example-run` artifact (SHA-256
`5f1bc8da2be0bf2f8527aee156ffe32d0a56a18ee7350f0e4149cef2ac52b5f2`). Codes and locations
that `examples/**/expected.yaml` takes from this run name it as `validator_run`.
