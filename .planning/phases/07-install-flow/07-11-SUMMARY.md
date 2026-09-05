---
phase: 07-install-flow
plan: 11
subsystem: ui
tags: [DeviceDetails, header, write-lock, writeLock, WRITE_LOCK_REASON, snapshot-line, SNAPSHOT_DURABLE_LINE, SNAPSHOT_SESSION_LINE, REVOKE_EXPLANATION, Z-12, Z-13, Z-15, degrade-test, device-ui, deferred-item-8, SAFE-01, SAFE-04, DEGR-02]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-10-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 83), the tree at quick 73 / 775, sweep `3 13`, e2e 83 = 73 chromium + 10 webkit-phone at `--workers 3`, svelte-check 545; device-ui.spec.ts at 10; keep-on-device-line as the KEEP cell's one testid; the panel's DISCONNECT ZONA disabled while writing with no reason (item 14, handed here); a wrangler dev webServer may drop once mid-run"
  - "07-04-SUMMARY.md - session.writeLock and unpluggedWhileWriting; WRITE_LOCK_REASON (41), SNAPSHOT_DURABLE_LINE (108), SNAPSHOT_SESSION_LINE (114), REVOKE_EXPLANATION amended (143), all in session-copy.ts"
  - "07-06 / 07-07-SUMMARY.md - install.snapshot, install.snapshotDurable, the lock set and cleared around #ramLeg and #storeLeg; the store leg's D-12 proof waiting for the ZONA's heartbeat"
  - "07-08-SUMMARY.md - e2e/fake-serial.ts and e2e/fake-zona.ts: grant before load, beat(), delayAckMs, script(), seen() by class, pick(), forgotten() - the harness every measurement here ran on"
  - "07-UI-SPEC.md - The header device slot, and its disclosure (the four reasons and the table of changes), I9 and Z-12, Z-13, Z-15; 07-CONTEXT.md D-01, D-04 amended, D-08; 07-VALIDATION.md rows 07-11-01 and 07-11-02"
  - "06-10-SUMMARY.md and 06-13-SUMMARY.md - the disclosure's five states, four close paths, `opener`, the measured geometry (360 / 16px / 1px / 10px); the hydration marker every shipped-chrome test waits on; Phase 6 deferred item 8 (the pre-hydration key presses in first-experience.e2e.ts)"
provides:
  - "src/lib/ui/DeviceDetails.svelte - DISCONNECT ZONA and FORGET THIS ZONA each `disabled={session.writeLock}` (two occurrences, no leg read) with `aria-describedby` naming the reason line while locked; the reason line `{WRITE_LOCK_REASON}` under the pair (id `{uid}-write-lock`, testid write-lock-reason) rendered only under the lock; the snapshot line beneath the identity line, `install.snapshotDurable ? SNAPSHOT_DURABLE_LINE : SNAPSHOT_SESSION_LINE`, Body in --color-ink-quiet, rendered only while `install.snapshot !== undefined` (testid snapshot-line); REVOKE_EXPLANATION rendering the amended sentence; `.action:disabled` in --color-ink-dim with the hover brightening scoped to `:not(:disabled)`; testids details-disconnect and details-forget on the two controls; the third static specifier `$lib/device/install.svelte`; the header paragraph WHAT THE HEADER DOES UNDER A WRITE, AND WHAT IT DOES NOT"
  - "src/lib/ui/device-ui.spec.ts 10 -> 11: test 11 over DeviceDetails (two lock bindings, no leg read, the describedby pair and its id, WRITE_LOCK_REASON once, the two forms picked from the store and gated on a snapshot in hand, REVOKE_EXPLANATION by name, none of the three sentences retyped, the permitted specifier, the strip load-bearing), DeviceSlot (none of the fragments writing / WRITING / install) and SessionAnnouncer (one aria-live, nothing from $lib/device/install, under 40 lines stripped), then test 7's count re-run through liveRegionTotal() and still three"
  - "e2e/first-experience.e2e.ts - the degrade test EXTENDED with three appended assertions (put-back toHaveCount 0; keep-on-device disabled; keep-on-device-line containing the capability sentence), its shipped assertions byte-identical, the title unchanged, the suite total unchanged at 83; Phase 6 deferred item 8 fixed at both named sites and the third with the same mechanism (one-line data-ready waits); a header note recording both amendments"
  - "The four header observations on the served build, the RAM-legs-only negative on a served mutated build, the two Task 2 negatives (PUT BACK disabled instead of absent red on the appended toHaveCount; writing in the slot's label red on test 11), every restore hashed IDENTICAL"
