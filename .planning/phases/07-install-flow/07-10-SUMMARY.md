---
phase: 07-install-flow
plan: 10
subsystem: ui
tags: [TryOnDevice, KeepOnDevice, ChosenPanel, Coverflow, never-writes-retired, D-18, five-twins, 72px, 48px, quiet-tier, column-row, Escape, WRITING, KEEPING, aria-busy, device-ui, SAFE-01, SAFE-02, SAFE-08, DEGR-02]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-09-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 83), the tree at quick 73 / 774 (one deferred load timeout, item 12), sweep `3 13`, e2e 83, svelte-check 545; the three leaves under their testids and props - PutBack (none), KeepConfirm (onclose), InstallState (name, label) - and the handoff that 07-10 renders KeepConfirm under {#if install.confirmOpen}, decides its fade OUT (item 11), renders DISCONNECT ZONA after InstallState and gives region 3 tabindex=-1"
  - "07-07-SUMMARY.md - the store's public surface read here: phase, action, config, confirmOpen, observeConfig(), keepReason(capable), openConfirm() / dismissConfirm(), tryOnDevice(config, name) with the snapshot-failed retry inside it"
  - "07-03-SUMMARY.md - install-copy.ts: HONESTY_NO_SESSION, HONESTY_READY, HONESTY_SNAPSHOTTING, HONESTY_INCAPABLE under the 129 cap; WRITING_LABEL, KEEPING_LABEL; KEEP_LABEL, KEEP_LINE_ENABLED and the closed KEEP_REASONS record under KEEP_CAP 86"
  - "07-08-SUMMARY.md - e2e/fake-serial.ts and e2e/fake-zona.ts: grant before load, beat(), delayAckMs, dropAck, mismatchRefetch, script(), seen() by class - the harness every measurement here ran on"
  - "07-UI-SPEC.md §§ The control hierarchy, Region 6, I2, I3, I9, Focus management, the Motion Contract; Z-02, Z-03, Z-05, Z-06, Z-07, Z-10, Z-18, Z-19; 07-CONTEXT.md D-01, D-02, D-10, D-15 (amended by Z-03), D-17, D-18 (edit 2); 07-VALIDATION.md rows 07-10-01 to 03"
  - "06-12-SUMMARY.md - TryOnDevice as a consumer of the session: PRIMARY its own definition, connect() with nothing awaited in front of it, release() closing nothing"
provides:
  - "src/lib/ui/TryOnDevice.svelte - the primary control that writes: Phase 4's HONESTY, IDENTIFIED_REASON and IDENTIFIED_TAIL deleted by name (D-18, the second of two edits); five honesty twins (HONESTY_NO_SESSION, HONESTY_READY, HONESTY_SNAPSHOTTING, HONESTY_INCAPABLE, budgetReason ?? tryOnBudgetReason('Setup and Timer')) in the untouched 72px one-cell grid with I9's precedence, the capability sentence first; labels PRIMARY / CONNECTING… / WRITING… (a RAM leg with action try) / KEEPING… (the store leg with action keep), aria-busy on the button under either busy label and on region 3 while writing, the swap with no transition; the click - session.connect() as the first statement when not connected, void install.tryOnDevice(config, entry.name) when connected; disabled in starting, connecting, incapable, over budget, snapshotting, writing, and in connected while install.config is undefined; $effect(() => install.observeConfig(config)) untracked; region 3 renders InstallState while connected with DISCONNECT ZONA after it, disabled while writing, and carries tabindex=-1"
  - "src/lib/ui/KeepOnDevice.svelte - the Quiet tier (Z-02): border 0, background transparent, padding-inline 0, Micro label in --color-ink-quiet to --color-ink on hover, --color-ink-dim disabled; reason = install.keepReason(capable) with capable from the session's two capability phases; disabled = reason !== undefined || writing; the click calls install.openConfirm(); a one-cell grid at min-block-size 48px (data-testid and id keep-on-device-line, bound by aria-describedby) holding KEEP_LINE_ENABLED and all six KEEP_REASONS iterated from the record as twins, the line held through a write; an exported focus() returning whether it took focus; keep-on-device-reason renamed away"
  - "src/lib/ui/ChosenPanel.svelte - the install row as one column (flex-direction: column; align-items: flex-start; gap: 16px): PutBack, then KeepConfirm under {#if install.confirmOpen} or KeepOnDevice bound for focus, then the share snippet; onclose = install.dismissConfirm(); one focus rule on every close of the confirmation (the row's KEEP ON DEVICE if it can hold focus, connect-status otherwise) applied from an effect after tick(); the block leaves instantly by decision; the panel's box, entrance, hairline and the reserved region byte-identical"
  - "src/lib/ui/Coverflow.svelte - the Escape handler's two rules before Phase 4's un-choose (Z-10): return while install.phase === 'writing'; dismissConfirm() and return while install.confirmOpen; the install store its one new import"
  - "src/lib/ui/device-ui.spec.ts 9 -> 10: test 10, comment-stripped - TryOnDevice renders exactly five class:twin lines, carries neither never-writes fragment, still reserves 72px, calls install.tryOnDevice and renders InstallState; KeepOnDevice declares border: 0 and padding-inline: 0 on its control, min-block-size: 48px on its cell, iterates KEEP_REASONS and retypes none of the six, renders KEEP_LINE_ENABLED once, carries keep-on-device-line; ChosenPanel's install-row rule declares flex-direction: column and no space-between and mounts PutBack before KeepOnDevice and KeepConfirm; Coverflow's Escape handler, sliced from its key test to the next unchoose(), holds the writing check before confirmOpen and pushes no state"
  - "The four negative checks observed and restored byte-identical: the retained never-writes literal (red on test 10 in node, and on screen in ready on a served mutated build beside an enabled control), the space-between row (a served mutated build, both readings), the dropped writing guard on Escape (a served mutated build: the panel gone mid-write, the write landing with no panel), the sixth twin (red on test 10)"
affects:
  - "07-11 reads device-ui.spec.ts at 10 and takes it to 11; extends e2e/first-experience.e2e.ts's degrade test (unedited here, green at 11) with assertions naming keep-on-device-line; owns the header lock and decides the panel's DISCONNECT ZONA reason (deferred item 14)"
  - "07-12's selectors name keep-on-device-line, keep-confirm, keep-confirm-yes, keep-confirm-no, install-state and connect-status as they ship here; its rig test pushes a ZONA heartbeat after the rig's (item 13)"
  - ".planning/phases/07-install-flow/deferred-items.md - items 14, 15 and 16 appended by the interrupted executor and kept (true on inspection; item 15 re-observed); .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 10/13, by hand"

tech-stack:
  added: []
  patterns:
    - "A promise retired by name, not by edit: the literal that promised the site never writes is deleted with its identifier, its last text recorded here, and a comment-stripped fragment scan holds the file free of the two fragments (`never writes`, `next release`) so the sentence cannot return under another constant"
    - "One reserved cell, all of its candidate strings rendered as twins, sized on the tallest at the panel's actual width - the honesty slot's mechanism at five strings (72px) and the KEEP cell's at seven (48px), so a control never moves when its line changes"
    - "A busy label rides the control that was clicked unless that control has left the screen: WRITING… on the primary for its own RAM leg, KEEPING… on the primary for the confirmation's store leg because the affirmative unmounts on the commit and the row's control returns disabled; the swap has no transition by construction (the only transitions on the control are its hover filter and glow)"
    - "A destructive control in the quietest tier that spends its weight inside the confirmation, and a confirmation that replaces the control that opened it - never both on screen - with one focus rule for every exit applied from an effect after the DOM has swapped"
    - "A keyboard shortcut that yields to state in two steps: Escape does nothing while a write is in flight (a pause, not a trap) and closes the open confirmation before it un-chooses the panel"
    - "A record left by an interrupted session is reconciled against the served build, not accepted: the task commits are candidates, every measurement is re-observed, and every negative check without evidence in a commit is performed before the SUMMARY is written"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-10-SUMMARY.md"
  modified:
    - "src/lib/ui/TryOnDevice.svelte"
    - "src/lib/ui/KeepOnDevice.svelte"
    - "src/lib/ui/ChosenPanel.svelte"
    - "src/lib/ui/Coverflow.svelte"
    - "src/lib/ui/device-ui.spec.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The honesty slot's precedence puts the capability sentence first (Z-06, I9), an amendment to Phase 6's shipped behaviour: the standing line used to stay on an incapable browser because it ended 'this never writes'; now the standing line promises a write, which on that browser would be a lie"
  - "The flash confirmation leaves instantly, by decision (deferred item 11 closed): a leaving fade would keep keep-confirm-yes on the screen for 160 ms beside the re-rendered keep-on-device - the never-both rule broken for exactly the interval a speech command could land in - and would put a ghost of the block under a control that already holds focus; the Motion Contract's appearing half is honoured in the leaf"
  - "KEEPING… rides the primary: the control that was clicked (the confirmation's affirmative) unmounts on the commit and the row's KEEP ON DEVICE returns as a quiet disabled control that cannot carry a busy label; the KEEP cell holds its last non-writing line through the leg (I3 rule 4) rather than flipping to never-tried while the store runs"
  - "The panel's DISCONNECT ZONA is a real disabled while writing (Rule 2) but carries no inline reason, because I3 rule 4 lets nothing in region 3 change during a write beyond aria-busy and the write settles inside two frames; whether it gets the header's inline reason is 07-11's (deferred item 14)"
  - "The rename keep-on-device-reason -> keep-on-device-line is a rename, not a second testid: `grep -rn keep-on-device-reason src e2e` is empty, so the Phase 4 id had no consumer outside the file and nothing else on the site pointed at it"
  - "Three task commits left by an interrupted session were treated as candidates: each task's verify block was run against the committed code, every measurement in the plan was re-observed on the served build, and the two negative checks with no evidence in any commit (the retained literal on screen, the dropped Escape guard) and the space-between row were performed on mutated builds before this SUMMARY was written - a commit message is a claim; a measurement is evidence"
  - "The full e2e run's first attempt (46 passed, 37 failed, every failure `page.goto: Could not connect to server`) was a harness drop, not a test going red, and the one permitted rerun read 83 green; the drop is recorded, not hidden"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-02, SAFE-08, DEGR-02]

