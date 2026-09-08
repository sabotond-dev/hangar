---
phase: 10-redesign
plan: 11
subsystem: tune
tags: [tune-04, ident-01, mix-two, crossover, instrument-register, a-15]

requires:
  - phase: 10-redesign
    plan: 10
    provides: PREV_FILES 79 / PREV_TESTS 810 / PREV_E2E 97 / BASE_CHECK 579, sweep 4 19, PREV_SWEEP_WALL 130 s, and the canvas budget recorded for this plan to build on
provides:
  - "src/lib/tune/mix.ts: the pure crossover - child[k] = coin() ? a[k] : b[k] over four children, one surpriseIndices draw on one unheld knob, held knobs never crossed and never mutated, rng injected with NO default"
  - "src/lib/tune/mix.spec.ts with two gates: the seeded property over all 36 entries with knobs (9,000 runs, 36,000 results, 27,894 redrawn positions), and the four boundaries - every knob held, a equal to b, a synthetic one-knob rack, and starfield's two-option knob burning the twelve-draw bound"
  - "src/lib/ui/MixTwo.svelte: two candidate slots as TEXT, four results as live 9x9 minis in four real buttons in a role=group, the take that moves the previous state into THAT ONE, a pasted link decoded by parseHash and decodeFor, and a 160 ms opacity-only arrival"
  - "copy.ts's four MIX TWO strings (7 / 75 / 8 / 8) and mixChildName, plus A-15's forbidden-vocabulary scan over every string copy.ts can produce - BY STEM, because the first cut passed a planted 'Breeds'"
  - "MixTwo.svelte added to tune-ui.spec.ts's TUNING_COMPONENTS - the ninth, and the only hand-declared walk it belongs to - and named in aesthetic.spec.ts scan 1 as not a CRT file"
  - "PREV_FILES 80, PREV_TESTS 814, PREV_E2E 97, BASE_CHECK 582, PREV_SWEEP_WALL 92 s, sweep 4 19 - the carry-forward block for 10-12 onward"
affects: [10-12, 10-13, 10-13.1, 10-14, tune, ui]

tech-stack:
  added: []
  patterns:
    - "A WHOLE-WORD SCAN IS NOT A METAPHOR SCAN. The forbidden-vocabulary check asked whether the word list CONTAINED the root; the planted `Breeds` left it green, because `breeds` is not `breed`. A metaphor arrives inflected far more often than bare, so the match is by STEM and the found form is in the message beside the root"
    - "TWO CANVASES SAVED BY MAKING THE PARENTS TEXT. THIS ONE is already running as the hero six centimetres up the same panel, so a mini of it is a repetition that costs a canvas. The slots list their settings as words, which is also the only form in which two configurations can be DIFFERENCED at a glance"
    - "NON-DESTRUCTIVE IS A COUNT, NOT A CLAIM. `ontake` has exactly one call site, asserted with occurrences(); roll() is asserted not to reach it by slicing the source between the two function declarations"
    - "A CONSTANT IS WHAT A BUDGET COUNTS. The mix declares ONE <PadCanvas> inside a loop over four, so the budget is asserted against MIX_CHILDREN rather than against a literal 4 - a hard-coded 4 would agree with a component that had stopped looping over four"
    - "THE SWEEP IS THE CHEAPEST PROOF THAT A NEW FEATURE INVENTED NOTHING. Four totals reproduced exactly is a stronger statement about crossover than any assertion inside the crossover itself, because it is made from the other end of the space"

