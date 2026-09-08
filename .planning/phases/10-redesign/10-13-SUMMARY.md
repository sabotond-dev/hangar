---
phase: 10-redesign
plan: 13
subsystem: ui
tags: [clear, quiet-tier, safe-02, safe-03, degr-02, d-04, a-45, a-46, a-47, a-50, a-51, a-52, next-caption, factory-default]

requires:
  - phase: 10-redesign
    plan: 12
    provides: PREV_FILES 80 / PREV_TESTS 819 / PREV_E2E 97 / BASE_CHECK 582, sweep 4 19, PREV_SWEEP_WALL 90 s
provides:
  - "src/lib/ui/Clear.svelte: the Quiet-tier control - no border, no background, no radius, no inline padding, Micro at the site's ordinary 0.18em - with BOTH 44px axes declared and their reason in a comment, a 48px line cell whose second line is documented as headroom rather than occupancy, its four candidates at grid-area 1 / 1, its three reasons iterated from install-copy's closed record, CLEARING… with aria-busy, and no {#if} anywhere in it"
  - "src/lib/ui/ChosenPanel.svelte: the NEXT caption (4) directly under the one hairline Phase 7 gave region 6, and Clear in the column at the 16px rhythm between KEEP ON DEVICE and the share snippet. NO second hairline; region 4's min-block-size: 152px byte-untouched"
  - "src/lib/ui/InstallState.svelte: the FACTORY DEFAULT block (15 / 115) as the thirteenth rendered state, and the nothing-landed selector inverted to `action === \"try\" ? \"try\" : \"put-back\"` so a clear takes the PUT BACK form the spec assigns it instead of falling through to the TRY form by omission"
  - "device-ui.spec.ts 11 -> 13: the CLEAR cap-and-reservation test, and a shapelessness test over BOTH Quiet controls that also proves the confirmation nobody built is absent. DEVICE_COMPONENTS 6 -> 7 with its length assertion"
  - "device-ui.spec.ts test 10, widened without growing: the column's order with CLEAR in it, exactly one border-block-start in ChosenPanel, the accent fill counted site-wide over every interactive class (SAFE-02 surviving D-04), DEGR-02's contrast with PUT BACK as one assertion, and I14's block rendered from install-copy"
  - "install.spec.ts test 21 and install-copy.spec.ts test 4, widened without growing: the control-naming rule gated on both sides of the copy/machine boundary - the body names PUT BACK and no other write click, and PUT BACK is ENABLED in `cleared`"
  - "e2e/install.e2e.ts 11 / 12 -> 13 / 16: the clear walk and the degrade walk, both @webkit-tagged so both projects run them"
  - "docs/INSTALL-RUNBOOK.md row C carries the clear, its cable caution and the finger observation; still seven rows; the diagnosis table gains FACTORY DEFAULT and reads thirteen"
  - "PREV_FILES 80, PREV_TESTS 821, PREV_E2E 101, BASE_CHECK 583, sweep 4 19, PREV_SWEEP_WALL 90 s - the carry-forward block for 10-13.1"
affects: [10-13.1, 10-14, ui, device, docs]

tech-stack:
  added: []
  patterns:
    - "A HAND LIST THAT FEEDS A DERIVED WALK IS THE WALK'S REAL SCOPE. Removing Clear.svelte from DEVICE_COMPONENTS turns ONLY the length assertion red; the 44px both-axes walk goes green having read nothing. The length assertion is therefore the load-bearing one, and that is why it moved with the list rather than after it"
    - "PROVE THE COMPONENT THAT WAS NOT BUILT. A-45 cut ClearConfirm.svelte before it shipped, so the gate is an absence: no such file on disk, no clear-confirm testid in any component, no REMOVES caption and no empties-the-Setup sentence anywhere, and no clear-confirm element at any point of the browser walk. A removed design leaves no trace, and a plan that removed one should be able to show it"
    - "WHEN A CHANNEL IS RETIRED, ASSERT THE OPPOSITE CLAIM RATHER THAN PADDING THE COUNT. A-24 bought grep-checkable uniqueness (0.28em) at the price of a one-member tier. A-46 retired both, so the replacement gate says CLEAR and KEEP ON DEVICE are ALIKE - which is what A-46 actually decided, and it protects two controls where the old one protected the difference between one and everything"
    - "A SITE-WIDE COUNT BEATS A PAIRWISE COMPARISON FOR SAFE-02. 'The two are not equal-weight' is hard to assert; 'exactly one interactive class in src/lib/ui declares the accent fill, and it is the primary' is one line, catches every future control, and names the offender"
    - "A SELECTOR MATCHED BY EQUALITY READS NOTHING. The first rule of a <style> block carries the <style> tag in its selector capture, so `selector === '.primary'` finds no rule at all - which is how a walk goes green finding nothing. Every walk in device-ui.spec.ts matches by inclusion, and the new one now does too"

