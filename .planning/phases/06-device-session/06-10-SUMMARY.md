---
phase: 06-device-session
plan: 10
subsystem: ui
tags: [device-slot, disclosure, forget, disconnect, cancelled, sizing-twin, multi-module-tail, data-hydrated, structural-gate, CONN-01, CONN-05, CONN-06, CONN-08]

# Dependency graph
requires:
  - "src/lib/device/session.svelte.ts (06-03, 06-04) - phase, identity, failureFor(label), connect(), disconnect(), forget(), canForget"
  - "src/lib/device/session-copy.ts (06-02) - slotStateOf, every label and caption, HIDDEN_NAME_IDLE, moduleTail, identityDescription, identitySentence, multiModuleLine, and the disclosure's strings"
  - "src/lib/ui/DeviceMark.svelte (06-08) - the four 24px shapes the slot maps its nine states onto"
  - "src/lib/ui/FailureBlock.svelte (06-08) - the one failure block the disclosure mounts in S0a/S0b/S6"
  - "src/lib/ui/tune-ui.spec.ts (05-10) and src/lib/config-shape.spec.ts test 13 (06-05) - the structural-gate house style and the five permitted specifiers"
  - "src/routes/dev/session/+page.svelte and e2e/fake-serial.ts (06-06, 06-07) - the probe and the shim, used only to drive the served build for measurement"
  - "06-UI-SPEC.md (the nine slot states, the disclosure, the multi-module tail, the ARIA contract); 06-09-SUMMARY.md - PREV_FILES/PREV_TESTS 68/717, the five-name block, deferred item 6"
provides:
  - "src/lib/ui/DeviceSlot.svelte: the header slot - nine states in one 44px box, the two 14px line boxes, the S1 hover twin, the S4 identity with monospaced numerals and the CSS-collapsing multi-module tail, aria-describedby everywhere, aria-expanded in four states only, data-hydrated from onMount, and ownership of the drawer's open state"
  - "src/lib/ui/DeviceDetails.svelte: the disclosure - five states, the two cancelled branches, DISCONNECT ZONA, FORGET THIS ZONA (only where canForget), the four close paths and the auto-open-into-container for a failure the visitor's own click produced; not a dialog, no focus trap; two guards on panelOwnsProse"
  - "src/lib/ui/device-ui.spec.ts: six structural gates over the seven device components, closing 06-08 deferred item 6 (the hex scan over these files)"
  - "The measured facts: the nine slot boxes at 44px, the constant header height, the S1 hover holding its width, the tail at 1280 and 900, and data-hydrated absent from the prerendered artifact and present on the running page"
affects:
  - "06-11 - FrontDoor and /browse/ mount DeviceSlot and DeviceDetails in the header block with covered and panelOwnsProse; repeats the data-hydrated check against build/index.html; measures the header height across the ladder"
  - "06-12 - device-ui.spec.ts goes to 7 (re-adds aria-live to connect-status as its own negative); the panel mounts PickerExplainer with its own testid and passes panelOwnsProse"
  - "06-13 - re-measures PREV_E2E; owns deferred item 8"
  - ".planning/STATE.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md - Phase 6 at 10/14"

tech-stack:
  added: []
  patterns:
    - "A control that acts is a plain button and a control that expands is a summary, never the same element in the same state; aria-expanded is derived from one closed four-member list, so the never-both rule is a grep rather than a promise"
    - "Significant inline whitespace in Svelte markup is written as &nbsp; entities, not source spaces: Svelte trims whitespace touching an element boundary (a plain space between the identity spans renders as ZONA.fw...), and the {\" \"} that would preserve it is banned by svelte/no-useless-mustaches"
    - "A reserved box is a CSS floor plus a sizing twin measured by the browser, never a pixel asserted in CSS: the slot is min-*-size 44px and the S1 labels share one grid cell, and the browser measured 44 in all nine states with the hover holding its width"
    - "A width-dependent detail collapses in a CSS media query, never a script read: the tail is display:none below 1024px, and the negative proved a script innerWidth read is stale after a resize where the media query is not"
    - "A structural gate checks the 44px floor per interactive selector, not per file, so dropping the floor from one control among several in a file goes red even though the file still carries 44px on another"
    - "The served build is measured through a scratch node:http static server over build/ on 127.0.0.1:4174, never by invoking wrangler; multi-module heartbeats are fed with the trailing LF terminator (10) the frame scanner needs, and the ZONA's own heartbeat re-fed so the fresh fold's identify() returns"

