# MORPH - the history behind src/lib/catalog/entries/morph.ts

MORPH is the four-corner macro morph pad: one CC per corner, the finger blended bilinearly into
four weights, each corner block's brightness its own weight, a tap inside a corner speaking for
that corner alone. Its source is `src/lib/catalog/entries/morph.ts`. 11-02 fixed the stuck decay
pair and the class-B guard; 11-08 added the per-corner send suppression; 11-09.1 the corner tap
(579 to 710); 12-09 the 3x3 corners, the dead margin and the trail cell from the library's `Q`
(772); 12.1-04 the library's finger and the split first line (814). The entry's own header now
carries the mechanism, the wire and the traps; everything the header said before 13.2-02 - the
bench notes, the measurements, the rejected readings and the ladder - is below, verbatim.

## Moved from src/lib/catalog/entries/morph.ts on 2026-09-13 (13.2-02)

```text
MORPH - four macros in the corners, one finger between them.

A four-corner macro morph pad. Each corner owns one CC; your finger's
position is blended bilinearly into four weights that always sum to the full
range. Park in a corner and that macro is at 127 and the other three at 0;
sit in the middle and all four sit at a quarter. It is the paradigm players
already know from Kaoss pads, NI morph pads and Ableton macro racks, and
mapping four consecutive CCs is the easiest MIDI-learn job there is.

EACH CORNER'S BRIGHTNESS IS ITS OWN WEIGHT, so the mix is readable across a
room. The four 3x3 corner blocks - 2x2 until plan 12-09 - get four distinct
hues out of one arithmetic expression, 255-j*spread, j*spread, 128, which is
why four coloured corners cost the budget almost nothing. @SPREAD APPEARS TWICE in that expression and
both sites must be substituted, or the four corners stop being four hues.

MORPH HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION.
Its only animation is a per-touch decay, which is self-limiting: the cells
under your finger are handed glpfs(a,2,252,256-252//@DECAY,0) plus
glt(a,2,@DECAY) and then die on their own. There is nothing for a Timer to
advance - which is also why nothing was ever coming back to clear the cells
the old pair left stranded. See the class-A note below.

DO NOT ADD THE STANDARD KEEPER. The reflex is to write
"for a=0,80 do glt(a,L,65535) end" into a Timer so a layer never expires.
Applied to THIS layer it is pitfall 1 exactly: the 42-tick countdown is
replaced by 65535, the decay rate of 250 keeps decrementing past zero and
wraps, and every touched cell strobes forever. The smoke gate's pitfall-1
guard - a keeper-height timeout together with a fast decay rate - would catch
it, but this comment exists so nobody writes it in the first place.

The empty Timer needs no special case anywhere in the gate, and none was
added: compressScript("") is "" (already a fixed point) and checkSyntax("")
is true, both measured at the pin. createLuaPadSim maps the catalog's
always-a-string shape onto LuaHost's undefined, so MORPH cannot arm a timer
at all - which is what firmware does too, since gtt is a no-op until the
Timer event holds at least one stored action.

THE COMET'S DECAY PAIR IS THE HOUSE IDIOM, AND @DECAY'S VALUES ARE PART OF
IT (plan 11-02). Setup shipped glpfs(a,2,255,250,0) with glt(a,2,@DECAY), and
that pair can NEVER land on phase 0 at any value: glpfs walks the phase with
`pha += fre` on a uint8_t, 255 is odd, the step 256 - 250 = 6 is even, so
255 - 6T is odd at every T. Re-choosing @DECAY could not have fixed it - the
STARTING PHASE had to move. Measured in the simulator, every crossed cell was
left at rgb [47,66,66] forever, and MORPH HAS NO TIMER, so nothing was ever
going to repaint it. That is the bench report "the LED's colors stuck again".

It now writes glpfs(a,2,252,256-252//@DECAY,0), the parameterised house idiom
steps.ts and cull.ts already ship: start at 252, step 252//T, land on
252 - T*(252//T) = 0 whenever T is an EXACT DIVISOR of 252. Cost: +8
characters at the defaults, +9 at the all-longest corner.

@DECAY'S VALUES MOVED WITH IT, AND A SHARED LINK IS THE PRICE. 20, 80 and 120
do not divide 252, so they became 21, 84 and 126 - the nearest legal value to
each, same arity, still ascending, 42 already legal and untouched. A stamp
encodes the knob's INDEX, not its value, so every link anybody has ever
shared still decodes and still restores; a link carrying index 3 now renders
a 1260 ms trail where it used to render a 1200 ms one. stamp.spec.ts compares
indices and stays green either way, so no test says this out loud and this
comment does.

src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
list of usable timeouts, and it is CITED here rather than restated.

MORPH'S BENCH NOTE HAS THREE CLAUSES. "mapping mode needed in, if something
doesn't change don't send it don't send 0 value, also the LED's colors stuck
again" - the stuck colours are the class-A fix above and the class-B fix
below (plan 11-02); the SUPPRESSION is the section immediately following
(plan 11-08); and "mapping mode" was a question at 11-09's checkpoint
because it admitted several readings. IT IS ANSWERED NOW, in the section
below on the corner tap (plan 11-09.1). All three clauses are closed.

---------------------------------------------------------------------------
A CORNER TAP SPEAKS FOR ONE CORNER (plan 11-09.1)
---------------------------------------------------------------------------

The user answered "mapping mode needed in" with "when you tap morphs corners
it should only send one MIDI message"
(.planning/phases/11-bench-corrections/11-09-ANSWERS.md). Tap corner j, emit
only CC @CCB+j. The continuous bilinear morph is unchanged.

THIS IS A FOURTH READING AND IT IS CHEAPER THAN THE THREE THE CHECKPOINT
COSTED, and the reason belongs here rather than only in a plan. The richest
option was an assignment MODE - a latch, a selection gesture and a
single-corner emit - and it named THE GESTURE as the expensive part. That
expense is gone: self.k already declares four corner blocks - 2x2 then, 3x3
since plan 12-09 - so THE CORNER TAP IS THE SELECTION. No latch, no mode, no
new gesture, nothing to exit.

WHY IT MATTERS, AND IT IS THE SAME COMPLAINT AS THE SUPPRESSION CLAUSE. In a
DAW, MIDI-learn binds whichever message arrives first. With four CCs
streaming from every touch, corner 3 cannot be bound to a filter: the moment
you hit learn, one of the other three lands first and takes it. That is why
"mapping mode needed in" sat in the same sentence as "if something doesn't
change don't send it don't send 0 value" - BOTH CLAUSES ARE ABOUT THE PAD
SHOUTING OVER ITSELF. 11-08 fixed the shouting; this makes each corner
individually reachable.

THE MEASUREMENT CAME FIRST AND IT DID NOT SHRINK THE TASK, WHICH IS WORTH
SAYING BECAUSE IT COULD HAVE. 11-08's per-corner suppression already
silences three of the four AT A CORNER, because three weights are
arithmetically 0 there and s.p holds them at 0. Driven through the real Lua
host before any change:

  press on the exact extreme pixel (0,0)          1 message
  press on the CENTRE of the corner block (2x2)   4 messages
  the same, arriving after a stroke elsewhere     4 messages

A finger aimed at a corner lands in the BLOCK, not on the one pixel where
the arithmetic is already clean - at (14,14) the weights are 100/12/12/1 and
all four leave. So the gap is real at the point a hand reaches, and
lua-smoke.spec.ts pins its probes to points where all four weights are
non-zero, so a one-message result can never be the old behaviour wearing the
new one's clothes. ALL THREE FIGURES ABOVE ARE 11-09.1'S, ON THE 2x2 BLOCKS
AND WITHOUT THE MARGIN, and plan 12-09 moved both: (14,14) is now inside the
dead margin and reads 127/0/0/0, so the test's aiming point moved to the
block's INNER cell - (35,35) for corner 1, weights 95/14/14/2 - which is
where all four are non-zero AND where a hand reaching from the middle of the
pad lands. The non-vacuity clause is unchanged; only the point is.

THE DISCRIMINATION IS THE ONSET EDGE, "e==4 or e>8", and it is the SAME edge
arc.ts takes in the same plan - one idiom in the catalogue for telling a
discrete tap from the start of a drag, cited to stage.ts and to
src/vendor/botor/pad-sim.ts:228-241 rather than re-derived. On the onset
sample, if the cell is inside a corner block, only that corner may speak; on
any MOVE sample q is 0 and the full bilinear morph runs exactly as 11-08
left it.

THE REJECTED ALTERNATIVE - "only a coalesced DOWNUP (e>8) counts as a tap" -
IS CHEAPER STILL AND IT IS REJECTED BY MEASUREMENT TWICE OVER. First, the
shipped src/lib/sim/touch.ts NEVER PRODUCES CODE 9 AT ALL: measured, a press
held 300 ms and the fastest press a pointer can make both deliver 4 then 5,
so the headline gesture of the card would be invisible in the browser, which
is the failure PREV-01 exists to prevent and the same reason 11-09 rejected
a second contact. Second, on hardware a deliberate tap aimed at a MIDI-learn
button is exactly the slow kind that arrives as 4 then 5, so the feature
would be unreliable in the one situation it exists for.

THE CORNER BLOCKS ARE DERIVED FROM self.k, NOT TYPED. The Lua walks
s.k[j] + d%3 + d//3*9 for d = 0..8, the same expression the Setup paint loop
and the send loop already use, so moving a corner moves all three together.
lua-smoke.spec.ts reads self.k AND the block's side out of the entry's own
source for the same reason.

11-08'S SUPPRESSION IS NOT BYPASSED, RE-KEYED OR RESET. A corner tap updates
s.p FOR THAT CORNER ONLY. The other three keep their old entries on purpose:
they were not sent, so the receiver has not heard them, and the next
continuous sample must be free to say so. THE HONEST PRICE, stated rather
than discovered: tap corner 1 and then corner 2 and a receiver holds corner
1 at its tapped value until a continuous stroke moves it. That is what
"speaks for one corner" means, and it is what makes MIDI-learn work.

THE PAINT STAYS UNCONDITIONAL, exactly as the section further down says: the
picture is a READOUT and the wire is TRAFFIC. A corner tap repaints all four
corners' current weights even though it speaks for one.

THE CELL INDEX IS NOW A LOCAL, WHICH PAID FOR PART OF THE FEATURE. The comet
at the end of the handler recomputed x*9//128+y*9//128*9; the corner test
needs the same value, so it is bound once as `c` and used twice - 18
characters back. Plan 12-09 replaced that arithmetic with `Q(s,i,e,x,y)`;
see the section immediately below.

COST: Setup 579 -> 710 of 908 at the RGB444 picker corner (plan 11-09.1),
then 710 -> 772 in plan 12-09, then 772 -> 814 in plan 12.1-04 (the finger),
94 free. Timer still the empty string, and NO KEEPER WAS ADDED - see the
capitalised note above, which stands.

---------------------------------------------------------------------------
BIGGER CORNERS, A DEAD MARGIN, AND THE TRAIL CELL FROM THE LIBRARY (12-09)
---------------------------------------------------------------------------

THE BENCH NOTE, VERBATIM: "MORPH: kozepen random vilagitas, ne csak teljesen
a sarokban legyen 0 pont, legyen nagyobb tere a mappolasnak ahol. tehat a
sarkokban legyenek nagyobbak a teruletek ahol csak egy ch-t kuld ki" -
random lighting in the middle; the zero point should not be only in the exact
corner; bigger corner regions where only one channel is sent. Three clauses,
three edits, each measured on its own at the RGB444 picker corner.

1. THE CORNER BLOCKS ARE 3x3, AT +0 CHARACTERS (710 -> 710). self.k moves
   from {0,7,63,70} to {0,6,54,60} and the walk from `d%2+d//2*9` over
   d = 0..3 to `d%3+d//3*9` over d = 0..8, at all three sites. Both literals
   are the same length, so the whole clause is free: nine cells of eighty-one
   per corner instead of four, which is the "bigger regions where only one
   channel is sent" the note asks for. THE CORNER TAP IS STILL THE SELECTION
   and nothing about the mechanism above changes - only how big a target it
   is. A finger aimed at a corner from the middle of the pad lands on the
   block's INNER cell, which is now a real cell rather than a pixel away from
   the edge, and lua-smoke.spec.ts aims there for exactly that reason.

