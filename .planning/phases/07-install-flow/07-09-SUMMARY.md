---
phase: 07-install-flow
plan: 09
subsystem: ui
tags: [allow-list-mutations, PutBack, KeepConfirm, InstallState, sizing-twins, 72px, role-group, FailureBlock, device-ui, SAFE-02, SAFE-05, DEGR-02]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-08-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 83), the tree at quick 73 / 772, sweep `3 13`, e2e 83, svelte-check 542; PERMITTED_SPECIFIERS at eight with the walk reading 8 of 8; the /dev/install/ probe and its testids (the PUT BACK click is install-put-back-click, deferred item 10); install.start() in the layout"
  - "07-07-SUMMARY.md - the store's public surface: phase, leg, action, steps, lastSteps, keepReason(), putBackState(), openConfirm / dismissConfirm, confirmOpen, slow, keptThisSession, landed / failed, name; RESTORED during a put-back's store leg is `action === 'put-back' && leg === 'store'`"
  - "07-03-SUMMARY.md - install-copy.ts: every string, the seven failure builders, confirmRig returning undefined for none, moduleList; the three caps"
  - "07-UI-SPEC.md §§ The control hierarchy, Region 6, The inline flash confirmation, PUT BACK, Focus management, Accessibility Contract, the Color ruling (Z-01), I1 to I13; 07-CONTEXT.md D-02, D-05, D-08, D-15; 07-VALIDATION.md rows 07-09-01 to 03"
  - "06-08-SUMMARY.md and 06-10-SUMMARY.md - FailureBlock's { title?, detail, steps } and its no-control rule; the temporary-probe-mount convention (hash before, git show HEAD to restore, git diff --quiet after); 06-05-SUMMARY.md - test 13's walk and its non-vacuity guards"
  - "src/lib/ui/TryOnDevice.svelte - the honesty slot's one-cell-grid twin mechanism, copied declaration for declaration; DeviceDetails.svelte - the tabindex=-1 container and the window-level Escape"
provides:
  - "src/lib/ui/PutBack.svelte - the secondary restore control (data-testid put-back), not rendered on `absent`, disabled on `needs-zona` and during any write, PUTTING BACK… with aria-busy through both legs of a put-back, aria-describedby to a one-cell grid (put-back-line) holding PUT_BACK_LINE, PUT_BACK_LINE_AFTER_KEEP and PUT_BACK_NEEDS_ZONA at grid-area 1 / 1 with a 72px floor, the inactive two visibility: hidden and aria-hidden; the busy swap instant; a 160ms opacity fade on appearing; two static specifiers"
  - "src/lib/ui/KeepConfirm.svelte - the inline confirmation (keep-confirm, keep-confirm-yes, keep-confirm-no): role=group, tabindex=-1, aria-labelledby the PERMANENT caption, aria-describedby two sentences or three on a rig (confirmRig over identity.otherModules by type, `module` for an unnamed one, ids from $props.id()); focus to the container on mount; Escape inside calls onclose; focus leaving does not close; the affirmative bordered (secondary), NOT NOW quiet; no dialog role, no aria-modal, no inert, no aria-label; no colour on the block; four static specifiers"
  - "src/lib/ui/InstallState.svelte - region 3's twelve blocks (install-state): five caption-over-body blocks and seven FailureBlocks from install-copy's builders; `writing` holds the last non-writing phase in a $state written from an $effect and renders it under aria-busy=true, except a put-back's store leg, which shows RESTORED's caption and first line; RESTORED_STORED_LINE only in `restored` when leg === store; STILL_WRITING_LINE beneath any block while install.slow; block swaps remount under {#key} for a 160ms opacity fade; renders no control (DISCONNECT ZONA stays the panel's); props name and label"
  - "src/lib/ui/device-ui.spec.ts 7 -> 9: test 8 (the three leaves: every specifier a permitted path, `svelte` or a sibling .svelte; every min-block-size on a control's class is 44px; the three PUT BACK lines rendered as twins with visibility: hidden and the 72px floor; role=group / tabindex=-1 / aria-labelledby / aria-describedby present and role=dialog / aria-modal / inert / aria-label= absent by fragment-assembled needles, aria-label= absent across all ten components; no setInterval); test 9 (the three tells of a retyped install sentence - `your ZONA`, `Setup and Timer`, `power cycle` - in none of the three, each importing from install-copy; the tells proven present in install-copy.ts first); PERMITTED_SPECIFIERS widened to the chunk guard's eight"
  - "Three allow-list mutations observed red on config-shape.spec.ts test 13 with the file and specifier named, the third also red on install-copy.spec.ts test 1; the walk still reads 8 of 8"