affects:
  - "07-12 - the real-page install tests can name details-disconnect, details-forget, write-lock-reason and snapshot-line; the header lock is reachable only after an un-choose during a leg (deferred item 19: Back un-chooses mid-write, Escape does not), and the store leg holds the lock until the test's heartbeat"
  - "07-13 - the phase gate reads quick 73 / 776, sweep 3 13, e2e 83 (PREV_E2E unchanged: no title added); the panel's DISCONNECT ZONA stays protective-only by decision (item 17); items 17 to 19 appended"
  - ".planning/phases/07-install-flow/deferred-items.md - items 17, 18, 19 appended (never overwritten); .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 11/13, by hand"

tech-stack:
  added: []
  patterns:
    - "A lock is a flag the owner of the hazard sets and the surface reads, never a state the surface derives: the header binds both controls to session.writeLock and reads no leg, and the structural gate holds `install.leg` absent from the file, because a lock that discriminated by leg was observed releasing over the store leg on a served mutated build"
    - "A sentence that describes a stored fact renders only while the fact exists and picks its form from the store that owns it: the snapshot line is gated on install.snapshot and chooses between the durable and session-only forms on install.snapshotDurable, so snapshotting shows no line and a serial-less module reads the honest form"
    - "A disabled control's reason is bound conditionally: aria-describedby names the reason line's id only while the line is rendered, so a screen reader is never pointed at an id that is not on the page"
    - "A degrade test is extended by inserting before its console check, never after it: the collected console errors must cover the new assertions too, and every shipped assertion stays byte-identical"
    - "A served-build measurement that needs a state the real page forbids reaches it the way a visitor could: the drawer cannot open while the panel is chosen, so the walk clicks, un-chooses with history.back() inside the leg and opens the drawer - all inside one in-page script, so the RAM leg's 430 ms window is not spent on round trips"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-11-SUMMARY.md"
  modified:
    - "src/lib/ui/DeviceDetails.svelte"
    - "src/lib/ui/device-ui.spec.ts"
    - "e2e/first-experience.e2e.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "THE HEADER'S CONTRIBUTION TO A WRITE IS A LOCK, NOT A LABEL (Z-15): DISCONNECT ZONA and FORGET THIS ZONA carry `disabled={session.writeLock}` - the session's flag, set and cleared by the install store around every leg - with WRITE_LOCK_REASON beneath the pair as their aria-describedby target; the component reads no leg and test 11 holds `install.leg` absent, because the RAM-legs-only mutation released both controls over the store leg at +9 ms on a served build while the reason line was still rendered"
  - "THE SNAPSHOT LINE RENDERS ONLY WITH A SNAPSHOT IN HAND and picks its form from install.snapshotDurable: on the served build the drawer opened at +320 ms with no line and the durable form arrived at +355 (a 35 ms snapshotting gap), while a module with no serial showed no line for 1.3 s (three SERIALNUMBER/FETCH attempts) and then the session-only form, with localStorage empty"
  - "THE PANEL'S DISCONNECT ZONA STAYS PROTECTIVE-ONLY (deferred item 14 decided as item 17): I3 rule 4 forbids region 3 changing during a write beyond aria-busy and a reason line would move its height mid-write; the region is already aria-busy for the leg; DEGR-02's letter is about a permanent capability, not a transient lock; TryOnDevice.svelte is unchanged"
  - "The degrade test's three assertions are inserted before its console check rather than after the last line, so the collected console errors cover them; every shipped assertion is byte-identical (the diff is pure insertion) and the title is unchanged, so `--list` still reads 83"
  - "Phase 6 deferred item 8 is fixed at three sites, not two: the item named the still-configuration test and the wrap on /c/aurora/, and the row-steps test's first ArrowLeft has the same mechanism (every assertion before it is satisfied by the prerendered document); the same one-line data-ready wait went in at all three (Rule 1, same bug, same file)"
  - "The lock is met on the real page only after an un-choose during a leg: panelOwnsProse is page.state.chosen, the drawer never renders while the panel is open, and Coverflow's Back path un-chooses mid-write where Escape refuses (Z-10 names Escape only) - recorded as deferred item 19 for the spec's owner, and used as the measurement path here (history.back() at +17 ms into the RAM leg, +6 ms into the store leg)"
  - "Two new testids on the header's controls (details-disconnect, details-forget) rather than reusing the panel's `disconnect`: the two DISCONNECT ZONA buttons are on the page at different times and a test naming one must not find the other; session.e2e.ts reaches both by role and name and is unaffected"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-04, DEGR-02]

