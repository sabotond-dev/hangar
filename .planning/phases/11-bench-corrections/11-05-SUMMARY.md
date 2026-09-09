---
phase: 11-bench-corrections
plan: 05
subsystem: catalog
tags: [catalog, presets, vendor, gplv3, divergence, ownership, fidelity]
requires:
  - phase: 11-bench-corrections
    plan: 04
    provides: "the bloom/disturb standing rule, the post-fix declared costs (pinwheel 312, radar 445, joystick 542, faders 520), the NINEPADS fast-tap finding, and the PREV_FILES 83 / PREV_TESTS 839 / sweep 4 19 baseline"
provides:
  - "src/lib/catalog/presets.ts: HANGAR declares the nine preset VALUES over the vendored defaultState/normalisePadState, importing PadPreset, PadState and KnobKind as TYPES only - the structural blocker behind eight bench notes removed"
  - "src/lib/catalog/presets.spec.ts: four tests, INTENDED_DIVERGENCE empty, diffing all nine field by field across the union of both objects' keys and reporting the FULL field path"
  - "Six runtime reader sites across five files flipped off src/vendor; two specs repointed; two straggler guards found by the classified grep and flipped"
  - "The two fidelity fixtures and the capture script left on the vendored shelf with a written sentence each, and the vacuous-fidelity-spec negative check recorded green-and-alarming"
  - "NINEPADS's fast tap measured across eight reachable value variants including the 4x4 bench ask: 0/2 at every one, so 11-04's shape-not-constant classification survives the one wave that could have refuted it"
affects: [11-06, 11-16]
tech-stack:
  added: []
  patterns:
    - "A HANGAR-owned copy of vendored VALUES held against the vendored original by a deep field-path diff, with divergence declared rather than merely made"
    - "A test whose non-vacuous half asserts that the paragraph stating what the table COSTS is still in the file, so a wave that spends the record cannot delete the price in the same commit"
key-files:
  created:
    - src/lib/catalog/presets.ts
    - src/lib/catalog/presets.spec.ts
  modified:
    - src/lib/catalog/entries/ported.ts
    - src/lib/catalog/catalog.spec.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/pad/index.ts
    - src/lib/sim/engine.ts
    - src/lib/tune/state.ts
    - src/lib/tune/state.spec.ts
    - src/lib/tune/knobs.preset.ts
    - src/lib/tune/knobs.preset.spec.ts
    - src/lib/tune/knobs.lua.spec.ts
    - src/lib/fidelity/preset-baseline.spec.ts
    - src/lib/fidelity/golden-frames.spec.ts
    - scripts/capture-preset-baseline.mjs
key-decisions:
  - "The divergence walk covers the UNION of both objects' own keys rather than the eight fields the plan enumerates, so `cost` is held too and a re-sync that adds a tenth field to PadPreset is checked on the day it arrives rather than silently exempt. The eight are asserted as a floor."
  - "catalog.spec.ts was NOT repointed and its test was RENAMED instead: it compares ported names and sentences to the VENDORED shelf, and that comparison became a real one the moment ported.ts stopped reading the same object. Part of the read-through's effect survives, in a place where it is now evidence rather than a tautology."
  - "The plan's declared-cost table is the PRE-11-04 one and the tree does not support it. All nine costs were re-measured and all nine match the values 11-04 left; 11-04 never claimed +0 for the four the class-B fix moved."
  - "Two straggler specs were flipped that the plan does not name - tune/state.spec.ts and tune/knobs.lua.spec.ts - because each was holding a guard against a shelf its subject no longer uses."
patterns-established:
  - "When a plan says a guarantee is 'gone', check whether a second copy of it survives elsewhere and say where: here catalog.spec.ts kept the name/description half and got stronger for it"
requirements-completed: []
duration: 0h 35m
completed: 2026-09-09
---

# Phase 11 Plan 05: The Nine Taken Into Custody — Summary

**HANGAR declares the nine preset values in `src/lib/catalog/presets.ts` and reaches them through six
flipped reader sites; the two fidelity fixtures still read the vendored shelf and each now says why.
The replacement guarantee holds eight fields plus `cost` plus the whole of `state`, reports full field
paths, and lands with `INTENDED_DIVERGENCE` empty, proved by three planted negatives. Nothing under
`src/vendor/` moved: `git diff --stat HEAD -- src/vendor/` is empty and `pad-sim.ts` still hashes to
11-04's recorded digest. Four things this SUMMARY reports rather than reconciles, including a
declared-cost table in the plan that is the pre-11-04 one, and a guarantee the plan says is gone that
is not entirely gone.**

## Performance

