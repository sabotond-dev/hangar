# Phase 3: Vendor the Domain - Research

**Researched:** 2026-09-02
**Domain:** Source vendoring across repo boundaries; WASM asset delivery from a static SvelteKit build through a Cloudflare Worker; Vitest project configuration; firmware-derived test oracles
**Confidence:** HIGH — almost every claim below was executed on this machine, not reasoned about

> **Verification note.** This pass ran real commands: `npm run build`, a Chromium page against the built
> site under `wrangler dev`, the full vendored suite under HANGAR's own `node_modules`, `svelte-check`
> with the vendored files staged in `src/vendor/botor/`, and the D-11a baseline capture against the
> sibling checkout. Everything created was deleted afterwards. `git status --porcelain` is empty in
> HANGAR and unchanged in `grid-editor` (the same two pre-existing modified files,
> `config-blocks/ElementName.svelte` and `config-blocks/SimpleColor.svelte`, nothing added).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upstream provenance**

- **D-01:** Vendor from **`sabotond-dev/botor`, branch `main`, at commit `a0fb69d5`** (grid-editor's
  local `redesign` HEAD: joystick spring-back, scales/latch, sixteen dots; 408 tests). **Precondition,
  the user's action:** push it first — `git push botor redesign:main` inside
  `C:\Users\sabot\Documents\Claude\grid-editor` — so the cited SHA is publicly resolvable. The first
  vendoring task must assert `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main`
  reports `a0fb69d5…` before copying anything, and stop with a clear message if it does not. Agents
  never push the user's repositories.
- **D-02:** Provenance headers and `VENDOR.md` name **`github.com/sabotond-dev/botor` (main)** as the
  upstream. `VENDOR.md` currently says `intechstudio/grid-editor` branch `redesign`, which is wrong —
  `redesign` exists only in the fork and the zona files have never existed upstream; correct it.
  Intech's original file headers stay inside each file (that is what credits `intechstudio/grid-editor`
  for the base). Header block stays as `VENDOR.md` specifies: path, commit, synced date, one-line
  modification note, licence retained.
- **D-03:** Re-sync is **on demand** via a `/gsd:quick` task following `VENDOR.md`'s procedure — never
  automatic, never at phase start. The escalation rule from ARCHITECTURE.md §4.2 stands: promote to a
  shared package only after two consecutive hand-merged syncs or a third consumer.

**Permitted deltas to vendored files**

- **D-04:** Exactly three kinds of change are allowed, and a test enforces it: (1) the provenance
  header block; (2) import-path rewrites (`../main/zona/_pad` → `../_pad`, `./_pad`, `./pad-sim` as
  needed); (3) the one type inline in `_pad.ts` — `import type { RGB } from "../../config-blocks/_screen"`
  becomes `export type RGB = { r: number; g: number; b: number };`. No formatting, no lint fixes, no
  renames, no reordering, no local bug fixes. `src/vendor/` stays in `.prettierignore` and the ESLint
  ignore list (Phase 1). Claude's discretion: a `vendored-diff.spec.ts` that diffs each vendored file
  against the recorded upstream bytes ignoring exactly those three deltas, so "import paths only" is
  asserted, not promised.

**Oracle strength (PREV-06, criterion 4)**

- **D-05:** **Two-source oracle.** Keep BOTOR's own transcribed tests (they already carry `grid-fw`
  file:line citations — `FIRMWARE_TABLE` from `grid_module.c:445-458` etc.) AND add an **independent
  re-derivation**: a separate agent reads only the firmware clone at
  `C:\Users\sabot\Documents\Claude\grid-fw` (HEAD `dc7d301`) and writes
  `src/lib/fidelity/firmware-oracle.ts` as literal data with a `file:line` citation per constant. That
  agent is **forbidden from opening `pad-sim.ts`, `_pad.ts` or any BOTOR test** — the whole point is
  that it cannot inherit a misreading. A HANGAR-owned spec then asserts the vendored simulator's tables
  and functions against the oracle data, exhaustively (all 81 cells, all 256 sine entries, every weight).
- **D-06:** Re-derivation scope is **the five load-bearing tables**: (a) the 81-entry logical→hardware
  LED lookup (`grid_module.c:445-458`, even rows mirrored); (b) the 256-entry sine lookup
  (`grid_led.c:86-94`); (c) the integer weight tables summing 254 with the single `/512` after layer
  sum (`grid_led.c:46-84`, ~:298-303); (d) the two-segment colour ramp min→mid→max with mid at BOTH
  127 and 128; (e) the freeze-on-expiry tick order (`grid_led.c:191-211`, phase advances before the
  timeout check, `fre` zeroed on expiry). Everything else `pad-sim.ts` cites stays covered by the
  ported tests only.
- **D-07:** **Golden frames** per preset: hash the simulator's frame buffer at fixed tick counts (e.g.
  0, 64, 128, 500) for all nine presets into a committed fixture. Labelled in the file and in
  `VALIDATION.md` as a **regression tripwire, not an oracle** — it is derived from the simulator and
  proves only that a shared helper changed a named preset's appearance.
- **D-08:** **On mismatch between the oracle and the vendored simulator: stop and report.** The failing
  test stays red and named. A fidelity bug is a BOTOR bug — the user fixes it upstream, pushes, and
  HANGAR re-syncs (D-03). The oracle is never edited to match the simulator, and the vendored copy is
  never patched locally (D-04). The report must include the firmware citation, the oracle value and the
  simulator value side by side so the upstream fix is a copy-paste.

**Vendored tests**

- **D-09:** The three test files live at **`src/vendor/botor/tests/`, verbatim `.js`**, with the same
  provenance header and the same three-delta rule as the sources. HANGAR's Vitest server project glob
  `src/**/*.{test,spec}.{js,ts}` already includes them; `requireAssertions` is on and every BOTOR test
  asserts, so no config change. Their `beforeAll` (`await initLuaFormatter(); await padCompilerReady();`)
  stays as written — it is the FOUND-05 gate under test.
- **D-10:** **Suite-speed rule:** keep the vendored suite whole in `npx vitest run`, MEASURE the wall
  time on this machine, and only if the quick run exceeds **~30 s** split the invariant sweep into a
  separate `test:sweep` script run per wave (not per task). Record the measurement and the decision in
  the SUMMARY and `VALIDATION.md`. Do not pre-split.