# Metrics
duration: 27min
completed: 2026-09-05
---

# Phase 7 Plan 11: The header lock, the snapshot line, and the degrade test extended Summary

**The header cannot be used to break a write, and it says where the way back is kept. `DISCONNECT ZONA` and `FORGET THIS ZONA` are a real `disabled` while `session.writeLock` is on - measured on the served build at `/c/aurora/` with the disclosure open mid-leg: locked at +18 ms into a RAM leg under `delayAckMs` 200 on CONFIG and released at +426 ms with both enabled and the reason line gone; locked at +7 ms into a store leg under `delayAckMs` 800 on PAGESTORE, held through four real Tab presses that landed on the band and the nameplate and never on either control, and released at +854 ms on the fourth heartbeat with `KEPT` in the panel; the reason `Not while HANGAR is writing to your ZONA.` beneath the pair as the `aria-describedby` target of both, the labels in `--color-ink-dim`, and the disclosure 360 x 16px / 1px / 10px at every entry of both logs. The S4 block gained the snapshot line beneath the identity line: the durable form 35 ms after the drawer opened on a module that answered its serial (the drawer opened at +320 with no line - the `snapshotting` gap - and the line arrived at +355), the session-only form after 1.3 s on a module with no serial (three `SERIALNUMBER/FETCH` attempts, `localStorage` empty), Body in `--color-ink-quiet` (0.55) against the identity line's ink (0.72). `FORGET THIS ZONA` renders the amended explanation, and after a forget (`forgotten` true, `hangar.snapshot.v1` still in `localStorage`) and a reconnect through the picker the line was back in the durable form and `PUT BACK` enabled with the after-keep line - the copy stayed. The negative check locked the RAM legs only and the store leg showed both controls `enabled` at +9 ms with the reason line still rendered and both taking focus; restored, hashed IDENTICAL. `device-ui.spec.ts` 10 -> **11**; the degrade test extended with three appended assertions and its shipped ones byte-identical (`PUT BACK` disabled instead of absent went red on the appended `toHaveCount(0)`: Expected 0, Received 1; `writing` in the slot's label went red on test 11); Phase 6's deferred item 8 fixed at three sites with the one-line `data-ready` wait. Quick **73 / 776** (+1), sweep `3 13`, e2e **83** = 73 chromium + 10 webkit-phone at `--workers 3` first time with `first-experience.e2e.ts` 11 of them, `--list` 83 (`PREV_E2E` unchanged, no title added), svelte-check 545 / 0. `DeviceSlot.svelte` and `SessionAnnouncer.svelte` absent from every diff. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried verbatim from 07-10, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. `PREV_E2E` is **unchanged at 83**: this plan adds no e2e title (the degrade test is extended under its shipped title), and `npx playwright test --list` read `Total: 83 tests in 12 files` with `first-experience` at 11.

| Name         | Value                      | Note                                                                                                                                              |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **73** (+ 4)                                                                                                 |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6, 07-06 + 8, 07-07 + 10, 07-08 + 0, 07-09 + 2, 07-10 + 1 (775); this plan adds **1** (`device-ui.spec.ts`). Tree: **776** (+ 52) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                                  |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**                                                                                                 |
| `PREV_E2E`   | **83 (measured by 07-08)** | Unchanged; observed **83** here (73 chromium + 10 webkit-phone) and `--list` 83; rolls at 07-12 and 07-13                                          |

`BASE_CHECK` (provenance only): **545 files, 0 errors, 0 warnings** (unchanged: one component amended, none added).

### Observed totals: previous SUMMARY plus this plan's delta

07-10 left the tree at **73 / 775**, sweep `3 13`, e2e 83, svelte-check 545. This plan's delta is **+0 files / +1 test / +0 e2e titles / +0 checked files**.

```
npm run check 2>&1 | grep -Ei "error|warning"                                  # after Task 1, and again after Task 2
  1788624022197 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  1788624883783 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)

npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts src/lib/device/session-copy.spec.ts   # after Task 1
  Test Files  7 passed (7)      Tests  52 passed (52)

npx vitest run --project server src/lib/ui/device-ui.spec.ts --reporter verbose                              # after Task 2
  ✓ ... the header locks under a write, says where the copy is, and the announcer is untouched
  Tests  11 passed (11)

npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 776
  check-counts: observed 73 files, 776 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npx playwright test --list
  Total: 83 tests in 12 files                                                  (first-experience: 11)

npx playwright test e2e/first-experience.e2e.ts --project chromium
  11 passed (32.7s)

npx playwright test --workers 3 --reporter list
  83 passed (1.4m)                        [chromium] 73   [webkit-phone] 10   (first run; no harness drop, no rerun)
```