key-files:
  created:
    - src/lib/tune/mix.ts
    - src/lib/tune/mix.spec.ts
    - src/lib/ui/MixTwo.svelte
  modified:
    - src/lib/tune/copy.ts
    - src/lib/tune/copy.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/ui/aesthetic.spec.ts
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The two candidates are TEXT and the four results are pads. 11.6 costs MIX TWO at four canvases beside the hero and the picker's one result, and that is six on the worst entry; two more for the candidates would be eight, which is the number one-picker-per-panel was bought to avoid. THIS ONE is already on the screen as the hero"
  - "The metaphor scan matches by stem rather than by whole word, and the change was forced by running the negative check rather than by reading it. A scan that stayed green on `Breeds` was a scan that would have stayed green on `breeding`, `parents` and `mutated`"
  - "The results group is labelled BY THE CONTROL THAT PRODUCED IT (aria-labelledby to MIX TWO's own id). 13.4 gives this component four strings; a group label would be a fifth saying what the button above it already says"
  - "MIX TWO is not mounted, for the same reason the picker's result pad is not driven: Coverflow.svelte owns the page's SimHost and this phase promises not to edit it. Mounting it ALSO owes TuningRegion a reservation term that 10-UI-SPEC does not give it - deferred item 8"
  - "No disabled reason is rendered, because 13.4 gives MIX TWO four strings and no fifth where SURPRISE ME has its 53-character one. A component that writes its own sentence is the drift copy.ts exists to prevent - deferred item 9"
  - "mixIndices takes rng with NO default, stricter than surpriseIndices, because this module is named by a component. Zero Math.random CALLS exist anywhere under src/lib outside a spec"

requirements-completed: []

duration: 70min
completed: 2026-09-08
---

# Phase 10 Plan 11: MIX TWO Summary

**Two candidates, four results, one button — and the whole of the arithmetic is fifty lines in
`src/lib/tune/mix.ts`, where a seeded property test can reach it: 9,000 runs over all 36 entries
with knobs, 36,000 results, and not one index outside a knob's own options, not one held knob
crossed, not one result with two redrawn positions. The sweep then proves the same thing from the
other end, reproducing 10-08's four totals exactly — 19,502 / 24,576 / 44,078 and 234,784, over
budget 0. The two candidates are TEXT, deliberately, because two more canvases would be eight and
THIS ONE is already running as the hero six centimetres up the same panel. 80 files / 814 tests
(+1 / +4), 97 e2e (+0), check 582 (+3), sweep 4 19 unmoved at 92 s. A-15's forbidden-vocabulary scan
had to be re-cut: the first spelling matched whole words and stayed GREEN on a planted `Breeds`.**

## Performance

- **Duration:** ~70 min
- **Completed:** 2026-09-08
- **Tasks:** 2 (four commits — two feat, one docs for the deferred items, one docs for this summary)
- **Files created:** 3 · **Files modified:** 5 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                  |
| ----------------- | ---------- | ---------- | --------------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01. 80 is `BASE_FILES + 6`                               |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01. 814 is `BASE_TESTS + 34`                             |
| `PREV_FILES`      | **79**     | **80**     | **+1** — `src/lib/tune/mix.spec.ts` created                           |
| `PREV_TESTS`      | **810**    | **814**    | **+4** — mix.spec.ts 2, tune-ui.spec.ts +2. Split below               |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **run, and reproduced** — this wave's whole reachability claim         |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                       |
| `PREV_SWEEP_WALL` | **130 s**  | **92 s**   | **re-measured**: 92 s, and no `wrangler dev` was running this time    |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                       |
| `PREV_E2E`        | **97**     | **97**     | **+0** — 97 passed, exit 0, 1.4 min at `--workers 3`                  |
| `BASE_CHECK`      | **579**    | **582**    | **+3**: `mix.ts`, `mix.spec.ts`, `MixTwo.svelte`. Always 0 / 0        |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                             |

