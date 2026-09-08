// SWITCH - nine apps in nine blocks, each with its own mark.
//
// USE-CASES.md N8: nine windows, nine zones, one modifier chord per app. Nine
// identical squares are a keypad you have to count across every time; nine
// squares each carrying a different three-by-three MARK is a keypad you learn
// once and then hit without looking. The marks are drawn in the same alphabet
// HANGAR's own splash wallpaper uses - src/lib/ui/glyph-field.ts, GLYPHS: a
// cross, a ring, a square, a dot - which is read here for taste and IMPORTED
// NOWHERE, because a catalog entry is a Lua string and may import nothing.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - NINE 3x3 BLOCKS. Block z has zone-row z//3 and zone-column z%3, so its
//     top-left cell is z//3*27 + z%3*3 and cell k of it (k = 0..8) is that plus
//     k%3 + k//3*9. +y RUNS DOWN, so block 0 is the TOP-LEFT one and cell 0 of
//     a block is its top-left cell.
//   - EACH BLOCK CARRIES A NINE-BIT GLYPH. G holds one integer per block and
//     cell k is lit when (G[z+1] >> k) % 2 is 1. Nine integers is nine literals
//     and the drawing is one nested loop - the cheapest per-cell picture there
//     is. The nine, checked as data before a line of this file was written:
//
//       0  511  111111111  ###/###/###  a full square
//       1  341  101010101  #.#/.#./#.#  an X
//       2  186  010111010  .#./###/.#.  a cross
//       3  273  100010001  #../.#./..#  a diagonal
//       4  457  111001001  #../#../###  a corner
//       5   56  000111000  .../###/...  a bar
//       6  151  010010111  ###/.#./.#.  a T
//       7   42  000101010  .#./#.#/...  a chevron
//       8   16  000010000  .../.#./...  a centre dot
//
//     NINE DISTINCT INTEGERS, and the smallest pairwise difference over all
//     thirty-six pairs is TWO LIT CELLS - the X against the diagonal, which
//     differ in the two cells of the leading corner pair. No two marks are one
//     cell apart, so a single dead LED cannot turn one glyph into another.
//   - Lit cells take @ONC on layer 2, unlit cells @OFFC, and every cell of the
//     pad takes @ONC on layer 1 at phase 0 - which is black, because the sixth
//     argument of glc forces the layer's minimum stop black. Layer 1 is
//     therefore invisible until a press lights it.
//   - A tap lights the WHOLE pressed block on layer 1 with
//     glpfs(a,1,252,247,0) plus glt(a,1,28) and lets it decay back. The block
//     goes solid for 280 ms and then returns to its mark, which reads as "that
//     one" from across a room in a way a brightened glyph does not.
//   - timer is "". The glyph field is painted once and stays.
//
// THE KEYSTROKE, ONE CALL, AND ITS ARITY.
//
//   gks(10, 1,1,@MOD, 0,2,@KEY1+z, 1,0,@MOD)
//
// One leading default delay of 10 ms, then THREE TUPLES: modifier down, key
// DOWN-THEN-UP, modifier up. Ten arguments, and firmware rejects the call
// unless (nargs - 1) % 3 == 0: (10 - 1) % 3 = 0. A REJECTED gks IS SILENT, so
// that arithmetic is checked here rather than discovered at a bench.
//
// @KEY1 + 8 < 256 AT EVERY KNOB VALUE, because nine adjacent usage ids are
// sent. The four values and their tops, every one read off the USB HID Usage
// Tables' Keyboard/Keypad page (0x07): 30 -> 38 (digits 1..9), 89 -> 97
// (keypad 1..9), 58 -> 66 (F1..F9), 104 -> 112 (F13..F21). Every one of those
// runs is contiguous on that page. A wrong usage id is a card that presses the
// wrong key on somebody's machine and NO GATE IN THIS REPOSITORY CAN CATCH IT.
//
// @MOD DEFAULTS TO 227, LEFT GUI. Windows binds Win+1..9 to the taskbar out of
// the box and every Linux launcher worth the name binds the same chord, so the
// default configuration is one that works on a machine with nothing installed -
// which is the same argument STAGE makes for F13.
//
// THE LOOK, and why restsBlack is FALSE. Setup writes all eighty-one cells:
// the marks in @ONC and the field in @OFFC, both static, both lit from the
// first tick.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE BIT TEST IS `(g >> k) % 2`, NOT `g >> k & 1` - DO NOT "TIDY" IT. The
//     pinned minifier rewrites `&1` as `& 1` and `2^k` as `2 ^ k`, so a stored
//     `&` or `^` is not a fixed point of compressScript and the canonical-form
//     gate goes red; `>>` survives byte for byte. Measured, all three ways,
//     before this entry was written, because a shift is not a construct any of
//     the nineteen entries before it used.
//   - PRECEDENCE: `%` BINDS TIGHTER THAN `>>`, so the parentheses around the
//     shift are load-bearing. `g>>k%2` is `g >> (k%2)`, which is a different
//     number and lights the wrong cells - silently.
//   - THE DECAY LENGTH DIVIDES 252. The rate is 247, which is 256 - 252//28,
//     and the starting phase is 252, so the phase steps by 9 and lands on
//     exactly 0 after exactly 28 ticks. At a length that does not divide 252
//     the timeout expires part-way down, firmware zeroes the rate and the
//     pressed block FREEZES PART LIT - the failure 09-04 measured on this
//     idiom. 28 and 247 are a pair; change neither alone.
//   - NEVER A KEEPER ON THIS LAYER. Layer 1 carries a decay, so a 65535 timeout
//     here would strobe every pressed block forever. The stored Setup holds no
//     65535 at all.
//   - THE gks ARITY RULE, above, for the exact call shipped.
//   - @KEY1 + 8 < 256 AT EVERY KNOB VALUE, above.
//   - CODE 9 IS HANDLED. A fast tap arrives as a single DOWNUP with no separate
//     press or lift, so the fire test is `e ~= 4 and e < 9` returning early -
//     which fires on a press (4) and on a DOWNUP (9) and on nothing else. An
//     app switcher is used at speed, so a branch written against e == 5 would
//     miss most of its presses.
//   - EVERY DIVISION IS FLOORED. The block origin, the cell offset and both
//     coordinate divisions are `//`; a fractional argument to a firmware call
//     silently becomes 0.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every value of
//     @ONC and @OFFC is inside 0..255 by construction, and nothing scales them.
//
// THE HONEST LIMIT, for the card copy. TWO, and both matter.
//
//   HANGAR CANNOT SHOW THE KEYSTROKE ARRIVING. gks is recorded and inert in the
//   browser: src/lib/sim/lua-host.ts binds it to recordHid and says at :429
//   that nothing in HANGAR consumes them. Everything you can see on this card
//   is checked; the nine chords it exists to send are checked by nothing here.
//
//   AND NINE GLYPHS ARE A MNEMONIC, NOT LABELS. The pad makes the nine blocks
//   TELLABLE APART; which app is behind which mark is a decision you make and
//   remember. It cannot draw your icons and it does not pretend to.
//
// Row 27 of docs/HARDWARE-AUDITION.md is where both are checked.
//
// ROUTE: kind "lua", not kind "state", and the send is the first reason.
// THE SEND: there is NO KEYBOARD IN `sends`. The vocabulary is
// none | xy | zones | faders | trackpad | dial (_pad.ts:185), and the only HID
// kind among them is `sends.trackpad` (_pad.ts:334), which is a mouse - a
// relative pointer and a button bitmask, with no usage id anywhere in it. A
// configuration whose whole output is keystrokes is outside PadState before the
// picture is even considered.
// THE PICTURE, second and still decisive: nine distinct 3x3 glyphs are
// eighty-one individually chosen cells, and `sends.showGrid` paints its zones
// in ONE `gridColour` (_pad.ts:331-332). As zones plus showGrid this card would
// be `ninepads` with a different send, and overlap is a rejection reason in
// this repository - the glyphs are what make it a different card at all.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 487 characters, no Timer, a fixed point of
// compressScript and accepted by checkSyntax. The all-longest corner of the
// four-knob cross-product is 488, leaving 420 free of 908, and the all-shortest
// corner is 483. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of
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
  "--[[@cb]]local G={511,341,186,273,457,56,151,42,16}for z=0,8 do local r=z//3*27+z%3*3 local g=G[z+1]for k=0,8 do local a=glag(0,r+k%3+k//3*9)glc(a,1,@ONC,1)glp(a,1,0)if(g>>k)%2>0 then glc(a,2,@ONC,1)else glc(a,2,@OFFC,1)end glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local z=x*3//128+y*3//128*3 local r=z//3*27+z%3*3 for k=0,8 do local a=glag(0,r+k%3+k//3*9)glpfs(a,1,252,247,0)glt(a,1,28)end gks(10,1,1,@MOD,0,2,@KEY1+z,1,0,@MOD)end";