key-files:
  created:
    - "src/lib/ui/DeviceSlot.svelte"
    - "src/lib/ui/DeviceDetails.svelte"
    - "src/lib/ui/device-ui.spec.ts"
    - ".planning/phases/06-device-session/06-10-SUMMARY.md"
  modified:
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The S4 identity label is built from word spans and aria-hidden separator spans with all spacing carried as &nbsp; entities: Svelte trims boundary whitespace (the label rendered ZONA.fw1.5.5.page3 with plain spaces) and the {\" \"} the original draft used trips svelte/no-useless-mustaches, so nbsp is the one form both tools accept while keeping the accessible name 'ZONA fw 1.5.5 page 3' spaced and dot-free"
  - "The slot owns `open` and DeviceDetails renders it; an `armed` flag remembers a connecting click made on the slot so an arriving S6 opens the drawer, while a failure from the panel does not; a transition into any state with no disclosure (S1, S2, S3, S7) or panelOwnsProse closes it"
  - "Escape is handled at window level rather than on the container so the container carries no keydown handler - a keydown handler would demand an ARIA role and a disclosure is not a dialog; focusout on the container stays because focus events do not trip the a11y rule"
  - "FORGET renders only when session.canForget; forced false in the browser by deleting FakePort.prototype.forget so \"forget\" in port reads false, and the control was absent while DISCONNECT stayed"

requirements-completed: []
requirements-contributed: [CONN-01, CONN-05, CONN-06, CONN-08]

# Metrics
duration: 90min
completed: 2026-09-05
---

# Phase 6 Plan 10: DeviceSlot, DeviceDetails, and the structural gate over all seven Summary

**The control and the quiet drawer behind it exist and were measured on a served build. `DeviceSlot` reads the session in nine states from `slotStateOf(session.phase)` alone - a plain button where a click acts (S1, S2, S6, S7) and a summary carrying `aria-expanded` where it does not (S0a, S0b, S4, S5), disabled and busy in S3 - and the browser measured its box at **44px in all nine states** with the marker beneath it a constant **44px** below the slot's top, so the header's height never depends on the session state. The S1 label swaps `NO ZONA` to `CONNECT ZONA` on hover **without resizing** (151px both before and after), sized by the one-cell grid twin; the S4 identity is `ZONA · fw 1.5.5 · page 3` with monospaced numerals, and the multi-module tail `· with EN16, BU16` renders at 1280px (`display: inline`) and is gone at 900px (`display: none`) through a media query - no `innerWidth`, no `matchMedia`, no `resize` listener in the component - with the box 44px and the header height constant at both. `data-hydrated` is set only from `onMount`: the prerendered `build/dev/session/index.html` carries the slot **without** it, the running probe page **has** it, and `build/index.html` carries no slot at this wave. `DeviceDetails` is the disclosure in five states, opening automatically only for a failure the visitor's own click produced (focus moves into the `tabindex="-1"` container), closing on Escape (focus back to the opener), on focus leaving, on a click outside and on `panelOwnsProse`; it traps no keyboard, hides `FORGET THIS ZONA` where the browser cannot revoke, and renders the two `cancelled` branches with the declined sentence only for a `NotAllowedError`. `device-ui.spec.ts` reports **6 passed** with ten negative checks observed red and restored byte-identical (two in task 1, one in task 2's focus trap, seven in task 3). Quick **69 / 723** (PREV 68/717 +1/+6), sweep `3 13`, svelte-check **533 files**; PREV_E2E carried unchanged at 71.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` as re-measured by **06-07**; this plan adds no e2e test, mounts nothing into a route, and leaves `playwright.config.ts`, every route and the build shape untouched (the probe is byte-identical to HEAD), so the e2e figure cannot have moved and was not re-run.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` - the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13                |