key-files:
  created:
    - src/lib/ui/Clear.svelte
  modified:
    - src/lib/ui/ChosenPanel.svelte
    - src/lib/ui/InstallState.svelte
    - src/lib/ui/device-ui.spec.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/install-copy.spec.ts
    - e2e/install.e2e.ts
    - docs/INSTALL-RUNBOOK.md
    - docs/TESTING.md
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The control-naming gate could not live in device-ui.spec.ts. That file imports nothing from src/ by construction - it is a source-text scanner - so 'PUT BACK is enabled in cleared' is not a claim it can make. Split along 10-12's own boundary: install-copy.spec.ts asserts the body names PUT BACK and no other write click, install.spec.ts asserts putBackState() is `enabled` in `cleared`. Two spec files beyond the plan's <files> line, both counts unchanged"
  - "DeviceDetails.svelte is in the plan's files_modified and needed no change. #ramLeg sets session.writeLock, which is exactly what both of the disclosure's controls are disabled by, so a clear locks the header for free. Reported rather than edited"
  - "The twin-marker count is TWO, not four. The three reasons are iterated from CLEAR_REASONS, so the source carries one class:twin= for the literal line and one inside the {#each} - the same shape KeepOnDevice has for its seven strings. Asserted at 2, with the reason in the message, rather than restructured to make a four appear"
  - "The FACTORY DEFAULT row was added to the runbook's diagnosis table and its Twelve became Thirteen. Not asked for, and taken anyway: a visitor running the row this plan widened meets that block, and a table that did not name it would be a hole in the row"
  - "Both new e2e titles carry @webkit, which means the phone project now runs a Web-Serial-driven walk through the shim for the first time. install.e2e.ts's header said the other ten are untagged precisely because they drive Web Serial. The departure is written into that header rather than left to be noticed"

patterns-established:
  - "The three channels that separate CLEAR from KEEP ON DEVICE are named in the component's own header, including the one that is a weakness: at rest they look the same"
  - "A cap that departs from its formula says so in the component AND in the spec: the header carries the arithmetic and the refusal, install-copy.spec.ts asserts the formula's answer is smaller than the cap, and device-ui.spec.ts asserts 24px is absent"

requirements-completed: [SAFE-02, SAFE-03, DEGR-02]

duration: 37min
completed: 2026-09-09
---

# Phase 10 Plan 13: CLEAR, part two — one control, one block, one browser walk — Summary

**A fourth write click that is Quiet-tier, shapeless and indistinguishable from `KEEP ON DEVICE` at rest — separated from it by three channels, two of which are behaviour — walked end to end in two engines against the fake, with the confirmation that was cut proved absent in node and in the browser, and SAFE-02's two weights turned from an assumption into a site-wide count.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-09-09T00:12Z
- **Completed:** 2026-09-09T00:49Z
- **Tasks:** 3 of 3
- **Files created:** 1 · **modified:** 9

## The carried counts

| Name               | Carried in | Delta                          | Out     |
| ------------------ | ---------- | ------------------------------ | ------- |
| `PREV_FILES`       | 80         | 0 — no spec file created       | **80**  |
| `PREV_TESTS`       | 819        | **+2**                         | **821** |
| `PREV_E2E`         | 97         | **+4**                         | **101** |
| `BASE_CHECK`       | 582        | **+1** — `Clear.svelte`        | **583** |
| sweep              | 4 / 19     | 0                              | **4 / 19** |
| `PREV_SWEEP_WALL`  | 90 s       | 0                              | **90 s** |

**The +2, written out.** `device-ui.spec.ts` 11 → **13** (+2, task 01: the CLEAR cap-and-reservation test, and the two-control shapelessness test). `install-copy.spec.ts` **6 unchanged**. `install.spec.ts` **21 unchanged**. `tune-ui.spec.ts` **9 unchanged**. Task 02 is **+0** — every assertion landed inside an existing test, named below. Task 03 is **+0** in node. **No spec file was created.**

**The old +3 is retired by name.** It was `device-ui.spec.ts` +3 for the cap test, the tracking-uniqueness test and a two-component walk. A-46 retired the tracking test with the Bare tier and A-45 removed the second component, so the term is **+2**: the cap test, and a shapelessness test that reads two controls instead of one.