**Cost baseline (criterion 3, closes Phase 1's D-11 `it.todo`)**

- **D-11a:** Capture the baseline by **running BOTOR's own compiler, read-only, inside the grid-editor
  checkout at `a0fb69d5`**: a throwaway script (kept in HANGAR under `scripts/`, executed with
  `cwd = grid-editor`, importing `src/renderer/main/zona/_pad.ts` via grid-editor's own
  `node_modules` and its own pinned `@intechstudio/grid-protocol@1.20260825.1135`) emits, for each of the
  nine presets (`starfield`, `aurora`, `pinwheel`, `radar`, `faders`, `ninepads`, `tpad`, `dial`,
  `joystick`), the compiled Setup Lua, Timer Lua and both `compressScript` costs, into
  `src/lib/fidelity/preset-baseline.json`. No file in the sibling repo is written; its
  `git status --porcelain` must be identical before and after.
- **D-11b:** A HANGAR spec compiles the same nine presets with the **vendored** compiler and asserts
  character-identical Lua and equal costs against the fixture — this is criterion 3 and it is
  independent of the copy because the fixture came from BOTOR's tree. The Phase 1 `it.todo` in
  `src/lib/protocol-pin.spec.ts` becomes a real assertion: costs in the fixture equal the live costs at
  `PROTOCOL_PIN`. `docs/PIN-POLICY.md`'s bump checklist points at this spec.

**Production-build proof (criterion 1, FOUND-05)**

- **D-12:** A **Playwright test on the built site** proves the WASM resolves outside the dev server: a
  dev-only/hidden entry (e.g. `/dev/fidelity`, prerendered, no navigation to it from the UI) awaits
  `initLuaFormatter()`, compiles one preset with the vendored compiler in the browser, and exposes the
  costs; the e2e asserts they equal `preset-baseline.json`. This proves the `.wasm` is emitted by Vite,
  served through the Worker, and initialises under the deployed CSP. If the Worker sets a CSP header,
  it must include `'wasm-unsafe-eval'` (PITFALLS §C7); if it sets none, record that explicitly.

**WASM gate (FOUND-05, criterion 5) — Claude's discretion within these bounds**

- One module, e.g. `src/lib/pad/ready.ts`, exporting a single memoised promise that awaits
  `initLuaFormatter()` and then the vendored `padCompilerReady()`; the app root awaits it before first
  render of anything that compiles; every compile/cost/fit entry point HANGAR exposes awaits it too.
  The simulator (`PadSim` takes a `PadState`, not Lua) never needs it and must not be gated. A spec
  proves the gate: calling cost before ready waits rather than returning a bogus value; `checkSyntax`'s
  silent-false mode is never observable. What the page shows while loading is Phase 4's concern.

### Claude's Discretion

- Exact file layout under `src/vendor/botor/` (flat `_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts`,
  `tests/`), and the oracle/fixture layout under `src/lib/fidelity/`.
- The `vendored-diff.spec.ts` mechanism (record upstream bytes as a fixture vs re-read from the
  sibling checkout at test time — prefer recorded bytes so the suite does not depend on the sibling
  being present).
- Golden-frame tick counts and hash function.
- Whether `pad-sim-host.ts`, which touches the DOM, gets any test in this phase (the ported suites do
  not import it; a smoke import under `environment: "jsdom"` is optional — do not add jsdom just for it).
- Baseline script mechanics (tsx/vite-node inside the sibling checkout; how the nine preset IDs are
  enumerated — `PRESETS` is exported from `_pad.ts:4206`).

### Deferred Ideas (OUT OF SCOPE)

- **Hardware capture (Tier 6)** — real LED frames from a ZONA to pin the simulator against physics, not
  just firmware source; needs the module in hand. Add to the hardware checklist for Phase 6/7.
- **Promotion to a shared `@zona/pad` package** — only after the escalation rule trips (two hand-merged
  syncs or a third consumer).
- **Zone blocks (`_zone-blocks.ts`)** — Editor action blocks, not needed by HANGAR's catalog; revisit
  only if Phase 8 authoring wants zone-engine configs.
- **Loading UI while the WASM initialises** — Phase 4.
- **Formatting BOTOR's own zona files upstream** (three are not Prettier-clean) — the user's call in
  BOTOR; if done, `// prettier-ignore` above `pad-sim.ts`'s sine table first.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **FOUND-02** | `_pad.ts` compiler, `pad-sim.ts` simulator and `pad-sim-host.ts` render loop vendored into HANGAR with their existing test suites passing unchanged, quarantined under a single vendor directory with a written sync procedure back to BOTOR | §Measured port: exactly 5 changed lines across 6 files, 281/281 tests green under HANGAR's own toolchain (measured). §Pitfall 1 (the Vitest `exclude` that silently skips them). §Pitfall 2 (`checkJs` turning `npm run check` red). §Sync mechanism (hash manifest instead of a duplicated copy). |
| **FOUND-05** | Compile, cost and fit gated on the Lua formatter WASM being initialised | §The WASM gate, measured pre-init behaviour of every entry point. §WASM in the production build — proven end to end in Chromium against `build/` served by `worker/index.js`. |
| **PREV-06** | Every ported preset's simulated output pinned against an oracle derived independently of the compiler | §Firmware oracle locations (paths and line ranges only, verified at `dc7d301`). §Golden frames — measured determinism and the tick-aliasing trap. |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

`CLAUDE.md` at the repository root is a generated file (`gsd-tools generate-claude-md`) whose product
sections describe a *different* project (an Intech Studio marketing dashboard — Next.js, Recharts,
Google Sheets). **None of that stack applies to HANGAR.** The directives that do bind this phase:

| Directive | Consequence for the plan |
|-----------|--------------------------|
| **GSD Workflow Enforcement** — no direct repo edits outside a GSD workflow | Every file change in this phase happens inside `/gsd:execute-phase` tasks. |
| `CLAUDE.md` is regenerated, never hand-edited (STATE.md, Phase 01) | Do not add Phase-3 notes to `CLAUDE.md`; put them in `VENDOR.md`, `docs/PIN-POLICY.md` and the new `docs/VALIDATION.md`. |
| No Claude attribution anywhere (D-04, Phase 1) | Commit messages and file headers name Botond Sandor only. |
| No emojis (user rule, restated in the phase prompt) | Applies to fixture labels and console output too. |

## Summary

The port is smaller than any document so far has claimed and the test suite runs green on the first
try. Measured on this machine: staging the six files with the three permitted deltas and running them
under **HANGAR's own `node_modules`** (Vitest 4.1.11, `@intechstudio/grid-protocol@1.20260825.1135`,
`environment: "node"`, `requireAssertions: true`) gives **281 passed / 281**. `pad-sim.ts` and
`pad-sim-host.ts` need **zero** import rewrites in the flat layout, because they already say
`./_pad` and `./pad-sim`. The whole delta set is: one line in `_pad.ts` (the `RGB` inline, whose
replacement text is character-identical to `_screen.ts:6`), one import specifier in `pad.test.js`, one
in `pad-invariants.test.js`, two in `pad-sim.test.js`, plus the provenance header block per file.

Two things CONTEXT.md assumes are wrong, and both fail *silently*. First, **D-09's "no config change"
is false**: `vite.config.ts:74` excludes `src/vendor/**` from the `server` Vitest project, so with the
tests staged in place `npx vitest run` reported "4 passed / 18 tests" and never mentioned the three
vendored suites. Deleting that one array element makes it 7 files / 300 tests. Second, HANGAR's
`tsconfig.json` sets `"checkJs": true` where grid-editor sets it false, so `npm run check` goes from
0 errors to **489 errors — all of them in the three vendored `.js` tests, none in the three `.ts`
sources**, which typecheck clean under HANGAR's `strict`. Two fixes were tested and both give 0 errors;
`svelte-check --ignore` is *not* one of them (the CLI rejects it when `--tsconfig` is used).

**D-10 fires.** The whole suite is 39.9 s under HANGAR's real config; `pad-invariants.test.js` alone is
38.6 s of that (the sweep is 4,860 states now, not 3,564) while the other two are 2.9 s and 0.6 s. A
two-project split was configured and measured: quick run 4.6 s / 291 tests, sweep 38.6 s / 9 tests.

The WASM question is settled by observation, not inference. `npm run build` emits
`build/_app/immutable/assets/lua_fmt_bg.<hash>.wasm` (628 KB) and rewrites the package's
`new URL('lua_fmt_bg.wasm', import.meta.url)` to point at it; `worker/index.js` serves it with
`Content-Type: application/wasm` and **sets no CSP header at all**; a real Chromium page on the built
site under `wrangler dev` resolved `initLuaFormatter()` and returned a `compressScript` length in
833 ms with an empty console. The D-11a baseline capture also works, and works better than CONTEXT
imagined: a plain `node` script in HANGAR importing the sibling `_pad.ts` by absolute path binds to
**grid-editor's own** `@intechstudio/grid-protocol` (verified: separate module instance), needs no
tsx/vite-node, and leaves the sibling byte-identical.

**Primary recommendation:** copy six files, change five lines, delete one array element from
`vite.config.ts`, add `"exclude": ["src/vendor/**"]` to `tsconfig.json`, split the sweep into its own
Vitest project, and pin the fixtures with a sha256 manifest rather than a duplicated copy of upstream.

## Standard Stack

Nothing new is installed. Everything this phase needs is already present and pinned.

### Core