2. A DEAD MARGIN, AT +56 (710 -> 766). "The zero point should not sit ONLY in
   the exact corner." The raw axis is remapped before the weights:

       x=glim((x-24)*127//79,0,127)  y=glim((y-24)*127//79,0,127)

   so raw 0..24 reads 0, raw 24..103 spans 0..127, and raw 103..127 reads
   127. Twenty-four raw units is 1.7 cells - a cell is 128/9 = 14.22 - so the
   whole of cells 0 and 1 on each axis is already saturated and a finger a
   cell and a half in from a corner reads a FULL 127 on that macro and an
   exact 0 on the others. Before this, (10,10) read corner 1 at 107 and only
   the literal pixel (0,0) read 127. THE MARGIN RUNS ON THE RAW x AND y AFTER
   `Q`, deliberately: the trail cell is where the FINGER is, not where the
   mapping says it is, so the light under your hand stays under your hand.

3. THE TRAIL CELL COMES FROM `Q`, AT +6 (766 -> 772) - and this is the
   "random lighting in the middle". The comet was re-armed at a cell computed
   as x*9//128+y*9//128*9 on EVERY sample, and PROBE-RESULTS-2026-09-10.md Q2
   measured a motionless finger sending 71, 72, 71, 71, 71 - one raw unit of
   wobble, and 71*9//128 = 4 against 72*9//128 = 5. So a finger resting on a
   cell line re-armed two cells alternately at 100 Hz, which is what the
   middle of this pad looked like. `Q`'s per-axis hysteresis holds one cell,
   and it returns that cell only when the cell CHANGED, so the comet is armed
   once per cell entered.

WHY MORPH DOES NOT RETURN ON `Q`'S NIL, AND WHY THE RESEARCH IS WRONG HERE.
12-RESEARCH writes the caller as

    if i>0 then return end local c=Q(s,i,e,x,y)if not c then return end

and that shape WOULD FREEZE THIS CARD. `Q` returns nil when the cell has not
changed; MORPH's output is a bilinear blend of the RAW position, and a cell is
fourteen raw units wide, so every macro it owns keeps moving all the way
across one. Measured, as 12-09's negative check, by shipping that exact line:
a four-sample wobble inside one cell sent 4 messages instead of 16 - four on
the DOWN and NOTHING on the three MOVEs. So MORPH keeps its own end test
first, calls `Q` for the trail cell ALONE, sends its weights regardless, and
paints the comet only when `Q` returned a cell. (The wrong shape also costs
25 characters MORE, at 797, because the guard is not free.)

`Q` NOW SITS IN FRONT OF MORPH'S OWN END TEST, NOT BEHIND IT (plan 12.1-04),
and the reason is the finger below: `G` has to see a lift to clear the block
it drew, and `G` has to come AFTER `Q` (12.1-02's finding, in the finger
paragraph), so both moved in front of the end test together. What that
changes, stated rather than discovered: `Q`'s expiry path NOW RUNS for this
card - a lift or a code 3 reaches `E`, which drops the contact from `H` and
`T` and clears its block through `V`; until 12.1-04 a quiet contact kept its
`H` entry until the next onset, which expired it anyway. On live codes
nothing moved: an onset expires `H[i]` before the cell is read either way,
so the cell `Q` returns and the hysteresis it applies are the same as before.
MORPH still has no Timer and so no `X`; NOTHING IS HELD, so a stale entry
never cost anything and now does not exist. And because this card returns
for i > 0 before either call, the only contact the library ever tracks for
it is 0.

THE FINGER IS THE LIBRARY'S GRADIENT IN THE TRAIL COLOUR, ON LAYER 0 (plan
12.1-04; 12.1-CONTEXT D-11, D-13). `G(s,i,e,x,y,0,@TRAILC)` draws the
bilinear finger over the 2x2 block of LEDs around the calibrated position,
peak 255 dead on an LED, on layer 0 - the layer neither the corner blocks
(layer 1) nor the comet (layer 2) writes - and in the SAME colour as the
comet, so the finger and its trail read as one thing. The colour is the
entry's own knob token and not a new knob (D-13: a knob would move the shape
character). `G` RE-ASSERTS THE COLOUR ON EVERY CALL, which is the
alert-layer heal: layer 0 is the layer `grid_alert_all_set` recolours
(grid_led.h:7; a CONFIG write, a page discard, a refused page change, a TX
overflow, boot), so a finger coloured once at Setup would turn grey or
purple after a page switch. There is no floor - `glc(...,1)` forces the
layer's minimum to 0 - so a cleared block is dark and the card is still
black at rest (restsBlack stays true; frames.json did not move).