**The +4, written out.** Two new titles, both `@webkit`-tagged, so both run on `chromium` and on `webkit-phone`: 2 × 2 = 4. `npx playwright test --workers 3 | node scripts/check-counts.mjs --playwright 101` reports *observed 101 tests passed · matches the expected counts*.

`BASE_CHECK` moved exactly as the plan predicted — **582 in, 583 out** — because `Clear.svelte` is this plan's one new file and `svelte-check` counts files.

**Per-task verify expectations reconciled against 10-12's leave values before anything was run:** `device-ui.spec.ts` **11** and `install-copy.spec.ts` **6** were both observed on the untouched tree. The plan's per-task figures (13 after task 01, 6 unchanged) agree with the tree. **Nothing had to be adjusted to make a gate pass.**

## Every counted string

Counted by script (`[...s].length`), never by eye:

```
   5  CLEAR_LABEL
   9  CLEARING_LABEL          (U+2026, one ellipsis character)
  41  CLEAR_LINE              Reset the current page to factory default
  43  reason no-snapshot
  26  reason no-session       (PUT_BACK_NEEDS_ZONA, referenced)
  36  reason incapable        (KEEP_REASONS.incapable, referenced)
  15  CLEARED_CAPTION         FACTORY DEFAULT
 115  CLEARED_BODY
  37  LIVE_CLEARED
  96  nothing-landed after a clear (Phase 7's PUT BACK form, reused verbatim)
   4  NEXT                    (region 6's caption, this plan's one new string)
```

Every one matches §13.3. The `CLEAR` cell's four candidates are **41 / 43 / 26 / 36**; the longest is 43, `ceil(43 / 43) × 24 = 24px`, and **the cell reserves 48px** — the second line declared headroom rather than occupancy (A-52), in the component's header, in `install-copy.spec.ts`'s cap arithmetic, and now in `device-ui.spec.ts` as an explicit refusal of 24px.

## The two grep counts the plan asked for

- `grep -rc "0.28em" src/lib/ui/` → **0**, on every file. Across all of `src/` and `e2e/` the count is **0** too. The literal survives only in the planning documents that record its retirement.
- `clear-confirm` (the testid) → **0** occurrences in `src/` and `e2e/`. `ClearConfirm.svelte` is not on disk. The only occurrence of the *word* is `Clear.svelte`'s header saying the component does not exist, which the comment strip removes before the scan.

## `DEVICE_COMPONENTS`: observed before and after, and the disagreement

**Observed before: 6.** `grep -n` on the shipped file read `expect(DEVICE_COMPONENTS.length, "six components were listed …").toBe(6)`, and the list held six names.

**Now: 7**, with `Clear.svelte` added and the assertion moved to 7.

**The disagreement, named rather than absorbed:**

| Source | Figure | Verdict |
| --- | --- | --- |
| the tree, before this plan | **6** | **the truth**, and what was asserted |
| `10-13.1-PLAN.md:331` | "**six names today**" | correct as written; **must read seven** after this plan |
| `10-VALIDATION.md:581` | "**six today**" | same |
| an earlier revision of `10-13-PLAN.md` | 7 → **9** | wrong at both ends: 7 predates R-02, and 9 assumed two new components where A-45 left one |
| `10-03-SUMMARY.md:560` | "asserts its own length is **7**" | true *before* R-02 retired `PickerExplainer.svelte`; the count went 7 → 6 → **7** |

The plan told me to assert the observed value plus one and name the disagreement. That is what happened: **6 → 7**.

## The phase→controls table, as rendered

Read off the shipped components and the store, for the states this plan renders:

| Phase | TRY ON DEVICE | PUT BACK | KEEP ON DEVICE | CLEAR | Region 3 |
| --- | --- | --- | --- | --- | --- |
| `ready` | enabled | enabled | disabled, `never-tried` | enabled | `ZONA IDENTIFIED` |
| `settled` | enabled | enabled | **enabled** | enabled | `PLAYING NOW` |
| **`cleared`** | enabled | **enabled** | disabled, `never-tried` | enabled | **`FACTORY DEFAULT`** |
| `writing` (a clear) | disabled | disabled | disabled | disabled, label `CLEARING…`, `aria-busy` | the held block, `aria-busy` |
| no Web Serial | present, disabled, `HONESTY_INCAPABLE` | **absent** (Z-12) | present, disabled, `incapable` | **present, disabled, `incapable`** | — |

