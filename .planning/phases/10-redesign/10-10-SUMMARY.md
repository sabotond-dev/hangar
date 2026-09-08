---
phase: 10-redesign
plan: 10
subsystem: tune
tags:
  [
    tune-01,
    tune-05,
    ident-01,
    colour-picker,
    rgb444-lattice,
    a-09-fence,
    instrument-register,
  ]

requires:
  - phase: 10-redesign
    plan: 09
    provides: PREV_FILES 78 / PREV_TESTS 804 / PREV_E2E 97 / BASE_CHECK 577, sweep 4 19, the forecast wired to every option that is a real element, and a rack whose rows are shrink-safe on a phone
provides:
  - "ColourPicker.svelte: one picker per panel, three sixteen-detent rails over the hardware's own 4,096-colour lattice, per-detent RGB444 fills, the cheap-step ticks, the unaffordable detents, one 9x9 result pad, the word-row knob selector and one lock"
  - "colour-picker.spec.ts with six gates: the lattice fills, A-09's fence with all six shapes named, the derived tick rule, the guard proved on a synthetic and measured at ZERO on the shelf, the 14/14/3/5 selector split recounted from CATALOG, and the one-canvas budget"
  - "view.ts's lattice restated for src/lib/ui/ - colourLevels, colourPosition, colourChannel, colourValueText, colourLiteralLength, colourCheapLevel, colourRail, colourRailMax, isColourLattice - held against the vendored colourAt/colourIndexOf over all 4,096 positions"
  - "The two-swatch window GONE: KnobView.positions, SWATCH_ROW_MAX and the window branch in knobViews are deleted, knobPosition() is the identity, and model.spec.ts asserts the window cannot come back"
  - "The sixth --font-mono use and the first pill outlines on the site (D-15/D-16/D-17, A-41's Secondary-and-word-row limit respected)"
  - "PREV_FILES 79, PREV_TESTS 810, PREV_E2E 97, BASE_CHECK 579, PREV_SWEEP_WALL 130 s, sweep 4 19 - the carry-forward block for 10-11 onward"
affects: [10-11, 10-13, 10-13.1, 10-14, tune, ui]

tech-stack:
  added: []
  patterns:
    - "A CENSUS MOVES; ITS LIST DOES NOT. The accent census over the tuning components went 14 to 21 because a NINTH component joined the walk, and every one of the picker's seven declarations is one of the eight entries already reserved. The list is what is asserted; the number is what is recounted"
    - "AN ABSOLUTELY POSITIONED CHILD RESOLVES inset-inline: 0 AGAINST ITS CONTAINING BLOCK'S PADDING BOX. Padding on the rail itself moves nothing; padding on the rails CONTAINER is what reserves the thumb's radius. Measured, after the wrong one was tried"
    - "A CONTAINER QUERY THAT LOSES ON SOURCE ORDER IS A RULE THAT IS PRESENT AND HAS NO EFFECT. Same specificity, later wins - so the query is the last rule in the file, and the reason is written beside it"
    - "A HAND-DECLARED WALK IS A SILENT GAP. DEVICE_COMPONENTS, browseFiles() and TUNING_COMPONENTS are all hand lists; the picker is in the third and belongs in none of the others, and its per-selector 44px floor needed an assertion of its own because a file-level includes(\"44px\") passes on the head row alone"
    - "A NEGATIVE CHECK THAT REPORTS TWO VALUES INSTEAD OF A RULE IS A WEAK TEST, NOT A PASSING ONE. The hex check fired on an equality with no message; the scan was moved above it so a red run names the rule"

key-files:
  created:
    - src/lib/ui/ColourPicker.svelte
    - src/lib/tune/colour-picker.spec.ts
  modified:
    - src/lib/tune/view.ts
    - src/lib/tune/view.spec.ts
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/tune/knobs.lua.spec.ts
    - src/lib/ui/Knob.svelte
    - src/lib/ui/KnobRack.svelte
    - src/lib/ui/TuningRegion.svelte
    - src/lib/ui/tune-ui.spec.ts
    - e2e/tuning.e2e.ts
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The 12px thumb is centred on its value, so at the top detent it paints 6px past the rail - and aurora SHIPS at 0,85,255, so the blue rail is at 15 on arrival. Knob.svelte has the identical rule and is safe because its .row grid keeps a lock column to the thumb's right. The rails container reserves the radius; padding on the rail itself would have moved nothing, because an absolutely positioned child resolves inset-inline against the padding box"
  - "The monospace metadata is dropped below a 262px container: 63 caption + 89 metadata + 44 lock + 24 gaps is 220px of furniture before the knob's own 39px name gets a pixel. It is the only member of the head that carries no information of its own - aria-hidden, over the same three integers the rails announce"
  - "The picker's 192px is now a FLOOR. Exact on the 14 entries with one colour knob; on the 17 with more, three 44px selector options plus the caption plus the lock is 263px of min-content against a 172px rack, so the block grows rather than painting over the next rack row. The 96px under-reservation is item 7 and belongs to 10-13.1 with the pill's own padding"
  - "tuning.e2e.ts's rails() is scoped to the knob ROWS, because aurora declares colour first and the picker took the first slot - so turnRail(0) and turnRail(1) were turning red and green. knobIndices reads the picker's rails too, so RESET ALL covers the 4,096-position knob again rather than merely leaving it alone"
  - "The sixth --font-mono use is spent HERE rather than at 10-13.1: 19.1c names the metadata block as the sixth, and the metadata block is the picker's. 10-13.1 inherits a count that is already at six"

