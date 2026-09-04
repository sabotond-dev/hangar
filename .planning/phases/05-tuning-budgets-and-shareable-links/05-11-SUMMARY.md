---
phase: 05-tuning-budgets-and-shareable-links
plan: 11
subsystem: ui
tags:
  [
    svelte5,
    snippets,
    shallow-routing,
    playwright,
    canvas,
    clipboard,
    lazy-loading,
    accessibility,
  ]

# Dependency graph
requires:
  - phase: 04-first-experience
    provides: "Coverflow.svelte's route logic, the engines/elements maps, ChosenPanel's reserved region, TryOnDevice's state machine and the page.state.chosen history flag"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-01's SimHost.replaceEngine - the in-place engine swap this plan exists to call"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-04's buildTuner/Tuner and its precomputed stamp()"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-05's parseHash/decodeFor and the three landings, and 05-01's shareUrl"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-09's CopyLink.svelte and StampNotice.svelte, 05-10's TuningRegion.svelte and the ChosenPanel tuning/share snippet seam, and the quick baseline of 58 files / 646 tests"
provides:
  - "src/lib/ui/Coverflow.svelte's tuning and share snippets - the front door's reserved region is no longer empty"
  - "Knob indices held per entry id in the row, so re-choosing and stepping back restore what the visitor left"
  - "The live preview: onpreview goes engines.set then host.replaceEngine, never register"
  - "The stamp landing: parseHash/decodeFor through await import, after the entry is centred, auto-choosing with replaceState"
  - "e2e/tuning.e2e.ts - 8 Playwright tests against build/ under wrangler dev, including the no-clipboard fallback"
  - "OBSERVED: the front door's first paint fetches ZERO .wasm responses, asserted for / for the first time"
  - "MEASURED: with register in place of replaceEngine the hero's backing store is torn down (width 0 then 9) on every knob turn; with replaceEngine there are zero width writes"
  - "MEASURED: deleting stamp.ts's entry-consistency guard makes a Dial link land 'restored' on Joystick with knobs [0,1,0,0,4] and Setup 391 where Joystick's defaults are [0,0,1,2,4] and Setup 535"
  - "RECORDED: replaceState('', ...) normalises the URL and DROPS the fragment, so the address bar reads /c/aurora/ immediately after a stamped link lands"