# Metrics
duration: 78min
completed: 2026-09-05
---

# Phase 7 Plan 10: The panel writes - the never-writes literals retired, KEEP ON DEVICE quiet, the column row Summary

**The panel writes, and says so in the present tense. Phase 4's two literals promising the site never writes are gone by name - `HONESTY` (*"Connects to your ZONA and identifies it. Writing arrives in the next release — this never writes."*) and the identified pair `IDENTIFIED_REASON` (*"Your ZONA is already identified."*) / `IDENTIFIED_TAIL` (*"Nothing was written, and nothing will be until install ships in the next release."*) - the second of 07-CONTEXT D-18's two named edits, and the honesty slot now holds FIVE sizing twins in the same 72px one-cell grid, measured **72px in no-session, ready, snapshotting, settled and incapable** on the served build at `/c/aurora/`. The click is Phase 6's plus one branch: `session.connect()` as the first statement with nothing awaited in front of it when no session is open, `install.tryOnDevice(config, entry.name)` when one is - from `snapshot-failed` the same click re-read the module (CONFIG/FETCH 2 -> 4 with nothing written while it still answered empty) and, once fixed, landed `ready` and wrote (FETCH 6, EXECUTE 2, `PLAYING NOW`). `WRITING…` sat on the primary from **+37 to +473 ms** under `delayAckMs` 200 on CONFIG and `KEEPING…` from **+33 to +854 ms** under `delayAckMs` 800 on PAGESTORE, each with `aria-busy="true"` on the button and on region 3 and a `0s` transition on the label; the measuring window after a knob move disabled the control from **+22 to +131 ms**. `KEEP ON DEVICE` moved to the Quiet tier - `border: 0`, no fill, `padding-inline: 0`, **124.9 x 44** against the primary's **370 x 44** accent fill, with the hairline, the tuning region and `PUT BACK` between them - and its cell holds `KEEP_LINE_ENABLED` and all six `KEEP_REASONS` as twins at **48px across all seven strings** (never-tried, enabled, knobs-moved, already-kept, after-mismatch, after-partial, incapable). The install row is one column at a 16px rhythm: `PUT BACK`, `KEEP ON DEVICE` or the confirmation in its place, `COPY LINK`; when the confirmation opened `COPY LINK` moved **+144.39px** - exactly the block's 244.39 less the 100 it replaced - and `PUT BACK` moved **0**; `keep-on-device` and `keep-confirm-yes` were never on the page together; `NOT NOW` returned focus to the row's control, the commit sent it to `connect-status`. `Escape` closed the confirmation with the panel still chosen, a second un-chose, and mid-write it did nothing. `device-ui.spec.ts` 9 -> **10**; quick **73 / 775**, sweep `3 13`, e2e **83** = 73 chromium + 10 webkit-phone at `--workers 3`, svelte-check 545 / 0; `e2e/first-experience.e2e.ts` green at 11 **unedited**. Four negative checks observed and restored byte-identical, three of them on served mutated builds. The plan's three task commits were left by a session that exited before the SUMMARY; this record was written by a second executor that treated them as candidates and re-observed everything. No device was connected to, looked for or written to.**

