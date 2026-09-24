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

## The options, the pictures, the trim and five slots (2026-09-18, change 10B; `BENCH-2026-09-16.txt` section 10, answers 5 to 12)

Part B of the Sandbox feature set: every sending kind gained MIDI options, every kind an animation
on the module, and the runtime the room to carry them. What the row, the runtime and the slots are
now, with the measured figures (the pinned `compressScript` after `initLuaFormatter()`, the RGB444
picker corner, `runtime.spec.ts` tests 7 to 14 and `emit.spec.ts` tests 1 and 8).

### The row: the box, then the tail

`J`'s row is `{col,row,w,h,t,cc,c7,ch,r,g,b[,min,max,flags[,spring | cx,cy]]}`. The first four are
the region's BOX in cells (13-15's kind-specific frame went: the pictures need the cells, and the
frame is three characters of Lua per read - a vertical fader's bottom LED is `(r[2]+r[4]-1)*64`,
its span `(r[4]-1)*64`). `c7` is the XY pad's second controller or the button's radio group (1..8,
0 none); the toggle flag moved into the flag word. The TAIL is written only past the last
non-default value: a region with every option at its default has the eleven columns it had, and
`O` reads the missing columns as `0, 127, 0` once per sample (`r[12]=r[12]or 0 r[13]=r[13]or 127
r[14]=r[14]or 0`, 46 characters once per surface). Column 15 is a spring fader's spring POSITION;
columns 15 and 16 a knob's centre in raw units (always written - `emit.ts`'s `knobCentre`, the
middle LED's knot or the floor of the middle two's midpoint, what `sensorAt` gives; it saved 85
characters of runtime against ~9 per knob in the Setup). The price per region in the Setup, at the
widest literals: a min alone `,100` +4, min and max `,100,120` +8, Relative `,0,127,1` +8, Relative
at Full `,0,127,3` +8, Spring `,0,127,4,64` +11, everything on `,127,100,7,127` +14; page 3 with
every option on 489 -> 525 (+36). The row/flag encoding beat one column per option (each boolean
would cost `,0` on every row that has any later option) and a packed word of every option (a
knob's centre and a spring position are numbers, not bits).

**The flag word** (`model.ts` `flagsOf`): a fader's bit 0 Relative, bit 1 Full, bit 2 Spring; an XY
pad's bits 0 and 1 the same; a button's bit 0 Toggle (`latch`), bit 1 a Note output; a knob's is its
mode's index 0..3 (Absolute, two's complement, binary offset, sign magnitude). Read in the Lua as
`f%2`, `f//2%2`, `f//4`, and `m` for the knob.

### The runtime: positions, `W` folded into `D`, and the pictures

