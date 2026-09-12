---
phase: 13-gui-overhaul
plan: 14
subsystem: sandbox, store, catalog
tags: [sandbox, region-model, cell-map, named-door, emitter, dead-branch, picker-corner, cost, finding, three-slots, touch-guard]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 13
    provides: "Region, Surface, ElementKind, SURFACE_SIZE and SURFACE_ELEMENT_CAP in src/lib/store/schema.ts; transfer.ts's import-side bounds / overlap / cap check over the same numbers; IMPORT_REASONS' three sentences"
  - phase: 13-gui-overhaul
    plan: 02
    provides: "SLOT-ARITHMETIC.md: the recorded answer three-slots, ele[#ele] as the spelling that lit, both pull-in calls handed to 13-14, every per-kind figure labelled an unrun sketch's"
  - phase: 13-gui-overhaul
    plan: 12
    provides: "PREV_FILES 90 / PREV_TESTS 936 (+1 todo) as the tree stood at 5c256c5 after 12.1-09 (the plan's carried 89 / 910 predates 13-13, 12.1's Band 2 and the gate)"
  - phase: 12.1-gradient-touch
    plan: 08b
    provides: "the library as shipped: U W E Q X N in 255/0 (842 / 66 free), V G Z Y K A D in 255/6 (873 / 35 free), twenty-one names in LIBRARY_GLOBALS, N(x,y) the nearest calibrated cell, library.ts unchanged from here on"
  - phase: 12.1-gradient-touch
    plan: 02
    provides: "the calibrated map KX / KY in calibration.ts, U over the knots, the two-slot library"
  - phase: 12.1-gradient-touch
    plan: 07
    provides: "landLua publishing four fields (systemTimer, system, setup, timer); a Lua entry lands TOUCH_LIBRARY_TIMER and TOUCH_LIBRARY - the shape the Sandbox's install will take at 13-17"
provides:
  - "src/lib/sandbox/model.ts: 13-13's shapes re-exported, a fader's orientation, toDisplay / fromDisplay as the named door citing knobPosition and colourPosition, wireChannel, typeCodeOf and branchOf (1 fader-v, 2 fader-h, 3 button, 4 xy, 5 knob), branchesUsed, colourByte and PICKER_CORNER, the minimum size per kind as a PARAMETER with a provisional 3x3 Knob default"
  - "src/lib/sandbox/geometry.ts: buildCellMap (81 entries, one 1-based index per cell, a conflict names both and returns NO map), validate with the field named, applyEdit / addRegion returning the surface handed in on a failed edit, freeWindow / duplicate in reading order that never deletes, adjacencyWarnings that never block, GEOMETRY_COPY and overlapLine (section 16 verbatim)"
  - "src/lib/sandbox/emit.ts: J={{x0,x1,y0,y1,t,cc,cc2,ch,r,g,b}} with raw bounds precomputed from the measured knots, M={[0]=...} rendered from geometry.ts's own array so the lookup is M[N(x,y)], the paint loop, self:tim() and (slots 3) ele[#ele]:map(), self.touch_cb=O for 13-15's entry; the inline contingency over four branch texts through E, N, X and the R convention; capitalCalls / capitalDefinitions"
  - "src/lib/sandbox/cost.ts: canonical() to a fixed point, measureSurface, costOf at the picker corner, roomFor by adding the surface's own largest shape and re-measuring"
  - "src/lib/catalog/touch-guard.ts: the class-B gate's scanner as a module (moved verbatim), so the emitter's spec runs the gate's own needles"
  - "FIVE COSTS at the dearest literals (three-digit controllers, channel 16, the colour corner): 343 / 457 / 608 / 764 / 922 at two slots, +15 at three - the research's 366 / 498 / 652 / 811 corrected by +91 / +110 / +112 / +111"
  - "THE FINDING: the dearest sixteen do not fit (922, 14 over); the cap at those literals is FIFTEEN at either slot count; sixteen at typed literals (cc 1..16, channel 1) fit at 881 / 896. D-14 Q4's sixteen stands because the meter is the gate"
  - "the dead-branch pair re-measured: 806 / 1,341, a saving of 535 (the research's 697 / 1,166 / 469); M 169 (165), J at four rows 152 (141), the paint 101"