| Library | Version | Purpose | Why standard |
|---------|---------|---------|--------------|
| `@intechstudio/grid-protocol` | `1.20260825.1135` (exact, pinned) | `GridScript.compressScript` (the cost function), `checkSyntax`, `initLuaFormatter` | Phase 1 D-09. Identical to the version installed in `grid-editor` — verified in both `node_modules` |
| `@wasm-fmt/lua_fmt` | `0.2.0` (transitive) | The StyLua WASM the minifier runs on | Sole dependency of grid-protocol; 628,148-byte `lua_fmt_bg.wasm` |
| `vitest` | `4.1.11` | The vendored suite, all HANGAR specs | Phase 1 D-17; grid-editor runs `vitest ^4.1.0`, so the suites transfer |
| `@playwright/test` | `1.60.x` | D-12 browser proof against `build/` | Phase 1 D-14 harness (`wrangler dev`, not `vite preview`) |
| `node` | `v24.14.0` | Type-stripping makes the D-11a baseline script a plain `.mjs` | Measured below |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| plain `node` for the baseline script | `npx vitest run --config <local config>` with a HANGAR-side root | Both were run successfully. Plain node is simpler and has no config; it depends on `_pad.ts` containing only erasable TS syntax (true at `a0fb69d5`). Vitest is the fallback if a future sync adds `enum`/`namespace`, and is *required* if the script ever needs `pad-sim.ts` (see §Pitfall 5). |
| a committed pristine copy of each upstream file for `vendored-diff.spec.ts` | a sha256 manifest + delta inversion | The copy costs ~436 KB duplicated in the repo and in every per-deploy source archive; the manifest costs ~1 KB and asserts the same property. |
| `svelte-check --ignore src/vendor` | `tsconfig.json` `"exclude"` or `"checkJs": false` | `--ignore` is rejected outright: *"`--ignore` only has an effect when using `--no-tsconfig`"*. Measured. |

**Installation:** none. `npm ci` is already correct.

## Measured port: the exact deltas

### File inventory (working copies at `a0fb69d5` equal `HEAD`; `git diff --name-only HEAD` over both directories is empty)

| BOTOR path | Bytes | Lines | HANGAR path |
|------------|-------|-------|-------------|
| `src/renderer/main/zona/_pad.ts` | 152,570 | 4,380 | `src/vendor/botor/_pad.ts` |
| `src/renderer/main/zona/pad-sim.ts` | 56,314 | 1,569 | `src/vendor/botor/pad-sim.ts` |
| `src/renderer/main/zona/pad-sim-host.ts` | 19,382 | 557 | `src/vendor/botor/pad-sim-host.ts` |
| `src/renderer/tests/pad.test.js` | 127,944 | 3,705 | `src/vendor/botor/tests/pad.test.js` |
| `src/renderer/tests/pad-sim.test.js` | 65,818 | 1,863 | `src/vendor/botor/tests/pad-sim.test.js` |
| `src/renderer/tests/pad-invariants.test.js` | 14,422 | 356 | `src/vendor/botor/tests/pad-invariants.test.js` |

All six are LF-terminated ASCII except `pad.test.js`, which is UTF-8 (non-ASCII characters present —
hash raw bytes, never a decoded string). HANGAR's `.gitattributes` is `* text=auto eol=lf`, so the
checkout is LF and a byte hash is stable across machines.

### Every line that changes (D-04, delta 2 and 3)

| File | Line | Current | Becomes |
|------|------|---------|---------|
| `_pad.ts` | 37 | `import type { RGB } from "../../config-blocks/_screen";` | `export type RGB = { r: number; g: number; b: number };` |
| `pad-sim.ts` | 45 | `} from "./_pad";` | **unchanged** |
| `pad-sim-host.ts` | 11, 12 | `from "./_pad"`, `from "./pad-sim"` | **unchanged** |
| `tests/pad.test.js` | 85 | `} from "../main/zona/_pad";` | `} from "../_pad";` |
| `tests/pad-sim.test.js` | 10 | `} from "../main/zona/pad-sim";` | `} from "../pad-sim";` |
| `tests/pad-sim.test.js` | 33 | `} from "../main/zona/_pad";` | `} from "../_pad";` |
| `tests/pad-invariants.test.js` | 18 | `} from "../main/zona/_pad";` | `} from "../_pad";` |

`_pad.ts:34` (`import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";`) and the
tests' own `from "vitest"` / `from "@intechstudio/grid-protocol"` lines are bare specifiers and stay
untouched. The replacement text for the `RGB` inline is **character-identical** to
`grid-editor/src/renderer/config-blocks/_screen.ts:6` — verified.

The three tests contain **no** `__dirname`, no `import.meta`, no `node:` import, no `fs`, no
`process.*`, no relative fixture file and no snapshot (`toMatchSnapshot` / `toMatchInlineSnapshot`
appear zero times). They are pure in-file computation. That is why the port is a copy.

**Consequence to record:** inserting a header block above line 1 shifts every line number in the file.
Any HANGAR document citing `_pad.ts:4206` or `pad-sim.ts:76` must either cite the *upstream* line (and
say so) or be regenerated after the header lands.

### Measured green

Staged into a scratch root with the deltas applied and run against HANGAR's `node_modules`:

```
Test Files  3 passed (3)
Tests       281 passed (281)
Duration    43.1 s
```

Per file: `pad.test.js` 176 tests / 2.87 s · `pad-sim.test.js` 96 tests / 0.60 s ·
`pad-invariants.test.js` 9 tests / **38.74 s**. `requireAssertions: true` was enabled for that run and
nothing failed on it, so D-09 is right about that half.

Then staged for real into `src/vendor/botor/` and run under HANGAR's *actual* `vite.config.ts` with the
`src/vendor/**` exclude removed:

```
Test Files  7 passed (7)
Tests       299 passed | 1 todo (300)
Duration    39.9 s
```

(`pad-invariants.test.js`'s own header says the sweep is **4,860** labelled states — 1,620 kind
combinations × 3 brightness levels — not the 3,564 CONTEXT.md quotes. Update the phase docs.)

## Architecture Patterns

### Recommended layout

```
src/
├── vendor/botor/                    # prettier-ignored, eslint-ignored, tsconfig-excluded
│   ├── VENDOR.md                    # exists; fix Upstream section per D-02, fill the table
│   ├── _pad.ts                      # + header, RGB inline
│   ├── pad-sim.ts                   # + header only
│   ├── pad-sim-host.ts              # + header only
│   └── tests/
│       ├── pad.test.js              # + header, 1 specifier
│       ├── pad-sim.test.js          # + header, 2 specifiers
│       └── pad-invariants.test.js   # + header, 1 specifier
├── lib/
│   ├── fidelity/
│   │   ├── upstream-manifest.json   # HANGAR-owned: per file, upstream SHA + sha256 of pristine bytes
│   │   ├── vendored-diff.spec.ts    # D-04 enforcement
│   │   ├── preset-baseline.json     # D-11a output (7.4 KB with full Lua for nine presets)
│   │   ├── preset-baseline.spec.ts  # D-11b, criterion 3
│   │   ├── firmware-oracle.ts       # WRITTEN BY THE ISOLATED AGENT (D-05)
│   │   ├── firmware-oracle.spec.ts  # asserts the vendored sim against the oracle (different author)
│   │   ├── golden-frames.json       # D-07 tripwire fixture
│   │   └── golden-frames.spec.ts
│   └── pad/
│       ├── ready.ts                 # FOUND-05 memoised gate
│       └── ready.spec.ts
├── routes/dev/fidelity/+page.svelte # D-12 hidden probe, prerendered
scripts/
└── capture-preset-baseline.mjs      # D-11a, read-only against the sibling
e2e/
└── fidelity.e2e.ts                  # D-12
docs/
└── VALIDATION.md                    # NEW — does not exist yet (see Open Questions)
```

**Keep every HANGAR-authored file outside `src/vendor/`.** That directory is Prettier-ignored and
ESLint-ignored; a HANGAR spec placed inside it would silently stop being formatted or linted. Only
`VENDOR.md` (pre-existing, ignore-exempt by convention) lives there.

### Pattern 1 — `vendored-diff.spec.ts` without duplicating 436 KB

Record, per file, the upstream SHA and the **sha256 of the pristine upstream bytes**. The spec
reconstructs the pristine bytes from the vendored file by inverting exactly the three permitted deltas
and compares hashes. Any fourth change — a reformat, a reorder, a "harmless" fix — moves the hash.

