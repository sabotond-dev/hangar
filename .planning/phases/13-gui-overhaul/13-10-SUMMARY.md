---
phase: 13-gui-overhaul
plan: 10
subsystem: ui
tags:
  [
    inspector,
    budget-meter,
    error-surface,
    tune-05,
    midi-monitor,
    lua-host-log,
    coalescing,
    ring-cap,
    d-14-q4b,
    randomize-scope,
    section-7,
    undo-randomize,
    one-vector,
    mix-two-deleted,
    d-12,
    radius-allowlist,
    counts,
    negative-check,
    copy-ledger,
    concurrency,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 09
    provides: "TuningRegion.svelte as the inspector with the two meters as the Inspector's children after its last section; data-testid=monitor-slot under the surface; tune-ui.spec.ts at 11 titles; the radius allowlist at 4 rows / 7; 88 / 899 (+1 todo) measured before 12.1-02; the five-chunk e2e harness in the scratchpad"
  - phase: 13-gui-overhaul
    plan: 03
    provides: "--color-over renamed --color-error-ink; --color-error-surface shipped with no consumer and 13-10 named for it; the alarm census title left pointing at the new name"
  - phase: 13-gui-overhaul
    plan: 04
    provides: "the still motion control (os || still into SimHost) that the monitor must not fight"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask; no radius), D-05 (the register), D-12 (MIX TWO is cut), D-14 Q4b (the monitor on Lua entries only), D-15 (six circles by line)"
  - phase: 12-touch-framework
    plan: 05
    provides: "tune-ui.spec.ts's shape as 12-05 left it (read only; 12-05 did not modify the file)"
provides:
  - "THE 908 METERS SURVIVE THE REDESIGN INSIDE THE INSPECTOR, on 13-03's error pair and squared: BudgetMeter.svelte's track, fill and ghost at no radius (its allowlist row cleared), BudgetMessage.svelte's over-budget block on --color-error-surface (the token's first and only consumer under src/lib/ui/) with the rule in --color-error-ink and the sentence in ink; every string, test id and class the e2e over-budget titles read unchanged; TUNE-05's five clauses each proved surviving by e2e/tuning.e2e.ts tests 9 and 10 in the browser (20 / 20)"
  - "THE MIDI MONITOR IS A RENDER OF THE LOG THE LUA HOST ALREADY KEEPS: src/lib/sim/monitor.ts (pure - midiLogOf, MonitorLog with COALESCE_WINDOW_MS = 100 and MONITOR_CAP = 200, describeMessage / describeChannel / describeValue / describeTime) and src/lib/ui/MidiMonitor.svelte (PDF page 5's collapsed bar, aria-expanded, section 10's six-column table newest first, xN on a folded row, Pause / Resume and Clear at 44px, a self-rescheduling setTimeout only while open and not paused, no aria-live, no rAF, no radius), mounted by the workspace inside {#if listed.preview === lua} with a closure over the live engine - ABSENT on the nine preset-backed entries, not present and empty; the declined src/vendor/ divergence named with D-14 Q4b in both headers"
  - "RANDOMIZE PRESERVES THE WIRE BY ONE PREDICATE OVER THE DESCRIPTORS: surprise.ts's isMidiDestination reads the words of a knob's id and label (cc, channel, midi, controller, send; camelCase split), rollable() is the roll's domain, and surpriseIndices keeps a MIDI destination exactly as it keeps a held knob; 29 knobs on 20 entries excluded, listed below and held by surprise.spec.ts test 6; TuningRegion partitions its MIDI output section with the same predicate, so the section and the scope cannot drift; SURPRISE_ROLL_LIMIT, SURPRISE_BUDGET_MS, every knob's kind and option count unmoved"
  - "UNDO RANDOMIZE IS ONE VECTOR AND ONE CLICK: Tuner.surprise() resolves to a copy of the vector it replaced, Tuner.restore(indices) moves every knob there in one recompile, TuningRegion keeps exactly one (`undo`) - set by a roll, cleared by Undo itself and by any hand move - and the button (section 7's words, verbatim) is disabled while it is undefined; the header says it is NOT general undo and names 13-16"
  - "MIX TWO IS GONE BY NAME (D-12): MixTwo.svelte, mix.ts and mix.spec.ts deleted with git rm, four titles quoted below, instrument.spec.ts's PILLED row removed, colour-picker.spec.ts test 6 re-aimed from six / eight to two / four and retitled, copy.ts's MIX_TWO / MIX_LINE / MIX_THIS / MIX_THAT / mixChildName left standing for 13-19, MixTwo's allowlist row gone with the file"
  - "COUNTS: 88 / 906 (+1 todo) observed at 5f0ffbf (13-09's 88 / 899 plus 12.1-02's +7, with 12.1-01's +1 / +4 already inside 13-09's figure) -> 87 / 905 (+1 todo) on this plan's own term, -1 / -1 in parts (mix.spec.ts -2; tune-ui.spec.ts -2 +3 = 11 -> 12, then -2 +1, i.e. 11 -> 12 -> 11; surprise.spec.ts +1); the tree reads 87 / 907 because the other agent's lua-smoke.spec.ts is +2 in flight; e2e 78 / 94 in and out, five chunks green with one HEAD-moved red rerun 3 / 3; check 612 after task 1 and 609 after task 2 (net -1); sweep 4 19; allowlist 4 rows / 7 -> 2 rows / 2"
affects:
  - "13-11 (the workspace's status zone still empty; DeviceDetails and KeepConfirm are the last two allowlist rows; TRY ON DEVICE's disabled reason still reaches it through onbudget)"
  - "13-16 (general undo is the Sandbox's draft history - the region's one-vector Undo randomize is not it and says so)"
  - "13-18 (eight monitor rows ledgered; one question: SURPRISE_ALL_HELD's sentence is imprecise now that MIDI knobs are never rolled)"
  - "13-19 (copy.ts's MIX TWO family named for removal; copy.spec.ts's four MIX_TWO assertions and mixChildName's three go with it; TUNING_CAPTION still imported by the region)"
  - "13-20 (the counts; TUNE-07's row says SURPRISE ME and the button says Randomize with a scope - amend by name; PREV-04 is 13-09's and 13-16's, not this plan's)"
  - "12.1 (lua-pad-sim.ts gains `get midi()` beside `get errors()` when its band lifts - three lines; monitor.ts's probe prefers it and today reads the host through the field)"
