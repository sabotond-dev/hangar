---
phase: 12-touch-framework
plan: 01
subsystem: tune
tags: [knob, install, wire, bench, verdict, lumen, ninepads, e2e, negative-check]
requires:
  - phase: 11-bench-corrections
    plan: 16
    provides: "PREV_FILES 84 / PREV_TESTS 869 / PREV_E2E 86 titles, 105 runs / BASE_CHECK 582 / BASE_SWEEP 4 19 / catalog 29, measured on a clean tree at c5fd1cd"
  - phase: 12-touch-framework
    plan: 00
    provides: "PROBE-RESULTS-2026-09-10.md - Probe B's four distinct brightness steps on the user's ZONA, which retires the LEDs as a suspect and names the knob-to-install path as the prime one"
provides:
  - "THE VERDICT: a knob reaches the wire. LUMEN's depth 2 and depth 3 land different pairs in the tuner AND put different Setups in the module's RAM through TRY ON DEVICE - 742 characters either way, carrying `d=36-n//9*3` and `d=36-n//9*4` respectively. The browser wiring is sound and nothing was fixed here"
  - "src/lib/tune/model.spec.ts +1: LUMEN depth 0/3 and NINE PADS grid 0/1 land different pairs through the file's own recorder() and pause() on real timers, with the four landed lengths printed"
  - "e2e/install.e2e.ts +1 chromium title: a rail turned on /c/lumen/ before the click, TRY, and zona.state.configs[EVENT_SETUP] read after a positive edge - the module's RAM, not the tuner's published pair"
  - "The 550-versus-556 disagreement for NINE PADS at 4x4, recorded and handed to 12-05 unreconciled"
  - "The two bench reports handed to their owners with the verdict attached: LUMEN's to 12-11, NINE PADS' to 12-05"
affects: [12-05, 12-11, 12-03]
tech-stack:
  added: []
  patterns:
    - "A Lua entry's landing is waited on with the file's own pause() on real timers, never settle() and never a fake clock: it waits on a fresh Lua 5.4 VM and lands off a promise chain a clock advance cannot move"
    - "A withdrawal assertion is made only where a move actually happens - set() returns early when the index is already where it is asked to go, so a knob whose first test index IS its default publishes nothing"
    - "An e2e count is read after a POSITIVE EDGE that the round trip itself produces (KEEP ON DEVICE disabled with knobs-moved, then enabled again), never after a re-read of a caption that was already on screen (D-11-08.1-a)"
    - "A literal a test looks for on the wire is derived from the entry's own knob values and its Setup template, with enough leading context to be unique in the string"
    - "A negative check restores from a scratch copy compared by sha256 either side, is counted in code rather than in a comment, and its exit code is recorded"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-01-SUMMARY.md
  modified:
    - src/lib/tune/model.spec.ts
    - e2e/install.e2e.ts
key-decisions:
  - "THE VERDICT IS GREEN AT BOTH LEVELS. The tuner lands a different pair for a different knob index, and the pair TRY ON DEVICE puts in the module's RAM is the tuned one. No seam was found and nothing was fixed, so the plan's red branch was not taken"
  - "THE RAIL IS LOCATED BY THE KNOB IT BELONGS TO, not by indexing rails() with LUMEN's knobs array as the plan instructed. LUMEN's cursor knob renders as a ColourPicker, which contributes THREE range inputs and no Knob wrapper, so the nth rail is not the nth knob and the plan's instruction would have turned a colour channel"
  - "THE NEW TITLE SITS AT THE END OF THE REAL-PAGE BLOCK rather than immediately after test 12, so the file header's ordinals stay contiguous: inserting at position 8 would have split 'THE NEXT FOUR (plan 07-12)' across 7 and 9-11"
  - "openPanel, openReal and tryOnPage take the entry as a parameter defaulting to what they read from module scope before, so no existing title changes"
  - "556, not 550. presets.ts:257-263 and 12-RESEARCH.md both declare NINE PADS at 4x4 as 550; the tuner lands 556. Recorded, not reconciled - 12-05 owns it"
patterns-established:
  - "The knob-to-wire question is answered at two levels in one plan: the tuner's own callbacks in node, and the module's RAM in a browser. A green at the first with a red at the second would have been a HANGAR bug on every knob of every entry"
