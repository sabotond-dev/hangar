---
phase: 03-vendor-the-domain
plan: 03
subsystem: testing
tags: [fidelity, baseline, compressScript, grid-protocol, pin-gate, botor, d-11]

# Dependency graph
requires:
  - phase: 03-vendor-the-domain
    provides: "Plan 01's vendored compiler at src/vendor/botor/_pad.ts with its 281 ported tests and the two-project Vitest split; plan 02's src/lib/fidelity/ directory, its read-only sibling-resolution script template, and the D-04 byte-level gate that makes a local patch to the vendored compiler impossible to hide"
  - phase: 01-scaffold-licence-and-pin
    provides: "PROTOCOL_PIN, the four-test protocol-pin.spec.ts with its root()/json() helpers and the D-11 it.todo seam, docs/PIN-POLICY.md, and src/lib/format-parity.spec.ts's read-only sibling discipline"
provides:
  - "src/lib/fidelity/preset-baseline.json - full Setup and Timer Lua plus raw, compressed and cost lengths for all nine shelf presets, captured from BOTOR's OWN compiler in BOTOR's own tree at a0fb69d5"
  - "scripts/capture-preset-baseline.mjs - read-only re-capture, gated on the D-01 SHA from both ls-remote and the sibling HEAD and on the sibling's declared grid-protocol version equalling PROTOCOL_PIN"
  - "src/lib/fidelity/preset-baseline.spec.ts - 19 tests; ROADMAP criterion 3, character-identical Lua from the VENDORED compiler against a fixture the copy did not produce"
  - "src/lib/protocol-pin.spec.ts - 5 tests, 0 todo; the D-11 bump gate now asserts GridScript.compressScript LENGTHS, the only number that can see minifier drift"
  - "docs/PIN-POLICY.md - a bump checklist written in commands and counts that exist, with the 'not enforceable yet' paragraph gone"
affects:
  - "03-04..03-06 (the firmware oracle and golden frames inherit a compiler whose output is pinned character for character; any shared-helper change that moves emitted Lua now fails by preset name)"
  - "Every future grid-protocol bump (D-11): the gate is complete, so the pin can move under review instead of not at all"
  - "05 (the fit ladder and budget meter are calibrated against exactly these compressed lengths)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A fidelity fixture is captured by the ORIGINAL, in the original's tree, so the spec that checks the copy against it is evidence rather than a tautology"
    - "Record the number the gate needs, not the number the product happens to show: cost().used is max(compressed, raw) + reserved and is blind to the drift the bump gate exists for, so the compressed pair is recorded and asserted separately"
    - "Cross-repo execution is read-only execution: import the sibling's source by absolute file:// URL with cwd staying in HANGAR, so module resolution crosses the boundary but no cache can"
    - "Await the readiness gate of the module you actually imported - two checkouts of the same package are two module instances"

key-files:
  created:
    - scripts/capture-preset-baseline.mjs
    - src/lib/fidelity/preset-baseline.json
    - src/lib/fidelity/preset-baseline.spec.ts
  modified:
    - src/lib/protocol-pin.spec.ts
    - docs/PIN-POLICY.md
    - src/lib/format-parity.spec.ts
    - .planning/phases/03-vendor-the-domain/deferred-items.md

key-decisions:
  - "The fixture records FOUR lengths per preset (setup/timer raw, setup/timer compressed) plus both cost().used values, and the pin gate asserts the COMPRESSED pair - cost().used equals the raw length for all nine presets today, so a bump whose minifier spent five more characters would leave it untouched and the gate would stay green through exactly the change it exists to catch"
  - "capturedAt is computed at run time rather than hard-coded: a re-capture on another day is genuinely a different capture, and every other field in the source block is a gate that fails rather than drifts"
  - "protocol-pin.spec.ts measures with GridScript.compressScript directly, not through the vendored measure(), so the bump gate stays true even while the vendored copy is mid-resync"
  - "The PIN-POLICY bump checklist names commands and counts (test:quick, test:sweep, 176 / 96 / 9) instead of describing a property, so an item that stops being true stops being runnable"

