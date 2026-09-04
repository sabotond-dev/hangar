---
phase: 05-tuning-budgets-and-shareable-links
plan: 02
subsystem: ui
tags: [view-model, copy, accessibility, chunk-guard, safari, zero-imports]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-01's measured baseline (43 files / 567 tests) and the PREV_ arithmetic rule"
  - phase: 04-first-experience
    provides: "config-shape.spec.ts test 13, the front-door chunk guard this plan's module split exists to satisfy"
  - phase: 08-new-configurations
    provides: "the eight catalog entries whose knob values test 6 and test 7 derive their vocabulary from"
provides:
  - "src/lib/tune/view.ts - KnobKindName, KnobView, MeterView, TuneView, widgetFor, railSkin, meterView, percentOf, noteName, scaleWord, wordFor, hueName, swatchOf, swatchName, positionText, integerReadout and the five word tables, with ZERO imports"
  - "src/lib/tune/copy.ts - every string and string builder in the phase, with ZERO imports"
  - "src/lib/tune/idle.ts - onIdle(fn, env?) with a requestIdleCallback path, a Safari timer fallback and a cancel, with ZERO imports"
  - "EventWord / BudgetEvents - the already-capitalised event vocabulary the copy builders take, so copy.ts needs no type import"
affects: [05-03, 05-04, 05-05, 05-09, 05-10, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A module a Svelte component may name carries zero imports; the facts it restates are held against the vendor by its spec (the protocol-pin.ts / front-door.ts pattern), and the spec imports the vendor freely"
    - "A copy spec walks `import * as copy` and requires one declared sample input per builder, so a sentence added later cannot escape the mechanical copy rules"

key-files:
  created:
    - src/lib/tune/view.ts
    - src/lib/tune/view.spec.ts
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/tune/idle.ts
    - src/lib/tune/idle.spec.ts
  modified: []

key-decisions:
  - "backOffLadder does NOT lower-case the compiler's label: the contract's placeholder there is {Label}, the label opens the sentence, and the copy rule qualifies lower-casing with 'where they sit inside another sentence'. lowerFirst is exported and used by ladderLine only."
  - "MeterView's `over` and `state` are DERIVED from the number, so meterView takes a three-value MeterFeed and never an 'over' the caller could get wrong; over outranks stale, and a meter that has never measured is not over anything"
  - "TUNING_CAPTION moves into copy.ts and is pinned against ChosenPanel.svelte's surviving local const by copy.spec.ts test 1, so the duplicate that exists until wave 9 cannot drift"
  - "hueName buckets by Math.round(hue / 30), which is what makes all five shipped swatch values land on the words the accessibility contract names"

requirements-completed: []
requirements-contributed: [TUNE-01, TUNE-03, TUNE-04, TUNE-05, SHARE-02, SHARE-03, DEGR-01]

# Metrics
duration: 18 min
completed: 2026-09-04
---

# Phase 5 Plan 02: The Zero-Import View Seam, the Copy Module and the Idle Shim Summary

**Three modules under `src/lib/tune/` that a Svelte component can name without dragging the 131 KB protocol chunk onto first paint: the total twelve-kind-to-three-widget rule with the meter arithmetic, every sentence the phase can say transcribed verbatim from the approved contract, and a prefetch shim with a path that works on Safari — 17 tests, three negative checks observed red.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-09-04T11:53:00Z
- **Completed:** 2026-09-04T12:11:00Z
- **Tasks:** 3
- **Files created:** 6

---

## Observed totals — baseline plus delta

`05-01-SUMMARY.md` recorded `BASE_FILES = 43`, `BASE_TESTS = 567`, sweep `1 / 9`, e2e `23`. The quick
suite was **re-measured before any file in this plan was touched** and matched:

```
npm run test:quick          (re-measured, clean tree at 211ae8f)
 Test Files  43 passed (43)
      Tests  567 passed | 1 todo (568)
   Duration  4.42s
```

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 43 files / 567 tests (1 todo) | **46 files / 584 tests (1 todo)** | **+3 files / +17 tests** |
| `test:sweep` | 1 file / 9 tests | **1 file / 9 tests** | unchanged |
| `test:e2e` | 23 passed | **23 passed** (not re-run — no e2e file touched) | unchanged |
| `check` | 456 files, 0 errors | **462 files, 0 errors** | +6 files, still 0 errors |

Verbatim, through `scripts/check-counts.mjs`:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 46 584
check-counts: observed 46 files, 584 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9
check-counts: observed 1 files, 9 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts
```

Matches 05-VALIDATION's expected delta row for 05-02 (`+3 / +17 / 1 file 9 / unchanged`) exactly.
The `check` figure is recorded for provenance and asserted nowhere; the gate is `0 ERRORS`:

```
npm run check 2>&1 | grep -Ei "0 errors"
1788516329429 COMPLETED 462 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint   ->   exit 0 ("All matched files use Prettier code style!")
```

Per-file, exactly as the plan's three `<verify>` blocks ask:

```
npx vitest run --project server src/lib/tune/view.spec.ts   ->   8 passed (8)
npx vitest run --project server src/lib/tune/copy.spec.ts   ->   6 passed (6)
npx vitest run --project server src/lib/tune/idle.spec.ts   ->   3 passed (3)
```

The guard this plan exists to satisfy in advance, unchanged:

```
npx vitest run --project server src/lib/config-shape.spec.ts   ->   14 passed (14)
```

---

## Accomplishments

- **Three modules with zero imports**, each proven by its own spec over the comment-stripped source.
  A raw `grep -n import` over the three files returns twelve hits and **every one is inside a
  comment** — which is precisely why the house stripper is copied rather than re-invented.
- **`widgetFor` is total.** Twelve kinds, three widgets, and every fall-through the UI spec names:
  a `colour` whose values are not RGB, a channel outside 0..255, an unlisted semitone set, a `note`
  with nine options and a `direction` with no word all render as a rail. The loop that proves it
  asserts it ran twelve times.
- **The budget is the compiler's.** `EVENT_BUDGET = 908` in `view.ts` is asserted equal to the
  vendored `EVENT_BUDGET`, and the percentage floors at or below the limit and ceils above it, so
  907/908/909/941 read 99/100/101/104 and `100%` can only mean *exactly at the limit*.
- **The vocabulary is held, not copied.** Two `Exclude` assertions pin `KnobKindName` against the
  vendored `KnobKind` in both directions, a third pins `SCALE_WORDS`' keys against `ScaleKind`, and
  the eleven semitone sets are derived from `CATALOG` rather than restated — so a ninth entry with a
  new scale turns the spec red instead of silently rendering as a rail.
- **Every row of the Copywriting Contract has an export** (table below), each asserted
  character-for-character, with the U+2019 apostrophes, the U+2026 ellipsis and the U+2014 em dash
  intact.
- **The Safari path is a case node can enter**, because the whole browser environment is injected in
  the `sim/host.ts` `defaultDeps()` shape.
- **Three negative checks observed red** and quoted below.

## Task Commits

1. **Task 5-02-01: view.ts** — `8b8cee4` (test, RED) → `c3a1c2f` (feat, GREEN)
2. **Task 5-02-02: copy.ts** — `97fc5d0` (test, RED) → `512f636` (feat, GREEN)
3. **Task 5-02-03: idle.ts** — `9d9fc8f` (test, RED) → `1f8d96f` (feat, GREEN)

No refactor commit was needed for any of the three.

## Files Created

| File | Lines | What it carries |
|---|---|---|
| `src/lib/tune/view.ts` | 460 | The twelve kinds, three widgets, two rail skins, the five word tables, the note and hue vocabularies, `EVENT_BUDGET`, `percentOf`, `meterView`, and the readouts |
| `src/lib/tune/view.spec.ts` | 295 | 8 tests, plus three module-scope type assertions against the vendored `KnobKind` and `ScaleKind` |
| `src/lib/tune/copy.ts` | 293 | Every string and builder in the phase |
| `src/lib/tune/copy.spec.ts` | 313 | 6 tests, plus the `SAMPLES` table that forces every future builder through the copy rules |
| `src/lib/tune/idle.ts` | 113 | `onIdle`, `IdleEnv`, `IDLE_TIMEOUT_MS`, `FALLBACK_DELAY_MS` |
| `src/lib/tune/idle.spec.ts` | 144 | 3 tests over a `chromium()` and a `webkit()` fake environment |

## The Copywriting Contract, row by row

Every row of 05-UI-SPEC § *Copywriting Contract*, mapped to its export. A row with no export would be
a defect; there are none.

| Contract row | Export in `copy.ts` |
|---|---|
| Region caption | `TUNING_CAPTION` (Phase 4's, pinned against `ChosenPanel.svelte`) |
| Meter captions | `SETUP_CAPTION`, `TIMER_CAPTION` |
| Meter numerals | `meterNumerals(used)` |
| Meter percentage | `meterPercent(pct)` |
| Meter, first measurement pending | `MEASURING` |
| Meter, hidden expansion | `meterExpansion(event, used, pct)` |
| Meter, hidden expansion when the event is empty | `emptyTimerExpansion()` |
| Meters cannot be measured at all | `METERS_UNAVAILABLE` |
| Randomise CTA | `SURPRISE_ME` |
| Reset CTA | `RESET_ALL` |
| Entry with no knobs | `EMPTY_RACK` |
| Fit ladder, one step | `ladderLine(1, label)` |
| Fit ladder, several steps | `ladderLine(n, label)` |
| Over budget, one event, a knob caused it | `overBudgetKnob(knobLabel, event, by)` |
| Over budget, both events, a knob caused it | `overBudgetKnobBoth(knobLabel, setupBy, timerBy)` |
| Over budget, no knob moved | `overBudgetArrived(event, by)` |
| Over budget, both events, no knob moved | `overBudgetArrivedBoth(setupBy, timerBy)` |
| Back-off CTA | `TURN_IT_DOWN` |
| Back-off explanation, knob case | `backOffKnob(knobLabel, event, at)` |
| Back-off explanation, ladder case | `backOffLadder(label, event, at)` |
| `TRY ON DEVICE` reason while over budget | `tryOnBudgetReason(events)` |
| Share CTA | `COPY_LINK` |
| Share CTA, confirmed | `LINK_COPIED` |
| Share quiet line | `SHARE_QUIET_LINE` |
| Share fallback line | `SHARE_FALLBACK_LINE` |
| Share fallback field name | `SHARE_FALLBACK_FIELD_NAME` |
| Stamp landed, knobs restored | `STAMP_RESTORED` |
| Stamp from an older version | `stampOlder(name)` |
| Stamp unreadable | `stampUnreadable(name)` |
| Live region — over budget, a knob caused it | `liveOverBudget(event, by, knobLabel)` |
| Live region — over budget, no knob moved | `liveOverBudget(event, by)` |
| Live region — back inside | `liveBackInside(event)` |
| Live region — randomised | `liveRandomised(n, setup, timer)` |
| Live region — reset, landing in budget | `liveReset(setup, timer)` |
| Live region — reset, over budget on one event | `liveResetOver(event, by)` |
| Live region — reset, over budget on both events | `liveResetOverBoth(setupBy, timerBy)` |
| Live region — copied | `LINK_COPIED_ANNOUNCEMENT` |
| OG image alt | `ogAlt(name)` |
| Destructive confirmations — **None** | `DESTRUCTIVE_CONFIRMATIONS` (an empty `readonly string[]`, asserted empty) |

The contract's four closing bullets are encoded rather than quoted: the lower-casing rule as
`lowerFirst`, the `TURN IT DOWN` / `PUT IT BACK` rule as a comment on the const plus test 5, the
"never a raw Lua literal" rule as `view.ts`'s readouts, and the "one utterance, never two" rule as
the two combined reset builders.

## The three negative checks, observed

### 1. `view.spec.ts` — `EVENT_BUDGET` set to `900` in `view.ts`

Red, naming both numbers:

```
FAIL  |server| src/lib/tune/view.spec.ts > the tuning view seam (src/lib/tune/view.ts) > carries the vendored EVENT_BUDGET, and reports it as the meter's limit
AssertionError: view.ts's budget literal has drifted from the vendored compiler's: expected 900 to be 908 // Object.is equality

- Expected
+ Received

- 908
+ 900

 Test Files  1 failed (1)
      Tests  2 failed | 6 passed (8)
```

Test 5 goes red with it, in the arithmetic's own voice — `expected 78 to be 77` on `percentOf(702)`,
which is the meter reading a different denominator. Restored, green: `Tests  8 passed (8)`.

### 2. `copy.spec.ts` — one `’` replaced with a straight `'`

Red, naming the string:

```
FAIL  |server| src/lib/tune/copy.spec.ts > the tuning panel's copy (src/lib/tune/copy.ts) > obeys the copy rules mechanically, over every string and every builder's output
AssertionError: stampUnreadable carries a straight apostrophe: expected 'That link\'s knob settings could not …' not to contain '\''

Expected: "'"
Received: "That link's knob settings could not be read, so this is EUCLID at its defaults."

 Test Files  1 failed (1)
      Tests  2 failed | 4 passed (6)
```

Test 6 goes red with it, character-for-character. Restored, green: `Tests  6 passed (6)`.

### 3. `idle.spec.ts` — the `setTimeout` branch deleted from `onIdle`

Red on the Safari path:

```
FAIL  |server| src/lib/tune/idle.spec.ts > the formatter prefetch shim (src/lib/tune/idle.ts) > falls back to a short timer on a browser with no idea what idle means
AssertionError: expected [] to deeply equal [ 200 ]

- Expected
+ Received

- [
-   200,
- ]
+ []
```

Test 3 goes red with it (`expected [ undefined ] to deeply equal [ 42 ]` — nothing was scheduled, so
nothing could be cleared). Restored, green: `Tests  3 passed (3)`.

## The forbid-scan (throwaway `.mjs`, scratch directory, not left in the repo)

Comment-stripped, over the three modules:

```
src/lib/tune/view.ts     lines:  396 no import, no specifier, no require
src/lib/tune/copy.ts     lines:  241 no import, no specifier, no require
src/lib/tune/idle.ts     lines:   88 no import, no specifier, no require
offenders: 0
```

Self-tested by pointing the same scan at `view.spec.ts`, which correctly reports every needle, so the
empty result above is a real negative rather than a broken matcher:

```
src/lib/tune/view.spec.ts lines:  290 OFFENDS: from " from ' import( require( import
offenders: 5
```

A raw `grep -n import` over the three modules returns twelve hits, all inside comments explaining why
the imports are absent — the reason the stripper exists.

## Acceptance criteria, checked

**Task 5-02-01**

- `npx vitest run --project server src/lib/tune/view.spec.ts` → `8 passed (8)` ✓
- `view.ts` imports nothing — test 8 asserts `from "`, `from '`, `import(` and `require(` are all
  absent over the comment-stripped source; scan output quoted above ✓
- Every one of the twelve kinds returns a widget; the loop's non-vacuity assertion
  (`expect(seen).toBe(12)`) is in test 2 ✓
- The `EVENT_BUDGET` negative check observed red and quoted ✓
- `npm run check 2>&1 | grep -Ei "0 errors"` matched; `npm run lint` exit 0 ✓

**Task 5-02-02**

- `npx vitest run --project server src/lib/tune/copy.spec.ts` → `6 passed (6)` ✓
- Every contract row has an export — the table above ✓
- Test 2 is non-vacuous: it asserts at least 25 strings were examined (it examines **38** — 16
  constants and 22 builders) before asserting they are clean, and a builder with no declared sample
  input fails it by name ✓
- `copy.ts` imports nothing, asserted in test 6 ✓
- The apostrophe negative check observed red and quoted ✓
- `npm run check` 0 errors; `npm run lint` exit 0 ✓

**Task 5-02-03**

- `npx vitest run --project server src/lib/tune/idle.spec.ts` → `3 passed (3)` ✓
- `idle.ts` imports nothing, asserted in test 3 ✓
- `grep -c "IDLE_TIMEOUT_MS" src/lib/tune/idle.ts` → `2`; `grep -c "FALLBACK_DELAY_MS" …` → `2` ✓
- The negative check observed red and quoted ✓
- `test:quick` `46 584` and `test:sweep` `1 9` both matched ✓
- `npm run check` 0 errors; `npm run lint` exit 0 ✓

**Plan-wide**

- `git diff --quiet HEAD -- src/vendor` → exit 0 (the vendored tree is byte-identical) ✓
- `git status --short` → empty; no scratch file was written inside the repository ✓

## Decisions Made

1. **`backOffLadder` does not lower-case the compiler's label.** The plan's prose says `lowerFirst`
   is used by both `ladderLine` and `backOffLadder`. The binding design contract disagrees, in two
   places at once: the Copywriting Contract writes that row as `{Label}. Puts {Setup|Timer} at {n} of
   908.` with a capital placeholder, where both ladder rows use `{label}`; and the copy rule qualifies
   itself — "lower-cased at the first character **where they sit inside another sentence**". In this
   sentence the label is not inside another sentence, it *is* the first sentence. Lower-casing it
   would ship `stop drawing the control on the pad. Puts Setup at 702 of 908.` See the deviation
   below.
2. **`meterView` cannot be told the meter is over budget.** Its third parameter is a `MeterFeed`
   (`measuring | settled | stale`) and `over` / `state` are derived from the number. That makes three
   contract rules unforgeable rather than remembered: over outranks stale (the UI spec's "staleness
   never applies while over budget — dimming a warning is wrong"), a meter that has never measured is
   not over anything however large the placeholder it holds, and the limit is always the vendored 908.
3. **`copy.ts` takes already-capitalised event words** (`EventWord = "Setup" | "Timer"`) rather than
   `view.ts`'s lower-case `MeterEvent`. `copy.ts` may not import `view.ts` — the acceptance criterion
   is *zero* imports, not *no vendor* imports — and a private lower-to-upper mapping duplicated inside
   the copy module would be a second vocabulary to keep in step. The contract's placeholder is
   literally `{Setup|Timer}`, so this is what it says.
4. **`TUNING_CAPTION` moves into `copy.ts` and is pinned rather than left duplicated.**
   `ChosenPanel.svelte` still declares its own const until wave 9 rebuilds the region's contents.
   Test 1 reads that component's source and asserts it contains the same quoted literal, so the two
   copies cannot drift in the meantime.
5. **`IdleEnv.clearTimeout` keeps the plan's `(handle: never) => void`.** It looks like a typo and it
   is not: `never` is the only parameter type both a browser's `clearTimeout(number)` and node's
   `clearTimeout(Timeout)` are assignable to, because parameters are contravariant. The call site
   casts it back exactly once, with the handle its own `setTimeout` produced — the only handle it can
   ever be given. The comment on the type says so.
6. **`onIdle`'s cancel guards the callback, not only the handle.** A request already in flight can
   still fire after `cancelIdleCallback`, and a 628 KB prefetch that starts after the panel closed is
   work nobody asked for. Test 3 fires the queued callback after cancelling on both paths and asserts
   the prefetch did not run.

## Deviations from Plan

### 1. [Rule 1 - Bug] `backOffLadder` does not use `lowerFirst`, against the plan's prose

- **Found during:** Task 5-02-02, transcribing the Copywriting Contract
- **Issue:** The plan says "The lower-casing helper … is used by both `ladderLine` and
  `backOffLadder`". The UI spec — which the same plan declares binding and instructs me to cite by
  section — writes that row's placeholder as `{Label}`, capitalised, and qualifies the lower-casing
  rule with "where they sit inside another sentence". Following the plan's prose would have shipped a
  sentence opening with a lower-case letter.
- **Fix:** `lowerFirst` is exported and used by `ladderLine` only. `backOffLadder` interpolates the
  label as given, with a comment on the function recording why, and `copy.spec.ts` test 5 asserts the
  capital survives: `"Stop drawing the ZONA control on the pad. Puts Setup at 702 of 908."`
- **Files modified:** `src/lib/tune/copy.ts`, `src/lib/tune/copy.spec.ts`
- **Verification:** `6 passed`; the lower-casing itself is still proven by test 4, whose sample label
  carries a proper noun in its second word so a naive `toLowerCase()` fails.
- **Committed in:** `512f636`

### 2. [Rule 2 - Missing Critical] Four exports the plan's signature list did not name

- **Found during:** Tasks 5-02-01 and 5-02-02
- **Issue:** The plan's export lists open with "at minimum", and four things the phase's own contract
  requires had no home: the accessibility contract's positional readouts (`Position {i} of {n}` and
  `Cyan, 1 of 5`), the resolver `widgetFor` needs to decide whether a word row is even possible, the
  live region's copied announcement, and the contract's `Destructive confirmations — None` row.
- **Fix:** `positionText`, `swatchName` and `wordFor` in `view.ts`; `LINK_COPIED_ANNOUNCEMENT` and
  `DESTRUCTIVE_CONFIRMATIONS` in `copy.ts`. The last is an empty `readonly string[]` — the row's copy
  is "None", and an empty list asserted empty is the honest encoding of a row that ships no string.
- **Files modified:** `src/lib/tune/view.ts`, `src/lib/tune/copy.ts` and both specs
- **Verification:** asserted in `view.spec.ts` test 7 and `copy.spec.ts` test 6.
- **Committed in:** `c3a1c2f`, `512f636`

### 3. [Rule 2 - Missing Critical] The copy spec forces future builders through the rules

- **Found during:** Task 5-02-02
- **Issue:** The plan asks test 2 to run the rules over "every builder's output for one sample
  input". A hand-written list of calls would silently stop covering a builder added in wave 9.
- **Issue, second half:** a scan that examines nothing is indistinguishable from a scan that is
  broken.
- **Fix:** test 2 walks `import * as copy from "./copy"`, includes every string export directly, and
  calls every function export with a sample from a declared `SAMPLES` table — asserting the sample
  exists **by name** first. A builder added without a sample fails test 2 naming itself. The
  non-vacuity floor is 25; it currently examines 38.
- **Files modified:** `src/lib/tune/copy.spec.ts`
- **Verification:** `6 passed`, and the apostrophe mutation above proves the loop actually inspects
  the strings.
- **Committed in:** `512f636`

### 4. [Rule 2 - Missing Critical] The forbid-scan was self-tested before it was trusted

- **Found during:** the plan-wide verification
- **Issue:** the same defect 05-01 recorded — an empty offender list proves nothing until the scan is
  shown to be capable of reporting one.
- **Fix:** the scan was re-pointed at `view.spec.ts`, which correctly reports all five needles. Both
  outputs are quoted above.
- **Files modified:** none (throwaway script in the scratch directory)
- **Verification:** the two outputs in the forbid-scan section.
- **Committed in:** n/a

---

**Total deviations:** 4 (1 bug, 3 missing critical). One is a genuine conflict between the plan's
prose and the binding design contract, resolved in the contract's favour and flagged for the morning
list. **Impact on plan:** none on scope, files or counts. The delta is `+3 files / +17 tests`, as
planned.

## Issues Encountered

- **The plan-versus-contract conflict on `backOffLadder`** is the only judgement call in the plan and
  it is deviation 1. If the intended reading was the plan's, the fix is one call to `lowerFirst` and
  one assertion in test 5 — but the `{Label}` placeholder and the "inside another sentence" qualifier
  both point the other way, so this is what shipped.
- Nothing else. No auth gate, no architectural decision, no blocked task. The transient empty-pipe
  race 05-01 recorded did not recur.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for 05-03.** That plan reads `BASE_FILES = 46` and `BASE_TESTS = 584` (this plan's observed
  totals, per the `PREV_` rule) and asserts `+3 files / +15 tests`; the sweep stays `1 9`; the e2e
  total stays `23`.
- `view.ts`'s `KnobView` / `KnobValueView` are the shapes wave 3's knob builders fill, and
  `widgetFor` / `railSkin` / `integerReadout` / `swatchName` are the rules they call.
- `copy.ts` is complete for the whole phase — waves 4, 5, 9, 10 and 11 import from it and add no
  sentence of their own.
- `onIdle` is what wave 9's tuning panel calls to prefetch the formatter (D-08).
- **For the morning list:** the `backOffLadder` capitalisation, recorded above.

---
*Phase: 05-tuning-budgets-and-shareable-links*
*Completed: 2026-09-04*

## Self-Check: PASSED

All six created files exist on disk; all six task commits (`8b8cee4`, `c3a1c2f`, `97fc5d0`,
`512f636`, `9d9fc8f`, `1f8d96f`) are present in the history.
