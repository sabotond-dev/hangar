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
