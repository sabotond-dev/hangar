---
phase: 05-tuning-budgets-and-shareable-links
plan: 03
subsystem: tuning
tags: [knobs, pad-state, stamp, vendored-compiler, descriptors, no-op-gate]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-02's view seam (KnobKindName, widgetFor, swatchOf, the word tables) and its measured baseline of 46 files / 584 tests"
  - phase: 03-the-vendored-compiler
    provides: "src/vendor/botor/_pad.ts - PRESETS, the detent tables, quantiseColour, groundPadState, encodeStamp and the module-private withChange this plan reimplements"
  - phase: 08-new-configurations
    provides: "the seven hand-authored Lua entries and their 38 token knobs, which are the other half of the one descriptor shape"
provides:
  - "src/lib/tune/state.ts - withChange (reimplemented, private upstream), KnobBinding, applyKnob, readKnob, baseStateFor, resetAll, NoPadStateError"
  - "src/lib/tune/knobs.preset.ts - presetKnobs(id), the nine descriptor lists (37 knobs), colourTargetFor, BRIGHTNESS_KNOB_ID, and the KnobDescriptor / PresetKnob types both routes share"
  - "src/lib/tune/knobs.lua.ts - luaKnobs(entry) and STAMP_OPTION_CEILING, the 32-option tripwire under D-13"
