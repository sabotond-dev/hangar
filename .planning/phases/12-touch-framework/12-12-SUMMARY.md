---
phase: 12-touch-framework
plan: 12
subsystem: docs
tags:
  [
    gate,
    chain,
    phase-13-offset,
    picker-corner,
    amendments,
    qualifiers,
    non-delivery,
    bench,
    audition,
    checkpoint,
    negative-check,
  ]
requires:
  - phase: 11-bench-corrections
    plan: 16
    provides: "The carried block measured on a clean tree at c5fd1cd: 84 files / 869 tests (+1 todo) / 86 e2e titles / 105 runs / check 582 / catalog 29 (9 + 20) / static/og/ 29 files, 172,699 B / audition 25 / sweep 4 19 - and the gate's shape: a chain of one term per plan with the term count itself asserted"
  - phase: 12-touch-framework
    plan: 11
    provides: "Every Phase 12 SUMMARY 01 to 11 with its own check-counts line and its recorded branch; 12-06-HANDOVER.md; 12-VALIDATION.md's projections; PROBE-RESULTS-2026-09-10.md's seven answers; deferred-items.md items 1 to 6"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "The six Phase 13 SUMMARYs 13-01 to 13-06, whose per-plan terms are the offset between Phase 12's chains and the tree (read, never edited; nothing under 13-gui-overhaul/ touched)"
provides:
  - "docs/TESTING.md 'Phase 12's suites, measured at the gate', appended and reflowing nothing: nine chains in twelve terms from 11-16's block (85 / 888 / 87 / 106 / 582 / 26 at 8 + 18 / 26 / 23 / 4 19), the Phase 13 offset stated once by name (+3 / +15 / -3 / -6 / +22) so the tree's 88 / 903 / 84 / 100 / 604 reconciles from both ends, the per-file table from the runner's JSON, three quick runs and two e2e runs with the memory beside each and every transient named, every entry at three corners with the library's row and every function's caller, eighteen planner errors named"
  - "docs/HARDWARE-AUDITION.md at 23 rows: every cost row re-measured, two stale rows corrected (ARC 520 -> 538, TRACKPAD 486 -> 488), row 7 gains (e) the ten-second expiry hold and row 21 gains (d) the two-finger check, every row still the user's and unanswered"
  - "Three source headers corrected: trackpad.ts's Timer figures (488 / 486 -> 490 / 488, wrong from the file's first commit), lua-smoke.spec.ts's count (TWENTY-THREE -> TWENTY-NINE), facets.ts's still-carrier list (TPAD -> TRACKPAD)"
  - ".planning/REQUIREMENTS.md: SAFE-03, SAFE-05, SAFE-07 amended for the third string and CONT-01 for the fold, by name, dated, the old text kept; SAFE-04's coverage row superseded by a qualifier with its wire-unprovenness unchanged; PHASE 12 GATE QUALIFIER on all twenty-two ids any Phase 12 plan claimed; CAT-04 still [ ]"
  - "deferred-items.md sections A to E, the bench-note trace for every line of BENCH-2026-09-10.txt, and D-12-12-a"
  - "The bench rows handed over unanswered at task 03, the probe's two findings first"