`cleared`'s row is asserted in `install.spec.ts`'s fifteen-row test: `putBackState()` is `"enabled"`, `keepReason(true)` is `"never-tried"` — the closed set of six answers the new phase without a seventh member — and `clearEnabled(true)` is `true`, because a clear is idempotent (A-50).

**TRY ON DEVICE has no store-side predicate**, and that is stated rather than faked. Its enablement is derived in `TryOnDevice.svelte` from `phase === "writing"`, `phase === "snapshotting"` and a missing config, so `cleared` enables it by not being either phase. The assertion that holds it is from the other side: `device-ui.spec.ts` asserts the primary's code names `"cleared"` **zero** times — no phase this plan added reached the primary's disabled set.

## CLEAR and KEEP ON DEVICE look the same at rest, and that is A-47's ruling

**Stated plainly, as the plan required.** After a try-on, on a browser that can write, the two controls are the **same tier, same weight, same colour, same tracking, same borderlessness**. There is no visual channel between them at all. `device-ui.spec.ts`'s new shapelessness test asserts exactly that sameness rather than a difference.

**The three channels, and two of them are behaviour:**

1. **The words.** `CLEAR` / `Reset the current page to factory default` (41) against `KEEP ON DEVICE` / `Stores this configuration in your ZONA’s own memory, so it survives a power cycle.` (82).
2. **The enablement set.** The two are rarely both live: in `cleared`, `partial`, `nothing-landed`, `restored`, `ready` and every state that is not `settled` or `unconfirmed`-with-`armed`, CLEAR is enabled and KEEP ON DEVICE is not. Asserted over 10-12's fifteen-row table.
3. **The ceremony, inverted.** `KEEP ON DEVICE` opens the site's only confirmation; `CLEAR` sends on the click. Proved in the browser walk, where no `clear-confirm` element exists at rest, inside the write, or after it lands.

**Why the weakness is acceptable, on the facts rather than on taste:** `CLEAR` is the **least consequential of the four writes**. It writes RAM only, the control directly above it undoes it, a power cycle undoes it, and what it writes is a working configuration the firmware itself ships. The write that needed setting apart is the irreversible one, and that one still has its confirmation.

**A-25's cost, recorded.** No `--color-over` on CLEAR, and the reversal Open item 6 described has nothing left to attach to: it wanted the token as a confirmation block's 1px border, and there is no block. **If red is still wanted it would have to be a border on the control itself, which puts CLEAR back in a tier of its own and reverses A-46 too** — one control with a border in a borderless tier is the fifth tier under a different name.

## The five planted faults, and the one gate that does not exist

The plan's tasks specify six checks (three in task 01, two in task 02, one investigation in task 03). **Its `<output>` block asks for "the eight negative checks"** — that number matches no list in the plan's own body, and the honest count is six. All six were run.

| # | Task | Planted | Result |
| --- | --- | --- | --- |
| A | 01 | `Clear.svelte`'s `min-inline-size` set to `auto` | **RED**, naming `src/lib/ui/Clear.svelte -> .control` in the both-axes walk |
| B | 01 | `border: 1px solid var(--color-line)` on `.control` | **RED**, naming `Clear.svelte -> the control declares a border` in the shapelessness test, with A-41 and A-46 in the message |
| C | 01 | `Clear.svelte` removed from `DEVICE_COMPONENTS` | **RED on the length assertion ONLY** — `expected 6 to be 7`. **The 44px walk stayed green**, having read a component that was no longer in its list. That is the finding: the hand list *is* the walk's scope, and the length assertion is what guards it |
| D | 02 | `CLEAR` made absent under DEGR-02 (`{#if reason !== "incapable"}`) | **RED**, `CLEAR has gained a conditional render … which is the opposite of PUT BACK's ruling and is the difference this assertion exists to hold: expected 1 to be +0` |
| E | 02 | `KEEP ON DEVICE` given the primary's weight (`background: var(--color-accent)`, `inline-size: 100%`) | **RED in two places**: the SAFE-02 accent count naming `KeepOnDevice.svelte -> .control`, and the shapelessness test naming `background: var(--color-accent)` |
| F | 03 | *(investigation)* what gates `docs/INSTALL-RUNBOOK.md` | **NOTHING DOES.** See below |

**The SAFE-02 weight assertion did not have to be added after the fact.** It was written as part of task 02 and fired as written on its first plant — the plan said "if it does not fire, add it", and it did.

## Whether anything gates `docs/INSTALL-RUNBOOK.md`

