---
phase: 05-tuning-budgets-and-shareable-links
plan: 04
subsystem: tuning
tags: [tuner, debounce, meters, fit-ladder, over-budget, property-test, surprise]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-01's fitState() behind padReady() and SimHost.replaceEngine; 05-02's TuneView, meterView and copy.ts; 05-03's descriptor tables, withChange, baseStateFor and resetAll, and its measured baseline of 49 files / 599 tests"
  - phase: 03-the-vendored-compiler
    provides: "src/vendor/botor/_pad.ts - compile, cost, fits, fit, validate, PadCost, FitPlan, FitStep, PadReserved - and src/vendor/botor/pad-sim.ts's PadSim"
  - phase: 04-first-experience
    provides: "the config-shape.spec.ts chunk guard that dictates the view.ts / model.ts split, and SimEngine / createEngine"
provides:
  - "src/lib/tune/model.ts - buildTuner, Tuner, TunerOptions, LadderView, OverBudgetView, needsLadder, COMPILE_DEBOUNCE_MS: the dynamic-import-only compiler side of D-18"
  - "src/lib/tune/surprise.ts - surpriseIndices, SURPRISE_ROLL_LIMIT, SURPRISE_BUDGET_MS: the bounded fits() re-roll, pure and injectable"
  - "the two measured over-budget reserves the rest of the phase reuses: tpad at { setup: 20, timer: 0 } for the block, dial at { setup: 300, timer: 0 } for the block AND the ladder"