affects: [13-07, 13-11, 13-12, 13-20, the user's bench]
tech-stack:
  added: []
  patterns:
    - "A gate on a shared tree writes its own phase's chain in its own terms and states the other phase's offset ONCE, by plan name, reconciled from both ends - never folds foreign terms into the chain and never leaves the totals unreconciled"
    - "A negative check whose stated red does not match the tree (the plan said 27, the tree says 26) is run as written and the disagreement is named, not the number adjusted to make the check look right"
    - "A count-gate script's misleading message on a red run is a finding about the script, recorded beside its lack of direction"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-12-SUMMARY.md
  modified:
    - docs/TESTING.md
    - docs/HARDWARE-AUDITION.md
    - src/lib/catalog/entries/trackpad.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/browse/facets.ts
    - .planning/REQUIREMENTS.md
    - .planning/phases/12-touch-framework/deferred-items.md
    - .planning/STATE.md
key-decisions:
  - "THE CHAIN IS PHASE 12'S ALONE, IN TWELVE TERMS, AND THE PHASE 13 OFFSET IS STATED ONCE BY NAME. The tree at fed9c17 carries six Phase 13 waves; folding them into a twelve-term chain would have made it eighteen terms of two phases, and leaving them out would have left 888 against an observed 903. Both ends are written and they meet"
  - "FOUR AMENDMENTS, NOT THREE. CONT-01's 'are in the catalog' was falsified by 12-10's fold on the user's mid-phase answer, so it is amended beside SAFE-03, SAFE-05 and SAFE-07; every one keeps its old text and is dated; SAFE-04 takes a qualifier because its criterion still holds"
  - "THE QUALIFIERS ARE DATED 2026-09-11, THE DAY THE GATE RAN, not the 2026-09-10 the plan wrote before the phase slipped a day"
  - "THE DECAY GATE WAS NOT WIDENED. The honest D( clause is textual and more than one assertion; it is recorded in section A with what closes it, and library.spec.ts plus the TRACKPAD smoke test stay the proof"
  - "NO JOYSTICK AUDITION ROW. The document covers hand-authored configurations by its own title and the table is fixed at 23 with ROW_COUNT pinned; the as-is check is in the checkpoint list and the decline is in section A with the reason"
  - "THE PHASE IS RECORDED AS GATE LANDED, BENCH PENDING - not complete - because task 03 is the user's bench and nothing has been seen on a desk since the probe"
  - "THREE SOURCE HEADERS CORRECTED AT THE GATE under 11-16's precedent (stale comments corrected, the drift named): a header wrong from birth, a count wrong by six, a carrier named by its old id. SUMMARYs that carry the same figures are pointed at, never edited"
patterns-established:
  - "When a plan's negative check names a stale line and a stale number, run it where the floor really is and let the red name what the tree really holds"
requirements-completed: []
duration: 150min for tasks 01 and 02; task 03 is the blocking checkpoint and is NOT answered here
completed: 2026-09-11
---

# Phase 12 Plan 12: The gate - every number re-measured on a shared tree, four requirements amended, the non-deliveries named, and the bench rows handed over Summary

**The phase's twelve-term chain ends at `84 + 1` / `869 + 19` - 85 files, 888 tests - with the term
count asserted at twelve on every one of nine rows, and the tree at `fed9c17` reads 88 / 903 because
Phase 13 ran six waves in the same tree while 12-06 stood open; the offset (+3 / +15, e2e −3 / −6,
`svelte-check` +22) is stated once by plan name and the two ends meet on every row. The catalog is
**26 at 8 + 18**, not the 27 at 9 + 18 the plan carried, because the user's answer at 12-06 folded
the `tpad` preset into a card rather than building beside it; OG 26, audition 23, sweep `4 19`. Every
hand-authored entry was re-measured at three corners: **one header was wrong from its first commit**
(TRACKPAD's Timer, 488 / 486 for 490 / 488) and **two audition rows were stale** (ARC by 18, TRACKPAD
by 2), all corrected and named; the library is 769 of 908 with every one of its six functions called
by a named entry. Three quick runs (one green) and two e2e runs (one green) with every red named -
none of them a bug, all of them the machine at a tenth of its memory. **Four requirements amended
where the plan said three** (CONT-01 joined SAFE-03, SAFE-05 and SAFE-07), SAFE-04's row superseded
with its wire-unprovenness unchanged, twenty-two qualifiers, CAT-04 still `[ ]`. Eighteen planner
errors named. **Nothing touched a ZONA, nothing was deployed, and the twenty-three bench rows are
handed over unanswered at the checkpoint below** - the phase is gate landed, bench pending.**

## Performance

- **Duration:** about 150 min across tasks 01 and 02, in one executor session interrupted once by
  the coordinator mid-task-01 (below); task 03 is the blocking human checkpoint and is not answered
- **Tasks:** 2 of 3
- **Files:** 1 created, 8 modified, across two task commits plus this document's own

---

## The interrupted state, reconciled

The coordinator's resume message arrived while task 01 was being written, describing the tree as
`fed9c17` plus five uncommitted files (+515 / −7) and no SUMMARY. The executor's own transcript was
intact, so every hunk was diffed and read against it: `facets.ts` (one hunk: TPAD → TRACKPAD in the
`still`-carrier list, with its reason), `trackpad.ts` (one hunk: the Timer figures and the paragraph
naming the drift), `lua-smoke.spec.ts` (one hunk: the header count), `docs/HARDWARE-AUDITION.md`
(three hunks: the dated re-measurement paragraph and two cost cells), `docs/TESTING.md` (one hunk, a
pure insertion of 476 lines before the vendored-tree section, zero deletions). **Every hunk was this
plan's, nothing was unaccounted for, and nothing was discarded.** What the interrupted state did NOT
contain was the two audition expectations (rows 7(e) and 21(d)), whose Edit calls had failed on the
table's padding; they were applied by a script that finds the rows by content, and prettier
re-aligned only those two rows. Task 01 was then committed as `b979c5e`.

---

## The re-measured block against 11-16's carried block

On the clean tree at `fed9c17`, 2026-09-11, against a fresh `npm run build`. The machine had **250
MB of 16 GB available** at the start (the user's desktop with a browser, two editor sessions and a
chat client open; no stale runner), and the figure beside each command is what it had then.

| Name | `PREV_*` (11-16, at `c5fd1cd`) | Phase 12's chain | Phase 13's offset | **Observed at `fed9c17`** |
| --- | --- | --- | --- | --- |
| `svelte-check` | 582 | −3 +2 +1 = **582** | +22 | **604 files, 0 errors, 0 warnings**, 12 s at 299 MB |
| `npm run lint` | clean | — | — | clean, 24 s at 518 MB |
| quick files | 84 | +1 = **85** | +3 | **88** |
| quick tests | 869 (+1 todo) | +19 = **888** | +15 | **903 (+1 todo)** - run 1 red (1), run 2 green, run 3 red (3); named below |
| sweep | `4 19` | `4 19` | +0 | **`4 19`**, 100 s wall at 531 MB |
| build | 28 / 13 s | — | — | **19 s** at 121 MB; 26 images, 154,136 B |
| e2e titles | 86 | +1 = **87** | −3 | **84** (`cat e2e/*.e2e.ts \| grep -c "test("`) |
| e2e runs | 105 | +1 = **106** | −6 | **100** - run 1 98 + 2 at 573 MB (172 s), run 2 100 / 100 at 480 MB (159 s) |
| catalog | 29 (9 + 20) | −3 +0 = **26 (8 + 18)** | +0 | **26**, 8 preset-backed + 18 hand-authored |
| `static/og/` | 29 / 172,699 B | −3, −1 +1 = **26** | +0 | **26 / 154,136 B**, rebuilt from empty |
| audition rows | 25 | −3 +1 = **23** | +0 | **23**, contiguous, all unanswered |

`check-counts.mjs 88 903` matched on run 2, `4 19` on the sweep, `--playwright 100` on e2e run 2.
`test-results/` removed by hand after every Playwright run; `git status --porcelain` empty of this
plan's work before each commit.

### The three quick runs and the two e2e runs, every red named

| Run | Available | Result |
| --- | --- | --- |
| quick 1 | 541 MB | **1 failed**: `install.spec.ts` "the snapshot is taken at connect, in order, before ready" - `timed out waiting for identification` |
| quick 2 | 366 MB | **88 / 903 / 1 todo**, green |
| quick 3 (after the build) | 527 MB | **3 failed**: `config-shape.spec.ts` "the built front door does not preload the protocol chunk" (`Test timed out in 5000ms`); `install.spec.ts` "the snapshot is taken at connect, in order, before ready" and "a serial that is not answered degrades to a session-only snapshot", both `timed out waiting for identification` |
| the two red files alone | — | **37 passed** |
| e2e 1 | 573 MB | **98 + 2**: `[chromium] session.e2e.ts:701` "a granted ZONA is offered on load and one click connects it with no picker" - `the module named itself once per connect: Expected 1, Received 2` after a 30 s poll; `[webkit-phone] tuning-webkit.e2e.ts:497` "a shared link lands with the knobs restored, and install is present but disabled" - two `Failed to load resource: 500` console errors from the spawned wrangler, which did not die |
| e2e 2 | 480 MB | **100 / 100** |
| the two red titles alone, `--workers 1` | — | **3 passed** in 32.3 s (the `@webkit` title in both projects) |

**The quick transient, named at last.** `install.spec.ts`'s `until()` advances a fake clock 4,000
steps of 5 ms - twenty virtual seconds - yielding to the macrotask queue between steps; "identification"
waits on a real `import()` of the protocol module inside the session. At this little memory the import
did not resolve inside 4,000 macrotask turns in two runs of three, and the file passed 23 / 23 alone
straight afterwards. It is almost certainly the `1 failed | 873 passed` 12-04 saw once at `603dcd7`
and could not name - same file, same wait, same shape. `config-shape.spec.ts`'s preload test is the one
12-10 saw time out once; it reads `build/` and crossed the 5,000 ms per-test timeout once here.

**`session.e2e.ts:701` has now failed in two of the last four full runs across two plans** (12-10: a
30 s `page.evaluate` timeout; here: a doubled `SERIALNUMBER/FETCH`), with a different message each
time, in a file no Phase 12 plan after 12-03 touched. Logged as **`D-12-12-a`** in `deferred-items.md`,
owner the next plan that touches `e2e/session.e2e.ts` (Phase 13's connection band), together with
`D-11-16-a`. **Not seen at this gate**, of the transients earlier plans named: the `webkit-phone` tail's
`Could not connect to server`; the spawned wrangler dying at ~28 s; `install.e2e.ts:2074`'s hydration
signature; `session.e2e.ts:851` (Expected 6 / Received 7); `install.e2e.ts:1817`; `browse-webkit.e2e.ts:564`.

**`check-counts.mjs` on a red run** reports _"no Vitest summary lines found on stdin"_, because its
`passed` patterns miss a summary that reads `1 failed | 87 passed`. Exit 1 either way; the message is
wrong. Recorded beside 12-04's finding that the script has no direction.

---

## The twelve-term chains, every term reconciled

```
                 12-01 12-02 12-03 12-04 12-05 12-06 12-07 12-08 12-09 12-10 12-11 12-12
tests    869       +1    +4    +3    -3    +2    +0    +8    +1    +2    +1    +0    +0   = 888
files     84       +0    +0    +0    +0    +0    +0    +1    +0    +0    +0    +0    +0   = 85
e2e ttl   86       +1    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0   = 87
e2e runs 105       +1    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0    +0   = 106
check    582       +0    +0    +0    -3    +0    +0    +2    +0    +0    +1    +0    +0   = 582
catalog   29       +0    +0    +0    -3    +0    +0    +0    +0    +0    +0    +0    +0   = 26, 8 + 18
og        29       +0    +0    +0    -3    +0    +0    +0    +0    +0    +0    +0    +0   = 26
audition  25       +0    +0    +0    -3    +0    +0    +0    +0    +0    +1    +0    +0   = 23
sweep    4 19       -     -     -     -     -     -     -     -     -     -     -     -   = 4 19
```

**Nine rows, twelve terms each, counted; the twelve column headers are the twelve plan numbers.**
`12-VALIDATION.md:314` and `:338`, the plan's `<interfaces>` and its task text all say twelve, and
every one of those statements was checked against the block rather than copied. Wave order beside
plan order, once: `01 02 03 04 05 | 07 08 09 | 06 | 10 11 12` - 12-06 at wave 9 because only 12-10
reads its answer, allowed because its term is `+0` everywhere. The order the plans actually EXECUTED
in was a third one - `01 02 03 04 05 07 08 09 11 | 13-01..13-06 | 06 10 12` - because 12-11 ran ahead
of 12-06's open checkpoint on the same `+0` reasoning; every chain is unmoved by that too.

**Every term checked against its plan's own `check-counts` line**: the observed `PREV_TESTS` ladder is
870, 874, 877, 874, 876, 884, 885, 887, 887 (12-11), then **902 and 903** (12-06 at `+0` and 12-10 at
`+1` on the observed baseline under Phase 13), and every term agrees with its plan. **No term disagrees
with `12-VALIDATION.md`'s per-plan delta table** - the tests, files and e2e rows were right in every
cell. The per-file table rebuilds the 19 from the other end: `2+1+1+1+1+2+1+4+1+1+1 = 16` plus
`library.spec.ts`'s 3 = 19, from the runner's JSON, and the two ends agree.

**The Phase 13 offset, by name** (each figure read from its `13-0N-SUMMARY.md` and reproduced from the
per-file JSON): 13-01 +1 / +2, e2e +1 / +2, check +2; 13-02 +0; 13-03 +0 / +5, check +1; 13-04 +0 / −8,
e2e −4 / −8, check +1; 13-05 +1 / +6, check +9; 13-06 +1 / +10, check +9. Sum **+3 / +15 / −3 / −6 /
+22**; 85 + 3 = 88, 888 + 15 = 903, 87 − 3 = 84, 106 − 6 = 100, 582 + 22 = 604. 13-20 rebuilds Phase
13's own totals; this gate states the offset and does not own it.

**The catalog, OG and audition chains took neither drawn branch.** `12-VALIDATION.md` drew `beside`
(27 / 27 / 23 at 9 + 18) and `replace` (26 / 26 / 22 at 8 + 18); the user's answer was neither and
12-10's fold gave catalog `−1 preset carded + 1 Lua = +0`, OG `−1 + 1 = +0`, audition `+1`. So `beside`
was wrong on two chains, `replace` on one, and the plan's own chain block carried `beside`. Named as
a document defect and as a plan defect.

---

## The picker-corner re-measurement, and the header that disagreed

Every hand-authored entry at three corners (`max(text.length, measureLua(text))` after `padReady()`;
the picker corner is every knob at its longest declared value with every colour knob at `255,255,255`,
the corner `lua-entries.sweep.spec.ts` gates), every string a fixed point of `compressScript`. The
full table with the all-shortest corner and the library's row is in `docs/TESTING.md`; the touched
entries, Setup / Timer at the picker corner with free:

| Entry | Setup | Timer | Header | Phase |
| --- | --- | --- | --- | --- |
| **trackpad** | **903 / 5** | **490 / 418** | **NO - 488 / 486 from its first commit, corrected** | 12-10 |
| wheels | 895 / 13 | 343 / 565 | yes | re-read |
| strip | 875 / 33 | — | yes | re-read |
| quadrant | 838 / 70 | — | yes | 12-08 costed 874 / 34, deferred |
| chorus | 796 / 112 | 29 / 879 | yes | 12-09 |
| console | 781 / 127 | — | yes | 12-05, 12-09 |
| morph | 772 / 136 | — | yes | 12-09 |
| lumen | 707 / 201 | — | yes | 12-11 |
| euclid | 700 / 208 | 237 / 671 | yes | 12-08 |
| arc | 541 / 367 | 275 / 633 | yes | 12-05 |
| radar-points | 489 / 419 | 288 / 620 | yes | 12-08 |
| sonar | 469 / 439 | 289 / 619 | yes | 12-08 |
| steps | 394 / 514 | 260 / 648 | yes | 12-08 |
| pomodoro, stage, snake, cull, ghost | 743, 653, 585, 565, 478 | 659, 136, 880, 0, 422 | yes | untouched, re-read |
| **the library** | **769 / 139** | — | yes | 12-07 |
| ninepads (preset) | 550 / 158 shipped; 637 swept, 640 true | — | `presets.ts` 550 | 12-05 |
| joystick (preset) | 543 / 24 defaults; 551 / 357 corner | — | `presets.ts` 543 | 12-06 |
| tpad (shelf, uncarded) | 902 / 146; 907 / 1 (11-16) | — | `presets.ts` 902 | 12-10 |

TRACKPAD's Timer was measured at all eighteen (flash, reach, fade) states with the colour at
`255,255,255`: every `true` state is **489**, every `false` state **490**, so reach and fade move
nothing and the corner is any `false` state; at the defaults it is **488**. 12-10's header, SUMMARY
and audition row all read 488 / 486 - two short on both - from the file's one commit. **TRACKPAD's
Setup at 903 / 5 at every knob state is now the tightest card in the catalog.**

**The library's row**: 769 raw, 769 compressed, 769 measured, a fixed point, the uniform 770 join
compressing to it; parts 25 + 109 + 56 + 282 + 74 + 150 + 68. Callers read from the rendered entries:
`Q` - EUCLID, STEPS, RADAR POINTS, SONAR, CHORUS, CONSOLE, MORPH, LUMEN (eight); `X` - EUCLID, STEPS,
RADAR POINTS, SONAR, CHORUS (five); `A` - LUMEN; `D` - TRACKPAD; `R` - defined by CHORUS, called by
`E`; `W` and `E` library-internal. **No function shipped without a caller.** Four entries define a
local under a library name (STRIP `X`, LUMEN `D`, WHEELS `D`, STAGE `R`), each shadowing only inside
its own event body - `host-surface.spec.ts` resolves locals for exactly this reason.

**The audition table**: ARC 520 → **538** (12-05 moved the header and not the table), TRACKPAD 486 →
**488**; the eleventh and twelfth stale rows over three phases, every one smaller than the entry
costs; the other sixteen agree to the character. Rows 7(e) and 21(d) appended as expectations on
existing rows; still 23, `audition.spec.ts` green.

---

## The negative checks - two run, two red, both files restored

1. `facets.spec.ts`'s floor: it is at `:117`, not the plan's `:110`, and appears **twice**. `> 21`:
   **green** (4 passed) against `LISTING.length` 26. `> 27`: **red** in both health tests, `the
   listing was actually read: expected 26 to be greater than 27` - the plan said "red naming 27", the
   tree names 26. Restored from a scratch copy, sha256 `d07a4562…` both sides, `git diff --quiet` 0.
2. `upstream-manifest.json`, `tests/pad.test.js`'s one `intendedDivergence` `reason` set to `""` (the
   occurrence counted at one before the write): `vendored-diff.spec.ts` **red** on "every intended
   divergence is justified", naming the file and the field, `Got: ""`, 14 of 15 green. Restored,
   sha256 `8853783d…` both sides - the same hash 11-16 recorded.

No `git checkout`, `git restore`, `git stash` or `git clean` was run at any point. The two
measurement harnesses were scratch spec files copied into `src/lib/catalog/` for one explicit run
each and deleted before any counted run; `git status` after each showed only the user's three
untracked root files.

---

## The vendored diff beside the manifest's rows

`git diff --stat 4131ff5 HEAD -- src/vendor/`: `_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js`
19, `tests/pad.test.js` 7 - 4 files, +92 / −33, exactly 11-16's reading. The manifest's **22** rows:
10 / 6 / 1 / 5 / 0 / 0. `git diff --quiet HEAD -- src/vendor/` exit 0: thirty-four consecutive waves
(16 + 12 + 6) with no vendored byte moved. `firmware-oracle.spec.ts` 7 + 1 todo, byte-unedited since
`b3a554d`, green in all three runs; `preset-baseline.json` unchanged since `d85495a`.

---

## The four amendments, before and after, and SAFE-04's superseded row

**SAFE-03** - before: _"HANGAR snapshots the touch element's Setup and Timer configs, and `PUT BACK`
restores them with one click at any time"_. After (appended, the old text kept): three strings - the
system element's setup (255/0) and the touch element's Setup and Timer - fetched through `fetchAll`
before any write control enables, restored by `PUT BACK` in the order system, Timer, Setup through the
one writer; a v1 record restores the firmware's 24-character system default and is never overwritten,
deleted or shadowed. Dated 2026-09-11 for 12-03.

**SAFE-05** - before: the confirmation names _"the Setup and Timer scripts on your ZONA's touch
element"_. After: the shipped sentence, held from both sides by `AMENDED_BY_THE_THIRD_SCRIPT` - _"This
replaces the Setup and Timer scripts on your ZONA's touch element and the page's own init script, and
it survives a power cycle."_ - because a KEEP stores the page and the page carries the library.

**SAFE-07** - before: _"a write that lands one event but not the other is detected…"_, with the row
quoting _"Timer reached your ZONA and Setup did not."_. After: three event writes in one order, settled
from three acknowledgements, a classifier naming which of the three landed in write order, and the
impossible partial - system did not land, Setup did - named in the requirement as it is in the code.
**Found by a plan-check and not by the planner**, whose first draft of this plan amended two; that
sentence is here so the next phase does not repeat it.

**CONT-01** - before: _"The nine BOTOR shelf presets … are in the catalog"_. After: eight carded; the
ninth, `tpad`, declared on the shelf, diffed by `presets.spec.ts` (nine against nine, untouched),
tunable through `portedEntry` as the over-budget fixture, no longer a card, `/c/tpad/` dead; whether it
should also leave the shelf carried, not decided. **The fourth amendment where the plan expected
three**, because the user's answer at 12-06 arrived mid-phase.

**SAFE-04's coverage row, superseded by a qualifier**: the row names `hangar.snapshot.v1` by key;
since 12-03 `.v2` is written, v1 is read as `system = default` with `fromV1`, never overwritten,
deleted or shadowed (a v1 entry blocks a v2 entry for its page). The criterion holds. **The key's
wire-unprovenness is UNCHANGED by this phase** - `SERIALNUMBER/FETCH` still never observed on hardware;
recording it as changed would be false, the sentence 10-14 wrote and this gate repeats.

## The qualifiers, and the grep-built reconciliation

`grep -n "requirements:" 12-*-PLAN.md` over the eleven plans yields twenty-one ids: SAFE-01, 02, 03,
04, 05, 07, 09; TUNE-01, 02, 05; PREV-01, 02; CAT-01, 03, 04; CONT-01, 02, 03; SHARE-01, 03, 04. The
gate plan's frontmatter holds those twenty-one plus **PREV-06**, the standing oracle, which no other
plan claimed - the one difference, named. Every one of the twenty-two carries a `PHASE 12 GATE
QUALIFIER, 2026-09-11 (plan 12-12)` with its unproved half; the sentence _"nothing in this phase has
been hardware-verified since the probe"_ wherever a hardware claim would otherwise be implied. Two
attribution defects in the plan's own qualifier table: it credits CONT-01 to 12-10 and TUNE-01 /
TUNE-05 to 12-10, none of which 12-10's frontmatter claims (12-10 moved CONT-01's SUBJECT without
claiming it - a 12-10 frontmatter defect; its qualifier is written anyway). The unproved halves, in
one line each: SAFE-01 claimed and untouched in substance (a third write in the same four clicks;
`WRITE_CLICKS` 4, ten needles unmoved); SAFE-02 weights unmoved, TRY writes three strings to RAM, row
D the user's; SAFE-09 three attempts bounding three legs; TUNE-02 the verdict quoted from 12-01 and
`system` constant and unmetered; CONT-02 eighteen inside 908 at every corner, the library 769 with
every caller, **nothing on a ZONA since the probe**; CONT-03 seven FOR summing 26, six FEELS summing
52, thirteen, zero singletons, `still` at exactly 6 again; CAT-01 twenty-six pages and **thirteen**
dead links (`/c/tpad/` the thirteenth) plus `?for=keys`; CAT-03 as 12-04 left it; CAT-04 unticked for
the fifth gate with the reason; PREV-01 the preview runs the library but **cannot produce a wobbling
finger, a lost lift or a phantom**, `D-11-13-a` still open by 12-07's choice; PREV-02 the three
strings the preview runs are the three the install path writes; PREV-06 the oracle unedited; TUNE-01
no value count moved, TRACKPAD the one new rack; TUNE-05 over budget 0 across 44,846, `tpad`'s 907 no
longer swept; SHARE-01 **no link demoted this phase** (no resize), said because Phase 11 could not;
SHARE-03 thirty payloads over fifteen entries, no second `older` entry; SHARE-04 26 images, 154,136 B,
the plan's 27 the `beside` branch.

