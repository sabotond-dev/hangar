---
phase: 11-bench-corrections
plan: 16
subsystem: docs
tags:
  [gate, chain, amendments, non-delivery, bench, audition, manifest, checkpoint]
requires:
  - phase: 11-bench-corrections
    plan: 01
    provides: "BASE_FILES 81 / BASE_TESTS 828 / BASE_E2E 103 / BASE_CHECK 584 / BASE_SWEEP 4 19 / BASE_SWEEP_WALL 134 s at 3,010 MB / BASE_CATALOG 36 / BASE_OG_BYTES 213,919 over 36, measured on a clean tree at b29a00f"
  - phase: 11-bench-corrections
    plan: 03
    provides: "the CONT-01 and FOUND-02 amendments recorded in advance, with proposed wording, and the empty intendedDivergence record"
  - phase: 11-bench-corrections
    plan: 04
    provides: "the 22 divergence rows, the four-file vendored diff, and the four mislabelled free-at-worst figures handed to the gate"
  - phase: 11-bench-corrections
    plan: 09
    provides: "POMODORO's append, the shape character n to p, and wild-stamps.json's forever-clause spent for the first time - the third amendment nobody recorded in advance"
  - phase: 11-bench-corrections
    plan: 14
    provides: "the recorded answer new-entry, T14 = +1, and the branch row every downstream number in this plan is read from"
  - phase: 11-bench-corrections
    plan: 15
    provides: "PREV_TESTS 868 and the five-versus-four suite-running-plans disagreement, reported rather than reconciled"
provides:
  - "docs/TESTING.md: every count and cost re-measured at the gate, the nineteen-term chains, the budget table replaced by a four-corner measurement of all twenty hand-authored entries, and twelve planner errors named as wrong"
  - "deferred-items.md: the phase's work list - nine named non-deliveries with the branch stated, seven missing gates, ten open-for-the-user decisions, and every item the eighteen SUMMARYs recorded with its state at the gate"
  - "CONT-01, FOUND-02 and SHARE-03 amended by name and dated, none deleted, none softened; eleven other requirements carrying a dated qualifier with its unproved half; CAT-04 deliberately unticked for the fourth time"
  - "docs/HARDWARE-AUDITION.md at twenty-five rows, every cost row re-measured from the entry, nine of twenty found stale"
  - "The four mislabelled upstream-manifest.json figures corrected with provenance; the eighth wrong-corner header (SNAKE) corrected; two stale comments (lua-smoke's count, front-door's reason) corrected"
  - "The bench-note trace: all thirty-five lines, each attributed to a plan, a removal, a named non-delivery or a deferral"
affects: [12]
tech-stack:
  added: []
  patterns:
    - "A gate asserts against BASE_* in a chain of one term per plan, with the term count itself asserted and every term checked against its plan's own check-counts line; a disagreement with a document is named as a document defect and a disagreement with a plan as a plan defect"
    - "A negative check restores from a scratch copy and compares sha256 both sides, never git checkout"
key-files:
  created:
    - .planning/phases/11-bench-corrections/11-16-SUMMARY.md
  modified:
    - docs/TESTING.md
    - docs/HARDWARE-AUDITION.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/11-bench-corrections/deferred-items.md
    - src/lib/fidelity/upstream-manifest.json
    - src/lib/catalog/entries/snake.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
key-decisions:
  - "RESUMED, NOT REDONE. The interrupted executor left task 02's two files and four source corrections on disk, coherent and green; every diff was read against the plan's task text and verified against the tree before anything was committed, and task 01 - which it had not started - was written from scratch"
  - "THE PHASE TOTAL IS BASE_TESTS + 41 IN NINETEEN TERMS, and the two documents that said +40 are named rather than absorbed: the eighteen fixed terms sum to 40 and T14 is +1 under new-entry"
  - "lua-smoke.spec.ts is +22 across THIRTEEN plans, not +21 across twelve: 11-VALIDATION.md's per-file row and the gate's own plan both omitted 11-10's +1 that the same document's plan-level table carries. Observed 3 to 25"
  - "THE COST TABLE IS ONE READING PER ROW AND SAYS SO. The build read 28 s before the commits and 13 s after; the sweep 114 s and 147 s; the e2e 137 s and 158 s - the second run at 1.6 GB free against the first's 6.3 GB. Neither is rounded into the other"
  - "THE POST-COMMIT E2E RUN HAD ONE FAILURE AND IT IS REPORTED, NOT RETRIED INTO SILENCE: browse-webkit.e2e.ts:564 (11-08.1's own title) on webkit-phone, a read taken with no wait immediately after a poll returned a non-number - the same family as D-11-08.1-a. Logged as D-11-16-a; a third run is reported beside it"
  - "roadmap update-plan-progress and state advance-plan were SKIPPED on instruction; the ROADMAP row is written here for whoever updates it"
patterns-established:
  - "Every header's budget sentence now quotes the RGB444 picker corner, and the gate that would keep it so is named in deferred-items rather than built"
requirements-completed: [CONT-01, FOUND-02, SHARE-03]
duration: 95min
completed: 2026-09-10
---

# Phase 11 Plan 16: The gate — every projection replaced by an observation, three requirements amended by name, nine non-deliveries named, and the bench rows handed over Summary

