---
phase: 10-redesign
plan: 12
subsystem: device
tags: [clear, install-machine, safe-01, safe-03, safe-07, a-48, a-50, a-52, a-53, write-clicks]

requires:
  - phase: 10-redesign
    plan: 11
    provides: PREV_FILES 80 / PREV_TESTS 814 / PREV_E2E 97 / BASE_CHECK 582, sweep 4 19, PREV_SWEEP_WALL 92 s
provides:
  - "src/lib/protocol/constants.ts: TOUCH_DEFAULT_SETUP (641) and TOUCH_DEFAULT_TIMER (22), read from the existing TOUCH_EVENTS through an exported defaultFor() that selects BY EVENT NUMBER and throws at module load if the touch element stops declaring one"
  - "constants.spec.ts 5 -> 7: the shape (641 / 22, printable ASCII, under CONFIG_MAX, equal to the by-number lookup, defaultFor(255) throws) and the canonicity gate (compressScript(s) === s for both, after initLuaFormatter) - the test that goes red on a datestamp pin bump"
  - "install.svelte.ts: InstallAction widened to four, `cleared` as the fifteenth phase with A-50's reasoning in the comment that declares it, WRITABLE_PHASES gaining it, clearToDefault() writing two CONFIG/EXECUTE and no PAGESTORE, and clearEnabled()/clearReason() as the one enablement rule in one place"
  - "install.spec.ts 18 -> 21: the clear proved BY CLASS, the half-landed clear that is partial and not cleared (SAFE-07), and the fifteen-row enablement partition with a source scan that fails if a sixteenth phase is added without a row"
  - "install-copy.ts: CLEAR_LABEL (5), CLEARING_LABEL (9), CLEAR_LINE (41), CLEAR_REASONS (43 / 26 / 36, two of them references rather than retyped sentences), CLEARED_CAPTION (15), CLEARED_BODY (115), LIVE_CLEARED (37), CLEAR_CAP (86) and WRITE_CLICKS"
  - "install-copy.spec.ts still 6 tests, with 9 labels / 7 builders / 7 titles / 13 utterances / 4 caps, A-52's headroom asserted rather than commented, and the three-stem scan over all eight CLEAR strings"
  - "session.spec.ts test 15's tenth needle (clearToDefault), plus the same figure corrected in the two files that restate it in prose and in install.spec.ts test 8's mirrored list"
  - "REQUIREMENTS.md SAFE-01 amended by name and dated in two clauses: three clicks to four naming WRITE_CLICKS, and eight needles to ten with the pre-existing staleness recorded"
  - "PREV_FILES 80, PREV_TESTS 819, PREV_E2E 97, BASE_CHECK 582, sweep 4 19, PREV_SWEEP_WALL 90 s - the carry-forward block for 10-13"
affects: [10-13, 10-13.1, 10-14, device, ui]

tech-stack:
  added: []
  patterns:
    - "A PAYLOAD READ FROM THE PIN IS A WIRE FACT, NOT COPY. CLEAR's two strings live in src/lib/protocol/constants.ts and reach the store through the lazily resolved HeavyModules.P, never through install-copy.ts - whose zero-import rule is what keeps the 131,101-byte protocol chunk off the first paint of `/`"
    - "SELECT BY NUMBER, NOT BY POSITION, AND MAKE THE ABSENCE LOUD. defaultFor() throws at module load rather than returning undefined, because the only thing standing between a renumbered event and a write of `undefined` to somebody's module is which lookup was used"
    - "AN ENUMERATION BY CLASS IS ASSERTED BEFORE AN ARITHMETIC. Every negative check in this plan that named the rule rather than the number did so because the assertion order was changed to put the rule first: the class set before the frame count, the WRITE_CLICKS equality before its length, the three-stem scan before the character counts"
    - "A CAP THAT DEPARTS FROM ITS FORMULA SAYS SO IN AN ASSERTION. CLEAR_CAP's second line is headroom rather than occupancy, so the spec asserts that the formula's own answer is SMALLER than the cap - a later reader who 'corrects' the cap to 43 turns that assertion red instead of quietly removing the reservation"
    - "A NUMBER IN PROSE ROTS; A CONSTANT MOVES. WRITE_CLICKS is asserted equal to the four control labels, and REQUIREMENTS.md names the constant instead of spelling the number"

key-files:
  created: []
  modified:
    - src/lib/protocol/constants.ts
    - src/lib/protocol/constants.spec.ts
    - src/lib/device/install.svelte.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/device/session.svelte.ts
    - src/lib/device/session.spec.ts
    - .planning/REQUIREMENTS.md
  deleted: []