**No.** Six files under `docs/` are named by at least one spec — `SKELETON-RESULTS.md`, `SKELETON-RUNBOOK.md`, `HARDWARE-AUDITION.md`, `PIN-POLICY.md`, `TESTING.md` and `woff2.md`. `INSTALL-RUNBOOK.md` is named by two **source comments** (`descriptors.ts:244`, `fake-zona.ts:33`) and by **no test at all**, so its "Seven rows" sentence, its row letters and its block table are trusted by hand and by nothing else.

**A-51 makes that finding stronger rather than weaker.** The clear folded into row C precisely so the row count would not move — and had it moved, nothing would have caught the sentence going stale. Recorded as deferred item 10, with the shape a later gate would want: the row letters parsed out of the table, the count asserted against the sentence, and every block caption in the diagnosis table checked against `install-copy.ts`'s exports.

`docs/TESTING.md` turns out to be named by exactly one spec — and only in a **comment** (`lua-entries.sweep.spec.ts:14`). It has no gate either.

## Task 02's assertions, each named inside the test that absorbed it

`device-ui.spec.ts` stayed at **13**, `install.spec.ts` at **21**, `install-copy.spec.ts` at **6**.

| Assertion | Landed inside |
| --- | --- |
| the column's order with `CLEAR` between `KEEP ON DEVICE` and the share snippet | `device-ui.spec.ts` test 10, beside the existing "one column, PUT BACK first" block |
| exactly **one** `border-block-start` in `ChosenPanel.svelte` (no second hairline, A-46) | same |
| region 4's `min-block-size: 152px` still present | same |
| the `NEXT` caption's testid | same |
| **SAFE-02**: exactly one interactive class in all of `src/lib/ui` declares the accent fill, and it is `TryOnDevice.svelte -> .primary`; both Quiet controls are `fit-content` and `transparent`; the primary names no phase this plan added | same |
| **DEGR-02**: `PutBack.svelte` gates its whole render on `putBackState`, `Clear.svelte` contains **zero** `{#if}` | same |
| I14's block rendered from `CLEARED_CAPTION` / `CLEARED_BODY`, and the `nothing-landed` selector | same |
| the body names `PUT BACK` and **no other write click** | `install-copy.spec.ts` test 4 (the copy-rules test), beside `WRITE_CLICKS` |
| `PUT BACK` is **enabled** in `cleared`; `keepReason` is `never-tried`; `clearEnabled` is true | `install.spec.ts` test 21 (the fifteen-row partition) |

## Which failure form a clear takes

A clear **reuses three blocks and authors none**, which is why `install-copy.spec.ts`'s seven-builder and seven-title enumerations did not move.

- **`nothing-landed`** — the selector was inverted, `install.action === "put-back" ? "put-back" : "try"` → `install.action === "try" ? "try" : "put-back"`. This is the site 10-12's exhaustiveness table flagged as "10-13's". A clear was falling through to the **TRY** form by omission, whose detail says *your own Setup and Timer are still running and there is nothing to put back* — false after a clear. The put-back form's detail (*nothing on the module changed, so what was playing is still playing*, **96**) is exactly true, and its step names `PUT BACK`, which is on the screen. The new selector mirrors the store's own `#classify` (A-28), so component and store now agree about which action is the exception. `keep` is unaffected: a keep is a store leg and never reaches `nothing-landed`.
- **`lost`** — no selector needed. A clear has no store leg, so `storeLeg` is `false` and the honest half of `lostBlock` renders.
- **`partial`** — no forms at all. SAFE-07's sentence about half a configuration is true of a half-landed clear word for word.

## The browser walk

`e2e/install.e2e.ts` **11 / 12 → 13 / 16**.

**The clear walk** (`@webkit`, both projects): connect against the fake, try a card on, then — with `CLEAR` live beside `KEEP ON DEVICE` under `NEXT` and its line reading `CLEAR_LINE` — **one click sends**. `CLEARING…` with `aria-busy` through the one leg; `FACTORY DEFAULT` over its 115-character body; `PUT BACK` enabled and `KEEP ON DEVICE` disabled with `Available after a try-on.`; then `PUT BACK` clicked, and `RESTORED`. `LIVE_CLEARED` said **exactly once**. **No `clear-confirm` element at any of the three moments** — at rest, inside the write, after it lands. And the wire by class: **six `CONFIG/EXECUTE`** for three RAM legs, **zero `PAGESTORE/EXECUTE`**, which turns A-26's RAM-only ruling into a counted number.

