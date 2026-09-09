---
phase: 11-bench-corrections
plan: 03
subsystem: fidelity
tags: [vendor, gplv3, manifest, fidelity, vitest, divergence, re-sync]
requires:
  - phase: 11-bench-corrections
    plan: 02
    provides: "the PREV_FILES 83 / PREV_TESTS 836 / sweep 4 19 baseline, and the clean tree the zero-hunk claim is measured against"
provides:
  - "intendedDivergence on all six vendored files - the record that replaces the byte-pin D-02 dropped, landed EMPTY"
  - "vendored-diff.spec.ts at 15 tests: both lists inverted in a derived order, exactly-once on both, and a justification test whose vacuity is stated in its own name"
  - "preset-baseline.spec.ts at 20 tests: INTENDED_DIVERGENCE per preset per field, empty, with D-08 suspended for the named few and stopping for everything else"
  - "VENDOR.md's sync procedure rewritten as a merge, with a re-check step that can RETIRE a row"
  - "scripts/record-upstream-manifest.mjs carries the record forward instead of deleting it"
affects: [11-04, 11-16]
tech-stack:
  added: []
  patterns:
    - "A record whose EMPTY state is proved: the field's presence is asserted separately from the rows' contents, so a green run at zero rows still guards something"
    - "A two-sided divergence declaration (hangar AND baseline substring) that RE-CUTS a character comparison rather than suppressing it"
key-files:
  created: []
  modified:
    - src/lib/fidelity/upstream-manifest.json
    - src/lib/fidelity/vendored-diff.spec.ts
    - src/lib/fidelity/preset-baseline.spec.ts
    - src/vendor/botor/VENDOR.md
    - docs/PIN-POLICY.md
    - scripts/record-upstream-manifest.mjs
key-decisions:
  - "The inversion order is divergences-then-deltas, which CONTRADICTS the plan's first sentence and matches its own parenthetical. Derived from the sync procedure and proved by an added negative check, not argued"
  - "scripts/record-upstream-manifest.mjs was edited although the plan does not name it: as written, VENDOR.md's own step 6 would have deleted the entire divergence record"
  - "preset divergence rows carry BOTH substrings. A one-sided declaration can only suppress a comparison; a two-sided one re-cuts it and keeps the rest of the string character-for-character"
  - "Length assertions stay pinned to a number plus a DECLARED delta, never recomputed from the thing under test"
patterns-established:
  - "When a plan's stated proof of a negative fails, replace it with a real measurement rather than with a better-worded assertion: the sweep was RUN because its not-needed grep did not hold"
requirements-completed: []
duration: 0h 25m
completed: 2026-09-09
---

# Phase 11 Plan 03: The Net Before the Fall — Summary

**The divergence record exists on all six vendored files, is proved to work by five negative checks,
and is EMPTY — `git diff --stat HEAD -- src/vendor/` shows one file and it is `VENDOR.md`, which is not
one of the manifest's six. Five findings the tree did not support, including a regeneration script that
would have deleted the whole record in the one step `VENDOR.md` tells a re-syncer to run.**

## Performance

- **Duration:** 25 m
- **Tasks:** 2 of 2
- **Files:** 0 created, **6 edited** (the plan declared 5)
- **Commits:** `4c063d8`, `4b9a206`

---

## Counts, as carried name plus delta

| Name           | Carried            | Declared | Observed              | Agreement  |
| -------------- | ------------------ | -------- | --------------------- | ---------- |
| quick files    | `PREV_FILES` 83    | **+0**   | **83**                | agrees     |
| quick tests    | `PREV_TESTS` 836   | **+2**   | **838** (+1 todo)     | agrees     |
| e2e            | `PREV_E2E` 103     | +0       | **103**, not run      | proved     |
| sweep          | `4 19` at 112 s    | not run  | **4 19** at **134 s** | **run**    |
| `svelte-check` | `BASE_CHECK` 577   | —        | **577**, 0 errors 0 warnings | agrees |
| catalog        | 27 (9 preset + 18 Lua) | +0   | **27**                | untouched  |

`node scripts/check-counts.mjs 83 838` exited **0** against those literals, run against the literal
rather than read off a transcript.

