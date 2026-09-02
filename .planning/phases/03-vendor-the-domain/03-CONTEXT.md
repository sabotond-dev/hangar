# Phase 3: Vendor the Domain - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

BOTOR's ZONA compiler (`_pad.ts`, 4,380 lines), simulator engine (`pad-sim.ts`, 1,569) and render
loop (`pad-sim-host.ts`, 557) are copied into `src/vendor/botor/` with import-path rewrites only, along
with their three test files (`pad.test.js` 3,705 lines / 176 tests, `pad-sim.test.js` 1,863 / 96,
`pad-invariants.test.js` 356 / 9 incl. the 3,564-state sweep). The nine shelf presets compile to
character-identical Lua against a baseline captured from BOTOR's own compiler. Simulator fidelity is
pinned by an oracle derived from firmware source independently of the compiler. Nothing can compile,
cost or fit before the Lua-formatter WASM has initialised.

Requirements: FOUND-02, FOUND-05, PREV-06. Success criteria 1-5 in ROADMAP.md §Phase 3 stand as
written; criterion 1's "green against a production static build" is satisfied by D-11 below.

Not in this phase: the catalog, the simulator host wired into a page, knobs, any serial code. Zone
blocks (`_zone-blocks.ts`, `zone-blocks.store.ts`, `zone-solo-guard.ts`), `pad-editor.store.ts` and
`PadPanel.svelte` are explicitly NOT vendored — they are Editor-coupled and HANGAR's device adapter
replaces the only piece that matters (`PadWriteAdapter`, Phase 7).

</domain>

<decisions>
## Implementation Decisions

### Upstream provenance
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

### Permitted deltas to vendored files
- **D-04:** Exactly three kinds of change are allowed, and a test enforces it: (1) the provenance
  header block; (2) import-path rewrites (`../main/zona/_pad` → `../_pad`, `./_pad`, `./pad-sim` as
  needed); (3) the one type inline in `_pad.ts` — `import type { RGB } from "../../config-blocks/_screen"`
  becomes `export type RGB = { r: number; g: number; b: number };`. No formatting, no lint fixes, no
  renames, no reordering, no local bug fixes. `src/vendor/` stays in `.prettierignore` and the ESLint
  ignore list (Phase 1). Claude's discretion: a `vendored-diff.spec.ts` that diffs each vendored file
  against the recorded upstream bytes ignoring exactly those three deltas, so "import paths only" is
  asserted, not promised.

### Oracle strength (PREV-06, criterion 4)
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

### Vendored tests
- **D-09:** The three test files live at **`src/vendor/botor/tests/`, verbatim `.js`**, with the same
  provenance header and the same three-delta rule as the sources. HANGAR's Vitest server project glob
  `src/**/*.{test,spec}.{js,ts}` already includes them; `requireAssertions` is on and every BOTOR test
  asserts, so no config change. Their `beforeAll` (`await initLuaFormatter(); await padCompilerReady();`)
  stays as written — it is the FOUND-05 gate under test.
- **D-10:** **Suite-speed rule:** keep the vendored suite whole in `npx vitest run`, MEASURE the wall
  time on this machine, and only if the quick run exceeds **~30 s** split the invariant sweep into a
  separate `test:sweep` script run per wave (not per task). Record the measurement and the decision in
  the SUMMARY and `VALIDATION.md`. Do not pre-split.

### Cost baseline (criterion 3, closes Phase 1's D-11 `it.todo`)
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

### Production-build proof (criterion 1, FOUND-05)
- **D-12:** A **Playwright test on the built site** proves the WASM resolves outside the dev server: a
  dev-only/hidden entry (e.g. `/dev/fidelity`, prerendered, no navigation to it from the UI) awaits
  `initLuaFormatter()`, compiles one preset with the vendored compiler in the browser, and exposes the
  costs; the e2e asserts they equal `preset-baseline.json`. This proves the `.wasm` is emitted by Vite,
  served through the Worker, and initialises under the deployed CSP. If the Worker sets a CSP header,
  it must include `'wasm-unsafe-eval'` (PITFALLS §C7); if it sets none, record that explicitly.

### WASM gate (FOUND-05, criterion 5) — Claude's discretion within these bounds
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

</decisions>

<specifics>
## Specific Ideas

- "Fix upstream, then re-sync" is the user's standing answer to any defect found in vendored code. The
  vendored copy is a mirror, never a fork.
- The oracle agent's independence is the deliverable, not a nicety: its prompt must forbid reading the
  simulator and its tests, and the SUMMARY must state what it was and was not allowed to read.
- The user pushes BOTOR before this phase executes; the plan asserts the public SHA rather than trusting
  the local checkout.
- Costs from the user's notes, for sanity only (the fixture is authoritative): starfield 238, aurora
  250, pinwheel 305, radar 438, faders 513, ninepads 580, tpad 902/908, dial 646/55, joystick 535/24.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked decisions and requirements
- `.planning/phases/01-scaffold-licence-and-pin/01-CONTEXT.md` — D-09..D-12 (pin, bump gate,
  byte-identical costs, range never shown), D-15 (no formatting of vendored files; parity canary),
  D-16 (`src/vendor/botor/` + `VENDOR.md`)
