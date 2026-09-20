# SNAKE - the history behind src/lib/catalog/entries/snake.ts

SNAKE is the game on eighty-one lights with a note for every bite: steer with a finger, let go
and the autopilot carries on, death a deterministic reset so the shelf replays the same short
game. Its source is `src/lib/catalog/entries/snake.ts`. 09-08 authored it - the two-field torus
step, the bounded re-roll, the doubly declared painter and the no-random rule; 11-16's header
sweep found it the eighth entry quoting the declared corner and corrected it to the picker's
585 / 880 (twenty-eight free on the Timer); the bench's "one note per movement" was deferred by
the user. The entry's own header now carries the mechanism, the wire and the traps; everything
the header said before 13.2-02 - the autopilot measurement, the protocol-ceiling arithmetic and
the corner correction - is below, verbatim.

## Moved from src/lib/catalog/entries/snake.ts on 2026-09-13 (13.2-02)

```text
SNAKE - the game, played on eighty-one lights, with a note for every bite.

Steer with a finger, eat, grow, and hear a note for every bite. Let go and
the snake carries on playing by itself, so the card is alive on a browse page
with nobody in front of it. That is not a compromise; it is what makes this a
card rather than a game you have to start.

THE MECHANISM, and its 9x9 arithmetic. self.b is the body as a RING BUFFER of
cell indices with self.p the ring slot of the head and self.l the length;
self.o is an occupancy table keyed by cell so "did the head land on the body"
is one lookup rather than a scan. self.u and self.v are the direction as a
column step and a row step; self.f is the food cell; self.t is how many more
generations a hand still has control for.

The Timer is the game. It re-arms FIRST - gtt(0,@SPEED) is the opening
statement, matching the compiler's own gtt-first bodies, because the handler
runs inside a pcall and a re-arm placed at the end dies permanently on the
first raise - then steers, advances the head, and paints at most three cells.

THE STEP IS TWO SIGNED FIELDS, NOT ONE SIGNED INDEX, AND THAT IS A FIX RATHER
THAN A PREFERENCE. A single index step (1, -1, 9, -9) cannot torus-wrap: the
column wrap needs (column + step) % 9, and recovering the row step from the
index step needs step // 9, which is 0 for +1 and MINUS ONE for -1 because
Lua's floor division rounds toward negative infinity. A snake steered left on
the top row would have crawled up a row every step, silently. With the two
fields the whole move is one expression:

  n = (h//9 + self.v) % 9 * 9 + (h%9 + self.u) % 9

Both moduli are Lua's floor-modulo, so -1 % 9 is 8 and the snake leaves one
edge and enters the other in both axes. A torus removes the "you died on a
wall" case entirely, which is what keeps the card alive on a shelf.

THE AUTOPILOT IS WHY THE CARD IS A CARD. With no touch at all the plan's
straight-line snake never turns, so it circles one row forever, never eats
and never dies - which is a still picture that happens to move. So when
self.t has run out the Timer steers itself: while it is travelling
horizontally it turns onto the row the food is on, and while it is travelling
vertically it turns onto the food's column. One floored subtraction, one
sign, no table, and it never reverses because it only ever writes the
PERPENDICULAR axis. Measured over sixty seconds with nobody touching the pad:
five bites and a death, then exactly the same five bites and the same death
again, about six seconds a game.

A FINGER OVERRIDES IT FOR THREE GENERATIONS. Any live touch sample writes the
direction from the dominant axis of (touch minus head) and sets self.t to 3,
and the Timer spends that credit one generation at a time. Touch enqueue is
change-gated per contact, so a moving finger re-arms the credit on every
sample and keeps control indefinitely; a finger that stops moving hands the
snake back after three steps. That is the honest behaviour and it is what the
card copy says.

A DIRECT REVERSAL IS REFUSED BY CONSTRUCTION, not by a comparison: a
horizontal steer is only accepted while self.u is 0, and a vertical one only
while self.v is 0. A snake moving right can therefore never be told to move
left, which in this game is the same thing as walking into your own neck.

EATING, AND THE TWO BOUNDED LOOPS. The next food is placed deterministically
from the one just eaten by g = (g*7 + 23) % 81, re-rolled while it lands on
the body or on the new head. THE RE-ROLL IS BOUNDED BY THE LITERAL 12 AND
THAT BOUND IS DO-NOT-REMOVE: an unbounded loop inside a Timer hangs the port
task forever with the watchdog's panic disabled, and the only recovery is a
power cycle. The fallback is a second bounded loop, over 0..80, that takes the
first free cell; it is computed first and the re-roll overwrites it, which
costs one pass over a table and removes a branch.

DEATH IS A DETERMINISTIC RESET, and that is what makes the golden frames
reproducible. Head lands on the body: a low note, all eighty-one cells
blacked in one bounded pass, and the state put back to a two-cell snake at
cells 39 and 40 travelling right with its food at 41. Nothing is random - see
below - so the card on the shelf plays the SAME short game over and over,
which is exactly the behaviour a browse card wants.

NO RANDOM SOURCE ANYWHERE, and the reason is not taste.
lua-entries.sweep.spec.ts test 4 refuses it because the firmware VM's
generator is weakly seeded on ESP-IDF, so the same unrepeatable-looking field
recurs after a power cycle; and HANGAR pins golden frames at ticks 0, 37,
101, 500 and 1009 with no touch input, which a non-deterministic card could
not satisfy at all. Arithmetic keyed on the previous value is the shipped
alternative and it is what the food placement uses.

THREE CELLS A GENERATION, NEVER A FULL REPAINT. The head is painted, the food
is painted when it moves, and the vacated tail is blacked - in the SAME pass
as the head, never erase-then-paint, because firmware has no double buffer
and a two-pass repaint can tear. The only full pass in the whole entry is the
blacking on death, which happens about once every six seconds.

THE PAINTER IS A LOCAL FUNCTION AND IT IS DECLARED TWICE. P(k,r,g,b) writes
the colour to BOTH layers and lifts both phases to 255: one layer caps at
49.6 per cent of the colour asked for, and a game piece has to read across a
room. P(k,0,0,0) is how a cell is blacked, because the sixth argument of glc
forces the minimum stop black and an all-zero colour renders black at every
phase. Setup declares P and so does the Timer, because P is a local of the
Setup CHUNK and the Timer is a separate chunk - hanging it off self and
calling self.P(...) would be a field call the host-surface classifier
refuses, and 09-01's rule is that the entry is wrong, not the gate.

THE TRAPS THIS ENTRY CONTAINS.

  - NO math.random, for the two reasons above. There is no call into the
    numeric library at all: every operation here is integer arithmetic.
  - EVERY LOOP IS BOUNDED BY A LITERAL: 39..40, 0..80 three times, and 1..12.
    Checked by reading every "for" in both stored strings; there is no while
    and no repeat in either. DO NOT REMOVE A BOUND - see the watchdog reason
    above.
  - EVERY DIVISION AND MODULO IS FLOORED. h//9, h%9, s.f//9, s.f%9, s.l%12,
    (s.p+1)%81, (s.p-s.l)%81, (w*7+23)%81 and x*9//128 are all integer
    operations; a fractional argument to a firmware call silently becomes 0.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
    every @SNAKEC and @FOODC value is inside 0..255 by construction.
  - EVENT CODES. The guard is "e==3 or e>=5 and e<9 then return", so a fast
    tap - code 9, one message with no separate lift - steers, and so do
    moves. e == 5 is never tested for on its own.
  - glp IS NEVER CALLED WITH A NEGATIVE PHASE. Every phase written here is an
    explicit 0 or 255.
  - NO KEEPER AND NO DECAY ANYWHERE. Neither stored string holds glf, glpfs
    or 65535, so pitfall 1 is unreachable by construction rather than by
    care.
  - THE NOTE RANGE. A bite plays @NOTE + length % 12 and a death plays
    @NOTE - 12. The largest lowest-note is 72, so a bite tops at 83; the
    smallest is 36, so a death bottoms at 24. Both are inside 0..127.
  - MOVING INTO THE CELL THE TAIL IS ABOUT TO VACATE COUNTS AS DEATH. The
    occupancy table is read before the tail is released, which is one cell
    stricter than the arcade rule and one lookup cheaper. It is a rule, not a
    bug, and it is why the self-played games are short.

THE HONEST LIMIT, for the card copy. One finger steers, and the game runs
whether or not anyone is playing - which is what makes it a card rather than
a game you have to start.

THE PROTOCOL CEILING, and why this entry never approaches it.
GRID_LUA_STDO_LENGTH is 256 bytes, cleared once per 10 ms cycle, and a gms
voice message is 14 bytes - about eighteen per cycle, with an append that
does not fit refused and NO ERROR RAISED. SNAKE sends at most ONE message per
generation: a bite and a death are mutually exclusive branches and neither
can fire twice. At the fastest @SPEED that is one message every eleven
cycles.

ROUTE: kind "lua", not kind "state". PadState has no state machine anywhere -
sends.kind is none | xy | zones | faders | trackpad | dial and every
look.kind is a phase generator, so there is nothing in the sheet that can
hold a body, a direction and a food cell between ticks, and nothing that can
paint three individually chosen cells in two colours.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 581 characters, Timer 870, both fixed
points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
GATE READS IS 585 / 880, leaving 323 free of 908 on the Setup and TWENTY-EIGHT
on the Timer, and it is the RGB444 PICKER corner (D-06): both colour knobs
declare nine-character values, and since plan 10-08 the sweep writes any
colour a picker can, including the eleven-character 255,255,255 - two more
characters at each of the Setup's two token sites and the Timer's four, which
is exactly the +4 and the +8. The all-longest corner of
the DECLARED palettes is 581 / 872, and that is the figure this header quoted
- "36 free on the Timer" - until plan 11-16's gate swept every header for
plan 11-07's finding and found this one the eighth quoting a corner the gate
does not read, in the optimistic direction. The all-shortest corner a picker
can reach is 581 / 870. The user deferred SNAKE's bench note ("not right
now"); with 28 free at the corner that counts rather than 36, "one note per
movement" fits even less than 11-VALIDATION.md's arithmetic said.
src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```

