# SONAR - the history behind src/lib/catalog/entries/sonar.ts

SONAR is the radial sixteen-step sequencer: a sweep turns through sixteen angle buckets and fires
the cells a tap or a swipe armed, the ring the pitch and the angle the time. Its source is
`src/lib/catalog/entries/sonar.ts`. 11-02 fixed the sweep's decay landing; 11-08 reversed the
onset-only guard so a swipe arms every cell, lit the centre on layer 0 and read the bench's three
clauses; 12-08 handed the inlined cell guard to the library's `Q` and added `X(s,20)`; 12.1-03
added the library's finger and the `R` that re-lights the centre (469 to 572 at the picker
corner). The entry's own header now carries the mechanism, the wire and the traps; everything the
header said before 13.2-02 - the measurements, the readings of "notes should disappear", the clock
sync gates and the budget ladder - is below, verbatim.

## Moved from src/lib/catalog/entries/sonar.ts on 2026-09-13 (13.2-02)

```text
SONAR - a radial 16-step sequencer, five voices deep.

A polar sequencer. A sweep line rotates through 16 angle buckets, once every
1.12 s at the default period; tap any cell to arm it, and it fires when the
sweep crosses it. The pitch comes from the cell's RING - its Chebyshev
distance from the centre - and the time from its ANGLE, so the pad is a
16-step, 5-voice grid in polar coordinates: inner rings low, outer rings
high, minor pentatonic by default. Nothing else on a desk sequences in a
circle.

The angle buckets come from EXACTLY the same math.atan(...)*41//1%256
expression the vendored Pinwheel look uses, divided by 16, so the sweep's
step boundaries line up with the swirl's own phase geometry rather than with
a second, subtly different polar map.

PENDING NOTE-OFFS ARE TRACKED, which is what stops a hung track. Every note
the Timer starts goes into s.z, and the FOLLOWING fire releases the whole
list before it plays anything new. There is no watchdog because there is no
contact to watch: the notes are machine-driven, one step long by
construction.

THIS TIMER IS THE CANONICAL TEXT, NOT THE ONE PRINTED IN 08-RESEARCH.md.
The research prints "if s.v[n] then"; the pinned minifier emits
"if s.v[n]then" with no space, 280 raw characters collapsing to 279. Storing
the printed form would fail the canonical-form gate on its first run for a
reason that has nothing to do with the configuration. The form below is what
compressScript produces and is a fixed point of it.

THE TOKEN FOR THE SWEEP PERIOD IS @PERIOD, NOT @SWEEP. renderLua substitutes
by plain string replacement, so a token that is a PREFIX of another token is
eaten or corrupted depending on knob order - "@SWEEP" inside "@SWEEPC" would
render the colour as "70C" - and lua-entries.sweep.spec.ts's per-event occurrence
count would see two @SWEEP sites in the Setup where the knob only moves one.
The period knob therefore carries @PERIOD. Its knob id is still "sweep";
only the substitution token moved.

THE PERIOD APPEARS IN BOTH EVENTS and both must move together: the Setup arms
the first fire and the Timer re-arms every subsequent one, so a mismatch
would tick once at one rate and then forever at another.

A SWIPE ARMS EVERY CELL IT CROSSES, AND THE ONSET-ONLY GUARD IS DELIBERATELY
REVERSED (plan 11-08). The callback opened with "e~=4 and e~=9 then return",
so every MOVE was thrown away at the first line: measured through the real
Lua host, a 128-sample swipe along row 4 armed exactly 1 cell, the one the
finger landed on. That is the bench note "not precise enough". It now arms
all nine.

ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT. A MOVE
arrives every 10 ms, so a finger resting inside one cell would arm and disarm
it at 100 Hz - measured unguarded at 209 changes over 209 further samples.
The dedup remembers the pad cell the contact last touched and swallows a
repeat, and a contact end clears it so a fresh press on the same cell is not
eaten.

---------------------------------------------------------------------------
THE DEDUP IS NO LONGER THIS ENTRY'S TO WRITE, AND SONAR WAS RE-FITTED WITH
THE THREE ENTRIES THE BENCH NAMED RATHER THAN BECAUSE IT WAS NAMED
(plan 12-08)
---------------------------------------------------------------------------

THIS ENTRY CARRIED EUCLID'S AND RADAR POINTS' INLINED GUARD CHARACTER FOR
CHARACTER, and the bench round that produced "EUCLID: still not precise",
"STEPS: same as the other sequencers" and "RADAR POINTS: needs the touch
detection framework" did not mention SONAR. The guard did not care: the same
126 characters were here, doing the same thing, with the same defect. The
plan-check that found it re-fitted four entries instead of three. THE DEFECT
IS WORSE ON A TOGGLE THAN ON AN ARM, which is what this entry and RADAR
POINTS are: `s.v[n]=not s.v[n]` run an EVEN number of times leaves the cell
exactly as it was, so a boundary finger could arm a cell and silently disarm
it again while every count in a test looked right. The test that pins this
asserts the cell's FINAL STATE is on, not just that one arm happened.

THE BOUNDARY BETWEEN TWO CELLS IS ONE UNIT WIDE. `71*9//128 = 4` and
`72*9//128 = 5`, and PROBE-RESULTS-2026-09-10.md Q2 recorded a MOTIONLESS
finger sending 71, 72, 71, 71, 71 - a one-unit wobble flips the cell, so a
finger anywhere near an edge is read as alternating taps on two cells.