`npm run check` prints one line:
`COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`npm run test:quick | node scripts/check-counts.mjs 80 814` →
*"observed 80 files, 814 tests passed, 1 todo … matches the expected counts"*.

**The file count was declared correctly this time and it is worth saying why it needed saying.**
10-11 was the third plan in this phase to under-declare a spec file it creates; the plan's own
`<verification>` block carries the correction (*"the earlier `+0 / +2` omitted the file it creates"*)
and this execution's tasks sum to exactly `+1 / +4`. The phase now stands at `BASE_FILES + 6` /
`BASE_TESTS + 34` with four plans left to reach the declared `+7 / +45`.

---

## THE TEST SPLIT, AS IT LANDED

| File                           | Task 1 | Task 2 | Before | After |
| ------------------------------ | ------ | ------ | ------ | ----- |
| `src/lib/tune/mix.spec.ts`     | **+2** | +0     | 0      | **2** |
| `src/lib/tune/copy.spec.ts`    | +0     | +0     | 6      | **6** |
| `src/lib/ui/tune-ui.spec.ts`   | +0     | **+2** | 7      | **9** |
| `src/lib/ui/aesthetic.spec.ts` | +0     | +0     | 7      | **7** |
| `src/lib/tune/colour-picker.spec.ts` | +0 | +0   | 6      | **6** |
| **plan**                       | **+2** | **+2** |        | **+4** |

Three of this plan's assertions ride inside tests that already existed, which is the phase's habit
and is what keeps the per-file table in 10-VALIDATION true:

| Assertion                                                              | Rode inside                          |
| ---------------------------------------------------------------------- | ------------------------------------ |
| the four strings, their counts, and `mixChildName`'s three forms        | `copy.spec.ts` test 1 (labels and captions) |
| A-15's forbidden-vocabulary scan over every string `copy.ts` can produce | `copy.spec.ts` test 2 (the mechanical rules) |
| `MixTwo.svelte` is not a CRT file and names none of the vocabulary      | `aesthetic.spec.ts` scan 1 (the allowlist)   |

`tune-ui.spec.ts` reaches **9**, which is the number 10-10 said it would (*"10-11's +2 landing it at
9"*).

---

## THE FOUR STRINGS, COUNTED BY SCRIPT

| Constant       | Text                                                                       | Count  |
| -------------- | -------------------------------------------------------------------------- | ------ |
| `MIX_TWO`      | `MIX TWO`                                                                   | **7**  |
| `MIX_LINE`     | `Takes half its settings from each, at random. Nothing is sent to your ZONA.` | **75** |
| `MIX_THIS`     | `THIS ONE`                                                                  | **8**  |
| `MIX_THAT`     | `THAT ONE`                                                                  | **8**  |

Every one is the number §13.4 gives it. The two slot captions are the same length **and that is
asserted**: they head two slots side by side, and two labels of different widths would move the
second slot as the first one changed.

The fifth string is **composed, not written down**. `mixChildName(changes)` builds a result's
accessible name from the knobs whose position differs — `Take this: Speed 3, Colour 214 255 78.`
(38) — with a real no-change form, `Take this: the same settings as now.` (36), because with every
knob held all four results ARE the configuration on the screen and a name claiming otherwise would
lie. Four pictures of 81 lights carry no text of their own, so this is the whole of what a screen
reader gets; "Option 1" four times would be four indistinguishable buttons.

**The results group is labelled by the control that produced it** — `aria-labelledby` to MIX TWO's
own id — rather than by a group label of its own. §13.4 gives this component four strings, and a
fifth would say what the button above it has just said.

---

## A-15: THE SCAN THAT HAD TO BE RE-CUT, AND THE NEGATIVE CHECK THAT DID IT

The plan asked for a forbidden-word scan over the rendered strings, with the word found in the
message, and for it to be observed red on a planted metaphor. The first spelling tokenised each
string into words and asserted the word list did not **contain** each of the nine roots.

**Then the negative check was run, and it was green.** `Breeds half its settings from each…` left
the scan silent — `breeds` is not `breed` — and only the character-for-character equality in test 1
fired, reporting two sentences a reader has to diff by eye with no sentence saying which rule broke.
That is the same weakness 10-10's check 5 found on a hex and 10-09's check 4 found on U+2212, and it
is a weakness in the TEST rather than in the code.

Re-cut to match by **stem**, the same perturbation reports:

> `MIX_LINE says "breeds" - the mechanism, named where the result should be. A-15: no genetics metaphor reaches the interface. Two candidates, four results, one button`

A metaphor arrives inflected far more often than bare — `breeding`, `parents`, `mutated`,
`children` — so the roots are what is matched and the **found form** is in the message beside the
root it came from. The vocabulary is nine roots with a reason each, and both halves of its
non-vacuity are asserted: the list is nine, and the tokeniser really tokenises
(`"Take this: Speed 3."` → `["take", "this", "speed"]`).

**The loop is closed at the component end too, in two ways.** `tune-ui.spec.ts` asserts
`MixTwo.svelte` imports all four constants and transcribes none of them, so every word it renders
must come through `copy.ts` and therefore through the scan; and it strips the script, the style and
every tag and expression from the template and scans **what literal text is left** for the same
seven stems. `child` is on the forbidden list as user-facing text and permitted as an identifier —
`mix-child-0` is a test id — which is exactly why both scans read rendered strings and never code.

---

## THE PROPERTY, AND WHAT IT COUNTS BEFORE IT ASSERTS

`mix.spec.ts` test 1, printed by the run:

> `mix: 9000 seeded runs over 36 entries, 36000 results, 27894 redrawn positions`

| Counted first                       | Value      | Why it is counted first                                        |
| ----------------------------------- | ---------- | -------------------------------------------------------------- |
| entries with knobs                  | **36**     | all of them — every catalog entry declares a rack               |
| seeded runs                         | **9,000**  | 250 per entry, each with a fresh `a`, `b` and held set          |
| results inspected                   | **36,000** | `runs × MIX_CHILDREN`                                           |
| held knobs seen                     | > 0        | otherwise the held half of the test proves nothing              |
| redrawn positions                   | **27,894** | otherwise the mutation never ran                                |

Only then the four offender lists, every one empty: an index outside a knob's options, a held knob
that moved, a result with more than one redrawn position, and a result whose knob set is not the
entry's own. Each message carries the total count as well as the first five offenders, so a red run
says how big the failure is rather than only that there was one.

**"At most one redrawn position" rather than "exactly one", and that is a behaviour rather than a
hedge.** The mutation is a real `surpriseIndices` draw, and that function rejects a draw that
reproduces the position it replaced; on a two-option knob standing at one of them it can burn its
whole twelve-draw bound and hand the indices back. Test 2 drives exactly that path on `starfield`'s
`edge` knob with an rng that always draws where the knob already stands, and the four results come
back byte-equal to the state they started from.

**Test 2's four boundaries:**

| Case                        | What it asserts                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------- |
| every knob held             | all four results equal `a`, **and the rng is never called at all** (0 draws)        |
| `a` equal to `b`            | at most one knob differs, and every index is in range                              |
| a single-knob rack          | in range with nothing held; unmoved with the one knob held                         |
| a two-option unheld knob    | the exhaustion path: pure crossover, no mutation                                   |

**The single-knob case is synthetic, and the reason is measured rather than assumed.** The catalog
has no one-knob entry: the thinnest rack on the shelf is **three**, which is D-01's floor —
`starfield` and the faders declare two of their own and `knobs.preset.ts` adds the universal
brightness knob to reach it. So the rack is a descriptor written out in the test, with
`Math.min(...knob counts) === 3` asserted beside it, so the day an entry arrives with one knob the
comment goes red rather than merely stale.

---

## ZERO NEW REACHABLE STATES, PROVED BY THE SWEEP

`npm run test:sweep` → **4 files / 19 tests**, exit 0, **92 s** wall.

| Total                          | 10-08     | Here      |
| ------------------------------ | --------- | --------- |
| Pass A (compiler)              | 19,502    | **19,502** |
| Pass B (compiler)              | 24,576    | **24,576** |
| total states                   | 44,078    | **44,078** |
| Lua side                       | 234,784   | **234,784** |
| over budget                    | 0         | **0**     |
| Pass B colours excluded        | 0         | **0**     |

*"the dearest COLOUR-BEARING preset is ninepads at 640 of 908, 268 free"*, unchanged.

**This is the cheapest possible proof and it is made from the other end of the space.** A child that
fell outside an option range would be a state the sweep does not cover, and it would move one of
those four numbers. None moved. The module makes the same claim structurally — a position is read
through `positionOf`, which falls back to the knob's own default, so a candidate arriving from a
pasted link can never put a result outside its knob's options — but the sweep is the statement that
does not depend on believing the module.

**The wall clock is 92 s against 10-10's carried 130 s and 10-01's frozen 123 s.** No sweep file
changed; 10-10 recorded that a `wrangler dev` was running during its measurement and none was
running during this one.

---

## THE CANVAS BUDGET, RECONCILED RATHER THAN RECOUNTED

10-10 recorded the number for this plan to build on. It was re-read rather than trusted: the new
test opens `ColourPicker.svelte` and asserts it still declares **exactly one** `<PadCanvas>`, because
if the picker had grown a second pad then six would be seven and the reconciliation would be a
citation of a stale note.

| Term                             | Count | Where it is asserted                            |
| -------------------------------- | ----- | ----------------------------------------------- |
| the hero                         | 1     | —                                               |
| the picker's result              | **1** | re-read from `ColourPicker.svelte` here         |
| MIX TWO's results                | **4** | `MIX_CHILDREN`, imported, not a literal 4       |
| **total, worst entry**           | **6** | `HERO + PICKER_RESULT + MIX_CHILDREN`           |
| one picker per KNOB would be     | **8** | `HERO + 3 + MIX_CHILDREN` on console/forge/strip |

**And the two candidates are text, which is what keeps it six.** A mini for THIS ONE and one for
THAT ONE would be eight — the same eight one-picker-per-panel was bought to avoid — and THIS ONE is
already running as the hero six centimetres up the same panel, so a mini of it is a repetition that
costs a canvas. Words are also the only form in which two configurations can be *differenced* at a
glance, which is what the slots are for.

**Every one is `IntersectionObserver`-gated, and that is asserted as a property of the host rather
than of this component.** The results hand their elements up through `onready={onchild}`, and
`src/lib/sim/host.ts` is asserted to still construct the observer that gates every registered
canvas. The four ids are `${entry.id}-mix-0` … `-mix-3`, distinct from each other and from the
hero's — `register()` unregisters whatever holds an id first, so a shared id would blank the hero,
which is the failure 10-10 avoided with `-colour-result`.

---

## THE INSTRUMENT REGISTER, AND THE TWO LIMITS

| Amendment | What `MixTwo.svelte` does                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| A-37      | it is outside `.front-door`, so it is the **instrument** register throughout                                  |
| A-40      | no accent is spent on anything; the reserved list is still eight and the census still 21                     |
| **A-41**  | **MIX TWO is Secondary, so it is a pill OUTLINE** — 999px, 1px `--color-line`, transparent fill, 24px inline padding. Nothing else in the file is pilled, and that is asserted by **absence**: the list of selectors declaring `border-radius: 999px` is exactly `[".mix-two"]`. There is no Quiet or Bare control in this file, so the SAFE-02 regression A-41 exists to prevent is not available here |
| **A-44**  | **no `--font-mono` at all.** The list is seven with six spent and the seventh reserved for §19.1c's metadata block; this component displays no number that changes as a pointer moves, so it has no claim on it. Asserted by `not.toContain("--font-mono")` |

### The accent census — **21 over nine components, and the list is still eight**

| Component              | before | after |
| ---------------------- | ------ | ----- |
| `BudgetMessage.svelte` | 2      | 2     |
| `BudgetMeter.svelte`   | 1      | 1     |
| `ColourPicker.svelte`  | 7      | 7     |
| `CopyLink.svelte`      | 1      | 1     |
| `Knob.svelte`          | 9      | 9     |
| `KnobRack.svelte`      | 0      | 0     |
| **`MixTwo.svelte`**    | —      | **0** |
| `StampNotice.svelte`   | 0      | 0     |
| `TuningRegion.svelte`  | 1      | 1     |
| **total**              | **21** | **21**|

**A ninth component that moves the census by zero.** The pill is an outline and never a fill, the
results are bordered in `--color-line-soft`, and the focus ring is `app.css`'s `:focus-visible`,
which belongs to every control on the site and is declared in no component. There was nothing here
to spend accent on that would not have been a ninth entry on the reserved list. `--color-over`
appears nowhere in the file either, and that is asserted: the alarm red is X-01's three uses and all
three belong to a meter or a message.

---

## THE HAND-DECLARED WALK, AND WHICH ONE IT IS

**`MixTwo.svelte` belongs to `tune-ui.spec.ts`'s `TUNING_COMPONENTS`, and to no other.**
`device-ui.spec.ts`'s `DEVICE_COMPONENTS` is the six device components and `browse-ui.spec.ts`'s
`browseFiles()` is the six browse ones; MIX TWO is a tuning control and is neither. The list went
from eight to **nine**, its length assertion with it, and the reason is written where the list is:
a component omitted from a hand-declared list passes every walk in that file **silently**, which
would have left MIX TWO outside the compiler guard, the scroll prohibition, the 44px floor and the
accent census at once.

**The 44px floor is `includes("44px")` per FILE, so both axes are asserted per control as well.**
`.child` declares `min-inline-size: 44px` and `min-block-size: 44px` by name — the file-level walk
would have passed on the pill's own two declarations while a result sat at 30px.

---

## THE FOUR NEGATIVE CHECKS

| #   | Task | Perturbation                                        | Gate               | Result                                   |
| --- | ---- | --------------------------------------------------- | ------------------ | ---------------------------------------- |
| 1   | 01   | let a held knob be crossed (`if (false && held…)`)   | `mix.spec.ts`      | **red, naming the knob and the result**  |
| 2   | 01   | `Breeds` in the mix line                            | `copy.spec.ts`     | **green first — the scan was re-cut**    |
| 3   | 02   | `transform: translateY(4px)` in the arrival          | `tune-ui.spec.ts`  | **red, quoting §14 and §8.4**            |
| 4   | 02   | a `.crt-band` selector in `MixTwo.svelte`            | `aesthetic.spec.ts`| **red, naming the file and quoting §8.4** |

**1.** *"a HELD knob was crossed or redrawn. T1 (10-UI-SPEC 11.5) is what makes MIX TWO behave the
way a person expects - lock the colour you love, mix everything else - and a held knob takes THIS
ONE's position unchanged (23474 in all)"*, with the first five offenders naming the entry, the run,
the result index and the knob: `aurora run 1 result 0 knob colour moved from 804 to 3920`. Exactly
what the plan asked the message to say.

**2. This one found a weakness in the test rather than in the code, and the test was changed** — see
A-15 above. Re-cut, the same perturbation names the word and the rule.

**3.** *"the arrival declares "transform". §14 gives MIX TWO's results opacity and nothing else, and
§8.4 retired the reroll firing by name: a clip-path or a translate on the tune panel would move and
clip its own text"*. The scan runs over the keyframes AND over the `.child` rule, for `transform`,
`translate`, `scale` and `clip-path`.

**4.** *"src/lib/ui/MixTwo.svelte declares CRT vocabulary. §8.4: the tune panel is a Product surface
and the reroll firing is retired by name … The arrival is opacity, 160 ms, and nothing else:
expected [ 'crt-band' ] to deeply equal []"*. The assertion is placed **before** scan 1's general
allowlist loop on purpose: the general rule would catch it too, and would report a fact where this
reports the reason.

Every perturbed file was restored by its own **inverse edit** and confirmed byte-identical with
`sha256sum` before and after:

| File                        | Checks | sha256, before and after   | on disk now |
| --------------------------- | ------ | -------------------------- | ----------- |
| `src/lib/tune/mix.ts`       | 1      | `8d1f1663…`                | `8012d5c1…` |
| `src/lib/tune/copy.ts`      | 2      | `d17d39ff…`                | `d17d39ff…` |
| `src/lib/ui/MixTwo.svelte`  | 3, 4   | `eb593329…`                | `eb593329…` |

**`mix.ts` hashes differently today and the difference is `npm run format`, not the check.** The
before/after pair was taken either side of the perturbation on the same content, and matched; the
formatter then wrapped one long `Math.min(...)` call in `mutateOne` before the commit. The other two
files were already Prettier-clean, so their pairs are still the bytes on disk.

**No `git checkout`, `restore`, `stash` or `clean` was run at any point in this plan**, including to
restore a negative check.

---

## Deviations from Plan

### 1. [Rule 3 — blocking] The plan's single-knob boundary has no catalog entry to drive it

- **Found during:** Task 1, on the first run of `mix.spec.ts`
- **Issue:** test 2 walked the catalog for an entry with exactly one knob and found **none** —
  *"no single-knob entry is in the catalog, so this boundary is untested rather than satisfied:
  expected 0 to be greater than 0"*. D-01's three-knob floor is why: the thinnest rack is three.
- **Fix:** the case is driven from a synthetic one-knob descriptor, with
  `Math.min(...knob counts) === 3` asserted beside it and the reason written out, so the day an
  entry ships with one knob the test says the case can now come from the catalog.
- **Files modified:** `src/lib/tune/mix.spec.ts`
- **Commit:** `e71782b`

### 2. [Rule 1 — bug in a test] The metaphor scan matched whole words and passed its own negative check

- **Found during:** Task 1, negative check 2
- **Issue:** `Breeds` in the mix line left `copy.spec.ts` test 2 green. A scan that cannot see an
  inflection is a scan that would miss `breeding`, `parents`, `mutated` and `children`.
- **Fix:** matched by stem, with the found form in the message. Re-run and observed red.
- **Files modified:** `src/lib/tune/copy.spec.ts`
- **Commit:** `e71782b`

### 3. `src/lib/ui/ChosenPanel.svelte` is in `files_modified` and was not modified

- **Found during:** Task 2, reading the plan against what the tasks actually ask for
- **Issue:** the plan's frontmatter lists `ChosenPanel.svelte`; neither task's `<action>` asks for a
  change to it, and MIX TWO is not mounted (see below), so there was nothing to change. Editing the
  panel to make the list true would have been a layout decision taken silently.
- **Fix:** left byte-untouched. `git diff --stat e08f18c..HEAD -- src/lib/ui/ChosenPanel.svelte` is
  empty, and `tune-ui.spec.ts` test 7 still asserts its 152px region floor unmoved.

### 4. The plan's `Math.random` grep is over raw text, and the honest rule is over code

- **Found during:** the final verification block
- **Issue:** `grep -rn "Math.random" src/lib/ui src/lib/tune/mix.ts` is **not** empty. Every hit is a
  comment or the spec's own rule string — `glyph-field.ts` explains why it does not use it,
  `MixTwo.svelte` and `mix.ts` explain why they refuse a default, and `tune-ui.spec.ts` carries the
  assertion's message.
- **Fix:** the rule is asserted where it means something. `grep -rn "Math\.random("` over the whole
  of `src/lib` outside specs is **empty** — there is not one call — and `tune-ui.spec.ts` asserts it
  over comment-stripped code for every file under `src/lib/ui/`, which is the form that cannot be
  satisfied by deleting a paragraph.

---

## WHAT IS DEFERRED, AND THE THREE IDEAS THAT DO NOT SHIP

Two new items, both recorded in `deferred-items.md` (`d0a7d4e`):

**Item 8 — MIX TWO is built, testable and not mounted.** The results render their pads only when a
consumer supplies `onchild`, for the reason item 5 gives at length: `Coverflow.svelte` owns the
page's `SimHost` and this phase promises not to edit it. **One wiring closes both** — the picker's
result pad and the mix's four results want the same three lines and the same engine. But mounting it
is more than the hop: `TuningRegion.svelte` reserves the region's height as
`194 + 48r + 66w + 196p - 4`, asserted twice in `tune-ui.spec.ts` test 7, and 10-UI-SPEC gives MIX
TWO **no term in that arithmetic** — not in §11.6, not in §12, not in the region's derivation. A
block whose height changes when four results appear is exactly the reflow the reservation exists to
prevent, so the wave that mounts it owes the region a term or a placement outside the reserved box.

**Item 9 — MIX TWO can be disabled and §13.4 gives it no reason to show.** The control needs a
second candidate. `SURPRISE ME` is in the same position when every knob is held and has a
53-character sentence for it; MIX TWO has four strings and no fifth. This plan rendered **no**
reason rather than inventing one — the copy contract is a specification — and wrote down the two
ways out, the second of which (hand the entry's defaults as the second candidate) changes what the
first gesture *is*.

**T3, T5 and T6 do not ship in this phase, and 10-14 records all three:**

| Idea   | What it is                              | Why it is not here                                                                                                                            |
| ------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **T3** | `SURPRISE ME` as a shelf of five        | scope. Five candidates is five more canvases against a budget this plan just spent to six                                                       |
| **T5** | the hardware A/B audition               | **a SAFETY risk rather than a technical one.** It adds a class of click that **writes twice per gesture**, to hardware people paid for, and it cannot be verified without a device — which no agent in this project may touch |
| **T6** | the knob rack laid out on the pad itself | scope, and it would re-open every number in §12's sizing arithmetic                                                                             |

---

## Task Commits

| #   | Commit    | What                                                                                             |
| --- | --------- | ------------------------------------------------------------------------------------------------ |
| 1   | `e71782b` | task 1: `mix.ts`, `mix.spec.ts`, the four strings and `mixChildName`, A-15's scan re-cut by stem. 4 files, feat |
| 2   | `d9ca8fc` | task 2: `MixTwo.svelte`, the ninth entry in `TUNING_COMPONENTS`, the census, the two new gates, scan 1's naming. 3 files, feat |
| 3   | `d0a7d4e` | `deferred-items.md`: items 8 and 9. 1 file, docs                                                  |

**One commit that is not this plan's landed in the interval** and is recorded so the log reads
honestly: `5f8e5bb`, `docs(10)`, touching `10-CONTEXT.md` only. It touches no `src/`.

---

## Verification

| Gate                                                          | Result                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`              | one line: `COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`  |
| `npm run lint`                                                | clean — Prettier and ESLint                                                |
| `npm run test:quick \| node scripts/check-counts.mjs 80 814`  | *"observed 80 files, 814 tests passed, 1 todo … matches"*                  |
| `npm run test:sweep \| node scripts/check-counts.mjs 4 19`    | *"observed 4 files, 19 tests passed … matches"*; four totals reproduced    |
| `npx playwright test e2e/tuning*` at `--workers 3`            | **20 of 20**, exit 0, 22.2 s                                               |
| `npx playwright test` at `--workers 3`                        | **97 of 97**, exit 0, 1.4 min                                              |
| `grep -rn "Math\.random(" src/lib` outside specs              | empty — not one call                                                       |
| `git diff --stat HEAD -- src/vendor/ Coverflow.svelte surprise.ts` | empty                                                                 |

