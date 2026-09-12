---
phase: 13-gui-overhaul
plan: 15
subsystem: sandbox, sim, catalog
tags: [sandbox, runtime, lua-vm, wasmoon, release-paths, region-keeping, rotary, dead-zone, calibrated-axis, slots, packer, cost, finding-closed, bench-row, ledger]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 14
    provides: "RUNTIME_ENTRY O, the lookup M[N(x,y)], the row J with eleven columns, branchesUsed, emitSurface with slots 2 | 3, canonical / measureSurface / costOf, touch-guard.ts as the shared scanner, DEFAULT_MINIMUM_SIZES as a parameter, the dearest-sixteen finding pinned at 922"
  - phase: 13-gui-overhaul
    plan: 02
    provides: "SLOT-ARITHMETIC.md: the three-slots answer, the estimated ceiling (three kinds on two slots, all on three), the re-ask rule, every figure labelled an unrun sketch's"
  - phase: 12.1-gradient-touch
    plan: 08b
    provides: "the library as shipped: U W E Q X N in 255/0 (842), V G Z Y K A D in 255/6 (873); G(s,i,e,x,y,l,r,g,b); E reaching V and R; N the nearest calibrated cell; library.ts unchanged from here on"
  - phase: 12.1-gradient-touch
    plan: 07
    provides: "createLuaHost taking system and systemTimer; the host's gtt as a one-shot the body re-arms"
  - phase: 12-touch-framework
    plan: 07
    provides: "the lesson this plan spends: run it, then measure it, then pin it; the same-id re-press as the case the hardware normally takes; the R convention and the X sweep"
provides:
  - "src/lib/sandbox/runtime.ts: R, O and the five branch functions I[1..5] as one canonical text per surface, gtt(0,100) at the Timer's head, the guarded state head, the contract table, the four release paths, the wrap arithmetic written out, packRuntime over two slots or three, joinLua as the minifier's own separator rule"
  - "src/lib/sandbox/runtime.spec.ts: seven tests, the first five in wasmoon through createLuaHost with the touch element's tim and the system element's map as one-line stand-ins; the same-id re-press driven first; the costs pinned; the ceiling in kinds measured for every combination under both slot counts"
  - "src/lib/sandbox/model.ts section 4: the Knob's dead zone DERIVED from Probe A Q1 (10.13 raw units, 0.71 cells, the literal 103), the step 8 degrees (45 a turn, 2.84 turns end to end), the minimum 3 x 3 from the inequality (w-1)/2 * 14.22 >= 10.13 + 1; a fader's minimum along the axis it reads and an XY pad's 2 x 2 because a one-cell span divides by zero; minimumSizeFor reading the orientation"
  - "src/lib/sandbox/emit.ts: the four geometry numbers in the kind's own frame (a fader's bottom LED and LED span on U, a knob's raw centre through sensorAt, a button's four zeros, a knob row's value and remainder); the Timer and 255/4 from packRuntime; the inline contingency on U"
  - "src/lib/sandbox/cost.ts: 255/4 measured; fits is a statement about every string the surface emits"
  - "src/lib/sandbox/geometry.ts: tooSmall per kind with the Knob's reason, ledgered"
  - "docs/INSTALL-RUNBOOK.md row L: the rotary felt, unanswered"
  - "THE MEASUREMENT: the runtime alone 1,340 with every branch and 1,042 without the Knob (the research's 861 +181; 13-02's re-sketch 1,042 / 738); the rotary's share 298 against D-08's 150-200 (98 above the top; 13-02's 304); two slots carry a Knob with one fader orientation or with buttons and the other kinds two at a time; three slots carry every combination; the PDF's page 3 at 574 + 706"
  - "THE FINDING CLOSED: 13-14's dearest sixteen measure 882 at two slots (was 922), the cap at those literals is sixteen; the five costs 345 / 460 / 588 / 748 / 882"
