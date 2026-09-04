---
phase: 08-new-configurations
plan: 06
subsystem: catalog
tags:
  [
    lattice,
    morph,
    sonar,
    lua,
    knobs,
    budget,
    canonical-form,
    empty-timer,
    golden-frames,
    pitfall-1,
    token-prefix,
    D-04,
    D-08,
    D-11,
    D-12,
    D-18,
  ]
requires:
  - "src/lib/catalog/ (08-01) - CatalogEntry, CATALOG, frames.json, frames.spec.ts, check-counts.mjs"
  - "src/lib/sim/lua-host.ts (08-02) - createLuaHost and the Grid API; every global these three call was already registered"
  - "src/lib/sim/engine.ts + lua-pad-sim.ts (08-03) - createEngine, renderLua, the undefined-versus-empty-string Timer distinction"
  - "src/lib/catalog/lua-entries.spec.ts + src/lib/sim/lua-smoke.spec.ts (08-04) - the CONT-02 gate, unchanged"
  - "src/lib/catalog/front-door.ts (Phase 4) - EXCLUDED_FROM_ROW"
provides:
  - "src/lib/catalog/entries/lattice.ts - LATTICE, an isomorphic note grid tuned in fourths over a static root map, six knobs"
  - "src/lib/catalog/entries/morph.ts - MORPH, a four-corner bilinear macro pad with NO TIMER, five knobs"
  - "src/lib/catalog/entries/sonar.ts - SONAR, a radial 16-step five-voice sequencer, five knobs"
  - "frames.json now covers sixteen entries; the thirteen previous records are byte-identical"
  - "Seven hand-authored configurations against CONT-02's floor of six"
affects:
  - "Plan 08-07: docs/TESTING.md update and the phase verification read this SUMMARY's seven-row table"
  - "Phase 4's front-door row: lattice, morph and sonar joined EXCLUDED_FROM_ROW, so FRONT_DOOR is byte-identical to what Phase 4 left"
  - "Phase 5's tune panel: sixteen more knobs, every kind drawn from the vendored KnobKind union"
tech-stack:
  added: []
  patterns:
    - "Canonical Lua and its substitution table extracted from the PLAN by script, never retyped - proven again in wave 6"
    - "A substitution token must never be a PREFIX of another token in the same entry: renderLua is plain replaceAll, so @TRAIL inside @TRAILC is silently eaten and the per-event occurrence count in lua-entries.spec.ts test 5 double-counts it"
key-files:
  created:
    - src/lib/catalog/entries/lattice.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/catalog/entries/sonar.ts
  modified:
    - src/lib/catalog/index.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/frames.json
decisions:
  - "Two substitution tokens were renamed from the plan's names because each was a strict PREFIX of another token in the same entry: @TRAIL -> @DECAY in MORPH and @SWEEP -> @PERIOD in SONAR. Knob ids are unchanged; rendered Lua is unchanged; the corner arithmetic is unchanged."
  - "MORPH stores timer: \"\" INLINE rather than through a named TIMER constant, so the acceptance grep reads the fact directly and nobody is invited to fill an empty constant in"
  - "The plan's frames cross-check asserts GHOST is not animating at rest; it is, it always was, and it is correct - GHOST has a stored Timer and LuaPadSim.animating is host.animating || host.timerArmed. The darkness half of the check passes for all three dark entries."
  - "The research's and the plan's LATTICE prose says the bottom-left cell, one right and one up produce 36, 37, 42. Measured: 36, 37, 41. A perfect fourth is five semitones, so 41 is what the prose means and the printed 42 is an off-by-one in the document, not in the configuration."
metrics:
  duration: 20 min
  tasks: 3
  files: 6
  completed: 2026-09-04
---

# Phase 8 Plan 06: LATTICE, MORPH and SONAR Summary

Three more configurations authored for HANGAR went through the wave-4 gate with the gate unmoved —
an instrument whose static picture *is* the theory it plays, a four-corner macro blend with **no
Timer at all**, and a sequencer that runs in a circle. That makes **seven hand-authored
configurations against CONT-02's floor of six**, sixteen catalog entries in all, and `npm run
test:quick` reporting exactly the totals plan 08-05 left behind.

MORPH is the one that mattered most to prove: its Timer is the empty string, and **not one line of
any gate needed a branch for it**.

---

## The measured baseline, re-measured

Measured on this machine, on this tree, at commit `35d1eaa`, **before this plan touched anything**:

```
npm run test:quick
 Test Files  41 passed (41)
      Tests  556 passed | 1 todo (557)
```

**BASE_FILES = 41, BASE_TESTS = 556** — identical to what `08-05-SUMMARY.md` and `08-04-SUMMARY.md`
recorded. Nothing landed in between.

### Totals observed AFTER this plan

```
npm run test:quick   ->  41 files, 556 passed | 1 todo (557)
npm run test:sweep   ->   1 file,    9 passed
```

**Baseline plus a delta of no files and no tests**, which is the wave's whole point: every gate loops
over the catalog internally, so a green run means the same thing before and after three
configurations were added. Verified through the helper:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 41 556   -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9      -> exit 0
```