requirements-completed: []

duration: 145min
completed: 2026-09-08
---

# Phase 10 Plan 10: The stylized RGB picker Summary

**Colour is now chosen from three sixteen-detent rails over the hardware's own 4,096-colour lattice,
one picker per panel however many colour knobs an entry declares, and every filled pixel inside it is
a flat fill of an exact stored RGB444 value — A-09's six forbidden shapes named in one source scan
with `rgb()` carved out to the detents and the result. The unaffordable guard is proved on a
synthetic one character from the wall and measured at ZERO on the shelf, with 10-08's 268-character
margin in the failure message. The two-swatch window is gone and cannot come back. 79 files / 810
tests (+1 / +6), 97 e2e (+0), check 579 (+2), sweep 4 19 unmoved. Tasks 1 and 2 arrived COMMITTED
from an interrupted session and were reconciled against the gates rather than trusted: `npm run
check`, `npm run lint` and `test:quick` were all green, and `npx playwright test e2e/tuning*` failed
**3 of 20** — two measured narrow-width breaches and one e2e helper the picker had quietly
invalidated. All three fixed forward.**

## Performance

- **Duration:** ~145 min, of which roughly the first 25 were reconciling two commits and two
  uncommitted files against the plan and the gates
- **Completed:** 2026-09-08
- **Tasks:** 2 (five commits — the two inherited, plus a fix, a test and a docs commit)
- **Files created:** 2 · **Files modified:** 13 · **Files deleted:** 0

---

## WHAT THE INTERRUPTED SESSION HAD DONE, AND WHAT IT HAD NOT

HEAD was `e08f18c`. Both tasks had **landed as commits** — `5305fdc` (feat, 13 files, 2,027
insertions) and `e08f18c` (test, 1 file, 354 insertions) — with two files left uncommitted: a
six-line comment in `ColourPicker.svelte` naming why nothing supplies `onresult` yet, and 74 lines
appended to `deferred-items.md`. Read against the plan, and then against the gates rather than
against the diff:

| Plan item                                             | State on arrival                                     | Verdict                    |
| ----------------------------------------------------- | ---------------------------------------------------- | -------------------------- |
| T1.1 `view.ts`'s mapping by kind alone                | complete, with X-05/X-06 named in the source          | kept                       |
| T1.2 the component, rails and word row reused         | complete; the swatch row is `Knob.svelte` itself      | kept                       |
| T1.3 the presence rule and the 14/14/3/5 split        | complete, recounted from `CATALOG`                    | kept                       |
| T1.4 the seven strings                                | complete, all seven at their stated lengths           | kept                       |
| T1.5 `aria-valuetext` as three integers               | complete                                              | kept                       |
| T2.1 the lattice fills                                | complete, sampled against `colourAt` over all 4,096   | kept                       |
| T2.2 the fence, six shapes by name                    | complete, and the name half scans NAMES not the file  | kept                       |
| T2.3 the derived tick rule                            | complete, shape string-equal to the default marker    | kept                       |
| T2.4 the guard, synthetic and shelf-wide              | complete, excluded set and shelf count both asserted  | kept                       |
| T2.5 the six-canvas budget                            | complete, picker contributes exactly one              | kept                       |
| **T1's two negative checks**                          | **no record** — the tree is the only evidence         | **run here**               |
| **T2's three negative checks**                        | **no record**                                         | **run here**               |
| **The 262px / thumb / floor behaviour at phone width**| **BROKEN in two ways, 3 of 20 e2e red**               | **fixed forward**          |
| **`tuning.e2e.ts`'s `rails()`**                       | **invalidated by the picker, and half-silently**      | **fixed forward**          |
| The SUMMARY, STATE and the counts                     | not started                                           | written here               |

**The tree was treated as a candidate and it did not survive intact.** `npm run check` printed
`COMPLETED 579 FILES 0 ERRORS 0 WARNINGS`, `npm run lint` was clean, and
`npm run test:quick | node scripts/check-counts.mjs 79 810` matched on the first run. The breakage
was two gates further out: `npx playwright test e2e/tuning.e2e.ts e2e/tuning-webkit.e2e.ts`
failed **3 of 20**, and the three are three different faults. All three are in "Deviations" with
their measurements. **20 of 20 after, and 97 of 97 on the full suite.**

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                     |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------------ |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                          |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                          |
| `PREV_FILES`      | **78**     | **79**     | **+1** — `src/lib/tune/colour-picker.spec.ts` created                    |
| `PREV_TESTS`      | **804**    | **810**    | **+6**, all six in the new file. Split below                             |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **run, and reproduced** — this wave touches knobs and the colour lattice |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                          |
| `PREV_SWEEP_WALL` | **119 s**  | **130 s**  | **re-measured**: 129.55 s, 44,078 states                                 |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                          |
| `PREV_E2E`        | **97**     | **97**     | **+0** — 97 passed, exit 0, 1.8 min at `--workers 3`                     |
| `BASE_CHECK`      | **577**    | **579**    | **+2**: `ColourPicker.svelte` and `colour-picker.spec.ts`. Always 0 / 0  |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                   |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                |