`format-parity.spec.ts` did not flake; nothing was re-run. `test-results/` removed by hand after each Playwright run.

### Per-file counts after this plan

| File                                | Before | After  | Plan said |
| ----------------------------------- | ------ | ------ | --------- |
| `src/lib/ui/device-ui.spec.ts`      | 10     | **11** | 11        |
| `src/lib/config-shape.spec.ts`      | 14     | **14** | -         |
| `e2e/first-experience.e2e.ts` titles | 11    | **11** | unchanged |

## Task 1 - the lock, the snapshot line, and the explanation that says the copy stays (commit `118c592`)

`src/lib/ui/DeviceDetails.svelte`, 393 -> **484 lines** (+102 / -10). The header gained two paragraphs: WHAT THE HEADER DOES UNDER A WRITE, AND WHAT IT DOES NOT - the four reasons the slot never reads a busy word (Phase 6 sizes the slot's two 14px line boxes on four label strings; the install is a property of the chosen configuration and the panel is on screen whenever a write is possible; Y-11 forbids one block in two mounts; a RAM write settles in two frames) and the one hazard the lock closes (the two controls that can produce `partial` under a RAM leg and `unconfirmed` under a store with the visitor's own hand); and THE SNAPSHOT LINE. The "two static specifiers" sentence now says three and names the install store's own three.

The S4 block, in order: the identity line; the multi-module line; **the snapshot line** under `{#if install.snapshot !== undefined}`; `SAFE_PROMISE`; `DISCONNECT ZONA` with `disabled={session.writeLock}` and `aria-describedby={session.writeLock ? lockId : undefined}`; the revoke group with `{REVOKE_EXPLANATION}` and `FORGET THIS ZONA` bound the same way; **the reason line** under `{#if session.writeLock}` with `id={lockId}`. `lockId` is `${$props.id()}-write-lock`, unique per mount like the slot's describedby twin (the rune has to be a declaration's whole initializer - the first `npm run check` said so, and the split is one line). Styles: `.quiet { color: var(--color-ink-quiet) }` on the two new Body lines; `.action:hover` scoped to `:not(:disabled)`; `.action:disabled { color: var(--color-ink-dim); cursor: not-allowed }`. Every string is session-copy's; the amended `REVOKE_EXPLANATION` needed no edit here because 07-04 amended the constant by name.

`git diff --stat` at the Task 1 commit (read-only, quoted): `src/lib/ui/DeviceDetails.svelte | 112 ++++++++++++++++++++++++++++++++++++----` and nothing else - `DeviceSlot.svelte` and `SessionAnnouncer.svelte` absent; both are byte-identical to `23e9e36` (`git diff --quiet` exit 0 on each at the end of the plan).

### The harness

A clean `npm run build` (postbuild stamped `23e9e36`), served by a scratch `node:http` static server over `build/` on **127.0.0.1:4174** (port 4173 never used by the probe; the server killed by PID before the wrangler runs), driven by a scratch Playwright spec `e2e/measure-0711.probe.ts` with its own config `pw-0711.config.ts` (a `**/*.probe.ts` match the shipped config never collects; both untracked inside the repository so `fake-zona.ts` resolves `$lib/protocol` through the generated tsconfig, copied to the scratchpad and deleted before any commit - `git status` never showed them staged). The module: `e2e/fake-serial.ts` granted before load, `e2e/fake-zona.ts` over the real responder with a serial (`0x9abcdef1…`) for the durable run and `serial: undefined` for the session-only one. Connection through the header slot's own click in S2, heartbeats pushed until `data-slot="S4"`.

**How the drawer was open mid-leg.** `panelOwnsProse` is `page.state.chosen === true` on this route and the drawer never renders while it is true, so a write started from the panel cannot be watched from the disclosure until the panel is un-chosen. Escape is refused while writing (Z-10), but the Back path is not: the in-page walk clicked the writing control, waited for `aria-busy="true"` on the primary, called `history.back()`, waited for `chosen-panel` to leave, clicked the slot and polled - a `MutationObserver` on the body logged every change of the two controls' `disabled`, the reason line, the `aria-describedby` value, the computed colours and the drawer's width / padding / border / radius, all inside one `page.evaluate` so the RAM leg's window was not spent on round trips. Console errors across both probes: **none**.