affects:
  - "07-10 mounts the three leaves in TryOnDevice / ChosenPanel: renders KeepConfirm under {#if install.confirmOpen} with onclose = dismissConfirm + focus back to the row's KEEP ON DEVICE, decides the block's fade OUT (deferred item 11), renders DISCONNECT ZONA after InstallState in `ready`, gives region 3 tabindex=-1 for the commit's focus move, and should re-measure quick 73 / 774 on a quiet machine (deferred item 12)"
  - "07-11 reads device-ui.spec.ts at 9 and takes it to 10; the aria-label= scan now covers the ten listed components, so a header change must keep to visible labels"
  - "07-12's rig test pushes a ZONA heartbeat after the rig's (deferred item 13)"
  - ".planning/phases/07-install-flow/deferred-items.md - items 11, 12 and 13 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 9/13, by hand"

tech-stack:
  added: []
  patterns:
    - "A reserved cell sizes on the tallest of ALL its candidate strings at the panel's actual width: every string rendered at grid-area 1 / 1, the inactive ones visibility: hidden and aria-hidden, a floor derived at the widest column - so the cell is 72px at 372px and 96px at 280px in every state, and the control beneath it never moves (the honesty slot's mechanism, now on the install column)"
    - "A busy label with no transition by construction: the only transition on the control is declared on the ENABLED control (`.control:not(:disabled)`), so the disable that arrives with the busy label is instant and the label swap has nothing to animate"
    - "A confirmation is a group with a programmatic focus target, not a dialog: the container takes focus so the naming sentence is read first and no key press commits without a Tab; focus leaving does not close a pending decision; Escape is handled at the window and acts only while focus is inside"
    - "A structural floor rule that reads every declaration, not the first: `min-block-size` values on a control's class are collected and each must be 44px, so a second declaration that lowers the floor is red where a presence check stayed green"
    - "A region that holds its previous block through a 40 ms write: the last non-writing phase in a local written from an effect on the phase, rendered under aria-busy, with the one honest exception (a put-back's store leg, both RAM acknowledgements in) named beside it"

key-files:
  created:
    - "src/lib/ui/PutBack.svelte"
    - "src/lib/ui/KeepConfirm.svelte"
    - "src/lib/ui/InstallState.svelte"
    - ".planning/phases/07-install-flow/07-09-SUMMARY.md"
  modified:
    - "src/lib/ui/device-ui.spec.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "PutBack imports the install store and install-copy only, not the session: putBackState() already folds the session's phase, and a leaf that reads one store cannot disagree with itself; the plan's 'reads install and session' is satisfied through the store"
  - "InstallState renders no control: DISCONNECT ZONA in the `ready` block is Phase 4's, unchanged, and the panel renders it after this component - a state block is not a tab stop, which is FailureBlock's rule; this is what keeps test 8's floor rule non-vacuous (two leaves with a button, one without)"
  - "KeepConfirm fades IN with CSS and its leaving is the panel's: a leaf unmounted by a parent's {#if} cannot fade itself out in CSS alone, a Svelte transition directive would be a JS-orchestrated leave with a reduced-motion read the leaf has no business making, and whether the leave should fade at all is a focus question 07-10 owns (deferred item 11)"
  - "Escape is handled at the window and acts only while focus is inside the block, as DeviceDetails does, so the group carries no key handler of its own; Escape with focus elsewhere leaves the pending decision where it is (observed)"
  - "The twin-drop negative was observed at 280px, where the tallest twin wraps to four lines: at the 372px column the 72px floor masks a dropped twin (72 in every state either way), which is exactly why the mechanism sizes on the tallest string at the panel's actual width and not only at the width the floor was derived at"
  - "The 44px rule in test 8 requires EVERY min-block-size on a control's class to be 44px: the plan's `40px on NOT NOW` mutation stayed green in its additive form under a presence-only check (the 44px declaration was still there), and a rule that a later declaration can silently override is not a floor"
  - "The quick suite's one failure - lua-entries.spec.ts test 6 at 5333 then 6143 ms against Vitest's 5000 ms default, Phase 8's file, passing alone in 1.68 s - is recorded as observed and deferred (item 12), not rerun a third time and not fixed here: it is outside this plan's files and the one permitted rerun was used"

requirements-completed: []
requirements-contributed: [SAFE-02, SAFE-05, DEGR-02]

# Metrics
duration: 33min
completed: 2026-09-05
---

# Phase 7 Plan 09: The allow-list mutations observed, then PutBack, KeepConfirm and InstallState Summary

