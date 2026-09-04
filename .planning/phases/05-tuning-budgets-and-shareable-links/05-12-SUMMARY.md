---
phase: 05-tuning-budgets-and-shareable-links
plan: 12
subsystem: ui
tags:
  [
    playwright,
    webkit,
    degrade,
    budgets,
    prerender,
    dev-probe,
    clipboard,
    container-queries,
    documentation,
  ]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-04's buildTuner and its `reserved` option - the only way any caller reaches over budget"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-10's TuningRegion.svelte, which takes an entry ID and an optional reserved so a probe needs no fake catalog entry"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-11's e2e/tuning.e2e.ts and its conventions - about:blank before a fragment navigation, aria-busy as the meter wait, reduced motion via page.emulateMedia"
  - phase: 04-first-experience
    provides: "TryOnDevice.svelte's budgetReason prop and Phase 4's failureCopy, both consumed unchanged"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-01's two Playwright projects, and the webkit-phone grep that had run zero tests until now"
provides:
  - "src/routes/dev/tune/ - the fourth unlinked probe: the tuning region over a real PadReserved, the only browser path to the over-budget state"
  - "e2e/tuning.e2e.ts at 10 tests: the red meter, the disabled primary control with its reason, the named knob, TURN IT DOWN and the way back inside"
  - "e2e/tuning-webkit.e2e.ts - 5 tests, every title tagged, so each runs in both projects and the suite is 32 -> 44"
  - "MEASURED: tpad's whole 512-state knob cross-product spans Setup 902..907, so { setup: 3 } is the reserve that straddles 908 with knob positions on both sides"
  - "MEASURED on both engines: webkit-phone resolves clipboard.writeText with no grant and confirms; headless chromium rejects it without an explicit grantPermissions"
  - "MEASURED: a knob row is side by side at 393px and stacked at 320px, classified from both boxes rather than from y"
  - "docs/TESTING.md's Phase 5 section, and docs/PIN-POLICY.md's sixth bump-checklist item"