key-decisions:
  - "The reason KEY lives in the machine and the reason STRING lives in the copy. install.spec.ts asserts clearReason() returns `no-snapshot`; install-copy.spec.ts asserts that string is 43 characters. The plan asked the machine's spec to assert 'the 43-character one', which would have pulled a literal across the boundary install-copy.ts exists to hold"
  - "ClearReason, CLEAR_REASONS and LIVE_CLEARED landed in task 01 rather than task 02. A store cannot announce a phase or name a closed reason set without them, and a task commit that does not compile is not a task commit"
  - "The busy label is CLEARING_LABEL, not CLEAR_BUSY_LABEL. The three that already exist are WRITING_LABEL, KEEPING_LABEL and PUTTING_BACK_LABEL - the house names the gerund"
  - "The canonicity gate went in constants.spec.ts beside the export it pins, not in protocol-pin.spec.ts. 10-VALIDATION lists that file among the standing gates that are green at the phase gate and not edited this phase; UI-SPEC 10.5 says protocol-pin.spec.ts asserts it, and the plan overrode that. Recorded as a disagreement below"
  - "`cleared` clears lastWritten and name, so keepReason() reads `never-tried` from it - the closed set of six answers this phase's new state without a seventh member"

patterns-established:
  - "SAFE-03 by construction: clearEnabled() is one expression and the sequencer's only guard, so 'no snapshot, no clear' is a property of the code path rather than a check somebody remembered to write"
  - "A union that grows must fail a table that did not grow with it: the fifteen-row partition cross-checks its own rows against the InstallPhase declaration parsed out of the source"

requirements-completed: [SAFE-01, SAFE-03, SAFE-07, DEGR-02]

duration: 34min
completed: 2026-09-09
---

# Phase 10 Plan 12: CLEAR, the machine and the copy — Summary

**A fourth write click that writes the firmware's own `defaultConfig` — Setup 641, Timer 22, read from the pin by event number — into RAM only, is called done only from two ACKs, refuses to run without a snapshot, and widened the never-writes proof on four fronts without denting it.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-08T23:45Z
- **Completed:** 2026-09-09T00:12Z
- **Tasks:** 2 of 2
- **Files modified:** 9

## The carried counts

| Name | Carried in | Delta | Out |
|---|---|---|---|
| `PREV_FILES` | 80 | 0 — no spec file created | **80** |
| `PREV_TESTS` | 814 | **+5** | **819** |
| `PREV_E2E` | 97 | not run — the browser walk is 10-13's | **97** |
| `BASE_CHECK` | 582 | **0** | **582 — the plan said 583, see below** |
| sweep | 4 / 19 | 0 | **4 / 19** |
| `PREV_SWEEP_WALL` | 92 s | −2 s | **90 s** |

