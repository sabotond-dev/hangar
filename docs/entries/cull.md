# CULL - the history behind src/lib/catalog/entries/cull.ts

CULL is the five photo ratings a colour-blind visitor can tell apart: five horizontal bands, each
with its own colour and its own fill pattern, a keystroke per tap and a flash on the band's lit
cells. Its source is `src/lib/catalog/entries/cull.ts`. 09-07 authored it, measuring the five
fills before the file was written, on the decay idiom whose failure at trail lengths that do not
divide 252 09-04 had measured. The entry's own header now carries the mechanism, the wire and the
traps; everything the header said before 13.2-02 - the use-case citation, the geometry reasoning,
the honest limits and the route argument - is below, verbatim.

## Moved from src/lib/catalog/entries/cull.ts on 2026-09-13 (13.2-02)

```text
CULL - five ratings you can tell apart without colour.

A photographer culling a shoot presses the same five keys ten thousand times
a year, and looks away from the screen for none of them. The pad is a
legend: five horizontal bands, one per rating, each with its own COLOUR and
its own FILL PATTERN. The pattern is the point. USE-CASES.md N4 cites
ZONA_GUI_SPEC.md 7.7, which requires state to be readable without colour, and
a card that claims shape and ships two identical fills is worse than one that
claims only colour. The five fills were therefore MEASURED before this file
was written; the measurement is in the SUMMARY and it is repeated below.

THE MECHANISM, with its 9x9 arithmetic.

  - THE GEOMETRY, chosen and written out. Five bands over nine rows, split
    2,2,1,2,2 from the top: rows 0-1 are five stars, rows 2-3 four, row 4
    three, rows 5-6 two, rows 7-8 one. The band index of a row is
    (y*5 + 2)//9, which is 0,0,1,1,2,3,3,4,4 - one floored division rather
    than a chain of comparisons, and the +2 is what makes the middle band a
    single row instead of the split landing 2,2,2,2,1.
  - THE FILLS ARE A ROW-MASK TABLE, not a chain of predicates. M holds one
    nine-bit integer per ROW; cell x of row y is lit when (M[y+1] >> x) % 2
    is 1. Nine integers is nine literals and the drawing is one loop, which
    is the cheapest per-cell picture available - and it makes the geometry
    auditable as data rather than as arithmetic:

      row 0  511  #########  five stars, solid
      row 1  511  #########
      row 2  341  #.#.#.#.#  four stars, a checker
      row 3  170  .#.#.#.#.
      row 4  146  .#..#..#.  three stars, three pips
      row 5  257  #.......#  two stars, two pips at the edges
      row 6  257  #.......#
      row 7   16  ....#....  one star, one pip in the centre
      row 8   16  ....#....

    Three of the five happen to COUNT themselves and two do not, so the
    fills stay a legend rather than a label - see the honest limit below.
  - The band's colour comes from C, a five-entry flat palette read at
    i = (y*5+2)//9*3. Layer 2 carries the legend at C*@DIM//6 and layer 1
    carries the SAME colour at full, sitting at phase 0 - which is black,
    because the sixth argument of glc forces the layer's minimum stop black.
    Layer 1 is therefore invisible until a press lights it.
  - A tap runs the band's rows again and hands every LIT cell
    glpfs(a,1,252,256-252//@FLASH,0) plus glt(a,1,@FLASH). Only the lit cells
    flash, so the SHAPE brightens rather than the rectangle, which is what
    makes the flash confirm the rating rather than merely the row.
  - timer is "". The legend is static, and nothing on this pad moves without
    a hand on it.

THE KEYSTROKE, ONE CALL, AND ITS ARITY.

  gks(@DELAY, 0,2,@KEY1+4-b)

One leading default delay, then ONE tuple: an ordinary key (is_modifier 0)
sent DOWN-THEN-UP (state 2). Four arguments, and firmware rejects the call
unless (nargs - 1) % 3 == 0: (4 - 1) % 3 = 0. A REJECTED gks IS SILENT, so
the arithmetic is checked here rather than discovered at a bench.

@KEY1 + 4 < 256 AT EVERY KNOB VALUE, because five adjacent usage ids are
sent and the band index b runs 0..4 with the TOP band sending @KEY1 + 4. The
three values and their tops: 30 -> 34 (digits 1..5), 89 -> 93 (keypad 1..5),
58 -> 62 (F1..F5). Every one of those runs is contiguous in the USB HID Usage
Tables' Keyboard/Keypad page (0x07), and each was read off that table rather
than remembered - a wrong usage id is a card that presses the wrong key on
somebody's machine and NO GATE IN THIS REPOSITORY CAN CATCH IT.

THE LOOK, and why restsBlack is FALSE. Setup paints thirty-six cells across
five bands and every one of them is still lit at every sampled tick, so the
card arrives as a readable legend rather than as a black square.

THE TRAPS THIS ENTRY CONTAINS.

  - EVERY @FLASH VALUE DIVIDES 252, AND THAT IS NOT DECORATION - DO NOT
    ROUND THEM. The decay rate is 256 - 252//@FLASH and the starting phase is
    252, so the product is exactly 252 and the phase lands on exactly 0 at
    every setting: 12 ticks -> step 21, 28 -> 9, 42 -> 6, 63 -> 4. At a
    length that does NOT divide 252 the timeout expires part-way down,
    firmware sets the rate to zero and THE CELL FREEZES PART LIT - which is
    the failure 09-04 measured on this exact idiom at 12, 24 and 64. The
    rounder-looking 24 and 64 are the two that break it.
  - NEVER A KEEPER ON THIS LAYER. Layer 1 carries a decay, so a 65535
    timeout here would replace the countdown and strobe every flashed cell
    forever. The stored Setup holds no 65535 at all.
  - THE gks ARITY RULE, above, for the exact call shipped.
  - @KEY1 + 4 < 256 AT EVERY KNOB VALUE, above.
  - THE DEFAULT DELAY IS 0..255 ONLY. @DELAY tops out at 20 ms; a value above
    255 would be truncated by firmware into a delay nobody asked for.
  - CODE 9 IS HANDLED, AND A FAST TAP MUST RATE. A photographer rates faster
    than the sensor's cycle, so the fire test is `e ~= 4 and e < 9` returning
    early - which fires on a press (4) and on a DOWNUP (9) and on nothing
    else. A branch written against e == 5 would miss every fast rating.
  - EVERY DIVISION IS FLOORED. y = n//9, the band index, the palette index,
    the coordinate division y*9//128 and the decay step are all `//`; a
    fractional argument to a firmware call silently becomes 0.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every palette channel is inside
    0..255 and the legend is C*@DIM//6 with @DIM at most 6, so the dimmed
    value can never exceed the palette entry and can never go negative.
  - THE BIT TEST IS `(M[y+1] >> x) % 2`, NOT `& 1` - DO NOT "TIDY" IT. The
    pinned minifier rewrites `&1` as `& 1`, so a stored `&` is not a fixed
    point of compressScript and the canonical-form gate goes red; `>>`
    survives untouched. Measured, both ways, before this entry was written.
  - THE BAND INDEX IS COMPUTED FROM THE ROW, NEVER STORED. `(y*5+2)//9` is
    evaluated in Setup and again in the handler, so the two can never drift.