**The phase closes at `BASE_FILES + 3` / `BASE_TESTS + 41` in a nineteen-term chain whose term
count is itself asserted, with 11-14's `new-entry` answer read from its branch row (`T14 = +1`,
catalog 29 = 9 + 20, `static/og/` 29, audition 25). Twelve rows the planner got wrong are named in
`docs/TESTING.md` — including the phase total itself, written as +40 in two documents — and the budget
table is replaced by a four-corner measurement of all twenty hand-authored entries, which found the
eighth header quoting the wrong corner (SNAKE, 36 free became 28). CONT-01, FOUND-02 and SHARE-03 are
amended by name and dated; the user is told plainly that POMODORO's append demoted every POMODORO link
ever shared to `older`, and why that costs nothing yet. Nine things the phase could not do are named
with what would close each; seven gates that do not exist are named the same way. Nothing touched a
ZONA, and the twenty-five audition rows are handed over unanswered at the checkpoint below.**

## Performance

- **Duration:** about 95 min across two executor sessions (the first interrupted mid-plan)
- **Tasks:** 2 of 3 — task 03 is the blocking human checkpoint and is NOT answered here
- **Files:** 1 created, 8 modified, across two commits plus this document's own

---

## Where the previous executor stopped, and what was verified rather than trusted

`git status` at resume showed six modified files and nothing committed from the gate. Each diff was
read against the plan's task text:

| File | Task | Verified how |
| --- | --- | --- |
| `src/lib/fidelity/upstream-manifest.json` | 02 (the manifest beside the diff) | the four corrected figures (pinwheel 486 → 422 free, radar 458 → 450, joystick 551 → 357, faders 524 → 384) match the reachability sweep's per-preset rows at this gate, digit for digit; the `vendored`/`upstream` texts are byte-unchanged (`vendored-diff.spec.ts` 15 green, `git diff --quiet HEAD -- src/vendor/` exit 0) |
| `src/lib/catalog/entries/snake.ts` | 01 (the header sweep) | measured at four corners: 585 / 880 at the picker corner, 28 free on the Timer — the header's new figures exactly; the old 581 / 872 was the declared-palette corner |
| `src/lib/catalog/front-door.spec.ts` | 01 | the new comment gives the LIVE reason — `Coverflow.svelte` calls `createEngine` for every ring entry and a `lua` row would dynamic-import the 271,581-byte Lua VM on first paint, which `e2e/tuning.e2e.ts` forbids for `/` — and cites 11-14's handover measurement (SONAR planted at ring 5 reddened this assertion, the golden-frames record and the vendored-shelf resolution) |
| `src/lib/sim/lua-smoke.spec.ts` | 01 | "Twenty-five tests" against the runner's JSON: **25**; the thirteen-plan breakdown sums to +22 from 3 |
| `docs/HARDWARE-AUDITION.md` | 02 | all twenty cost rows re-measured from `renderLua` at the defaults: every row matches the tree to the character (table below); 25 checklist rows contiguous |
| `.planning/REQUIREMENTS.md` | 02 | CONT-01 `[x]` under amended wording, FOUND-02 and SHARE-03 amended and dated; **CAT-04 is `[ ]`** and its row says why for the fourth time; every number in the qualifiers checked against the gate's own runs (one wall clock, the reachability sweep's, replaced by this gate's reading — 107.9 s — because the interrupted executor's 101.2 s was a run nobody here observed) |

**So the executor stopped between the tasks, in the wrong order:** task 02's artefacts were done and
task 01's — `docs/TESTING.md` untouched since 11-01, `deferred-items.md` untouched since 11-13 — were
not started. Task 01 was written here from the eighteen SUMMARYs, `11-VALIDATION.md` and the gate's
own measurements; the header sweep the interrupted executor began (SNAKE) was completed over the six
other never-checked headers (EUCLID, CHORUS, LATTICE, SONAR, CULL, QUADRANT — all right, four by
accident and two by construction).

---

## The re-measured block against 11-01's baseline

Two full gate runs, both on this machine, both against a fresh `npm run build` with no server
holding `build/`. Run 1 was taken on the tree at `721e5fa` plus the six corrections, before they were
committed, and is the run `docs/TESTING.md` records; run 2 was taken after the two commits at
`c5fd1cd`. Free memory is what the machine had at each command's start.

| Name | `BASE_*` (11-01) | Run 1 (pre-commit, 6.3–6.8 GB free) | Run 2 (post-commit, 1.5–2.6 GB free) | Chain |
| --- | --- | --- | --- | --- |
| `svelte-check` | 584 | **582**, 0 errors 0 warnings, 10 s | **582**, 11 s | `BASE_CHECK − 2` |
| `npm run lint` | — | clean, 38 s | clean, 46 s | — |
| quick files | 81 | **84** | **84** | `BASE_FILES + 3` |
| quick tests | 828 (+1 todo) | **869** (+1 todo), 37 s / 35.08 s; 37 s / 36.48 s after the build | **869**, 48 s / 45.34 s; 47 s / 44.76 s after the build | `BASE_TESTS + 41` |
| sweep | `4 19` | **`4 19`** | **`4 19`** | unchanged |
| sweep wall | 134 s at 3,010 MB | **114 s (111.85 s)** at 6,795 MB | **147 s (144.83 s)** at 1,910 MB | −14.9 % in run 1; +9.7 % in run 2, which ran at 1.9 GB free — the same machine-not-tree spread 11-01/11-02/11-03 read as 120 / 112 / 134 s |
| build | — | **28 s** (vite 1.18 + 5.93 s; archive 1,649 KB) | **13 s** (vite 1.49 + 5.98 s; archive 1,659 KB) | the 28 s was a single cold reading; 13 s is in line with Phase 10's 10 s |
| e2e | 103 | **105 passed**, 2.1 m, 137 s wall at 6,294 MB | **104 passed, 1 failed**, 2.6 m, 158 s wall at 1,651 MB — see D-11-16-a below | `BASE_E2E + 2` |
| e2e, run 3 | | | **105 passed**, 2.1 m, 131 s wall at 2,209 MB, started straight after run 2 (86 chromium + 19 webkit-phone ok lines; `check-counts --playwright 105` exit 0) | `BASE_E2E + 2` |
| catalog | 36 | **29** (9 + 20) | 29 | `BASE_CATALOG − 9 + 1 + 1` |
| `static/og/` | 213,919 B / 36 | **172,699 B / 29**, rebuilt from empty and byte-identical to the committed set | same | −41,220 B / −7 files |
| audition rows | 32 → 23 (11-01) | **25** | 25 | 23 + 1 (11-15) + 1 (11-14) |

