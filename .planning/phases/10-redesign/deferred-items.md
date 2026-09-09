<!-- Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later. -->

# Phase 10 — deferred items

Out-of-scope discoveries, logged rather than fixed. Nothing here is red.

## From 10-02

**`/dev/type/`'s Quicksand column now renders Inter.** `src/routes/dev/type/+page.svelte:150`
declares `.quicksand { font-family: var(--font-sans); }`, and `--font-sans` became Inter Variable
in 10-02-01, so the probe's two columns are now the same face and its comparison is degenerate.
Nothing is red: no spec and no e2e test reads the probe (`grep -rn "measure-column\|dev/type"` over
`e2e/` and `src/` outside the file itself returns nothing), the route is unlinked, and the
measurement it produced is recorded in `10-01-SUMMARY.md` and is not re-taken. The probe was an
instrument for one measurement that is finished. Not fixed here because the file is outside
10-02's `files_modified` and the plan's delta is `+0 files`. Whoever next touches `/dev/`
should either retire the route or point `.quicksand` at a real second face.

**`gen-licenses.mjs` deprecation warning.** `npm run licenses` prints
`[DEP0190] DeprecationWarning: Passing args to a child process with shell option true`. It comes
from `checker()`'s `execFileSync(..., { shell: process.platform === "win32" })` at
`scripts/gen-licenses.mjs:52-59`, which predates this phase. Exit code is 0 and the output is
correct. Pre-existing, not caused by 10-02, not fixed here.

## From 10-03

**`src/lib/tune/copy.spec.ts` asserts no exhaustiveness over its module's exports, and the whole
quick suite is blind to a re-added tuning string.** 10-03's third negative check proved it rather
than argued it: `SHARE_QUIET_LINE` was restored as an export with no render site and no assertion,
and `npm run test:quick` was **76 files / 787 tests / 0 failures**. The mechanical-rules walk
(`everyString()`) applies the copy rules to whatever it finds and its non-vacuity floor is
`>= 25`, a floor rather than an equality, so an added string passes every rule by satisfying them.
`install-copy.spec.ts` has the same shape and the same hole.

10-03 closed it for the one string it retired, by asserting the absence by name. It did **not**
close the general case, which would be an enumeration of every export in both copy modules held to
an exact list - the shape `session-copy.spec.ts`'s `NAMED_STATES` and `install-copy.spec.ts`'s
closed sets already use for their taxonomies but not for their strings. That is worth doing and it
is not this plan's: it would move test counts, which 10-03's contract fixes at `+0 / +0`, and the
right moment is 10-12, which adds `CLEAR`'s strings to both modules and will be enumerating them
anyway.

**`src/routes/dev/type/+page.svelte:81` carries the contract's 90-character `HONESTY_READY`.**
Z-08's site-wide scan names it as an expected row rather than an offender: it is the unlinked type
probe's measurement sample, and the line-box occupancies in `10-01-SUMMARY.md` were taken against
exactly that string. Rewriting it to the shipped 85-character form would falsify the record of what
was measured. Logged with the row above about retiring the probe: whoever retires `/dev/type/`
removes this row from `install-copy.spec.ts` test 3 in the same commit.

## From 10-04

**Layer G's halftone still costs about 22 ms at p95 on headless WebKit at a phone viewport.**
Measured on `/browse/` at thirty-six entries, p95 of `requestAnimationFrame` deltas over a full
scroll, median of three runs per arm, against a `SCREEN: FLAT` baseline of 78-79 ms:

| Layer G's technique | p95 over baseline |
| ------------------- | ----------------- |
| `box-shadow: inset 0 0 26vmax 9vmax` (the first spelling, no longer shipped) | **+105 ms** |
| the 3px-pitch halftone gradient | **+22 ms** |
| the vignette as a `radial-gradient` (what ships) | **+10 ms** |

The blur was fixed in 10-04-03 and is recorded in `src/app.css`'s own comment. The residual is not
fixed, and the reasons are stated rather than assumed. Chromium measures **0.00 ms** in every one
of these arms, so this is one engine. The absolute baseline is 78 ms - about 13 fps - on a harness
running thirty-six animating canvases in headless WebKit on Windows, which is not Safari and not
iOS, so the number is a lower bound on the harness rather than a measurement of a device. And
10-UI-SPEC 8.5's 2 ms threshold and its declared fallback are written about **Layer S**; there is
no declared rule for Layer G, and inventing one to scope the site's ground texture off its busiest
page on a harness artefact would be a design change made by a benchmark.