- **Duration:** ~35 m
- **Tasks:** 2 of 2, plus one unplanned commit for the two stragglers the plan's own grep step found
- **Files:** 2 created, 13 edited
- **Commits:** `ca8b465`, `e7637eb`, `fabbfa6`

---

## Counts, as carried name plus delta

| Name           | Carried                | Declared | Observed                     | Agreement |
| -------------- | ---------------------- | -------- | ---------------------------- | --------- |
| quick files    | `PREV_FILES` 83        | **+1**   | **84**                       | agrees    |
| quick tests    | `PREV_TESTS` 839       | **+4**   | **843** (+1 todo)            | agrees    |
| e2e            | `PREV_E2E` 103         | **+0**   | **103**, **run**             | agrees    |
| sweep          | `4 19`                 | +0       | **4 19**                     | agrees    |
| `svelte-check` | `BASE_CHECK` 577       | —        | **579**, 0 ERRORS 0 WARNINGS | **+2**    |
| catalog        | 27 (9 preset + 18 Lua) | +0       | untouched, `catalog.spec.ts` 10 green | agrees |

`node scripts/check-counts.mjs 84 843` exited **0**, run **three** times: before `npm run build`, after
it, and again after the third commit. `node scripts/check-counts.mjs 4 19` on the sweep exited **0**,
twice. `node scripts/check-counts.mjs --playwright 103` exited **0**. `npm run lint` clean;
`npm run build` exit **0** twice.

**The +4 is the whole delta and it splits with nothing left over:** `presets.spec.ts` is the one new
file and it holds exactly four tests. Every other suite is flat — the `src/lib/tune/` directory ran
**11 files / 60 tests** before and after the straggler flips, and `src/lib/fidelity/` is unmoved.

**`svelte-check` is +2 and that is reported, not asserted.** 577 → 578 on `presets.ts`, 578 → 579 on
`presets.spec.ts`. Two new files, two more files checked, zero errors and zero warnings at each step.

**A temporary probe existed twice and both are gone.** `src/lib/catalog/zz-costs.spec.ts` printed the
nine cost rows below; `src/lib/sim/zz-ninepads.spec.ts` ran the eight-variant NINEPADS probe. Both were
deleted, `git status --porcelain` prints nothing, and `test-results/` was removed by hand after each
Playwright run.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified. No sibling repository was read or written.**

---

## What HANGAR now owns, and what it deliberately does not

`src/lib/catalog/presets.ts` is 268 lines. It imports **five names** from `src/vendor/botor/_pad` and
nothing else:

```
import {
  defaultState,
  normalisePadState,
  type KnobKind,
  type PadPreset,
  type PadState,
} from "../../vendor/botor/_pad";
```

Two pure helpers and three **types**. `PadPreset` and `PadState` are not restated anywhere: HANGAR owns
the nine values and never the shapes. The twenty-line private `preset()` factory at `_pad.ts:4189-4211`
is re-implemented — `defaultState()`, apply the mutator, `state.preset = id`, `normalisePadState(state)`
— so the nine states are still built by the vendored compiler's own rules.

### The nine mutators, and the comments that came with them

| Card | Mutator | Comments carried |
| --- | --- | --- |
| aurora | **empty** | `// The default state is this card.` — the only content the mutator has, so losing it would have left an empty arrow function with no explanation |
| pinwheel | 3 lines | none |
| starfield | 3 lines | none |
| radar | 5 lines | none |
| joystick | **9 lines** | three blocks: the knob-list rationale (bend/spring, colour and CC over speed), the dark-field/glow-dot paragraph, and the pitch/mod-stick paragraph that explains `springTo: "zero"` and `invertY: true` |
| ninepads | 8 lines | none — `showGrid` carries no comment upstream either, which is worth knowing because the plan cites it as one of the comments to preserve |
| faders | 9 lines | none |
| dial | 8 lines | two: the four-knob rationale, and the amber-swirl paragraph that explains the colour choice against Pinwheel's blue at zero new LED budget |
| tpad | 5 lines | none |

**One comment was hard to carry and it is named here as the plan asked.** dial's knob-list comment says
*"the preset cap is four knobs"*. That cap is not enforced in `presets.ts` and is not enforced anywhere
in HANGAR — `knobs.preset.spec.ts` asserts **three to six** knobs per card and compares deduped kind
**sets**, not counts. The sentence is carried verbatim because it records BOTOR's panel constraint at
the pinned SHA, but a reader of `presets.ts` alone would take it for a rule this repository holds, and
it is not one. Flagged rather than silently reworded.

**The plan names `showGrid` as one of the comments that "explain a choice that would otherwise look
arbitrary".** It carries no comment in the vendored source. Nothing was invented to fill the gap.

