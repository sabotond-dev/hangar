# GHOST - the history behind src/lib/catalog/entries/ghost.ts

GHOST is the gesture looper: drag once and a ghost retraces the path forever, still sending the
X / Y pair, until the lit red corner takes it back. Its source is
`src/lib/catalog/entries/ghost.ts`. 11-02 repaired its guard and its decay landing; 11-11
re-authored it from a blank page on the user's words - the lit corner key chosen over a held press
and a two-cell corner by measurement, one gesture one loop, `s.h=e<9`, the clear as
`glpfs(a,l,0,0,0)`; 12.1-08a put the finger and the calibrated cell through the library (478 / 422
to 491 / 409 at the picker corner). The entry's own header now carries the mechanism, the wire and
the traps; everything the header said before 13.2-02 - the symptom map, the three sketches, the
budget and the `Q / X / R` shape measured and not taken - is below, verbatim.

## Moved from src/lib/catalog/entries/ghost.ts on 2026-09-13 (13.2-02)

```text
GHOST - draw a curve once, and it loops until you take it back.

A gesture looper. Hold a finger and drag: the pad records your path at 50 Hz
while sending X and Y as a CC pair. Lift, and a ghost retraces exactly what
you drew, forever, still sending. It is drawn automation with no DAW, no lane
and no mouse.

RE-AUTHORED FROM A BLANK PAGE IN PLAN 11-11, on the user's own words:
"doesn't work reliably, the LED colors the pad and resetting is not reliable,
need to redesign this from scratch". The promise did not change. The
behaviour did.

---------------------------------------------------------------------------
WHAT ITS RELIABILITY RESTS ON, IN TWO SENTENCES
---------------------------------------------------------------------------

The class-B repair 11-02 made is what stops a fast tap producing nothing, and
the class-A repair it made is what stops a crossed cell staying faintly lit
forever - both are inherited, both are now gated, and neither is re-derived
here. Everything else the bench reported rests on THIS file's new structure:
the coalesced tap no longer arms a latch nothing clears, a second gesture no
longer glues itself onto the first, and the reset is a lit key on the pad
that stops the decays it clears instead of a second finger that restarted
them.

Which symptom each change answers, so the next bench run can tell the
redesign from the gates:

  "doesn't work reliably"        -> the code-9 latch (new, below) and
                                    one-gesture-one-loop (new, below);
                                    the class-B guard (inherited, 11-02)
  "the LED colors the pad"       -> glpfs(a,l,0,0,0) as the clear (new);
                                    the class-A landing (inherited, 11-02)
  "resetting is not reliable"    -> the lit corner key (new, below)

---------------------------------------------------------------------------
THE THREE THINGS THAT CHANGED, AND THE DEFECT EACH ONE CLOSES
---------------------------------------------------------------------------

1. THE RESET IS A LIT KEY ON THE PAD, NOT A SECOND FINGER.

   The old erase was `if i>0 then if e==4 or e>8 then ...`: a second contact,
   anywhere. Nothing on the pad said so, nothing showed it had happened, and
   on a pad with no modifier a second finger is both undiscoverable and easy
   to mistime. That is the specific thing the user called unreliable.

   SCREEN CELL 80 - the bottom-right corner - is coloured 255,0,0 at Setup
   and lit by the Timer whenever there is something to erase. Press it and
   the recording is gone. THE KEY EXISTS EXACTLY WHEN IT IS LIT: with nothing
   recorded the corner is dark and is an ordinary cell you may start a drag
   on, so the pad never has a dead square and the visitor never presses a key
   that does nothing.

   SINCE PLAN 12.1-08a THE KEY IS TESTED THROUGH THE LIBRARY'S `N` (12.1-
   CONTEXT D-26 item 1): `s.n>0 and N(x,y)==80`, the nearest CALIBRATED cell
   of the onset's raw pair - so the key is the LED at (8,8) and nothing else,
   not the sensor's saturated corner. The test was `x*9//128+y*9//128*9==80`
   until 12.1-08a, and that read cell 80 for every raw pair with both axes at
   114 or above - which on the user's module (calibration.ts, Probe C) is
   where LED (7,7) sits: a finger centred on LED (7,7) reads (120, 115), and
   `120*9//128 = 8`, `115*9//128 = 8`. A FINGER PLACED ON LED (7,7) WHILE A
   LOOP WAS PLAYING ERASED THE LOOP. Under `N`, (120, 115) is cell 70 and
   records; only the LED at (8,8), (126, 126), is the key. lua-smoke.spec.ts
   pins both readings in the real VM with the naive figure printed beside
   them. `N` has no hysteresis and no state, which is the right shape for a
   press-time lookup on an onset edge (ARC's stop tap, 12.1-03, is the same
   shape); both the key here and the comet cell in the Timer read the same
   `U` and the same two tables, so the key and the comet agree on where the
   LEDs are.

   It is red because red is the one colour a person reads as "this undoes
   something" without being told, and because it must stay legible whichever
   pair of colours the two colour knobs are set to - the erase key is a
   function, not decoration, so it does not take the palette.

   IT PULSES, ON A 280 ms CADENCE, and that is three things at once. It reads
   as "act on me" where a steady cell reads as furniture; it puts the one
   permanently-present light on this pad under the same class-A rule as
   everything else; and it means the corner is a cell something is still
   DRIVING rather than a cell left behind, which is the distinction
   src/lib/sim/lua-smoke.spec.ts's residue probe draws. The pulse never
   reaches black: the decay is armed for 42 ticks and re-armed after 28, so
   the phase breathes 252 -> 84 and back.

