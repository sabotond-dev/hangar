---
phase: 05-tuning-budgets-and-shareable-links
plan: 10
subsystem: ui
tags:
  [
    svelte5,
    snippets,
    container-queries,
    accessibility,
    live-region,
    layout-stability,
    lazy-loading,
  ]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-02's src/lib/tune/view.ts (KnobView, TuneView, MeterView) and src/lib/tune/copy.ts (TUNING_CAPTION, SURPRISE_ME, RESET_ALL, METERS_UNAVAILABLE, the five live-region builders, tryOnBudgetReason)"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-03's src/lib/tune/idle.ts onIdle - requestIdleCallback with the 200ms setTimeout fallback Safari needs (D-08)"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-04's src/lib/tune/model.ts buildTuner, Tuner, LadderView and OverBudgetView - reached ONLY through await import()"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-08's Knob.svelte and KnobRack.svelte, and the two-constant height derivation this plan measured"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-09's BudgetMeter, BudgetMessage, StampNotice and CopyLink, and the quick baseline of 57 files / 641 tests (1 todo), sweep 3 / 13, e2e 24"
  - phase: 04-first-experience
    provides: "ChosenPanel.svelte's reserved region and panel geometry, TryOnDevice.svelte's state machine and honesty line, KeepOnDevice.svelte, the secondary button treatment, and config-shape.spec.ts tests 13 and 14"
provides:
  - "src/lib/ui/TuningRegion.svelte - the six bands, the dynamically imported tuner, the two-constant height reservation and the one polite live region"
  - "src/lib/ui/ChosenPanel.svelte's `tuning` and `share` snippet props - the seam plan 05-11 wires Coverflow into"
  - "src/lib/ui/TryOnDevice.svelte's `budgetReason` prop and its three-string one-cell honesty slot"
  - "src/lib/ui/tune-ui.spec.ts - 5 structural tests over the seven components this phase added"
  - "MEASURED: SURPRISE ME lays out at 134.453125px and RESET ALL at 114.546875px, so the actions row needs exactly 257px of region content box - one line at 257, wrapped at 256, a viewport of about 385px"
  - "MEASURED: toggling the over-budget reason at 375, 420 and 900px viewports moves neither the primary control, nor the honesty slot, nor the tuning region by a single pixel"
  - "OBSERVED: config-shape.spec.ts test 13 does NOT catch a static import of $lib/tune/model - tune-ui.spec.ts test 1 is what closes that gap"