affects: [13-15 (O is the runtime entry; M[N(x,y)] is the lookup; the row layout; the branches parameter; the third pull-in's page-flip hazard; the provisional Knob minimum and rest phase; the inline contingency's text as a starting point), 13-16 (toDisplay / fromDisplay; GEOMETRY_COPY; applyEdit's contract; adjacencyWarnings; duplicate's mint), 13-17 (slots: 3 is safe only once 255/4 is written; the Sandbox lands four strings like a Lua entry), 13-18 (four ledger rows and two questions; the import-side and Sandbox-side sentences to unify), 13-20 (the Phase 13 offset +2 / +9)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A rule is a data structure before it is a check: the cell map holds one index per cell, so an overlapping surface has no map and cannot be emitted; the validator and the emitter read the same array"
    - "A shape that another plan already put in the tree is extended and re-exported, never re-declared: model.ts imports Region, Surface, the kinds, the size and the cap from schema.ts and adds the door, the codes and the parameter beside them"
    - "A name the emitter chooses is asserted disjoint from LIBRARY_GLOBALS as exported, and every capital call site is asserted inside it: the plan's G and Y() were the library's by the time the plan ran"
    - "A gate's needles become a module the day a second corpus has to obey them: touch-guard.ts is the scanner, touch-guard.spec.ts and emit.spec.ts are two callers, and no third copy exists"
    - "A cost over 908 is recorded, pinned and named as a finding with the count it broke at and what the cap becomes, not smoothed by a cheaper fixture"

key-files:
  created:
    - src/lib/sandbox/model.ts
    - src/lib/sandbox/geometry.ts
    - src/lib/sandbox/geometry.spec.ts
    - src/lib/sandbox/emit.ts
    - src/lib/sandbox/emit.spec.ts
    - src/lib/sandbox/cost.ts
    - src/lib/catalog/touch-guard.ts
  modified:
    - src/lib/store/schema.ts
    - src/lib/catalog/touch-guard.spec.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md

key-decisions:
  - "The Surface shape carries no schema of its own: 13-13's envelope rule puts the version on the SandboxRecord that carries the surface, a surface never travels alone, and schema.ts's header records why the plan's `schema: 1` on the Surface was not added (question 2 for 13-18)"
  - "A fader's orientation is a field on 13-13's Region, not a fifth and sixth kind: absent means vertical so no record moves, the Bible's inspector lists orientation under Geometry, and transfer.spec / local.spec's fixtures still validate"
  - "The region table is J and the map is M, not the plan's G and Y(): G, Y, Z, S, N and K are the library's since 12.1, asserted by test 5 against LIBRARY_GLOBALS as exported"
  - "M is [0]=-indexed so the lookup is M[N(x,y)] exactly as the hand-off names it: four characters once against two per lookup"
  - "The bounds are the raw span of the region's cells under the MEASURED map (midpoints between the knots, 0 and 127 at the edges), not col*128//9: a finger the map says is in the region is inside the fader's bounds"
  - "The third pull-in (ele[#ele]:map()) is a parameter that defaults OFF: 255/4 holds the firmware's page-next until 13-17 writes it, so an emitted call today would turn the page on every load. Emitted against three slots when asked, measured under both, with the fifteen-character difference asserted"
  - "The paint is a bare loop, not a function: nothing clears layer 1 (V clears the layer G last drew on, and a Sandbox finger is drawn above the regions), so no caller would ever re-paint; sixteen characters saved, the dearest sixteen still over"
  - "roomFor adds the surface's own LARGEST shape and re-measures, then single cells: a one-cell representative beside a 2 x 6 reported room the 2 x 6 did not have (15 at the cap beside one fader before the correction, 14 at the budget after)"
  - "The class-B gate's scanner was moved out of touch-guard.spec.ts into touch-guard.ts verbatim rather than re-assembled a third time (library.spec.ts already re-assembles it once): the plan says run the gate's own needles, and a module is the only way that sentence is literally true"
  - "The inline contingency is retained with four branch texts and no Knob; the split is chosen for every surface because the inline form has no rotary and no room for one (806 of 908 with the fader branch alone)"

requirements: [BUILD-01, BUILD-02, BUILD-03, CONT-02]
requirements-completed: []

# Metrics
duration: about 85 min of execution (00:28Z-01:54Z: the baseline run, two tasks, six negative checks, three whole quick runs, the sweep, svelte-check) plus this document and STATE.md
completed: 2026-09-12
---

# Phase 13 Plan 14: The Sandbox's Data Half Summary

**A region model whose rules are unrepresentable to break, and an emitter whose cost is measured
rather than hoped - with one finding.** The cell map holds one index per cell, so an overlapping
surface has no map and cannot be emitted; the same array is the validator's and the emitter's `M`.
The one-based/zero-based translation is a named door (`toDisplay` / `fromDisplay`) citing
`knobPosition` and `colourPosition`. Six geometry rules land in four tests, including a failed
duplicate that leaves the region list byte-identical and a warning that never blocks. The emitter
writes `J`, `M` and a paint loop with every bound precomputed in raw units from the measured knots,
pulls the runtime in from the slots 13-02 recorded, and installs 13-15's entry as the callback; the
cost function measures under the pinned minifier at the picker corner and answers "room for about
M more" by re-measuring. **Five costs at the dearest literals: 343 / 457 / 608 / 764 / 922** against
the research's 366 / 498 / 652 / 811 - **the dearest sixteen do not fit** (14 over), the cap at those
literals is **fifteen** at either slot count, and sixteen at the literals a visitor types fit at
881 / 896. The dead-branch pair re-measured at 806 / 1,341 (saving 535). Both class gates run over
the emitted text with the gate's own needles, now a module. Term **`+2 / +9`** on the observed 90 /
936 (+1 todo): **92 / 945 (+1 todo)**, twice green whole. **Nothing was installed; no device was
touched.**

## The baseline, observed at start and at close

HEAD `5c256c5` (12.1-09's gate summary). Observed before an edit was made: **90 files / 936 tests
(+1 todo)**, 43.0 s at `--maxWorkers=2`; e2e 80 titles by `grep -c "test("`; check 627 / 0 / 0.
The plan's carried `89 / 910` and its `check-counts 91 919` literal predate 13-13 (+2 / +8), 12.1's
Band 2 (+0 / +8) and the gate; the brief's `92 / 945` is the figure this plan asserted.

| Count | Start (observed) | Close | Delta |
| --- | --- | --- | --- |
| quick suite | **90 / 936** (+1 todo) at `5c256c5` | **92 / 945** (+1 todo), twice green whole (`check-counts 92 945` on runs 2 and 3 at `--maxWorkers=2`; run 1 had the named transient, below) | **`+2 / +9`**: `geometry.spec` 4, `emit.spec` 5 |
| check | 627 / 0 / 0 | **634** / 0 / 0 (seven files: the six new `.ts` and the moved scanner) | +7 files |
| lint | clean | clean | - |
| e2e | 80 titles / 96 runs | 80 by `grep -c "test("`; the suite not run (no e2e file moved) | `+0 / +0` |
| catalog | 26 = 8 + 18 | 26 | 0 |
| sweep | `4 19` | `4 19` RUN once at close, 100.7 s, 19 green | 0, by choice |
| library | 842 / 66 + 873 / 35 | the same; `git diff --quiet -- src/lib/catalog/library.ts` holds | read, never edited |
| touch-guard.spec | 3 tests | 3 tests, on the module | 0 |
| vendor, oracle, ROADMAP | - | `git diff --quiet` holds on all three | untouched |

## Commits

| Hash | Message |
| --- | --- |
| `e570457` | `feat(13-14): the region model on 13-13's shapes with a fader's orientation and the named door, the cell map that makes overlap unrepresentable, six geometry rules in four tests, and three strings ledgered` |
| `0975651` | `feat(13-14): the emitter with J, M and the paint on the calibrated knots, dead-branch elimination as a parameter with an inline contingency, the cost measured at the picker corner, five costs pinned with the dearest sixteen recorded as a finding, and the class-B gate's scanner shared` |

`git commit --only <paths> -F <message-file>`, pathspec before the flag; new files `git add`ed
first. No push, no attribution, no trailer.

## Task 13-14-01: the model, the door, six rules (`e570457`)

**The `Surface` shape decision against 13-13's `schema.ts`.** 13-13 had already put `Region`,
`Surface`, `ElementKind` (four kinds), `SURFACE_SIZE` and `SURFACE_ELEMENT_CAP` in `schema.ts`, with
the header saying 13-14 "owns the region model and may widen this" and "imports both rather than
re-declaring". So `model.ts` **re-exports** all of them and re-declares nothing. Two things were
added to the schema: a fader's `orientation?: "vertical" | "horizontal"` (the Bible's inspector lists
orientation under Geometry; absent means vertical, so every record written before the field existed
still reads as drawn and `isRegion` accepts both), and a header paragraph on the version. **The
plan's `schema: 1` on the `Surface` was NOT added**: the tree's envelope rule puts the version on
the `SandboxRecord` that carries the surface (13-13), a surface never travels alone (`transfer.ts`
exports the record), and a second `schema` on the nested object would be one number in two places.
Recorded in `schema.ts`'s header and as question 2 in the ledger.

**The named door.** `toDisplay(0) = 1`, `fromDisplay(1) = 0`, with `model.ts` section 2 citing
`knobPosition` and `colourPosition` and quoting `view.ts`'s own lesson (the inline `knob.index` read
that disabled KEEP ON DEVICE after a write nobody touched). `wireChannel` (1..16 -> 0..15) is a
second door for the same reason. Test 1 drives both ways at both ends and the round trip on all nine.