**The chunk guard's widening is now a gate rather than a comment, and the install flow has its three leaves. Three mutations were planted and each turned `config-shape.spec.ts` test 13 red with the offender named: `$lib/transport` in a component under `src/lib/ui/` (the direct marker), `$lib/transport/sequence` inside `install.svelte.ts` and `$lib/protocol` inside `install-copy.ts` (both ON THE WALK, which is what makes the three new permitted paths more than an allowance) - the third also red on `install-copy.spec.ts` test 1, so the zero-import rule is held twice; every one restored byte-identical and the walk still reads 8 of 8. Then three components that know nothing about a port. `PutBack` is the way back: secondary tier, not rendered at all on `absent`, disabled with `Needs your ZONA connected.` when the session is gone, `PUTTING BACK…` with `aria-busy` through both legs of a put-back, and its line in a one-cell grid holding all three candidate strings so the cell measured **72px in every state at the 372px column and 96px in every state at 280px** while the destructive control beneath it stayed where it was - the box grew from 108.8 to 155px under the busy label and the marker beneath did not move by a pixel. `KeepConfirm` is the only confirmation on the site: `role="group"`, `tabindex="-1"`, labelled by `PERMANENT` and described by its sentences, focus on the container so the naming sentence is read first and Enter on it stores nothing (observed: zero `PAGESTORE/EXECUTE`), one Tab to `KEEP ON DEVICE`, a second to `NOT NOW`, a third out of the block, Escape inside closes and a click outside does not; with EN16 and BU16 on the cable the fourth sentence reads `Your EN16 and BU16 are on the same cable...` and `aria-describedby` lists three ids, two without. Its affirmative is bordered, never filled: under the accent-fill mutation it was the one lime fill on the probe, and on a panel the primary would make two. `InstallState` renders region 3's twelve blocks from the store's fields, seven of them through Phase 6's `FailureBlock`, holds the previous block through a 40 ms write under `aria-busy` and shows `RESTORED` during a put-back's store leg only. `device-ui.spec.ts` 7 -> 9 with the floor rule strengthened after a planned negative stayed green in one form. Quick **73 / 774** with one failure that is not this plan's (deferred item 12), sweep `3 13`, svelte-check 545 / 0. Nine negative checks observed and restored byte-identical; the probe page is byte-identical to HEAD. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried verbatim from 07-08, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. `PREV_E2E` is unchanged: this plan mounts nothing into a route, adds no e2e title and leaves `playwright.config.ts` and the build shape untouched (the probe is byte-identical to HEAD), so the e2e figure cannot have moved and the plan does not ask for a run.

| Name         | Value                      | Note                                                                                                                                  |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **73** (+ 4)                                                                                     |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6, 07-06 + 8, 07-07 + 10, 07-08 + 0 (772); this plan adds **2** (`device-ui.spec.ts`). Tree: **774** (+ 50) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                      |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**                                                                                     |
| `PREV_E2E`   | **83 (measured by 07-08)** | Unchanged; not run (no route, no e2e title, no build-shape change); rolls at 07-12 and 07-13                                            |

`BASE_CHECK` (provenance only): **545 files, 0 errors, 0 warnings** after every commit (542 + the three components).

### Observed totals: previous SUMMARY plus this plan's delta

07-08 left the tree at **73 / 772**, sweep `3 13`, svelte-check 542. This plan's delta is **+0 files / +2 tests / +0 e2e / +3 checked files**.

```
npx vitest run --project server src/lib/config-shape.spec.ts          # before any edit, and after every mutation's restore
  Tests  14 passed (14)

npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts   # after 7018b51
  Test Files  6 passed (6)      Tests  43 passed (43)     (identity 6, tune-ui 5, device-ui 7, config-shape 14, browse-ui, glyph-field)

npx vitest run --project server src/lib/ui/device-ui.spec.ts          # after e8b8e88
  Tests  9 passed (9)

npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 774        # twice, see below
  Test Files  1 failed | 72 passed (73)
       Tests  1 failed | 773 passed | 1 todo (775)
  check-counts: no Vitest summary lines found on stdin ... this is a failure, not a pass
  the one failure, both runs: src/lib/catalog/lua-entries.spec.ts > stays canonical and in budget across the whole knob cross-product
    Error: Test timed out in 5000ms.        (5333 ms on run 1, 6143 ms on run 2)
npx vitest run --project server src/lib/catalog/lua-entries.spec.ts    # alone
  Tests  6 passed (6)    Duration  2.20s (tests 1.68s)

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788618893598 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)
```

**The quick count, honestly.** 73 files and 774 tests ran, which is 07-08's 772 plus this plan's 2; 773 passed and one timed out, twice, in `src/lib/catalog/lua-entries.spec.ts` - Phase 8's file (last edited by `5e230ec`), which this plan does not touch and which passes alone in 1.68 s against Vitest's 5000 ms default. The machine was running two heavyweight desktop applications during both runs. The standing rule allows one rerun for a load flake and it was used; a third run was not made, and the file was not edited (out of scope). Deferred item 12 records it for the next plan that edits that file or re-measures on a quiet machine. `check-counts` therefore did not print `matches` for the quick suite this time; every other gate is green.

### Per-file counts after this plan

| File                             | Before | After  | Plan said |
| -------------------------------- | ------ | ------ | --------- |
| `src/lib/ui/device-ui.spec.ts`   | 7      | **9**  | 9         |
| `src/lib/config-shape.spec.ts`   | 14     | **14** | 14        |
| `src/lib/ui/identity.spec.ts`    | 6      | **6**  | 6         |
| `src/lib/ui/tune-ui.spec.ts`     | 5      | **5**  | 5         |

## Task 1 - the three mutations the widened allow-list must catch (commit `54b3cab`)