affects: [05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A CSS container query as a height switch: `.region { container-type: inline-size }` wrapping a child that carries `min-block-size: calc(162px + var(--tune-rack))`, with the wrapped constant in an `@container (width < 257px)` block. The container cannot query itself, which is why the reservation lives on the child"
    - "A geometry number is DERIVED in one plan's comment and MEASURED in the next, and the measurement rewrites both comments. The forward reference carried the literal `measured in 05-10` so a grep could prove the debt was paid"
    - "A sizing twin rendered even when its string does not exist yet: the honesty slot's third cell renders tryOnBudgetReason(\"Setup and Timer\") whenever no real reason is present, because a reservation that appears with the content it reserves for prevents nothing"
    - "A structural spec that closes a gap in an older structural spec, with the gap OBSERVED rather than assumed: the static import was added, config-shape test 13 stayed green, and the new test went red"

key-files:
  created:
    - src/lib/ui/TuningRegion.svelte
    - src/lib/ui/tune-ui.spec.ts
  modified:
    - src/lib/ui/ChosenPanel.svelte
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/KnobRack.svelte
    - src/lib/tune/copy.spec.ts

key-decisions:
  - "The actions row wraps below a region content box of 257px, MEASURED, not 262px. The interrupted first run left a comment claiming 262px/261px; that number was never taken - the scratch route it would have been taken through did not compile, because ChosenPanel had no `tuning` snippet yet. The real render gives 134.453125 + 114.546875 + the 8px gap = exactly 257.0px, so the container query is `width < 257px`. The derivation's 251px was 6px narrow and all three of its conclusions survive"
  - "ChosenPanel's `.caption` and `.body` rules were DELETED rather than given a 14px line box inside the tuning region. The plan asked for an override, but the caption moved into TuningRegion.svelte, which already declares `line-height: 14px` on it; a scoped `.reserved .caption` rule cannot reach a child component's element in Svelte, and a rule with no matching element is an unused-selector warning. Every other Phase 4 caption keeps the 1.2 ratio, ZONA IDENTIFIED included"
  - "The honesty slot's precedence is capability > identified > budget. The UI spec only settles capability over budget; `identified` was placed above budget because in this phase the control does nothing but identify, so once it has, the budget is not what is stopping it - and the over-budget configuration still has the message block beside the knobs saying so in full"
  - "TryOnDevice.svelte imports tryOnBudgetReason from $lib/tune/copy STATICALLY. That module imports nothing at all, its specifier carries none of test 13's markers, and the alternative - transcribing the sentence to size the twin on - is exactly the drift the copy contract exists to prevent"
  - "tune-ui.spec.ts test 2 forbids the `overflow` shorthand with `auto` or `scroll` as well as `overflow-x`. The plan specified only the axis property; the shorthand sets the inline axis just as surely, and a test that reads only the axis property would report D-11 as covered while leaving the loophole open"
  - "SURPRISE ME now clears message slot A, which the plan did not list. Slot A says \"These knobs came with the link\"; a roll moves every knob, so the sentence stops being true at exactly the moment RESET ALL and a knob turn already clear it for"

patterns-established:
  - "Pattern: when a resumed plan inherits an unverified measurement, re-take it rather than trusting it. The inherited 262px was internally plausible, sat in a well-written paragraph, and was wrong by 5px"
  - "Pattern: prove a no-jump claim by toggling the state in a real browser and comparing bounding boxes at three viewports, rather than by asserting the CSS that ought to cause it"

requirements-completed: []
requirements-contributed:
  [TUNE-01, TUNE-02, TUNE-03, TUNE-04, TUNE-05, TUNE-06, TUNE-07]

# Metrics
duration: 32min
completed: 2026-09-04
---

# Phase 5 Plan 10: The Tuning Region Summary

**The region Phase 4 reserved is full — six bands, a compiler that arrives only through `await import`, two height constants chosen by a container query at a wrap width that was finally measured rather than guessed (257 px, not the 262 px the interrupted run left behind) — and crossing 908 in a real browser at three viewports moves the primary control, the honesty slot and the region by exactly zero pixels.**

## What the interrupted run left, and what was kept

The previous executor was killed by a rate limit after writing `src/lib/ui/TuningRegion.svelte`
(699 lines) and a scratch route at `src/routes/dev/tune-measure/`. No commit had landed.

**Kept:** the whole component. It type-checked clean on its own — the only `svelte-check` error in the
tree was in the scratch route, which used a `tuning` snippet that `ChosenPanel` did not yet have, and
that error is itself the evidence below.

**Corrected:** the file claimed a measurement it could not have taken. Its header said the buttons
"share one line down to a region content box of 262px and wrap at 261px", and the container query
said `width < 262px`. That measurement was impossible: the only route that mounted the region did not
compile, so nothing had ever rendered `SURPRISE ME` beside `RESET ALL`. `KnobRack.svelte` still
carried the literal `measured in 05-10`, which is what a paid debt does not look like. The number was
re-taken from scratch (below) and both comments and the query were rewritten to it.

**Deleted:** the scratch route. It was rebuilt twice during this plan — once to measure the wrap,
once to measure the no-jump claim — and removed before each commit. `src/routes/dev/` holds
`catalog`, `fidelity` and `skeleton`, exactly as it did at `ac2d897`.

## The measurement, beside the derivation

`KnobRack.svelte` (plan 05-08) reasoned from Quicksand 600's uppercase advance to **≈ 251 px** of
region content box, which it put at **≈ 379 px** of viewport, and said plainly that the real number
was this plan's to take. Taken, in Chromium, against the component's own shipped markup and style
block with Quicksand loaded the way `src/app.css` loads it, narrowing the container one pixel at a
time:

| | Width |
|---|---|
| `SURPRISE ME` laid out | **134.453125 px** |
| `RESET ALL` laid out | **114.546875 px** |
| the two plus the 8 px `sm` gap | **exactly 257.0 px** |
| last width holding one line | **257 px** |
| first width wrapping | **256 px** |
| as a viewport (content box + 128 px of padding chain) | **≈ 385 px** |

So `@container (width < 257px)` selects the wrapped reservation, and the derivation was **6 px
narrow** — inside the margin it admitted, and every one of its three conclusions survives: the row
wraps at a 320 px viewport (content box 192 px) and at 375 px (247 px), and does not at 420 px
(292 px). Both comments now carry 257 px and `grep -c "measured in 05-10" src/lib/ui/KnobRack.svelte`
prints `0`.

The reservation was observed doing its job in the same run: at a 292 px content box the region is
416 px tall and its `min-block-size` is 416 px — `194 − 32 = 162` plus a 254 px rack — and at 261 px
it is 468 px, the 52 px the wrapped constant exists for.

**One honest limit, recorded rather than smoothed over.** Below a 220 px content box `Knob.svelte`'s
own container query stacks every row, so a knob costs 66 px rather than 48 px and the real height at
a 320 px viewport is 540 px against a 468 px reservation. Nothing breaks — `min-block-size` is a
floor, the region simply grows past it, and the height is still fixed for a given entry at a given
width, which is what the invariant says. It is noted because the formula's `r` and `w` silently
change meaning at that width, and a future plan reading `48r + 66w − 4` should know it.

## The claim this plan exists to make, measured

> When a knob crosses 908 the only things that change above the region are which sentence is visible
> and the button's fill. Nothing moves.

Toggling the over-budget reason on a mounted panel, at three viewports:

| Viewport | primary control | honesty slot | tuning region |
|---|---|---|---|
| 375 px | top 49, height 44 — **unchanged** | top 101, height 72 — **unchanged** | top 197, height 450 — **unchanged** |
| 420 px | top 49, height 44 — **unchanged** | top 101, height 72 — **unchanged** | top 197, height 450 — **unchanged** |
| 900 px | top 49, height 44 — **unchanged** | top 101, height 72 — **unchanged** | top 197, height 450 — **unchanged** |

What did change: `disabled` false → true, the fill `rgb(214, 255, 78)` → `rgba(0, 0, 0, 0)`, and the
visible sentence from the honesty line to the budget reason. Exactly one of the slot's three cells is
visible in both states, the other two carry `aria-hidden="true"`, and there were zero page errors.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — Bug] The inherited wrap measurement was wrong**

