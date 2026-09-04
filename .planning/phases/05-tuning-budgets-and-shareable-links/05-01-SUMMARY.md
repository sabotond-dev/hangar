---
phase: 05-tuning-budgets-and-shareable-links
plan: 01
subsystem: testing
tags: [playwright, webkit, vitest, tdd, simulator, lua-formatter, budgets]

# Dependency graph
requires:
  - phase: 04-first-experience
    provides: SimHost with injectable HostDeps, the coverflow that owns the hero canvas
  - phase: 03-vendor-the-domain
    provides: the FOUND-05 gate (src/lib/pad/ready.ts) and HANGAR's gated compile surface
  - phase: 08-new-configurations
    provides: the 43-file / 563-test quick suite and the 23-test e2e suite this plan re-measured
provides:
  - The Phase 5 measured baseline (BASE_FILES, BASE_TESTS, BASE_SWEEP_FILES, BASE_SWEEP_TESTS, BASE_E2E) every later plan in the phase reads
  - A grepped webkit-phone Playwright project that costs zero tests until a title carries @webkit
  - SimHost.replaceEngine(id, engine) - the live-recompile seam that keeps the canvas, the observer and the slot
  - fitState(state, options) - the vendored fit ladder behind the FOUND-05 gate
affects: [05-02, 05-04, 05-07, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright projects: chromium runs everything, webkit-phone runs only @webkit titles"
    - "A spec that must observe a cold Lua formatter after the gate has already opened buys a second cold start with vi.resetModules()"

key-files:
  created: []
  modified:
    - playwright.config.ts
    - src/lib/sim/host.ts
    - src/lib/sim/host.spec.ts
    - src/lib/pad/index.ts
    - src/lib/pad/ready.spec.ts

key-decisions:
  - "BASE_E2E is the phase baseline, measured once here and never recomputed; from 05-11 onward plans assert against PREV_E2E, the total in the immediately preceding SUMMARY"
  - "The webkit-phone project carries grep: /@webkit/ and chromium carries no grep, so the phone tests are cross-browser rather than WebKit-only and the suite total does not double"
  - "replaceEngine is a new method rather than a register() call: register() unregisters first, which sets canvas.width = 0 and re-enters with intersecting: false"
  - "ready.spec.ts test 6 observes its gate on a second cold module graph (vi.resetModules), because test 3 has already opened the process-wide one"

patterns-established:
  - "Pattern 1: e2e reporter lines now carry a [chromium] project prefix - any later plan grepping an e2e title must allow for it"
  - "Pattern 2: the sweep is asserted with its literal 1 9 in every Phase 5 plan; BASE_SWEEP_* is recorded only as provenance for that literal"

requirements-completed: []  # groundwork only - see the deviation below
requirements-contributed: [TUNE-02, TUNE-04, TUNE-05, DEGR-01]

# Metrics
duration: 20 min
completed: 2026-09-04
---

# Phase 5 Plan 01: Baseline, the WebKit Phone Project, SimHost.replaceEngine and the Gated fitState Summary

**The Phase 5 numbers are measured rather than guessed, a grepped WebKit phone project exists and provably costs zero tests, and the two seams later waves need — an engine swap that keeps the pad alive and a fit ladder behind the FOUND-05 gate — are in place with both paired mutations observed red.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-04T09:27:00Z
- **Completed:** 2026-09-04T09:47:01Z
- **Tasks:** 3
- **Files modified:** 5

---

## Phase 5 baseline (measured 2026-09-04, before any file in this plan was touched)

These are the numbers every later plan in Phase 5 reads. They were taken on `eafcb1d`'s successor
`d05a26b` with a clean tree, before `playwright.config.ts` gained its `projects` array.

| Label | Value |
|---|---|
| `BASE_FILES` | **43** |
| `BASE_TESTS` | **563** |
| `BASE_SWEEP_FILES` | **1** |
| `BASE_SWEEP_TESTS` | **9** |
| `BASE_E2E` | **23** |

Verbatim summary lines, as captured:

```
npm run test:quick
 Test Files  43 passed (43)
      Tests  563 passed | 1 todo (564)
   Duration  5.52s

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)
   Duration  36.33s

npm run check 2>&1 | tail -5
1788514511386 COMPLETED 456 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npx playwright install --dry-run webkit
WebKit 26.5 (playwright webkit v2336)
  Install location:    C:\Users\sabot\AppData\Local\ms-playwright\webkit-2336

npm run test:e2e
  23 passed (35.2s)
```

WebKit 26.5 was **already installed** (`webkit-2336/INSTALLATION_COMPLETE` present on disk). Nothing
was downloaded; `npx playwright install webkit` was not run.

The `check` figure — **456 files, 0 errors** — is recorded for provenance and is asserted nowhere as
a count; the gate is `0 errors`.

### The naming rule the rest of the phase follows

Two different things are being counted, and the names are not interchangeable:

- **`BASE_E2E` is the phase baseline.** It is measured here, once, and **never recomputed**. Plan
  05-07 is the only plan that asserts against it, as `BASE_E2E + 1`, because the e2e total has not
  moved before then.
- **From 05-11 onward the e2e total has already moved**, so those plans assert against **`PREV_E2E`
  — the e2e total recorded in the immediately preceding plan's SUMMARY**, not against `BASE_E2E`.
- **`BASE_FILES` / `BASE_TESTS` already work the `PREV_` way**: each plan reads the previous
  SUMMARY's numbers and asserts previous + delta through `scripts/check-counts.mjs`.
- **The sweep is the exception.** It is asserted with its **literal** file and test counts (`1 9`,
  and `3 13` from 05-05) in every plan including this one, because the `sweep` project is a
  named-file include and its total is a property of this phase's own files. `BASE_SWEEP_FILES` and
  `BASE_SWEEP_TESTS` are recorded above only as provenance for that literal.

### Totals observed after this plan

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 43 files / 563 tests (1 todo) | **43 files / 567 tests (1 todo)** | +0 files / +4 tests |
| `test:sweep` | 1 file / 9 tests | **1 file / 9 tests** | unchanged |
| `test:e2e` | 23 passed | **23 passed** | unchanged |
| `check` | 456 files, 0 errors | **456 files, 0 errors** | unchanged |

Matches 05-VALIDATION's expected delta row for 05-01 (`+0 / +4 / 1 file 9 / unchanged`) exactly.

---

## Accomplishments

- **The baseline is a measurement, not a literal.** All five Step-1 observations were taken on a
  clean tree before any edit, and the e2e number specifically was taken before `projects` existed.
- **`playwright.config.ts` has exactly two projects** — `chromium` (everything, no `grep`) and
  `webkit-phone` (`devices["iPhone 15"]`, `grep: /@webkit/`) — and `--project webkit-phone --list`
  reports `Total: 0 tests in 0 files`, so the second browser costs nothing until a title is tagged.
- **`SimHost.replaceEngine`** swaps the engine under a live pad and keeps the canvas, the
  `IntersectionObserver` registration and the hero/window slot; it re-stills under reduced motion
  *before* it paints, and an unknown id is a silent no-op.
- **`fitState`** puts the vendored `fit()` on HANGAR's compile surface behind `padReady()`, with
  `FitPlan`, `FitStep` and `PadSheet` re-exported beside the other types. A comment-stripped scan of
  `src/lib` confirms nothing else reaches the vendored `fit` around the gate.
- **Both paired negative checks were observed red** before the code was trusted.

## Task Commits

1. **Task 5-01-01: Re-measure the baseline, then add the WebKit phone project** — `34cfaf1` (chore)
2. **Task 5-01-02: SimHost.replaceEngine** — `abd2e0c` (test, RED) → `893b651` (feat, GREEN)
3. **Task 5-01-03: fitState behind the FOUND-05 gate** — `7d9c305` (test, RED) → `347affd` (feat, GREEN)

No refactor commit was needed for either TDD task.

## Files Created/Modified

- `playwright.config.ts` — gains a two-entry `projects` array and a `devices` import; the header
  comment now explains why the second project exists (DEGR-01), why it is filtered (a bare second
  project doubles the suite), and that `devices["Desktop Chrome"]`'s 1280x720 is the viewport Phase
  4's coverflow geometry was measured at. `use`, `testDir`, `testMatch` and `webServer` were left
  exactly where they were and are inherited by both projects.
- `src/lib/sim/host.ts` — `replaceEngine(id, engine)` immediately after `register`, eight lines plus
  the comment recording why it is not `register()`.
- `src/lib/sim/host.spec.ts` — 10 → **13** tests. The existing fake clock, canvas, engine, observer
  and media harness are reused; no second harness was written.
- `src/lib/pad/index.ts` — `fitState`, `fit as vendorFit`, and the `FitPlan` / `FitStep` / `PadSheet`
  type re-exports.
- `src/lib/pad/ready.spec.ts` — 5 → **6** tests; header comment and test 4's comment now name five
  load-bearing gates rather than four.

## The two negative checks, observed

### 1. `host.spec.ts` — delete `this.paint(entry, this.deps.now())` from `replaceEngine`

Red, naming the missing paint:

```
FAIL  |server| src/lib/sim/host.spec.ts > the simulator host (src/lib/sim/host.ts) > paints the new engine at once, before the loop runs again
AssertionError: the swap did not paint: the new engine's frame waits for a frame callback: expected +0 to be 1

 Test Files  1 failed (1)
      Tests  2 failed | 11 passed (13)
```

(Test 13 goes red with it, for the same reason and in the reduced-motion voice: *"a reduced-motion
visitor kept looking at the previous engine's frozen picture"*.)

Restored, green:

```
      Tests  13 passed (13)
```

### 2. `ready.spec.ts` — delete `await padReady()` from `fitState`

Red, with the vendored not-initialised message:

```
FAIL  |server| src/lib/pad/ready.spec.ts > the Lua formatter gate (FOUND-05) > the fit ladder through HANGAR's surface awaits the gate before it measures
Error: The Lua formatter is not initialised. Await padCompilerReady() first.
 ❯ assertPadCompilerReady src/vendor/botor/_pad.ts:76:11
 ❯ measure src/vendor/botor/_pad.ts:3042:3
 ❯ budgetOf src/vendor/botor/_pad.ts:3060:25
 ❯ cost src/vendor/botor/_pad.ts:3068:17
 ❯ fit src/vendor/botor/_pad.ts:4104:18
 ❯ fitState src/lib/pad/index.ts:108:10

 Test Files  1 failed (1)
      Tests  1 failed | 5 passed (6)
```

Restored, green:

```
      Tests  6 passed (6)
```

**What was needed to see that red** (the plan asked for this to be recorded): the test stays sixth,
after the existing five, so the pre-init probe remains the first test in the file — but a sixth test
alone would have been a tautology, because test 3 opens the real gate and the formatter, once
initialised, stays so. `vi.resetModules()` followed by a dynamic `await import("./index")` buys a
**second cold start**: it rebuilds `src/vendor/botor/_pad.ts` (whose `formatterReady` flag resets)
*and* `@intechstudio/grid-protocol` beneath it, so `isPadCompilerReady()`'s fallback
`GridScript.checkSyntax` genuinely returns `false` again. That was measured, not assumed — the
mutated run above is the proof.

## The forbid-scan (throwaway `.mjs`, scratch directory, not left in the repo)

```
scanned 103 files under src/lib
excluded: src/lib/pad/index.ts and every *.spec.ts
no import of the vendored fit outside the gated surface
```

Self-tested by removing the `src/lib/pad/index.ts` exclusion, which correctly reports the one
legitimate importer, so the scan is not silently vacuous:

```
OFFENDERS:
src/lib/pad/index.ts  ->  ../../vendor/botor/_pad
```

## Acceptance criteria, checked

- `grep -c 'name: "' playwright.config.ts` → `2`
- `grep -c "webkit-phone" playwright.config.ts` → `1`
- `grep -c "grep:" playwright.config.ts` → `1`
- `npx playwright test --project webkit-phone --list` → `Total: 0 tests in 0 files`
- `npm run test:e2e 2>&1 | tee .tmp-e2e/after-projects.log | node scripts/check-counts.mjs --playwright 23` → `check-counts: matches the expected counts`
- `grep -c failed .tmp-e2e/after-projects.log` → `0`
- `git status --porcelain .tmp-e2e` → empty (gitignored)
- `netstat -ano | grep -w LISTENING | grep ":4173"` → nothing, before and after every run; no `workerd` or `wrangler` process left
- `npx vitest run --project server src/lib/sim/host.spec.ts` → `13 passed`
- `npx vitest run --project server src/lib/pad/ready.spec.ts` → `6 passed`
- `grep -c "export async function fitState" src/lib/pad/index.ts` → `1`, with `await padReady()` on the next line
- `npm run test:quick 2>&1 | node scripts/check-counts.mjs 43 567` → matches
- `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9` → matches
- `npm run check 2>&1 | grep -Ei "0 errors"` → matches; `npm run lint` → exit 0
- `git diff --quiet HEAD -- src/vendor` → exit 0 (the vendored tree is byte-identical)

## Decisions Made

1. **`replaceEngine` re-stills before it paints, and the spec pins that order behaviourally.** Test 13
   wraps the incoming engine's `run` and records the canvas paint count at the moment it is called;
   asserting that count equals the pre-swap count is what proves `stillFrame` ran first. Reading the
   source would not have proved it.
2. **Test 6 buys a second cold start rather than moving before test 3.** Moving it earlier would have
   made `fitState` the first gate-crossing call in the file and quietly destroyed `costOf`'s own
   negative check, which test 3's comment explicitly depends on. `vi.resetModules()` gives both
   guards a red.
3. **The e2e reporter now prefixes every line with `[chromium]`.** A consequence of naming projects
   at all. Later plans that grep an e2e title (05-11, 05-12) must allow for the prefix; the summary
   line `23 passed (…)` that `check-counts.mjs --playwright` reads is unaffected.

## Deviations from Plan

### Adaptations the plan explicitly sanctioned

**1. [Rule 3 - Blocking] `ready.spec.ts` test 6 needed a forced fresh module graph to be
mutation-observable**

- **Found during:** Task 5-01-03
- **Issue:** The plan's own contingency fired. As written, a sixth test placed after the existing
  five cannot see the un-initialised formatter — test 3 opened the gate, and the vendored module's
  `formatterReady` flag plus the protocol package's WASM state both survive for the rest of the
  process. Deleting `await padReady()` from `fitState` would have left the test green on broken code.
- **Fix:** The test calls `vi.resetModules()` and re-imports `./index` dynamically. Measured
  behaviour: that rebuilds the vendored compiler *and* `@intechstudio/grid-protocol`, so the graph
  starts genuinely cold and the mutation throws the vendored message. The test stays sixth; the
  pre-init probe stays first; `costOf`'s negative check is untouched.
- **Files modified:** `src/lib/pad/ready.spec.ts`
- **Verification:** the mutated run quoted above (`1 failed | 5 passed`), then `6 passed` restored.
- **Committed in:** `7d9c305` (RED) and `347affd` (final form)

**2. [Rule 1 - Bug] The first draft of test 6 asserted the right property the wrong way**

- **Found during:** Task 5-01-03, between the RED commit and the GREEN commit
- **Issue:** Before measuring, I assumed `vi.resetModules()` would *not* reset the externalised
  protocol package, and wrote test 6 around a mocked `./ready` whose gate the test held shut. That
  version proves "fitState awaits *something*" rather than "fitState awaits the FOUND-05 gate", and
  it is the weaker assertion. The mocked run then failed with the real vendored not-initialised
  error, which is what revealed that the fresh graph is genuinely cold.
- **Fix:** test 6 was rewritten to the plan's literal form — fresh graph, real gate, `fitState`
  resolves rather than throws — before the GREEN commit. `FitPlan` was dropped from the spec's
  imports with it.
- **Files modified:** `src/lib/pad/ready.spec.ts`
- **Verification:** `6 passed`, and the mutation red quoted above.
- **Committed in:** `347affd`

**3. [Rule 2 - Missing Critical] The `fitState` scan was self-tested before it was trusted**

- **Found during:** Task 5-01-03
- **Issue:** A forbid-scan that matches nothing is indistinguishable from a forbid-scan that is
  broken. The plan asked only for the output.
- **Fix:** the same scan was re-run with the `src/lib/pad/index.ts` exclusion removed and correctly
  reported one offender, so the empty result above is a real negative.
- **Files modified:** none (throwaway script in the scratch directory)
- **Verification:** the two outputs quoted in the forbid-scan section.
- **Committed in:** n/a

---

**4. [Rule 1 - Bug] REQUIREMENTS.md was not marked complete for this plan's four requirements**

- **Found during:** the post-plan state update
- **Issue:** `requirements mark-complete TUNE-02 TUNE-04 TUNE-05 DEGR-01` ticked all four and set
  their traceability rows to `Complete`. All four are shared with later plans in this phase:
  TUNE-02 with 05-03/05-04/05-10/05-11, TUNE-04 and TUNE-05 with 05-02/05-04/05-05/05-09/05-10/05-12,
  DEGR-01 with 05-02/05-11/05-12. Nothing visitor-facing shipped here - there is no ladder line, no
  red meter and no WebKit journey yet - so a `Complete` row would have told the phase verifier and
  every later plan that delivered work exists when it does not.
- **Fix:** the REQUIREMENTS.md edit was reverted with `git checkout`. All four stay `Pending` until
  the plan that actually delivers them marks them: TUNE-02 at 05-11, TUNE-03/04/05 at 05-09 and
  05-10 with 05-12's `/dev/tune/` guard, DEGR-01 at 05-12's WebKit phone journey. 05-VALIDATION
  already says as much - "the SUMMARY that completes them carries the qualifier".
- **Files modified:** none (`.planning/REQUIREMENTS.md` restored to HEAD)
- **Verification:** `git diff --stat .planning/REQUIREMENTS.md` is empty; row 194 still reads
  `| TUNE-04 | Phase 5 | Pending |`.
- **Committed in:** n/a (no change committed)

---

**Total deviations:** 4 (1 blocking, 2 bugs, 1 missing critical). Two of the four are the plan's own
documented contingency for task 5-01-03 firing exactly as it predicted.
**Impact on plan:** none on scope, files or counts. The delta is `+0 files / +4 tests`, as planned.

## Issues Encountered

- **A transient empty pipe.** `npm run test:quick 2>&1 | node scripts/check-counts.mjs 43 567` failed
  once with `no Vitest summary lines found on stdin` and passed on an immediate re-run with identical
  output, both directly and through a `tee`. A shell pipeline race on this machine, not a test
  failure; recorded here because a later plan seeing it once should re-run rather than investigate.
- Nothing else. No auth gate, no architectural decision, no blocked task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Ready for 05-02.** That plan should read `BASE_FILES = 43` and `BASE_TESTS = 567` (this plan's
  observed totals, per the `PREV_` rule) and assert `+3 files / +17 tests`; the sweep stays `1 9`;
  the e2e total stays `23`.
- `SimHost.replaceEngine` is available for wave 11's live preview swap and `fitState` for wave 4's
  ladder guards.
- The `webkit-phone` project is inert and waiting: the first `@webkit` title (wave 12) will move the
  e2e total by the number of tagged tests, not by the whole suite.

---
*Phase: 05-tuning-budgets-and-shareable-links*
*Completed: 2026-09-04*

## Self-Check: PASSED

All five modified files exist on disk; all five task commits (`34cfaf1`, `abd2e0c`, `893b651`,
`7d9c305`, `347affd`) are present in the history.
