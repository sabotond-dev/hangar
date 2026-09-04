---
phase: 05-tuning-budgets-and-shareable-links
plan: 08
subsystem: ui
tags:
  [
    design-tokens,
    svelte5,
    accessibility,
    container-queries,
    radiogroup,
    range-input,
    identity-gate,
  ]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-02/05-03's src/lib/tune/view.ts - KnobView, KnobValueView, widgetFor, railSkin, the word tables and the positional readouts; src/lib/tune/copy.ts - EMPTY_RACK and the rest of the copy contract; 05-04's model.ts knobViews(), which resolves every KnobValueView.label to a display-safe form"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-07's re-measured quick baseline of 57 files / 641 tests (1 todo), sweep 3 / 13, e2e 24"
  - phase: 04-first-experience
    provides: "src/app.css's eight-token @theme block and :focus-visible ring; src/lib/ui/identity.spec.ts, the shipped gate this plan amends; NamePlate.svelte and KeepOnDevice.svelte as the house style for a component with real controls and real labels; src/lib/config-shape.spec.ts test 13, the chunk guard over src/lib/ui/"
provides:
  - "src/app.css: the ninth token --color-over: #ff3b30, scoped in a comment to its three permitted uses, with the header amended from eight tokens to nine"
  - "src/lib/ui/identity.spec.ts: the X-27 amendment - nine tokens, three permitted hexes, alphaOf untouched, the favicon regex untouched, five prose/title sites moved, still 6 tests"
  - "src/lib/ui/Knob.svelte - one component, three skins (swatch row, word row, rail with dot and detent variants) over real labelled form controls, with the default marker and the three reset gestures"
  - "src/lib/ui/KnobRack.svelte - the container, the row/stacked switch, the empty-rack line, and the region's two-constant height arithmetic written down"
  - "A CORRECTION to the approved 05-UI-SPEC: the tuning region has TWO height constants, 194 and 246, because the actions row is flex-wrap: wrap and is 44px on one line but 96px on two"
  - "A FINDING for the designer: the spec's hover target for an unselected rail dot composites to exactly its rest colour, so that hover is a no-op as specified"