```ts
// src/lib/fidelity/vendored-diff.spec.ts (shape)
// 1. read src/vendor/botor/<file> as a Buffer (raw bytes, never a decoded string)
// 2. strip the provenance header block: everything from the first line up to and
//    including the sentinel last line of the block, asserted to match a fixed regex
// 3. re-apply the inverse import rewrites for that file, from a table in the manifest:
//      { from: 'export type RGB = { r: number; g: number; b: number };',
//        to:   'import type { RGB } from "../../config-blocks/_screen";' }
// 4. expect(sha256(result)).toBe(manifest[file].upstreamSha256)
// 5. expect(manifest[file].upstreamCommit).toBe(PINNED_BOTOR_SHA)
```

Prefer recorded bytes over reading the sibling (CONTEXT explicitly prefers this): the suite must be
green on a machine that has no `grid-editor` checkout. `format-parity.spec.ts` already *does* require
the sibling — that is a deliberate, separate canary and should stay as it is.

The inverse-rewrite table doubles as executable documentation of D-04, and the failure message can
print which of the three deltas failed to invert.

### Pattern 2 — the Vitest split (measured, both projects run green)

```ts
// vite.config.ts — test.projects
{
  extends: "./vite.config.ts",
  test: {
    name: "server",
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts}"],
    // "src/vendor/**" DELETED from this array — it is what silently skipped the port.
    exclude: [
      "src/**/*.svelte.{test,spec}.{js,ts}",
      "src/vendor/botor/tests/pad-invariants.test.js",   // D-10: 38.6 s of the 39.9 s
    ],
  },
},
{
  extends: "./vite.config.ts",
  test: {
    name: "sweep",
    environment: "node",
    include: ["src/vendor/botor/tests/pad-invariants.test.js"],
  },
},
```

Measured with exactly this config, vendored files in place:

| Command | Files | Tests | Duration |
|---------|-------|-------|----------|
| `npx vitest run --project server` | 6 | 290 passed, 1 todo | **4.64 s** |
| `npx vitest run --project sweep` | 1 | 9 | **38.57 s** |
| `npx vitest run` (both) | 7 | 299 passed, 1 todo | 39.9 s |

Scripts: keep `test:unit` as the everything-run (so `npm test` stays a true gate), add
`"test:quick": "vitest run --project server"` and `"test:sweep": "vitest run --project sweep"`.
Nyquist's per-task loop is `test:quick`; per-wave adds `test:sweep`.

### Pattern 3 — the D-11a baseline script (plain node, proven)

```js
// scripts/capture-preset-baseline.mjs  (run: node scripts/capture-preset-baseline.mjs)
// Node 24 strips types on import, so _pad.ts loads with no tsx / vite-node / bundler.
const Z = "file:///C:/Users/sabot/Documents/Claude/grid-editor/src/renderer/main/zona/";
const pad = await import(Z + "_pad.ts");   // binds to grid-editor's OWN node_modules
await pad.padCompilerReady();              // NOT HANGAR's initLuaFormatter — see below
for (const p of pad.PRESETS) {
  const built = pad.compile(p.state);
  const c = pad.cost(built);
  // record: setupLua, timerLua, timerPeriodMs, stamp,
  //         cost.setup.used, cost.timer.used,
  //         measure(setupLua), measure(timerLua)   <-- see Pitfall 4, this one matters
}
```

Three verified facts behind this shape:

1. **Module resolution crosses the repo boundary correctly.** With the importer inside the sibling,
   `@intechstudio/grid-protocol` resolves to
   `grid-editor\node_modules\@intechstudio\grid-protocol\dist\index.js`, while HANGAR's own import
   resolves to `hangar\node_modules\...`. Both are `1.20260825.1135`. D-11a's "via grid-editor's own
   `node_modules`" is satisfied without setting `cwd`.
2. **They are separate module instances.** Calling HANGAR's `initLuaFormatter()` does **not** ready the
   sibling's copy — measured: `pad.cost(...)` still threw *"The Lua formatter is not initialised."*
   The script must call the sibling's `padCompilerReady()` (or its `initLuaFormatter`). A script that
   inits the wrong copy fails in a way that looks like a WASM problem and is not.
3. **The sibling stays byte-identical.** `git -C ../grid-editor status --porcelain` before and after was
   identical (the same two pre-existing ` M` entries, no `??`). Nothing is written there because the
   script's cwd, its output file and any Vite/Vitest cache all live in HANGAR.

Keep `cwd = hangar`, not `grid-editor`: running a Vite-based tool with its root inside the sibling is
what would create `node_modules/.vite` there. The plan should still assert the porcelain equality
before/after, exactly as `format-parity.spec.ts` does for the Prettier canary.

**Captured baseline (this is the criterion-3 fixture content, produced today):**

| preset | setup cost | timer cost | compressed setup | compressed timer | timer period ms | stamp |
|--------|-----------|-----------|------------------|------------------|-----------------|-------|
| aurora | 250 | 55 | 249 | 54 | 300000 | `paurora` |
| pinwheel | 305 | 55 | 304 | 54 | 300000 | `ppinwheel` |
| starfield | 238 | 55 | 237 | 54 | 300000 | `pstarfield` |
| radar | 438 | 55 | 437 | 54 | 300000 | `pradar` |
| joystick | 535 | 24 | 534 | 23 | 300000 | `pjoystick` |
| ninepads | 580 | 158 | 579 | 157 | 20 | `pninepads` |
| faders | 513 | 24 | 512 | 23 | 300000 | `pfaders` |
| dial | 646 | 55 | 645 | 54 | 300000 | `pdial` |
| tpad | 902 | 146 | 901 | 145 | 20 | `ptpad` |

Every one matches the `cost` field declared in `PRESETS` and matches the user's notes in CONTEXT
(`tpad 902/908` there was budget, not timer cost; `dial 646/55` and `joystick 535/24` confirm). The
fixture serialised with `JSON.stringify(obj, null, 2) + "\n"` is **7,419 bytes** and passes
`npx prettier --check` unmodified — important, because `npm run lint` checks everything outside
`.prettierignore` and `src/lib/fidelity/` is not ignored.

### Pattern 4 — the D-12 probe page

```svelte
<!-- src/routes/dev/fidelity/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  let out = $state("pending");
  onMount(async () => {
    const { initLuaFormatter } = await import("@intechstudio/grid-protocol");
    await initLuaFormatter();
    const pad = await import("$lib/../vendor/botor/_pad");   // or via a $vendor alias
    await pad.padCompilerReady();
    const b = pad.compile(pad.presetById("aurora").state);
    const c = pad.cost(b);
    out = JSON.stringify({ setup: c.setup.used, timer: c.timer.used });
  });
</script>
<p data-testid="fidelity-probe">{out}</p>
```

Verified with a throwaway version of exactly this shape:

- `prerender.entries: ["*"]` prerenders `/dev/fidelity/` with no link from anywhere and no entry list
  edit. `build/dev/fidelity/index.html` appeared, containing the pre-mount text.
- `trailingSlash: "always"` (from `+layout.ts`) means the e2e must navigate to **`/dev/fidelity/`**.
- Do the WASM work in `onMount`, not at module scope: at module scope the *server* build also imports
  grid-protocol, resolves `@wasm-fmt/lua_fmt` through its `"node"` condition and reads the wasm off
  disk during prerender. Harmless but meaningless — it proves nothing about the browser.
- The route ships in every deploy. It is behind Basic Auth until launch (D-07) and the Worker sends
  `X-Robots-Tag: noindex` on everything; after the gate is removed it becomes a publicly reachable
  unlinked page. Either accept that (it exposes nothing) or gate it on a build-time flag — a decision
  worth one line in the SUMMARY.

### Anti-patterns

- **Refactoring the vendored files.** ARCHITECTURE.md §Anti-Patterns and D-04. Every local edit is a
  merge conflict with BOTOR forever.
- **Putting HANGAR-owned specs inside `src/vendor/`.** They lose Prettier and ESLint silently.
- **Editing the oracle to match the simulator.** D-08. The oracle is never the thing that moves.
- **Gating `PadSim` on the formatter.** Measured: `new PadSim(state)` + `run(64)` + `frame` works
  perfectly with the WASM uninitialised. Gating it would make the catalog wait 628 KB for nothing.
