---
phase: 06-device-session
plan: 12
subsystem: ui
tags: [try-on-device, session-consumer, release, picker-explainer, failure-block, aria-live, never-both, structural-gate, CONN-02, CONN-03, DEGR-02]

# Dependency graph
requires:
  - "src/lib/device/session.svelte.ts (06-03, 06-04, 06-09) - phase, identity, failureFor(label), connect(), disconnect(); the one live region's voice"
  - "src/lib/device/session-copy.ts (06-02) - CONNECTING_LABEL, DISCONNECT_LABEL, the three STATUS_* lines, identitySentence"
  - "src/lib/ui/PickerExplainer.svelte and FailureBlock.svelte (06-08, 06-09) - the two components the panel now mounts, each with a testid prop"
  - "src/lib/ui/DeviceNote.svelte, DeviceSlot.svelte, DeviceDetails.svelte (06-09, 06-10, 06-11) - the header surfaces whose panelOwnsProse guards make the never-both rule observable on a real route"
  - "src/lib/ui/Coverflow.svelte (04-08) - the bind:this and the two release() call sites, unedited"
  - "e2e/fake-serial.ts (06-06) - the shim, used only to drive the served build for measurement"
  - "06-UI-SPEC.md (TryOnDevice after this phase; The pre-click picker explanation; Y-11, Y-16, Y-17); 06-11-SUMMARY.md - PREV_FILES/PREV_TESTS 69/723, PREV_E2E 71, the five-name block, deferred items 4, 5, 7, 8, 9"
provides:
  - "src/lib/ui/TryOnDevice.svelte: a consumer of the session - reads phase, identity and failureFor(PRIMARY), holds no state, owns no port; connect() from the click with nothing awaited in front of it; release() exported and closing nothing; the idle region mounts PickerExplainer as try-on-explainer, every named state mounts the one FailureBlock, connected renders ZONA IDENTIFIED verbatim; no aria-live"
  - "src/lib/ui/device-ui.spec.ts test 7: exactly three aria-live attributes across src/lib/ui and src/routes after a comment strip, carried by SessionAnnouncer, TuningRegion and BrowseToolbar, none by the panel, with the strip proven load-bearing"
  - "The measured facts: the connection survives Escape, Back, stepping past, choosing another card and a pagehide; the explainer, the S3 status line and the failure block are each on screen once with the panel open; e2e/first-experience.e2e.ts green unedited"
affects:
  - "06-13 - the shipped chrome in two engines; re-measures PREV_E2E; owns deferred item 8; may read try-on-explainer and connect-status on a real route"
  - "06-14 - the phase gate and SESSION-RUNBOOK; asserts BASE_E2E + 16"
  - "07 - retires the panel's Phase 4 promise literals (HONESTY, IDENTIFIED_TAIL) when install ships"
  - ".planning/STATE.md, .planning/ROADMAP.md - Phase 6 at 12/14"

tech-stack:
  added: []
  patterns:
    - "A component that consumes a store holds no mirror of it: every value the markup needs is a $derived over the store's fields, the two actions are the store's methods, and the exported hook a parent still calls stays exported as a no-op rather than being removed and the parent edited"
    - "A label that must appear on a control and inside the sentences that name the control is one const on the surface that renders both, handed to the store's failureFor(label); it is neither imported from a module the chunk guard forbids nor exported from the copy module a gate holds free of it"
    - "A site-wide count is asserted by a walk over the tree with comments stripped, and the strip is proven load-bearing by asserting a raw count exceeds a stripped one on the file whose header made it necessary"
    - "A sizing twin that fades flips visibility only after its opacity transition, so a probe counting visible copies waits past the fade before counting - an early count reads the fade, not a defect"