**The +2 splits exactly as the plan said it would:** `vendored-diff.spec.ts` **14 → 15**, and
`preset-baseline.spec.ts` **19 → 20**. Nothing else in `src/lib/fidelity/` moved: `golden-frames.spec.ts`
11, `firmware-oracle.spec.ts` 7 plus its 1 todo, `lua-parity.spec.ts` 5. The directory ran 56 + 1 todo
before this plan and 58 + 1 todo after.

**`svelte-check` is flat at 577 and that is correct**: this plan created no file. Reported, never
asserted.

**The e2e +0 is proved, not claimed.** `git diff --name-only 92f0e57 HEAD -- e2e src/routes scripts
static` names one path, `scripts/record-upstream-manifest.mjs`, which is a manifest recorder that no
browser loads and no route imports. No Playwright title was added, moved or removed and nothing the
built artefact serves changed shape.

**No agent connected to or wrote to a device, nothing was deployed, and nothing here is claimed as
hardware-verified. No sibling repository was read or written by this plan** — the two scripts that
read `../grid-editor` were edited but not run.

---

## The zero-hunk claim, stated exactly

```
$ git diff --stat HEAD -- src/vendor/botor/_pad.ts src/vendor/botor/pad-sim.ts \
      src/vendor/botor/pad-sim-host.ts src/vendor/botor/tests/
(no output)

$ git diff --stat HEAD -- src/lib/fidelity/preset-baseline.json src/lib/fidelity/golden-frames.json
(no output)

$ git diff --stat HEAD -- src/vendor/
(no output, both hunks committed)
```

Across the two commits, the only path under `src/vendor/` that moved is `src/vendor/botor/VENDOR.md`,
**101 insertions, 39 deletions**.

### `VENDOR.md` is NOT under the manifest, checked before it was edited

```
$ node -e "const m=require('./src/lib/fidelity/upstream-manifest.json');
           console.log(m.files.some(f=>f.vendored.endsWith('VENDOR.md')))"
false
```

The manifest's `files` array names six paths and `VENDOR.md` is none of them: `_pad.ts`, `pad-sim.ts`,
`pad-sim-host.ts`, `tests/pad.test.js`, `tests/pad-sim.test.js`, `tests/pad-invariants.test.js`. It is
HANGAR-authored provenance that happens to live inside the quarantine directory, it carries no
provenance header and no sha256, and `vendored-diff.spec.ts` reads it only as a *document* (test 5
asserts what it must contain). So the plan's carve-out holds as written and the zero-hunk claim needed
no restating. **The divergence table lands empty and no vendored source byte moved.**

---

## What the plan asserts that the tree does not support

Five findings. None was reconciled into a passing number or a quieter sentence.

### 1. `scripts/record-upstream-manifest.mjs` would have DELETED the record, in the step `VENDOR.md` prescribes

The plan names four files and does not name this script. The script builds the manifest wholesale from
a hard-coded `FILES` list and writes it with `JSON.stringify(manifest, null, 2)`. It has no notion of
`intendedDivergence` and cannot have one — **nothing in an upstream checkout can tell it what HANGAR
deliberately changed.** So the old step 5, `node scripts/record-upstream-manifest.mjs`, which the
procedure tells every re-syncer to run, would have silently dropped every row.

That is the exact failure D-02 raised the record to prevent, arriving through the front door.

Fixed inline (**Rule 2 — missing critical functionality**). The script now reads the existing manifest,
carries each file's rows forward keyed on the vendored path, fails loudly rather than overwriting if the
existing manifest will not parse, always writes the field out (empty array included), and **prints every
carried row at the end of the run as a checklist**, headed *"CARRIED FORWARD, not re-checked"* — because
carrying a row forward is not the same as blessing it, and step 4 of the new procedure is re-checking
each one.

The spec's new test guards the same hole from the other side: it asserts `Array.isArray` on every
entry's `intendedDivergence` and says in its failure message that if the recorder dropped the field,
**the recorder is the bug**. That assertion is the non-vacuous half of a test whose row loop is empty.

### 2. The plan contradicts itself on the inversion order, and the derivable answer is the opposite of its first sentence

> "The existing byte-identity `it.each` now inverts `intendedDivergence` **after** `deltas`"

and, four words later in the same paragraph:

> "the divergences are applied to the vendored text, so they invert **first** in reverse order of
> application"

Only one can be implemented. Derived rather than picked:

- A **delta** is applied at sync time, by `VENDOR.md` step 3, to a freshly copied upstream file.
- A **divergence** is applied afterwards, by a plan editing the file that step produced.
- So the vendored file is `upstream -> deltas -> divergences`, a divergence's `vendored` text is quoted
  from the **delta-era** file, and a delta's `vendored` text is quoted from the **upstream** file.
- Reconstruction inverts a composition, so it runs **last applied, first inverted: divergences first,
  then deltas**, and within one file in reverse array order.

**Implemented as derived, which matches the plan's parenthetical and contradicts its opening clause.**
The plan asks that the order be "proved with the negative check below rather than reasoning about it in
prose" — **and none of its three negative checks touches the order.** A fourth was added that does; see
check 4 below. Both the code comment and this SUMMARY cite it, so the derivation is not load-bearing on
its own.

### 3. The sweep-not-needed grep does not hold. It exits 0 with seven matches, not 1 with none

The plan says: *"Run the grep and paste it; do not assert the negative from memory."* Pasted in full,
exactly as run:

```
$ grep -n "vendor\|preset-baseline\|golden-frames\|upstream-manifest" \
    src/lib/tune/reachability.sweep.spec.ts \
    src/lib/share/stamp-roundtrip.sweep.spec.ts \
    src/lib/catalog/lua-entries.sweep.spec.ts
src/lib/tune/reachability.sweep.spec.ts:8:// anti-drift, and `src/vendor/botor/tests/pad-invariants.test.js` is the
src/lib/tune/reachability.sweep.spec.ts:13:// COMPILER: the vendored `_pad.ts` at `a0fb69d5` measured through
src/lib/tune/reachability.sweep.spec.ts:15:// It is a property of a version, not a law. Re-run it after ANY vendored
src/lib/tune/reachability.sweep.spec.ts:77:} from "../../vendor/botor/_pad";
src/lib/share/stamp-roundtrip.sweep.spec.ts:16:// vendored re-sync that widened a `PadState` field HANGAR does not expose would
src/lib/share/stamp-roundtrip.sweep.spec.ts:57:import { STAMP_ALPHABET } from "../../vendor/botor/_pad";
src/lib/catalog/lua-entries.sweep.spec.ts:68:import { EVENT_BUDGET } from "../../vendor/botor/_pad";
grep exit=0
```

**Three of the sweep's four files import the vendored compiler directly**, and
`reachability.sweep.spec.ts:15` says in its own words *"Re-run it after ANY vendored"* change. The
plan's conclusion happens to be right and its reason is wrong: the sweep cannot have moved because
**this plan changed no vendored byte and no compiler**, not because the sweep never reaches them.

Warning 2 of the brief says that when a negative check comes back the way you wanted, suspect the
check. This one came back the way the plan did not want, which is the same instruction pointing the
other way — so the sweep was **run** rather than argued about: **`4 files / 19 tests`, green, 134 s**
(carried 112 s; the machine was busier, and the figure is reported, not asserted).

**This finding matters more for 11-04 than for 11-03.** A wave that edits `_pad.ts` reaches all three
of those imports, and the reachability sweep is the only gate that would notice a codegen change moving
the 908-character ladder.

### 4. The plan asks for three negative checks in task 01 and its output section asks for four in total; there are five, and the fifth is the one that proves the order

Counted and listed below. The extra is the order proof (check 4). Added under **Rule 2**, because the
plan explicitly requires the order to be proved mechanically and none of its own three does it.

### 5. `_pad.ts` and `pad-sim.ts` each carry the target constant at sites that are byte-identical to one another, so 11-04 needs more rows than sites

Found while building negative check 3, not by reading the plan. Measured:

| File | Sites carrying the decay start | Note |
| ---- | ------------------------------ | ---- |
| `src/vendor/botor/_pad.ts` | `:1204` comet, `:1223` perFinger, `:1243` bloom, `:2064` the cost estimator | `:1204` and `:1223` are both `` `glpfs(${a},1,255,${decay.rate},0)` `` and differ only in indentation |
| `src/vendor/botor/pad-sim.ts` | `:987` comet, `:1002` perFinger, `:1227` a third paint | `          this.glpfs(h, 1, 255, decay.rate, 0);` occurs **exactly twice**, verified by counting |

The exactly-once rule therefore **bites 11-04 immediately**: a row quoting only that line matches twice
and turns the gate red, correctly. 11-04 must widen each row's `vendored` text with enough surrounding
context to be unique, and it must not be tempted to record one row and let a replace-all cover both —
which is precisely the failure the exactly-once assertion was written for.

