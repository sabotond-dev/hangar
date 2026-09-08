---
phase: 10-redesign
plan: 09
subsystem: tune
tags:
  [
    tune-02,
    tune-04,
    share-01,
    x-01,
    w-03,
    knob-locks,
    budget-forecast,
    ghost-fill,
    u2212,
  ]

requires:
  - phase: 10-redesign
    plan: 08
    provides: PREV_FILES 78 / PREV_TESTS 801 / PREV_E2E 97 / BASE_CHECK 577 / PREV_SWEEP_WALL 119 s, the KnobView.positions window and knobPosition(), and the finding that the e2e web server dies under memory pressure
provides:
  - "T1 knob locks: a 44px both-axes HOLD/HELD toggle per row whose state is in the accessible name, a --color-line held marker as the second channel, surpriseIndices(knobs, previous, fits, rng, held), and a genuinely disabled SURPRISE ME with a 53-character reason when every knob is held"
  - "T2 the budget forecast: Tuner.forecast(knobId, position) publishing a ForecastView on onforecast, cost()-only through costFor(), memoised on the index vector, hit answers with no debounce and a miss on COMPILE_DEBOUNCE_MS"
  - "The ghost fill as three bands in one span and one token, transition: none, and the accent fill dropping its own 120 ms while a forecast shows"
  - "The fifth --font-mono use (4 -> 5) and the fifth permitted typographic character U+2212, scoped to forecastDelta and asserted to appear exactly once in the code of src/"
  - "PREV_FILES 78, PREV_TESTS 804, PREV_E2E 97, BASE_CHECK 577, PREV_SWEEP_WALL 119 s (carried, not re-measured) - the carry-forward block for 10-10 onward"
affects: [10-10, 10-11, 10-13, 10-14, tune, ui]

tech-stack:
  added: []
  patterns:
    - "A SECOND CHANNEL INSTEAD OF A NINTH COLOUR. A held knob changes the WORD on its toggle and the SHAPE and PLACE of its default marker. Two non-colour channels, and the accent census is 14 before and 14 after"
    - "TWO GATES THAT FAIL DIFFERENTLY. pointerType === 'touch' is the per-event answer and catches a touch on a hybrid device; @media (hover: hover) is the capability answer and stops the paint. Neither alone is the contract"
    - "A MEMO HIT IS NOT DEBOUNCED. A miss waits out the same COMPILE_DEBOUNCE_MS a recompile waits; a hit publishes on a microtask, which is what keeps a re-hovered ghost off the pointer's heels without a second timing constant"
    - "THE FORECAST IS READ AND DROPPED. `held` is a parameter of surprise() and never a field of the tuner, so there is no third argument for a lock to travel to encodeFor in - ephemerality is structural rather than promised"
    - "$derived.by WHEN A RUNE READS ANOTHER RUNE'S STATE. A $derived initialiser is an expression in the module body, so TypeScript's flow analysis narrows a `$state(undefined)` sibling to `never`. A closure defers the read"

key-files:
  created: []
  modified:
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/tune/surprise.ts
    - src/lib/tune/surprise.spec.ts
    - src/lib/ui/BudgetMeter.svelte
    - src/lib/ui/Knob.svelte
    - src/lib/ui/KnobRack.svelte
    - src/lib/ui/TuningRegion.svelte
    - src/lib/ui/tune-ui.spec.ts
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The lock's column turned the knob row into a grid, and a grid track's automatic minimum size is min-content - so the swatch row refused to wrap and pushed the rack 22px wider than its container on the phone project. Every flexible track is minmax(0, 1fr), and the measurement is written beside the rule"
  - "The forecast is offered on option rows only. A rail is one range input over painted dots; its focus is the CURRENT value, not a candidate, and a pointer-to-detent mapping written by hand would be a second unverified copy of the platform's own hit-testing. 10-10's picker is that mapping, written once for a control that needs it"
  - "The ghost is three bands rather than two branches: the accent fill ends at min(current, forecast), the ghost covers [min, max] in --color-line-soft over the track's own --color-line-soft (0.36 composite against 0.2), and the empty track follows. Forecast above reads as the extra; forecast below reads as a notch cut out of the fill, at the same alpha, because the fill really does stop short"
  - "One delta, and it names the event that moves further, ties to Setup. The contract gives one number and the rack has two meters, so the number answers 'what is the most this would cost' and the sentence beside it names which meter it belongs to"
  - "U+2212 is asserted over COMMENT-STRIPPED source. Nothing in a comment is shipped, and the paragraph beside MINUS has to be able to spell out what the glyph is - so the scope is a property of the code, with the two spec-side names written as \\u2212 escapes so the file does not defeat its own assertion"

requirements-completed: []

duration: 100min
completed: 2026-09-08
---

# Phase 10 Plan 09: Knob locks and the budget as a live forecast Summary