affects: [05-04, 05-05, 05-06, 05-09, 05-10, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A module-private vendored function is REIMPLEMENTED in HANGAR with a comment naming its source line and stating what is load-bearing about it, never exported upstream-side (src/vendor is read-only)"
    - "Every knob default is DERIVED from the configuration's own shipped state through a mustIndex() that throws at import time, so 'RESET ALL lands on the card as published' is true by construction rather than by a test that could be written wrong"
    - "A no-op gate over compiled Lua must compare the ACTION BODIES, never setupLua: the stamp lives in the first action's marker name, so a setupLua comparison passes for any field the emitter never reads"

key-files:
  created:
    - src/lib/tune/state.ts
    - src/lib/tune/state.spec.ts
    - src/lib/tune/knobs.preset.ts
    - src/lib/tune/knobs.preset.spec.ts
    - src/lib/tune/knobs.lua.ts
    - src/lib/tune/knobs.lua.spec.ts
  modified: []

key-decisions:
  - "direction stays bound to look.axis (not look.reverse), but with TWO options - diagonal and antidiagonal. The gate proved x, y and diagonal compile to the identical body because the wave emitter branches on antidiagonal alone; view.ts and view.spec.ts are byte-identical, so the contingency branch was not taken"
  - "The no-op gate compares compiled action BODIES rather than setupLua, because compile writes the stamp into the first action's marker name and every encoded field therefore changes setupLua trivially. Measured: aurora's four axes give four distinct setupLua strings and two distinct bodies"
  - "Brightness is offered exactly where padLightsAnything(base) is true, which is BOTOR's own rule (_pad.ts:883). A card that lights nothing cannot HOLD a brightness - canonicalise resets it to Full at _pad.ts:1486 - so the knob would snap back when turned. The trackpad card meets D-01's three-knob floor with a third real knob from its own scroll-units detent table instead"
  - "Brightness options are the table's PERCENT column (15/30/50/75/100), not its detent steps or its words: amount is a rail kind, a rail's readout is the raw value, and the table's words cannot render on a rail at all"
  - "The CC-destination knob carries twelve options ON PURPOSE. view.ts gives a note-kind knob with eight or fewer options a word row of scientific pitch names, and 'CC 16' displayed as 'E1' is exactly the renumbering lie X-08 forbids; above eight the rule falls through to a rail whose readout is the raw integer"
  - "Colour options are pre-quantised by mapping the shared palette through the vendored quantiseColour, never hand-transcribed - and the Lua route diverges by one 17-step: a Lua entry substitutes its literal unquantised"

patterns-established:
  - "Pattern 1: the descriptor shape (id, label, kind, options, default) is authored once in knobs.preset.ts and the Lua route renames into it, so the panel cannot tell the two routes apart"
  - "Pattern 2: a negative check may also be a DESIGN check - running the gate against the option set the plan assumed is how the direction binding was decided rather than asserted"

requirements-completed: []
requirements-contributed: [TUNE-01, TUNE-02, TUNE-06]

# Metrics
duration: 20 min
completed: 2026-09-04
---

# Phase 5 Plan 03: The Knob Binding Layer Summary

**The semantics the vendored compiler does not carry, recovered as data: a reimplemented `withChange` that makes a tuned stamp a field dump instead of `paurora`, 37 knobs across the nine shelf cards whose kind sets are held against BOTOR's own declaration, 38 Lua knobs renamed into the same shape, and a no-op gate that compares compiled bodies rather than stamped Lua — which is what turned the `direction` binding from an assumption into a measurement.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-04T12:13:00Z
- **Completed:** 2026-09-04T12:33:00Z
- **Tasks:** 3
- **Files created:** 6

---

## Observed totals — baseline plus delta

`05-02-SUMMARY.md` recorded `BASE_FILES = 46`, `BASE_TESTS = 584` (1 todo), sweep `1 / 9`, e2e `23`.
The quick suite was **re-measured on a clean tree at `eafcb1d`, before any file in this plan was
created**, and matched:

```
npm run test:quick          (re-measured, clean tree at eafcb1d)
 Test Files  46 passed (46)
      Tests  584 passed | 1 todo (585)
   Duration  4.54s
```

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 46 files / 584 tests (1 todo) | **49 files / 599 tests (1 todo)** | **+3 files / +15 tests** |
| `test:sweep` | 1 file / 9 tests | **1 file / 9 tests** | unchanged |
| `test:e2e` | 23 passed | **23 passed** (not re-run — no e2e file touched) | unchanged |
| `check` | 462 files, 0 errors | **468 files, 0 errors** | +6 files, still 0 errors |

Verbatim, through `scripts/check-counts.mjs`:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 49 599
check-counts: observed 49 files, 599 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
QUICK_EXIT=0

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9
check-counts: observed 1 files, 9 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts
SWEEP_EXIT=0
```

Matches 05-VALIDATION's expected delta row for 05-03 (`+3 / +15 / 1 file 9 / unchanged`) exactly.

```
npm run check 2>&1 | grep -Ei "0 errors"
1788517782935 COMPLETED 468 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint   ->   exit 0 ("All matched files use Prettier code style!")
```

Per file, exactly as the plan's three `<verify>` blocks ask:

```
npx vitest run --project server src/lib/tune/state.spec.ts         ->   5 passed (5)
npx vitest run --project server src/lib/tune/knobs.preset.spec.ts  ->   6 passed (6)
npx vitest run --project server src/lib/tune/knobs.lua.spec.ts     ->   4 passed (4)
```

Guards, all still green and all unmoved:

```
git diff --quiet HEAD -- src/vendor                                    ->   exit 0
git diff --quiet HEAD -- src/lib/catalog/front-door.ts                 ->   exit 0
git diff --quiet HEAD -- src/lib/tune/view.ts src/lib/tune/view.spec.ts ->  exit 0
```

**Wall time note:** the plan budgeted `padReady()` in a `beforeAll` for the no-op gate. It was not
needed and was not used — `compile` emits Lua without measuring it and only `measure`/`cost` reach
`GridScript` (`_pad.ts:3042`), the 08-03 precedent. The gate's 254 compiles run in **30 ms** with no
WASM download at all.

---

## The nine cards, as shipped

37 compiler-driven knobs. Every count is inside D-01's 3..6, every kind set equals
`presetById(id).knobs`, and every option of every knob changes the compiled Lua.

| Card | Knobs | Count |
|---|---|---|
| aurora | Colour, Speed, Direction, Band, Brightness | 5 |
| pinwheel | Colour, Speed, Arms, Brightness | 4 |
| starfield | Colour, Edge, Brightness | 3 |
| radar | Colour, Speed, Send, Brightness | 4 |
| joystick | Colour, Send, Bend, On lift, Brightness | 5 |
| ninepads | Colour, Notes, Scale, Channel, Brightness | 5 |
| faders | Send, Channel, Brightness | 3 |
| dial | Send, Sensitivity, Mode, Channel, Brightness | 5 |
| tpad | Tap, Pointer speed, Scroll | 3 |

Across both routes: **75 knobs** (37 compiler-driven, 38 Lua), **widest option list 16** — a MIDI
channel, on both routes, half of `STAMP_OPTION_CEILING`.

---

## The `direction` binding: decided by the gate, not assumed

The plan required the `look.axis` binding to be *verified before shipping*, with a fallback to
`look.reverse` (and two new words in `view.ts`) if the gate went red. **The gate did go red — and it
named a third possibility the plan had not enumerated, which is the one that shipped.**

Run with the four-value `Axis` set the UI spec words:

```
FAIL  src/lib/tune/knobs.preset.spec.ts > ships no decorative knob: every option changes the compiled Lua
AssertionError: aurora.direction has options that compile identically:
  expected [ [ 'x', 'y', 'diagonal' ] ] to deeply equal []
```

`usesAxis(wave)` is true and `encodeStamp` writes the axis, so the field is genuinely read — but the
wave emitter uses it for one thing only, the sign in `(n%9 ± n//9)` (`_pad.ts:2652`). `x`, `y` and
`diagonal` therefore paint the same picture. Offering four positions where three are identical is the
decorative knob the gate exists to catch.

**Outcome: the binding stayed `look.axis`; the OPTION SET shrank to the two values that differ** —
`diagonal` → *Rising*, `antidiagonal` → *Falling*, both already in `view.ts`'s `DIRECTION_WORDS`.
The contingency branch was NOT taken: no word was added to `view.ts`, `view.spec.ts` stays at 8 tests,
and `git diff --quiet HEAD -- src/lib/tune/view.ts src/lib/tune/view.spec.ts` exits 0. This plan's
`+15` delta and 05-VALIDATION's per-file counts hold as written.

---

## The four colour values that move

The option list is built by mapping the shared palette through the vendored `quantiseColour`
(`_pad.ts:490`), never hand-transcribed, so a change to the 17-step rule moves the options with it.
Four of the five palette values move:

| Palette literal | Stored, and therefore the option string | Hue word (unchanged) |
|---|---|---|
| `0,200,255` | **`0,204,255`** (200 → 204) | Cyan |
| `255,90,0` | **`255,85,0`** (90 → 85) | Orange |
| `0,255,120` | **`0,255,119`** (120 → 119) | Spring green |
| `255,255,255` | `255,255,255` (unchanged) | White |
| `120,0,255` | **`119,0,255`** (120 → 119) | Violet |

Every quantised value lands in the same 30-degree hue bucket as its original, so 05-02's word test
needed no change. Each card's own colour is prepended when it is not already in the list — six
options per swatch row today, and the card's own colour is always position 1, which is what makes
every colour knob's default index 0 by construction.

### The one-step divergence between the two routes, recorded

**A Lua entry substitutes its colour literal into the source UNQUANTISED.** EUCLID's `@RINGC` becomes
`0,200,255` in the emitted Lua, because token substitution never passes through `PadState`. A preset's
colour goes through `PadState` and is therefore `0,204,255`. The two swatch rows are visually
identical — the same hue bucket, the same accessible name, a 4/255 difference in one channel — and
nothing downstream branches on it. It is real, it is harmless, and it is written down here rather than
discovered later by someone diffing two configurations that "should" match.

---

## Accomplishments

- **A tuned stamp can never be the untuned card.** `withChange` is reimplemented with `delete
  draft.preset` and `delete draft.soloStream`, and the Pitfall-2 guard asserts the difference in the
  only place it is visible: `encodeStamp` of an untouched aurora is `paurora` (7 characters), and of
  the same card at speed detent 7 is `at05vh1pv8j00` (13). Without the deletion the second reads
  `paurora` too, and every knob the visitor moved is silently gone from the link.
- **A vendored re-sync that changes a card's knobs goes red and names the card.** Test 2 holds
  `new Set(descriptors.map(kind))` minus the brightness id against `presetById(id).knobs` in both
  directions. Removing one aurora descriptor produces
  `aurora kinds: expected [ 'colour', 'direction', 'speed' ] to deeply equal [ 'colour', 'direction', 'size', …(1) ]`.
- **No knob anywhere is decorative, with no exemption at all.** 254 compiles across nine cards and 37
  knobs, comparing action bodies. The plan expected one exemption (`padLightsAnything(state) === false`);
  the module uses that predicate one step earlier instead, so the exemption is unnecessary — see the
  deviation below.
- **Every default is the position the card ships at, by construction.** `mustIndex` throws at import
  time if a card's shipped value is not in its own option list, so a mistyped option is a startup
  failure rather than a card that quietly ships at position 1. Five defaults are additionally stated
  by hand in the spec so a derivation that silently returned zero everywhere would still be caught.
- **Both routes are one shape.** `luaKnobs` is a rename: `values` → `options`, `token` dropped,
  default resolved from `entry.defaults`. Test 1 asserts the carry-across field by field, and test 4
  proves every shipped Lua knob renders — every `colour` a swatch, every `scale` and every ≤8-option
  `note` a word row, and the rails by design rather than by fall-through.
- **A tripwire under D-13.** `STAMP_OPTION_CEILING = 32` is asserted against both routes' widest knob
  with a non-vacuity floor of 40 knobs examined; 75 were.

---

## Task Commits

1. **Task 5-03-01: state.ts — the private withChange, reimplemented and pinned** — `2bc4f0b` (feat)
2. **Task 5-03-02: knobs.preset.ts — the nine descriptor lists and the universal brightness knob** — `3635db9` (feat)
3. **Task 5-03-03: knobs.lua.ts — the other route, in the same shape** — `82b0dec` (feat)

## Files Created

- `src/lib/tune/state.ts` — `withChange`, `KnobBinding`, `applyKnob`, `readKnob`, `baseStateFor`, `resetAll`, `NoPadStateError`
- `src/lib/tune/state.spec.ts` — 5 tests, including the Pitfall-2 stamp guard
- `src/lib/tune/knobs.preset.ts` — the nine descriptor lists, `colourTargetFor`, `BRIGHTNESS_KNOB_ID`, and the shared `KnobDescriptor` / `PresetKnob` types (703 lines)
- `src/lib/tune/knobs.preset.spec.ts` — 6 tests, including the tie back to `PadPreset.knobs` and the no-op gate
- `src/lib/tune/knobs.lua.ts` — `luaKnobs`, `STAMP_OPTION_CEILING`
- `src/lib/tune/knobs.lua.spec.ts` — 4 tests across both routes

---

## Negative checks — three, observed red and quoted

| # | Mutation | Observed |
|---|---|---|
| 1 | `delete draft.preset` removed from `withChange` | `state.spec.ts` tests 1 and 2 red. The offending stamp value, captured directly: `expected 'paurora' to be …` — i.e. the tuned state encodes as the untuned card instead of `at05vh1pv8j00` |
| 2 | one knob descriptor removed from aurora | `knobs.preset.spec.ts` tests 2 and 3 red, naming the card AND the missing kind: `aurora kinds: expected [ 'colour', 'direction', 'speed' ] to deeply equal [ 'colour', 'direction', 'size', …(1) ]` |
| 3 | `direction` given the full four-value `Axis` set | `knobs.preset.spec.ts` test 5 red: `aurora.direction has options that compile identically: expected [ [ 'x', 'y', 'diagonal' ] ] to deeply equal []` |

Check 2 went red on tests 2 and 3 rather than the plan's predicted 1 and 2: removing aurora's Band
knob leaves the card at four knobs (three plus brightness), which is still inside D-01's floor, so
test 1 is correct to stay green. Test 3's hand-stated `knobOf("aurora", "band")` default caught it
instead. Both failures name aurora, which is what the check exists to prove.

The `withChange` scan required by the acceptance criteria, run as a throwaway `.mjs` outside the repo:

```
node <scratch>/withchange-scan.mjs src/lib/tune/knobs.preset.ts
file:              src/lib/tune/knobs.preset.ts
withChange spans:  18
state assignments: 21
receivers:         draft
outside withChange: none
EXIT=0
```

Every `PadState` assignment in the module has the receiver `draft` and lies inside a `withChange`
callback, over the comment-stripped source.

Acceptance greps:

```
grep -c "tpad" src/lib/tune/knobs.preset.spec.ts        ->  0
grep -c "SPEED_TABLE" src/lib/tune/knobs.preset.ts      ->  3
grep -c "BRIGHTNESS_TABLE" src/lib/tune/knobs.preset.ts ->  5
grep -c "quantiseColour" src/lib/tune/knobs.preset.ts   ->  6
grep -c "delete draft.preset" src/lib/tune/state.ts     ->  1
grep -c "delete draft.soloStream" src/lib/tune/state.ts ->  1
```

---

## Deviations from Plan

### 1. [Rule 2 — missing critical correctness] Brightness is offered where the card can hold it, and the trackpad gets a third REAL knob

- **Found during:** Task 2, while designing the no-op gate's exemption.
- **Issue:** The plan appends the brightness knob to **every** preset's list and exempts it from the
  no-op gate on a card where `padLightsAnything(state)` is false. Measured: on such a card brightness
  is not merely a no-op, it **cannot be held at all** — `canonicalise` resets `brightness` to 5
  whenever nothing lights (`_pad.ts:1486`). All five detents compile identically *and* `read()`
  returns Full whichever one is applied. Shipping it would mean a knob that visibly snaps back the
  moment a visitor turns it: worse than decorative, and the exact silent-lie class the compiler's own
  comments say it exists to abolish. It would also have made the plan's own test 4
  (`read(apply(base, i)) === i`) red for that card.
- **Fix:** The knob is offered exactly where `padLightsAnything(base)` is true — **which is BOTOR's
  own behaviour**: `_pad.ts:883` states the predicate is read "by the panel (which hides the
  Brightness knob then)". D-01's three-knob floor is then met on the trackpad card with a third real
  knob from the card's own third detent table, `TRACKPAD_SCROLL_UNITS` (label `Scroll`, kind `amount`,
  8 options, all eight compiling distinctly). Its kind set stays `{feel, amount}` — set equality with
  the vendored declaration is unaffected, because two knobs may share a kind.
