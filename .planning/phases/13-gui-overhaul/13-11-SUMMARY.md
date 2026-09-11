---
phase: 13-gui-overhaul
plan: 11
subsystem: ui
tags:
  [
    device-band,
    connection-control,
    device-actions,
    footer,
    header,
    context-bar,
    status-zone,
    two-props,
    device-clause,
    fifteen-phases,
    anti-collapse,
    safety-rail,
    phase-7-rules,
    one-mount-two-openers,
    device-drawer,
    reported-page,
    d-06,
    d-19,
    radius-allowlist-empty,
    negative-checks,
    counts,
    copy-ledger,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 10
    provides: "PREV_FILES 87 / PREV_TESTS 905 (+1 todo) as 13-10 measured them (the tree read 907 with 12.1-03's lua-smoke +2 in flight); e2e 78 / 94; check 609; sweep 4 19; allowlist 2 rows / 2 declarations (DeviceDetails, KeepConfirm - both this plan's); the workspace's status zone still empty; the five-chunk e2e harness in the scratchpad"
  - phase: 13-gui-overhaul
    plan: 09
    provides: "the shell bridge made reactive; DeviceSlot handed into the connection slot PROVISIONALLY from the workspace route with panelOwnsProse false; the install column under the surface with the question 'show until 13-11 or hide'; the session walk's gallery hops asserting the document and not the slot"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "Header.svelte's connection slot reserved at 218 x 37 as a snippet; Footer.svelte's Help & shortcuts disclosure and its Device actions slot absent until filled; ContextBar.svelte's three zones with status as a string or a snippet; shell.svelte.ts's fill"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "drafts.ts - the DRAFT object of section 9; no route writes to it yet (13-13)"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure; never a corner), D-05 (the register; this plan changes no string), D-06 (the page target's envelope - 13-12's), D-15 (six circles by file and line), D-19 (Editor parity; the 255/4 refusal is pending removal at 13-17 and is not restated here)"
  - phase: 12-touch-framework
    plan: 03
    provides: "the three-acknowledgement classifier (read only): install.spec.ts 'a partial names which of the three landed, and the partial that cannot happen does not'"
provides:
  - "THE HEADER'S CONNECTION CONTROL ON EVERY PAGE: src/lib/ui/shell/ConnectionControl.svelte hosts DeviceSlot.svelte over slotStateOf(session.phase) with data-slot and data-capability on the host, mounted by src/routes/+layout.svelte as the Header's connection snippet on both variants (the intro and the gallery carry the control for the first time since 13-07 / 13-08; 13-09's provisional snippet in the workspace route is gone); DeviceSlot re-skinned to the PDF's bordered box - 44px, the 8px dot, the two 14px line boxes kept, every state, label, accessible name and ARIA rule Phase 6's"
  - "DEVICE ACTIONS IN THE FOOTER AS THE ONE MOUNT OF THE DEVICE DISCLOSURE: src/lib/ui/DeviceActions.svelte is the footer's second label (a disclosure shaped like Help & shortcuts, aria-expanded + aria-controls) and beneath it DeviceDetails.svelte - the five states S0a / S0b / S4 / S5 / S6, the identity sentence, the multi-module line, the snapshot line, DISCONNECT ZONA and FORGET THIS ZONA under the write lock, CONN-02's two messages, CONN-04's six steps - unchanged; src/lib/ui/device-drawer.svelte.ts holds the one open state and the opener for the two openers (the header's summary, the footer's label); the S6 arriving failure still opens it from the header and moves focus into it"
  - "THE CONTEXT BAR'S STATUS ZONE AS TWO PROPS: ContextBar.svelte takes `draft` and `device` (never one merged line), renders the dot toned by the device's phase and the two clauses joined by the PDF's middle dot only when both exist; src/lib/ui/shell/device-clause.ts maps the install store's FIFTEEN phases onto Phase 10's own captions and titles (idle has none), lists UNCERTAIN_PHASES (four) and UNCHARTED_PHASES (four), and names the spec row each phase serves; the workspace hands `device: install.phase` and no draft (13-13's wiring, 13-18's words)"
  - "THE MAPPING BESIDE THE BLOCKS: InstallState.svelte's header carries the Bible's twelve rows against the fifteen phases, a comment beside every branch names its spec row, the four with no row are named as the safety rail, the four uncertain phases keep four bodies with the reason written down; D03-D06 named as these blocks and NOT re-homed as modal dialogs; D02 named as 13-12's"
  - "THE REPORTED PAGE IN THE DESTINATION ZONE: the workspace route renders `Page {n}` from session.identity.activePage while connected (the PDF's sentence otherwise) with a comment naming 13-12 for the Target select, section 9's destination review and Apply to ZONA"
  - "THE ALLOWLIST IS EMPTY: DeviceDetails.svelte's 10px went with the floating drawer, KeepConfirm.svelte's 10px squared; 0 rows / 0 declarations, layer A (15 declarations, 6 circles at D-15's lines, 9 exempt) and layer B (17 built declarations, 6 of them 50%) green on a fresh build"
  - "COUNTS: 87 / 909 on the tree before this plan's tests (12.1-04's +2 on 12.1-03's observed 907) -> 87 / 912 on the term +0 / +3 (device-ui.spec.ts 13 -> 16); the tree reads 87 / 913 (+1 todo) with 12.1-05's +1 landed during the plan; e2e 78 titles / 94 runs in and out, five chunks green on fresh detached servers with no rerun; check 613; sweep 4 19"