affects: [06, 07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A dev probe that mounts a real component over a real domain object, with a second-opinion readout computed independently in the page - so a test holds the rendered numbers against the compiler's answer rather than against a literal"
    - "A Playwright wait chosen per direction: aria-busy where the component publishes it, a polled value where the component's own rules make aria-busy unavailable"
    - "A layout assertion classified from both bounding boxes into a word (side-by-side / stacked / other), so the poll after a viewport change waits for a layout rather than for a pixel"
    - "A cross-project e2e file: every title tagged, chromium ungrepped, so the same assertions run on two engines and the arithmetic (a tagged title counts twice) is written into the file's header"
    - "An engine-specific capability granted per browserName so both projects assert the SAME branch, with the measured difference recorded rather than the assertion loosened"

key-files:
  created:
    - src/routes/dev/tune/+page.svelte
    - e2e/tuning-webkit.e2e.ts
  modified:
    - e2e/tuning.e2e.ts
    - docs/TESTING.md
    - docs/PIN-POLICY.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "The probe's reserve is { setup: 3, timer: 0 }, not 05-04's { setup: 20 }. Measured: tpad ships at Setup 902/908 and its 512-state cross-product spans 902..907, so 3 puts the top of the band over 908 and leaves the bottom inside. At 20 every state is over, and the knob branch, TURN IT DOWN and the way back inside are all unreachable from a page"
  - "The probe opens at Scroll's last index (910/908, over by 2) so the ARRIVED branch is what a browser sees first, with no back-off control at all - tpad's only sheet is sends and the compiler refuses to shed sends, so fit() returns no steps and an empty backOff renders nothing. The KNOB branch is one key press away in each direction"
  - "remeasured(): meterView makes `over` outrank the feed, so an over-budget meter publishes aria-busy=false throughout the recompile and 05-11's recomputed() times out on it. The anchor for that direction is the number itself, polled; recomputed() is kept for in-budget-to-over, where the stale phase is real and worth asserting"
  - "The WebKit clipboard test grants for chromium only. Measured: webkit-phone resolves writeText unaided and confirms, headless chromium rejects it with NotAllowedError unless granted. The difference is the harness's permission model and it falls the reassuring way round, so both projects assert the same branch rather than the assertion being loosened to accept either"
  - "The stacking assertion lives at a 320px viewport, not at the phone's 393px: the region's content box there is ~265px, above Knob.svelte's 220px threshold, so the row genuinely does not stack and asserting that it does would be asserting something false"
  - "TryOnDevice is mounted with a FrontDoorEntry built in the page rather than looked up, because tpad is in EXCLUDED_FROM_ROW - which is the fourth reason the probe exists"

patterns-established:
  - "Pattern: when a probe must describe its siblings, check what scans the file first. config-shape.spec.ts test 5 is a plain substring scan over src/routes/ and it reads comments, so the header describes the walking skeleton's route instead of naming it"
  - "Pattern: state the expected branch in a comment BEFORE the assertion, then measure both engines and record the numbers. The plan asked for it; it turned a one-line assertion into a documented finding"

requirements-completed: [TUNE-04, TUNE-05, SHARE-04, DEGR-01]
requirements-contributed: [DEGR-02]

# Metrics
duration: 43min
completed: 2026-09-04
---

# Phase 5 Plan 12: The Probe, The Phone and The Record Summary

**The over-budget guard nobody can reach is now a thing a browser has been watched doing — against a
budget the compiler really refused, produced by a real `PadReserved` of three characters on the
tightest card in the tree — and the half of the site that needs no hardware is proven on the engine
that can never have any, five tests running twice, at the width most visitors will hold it.**

## The reserve, measured

The plan said to start from 05-04's recorded `tpad` reserve and adjust until **both** over-budget copy
branches were reachable from the page. 05-04's `{ setup: 20 }` cannot do that, and the measurement
says why.

`tpad` at its defaults is **Setup 902 / 908**. Its whole knob cross-product — three knobs of eight
positions each, **512 states**, every one costed through `$lib/pad` — spans:

| Setup | states |
| ----- | ------ |
| 902   | 1 (the defaults, which take `stateOf`'s `resetAll` path) |
| 903   | 96 |
| 904   | 160 |
| 905   | 48 |
| 906   | 127 |
| 907   | 80 |

The whole reachable band is **six characters wide**. Any reserve large enough to clear 908 by a
comfortable margin puts every state over it, and 05-04's 20 does exactly that (922 at the defaults,
923 at the cheapest knob position) — so a page using it can show the block but can never show the knob
that caused it, the back-off, or the way back inside.

**`{ setup: 3, timer: 0 }`** straddles the budget. With the other two knobs at their defaults the
Scroll knob alone crosses it:

| Scroll index | raw Setup | with the reserve | state |
| ------------ | --------- | ---------------- | ----- |
| 0–3          | 904       | **907 / 908**    | in budget, 1 to spare |
| 4 (default)  | 902       | **905 / 908**    | in budget, the card as published |
| 5            | 906       | **909 / 908**    | over by 1 |
| 6, 7         | 907       | **910 / 908**    | over by 2 |

The probe opens at index 7. Rehearsed in node before a line of the page was written, and then
observed in Chromium:

| Step | Setup | pct | block |
| ---- | ----- | --- | ----- |
| mount, Scroll 7 | 910 | 101 | *"This configuration starts 2 characters over 908 on Setup."* — no `TURN IT DOWN` |
| `Home` → Scroll 0 | 907 | 99 | empty |
| `End` → Scroll 7 | 910 | 101 | *"Scroll pushed Setup 2 characters over 908."* + `TURN IT DOWN` + *"Puts Scroll back where it was, and Setup at 907 of 908."* |
| the click | 907 | 99 | empty |

**Both branches are reachable, and they are reachable in that order for a reason.** The ARRIVED
sentence needs `moved === undefined`, which is only true before any knob has been touched (or after
`RESET ALL`, which clears it) — so the probe has to open over budget to show it. The KNOB sentence
needs a culprit **and** a measured in-budget number to name in the back-off line, which is why the
test goes down first and comes back up.

**The empty back-off corner is real and it is shown honestly.** `tpad`'s only sheet is `sends` and the
compiler refuses to shed sends, so `fit()` returns `{ fits: false, steps: [], blocked: "sends" }` at
every reserve. With no culprit and no ladder step there is genuinely nothing to offer, and
`BudgetMessage.svelte` renders no control rather than inventing one. Test 9 asserts that count is
**zero**, so the corner is covered rather than merely tolerated.

## What the probe is, and what it is not

`/dev/tune/` mounts `TuningRegion` for `tpad` with the measured `reserved`, plus the real
`TryOnDevice` so the disabled primary control and its reason are on the page rather than in a prop.
Four things it deliberately is not:

- **Not a fake cost.** `reserved` is charged by the vendored `cost()` itself and `validate()` writes
  its own sentence about it. No test-only prop was added to any shipped component; `TuningRegion`'s
  `reserved` prop already existed for Phase 7's install marker, which is the same mechanism.
- **Not a fake entry.** `tpad` is in the catalog and in `EXCLUDED_FROM_ROW`, so there is no `/c/tpad/`
  page — which is exactly why mounting it needs a probe and why the probe cannot disturb the front
  door. `TryOnDevice`'s `FrontDoorEntry` is built in the page from `byId("tpad")`, with `motion: "dark"`,
  the value `front-door.spec.ts` derives for it from `golden-frames.json`.
- **Not linked.** `e2e/fidelity.e2e.ts`'s site-wide `a[href*="/dev/"]` assertion covers it and was
  re-run unchanged (`2 passed`). No duplicate assertion was added.
- **Not a mirror of the meters.** `probe-cost` recomputes the cost from the indices the region
  reports, through `$lib/pad` and the same `compilerKnobs` rack `model.ts` resolves, and writes its
  failure branch into the same element. Test 9 asserts the rendered numerals **equal** that
  independent answer, so the assertion is against the compiler rather than against a literal that
  would rot the day the pin moves.

## The WebKit clipboard branch, observed

The plan asked for the expected branch to be stated before the assertion, and for the finding to be
recorded if the fallback appeared instead. Both engines were measured directly, before the assertion
was written:

| Project | `navigator.permissions.query({name:"clipboard-write"})` | `writeText` | button | fallback field |
| ------- | ------------------------------------------------------- | ----------- | ------ | -------------- |
| `webkit-phone` | **TypeError** (not implemented) | **resolved** | `LINK COPIED` | absent |
| `chromium` (no grant) | `"prompt"` | **rejected**: `NotAllowedError: Failed to execute 'writeText' on 'Clipboard': Write permission denied` | `COPY LINK` | revealed |

**The expected branch is confirmed on WebKit, unaided.** That is the fact that mattered: the phase's
activation discipline — a URL precomputed on every knob change, no `await` in front of the call —
exists precisely because Safari expires a transient activation across an await, and the browser it
exists for takes the confirm branch with no help at all.

The chromium refusal is the **harness's permission model**, not a product defect: `e2e/tuning.e2e.ts`'s
sharing block already grants `clipboard-read`/`clipboard-write` for its own clipboard read, and
`grantPermissions` does not accept those names on WebKit at all. So the grant is made for
`browserName === "chromium"` only and both projects assert the **same** branch — the confirm state
**and** the absence of the fallback field, so a silent branch flip is a red test rather than a passing
one that proved nothing. Nothing was loosened to accept either branch.

## The phone facts, measured rather than assumed

- **393 px is not a stacking width.** At the phone project's own viewport the first rail knob's label
  and control are **side by side**, exactly as at 1280 px. Narrowed to **320 px**, the same row is
  **stacked**: the control's `x` equals the label's and its top is at or below the label's bottom.
- **Nothing scrolls sideways at either width.** `scrollWidth <= clientWidth` measured on
  `knob-rack`, `tuning-region` and `chosen-panel`, at the project's own width and again at 320 px.
  D-11's "wrap, never scroll" is a measurement in this file, not a style grep.
- **The meters settle on WebKit**, which is the only external evidence that `$lib/tune/idle`'s
  `setTimeout` fallback fires where `requestIdleCallback` does not exist: if the prefetch never ran,
  no number would land and both meters would still read `measuring…`.
- **Install is present, really `disabled`, and names the browsers that can.** Test 5 deletes `serial`
  in both projects — a no-op on WebKit, which has never had it — asserts its own precondition, and
  asserts the `connect-status` carries `failureCopy("no-web-serial", undefined, "TRY ON DEVICE")`'s
  title, detail and step, imported from `src/lib/transport/transport.ts` rather than transcribed. No
  string on the page contains "Chromium".

## The arithmetic, and the tagging negative check

`playwright.config.ts` gives `chromium` no `grep`, so a `@webkit` title runs **twice**. Five tagged
tests therefore contribute **ten**, and the suite is `PREV_E2E` 32 + 2 (chromium-only, the probe
tests) + 10 = **44**.

Observed, quoted:

| Run | Result |
| --- | ------ |
| `npx playwright test e2e/tuning.e2e.ts --project chromium` | `10 passed` |
| `npx playwright test e2e/tuning-webkit.e2e.ts --project chromium` | `5 passed` |
| `npx playwright test --project webkit-phone` | `5 passed` |
| `npm run test:e2e` | `44 passed`; `check-counts.mjs --playwright 44` exit 0 |
| **negative check** — `@webkit` removed from test 1's title, `--project webkit-phone` | `4 passed` |
| **restored**, `--project webkit-phone` | `5 passed` |

Per file and per project, from the whole run: `first-experience` 11, `tuning` 10, `tuning-webkit` 5 +
5, `smoke` 4, `artifacts` 3, `catalog` 2, `fidelity` 2, `skeleton` 2.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — Blocking] The probe's header could not name the walking skeleton's route**