THE HONEST LIMIT, for the card copy. TWO, and both matter.

  HANGAR CANNOT SHOW THE KEYSTROKE ARRIVING. gks is recorded and inert in the
  browser: src/lib/sim/lua-host.ts binds it to recordHid and says at :429
  that nothing in HANGAR consumes them. The picture on this card is checked
  by four gates; the output is checked by none of them, which is why the
  description promises the picture and never the result. Row 25 of
  docs/HARDWARE-AUDITION.md is where the wire and the perception are checked.

  AND THE FILLS ARE A LEGEND YOU LEARN ONCE. They distinguish the five
  ratings; they do not NAME them. The bottom three read as one, two and three
  pips by luck of the geometry, and the top two do not read as four and five
  at all - so the pad tells a colour-blind visitor that two ratings are
  different, and never which is which without learning the order.

ROUTE: kind "lua", not kind "state", for two independent reasons.
THE PICTURE: `sends.showGrid` paints its zones in ONE `gridColour`
(_pad.ts:331-332) - a single colour for the whole grid, with no per-band
colour and no per-cell fill anywhere in the sheet. Five bands in five
colours, each with its own mask, is not expressible.
THE SEND: there is NO KEYBOARD IN `sends`. The vocabulary is
none | xy | zones | faders | trackpad | dial (_pad.ts:185), and the only HID
kind among them is `sends.trackpad` (_pad.ts:334), which is a mouse. A
configuration whose whole output is keystrokes is outside PadState by
absence, not by a type.

THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
by renderLua it is byte-identical to the canonical text measured against the
pinned minifier: Setup 564 characters, no Timer, a fixed point of
compressScript and accepted by checkSyntax. The all-longest corner of the
four-knob cross-product is 565, leaving 343 free of 908, and the all-shortest
corner is 564. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of
those claims.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them: a trailing comment was measured surviving
verbatim into the budget. Everything worth saying about this configuration is
said here, in TypeScript, where it costs nothing.
```

## Change 17B, 2026-09-23: no MIDI, and a previous landing's receive cleared (`BENCH-2026-09-16.txt` sections 17 and 18)

CULL sends keystrokes (`gks`), not MIDI, so it declares no output and gains no knob (the rack, the stamp and both
captured wild records are unmoved: they still land `restored`). Section 17's decision - every card assigns its own
receive callback or nil, so a previous landing's never survives a Store - is its one change: the Setup closes with
`self.midirx_cb=nil`. Setup 564 / 565 -> 583 / 584 (defaults / corner; 324 free); no Timer; frames.json and the OG
image unmoved. **Latch: already latched** - the handler acts on the onset alone (`if e~=4 and e<9 then return end`),
so a finger that lands on one band and slides across the others rates once. `lua-smoke.spec.ts` "CULL: no MIDI ...":
one keystroke for a press slid across all five bands, no MIDI, no callback over a previous landing's.