**The +5, written out:** `install.spec.ts` 18 → **21** (+3), `constants.spec.ts` 5 → **7** (+2), `install-copy.spec.ts` **6 unchanged**, `session.spec.ts` **21 unchanged** (test 15's needles moved 9 → 10 *inside* it), `device-ui.spec.ts` **11 unchanged**, `snapshot.spec.ts` **7 unchanged**. `npm run test:quick | node scripts/check-counts.mjs 80 819` reports *matches the expected counts*.

## The compiler's exhaustiveness audit — it named nothing, and that is the finding

`InstallAction` was widened to four and `npm run check` run immediately, before any consumer was touched. **Zero errors, zero warnings, 582 files.** The compiler named **no site at all**, because nothing in the tree `switch`es over `InstallAction` — every consumer compares with `===`, and a widened union makes an equality comparison no less exhaustive. The plan expected a list and said the list *is* the audit; the honest list is empty, so here instead is the grep of every place the union is read, each of which was inspected by hand and none of which needed a change:

| Site | Shape | Verdict |
|---|---|---|
| `src/lib/ui/InstallState.svelte:96` | `install.action === "put-back" && install.leg === "store"` | unaffected — a clear has no store leg |
| `src/lib/ui/InstallState.svelte:150` | `install.action === "put-back" ? "put-back" : "try"` | **10-13's**, and it is where the clear's failure copy will be selected |
| `src/lib/ui/PutBack.svelte:82` | `writing && install.action === "put-back"` | unaffected |
| `src/lib/ui/TryOnDevice.svelte:224-225` | `=== "try"`, `=== "keep"` | unaffected |
| `src/routes/dev/install/+page.svelte:147` | renders `install.action ?? "none"` | renders `clear` for free |
| `src/lib/device/install.svelte.ts:#classify` | `action === "put-back" ? …` | **changed by hand**, to `action === "try" ? "try" : "put-back"` (A-28) |

No file outside `files_modified` needed an edit.

## The payload, measured

| Event | Raw | Compressed | Printable ASCII | Of `CONFIG_MAX` 909 |
|---|---|---|---|---|
| 0, Setup | **641** | **641** | yes | inside |
| 6, Timer | **22** | **22** | yes | inside |

Both canonical, so nothing had to be fitted and **no compiler is on the clear's path** — stated in the sequencer's own comment, because a future reader adding `await padCompilerReady()` there would hang 628 KB of WASM off the cheapest write on the site. The Timer default is `--[[@cb]]print("tick")`; the plan's live risk stands unchanged and is **not** mitigated here: the default Setup starts no timer, so it never fires on a clean module, but a module already running a HANGAR animation has a repeating timer started and will emit `print` frames up the link after a clear.

## The fifteen-row enablement table

One expression, in one place: `phase ∈ WRITABLE_PHASES && snapshot != null && capable`.

| Phase | CLEAR | Why |
|---|---|---|
| `ready` | enabled | |
| `settled` | enabled | |
| `restored` | enabled | |
| `kept` | enabled | |
| **`cleared`** | enabled | idempotent and harmless (A-50) |
| `partial` | enabled | |
| `nothing-landed` | enabled | |
| `unconfirmed` | enabled | |
| `kept-mismatch` | enabled | |
| `restored-unconfirmed` | enabled | |
| `idle` | disabled | not writable; no session |
| `snapshotting` | disabled | no snapshot yet |
| `writing` | disabled | not writable; the control renders `CLEARING…` |
| `lost` | disabled | not writable; no session |
| `snapshot-failed` | disabled | no snapshot — the write guard's verdict, arriving as a term |

Asserted as a table of fifteen rows, and cross-checked against the `InstallPhase` union parsed out of `install.svelte.ts` itself, so a sixteenth phase added without a row turns the test red rather than defaulting to disabled. With `snapshot` set to `undefined`, **all fifteen** are disabled and all fifteen report `no-snapshot`.

## Every counted string

Counted by script, not by eye (`[...s].length`), and matched against §13.3:

```
   5  CLEAR_LABEL
   9  CLEARING_LABEL
  41  CLEAR_LINE
  43  reason no-snapshot
  26  reason no-session      (PUT_BACK_NEEDS_ZONA, referenced)
  36  reason incapable       (KEEP_REASONS.incapable, referenced)
  15  CLEARED_CAPTION
 115  CLEARED_BODY
  37  LIVE_CLEARED
  96  nothing-landed after a clear   (Phase 7's PUT BACK form, reused)
sequence: 5 / 9 / 41 / 43 / 26 / 36 / 15 / 115 / 37 / 96
```

Every one matches the plan's table exactly.

## The four enumerations

| Assertion | Was | Is | Restructured? |
|---|---|---|---|
| control labels, counted by `_LABEL` suffix | 7 | **9** | no — the literal moved |
| failure builders | 7 | **7** | no |
| distinct failure titles | 7 | **7** | no |
| utterances | 12 | **13** | no — one entry added to the list the test already builds |
| character caps | 3 | **4** | no |

**None needed restructuring**, which is what the plan asked to hear: each of those assertions was already an arithmetic over the module's own exports rather than a transcription of the tree. `install-copy.spec.ts` stays at **6 tests**.

## The six negative checks

| # | Planted | Result |
|---|---|---|
| A | `cleared` set from the resolved writer promise instead of from the ACKs | **RED** — "one acknowledgement is not two: expected 'cleared' to be 'partial'" |
| B | a `PAGESTORE/EXECUTE` added to the clear sequence | **RED, naming the class** — "a clear reached a class it has no business reaching: + PAGESTORE/EXECUTE". A-26 is enforced, not intended |
| C | the defaults selected by array position (`TOUCH_EVENTS[0]`, `[1]`) | **GREEN — nothing went red**, and that is the finding. The pinned package declares `setup` at 0 and `timer` at 1, so the position happens to agree today. The position is a coincidence and the number is the contract, which is why `defaultFor` throws on a missing event instead |
| D | a `clearToDefault.bind`-shaped export on `session.svelte.ts` | **RED in two places** — `session.spec.ts` test 15 and `install.spec.ts` test 8's mirrored list |
| E | `WRITE_CLICKS` cut to length 3 | **RED, naming the missing label** — `- "CLEAR"` |
| F | `CLEAR_LINE` rewritten as `Empties the current page` | **RED** — `CLEAR_LINE says "empt" of a control that RESTORES the firmware's own configuration (A-48)`. The scan fires |

B, E and F each needed an **assertion order change** before they named the rule rather than an arithmetic — see the deviations.

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 3 - Blocking] `defaultFor` is exported, not local.**
- **Found during:** Task 01, step 1.
- **Issue:** the plan asks for "a local `defaultFor(event)`" and, four lines later, for `constants.spec.ts` to "assert `defaultFor` throws for an event the element does not declare". A local function is not reachable from the spec.
- **Fix:** exported, with a doc comment saying it is exported for the spec's negative case and that the two constants are the whole of its production use.
- **Files:** `src/lib/protocol/constants.ts` · **Commit:** 0ca5e25