**`npm run test:e2e` was not run, and `BASE_E2E = 21` is carried forward unverified.** This plan adds
no route and no component, and the one application consumer of the catalog iterates `FRONT_DOOR`,
which is byte-identical to what Phase 4 left because all three entries went into
`EXCLUDED_FROM_ROW`. The rendered site is unchanged. **Plan 08-07 should re-measure 41 / 556, 1 / 9
and 21 rather than inherit them.**

---

## CONT-02: the seven configurations

| id | name | Setup (defaults) | Timer (defaults) | knobs | featured | restsBlack |
|---|---|---|---|---|---|---|
| `euclid` | EUCLID | 702 | 218 | 6 | yes | false |
| `chorus` | CHORUS | 729 | 173 | 6 | yes | false |
| `arc` | ARC | 379 | 251 | 5 | yes | false |
| `ghost` | GHOST | 305 | 333 | 5 | no | true |
| **`lattice`** | **LATTICE** | **615** | **171** | **6** | **yes** | **false** |
| **`morph`** | **MORPH** | **507** | **0 (no Timer)** | **5** | **yes** | **true** |
| **`sonar`** | **SONAR** | **432** | **279** | **5** | **no** | **false** |

Seven, against a floor of six. Every one is a fixed point of the pinned minifier on both events,
accepted by `checkSyntax`, inside the restricted Lua subset, in budget across its entire knob
cross-product, executing through a real gesture on a real Lua 5.4 VM, and recorded into golden
frames. The catalog holds sixteen entries.

### This wave's three, corner to corner

| | Setup at defaults | Timer at defaults | all-longest corner | all-shortest corner |
|---|---|---|---|---|
| **LATTICE** | **615** (293 free) | **171** (737 free) | 618 / 172 | 612 / 171 |
| **MORPH** | **507** (401 free) | **0** (908 free) | 510 / 0 | 505 / 0 |
| **SONAR** | **432** (476 free) | **279** (629 free) | 433 / 282 | 429 / 279 |

**Every corner landed exactly on the planner's measured number**, first attempt, for all three.

### Byte-identity with the canonical text

**Proved before anything was registered, and proved without retyping a character of Lua.** The
08-05 extraction method was reused verbatim: a script pulled the five canonical strings out of
`08-06-PLAN.md`'s own fenced blocks and the seventeen substitution rows out of its markdown tables,
applied each substitution and asserted its occurrence count per event. A throwaway spec (created,
run, deleted — it is not in the repository) then compared `renderLua(ENTRY)` against those extracted
strings:

```
RT lattice setup rendered 615 canonical 615 identical true
RT lattice timer rendered 171 canonical 171 identical true
RT lattice longest corner 618 / 172   shortest corner 612 / 171
RT morph   setup rendered 507 canonical 507 identical true
RT morph   timer rendered   0 canonical   0 identical true
RT morph   longest corner 510 / 0     shortest corner 505 / 0
RT sonar   setup rendered 432 canonical 432 identical true
RT sonar   timer rendered 279 canonical 279 identical true
RT sonar   longest corner 433 / 282   shortest corner 429 / 279
```

**Nine of nine identical.** Unlike GHOST in wave 5, there is no deliberate exception here: all three
render the canonical text byte for byte at the defaults.

**Every needle in all three substitution tables was found exactly once, in exactly the event the plan
said, on the first attempt.** There is no drift between `08-RESEARCH.md` and the plan for these
three — with the one correction the plan itself carried and which is confirmed below.

### The occurrence table — where each token lives

| entry | needle (canonical) | token | Setup | Timer |
|---|---|---|---|---|
| LATTICE | `self.m={0,2,4,5,7,9,11}` | `@SCALE` | 1 | 0 |
| LATTICE | `local n=36+i%9+(8-i//9)*5` | `@BASE`, `@ROW` | 1 | 0 |
| LATTICE | `local p=(n-36)%12` | `@BASE` | 1 | 0 |
| LATTICE | `glc(a,2,255,180,60,1)` | `@ROOTC` | 1 | 0 |
| LATTICE | `s:gms(0,128,s.n[o],0,0)` | `@CH` | 1 | 0 |
| LATTICE | `s:gms(0,144,s.n[c],100,0)` | `@CH`, `@VEL` | 1 | 0 |
| LATTICE | `s:gms(0,128,s.n[c],0,0)` | `@CH` | 0 | 1 |
| MORPH | `glc(a,2,180,255,255,1)` | `@TRAILC` | 1 | — |
| MORPH | `glc(a,1,255-j*60,j*60,128,1)` | `@SPREAD` (x2) | 1 | — |
| MORPH | `s:gms(0,176,15+j,w[j],0)` | `@CH`, `@CCB` | 1 | — |
| MORPH | `glt(a,2,42)` | `@DECAY` | 1 | — |
| SONAR | `local t={0,3,5,7,10}` | `@RINGS` | 1 | 0 |
| SONAR | `self.o[n]=36+t[d+1]` | `@ROOT` | 1 | 0 |
| SONAR | `glc(c,2,120,255,255,1)` | `@SWEEPC` | 1 | 0 |
| SONAR | `gtt(0,70)` | `@PERIOD` | 1 | 1 |
| SONAR | `s:gms(0,128,s.z[j],0,0)` | `@CH` | 0 | 1 |
| SONAR | `s:gms(0,144,m,100,0)` | `@CH` | 0 | 1 |