**The six rules.**

| Rule | Where | Proof |
| --- | --- | --- |
| 1 on the surface, field named | `offSurfaceField`, `validate` | eight refusals (a 2x6 at row 4 -> `h`; a 9x1 at column 1 -> `w`; zero width and height; negative and past-the-edge origins), five acceptances (four corners, the whole 9x9) |
| 2 no overlap | `buildCellMap` | Filter 2x6 and Space 3x3 sharing cell (1, 5): conflict `["Filter", "Space"]` at 41, and **`"map" in result` is false** - never half-built; one cell apart, the tally is 60 / 12 / 9 |
| 3 minimum size per kind | `validate(…, { minimums })` | a 2x2 Knob refused under the provisional default, admitted under `{ knob: { w: 2, h: 2 } }` - **a parameter change, not a rewrite**, which is what 13-15 needs |
| 4 duplicate to a free area | `freeWindow`, `duplicate` | reading order (`(2, 0)`, not under Filter); a full surface returns `no-space` with the SAME surface object and `JSON.stringify(regions)` byte-identical |
| 5 the previous valid value survives | `applyEdit`, `addRegion` | the failed edit returns the surface handed in (`toBe`, not `toEqual`); a valid edit lands without mutating the original |
| 6 edge adjacency warns, never blocks | `edgeAdjacent`, `adjacencyWarnings` | Filter/Space (shared edge) and Filter/Go (stacked) warn naming both; one cell of gap and a corner-to-corner touch do not; the warned surface still validates, adds and builds |