`PutBack.svelte` landed first as a stub (the script block naming `$lib/device/install.svelte`, `$lib/device/session.svelte` and `$lib/device/install-copy` statically, one button) so the mutations had a component under `src/lib/ui/` to live in. Each was applied as an exact single-occurrence insertion by a scratch runner, run on the one spec, restored from the byte copy and hashed.

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `import { RequestQueue } from "$lib/transport";` in `PutBack.svelte` | `config-shape.spec.ts` test 13 (1 failed, 13 passed) - the DIRECT marker | `AssertionError: a front-door file, or a permitted module the walk followed, statically imports the compiler, the protocol package, the transport or the device path at module scope: expected [ Array(1) ] to deeply equal []` with `+ "src/lib/ui/PutBack.svelte -> $lib/transport"` |
| 2 | `import { fetchBoth } from "$lib/transport/sequence";` as a static specifier in `install.svelte.ts` | test 13 (1 failed, 13 passed) - ON THE WALK | the same assertion with `+ "src/lib/device/install.svelte.ts -> $lib/transport/sequence"` |
| 3 | `import { canWriteBack } from "$lib/protocol";` as a static specifier in `install-copy.ts` | test 13 (1 failed, 13 passed) - on the walk through the second permitted entry; **and** `install-copy.spec.ts` test 1 (1 failed, 5 passed) | test 13: `+ "src/lib/device/install-copy.ts -> $lib/protocol"`; test 1: `AssertionError: install-copy.ts imports: expected true to be false` |

Hashes before and after each restore: `PutBack.svelte` (stub) `61b9a130545cb60a…` IDENTICAL; `install.svelte.ts` `f7897946d43ee385…` IDENTICAL (07-07's hash); `install-copy.ts` `7ac0c186533877af…` IDENTICAL (07-03's hash). With the walk's silent-guard raised from 7 to 9 and restored (`f5319c461d3836b6…`): `AssertionError: the walk read 8 permitted module(s) - it has gone silent: expected 8 to be greater than or equal to 9` - **8 of 8, unchanged from 07-08.** `config-shape.spec.ts` at 14 passed with everything restored.

## Task 2 - PutBack and KeepConfirm (commit `7018b51`)

`src/lib/ui/PutBack.svelte`, **246 lines** (the stub replaced). The header says in prose what a later reader would undo: why the cell reserves 72px and holds all three strings (the destructive control sits directly beneath, and the line changes after a keep and on a session drop - Z-18), why the busy label swaps with no transition (a 140 ms crossfade on a 40 ms state is a smear; the one transition is the hover colour and it is declared on the enabled control alone), why `absent` renders nothing rather than a disabled control (Z-12), and why `writing` never swaps the line (I3 rule 4). Two static specifiers: `$lib/device/install.svelte` and `$lib/device/install-copy` - the session is read through `putBackState()` (decision 1).

`src/lib/ui/KeepConfirm.svelte`, **314 lines**. The header carries the five reasons the plan asked for, one paragraph each: the container as the focus target (the naming sentence is read first; no key press commits without a deliberate Tab), not a dialog (inline, the panel stays valid, Tab walks out), focus leaving does not close it (a pending decision, not reading material), the affirmative bordered and never accent-filled (a second primary at the moment of the irreversible thing), and Z-01's four reasons for no colour in one sentence each. Ids come from `$props.id()` (DeviceSlot's form). Four static specifiers: `svelte`, the install store, the session, install-copy.

### The four measurements, on the served build through the temporary probe mount

The mount: two imports and a `column` state in the probe's script; at the foot of the page a `probe-mount` div of `{column}px` holding `<PutBack />`, a 4px `probe-below` marker, `{#if install.confirmOpen}<KeepConfirm onclose={() => install.dismissConfirm()} />{/if}` and a `probe-outside` button, plus a `probe-narrow` button setting the column to 280. Built with `npm run build` (11 s), served by the scratch `node:http` static server over `build/` on **127.0.0.1:4174**, driven by a scratch Playwright spec (`.probe.ts`, its own config, both untracked inside the repo for module resolution and deleted after) using `e2e/fake-serial.ts` and `e2e/fake-zona.ts` exactly as `install.e2e.ts` does. Port 4173 was never used; the server was killed by PID; no listener remained on either port.

**1. The cell is one height across its three lines and its busy state.**

| State | Column | `put-back-line` height | Visible line | Hidden twins (visibility / aria-hidden) |
| ----- | ------ | ---------------------- | ------------ | --------------------------------------- |
| `ready` (line 1) | 372px | **72** | `Restores the Setup and Timer that were on your ZONA when you connected.` | 2 / 2 |
| `kept` (line 2) | 372px | **72** | `…when you connected, and stores them so they stay.` | 2 / 2 |
| `needs-zona` (line 3, after an unplug) | 372px | **72** | `Needs your ZONA connected.` | 2 / 2 |
| `ready` (line 1) | 280px | **96** | line 1 | 2 / 2 |
| `kept` (line 2) | 280px | **96** | line 2 | 2 / 2 |
| `writing`, action `put-back` (busy) | 280px | **96** | line 2 (unchanged) | - |
| `nothing-landed` after the busy put-back | 280px | **96** | line 2 | 2 / 2 |
| `needs-zona` | 280px | **96** | line 3 | 2 / 2 |