THE ORDER OF THE FIRST LINE IS THE WHOLE DESIGN, AND EACH PIECE HAS ITS
REASON:

    if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)
    if e==3 or e>=5 and e<9 then return end

  1. THE SINGLE-CONTACT RULE STAYS FIRST. A second finger is refused before
     `Q` or `G` sees it, so `B[1]` is never set, nothing is drawn for it, and
     there is nothing for a sweep to clear - the same rule as before, now
     split from the end-code test it used to share a line with. Measured in
     lua-smoke.spec.ts: a second contact pressed while the first is down
     lights nothing new on layer 0.
  2. `Q` BEFORE `G`, because `Q` calls `E` on every onset and `E` clears the
     contact's block through `V`: a `G` drawn before `Q` is wiped on the
     press that drew it. Plan 12.1-04's own interfaces block wrote `G`
     first; driven in wasmoon that shape lights NOTHING on a press and the
     finger appears only on the first move. Shipped `Q` first.
  3. `G` BEFORE THE END TEST, so an end code reaches it: `G` returns on
     `e~=1 and e~=4` after clearing the contact's previous block (a code 9
     draws nothing, 12.1-03), and `Q`'s `E` has already cleared it on the
     same lift - so the lift is clean by two paths, and the finger goes out
     when the finger does. Put `G` behind the end test with the old guard in
     front and a lift leaves the block lit forever, MORPH having no Timer to
     sweep it (the negative check the plan names).
  4. THE END TEST ITSELF IS UNCHANGED, `e==3 or e>=5 and e<9` (class B, plan
     11-02), and still keeps a code-9 fast tap for the weights below.

