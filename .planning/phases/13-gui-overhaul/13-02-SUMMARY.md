---
phase: 13-gui-overhaul
plan: 02
subsystem: planning
tags:
  [
    slot-probe,
    three-slots,
    slot-arithmetic,
    unrun-sketch,
    dead-branch,
    rotary-knob,
    d-07,
    d-08,
    d-18,
    d-19,
    checkpoint-answered,
    runbook,
    copy-ledger,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 01
    provides: "PREV_FILES 86 / PREV_TESTS 889 (+1 todo) / e2e 88 titles, 108 runs / BASE_CHECK 583 / sweep 4 19 / catalog 26, observed on the clean tree at c89129d; the copy ledger with eight seeds"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-07 (the slots proved at the bench), D-08 (a Knob is a real rotary, +150-200 estimated), D-16 (the action colour is settled and not asked here), D-18 (the third slot gets its bench row - the user chose the second probe), D-19 (HANGAR can do anything the Editor can; 12-02's refusal of 255/4 is a pending removal owned by 13-17)"
  - phase: 13-gui-overhaul
    plan: probes
    provides: "PROBE-RESULTS-2026-09-10.md, both sections: cell 80 twice - one slot can call another and its globals persist (493a21a), and a touch script can call the system element's fourth slot (ff3f7b0)"
  - phase: 12-touch-framework
    plan: 07
    provides: "TOUCH_LIBRARY at 769 canonical in 255/0 (the only slot figure on this page that was RUN before it was pinned), E / T / C / X as the names the Sandbox runtime leans on, F gone, and X(s,n)'s contract"
  - phase: 12-touch-framework
    plan: 02
    provides: "ELEMENT_SYSTEM = 255 in the descriptor and the response filter; writeAll over 255/0, 0/6, 0/0; sequence.spec.ts asserting no frame addresses 255/4 or 255/6"
provides:
  - "SLOT-ARITHMETIC.md: both probe results quoted with their commits; the five-slot budget with THREE slots proved; six per-kind runtime figures under the pinned minifier, canonical, double-measured, EVERY ONE LABELLED an estimate from an unrun sketch (13-RESEARCH 3.1, Knob undefined) superseded by 13-15's VM measurement"
  - "THE TWO-SLOT CEILING IS THREE OF THE FOUR ELEMENT KINDS: Fader + Button + XY at 758 of 908 beside the sweep, Fader + Button + Knob at 885, all four at 1,062 (154 over). The PDF's page-3 surface is NOT installable on two slots and IS on three"
  - "THE THIRD SLOT IS A SECOND LIBRARY SLOT, NOT A HOME FOR THE WHOLE RUNTIME: the five-branch sketch is 1,051 with its marker and fits in 255/4 alone no better than in the Timer, so a four-kind surface's runtime spans both - 787 in 255/4 with a Knob hook, 324 in the Timer beside the sweep (estimates)"
  - "THE ROTARY KNOB'S OWN SHARE re-sketched at 304 against D-08's 150-200, 104 above the estimate's top, never run"
  - "THE CHECKPOINT RECORDED AS ANSWERED AND NOT RE-ASKED: D-18 (the user chose the second probe) and the probe's result (cell 80, ff3f7b0), both verbatim; three-slots handed to 13-14 and 13-15 by name; the action colour not asked (D-16)"
  - "docs/INSTALL-RUNBOOK.md row H, appended as one line inside the table's existing column widths, conditional on 13-15 and 13-17: the name confirmed with one tap on HANGAR's own emitted runtime, the page-next default proved back after PUT BACK, both extra risks named"
  - "13-COPY-NEW.md: the port-held-by-another-tab finding filed against the open-failure family (transport.ts:150 port-busy / CONN-04, :190 default) with the observation verbatim, the probe's own sentence offered, and one question for 13-18"
affects:
  - "13-14: emit against three slots - both pull-in calls (ele[#ele]:<name>() at 15-19 by candidate name, s.tim(s) / self:tim() at 10) so the Setup reaches both halves of a split runtime; the data half unchanged; ele[#ele] is the spelling that lit, not the research's ele[1]"
  - "13-15: the VM measurement is headroom confirmation, not a ceiling decision; the re-ask rule stays if the measured runtime lands larger than the sketch by more than the slot gained; the one true name among map / mapmode / utility / util is read from grid-fw and confirmed with one tap; the sketch's Knob is one plausible spelling of D-08 and not its measurement; the research's Z called F, which no longer exists, so a finger light in the runtime is 13-15's to price"
  - "13-17: owns the 255/4 write and its PUT BACK under D-19; its four-strings table puts only the sweep call in the Timer under the third slot, which the sketch says is not the four-kind case - count the frames first, as the plan already says"
  - "13-18: one ledger row and one question; 13-20: the runbook is eight rows and its intro still says seven"
tech-stack:
  added: []
  patterns:
    - "A figure carried from a document that was never run is labelled beside every row where it appears, and the plan that replaces it is named in the label"
    - "A count the plan states is re-counted at execution and the planner's figure is named beside the observation (861 research / 738 re-sketch; 150-200 estimated / 304 re-sketched; the plan's 890 / the tree's 889)"
    - "An insertion into a prettier-padded table stays inside the existing column maxima so the diff is one line; the anchor count is asserted before the write"
key-files:
  created:
    - .planning/phases/13-gui-overhaul/SLOT-ARITHMETIC.md
    - .planning/phases/13-gui-overhaul/13-02-SUMMARY.md
  modified:
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - docs/INSTALL-RUNBOOK.md
    - .planning/STATE.md
key-decisions:
  - "THE CHECKPOINT WAS NOT RE-ASKED. The plan's Task 02 is a checkpoint:decision written before the second probe ran; D-18 chose the probe and the probe answered yes, both on record, so both were quoted and nothing was put to the user. The plan's own text still frames the question as open, and this document says so rather than pretending the plan matched the tree"
  - "THE RESEARCH'S SKETCH WAS RE-SKETCHED FROM ITS PROSE, and the six figures are labelled one remove further from the research's 861 than the plan assumed: the research's scratch is not in the tree, its Z is five bullets and a table, and the re-sketch differs from it by 123 (the research's Z called F, which left the library at 12-07; the research's Button carried a latch flag; the re-sketch carries a clamp). Neither figure is reconciled to the other"
  - "THE OUTCOME IS STATED WITHOUT HEDGING: the four-kind runtime does not fit beside the sweep in one slot (1,062 of 908) and the ceiling on two slots is three kinds. The rotary Knob tips it. This is the second of the plan's two possible outcomes and the third slot is therefore not unnecessary"
  - "THE THIRD SLOT IS DESCRIBED AS A SECOND LIBRARY SLOT rather than as the runtime's new home, because the five-branch sketch does not fit in 255/4 alone either (1,051); the split across 255/4 and the Timer is measured (787 + 324) and handed to 13-14 and 13-15 as the shape the sketch predicts, not as a decision"
  - "ROW H IS CONDITIONAL ON 13-15 AND 13-17 LANDING, not on the checkpoint asking for it: the mechanism half of the bench row has been paid (through Grid Editor), and what remains is HANGAR's own route. The plan's literal marker was written before the probe ran"
  - "gsd-tools state advance-plan, update-progress and roadmap update-plan-progress were NOT run; requirements mark-complete was not run because a document plan completes neither BUILD-03 nor CONT-02"
patterns-established:
  - "A checkpoint whose answer already exists on record is consumed by quoting both halves with their commits and handing the option id downstream by name, and the SUMMARY names the plan text as pre-dating the answer"
requirements-completed: []
duration: 20min
completed: 2026-09-11
---

# Phase 13 Plan 02: The Slot Arithmetic Summary

**Two probes, both answered on the user's ZONA before this plan ran, turned into a five-slot budget
with three slots proved and six per-kind runtime figures under the pinned minifier - every figure
labelled an estimate from an unrun sketch and superseded by 13-15's VM measurement. The re-sketched
four-kind runtime is 1,042 (1,062 in the Timer beside the sweep, 154 over 908), the rotary Knob's own
share is 304 against D-08's 150-200, the two-slot ceiling is three of the four kinds, and the PDF's
page-3 surface is not installable on two slots and is on three - where the runtime spans both library
slots (787 + 324) because the five-branch sketch fits in 255/4 alone no better than in the Timer. The
checkpoint was recorded as answered (D-18, then cell 80) and not re-asked; `three-slots` is handed to
13-14 and 13-15. `+0 / +0`. No device was touched by an agent, nothing was deployed, and neither
shipped record was edited.**

## Performance

- **Duration:** about 20 min
- **Started:** 2026-09-11T01:43Z (reading, after 13-01's close at `c89129d`); first measurement 01:50Z
- **Completed:** 2026-09-11T02:00Z
- **Tasks:** 2 of 2 - one executed, one recorded as already answered
- **Files:** 1 created, 2 modified (plus this document and STATE.md)

## Commits

| Hash      | Message                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `e015a15` | `docs(13-02): the two answered probes turned into a five-slot budget and six per-kind figures, labelled as an unrun sketch's` |

`git commit --only <paths> -F <message-file>`, pathspec before the message flag; the new file was
`git add`ed first because `--only` cannot see an untracked path. No push.

---

## The baseline, carried from 13-01 and held at `+0 / +0`

Tree at `c89129d`, as 13-01 observed it and this plan re-ran it: **86 files / 889 tests (+1 todo) /
88 e2e titles / 108 runs / check 583 / catalog 26 / sweep `4 19`**. 13-01 stated its offset from the
plan's projection once and refused to reconcile; this plan does the same. The plan's literal is
`86 890`; the tree's is `86 889` (12-10's unlanded `+1`), and `check-counts.mjs 86 889` was the gate run.
Phase 12 is at 10 of 12 - 12-06 open at a user checkpoint, 12-10 and 12-12 behind it - and nothing
under `.planning/phases/12-touch-framework/` was touched.

| Name          | Carried (13-01)   | Term         | Observed after 13-02                                  |
| ------------- | ----------------- | ------------ | ----------------------------------------------------- |
| `PREV_FILES`  | **86**            | **+0**       | **86**                                                |
| `PREV_TESTS`  | **889** (+1 todo) | **+0**       | **889** passed, 1 todo                                |
| sweep         | `4 19`            | +0           | **`4 19`**                                            |
| `BASE_CHECK`  | **583**           | +0           | **583** files, 0 errors 0 warnings                    |
| e2e titles    | **88**            | **+0**       | **88** (`grep -c "test("` summed); suite not run, no `e2e/` file moved |
| e2e runs      | **108**           | +0 declared  | not re-measured                                       |
| catalog       | 26                | +0           | 26                                                    |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 86 889`: *matches the expected counts*.
`npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: *matches*. `npm run check`: 583 files,
0 errors, 0 warnings. `npm run lint`: clean. Layer B was green against a build (01:31Z) fresher than
the newest `.svelte`/`.css` (01:08Z); no component moved, so no rebuild was needed.

---

## Task 1: the answered probes turned into a budget

### The probes, quoted with their commits

| Probe                | Result, verbatim                  | Cell   | Commit    |
| -------------------- | --------------------------------- | ------ | --------- |
| 1, D-07 (2026-09-10) | *"bottom right corner lits up!"*  | **80** | `493a21a` |
| 2, D-18 (2026-09-10) | *"bottom right corner!"*          | **80** | `ff3f7b0` |

Probe 1: the touch Setup called the touch Timer's registered body and `P` was defined afterwards -
an event body is a callable method on its element, and the globals it defines persist. Probe 2: the
system element's fourth event (255/4), written through Grid Editor, was called from the touch Setup as
`ele[#ele]` under one of four names and `P2` was defined - the mechanism holds across elements and for
the utility button's slot. `13-RESEARCH.md`'s *"Unverified - needs the bench"* rows for `self:tim()`
and `ele[1]:map()` are superseded by observation and named as such in `SLOT-ARITHMETIC.md` §1.

### The six figures - estimate, from an unrun sketch (13-RESEARCH §3.1); superseded by 13-15

Measured 2026-09-11 with `@intechstudio/grid-protocol@1.20260825.1135` after `initLuaFormatter()`,
`cost = max(compressed, source)`, canonicalised to a fixed point (one minifier round each; the second
pass took zero rounds) and measured twice with the two costs asserted equal. `checkSyntax` is `true`
on every string - it parses; nothing was run. The runtime carries no colour literal, so the picker
corner and every other corner give the same figure.

| Runtime carrying                       | Runtime | + marker + `X(self,20)` | Beside the sweep in 908? | Label                                       |
| -------------------------------------- | ------: | ----------------------: | ------------------------ | ------------------------------------------- |
| vertical fader only                    | **405** |                     425 | yes, 483 free            | estimate, unrun sketch; 13-15 supersedes    |
| vertical + horizontal fader            | **430** |                     450 | yes, 458 free            | estimate, unrun sketch; 13-15 supersedes    |
| faders + button                        | **561** |                     581 | yes, 327 free            | estimate, unrun sketch; 13-15 supersedes    |
| faders + button + XY                   | **738** |                     758 | yes, 150 free            | estimate, unrun sketch; 13-15 supersedes    |
| faders + button + XY + **rotary Knob** | **1,042** |                 1,062 | **no, 154 over**         | estimate, unrun sketch; 13-15 supersedes    |
| **the rotary Knob's own share**        | **304** |                       - | D-08 estimated 150-200: **104 above the top** | the research left the Knob undefined; this re-sketches D-08's description, never run |

**The Knob row, said beside it rather than filled in silently.** The research's table leaves type 5
*undefined*. D-08 makes it a real rotary. The re-sketch of D-08's description - `math.atan` on doubled
coordinates, a ±3.14 wrap, a per-region value so the knob keeps its position between gestures, a
per-contact previous angle - costs 304. That is what one plausible spelling costs under the minifier,
not what D-08's rotary costs; 13-15 writes the real one.

**The research's 861 beside the re-sketch's 738**: −123, and not reconciled - two different sketches.
The research's `Z` called `F(i,n,2)` and **`F` left the library at 12-07** (123 characters, which is a
coincidence of number, not an explanation); the research's Button carried a latch flag this sketch
does not; the re-sketch carries a clamp the research's prose does not mention.

**Every combination was measured** (31 rows, in `SLOT-ARITHMETIC.md` §3): any surface without an XY
pad fits beside the sweep (the largest, `vhbk`, at 885), any surface without a Knob fits (`vhbx` at
758), and XY pad plus Knob fits only with at most one fader orientation and no button, at margins of 2
and 6 that an unrun sketch cannot call fits.

### The two-slot ceiling, stated plainly

**Three of the four element kinds.** The measurement produced the second of the plan's two outcomes:
the four-kind runtime does **not** fit beside `X(self,n)` in one slot, and the rotary Knob is the kind
that tips it. **The PDF's page-3 surface - a 2×6 Fader, an XY pad, a Button and a Knob - is not
installable under two slots**: the estimated pair is **1,042 runtime** (1,062 with marker and sweep)
beside **889 usable**, and **366** (the research's, unrun) for the data in Setup. The data fits; the
runtime is 154 over.

**Under three slots it is installable as drawn, with one condition the probe results did not state.**
The five-branch runtime is **1,051 with its marker and does not fit in 255/4 alone either** (143 over).
The third slot is a second *library* slot, so the runtime spans both: measured here, the four-branch
dispatcher with a Knob hook in **255/4 at 787** (121 free) and the Knob function beside the sweep call
in the **touch Timer at 324** (584 free) - 1,111 of 1,816. 13-17's four-strings table, which puts only
the sweep call in the Timer under the third slot, describes the case the sketch says does not arise for
a four-kind surface; its own "count the frames first" step covers it.

### The five-slot budget

| Slot                 | Address | Proved                    | Figure                          | Label                                  |
| -------------------- | ------- | ------------------------- | ------------------------------- | -------------------------------------- |
| system Setup         | 255/0   | written since 12-02       | **769**, 139 free               | **measured** (12-07-SUMMARY)           |
| system fourth event  | 255/4   | **reachable - probe 2**   | 908                             | not written by HANGAR until 13-17      |
| system Timer         | 255/6   | never asked               | 908                             | named so five is not mistaken for four |
| touch Setup          | 0/0     | written today             | 366 at 4 elements, 811 at 16    | estimate, research §3.1; 13-14 measures |
| touch Timer          | 0/6     | **library slot - probe 1** | sweep call **19**, 889 usable  | measured here                          |

### The element addressing, re-read from `12-02-SUMMARY.md`

`SLOT-PROBE.md`'s *"HANGAR does not write element 255 yet"* is **stale as to 255/0 and still true as to
255/4**. 12-02 landed `ELEMENT_SYSTEM = 255` in the descriptor and the response filter and `writeAll`
writes 255/0 first; `sequence.spec.ts` asserts no frame addresses 255/4 or 255/6, and under D-19 that
refusal is a pending removal owned by 13-17. **255 is the wire address; `ele[#ele]` is the Lua index**,
and `ele[#ele]` is the spelling that lit - the research's `ele[1]` is the same element on a ZONA by
`init.lua:46-50`'s convention but was not what ran. 13-14 emits `ele[#ele]`.

### Row H, and the ledger row

`docs/INSTALL-RUNBOOK.md` gained **one line** after row G, inside the table's existing column maxima
(Row 72, Do this 432, Passes 1,750, Why 1,076 characters) so prettier re-padded nothing: `git diff`
shows 1 insertion, 0 deletions. The row is marked *only after 13-15 and 13-17 land*, carries both extra
risks (the write replaces `gpl(gpn())` until PUT BACK; the wire address is 255 where the Lua index is
`ele[#ele]`) and asks the user to record the name 13-15 emitted and whether the button moved the page
after PUT BACK. The runbook's intro still says *"Seven rows"* - left, because a one-word edit of an
existing line is the reflow the plan forbids; 13-20 rewrites it.

`13-COPY-NEW.md` gained one ledger row (10 lines with the question) against the open-failure family:
`transport.ts:150` (`port-busy`, CONN-04, names Grid Editor and its tray icon) and `:190` (the
`default` branch, which produced *"The port would not open"*). The observation is quoted; the probe's
own sentence - *Another tab may be holding your ZONA.* - is offered for 13-18's batch; nothing was
landed because this plan authored no code.

---

## Task 2: the checkpoint, recorded as answered

The plan's Task 02 is a `checkpoint:decision` written before the second probe ran; its text still
frames the third slot as open. **Both halves of the answer were already on record, so both were quoted
and nothing was asked.**

**D-18** (`13-CONTEXT.md`, `13f35a7`): *"Offered: ship on two (at the risk of reversing D-08 and
deferring the XY pad, neither an executor's call), take the second probe, or write the row and defer.
**The user chose the second probe.**"*

**The probe** (`PROBE-RESULTS-2026-09-10.md`, second section, `ff3f7b0`): *"**Cell 80.** A **touch**
script called the **system** element's fourth slot and the global it defined persisted. The mechanism
the first probe proved between two events of one element **holds across elements too**, and it holds
for the slot the firmware binds to the utility button. **D-18 is met: Sandbox v1 has three
908-character slots.**"* And: *"13-02's checkpoint is **fully answered before the plan runs**: D-18
chose the probe, and the probe said yes. The executor records both and asks nothing."*

**The recorded answer is `three-slots`** - the plan's `third-slot` option, taken and then run. Handed
by name: **13-14** emits against three slots with both pull-in calls; **13-15**'s VM measurement is
headroom confirmation, not a ceiling decision, and its re-ask rule stays - if the measured runtime lands
larger than the sketch by more than the slot gained, it goes back to the user; **13-17** owns the 255/4
write and its PUT BACK under D-19. Left open as the probe left it: **which of `map`, `mapmode`,
`utility`, `util` is real** (13-15 reads `grid-fw` and confirms with one tap). **The action colour was
not asked**: D-16 settled it at `#DCFF71` and 13-03 writes against it. Every figure on this page is an
estimate from an unrun sketch, superseded by 13-15.

---

## Deviations from the plan

### 1. [Plan pre-dates the record] The checkpoint was recorded, not presented

Task 02 asks a question whose answer exists at `13f35a7` and `ff3f7b0`. Quoting both and asking nothing
is the orchestrator's instruction and the probe results' own downstream sentence.

### 2. [Planner defect, named] The research's sketch is not in the tree

The plan says "measure ... from the research's §3.1 sketch". The sketch's Lua was a deleted scratch;
§3.1 carries prose and a table. The runtime was **re-sketched from that prose** and every figure is
labelled one remove further than the plan assumed. The research's `Z` also called `F`, which 12-07
removed; a finger light in the Sandbox runtime is now 13-15's to price.

### 3. [Plan pre-dates the record] Row H is conditional on 13-15 and 13-17, not on the checkpoint

The plan's marker *"only if the checkpoint asks for it"* is moot: the mechanism row has been paid
through Grid Editor. The row covers what remains - HANGAR's own route, the name, and PUT BACK.

### 4. [Rule 1] The `record-metric` duration was corrected in STATE.md

The metric was first recorded as 80 min; the commits (`c89129d` 01:43Z to `e015a15` 01:57Z) say about
20. The row was edited to 20min.

### 5. [Process] `advance-plan`, `update-progress`, `roadmap update-plan-progress` and `requirements mark-complete` not run

STATE.md's position stays Phase 12's (10 of 12, 12-06 open) with Phase 13 recorded alongside at 2 of
20; `percent` reads 100 and is left. BUILD-03 and CONT-02 are claimed by this plan's frontmatter and
completed by no document. `record-metric`, three `add-decision`s and `record-session` were run with a
copy taken first; they corrupted **line 5 `status:`** (to 12-11's paragraph), **line 11
`completed_phases`** (11 → 12) and nothing else; both were repaired by inverse edit and the diff against
the copy was asserted to hold only the intended lines.

---

## What the plan asserts that the tree does not support

1. **`86 890`** - the tree is `86 889`; the gate ran at 889 (13-01's offset, carried).
2. **"the research's §3.1 sketch"** as something to measure - not in the tree; re-sketched from prose.
3. **"The second bench row ... marked only if the checkpoint asks for it"** - already run; row H is
   conditional on 13-15 and 13-17 instead.
4. **The interfaces block's `ele[1]:map()`** (12 characters) - the spelling that lit is `ele[#ele]`
   (15-19 by name); the research's `self:tim()` "11 characters" measures 10.
5. **"861 (no Knob) + 19 = ~880, 28 free"** in the interfaces budget - the re-sketch's four-kind runtime
   is 738, and with the Knob 1,042; neither is 861 and the arithmetic is redone from measured strings.
6. **13-17's four-strings table** (the Timer holding only the sweep call under the third slot) - the
   sketch says a four-kind runtime spans both slots; recorded for 13-17's own "count the frames" step.
7. **The probe results' "fits with room"** for the four-kind runtime under three slots - true only with
   the runtime split across 255/4 and the Timer, which the results did not say.

---

## Questions recorded for the user rather than answered

None asked. One recorded in `13-COPY-NEW.md` for 13-18: which raw message the browser gave when the
port held by another HANGAR tab reached the `default` branch instead of `port-busy`, and therefore
whether `port-busy`'s detail gains a second culprit or the `default` branch gains the sentence.
Flagged for attention, not asked: the runbook's intro says seven rows and there are eight (13-20).

---

## What was NOT done, and why

- **NOTHING HERE IS HARDWARE-VERIFIED BY AN AGENT. No device was touched. Nothing was deployed.** The
  only hardware facts on this page are the two probe files, in the user's own words.
- **Neither shipped record was edited**: `git diff --quiet` on `SLOT-PROBE.md`, `SLOT-PROBE-2.md` and
  `PROBE-RESULTS-2026-09-10.md` passes.
- **`src/vendor/` unmoved; `firmware-oracle.spec.ts` unedited and green; `.planning/ROADMAP.md`
  byte-unchanged; CAT-04 stays `[ ]`; nothing under `.planning/phases/12-touch-framework/` touched; no
  sibling repository read or written.**
- **`prettier --write .` was not run**; only `docs/INSTALL-RUNBOOK.md` was formatted (`.planning/` is
  prettier-ignored) and the three root files are the user's, untouched.
- **The scratch scripts** (`measure-13-02.mjs`, `combos-13-02.mjs`, `split-13-02.mjs`,
  `patch-13-02.mjs`) lived in the session scratchpad outside the tree and are not committed;
  `git status --porcelain` shows only the user's three root files.
- **Playwright was not run**: no `e2e/` file moved; 88 titles by grep, `+0` declared.
- No transient failure appeared in any suite this plan ran.

## Notes for the next plans

- **13-14:** read `SLOT-ARITHMETIC.md` §2-§4; emit `ele[#ele]:<name>()` and the Timer pull-in both;
  the data half is the research's 366 / 811 until you measure it.
- **13-15:** the sketch's canonical strings are printed in §3 for comparison, not for reuse; the Knob's
  304 is a spelling, not a measurement; `F` is gone, price the finger light; the four-kind runtime
  spans two slots per the sketch - measure whether yours does.
- **13-17:** count the frames; the sketch predicts four strings for a four-kind surface.
- **13-18:** one row, one question. **13-20:** row H exists; the intro's "seven" is yours.

---

## Self-Check: PASSED

```
FOUND  .planning/phases/13-gui-overhaul/SLOT-ARITHMETIC.md
FOUND  .planning/phases/13-gui-overhaul/13-COPY-NEW.md
FOUND  docs/INSTALL-RUNBOOK.md
FOUND  .planning/STATE.md
FOUND  .planning/phases/13-gui-overhaul/13-02-SUMMARY.md
FOUND  commit e015a15
```