- `.planning/REQUIREMENTS.md` — FOUND-02, FOUND-05, PREV-06
- `.planning/ROADMAP.md` §Phase 3 — goal and five success criteria
- `src/vendor/botor/VENDOR.md` — the header template and sync procedure (its Upstream section must be
  corrected per D-02)
- `docs/PIN-POLICY.md` — the D-11 bump checklist this phase makes real
- `src/lib/protocol-pin.spec.ts` — the `it.todo` cost-baseline assertion to replace

### Research that decides this phase
- `.planning/research/ARCHITECTURE.md` §3.3 (project structure), §4.1 (measured coupling: two imports),
  §4.2 (vendor-and-adapt, sync rules, escalation rule), §Anti-Patterns "Refactoring the vendored files"
- `.planning/research/PITFALLS.md` §C6 (fidelity drift; the six techniques; the six-tier test strategy)
  and §C7 (WASM formatter init; `checkSyntax` silent false; CSP `'wasm-unsafe-eval'`)
- `.planning/research/STACK.md` §Decision 4 (`@intechstudio/grid-protocol` browser safety, the lazy
  628 KB WASM, `optimizeDeps.exclude`) and §Decision 6 (Vitest node env runs the BOTOR suite headless)

### Firmware ground truth (read-only)
- `C:\Users\sabot\Documents\Claude\grid-fw` (clone, HEAD `dc7d301`) — `common/src/c/grid_module.c`
  (:445-458 LED lookup), `common/src/c/grid_led.c` (:46-84 weights, :86-94 sine, :191-211 tick,
  :298-303 stops, :428-442 shape), `common/src/c/grid_lua_api.c` (:1082-1092, :1589-1591)
- `C:\Users\sabot\.claude\projects\C--Users-sabot-Documents-Claude\memory\project_zona_module_config.md`
  — the user's verified ZONA firmware facts (colour ramp with mid at 127 and 128, weights sum 254 with
  /512, serpentine handled in firmware, freeze-on-expiry)

### BOTOR sources to vendor (read-only, sibling repo — never run a state-changing git command there)
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\main\zona\_pad.ts`, `pad-sim.ts`,
  `pad-sim-host.ts`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\tests\pad.test.js`, `pad-sim.test.js`,
  `pad-invariants.test.js`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\config-blocks\_screen.ts:6` — the `RGB`
  type to inline
- `C:\Users\sabot\Documents\Claude\grid-editor\package.json` — the pinned protocol version and Vitest 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/protocol-pin.ts` / `.spec.ts` — `PROTOCOL_PIN` and the three-way gate; the `it.todo` is the
  seam for D-11b.
- `src/lib/format-parity.spec.ts` — resolves the sibling repo via `git rev-parse --git-common-dir`,
  runs BOTOR's own Prettier read-only; the same pattern serves the baseline script (D-11a) and the
  `git status --porcelain` before/after assertion.
- `src/lib/config-shape.spec.ts` — the `text()`/`code()` helpers and the `.prettierignore` assertions.
- `vite.config.ts` — Vitest `server` project (`environment: "node"`, glob `src/**/*.{test,spec}.{js,ts}`,
  `requireAssertions`, `passWithNoTests`), `optimizeDeps.exclude: ["@intechstudio/grid-protocol"]`.
- `e2e/` + `playwright.config.ts` — harness over `wrangler dev` on the real `build/`; D-12 adds one spec.
- `worker/index.js` — where a CSP header would live if one is added for `'wasm-unsafe-eval'`.

### Established Patterns
- Vendored code is byte-near, prettier/eslint-ignored, and every sibling access is read-only with a
  before/after `status --porcelain` assertion.
- Negative checks are observed, not assumed (every Phase 1 gate was seen red before trusted).
- Nyquist: every task has an automated verify; quick loop is `npx vitest run`.

### Integration Points
- `src/vendor/botor/` (exists, holds only `VENDOR.md`) — fill it.
- `src/lib/fidelity/` (new) — oracle, golden frames, preset baseline.
- `src/lib/pad/ready.ts` (new) — the WASM gate Phase 4's app root awaits.
- `@intechstudio/grid-protocol@1.20260825.1135` already installed and pinned.

</code_context>

<deferred>
## Deferred Ideas

- **Hardware capture (Tier 6)** — real LED frames from a ZONA to pin the simulator against physics, not
  just firmware source; needs the module in hand. Add to the hardware checklist for Phase 6/7.
- **Promotion to a shared `@zona/pad` package** — only after the escalation rule trips (two hand-merged
  syncs or a third consumer).
- **Zone blocks (`_zone-blocks.ts`)** — Editor action blocks, not needed by HANGAR's catalog; revisit
  only if Phase 8 authoring wants zone-engine configs.
- **Loading UI while the WASM initialises** — Phase 4.
- **Formatting BOTOR's own zona files upstream** (three are not Prettier-clean) — the user's call in
  BOTOR; if done, `// prettier-ignore` above `pad-sim.ts`'s sine table first.

</deferred>

---

*Phase: 03-vendor-the-domain*
*Context gathered: 2026-09-02*