### Observed totals: previous SUMMARY plus this plan's delta

06-09 left the tree at **68 files / 717 tests**. This plan adds **+1 file / +6 tests** - `device-ui.spec.ts`, six tests - so quick stands at **69 / 723**, `BASE_FILES + 3` and `BASE_TESTS + 32`. Sweep is unchanged at **`3 13`**. E2E is **71 + 0 = 71**, nine on webkit-phone, unchanged.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 723
  check-counts: observed 69 files, 723 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo
  check-counts: matches the expected counts

npx vitest run --project server src/lib/ui/identity.spec.ts src/lib/ui/tune-ui.spec.ts src/lib/config-shape.spec.ts src/lib/ui/device-ui.spec.ts
  Test Files  4 passed (4)   Tests  31 passed (31)
  identity.spec.ts 6 · tune-ui.spec.ts 5 · config-shape.spec.ts 14 · device-ui.spec.ts 6

npm run check 2>&1 | grep -Ei "error|warning"
  ... COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` moves from **530 to 533 files**: the three new files.

## Task 1 - DeviceSlot, nine states in one 44px box (commit `2cdce5f`)

### The nine slot boxes, measured on the served build

Driven through the shim on `/dev/session/` with a temporary `<DeviceSlot />` mount, at the Desktop Chrome 1280x720 viewport. `h` is the slot's `getBoundingClientRect().height`, `gap` is the distance from the slot's top to a marker paragraph mounted directly beneath it - so a constant `gap` is a constant header height.

| Slot | phase driven by | h | gap | label |
|---|---|---|---|---|
| S0a | delete `navigator.serial` | **44** | **44** | NO ZONA |
| S0b | shim + `isSecureContext` false | **44** | **44** | NO ZONA |
| S1 | shim, nothing granted (idle) | **44** | **44** | NO ZONA -> CONNECT ZONA on hover |
| S2 | grant before load (detected) | **44** | **44** | CONNECT ZONA |
| S3 | click connect, feed nothing | **44** | **44** | CONNECTING… |
| S4 | grant + click + capture RX | **44** | **44** | ZONA · fw 1.5.5 · page 3 |
| S5 | connect then unplug(0) | **44** | **44** | NO ZONA |
| S6 | reject() then connect (cancelled) | **44** | **44** | CONNECT ZONA |
| S7 | connect then forget | **44** | **44** | CONNECT ZONA |

**44 in every one of the nine, and the header height (gap) is 44 in every one.** The S1 label swap does not resize the box: measured at rest **w151 / h44** and on hover **w151 / h44**.

### The multi-module tail, at 1280 and 900

The identity was taken to two other modules by feeding the ZONA heartbeat plus chained EN16 (hwcfg 195) and BU16 (hwcfg 131) heartbeats - each with the trailing LF terminator (byte 10) the frame scanner needs, and the ZONA's own heartbeat re-fed so the fresh post-connect fold's `identify()` returns a ZONA carrying the others.

| Viewport | tail `display` | tail text | box h | gap |
|---|---|---|---|---|
| 1280px | `inline` | ` · with EN16, BU16` | **44** | **44** |
| 900px | `none` | (in DOM, hidden) | **44** | **44** |

All four numbers recorded: h1280 44, gap1280 44, h900 44, gap900 44. The tail collapses at the 1024px boundary through `@media (max-width: 1023.98px) { .tail { display: none; } }` and through nothing else; the comment-stripped scan of `DeviceSlot.svelte` reports `innerWidth false`, `matchMedia false`, `resize false`, `setInterval false`.

### The bindings, quoted

```svelte
const EXPANDS: readonly SlotState[] = ["S0a", "S0b", "S4", "S5"];
...
aria-describedby={descId}
aria-expanded={isSummary ? open : undefined}
...
<span id={descId} class="sr-only">{description}</span>
```

`aria-expanded` is present only in the four summary states (`isSummary` is `EXPANDS.includes(slot)`) and absent in S1, S2, S3, S6, S7. The accessible name is the label alone; the caption is `aria-hidden="true"` and reaches the control through `aria-describedby` on the visually-hidden twin, whose text `description` is `HIDDEN_NAME_IDLE` in S1 and S7 (read from `session-copy`, never retyped), `identityDescription(...)` while connected, the caption otherwise.

### data-hydrated, prerendered vs running

```
build/index.html            device-slot count = 0   (the slot is wired into the real header at 06-11)
build/dev/session/index.html device-slot count = 1, data-hydrated count = 0
running /dev/session/        the slot carries data-hydrated="true"   (toHaveAttribute passed)
```

### The two negatives, observed and restored byte-identical

1. **Remove the sizing twin** - the S1 labels hidden by `display` toggling rather than sharing the grid cell, so the box tracks the visible label: hovering S1 moved the box from **102px (NO ZONA) to 151px (CONNECT ZONA)** (`changed: true`), against 151->151 with the twin. Restored (sha `899db63…`).
2. **Replace the tail media query with a `window.innerWidth` read in script** (set once in `onMount`, no resize listener): loaded at 900px the tail is absent (correct), and after resizing to 1280px it **stays absent** (`defect_stale_at_1280: true`) where the CSS rule shows it - the exact staleness the media query prevents. The literal "flash on first paint at 1280" the plan names is not directly observable on the probe, because the tail lives only in S4 and S4 is never a prerendered or first-paint state; the resize-staleness is the same mechanism's failure and is what was recorded. Restored.

### The temporary probe mount, proven gone

`src/routes/dev/session/+page.svelte` carried, for the measurement only, a `<DeviceSlot />` in a `max-content` wrapper with a marker beneath. Restored from HEAD with `git show HEAD:… > …` (never `git checkout` or `restore`):

```
probe sha256 before/after  1a20cc9139d9f8aa1388c56d4c8fd26c0ec55390b6b653391d09a94ef198ed11
git diff --quiet -- src/routes/dev/session/+page.svelte   -> exit 0
```

## Task 2 - DeviceDetails, the drawer and the two cancelled branches (commit `da2af41`)

### The four open/close behaviours and the guards, observed on the served build

Driven with a temporary harness on the probe: a `probe-open` button toggling a local `open`, `DeviceDetails` bound to it, a `panelOwnsProse` checkbox and an outside button.

| Behaviour | Observed |
|---|---|
| A failure from a header click opens it and moves focus in | in `cancelled`, opening the drawer left `document.activeElement` = `device-details` |
| Escape closes and returns focus to the opener | after Escape the drawer was gone and focus was on `probe-open` |
| Focus leaving closes | focusing the outside button removed the drawer |
| A click outside closes | clicking the outside button removed the drawer |
| `panelOwnsProse` refuses to open | with it checked, a `probe-open` click rendered no `device-details` |
| `panelOwnsProse` closes an open drawer | an always-open (`open={true}`) mount rendered nothing once `panelOwnsProse` was set |

The `cancelled` drawer showed the `FailureBlock`, the `nothing-listed` disclosure, the `chooser-never-appeared` disclosure and the two-step sentence, with the declined sentence **absent** for a plain `NotFoundError` and **present** after a `NotAllowedError`. `FORGET THIS ZONA` was **present** in S4 with `canForget` true and **absent** with `canForget` false (forced by deleting `FakePort.prototype.forget` so `"forget" in port` read false), while `DISCONNECT ZONA` stayed present in both.

### The focus-trap negative, observed and restored

`onFocusout` mutated to refocus the container instead of calling `onclose`: focusing the outside button bounced focus back to `device-details` and the drawer **stayed open** (`still-open: true, active: device-details`) - a disclosure wearing a dialog's clothes. Restored byte-identical (sha `724417…` before, restored to the committed content). In the shipped component the same act closes the drawer.

The task-2 harness on the probe was restored from HEAD the same way (`git diff --quiet` exit 0).

## Task 3 - device-ui.spec.ts, the structural gate over all seven (commit `22440d2`)

Six tests over `DeviceSlot`, `DeviceDetails`, `DeviceMark`, `DeviceNote`, `FailureBlock`, `PickerExplainer`, `SessionAnnouncer`, the list checked against the directory in test 1:

1. **none reaches the compiler** - a specifier matching a compiler marker must be one of the five permitted, protocol-free paths; both non-vacuity guards present.
2. **no new colour** - no hex literal (the browse-ui matcher with its lookahead), no `--color-over`, in any of the seven. **This closes 06-08 deferred item 6.**
3. **the 44px floor, per interactive selector** - each class on a button, input or summary has `min-block-size: 44px` and `min-inline-size: 44px` in its own rule.
4. **exactly one live region** among the seven, and it is `SessionAnnouncer`'s `aria-live="polite" aria-atomic="true"`.
5. **monospace scoped to the numerals** - `--font-mono` in one file only (`DeviceSlot`) and only on the `.mono` selector; the prose components declare no `font-family`.
6. **the ARIA contract** - caption `aria-hidden`; `aria-describedby` everywhere; `HIDDEN_NAME_IDLE` named and not retyped; `aria-expanded` from a four-member `EXPANDS`; the mark `aria-hidden`; no `role="dialog"`; and `data-hydrated` only in `DeviceSlot`, never a static `"true"`, assigned once inside `onMount`.

The seven negative checks, each observed as `1 failed | 5 passed` and restored byte-identical:

| # | Test | Mutation |
|---|---|---|
| 1 | test 1 | `import { ZONA_USB } from "$lib/protocol"` added to DeviceSlot |
| 2 | test 2 | a hex (`#abcdef`) put in DeviceDetails |
| 3 | test 3 | `min-block-size: 44px` dropped from `.action` (FORGET/DISCONNECT), `.summary`'s 44px still in the file - still red |
| 4 | test 4 | a second `aria-live` added to DeviceNote |
| 5 | test 5 | `--font-mono` put on the identity `.label` |
| 6a | test 6 | `"S1"` added to `EXPANDS` (five states) |
| 6b | test 6 | `data-hydrated="true"` moved onto the markup unconditionally and out of `onMount` |