affects:
  - "13-12 (the destination zone's `Page {n}` label and its data-testid destination-page are the read-only shape to replace with the Target select, the review and Apply to ZONA; the install column moves then; install.svelte.ts and snapshot.ts are untouched by this plan; the header's control and Device actions are the layout's - do not hand them in from a route)"
  - "13-13 (the bar's `draft` prop exists and no route sets it; wire drafts.ts to the workspace and pass the draft clause through the fill)"
  - "13-17 (D-19: the 255/4 constant is pending removal; nothing here restates the refusal)"
  - "13-18 (the rows table in 13-COPY-NEW.md 'From 13-11': every string the band renders is Phase 10's; the four uncertain phases need four lines and may not be merged; the four uncharted phases need four; device-clause.ts reads install-copy's constants and will follow a rename)"
  - "13-20 (the counts; DeviceActions.svelte and ConnectionControl.svelte are device components outside DEVICE_COMPONENTS' seven - covered by tests 14 and 16, not by tests 1-13; DeviceNote.svelte has no consumer since 13-09; PadSpinner has two consumers since DeviceMark's re-skin; the frame not shrinking for a taller footer is 13-05's arrangement)"
  - "12.1 Band 2 (install.svelte.ts and snapshot.ts untouched here, so the hard band starts clean)"
tech-stack:
  added: []
  patterns:
    - "One disclosure, two openers: a runes module holds the open state and the opener element; both openers carry the panel's id in aria-controls, and the panel's click-outside and focus-leaving paths recognise an opener by that attribute so a toggle is never a close followed by a reopen"
    - "A shell-owned control is mounted by the layout as the Header's / Footer's snippet, never handed in by a route: what must exist on every page belongs to the one component on every page, and the fill carries no slot for it"
    - "A status line with two facts takes two props; the mapping from a store's union to a clause lives in one module that reads the copy module's constants through its builders, so the copy module stays its owner's"
    - "A negative check plants one edit on the working file with a scratch copy and a sha256 either side, runs the spec, and restores byte-identical - no git checkout, restore, stash or clean"