- **Found during:** Task 3's gate — `npm run test:quick` reported `1 failed | 57 passed`
- **Issue:** `src/lib/config-shape.spec.ts` test 5 reads every file under `src/routes/` except the
  skeleton's own directory and fails on any occurrence of that route's path. It is a plain substring
  scan and it reads **comments**. The probe's header listed its three sibling probes by path.
- **Fix:** the three are described rather than spelled, with the reason and the observation written
  beside them. The spec was not touched — `git diff --quiet HEAD -- src/lib/config-shape.spec.ts`
  exits 0. This is `TuningRegion.svelte`'s `setInterval` lesson again, answered the way
  `e2e/tuning.e2e.ts` answered its own grep gate: by not writing the token.
- **Commit:** `f51c6de`

**2. [Rule 1 — Bug] The e2e meter wait cannot use `aria-busy` when the meter starts over budget**

- **Found during:** Task 1's first run — test 10 red, `recomputed()` timing out
- **Issue:** `meterView` makes `over` outrank the feed — "a warning is never dimmed" — so an
  over-budget meter publishes `aria-busy="false"` for the whole of the 120 ms recompile. 05-11's
  `recomputed()`, which waits for `aria-busy="true"`, can never see it.
- **Fix:** `remeasured(page, was)` polls the number until it is no longer the one on screen when the
  key went down, then calls `settled()`. `recomputed()` is kept for the in-budget-to-over direction,
  where the stale phase is real, so the debounce keeps its own assertion. Both are documented with
  the observation.