THE FIX IS HYSTERESIS AND IT LIVES IN THE LIBRARY. `Q(s,i,e,x,y)` in
src/lib/catalog/library.ts holds a contact's cell until the finger leaves it
by 45/64 of the local LED pitch (since 12.1 the band is a fraction of the
pitch, not a width; 12.1-CONTEXT D-18) and returns a cell only when it
changed. The end test, the onset test and the dedup are all inside it, so
this callback's whole guard is `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)
R(s,i)if not n then return end` and `self.q={}` is gone. Re-testing `e`
here would be doing the library's job twice.

---------------------------------------------------------------------------
THE FINGER IS DRAWN WHERE IT IS, AND THE CENTRE SURVIVES IT ON EVERY PATH
(plan 12.1-03; 12.1-CONTEXT D-11, D-13, D-15) - RADAR POINTS' PARAGRAPH,
CHARACTER FOR CHARACTER IN THE LUA
---------------------------------------------------------------------------

`G(s,i,e,x,y,0,@SWEEPC)` after `Q`: the library's bilinear finger on LAYER
0 in the sweep's own colour - the entry's colour where it has one (D-13), a
literal rather than a new knob. Dead on an LED that LED alone at peak;
between two both dimly; in the middle of four all four. And since 12.1 the
cell `Q` returns IS the LED under the finger, because `Q` and `G` both read
the MEASURED sensor map (calibration.ts) through `U`, so the cell armed and
the light agree by construction - the bench case (row 1, column 7
zero-based) arms cell 16 where the naive divisor lit the corner.

`Q` FIRST, THEN `G` (12.1-02's finding): on an onset `Q` expires the contact
itself, which reaches `E` and clears the block in `B[i]` through `V`; with
`G` written first that is the block `G` just drew, and a still finger reads
dark until its first MOVE. Same characters either way.

THE CENTRE DOT IS ON LAYER 0 TOO (the paragraph below), AND `G` AND `V` NOW
WRITE THAT LAYER. A finger passing over cell 40 puts it in `G`'s 2x2 block,
at a weight that can be 0, and every clear of that block through `V` writes
phase 0 to it - under `G` in this callback and on EVERY EXPIRY through `E`
(the Timer's `X(s,20)` sweep of a contact that went quiet, a lost-lift
re-press by the same id, another contact landing on the held cell), where
the plan-check found the re-light missing. So this entry defines the
library's release convention, `R=function(s,i)local a=glag(0,40)glc(a,0,
@SWEEPC,1)glp(a,0,255)end`, at the head of the Setup; `E` calls it AFTER
`V` on every expiry path and the callback calls it after `G`. Idempotent,
as `R` must be (`Q` calls `E` on a contact's FIRST press too), and it
RE-COLOURS as well as re-lights, so an alert cannot take the marker's colour
either. The init-loop `local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)`
stays: it is the rest picture, and `R` is what puts it back.
lua-smoke.spec.ts drives both expiry paths over cell 40 and asserts 40 at
255 in @SWEEPC after each.

LAYER 0 IS THE FIRMWARE'S ALERT LAYER (grid_led.h:7), which is why neither
the finger nor the marker is coloured once and left: grid_alert_all_set
rewrites layer 0's colour on every LED on a CONFIG write, on page-discard
completion, on a refused page change, on a TX overflow and at boot. `G`
re-asserts @SWEEPC on each of its four cells on every call and `R` on cell
40 on every expiry and after every `G`, so the exposure is one flash and a
tint that heals on the next sample - audition row 25(j) asks the bench to
see it. No floor: `glc(...,1)` forces the layer's minimum to 0, so a cell
`V` clears is dark and the dark pad is as dark as it was.

COST: +103 on the Setup, 469 -> 572 at the picker corner (the `R`
definition 71 with its trailing space, the `G` call 26, the `R` call 6),
nothing on the Timer; the map itself cost this entry nothing.

PHASE 11 READ "NOT PRECISE" AS FAST-TAP LOSS, AND THAT READING WAS CORRECT
FOR THE FIRMWARE AND WAS NOT THE COMPLAINT. Code 9 is a real coalesced
press-and-lift and 11-08's `e<9 and n` store was a real fix for it - measured
on the bare shape, three fast taps read 0 -> 255 -> 255 -> 255. But Q3 tapped
ten times as fast as a hand can and NOT ONE arrived as a 9. The fix stays (it
is `H[i]=e<9 and n` inside `Q` now), it is harmless, and it was never the
complaint.

AND A LOST LIFT IS REACHED BY `X`, NOT BY `Q` (Q6.5, Q7). `Q`'s expiry rules
need A PRESS - the same id pressing again, or another contact landing on the
held cell. Q6.5 recorded four of five contacts never sending their code 5
after a five-finger chord, and Q7 a palm leaving phantoms; a contact that
goes quiet and is NEVER PRESSED AGAIN holds its cell for the rest of the
session and every future press by that id is measured against it. Only the
Timer-side sweep reaches it, so the Timer calls `X(s,20)` - seven characters
after the `local s=self` it already opens with, which is cheaper than the ten
`X(self,20)` would cost in front of that line. TWENTY CALLS IS AN INTERVAL,
NOT A DURATION: at @PERIOD's default of 70 ms it is 1.4 s, and across the
knob it runs 0.8 s (40 ms) to 3.2 s (160 ms) - the shortest window of the
four re-fitted entries, because this is the fastest sweep. It is a starting
value the bench row in plan 12-12 may move, and it is safe to ship unbenched
because this entry holds no note per contact: an early expiry forgets a stale
cell, it does not cut a note.

WHAT THIS ENTRY TAKES FROM THE LIBRARY BESIDES `Q` AND `X`, AND WHAT IT
DOES NOT. IT DEFINES `R` SINCE 12.1-03 - not for a note (an expiry here has
nothing to release) but for the centre marker on layer 0, which every block
clear can take away (the 12.1-03 paragraph above); 12-08's "NOT `R`" stood
while nothing but the init loop wrote layer 0. NOT `F` - a "light the
finger's cell" helper DOES NOT EXIST: it shipped in the planner's sketch
with no caller and 12-07 dropped it. Its job is `G`'s since 12.1-03: until
then a cell toggling under the finger was the only feedback, and the bench
said it was not enough. src/lib/catalog/touch-guard.spec.ts holds the
event-code convention and knows this body delegates.

WHAT THE REVERSAL COSTS: a swipe that crosses a cell twice toggles it twice,
so dragging back over your own stroke erases it. That is correct for a toggle
and it is not what a paint gesture does; the set-rather-than-toggle
alternative is named as an open bench question in euclid.ts rather than
shipped as an interpretation.

THE CENTRE IS ALWAYS LIT, ON LAYER 0, AND THE LAYER IS THE WHOLE POINT
(plan 11-08). Cell 40 is the sweep's own pivot and it used to be the one
cell on the pad with nothing to say. Setup now writes it in @SWEEPC on LAYER
0, which NEITHER the sweep nor the arming touch writes: the Timer writes
layer 2 and armed cells are layer 1. (Since 12.1-03 the library's finger is
drawn on layer 0 as well, and the centre survives it because `R` re-lights
it after every `G` and every clear - the 12.1-03 paragraph above.)
Layer 1 would have been erased by the
first tap on the centre. LAYER 2 IS THE INTERESTING WRONG ANSWER, because it
looks right twice - the hub is lit at rest and lit under the sweep - and then
the sweep's 42-tick decay runs it down to black with nothing to put it back;
measured on that plant, [0,0,0] sixty ticks after the pass. On layer 0 the
centre reads [59,126,126] at rest, [116,248,248] with the sweep on top of it
because the LED engine ADDS layers, and [59,126,126] again once the trail
expires. Cost: +52 characters, and +0 at the picker corner over a hard-coded
white, since a colour token and 255,255,255 are the same eleven characters
there.

"NOTES SHOULD DISAPPEAR AFTER A WHILE" DESCRIBES SOMETHING THIS CARD ALREADY
DOES, and that is reported rather than answered with a change. Of the two
honest readings - a missing or mistimed note-off, or a note length that wants
a shorter constant - the source supports the SECOND, and the constant is
already at its floor. Every note the Timer starts goes into s.z and the
FOLLOWING fire releases the whole list before playing anything: measured
through the real Lua host at the defaults, three notes fired and three
released, every one of them exactly 7 ticks later, which is one @PERIOD, and
nothing left open after 400 ticks. One step is also the shortest gate this
card can express, because it has one timer and its resolution IS one step.
There is no constant to shorten and no bug to fix, so nothing was changed and
the behaviour is now pinned by an assertion instead.

THE THIRD READING IS A REAL DESIGN QUESTION AND IT IS LEFT AS ONE. The words
could instead mean that the ARMED CELLS should fade, so a pattern you drew
decays on its own. That is a much larger behaviour change - 81 per-cell
countdowns with no spare table and no Timer budget for a second sweep of the
grid - it is not what "notes should disappear" most naturally says, and it is
MORE attractive after plan 11-08 than before it, because a swipe now arms
nine cells where a tap armed one. It is a bench question, not a guess.

CLOCK SYNC IS NOT BUILT, AND IT IS NAMED HERE RATHER THAN DROPPED. The bench
asked to "include synchronization, clock sync"; two gates are shut and the
second does not open when the first does. FIRST, the hardware answer is
unknown: docs/MIDI-IN-PROBE.md is a written, minifier-checked pair of probe
scripts for exactly this question whose Results section reads "None yet. This
probe has not been run", and since gts is dead on ZONA and rtmrx_cb is the
only clock route the hardware has, a NO on that probe CLOSES this family
rather than redirecting it. SECOND, even a yes leaves the card
UNPREVIEWABLE: HANGAR's Lua host has no inbound MIDI path of any kind - grxm
is a recorded no-op that discards its slot argument, and neither midirx_cb
nor rtmrx_cb is ASSIGNED or BOUND anywhere under src/, in a host binding or
in a catalog entry's Lua, which is the grep that proves nothing here was
stubbed - so a clock-locked SONAR would run on a real ZONA and sit
motionless in its own catalog card. The prerequisite is a synthetic MIDI
source and a synthetic clock in src/lib/sim/, which is a phase and not a
task. Nothing here is stubbed, flagged or reserved against an answer nobody
has: a knob held back "for later" is a stamp slot, and a stamp slot spent on
a feature that may never exist is a link format nobody can take back.

THE HONEST LIMIT, for the card copy: cells on the same ring share a pitch.
That is the point rather than a compromise - ring is voice, angle is time.

THE SWEEP'S DECAY PAIR IS THE HOUSE IDIOM AND MUST STAY THAT WAY (11-02).
It shipped glpfs(a,2,255,250,0) with glt(a,2,42), and that pair can NEVER
land on phase 0: glpfs walks the phase with `pha += fre` on a uint8_t, 255 is
odd, the step 256 - 250 = 6 is even, so 255 - 6T is odd at every T and never
reaches zero. Every cell the sweep touched froze part-way down and stayed
permanently, faintly lit with nothing coming back to clear it.

It now writes glpfs(a,2,252,250,0) - the same idiom at T = 42, since the step
is 6, 6 x 42 = 252 and 252 - 252 = 0 exactly. THE TIMEOUT DID NOT MOVE,
deliberately: the trail is the same 420 ms it always was and only the
starting phase changed. Cost: +0 characters.

AND THE RESIDUE WAS NOT INVISIBLE HERE, contrary to what 11-02 predicted.
frames.json, which records an UNTOUCHED run, went 194 -> 96 lit bytes at tick
500 and 188 -> 78 at tick 1009. Roughly half the pad was permanent glow left
behind by the sweep's own Timer, on a card nobody had to touch.

src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
list of usable timeouts, and it is CITED here rather than restated.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 571 characters, Timer 286, both fixed
points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
GATE READS IS 572 / 289, leaving 336 free on the Setup and 619 on the Timer
(plan 12.1-03: +103 on the Setup for `R`, the `G` call and the `R` call,
468 / 469 before it, re-measured in this tree under the pinned
compressScript; plan 12-08 before that: -90 on the Setup where the inlined
guard left for the library, +7 on the Timer where `X(s,20)` arrived), and
it is the RGB444 PICKER corner
(D-06) rather than the all-longest corner of the declared palettes - the two
coincide here only because @SWEEPC already declares 255,255,255, and plan
11-07 measured them 21 characters apart on CONSOLE. src/lib/catalog/
lua-entries.sweep.spec.ts asserts every one of those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```