key-files:
  created:
    - src/lib/ui/shell/ConnectionControl.svelte
    - src/lib/ui/DeviceActions.svelte
    - src/lib/ui/device-drawer.svelte.ts
    - src/lib/ui/shell/device-clause.ts
    - .planning/phases/13-gui-overhaul/13-11-SUMMARY.md
  modified:
    - src/lib/ui/DeviceSlot.svelte (re-skinned; open moved to the drawer module; aria-controls)
    - src/lib/ui/DeviceMark.svelte (the 9x9 field becomes the PDF's dot)
    - src/lib/ui/DeviceDetails.svelte (static block in the footer; openers recognised; scrolled into view; no radius)
    - src/lib/ui/InstallState.svelte (comments only - the mapping)
    - src/lib/ui/KeepConfirm.svelte (the 10px squared)
    - src/lib/ui/radius-allowlist.ts (two rows cleared - empty)
    - src/lib/ui/shell/ContextBar.svelte (draft and device props, the dotted line)
    - src/lib/ui/shell/Footer.svelte (the slot's panel row; the brand pinned to the first line)
    - src/lib/ui/shell/Header.svelte (comments - the slot is filled)
    - src/lib/ui/shell/shell.svelte.ts (connection and deviceActions leave the fill; draft and device join it)
    - src/routes/+layout.svelte (mounts ConnectionControl and DeviceActions; passes draft and device)
    - src/routes/playground/[id]/+page.svelte (DeviceSlot snippet gone; device: install.phase; the destination label)
    - src/lib/ui/device-ui.spec.ts (13 -> 16)
    - src/lib/ui/shell.spec.ts (test 6: the fill no longer carries deviceActions; the layout's own asserted)
    - e2e/session.e2e.ts (the four-hop walk reads the slot on the gallery and the intro again; titles unmoved)
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md (the 13-11 section: no string; the rows for 13-18; six questions)
    - .planning/STATE.md
key-decisions:
  - "The header's control is DeviceSlot re-skinned and hosted, not a new control: the e2e reads its testids, accessible name and ARIA in every state and device-ui.spec.ts tests 6 and 11 scan its source; ConnectionControl.svelte is the shell's host over slotStateOf, mounted by the layout on both variants"
  - "The disclosure is one mount with two openers in the footer (the PDF's placement, Help & shortcuts's idiom), not a floating drawer under the header with the footer's label opening it up there; a panel opened from the header scrolls into view because the frame does not shrink for a taller footer"
  - "The control in S0a / S0b is present and ENABLED - a summary whose caption is the reason in short and whose click opens CONN-02's message in full; the plan's 'disabled' is not built, because it would close the reason's own door and break session.e2e.ts's 'present, enabled, aria-expanded'; DEGR-02's disabled-with-reason rule is the install controls' (test 10, first-experience.e2e.ts)"
  - "D03-D06 are NOT re-homed as modal dialogs: KeepConfirm's header and test 8 rule the install surfaces never modal, and a state that arrives on its own cannot take the page; the mapping lands as comments and as the anti-collapse test"
  - "Reset active device page is NOT built under Device actions: A-45 (CLEAR without a confirmation; test 13's 'the site's one confirmation') against the Bible's D06 (a confirmation naming the page) is the user's call; the sentence is 13-18's and the page is 13-12's target - question 1"
  - "The install column stays under the surface until 13-12, decided from the PDF: page 5 has no column because its Apply to ZONA is in the bar, and hiding it before that control exists takes the only write control off the only page that has one"
  - "The two tasks share three files, so the commits are cut by independence (the mapping, the bar, KeepConfirm; then the control, Device actions, the tests), each green alone"
  - "gsd-tools state commands not run; STATE.md by script against a copy with every touched line asserted"
patterns-established:
  - "device-drawer.svelte.ts: a shared open state for a disclosure with more than one opener"
  - "shell/device-clause.ts: a store-union-to-clause table beside the component that renders it, reading the copy module and owning no string"
requirements-completed: [CONN-01, CONN-02, CONN-03, CONN-06, CONN-08, SAFE-01, SAFE-02, SAFE-07, SAFE-08, DEGR-01, DEGR-02]
duration: 105min
completed: 2026-09-11
---

# Phase 13 Plan 11: The device band re-skinned and re-homed with every safety rule unchanged Summary

**The header's control is DeviceSlot in the PDF's bordered box on every page; the device disclosure is
ONE mount in the footer as Device actions with two openers; the context bar's status zone takes the
draft and the device as two props over a fifteen-phase table of Phase 10's own words; and every
phase, gate, confirmation and disabled reason is the object it was, proved by the thirteen titles that
were green before anything was added and by Phase 7's four assertions, run and pasted.**

## Commits

| Hash      | Message                                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `f8c1837` | `feat(13-11): the twelve spec states over fifteen phases as comments beside each block, the context bar's status zone as two props over one device-clause table, and KeepConfirm squared` (6 files, +428 / -17)                |
| `96b18a3` | `feat(13-11): the header's connection control in the PDF's box on every page, Device actions in the footer as the one mount of the device disclosure with two openers, the reported page in the destination zone, and three tests` |

The two tasks share three files (`device-ui.spec.ts`, `radius-allowlist.ts`, the workspace route), so the
commits are cut by independence rather than by task number: the first is task 2's independent half
(the mapping comments, `device-clause.ts`, the bar's two props, KeepConfirm's corner, the copy ledger)
with the allowlist at one row (DeviceDetails') so it is green alone; the second is task 1 whole plus the
shared files (the three tests, the allowlist at zero, the route's `device: install.phase`). Both green
on the quick suite at their own state. No co-author trailer, per the repository's rule.

## The baseline, measured

HEAD when this plan started reading was `dbb4c8c`; when it started editing, `65d79f1` (12.1-03's
SUMMARY had just landed and the tree was clean). The quick suite there: **87 files / 907 tests (+1
todo)**, all green - 13-10's 905 plus 12.1-03's lua-smoke +2, now committed. During this plan 12.1-04
landed `cdfbfce`, `849d9ff` and `94100cb` (+3 −1 = +2, 907 → 909) and 12.1-05 landed `0384f2f` (+2 −1
= +1); none of their files is one of this plan's. Every figure below is stated as observed plus a delta.

**All thirteen `device-ui.spec.ts` titles were run and green BEFORE any edit** (16:47, verbose
reporter, thirteen ticks), and **again green after the re-home and before the three new tests were
added** (17:04, `Tests 13 passed`; the whole quick suite at 87 / 909 at the same moment). None of the
thirteen was edited.

## Where each piece landed

| Piece                          | Before 13-11                                                                  | After 13-11                                                                                                                                                                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The connection control         | `DeviceSlot` handed into the header's slot by the workspace route only (13-09) | `ConnectionControl.svelte` (shell) hosts `DeviceSlot` over `slotStateOf`; the LAYOUT mounts it as the Header's `connection` snippet on both variants, so `/`, `/playground/` and `/playground/{id}/` all carry it; the fill's `connection` field is gone                            |
| Its skin                       | 24px 9x9 mark, two 14px lines, no box                                          | the PDF's 1px `--color-boundary` box, 44px tall (the floor), the 8px dot (`DeviceMark`, a radial gradient in four fills), the two 14px lines kept (Y-10), the label at 0.06em, the identity sentence-case at 13px; hover and `aria-expanded` brighten the border                    |
| The disclosure (`DeviceDetails`) | a floating drawer under the header, owned and mounted by `DeviceSlot`         | a static block in the footer's panel row, mounted ONCE by `DeviceActions.svelte`; `open` and `opener` in `device-drawer.svelte.ts`; opened by the header's summary (S0a, S0b, S4, S5), by the S6 arriving failure (focus moved in), or by the footer's label; scrolled into view on open |
| Device actions                 | the footer's slot absent (13-05)                                              | `Device actions` label, `aria-expanded` / `aria-controls`, beside `Help & shortcuts` with the middle dot; its panel row beneath                                                                                                                                                   |
| The status zone                | empty on the workspace (13-09 / 13-10 known stub)                             | `ContextBar` takes `draft` and `device`; the workspace passes `device: install.phase`; the line renders the dot and the device clause; the draft clause awaits 13-13's wiring                                                                                                      |
| The destination zone           | `Preview without hardware` always                                             | `Page {n}` from the module's reported page while connected; the sentence otherwise; 13-12 named                                                                                                                                                                                   |
| The install blocks             | `InstallState` in TryOnDevice's region 3, under the surface                   | the same, with the mapping in the header and beside every branch; the install column stays until 13-12                                                                                                                                                                             |

Screenshots (in the scratchpad, taken on the served build with no serial, so the header reads S0a):
`1311-workspace-closed.png` (the box at the top right, `Help & shortcuts · Device actions` at the
bottom right), `1311-workspace-header-opened.png` (the header's summary opened the footer panel; the
page scrolled to it; CONN-02's unsupported message in full), `1311-intro.png` and `1311-gallery.png`
(the control on the two pages that had none). **Every word in them is Phase 10's, not the final copy.**

## The twelve-to-fifteen mapping, as landed

`InstallState.svelte`'s header and `device-clause.ts`'s header carry the same table; a comment sits
beside every branch. In one place:

| Spec §9 state                | HANGAR phase(s)                                                     | Bar clause today (Phase 10's words)                                  | Verdict                                                                    |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| No connection                | the session's S1 (`starting`, `idle`), not an install phase         | - (the header's control: `NO ZONA` / `CONNECT ZONA`)                 | exists, re-label only (13-18)                                              |
| Permission needed / denied   | the session's S6 (`cancelled` with `PERMISSION_DECLINED`, `TWO_STEP`) | - (the header's caption `Did not connect`; the recovery in Device actions) | exists                                                                     |
| Unsupported environment      | the session's capability: S0a `unsupported`, S0b `insecure`         | - (two captions: `Not in this browser`, `Needs HTTPS`)               | exists, and finer than the spec's one row                                  |
| Ready                        | `ready`                                                             | `ZONA IDENTIFIED`                                                    | exists                                                                     |
| Draft differs                | the tuner's dirty flag, not a phase                                 | the DRAFT clause - not wired (13-13), no words (13-18)               | lives elsewhere                                                            |
| Applying                     | `writing` (+ the 2000 ms `slow` line)                               | `WRITING…`                                                           | exists                                                                     |
| Applied temporarily          | `settled`                                                           | `PLAYING NOW`                                                        | exists (D03)                                                               |
| Storing                      | `writing` with `leg = "store"`                                      | `WRITING…` (the bar does not read the leg)                           | exists                                                                     |
| Stored                       | `kept`                                                              | `KEPT`                                                               | exists (D04)                                                               |
| **Transfer uncertain**       | **`unconfirmed`, `kept-mismatch`, `partial`, `nothing-landed`**     | **four titles, pairwise distinct (below)**                           | **HANGAR is finer than the spec; four bodies and four clauses, never merged** (D05) |
| Disconnected                 | `lost`                                                              | `The ZONA was unplugged mid-write`                                   | exists                                                                     |
| **-**                        | **`restored`**                                                      | `RESTORED`                                                           | **no spec row: PUT BACK's outcome - the safety rail**                      |
| **-**                        | **`restored-unconfirmed`**                                          | `Put back for now, not after a power cycle`                          | **no spec row: PUT BACK's store did not confirm - the safety rail**        |
| **-**                        | **`cleared`**                                                       | `FACTORY DEFAULT`                                                    | **no spec row: the firmware default playing (D06's outcome) - the safety rail** |
| **-**                        | **`snapshot-failed`**                                               | `Nothing to put back yet`                                            | **no spec row: nothing copied, so nothing is written - the safety rail**   |
| -                            | `snapshotting`                                                      | `READING ZONA`                                                       | before Ready                                                               |
| -                            | `idle`                                                              | no clause, no dot                                                    | nothing to state                                                           |

Fifteen phases: thirteen render through a branch of their own in `InstallState.svelte`, `idle` through
the `shown !== "idle"` gate (renders nothing; the panel renders the session's blocks), `writing`
through the held block under `aria-busy`. Test 15 reads the union from `install.svelte.ts`'s source
(asserted fifteen), asserts the two without a branch are exactly `idle` and `writing`, and asserts the
four uncharted by name.

## The four uncertain bodies, as they read today

Still Phase 10's words, said plainly; 13-18 writes the four new lines and may not merge them.

| Phase             | Title (the bar's clause)                      | Detail (the block's body)                                                                                                                                                                | Steps                                                                                        |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `unconfirmed`     | Your ZONA did not confirm the store           | `{name} is still running on your ZONA, in memory. No confirmation of the store came back, so HANGAR cannot say whether it will be there after a power cycle.`                             | Click KEEP ON DEVICE to send the store again · Or click PUT BACK to restore what was there when you connected |
| `kept-mismatch`   | Stored, but the read-back does not match      | `Your ZONA acknowledged the store, but reading the two scripts back gave something different. HANGAR will not call that kept.`                                                           | Click TRY ON DEVICE, then KEEP ON DEVICE again · Or click PUT BACK …                          |
| `partial`         | Only one of the two scripts landed            | `{landed} reached your ZONA and {failed} did not. What is on the module now is part of this configuration and part of your own.` (12-03's three-string classifier fills the two lists)    | Click TRY ON DEVICE to send all three again · Or click PUT BACK …                             |
| `nothing-landed`  | Nothing reached your ZONA                     | after TRY: `Neither script got through. Nothing on the module changed, so your own Setup and Timer are still running and there is nothing to put back.`; after PUT BACK / KEEP / CLEAR: `… so what was playing is still playing.` | Click TRY ON DEVICE (or PUT BACK) to send both again · If it happens twice, check the cable is seated at both ends |

(`partial`'s title still says "two scripts" - 12-03 kept `PARTIAL_TITLE` fixed when the detail moved
to three; 13-18's row.) Test 15 asserts the four branches call four DIFFERENT builders and that the four
titles are pairwise distinct; `device-clause.ts` renders the same four titles as the bar's clause, and
the test asserts those four are pairwise distinct too.

## Phase 7's four rules, restated clause by clause, each proved by an assertion that already exists

All run 2026-09-11 on this plan's tree; the lines are pasted as the reporters printed them.

**1. Nothing writes without a click.** Proved by class in a browser and in node.
`e2e/install.e2e.ts:402` - `the snapshot is taken before any control enables, and nothing is written without a click`,
whose assertions are `expect(zona.seen("CONFIG", "EXECUTE")).toBe(0); expect(zona.seen("PAGESTORE", "EXECUTE")).toBe(0); expect(zona.seen("HEARTBEAT", "EXECUTE")).toBe(0); // Four frames, not three: the serial and the three fetches. expect((await writesOf(page)).length).toBe(4);` -
result on the install chunk:
`ok 2 [chromium] › e2e\install.e2e.ts:402:3 › the install store on a scripted ZONA that answers from Node › the snapshot is taken before any control enables, and nothing is written without a click (3.8s)`.
In node: `✓ |server| src/lib/device/install.spec.ts > … > nothing is written without a click, and TRY ON DEVICE writes exactly three, the page init first, verbatim`.
And this plan's own walk: `session.e2e.ts`'s four-hop title ends with `onlyReads(page, zona, 1)` over
the intro, the gallery and the workspace with the new control on all three - green.

**2. RAM before flash.** The leg ordering: a RAM leg (`CONFIG/EXECUTE` x3) precedes any store leg
(`PAGESTORE/EXECUTE`), and `kept` is said only after the store's acknowledgement.
`✓ |server| src/lib/device/install.spec.ts > … > three strings go out in the one order on every leg that writes, and the store proof reads three per round`
(`expect(store.leg).toBe("ram")` at 887 before `expect(writesOf("PAGESTORE", "EXECUTE")).toBe(1); … expect(store.leg).toBe("store")` at 1133-1156), and
`✓ |server| src/lib/device/install.spec.ts > … > kept is said after the store acknowledgement, a heartbeat, and a matching re-fetch`.

**3. Snapshot before write.** `✓ |server| src/lib/device/install.spec.ts > … > the snapshot is taken at connect, in order, before ready` and the persist-if-absent rule that the record is the module's ORIGINAL and is never overwritten by a later fetch:
`✓ |server| src/lib/device/snapshot.spec.ts > the module's original, as a record (src/lib/device/snapshot.ts) > an existing page entry is never overwritten`.

**4. ACK before "done".** 12-03's three-acknowledgement classifier:
`✓ |server| src/lib/device/install.spec.ts > … > a partial names which of the three landed, and the partial that cannot happen does not`, and its clear-side sibling
`✓ |server| src/lib/device/install.spec.ts > … > a clear whose second acknowledgement never comes is partial, never cleared`; in a browser,
`ok 7 [chromium] › e2e\install.e2e.ts:641:3 › … › one landed script is partial, none landed is nothing-landed, and both offer the way back (5.2s)`.

Nothing in this plan touched a store, a leg, an acknowledgement or a classifier: `git diff --quiet -- src/lib/device/install.svelte.ts src/lib/device/session.svelte.ts` is silent at both commits, and `src/lib/device/` is byte-untouched except for nothing - no file under it is in either diff.

## The stores were read and not edited

`install.svelte.ts` and `session.svelte.ts`: read, not edited (`git diff --quiet` silent; neither appears
in `git show --stat f8c1837 96b18a3`). `install-copy.ts` and `session-copy.ts`: read, not edited -
the seven failure titles are module-private, so `device-clause.ts` reaches them through the exported
block builders with a representative argument (a title never depends on a builder's argument; 12-03
kept `PARTIAL_TITLE` fixed when the detail changed), which is what keeps this plan out of 13-18's
module. One value a render could have wanted and the store does not expose: nothing - every clause
and every state the band renders is on the store's public surface.

## The install column: shown until 13-12, decided from the PDF

13-09's open question. PDF page 5 draws no column under the surface because its `Apply to ZONA` and
the `Target` select live in the context bar - which is 13-12's control (D-06's envelope, section 9's
destination review). Until that control exists, hiding the column would take TRY ON DEVICE off the
only page that has it, against the core value. So it stays, and `device-ui.spec.ts` test 10 (the
column's structure, PutBack first, Clear after, `<InstallState` in TryOnDevice) is untouched. The cost
is recorded: for one wave a state caption reads twice on the workspace - once as the bar's clause,
once as the block's caption under the surface. The route's header says "until 13-12" where it said
"until 13-11".

## The allowlist, before and after

Before: **2 rows / 2 declarations** - `DeviceDetails.svelte` 1 (the floating drawer's 10px),
`KeepConfirm.svelte` 1 (the block's 10px). After commit `f8c1837`: 1 row / 1 (DeviceDetails', so the
first commit is green alone). After commit `96b18a3`: **0 rows / 0 declarations** -
`ALLOWLIST: readonly AllowlistRow[] = []`, the debt paragraph dated. Layer A on the tree:
`15 declarations in 57 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15): ColourPicker.svelte:840, :867, :882, Knob.svelte:730, :785, :807; 9 exempt`.
Layer B on a fresh build (run after `npm run build`, per the warning): `17 radius declarations in 11 built stylesheets; 6 of them 50%; tolerated values from the allowlist: none`.
The two new dots (the header's mark and the bar's) are radial gradients on 8px square boxes, not
corners. The list is empty nine plans before 13-20 asserts it.

## Task 1: the connection control, Device actions, and the rule kept

**`ConnectionControl.svelte`** hosts `<DeviceSlot />` in the header's reserved box, reads
`slotStateOf(session.phase)` for `data-slot` on the host and derives `data-capability` from the two
terminal phases. It does not call `capabilityOf()` and says why in its header: the session called it
once, synchronously, inside `start()`, and the phase carries its answer; a component that called it
again would be reading the browser, which the device components never do (session-copy.ts's own
rule). The plan's `pattern: "capabilityOf"` is met by that sentence, not by a call, and this is stated
so nobody reads a grep hit as a second capability read. The button-versus-summary rule is written in
prose in both files and test 14 asserts the prose is there.

**`DeviceSlot.svelte`** keeps every rule: `EXPANDS` of exactly four, `DISCLOSES` of five, `armed` on a
header click, the S6 arriving failure opening the disclosure and moving focus into it (`drawer.opener =
control; drawer.open = true`), `data-hydrated` from `onMount` alone, the caption `aria-hidden` and the
`aria-describedby` twin, the S1 hover swap by opacity, the S4 identity with aria-hidden dots, the
multi-module tail collapsed in CSS below 1024. What moved: `open` to `device-drawer.svelte.ts`;
`aria-controls={PANEL_ID}` on the four summary states; `<DeviceDetails>` no longer mounted here; the
dead `covered` prop (D-09 deleted the splash) removed. Skin: the box, 44px, the dot.

**`DeviceActions.svelte`** is the footer's label (`data-testid="device-actions"`, `aria-expanded`,
`aria-controls`) and the panel row (`id={PANEL_ID}`, hidden by class while closed) holding the one
`<DeviceDetails open opener onclose>`. **`DeviceDetails.svelte`** renders the five states unchanged; two
lines gained: `isOpener()` in the click-outside path and the focus-leaving path, so a click on either
opener toggles rather than closing-then-reopening (proved on the served build: header click opens,
header click closes, footer click opens, footer click closes, a click on the surface closes); and
`container?.scrollIntoView({ block: "nearest" })` on open, because the footer sits under a frame sized
to the viewport and a panel opened from the header would land below the fold (seen in the first
screenshot round and fixed; the frame not shrinking for a taller footer is 13-05's arrangement and
`Help & shortcuts` shares it).

**FORGET THIS ZONA keeps its gate.** It has no modal confirmation and never had one; its gate is
`REVOKE_EXPLANATION` beside it (what is removed; that the copy of the visitor's own configuration
stays, Z-13), one disclosure away, rendered only where `session.canForget`, under the write lock. The
plan's word "confirmation" describes that arrangement, and it moved whole - test 16 asserts the
explanation precedes the control and `{FORGET_LABEL}` renders exactly twice (S4, S5).

**The e2e agrees.** `session.e2e.ts`: S4's click opens `device-details` with the identity sentence
and both controls; S6's arriving failure opens it with focus inside (`active: "device-details"`) and
Escape returns focus to the control; S0a's click opens the unsupported message naming Chrome, Edge and
Firefox 151 and no engine, with no button in the panel; the four-hop walk now reads the slot on the
gallery and the intro (`stillConnected` on all four hops - 13-09's "13-11 restores the slot reads here"
honoured, titles unmoved). `install.e2e.ts:1291`: the lock on both controls reached through the header's
click. All green on fresh servers.

**Test 14** (`+1`): renders `ConnectionControl` over the real session store in all SEVENTEEN phases
(the list is checked against `session-copy.ts`'s union), and asserts: nine slot states and no tenth;
three capability answers; the control PRESENT in every phase (the DEGR-02 message); `aria-expanded`
in exactly S0a / S0b / S4 / S5 and `disabled` in exactly S3 (the button-versus-summary clauses);
`aria-controls={PANEL_ID}` on the summaries and on nothing else; on S0a / S0b the caption is that
browser's own line (two different lines), the label is not `CONNECT ZONA`, and "Chromium" is nowhere;
the rule in prose in both files; the layout mounting each control once; the workspace route free of
`DeviceSlot`; the fill free of `connection` and `deviceActions`.

## Task 2: the fifteen phases, the two props, and what was not built

**The mapping** is in `InstallState.svelte`'s header as the table above and beside every branch as a
one-line comment (`spec: Applied temporarily (D03)`, `spec: NO ROW - PUT BACK's outcome; the safety
rail`, `spec: Transfer uncertain, body 3 of 4 (D05)` …), and in `device-clause.ts`'s header for the bar.

**The two props.** `ContextBar.svelte` declares `draft?: string | Snippet` and `device?: InstallPhase`
and renders the dotted line (`data-testid="status-dotted"`, `data-device`, `data-tone`) with the dot,
the draft clause (`status-draft`), the middle dot only when both clauses exist, and the device clause
(`status-device`); with neither it renders the `status` sentence as before (shell.spec.ts test 3
untouched and green). The layout passes `draft={fill.draft}` and `device={fill.device}`; the workspace
passes `device: install.phase` and no draft, and its fill effect re-runs when the phase moves (the
snippets in it are the same functions, so the rail and the inspector are not re-created - the install
e2e titles drive the tuner through every phase change and stayed green). The dot's tone is the
device's: quiet for idle and busy, the action colour for a confirmed state, full ink for the six
titles that ended without a confirmation - never the alarm red, for KeepConfirm's reason.

**Test 15** (`+1`, the anti-collapse test): the union read from `install.svelte.ts` (fifteen); the two
phases without a branch are exactly `idle` and `writing`, asserted BEFORE the count so a vanished
phase is named; the four uncharted present by name and `UNCHARTED_PHASES` equal to them; the four
uncertain branches call four different builders, in order, and their titles are pairwise distinct;
`deviceClause` defined for fourteen and undefined for `idle`, the four uncertain clauses pairwise
distinct; `ContextBar` rendered with both props (dot, two clauses, the middle dot, `data-tone="live"`),
with the device alone (one clause, no middle dot, `data-tone="uncertain"` for `partial`), with neither
(the sentence), and with `idle` (no dot); the source carrying the two props separately; the workspace
passing `device: install.phase` and no `draft:`.

**Test 16** (`+1`): `<DeviceDetails` mounted in exactly one file under `src/lib/ui` and `src/routes`
(`DeviceActions.svelte`); both openers naming `PANEL_ID`; the slot no longer owning `open`; the five
branches, `{FORGET_LABEL}` twice, the explanation before the control, `session.canForget`, both
testids; `previouslyFocused?.focus()` and the two `isOpener` call sites; no `position: absolute`; no
dialog role, no aria-modal, no inert, no aria-label in the three re-homed files (needles assembled);
`DeviceActions` rendered closed (label `aria-expanded="false"`, the panel id present, no
`device-details`); the label's 44px floor on both axes; no `border-radius` in DeviceDetails or
KeepConfirm.

**What task 2 did NOT build, and why.** (a) **D03-D06 as modal dialogs with a shared focus-trap
helper.** The plan says "KeepConfirm already does [trap focus]"; the tree says the opposite -
KeepConfirm's header ("WHY IT IS NOT A DIALOG. No role=dialog, no aria-modal, no inert background, no
focus trap") and test 8 assert it is an inline group and never modal, and Phase 6 ruled the same for
the disclosure. A settled / kept / failure / cleared state arrives on its own after a write, and a
state that arrives on its own cannot take the page. The four are `InstallState`'s blocks, in place,
with the mapping beside them; the test the plan wanted ("each dialog traps focus and returns it") is
not written, because it would assert something the tree rules out. Test 16's focus-return assertion is
the disclosure's, which is the one re-homed surface that has a focus contract. (b) **The page target,
D02 and Apply to ZONA** - 13-12's, named in the route, the bar and the mapping. (c) **Reset active device
page under Device actions** - see the questions.

## Negative checks, five, each on a scratch copy with sha256 either side

| Planted                                                                                                                | Result                                                                                                                                                                                                                                                                                       | Restored          |
| ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| A. `ConnectionControl`: `{#if capability === "ok"}<DeviceSlot />{/if}` (hidden on unsupported)                         | test 14 red: `unsupported: the control is PRESENT - DEGR-02 forbids hiding it on a browser that cannot install, and CONN-01 puts one control in the header in every state: expected 0 to be greater than 0`                                                                                    | sha `a8478e4a…` = |
| B. `DeviceSlot`: `EXPANDS = ["S0a", "S0b", "S3", "S5"]` (S4 acts; S3 expands)                                            | test 14 red: `choosing (S3): aria-expanded present on an acting state - a control that both acts and expands lies about one of its two jobs: expected true to be false` (the button-versus-summary clause)                                                                                     | sha `5f0e6f76…` = |
| C. `InstallState`: `partial`'s branch removed                                                                          | test 15 red: `a phase lost its own branch … any other name here is a phase collapsed into a neighbour: expected [ 'idle', 'partial', 'writing' ] to deeply equal [ 'idle', 'writing' ]`                                                                                                           | sha `26a0cb97…` = |
| C2. `InstallState`: four branches kept, `kept-mismatch`, `partial`, `nothing-landed` all rendering `unconfirmedBlock`  | test 15 red: `each uncertain phase renders through its own block builder` with the diff `- "keptMismatchBlock", - "partialBlock", - "nothingLandedBlock", + "unconfirmedBlock" x3` - the three that vanished, named (test 10 also red on the selector it pins, as expected)                       | sha `26a0cb97…` = |
| D. `ContextBar`: `device?: InstallPhase \| string` (the prop widened toward a merged line)                              | test 15 red: `expected … to contain 'device?: InstallPhase;'`                                                                                                                                                                                                                                | sha `9d273ceb…` = |

**Said plainly, as the plan asked:** no test catches a ROUTE pre-joining the two strings and handing
them over as `draft` alone. Test 15 catches the component's prop shape, the layout's plumbing and the
workspace's `device: install.phase` with no `draft:`; a future route that concatenates "Draft saved
locally · Changes not applied" into one string and passes it as `draft` would pass. That is a design
regression with no gate, and `ContextBar.svelte`'s header says so.

## Deviations from Plan

### Auto-fixed and decided inline

**1. [Rule 1 - Bug, found on the served build] A panel opened from the header landed below the fold.**
The footer sits under a frame sized `100dvh - header - context - footer` with constants, so a taller
footer grows the document; the first screenshot round showed the header's summary "opening" nothing
visible. Fixed in `DeviceDetails.svelte` with `scrollIntoView({ block: "nearest" })` on open; the S6
focus move already scrolled. Commit `96b18a3`. The frame not shrinking is 13-05's and shared with
`Help & shortcuts`; named for 13-20.

**2. [Rule 3 - Blocking] `shell.spec.ts` test 6 passed `deviceActions` in the fill.** The field left
`ShellFill`, so the three lines were replaced by an assertion that the layout renders its own
`data-testid="device-actions"`; the coarse-pointer walk still reaches the footer's button. Outside the
plan's file list. Commit `96b18a3`.

**3. [Rule 3 - Blocking] Two modules outside the plan's file list.** `device-drawer.svelte.ts` (one
disclosure, two openers in two subtrees cannot share a local) and `shell/device-clause.ts` (the
fifteen-phase table, so the copy module stays 13-18's and the bar reads no store). Both named in the
commit.

**4. [Rule 3 - Blocking] `Footer.svelte`'s row had no place for a panel.** `.actions` now wraps with
its labels right-aligned and the slot's panel as a `flex-basis: 100%` child; `.device` is
`display: contents`; the brand is pinned to the first line. shell.spec.ts test 4's two shapes untouched.

**5. [Rule 2 - Correctness] The four-hop walk's slot reads restored on the gallery and the intro**
(`e2e/session.e2e.ts`), as 13-09 asked, because the control exists there now; titles 78, runs 94, in
and out.

**6. [Plan vs tree] The plan's `86 / 896` literal is stale**, as the orchestrator said: the tree read
87 / 907 at the start and 87 / 909 when this plan's tests went in; the term is `+0 / +3` written out.

### Where the plan asserts what the tree does not support, and what was done instead

- **"present and disabled with a reason on unsupported and insecure (DEGR-02)"** for the header's
  control. The tree's control is an enabled summary in S0a / S0b whose caption is the reason in short
  and whose click opens CONN-02's message; `session.e2e.ts:1292` asserts "present, enabled,
  aria-expanded" and clicks it. Built as the tree has it; test 14 asserts PRESENT (never hidden), the
  caption, no connect offered, and the summary shape; the "disabled" clause is not built. Question 2.
- **"Every dialog traps focus and returns it … KeepConfirm already does; the others inherit the same
  helper."** KeepConfirm does not trap and test 8 forbids it. Not built; see task 2.
- **"D03 re-homed into the context bar plus a `Store on ZONA` action."** A second store trigger beside
  KEEP ON DEVICE would be a new string (13-18's) and a second control for one write (KeepOnDevice is
  mounted in the column by test 10). Not built; the bar renders the device clause and the block
  renders D03's body where it was.
- **"Reset active device page lives here [Device actions] and names the page in its confirmation."**
  Not built; question 1.
- **"`radius.spec.ts` is the wrong file for the rows"** - the rows live in `radius-allowlist.ts`, as
  13-08, 13-09 and 13-10 said; `radius.spec.ts` untouched.
- **"the connection control … in both header variants … which is what the `variant` prop exists for."**
  The control is one control in two of its nine states; `variant` does not reach it and the layout
  mounts it on both shapes.

## Concurrency: 12.1-04 and 12.1-05 during this plan

12.1-03's SUMMARY landed as this plan started editing (`65d79f1`); 12.1-04 landed `cdfbfce`, `849d9ff`
and `94100cb` mid-plan (entries, lua-smoke, audition, HARDWARE-AUDITION, STATE); 12.1-05 landed
`0384f2f` (`src/lib/sim/demo.ts`, `touch.ts` and their specs) before this plan's second commit. None of
those files is in either of this plan's diffs; the workspace route's `ledPoint()` - named by 13-09 as
12.1-05's / 12.1-08's - was not touched by them while this plan held uncommitted edits to the route, and
this plan committed as soon as its runs were green to close that window. Their commits moved the quick
suite by +2 and +1 and the e2e by nothing; every full run here was green (two reds in one run, both
named transients: `install.spec.ts`'s connect-snapshot title under load, green alone; radius layer B on
a stale build, green after `npm run build`). `frames.spec.ts` did not go red. STATE.md was copied and
written once, at the end, with `status`, `completed_phases 11` and `percent 100` asserted unchanged;
the Status line demoted to "Previous status, retained" is 12.1-04's.

## Counts

| Quantity          | Carried (13-10's term) | Observed at start (tree) | Term         | Observed at end (tree)                                                                                                                     |
| ----------------- | ---------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| unit files        | 87                     | 87 (`65d79f1`)           | **+0**       | **87**                                                                                                                                     |
| unit tests        | 905 (+1 todo)          | 907 (+1 todo)            | **+3**       | **912 on the term** = 909 (907 + 12.1-04's +2) + 3; **the tree reads 913 (+1 todo)** with 12.1-05's +1 (`git show 0384f2f`: +2 −1); `check-counts.mjs 87 913` matches on the final run |
| device-ui.spec.ts | 13                     | 13                       | +3           | **16**                                                                                                                                     |
| e2e titles / runs | 78 / 94                | 78 / 94                  | **+0 / +0**  | 78 / 94 (17 + 16 + 20 + 21 + 20 on five fresh servers, no rerun, no ProxyController line)                                                  |
| check             | 609                    | 612                      | +1           | **613**, `0 ERRORS 0 WARNINGS`                                                                                                              |
| lint              | clean                  | clean                    |              | clean (`prettier --check .` and `eslint .`)                                                                                                |
| sweep             | 4 / 19                 | 4 / 19                   | +0           | 4 / 19                                                                                                                                     |
| radius allowlist  | 2 rows / 2             | 2 / 2                    | −2 / −2      | **0 / 0**; layer A six circles, layer B green on the fresh build                                                                            |
| stores            | -                      | -                        | 0 edits      | `install.svelte.ts`, `session.svelte.ts` byte-untouched                                                                                     |

## Strings

**This plan changed no string and wrote none.** Every word the band renders is `session-copy.ts`'s or
`install-copy.ts`'s, verbatim. `Device actions` and `Page {n}` are the PDF's own and are not ledgered
(13-05's precedent). The rows 13-18 has to write for this band are tabled in `13-COPY-NEW.md` under
"From 13-11", with today's words beside the Bible's line for each.

## Questions for the user (D-01), recorded in 13-COPY-NEW.md

1. **Reset active device page under Device actions** - the Bible's D06 confirmation naming the page
   versus Phase 10's A-45 (CLEAR without a confirmation; test 13). Which stands?
2. **The header's control in S0a / S0b** ships present and enabled (the reason behind one click),
   not disabled. Keep?
3. **The box is 44px against the PDF's 37** (the floor on every control). Accept, or an inner 37px box?
4. **The install column stays until 13-12** - decided here from the PDF; say if it should hide now.
5. **Two openers, one panel, in the footer** - the header's click scrolls the panel into view rather
   than opening in place. Say if it should open under the header instead.
6. **The status dot's three tones by device state** against the PDF's one grey dot.

## Known Stubs

- The context bar's `draft` prop is unset by every route: the drafts store is not wired to the
  workspace until 13-13 and the words are 13-18's. The line renders the device clause alone; in
  `idle` with no draft the zone is empty on the workspace, as before.
- The destination zone's `Page {n}` label is read-only by design for one wave; 13-12 builds the
  Target select, the review and Apply to ZONA (`data-testid="destination-page"`).
- `DeviceNote.svelte` has had no consumer since 13-09 dissolved the coverflow (the e2e's
  `device-note` count of 0 is trivially true); not this plan's, named for 13-20.

## Self-Check: PASSED

Files: `src/lib/ui/shell/ConnectionControl.svelte`, `src/lib/ui/DeviceActions.svelte`,
`src/lib/ui/device-drawer.svelte.ts`, `src/lib/ui/shell/device-clause.ts` FOUND. Commits `f8c1837`,
`96b18a3` FOUND in `git log`. `device-ui.spec.ts` 16 green; quick suite 87 / 913 (+1 todo) green on the
committed tree; five e2e chunks green; `git diff --quiet` on the two stores, `.planning/ROADMAP.md`
and `src/vendor/` silent; `CAT-04` untouched.
