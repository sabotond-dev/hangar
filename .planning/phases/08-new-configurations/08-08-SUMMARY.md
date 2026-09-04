---
phase: 08-new-configurations
plan: 08
subsystem: catalog
tags:
  [
    hardware,
    audition,
    checkpoint,
    docs,
    doc-shape-gate,
    env-guarded-writer,
    install-order,
    D-04,
    D-16,
    D-17,
    CONT-02,
  ]
requires:
  - "src/lib/catalog/ (08-01) - CATALOG, types.ts EVENT_SETUP/EVENT_TIMER, scripts/check-counts.mjs"
  - "src/lib/sim/lua-pad-sim.ts (08-03) - renderLua, the pure token substitution"
  - "src/lib/catalog/entries/ (08-04..08-06) - the seven hand-authored configurations"
  - "src/vendor/botor/_pad.ts - EVENT_BUDGET (908)"
  - "docs/SKELETON-RUNBOOK.md, docs/PIN-POLICY.md - the house style for a document a human follows"
provides:
  - "docs/HARDWARE-AUDITION.md - the twelve-row bench checklist, the install order and its reason, the pasteable-text procedure, what to record and where"
  - "src/lib/catalog/audition.spec.ts - 4 tests holding the document to the catalog, plus the AUDITION_DUMP writer"
  - ".gitignore - .tmp-audition/ beside .tmp-e2e/ and .tmp-format-parity/"
affects:
  - "The phase verification: the checkpoint is PRESENTED AND UNANSWERED - the audition has not been run"
  - "MIRROR (D-04) stays blocked until row 11 is answered on hardware"
  - "Any future entry rename or removal: audition.spec.ts test 2 or 3 goes red until the document follows"
tech-stack:
  added: []
  patterns:
    - "An env-guarded writer that does NOT fail the run, because it writes to a gitignored scratch directory and rewrites no committed fixture - the deliberate divergence from UPDATE_GOLDEN and UPDATE_SYNTHETIC, with the reasoning in a comment beside the guard"
    - "A doc-shape gate asserts the table was FOUND before asserting its shape, so a document that lost its table cannot pass by parsing to zero rows"
    - "Module-scope diagnostics go to process.stdout directly: Vitest's console interception swallows console.log emitted during collection"
key-files:
  created:
    - docs/HARDWARE-AUDITION.md
    - src/lib/catalog/audition.spec.ts
  modified:
    - .gitignore
decisions:
  - "The MIRROR row carries `MIRROR (optional)` in the Config column rather than the word optional only in the prose, so the spec's double condition (present in the document as optional, absent from CATALOG) reads a structural cell instead of a sentence."
  - "The plan's e2e acceptance criterion says BASE_E2E + 2; this plan adds no Playwright test, so the honest expectation is the unchanged baseline of 23. Verified at 23, not 25."
  - "Test 1 asserts a stated reason of more than 20 characters rather than merely non-empty. `-` is non-empty and is not a reason; the floor is what keeps a row from being busywork."
metrics:
  duration: 12 min
  tasks: 3 (2 executed, 1 checkpoint presented and unanswered)
  files: 3
  completed: 2026-09-04
---

# Phase 8 Plan 08: The Hardware Audition Summary

The seven configurations are handed over. `docs/HARDWARE-AUDITION.md` opens with the one rule that
decides whether the pad moves at all — **Timer into event 6 first, then Setup into event 0**, because
`gtt` is a no-op until the Timer event holds a stored action — gives twelve numbered rows each with a
stated reason it cannot be simulated, and points at one command that writes every configuration's
exact pasteable bytes. `src/lib/catalog/audition.spec.ts` is what stops the document rotting: a lost
row, a renamed configuration, a quietly shipped MIRROR or a dropped install-order rule each turn a
named test red, all four watched going red for the right reason.