requirements-completed: [TUNE-02, SAFE-02, SAFE-07, PREV-02]
duration: 35min
completed: 2026-09-10
---

# Phase 12 Plan 01: The knob reaches the wire — the verdict, taken at the tuner and at the module's RAM Summary

**THE VERDICT: A KNOB TURNED IN THE BROWSER REACHES THE MODULE. The pair TRY ON DEVICE puts on the
wire after a rail is turned on `/c/lumen/` is the TUNED pair, and the bytes say so — the fake ZONA's
RAM held a 742-character Setup carrying `d=36-n//9*3` after the first click and a 742-character
Setup carrying `d=36-n//9*4` after the second, with neither carrying the other's literal. At the
tuner level the same holds for both reported entries: LUMEN `depth` 0 and 3 land 742 / 742 with
different bytes, NINE PADS `grid` 0 and 1 land 580 and 556. The wiring is SOUND, nothing was fixed
here, and the plan's red branch was not taken. So the two bench reports go to their owners: LUMEN's
"seems like nothing changed" is the row-0 anchor and the part of the pad the user compared (12-11),
NINE PADS' "make a 16 pads cause nothing changed" is a two-dot rail nobody read as a control
(12-05). Counts: `PREV_FILES 84 + 0`, `PREV_TESTS 869 + 1 = 870`; e2e `86 + 1 = 87` source titles
and `105 + 1 = 106` runs, the title chromium-only. Nothing touched a ZONA.**

## Performance

- **Duration:** about 35 min
- **Tasks:** 2 of 2
- **Files:** 0 created, 2 modified, across two commits plus this document's own

---

## The verdict, in the bytes that prove it

The phase's first question was asked before a line of the touch framework was written: **does a knob
reach the module at all?** Two of the user's bench reports have the same shape — LUMEN *"seems like
nothing changed"* after the depth knob and NINE PADS *"make a 16 pads cause nothing changed"* after
the 4x4 knob — and `PROBE-RESULTS-2026-09-10.md` had already retired the LEDs as a suspect: Probe B
on the user's own ZONA read **four distinct brightness levels** across LUMEN's four depth values,
with 27 **clearly lit** against a dark neighbour. So the LEDs render what they are sent. What had
never been tested was the wiring between the tuner and the install button.

It is sound, at both levels.

### Level 1 — the tuner (`model.spec.ts`, node, real timers)

| Entry | knob | index | landed Setup | landed Timer | bytes |
| --- | --- | --- | --- | --- | --- |
| lumen | depth | 0 | **742** | 0 | — |
| lumen | depth | 3 | **742** | 0 | **different from index 0** |
| ninepads | grid | 0 | **580** | 158 | — |
| ninepads | grid | 1 | **556** | 158 | **different from index 0** |

Four numbers, matching the planning probe exactly. LUMEN's two lengths are EQUAL because `@DEPTH` is
one character at every index — which is precisely why the test also asserts that NINE PADS' two
lengths DIFFER. A reader who takes equal lengths for equal strings would have read this table as a
knob that does nothing.

The withdrawal (D-17) is asserted on the same tick as the move, with no clock advanced, at every
move that actually happens.

### Level 2 — the module's RAM (`install.e2e.ts`, chromium, the fake ZONA)

```
LUMEN on the wire: depth 2 -> 742 characters carrying "d=36-n//9*3",
                   depth 3 -> 742 characters carrying "d=36-n//9*4", differing
```

What is read is `zona.state.configs[EVENT_SETUP]` — the Setup the last CONFIG/EXECUTE wrote into the
scripted module — and not the tuner's published pair, because reading the panel would have proved
the panel. The two RAM strings differ; the tuned one carries the turned depth literal and not the
default one; the default one carries the default literal and not the turned one. `CONFIG/EXECUTE` is
**4** (two clicks, two events each) and `PAGESTORE/EXECUTE` is **0**.

The seam this title was written to catch — `Coverflow.svelte:910` `onconfig={(config) =>
(configStrings = config)}`, the `{#key}` remount, the reset effect that clears `configStrings` on a
step, and `TryOnDevice.svelte:242-248`'s `$effect` into `install.observeConfig` — carries the pair
correctly. **No file under `src/` was modified by this plan.**

