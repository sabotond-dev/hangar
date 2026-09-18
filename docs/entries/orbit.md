# ORBIT (EUCLID until change 8) - the history behind src/lib/catalog/entries/orbit.ts

ORBIT is the four concentric Euclidean rings beating against each other on a 96-step cycle, on
their own Timer or on the DAW's MIDI clock - EUCLID until change 8 (2026-09-18, BENCH-2026-09-16.txt
section 8; the change is the last section of this file), the first configuration authored for
HANGAR rather than ported. Its source is `src/lib/catalog/entries/orbit.ts` (`euclid.ts` until
change 8, moved with `git mv`). 08-06 authored it; 11-02 moved the trail's decay pair to
the house idiom and the trail values to divisors of 252; 11-08 reversed the onset-only guard so
a swipe toggles every ring cell it crosses; 12-08 handed the inlined guard to the library's `Q`
and added `X(s,20)` (700 / 237 at the picker corner); 12.1-03 added the white finger and, through
the calibrated cell, fixed the outer ring (726); change 8 renamed it, added the fourth ring, a colour
and a note per ring and the clock sync (846 / 404). The entry's own header now carries the
mechanism, the wire and the traps; everything the header said before 13.2-02 - the measurements,
the probe readings, the MIDI sync gates and the frames.json residue - is below, verbatim, under
the name it had; change 8's section closes the file.

## Moved from src/lib/catalog/entries/euclid.ts on 2026-09-13 (13.2-02)

```text
EUCLID - three Euclidean rings, one polyrhythm. The first configuration
authored for HANGAR rather than ported from BOTOR's shelf.

Concentric square rings on a 9x9 hold exactly 8, 16 and 24 cells, so three
tracks of 8, 16 and 24 steps sit on the pad with no rounding at all. Each
ring's pattern comes from the Bresenham Euclidean test
(t*k//n ~= (t-1)*k//n) at three, five and seven pulses. Layer 1 holds the
static pulse markers - 15 of them lit from Setup, which is why restsBlack is
false - and layer 2 carries a bright head running each ring at its own speed
with a short decay behind it. The three ring lengths beat against each other
on a 48-tick cycle. Tapping a cell toggles that step - and so does dragging
across it, which is a REVERSAL and is recorded as one below.

A SWIPE ARMS EVERY RING CELL IT CROSSES, AND THE ONSET-ONLY GUARD THAT USED
TO FORBID THAT IS DELIBERATELY REVERSED (plan 11-08). The callback opened
with "e~=4 and e~=9 then return", so every MOVE was thrown away at the first
line and a finger drawn across the pad changed the cell it landed on and
nothing else. Measured through the real Lua host: a 128-sample swipe along
row 4 changed 0 cells, because the cell that swipe lands on is not on a ring
at all. That is the bench note "doesn't sense the finger its really difficult
to add or remove, and you should be able to add by swiping your finger".

ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT, and that is
what the guard is for. A MOVE arrives every 10 ms, so a finger resting inside
one cell would toggle that step back and forth at 100 Hz - measured
unguarded at 209 changes over 209 further samples. The dedup remembers the
CELL the contact last touched and swallows a repeat, and a contact end clears
it so a fresh press on the same cell is not eaten.

THE DEDUP IS NO LONGER THIS ENTRY'S TO WRITE (plan 12-08). Everything in the
paragraph above is still exactly what happens; the code that does it is now
`Q(s,i,e,x,y)` in src/lib/catalog/library.ts, called as the first statement
of the callback, and both the 126-character inlined guard and the `self.q={}`
table it needed are gone. See the 12-08 paragraph below for the reason the
move was worth making, which is not the 90 characters it saves.

THE KEY IS THE PAD CELL, NOT THE RING POSITION, and it is remembered BEFORE
the self.i[m] lookup rather than after. Both halves matter and both survive
the move to the library. self.i maps a pad cell to d*32+t and is nil for the
centre and the outermost square, so a ring position is not a unique name for
a place on the pad; and `Q` remembers the CELL, unconditionally, before this
callback has looked at self.i at all - so a finger that wanders off the ring
and comes back onto the SAME ring cell arms it again, because it genuinely
crossed it twice.

WHAT THE REVERSAL COSTS, said plainly: a swipe that crosses a cell twice
toggles it twice. That is correct for a toggle and it is NOT what a paint
gesture does - dragging back over your own stroke erases it. A swipe that
SET rather than toggled would paint, and it is a different behaviour from the
one the bench asked for, so it is named here as the open question rather than
shipped as an interpretation. It is also cheaper: CONSOLE measured the
set-rather-than-toggle shape at 37 characters less than the dedup in 11-07.

---------------------------------------------------------------------------
"STILL NOT PRECISE" WAS THE CELL BOUNDARY, AND THE LIBRARY IS THE ANSWER
(plan 12-08, and the probe that decided it)
---------------------------------------------------------------------------

THE BOUNDARY BETWEEN TWO CELLS IS ONE UNIT WIDE, and a still finger wobbles
one unit on every 10 ms sample. `71*9//128 = 4` and `72*9//128 = 5`, and
PROBE-RESULTS-2026-09-10.md Q2 recorded a motionless finger sending
71, 72, 71, 71, 71 - so a finger anywhere near an edge was read as alternating
taps on TWO cells, and this entry's dedup dutifully toggled both. That is the
bench line "EUCLID: still not precise", and it is a measurement rather than
an interpretation.