patterns-established:
  - "Negative checks are executed, not assumed: the fixture was perturbed by one character, the spec was watched going red naming the perturbed preset, then restored with git checkout -- and re-run green, with both exit codes recorded"
  - "Backslash-heavy acceptance greps are run from script files, never inline, because the Bash transport halves backslashes"

requirements-completed: [FOUND-02]

# Metrics
duration: 11 min
completed: 2026-09-03
---

# Phase 3 Plan 03: The Preset Baseline and the Closed Bump Gate Summary

**BOTOR's own compiler, run read-only inside BOTOR's own checkout, produced a nine-preset fixture carrying Setup and Timer Lua plus four length numbers each; the vendored copy reproduces every byte of it (19 tests), and the Phase 1 `it.todo` is now a real assertion on `GridScript.compressScript` LENGTHS — the one number `cost().used` cannot see move.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-03T10:01:30Z
- **Completed:** 2026-09-03T10:12:30Z
- **Tasks:** 3 (plus one authorised deviation, committed separately)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `src/lib/fidelity/preset-baseline.json` (9,133 bytes) holds the complete Setup and Timer Lua for all nine shelf presets, produced by the compiler in the sibling checkout at `a0fb69d5`, together with raw length, `compressScript` length, `cost().used` and the preset's declared cost for each event.
- All nine compressed lengths match the research measurement exactly. **No disagreement with the `<interfaces>` table on any of the 9 × 7 recorded values** — costs, compressed lengths, timer periods and stamps.
- `src/lib/fidelity/preset-baseline.spec.ts` reports **19 passed (19)**: the vendored compiler emits Lua that is character-identical to BOTOR's for every preset. ROADMAP criterion 3 holds and is enforced.
- `src/lib/protocol-pin.spec.ts` reports **5 passed (5)** with **0 `it.todo`**. The D-11 bump gate is complete: a grid-protocol bump that moves any preset's `compressScript` length turns it red.
- `docs/PIN-POLICY.md`'s "Items (1) and (2) are not enforceable yet … until then the pin does not move" paragraph is replaced by the two spec files and three commands that now enforce them.
- `npm run test:quick` reports **8 files / 329 passed (329)** — the todo is consumed, no todo remains in the server project. `npm run test:sweep` still reports 9. `npm run check` reports `344 FILES 0 ERRORS`; `npm run lint` exits 0.
- The sibling checkout is byte-unchanged and no cache of any kind was created inside it.

## Task Commits

| # | Task | Commit | Type |
|---|---|---|---|
| — | Authorised deviation: give the parity canary an explicit timeout | `72b79f1` | test |
| 1 | Capture the nine-preset baseline from BOTOR's own compiler, read-only | `d85495a` | feat |
| 2 | Assert the vendored compiler reproduces the fixture character for character | `d70c67a` | test |
| 3 | Close the Phase 1 `it.todo` and correct the PIN-POLICY bump checklist | `cce3454` | test |

## Files Created/Modified

**Created:**

- `scripts/capture-preset-baseline.mjs` — plain Node ESM, no dependencies. Resolves the sibling via `git rev-parse --git-common-dir` honouring `BOTOR_REPO`, fails-never-skips if it is missing, asserts the D-01 SHA against both `git ls-remote` and the sibling's `HEAD`, asserts the sibling's declared `@intechstudio/grid-protocol` equals `PROTOCOL_PIN`, imports the sibling `_pad.ts` by absolute `file://` URL, awaits **the sibling's** `padCompilerReady()`, asserts `PRESETS.length === 9`, and re-reads the sibling's `git status --porcelain` afterwards.
- `src/lib/fidelity/preset-baseline.json` — 9,133 bytes, Prettier-clean as written, byte-stable across two consecutive runs.
- `src/lib/fidelity/preset-baseline.spec.ts` — 19 tests in three blocks (9 Lua-identity, 9 length-and-cost, 1 catalog/pin guard). Reads nothing outside the repository.

**Modified:**