### The four observations

**1. The RAM leg** - `delayAckMs` 200 on CONFIG (strictly under `executeMs` 250: both acknowledgements landed on attempt 1, the wire read CONFIG/EXECUTE **2**, the panel read `PLAYING NOW` when re-chosen):

```
{"t":1,   "why":"mutation",    "panel":true,  "busy":"true", "drawer":false}
{"t":17,  "why":"mutation",    "panel":false, "busy":null,   "drawer":false}                       history.back() un-chose the panel
{"t":18,  "why":"mutation",    "panel":false, "drawer":true, "width":360, "padding":"16px 16px 16px 16px", "border":"1px", "radius":"10px",
          "disconnect":"disabled", "forget":"disabled", "describedby":"s2-write-lock", "reason":"Not while HANGAR is writing to your ZONA.",
          "reasonId":"s2-write-lock", "disconnectColor":"rgba(214, 255, 78, 0.5)", "reasonColor":"rgba(214, 255, 78, 0.55)"}
{"t":426, "why":"mutation",    "drawer":true, "width":360, "padding":"16px 16px 16px 16px", "border":"1px", "radius":"10px",
          "disconnect":"enabled",  "forget":"enabled",  "describedby":null, "reason":null}
{"t":497, "why":"after",       "disconnect":"enabled",  "forget":"enabled",  "disconnectColor":"rgba(214, 255, 78, 0.525)"}   the 160 ms colour transition toward quiet
```

Focus probe while locked: `disconnect.focus()` and `forget.focus()` both left `document.activeElement` elsewhere (`disconnectTookFocus: false`, `forgetTookFocus: false`), both matched `:disabled`, the reason line's id equalled both controls' `aria-describedby`, and the drawer stayed open. Neither control is a tab stop under the lock; after the leg both are enabled and the line is gone. Width 360 and padding 16px at every entry of the log; the colours are the tokens (`--color-ink-dim` 0.5 on the disabled labels, `--color-ink-quiet` 0.55 on the reason line).

**2. The store leg** - `delayAckMs` 800 on PAGESTORE after the confirmation's commit (`keep-confirm-yes`), the D-12 proof then waiting for a heartbeat the probe controls:

```
{"t":2,   "busy":"true", "panel":true}                                     KEEPING…
{"t":6,   "panel":false}                                                   history.back()
{"t":7,   "drawer":true, "width":360, "padding":"16px 16px 16px 16px", "disconnect":"disabled", "forget":"disabled",
          "describedby":"s2-write-lock", "reason":"Not while HANGAR is writing to your ZONA."}
```

Four real `Tab` presses from the focused slot while locked landed on `div#coverflow.band`, `button#nameplate-prev.arrow`, `button#nameplate-name.name`, `button#nameplate-next.arrow` - neither `details-disconnect` nor `details-forget` - with the drawer still open, the reason still rendered and both controls still `disabled` after the fourth. Heartbeats until the lock released: **4**; the log's last entries at **+854** and +864 read both `enabled`, `describedby` null, reason null, width 360, padding 16px. Re-chosen: `KEPT`; the wire PAGESTORE/EXECUTE **1**, CONFIG/EXECUTE 2. **The lock covers the store leg explicitly.**

**3. The two forms, and no line during snapshotting** - the recorder clicked the slot the instant S4 arrived:

| Module | S4 | drawer open, no line | line | form |
| ------ | -- | -------------------- | ---- | ---- |
| serial answered | +319 | **+320** | **+355** | `A copy of your ZONA’s own Setup and Timer is saved in this browser, so it can be put back even in a new tab.` |
| no serial | +322 | **+323** | **+1610** | `A copy of your ZONA’s own Setup and Timer is held until this tab closes, so it can be put back while you are here.` |

The 35 ms gap is `snapshotting` (fetch-serial, fetch-setup, fetch-timer through the exposeFunction round trip); the 1.3 s gap is three `SERIALNUMBER/FETCH` attempts timing out (`serialFetches: 3`) before `fetchBoth`. The session-only page's `localStorage` keys: `[]`. The line's colour `rgba(214, 255, 78, 0.55)` against the identity line's `0.72`. The drawer also contained the amended `REVOKE_EXPLANATION`.