- **Trusting a green `npx vitest run` as proof the port landed.** With the current config that command
  is green *and* runs none of the vendored tests.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Loading `_pad.ts` from a script | tsx, vite-node, a bundler step, a `cwd` dance | plain `node file.mjs` on Node 24 | Measured working. `_pad.ts` has one bare import and (after the RGB inline) zero relative imports |
| Asserting "import paths only" | a hand-maintained prose note in `VENDOR.md` | `vendored-diff.spec.ts` against a sha256 manifest | The note cannot fail; the test can |
| Diffing text | a custom diff | `sha256` equality + optional `git diff --no-index` against the sibling when present, for the *message* only | Byte equality is the property; diff output is for humans |
| Suite-time management | trimming or sampling the sweep | a second Vitest project | The sweep is the anti-drift mechanism (PITFALLS §C6 technique 4); running it less often is fine, running less of it is not |
| WASM MIME / CSP handling | a Worker `Content-Type` override or a wasm loader plugin | nothing — it already works | Measured `application/wasm`, no CSP, streaming instantiation succeeded |
| A "is the formatter ready" heuristic | polling, try/catch probes, timeouts | the vendored `padCompilerReady()` memoised promise | It exists, it is cached, and it is what the ported tests already await |

**Key insight:** every mechanism this phase needs is either already in the repo (the Phase 1 spec
patterns, the `wrangler dev` harness) or already in BOTOR (the readiness gate, the invariant sweep).
The new code is fixtures and assertions, not machinery.

## Common Pitfalls

### Pitfall 1 — `vite.config.ts` excludes the vendored tests, and the run stays green

**What goes wrong:** `vite.config.ts:74` reads
`exclude: ["src/**/*.svelte.{test,spec}.{js,ts}", "src/vendor/**"]`. With all six files correctly in
place, `npx vitest run` reported `Test Files 4 passed (4) / Tests 18 passed | 1 todo` — the three
vendored suites were never collected. No warning, no "0 tests in file", nothing.
**Why it happens:** Phase 1 added the exclude as vendor quarantine hygiene before there was anything to
quarantine, and CONTEXT.md D-09 reasoned from the `include` glob alone.
**How to avoid:** delete `"src/vendor/**"` from that array, and make the *acceptance check* for that
task be the test count (`299 passed`), never "the suite is green".
**Warning sign:** a suite that gets faster after adding 281 tests.

### Pitfall 2 — `checkJs: true` makes `npm run check` report 489 errors in the vendored tests

**What goes wrong:** measured with the files staged:
`COMPLETED 349 FILES 489 ERRORS 0 WARNINGS 3 FILES_WITH_PROBLEMS`, versus `343 FILES 0 ERRORS` before.
Breakdown: `pad.test.js` 319, `pad-sim.test.js` 143, `pad-invariants.test.js` 27, and **zero** in
`_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts` — the vendored TypeScript is clean under HANGAR's `strict`.
The errors are `TS7006` (implicit any on test callback params), `TS2322`, `TS7053` and friends: normal
untyped-JS-test noise that grid-editor never sees because its `tsconfig.json` sets `"checkJs": false`
while HANGAR's sets `true`.
**Why it matters:** `npm run check` is a hygiene gate the user runs; a permanently red one is worse
than no gate. Fixing it inside the files would be a fourth delta and is forbidden by D-04.
**How to avoid — two measured fixes, both give `0 ERRORS`:**

| Option | Change | Result | Note |
|--------|--------|--------|------|
| **A (recommended)** | add `"exclude": ["src/vendor/**"]` to `tsconfig.json` | `343 FILES 0 ERRORS` | Surgical. Keeps `checkJs` for HANGAR's own future JS. Overrides the generated config's `exclude` (which only listed service-worker paths HANGAR does not have). `svelte-kit sync` emitted no warning. The three `.ts` sources are still checked once HANGAR code imports them — and they are clean |
| B | set `"checkJs": false` in `tsconfig.json` | `349 FILES 0 ERRORS` | Also works, costs nothing today (HANGAR has no first-party `.js` under `src/`), but silently lowers the bar for future HANGAR JS |
| ✗ | `svelte-check --ignore "src/vendor"` | **CLI error** | *"Invalid svelte-check CLI args: `--ignore` only has an effect when using `--no-tsconfig`"* |

**Verified non-issues:** `npx eslint .` exits 0 with the files in place (`ignores: ["src/vendor/**"]`
covers the new `tests/` subfolder), and `prettier --check .` never mentions them (`.prettierignore`
has `src/vendor/`, which covers subfolders).

### Pitfall 3 — a stray `wrangler dev` makes `npm run build` fail with EPERM