- `src/lib/protocol-pin.spec.ts` — `it.todo` replaced by a real assertion of the same name, behind a `beforeAll(async () => { await initLuaFormatter(); })`. The existing vitest import was widened rather than duplicated. The four original tests are untouched.
- `docs/PIN-POLICY.md` — bump-gate items 1 and 2 rewritten; the "not enforceable yet" paragraph replaced. Bump log, three-sources table and the `TBD` tested-firmware range left alone.
- `src/lib/format-parity.spec.ts` — the authorised deviation, below.
- `.planning/phases/03-vendor-the-domain/deferred-items.md` — item 1 marked RESOLVED with the commit hash.

## Measured numbers

### The nine captured presets

`raw` is `lua.length`; `compressed` is `GridScript.compressScript(lua).length`; `cost` is `cost().used`, which is `max(compressed, raw) + reserved`.

| preset | stamp | setup raw/compressed | timer raw/compressed | cost setup | cost timer | timer period ms | declared cost |
|---|---|---|---|---|---|---|---|
| aurora | `paurora` | 250 / 249 | 55 / 54 | 250 | 55 | 300000 | 250 / 55 |
| pinwheel | `ppinwheel` | 305 / 304 | 55 / 54 | 305 | 55 | 300000 | 305 / 55 |
| starfield | `pstarfield` | 238 / 237 | 55 / 54 | 238 | 55 | 300000 | 238 / 55 |
| radar | `pradar` | 438 / 437 | 55 / 54 | 438 | 55 | 300000 | 438 / 55 |
| joystick | `pjoystick` | 535 / 534 | 24 / 23 | 535 | 24 | 300000 | 535 / 24 |
| ninepads | `pninepads` | 580 / 579 | 158 / 157 | 580 | 158 | 20 | 580 / 158 |
| faders | `pfaders` | 513 / 512 | 24 / 23 | 513 | 24 | 300000 | 513 / 24 |
| dial | `pdial` | 646 / 645 | 55 / 54 | 646 | 55 | 300000 | 646 / 55 |
| tpad | `ptpad` | 902 / 901 | 146 / 145 | 902 | 146 | 20 | 902 / 146 |

**Disagreement with the plan's `<interfaces>` table: none.** All nine compressed pairs, all nine cost pairs, all nine timer periods and all nine stamps match it exactly. The `declaredCost` column recorded from `PRESETS` also equals `cost().used` for every preset, so BOTOR's own shelf annotations are current.

Pitfall 4 confirmed on live data: compressed is **exactly one character less than raw** for all nine presets in both events, so `cost().used === lua.length` everywhere and `cost` alone cannot see a minifier that spends characters. That is why the fixture records four numbers and why the pin gate asserts the compressed pair.

### The negative check (task 2)

One character was flipped inside `radar`'s `setupLua` in `src/lib/fidelity/preset-baseline.json` — the first digit in the emitted Lua, `for n=0,80` became `for n=1,80` (character index 25). The file's byte length was unchanged, so only the Lua-identity assertion could fire, which is what it was chosen for.

| State | Command | Result | Exit code |
|---|---|---|---|
| Perturbed | `npx vitest run --project server src/lib/fidelity/preset-baseline.spec.ts` | `Tests 1 failed \| 18 passed (19)`. Failing test: **`nine shelf presets against BOTOR's own compiler (criterion 3) > radar compiles to character-identical Setup and Timer Lua`**, at `preset-baseline.spec.ts:89` with the message `radar setup Lua` and the two Lua strings printed side by side | **1** |
| Reverted (`git checkout -- src/lib/fidelity/preset-baseline.json`) | same | `Tests 19 passed (19)`; `git status --porcelain src/lib/fidelity/preset-baseline.json` empty | **0** |

Exactly one of the 19 went red, and it was the one whose title names the perturbed preset. The length-and-cost test for `radar` stayed green, correctly — the perturbation did not move a length. The spec file was `git add`ed before the perturbation so the restore could not touch it.

### The sibling checkout (`C:\Users\sabot\Documents\Claude\grid-editor`)

`git status --porcelain`, captured before task 1 and again after task 3, byte-identical (`diff` exit **0**):

```
 M src/renderer/config-blocks/ElementName.svelte
 M src/renderer/config-blocks/SimpleColor.svelte
```

`git -C ../grid-editor rev-parse HEAD` was `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` before and after. The only commands run there were `status --porcelain` and `rev-parse HEAD`. The compiler was **executed** from that tree — imported by absolute `file://` URL — but `cwd` stayed in HANGAR throughout, and the output file is in HANGAR.