tech-stack:
  added: []
  patterns:
    - "A diagnostics view over a log the engine already keeps is a pure module (stamp, fold, ring) plus a component that polls on a setTimeout chain only while shown - never a second rAF, never setInterval, never a live region"
    - "A predicate over the descriptor's words does two jobs from one definition: the inspector's partition and the randomiser's scope, with a catalog-wide spec holding the excluded set by entry and id"
    - "An engine field a plan may not reach through the file that owns it is read structurally, with the public getter preferred and the field named as the interim path in the header"
key-files:
  created:
    - src/lib/sim/monitor.ts
    - src/lib/ui/MidiMonitor.svelte
    - .planning/phases/13-gui-overhaul/13-10-SUMMARY.md
  modified:
    - src/lib/ui/BudgetMeter.svelte
    - src/lib/ui/BudgetMessage.svelte
    - src/lib/ui/TuningRegion.svelte
    - src/routes/playground/[id]/+page.svelte
    - src/lib/tune/inspector-copy.ts
    - src/lib/tune/surprise.ts
    - src/lib/tune/surprise.spec.ts
    - src/lib/tune/model.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/lib/tune/colour-picker.spec.ts
    - src/lib/ui/radius-allowlist.ts
    - docs/TESTING.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
  deleted:
    - src/lib/ui/MixTwo.svelte
    - src/lib/tune/mix.ts
    - src/lib/tune/mix.spec.ts
key-decisions:
  - "The meters were already inside the inspector (13-09 made them the Inspector's children, drawn after the last section); this plan re-homes their COLOUR and their SHAPE, not their markup - the error surface on the message block per section 12's own gloss, the three radii cleared - and states it rather than claiming a move"
  - "The MIDI partition and Randomize's scope are ONE predicate (isMidiDestination over id and label words), so what the MIDI output section shows is exactly what the roll preserves; the four-id set in TuningRegion is gone and tune-ui test 7 re-aimed at the predicate"
  - "surpriseIndices keeps its signature and its exhaustion signal; the 'previous vector' Undo restores is the model's copy of `indices` taken after the gate and before the draw, resolved from Tuner.surprise(); Tuner.restore() is the one new seam"
  - "MidiMonitor is not a TUNING_COMPONENT: it is section 10's diagnostics bar in the centre column, so the hand list goes 10 -> 9 with MixTwo and the monitor's own title holds its floor, its scroll rule and its silence"
  - "The monitor reads the engine's log structurally (a public midi getter first, else host.midi through the field) because lua-pad-sim.ts is in 12.1's band; the three-line getter is named for the next owner of that file"
  - "The canvas-budget half of the second MIX TWO title had its surviving subject already in colour-picker.spec.ts test 6; that test is re-aimed (six / eight -> two / four) and the tune-ui title deleted whole, so the term stays -1 / -1"
  - "Pause freezes the view and Resume does not replay the gap; Clear empties the view and not the host's array; the timestamp is elapsed time since the monitor opened; direction `out` and source `Browser preview` are constants - all stated in the header and the ledger"
  - "REQUIREMENTS.md untouched (all five rows already [x] from Phase 5); 13-20 qualifies them, and TUNE-07's `SURPRISE ME` wording is named there for amendment"
  - "gsd-tools state commands not run; STATE.md by script against a copy with every touched line asserted"
patterns-established:
  - "src/lib/sim/monitor.ts: a clockless log renderer's arithmetic beside the host it reads, testable with a scripted clock"
requirements-completed: [TUNE-03, TUNE-04, TUNE-05, TUNE-06, TUNE-07]
duration: 48min
completed: 2026-09-11
---

# Phase 13 Plan 10: The Meters on the Error Tokens, the Monitor from the Host's Log, Randomize Scoped, Undo Randomize, MIX TWO Cut Summary

**The workspace's second half: the two 908 meters and the ladder keep every word and every test id
inside the inspector while their over state moves onto 13-03's error pair and their corners go square;
the MIDI monitor is built as a render of the log `lua-host.ts` already keeps - coalesced by
(channel, cmd, p1) in a 100 ms window with an `xN` count, ring-capped at 200, pause and clear, absent
rather than empty on the nine preset entries, announcing nothing; Randomize stops touching the wire by
one predicate over the knob descriptors that also partitions the MIDI section, with the 29 knobs it
excludes listed by entry and id; Undo randomize is one stored vector restored in one click and says in
its header that it is not general undo; and MIX TWO leaves the tree with its module, its two property
tests and its two UI titles quoted, the phase's fourth negative test term.**

## Performance