### The standing rule, in the header

11-04's rule is written into `presets.ts`'s header with its measurement rather than as a bare
prohibition: **a HANGAR-owned preset must never select `bloom` or `disturb`**, because both are the
worst cases of the class-A decay defect — measured residue up to **125 of 255** against comet's 1 to 7
— in code shaped so that repairing it is a change to the emitted **shape**, which D-02 does not grant.
None of the nine selects either. `presets.spec.ts` test 1 holds every `state` field against the vendored
shelf, so a change here that reached for one would have to be **declared in writing first** — which is
the enforcement the plan asked for, and it is mechanical rather than a comment.

---

## The classified grep, hit by hit

`grep -rn "vendor/botor/_pad" src/ scripts/` returns **52 lines**; **34** are `from "…"` import
specifiers and the rest are comments, one manifest path and one recorder constant. Every import
specifier, classified:

### (a) type or pure-helper import, or a compiler-surface import — correct, 26 sites

| File | Imports |
| --- | --- |
| `catalog/presets.ts` | `defaultState`, `normalisePadState`, 3 types — **the new module** |
| `catalog/types.ts` | `type KnobKind`, `type PadState` |
| `catalog/audition.spec.ts` | `EVENT_BUDGET` |
| `catalog/host-surface.spec.ts` | `DEFAULT_PAD_STATE`, `findTraps` |
| `catalog/lua-entries.sweep.spec.ts` | `EVENT_BUDGET` |
| `device/wire-pin.spec.ts` | `EVENT_BUDGET` |
| `fidelity/firmware-oracle.spec.ts` | `CELLS`, `defaultState`, `GRID` |
| `pad/index.ts` | `compile`/`cost`/`fit`/`fits`/`measure`/`validate` + 8 types — the compiler surface itself |
| `pad/ready.ts` | `padCompilerReady` |
| `share/stamp.ts`, `share/stamp.spec.ts`, `share/url.spec.ts`, `share/stamp-roundtrip.sweep.spec.ts` | the stamp codec and its alphabet |
| `sim/lua-host.ts`, `sim/lua-host.spec.ts` | `CELLS`, `GRID`, `DEFAULT_PAD_STATE` |
| `sim/lua-pad-sim.ts` | `DEFAULT_PAD_STATE` + types |
| `tune/knobs.preset.ts` | 6 tables + `padLightsAnything` + `quantiseColour` + 4 types — **`presetById` removed** |
| `tune/knobs.preset.spec.ts` | `BRIGHTNESS_TABLE`, `compile`, `padLightsAnything`, `quantiseColour`, `type PadState` — **`PRESETS`/`presetById` removed** |
| `tune/state.ts` | `clonePadState`, `groundPadState`, `type PadState` — **`presetById` removed** |
| `tune/state.spec.ts` | `encodeStamp` + 2 types — **`presetById` removed** |
| `tune/ladder.spec.ts`, `tune/model.ts`, `tune/model.spec.ts`, `tune/surprise.spec.ts`, `tune/view.spec.ts`, `tune/reachability.sweep.spec.ts` | compiler functions, budgets and types |

### (b) a fidelity or port-side spec — correct, and deliberately not flipped, 6 sites

| File | Imports | Why it stays |
| --- | --- | --- |
| `fidelity/preset-baseline.spec.ts` | `PRESETS`, `presetById` | The fixture is BOTOR's own compiler's output. Pointing this at HANGAR's nine makes it compare HANGAR to HANGAR. **Sentence added to its header.** |
| `fidelity/golden-frames.spec.ts` | `PRESETS`, `presetById` | The hashes were sampled from a `PadSim` over the **vendored** states. **Sentence added.** |
| `fidelity/lua-parity.spec.ts` | `PRESETS`, `type PadPreset` | Runs the vendored compiler's output in a real Lua VM against `pad-sim.ts`. The port's gate on both sides. |
| `pad/ready.spec.ts` | `presetById` + vendored `compile`/`cost` | Every assertion is against `preset-baseline.json`, which is BOTOR's fixture, so the state must be the vendored one. Its own comments say so at three sites. |
| `sim/lua-smoke.spec.ts` | `PRESETS`, `compile` | Compiles the vendored shelf into a real Lua VM. This is the device's behaviour, not the catalog's. |
| `catalog/catalog.spec.ts` | `PRESETS`, `presetById` | **See the section below.** Kept on purpose, and its test was renamed rather than repointed. |

`scripts/capture-preset-baseline.mjs` reads the **sibling's** `pad.PRESETS` and was already correct;
a sentence was added saying it must never read `src/lib/catalog/presets.ts`.