**No cache was created inside the sibling.** `grid-editor/node_modules/.vite` exists but is pre-existing and untouched: directory mtime `2026-08-28 10:22:31`, newest entry `_svelte_metadata.json` at `2026-09-01 16:21`, both well before this plan ran at `2026-09-03 12:04–12:11`. Plain `node` with type-stripping creates no cache of its own, which is the reason the plan forbids a Vite-based runner here.

### Suite state

| Command | Files | Tests | Notes |
|---|---|---|---|
| `npx vitest run --project server src/lib/fidelity/preset-baseline.spec.ts` | 1 passed (1) | **19 passed (19)** | 497 ms |
| `npx vitest run --project server src/lib/protocol-pin.spec.ts` | 1 passed (1) | **5 passed (5)**, 0 todo | 386 ms |
| `npx vitest run --project server src/lib/format-parity.spec.ts` | 1 passed (1) | 3 passed (3) | 2.34 s |
| `npm run test:quick` | **8 passed (8)** | **329 passed (329)** | 3.53 s; no todo remains |
| `npm run test:sweep` | 1 passed (1) | **9 passed (9)** | 39.9 s, unchanged |
| `npm run check` | — | — | `344 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | — | — | exit 0 |

`309 | 1 todo` → `329` is +19 from the new spec and +1 from the consumed todo.

### Idempotence

`git add src/lib/fidelity/preset-baseline.json`, re-run `node scripts/capture-preset-baseline.mjs`, `git diff --quiet` → exit **0**. The fixture is byte-stable across two runs.

## Decisions Made

- **Four lengths per preset, and the gate asserts the compressed pair.** `cost().used` is `max(compressed, raw) + reserved`, and on live data compressed is exactly one character shorter than raw for all nine presets in both events — so `cost().used` is the raw length, always. A grid-protocol bump whose minifier spent five characters would move `compressScript(...).length` and leave `cost().used` alone, and a gate recording only cost would stay green through precisely the change it exists to catch.
- **`protocol-pin.spec.ts` measures with `GridScript.compressScript` directly**, not through the vendored `measure()`. The pin gate is about the installed package; routing it through the vendored compiler would make it fail for reasons that belong to `preset-baseline.spec.ts`, and would make it unrunnable mid-resync.
- **The capture script awaits the SIBLING's `padCompilerReady()`.** HANGAR's copy of the protocol package is a different module instance; readying it leaves the imported compiler's `cost()` throwing "The Lua formatter is not initialised." The failure reads as a WASM packaging problem and is not one, so the reason is written into the script as a full-line comment beside the call.
- **`cwd` stays in HANGAR while the sibling's compiler runs.** Module resolution crosses the repository boundary by itself (the `file://` import binds `@intechstudio/grid-protocol` to grid-editor's own `node_modules`), so there is nothing to gain from moving `cwd` and a bundler cache to lose by it.
- **`capturedAt` is computed at run time.** A re-capture on another day genuinely is a different capture. Every other field in the `source` block is a gate that fails rather than drifts (commit asserted twice, protocol pin asserted against the sibling's declaration), so the one soft field is the honest one.
- **PIN-POLICY item 1 names counts, not a property.** "The vendored suite is green" cannot rot; "`test:quick` reports 176 in `pad.test.js` and 96 in `pad-sim.test.js`, `test:sweep` reports 9" stops being runnable the moment it stops being true, which is the point.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `src/lib/format-parity.spec.ts` timeout flake (pre-authorised)**

- **Found during:** before Task 1, as the authorised deviation named in the execution prompt (deferred-items.md item 1, discovered in 03-02).
- **Issue:** the spec spawns two Prettier subprocesses over a 152 KB file inside Vitest's default 5,000 ms per-test timeout, and failed once under parallel load in wave 2. A flaky canary in the per-task loop would have made every count-based acceptance criterion in this plan unreliable.
- **Fix:** two changes, both minimal. An explicit `CANARY_TIMEOUT_MS = 30_000` third argument on the two canary tests, and `HANGAR_PRETTIER` resolved once as `node_modules/prettier/bin/prettier.cjs` and invoked through `node` instead of `npx prettier` — which also drops the `shell: process.platform === "win32"` workaround and makes both sides of the comparison use the same invocation shape. **What the spec asserts is unchanged**: same two files, same `--ignore-path .prettierignore`, same `cwd`, same byte-for-byte output comparison.
- **Files modified:** `src/lib/format-parity.spec.ts` only. `npm run format` was scoped to that one file.
- **Verification:** `npx vitest run --project server src/lib/format-parity.spec.ts` → `Tests 3 passed (3)`, exit 0. `npm run lint` exit 0.
- **Commit:** `72b79f1` (separate, before Task 1, as instructed).
- **Follow-up:** `deferred-items.md` item 1 marked RESOLVED with that hash.

**Total deviations:** 1 auto-fixed (1 × Rule 3), pre-authorised in the execution prompt. **Impact:** none on the plan's deliverables; it removed a known source of false negatives from the per-task verification loop before that loop was used 12 times.

The three tasks themselves executed exactly as written. The `<interfaces>` baseline table was correct in every one of its 63 values, the vendored compiler reproduced the fixture on the first run with no adjustment to either side, and the 19 / 5 / 329 / 8 counts came out exactly as the plan predicted.

## Issues Encountered

- **The sibling `_pad.ts` prints one line of its own on import** — `HEARTBEAT_INTERVAL 250000 250` — so `node scripts/capture-preset-baseline.mjs` emits ten stdout lines, nine of which are the script's. Upstream's `console.log`, not the script's; touching it would be a fourth delta and D-04 forbids it. The nine preset lines still match `^[a-z]+  setup [0-9]+/[0-9]+  timer [0-9]+/[0-9]+$` exactly nine times, and the same line appears in the spec's stdout under Vitest for the same reason. Worth knowing before someone parses the output.
- **Node emits a `MODULE_TYPELESS_PACKAGE_JSON` warning** on stderr when importing the sibling `_pad.ts`, because grid-editor's `package.json` has no `"type": "module"`. Cosmetic, on stderr, exit code unaffected. It cannot be silenced from HANGAR without writing to the sibling.
- **The Bash transport halves backslashes**, as in plans 01 and 02. Every file here was authored with the Write/Edit tools, and all four backslash-heavy acceptance criteria (`grep -v '^\s*//'` twice, `grep -cE "Tests +19 passed \(19\)"` and friends) were executed from `.sh` files in the scratchpad rather than inline. Nothing was committed in a corrupted state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 03-04. What it inherits:

- A compiler whose emitted Lua is pinned character for character for all nine presets. Any change in 03-04..03-06 that touches a shared helper and moves a preset's output now fails by preset name rather than showing up as a subtly wrong number later.
- `src/lib/fidelity/` now holds three artefacts (`upstream-manifest.json`, `preset-baseline.json`, and two specs) and the pattern for a fourth: generated fixtures land there Prettier-clean as written, are proven byte-stable across two runs before being committed, and are perturbed once and watched going red before being trusted.
- **No `it.todo` remains in the server project.** Plan 04 introduces exactly one, a named and reasoned gap in `firmware-oracle.spec.ts`; if a count-based criterion in a later plan sees a second one, something regressed.
- `npm run test:quick` is 8 files / 329 passed; `npm run test:sweep` is 9. Those are the numbers 03-04's count-based criteria should be written against.
- The D-11 bump gate is complete, so `docs/PIN-POLICY.md`'s standing instruction changes from "the pin does not move" to "the pin moves under this checklist".

No blockers.

---

_Phase: 03-vendor-the-domain_
_Completed: 2026-09-03_

## Self-Check: PASSED

All three created files and this summary exist on disk. All four commits (`72b79f1`, `d85495a`,
`d70c67a`, `cce3454`) are present in `git log --all`, and none carries a trailer of any kind
(`git log -1 --format='%(trailers)'` is empty for each). The nine raw/compressed pairs quoted above
were re-read from `src/lib/fidelity/preset-baseline.json` and match it exactly. The sibling's
`git status --porcelain` and `rev-parse HEAD` are back at - and never left - their pre-plan values.