DeviceNote was restored with `git show HEAD:…`; DeviceSlot and DeviceDetails from sha-verified backups.

## Deviations from Plan

### 1. [Process] The identity label's spaces are &nbsp; entities, not source whitespace

**Found during:** task 1's label measurement. **Issue:** the plan's interface shows the tail as `{#if tail}<span class="tail"> · {tail}</span>{/if}` with plain spaces. Svelte trims whitespace touching an element boundary, so plain spaces between the identity's word and separator spans vanished and the label rendered `ZONA·fw1.5.5·page3` (measured on the served build). The `{" "}` the original DeviceSlot draft used to force the spaces trips `svelte/no-useless-mustaches` (`npm run lint` red). **Fix:** every space the eye and the accessible name need is a `&nbsp;` entity inside a span's own text, with the middle dots bare `·` in `aria-hidden` spans; the rendered label is `ZONA · fw 1.5.5 · page 3` and the accessible name `ZONA fw 1.5.5 page 3`. No user decision - it is the one form both Prettier/Svelte and ESLint accept. **Files:** `src/lib/ui/DeviceSlot.svelte`.

### 2. [Process] Task 1 negative 2's first-paint flash was recorded as its resize-staleness twin

**Found during:** task 1's second negative. **Issue:** the plan asks to load `/` at 1280px with a script `innerWidth` read and observe the label paint without the tail then gain it a frame later. The tail exists only in S4 (connected), which is never a prerendered or first-paint state on the probe or on the real header, so the literal first-paint flash is not reachable. **Resolution:** the same mutation's deterministic defect was observed instead - a script read taken once at load is stale after a resize (tail absent at 900 stays absent at 1280 where the CSS media query shows it). This is the same mechanism failing and is what "a width read in script is wrong" names; it is recorded rather than faked (standing rule). No deferred item: a real defect of the intended mutation was observed.