The arithmetic said 72px at the 372px column and the browser agreed. At 280px the tallest twin (101 characters) wraps to four lines and the cell is 96px - in every state, which is the twin mechanism doing what the floor alone cannot. `idle` (before any session): `put-back` not rendered at all.

**2. The box is at least 44px in every state; the busy label grows the width and moves nothing beneath.** Box height **44** in `ready`, `kept`, busy, `nothing-landed` and `needs-zona` at both widths. Width 106.6 (`ready`, 372) / 108.8 (every other resting state) -> **155** under `PUTTING BACK…`, with `disabled`, `aria-busy="true"`, `install-action` `put-back`, `transition-duration` `0s` on the disabled control; the `probe-below` marker's top read **539** before, during and after the busy state at 280px. (The busy state was held for about 1.1 s by dropping the put-back's `CONFIG` acknowledgements 3, 4 and 5 - the try-on had taken 1 and 2 - so the Timer write timed out three times and landed `nothing-landed` without a store leg to wait on; a first attempt that dropped 1-3 landed the Timer on its second attempt and correctly sat in the store leg waiting for a heartbeat the spec was not pacing, which is the store's rule and not a defect.)

**3. KeepConfirm's focus contract.** After `install-keep` on a `settled` store, `document.activeElement` was `keep-confirm` (the container). Attributes: `role="group"`, `tabindex="-1"`, `aria-labelledby="c1-caption"` (text `PERMANENT`), `aria-describedby="c1-replaces c1-way-back"`, no `aria-modal`, no `inert`, 0 headings, 3 `<p>`. `Enter` on the container: `install-confirm` still `true`, `PAGESTORE/EXECUTE` seen **0**. Focus walk on Tab: `keep-confirm` -> `keep-confirm-yes` -> `keep-confirm-no` -> `probe-outside` (out of the block). Still open after focus left (`true`); Escape with focus OUTSIDE the block: still open (`true`); a click on `probe-outside`: still open (`true`); focus on `NOT NOW` then Escape: **closed** (`false`), zero stores in the whole test. `KEEP ON DEVICE` box 44, `NOT NOW` box 44; the affirmative's background `rgba(0, 0, 0, 0)` with a 1px border, `NOT NOW`'s border 0px; the caption's colour `rgba(214, 255, 78, 0.72)` (`--color-ink`); the block's background `rgb(0, 0, 0)`; accent-filled buttons on the page with the confirmation open: **none**.

**4. The rig sentence.** With EN16 (sx 1, hwcfg 195) and BU16 (sx 2, hwcfg 131) heartbeats pushed after connect - and one ZONA heartbeat after them, see deferred item 13 - the block had **4** `<p>`, `aria-describedby="c1-replaces c1-way-back c1-rig"` (**3** ids), and the fourth read `Your EN16 and BU16 are on the same cable. Their current pages are stored too, because the store reaches every module at once.` With no other module (measurement 3): 3 `<p>`, **2** ids, no fourth paragraph.

### The three negative checks, one mutated build, restored byte-identical

| # | Mutation | Observed | Restored |
| - | -------- | -------- | -------- |
| 1 | `.twin { visibility: hidden }` -> `display: none` (the twins dropped) | at **280px** the cell was **72** with line 1 (`ready`) and **96** with line 2 (`kept`) - the height changed between the first and second line, and under `needs-zona` the cell shrank to 219px wide as well; at **372px** the floor masked it (72 in every state), which is the arithmetic's blind spot and the reason the mechanism sizes on the tallest string at the panel's actual width | `PutBack.svelte` `1f98e883ab72d1a4…` IDENTICAL |
| 2 | `role="group"` -> `role="dialog"` | the served container read `role="dialog"`; task 3's test 8 was then observed red on it (below) | `KeepConfirm.svelte` `ebd56497ca841529…` IDENTICAL |
| 3 | `.secondary { background: var(--color-accent) }` | `keep-confirm-yes` computed background `rgb(214, 255, 78)`; accent-filled buttons on the probe `["keep-confirm-yes"]` where the shipped build has none - on a panel, where `TRY ON DEVICE` is the one accent fill, that is two | as above |

Then `mount-0709.mjs off` restored the probe from `git show HEAD:src/routes/dev/install/+page.svelte`:

```
probe sha256 before  764a120d9035b697190513632b4b2ac332be2671afac1f4ae0135affe6417295
probe sha256 after   764a120d9035b697190513632b4b2ac332be2671afac1f4ae0135affe6417295
git diff --quiet -- src/routes/dev/install/+page.svelte   -> exit 0
git diff --stat before 7018b51: src/lib/ui/PutBack.svelte and src/lib/ui/KeepConfirm.svelte only - no probe line
```

`build/` was rebuilt from the restored tree afterwards so `config-shape.spec.ts` test 14 reads a clean artefact.

### The attribute scan, quoted (comment-stripped code; raw counts beside it)