`npm run check` prints one line:
`COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`npm run test:quick | node scripts/check-counts.mjs 79 810` →
*"observed 79 files, 810 tests passed, 1 todo … matches the expected counts"*.

**The sweep was run rather than carried, and it reproduced 10-08 exactly.** `npm run test:sweep` →
**4 files / 19 tests**, 129.55 s wall, `Pass A 19502, Pass B 24576, total 44078 states … over budget
0; Pass B colours excluded 0`, and *"the dearest COLOUR-BEARING preset is ninepads at 640 of 908, 268
free"*. `tpad` reports **907 of 908, 1 free**, which is the number the synthetic guard proof is built
on. The wall clock is 130 s against 10-09's carried 119 s and 10-01's frozen 123 s — no sweep file
changed, and the machine was running a `wrangler dev` at the time.

---

## THE TEST SPLIT, AS IT ACTUALLY LANDED

| File                              | Task 1 | Task 2 | The fixes | Before | After  |
| --------------------------------- | ------ | ------ | --------- | ------ | ------ |
| `src/lib/tune/colour-picker.spec.ts` | **+3** | **+3** | +0     | 0      | **6**  |
| `src/lib/tune/view.spec.ts`       | +0     | +0     | +0        | 8      | **8**  |
| `src/lib/tune/copy.spec.ts`       | +0     | +0     | +0        | 6      | **6**  |
| `src/lib/tune/model.spec.ts`      | +0     | +0     | +0        | 10     | **10** |
| `src/lib/ui/tune-ui.spec.ts`      | +0     | +0     | **+0**    | 7      | **7**  |
| `src/lib/sim/paint.spec.ts`       | +0     | +0     | +0        | 5      | **5**  |
| **plan**                          | **+3** | **+3** | **+0**    |        | **+6** |

`tune-ui.spec.ts` stays at **7**, which is what leaves 10-11's +2 landing it at **9** and the phase
at `BASE_TESTS + 40`. Both assertions this reconciliation added ride inside existing tests, and both
are named where they landed:

| Assertion                                                        | Rode inside                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `.rails` reserves the thumb's 6px radius                          | `tune-ui.spec.ts` test 2 (nothing scrolls sideways) |
| `.option` and `.lock` each declare BOTH 44px axes                 | `tune-ui.spec.ts` test 3 (the 44px floor)      |
| the picker's block is a FLOOR (`min-block-size`) rather than fixed | `tune-ui.spec.ts` test 7 (the region's arithmetic) |

`paint.spec.ts` is **untouched and green at 5** — the four painter prohibitions are exactly where
they were, and this is how that is said.

---

## THE SEVEN STRINGS, COUNTED BY SCRIPT

| Constant              | Text                                                     | Count  |
| --------------------- | -------------------------------------------------------- | ------ |
| `COLOUR_CAPTION`      | `COLOUR`                                                  | **6**  |
| `COLOUR_WHICH`        | `Which colour`                                            | **12** |
| `COLOUR_RED_RAIL`     | `Red, 16 steps`                                           | **13** |
| `COLOUR_GREEN_RAIL`   | `Green, 16 steps`                                         | **15** |
| `COLOUR_BLUE_RAIL`    | `Blue, 16 steps`                                          | **14** |
| `COLOUR_CHEAP_STEPS`  | `Marked steps cost the fewest characters.`                | **40** |
| `COLOUR_UNAFFORDABLE` | `The colours left out would not fit inside 908 characters.` | **57** |

Every one is the number the plan states. The prefixed form is **composed, not written down**:
`colourRailName("r", "Mute")` is `Mute red, 16 steps`, and the picker is asserted to call the
composer rather than to carry a literal — seventeen entries carry more than one colour knob, so the
written-out form would be fifty-one sentences drifting from the catalog.

---

## THE 14 / 14 / 3 / 5 SPLIT, RECOUNTED FROM `CATALOG`

| Colour knobs | Entries | What the picker shows                            |
| ------------ | ------- | ------------------------------------------------ |
| 1            | **14**  | no selector; the knob's own label beside the caption |
| 2            | **14**  | a two-option word row                            |
| 3            | **3**   | `console`, `forge`, `strip`                      |
| 0            | **5**   | no picker at all                                 |
| **total**    | **36**  | asserted equal to `CATALOG.length`               |

**The planner's figures were reproduced exactly.** The three-option set is asserted by name, not
merely by count, because it is the case the six-canvas budget is measured against. The denominator
is asserted too, so a thirty-seventh entry moves the test rather than sliding into one of the four
buckets.

---

## THE GUARD: PROVED ON A SYNTHETIC, MEASURED AT ZERO

**The synthetic is not invented.** It is `tpad`'s own measured worst state given a colour knob —
**Setup at 907 of 908, one character free** — and the sweep reproduced that 907 in this session. The
only reason the guard has never fired on the shelf is that `tpad` has no colour knob to fire on.

At `0,0,0` the current literal is five characters. **A single rail's whole spread is TWO characters**
(one digit to three), so with one character free the two-digit steps still fit and every three-digit
step is out:

| Observation                        | Asserted                          | Observed              |
| ---------------------------------- | --------------------------------- | --------------------- |
| detents excluded on the red rail   | levels **6…15**                   | 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 |
| how many                           | **10** of 16                      | 10                    |
| every excluded one really overruns | literal delta > 1                 | true for all ten      |
| every offered one really fits      | literal delta ≤ 1                 | true for all six      |
| the rail keeps sixteen positions   | absent as a colour, present as a position | 16 detents drawn |
| the control's own max              | stops below the excluded suffix   | `max` = 5             |
| an adjacent visible reason line    | **none** (X-17)                   | none                  |

**The whole LATTICE is worth six characters and a single RAIL is worth two**, and conflating them is
the easiest mistake available here — it is written down beside the synthetic.

**The measurement, over the real shelf: ZERO.** Six lattice colour knobs × 3 axes × 16 detents =
**288 detents checked**, against `ninepads`'s measured budget of 268 free with two copies, and
**not one is unaffordable**. The failure message carries 10-08's numbers so the day it stops being
zero the suite says which of them moved.

---

## THE CANVAS BUDGET, RECORDED FOR 10-11

| Term                              | Count |
| --------------------------------- | ----- |
| the hero                          | 1     |
| **the picker's result**           | **1** |
| `MIX TWO`'s children (10-11)      | 4     |
| **total, worst entry**            | **6** |
| one picker per KNOB would be      | **8** |

`console`, `forge` and `strip` declare three colour knobs each; the picker declares exactly one
`<PadCanvas>`, asserted by occurrence count, and the rack renders one block in the place of the first
colour knob (`row.id === pickerAt`). **The pad is the entry: a three-colour configuration has one
appearance, not three.**

---

## THE CENSUSES

### `--color-accent` over the tuning components — **14 → 21**, list still **eight**

| Component              | before | after |
| ---------------------- | ------ | ----- |
| `BudgetMessage.svelte` | 2      | 2     |
| `BudgetMeter.svelte`   | 1      | 1     |
| **`ColourPicker.svelte`** | —   | **7** |
| `CopyLink.svelte`      | 1      | 1     |
| `Knob.svelte`          | 9      | 9     |
| `KnobRack.svelte`      | 0      | 0     |
| `StampNotice.svelte`   | 0      | 0     |
| `TuningRegion.svelte`  | 1      | 1     |
| **total**              | **14** | **21**|

**The census moved because a ninth component joined the walk; the list did not.** All seven of the
picker's declarations are entries already reserved: three are the focus ring (entry 4) on the rail,
the selector option and the selected detent's outline, and four are the selected value of a knob
(entry 8) — the track fill, the thumb, the selected detent and the selected pill. The three things
that would have been a ninth are asserted individually, because a total absorbs a swap: the
cheap-step tick is `--color-line`, the unaffordable detent is `--color-ground` behind a
`--color-line-soft` hairline, and the default marker is the soft dot it always was.

**A note for 10-13.1 and for §19.1's A-40**, which cites this census as *"unmoved at fourteen"*: it
is now **21 over eight components**, and the argument it was cited for is unchanged — an accent cross
on the registration lattice still turns it red.

### `--color-over` — **3 uses, and the picker takes none**

Four `var(--color-over)` references in code across two components, exactly as 10-09 left them. The
picker names the token nowhere, and its header says why: a knob is never red, and an unaffordable
colour is **absent rather than alarming**.

### `--font-mono` — **5 → 6**, and this is the sixth and last of the phase

| File                  | uses  |
| --------------------- | ----- |
| `BudgetMeter.svelte`  | 1     |
| **`ColourPicker.svelte`** | **1** |
| `CopyLink.svelte`     | 1     |
| `DeviceSlot.svelte`   | 1     |
| `Knob.svelte`         | 2     |
| **total**             | **6** |

§19.1c names the `+`-separated metadata block as the sixth named use, and the metadata block is the
picker's — so **the sixth is spent here, not at 10-13.1**. Its justification is beside it and it is
W-03's own: a number that changes as a pointer moves and must not jitter horizontally, with
`tabular-nums` as the other half. **10-13.1 inherits a count already at six**; a seventh needs the
argument made out loud.

---

## THE INSTRUMENT REGISTER, AS THIS WAVE CARRIES IT

The UI spec was amended after both commits landed (`d040e33`, A-37 to A-42), and the picker was
written against it:

| Amendment | What the picker does                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------- |
| A-37      | the picker is outside `.front-door`, so it is the **instrument** register throughout                     |
| A-40      | no accent is spent on anything decorative; the reserved list is still eight                              |
| A-41      | **pill outlines on the selector's options, filled pill for the active state — and nothing else pilled.** The lock is Quiet and stays borderless and shapeless; nothing in this file is Bare |
| §19.1c    | the composed value is `+`-separated monospace columns with `tabular-nums`, `--color-ink-quiet` joins     |

**A-41's limit is respected by omission and it is worth saying out loud:** the picker pills a word
row's options and nothing else. `KEEP ON DEVICE` and `CLEAR` are not in this file and were not
touched, so the SAFE-02 regression A-41 exists to prevent is not available here.

**Two handoffs to 10-13.1**, which owns `ColourPicker.svelte` next:

1. `.option`'s inline padding is **12px**; §19.1b puts the pill at **24px**. Not changed here —
   10-13.1 owns the pill, and the change moves every width in item 7's arithmetic.
2. The picker has no `.pill` class; it declares the radius on `.option`. 10-13.1's scan 2 looks for
   the class.

---

## THE FIVE NEGATIVE CHECKS

Every one was run here, because the interrupted session left no record of any of them and a check
nobody ran is a check that does not exist.

| #   | Task | Perturbation                                              | Gate                     | Result                          |
| --- | ---- | --------------------------------------------------------- | ------------------------ | ------------------------------- |
| 1   | 02   | `linear-gradient(90deg, red, blue)` on `.track-fill`       | `colour-picker.spec.ts`  | **red, naming the shape**       |
| 2   | 02   | red level 3 paints `50`, not a multiple of 17              | `colour-picker.spec.ts`  | **red, naming index and channel**|
| 3   | 02   | a visible `<p class="reason">` beside the rails            | `colour-picker.spec.ts`  | **red, quoting X-17**           |
| 4   | 01   | `knobs.length >= 1` — the selector on a single-colour entry| `colour-picker.spec.ts`  | **red**                         |
| 5   | 01   | `colourValueText` emits `#666666`                          | `colour-picker.spec.ts`  | **red — after a reorder**       |