**The audition itself has not been run.** The checkpoint was presented to the user and left
unanswered by the executor, which is what D-16 requires: the user tests on hardware personally, in
daytime, on their own module. `/gsd:verify-work` must not read this plan as a completed audition. See
[The checkpoint](#the-checkpoint-presented-unanswered).

---

## What the document is

`docs/HARDWARE-AUDITION.md`, 126 lines, Prettier-clean, GPLv3 header.

- **Before you start** — capture the module's current configuration first; this goes through BOTOR's
  shelf with minimalist mode off because HANGAR cannot install until Phase 7; the install order and
  its `gtt` reason; MORPH as the exception that proves it, because its Timer is the empty string and
  it is the one card that starts moving from the Setup alone.
- **Getting the exact text** — the one `AUDITION_DUMP` command, and why retyping a line by hand is
  how a one-character difference becomes an hour of confusion. Canonical compressed form means one
  stray space is also a budget change.
- **The seven, and what they cost** — the measured table from `08-06-SUMMARY.md`, reproduced below.
  It also says why GHOST and MORPH are black on arrival (declared `restsBlack`, not a fault), and
  records LATTICE's arithmetic: at the defaults the bottom-left cell is 36, one column right is 37, and
  one row up is **41** — a perfect fourth of five semitones. `08-RESEARCH.md` and the plan both print
  42 there. **41 is what the module plays**; the printed 42 is an off-by-one in the documents, and
  08-06 already recorded it. Writing 42 into a bench document would have sent the user hunting for a
  bug in a correct configuration.
- **The checklist** — twelve rows, below.
- **What to record** — one line per row; row 8 wants the colour actually used if it had to be raised,
  row 11 wants the answer and the observed `instr`; results go under a dated `## Results` heading in
  the same document; a failing row is a bug report against the configuration, never against the
  checklist.
- **A closing note on colour** — every RGB triple is a starting point, not a measured result: one
  layer caps at 49.6 % and there is no gamma correction anywhere in the path.

### The seven, at their defaults

| id        | name    | Setup | Timer            | knobs | dark at rest |
| --------- | ------- | ----- | ---------------- | ----- | ------------ |
| `euclid`  | EUCLID  | 702   | 218              | 6     | no           |
| `chorus`  | CHORUS  | 729   | 173              | 6     | no           |
| `arc`     | ARC     | 379   | 251              | 5     | no           |
| `ghost`   | GHOST   | 305   | 333              | 5     | yes          |
| `lattice` | LATTICE | 615   | 171              | 6     | no           |
| `morph`   | MORPH   | 507   | 0 — **no Timer** | 5     | yes          |
| `sonar`   | SONAR   | 432   | 279              | 5     | no           |

Every one of these numbers was reproduced independently by the dump (next section), from `renderLua`
rather than from this table.

### The twelve rows

| #   | Config            | The reason it belongs on a bench                       |
| --- | ----------------- | ------------------------------------------------------ |
| 1   | any               | `gtt` is a no-op until the Timer event has an action    |
| 2   | EUCLID            | Perceived polyrhythm                                   |
| 3   | EUCLID / SONAR    | Real T100 codes, including the fast-tap DOWNUP 9       |
| 4   | ARC               | `glf` is rate-only on real hardware                    |
| 5   | ARC               | Physical LED diffusion                                 |
| 6   | GHOST             | Timer drift under load                                 |
| 7   | CHORUS / LATTICE  | Whether a real finger is ever motionless               |
| 8   | LATTICE           | Brightness of `0,25,50` after the /512, no gamma       |
| 9   | MORPH             | Perception at distance                                 |
| 10  | SONAR             | Perceived motion and LED contrast                      |
| 11  | MIRROR (optional) | Firmware shows the path; nothing shows the traffic     |
| 12  | any               | The 655 s `glt` ceiling and pitfall 1, over 15 minutes |

Row 10 is SONAR, not the research's RIBBON: RIBBON was never shipped (D-04 reserves), and a row
naming an absent configuration is exactly what test 2 forbids.

---

## The dump: `AUDITION_DUMP`, and what it wrote

```
AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts
```

Exit 0 — it does not fail the run. **13 files into `.tmp-audition/`: 7 Setup, 6 Timer.** The printed
lines, verbatim:

```
AUDITION_DUMP -> C:\Users\sabot\Documents\Claude\hangar\.tmp-audition\
  euclid: setup 702/908, timer 218/908
  chorus: setup 729/908, timer 173/908
  arc: setup 379/908, timer 251/908
  ghost: setup 305/908, timer 333/908
  lattice: setup 615/908, timer 171/908
  morph: setup 507/908, no Timer
  sonar: setup 432/908, timer 279/908
```

On-disk sizes match character-for-character (no trailing newline is written — what goes into the
event is the configuration and not one character more):

| File                     | Bytes | File                    | Bytes                |
| ------------------------ | ----- | ----------------------- | -------------------- |
| `euclid.setup.lua`       | 702   | `euclid.timer.lua`      | 218                  |
| `chorus.setup.lua`       | 729   | `chorus.timer.lua`      | 173                  |
| `arc.setup.lua`          | 379   | `arc.timer.lua`         | 251                  |
| `ghost.setup.lua`        | 305   | `ghost.timer.lua`       | 333                  |
| `lattice.setup.lua`      | 615   | `lattice.timer.lua`     | 171                  |
| `morph.setup.lua`        | 507   | `morph.timer.lua`       | **absent, correctly** |
| `sonar.setup.lua`        | 432   | `sonar.timer.lua`       | 279                  |

`euclid.setup.lua` is 702 bytes and starts with the nine-character event marker `--[[@cb]]`.
`git status --porcelain .tmp-audition` prints nothing.

**`console.log` had to become `process.stdout.write`.** The dump runs at module scope, during
collection, and Vitest's console interception swallowed every line — measured: the first run wrote all
thirteen files and printed nothing at all. The counts beside the budget are the whole point of the
lines for a user at a bench, so they go to the stream directly, with the reason in a doc comment.

---

## The negative checks

Both watched red, both restored, all four exit codes recorded.

### 1. Row 7 deleted from the checklist table

```
node -e "... drop the single line matching /^\| 7 /"      -> 1 line removed
npx vitest run --project server src/lib/catalog/audition.spec.ts   -> exit 1
  Tests  2 failed | 2 passed (4)
  FAILING: keeps twelve numbered rows, each with a reason it cannot be simulated
           AssertionError: checklist rows: expected 11 to be 12
  FAILING: auditions every shipped hand-authored configuration
           AssertionError: CHORUS (chorus) ships in the catalog but no checklist row auditions it
```

Test 1 went red naming 11 where 12 were expected, exactly as the plan predicted. **Test 3 went red as
well, and that is the more interesting half:** row 7 is CHORUS's only appearance in the checklist, so
deleting it did not merely shorten a table, it silently dropped a shipped configuration from the
audition. The two layers caught the same edit for two different reasons.

```
git checkout -- docs/HARDWARE-AUDITION.md   ->  git diff --quiet exit 0
```

### 2. `SONAR` renamed to `SONNAR` on row 10

```
npx vitest run --project server src/lib/catalog/audition.spec.ts   -> exit 1
  Tests  1 failed | 3 passed (4)
  FAILING: names only real configurations, and MIRROR only as an optional row
           AssertionError: the checklist names SONNAR, which no live CATALOG entry
           claims - either the configuration was renamed or the document is stale
```

Named in the failure message, as the plan asked.

```
git checkout -- docs/HARDWARE-AUDITION.md   ->  git diff --quiet exit 0
npx vitest run --project server src/lib/catalog/audition.spec.ts   -> exit 0, 4 passed
```

**Four exit codes: 1, 0, 1, 0** — red, restored-green, red, restored-green.

---

## Observed totals

Machine: Windows 11, Node v24.14.0. Date: 2026-09-04. Baseline re-measured on the untouched tree at
`053d2f9` **before anything was written**, not inherited: `npm run test:quick` reported 42 files /
559 passed + 1 todo, identical to what `08-07-SUMMARY.md` recorded.

| Command              | Baseline (re-measured) | Observed after this plan          | Delta                |
| -------------------- | ---------------------- | --------------------------------- | -------------------- |
| `npm run test:quick` | 42 files / 559 passed  | **43 files / 563 passed + 1 todo** | **+1 file, +4 tests** |
| `npm run test:sweep` | 1 file / 9 passed      | **1 file / 9 passed**             | unchanged            |
| `npm run test:e2e`   | 23 passed              | **23 passed**                     | unchanged            |
| `npm run check`      | —                      | 456 files, **0 ERRORS**, 0 warnings | —                    |
| `npm run lint`       | —                      | exit 0                            | —                    |

Checked through the helper, never against a literal (D-17):

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 43 563          -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9             -> exit 0
cat .tmp-e2e/e2e.log | node scripts/check-counts.mjs --playwright 23    -> exit 0
grep -c "failed" .tmp-e2e/e2e.log                                       -> 0
```

The document-only commit was gated separately: after task 1, `check-counts.mjs 42 559` exited 0 —
writing a document changes no counts, as the plan says.

---

## The checkpoint: presented, unanswered

**Task 8-08-03 is a `checkpoint:human-verify` with `autonomous: false`. It was presented and it was
not answered.** No part of the audition was run, no result was fabricated, and nothing was written to
a device. The executor never touched the hardware, per D-16 and the plan's own standing rule.

The pre-checkpoint gate is green (the table above), `docs/HARDWARE-AUDITION.md` is on disk, and
`.tmp-audition/` was populated by the executor so the user finds the thirteen files already there.

**What is still unknown, and is only knowable on a bench:** every one of the twelve rows. Perceived
polyrhythm, real T100 touch codes, `glf`'s rate-only behaviour on hardware, physical LED diffusion
and the brightness of `0,25,50` after the divide-by-512, timer drift under load, whether a real finger
is ever motionless enough to trip a 2 s watchdog, whether anything strobes over fifteen minutes — and
row 11, the one answer that unblocks or permanently drops MIRROR.

When the user answers, the results go into `docs/HARDWARE-AUDITION.md` under a dated `## Results`
heading, and any failing row becomes a knob-value or colour edit in `src/lib/catalog/entries/<id>.ts`
plus a `frames.json` regeneration.

---

## Deviations from Plan

### Auto-fixed and recorded

**1. [Rule 1 - Bug] The plan's e2e acceptance criterion asks for the wrong number**

- **Found during:** Task 2, the pre-checkpoint gate
- **Issue:** the criterion reads
  `npm run test:e2e 2>&1 | node scripts/check-counts.mjs --playwright $((BASE_E2E + 2))`. This plan
  writes no Playwright test at all; the `+ 2` is carried over from 08-07, which did add two. Asserting
  25 would have failed a correct run and invited someone to invent two e2e tests to satisfy it.
- **Fix:** asserted the unchanged baseline, `--playwright 23`. Exit 0, `grep -c failed` 0. The plan's
  own `<verification>` block says "the recorded baseline plus two", so the error is in both places and
  is recorded here rather than silently corrected.
- **Files modified:** none
- **Commit:** n/a (a gate expectation, not a source change)

**2. [Rule 1 - Bug] `console.log` at module scope prints nothing under Vitest**

- **Found during:** Task 2, first `AUDITION_DUMP` run
- **Issue:** the plan specifies `console.log` for the per-entry character counts. The dump runs during
  collection, and Vitest's console interception swallowed all eight lines: the run wrote thirteen
  correct files and printed nothing. The document promises the command "prints the character count of
  each beside the 908 limit", so the document would have been false.
- **Fix:** a three-line `write()` helper over `process.stdout.write`, with the measurement and the
  reason in its doc comment.
- **Files modified:** `src/lib/catalog/audition.spec.ts`
- **Commit:** `9ff2e6c`

**3. [Rule 2 - Missing critical functionality] The MIRROR row carries `(optional)` in the Config cell**

- **Found during:** Task 1, the acceptance greps
- **Issue:** the document said "**Optional —**" in the *What to check* column, so a case-sensitive
  `grep -q "optional"` — the plan's own acceptance criterion — found nothing, and the spec's double
  condition would have had to read a sentence rather than a cell.
- **Fix:** the Config cell reads `MIRROR (optional)`. `namesIn` takes the leading upper-case run of
  each `/`-separated part, so the parenthetical costs the parser nothing and the optional-ness is now
  structural.
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `58102e9`

**4. [Rule 2 - Missing critical functionality] A stated reason must be longer than 20 characters**

- **Found during:** Task 2, writing test 1
- **Issue:** the plan asks that "every row's final column is non-empty". `-` is non-empty. The
  assertion exists to keep busywork rows out, and an emptiness check does not do that.
- **Fix:** `MIN_REASON = 20`, applied to both the *What to check* and the *Why it cannot be simulated*
  columns, with the reasoning in a comment.
- **Files modified:** `src/lib/catalog/audition.spec.ts`
- **Commit:** `9ff2e6c`

### Observations, not deviations

- **Row 10 is SONAR, not RIBBON.** `08-RESEARCH.md`'s row 10 audits RIBBON, which D-04 kept as a
  reserve and which was never authored. The plan already substitutes SONAR; recorded because the
  research and the shipped document differ on that row and test 2 is why they must.
- **LATTICE's third note is 41, not 42.** Both `08-RESEARCH.md` and this plan's prose print 42;
  08-06 measured 41 and the arithmetic (a perfect fourth is five semitones) agrees. The bench document
  says 41 and says why, so the user does not chase a bug that is not there.
- **The tree is shared.** `.planning/phases/05-.../05-UI-SPEC.md` appeared untracked mid-plan from
  another session, and a researcher's `.tmp-probe/` was present at plan start. Neither was staged,
  deleted or touched; every commit here stages explicit paths.

### Authentication gates

None. This plan deploys nothing, and — by design — talks to no device.

---

## Verification

| Check                                                                             | Result                        |
| --------------------------------------------------------------------------------- | ----------------------------- |
| `npx prettier --check docs/HARDWARE-AUDITION.md`                                  | exit 0                        |
| `grep -q ".tmp-audition/" .gitignore`, `git check-ignore -q .tmp-audition/x`      | both exit 0                   |
| `grep -q "event 6"` / `grep -q "gtt"` on the document                             | both exit 0                   |
| all seven names present in the document (node one-liner)                          | exit 0                        |
| `grep -q "MIRROR"` and `grep -q "optional"`                                       | both exit 0                   |
| `grep -q "AUDITION_DUMP"`                                                          | exit 0                        |
| `npx vitest run --project server src/lib/catalog/audition.spec.ts`                | **4 passed**                  |
| `grep -c "  it(" src/lib/catalog/audition.spec.ts`                                | **4**                         |
| `grep -q "EVENT_TIMER" src/lib/catalog/audition.spec.ts`                          | exit 0                        |
| `AUDITION_DUMP=1 ...` exit code                                                   | **0** (does not fail by design) |
| `ls .tmp-audition/*.setup.lua \| wc -l`                                            | **7**                         |
| `ls .tmp-audition/morph.timer.lua \| wc -l`                                        | **0**                         |
| `euclid.setup.lua` length 702 and `--[[@cb]]` prefix                              | exit 0                        |
| `git status --porcelain .tmp-audition`                                            | empty                         |
| `npm run test:quick` vs `check-counts.mjs 43 563`                                 | exit 0                        |
| `npm run test:sweep` vs `check-counts.mjs 1 9`                                    | exit 0                        |
| `test:e2e` vs `check-counts.mjs --playwright 23`, `grep -c failed`                | exit 0, 0                     |
| `npm run check`                                                                    | 456 files, **0 ERRORS**       |
| `npm run lint`                                                                     | exit 0                        |
| `git diff --stat HEAD -- src/vendor/`                                             | empty                         |
| both negative checks red then reverted, four exit codes recorded                  | 1, 0, 1, 0                    |
| port 4173 free afterwards; no `workerd` / `wrangler` process left                 | confirmed                     |
| the checkpoint answered by the executor                                           | **no — presented, unanswered** |

---

## Commits

| Commit    | Message                                                              |
| --------- | -------------------------------------------------------------------- |
| `58102e9` | `docs(08-08): the twelve-row ZONA hardware audition checklist`       |
| `9ff2e6c` | `test(08-08): the audition doc-shape gate and the pasteable-text dump` |

---

## For whoever reads this next

- **The audition is pending the user's daytime run.** This plan is complete; the audition is not, and
  nothing in this SUMMARY should be read as a hardware result. Phase 8's machine-checkable work is
  done and green.
- **MIRROR is still blocked** (D-04). Row 11 is the only thing that can unblock it, and it is
  explicitly optional — the phase does not wait on it.
- **If an entry is renamed, added or removed**, `docs/HARDWARE-AUDITION.md` must follow in the same
  commit: test 2 goes red for a name the catalog no longer claims, test 3 for a shipped entry the
  checklist does not audition.

---

## Self-Check: PASSED

All three files named in this SUMMARY exist on disk (`docs/HARDWARE-AUDITION.md`,
`src/lib/catalog/audition.spec.ts`, this file) and both commits (`58102e9`, `9ff2e6c`) exist in
`git log`. Nothing missing. The one number corrected on re-check was the document line count:
126, not the 128 first written.