```
src/lib/ui/PutBack.svelte      raw 8683  stripped 3169
   "aria-label="     code: 0  raw: 0
   "role=\"dialog\"" code: 0  raw: 0
   "aria-modal"      code: 0  raw: 0
   "inert"           code: 0  raw: 0
   "setInterval"     code: 0  raw: 0
   specifiers: ["$lib/device/install.svelte","$lib/device/install-copy"]
   literals over 30 chars in code: []
src/lib/ui/KeepConfirm.svelte  raw 10268 stripped 4475
   "aria-label="     code: 0  raw: 0
   "role=\"dialog\"" code: 0  raw: 1      (the header sentence "No role="dialog", no aria-modal, no inert background")
   "aria-modal"      code: 0  raw: 1
   "inert"           code: 0  raw: 1
   "setInterval"     code: 0  raw: 0
   specifiers: ["svelte","$lib/device/install.svelte","$lib/device/session.svelte","$lib/device/install-copy"]
   literals over 30 chars in code: []
src/lib/ui/InstallState.svelte raw 8094  stripped 4453
   "aria-label=" 0, "role=\"dialog\"" 0, "aria-modal" 0, "inert" 0, "setInterval" 0, "<button" 0, "aria-busy" 1
   specifiers: ["$lib/device/install.svelte","$lib/device/session.svelte","$lib/device/install-copy","./FailureBlock.svelte"]
   literals over 30 chars in code: []   FailureBlock renders: 7   caption blocks: 6 (five phases plus the RESTORED interval)
```

## Task 3 - InstallState, and two structural gates over the three leaves (commit `e8b8e88`)

`src/lib/ui/InstallState.svelte`, **228 lines**. The held block: `let held = $state<InstallPhase>("idle")` written from `$effect(() => { if (install.phase !== "writing") held = install.phase; })` - the effect reads the phase and writes a value it never reads. `shown` is `writing ? held : install.phase`; `restoring` is `writing && action === "put-back" && leg === "store"` and takes precedence, rendering `RESTORED_CAPTION` and `RESTORED_BODY` only. The header says why region 3 does not swap a reason line during a 40 ms write (I3 rule 4, quoted in its own words) and why the put-back's RAM leg falls to the held block while its store leg does not. `restored` adds `RESTORED_STORED_LINE` only when `install.leg === "store"` (the leg that landed was the store leg - D-12). The seven failure builders: `keptMismatchBlock()`, `unconfirmedBlock(shownName)`, `restoredUnconfirmedBlock()`, `nothingLandedBlock(action === "put-back" ? "put-back" : "try")`, `partialBlock(landed ?? "Timer", failed ?? "Setup")`, `lostBlock(leg === "store", label)`, `snapshotFailedBlock()`. `shownName` is `install.name ?? name`. The root carries `aria-busy="true"` while `writing`; blocks remount under `{#key}` for a 160ms opacity fade; `STILL_WRITING_LINE` renders beneath any block while `install.slow`. **DISCONNECT ZONA is not rendered here** - the panel keeps Phase 4's after this component (decision 2). `idle` renders nothing.

`src/lib/ui/device-ui.spec.ts`, 7 -> **9**, 710 lines. `INSTALL_LEAVES` lists the three and test 8 checks them against the directory; `PERMITTED_SPECIFIERS` is the chunk guard's eight with the Phase 7 comment. Test 8, in four parts: LIGHT (every `from "` specifier is a permitted path, `svelte`, or `./X.svelte` present in the directory; at least four collected; at least one marker-matching permitted path so the exact-list rule is not vacuous), REACHABLE (the files with a `<button` are exactly `KeepConfirm` and `PutBack`, the file without is exactly `InstallState`; for every class on a button, the `min-block-size` values in its rules are collected and every one must be `44px`), STEADY (`{PUT_BACK_LINE}`, `{PUT_BACK_LINE_AFTER_KEEP}` and `{PUT_BACK_NEEDS_ZONA}` each rendered once; `visibility: hidden`; `min-block-size: 72px`; `aria-hidden=`), and A GROUP, NOT A DIALOG (`role="group"`, `tabindex="-1"`, `aria-labelledby`, `aria-describedby` present; `role="dialog"`, `aria-modal`, `inert` and `aria-label=` absent by fragment-assembled needles, with the raw header proven to name the dialog role so the strip is load-bearing; `aria-label=` absent across the three leaves AND the seven device components; no `setInterval` in the three). Test 9: the three tells (`your ZONA`, `Setup and Timer`, `power cycle`, assembled) are proven present in the comment-stripped `install-copy.ts`, then absent from the three leaves' code, each of which must import from `$lib/device/install-copy`; over 3000 characters read.