Resulting per-event token counts, which are what `lua-entries.spec.ts` test 5 measures:

- **LATTICE Setup** — `@SCALE` 1, `@BASE` **2**, `@ROW` 1, `@ROOTC` 1, `@CH` **2**, `@VEL` 1;
  **Timer** — `@CH` 1.
- **MORPH Setup** — `@TRAILC` 1, `@SPREAD` **2**, `@CCB` 1, `@DECAY` 1, `@CH` 1; **no Timer.**
- **SONAR Setup** — `@RINGS` 1, `@ROOT` 1, `@SWEEPC` 1, `@PERIOD` 1; **Timer** — `@PERIOD` 1,
  `@CH` **2**.

Both of the plan's specific warnings were real and both were honoured mechanically rather than by
eye: **`@BASE` really does occur twice in LATTICE's Setup** (the note table and the scale-degree
test) and **`@SPREAD` really does occur twice in MORPH's corner-colour expression**. Because the
templates were produced by substituting into the canonical text by script, missing one was not
possible — which is the argument for the method.

### SONAR's Timer: the research document's one non-canonical line, confirmed

The plan's correction holds. SONAR stores `if s.v[n]then` — **no space** — which is what the pinned
minifier emits and what `08-RESEARCH.md` prints incorrectly as `if s.v[n] then`. Stored at 279
characters and a fixed point of `compressScript`.

```
grep -c "s.v\[n\]then" src/lib/catalog/entries/sonar.ts   ->  2
```

Two, because the entry's header comment says in prose why the space is absent, immediately above the
line that omits it.

---

## MORPH's empty Timer: no branch anywhere, as predicted

`morph.ts` stores `timer: ""` inline in its `CatalogSource`. **Nothing was special-cased**, and
every gate accepted it unchanged:

| Gate | What it did with the empty string |
|---|---|
| `lua-entries.spec.ts` test 1 (canonical form) | `compressScript("") === ""` — already a fixed point. Green. |
| `lua-entries.spec.ts` test 2 (budget) | `max(0, 0) = 0` characters, 908 free. Green. |
| `lua-entries.spec.ts` test 3 (syntax) | `checkSyntax("") === true`. Green. |
| `lua-entries.spec.ts` test 4 (restricted subset) | Nothing to scan. Green. |
| `lua-entries.spec.ts` test 5 (tokens live and separable) | Every MORPH token lives in the Setup, so `inSetup + inTimer > 0` holds; the Timer's occurrence count is 0 in every event term and the separability identity is `0 === 0 + 0 * delta`. Green. |
| `lua-smoke.spec.ts` | `createLuaHost` is handed `undefined`, not `""` — the mapping `createLuaPadSim` already performs — so MORPH cannot arm a timer at all, which is what firmware does too. Green. |
| `frames.spec.ts` test 5 | `restsBlack: true` proved against an all-zero fixture. Green. |

`git diff --stat HEAD -- src/lib/catalog/*.spec.ts src/lib/sim/*.spec.ts` prints nothing. **No spec
file was modified in this plan at all** — including `lua-smoke.spec.ts`, see the SONAR note below.

The reasoning against adding a keeper is written into `morph.ts` where the next author will look, in
the plan's own terms: the standard `for a=0,80 do glt(a,L,65535) end` applied to a layer whose cells
carry `glpfs(a,L,255,250,0)` + `glt(a,L,<trail>)` replaces the countdown with 65535, the rate keeps
decrementing past zero and wraps, and every touched cell strobes forever. The smoke gate's pitfall-1
guard would catch it; the comment exists so nobody writes it.

---

## Execution: the smoke gate's MIDI table

Reproduce with `SMOKE_REPORT=1 npx vitest run --project server src/lib/sim/lua-smoke.spec.ts
--reporter=verbose`.

| entry | messages in 218 ticks | first three `(ch, cmd, p1, p2, mode)` |
|---|---|---|
| euclid | 76 | `(0,128,36,0,0)` `(0,144,36,100,0)` `(0,128,38,0,0)` |
| chorus | 18 | `(0,144,48,100,0)` `(0,144,52,100,0)` `(0,144,55,100,0)` |
| arc | 109 | `(0,176,16,18,0)` `(0,176,16,31,0)` `(0,176,16,43,0)` |
| ghost | 218 | `(0,176,16,25,0)` `(0,176,17,102,0)` `(0,176,16,38,0)` |
| **lattice** | **14** | `(0,144,72,100,0)` `(0,128,72,0,0)` `(0,144,68,100,0)` |
| **morph** | **28** | `(0,176,16,81,0)` `(0,176,17,20,0)` `(0,176,18,20,0)` |
| **sonar** | **8** | `(0,144,43,100,0)` `(0,128,43,0,0)` `(0,144,43,100,0)` |