### 3. [Process] Multi-module heartbeats fed through the shim need the frame terminator

**Found during:** task 1's tail measurement. **Issue:** feeding synthetic `heartbeatFrame` bytes for EN16/BU16 through the shim left `otherModules` empty. `heartbeatFrame` ends at EOT without the trailing LF (byte 10) the `FrameScanner` scans for (`buf[i] === 10 && buf[i-3] === 4`), so the fresh post-connect fold never saw a complete frame; and its `identify()` returns null until the ZONA is in the fold's own `seen`. **Fix (test harness only):** each chained frame is fed as `[...frame, 10]`, and the ZONA heartbeat is re-fed so `identify()` returns the ZONA carrying the two others. No product code changed; this is how the served-build measurement drives a rig.

### 4. [Process] The served build was measured without invoking wrangler

As 06-08 and 06-09: `npm run build` (with the temporary mounts), served by a scratch `node:http` static server over `build/` on **127.0.0.1:4174**, driven by scratch Playwright specs importing `FAKE_SERIAL` by absolute path. Port 4173 was never used; the server was killed by PID afterwards; no LISTENING socket on 4173/4174 and no `workerd`/`wrangler` process remain. `test-results/` and the scratch specs were removed by hand (deferred item 5).

## Requirements

**`requirements-contributed: [CONN-01, CONN-05, CONN-06, CONN-08]`** - contributed, not completed, on the phase's convention. CONN-01's one control, CONN-05's two `cancelled` disclosures, CONN-06's reconnect affordance (the S2 slot) and CONN-08's always-visible identity are all built and measured, but nothing mounts `DeviceSlot` or `DeviceDetails` into a shipped route until 06-11, so none is marked complete in REQUIREMENTS.md.

