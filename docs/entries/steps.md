# STEPS - the history behind src/lib/catalog/entries/steps.ts

STEPS is the eight-by-eight step grid with a bright column sweeping across it, the plain
rectangular sequencer EUCLID and SONAR are not. Its source is
`src/lib/catalog/entries/steps.ts`. 11-07 corrected the corner its header quoted; 11-08 reversed
the onset-only guard so a swipe arms every cell (394 to 479 at the picker corner); 12-08 handed
the inlined guard to the library's `Q` and added `X(s,20)` (394 again); 12.1-03 added the white
finger (420). The entry's own header now carries the mechanism, the wire and the traps;
everything the header said before 13.2-02 - the decay-rate derivation, the aliasing key, the
probe readings, the corner correction and the coincidence of the two 394s - is below, verbatim.

## Moved from src/lib/catalog/entries/steps.ts on 2026-09-13 (13.2-02)

```text
STEPS - an eight by eight step grid with a bright column sweeping across it.

Tap a cell to arm it; a column sweeps left to right and plays what you armed
on the way past. Eight tracks, eight steps, a position you can read at a
glance. The archetypal grid sequencer, at the size the pad actually is.

THE MECHANISM. self.p is a flat table indexed 0..63, one boolean per cell,
with the column in the low three bits: index n is column n%8 and row n//8, and
the pad cell under it is n%8 + n//8*9. self.k is the column the sweep is on.
Every Timer period re-arms the Timer FIRST - matching the compiler's own
gtt-first bodies, because the handler runs inside a pcall and a re-arm placed
at the end dies permanently on the first raise - then advances the column,
releases the PREVIOUS column's armed rows, and paints and plays the new one.
Note-off before note-on in the same body, so a held note never overlaps
itself.

EIGHT BY EIGHT, AND THE NINTH COLUMN AND ROW ARE DARK BY DESIGN. Eight by
eight is what a step sequencer is: eight steps is a bar of eighths and eight
tracks is a drum kit. Inventing a ninth track to fill the pad would be
filling the pad rather than making an instrument, so the outer column and the
bottom row are left black and the touch handler returns for any cell in them.

THIS IS NOT EUCLID AND IT IS NOT SONAR. EUCLID is three concentric rings
beating against each other on a 48-tick cycle; SONAR is a radial sweep
through 16 angle buckets where the ring is the pitch. STEPS is the plain
rectangular grid both of those deliberately are not. Phase 8 dropped a
nine-step sequencer for overlapping EUCLID's slot and kept it as a follow-on
(08-06-SUMMARY.md:628-629); this is that follow-on.

THE LOOK, and why restsBlack is FALSE. Setup arms a default pattern - the
bottom row on every second step, which reads as four-on-the-floor - so the
card is lit and playing before anyone touches it. That is what makes it a
card rather than a black square, and it is what puts a real frame in
frames.json and in the OG image. Armed cells sit dim and static on layer 2 in
@ARMC; the sweeping column is layer 1 in @SWEEPC, handed
glpfs(a,1,252,256-252//@TRAIL,0) plus glt(a,1,@TRAIL) - the self-erasing
trail idiom, where the sixth argument of glc forces the layer's minimum stop
black so a phase running down to 0 is exact black, and firmware does the
whole fade in C with no erase pass and no per-cell bookkeeping.

THE DECAY RATE IS DERIVED FROM THE TRAIL LENGTH, AND THAT IS MEASURED RATHER
THAN STYLED. A fixed rate of 250 - the shipped idiom - is a phase step of 6 a
tick, which lands on black only at 42 ticks. At any other trail length the
timeout expires part-way down, firmware sets the rate to 0 and THE CELL
FREEZES HALF LIT: measured here at phase 183, 111 and 127 for trails of 12,
24 and 64, which on a swept grid is every cell glowing at roughly two fifths
forever. So the rate is 256 - 252//@TRAIL and the starting phase is 252, and
every trail value is a divisor of 252. The product is then exactly 252 at
every setting and the phase lands on exactly 0:

  12 ticks -> step 21    28 ticks -> step 9
  42 ticks -> step 6     63 ticks -> step 4

That is why the trail values are 12, 28, 42 and 63 rather than a rounder
looking 12, 24, 42, 64. Any new value must divide 252.

A SWIPE ARMS EVERY CELL IT CROSSES, AND THE ONSET-ONLY GUARD THIS HEADER
USED TO DEFEND IS DELIBERATELY REVERSED (plan 11-08). The trap list below
used to read "a move never toggles a cell" as a design statement. The bench
asked for the opposite - "STEPS: same as SONAR or EUCLID", against SONAR's
"not precise enough" and EUCLID's "you should be able to add by swiping your
finger" - so the decision is overturned rather than quietly replaced.
Measured through the real Lua host before the change: a 128-sample swipe
along row 4 armed exactly 1 cell, the one the finger landed on. It now arms
all eight that row 4 contains inside the 8x8 grid.

ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT. A MOVE
arrives every 10 ms, so a finger resting inside one cell would arm and disarm
it at 100 Hz - measured unguarded at 209 changes over 209 further samples.
The dedup remembers the cell the contact last touched and swallows a repeat,
and a contact end clears it so a fresh press on the same cell is not eaten.

THE DEDUP IS NO LONGER THIS ENTRY'S TO WRITE (plan 12-08). The behaviour above
is unchanged; the code is now `Q(s,i,e,x,y)` in src/lib/catalog/library.ts,
called as the callback's first statement, and the 146-character inlined guard
and its `self.q={}` table are gone.

THE KEY IS THE 9x9 PAD CELL c+r*9, NOT THE 8x8 PATTERN INDEX c+r*8, AND THAT
IS THE ONE PLACE THIS ENTRY DIFFERS FROM ITS THREE SIBLINGS. The pattern index
is only defined for c <= 7 and r <= 7; extended over the whole pad it ALIASES
- c=8,r=0 and c=0,r=1 are both 8 - so a finger that swiped down the dark ninth
column and then crossed into cell (0,1) would find its own stale key waiting
and lose the arm. c+r*9 is unique over all 81 cells, and it is the value glp
already needs.

THAT SURVIVES THE MOVE, AND IT IS WHY THE 8x8 GUARD RUNS AFTER THE CALL
RATHER THAN BEFORE IT. `Q` hit-tests the 9x9 pad and returns a 9x9 cell, so
the hysteresis is measured in PAD cells - which is the only frame in which it
is meaningful, because the boundary being defended is a physical line on the
glass. `c` and `r` are then recomputed from the returned cell as `a%9` and
`a//9`, the ninth column and bottom row still return early, and the pattern
index c+r*8 is derived last. Putting the 8x8 test in front of `Q` would
silently make the ninth column a hole in the contact tracking.