`check-counts.mjs` exited 0 against `84 869`, `4 19` and `--playwright 105` in run 1, and against
`84 869` and `4 19` in run 2. `test-results/` was removed by hand after every Playwright run and
`git status --porcelain` was empty before each commit and after the last run.

### 11-14's recorded answer, and the row every number above was read from

> **new-entry**

Copied from `11-14-SUMMARY.md`: `T14 = +1`, catalog 28 → **29**, split **9 + 20**, `static/og/` 28 →
**29**, audition 24 → **25**, phase test total **`BASE_TESTS + 41`**. 11-15 executed before 11-14, so
the audition went 23 → 24 (WHEELS) → 25 (RADAR POINTS) and `PREV_TESTS` went 866 → 868 → 869; the
chains below are written by plan number and end at the same place.

### The test chain — nineteen terms, the count asserted

```
BASE_TESTS 828
  +3 (11-01)  +5 (11-02)  +2 (11-03)  +1 (11-04)  +4 (11-05)  +1 (11-06)
  +4 (11-07)  +2 (11-08)  +3 (11-08.1)  +3 (11-09)  +2 (11-09.1)  +1 (11-09.2)
  +3 (11-10)  +1 (11-11)  +1 (11-12)  +2 (11-13)  +1 (11-14, T14)  +2 (11-15)  +0 (11-16)
  = 828 + 41 = 869
```

`3+5+2+1+4+1+4+2+3+3+2+1+3+1+1+2+1+2+0` — **nineteen terms for nineteen plans**, counted, and
`11-VALIDATION.md:103`, `:287`, `:291` and this plan's `<interfaces>` all say nineteen. Every term was
checked against its plan's own `check-counts` line (the `PREV_TESTS` ladder 828, 831, 836, 838, 839,
843, 844, 848, 850, 853, 856, 858, 859, 862, 863, 864, 866, 868, 869 in the SUMMARYs) and **every term
agrees with its plan**. Per file, from the runner's JSON: `decay-idiom` 3, `touch-guard` 3, `presets` 4
(the three created files), `lua-smoke` 3 → 25, `host` 18 → 21, `vendored-diff` 14 → 15,
`preset-baseline` 19 → 20, `lua-host` 9 → 10, `host-surface` 4 → 5, `knobs.preset` 6 → 7, `stamp` 8 →
9: `10 + 22 + 3 + 1 + 1 + 1 + 1 + 1 + 1 = 41`.

**The disagreements are all with documents, and each is named as a document defect in
`docs/TESTING.md`'s "Where the planner was wrong":**

- `11-VALIDATION.md`'s per-file `lua-smoke.spec.ts` row: `+8` across five plans as written, `+21`
  across twelve as revised, **`+22` across thirteen** observed — 11-10's `+1` is in the same
  document's plan-level table and missing from the per-file row;
- the phase total: `11-VALIDATION.md:287` says "+40, or +39" while its `:533` row says `+41`; this
  plan's tasks and success criteria say `+40` / `+39` while its `<interfaces>` says `+41` / `+40`. The
  eighteen fixed terms sum to 40 and `T14` is +1 — the "+40" documents folded `T14` in once and then
  counted it again as "or +39";
- this plan's `:140` fixed-term string has 11-10 at `+2` four lines under a chain that says `+3`;
  `11-VALIDATION.md:287`'s string reads `3, 3, 1, 2` across 11-09 to 11-10 where its table reads
  `3, 2, 1, 3` — the same sum, the wrong terms;
- 11-07 (`+2` → `+4`) and 11-08 (`+1` → `+2`): the validation document was the stale side until it was
  revised; the plans' own lines were right;
- 11-14's branch table put the phase total at `+33`, having been written before the decimal plans.

**Two plan defects, both named by the plan that found them and neither absorbed:** 11-09's task 03
declared `+0` while instructing "if nothing does, add it" (resolved in favour of the test); 11-10
declared `+2` while its two tasks required three tests (observed `+3`).

### The file chain, the e2e chain and the catalog chain

`BASE_FILES 81 +1 +1 +0 +0 +1 +0 ×14 = 84` — nineteen terms, sixteen written-out zeros and three ones
(`decay-idiom.spec.ts`, `touch-guard.spec.ts`, `presets.spec.ts`). `e2e/poll.ts` is a fourth created
file with a `+0` term: a helper the `server` project and `svelte-check` never see. **Nine source files
were deleted and the spec count rose**; `svelte-check` is where the deletions show, 584 → 582 (−9 +3
specs +4 sources).