- **Commit:** `347430a`

**3. [Rule 1 — Bug] The WebKit layout assertion compared tops, not boxes**

- **Found during:** Task 2's first run — `knob-colour`'s label at `y` 901, its control at 938
- **Issue:** the first draft asserted `label.y === control.y` for "side by side". A knob row is a grid
  with `align-items: center`, so a 14 px label and a taller control have different tops while sitting
  perfectly side by side. The assertion was red on correct code.
- **Fix:** `rowLayout()` classifies from both boxes into a word — `side-by-side`, `stacked` or
  `other` — using x-ordering plus vertical overlap for one and equal x plus a real vertical gap for
  the other, and the poll after the resize waits for the layout rather than for a pixel. It also
  selects the first **rail** row that is not declared `stacked`, because a words or swatch row stacks
  at every width by construction.
- **Commit:** `a59856f`

**4. [Rule 1 — Bug] Test 5 followed a minted link off the local build**

- **Found during:** Task 2's first run — `coverflow` not found, the page reading
  `Authentication required.`
- **Issue:** `shareUrl` names the **deployed** origin, because a shared link goes into somebody else's
  chat window. Following it verbatim left `127.0.0.1:4173` entirely and landed on the real site's
  Basic Auth gate.
- **Fix:** `new URL(link)`, then `pathname + hash` — only the origin is swapped, exactly as
  `e2e/tuning.e2e.ts` test 6 does. The reason is written into the test.