### The negative checks, observed red then restored (`KeepConfirm.svelte` `ebd56497ca841529…`, `PutBack.svelte` `1f98e883ab72d1a4…` after each)

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `role="group"` -> `role="dialog"` on the container | test 8 (1 failed, 8 passed) | `AssertionError: KeepConfirm carries role="group": expected '…' to contain 'role="group"'` (the first of the group assertions; the assembled dialog needle stands behind it) |
| 2 | `const RETYPED = "Restores the Setup and Timer that were on your ZONA when you connected.";` in `PutBack`'s script | test 9 (1 failed, 8 passed) | `AssertionError: an install leaf retypes a sentence in its markup instead of importing it from install-copy: expected [ …(2) ] to deeply equal []` with `"PutBack.svelte -> \"your ZONA\""` and `"PutBack.svelte -> \"Setup and Timer\""` |
| 3a | `min-block-size: 40px` ADDED to `.quiet-control` beside the 44px | test 8 **stayed green** (9 passed) under the first draft's presence check - see deviation 1 | - |
| 3a' | the same, after the rule was strengthened | test 8 (1 failed, 8 passed) | `…or declares another floor beside it - the interactive floor is per control: expected [ Array(1) ] to deeply equal []` with `"KeepConfirm.svelte -> .quiet-control [44px, 40px]"` |
| 3b | `.quiet-control`'s `min-block-size: 44px` -> `40px` | test 8 (1 failed, 8 passed) | the same assertion with `"KeepConfirm.svelte -> .quiet-control [40px]"` |

Nine negative checks in the plan: the three allow-list mutations, the dropped twins, the dialog role (observed on the served build and on test 8), the accent-filled affirmative, the retyped sentence, and the 40px button in both of its forms.

## Files created and modified