**2. [Rule 3 - Blocking] `install-copy.ts` is touched by BOTH tasks.**
- **Found during:** Task 01, step 5.
- **Issue:** the plan puts `install.svelte.ts` in task 01 and `install-copy.ts` in task 02, but the store cannot announce a new phase without an utterance and cannot return a closed reason without the union that declares it. Task 01's commit would not have compiled.
- **Fix:** task 01 added exactly three things to `install-copy.ts` — `ClearReason`, `CLEAR_REASONS`, `LIVE_CLEARED` — and task 02 added the labels, the line, the cap, the block, `WRITE_CLICKS` and all the spec arithmetic. `install-copy.spec.ts` stayed green across task 01 without an edit, which is the check that the split was clean.
- **Files:** `src/lib/device/install-copy.ts` · **Commits:** 0ca5e25, d931344

**3. [Rule 2 - Convention] The busy label is `CLEARING_LABEL`, not `CLEAR_BUSY_LABEL`.**
- **Issue:** the plan's task 02 table names the export `CLEAR_BUSY_LABEL`; the three busy labels already shipped are `WRITING_LABEL`, `KEEPING_LABEL` and `PUTTING_BACK_LABEL`.
- **Fix:** followed the house convention. Both forms end in `_LABEL`, so the count of nine is unaffected. **10-13 must import `CLEARING_LABEL`.**
- **Files:** `src/lib/device/install-copy.ts` · **Commit:** d931344

**4. [Rule 2 - Correctness] The tenth needle landed in four places, not one.**
- **Issue:** the plan amends `session.spec.ts` test 15 only. But `install.spec.ts` test 8 carries a **copy** of the same list under a comment reading "test 15's needle list, run here over session.svelte.ts so the two files are checked together" — leaving it at nine would have made that comment false and the mirror weaker than the original. Two further prose statements of the figure were stale in the tree: `session.svelte.ts:104` said **eight** and `install.svelte.ts:6` said **eight** and enumerated eight items (omitting `.write(`).
- **Fix:** all four moved to ten, each with the correction dated in place. No test count moved.
- **Files:** `session.spec.ts`, `install.spec.ts`, `session.svelte.ts`, `install.svelte.ts` · **Commit:** d931344

**5. [Rule 1 - Test quality] Three assertion orders changed so a planted fault names the rule.**
- **Found during:** the negative checks. Each of B, E and F first went red on an *arithmetic* rather than on the rule the plan wanted proved: the frame count fired before the class enumeration, `WRITE_CLICKS.length` before the equality, and `chars(CLEAR_LINE) === 41` before the stem scan.
- **Fix:** the by-class enumeration now runs before the frame count; the `WRITE_CLICKS` equality before its length; the three-stem scan before the character counts. Each is commented with why it is first.
- **Files:** `install.spec.ts`, `install-copy.spec.ts` · **Commits:** 0ca5e25, d931344

**6. [Rule 3 - Boundary] The 43-character reason is asserted as a KEY in the machine's spec and as a LITERAL in the copy's.**
- **Issue:** the plan's task 01 asks `install.spec.ts` to assert "the reason is the 43-character one", which would put a copy literal — or an import of `CLEAR_REASONS` — into the spec of the module that must not depend on copy strings.
- **Fix:** `install.spec.ts` asserts `clearReason(true) === "no-snapshot"`; `install-copy.spec.ts` asserts `chars(CLEAR_REASONS["no-snapshot"]) === 43`. Between them the claim is whole and the boundary holds.
- **Files:** `install.spec.ts`, `install-copy.spec.ts` · **Commits:** 0ca5e25, d931344

### Assertions of the plan the tree does not support