**What goes wrong:** the first `npm run build` of this session died at the adapter step with
`Error: EPERM, Permission denied: \\?\...\hangar\build` from `rimraf`. A `wrangler dev` from an earlier
session was still listening on 4173 and holding the `build` directory open (files *inside* `build/`
could be created and deleted; the directory itself could not be removed).
**Why it happens:** STATE.md already records the zombie-wrangler shape from Phase 1 — `npx-cli` →
`wrangler.js` → `wrangler-dist/cli.js` → `workerd.exe`, and killing `workerd` alone gets it restarted.
**How to avoid:** before any build/e2e task, check `netstat -ano | grep 4173` and kill the whole tree
(`taskkill /PID <npx-cli pid> /T /F` via PowerShell — Git Bash's `taskkill` mangles `/PID`). Playwright's
`reuseExistingServer: !CI` will happily attach to a zombie serving a *stale* `build/`, which would make
the D-12 e2e pass or fail for reasons unrelated to the code.

### Pitfall 4 — `cost().used` cannot see a minifier regression

**What goes wrong:** `budgetOf` is `Math.max(measure(lua), lua.length) + reserved`, and measured for all
nine presets the compressed length is **exactly one character less** than the raw length (one action per
event, one `--[[@cb#name]] ` marker). So `cost().used === lua.length` for every preset today. A future
grid-protocol bump whose minifier spent five more characters would move `compressScript(...).length` and
**not** move `cost().used` — the D-11 bump gate, if it records only `cost`, would stay green through
exactly the change it exists to catch.
**How to avoid:** `preset-baseline.json` records **four** numbers per preset —
`cost.setup.used`, `cost.timer.used`, `measure(setupLua)`, `measure(timerLua)` — and
`protocol-pin.spec.ts`'s replacement for the `it.todo` asserts the `measure()` pair, which is
`GridScript.compressScript(...).length` directly. Update `docs/PIN-POLICY.md` item 2 to say
"`compressScript` length", not "cost".

### Pitfall 5 — the vendored files are not loadable by plain Node ESM

**What goes wrong:** `node` can import `_pad.ts` (type-stripping, no relative imports after the RGB
inline), but importing `pad-sim.ts` fails with
`ERR_MODULE_NOT_FOUND ... /zona/_pad` — its `from "./_pad"` is extensionless, which Node ESM does not
resolve.
**Consequence:** any HANGAR script that needs the *simulator* outside Vite (a golden-frame regenerator,
an OG-image renderer in Phase 5) must run under Vitest/Vite, not plain node. Vite, Vitest and
SvelteKit all resolve it fine — measured.

### Pitfall 6 — golden-frame tick aliasing

**What goes wrong:** with the tick set CONTEXT suggests (0, 64, 128, 500), the frames at **tick 0 and
tick 128 hash identically** for aurora, pinwheel, radar and dial — the phase byte is 8-bit and those
presets land on a 128-tick cycle. One of the four samples is free of information.
**How to avoid:** pick ticks that are not related by the phase period, e.g. `0, 37, 101, 500, 1009`.
Also record, per preset, whether `sim.animating` is true — measured, joystick / ninepads / faders /
tpad are static at every tick, so their golden frame pins only the Setup picture, and **tpad's frame is
all zeros by design** (it writes no LEDs). Label that in the fixture, or a future all-black regression
elsewhere will read as normal.

### Pitfall 7 — the `.tmp-format-parity/` directory is deleted by the suite

`format-parity.spec.ts` does `rmSync(".tmp-format-parity", { recursive: true, force: true })` in
`afterAll`. Anything staged there vanishes the next time `npx vitest run` executes. Cost me one
experiment; will cost a task author the same. Use `test-results/` or a fresh gitignored path.

## Code Examples

### The FOUND-05 gate — measured pre-init behaviour of every entry point

Run against the sibling compiler with the formatter deliberately *not* initialised:

```
compile:                OK, setupLua len 250          <- compile() does NOT need the formatter
cost:                   THREW "The Lua formatter is not initialised. Await padCompilerReady() first."
fits:                   THREW  (same message)
validate:               ["not-ready"]                 <- never a bogus "syntax" diagnostic
PadSim:                 OK, frame 243 bytes           <- simulator is independent, must not be gated
isPadCompilerReady():   false
console.error seen:     4 x "ERROR: Lua formatter not initialized! Call 'await initLuaFor..."
after padCompilerReady(): isPadCompilerReady() true, cost.setup = { used: 250, limit: 908, free: 658 }
```

Mechanism, read from source:

- `_pad.ts:51-58` `padCompilerReady()` — memoised promise, awaits `initLuaFormatter()`, sets a flag.
- `_pad.ts:60-64` `isPadCompilerReady()` — falls back to `GridScript.checkSyntax("local a=1")`, which
  before init returns `false` **and** emits a `console.error` from the protocol package
  (`dist/index.js:4220-4224` logs, then `minifyLua`/`beautifyLua` throw; `checkSyntax` swallows the
  throw at `dist/index.js:4471-4478` and returns `false`).
- `_pad.ts:66-72` `assertPadCompilerReady()` throws the exact string above.
- `_pad.ts:3033-3036` `measure()` asserts first — so `cost`, `fits`, `ledger`, `ghostCost` and `fit`
  all throw, never return a wrong number.
- `_pad.ts:3658-3665` `validate()` short-circuits to a single `not-ready` diagnostic.

**What `ready.spec.ts` should therefore assert** (and it must be its **own file** — Vitest isolates
module state per test file, so any file that has already awaited the gate can never observe the
un-initialised branch again):

1. Before the gate resolves, HANGAR's exposed `cost`/`fit` entry point **awaits** and then returns the
   baseline value — it never throws the vendored message at a caller and never returns a bogus number.
2. `validate()` before ready yields `not-ready`, never `syntax` — i.e. `checkSyntax`'s silent-false is
   unobservable through HANGAR's surface.
3. The gate is memoised: two concurrent calls await one `initLuaFormatter()`.
4. `PadSim` produces a 243-byte frame with the gate unresolved (proof the simulator is not gated).
5. Optionally spy on `console.error` and assert HANGAR never triggers the
   `"Lua formatter not initialized!"` log in normal operation.

### The WASM in the production build — proven, not assumed

```
npm run build
  -> build/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm      (628,148 bytes, hashed)
  -> chunks/DP-SkcdD.js contains:
       new URL(`../assets/lua_fmt_bg.D_18ElAm.wasm`, import.meta.url)
     (Vite rewrote the package's own `new URL('lua_fmt_bg.wasm', import.meta.url)`)

curl -u ... http://127.0.0.1:4173/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm
  HTTP/1.1 200 OK
  Content-Type: application/wasm          <- streaming instantiation will work
  Cache-Control: private, no-store        <- set by worker/index.js, see below
  X-Robots-Tag: noindex, nofollow, noarchive
  (no Content-Security-Policy header at all)

Chromium, real page load of http://127.0.0.1:4173/dev/fidelity/ :
  probe text: "ok:19"        (initLuaFormatter resolved, compressScript returned)
  wasm responses: [200, ".../lua_fmt_bg.D_18ElAm.wasm", "application/wasm"]
  console: (empty)
  elapsed: 833 ms including page load
```

Conclusions for the plan:

- **The `.wasm` is emitted as a hashed asset and resolves from the built output.** No
  `resolve.alias` to `@wasm-fmt/lua_fmt/vite` is needed (STACK.md §Decision 4's fallback), and
  `optimizeDeps.exclude` — a dev-server-only setting — is not what made it work in `build`.
- **`worker/index.js` sets no CSP.** Record that explicitly per D-12. If a CSP is ever added (a
  reasonable Phase 6/7 hardening for a page that talks to hardware), `script-src` **must** include
  `'wasm-unsafe-eval'` or this breaks with a symptom identical to "formatter never initialised".
- The Worker's `Cache-Control: private, no-store` means the 628 KB is re-fetched on every load. Fine
  for a gated preview; worth revisiting in Phase 4 alongside the loading state.
- `__wbg_load` falls back to `WebAssembly.instantiate` with a console warning if the MIME is wrong
  (`lua_fmt.js:232-260`), so a MIME regression degrades rather than breaks — but the e2e should assert
  the response `content-type`, since the fallback is exactly the kind of silent slowdown nobody notices.

### Golden frames — deterministic, measured

`pad-sim.ts` contains no `Date.now`, no `Math.random`, no `performance.now`, no DOM (the file's own
header says so and grep confirms). Driving is:

```ts
const sim = new PadSim(preset.state);       // PadState in, no Lua, no formatter needed
sim.run(n);                                  // n x tick(); tick() is one 10 ms firmware period
const bytes = sim.frame;                     // Uint8Array(243), logical row-major, cached until next tick
const stillMoving = sim.animating;           // false once nothing can change on its own
```

Two consecutive full runs over all nine presets at ticks 0/64/128/500 produced **identical hashes**.
Nondeterminism to know about: none in the engine; the only inputs are the explicit
`touchDown/touchMove/touchUp/touchTap(id, x, y)` calls, and the touch FIFO pops **one sample per
tick** (depth 10), so a scripted gesture needs ticks interleaved between events or samples queue.
`reset()`/`setState()` rebuild deterministically from scratch.

Recommended fixture shape: `{ preset, tick, sha256(frame), nonZeroBytes, animating }`. Keeping the
non-zero count beside the hash turns "the picture went black" into a readable failure instead of a
hash mismatch.

## Firmware oracle locations (D-05 / D-06)

> **For the isolated oracle agent.** This section lists **where to look and nothing else**. It contains
> no constant values, no table contents, no parity, no ordering and no arithmetic — deliberately, so
> that the re-derivation cannot inherit anyone's reading. **The oracle agent may read this section and
> `grid-fw` only.** It must not open `pad-sim.ts`, `_pad.ts`, any BOTOR test, any other section of this
> document, or the memory note cited in CONTEXT.md's canonical refs (that note is a *second* transcription
> and would defeat the independence).

Clone: `C:\Users\sabot\Documents\Claude\grid-fw`, HEAD `dc7d301e4fb8502c4db5b2500e1f7f991ef06110`.
All line ranges below were re-verified against that commit today. CONTEXT.md's ranges are accurate;
the corrections are minor and marked.

| # | File | Lines | What is defined there (one line, no values) |
|---|------|-------|----------------------------------------------|
| a | `common/src/c/grid_module.c` | 445-458 | The nine row macros `R0`…`R8` and the single call that registers the 81-entry logical→hardware LED lookup, inside `grid_module_zona_ui_init` |
| b | `common/src/c/grid_led.c` | 46-56 | `const uint8_t min_lookup[256]` |
| b | `common/src/c/grid_led.c` | 58-72 | `const uint8_t mid_lookup[256]` |
| b | `common/src/c/grid_led.c` | 74-84 | `const uint8_t max_lookup[256]` |
| c | `common/src/c/grid_led.c` | 86-94 | `const uint8_t sine_lookup[256]` (CONTEXT says 86-94; correct) |
| d | `common/src/c/grid_led.c` | 191-211 | `grid_led_tick` in full (CONTEXT says 191-211; correct — the function's closing brace is line 211) |
| e | `common/src/c/grid_led.c` | 298-303 | `grid_led_set_layer_color` — the whole function, which derives the three per-layer stops from one colour |
| f | `common/src/c/grid_led.c` | 305-375 | `grid_led_set_layer_min` / `_mid` / `_max` / `_phase` — the setters and their range guards |
| g | `common/src/c/grid_led.c` | 408-463 | `grid_led_render_framebuffer_one` — shape/phase → intensity selection (≈421-448) and the weight lookup, per-layer accumulation and final scaling (449-462) |
| h | `common/src/c/grid_led.c` | 171-183 | `grid_led_lookup_get` — how a registered lookup is resolved at runtime |
| i | `common/src/c/grid_led.h` | 11 | `GRID_LED_LAYER_COUNT` |
| i | `common/src/c/grid_led.h` | 28-40 | `struct LED_layer` — the per-layer fields the tick and the renderer read |
| j | `common/src/c/grid_lua_api.c` | 1062-1103 | `l_grid_led_layer_color` (`glc`), including the branch at 1078 and the branch at 1091-1094 |
| k | `common/src/c/grid_lua_api.c` | 1566-1594 | `l_grid_led_layer_pfs` (`glpfs`), including the three setter calls at 1589-1591 |
| l | `common/src/c/grid_lua_api.c` | 1301-1337 | `l_grid_led_address_get` — the Lua-visible logical index entry point |

Rows (a)-(e) plus (g) cover D-06's five load-bearing items; (f), (h), (i), (j), (k), (l) are the
surrounding context an independent reader needs to get them right.

**Deliverable for that agent:** `src/lib/fidelity/firmware-oracle.ts`, literal data only, one
`file:line` citation per constant, with a header stating what it was and was not allowed to read.
A **different** author then writes `firmware-oracle.spec.ts` asserting the vendored simulator against
it — all 81 cells, all 256 sine entries, every weight — because that spec has to read the simulator's
API and therefore cannot be written by the isolated agent.

## Runtime State Inventory

Vendoring is a file copy, so most categories are genuinely empty. Verified, not assumed:

| Category | Items found | Action required |
|----------|-------------|------------------|
| Stored data | **None.** No database, no localStorage schema, no persisted IDs touched by this phase (`localStorage` snapshots arrive in Phase 7) | none |
| Live service config | **None.** The only external service is the Cloudflare Worker, whose config is `wrangler.jsonc` in git. No CSP, no headers rule, no route config changes | none |
| OS-registered state | **A stray `wrangler dev` process tree was found holding `build/` open** (see Pitfall 3). No scheduled tasks, no pm2, no services | kill the tree before any build/e2e task |
| Secrets / env vars | **None.** `SITE_USER`/`SITE_PASSWORD` are unaffected; nothing in this phase reads an env var | none |
| Build artefacts | `build/`, `.svelte-kit/`, `node_modules/.vite` — all gitignored and regenerated. `build/` was rebuilt clean at the end of this pass. The new `.wasm` asset only appears once something imports grid-protocol | none beyond a normal rebuild |

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | everything | ✓ | v24.14.0 (type-stripping works) | Vitest instead of plain node for the baseline script |
| `grid-editor` checkout | vendoring source, D-11a baseline | ✓ | branch `redesign`, HEAD `a0fb69d5…`, zona files identical to HEAD | — |
| `grid-editor/node_modules` | D-11a resolution | ✓ | grid-protocol `1.20260825.1135`, vitest present | — |
| `github.com/sabotond-dev/botor` | D-01 precondition | ✓ **already satisfied** | `git ls-remote … refs/heads/main` → `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | — |
| `grid-fw` checkout | D-05/D-06 oracle | ✓ | HEAD `dc7d301e4fb…`, all cited ranges verified | — |
| `wrangler` + `workerd` | D-12 harness | ✓ | serves `build/` on 4173, cold start ≈5 s | `npx sirv-cli build` (loses the auth-gate coverage) |
| Playwright Chromium | D-12 e2e | ✓ | launched and drove the built page successfully | — |
| Network to github.com | D-01 assertion | ✓ | `ls-remote` succeeded | — |
| `python` | — | ✗ | not on PATH (the `python` shim opens the Microsoft Store) | use Node for any scripting |

No missing dependency blocks this phase.

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (`environment: "node"`, `expect.requireAssertions: true`, `passWithNoTests: true`) + Playwright 1.60 for browser |
| Config file | `vite.config.ts` (`test.projects`); `playwright.config.ts` |
| Quick run command | `npx vitest run --project server` — **4.6 s measured**, 291 tests after this phase |
| Sweep command | `npx vitest run --project sweep` — **38.6 s measured**, 9 tests |
| Full suite | `npx vitest run && npx playwright test` (the e2e needs `npm run preview`, i.e. build + `wrangler dev`) |

### Phase requirements → test map

| Criterion / Req | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| C1 · FOUND-02 | The three BOTOR suites run and pass inside HANGAR | unit (ported) | `npx vitest run --project server src/vendor/botor/tests/pad.test.js src/vendor/botor/tests/pad-sim.test.js` | ❌ Wave 1 (copy) |
| C1 · FOUND-02 | The 4,860-state sweep passes | unit (ported) | `npx vitest run --project sweep` | ❌ Wave 1 (copy) |
| C1 (dev **and** built) | Test count is what it should be — guards Pitfall 1 | unit | `npx vitest run --project server --reporter=json` asserted in a spec, or an explicit count check in the task's acceptance | ❌ Wave 0 |
| C1 · FOUND-05 | The `.wasm` resolves and initialises from the **built** site through the Worker | e2e | `npx playwright test e2e/fidelity.e2e.ts` | ❌ Wave 3 |
| C1 | The wasm asset is served as `application/wasm` | e2e | same spec, assert the response header | ❌ Wave 3 |
| C2 · FOUND-02 | Every vendored file carries a provenance header naming repo/path/SHA/date | unit | `npx vitest run src/lib/fidelity/vendored-diff.spec.ts` | ❌ Wave 2 |
| C2 | Only the three permitted deltas exist (byte-level) | unit | same spec (sha256 vs `upstream-manifest.json`) | ❌ Wave 2 |
| C2 | `VENDOR.md` names `sabotond-dev/botor` (D-02) and its table has a row per file | unit | a `config-shape`-style assertion spec (reuse `src/lib/config-shape.spec.ts` helpers) | ❌ Wave 2 |
| C3 · CONT-01 | Nine presets compile to character-identical Lua and equal costs vs BOTOR's own output | unit | `npx vitest run src/lib/fidelity/preset-baseline.spec.ts` | ❌ Wave 2 |
| C3 · D-11b | `compressScript` lengths equal the fixture at `PROTOCOL_PIN` (replaces the `it.todo`) | unit | `npx vitest run src/lib/protocol-pin.spec.ts` | ✓ exists, `it.todo` at line 46 |
| C4 · PREV-06 | Vendored simulator agrees with the independently derived firmware oracle, exhaustively | unit | `npx vitest run src/lib/fidelity/firmware-oracle.spec.ts` | ❌ Wave 2 (oracle: Wave 1, isolated agent) |
| C4 · D-07 | Golden frames unchanged for all nine presets | unit | `npx vitest run src/lib/fidelity/golden-frames.spec.ts` | ❌ Wave 2 |
| C5 · FOUND-05 | Cost/fit awaits the gate; `validate` never reports a bogus syntax error pre-init; `PadSim` is not gated | unit | `npx vitest run src/lib/pad/ready.spec.ts` | ❌ Wave 2 |
| hygiene | `npm run check` stays at 0 errors with the vendored tree present | static | `npm run check` | ✓ (needs the tsconfig change) |
| hygiene | `npm run lint` stays green | static | `npm run lint` | ✓ (already covered by the ignore files) |

### Sampling rate

- **Per task commit:** `npx vitest run --project server` (4.6 s) + `npm run lint` for tasks touching
  HANGAR-owned files.
- **Per wave merge:** add `npx vitest run --project sweep` (38.6 s) and `npm run check`.
- **Phase gate:** `npx vitest run` (both projects, 39.9 s) + `npm run check` + `npm run lint` +
  `npx playwright test` (needs a clean 4173) all green before `/gsd:verify-work`.

### Wave 0 gaps

- [ ] `vite.config.ts` — delete `"src/vendor/**"` from the `server` project's `exclude`; add the
      `sweep` project. **Without this the entire phase's test evidence is vacuous.**
- [ ] `tsconfig.json` — add `"exclude": ["src/vendor/**"]` (Pitfall 2, option A).
- [ ] `package.json` — add `test:quick` and `test:sweep` scripts.
- [ ] `docs/VALIDATION.md` — does not exist; D-07 and D-10 both require it.
- [ ] No framework install needed.

## State of the Art

| Old belief (from CONTEXT / earlier research) | Verified today | Impact |
|---|---|---|
| "HANGAR's Vitest glob already includes them, so no config change" (D-09) | The `server` project excludes `src/vendor/**`; the suites are silently skipped | One-element deletion; make the test count the acceptance check |
| "The sweep is 3,564 states" | The file's own header says 1,620 × 3 = **4,860** | Update phase docs; it is why the sweep is 38.6 s |
| "Measure the suite, split only if > 30 s" (D-10) | 39.9 s whole / 38.6 s sweep alone → **the split fires** | Two Vitest projects, measured green |
| "Run the baseline script with `cwd = grid-editor`" (D-11a) | Unnecessary and slightly harmful; resolution already binds to the sibling's `node_modules` from an absolute import, and `cwd = hangar` keeps every cache out of the sibling | Script runs from HANGAR |
| "Use tsx / vite-node inside the sibling" (D-11a discretion) | Plain `node` on 24.14 loads `_pad.ts` directly | No new dependency |
| "If the Worker sets a CSP it must allow `wasm-unsafe-eval`" | It sets **no** CSP; WASM verified working in Chromium | Record the fact; add the requirement as a note for whoever adds a CSP later |
| "Verify the `.wasm` MIME rather than assume it" | `application/wasm`, confirmed over the wire through the Worker | Assert it in the e2e anyway — it is one line |
| Cost baseline == `cost().used` | `cost().used` is the *raw* length for all nine presets and is blind to minifier drift | Record `measure()` too; fix PIN-POLICY wording |

## Open Questions

1. **Where does `VALIDATION.md` live?**
   - Known: D-07 and D-10 both say to record decisions in `VALIDATION.md`; no such file exists.
   - Unclear: `docs/VALIDATION.md` (beside `PIN-POLICY.md`, ships in the source archive) vs
     `.planning/VALIDATION.md` (planning-only, `export-ignore`d).
   - Recommendation: **`docs/VALIDATION.md`**. It documents standing rules (what the oracle proves,
     what golden frames do not prove, the sampling rates) that Phase 4's PREV-03 honesty line will
     quote, and `PIN-POLICY.md` set the precedent.

2. **Does the `/dev/fidelity` route ship after launch?**
   - Known: it is prerendered by `entries: ["*"]` with no edit, is unlinked, and is behind Basic Auth
     until the embargo date.
   - Unclear: whether the user wants it gone on launch day.
   - Recommendation: keep it, note it in the SUMMARY and in `docs/DEPLOY.md`'s launch checklist beside
     "remove the Basic Auth gate". It leaks nothing and it is the only regression test that the WASM
     still initialises in production.

3. **Should `pad-sim-host.ts` get any test?** (explicit discretion)
   - Known: no ported suite imports it; it uses `IntersectionObserver` (×5), `requestAnimationFrame`
     (×4), `devicePixelRatio` (×4), `matchMedia` (×2), one `getContext`; it exports one class,
     `SimHost`.
   - Recommendation: **no test this phase.** Adding jsdom for one smoke import is a new dependency and
     a new Vitest project for near-zero signal; Phase 4 wires it into a page and Playwright covers it
     there for real. `vendored-diff.spec.ts` still proves the file arrived unmodified.

4. **How much does the header block perturb line-number citations?**
   - Known: the block goes above line 1 of each file, shifting everything.
   - Recommendation: `VENDOR.md`'s table records the header length per file, and every HANGAR
     document that cites a vendored line cites the **upstream** number with an explicit
     "(upstream line, add the header offset)" note.

5. **Should `.gitattributes` pin the vendored tree to `-text`?**
   - Known: `* text=auto eol=lf` covers `src/vendor/**`; upstream is already LF so nothing changes
     today, and the sha256 manifest is stable.
   - Recommendation: cheap insurance — add `src/vendor/** -text` so no future normalisation rule can
     silently rewrite bytes the manifest hashes. One line, no behaviour change now.

## Sources

### Primary (HIGH confidence — executed or read on this machine)

- `npm run build` in HANGAR → `build/_app/immutable/assets/lua_fmt_bg.D_18ElAm.wasm`, and the rewritten
  `new URL(...)` in `build/_app/immutable/chunks/DP-SkcdD.js`
- Chromium (Playwright) against `http://127.0.0.1:4173/dev/fidelity/` served by `wrangler dev` +
  `worker/index.js` — probe returned `ok:19`, wasm 200 `application/wasm`, empty console
- `curl -D -` on the wasm asset through the Worker — full header set, no CSP
- `npx vitest run` with the vendored files staged: 4 files/18 tests (exclude present) vs
  7 files/300 tests (exclude removed); per-project split 4.64 s / 38.57 s
- `npm run check` with the vendored files staged: 489 errors → 0 with either tsconfig fix;
  `svelte-check --ignore` rejected by its own CLI
- `npx eslint .` exit 0, `prettier --check .` silent on `src/vendor/**`
- `node scripts`-style import of `grid-editor/src/renderer/main/zona/_pad.ts` — nine-preset baseline,
  module-identity probe, pre-init behaviour probe, golden-frame determinism probe
- `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` → `a0fb69d5…`
- `git -C ../grid-editor status --porcelain` before and after every operation — identical
- `grid-fw` at `dc7d301`: `common/src/c/grid_module.c`, `grid_led.c`, `grid_led.h`, `grid_lua_api.c`
  (line ranges only)
- `node_modules/@intechstudio/grid-protocol/dist/index.js:4193-4240, 4459-4479` and
  `node_modules/@wasm-fmt/lua_fmt/{package.json,lua_fmt.js:232-260,lua_fmt_vite.js,lua_fmt_node.js}`
- HANGAR: `vite.config.ts`, `tsconfig.json`, `.gitattributes`, `.prettierignore`, `eslint.config.js`,
  `worker/index.js`, `wrangler.jsonc`, `playwright.config.ts`, `package.json`,
  `src/lib/protocol-pin.spec.ts`, `src/lib/format-parity.spec.ts`, `docs/PIN-POLICY.md`

### Secondary (project documents, HIGH confidence as intent)

- `.planning/phases/03-vendor-the-domain/03-CONTEXT.md`, `.planning/phases/01-scaffold-licence-and-pin/01-CONTEXT.md`
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` §Phase 3, `.planning/STATE.md`
- `.planning/research/ARCHITECTURE.md` §3.3, §4.1, §4.2; `PITFALLS.md` §C6, §C7;
  `STACK.md` §Decision 4, §Decision 6

### Tertiary (LOW confidence, flagged)

- None. Nothing in this document rests on a web search.

## Metadata

**Confidence breakdown:**

- Port mechanics and deltas: **HIGH** — executed, 281/281 green
- Vitest / tsconfig / lint interactions: **HIGH** — measured with the files actually staged in `src/`
- Suite timings: **HIGH** — measured three ways on this machine (single cold run each; ±10% expected)
- WASM in the production build: **HIGH** — observed in a real browser against the real artefact
- Baseline capture and module identity: **HIGH** — executed, sibling verified untouched
- Firmware oracle line ranges: **HIGH** — re-verified at `dc7d301`
- Golden-frame recommendations: **MEDIUM-HIGH** — determinism and tick aliasing measured; the specific
  tick set is a judgement call
- The `/dev/fidelity` post-launch question: **MEDIUM** — needs the user's call, not more research

**Research date:** 2026-09-02
**Valid until:** ~30 days, or until either sibling checkout moves. The measurements are pinned to
`grid-editor@a0fb69d5`, `grid-fw@dc7d301`, `@intechstudio/grid-protocol@1.20260825.1135` and
Node 24.14.0; any of those moving invalidates the timings and possibly the deltas.