key-files:
  created:
    - ".planning/phases/06-device-session/06-12-SUMMARY.md"
  modified:
    - "src/lib/ui/TryOnDevice.svelte"
    - "src/lib/ui/device-ui.spec.ts"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The identified body is session-copy's identitySentence followed by the panel's own IDENTIFIED_TAIL (`Nothing was written, and nothing will be until install ships in the next release.`): the firmware sentence is the lifted one and is not retyped here, and the tail is a Phase 4 promise about writing that Phase 7 retires, so it stays a panel literal rather than becoming a session-copy export - the rendered sentence is verbatim Phase 4, as the UI spec's table requires"
  - "PRIMARY is the one definition of TRY ON DEVICE on this surface, used for the button and for failureFor(); it is not a static import from $lib/device/try-on (config-shape.spec.ts test 13 forbids the specifier under src/lib/ui/) and not a session-copy export (session-copy.spec.ts test 4 holds that module free of the literal); its doc comment and the header say so"
  - "The idle region is decided by phase (idle, detected, forgotten), not by slot state: slotStateOf maps `starting` to S1, and rendering the explainer in `starting` would flash it for a frame on a browser that turns out to be unsupported; slotStateOf is therefore not imported, and the interface block's `state` derived was dropped rather than left unused"
  - "`mounted` is gone: with no onMount and no onDestroy left in the component there is no server-render guard to hold, and the `starting` phase - the value the session is initialised to on the server - already renders the control disabled with an empty region"
  - "CONNECTING and DISCONNECT are session-copy's CONNECTING_LABEL and DISCONNECT_LABEL, the same literals, so the panel's and the disclosure's DISCONNECT ZONA cannot drift"
  - "The panel's PickerExplainer names its own testid, try-on-explainer, because the header note keeps the default one on a hidden sizing twin while the panel is open"

requirements-completed: []
requirements-contributed: [CONN-02, CONN-03, DEGR-02]

# Metrics
duration: 35min
completed: 2026-09-05
---

# Phase 6 Plan 12: TryOnDevice consumes the session and gives up the port Summary

**The panel stopped owning a port it was only ever borrowing. `TryOnDevice.svelte` now reads `session.phase`, `session.identity` and `session.failureFor(PRIMARY)` and holds no state of its own; its click calls `session.connect()` with nothing awaited in front of it, `DISCONNECT ZONA` calls `session.disconnect()`, and the exported `release()` that `Coverflow.svelte` still calls on every un-choose path closes nothing. On the served build, driven through the shim, a connection made from the panel's button survived **all five un-choose paths** - Escape, the browser Back button, stepping past the chosen entry, choosing another card (`starfield`, with the button disabled and `Your ZONA is already identified.` showing) and a `pagehide` - with the header reading `ZONA · fw 1.5.5 · page 3` throughout and **zero bytes written, zero picker requests**. The connect-state region lost its `aria-live` (the only one this phase removes), gained `PickerExplainer` under its own testid in the three resting states and the one `FailureBlock` in every named state including the two capability ones - which is what kept `e2e/first-experience.e2e.ts` green **unedited** (11 passed, sha unchanged). The never-both rule was counted on all three lines with the panel open: one visible explainer, one visible S3 sentence, one failure block, never two, with the note holding 152px. `device-ui.spec.ts` goes to **7**: three `aria-live` on the whole site after a comment strip, none the panel's, and the strip proven load-bearing against `TuningRegion.svelte`'s header. Three negatives observed red and restored byte-identical. Quick **69 / 724** (PREV 69/723 +0/+1), sweep `3 13`, e2e **71** (9 webkit-phone, 62 chromium) at `--workers 3`, svelte-check **533 files**, 0 errors, 0 warnings.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` as re-measured by **06-07** and observed again by 06-11; observed again here at 71 because the panel is on every `/c/` route and the whole suite had to run.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` - the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13                |

### Observed totals: previous SUMMARY plus this plan's delta

06-11 left the tree at **69 files / 723 tests**. This plan adds **+0 files / +1 test** - `device-ui.spec.ts` test 7 - so quick stands at **69 / 724**, `BASE_FILES + 3` and `BASE_TESTS + 33`. Sweep is unchanged at **`3 13`**. E2E is **71 + 0 = 71**, nine on webkit-phone and sixty-two on chromium, observed (not carried) because `TryOnDevice` is on every `/` and `/c/{id}/` route.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 724
  check-counts: observed 69 files, 724 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  counted 1296 combinations in 2.6s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npx playwright test --workers 3 2>&1 | tee .tmp-e2e/06-12-suite-w3.log | node scripts/check-counts.mjs --playwright 71
  check-counts: observed 71 tests passed
  check-counts: matches the expected counts
  71 passed (58.6s)                                9 results on [webkit-phone], 62 on [chromium]

npx playwright test e2e/first-experience.e2e.ts --project chromium
  11 passed (32.0s)                                the file unedited: sha 9348571e... before and after, git diff empty

npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts
  Test Files  6 passed (6)   Tests  42 passed (42)   (task 1 state; identity 6 · tune-ui 5 · config-shape 14 · device-ui 6)