`:2064` is a fourth `_pad.ts` site (`glpfs(a,1,255,${nearestDecay(s.touch.trailMs).rate},0)`), and it
is inside the cost estimator rather than the codegen. A fix that moves the emitted text and leaves that
one alone would make the budget meter disagree with the emitted config — flagged here rather than
discovered by a red budget test.

---

## The manifest's new shape

`intendedDivergence` sits **beside** `deltas`, never inside it, written out as an empty array on all six
entries so that "none" and "a field nobody added" cannot look the same:

```json
{
  "vendored": "src/vendor/botor/pad-sim.ts",
  "upstream": "src/renderer/main/zona/pad-sim.ts",
  "bytes": 56314,
  "sha256": "23464381580b0408b5ee17f9f4d03b78a703878709b1895b9c512fa122ce1602",
  "deltas": [],
  "intendedDivergence": []
}
```

### A worked example row, written out and NOT committed

This is the shape 11-04 will land, using the site it will actually edit. It is shown here so the row is
designed before it is needed, and it is **not in the tree**:

```json
{
  "vendored": "      case \"comet\":\n        this.paintCells(sm, (h) => {\n          this.glpfs(h, 1, 252, decay.rate, 0);",
  "upstream": "      case \"comet\":\n        this.paintCells(sm, (h) => {\n          this.glpfs(h, 1, 255, decay.rate, 0);",
  "reason": "A start of 255 is odd and every emitted rate is even, so 255 - rate*T can never be 0 (mod 256) for any timeout and the comet trail freezes lit instead of going out. 252 is the largest start the emitted rates divide exactly.",
  "plan": "11-04",
  "dated": "2026-09-09"
}
```

Two things that row demonstrates and a bare hunk would not: the `vendored` text carries the `case
"comet":` line because the paint line alone occurs twice (finding 5), and the `reason` states the
*arithmetic*, so a re-syncer meeting an upstream file that already starts at 252 can retire the row
rather than re-apply it blindly.

**The top-level `note` was extended** to say what the second list means, and — because the recorder
writes that string too — the same text was updated in `scripts/record-upstream-manifest.mjs`'s `NOTE`
constant. A note that only lived in the JSON would have been reverted by the first regeneration.

---

## The inversion order, derived and then proved

Derivation is in finding 2 and verbatim in the spec's own comment. The proof is mechanical:

A divergence was planted on `tests/pad-invariants.test.js` whose `vendored` text **contains** that
file's delta text — the vendored file's import line became `} from "../_pad"; // HANGAR divergence
marker`, and the row's `upstream` side is the delta-era `} from "../_pad";`. That is the only situation
in which the two inversions do not commute.

| Order | What happens | Result |
| ----- | ------------ | ------ |
| **Divergences first, then deltas** (as shipped) | divergence inverts to the delta-era line, delta then finds `} from "../_pad";` exactly once and inverts it to `} from "../main/zona/_pad";`, bytes reconstruct | **15 passed, exit 0** |
| Deltas first, then divergences (loops swapped in a scratch copy) | the delta rewrites the import inside the divergence's own text, so the divergence's `vendored` string then occurs **zero** times | **1 failed, exit 1** |

The failure message under the swapped order is the exactly-once assertion, quoting the row's plan and
reason — which is the right failure to get, because it says *the recorded hunk is not where the record
says it is*.

---

## The five negative checks, with exit codes

| # | Task | Check | Observed | Exit |
| - | ---- | ----- | -------- | ---- |
| 1 | 01 | one stray space added after `pad-sim.ts`'s `ledTick` signature | **byte-identity red**, naming the file and the delta: *"reconstructed 56315 bytes, upstream src/renderer/main/zona/pad-sim.ts is 56314. A change of 1 bytes is in neither the delta list nor the intended-divergence list."* **The machinery did not weaken the gate** | **1** |
| 2 | 01 | a divergence row on `pad-sim.ts` whose `reason` is `""` | **justification test red**, naming the file and the field: *"intended divergence \"  private ledTick(): void {\": reason must be a sentence saying what behaviour changed and why. Got: \"\""*. The byte-identity test went red **as well**, because that row's `upstream` side is fictional — an unjustified row is also usually a wrong one | **1** |
| 3 | 01 | a divergence row whose `vendored` text is `          this.glpfs(h, 1, 255, decay.rate, 0);`, which occurs **twice** in `pad-sim.ts` | **exactly-once red**, and the message carries the row's plan and its reason, so the failure says which decision reached an unrecorded second site | **1** |
| 4 | 01 | **added.** the order proof of the table above: an overlapping divergence, run under both orders | shipped order **15 passed / exit 0**; swapped order **1 failed / exit 1** with the delta found zero times | **0 / 1** |
| 5 | 02 | an `INTENDED_DIVERGENCE` row for `aurora`, whose output does **not** differ | **justification test red**: *"aurora setupLua: the declared HANGAR substring is ALREADY IN THE FIXTURE, so BOTOR emits it too and there is no divergence here to declare. If the fix was reverted or landed upstream, delete the row."* The character test went red beside it, naming the site as one nobody declared | **1** |