Every continuous kind keeps a POSITION 0..127 along its travel and sends through one scale,
`min + (max - min) * v // 127` - so a min above the max inverts the direction for nothing, and a
spring value is stored as the first position that lands it exactly (the span is at most 127 wide,
so consecutive positions differ by at most one value; `model.ts` `springPosition`; the
representative region's 100 under 127..100 lands at 123). The scale lives inside `D(s,r,n,c,v)`,
the "scale, then send on change of the sent value, kept in column `n`" helper: folding `W` into
`D` saved 47 characters over a separate `W`. Relative faders and XY pads hold their position in
FINE units (127 per position step, 0..16129) so a half-speed move of one raw unit is one exact
increment with no float and no remainder; the onset anchors (`F[i]`) and changes nothing; a
release keeps the value; a spring fader's first touch starts from `r[15]*127`. The knob's centre
comes from the row; its absolute position is `r[17]`, the remainder `r[18]`; under a relative
mode the detents crossed in the sample go out in the encoding (two's complement `k%128`, binary
offset `64+k`, sign magnitude `k>0 and k or 64-k`) - at most 22 in one sample by construction
(the wrap bounds a sample at 180 degrees), inside every encoding's 63, so no cap is written. The
button's off is `K(s,r)`: note-off as status 128 with velocity 0 (ORBIT's spelling, the MIDI
note-off proper; a DAW treats 144 with velocity 0 the same, but 128 is what a monitor shows as an
off), else the min on the controller; on is 144 with the max as the velocity, or 176 with the max.
A radio group is the seventh column, 1..8 (eight keeps the field's select one screen); a press
turns every other on member off through `K` first (each sends its off and goes dark), a second
press on an on toggle in a group turns it off.

The state columns past the data: 17 the held fine position / the held x / the on-flag / the
knob's position, 18 the held y / the knob's remainder, 19 and 20 the last sent value per
controller, 21 the XY pad's crosshair cell (`runtime.ts` `STATE_COLUMNS`). Sending is on change
of the sent value per region ACROSS touches: a re-press at the same value re-sends nothing (13-15
re-sent per contact); a relative XY pad's first move reports the other axis's held value once.

**The pictures** are the runtime's own `glp` on layer 2 through `Q(r,f)` - every cell of the box
at the phase `f(x,y)` returns, `Q(r)` a clear - in the region's colour, which the Setup's paint now
sets on layer 2 once (`glc(a,2,...)`, +27 in the paint; `Q` sets phases alone). The library's `G`
finger is no longer called. Per kind: a fader's bar from its low end to the position (`k=p*(len-1)
//127` rows or columns lit, so position 0 lights the low cell), redrawn on a moved position and
held on the lift under every mode (a fader holds its position; a Spring fader's `R` draws the
spring return through the fader's own branch with no finger, `I[1](s,i,r)`) - change 10C, after
the bench of 2026-09-18 read a bar going out on the lift as the fader falling to 0; a button's
whole region while on (a toggle stays, a momentary and a radio member go dark with their off);
the XY pad's row and column through the finger's cell `N(x,y)` (redrawn when the cell moves,
cleared on release); the knob's cells whose angle from `b` lies within `k` - the arc from 7:30
(135 degrees) to `position*270//127` under Absolute, the sector within 45 degrees of the finger
under a relative mode - the centre cell dark, cleared on release. Layer 1's rest colour is never
touched. The preview runs the same strings (`preview.ts`, five slots) and shows exactly this.

### The trim and the five slots (answer 12)

A Sandbox landing writes the TRIMMED library (`library-trim.ts`, sliced from `LIBRARY_PARTS` by
name; `library.ts` untouched): 255/0 keeps the head, the map, `U E X N` and `self:tim()` - 842 ->
460, **382 freed**; 255/6 keeps the marker alone - 873 -> 9, **864 freed** (`V G Z Y K A D` have
no caller once the runtime draws its own pictures; `W Q` never were on the hot path). The names
the trim retires are the runtime's to spend: it defines `S F I R O` and `Q D K`; it calls `E N U
X`. `packRuntime` under five slots fills 255/6, 255/0 (each the trimmed half, then the head, then
the parts), 255/4 and the Timer, LARGEST PART FIRST into the first slot with room (first-fit
decreasing: in the parts' order the five-kind runtime did not pack - 255/0 and 255/4 were left with
163 and 180 free while the Timer took 1,161). The parts, measured: R 249, O 323, Q 111, D 100, K
114, I[1] 503 (both orientations, `I[2]=I[1]`), I[3] 298, I[4] 502, I[5] 608 - 2,817 with every
branch, 2,230 without the knob (13-15's 1,340 / 1,042). Page 3 (every kind) lands 255/6 869 (39
free), 255/0 908 (0 free), 255/4 834 (74 free), Timer 783 (125 free), Setup 489; the placement
R:255/6 O:255/0 Q:Timer D:255/0 K:Timer I[1]:255/4 I[3]:255/4 I[4]:Timer I[5]:255/6. Every
combination of kinds fits five slots (the dearest, four kinds with both fader orientations, 3,394
of 3,632 across the four runtime slots); two slots carry NO kind any more (one fader 1,343), three
carry one kind alone - the spec keeps both counts measured and the emitter's default stays 2 for
the pins. The measured cost model covers five strings (`cost.ts` `measureSurface`, `land.ts`
`refusalOf` in write order: System timer, System, Utility, Timer, Setup); the cap floor's
representative is the dearest fader with every option on (`,127,100,7,123`): from an empty
surface eleven of them fit before a string is over - the number the user no longer sees; from the
dearest twelve, fifteen; the dearest sixteen at their defaults still fit (892 at five slots).

### Retired, and the alternatives that lost

The inline contingency (`runtime: "inline"`, the four inline branch texts, `RELEASE_WITH_BUTTON`,
`OWN_NAMES_INLINE`) is gone: it read the kind's frame, could never carry a knob, was never shipped,
and porting it to the box and the options would have been a second runtime to keep true; the
dead-branch pair is measured through the split (four faders' runtime 1,867 with the fader branch
alone, 3,394 with every branch). The knob's per-sample centre from the knots (`(KX[..]+KX[..])//2`,
90 characters) lost to two row columns. A separate `W` lost to the fold into `D`. A cached bar
position (`r[22]`) lost to redrawing the bar on every moved position. A cap on the knob's detents
per sample was dead code and went. Two slots' and three slots' fits are recorded, not designed for.

## Multitouch on the XY pad (2026-09-18, change 11; `BENCH-2026-09-16.txt` section 11, answers 1a and 2a)

An XY pad gained a `Touches` select, 1 to 5, default 1. Finger n sends X on `cc + 2(n-1)` and Y on
`cc2 + 2(n-1)` (answer 1a); a new finger takes the lowest free slot (answer 2a); a finger past the
count is ignored; every finger has its own crosshair, its own held pair under Relative, its own
last-sent pair; Min / Max and Relative / Speed apply per finger. What the row, the runtime and the
slots are now, with the measured figures (the pinned `compressScript` after `initLuaFormatter()`,
the RGB444 picker corner, `runtime.spec.ts` tests 15 and 16, `emit.spec.ts` test 9).

### The count rides in the seventh column

The count is `cc2 + 128(touches - 1)` in the row's SEVENTH column (`model.ts` `seventhOf`): a
one-finger pad's seventh is its `cc2`, byte-identical to the row before the change; the runtime
reads `r[7] > 127` as "more than one finger", `r[7] % 128` as the second controller and
`r[7] // 64` as the last slot's controller offset (`2(t-1)`, exact because a slot key is even).
Measured against the two forms the brief named: the flag word's bits 2..4 would force the tail on
an otherwise-default pad (`,0,127,16`, +10) and a column of its own `,0,127,0,5` (+11); the
seventh column costs one to three characters (`22` -> `150` at two fingers, `534` at five) and no
tail. The flag word keeps bits 0 and 1 (Relative, Full) and nothing else for a pad.

### The variant: three texts swapped only when a pad has more than one finger

The multitouch machinery cannot live inside the single-touch `O` and `R`: the entry's onset expires
every other contact holding the region landed on, and the release clears the whole region - both
right for one finger per region, both wrong for five. Any edit to those two texts would move every
existing fixture, so the runtime carries a VARIANT of `R`, `O` and `I[4]` (`runtime.ts`
`MULTITOUCH_TEXT`) that `runtimeParts(branches, multitouch)` swaps in when `hasMultitouch` holds
for the surface - dead-branch elimination by option - and every other part (`Q D K`, the fader,
the button, the knob, the head, the arm, the sweep) is the same text. A one-finger pad on a
multitouch surface runs the variant too and behaves exactly as today (test 15's fourth block:
test 4's sequence gives test 4's values, a second finger takes over as test 2 says). The proof that
the single-touch runtime did not move is the gate's sandbox set: 361 records byte-identical, 0
moved, 114 added (six new fixtures times nineteen), and every `E/` and `P/` record and the base
`S/page3/...` records unmoved.

**The entry** (`O`, 323 -> 392): an onset on a pad whose seventh column is past 127 expires nobody;
it walks `k = 0, 2, 4...` while slot k's CELL column is set (`while r[22+3*k] do k=k+2 end`), returns
unpinned when `k > r[7]//64` (every slot held: the finger is ignored - no picture, no message, its
later samples find no region and its lift is silent), else `F[i]=k` and `S[i]=n`. Every other
region keeps the single-touch rule. The tail defaults are NOT read per sample any more: the
variant's Setup paint reads them once per row (`emit.ts` `renderPaint`, +50 in the Setup - the
49-character `TAIL_DEFAULTS_LUA` and a space), which is what keeps the entry inside 255/0's room
beside the trimmed library (908 - 460 - 1 - 24 = 423; at 442 with the defaults it fitted no slot
beside any large branch and the fader + pad + knob surface was over).