### (c) a runtime reader that should have been flipped and was not: **ZERO**

### (d) a guard reading a shelf its subject no longer uses — 2 sites, both flipped

Neither is named by the plan. Both were found by running the grep the plan required rather than by
reading the plan, and both are documented in commit `fabbfa6`:

- **`tune/state.spec.ts`** built its aurora state from the vendored shelf. Its first test asserts that
  `withChange` does not mutate what it was handed, and its own comment gives the reason: the shelf's
  state is a **shared object** and a mutation would poison **every later reader**. After task 01 those
  later readers are `state.ts`'s own, which resolve through `$lib/catalog/presets`. The guard was
  pointed at a shelf nothing under test touches. **[Rule 1 — bug.]**
- **`tune/knobs.lua.spec.ts`** iterated the vendored `PRESETS` to drive `presetKnobs()`, which resolves
  through HANGAR's shelf. Flat today, because `presets.spec.ts` test 3 pins the two id lists identical —
  and flipped anyway, because *a hand-declared list that a walk iterates can pass having read nothing*
  is this phase's own warning 3, and a walk driven by a list its subject no longer uses is that shape
  exactly. **[Rule 2 — missing correctness.]**

### The six runtime reader sites, and a count the plan states as six files

The plan's table lists six rows and **two of them are the same file**: `pad/index.ts:41`'s re-export and
`pad/index.ts:60`'s `compilePreset`. So it is **six sites across five files**, and one import line moved
both. Stated because "we flipped six" is a claim about files everywhere else in the plan.

| Site | Read | Now |
| --- | --- | --- |
| `catalog/entries/ported.ts:13` | `name`, `sentence` | `../presets` |
| `pad/index.ts` re-export | `PRESETS`, `presetById` for the rest of HANGAR | `../catalog/presets` |
| `pad/index.ts` `compilePreset` | `state` | the same import |
| `sim/engine.ts:41` | `state` for the preview | `../catalog/presets` |
| `tune/state.ts:30` | `state`, cloned per session | `../catalog/presets` |
| `tune/knobs.preset.ts:42` | `knobs` and the shipped `state` | `../catalog/presets` |

---

## What replaced the `presetById` name/description guarantee

**The short answer for 11-16 to quote.**

> Until 11-05, `entries/ported.ts` read `name` and `description` through `presetById` on the vendored
> shelf, and the read-through *was* the guarantee: a BOTOR rename could not silently disagree with the
> catalog, because the two sides were the same object. That guarantee is narrow — **two strings** — and
> it is gone the moment HANGAR owns the values. What replaces it is `src/lib/catalog/presets.spec.ts`,
> which diffs each of the nine against the vendored one across `id`, `name`, `sentence`, `category`,
> `knobs`, `exclusive`, `quiet`, `cost` **and the whole of `state`**, deeply, and fails on any
> difference not written down in `INTENDED_DIVERGENCE` with a reason, a plan id and a date. It is
> strictly stronger: a re-sync that renames a card, adds a knob kind or changes a colour still goes red
> and still names the card, and now names the **field path** as well. **The difference is that HANGAR
> now has to SAY which divergences are on purpose. The read-through needed no maintenance because it
> made disagreement impossible; this needs a row every time HANGAR changes one of the nine on purpose.
> The gain is that changing one on purpose is now possible at all.**

That paragraph is in `presets.spec.ts`'s header, and **test 2's non-vacuous half asserts it is still
there** — because a future author filling the table could otherwise delete the statement of what the
table costs in the same commit that spends it, and the record would then read as a free upgrade.

### The part of it that is NOT gone, which the plan does not account for

`catalog.spec.ts` carries a **second, independent copy** of the same comparison, and it was **not**
repointed:

```
it("agrees with the vendored shelf on every ported name and description", ...)
```

Before this plan that test was a **tautology**: `entry.name` *was* `presetById(id).name`, the same
string on both sides of a `toBe`. The moment `ported.ts` stopped reading the vendored object, it became
a real comparison — and it was observed red, under the same planted rename that reddened
`presets.spec.ts` test 1:

```
AssertionError: radar: name matches the preset: expected 'Sonar sweep' to be 'Radar'
```

So the plan's *"that read-through is gone"* is true of the **mechanism** in `ported.ts` and not true of
its **effect** on `name` and `sentence`, which survives one directory away and got stronger for the
move. The test was **renamed** rather than repointed, with a comment saying it is deliberately on the
vendored shelf and why. Reported rather than folded into the plan's sentence.

---

## The nine re-measured costs, and a table in the plan the tree does not support