**The degrade walk** (`@webkit`, both projects): `navigator.serial` deleted from the prototype, and `CLEAR` present, disabled and explained beside `PUT BACK` being absent — asserted as **one object** (`{ clear: 1, clearDisabled: true, putBack: 0 }`) so the difference is deliberate rather than two facts in two places.

**The two never-writes browser assertions were re-run, unchanged in wording.** `install.e2e.ts` test 1 and `e2e/session.e2e.ts`'s seven cable tests were run together and all passed; not one word of either moved, and their fact is stronger for it — zero writes of any class now covers **four** clicks.

## `docs/INSTALL-RUNBOOK.md`

Row C's subject was already *"the pad is doing exactly what it was doing before row B"*, so the clear made the same row a stronger test of the same claim.

- **Row C's name** is now `` `PUT BACK`, and `CLEAR` (SAFE-03) ``.
- **Do this** gains: click `CLEAR` — one click, no block in front of it — and **watch the pad, at rest and with a fingertip on it**; then `PUT BACK` again. Plus the caution the other write rows carry: **do not pull the cable while the label reads `CLEARING…`.**
- **Passes when** gains the observation that is the point of the row: **the pad goes dark at rest and lights a soft white bloom under a finger**, brightest under the fingertip and falling off by distance — **not "the pad goes dark" full stop**. The firmware's own default Setup zeroes all 81 cells and installs a proximity-weighted touch callback, so a pad that is dark at rest and **stays** dark under a finger is a **failure**. The row asks for that to be written down either way.
- **Why a machine cannot** gains: the scripted ZONA acknowledges whatever it is told to acknowledge, so only a real module can show that two `CONFIG/EXECUTE` frames carrying the pinned package's own `defaultConfig` actually **run** rather than merely being acknowledged.

**The section still says "Seven rows", and that sentence was NOT edited.** Stated deliberately: the fold adds an observation, not a row, and the table still holds exactly seven `| **A** |` … `| **G** |` rows. **No agent connected to or wrote to a device.** The row is left for the user.

## `docs/TESTING.md`

`:840` now reads **the four clicks** — G-06's documentary half (A-53); the assertion itself is byte-identical and 10-12 recorded why. Six per-file counts moved to what the tree reads: `install.spec.ts` 18 → **21**, `device-ui.spec.ts` 11 → **13**, `constants.spec.ts` 5 → **7**, `identity.spec.ts` 6 → **7**, `install-copy.spec.ts` **6 unchanged** with its four enumerations spelled out (9 / 7 / 7 / 13 / 4), `session.spec.ts` **21 unchanged** with the needle list's 8 → 9 → 10 recorded inside it, and `e2e/install.e2e.ts` 11 / 12 → **13 / 16**. A short section adds Phase 10's own three suites — `aesthetic.spec.ts` (7), `colour-picker.spec.ts` (6), `aesthetic.e2e.ts` (4 / 8). **No phase totals were written**; 10-14 re-measures.

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 3 - Blocking] The control-naming gate cannot live in `device-ui.spec.ts`.**
- **Found during:** Task 02, step 4.
- **Issue:** the plan asks for "a test over the phase→controls table from 10-12" and puts it in `device-ui.spec.ts`. That file imports **nothing** from `src/` by construction — it is a source-text scanner over comment-stripped files — so "PUT BACK is enabled in `cleared`" is not a claim it can make, and importing `install-copy` into it would break the property that makes all thirteen of its tests run in 50 ms without a browser.
- **Fix:** split along the boundary 10-12 drew. `install-copy.spec.ts` asserts `WRITE_CLICKS.filter(l => CLEARED_BODY.includes(l))` equals `[PUT_BACK_LABEL]`; `install.spec.ts` asserts `putBackState()` is `"enabled"` with `phase = "cleared"`. Both landed inside existing tests; neither count moved.
- **Files:** `src/lib/device/install-copy.spec.ts`, `src/lib/device/install.spec.ts` — **two files beyond the plan's `<files>` line** · **Commit:** e2a0005

**2. [Rule 1 - Test quality] The twin-marker count is 2, not 4.**
- **Found during:** Task 01, first run.
- **Issue:** the plan's cell has four candidates, and the first draft asserted four `class:twin=` markers. It found two, because the three reasons come from an `{#each}` over `CLEAR_REASONS` — the same shape `KeepOnDevice.svelte` uses for its seven strings, where two markers cover seven candidates.
- **Fix:** asserted **2**, with the reason written into the message and the comment: `TryOnDevice`'s five are literal and countable, this one is not, and the iteration is separately asserted so a fourth reason is a type error in `install-copy` rather than a silent omission here. **The number was not padded to make the plan's four appear.**
- **Files:** `src/lib/ui/device-ui.spec.ts` · **Commit:** 7a6f771