---

## Deferred items, by section, and the bench-note trace

`deferred-items.md` gained the gate's work list: **A** fourteen things the phase could not do, each
with what closes it - clock sync, SNAKE at 28 free, `D-11-13-a` (12-07 touched `lua-host.ts` and
chose not to widen), QUADRANT's hung note with 12-08's arithmetic verbatim (fits at 874 / 34, deferred
for three reasons), `?for=keys`, the decay gate's `D(` blindness (**recorded, not widened**: the honest
clause is textual and more than one assertion), the dropped function (`F`, for having no caller; `A`
and `D` both shipped), `tpad`'s 907 no longer swept, the audition table's missing gate, the
reachability licence, **JOYSTICK's audition row declined** (the document covers hand-authored
configurations; the as-is check is in the checkpoint), `check-counts.mjs`'s two findings,
`SESSION-RUNBOOK.md:14`, and Phase 13's items with **`front-door.ts` and `front-door.spec.ts` handed
to 13-07 as-is, nothing about the ring claimed as durable**; **B** the probe's hardware findings for
the production unit (dropped taps, palm ghosting, five-finger lag, the centre four low); **C** the
three readings retired by the probe, `TOUCH-CODE-9.md` pointed at with option 2 chosen by evidence;
**D** eleven decisions open for the user - the expiry window as **five callers' window** (CHORUS 2.0
s, EUCLID 2.2, STEPS 2.4, RADAR POINTS 2.8, SONAR 1.4 at their defaults), LUMEN's y inversion,
`featured`, JOYSTICK as-is, LUMEN on `still`, STRIP as three, the thirteen dead links, **whether the
`tpad` preset should also leave the shelf (carried, not decided)**, TRACKPAD's six questions, QUADRANT
after row 19(b); **E** every item of Phase 11's file and this phase's six with its state (D-11-08.1-a
closed by 12-03 with its diagnosis inverted; C.3 answered verbatim; C.5 retired by the probe; A.3
delivered as TRACKPAD by the fold; A.9 delivered with 12-01's verdict; A.7 and A.8 closed by removal;
item 2 closed before it was written; items 4, 5.1, 5.3, 6.1 to 6.5 closed here; 6.6 and 6.7 Phase
13's). **The bench-note trace** attributes every line of `BENCH-2026-09-10.txt`: the snippet → 12-07's
`A`, called by LUMEN in 12-11, not dropped; ARC 12-05; CHORUS 12-09; EUCLID 12-08; LATTICE 12-04
(removed); LUMEN 12-01 + 12-11; MORPH 12-09; NINE PADS 12-01 + 12-05; SNAKE deferred; CONSOLE 12-05 +
12-09; FORGE 12-04; GHOST good; JOYSTICK 12-06 (as-is, verbatim); RADAR POINTS 12-08; POMODORO good;
SHUTTLE 12-04; Trackpad 12-10; the bigger-scope decision 12-07 on 12-02 / 12-03. No line closes on a
claim. **`D-12-12-a`** is logged there for `session.e2e.ts:701`.

---

## Deviations from the plan

**1. [Rule 1 - stale claims in source, corrected under 11-16's precedent, the plan's files being docs
only]** `trackpad.ts`'s header (Timer 488 / 486 → 490 / 488, wrong from birth), `lua-smoke.spec.ts`'s
header (TWENTY-THREE → TWENTY-NINE, wrong by six since 12-10), `facets.ts`'s `still`-carrier list
(TPAD → TRACKPAD since 12-10). Comment-only; no count moved; lint clean; committed with task 01
(`b979c5e`). The SUMMARYs that carry the same figures are pointed at, never edited.

**2. [Rule 2 - the append-only rule over the plan's "rewritten"]** The plan says `docs/TESTING.md` is
"rewritten where counts and shapes live"; the shared-tree rule (13-VALIDATION, and the brief) is
"add a section, never reflow one". A Phase 12 section was inserted whole before the vendored-tree
section (476 lines, zero deletions, verified by `git diff --numstat`), and every stale count in an
earlier section is listed by line under "Corrections to earlier sections" rather than edited in place;
`:885`'s `writeBoth` row and `SESSION-RUNBOOK.md:14` are named there (item 6 of the brief).

**3. [Rule 2 - the audition expectations as in-cell appends within the column width]** Rows 7(e) and
21(d) were appended inside their cells at 350 and 500 characters, below row 22's 1,144-character
column maximum, so prettier re-aligned only those two rows and no other row moved; `git diff --numstat`
21 / 4 on the file, `audition.spec.ts` green.

**4. [Rule 1 - the plan's negative check run where the floor is]** `facets.spec.ts:110` → `:117`,
twice; "red naming 27" → red naming 26. Both arms run and named.

**5. [Rule 1 - four amendments, not three]** CONT-01 amended for 12-10's fold, which 12-10's item 6.2
handed to this gate; the plan's "three" predates the user's answer.

**6. [Rule 2 - the qualifier date]** `2026-09-11`, the day the gate ran, not the plan's `2026-09-10`.

**7. [Process - no JOYSTICK audition row]** Deferred item 5.2 asked for one; the document covers
hand-authored configurations by its own title and the plan fixes the table at 23. Declined with the
reason in section A.11; the as-is check is item 11 of the checkpoint list.

**8. [Process - `gsd-tools state` commands not run]** As every plan since 12-04: STATE.md updated by a
script against a scratch copy, asserting `status: executing`, `completed_phases: 11`, `percent: 100`,
`total_phases: 14` and `total_plans: 160` unchanged before and after; the `Plan:` line reads "12 of 12
landed … gate landed, bench pending", the previous `Status:` retained, Phase 13's lines kept with one
dated clause appended, `completed_plans` 141 → 142, one metrics row, four decisions. `advance-plan`,
`update-progress`, `roadmap update-plan-progress` and `requirements mark-complete` not run;
`.planning/ROADMAP.md` byte-unchanged; **Phase 12 not marked complete**.

**9. [Process - the interruption]** Reconciled above; nothing discarded.

**10. [Process - the commit trailer]** The harness's attribution reminder, which arrived mid-plan, asks
for a co-author trailer on every commit; the repository's standing rule (this plan's `standing_rules`,
every Phase 11 and 12 commit, and the brief) is no Claude or Anthropic attribution anywhere and no
co-author trailer. The repository's rule was followed; the conflict is reported here for the user to
resolve.

---

## Things the plan asserts that the tree does not support

1. **Catalog 27 at 9 + 18, `static/og/` 27, audition chain `+1 at 12-10`** - 26 at 8 + 18, 26, and the
   audition's +1 is right for the wrong reason (a fold, not a `beside`).
2. **`check-counts.mjs 85 888`, `--playwright 106`, `grep -c "test("` 87, `svelte-check` 582** - right
   as Phase 12's chain ends; the tree is 88 / 903 / 100 / 84 / 604 under Phase 13.
3. **`facets.spec.ts:110`, "red naming 27"** - `:117`, twice, naming 26.
4. **"Three requirements are falsified by this phase"** - four, after 12-06's answer.
5. **"the audition checklist at 23 with the two-finger and the expiry expectations"** - done; but the
   plan's `<files>` for task 03 lists `docs/INSTALL-RUNBOOK.md`, which the checkpoint does not edit and
   which is under Phase 13's append-only band; it is untouched and row C's text is quoted in the
   checkpoint as 12-03 left it.
6. **The qualifier table's attributions** (CONT-01 to 12-10; TUNE-01 / TUNE-05 to 12-10) do not match
   the grep.
7. **"GLIDE beside the preset", `glide.ts`, "GLIDE's knobs"** throughout - TRACKPAD, `trackpad.ts`,
   the preset's gestures kept and the flash a Timer-side knob.
8. **"the planner's library figure … 954, then 885, then the revised sketch's raw 770"** - all three
   named against the measured 769; the 770 was right as a raw length.
9. **"`moduleState` … twelve/seventeen"** - eighteen, at `:238` today.
10. **"free memory beside every run"** - recorded, and it was between 121 and 573 MB of 16 GB, which is
    the reason every transient above exists and none is a bug.

---

## `.planning/ROADMAP.md` was deliberately not edited - the row, for whoever updates it

- **Requirements:** SAFE-01, SAFE-02, SAFE-03 (amended), SAFE-04 (qualified), SAFE-05 (amended),
  SAFE-07 (amended), SAFE-09, TUNE-01, TUNE-02, TUNE-05, PREV-01, PREV-02, PREV-06, CAT-01, CAT-03,
  CAT-04 (still Pending, deliberately), CONT-01 (amended), CONT-02, CONT-03, SHARE-01, SHARE-03,
  SHARE-04.
- **Plans: 12 of 12 landed** - 12-01 to 12-11 complete, 12-12's tasks 01 and 02 complete and its task
  03 checkpoint open until the user runs the bench.
- **Final counts:** Phase 12's chain 85 / 888 (+1 todo), e2e 87 / 106, `svelte-check` 582, catalog 26
  (8 preset-backed + 18 hand-authored, the `tpad` preset on the shelf), `static/og/` 26 files,
  154,136 B, audition 23 rows all unanswered, sweep `4 19`, the library 769 / 139; the tree at
  `fed9c17` 88 / 903 / 84 / 100 / 604 with Phase 13's six waves.
- **Status:** gate landed, bench pending; four requirements amended; nothing hardware-verified since
  the user's probe of 2026-09-10.

---

## Commits

| Hash | Message |
| --- | --- |
| `b979c5e` | `docs(12-12): the gate against a fresh build - twelve-term chains, the Phase 13 offset stated once, and every entry re-measured at the picker corner` (task 01: `docs/TESTING.md`, `docs/HARDWARE-AUDITION.md`, `trackpad.ts`, `lua-smoke.spec.ts`, `facets.ts`) |
| `bddfaea` | `docs(12-12): four requirements amended by name and dated, twenty-two qualifiers, and the phase's work list with the bench-note trace` (task 02: `.planning/REQUIREMENTS.md`, `deferred-items.md`) |
| (this document) | `docs(12-12): the gate summary, STATE recorded as gate landed and bench pending` |

## The checkpoint handed over (task 03) - not answered here

**Type:** human-verify, blocking. **Progress:** 2 of 3 tasks. The rows are in the completion report,
ordered so the first ten minutes re-observe the probe's two findings: the boundary finger on EUCLID
and the lost lift on CHORUS first, then STEPS, RADAR POINTS and SONAR, WHEELS under two fingers, ARC,
CONSOLE, MORPH, NINE PADS, LUMEN, TRACKPAD's edge flash, JOYSTICK as-is, and runbook row C again with
three frames per click. **The user's answer will be recorded verbatim by whoever continues; nothing
in this document assumes one.**

## Known Stubs

None. This plan renders nothing and wires nothing; its deliverables are documents, three header
corrections and a record.

## Self-Check: PASSED

Every file this document names as created or modified exists on disk; the commit hashes it names
resolve in `git log --oneline --all`; `git diff --quiet -- .planning/ROADMAP.md` exits 0;
`git diff --stat HEAD -- src/vendor/` is empty; nothing under `.planning/phases/13-gui-overhaul/` was
touched; no device was touched and nothing was deployed.