npx vitest run --project server src/lib/ui/device-ui.spec.ts
  Test Files  1 passed (1)   Tests  7 passed (7)

npm run check 2>&1 | grep -Ei "error|warning"
  1788597530815 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

svelte-check stays at **533 files**: no file was added or removed.

## Task 1 - the panel gives up the port (commit `da6c781`)

### What was deleted, and what survived

Deleted, exactly as the plan listed: the three `typeof import(...)` aliases and the four type aliases beside them, the `onMount` that resolved them, `P`/`T`/`D`, `phase`/`failure`/`identity`/`moduleType`, `grid`, `detachHide`, `capable`, `mounted`, `closePort`, `refuse`, `tryOnDevice`'s body, `disconnect`'s close, the `onDestroy` close, `labelOf`, `primaryLabel`, `secondsOf`/`windowSeconds`, and the four authored strings plan 06-02 had already lifted (`NOT_ZONA_*`, `SILENT_*`, `UNPLUGGED_AFTER`, the `STATUS_*` trio). `mounted` went with them: there is no `onMount` or `onDestroy` left to guard, and `starting` is the server-rendered phase, so the prerendered control is disabled with an empty region and hydration enables it.

Survived, untouched: `data-testid="try-on-device"`, `"connect-status"`, `"disconnect"`, `data-entry`, `aria-describedby="try-on-reason"`, the button's every CSS declaration, the honesty slot with its three strings, its one-cell grid and its 72px floor, `BUDGET_SIZING` over the real `tryOnBudgetReason`, `ZONA IDENTIFIED`, and `PRIMARY`.

### The label, quoted from both ends

```svelte
const PRIMARY = "TRY ON DEVICE";
const block = $derived(session.failureFor(PRIMARY));
<span class="label">{connecting ? CONNECTING_LABEL : PRIMARY}</span>
```

The comment-stripped scan of both files:

```
TryOnDevice.svelte:  device/try-on specifier false | TRY ON DEVICE occurrences 1 | aria-live 1 (task 1), 0 (task 2)
session-copy.ts:     TRY ON DEVICE occurrences 0
```

### `release()`, quoted from both sides

```svelte
// TryOnDevice.svelte
export function release(): void {
  // Nothing to clear: this component holds no state of its own.
}

// Coverflow.svelte, unedited
void tryOn?.release();                          // unchoose(), line 373
if (wasChosen && !now) void tryOn?.release();   // the $effect.pre for the Back button, line 772
```

### The five un-choose observations, on the served build

Driven through the shim on `/` (a port granted before load, so the session offered `detected`), served by a scratch `node:http` server over `build/` on 127.0.0.1:4174. The connection was made from the **panel's** `TRY ON DEVICE`: `S2` -> click -> `S4` after **3 rx chunks** of the hardware capture, header label `ZONA · fw 1.5.5 · page 3`, panel region `ZONA IDENTIFIED / Firmware 1.5.5, active page 3. Nothing was written, and nothing will be until install ships in the next release. / DISCONNECT ZONA`, honesty slot `Your ZONA is already identified.`

| # | Path | After | Header |
|---|---|---|---|
| 1 | Escape | panel gone | **S4**, `ZONA · fw 1.5.5 · page 3` |
| 2 | Enter, then the browser Back button | panel gone | **S4**, same label |
| 3 | Enter, then ArrowRight past the chosen entry | panel gone after 2 presses (STEP_AWAY_LIMIT 1) | **S4**, same label |
| 4 | ArrowRight, Enter on another card | panel `data-entry="starfield"`, `try-on-device` disabled, honesty line `Your ZONA is already identified.` | **S4** |
| 5 | Another tab brought to front and back, plus a dispatched `pagehide` | - | **S4**, same label |

Zero writes and zero `requestPort()` calls across the whole walk (`writes 0 requests 0`).

On observation 5, honestly: `page.bringToFront()` on a second tab did not produce a hidden `visibilitychange` in headless Chromium (the page recorded only the events the probe dispatched itself: `visibilitychange:visible` and `pagehide`). The `pagehide` is the event Phase 4's `closeOnHide()` listened to (`web-serial.ts:129`), it was dispatched with the connection live, and the session held. A real tab switch is on the user's hardware checklist (06-14) either way.

### Negative 1: the `onDestroy` close kept

`onDestroy(() => { void session.disconnect(); })` added, built, the same connect made from the panel, then Escape:

```
OBS before Escape: slot S4 label "ZONA · fw 1.5.5 · page 3"
OBS after Escape:  slot S1 label "NO ZONA\nCONNECT ZONA"      Expected "S4" Received "S1" - 1 failed
```

Exactly the bug this wave removes. Restored from a sha-verified backup: `2a4b7099…` before the mutation and after the restore (the task-1 committed content).

## Task 2 - the panel's regions, and the live region it gives up (commit `bc6bb19`)

### The region, by phase

| Phase | Renders |
|---|---|
| `idle` / `detected` / `forgotten` | `<PickerExplainer testid="try-on-explainer" />` |
| `choosing` / `opening` / `identifying` | the `STATUS_*` line from session-copy |
| `connected` | `ZONA IDENTIFIED`, `identitySentence(...)` + the Phase 4 tail, `DISCONNECT ZONA` -> `session.disconnect()` |
| every other named state, `unsupported` and `insecure` included | `<FailureBlock {block} />` with `PRIMARY` in its steps |
| `starting` | nothing (the server render) |

`aria-live="polite"` is gone from `connect-status`, and a comment on the element says why and names the gate. The `.title`, `.steps` and `.title + .detail` rules left with the markup that used them (svelte-check would otherwise report unused selectors); `.detail` and `.caption + .detail` stay for the status line and the identified sentence.

### The shipped degrade test, unedited

```
sha256 e2e/first-experience.e2e.ts   9348571eabf8d03c9f9b9401dc403fb82c4fc8cdcca5b8fed5d98a69db8810c0   (before, after, and at d0939a3)
git diff --stat HEAD -- e2e/first-experience.e2e.ts        (empty)
npx playwright test e2e/first-experience.e2e.ts --project chromium     11 passed (32.0s)
```

The panel kept the capability block, so the assertion inside `getByTestId("connect-status")` for `Firefox 151`, `Chrome` and `Edge` reads the same words in the same place. DEGR-02 was not broken and the test was not stale; nothing had to be found out.

### The never-both rule, counted on all three lines

On the served build through the shim, nothing granted, panel opened with Enter. "Visible" is computed style: no `visibility: hidden` or `display: none` on the element or any ancestor.