2. ONE GESTURE IS ONE LOOP.

   The old recorder APPENDED. `if s.n<@LEN then s.n=s.n+1 ...` ran on every
   Timer tick a finger was down, whatever had been recorded before, so a
   second drag was glued onto the end of the first and the only way back was
   the second finger nobody could find. Two drags produced one incoherent
   loop, which is "doesn't work reliably" as a user experiences it.

   Every onset now clears the pad and starts a fresh recording at the point
   it began. Draw, lift, watch; draw again, and you replace it. There is
   exactly one recording and there is exactly one way to have none.

3. A COALESCED TAP NO LONGER ARMS A LATCH NOTHING CLEARS.

   11-02 handed this forward by name: a code-9 tap set `s.h` and nothing ever
   cleared it, because only a lift does and a coalesced tap has none. The old
   card then recorded one frozen point forever and never entered playback.

   The onset now ends with `s.h=e<9`, which is the whole fix and the whole
   statement of it: a contact is live if and only if it is not a
   press-and-lift in one message. A tap therefore records its one point and
   goes straight to playback - tap a cell and that cell loops, which is a
   real answer rather than a stuck one. This is QUADRANT's treatment of the
   same event in its cheapest form; src/lib/catalog/touch-guard.spec.ts holds
   the convention and cites QUADRANT as the worked example.

---------------------------------------------------------------------------
THE CLEAR IS glpfs(a,l,0,0,0), AND glp(a,l,0) WAS THE BUG
---------------------------------------------------------------------------

This is the mechanism behind "resetting is not reliable", derived from the
engine rather than guessed. The old erase wrote `for a=0,80 do glp(a,1,0)end`
- phase 0, and nothing else. But `glp` does not touch the RATE or the
TIMEOUT, and grid_led_tick does `pha += fre` on every tick a timeout is still
running (src/vendor/botor/pad-sim.ts:885-895, firmware grid_led.c:191-211).
A cell mid-decay at rate 250 that is set to phase 0 is at phase 250 on the
very next tick. THE OLD RESET RELIT EVERY CELL IT CLEARED, at 98 per cent
brightness, and sent it down the decay again. It also never touched layer 2
at all, so the ghost's own trail was outside the erase entirely.

The clear is now `glpfs(a,1,0,0,0)` and `glpfs(a,2,0,0,0)` on all 81 cells:
phase 0, RATE 0, shape 0. Rate 0 is the house idiom for taking a cell back
from a decay it started earlier - decay-idiom.spec.ts skips it by name,
because a layer that does not walk has no landing to check - and it is what
makes "the reset leaves no cell lit" true at the next tick rather than 420 ms
later.

