---
phase: 13-gui-overhaul
plan: 20
subsystem: docs
tags:
  [
    gate,
    chain,
    twenty-terms,
    phase-12-1-offset,
    no-radius,
    empty-allowlist,
    six-circles,
    picker-corner,
    amendments,
    qualifiers,
    minted-rows,
    prev-04,
    batch-rows,
    bench,
    checkpoint,
    negative-check,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 19
    provides: "The tree at 24e2790: 94 / 961 (+1 todo) / 83 e2e titles / 99 runs / check 657 / catalog 26 = 8 + 18 / static/og/ 26 at 154,136 B / sweep 4 19 / audition 28 / runbook A-M / radius allowlist 0 rows / the library 842 + 873; every 13-NN-SUMMARY.md 01..19 with its own count line and term; 13-GATE-NOTES.md; 13-18-BATCH.md with the rows handed to this plan by number"
  - phase: 12-touch-framework
    plan: 12
    provides: "The carried block 85 / 888 / 87 / 106 / 26 / 26 / 23 / A-G / 4 19, and the gate's register: the chain with the term count asserted, the other phase's offset stated once, the amendments by name and dated with the old text kept, the five-section work list, the bench rows handed over unanswered"
  - phase: 12.1-gradient-touch
    plan: 09
    provides: "The 12.1 offset stated once for this gate (+25 / +1 / +0 / +0 / audition +5 / runbook +2), 13-09's -11 named as -9 by its parts, the bench rows of Phases 12 and 12.1 already handed over"
provides:
  - "docs/TESTING.md 'Phase 13's suites, measured at the gate', inserted whole before the vendored-tree section (650 lines, zero deletions): the block at 24e2790, eleven chains in TWENTY terms with the count asserted and every prose statement of it listed by line, 13-01's offset applied once and the 12.1 offset once with both ends meeting on every row, the per-file table from the runner's JSON against eb79e3c (+74 = 48 + 25 + 1), the reconciliation at +48 against the projection's +47 with the three rows named, the three-layer radius gate with the allowlist EMPTY and the six circles' boxes in both engines, the negative check's order, every run with the memory beside it, the picker-corner table, the Sandbox's five costs and the PDF's page 3 on five slots, twenty-five planner errors, the batch rows landed and owed, corrections to earlier sections by line, the gate holes"
  - "Twelve batch rows landed under D-23 as strings held by the specs that pinned the old ones - I.8.1-7 and I.3.12 (the seventh recovery step; CONN-04 amended), F.4, G.31, G.36, H.20, H.21 - and J.1 (the favicon square in #101210 / #dcff71 with identity.spec.ts 11 re-pinned); the term still +0 / +0"
  - ".planning/REQUIREMENTS.md: IDENT-01 amended clause by clause (four of five falsified; the accent named as #DCFF71 under D-16, the scale as 36 / 30 / 17 under D-17), TUNE-07 twice over, SHARE-02, TUNE-06, SAFE-03 (five strings, per page) and CONN-04 amended by name and dated with the old text kept; PREV-04 ticked on three reaches with the untested one named; the fourteen minted rows judged and ticked with their evidence and their unproved halves; a PHASE 13 GATE QUALIFIER on all fifty-three grep-built ids, reconciled by script; CAT-04 still [ ] for the seventh time"
  - ".planning/phases/13-gui-overhaul/deferred-items.md in 12-12's five sections: thirty-two items with what closes each, the ten approved-and-owed batch rows with the exact edit, G.34 decided keep, Grifter's licence, the two Rule-1 findings, thirty-two open questions with the plan that filed each, every SUMMARY's item with its state, Phase 12's file walked"
  - "docs/INSTALL-RUNBOOK.md: the label map for rows A-K and 'The bench, as the Phase 13 gate hands it over' in the plan's order (I, L, H, M, the five look rows, the favicon, the wordmark, the six circles, C and E again); docs/HARDWARE-AUDITION.md: one dated paragraph, the table unchanged at 28"
  - "The bench rows handed over unanswered at task 03 - the two decisions the phase could not make first"
affects: [the user's bench, the next gap plan (J.19, J.13, I.6.5, E.14, E.15, J.10, J.23, J.25, J.30, J.40), a wrangler quick task]
tech-stack:
  added: []
  patterns:
    - "A gate on a tree three phases share rebuilds its own chain from the block the previous gate left, states the other phase's offset once by name, and applies a carried offset only where it closed - 13-01's -1 was 12-10's unlanded +1 and closed itself at 13-07"
    - "The grep reconciliation of claimed requirement ids is a script that exits 1 naming the silent id, run once for real and once against a copy with one qualifier deleted; a manual list is what it replaces"
    - "An approved batch row the gate cannot land as a string with a spec already pinning it is recorded as approved-and-owed with the exact edit, never re-asked"
key-files:
  created:
    - .planning/phases/13-gui-overhaul/deferred-items.md
    - .planning/phases/13-gui-overhaul/13-20-SUMMARY.md
  modified:
    - docs/TESTING.md
    - docs/INSTALL-RUNBOOK.md
    - docs/HARDWARE-AUDITION.md
    - .planning/REQUIREMENTS.md
    - src/lib/transport/transport.ts
    - src/lib/transport/transport.spec.ts
    - src/lib/device/session.spec.ts
    - e2e/session.e2e.ts
    - e2e/first-experience.e2e.ts
    - src/routes/playground/[id]/+page.svelte
    - src/lib/sandbox/copy.ts
    - src/lib/sandbox/geometry.ts
    - src/lib/store/transfer.ts
    - src/lib/assets/favicon.svg
    - src/lib/ui/identity.spec.ts
    - .planning/STATE.md
key-decisions:
  - "THE CHAIN IS TWENTY TERMS FROM 12-12'S BLOCK AND BOTH ENDS MEET WITH THE 12.1 OFFSET STATED ONCE: 888 + 48 + 25 = 961 and 85 + 8 + 1 = 94 on every row, with 13-09's stated -11 taken as -9 by its parts (12.1-09's finding, confirmed from the per-file JSON) and 13-01's -1 applied once as 12-10's +1"
  - "THE ALLOWLIST IS EMPTY AND THAT IS D-01 PROVED: 0 rows, 33 declarations in 68 files all exempt or the six circles, layer B tolerating nothing, layer C STRICT over twelve routes in two engines, the six boxes 2 / 12 / 2 / 8 / 12 / 2 square to the hundredth in both, and a planted 2px caught by A in 85 ms, by B twice (staleness, then the value) and by C in both engines on every route"
  - "PREV-04 IS TICKED, NOT HEDGED: three reaches, two pinned by tests, the workspace's Play named as the untested one and carried as a gate hole with the one e2e title that closes it"
  - "THE FOURTEEN MINTED ROWS ARE ALL TICKED, each with the test that proves it and the desk row that would prove the rest; KEEP-01's tick carries the phase's one non-delivery on its row by name - no route writes a Playground draft (J.19, owed)"
  - "TWELVE BATCH ROWS LANDED, TEN OWED, ONE DECIDED: a string with a spec pinning the old one is landed (fourteen strings across seven modules, three specs and two e2e titles re-pinned, CONN-04 amended for the seventh step); a column, a codec, a store behaviour or a new control is recorded with the exact edit in deferred-items.md and not re-asked"
  - "CAT-04 STAYS [ ] FOR THE SEVENTH TIME, and this is the first decline written for a row no plan in the phase claimed - the grep over twenty plans returns fifty-three ids and CAT-04 is not among them"
  - "THE PHASE IS RECORDED AS GATE LANDED, BENCH PENDING - not complete - because task 03 is the user's bench and no agent in Phase 13 has touched a device"
  - "NO DEVICE WAS TOUCHED, NOTHING WAS DEPLOYED, src/vendor/ IS UNTOUCHED, firmware-oracle.spec.ts is unedited since b3a554d, protocol-pin and forbidden-instructions green and unedited by the gate"
patterns-established:
  - "The six circles' boxes are measured by a probe outside the suite when the suite's own title prints tallies and not boxes; the probe lives in the scratchpad and the numbers in the document"
requirements-completed: [PREV-04, BUILD-01, BUILD-02, BUILD-03, BUILD-04, BUILD-05, BUILD-06, BUILD-07, BUILD-08, KEEP-01, KEEP-02, KEEP-03, KEEP-04, KEEP-05, KEEP-06]
duration: about 120 min for tasks 01 and 02 (08:38Z to 10:40Z, the machine's UTC clock, 2026-09-12); task 03 is the blocking checkpoint and is NOT answered here
completed: 2026-09-12
---

# Phase 13 Plan 20: The gate - every number re-measured, the twenty-term chains from 12-12's block with the 12.1 offset stated once, the allowlist asserted empty, six requirements amended and fourteen judged, the batch rows landed or owed, and the bench rows handed over Summary

**The phase's twenty-term chain ends at `85 + 8` / `888 + 48` - 93 files, 936 tests - with the term
count asserted at twenty on every one of eleven rows, and the tree at `24e2790` reads 94 / 961 (+1
todo) / 83 / 99 because Phase 12.1 ran its nine plans in the same tree; its offset (+1 / +25, e2e
+0 / +0, audition +5, runbook +2) is stated once by name and the two ends meet on every row - the
tests row through 12.1-09's named finding that 13-09's stated −11 is −9 by its parts, confirmed
here from the runner's per-file JSON. The radius allowlist is **EMPTY** - 0 rows, layer B tolerating
nothing, layer C strict over twelve routes in two engines - and the six circles D-15 names measure
2 / 12 / 2 / 8 / 12 / 2 square to the hundredth of a pixel in chromium and webkit-phone; a planted
2px was caught by A first, then B, then C. Every entry's picker-corner figure is identical to
12.1-09's and every header agreed; the Sandbox's five costs and the PDF's page 3 on five slots are
what 13-14, 13-15 and 13-17 pinned. Three quick runs green before the gate's own landings and one
after, the sweep `4 19` in 96 s, the e2e suite twice in five chunks (99 runs each; every red a
retried write or a cold locator under three workers at a twentieth of the machine's memory, every
one green alone). Six requirements amended by name and dated, PREV-04 decided and ticked on three
reaches, the fourteen minted rows judged and ticked, fifty-three grep-built ids qualified by script,
CAT-04 still `[ ]` for the seventh time. Twelve of the batch rows handed here landed as strings,
ten are recorded as approved and owed with the exact edit. Twenty-five planner errors named.
**Nothing touched a ZONA, nothing was deployed, and the bench rows - the page switch and the rotary
Knob first - are handed over unanswered at the checkpoint below.** The phase is gate landed, bench
pending.

## Performance

- **Duration:** about 120 min across tasks 01 and 02 (plus the third commit for task 03's
  documents), in one executor session, no interruption; task 03 is the blocking human checkpoint
  and is not answered
- **Tasks:** 2 of 3 (task 03's documents written and committed; its answer is the user's)
- **Files:** 2 created (deferred-items.md, this document), 16 modified across three task commits
  plus this document's own

---

## The re-measured block against 12-12's carried block, with both offsets

On the tree at `24e2790`, 2026-09-12, against a fresh `npm run build`. The machine had between
**0.05 and 1.33 GB of 16 GB free** at the start of each command; the figure beside each run is in
`docs/TESTING.md`'s table.

| Name             | 12-12's block (the carried one) | Phase 13's chain (twenty terms) | 12.1's offset (stated once) | 12-10 | **Observed at `24e2790`**                          |
| ---------------- | ------------------------------- | ------------------------------- | --------------------------- | ----- | -------------------------------------------------- |
| quick files      | 85                              | +8 = **93**                     | +1                          | +0    | **94**                                             |
| quick tests      | 888 (+1 todo)                   | +48 = **936**                   | +25                         | (inside 888) | **961 (+1 todo)** - three runs green at `--maxWorkers=2`, a fourth for the JSON, a fifth and a sixth after the landings |
| e2e titles / runs | 87 / 106                       | −4 / −7 = **83 / 99**           | +0 / +0                     | -     | **83 / 99**; `--list` 99; 16 tagged; two chunked runs at 99 |
| `svelte-check`   | 604 at `fed9c17` (581 at 13-01) | provenance                      | +2                          | +1    | **657 files, 0 errors, 0 warnings**, 28 s          |
| `npm run lint`   | clean                           | -                               | -                           | -     | clean, 56 s                                        |
| sweep            | `4 19`                          | `4 19`                          | `4 19`                      | -     | **`4 19`**, 96 s wall (91.8 s in Vitest); reachability 44,846, over 0; the cross-product 1,296, worst 906 |
| build            | 19 s                            | -                               | -                           | -     | **40 s** at 0.22 GB, then 28 s and 27 s; 26 images, **154,136 B**, byte-identical to 13-19's |
| catalog          | 26 (8 + 18)                     | twenty zeros = **26**           | +0                          | -     | **26**, 8 preset-backed + 18 hand-authored, eighteen names re-cased |
| `static/og/`     | 26                              | twenty zeros = **26**           | +0 (re-rendered twice)      | -     | **26 / 154,136 B**                                 |
| audition rows    | 23                              | twenty zeros = **23**           | +5                          | -     | **28**, 24 Config cells re-cased, all unanswered   |
| runbook rows     | 7 (A-G)                         | +1 +1 +1 +1 = **11** (H, I, L, M) | +2 (J, K)                 | -     | **13** (A-M)                                       |
| radius allowlist | 33 declarations, 16 rows (13-01) | −33 / −16 = **0 / 0**          | -                           | -     | **0 rows**; 33 declarations in 68 files, 27 exempt + 6 circles |
| the six circles  | 6 (D-15)                        | twenty zeros = **6**            | -                           | -     | **6**, at `:840 / :867 / :882` and `:730 / :785 / :807` |
| the manifest     | 6 files / 22 rows               | +0                              | +16                         | -     | **6 / 38**, `dae35d39…`                            |
| the library      | 769 / 139                       | +0 (read, never edited)         | → 842 / 66 + 873 / 35       | -     | **842 / 66 + 873 / 35**, both fixed points         |

`check-counts.mjs 94 961` matched on runs 1, 2, 3, 4 (JSON), 5 and 6; `4 19` on the sweep.
`test-results/` removed after every Playwright run; `git status --porcelain` clean of everything
but the user's three root files before each commit.

**13-01's offset, applied once.** 13-01 observed `85 / 887` against the projected `85 / 888` and
recorded `−1`; that was 12-10's unlanded `+1` (the TRACKPAD smoke test), which landed between 13-06
and 13-07 (13-06 closed at 902, 13-07 opened at 903). 12-12's chain ends at `85 / 888` and its tree
read `88 / 903 = 888 + 15` with Phase 13's first six terms - so 12-12's observed pair IS the
projection's pair and the offset closed itself. It appears once, as the `+1` above, and nowhere
else.

### The runs, every red named

The full table with the memory beside each is in `docs/TESTING.md`. In one paragraph: quick 1, 2, 3
and the JSON run green at 94 / 961 (0.78, 0.07, 0.47, 0.38 GB free), no transient - the first gate
at which the `install.spec.ts` connect-snapshot timeout did not appear; the sweep at 0.23 GB; e2e
run 1 `34 + 21 + 20 + 13 + 11 = 99` with two reds (`[webkit-phone] install.e2e.ts:1977` CLEAR, 6
CONFIG/EXECUTE for 5; `[chromium] browse.e2e.ts:343`, `write UNKNOWN` on the CDP pipe); e2e run 2
`34 + 21 + 20 + 13 + 11 = 99` with one dead server (chunk 2 at start-up, a libuv assertion, rerun
whole) and seven reds (`install:1434` 7 for 5, `install:1977` in both projects, `session:851` the
module named itself twice, `session:1009` six reads for five, `browse:299`, `browse:1404` 5 cards
for 3), every one green alone at `--workers 1` (`browse:1404` on its second solo run,
`install:1977` on the phone engine on its fourth attempt); after the gate's own string landings, a
rebuild, quick 5 green, chunks 1 and 4 again (`install:1434` and `install:1977` red once more,
green alone; all sixteen session titles green including the two re-pinned to seven steps), quick
6 green at 0.15 GB, lint and check clean. **No red named a page target, a review, a switch, a
count this phase wrote, a string 13-18 or 13-19 moved, or a string this gate landed.** The one
title red five times before green - `install.e2e.ts:1977` on the phone engine - scripts a 200 ms
acknowledgement delay under a 250 ms `executeMs`; the store's bounded retry (SAFE-09) is what the
fake counts as the sixth frame. Carried in `deferred-items.md` A.21 as a harness margin.

---

## The twenty-term chains, every term reconciled

```
wave            01  02  03  04  05  06  07  08  09  10  11  12  13  14  15  16  17  18  19  20
plan            01  02  03  04  05  06  07  08  09  10  11 [13][12] 14  15  16  17  18  19  20
tests    888    +2  +0  +5  -8  +6 +10  -2  +3  -9  -1  +3  +8  +6  +9  +7  +6  +3  +0  +0  +0  = 936
files     85    +1  +0  +0  +0  +1  +1  +0  +0  -1  -1  +0  +2  +1  +2  +1  +1  +0  +0  +0  +0  =  93
e2e ttl   87    +1  +0  +0  -4  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  83
e2e run  106    +2  +0  +0  -8  +0  +0  -6  +0  +0  +0  +0  +1  +1  +0  +0  +2  +1  +0  +0  +0  =  99
catalog   26    +0 ×20                                                                         =  26
og        26    +0 ×20                                                                         =  26
audition  23    +0 ×20                                                                         =  23 (28 with 12.1)
runbook    7    +0  +1  +0  +0  +0  +0  +0  +0  +0  +0  +0  +0  +1  +0  +1  +0  +1  +0  +0  +0  =  11 (13 with 12.1)
allowlist 33    -1  +0  -1  -4  +0  +0  +0  -5 -16  -5  -2   -   -   -   -   -   -   -   -   -   =   0
circles    6    +0 ×20                                                                         =   6
sweep   4 19     -  ×20                                                                        = 4 19
```

**Eleven rows, twenty terms each, counted**: twenty `13-*-PLAN.md` files, twenty columns in
`13-VALIDATION.md`'s block, twenty here, with 13-13 at wave 12 and 13-12 at wave 13. Every
statement of the term count in `13-VALIDATION.md` (`:84, :86, :86, :500, :717`) and in
`13-20-PLAN.md` (`:19, :26, :141, :154-156, :160, :311, :329, :348, :364, :368, :408, :534, :565`)
reads twenty; every reconciliation statement reads twenty-seven (`13-VALIDATION.md:489, :497,
:500, :501`; `13-20-PLAN.md:183, :193, :196, :197, :350, :367`); `13-20-PLAN.md:41`'s "Nineteen
plans" counts the plans before the gate. The one count both documents get wrong is not a term
count: "twenty-seven names" is twenty-six (the catalog since 12-10). `2+0+5−8+6+10−2+3−9−1+3+8+6+9+7+6+3+0+0+0 = 48`;
`1+0+0+0+1+1+0+0−1−1+0+2+1+2+1+1+0+0+0+0 = 8`. **The observed `PREV_TESTS` ladder** in the SUMMARYs
- 887 → 889, 889, 894, 886, 892, 902, 903 → 901, 904, 904 → 899 (through 12.1-01's +4), 906 → 905,
907 → 912, 913 → 921, 921 → 928, 936 → 945, 952, 958, 961, 961, 961, 961 - is every plan's term on
the baseline it observed. **The per-file table from the runner's JSON against a textual count at
`eb79e3c`** rebuilds the 48 from the other end in twenty-five Phase 13 rows (2+4+1−7−2+6+10−5+4−3+3+2+1−8−2+4+1+4+4+4+4+5+7+6+3 = 48)
and the 12.1 and 12-10 rows sum to 26; 887 + 74 = 961.

**Every projection 13-VALIDATION got wrong, named:**

| Term                          | Projected                     | Observed                                      | Kind                                                                                 |
| ----------------------------- | ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| 13-04 tests                   | −9                            | **−8**                                        | document defect: `aesthetic.spec.ts` 8 → 2 at 13-04, scan 4 to 13-09                 |
| 13-06 tests                   | +7                            | **+10**                                       | document defect: `local.spec.ts` created with ten                                    |
| 13-07 tests                   | −1, then −2 at the plan-check | **−2**                                        | corrected before execution; the source named                                         |
| 13-09 tests                   | +2, then −6 at the plan-check | **−9** (stated −11)                           | document defect (two assigned deletions missed) AND plan defect (the −11 ladder)     |
| 13-10 tests, by parts         | `tune-ui −2 +3`               | `tune-ui −2 +2, surprise +1`                  | document defect in the parts, the term right                                         |
| the per-file table            | 27 terms, +47                 | **28 terms, +48** (`local`, `front-door`, `surprise`) | document defect                                                              |
| the baseline block            | catalog 27, OG 27, audition 23, "twenty-seven names" | 26, 26, 28 with 12.1, twenty-six names | document defect (predates 12-10's fold)                                        |
| the phase total               | 93 / 935                      | **93 / 936** by the chain; 94 / 961 on the tree | one low                                                                             |
| the research's forecast       | files 84-88, tests 890-930    | 93, 936                                       | research defect: five and six under its own tops                                     |
| the research's costs          | 1,067 / 1,166 / 861 / 366 / 811 / 697 | 345 / 460 (the split); 1,042 / 460 / 882 / 805 | research defect, every figure low (+94 to +181 where comparable)              |
| D-08's rotary                 | +150-200                      | **298**                                       | decision estimate, 98 above the top                                                  |
| 13-02's two-slot ceiling      | three kinds                   | **two kinds**                                 | an unrun sketch's; moot under three slots                                            |
| `PadSpinner` deletable        | yes (research)                | three live consumers                          | research defect (13-09)                                                              |
| D-15's glosses; the allowlist's 43 / Knob's ten | the plan's         | tick / thumb / home; 41, nine, five           | plan defects (13-01)                                                                 |
| 13-05's floor holds the grid  | 380                           | needs 454; reflow (D-21)                      | plan defect found by a test, decided by the user                                     |

The full list of twenty-five is in `docs/TESTING.md`'s "Where the planner was wrong", including the
research's ordering defects (the coverflow at wave 3, persistence at wave 7, the count gate's
exposure, the eight FOR terms, the `ele[1]` spelling) and the plan's own (three `50%` boxes beside
its six; `check-counts.mjs 93 935`; one Playwright run at 99; every conditional branch it wrote
for having closed the other way; row H's condition; the twelve dead links).

---

## The picker-corner re-measurement - every header agreed, every figure 12.1-09's

Measured by a scratch spec copied into `src/lib/catalog/` for one run and deleted (12-12's shape;
`max(text.length, measureLua(text))` after `padReady()`, the picker corner every knob at its longest
value with colours at `255,255,255`, every string a fixed point and `checkSyntax` true). **Every one
of the eighteen entries' six figures, both library rows and the nine presets' declared costs is
identical to 12.1-09's table** (`diff` of the two harness outputs is empty on the entries and the
library), and it should be: `git diff 5c256c5 HEAD -- src/lib/catalog/entries/` is eighteen `name:`
lines and nothing else. Setup / Timer at the picker corner with free: trackpad **903 / 5**, **510 /
398**; wheels 895 / 13, 343 / 565; strip 875 / 33; quadrant 838 / 70; chorus 822 / 86, 29 / 879;
morph 814 / 94; console 807 / 101; pomodoro 743 / 165, 659 / 249; lumen 733 / 175; euclid 726 /
182, 237 / 671; stage 653 / 255, 136 / 772; radar-points 592 / 316, 288 / 620; snake 585 / 323,
**880 / 28**; sonar 572 / 336, 289 / 619; cull 565 / 343; arc 528 / 380, 275 / 633; ghost 491 /
417, 409 / 499; steps 420 / 488, 260 / 648; **the library 842 / 66 + 873 / 35**; the presets 361 /
413 / 349 / 391 / 491 / 565 / 525 / 592 and the shelf's 902 at their defaults, `presets.ts`
agreeing. The audition table's cost cells are 12.1-09's and unmoved. No header was corrected
because none disagreed.

**The Sandbox's five costs** (`emit.spec.ts` 1, pinned): 1 element **345**, 4 **460**, 8 **588**,
12 **748**, 16 **882** at two slots (+15 at three), sixteen at typed literals 841; `M` 169, `J` at
four rows 155, the paint 101. **The runtime** (`runtime.spec.ts` 7): 1,340 with every branch,
1,042 without the Knob, the rotary's share 298; fifteen of thirty-one kind combinations fit two
slots, all fit three. **The PDF's page 3 on five slots** (`install.spec.ts` 25-27): 255/6 873, 255/0
842, 255/4 **706** (202 free), 0/6 **574** (334 free), 0/0 **466** (442 free); on two slots a Timer
of 1,248 (340 over) and zero frames on the transport.

---

## The radius gate, asserted empty, and the six circles measured

| Layer | At the gate                                                                                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `33 declarations in 68 files scanned; 0 above zero remaining in 0 allowlisted files (); 6 circles (D-15): ColourPicker.svelte:840, :867, :882, Knob.svelte:730, :785, :807; 27 exempt` - **`ALLOWLIST` is `[]`**                          |
| B     | `35 radius declarations in 16 built stylesheets; 6 of them 50%; tolerated values from the allowlist: none`                                                                                                                             |
| C     | `12 routes, 2793 elements, 87 circles measured square; STRICT (the allowlist is empty)` in chromium; `2864 elements, 87 circles` in webkit-phone; aurora 47, arc 13, `/sandbox/?new` 27, the seven `/dev/` pages and the intro and gallery 0 |

The six lines re-read at HEAD each read `border-radius: 50%;` and `grep -rn border-radius src`
finds no other value above zero outside a comment. **The six boxes, by a probe outside the suite on
the served build** (`getBoundingClientRect` on every element computing `50%`, both engines):
`picker:tick` **2.00 × 2.00** (21 on aurora), `picker:thumb` **12.00 × 12.00** (3), `picker:home`
**2.00 × 2.00** (3), `knob:dot` **8.00 × 8.00** (24), `knob:thumb` **12.00 × 12.00** (1, arc's
16-value knob), `knob:home` **2.00 × 2.00** (8) - `|w − h| = 0.000` on every one in chromium and in
webkit-phone.

**The negative check**: `border-radius: 2px` planted at `src/lib/ui/shell/Footer.svelte:118`. **Layer
A first**, 85 ms, `src/lib/ui/shell/Footer.svelte:118 border-radius: 2px`; layer B at the same
moment red for staleness (`Footer.svelte was modified after build/_app/immutable/assets was
written … a scan of it proves nothing`), and after a rebuild red on the value
(`build/_app/immutable/assets/0.BJ6xdJgt.css: border-radius: 2px`, tolerated: nothing); layer C red
in **both** engines on all twelve routes (`<footer.footer data-testid="shell-footer"> computes
border-radius 2px | 2px | 2px | 2px and the allowlist is empty: never a rounded corner (D-01)`).
Restored from the copy, sha256 `d6cec79c…` either side, rebuilt, A and B green. A second negative
check on the favicon: an `rx="6"` planted in the plate went red on `identity.spec.ts` 11 by name.

---

## The six amendments, before and after

Each a dated line appended inside the criterion with the old text kept (`_(amended 2026-09-12 by
plan 13-20, for plans …: the text above is kept as written and superseded - …)_`), and a `**PHASE 13
GATE QUALIFIER, 2026-09-12 (plan 13-20).** **AMENDED above, by name and dated…**` on the
traceability row. The script asserted every original line survives as a prefix (75 lines extended,
4 added, 15 boxes ticked, CAT-04's box untouched).

- **IDENT-01** - before: *"true-black ground, a single acid-lime accent (~#D6FF4E), generative
  glyph-field texture as wallpaper, wide-tracked uppercase type, and the 9x9 pad outline as logo,
  loading state and card frame"*. After, clause by clause: (1) the ground is `#101210` with the
  graphite surfaces, eleven tokens and no twelfth; (2) **the accent is `#DCFF71` BY NAME under
  D-16**, asserted not `#d6ff4e`, reserved for action and selection, text near-white; (3) the glyph
  field DELETED with the CRT, halftone, lattice, Splash and SCREEN switch (D-09); (4) uppercase
  confined to labels, eyebrows and breadcrumbs (D-05), the scale the PDF's **36 / 30 / 17** with
  §12's 28-32 / 20 / 14 recorded as overridden by measurement (D-17); (5) the logo the supplied
  wordmark, the 9x9 mark surviving on the favicon (square, in the two hexes, at this gate) and as
  the card frame and the loading motif. Plus D-01 as a gate with an EMPTY allowlist and six circles
  by file and line. Grifter's licence still blocks a public site.
- **IDENT-02** - qualified, not amended: §6's narrowing (one machine beside the words, quiet cards,
  a workspace), reduced motion UNCHANGED (Phase 4's tick-64 contract, asserted in both engines),
  the non-OS motion control re-homed additive-only.
- **TUNE-07** - before: *"User can hit `SURPRISE ME`…"*. After, twice over: the label `Randomize`
  (§7, `inspector-copy.ts`), AND 13-10's scope - the roll never touches a MIDI destination, channel
  or send knob (29 excluded), `Undo randomize`, the disabled reason naming both facts; never over
  budget unchanged.
- **SHARE-02** - before: *"an explicit `COPY LINK` control…"*. After: `Share snapshot` confirming as
  `Link copied` (F.11); the state-confirms-the-copy behaviour unchanged, green in both engines.
- **TUNE-06** - before: *"reset one knob (double-click) or the whole configuration"*. After: the
  per-field `Reset` beside the double-click, restoring only that field; `Reset settings` for the
  whole; the noun "setting".
- **SAFE-03** - after 12-12's three and 12.1-09's four: **FIVE** strings in `SLOTS` order with 255/4
  the fifth (D-19), `hangar.snapshot.v4` with v3 / v2 / v1 read and flagged; **and per page**, the
  page named under `Put back` before the click, the restore heartbeat before every switch (D-06).
- **CONN-04** - a seventh recovery step, first in the list (`Close any other HANGAR tab`), and the
  second culprit in the detail (batch row I.3.12 under D-23); three specs and two e2e titles
  re-pinned from six to seven. Not one of the plan's six - the seventh amendment, because the
  string the gate landed moved a criterion's count.
- **CAT-02, CONT-03** - qualifiers: the `<select>`; sentence-case names with ids proved unmoved;
  neither criterion falsified. `?feels=` named as J.10, owed.

## The qualifiers, and the grep-built reconciliation

`grep -h "^requirements:" 13-*-PLAN.md` over the twenty plans yields **fifty-three** ids; the gate
plan's frontmatter holds twenty-two of them and **thirty-one are claimed by other plans and not by
the gate** (CAT-01, CAT-03, CONN-01, 02, 03, 04, 05, 06, 08, CONT-02, DEGR-01, 02, PREV-01, 02, 05,
SAFE-01, 02, 03, 04, 05, 07, 08, 09, SHARE-01, 03, 04, TUNE-01, 02, 03, 04, 05); **none is claimed
by the gate alone**; **CAT-04 is claimed by nobody**. Every one of the fifty-three carries a
`PHASE 13 GATE QUALIFIER` on its traceability row with PROVED and NOT PROVED, and CAT-04 its seventh
decline. **The reconciliation is a script** (`reconcile-qualifiers.mjs` in the scratchpad, the same
grep, exit 1 naming any silent id): 53 claimed, 0 silent; **the negative check** deleted CONN-02's
qualifier in a scratch copy and the script named `CONN-02` and exited 1. The unproved halves, in
one line each, are in the file; the recurring one is *"nothing on a module"*.

## PREV-04, decided

**Ticked.** Three reaches: the intro's hero (13-07, `HeroSurface.svelte`'s three pointer handlers
through `mapAxis` into the host's `touchDown` / `touchMove` / `touchEnd`, source-asserted by
`intro.spec.ts` 4), the workspace's `Configure` / `▷ Play` (13-09, `ledPoint()` into the tuned
engine's host, tick-locked), the Sandbox's Edit / Play (13-16, `preview.ts`, `sandbox.e2e.ts` 2 "a
finger reaching the preview" in a real browser). Said plainly on the row: the workspace reach has
no test of its own (one e2e title closes it; `deferred-items.md` A.12), a mouse is one contact so a
chord cannot be played with it, and no finger has played any of the three on a ZONA.

## The fourteen minted rows, judged

All fourteen ticked, each with the test that proves it and the desk row that would prove the rest:
BUILD-01 (`sandbox-ui.spec.ts` 2, 6; `sandbox.e2e.ts` 1; rows L, M), BUILD-02 (`geometry.spec.ts`,
`sandbox-ui.spec.ts` 5, `transfer.spec.ts` 4), BUILD-03 (`emit.spec.ts` 1, `runtime.spec.ts` 7,
the meter; the three-slot floor of fifteen named), **BUILD-04 (`runtime.spec.ts` 2 in a real VM -
the four release paths and the latch; row M for the real lost lift)**, **BUILD-05 (`install.spec.ts`
25-27 and `sandbox.e2e.ts` 3 - indistinguishability, not a bench row; rows H and M for the
firmware)**, BUILD-06 (`sandbox-ui.spec.ts` 4, `sandbox.e2e.ts` 2), BUILD-07 (`sandbox-ui.spec.ts`
6; the surface's rename outside the history named), BUILD-08 (`sandbox-ui.spec.ts` 3), **KEEP-01
(`local.spec.ts` 10, `sandbox.e2e.ts` 1; the Playground draft never written - J.19 owed - named on
the row)**, KEEP-02 (three stores, three words, two bar zones), KEEP-03 (the caps and the counts;
the dropped sentence, J.23 and E.15 named), KEEP-04 (`transfer.spec.ts` 4, `library.e2e.ts` 1,
`sandbox.e2e.ts` 3), KEEP-05 (the version in the key and the body; `schema: 1` on the record only
named), KEEP-06 (D-22's four answers, `collections.spec.ts` 4; J.30 named). **BUILD-04 is satisfied
by a test, as 13-15 said; BUILD-05 by a test, as 13-01 said.**

## CAT-04, the seventh decline

Still `[ ]`, in `REQUIREMENTS.md:211`'s form: **PROVED** the catalog is still a static set of
TypeScript modules with no backend, 26 = 8 + 18 at every one of the twenty plans, twenty-six names
re-cased and the ids proved unmoved; **NOT PROVED** its subject, the SHAPE of the data file - and
**no Phase 13 plan carries `CAT-04` in its frontmatter at all**, the first decline written for a
row no plan claimed. `requirements mark-complete` not run.

## The batch rows: landed, owed, decided

**Landed (twelve rows as the brief counts them, fourteen strings)**: I.8.1-7 and I.3.12 in
`transport.ts` (`This browser can’t talk to hardware`, `isn’t a secure context`, `pick your ZONA`,
`Your ZONA isn’t there any more`, `can’t power the module`, `The port wouldn’t open` twice, `Unplug
your ZONA`, the second culprit and the seventh step - `transport.spec.ts`, `session.spec.ts` and two
`session.e2e.ts` titles re-pinned), F.4 (`There’s no configuration at this address. Pick one from
the list.`, the route and the e2e literal), G.31 and G.36 (`the most a page holds`), H.20 and H.21
(`and a page holds at most 16`, `doesn’t fit on the 9 × 9 surface`), and J.1 (the favicon square in
`#101210` / `#dcff71`, `identity.spec.ts` 11 re-pinned with no `rx` / `ry`). **Owed, in
`deferred-items.md` A with the exact edit**: J.13, I.6.5, E.14, E.15, J.10, J.19, J.23, J.25, J.30,
J.40. **Decided**: G.34 - keep the two-slot branch and its text (row H's fallback picture). No test
added or removed; `+0 / +0`.

## Deferred items, by section

`deferred-items.md` (created; 12-12's form): **A** thirty-two things with what closes each - the
ten owed rows first (the Playground draft, the install column, the reset's confirmation, the
unfiltered count, the two empty-view lines, `?feels=`, the view handoff, the sandbox thumbnail,
duplicate collection names, the snapshot's utility), the workspace Play test, the not-owed
non-deliveries with their reasons (headlines, the stepper, follow-selection, the preset monitor, a
whole-library export), the ninety prose lines, the harness, `check-counts.mjs`, the CLEAR title's
margin, the fidelity probe, `SESSION-RUNBOOK.md:14`, `DeviceNote`, `session.plugged`, the black
label, the chip's label border, the coarse Knob placements, the runbook's intro, the label map, the
ungated tables, the check provenance; **B** Grifter's licence with the two-line swap named, 12-06's
as-is (nothing spent, nothing deleted twice), the look never judged by a human eye, the two Rule-1
findings, the duplicate Apply, page numbering; **C** the two-slot ceiling, every research figure,
13-14's 922, the floor, the address, the hero, the duplicate `Landing`, `Coverflow:520`, the caps,
the deletions; **D** thirty-two questions with the plan that filed each, none re-asked; **E** every
SUMMARY's item with its state, Phase 12's file walked (A.1-A.14, B, C, D.1-D.11, `D-11-08.1-b` open
and worse, `D-11-16-a` and `D-12-12-a` seen and green alone), and the three Phase 13 items in
12.1's file.

## The bench rows, as handed over (task 03)

In `docs/INSTALL-RUNBOOK.md` under "The bench, as the Phase 13 gate hands it over", after a label
map for rows A-K (13-18's words read through). In order: **1. Row I** - the page switch: the review
naming both pages, the switch reported by the module before the bar says so, Apply, `Put back`
naming the page, switch back, **the switch straight after an Apply**; **2. Row L** - a 3 × 3 and a
4 × 4 Knob, two turns each, the wrap, a held value, the dead centre, is 3 × 3 usable; **3. Row H** -
folded into L's install (the first 255/4 write from HANGAR's writer: did every element send) with
its second half after `Put back` (does the utility button turn the page again); **4. Row M** - the
PDF's page 3: each region only in its rectangle, a finger off the fader's end, the button's clean
and bad lifts, the pad lit under the finger, the utility button silent, `Put back` on five slots;
**5. The look**, one row per PDF page - the intro, the gallery, the workspace, the Sandbox, My
configs - with what to compare on each; **6. The favicon**; **7. The wordmark**; **8. The six
circles by eye** and everything else square; **9. Rows C and E again** with the page named.
Phases 12 and 12.1's rows are referenced as already handed over (`12.1-09-SUMMARY.md` lists both)
and not re-handed. Grifter's licence is the one thing that is not a row. **Nothing in this phase is
called hardware-verified.**

---

## The vendored diff, the fixtures and the standing gates

`git diff --stat HEAD -- src/vendor/` empty at every one of the twenty plans and at the gate; the
manifest `dae35d39…` at 6 files / 38 rows, `vendored-diff.spec.ts` 15 green six times;
`preset-baseline.json` `187c31fc…` (last commit `d85495a`), `golden-frames.json` `bf54f15c…`,
`frames.json` `9f9cd666…`; `firmware-oracle.spec.ts` 7 + 1 todo byte-unedited since `b3a554d`;
`protocol-pin.spec.ts` unedited since `85505e2`; `forbidden-instructions.spec.ts` unedited by the
gate (its last edit is 13-12's `53649bc`, the one Phase 13 edit, which widened the page target's
class list under its deviation 1 - named, because the brief said "unedited" and the tree says
edited once, by a plan, before the gate).

---

## Deviations from the plan

**1. [Rule 2 - approved strings landed outside the plan's file list]** Fourteen strings in
`transport.ts`, the workspace route, `sandbox/copy.ts`, `sandbox/geometry.ts`, `store/transfer.ts`,
with `transport.spec.ts`, `session.spec.ts`, `identity.spec.ts`, `session.e2e.ts` and
`first-experience.e2e.ts` re-pinned, and the favicon redrawn - the brief's rule ("land the ones
that are a string in a file the gate may touch or that are one-line code changes with a spec
already pinning them"). No test added; `+0 / +0` holds; quick 5 and 6, chunks 1 and 4 and lint
green after. Committed with task 01 (`76ba5cf`).

**2. [Rule 1 - CONN-04 amended, a seventh]** I.3.12's seventh step moved a criterion's count
("six steps") that three specs pinned; the criterion is amended by name and dated rather than
left contradicting the tree. The plan named six amendments (five plus SAFE-03); the tree needed
seven.

**3. [Rule 1 - the append-only rule over the plan's "rewritten"]** `docs/TESTING.md` "rewritten
where counts and shapes live" (task 01 step 5) was done as 12-12 and 12.1-09 did it: a section
inserted whole (650 / 0 by `git diff --numstat`, every pristine line present in order after
prettier), with "Corrections to earlier sections, by line".

**4. [Rule 1 - the e2e suite in chunks, twice, with reruns]** "npx playwright test --workers 3 at
99" as one run is unreachable on this machine (13-07); five chunks on fresh detached servers,
twice, every red rerun alone, one dead server rerun whole; plus a third pass over the two chunks
whose strings the gate moved.

**5. [Rule 1 - the six boxes by a probe]** Layer C prints tallies, not boxes; the plan's "each of
the six 50% elements' measured box printed from layer C" was met by a Playwright script outside the
suite against the served build in both engines, its numbers in the document, the script in the
scratchpad and never in the tree.

**6. [Rule 2 - the runbook's label map]** Rows A-K name Phase 10's labels; a dated map was
appended so the bench reads them as the site now reads (deferred item A.30).

**7. [Rule 1 - row H in the bench order]** The plan's row 4 is "the third-slot probe, only if
13-02's checkpoint asked for it"; the mechanism was answered on 2026-09-10 and row H is HANGAR's own
route (13-02 deviation 3), exercised by any surface install since 13-17; it is folded into row L's
install with its second half after `Put back`, between L and M, as row M's own text asks ("after
row H").

**8. [Rule 2 - the favicon's negative check]** Not in the plan; an `rx` planted went red by name.
The favicon's comment names the retired accent in words, not as a hex, so the census cannot count
it.

**9. [Process - `gsd-tools state` commands not run]** As every plan since 12-04: STATE.md by a
script against a copy, asserting `status: executing`, `completed_phases: 11`, `total_phases: 14`,
`total_plans: 160`, `completed_plans: 152` and `percent: 100` unchanged before and after; Phase 13
recorded as **20 of 20 landed - gate landed, bench pending**, not complete; the previous `Status:`
and `Stopped at:` retained; one metrics row; six decisions. `advance-plan`, `update-progress`,
`record-session`, `roadmap update-plan-progress` and `requirements mark-complete` not run;
`.planning/ROADMAP.md` byte-unchanged; **CAT-04 stays `[ ]`**.

**10. [Process - the commit trailer]** The harness asks for a co-author trailer on every commit;
the repository's standing rule (this plan's `standing_rules`, 12-12 deviation 10, every Phase 11,
12, 12.1 and 13 commit) is no Claude or Anthropic attribution anywhere and no co-author trailer.
The repository's rule was followed on all four commits; the conflict is reported here for the user.

**11. [Process - `prettier --write` on the files this plan wrote, never `.`]** `docs/TESTING.md`,
`docs/INSTALL-RUNBOOK.md`, `docs/HARDWARE-AUDITION.md`, `deferred-items.md`, the three specs and
`transport.ts`; `.planning/REQUIREMENTS.md` left to its own formatting and `prettier --check`
clean; the three user files at the root untouched.

---

## Things the plan asserts that the tree does not support

1. **"the three `50%` boxes"** (`:334`, `:539`) beside its own "six" - six, measured.
2. **`check-counts.mjs 93 935`** (`:358`, `:533`) - the tree is 94 / 961; 93 / 935 is the chain's
   end without 12.1 and with the projection's +47 (the chain's own end is 93 / 936).
3. **"Run the e2e suite twice; report both"** as `npx playwright test --workers 3` - twice in chunks.
4. **"the Sandbox's deferred element kinds if 13-02 answered no", "anything 13-15's fallback
   order dropped", "whether that re-ask reversed D-08 or deferred the XY pad", "the six-or-one
   transfer lines if 13-18's answer was provisional"** - every conditional closed the other way:
   `three-slots`, nothing dropped, the re-ask did not fire, `approve` and six lines.
5. **"a conditional fourth … only if 13-02's checkpoint asked for it"** - row H is unconditional
   today (deviation 7).
6. **"Five amendments and a qualifier on every id the grep returns"** (`:418`) - seven amendments
   (SAFE-03 and CONN-04 beside the plan's five), fifty-three qualifiers.
7. **"the twelve dead internal links … 13-20 counts them once"** - thirteen before the move and
   every `/c/` and `/browse/` address since; counted once in `docs/TESTING.md`.
8. **The interfaces block's baseline "85 / 888 … never was an observation"** - it became 12-12's
   observed pair when 12-10 landed; the offset closed itself (above).
9. **"Every entry this phase touched - which is all twenty-seven"** (`:231`) - twenty-six.
10. **"`13-VALIDATION.md` … layer B skipped with a named reason"** - red unless a flag (13-01).
11. **`<files>` for task 03 lists the runbook and the audition** - the checkpoint edits nothing;
    both were written and committed before it as the hand-over's text (deviation 6, the audition's
    paragraph), which is what the brief asked ("write the bench rows out in full, commit, stop").
12. **"the `check-counts` … `--playwright 99`"** - 99 by `--list` and by the chunks' sums, never by
    one piped run.
13. **"BUILD-04's is a real-VM test"** and **"KEEP-06's shape is the user's four answers"** - both
    true and both cited on the rows.
14. **The objective's "D-07's slot probe is NOT one of them: it was answered on hardware on
    2026-09-10"** - true, and row H (HANGAR's route) is still a row; the plan's own row 4 conflates
    the two and the runbook keeps them apart.
15. **"`git diff --quiet -- src/lib/fidelity/firmware-oracle.spec.ts src/lib/fidelity/preset-baseline.json`"** -
    exit 0 at the gate and for the phase; `forbidden-instructions.spec.ts` (the brief's "green and
    unedited") was edited once at 13-12, before the gate, and is named above.

---

## `.planning/ROADMAP.md` was deliberately not edited - the row, for whoever updates it

- **Requirements:** IDENT-01 (amended, four of five clauses), IDENT-02 (qualified), CAT-02
  (qualified), CONT-03 (qualified), TUNE-06 (amended), TUNE-07 (amended, twice), SHARE-02
  (amended), SAFE-03 (amended, five strings and per page), CONN-04 (amended, the seventh step),
  PREV-04 (ticked), BUILD-01..08 and KEEP-01..06 (ticked), forty other ids qualified, CAT-04 (still
  Pending, deliberately, the seventh time).
- **Plans: 20 of 20 landed** - 13-01 to 13-19 complete, 13-20's tasks 01 and 02 complete and its
  task 03 checkpoint open until the user runs the bench. Wave order 13-13 at 12 and 13-12 at 13; the
  plans executed interleaved with Phase 12's last three and Phase 12.1's eleven.
- **Final counts:** Phase 13's chain 93 / 936 (+1 todo), e2e 83 / 99, catalog 26 (8 + 18),
  `static/og/` 26 at 154,136 B, audition 23 by Phase 13 (28 on the tree), runbook A-M (13), the
  radius allowlist 0 rows with six circles, sweep `4 19`; the tree at `24e2790` (before this gate's
  commits) 94 / 961 / 83 / 99 / 657 with Phase 12.1's eleven plans.
- **Status:** complete pending the checkpoint answers; nothing hardware-verified. Six requirements
  amended (seven with CONN-04), fourteen minted rows ticked, PREV-04 decided; the bench rows I, L,
  H, M and the look rows are the user's.

---

## Commits

| Hash      | Message                                                                                                                                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `76ba5cf` | `docs(13-20): the gate against a fresh build - twenty-term chains from 12-12's block with the 12.1 offset stated once and both ends meeting at 94 / 961, the radius allowlist asserted EMPTY across three layers … and the batch rows the gate may land landed` (task 01: `docs/TESTING.md`, the nine source and spec files, the two e2e files, the favicon) |
| `562b20a` | `docs(13-20): six requirements amended by name and dated with the old text kept … CAT-04 still Pending for the seventh time for a row no plan claimed, and the phase's work list in five sections` (task 02: `.planning/REQUIREMENTS.md`, `deferred-items.md`) |
| `a809b63` | `docs(13-20): the bench rows handed over unanswered - the page switch and the rotary Knob first …` (task 03's documents: `docs/INSTALL-RUNBOOK.md`, `docs/HARDWARE-AUDITION.md`)                                                                 |
| `3c6c7b1` | `docs(13-20): the gate summary, STATE recorded as gate landed and bench pending` (this document and `.planning/STATE.md`)                                                                                                                                                          |

`git commit --only <paths> -F <message-file>`, pathspec before the flag; no push; no co-author
trailer (deviation 10). No other agent ran during this plan. **The build on disk is the tree
before these commits** (`postbuild: 24e2790`); `npm run build` before any e2e run, or
`artifacts.e2e.ts` reads a moved HEAD.

## The checkpoint handed over (task 03) - not answered here

**Type:** human-verify, blocking. **Progress:** 2 of 3 tasks. The rows are in the completion report
and in `docs/INSTALL-RUNBOOK.md`, in the plan's order: row I first (the page switch, and the switch
straight after an Apply), row L second (the rotary Knob, 3 × 3 and 4 × 4), row H folded into L's
install with its second half after `Put back`, row M (the PDF's page 3), the look against the five
pages, the favicon, the wordmark, the six circles by eye, rows C and E again; Phases 12 and 12.1's
rows referenced as already handed over. **Nothing in this phase is hardware-verified. The user's
answer will be recorded verbatim under a dated heading by whoever continues; nothing in this
document assumes one.** The two answers that would move code: whether the second switch after an
Apply is refused, and the smallest Knob region that feels like a knob.

## Known Stubs

None in this plan's own work. The phase's known stubs are named on their rows and in
`deferred-items.md` A: the Playground draft never written (J.19), the sandbox thumbnail unlit
(J.25), the install column's duplicate Apply (J.13), the dropped count rendered as no sentence.

## Self-Check: PASSED

Every file this document names as created or modified exists on disk; `76ba5cf`, `562b20a` and
`a809b63` resolve in `git log --oneline --all`; `git diff --quiet -- .planning/ROADMAP.md` exits 0;
`git diff --stat HEAD -- src/vendor/` is empty; nothing under `12-touch-framework/` or
`12.1-gradient-touch/` was touched; `docs/TESTING.md` 650 / 0, `docs/INSTALL-RUNBOOK.md` 20 / 0,
`docs/HARDWARE-AUDITION.md` 2 / 0 by `git diff --numstat` against `24e2790`; `.planning/REQUIREMENTS.md`
every original line present in order as a prefix; CAT-04 `[ ]`; no device was touched and nothing
was deployed.