affects: [05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A component whose state is built once in onMount is wrapped in {#key} by its caller when its identity prop can change, so a step re-creates it rather than leaving it tuning the previous entry"
    - "{@const id = centred.id} inside the {#key} block closes the entry id over the callbacks, so a late emit is filed under the entry it describes rather than under whatever is centred by then"
    - "A Playwright wait anchored on the component's own published aria-busy rather than on its text: the numerals still read the PREVIOUS number through the whole stale window, so a text-only wait returns the wrong measurement"
    - "about:blank between two same-path gotos, because a fragment-only navigation keeps the document and onMount never runs again"
    - "A test file that must satisfy a plain grep gate does not write the forbidden token in its prose either - the opposite trade to TuningRegion.svelte's comment-stripping scanner, chosen because the gate here is a grep the plan can quote"

key-files:
  created:
    - e2e/tuning.e2e.ts
  modified:
    - src/lib/ui/Coverflow.svelte

key-decisions:
  - "The tuning snippet is wrapped in {#key centred.id}. TuningRegion builds its tuner once, in its own onMount, so a changed entryId prop would leave it tuning the entry the visitor has just stepped away from - W-20's 'the panel re-fills' would have re-filled the name plate and not the knobs. Keying it rebuilds the tuner for the neighbour with that entry's own indices out of knobIndices"
  - "A fifth rune, landedId, scopes the landing to the entry the URL named. Without it, stepping one away while chosen mounts a fresh region that reads landing.kind === 'restored' and tells the visitor these knobs came with the link - about a configuration the link never mentioned"
  - "An $effect clears overBudgetReason and shareStamp whenever the region reporting them goes away. Neither report is emitted on mount: onover fires only when a measurement crosses 908 and the Lua route never calls it at all, so a reason left over from another entry would disable TRY ON DEVICE for a configuration comfortably inside the budget"
  - "land() re-imports $lib/catalog dynamically rather than taking byId as a parameter. The parameter would have needed a CatalogEntry type import, and the file's whole discipline is that it names neither the catalog's heavy half nor the stamp module statically. The module record is already resolved, so the second import costs a microtask"
  - "e2e test 1 runs under reduced motion. Aurora is declared animated, so on a full-motion page two canvas samples differ whether or not the knob did anything - the test would have passed against an implementation where turning a knob does nothing. Reduced motion holds the engine on one frame, and the stillness is asserted on both sides of the turn"
  - "The e2e file does not write the WebKit grep tag anywhere, prose included, so the plan's `grep -c` gate is literally satisfiable. This is the opposite trade to 05-10's comment-stripping scanner and it is deliberate: the gate here is a grep a plan can quote, and `npx playwright test --project webkit-phone --list` reporting zero tests is the stronger check beside it"

patterns-established:
  - "Pattern: when a negative check does not reproduce the predicted symptom, keep going until it reproduces SOMETHING measurable and record what that turned out to be. The register mutation did not stall the pad on this machine; it did tear the backing store down, and that is the difference replaceEngine exists to remove"
  - "Pattern: a negative check whose payload was minted by the product itself. The foreign stamp used against the decoder was produced by opening Dial, turning its rails and reading the URL out of the no-clipboard fallback field - so the check ran against a real link rather than an invented string"

requirements-completed:
  [TUNE-01, TUNE-02, TUNE-03, TUNE-06, TUNE-07, SHARE-01, SHARE-02, SHARE-03]
requirements-contributed: [DEGR-01]

# Metrics
duration: 28min
completed: 2026-09-04
---

# Phase 5 Plan 11: The Coverflow Wiring Summary

**The front door's reserved region is full: a knob turn swaps the hero's engine in place through
`replaceEngine` — measured to write nothing to the canvas's backing store, where `register` tears it
down and rebuilds it on every turn — a stamped link lands centred, chosen and restored, an unreadable
one lands on the base configuration and says so, and eight Playwright tests hold the whole journey
against the bytes that get deployed.**

## What a knob turn does now

A visitor on `/` chooses the centre pad, and region 4 — an empty dashed box between the previous two
commits — fills with the caption, the rack, `SURPRISE ME` / `RESET ALL`, both meters and both message
slots. Turning a knob:

1. `TuningRegion` calls the tuner, which rebuilds a `PadSim` synchronously and emits `onpreview`;
2. `Coverflow.applyPreview` puts the new engine in the session `engines` map and calls
   `host.replaceEngine(id, engine)` — the canvas, its 9×9 backing store, its `IntersectionObserver`
   registration and its slot state all survive;
3. both meters go stale for ~160 ms and land on a new number (Aurora: Setup 250 → 256 on one
   `ArrowRight` on Speed; Timer stays at 55);
4. `onstamp` recomposes the share URL, so `COPY LINK`'s handler still holds a finished string and
   awaits nothing.

Stepping one away and back returns to the **tuned** pad, because the tuned engine went into the
session map and the indices went into `knobIndices` under the same key.

## The two behavioural negative checks, observed

### 1. `register` in place of `replaceEngine`

The swap was replaced with `host.register(id, canvas, engine)`, the site rebuilt, and the hero's
`canvas.width` setter and `putImageData` instrumented in Chromium. Turning the first rail:

| | `register` (mutation) | `replaceEngine` (shipped) |
|---|---|---|
| writes to `canvas.width` after the turn | `0` at +2 ms, then `9` at +2 ms | **none** |
| zero-width writes | **1** | **0** |
| paints in the 700 ms before the turn | 21 | 21 |
| paints in the 700 ms after | 21 | 22 |
| longest gap between paints, before / after | 35 ms / 41 ms | 35 ms / 41 ms |
| first paint after the turn | +2 ms | +2 ms |

**Recorded honestly, including where the prediction did not hold.** `replaceEngine`'s doc comment
says `register` would "blank the hero for a frame and then stall it until the IntersectionObserver
fires again". The blanking is real and measurable — the backing store is destroyed and reallocated on
**every knob turn** — but on this machine the observer answered within a frame, so the stall was one
paint interval (41 ms against 35 ms) rather than the indefinite freeze the comment describes. The
freeze is what happens when the observer does *not* re-fire promptly; the tear-down is what happens
every time. `replaceEngine` removes both, and the e2e suite now asserts the backing store is still
9×9 after a turn so the mutation is a red test as well as a measurement.

### 2. The decoder's entry-consistency guard, deleted

`src/lib/share/stamp.ts`'s `if (encodeStamp(rebuilt) !== payload) return UNREADABLE;` was replaced
with `void rebuilt;` and the site rebuilt. The payload used was **minted by the product itself**: Dial
was opened, its three rails turned, and the URL read out of the no-clipboard fallback field —
`https://hangar.sabotond.workers.dev/c/dial/#z.btfq091v8j520ka0`.

Opening that link's fragment under four other cards, guard off versus guard on:

| Card | guard OFF — notice | knobs | Setup | guard ON — notice | knobs | Setup |
|---|---|---|---|---|---|---|
| joystick | "These knobs came with the link." | `[0,1,0,0,4]` | 391 | "could not be read" | `[0,0,1,2,4]` | 535 |
| radar | "These knobs came with the link." | `[0,1,1,4]` | 448 | "could not be read" | `[0,1,0,4]` | 438 |
| faders | "These knobs came with the link." | `[1,1,4]` | 515 | "could not be read" | `[0,0,4]` | 513 |
| starfield | "These knobs came with the link." | `[0,0,4]` | 238 | "could not be read" | `[0,0,4]` | 238 |
| aurora | "These knobs came with the link." | defaults | 250 | "could not be read" | defaults | 250 |

**This is exactly the failure SHARE-03 exists to prevent, and it is worth having seen.** With the
guard deleted, a link somebody made from Dial lands under **Joystick's** name plate on a configuration
nobody built — five knob positions and a character count that are neither the sender's nor the card's
— while the panel says *"These knobs came with the link."* Restored, the same URL lands on Joystick at
its defaults with *"That link's knob settings could not be read, so this is Joystick at its
defaults."*

Two rows of that table are worth noting rather than smoothing over: on **aurora** and **starfield**
the bogus stamp happens to read back as the card's own defaults, so the only damage there is the
notice telling a lie. The plan's own suggested payload, `#z.pdial`, is one of those cases — which is
why the real check was run with a payload minted from a live card as well.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 — Missing critical functionality] `TuningRegion` had to be keyed on the centred id**

- **Found during:** Task 1, writing the snippet
- **Issue:** `TuningRegion` builds its tuner once, in its own `onMount`, and never reads `entryId`
  again. Stepping one away while chosen (`STEP_AWAY_LIMIT = 1`, W-20) changes `centred`, so the name
  plate, the panel's `data-entry` and `TryOnDevice` would all follow the neighbour while the rack, the
  meters and the stamp went on describing the entry the visitor had left.
- **Fix:** `{#key centred.id}` around the region, with the reason beside it. The new region picks that
  entry's own indices out of `knobIndices`.
- **Commit:** `30e3bd6`

**2. [Rule 1 — Bug] The landing was not scoped to the entry the URL named**

- **Found during:** Task 2
- **Issue:** with `landing` a single rune, stepping one away from a landed link mounts a fresh region
  that reads `landing.kind === "restored"` and says *"These knobs came with the link"* about a
  configuration the link never mentioned.
- **Fix:** a fifth scalar rune, `landedId`, and `const landingFor = $derived(centred.id === landedId ? landing : NO_LANDING)`.
- **Commit:** `6d240c3`

**3. [Rule 1 — Bug] The panel's reported state outlived the region that reported it**

- **Found during:** Task 1
- **Issue:** `onbudget` and `onstamp` fire on change, not on mount — `measurePadsim` calls
  `onover(undefined)` only once its first measurement lands, and the Lua route never calls it at all.
  A reason left behind by another entry, or by the previous time the panel was open, would disable
  `TRY ON DEVICE` with a budget message for a configuration comfortably inside 908.
- **Fix:** a small `$effect` that clears `overBudgetReason` and `shareStamp` whenever the chosen entry
  changes or the panel closes, keyed on a plain local so it cannot loop.
- **Commit:** `30e3bd6`

**4. [Rule 1 — Bug] The e2e meter wait read the number the knob had just replaced**

- **Found during:** Task 3's first run — 4 of 8 tests red
- **Issue:** the first draft waited for the numerals to leave `measuring…`. A knob move puts the
  meters into the **stale** state, where the numerals still show the PREVIOUS number, so the wait
  returned instantly with the old measurement. `RESET ALL` read `256 / 908` where the defaults are
  `250 / 908`, and the meters test concluded that a knob turn had moved nothing.
- **Fix:** `settled()` waits on the meter's own `aria-busy="false"`, which covers measuring and stale
  both; `recomputed()` additionally asserts the stale phase happened, so an implementation that
  compiled synchronously on every keystroke — which the 120 ms debounce exists to prevent — turns the
  helper red rather than making it meaningless.
- **Commit:** `a418de5`

**5. [Rule 1 — Bug] Two e2e tests navigated without loading a document**

- **Found during:** Task 3's first run
- **Issue:** tests 6 and 7 open `/c/aurora/` and then `page.goto("/c/aurora/#z...")`. That is a
  **fragment-only** navigation: the browser keeps the document, `Coverflow` never remounts, and the
  landing — which runs once, in `onMount` — never happens. Both tests looked for a stamp notice that
  was never rendered.
- **Fix:** `await page.goto("about:blank")` first, so the next `goto` is the cold arrival a shared link
  actually is. The reason is written into both tests.
- **Commit:** `a418de5`

### Deliberate departures from the plan's text

**6. Test 1 runs under reduced motion.** The plan says "sample the hero canvas, move a knob, sample
again, assert the two samples differ". Aurora is declared `animated`, so on a full-motion page those
two samples differ whether or not the knob did anything — the test would have passed against an
implementation where turning a knob does nothing at all. Under `emulateMedia({ reducedMotion })` the
host holds every engine on one representative frame, so the test asserts the pad is still, turns the
knob, asserts the frame changed, asserts the backing store is still 9×9, and asserts the pad is still
again. The reduced-motion branch is asserted as a precondition through `window.matchMedia`, which is
the 04-09 lesson about `test.use({ reducedMotion })` alone not being enough.

**7. The WebKit grep tag is not written anywhere in `e2e/tuning.e2e.ts`, prose included.** The
acceptance gate is `grep -c "@webkit" e2e/tuning.e2e.ts` printing `0`, and a comment naming the tag
would make that gate permanently red on correct code — the `setInterval` problem 05-10 solved the
other way, with a comment-stripping scanner. Here the gate is a plain grep a plan can quote, so the
file explains the rule without spelling the token, and
`npx playwright test --project webkit-phone --list` reporting **0 tests in 0 files** is the stronger
check beside it.

**8. `land()` imports `$lib/catalog` itself** rather than taking `byId` as a parameter, which would
have required a `CatalogEntry` type import. The module record is already resolved by the engine loop a
few lines above, so the second `await import` costs a microtask and the file still names neither the
catalog's heavy half nor the stamp module in a `from` specifier.

## Two consequences, stated plainly so nobody files them as bugs

**Stepping to another entry drops the stamp.** `syncAddress()` replaces the URL with
`resolve("/c/[id]", …)`, which has no fragment, so arriving on a tuned link and pressing the right
arrow leaves a plain `/c/<next>/` in the address bar. That is correct: a different entry is a
different configuration, and Phase 5 deliberately never writes the hash (SHARE-05 is deferred). This
plan edits none of `syncAddress`, `choose`, `unchoose`, `stepBy`, `goTo`, `afterStep` or the slot
arithmetic — `git diff HEAD` over the file matches none of those names.

**The auto-choose also drops the fragment, immediately.** `replaceState("", { chosen: true })`
resolves `""` against the current URL, and `new URL("", "http://host/c/aurora/#z.x")` is
`http://host/c/aurora/` — so a tuned link lands correctly, restores every knob, opens the panel, and
then the address bar reads `/c/aurora/` with no hash. **Observed**, three times, on the shipped build.
The knobs are unaffected; what is lost is that a manual reload from the address bar would return to
the defaults, and that copying the address bar rather than pressing `COPY LINK` would share the base
configuration. The alternative is a first argument the `svelte/no-navigation-without-resolve` rule
cannot type-check, which would need the suppression this plan's acceptance criteria forbid. `COPY LINK`
composes its own absolute URL from `shareUrl` and is unaffected — which is a large part of why it
exists.

## A latent trap, recorded rather than fixed

`buildTuner`'s `destroy()` calls `closeEngine(engine)`, and the tuned engine is also the one this plan
puts into the row's session `engines` map. For a `padsim` entry that is a no-op — `PadSim` has no
`close` — so nothing is wrong today, and D-18 keeps every Lua entry in `EXCLUDED_FROM_ROW` rather than
in `FRONT_DOOR`. **The first Lua entry that joins the row must revisit this**: un-choosing it would
close the VM behind an engine the shelf card is still registered against. Fixing it belongs in the
model or in the engine's ownership rule, not in this component, so it is written down here instead of
patched around.

## The e2e file, and what each test is really asserting

| # | Test | The property, and its precondition |
|---|---|---|
| 1 | a knob turn changes the pad | Preamble: a cold `/`, front door up, `aurora` painted, `networkidle` — **zero `.wasm` responses**. Then, under reduced motion: still for 400 ms → `ArrowRight` on the first rail → the frame changed → backing store still 9×9 → still for 400 ms again |
| 2 | the two meters read two different numbers and both change on a knob turn | Both leave `measuring…`, both match `^[0-9]+ / 908$`, Setup ≠ Timer, and at least one moves on the turn |
| 3 | RESET ALL puts every knob back and is disabled once they are back | Disabled on arrival (the precondition), enabled after two turns, and the indices AND both numerals return to what arrival showed |
| 4 | SURPRISE ME moves the knobs and lands inside the budget | The roll finishes (`aria-busy` clears), at least one index moved, neither meter carries the `over` class, neither percentage exceeds 100 |
| 5 | COPY LINK confirms in its own state and copies the link | Label `COPY LINK` → `LINK COPIED`, and the clipboard text is exactly `shareUrl("aurora", payload)` and differs from the defaults' URL |
| 6 | a shared link lands on the tuned configuration with the panel open | A cold arrival on the copied address: panel open **on arrival**, name plate Aurora, the restored notice, and every knob index equal to what was sent |
| 7 | a link that cannot be read lands on the configuration as it ships | Defaults read from a clean arrival first, then `#z.pdial`: the unreadable sentence verbatim from `copy.ts`, name plate Aurora, indices equal to the defaults, `RESET ALL` disabled |
| 8 | with no clipboard API the link is offered for selection instead | `"clipboard" in navigator` is `false` **before anything is clicked**, then the readonly field with `aria-label="Shareable link"`, exactly `shareUrl(...)`, computed `16px`, and the button still labelled `COPY LINK` |

`console` errors are asserted empty in **all eight**, with the protocol package's `console.log` noise
filtered the way the existing specs filter it. Both string sources are imported rather than
transcribed: `shareUrl` from `$lib/share/url` and eight strings from `$lib/tune/copy`, both of which
import nothing at all.

Deleting `navigator.clipboard` needed **both** forms — `Navigator.prototype.clipboard` and the
instance property — and the precondition assertion is what proves the branch was forced rather than
waited for.

## Verification

| Gate | Result |
|------|--------|
| `npm run build` | clean; `source-a418de56….tar.gz` 738 KB |
| `npm run check` | `492 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `npm run test:quick` | **58 files / 646 passed, 1 todo** — unchanged from `05-10-SUMMARY.md` |
| `npm run test:sweep` | **3 files / 13 passed** — unchanged |
| `npm run test:e2e` | **32 passed** = `PREV_E2E` 24 + 8; `check-counts.mjs --playwright 32` exit 0 |
| `grep -c failed .tmp-e2e/tuning.log` | `0` |
| `npx playwright test e2e/tuning.e2e.ts --project chromium` | `8 passed` |
| `npx playwright test --project webkit-phone --list` | `Total: 0 tests in 0 files` |
| `grep -c "@webkit" e2e/tuning.e2e.ts` | `0` |
| `config-shape.spec.ts` + `tune-ui.spec.ts` + `front-door.spec.ts` | 3 files / 27 passed |
| `git diff --quiet HEAD -- src/lib/config-shape.spec.ts` | exit 0 |
| `grep -c "replaceEngine" src/lib/ui/Coverflow.svelte` | `3` (one call, two mentions in its comment) |
| `host.register` call sites in `Coverflow.svelte` | `1` — the one in `adopt()`, unchanged |
| new `eslint-disable` / `svelte-ignore` in the diff | `0` |
| `from` specifiers naming `share/stamp` | `0` |
| `pushState` added by the diff | `0` calls (one mention in a comment); `replaceState` added: one call |
| listener on 4173 after the run | none |

Whole-suite arithmetic against `05-10-SUMMARY.md`: quick **58 / 646** unchanged, sweep **3 / 13**
unchanged, e2e **24 → 32** (+8, all in `e2e/tuning.e2e.ts`).

## Known Stubs

None. `05-10-SUMMARY.md`'s one known stub — region 4 rendering nothing on the live front door because
`Coverflow` did not pass the `tuning` snippet — is closed by commit `30e3bd6` and is now covered by
eight browser tests.

## Self-Check: PASSED

Files:

- FOUND: `e2e/tuning.e2e.ts`
- FOUND: `src/lib/ui/Coverflow.svelte` (modified)
- ABSENT, as required: any scratch route or probe file inside the repository

Commits: FOUND `30e3bd6`, FOUND `6d240c3`, FOUND `a418de5`.