- `src/lib/ui/PutBack.svelte` - created (stub in `54b3cab`, full in `7018b51`); 246 lines
- `src/lib/ui/KeepConfirm.svelte` - created; 314 lines
- `src/lib/ui/InstallState.svelte` - created; 228 lines
- `src/lib/ui/device-ui.spec.ts` - modified; 7 -> 9; 710 lines
- `.planning/phases/07-install-flow/07-09-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - items 11, 12 and 13 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 9/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 2 - Missing guard] test 8's floor rule reads every `min-block-size` on a control's class, not the first**
- **Found during:** Task 3, negative check 3 (`min-block-size: 40px` on `NOT NOW`) - inserted beside the existing declaration it left the test at 9 passed, because a presence check for `min-block-size: 44px` is satisfied by a rule body that also carries a later, lower declaration.
- **Fix:** the values of every `min-block-size:` in the control's rule bodies are collected; there must be at least one and every one must be `44px`. Observed red in both forms afterwards (`[44px, 40px]` and `[40px]`). Test 3's rule over the seven Phase 6 components is unchanged.
- **Files modified:** `src/lib/ui/device-ui.spec.ts`. **Commit:** `e8b8e88`.

**2. [Rule 3 - Blocking] the scratch measurement spec ran from inside the repo, not the scratchpad**
- **Found during:** Task 2, the first measurement run: `Error: Cannot find module '@playwright/test'` - a spec file outside the repository cannot resolve the package.
- **Fix:** the spec and a six-line config were placed inside the repository as untracked `*.probe.ts` / `pw-0709.config.ts` (a suffix `playwright.config.ts`'s `**/*.e2e.ts` never collects), run, copied back to the scratchpad for the record, and deleted before the commit; `git status` shows neither. The same throwaway-in-tree form 07-08 used for its self-check.
- **Files modified:** none kept.

### Departures recorded, not deviations from the plan

1. **`PutBack` does not import the session.** The interfaces block says it reads `install` and `session`; `putBackState()` already folds the session's phase and the stub's session import went unused, so the full component names two permitted paths rather than three (decision 1).
2. **`KeepConfirm` fades IN only** (decision 3, deferred item 11). The leaving fade the Motion Contract describes belongs to the `{#if}` that unmounts it, which is 07-10's.
3. **The busy-state measurement was re-planned once**: dropping the put-back's CONFIG acknowledgements 1-3 (cumulative, the try-on had already consumed two) let the Timer land on its second attempt and the put-back correctly entered its store leg and waited for a heartbeat the scratch spec was not pacing (`writing` for 10 s). Dropping 3, 4 and 5 gave the 1.1 s `writing` window the measurement needed and a `nothing-landed` exit. The store did the right thing both times.
4. **The rig measurement needed a ZONA heartbeat after the rig's** (deferred item 13): `#startFold` at `connected` begins an empty fold, so a second module's heartbeat is absorbed but nothing republishes until the ZONA's next beat. Observed on `/dev/session/` with 06-10's own frames and with fresh ones; not a defect on hardware, where the module beats at 4 Hz.
5. **The quick suite's one failure is not this plan's and was not rerun a third time** (decision 7, deferred item 12): `lua-entries.spec.ts` test 6 at 5333 then 6143 ms against a 5000 ms default, passing alone in 1.68 s.
6. **The three negative checks of task 2 were observed in one mutated build**, not three: they touch different declarations of two files and the same measurement run reads all three, so one build and one run answered all of them; each restore was to the pre-mutation hash.

## Known stubs

None. Nothing mounts the three leaves at this wave by the plan's own rule ("Nothing mounts the three leaves at this wave"); the temporary probe mount that measured them is gone and the probe is byte-identical to HEAD. `InstallState`'s `partialBlock(install.landed ?? "Timer", install.failed ?? "Setup")` carries fallbacks the `partial` phase can never take (both fields are set before `#fail("partial", …)`); they exist for the types and are named here so nobody reads them as a default rendering.

## Requirements

**`requirements-contributed: [SAFE-02, SAFE-05, DEGR-02]`** - contributed, not completed; every Phase 7 criterion carries a *(hardware)* half and 07-13 closes them. SAFE-02: the hierarchy exists as three tiers of one control family - `PutBack` and the confirmation's `KEEP ON DEVICE` bordered secondaries, `NOT NOW` quiet, and the accent fill measured absent from every one of them (the accent-fill mutation observed). SAFE-05: the confirmation is a leaf a node scan can check - `role="group"`, labelled `PERMANENT`, described by `CONFIRM_REPLACES` and `CONFIRM_WAY_BACK`, the rig sentence when there is one, `KEEP ON DEVICE` the only affirmative with `NOT NOW` beside it, and test 8 holds the shape. DEGR-02: `PutBack` is a real `disabled` with its reason bound by `aria-describedby` in `needs-zona` and during a write; `absent` is a decision (Z-12) rather than a hidden control. `REQUIREMENTS.md` is not edited here, as no Phase 7 plan before 07-13 edits it.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 11** - the confirmation's fade OUT belongs to the panel's `{#if}`; a decision for 07-10, then at most one directive.
- **Item 12** - `lua-entries.spec.ts` test 6 breaches Vitest's 5000 ms default inside the parallel quick run on a loaded machine (5333, 6143 ms) while passing alone in 1.68 s; owner the next plan that edits that Phase 8 file, and 07-10 re-measures quick 73 / 774 first.
- **Item 13** - after `connected` a rig's other modules reach the identity only on the ZONA's next heartbeat; 07-12's rig test pushes one. No code.

Items 1-10 are unchanged. Item 10 (the probe's PUT BACK click is `install-put-back-click`) was relied on here and is confirmed.

## Next plan readiness

07-10 (the panel writes: the never-writes literals retired, `KEEP ON DEVICE` quiet, the column row) starts from: quick **73 / 774** (773 passed plus the deferred timeout - re-measure on a quiet machine first), sweep `3 13`, e2e **83** (`PREV_E2E`, not run here), svelte-check 545 / 0. The three leaves exist under the plan's testids and props: `PutBack` takes none; `KeepConfirm` takes `onclose: () => void` and expects the panel to call `install.dismissConfirm()` and return focus to the row's `KEEP ON DEVICE`, and to hand focus to region 3 (`tabindex="-1"`) after a commit, since the leaf unmounts under focus then; `InstallState` takes `name` and `label` and renders no control, so the panel renders `DISCONNECT ZONA` after it in `ready` exactly where Phase 4 put it. `device-ui.spec.ts` is at 9; test 8's `aria-label=` scan now covers ten components, and its LIGHT rule holds the three leaves to the eight permitted paths, `svelte` and sibling components only - a `$lib/tune/copy` import in one of them would be red there even though it is light. The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every byte a page wrote in this plan landed in the shim.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T14:50:00Z.

- FOUND: `src/lib/ui/PutBack.svelte` (246 lines; `put-back-line` twice - the id and the testid; two static specifiers)
- FOUND: `src/lib/ui/KeepConfirm.svelte` (314 lines; `keep-confirm-yes` once; `confirmRig` three times - the import, the derived, the header)
- FOUND: `src/lib/ui/InstallState.svelte` (228 lines; `install-state` twice - the class and the testid; `FailureBlock` rendered seven times)
- FOUND: `src/lib/ui/device-ui.spec.ts` (710 lines; 9 passed)
- FOUND: `.planning/phases/07-install-flow/07-09-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (items 11, 12 and 13 appended; fourteen headings)
- FOUND: commits `54b3cab` (task 1), `7018b51` (task 2), `e8b8e88` (task 3)
- PASS: config-shape.spec.ts 14 after every restore; device-ui.spec.ts 9; sweep 3 13 through check-counts; svelte-check 545 / 0; `npm run lint` exit 0; quick 73 files / 774 tests ran with 773 passed and the one deferred timeout (item 12) - recorded, not asserted as a match
- PASS: nine negative checks observed and each restored to its pre-mutation sha256 (`61b9a130…` stub, `f7897946…` install.svelte.ts, `7ac0c186…` install-copy.ts, `1f98e883…` PutBack.svelte, `ebd56497…` KeepConfirm.svelte); the probe `764a120d…` before and after with `git diff --quiet` exit 0
- PASS: no `*.probe.ts`, no `pw-0709.config.ts`, no `test-results/` in the tree; no listener on 4173 or 4174; `build/` rebuilt from the restored tree
- engine name occurrences in the three components, the spec and this SUMMARY: 0; attribution lines in the three commit messages: 0