---

## What this hands to 12-05 and 12-11, by name

**12-11 owns LUMEN.** The knob works and the module receives it; the report is about what the user
looked at. `d = 36 - row*@DEPTH`, so **row 0 is `d = 36` at every value and cannot move** — that is
arithmetic, not a defect. The worst channel spread across all four values, row by row from the top,
is 0, 21, 42, 63, 85, 105, 126, 148, 169: the whole of the knob's travel is in the lower half of the
pad. Somebody watching the top of the pad while turning the knob is reporting what the pad does. The
observation that settles it on the module is Probe B's own: compare the BOTTOM row, not the pad.

**12-05 owns NINE PADS.** The knob works, the module receives it, and the Setup drops 580 to 556 —
a change a meter shows. The report is about the control's affordance: `grid` is a `count` knob with
**two** options, and a two-position rail is the least legible control on the rack. Nobody read it as
a control. That is a picker-corner and presentation question, not a wiring one.

---

## The 550-versus-556 disagreement, recorded and not reconciled

`src/lib/catalog/presets.ts:257-263` says, in a comment that is itself worth keeping:

> the requested option is the CHEAPER one: 4x4 compiles to **550** against 3x3's 580

`12-RESEARCH.md` repeats the 550. **The tuner lands 556.** 3x3's 580 is right in both documents; only
the 4x4 figure disagrees. This plan does not reconcile it — 12-05 re-measures NINE PADS at the picker
corner when it moves the default, and whichever number that measurement produces is the one that
should be written back into `presets.ts`'s comment.

---

## Deviations from the plan

### 1. [Rule 1 — Bug] The depth rail is located by its knob, not by indexing `rails()` with the entry's knobs array

The plan's task 02 step 3 says: *"Find the depth rail: `rails(page)` indexed by LUMEN's knob order —
read `lumen.ts`'s `knobs` array to find `depth`'s position rather than assuming it; the rack renders
knobs in declaration order."*

**The rack does not render one rail per knob.** LUMEN's four knobs are `cc`, `channel`, `cursor`,
`depth`, and `cursor` is a `colour` knob: `KnobRack.svelte:172-186` routes every colour knob into a
single `ColourPicker`, which renders **three** `input[type="range"]` rails of its own
(`ColourPicker.svelte:403`) and no `Knob` wrapper at all. So `depth`'s position in the knobs array is
3 and its position among the rack's range inputs is not — indexing by the knobs array would have
turned a colour channel and the test would have compared two identical Setups and reported a knob
that does not reach the wire.

**Fix:** the index handed to `turnRail` is read out of the DOM — the rail that sits inside
`[data-testid="knob-depth"]` (`Knob.svelte:303`) — and the rail's `value` is asserted at the default
index before the turn and at the turned index after it. `turnRail` and `rails` are used unchanged.

**Files modified:** `e2e/install.e2e.ts`. **Commit:** `6aed004`.

### 2. [Rule 3 — Blocking] The withdrawal cannot be asserted where no move happens

The plan's task 01 step 3 asks for the synchronous `undefined` after `tuner.set(knobId, a)` for both
entries. **NINE PADS' index `a` IS its default** (`grid` default 0), and `model.ts:806-816`'s `set()`
returns early when the index is already where it is asked to go, so that call publishes nothing and
there is nothing to withdraw. Asserting `undefined` unconditionally would have read the previous
landing and called the tuner broken for behaving correctly — the "a probe defeated by the host's own
change-gating" shape, with the input varied rather than the assertion dropped.

**Fix:** the test's `landAt()` helper tracks the position it is at and asserts the withdrawal at
every move that actually happens: LUMEN's default→0 and 0→3, and NINE PADS' 0→1. Three withdrawals,
not four, and the file's comment says why. **Commit:** `a794d26`.

### 3. [Rule 2 — Missing critical functionality] The second click is waited on against a positive edge, not a caption

The plan says to read the write count *"only after the panel reports PLAYING NOW"*. **PLAYING NOW is
already on screen from the first click** — `installState` still contains `SETTLED_CAPTION` while the
second write is in flight — so a `toContainText(SETTLED_CAPTION)` after the second click passes
immediately, before the round trip it is counting. That is exactly the D-11-08.1-a family the plan
warns about, reproduced by following the plan literally.