**3. [Rule 1 - Bug] The SAFE-02 accent walk matched nothing when written with selector equality.**
- **Found during:** Task 02, first run.
- **Issue:** `rulesOf()` slices from `<style>`, so the **first** rule's selector capture is `"<style>\n  \n  .primary"`. `r.selector.trim() === ".primary"` therefore matches no rule, and the walk returned `[]`.
- **Why it did not go green silently:** the assertion was written as `toEqual(["TryOnDevice.svelte -> .primary"])` rather than `toEqual([])`, so an empty result is a failure. Had it been phrased as "no control other than the primary is filled", it would have passed while reading nothing — the exact green-and-vacuous trap `docs/TESTING.md` has a section about.
- **Fix:** matched by inclusion, as every other walk in the file does, with the reason in a comment.
- **Files:** `src/lib/ui/device-ui.spec.ts` · **Commit:** e2a0005

**4. [Rule 1 - Bug] The clear walk raced the announcer.**
- **Found during:** Task 03, first e2e run — failed identically on **both** projects.
- **Issue:** the live-region log was read the instant region 3 showed `RESTORED`, and the last utterance was still `LIVE_CLEARED`. `session.speech` arrives on the store's trailing timer, so the block changes before the sentence exists.
- **Fix:** waited on `sessionLive(page)` before reading the log — the house pattern every other live-region assertion in the file already uses — once for `LIVE_CLEARED` and once for `LIVE_RESTORED`. The wait for `LIVE_CLEARED` is now itself an assertion that the clear is spoken.
- **Files:** `e2e/install.e2e.ts` · **Commit:** 1670aba

**5. [Rule 2 - Correctness] The runbook's diagnosis table gained `FACTORY DEFAULT`, and its "Twelve" became "Thirteen".**
- **Issue:** the plan scopes the runbook edit to row C. But a visitor running the row this plan widened **meets the `FACTORY DEFAULT` block**, and the section that exists to say what each block means listed twelve and did not name it.
- **Fix:** one row added after `KEPT`, and the count sentence corrected. The **checklist's** "Seven rows" sentence — the one the plan forbids editing — was not touched.
- **Files:** `docs/INSTALL-RUNBOOK.md` · **Commit:** 1670aba

**6. [Rule 2 - Correctness] `install.e2e.ts`'s header rewritten, including a departure it would otherwise have hidden.**
- **Issue:** the header said "Eleven tests", "the eleventh is the degrade path", and "**ten of the eleven titles are untagged: every one of them drives Web Serial, which the phone engine does not have**". This plan makes it thirteen titles and sixteen runs — **and one of the three tagged titles drives Web Serial through the shim**, which is exactly what that paragraph gave as the reason for leaving the others untagged.
- **Fix:** the counts corrected and the departure written in rather than left to be noticed: what the clear walk proves on `webkit-phone` is that the panel's logic, copy and enablement behave the same in WebKit at a phone viewport, and it does not and cannot prove an iPhone can install.
- **Files:** `e2e/install.e2e.ts` · **Commit:** 1670aba

**7. [Rule 2 - Scope] Two Phase-10 additions to `docs/TESTING.md`, and eight older gaps deferred.**
- **Issue:** the plan asks to "add the new suites' rows". Eleven suites are absent from `docs/TESTING.md`; only three of them are Phase 10's.
- **Fix:** the three Phase 10 suites written up; the **eight older ones named and deferred** to `deferred-items.md` rather than fixed, because none of them is this plan's and 10-14 re-measures the tree anyway.
- **Files:** `docs/TESTING.md`, `.planning/phases/10-redesign/deferred-items.md` · **Commit:** 1670aba

### Assertions of the plan the tree does not support

**a. `DEVICE_COMPONENTS` was six, not seven and not nine.** See the table above. `10-13.1-PLAN.md:331` and `10-VALIDATION.md:581` both say "six today" and are now stale by one; they must read **seven**.

**b. There is no `lastAction` on the install store.** The plan's task 02 says CLEAR's failure details are "selected by `lastAction`". The store exposes **`action`** (`InstallAction | undefined`), which is what `InstallState.svelte` reads and what the selector was inverted on. No `lastAction` identifier exists anywhere in the tree.