- **Commit:** `a59856f`

### Deliberate departures from the plan's text

**5. The reserve is 3, not "something like 05-04's 20".** The plan authorised this explicitly
("choose `RESERVE` by measurement… adjust until both branches are reachable"). The measurement and the
whole 512-state distribution are above, and the page's header carries the table.

**6. Test 3 runs under reduced motion.** The plan says "turn a knob, assert the hero canvas changed".
Aurora is declared `animated`, so on a full-motion page two samples differ whether or not the knob did
anything — 05-11's lesson, applied to the new file. The stillness is asserted on both sides.

**7. Two stale numbers outside this plan's file list were corrected.** `docs/TESTING.md`'s
"How to run it" table and its `23 tests` Playwright line were both from before this phase, and
`docs/PIN-POLICY.md`'s item 1 still said the sweep reports 9. Every replacement is an observed number
from this session. The phase's `deferred-items.md` had already recorded both as jobs for phase close;
they are now marked resolved there.

## The full gate

| Gate | Result |
| ---- | ------ |
| `npm run check` | `494 FILES 0 ERRORS 0 WARNINGS`; 7 s |
| `npm run lint` | exit 0; 14 s |
| `npm run test:quick` | **58 files / 646 passed, 1 todo** — `check-counts.mjs 58 646` exit 0, the plan's zero delta |
| `npm run test:sweep` | **3 files / 13 passed** — `check-counts.mjs 3 13` exit 0; 141.2 s (144 s wall) |
| `npm run test:unit -- --run` | 61 files / 659 passed, 1 todo; 127.0 s |
| `npm run build` | exit 0; 9 s; `build/dev/tune/index.html` exists |
| `npm run test:e2e` | **44 passed** = `PREV_E2E` 32 + 12; `check-counts.mjs --playwright 44` exit 0 |
| `grep -c failed .tmp-e2e/gate.log` | `0` |
| `npx prettier --check docs/TESTING.md docs/PIN-POLICY.md` | exit 0 |
| `git diff --quiet HEAD -- src/lib/config-shape.spec.ts src/lib/catalog/front-door.spec.ts src/lib/sim/lazy.spec.ts` | exit 0 |
| `git diff --quiet HEAD -- src/vendor` | exit 0 |
| `grep -c "reserved" src/routes/dev/tune/+page.svelte` | `2` |
| `grep -c "@webkit" e2e/tuning-webkit.e2e.ts` | `6` (five titles plus the header's explanation) |
| listener on 4173 after the run | none; no `wrangler` or `workerd` process |
| `git status --porcelain` after the last commit | clean — no `.tmp-e2e`, no `static/og` |

Every Phase 4 and Phase 8 guard is green with no edit: `config-shape.spec.ts` (14 tests, including
the walking-skeleton link scan that caught deviation 1), `front-door.spec.ts`, `identity.spec.ts`
(amended once, in wave 8, deliberately), `lazy.spec.ts` and `e2e/catalog.e2e.ts`.

**This plan did not deploy.** The orchestrator deploys after verification.

## Requirements closed, with their qualifiers

| Requirement | Status | Qualifier written into the traceability row |
| ----------- | ------ | -------------------------------------------- |
| **TUNE-04** | Complete | **guard, unreachable in practice.** `reachability.sweep.spec.ts` costs all 32,852 reachable knob states and none crosses 908, so the fit ladder is proven against a measured over-budget reserve in `ladder.spec.ts` and watched in a browser on `/dev/tune/`, never met by a visitor |
| **TUNE-05** | Complete | **guard, unreachable in practice.** The red meter, the disabled `TRY ON DEVICE` with its reason, the named knob and `TURN IT DOWN` are all real code, reachable only by passing a real `reserved` to `cost()` — tests 9 and 10 are a browser doing exactly that |
| **SHARE-04** | Complete, **two qualifiers** | **routed entries only — 8 of the 16 catalog entries**, because the excluded eight are not in `FRONT_DOOR`, have no prerendered `/c/<id>/` page and therefore no `<head>` to carry an `og:image`; **and a real Discord unfurl is unverifiable until the Basic Auth embargo lifts**, because `worker/index.js` gates the whole site fail-closed and no crawler ever reaches the `<head>` the tests check. SHARE-04 is not claimed as observed |
| **DEGR-01** | Complete | iOS is approximated by WebKit at a phone viewport; the five tagged tests cover the front door, choosing without sideways scroll, a knob turn with both meters settling, `COPY LINK`'s confirm state and a shared link landing with install present but disabled |

`DEGR-02` stays **Pending** and is Phase 7's to close; this plan contributes the tuning-context half
of it (present, really disabled, with Phase 4's reason, asserted in test 5).

## Known Stubs

None. Nothing in this plan renders placeholder data: the probe's one non-JSON readout state is
`"pending"`, which is replaced by the first measurement and which `openProbe()` waits for explicitly.

## Open items for the user

Five things this phase decided or observed that are worth a human's opinion, none of them blocking:

1. **The third colour.** `--color-over: #ff3b30` was admitted in wave 8 (D-23), scoped to three uses,
   at 5.92:1 on black. Phase 4 had ruled that no third colour earned itself. It is now shipped and
   gated by an amended `identity.spec.ts` — worth confirming it looks right to you on a real screen.
2. **The identity-guard amendment.** That amendment widened a Phase 4 gate from eight tokens and two
   permitted hexes to nine and three. It was done in the open, in one commit, with both negative
   checks observed red. It is still a widened gate, and every future colour will point at it as
   precedent.
3. **The zero-based MIDI channel display.** A MIDI channel whose Lua literal is `0` displays `0`,
   because the firmware is zero-based and showing `1` would be HANGAR silently renumbering a value it
   is about to write to somebody's hardware. Most MIDI software shows 1–16. Recorded as an open
   question in `05-UI-SPEC.md`, not papered over.
4. **The panel's real height on a phone.** Below a 220 px content box every knob row stacks, so a knob
   costs 66 px rather than 48 px and the measured height at a 320 px viewport is **540 px** against a
   468 px reservation. Nothing breaks — the reservation is a floor and the region grows past it — and
   this plan confirmed nothing scrolls sideways at 320 px or at 393 px. But the region is tall on a
   phone, and whether the panel should scroll, compress or reorder there is a design call.
5. **Whether Lua entries should join the front-door row.** D-18 keeps all seven hand-authored
   configurations in `EXCLUDED_FROM_ROW`. Two things are waiting on that decision: the front door
   currently shows only compiler-driven cards, and `buildTuner`'s `destroy()` closes an engine the
   row's session map also holds — harmless for `PadSim`, a real bug the day a Lua entry is in the row
   (recorded in `05-11-SUMMARY.md`).

## Self-Check: PASSED

Files:

- FOUND: `src/routes/dev/tune/+page.svelte`
- FOUND: `build/dev/tune/index.html` (prerendered)
- FOUND: `e2e/tuning-webkit.e2e.ts`
- FOUND: `e2e/tuning.e2e.ts` (modified, 10 tests)
- FOUND: `docs/TESTING.md`, `docs/PIN-POLICY.md` (modified)

Commits: FOUND `347430a`, FOUND `a59856f`, FOUND `f51c6de`, FOUND `3312b05`.