**1.** *"the picker declares a gradient. A-09: an HSV field, a hue ring, a saturation/value square, a
continuous slider, a CSS gradient on a rail and `<input type=color>` are each forbidden BY NAME …:
expected [ 'linear-gradient' ] to deeply equal []"*.

**2.** *"axis 0, level 3 at 0: the detent is not the colour that index produces: expected [ 50, +0,
+0 ] to deeply equal [ 51, +0, +0 ]"* — the index and the channel, as the plan asked.

**3.** *"the exclusion has an adjacent visible reason line. X-17's precedent: the meter two
centimetres away is the cause, and a third sentence saying 908 is noise: expected [ Array(1) ] to
deeply equal []"*.

**4.** *"the selector is not gated on the knob count, so a single-colour entry renders a radiogroup
of one: expected '…' to contain 'knobs.length > 1'"*.

**5. This one found a weakness in the test rather than in the code, and the test was changed.** The
first run reported *"expected '#666666' to be '102, 102, 102'"* — an equality with **no message**,
two strings a reader has to diff by eye. The hex scan was moved **above** the three equalities and
the check re-run: *"position 0 is announced as a hex, which is a base the firmware never sees and a
resolution the state does not have — the announcement is the three STORED INTEGERS: expected
'#000000' not to contain '#'"*. The three equalities gained messages of their own. Exactly the
lesson 10-09's check 4 learned on U+2212, and it is committed separately as `4eca063`.

