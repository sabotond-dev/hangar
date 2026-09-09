---
phase: 11-bench-corrections
plan: 04
subsystem: fidelity
tags: [vendor, gplv3, manifest, fidelity, divergence, codegen, firmware, lua]
requires:
  - phase: 11-bench-corrections
    plan: 03
    provides: "the intendedDivergence record on all six vendored files, landed empty, and the PREV_FILES 83 / PREV_TESTS 838 / sweep 4 19 baseline"
provides:
  - "The comet family lands on phase 0: (256 - rate) * ticks emitted as the decay start in the compiler and in the simulator alike, +0 characters at every one of twelve reachable trailMs values"
  - "The coalesced fast tap (firmware event code 9) admitted at LIVE and at phaseCond's held arm, +7 each, measured across all nine compiled presets before and after"
  - "upstream-manifest.json at twenty-two intendedDivergence rows across four vendored files - D-02's record, spent and no longer empty"
  - "lua-smoke.spec.ts +1: fast-tap parity over the nine COMPILED presets, with four silent and one differing preset declared rather than skipped"
  - "The D-02 boundary proved mechanically: firmware-oracle.spec.ts green and unedited, and observed red on a planted phase-walk clamp"
affects: [11-05, 11-16]
tech-stack:
  added: []
  patterns:
    - "A vendored fix proved by inverting the change in the EMITTED artefact rather than in the source tree, with the replacement count asserted so a zero-hit run cannot pass as a measurement"
    - "A declared-exception table with a SHAPE per row (silent / differs), each shape asserted, so an allowance that stops being true goes red instead of going quiet"
key-files:
  created: []
  modified:
    - src/vendor/botor/_pad.ts
    - src/vendor/botor/pad-sim.ts
    - src/vendor/botor/tests/pad.test.js
    - src/vendor/botor/tests/pad-sim.test.js
    - src/lib/fidelity/upstream-manifest.json
    - src/lib/fidelity/preset-baseline.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
key-decisions:
  - "ENDED is CORRECT as written and was NOT changed at any of its ten sites, which CONTRADICTS the plan. Code 9 IS an end; every ENDED site is a release path, and the plan's fix would have left all ten armed forever"
  - "The tpad trap is therefore avoided BY CONSTRUCTION rather than by the exclusion-by-name the plan mandated. tpad reaches neither changed site and its bytes did not move"
  - "phaseCond's PRESS arm carries the same defect and was deliberately left alone: no reachable HANGAR state compiles it, and an unreachable divergence is a cost a GPLv3 record should not carry"
  - "golden-frames.json and frames.json were NOT regenerated, because they do not move: both samplers construct a PadSim and run ticks with no touch input at all, so no comet layer is ever painted"
  - "NINEPADS's fast tap is a FINDING, not a fix: the correct behaviour needs a change to the emitted SHAPE, which D-02 does not grant"
patterns-established:
  - "When a brief prescribes a fix and an exclusion, check whether the exclusion is a symptom of the fix being wrong: here the tpad carve-out disappeared the moment the guard was fixed at the right constant"
requirements-completed: []
duration: 0h 40m
completed: 2026-09-09
---

# Phase 11 Plan 04: The Permission Spent — Summary

**The comet trail lands on phase 0 in the compiler and in the simulator alike, at +0 characters at
every one of twelve reachable `trailMs` values, and the coalesced fast tap is admitted at two guards
for +7 each. D-02's record is no longer empty: twenty-two `intendedDivergence` rows across four
vendored files, each matching exactly once, with the reconstructed bytes still hashing to upstream.
The plan told this wave to fix `ENDED` and exclude `tpad` by name; `ENDED` is correct as written and
was not touched, and `tpad` needed no exclusion. Four things the plan asserts the tree does not
support, and one figure in the record that disagrees with the sweep and was NOT adjusted.**

## Performance

- **Duration:** ~40 m across two sessions (this one resumed an interrupted execution)
- **Tasks:** 3 of 3 — task 03 discharged by observation rather than by regeneration, see below
- **Files:** 0 created, **7 edited** (the plan declared 8; `golden-frames.json` and `frames.json` do
  not move, and `src/lib/catalog/frames.json` was therefore never opened)
- **Commits:** `7faa93c`, `a80854b`

---

## Counts, as carried name plus delta