The cap is asserted with the seventeenth 1x1 button (refused with `GEOMETRY_COPY.cap(16)`, the
surface untouched) and with `duplicate` at the cap (`reason: "cap"`, bytes identical).

**Three negative checks**, each from a scratch copy, restored by copy-back with `sha256sum -c`:

| # | Check | Red on |
| --- | --- | --- |
| N1 | a cell written twice admitted (`holder !== 0 && false`) | test 2: "expected true to be false" on `built.ok` |
| N2 | the half-built array returned beside the conflict | test 2: "a conflict result has no map: expected true to be false" |
| N3 | a failed duplicate filtering the source out | test 3: "the surface handed in, untouched: expected … to be …" (`Object.is`) |

**The strings** (`GEOMETRY_COPY`, `overlapLine`): the overlap line is section 16's row verbatim
with the other region's name in Filter's place and is not ledgered; `offSurface(field)`,
`adjacency(a, b)` and `cap(cap)` are ledgered in `13-COPY-NEW.md` under "From 13-14", and
`tooSmall(kind, w, h)` beside them as a **placeholder 13-15 replaces** with the dead-zone reason.

## Task 13-14-02: the emitter, the pair, the five costs (`0975651`)

**The ceiling emitted against, and its document.** `SLOT-ARITHMETIC.md` section 5 records the
user's answer as **`three-slots`** (D-18 chose the second probe; the probe lit cell 80 at
`ff3f7b0`). The emitter takes `slots: 2 | 3` and under 3 writes both pull-ins, `self:tim()` (probe
1) and `ele[#ele]:map()` (probe 2; `ele[#ele]` is the spelling that lit; `map` is the firmware's
short name for the mapmode event, `GRID_LUA_FNC_A_MAPMODE_short` in
`../grid-fw/common/src/c/grid_protocol.h:879`, read and not edited - the name SLOT-ARITHMETIC
section 6 said 13-15 would read; it is read here and 13-15 confirms it with the tap). **The
ceiling in element kinds is the runtime's, 13-02's per-kind figures descend from an unrun sketch,
and 13-15 measures the real runtime; the data half is the same under every answer, and this plan
says so rather than choosing a ceiling.** What it does choose is the DEFAULT: `slots` defaults to
**2**, for a reason that is safety and not budget - **HANGAR does not write 255/4 until 13-17 lands
(D-19), and until then that slot holds the firmware's default, page-next (`gpl(gpn())`), so a Setup
that called `ele[#ele]:map()` on an untouched module would turn the page on every load.** Both
figures are measured and the fifteen-character difference is asserted; 13-17 flips the default when
its write and PUT BACK exist. **SLOT-ARITHMETIC's five-slot table is stale in one row**: "system
Timer 255/6 - nothing, never asked" - 255/6 holds `TOUCH_LIBRARY_TIMER` (873 / 35) since 12.1-02.
The two library slots plus 255/4 plus the two touch slots are the five.