- **Duration:** 48 min of execution (13:42Z to 14:30Z), plus the e2e runs and this file
- **Started:** 2026-09-11T13:42Z (the first read after 12.1-02's `5f0ffbf`)
- **Completed:** 2026-09-11
- **Tasks:** 2 of 2
- **Files:** task 1: 10 paths (+1,117 / -31; `monitor.ts` and `MidiMonitor.svelte` created); task 2: 13
  paths (+571 / -1,430; three deleted); plus `STATE.md` and this file in the docs commit

## Commits

| Task | Commit    | Message (first line)                                                                                                                                     |
| ---- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | `dfa5bbb` | `feat(13-10): the 908 meters squared on the error tokens inside the inspector, and the MIDI monitor built from the log the Lua host already keeps`         |
| 02   | `2df6767` | `feat(13-10): Randomize scoped off the wire by one predicate over the descriptors, Undo randomize as one stored vector, and MIX TWO cut by name`           |

**Two things happened on the tree that are not this plan's.** `a1045d7` (`docs(12.1-02)`, the other
agent's closer) landed between my baseline and my first commit - it touched `12.1-02-SUMMARY.md` and
`STATE.md` only. Then, during task 2, the other agent's NEXT plan began editing
`src/lib/catalog/entries/{arc,euclid,radar-points,sonar,steps}.ts`, `library.ts`, `library.spec.ts`,
`lua-smoke.spec.ts`, `audition.spec.ts` and `docs/HARDWARE-AUDITION.md`, uncommitted, and those edits
were on the tree under my quick runs and inside my builds. None touches a file this plan touches; every
`--only` list here excludes them; their two `lua-smoke.spec.ts` reds (euclid, steps - entries mid-edit)
are theirs and are named below where they appear.

## The baseline, carried from 13-09, and this plan's term written out

Observed on the clean tree at `5f0ffbf` before the first edit: **88 files / 906 tests (+1 todo)**,
one red - `install.spec.ts`'s *"the snapshot is taken at connect, in order, before ready"*, the brief's
named quick-suite transient, **23 / 23 green alone**. The arithmetic the brief gave: 13-09 measured
88 / 899 **with 12.1-01's +1 / +4 already inside it** (13-09-SUMMARY: "88 = 89 - 1 ... 12.1-01's
calibration.spec.ts landed +1 between my tasks"), and 12.1-02 added +7 -> 88 / 906. **The plan's
`86 893` literal is stale by +2 / +13**, stated once. `mix.spec.ts` measured **two `it(` and zero
`it.todo`** before deletion, as the plan says.

| Count            | Carried (13-09)  | Observed at `5f0ffbf` | This plan                                                                                                                                                                                                                                           | Observed                                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unit files       | 88               | **88**                | **-1** (`mix.spec.ts` deleted; `monitor.ts` and `MidiMonitor.svelte` are modules)                                                                                                                                                                  | **87**                                                                                                                                                                                                                                                                                         |
| unit tests       | 899 (13-09) / 906 (tree) | **906** (+1 todo) | **-1** = `-2` (`mix.spec.ts`) `-2 +3` (`tune-ui.spec.ts`: the two MIX TWO titles out; the monitor, the Undo test in; the alarm-red title RE-AIMED at count 0, so 11 -> 12 after task 1 and 12 -> 11 after task 2) `+1` (`surprise.spec.ts` 5 -> 6, the scope test). **The parts are `mix.spec.ts -2`, `tune-ui.spec.ts -2 +2`, `surprise.spec.ts +1`** - the plan's "tune-ui -2 +3" counted the scope test in the wrong file; it landed in `surprise.spec.ts`, as the plan allowed ("say which file") | **905** on this plan's term (+1 todo, `firmware-oracle.spec.ts:209`, unmoved); **the tree reads 907** = 905 + the other agent's in-flight `lua-smoke.spec.ts` (32 -> 34 `it(` uncommitted), with two of theirs red in the first full run and one in the second (their entries mid-edit). `check-counts.mjs` cannot be matched on a run with a red line, so 87 / 905 is arithmetic on the observed 87 / 907 minus their +2 |
| e2e titles       | 78               | **78**                | **+0 / +0** - no title added, none deleted, none renamed                                                                                                                                                                                            | **78** (per file below), 16 `@webkit` titles before and after                                                                                                                                                                                                                                 |
| e2e runs         | 94               | **94**                | **+0**                                                                                                                                                                                                                                              | **94** in five chunks on fresh detached servers (20 + 21 + 16 + 17 + 20), one red rerun alone and named below                                                                                                                                                                                  |
| check            | 610              | not measured before the first edit | **-1** net: `+2` (`monitor.ts`, `MidiMonitor.svelte`) then `-3` (the three deleted)                                                                                                                                                    | **612** after task 1, **609** after task 2, 0 errors, 0 warnings both times (so the tree stood at 610 before, as 13-09 left it)                                                                                                                                                              |
| sweep            | `4 19`           | `4 19`                | unchanged                                                                                                                                                                                                                                           | `4 19`                                                                                                                                                                                                                                                                                         |
| radius allowlist | 4 rows / 7       | 4 / 7                 | **-2 rows / -5 declarations**: BudgetMeter 3 cleared (task 1), MixTwo 2 deleted (task 2)                                                                                                                                                             | **2 rows / 2** (DeviceDetails 1, KeepConfirm 1 - 13-11's); layer A six circles; layer B green on the fresh build twice                                                                                                                                                                         |

`npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: matches. `npm run check`: 609 / 0 / 0
(612 after task 1, 609 after task 2). `npm run lint`: prettier reports one file,
`src/lib/sim/lua-smoke.spec.ts` - the other agent's uncommitted edit, not this plan's (13-09 recorded
the same shape on `library.ts`); eslint clean. `npm run build` three times, `EPERM` never; the last at
HEAD `2df6767` so `artifacts.e2e.ts` reads its own archive.

## Task 01: the meters on the error tokens, and the monitor from the host's log

### Where the meters were, and what moved

**The meters were already inside the inspector.** 13-09 made `BudgetMeter` (twice) and
`BudgetMessage` the children of the shell's `Inspector`, and `Inspector.svelte` draws its children
**after** its last section - which is `MIDI output` on every entry that addresses the wire, `Appearance`
on the six that do not. The plan's "move into the inspector under the MIDI output section" was
therefore true of the tree before this plan ran, and the SUMMARY says so rather than claiming a move.
What this plan changed:

| Component               | Before                                                                                   | After                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BudgetMeter.svelte`    | `.track`, `.fill`, `.ghost` at `border-radius: 2px` (the allowlist row's three)          | square (D-01); the row cleared; the header says where the meter lives since 13-09 and what 13-10 changed. `{used} / 908` (`meterNumerals`), `{pct}%` (`meterPercent`), `tabular-nums` on both numeric cells, the 26 / 56px arithmetic, `.over` on `.numerals` / `.percent` / `.track` / `.fill` - **all unchanged** |
| `BudgetMessage.svelte`  | `.block.over` a 2px `--color-error-ink` left rule on nothing                             | the same rule on **`--color-error-surface`** (`padding-block: 12px; padding-inline: 14px 12px`) - section 12's "error message backgrounds", the token's first consumer since 13-03 shipped it with none; the sentence stays `--color-ink`; `TURN_IT_DOWN` (copy.ts, 13-19's) and the `.pill` class untouched |
| `TuningRegion.svelte`   | the fourth-group paragraph                                                               | names the re-home and walks TUNE-05's five clauses; no markup moved in task 1                                                                                                                                                                                                       |

The surface went on the **message block and not the meter row**: a meter row is 14px of numerals in
a 26px arithmetic the header calls load-bearing, and painting a surface behind it would either break
the 56px block or read as a cramped strip; section 12's own gloss for the token is "error message
backgrounds". Ink on that surface is 13.32:1 and the error ink beside it 9.92:1 (identity.spec.ts
recomputes both from `app.css`).

### TUNE-05, clause by clause

Each clause is real code and each is pressed in a browser by `e2e/tuning.e2e.ts` tests 9 and 10
against the `/dev/tune/` probe's real reserve - **20 / 20 in the tuning chunk on this plan's build**:

| Clause                                          | Where it lives after the re-home                                                                                                                                              | Pressed by                                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. disables the primary action                  | `TuningRegion` reports `over.reason` upward through `onbudget`; the route hands it to `TryOnDevice` as a real `disabled` with the sentence beside it                          | `tuning.e2e.ts:923` - `try-on-device` visible AND disabled, `probe-budget-reason` and `#try-on-reason` carry `tryOnBudgetReason("Setup")`                                   |
| 2. turns the offending meter red                | `BudgetMeter`'s `.over` on the numerals, the percentage, the track's outline and the fill - `--color-error-ink`; the other meter untouched                                    | `tuning.e2e.ts:904` - `meter-setup .numerals` and `.track` have class `over`, `meter-timer .numerals` does not                                                              |
| 3. names the knob that pushed it over           | `model.ts`'s knob case builds `over.line` (`overBudgetKnob(label, event, by)`); `BudgetMessage` renders it as `.line` in ink                                                  | `tuning.e2e.ts:986` - after `End` on the scroll rail, `.line` reads `overBudgetKnob(SCROLL_LABEL, "Setup", over - 908)`                                                    |
| 4. offers a one-click back-off                  | `over.backOff` + `over.apply`; `BudgetMessage`'s `turn-it-down` button (`TURN_IT_DOWN`, `.pill`, 44px) with `.explain` beneath                                               | `tuning.e2e.ts:991` - the button visible with its label and quiet line; one click brings `meter-setup` back to the measured inside number and the block to empty          |
| 5. the click never reaches the wire             | `over.apply` talks to the tuner (`set` or the ladder's first step) and nothing else; no transport, no port                                                                    | `tuning.e2e.ts:947` - `navigator.serial.requestPort` wrapped before the document runs; `__requestPortCalls` read as 0 at the end                                          |

### The monitor

**`src/lib/sim/monitor.ts`** (pure, clockless, one type import):

- `midiLogOf(engine)`: the engine's MIDI log or **undefined**. A public `midi` getter first; else the
  host's `midi` getter through `LuaPadSim`'s `host` field; a vendored `PadSim` has neither and returns
  undefined - **never an empty array**, because "absent" and "nothing sent yet" are two facts and the
  bar exists for the second only. **Why the field:** `lua-pad-sim.ts` exposes `errors` beyond
  `SimEngine` and not `midi`; the right seam is `get midi()` beside `get errors()` - three lines - and
  this plan could not write them (the file is in 12.1's concurrency band; the brief forbade it). The
  probe prefers the getter, so when the file gains it the field path is dead. **Named here for the
  next owner of `lua-pad-sim.ts`.**
- `MonitorLog.ingest(source, at)`: reads what the array gained since the last call, stamps each new
  entry `at`, folds an entry into an existing row when `(ch, cmd, p1)` match and the row's first moment
  is within `COALESCE_WINDOW_MS = 100` - walking back from the newest, so X and Y alternating fold into
  two rows rather than only ever matching the last - carrying the **latest** `p2` and a `count`; drops
  the oldest past `MONITOR_CAP = 200`; a **shorter** source (a restarted host) is read from the start
  again. Returns whether the visible rows changed. `visible` is newest first; `clear()` empties the
  view and not the host's array; `skipTo(source)` is how open and resume watch "from now".
- `describeMessage(cmd, p1)`: the status high nibble - `CC 74`, `Note on 60`, `Note off 60`,
  `Aftertouch`, `Program`, `Pressure`, `Pitch bend`, else `Command N`. `describeChannel(ch)`:
  **one-based** (the wire's 0 is the DAW's 1, as `CHANNEL_OPTIONS` already shows). `describeValue`:
  `p2`, or the 14-bit bend whole. `describeTime(ms)`: `m:ss.mmm`, fixed width.

**`src/lib/ui/MidiMonitor.svelte`** (380 lines with its header):

| Region       | Built                                                                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the bar      | one `<button aria-expanded aria-controls>` spanning the width: `˅` / `˄`, **`MIDI monitor`**, **`Browser preview · No MIDI output`** right-aligned, `˅` / `˄` - the PDF's two strings verbatim; 44px tall; collapsed by default (`open = $state(false)`)         |
| expanded     | `Pause` / `Resume` (the label swaps with the state) and `Clear` (disabled when empty), both 44px on both axes; the paused line; the empty line; else a real `<table>` with `<th scope="col">` for section 10's six heads in section 10's order, newest first     |
| a row        | `m:ss.mmm` since open, `out`, `Browser preview`, the one-based channel, `CC 74`, the value with **`x12`** beside it when folded - the numeric cells in app.css's `.numerals` utility (mono, tabular) so no component rule spends `--font-mono` and A-44's list of six stands |
| the sampler  | `timer = setTimeout(sample, SAMPLE_MS)` with `SAMPLE_MS = COALESCE_WINDOW_MS`, started on open and on resume (after `skipTo`), stopped on collapse, pause and destroy. **Never `setInterval`** (Phase 4, site-wide), **never a second rAF** (SimHost owns the page's one), and it ticks, paints and touches no engine |
| the source   | a prop `source: () => readonly HostMidi[] \| undefined` - a function, because the tuner swaps engines under the same id on every knob turn; the route passes `() => midiLogOf(engine)` over its plain `engine` local                                          |
| silence      | **no `aria-live`, no `role="log"`, no `role="status"`** (section 14: "do not announce every MIDI event or animation frame"); the toggle and the table are the whole accessibility surface                                                                       |
| motion       | no transition but the hover colour (140 ms, `none` under reduced motion); rows do not animate in. It cannot fight 13-04's `still`: a still surface that still answers a finger still sends, and the rows are the log's, not this component's                  |

**The three limits and the declined divergence** are in both headers: (1) the nine compiler-driven
entries produce nothing because `src/vendor/botor/pad-sim.ts` records no send, D-14 Q4b chose Lua
entries only, and adding a log to `src/vendor/` is a declared divergence for a v1 nicety **this plan
declines by name**; (2) rate - the 100 ms fold and the 200 ring; (3) `No MIDI output` is the truth -
Phase 6 closed section 19's Web MIDI row and nothing here reaches a port.

**Where it mounts:** the workspace's `data-testid="monitor-slot"` (13-09's named, empty slot) now holds
`{#if listed.preview === "lua"}<MidiMonitor source={() => midiLogOf(engine)} />{/if}`. **Absent on
`aurora`, `pinwheel`, `starfield`, `radar`, `joystick`, `ninepads`, `faders`, `dial` and the one
un-carded preset entry** (the listing's nine `padsim` rows; the brief's "eight carded" is the front-door
count) - not present and empty. Present on the eighteen Lua entries. The route stays light: config-shape
tests 13 and 14 green on the fresh build, and the workspace's UI chunk (`vcbhHuOT.js`, 43,401 B, up from
13-09's 42,966) statically imports five chunks carrying neither `__hangar_gms` nor the protocol's
strings.

### Strings

`MIDI monitor` and `Browser preview · No MIDI output` are the PDF's, verbatim. The eight HANGAR wrote
are ledgered in `13-COPY-NEW.md` under "From 13-10": `MONITOR_COLUMNS` (_Time · Direction · Source ·
Channel · Message · Value_), `MONITOR_DIRECTION` (_out_), `MONITOR_SOURCE` (_Browser preview_),
`MONITOR_PAUSE` / `MONITOR_RESUME`, `MONITOR_CLEAR`, `monitorCount` (_x{n}_), `MONITOR_EMPTY`
(_Nothing sent yet. Play the surface and what it sends shows here._), `MONITOR_PAUSED` (_Paused. What
the surface sends now is not shown until you resume._). **The meters changed no string** and none is
ledgered; `TURN IT DOWN` and the ladder family stay in `copy.ts` for 13-19.

### The re-aimed title and the new one (`tune-ui.spec.ts` 11 -> 12)

*"the alarm red lives in exactly two components and on no button"* -> **_"the error ink and its
surface live in the two meter components inside the inspector, and on no button"_** (count 0): the
`--color-error-ink` carriers still exactly `BudgetMessage` and `BudgetMeter`; the
`--color-error-surface` carrier exactly `BudgetMessage`; `.block.over` holds both tokens and no
radius; two `<BudgetMeter` and one `<BudgetMessage` inside `<Inspector` **after** `sections={[`;
`meterNumerals(view.used)`, `meterPercent(view.pct)`, `tabular-nums`; `.track` / `.fill` / `.ghost`
without `border-radius`; the no-button scan and the ghost assertions kept.

New: **_"the MIDI monitor renders the host's existing log coalesced with an xN count, caps at 200, is
absent on a preset entry, and announces nothing"_** - the forbidden strings absent (`aria-live`,
`role="log"`, `role="status"`, `setInterval`, `requestAnimationFrame`, `Math.random`, `overflow-x`, the
overflow shorthand, `border-radius`); the timeout chain and `onDestroy(stop)`; the disclosure and the
table; both 44px axes on `.control`, 44px on `.bar`; the PDF's two strings verbatim and imported; the
route's guard matched as one regex and `<MidiMonitor` counted once; `D-14 Q4b`, `src/vendor/` and
`midiLog` in the header; the arithmetic on a scripted clock (two alike at 10 ms -> one row `x2` with the
latest value; the window's edge -> a new row; 40 alternating X / Y -> two rows of 20; 500 distinct ->
exactly 200, newest first, the oldest survivor the 300th; clear then one more -> one; a restarted host
-> read from the start); the column words; and **two real engines**: `createEngine(aurora)` ->
`midiLogOf` undefined, `createEngine(arc)` -> a log that ARC's timer fills in 200 ticks with `CC n`
rows, closed in `finally`.

### Negative checks, task 1 (restored from a scratch copy, sha256 `cf238b74` either side, three times)

| Plant                                                          | Expected                                                  | Observed                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| A. the ring's `splice` removed                                 | the cap asserted                                          | red: *the ring did not cap: expected 500 to be 200*                                                                                   |
| B. `fold()` disabled (every message its own row)              | one row with `x2` from two alike 10 ms apart              | red: *two alike messages 10 ms apart made two rows: expected 2 to be 1*                                                               |
| C. `midiLogOf` returning `[]` for an engine with no log        | nothing rendered on a preset entry, not an empty table    | red: *a vendored PadSim reports a MIDI log - D-14 Q4b's premise is gone, and the bar's absence on preset entries no longer follows: expected [] to be undefined* |

## Task 02: Randomize scoped, Undo randomize, MIX TWO cut

### The predicate, and the 29 knobs it excludes

`isMidiDestination(knob)` splits the descriptor's `id` and `label` into words (camelCase first, then
non-letters) and answers true when any word is one of `cc`, `channel`, `midi`, `controller`, `send`.
**Derived from the descriptor, not an id list**: `ccBase` reads as `cc base`, `First controller` and
`MIDI channel` answer through the label, `Sensitivity` and `Compass scale` do not. Measured over
`stampKnobs` of every catalog entry (a scratch census, deleted; `surprise.spec.ts` test 6 now holds the
list and fails naming the change if it moves):

| Entry          | Excluded knob ids  | Labels                          |
| -------------- | ------------------ | ------------------------------- |
| `radar`        | `send`             | Send                            |
| `joystick`     | `send`             | Send                            |
| `ninepads`     | `channel`          | Channel                         |
| `faders`       | `send`, `channel`  | Send, Channel                   |
| `dial`         | `send`, `channel`  | Send, Channel                   |
| `euclid`       | `channel`          | MIDI channel                    |
| `chorus`       | `channel`          | MIDI channel                    |
| `arc`          | `cc`, `channel`    | CC number, MIDI channel         |
| `ghost`        | `cc`, `channel`    | CC pair, MIDI channel           |
| `morph`        | `ccBase`, `channel`| CC base, MIDI channel           |
| `sonar`        | `channel`          | MIDI channel                    |
| `steps`        | `channel`          | Channel                         |
| `console`      | `cc`, `channel`    | First controller, Channel       |
| `strip`        | `cc`, `channel`    | First controller, Channel       |
| `lumen`        | `cc`, `channel`    | First controller, Channel       |
| `snake`        | `channel`          | Channel                         |
| `quadrant`     | `channel`          | Channel                         |
| `pomodoro`     | `channel`          | Channel                         |
| `wheels`       | `cc`, `channel`    | Mod controller, Channel         |
| `radar-points` | `channel`          | MIDI channel                    |

**29 knobs on 20 entries.** Six entries carry none (`aurora`, `pinwheel`, `starfield`, `stage`,
`cull`, `trackpad`) and one (`stage`) has `key` / `modifier`, which are keyboard and not MIDI. The set
is **not empty, so the change is not theatre**: before it, sixteen-way channel knobs rolled on twenty
entries. The predicate agrees with 13-09's four-id partition on every entry (asserted per entry), and
`TuningRegion` now partitions with the predicate itself, so the four-id set is gone from the component.

**No knob's kind or option count changed** - the test walks every rollable knob's options and the
stamp codec is untouched (the five stamp specs and the sweep green). **`SURPRISE_ALL_HELD` became
reachable with fewer locks on twenty entries**: on `faders` one lock (`brightness`) now makes the roll
degenerate, because `send` and `channel` are out of scope on every roll. **No entry has only MIDI knobs**,
so the control is never disabled with nothing held.

### `surpriseIndices`, `Tuner.surprise()` and `Tuner.restore()`

- `surpriseIndices` treats a MIDI destination exactly as a held knob on every roll (one branch,
  `held.has(knob.id) || isMidiDestination(knob)`): never offered to `rng`, never a reason for `moved`,
  its previous position kept. Signature, return, `SURPRISE_ROLL_LIMIT = 12`, `SURPRISE_BUDGET_MS = 400`
  and the exhaustion signal unchanged; `previous` is never mutated (`kept` is a copy - asserted).
- `model.ts`: `surprise()` resolves to **a copy of `indices` taken after `padReady()` and before the
  draw** - the vector the roll replaced - or undefined when destroyed; `restore(indices)` positions every
  knob through `positionOf` (a missing or out-of-range position is the default, as a decoded stamp is)
  and `moveTo`s once; the not-a-compiler-failure exhaustion guard is over `rollable(knobs)`.
- `TuningRegion`: `undo: IndexVector | undefined` - **one value**; set from `surprise()`'s result,
  cleared by `undoRandomize()` itself and by `changeKnob`, `resetKnob` and `resetAll` (a hand move
  after a roll would make the vector restore more than the roll); the button
  `data-testid="undo-randomize"` carries `UNDO_RANDOMIZE` (section 7's words) and is
  `disabled={undo === undefined || rolling}`. `allHeld` is over `rollableKnobs`; the live sentence
  counts the roll's scope, not the rack. The header says **it is not general undo** - section 17's
  Sandbox undo / redo is 13-16's - in so many words.

### The two new tests, and where the scope test landed

**The scope test landed in `surprise.spec.ts`** (5 -> 6), not in `tune-ui.spec.ts`: _"the scope rule:
a roll leaves every MIDI destination at its prior index while something else moves, the previous vector
is untouched, and the excluded set is these twenty-nine knobs on twenty entries"_ - the list above
asserted verbatim; per-entry agreement with the four ids; the label-only and camelCase cases; on `dial`
with `channel` at 5 and `send` at 7 (off their defaults), an rng that draws 0.5 for everything is called
**exactly `rollable.length` (3) times**, both MIDI knobs read back 5 and 7, something in scope moved,
`previous` deep-equals its frozen copy; holding every rollable knob composes with the scope into the
fully-held exhaustion with zero draws.

**The Undo test landed in `tune-ui.spec.ts`** (+1): _"Undo randomize restores the prior indices in one
click and is disabled before any roll, and a roll leaves every MIDI destination where it stood"_ - the
source half (the button, its disabled expression, the imported label, `let undo: IndexVector |
undefined`, no `undo = [` and no `undo.push(`, the `previous = await current.surprise(heldKnobs)` line,
`undo = undefined;` inside `undoRandomize`, `changeKnob`, `resetKnob` and `resetAll`, and the header's
`NOT GENERAL UNDO` / `13-16` / `Not a history, not a stack, not a tree`); the behaviour half on a real
tuner on `dial`: `channel` hand-moved to default + 3 first (so "unmoved" is not "at default"),
`surprise()` with the tuner's own rng, the resolved vector deep-equals the pre-roll snapshot, `send` and
`channel` read back unmoved, at least one other knob moved and none of the movers is MIDI, `restore()`
puts **every** index back including the hand-moved channel.

### MIX TWO, itemised

| Artefact                                         | Fate                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ui/MixTwo.svelte`                       | `git rm` (two `border-radius` declarations, the allowlist row gone with it)                                                                                                                                                                                                                                                 |
| `src/lib/tune/mix.ts`                            | `git rm`                                                                                                                                                                                                                                                                                                                    |
| `src/lib/tune/mix.spec.ts`                       | `git rm` - **two `it(`, zero `it.todo`**, both read before deletion                                                                                                                                                                                                                                                         |
| `tune-ui.spec.ts`'s two MIX TWO titles           | deleted by asserted line boundaries (332 lines), the `MIX_*` and `MIX_CHILDREN` imports with them; `TUNING_COMPONENTS` 10 -> 9 with the reason MidiMonitor is not on it; the census loses the `MixTwo` row at 0 (total 22, seven carriers - unchanged)                                                                       |
| `tune/copy.ts`'s family                          | **LEFT STANDING for 13-19**: `MIX_TWO = "MIX TWO"`, `MIX_LINE = "Takes half its settings from each, at random. Nothing is sent to your ZONA."`, `MIX_THIS = "THIS ONE"`, `MIX_THAT = "THAT ONE"`, `mixChildName(changes)` (_Take this: ..._), and `copy.spec.ts`'s four `MIX_TWO` assertions and three `mixChildName` ones; its `:49` `ChosenPanel` mention likewise |
| `instrument.spec.ts`'s scan that names `MixTwo`  | **re-aimed**: scan 2's hand list `PILLED` loses the `["MixTwo.svelte", "mix-two", "Secondary"]` row (the derived walk finds one pilled control fewer; both directions of the hand-list-against-walk check hold); scan count unchanged                                                                                          |
| `colour-picker.spec.ts` test 6 (outside the plan's list) | its arithmetic named `MIX_TWO_CHILDREN = 4` and its title said six / eight; **re-aimed** to `HERO + PICKER_RESULT = 2` and `HERO + worst = 4`, retitled _"the picker contributes exactly one canvas, so the worst entry shows two rather than four"_, the history kept in its comment; count unchanged                   |
| `docs/TESTING.md`                                | the `mix.spec.ts` row removed; the sentence naming it amended                                                                                                                                                                                                                                                               |

**The four deleted titles, verbatim:**

- `mix.spec.ts`: _"every child is in range, every held knob is untouched, and at most one position is redrawn"_
- `mix.spec.ts`: _"the degenerate and boundary cases: every knob held, a equal to b, one knob, and a two-option knob"_
- `tune-ui.spec.ts`: _"MIX TWO offers four real results, changes nothing until one is clicked, and arrives on opacity alone"_
- `tune-ui.spec.ts`: _"MIX TWO's four results are the last four canvases in the budget: six on the worst entry, not eight"_

**The canvas-budget decision.** The second UI title was read first. Its budget half said: the picker
declares exactly one `<PadCanvas` (so six, not eight); MIX TWO declares one in a loop of four; every
pad is IntersectionObserver-gated by the host; both render only when a consumer supplies the hop. With
MIX TWO gone the ceiling is **hero + the picker's one = two on `console`, `strip` and `wheels`, not
four** - and that subject already lives in `colour-picker.spec.ts` test 6 (the one-canvas count, the
`{#if onresult}` gate, `onready={onresult}`), which is the file that owns the one-picker-per-panel
rule; the host's `new IntersectionObserver(` is `host.spec.ts`'s by injection. So the tune-ui title
goes **whole**, test 6 is re-aimed to the two / four arithmetic, and **the term is `-1 / -1`, not
`-1 / +0`**.

`grep -rn "MixTwo\|mix\.ts\|mixTwo\|mixIndices\|MIX_CHILDREN" src/ e2e/ docs/` after: `copy.ts` and
`copy.spec.ts` (13-19's), and comments in `tune-ui.spec.ts`, `instrument.spec.ts`,
`radius-allowlist.ts` and `docs/TESTING.md` naming the deletion. No import, no mount, no path.

### Negative checks, task 2

| Plant                                                                         | Expected                                                              | Observed                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D. the scope removed from `surpriseIndices` (`held.has(knob.id)` alone; sha256 `87289a5d` either side) | the scope test red naming a moved channel                | **two red**: `surprise.spec.ts` test 6 at its first assertion, *a MIDI destination reached the rng: expected 5 to be 3*; the Undo test at *send moved on a roll - section 7 preserves the MIDI destination and channel: expected 2 to be +0* (it names `send`, the first MIDI knob in dial's rack; `channel` follows it) |
| E. `Undo randomize` clicked twice                                             | the second click a no-op or disabled - say which                      | **DISABLED**: the first click sets `undo = undefined`, which is the button's `disabled`; the handler guards `vector === undefined` and is a no-op if reached another way. Asserted as source in the Undo test                     |
| F. `mix.ts` restored from HEAD                                                | nothing imports it                                                    | zero importers under `src/` (`grep` for `tune/mix"`, `./mix"`, `../tune/mix"`); removed again. The proof it was already unmounted: its only consumers were its own spec and the two UI titles this plan deleted                  |

## The e2e suite

`grep -c "test("` over `e2e/*.e2e.ts`, before (`git show 5f0ffbf:`) and after:

```
before: artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
after:  artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
@webkit titles: 16 before, 16 after
```

No e2e file was edited. Five chunks on fresh detached wranglers (13-08's `run-chunk.sh` +
`start-wrangler.ps1`), each to a log and through `check-counts.mjs --playwright`, zero
`ProxyController` lines in every start:

| Chunk                                                                        | Runs | Result                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tuning + tuning-webkit                                                       | 20   | **20 / 20** - TUNE-05's tests 9 and 10 on the re-homed meters, the popover's focus return, the sideways-scroll measurement with the third button in the actions row                                                                              |
| browse + browse-webkit                                                       | 21   | **21 / 21**                                                                                                                                                                                                                                        |
| session                                                                      | 16   | **16 / 16**                                                                                                                                                                                                                                        |
| install                                                                      | 17   | **17 / 17**                                                                                                                                                                                                                                        |
| first-experience + smoke + skeleton + fidelity + catalog + artifacts + radius | 20   | 19 / 20 - `artifacts` *"the static build is complete"*: the build was made before the task-2 commit (`source-dfa5bbb...tar.gz` against HEAD `2df6767`), the same shape 13-09 met; rebuilt at HEAD and rerun alone **3 / 3**. Radius layer C green in both engines |

The brief's known transients (`webkit-phone` tail, `session.e2e.ts` D-12-12-a, `tuning-webkit.e2e.ts:497`,
the 375px overflow, the modal-backdrop retry) did not appear. Nothing was piped through `grep` or
`head`; nothing was committed while a suite ran; `EPERM` never.

## The allowlist, before and after

Before (13-09's four rows, seven declarations): `BudgetMeter.svelte` 3 (13-10), `MixTwo.svelte` 2
(13-10, deleted), `DeviceDetails.svelte` 1 (13-11), `KeepConfirm.svelte` 1 (13-11). After task 1:
three rows, four. **After task 2: two rows, two** - `DeviceDetails.svelte` 1 and `KeepConfirm.svelte`
1, both 13-11's. The module's debt paragraph carries both steps dated. Layer A: six circles at D-15's
six lines (unmoved - neither `Knob.svelte` nor `ColourPicker.svelte` was edited); layer B green on
three fresh builds; layer C `radius.e2e.ts` green in chromium and webkit-phone. No `border-radius`
above zero was added anywhere: `MidiMonitor.svelte` carries none and its test asserts it.

## PREV-04

**PREV-04 is not this plan's.** The `Configure` / `▷ Play` switch and its mouse-as-finger routing were
built at 13-09 (which carries the row and did not tick it); 13-16 carries it for the Sandbox's Edit /
Play; 13-20 decides the tick. No task here touched pointer input. `REQUIREMENTS.md` untouched (all
five of this plan's rows are `[x]` since Phase 5; 13-20 qualifies them, and **TUNE-07's `SURPRISE ME`
wording is named for amendment there - the button is `Randomize` with section 7's scope**);
**CAT-04 stays `[ ]`**.

## Deviations from the plan

### 1. [Rule 3 - blocking] `model.ts` and the workspace route edited, outside the plan's file list

`surpriseIndices` never meets the region; the vector Undo restores has to come back through
`Tuner.surprise()` and go in through a `Tuner.restore()`, both `model.ts`'s. The monitor mounts under
the surface, which is the route's markup (`+page.svelte`), not `TuningRegion`'s.

### 2. [Plan vs tree] The scope test landed in `surprise.spec.ts`, so the parts are `mix -2`, `tune-ui -2 +2`, `surprise +1`

The plan allowed either file ("say which"); the term is still `-1 / -1`.

### 3. [Plan vs tree] `radius.spec.ts` is not where rows are cleared

The rows live in `src/lib/ui/radius-allowlist.ts` (13-08 and 13-09 said the same); `radius.spec.ts`
was not edited.

### 4. [Rule 1 - a false assertion] `colour-picker.spec.ts` test 6 re-aimed

Its arithmetic and title named MIX TWO's four children; kept as written it would have asserted a
budget for a component that no longer exists. Re-aimed to two / four and retitled; count unchanged.

### 5. [Design, stated] The inspector's MIDI partition moved onto the predicate

The plan asked for the scope in `surprise.ts`; leaving the four-id set in `TuningRegion` beside it
would have been two definitions of one rule. One predicate, both jobs, test 7's four-id loop re-aimed.

### 6. [Constraint, stated] The monitor reads the host's log through a TypeScript-private field

`lua-pad-sim.ts` is in 12.1's band; the three-line `get midi()` is the right seam and is named for
that file's next owner. The probe prefers it when it exists.

### 7. [Plan vs tree] `PREV_FILES / PREV_TESTS 86 / 893` is stale

The tree was 88 / 906 at `5f0ffbf`; stated once above with its arithmetic.

### 8. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run. The script asserted `status:
executing`, `completed_phases 11`, `percent 100`, `total_phases 14`, `total_plans 160`, the Phase 12
plan line and the Phase 12.1 line unchanged; moved `completed_plans` 147 -> 148; added the P10 metrics
row, the `[Phase 13]: 13-10:` decisions, a dated clause on the Phase 13 `Concurrent` line, and the new
`Status:` with 12.1-02's retained. `STATE.md` was re-copied after `a1045d7` changed it under this plan.

### 9. [Process] The other agent's in-flight edits under my runs

Ten of their files were modified and uncommitted on the tree from task 2 onward (entries, the library,
`lua-smoke.spec.ts`, `audition.spec.ts`, `HARDWARE-AUDITION.md`); they were inside my builds and my
quick runs, produced their two `lua-smoke` reds, moved the tree's test count by +2, and are excluded from
every `--only` list here.

## What the plan asserts that the tree does not support

1. **"Both move into the inspector under the MIDI output section"** - they were already there since
   13-09 (the Inspector's children after its last section); this plan changed their colour and shape.
2. **`PREV_FILES / PREV_TESTS 86 / 893`** - 88 / 906 on the tree.
3. **"`tune-ui.spec.ts -2 +3`"** - `-2 +2`; the third landed in `surprise.spec.ts` (+1), as the plan
   allowed.
4. **`radius.spec.ts` in `files_modified` as the file that clears rows** - the rows are in
   `radius-allowlist.ts`.
5. **"`src/lib/sim/lua-host.ts:295` ... `:697`"** - the lines moved (`midiLog` at `:343`, the push at
   `:863`, `__hangar_gms` at `:687`); found by name, read only, as the brief said.
6. **"the nine compiler-driven entries"** vs the brief's **"eight carded"** - both true: the listing has
   nine `padsim` rows, the front door carries eight of them.
7. **"`surpriseIndices` returns the previous vector"** - its return is the new draw (or `previous`
   unchanged on exhaustion) and stays so; the vector Undo restores is `previous` as the model copied it,
   resolved from `Tuner.surprise()`. Changing `surpriseIndices`'s return would have broken its five
   tests and the exhaustion signal for nothing.
8. **"the monitor's column heads ... `Time`"** - section 10 says "timestamp"; the head reads `Time`
   and the ledger says why.

## Questions for the user, recorded rather than answered (D-01)

1. **`SURPRISE_ALL_HELD`'s sentence** - _Every knob is held, so there is nothing left to roll._ - is
   shown when every **rollable** knob is held; on `faders` that is one lock with `send` and `channel`
   unheld, so "every knob" is now imprecise. The string is `copy.ts`'s (13-19's, held at 53 characters
   by `copy.spec.ts`). Proposed for the batch: _Every setting Randomize can roll is held. MIDI settings
   are never rolled._
2. **Pause semantics** - the shipped Pause freezes the view and Resume does not replay what arrived
   in between (the paused line says so). Buffer-while-paused is the other reading of section 10's
   "pause"; it costs a second array and a scroll position and was not chosen.
3. **The timestamp's origin** - elapsed since the monitor was opened (`m:ss.mmm`), not wall-clock and
   not the simulator's tick clock. A visitor comparing two sessions might want the sim clock.
4. **Whether a MIDI knob's lock button should render at all** - it can be held, and holding it changes
   nothing now. Hidden would be tidier; present is what shipped, because the row is `Knob.svelte`'s and
   this plan did not touch it.

## Known Stubs

- The context bar's status zone on the workspace is still empty (13-11 / 13-13), as 13-09 recorded.
- `midiLogOf`'s second branch reads `LuaPadSim.host` through a private field until `lua-pad-sim.ts`
  gains `get midi()` - named above, not a blank by accident.

## Notes for the next plans

- **13-11:** `DeviceDetails.svelte` and `KeepConfirm.svelte` are the last two allowlist rows.
- **13-16:** the region's Undo randomize is one vector and says it is not the Sandbox's history.
- **13-18:** eight monitor rows and one `SURPRISE_ALL_HELD` question in the ledger.
- **13-19:** `copy.ts`'s `MIX_TWO`, `MIX_LINE`, `MIX_THIS`, `MIX_THAT`, `mixChildName`, the `:49`
  `ChosenPanel` mention, and `copy.spec.ts`'s seven MIX assertions; `TUNING_CAPTION` still imported.
- **13-20:** the counts above; TUNE-07's wording; PREV-04 not here.
- **12.1's next owner of `lua-pad-sim.ts`:** `get midi(): readonly HostMidi[] { return this.host.midi; }`
  beside `get errors()`; `monitor.ts`'s probe then reads the getter.

## Self-Check: PASSED

- `src/lib/sim/monitor.ts`, `src/lib/ui/MidiMonitor.svelte`, `src/lib/tune/surprise.ts`,
  `src/lib/ui/TuningRegion.svelte`, `src/lib/ui/BudgetMeter.svelte`, `src/lib/ui/BudgetMessage.svelte`:
  FOUND. `src/lib/ui/MixTwo.svelte`, `src/lib/tune/mix.ts`, `src/lib/tune/mix.spec.ts`: ABSENT, as
  required.
- Commits `dfa5bbb` and `2df6767`: FOUND in `git log`.
- `git diff --stat 5f0ffbf..2df6767 -- src/vendor/ src/lib/sim/lua-host.ts src/lib/sim/lua-pad-sim.ts src/lib/catalog/ src/lib/fidelity/firmware-oracle.spec.ts .planning/REQUIREMENTS.md .planning/ROADMAP.md e2e/`:
  empty but for `a1045d7`'s own files. `.planning/phases/12-touch-framework/` and
  `.planning/phases/12.1-gradient-touch/`: untouched by this plan.
- No device, no deploy, no push. The three untracked root files and the other agent's ten in-flight
  files are not this plan's.