**The release** (`R`, 249 -> 234, shorter): an XY pad's release runs its branch with no finger,
`I[4](s,i,r)`, while `F[i]` still names the slot - `F[i]=nil` is the last statement - so the slot's
cell goes and the union is redrawn; a knob alone is cleared whole; the guard is `if r then ... end`
instead of `if not r then return end` and the single-touch `r[21]=nil` went.

**The branch** (`I[4]`, 502 -> 601): the finger's state lives in six columns from `z = 17 + 3k`
(k its controller offset, `F[i]` or 0): z+1 the held x, z+2 the held y (fine units, Relative),
z+3 and z+4 the last sent pair (`D`'s own columns, so `D` is unchanged), z+5 the crosshair cell -
nil while the slot is free, which is the entry's "free" test - and z+6 the Relative anchor. Slot 1
is columns 17..22, the single-touch layout plus the anchor. The crosshair is the UNION of every
held slot's row and column: `Q(r, f)` with `for j=22,46,6 do if r[j] and (...) then return 255 end
end return 0` - the five cell columns, a constant bound (columns past the pad's count are never
written). Called with no finger it drops its slot's cell, redraws and does nothing else. Finger k
sends through `D(s,r,z+3,r[6]+k,a)` and `D(s,r,z+4,r[7]%128+k,b)`. A subtable per slot lost: `D`
writes the sent value into `r[n]`, so a slot table would have needed a variant `D` or an inline
send, and the accesses saved did not pay for the table's creation.

### The costs, and the one combination that does not fit

The variant's texts: R 234, O 392, I[4] 601 (the single-touch 249 / 323 / 502); the multitouch
runtime alone with every branch 2,970 (the single-touch 2,795). Beside a multitouch pad, every
subset of the other kinds fits five slots (`x`, `vx`, `hx`, `vhx`, `bx`, `vbx`, `hbx`, `vhbx`,
`xk`, `vxk`, `hxk`, `vhxk`, `bxk`) EXCEPT the three that carry a fader, the button AND the knob
(`vbxk`, `hbxk`, `vhbxk`): 869 + 876 + 846 + 956, the Timer 48 over. No packing exists, first-fit
or perfect: the three large parts (the knob 608, the pad 601, the fader 503) each need a runtime
slot of their own, the button (298) then fits only beside the fader (the Timer, 51 left), the
entry alone fills 255/0 (27 left), and the four small parts (`R` 234, `K` 114, `Q` 111, `D` 100)
have 31 / 27 / 47 / 51 characters left to share - the last one has nowhere to go. Tried and
measured: the union painter as its own part (`W`, 129, a free name) moves 143 characters out of
the branch and 12 into `R` and packs no better; a perfect packer in place of first-fit decreasing
finds nothing; the tail defaults moved to the Setup (taken, -46 in the entry) is what made
`vxk` and `bxk` fit; the shared texts (the knob's 608 most of all) are pinned by every fixture
and stay. So the PDF's page 3 with its pad at two fingers - 869 / 876 / 846 / 956, Setup 489 ->
540 - is refused by the measured cost model on the Timer (`land.ts`'s refusal, Store's over-budget
line), and the same four elements without the knob (869 + 876 + 834 + 381), without the button or
without the fader fit. The cap floor with every option on is unchanged - eleven of the dearest
faders from an empty surface, fifteen from the dearest twelve, the dearest sixteen at 892 - because
the representative is a fader and a surface without a multitouch pad runs the single-touch runtime.

### The preview

`preview.ts` runs the same five strings, so Play shows the variant. The plate routes every pointer
by its `pointerId` (`SurfaceEditor.svelte`'s `onfinger`, the route's `host.touchDown(pointerId,
...)`, `pointercancel` as a lift), so a touch screen delivers several fingers to the pad and each
takes its slot; a mouse is one pointer and cannot show two. Multitouch is proved in the VM
(`runtime.spec.ts` test 15: two fingers on both pairs with independent positions, the lowest free
slot, the third finger ignored, the union and a lifted finger's cross gone, Relative per finger,
five fingers on five pairs with a sixth ignored and the middle slot retaken).

## MIDI types, MIDI RX and the colour input (2026-09-23, change 17A; `BENCH-2026-09-16.txt` section 17)

Every Sandbox element sends by its **Type** on its **Channel** (an XY pad's Y axis on its own), and **receives** by
default; the surface may take its colours from the DAW. The model, the wire and the rules are `docs/MIDI.md`
section 3; this section is the runtime's ledger.

**The row.** The eighth column is the CHANNEL WORD - the wire channel, plus 16 times the type's code (CC 0, Channel
pressure 2, Pitch bend 3, a button's Note -2), plus 128 when the element does not receive (Receive off, a relative
knob, a pad with more than one touch). A controller that receives is the bare channel, the column before change 17,
so a default row is byte-identical; a pitch bend's controller column is 0; an XY pad's Y axis word is the fifteenth
column when it differs from the X axis's. The button's note left the flag word (bit 1) for the word's code, so a note
button with no other option loses its forced tail (`,0,127,2`, 8 characters) for one character on its word. Measured
against a flag-word bit (+10 on an otherwise-default row) and a column of its own (+2 to +4 on every row).

**The texts, before -> after** (characters, canonical): `R` 227 -> 232 (it forgets the stamp and is the expiry: `E=R`,
the library's `E` no longer landed); `O` 323 -> 273 (the tail defaults left it for the Timer's head); `D` 100 -> 174
(the send by the channel word, silent with no element); `K` 114 -> 115; `I[1]` 503 -> 420 and `I[4]` 502 -> 537 (the
positions through the new `A`, 133; the pad and the knob redraw with no finger); `I[3]` 298 -> 295; `I[5]` 608 -> 602;
`Q` 111; new `Y` 539 (the receive callback; 580 with the colour input's call) and `Z` 337 (the hue wheel; 392 dimmed).
The multitouch variant: `R` 234 -> 243, `O` 392, `I[4]` 601 -> 509. The runtime alone with every branch 2,795 -> 2,908,
without the knob 2,208 -> 2,305, the knob's share 603; the receive half beside every branch +540.

**The heads moved out of the Setup.** Sixteen elements at their dearest defaults left the Setup 16 characters (892 at
five slots), and RX adds three statements there by the obvious route; so none of them is the Setup's: the contact
tables `S={}F={}` are the trimmed 255/0's head (`TRIMMED_HEAD`, `--[[@cb]]T={}C=0 S={}F={}`: 255/0 842 -> 460 at 10B ->
363 now) - the Setup's only under two or three slots; the tail defaults are a loop at the head of the touch Timer
(`TAIL_DEFAULTS_LOOP`, whose first run is inside the Setup's own `self:tim()`); the receive assignment
(`self.midirx_cb=Y`, or `=nil` when nothing receives) is at the Timer's end, every run. Each slot's head is `I=I or{}`
(8, was 24). So the dearest sixteen still land at **892** at five slots and the cap floor from an empty surface is still
**11** of the dearest faders; from twelve it is **14** (was 15: the dearest channel word, a channel pressure on 16 with
Receive off, 175, is one digit more).

**The Setup is the fifth slot** under five slots: a part may stand between its data half and its pull-ins, and when
first fit decreasing leaves a part over, an exact depth-first search (bounded by the room left and by 20,000 tries;
under a millisecond on page 3) looks for a placement. **Page 3** (a fader, a pad, a knob, a button, every one
receiving): 255/6 893, 255/0 908, 255/4 852, Timer 906, Setup 900 - it fits, with 73 characters left across its five
strings (before 847 / 908 / 834 / 783 / 489); placement R:Timer O:255/6 Q:Setup D:Setup A:Timer K:Setup I[1]:Timer
I[3]:255/4 I[4]:255/0 I[5]:255/6 Y:255/4. The cost of that: page 3 has room for **one** more dearest fader (it had
room for many). With every element's Receive off it is 893 / 908 / 907 / 716 and the Setup 497 again. Every kind
combination fits five slots with every element receiving; beside a multitouch pad the same three are over as at change
11 (`vbxk`, `hbxk`, `vhbxk`). With the colour input on, the three combinations that carry a fader, a button, a pad and
a knob are over (page 3 with the colour input: the Timer 1,239); fewer kinds fit.

**What RX does per kind** (`runtime.spec.ts` tests 17 to 20): a fader's held fine position and bar (a relative fader
continues from it, a spring fader holds it until its next release); a button's on-flag and light (on above 0 and not
its min); a one-touch pad's matching axis and the crosshair at the held pair; an absolute knob's position and arc.
The value is kept as the last one sent, so nothing is echoed. A neighbour's traffic (INSTR 14), another channel,
another number, a program change on a note's number, and a stale callback (another landing's touch callback installed)
are ignored.

## Latch (2026-09-23, change 18; `BENCH-2026-09-16.txt` section 18)

Every element that takes touch has **Latch**, Off / On, **On by default**. On is what every element did before
change 18: `O` pins a contact to the region it landed on (`S[i]=M[N(x,y)]` on the onset) and every later sample of
that contact drives that region, wherever the finger goes. Off lets a sliding finger pass to the element it moves
onto - a strum across buttons, a glide from fader to fader. The field is the schema's `latchTouch` (absent is On; an
older draft reads On); the button's own `latch` is its Toggle and is not this.

### The hand-over rule

On every live sample the hand-over entry reads the finger's cell `n = M[N(x,y)]` beside the region the contact
holds, `g = S[i]`. When the sample is not an onset, `n` is not `g`, and the contact is **free to pass** - it holds a
region that is Latch Off, or it is already waiting (`S[i] == false`) - then:

1. the old region is released through `E` exactly as a lift releases it: a momentary button sends its off, a fader
   keeps its bar where the finger left it (10C), a spring fader springs back and sends its spring value, an XY pad's
   crosshair and a knob's arc clear, a multitouch pad frees the finger's slot;
2. the contact **waits**: `S[i] = false`, which pins no row (`J[false]` is nil) and holds no region;
3. if the new cell is an element (`n > 0`: not empty plate, not a blank) and no other contact holds it, the sample
   becomes an **onset** there - the ordinary onset, so the element sees a press: a button presses (a toggle toggles,
   a radio group clears its others), an absolute fader or pad jumps to the finger, a relative one anchors and waits
   for movement, a knob starts its angle, a multitouch pad gives the finger its lowest free slot.

A waiting contact keeps waiting across empty plate and blanks and takes the next free element it reaches. A contact
that **landed** on empty plate or a blank (`S[i]` 0 or negative), or on an element that is On, is never free: On keeps
its finger regardless of where it goes, and a finger that touched down on nothing touches nothing (the rule before
change 18). A hand-over INTO an On element is allowed; from then on the On element keeps the finger.

**The steal decision: a sliding finger never takes a held region.** When the element under a free finger is held by
another contact (`o = o and h ~= n` over `S`), the finger releases its old element and waits on nothing; it takes the
region on its first sample after the holder lifts. A finger held perfectly still produces no sample (the firmware's
change gate; `lua-host.ts` models it), so it takes the region when it next moves. A multitouch pad with any finger on
it counts as held - a sliding finger does not join it. A finger that LANDS on a held region still takes it, as before.
Why: the user's case is a finger touching a second fader by accident; a slide that stole a held fader would be exactly
that accident. A contact expired by such a landing is gone for the gesture, as before.

### The encoding: the channel word's hand-over bit

A Latch Off region's CHANNEL WORD (column 8, change 17) is **512 higher** (`model.ts` `HAND_OVER_BIT`): every Off word
is 480 and up (a note's -32 + 512), every On word under 192, so the entry reads `J[g][8]>479`. The readers that run at
On take the word apart by `%16` (the channel), `%128` (a note's `>95`) and `//16%4` (the type), which 512 leaves alone
(`emit.spec.ts` test 10 walks every type, Receive and channel). The one reader that reads the word whole is `Y`, the
receive callback: its rows are swapped for a variant that takes `%512` first, into a local (`RECEIVE_ROWS_HAND_OVER`,
+6). At On the word is the one it was, so every row is byte-identical.

Measured, every element Off, rows + readers + the entry's read (`emit.spec.ts` test 10; keyed field `,h=1` / flag-word
bit 8 / channel-word bit 512): page 3 **22 / 39 / 21**, page 3 with every option **22 / 18 / 19**, eight elements
**38 / 76 / 25**, sixteen **70 / 140 / 33**. The keyed field is four characters a row; the flag bit forces the tail where
it was omitted (`,0,127,8`) and needs `R`'s spring test (`f//4>0`, both releases) and the knob's mode (`m`) to take
the flag word apart - variants of texts every surface carries (+5); the channel bit costs a word at most two digits
(a Receive-off word none: 175 -> 687) and `Y` 6. The channel bit is the cheapest on every surface measured.