**Fix:** the second click is waited on against a state change the round trip itself produces. After
the rail turn, `install.observeConfig` sees a pair that is no longer `lastWritten`, so KEEP ON DEVICE
goes **disabled** with `KEEP_REASONS["knobs-moved"]`; the second RAM leg sets `lastWritten` to the
new pair and KEEP goes **enabled** again. Both edges are asserted, and `SETTLED_CAPTION` plus
`settledBody(LUMEN.name)` are asserted after them rather than instead of them.

**Files modified:** `e2e/install.e2e.ts`. **Commit:** `6aed004`.

### 4. [Rule 2 — Missing critical functionality] The new title is placed at the end of its block, not beside test 12

The plan says *"beside test 12"*. Inserted immediately after it — position 8 of 14 — the file
header's ordinal scheme breaks: *"THE NEXT FOUR (plan 07-12)"* would have described tests 7 and 9-11.
The title is instead the **last** in the real-page describe, making it the twelfth, and the header
gains one paragraph (`THE TWELFTH (plan 12-01)`) with `THE TWELFTH AND THIRTEENTH` renamed to `THE
THIRTEENTH AND FOURTEENTH`. It is still in the same block and the same shape as test 12, which is
what "beside" was asking for.

### 5. [Rule 2 — Missing critical functionality] The file header's counts moved with the file

`install.e2e.ts`'s header states its own title and run counts twice. Both are updated: *"Thirteen
tests in three blocks"* → *"Fourteen"*, and *"TEN OF THE THIRTEEN TITLES ARE UNTAGGED … thirteen
titles, sixteen runs"* → *"ELEVEN OF THE FOURTEEN … fourteen titles, seventeen runs"*, with the
one-title-one-run reason stated in the same sentence.

---

## The negative checks — four plants, four exit codes, every one reverted

Warning taken as written: **when a negative check comes back green, suspect the check.** Every plant
below was made in CODE and counted with a `grep -c` before the run (Phase 11 had three plants land in
comments and report green having broken nothing), and every one was reverted by copying back a
scratch copy and comparing `sha256sum` either side — never `git checkout`, `git restore`, `git stash`
or `git clean`.

| # | Plant | Where | Observed | Exit |
| --- | --- | --- | --- | --- |
| 1 | `set()` a no-op for `"depth"` | `model.ts:807` | red: **"lumen: the depth move published nothing at all"** | 1 |
| 2 | `moveTo` withholds `"depth"` from `indices` | `model.ts:775` | red: **"lumen: depth index 0 and index 3 landed the SAME Setup - the knob does not reach the pair (both 742 characters)"** | 1 |
| 3 | `moveTo` withholds `"grid"` from `indices` | `model.ts:775` | red: **"ninepads: grid index 0 and index 1 landed the SAME Setup … (both 580 characters)"** | 1 |
| 4 | `#ramLeg("try", this.lastWritten ?? strings)` — the second click writes the pair the first one wrote | `install.svelte.ts:848` | red on THE VERDICT assertion itself: **"the module received the same Setup at depth 2 and at depth 3 - the knob does not reach the wire (both 742 characters)"** | 1 |
| — | restored, `model.spec.ts` | — | green, 11 passed | 0 |
| — | restored, rebuilt, the e2e title | — | green | 0 |

Plant 4 is the important one: it models the exact failure the title exists to catch — the tuner
publishing correctly while the wire carries something stale — and it fires on the byte comparison
rather than on a timeout. `git diff --quiet` on both files after restore: exit 0, sha256 identical.

Checksums, both files, before the plants and after the restores:

```
model.ts          84728e9409fec6cc6e5739d1020f9c5ed2d1127866b8029f2f96353c38a55530
install.svelte.ts 4327af0cbbf897ceeaf6d4d3bb097463d5a3cb54107f6defceeecebf8aa8e6c3
```

---

## Counts, as carried names plus deltas