| Name           | Carried             | Declared | Observed                     | Agreement |
| -------------- | ------------------- | -------- | ---------------------------- | --------- |
| quick files    | `PREV_FILES` 83     | **+0**   | **83**                       | agrees    |
| quick tests    | `PREV_TESTS` 838    | **+1**   | **839** (+1 todo)            | agrees    |
| sweep          | `4 19`              | +0       | **4 19**, over budget **0**  | agrees    |
| `svelte-check` | `BASE_CHECK` 577    | —        | **577**, 0 ERRORS 0 WARNINGS | agrees    |
| catalog        | 27 (9 preset + 18 Lua) | +0    | **27**                       | untouched |

`node scripts/check-counts.mjs 83 839` exited **0**, run twice — once before `npm run build` and once
after. `node scripts/check-counts.mjs 4 19` on the sweep exited **0**. `npm run lint` clean;
`npm run build` exit **0**.

**The +1 is the whole delta and it splits with nothing left over:** `lua-smoke.spec.ts` gained one
test, *"sends the same on a fast tap as on a slow one, on the nine COMPILED presets"*. Every other
suite is flat. The three fidelity specs named in the plan's verification ran together at **42 passed**:
`vendored-diff.spec.ts` 15, `preset-baseline.spec.ts` 20, `firmware-oracle.spec.ts` 7 plus its 1 todo.

**A temporary measurement harness was deleted before the plan ended, and it is the reason a
mid-execution run of this suite read 84 / 840.** `src/lib/sim/zz-measure.spec.ts` held exactly one
test. It is gone; the tree is clean and `git status --short` prints nothing.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified.** Every number below comes from the simulator, from a real Lua VM, or from firmware
C re-derived by the oracle. **No sibling repository was read or written.**

---

## Class A: the comet decay, seven sites, +0 characters

### The seven sites, every line number verified before it was edited

The plan said *"verify every line number before editing it. A number that has moved is a finding."*
**None had moved.** As found:

| File | Site, as found | Site, now | What |
| --- | --- | --- | --- |
| `_pad.ts` | **1204** | 1225 | `case "comet"` |
| `_pad.ts` | **1223** | 1244 | `case "perFinger"` |
| `_pad.ts` | **2064** | 2102 | the spring re-park comet, inside `sendsPaint`'s joystick path |
| `pad-sim.ts` | **987** | 992 | the simulator's comet |
| `pad-sim.ts` | **1002** | 1007 | the simulator's perFinger |
| `pad-sim.ts` | **1227** | 1239 | the simulator's spring re-park |
| `tests/pad.test.js` | the `glpfs(a,1,255,250,0)` literal | 3221 | a vendored test, under the manifest |

The "now" column moves only because the edits carry explanatory comments; the sites themselves are
where the plan said they were.

### +0 characters, re-derived here rather than read off the plan's table

The plan supplied a twelve-row table and said to verify it per site rather than trust it. Recomputed
from `DECAY_TABLE` as it stands in the tree:

| ms | rate | ticks | step | start = `step*ticks` | digits | was | delta | freeze before | freeze after |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 210 | 244 | 21 | 12 | 252 | 3 | 3 | **0** | 3 | **0** |
| 230 | 245 | 23 | 11 | 253 | 3 | 3 | **0** | 2 | **0** |
| 250 | 246 | 25 | 10 | 250 | 3 | 3 | **0** | 5 | **0** |
| 280 | 247 | 28 | 9 | 252 | 3 | 3 | **0** | 3 | **0** |
| 310 | 248 | 31 | 8 | 248 | 3 | 3 | **0** | 7 | **0** |
| 360 | 249 | 36 | 7 | 252 | 3 | 3 | **0** | 3 | **0** |
| 420 | 250 | 42 | 6 | 252 | 3 | 3 | **0** | 3 | **0** |
| 500 | 251 | 50 | 5 | 250 | 3 | 3 | **0** | 5 | **0** |
| 630 | 252 | 63 | 4 | 252 | 3 | 3 | **0** | 3 | **0** |
| 840 | 253 | 84 | 3 | 252 | 3 | 3 | **0** | 3 | **0** |
| 1270 | 254 | 127 | 2 | 254 | 3 | 3 | **0** | 1 | **0** |
| 2540 | 255 | 254 | 1 | 254 | 3 | 3 | **0** | 1 | **0** |