**A visitor can now hold a knob they like and re-roll everything else - the state in the word on the
toggle and in a `--color-line` bar rather than in a ninth colour - and hovering or focusing any knob
option says what that choice would cost before it is made, as a ghost band in both meters and a
signed `--font-mono` delta beside the option. `cost()` only, never `fit()`, memoised on the index
vector, never on touch, never animated. The accent census is 14 before and 14 after, `--color-over`
is still exactly three uses, `--font-mono` goes 4 to 5 with its justification beside it, and U+2212
appears exactly once in the code of `src/`. 78 files / 804 tests (+0 / +3), 97 e2e (+0), check 577
(+0). Task 1's code arrived UNCOMMITTED from an interrupted session and was reconciled against the
gates rather than trusted; one real regression was found in it and fixed forward.**

## Performance

- **Duration:** ~100 min, of which the first ~15 were reconciling an interrupted session's
  uncommitted 545 lines against the plan and the gates
- **Completed:** 2026-09-08
- **Tasks:** 2 (three commits — the phone regression is its own step, because it was found by a
  gate the task's own verify block does not run)
- **Files created:** 0 · **Files modified:** 12 · **Files deleted:** 0

---

## WHAT THE INTERRUPTED SESSION HAD DONE, AND WHAT IT HAD NOT

HEAD was `256db24` and 10-09 had made no commits. Nine files carried 545 insertions. Read against
the plan, and then against the gates rather than against the diff:

| Plan item | State on arrival | Verdict |
| --------- | ---------------- | ------- |
| T1.1 the `HOLD`/`HELD` toggle | complete: `<button aria-pressed>`, 44px both axes, label changes | kept |
| T1.2 the second channel | complete: `markerAt` / `markerPercent`, `.home.bar` in `--color-line` | kept |
| T1.3 `surpriseIndices` takes the held set | complete, with `NONE_HELD` frozen and the bound untouched | kept |
| T1.4 the exhaustion | complete: `allHeld`, a real `disabled`, `SURPRISE_ALL_HELD` at 53 | kept |
| T1.5 the twelve-draw test | complete, and it drives the path it names | kept |
| T1.6 ephemerality | complete: byte-identical stamp asserted off a NON-default vector | kept |
| T1 negative check 1 | **not run** — no record, and the tree is the only copy | run here |
| T1 negative check 2 | **not run** | run here |
| T1 the accent census | **not taken** | taken here |
| **The phone rack** | **BROKEN, and nothing in the task's own verify block would have said so** | fixed forward |
| T2, all of it | **not started** — no forecast, no ghost, no delta, no U+2212 | written here |

**The tree was treated as a candidate and it did not survive intact.** `npm run check`, `npm run
lint` and `npm run test:quick` were all green on arrival, and `npx vitest run` over the task's own
three files passed 16 of 16. The regression was two gates further out: `npx playwright test
e2e/tuning.e2e.ts e2e/tuning-webkit.e2e.ts` failed **1 of 20** with

> `knob-rack has nothing to scroll to sideways: {"scrollWidth":267,"clientWidth":245}`

The lock had turned `.row` from `display: block` into a three-column grid, and a grid track's
automatic minimum size is its content's min-content width — so the options row refused to wrap and
pushed the rack 22px past its container at the 393px phone viewport. Every flexible track is now
`minmax(0, 1fr)`, in four places, with the measurement and the failing assertion written beside the
`.row` rule so the next reader does not simplify it back. **20 of 20 after.**

One counting correction to the plan's arithmetic, and it is in the plan's favour: 10-VALIDATION's
per-file table says `src/lib/tune/copy.spec.ts` is **5**. It is **6**, and was 6 at `256db24`. The
plan required only that it not move, and it did not.

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                       |
| ----------------- | ---------- | ---------- | -------------------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                            |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                            |
| `PREV_FILES`      | **78**     | **78**     | **+0** — no spec file created, none deleted                                |
| `PREV_TESTS`      | **801**    | **804**    | **+3**, and the split is the ruled one — see below                         |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **not re-run.** No sweep file imports anything this plan touched           |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                            |
| `PREV_SWEEP_WALL` | **119 s**  | **119 s**  | **carried, not re-measured** — stated rather than implied                  |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                            |
| `PREV_E2E`        | **97**     | **97**     | **+0** — 97 passed, exit 0, 2.1 min at `--workers 3`                       |
| `BASE_CHECK`      | **577**    | **577**    | **+0** — no file created. Always 0 / 0                                     |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                     |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                  |

`npm run check` prints one line:
`COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`npm run test:quick | node scripts/check-counts.mjs 78 804` →
*"observed 78 files, 804 tests passed, 1 todo … matches the expected counts"*.

**Why the sweep was not run, said plainly rather than left as a gap.** 10-VALIDATION requires a
sweep run for any wave that touches knobs, the stamp, the colour lattice or `src/vendor/`. This wave
touches none of them: `grep -l model $(find src -name "*.sweep.spec.ts")` returns one file and its
only hit is the word `model.ts` inside a comment at `reachability.sweep.spec.ts:185`. No sweep file
imports `model.ts`, `copy.ts`, `surprise.ts` or any component. Free memory at the end of the e2e run
was **0.65 GB**, inside the 0.8–1.7 GB band `docs/TESTING.md` records three timeouts in, so running
it anyway would have risked a timeout that proved nothing. `PREV_SWEEP_WALL` is therefore carried at
119 s and explicitly not re-measured.

---

## THE TEST SPLIT, AS IT ACTUALLY LANDED

The plan says one off-by-one closes the phase at the wrong total, so the split is stated per file
and per task rather than per plan.

| File | Task 1 | Task 2 | Before | After |
| ---- | ------ | ------ | ------ | ----- |
| `src/lib/tune/surprise.spec.ts` | **+1** | +0 | 4 | **5** |
| `src/lib/ui/tune-ui.spec.ts` | **+0** | **+2** | 5 | **7** |
| `src/lib/tune/copy.spec.ts` | +0 | +0 | 6 | **6** |
| `src/lib/tune/model.spec.ts` | +0 | +0 | 10 | **10** |
| **plan** | **+1** | **+2** | | **+3** |

`tune-ui.spec.ts` at **7** is what leaves 10-11's +2 landing it at **9** and the phase at
`BASE_TESTS + 40`.

The two tests authored in 10-09-02 are exactly the two the plan names:

1. *"SURPRISE ME is a real disabled button when every knob is held, and its reason is 53
   characters"*
2. *"the accent census over the seven tuning components is unmoved at fourteen"*

Everything else rode inside an existing test, and each rider is named where it landed:

| Assertion | Rode inside |
| --------- | ----------- |
| the `HOLD`/`HELD` label, the two 44px axes, the held marker | `tune-ui.spec.ts` test 2 (the 44px floor) |
| the `.delta` rule: mono, tabular, no accent, no `--color-over`, absolute | `tune-ui.spec.ts` test 2 |
| the two touch gates and `:focus-visible` | `tune-ui.spec.ts` test 2 |
| the ghost's `transition: none`, its token, and `.fill.forecasting` | `tune-ui.spec.ts` test 4 (the alarm red) |
| ChosenPanel's `min-block-size: 152px` non-movement | `tune-ui.spec.ts` test 6 (the arithmetic) |
| `HOLD` / `HELD` / `SURPRISE_ALL_HELD` character-for-character | `copy.spec.ts` test 1 |
| the whole forecast copy block and the U+2212 scope scan | `copy.spec.ts` test 4 (the meter strings) |
| the U+2212 per-string scope rule | `copy.spec.ts` test 2 (the mechanical rules) |
| the forecast's debounce, its memo, and "a forecast moves nothing" | `model.spec.ts` test 2 (the debounce) |
| the never-`fit()` scan at the function | `model.spec.ts` test 5 (the ladder's one door) |

---

## THE THREE CENSUSES, BEFORE AND AFTER

Taken by script over comment-stripped source, the same stripper `tune-ui.spec.ts` uses.

### 1. `--color-accent` over the seven tuning components — **14 → 14**

| Component | before | after |
| --------- | ------ | ----- |
| `BudgetMessage.svelte` | 2 | 2 |
| `BudgetMeter.svelte` | 1 | 1 |
| `CopyLink.svelte` | 1 | 1 |
| `Knob.svelte` | 9 | 9 |
| `KnobRack.svelte` | 0 | 0 |
| `StampNotice.svelte` | 0 | 0 |
| `TuningRegion.svelte` | 1 | 1 |
| **total** | **14** | **14** |

**The reserved list is still eight.** Three new painted things landed in these files this plan — a
lock, a held marker, a forecast delta — plus a ghost fill, and not one of them took the ninth
colour: the marker is `--color-line`, the delta is `--color-ink`, the ghost is `--color-line-soft`
and the lock is two rungs of the ink ladder. The census is now an assertion with all eight entries
quoted in its failure message, not a script.

### 2. `--color-over` — **3 uses → 3 uses**, and the fourth was not taken

Three numbers, because the same fact is counted three ways in three documents and conflating them is
how a census stops meaning anything:

| Counted as | before | after |
| ---------- | ------ | ----- |
| X-01's permitted **uses** | **3** | **3** |
| `var(--color-over)` **references** in code | 4 (`BudgetMessage` 1, `BudgetMeter` 3) | **4**, unchanged |
| carrier **components** | 2 | **2** |
| plus the token's own definition in `src/app.css` | 1 | 1 |

The over-budget forecast branch renders **no colour change at all**, and the reason is written in
`BudgetMeter.svelte` where a future reader will look for the fourth use and not find it: an option
that would cross 908 is already `disabled`, so an unaffordable forecast cannot be hovered. On
today's shelf neither branch is reachable — 10-08 measured 268 characters free on the dearest
colour-bearing preset — so it is a guard on a guard, which is exactly why it needed writing down
rather than relying on.

### 3. `--font-mono` — **4 uses → 5**

| File | before | after |
| ---- | ------ | ----- |
| `src/lib/ui/BudgetMeter.svelte` | 1 | 1 |
| `src/lib/ui/CopyLink.svelte` | 1 | 1 |
| `src/lib/ui/DeviceSlot.svelte` | 1 | 1 |
| `src/lib/ui/Knob.svelte` | 1 | **2** |
| **uses** | **4** | **5** |
| plus the stack's definition in `src/app.css` | 1 | 1 |

The fifth's justification is beside it in `Knob.svelte`, quoting W-03's own reason for introducing
the stack: *it is a number that changes as a pointer moves, and it must not jitter horizontally.*
`font-variant-numeric: tabular-nums` is on the same rule and is the other half of not jittering —
`+9` and `+10` must not shift the option under the pointer.

### 4. U+2212 — **0 → exactly 1**

`copy.spec.ts` walks every `.ts`, `.svelte`, `.css`, `.js`, `.json` and `.html` file under `src/`
except `src/vendor/`, strips comments and asserts the carrier list is exactly
`["src/lib/tune/copy.ts x1"]`, with a non-vacuity floor of more than 100 files walked. The two
places the spec must name the glyph are written `"\u2212"` and `"-"`, because a pasted one would be
the second occurrence and would make the assertion assert nothing.

---

## THE COUNTED STRINGS

| String | Text | Count |
| ------ | ---- | ----- |
| `KNOB_HOLD` | `HOLD` | **4** |
| `KNOB_HELD` | `HELD` | **4** |
| `SURPRISE_ALL_HELD` | `Every knob is held, so there is nothing left to roll.` | **53** |
| `forecastExpansion` template | `Choosing this would put Setup at {n} of 908.` | **44** |
| `forecastDelta` | `+6` · `−3` · `0` | 2 / 2 / 1 |

`HOLD` and `HELD` are the same length ON PURPOSE — toggling a lock must not reflow the row it ends —
and `copy.spec.ts` asserts both lengths and that the two words differ, so the state really is in the
accessible name. The 44 is counted at the template's placeholder length, and it is the same for
either event word because `Setup` and `Timer` are both five.

---

## THE TWELVE-DRAW EXHAUSTION, WITH ITS OBSERVED NUMBERS

The test drives `starfield`, holds two of its three knobs and leaves `edge` — a **two-option** knob —
free, with an rng that returns the position the knob already stands at.

| Observation | Asserted | Observed |
| ----------- | -------- | -------- |
| draws attempted | `SURPRISE_ROLL_LIMIT` = **12** | **12** |
| offered to `fits` | **0** | **0** — the no-op rejection is before the compile |
| result | `previous`, unchanged | unchanged |
| draws with EVERY knob held | **0** | **0** — a held knob never reaches the rng at all |
| stamp of a held rack vs an unheld one | byte-identical | identical, off a NON-default vector |

**This path was unreachable before locks existed and the test says so in its own comment.** Until T1
every roll drew every knob, so the no-op rejection at `surprise.ts`'s `if (!moved) continue` could
only fire when every knob independently redrew its own position — on starfield's 4,096 × 2 × 5
domain, roughly once in forty thousand draws, and never twelve times running in any run this
repository will ever make. Hold all but one and the domain collapses to that knob's own options.

**Ephemerality is structural, not promised.** `held` is a parameter of `surprise()` and is never
assigned to anything the tuner keeps; `payload` is `encodeFor(entry, indices)` and there is no third
argument for a lock to travel in. The stamp assertion is taken off a **non-default** vector on
purpose, because a rack at its defaults encodes to `undefined` and two `undefined`s would prove
nothing.

---

## THE FORECAST, AND WHICH GUARD CATCHES `fit()`

**`cost()` only, and the guard is the one that already existed.** `model.spec.ts` test 5 has
asserted since Phase 5 that `fitState(` has exactly **one** call site in `model.ts`, inside
`needsLadder`'s branch with no block closing between the guard and the call. A `fitState` added to
the forecast makes it two. This plan added a second, narrower assertion at the function rather than
at the file — `costFor`'s body contains no `fitState`, and does contain `costOf(` and
`measureLua(` — so a red run names the forecast rather than only the count.

Negative check 3 was run and **the file-level assertion is what caught it**, because it aborts the
test first. Recorded in full below, including the half that did not fire.

**Both routes measure what `land()` measures for the same vector**, so a forecast and the landing
that follows it cannot disagree: the compiler route through `compileState` + `costOf`, the Lua route
through `renderLua` + `measureLua`. Both deltas are taken against `costFor(indices)` rather than
against the published meter numbers, so a Lua entry's forecast is never a compiler measurement minus
a minifier one.

**The debounce is TUNE-02's, reused rather than duplicated.** A miss waits out
`COMPILE_DEBOUNCE_MS`; a **hit publishes on a microtask with no delay at all**, which is the
asymmetry that keeps the ghost off the pointer's heels for an option the visitor has already
hovered. `model.spec.ts` asserts all three: nothing published while the window was open, the
forecast after `advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS)`, and the re-hover answering
`toEqual` the first without the clock moving.

**A forecast moves nothing**, asserted: no view emitted, no ladder asked for, the knob exactly where
it was.

**The ghost is three bands in one span and one token**, and the direction is not a branch:

```
[0, min)     the accent fill, exactly as it always was
[min, max)   the ghost, --color-line-soft over the track's own --color-line-soft
             (0.36 composite against the track's 0.2)
[max, 100]   the empty track
```

Forecast above the current value: the ghost is the extra the choice would take. Forecast below: the
fill really does stop short and the ghost is the notch cut out of it, **at the same alpha**. One
element in both directions, so the two readings cannot drift apart. `transition: none` on the ghost
because 10-UI-SPEC §14 lists it at 0 ms deliberately, and `.fill.forecasting { transition: none }`
because while a forecast is showing the fill is tracking a pointer too rather than landing a
measurement.

**Never on touch, gated twice, and the two gates fail differently.** `event.pointerType === "touch"`
is the per-event answer and catches a touch on a hybrid device that reports `hover: hover`;
`@media (hover: hover)` is the capability answer and stops the paint. `:focus-visible` is the
keyboard half and is asked of the element itself (`target.matches(":focus-visible")`) rather than
guessed from the event, so a mouse click on a radio does not flash a delta beside an option the
visitor has just chosen anyway. Both halves are asserted by source scan; which half covers which is
written in the test.

**The hidden expansion is real text wired by `aria-describedby`**, present on every option from
first render so the description always has a target to resolve, and filled when that option is the
one being forecast. That is what makes the forecast not pointer-only information.

---

## THE FIVE NEGATIVE CHECKS

| # | Task | Perturbation | Gate | Result |
| - | ---- | ------------ | ---- | ------ |
| 1 | 01 | `surpriseIndices` draws held knobs anyway (`if (false)`) | `surprise.spec.ts` | **red** |
| 2 | 01 | the held marker painted `--color-accent` | the census script **and** `tune-ui.spec.ts` | **red, and the count moved** |
| 3 | 02 | the ghost fill animated | `tune-ui.spec.ts` | **red** |
| 4 | 02 | U+002D HYPHEN-MINUS in the delta | `copy.spec.ts` | **red, naming both codepoints — after a reorder** |
| 5 | 02 | `fit()` called from the forecast path | `model.spec.ts` | **red, and it says which guard** |

**1.** *"the roll did not attempt exactly one draw per roll on the one free knob: expected 3 to be
12"*. The rejected draw count is 3 because with the guard removed all three knobs are drawn every
roll. The deeper assertion — `noDraws` must be 0 with every knob held, which is the one that names
the held set — never ran, because the test aborts at the first failure. The same ordering asymmetry
10-08 recorded on `knobs.preset.spec.ts` and 10-07 on `sort.spec.ts`; it is recorded rather than
smoothed.

**2.** The census printed `Knob.svelte` **9 → 10** and the total **14 → 15**, and `tune-ui.spec.ts`
went red naming the rule: *".home.bar paints the held marker in accent: expected '\n
border-radius: 1px;\n backgr…' not to contain '--color-accent'"*.

**3.** *"the ghost animates - a ghost that eases in lags the pointer and reads as the real value:
expected '\n position: absolute;\n inset-…' to contain 'transition: none'"*.

**4. The first run of this check found a weakness in the test rather than in the code, and the test
was changed.** With `MINUS = "-"`, the equality assertion fired first and reported
*"expected '-3' to be '−3'"* — two glyphs a reader has to tell apart, which is exactly what U+2212
exists to prevent. The two character assertions were moved **above** the equalities and the check
re-run: *"the delta writes U+002D HYPHEN-MINUS instead of U+2212 MINUS SIGN: expected '-3' not to
contain '-'"*. The perturbation was reverted by its own inverse edit and `copy.ts` confirmed
byte-identical.

**5.** `await fitState(stateOf(at), { reserved: options.reserved })` inserted into `costFor`'s
compiler branch. **`model.spec.ts` test 5 caught it** — *"fit() compiles once per ladder step; more
than one call site is more than one ladder: expected [ …(2) ] to have a length of 1 but got 2"*.
**The debounce test did NOT blow its budget** (9 of 10 passed), so the source scan is the only guard
that fires and the plan's "say which caught it" is answered: the file-level single-call-site
assertion, with the new function-level one behind it as the narrower message.

Every perturbed file was restored by its own inverse edit and confirmed byte-identical with
`sha256sum` before and after:

| File | sha256, before and after |
| ---- | ------------------------ |
| `src/lib/ui/Knob.svelte` (check 2) | `d1b2d14c…` |
| `src/lib/tune/surprise.ts` (check 1) | `94c593e8…` |
| `src/lib/ui/BudgetMeter.svelte` (check 3) | `998de9bc…` |
| `src/lib/tune/copy.ts` (check 4) | `26669e55…` |
| `src/lib/tune/model.ts` (check 5) | `52510d01…` |

**No `git checkout`, `restore`, `stash` or `clean` was run at any point in this plan**, including to
restore a negative check — which mattered more than usual here, because until the first commit the
working tree was the only copy of 545 lines.

---

## Task Commits

1. **Task 10-09-01: `HOLD` / `HELD`, the held marker, and the twelve-draw exhaustion** — `5316436`
   (feat), 9 files.
2. **The phone regression the task's own gates could not see** — `5d3d2a6` (fix), 1 file. Its own
   commit because it was found by `tuning-webkit.e2e.ts` rather than by task 1's verify block, and
   burying it inside the feature would hide the measurement.
3. **Task 10-09-02: the forecast, the ghost fill, and the fifth mono use** — `46c3f19` (feat),
   9 files.

**Two commits that are not this plan's landed in the interval** and are recorded so the log reads
honestly: `cd267f9` and `bc3c21f`, both `docs(10)` and both touching only
`.planning/phases/10-redesign/10-CONTEXT.md`. Neither touches `src/`.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — Prettier and ESLint |
| `npm run test:quick \| node scripts/check-counts.mjs 78 804` | *"observed 78 files, 804 tests passed, 1 todo … matches"* |
| `surprise.spec.ts` / `tune-ui.spec.ts` / `copy.spec.ts` / `model.spec.ts` | **5** / **7** / **6** / **10** |
| `npm run build` | green, exit 0 |
| `npx playwright test --workers 3` | **97 passed, exit 0, 2.1 min** — `PREV_E2E` unchanged |
| `npx playwright test e2e/tuning*.e2e.ts` | 19/20 before the fix, **20/20** after |
| accent census, `--color-over`, `--font-mono`, U+2212 | 14 → 14, 3 → 3 uses, 4 → 5, 0 → exactly 1 |
| `grep -rn "overflow-x" KnobRack.svelte Knob.svelte ChosenPanel.svelte` | **empty** |
| `git diff --stat HEAD -- src/vendor/ ChosenPanel.svelte Coverflow.svelte` | **empty** |
| `npm run test:sweep` | **not run** — no sweep file imports anything this plan touched; see above |
| `git status --porcelain` | empty. `test-results/` removed by hand after every run |

**The e2e server was started by hand, as 10-08 said to.** `npx wrangler dev --port 4173 --ip
127.0.0.1` first, then `npx playwright test --workers 3`, which reuses it
(`reuseExistingServer: !CI`). 97 passed on the first attempt. **A second failure mode was found and
is worth the next plan knowing:** `npm run build` fails with
`EPERM … rm '\\?\C:\…\hangar\build'` while `wrangler dev` is holding `build/` open, and because the
build fails the e2e run then tests the STALE artefact and reproduces a bug that has already been
fixed. Stop wrangler, build, restart wrangler.

---

## Decisions Made

1. **The lock's grid needed `minmax(0, 1fr)`**, and the measurement rather than the reasoning is
   written beside the rule.
2. **The forecast is offered on option rows only.** A rail has no candidate element to hover and no
   keyboard candidate at all; 10-10's picker is the pointer-to-detent mapping it would need.
   Logged in `deferred-items.md` as item 4, with the kind counts that make it a real gap.
3. **The ghost is three bands in one span**, so the two directions cannot be painted differently by
   accident, and the "notch at the same alpha" is achieved by the fill genuinely stopping short.
4. **One delta, naming the event that moves further**, ties to Setup, with the sentence beside it
   saying which meter it belongs to.
5. **U+2212's scope is asserted over comment-stripped code**, and the spec names the glyph by
   escape so it cannot defeat its own assertion.
6. **`$derived.by` where a rune reads another rune's state**, because a `$derived` initialiser is a
   module-body expression and TypeScript narrows a `$state(undefined)` sibling to `never` inside it.
7. **The negative check that exposed a weak assertion changed the test, not the report.** Check 4's
   first run failed on a glyph comparison; the assertions were reordered so the failure names the
   two codepoints.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — bug] The lock's column made the knob rack scroll sideways on a phone**

- **Found during:** the reconciliation, `npx playwright test e2e/tuning.e2e.ts
  e2e/tuning-webkit.e2e.ts`
- **Issue:** `.row` became a three-column grid when the lock arrived, and a grid track's automatic
  minimum size is its content's min-content width — so the options row refused to wrap.
  **Measured: `knob-rack` scrollWidth 267 against clientWidth 245**, red in
  `tuning-webkit.e2e.ts:279`'s never-scrolls-sideways assertion, 1 of 20 failing. The tuning region
  forbids `overflow-x` outright, so this is a prohibition breach and not a cosmetic one.
- **Fix:** every flexible track in `Knob.svelte` is `minmax(0, 1fr)` — `.row`, `.row.stacked`, the
  `@container (width < 220px)` variant and `.control:not(.options)` — with the measurement and the
  failing assertion written beside the `.row` rule. **20 of 20 after.**
- **Files modified:** `src/lib/ui/Knob.svelte`
- **Committed in:** `5d3d2a6`

**2. [Rule 3 — blocking] `TuningRegion.svelte` and `KnobRack.svelte` are in neither task's file
list, and the feature cannot exist without them**

- **Found during:** the reconciliation (task 1) and task 2
- **Issue:** the plan lists `Knob.svelte`, `KnobRack.svelte`, `surprise.ts` and the specs for task 1
  and `Knob.svelte`, `BudgetMeter.svelte`, `model.ts` and the specs for task 2. But the held set is
  the REGION's — the tuner must never store it, or SHARE-01's ephemerality stops being structural —
  and `SURPRISE ME`, the reason line and the meters all live in the region. `model.ts` is listed
  only under task 2 while `surprise(held)` is task 1's.
- **Fix:** `TuningRegion.svelte` owns `heldKnobs` (a `SvelteSet`, because a plain `Set` in a rune is
  not deeply reactive), `allHeld`, the reason line, the forecast state and the meters' ghost;
  `KnobRack.svelte` passes both through by knob id. `model.ts`'s `surprise(held)` shipped in task
  1's commit where the behaviour it serves lives.
- **Files modified:** `src/lib/ui/TuningRegion.svelte`, `src/lib/ui/KnobRack.svelte`,
  `src/lib/tune/model.ts`
- **Committed in:** `5316436` and `46c3f19`

**3. [Rule 3 — blocking] TypeScript narrowed a `$state(undefined)` to `never` inside a sibling
`$derived`**

- **Found during:** task 2, `npm run check`
- **Issue:** **eight** `TS2339`s — *"Property 'timerDelta' does not exist on type 'never'"* and
  seven more. A `$derived` initialiser is an expression in the module body, so flow analysis knows
  `forecast` was assigned `undefined` on the line above and narrows every later branch of a
  `forecast !== undefined` test to `never`. The existing runes in this file dodge it with optional
  chaining and never noticed.
- **Fix:** `$derived.by` for both derivations, with the reason written beside them, because a
  closure defers the read and the declared type survives. Not a style choice, and it is documented
  as such so it is not "simplified" back.
- **Files modified:** `src/lib/ui/TuningRegion.svelte`
- **Committed in:** `46c3f19`

**4. [Rule 1 — bug] An assertion message in the inherited work described a different assertion**

- **Found during:** the reconciliation, reading `copy.spec.ts`'s diff
- **Issue:** `expect(KNOB_HOLD, "the two labels are the same width").not.toBe(KNOB_HELD)` — the
  message claims a width equality; the assertion is that the two words differ. The width equality
  is asserted two lines above by character count. A message that describes the wrong assertion is
  worse than none, because it is what a future reader debugs against.
- **Fix:** the message now says what the assertion checks: *"the two labels are the same word, so
  the state of the lock is not in its accessible name"*.
- **Files modified:** `src/lib/tune/copy.spec.ts`
- **Committed in:** `5316436`

**5. [Rule 2 — missing critical functionality] The forecast memo was unbounded and its timer
outlived `destroy()`**

- **Found during:** task 2, writing `costFor`
- **Issue:** a `Map` keyed on the index vector grows with every distinct option a visitor hovers,
  and the forecast's `setTimeout` is the second timer this module owns — `destroy()` cleared only
  the first, so a panel torn down inside the debounce window would fire a compile into a destroyed
  tuner.
- **Fix:** `FORECAST_MEMO_MAX = 512` with a clear-on-overflow (an LRU here would be more code than
  the thing it protects, and the reason is written down), plus `forecastPending` cleared and
  `forecastAsk` dropped in `destroy()`.
- **Files modified:** `src/lib/tune/model.ts`
- **Committed in:** `46c3f19`

### Departures from the plan's letter, stated rather than smoothed

**6. The forecast is offered on option rows only — word rows and swatch rows, never rails.** T2 says
"any knob option". A rail is one `<input type="range">` over painted dots or a detent track: its
focus is the CURRENT value rather than a candidate, and hovering a candidate needs a
pointer-position-to-detent mapping written by hand, which would be a second unverified copy of the
platform's own hit-testing. Of the twelve `KnobKindName`s, one is a swatch row, six are word kinds
that become a word row only when their table covers every value, and five — `speed`, `size`,
`count`, `feel`, `amount` — are rails unconditionally, so this is a real gap. It is logged as
`deferred-items.md` item 4 for 10-10, whose three-sixteen-detent picker IS that mapping.

**7. The delta is beside the option, not in the meters' 14px line box.** The plan says both things:
T2's contract table says *"a signed delta beside the hovered option"*, and item 7 says *"the delta
inside the existing 14px line box"*. The contract table won. What item 7 is protecting — the meters
block at 56px and the region at 152px — is preserved by making the delta `position: absolute` inside
its option so it takes part in no layout at all, and **both numbers are asserted unmoved** rather
than assumed.

**8. One delta names the event that moves further, ties to Setup.** The contract gives one number,
the rack has two meters and both draw their own ghost. Averaging two budgets that are not
interchangeable would be an invention; the largest absolute delta answers "what is the most this
would cost me", and the sentence beside it names the event so the number is never ambiguous.

**9. 10-VALIDATION's per-file table has `src/lib/tune/copy.spec.ts` at 5; it is 6.** It was 6 at
`256db24`, before this plan touched anything. The plan required only that it not move, and it did
not. Recorded so 10-14's reconciliation re-derives from the files rather than from the table.

**10. `model.spec.ts` is in neither task's file list.** Its two riders — the forecast's debounce and
memo behaviour, and the never-`fit()` scan at the function — are inside existing tests and the file
stays at **10**. It is the module's own spec and the natural home for both.

**11. `REQUIREMENTS.md` is not edited.** `TUNE-02` and `TUNE-04` are both already `[x]` from Phase
5, with `TUNE-04` carrying a recorded note that it is a guard that is unreachable in practice. This
plan extends both rather than completing them, so `requirements-completed` is empty and nothing was
re-marked.

---

**Total deviations:** 5 auto-fixed — 2 × Rule 1 (bug), 1 × Rule 2 (missing critical functionality),
2 × Rule 3 (blocking) — plus six stated departures.
**Impact on plan:** three files outside the plan's lists (`TuningRegion.svelte`, `KnobRack.svelte`,
`model.spec.ts`) plus `deferred-items.md`, every one of them forced by a measured breakage or by
where the state honestly has to live. Nothing in the objective was dropped except the rail forecast,
which is named, counted and assigned.

---

## Issues Encountered

**`npm run build` fails while `wrangler dev` holds `build/` open, and the failure is quiet in the
worst way.** `EPERM … rm '\\?\C:\…\hangar\build'` from `adapter-static`'s rimraf. The e2e run that
follows then tests the previous artefact and reproduces a bug that has already been fixed — which
cost one full cycle here. Stop wrangler, build, restart wrangler. Worth `docs/TESTING.md` at 10-14
beside the memory-pressure note.

**Free memory ended at 0.65 GB**, below the band `docs/TESTING.md` records three sweep timeouts in.
The e2e run was clean at 1.12 GB. Nothing was retried for memory, and the sweep was not attempted.

---

## Notes for the plans that follow

- **10-10 onward** inherits `PREV_FILES 78` / `PREV_TESTS 804` / `PREV_E2E 97` / `BASE_CHECK 577` /
  `PREV_SWEEP_WALL 119 s` (carried, not re-measured), sweep `4 19`.
- **`tune-ui.spec.ts` is at 7 and 10-11 takes it to 9.** The phase closes at `BASE_TESTS + 40`.
- **10-10 now owns FOUR removals**, not three: `KnobView.positions`, `SWATCH_ROW_MAX`, the window
  branch in `knobViews` — and the rail forecast gap, which its picker closes for free.
- **The accent census is now an assertion with the eight-member list quoted in its failure
  message.** A wave that legitimately spends a ninth entry must move the census AND the list
  together, which is the point.
- **`--color-over` is at three uses and the fourth is deliberately not taken.** The comment saying
  where a reader will look for it and why it is absent is in `BudgetMeter.svelte`; do not "add the
  missing branch".
- **`--font-mono` is at five and the fifth's justification is a comment beside it.** A sixth needs
  the same argument made out loud.
- **U+2212 has exactly one occurrence and a test that says so.** Adding a second anywhere in `src/`
  is red, and the fix is to import `forecastDelta`, not to widen the assertion.
- **`e2e/` is still not type-checked by anything** (10-07's finding, unchanged). `Knob.svelte`,
  `KnobRack.svelte` and `TuningRegion.svelte` all changed shape this plan.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 9 is complete. TUNE-04's spirit is extended with locks that spend no accent and travel in no
link; TUNE-02's is extended with a forecast that is `cost()`-only, memoised, hover-and-focus, never
on touch and never animated, with a named guard on the "never `fit()`" contract. The picker at 10-10
inherits a rack whose rows are shrink-safe on a phone, a forecast wired end to end for every option
that is a real element, and the one mapping it must write anyway named as the thing that closes the
rail gap.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

All eleven modified source files, `deferred-items.md` and this summary are on disk, and all three
commit hashes resolve in `git log`: `5316436`, `5d3d2a6`, `46c3f19`.
`git diff --stat HEAD -- src/vendor/ src/lib/ui/ChosenPanel.svelte src/lib/ui/Coverflow.svelte`
returns nothing, and `grep -rn "overflow-x"` over the three tuning files returns nothing.

Every count, character count, wall clock, exit code, `sha256` and failure message quoted above was
read from a runner's, a compiler's or a probe's own output in this session. The three places this
plan's result disagrees with its instructions are reported with the measurement behind each rather
than smoothed over: the rail forecast is absent and counted rather than claimed, the delta is beside
the option rather than in the meters' line box with both protected numbers asserted instead, and the
sweep was not run with the reason and the grep that justifies it stated. The inherited work is
reported as what it was — 545 uncommitted lines that passed three gates and failed a fourth — rather
than as a finished task 1.