## Change 14, 2026-09-21 - the remake (BENCH-2026-09-16.txt section 14)

The user's word, 2026-09-20: "the SNAKE gimmick profile is broken, we'll need to remake that";
the quiz (stored through HANGAR, the module rebooted): the picture "runs the same sequence over
and over again i have barely any affect on it", the steering "turns the wrong way / late", the
notes "hang or spam"; then "ill go to sleep soon, proceed to 14 at your best discretion". Remade
on the reading recorded under section 14, every decision below taken without a question.

### The two strings the entry carried until change 14, verbatim

```lua
--[[@cb]]local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end self.b={}self.o={}self.p=1 self.l=2 self.u=1 self.v=0 self.f=41 self.t=0 for k=39,40 do self.b[k-39]=k self.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then return end s.t=3 local h=s.b[s.p]local c=x*9//128-h%9 local r=y*9//128-h//9 local m=c<0 and -c or c local w=r<0 and -r or r if m>w then if s.u==0 then s.u=c>0 and 1 or -1 s.v=0 end elseif w>0 then if s.v==0 then s.v=r>0 and 1 or -1 s.u=0 end end end gtt(0,@SPEED)
```

```lua
--[[@cb]]gtt(0,@SPEED)local s=self local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end local h=s.b[s.p]local o=s.u~=0 if s.t>0 then s.t=s.t-1 else local d=o and s.f//9-h//9 or s.f%9-h%9 if d~=0 then d=d>0 and 1 or -1 if o then s.v=d s.u=0 else s.u=d s.v=0 end end end local n=(h//9+s.v)%9*9+(h%9+s.u)%9 if s.o[n]then s:gms(@CH,144,@NOTE-12,110,0)for k=0,80 do P(k,0,0,0)end s.o={}s.b={}s.p=1 s.l=2 s.u=1 s.v=0 s.f=41 for k=39,40 do s.b[k-39]=k s.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)return end s.p=(s.p+1)%81 if n==s.f then s.l=s.l+1 local g=0 for k=0,80 do if k~=n and not s.o[k]then g=k break end end local w=s.f for _=1,12 do w=(w*7+23)%81 if w~=n and not s.o[w]then g=w break end end s.f=g P(g,@FOODC)s:gms(@CH,144,@NOTE+s.l%12,100,0)else local t=s.b[(s.p-s.l)%81]s.o[t]=nil P(t,0,0,0)end s.b[s.p]=n s.o[n]=1 P(n,@SNAKEC)
```