**4. After FORGET THIS ZONA and a reconnect** - `details-forget` clicked in the open drawer: the slot read S7, `window.__hangarSerial.forgotten(0)` **true**, and `localStorage` keys before and after were both `["hangar.snapshot.v1"]`. `pick(0)` scripted, the slot clicked (S7 connects through the picker: `requests` **1**, `openCount(0)` **2**), heartbeats to S4, the drawer opened: **the snapshot line back in the durable form**. Panel chosen: `put-back` **enabled**, its line `Restores the Setup and Timer that were on your ZONA when you connected, and stores them so they stay.` (the after-keep form, since this page kept). `SERIALNUMBER/FETCH` 2, `CONFIG/FETCH` 6 (two connects and the keep's re-fetch). The copy stayed.

### The negative check: the lock on the RAM legs only

Both bindings changed to `disabled={session.writeLock && install.leg === "ram"}` (2 occurrences), built and served. The RAM leg still locked (`+8 disconnect: disabled, forget: disabled`). The store leg at **+9 ms**: `disconnect: "enabled", forget: "enabled"`, the reason line still rendered with `describedby: "s2-write-lock"` pointing at it - a reason with no lock - and the focus probe read `disconnectTookFocus: true, forgetTookFocus: true`; the probe went red at the store-leg assertion (`expect(lockedDuringTabs.disconnect).toBe(true)`: Received null, the drawer having closed when focus left the now-enabled control). Restored by reversing the edit: `sha256 04e7d9f3f88104f5…` before and after, `cmp` IDENTICAL, `install.leg` 0 occurrences; rebuilt.

## Task 2 - the eleventh gate, and the degrade test extended (commit `1dca64e`)

`src/lib/ui/device-ui.spec.ts`, 851 -> **998 lines**, 10 -> **11**. Test 11, *"the header locks under a write, says where the copy is, and the announcer is untouched"*, comment-stripped throughout: `DeviceDetails.svelte` carries exactly two `disabled={session.writeLock}`, zero `install.leg` (fragment needle - the lock is the session's flag and covers every leg), two `aria-describedby={session.writeLock ? lockId : undefined}` and `id={lockId}`, one `{WRITE_LOCK_REASON}`, the form selector `install.snapshotDurable ? SNAPSHOT_DURABLE_LINE : SNAPSHOT_SESSION_LINE`, the gate `install.snapshot !== undefined`, `{REVOKE_EXPLANATION}`, none of `Not while HANGAR` / `A copy of your` / `Removes this site`, the specifier `"$lib/device/install.svelte"`, and the raw file naming `writeLock` more often than the code does (the strip is load-bearing); `DeviceSlot.svelte` contains none of `writing`, `WRITING`, `install` (fragment-assembled) with its code over 2000 characters; `SessionAnnouncer.svelte` has exactly one `aria-live`, zero `$lib/device/install`, and its stripped source is under 40 lines (measured 14); then `liveRegionTotal()` - test 7's walk over `src/lib/ui` and `src/routes` as a function, test 7 itself byte-identical - reads **3**. The file header gained the eleventh's sentence.

`e2e/first-experience.e2e.ts`, 631 -> **665 lines**, 11 titles -> **11**. The degrade test's diff, pure insertion, the shipped assertions byte-identical:

```diff
@@ -370,6 +391,15 @@ test.describe("the front door on a browser that cannot install", () => {
     await expect(keep).toBeVisible();
     await expect(keep).toBeDisabled();

+    // Phase 7 (Z-12): PUT BACK restores a specific module's own configuration, and on a
+    // browser that has never seen a module there is nothing for it to name. Absent, not disabled.
+    await expect(page.getByTestId("put-back")).toHaveCount(0);
+    // DEGR-02 on the third control: the reason is the capability sentence, adjacent.
+    await expect(page.getByTestId("keep-on-device")).toBeDisabled();
+    await expect(page.getByTestId("keep-on-device-line")).toContainText(
+      "This browser cannot write to a ZONA.",
+    );
+
     expect(consoleErrors).toEqual([]);
   });
 });
```

The three are inserted before the console check rather than after it, so the collected console errors cover them; Prettier wrapped the third call. The other three hunks are Phase 6's deferred item 8 - `await expect(band).toHaveAttribute("data-ready", "true")` before the first key press in the still-configuration test (the item's `:156` site), the wrap on `/c/aurora/` (its `:535` site) and the row-steps test (the same mechanism, unnamed by the item) - and a header note recording both amendments. The test ran green on chromium alone (11 passed, 32.7 s) and inside the full suite (83, the file's 11 among the 73 chromium).

### The two negative checks, observed red and restored byte-identical

**`PUT BACK` disabled instead of absent.** `PutBack.svelte`'s `{#if state !== "absent"}` became `{#if state === state}` and its `disabled` became `state !== "enabled" || writing` (one occurrence each), and the degrade test ran through the shipped config (`npx playwright test e2e/first-experience.e2e.ts --project chromium -g "no Web Serial"`, the webServer rebuilding): **1 failed** at line 396, `expect(locator).toHaveCount(expected) failed - Expected: 0, Received: 1` - the appended assertion, red. Restored from the copy taken before the edit: `sha256 1f98e883ab72d1a4…` equal, `git diff --quiet -- src/lib/ui/PutBack.svelte` exit 0.

**`writing` in the slot's label.** `DeviceSlot.svelte`'s `return NO_ZONA_LABEL; // S0a, S0b, S5` became `return "writing";`. Test 11 (1 failed, 10 passed): `AssertionError: DeviceSlot carries "writing" - the slot shows no install state and never reads a busy word: expected 1 to be +0`. Restored from the copy: `sha256 242937961ca07813…` equal, `git diff --quiet` exit 0.

## Files created and modified

- `src/lib/ui/DeviceDetails.svelte` - modified (`118c592`); 484 lines
- `src/lib/ui/device-ui.spec.ts` - modified (`1dca64e`); 10 -> 11; 998 lines
- `e2e/first-experience.e2e.ts` - modified (`1dca64e`); 665 lines; 11 titles
- `.planning/phases/07-install-flow/07-11-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - items 17, 18, 19 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 11/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug] Phase 6 deferred item 8 fixed at three sites, the third unnamed by the item**
- **Found during:** Task 2, reading the item as the brief directed (fix it if the fix is a wait on the hydration / ready marker - it is).
- **Issue:** three tests in `first-experience.e2e.ts` press a key on the band after assertions a prerendered document already satisfies; a press before the band's `onkeydown` is attached is lost (observed twice in Phase 6's full runs). The item names two sites; the row-steps test's first `ArrowLeft` has the identical mechanism.
- **Fix:** `await expect(band).toHaveAttribute("data-ready", "true")` before the first press at all three, the assertions around them unchanged; a header note.
- **Files modified:** `e2e/first-experience.e2e.ts`. **Commit:** `1dca64e`.

**2. [Rule 3 - Blocking] `$props.id()` must be a declaration's whole initializer**
- **Found during:** Task 1, the first `npm run check` (`props_id_invalid_placement`, 1 error).
- **Fix:** `const uid = $props.id(); const lockId = \`${uid}-write-lock\`;` - the form DeviceSlot already uses.
- **Files modified:** `src/lib/ui/DeviceDetails.svelte`. **Commit:** `118c592`.

**3. [Rule 3 - Blocking] the measurement harness ran from inside the repository**
- **Found during:** Task 1's measurements (as 07-09 and 07-10 recorded): a spec outside the repository cannot resolve `@playwright/test` or the tsconfig paths `fake-zona.ts` needs for `$lib/protocol`.
- **Fix:** `e2e/measure-0711.probe.ts` and `pw-0711.config.ts` as untracked files (a suffix the shipped config never collects), run, copied to the scratchpad, deleted before any commit; `build/` served by a scratch `node:http` server on 4174, killed by PID before the wrangler runs.
- **Files modified:** none kept.

### Departures recorded, not deviations from the plan

1. **The disclosure was opened mid-leg by un-choosing the panel with `history.back()`**, because on the real page the drawer cannot render while the panel is chosen (`panelOwnsProse`), and every writing control is in the panel. That is also how a visitor reaches the lock; Escape is refused while writing but Back is not (deferred item 19, for the spec's owner). The plan's "on `/c/aurora/` with the disclosure open" is satisfied in the only way the page allows.
2. **The degrade test's three assertions are inserted before its console check**, not after the test's last line, so the console errors collected over them are asserted too; every shipped assertion is byte-identical and the diff is pure insertion.
3. **Two new testids** (`details-disconnect`, `details-forget`) on the header's controls, so a test can tell them from the panel's `disconnect`; `session.e2e.ts` reaches them by role and name and is unaffected (83 green).
4. **The "tab stop" proof was taken two ways**: programmatically on the RAM leg (a `focus()` call on each locked control left `activeElement` elsewhere, inside the 430 ms window) and with four real `Tab` presses on the store leg, whose window the probe controlled through the heartbeat.
5. **Measurement 3's session-only line took 1.3 s to appear, not the 300 ms of one `fetchMs`**: the queue retries the unanswered `SERIALNUMBER/FETCH` three times with backoff (`serialFetches: 3`), which is the store's shipped behaviour (07-06) and made the "no line during snapshotting" reading unambiguous.
6. **Item 14 is decided rather than implemented**: the panel's `DISCONNECT ZONA` keeps its protective-only `disabled` (item 17 records the three reasons); `TryOnDevice.svelte` is unchanged.

## Known stubs

None. The lock reads a flag the install store sets and clears on every leg (observed engaging and releasing on both); the snapshot line reads the store's `snapshot` and `snapshotDurable` (observed in both forms and absent during `snapshotting`); the forget explanation is the amended constant. No component under `src/lib/ui/` gained a hardcoded empty value or placeholder.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-04, DEGR-02]`** - contributed, not completed; 07-13 closes them with the hardware rows. SAFE-01: the two header controls that could pull the port out from under a write with the visitor's own hand are locked on every leg, the store leg observed explicitly, with the reason inline. SAFE-04: the header says where the copy is kept in both forms and that forgetting the permission does not delete it; observed - the `hangar.snapshot.v1` key survived `FORGET THIS ZONA` and `PUT BACK` was enabled after the reconnect. DEGR-02: the third control's shape is asserted by the shipped degrade test - `PUT BACK` absent by decision (Z-12), `KEEP ON DEVICE` present, disabled and explained by the capability sentence in its own cell. `REQUIREMENTS.md` is not edited here, as no Phase 7 plan before 07-13 edits it.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 17** - item 14 decided: the panel's `DISCONNECT ZONA` stays protective-only, with no inline reason (I3 rule 4, the busy region, DEGR-02's scope). Closed.
- **Item 18** - Phase 6 item 8 closed: the three pre-hydration key presses now wait on `data-ready`. Closed.
- **Item 19** - the header lock is met only after an un-choose during a leg, and Back un-chooses mid-write where Escape does not (Z-10 names Escape only). Owner: the spec's owner, or 07-12 / 07-13.

Items 1 to 16 are unchanged.

## Next plan readiness

07-12 (the install flow on the real page in two engines) starts from: quick **73 / 776**, sweep `3 13`, e2e **83** (73 + 10, observed first time), svelte-check 545 / 0, `device-ui.spec.ts` at **11**, `PREV_E2E` 83. The header's controls carry `details-disconnect`, `details-forget`, `write-lock-reason` and `snapshot-line`; the lock is reachable on the real page only after an un-choose during a leg (item 19), and a store leg holds it until the test pushes the heartbeat. `first-experience.e2e.ts` is green with its degrade test extended and its three pre-hydration presses fixed. `build/` on disk is the restored tree's (the full-suite run rebuilt it). The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, looked for or written to; every byte a page wrote in this plan landed in the shim.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T16:22Z.

- FOUND: `src/lib/ui/DeviceDetails.svelte` (484 lines; `session.writeLock` 6 occurrences, `WRITE_LOCK_REASON` 3, `snapshotDurable` 1)
- FOUND: `src/lib/ui/device-ui.spec.ts` (998 lines; 11 passed), `e2e/first-experience.e2e.ts` (665 lines; `"put-back"` 1; 11 titles)
- FOUND: `.planning/phases/07-install-flow/07-11-SUMMARY.md`, `.planning/phases/07-install-flow/deferred-items.md` (items 17 to 19 appended)
- FOUND: commits `118c592` (task 1), `1dca64e` (task 2)
- PASS: `DeviceSlot.svelte`, `SessionAnnouncer.svelte`, `PutBack.svelte` and `TryOnDevice.svelte` byte-identical to HEAD after the three mutations (`git diff --quiet` exit 0); every restore hashed equal to its pre-mutation copy (`04e7d9f3…`, `242937961c…`, `1f98e883…`)
- PASS: quick 73 / 776 and sweep `3 13` through check-counts; svelte-check 545 / 0 / 0; `npm run lint` exit 0; `first-experience.e2e.ts` 11 on chromium; full e2e 83 (73 chromium + 10 webkit-phone) at `--workers 3` first time; `--list` 83
- PASS: no `*.probe.ts`, no `pw-0711.config.ts`, no `test-results/` in the tree; no listener on 4173 or 4174; the scratch server killed by PID (259600); `build/` is the restored tree's, rebuilt by the full-suite run
- Attribution lines in the two task commits and in every file this plan touched: 0; engine names in this SUMMARY: 0