`BASE_E2E 103 +0 ×8 +2 (11-08.1) +0 ×10 = 105` — nineteen terms, eighteen zeros and one `+2`. **The
two e2e numbers are different numbers:** `cat e2e/*.e2e.ts | grep -c "test("` reads **86** and
`npx playwright test --list` reads **105 tests in 13 files** = 86 `chromium` + 19 `@webkit` titles run
a second time by `webkit-phone` (run 1 printed 86 `[chromium]` and 19 `[webkit-phone]` ok lines).
A tagged title counts once in the grep and twice in the run, so 11-08.1's one title moved the grep
85 → 86 and the run 103 → 105. **Five plans ran the suite** — 11-01, 11-05, 11-08.1, 11-15, 11-16 —
against three (`11-16:141` as first drafted, `11-VALIDATION.md:238` and its `PREV_E2E` row) and four
(11-15's verification line, omitting the one plan that moved the baseline).

`BASE_CATALOG 36 −9 (11-01) +0 ×15 +1 (11-14, T14) +1 (11-15) +0 (11-16) = 29`, split **9 preset +
20 hand-authored Lua** — the fifteen zeros being 11-02 through 11-13 inclusive of 11-08.1, 11-09.1 and
11-09.2. `static/og/` **29 files, 172,699 B** against `BASE_OG_BYTES` 213,919 / 36 (11-01 read
161,754 / 27; 11-15 read 166,516 / 28; `radar-points.png` is 6,183 B exactly).

### The sweep wall clock, as a finding

`BASE_SWEEP_WALL` **134 s at 3,010 MB** → run 1 **114 s at 6,795 MB**: **fell 20 s, −14.9 %**. The
removal reached the sweep — 11-01 saw the fall first at 120 s — and the catalog under this reading is
29, not 27: the lua-entries sweep is 1,331 combinations against 11-01's 1,176. Run 2 read 147 s at
1,910 MB free, which is above the baseline; the three readings 11-01, 11-02 and 11-03 took on one
unchanged tree (120 / 112 / 134 s) already showed the spread is the machine. Sweep totals, both runs
identical: compiler route **20,782 + 24,576 = 45,358** (107.9 s / 140.6 s), over budget 0, Pass B
colours excluded 0; Lua route **51,888 + 135,168 = 187,056** (format w 51,486, x 382); lua-entries
**1,331 / 2,662**; kind cross-product 1,296, worst 906 of 908; `ninepads` 640 / 268 free, `tpad` 907 / 1.

### The vendored diff beside the manifest's rows

`git diff --stat 4131ff5 HEAD -- src/vendor/` at the gate:

```
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

`upstream-manifest.json`, counted from the file: `_pad.ts` **10** rows, `pad-sim.ts` **6**,
`pad-sim-host.ts` **0**, `tests/pad.test.js` **1**, `tests/pad-sim.test.js` **5**,
`tests/pad-invariants.test.js` **0** — **22**, all plan 11-04, all dated 2026-09-09. Four files with
hunks, four files with rows, and the two with zero rows are the two the diff does not name — the
same output 11-04 recorded and 11-14 re-observed. `git diff --quiet HEAD -- src/vendor/` exit 0:
this is the sixteenth consecutive wave with no vendored byte moved. `firmware-oracle.spec.ts` **7 + 1
todo, green, unedited since `b3a554d` (Phase 3)**; `preset-baseline.json` **byte-unchanged since
`d85495a` (Phase 3)** — D-02's boundary and D-08's rule both held through a phase allowed to edit the
vendored tree.

### The two negative checks

1. `facets.spec.ts:110`'s floor `> 20` raised to `> 21`: **green** (4 passed) against `LISTING.length`
   29 — the instruction "raise by one, expect red" is wrong here for the reason 10-14 found at 36
   against `> 30`. Raised to `> 29`: **red**, `the listing was actually read: expected 29 to be greater
   than 29`. Restored from a scratch copy; sha256 `a4c54448…` before and after; `git diff --quiet`
   exit 0.
2. `tests/pad.test.js`'s one `intendedDivergence` row given `"reason": ""`: `vendored-diff.spec.ts`
   **red** on "every intended divergence is justified", naming `src/vendor/botor/tests/pad.test.js`
   and the field — `reason must be a sentence saying what behaviour changed and why. Got: ""` — 14 of
   15 still green. Restored from a scratch copy; sha256 `8853783d…` both sides.

---

## The three amendments, before and after

### FOUND-02 (as 11-03 recorded in advance)

Before: _"…are vendored into HANGAR with their existing test suites passing unchanged, quarantined
under a single vendor directory with a written sync procedure back to BOTOR"_.

After: _"…are vendored into HANGAR, quarantined under a single vendor directory with a written sync
procedure back to BOTOR, and their existing test suites pass with the **22 enumerated divergences** of
`src/lib/fidelity/upstream-manifest.json` applied — across `_pad.ts` (10), `pad-sim.ts` (6),
`tests/pad.test.js` (1) and `tests/pad-sim.test.js` (5); `pad-sim-host.ts` and
`tests/pad-invariants.test.js` carry none — the three suites' counts themselves unchanged at 176, 96
and 9"_ — dated 2026-09-10, with the reason (D-02 in 11-04 moved one expectation in `pad.test.js` and
five in `pad-sim.test.js`; `vendored-diff.spec.ts` still hashes upstream's bytes through the record).

### CONT-01 (as 11-03 recorded in advance, widened by 11-05 and 11-06)

Before: _"…are in the catalog, each compiling to the same Lua as BOTOR at the pinned protocol
version"_, unchecked.

After: the same sentence plus _"**except at the divergences enumerated in
`src/lib/fidelity/upstream-manifest.json` (the vendored compiler's own constants: the comet-family
decay start and the two class-B guards, plan 11-04), declared per preset and per field in
`src/lib/catalog/divergence.ts` (HANGAR's own values for the nine, plan 11-06) and held by
`src/lib/fidelity/preset-baseline.spec.ts` and `src/lib/catalog/presets.spec.ts`, each row with its
recorded reason, plan and date**"_ — dated, naming the five diverging presets (aurora, pinwheel,
starfield, radar, dial — every `comet` or `perFinger` touch kind) and the one diverging vendored test
file, and stating that a difference at any un-named site is still a STOP-and-report under D-08. Ticked
`[x]` under the amended wording; its traceability row says what is NOT proved (that BOTOR's bytes are
what a ZONA runs today, and that `preset-baseline.json` still describes BOTOR's current compiler — it
is stale for four presets and green only through its substitution table).

### SHARE-03 (nobody recorded it in advance; 11-09 created it at the user's request)

Before: _"A stamp from an older HANGAR version fails gracefully — 'this link was made with an older
version' — and lands on the base configuration, never a subtly wrong one"_, with the Phase 10 row
claiming format x keeps decoding forever against 54 captured literals.

After: the same sentence plus a dated amendment: the forever-clause on `wild-stamps.json` now has
**exactly one recorded exception**, `xn33333` (POMODORO), which lands `older` since 11-09 appended
`1` and `5` to `@MINS` and moved the shape character `n` → `p`; that is the graceful landing the
requirement specifies and not the subtly-wrong one it forbids, proved by four literals captured before
the change; the fixture is neither regenerated nor edited and the expectation moved into
`stamp.spec.ts` gated on `record.entry === "pomodoro"`, so a second entry in that branch is a signal.
The traceability row corrects 54 → **36** literals over 18 entries (11-01 deleted the eighteen records
naming removed entries) and names the five value lists re-cut without a resize whose links still
decode `restored` and render differently.

### The POMODORO finding, in its four sentences, for the user

1. **What happened.** A POMODORO link shared before this phase now opens on the card with the tuning
   panel at its defaults and an "older link" notice, instead of restoring the knobs it was minted with.
2. **Why it is honest rather than wrong.** `older` is an apology, not a wrong interval. The failure the
   design refuses is a link silently rendering a _different_ configuration under the same name; that
   did not happen and cannot: the two values were appended, never inserted, so indices 0..3 still name
   15, 20, 25 and 50 minutes.
3. **Why the cost is zero in practice.** The site has never been public. There is no real POMODORO
   link in anybody's hands; this is a recorded price, not an incident.
4. **What it costs next time.** The tripwire is spent per entry. Every future knob resize on any entry
   demotes that entry's existing links the same way — which is why 11-09.1 and 11-09.2 were written
   under a no-new-knob rule and prove it with a before-and-after count of every knob's values.

### Every other touched requirement, with its unproved half

Each carries a **PHASE 11 GATE QUALIFIER, 2026-09-10** in `REQUIREMENTS.md`'s traceability table:

| Requirement | Proved | Not proved |
| --- | --- | --- |
| CONT-02 | 20 hand-authored entries canonical, in budget at the defaults and at every corner, 1,331 / 2,662 green; tightest WHEELS 895 / 13, STRIP 875 / 33, CONSOLE 844 / 64; every entry runs the scripted gesture in a real VM (25 lua-smoke tests); both class gates green | any of it on a ZONA; four faders never tested |
| CONT-03 | 29 entries at exactly three tags over eight `FOR` terms (modulation 8, show 5, sequencing 4, mixing 3, shortcuts 3, keys 2, pointing 2, play 2), zero singletons | the FEELS floor: `still` sits at exactly 6; a tenth removal breaks a rule |
| CAT-01 | 29 prerendered `/c/<id>/` pages with real `og:image`s | decided, not proved: nine addresses now 404; reversal costed in `deferred-items.md` C.1 |
| CAT-03 | detail view opens all 29 with knobs, meters and controls; vocabulary 16 → 14 terms green in node and both engines | nothing in its own subject |
| CAT-04 | the catalog is still static TypeScript modules with no backend | **deliberately still `Pending` for the fourth time**; four plans carried it in frontmatter and each declined to tick it; `requirements mark-complete` was not run for exactly this reason |
| PREV-01 | every one of 29 animates with no hardware; the preview made more faithful twice (11-04's decay in both files, 11-08.1's context recovery) | four recorded fidelity gaps: `touch.ts` never emits code 9 (`TOUCH-CODE-9.md`); one `_coordMax` for two axes (`D-11-13-a`); `lua-host.ts` keeps the deadline on a zero-period `gtt` (11-15); WebKit `contextlost` never observed either way |
| PREV-02 | nine preset entries render from the vendored compiler's own output, twenty Lua entries from `renderLua`'s exact bytes, the bytes the install path writes | that the compiler's output is BOTOR's — it deliberately is not at 22 sites; `lua-parity.spec.ts` (5) still holds compiler against simulator through a real VM |
| PREV-06 | `firmware-oracle.spec.ts` green and byte-unedited through a phase allowed to edit `pad-sim.ts`; `golden-frames.json` unmoved | the oracle covers the phase walk; nothing independent of the simulator pins the two class-B guards, verified against firmware C by reading; preset-backed residue not measured end to end |
| TUNE-01 | three to six knobs everywhere; exactly two entries' knobs moved (NINE PADS' appended `count`, POMODORO's two appended values), never inserted; reachability Pass A moved once, 19,502 → 20,782 | nothing in its own subject; `precise` on WHEELS is arithmetic over simulator coordinates |
| TUNE-05 | over budget 0, excluded 0 across 45,358 compiler-route states; 187,056 Lua-route vectors; 1,331 lua-entries — all inside 908; `ninepads` 640 / 268, `tpad` 907 / 1 | nothing about reachability; recorded: eight headers quoted the wrong corner, every one optimistic — now all twenty quote the picker corner |
| SHARE-01 | both routes round-trip at the gate, 45,358 and 187,056 | the sentence the phase owes: every value list re-cut (EUCLID `@TRAIL`, MORPH `@DECAY`, CHORUS `bloomSpeed`, SHUTTLE `rest`, STRIP's crossfader palette) keeps every link decodable and changes what it renders; no test can see it |
| SHARE-04 | 29 OG images, 172,699 B, rebuilt from empty, every `og:image` resolving, every image but the three declared `restsBlack` lit | no test asserts what a demo path DEPICTS (11-11); the Discord unfurl is unverifiable behind Basic Auth |

---

## What this phase could not do — nine, with the branch stated

Six unconditional rows plus three conditional rows kept (FORGE, LATTICE, LUMEN); two conditional rows
**deleted** because 11-09.1 shipped them (ARC's stop/resume, MORPH's mapping mode). Full numbers in
`deferred-items.md` section A.

1. **Clock sync** (EUCLID, SONAR, STEPS, RADAR's grouping) — blocked twice: the probe never run, and
   no inbound MIDI in the Lua host. Closes with ten minutes at a bench, then a phase.
2. **DIAL's counter-clockwise rate** — symmetric in the simulator (192 messages each way, 65 and 63);
   signed-bit hypothesis. Closes with one bench question.
3. **TRACKPAD's animation** — normalises away; 907 of 908 at worst, one free. A wave, or an honest
   never.
4. **SNAKE** — deferred by the user; 880 at the picker corner on the Timer, **28 free, not 36**.
5. **Four faders** — never tested; no verdict invented.
6. **`bloom` and `disturb`'s residue** — a shape change, unreachable from any entry.
7. **FORGE's precision** — swept, nothing arithmetic: 27 macros reachable, columns 14–15 wide, macro
   26's strip 392 against 588 / 645, **the press is final** (one keystroke, the landing column's, on a
   slide). 183 free on the Setup. Closes with a bench answer about what "precise" meant.
8. **LATTICE's "clamp it better"** — the first two clauses closed by 11-02 (0 → 2 messages on a fast
   tap); the third swept over 16,384 presses, 49 notes 36..84, every coordinate inside a cell; nothing
   to clamp. 282 free. Closes with a bench answer about what "clamp" meant.
9. **LUMEN's depth** — reaches the LEDs in emitted bytes (bottom-left `196,69,0` → `27,9,0` across
   `@DEPTH` 1..4, row 0 unmoved); the ramp is at full travel; two routes costed, neither shipped;
   nothing seen on hardware. Closes with one observation: install at index 0 and index 3, compare the
   **bottom row**.

**MORPH's three clauses, reported separately:** the stuck colours — **11-02** (class A and class B);
"if something doesn't change don't send it" — **11-08** (per-corner suppression); "mapping mode" —
**11-09.1** task 02, the user's fourth reading (a corner tap sends exactly one message). All three
closed, by three plans. **ARC's closed worry:** the preview was not lying — the note described a
feature the user wanted, and 11-09.1 built it.

**The seven missing gates** (section B): legibility; a Timer stopping silently on a zero period (plus
the host's uncleared deadline); what a demo path depicts; seven-bit sysex; `bloom`/`disturb` as a
comment not a gate; whole-travel reachability; a re-cut value list nobody notices — each with what
would close it.

**The nine dead links** (section C.1): `/c/hold/`, `/c/keys/`, `/c/learn/`, `/c/switch/`, `/c/etch/`,
`/c/gridlock/`, `/c/life/`, `/c/slam/`, `/c/table/` fall through to `404.html` on deploy. Shipped as
the honest default; reversal is a prerendered stub per id or one redirect rule at the Worker, the
second possible only because the site is on Cloudflare Workers rather than GitHub Pages.

---

## The bench-note trace — all thirty-five lines of `BENCH-2026-09-09.txt`

| Line | Note | Where it went |
| --- | --- | --- |
| 1 | ARC: amplitude needs visual feedback; centre stop/resume "not intuitive" | amplitude → **11-09** task 01 (+21, the picture tracks the emitted value); stop/resume → **11-09.1** task 01, a feature the user asked for by name — the preview was cleared of suspicion |
| 2 | AURORA: reddish glow left behind; send MIDI | glow → **11-04** (the comet-family decay lands on phase 0 in `_pad.ts` and `pad-sim.ts`); MIDI → **11-06** (xy stream, 415 of 908) |
| 3 | CHORUS: colour stuck after touching | **11-02** (class A: the computed bloom re-cut; class B: +8 fast-tap guard) |
| 4 | EUCLID: doesn't sense the finger, not precise, add by swiping, MIDI sync | decay → **11-02** (`@TRAIL` re-cut to divisors of 252); sensing and swiping → **11-08** (a swipe toggles once per cell crossed); MIDI sync → **named non-delivery 1** (clock sync) |
| 5 | HOLD: remove | **11-01**, removed |
| 6 | KEYS: remove | **11-01**, removed |
| 7 | LATTICE: not precise, make it more precise, clamp it better | precision → **11-02** (+8, 0 → 2 messages on a fast tap); clamp → **11-07** sweep, **named non-delivery 8** with numbers |
| 8 | LEARN: remove | **11-01**, removed |
| 9 | LUMEN: send HEX in sysex; depth/opacity doesn't work | sysex → **11-10** (`gmss`, 604 → 742); depth → **11-09.2** measurement, **named non-delivery 9** with the bench observation |
| 10 | MORPH: mapping mode; don't send unchanged / zero; colours stuck | **11-09.1** task 02 / **11-08** / **11-02** — three clauses, three plans |
| 11 | NINE PADS: selectable 4x4 | **11-06** (appended `count` knob, 9 / 16; the 4x4 is 30 characters cheaper). Its fast tap (0 / 2) is a separate upstream BOTOR bug, section D |
| 12 | PINWHEEL: send MIDI | **11-06** (xy stream, 477 of 908) |
| 13 | QUADRANT: it's okay | nothing to do; kept by **11-01** |
| 14 | SNAKE: not right now, with design notes | **deferred by the user**; **named non-delivery 4** (28 free on the Timer, so "one note per movement" would not fit) |
| 15 | SWITCH: remove | **11-01**, removed |
| 16 | CONSOLE: react to touch/swipe; clamp in the top row; muted faders inert | **11-07**, all three asks (the clamp was a real ceiling at 111 of 127) |
| 17 | CULL: good | nothing to do; kept by **11-01** |
| 18 | DIAL: counter-clockwise too aggressive | measured symmetric by **11-05**; **named non-delivery 2** (signed-bit hypothesis, one bench question) |
| 19 | ETCH: remove | **11-01**, removed |
| 20 | FORGE: way not precise enough | **11-07** sweep, **named non-delivery 7** with numbers; commit-on-release open for the user |
| 21 | GHOST: unreliable, redesign from scratch | **11-02** (+8 class B, the second-finger erase) then **11-11** (redesigned; `s.h=e<9` closes the code-9 latch 11-02 handed forward) |
| 22 | GRIDLOCK: remove | **11-01**, removed |
| 23 | JOYSTICK: start from the middle; more LED animation, trail | centre → **11-06** (rests lit at cell 40 from power-on); trail → **11-06** finding, **open for the user** (exclusive with the dot; look layers 603–652) |
| 24 | LIFE: remove | **11-01**, removed |
| 25 | RADAR: act like a radar, note on/off at user-placed points | **11-14**, `new-entry`: RADAR POINTS beside the untouched preset, by the user's answer; the clock-sync part of its grouping → non-delivery 1 |
| 26 | POMODORO: 1 and 5 minute | **11-09** (appended; the SHARE-03 amendment above) |
| 27 | SHUTTLE: don't understand how it works, rework | **11-12** (re-authored as a latching transport bar; `D-11-12-b` found no gate for legibility) |
| 28 | SLAM: remove | **11-01**, removed |
| 29 | SONAR: not precise; notes disappear after a while; clock sync; centre always lit | decay → **11-02** (252,250 at `glt 42`); note length and always-lit centre → **11-08**; clock sync → **named non-delivery 1** |
| 30 | STAGE: lining up breathing is missing | **11-09** task 03 (`implement breathing as planned`, the third zone state) |
| 31 | STEPS: same as SONAR or EUCLID | swipe → **11-08**; clock sync → **named non-delivery 1** |
| 32 | STRIP: two faders, crossfader at the bottom and the big one, independent | **11-13** (two controls, ten-bit y unlocked; three priced at 1,088 and left for the user) |
| 33 | STARFIELD: colour stuck; send MIDI | stuck → **11-04** (the decay in the compiler); MIDI → **11-06** (xy stream, 403 of 908) |
| 34 | TABLE: remove | **11-01**, removed |
| 35 | TRACKPAD: needs an animation on ZONA | measured by **11-05** and **11-06** (normalises away, 902 identical); **named non-delivery 3** |

Every line has a plan, a removal, a named non-delivery with numbers, or the user's own deferral. No
line closes the phase on a claim. **Four faders is not on the sheet and was never tested.**

---

## Open for the user — restated with numbers, decided by nobody here

1. **JOYSTICK's trail** — exclusive with the centre dot (comet makes the card a black square at rest,
   0 lit bytes); look-layer alternatives that keep the dot: shimmer **603**, wave **621**, swirl
   **641**, ripple **652** of 908, each moving the card to `animated`.
2. **FORGE commit-on-release** — the press is final; committing on release lets a finger correct and
   changes the feel; 183 free.
3. **LUMEN's depth** — bottom row `196,69,0` → `27,9,0` in the simulator across the knob, nothing seen
   on hardware; two routes costed (default 2 → 3 at zero characters; subtrahend and divisor 32).
4. **STRIP as two, not three** — three priced at **1,088 of 908**, 180 over; a Timer and `animated`.
5. **The `touch.ts` code-9 gap** — three options: teach `touch.ts` to coalesce (closes it, moves every
   gesture fixture); record and ship as is; assert it as a declared property.
6. **The RADAR / SONAR / RADAR POINTS overlap** — accepted twice (D-03, then `new-entry`).
7. **POMODORO's shape character** — the four sentences above; zero cost in practice, site never public.
8. SONAR's armed cells fading (11-08), EUCLID's set-rather-than-toggle swipe at −37 (11-08), CONSOLE's
   dark body cell at +9 (11-07) — three smaller ones, costed in their entry headers.
9. **The nine dead `/c/<id>/` links**, with the reversal costed above.

---

## Deviations from plan

**1. [Rule 3 — blocking] The plan's task order was executed 02-then-01 by the interrupted session,
and the resume kept the plan's commit shape.** Task 01's files were untouched at resume; task 02's
were done. Task 01 was written from scratch and committed first (`9b5f094`), then task 02 (`c5fd1cd`),
so the history reads in the plan's order.

**2. [reported] The plan's arithmetic sentences disagree with its own chain**, at `:140` (11-10 at
`+2`) and in every task and success-criterion statement of `BASE_TESTS + 40` / `+39`. Named in
`docs/TESTING.md` items 2 and 3 rather than followed; the observed total is `+41`.

**3. [reported] The plan's negative-check instruction for task 01 does not go red as written.** A
floor raised by one is green at 29 against `> 20`; both arms were run and the red arm named (item 11).

**4. [reported, not fixed] One e2e failure in the post-commit run** — `browse-webkit.e2e.ts:564` on
`webkit-phone`, 11-08.1's own title, at 1.65 GB free: the poll read a lit count, and the un-waited
re-read on the next line returned a non-number (`ninepads is lit before anything is done to it:
expected undefined to be defined`). The same family as `D-11-08.1-a` — an exact read with no wait
immediately after a poll — in a file no commit of this gate touched (`git diff --stat 721e5fa HEAD --
e2e/ src/` is empty of code: four comment-only hunks). Logged as **`D-11-16-a`** in
`deferred-items.md`; not fixed, per the scope boundary. Run 1 had passed 105 / 105 on the same code
at 6.3 GB free; run 3, started straight after run 2 at 2.2 GB free, passed 105 / 105 in 2.1 m (131 s wall). Once in three runs.

**5. [reported] The reachability wall clock in `REQUIREMENTS.md`'s TUNE-05 qualifier** was the
interrupted executor's 101.2 s; replaced by this gate's own reading (107.9 s in run 1; 140.6 s in run
2 at a third of the memory), because a number in a dated qualifier should be one its author observed.

**6. [reported] Tooling.** `roadmap update-plan-progress`, `state advance-plan`, `state
update-progress`, `state record-metric` and `requirements mark-complete` were **not run**, on the
orchestrator's instruction: the state tool has destroyed the plan's Status line in thirteen
consecutive waves, and CAT-04 must stay unticked. STATE.md and ROADMAP.md were not edited by this
plan. The defect is recorded in `deferred-items.md` section D.

No Rule 4 checkpoints were reached before task 03, which is the plan's own.

---

## `.planning/ROADMAP.md` was deliberately not edited — the row, for whoever updates it

This phase was planned under an instruction not to edit the roadmap, so its Phase 11 block's
`Requirements: TBD` and `Plans: 0` stand exactly as they were. What the block should say:

- **Requirements:** CONT-01 (amended and closed), CONT-02, CONT-03, CAT-01, CAT-03, CAT-04 (still
  Pending, deliberately), FOUND-02 (amended), PREV-01, PREV-02, PREV-06, TUNE-01, TUNE-05, SHARE-01,
  SHARE-03 (amended), SHARE-04.
- **Plans: 19 of 19 executed** — 11-01, 11-02, 11-03, 11-04, 11-05, 11-06, 11-07, 11-08, 11-08.1,
  11-09, 11-09.1, 11-09.2, 11-10, 11-11, 11-12, 11-13, 11-14, 11-15, 11-16 — with 11-16's task 03
  checkpoint open until the user answers.
- **Final counts:** catalog 29 (9 preset + 20 Lua); `test:quick` 84 / 869 + 1 todo; sweep `4 19`;
  e2e 86 source titles / 105 runs; `svelte-check` 582; `static/og/` 29 files, 172,699 B; audition 25
  rows, all unanswered; 22 enumerated vendored divergences; three requirements amended.
- **Status:** complete pending the checkpoint answer; nothing hardware-verified.

---

## Commits

| Hash | Message |
| --- | --- |
| `9b5f094` | `docs(11-16): every projection replaced by an observation, twelve wrong rows named, and the eighth header quoting the wrong corner` (task 01, plus the four source corrections the interrupted session left on disk) |
| `c5fd1cd` | `docs(11-16): three requirements amended by name and dated, twelve qualifiers, and nine audition rows that were smaller than their entries` (task 02) |
| (the commit carrying this document) | `docs(11-16): the gate summary, the third e2e run, and D-11-16-a` — this SUMMARY and `deferred-items.md`'s D-11-16-a; STATE.md and ROADMAP.md untouched |

---

## The checkpoint handed over (task 03) — not answered here

**Type:** human-verify, blocking. **Progress:** 2 of 3 tasks. The exact text is in the completion
report; in one line: the bench rows ordered by answers per minute — the MIDI probe (~10 min, a _no_
closes clock sync), DIAL (~1 min, the signed-bit question), LUMEN's bottom row (~1 min), then the
entries cheapest-first — plus the nine things the phase could not do, the nine dead links, and
install runbook row C (CLEAR's half), still open from Phase 10. **The user's answer will be recorded
verbatim by whoever continues; nothing in this document assumes one.**

## Known Stubs

None. This plan renders nothing and wires nothing; its deliverables are documents, corrections and a
record.

## Self-Check: PASSED