SAME CHARACTERS AS THE PLAN'S ORDER: 772 -> 814 (+42) at the picker corner
either way, so every figure the plan carries holds.

`D` IS NOT USED, AND THAT IS THE LIBRARY'S OWN ARITHMETIC RATHER THAN A
PREFERENCE. `D(n,l,w)` derives its timeout as `w//6` from a byte, so it
covers at most 42 ticks; @DECAY reaches 126. The inline pair below is the one
decay-idiom.spec.ts already reads, and it stays.

A CORNER SPEAKS ONLY WHEN THAT CORNER MOVED. self.p={0,0,0,0} holds the last
value sent for each of the four macros and the send is guarded on
z ~= s.p[j]. Before it, four CC messages left on EVERY accepted sample, at
100 Hz for as long as a finger moved: measured through the real Lua host, a
128-sample stroke along the top edge sent 512 messages and now sends 255, and
a jittering finger inside one cell sent 840 and now sends 450.

"DON'T SEND 0 VALUE" IS A READING OF THE USER'S WORDS AND IT IS WRITTEN HERE
AS ONE. The four weights are a bilinear corner split - w = {u*v//127,
x*v//127, u*y//127, x*y//127} with u = 127-x and v = 127-y - so at any EDGE
two of the four are exactly 0 and at any CORNER three are, and all four were
being sent regardless. The reading taken is: A CORNER THAT IS AT ZERO AND WAS
AT ZERO SENDS NOTHING, AND A CORNER THAT FALLS TO ZERO SENDS ZERO ONCE. The
zero-initialised table is what delivers both halves with one mechanism -
every corner is 0 at Setup, so a corner the finger is far from never speaks
at all; measured on a y = 0 stroke, the two bottom corners send exactly 0
messages over 128 samples.

THE ALTERNATIVE READING - never emit a 0 at all - WAS REJECTED, and the
reason is a worse bug than the one reported. The finger has to be able to
LEAVE a corner. Under the literal reading the receiver would hold the last
non-zero value of every corner the finger walked away from, forever, so a
slide from one corner to the opposite one would leave both macros up. The
top-left corner's single 0 at the end of a top-edge stroke is asserted by
name in lua-smoke.spec.ts, as is the fact that it is that corner's LAST word
rather than a value it passed through.

THE PAINT IS DELIBERATELY LEFT UNCONDITIONAL, from the same local z the send
is guarded on. A suppressed send with a suppressed repaint is one decision
and a suppressed send with a live repaint is another; this is the second,
because the picture is a READOUT and the wire is TRAFFIC. glp is a local
write with no bus behind it, so repainting a corner that has not moved costs
nothing and guarantees the picture cannot drift from the last value sent -
which is the failure mode a shared guard would have introduced.

s.p IS INDEXED BY CORNER, NOT BY CONTACT, and that was checked rather than
assumed: the callback's first words are "if i>0 then return end" (12.1-04
split the single-contact rule from the end-code test, which now follows the
two library calls), so this card is single-contact by construction. If that
guard ever moves, the table's key has to move with it.