- **Effect on the acceptance criteria:** the predicate is still expressed as
  `padLightsAnything(state) === false` and the string `tpad` still appears **zero** times in the spec
  (`grep -c` → 0). The gate now needs **no exemption**: every option of every knob on every card
  changes the compiled Lua, full stop. Test 5 additionally proves the predicate's *reason* — for each
  card that lights nothing it asserts no brightness knob is offered and that the five detents would
  compile identically there.
- **Files:** `src/lib/tune/knobs.preset.ts`, `src/lib/tune/knobs.preset.spec.ts`
- **Commit:** `3635db9`

### 2. [Rule 1 — the gate would have passed vacuously] The no-op gate compares compiled bodies, not `setupLua`

- **Found during:** Task 2, first run of the gate.
- **Issue:** `compile` writes the state's stamp into the **first action's marker name**
  (`_pad.ts:2419-2421`), and the stamp changes whenever any encoded field changes. A gate over
  `setupLua + timerLua` therefore reports every option of every knob as distinct — including options
  that paint an identical picture. Measured on aurora's `direction`: **four** distinct `setupLua`
  strings, **two** distinct bodies.
- **Fix:** the gate joins `[...result.setup, ...result.timer].map(a => a.script)`. That is the Lua a
  visitor's hardware actually runs, with the identifying marker excluded.
