// CULL - five ratings you can tell apart without colour.
//
// A photographer culling a shoot presses the same five keys ten thousand times
// a year, and looks away from the screen for none of them. The pad is a
// legend: five horizontal bands, one per rating, each with its own COLOUR and
// its own FILL PATTERN. The pattern is the point. USE-CASES.md N4 cites
// ZONA_GUI_SPEC.md 7.7, which requires state to be readable without colour, and
// a card that claims shape and ships two identical fills is worse than one that
// claims only colour. The five fills were therefore MEASURED before this file
// was written; the measurement is in the SUMMARY and it is repeated below.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - THE GEOMETRY, chosen and written out. Five bands over nine rows, split
//     2,2,1,2,2 from the top: rows 0-1 are five stars, rows 2-3 four, row 4
//     three, rows 5-6 two, rows 7-8 one. The band index of a row is
//     (y*5 + 2)//9, which is 0,0,1,1,2,3,3,4,4 - one floored division rather
//     than a chain of comparisons, and the +2 is what makes the middle band a
//     single row instead of the split landing 2,2,2,2,1.
//   - THE FILLS ARE A ROW-MASK TABLE, not a chain of predicates. M holds one
//     nine-bit integer per ROW; cell x of row y is lit when (M[y+1] >> x) % 2
//     is 1. Nine integers is nine literals and the drawing is one loop, which
//     is the cheapest per-cell picture available - and it makes the geometry
//     auditable as data rather than as arithmetic:
//
//       row 0  511  #########  five stars, solid
//       row 1  511  #########
//       row 2  341  #.#.#.#.#  four stars, a checker
//       row 3  170  .#.#.#.#.
//       row 4  146  .#..#..#.  three stars, three pips
//       row 5  257  #.......#  two stars, two pips at the edges
//       row 6  257  #.......#
//       row 7   16  ....#....  one star, one pip in the centre
//       row 8   16  ....#....
//
//     Three of the five happen to COUNT themselves and two do not, so the
//     fills stay a legend rather than a label - see the honest limit below.
//   - The band's colour comes from C, a five-entry flat palette read at
//     i = (y*5+2)//9*3. Layer 2 carries the legend at C*@DIM//6 and layer 1
//     carries the SAME colour at full, sitting at phase 0 - which is black,
//     because the sixth argument of glc forces the layer's minimum stop black.
//     Layer 1 is therefore invisible until a press lights it.
//   - A tap runs the band's rows again and hands every LIT cell
//     glpfs(a,1,252,256-252//@FLASH,0) plus glt(a,1,@FLASH). Only the lit cells
//     flash, so the SHAPE brightens rather than the rectangle, which is what
//     makes the flash confirm the rating rather than merely the row.
//   - timer is "". The legend is static, and nothing on this pad moves without
//     a hand on it.
//
// THE KEYSTROKE, ONE CALL, AND ITS ARITY.
//
//   gks(@DELAY, 0,2,@KEY1+4-b)
//
// One leading default delay, then ONE tuple: an ordinary key (is_modifier 0)
// sent DOWN-THEN-UP (state 2). Four arguments, and firmware rejects the call
// unless (nargs - 1) % 3 == 0: (4 - 1) % 3 = 0. A REJECTED gks IS SILENT, so
// the arithmetic is checked here rather than discovered at a bench.
//
// @KEY1 + 4 < 256 AT EVERY KNOB VALUE, because five adjacent usage ids are
// sent and the band index b runs 0..4 with the TOP band sending @KEY1 + 4. The
// three values and their tops: 30 -> 34 (digits 1..5), 89 -> 93 (keypad 1..5),
// 58 -> 62 (F1..F5). Every one of those runs is contiguous in the USB HID Usage
// Tables' Keyboard/Keypad page (0x07), and each was read off that table rather
// than remembered - a wrong usage id is a card that presses the wrong key on
// somebody's machine and NO GATE IN THIS REPOSITORY CAN CATCH IT.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints thirty-six cells across
// five bands and every one of them is still lit at every sampled tick, so the
// card arrives as a readable legend rather than as a black square.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - EVERY @FLASH VALUE DIVIDES 252, AND THAT IS NOT DECORATION - DO NOT
//     ROUND THEM. The decay rate is 256 - 252//@FLASH and the starting phase is
//     252, so the product is exactly 252 and the phase lands on exactly 0 at
//     every setting: 12 ticks -> step 21, 28 -> 9, 42 -> 6, 63 -> 4. At a
//     length that does NOT divide 252 the timeout expires part-way down,
//     firmware sets the rate to zero and THE CELL FREEZES PART LIT - which is
//     the failure 09-04 measured on this exact idiom at 12, 24 and 64. The
//     rounder-looking 24 and 64 are the two that break it.
//   - NEVER A KEEPER ON THIS LAYER. Layer 1 carries a decay, so a 65535
//     timeout here would replace the countdown and strobe every flashed cell
//     forever. The stored Setup holds no 65535 at all.
//   - THE gks ARITY RULE, above, for the exact call shipped.
//   - @KEY1 + 4 < 256 AT EVERY KNOB VALUE, above.
//   - THE DEFAULT DELAY IS 0..255 ONLY. @DELAY tops out at 20 ms; a value above
//     255 would be truncated by firmware into a delay nobody asked for.
//   - CODE 9 IS HANDLED, AND A FAST TAP MUST RATE. A photographer rates faster
//     than the sensor's cycle, so the fire test is `e ~= 4 and e < 9` returning
//     early - which fires on a press (4) and on a DOWNUP (9) and on nothing
//     else. A branch written against e == 5 would miss every fast rating.
//   - EVERY DIVISION IS FLOORED. y = n//9, the band index, the palette index,
//     the coordinate division y*9//128 and the decay step are all `//`; a
//     fractional argument to a firmware call silently becomes 0.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every palette channel is inside
//     0..255 and the legend is C*@DIM//6 with @DIM at most 6, so the dimmed
//     value can never exceed the palette entry and can never go negative.
//   - THE BIT TEST IS `(M[y+1] >> x) % 2`, NOT `& 1` - DO NOT "TIDY" IT. The
//     pinned minifier rewrites `&1` as `& 1`, so a stored `&` is not a fixed
//     point of compressScript and the canonical-form gate goes red; `>>`
//     survives untouched. Measured, both ways, before this entry was written.
//   - THE BAND INDEX IS COMPUTED FROM THE ROW, NEVER STORED. `(y*5+2)//9` is
//     evaluated in Setup and again in the handler, so the two can never drift.
//
// THE HONEST LIMIT, for the card copy. TWO, and both matter.
//
//   HANGAR CANNOT SHOW THE KEYSTROKE ARRIVING. gks is recorded and inert in the
//   browser: src/lib/sim/lua-host.ts binds it to recordHid and says at :429
//   that nothing in HANGAR consumes them. The picture on this card is checked
//   by four gates; the output is checked by none of them, which is why the
//   description promises the picture and never the result. Row 25 of
//   docs/HARDWARE-AUDITION.md is where the wire and the perception are checked.
//
//   AND THE FILLS ARE A LEGEND YOU LEARN ONCE. They distinguish the five
//   ratings; they do not NAME them. The bottom three read as one, two and three
//   pips by luck of the geometry, and the top two do not read as four and five
//   at all - so the pad tells a colour-blind visitor that two ratings are
//   different, and never which is which without learning the order.
//
// ROUTE: kind "lua", not kind "state", for two independent reasons.
// THE PICTURE: `sends.showGrid` paints its zones in ONE `gridColour`
// (_pad.ts:331-332) - a single colour for the whole grid, with no per-band
// colour and no per-cell fill anywhere in the sheet. Five bands in five
// colours, each with its own mask, is not expressible.
// THE SEND: there is NO KEYBOARD IN `sends`. The vocabulary is
// none | xy | zones | faders | trackpad | dial (_pad.ts:185), and the only HID
// kind among them is `sends.trackpad` (_pad.ts:334), which is a mouse. A
// configuration whose whole output is keystrokes is outside PadState by
// absence, not by a type.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 564 characters, no Timer, a fixed point of
// compressScript and accepted by checkSyntax. The all-longest corner of the
// four-knob cross-product is 565, leaving 343 free of 908, and the all-shortest
// corner is 564. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of
// those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local M={511,511,341,170,146,257,257,16,16}local C={255,180,0,0,255,80,0,170,255,140,60,255,255,30,0}for n=0,80 do local y=n//9 if(M[y+1]>>n%9)%2>0 then local a=glag(0,n)local i=(y*5+2)//9*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1]*@DIM//6,C[i+2]*@DIM//6,C[i+3]*@DIM//6,1)glp(a,1,0)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local b=(y*9//128*5+2)//9 gks(@DELAY,0,2,@KEY1+4-b)for r=0,8 do if(r*5+2)//9==b then for c=0,8 do if(M[r+1]>>c)%2>0 then local a=glag(0,c+r*9)glpfs(a,1,252,256-252//@FLASH,0)glt(a,1,@FLASH)end end end end end";

