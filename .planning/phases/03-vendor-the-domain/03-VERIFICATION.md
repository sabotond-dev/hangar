---
phase: 03-vendor-the-domain
verified: 2026-09-03T11:09:01Z
status: passed
score: 26/26 must-haves verified
re_verification: false
success_criteria: 5/5 verified
requirements: 3/3 satisfied
---

# Phase 3: Vendor the Domain Verification Report

**Phase Goal:** BOTOR's compiler and simulator run inside HANGAR unmodified, with fidelity pinned by something other than the code that produced it.
**Verified:** 2026-09-03T11:09:01Z
**Status:** passed
**Re-verification:** No — initial verification

Every number below was produced by running the gate on this machine during verification, not read
from a SUMMARY. Where a claim could only be established by a negative check (perturb a tracked file
and observe red), it is marked **by-record** and the SUMMARY's recorded exit codes are cited — the
verifier is read-only outside `.planning/` and does not perturb tracked source.

---

## Goal Achievement

### ROADMAP Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Vendored suite green in dev **and** against a production static build | ✓ VERIFIED | `npm run test:quick` → 11 files, **352 passed \| 1 todo (353)**; `npm run test:sweep` → 1 file, **9 passed**; `npm run test:e2e` → **8 passed** against `build/` served by `wrangler dev` on 4173. The e2e asserts a `.wasm` response with status 200 and `content-type: application/wasm`, and zero console errors. |
| 2 | Every vendored file names its BOTOR origin; written sync procedure against a recorded SHA | ✓ VERIFIED | All six files carry a provenance block citing `sabotond-dev/botor`, upstream path, `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c`, synced `2026-09-02`. `VENDOR.md` `grep -c TBD` → **0**; six-row table complete; nine-step read-only sync procedure. `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` → `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` — the recorded SHA is the live upstream SHA. |
| 3 | Nine shelf presets compile to character-identical Lua at the pinned protocol version | ✓ VERIFIED | `preset-baseline.spec.ts` → 19 passed. `it.each` over 9 ids asserts `built.setupLua`/`timerLua`/`stamp`/`timerPeriodMs` `.toBe(...)` the fixture BOTOR's own compiler produced, plus raw **and** compressed lengths and both `cost().used` values. Fixture `source.protocolPin` = `1.20260825.1135` = `PROTOCOL_PIN` = the installed `@intechstudio/grid-protocol`. |
| 4 | Simulated output pinned against an oracle transcribed from cited firmware source, derived independently | ✓ VERIFIED | `firmware-oracle.spec.ts` → 7 passed \| 1 todo. Exhaustive, not sampled: 81 LED lookup cells, 256 sine entries, weight triple over all 256 phases + its sum invariant, colour-stop derivation incl. the forced-black branch, shape-to-intensity over every shape and phase incl. an unknown shape, and tick order at layer expiry. Oracle header cites `grid-fw` `dc7d301e4fb8502c4db5b2500e1f7f991ef06110` (confirmed = that repo's `HEAD`) with per-constant `file:line`. |
| 5 | No compile, cost or fit call can run before the Lua formatter WASM has initialised | ✓ VERIFIED | `src/lib/pad/index.ts` — all six entry points (`compilePreset`, `compileState`, `costOf`, `fitsIn`, `measureLua`, `validateCompiled`) open with `await padReady()`. `ready.spec.ts` → 5 passed, incl. "the vendored cost path refuses before the gate resolves", "validate … never invents a syntax error", "the gate is memoised", and the deliberate negative: "the simulator is **not** gated". |

**Success criteria:** 5/5 verified.

---

### Observable Truths (plan `must_haves`)

#### Plan 03-01 — vendored tree and config

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pad.test.js` reports 176, `pad-sim.test.js` reports 96 | ✓ VERIFIED | Ran each in isolation: **176 passed** / **96 passed** |
| 2 | `test:sweep` reports 9 in one file | ✓ VERIFIED | `1 file / 9 passed`, 55.9 s |
| 3 | `npm run check` reports 0 errors with the vendored tree on disk | ✓ VERIFIED | `COMPLETED 353 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 4 | Every vendored file names repo, upstream path, `a0fb69d5`, sync date | ✓ VERIFIED | `head -20` on all six — block present and uniform |
| 5 | `VENDOR.md` names `sabotond-dev/botor` (main), lists six files, sync procedure executable | ✓ VERIFIED | 0 TBD; table complete; step 1 (`ls-remote`) reproduced, step 5 script exists, steps 6-9 are the gates run here |

#### Plan 03-02 — upstream sha256 manifest and byte gate

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Byte-identical to upstream once the permitted deltas are inverted, by sha256 not prose | ✓ VERIFIED | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` → **14 passed** |
| 7 | A fourth change of any kind turns the suite red and names the file | ✓ VERIFIED (by-record + structural) | `it.each(vendoredPaths)` — a failure is labelled with the path. Negative checks (append a space to `pad-sim.ts`; flip a hex digit of `_pad.ts`'s sha256) observed red and reverted, both exit codes in 03-02-SUMMARY. Not re-perturbed here: read-only. |
| 8 | Green on a machine with no `grid-editor` checkout | ✓ VERIFIED | The spec's only path root is `new URL("../../../"+file)` — inside HANGAR. No sibling path, no `git` call, no `grid-editor` string anywhere in the file. |
| 9 | The manifest records the D-01 commit and a drifting SHA is a failure | ✓ VERIFIED | `upstream.commit` = `a0fb69d5…`; test "the manifest pins the D-01 upstream commit" is one of the 14 |

#### Plan 03-03 — preset baseline and pin-gate closure

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 10 | Nine presets compile character-identical to BOTOR's own output | ✓ VERIFIED | See criterion 3 |
| 11 | Baseline carries RAW **and** COMPRESSED lengths for Setup and Timer separately | ✓ VERIFIED | Every preset object has `setupRawLength`, `timerRawLength`, `setupCompressedLength`, `timerCompressedLength`, `costSetupUsed`, `costTimerUsed`, `declaredCost` |
| 12 | The `it.todo` in `protocol-pin.spec.ts` is now a real assertion | ✓ VERIFIED | `grep -c "it\.todo"` → **0**; line 53 asserts `GridScript.compressScript(p.setupLua).length` and the timer equivalent against the baseline, per preset |
| 13 | Baseline produced without writing a byte inside the `grid-editor` checkout | ✓ VERIFIED | `capture-preset-baseline.mjs`'s only write target is `join(ROOT,"src","lib","fidelity","preset-baseline.json")`. `git -C ../grid-editor status --porcelain` shows the same two pre-existing ` M` lines before and after everything this verification ran. |

#### Plan 03-04 — independent firmware oracle

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 14 | Constants agree with data re-derived by an author who never saw the simulator | ✓ VERIFIED | See criterion 4 and the independence check below |
| 15 | Agreement is exhaustive across LED lookup, sine, weights, colour stops, shape intensity | ✓ VERIFIED | Seven `it`s, each looping the full domain (81 / 256 / 256 × 3 / every shape × phase) |
| 16 | Every oracle constant carries a `file:line` citation into `grid-fw` at the commit read | ✓ VERIFIED | Header lists the four C files with line ranges; per-constant doc comments quote the source lines (e.g. `grid_module.c:445-453` for R0-R8, `grid_module.c:458` for the registration) |
| 17 | Nine presets have a recorded frame hash at five ticks | ✓ VERIFIED | `golden-frames.json` — `ticks: [0, 37, 101, 500, 1009]`, nine preset keys, each entry `{tick, sha256, nonZeroBytes, animating}`; `golden-frames.spec.ts` → 11 passed |
| 18 | Golden frames labelled as a regression tripwire, not an oracle, in fixture and docs | ✓ VERIFIED | Fixture `note` opens "Regression tripwire, not an oracle"; spec header repeats it; 03-VALIDATION.md's fixture table says the same; the spec also refuses to run in regeneration mode |

#### Plan 03-05 — the WASM gate

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 19 | No compile/cost/fit call can run before the formatter initialised — it waits, not throws | ✓ VERIFIED | Six `await padReady()` first-statements; `ready.spec.ts` test 3 crosses the gate first by construction |
| 20 | `checkSyntax`'s silent-false is never observable through HANGAR's surface | ✓ VERIFIED | `ready.spec.ts`: "validate through HANGAR's surface never reports not-ready and never invents a syntax error" |
| 21 | The simulator is NOT gated | ✓ VERIFIED | `ready.spec.ts`: "PadSim renders with the formatter uninitialised"; corroborated by `firmware-oracle.spec.ts` and `golden-frames.spec.ts` having no `beforeAll` gate and passing |
| 22 | The gate is memoised | ✓ VERIFIED | `gate ??= (async () => {…})()`; `ready.spec.ts`: "the gate is memoised: every caller awaits one initialisation" |

#### Plan 03-06 — production-build proof and docs

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 23 | The vendored compiler runs in a real browser against the production static build and produces the recorded numbers | ✓ VERIFIED | `e2e/fidelity.e2e.ts` "the hidden probe compiles aurora in a real browser against build/" → ok in 1.5 s; `expect(out).toEqual({…aurora fixture fields})` |
| 24 | The `.wasm` is served as `application/wasm` | ✓ VERIFIED | Same test: `expect(wasm[0].type).toBe("application/wasm")` and `status === 200` |
| 25 | The probe is prerendered as a real static file, reachable by URL, linked from nowhere | ✓ VERIFIED | `page.goto("/dev/fidelity/")` succeeds against `build/`; second test asserts `a[href*="/dev/"]` count is 0 on `/` |
| 26 | `docs/TESTING.md` explains the two projects, their cost, the type-check exclusion, and the stale-wrangler preflight | ✓ VERIFIED | Contains the 176 / 96 / 4,860 / 489 / 4173 facts, the quick-vs-sweep table with wall times, the `checkJs` rationale, and the `netstat … :4173` + process-tree kill preflight. `docs/VALIDATION.md` correctly does not exist. |

**Score:** 26/26 truths verified.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vite.config.ts` | `sweep` project; no `src/vendor/**` quarantine | ✓ VERIFIED | `server` excludes only `*.svelte.{test,spec}` and `pad-invariants.test.js` **by file name**; `sweep` includes that file alone |
| `tsconfig.json` | `"exclude": ["src/vendor/**"]` | ✓ VERIFIED | Present, with the 489→0 rationale and the note that imports still type-check the `.ts` sources |
| `package.json` | `test:quick` / `test:sweep` | ✓ VERIFIED | Both present; `test:unit`/`test` semantics preserved |
| `.gitattributes` | `src/vendor/** -text` | ✓ VERIFIED | Present, after `* text=auto eol=lf` |
| `.gitignore` | `.tmp-e2e/` | ✓ VERIFIED | Present under "Test output" |
| `src/vendor/botor/_pad.ts` | Vendored compiler, RGB inlined | ✓ VERIFIED | 152,943 B; header cites `a0fb69d5`; sole delta is the RGB inline |
| `src/vendor/botor/pad-sim.ts` | Vendored simulator | ✓ VERIFIED | 56,625 B; "Modified for HANGAR: nothing" |
| `src/vendor/botor/pad-sim-host.ts` | Vendored rAF loop | ✓ VERIFIED | 19,712 B; no modification |
| `src/vendor/botor/tests/*.test.js` | 176 / 96 / 9 | ✓ VERIFIED | Counts reproduced individually |
| `src/vendor/botor/VENDOR.md` | Upstream identity, per-file table, sync procedure | ✓ VERIFIED | 0 TBD; `sabotond-dev/botor`; the D-02 correction is explained rather than silently applied |
| `scripts/record-upstream-manifest.mjs` | Read-only re-record | ✓ VERIFIED | Exists, referenced by VENDOR.md step 5 |
| `src/lib/fidelity/upstream-manifest.json` | Per-file path, bytes, sha256, inverse deltas | ✓ VERIFIED | 6 files, 5 deltas, `a0fb69d5…`, `headerSentinel` recorded |
| `src/lib/fidelity/vendored-diff.spec.ts` | Byte-level D-04 enforcement | ✓ VERIFIED | 14 passed |
| `scripts/capture-preset-baseline.mjs` | Read-only capture from BOTOR's tree | ✓ VERIFIED | Single write target inside HANGAR |
| `src/lib/fidelity/preset-baseline.json` | 9 presets, raw + compressed | ✓ VERIFIED | 9 keys; 11 fields per preset; `source` records repo, branch, commit, compiler path, protocol pin |
| `src/lib/fidelity/preset-baseline.spec.ts` | Criterion 3 | ✓ VERIFIED | 19 passed |
| `src/lib/protocol-pin.spec.ts` | D-11 cost half, no todo | ✓ VERIFIED | 5 passed; 0 `it.todo` |
| `docs/PIN-POLICY.md` | Item 2 = `compressScript` length | ✓ VERIFIED | Line 44: "Every catalog preset's `compressScript` **length** is byte-identical" |
| `src/lib/fidelity/firmware-oracle.ts` | Independently derived constants, cited | ✓ VERIFIED | 20 KB; `grid_led.c`, `grid_module.c`, `grid_led.h`, `grid_lua_api.c` with line ranges; `ORACLE_SOURCE` pins `dc7d301e…` |
| `src/lib/fidelity/firmware-oracle.spec.ts` | PREV-06 agreement | ✓ VERIFIED | 7 passed \| 1 named todo |
| `src/lib/fidelity/golden-frames.json` + `.spec.ts` | D-07 tripwire | ✓ VERIFIED | 9 × 5 entries; 11 passed |
| `src/lib/pad/ready.ts` | Memoised `padReady` | ✓ VERIFIED | Exports `padReady`, `resetPadReadyForTests` |
| `src/lib/pad/index.ts` | 6 gated entry points | ✓ VERIFIED | Exports `compilePreset`, `compileState`, `costOf`, `fitsIn`, `measureLua`, `validateCompiled` |
| `src/lib/pad/ready.spec.ts` | FOUND-05 proof | ✓ VERIFIED | 5 passed |
| `src/routes/dev/fidelity/+page.svelte` | Hidden prerendered probe | ✓ VERIFIED | `data-testid="fidelity-probe"`; dynamic `await import("$lib/pad")` inside `onMount` |
| `e2e/fidelity.e2e.ts` | D-12 production-build proof | ✓ VERIFIED | 2 tests, both ok |
| `docs/TESTING.md` | Developer-facing test layout | ✓ VERIFIED | Prettier-clean (`npm run lint` exit 0) |

**Artifacts:** 27/27 verified. Zero MISSING, zero STUB, zero ORPHANED.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `tests/pad.test.js` | `_pad.ts` | rewritten relative import | ✓ WIRED | `} from "../_pad";` — and the suite collects 176 tests, so the import resolves |
| `vite.config.ts` | `pad-invariants.test.js` | `sweep` include glob | ✓ WIRED | Named in `include`; `test:sweep` collects 1 file / 9 tests |
| `config-shape.spec.ts` | `vite.config.ts` | structural guard | ✓ WIRED | `expect(config).not.toContain("src/vendor/**")`, plus guards on `.prettierignore`, `tsconfig` exclude and `.gitattributes` ordering |
| `vendored-diff.spec.ts` | `upstream-manifest.json` | sha256 after inverting deltas | ✓ WIRED | Reads the manifest, strips the header through `headerSentinel`, reverses each delta, hashes |
| `vendored-diff.spec.ts` | `src/vendor/botor/*` | raw byte read | ✓ WIRED | `it.each(vendoredPaths)` over all six |
| `preset-baseline.spec.ts` | `vendor/botor/_pad` | `compile` / `cost` / `measure` | ✓ WIRED | Line 10 import; 19 assertions run against real output |
| `protocol-pin.spec.ts` | `preset-baseline.json` | `compressScript` length equality | ✓ WIRED | Line 54 loads the fixture; lines 64/67 assert |
| `firmware-oracle.spec.ts` | `vendor/botor/pad-sim` | exported pure functions/tables | ✓ WIRED | Imports `SINE_LOOKUP`, `weightsOf`, `shapeIntensity`, `glcStops`, `screenToHw`/`hwToScreen`, `PadSim` |
| `firmware-oracle.spec.ts` | `firmware-oracle.ts` | expectation side of every assertion | ✓ WIRED | `import * as ORACLE from "./firmware-oracle"` |
| `golden-frames.spec.ts` | `golden-frames.json` | sha256 of `PadSim.frame` at fixed ticks | ✓ WIRED | Fixture read + hashed comparison; regeneration mode fails deliberately |
| `pad/index.ts` | `pad/ready.ts` | `await padReady()` first statement | ✓ WIRED | 6 occurrences, one per entry point |
| `pad/ready.ts` | `vendor/botor/_pad` | `padCompilerReady()` | ✓ WIRED | Awaited after `initLuaFormatter()` |
| `e2e/fidelity.e2e.ts` | `preset-baseline.json` | browser numbers vs fixture | ✓ WIRED | Fixture read at module scope; `toEqual` over seven fields |
| `+page.svelte` | `$lib/pad` | dynamic import in `onMount` | ✓ WIRED | `await import("$lib/pad")`; probe returns real numbers in the browser |

**Wiring:** 14/14 connections verified.

---

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/routes/dev/fidelity/+page.svelte` | `out` (`$state`) | `compilePreset("aurora")` → `costOf` → `measureLua` via `$lib/pad` | Yes — e2e asserts the seven fields equal the fixture aurora values, and a `.wasm` 200 was observed on the wire | ✓ FLOWING |
| `preset-baseline.spec.ts` expectations | `fixture.presets[id]` | `preset-baseline.json`, captured from BOTOR's own compiler | Yes — 9 presets, non-empty Lua, non-zero lengths | ✓ FLOWING |
| `firmware-oracle.spec.ts` expectations | `ORACLE.*` | Hand-transcribed C constants | Yes — 81-entry permutation, 256-entry tables, all compared element-wise | ✓ FLOWING |
| `golden-frames.spec.ts` expectations | `fixture.presets[id][n]` | Simulator-produced hashes (by design) | Yes, and correctly labelled as a tripwire rather than an oracle | ✓ FLOWING |

No hollow props, no empty-array defaults reaching an assertion, no static return standing in for a computed one.

---

### Behavioural Spot-Checks

| Behaviour | Command | Result | Status |
|-----------|---------|--------|--------|
| Vendored compiler suite collects and passes | `npx vitest run --project server src/vendor/botor/tests/pad.test.js` | `176 passed (176)` | ✓ PASS |
| Vendored simulator suite collects and passes | `… pad-sim.test.js` | `96 passed (96)` | ✓ PASS |
| Invariant sweep | `npm run test:sweep` | `1 file / 9 passed`, 55.9 s | ✓ PASS |
| Whole quick project | `npm run test:quick` | `11 files / 352 passed \| 1 todo (353)`, 5.8 s | ✓ PASS |
| Fidelity + gate + pin specs | `npx vitest run --project server src/lib/fidelity/ src/lib/pad/ src/lib/protocol-pin.spec.ts` | `6 files / 61 passed \| 1 todo (62)` = 14+19+5+7+11+5 | ✓ PASS |
| Byte-identity gate | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | `14 passed (14)` | ✓ PASS |
| Type check | `npm run check` | `353 FILES 0 ERRORS 0 WARNINGS` | ✓ PASS |
| Lint | `npm run lint` | prettier clean, eslint clean, exit 0 | ✓ PASS |
| Production build + browser WASM proof | `npm run test:e2e` | `8 passed (15.7s)` — incl. both fidelity tests | ✓ PASS |
| Recorded upstream SHA is the live upstream SHA | `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | ✓ PASS |
| Oracle's cited firmware commit is real | `git -C ../grid-fw rev-parse HEAD` | `dc7d301e4fb8502c4db5b2500e1f7f991ef06110` | ✓ PASS |

Every count matches 03-VALIDATION.md's "expected counts after plan 03-06" row exactly.

**Environment hygiene:** port 4173 confirmed free before the e2e run and left with no `LISTENING`
socket after it (only expiring `TIME_WAIT` client sockets); `tasklist | grep -i workerd` → none.
`git -C ../grid-editor status --porcelain` shows the same two pre-existing ` M` lines before and
after; `git -C ../grid-fw status --porcelain` is empty. HANGAR's own `git status --porcelain` is
empty after verification — nothing tracked was written.

---

### Independence Check (PREV-06)

The claim under test is a process property, so the artefact is the record.

- `03-04-SUMMARY.md` carries a **verbatim opened-files list** from the oracle author: four
  `grid-fw` C files with explicit line ranges, prefaced by a `git rev-parse HEAD` confirmation of
  `dc7d301e…`, and closed with "Nothing else was opened."
- The list contains **none** of `pad-sim.ts`, `_pad.ts`, `src/vendor/botor/tests/`,
  `03-RESEARCH.md`, `03-CONTEXT.md`, or anything under `C:\Users\sabot\.claude\projects\`.
- `firmware-oracle.ts`'s own header states the restriction in a **"Not read, by instruction"**
  block naming those exact paths — so the constraint is visible to a future reader of the file,
  not only to a reader of the SUMMARY.
- The comparison side (tasks 3-04-02/03) was executed by a *different* author who read the
  simulator freely — which is what makes the comparison a comparison.
- The author also recorded its judgement calls verbatim, including the one that cannot be
  cross-confirmed (see residues below). Disclosing the weak link is the behaviour this criterion
  was written to produce.

✓ VERIFIED.

---

## Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| **FOUND-02** | 03-01, 03-02, 03-03, 03-06 | `_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts` vendored with their existing suites passing unchanged, quarantined under a single vendor directory with a written sync procedure back to BOTOR | ✓ SATISFIED | All three sources under `src/vendor/botor/`; suites report 176 / 96 / 9 unchanged; byte-identity to upstream proven by sha256 (14 passed); `VENDOR.md` sync procedure complete and its step 1 reproduced live |
| **FOUND-05** | 03-05, 03-06 | Compile, cost and fit gated on the formatter WASM being initialised | ✓ SATISFIED | Six gated entry points; `ready.spec.ts` 5 passed incl. the pre-init branch actually observed; proven again in a real browser against the production build |
| **PREV-06** | 03-04 | Every ported preset's simulated output pinned against an oracle derived independently of the compiler | ✓ SATISFIED | `firmware-oracle.spec.ts` 7 passed \| 1 named todo, exhaustive over every observable constant; independence recorded and checked; golden frames explicitly *not* counted as the oracle |

**Coverage:** 3/3 satisfied. `grep "| Phase 3 |" .planning/REQUIREMENTS.md` returns exactly these
three rows — **no orphaned requirements**.

---

## Anti-Patterns Found

Scanned every file this phase created or modified for `TODO|FIXME|XXX|HACK|PLACEHOLDER|not yet
implemented|coming soon`, empty implementations and hardcoded-empty props.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/fidelity/firmware-oracle.spec.ts` | 209 | `it.todo("agrees on the layer scaling divisor and the layer count …")` | ℹ️ Info | Named, cross-referenced to 03-VALIDATION.md's Manual-Only table, and closable only by an upstream BOTOR export + re-sync. This is a disclosed limit of the public surface, not an unfinished task. |

**Anti-patterns:** 1 found (0 blockers, 0 warnings, 1 informational).

Notably absent: no `TODO`/`FIXME` anywhere in the phase's files; no stubbed handler; no fixture
whose values are all zeros by accident (`tpad`'s all-zero frame is explained in the fixture note as
the only correct zero). `src/lib/protocol-pin.spec.ts`'s previous `it.todo` — the one open seam
Phase 1 left — is closed: `grep -c "it\.todo"` → 0.

---

## Human Verification Required

None blocking. Three items are **documented residues already accepted** by 03-VALIDATION.md's
Manual-Only table and by the relevant SUMMARY; they are recorded here so they are not rediscovered
as surprises in Phase 4, not because they hold this phase open.

### 1. `LAYER_SCALE_DIVISOR` (512) and `LAYER_COUNT` (3)
**Test:** read `grid_led.c`'s `grid_led_render_framebuffer_one` and `grid_led.h`'s
`GRID_LED_LAYER_COUNT` and confirm the two oracle values by eye.
**Why not automated:** `pad-sim.ts` exports neither — the count is a module-private const and the
divisor is inline in a private render method, so no comparison exists that does not reach into
private state, and D-08's rule is not to reach.
**Disposition:** named `it.todo` + Manual-Only row. Closing it properly is an upstream BOTOR change
(export the constants) followed by a re-sync per D-03.

### 2. `LED_LOOKUP_DIRECTION` semantics
**Test:** confirm the "logical index → hardware index" reading against
`grid_lua_api.c:1333` and the layer setters at `grid_led.c:309-311`.
**Why not automated:** the ZONA table is self-inverse (`LOOKUP[LOOKUP[i]] === i` for all 81), so
data agreement between the two authors cannot confirm the direction label — only the semantics
differ, and both sides would agree either way. The author flagged this in the file itself.
**Disposition:** recorded in 03-04-SUMMARY and in the oracle file. The 81 *values* are
independently confirmed; only the label rests on a single derivation.

### 3. Freeze-on-expiry tick order fallback
**Why not automated:** only reachable if some `PadState` produces an animating true→false
transition within 2,000 ticks; none was found, so the weaker static-preset form is asserted instead.
**Disposition:** recorded as a Manual-Only row.

---

## Gaps Summary

**No gaps found. Phase goal achieved.**

The goal has two halves and both hold. *"Run inside HANGAR unmodified"* is not asserted in prose —
it is enforced at the byte level: every vendored file reconstructs to a sha256 that matches the
pristine upstream once three enumerated deltas are inverted, and a fourth change of any kind names
the file that moved. The recorded upstream SHA was checked against the live remote during this
verification and matches. *"Fidelity pinned by something other than the code that produced it"* also
holds, and holds twice over: the compiler is pinned against a fixture captured from BOTOR's own
compiler in BOTOR's own tree, and the simulator is pinned against constants hand-transcribed from
`grid-fw` C by an author who recorded, file by file, that it never opened the simulator. The one
fixture that *is* self-derived — the golden frames — is labelled a tripwire in the fixture, in the
spec header and in the validation contract, so it cannot be mistaken for evidence it is not.

The phase also closes a seam left open in Phase 1: `protocol-pin.spec.ts` no longer carries an
`it.todo`, and a grid-protocol bump that moves any `compressScript` length now turns the pin gate
red.

Two things worth carrying into Phase 4, neither a gap:

- The known residues above are limits of what `pad-sim.ts`'s public surface exposes. The correct
  fix for the first is upstream (export two constants, re-sync per D-03) — worth doing the next
  time BOTOR is touched for another reason, not as its own errand.
- Local `HEAD` (`54a538d`) is ahead of the deployed commit; the live site still serves Phase 1's
  `503964d`. Phase 3 is deliberately not deployed. Expected, by design, and not a verification
  finding.

**Ready to proceed to Phase 4.**

---

_Verified: 2026-09-03T11:09:01Z_
_Verifier: gsd-verifier_