affects: [05-09, 05-10, 05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A shipped gate from a signed-off phase is widened in ONE commit, with the reason, the arithmetic and the list of what did NOT move written into the file's own header - so the next reader can tell a deliberate amendment from a weakened guard"
    - "The invisible-control focus ring: an opacity-0 range input and a visually-hidden radio both draw Phase 4's ring on their painted wrapper via :has(:focus-visible), so no control in the tree is focusable without a visible ring"
    - "The widget rule is resolved once in $lib/tune/view and consumed, never re-derived in a component - the component has no unknown-widget branch because the rule is total"
    - "Geometry that a later wave depends on is committed as a derivation with its arithmetic and an explicit forward reference to the plan that measures it, rather than as a bare number"

key-files:
  created:
    - src/lib/ui/Knob.svelte
    - src/lib/ui/KnobRack.svelte
  modified:
    - src/app.css
    - src/lib/ui/identity.spec.ts

key-decisions:
  - "The X-27 amendment moved FIVE prose/title sites, not four. The plan's table named four; the fifth is the assertion message inside the very hex loop the amendment widens. After the edit `one of the two approved colours` appears once (the favicon loop, correctly untouched) and `one of the three approved colours` appears once (the app.css loop)"
  - "Both negative checks were observed red before the widened gate was trusted, in both directions: a tenth token failed the ladder naming `--color-tenth`, and a fourth hex literal failed the hue loop naming `#3b82f6`"
  - "The `@container (width < 220px)` rule lives in Knob.svelte, not KnobRack.svelte. The rack ESTABLISHES the container (`container-type: inline-size`); the query that reflows a row is that row's own geometry, and putting it in the rack would have meant a `:global()` selector reaching into a child component's markup"
  - "`Default is {word or position}.` is authored in Knob.svelte rather than added to copy.ts. It belongs to the UI spec's Accessibility Contract, not its Copywriting Contract, and copy.spec.ts asserts that file character-for-character against the copy table - a row that is not in the table has no home there. copy.ts was also not in this plan's files_modified"
  - "The rail's `min-inline-size: 120px` was removed after being written. The 120px control floor is honoured by the container query that stacks every row below 220px; a min-inline-size on the rail could have pushed the integer readout out of the row, and D-11 forbids horizontal scroll, so nothing in the rack may overflow"
  - "The dot rail iterates POSITIONS (`view.values.map((_, at) => at)`), not values: a painted dot carries no per-value data, and the accessible name of every position is already on the range input's aria-valuetext"

patterns-established:
  - "Pattern: the reset-gesture row. Area gestures (double-click, long press) go on the row container behind a documented svelte-ignore; their keyboard equivalents (Delete, Backspace) go on the real control, so no capability is pointer-only and the container never becomes a tab stop"
  - "Pattern: MediaQuery from svelte/reactivity for a capability that can change mid-session (`(pointer: coarse)`), matching NamePlate's live prefersReducedMotion rather than a one-shot read in onMount"

requirements-completed: []
requirements-contributed: [TUNE-01, TUNE-05, TUNE-06]

# Metrics
duration: 31min
completed: 2026-09-04
---

# Phase 5 Plan 08: The Ninth Token and the Knob Summary

**The site gained a third colour on purpose — `--color-over: #ff3b30`, scoped to three uses, with the Phase 4 test that forbade it amended in the open in the same commit — and the phase gained the control it is about: one `Knob.svelte` that renders twelve knob kinds as three skins over real labelled form controls, inside a `KnobRack.svelte` that reflows against the panel and never scrolls sideways.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-09-04T13:44Z
- **Completed:** 2026-09-04T14:15Z
- **Tasks:** 3 of 3
- **Files modified:** 4 (2 created, 2 modified)

## Observed totals

Baseline is `05-07-SUMMARY.md`: quick **57 files / 641 tests (1 todo)**, sweep **3 / 13**, e2e **24**.
The quick suite was **re-measured on a clean tree at `d75612e`, before any file in this plan was
touched**, and the baseline reproduced exactly:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 57 641      (clean tree, d75612e)
check-counts: observed 57 files, 641 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
```

| Suite        | Baseline (05-07)              | After 05-08                       | Delta         |
| ------------ | ----------------------------- | --------------------------------- | ------------- |
| `test:quick` | 57 files / 641 tests (1 todo) | **57 files / 641 tests (1 todo)** | **unchanged** |
| `test:sweep` | 3 files / 13 tests            | **3 files / 13 tests**            | **unchanged** |
| `test:e2e`   | 24 passed                     | 24 (carried, **not re-measured**) | **unchanged** |

Final, on the tree as committed:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 57 641
check-counts: observed 57 files, 641 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts

npm run check 2>&1 | tail -2
COMPLETED 486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint    ->  exit 0
```

**Zero delta is the correct result and is what the plan predicted.** This plan adds no spec file —
there is no browser Vitest project and no `.svelte.spec.ts` may exist — so the two new components are
proved here by `svelte-check`, by the structural specs they must not break, and by the greps below.
Their behavioural proof arrives in waves 10 to 12.

**e2e was not re-measured.** Nothing in the routed tree imports `Knob.svelte` or `KnobRack.svelte`
yet; `TuningRegion.svelte` (05-10) is what mounts them. Running Playwright would have re-observed 24
against an artifact these two files cannot reach. `PREV_E2E` for 05-09 onward remains **24**.

## Task Commits

1. **Task 5-08-01: the ninth token, and the Phase 4 gate amended on purpose** — `be16c77` (feat)
2. **Task 5-08-02: Knob.svelte — one component, three skins** — `f574b64` (feat)
3. **Task 5-08-03: KnobRack.svelte — the grid that wraps and never scrolls** — `717f9a1` (feat)

## Files Created/Modified

- `src/app.css` — the `@theme` block gains `--color-over: #ff3b30` with its three-use scope and its
  two contrast ratios beside it; the header comment moves from "two colours, no third hue, red on a
  ninth token" to "nine tokens, one scoped alarm, red on a **tenth** token or a **fourth** hue".
- `src/lib/ui/identity.spec.ts` — the X-27 amendment plus a header paragraph recording that this is a
  deliberate widening of a signed-off phase's gate, with the reason and, more usefully, the closed
  list of what did **not** move.
- `src/lib/ui/Knob.svelte` (612 lines) — one component, three skins, real controls.
- `src/lib/ui/KnobRack.svelte` (133 lines) — the container, the stack switch, the empty line, and the
  region's height arithmetic in a comment.

---

## Task 1 — the ninth token, and X-27

### The five sites, as applied

The plan's table named four prose/title sites and then, in the same paragraph, named a fifth: the
assertion message inside the very hex loop the amendment widens. All five moved in commit `be16c77`.

| #   | Site                       | Before                                                                    | After                                                                                       |
| --- | -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | the `TOKENS` doc comment   | `The approved ladder — 04-UI-SPEC.md, Color. Eight tokens, no ninth.`      | `The approved ladder — 04-UI-SPEC.md Color plus 05-UI-SPEC X-27's alarm. Nine tokens, no tenth.` |
| 2   | test title                 | `the token ladder is exactly the eight tokens the spec approved`           | `the token ladder is exactly the nine tokens the specs approved`                             |
| 3   | comment                    | `// Nothing outside the eight.`                                           | `// Nothing outside the nine.`                                                               |
| 4   | test title                 | `the ground is true black and nothing declares a third hue`               | `the ground is true black and the only third hue is the over-budget alarm`                   |
| 5   | assertion message, hex loop | `` `${hex} is one of the two approved colours` ``                        | `` `${hex} is one of the three approved colours` ``                                          |

Observed, on the committed file:

```
grep -c "Eight tokens, no ninth"          src/lib/ui/identity.spec.ts  ->  0
grep -c "eight tokens the spec approved"  src/lib/ui/identity.spec.ts  ->  0
grep -c "Nothing outside the eight"       src/lib/ui/identity.spec.ts  ->  0
grep -c "nothing declares a third hue"    src/lib/ui/identity.spec.ts  ->  0
grep -c "nine tokens the specs approved"  src/lib/ui/identity.spec.ts  ->  1
grep -c "one of the two approved colours"   src/lib/ui/identity.spec.ts  ->  1   (the favicon loop)
grep -c "one of the three approved colours" src/lib/ui/identity.spec.ts  ->  1   (the app.css loop)
grep -c "  it("                            src/lib/ui/identity.spec.ts  ->  6   (unchanged)
```

The favicon test's own two-hue regex `/^(#000000|#d6ff4e)$/` is present exactly once and untouched.
No red enters the mark.

### The two negative checks, both observed red

**A tenth token.** Added `--color-tenth: rgb(214 255 78 / 0.9)` to the `@theme` block:

```
AssertionError: expected [ '--color-accent', …(9) ] to deeply equal [ '--color-accent', …(8) ]
+   "--color-tenth",
 Tests  1 failed | 5 passed (6)
```

**A fourth hue.** Replaced `color: var(--color-ink)` in the `body` rule with a literal `#3b82f6`,
so the file carried four distinct hexes rather than three:

```
AssertionError: #3b82f6 is one of the three approved colours: expected '#3b82f6' to match /^(#000000|#d6ff4e|#ff3b30)$/
 Tests  1 failed | 5 passed (6)
```

Both mutations were reverted; `git diff` against the backup is empty and `npx vitest run --project
server src/lib/ui/identity.spec.ts` reports `6 passed (6)`.

_(A third mutation was run in passing — retyping `--color-over` itself as `#3b82f6` — which failed
**two** tests, the per-token value assertion and the hue loop. It is recorded only because it was
observed; the two checks the plan asked for are the ones above.)_

---

## Task 2 — `Knob.svelte`

Three skins over three kinds of real control, chosen by `view.widget` and `view.skin`, both of which
arrive already decided by `$lib/tune/view`'s `widgetFor` / `railSkin`. There is no unknown-widget
branch in the file because the rule is total.

- **rail** — one `<input type="range" min="0" max="n-1" step="1">` at `opacity: 0`, absolutely
  positioned over the painted dots (`n ≤ 8`) or detent track (`n ≥ 9`) and filling the 44px box, with
  a real `<label for>`. `aria-valuetext` carries `KnobValueView.label`, which `model.ts` already
  resolved to a word, a note name, the raw integer or `Position i of n` — never a Lua literal.
- **word row** — `role="radiogroup"` + `aria-labelledby`, real radios inside `<label>`s, one tab stop.
- **swatch row** — the same markup; the accessible name is the hue word plus position (`Cyan, 1 of 5`)
  and the visible content is a 28×28 square of real firmware RGB inside a 44×44 hit box. Nothing
  gradients, tints, glows or filters it; the hairline, the ring and the label stay on the ladder.

Focus rings are drawn on the **painted wrapper** in both invisible-control cases:
`.rail:has(:focus-visible)` for the range input and `.option:has(:focus-visible)` for the
visually-hidden radio, both using Phase 4's exact `2px solid var(--color-accent)` at `4px` offset.

Home is a 2px `--color-line-soft` dot 4px below the default option on all three skins, plus
`aria-describedby` on the group once. The four offsets are derived in a comment from the 44px box's
22px centre: dot rail 30px, detent 32px, swatch 40px, word 33px.

### Observed

```
npm run check 2>&1 | tail -2   ->  COMPLETED 486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                   ->  exit 0
npx vitest run --project server src/lib/config-shape.spec.ts  ->  14 passed (14)

grep -c 'type="range"'   src/lib/ui/Knob.svelte  ->  2
grep -c 'type="radio"'   src/lib/ui/Knob.svelte  ->  2
grep -c 'role="slider"'  src/lib/ui/Knob.svelte  ->  0
grep -c 'overflow-x'     src/lib/ui/Knob.svelte  ->  0
grep -c '44px'           src/lib/ui/Knob.svelte  ->  12
grep -c 'dblclick'       src/lib/ui/Knob.svelte  ->  1
grep -c 'Delete'         src/lib/ui/Knob.svelte  ->  4
grep -c 'Backspace'      src/lib/ui/Knob.svelte  ->  4
grep -c '500'            src/lib/ui/Knob.svelte  ->  3
grep -c 'data-testid="knob-' src/lib/ui/Knob.svelte  ->  1
```

`Escape` appears on exactly three lines, all of them comments saying it is deliberately not handled
(lines 34, 35 and 136 as committed). Nothing in the file binds it.

Comment-stripped forbid scan (the house rule — strip before scanning, so a comment can never fail a
structural check):

```
src/lib/ui/Knob.svelte      color-over=0  overflow-x=0  vendor=0  intechstudio=0  lib/pad=0
src/lib/ui/KnobRack.svelte  color-over=0  overflow-x=0  vendor=0  intechstudio=0  lib/pad=0
```

`--color-over` appears once in `Knob.svelte`'s raw text, in the header paragraph stating that a knob
is never red. It appears zero times in the code.

---

## Task 3 — `KnobRack.svelte`

The rack owns two things: `container-type: inline-size`, so rows reflow against **the panel** rather
than the viewport, and the one stacking decision that is not width-driven — a word row always stacks,
at every width, so its options get the full content width to wrap into. Row gap 4px in a flex column,
which drops the trailing gap by construction rather than by subtracting it twice. The empty case
renders `EMPTY_RACK` from `copy.ts` and nothing else; the rack renders no button, because
`SURPRISE ME` and `RESET ALL` are the region's.

### Observed

```
grep -c 'container-type'         src/lib/ui/KnobRack.svelte  ->  2
grep -c 'overflow-x'             src/lib/ui/KnobRack.svelte  ->  0
grep -c '194'                    src/lib/ui/KnobRack.svelte  ->  3
grep -c '246'                    src/lib/ui/KnobRack.svelte  ->  2
grep -c '251'                    src/lib/ui/KnobRack.svelte  ->  3
grep -c '379'                    src/lib/ui/KnobRack.svelte  ->  2
grep -c 'measured in 05-10'      src/lib/ui/KnobRack.svelte  ->  1
grep -c 'data-testid="knob-rack"' src/lib/ui/KnobRack.svelte ->  1
```

### The derivation, repeated here as the plan requires

A row-layout knob is `44 + 4 = 48`. A word row is `62 + 4 = 66` (a 14px label line box, a 4px gap, a
44px control). The rack drops its trailing gap. With no messages, `r` row-layout knobs and `w` word
rows:

> `194 + 48r + 66w − 4` — the actions row fits on one line
> `246 + 48r + 66w − 4` — the actions row wraps to two. `246 = 194 + 44 + 8`: the second 44px row plus
> the 8px `sm` gap.

**Where the switch is.** Both labels are Micro: 12px, weight 600, uppercase, `letter-spacing: 0.18em`
= 2.16px after every character, inside `padding-inline: 16px` (32px of chrome per button), with the
8px gap between them. `SURPRISE ME` is ten caps and a space; `RESET ALL` is eight caps and a space.
At Quicksand 600's uppercase advance the pair needs **≈ 251px** of inline space (≈ 131 + ≈ 112 + 8).
The rack's container is the region's content box — the viewport less 48px of page padding, 48px of
panel padding and 32px of region padding — so the row wraps below a content box of ≈ 251px, which is
**below a viewport of ≈ 379px**. It therefore wraps at 320px (content box 192px) and at 375px (247px),
and does not at 420px (292px).

**This plan claims NO measured wrap width.** The 251px is arithmetic over a font whose exact advance
widths were not measured, and nothing in the tree renders `SURPRISE ME` or `RESET ALL` until
`TuningRegion.svelte` exists. The comment carries the literal forward reference `measured in 05-10`.
05-10 task 1 measures it in a browser and corrects both that comment and its own; if the measurement
disagrees with 379px by more than a few pixels it wins, and 05-10's SUMMARY says so.

---

## Deviations from Plan

### Corrections recorded in the open

**1. [Correction to the approved 05-UI-SPEC] The tuning region has two height constants, not one.**

- **Found during:** Task 3, as the plan itself anticipated and instructed.
- **Issue:** `05-UI-SPEC.md` § Vertical arithmetic bills the actions row at a flat 44px and derives a
  single `194` constant, while the same document's § `SURPRISE ME` and `RESET ALL` gives that row
  `display: flex; flex-wrap: wrap; gap: 8px`, and its § Spacing table defines `sm` 8px as "gap between
  `SURPRISE ME` and `RESET ALL` **when they wrap**". The spec provides for the wrap everywhere except
  in the one table that adds the heights up.
- **Correction:** both constants ship — `194 + 48r + 66w − 4` and `246 + 48r + 66w − 4` — with
  `246 = 194 + 44 + 8` written out. This is the arithmetic the spec's own rules produce.
- **Files modified:** `src/lib/ui/KnobRack.svelte` (header comment). **Commit:** `717f9a1`.
- **Who acts on it:** 05-10, whose `tune-ui.spec.ts` asserts the shipped two-constant form.

**2. [Finding — 05-UI-SPEC § States] The unselected-dot hover is a no-op as specified.**

- **Found during:** Task 2, writing the rail's hover rule.
- **Issue:** the spec's States table says an unselected dot goes `--color-line` → `--color-accent` at
  40% opacity on hover. `--color-line` **is** `rgb(214 255 78 / 0.4)`, and the accent at 40% opacity
  composites to exactly that over black. The two are the same colour, so the hover changes nothing.
- **What was shipped:** the declaration exactly as the contract words it
  (`background: var(--color-accent); opacity: 0.4`), with a comment naming the finding. Inventing a
  visible hover colour would have authored a value outside the two-colour ladder, which is not this
  plan's to do.
- **Files modified:** `src/lib/ui/Knob.svelte`. **Commit:** `f574b64`.
- **Who acts on it:** the designer, or 05-10. The word row's and the swatch row's hovers are real
  changes and are unaffected; only the rail's is inert.

### Auto-fixed issues

**3. [Rule 3 — Blocking] The rail's `min-inline-size: 120px` could have overflowed the row.**

- **Found during:** Task 2, before the first commit of the file.
- **Issue:** a 120px floor on `.rail`, plus a 12px gutter and an `auto` readout column, can exceed the
  control column at container widths just above 220px. There is no `overflow-x` anywhere, so the
  result would be painted overflow, not a scrollbar — but D-11's rule is that nothing in the rack goes
  sideways at any width.
- **Fix:** removed. The spec's 120px control floor is honoured by the container query that stacks
  every row below 220px, which is where the 120px number comes from in the first place (at a 220px
  container the label column is 88px and the gutter 12px, leaving exactly 120px).
- **Files modified:** `src/lib/ui/Knob.svelte`. **Commit:** `f574b64`.

**4. [Rule 3 — Blocking] `a11y_no_static_element_interactions` on the knob row.**

- **Found during:** Task 2, `npm run check`.
- **Issue:** the row carries `ondblclick` and four pointer handlers because "double-click anywhere on
  the control area" and "long press anywhere on it" are area gestures over several painted elements.
  `svelte-check` warned once.
- **Fix:** a `svelte-ignore a11y_no_static_element_interactions` with the explanation in a **separate**
  preceding comment (PadCanvas.svelte's established house rule: text after the rule name inside a
  `svelte-ignore` is parsed as further rule names and `svelte/no-unused-svelte-ignore` then reports one
  error per word). The ignore is justified rather than convenient: a role would put a meaningless node
  in front of the real labelled control, a `tabindex` would add a dead tab stop before every knob, and
  every gesture the row carries already has a keyboard equivalent (`Delete`, `Backspace`) on the
  control itself.
- **Files modified:** `src/lib/ui/Knob.svelte`. **Commit:** `f574b64`.

### Departures from the letter of an acceptance criterion

**5. `grep -c "alphaOf" src/lib/ui/identity.spec.ts` moved from 5 to 6.**

The criterion asked for the same number before and after, and said to record both. Both are recorded:
**5 before, 6 after.** The extra line is prose — the header paragraph that states, in as many words,
that `alphaOf()` is **not** applied to `--color-over`. The invariant the criterion protects is intact
and is measurable more directly:

```
grep -c 'alphaOf("' src/lib/ui/identity.spec.ts  ->  4   (unchanged)
```

The four call sites are `--color-ink`, `--color-ink-quiet`, `--color-ink-dim` and `--color-line`, the
same four members the AA-on-black loop had before. Naming the helper in the note was judged worth one
grep line: a note that says "the alpha helper" rather than `alphaOf()` is a note the next reader has
to go and resolve.

**6. `KnobRack.svelte`'s header does not spell the two forbidden declarations.**

The header paragraph about horizontal scroll originally quoted `overflow-x: auto` and
`overflow-x: scroll` by name, which made the plan's `grep -c "overflow-x" → 0` acceptance criterion
read `2` against the raw file. The paragraph was reworded to describe them rather than spell them, so
the grep reads the CSS and not the prose. The rule is unchanged and the comment says why it is worded
that way.

### Everything else

Nothing else deviated. `--color-over` is declared and used nowhere; `alphaOf` is not applied to it;
the favicon regex is untouched; the `rgb()`-arguments assertion is untouched; the test count is 6; no
`.svelte.spec.ts` was created; no npm dependency, icon or SVG was added; nothing under `src/vendor/`
was touched.

## Known Stubs

None that block this plan's goal. Two forward seams, both intended and both named in the plan:

- `Knob.svelte` and `KnobRack.svelte` are **not mounted by any route yet**. `TuningRegion.svelte`
  (05-10) is what renders them into `ChosenPanel.svelte`'s region 4. This is the plan's design, not an
  omission: this wave ships the control, wave 10 ships the region that holds it.
- `--color-over` is **declared and unused**. Its three permitted uses are `BudgetMeter.svelte`'s bar
  fill/outline and numerals/percentage, and `BudgetMessage.svelte`'s 2px left rule — all of which are
  wave 9's. The token had to land first because the gate amendment that admits it is this plan's.

## Notes for the next wave

- **The quick baseline for 05-09 onward is `57 641`**, sweep `3 13`, e2e `24`. This plan moved none of
  them.
- **`identity.spec.ts` is now a nine-token, three-hex gate** and still guards in both directions. A
  wave that needs a tenth token or a fourth hue amends it the same way this one did — in the open, in
  the same commit, with the negative checks observed — or it does not amend it.
- **The two components take callbacks, not stores.** `Knob` takes `onchange(index)` / `onreset()`;
  `KnobRack` takes `onchange(id, index)` / `onreset(id)`. 05-10 wires those to `$lib/tune/model`'s
  Tuner, which is the only place allowed to import the compiler side.
- **`Knob.svelte` imports only `$lib/tune/view` (type-only); `KnobRack.svelte` imports `$lib/tune/view`
  (type-only) and `$lib/tune/copy`.** `config-shape.spec.ts` test 13 is green at 14 passed.
- **Wave 10 owes two measurements**: the real wrap width of the actions row (correcting the ≈ 251px /
  ≈ 379px derivation in `KnobRack.svelte`'s header and its own), and a browser check that the rail
  hover finding above is what a designer wants shipped.

## Self-Check: PASSED