| Name | Carried from | Term | Observed |
| --- | --- | --- | --- |
| `PREV_FILES` | **84** (11-16) | `+0` | **84** |
| `PREV_TESTS` | **869** (11-16) | **`+1`** | **870** passed, 1 todo (reported, never asserted) |
| `BASE_SWEEP` | **`4 19`** | `+0` | **`4 19`** |
| `PREV_E2E` titles | **86** (11-16) | **`+1`** | **87** (`grep -c "test(" e2e/*.e2e.ts`, summed) |
| `PREV_E2E` runs | **105** (11-16) | **`+1`** | **106** — **87 chromium + 19 webkit-phone** |
| `BASE_CHECK` | **582** | provenance | **582 files, 0 ERRORS 0 WARNINGS** |
| catalog | **29** (9 + 20) | `+0` | 29 |

`check-counts.mjs 84 870` and `check-counts.mjs 4 19` both report *"matches the expected counts"*,
exit 0. **This plan's term in the phase chain is `+1`, exactly as 12-VALIDATION.md declares.**

**The e2e title is chromium-only and untagged.** It drives Web Serial through the page-side shim, and
the `webkit-phone` project has no engine for it. That is why the source count and the run count each
move by exactly one — the two numbers are stated separately above and neither is inferred from the
other.

**No count disagreed with 12-VALIDATION.md's carried block.** Nothing to report and nothing
reconciled.

### The suites, as run

| Command | Result |
| --- | --- |
| `npm run check` | 582 files, 0 errors, 0 warnings |
| `npm run lint` | clean (prettier + eslint) |
| `npm run test:quick` | 84 files / 870 passed / 1 todo |
| `npm run test:sweep` | 4 files / 19 passed |
| `npm run build` | clean; `postbuild` archived `source-a794d26…tar.gz`, 1662 KB |
| `npx playwright test --workers 3` | **106 passed**, 2.1 m, zero failures |

**No flake this run.** `D-11-16-a` (the remaining counter-read-before-the-round-trip instance in
`browse-webkit.e2e.ts`) did not fire; it stays open in `11-bench-corrections/deferred-items.md`.

---

## What was NOT done, and why

- **`gsd-tools roadmap update-plan-progress` was SKIPPED**, on instruction. `.planning/ROADMAP.md`
  is byte-unchanged by this plan (`git diff --quiet a794d26~1..HEAD -- .planning/ROADMAP.md`, exit 0);
  the two commits that moved it since 11-16 are `9325e09` and `a302bd1`, neither of them this
  plan's.
- **`STATE.md`'s frontmatter `percent` still reads 100** and has since Phase 10. Left alone and
  reported, as instructed.
- **Nothing under `src/vendor/` moved.** `git diff --stat HEAD -- src/vendor/` is empty, and so is
  `git diff --stat c5fd1cd..HEAD -- src/vendor/`. `firmware-oracle.spec.ts` is byte-unchanged since
  11-16's baseline and green in the quick suite.
- **No device was touched and nothing was deployed.** Every ZONA in this plan is a function in Node.
  The bench reports this plan answers came from the user's own module, and only their bench confirms
  the reading.
- **No sibling repository was read or written.**

---

## One thing the tree carries that this plan did not put there

While this plan ran, untracked `*-PLAN.md` files kept appearing under
`.planning/phases/13-gui-overhaul/` — five by 20:07 and eight by 20:14, still arriving at the final
commit — written by a concurrent Phase 13 planning session, not by this executor. They are not this
plan's and none was committed: every commit here used `git commit --only <paths>`, with the pathspec
before the message flag. They are also why `STATE.md`'s frontmatter `total_plans` moved from 128 to
147 rather than by anything this plan did; `completed_plans` 127 → 129 is 128 on disk plus this
plan's own SUMMARY, and the tools recompute both from disk rather than from a delta. The three
untracked files at the repo root (`HANGAR for ZONA.pdf`, `HANGAR-ZONA-GUI-design-specification.md`,
`hangar-logo-w.svg`) are the user's and were left alone.

---

## Commits

| Commit | What |
| --- | --- |
| `a794d26` | `test(12-01): the knob reaches the pair, on both entries the bench said had not changed` — `model.spec.ts` +1, +120 lines |
| `6aed004` | `test(12-01): the knob reaches the wire, read out of the fake ZONA's own RAM` — `install.e2e.ts` +1 title, +168 / −12 lines |

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk; both commit hashes resolve in
`git log --oneline --all`.