Measured through `cost(compile(preset.state))` after `await padReady()` by a scratch probe, and asserted
by `presets.spec.ts` test 4 on every run since:

| preset | HANGAR declares | compiler measures | vendored declares | plan 11-05 says was measured |
| --- | --- | --- | --- | --- |
| aurora | 250 / 55 | **250 / 55** | 250 / 55 | 250 / 55 |
| pinwheel | 312 / 55 | **312 / 55** | 312 / 55 | **305** / 55 |
| starfield | 238 / 55 | **238 / 55** | 238 / 55 | 238 / 55 |
| radar | 445 / 55 | **445 / 55** | 445 / 55 | **438** / 55 |
| joystick | 542 / 24 | **542 / 24** | 542 / 24 | **535** / 24 |
| ninepads | 580 / 158 | **580 / 158** | 580 / 158 | 580 / 158 |
| faders | 520 / 24 | **520 / 24** | 520 / 24 | **513** / 24 |
| dial | 646 / 55 | **646 / 55** | 646 / 55 | 646 / 55 |
| tpad | 902 / 146 | **902 / 146** | 902 / 146 | 902 / 146 |

**All nine agree three ways.** The plan's own table is the **pre-11-04** one: it lists pinwheel 305,
radar 438, joystick 535 and faders 513, which are exactly the four figures 11-04's class-B fix moved by
+7 each and recorded as moved. The plan then says *"11-04's edit is +0, so they should still match; assert
that rather than assuming it, and if one moved, 11-04's `+0` claim was wrong and that is the finding."*
**The premise is wrong rather than the numbers.** 11-04 claimed +0 only for the class-A decay fix, and
proved it across twelve reachable `trailMs` values; it claimed and documented **+7 on four presets** for
the class-B guard fix in the same plan. Nothing moved here, nothing was silently updated, and the four
values in `presets.ts` were copied verbatim from the current vendored source, which is where the
compiler agrees with them.

---

## The four negative checks, with exit codes

| # | Task | Check | Observed | Exit |
| - | ---- | ----- | -------- | ---- |
| 1 | 01 | `preset-baseline.spec.ts` repointed at `$lib/catalog/presets` — the plan's vacuity check | **20 passed. GREEN, and that is the failure.** | **0** |
| 1b | 01 | the same vacuous spec, **plus** pinwheel's blue changed in `presets.ts` | 1 failed, and its message says the **PORT** is unfaithful and cites D-08 | **1** |
| 2 | 02 | radar renamed to "Sonar sweep" in `presets.ts` | test 1 red, naming the card, the path `name`, **both values** and "NOBODY DECLARED IT". `catalog.spec.ts` red beside it | **1** |
| 3 | 02 | dial's `look.colour.b` 0 → 9 in the mutator | test 1 red at **`state.look.colour.b`**, not at `state`. Test 4 red beside it at `dial setup: expected 647 to be 646` | **1** |
| 4 | 02 | an `INTENDED_DIVERGENCE` row for `aurora` `state.look.speed`, identical on both sides | test 2 red: *"THE TWO SIDES ARE IDENTICAL HERE, so there is no divergence left for this row to declare"* | **1** |

### Check 1, and what it teaches

**Green, 20 passed, and the spec cannot tell it has been made vacuous.** With `PRESETS` and `presetById`
imported from HANGAR instead of `src/vendor/`, `preset-baseline.spec.ts` compiles HANGAR's states with
HANGAR's vendored compiler and compares the result to BOTOR's fixture, and it reports the port faithful.
It is faithful — today, and only because HANGAR's nine are currently byte-identical to BOTOR's. **The
gate stops measuring the port and starts measuring nothing the moment 11-06 spends a single row of
`INTENDED_DIVERGENCE`.** That is why the sentence added to its header is not decoration.

**Check 1b is the sharper half, and it was run because a green negative check is the one warning this
phase repeats.** With the spec still vacuous, pinwheel's `look.colour.g` was moved 110 → 111 in
`presets.ts`. The spec went **red** — so it is not silent — but its failure message reads:

> *"pinwheel setup Lua. This preset has 5 declared intended divergence(s) … A difference that survives
> that substitution is at a site NOBODY DECLARED, and it is a STOP-and-report exactly as it always was
> (D-08)."*

That is the **wrong diagnosis stated with full confidence**. Nothing about the port changed; HANGAR
deliberately changed a catalog value, which is the thing this whole plan exists to make possible. A
vacuous fidelity gate does not go quiet — it goes red and **blames the port for a catalog decision**,
which is worse than silence because somebody will act on it. Recorded for 11-16.