---------------------------------------------------------------------------
"SAME AS THE OTHER SEQUENCERS" WAS THE CELL BOUNDARY (plan 12-08)
---------------------------------------------------------------------------

THE BOUNDARY BETWEEN TWO CELLS IS ONE UNIT WIDE. `71*9//128 = 4` and
`72*9//128 = 5`, and PROBE-RESULTS-2026-09-10.md Q2 recorded a MOTIONLESS
finger sending 71, 72, 71, 71, 71 at 100 Hz - so a finger near an edge was
read as alternating taps on two cells and this entry armed and disarmed both.
The bench line here is "STEPS: same as the other sequencers", against EUCLID's
"still not precise", and that is the mechanism behind all of them.

THE FIX IS HYSTERESIS AND IT LIVES IN THE LIBRARY. `Q` holds a contact's cell
until the finger leaves it by 45/64 of the local LED pitch (since 12.1 the
band is a fraction of the pitch, not a width; 12.1-CONTEXT D-18) and returns
a cell only when it changed. The end test, the onset test and the dedup are
all inside it; re-testing `e` here would be doing the library's job twice.
The callback opens `local a=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not a
then return end` - `Q` first, then `G`, then the 8x8 guard.

THE FINGER IS DRAWN WHERE IT IS, IN WHITE, ON LAYER 0 (plan 12.1-03;
12.1-CONTEXT D-11, D-13). `G` is the library's bilinear finger: dead on an
LED that LED alone at peak, between two both dimly, in the middle of four
all four - and since 12.1 the cell `Q` returns is the LED under the finger,
because `Q` and `G` both read the MEASURED sensor map (calibration.ts)
through `U`, so the arm and the light agree by construction; the bench case
(row 1, column 7 zero-based - the user's "row 2 column 8") arms cell 16
where the naive divisor lit the corner. White is a literal, not a knob
(D-13). No init-loop colouring: `G` re-asserts the colour on each of its
four cells on EVERY call, because layer 0 is the firmware's ALERT layer
(grid_led.h:7) and grid_alert_all_set rewrites its colour on every LED on a
CONFIG write, on page-discard completion, on a refused page change, on a TX
overflow and at boot - a finger coloured once at init would stay grey,
purple or blue until the Setup re-ran; this one is wrong for one sample and
heals on the next. There is no floor: `glc(...,1)` forces the layer's
minimum to 0, so the ninth column and the bottom row are exactly as dark as
before under no finger. `Q` BEFORE `G` IS A FINDING (12.1-02): `Q`'s onset
self-expiry reaches `E`, which clears the block in `B[i]` through `V` -
written after `G` that is the block `G` just drew, and a still finger reads
dark until its first MOVE. +26 on the Setup, 394 -> 420 at the picker
corner; lua-smoke.spec.ts presses all 81 LED centres and asserts each
lights its own cell alone. Whether the sweeping column still reads as one
bar under the gradient is audition row 25's question.

PHASE 11 READ THIS COMPLAINT AS FAST-TAP LOSS, AND THAT READING WAS CORRECT
FOR THE FIRMWARE AND WAS NOT THE COMPLAINT. Code 9 is a real coalesced
press-and-lift in the firmware source and 11-08's `e<9 and a` store was a real
fix for it - measured on the bare shape, three fast taps read
0 -> 255 -> 255 -> 255. But Q3 tapped ten times as fast as a hand can and NOT
ONE arrived as a 9. The fix stays (it is `H[i]=e<9 and n` inside `Q` now), it
is harmless, and it was never what the user was reporting.

AND A LOST LIFT IS REACHED BY `X`, NOT BY `Q` (Q6.5, Q7). `Q`'s expiry rules
need A PRESS - a re-press by the same id, or another contact landing on the
held cell. Q6.5 recorded four of five contacts never sending their code 5
after a five-finger chord; a contact that goes quiet and is never pressed
again holds its cell for the rest of the session and every future press by
that id is measured against it. Only the Timer-side sweep reaches it, so the
Timer below calls `X(s,20)`. TWENTY CALLS IS AN INTERVAL, NOT A DURATION - at
@TEMPO's default of 120 ms it is 2.4 s, and across the knob it runs 1.2 s
(60 ms) to 4.0 s (200 ms). It is a starting value the bench row in plan 12-12
may move, and it is safe to ship unbenched because this entry holds no note
per contact: an early expiry forgets a stale cell, it does not cut a note.

WHAT THIS ENTRY DOES NOT TAKE FROM THE LIBRARY. NOT `R` - the release
convention is for entries that hold a note per contact or paint layer 0
outside `G`, and this one does neither; `E` calls `R` only if the entry
defined one. NOT `F` - a "light the finger's cell" helper DOES NOT EXIST: it
shipped in the planner's sketch with no caller and 12-07 dropped it. Its job
is `G`'s since 12.1-03: until then a cell toggling under the finger was the
only feedback, and the bench said it was not enough.

WHAT THE REVERSAL COSTS: a swipe that crosses a cell twice toggles it twice,
so dragging back over your own stroke erases it. That is correct for a toggle
and it is not what a paint gesture does; the set-rather-than-toggle
alternative is named as an open bench question in euclid.ts.

CLOCK SYNC IS NOT BUILT. STEPS carries the request only by reference - the
bench note is "same as SONAR or EUCLID" - so the two blockers are stated ONCE
each, in sonar.ts's and euclid.ts's headers, and CITED here. Three statements
of one fact drift.

THE TRAPS THIS ENTRY CONTAINS.

  - F2Ieq on every coordinate division. The cell arithmetic is the
    library's since 12-08 (`Q`, `U`, `W`, `G` all floor with `//`), and the
    two divisions left here, `a%9` and `a//9`, are integer on an integer; a
    fractional argument to a firmware call becomes 0, silently.
  - THE NOTE RANGE IS EIGHT WIDE. Row r plays @NOTE + r, so @NOTE + 7 must
    stay under 128 for every value of the knob. The largest is 60, and
    60 + 7 = 67. The arithmetic is stated here so a future value is checked
    against it rather than guessed.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
    every @ARMC and @SWEEPC value is inside 0..255 by construction.
  - EVENT CODES. This entry no longer reads one. `Q` carries the LIVE
    spelling of the class-B convention and the onset test, and `e` is passed
    straight through to it; e == 5 appears nowhere here and nowhere in the
    library, because a handler that tested for it would leak on a fast tap,
    which arrives as code 9 with no separate lift.
    src/lib/catalog/touch-guard.spec.ts holds the convention and knows this
    body delegates - see its non-vacuity arm.
  - glp IS NEVER CALLED WITH A NEGATIVE PHASE. glp(n,l,-1) does nothing on
    ZONA; every phase here is an explicit 0 or 255.
  - NO KEEPER IS WRITTEN ON LAYER 1 AT ALL, and that is deliberate. The
    column is a decay, and glt(a,1,65535) on a decaying layer is pitfall 1
    exactly: the countdown is replaced, the fast rate keeps decrementing past
    zero and wraps, and every swept cell strobes forever. The trail knob's
    longest value is 63 ticks.

THE HONEST LIMIT, for the card copy. Eight rows is eight voices, and the pad
has no way to show you what the host is playing: there is no inbound MIDI in
this phase (D-04), so the column tells you where the sequencer is, not where
your DAW is.

ROUTE: kind "lua", not kind "state". There is no sequencer anywhere in the
PadState vocabulary - sends.kind is none | xy | zones | faders | trackpad |
dial and not one of them has a clock.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 414 characters, Timer 258, both fixed
points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
GATE READS IS 420 / 260, leaving 488 free of 908 on the Setup and 648 on the
Timer, and the all-shortest corner a picker can reach is 407 / 257. Plan
12.1-03 moved the three Setup figures by +26 for the `G` call (388 / 394 /
381 before it), re-measured in this tree under the pinned compressScript,
and the Timer not at all. Plan 12-08 had moved all six before that: -85 on
the Setup where the inlined guard left for the library, +7 on the Timer
where `X(s,20)` arrived.

THAT CORNER IS NOT THE ONE THIS HEADER USED TO QUOTE, and the correction is
plan 11-07's finding applied here. It read "391 / 253, leaving 517 free" -
the all-longest corner of the DECLARED PALETTES. Since plan 10-08 the sweep
writes any colour an RGB444 picker can (D-06), and @ARMC's longest declared
literal is the eight-character "30,30,30" against the picker's eleven, so the
binding corner was 394, not 391, and the entry had 514 free before that plan
rather than 517. Fifteen other hand-authored entries are still unchecked for
the same error; that is 11-16's row (f).

THE 394 IN THAT PARAGRAPH AND THE 394 IN THE ONE ABOVE WERE A COINCIDENCE,
and it is called out because two identical numbers eleven lines apart look
like a copy. 11-07 measured 394 BEFORE 11-08 added the inlined swipe guard,
which took the corner to 479; 12-08 handed that guard to the library and it
came back to 394, so for two plans the entry cost what it had cost before,
having gained a per-contact dedup, hysteresis and an expiry sweep in
between; 12.1-03's `G` call took it to 420.
src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.

TWO SPACES WERE MEASURED OUT OF THE SETUP, not designed out. The readable
form writes "self.p[n] and 255 or 0"; the pinned minifier emits
"self.p[n]and 255 or 0" with no space, and both sites are stored that way.
Storing the readable form would fail the canonical-form gate on its first run
for a reason that has nothing to do with the configuration - the same finding
SONAR's header records for "if s.v[n]then".

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```

## Change 12, 2026-09-18 - the column on the DAW's clock (BENCH-2026-09-16.txt section 12)

The user's word: "MIDI sync works perfectly. implement it to Ghost, Radar points, Radar and
Steps." - ORBIT's clock idiom (change 8, bench-verified on hardware this day; the idiom, the
firmware evidence and the spelling are in `docs/entries/orbit.md`, "The clock idiom") on STEPS.
TUNE-01's six is lifted for a sync card by change 8's answer 2; STEPS carries eight knobs.

### The header and the two strings the entry carried until change 12, verbatim

```text
// STEPS - an eight by eight step grid with a bright column sweeping across it.
//
// Tap or swipe to arm cells; a column sweeps left to right and plays what you armed on the way
// past. Eight tracks, eight steps; the ninth column and the bottom row are dark by design (eight
// steps is a bar of eighths and eight tracks is a drum kit). The plain rectangular grid EUCLID
// and SONAR deliberately are not. Setup arms a default pattern - the bottom row on every second
// step - so the card plays before anyone touches it. Knobs: @TEMPO (both events), @ARMC,
// @SWEEPC, @TRAIL (a divisor of 252), @NOTE, @CH. Setup 420 of 908 at the picker corner (414
// at the defaults), Timer 260 (258); restsBlack false. Kind "lua": no sends.kind has a clock.
// Clock sync is not built; the two blockers are stated once, in sonar.ts and euclid.ts.
// History: docs/entries/steps.md (11-07, 11-08, 12-08, 12.1-03 measurements and the corner ladder).
```

```lua
--[[@cb]]self.p={}self.k=0 for n=0,63 do self.p[n]=n>55 and n%2==0 local a=glag(0,n%8+n//8*9)glc(a,1,@SWEEPC,1)glp(a,1,0)glc(a,2,@ARMC,1)glp(a,2,self.p[n]and 255 or 0)end self.touch_cb=function(s,i,e,x,y)local a=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not a then return end local c=a%9 local r=a//9 if c>7 or r>7 then return end local n=c+r*8 s.p[n]=not s.p[n]glp(glag(0,a),2,s.p[n]and 255 or 0)end gtt(0,@TEMPO)
```

```lua
--[[@cb]]gtt(0,@TEMPO)local s=self X(s,20)local k=s.k%8 s.k=k+1 local q=(k+7)%8 for r=0,7 do if s.p[q+r*8]then s:gms(@CH,128,@NOTE+r,0,0)end end for r=0,7 do local a=glag(0,k+r*9)glpfs(a,1,252,256-252//@TRAIL,0)glt(a,1,@TRAIL)if s.p[k+r*8]then s:gms(@CH,144,@NOTE+r,100,0)end end
```

Knobs then: `@TEMPO` Step time `200 150 120 90 60` ms (default 120), `@ARMC`, `@SWEEPC`,
`@TRAIL` `12 28 42 63`, `@NOTE` `36 48 60 24`, `@CH` `0 1 9 15` (default 9).

### What moved

- **The step is the column advance**, and it is now the Timer's `local function f(s)`: the
  release of the sounding column, k = s.k%8, the advance, column k's decay pair and the armed
  rows' note-ons - the whole body after `X(s,20)`. The column's decay pair is the step's own
  picture (it names column k), so it moved WITH the step rather than staying on the Timer: kept
  on the Timer under External it would re-arm the held column every @BPM period and paint a
  column the clock had not reached. The Timer under External does `gtt`, `X(s,20)`, publishes,
  and returns. A deviation from the brief's sentence ("keeps X(s,20) and the decay painting"),
  stated.
- **The release is its own routine `u(s)`** - note-off for the SOUNDING column's armed rows,
  `(s.k+7)%8` - because Start and Stop need it without a step: `f` calls it first, the
  callback reads it as `s.u` on 250 (before the reset, so the column that was sounding is the
  one released) and on 252. Published beside `s.f` on every Timer call. Named `u`, not `o`: on
  RADAR POINTS `s.o` is the pitch table, and one spelling across the three cards was worth the
  letter.
- **The callback**, ORBIT's spelling with the two release lines:
  `self.rtmrx_cb=function(s,h,b)if b==250 then local u=s.u if u then u(s)end s.k=0 s.q=0 end if
b==250 or b==251 then s.r=1 elseif b==252 then s.r=nil local u=s.u if u then u(s)end elseif
b==248 and s.r then local f=s.f if s.q%@DIV==0 and f then f(s)end s.q=s.q+1 end end` then
  `grxm(2,@SYNC and 3 or 0)`. `self.q=0` beside `self.k=0` so a Continue before any Start
  counts from zero instead of raising on a nil.
- **The Tempo rail reads BPM, ascending** (ORBIT's 8b shape): `@TEMPO` is `@BPM`, both events
  `gtt(0,15000//@BPM)` - a 16th a column - and the ladder `75 100 125 166 250` is today's five
  periods exactly (200 150 120 90 60 ms), 125 the 120 ms default, so the rest frame did not move.
  A 16th and not an eighth (`30000//@BPM`): the old knob comment already called 120 ms "125 bpm",
  which is a 16th at 125; the eighth reading would put the default at 250 BPM and today's rail
  at 150..500, numbers no DAW shows; and it matches ORBIT's default so a DAW at 125 BPM with
  Division 16th plays STEPS at exactly its Internal default. The header's "a bar of eighths" is
  now "two beats of 16ths". The id stays `tempo`; the label reads "Tempo (BPM)".
- **Sync** `false / true` (Internal / External, `previewIndex: 0`) and **Division** `12 / 6 / 3`
  (8th / 16th / 32nd, 16th the default), between Trail and Lowest note in the rack.
- The header sentence "Clock sync is not built; the two blockers are stated once, in sonar.ts
  and euclid.ts" goes.

### The costs, under the pinned `compressScript` after `initLuaFormatter()`

At the RGB444 picker corner: **Setup 420 -> 727** (488 -> 181 free), **Timer 260 -> 361** (648 ->
547 free); 720 / 359 at the defaults. Every knob state a fixed point passing `checkSyntax`
(`lua-entries.sweep.spec.ts`, 1,804 -> more combinations). No system slot.

### What the default record shares with yesterday's

At the defaults the Setup is yesterday's with `self.q=0 ` after `self.k=0 `, the callback and
`grxm(2,0)` before the `gtt`, and `gtt(0,15000//125)` for `gtt(0,120)`; the Timer is yesterday's
body wrapped in `u` and `f`, published, and called at the end through `if false then return end
f(s)`. `15000//125` is 120, `grxm` is a recorded no-op in the host and the routing byte on the
module, and `f(s)` at the end runs the same statements in the same order - so `frames.json` and
the OG image are byte-identical, and frames.spec.ts held without a regeneration.

### The VM cases (`lua-smoke.spec.ts`)

Internal: eight columns in 97 ticks are on / off / on / off / on / off / on / off of `@NOTE+7`
on channel 9 (the default pattern), k at 8. External: the Timer sends nothing and moves no
column over three periods; twelve clocks before Start do nothing; Start zeroes the count and the
first clock lands column 0, the seventh column 1 (its release of column 0 on the wire); 200
Timer ticks move nothing; Stop after column 2 releases its row; clocks and 254 after it do
nothing; Continue keeps the count at 13 and the sixth clock lands column 3; Start releases,
resets and the clock lands column 0. Division 12 and 3: a clock before the Timer's first call
is counted, not stepped; then columns at clocks 13 and 25, and 4 and 7. Sync worded Internal /
External, Division 8th / 16th / 32nd, the preview holding Internal. The five existing STEPS
cases (the swipe, the boundary finger, the 81 LED centres, the parity tap, the residue) are
untouched and green.

### The stamp

`stamp.spec.ts`: STEPS joins the grown - its captured six-knob `x` payload is the wrong length
for eight knobs and lands `unreadable` by design; the captured default vector still carries no
stamp (the two new indices read their defaults). Every STEPS link shared before today opens the
card at its defaults.