Whoever picks this up has two cheap levers and one honest option: enlarge the halftone tile so
fewer tiles are drawn (it changes the picture), drop Layer G on `/browse/` alone (one selector),
or leave it - the visitor already has a one-click `SCREEN: FLAT` that removes it entirely, which is
the whole reason that control exists.

**The `data-screen` attribute is not on the first painted frame of a cold arrival.** Every route is
prerendered and the static HTML carries no attribute, so `ScreenToggle.svelte`'s module scope
writes it when the layout's JavaScript loads - before hydration, but after the prerendered markup
has painted. A visitor who chose `FLAT` therefore sees a frame or two of texture. Caught by
`e2e/aesthetic.e2e.ts`, whose single read of the attribute after a reload came back `null` on
webkit-phone and `"flat"` on chromium purely on timing; that assertion is now a poll and says "once
this page has hydrated". Closing the window means a blocking inline script in `src/app.html`
carrying a SECOND copy of the default rule (recorded choice, else reduced motion, else textured) in
a file no test reads. That is the drift hazard this phase has refused three times elsewhere, so it
is recorded here instead. It is also written into `ScreenToggle.svelte`'s own header.

## From 10-07

**The front door's ring cannot grow, and the blocker is a data fact rather than a layout one.**
A-22 answers Open item 3 by adding a `FOR` link row and leaving `FRONT_DOOR.length` at **8**. The
reversal — growing the ring so more of the thirty-six are reachable from `/` without a click — is
blocked by `src/lib/catalog/front-door.spec.ts:110-112`, which requires every row member to declare
`preview === "padsim"`. **Twenty-seven of the thirty-six entries fail that**, because they are Lua
configurations and a ring member that loaded `wasmoon` would put a 271,581-byte WASM asset on the
front door's first paint — the one thing `e2e/catalog.e2e.ts` proves a cold load never fetches.
Growing the ring therefore means either a second engine on the opening screen or a relaxation of
that requirement, and both are phase-sized decisions. Recorded rather than pre-empted.