**Every restore was from a scratch copy with sha256 compared either side, never `git checkout --`**
(warning 1). Verified back to: `pad-sim.ts` `34e2bba3…`, `pad-invariants.test.js` `97a42bac…`,
`upstream-manifest.json` `0e8dc8be…`, `vendored-diff.spec.ts` `eaa3b584…`,
`preset-baseline.spec.ts` `3cf87a80…`. Every hash matched, and
`git diff --quiet -- src/vendor/botor/pad-sim.ts` exited 0 after check 1.

**On warning 2 — suspecting a check that comes back the way you wanted.** Check 4's *green* half is
exactly the kind of result that warning is about, so it was not accepted on its own: the same scaffold
was run under the swapped order and observed **red**, and the green is only meaningful as one half of
that pair. Neither half was read from a summary line alone; both failures were read from the assertion
text.

---

## The seven affected assertions, and how each was re-cut

| # | Site | Re-cut how | Vendored byte moved? |
| - | ---- | ---------- | -------------------- |
| 1 | `src/lib/fidelity/vendored-diff.spec.ts` | 14 → **15**. Both lists inverted, order derived; exactly-once kept for both; hash-failure message no longer says *"never patch a vendored file locally"* — it now says D-02 permits editing the tree and does not permit editing it **silently**, and names the two ways out (revert, or record with a reason, a plan and a date) | no |
| 2 | `src/vendor/botor/VENDOR.md` | rewritten. "Direction of flow is one-way… HANGAR-authored content never lands in a vendored file" was **false** under D-02 and is now "a fix made here is not a fix BOTOR has". The `Local modifications` column became `Mechanical deltas` and points at the manifest as the single authority. Sync procedure is a **merge**, 11 steps | **yes — the one permitted hunk** |
| 3 | `src/vendor/botor/tests/pad.test.js` | **untouched**, and confirmed to carry the literal exactly once: `:3218` reads `expect(lua).toContain("local a=glag(0,40)glpfs(a,1,255,250,0)glt(a,1,42)")`. It is under the manifest, so 11-04's hunk there is a divergence row like any other. Recorded against FOUND-02 below | no |
| 4 | `src/lib/fidelity/preset-baseline.spec.ts` + `.json` | spec 19 → **20**, `INTENDED_DIVERGENCE` added empty; fixture **byte-unchanged**. See the section below | n/a |
| 5 | `src/lib/fidelity/golden-frames.json` | **byte-unchanged**, and the difference between the two fixtures is now written in `preset-baseline.spec.ts`'s header where somebody reaching for an `UPDATE_` variable will read it. `UPDATE_GOLDEN=1` **is** the sanctioned path, 11-04 uses it, and its output is a **tripwire, not an oracle** — a moved hash there is evidence a picture changed, not that a contract broke | n/a |
| 6 | `REQUIREMENTS.md` CONT-01 | **recorded for 11-16, not written.** Wording below | no |
| 7 | `REQUIREMENTS.md` FOUND-02 | **recorded for 11-16, not written.** Wording below | no |

Two sites the plan does not list were also touched and both are consequences of site 1:
`docs/PIN-POLICY.md` (item 5 of the bump gate now says the pin decides whether a row is still needed)
and `scripts/record-upstream-manifest.mjs` (finding 1).

**`firmware-oracle.spec.ts` was not opened for editing and is green**, 7 tests plus its 1 todo. Its
seventh test, *"agrees on the tick order at layer expiry"* at `firmware-oracle.spec.ts:213`, was read
and every claim the plan makes about it was checked against the tree:

- it builds `defaultState()`, sets `enabled.look = false` and `enabled.sends = false`, leaves
  `enabled.touch = true`, and drives one `touchDown(0, 64, 64)` — **confirmed at `:213-225`**;
- `DEFAULT_PAD_STATE.touch.kind` is `"comet"` — **confirmed at `_pad.ts:637`**;
- the comet layer is painted at `pad-sim.ts:986-988` and `:987` is
  `this.glpfs(h, 1, 255, decay.rate, 0);` — **confirmed, exactly those line numbers**;
- the phase walk is `pad-sim.ts:884-892`'s `ledTick`, `L.pha = (L.pha + L.fre) & 255` at `:887`, with
  the header citing `grid_led.c:191-211` — **confirmed; the plan's `883-891` is off by one at each end
  and names the right code.**

So the plan's mechanical-proof argument holds as written: the test runs *through* the site 11-04 edits,
its assertions index off an observed `expiry`, and a start-constant change moves every index together
while a clamp on the walk moves the frozen frame relative to `expiry`. Nothing in this plan gave it a
reason to be touched.

---

## The two fidelity fixtures, and why they are not the same kind of thing

| Fixture | Status after this plan | Regeneration |
| ------- | ---------------------- | ------------ |
| `preset-baseline.json` | **byte-unchanged** | **None, and none added.** The header now says so in capitals, at the top, before the type definitions — the place somebody hunting for an `UPDATE_` variable will actually reach. Its one sanctioned way to move is a re-sync: `scripts/capture-preset-baseline.mjs` re-run in **BOTOR's** tree at the **new** commit, which is now step 7 of `VENDOR.md`'s procedure and was not in the old one at all |
| `golden-frames.json` | **byte-unchanged** | `UPDATE_GOLDEN=1 npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts` — rewrites, runs prettier, then **fails by design** so a regeneration can never be mistaken for a passing run. **11-04 uses it and must list every moved row.** It is a tripwire whose hashes come from the simulator itself, so a moved hash is evidence a picture changed |

`scripts/capture-preset-baseline.mjs` is **unchanged** and still points at the vendored shelf.

### `INTENDED_DIVERGENCE` in `preset-baseline.spec.ts`

Empty. Two row shapes, discriminated:

- a **`lua`** row names the preset, the field (`setupLua` or `timerLua`), **both** substrings and a
  reason;
- a **`length`** row names one of the six recorded lengths and the **character delta** it spends.

**Both substrings are required, and that is a deliberate elaboration of the plan's "the exact substring
that differs".** A one-sided declaration can only *suppress* the comparison for that preset; a two-sided
one *re-cuts* it — the declared substring is substituted out of HANGAR's output and **the rest of the
string is still compared character for character**. That is what makes "everything else still stops"
true rather than aspirational. The substitution is exactly-once for the same reason the manifest's rows
are.

**The length assertions stay pinned to a number.** `expect(built.setupLua.length).toBe(f.setupRawLength
+ declaredDelta)`. A length test that recomputed its own expectation would assert nothing, so a
divergence has to state what it costs, and the gate still fails if it costs one character more.

**D-08 restated in the header, in the plan's own terms:** *the rule is not relaxed for the nine, it is
suspended for the named few, at the named substring only, and everything else still stops.* A preset
with no row is compared exactly as before; a declared preset that differs anywhere else fails with the
message it always had, and that message quotes D-08.

**A note on the vacuity requirement, because the tree refused the first cut.** The plan asks that both
new tests be vacuous today and say so. The project's Vitest configuration **fails a test that runs zero
assertions** — *"expected any number of assertion, but got none"* — so a genuinely vacuous test cannot
exist in this repository. Each new test therefore carries a non-vacuous half beside its empty row loop,
and the vacuity is stated in the test's own **name**:

- `vendored-diff.spec.ts`: the field-presence check (finding 1), which fails if a regeneration drops
  `intendedDivergence`;
- `preset-baseline.spec.ts`: an assertion that the **D-08 sentence is still written verbatim in this
  file**, because a future author adding rows could otherwise delete the rule in the same commit as the
  exception.

Neither is decoration. Both would go red on a real, plausible mistake.

---

## The two requirement amendments, recorded for 11-16 and NOT written here