- **Found during:** Task 1, reconciling the interrupted run
- **Issue:** `TuningRegion.svelte` shipped `@container (width < 262px)` and a header paragraph
  presenting 262 px/261 px as measured. Between 257 px and 261 px the region would have reserved the
  wrapped constant while the buttons still sat on one line — 52 px of over-reservation in a 5 px band.
- **Fix:** measured it (above), rewrote the header paragraph, the query and its inline comment, and
  replaced `KnobRack.svelte`'s forward reference with the result.
- **Files:** `src/lib/ui/TuningRegion.svelte`, `src/lib/ui/KnobRack.svelte`
- **Commit:** `16c1201`

**2. [Rule 1 — Bug] `SURPRISE ME` left message slot A claiming the knobs came with the link**

- **Found during:** Task 1 review
- **Issue:** `changeKnob`, `resetKnob` and `resetAll` all cleared the stamp notice; `surprise()` did
  not. A roll moves every knob, after which "These knobs came with the link. RESET ALL puts the
  configuration back to its defaults." is false.
- **Fix:** `landed = false` at the top of `surprise()`, with the reason beside it.
- **Commit:** `16c1201`

**3. [Rule 3 — Blocking] `copy.spec.ts` pinned the `TUNING` caption to `ChosenPanel.svelte`**

- **Found during:** Task 3's whole-suite arithmetic — `Tests 1 failed | 645 passed`
- **Issue:** `src/lib/tune/copy.spec.ts:158` asserted `ChosenPanel.svelte` contains `"TUNING"`. This
  plan moved the caption into `TuningRegion.svelte`. The assertion's own comment anticipated the move
  ("before wave 9 replaces the local const with this import") — it just named the wrong wave.
- **Fix:** the assertion follows the caption and is now stronger: the region must **import**
  `TUNING_CAPTION` and must **not** transcribe the literal. No test was added or removed.
- **Commit:** `9a53dd9`

### Deliberate departures from the plan's text