**The names.** The plan's interfaces block calls the region table `G` and the paint `Y()`, and
13-02's sketch keeps state in `S`, `N` and `K`. **All six are the library's now** (`G` the bilinear
finger, `Y` a corner weight, `Z` the block, `N` the cell, `K` the stamp). The emitter's own names are
`J` (the table), `M` (the map), `O` (13-15's runtime entry, spelled once here as `RUNTIME_ENTRY`),
and under the inline contingency `S`, `F` and `R`. Test 5 asserts every definition outside
`LIBRARY_GLOBALS` and every capital call site inside `LIBRARY_GLOBALS ∪ LIBRARY_CONVENTIONS`.

**The emitted shapes** (the PDF's page 3, three slots, 472 raw and canonical):

```
--[[@cb]]J={{0,20,0,89,1,102,0,15,255,255,255},{38,92,0,36,4,102,103,15,255,255,255},
{38,92,58,105,5,102,0,15,255,255,255},{110,127,0,18,3,102,0,15,255,255,255}}
M={[0]=1,1,0,2,2,2,0,4,4,1,1,0,2,2,2,0,4,4,…,0}
for n=0,80 do local r=J[M[n]]if r then local a=glag(0,n)glc(a,1,r[9],r[10],r[11],1)glp(a,1,48)end end
self:tim()ele[#ele]:map()self.touch_cb=O
```

- `x0..y1` in raw units from the measured knots: cell `c` begins at the midpoint between knots
  `c-1` and `c` and ends one short of the next midpoint, 0 and 127 at the edges (Probe A Q5). That
  is exactly where `N(x,y)` reports one of the region's cells, so a finger the map puts IN the
  region is inside the fader's bounds. Filter's `0,20,0,89`: `KX` 13/29 -> 21 exclusive, `KY` 83/97
  -> 90 exclusive. The knots are imported from `calibration.ts`, never typed.
- `M={[0]=…}`: the hand-off's `M[N(x,y)]` at +4 once, against +2 per lookup.
- The row's seventh column is the XY pad's second CC and the button's latch flag (0/1) - the
  research's "a second flag, not a second branch" - so every row is eleven numbers at exact width.
- The paint is a bare loop (see the decisions): colour on layer 1 through `glc(…,1)` and a resting
  phase **48, provisional** (question 3).
- The Timer is `--[[@cb]]X(self,20)` (19) - the sweep alone until 13-15 hands `runtimeBody`.

**The five costs, at the picker corner and the dearest literals** (three-digit controllers, channel
16, every colour `255,255,255`), canonical on the first round, `checkSyntax` true:

| Elements | Surface | Two slots | Three slots | Free (two) | Room for | Research | Correction |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | the PDF's Filter, 2x6 | **343** | 358 | 565 | 14 (budget) | - | - |
| 4 | the PDF's page 3: Filter, XY, Button, Knob | **457** | 472 | 451 | 11 (budget) | 366 | **+91** |
| 8 | four 2x6 faders, four 2x1 buttons | **608** | 623 | 300 | 7 (budget) | 498 | **+110** |
| 12 | eight 1x6 faders, four 2x2 buttons | **764** | 779 | 144 | 3 (budget) | 652 | **+112** |
| 16 | eight 1x6 faders, eight 1x2 buttons | **922** | 937 | **-14** | 0 | 811 | **+111** |
| 16 at cc 1..16, channel 1 | the same sixteen | **881** | 896 | 27 | - | - | - |

**Why the research is +91..+112 low, named.** The research's table was not costed at the dearest
literals (its four-row `G` at 141 against `J` at 152 here is 2.75 characters a row: two digits of
controller and one of channel), its map was `M={…}` at 165 against 169 (`[0]=`), and its Setup
carried no per-cell paint (101 here: colour and rest phase on every region cell, which the PDF's
"quiet light guides" need and the research's `Y()` was never spelled out). The delta is flat across
4, 8, 12 and 16 (+91, +110, +112, +111) because the paint is a constant and the literals a
per-row constant. **`M` 169 (research 165, +4 for `[0]=`); `J` at four rows 152 (research 141)**.

**THE FINDING.** The dearest sixteen measure **922 at two slots, 14 over 908** (937 at three). The
count it broke at is sixteen; twelve fit with room for three more of their own largest shape, so
**the cap at the dearest literals is fifteen at either slot count**. Sixteen at the literals a
visitor types (cc 1..16, channel 1, still at the colour corner) fit at 881 / 896. **D-14 Q4's sixteen
stands as the cap**, because the meter is the gate and "room for four more" is the interface; the
finding is pinned (`expect(sixteen.two).toBe(922)`) so the day the emitter shrinks enough for the
dearest sixteen to fit, the test says so and the SUMMARY that closes it says why. What would close
it, costed: packing the colour as one RGB444 number (-7 a row, +75 to unpack once; -37 net at
sixteen, +47 worse at four) - not taken; dropping the rest phase (-12); a 12-column row with the
latch separate was not taken either. The honest statement is that a sixteen-element surface of
three-digit controllers on channel 16 is the corner of a corner, and the meter will say fifteen.

**The dead-branch pair, re-measured** (four 2x6 vertical faders, inline, at the corner):

| Form | This tree | Research |
| --- | --- | --- |
| the fader branch alone | **806** | 697 |
| all four branches (fader-v, fader-h, button, xy) | **1,341** | 1,166 |
| the saving | **535** | 469 |
| the split's data half for the same surface | 452 | - |

The inline four faders FIT (102 free) - that is the contingency the plan retains - and the split is
chosen for every surface because the inline form has no Knob branch and no room for one. The
inline text is written against every rule the brief restates: the end code hands the contact to
`E` (whose `R` clears the pin and sends a momentary button's 0, so a lost lift - Probe A Q6.5 - is
released by the Timer's `X` sweep through the same `R`); the onset expires the same id first
(12-07's rule) and pins `S[i]=M[N(x,y)]`; a contact keeps its region for the gesture, so `Q` and `W`
are not on this hot path and the SUMMARY says so; faders and the XY pad send on change; a 9 is
ended in the same pass after its onset. `G` is never called (no finger is drawn by the data half),
so "`Q` before `G`" has no site to apply to. Test 4 runs the class-B gate's `scan`, `isEndedOpener`,
`endedEscapes`, `isOnsetChain` and `startedAdmits` over eleven texts (five split Setups, five
Timers, two inline Setups): zero "ended" openers (the end test is the negation of the live test),
two onsets, both admitting 9; and asserts no `glpfs(`, `D(` or `K(` appears, so the class-A gate's
silence is a fact and not the blind spot 12.1-09 records.

**The function set, as asserted and against what.** Test 5 asserts `[...LIBRARY_GLOBALS]` as
exported by `library.ts` at HEAD **equals** the twenty-one names `12.1-08b-SUMMARY.md` records -
`A B C D E G H K KX KY L N P Q T U V W X Y Z` - and `LIBRARY_CONVENTIONS` equals `["R"]`; then for
each of the five split Setups the capital call set is `[]` (the data half calls no library function;
`O` is assigned, not called), for the inline Setups `["E", "N"]` and for their Timers `["X"]` -
**equal, not contains** - with every one inside the exported set. The hand-off's "eighteen names"
and "`V G N A D` in 255/6" are 12.1-02's shape, superseded by 12.1-08b's twenty-one with `N` in
255/0 and `Z Y K` added; the tree agrees with 12.1-08b.

**`cost.ts`.** `canonical()` runs `compressScript` to a fixed point and charges
`max(compressed, raw)` on the input, as `lua-entries.sweep.spec.ts` test 1 does; `costOf` measures
every region at `PICKER_CORNER`; `roomFor` adds the surface's own largest shape (the dearest a
region can be in `M`, one character a cell) with a three-digit controller on channel 16, re-measures,
and once no window of that shape is free goes on with single cells - never a division. The first
draft used a one-cell representative and reported 15 beside one fader (stopped by the cap, not the
budget) and 3 at twelve; with the surface's own largest shape it reads 14 (stopped by the budget)
and 3, and is the honest floor in between.

**Three negative checks**, from scratch copies, restored by hash:

| # | Check | Red on |
| --- | --- | --- |
| N4 | all four branches for a fader-only surface (elimination off) | test 2: `expected [ Array(4) ] to deeply equal [ 'fader-v' ]` - the branches assertion names it first; the saving's collapse to 0 is the next line |
| N5 | `y1` handed as the cell index instead of the raw bound | test 1: "One: the pinned figure moved: expected 342 to be 343"; tests 2 and 3 red on the bounds too |
| N6 | `F(i,S[i],2)` - the finger light the library dropped at 12-07 - called from the inline callback | test 5: "Four faders inline: the library names it calls: expected [ 'E', 'F', 'N' ] to deeply equal [ 'E', 'N' ]" - **after a fix**: the first draft filtered the emitter's own names out of the call set and `F` is also the inline form's last-sent table, so the check came back green on the pair's pin only. The filter is gone (the emitter calls no own function) and the sentence is in the test |

## The quick suite, three whole runs

| Run | Command | Result |
| --- | --- | --- |
| 1 | `npm run test:quick -- --maxWorkers=2` | 1 file red: `install.spec.ts`, seven tests on `timed out waiting for identification` - the transient the brief names; green alone (24 / 24); the totals read 92 / 945 |
| 2 | the same | **92 / 945 (+1 todo)**, `check-counts 92 945` matches, 42.9 s |
| 3 | the same | **92 / 945 (+1 todo)**, `check-counts 92 945` matches |

The sweep stays `4 19` by choice: the Sandbox's cost gate is a **server** spec (`emit.spec.ts`,
1.2 s), by 12-07's precedent and for its reason - it measures a handful of strings, not a knob
cross-product, and a spec that runs on every quick run is the one that catches a moved figure.

## Deviations from the plan

**1. [Rule 3 - Blocking] `src/lib/catalog/touch-guard.ts` created and `touch-guard.spec.ts` rewired.**
The plan says test 4 must "run the gates' own needles, do not re-write them"; the needles lived
inside the spec (not importable without registering its tests), and `library.spec.ts` had already
re-assembled them once. The scanner (fragments, `Comparison`, `Chain`, `comparisonsIn`, `chainsOf`,
`branchOf`, `is`, `isLiveTest`) moved out verbatim with two rule predicates (`endedEscapes`,
`startedAdmits`) and the spec imports them; its three tests and their counts are unmoved; the
header's fragment rule still holds. Outside the plan's file set. Commit `0975651`.

**2. [Design, inside the plan's words] the names.** `J` / `M` / `O` / `S` / `F` / `R` for the plan's
`G` / `M` / `Z` / `Y()` - the plan's names are the library's since 12.1 (above).

**3. [Design] the `Surface` carries no `schema`** - the tree's envelope rule (above; question 2).

**4. [Design] the third pull-in defaults off** for the page-flip reason (above); the plan's "emit
both pull-in calls" is honoured under `slots: 3` and measured.

**5. [Finding] the dearest sixteen measure 922** - recorded, pinned, the cap stated (above).

**6. [Rule 1 - Bug, in this plan's own draft] test 5's call set filtered the emitter's own names** and
was blind to `F(`; caught by negative check N6 (12.1-06's lesson: a green negative check is a
suspect check). Fixed before the commit.

**7. [Rule 1 - Bug, in this plan's own draft] two missing separators** in the inline text (`end` +
`self`, `end` + `if`) and one in the split (`end` + `self:tim()`) - caught by `checkSyntax` and the
minifier's parse error before any figure was written down.

**8. [Scope] `transfer.ts`'s step-5 check was not folded into `geometry.ts`.** 13-13 asked that it
"become model.ts's own once it exists"; the import runs before any Sandbox module loads by 13-13's
design and its three sentences are 13-18's to unify with this plan's. Left for 13-16 / 13-18 and
noted below.

## Anything the plan or the hand-off asserts that the tree does not support

- The plan's `PREV_FILES 89 / PREV_TESTS 910` and `check-counts 91 919`: the tree stood at 90 / 936
  after 13-13, 12.1's Band 2 and the gate; `92 945` was asserted.
- The plan's "read `12-07-SUMMARY.md` for the library's final shape": history only. The library is
  12.1-08b's (twenty-one names, `N` in 255/0, `G` carrying its colour, `K` the stamp).
- The hand-off's "eighteen names", "`V G N A D` in 255/6 at 714" and "782" for 255/0: 12.1-02's
  figures; the tree is 842 + 873 with twenty-one names.
- The hand-off's "the callback names at most `G`, `N`, `U`, `E`, `X`, `R`": the split's data half
  names none of them (it assigns `O`); the inline contingency names `E`, `N` (and `X` in the Timer)
  and defines `R`. `G` and `U` are not called by anything this plan emits.
- The plan's interfaces block names the table `G`, the paint `Y()` and the runtime `Z` - all three
  are library functions now.
- The plan's "`schema.ts` gains the `Surface` record shape with `schema: 1` in the body": the
  shape was already there (13-13) and the version is on the record (above).
- The plan's `ElementKind` with `"fader-v" | "fader-h"`: 13-13's schema has four kinds with a fader
  split by an `orientation` field instead (above).
- The plan's "the eleven-character call that pulls the runtime in": `self:tim()` is ten characters;
  `ele[#ele]:map()` fifteen.
- `SLOT-ARITHMETIC.md`'s five-slot table: "system Timer 255/6 - nothing" is stale since 12.1-02.
- `13-15-PLAN.md` still computes the cell as `y*9//128*9 + x*9//128`; the hand-off (and this plan's
  `M`) use `N(x,y)`. 13-15 should read the hand-off's line before writing the runtime.
- The research's "`M` costs 165" and "a four-row `G` is 141" and "366 / 811": corrected above.
- The plan's negative check "expect test 2's saving to collapse and the assertion to name it": the
  assertion that fires first names the branches, not the saving (table above).

## For 13-15, 13-16, 13-17, 13-18, 13-20

- **13-15**: the runtime's entry is `O(s,i,e,x,y)` (`RUNTIME_ENTRY`); the lookup is `M[N(x,y)]`
  (0..80, `[0]=`-indexed) and the row is `J[M[N(x,y)]]` with columns `x0,x1,y0,y1,t,cc,cc2|latch,
  ch,r,g,b`; `branchesUsed(regions)` is the dead-branch parameter; `emitSurface(surface, {
  runtimeBody })` puts the runtime ahead of the sweep in the Timer; the inline contingency's branch
  texts (`FADER_V`, `FADER_H`, `BUTTON`, `XY` in `emit.ts`) are a starting point written against
  both gates, not a VM-proved runtime; `DEFAULT_MINIMUM_SIZES` and `DEFAULT_REST_PHASE` are
  provisional and yours; **`ele[#ele]:map()` turns the page on a module whose 255/4 is untouched -
  do not run a three-slot Setup at the bench before 13-17's write exists**; `map` is the name
  (`grid_protocol.h:879`), one tap confirms it.
- **13-16**: `toDisplay` / `fromDisplay` for every coordinate the inspector shows; `applyEdit` and
  `addRegion` return the surface handed in on a failed edit (rule 5) with `problem.field` to mark;
  `adjacencyWarnings` at both regions; `duplicate(surface, id, mint)`; `GEOMETRY_COPY` and
  `overlapLine`; `costOf(surface)` for the meter (`used / free / roomFor / roomLimit`).
- **13-17**: the Sandbox lands four strings like a Lua entry (`systemTimer`, `system`, `setup`,
  `timer` - 12.1-07's `landLua`); `slots: 3` is safe only once 255/4 is written and PUT BACK exists.
- **13-18**: four ledger rows (three strings and the `tooSmall` placeholder) and two questions; the
  import-side (`IMPORT_REASONS`) and Sandbox-side (`GEOMETRY_COPY`) sentences for the same three
  facts are two halves of one batch.
- **13-20**: the Phase 13 offset's term from this plan is `+2 / +9`, e2e `+0 / +0`, check +7 files
  (627 -> 634).

## Questions for the user

1. **The adjacency warning has no instruction** (ledger question 1): state the fact and stop, or
   add _Leave a cell between them._?
2. **`schema: 1` on the `Surface`** (ledger question 2): keep the record-only rule, or add the field?
3. **The resting phase.** A region's cells rest at phase 48 on layer 1 in the region's colour - a
   quiet guide, twelve characters a Setup. Is a resting light wanted at all, and if so is 48 the
   right dimness? 13-16's appearance section (active / inactive colours) is where it lands.
4. **The cap at the corner of the corner.** The meter will say fifteen for a surface of sixteen
   three-digit controllers on channel 16. Accept the meter's answer, or spend the packing (-37 at
   sixteen, +47 at four) to make the dearest sixteen fit?

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. CAT-04
stays `[ ]`. `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/` and `src/vendor/`
untouched; `firmware-oracle.spec.ts` green and unedited; no `git checkout`, `git restore`,
`git stash` or `git clean` was run; every restore was a copy back with the hash compared.

## Self-Check: PASSED

- `src/lib/sandbox/model.ts` (238 lines, contains `Region`) - FOUND
- `src/lib/sandbox/emit.ts` (contains `dead`, `TOUCH_LIBRARY` by way of `LIBRARY_GLOBALS`, `cellMap`) - FOUND
- `src/lib/sandbox/cost.ts`, `geometry.ts`, `geometry.spec.ts`, `emit.spec.ts`, `src/lib/catalog/touch-guard.ts` - FOUND
- `src/lib/sandbox/geometry.ts` -> `emit.ts` via `buildCellMap` / `CellMap` - FOUND
- commits `e570457`, `0975651` - FOUND in `git log`
- `+2 / +9` observed as 92 / 945 (+1 todo) twice; sweep `4 19`; e2e 80; check 634 / 0 / 0