### The variant: `O` and `Y` swapped in only when an element is Off

`HAND_OVER_TEXT.entry` is the entry spliced from its pieces with the hand-over between the head and the onset:
**`O` 273 -> 399 (+126)**; under multitouch **392 -> 518 (+126)** - the same hand-over in front of change 11's onset.
`Y`'s rows +6. Nothing else moves: `R`, the branches, `D`, `K`, `Q`, `A` are the texts they were. A surface whose every
element is On carries exactly the strings it did - every earlier fixture, the field absent or `true`, is byte-identical
under two, three and five slots (`runtime.spec.ts` test 22), and the gate's sandbox set moved only by its nine new
fixtures.

### The costs, at the picker corner

- **Five slots, On -> every element Off** (255/6, 255/0, 255/4, Timer, Setup): four faders 830/903/558/111/482 ->
  907/791/725/111/486; eight elements 852/907/832/231/614 -> 858/907/824/365/622; twelve 852/907/832/231/758 ->
  858/907/824/365/770; sixteen 852/907/832/231/892 -> 858/907/824/365/**908** - every one fits.
- **Page 3** (a fader, a pad, a knob, a button, every one receiving) had 81 characters free across its five strings
  (893 / 908 / 852 / 906 / 900); the hand-over wants 126 for `O`, 6 for `Y` and a word's digits. **Page 3 with any one element Off is over**, and with
  all four Off (the Timer carries what fits nowhere: 852 / 908 / 858 / 1,076 / 905). With every element's Receive off it
  fits (852 / 908 / 837 / 842 / 617).
- **The ceiling in kinds**, every element Off and receiving: the three combinations carrying a fader, the button, the
  pad and the knob are over (`vbxk`, `hbxk`, `vhbxk` - the three change 11 put over beside a multitouch pad); every
  combination of fewer kinds fits. Beside a multitouch pad, every element Off: `vhxk` is over too (four).
- **The cap floor**: the representative region now carries Latch Off (the dearest: its word 175 -> 687, three digits;
  the entry once). From an empty surface **11 -> 11** of the dearest option-laden faders; from twelve **14 -> 14**.

### Proved in the VM (`runtime.spec.ts` test 21)

On, pinned: a finger slid from Lane A up and across into Lane B drives Lane A alone (25, 50, 76, 101) and Lane B hears
nothing. Off: the same slide hands over at the first sample in Lane B - Lane A stops at 50 with its bar kept, Lane B
jumps to the finger (76, then 101); back into Lane A it hands over again. A strum across four Off buttons with an empty
cell before the last presses each in turn with its off on the way out (90 on, 90 off, 91 on ... 93 on, then 93 off on
the lift); the same row On sends the first button's on and off alone. An Off fader's finger onto empty plate is released
(its bar kept, nothing sent), crosses the empty cells sending nothing and presses the next Off button it reaches; an Off
spring fader left for empty plate springs back (101, then 64); a finger that landed on empty plate crosses a button and
a fader and sends nothing. A finger slid from an Off button onto an On button another finger holds waits (the Off
button's off, no second press), takes it on its next sample after the holder lifts, and - the On button keeping it -
slides on past an Off button that hears nothing. A finger slid from an Off button onto an Off multitouch pad with a
finger on it waits; alone, it takes the pad's first slot, and slid back out its cross goes and the button presses.
Page 3 with every element Off receives exactly as page 3 does.

### The preview and the interface

`preview.ts` runs the same five strings, so Play shows the hand-over; the e2e walk slides one mouse finger from one Off
button across onto another and reads the second's on in the Play monitor (a run of the walk with Latch left On did
not). The
inspector's Latch row is the last row of Behavior on every kind that takes touch, its helper the label's title; over a
set of mixed kinds (no blank) Behavior shows Latch alone. `setLatchTouch` writes every member as one entry, refuses a
blank or Play; Latch is remembered per kind (13B).

### Found, not fixed: a one-cell-wide fader divides by zero

`A(r,x,y)` (change 17) computes BOTH positions of a finger, so a vertical fader one cell wide divides by `(r[3]-1)*64`
= 0 on its x axis (and a horizontal fader one cell tall on its y axis): the touch callback raises "attempt to divide by
zero" on every sample and the fader sends nothing. The editor allows a 1 x 2 vertical fader and a 2 x 1 horizontal one
(`minimumSizeFor`), and emit.spec's twelve and sixteen are 1-wide faders (measured only, never run). Change 18's VM
fixtures use two-wide faders for that reason. A guard (`r[3]>1 and ... or 0` per axis) is +31 characters on `A`,
which every surface with a fader or a pad carries - it moves the sandbox set at the default, so it is not in change 18.
Fixed by change 18b, below.

## The one-cell fader, and the knob without Latch (2026-09-23, change 18b; `BENCH-2026-09-16.txt` section 18)

2026-09-23: the two changes the user's decisions on change 18 asked for, Sandbox only; no catalog entry moves.

### The one-cell fader: `V`, the axis with its divisor clamped

`A(r,x,y)` now reads each axis through a new part, `V(d,l)` - `glim(d*127//glim(l-1,1,9)//64,0,127)`, `d` the
finger's distance in calibrated units from the axis's 0 end, `l` the region's length in cells along it:

    function A(r,x,y)return V(U(x,KX)-r[1]*64,r[3]),V((r[2]+r[4]-1)*64-U(y,KY),r[4])end
    function V(d,l)return glim(d*127//glim(l-1,1,9)//64,0,127)end

The span `(l-1)*64` is divided by in two steps. Floor division twice is floor division once by the product when both
divisors are positive, so every box two cells and up reads exactly the number it did. `runtime.spec.ts` test 23 runs
change 17's `A` and this one side by side in the VM over every box two cells and up on each axis and every raw
coordinate -4..131 (4,896 positions): 0 differ. A length of ONE cell divides by 1 instead of raising `n//0`; the
fader throws that axis away. An XY pad reads both axes, and the editor refuses a pad under 2 x 2, so no pad reaches
it. `V` is a name the trim freed; under two or three slots the full library's `V` (a block clear) is called only by
the library's `E` - the runtime's own since change 17 - and `G`, which nothing calls.

**The cost, canonical, over change 17's `A` (133):** shipped `A` 83 + `V` 61 = **+11**; measured beside it the clamp
written into both of `A`'s formulas as one part **+14**, `A` handed the kind so it computes only the axis read **+31**,
and `r[3]>1 and ... or 0` per axis **+33**. Two parts rather than one also pack: page 3 with every option on still lands
five slots at the picker corner (906 / 908 / 905 / 897 / 902), where the +14 one-part form does not fit at all (an
unbounded exact search found no placement). **Per surface**, every surface that carries `A` (a fader or a pad) is
**+12** - the 11 and one separator - at the corner under five slots: runtime.spec's page 3 893 / 908 / 852 / 906 / 900
-> 893 / 908 / 905 / 897 / 868 (81 -> 69 free), four faders 2,884 -> 2,896, eight 3,436 -> 3,448, twelve 3,580 ->
3,592, sixteen 3,714 -> 3,726 across the five strings, and each of those with every element Off 12 more likewise (the
sixteen's Setup still 908); the runtime alone 2,908 -> 2,920, without the knob 2,305 -> 2,317; page 3 under two slots
3,560 -> 3,572. Every fixture that fitted still fits; the cap floor stays **11** from an empty surface and **14** from
twelve; page 3 with the pad at three fingers and the knob stays over, 168 -> 180. A surface of buttons and knobs alone
carries no `A` and does not move.

**Found by the new placement, fixed: the entry never lands in the touch Timer beside a receive callback.** `V` moved
page 3's placement, and first fit then put `O` in the touch Timer. The Timer re-runs its body every period, so each run
defined a NEW `O`, and `Y`'s `s.touch_cb~=O` (the Setup assigned the first one) read every host message as a later
landing's and ignored it - `runtime.spec.ts` test 18 caught it. `packRuntime` now refuses the Timer to the entry when a
receive half is packed and there is another slot. No placement that already worked moves (first fit only differs where
`O` would have gone to the Timer); under three and five slots, 19 fixture landings that fit with a receive half all
keep `O` elsewhere (test 23). Under three slots several fixtures still put `O` in the Timer, all
of them over and refused.

**Proved in the VM** (`runtime.spec.ts` test 23): a 1 x 6 vertical fader sends 127, 0, 76 as Filter does (a wobble
across the axis it does not read sends nothing), its bar from the bottom to row 3; a 1 x 2 127 and 0; a 6 x 1
horizontal 0, 127, 50 with its bar; a 2 x 1 0 and 127; the 3 x 3 pad beside them as test 4 - under five slots and
three; the 1 x 6 relative at full with the spring at 100 sends 127 then 100; two 1 x 6 Latch Off side by side hand over
(70:25, 70:50, 74:76, 74:101); every one-cell fader validates, a 1 x 3 or 3 x 1 pad is refused. `emit.spec.ts` test 11
lands every emit.spec surface on five slots and RUNS it - one, page 3, eight, twelve, sixteen, four faders, page 3 with
every option, page 3 at three fingers, sixteen at typed literals, eight / twelve / sixteen every element Off, and four
of the cap floor's representative at 1 x 2 - every fader and pad (63) sends on its channel, an absolute controller
exactly its min then its max, nothing raises. On change 17's divisor that test stops at twelve's first fader.

### The knob loses Latch

`takesLatch(kind)` (model.ts): the fader, the button and the XY pad; not the blank, and not the knob, whose Off only
ever read as a fault on a rotary gesture. `latchTouchOf` reads a kind that does not carry it as On whatever it stores,
so a knob stored Off while change 18 allowed it (a few hours, never deployed) is a valid record that loads On: its
channel word has no hand-over bit and its strings are byte-identical to the field absent. The inspector shows no Latch
row on a knob. **Over a set, the row shows only when every member carries Latch** - a set with a knob in it has no
Latch row, and a set of mixed kinds with a knob no Behavior (Latch was its one row) - because the row writes every
member, and showing it while skipping the knob would say more than it does. `setLatchTouch` refuses a knob alone or in
a set, as a blank; the knob's remembered fields lose `latchTouch`. Change 18's encoding measure moved with it (emit.spec
test 10, every element that carries Latch Off): the channel bit is still the cheapest on eight and sixteen elements
(25, 33) and no longer on page 3 (the keyed field 18 against 20) or page 3 with every option (the flag bit 14 against
19). The encoding stays; re-encoding is not change 18b's.

## Extra messages and a Note on a continuous output (2026-09-24, change 21A; `BENCH-2026-09-16.txt` section 21)

2026-09-24: an element's MIDI output became a list - its own outputs and up to three extra messages, Touch or Value -
and a continuous output's Type gained Note, played Pitch or Gate. `docs/MIDI.md` sections 9 and 10 are the manual; this
is the runtime's side.

### `W`, the Touch gate, and its two calls

    function W(s,r,x,y)[local c=0 for _,g in pairs(S)do if J[g]==r then c=c+1 end end if c==(x and 1 or 0)then ]
      [for _,g in pairs(r.m or{})do local w,v=g[1],g[3]if v>0 then
        [if x and v>127 then local a,b=A(r,x,y)v=(v>128 and b or a)*126//127+1 end ]
        s:gms(w%16,176+w//16*(x and 16 or 24),g[2],x and v or 0)end end ]
      [for j=1,r[5]==4 and 2 or 1 do local h=j>1 and r[15]or r[8]local t=h%128//16 if t>4 then
        if x then local u=r[18+j]or r[12]local k=t>5 and r[5+j]or u
          s:gms(h%16,144,k,t>5 and glim(u,1,127)or r[5+j])r[21+j]=k
        elseif r[21+j]then s:gms(h%16,128,r[21+j],0)r[21+j]=nil end end end ]
    [end ]end

Each bracket is a piece `touchPart` puts in only when a region needs it: the holders' count (a multitouch pad with a
Touch extra - on at the first finger, off at the last), the extras' loop (a Touch extra), the landing's axis (a Touch
note From X or Y, which also packs `A` and `V` on a surface of buttons and knobs), the own-notes loop (a continuous
Note). The status on is `176+16*code` (a note 144, a CC 176) and off `176+24*code` (a note-off 128, the CC 176 at 0).
The entry calls `W` after the branch on every landing - `I[r[5]](s,i,r,x,y,o)if o then W(s,r,x,y)end` - so an onset, a
9 and a hand-over's arrival all land it, the element's own messages first; `R` calls `W(s,r)` right after it forgot the
contact and before the kind's own release (`if not r then return end W(s,r)`; the multitouch `R` the same inside its
`if r then`), so every release path `R` covers - a lift, the sweep's expiry, the same id pressed again, another contact
landing on the region, a hand-over's departure - sends the off, and only once: `R` returns at once for a contact it has
already forgotten. The texts are `withTouchEntry` and `withTouchRelease` of the four entries and two releases; nothing
else in them moves.

### `D`, note-aware, and the Value extras

`sendPart` rebuilds `D` from `SEND`'s own pieces. Under a Note the word is read `h%128//16` (CC 0, pressure 2, pitch
bend 3 exactly as `h//16%4` read them - the receive and hand-over bits fall away under `%128` - and the Notes 5 and 6);
a Pitch value is quantised down onto its scale before the change test; the change then re-notes a SOUNDING Pitch when it
lands on another note (`(r[n+3]or v)~=v` - found by test 24's knob ribbon, whose first detent after a landing landed on
the note already sounding: `fce13fd`), and a Gate sends nothing on a move. The Value loop sends each extra whose column
is this call's beside the element's own send, inside the same `if s then` - so a receive's store (`D` with no element)
sends no extra either.

### Every existing surface byte-identical

`extrasOptionsOf` is undefined for a surface with no sent extra and no continuous Note, and then `runtimeParts` builds
exactly the texts it did: the emit.spec test 12 walks the gate's 46 earlier fixtures under two, three and five slots
with `extras: []`, a scale, a mode and a velocity present but inert - every string equal - and the gate's Sandbox set
kept all 874 of its records (304 added by sixteen new fixtures). The figures runtime.spec tests 7, 16, 22 and 23 pin, and emit.spec tests 1
to 11's, did not move.

### Proved in the VM (`runtime.spec.ts` test 24)

Page 3's pad with a Touch note (C3 at 100): the landing sends `176:21:63 176:22:63 144:48:100`, a move `176:21:127
176:22:127`, the lift `128:48:0`. From Y: `144:127`, `144:63`, `144:1` at the top, middle and bottom rows. The off
exactly once on a lift, the sweep (230 ticks), a 9, the same id pressed again (`144 128 144 128`), another finger
(`144 128 144 128`), a hand-over's departure onto an Off button (`144:48:100 128:48:0 176:95:127 176:95:0`) and its
arrival from it (`176:95:127 176:95:0 176:21:63 176:22:63 144:48:100 128:48:0`). A Touches-2 pad's note: on with the
first finger, nothing with the second or the first one's lift, off with the last; a lost last finger's sweep the off. A
Value CC 74 on channel 2 follows a fader exactly (`0,25,50,76,101,127` both). A Touch CC 64 under a button: `176:30:127
176:64:127 176:64:0 176:30:0`. Three extras on one pad in order. The same gestures on page 3 with and without the pad's
note send the same messages but the note's. A C major ribbon 60..72 slid up its six LEDs: `60 62 64 67 69 72`, each
off before the next on; a Gate fader on 60: `144:60:76` at row 2, nothing on a move, `144:60:1` at the bottom. Both modes
on every release path, never two notes at once from one fader; the notes' hand-over (`144:64:100 128:64:0 144:60:50
128:60:0 144:67:100 128:67:0`); a spring ribbon's return silent; a relative ribbon `60` then `62`; a pad's X ribbon on
minor pentatonic from 48 plays 58 for the chromatic 59; a knob ribbon's notes each different from the last.

### Costs

`docs/MIDI.md` section 10's table and budgets (emit.spec.ts test 12): `W` 146 to 585 by its pieces, `D` 174 -> 299 / 399
/ 524, `O` +24, `R` +6; page 3 receiving cannot take a Touch note on its pad, with every Receive off it can; the cap
floor with every option on 4 from empty (the meter's representative unmoved, 11 and 14).