- **Consequence:** this is what made deviation-free verification of the `direction` binding possible
  at all — under the literal reading the gate would have passed and HANGAR would have shipped three
  identical positions on aurora's Direction knob.
- **Files:** `src/lib/tune/knobs.preset.spec.ts`
- **Commit:** `3635db9`

### 3. [Rule 3 — the plan's option set could not render honestly] `direction` carries two options, not four

Recorded in full above. The binding is the plan's (`look.axis`); the option set is the two values the
emitter distinguishes. No `view.ts` change, no fallback to `look.reverse`.

### 4. [Rule 2] The CC-destination knob carries twelve options so that it renders as a number

- **Issue:** `PadPreset.knobs` uses the kind `note` for a card's CC destination (radar, joystick,
  faders, dial). `view.ts` gives a `note` knob with ≤8 options a word row of **scientific pitch
  names**, so "CC 16" would be displayed as "E1" — the renumbering lie X-08 explicitly forbids.
- **Fix:** the `Send` knob ships twelve options (16…80, stopping below `maxCcBase`'s 124 for a
  four-fader card), which falls through view.ts's rule to a rail whose readout is the raw integer.
  ninepads' `note` knob is a real base note and keeps four options, so it *does* get its word row:
  C1, C2, C3, C4.
- **Files:** `src/lib/tune/knobs.preset.ts`
- **Commit:** `3635db9`