affects: [05-05, 05-09, 05-10, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A single named guard function owns the only call site of an expensive compiler entry point (ladderFor / fitState), and a comment-stripped scan in the spec is what keeps it single - both callers come through it rather than repeating the condition"
    - "An acceptance scan that removes module specifiers before forbidding long string literals: the two backslash-free capture patterns from lazy.spec.ts, with the excluded list printed so the exclusion is visible rather than assumed"
    - "A property test memoises the compiler by index vector: every DRAW is checked, every DISTINCT draw is measured, and both numbers are reported"

key-files:
  created:
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/tune/surprise.ts
    - src/lib/tune/surprise.spec.ts
    - src/lib/tune/ladder.spec.ts
  modified: []

key-decisions:
  - "The plan's tasks were executed in the order 02, 01, 03 rather than 01, 02, 03: model.ts imports surpriseIndices, so surprise.ts is a blocking dependency of the model task and both halves get a genuine RED"
  - "Two over-budget reserves, both measured, because tpad cannot produce a ladder at ANY reserve. Its only sheet is sends and the compiler refuses to shed sends, so fit() returns { fits: false, steps: [], blocked: 'sends' } at 20, 200, 300 and the researcher's 400 alike. tpad at 20 (Setup 922/908, free -14) proves the over-budget branch and the vendored sentence; dial at 300 (Setup 946/908, free -38, four steps, plan.fits true) is the only pairing on this shelf that reaches TUNE-04 and TUNE-05 at once"
  - "ladderFor() is the single call site of fitState and both callers use it - the debounced measurement and SURPRISE ME's exhausted roll. The first draft had two call sites and model.spec test 5 caught it, which is the gate doing its job before review could"
  - "model.ts imports the vendored compile/fits for ONE synchronous predicate, after awaiting padReady() through $lib/pad. surpriseIndices takes a synchronous fits by design; an async one would either duplicate the bound in two files or leave the re-roll as dead code called with () => true"
  - "The surprise property memoises cost by index vector. 18,000 draws, about 9,700 distinct states compiled and costed. Compiling one index vector twice proves nothing and costs another 2 ms"
  - "buildTuner emits the measuring view and the first engine BEFORE it starts measuring, so the simulation never waits on the formatter - and model.spec test 3 proves it on a genuinely cold module graph rather than on ordering alone"

patterns-established:
  - "Pattern 1: a spec with no module beside it, named for the behaviour it guards (ladder.spec.ts) rather than for a file, with its header saying why"
  - "Pattern 2: when a negative check fails to turn the predicted test red, the test was weaker than the plan believed - strengthen the test, do not weaken the check"

requirements-completed: []
requirements-contributed: [TUNE-02, TUNE-03, TUNE-04, TUNE-05, TUNE-07]

# Metrics
duration: 30 min
completed: 2026-09-04
---

# Phase 5 Plan 04: The Tuner, SURPRISE ME and the Budget Guards Summary

A knob turn now means something: `buildTuner` repaints on the same tick and recompiles a tenth of a
second later, the two meters read the pinned minifier's own numbers and say which of measuring,
settled, stale or over they are showing, `SURPRISE ME` is a property with 18,000 draws behind it, and
TUNE-04 and TUNE-05 are real code exercised against a genuinely over-budget measurement.

## Observed totals

`05-03-SUMMARY.md` recorded `BASE_FILES = 49`, `BASE_TESTS = 599` (1 todo), sweep `1 / 9`, e2e `23`.
The quick suite was **re-measured on a clean tree at `eafcb1d`, before any file in this plan was
written**, and reproduced that baseline exactly:

```
npm run test:quick          (re-measured, clean tree at eafcb1d)
 Test Files  49 passed (49)
      Tests  599 passed | 1 todo (600)
```

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 49 files / 599 tests (1 todo) | **52 files / 615 tests (1 todo)** | **+3 files / +16 tests** |
| `test:sweep` | 1 file / 9 tests | **1 file / 9 tests** | unchanged |
| `test:e2e` | 23 passed | **23 passed** (not re-run — no e2e file touched) | unchanged |
| `check` | 468 files, 0 errors | **473 files, 0 errors** | +5 files, still 0 errors |

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 52 615
check-counts: observed 52 files, 615 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9
check-counts: observed 1 files, 9 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0
```

Per-file, all green:

```
npx vitest run --project server src/lib/tune/model.spec.ts     ->  7 passed
npx vitest run --project server src/lib/tune/surprise.spec.ts  ->  4 passed
npx vitest run --project server src/lib/tune/ladder.spec.ts    ->  5 passed
```

Gates:

```
npm run check 2>&1 | grep -Ei "0 errors"
  1788519571455 COMPLETED 473 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint   ->   exit 0 ("All matched files use Prettier code style!")

npx vitest run --project server src/lib/config-shape.spec.ts src/lib/sim/lazy.spec.ts
  Test Files  2 passed (2)      Tests  17 passed (17)
```

Phase 4's chunk guards and Phase 8's laziness guard are untouched by `model.ts`'s vendored import,
as the plan predicted: the UI never names `model.ts` statically, so nothing on the front door's
critical path changed.

## The property test, measured

```
npx vitest run --project server src/lib/tune/surprise.spec.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  25.11s   (tests 24.67s)
```

| Number | Observed |
|---|---|
| Draws | **18,000** — 2,000 for each of the nine compiler-driven entries |
| Distinct states compiled and costed | **about 9,700** (9,711 on the recorded run; it varies with the draw) |
| Re-rolls across the whole run | **0** |
| Draws that did not fit | **0** |
| Wall time | **24.67 s** |

**The wall time crossed the plan's 20 s note and the draw count was NOT reduced.** 24.67 s of the
suite's 30 s is this one test. It is a real property run over the real pinned minifier, and the
memoisation below is the only saving taken:

**Costs are memoised by index vector.** Two draws with the same index vector are the same `PadState`,
the same compile and the same cost. Every one of the 18,000 draws is checked; every one of the ~9,700
distinct ones is measured. Without the memo the run is ~40 s and proves nothing extra.

**Zero re-rolls is the expected number and it is the finding, not the absence of one.** It reproduces
05-VALIDATION's unreachability result from a completely different direction: 18,000 random draws
across the nine cards, every single one inside 908 on the first draw. The bound and the ladder
fallback are correct defensive code for a compiler that changes, and `surprise.spec.ts` test 4 is
what proves they work, because only an injected `fits` that always refuses can reach them.

## The over-budget reserve, measured

The plan named `{ setup: 400, timer: 0 }` on `tpad` and said the measurement wins if it disagrees.
**It disagrees, in a way that matters.**

```
tpad at its defaults          Setup 902 / 908, Timer 146 / 908, fits true
tpad + { setup: 20 }          Setup 922, free -14, fits false
                              fit() -> { fits: false, steps: 0, blocked: "sends" }
tpad + { setup: 400 }         Setup 1302, free -394, fits false
                              fit() -> { fits: false, steps: 0, blocked: "sends" }
```

`tpad` can never produce a **ladder** at any reserve. Its knobs all sit on `sends`, and the compiler
refuses to shed sends on principle — *"a fader bank quietly becoming three faders is the silent lie
this product exists to prevent"*. So the researcher's 400 reaches the over-budget block and never the
ladder branch, and tests 2, 3 and 4 would have been vacuous on it.

The reserve for the block was therefore chosen by the plan's own rule — *the smallest round reserve
that puts it over 908 with a margin of at least ten characters* — which is **20**, giving 922 and a
14-character overrun. And the ladder tests moved to the only pairing on this shelf that reaches both:

```
dial at its defaults          Setup 646 / 908, Timer 55 / 908, fits true
dial + { setup: 300 }         Setup 946, free -38, fits false
                              fit() -> { fits: true, steps: 4, resolved present }
                              steps[0] "Change the look from Swirl to Wave", saves { setup: 9, timer: 0 }
                              applying it: Setup 946 -> 937, Timer 55 -> 55
                              pinned to "look": 1 step, feature "touch", never "look"
```

`dial` carries a brightness knob whose sheet is `look`, and `look` is exactly the sheet all four
unpinned steps name — so test 4's pin is a real knob's sheet and one the compiler was going to trim,
which is what makes the assertion non-vacuous.

Two other pairings were measured and recorded for later waves: `ninepads + { setup: 400 }` (Setup
980, one step, *"Stop drawing the control on the pad"*, saves 271) and `joystick + { setup: 400 }`
(Setup 935, one step, saves 59). `aurora` does not go over at 400 at all.

## Negative checks — all three observed red, quoted

| # | Mutation | Observed |
|---|---|---|
| 1 | `surprise.ts`: accept the first draw whatever `fits` says (the re-roll removed) | `surprise.spec.ts` test 4 red: `AssertionError: the roll did not stop at its own bound: expected 1 to be 12` |
| 2 | `model.ts`: make the compile synchronous (the `setTimeout` dropped) | `model.spec.ts` test 2 red naming the number of settled views: `AssertionError: a measurement landed while the debounce window was still open: expected [ { entryId: 'aurora', …(3) }, …(1) ] to have a length of 1 but got 2` — and test 7 red as well: `the debounce was never armed: expected +0 to be 1` |
| 3 | `model.ts`: render an authored sentence instead of `steps[0].label` | `ladder.spec.ts` test 5 red naming BOTH strings: `Expected: "4 things were turned down to stay inside 908 characters, starting with change the look from Swirl to Wave."` / `Received: "4 things were turned down to stay inside 908 characters, starting with something was turned down."` |

**Negative check 2 exposed a weak test, and the test was strengthened rather than the check
weakened.** On first run the mutation left test 2 GREEN and only test 7 red. The reason is real:
`buildTuner` already carries a generation counter, so five synchronous compiles all land but only the
last is not superseded — the settled-view count stays at 2 either way. The debounce's actual claim is
*no measurement may land while the window is open*, and that had no assertion. One was added
(`await settle()` immediately after the five turns, asserting the settled count is still 1) and the
mutation then turns test 2 red exactly as the plan predicted, naming the number of settled views.

**Negative check 3 landed on test 5, not the plan's predicted test 2.** `ladder.spec.ts` test 2
exercises `copy.ladderLine` against `fitState` directly and never goes through `model.ts`, so a
mutation inside `model.ts` cannot reach it. The model-facing assertion lives in test 5, where the
emitted `LadderView`'s line, label and savings are checked against a plan the spec asks the compiler
for itself. Both strings are named in the failure, which is what the check was for.

## The acceptance scans, with their output

**`COMPILE_DEBOUNCE_MS` is 120, and 120 is a literal only in its initialiser.** A raw `grep -c "120"`
would be the wrong gate — the module's comment quotes the measured 1.1-4.0 ms timings — so the scan
strips comments first:

```
node scan-debounce.mjs
occurrences of 120 after comment-strip: 1
  line 111 :: export const COMPILE_DEBOUNCE_MS = 120;
the constant really is 120: true
references to COMPILE_DEBOUNCE_MS: 2
every 120 is the initialiser: true
```

**`model.ts` authors no sentence.** Comment-stripped, with every module specifier removed by the two
backslash-free capture patterns `src/lib/sim/lazy.spec.ts` already uses. The exclusion is required
rather than cosmetic and the excluded list is printed so it is visible rather than assumed:

```
node scan-literals.mjs
specifiers excluded (12):
  23 chars :: ../../vendor/botor/_pad
  26 chars :: ../../vendor/botor/pad-sim        <- the mandatory import, and 26 characters long
  10 chars :: ../catalog
  6 chars :: ../pad
  13 chars :: ../sim/engine
  6 chars :: ./copy
  11 chars :: ./knobs.lua
  14 chars :: ./knobs.preset
  7 chars :: ./state
  10 chars :: ./surprise
  6 chars :: ./view
  18 chars :: ../sim/lua-pad-sim
string literals longer than 24 characters: 1
  line 260 (thrown) :: no catalog entry with the id "${id}"
authored sentences: 0
```

**The over-budget sentence is read, never restated:**

```
grep -c "more characters than it has room for" src/lib/tune/ladder.spec.ts   ->   0
```

Both scans were run as throwaway `.mjs` files in the scratch directory and no scratch file was left
in the repository.

## What was built

### `src/lib/tune/model.ts` — the tuner (630 lines)

`buildTuner` resolves the entry through `byId`, picks `presetKnobs` or `luaKnobs`, and emits a first
`onview` in the **measuring** state immediately — before `padReady()` resolves, and before the first
engine is even built.

The two routes inside `set()`:

| Route | Preview | Compile |
|---|---|---|
| `padsim` | **immediate.** A fresh `PadSim` from the applied `PadState`, `onpreview` synchronously | debounced 120 ms: `compileState` -> `costOf` -> settled `onview` |
| `lua` | **debounced.** `await createEngine(entry, indices)` then `onpreview`; the previous engine paints for the whole await (D-06) | the same debounce, `measureLua` per rendered event |

The state machine is written once and shared: `measuring` until the first `costOf` lands and never
re-entered; `settled` when a measurement is current; `stale` from a `set()` until the debounce lands,
carrying the *same last-known numbers*; and `over` derived from the number itself in `view.ts`, which
is what makes "staleness never applies while over budget" true without a branch here.

`ladderFor()` is the one call site of `fitState`, guarded by `needsLadder` as its last statement.
`fit()` proposes and never applies: the preview always shows exactly the state the knobs describe,
and the only thing that installs a ladder-resolved state is the visitor clicking `TURN IT DOWN` or an
exhausted `SURPRISE ME` roll.

For a Lua entry `onladder` and `onover` are never called **at all** — not called with `undefined`.
D-10: their whole knob cross-product was proven in budget at build time, there is no runtime ladder,
and reaching the callback with nothing would still be stating something.

`stamp()` returns `undefined` with a one-line TODO naming plan 05-05. No placeholder encoding was
invented.

### `src/lib/tune/surprise.ts` — the bounded re-roll (79 lines)

Pure and injectable: `rng` and `fits` are arguments. A draw that reproduces the state it replaced is
rejected **without reaching `fits`** and rolled again, so `SURPRISE ME` visibly does something and
costs no compile to discover it did not. Exhaustion is signalled by handing the previous indices back
unchanged; the ladder fallback is `model.ts`'s job, and both files say so.

### The three specs

- `src/lib/tune/model.spec.ts` — 7 tests over fake timers, including a `vi.resetModules()` cold graph
  for the measuring/preview ordering (the `ready.spec.ts` test 6 idiom) and a real Lua VM for the
  awaited-engine route
- `src/lib/tune/surprise.spec.ts` — 4 tests, 2,000 draws per compiler-driven entry
- `src/lib/tune/ladder.spec.ts` — 5 tests, a spec with no module beside it

## Deviations from Plan

### 1. [Rule 3 - Blocking] The task order was 02, 01, 03

**Found during:** Task 5-04-01, at the first import.
**Issue:** `model.ts` imports `surpriseIndices` from `./surprise`, so the plan's task 1 cannot compile
or be committed atomically before task 2 exists.
**Fix:** Executed the surprise task first. Both halves still got a genuine RED (`Cannot find module
'./surprise'` and `Cannot find module './model'` respectively, both observed and recorded before the
module was written), and each task is still one atomic commit.
**Files:** unchanged in content.
**Commits:** `edba984` (surprise), `a75ef3d` (model), `0a8fe10` (ladder).

### 2. [Rule 1 - Bug] Two `fitState` call sites, caught by the plan's own gate

**Found during:** Task 5-04-01, first green run.
**Issue:** The first draft called `fitState` twice — once in the debounced measurement and once in
`surprise()`'s ladder fallback. `model.spec.ts` test 5 went red: *"fit() compiles once per ladder
step; more than one call site is more than one ladder: expected [ …(2) ] to have a length of 1 but
got 2"*.
**Fix:** Extracted `ladderFor(state, cost)`, which guards on `needsLadder` as its last statement and
is the sole caller of `fitState`. Both paths now come through it, which is also the better design:
one place decides whether the N+1 minifier run happens.
**Files:** `src/lib/tune/model.ts`.
**Commit:** `a75ef3d`.

### 3. [Rule 2 - Missing critical assertion] `model.spec.ts` test 2 was not a debounce gate

**Found during:** Task 5-04-01, negative check 2.
**Issue:** With the debounce removed the test stayed green, because the generation counter already
collapses five concurrent compiles into one settled view. The test therefore asserted a property the
mutation did not break.
**Fix:** Added the assertion that actually names the debounce — after the five turns and a full
microtask flush, the settled count must still be 1, because *no measurement may land while the window
is open*. Re-ran the mutation and observed test 2 red, quoted above.
**Files:** `src/lib/tune/model.spec.ts`.
**Commit:** `a75ef3d`.

### 4. [Rule 1 - Measurement contradicts the plan] The over-budget reserve

**Found during:** Task 5-04-03 preparation (a throwaway probe spec, run and deleted before any file
in this plan was written).
**Issue:** The plan's `tpad` + `{ setup: 400, timer: 0 }` reaches the over-budget block but returns
`{ fits: false, steps: [], blocked: "sends" }` — no ladder, at any reserve. Tests 2, 3 and 4 would
have asserted over an empty step list.
**Fix:** Two measured reserves, both recorded above and both stated in the spec's header with the
arithmetic: `tpad` + `{ setup: 20 }` for test 1 (the plan's own "smallest round reserve with a
ten-character margin" rule), `dial` + `{ setup: 300 }` for tests 2-5. The plan authorised exactly
this: *"if the measurement disagrees, the measurement wins"*.
**Files:** `src/lib/tune/ladder.spec.ts`.
**Commit:** `0a8fe10`.

### 5. [Rule 3 - Blocking] One synchronous vendored measurement in `model.ts`

**Found during:** Task 5-04-01, writing `surprise()`.
**Issue:** The plan pins `surpriseIndices`'s `fits` parameter as **synchronous**, and every entry
point on `$lib/pad` is async because it awaits the FOUND-05 gate. There is no synchronous cost on
HANGAR's surface, so the specified signature cannot be satisfied through it.
**Fix:** `surprise()` awaits `padReady()` **first**, through `$lib/pad`, and only then calls the
vendored `compile`/`fits` synchronously inside one named helper, `fitsAfterGate`, whose name is its
precondition. The gate's invariant is untouched — nothing measures before the formatter is
initialised — and the alternatives were both worse: duplicating the bound in two files, or leaving
the re-roll as production dead code called with `() => true`. The module comment states all of this
in full. `src/lib/pad/index.ts`'s claim that nothing else imports the vendored measuring functions
directly is now one exception wide, and that exception is named and explained at both ends.
**Files:** `src/lib/tune/model.ts`.
**Commit:** `a75ef3d`.

### 6. [Rule 1 - Bug] `ladder.spec.ts`'s own source tripped its own forbid-scan

**Found during:** Task 5-04-03, first run of test 5.
**Issue:** The scan reads every file under `src/lib/tune/`, including itself, and its needle array
literally contained `lib/transport`, `lib/protocol` and `lib/device`.
**Fix:** The needles are assembled from fragments — `["lib", name].join("/")` — the
`forbidden-instructions.spec.ts` trick already used for the `.write(` needle in the same test, so the
file does not contain the thing it forbids. The scan still covers itself, which is what makes it a
rule rather than an exemption.
**Files:** `src/lib/tune/ladder.spec.ts`.
**Commit:** `0a8fe10`.

### 7. [Rule 3 - Blocking] `entryFor()` extracted for closure narrowing

**Found during:** Task 5-04-01, `npm run check`.
**Issue:** `const entry = byId(id); if (!entry) throw ...` did not keep its narrowing inside
`buildTuner`'s nested closures — seven `'entry' is possibly 'undefined'` errors from `svelte-check`.
**Fix:** A module-level `entryFor(id): CatalogEntry` that throws with the id in the message. Zero
errors afterwards.
**Files:** `src/lib/tune/model.ts`.
**Commit:** `a75ef3d`.

## Requirements

Nothing is marked complete. All five are **contributed** and stay open until the panel exists:
TUNE-02 and TUNE-03 need the meters rendered (waves 9-10), TUNE-04 and TUNE-05 need the ladder line,
the red meter and the disabled `TRY ON DEVICE` on screen and the `/dev/tune/` probe (wave 12), and
TUNE-07 needs the button. The model half of every one of them is now built and tested.

`requirements-contributed: [TUNE-02, TUNE-03, TUNE-04, TUNE-05, TUNE-07]`

## Notes for the next wave

- **05-05 (the stamp):** `Tuner.stamp()` is the seam and returns `undefined` today with a TODO naming
  that plan. `stateOf(indices)` inside `model.ts` is what a stamp must encode, and `resetAll(entry)`
  is deliberately what the defaults produce, so a link with no fragment and a link at every default
  index describe the same `PadState`.
- **05-09 / 05-10 (the components):** the tuner emits a `TuneView`, a `LadderView`, an
  `OverBudgetView` and a `SimEngine`, and never a `PadState`. A component never sees a vendored type.
  `OverBudgetView.apply()` is `TURN IT DOWN`; the live region uses `OverBudgetView.live` for the
  transition and `copy.liveBackInside` when `onover(undefined)` arrives.
- **05-12 (`/dev/tune/`):** pass `reserved: { setup: 300, timer: 0 }` and `entryId: "dial"` to
  `buildTuner` and the whole over-budget block plus a four-step ladder appears, with no fake entry and
  no injected cost literal. `tpad` + `{ setup: 20 }` is the block without a ladder, if a probe wants
  both shapes.
- **One corner is deliberately empty:** when `fit()` is `blocked` *and* no knob has moved, there is
  genuinely nothing to turn down. `OverBudgetView.backOff` is `""` and `apply()` is a no-op in that
  case, and the component must not render a control for it. `tpad` at any reserve is that corner.

## Self-Check: PASSED

Every file this SUMMARY names exists on disk, and every commit hash it quotes is in the log:

```
FOUND: src/lib/tune/model.ts
FOUND: src/lib/tune/model.spec.ts
FOUND: src/lib/tune/surprise.ts
FOUND: src/lib/tune/surprise.spec.ts
FOUND: src/lib/tune/ladder.spec.ts
FOUND: .planning/phases/05-tuning-budgets-and-shareable-links/05-04-SUMMARY.md
FOUND: edba984   feat(05-04): SURPRISE ME as a property with 18,000 draws behind it
FOUND: a75ef3d   feat(05-04): the tuner - an immediate preview and a debounced compile
FOUND: 0a8fe10   test(05-04): the TUNE-04 and TUNE-05 guards against a real over-budget measurement
```
