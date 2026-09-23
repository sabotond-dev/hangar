# QUADRANT - the history behind src/lib/catalog/entries/quadrant.ts

QUADRANT is the four targets big enough to hit without looking and to tell apart without colour:
four 4x4 zones with their own colour and fill around a one-cell dark cross that sends nothing.
Its source is `src/lib/catalog/entries/quadrant.ts`. 09-09 authored it, measuring the four fills
as single-channel patterns before the file was written and costing the palette as one knob
rather than two (838 at the all-longest corner). The entry's own header now carries the
mechanism, the wire and the traps; everything the header said before 13.2-02 - the thesis, the
fill table with its sixteen-cell pictures, the honest limit and the route note - is below,
verbatim.

## Moved from src/lib/catalog/entries/quadrant.ts on 2026-09-13 (13.2-02)

```text
QUADRANT - four targets you can hit without looking, and tell apart without
colour.

The thesis is a hand, not a picture. Four zones over eighty-one cells is the
largest target a 9x9 pad can offer, and a target that large is one you press
with your eyes somewhere else. So the whole card is built around two
questions a photograph cannot answer: is the zone big enough to hit blind,
and is it distinguishable to somebody who cannot rely on hue. The second one
was MEASURED before this file was written - the four fills are reduced to a
single channel and compared as patterns, exactly as CULL's five were - and
the measurement is in 09-09-SUMMARY.md. A card that claims shape and ships
two identical fills is worse than one that claims only colour.

THE MECHANISM, with its 9x9 arithmetic.

  - FOUR 4x4 QUADRANTS AND A ONE-CELL DARK CROSS. Row 4 and column 4 are
    unlit and send nothing. The quadrant of a cell is q = x//5 + y//5*2,
    which is 0 for x,y < 5 and 1 for x,y > 4 in each axis - one floored
    division per axis rather than a pair of comparisons, and it lands on
    0,1,2,3 reading left-to-right then top-to-bottom. The cell's position
    INSIDE its quadrant is x%5, y%5, which is 0..3 for both halves because 5
    and 6 and 7 and 8 reduce to 0 and 1 and 2 and 3.
  - THE DEAD BAND IS THE POINT, NOT DECORATION. The cross is what makes the
    four targets hittable without looking: a finger that lands between two
    zones sends nothing at all rather than sending the wrong one, and a miss
    that fires the wrong note is worse than a miss. It costs nine cells of
    the eighty-one and it buys the whole claim on the card.
  - THE FILLS ARE A MASK TABLE, not a chain of predicates - the shape CULL
    established. M holds one SIXTEEN-BIT integer per quadrant; the cell at
    (u, v) inside a quadrant is lit when (M[q+1] >> v*4+u) % 2 is 1. Four
    integers is four literals, the drawing is one loop, and the geometry is
    auditable as data:

      q0  65535  ####  solid       16 of 16 cells
                 ####
                 ####
                 ####
      q1  23130  .#.#  checker      8 of 16
                 #.#.
                 .#.#
                 #.#.
      q2  63903  ####  outline     12 of 16
                 #..#
                 #..#
                 ####
      q3  33825  #...  diagonal     4 of 16
                 .#..
                 ..#.
                 ...#

    Sixteen, eight, twelve and four lit cells - four different densities as
    well as four different shapes, which is what makes them separable at two
    metres through a diffuser and not only under a pixel comparison.
  - THE COLOUR COMES FROM A FLAT TWELVE-NUMBER PALETTE read at i = q*3, and
    both layers get it. Layer 2 sits at phase 255 and is the resting picture;
    layer 1 carries the SAME colour at phase 0, which is black, because the
    sixth argument of glc forces the layer's minimum stop black. A press
    lifts layer 1 to 255 and the pressed quadrant roughly doubles in
    brightness.
  - @FILL HAS THREE POSITIONS AND THE MIDDLE ONE IS THE DEFAULT. "1" is
    fills on, "0" is colour only, "2" is high contrast - fills on with the
    palette forced to four hues 90 degrees apart. The numbers are not in
    prose order on purpose: the default index is 1 and the description this
    card ships promises a colour AND a fill, so the value at index 1 has to
    be the one that draws fills. A declaration must never be aspirational.
  - timer is "". Nothing animates, and that is a design decision: a browse
    page of thirty-six cards needs its still ones, and a target you are
    supposed to find without looking must not move.

THE LOOK, and why restsBlack is FALSE. Setup paints forty of the eighty-one
cells - 16 + 8 + 12 + 4 - on layer 2 at phase 255, and none of them ever goes
out. The card arrives as four readable targets rather than as a black square.

THE TRAPS THIS ENTRY CONTAINS.

  - EVERY DIVISION IS FLOORED. The quadrant index, the in-quadrant position,
    the palette index, the B() address arithmetic and both coordinate
    divisions x*9//128 and y*9//128 are all `//` or `%`; a fractional
    argument to a firmware call is silently zeroed by the F2Ieq rule.
  - THE DEAD CROSS MUST SEND NOTHING - DO NOT "FIX" THE GAP. `if c==4 or
    r==4 then return end` is the whole reason the targets are hittable
    blind. Removing it makes the picture no better and makes every near-miss
    fire a note.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of all five
    palettes - the four selectable ones and the high-contrast override - is
    inside 0..255, checked value by value. 260 would render as 4.
  - CODE 9 IS HANDLED, AND IT SENDS BOTH. A fast press-and-lift arrives as
    one message with no separate DOWN or UP, so the code-9 branch issues the
    note-on, lifts the quadrant, and then issues the note-off and drops it
    again in the same handler. Onset is `e == 4 or e > 8`; an end is
    `e == 3 or e > 4 and e < 9`.
  - THE BIT TEST IS `(M[q+1] >> v*4+u) % 2`, NOT `& 1` - DO NOT "TIDY" IT.
    The pinned minifier rewrites `&1` as `& 1`, so a stored `&` is not a
    fixed point of compressScript and the canonical-form gate goes red;
    `>>` survives untouched. `>>` also binds looser than `+` and `*` in Lua,
    which is why `v*4+u` needs no parentheses of its own.
  - THE NOTE RANGE IS @NOTE .. @NOTE + 3, so the top is 60 + 3 = 63 and the
    bottom is 24, both well inside 0..127.
  - NO KEEPER AND NO DECAY ANYWHERE. This entry writes no glt, no glf and no
    glpfs at all, so pitfall 1 is unreachable rather than merely avoided.
  - PER-CONTACT STATE IS KEYED BY id AND CLEARED ON AN END. self.k[i] holds
    the quadrant a contact pressed, so a lift releases the note it started
    and never a different one, and two fingers in two quadrants are two
    independent notes.