### 5. [Rule 3] Brightness options are the table's percent column

- **Issue:** the plan names the five `BRIGHTNESS_TABLE` **words** (Dim…Full) as the options. `amount`
  is a rail kind in view.ts's total widget rule and a rail cannot render words; the words would have
  been invisible and the rail would have shown no readout at all.
- **Fix:** the options are the table's own `pct` column — `15/30/50/75/100` — which a rail shows as a
  number a visitor can act on. The stored field remains the detent step; the percent is the table's
  second column, never arithmetic invented here.
- **Files:** `src/lib/tune/knobs.preset.ts`
- **Commit:** `3635db9`

### 6. [Rule 3] `padReady()` is not awaited by the no-op gate

- **Issue:** the plan budgets `padReady()` in a `beforeAll` for test 5 and asks for its wall time.
- **Fix:** it is not needed. `compile` emits Lua without measuring it; only `measure`/`cost` reach
  `GridScript` (`_pad.ts:3042`). The 08-03 precedent applies and the project rules name it. The whole
  spec runs in **30 ms** and downloads no WASM, which keeps `test:quick` quick.
- **Files:** `src/lib/tune/knobs.preset.spec.ts`
- **Commit:** `3635db9`

### 7. [Rule 2] Defaults are derived and validated at import time rather than hand-written