**4. `ChosenPanel`'s `.caption` rule was deleted, not overridden.** The plan asked for its
`line-height: 1.2` to become `14px` inside the tuning region only. The caption moved into
`TuningRegion.svelte`, which already declares `line-height: 14px` on its own; a scoped
`.reserved .caption` rule in `ChosenPanel` cannot reach a child component's element in Svelte, and a
rule with no matching element raises an unused-selector warning (the tree is at 0 warnings and stays
there). The contract the override existed for — every 12 px line inside the region is a 14 px line
box, every other Phase 4 caption keeps 1.2 — holds by construction. `.body` went with it, the
placeholder sentence being the only thing that used it.

**5. `tune-ui.spec.ts` test 2 also forbids the `overflow` shorthand.** See the decision above.

**6. Task 3's TDD ceremony is the negative check.** A structural gate over existing correct code
cannot be written red-first without first breaking the code it gates. Both mutations were made and
observed instead (below), which is the same evidence in the opposite order.

## The negative checks, observed

**Task 1 — the static import.** The plan asked for a static `$lib/tune/model` import to turn
`config-shape.spec.ts` test 13 red. **It does not**, and that is a real finding rather than a
mistake in the run:

```
import { buildTuner as forbidden } from "$lib/tune/model";   → Tests  14 passed (14)
```

Test 13 matches the specifier **text** against `vendor`, `intechstudio` and `lib/pad`, and
`$lib/tune/model` contains none of them — while `model.ts` itself statically imports
`../../vendor/botor/_pad` and `../pad`, so the chunk arrives anyway. The check that does bite is the
one the file's own header names, `$lib/pad`:

```
import { padReady as forbidden } from "$lib/pad";

AssertionError: a front-door file imports the compiler at module scope: expected [ Array(1) ] to deeply equal []
+ [ "src/lib/ui/TuningRegion.svelte -> $lib/pad" ]
      Tests  1 failed | 13 passed (14)
```

Restored, `14 passed`. The gap this exposed is exactly what `tune-ui.spec.ts` test 1 was specified to
close, and it was then observed closing it — the same static `$lib/tune/model` import, in one run
over both files:

```
 ❯ |server| src/lib/ui/tune-ui.spec.ts (5 tests | 1 failed)
AssertionError: the compile surface is named 3 time(s) but only 2 of those are inside an
await import(...) - a static reference to it puts the protocol chunk on the front door's first paint
 Test Files  1 failed | 1 passed (2)      ← config-shape.spec.ts is the one that passed
```

**Task 3 — the horizontal scroll.** `overflow-x: auto` added to `KnobRack.svelte`'s `.rack`:

```
AssertionError: a tuning component can scroll horizontally, which D-11 forbids at every width
and in every state: expected [ Array(1) ] to deeply equal []
+ [ "src/lib/ui/KnobRack.svelte -> overflow-x" ]
      Tests  1 failed | 4 passed (5)
```

Removed, `5 passed`.

## The comment-stripped scans

Run as a throwaway `.mjs` outside the repo, with `config-shape.spec.ts`'s backslash-free stripper:

```
raw aria-live occurrences (smoke check): 2
stripped aria-live occurrences: 1
elements carrying aria-live: ["p"]
raw setInterval occurrences: 1
stripped setInterval occurrences: 0
stripped 'from' specifiers naming tune/model: 0
stripped await import occurrences: 2
stripped length: 10875 raw length: 26588
```

Exactly one live region, on exactly one element. `setInterval` occurs once in the header — naming the
prohibition — and **zero times in code**, which is precisely why the raw grep is not the gate. And
over `TryOnDevice.svelte`:

```
raw color-over occurrences: 1
STRIPPED color-over occurrences: 0
stripped grid-area: 1 / 1 occurrences: 1
stripped visibility: hidden occurrences: 1
```

The one raw occurrence is the paragraph explaining that a red CTA would read as "dangerous" when the
truth is "not yet".

## Non-vacuity, quoted

Every test in `tune-ui.spec.ts` asserts what it read before asserting what it found:

1. `expect(specifiers.length, "static imports were collected").toBeGreaterThan(0)` and
   `expect(lazyNamed, "the compile-surface modules were found at all - if this is zero the second assertion below proves nothing").toBeGreaterThan(0)`
2. `expect(declarations, "the seven components' code was actually read").toBeGreaterThan(100)`
3. `expect(withControls.length, "components rendering a button or an input were found").toBeGreaterThanOrEqual(4)`
   **and** `expect(withoutControls.length, "the derivation discriminates - if every component were classed as having a control, the rule would be untested rather than universally satisfied").toBeGreaterThan(0)`