- **LATTICE plays, and it plays the right notes.** The drag starts at cell 10 and sounds note 72;
  the finger moves and 72 is released before 68 sounds. Fourteen messages is a note-on / note-off
  pair per cell crossed by the drag, which is legato multi-touch behaving.
- **MORPH sends the whole quartet on every sample.** 28 messages is four CCs per touch sample across
  the seven-step drag, on `16, 17, 18, 19` — `@CCB + j` with the default base of 15. The second
  contact of the tap produced nothing, which is the `i > 0` early return doing its job.
- **SONAR fires.** Eight messages, note-ons paired with note-offs on the following tick, from cells
  the scripted gesture happened to arm.

### The SONAR smoke gesture did NOT have to change

The plan flagged this as the one spec edit it might legitimately need. **It did not need it.**
`lua-smoke.spec.ts` is untouched, and the reason SONAR fires is arithmetic rather than luck: the
scripted tap at `(0.15, 0.45)` of a 127-coordinate pad lands on cell 37, and the drag's press at
`(0.2, 0.2)` arms cell 10 as well; the sweep's period is 70 ms against a 10 ms tick, so one
revolution is 112 ticks and the 218-tick run crosses every angle bucket nearly twice.

### Behaviour, observed rather than asserted

Read off a real Lua 5.4 VM through a throwaway spec (created, run, deleted):

```
BEH lattice note-ons: 36, 37, 41
BEH morph centre (64,64) weights 31,31,31,32 on CC 16,17,18,19
BEH morph top-left (0,0) weights 127,0,0,0 on CC 16,17,18,19
BEH sonar note-ons 2 (notes 46,46), note-offs 2
```