- **Issue:** hand-written default indices can be silently wrong, and the plan's test 3 would then be
  asserting one hand-written number against another.
- **Fix:** every default is `mustIndex(options, <the card's shipped value>)`, which **throws** if the
  shipped value is not in its own option list. Test 3 still asserts `read(shipped) === default` for
  all 37 knobs and additionally states five defaults by hand (aurora speed 1, aurora band 1, ninepads
  notes 1, dial sensitivity 4, brightness 4) so a derivation that returned zero everywhere is caught.
- **Files:** `src/lib/tune/knobs.preset.ts`, `src/lib/tune/knobs.preset.spec.ts`
- **Commit:** `3635db9`

No other deviations. `src/vendor/` is byte-identical, no sibling repository was opened, `FRONT_DOOR`
is untouched, no `.svelte.spec.ts` file was created, and nothing was written to a device.

---

## Known Stubs

None. Every function in the three modules is fully implemented and exercised; nothing returns a
placeholder, an empty list where data was expected, or a TODO.

---

## Notes for the next plan (05-04)

- `presetKnobs(id)` builds a fresh descriptor list on every call. Wave 4's `model.ts` should memoise
  per entry id if it holds them across renders — the arrays are pure data and safe to cache.
- `PresetKnob.sheet` is `fitState`'s `pinned` argument, already correct per knob. Brightness is filed
  under `look` (as the plan specifies) because it is global and has no sheet of its own.
- `resetAll(entry)` restores `preset`, so `encodeStamp(resetAll(entry))` is the short form and
  SHARE's "a link to the defaults carries no stamp" rule is already true at this seam.
- `baseStateFor` throws `NoPadStateError` for a Lua entry. Every compiler-driven path should branch on
  `entry.source.kind` before calling it, never catch the throw.

## Self-Check: PASSED

Files claimed as created, verified on disk:

```
FOUND: src/lib/tune/state.ts
FOUND: src/lib/tune/state.spec.ts
FOUND: src/lib/tune/knobs.preset.ts
FOUND: src/lib/tune/knobs.preset.spec.ts
FOUND: src/lib/tune/knobs.lua.ts
FOUND: src/lib/tune/knobs.lua.spec.ts
```

Commits claimed, verified in the log:

```
FOUND: 2bc4f0b
FOUND: 3635db9
FOUND: 82b0dec
```