**The tuning e2e suites were run rather than assumed, because 10-10 found them 3-of-20 red while
`check`, `lint` and `test:quick` were all green.** They are 20 of 20 here. The helper hazard 10-10
named — `rails()` indexing knob rows positionally, invalidated when the picker took the first slot —
does not recur in this wave for a structural reason worth stating: **MIX TWO adds nothing to the
rack.** It is not mounted, the rack's row order is untouched, and `git diff` over
`KnobRack.svelte` and `TuningRegion.svelte` is empty. The full suite was run anyway.

`test-results/` was removed by hand and the `wrangler dev` started for the run was stopped by hand
after it. `npm run build` was run with no server holding `build/`, so the artefact the e2e suite
tested is this commit's — `postbuild: d9ca8fc9…`, the task-2 commit.

---

## Self-Check: PASSED

| Claim                                                              | Checked                          |
| ------------------------------------------------------------------ | -------------------------------- |
| `src/lib/tune/mix.ts` exists                                        | FOUND                            |
| `src/lib/tune/mix.spec.ts` exists                                   | FOUND                            |
| `src/lib/ui/MixTwo.svelte` exists                                   | FOUND                            |
| `.planning/phases/10-redesign/10-11-SUMMARY.md` exists              | FOUND                            |
| `e71782b`, `d9ca8fc`, `d0a7d4e` in the log                          | all three FOUND                  |
| `5f8e5bb` — the interval commit named above                         | FOUND                            |
| the three sha256 pairs                                              | reproduced, with the one formatter difference explained above |