Every perturbed file was restored by its own **inverse edit** and confirmed byte-identical with
`sha256sum` before and after:

| File                          | Checks    | sha256, before and after |
| ----------------------------- | --------- | ------------------------ |
| `src/lib/ui/ColourPicker.svelte` | 1, 3, 4 | `7833688f…`              |
| `src/lib/tune/view.ts`        | 2, 5      | `e9f1c772…`              |

**No `git checkout`, `restore`, `stash` or `clean` was run at any point in this plan**, including to
restore a negative check.

---

## Task Commits

| #   | Commit    | What                                                                                         |
| --- | --------- | -------------------------------------------------------------------------------------------- |
| 1   | `5305fdc` | **inherited** — task 1: the picker, `view.ts`'s mapping and lattice restatement, the window's removal. 13 files, feat |
| 2   | `e08f18c` | **inherited** — task 2: the fence, the derived ticks, the guard. 1 file, test               |
| 3   | `748ccae` | the thumb's 6px, the 262px metadata rule, the 192px floor, `rails()` scoped, two riders. 4 files, fix |
| 4   | `4eca063` | the announcement's shape asserted before its values. 1 file, test                            |
| 5   | `06796dd` | `deferred-items.md`: item 4 restated, items 5, 6 and 7. 1 file, docs                          |

**One commit that is not this plan's landed in the interval** and is recorded so the log reads
honestly: `f7f9b2b`, `docs(10)`, touching `10-13.1-PLAN.md`, `10-CONTEXT.md` and `10-UI-SPEC.md`.
It touches no `src/`.

---

## Verification