const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CULL: CatalogEntry = {
  id: "cull",
  name: "CULL",
  description:
    "Rate a photo without leaving the keyboard: each rating has its own colour and its own shape.",
  // Feel-based, never a compiler kind (CONT-03). "photo" and "accessible" are
  // both coined here. "accessible" is a singleton until QUADRANT takes it in
  // wave 9, when it becomes a standing chip; that is deliberate.
  tags: ["photo", "accessible", "utility", "precise"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text. NO CHANNEL KNOB: this card
  // sends no MIDI at all, so there is nothing for one to select.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @KEY1, @DELAY, @FLASH
  // and @DIM. renderLua substitutes by plain String.replaceAll, so a token that
  // is a prefix of another is eaten or corrupted depending on knob order. No
  // one of these four shares even a first letter with another.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY1",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST
      // of five contiguous ones - the ONE-star key, because the bottom band is
      // one star and the top band sends this plus four. Digit 1 (30..34) is the
      // default because 1..5 is what Lightroom, Capture One and Photo Mechanic
      // all bind out of the box; keypad 1 (89..93) is for a full-size keyboard,
      // F1 (58..62) for an application that has taken the digits already.
      values: ["30", "89", "58"],
      default: 0,
    },
    {
      id: "delay",
      label: "Key delay",
      kind: "feel",
      token: "@DELAY",
      // Firmware's own inter-step delay, in milliseconds, 0..255. Zero is right
      // for a plain digit; an application that drops keys arriving inside one
      // frame needs a few milliseconds, and 20 is the widest anything sane asks
      // for.
      values: ["0", "5", "10", "20"],
      default: 0,
    },
    {
      id: "flash",
      label: "Flash length",
      kind: "feel",
      token: "@FLASH",
      // Ticks of decay on the flashed band, at 10 ms a tick. EVERY VALUE
      // DIVIDES 252, because the rate is 256 - 252//@FLASH and the phase starts
      // at 252, so the product is exactly 252 and the fade lands on exactly 0
      // at every setting - see the header. NEVER A KEEPER: this layer carries a
      // decay, and 65535 here would strobe every flashed cell forever.
      values: ["12", "28", "42", "63"],
      default: 1,
    },
    {
      id: "dim",
      label: "Legend brightness",
      kind: "amount",
      token: "@DIM",
      // A MULTIPLIER over a fixed divisor of 6, never a divisor of its own: the
      // label says brightness, so a larger number must be brighter, and a knob
      // sitting on a divisor takes the whole legend towards black at its top
      // value while reading as though it did the opposite. 6 is the palette
      // itself; 2 is a third of it, for a dark room.
      values: ["2", "3", "4", "6"],
      default: 1,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    key: 0,
    delay: 0,
    flash: 1,
    dim: 1,
  },

  // FALSE. Setup paints thirty-six cells in five colours and none of them ever
  // goes out. frames.spec.ts test 5 turns that declaration into a checked fact.
  restsBlack: false,
};