Setup 581 / Timer 870 at the defaults, 585 / 880 at the RGB444 picker corner (323 and
TWENTY-EIGHT free); the rack `@SPEED @SNAKEC @FOODC @NOTE @CH`, five knobs, unchanged by this
change.

### The fault, read against that Lua and confirmed in the VM

1. **"The same sequence over and over."** Death was a deterministic reset to the two-cell snake
   at 39 / 40 with the food at 41, and the food walked `(g*7+23)%81` from a fixed seed, so every
   game after a death was the first game again: on the shelf five bites and a death every 29
   generations (ticks 22, 110, 308, 550, 594, 638 at 220 ms, then 660 + the same), forever.
   Confirmed by running the old entry in the VM for 2,200 ticks: three identical games.
2. **"Turns the wrong way / late."** The handler read the touch cell from the RAW pair
   (`x*9//128`, `y*9//128`) - SNAKE was left out of 12.1's calibration refit as one of the
   "untouched Lua entries" - so on the module the finger landed a cell out near the edges and
   the turn came off the wrong cell; and the control credit `s.t=3` lasted three generations, so
   a finger that stopped moving handed the snake back to the autopilot after three steps and
   the autopilot turned it toward the food again. "Barely any affect on it" is that credit.
3. **"Hang or spam."** A bite and a death sent a note-on and nothing ever sent a note-off ("at
   most one message per generation" was the header's rule) - every note hung until the next
   note-on on the same pitch, and the autopilot's bites kept sending them.

### What moved

- **Steering.** The touch cell is the library's calibrated `N(x,y)` (12.1's map, the same map
  every other finger on this site reads); the direction is the dominant axis from the head to
  that cell, a horizontal steer accepted only while `s.u` is 0 and a vertical one only while
  `s.v` is 0 (a reversal refused by construction, as before). Every sample re-steers, so the
  finger steers for as long as it is down; a still finger sends no sample (the firmware's
  change gate) and the direction stays; the lift changes nothing. **No credit:** `s.t=1` on any
  live sample and NEVER decremented.