Both files were restored from scratch copies with sha256 compared either side —
`preset-baseline.spec.ts` back to `643b87add573365cc4b72238d26c7b9fa2b11151b9db05fa0581c1a2776ff5e0`,
`presets.ts` back to `95ab8c6ae49d4e8622711d5d760de3dfd52a65cdc473999348190de01c13b66c`, and
`presets.spec.ts` back to `75eb475c80e786fad96f53a8b6e342df0d3c8d041eb9b3d27145208d0b8434c7`.
**`git checkout`, `git restore`, `git stash` and `git clean` were not used at any point in this plan.**

### Check 3, and a detail worth keeping

The mutator was changed to `b: 9` and the diff reported **`HANGAR has 17 where the vendored shelf has
0`**. 17, not 9, because `normalisePadState` quantises the channel through the RGB444 lattice. The diff
therefore reports the **normalised** value — the one the compiler actually sees and the one a divergence
row would have to declare — rather than the literal in the source. That is the right value to report and
it was not designed in; it falls out of diffing the built `PadPreset` rather than the mutator.

---

## The vendored tree: nothing moved

```
$ git diff --stat HEAD -- src/vendor/
(no output)

$ git diff --stat 9d06b00 HEAD -- src/vendor/          # 11-04's tip to now
(no output)

$ git diff --stat 4131ff5 HEAD -- src/vendor/          # 11-03's tip to now
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

The third block is **byte for byte 11-04's recorded output**. `pad-sim.ts` still hashes to
`2651e236ab8f2dd19c7441abeaf43584b0a3a919840f79e1ab27fee10604b39b`, the digest 11-04 recorded.
`_pad.ts` hashes to `c8f4ccb3a32638b2386e69700deac61cc60b31312fba828f834110a1f0a092d3`.

**A note on the plan's wording.** Its standing rule says *"`git diff --stat HEAD -- src/vendor/` must
match 11-04's recorded output exactly, byte for byte."* Against `HEAD` that command is **empty**, because
11-04's hunks are committed; 11-04's recorded output was taken against the **11-03 tip**. Both readings
are given above so the claim is checkable either way. Not a disagreement about the tree, only about
which base the sentence means.

`firmware-oracle.spec.ts` is green and **unedited**: `git diff --quiet 9d06b00 HEAD --
src/lib/fidelity/firmware-oracle.spec.ts` exits **0**. It was not opened.

---

## NINEPADS: measured from the one side 11-04 could not reach, and it does not move

11-04 handed this forward as a finding it could not close: a fast tap sends **0** where a slow press
sends **2**, because the zones emitter runs `if ENDED then z=nil end` and code 9 **is** an end, so the
tap resolves to no zone. 11-04's judgement was that the repair needs a change to the emitted **shape**,
which D-02 does not grant.

**11-05 is the first wave that owns the preset VALUES, so it is the first wave that could have refuted
that.** A scratch probe compiled eight reachable `ninepads` states through a real Lua VM over a blank
`PadSim` — the device's behaviour, not `pad-sim.ts`'s transcription — and ran the same fast/slow gesture
pair `lua-smoke.spec.ts` uses:

| variant | fast | slow | agree |
| --- | --- | --- | --- |
| as shipped (3x3, showGrid, each, held) | **0** | 2 | no |
| **grid 4x4 — the user's bench ask** | **0** | 2 | no |
| grid 2x2 | **0** | 2 | no |
| fingers `first` | **0** | 2 | no |
| showGrid false | **0** | 2 | no |
| phase `press` | **0** | 2 | no |
| phase `always` | **0** | 2 | no |
| touch enabled, comet | **0** | 2 | no |

**Eight for eight. No reachable value change fixes it**, and that includes the two `sends.phase`
variants, which is independent confirmation of 11-04's reading that the defect is in the zones emitter
and not in `phaseCond`. 11-04's shape-not-constant classification **survives the one wave that could
have overturned it**, and it survives by measurement rather than by being carried.

`lua-smoke.spec.ts`'s own report reads `ninepads: fast tap 0, slow tap 2` before and after this plan —
unmoved, and still the only preset in `PRESET_PARITY_ALLOWANCES` with the `differs` shape.

**Two useful by-products for 11-06.** The 4x4 grid compiles and emits a different note (44 against 3x3's
39 at the probe cell), so the bench ask *"make it selectable to 4x4"* is a reachable value change and is
**not** blocked by anything here. And it is now provable that the 4x4 ask and the fast-tap bug are
**independent**: 4x4 neither causes nor fixes the tap, so 11-06 can ship one without touching the other.

---

## Commits

| Commit | Task | What |
| --- | --- | --- |
| `ca8b465` | 11-05-01 | HANGAR declares the nine, and the port's gate stays the port's |
| `e7637eb` | 11-05-02 | everything held instead of two strings, and the divergence has to be said out loud |
| `fabbfa6` | — | two guards were holding the shelf their subject stopped using |

---

## Deviations from Plan

### Auto-fixed and auto-decided

**1. [Rule 1 — bug] `tune/state.spec.ts` was guarding the wrong shelf**

- **Found during:** Task 01's required grep classification.
- **Issue:** Its shared-object mutation guard read the vendored aurora while `state.ts`'s later readers
  moved to HANGAR's.
- **Fix:** `presetById` imported from `../catalog/presets`; the helper's error message no longer says
  "the vendored shelf".
- **Commit:** `fabbfa6`

**2. [Rule 2 — missing correctness] `tune/knobs.lua.spec.ts` iterated a list its subject no longer uses**

- **Issue:** It walks the vendored `PRESETS` to drive `presetKnobs()`, which resolves through HANGAR's
  shelf. Flat today; the shape is this phase's warning 3.
- **Fix:** flipped. No behaviour change, no count change.
- **Commit:** `fabbfa6`

**3. [design elaboration] The divergence walk covers the union of both objects' keys, not the eight
fields the plan enumerates**

- The eight are asserted as a **floor** (`REQUIRED_FIELDS`), and the walk covers everything either
  object declares — so `cost` is held too, and a re-sync that adds a tenth field to `PadPreset` is
  checked on the day it arrives rather than silently exempt. A strict superset of what the plan asks
  for, stated here rather than absorbed.

**4. [Rule 2] `catalog.spec.ts`'s test was renamed, and the plan does not name the file**

- Its title said the entries are *"read off the vendored shelf"*, which stopped being how `ported.ts`
  works. Repointing it would have thrown away a comparison that had just become real. Renamed, with a
  comment saying it is on the vendored shelf on purpose.

**5. [judgement] `pad/ready.spec.ts`, `lua-parity.spec.ts` and `lua-smoke.spec.ts` were left on the
vendored shelf and the plan names none of them**

- All three measure the port. `ready.spec.ts` in particular asserts against `preset-baseline.json`,
  BOTOR's own fixture, so its state must be BOTOR's. Classified above rather than flipped.

**6. [reported, not reconciled] Check 1b was added**

- The plan asks for one negative check on the vacuous fidelity spec and expects green. Green alone
  understates it: a second run showed the vacuous spec goes **red with the wrong diagnosis** the moment
  HANGAR changes a value, which is the behaviour 11-06 will actually meet.

No Rule 4 checkpoints were reached.

---

## What the plan asserts that the tree does not support

Four, and none was reconciled into a passing number or a quieter sentence.

### 1. The plan's declared-cost table is the pre-11-04 one, and its `+0` premise is wrong

Full table above. The plan lists pinwheel 305, radar 438, joystick 535 and faders 513 and says 11-04's
edit is `+0`; 11-04 moved exactly those four by **+7** each and said so. All nine costs re-measured, all
nine agree with the vendored declarations, nothing silently updated.

### 2. The read-through guarantee is not entirely gone

`catalog.spec.ts` holds `name` and `description` against the vendored shelf and was observed red under
the planted rename. The plan's *"that read-through is gone"* is true of the mechanism in `ported.ts` and
false of its effect, which survives one directory away and became a genuine comparison rather than a
tautology on the day this plan landed.

### 3. "Six runtime readers" is six SITES across FIVE files

`pad/index.ts` is two of the plan's six rows. One import line moved both.

### 4. `showGrid` carries no comment upstream, and dial's carried comment states a rule HANGAR does not hold

The plan names ninepads' `showGrid` among the comments that "explain a choice that would otherwise look
arbitrary". There is no such comment in the vendored source and none was invented. dial's carried
comment says *"the preset cap is four knobs"*; HANGAR's own `knobs.preset.spec.ts` asserts **three to
six** and compares deduped kind sets rather than counts, so no such cap exists here. Carried verbatim
because it records BOTOR's panel constraint, and flagged because a reader of `presets.ts` alone would
take it for a rule this repository enforces.

---

## Known Stubs

None. `INTENDED_DIVERGENCE` is empty **by the plan's own instruction and by design**, not as a
placeholder: the record is landed and proved by three planted negatives before the wave that spends it,
so nothing in 11-06 rests on the word of the plan that will fill it. The empty table carries a
non-vacuous assertion beside it — that the paragraph stating what the table costs is still in the file —
and a comment naming 11-06 as the plan that fills it, so an empty table reads as *not yet spent* rather
than *nothing to declare*.

---

## Requirements

`requirements-completed` is empty on purpose. The plan's frontmatter lists `[CONT-01, CAT-04, PREV-06,
TUNE-01]`:

- **PREV-06** and **TUNE-01** are already `[x]` and were not touched.
- **CAT-04** is `[ ]` and has been deliberately left unchecked three times, most recently by 10-14, on
  the ground that its subject is the **shape of the catalog data file**. Moving nine preset values into
  a TypeScript module under `src/lib/catalog/` is a step toward it and is not it. Not ticked.
- **CONT-01** is `[ ]` and this plan makes it **less** true, not more, for the second time: 11-03 already
  recorded that after 11-04 five of the nine do not compile to the same Lua as BOTOR, and 11-05 adds a
  second, larger surface on which HANGAR may deliberately disagree. **11-03's proposed amendment for
  11-16 should be widened** to name `src/lib/catalog/presets.spec.ts` beside the two records it already
  cites.

---

## For the waves that follow

- **11-06 owns `INTENDED_DIVERGENCE` in `src/lib/catalog/presets.spec.ts`.** Every bench change to one
  of the nine needs a row: card id, **full field path** as test 1 reports it (`state.sends.grid`, not
  `state`), **both** values as normalised, a reason that is a sentence, a plan id matching `^11-[0-9]{2}$`
  and an ISO date. A row for a field that is identical on both sides **fails**, so rows cannot be
  written ahead of the change they describe.
- **11-06: the 4x4 grid is a reachable value and compiles**, emitting note 44 where 3x3 emits 39 at the
  probe cell. It neither causes nor fixes NINEPADS's fast tap, so the two asks are independent.
- **11-06: every state change moves a declared cost.** `presets.spec.ts` test 4 re-measures all nine
  against the compiler, byte-exact — the planted colour change was caught as `647 to be 646`. Expect to
  update `cost` in `presets.ts` in the same commit as the mutator.
- **11-16, four items.** (a) The four mislabelled *"free at its worst knob position"* figures in
  `upstream-manifest.json` — pinwheel 596 for a true 591, radar 463 for 450, joystick 366 for 357,
  faders 388 for 384 — **untouched by this plan**, which rewrote none of those rows; 11-04's handover
  stands unchanged. (b) NINEPADS's fast tap, now with eight reachable value variants measured and all
  eight at 0/2, which closes the "could a value fix it" question at NO. (c) `phaseCond`'s press arm,
  carried from 11-04. (d) **New:** the vacuous-fidelity-spec failure mode from check 1b — a
  `preset-baseline.spec.ts` pointed at HANGAR's nine does not go quiet, it goes red and blames the port
  for a catalog decision.
- **CONT-01's amendment, queued by 11-03 for 11-16, should now also name `presets.spec.ts`.**
- **`PREV_FILES` 84 · `PREV_TESTS` 843 · `PREV_E2E` 103 · `BASE_CHECK` 579 · sweep `4 19` · catalog 27
  (9 preset + 18 Lua)** are what wave 6 carries forward.

---

## Self-Check: PASSED

- `src/lib/catalog/presets.ts` — FOUND, 268 lines, imports exactly five names from the vendored module,
  contains no `PRESETS` import, sha256 `95ab8c6a…`
- `src/lib/catalog/presets.spec.ts` — FOUND, contains `INTENDED_DIVERGENCE`, 4 tests, sha256 `75eb475c…`
- `src/lib/catalog/entries/ported.ts` — FOUND, imports `../presets`, header rewritten
- `src/lib/pad/index.ts`, `src/lib/sim/engine.ts`, `src/lib/tune/state.ts`,
  `src/lib/tune/knobs.preset.ts` — FOUND, all four flipped
- `src/lib/fidelity/preset-baseline.spec.ts`, `src/lib/fidelity/golden-frames.spec.ts`,
  `scripts/capture-preset-baseline.mjs` — FOUND, all three still on `src/vendor/`, each with a sentence
- `src/lib/catalog/zz-costs.spec.ts`, `src/lib/sim/zz-ninepads.spec.ts` — **absent, as required**
- Commits `ca8b465`, `e7637eb`, `fabbfa6` — all FOUND in `git log --oneline --all`
- `check-counts.mjs 84 843` exit 0 (x3); `check-counts.mjs 4 19` exit 0 (x2);
  `check-counts.mjs --playwright 103` exit 0; `npm run check` 579 files 0 ERRORS 0 WARNINGS;
  `npm run lint` clean; `npm run build` exit 0
- `git diff --stat HEAD -- src/vendor/` **empty**; `git status --porcelain` **empty**; `test-results/`
  removed; no server left running