const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SWITCH: CatalogEntry = {
  id: "switch",
  name: "SWITCH",
  description:
    "Nine apps in nine blocks, each with its own mark, so you find one without reading anything.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "hotkeys", "grid" and "utility" all retire. Nine app blocks you find
  // without reading anything is shortcuts, readable and perfectly still.
  tags: ["shortcuts", "readable", "still"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text. NO CHANNEL KNOB: this card
  // sends no MIDI at all. The default delay and the decay pair are LITERALS,
  // not knobs.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @KEY1, @MOD, @ONC and
  // @OFFC. renderLua substitutes by plain String.replaceAll, so a token that is
  // a prefix of another is eaten or corrupted depending on knob order. @ONC and
  // @OFFC share only the @O and neither continues into the other.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY1",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST
      // of nine contiguous ones: digit 1 (30..38), keypad 1 (89..97), F1
      // (58..66) and F13 (104..112). Digit 1 is the default because the chord
      // this card is built around is a modifier plus 1..9.
      values: ["30", "89", "58", "104"],
      default: 0,
    },
    {
      id: "modifier",
      label: "Modifier",
      kind: "mode",
      token: "@MOD",
      // A modifier usage id from the same page: 224 left control, 227 left GUI,
      // 226 left alt, 225 left shift. Sent as its own down tuple before the key
      // and its own up tuple after it. The DEFAULT IS 227 - Win+1..9 is the
      // taskbar chord on Windows and the launcher chord on most Linux desktops,
      // so the shipped configuration works with nothing installed.
      values: ["224", "227", "226", "225"],
      default: 1,
    },
    {
      id: "on",
      label: "Glyph colour",
      kind: "colour",
      token: "@ONC",
      // The lit cells of a mark, on layer 2, and the whole block during a
      // press, on layer 1. Warm white first: a mark is a shape rather than a
      // signal, and a shape reads best in the least coloured light available.
      values: ["255,240,120", "0,255,180", "255,255,255", "180,120,255"],
      default: 0,
    },
    {
      id: "off",
      label: "Field colour",
      kind: "colour",
      token: "@OFFC",
      // The unlit cells, on layer 2 only. Deliberately near-black: the field is
      // there so the pad is not nine holes, and a field bright enough to
      // compete with the marks would undo the whole card.
      values: ["30,30,40", "40,30,20", "20,40,35", "35,25,40"],
      default: 0,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    key: 0,
    modifier: 1,
    on: 0,
    off: 0,
  },

  // FALSE. Setup writes all eighty-one cells and every one of them is lit -
  // the marks brightly, the field faintly. frames.spec.ts test 5 turns that
  // declaration into a checked fact.
  restsBlack: false,
};