**c. `DeviceDetails.svelte` is in `files_modified` and needed no change.** `#ramLeg` sets `session.writeLock`, and both of the disclosure's controls are already disabled by it with `WRITE_LOCK_REASON` as their shared description, so a clear locks the header for free. `git diff --stat HEAD~3..HEAD -- src/lib/ui/DeviceDetails.svelte` is empty.

**d. The `<output>` block asks for "the eight negative checks".** The plan's own tasks specify **six** (three, two, and one investigation). All six were run and are tabulated; there is no seventh or eighth in the body to run.

**e. `ChosenPanel.svelte:217` is now `:251`.** The plan refers to region 4's reservation by line number. The **declaration is byte-untouched** — it does not appear in `git diff` at all — but the header grew by 34 lines, so the line number moved. Asserted by content (`min-block-size: 152px`) rather than by line, which is what should have been done in the first place.

**f. `TRY ON DEVICE` has no store-side enablement predicate**, so "TRY ON DEVICE enabled in `cleared`" could not be asserted against the store the way the other three were. Held from the component side instead: the primary's code names `"cleared"` zero times.

**g. Nothing gates `docs/INSTALL-RUNBOOK.md`, and nothing gates `docs/TESTING.md` either.** The plan's negative check assumed there might be something to run.

**h. `CLEAR_REASONS`'s `no-session` string is `Needs your ZONA connected.`** — the plan's prose renders it as "Needs a ZONA connected". The shipped string is `PUT_BACK_NEEDS_ZONA`, referenced rather than retyped, and is 26 characters as recorded.

## What this plan did NOT do

`10-13.1`'s aesthetic pass and its widened control register; `10-14`'s phase gate and its re-measured totals. `src/vendor/`, `src/lib/ui/Coverflow.svelte` and `src/lib/ui/DeviceDetails.svelte` are byte-untouched (`git diff --stat HEAD~3..HEAD` on all three is empty). `.planning/ROADMAP.md` was not touched. No device was connected to and nothing was deployed. No new icon and no new SVG shipped (X-22).

## Known Stubs

**None.** `Clear.svelte` renders real strings from `install-copy.ts` and drives the real `install.clearToDefault()`; every export 10-12 left unrendered (`CLEAR_LINE`, `CLEAR_REASONS`, `CLEARED_CAPTION`, `CLEARED_BODY`, `CLEARING_LABEL`, `LIVE_CLEARED`) is now on the screen and reached by both a node test and a browser walk. No hardcoded empty value, no placeholder text, no component receiving mock data.

## Verification

- `npm run check` → `COMPLETED 583 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run lint` → clean (prettier and eslint)
- `npm run test:quick | node scripts/check-counts.mjs 80 821` → *matches the expected counts* (821 passed, 1 todo)
- `npm run test:sweep` → 4 files, 19 tests, **90 s**
- `npx playwright test --workers 3 | node scripts/check-counts.mjs --playwright 101` → *observed 101 tests passed · matches the expected counts*
- `npx playwright test e2e/install.e2e.ts e2e/session.e2e.ts --workers 3` → 32 passed (the never-writes assertions re-run unchanged)
- `grep -rc "0.28em" src/lib/ui/` → 0 on every file; `grep -rn "clear-confirm" src/ e2e/` → 0
- `grep -c "border-block-start" src/lib/ui/ChosenPanel.svelte` → 2 **raw**, 1 in comment-stripped code: the second is the CSS comment saying this plan adds none, which is the strip doing exactly what this spec file's header says it exists for
- `grep -c "^| \*\*[A-G]\*\* |" docs/INSTALL-RUNBOOK.md` → **7**; the "Seven rows" sentence is unchanged
- `git diff --stat HEAD~3..HEAD -- src/vendor/ src/lib/ui/Coverflow.svelte src/lib/ui/DeviceDetails.svelte` → empty
- `test-results/` removed by hand; `git status --porcelain` empty; `wrangler dev` stopped

## Self-Check: PASSED

- `src/lib/ui/Clear.svelte` FOUND · contains `min-inline-size`
- `src/lib/ui/InstallState.svelte` FOUND · contains `FACTORY DEFAULT` (through `CLEARED_CAPTION`, whose value is `FACTORY DEFAULT`)
- `src/lib/ui/ChosenPanel.svelte` FOUND · contains `Clear`
- `e2e/install.e2e.ts` FOUND · contains `clear`
- `docs/INSTALL-RUNBOOK.md` FOUND · seven rows, row C extended
- commit `7a6f771` FOUND · commit `e2a0005` FOUND · commit `1670aba` FOUND