| Gate                                                          | Result                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`              | one line: `COMPLETED 579 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`  |
| `npm run lint`                                                | clean — Prettier and ESLint                                                |
| `npm run test:quick \| node scripts/check-counts.mjs 79 810`  | *"observed 79 files, 810 tests passed, 1 todo … matches"*                  |
| `colour-picker.spec.ts` / `view.spec.ts` / `copy.spec.ts`     | **6** / **8** / **6**                                                      |
| `tune-ui.spec.ts` / `model.spec.ts` / `paint.spec.ts`         | **7** / **10** / **5** — `paint.spec.ts` untouched                         |
| `npm run test:sweep`                                          | **4 files / 19 tests**, 129.55 s, 44,078 states, **over budget 0**, ninepads 640 / 268 free |
| `npm run build`                                               | green, exit 0                                                              |
| `npx playwright test --workers 3`                             | **97 passed, exit 0, 1.8 min** — `PREV_E2E` unchanged                      |
| `npx playwright test e2e/tuning*.e2e.ts`                      | 17/20 on arrival, **20/20** after the three fixes                          |
| accent census / `--color-over` / `--font-mono`                | 14 → **21** with the list at eight · **3** uses · 5 → **6**                |
| `grep -rn "overflow-x" src/lib/ui/ColourPicker.svelte`        | **empty**                                                                  |
| `git diff --stat HEAD -- src/vendor/ src/lib/sim/paint.ts src/lib/ui/Coverflow.svelte` | **empty**                                         |
| `git status --porcelain`                                      | clean. `test-results/` removed by hand after every run                     |

**The e2e server was started by hand and the build was taken with it stopped**, which 10-09 recorded
as a cycle-costing trap: `npm run build` fails `EPERM … rm build` while `wrangler dev` holds the
directory, and the run that follows then silently tests the STALE artefact. It bit once here too, on
the first rebuild after the fix, and was caught by the exit code rather than by a wrong test result.
Free memory at the end was 2.01 GB.

---

## Decisions Made

1. **The thumb's radius is reserved by the rails CONTAINER, not by the rail.** An absolutely
   positioned child resolves `inset-inline: 0` against its containing block's padding box, so the
   obvious edit moves nothing at all. Written down beside the rule with the measurement.
2. **The monospace metadata is dropped below a 262px container**, derived from four measured widths
   with 3px of slack so the boundary is not the exact fit.
3. **The container query is the last rule in the file**, because `.value`'s own `display: flex`
   declaration would otherwise win on source order — observed, not feared.
4. **The picker's 192px is a floor**, so a wrapped selector grows the block instead of painting over
   the next rack row. The 96px under-reservation is measured and assigned.
5. **`rails()` in `tuning.e2e.ts` means the knob rows**, and `knobIndices` reads the picker's rails,
   so RESET ALL covers the 4,096-position knob again rather than merely leaving it alone.
6. **The hex negative check changed the test, not the report** — the scan runs before the equalities
   so a red run names the rule.
7. **The sixth `--font-mono` use is spent here**, because §19.1c names the metadata block as the
   sixth and the metadata block is the picker's.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — bug] The picker's thumb painted 6px past the rack, and the rack learned to scroll
sideways**

- **Found during:** reconciliation, `npx playwright test e2e/tuning.e2e.ts e2e/tuning-webkit.e2e.ts`
- **Issue:** the 12px thumb is centred on its value, so `calc(100% - 6px)` puts its right edge 6px
  past the rail at the top detent — and **aurora ships at 0,85,255**, so the blue rail stands at 15
  on arrival. **Measured: `knob-rack` scrollWidth 251 against clientWidth 245** at the 393px phone
  and **342 against 336** on chromium, red in `tuning-webkit.e2e.ts:279`. The tuning region forbids
  a horizontal overflow outright, so this is a prohibition breach and not a cosmetic one.
  `Knob.svelte` has the identical thumb rule and does not overflow because its `.row` grid keeps a
  lock column to the thumb's right.
- **Fix:** `padding-inline: 6px` on `.rails`, with the measurement and the containing-block reason
  beside it. A rider in `tune-ui.spec.ts` test 2 holds it, because that test's own scan reads
  declarations and would have stayed green through a measured breach.
- **Files modified:** `src/lib/ui/ColourPicker.svelte`, `src/lib/ui/tune-ui.spec.ts`
- **Committed in:** `748ccae`

**2. [Rule 1 — bug] The head could not hold its four members on a phone, and the knob's own name was
what it took the space out of**

- **Found during:** the same run — the **second** assertion in the same test, at its 320px pass,
  which the first failure had been hiding
- **Issue:** **`knob-rack` scrollWidth 229 against clientWidth 172**. The head is
  `caption + name + metadata + lock` on one non-wrapping flex line: 63 + 89 + 44 + 24 of gaps is
  **220px of furniture** before the name gets a pixel. Measured consequences before the fix:
  `Colour` was **25px wide and 36px tall** at a 245px rack and **9px wide and 108px tall** at 172px.
- **Fix:** `@container (width < 262px) { .value { display: none } }` — the metadata is the only
  member of the row carrying no information of its own, being `aria-hidden` over the same three
  integers `aria-valuetext` announces. **After: 172 against 172, 245 against 245, the head back to
  44px and the name back to 39px on one 18px line.** The rule is the last in the file because
  `.value` declares `display: flex` at the same specificity; placed beside `.head` where it reads
  better it was in the stylesheet and had no effect, which was observed and is written down.
- **Files modified:** `src/lib/ui/ColourPicker.svelte`
- **Committed in:** `748ccae`

**3. [Rule 1 — bug] `tuning.e2e.ts`'s `rails()` was turning the picker, and only one of ten tests
noticed**

- **Found during:** the same run
- **Issue:** aurora's knob list is `[colour, speed, direction, band]` plus Brightness, so the picker
  takes the **first** slot and its three colour rails come first in document order. `turnRail(0)`
  and `turnRail(1)` were therefore turning **red and green**. That moves a pad and moves a meter, so
  eight of the ten tests in the file stayed green; *"RESET ALL puts every knob back"* compared two
  identical racks and went red. The colour knob had also dropped out of `knobIndices` entirely,
  because its testids are `colour-rail-*` and not `knob-colour`.
- **Fix:** `rails()` is scoped to `[data-testid^='knob-'] input[type='range']`; `knobIndices` appends
  the picker's three rails under their own ids; the RESET ALL test turns the **red** rail as well
  (red rather than blue because aurora ships with blue already at the top detent, where `ArrowRight`
  is a no-op). `SCROLL_RAIL` still means tpad's third rail, and tpad has no colour knob.
- **Files modified:** `e2e/tuning.e2e.ts`
- **Committed in:** `748ccae`

**4. [Rule 2 — missing critical functionality] The picker's per-control 44px floor was declared and
asserted by nothing**

- **Found during:** the reconciliation, reading the three hand-declared walks
- **Issue:** the plan's contract table requires **44px on both axes per selector option**. It ships,
  but `tune-ui.spec.ts`'s floor walk is `includes("44px")` **per file**, which the picker passes on
  the strength of its 44px head row alone while an option or the lock could sit at 30px. Neither of
  the other two walks covers this file: `device-ui.spec.ts`'s `DEVICE_COMPONENTS` is the six device
  components and `browse-ui.spec.ts`'s `browseFiles()` is the six browse ones — a component omitted
  from a hand list passes silently, which is exactly §19.1g's complaint.
- **Fix:** a rider inside the floor test asserting `.option` and `.lock` each declare
  `min-inline-size: 44px` **and** `min-block-size: 44px`, naming why a file-level walk cannot see it.
  §19.1g's directory-derived walk arrives at 10-13.1 and will subsume it.
- **Files modified:** `src/lib/ui/tune-ui.spec.ts`
- **Committed in:** `748ccae`

**5. [Rule 1 — bug] A picker with a knob selector overflowed its own declared block on a phone**

- **Found during:** a hand probe after fix 2, because nothing in the e2e suite opens a
  multi-colour-knob entry
- **Issue:** **measured on `console` at 320px**: the selector's three 44px options stack, the head
  becomes **140px** and the content **288px** inside a box declared `block-size: 192px` — so it
  painted over the next rack row. Three 44px options plus the 63px caption plus the 44px lock is
  **263px of min-content against a 172px rack**, and the 44px floor is a contract rather than a
  style, so no amount of shrinking fits it.
- **Fix:** `min-block-size: 192px` — the block grows to hold its content instead of overlapping.
  `TuningRegion.svelte`'s `196p` term then under-reserves by 96px there, which is a first-paint
  layout shift rather than an overlap; both comments were corrected to say so, and
  `tune-ui.spec.ts`'s assertion now names `min-block-size` rather than passing on a substring.
  **The remainder is deferred-items.md item 7, assigned to 10-13.1**, because every threshold in a
  proper fix is a function of the pill's inline padding and §19.1b moves that from 12px to 24px in
  that wave.
- **Files modified:** `src/lib/ui/ColourPicker.svelte`, `src/lib/ui/TuningRegion.svelte`,
  `src/lib/ui/tune-ui.spec.ts`
- **Committed in:** `748ccae`

**6. [Rule 1 — bug] A negative check reported two values instead of a rule**

- **Found during:** negative check 5
- **Issue:** with the announcement rewritten as a hex, the three equalities fired first and reported
  `expected '#666666' to be '102, 102, 102'` — no message, and two strings a reader has to diff by
  eye. The assertion that names the rule never ran.
- **Fix:** the hex scan runs before the equalities and the equalities gained messages. Re-run and
  confirmed red on the rule.
- **Files modified:** `src/lib/tune/colour-picker.spec.ts`
- **Committed in:** `4eca063`

### Departures from the plan's letter, stated rather than smoothed

**7. `e2e/tuning.e2e.ts` is in neither task's file list.** It had to change: the picker moved the
rails a helper indexes by position. Nothing type-checks `e2e/` (10-07's finding, still true), so the
change was validated only by running the suite.

**8. `model.ts`, `model.spec.ts`, `knobs.lua.spec.ts` and `TuningRegion.svelte` are in neither task's
file list** and all four are in the inherited commits. Each is forced: the region owns the budget and
the held set the picker reads, `model.ts` builds the 4,096 colour views once at module scope because
resolving them per emit would run `swatchName`'s arithmetic 4,096 times inside the debounce window,
and both specs assert the window's removal.

**9. The plan's task-2 verify block expects `colour-picker.spec.ts` at 3 after task 1.** Both tasks
were already committed on arrival, so the intermediate count could not be observed and is not
claimed. The final count is 6, and the per-task split above is read from the two commits' diffs.

**10. `REQUIREMENTS.md` is not edited.** `TUNE-01`, `TUNE-05` and `IDENT-01` are all already `[x]`
with traceability rows that name plan 10-08 and Phase 10; this plan builds the widget those rows
already describe rather than completing anything, so `requirements-completed` is empty.

**11. The sixth `--font-mono` use lands here rather than at 10-13.1**, which plans to introduce it.
The count is 6 either way and §19.1c's rule is satisfied; 10-13.1 needs to know it is already spent.

---

**Total deviations:** 6 auto-fixed — 5 × Rule 1 (bug), 1 × Rule 2 (missing critical functionality) —
plus five stated departures.
**Impact on plan:** one file outside the plan's lists (`e2e/tuning.e2e.ts`) plus `deferred-items.md`,
both forced by measured breakage. Nothing in the objective was dropped. One thing in the objective is
**built but not driven** and is named rather than claimed: the result pad renders only when a
consumer supplies `onresult`, and today none does, because the only owner of a `SimHost` is
`Coverflow.svelte` — a file this phase promises not to edit and whose promise this plan's own
verification asserts. That is deferred item 5, with the three lines that close it written down.

---

## Issues Encountered

**`npm run build` fails while `wrangler dev` holds `build/` open**, and it bit once here despite
10-09 having recorded it: `EPERM … rm '\\?\C:\…\hangar\build'`. Caught by the exit code. The order
that works is stop wrangler, build, start wrangler, test.

**Nothing in the e2e suite opens a multi-colour-knob entry.** `tuning.e2e.ts` and
`tuning-webkit.e2e.ts` are aurora; the two over-budget tests are `/dev/tune/`'s tpad, which has no
colour knob at all. Deviation 5 was found by a throwaway Playwright probe and would otherwise have
shipped. A `console` case at 320px is the cheapest half of item 7.

**The head's four measured widths came from a probe, not from a runner**, and the probe was deleted.
The numbers are in the source comments where the next reader will look for them.

---

## Notes for the plans that follow

- **10-11 onward** inherits `PREV_FILES 79` / `PREV_TESTS 810` / `PREV_E2E 97` / `BASE_CHECK 579` /
  `PREV_SWEEP_WALL 130 s`, sweep `4 19`.
- **`tune-ui.spec.ts` is at 7 and 10-11 takes it to 9.** The phase still closes at `BASE_TESTS + 40`.
- **The six-canvas budget has one term spent:** hero 1 + picker result 1, leaving 4 for `MIX TWO`'s
  children. Eight was what one picker per knob would have cost.
- **The accent census is 21 over EIGHT tuning components** and the reserved list is still eight.
  §19.1's A-40 cites it as "unmoved at fourteen"; the number moved because the walk grew, and the
  argument it was cited for is untouched.
- **`--font-mono` is at six and the sixth is the picker's metadata block.** §19.1c calls six the last
  of the phase, so 10-13.1 has none to spend.
- **10-13.1 owns three things this plan left it:** `.option` at 12px inline padding against §19.1b's
  24px, the absence of a `.pill` class, and deferred item 7's head arithmetic — which is a function
  of the first of them, which is why it was not computed twice.
- **`e2e/` is still type-checked by nothing**, and this plan changed `tuning.e2e.ts`'s two most-used
  helpers.
- **The window is gone and cannot come back:** `model.spec.ts` asserts `KnobView` carries no
  `positions` field, naming the picker that removed it.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 10 is complete. TUNE-01's amended clause is in the source rather than only in a document, TUNE-05's
guard is machinery that is proved to fire and measured never to, and A-09's fence is a scan with all
six shapes named in its failure message. 10-11 inherits a rack that renders one picker per panel,
four canvases of headroom, and a picker whose only open geometry is the one 10-13.1 has to touch
anyway.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

Both created files, the five modified files named in the deviations, `deferred-items.md` and this
summary are on disk, and all five commit hashes resolve in `git log`: `5305fdc`, `e08f18c`,
`748ccae`, `4eca063`, `06796dd`.
`git diff --stat HEAD -- src/vendor/ src/lib/sim/paint.ts src/lib/ui/Coverflow.svelte` returns
nothing, and `grep -rn "overflow-x" src/lib/ui/ColourPicker.svelte` returns nothing — the second one
only after the paragraph that named the declaration was reworded to describe it, the way
`KnobRack.svelte`'s header already does, so the grep reads the CSS rather than the prose.

Every count, character count, pixel measurement, wall clock, exit code, `sha256` and failure message
quoted above was read from a runner's, a compiler's, a browser's or a probe's own output in this
session. The inherited work is reported as what it was — two commits that passed three gates and
failed a fourth — rather than as two finished tasks, and the three places this plan's result
disagrees with its instructions are reported with the measurement behind each: the intermediate
three-test count could not be observed because both tasks arrived committed, the result pad is built
and undriven with the reason and the three closing lines written down, and the multi-colour-knob
head at 320px is fixed only as far as "grows rather than overlaps", with the rest measured, assigned
and dated.