THE TOKEN FOR THE TRAIL LENGTH IS @DECAY, NOT @TRAIL. renderLua substitutes
by plain string replacement, so a token that is a PREFIX of another token is
eaten or corrupted depending on knob order - "@TRAIL" inside "@TRAILC" would
render the colour as "42C". The trail-length knob therefore carries @DECAY.
Its knob id is still "trail"; only the substitution token moved.

THE HONEST LIMIT, for the card copy: single-contact by design. The callback
returns immediately for i > 0, because four fingers fighting over one blend
is noise rather than expression.

THE GUARD IS "e==3 or e>=5 and e<9", AND THE UPPER BOUND IS THE POINT
(plan 11-02, class B). Firmware coalesces a sub-cycle press-and-lift into ONE
message with event code 9 - a down AND an up, no separate DOWN and no
separate UP. Setup used to write "e>=5" bare, so a fast tap returned
early and the four macros never moved - 0 MIDI messages against 4 on a slow
press. MORPH HAS NO TIMER, so nothing was going to catch up later either.
src/lib/catalog/touch-guard.spec.ts holds the convention and gates it; the
event table itself lives in src/vendor/botor/pad-sim.ts:228-241 and in
zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated. +8
characters.

THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
by renderLua it is byte-identical to the canonical text measured against the
pinned minifier: a fixed point of compressScript and accepted by
checkSyntax. THE CORNER THE 908 GATE READS IS 814, leaving 94 free - under
the 890 BUDGET_ERROR line (_pad.ts:3076-3078) by 76 - and it is the RGB444
PICKER corner (D-06) rather than the all-longest corner of the declared
palettes - the two coincide here only because @TRAILC already declares
255,255,255, and plan 11-07 measured them 21 characters apart on CONSOLE.
At the defaults it is 810. It was 579 before plan 11-09.1's corner tap, 710
before plan 12-09's three edits and 772 before plan 12.1-04's finger, and
every figure is re-measured rather than inherited: 710 after the 3x3
corners (+0), 766 after the margin (+56), 772 after the library call (+6),
814 after the `G` call and the split end test (+42; @TRAILC now appears
TWICE, the comet's init loop and the finger, both substituted). Cheaper than
the pre-coloured shape D-11 replaced, because no 81-cell layer-0 colouring
was added to the init loop - `G` carries the colour.
src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```

## Change 9, 2026-09-18: the centre's value is a knob

Outside the GSD cycle, the user's word recorded in `BENCH-2026-09-16.txt` section 9: "Morph:
should be able to setup the value of the center." Asked what "the value of the center" sets, the
user answered **a** - a `Centre` knob holding the CC value each corner sends when the finger is
dead centre (today about 32, a quarter of 127), "the blend reshap[ing] around it so a corner still
reaches 127 under the finger and the others fall toward 0, with the centre landing on the chosen
value. Range and steps are the executor's to measure inside 908."

### The literal this change replaced, verbatim (814 at the RGB444 picker corner, 810 at the defaults)

```text
--[[@cb]]for a=0,80 do glc(a,2,@TRAILC,1)glp(a,2,0)end self.k={0,6,54,60}self.p={0,0,0,0}for j=0,3 do for d=0,8 do local a=glag(0,self.k[j+1]+d%3+d//3*9)glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)glp(a,1,0)end end self.touch_cb=function(s,i,e,x,y)if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)if e==3 or e>=5 and e<9 then return end local q=0 if e==4 or e>8 then for j=1,4 do for d=0,8 do if c==s.k[j]+d%3+d//3*9 then q=j end end end end x=glim((x-24)*127//79,0,127)y=glim((y-24)*127//79,0,127)local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do local z=w[j]if z~=s.p[j]and(q<1 or q==j)then s.p[j]=z s:gms(@CH,176,@CCB+j,z,0)end local b=s.k[j]for d=0,8 do glp(glag(0,b+d%3+d//3*9),1,z*2)end end if c then local a=glag(0,c)glpfs(a,2,252,256-252//@DECAY,0)glt(a,2,@DECAY)end end
```

The whole change is one insertion into that string, between reading the weight and testing it -
nothing else in the Setup moved, and the Timer is still the empty string:

```text
local z=w[j]z=z<32 and z*@CENTRE//32 or @CENTRE+(z-32)*(127-@CENTRE)//95 if z~=s.p[j]
```

### WHAT THE KNOB SHAPES IS THE OUTPUT, NOT THE BLEND - and it is the only reading available

The brief asked that "the weights' sum" survive. It cannot survive as a blend: four weights
summing to 127 with an arbitrary value in the middle is a contradiction, because dead centre every
weight is the same number and four of the same number sum to four times it. So the reading taken,
stated rather than discovered: `w = {u*v//127, x*v//127, u*y//127, x*y//127}` IS UNTOUCHED and
still sums to the full range; the knob is a map applied to each weight on its way out. Every other
clause of the card therefore survives by construction - the corner tap, the per-corner
suppression, the dead margin, the comet, the single-contact rule - because not one of them reads a
weight after this line.

### THE MAP, AND THE TWO FORMS THAT LOST

The requirement is three points and a shape: `f(0) = 0` (the opposite corner stays silent),
`f(127) = 127` (a corner is still full under the finger), `f(32) = C` (32 is the weight a finger
reads dead centre), and monotone in between. Every figure below is measured under the pinned
`compressScript` after `padReady()` at the RGB444 picker corner (`@TRAILC` at 255,255,255, every
other knob its longest literal), each string a fixed point passing `checkSyntax`:

- **CHOSEN - two linear segments, breakpoint 32:**
  `z=z<32 and z*@CENTRE//32 or @CENTRE+(z-32)*(127-@CENTRE)//95`. **+46** characters rendered
  (814 -> **860**, 48 free; 810 -> 856 at the defaults). Monotone at every knob position; 128
  distinct output values at the default, 112 at 16, 96 at 0 and at 64, 64 at 96.
- **REJECTED - one multiply and a clamp:** `z=glim(z*@CENTRE//32,0,127)`. **+23** characters, half
  the price, and rejected by measurement twice over. First, it cannot express a centre BELOW 32 at
  all: at 16 a corner reaches only `min(127, 127*16//32)` = 63, so the bench's own clause - 127
  under the finger - fails at every position that makes the middle quieter, which is half the
  feature. Second, above 32 it saturates early: at 64 the macro reads 127 from weight 64 onward
  (65 distinct values), at 96 from weight 43 (44 distinct), so the outer half of the travel toward
  a corner stops moving. The chosen form keeps the whole travel at every position.
- **REJECTED - the branchless pair:** `z=@CENTRE*glim(z,0,32)//32+(127-@CENTRE)*glim(z-32,0,95)//95`
  is the same map as the chosen one at every one of the 128 weights and costs **+51**. Its only
  merit is having no `and`/`or` to misread (see the trap below), and that is worth a comment rather
  than five characters.

**THE BUDGET NEEDED NO SECOND SLOT.** 860 of 908 at the picker corner leaves 48 free and sits 30
under the 890 `BUDGET_ERROR` line (`_pad.ts:3076-3078`); the Timer is still the empty string with
908 free and was not touched, so the `self:tim()` pattern was not needed; and the system slots -
the user's stated last resort, section 7 of the record - were not approached. `@CENTRE`'s longest
offered literal is two characters, the same length as the default's, so the picker corner does not
move with the knob: 857 at `0`, 860 at every other position, 853 / 856 at the defaults.

### THE DEFAULT IS THE EXACT INTEGER IDENTITY, WHICH IS WHY NOTHING MOVED ON THE WIRE

At `@CENTRE` = 32 the low segment is `z*32//32` and the high one `32+(z-32)*95//95`, and both are
`z` for every integer 0..127 - asserted over all 128 weights in `lua-smoke.spec.ts` rather than
sampled. The consequence is the strongest proof this change has, and it is a test that was already
there: **the pinned `DIAGONAL_MORPH` literal in the corner-tap test - a 120-message capture of a
centre-to-corner stroke, taken at plan 12-09 - is UNMOVED**, and so are `frames.json`, the golden
frames and MORPH's OG image. At its defaults the card is byte-identical in behaviour; only its
Setup string is 46 characters longer.

### THE FIVE POSITIONS, AND THE ONE THAT IS NOT OFFERED

`0, 16, 32, 64, 96`, default index 2 (the 32). Measured in the real Lua host with a finger on the
raw point the card's own dead margin calls dead centre, where the four weights are 31, 31, 31, 32 -
integer division's own one-unit split, the card's arithmetic since 11-08:

| `Centre` | dead centre       | distinct values over the travel | the corner | the opposite corner |
| -------: | ----------------- | ------------------------------: | ---------: | ------------------: |
|        0 | silent            |                              96 |        127 |              silent |
|       16 | 15 / 15 / 15 / 16 |                             112 |        127 |              silent |
|   **32** | 31 / 31 / 31 / 32 |                         **128** |        127 |              silent |
|       64 | 62 / 62 / 62 / 64 |                              96 |        127 |              silent |
|       96 | 93 / 93 / 93 / 96 |                              64 |        127 |              silent |

Three corners land `C//32` under the knob's value and the fourth lands on it exactly, because the
breakpoint is 32 and the weights there are 31, 31, 31, 32. Moving the breakpoint to 31 would put
all four on `C` exactly - and would cost the identity at the default, since `f(31)` would become
32 and the pinned stroke above would move. The identity was worth more than the unit.

**127 IS NOT OFFERED, AND THE REJECTION IS ARITHMETIC.** At `@CENTRE` = 127 the second segment is
`127+(z-32)*0//95`, so every weight at or above 32 reads 127: **33 distinct values over the whole
travel against 128 at the default**, a 95-step plateau, and each macro pinned full across the
whole quadrant nearest its corner. The knob would stop being a control at its own top position. 96
is the highest position that keeps the card playable (64 distinct values), and both figures are
asserted in `lua-smoke.spec.ts` so the rejection cannot rot.

**A CENTRE OF 0 IS KEPT, AND IT IS HONEST RATHER THAN STUCK.** At 0 the middle of the pad is
silent: every weight under 32 maps to 0, `self.p` starts at zeros, so a press dead centre sends
nothing at all and the four corner blocks are black. Nothing is stranded by it - a corner the
finger walks away from still sends its single 0 on the way out (11-08's reading, asserted by name
in the stroke test), so a receiver ends at 0 rather than holding a stale value. What it buys is
four gated quadrant macros: a corner opens only as the finger moves into its half. The question is
put to the user in the record all the same.

### THE BRIGHTNESS FOLLOWS THE VALUE SENT, NOT THE RAW WEIGHT

`glp(glag(0,b+d%3+d//3*9),1,z*2)` reads the SHAPED `z`, because `z` is reassigned before both the
send and the paint - so the picture on the pad is what the DAW hears, which is the decision 11-08
took when it left the paint unconditional ("the picture is a READOUT and the wire is TRAFFIC").
The alternative, painting the raw weight, would leave a pad at `@CENTRE` = 0 showing four dim
corners in the middle while sending nothing, which is the one thing a readout exists to prevent.
Every one of the nine cells of every corner block is asserted at phase `2*z` in
`lua-smoke.spec.ts`.

### THE TRAP A READER WILL BRING WITH THEM

`z<32 and z*0//32 or @CENTRE+...` still takes the FIRST arm at `@CENTRE` = 0, because Lua's only
false values are `nil` and `false` and `0` is a number. A reader arriving from JavaScript or
Python will expect that branch to be broken, and the branchless form above exists mostly as
evidence that it is not. `@CENTRE` also APPEARS THREE TIMES - once in each segment and once in the
second segment's slope - which is a `renderLua` hazard of the same family as `@SPREAD`'s two
sites; both facts are in the entry's TRAPS.

### THE PRICE: EVERY SHARED MORPH LINK MINTED BEFORE TODAY

The knob is the SIXTH and is APPENDED, which is the house rule (TUNE-01's Phase 11 gate qualifier:
"every knob added or re-cut kept its arity or appended, never inserted"). A stamp's payload length
and its shape character both move all the same: format `w`'s payload goes from 9 characters to 10
(`2`, plus 3 for the colour knob, plus 1 per other knob), and `shapeOf` from `(5*7 + 34) % 32` to
`(6*7 + 39) % 32`. The LENGTH check fires first, so an older MORPH link lands **unreadable** - not
`older`, and never `restored` with five indices read into six knobs - and the workspace opens the
card as it ships, at the default centre, which is the card those links described anyway.
`stamp.spec.ts` declares it by name beside ARC's (change 6) and POMODORO's `older` (11-09); the
wild-stamp fixture is not regenerated.

### WHAT WAS NOT TOUCHED

`brightness.ts` gains no declaration: the change adds no colour argument and no palette - the one
new arithmetic form sits on a PHASE, which the scaler never touches - and the coverage gate finds
nothing unreachable over the widened cross-product (MORPH's sampled states 34 -> 39, the catalog's
525 -> 530). `library.ts`, `sequence.ts`, `src/vendor/`, the manifest, `Knob.svelte`,
`ColourPicker.svelte` and every other entry are untouched; `frames.json`, the golden frames, the
preset baseline and the OG images are byte-identical, because MORPH rests black and its default
behaviour did not move.