| Line | Configuration | Count | Note |
|---|---|---|---|
| Pre-click explanation | S1, panel closed | 1 in DOM, **1 visible** (`picker-explainer`, the note's) | note h **152** |
| | S1, panel just opened (inside the note twin's 160ms fade) | 2 in DOM, 2 visible | the twin's `visibility` flips after its opacity transition (`DeviceNote.svelte`, `visibility 0s linear 160ms`) - a fade, not a cut |
| | S1, panel open, fade over | 2 in DOM, **1 visible - `try-on-explainer`, the panel's**; `picker-explainer` hidden | note h **152**, `data-line="none"` |
| S3 status line | panel open, `identifying` held (port picked, nothing fed) | `Listening for the module…` 2 text nodes, **1 visible** (the panel's) | note h **152**, `data-line="none"`, slot S3 |
| Failure block | `port-busy` raised from the panel's button, panel open | **1** `failure-block` (the panel's, 6 steps), `device-details` 0 | |
| | panel closed with the failure current | **0** `failure-block`, `device-details` 0, slot S6 `CONNECT ZONA` | see below |
| | `port-busy` raised from the header's button, panel closed | **1** `failure-block` (the drawer's, 6 steps) | the drawer opened itself |
| | then Enter opens the panel | **1** `failure-block` (the panel's), `device-details` 0 | the drawer closed on `panelOwnsProse` |

Neither failure-block configuration is 2. One thing to say plainly about the second row: the plan expected the block to be "reachable from the header disclosure" once the panel closes. For a failure the **panel's** button produced it is not - 06-10's slot opens the drawer only for a failure its own click produced (`armed`), and in S6 the slot is a `CONNECT ZONA` button, so there is no summary to click. That is 06-10's design (a control that both acts and expands lies about one of its jobs), the count is 0 rather than 2, and for a failure the **header's** button produced the block is in the drawer and moves to the panel when the panel opens. The `writes()` counter read 0 at the end of the walk.

A harness note: after the S3 hold lapsed into `silent`, the session kept port 0 adopted, so the next click took the adopted-port path (`connect()` -> `#openAdopted()`, no chooser); the busy flag therefore had to be planted on port 0 (`busy(0)`), not on a freshly granted port scheduled through `pick()`. Session behaviour, not a defect.

### Negative 2: the block in both surfaces

`DeviceSlot.svelte`'s effect mutated to `if (!DISCLOSES.includes(slot)) open = false; if (slot === "S6") open = true;` and `DeviceDetails.svelte`'s `!panelOwnsProse &&` removed; built; `port-busy` raised from the panel:

```
OBS negative2: failure-block count 2; device-details count 1; steps per list [6,6]; chosen-panel count 1     Expected 1 Received 2 - 1 failed
```

Two copies of the six-step Grid Editor recovery on one screen. Both files restored with `git show HEAD:… > …`: `DeviceSlot.svelte` `ab7e1f38…`, `DeviceDetails.svelte` `72441791…` (the pre-plan hashes), `git diff --quiet` exit 0.

### Test 7, and the scan with and without the strip

`device-ui.spec.ts` test 7 walks every `.svelte` under `src/lib/ui/` and `src/routes/` (39 files), strips comments with the house `stripComments`, assembles the needle from fragments, and asserts: the carriers are exactly `BrowseToolbar.svelte` (the browse page's region), `SessionAnnouncer.svelte` and `TuningRegion.svelte`, one each; `TryOnDevice.svelte` has 0 and is inside the walk; the total is 3; and `TuningRegion.svelte`'s raw count exceeds its stripped count, so the strip cannot be deleted as redundant. Its comment names the file and the sentence (`ONE LIVE REGION, AND IT CANNOT CHATTER`).

```
stripped:  BrowseToolbar 1 · SessionAnnouncer 1 · TuningRegion 1 · TryOnDevice 0      total 3
raw:       BrowseToolbar 3 · SessionAnnouncer 4 · TuningRegion 2 · TryOnDevice 3      total 12
```

The plan predicted the raw scan would report four, from `TuningRegion.svelte`'s header alone. Tree-wide it reports **12**: `TuningRegion` is the predicted +1, and `SessionAnnouncer`'s header (+3), `BrowseToolbar`'s header (+2) and `TryOnDevice`'s own new comments (+3, written by this plan to explain the removal) all name the attribute in prose. The reason for the strip is the same; the number is larger.

Negative 3, the plan's own: `aria-live="polite"` re-added to `connect-status`, `device-ui.spec.ts` reported **1 failed | 6 passed** on test 7 alone, restored from a sha-verified backup (`e3379183…` before and after).

## Deviations from Plan

### 1. [Decision] The identified body's tail stays in the panel

**Found during:** task 1. **Issue:** the plan says the identified body "moves to `session-copy` if it is not already there - use the lifted one". What 06-02 lifted is `identitySentence` (`Firmware 1.5.5, active page 3.`); the second sentence of Phase 4's body (`Nothing was written, and nothing will be until install ships in the next release.`) was never lifted, and 06-UI-SPEC's TryOnDevice table requires the identified block "unchanged, verbatim" while its typography section quotes the sentence with the tail. **Resolution:** the first sentence is session-copy's `identitySentence`, not retyped; the tail is the panel's own `IDENTIFIED_TAIL`, a Phase 4 promise about writing that Phase 7 retires with the panel's other promise literals, and `session-copy.ts` (not in this plan's `files_modified`) is untouched. The rendered sentence is byte-identical to Phase 4's.

### 2. [Process] `slotStateOf` is not imported and `mounted` is gone

**Found during:** task 1. **Issue:** the interface block opens with `const state = $derived(slotStateOf(session.phase))`, but every row of the region table is keyed by phase, and `slotStateOf` maps `starting` to S1 - deciding the explainer by slot state would flash it for a frame on a browser that hydrates into `unsupported`. **Resolution:** the region is keyed by phase (`explaining` over `idle`/`detected`/`forgotten`), and the unused derived was dropped rather than left to fail lint. `mounted` went the same way: the plan asked which way it went, and with no `onMount` or `onDestroy` left there is no server-render guard to hold.

### 3. [Process] The probes ran from `.tmp-e2e/probe/`, not the scratchpad

**Found during:** task 1's first probe run. **Issue:** a Playwright config outside the repository cannot resolve `@playwright/test`. **Resolution:** the scratch config, the three probes and the backups lived under the gitignored `.tmp-e2e/probe/` for the duration and were removed by hand at the end (deferred item 5's standing habit); the scratch server (`serve.mjs`) stayed in the scratchpad. The probes set their own `outputDir`, and `test-results/` was absent after the full suite run.

### 4. [Process] Two probe corrections that were harness facts, not product ones

**Found during:** task 2's never-both probe. (a) The first explainer count was taken inside DeviceNote's 160ms twin fade and read 2 visible; the design flips a twin's `visibility` only after its opacity transition, so the probe waits 400ms past a line change before counting, and the in-fade reading is recorded in the table above rather than hidden. (b) `port-busy` had to be planted on the adopted port 0 because the session's adopted-port path takes no chooser (see the harness note). Neither changed any shipped file.

### 5. [Process] The served build was measured without invoking wrangler

As 06-08 to 06-11: `npm run build`, a scratch `node:http` server over `build/` on **127.0.0.1:4174** (killed by PID 38408 afterwards; no listener on 4173 or 4174 remains), scratch Playwright specs importing `FAKE_SERIAL` by relative path. The shipped degrade test and the full suite ran through the real harness (`npm run preview` under Playwright's `webServer`), which is the one path that starts wrangler.

## Requirements

**`requirements-contributed: [CONN-02, CONN-03, DEGR-02]`** - contributed, not completed, on the phase's convention (06-14 closes CONN-01..08 with their qualifiers; DEGR-02 is Phase 7's). CONN-02's two capability messages are now rendered in both surfaces, kept in the panel where the shipped gate reads them; CONN-03's explanation is in its second mount, on screen exactly once; DEGR-02's disabled control with its reason inline holds on both engines (the webkit-phone tuning test reads it). None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. Every region of the panel renders live session state or session-copy's words; `release()` is an intentional no-op with its reason in its doc comment, kept because `Coverflow.svelte` calls it, and it is not a stub for anything a later plan wires.

## What the next plan inherits

- The five-name block above, verbatim, all five. `BASE_E2E` is **61**; `PREV_E2E` is **71**, measured by 06-07 and observed again here at 71.
- `PREV_FILES` / `PREV_TESTS` for plan 06-13 are **69 / 724**. svelte-check is at **533 files**.
- `TryOnDevice` props: `entry`, `budgetReason`; exported `release()` (no-op). Testids: `try-on-device`, `connect-status`, `disconnect`, and now `try-on-explainer` (the panel's explainer; the note's keeps `picker-explainer`). The panel's `FailureBlock` uses the default `failure-block`, as the drawer's does - the two are never in the DOM together, so a page-wide count is the assertion.
- `panelOwnsProse` needs no wiring from the panel: `FrontDoor.svelte` derives it from `page.state.chosen` for both header children, and the never-both counts above were taken on that route.
- `device-ui.spec.ts` holds **7**. Test 7 walks the whole tree for `aria-live`; a fourth live region anywhere under `src/lib/ui/` or `src/routes/` is a red test, and so is any `aria-live` returning to the panel.
- For a probe counting the note's twins, wait past the 160ms fade; for a probe raising a failure after the session has adopted a port, plant it on the adopted port.
- Run the full e2e at `--workers 3` (deferred item 7); `first-experience.e2e.ts` still has its two pre-hydration key-press sites (deferred item 8, owner 06-13) - neither fired in this plan's two runs of that file.
- Deferred item 10 (new): the panel's button is enabled in S5 while the header slot is a summary; see deferred-items.md.

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/ui/TryOnDevice.svelte` - FOUND, sha256 `e3379183…` (the committed task-2 content)
- `src/lib/ui/device-ui.spec.ts` - FOUND, sha256 `199d012d…`
- `.planning/phases/06-device-session/06-12-SUMMARY.md` - FOUND

Files claimed unchanged, verified:

- `e2e/first-experience.e2e.ts` - sha256 `9348571e…` unchanged; `git diff --stat d0939a3 HEAD` empty
- `src/lib/ui/DeviceSlot.svelte` (`ab7e1f38…`), `src/lib/ui/DeviceDetails.svelte` (`72441791…`), `src/lib/ui/Coverflow.svelte`, `src/lib/device/session-copy.ts`, `src/lib/device/session.svelte.ts`, `playwright.config.ts` - unchanged since `d0939a3`

Files claimed absent:

- `test-results/`, `.tmp-e2e/probe/` - ABSENT

Commits claimed, verified in `git log`:

- `da6c781` feat(06-12): the panel gives up the port - FOUND
- `bc6bb19` feat(06-12): the panel's regions, and the live region it gives up - FOUND
