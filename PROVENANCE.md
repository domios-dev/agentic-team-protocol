# Provenance of generated artifacts

The Agentic Team Protocol JSON Schema, conformance corpus and reference validator come
from the Domios reference implementation. They are committed here byte-for-byte as the
reference implementation produced them: never written, reformatted or edited by hand. This
file records, for each artifact, the Domios source commit, the crate, the command that
produced the bytes, the builder, and the SHA-256 of every committed file.

A published dated directory (`schema/<YYYY-MM-DD>/`, `corpus/<YYYY-MM-DD>/`) and a published
validator version (`validator/<YYYY.MM.DD>/`) never change; `scripts/check-immutability.mjs`
enforces it. A correction is a new directory. The one exception, made once by the owner for
the first release, is recorded under [Owner exception](#owner-exception).

## Owner exception

The first release of specification version 2026-11-11 had no users. The owner therefore
allowed a one-time first-release exception for the roles map (one map of managers and
workers): the 2026-11-11 JSON Schema, the conformance corpus 2026-11-11 and the reference
validator 2026.11.11 were rewritten in place. There is no new version and no
migration. The names stay the same: `schema/2026-11-11/`, the schema `$id`
<https://atp.domios.dev/schema/2026-11-11/team.schema.json>, `corpus/2026-11-11/`,
`validator/2026.11.11/` and the release tag `validator-2026.11.11`.
`packages/IMMUTABILITY-EXCEPTIONS.json` lists every added, modified and deleted file of
this rewrite, and `scripts/check-immutability.mjs` admits exactly those files.

Every section below describes the rewritten artifacts. The first release came from Domios
commit `abe52ab407be6db0b1e9e3bc26fedd8db4cb8a49`, build run
<https://github.com/domios-dev/agentic-team-protocol/actions/runs/43267871169>. Its
superseded SHA-256 values are:

- JSON Schema `schema/2026-11-11/team.schema.json`:
  4ebc85adbcd99c9bfbe1cfb828e095d31cb128a6e9a24c2e41ba2e2d71580300
- WebAssembly module `atp_validate.js`:
  9947d825f0abecb45815c89daa4cb8b5aad46530b95bc4e8d19e1ff2a0522747
- WebAssembly module `atp_validate_bg.wasm`:
  fccc197c36eeeae7631a5f053ca37ed96a9cf9a3e15515668e19bca9231b36f7
- WebAssembly module `atp_validate.d.ts`:
  0fe6081a9f2cef13b68011a267d29062bbec25fcbe13e0e5a31aef6d52831708
- WebAssembly module `atp_validate_bg.wasm.d.ts`:
  2130f3faaab00462c0e7bcce5ae0866421028403cb73d15bb01f805ee40848c9
- Release binary `atp-validate-x86_64-unknown-linux-musl`:
  66a196322b0dd0bf3529a0506caac004fb61c9d99311ba824a3b008e19e420c4
- Release binary `atp-validate-aarch64-apple-darwin`:
  ac5a8ffb51986022e09ea49e7c648bc641a75bee79553a1e2ec33baee25d2f61
- Release binary `atp-validate-x86_64-apple-darwin`:
  9cbaf22a66458ae116008614dd39a292d20c961322747c9ca1e1d03bd367d50e
- Release binary `atp-validate-x86_64-pc-windows-msvc.exe`:
  71e09ed921b5d7a17b24a6f6b30d55f3271f017a54de201c438fc388a0a501d7
- Release `SHA256SUMS`:
  53cdcb7b55ea9275b0e959df1f67b25e652cf5ce3caca90eb4f30ecbc710976f

The generated `validator/2026.11.11/Cargo.lock` is unchanged by the rewrite. The superseded
corpus is the `corpus/2026-11-11/` tree of this repository's commit
`0111ff8795cbadd92bb6ea74c6e8eb504ab20753`.

## Licenses

`schema/`, `corpus/` and `validator/` are licensed under the Apache License 2.0, the
license of this repository ([LICENSE](LICENSE)). Each Domios component they are generated
from is licensed Apache-2.0 at Domios commit `fafc45b8b68808530d6c2fe4956af0fa9d23dd54`
(`domios-dev/domios`). That commit is also the source commit of every artifact below.

| Component (Domios path) | Used for | License | Taken from, at `fafc45b8b68808530d6c2fe4956af0fa9d23dd54` |
| --- | --- | --- | --- |
| Crate `codeterm-team-package` (`src-tauri/crates/codeterm-team-package`) | the corpus (its `fixtures/corpus/`), the JSON Schema generator, the `atp-validate` binaries, the validation code in the WebAssembly module | Apache-2.0 | `Cargo.toml` (`license = "Apache-2.0"`) and the crate's `LICENSE` |
| Crate `codeterm-team-package-wasm` (`src-tauri/crates/codeterm-team-package-wasm`) | the WebAssembly wrapper in `validator/2026.11.11/` | Apache-2.0 | `Cargo.toml` (`license = "Apache-2.0"`) and the crate's `LICENSE` |
| Team templates (`src-tauri/team-templates`), embedded in the crate through `include_dir!` | the built-in templates compiled into the binaries and the WebAssembly module | Apache-2.0 | `LICENSE` and the notice in `README.md` of that directory |

## Conformance corpus 2026-11-11

| Field | Value |
| --- | --- |
| Directory | `corpus/2026-11-11/` |
| Spec version | 2026-11-11 |
| Domios commit | `fafc45b8b68808530d6c2fe4956af0fa9d23dd54` (Domios integration branch `feature/atp-1.20.0`, repository `domios-dev/domios`) |
| Crate | `codeterm-team-package` 0.0.0 (`src-tauri/crates/codeterm-team-package`) |
| Source path | `src-tauri/crates/codeterm-team-package/fixtures/corpus/` |
| Generator command | `git -c core.autocrlf=false -c core.eol=lf archive --format=tar fafc45b8b68808530d6c2fe4956af0fa9d23dd54 -- src-tauri/crates/codeterm-team-package/fixtures/corpus \| tar -x --strip-components=5 -C corpus/2026-11-11` |
| Builder | none (git export) |
| License | Apache-2.0 (see [Licenses](#licenses)) |
| Files | 50 |

The corpus is exported without line-ending conversion: with `core.autocrlf=true`, a plain
`git archive` writes CRLF into text files that have no `eol` attribute
(`invalid/unreferenced-entry/notes.txt`, `valid/reference/data/competitors.csv`), and the
bytes no longer match the source blobs. The committed tree's 50 git blob ids equal the
source tree's.

The corpus case `valid/reference/` is a separate, smaller fixture, not a copy of the
published package `packages/com.example/research-desk/2.1.0/`. Five of its files are
byte-identical to files of that version's folder form:

- `assets/logo.png`
- `blueprints/digest.yaml`
- `data/competitors.csv`
- `skills/market-sizing/SKILL.md`
- `roles/checker.md`, which the package holds as `workers/checker.md`, because the
  exporter writes role instructions under `managers/` and `workers/`

Its `team.yaml` and `valid/reference-inline.team.yaml` differ from the package's
`team.yaml` and single file. The package declares more roles and files than the fixture.

Each SHA-256 below is of the source blob (`git cat-file blob <blob>` in the Domios
repository) and equals the SHA-256 of the committed file.

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `corpus/2026-11-11/cases.json` | `d15f557cc33cdae8a34f09e5465ab11245380d6d` | `0a4dd7983a7b015e73be4505306e1c88331b60748e905c9d2c885a36ac272d8e` |
| `corpus/2026-11-11/invalid/anchor-alias.team.yaml` | `244324cc6c8363f14f4b31cecbd297d94bdd1b1c` | `4e33fcd6872702bef93f66bfb5faeca0838eef8e0cf65d14d9ec4d442dc6ec43` |
| `corpus/2026-11-11/invalid/bad-role-name.team.yaml` | `8fd1af6d7fdfc9623c71830be2490177128b0920` | `305a5594f3cf89ddc33636aa867b0955277f5c9183b3fb8ae6aa87ea1b00ffb5` |
| `corpus/2026-11-11/invalid/bare-skill.team.yaml` | `eb78bc5b449760cfc3619d9ff8b6a5e188d77463` | `4f1462df031fa8d21473908bde1555e505bd0d56bc85dffe8294732e5be3d2dc` |
| `corpus/2026-11-11/invalid/build-owner.md` | `11a125105cbe2294ea3239c28c220bb046db5293` | `157380650c8177bf98ac24c5ce17e268d38b49ae19d2c19bd6bb12c7df2e0e1e` |
| `corpus/2026-11-11/invalid/builtin-name-no-instructions.team.yaml` | `58db49b1127881fc5d247102c820305d4c18f991` | `d100345a97edfebd2e5b01493a519d36d41c4c879dedf00e7a54fbc19f9d089d` |
| `corpus/2026-11-11/invalid/default-path-only.team.yaml` | `016a859df5238fa37d29b875b750daf29bc5bd01` | `c4391b9b84945b3dea3a063f14359e490c03c1ddddd486f497087274816d9744` |
| `corpus/2026-11-11/invalid/distributed-bets.team.yaml` | `5789c992bafdba929210a461959a22291f692227` | `3d46c76d5cbaf6dfda21c08e508a428a6c7da47126d57893856d2a1b43844d42` |
| `corpus/2026-11-11/invalid/duplicate-key.team.yaml` | `ec26d0811099f5a3d1d19fe39923e15e4953206e` | `ad33bf43552652011befd1700df430c40606cd7a0face9d35ea4771fb1a55080` |
| `corpus/2026-11-11/invalid/icon-missing.team.yaml` | `287c0597a5630071eab94462d2b4de14a2596974` | `729906a291d4d1abab71e355e5884da9dcdd2c4ad3066f146917399f88e1feda` |
| `corpus/2026-11-11/invalid/icon-not-image.team.yaml` | `94339221c391657b2f48e3e6d8c42b638a49c413` | `4e44e3f3e3a3b8714566aa070e3e4bd0c2eafe90a1e8583b12dd7fb7d90088a4` |
| `corpus/2026-11-11/invalid/icon-png-inline.team.yaml` | `991aae9f2f09ce2777be1192bc43111387f5eb5e` | `4e7e5de6580d71d3f501e3a438a167e72786bba42e4f4976e322354cd2cf5c5c` |
| `corpus/2026-11-11/invalid/icon-svg-external.team.yaml` | `d35bccdc92c2c3dcd2734885c78bbdc86c05ae31` | `82b6a47ead186496c52c9838f1bfd8cd4ba682d0606e866f5df739b58e78dc91` |
| `corpus/2026-11-11/invalid/icon-svg-script.team.yaml` | `4165108250f4ff559d3189ca6b81b7a0c57bac89` | `17a99015b2e12189ab3b83e05173f2876208c5cc034dce8bbcec156b91a13811` |
| `corpus/2026-11-11/invalid/instructions-both.team.yaml` | `25e198be95590b85c37ca14b09f7f35515c5e8ed` | `ad7b3983daf1afa5704c495264ee2f4228cd7b75a5f5c280ca2c1b269cc46fde` |
| `corpus/2026-11-11/invalid/invalid-derived-from.team.yaml` | `0dec4acb6a80b639e5213f5c8f8e686666f2d485` | `cd901f37360538909b642dd492bf5704c8698ca68b367cf7181270a68a092570` |
| `corpus/2026-11-11/invalid/invalid-kind.team.yaml` | `46a221c98e562943d6fcf8876bf6e85493609ca6` | `2a925984ee2b8247a2843bd6f3c595a8dc599ca0930114910c9492c1c83d960c` |
| `corpus/2026-11-11/invalid/invalid-model.team.yaml` | `b3d6511b38a8d4a8b6a80086bbfac4eb25918ff7` | `c6ce2b5a9391489d04ff239c422081897824937b998314b38d7b1930a3969668` |
| `corpus/2026-11-11/invalid/invalid-schedule.team.yaml` | `3a5a0369b86ac83410a7497560b1e4754b2e8b67` | `4186cc45784e3eb6c52bcc3be0b326a7c2e54a68910a0ad8a5ccc4a2234da3b8` |
| `corpus/2026-11-11/invalid/missing-file.team.yaml` | `cf30ad574988bc1ca5de48dd47b33493d3abbe0e` | `96370e7051153e8095f8705d275573d9e698ca1e6880a0fe52da1cf57cd3be00` |
| `corpus/2026-11-11/invalid/missing-kind.team.yaml` | `fac791c2d967068d3bf2327dc223e6401f74c867` | `c98b6d2ba6de1c5a08bec06587398145940ad2a223b51950274c9082d228e476` |
| `corpus/2026-11-11/invalid/missing-orchestrator.team.yaml` | `eb52cafdecea87ca1549eb8c8dbe1fa1e59d42d3` | `2aa6e640ccffeb0c569e4cebbe35d4a46811adb92875ab71dcec7b6186fd3a30` |
| `corpus/2026-11-11/invalid/new-worker-no-instructions.team.yaml` | `c8c6df71e9451d8465c0f82ab5d3d3d1bd3b71c6` | `2cce3805887a8ba56c5ac27df15f4ab9d1ff9bd1e246b0cf359708c9b91fe20b` |
| `corpus/2026-11-11/invalid/old-shape.team.yaml` | `c875f79498f77545ccff0db334eeb3fc4c489ebf` | `86f75497ddae5e4b7d7c4cfe122800678680e00a36ecb71c24fa9743ee0c48ee` |
| `corpus/2026-11-11/invalid/orchestrator-on-demand.team.yaml` | `a3fc003d691fa2ad4d97b069ae90c89e0e7ff6c3` | `d79f6a54cbf0ca61ac5451315d3eb7896a8c125980e921c426e37444eb11fba1` |
| `corpus/2026-11-11/invalid/orchestrator-worker.team.yaml` | `86644d43d0dc039685874cd05eb714cbc9c9c2c9` | `0d47a1556c5cb25ac90113ec6643358bd5eabe24f595caffa0ef041adab87cf2` |
| `corpus/2026-11-11/invalid/plan-template.team.yaml` | `7923e0679606e9d0ee47afe3ef484770fdcd40eb` | `7dd2aa629fffde25c7196ec067ee32b83d8fe6b3b1fb6ca28018c8423f9bb99b` |
| `corpus/2026-11-11/invalid/release-train.team.yaml` | `c8feed318580154eb68f3c3bafd4c547de18c8f8` | `73a733ebd7a482b649fbe733cc1fb2848951f28707dff0a518325c503a2ff640` |
| `corpus/2026-11-11/invalid/removed-inherit.team.yaml` | `a281cc49cd4c31a736a341e0e36262ce287aa82b` | `5b3bebd4226ce1a197140b266d4f364de3826135bf5c5a6e9455939862041cf2` |
| `corpus/2026-11-11/invalid/removed-top-instructions.team.yaml` | `88d6419c2c7300aebab967f31cd4d45dc374f4dd` | `64f3c0808696a81e624bb77d01a14c098c9d3046a13c4226a561d3f19b67f0ba` |
| `corpus/2026-11-11/invalid/reserved-worker.team.yaml` | `3a1e82d348fbbfc772c585c9e36551559aba47a6` | `60ec8ac73c95d4c681a7ad7408a4b34224f007def503ba80fde6791947520108` |
| `corpus/2026-11-11/invalid/role-includes.team.yaml` | `2033ca9afd737e99c078f048b3aff2611f0b5338` | `c33e041326f26b0bb3519787a76c146d4f21cb3f12c3f7d6fc79ae638a4cea48` |
| `corpus/2026-11-11/invalid/role-persona.team.yaml` | `b3ff3a0f2d4b1f5466ec29a79b8e122a6098137f` | `00a70f0e8fa19c4810d0dd9f953f1cd228b9fc1437356b9a29c27513d889cd21` |
| `corpus/2026-11-11/invalid/same-as-cycle.team.yaml` | `e2bfac62a8dbf009da2f36c6a400ce771a4f4ab2` | `6b24f91ed32b20c8049e6531d0984c4b00288d3902183514ec563098634720b3` |
| `corpus/2026-11-11/invalid/same-as-unknown.team.yaml` | `841e73f2b07c381a0ed1d640d837974b657ce0b3` | `6bf1bfaa2ed9e76bc3cc525b2ffa9b236eebe99fa059762e341c7b0ca4d8ad8d` |
| `corpus/2026-11-11/invalid/tab-indentation.team.yaml` | `f65da3818a756716962ef09f844736ca5b39a16b` | `11ca703f07da048ab3eeb970df7a91312591e4cc0eecc403191a671c4cefadd3` |
| `corpus/2026-11-11/invalid/unknown-field.team.yaml` | `d33f42333dcc8a6233af779c1f838c82c142f2a1` | `faf6d17b71583a62e8b2406c7bc750f8dbe8892757dc68e17154d10680acf074` |
| `corpus/2026-11-11/invalid/unreferenced-entry/notes.txt` | `946d7b47aae57046fe26beb6d856067e76c1e2d7` | `43bab6c26bc03299f3e5108f37cfa190ef6446cfe38f4229204a0d6b88e4b102` |
| `corpus/2026-11-11/invalid/unreferenced-entry/team.yaml` | `ad3f9c109c94f17deacd7f5ce2b552da97c6ee72` | `db0da5c83363b30164e4af2282d3a6914ebfb7d49dcab936ebd43789cbc2ef7c` |
| `corpus/2026-11-11/invalid/worker-with-team.team.yaml` | `256a601831d1422dea3876db8265064479ebb4ef` | `099f2ed3227fd83e612d0b3ba71317716a80d8c51602d4c7f29a39d96dd7a9e9` |
| `corpus/2026-11-11/valid/custom-manager.team.yaml` | `06d65ace6013f3c8ead7ad6229955ba375835623` | `e383ddcd1f5048e9bb5430f92652ec18c8059f40b6978c7896df568bd784797e` |
| `corpus/2026-11-11/valid/reference-inline.team.yaml` | `208a2b1d2741ad9f3ec0a0881b61de57c061e5d6` | `cb1c5ae528b88d73149a2a43fd92aa2588ffe558f6da7a9b055fc2d5dc347c05` |
| `corpus/2026-11-11/valid/reference/assets/logo.png` | `6c9a5179ba7f8c120a820dd829fdaba4981d6890` | `2fe4d14f63ac6a8bae1158f4f9f9725b0c90ffab3881e1f23873aaea735531c3` |
| `corpus/2026-11-11/valid/reference/blueprints/digest.yaml` | `a3d9462ef5b7bd59042f69bca1daa5af67e7e4b9` | `e6e18476f1c7c3fbc3b3e4002485338d281a71528af77fffca4abfa6ca4f860c` |
| `corpus/2026-11-11/valid/reference/data/competitors.csv` | `1b07157298530249366be6923cf29d593f476838` | `4da41f2c8fdfa226dde9ebf298ecb20a4b13cd8c879f26c9c5ae20d7c844984b` |
| `corpus/2026-11-11/valid/reference/roles/checker.md` | `8f50bbfb4685671096c42b87e0e5d4f2cbcc4b91` | `e9e4f729817c2b91d331dd9e794bc5e16573a5ec470fa8be5a8dabff3b8e4f7b` |
| `corpus/2026-11-11/valid/reference/skills/market-sizing/SKILL.md` | `0f93d8075291b76cec2680f8c1fc77f952f1cb29` | `9c6907b7e5106833a591e6c374901e75279df2799ae55bd45a21175213d405b7` |
| `corpus/2026-11-11/valid/reference/team.yaml` | `d0570005f3a5c96c603c73c47f28b50ed94c0196` | `38cf0a9b87be9d6115a4a0c57b518ef53736e71db1840280f89f23354934136a` |
| `corpus/2026-11-11/valid/role-extension.team.yaml` | `6dd2ecbeb4ec7b16aebf00236616ec90ede34913` | `ae8884db6b9f5535bbf2fe5c8c1e4fe0674a0ec0c70c015133a6d34469dc7807` |
| `corpus/2026-11-11/valid/unresolved-skill.team.yaml` | `0a3421d1051aceb582585947f487919eea7c5991` | `15e38ce74937965228d2b33e2429bd4241e37b2044669e4427e443c15820c5fc` |

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
| Run | <https://github.com/domios-dev/agentic-team-protocol/actions/runs/43468853771> (attempt 1) |
| Workflow commit | `d2db069610800fed454668c44ea58b97623c5ffc` (pull request head; the run's merge commit is `51c6748049a175ce7138afe57a75733be6d44e78`) |
| Domios commit | `fafc45b8b68808530d6c2fe4956af0fa9d23dd54` (`domios-dev/domios`, pinned in `DOMIOS_SHA`) |
| Crates | `codeterm-team-package` 0.0.0 (`atp-validate` binary), `codeterm-team-package-wasm` 0.0.0 |
| Toolchain | rustc 1.99.1 (58cf8f9c3 2026-10-13), cargo 1.99.1 (5f94df478 2026-08-27), from Domios `rust-toolchain.toml` |
| wasm-bindgen | crate and CLI 0.2.130 (resolved in the generated `Cargo.lock`) |
| Builder | GitHub Actions, workflow `validator.yml` |
| License | Apache-2.0 (see [Licenses](#licenses)) |

| Target | Runner image | Command (run in the Domios checkout) |
| --- | --- | --- |
| `x86_64-unknown-linux-musl` | ubuntu24/20261111.370.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-unknown-linux-musl` |
| `aarch64-apple-darwin` | macos15/20261104.0514.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target aarch64-apple-darwin` |
| `x86_64-apple-darwin` | macos15/20261104.0514.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-apple-darwin` |
| `x86_64-pc-windows-msvc` | win25-vs2026/20261103.298.1 | `cd src-tauri && cargo build --locked -p codeterm-team-package --bin atp-validate --release --target x86_64-pc-windows-msvc` |
| `wasm32-unknown-unknown` | ubuntu24/20261111.370.1 | `cd src-tauri/crates/codeterm-team-package-wasm && cargo build --release --target wasm32-unknown-unknown`; `cargo install wasm-bindgen-cli --version 0.2.130 --locked`; `wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/atp_validate.wasm` |

## JSON Schema 2026-11-11

| Field | Value |
| --- | --- |
| File | `schema/2026-11-11/team.schema.json` |
| URL | <https://atp.domios.dev/schema/2026-11-11/team.schema.json> (its `$id`) |
| Dialect | JSON Schema draft-07 (`$schema`: `http://json-schema.org/draft-07/schema#`); the generator (schemars 0.8.22) has no 2020-12 mode |
| Command | `atp-validate-x86_64-unknown-linux-musl schema --spec-version 2026-11-11 > schema/2026-11-11/team.schema.json` (job "Schema and example run" of the build run) |
| SHA-256 | `97b2ff9d69c70add556ba79399f8bae563098160f810ad16bdf4b0373ba0e1f5` |

The file is committed exactly as the command wrote it, and its SHA-256 equals the
`schema-and-example-run` artifact entry in the manifest.

## Reference validator 2026.11.11

`2026.11.11` is the artifact version the owner chose. The crates are version 0.0.0, and
the generated files embed no version string.

WebAssembly module, committed under `validator/2026.11.11/` (artifact `atp-validate-wasm`):

| File | SHA-256 |
| --- | --- |
| `validator/2026.11.11/atp_validate.js` | `33c06897c8547dcbbdd6746916e0b7febcdfcf3ae1d75132e13a660d4048b7e5` |
| `validator/2026.11.11/atp_validate_bg.wasm` | `da89b776abab657287dd9c75c5ef72044d48b37b1b0086af789b7bb565e39363` |
| `validator/2026.11.11/atp_validate.d.ts` | `9e62c3a9ec10719a1c4ef1c735c7109414ca631969c538c058e8e01e81e17e10` |
| `validator/2026.11.11/atp_validate_bg.wasm.d.ts` | `57923798aa5c14f15bd16ae02e85c2429b36552fea56f26a2c82394a26bf8c6c` |
| `validator/2026.11.11/Cargo.lock` (generated by the wasm build) | `6fb8f436c7d1f917d07b3d047a6256acf444b645ad38f16dcff3e1379bdb31dc` |

Command-line binaries, not committed (for a GitHub Release; see
[validator/README.md](validator/README.md)):

| File | Target | SHA-256 |
| --- | --- | --- |
| `atp-validate-x86_64-unknown-linux-musl` | x86_64 Linux (static, musl) | `6adfa021bda8bd56a46805025c424d75891f523a44af238f8b1572aff082dc7d` |
| `atp-validate-aarch64-apple-darwin` | Apple silicon macOS | `c8b52eae2040016837182923eaf94486e4424c37bebaf6f8880dcac4e04955cc` |
| `atp-validate-x86_64-apple-darwin` | Intel macOS | `03e4f3e3f5ce92a023d18ef9fb960e2b64353cd494a4df543d00469777eec9dc` |
| `atp-validate-x86_64-pc-windows-msvc.exe` | x86_64 Windows | `f1da9f500caacda004545332a0224428906cc5dcd64a94c6449b1215aaf2eacc` |

The native binaries are not byte-reproducible across runs. Repeated runs of this workflow
at one Domios commit rebuilt only `atp-validate-x86_64-apple-darwin` with identical bytes,
while the WebAssembly module, its `Cargo.lock` and the JSON Schema came out identical. The
release binaries are therefore exactly those of the build run above, never a rebuild.

The build run's Domios commit, `fafc45b8b68808530d6c2fe4956af0fa9d23dd54`, spells out
"Agentic Team Protocol" in the schema description and in three validator messages. Before
it, the roles-map artifacts were built at `16d5277f4ff083d487a7c55ba351f9bb72b8f084`. Between
the two commits, the crates differ only in that text and in the host template contracts
(`src/contracts.rs` and its fixtures), which neither the binary nor the WebAssembly entry
points call. The corpus is identical. Of the committed files, only `team.schema.json` and
`atp_validate_bg.wasm` changed.

## Example run

`validator.yml` checks every input under `examples/` and every form of every package under
`packages/` once with the Linux binary (`atp-validate <input> --json`); the validator takes
no host profile. The build run above checked the current examples and packages with the Linux
release binary. Its report is the `examples-report.jsonl` file of the
`schema-and-example-run` artifact (SHA-256
`52df0e08529a1e498b84d7625c70c76b8c370751a2133a8b8885a9766dd2b602`): 37 runs, with 30 invalid
examples (exit 1), the warning example and all 6 package forms valid (exit 0). Codes and
locations that `examples/**/expected.yaml` takes from this run name it as `validator_run`.