**a. `BASE_CHECK` is 582, not 583.** The plan's carried-counts block says "BASE_CHECK goes to 583", but its own verification section says "no spec file is created, so `PREV_FILES` does not move" — and `svelte-check` counts files, not tests. Three separate runs (after the exports, after the union widened, after everything) all report `COMPLETED 582 FILES 0 ERRORS 0 WARNINGS`. **Reported, not adjusted.** `BASE_CHECK` carries forward as **582**.

**b. §10.5 and the plan disagree about where the canonicity gate lives.** UI-SPEC §10.5 says the raw-equals-compressed equality "is a gate rather than a note: `protocol-pin.spec.ts` asserts it". The plan forbids touching that file (10-VALIDATION lists it among the standing gates not edited this phase) and directs the assertion into `constants.spec.ts` "beside the export it pins". **The plan was followed**; the gate exists and is red-on-pin-bump either way, and §10.5's sentence about *which file* holds it is now inaccurate. No amendment number covers this one.

**c. G-06 is confirmed a no-op, exactly as A-53 says.** `install.spec.ts` test 4's assertion is **byte-identical** to what it was; only its comment changed, to say four clicks and to record why the enumeration did not need widening. The approved §10.7 text that said "the class enumeration gains CLEAR's class" was wrong and §3.2's G-06 row was right.

**d. `write-guard.ts` is in `src/lib/protocol/`**, as A-53 records, and it is **unchanged** — `git diff --stat HEAD -- src/lib/protocol/write-guard.ts` is empty. Its `canWriteBack` verdict reaches CLEAR as a *term* (a refused fetch leaves `snapshot` undefined), and the routing is asserted rather than trusted: a session whose fetch was refused reports `clearEnabled(true) === false`, `clearReason(true) === "no-snapshot"`, and a clear attempted anyway writes **zero frames of any class** and does not even read the module.

**e. SAFE-05 is NOT extended, and its `REQUIREMENTS.md` row was left exactly as Phase 7 wrote it.** The approved §4 ruling read *"Extended. CLEAR's confirmation names what is removed and what a power cycle brings back."* A-45 removed the confirmation, and the requirement should not have reached CLEAR anyway: SAFE-05's subject is the control that **stores to flash**, and CLEAR writes RAM only. Nothing was extended, so nothing is claimed. Not in `requirements-completed`.

**f. `SAFE-03`'s and `DEGR-02`'s rows were not edited either.** Only SAFE-01's row moved. No tick-mark in `REQUIREMENTS.md` was touched; the file's diff is one line.

## What this plan did NOT do (all 10-13's)

`Clear.svelte`, the `NEXT` caption, the `FACTORY DEFAULT` block's rendering, DEGR-02's present-but-disabled rendering, the e2e walk, `INSTALL-RUNBOOK.md` row C's fold, and `docs/TESTING.md:840`'s three-to-four. `docs/TESTING.md` was not opened. `PREV_E2E` was not run; `wrangler dev` was never started and no build was made.

## Known Stubs

None. Every export this plan added is reached by a test in the same commit. `CLEAR_LINE`, `CLEARED_CAPTION`, `CLEARED_BODY` and `CLEAR_REASONS` are not yet rendered by any component — that is 10-13's plan, not a stub: they are asserted against the approved contract, held against their cap and scanned for the three stems today.

## Verification

- `npm run check` → `582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run lint` → clean
- `npm run test:quick | node scripts/check-counts.mjs 80 819` → *matches the expected counts* (819 passed, 1 todo)
- `npm run test:sweep` → 4 files, 19 tests, 90 s
- `grep -n "PAGESTORE" src/lib/device/install.svelte.ts` → the only code occurrence is `storePage()` in `#storeLeg`, the keep path
- `grep -rn "empt\|removes\|clears" src/lib/device/install-copy.ts` → names no CLEAR string (the one code hit is `settledBody`'s page-change clause, Phase 4's)
- `git diff --stat HEAD -- src/vendor/ src/lib/protocol/write-guard.ts src/lib/device/snapshot.ts src/lib/protocol-pin.spec.ts src/lib/ui/Coverflow.svelte` → empty
- `snapshot.spec.ts` → 7 passed, unchanged: the record is READ by CLEAR and never written

## Self-Check: PASSED

- `src/lib/protocol/constants.ts` FOUND · exports `TOUCH_DEFAULT_SETUP`
- `src/lib/device/install.svelte.ts` FOUND · contains `"clear"`
- `src/lib/device/install-copy.ts` FOUND · contains `WRITE_CLICKS`
- commit `0ca5e25` FOUND · commit `d931344` FOUND
