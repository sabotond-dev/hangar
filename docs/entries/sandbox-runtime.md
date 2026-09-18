# The Sandbox runtime and emitter - the history behind src/lib/sandbox/runtime.ts and emit.ts

`runtime.ts` is the Lua a Sandbox contact drives (the state head, the release convention `R`, the
entry `O`, the five kind branches and the packer that spreads them over the touch Timer and the
system element's fourth event); `emit.ts` is the data half a surface becomes (the region table `J`,
the cell map `M`, the paint, the pull-in calls and the callback assignment). Both were costed and
re-cut by 13-02, 13-14, 13-15 and 13-17 and measured in a real Lua VM by `runtime.spec.ts` and
`emit.spec.ts`; the two headers below carried that history until 13.2-02 moved it here. The files'
own headers now carry the facts - what each template is, which slot it lands in and what the caller
substitutes - and point here.

## Moved from src/lib/sandbox/runtime.ts on 2026-09-13 (13.2-02)

```text
The Sandbox's runtime: the Lua a contact drives, RUN in a real Lua VM, then
MEASURED under the pinned minifier, then PINNED - in that order.

---------------------------------------------------------------------------
1. THE METHOD, AND THE LESSON IT SPENDS
---------------------------------------------------------------------------

12-07's planner measured a library sketch at 885 of 908, syntax-checked it
and shipped it into a plan; the plan-check then found two defects a VM
would have caught in a minute - a `Q` that could not expire the same
contact id, and an `F` that nothing called. 13-02 costed THIS runtime from
13-RESEARCH 3.1's prose, which was itself never run, and labelled every
figure an estimate. So every string in this file was driven through
`createLuaHost` (runtime.spec.ts, seven tests, wasmoon) before a number was
written down, and every disagreement between the contract and the VM is in
13-15-SUMMARY.md with its fix. The costs are the tree's, measured after
`padReady()` as `max(compressed, raw)` on a canonical text; the research's
861 and D-08's 150-200 are printed beside them and not carried.

---------------------------------------------------------------------------
2. WHERE IT LIVES, AND HOW IT IS PULLED IN
---------------------------------------------------------------------------

The touch Timer (0/6), proved callable from the touch Setup by probe 1
(`self:tim()`, PROBE-RESULTS-2026-09-10.md, cell 80, commit 493a21a), and
under three slots the system element's fourth event (255/4), proved by
probe 2 (`ele[#ele]:map()`). The Setup 13-14 emits calls both and then
installs `O` as the touch callback, so `O` exists when it is named.

THE TIMER RUNS EVERY 100 ms AND 255/4 RUNS ONCE PER SETUP, and the text
is written for both at once. `gtt(0,100)` opens the Timer: the Setup's
`self:tim()` runs the body once, which ARMS the one-shot (the firmware's
timer is a one-shot the body re-arms - lua-host.ts `gtt`), and every
re-run re-arms it. Without that call the Timer never fires on the module,
the sweep `X(self,20)` never runs, and the lost lift the probe measured
four times in five hangs its note forever; 13-14's Timer had no `gtt` and
this plan added it as a Rule 2 deviation. The window is twenty calls at
100 ms - CHORUS's own figure - and it is the CALLER's (library.ts section
8). Because the Timer re-runs, every table it creates is guarded:
`S=S or{}` keeps the contacts' regions across ticks where `S={}` would
drop every finger on the pad ten times a second. The same head opens
255/4, so the text is one text wherever the packer puts it (section 6).

---------------------------------------------------------------------------
3. THE CONTRACT, BRANCH BY BRANCH
---------------------------------------------------------------------------

The row `r = J[S[i]]` is 13-14's, eleven columns: four geometry numbers in
the KIND's own frame (emit.ts section 2), the type code `t`, the
controller, the second controller or the latch flag, the wire channel,
and the colour; a knob row carries two more, its value and its
accumulator remainder, both seeded 0.

| Part  | What it does                                                  | Answers |
| ----- | ------------------------------------------------------------- | ------- |
| R     | the release convention (library.ts section 5): forget the     | Q6.5    |
|       | contact's region and its last value; a MOMENTARY button's 0   |         |
|       | on the way out. Idempotent: a contact holding nothing sends   |         |
|       | nothing, because `E` calls `R` on every onset.                |         |
| O     | the entry. An end code (`e~=1 and e~=4 and e<9`, the blessed  | Q3, Q6.5|
|       | spelling) hands the contact to `E` and returns; an onset      |         |
|       | (`e==4 or e>8`) FIRST expires the same id (12-07's rule -     |         |
|       | firmware assigns the lowest free id, so after a lost lift the |         |
|       | next press is normally the same id), then expires any other   |         |
|       | contact holding the region just landed on, then pins `S[i]`   |         |
|       | to `M[N(x,y)]` - the nearest calibrated cell, no hysteresis.  |         |
|       | Every live sample stamps `T[i]=C` for the sweep. A contact    |         |
|       | with no region returns. The finger is drawn by `G` on layer 2 |         |
|       | in the region's colour, above the region's own paint on layer |         |
|       | 1 (finding 5). Then the kind's branch `I[t]`; then a 9 is     |         |
|       | ended in the same pass, so nothing is built on 9 staying live.|         |
| I[1]  | vertical fader: `(gy-U(y,KY))*127//gh`, clamped, sent on      | Q1, Q5  |
|       | change; `gy` is the BOTTOM LED's calibrated position and `gh` |         |
|       | the LED span, so the top and bottom LEDs give 127 and 0       |         |
|       | exactly and the half-cell beyond each end clamps.             |         |
| I[2]  | horizontal fader: the same on `U(x,KX)` from the left LED.    |         |
| I[3]  | button: on an onset, 127 - or, latching, a toggle held in     | Q6.5    |
|       | `r[12]`; the 0 of a momentary button is `R`'s, so it fires on |         |
|       | all four release paths (section 4).                           |         |
| I[4]  | XY pad: both axes as the faders read them, ONE CC PER MOVED   | rule 3  |
|       | AXIS against the last pair sent - Phase 12's `A` with the     |         |
|       | region's bounds instead of the pad's.                         |         |
| I[5]  | the rotary (D-08), section 5.                                 | -       |

`Q` AND `W` ARE NOT ON THIS HOT PATH, and the reason is the row above: a
contact KEEPS the region it landed in (`S[i]`) for the whole gesture,
until a lift or an expiry. That is better than hysteresis and cheaper - a
finger dragged off the end of a fader must not start driving the XY pad
beside it - so the library's cell hysteresis (`W`) and its cell-change
contract (`Q`) have nothing to decide here. They stay for the hand-authored
entries. What the runtime takes from the library is `E`, `N`, `G`, `U`, the
knots and the Timer's `X`, and it DEFINES `R`, the one name the library
calls but leaves to the entry.

---------------------------------------------------------------------------
4. THE FOUR RELEASE PATHS, AND WHY A BUTTON'S 0 IS `R`'s
---------------------------------------------------------------------------

Probe A Q6.5: four of five lifts were lost after a chord. A button that
sent its 0 on code 5 would hang four notes in five. So the 0 is sent by
`R`, which `E` calls on every path there is: (1) an end code; (2) a same-id
re-press without a lift, which `O`'s onset expiry takes FIRST; (3) a press
by another contact on the region the ghost still holds, which the onset
scan over `S` takes; (4) the Timer's `X(self,20)` sweep, two seconds after
the contact's last sample. runtime.spec.ts test 2 drives all four in a VM
and asserts the 0 on the button's controller on each - the note-off, not
merely that a release ran - with the same-id case driven first.

---------------------------------------------------------------------------
5. THE ROTARY, AND THE WRAP ARITHMETIC WRITTEN OUT
---------------------------------------------------------------------------

`math` is open in the firmware's VM (`../grid-fw/common/src/c/grid_lua.c:
523`, `LUA_MATHLIBNAME`; `coroutine` and `utf8` are not), so `math.atan`
with two arguments and `math.deg` and `math.modf` are available. The
knob's row carries its CENTRE in raw units (`r[1]`, `r[2]`: the region's
middle LED position through the forward map, emit.ts) - raw, because Q1's
jitter is one raw unit wherever the finger is and the dead zone below is
therefore a constant in raw units, whereas in calibrated units it would
grow with the map's local pitch.

  u,v = x-r[1], y-r[2]                     the offset from the centre
  if u*u+v*v < 103 then F[i]=nil return    the dead zone (model.ts 4b):
                                           nothing changes, and the previous
                                           angle is forgotten so leaving on
                                           the far side is a fresh start
  a = math.deg(math.atan(v,u))//1          WHOLE degrees in [-180, 180]:
                                           screen y grows downward, so a
                                           clockwise turn INCREASES the
                                           angle. Floored to an integer
                                           because the VM said so: summed
                                           as floats, a full turn of 4-degree
                                           samples came to 359.99999 and 44
                                           steps, not 45 (13-15-SUMMARY.md,
                                           disagreement 1); whole degrees
                                           make every delta and every
                                           remainder exact
  if F[i] then                             a previous angle exists:
    c = r[13] + (a-F[i]+180)%360-180       THE WRAP. The raw difference
                                           a-F[i] is in (-360, 360); adding
                                           180, taking it modulo 360 and
                                           subtracting 180 brings it into
                                           [-180, 180), so 179 -> -179 is
                                           +2 and not -358, and -179 -> 179
                                           is -2 and not +358. Lua's `%` is
                                           floored, which is what makes the
                                           negative side land in the same
                                           half-open interval.
    k, f = math.modf(c/8)                  whole steps, TRUNCATED TOWARD
                                           ZERO, and the fraction; the
                                           remainder r[13] = f*8 keeps its
                                           sign. That is the hysteresis: a
                                           wobble of +1 then -1 degree around
                                           a fresh remainder of 0 never
                                           reaches +-8 and never steps, where
                                           a floor would step down at -1 and
                                           up again at +8.
    w = glim(r[12]+k, 0, 127)              the clamp, both ends; sent only
                                           when it moved, so a finger held
                                           at either end is silent.
  F[i] = a                                 the per-contact previous angle.

KNOB_STEP_DEG = 8 degrees a step, 45 steps a turn, 2.84 turns from 0 to
127; the dead zone's radius 10.13 raw units, the literal 103 = ceil(rho0^2)
- both DERIVED in model.ts section 4b from Probe A Q1 and rendered here,
never typed. The knob's value is `r[12]`, per REGION, so it keeps its
position between gestures; the previous angle is per CONTACT, so a second
finger does not inherit the first's. The value starts at 0.

---------------------------------------------------------------------------
6. THE SLOTS, THE CEILING, AND THE PACKER
---------------------------------------------------------------------------

Dead-branch elimination applies here as 13-RESEARCH 3.1 said it would:
HANGAR emits the runtime PER SURFACE, so only the branches the surface's
kinds need are written (`branchesUsed`, model.ts). The branches are
functions in a table `I` rather than inline `if t==1 then` blocks - about
eleven characters a branch dearer - because a function is a PART, and the
runtime spans two slots under 13-02's `three-slots` answer: `packRuntime`
fills 255/4 from the front (the head, `R`, `O`, then the branches in kind
order) until 908 is reached and the touch Timer takes the rest between
`gtt(0,100)` and the sweep. Under two slots (the emitter's parameter
default; every shipped caller passes three since 13-17 wrote 255/4 -
emit.ts section 4) everything is in the Timer, and a
surface whose runtime does not fit is a surface the meter refuses; the
measured table is runtime.spec.ts test 7's and 13-15-SUMMARY.md's. In one
sentence: on two slots a Knob shares a surface with one fader orientation
or with buttons and with nothing else, the other kinds mix two at a time;
on three slots every kind fits together with room to spare.

---------------------------------------------------------------------------
7. THE NAMES
---------------------------------------------------------------------------

The library owns `A B C D E G H K KX KY L N P Q T U V W X Y Z` and the
emitter's data half owns `J M O`. What is left of the alphabet is `F I R
S`, and the runtime spends exactly those: `S` the region by contact, `F`
the last value (or pair, or angle) by contact, `I` the branch table, `R`
the release convention. The inline contingency in emit.ts spends `S F R`
for the same three jobs and is never emitted beside this file's text.

```

## Moved from src/lib/sandbox/emit.ts on 2026-09-13 (13.2-02)

```text
The Sandbox's emitter: a surface -> the touch Setup, the touch Timer and,
under three slots, the system element's fourth event.

---------------------------------------------------------------------------
1. WHAT THIS EMITS, AND WHAT IT DOES NOT
---------------------------------------------------------------------------

The data half (13-RESEARCH 3.1, "the split"): the region table `J`, the
81-entry cell map `M`, the paint loop, the pull-in call(s) that run the
runtime's slot(s), and the callback assignment. The runtime itself - the
per-kind behaviour a contact drives - is runtime.ts's (13-15), lives in the
touch Timer (proved reachable from Setup by probe 1, `SLOT-ARITHMETIC.md`)
and, under three slots, spans the system element's fourth event as well
(probe 2); `packRuntime` decides which part lands where. runtime.ts defines
the entry `O(s,i,e,x,y)`; this Setup installs it as the touch callback
AFTER the pull-in has run, so `O` exists when it is named.
On the wire the Sandbox is a Lua entry: 13-17 lands these two strings
beside `TOUCH_LIBRARY` (255/0) and `TOUCH_LIBRARY_TIMER` (255/6) exactly
as 12.1-07's `landLua` does for a hand-authored card, and the library's
functions are what the runtime calls by name.

THE NAMES ARE FREE OF THE LIBRARY'S. The plan's interfaces block calls the
table `G` and the paint `Y()`; both are library functions since 12.1 (`G`
the bilinear finger, `Y` a corner weight, `Z` the block), and 13-02's
sketch used `S`, `N` and `K` for state that are now the library's too. The
twenty-one names the library defines are `LIBRARY_GLOBALS`; emit.spec.ts
test 5 asserts every name this file defines is outside that set and that
the only capital names it CALLS are inside it. This file's own: `J` (the
region table), `M` (the map), `O` (the runtime's entry, spelled once in
runtime.ts and re-exported here), and under the inline contingency `S`
(contact -> region index), `F` (last sent per contact) and `R` (the
release convention, section 5 of library.ts - defined, never called here).

---------------------------------------------------------------------------
2. THE SHAPES
---------------------------------------------------------------------------

  J={{g1,g2,g3,g4,t,cc,cc2,ch,r,g,b},...}   one row per region
  M={[0]=n0,n1,...,n80}                      cell -> 1-based row index, 0 none

THE FOUR GEOMETRY NUMBERS ARE PRECOMPUTED IN THE FRAME THE KIND READS THEM
IN, so the runtime never derives a bound from a cell and pays no
conversion (13-15; 13-14 carried the raw span of the cells for every kind,
and the Phase 12.1 hand-off's rule replaced it: a fader's value is read on
the library's CALIBRATED axis `U`, LED n at n*64, between the region's
first and last LED centres, or the top and bottom LEDs do not give 127 and
0). Per kind:

  fader, vertical    0, 0, gy, gh        gy = the BOTTOM LED's U (row*64),
                                         gh = the LED span ((h-1)*64);
                                         value (gy-U(y,KY))*127//gh, clamped
  fader, horizontal  gx, gw, 0, 0        gx = the LEFT LED's U, gw = (w-1)*64;
                                         value (U(x,KX)-gx)*127//gw
  button             0, 0, 0, 0          reads none
  XY pad             gx, gw, gy, gh      both axes as the faders read them
  knob               cx, cy, 0, 0        the region's centre in RAW units:
                                         its middle LED position through the
                                         forward map (`sensorAt`), so the
                                         centre and the dead zone are in the
                                         sensor's own units (runtime.ts 5)

A knob's row carries two more columns, its value and its accumulator
remainder, both 0. The knots are imported, never typed; a one-row fader
would divide by zero on the module, and model.ts section 4a is where that
is refused.

`M` IS `[0]=`-INDEXED so the lookup is `M[N(x,y)]` with `N` returning
0..80 - the spelling the Phase 12.1 hand-off names - at four characters
once, against two per lookup for `M[N(x,y)+1]`. `M` is rendered from the
SAME array geometry.ts built to validate the surface (test 3 asserts it
cell for cell), so an overlapping surface has no `M` and cannot be emitted.

A ROW'S SEVENTH COLUMN is the XY pad's second controller and the button's
latch flag (0 or 1), 0 otherwise; the fifth is the type code (model.ts);
the eighth is the wire channel (0..15, through `wireChannel`); columns
nine to eleven are the colour as `glc` takes it (0..255, through
`colourByte`). Every number is emitted at its exact width - no padding,
no float.

---------------------------------------------------------------------------
3. DEAD-BRANCH ELIMINATION IS A PARAMETER, AND THE INLINE CONTINGENCY
---------------------------------------------------------------------------

`branches` names the runtime branches to emit and defaults to the ones the
surface uses (`branchesUsed`). The data half has no branches of its own -
`J`, `M` and the paint are the same for every kind - so the parameter reaches
the runtime: under the split it is what `packRuntime` reads to emit the
Timer (and 255/4) per surface, and under the INLINE contingency it selects
which of the four branch texts below go into the callback - dead-branch
elimination in the research's words, worth about 470 characters there.
The contingency exists because the research measured four vertical faders
inline at 697 against 1,166 with every branch (13-RESEARCH 3.1), and the
plan asks the pair to be re-measured rather than quoted (emit.spec.ts test
2). It carries no Knob branch: the rotary is runtime.ts's (D-08), and an
inline surface with a Knob is refused rather than approximated.

The inline callback, in prose (its text is assembled below): an end code
(`e~=1 and e~=4 and e<9`) hands the contact to the library's `E`, whose
release `R` sends a button's 0 - so a lost lift (Probe A Q6.5) is released
by the Timer's `X` sweep through the same `R`. An onset (`e==4 or e>8`)
first expires the same id (12-07's rule, section 7 of library.ts) and then
pins the region under the finger through `M[N(x,y)]`; every live sample
stamps `T[i]=C` so the sweep sees it; a contact KEEPS the region it landed
in for the whole gesture, so a finger dragged off a fader's end does not
start driving the XY pad beside it - which is why Phase 12's `Q` and `W`
are not on this hot path. Faders and the XY pad send on change only; a 9
(press and lift in one message) is ended in the same pass after its onset
was taken, so nothing is built on 9 staying live. Both class gates run
over the text in emit.spec.ts test 4 with the gate's own needles.

---------------------------------------------------------------------------
4. THE SLOTS, AND WHY THE THIRD PULL-IN IS OFF BY DEFAULT
---------------------------------------------------------------------------

13-02 recorded the user's answer as `three-slots` (SLOT-ARITHMETIC.md
section 5): the Sandbox may pull the runtime in from the touch Timer
(`self:tim()`, probe 1) AND from the system element's fourth event
(`ele[#ele]:map()`, probe 2 - `ele[#ele]` is the spelling that lit, and
`map` is the firmware's short name for the mapmode event,
GRID_LUA_FNC_A_MAPMODE_short in ../grid-fw/common/src/c/grid_protocol.h,
read and not edited). This emitter takes `slots` as a parameter and emits
BOTH calls under 3. The PARAMETER's default is 2, and it stayed 2 when
13-17 landed the write: the reason it was 2 - HANGAR did not write 255/4,
so a Setup calling `ele[#ele]:map()` on a module whose 255/4 held the
firmware's page-next would TURN THE PAGE on every load (D-19) - is gone
since 13-17 writes the slot on the same install (SLOTS' third row) and
PUT BACK restores it, but emit.spec.ts pins the two-slot figures against
the bare call and moving the default would move those pins for nothing.
Every shipped caller passes 3: the route's SLOTS, preview.ts's
PREVIEW_SLOTS and land.ts's LANDING_SLOTS. The costs are measured under
both (emit.spec.ts test 1 prints the pair) and the difference is the
fifteen characters of the second call.

The ceiling in element KINDS is the runtime's - runtime.ts section 6 and
runtime.spec.ts test 7 measure it under both slot counts; the data half is
the same under every answer, which was 13-14's premise and holds.

```

## The blank kind (2026-09-18, change 10A; `BENCH-2026-09-16.txt` section 10)

A blank is a coloured region that sends nothing: the user's "add a Blank element which just colors
the LED". It is paint only, and the runtime never learns it exists. The form, chosen from four:

- **In `J` and `M` like every region, with a sixth type code and a no-op branch `I[6]`.** Rejected:
  `O` calls `G` (the finger on layer 2) BEFORE the kind's branch, so a finger over a blank would
  light under the finger in the blank's colour, and the brief asked for nothing drawn; a guard in
  `O` (`if not r or r[5]>5`) would have cost every surface eleven characters and moved every
  Sandbox fixture on the wire.
- **Out of `J`, its cells 0 in `M`, painted by a second loop over its own table.** Rejected: a second
  loop is about a hundred characters fixed plus a row per blank, dearer than the form kept.
- **In `J` with a no-op branch and `V` called from the branch to clear what `G` drew.** Rejected:
  the runtime would call a sixth library name (`RUNTIME_CALLS` pins five) and the finger would
  still be drawn and cleared inside one callback.
- **KEPT: in `J` with the colour alone, its cells NEGATED in `M`, one fallback in the paint.** The
  blank's row is `{[9]=r,[10]=g,[11]=b}` (the three columns the paint reads and nothing else); its
  cells in `M` carry its 1-based index negated (`-5` for the fifth region); the paint reads
  `local r=J[M[n]]or J[-M[n]]`, so a negated cell falls through to the row, and a surface WITHOUT a
  blank renders the old paint byte for byte. The runtime's onset pins `S[i]=M[N(x,y)]`, a negative
  number, and `J[S[i]]` is nil: `O` returns before `G`, nothing is drawn, nothing is sent, and the
  library's `E` on the lift finds nothing to clear (`B[i]` was never written). The contact is still
  swept by `X` like any other. `emit.spec.ts` test 7 runs it in the VM: the rest frame lights the
  blank's cells, a press and a move on the blank leave the frame and the MIDI log untouched, the
  fader beside it still sends and moves the frame.

The cost, under the pinned `compressScript` at the picker corner: a blank's row is 27 characters
(`{[9]=255,[10]=255,[11]=255}`, brightness-scaled like every colour), plus its comma, plus ONE
character - the minus sign - for every cell it covers in `M`, plus the fallback's 11 once per
surface that has a blank. Page 3 with a 2 x 2 blank and a 1 x 1 blank: Setup 636 -> 708 at three
slots (+72 = 27 + 1 + 27 + 1 + 11 + 5 minus signs); the Timer and 255/4 are unmoved. `costOf`'s
representative region is still the dearest fader, so the room floor is unchanged in kind.

The editor gives a blank `cc: 0, channel: 1` as inert fields (schema.ts keeps one Region shape;
`freeController` skips blanks when handing out controllers); the inspector shows no MIDI output for
it; the preview runs the same emitted Lua, so it shows the colour and ignores the finger without a
line of its own.