- **The autopilot rule.** The autopilot runs only while `s.t` is nil - nobody has touched this
  game - so the card is alive on a browse page and in the OG image; the first finger switches it
  off until the next death's restart, which clears `s.t`. A refused steer (a reversal, the axis
  already travelled) still sets `s.t`: a finger that touched the game owns it. The other honest
  form, a knob `Autopilot: Off / On`, was measured at ten characters of Timer (`if @AUTO and not s.t then`: 741 at the
  defaults, 749 at the corner) plus a sixth knob, a rack change and stamp.spec.ts's grown-rack
  exception; the rule is cheaper and needs
  no explaining on the card. Not taken.
- **The food.** `F(s,n)` in the Setup: the first free cell computed first as the fallback, then
  `w=(w*7+23+s.g)%81` from the food just eaten, re-rolled while it lands on the body or the new
  head, bounded by the literal 12. `s.g` is the game's seed: `s.c` is a generation counter
  incremented on every Timer call and never reset, and the restart copies it into `s.g`. The
  first game has `s.g` 0, so its walk is the old one; every later game starts from a different
  count, so its walk differs (81 distinct walks per starting food; two consecutive games are
  asserted to differ). Deterministic from a cold start: no random source anywhere.
- **Death.** The death call sends the low note and paints every occupied cell in `@FOODC` - the
  flash - and sets `s.d=6`; the next two calls hold it; the third blacks the board (one bounded
  pass over 0..80); two more stay dark; the sixth runs `I(s)`, the restart. Six generations:
  1.32 s at the default 220 ms, 0.66 s at 110, 1.8 s at 300. The food colour rather than white:
  the snake becomes food, and the corner cost is the same eleven characters.
- **Notes.** A bite sends `144, @NOTE+s.l%12, 100` and leaves the pitch in `s.z`; the death
  sends `144, @NOTE-12, 110` the same way; the next Timer call sends `128, s.z, 0` before
  anything else and clears it (RADAR POINTS's pending list, one note deep: a bite and a death
  are mutually exclusive, so one note is ever pending). Nothing hangs; one note-on per bite.