- **LATTICE is isomorphic, confirmed.** Bottom-left cell 36; one column right 37, a semitone; one
  row up **41**, a perfect fourth. **The research and the plan both print `42` for that third
  number and both are wrong by one** — a perfect fourth is five semitones and `36 + 5 = 41`, which
  is also what the formula `base + col + (8 - row) * 5` produces. The prose ("+5 semitones, a
  fourth") is right; only the printed digit was off. Nothing in the configuration changed; the
  document should say 41.
- **MORPH blends bilinearly, confirmed.** Dead centre gives `31,31,31,32` — sum 125, two units of
  floor loss, invisible. The top-left corner gives `127,0,0,0`. Both reproduce the planner's numbers
  exactly, and the CC quartet is `16,17,18,19` as designed.
- **SONAR sequences once per revolution, confirmed.** Arming the top-left corner — Chebyshev ring 4
  — and running two revolutions fired **exactly two note-ons, both note 46**, which is
  `36 + t[5] = 36 + 10`, the pentatonic top. Two note-offs came back with them, so nothing hangs:
  the pending list `s.z` is released by the following fire.
- **No Lua error was raised by any entry**, `pendingTouches` was 0 at the end of every run, and the
  pitfall-1 guard stayed silent for all seven. LATTICE writes no `glt` at all; MORPH's and SONAR's
  are 42-tick countdowns, three orders of magnitude below the guard's keeper floor.

---

## LATTICE lights all 81 cells, and that is why the guard is a signature and not a budget

Recorded: **169 lit bytes at every sampled tick**, unchanged between ticks, one distinct hash.
That is the static three-tone map — roots amber, in-scale blue, out-of-scale `0,25,50` — painted on
layer 2 at phase 255 from Setup across **all 81 cells**, including the deliberately dim ones.

This is the observation the plan asked to be recorded. **A lit-cell ceiling in the smoke gate would
have failed LATTICE for doing exactly what it is designed to do.** 08-04 made the "the pad is not
black" test a non-zero-byte check and made the pitfall-1 guard a *layer-record signature* — a
keeper-height timeout together with a fast decay rate — rather than a cell count, and LATTICE is the
entry that would have broken the alternative. Seven cards in, that design decision is now load
bearing rather than theoretical.

(169 rather than 243 because the out-of-scale cells' blue channel and the roots' unused channels are
genuinely zero bytes; `nonZeroBytes` counts bytes, not cells.)

---

## The golden frames: sixteen entries

```
lattice  tick    0  169 lit bytes  animating true    1 distinct hash
         tick   37  169
         tick  101  169
         tick  500  169
         tick 1009  169

morph    tick    0    0 lit bytes  animating false   1 distinct hash
         tick   37    0
         tick  101    0
         tick  500    0
         tick 1009    0

sonar    tick    0    0 lit bytes  animating true    5 distinct hashes
         tick   37   81
         tick  101  184
         tick  500  194
         tick 1009  188
```

Each row proves its entry's declared `restsBlack` rather than leaving it asserted:

- **LATTICE 169 at every tick, never changing** — lit before any finger arrives and static forever,
  so `restsBlack: false`. It is `animating: true` only because it carries a stored Timer that
  re-arms; nothing on the pad moves.
- **MORPH zero at every tick, one hash, not animating** — the four corner blocks are coloured at
  Setup and left at phase 0, `glc`'s sixth argument forces the minimum stop black, and there is no
  Timer to light anything. `restsBlack: true`.
- **SONAR zero at tick 0 and non-zero at every tick after** — the sweep's first fire lands at 70 ms,
  seven ticks in. Only tick 0 is black, so the entry does not rest black. Five distinct hashes is
  the sweep rotating. `restsBlack: false`.

### The darkness cross-check

Run as a second, independent reading of the fixture, separate from `frames.spec.ts` test 5:

```
morph: one distinct hash                          PASS
morph, ghost, tpad: nonZeroBytes 0 at every tick   PASS
morph, tpad: animating false at every tick         PASS
euclid, chorus, arc, lattice, sonar: some tick > 0  PASS
```

**MORPH is exactly what the plan predicted: one distinct hash, all-zero at every tick, not animating
at rest.** No pitfall-1 arrived by another door.

**One clause of the plan's cross-check script is wrong, and it is worth writing down.** The script as
printed asserts `animating === false` for `morph`, `ghost` and `tpad` together. **GHOST is
`animating: true`, it always was, and it is correct.** `LuaPadSim.animating` is
`host.animating || host.timerArmed`, and GHOST has a stored Timer that re-arms on every fire — which
is the entire mechanism by which its ghost keeps replaying after the finger lifts. Reporting it as
settled would freeze it in the row a fraction of a second after Setup, which is the reason that `||`
exists. The evidence that nothing regressed is direct: **GHOST's five records are byte-identical to
the ones wave 5 recorded**, `animating: true` included.

So the honest form of the check is: *darkness* for all three (`morph`, `ghost`, `tpad`), and
*not animating* only for the two entries that have **no Timer at all** (`morph`, `tpad`). In that
form it passes. No gate was changed — `frames.spec.ts` test 5 asserts darkness against `restsBlack`
and says nothing about `animating`, so nothing in the repository ever held the wrong belief.

### The three required checks on the regeneration

1. **The nine ported records are byte-identical to before.**
2. **EUCLID, CHORUS, ARC and GHOST's records are byte-identical to before.**

Compared record by record against a copy taken before regeneration:

```
prior records compared: 13   byte-identical: 13   changed: []
note identical: true   ticks identical: true
after entry count: 16
```

A changed ported hash would have meant the engine selector broke `PadSim`'s path; a changed
hand-authored hash would have meant the Lua route moved under it. Neither did.

3. **Two consecutive regenerations are byte-identical.** Two `UPDATE_FRAMES=1` runs back to back
   produced files `diff -q` reports identical. After committing the fixture a third regeneration was
   run and `git diff --quiet -- src/lib/catalog/frames.json` exited **0**, which is the acceptance
   criterion in its literal form (it can only be satisfied against a committed fixture, since the
   first regeneration necessarily differs from `HEAD`). Prettier collapsed the primitive `ticks`
   array onto one line, as documented; nothing was hand-formatted.

Regeneration behaved exactly as documented: `UPDATE_FRAMES=1` rewrote, shelled out to
`npx prettier --write`, and **failed by design** with `Tests 1 failed | 4 passed (5)`. Re-run clean:
**5 passed**.

---

## The knob value sets

`kind` is drawn from the vendored compiler's own `KnobKind` union (D-12) in every case. `default` is
an INDEX, and `defaults` repeats those indices by knob id.

### LATTICE — six knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `scale` | Scale | `scale` | `@SCALE` | **`0,2,4,5,7,9,11`** (major), `0,2,3,5,7,8,10` (natural minor), `0,2,3,5,7,9,10`, `0,2,4,5,7,9,10`, `0,2,4,6,7,9,11`, `0,1,3,5,7,8,10` | index 0 |
| `base` | Root note | `note` | `@BASE` | `24`, `31`, **`36`**, `43`, `48`, `60` | index 2 |
| `rowInterval` | Row interval | `size` | `@ROW` | **`5`** (fourths), `3` (minor thirds), `4` (major thirds), `2` (whole tone) | index 0 |
| `rootColour` | Root colour | `colour` | `@ROOTC` | **`255,180,60`**, `255,255,255`, `255,60,0`, `0,255,140`, `255,0,120` | index 0 |
| `velocity` | Velocity | `amount` | `@VEL` | `40`, `70`, **`100`**, `127` | index 2 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

The four row intervals the plan asked for are all there. Every scale table is fourteen characters
and every root two digits, so the corner is decided entirely by `@ROOTC` (+1) and `@CH` (+1 per
occurrence): 615 + 1 + 2 = **618** Setup, 171 + 1 = **172** Timer. Sweep: `6+6+4+5+4+16 + 2 = 43`
combinations.

### MORPH — five knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `trailColour` | Trail colour | `colour` | `@TRAILC` | **`180,255,255`**, `255,255,255`, `0,200,255`, `255,180,120`, `120,255,180` | index 0 |
| `hueSpread` | Hue spread | **`amount`** | `@SPREAD` | `20`, `40`, **`60`**, `85` | index 2 |
| `ccBase` | CC base | `amount` | `@CCB` | **`15`**, `20`, `40`, `70`, `110` | index 0 |
| `trail` | Trail length | `size` | `@DECAY` | `20`, **`42`**, `80`, `120` | index 1 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

**Every `@CCB` value is at or under 110**, so the fourth consecutive CC is at most 114 and the whole
quartet stays inside the 0..127 controller range. Nothing asserts that in a spec; the values were
chosen so it is true and `morph.ts` says so in a comment, exactly as the plan directed.

**`@SPREAD` is capped at 85** for a reason the plan did not state and the entry now does: corner
`j = 3` is handed `255 - 3 * spread` on red and `3 * spread` on green, which at 85 is exactly 0 and
255. Anything larger wraps red round the firmware's truncation boundary into a bright colour where
the design wants none. Every value is two characters, so `hueSpread` costs the corner nothing
despite appearing twice.

Corner: 507 + 1 (`@CCB`) + 1 (`@DECAY`) + 1 (`@CH`) = **510**. Sweep: `5+4+5+4+16 + 2 = 36`
combinations.

**The two knob-kind choices are written into the entry's comment**, in the plan's own terms, so they
are not re-argued: `hueSpread` is `amount` and not `colour` because its value is a single scalar a
colour picker cannot render; and MIDI channel and CC number are `amount` deliberately, because the
vendored `KnobKind` union has no MIDI-destination kind and D-12 forbids inventing a Lua-specific
one. Every `@CH`, `@CC` and `@CCB` knob in this phase is `amount` for that reason.

### SONAR — five knobs

| id | label | kind | token | values (display order) | default |
|---|---|---|---|---|---|
| `rings` | Ring scale | `scale` | `@RINGS` | **`0,3,5,7,10`** (minor pentatonic), `0,2,4,7,9` (major pentatonic), `0,2,4,6,8` (whole tone), `0,2,3,7,9`, `0,1,5,7,10` | index 0 |
| `root` | Root note | `note` | `@ROOT` | `24`, `31`, **`36`**, `43`, `48` | index 2 |
| `sweepColour` | Sweep colour | `colour` | `@SWEEPC` | **`120,255,255`**, `255,60,120`, `0,255,140`, `255,255,255`, `180,0,255` | index 0 |
| `sweep` | Sweep speed | `speed` | `@PERIOD` | `40`, `55`, **`70`**, `110`, `160` | index 2 |
| `channel` | MIDI channel | `amount` | `@CH` | **`0`** through `15` | index 0 |

**Every `@RINGS` value has exactly five entries**, because a 9x9 grid has exactly five Chebyshev
rings and the Setup indexes `t[d+1]` for `d` in 0..4 — a four-entry table would leave the outer ring
`nil` and silent. Corner: Setup 432 + 1 (`@PERIOD`) = **433**; Timer 279 + 1 (`@PERIOD`) + 2
(`@CH` twice) = **282**. Sweep: `5+5+5+5+16 + 2 = 38` combinations.

The whole gate now measures `47 + 46 + 36 + 37 + 43 + 36 + 38 = 283` knob combinations, two events
each.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Two substitution tokens renamed to avoid prefix capture**

- **Found during:** Task 2 (design of MORPH's and SONAR's knob sets, before either file was written)
- **Issue:** `renderLua` substitutes with plain `String.replaceAll`, in knob-array order, and
  `lua-entries.spec.ts` test 5 counts a token's occurrences per event with a plain `split`. The plan
  specifies `@TRAILC` **and** `@TRAIL` for MORPH, and `@SWEEPC` **and** `@SWEEP` for SONAR. In each
  pair the second token is a strict PREFIX of the first, which breaks in two independent ways:
  substituting the short token first rewrites `@TRAILC` to `42C` and `@SWEEPC` to `70C` — a colour
  argument that is not a number; and even with the long token ordered first, the occurrence count
  for `@SWEEP` in SONAR's Setup template reads **2** where the knob only moves **1**, so the
  separability identity in test 5 fails by exactly the difference.
- **Fix:** the trail-length knob carries **`@DECAY`** and the sweep-period knob carries
  **`@PERIOD`**. Both renames are confined to the substitution token: the knob ids stay `trail` and
  `sweep`, the labels, kinds and value sets are unchanged, and **the rendered Lua is byte-identical
  to the canonical text either way** — a token name never reaches the pad. The corner arithmetic is
  therefore unchanged and both entries land on the planner's measured numbers.
- **Files modified:** `src/lib/catalog/entries/morph.ts`, `src/lib/catalog/entries/sonar.ts` (the
  rename is applied inside the extraction script, so the templates were never typed by hand)
- **Commit:** `0984240`

  Both entries carry a header paragraph explaining the hazard, because it is a property of
  `renderLua` that every future entry has to respect: **no substitution token may be a prefix of
  another token in the same entry.** That is now the first thing wave 7 and Phase 5 will read in
  either file.

**2. [Rule 2 - Clarity] MORPH stores `timer: ""` inline rather than through a named constant**

- **Found during:** Task 2 verification
- **Issue:** the sibling entries all declare `const TIMER = "..."` and then
  `{ kind: "lua", setup: SETUP, timer: TIMER }`. Following that shape gave MORPH a named constant
  holding nothing, which reads as an unfinished file and is an invitation to fill it in — precisely
  the reflex the plan spends a paragraph warning against.
- **Fix:** `const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };` with a comment
  above it saying why. The plan's acceptance criterion
  (`grep -q 'timer: ""' src/lib/catalog/entries/morph.ts`) reads the fact directly as a result.
- **Files modified:** `src/lib/catalog/entries/morph.ts`
- **Commit:** `0984240`

### Not deviations, recorded because the next reader needs them

- **No gate was edited and no spec file was touched.**
  `git diff --stat HEAD -- src/lib/catalog/*.spec.ts src/lib/sim/*.spec.ts` prints nothing. In
  particular **the SONAR smoke gesture did not have to change** — the one spec edit this plan was
  pre-authorised to make was not needed.
- **No Grid global had to be registered.** LATTICE uses `pairs`, SONAR uses `math.atan`, `math.max`
  and `math.abs` and the length operator, MORPH uses nothing new. All were already in 08-02's host
  and all are inside `lua-entries.spec.ts`'s numeric-library whitelist. `src/lib/sim/lua-host.ts` is
  unchanged.
- **No description hit the 110-character cap.** LATTICE 84, MORPH 94, SONAR 98 characters, each
  checked before the file was written.
- **The LATTICE `42` in the research and the plan is an off-by-one in the prose.** Measured: 36, 37,
  **41**. See the behaviour section. No code consequence; `lattice.ts` never quotes the wrong number.
- **The plan's frames cross-check over-asserts on GHOST.** See the darkness section. No code
  consequence; the fixture and the entry both already say the right thing.

---

## The `EXCLUDED_FROM_ROW` branch

**The conditional branch was taken: `src/lib/catalog/front-door.ts` exists**, so all three entries
were registered in `EXCLUDED_FROM_ROW` with the same one-line `why` the four earlier entries carry:

```ts
{ id: "lattice", why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog." },
{ id: "morph",   why: "..." },
{ id: "sonar",   why: "..." },
```

**The exclusion list went from five entries to eight** (`tpad`, `euclid`, `chorus`, `arc`, `ghost`,
`lattice`, `morph`, `sonar`).

**`front-door.spec.ts` needed no change and no literal was touched — it still reports 8 passed.**
There was no exclusion-count literal to update: Phase 4's partition test derives every number it
prints from the data and asserts only the partition. `FRONT_DOOR` itself is byte-identical to what
Phase 4 left, so nothing the visitor sees moved.

Two of its guards still deserve the wave-5 note, now with a second dark Lua entry in the tree: the
"only dark preset" and the `restsBlack`-versus-derived-motion assertions both range over
`src/lib/fidelity/golden-frames.json`, the nine-preset Phase 3 fixture, filtered on presence. Neither
GHOST nor MORPH has a record there, so both are invisible to them and `tpad` is still the only dark
preset by that spec's reckoning — correct, not a gap, because the Lua entries' darkness is gated by
`frames.spec.ts` test 5 against `frames.json`, the fixture that actually records them. The per-row
`preview === "padsim"` assertion remains the one line Phase 4/5.1 must revisit when the first Lua
entry actually joins the row.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/lua-entries.spec.ts` | 1 file, **6 passed** (count unmoved from 08-04) |
| `npx vitest run --project server src/lib/sim/lua-smoke.spec.ts` | 1 file, **3 passed** (count unmoved) |
| `npx vitest run --project server src/lib/catalog/frames.spec.ts` | 1 file, **5 passed** |
| `npx vitest run --project server src/lib/catalog/catalog.spec.ts` | 1 file, **10 passed** |
| `npx vitest run --project server src/lib/catalog/front-door.spec.ts` | 1 file, **8 passed**, unedited |
| `npx vitest run --project server src/lib/fidelity/lua-parity.spec.ts` | 1 file, **5 passed** |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | 1 file, **14 passed** |
| `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 41 556` | exit 0 (**41 / 556 \| 1 todo**) |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| `npm run check` | 452 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --stat HEAD -- src/vendor/` | prints nothing |
| `git diff --stat HEAD -- src/lib/catalog/*.spec.ts src/lib/sim/*.spec.ts` | prints nothing — no spec file was modified |
| `ls src/lib/catalog/entries/*.ts \| wc -l` | **8** — `ported` plus the seven hand-authored entries |
| `grep -c 'timer: ""' src/lib/catalog/entries/morph.ts` | `1` |
| `grep -c "s.v\[n\]then" src/lib/catalog/entries/sonar.ts` | `2` |
| `@BASE` occurrences in `lattice.ts` | `6` — two Lua sites plus the knob declaration and its prose |
| `frames.json` shape | **16 entries**, names all seven hand-authored ones; ticks `0,37,101,500,1009` |
| Repository clean of scratch files | confirmed — `git status --short` shows only the plan's own files at every commit |

### Gate cost at seven entries

| Spec | Wall | `tests` segment |
|---|---|---|
| `lua-entries.spec.ts` | **4.81 s** | 2.45 s |
| `lua-smoke.spec.ts` | **675 ms** | 130 ms |

08-05 predicted "roughly 4 s for `lua-entries.spec.ts` at seven entries" and it came in at 4.8 s,
measuring 283 knob combinations across two events each. **Still under the 10-second threshold 08-04
set for flagging in `docs/TESTING.md`**, but it is now the single most expensive spec in the server
project and it grows linearly with the catalog. Plan 08-07 should record the number; the next wave
that adds entries should expect roughly 0.7 s each.

---

## What remains unshipped

D-04 named nine candidates and this phase ships seven. Three did not land, and none of them is
blocked on anything this phase built:

- **MIRROR** — "four faders your DAW can move back". **Blocked on hardware.** It is the only
  candidate that depends on MIDI *input* reaching the module, which cannot be simulated here and
  cannot be verified without a real ZONA on a real DAW. It stays out until the Phase 6/7 hardware
  audition can test it.
- **STEP** — "a nine-step sequencer you draw with a finger". Available as a **one-file follow-on**:
  the research measured it at 470 / 262 and every mechanism it needs now exists.
- **RIBBON** — "a pitch ribbon with real glissando". Also a **one-file follow-on**, measured at
  708 / 111. It is the only candidate that unlocks the hi-res coordinate range with `txma`/`tyma`,
  which the smoke gate already handles by expressing its gesture in fractions of `coordMax`.

Either of the two would cost one entry file, one registration, one `EXCLUDED_FROM_ROW` line and one
`frames.json` regeneration — the whole machinery is built and proven over seven entries.

---

## Notes for plan 08-07

- **Re-measure the suite baseline. 41 / 556 (quick), 1 / 9 (sweep), 21 (e2e, carried unverified)** is
  what this plan left behind — unchanged from 08-04 and 08-05, which is the point of the design.
- **No substitution token may be a prefix of another token in the same entry.** This wave found it
  twice in one plan. If `docs/TESTING.md` gains a line about authoring entries, this is the line.
- **`lua-entries.spec.ts` is now 4.81 s** and is the most expensive spec in the project. Worth a
  sentence in `docs/TESTING.md` alongside the sweep's cost.
- **Two documents carry small errors this plan proved:** `08-RESEARCH.md` and `08-06-PLAN.md` print
  LATTICE's third measured note as 42 where it is 41, and `08-06-PLAN.md`'s frames cross-check
  asserts GHOST is not animating when it correctly is. Neither has a code consequence; both are
  worth fixing if those documents are revised.
- **The extraction method worked a second time.** Pulling the canonical Lua and its substitution
  table out of the PLAN's own fenced blocks and markdown tables by script, applying the token
  renames inside that script, and asserting each needle's occurrence count per event before writing
  any entry file, made "a needle was mistyped" and "one of the two `@BASE` sites was missed"
  structurally impossible. The script lived in the scratchpad, not the repository.

## Self-Check: PASSED

All three created files and all three modified files exist on disk. All three commits (`a2e7a95`,
`0984240`, `061d584`) are present in `git log`. No scratch file remains in the repository —
`git status --short` is clean of `*.tmp.spec.ts`.

## Requirements

`requirements: [CONT-02, CONT-03, TUNE-01]` in the plan frontmatter is phase-level attribution.
**CONT-02 is marked complete in `.planning/REQUIREMENTS.md` by this plan** (checkbox and
traceability row both). CONT-03 and TUNE-01 are NOT marked: they are owned by Phases 4 and 5
respectively and this plan delivers their data, not their acceptance.

- **CONT-02** ("at least six new configurations authored for spectacle are in the catalog, each
  fitting the 908/908 budget at its default knob positions and verified in the simulator") is
  **satisfied, with one to spare**. Seven configurations, each in budget at its defaults and across
  its entire knob cross-product, each verified in the simulator through a real gesture on a real Lua
  VM, each recorded into golden frames. **This is the plan that marks it**, per the 08-05 handover.
- **CONT-03** is satisfied by all sixteen entries and its gate (`catalog.spec.ts` tests 1, 7 and 8)
  is green over all of them. It stays open because REQUIREMENTS.md assigns it to Phase 4, with Phase
  8 owning the metadata gate for new entries.
- **TUNE-01** now has its data for seven entries: thirty-eight knobs in total, every `kind` drawn
  from the vendored compiler's own `KnobKind` union. The requirement is owned by Phase 5, which
  builds the widgets.