`requirements-completed` is empty on purpose. The plan's frontmatter lists `[FOUND-02, CONT-01,
PREV-06]`, and none was marked complete: FOUND-02 and PREV-06 are already `[x]`, and **CONT-01 is `[ ]`
and this plan makes it less true, not more.** Marking it would be a false checkbox.

### CONT-01 — currently `.planning/REQUIREMENTS.md:60`, unchecked

**Verbatim now:**

> - [ ] **CONT-01**: The nine BOTOR shelf presets — starfield, aurora, pinwheel, radar, faders,
>   ninepads, tpad, dial, joystick — are in the catalog, each compiling to the same Lua as BOTOR at the
>   pinned protocol version

**Proposed:**

> - [ ] **CONT-01**: The nine BOTOR shelf presets — starfield, aurora, pinwheel, radar, faders,
>   ninepads, tpad, dial, joystick — are in the catalog, each compiling to the same Lua as BOTOR at the
>   pinned protocol version, **except at the divergences enumerated in
>   `src/lib/fidelity/upstream-manifest.json` and declared per preset in
>   `src/lib/fidelity/preset-baseline.spec.ts`, each with its recorded reason**

**Why:** after 11-04, **five of the nine will not compile to the same Lua.** The clause is not deleted,
because "the same Lua as BOTOR" is still the rule and the divergences are still the exception.

### FOUND-02 — currently `.planning/REQUIREMENTS.md:14`, checked

**Verbatim now:**

> - [x] **FOUND-02**: The `_pad.ts` compiler, `pad-sim.ts` simulator and `pad-sim-host.ts` render loop
>   are vendored into HANGAR with their existing test suites passing unchanged, quarantined under a
>   single vendor directory with a written sync procedure back to BOTOR

**Proposed:**

> - [x] **FOUND-02**: The `_pad.ts` compiler, `pad-sim.ts` simulator and `pad-sim-host.ts` render loop
>   are vendored into HANGAR, quarantined under a single vendor directory with a written sync procedure
>   back to BOTOR, **and their existing test suites pass with the N enumerated divergences of
>   `upstream-manifest.json` applied — the counts themselves unchanged at 176, 96 and 9**

**Why:** `src/vendor/botor/tests/pad.test.js:3218` asserts the literal
`local a=glag(0,40)glpfs(a,1,255,250,0)glt(a,1,42)` and will need one hunk of its own once the compiler
emits `252`. That file is **itself under the manifest**, so the hunk is a divergence row like any other.
The clause is not deleted; it names the count. **11-16 fills `N` from the committed table rather than
from this SUMMARY**, so the number is observed at the time it is written. The three test *counts* do not
move — one expectation changes value, no test is added or removed.

**11-16 makes both amendments, by name and dated.** Recording them now is what stops 11-16 discovering
them.

---

## The five presets that will diverge in 11-04, and the four that will not

Not taken from the plan. Measured two ways, and the two agree.

**By `touch.kind`,** read off `PRESETS` at run time:

| Preset | `touch.kind` | `enabled.touch` | Diverges? |
| ------ | ------------ | --------------- | --------- |
| aurora | **comet** | true | **yes** |
| pinwheel | **perFinger** | true | **yes** |
| starfield | **comet** | true | **yes** |
| radar | **comet** | true | **yes** |
| dial | **comet** | true | **yes** |
| joystick | glow | true | no |
| ninepads | none | false | no |
| faders | none | false | no |
| tpad | none | false | no |

**By the emitted Lua,** scanning every `glpfs(` call in `preset-baseline.json` — which is BOTOR's own
output, not HANGAR's:

- **aurora, pinwheel, starfield, radar, dial** each carry `glpfs(a,1,255,250,0)` in `setupLua`, beside
  a second, shaped `glpfs(a,2,…,3)` keeper that is **not** a decay and is not affected.
- **joystick, ninepads, faders, tpad** carry **no `glpfs` at all**.

So the plan's list is exactly right, and `joystick` — the one entry with a live touch kind that does
not diverge — is excluded by measurement rather than by the `comet`/`perFinger` rule of thumb: `glow`
emits no decaying pair.

---

## Commits

| Commit    | Task     | What |
| --------- | -------- | ---- |
| `4c063d8` | 11-03-01 | the divergence record, empty, and proved before it is spent |
| `4b9a206` | 11-03-02 | D-08 suspended for the named few, and stopping for everything else |

---

## Deviations from Plan

**1. [Rule 2 — missing critical functionality] `scripts/record-upstream-manifest.mjs`.** Not in the
plan's `files_modified`. Without it, `VENDOR.md` step 6 deletes the record. Finding 1.

**2. [Rule 1 — bug] The inversion order.** The plan's first sentence and its own parenthetical
disagree; the derivable order is implemented and proved. Finding 2.

**3. [Rule 2] A fifth negative check.** The plan requires the order to be proved mechanically and none
of its three checks does. Check 4 added.

**4. [Rule 3 — blocking] The vacuity requirement could not be met literally.** Vitest here fails a
zero-assertion test. Each new test carries a non-vacuous half and states its vacuity in its name.

**5. [judgement, reported rather than skipped] The sweep was run.** The plan says it is not run and
offers a grep as proof; the grep does not hold. Finding 3. 134 s, `4 19`, green.

**6. [design elaboration] Two substrings per preset divergence row, and a declared length delta.** The
plan says "the exact substring that differs". One substring can only suppress a comparison. Reasoning
in the `INTENDED_DIVERGENCE` section.

**7. [narrowness, stated rather than silently widened] `plan` must match `^11-[0-9]{2}$`** in both
tables, as the plan specifies. A phase-12 divergence would be refused. Both failure messages say the
regex is narrow on purpose and that widening it is a deliberate act for the plan that needs it, rather
than leaving a future author to loosen it in confusion.

No Rule 4 checkpoints were reached.

---

## Known Stubs

None. Both tables are empty **by design and by the plan's own instruction**, not as placeholders: the
record is landed and proved before the wave that spends it, so nothing in 11-04 rests on the word of the
plan that will fill them. Each empty table carries a non-vacuous assertion that guards it while it is
empty, and each says in its own test name that its row loop is not yet evidence of anything.

---

## For the waves that follow

- **11-04 needs more divergence rows than it has edit sites.** `pad-sim.ts:987` and `:1002` are
  byte-identical lines; `_pad.ts:1204` and `:1223` differ only in indentation. The exactly-once rule
  will refuse a row that quotes either alone. Widen with surrounding context; do not reach for a
  replace-all. Finding 5.
- **`_pad.ts:2064` is a fourth site, inside the cost estimator, not the codegen.** A fix that moves the
  emitted text and leaves it behind makes the budget meter disagree with the config it measures.
- **11-04 must run `npm run test:sweep`.** Three of its four files import `../../vendor/botor/_pad`
  directly, and `reachability.sweep.spec.ts:15` asks for it in its own words. Finding 3.
- **Every `preset-baseline.spec.ts` row needs a counterpart in `upstream-manifest.json`.** One records
  the consequence in the emitted Lua, the other the cause in the vendored source.
- **`firmware-oracle.spec.ts` stays green without being edited, and that is the boundary proof.** It is
  green now; if 11-04 turns it red, the phase walk was clamped and the fix is wrong.
- **11-04 also owns each edited file's `Modified for HANGAR:` header line.** The header is stripped
  before hashing, so it costs no hash change — which is exactly why it has to be remembered. `VENDOR.md`
  now says so.
- **`PREV_FILES` 83 · `PREV_TESTS` 838 · `PREV_E2E` 103 · `BASE_CHECK` 577 · sweep `4 19` at 134 s ·
  catalog 27 (9 preset + 18 Lua)** are what wave 4 carries forward.

## Self-Check: PASSED

- `src/lib/fidelity/upstream-manifest.json` FOUND, and `intendedDivergence` present on all six entries.
- `src/lib/fidelity/vendored-diff.spec.ts` FOUND, 15 tests.
- `src/lib/fidelity/preset-baseline.spec.ts` FOUND, 20 tests.
- `src/vendor/botor/VENDOR.md` FOUND, contains `intendedDivergence`, contains no `TBD`.
- `docs/PIN-POLICY.md` FOUND, item 5 amended.
- `scripts/record-upstream-manifest.mjs` FOUND, carries rows forward.
- `src/lib/fidelity/preset-baseline.json` and `src/lib/fidelity/golden-frames.json` FOUND and
  byte-unchanged.
- Commits `4c063d8` and `4b9a206` FOUND in `git log --oneline --all`.
- `git diff --stat HEAD -- src/vendor/` **empty**; the only `src/vendor/` path in either commit is
  `VENDOR.md`.
