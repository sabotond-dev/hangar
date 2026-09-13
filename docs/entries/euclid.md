# EUCLID - the history behind src/lib/catalog/entries/euclid.ts

EUCLID is the three concentric Euclidean rings beating against each other on a 48-tick cycle,
the first configuration authored for HANGAR rather than ported. Its source is
`src/lib/catalog/entries/euclid.ts`. 08-06 authored it; 11-02 moved the trail's decay pair to
the house idiom and the trail values to divisors of 252; 11-08 reversed the onset-only guard so
a swipe toggles every ring cell it crosses; 12-08 handed the inlined guard to the library's `Q`
and added `X(s,20)` (700 / 237 at the picker corner); 12.1-03 added the white finger and, through
the calibrated cell, fixed the outer ring (726). The entry's own header now carries the
mechanism, the wire and the traps; everything the header said before 13.2-02 - the measurements,
the probe readings, the MIDI sync gates and the frames.json residue - is below, verbatim.

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