## Known Stubs

None. `DeviceSlot` and `DeviceDetails` render live session state and session-copy's strings; neither has a shipped mount yet by design (06-11), a sequencing fact rather than a stub.

## What the next plan inherits

- The five-name block above, verbatim, all five. `BASE_E2E` is **61**; `PREV_E2E` is **71**, measured by 06-07 and unchanged here.
- `PREV_FILES` / `PREV_TESTS` for plan 06-11 are **69 / 723**. svelte-check is at **533 files**.
- `DeviceSlot` props: `covered`, `panelOwnsProse`. Testids `device-slot`, `device-slot-label`, `device-slot-caption`; `data-slot` and `data-hydrated` on the root. It owns the drawer's `open` and renders `DeviceDetails`. Wire it and `DeviceNote` from the SAME per-route `panelOwnsProse` expression (06-09's note): the coverflow's "an entry is chosen" state on `/` and `/c/{id}/`, a literal `false` on `/browse/`.
- **06-11 must repeat the `data-hydrated` check against `build/index.html`** once the slot is in the real header, and measure the header height across the 1280/900/320 ladder (the box does not move here either).
- `DeviceDetails` props: `open`, `panelOwnsProse`, `onclose`. It is `position: absolute` and expects a `position: relative` `.device-chrome` parent holding both the slot and the drawer, so the click-outside boundary is the whole chrome.
- `device-ui.spec.ts` holds 6; **06-12 takes it to 7** (its own negative re-adds `aria-live` to `connect-status`) and must add PickerExplainer's own testid at its panel mount.
- The slot reads no viewport width and registers no listener; the tail is CSS-only. Any width-dependent behaviour added later belongs in a media query, not a script read.

## Self-Check: PASSED