---------------------------------------------------------------------------
THE BUDGET, COSTED BEFORE THE ENTRY WAS WRITTEN (D-04)
---------------------------------------------------------------------------

Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`, at the RGB444 PICKER CORNER - both colour knobs at
255,255,255 and every other knob at its longest declared value. That is the
corner the 908 gate reads. GHOST's picker corner and its declared corner
coincide, by the same accident ARC, MORPH and LUMEN have: both colour knobs
already declare 255,255,255, so the two points are the same one. DO NOT read
that as the norm - five entry headers in this catalog quote the wrong corner.

Three reset gestures were sketched as Lua and MEASURED before a line of this
entry was written:

  A  a HELD press on the marked cell   Setup 533 / 375 free   Timer 571 / 337
  B  ONE lit corner cell               Setup 478 / 430 free   Timer 422 / 486
  C  a two-cell corner (79 and 80)     Setup 542 / 366 free   Timer 457 / 451

ALL THREE FIT. B was chosen and it was not chosen because it is cheapest.

  A answers "resetting is not reliable" with "and now you must also hold it
  for the right length of time". A hold has no affordance: nothing on a pad
  says how long, so the user has to already know, and a user who releases too
  early has performed the failure the note is about. It also costs 149 more
  Timer characters for a countdown, an abort path and a fill to render.
  C doubles the area a drag can accidentally start on - two cells of 81
  instead of one - and buys nothing: one lit red corner on an otherwise black
  pad is already unmistakable. It is the more expensive of the two on Setup.

SHIPPED (plan 12.1-08a, re-measured in this tree under the pinned minifier
after initLuaFormatter, cost = max(raw, compressed), fixed point, checkSyntax
true): Setup 491 of 908 at the picker corner, 417 free; 486 at the defaults.
Timer 409 of 908 at the picker corner, 499 free; 405 at the defaults. The
figures B was chosen at - Setup 478 / 430 free (475 at the defaults), Timer
422 / 486 free (418 at the defaults) - are the pre-12.1-08a figures, and the
difference is the three needles of that plan: `N(x,y)==80` for the key
(-13 on the Setup), `G(s,i,e,x,y,0,@RECC)` after the id gate (+26 at the
corner, where @RECC is 255,255,255; +24 at the defaults) and `glag(0,N(x,y))`
in the Timer (-13). The all-shortest corner is not read by any gate and is
not quoted.

---------------------------------------------------------------------------
THE FINGER IS THE LIBRARY'S GRADIENT (plan 12.1-08a; 12.1-CONTEXT D-26)
---------------------------------------------------------------------------

While a finger is down GHOST draws it as the library's bilinear finger:
`G(s,i,e,x,y,0,@RECC)` in the callback, AFTER the id gate and BEFORE the
onset block, on layer 0 in the recording colour. `G` clears the contact's
previous 2x2 block, returns on an end code (3, 5..8) AND on a coalesced 9
(12.1-03: a 9 is a press and a lift in one message, so there is no finger
left to draw), and otherwise lights the 2x2 block around the calibrated
position at the four bilinear weights with the colour re-asserted on every
cell. GHOST calls no `Q`, so there is no "Q first" here; `G` after the gate
is the whole order, and `G`'s own end test and the onset's `s.h=e<9` agree
on what a tap is: one recorded point, no gradient lit.

WHY @RECC AND NOT WHITE (D-13). The finger is exactly what this knob names -
the recording comet that follows your hand - so the gradient takes the
knob, as RADAR POINTS took @SWEEPC and LUMEN @CURSORC. At the picker corner
@RECC renders 255,255,255, so the cost is the white literal's. The ghost's
replay stays on layer 2 in @GHOSTC; the live finger is on layer 0; telling
your hand from its ghost is still the two layers' job.

WHY `G` CARRIES THE COLOUR, AND WHY THERE IS NO FLOOR (D-11). Layer 0 is the
firmware's alert layer: `grid_alert_all_set` (grid_led.h:7, grid_led.c:260-
271) rewrites layer 0's colour on every LED and forces its min to 0, and it
is called from five places - a CONFIG write, page-discard completion, a
refused page change, a TX overflow, and boot. A finger coloured once in an
init loop would turn grey, purple or blue after any of those; `G` writes
`glc(a,0,r,g,b,1)` on each of its four cells on every call, so the finger
heals on the next sample. The trailing `1` forces the layer's min to 0, so
a cell `V` clears is dark - there is no byte-6 floor, and GHOST's black rest
frame (frames.spec.ts test 5, `restsBlack: true`) is unmoved by this.

WHY `G` AND NOT `Q` / `X` / `R` - THE STILL FINGER. The library's expiry
(`Q` registering the contact, `X(s,n)` in the Timer, `E` clearing the block
and calling an `R`) would let a LOST lift end the recording and darken the
gradient. It would also end the recording of a STILL finger after `n` Timer
ticks, because the firmware's change gate means a motionless contact sends
nothing - and "a motionless finger still records, which is correct" is this
card's one promise about recording (below). That is a behaviour change, not
a re-fit. Measured for the record (plan 12.1-08a, same harness):
`R=function(s,i)s.h=nil end` + `Q(s,i,e,x,y)` before `G` + `X(s,150)` in
the Timer (3 s of stillness before expiry, against the 5 s recording cap) is
Setup 530 / Timer 417 at the picker corner - inside 908, and NOT TAKEN.
docs/HARDWARE-AUDITION.md row 27(d) asks the user whether a paused drag
should keep recording; if the answer is no, that shape is a one-commit
change.

WHAT A LOST LIFT LEAVES, STATED. Exactly what it left before 12.1-08a - the
comet held at the last point and the recording running to @LEN - plus one
lit 2x2 block on layer 0 at the last position, which the next onset's `G`
clears (`local o=B[i]if o then V(o)end`) before it draws the new one.

---------------------------------------------------------------------------
THE CONVENTIONS THIS ENTRY IS WRITTEN INSIDE, CITED AND NOT RESTATED
---------------------------------------------------------------------------

CONTACT ENDED is `e==3 or e>=5 and e<9`; CONTACT STARTED is `e==4 or e>8`,
and the brackets are absent because the chain is the whole condition here -
`and` binds tighter than `or`, so a bare pattern copied into a larger
expression needs them and this one does not.
src/lib/catalog/touch-guard.spec.ts is the gate and the event table lives in
src/vendor/botor/pad-sim.ts:228-241 and zona-docs ZONA_REFERENCE.md s4.6.

EVERY DECAY LANDS ON PHASE 0. Both decaying pairs here are the literal house
idiom at T = 42: `glpfs(a,l,252,250,0)` with `glt(a,l,42)`, step 6, 6 x 42 =
252, 252 - 252 = 0 exactly. src/lib/catalog/decay-idiom.spec.ts holds the
rule, the arithmetic and the fifteen usable timeouts, and it is CITED here
rather than restated. THIS ENTRY CARRIES NO ROW IN EITHER GATE'S EXCEPTION
TABLE, which is the point of authoring a blank page after the gates exist.

THE TIMER IS 20 ms AND IS RE-ARMED FIRST. `gtt(0,20)` opens the Timer body,
so a tick that later raises still leaves the next one scheduled. Both the
record and the replay advance one point per Timer tick, which is what makes
the loop play back at the speed it was drawn - and it is why the recorder
lives here rather than in the touch callback, whose enqueue is CHANGE-GATED
per contact and would take fewer points from a slow drag than from a fast one.
A motionless finger still records, which is correct.

THE CELL THE COMET AND THE GHOST LIGHT IS `N(x,y)` - the LED under the raw
pair, through the library's calibrated map - so a replayed point lands on
the LED the finger was over, and the comet's head sits under the fingertip.
Until plan 12.1-08a it was `x*9//128+y*9//128*9`, the naive ninth of the
sensor's range, which put a finger centred on LED 1 in column 0 and one on
LED 6 in column 7 (12.1-05 found GHOST's demo trace a column out at both
ends for exactly this reason). The recording itself is unchanged: `s.g`
still holds the RAW `x*128+y`, so the CC pair still sends the raw sensor
value (D-14) and only the picture goes through the map.

THE SECOND CC NUMBER IS "@CCX+1" RATHER THAN A LITERAL. Two characters, and
the pair can never drift into a configuration that sends X on 16 and Y on
some unrelated controller.

ONE THING THE DESIGN COSTS AND IT IS SAID RATHER THAN HIDDEN: while a ghost
is looping, cell 80 - the LED at (8,8), through `N` - is the erase key, so a
NEW drag cannot be started in the bottom-right corner without erasing first.
One cell of 81, in the corner furthest from where a hand rests, and only
while the key is lit. A comet or a ghost dot passing OVER cell 80 is
unaffected - the key acts on an onset and on nothing else.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are fixed points of the pinned minifier and
accepted by checkSyntax; src/lib/catalog/lua-entries.sweep.spec.ts asserts
both across the whole five-knob cross-product.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```