**The `FOR` row sits BELOW the fidelity line, and 10-UI-SPEC 9.1 puts it above.** The spec's order
for `/` is name plate, `FOR` row, fidelity line. Both the name plate and the fidelity line are
rendered by `Coverflow.svelte` — `.plate` and `.fidelity` are its own top-level fragments, which
become children of `FrontDoor.svelte`'s `.row` — and `Coverflow.svelte` is a file this phase
promises not to edit. There is no seam between them to insert into from outside it. The row
therefore follows the coverflow block at the same 32px rhythm. Closing this means either editing
`Coverflow.svelte` (which costs the promise and the file's own header forbids it) or giving it a
snippet prop, which is the same edit wearing a different name. Everything else about the row is the
spec's: ten links, `FOR` caption, 44px on both axes, static markup in `build/index.html`.

**`e2e/` is outside every type gate this repository runs, and 10-07 found it by measurement.**
`npm run check` stayed green — `COMPLETED 576 FILES 0 ERRORS` — with `e2e/browse-webkit.e2e.ts`'s
`orderOf` reverted to the retired three-member literal union `"featured" | "newest" | "name"`.
`.svelte-kit/tsconfig.json`'s `include` globs are `src/**`, `test/**`, `tests/**` and
`vite.config.*`; `e2e/**` is in none of them, and ESLint's type-aware config is scoped to
`**/*.svelte`. A direct `npx tsc --ignoreConfig --noEmit --strict e2e/browse-webkit.e2e.ts` DOES
report it —
`error TS2345: Argument of type '"featured" | "name" | "newest"' is not assignable to parameter of
type 'BrowseSort'` — and is clean once narrowed, so the gate exists and is simply not wired.
Playwright transpiles with esbuild and never type-checks, so a stale annotation in `e2e/` fails
silently: `orderOf("newest")` would have fallen through `orderFor()` to the NAME comparator and the
assertion would have passed against the wrong order. Wiring it means adding `../e2e/**/*.ts` to the
include set (which pulls `@playwright/test` into `svelte-check`'s program) or a second `tsconfig`
and a `check:e2e` script. Neither is a 10-07 change; both are cheap.

---

## 10-08 — three items the lattice leaves behind

### 1. `KnobView.positions` is a bridge, and 10-10 removes it

D-06 gives a preset colour knob 4,096 positions. `Knob.svelte`'s swatch row draws one element per
option, so the rack would render 4,096 radio inputs — measured on `/dev/tune/`, that is not a slow
row but a broken panel: it overflows and its labels intercept the pointer events of RESET ALL,
SURPRISE ME and COPY LINK, and thirteen of the twenty tuning e2e tests failed on
`<label class="option"> ... intercepts pointer events`.

Rather than improvise a picker the plan explicitly assigns to 10-10, `model.ts` shows the two
positions a rack can honestly show without one — where the card ships, and where the visitor is —
and `KnobView.positions` carries each slot's real knob index so a click still writes a lattice
position. **Between 10-08 and 10-10 a preset's colour is therefore not editable from the rack.**
`SURPRISE ME`, `RESET ALL`, the stamp and the default marker all still move it, and all twenty
tuning e2e tests pass.

When 10-10 lands the three rails and the result pad, `KnobView.positions`, `SWATCH_ROW_MAX` and the
window branch in `knobViews` go with it.

### 2. `docs/PIN-POLICY.md` item 4's stake rises again — 10-14 writes it

Item 4 already says a protocol-pin bump must re-run the reachability sweep because the minifier's
output length moves the 908-character ladder. It now also decides **whether all 4,096 lattice
literals fit**: `ninepads` has 268 characters free at its dearest colour and a minifier that got
three characters worse on the checkerboard's dimmed second copy would eat into that margin on every
colour-bearing preset at once. The sweep records the margin as an equality (`toBe(268)`), so the
pin bump that moves it goes red and names the number. Noted here; 10-14 writes it into the document.

### 3. A Lua colour knob's positions are still its entry's palette

Format `w` carries twelve raw bits per colour knob and
`stamp-roundtrip.sweep.spec.ts`'s Lua Pass B proves all 4,096 ride it, so the FORMAT is ready for
the picker. The `luaKnobs` descriptors are not: a Lua colour knob still offers the four or five
literals its entry declares, and `decodeLuaColour` maps an inbound colour onto one of them by
QUANTISED comparison and **fails closed** on a colour the list cannot name. Nothing today can
produce one. When 10-10 widens the Lua colour knob to the lattice, that lookup becomes the same
arithmetic `knobs.preset.ts` already uses, and the entries' shipped literals move onto the lattice
(`0,200,255` -> `0,204,255`), which means `src/lib/catalog/frames.json` is regenerated by its own
documented `UPDATE_FRAMES=1` procedure for the 25 colour-bearing entries. That regeneration is not
a 10-08 change and was deliberately not made here.

### 4. The forecast is offered on option rows only — a rail has no option to hover

Plan 10-09's T2 says "pointer hover and keyboard focus on **any knob option**". A word row and a
swatch row make every option a real element the platform can hover and focus, so both triggers are
the platform's own. A **rail** does not: it is one `<input type="range">` over painted dots or a
detent track, and the input's focus is the CURRENT value rather than a candidate. Forecasting a
rail therefore needs a pointer-position-to-detent mapping written by hand — a second, unverified
copy of the hit-testing the range input already does — and there is no keyboard candidate at all,
because an arrow key moves the knob rather than proposing a move.

So `Knob.svelte` forecasts on `.option` and nowhere else, and the two gates, the delta and the
hidden expansion all live inside that branch. Of the twelve `KnobKindName`s, ONE (`colour`) is a
swatch row; SIX are word kinds that become a word row only when their table covers every value and
there are at most `WORD_ROW_MAX` of them, and fall through to a rail otherwise; and the remaining
FIVE — `speed`, `size`, `count`, `feel`, `amount` — are rails unconditionally. So this is a real
gap and not a rounding error.

10-10 is where it closes, and closes cheaply: the three-sixteen-detent picker it builds is exactly
the pointer-to-detent mapping a rail forecast needs, written once for a control that has to have it
anyway. Until then the meters' ghost fill and the signed delta appear on word rows and swatch rows,
and a rail behaves exactly as it did before this plan.

**10-10's answer: it did NOT close, and the reason got stronger rather than weaker.** The picker's
rails are the shipped detent-track shape, which means the sixteen detents are PAINT UNDER AN
INVISIBLE `<input type="range">` that fills the whole 44px box. That is not an implementation
detail to route around — it is what makes the rail one tab stop with the platform's own arrow,
`Home` and `End` behaviour, which the plan requires by name ("no new keyboard model"). So the
platform delivers no `pointerenter` on a detent, and the mapping would have to be
`offsetX / width * 16` written by hand: the second unverified copy of hit-testing this item was
already about.

The deciding half is the keyboard, not the pointer. 10-UI-SPEC §11.3 makes the hidden expansion
mandatory *because* "a number beside a pointer is pointer-only information". A rail still has no
keyboard candidate — an arrow key moves the knob rather than proposing a move — so a rail forecast
built on `offsetX` would be exactly the pointer-only forecast that rule forbids. Closing this
properly needs a candidate a keyboard can reach, which is a control change and not a wiring change.

Unchanged from 10-09: the picker's SWATCH ROW (every hand-authored Lua colour knob) forecasts
exactly as it did, because ColourPicker.svelte forwards `onforecast` into the shipped
`Knob.svelte`.

---

## From 10-10

### 5. The picker's result pad is built, plumbed and not yet driven — one line in `Coverflow.svelte`

`ColourPicker.svelte` renders one `PadCanvas` and hands its element upward through `onresult`;
`KnobRack.svelte` and `TuningRegion.svelte` both forward it. The last hop is missing: the only
thing on the page that owns a `SimHost` is `Coverflow.svelte`, which registers the hero canvas and
calls `replaceEngine` when the tuner publishes a new engine — and `Coverflow.svelte` is a file this
phase promises not to edit (10-10's own `<verification>` block asserts
`git diff --stat HEAD -- src/lib/ui/Coverflow.svelte` is empty).

So the picker renders its result pad **only when a consumer supplies `onresult`**, and today none
does. That is deliberate rather than a stub left running: an unregistered canvas has no backing
store and paints nothing, and an empty box inside the picker is worse than no box — the whole
argument of the result is that a flat swatch is the lie and a running 9×9 is the truth, and a blank
one shows nothing while claiming to.

What closes it is three lines in `Coverflow.svelte`'s `<TuningRegion>` block:

```
onresult={(id, canvas) => {
  host?.register(id, canvas, enginesById.get(centred.id));
  host?.setInWindow(id, true);
}}
```

plus an `unregister(id)` on teardown, using the same engine the region already publishes through
`onpreview`. `colour-picker.spec.ts` test 6 asserts the picker's end of the chain — exactly one
`PadCanvas`, handed up through `onready={onresult}`, under its own `-colour-result` id so it cannot
unregister the hero — so the day the wiring lands there is nothing to re-derive.

Also unresolved by the same promise: `/dev/tune/` mounts `TuningRegion` with no canvas and no
`SimHost` at all, so it will never drive the result pad either. The probe's own comment already
says so.

### 6. A Lua colour knob still shows a swatch row inside the picker, not three rails

10-10 chose the picker BY KIND ALONE, as X-05 / X-06 as amended require, so every colour knob on
both routes renders the same block: the same `COLOUR` caption, the same knob selector, the same
result pad, the same lock. What differs INSIDE it is the control, and the reason is item 3 above:
a hand-authored Lua colour knob still offers the four or five literals its author wrote, and three
sixteen-detent rails cannot travel between `0,204,255` and `255,85,0` without passing through 4,094
colours that knob cannot name. Rails over a palette would be a control that mostly does nothing.

So the rails ship on the **six preset entries** and the swatch row ships on the **twenty-five Lua
entries**, both inside one picker. Widening `luaKnobs` onto the lattice is what makes the rails
universal, and it is item 3's regeneration of `src/lib/catalog/frames.json` for 25 entries — plus a
reachability sweep whose Lua half would grow by 25 × 4,096 states. `view.ts`'s `isColourLattice`
is the one place that asks, and its own comment names this item.

### 7. The picker's head cannot be one 44px line on a narrow phone when it carries a knob selector

**Measured, on the shipped build, in chromium at a 320px viewport** (rack content box **172px**):

| Entry | colour knobs | head | selector | picker | rack |
| ----- | ------------ | ---- | -------- | ------ | ---- |
| `aurora` | 1 | **44px** | none | **192px** | fits |
| `console` | 3 | **140px** | 49px wide, three options stacked | **288px** | 420px |

The head is `caption + (selector or knob name) + metadata + lock` on one flex line. Three selector
options are 44px on both axes by contract, so with the 63px caption and the 44px lock the row's
min-content is **263px** — it cannot fit 172px, and no amount of shrinking makes it, because the
44px floor is Phase 4's accessibility contract rather than a style.

**What 10-10 did about it, and what it deliberately did not.** The metadata is dropped below a
262px container (see `ColourPicker.svelte`'s last rule, with the four measured widths that derive
the number), which puts every **single**-colour-knob entry back on one 44px line at both phone
widths — that is 14 of the 31 entries with a picker, and it is what fixed the red
`e2e/tuning-webkit.e2e.ts:279` assertion. For the **17 entries with two or three**, the picker
declares `min-block-size: 192px` rather than `block-size`, so its content grows the block instead of
painting over the next rack row. `TuningRegion.svelte`'s `196p` term then under-reserves by 96px on
`console` at 320px: a first-paint layout shift on a phone, on 17 of 36 entries, rather than an
overlap.

**Why it is not closed here.** Closing it means either a second picker height constant driven by a
container query, or a two-row head with its own reservation term — and every number in either
version is a function of the pill's inline padding. 10-UI-SPEC §19.1b puts that at **24px**;
`.option` ships at **12px** today. **10-13.1 owns `ColourPicker.svelte` and owns the pill**, so it
is the wave that can compute these thresholds once against the geometry that ships rather than
twice against two.

**What it would cost to measure rather than reason.** Nothing in the e2e suite opens a
multi-colour-knob entry: `tuning.e2e.ts` and `tuning-webkit.e2e.ts` are aurora, and the two
over-budget tests are `/dev/tune/`'s tpad, which has no colour knob at all. Both numbers above were
taken by hand with a throwaway Playwright probe. A `console` case in `tuning-webkit.e2e.ts` would
have caught this on the day the picker landed and would catch the next one; it is one test and it
is the cheapest half of this item.

## From 10-11

### 8. MIX TWO is built, testable and not mounted — the same last hop as item 5, plus a term nobody has costed

`MixTwo.svelte` renders its four results only when a consumer supplies `onchild`, for the reason
item 5 gives at length: the only thing on the page that owns a `SimHost` is `Coverflow.svelte`, and
this phase promises not to edit it. **One wiring closes both**, because the picker's result pad and
the mix's four results want the same three lines and the same engine the region already publishes
through `onpreview`:

```
onchild={(id, canvas) => {
  host?.register(id, canvas, enginesById.get(centred.id));
  host?.setInWindow(id, true);
}}
```

plus `unregister(id)` on teardown. The ids are `${entry.id}-mix-0` through `-mix-3`, distinct from
each other and from the hero's, so nothing unregisters anything else.

**But mounting it is more than the hop, and this is the part that is not costed anywhere.**
`TuningRegion.svelte` reserves the tuning region's height before a knob has been turned —
`194 + 48r + 66w + 196p - 4`, asserted twice in `tune-ui.spec.ts` test 7 — and 10-UI-SPEC gives MIX
TWO **no term in that arithmetic**: not in §11.6, not in §12, not in the region's own derivation.
A block whose height changes when four results appear is exactly the reflow the reservation exists
to prevent, so the wave that mounts MIX TWO owes the region either a term (a `MIX_PX` beside
`PICKER_PX`, reserved whether or not results are showing) or a placement outside the reserved box.
Neither is a decision this plan was in a position to take, and taking it silently by putting the
component in the panel would have moved a contract two tests hold.

`10-11-PLAN.md`'s `files_modified` lists `src/lib/ui/ChosenPanel.svelte` for what looks like this
reason. Nothing in either task's `<action>` asks for a change to it, and none was made:
`git diff --stat e08f18c..HEAD -- src/lib/ui/ChosenPanel.svelte` is empty, and its 152px region
floor is still asserted unmoved.

### 9. MIX TWO can be disabled and §13.4 gives it no reason to show

The control needs two candidates. `THAT ONE` is the last `SURPRISE ME` roll, a pasted link, or the
state a taken result replaced — and before any of those has happened it is empty, so MIX TWO is a
real `disabled` button.

`SURPRISE ME` is in the same position when every knob is held and §13.4 gives it a sentence for it
(`Every knob is held, so there is nothing left to roll.`, 53). **§13.4 gives MIX TWO four strings —
the label, the line, and the two slot captions — and no fifth**, so this plan rendered no reason
rather than inventing one: the copy contract is a specification, and a component that writes its own
sentence is exactly the drift `copy.ts` exists to prevent.

What is on the screen instead is the empty `THAT ONE` slot with its link field in it, which is
adjacent and is the answer. Whether that is enough is a copy decision, and it belongs to whoever
mounts the control. Two ways out, both cheap:

1. **A fifth string in §13.4**, matching `SURPRISE ME`'s shape.
2. **Make `THAT ONE` never empty** — the region hands the entry's own defaults as the second
   candidate until a roll or a link replaces them, which is a true candidate and needs no new copy.
   It also changes what the feature *is* slightly: "mix what you have with what it shipped as" is a
   different first gesture from "mix two things you made".

### 10. Nothing gates `docs/INSTALL-RUNBOOK.md`, and eight suites are absent from `docs/TESTING.md`

Two findings from plan 10-13, both recorded rather than fixed.

**The runbook has no gate at all.** `docs/SKELETON-RESULTS.md`, `docs/SKELETON-RUNBOOK.md`,
`docs/HARDWARE-AUDITION.md`, `docs/PIN-POLICY.md`, `docs/TESTING.md` and `docs/woff2.md` are each
named by at least one spec; `docs/INSTALL-RUNBOOK.md` is named by two source comments and by no
test. So its "Seven rows" sentence, its row letters and its block table are trusted by hand. A-51
made that finding stronger rather than weaker: the clear folded into row C precisely so the row
count would not move, and if it had moved, nothing would have caught the sentence going stale. A
later phase that wants this held would want a `ROW_COUNT`-shaped gate of its own — the row letters
parsed out of the table, the count asserted against the sentence, and every block caption in the
diagnosis table checked against `install-copy.ts`'s exports.

**Eight suites older than Phase 10 are still not written up in `docs/TESTING.md`:**
`src/lib/browse/facets.spec.ts`, `src/lib/fidelity/vendored-diff.spec.ts`,
`src/lib/format-parity.spec.ts`, `src/lib/licence-notices.spec.ts`, `src/lib/pad/ready.spec.ts`,
`src/lib/sim/demo.spec.ts`, `src/lib/tune/mix.spec.ts` and `src/lib/ui/font-assets.spec.ts`. They
are green and they are gates. None of them is 10-13's, so none was touched; plan 10-14 re-measures
the tree at the phase gate and is the natural place for them.

## From 10-13.1 and 10-13.2 — the aesthetic pass and its correction

### 11. The second halftone density was measured over budget and did not ship

`DENSITIES` is **1**. The second 3px-offset pitch cost **12.00 ms** at p95 on webkit-phone against
10-UI-SPEC §8.5's declared **2 ms** threshold — six times over — with chromium at **0.00 ms** in both
arms. The measurement is in `10-13.1-SUMMARY.md` with all eight numbers, taken at document-start via
`addInitScript` (not `page.addStyleTag`, which lands after load and makes the first-paint half vacuous
by construction), median of three runs per arm, arm proved per run by reading `background-size` back
out of the page.

**What would close it.** Either a cheaper spelling of the second density that measures under 2 ms on
webkit-phone by the same instrument, or a decision that §8.5's threshold is the wrong instrument for
a ground texture. Note that §8.5's 2 ms is written about **Layer S**, not Layer G — 10-13.1 applied it
to Layer G deliberately, and that choice is itself worth revisiting rather than inheriting. Scan 4
asserts `DENSITIES` against the named constant, so the fallback is a state the tree is checked
against rather than a silence: closing this means moving a number a test reads.

### 12. `isolation: isolate` is load-bearing and its absence is invisible to every source scan

The lattice shipped once painting **nothing at all** with every source scan green. Two screenshots of
`/browse/` — one as authored, one with `.lattice::before { display: none }` injected — came back
**byte-identical at 8,492 bytes**. The cause is CSS 2.1 Appendix E painting order: without a stacking
context on `.lattice`, a negative-`z-index` pseudo-element belongs to the nearest ancestor stacking
context (the root) and paints at step 2, while `body`'s own background paints at step 3. Opaque black,
straight over the top.

It is now asserted **by name** in `instrument.spec.ts` scan 3 with the measurement in its own failure
message, and 10-13.2's `e2e/aesthetic.e2e.ts` test 5 proves the pixels in a browser.

**What would close it as a class, rather than for this one declaration.** Nothing in this repository
gates *paint order* except that one e2e title. Any future `z-index: -1` decoration on a new root has
the same failure mode and no gate. A cheap generalisation exists: a spec that finds every
`z-index: -1` pseudo-element rule in `src/app.css` and asserts its owning selector also declares
`isolation: isolate`. Six lines, and it turns a proved-once fact into a held one.

### 13. The lattice's declaration count is a floor, not an equality (A-60)

`instrument.spec.ts:849-851` reads `expect(declared.size).toBeGreaterThan(6)`. 10-13.2's brief asked
for the equality to be "re-derived"; there is no equality, and the whole lattice ground fix lives
outside `.lattice::before` anyway, so the rule gained no declaration. Recorded as A-60.

**What would close it.** The same thing item 8 of this file wants and the gate's own negative check
found in `facets.spec.ts`: a floor is only a gate if it sits at the observation. Deriving these
floors from the observed count — or asserting equality with a named constant — is a small, boring,
repository-wide job that nobody has done.

### 14. `demo.spec.ts` stays green when `tpad` is renamed out of `DARK_BY_CONSTRUCTION`

Observed during 10-13.2, reported rather than adjusted. The honesty gate that says *"this entry is
dark and a finger cannot help it"* is held in **two** places, not three: `demo.spec.ts` asserts the
list's **length** and iterates its members, so a rename inside the list satisfies both. The list is
also imported rather than quoted by `aesthetic.spec.ts` scan 8, which is what keeps the two in step.

**What would close it.** An assertion that the set of dark-by-construction ids **equals** a named
literal set, so a rename is a diff rather than a silent substitution. It costs one line and it moves
no count.

### 15. Four accessibility walks read hand-declared component lists, and one of them read nothing

10-13 found it: a 44px both-axes walk **passed having read nothing** when a component was dropped from
its hand-declared list, and only the separate length assertion caught it. `DEVICE_COMPONENTS` is
**seven** and `device-ui.spec.ts:232` asserts `.toBe(7)`; `instrument.spec.ts` is the repository's
first **directory-derived** component walk and does not have this hole.

**What would close it.** Derive the other three walks from the directory the way `instrument.spec.ts`
does, with the declared list demoted to an exception table. That is the shape that makes adding a
component to `src/lib/ui/` fail loudly until somebody says what it is, instead of quietly.

### 16. `FacetRow.svelte` straddles the register line, and nothing states that as a rule

On `/browse/` it renders pilled `TagChip`s; on `/` it renders unpilled links. That is the sharpest
demonstration on the site that D-16's register line is a **class of surface** rather than a file list
— which is finding 1 of `10-13.1-SUMMARY.md`, where the plan's own `<interfaces>` block stated the
line as DOM containment twice and its own task 2 would have been illegal under it.

**What would close it.** 10-UI-SPEC §19.1g still states the line as containment. Rewriting it as
authorship, with `FacetRow.svelte` and `ScreenToggle.svelte` as its two worked examples, is a
documentation change with no code behind it — which is exactly why it will be skipped unless it is
written down here.

## From 10-12 — the compiler audit that names nothing

### 17. The exhaustiveness audit over `InstallAction` is satisfied by nothing switching over it

`InstallAction` widened to **four** members when `CLEAR` landed, and the type-level guarantee that a
fifth member forces every consumer to acknowledge it is **vacuous today**: nothing in `src/` switches
exhaustively over the union, so `tsc` has nothing to complain about. The four-member `WRITE_CLICKS`
tuple is the assertion that is actually load-bearing — length 4, equal to the four control labels —
and `install.spec.ts` test 4 counts writes **by class**, which is why CLEAR needed no widening of the
proof.

**What would close it.** One `switch` with a `never`-typed default in the place where an action is
turned into copy — `install-copy.ts`'s reason lookup is the natural site — so the compiler starts
enforcing what the type was added to enforce.

## Phase-level items, collected at the gate

### 18. T3 — `SURPRISE ME` as a shelf of five rather than one roll

Deferred from the tuning waves. `surpriseIndices` already takes the held set and the twelve-draw
bound, and 10-09 drove the exhaustion path with a test that observes **12 draws, 0 offered to the
compiler**. Five results is `MixTwo`'s shape with one candidate instead of two.

**What would close it.** The same wiring item 8 of this file costs for MIX TWO, plus a term in
`TuningRegion.svelte`'s height reservation. It is blocked by the same missing hop and by the same
un-costed reservation term, and it should not be built before MIX TWO is mounted, because mounting
MIX TWO is what settles the reservation question for both.

### 19. T5 — a hardware A/B audition, and it is a SAFETY risk rather than a technical one

Carried verbatim, because the reason is the whole item: **it adds a class of click that writes twice
per gesture and cannot be verified without hardware.** Every other tuning idea in this phase is
provable against the fake. This one is not: the thing worth checking is what two rapid RAM writes do
to a module mid-animation, and no scripted transport can answer it.

**What would close it.** Not a plan. A bench session with a real ZONA, a written protocol for it, and
a decision about whether a double write per gesture is acceptable under SAFE-01's "nothing is written
without a click" — because an A/B toggle is one click producing two writes, which is the first thing
in this project that would strain that sentence.

### 20. T6 — knobs on the pad itself

Deferred from the tuning waves: turning a knob by dragging on the 9×9 preview rather than on a rail.

**What would close it.** It needs the interactive preview's tick-locked, at-most-one-sample-per-tick
pointer delivery to carry a second meaning, and that path is the one place the simulator's firmware
fidelity is asserted. Costing it starts with deciding whether a knob drag is a *touch* the firmware
sees or a gesture intercepted before the sampler — and those are different products.

### 21. The CRT-over-text mitigations, and the new class of gate they need (10-UI-SPEC Open item 8)

§8.3 rules that the CRT never covers text, and 10-13.2 spent a whole plan enforcing the same rule for
the lattice. If a scanline over the hero copy is ever wanted, the priced change is **four** things:
raise every affected token one rung, drop the overlay to ≤ 0.08 over text regions, widen the period to
6px, **and** add a contrast gate that **composites** the overlay rather than reading the token.

**What would close it.** The fourth is the hard one and it is a new class of test for this repository:
every contrast assertion here reads declared token values, and a composited overlay is invisible to
all of them. It wants the pixel-reading idiom `e2e/aesthetic.e2e.ts` test 5 established — sample the
rendered pixel, not the declared colour — generalised into a contrast helper.

### 22. The front-door ring cannot grow (10-UI-SPEC Open item 3)

Already recorded from 10-07 above; restated here because it is one of the decisions handed to the
user at the gate. `front-door.spec.ts:110-112` requires every ring member to be a `padsim` entry, and
**twenty-seven of thirty-six** entries fail it. The ring stays at eight and gains the `FOR` link row.

**What would close it.** Either a ring that admits Lua-backed entries — which means the assertion is
rewritten and the front door pays a `wasmoon` fetch it currently never makes, and `e2e/catalog.e2e.ts`
proves a cold catalog load never fetches it today — or a decision that eight is the answer and the
assertion is the reason rather than an obstacle.

### 23. Nothing type-checks `e2e/`

Proved by measurement in 10-07 and unchanged since: a retired sort was restored inside an e2e file and
`npm run check` did not move, while `npx tsc` over the same file named it. `svelte-check --tsconfig
./tsconfig.json` does not reach the directory.

**What would close it.** A second `tsconfig` covering `e2e/` and a `check:e2e` script, or widening the
existing include. It is small; the reason it has not been done is that nobody has decided whether
Playwright's types and the app's types can share one project without a fight.

### 24. Nothing gates `docs/INSTALL-RUNBOOK.md` or `docs/TESTING.md`

Restated from item 10 with the gate's own evidence behind it. A-51 folded `CLEAR`'s hardware check
into **row C** precisely so the row count would not move — and if it had moved, nothing would have
caught the runbook's "Seven rows" sentence going stale. `docs/TESTING.md` is named by a spec but its
**contents** are not gated either: every count in it was hand-transcribed from a runner, including the
tables plan 10-14 wrote.

**What would close it.** For the runbook, a `ROW_COUNT`-shaped gate: row letters parsed out of the
table, the count asserted against the sentence, every block caption checked against
`install-copy.ts`'s exports. For `docs/TESTING.md`, the honest answer is that a document of observed
numbers cannot be gated against the tree without re-running the tree — so the useful gate is narrower:
assert that every spec path named in it exists, and that every spec file in `src/` is named in it.