## How this record was made

The executing session exited after the third task commit (`6c88771`) with the ROADMAP's plan checkbox and 45 lines of `deferred-items.md` on disk uncommitted, and no SUMMARY, no docs commit and STATE.md not advanced. This SUMMARY was written by a second executor that:

1. read the plan and ran each task's `<verify>` block against the committed code (all green, per-file counts below);
2. treated the three commit messages as claims and re-observed every measurement the plan names on a freshly built, served `build/` (postbuild stamped `6c88771`) through the shim and the Node responder;
3. found evidence in the commits for the sixth-twin negative and for test 10 going red on the retained literal, and in the uncommitted `deferred-items.md` item 15 for the `space-between` row - and none anywhere for the dropped `writing` guard on `Escape` or for the retained literal *on screen* - so it performed all three of those on served mutated builds (the retained literal was re-observed in both forms), and re-ran the sixth-twin negative in node because it costs a second;
4. kept the three appended deferred items after checking each against the code (item 14: `disabled={writing}` on the panel's `DISCONNECT ZONA` with no reason line, true; item 15: the row readings, re-observed and extended below; item 16: `no-unused-props` occurs 0 times in `TryOnDevice.svelte`, and quick read 73 / 775 twice today).

No code needed a further commit: nothing in the three commits was missing or wrong against the plan's acceptance criteria.

## The five-name carry-forward block

Carried verbatim from 07-09, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. `PREV_E2E` is **unchanged at 83**: this plan adds no e2e title and edits no e2e file (`first-experience.e2e.ts` is green unedited by the plan's own rule), and the full run observed 83 again.

| Name         | Value                      | Note                                                                                                                                  |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **73** (+ 4)                                                                                     |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6, 07-06 + 8, 07-07 + 10, 07-08 + 0, 07-09 + 2 (774); this plan adds **1** (`device-ui.spec.ts`). Tree: **775** (+ 51) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                      |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**                                                                                     |
| `PREV_E2E`   | **83 (measured by 07-08)** | Unchanged; observed **83** here (73 chromium + 10 webkit-phone); rolls at 07-12 and 07-13                                              |

`BASE_CHECK` (provenance only): **545 files, 0 errors, 0 warnings** (unchanged from 07-09: four components amended, none added).

### Observed totals: previous SUMMARY plus this plan's delta

07-09 left the tree at **73 / 774**, sweep `3 13`, e2e 83, svelte-check 545. This plan's delta is **+0 files / +1 test / +0 e2e / +0 checked files**.

```
npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts       # on the committed code
  Test Files  6 passed (6)      Tests  46 passed (46)     (identity 6, tune-ui 5, device-ui 10, config-shape 14, browse-ui, glyph-field)

npx vitest run --project server src/lib/ui/device-ui.spec.ts --reporter verbose
  ✓ ... the honesty slot holds five twins and no never-writes literal, KEEP ON DEVICE is borderless, and the install row is a column
  Tests  10 passed (10)

npm run build                                                                    # clean, before quick
  postbuild: 6c88771c0cad082d7c292a527ada7c93c35d5e55 - LICENSE, THIRD-PARTY.md and licenses/ copied into build/

npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 775
  check-counts: observed 73 files, 775 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts                                     (lua-entries.spec.ts test 6 inside the budget - item 12 did not reproduce)

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788622738358 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)

npx playwright test e2e/first-experience.e2e.ts --project chromium
  11 passed (34.4s)                       git diff --quiet -- e2e/first-experience.e2e.ts -> exit 0 (unedited)

npx playwright test --workers 3                                                  # run 1
  37 failed   46 passed (1.5m)            every failure: Error: page.goto: Could not connect to server  (the webServer dropped; no test red)
npx playwright test --workers 3                                                  # run 2, the one permitted rerun
  83 passed (1.5m)                        [chromium] 73   [webkit-phone] 10
```

### Per-file counts after this plan

| File                             | Before | After  | Plan said |
| -------------------------------- | ------ | ------ | --------- |
| `src/lib/ui/device-ui.spec.ts`   | 9      | **10** | 10        |
| `src/lib/config-shape.spec.ts`   | 14     | **14** | 14        |
| `src/lib/ui/identity.spec.ts`    | 6      | **6**  | 6         |
| `src/lib/ui/tune-ui.spec.ts`     | 5      | **5**  | 5         |

## Task 1 - TryOnDevice: the five twins, the busy labels, the click that writes (commit `7715766`)

`src/lib/ui/TryOnDevice.svelte`, 493 -> **599 lines** (+257 / -151). The header's "It cannot write" paragraph is now *"IT WRITES, ON A CLICK, AND NOTHING ELSE ON THE PAGE CAN"*, naming D-18's second edit and keeping what is still a property of the file (no `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage` or transport write below the comment). The paragraph that says the layout belongs to `ChosenPanel` stays. The honesty slot's style comment reads *"This slot holds one of FIVE sentences (07-UI-SPEC Z-06)"*.

### The named retirement

Three constants deleted, their last text:

| Identifier | Last text | Where it was |
| ---------- | --------- | ------------ |
| `HONESTY` | `Connects to your ZONA and identifies it. Writing arrives in the next release — this never writes.` | the standing honesty line, Phase 4's |
| `IDENTIFIED_REASON` | `Your ZONA is already identified.` | the honesty slot in `connected` |
| `IDENTIFIED_TAIL` | `Nothing was written, and nothing will be until install ships in the next release.` | region 3's identified body, after `identitySentence(fw, page)` |

In their place: `HONESTY_NO_SESSION`, `HONESTY_READY`, `HONESTY_SNAPSHOTTING`, `HONESTY_INCAPABLE` from `install-copy` and `budgetReason ?? BUDGET_SIZING` (`tryOnBudgetReason("Setup and Timer")`, the real function). The connected state renders `<InstallState name={entry.name} label={PRIMARY} />`, whose `ready` block is `identifiedBody(fw, page)` naming `PUT BACK` (Z-07).

### The fragment scan, quoted (comment-stripped code; raw counts beside it)

```
src/lib/ui/TryOnDevice.svelte  raw 24677  stripped 7131  lines 600
   "never writes"                 code: 0  raw: 2      (the header's two prose mentions of the retired promise)
   "next release"                 code: 0  raw: 0
   "HONESTY_"                     code: 8  raw: 8      (four imports, four renders)
   "class:twin"                   code: 5  raw: 5
   "min-block-size: 72px"         code: 1  raw: 2
   "install.tryOnDevice"          code: 1  raw: 3
   "aria-busy"                    code: 2  raw: 6      (the button, region 3)
   "transition"                   code: 1  raw: 3      (.primary's hover filter and glow, Phase 4's)
```

### The handler, quoted

```ts
function tryOnDevice(): void {
  if (session.phase !== "connected") {
    session.connect();
    return;
  }
  void install.tryOnDevice(config, entry.name);
}
```

`session.connect()` is the first statement of the not-connected branch with nothing awaited before it. The `disabled` rule: `session.phase === "starting" || connecting || incapable || budgetReason !== undefined || install.phase === "snapshotting" || writing || (connected && install.config === undefined)`. The pair reaches the store through `$effect(() => { const pair = config; untrack(() => install.observeConfig(pair)); })`.

### The four measurements, on the served build at `/c/aurora/`

Harness: a clean `npm run build` (postbuild `6c88771`), served by a scratch `node:http` static server over `build/` on **127.0.0.1:4174** (port 4173 never used), driven by a scratch Playwright spec (`e2e/measure-0710.probe.ts` with its own six-line config - a suffix the shipped `**/*.e2e.ts` never collects; both untracked inside the repo for module resolution, copied to the scratchpad, deleted before the commit) using `e2e/fake-serial.ts` and `e2e/fake-zona.ts` exactly as `install.e2e.ts` does: the port granted before load, `TRY ON DEVICE` clicked once, heartbeats pushed until `ZONA IDENTIFIED`. A `MutationObserver` on the body recorded every change of the label, `disabled`, `aria-busy`, region 3's `aria-busy`, the slot's height and its visible line with a timestamp, so the transients are on the record. Console errors over the whole walk: **none**.

**1. The honesty slot is one height across all five strings** - `#try-on-reason`, five `<p>`, four with `visibility: hidden` and `aria-hidden="true"` in every state:

| State | How reached | Height | Visible line |
| ----- | ----------- | ------ | ------------ |
| no-session (`detected`) | before the click | **72** | `Connects to your ZONA, then writes this configuration into its memory. About a second, and only in memory.` |
| snapshotting | the recorder caught it at **+493 ms** after the click, for 13 ms, with the button `disabled` and region 3 reading `READING ZONA` | **72** | `Reading what is on your ZONA now, so nothing you do here is one-way.` |
| ready | `ZONA IDENTIFIED` | **72** | `Writes this configuration into your ZONA’s memory in about a second. A power cycle brings your own back.` |
| settled | after the write | **72** | the ready line (writing swaps no line - I3 rule 4) |
| incapable | a second page with `Navigator.prototype.serial` deleted; the control `disabled`, region 3 naming `Firefox 151` | **72** | `This browser cannot write to a ZONA. Everything else on this page works.` |
| budget | not reachable on `/c/aurora/`; the fifth `<p>` renders `tryOnBudgetReason("Setup and Timer")` as a hidden twin and is counted among the four hidden | - | - |

Phase 5 measured the same slot at 72px with three twins; the number is the same with five, and the mechanism is untouched.

**2. The busy labels.** `delayAckMs` 200 on CONFIG (strictly under `executeMs` 250, so both acknowledgements land on attempt 1):

```
{"t":0,   "label":"TRY ON DEVICE","disabled":false,"busy":null,  "statusBusy":null,  "honestyH":72,"caption":"ZONA IDENTIFIED"}
{"t":37,  "label":"WRITING…",     "disabled":true, "busy":"true","statusBusy":"true","honestyH":72,"caption":"ZONA IDENTIFIED"}
{"t":473, "label":"TRY ON DEVICE","disabled":false,"busy":null,  "statusBusy":null,  "honestyH":72,"caption":"PLAYING NOW"}
```

`WRITING…` for 436 ms (two 200 ms holds plus the round trips), `aria-busy="true"` on the button and on `connect-status`, the resting label back with `PLAYING NOW`; the wire read CONFIG/EXECUTE 2, CONFIG/FETCH 2. The label's computed `transition-property / transition-duration` is **`all / 0s`** in every state (no `transition` on `.label`). Then `delayAckMs` 800 on PAGESTORE (under `pagestoreMs` 3000) after the confirmation's commit:

```
{"t":0,   "label":"TRY ON DEVICE","disabled":false,"busy":null,  "statusBusy":null,  "caption":"PLAYING NOW"}
{"t":33,  "label":"KEEPING…",     "disabled":true, "busy":"true","statusBusy":"true","caption":"PLAYING NOW"}
{"t":854, "label":"TRY ON DEVICE","disabled":false,"busy":null,  "statusBusy":null,  "caption":"KEPT"}
```

During `KEEPING…`: `document.activeElement` was `connect-status`, `keep-on-device` was back on the page (1) and `keep-confirm-yes` gone (0), the KEEP control `disabled` with its cell still showing the enabled line (held through the write), and `KEPT` arrived after 4 pushed heartbeats (the D-12 proof). The wire: CONFIG/EXECUTE 4 (two try-ons by then), PAGESTORE/EXECUTE 1.

**3. From `snapshot-failed` the click retries and writes only if the snapshot lands.** A module answering empty: `TRY ON DEVICE` connected it and region 3 read `Nothing to put back yet … Click TRY ON DEVICE to try reading it again`, the control enabled, the wire FETCH 2 / EXECUTE 0. A click while it still answered empty: FETCH **4**, EXECUTE **0** - retried, refused, nothing written. The module fixed between clicks, the same click: `READING ZONA` at +38, `ZONA IDENTIFIED` at +58, `WRITING…` at +59, `PLAYING NOW` at +63; FETCH **6**, EXECUTE **2**.

**4. The measuring window.** With a 2 ms poll on `disabled` started before `ArrowRight` on the first rail: `[[0,false],[22,true],[131,false]]` - disabled from +22 to +131 ms, enabled again once the meters settled (the 120 ms debounce plus the recompile; 07-10's first executor read 124).

### The negative check: the retained literal

`{HONESTY_READY}` in the ready twin replaced by Phase 4's `HONESTY` text, one occurrence. In node, `device-ui.spec.ts` test 10 (1 failed, 9 passed): `AssertionError: TryOnDevice's code still carries "never writes" - a Phase 4 promise that the site never writes, beside a control that does: expected 1 to be +0`. On the served mutated build, in `ready`: the visible honesty line read **`Connects to your ZONA and identifies it. Writing arrives in the next release — this never writes.`** with `TRY ON DEVICE` **enabled** (`disabled: false`) directly above it - a sentence promising the site never writes beside a button that does. Restored from `HEAD`: `TryOnDevice.svelte` `e7f633db245e2be2…` IDENTICAL.

## Task 2 - KeepOnDevice goes quiet, the row becomes a column, Escape learns two rules (commit `71596c8`)

`src/lib/ui/KeepOnDevice.svelte`, **220 lines** (+208 / -57 against Phase 4's). The header replaces "cannot be clicked throughout Phase 4" with what it does: the click calls `install.openConfirm()` and the panel renders `KeepConfirm` in this control's place; why the Quiet tier (Z-02); why the cell reserves 48px and holds all seven strings (Z-18); why the line is held through a write (I3 rule 4). `capable = session.phase !== "unsupported" && session.phase !== "insecure"`; `reason = install.keepReason(capable)`; `disabled = reason !== undefined || writing`; `held` written from an effect on the phase, `shown = writing ? held : reason`; `REASONS = Object.entries(KEEP_REASONS)`, iterated with `{#each}` keyed. `export function focus(): boolean` for the panel's focus rule. Two static specifiers plus the session: `$lib/device/install.svelte`, `$lib/device/install-copy`, `$lib/device/session.svelte`.

The rename: `grep -rn "keep-on-device-reason" src e2e` -> **empty** (exit 1). The Phase 4 id had no consumer outside the file; `keep-on-device-line` is the cell's id and testid.

The declarations, quoted:

```css
/* KeepOnDevice.svelte .control */          /* ChosenPanel.svelte */
padding-inline: 0;                            .install-row {
border: 0;                                      display: flex;
background: transparent;                        flex-direction: column;
                                                align-items: flex-start;
/* KeepOnDevice.svelte .cell */                 gap: 16px;
min-block-size: 48px;                         }
```

`src/lib/ui/ChosenPanel.svelte`, **255 lines** (+119 / -). The header's row paragraph is now *"THE INSTALL ROW IS A COLUMN, AND THE ARITHMETIC FORCES IT"* with the arithmetic (372px content column, two cells side by side giving each Body sentence about 178px, roughly twenty characters against the 43 this design measures at), *"THE CONFIRMATION REPLACES THE CONTROL THAT OPENED IT"* with the instant-leave decision (item 11), and *"THE ONE FOCUS RULE"*. DOM order: `<PutBack />`, `{#if install.confirmOpen}<KeepConfirm {onclose} />{:else}<KeepOnDevice bind:this={keep} />{/if}`, `{@render share?.()}`. `onclose` calls `install.dismissConfirm()`; the focus return is an effect on `install.confirmOpen` that, on the open -> closed edge, awaits `tick()` and calls `keep?.focus()`, falling to `[data-testid="connect-status"]` when the control cannot hold focus. `.panel`, `.reserved` (152px), `.rule` and the entrance are byte-identical.

`src/lib/ui/Coverflow.svelte`, +16 lines: the import of the install store and the handler, quoted:

```ts
function onWindowKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !chosen) return;
  if (install.phase === "writing") return;
  if (install.confirmOpen) {
    event.preventDefault();
    install.dismissConfirm();
    return;
  }
  event.preventDefault();
  unchoose();
}
```

with a comment naming Z-10 and I3 rule 9 (*"a pause, not a trap"*).

### The five measurements, on the served build

**1. The KEEP cell is one height across the enabled line and all six reasons** - `keep-on-device-line`, seven `<p>`, six hidden in every state:

| Line | How reached | Height |
| ---- | ----------- | ------ |
| `Available after a try-on.` (never-tried) | before any session, and in `ready` | **48** |
| `Stores this configuration in your ZONA’s own memory, so it survives a power cycle.` (enabled) | `settled` | **48** |
| `Try it on again first — the knobs moved since the last try-on.` (knobs-moved) | `ArrowRight` on a rail after `settled` | **48** |
| `Kept on your ZONA. Turn a knob and try it on again to keep a new one.` (already-kept) | `KEPT` | **48** |
| `Try it on again first, then keep it again.` (after-mismatch) | a knob, a try-on, a keep with `mismatchRefetch` | **48** |
| `Not after a half-written try-on. Send it again, or put your own back.` (after-partial) | a knob, a try-on with the Setup write's three acknowledgements dropped | **48** |
| `This browser cannot write to a ZONA.` (incapable) | the second page with no `navigator.serial` | **48** |

48px by arithmetic (two Body lines) and 48 in the browser, in every state, with the control's box **124.92 x 44** throughout.

**2. Enabled after a settled try-on, disabled by a knob turn with the confirmation closing, re-enabled by turning back.** After `PLAYING NOW`: `keep-on-device` enabled, the cell on the enabled line. `ArrowRight` on the first rail: disabled with `knobs-moved`. `ArrowLeft`: enabled again (identical strings re-arm). With the confirmation open, `ArrowRight`: `keep-confirm` count **0** within the poll, the row's control back disabled with `knobs-moved`, and focus on `connect-status` (the control could not hold it - the focus rule's second branch).

**3. The confirmation replaces the control; the focus rule; Escape's two rules.** Open: `keep-on-device` **0**, `keep-confirm-yes` **1**, `activeElement` `keep-confirm`. `NOT NOW`: `keep-on-device` **1**, `keep-confirm-yes` **0**, `activeElement` **`keep-on-device`**. Open again, `Escape`: the block gone, `chosen-panel` **1**, focus on `keep-on-device`. A second `Escape`: `chosen-panel` **0**. Re-chosen with `Enter` on the row: the panel back on `PLAYING NOW` with the session and the settled store intact. A try-on under `delayAckMs` 200 with `Escape` pressed while the label read `WRITING…` (`aria-busy="true"`): `chosen-panel` **1** at the press and **1** after the write settled, with the recorder showing `WRITING…` from +33 to +454 ms and the panel count 1 at every entry.

**4. `COPY LINK` moves by exactly the confirmation's height; `PUT BACK` does not move** - offsets from the panel's top, in `settled`:

| | before | with the confirmation open | after `NOT NOW` |
| - | ------ | -------------------------- | --------------- |
| `try-on-device` top | 25 | 25 | 25 |
| `put-back` top | 866.39 | **866.39** | 866.39 |
| `keep-on-device` top / `keep-confirm` top | 1006.39 | 1006.39 (the block, **244.39** tall) | 1006.39 |
| `keep-on-device-line` top, height | 1058.39, 48 | - | 1058.39, 48 |
| `copy-link` top | 1122.39 | **1266.78** | 1122.39 |
| panel height | 1247.39 | 1391.78 | 1247.39 |

`COPY LINK` moved **+144.39** = 244.39 (the block) - 100 (the 44px control, the 8px gap and the 48px cell it replaced); the panel grew by the same 144.39; `PUT BACK` moved **0**. (The first executor's absolute reading, 144.39 with `PUT BACK` at 0, is the same number; the confirmation's focus scrolls the viewport, so the panel-relative reading is the one worth quoting.)

**5. The two install controls are never the same size, fill or neighbours** - viewport-absolute, in `settled`, top to bottom:

| Element | top | bottom | size | fill | border |
| ------- | --- | ------ | ---- | ---- | ------ |
| `try-on-device` | 338.39 | 382.39 | **370 x 44** | `rgb(214, 255, 78)` (the accent) | 1px |
| `tuning-reserved` | 680.78 | 1130.78 | 370 x 450 | none | 1px dashed |
| `hr` (the hairline) | 1154.78 | 1155.78 | 370 x 1 | - | 1px top |
| `put-back` | 1179.78 | 1223.78 | 108.83 x 44 | none | 1px |
| `keep-on-device` | 1319.78 | 1363.78 | **124.92 x 44** | **none** | **0px** |
| `copy-link` | 1435.78 | 1479.78 | 114.33 x 44 | none | 1px |

### The two negative checks, on served mutated builds

**The `space-between` row.** `.install-row` set back to Phase 5's exact rule (`display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between`, recovered from `git show 71596c8^`), built and served, with a snapshot in hand so all three cells were in the row. As built (wrapping): the three cells **stacked** - `put-back` at 0, `keep-on-device` at **132**, `copy-link` at **240** from the row's top, the keep cell **370px wide and 48 tall** - Z-03's "column pretending to be a row" at an 8px rhythm, which is what item 15 recorded (its two-cell tops 1384.39 and 1492.39 are the same 108px apart). Forced onto one line (`flex-wrap: nowrap` on the served element): `PUT BACK` 108.83, `KEEP ON DEVICE` **110.05** and `COPY LINK` 101.86 wide, side by side at tops 0 / 0 / 0, and the 82-character keep line ran to **seven** Body lines, **168px** - about twelve characters a line; item 15's two-cell reading (200px wide, 96px, four lines, about twenty characters) is the same defect with one cell fewer. Restored from `HEAD`: `ChosenPanel.svelte` `ffd1538e68254e6a…` IDENTICAL.

**The missing `writing` guard on Escape.** The line `if (install.phase === "writing") return;` deleted from the handler (one occurrence), built and served (in the same mutated build as the retained literal). A try-on under `delayAckMs` 200, `Escape` pressed while the label read `WRITING…`: `chosen-panel` **0** at once - the panel un-chose mid-write. 1.2 s later: `chosen-panel` still **0**, `install-state` **0** on the page, and the wire read CONFIG/EXECUTE **2** - the write landed with no surface to report it. Re-chosen with `Enter`: region 3 read `PLAYING NOW` from a write nobody watched. Restored from `HEAD`: `Coverflow.svelte` `a5c4b519cd51a0ad…` IDENTICAL.

## Task 3 - the tenth gate, and a build (commit `6c88771`)

`src/lib/ui/device-ui.spec.ts`, 710 -> **851 lines**, 9 -> **10**. Test 10, *"the honesty slot holds five twins and no never-writes literal, KEEP ON DEVICE is borderless, and the install row is a column"*, comment-stripped throughout: `TryOnDevice.svelte` renders exactly five `class:twin` lines, contains neither `never writes` nor `next release` (fragment-assembled needles, with the raw header proven to name one so the strip is load-bearing), still declares `min-block-size: 72px`, calls `install.tryOnDevice` and renders `InstallState`; `KeepOnDevice.svelte` declares `border: 0` and `padding-inline: 0` on its control's rules and `min-block-size: 48px` on its cell, iterates `KEEP_REASONS` (`Object.entries(KEEP_REASONS)` then `{#each REASONS`) and retypes none of the six, renders `{KEEP_LINE_ENABLED}` once and carries `data-testid="keep-on-device-line"`; `ChosenPanel.svelte`'s `.install-row` rule declares `flex-direction: column` and no `space-between`, and mounts `<PutBack` before `<KeepOnDevice` and `<KeepConfirm`; `Coverflow.svelte`'s `Escape` handler, **sliced** from `event.key !== "Escape"` to the next `unchoose()`, contains `install.phase === "writing"` before `install.confirmOpen` and no `pushState` - the file's first `pushState` is `choose()`'s, before the handler, which is why the slice and not the file is read.

`config-shape.spec.ts` test 14 after a fresh build: **green** (14 passed) - the front door still does not preload the protocol chunk with the install store on the first paint; run three times today on three clean builds (after each mutation's restore).

### The negative check: the sixth twin

A sixth `<p class="line" class:twin={true} aria-hidden="true">{HONESTY_READY}</p>` appended inside `.honesty`. Test 10 (1 failed, 9 passed): `AssertionError: the honesty slot renders exactly five sizing twins (Z-06): expected 6 to be 5`. Restored from `HEAD`: `TryOnDevice.svelte` `e7f633db245e2be2…` IDENTICAL.

## Files created and modified

- `src/lib/ui/TryOnDevice.svelte` - modified (`7715766`); 599 lines
- `src/lib/ui/KeepOnDevice.svelte` - modified (`71596c8`); 220 lines
- `src/lib/ui/ChosenPanel.svelte` - modified (`71596c8`); 255 lines
- `src/lib/ui/Coverflow.svelte` - modified (`71596c8`); 1048 lines
- `src/lib/ui/device-ui.spec.ts` - modified (`6c88771`); 9 -> 10; 851 lines
- `.planning/phases/07-install-flow/07-10-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - items 14, 15 and 16 appended by the first executor, kept; item 15 extended with the three-cell re-observation
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 10/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 2 - Missing guard] the panel's `DISCONNECT ZONA` is a real `disabled` while `writing`**
- **Found during:** Task 1 (the first executor). 07-UI-SPEC I3 rule 10 and Z-15 lock the HEADER's `DISCONNECT ZONA` and `FORGET THIS ZONA` while writing; they say nothing about the panel's, which calls the same `session.disconnect()` with no write-lock guard of its own - pulling the port from the panel under a RAM write is the one way a visitor can create `partial` with their own hand.
- **Fix:** `disabled={writing}` on the panel's control, without a reason line (I3 rule 4: nothing in region 3 changes during a write beyond `aria-busy`, and the write settles inside two frames). Whether it gets the header's inline reason is 07-11's - deferred item 14.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`. **Commit:** `7715766`.

**2. [Rule 3 - Blocking] the measurement harness ran from inside the repository**
- **Found during:** Task 1's measurements (this executor, as 07-09's deviation 2): a spec outside the repository cannot resolve `@playwright/test` or the tsconfig paths `fake-zona.ts` needs for `$lib/protocol`.
- **Fix:** `e2e/measure-0710.probe.ts`, `e2e/row-0710.probe.ts` and `pw-0710.config.ts` (a `**/*.probe.ts` match the shipped config never collects) as untracked files, run, copied to the scratchpad, deleted; `build/` served by a scratch `node:http` server on 4174, killed by PID after each run; `git status` shows neither.
- **Files modified:** none kept.

### Departures recorded, not deviations from the plan

1. **The plan was completed across two sessions.** The first executor made the three task commits and left the ROADMAP checkbox and 45 lines of `deferred-items.md` uncommitted; it wrote no SUMMARY and did not advance STATE.md. The second executor reconciled (see *How this record was made*), re-observed every measurement, performed the three negative checks with no evidence in a commit, and wrote this record. No code changed between `6c88771` and the docs commit.
2. **The full e2e run needed the one permitted rerun** for a harness drop, not a test: run 1 read 46 passed / 37 failed with every failure `page.goto: Could not connect to server` (the `wrangler dev` webServer stopped answering mid-run; no listener on 4173 afterwards); run 2 read **83 passed**, 73 chromium + 10 webkit-phone.
3. **The `space-between` negative was observed in two forms.** Phase 5's exact rule at 372px does not put the sentences side by side - `flex-wrap` engages before `flex-shrink` because each cell's max-content width exceeds the line - so the cells STACK at an 8px rhythm (the row's real defect); the plan's "about twenty characters a line" reading needs `nowrap`, and was observed that way too (item 15).
4. **Measurement 1's `snapshotting` height was caught by a recorder, not by pausing the responder**: the fake's `delayAckMs` holds acknowledgements only and a fetch answers with a REPORT, so the state lasts about 13 ms; a `MutationObserver` reading the slot's height at each DOM change recorded it at 72px with the button disabled and `READING ZONA` in region 3.
5. **The `Escape` handler calls `event.preventDefault()` before `dismissConfirm()`**, one line the interfaces sketch did not show; it is the same call Phase 4's un-choose branch makes, so the two branches behave as one at the window.
6. **`svelte/no-unused-props` is gone from `TryOnDevice.svelte`** (deferred item 6 closed) because `config` is now read; `npm run lint` exit 0.

## Known stubs

None. Every control on the panel is wired to the store: `TRY ON DEVICE` writes (observed: CONFIG/EXECUTE 2 per try-on), `KEEP ON DEVICE` opens the confirmation whose commit stores (PAGESTORE/EXECUTE 1, `KEPT` after the proof), `PUT BACK` is 07-09's. The budget twin renders `tryOnBudgetReason("Setup and Timer")` as a hidden sizing string while the configuration fits; it is the reservation, not a placeholder, and Phase 5's `/dev/tune/` reserve is where its visible form is measured.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-02, SAFE-08, DEGR-02]`** - contributed, not completed; every Phase 7 criterion carries a *(hardware)* half and 07-13 closes them. SAFE-01: the panel's two never-writes literals are retired and the sentence is true in the present tense; every write observed here was one click's (a try-on: CONFIG/EXECUTE 2; a keep: PAGESTORE/EXECUTE 1; a whole connect-and-snapshot journey: 0 of either), and the comment-stripped scan holds the file free of the retired promise. SAFE-02: three tiers on one panel, measured - the accent-filled 370 x 44 primary, the bordered `PUT BACK`, the borderless 124.9 x 44 `KEEP ON DEVICE` - with the hairline, the tuning region and `PUT BACK` between the two install controls. SAFE-08: the settled state shows `PLAYING NOW` with the resting label back on an enabled control, `aria-busy` gone, and a `0s` transition on the label - nothing animating. DEGR-02: on a browser with no `navigator.serial` the control is present and `disabled` with `HONESTY_INCAPABLE` in the slot and the transport's reason in region 3, and `KEEP ON DEVICE` is present and `disabled` with `This browser cannot write to a ZONA.` in its cell, both cells at their reserved heights. `REQUIREMENTS.md` is not edited here, as no Phase 7 plan before 07-13 edits it.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md` by the first executor and kept:

- **Item 14** - the panel's `DISCONNECT ZONA` disabled while writing with no inline reason; 07-11 decides.
- **Item 15** - the `space-between` negative is unobservable in the plan's words with Phase 5's exact rule (the cells stack); recorded with both readings, and extended here with the three-cell re-observation.
- **Item 16** - items 6, 11 and 12 closed by 07-10 (`config` read and the lint directive gone; the confirmation leaves instantly by decision; quick 73 / 774 then 73 / 775 with no timeout on a quiet machine - and 73 / 775 again today).

Items 1-13 are unchanged.

## Next plan readiness

07-11 (the header lock, the snapshot line, and the degrade test extended) starts from: quick **73 / 775**, sweep `3 13`, e2e **83** (73 + 10, observed), svelte-check 545 / 0, `device-ui.spec.ts` at **10**. The panel is wired: `TryOnDevice` writes through `install.tryOnDevice` and renders `InstallState` in region 3 with `connect-status` as a `tabindex="-1"` focus target; `KeepOnDevice` exposes `focus()` and its cell is `keep-on-device-line` (the id `aria-describedby` names and the testid 07-11's degrade assertions and 07-12's selectors use); `ChosenPanel` swaps `KeepConfirm` in under `install.confirmOpen`; `Coverflow`'s `Escape` yields to `writing` and to the open confirmation. `e2e/first-experience.e2e.ts` is green and unedited, with the capability block still read from `connect-status` - 07-11 extends its degrade test with appended assertions and no new title. The panel's `DISCONNECT ZONA` is disabled while writing without an inline reason (item 14) - 07-11 owns that decision alongside the header lock. The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every byte a page wrote in this plan landed in the shim.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T15:53:01Z.

- FOUND: `.planning/phases/07-install-flow/07-10-SUMMARY.md`
- FOUND: `src/lib/ui/TryOnDevice.svelte` (599 lines), `KeepOnDevice.svelte` (220), `ChosenPanel.svelte` (255), `Coverflow.svelte` (1048), `device-ui.spec.ts` (851; 10 passed) - each byte-identical to HEAD after the mutated builds (`git diff --quiet HEAD` exit 0; sha256 `e7f633db…`, `755be6e8…`, `ffd1538e…`, `a5c4b519…`, `d33959c8…`)
- FOUND: commits `7715766` (task 1), `71596c8` (task 2), `6c88771` (task 3)
- PASS: `npx vitest run --project server src/lib/ui/device-ui.spec.ts src/lib/config-shape.spec.ts` 24 passed (10 + 14) on the final clean build; quick 73 / 775 and sweep `3 13` through check-counts; svelte-check 545 / 0 / 0; `npm run lint` exit 0; `first-experience.e2e.ts` 11 passed unedited; full e2e 83 passed (73 chromium + 10 webkit-phone) at `--workers 3` on the rerun
- PASS: four negative checks observed (two in node, three on served mutated builds) and every restore hashed IDENTICAL to HEAD
- PASS: no `*.probe.ts`, no `pw-0710.config.ts`, no `test-results/` in the tree; no listener on 4173 or 4174; `build/` rebuilt from the restored tree (postbuild `6c88771`)
- `grep -rn keep-on-device-reason src e2e`: empty; attribution lines in the three task commits and this record: 0