affects: [13-16 (the meter renders fits over three strings and the two-slot ceiling honestly; toDisplay for the knob's row; tooSmall per kind), 13-17 (four strings become five under three slots: 255/4 is the packer's mapmode; the default flips to 3 when the write and PUT BACK exist; the Setup's ele[#ele]:map() then self.touch_cb=O), 13-18 (four ledger rows and three questions from this plan), 13-20 (the Phase 13 offset +1 / +7; BUILD-04 for the gate to tick; row L handed over; the re-ask did not fire and the two-slot ceiling is one kind below 13-02's estimate)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A Lua string is run in a real VM before it is measured and before a figure is pinned, and every disagreement between the contract and the VM is recorded with its fix: three here, none of which a syntax check would have found"
    - "A runtime that spans two slots is a list of parts and a packer, not two texts: the branches are functions in a table, the head is guarded so the same text is correct in a slot that re-runs every 100 ms and in one that runs once, and the packer fills 255/4 from the front"
    - "The row's geometry numbers are precomputed in the frame the kind reads them in, so the runtime pays no conversion and a button pays nothing at all - the change that closed 13-14's finding without being aimed at it"
    - "A minimum size is an inequality over a measured jitter and a chosen step, and the step is the one design constant, named as such and handed to the bench"
    - "A negative check that comes back green is a suspect check: the wrap's negative step was hidden by a turn that started on the discontinuity, and the check moved the start rather than the assertion"

key-files:
  created:
    - src/lib/sandbox/runtime.ts
    - src/lib/sandbox/runtime.spec.ts
  modified:
    - src/lib/sandbox/emit.ts
    - src/lib/sandbox/emit.spec.ts
    - src/lib/sandbox/model.ts
    - src/lib/sandbox/cost.ts
    - src/lib/sandbox/geometry.ts
    - src/lib/sandbox/geometry.spec.ts
    - docs/INSTALL-RUNBOOK.md
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md

key-decisions:
  - "The Timer opens with gtt(0,100): 13-14's Timer was the sweep alone and nothing ever armed it, so on the module the sweep would never have run and a lost lift would have hung its note forever; the Setup's own self:tim() arms it (Rule 2)"
  - "The branches are functions I[t] in a table, not inline blocks: about eleven characters a branch dearer, and the only shape that lets one text span 255/4 and the Timer under three slots; on two slots the ceiling in kinds is the same either way"
  - "The four geometry numbers are per kind and a fader reads the calibrated axis between its LED centres, so the top and bottom LEDs give 127 and 0 exactly (the hand-off's rule; the raw span 13-14 carried gave 115 and 11 on a fader away from the edge); the hand-off's own arithmetic (y1*64+63) does not give 0 at the bottom LED and was not taken"
  - "A knob's centre is its middle LED position through the forward map in RAW units, and the dead zone is a constant in raw units, because Q1's jitter is one raw unit wherever the finger is; in calibrated units the same circle would be 29 to 108 sixty-fourths depending on the local pitch"
  - "The step is 8 degrees - the finest for which the 3 x 3 Knob the Bible draws keeps its ring outside the dead zone under the diagonal jitter (6 degrees puts rho0 at 13.5, one unit short of the ring) - and it is one constant handed to the bench"
  - "The accumulator's remainder is the KNOB's (per region) and the previous angle is the CONTACT's: a second finger does not inherit the first's angle, and a gesture resumes at sub-step precision; the dead zone forgets the angle and keeps the remainder"
  - "Two commits, not one per task: the rotary is a branch of the one string that was run, measured and pinned as a whole, and model.ts's derivation renders its literals, so task 02's code could not be split from task 01's without pinning two runtimes; the second commit carries task 02's documents"
  - "BUILD-04 is satisfied by the tree (test 2, four paths in a VM) and is left for 13-20 to tick, as every plan of this phase has left REQUIREMENTS.md to the gate; CAT-04 stays [ ]"

requirements: [BUILD-01, BUILD-03, BUILD-04, CONT-02, PREV-02]
requirements-completed: []

# Metrics
duration: about 30 min of execution (00:24Z-00:56Z: the baseline run, the measurement harness, two tasks, six negative checks, two whole quick runs, the sweep, svelte-check) plus this document and STATE.md
completed: 2026-09-12
---

# Phase 13 Plan 15: The Runtime, Run Then Measured Then Pinned, and the Rotary Summary

**The Sandbox's Lua was run in wasmoon before it was measured, measured under the pinned minifier
before it was pinned, and the estimates it was costed from are printed beside it and not carried.**
`O` refuses non-live codes with the blessed spelling and hands them to `E`; an onset expires the
same id first, then any other contact on the region just landed on, then pins `S[i]=M[N(x,y)]` - a
contact keeps its region for the whole gesture, so `Q` and `W` are not on this hot path; the finger
is `G` on layer 2 in the region's colour; `R` sends a momentary Button's 0, and the VM saw it on all
four release paths with the same-id re-press driven first. A fader reads the calibrated axis between
its LED centres (127 and 0 at the LEDs, exactly). The Knob is a real rotary: `math.atan` around a
raw centre, the wrap `(a-p+180)%360-180`, a truncating accumulator with hysteresis, a clamp at both
ends, and a **dead zone of 10.13 raw units derived from Probe A Q1's jitter**, which puts the minimum
at **3 x 3** by an inequality. Measured: **1,340** with every branch, **1,042** without the Knob
(the research's 861, +181), the rotary's share **298** against D-08's 150-200. **On two slots a Knob
shares a surface with one fader orientation or with buttons and nothing else, and the other kinds mix
two at a time - one kind below 13-02's estimate; on three slots every combination fits** (the PDF's
page 3 at 574 + 706), which is what the user bought, so **the re-ask did not fire**. The per-kind
geometry closed 13-14's finding on the way: the dearest sixteen measure **882**. Row L is written
and unanswered. Term **`+1 / +7`** on the observed 92 / 945 (+1 todo): **93 / 952 (+1 todo)**,
twice green whole. **No device was touched.**

## The baseline, observed at start and at close

HEAD `ceba93e` (13-14's summary). Observed before an edit was made, at `--maxWorkers=2`: **92 files
/ 945 tests (+1 todo)**, 44.0 s; e2e 80 titles by `grep -c "test("`; check 634 / 0 / 0. The plan's
`91 / 919` and `check-counts 92 926` literals are stale (they predate 13-13, 12.1's Band 2, the gate
and 13-14); the brief's 92 / 945 is what was observed and asserted against.

| Count | Start (observed) | Close | Delta |
| --- | --- | --- | --- |
| quick suite | **92 / 945** (+1 todo) at `ceba93e` | **93 / 952** (+1 todo), twice green whole (`check-counts 93 952` matches; runs of 52.6 s and 43.1 s at `--maxWorkers=2`, neither with the named `install.spec.ts` transient) | **`+1 / +7`**: `runtime.spec` 7 |
| check | 634 / 0 / 0 | **636** / 0 / 0 | +2 files |
| lint | clean | clean | - |
| e2e | 80 titles / 96 runs | 80 by `grep -c "test("`; the suite not run (no e2e file moved) | `+0 / +0` |
| sweep | `4 19` | `4 19` RUN once at close, 101.1 s, 19 green | 0 |
| runbook | rows A-K | rows A-**L** | +1 |
| library | 842 + 873 | `git diff --quiet -- src/lib/catalog/library.ts src/lib/sim/lua-host.ts` holds | read, never edited |
| vendor, oracle, ROADMAP | - | `git diff --quiet` holds on all three | untouched |

## Commits

| Hash | Message |
| --- | --- |
| `90424c5` | `feat(13-15): the Sandbox runtime run in a VM, then measured, then pinned - a contact keeps its region, a Button's 0 on all four release paths, faders and the XY pad on the calibrated axis, the Knob a real rotary with a derived dead zone, and the per-kind geometry that closes 13-14's sixteen-element finding` |
| `8c7b3fc` | `docs(13-15): the rotary's bench row L, unanswered, and the ledger's four refusals with the Knob's reason and three questions` |

`git commit --only <paths> -F <message-file>`, pathspec before the flag; the two new files
`git add`ed first. No push, no attribution, no trailer.

## Run, then measured, then pinned - the order, and the three disagreements

**Run.** `runtime.spec.ts` opens the host exactly as `lua-smoke.spec.ts` does for a hand-authored
entry - `system: TOUCH_LIBRARY`, `systemTimer: TOUCH_LIBRARY_TIMER`, the emitted Setup, the emitted
Timer - with two one-line stand-ins in front of the Setup for what the host does not model and a
module does: `self.tim=__hangar_timer` (the touch element's own `tim` method, which the Setup's
`self:tim()` calls - probe 1 - and which is the host's compiled Timer wrapper) and, under three slots,
`ele={{map=function(s) <255/4> end}}` (the system element's `map`, probe 2). The emitted strings go
in verbatim. Tests 1-4 were driven before a figure existed; test 5 after the rotary was written.

**The VM disagreed three times, and each fix is in the text or the test:**

| # | The contract said | The VM said | The fix |
| --- | --- | --- | --- |
| 1 | a full clockwise turn in 4-degree samples accumulates 360 degrees and 45 steps | **44 steps**: summed as floats, `math.deg(math.atan(...))` over ninety samples came to 359.99999 and the last step never arrived | the angle is floored to whole degrees (`//1`, +3 characters); every delta and every remainder is then exact, and the turn is 45 - runtime.ts section 5 says why the three characters are there |
| 2 | leaving the dead zone on the far side and turning one step sends `[1]` | **`[]`**: the region's accumulator remainder `r[13]` was sitting in (-8, 0] after the clamped counter-clockwise descent, so the first 8 degrees out of the centre only brought it to (0, 8] | not a defect: the remainder is the knob's (per region) and the previous angle is the contact's, so a gesture resumes at sub-step precision; the test asserts one step or two over sixteen degrees and never a jump, and section 5 records which state is whose (question 3 for the user is whether the remainder should also reset on an onset, at +12 characters) |
| 3 | negative check N4 (the wrap removed) turns test 5 red "with the -357 step named" | **green on the step**: the turn started at 170 degrees, ON the discontinuity, so the wrap hit while the value was still 0 and `glim(0-44)` sent nothing; only the count was short | the check was the suspect (12.1-06's rule): the turn now starts at 6 o'clock and crosses 180 a quarter turn in, the assertion names the negative step first, and N4 reads `a negative step through the wrap: [1..10,0,1,...]: expected -10 to be >= 1` |

Everything else - the region keeping, the four release paths, the fader's 127 and 0 at the LEDs, the
XY pad's one CC per moved axis, the clamps, the dead zone - agreed with the contract on the first run.

**Measured.** `compressScript` after `padReady()`, `max(compressed, raw)`, canonical: every packed
text is a fixed point on the first round (test 7 asserts `rounds` 0 on the Timer and 255/4 of two
surfaces under both slot counts). The parts, in characters: marker 9, arm `gtt(0,100)` 10, head
`S=S or{}F=F or{}I=I or{}` 24, `R` 112, `O` 304, fader-v 121, fader-h 121, button 133, XY 222, knob
297, sweep 10.

**Pinned:** 1,340 / 1,042 / 298 / 593 (one vertical fader's Timer) / 574 + 706 (the PDF's page 3
on three slots) / 1,248 (the same on two, over by 340) - and the two-slot fits / over lists below.

## The runtime, in one place

The PDF's page 3 (a 2 x 6 Fader, a 3 x 3 XY pad, a 3 x 3 Knob, a 2 x 2 Button) under three slots:

```
255/4  --[[@cb]]S=S or{}F=F or{}I=I or{}
       R=function(s,i)local r=J[S[i]]S[i]=nil F[i]=nil if r and r[5]==3 and r[7]<1 then s:gms(r[8],176,r[6],0,0)end end
       O=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then E(s,i)return end local o=e==4 or e>8
         if o then E(s,i)local n=M[N(x,y)]for j,g in pairs(S)do if g==n then E(s,j)end end S[i]=n end
         T[i]=C local r=J[S[i]]if not r then return end G(s,i,e,x,y,2,r[9],r[10],r[11])I[r[5]](s,i,r,x,y,o)
         if e>8 then E(s,i)end end
       I[1]=function(s,i,r,x,y)local v=glim((r[3]-U(y,KY))*127//r[4],0,127)if v~=F[i]then F[i]=v s:gms(r[8],176,r[6],v,0)end end
       I[3]=function(s,i,r,x,y,o)if o then local v=127 if r[7]>0 then r[12]=not r[12]v=r[12]and 127 or 0 end s:gms(r[8],176,r[6],v,0)end end
0/6    --[[@cb]]gtt(0,100)S=S or{}F=F or{}I=I or{}
       I[4]=function(s,i,r,x,y)local a,b=glim((U(x,KX)-r[1])*127//r[2],0,127),glim((r[3]-U(y,KY))*127//r[4],0,127)
         local p=F[i]or{}if a~=p[1]then s:gms(r[8],176,r[6],a,0)end if b~=p[2]then s:gms(r[8],176,r[7],b,0)end F[i]={a,b}end
       I[5]=function(s,i,r,x,y)local u,v=x-r[1],y-r[2]if u*u+v*v<103 then F[i]=nil return end
         local a=math.deg(math.atan(v,u))//1 if F[i]then local c=r[13]+(a-F[i]+180)%360-180
         local k,f=math.modf(c/8)r[13]=f*8 local w=glim(r[12]+k,0,127)if w~=r[12]then r[12]=w s:gms(r[8],176,r[6],w,0)end end F[i]=a end
       X(self,20)
```

(Line breaks added here for reading; on the wire each slot is one line, 706 and 574.) The Setup is
13-14's with the per-kind rows: `J={{0,0,320,320,1,20,0,0,255,255,255},{192,128,128,128,4,21,22,0,
255,255,255},{64,83,0,0,5,23,0,0,255,255,255,0,0},{0,0,0,0,3,30,0,0,255,255,255}}` - a vertical
fader's bottom LED and LED span on `U`, an XY pad's left LED, width, bottom LED and height, a knob's
raw centre (LED (4,5) through the forward map: 64, 83) with its value and remainder seeded, a
button's four zeros.

**Why `gtt(0,100)` is there (Rule 2).** 13-14's Timer was `--[[@cb]]X(self,20)` and nothing armed
it: the firmware's timer is a one-shot the body re-arms (`lua-host.ts` `gtt`, the same rule every
hand-authored Timer obeys with `gtt(0,N)` at its head), so on the module the sweep would never have
run and the lost lift the probe measured four times in five would have hung its note forever - the
exact failure `R` and `X` exist to prevent. The Setup's own `self:tim()` runs the body once and arms
it; every re-run re-arms it. Ten characters. And because the Timer re-runs every 100 ms, the state
head is guarded (`S=S or{}`), or every finger on the pad would be dropped ten times a second.

**`Q` and `W` are not on this hot path**, and the reason is `S[i]`: a contact keeps the region it
landed in for the whole gesture, until a lift or an expiry, so the library's cell hysteresis (`W`)
and its cell-change contract (`Q`) have nothing to decide. Test 1 drags a finger off Filter's edge
into Space's cells and on to its far corner: Filter receives `[101, 76, 127]`, Space receives
nothing, and after the lift a press inside Space answers on both axes. The runtime calls `E`, `G`,
`N`, `U` and (in the Timer) `X`, defines `S F I R O` - the four letters the library and the data
half left free, plus `O` - and test 6 asserts both lists against `LIBRARY_GLOBALS` as exported.

## The four release paths, as observed (test 2)

A momentary Button "Go" on controller 30, the note-off asserted as the 0 on that controller, not
merely that a release ran:

| Path | Driven | Sent on 30 |
| --- | --- | --- |
| 2. same id, no lift - **FIRST**, because firmware assigns the lowest free id | press LED (7,0); press again at LED (8,1) with no lift between | `[127, 0, 127]` - and the first press alone is `[127]`: `R` on a fresh contact sends nothing, which is the idempotency library.ts section 5 requires |
| 1. an end code | press, lift | `[127, 0]` |
| 3. another contact on the region the ghost holds | contact 0 presses; contact 1 presses the same button | `[127, 0, 127]`, then contact 1's own lift `[..., 0]` |
| 4. the Timer sweep | press; 190 ticks (still `[127]`); 40 more | `[127, 0]` inside 230 ticks - twenty `X(self,20)` calls at 100 ms after the last sample, CHORUS's two seconds |

A latching button toggles and its `R` sends nothing: `[127, 0]` over two press-and-lifts.

## The fader and the XY pad (tests 3 and 4)

**The Phase 12.1 hand-off's rule is taken and its arithmetic is not.** A fader's value is
`(gy-U(y,KY))*127//gh` with `gy` the BOTTOM LED's calibrated position (`row*64`) and `gh` the LED
span (`(h-1)*64`): Filter (rows 0..5) reads 127 at LED row 0, 0 at LED row 5, 76 at row 2, and a
fader away from the pad's edge (rows 2..5) reads **127 and 0 exactly** at its two end LEDs - where
13-14's raw span gave 115 and 11, and where the hand-off's own `(y0*64, y1*64+63)` would have given
21 at the bottom LED. Beyond the end LEDs the half-cell clamps. A still finger sends nothing (the
firmware's change gate, modelled by the host, drops the sample), and a wobble on the axis the fader
does not read sends nothing either. The XY pad sends `[0]/[0]` on its first sample, then one CC for
an x-only move, one for a y-only move, two for both, and nothing for a raw unit past its right LED
(clamped to the same 127) - the probe's rule 3, the thing LUMEN was corrected for.

**A one-cell span divides by zero** (Lua raises on `//0` on the module), so a vertical fader needs
two rows, a horizontal one two columns and an XY pad 2 x 2 - `minimumSizeFor` in model.ts, applied by
`validate`, asserted in geometry.spec.ts with the axis named in the refusal.

## The Knob (test 5): the arithmetic, every figure labelled

**Resolution** (where a turn can be read):

| Quantity | Value | From |
| --- | --- | --- |
| jitter per sample | 1 raw unit on one axis | Probe A Q1: x 65<->66, y 66<->67 at 100 Hz |
| jitter across a still finger's wander | sqrt(2) = 1.414 raw units | the diagonal of the 2 x 2 set Q1's trace visits - the conservative reading |
| the step | **8 degrees** of accumulated turn | the one design constant (below) |
| steps a turn / turns end to end | 45 / 2.84 | 360 / 8; 128 / 45 |
| the dead zone's radius | **10.13 raw units = 0.71 cells** | `1.414 * (180/pi) / 8`: where the diagonal jitter alone swings the angle by a whole step |
| the runtime's literal | `u*u+v*v<103` | `ceil(10.13^2)`, rendered from model.ts, never typed |
| the ring of a w-wide region | `(w-1)/2 * 14.22` raw | the outer cells' LED centres at the uniform 128/9 per cell |
| **the inequality** | `(w-1)/2 * 14.22 >= 10.13 + 1` | the ring outside the dead zone by one unit of per-sample jitter |
| the minimum | **w >= 2.56, so 3 x 3** | a 2 x 2's ring is 7.1 out (inside); a 3 x 3's 14.2 (3.1 past); a 4 x 4's 21.3 |

**LED feedback** (not resolution): a 3 x 3 ring is eight lights and a 4 x 4's twelve, and one turn
walks all of them - D-08's "nine cells of travel" is this number and says nothing about where the
angle is stable.

**The step is the one chosen constant, and here is how.** The dead zone scales as 1/step: at 6
degrees it is 13.5 raw units, one unit short of the 3 x 3's ring; at 8 it is 10.1; 8 is the finest
step that keeps the Knob the Bible draws (page 3, "Turn", 3 x 3) clear of its own dead zone under
the diagonal jitter. It is `KNOB_STEP_DEG`, one number, and row L asks whether 45 steps a turn feels
right.

**The dead zone is in raw units on purpose.** Q1's jitter is one raw unit wherever the finger is, so
the angular instability radius is a constant in raw units; in calibrated sixty-fourths the same circle
would be 29 at the pad's widest pitch and 108 at its narrowest. That is why a knob's row carries its
raw centre (the middle LED through `sensorAt`) where a fader's carries calibrated bounds - two frames,
each the one its kind reads.

**Under the MEASURED map the uniform rule has two soft spots**, printed by test 5 and left as a
question rather than a refusal: the nearest ring LED of every 3 x 3 placement is 12-20 raw units from
the centre EXCEPT the placements whose ring includes column 8 (**6** raw units: the pad's last x
segment is 6 wide) and rows 7-8 (**11**, on the line at 10.13 + 1). Row L asks the finger; ledger
question 2 asks the user whether the model should refuse those placements with a line of their own.

**What the VM proved about the rotary:** one clockwise turn from 6 o'clock in 4-degree samples
sends exactly `[1, 2, ..., 45]` through the wrap at 9 o'clock with no step back; counter-clockwise
sends `[44, ..., 0]`; three more turns reach 127 and send it once; four turns back reach 0 and send
it once; a press dead on the centre, a wobble and a half circle at radius 8 send nothing; leaving the
dead zone at radius 16 and turning sixteen degrees sends one step or two and never a jump; the model
refuses a 2 x 2 with the ledgered line and admits the 3 x 3.

## The measured ceiling, beside 13-02's, and the re-ask

Every combination of the five branches was packed and measured (test 7). Two slots, the Timer of
908 beside `gtt(0,100)` and `X(self,20)`:

| Fits | Over |
| --- | --- |
| v 593, h 593, vh 715, b 605, vb 727, hb 727, **vhb 849**, x 694, vx 816, hx 816, bx 828, k 769, **vk 891, hk 891, bk 903** | vhx 938, vbx 950, hbx 950, vhbx 1,072, vhk 1,013, vbk 1,025, hbk 1,025, vhbk 1,147, **xk 992**, vxk 1,114, hxk 1,114, vhxk 1,236, bxk 1,126, vbxk 1,248, hbxk 1,248, vhbxk 1,370 |

Three slots: **every combination fits**; the worst (all five) is 1,370 across 1,816.

| | 13-02's estimate (an unrun sketch) | Measured here | Difference |
| --- | --- | --- | --- |
| two slots | **three kinds**: faders (both orientations) + Button + XY at 758; faders + Button + Knob at 885 | **two kinds**: a Knob with one fader orientation (891) or with buttons (903) and with nothing else; faders (both) + buttons (849); one fader orientation + XY (816); buttons + XY (828); faders + Button + XY **950**, over | **one kind lower**; the four-branch runtime is 1,042 against the sketch's 738 and the research's 861 |
| three slots | everything, 1,111 of 1,816 | everything, 1,370 of 1,816 at worst; the PDF's page 3 at 574 + 706 | the same ceiling, 259 dearer |

**The re-ask did not fire.** The rule (the plan's objective; the brief) is that it fires if the
measured ceiling falls below what the user's `three-slots` answer bought. The user decided AGAINST
`two-slots` and took the third slot; three slots carry every kind together, which is what they were
supposed to buy. What the measurement does show is that the ceiling the user decided against was
optimistic by a kind - and that until 13-17 writes 255/4, the Sandbox's default two slots refuse the
PDF's own page 3 (13-02 said the same of two slots) and any XY pad beside a Knob. Both numbers are
stated for 13-16's meter and 13-20's `deferred-items.md` section C. **No fallback step was applied,
so D-08 is not reversed and the XY pad is not deferred.** The cheaper answer the plan asks to check
first - dead-branch elimination - is the answer: the question is how many kinds one surface may mix,
and the table above is the meter's.

**The runtime beside the estimates.** Four branches without the Knob: **1,042** against the
research's **861** (+181) and 13-02's re-sketch 738; the two are not reconciled because neither was
run - the research's `Z` called a function the library had dropped and carried no `G` call, no
cross-contact scan, no calibrated read and no `gtt`. **The rotary's share: 298** against D-08's
**150-200** - 98 above the top of the estimate, and 6 under 13-02's re-sketch of the same
description (304). **The estimate is not carried**: D-08's figure was the planner's and 298 is the
tree's. One vertical fader's Timer on two slots: **593, 315 free** beside the arm and the sweep.

## The finding 13-14 pinned, closed

13-14 measured the dearest sixteen (eight 1 x 6 faders, eight 1 x 2 buttons, three-digit controllers
on channel 16 at the colour corner) at **922**, 14 over, and pinned it so the day the emitter shrank
the test would say so. It did. The per-kind geometry - a fader's calibrated bottom LED and span cost
a digit or two more than its raw span, a button's four zeros cost about five fewer than its raw span
- moved the five costs to **345 / 460 / 588 / 748 / 882** (13-14's 343 / 457 / 608 / 764 / 922):
**the dearest sixteen fit at 882 (26 free) at two slots and 897 at three**, and the cap at those
literals is **sixteen** - D-14 Q4's figure - at two slots; at three `roomFor`'s floor from twelve
still says fifteen, because its representative is a 1 x 6 fader at cc 127 (dearer in `M` than the 1
x 2 buttons the sixteen carry) and the fourth one tips 908 by the second pull-in's fifteen
characters. The meter errs on the floor, as cost.ts says it should; the sixteen-element surface as
drawn fits. `M` 169 and the paint 101 are unmoved; `J` at four rows reads 155 (13-14's 152: a knob
row's two extra columns). The dead-branch pair re-measured at 805 / 1,333 (13-14's 806 / 1,341) now
that the inline branches read `U`; the split's data half for the same four faders 456 (452).

## Both gates, with their own needles (test 6)

Over eleven texts - the Timer and, under three slots, the 255/4 of four surfaces - `touch-guard.ts`'s
`scan`, `isEndedOpener`, `endedEscapes`, `isOnsetChain` and `startedAdmits`: zero "ended" openers
(the runtime's end test is the negation of the live test, `e~=1 and e~=4 and e<9`, once per entry
and nowhere else), one onset chain per entry (`e==4 or e>8`), every one admitting 9, and a 9 ended in
the same pass. The class-A gate (`decay-idiom.spec.ts`) reads `glpfs` pairs and is blind to `D(` and
`K(` (12.1-09's hole); the runtime writes none of the three - its finger is `G`'s live block, cleared
through `E` - and the test asserts the absence with the gate's own needle so the silence is a fact.
`decay-idiom.spec.ts`'s scanner is not exported (it is a spec); its needle is the string `glpfs(`,
assembled from fragments here as the gate assembles it. Every text passes `checkSyntax`.

## The six negative checks

Every one from a scratch copy, restored by copy-back with `sha256sum -c` on both files.

| # | Check | Red on |
| --- | --- | --- |
| N1 | `S[i]` re-pinned on every live sample (the region recomputed) | test 1: "the fader kept the contact: expected [101] to deeply equal [101, 76, 127]" - the drag off the edge stopped driving Filter |
| N2 | the Timer sweep removed (`X(self,20)` replaced by a comment) | test 2 path 4: "the lost lift's note-off: expected [127] to deeply equal [127, 0]"; test 6 on `X` missing from the call set; test 7 on the cost |
| N3 | the canonical join skipped (two spaces between parts) | test 7: "Page 3 Timer (2) is not canonical: expected 1 to be 0" - the cost assertion that names both numbers is the next line |
| N4 | the raw angle difference without the wrap | test 5: "a negative step through the wrap: [1,2,...,10,0,1,...]: expected -10 to be >= 1" - **after disagreement 3 above moved the turn's start off the discontinuity; the first run of this check was green on the step** |
| N5 | the dead zone removed | test 5: "the dead zone sent: expected 363 to be 344" - nineteen spurious sends from a wobble at the centre |
| N6 | a 2 x 2 Knob admitted (`KNOB_MINIMUM_CELLS` forced to 2) | test 5: "a 2 x 2 Knob was admitted: expected true to be false"; geometry.spec.ts test 4 on the same |

## Row L, as written

> **L** | The rotary Knob, felt (D-08; 13-15) _(after 13-17)_ | **Only after 13-17 lands, because a
> Knob beside anything else needs the third slot.** In the Sandbox build a 3 × 3 Knob and a 4 × 4
> Knob on one surface, each on its own controller. Connect, click `Apply to ZONA`, open a MIDI
> monitor. Turn each one slowly with one finger, all the way round twice. Then hold a finger still
> on the ring for five seconds, then press dead on the centre cell and wobble. Then click `PUT BACK`.
> | Report, for each of the two: does the value follow the finger without jumping at the top of the
> circle (a clockwise turn climbs 45 steps and passes 9 o'clock, where the angle wraps, without a
> fall); can you hold a steady value (a still finger on the ring sends nothing); does the centre feel
> dead in a way that helps or in a way that feels broken (the runtime ignores the middle 10 raw units
> around the centre - about two thirds of the centre cell - and a finger dragged through it lands on
> the far side without a jump); and is the 3 × 3 usable at all or does it want to be 4 × 4 or 5 × 5.
> **Write down 45 steps a turn and 2.84 turns from 0 to 127 as felt: too slow, too fast, or right.**
> If the 3 × 3 sits in the right-hand column or the bottom two rows, say so: the sensor is coarsest
> there (6 and 11 raw units to the ring's nearest light against 14 elsewhere) and 13-15 left those
> placements as a question rather than a refusal. | Nothing about a rotary gesture on this pad has
> ever been felt (D-08). The dead zone is derived from Probe A Q1's jitter and the step from the 3 ×
> 3 the Bible draws; whether eight degrees a step and a dead spot the size of most of a cell feel like
> a knob, and whether a finger circling eight lights can hold a value, are questions the VM cannot
> ask. The two coarse placements are a fact about the measured map that only a finger can rank as
> usable or not. |

Appended after row K at the table's widths (7 / 72 / 426 / 1,732 / 1,062 / 6), no row re-wrapped
(`git diff` shows five insertions and no deletion); the paragraph above the table counts twelve rows
and says the row waits for 13-17. Unanswered; handed over at 13-20.

## The ledger (13-COPY-NEW.md, "From 13-15")

13-14's `tooSmall` placeholder is marked replaced, and four rows land with the derivation:

- `GEOMETRY_COPY.tooSmall(knob)`: _A knob needs at least 3 × 3 cells. Its centre can’t read a turn,
  so the finger needs a ring of cells around it._
- fader, vertical: _A vertical fader needs at least 2 rows._ - horizontal: _A horizontal fader needs
  at least 2 columns._ - XY pad: _An XY pad needs at least 2 × 2 cells._

The button's line exists for the switch's completeness and is unreachable (rule 1 refuses a zero
size first); not ledgered.

## Deviations from the plan

**1. [Rule 2 - Missing critical functionality] `gtt(0,100)` at the Timer's head.** 13-14's Timer was
never armed; without the arm the sweep never runs on the module and a lost lift hangs its note. Ten
characters in every Timer. Commit `90424c5`.

**2. [Rule 3 - Blocking] `emit.spec.ts` re-pinned, `geometry.spec.ts` and `geometry.ts` edited -
outside the plan's file set.** The per-kind geometry (the hand-off's calibrated fader) moved every
figure 13-14 pinned, the Timer stopped being the sweep alone, the onset count over the emitted texts
rose from two to seven, and the inline contingency now calls `U`; each literal moved with the reason
beside it. `geometry.ts`'s `tooSmall` is where the ledgered refusal lives (13-14's row says "13-15's
to replace") and `validate` reads `minimumSizeFor`; `geometry.spec.ts`'s four one-cell corner
fixtures were faders and are buttons now (a one-row vertical fader is refused by rule 3 since this
plan, which is not what that test is about), and the fader's axis rule is asserted there. Commit
`90424c5`.

**3. [Design, inside the plan's words] the branches are functions in a table `I`, not inline
blocks**, so that one text can span 255/4 and the Timer (section 6 of runtime.ts). About eleven
characters a branch; the two-slot ceiling in kinds is the same either way (checked inline first in
the scratch harness: fv+k 901, b+k 909 inline against 891 / 903 as functions after the other
savings).

**4. [Design] the four geometry numbers are per kind**, and a button's are zeros. The hand-off's rule
for the fader is taken; its `y1*64+63` is not (above). The consequence - 13-14's finding closing - is
recorded above rather than smoothed.

**5. [Design] the Knob's centre and dead zone are in raw units; the fader's bounds are calibrated.**
Two frames, each the one its kind reads; the reason is Q1's jitter being a raw-unit constant.

**6. [Finding] the two-slot ceiling is one kind below 13-02's estimate; the three-slot ceiling
holds.** Recorded with both numbers; the re-ask did not fire (above).

**7. [Finding] the rotary's share is 298 against D-08's 150-200.** Recorded; the estimate is not
carried.

**8. [Process] two commits, not one per task.** The rotary is one branch of the one string that was
run, measured and pinned as a whole, and model.ts's derivation renders its literals into it; task
02's code could not be committed after task 01's without pinning two runtimes. The first commit is
both tasks' code; the second is task 02's documents (row L, the ledger).

**9. [Scope] BUILD-04 is satisfied by test 2 and is not ticked in REQUIREMENTS.md** - every plan of
this phase has left the requirements file to the gate (13-14 left `requirements-completed: []`), and
`requirements mark-complete` was not run for the same reason `gsd-tools state` was not. 13-20 ticks
it with this summary as the evidence. CAT-04 stays `[ ]`.

**10. [Not the plan's method] the measurement harness.** Before the spec existed the parts were
costed with a scratch `.mjs` against the installed `grid-protocol` (the minifier inserts a space in
`and-(`, which is why `and -(` is the canonical spelling; the harness found it). Nothing from the
scratchpad is in the tree; the spec is the measurement.

## Anything the plan or the hand-off asserts that the tree does not support

- The plan's `PREV_FILES 91 / PREV_TESTS 919` and `check-counts 92 926`: the tree stood at 92 / 945;
  `93 952` was asserted.
- The plan's `:81` cell `y*9//128*9 + x*9//128`: the naive divisor; the lookup is `M[N(x,y)]` (the
  hand-off's own correction, taken).
- The plan's "calls the library's finger light on layer 2" naming `F(i,n,2)`: `F` left the library at
  12-07; the finger is `G(s,i,e,x,y,2,r,g,b)` (the hand-off's correction, taken).
- The hand-off's fader bounds `(y0*64, y1*64+63)`: gives 21, not 0, at the bottom LED of a six-row
  fader; the LED centres `(row0*64, row1*64)` give 127 and 0 and are what shipped.
- The plan's "the runtime's real ceiling is 908 minus the sweep": minus the sweep AND the arm
  `gtt(0,100)` the plan did not know the Timer needed - 879 for the marker-less text.
- The plan's "13-02 recorded the per-kind figures and the resulting ceiling": recorded as an unrun
  sketch's; the ceiling on two slots was a kind too high (above).
- 13-02's SLOT-ARITHMETIC section 4, "the four-branch dispatcher with a Knob hook in 255/4 at 787
  and the Knob function beside the sweep in the Timer at 324": the shape is close to what shipped
  (four parts in 255/4 at 706, two branches beside the sweep at 574), but its figures were a sketch.
- The plan's test 3 wording "a still finger sends nothing": true, and the reason is the firmware's
  change gate, which the host models; a wobbling finger on the axis a fader reads DOES send, on
  change - the probe's rule 3, not a defect.
- The plan's negative check "expect the measured cost to differ from the pinned one and the assertion
  to name both": the assertion that fires first names the round count; the cost assertion is next.
- The plan's negative check "expect test 5 red with the -357 step named": true only after the turn's
  start moved off the discontinuity (disagreement 3); on the plan's implicit start the step was
  clamped into silence.
- 13-14's hand-off "`emitSurface(surface, { runtimeBody })` puts the runtime ahead of the sweep":
  the option is gone; the emitter packs the runtime itself and the Timer is never the sweep alone
  under the split.
- 13-14's "the row columns `x0,x1,y0,y1`": per kind now (emit.ts section 2).
- 13-14's "the dearest sixteen data half is 922 - the data slot, not yours": it moved to 882 without
  being aimed at, and the finding is closed above.

## For 13-16, 13-17, 13-18, 13-20

- **13-16**: `measureSurface` / `costOf` return `mapmode` beside `setup` and `timer`, and `fits`
  covers all three; the meter must say which string is over and by how much, and on two slots it
  will say so for any XY pad beside a Knob and for the PDF's page 3 - that is the honest rendering
  of the ceiling until 13-17. `toDisplay` for the knob's centre if the inspector shows it.
  `tooSmall(region, minimum)` per kind. The knob's row has thirteen columns.
- **13-17**: five strings under three slots - `systemTimer`, `system`, `mapmode` (255/4, the
  packer's), `setup`, `timer` - written in the order 255/6, 255/0, 255/4, 0/6, 0/0 (the Setup calls
  `self:tim()` then `ele[#ele]:map()` then installs `O`, so both must exist when it runs); PUT BACK
  restores 255/4's `gpl(gpn())`; the `slots` default flips to 3 there. **Do not run a three-slot
  Setup at the bench before that write exists** (13-14's warning stands).
- **13-18**: four ledger rows and three questions from this plan; the fader's two lines and the XY
  pad's are new user-facing strings.
- **13-20**: the Phase 13 offset's term from this plan is `+1 / +7`, e2e `+0 / +0`, check +2 files
  (634 -> 636); row L handed over unanswered; BUILD-04's evidence is test 2; `deferred-items.md`
  section C carries the two-slot ceiling (two kinds, one below 13-02's estimate) and the re-ask that
  did not fire, so the user sees both numbers.

## Questions for the user

1. **The Knob's refusal line carries the why** (_Its centre can’t read a turn, so the finger needs a
   ring of cells around it._) where the register's other refusals carry the way. Keep the reason,
   or cut to the first sentence?
2. **The two coarse placements.** A 3 x 3 Knob whose ring includes column 9 or rows 8-9 (one-based,
   as the inspector counts) sits inside or on the dead zone on that side under the measured map.
   Refuse those placements with a line of their own, or leave it to row L and the meter?
3. **The knob's starting value is 0**, and the accumulator's remainder is the knob's across
   gestures (disagreement 2). A _Starts at_ field, and a reset of the remainder on every press (+12
   characters), are each one decision; neither is taken.
4. **The step.** 8 degrees, 45 a turn, 2.84 turns end to end is derived from the 3 x 3; a bigger
   knob could take a finer step for free (a 5 x 5's ring clears the dead zone at 4 degrees, 90 a
   turn). Per-size steps cost about twenty characters in the runtime and one column in a knob's
   row. Wanted, or is one step for every knob right until the bench says otherwise?

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. **Nothing
here is claimed to work on hardware: the rotary has never been felt on this pad, and row L says so.**
CAT-04 stays `[ ]`. `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/`,
`src/vendor/` and `../grid-fw` untouched (`grid_lua.c:513-527` read only: `math` open, `coroutine`
and `utf8` not); `library.ts` and `lua-host.ts` read, never edited; `firmware-oracle.spec.ts` green
and unedited; no `git checkout`, `git restore`, `git stash` or `git clean` was run; every restore was
a copy back with the hash compared.

## Self-Check: PASSED

- `src/lib/sandbox/runtime.ts` contains `canonical` (the header, section 1) and `R=function` - FOUND
- `src/lib/sandbox/runtime.spec.ts` contains `createLuaHost` - FOUND
- `src/lib/sandbox/runtime.ts` -> `src/lib/catalog/library.ts` via `R` defined here and `X(self,20)` called in the Timer - FOUND
- `docs/INSTALL-RUNBOOK.md` contains `| **L** |` - FOUND
- `.planning/phases/13-gui-overhaul/13-COPY-NEW.md` contains `## From 13-15` - FOUND
- commits `90424c5`, `8c7b3fc` - FOUND in `git log`
- `+1 / +7` observed as 93 / 952 (+1 todo) twice; sweep `4 19`; e2e 80; check 636 / 0 / 0