THE FIX IS HYSTERESIS AND IT LIVES IN THE LIBRARY. `Q` holds the cell a
contact is on until the finger leaves it by 45/64 of the local LED pitch
(since 12.1 the band is a fraction of the pitch, not a width - eight raw
values between LED 4 and 5, three on the outer segment; 12.1-CONTEXT D-18)
and returns a cell ONLY when it changed. The callback's whole guard is now
`local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end`:
the end test, the onset test and the dedup are all inside `Q`, `G` draws
the finger (the paragraph below), and re-testing `e` here would be doing the
library's job twice.

---------------------------------------------------------------------------
THE FINGER IS DRAWN WHERE IT IS, AND THE CELL IT TOGGLES IS THE LED UNDER IT
(plan 12.1-03; 12.1-CONTEXT D-11, D-13)
---------------------------------------------------------------------------

`G(s,i,e,x,y,0,255,255,255)` on the line after `Q`: the library's bilinear
finger, on LAYER 0, in WHITE - a literal, not a knob (D-13; a knob would
move the stamp's shape character). Dead on an LED that LED lights alone at
peak; between two both glow, dimly, the pair summing to about the peak; in
the middle of four all four. Nothing here colours layer 0 in the init loop:
`G` sets the colour on each of its four cells on EVERY call, which is what
makes the tint self-healing - layer 0 is the firmware's ALERT layer
(grid_led.h:7), and grid_alert_all_set rewrites its colour on every LED on
a CONFIG write, on page-discard completion, on a refused page change, on a
TX overflow and at boot. A finger coloured once at init would turn grey,
purple or blue after any of those until the Setup re-ran; this one is wrong
for exactly one sample and white again on the next. There is no floor to
lose either: `glc(...,1)` forces the layer's minimum to 0, so a cell the
library clears is dark, and the dark pad is as dark as it ever was.

`Q` FIRST, THEN `G`, AND THE ORDER IS A FINDING, NOT A STYLE (12.1-02). On
an onset `Q` expires the contact itself, which reaches `E` and clears the
block recorded in `B[i]` through `V`; with `G` written first that block is
the one `G` had just drawn, and a still finger reads dark after its DOWN
until its first MOVE. `Q` first clears the STALE block and `G` then draws
the fresh one. Same characters either way; only one order is right.

AND THE CELL `Q` RETURNS IS NOW THE LED UNDER THE FINGER. `Q` reads the
measured sensor map (calibration.ts, Probe C on the user's ZONA) through
`U`, and so does `G`, so the toggle and the light agree by construction.
THAT IS WHAT FIXED THE OUTER RING. Under the naive `x*9//128` the outer
Euclid ring - index 1 and 7, Chebyshev distance 3 - sat a third of a cell
inward of where its LEDs are: a finger dead on LED (1,4) read as raw 13,
which `13*9//128` calls column 0, and column 0 is on no ring at all, so
`if not v then return end` dropped the press silently. That is the bench
line "i need to tap multiple times" (12.1-RESEARCH E): the taps that worked
were the ones that happened to land inboard. lua-smoke.spec.ts presses every
one of the 81 LED centres and asserts each lights its own cell alone, and
that a press on LED (1,4) flips a step on the first try.

THIS COSTS +26 ON THE SETUP (700 -> 726 at the picker corner) and nothing
on the Timer; the map itself cost this entry nothing, because `Q` reads it
from the library.

PHASE 11 READ THE SAME COMPLAINT AS FAST-TAP LOSS, AND THAT READING WAS
CORRECT FOR THE FIRMWARE AND WAS NOT THE COMPLAINT. Code 9 is a real
coalesced press-and-lift in the firmware source and 11-08's `e<9 and m` store
was a real fix for it - measured on the bare shape, three fast taps read
0 -> 255 -> 255 -> 255. But Q3 tapped ten times as fast as a hand can and NOT
ONE arrived as a 9, so nothing a human does reaches that path. The fix stays
(it is inside `Q` now, as `H[i]=e<9 and n`), it is harmless, and it was never
what the user was reporting.

AND A LOST LIFT IS REACHED BY `X`, NOT BY `Q` (Q6.5, Q7). `Q`'s own expiry
rules need A PRESS: a re-press by the same id, or another contact landing on
the held cell. Q6.5 recorded four of five contacts never sending their code 5
after a five-finger chord, and Q7 a palm leaving phantoms - a contact that
goes quiet and is NEVER PRESSED AGAIN holds its cell in the library's `H`
for the rest of the session, and every future press by that id is measured
against it. The only thing that reaches it is the Timer-side sweep, so the
Timer below calls `X(s,20)`: seven characters into a string with six hundred
free. TWENTY CALLS IS AN INTERVAL, NOT A DURATION - at @TEMPO's default of
110 ms it is 2.2 s, and across the knob it runs 1.4 s (70 ms) to 4.8 s
(240 ms). It is a starting value; the bench row in plan 12-12 is what moves
it, and it is safe to ship unbenched here because this entry holds no note
per contact - an early expiry forgets a stale cell, it does not cut a note.

WHAT THIS ENTRY DOES NOT TAKE FROM THE LIBRARY, so the next reader does not
add it. NOT `R`: the release convention exists for entries that hold a note
per contact or paint something on layer 0 that a block clear could take
away, and this one does neither - `E` calls `R` only if the entry defined
one, and an expiry here has nothing to release or re-light. NOT `F`: a
"light the finger's cell" helper was in the planner's sketch and DOES NOT
EXIST - it shipped with no caller and 12-07 dropped it. Its job is `G`'s
since 12.1-03 (above): until then an armed cell toggling under the finger
was the only feedback, and the bench said it was not enough.

MIDI SYNC IS NOT BUILT, AND IT IS NAMED HERE RATHER THAN DROPPED. The bench
asked to "MIDI sync the circles"; two gates are shut and the second does not
open when the first does. FIRST, the hardware answer is unknown:
docs/MIDI-IN-PROBE.md is a written, minifier-checked pair of probe scripts
for exactly this question whose Results section reads "None yet. This probe
has not been run", and since gts is dead on ZONA and rtmrx_cb is the only
clock route the hardware has, a NO on that probe CLOSES this family rather
than redirecting it. SECOND, even a yes leaves the card UNPREVIEWABLE:
HANGAR's Lua host has no inbound MIDI path of any kind - grxm is a recorded
no-op that discards its slot argument, and neither midirx_cb nor rtmrx_cb
is ASSIGNED or BOUND anywhere under src/, in a host binding or in a catalog
entry's Lua, which is the grep that proves nothing here was stubbed - so a
clock-locked EUCLID would run on a real ZONA and sit motionless in its own
catalog card. The prerequisite is a synthetic MIDI source and a synthetic
clock in src/lib/sim/, which is a phase and not a task. Nothing here is
stubbed, flagged or reserved against an answer nobody has: a knob held back
"for later" is a stamp slot, and a stamp slot spent on a feature that may
never exist is a link format nobody can take back.

THE TRAIL'S DECAY PAIR IS THE HOUSE IDIOM, AND @TRAIL'S VALUES ARE PART OF
IT (plan 11-02). The Timer shipped glpfs(a,2,255,250,0) with glt(a,2,@TRAIL),
and that pair can NEVER land on phase 0 at any value: glpfs walks the phase
with `pha += fre` on a uint8_t, 255 is odd, the step 256 - 250 = 6 is even,
so 255 - 6T is odd at every T. Re-choosing @TRAIL could not have fixed it -
the STARTING PHASE had to move. Every ring cell the head passed over froze
part-way down and stayed permanently, faintly lit.

It now writes glpfs(a,2,252,256-252//@TRAIL,0), which is the parameterised
house idiom steps.ts and cull.ts already ship: start at 252, step 252//T, land
on 252 - T*(252//T) = 0 whenever T is an EXACT DIVISOR of 252. Cost: +8
characters on the Timer at the defaults, +9 at the all-longest corner.

@TRAIL'S VALUES MOVED WITH IT, AND A SHARED LINK IS THE PRICE. 64, 100 and
150 do not divide 252, so they became 63, 84 and 126 - the nearest legal
value to each, same arity, still ascending, 21 and 42 already legal and
untouched. A stamp encodes the knob's INDEX, not its value, so every link
anybody has ever shared still decodes and still restores; a link carrying
index 3 now renders an 840 ms trail where it used to render a 1000 ms one.
stamp.spec.ts compares indices and stays green either way, so no test says
this out loud and this comment does.

AND THE RESIDUE WAS NOT INVISIBLE HERE, contrary to what 11-02 predicted.
frames.json, which records an UNTOUCHED run, went 111 -> 51 lit bytes at tick
500 and 111 -> 45 at tick 1009. Half the pad was permanent glow the Timer put
there itself.

src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
list of usable timeouts, and it is CITED here rather than restated.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 722 characters, Timer 233, both fixed
points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
GATE READS IS 726 / 237, leaving 182 free on the Setup and 671 on the Timer
(plan 12.1-03: +26 on the Setup for the `G` call, re-measured in this tree
under the pinned compressScript; 12-08 had it at 700 / 237),
and it is the RGB444 PICKER corner
(D-06), not the all-longest corner of the declared palettes - since plan
10-08 the sweep writes any colour a picker can, and for this entry the two
corners happen to coincide because @RINGC already declares 255,255,255. Plan
11-07 found the two diverging by 21 characters on CONSOLE, so the corner is
named here rather than left to be inferred. That is what makes
the budget meter honest, because cost() charges max(compressed, raw) and a
readable, indented version of this configuration would be charged its raw
length. src/lib/catalog/lua-entries.sweep.spec.ts asserts all of it, at the
defaults and across the whole knob cross-product.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them: a trailing comment was measured surviving
verbatim into the budget. Everything worth saying about this configuration is
said here, in TypeScript, where it costs nothing.
```

## Change 8, 2026-09-18 - EUCLID becomes ORBIT (BENCH-2026-09-16.txt section 8)

The user's word, verbatim in section 8: "Euclid: rename it to smth crfeative. Add one more ring
the farest one from the center. Tempo slider is in the wrong direction the bigger tempo should
be on right side. each ring should have their own color. It should be able to get sync from a
software or daw, its in the Editor, implement that for the sequencer profiles. its under function
called MIDI rtm callback handler. Remove base not and you should be able to select a note for
each ring from C -2 to G 8 so full range." - with the six answers of the same day (Orbit; the
six-knob rule lifted for this card; Sync plus a Division knob; 36 38 42 46; names and numbers
both; the sync built on ORBIT alone and saved as a sequencer piece). The file moved with the
entry (`git mv`): `euclid.ts` is `orbit.ts`, `euclid.md` is this file, and `/playground/euclid/`
is the fourteenth dead address (`local.spec.ts`'s `REMOVED`, beside the nine of 11-01, the three
of 12-04 and `tpad` of 12-10).

### The header and the two strings the entry carried until change 8, verbatim

```text
// EUCLID - three Euclidean rings, one polyrhythm. The first configuration authored for HANGAR
// rather than ported from BOTOR's shelf.
//
// Concentric square rings on a 9x9 hold exactly 8, 16 and 24 cells, so three tracks of 8, 16
// and 24 steps sit on the pad with no rounding. Each ring's pattern is the Bresenham Euclidean
// test at three, five and seven pulses; layer 1 holds the static pulse markers (15 lit from
// Setup), layer 2 a bright head running each ring at its own speed with a short decay; the three
// lengths beat on a 48-tick cycle. Tap or swipe a ring cell to toggle that step. Knobs: @TEMPO
// (both events), @PULSES, @RINGC, @TRAIL (a divisor of 252), @NOTE, @CH. Setup 726 of 908 at the
// picker corner (722 at the defaults), Timer 237 (233); restsBlack false. MIDI sync: not built.
// History: docs/entries/euclid.md (08-06, 11-02, 11-08, 12-08, 12.1-03 measurements, readings).
```

```lua
--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,@RINGC,1)glp(a,2,0)end self.c={}self.p={}self.i={}local h={@PULSES}for d=1,3 do local n=d*8 local u={}local v={}for t=0,n-1 do local q=t//(d*2)local w=t%(d*2)local a,b if q==0 then a,b=d,w-d elseif q==1 then a,b=d-w,d elseif q==2 then a,b=-d,d-w else a,b=w-d,-d end local m=a+4+(b+4)*9 u[t]=m self.i[m]=d*32+t v[t]=t*h[d]//n~=(t-1)*h[d]//n if v[t]then glp(glag(0,m),1,255)end end self.c[d]=u self.p[d]=v end self.touch_cb=function(s,i,e,x,y)local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end local v=s.i[m]if not v then return end local d=v//32 local t=v%32 s.p[d][t]=not s.p[d][t]glp(glag(0,s.c[d][t]),1,s.p[d][t]and 255 or 0)end gtt(0,@TEMPO)
```

```lua
--[[@cb]]gtt(0,@TEMPO)local s=self X(s,20)local k=(s.k or 0)%24 s.k=k+1 for d=1,3 do local t=k%(d*8)local a=glag(0,s.c[d][t])glpfs(a,2,252,256-252//@TRAIL,0)glt(a,2,@TRAIL)s:gms(@CH,128,@NOTE+d*2,0,0)if s.p[d][t]then s:gms(@CH,144,@NOTE+d*2,100,0)end end
```

Knobs then: `@TEMPO` `240 180 140 110 90 70` (default 110), `@PULSES` `3,5,7 2,3,5 5,9,13 3,8,11
4,8,16 7,11,17`, `@RINGC` the five-colour palette, `@TRAIL` `21 42 63 84 126`, `@NOTE` `24 30 34
36 40 48 60` (default 34: the three voices 36 38 40), `@CH` 0..15.

### What ORBIT is

The fourth ring is the outermost square - Chebyshev distance 4, 32 cells - so the four rings hold
8, 16, 24 and 32 steps and beat on a 96-step cycle (`s.k=(k+1)%96`); only the centre cell carries
no step. The ring walk is one rotation instead of four cases: step t starts at `(d, t%(d*2)-d)`
and is turned a quarter `t//(d*2)` times (`a,b=-b,a`), the same cell order as before for every
ring, 50 characters cheaper. Every ring has its own colour (`@R1C`..`@R4C`, one palette) and its
own note (`@N1`..`@N4`, 0..127 typed); `@RINGC` and `@NOTE` are retired. The Tempo list is
reversed so the bigger number sits on the right, 110 ms still the default. And the rings can
follow the DAW: `Sync` Internal / External and `Division` 8th / 16th / 32nd.

### The clock idiom - the reusable sequencer piece (answer 6)

Saved here as an idiom, not a library function: `library.ts` is untouched by this change and,
measured, a library function would save nothing that pays for itself - the shape is one
callback and one field read, both entry-specific in their step routine, and the library's 255/0
has 66 free and 255/6 has 35, neither of which holds a callback this size. STEPS, RADAR POINTS
and SONAR can take it later on the user's word; none of the three is touched here.

The firmware facts, read in the sources on this machine:

- `grid-fw/common/src/lua/decode.lua:42-44` is the dispatcher: `pass_rtm = function(el, x) if
el.rtmrx_cb then el:rtmrx_cb({ x[1], x[2], x[3] }, x[4]) end end` - a header triple and ONE
  byte. So the Lua spelling is `self.rtmrx_cb=function(s,h,b)`, and the Editor's face (grid-editor
  `FunctionStartFace.svelte:27`) offers exactly `self.rtmrx_cb(self, header, rtm)` as "MIDI
  Real-Time RX callback handler (clock, start, stop, etc.)".
- `grid_usb_midi.c:200-210` puts the raw realtime byte on the wire as `CLASS_MIDIRTM_BYTE`;
  `grid_decode.c:388` lets the class through only when `grid_rx_should_handle(GRID_RX_TYPE_MIDIRTM)`
  says so, and `:420` pushes `{INSTR, SX, SY, byte}` into `_decoded_rtm`. The bytes are 248 clock
  (24 to the quarter), 250 Start, 251 Continue, 252 Stop; 254 is active sensing and must do nothing.
- `init.lua:10-15`: `rx_type.MIDIRTM` is 2 and the default is `grxm(rx_type.MIDIRTM, 0)` - off;
  `rx_feat.FORWARD | rx_feat.HANDLE_EXTERNAL` is 3. `l_grid_rx_mode` (`grid_lua_api.c:832-855`)
  needs a NUMBER as its second argument (a nil is `#GTV.invalidParams`), which is why the Sync
  literal is a Lua boolean folded to a number: `grxm(2,@SYNC and 3 or 0)`.
- The protocol package agrees: `GRID_LUA_FNC_G_RX_MODE_short` is `grxm`, its usage line reads
  "type: 0=MIDIVOICE 1=MIDISYSEX 2=MIDIRTM 3=EVENTVIEW. mode: bitmask 0x01=forward_from_usb
  0x02=handle_external 0x04=handle_internal"; `midi_rx_register` (`gmrr`) is the OTHER registration,
  for voice messages by channel and command, and is not the clock's road.

The idiom, in the entry's own words:

```lua
-- Setup: state and the callback. The step routine is not here (it is the Timer's, below), so the
-- callback reaches it through a FIELD READ - a field CALL (`s.f(s)`) is refused by host-surface.
s.k=0 s.q=0
s.rtmrx_cb=function(s,h,b)
  if b==250 then s.k=0 s.q=0 end
  if b==250 or b==251 then s.r=1
  elseif b==252 then s.r=nil
  elseif b==248 and s.r then
    local f=s.f
    if s.q%@DIV==0 and f then f(s)end
    s.q=s.q+1
  end
end
grxm(2,@SYNC and 3 or 0)

-- Timer: the step routine, published on every call; Internal steps here, External steps nowhere here.
local function f(s) ... end
s.f=f
if @SYNC then return end
f(s)
```

`s.k` is the step, `s.q` the clock count, `s.r` the run flag. Start resets both counters and runs,
so the first clock after Start lands step 0 (`q%DIV==0` at q 0); Continue runs from where the
count stood; Stop clears the flag and every clock after it does nothing. `@DIV` is 12, 6 or 3
(an 8th, a 16th, a 32nd at 24 clocks per quarter). The one caveat: the routine is published by
the Timer's FIRST call, at most one `@TEMPO` period after the Setup, so a clock inside that period
is counted and not stepped - the pattern stays in phase (the count went on), the first step's
notes are lost. The alternative - the routine in the Setup - was costed and does not fit (below).
Under External the Timer still runs at `@TEMPO` for the finger sweep `X(s,20)` and steps nothing,
which is what "the tempo knob is ignored" means.

### The forms costed, under the pinned `compressScript` after `initLuaFormatter()`

Every figure at the RGB444 picker corner (four colour knobs at 255,255,255, every other knob at
its longest literal: `7,11,17,23`, `240`, `126`, `127` x 4, `15`, `false`, `12`), each a fixed point
passing `checkSyntax`:

- (i) EVERYTHING IN THE SETUP - the geometry, the colours as a twelve-channel table, the notes,
  the callback, the touch handler; the step routine `local function f` in the Setup and the Timer
  calling it through `s.f`: **Setup 976 (68 over)**, Timer 295.
- (ii) chosen - THE STEP ROUTINE IN THE TIMER, the colour table and the note table with it (the
  head colours its own cell as it lights it - a dark cell shows no colour, so nothing is lost),
  the callback in the Setup reading `s.f`, and the callback's `glag(0,s.c[d][t])` folded to
  `glag(0,m)` (the same cell): **Setup 846 (62 free), Timer 404 (504 free)**; 843 / 383 at the
  defaults. No system slot needed (the user's order, section 7: Setup, then Timer, then 255 only
  if nothing else fits).

The Sync literal costed two ways: numeric `0` / `3` with `if @SYNC>0 then return end` is four
characters cheaper than the boolean but `0` and `2` are CHORUS's inversion literals in `view.ts`'s
mode table (worded Off / Smart), so the boolean is the one whose words cannot collide. The
reversed Tempo list was written as the brief spelled it ("today's values reversed in order"); a
BPM readout (`gtt(0,15000//@BPM)`, +7 on each event, the same six periods to within a
millisecond) would put the bigger number AND the faster tempo on the right, and is a question
for the user.

### What moved beside the strings

- `types.ts`: `LuaKnob.previewIndex?` - the index the browser preview renders a knob at when it
  cannot honour the chosen one; `lua-pad-sim.ts`'s `previewIndices` applies it in
  `createLuaPadSim` alone (the wire, the meters and the stamp carry the choice); `model.ts` names
  the held knobs in `TuneView.previewHeld` and `TuningRegion.svelte` shows
  `PREVIEW_INTERNAL_CLOCK` under Behavior while it is not empty. ORBIT's `sync` declares 0.
- `view.ts`: `SYNC_WORDS` (`false` Internal, `true` External), `DIVISION_WORDS` (`12` 8th, `6` 16th,
  `3` 32nd), the `mode` fall-through over `MODE_TABLES`, and `noteNumber` - the other direction
  of `noteName`, in its spelling (C4 = 60: 0 is C-1, 127 is G9; Live's C-2..G8 is the same
  0..127); `C#3`, `Db3` and `49` all read 49, `H3`, `128`, `G#9` and `-1` are refused.
- `MidiField.svelte`: a `note` knob's field parses through `noteNumber` and refuses with
  `NOTE_OFFERED` ("A note here is C-1 to G9, or 0 to 127."); its keyboard is the full one
  (`inputmode="text"`); the readout stays the name. The four ring notes reach it because their
  label carries the wire word (`Ring 1 MIDI note`), which also keeps them out of Randomize.
- `stamp.ts`: a WIDE knob - more options than one base-32 character - rides two characters, high
  first (`fieldChars`, `WIDE_FIELD_CHARS`, `luaPayloadLength`), on both `w` and `x`; every rack
  without one is encoded byte for byte as before. `knobs.lua.ts` keeps `STAMP_OPTION_CEILING` 32
  and adds `STAMP_WIDE_CEILING` 1,024. ORBIT's `w` payload is 28 characters.
- `brightness.ts`: `orbit: { palettes: ["c"] }` - the Timer's twelve-channel table.
- `lua-host.ts`: `rtm(byte)`, test-facing and synchronous: calls `self.rtmrx_cb(self, {13,0,0},
byte)` as `decode.lua` does, returns false when the entry defines none; the routing gate is the
  spec's to read off `rxMode`.
- `hash-wire.mjs`: a product past one million states is sampled at every knob's first, default
  and last position (ORBIT's full product is 10^17); every entry under the ceiling is hashed over
  its whole product as before. `stamp-roundtrip.sweep.spec.ts`: Pass A holds wide knobs at their
  default, Pass C walks every wide position and the all-wide-last corner.
- Specs: `lua-smoke` +1 (the VM proof, above) and the swipe's eligible set reads four rings;
  `stamp.spec` reads EUCLID's captured records under ORBIT (`RENAMED`) - the default vector
  encodes to a stamp now (`tempo: 3` is 140 ms on the reversed list), the wild `x` stamp lands
  `unreadable` (fourteen knobs, two wide fields); `knobs.lua.spec` names the four wide knobs;
  `surprise.spec` thirty-three excluded knobs; `local.spec` thirteen removed ids; `audition.spec`
  thirty-four rows; `catalog.spec` and `knobs.lua.spec` admit fourteen knobs on ORBIT by name.
- `e2e/fixtures/library/orbit-copy.hangar.json`: a real export written by `transfer.ts` against
  the fourteen-knob rack (`euclid-copy` renamed and regenerated); `library.e2e.ts` walks it.
- The card sentence (D-05's register): "Four Euclidean rings, a colour and a note each, on their
  tempo or your DAW’s clock; tap a step to change it."

## Change 8b, 2026-09-18 - the Tempo rail reads BPM, ascending

The coordinator's follow-up to change 8's question (a): "bigger tempo on the right side" means
FASTER on the right, and a bigger millisecond period is the opposite. So `@TEMPO` (a period in
ms, reversed at change 8 to `70 90 110 140 180 240`) is `@BPM` (the token renamed; the knob's id
stays `tempo`, because the stamp, the fixture rack and the specs read the id and a rename there
would move the e2e fixture and every spec that names it for nothing), the values are beats per
minute ascending, `60 90 110 136 160 200`, and both events read `gtt(0,15000//@BPM)` - a 16th
at that tempo, 250 166 136 110 93 75 ms. **136 is the default**: `15000//136` is exactly the 110
ms step EUCLID and change 8 had, so `frames.json` and the golden frame did not move (regenerated,
byte-identical). The label reads Tempo (BPM) because `view.ts` has no unit path for a readout;
the readout is the bare number. Costs at the RGB444 picker corner: Setup 846 -> **853** (55 free),
Timer 404 -> **411** (497 free); 850 / 390 at the defaults - the +7 the form was costed at. The
captured EUCLID default vector (`tempo: 3`) is the defaults again under ORBIT (`stamp.spec.ts`),
since index 3 is the 110 ms step once more.