THE HONEST LIMIT, for the card copy. Four zones is the whole point, so
nothing here is fine control: this pad has four values and no more, and a
finger that wants a fifth has to go somewhere else. And the dividing cross is
a deliberate dead band rather than a gap in the picture - a press that lands
on it is a press that goes nowhere, on purpose.

ROUTE: kind "lua", not kind "state", and this is the shortest route note in
the phase. `sends.grid` is `3x3 | 4x4 | 9x9` (_pad.ts). THERE IS NO 2x2.
Four zones is outside the sheet's vocabulary by arithmetic, not by taste, and
nothing about the fills or the dead cross even gets a chance to matter.

THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
by renderLua it is byte-identical to the canonical text measured against the
pinned minifier: Setup 835 characters, no Timer, a fixed point of
compressScript and accepted by checkSyntax. The all-longest corner of the
four-knob cross-product is 838, leaving 70 free of 908, and the all-shortest
corner is 835. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of
those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them and they would be charged to the budget.
```

## Change 17B, 2026-09-23: four quadrants, four outputs, each lit by the host; the pull-in (`BENCH-2026-09-16.txt` sections 17 and 18)

QUADRANT's four targets sent `@NOTE+q` on one channel. They are four pads, and a drum map names four notes that are
rarely neighbours (kick 36, snare 38, hat 42), so per output (answer 3) each quadrant is its own output - "Top left",
"Top right", "Bottom left", "Bottom right", triggers - with Type (Note / CC), Channel, Number and Receive.

- **Knobs.** The top-left quadrant keeps the old two: `@NOTE` (`note`, relabelled "Top left MIDI note") all of 0..127
  with its four old rungs first, and `@CH` (`channel`, "Top left MIDI channel") all sixteen in order (it was 0, 1, 9, 15
  under kind `mode`). Appended in quadrant order: `type1 receive1`, then `typeJ channelJ noteJ receiveJ` (49, 50, 51 by
  default - the old `@NOTE+q` at the default lowest note). Eighteen knobs, two outside the outputs. QUADRANT's captured
  wild stamp, which landed `restored` until now, lands `unreadable` - a grown rack, the known pattern.
- **The send.** Per quadrant `j = q+1`: on `s:gms(h[j],T[j],N[j],100)`, off `s:gms(h[j],T[j]*3//2-88,N[j],0)` (a
  note-off, or the controller at 0), from tables built once. At the defaults the wire is QUADRANT's before the change.
- **The receive.** A host note-on on a quadrant's type, channel and number lights it as a press does (`B(q,255)`); its
  note-off - a note-on at 0, a controller at 0 - darkens it. Nothing is sent back: the Sandbox button's receive. No new
  audition row: row 40 (c) asks the button's question and row 41 the pull-in's.
- **Where it lives - the pull-in.** The Setup was 838 of 908; four tables and a receive beside the paint did not fit
  (921 in one draft). QUADRANT is a still card (listing `static`), so its Timer is pulled in by `s:tim()` and never
  armed: the Timer body paints the field (inside the Setup, so tick 0 is the same picture), builds the tables and the
  receive; the Setup holds `B` (handed over as `s.b`) and the handler, and takes `T,h,N=s.t,s.h,s.n`.
- **Latch: already latched** - a contact keeps the quadrant it pressed (`s.k[i]`); only an onset picks one, so a finger
  slid from one quadrant into the next holds the first note.
- **Cost:** Setup 835 / 838 -> 537 / 537 (defaults / corner; 371 free), Timer 0 -> 718 / 726. frames.json and the OG
  image unmoved.
- **Proved.** `lua-smoke.spec.ts` "QUADRANT: the four quadrants ...": no Timer armed; a press in the top-left slid into
  the top-right and lifted sends 48 on and off alone; the bottom-right 51; the host's 50 lights the bottom-left and its
  note-off darkens it, a note-on at 0 is an off, three mismatches leave it lit, nothing sent back; the top-right as
  controller 20 on wire channel 3, sent and received; the bottom-right's Receive Off.