## Change 17B, 2026-09-23: the Sequence output; a received note arms a cell on the sweep line (`BENCH-2026-09-16.txt` sections 17 and 18)

SONAR sends one stream - every armed cell's note as the sweep crosses it, released on the next fire - so it is one
output, "Sequence", a trigger, with Type (Note / CC), Channel and Receive.

- **Knobs.** `@TYPE` (`midiType`) and `@RX` (`midiReceive`, On) appended; `@CH` (`channel`, already all sixteen) the
  Channel, reading 1..16. **No Number**: a cell's pitch is its ring's, from `@ROOT` and `@RINGS`. Seven knobs, four
  outside the output. SONAR's captured wild stamp lands `unreadable` (a grown rack) where it landed `restored`.
- **The send.** Note-on `s:gms(@CH,@TYPE,m,100)`, the release `s:gms(@CH,@TYPE*3//2-88,m,0)`. At the defaults the wire
  is SONAR's before the change, message for message.
- **The receive.** A host note-on (a controller above 0 under CC) on the output's type and channel ARMS ONE CELL on
  the sweep line - the bucket the last fire swept, `(s.k-1)%16` - whose ring's pitch is the received number, and
  lights it: live step recording, ORBIT's rule for a polar grid. One cell, not every cell of that ring on the line (the
  outer rings hold two in a bucket, which would sound the pitch twice); if a cell of that pitch on the line is already
  armed, nothing - so SONAR's own notes echoed back by a DAW's MIDI thru change nothing. Nothing is ever cleared; a
  note-off, velocity 0, another channel, another pitch do nothing; nothing is sent. The Setup first held the callback
  and went to 917 (over by nine); the TIMER makes it once per install (`s.j`) and the Setup assigns
  `self.midirx_cb=nil` - ARC's and ORBIT's route.
- **Latch: swipe by design** - a finger swiped across the field arms or disarms a cell per cell it crosses (`Q`'s change
  signal), the placing gesture (lua-smoke.spec.ts "arms one cell per cell a swipe crosses").
- **Cost:** Setup 571 / 572 -> 590 / 591 (defaults / corner), Timer 286 / 289 -> 664 / 668 (240 free). frames.json and
  the OG image unmoved.
- **Proved.** `lua-smoke.spec.ts` "SONAR: the Sequence output ...": no callback before the first Timer call over a
  previous landing's; five mismatches arm nothing; ring 2's pitch (41 at the defaults) arms exactly one cell, on ring
  2, freshly swept, the echo arms nothing more, a receive sends nothing, and a revolution later the cell plays 41 on
  channel 0; a tapped cell as controller 41 on wire channel 3 (100 then 0); Receive Off arms nothing.