- **Speed.** `@SPEED` as before, the period in milliseconds in both events (300 220 160 110). A
  BPM reading was not taken: no honest BPM ladder lands 220 ms exactly, and the rest frame and
  the first game had to stay.
- **The Setup clears the board.** `I(s)` blacks all 81 cells before it paints the two-cell
  snake, and the Setup runs `I(self)` once, so an Apply over another card's picture starts from
  black (before, the Setup painted three cells and left the rest as they were).
- **Three Setup locals published on `self`.** `P` (the painter, as before), `I` (the restart)
  and `F` (the placer) are `local function`s of the Setup, published as `self.P self.I self.F`
  and read back into Timer locals (`local P,I,F=s.P,s.I,s.F`, 24 characters against the 89 of
  the painter declared twice). The brief's "a global function name free of the library's
  twenty-one and the runtime's" was not possible: host-surface.spec.ts admits a bare call only
  when it is a host name, a library name or a local of the same event, so a global `I(` in the
  Timer would be refused there, and every single capital is taken between the library's
  twenty-one, `R`, the Sandbox emitter's `J` and `M` and the runtime's `S F I R O Q D K` in any
  case. The fields are the element's own; `I` and `F` collide with nothing that runs on this
  element, and `P` keeps brightness.ts's declared painter row unchanged.

### The costs, under the pinned `compressScript` after `initLuaFormatter()`

At the RGB444 picker corner: **Setup 585 -> 877** (323 -> 31 free), **Timer 880 -> 739** (28 ->
169 free); 871 / 732 at the defaults. Both fixed points, both accepted by `checkSyntax`; the sweep
(`4 19`) measures every knob value, the 27-colour sample per colour knob and both corners. No
system slot. The Setup carries the three functions and the handler; the Timer only steps. The
Setup's corner is the tighter of the two now (the reverse of before); moving `F` back into the
Timer was measured at 663 / 938 at the corner - thirty over the budget - so the split stands.

### The first game, the frames and the OG

The first game from Setup is byte-identical to the old entry's: `s.g` is 0, the autopilot is the
old arithmetic, and the VM's wire for it is the old sequence (five bites and the death at ticks
22, 110, 308, 550, 594, 638) plus a note-off exactly one generation after each note-on. So
`frames.json`'s records at ticks 0, 37, 101 and 500 and the OG image (tick 64) did not move; the
record at tick 1009 did - the old entry restarted at the death tick and tick 1009 was the second
game's fifteenth generation (12 lit bytes), the remade card restarts six generations later on a
different walk, dies again at tick 924 and is inside that death's dark pause at 1009 (0 lit bytes).
Regenerated; SNAKE's block is the only one that moved, and only that one record in it.

### The VM cases (`lua-smoke.spec.ts`, 47 -> 49)

A `describe("SNAKE remade (change 14)")` at the end of the file, two cases. (1) The shelf: the two
colours sampled off the Setup's own picture; the first game's wire held equal to the OLD note-on
list pasted from a run of the old entry (tick, pitch, velocity) with an off one period after each;
the death tick's flash (every body cell and the food in the food colour, eight cells, no
snake-coloured cell), held two generations, the death note released on the first, the board black
on the third and through the fifth, the restart on the sixth with nothing sent through the pause,
the second game's first bite one generation on at the same pitch with the food at the seeded
walk's cell `(41*7+23+35)%81 = 21`, not the first game's 67. (2) The steer, through the measured
knots: a finger straight above the head turns the snake up on the very next generation; the
direction outlives the lift for two more generations with the autopilot off (it would have turned
onto the food's column); a finger straight below while travelling up is refused; a finger to the
right on the head's row turns it right, and it keeps right; the wire carries the first bite's pair
and nothing else. The existing catalog-wide cases (the smoke gesture, the residue probe, the
parity tap, the keeper guard) are untouched and green. A note on the residue probe: since the
Setup's clear every cell is at phase 255 (black or coloured) in the untouched run, so that probe
cannot flag this card either way - the card's picture is colour under a constant phase, which the
probe's phase test was never able to see (its own comment on SNAKE says so).

### The stamp

The rack is unchanged, so every SNAKE stamp - the shelf's and any tuned link - still decodes to
the same five indices and opens the remade card at that state.