**Twelve reachable `trailMs` values, twelve three-digit starts, maximum character delta 0.** The
freeze column is the point: every cell a finger crossed used to stop at 1 to 7 of 255 and stay there.
It now stops at 0. That is AURORA's *"redish glow behind even when it disappeared"* and STARFIELD's
*"color stucks again"*, and it was one expression.

`DECAY_TABLE` itself is **not** edited, for the reason the plan derived: 255 = 3 x 5 x 17 admits only
steps 1, 3, 5, 15, 17, 51, 85 and 255, and the table's steps are 1..12, so no choice of ticks makes
`step * ticks` equal 255 for every row. The start had to move.

**Both files moved together**, because `_pad.ts` compiles for the device and `pad-sim.ts` renders the
preview, and a compiler-only fix would have shown a stuck cell in the browser where the device now
goes dark — the same fidelity loss D-02 forbids, arrived at from the other side.

### `bloom` and `disturb` untouched, with the standing rule handed to 11-05

Neither was changed, and the reason lives in the manifest's reason fields rather than as extra hunks
in the vendored file — **that choice was made to keep the hunk count at seven**, and it is stated here
because the plan asked which of the two options was taken. Both are worse cases of the same defect
(residue up to **125** against comet's 1 to 7), and both would need a **shape** change — a per-cell
timeout derived from a per-cell start — rather than a constant change. D-02 permits the emitted
constants to move; it does not obviously permit the emitted shape to.

And it is unreachable in any case: **no preset selects `bloom` or `disturb`, and `touch.kind` is not
exposed as a knob on any of the nine**, so no catalog entry at any knob position can reach either.

> **Standing rule for 11-05: a HANGAR-owned preset must never select `bloom` or `disturb`.**

---

## Class B: the compiled fast tap, measured across the nine before anything changed

Firmware coalesces a sub-cycle press-and-lift into **one** message with event code **9**. The research
counted fast-tap MIDI for all twenty-seven hand-authored Lua entries and for **none** of the nine
presets. This is the first time anyone looked.

### The table, before and after

Both columns are the same probe: `compile(preset.state)` run in a real Lua VM over a blank,
fully user-owned `PadSim` — the **device's** behaviour, not `pad-sim.ts`'s transcription of it. A fast
tap is one `touchTap`; a slow one is `touchDown`, six ticks, `touchUp`. "wire" counts MIDI plus HID.
"L1" is the touch layer's `pha/fre/timeout` two ticks after the gesture.

| preset | wire before (fast/slow) | before | wire after (fast/slow) | after | L1 fast before | L1 fast after |
| --- | --- | --- | --- | --- | --- | --- |
| aurora | 0 / 0 | AGREE | 0 / 0 | AGREE | 204/250/34 | 204/250/34 |
| **pinwheel** | 0 / 0 | AGREE | 0 / 0 | AGREE | **0/0/0** | **204/250/34** |
| starfield | 0 / 0 | AGREE | 0 / 0 | AGREE | 204/250/34 | 204/250/34 |
| **radar** | **0 / 2** | **DIFFER** | **2 / 2** | **AGREE** | 204/250/34 | 204/250/34 |
| **joystick** | **2 / 4** | **DIFFER** | **4 / 4** | **AGREE** | 0/0/0 | 0/0/0 |
| **ninepads** | **0 / 2** | **DIFFER** | **0 / 2** | **DIFFER** | 255/0/0 | 255/0/0 |
| **faders** | **0 / 1** | **DIFFER** | **1 / 1** | **AGREE** | 0/0/0 | 0/0/0 |
| dial | 0 / 0 | AGREE | 0 / 0 | AGREE | 204/250/34 | 204/250/34 |
| **tpad** | 6 / 6 | **AGREE** | 6 / 6 | **AGREE** | 0/0/0 | 0/0/0 |

**The BEFORE column was re-derived in this session rather than carried from the interrupted
executor's notes**, and it was derived **without editing the tree**: a scratch probe inverted the two
guards in the **emitted, minified Lua** — which carries no comments at all, so there is nothing but
code for a replacement to hit — and **asserted the replacement count at every preset**. Wave 2 of this
phase lost three attempts to a `String.replace` that patched a comment instead of the Lua, so a
green negative check with zero replacements is exactly the failure mode to guard against. Observed:
LIVE undone once at pinwheel, HELD undone once each at radar, joystick and faders, zero elsewhere —
which is precisely the four presets whose declared costs moved. The scratch probe was deleted.

**One number in the record reads differently from this measurement, and it is not an error.** The
manifest, `preset-baseline.spec.ts` and `lua-smoke.spec.ts` all cite PINWHEEL's slow press as
**207/250/34**; this session measures **204/250/34**. Both are correct. 207 = 255 - 8x6 is the reading
in a tree where task 01's decay fix had not yet landed and the start was still the literal 255;
204 = 252 - 8x6 is the reading now that the start is `step*ticks`. The claim the number supports —
**0/0/0 against a live decaying record**, a trail that did not exist against one that does — is
unaffected. Nothing was adjusted.

### What changed, and what deliberately did not

**The plan told this wave to fix `ENDED` and to exclude `tpad` by name. `ENDED` is correct as
written and was not changed at any of its ten interpolation sites.**

Code 9 **is** an end — a press and a lift in one message — and every `ENDED` site is a **release**
path: clearing a claimed finger slot, dropping a dial baseline, re-parking a spring, ending a
trackpad contact. Making `ENDED` false for 9 would leave all ten armed forever. The plan noticed this
for exactly one of the ten (`tpad:2241`) and responded by carving that site out; the general case is
that the carve-out was a symptom of the fix being aimed at the wrong constant.

What a fast tap actually loses is the **press** half, and that lives in `LIVE` and in `phaseCond`:

| Site | Before | After | Cost | Reached by |
| --- | --- | --- | --- | --- |
| `_pad.ts` `LIVE` | `e~=3 and e<5` | `e~=3 and e<5 or e>8` | **+7** | pinwheel |
| `_pad.ts` `phaseCond`, **held** arm | `e==1 or e==4` | `e==1 or e==4 or e>8` | **+7** | radar, joystick, faders |
| `_pad.ts` `ENDED` | `e==3 or e>=5` | **unchanged** | 0 | ten sites |
| `_pad.ts` `phaseCond`, **press** arm | `e==4` | **unchanged** | 0 | nothing reachable |
| `pad-sim.ts` `live()` | `e!==3 && e<5` | `(e!==3 && e<5) \|\| e>=EVT_TAP` | — | the preview's mirror |
| `pad-sim.ts` `phasePass()` held | `e===MOVE \|\| e===DOWN` | `\|\| e>=EVT_TAP` | — | the preview's mirror |

`LIVE` is edited **in place** rather than shadowed by a second constant, which is the other place this
wave departs from the brief. The plan called for a second named constant so the trackpad site could
keep the old text — but with `ENDED` unchanged there is no site that needs the old text, and `LIVE`
has **exactly one** interpolation site, so a new constant would have had one user and left a dead
original beside it in a GPLv3 record.

**`e~=3 and e<5 or e>8` relies on Lua binding `and` tighter than `or`**, parsing as
`(e~=3 and e<5) or (e>8)`. That is 7 characters where the bracketed form is 9, and **the two forms
were run through the real Lua host and confirmed identical before the shorter was chosen.** A
precedence assumption was worth one measurement, as the plan required.

**The PRESS arm carries the same defect and was deliberately left alone.** `sends.phase` is not a
HANGAR knob and all nine presets are `"held"`, so no state a visitor can reach compiles it. Changing
it would have put a divergence in the D-02 record that nothing in the catalog exercises. It is a real
BOTOR bug and it belongs upstream (D-08), recorded here for 11-16.

### `tpad`: excluded by construction, so the exclusion was never needed

The plan gave two independent reasons to exclude `tpad` by name, and asked for both to be stated
separately. Both are true, and **neither had to be spent**:

1. **It already handles code 9 correctly, by structure.** `:2241` reads `local c,t=s.p[i],${ENDED}`
   and the next line is `if e==4 or e>7 or not c and not t then`, which routes 9 through the **onset**
   branch, and `if t then` closes the contact in the same pass. The plan's `ENDED` fix would have
   started a trackpad contact **that never ends** — a stuck pointer.
2. **It could not have afforded it.** tpad's compiled Setup is **902 of 908** at defaults, six
   characters free, and **907 of 908 at its worst reachable knob position, one character free** —
   observed in the sweep, not estimated. `+8` is over budget at defaults (910) and over budget at the
   worst position (915). *A reader who sees only the budget reason will think the fix becomes
   affordable at a bigger budget. It does not: reason 1 is a correctness bar, not a cost bar.*

**Because `ENDED` was not changed, `tpad` reaches neither modified site and none of its bytes moved.**
Its declared cost is untouched at `{ setup: 902, timer: 146 }`, and it is **not** in
`PRESET_PARITY_ALLOWANCES` — the new test asserts that it is not, on the grounds that an allowance for
a preset that needs none is a standing amnesty. Its fast tap and its slow tap agree at 6 / 6 with no
row at all. **This is the strongest single line in the plan's whole class-B half and it is the
opposite of what the plan predicted.**

### NINEPADS is a finding, not a fix

**Measured before and after: a fast tap sends 0 where a slow one sends 2** (note-on then note-off).
The change did not move it and was not meant to. The zones emitter computes the zone and then runs
`if ENDED then z=nil end` — and code 9 **is** an end — so the tap resolves to no zone, `o~=z` is
false, and neither message is sent.

**Making `ENDED` false for 9 would send the note-on and never the note-off. That is a stuck note:
strictly worse than silence.** The correct behaviour is note-on **and** note-off in the same callback,
which needs a change to the emitted **shape** rather than to an emitted constant — and D-02 grants
constants, not shape. Left as a BOTOR bug (D-08), declared in `PRESET_PARITY_ALLOWANCES` with the
`differs` shape asserted, and recorded here for **11-16**.

### The declared costs that moved, and the four that did not

| preset | before | after | delta | why |
| --- | --- | --- | --- | --- |
| pinwheel | 305 | **312** | +7 | LIVE |
| radar | 438 | **445** | +7 | phaseCond held |
| joystick | 535 | **542** | +7 | phaseCond held |
| faders | 513 | **520** | +7 | phaseCond held |
| aurora, starfield, dial | 250, 238, 646 | unchanged | 0 | comet-family only, and that fix is +0 |
| ninepads | 580 | unchanged | 0 | reaches neither site |
| tpad | 902 | unchanged | 0 | reaches neither site |

`tests/pad.test.js`'s *"holds every preset to its declared cost"* asserts these **byte-exact** rather
than as an upper bound, which is exactly what makes them a gate rather than a comment.

**No preset was trimmed to make room, and no site was found that was wrong and unaffordable.** The
sweep reports **over budget 0** across 1,296 combinations, worst 906 of 908.

---

## The record: `git diff --stat` beside the manifest's rows

The whole of plan 11-04 against the 11-03 tip:

```
 src/vendor/botor/_pad.ts               | 70 ++++++++++++++++++++++++++--------
 src/vendor/botor/pad-sim.ts            | 29 ++++++++++----
 src/vendor/botor/tests/pad-sim.test.js | 19 +++++----
 src/vendor/botor/tests/pad.test.js     |  7 +++-
 4 files changed, 92 insertions(+), 33 deletions(-)
```

And the manifest, counted from the file rather than from the plan:

| file | `intendedDivergence` rows | of which plan 11-04 | exactly-once violations |
| --- | --- | --- | --- |
| `src/vendor/botor/_pad.ts` | 10 | 10 | **0** |
| `src/vendor/botor/pad-sim.ts` | 6 | 6 | **0** |
| `src/vendor/botor/pad-sim-host.ts` | 0 | 0 | 0 |
| `src/vendor/botor/tests/pad.test.js` | 1 | 1 | **0** |
| `src/vendor/botor/tests/pad-sim.test.js` | 5 | 5 | **0** |
| `src/vendor/botor/tests/pad-invariants.test.js` | 0 | 0 | 0 |
| **total** | **22** | **22** | **0** |

**The two lists describe the same set**: four files with hunks, four files with rows, and the two
files with zero rows are the two files the diff does not name. Every row's `vendored` text was
searched in its own file and found **exactly once** — checked directly here, not merely delegated to
the spec, because `pad-sim.ts:987` and `:1002` are byte-identical lines and `_pad.ts:1204`/`:1223`
differ only in indentation, so a row that quoted a site alone would have matched twice. The rows carry
wider context for that reason.

**Twenty-two rows against seven predicted hunks.** The plan's estimate of "seven hunks at most" was
low, and 11-03 predicted exactly this in its finding 5.

`src/vendor/` is listed in `.prettierignore`, confirmed by reading the file, so **`npm run format`
cannot reach a vendored file.** No vendored byte was moved by a formatter.

---

## The negative checks, with exit codes

**Check 1, the phase walk — the most important one in the phase — was re-run in this session and
observed directly.**

`pad-sim.ts`'s `L.pha = (L.pha + L.fre) & 255` was replaced with
`L.pha = Math.min(255, L.pha + L.fre)`, a clamp.

- **`firmware-oracle.spec.ts` exit 1.** `Tests 1 failed | 6 passed | 1 todo (8)`.
- **Exactly one test red, and it is the seventh**: *"agrees on the tick order at layer expiry"*.
- **The failure message names the frozen-frame index, not a phase value**, exactly as the plan
  predicted: `the expiry tick 42 did not change the picture, so the tick order would be unobservable
  here`.

**Why that asymmetry is real rather than lucky.** The oracle's seventh test builds `defaultState()`,
disables Look and Sends, leaves Touch on and drives one `touchDown`. `DEFAULT_PAD_STATE.touch.kind` is
`"comet"`, and disabling Look removes the keeper that would otherwise re-arm forever — **so the only
layer ticking in that test is the comet layer painted at `pad-sim.ts:992`, this plan's own edit.** The
test does not sit next to the change; it runs straight through it. And every one of its assertions is
**relative to an observed expiry** rather than to an absolute tick: it scans for the `animating`
true-to-false transition, names that tick `expiry`, and asserts
`hashes[expiry + 1] === hashes[expiry - 1 + offset]`. `(256 - rate) * ticks` is by construction the
start from which the walk reaches 0 in exactly `ticks` steps, so it moves **when** the layer expires
and not **which frame relative to expiry** is frozen — every index moves together and the test stays
green. Clamp the walk and the frozen frame changes position relative to `expiry`, and it goes red.
**That is the whole proof, and it is a stronger claim than "a standing gate stayed green".**

**The revert was proved by manifest reconstruction, never by `git diff --quiet`.** After the intended
hunks are in place `pad-sim.ts` differs from its upstream by design, so a diff against HEAD cannot be
the check. `git checkout`, `git restore`, `git stash` and `git clean` were **not used** — Phase 10 lost
uncommitted work to one. The file was restored from a scratch copy and both sha256 digests compared
equal at `2651e236ab8f2dd19c7441abeaf43584b0a3a919840f79e1ab27fee10604b39b`. Then:

- **`vendored-diff.spec.ts` exit 0**, 15 passed — the tree contains the recorded divergence and
  **nothing else**, which is strictly stronger than "unchanged since HEAD".
- **`firmware-oracle.spec.ts` exit 0**, 7 passed plus 1 todo — the clamp is gone.

**Checks 2, 3 and 4 were run by the interrupted executor and are carried, not re-observed here.**
Stated plainly rather than folded in: the preview-versus-device check (fix `_pad.ts`, leave
`pad-sim.ts`), the tpad `ENDED` budget check (recorded as taking tpad from 6/6 agreeing to 2/6
differing and its Setup to 910 of 908), and the manifest-row-deletion check. **The tpad budget
arithmetic is independently confirmed here from the sweep** — 902 + 8 = 910 at defaults and 907 + 8 =
915 at the worst knob position, both over 908 — but the behavioural half of that check is carried.

**`firmware-oracle.spec.ts` is green AND unedited**: `git diff --quiet 4131ff5 --
src/lib/fidelity/firmware-oracle.spec.ts` exits **0**. `preset-baseline.json` is byte-unchanged:
exit **0** against the same base.

---

## What the plan asserts that the tree does not support

### 1. `golden-frames.json` does not move, and neither does `frames.json`

The plan states as fact that `golden-frames.json` *"moves for the same five, because `pad-sim.ts`
moved too"*, gives task 03 the job of regenerating it through `UPDATE_GOLDEN=1`, and requires
`nonZeroBytes` to **fall** at the later ticks with the falling as the proof the simulator half landed.

**It does not move, and it should not.** `golden-frames.spec.ts`'s `sample()` is four lines:

```
const sim = new PadSim(mustPreset(id).state);
sim.run(tick);
const bytes = sim.frame;
```

**There is no touch input.** The comet and perFinger layers are painted only in response to a touch
sample, so in a fixture that never touches they are never painted at all, and a change to the constant
they are painted with cannot reach the frame. `src/lib/catalog/frames.spec.ts`'s sampler has the same
shape (`engine.run(tick)`, no gesture) and is unmoved for the same reason.

Confirmed rather than assumed: `git diff --quiet 4131ff5 -- src/lib/fidelity/golden-frames.json
src/lib/catalog/frames.json` exits **0**, and both specs are green inside the 83 / 839 run with their
committed fixtures. **A regeneration here would have rewritten two tripwires to identical content and
reported it as evidence.** The `nonZeroBytes`-must-fall test the plan wanted is a real test, but it
needs a sampler that touches the pad, and neither fixture is one.

### 2. The residue probe is structurally scoped to hand-authored entries, so it cannot be "re-run over the five preset-backed entries"

Task 03 asks for 11-02-03's matched-pair residue probe to be re-run over the five preset-backed
catalog entries and to report zero cells differing against the research's measured seven.

The probe iterates `luaEntries()`, which is `CATALOG.filter((entry) => entry.source.kind === "lua")`.
**Preset-backed entries are excluded by construction**, and the exclusion is not incidental — the probe
opens each entry through a Lua host, which a preset-backed entry does not have. Running it over the
presets is not a re-run; it is a new probe with a different engine.

It was **not** written, because the plan's own count discipline puts the delta at +1 test and a second
new test would have moved the suite off 839 to satisfy a line the tree does not support. The
simulator-side residue is instead pinned where it belongs: `tests/pad-sim.test.js` carried an
expectation that asserted **the residue itself** (`after.pha` `toBe(3)`), and task 01 moved it to 0.
Recorded for **11-16** as the honest gap: *no probe measures preset-backed residue end to end.*

### 3. The plan's `ENDED` fix is wrong, and its `tpad` exclusion is the tell

Covered in full above. Stated here as a finding in its own right because the plan asserts
*"the correct forms are `e==3 or e>=5 and e<9` (+8) and, for LIVE, `e~=3 and e<5 or e>8`"* — the
second is right and shipped; **the first would have left ten release paths armed forever**, and the
plan's own footnote about `tpad:2241` describes that failure at one site without generalising it.

### 4. Four "free at its worst knob position" figures in the manifest are 908 minus the DEFAULT cost

**Found while verifying the affordability claims against the sweep, and NOT adjusted.**

| preset | manifest reason claims free | sweep worst | sweep free | declared default | 908 - default |
| --- | --- | --- | --- | --- | --- |
| pinwheel | 596 | 317 | **591** | 312 | **596** |
| radar | 463 | 458 | **450** | 445 | **463** |
| joystick | 366 | 551 | **357** | 542 | **366** |
| faders | 388 | 524 | **384** | 520 | **388** |

Every claimed figure is exactly `908 - default`, labelled as the worst knob position. The true
worst-position figures are 591, 450, 357 and 384. **The affordability conclusion is unaffected** —
every one of the four has hundreds of characters free either way, and the sweep reports over budget 0 —
but four reason strings in a permanent GPLv3 record say something measurably untrue about *where* the
number came from. **Left exactly as written**, per the standing instruction to report a disagreeing
number rather than reconcile it. **11-16 should correct the four strings deliberately.**

*(tpad's figures in the same record are correct: 902 of 908 at defaults, 907 at the worst position.)*

---

## Commits

| Commit | Task | What |
| --- | --- | --- |
| `7faa93c` | 11-04-01 | the comet trail lands on phase 0, in the compiler and in the simulator alike |
| `a80854b` | 11-04-02 | the fast tap admitted at two guards, and ENDED left exactly as it was |

Task 03 produced no commit, because it produced no change: both tripwires are correctly unmoved and
the residue probe it names cannot reach the presets. Documented above rather than faked.

---

## Deviations from Plan

### Auto-fixed and auto-decided

**1. [Rule 1 - Bug] The plan's `ENDED` fix would have left ten release paths armed forever**

- **Found during:** Task 02, by the interrupted executor; verified in this session.
- **Issue:** The plan mandates `ENDED` become `e==3 or e>=5 and e<9`. Code 9 is a press *and* a lift
  in one message, so it genuinely **is** an end, and all ten `ENDED` sites are release paths.
- **Fix:** `ENDED` left byte-unchanged; the press half fixed at `LIVE` and at `phaseCond`'s held arm,
  which is where a fast tap actually goes missing.
- **Files:** `src/vendor/botor/_pad.ts`, `src/vendor/botor/pad-sim.ts`
- **Commit:** `a80854b`

**2. [Rule 3 - Blocking] The plan's `tpad` exclusion-by-name became unreachable**

- **Issue:** The plan requires a second named constant so `tpad:2241` keeps the original text. With
  `ENDED` unchanged, no site needs the original text and `LIVE` has exactly one user.
- **Fix:** `LIVE` edited in place; no second constant; `tpad` excluded **by construction**. The
  plan's success criterion *"tpad is excluded by name with both of its reasons"* is discharged by
  stating both reasons here and demonstrating that neither had to be spent.
- **Commit:** `a80854b`

**3. [Rule 2 - Missing correctness] `pad-sim.ts` moved with the compiler at both class-B guards**

- **Issue:** The plan's class-B half names only `_pad.ts`. Fixing the compiler alone would have left
  the preview ignoring a fast tap the device now answers.
- **Fix:** `live()` and `phasePass()` mirrored, both under manifest rows.
- **Commit:** `a80854b`

**4. [Rule 3 - Blocking] Task 03's two regenerations would have rewritten identical content**

- **Fix:** Not performed. Both fixtures proved unmoved by diff and by green specs, and the reason is
  documented above.

### Carried from the interrupted execution

`7faa93c` and the working-tree state behind `a80854b` were produced by a previous executor. This
session **verified rather than redid**: it re-derived the BEFORE fast-tap table without touching the
tree, re-computed the twelve-row +0 table from `DECAY_TABLE`, re-checked all twenty-two manifest rows
for the exactly-once rule directly against the files, re-observed the phase-walk negative check end to
end, and re-ran every gate after deleting the probe. Three of the four negative checks are carried
and are labelled as carried.

---

## Known Stubs

None. No file in this plan renders placeholder data or holds an unwired data source.

---

## For the waves that follow

- **11-05:** the standing rule, stated as a rule: **a HANGAR-owned preset must never select `bloom`
  or `disturb`.** Neither is reachable today because `touch.kind` is not a knob; 11-05 is the plan
  that can enforce it before that changes.
- **11-16:** three items. (a) NINEPADS's fast tap sends nothing where a slow tap sends a note pair,
  and the repair is a shape change D-02 does not grant — a BOTOR bug (D-08). (b) `phaseCond`'s
  **press** arm carries the same class-B defect, unreachable from HANGAR, also upstream. (c) The four
  mislabelled "worst knob position" figures in `upstream-manifest.json`, to be corrected deliberately
  rather than quietly.
- **Anyone regenerating a tripwire:** `golden-frames.json` and `frames.json` sample with **no touch
  input**. A touch-response change cannot move them. If a future plan claims one will, that claim is
  wrong before it is executed.

---

## Self-Check: PASSED

- `src/lib/fidelity/upstream-manifest.json` — FOUND, 22 `intendedDivergence` rows, 0 exactly-once
  violations
- `src/vendor/botor/_pad.ts` — FOUND, 10 rows
- `src/vendor/botor/pad-sim.ts` — FOUND, 6 rows, sha256
  `2651e236ab8f2dd19c7441abeaf43584b0a3a919840f79e1ab27fee10604b39b`
- `src/lib/sim/lua-smoke.spec.ts` — FOUND, +1 test
- `src/lib/fidelity/preset-baseline.spec.ts` — FOUND, 20 tests
- `src/lib/sim/zz-measure.spec.ts` — **absent, as required**; the tree is clean
- Commit `7faa93c` — FOUND
- Commit `a80854b` — FOUND
- `check-counts.mjs 83 839` exit 0; `check-counts.mjs 4 19` exit 0; `npm run check` 0 ERRORS 0
  WARNINGS; `npm run lint` clean; `npm run build` exit 0