4. `expect(files.length, "the ui directory was walked").toBeGreaterThan(7)` and
   `expect(buttonClasses, "a button was found in one of the two carriers - TURN IT DOWN - so this scan has something to discriminate against").toBeGreaterThan(0)`
5. `expect(regionRaw.length, "TuningRegion.svelte was read").toBeGreaterThan(1000)` and the same for
   `KnobRack.svelte`

Plus the list guard shared by all five: `expect(TUNING_COMPONENTS.length, "seven components were
listed").toBe(7)` checked against the directory listing, so a rename cannot leave five green tests
covering six files.

## `ChosenPanel`'s geometry, by diff

The panel's own declarations are byte-identical; the only lines in the diff touching a geometry
keyword are prose:

```
+  FLOOR RATHER THAN A CEILING - which is what min-block-size already said in the
+  the dashed border, the 10px radius, 16px of padding, min-block-size 152px and
```

`git diff` over the `.panel` and `.reserved` rules shows no changed declaration:
`max-inline-size: 420px`, `padding: 24px`, `border: 1px solid var(--color-line)`,
`border-radius: 10px`, `animation: arrive 260ms …` and `min-block-size: 152px` are all untouched. The
markup diff is three hunks:

```
   <div class="reserved" data-testid="tuning-reserved">
-    <p class="caption">{TUNING_CAPTION}</p>
-    <p class="body">{TUNING_BODY}</p>
+    {@render tuning?.()}
   </div>
   <hr class="rule" />
-  <KeepOnDevice />
+  <div class="install-row">
+    <KeepOnDevice />
+    {@render share?.()}
+  </div>
```

## Verification

| Gate | Result |
|------|--------|
| `npm run check` | `492 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `npm run test:quick` | **58 files / 646 passed, 1 todo** — baseline + 1 file + 5 tests |
| `npm run test:sweep` | **3 files / 13 passed** |
| `npm run test:e2e` | **24 passed** — unmoved |
| `config-shape.spec.ts` + `identity.spec.ts` + `front-door.spec.ts` | 3 files / 28 passed |
| `git diff --quiet HEAD -- src/lib/config-shape.spec.ts` | exit 0 |
| `git diff --quiet HEAD -- src/lib/device` | exit 0 |
| `grep -c "measured in 05-10" src/lib/ui/KnobRack.svelte` | `0` |
| `grep -c ".write(" src/lib/ui/TryOnDevice.svelte` | `0` |
| `npx vitest run --project server src/lib/ui/tune-ui.spec.ts` | `5 passed` |

Whole-suite arithmetic against `05-09-SUMMARY.md`: quick **57 → 58 files**, **641 → 646 tests**
(+1 file, +5 tests, all from `tune-ui.spec.ts`); sweep **3 / 13** unchanged; e2e **24** unchanged.

The first `test:quick` run reported `no Vitest summary lines found` twice — not the known
`format-parity` flake but a real failure, `copy.spec.ts`, deviation 3 above.

## Known Stubs

**Region 4 renders nothing on the live front door until plan 05-11.** `ChosenPanel.svelte` now
renders `{@render tuning?.()}`, and the only caller — `Coverflow.svelte` — does not pass the snippet
yet; passing it is 05-11's first task (its plan already carries
`<ChosenPanel entry={centred} {tuning} {share}>`). Between these two commits the front door shows the
reserved region as an empty dashed box rather than a caption and a sentence. This is the plan's
explicit instruction and the seam it exists to create, it is invisible to every gate
(`first-experience.e2e.ts` asserts `tuning-reserved` is visible, and a 152 px bordered box is), and it
is resolved by the very next plan in the wave.

## Self-Check: PASSED

Files:

- FOUND: `src/lib/ui/TuningRegion.svelte` (709 lines)
- FOUND: `src/lib/ui/tune-ui.spec.ts` (351 lines)
- FOUND: `src/lib/ui/ChosenPanel.svelte`, `src/lib/ui/TryOnDevice.svelte`,
  `src/lib/ui/KnobRack.svelte`, `src/lib/tune/copy.spec.ts` (modified)
- ABSENT, as required: `src/routes/dev/tune-measure/`

Commits: FOUND `16c1201`, FOUND `19644b6`, FOUND `9a53dd9`.
