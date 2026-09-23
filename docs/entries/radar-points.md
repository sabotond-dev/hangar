# RADAR POINTS - the history behind src/lib/catalog/entries/radar-points.ts

RADAR POINTS is the ping that rolls out from the centre and plays the points a tap placed: the
ring is the time, the compass direction the pitch, SONAR's mechanism reused openly with the
geometry flipped. Its source is `src/lib/catalog/entries/radar-points.ts`. 11-14 authored it as
a second card beside the ported RADAR preset on the user's "new-entry" answer; 12-08 handed the
inlined cell guard to the library's `Q` and added `X(s,20)`; 12.1-03 added the library's finger and
the `R` that re-lights the centre (489 to 592). The entry's own header now carries the mechanism,
the wire and the traps; everything the header said before 13.2-02 - the ask, the D-03 reuse list,
the budget tables and the probe findings - is below, verbatim.

## Moved from src/lib/catalog/entries/radar-points.ts on 2026-09-13 (13.2-02)

```text
RADAR POINTS - a ping rolls out from the centre, and the points you placed
sound as it passes over them.

THE ASK, VERBATIM, from the bench: "should act like a radar, should send
note on note off when the sonar wave hits a LED point which a user can add
or remove, multiple active points".

---------------------------------------------------------------------------
WHY THIS IS A SECOND CARD AND NOT THE RADAR PRESET REWRITTEN
---------------------------------------------------------------------------

The catalog already has a RADAR - the ported preset, ring position 5 of the
front door, "Rings roll out from the centre, and the pad sends your finger's
position". It is a compiler-driven card whose ripple look plus xy sends
cannot express user-placed points at all, so the ask means hand-authored
Lua, and a hand-authored card cannot sit in the front-door ring: the ring
requires preview === "padsim" (front-door.spec.ts), and 11-14-HANDOVER.md
measured that the rule is LIVE for a reason nobody wrote beside it -
Coverflow.svelte builds an engine for every ring entry, so a "lua" entry on
the front page puts 271 KB of Lua VM on its first paint, which
e2e/tuning.e2e.ts forbids in words. Plan 11-14 put the four ways out to the
user and the answer was "new-entry": the preset stays exactly where it is,
and this card carries the ask. The id is the plan's placeholder, descriptive
of the ask - points - and the user may rename it.

---------------------------------------------------------------------------
D-03 BINDS THIS FILE IN BOTH DIRECTIONS, AND SONAR IS REUSED OPENLY
---------------------------------------------------------------------------

SONAR already does every clause of the ask except the word "radar": a sweep,
cells a tap arms and disarms, any number of them, a note-on when the sweep
crosses each and a note-off on the following step. D-03 says both get built
and the overlap is accepted, and it says the planner may not quietly
differentiate them to tidy the catalog. So this card does not re-derive any
of SONAR's decisions. TAKEN FROM sonar.ts VERBATIM, and named here so the
reuse is a statement rather than a resemblance:

  - the arming callback, character for character: since plan 12.1-03 that
    is `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return
    end` - `Q`, the one call that replaced the blessed live filter, the
    per-contact last-cell guard and the fast-tap escape store (all three of
    which moved intact into src/lib/catalog/library.ts in 12-08 and gained
    hysteresis on the way), then `G` drawing the finger, then `R` re-lighting
    the centre. The reuse is still character for character, and both
    entries were re-fitted in the same plan each time for that reason;
  - the `R` at the head of the Setup, character for character (the 12.1-03
    paragraph below);
  - the layer split: armed cells on layer 1 in a fixed pink, the wave on
    layer 2 in @SWEEPC, and the centre on layer 0 in @SWEEPC, always lit.
    Until 12.1 layer 0 was the one layer neither the wave nor a touch wrote
    (11-08's measured reason); since 12.1-03 the finger is drawn there too,
    and the centre survives it because `R` re-lights it (below);
  - the pending list s.z: every note the Timer starts goes into it and the
    FOLLOWING fire releases the whole list before it plays anything, so a
    note is exactly one step long and nothing can hang;
  - the wave's decay pair `glpfs(a,2,252,250,0)glt(a,2,42)`, the house
    idiom 11-02 rescued - a step of 6 from 252 lands on phase 0 at T = 42
    exactly, so no cell the wave touched stays faintly lit for ever;
  - the rack: a scale table, a root, the wave colour, the wave period and a
    MIDI channel, at the same value counts, and the @PERIOD token name with
    its prefix-hazard reason.

THE ONE DIFFERENCE IS GEOMETRIC AND IT IS THE ONE THE TWO NAMES IMPLY. SONAR
sweeps an ANGLE: sixteen wedges, one per step, turning. A radar ping is a
RING rolling out from the centre: five rings, one per step, expanding. So
self.a[n] - the step at which cell n is crossed - is the cell's Chebyshev
distance from the centre here, where SONAR's is its angle bucket.

AND THAT FORCES THE PITCH MAP TO FLIP, WHICH IS A CONSEQUENCE AND NOT A
SECOND DIFFERENCE. A cell has two polar coordinates. SONAR spends the angle
on time, so its ring is the pitch; this card spends the ring on time, so the
angle is the pitch: eight compass directions, b in 0..7, WALKING the scale
table and wrapping an octave - `t[b%#t+1]+b//#t*12` - so a seven-note mode
puts its octave on the eighth direction and a five-note set climbs into its
second octave on the sixth. Ring 1 has exactly eight cells and they land one
per direction, so the eight cells around the emitter are the scale in order,
east first. The table is NOT indexed straight by direction, and that is a
gate rather than a taste: the tune panel names every `scale` value from
view.ts's SCALE_WORDS - semitone SETS with mode names - and view.spec.ts
derives its check from the catalog, so an eight-entry table invented for
eight directions was red on the first full run and was replaced by the
walk. No other distinction is taken.

THE HALF-BUCKET OFFSET IS MEASURED, NOT DECORATIVE. The angle expression is
the vendored Pinwheel's own `math.atan(y,x)*41//1%256`, which SONAR divides
by 16; dividing by 32 straight off puts every bucket EDGE on a compass
direction, and the floor of a negative angle then tips a diagonal cell into
the bucket beside it. Checked over all 81 cells before a line was authored:
cells 30 and 39 both read bucket 4 and bucket 7 held six cells. Adding 16
before the modulo centres every bucket on its direction - `(...*41//1+16)
%256//32` - and ring 1 then reads one cell per bucket, 0 to 7. Three
characters.

---------------------------------------------------------------------------
THE WAVE HAS EIGHT STEPS AND THE PAD HAS FIVE RINGS, AND THAT IS THE BOUNDARY
---------------------------------------------------------------------------

k counts 0..7. Rings 0..4 are crossed on steps 0..4; on steps 5, 6 and 7 the
ring has LEFT THE PAD and the Timer's `if s.a[n]==k` matches nothing. That
is the radius exceeding the pad, and it is handled by a comparison that
fails rather than by an index that goes out of range: k is NEVER used as a
table index, only compared against a distance that is 0..4 by construction.
The silence is also the ping - three quiet steps and then the next pulse
from the centre - and it is what lets the wave read as a ring rather than as
a permanent glow: the trail is 42 ticks and at the default 140 ms step that
is three steps of fade, so `%5` would have kept the whole pad lit at all
times. `%8` is the same character count as `%5`.

WHAT REACHES THE WIRE, CHECKED FOR SIGN AND RANGE: note-on 144 with pitch
@ROOT + t[b%#t+1] + 12*(b//#t) - at most 60 + 5 + 12 = 77 across every
declared value - and velocity 100; note-off 128 with the same pitch and velocity 0. Nothing is
computed from a coordinate, so nothing can go negative (11-13's finding on
STRIP), and the channel is a knob token 0..15.

A POINT THAT IS DISARMED FALLS SILENT ON THE NEXT PASS. s.v[n] is read at
the moment the wave crosses the cell, never cached, so a tap that toggles a
point off between two pings is honoured by the next one. That clause is
what "add or remove" means, and lua-smoke.spec.ts arms two points on
different rings, hears both in ring order, disarms one, and asserts the
disarmed one is silent while the other keeps sounding - the check a
happy-path test would miss, and the one that reddens on a card that cannot
forget.

---------------------------------------------------------------------------
MOTION, REST, AND WHAT THE PREVIEW CANNOT SHOW
---------------------------------------------------------------------------

ANIMATED, and the fixture says so rather than this file: Setup arms the
Timer with gtt(0,@PERIOD) and the body re-arms unconditionally on its first
statement, which is the shape 11-15 measured as the actual cause of
`animating` (a stored Timer alone is not). restsBlack is FALSE: the centre is
lit on layer 0 from tick 0, three non-zero bytes in frames.json's first
record, so the card cannot carry a demonstration gesture (listing.spec.ts
refuses a DEMO_PATHS key for a lit entry) and the OG image is the pad with
its emitter lit and, if the sampled tick lands on one, a ring.

ON CODE 9: src/lib/sim/touch.ts never emits it (TOUCH-CODE-9.md), so in a
browser a tap arrives as a 4 and a 5 and this card's arming gesture is a
PRESS, which the preview delivers completely. The `e<9 and n` store handles
the module's coalesced tap for the reason sonar.ts gives at length.

---------------------------------------------------------------------------
THE BUDGET, MEASURED BEFORE THE ENTRY WAS AUTHORED
---------------------------------------------------------------------------

Every figure is `max(GridScript.compressScript(lua).length, lua.length)`
after `padReady()`, at the corner lua-entries.sweep.spec.ts actually gates:

                           Setup   free   Timer   free
  RGB444 picker corner       592    316     288    620
  at the defaults            592    316     286    622

RE-MEASURED BY PLAN 12.1-03 in this tree under the pinned compressScript,
which is when the Setup last moved: +103 for the `R` definition at the head
(71 with its trailing space at the corner), the `G` call (26) and the `R`
call (6) - 489 / 419 and 489 / 419 on the two rows before it. Plan 12-08
had measured 489 / 419, 489 / 419 and (all-shortest declared) 471 / 437,
having handed the inlined cell guard to the library's `Q` for -90 on the
Setup and taken +7 on the Timer for `X(s,20)`; before 12-08 the rows read
579 / 281, 579 / 279 and 569 / 278.

Both events are fixed points of compressScript at every corner and pass
checkSyntax. SONAR's 572 / 289 at the same corner is the reference the plan
named; this card is twenty over it on the Setup - the compass walk with its
octave wrap, the half-bucket offset, and a three-digit default period - and
one under on the Timer. THE GAP IS UNCHANGED BY 12-08 AND BY 12.1-03, and
that is a check rather than a coincidence: both entries lost the same 90
characters and gained the same 7 in 12-08, and gained the same 103 in
12.1-03, because they carry the same guard, the same `R` and the same
finger. The first sketch, indexing an eight-entry table straight by
direction, measured 560 / 281 against the pre-12-08 shape and was withdrawn
on the word table rather than on cost.

---------------------------------------------------------------------------
THE TRAPS THIS ENTRY CONTAINS
---------------------------------------------------------------------------

  - THE SCALE TABLE MAY BE ANY LENGTH BUT EVERY VALUE MUST BE A NAMED SET.
    `#t` makes the walk safe for any length; view.spec.ts makes an unnamed
    set red. Both are asserted, neither is assumed.
  - THE HALF-BUCKET OFFSET IS +16 AND SITS INSIDE THE MODULO. Move it
    outside and the top bucket reads 8, a ninth direction the pad does not
    have.
  - k IS COMPARED AND NEVER INDEXED. `if s.a[n]==k`; steps 5..7 match
    nothing and that is the design.
  - @PERIOD APPEARS IN BOTH EVENTS and both must move together, for the
    reason sonar.ts gives: the Setup arms the first fire and the Timer
    re-arms every subsequent one.
  - THE DECAY PAIR IS 252 / 250 / 42. decay-idiom.spec.ts holds the
    arithmetic; 255 never lands on zero.
  - THE LIVE FILTER IS NOT HERE ANY MORE. It is inside the library's `Q`,
    with the onset test and the dedup; touch-guard.spec.ts knows this body
    delegates and requires the call rather than excusing its absence.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every @SWEEPC
    value is inside 0..255.

---------------------------------------------------------------------------
"NICE BUT NEEDS THE TOUCH DETECTION FRAMEWORK" - WHAT THE FRAMEWORK IS FOR
(plan 12-08, and the probe that decided it)
---------------------------------------------------------------------------

THE BOUNDARY BETWEEN TWO CELLS IS ONE UNIT WIDE. `71*9//128 = 4` and
`72*9//128 = 5`, and PROBE-RESULTS-2026-09-10.md Q2 recorded a MOTIONLESS
finger sending 71, 72, 71, 71, 71 at 100 Hz - so a finger anywhere near an
edge was read as alternating taps on two cells. On an entry that TOGGLES
(`s.v[n]=not s.v[n]`) that is worse than a double arm: an even number of
crossings leaves the cell exactly as it was, so a point placed on a line
could silently place and unplace itself. The bench note here is the one line
in the round that named the fix rather than the symptom.

THE FIX IS HYSTERESIS AND IT LIVES IN THE LIBRARY. `Q(s,i,e,x,y)` holds a
contact's cell until the finger leaves it by 45/64 of the local LED pitch
(since 12.1 the band is a fraction of the pitch, not a width; 12.1-CONTEXT
D-18) and returns a cell only when it changed. The end test, the onset test
and the dedup are inside it, so the whole guard here is `local
n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end` and
`self.q={}` is gone. Re-testing `e` after the call would be doing the
library's job twice.

---------------------------------------------------------------------------
THE FINGER IS DRAWN WHERE IT IS, AND THE CENTRE SURVIVES IT ON EVERY PATH
(plan 12.1-03; 12.1-CONTEXT D-11, D-13, D-15)
---------------------------------------------------------------------------

`G(s,i,e,x,y,0,@SWEEPC)` after `Q`: the library's bilinear finger on LAYER
0 in the sweep's own colour - the entry's colour where it has one (D-13),
a literal in the string rather than a new knob. Dead on an LED that LED
alone at peak; between two both dimly; in the middle of four all four. And
since 12.1 the cell `Q` returns IS the LED under the finger, because `Q`
and `G` both read the MEASURED sensor map (calibration.ts) through `U`, so
the point placed and the light agree by construction - the bench case (row
1, column 7 zero-based) places cell 16 where the naive divisor lit the
corner. That is what "needs the touch detection framework" asked for.

`Q` FIRST, THEN `G` (12.1-02's finding): on an onset `Q` expires the contact
itself, which reaches `E` and clears the block in `B[i]` through `V`. With
`G` written first that is the block `G` just drew, and a still finger reads
dark until its first MOVE; `Q` first clears the STALE block and `G` draws
the fresh one. Same characters either way.

THE CENTRE DOT IS ON LAYER 0 TOO, AND `G` AND `V` NOW WRITE THAT LAYER. A
finger passing over cell 40 puts it in `G`'s 2x2 block - at a weight that
can be 0 - and every clear of that block through `V` writes phase 0 to it:
under `G` in this callback, and on EVERY EXPIRY through `E` (the Timer's
`X(s,20)` sweep of a contact that went quiet, a lost-lift re-press by the
same id, another contact landing on the held cell), where the plan-check
found the re-light missing. So this entry defines the library's release
convention, `R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,
255)end`, at the head of the Setup, and `E` calls it AFTER `V` on every
expiry path while the callback calls it after `G`. It is idempotent, as `R`
must be (library.ts section 5: `Q` calls `E` on a contact's FIRST press
too), and it RE-COLOURS as well as re-lights, so an alert cannot take the
marker's colour either. The init-loop `local h=glag(0,40)glc(h,0,@SWEEPC,1)
glp(h,0,255)` stays as it was: it is the rest picture, and `R` is what puts
it back. lua-smoke.spec.ts drives both expiry paths over cell 40 and
asserts 40 at 255 in @SWEEPC after each.

LAYER 0 IS THE FIRMWARE'S ALERT LAYER (grid_led.h:7), and that is why
neither the finger nor the marker is coloured once and left: grid_alert_all_
set rewrites layer 0's colour on every LED on a CONFIG write, on page-discard
completion, on a refused page change, on a TX overflow and at boot. `G`
re-asserts @SWEEPC on each of its four cells on every call and `R` on cell
40 on every expiry and after every `G`, so the exposure is one flash and a
tint that heals on the next sample - audition row 25(j) asks the bench to
see it. There is no floor: `glc(...,1)` forces the layer's minimum to 0, so
a cell `V` clears is dark and the dark pad is as dark as it was.

COST: +103 on the Setup, 489 -> 592 at the picker corner (the `R`
definition 71 with its trailing space, the `G` call 26, the `R` call 6),
nothing on the Timer; the map itself cost this entry nothing.

PHASE 11 READ THE ROUND'S PRECISION COMPLAINTS AS FAST-TAP LOSS, AND THAT
READING WAS CORRECT FOR THE FIRMWARE AND WAS NOT THE COMPLAINT. Code 9 is a
real coalesced press-and-lift in the firmware source and the `e<9 and n`
store this entry inherited from SONAR was a real fix for it. But Q3 tapped
ten times as fast as a hand can and NOT ONE arrived as a 9. The fix stays -
it is `H[i]=e<9 and n` inside `Q` now - it is harmless, and it was never what
the user was reporting.

AND A LOST LIFT IS REACHED BY `X`, NOT BY `Q` (Q6.5, Q7). `Q`'s expiry rules
need A PRESS - the same id pressing again, or another contact landing on the
held cell. Q6.5 recorded four of five contacts never sending their code 5
after a five-finger chord; a contact that goes quiet and is NEVER PRESSED
AGAIN holds its cell for the rest of the session and every future press by
that id is measured against it. Only the Timer-side sweep reaches it, so the
Timer calls `X(s,20)`, seven characters after the `local s=self` it already
opens with. TWENTY CALLS IS AN INTERVAL, NOT A DURATION: at @PERIOD's default
of 140 ms it is 2.8 s, and across the knob it runs 1.6 s (80 ms) to 5.6 s
(280 ms) - the longest window of the four entries re-fitted in 12-08, because
this is the slowest ping. It is a starting value the bench row in plan 12-12
may move, and it is safe to ship unbenched because this entry holds no note
PER CONTACT: the pending list s.z is keyed by the TIMER's own fire, not by a
finger, so an expiry forgets a stale cell and cannot cut a sounding note.

WHAT THIS ENTRY TAKES FROM THE LIBRARY BESIDES `Q` AND `X`, AND WHAT IT
DOES NOT. IT DEFINES `R` SINCE 12.1-03 - not for a note (s.z is keyed by the
Timer's fire, so an expiry never cuts one) but for the centre marker on
layer 0, which every block clear can take away (the 12.1-03 paragraph
above); 12-08's "NOT `R`" stood while nothing but the init loop wrote layer
0. NOT `F` - a "light the finger's cell" helper DOES NOT EXIST: it shipped
in the planner's sketch with no caller and 12-07 dropped it. Its job is
`G`'s since 12.1-03: until then an armed cell toggling under the finger was
the only feedback, and the bench said it was not enough.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 592, Timer 286; at the RGB444 picker
corner - the corner the 908 gate reads - 592 / 288, leaving 316 free on the
Setup and 620 on the Timer. Plan 12.1-03 moved the Setup by +103 (`R`, the
`G` call and the `R` call; 489 before it), re-measured in this tree under
the pinned compressScript; plan 12-08 had moved both: -90 on the Setup where
the inlined guard left for the library, +7 on the Timer where `X(s,20)`
arrived.
THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them.
```

## Change 12, 2026-09-18 - the ring on the DAW's clock (BENCH-2026-09-16.txt section 12)

The user's word: "MIDI sync works perfectly. implement it to Ghost, Radar points, Radar and
Steps." - ORBIT's clock idiom (change 8, bench-verified on hardware this day; the idiom, the
firmware evidence and the spelling are in `docs/entries/orbit.md`, "The clock idiom") on RADAR
POINTS. RADAR itself is the ported preset and is not touched here (it is change 12b's).
TUNE-01's six is lifted for a sync card by change 8's answer 2; RADAR POINTS carries seven knobs.

### The two strings the entry carried until change 12, verbatim

```lua
--[[@cb]]R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,255)end self.a={}self.o={}self.v={}local t={@SCALE}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,@SWEEPC,1)glp(c,2,0)self.a[n]=math.max(math.abs(n%9-4),math.abs(n//9-4))local b=(math.atan(n//9-4,n%9-4)*41//1+16)%256//32 self.o[n]=@ROOT+t[b%#t+1]+b//#t*12 end local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,@PERIOD)
```

```lua
--[[@cb]]gtt(0,@PERIOD)local s=self X(s,20)local k=(s.k or 0)%8 s.k=k+1 if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,252,250,0)glt(a,2,42)if s.v[n]then local m=s.o[n]s:gms(@CH,144,m,100,0)s.z[#s.z+1]=m end end end
```

The rack then: `@SCALE @ROOT @SWEEPC @PERIOD @CH`, five knobs, SONAR's counts.

### What moved

- **The step is the ring step `k`**, now the Timer's `local function f(s)`: k = (s.k or 0)%8,
  the advance, the release, and for every cell at Chebyshev distance k the decay pair and the
  armed points' note-ons. The eight-step cycle stays: rings 0..4 on steps 0..4, steps 5..7
  matching nothing, under the clock as under the Timer - so at Division 16th a ping is eight
  16ths, half a bar, and at 8th a bar.
- **The release is its own routine `u(s)`** - note-off for every note in the pending list
  `s.z`, then `s.z={}` - so Start and Stop can release without stepping: `f` calls it, the
  callback reads `s.u` on 250 (before the reset) and on 252. Published beside `s.f`. Named `u`
  and NOT `o`: `s.o` is this entry's pitch table, and the first draft published the release as
  `s.o` - every Timer call then indexed a function (`attempt to index a function value (field
'o')`), which the existing RADAR POINTS case, the residue case and the parity case all caught
  in the first run. One spelling on STEPS too.
- **The callback**, ORBIT's spelling with the two release lines (the same text as STEPS's) and
  `grxm(2,@SYNC and 3 or 0)` before `gtt(0,@PERIOD)`; `self.q=0` beside the three tables.
- **Sync** `false / true` (Internal / External, `previewIndex: 0`) and **Division** `12 / 6 / 3`
  (8th / 16th / 32nd, 16th the default), between Ping speed and MIDI channel. Under External
  `@PERIOD` is the finger sweep's period and nothing else.

### The costs, under the pinned `compressScript` after `initLuaFormatter()`

At the RGB444 picker corner: **Setup 592 -> 892** (316 -> 16 free), **Timer 288 -> 380** (620 ->
528 free); 891 / 378 at the defaults. The tightest Setup in the catalog: the callback (~200) and
the routing (~24) sit beside a Setup that was already 592. The brief's order - Setup, then Timer,
then a system slot - holds at the Setup; the alternative costed was the callback in the Timer
(calling the locals `u` and `f` directly, no field reads: Setup ~625, Timer ~530), which would
lose a Start inside the first `@PERIOD` after the Setup entirely (no callback yet), where the
Setup's callback counts it. `BUDGET_ERROR` (890) is the vendored compiler's fit-ladder line and
has no consumer under `src/lib`; the gate is 908. No system slot.

### What the default record shares with yesterday's

At the defaults the Setup is yesterday's with `self.q=0 ` after `self.v={}`, the callback and
`grxm(2,0)` before the `gtt`; the Timer is yesterday's body split into `u` and `f`, published,
and called at the end through `if false then return end f(s)` - the release running after the
advance as before, then the paint and the sends in the same order. `frames.json` and the OG
image are byte-identical; frames.spec.ts held without a regeneration.

### The VM cases (`lua-smoke.spec.ts`)

External with two points armed (ring 1 east, ring 2 north-east): the Timer sends nothing and
rolls no ring over sixteen periods (s.k never set), no ring cell lit; twelve clocks before Start
do nothing; Start zeroes the ring and the first clock lands ring 0 (the centre, no point), the
seventh ring 1 - its point on the wire and all eight ring-1 cells lit on layer 2, no ring-4 cell

- the thirteenth ring 2 (ring 1's note-off, ring 2's note-on); 200 Timer ticks move nothing; Stop
  releases ring 2's point; clocks and 254 do nothing; Continue keeps the count at 13 and the sixth
  clock lands ring 3, releasing nothing twice; twenty-four more clocks walk steps 4..7 silently
  and wrap to ring 0; twelve more sound ring 1 again; Start releases it, resets, and the clock
  lands ring 0. Division 12: counted, not stepped, before the Timer's first call; rings at clocks
  13 and 25. The words and the preview. The existing RADAR POINTS cases (the ping ring by ring
  with a point taken away, the boundary finger, the 81 LED centres, the parity tap, the residue)
  are untouched and green.

### The stamp

RADAR POINTS is not in `wild-stamps.json` (it arrived after the capture), so no captured record
moves; a link shared before today carries five indices against seven knobs and lands
`unreadable` by the length check, opening the card at its defaults.

## Change 17B, 2026-09-23: the Points output, no receive (`BENCH-2026-09-16.txt` sections 17 and 18)

RADAR POINTS sends one stream - every armed point's note as the ring crosses it, released a step later - so it is one
output, "Points", a trigger, with Type (Note / CC) and Channel.

- **Knobs.** `@TYPE` (`midiType`) appended last; `@CH` (`channel`, already all sixteen) the output's Channel, reading
  1..16. **No Number**: each point's pitch is its compass direction's, from `@ROOT` and the scale - a Number would
  name nothing. Eight knobs, seven outside the output. No captured wild record for this card.
- **The send.** Note-on `s:gms(@CH,@TYPE,m,100)`, the release `s:gms(@CH,@TYPE*3//2-88,m,0)` (128, or the controller
  at 0). At the defaults the wire is the card's before the change, message for message; `lua-smoke.spec.ts`'s geometry
  case reads the release as `144*3//2-88` at the default Type.
- **No receive.** A received note names a direction, not a place: every ring past the first holds several cells of one
  pitch, so there is no one point to arm. The Setup assigns `s.midirx_cb=nil` - and had 16 free: it now holds its
  element as the local `s` (`local s=self`, `s.a s.o s.v s.q`, twelve characters back), which paid for the nil.
- **Latch: swipe by design** - a finger swiped across the field arms or disarms one point per cell it crosses (`Q`'s
  change signal), the placing gesture (lua-smoke.spec.ts "holds a boundary finger on one cell on ORBIT, STEPS, RADAR
  POINTS and SONAR").
- **Cost:** Setup 891 / 892 -> 896 / 897 (defaults / corner; 11 free), Timer 378 / 380 -> 382 / 384. frames.json and
  the OG image unmoved.
- **Proved.** `lua-smoke.spec.ts` "RADAR POINTS: the Points output ...": ring 1's east point armed with a tap sounds on
  the ring's crossing and is released a step later - notes on channel 0 at the defaults, controllers on wire channel 6
  at CC - every note-on released; no callback over a previous landing's.
