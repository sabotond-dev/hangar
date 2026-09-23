// CULL - five ratings you can tell apart without colour.
//
// A photographer culling a shoot presses the same five keys ten thousand times a year without
// looking at the screen. The pad is a legend: five horizontal bands, one per rating, each with
// its own COLOUR and its own FILL PATTERN (ZONA_GUI_SPEC.md 7.7 requires state readable without
// colour). A tap on a band sends its key and flashes the band's lit cells. No Timer, no MIDI, no
// channel knob; the Setup assigns `self.midirx_cb=nil` (change 17B: a previous landing's receive
// callback never survives this one). Knobs: @KEY1 (five adjacent usage ids), @DELAY, @FLASH (a divisor of 252), @DIM.
// Setup 584 of 908 at the all-longest corner (583 at the defaults), no Timer; restsBlack false.
// Kind "lua": `sends.showGrid` paints one gridColour and there is no keyboard in `sends`. The
// fills are a legend you learn once - they distinguish the five ratings, they do not name them.
// History: docs/entries/cull.md (09-07's measured fills; 09-04's idiom failure at 12, 24, 64;
// change 17B).
//
// MECHANISM
//   - Five bands over nine rows, split 2,2,1,2,2 from the top (five stars down to one). The band
//     index of a row is (y*5+2)//9 = 0,0,1,1,2,3,3,4,4 - one floored division; the +2 makes the
//     middle band a single row.
//   - THE FILLS ARE A ROW-MASK TABLE: M holds one nine-bit integer per ROW, and cell x of row y
//     is lit when (M[y+1] >> x) % 2 is 1:
//       row 0-1  511  #########  five stars, solid
//       row 2    341  #.#.#.#.#  four stars, a checker
//       row 3    170  .#.#.#.#.
//       row 4    146  .#..#..#.  three stars, three pips
//       row 5-6  257  #.......#  two stars, two pips at the edges
//       row 7-8   16  ....#....  one star, one pip in the centre
//   - C is a five-entry flat palette read at i = (y*5+2)//9*3. Layer 2 carries the legend at
//     C*@DIM//6 at phase 255; layer 1 carries the SAME colour at full, at phase 0 (black, because
//     glc's sixth argument forces the minimum stop) - invisible until a press lights it.
//   - The handler: `if e~=4 and e<9 then return end` (a press or a coalesced tap); b =
//     (y*9//128*5+2)//9 the band, computed from the row and never stored; the keystroke; then
//     the band's rows again, every LIT cell handed glpfs(a,1,252,256-252//@FLASH,0) and
//     glt(a,1,@FLASH) - the SHAPE brightens, not the rectangle.
//
// WHAT IT SENDS
//   gks(@DELAY, 0,2,@KEY1+4-b): one default delay, then ONE tuple - an ordinary key (is_modifier
//   0) sent DOWN-THEN-UP (state 2), the top band sending @KEY1+4. Four arguments; firmware
//   accepts a gks only when (nargs - 1) % 3 == 0, and a rejected gks is SILENT. HANGAR cannot
//   show the keystroke arriving (lua-host.ts records gks, nothing consumes it); the description
//   promises the picture, and docs/HARDWARE-AUDITION.md row 25 checks the wire.
//
// TRAPS
//   - EVERY @FLASH VALUE DIVIDES 252 - DO NOT ROUND THEM: rate 256 - 252//@FLASH from phase 252
//     lands on exactly 0 (12 -> step 21, 28 -> 9, 42 -> 6, 63 -> 4); at a length that does not
//     divide 252 the timeout expires part-way down and THE CELL FREEZES PART LIT. 24 and 64 are
//     the two that break it.
//   - NEVER A KEEPER ON LAYER 1: it carries a decay, and 65535 would strobe every flashed cell.
//   - THE gks ARITY RULE: (4 - 1) % 3 = 0, for the exact call shipped.
//   - @KEY1 + 4 < 256 AT EVERY KNOB VALUE: 30..34 (digits 1..5), 89..93 (keypad 1..5), 58..62
//     (F1..F5), each contiguous on the USB HID Keyboard/Keypad page (0x07) and read off that
//     table - a wrong usage id presses the wrong key and no gate here can catch it.
//   - THE DEFAULT DELAY IS 0..255 ONLY; @DELAY tops out at 20.
//   - CODE 9 IS HANDLED, AND A FAST TAP MUST RATE: the fire test is `e~=4 and e<9`; a branch on
//     e == 5 would miss every fast rating.
//   - THE BIT TEST IS `(M[y+1] >> x) % 2`, NOT `& 1` - DO NOT "TIDY" IT: the pinned minifier
//     rewrites `&1` as `& 1`, so a stored `&` is not a fixed point of compressScript.
//   - EVERY DIVISION IS FLOORED: n//9, the band index, the palette index, y*9//128, 252//@FLASH.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP: every palette channel is 0..255 and @DIM is at most
//     6, so C*@DIM//6 can never exceed the entry or go negative. @DIM is a multiplier over a
//     fixed divisor, never a divisor, so a larger number is brighter.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local M={511,511,341,170,146,257,257,16,16}local C={255,180,0,0,255,80,0,170,255,140,60,255,255,30,0}for n=0,80 do local y=n//9 if(M[y+1]>>n%9)%2>0 then local a=glag(0,n)local i=(y*5+2)//9*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1]*@DIM//6,C[i+2]*@DIM//6,C[i+3]*@DIM//6,1)glp(a,1,0)glp(a,2,255)end end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local b=(y*9//128*5+2)//9 gks(@DELAY,0,2,@KEY1+4-b)for r=0,8 do if(r*5+2)//9==b then for c=0,8 do if(M[r+1]>>c)%2>0 then local a=glag(0,c+r*9)glpfs(a,1,252,256-252//@FLASH,0)glt(a,1,@FLASH)end end end end end self.midirx_cb=nil";

const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CULL: CatalogEntry = {
  id: "cull",
  name: "Cull",
  description:
    "Rate a photo without leaving the keyboard: each rating has its own colour and its own shape.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["shortcuts", "precise", "readable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. NO CHANNEL KNOB: this card sends no MIDI.
  // TOKEN PREFIX CHECK: no one of @KEY1, @DELAY, @FLASH, @DIM shares a first letter with another.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY1",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST of five
      // contiguous ones - the ONE-star key. Digit 1 is the default (1..5 is what Lightroom,
      // Capture One and Photo Mechanic bind); keypad 1 and F1 the alternatives.
      values: ["30", "89", "58"],
      default: 0,
    },
    {
      id: "delay",
      label: "Key delay (ms)",
      kind: "feel",
      token: "@DELAY",
      // Firmware's own inter-step delay in milliseconds, 0..255; 20 is the widest anything asks.
      values: ["0", "5", "10", "20"],
      default: 0,
    },
    {
      id: "flash",
      label: "Flash length",
      kind: "feel",
      token: "@FLASH",
      // Ticks of decay on the flashed band, at 10 ms a tick. EVERY VALUE DIVIDES 252 (TRAPS).
      // NEVER A KEEPER on this layer.
      values: ["12", "28", "42", "63"],
      default: 1,
    },
    {
      id: "dim",
      label: "Legend brightness",
      kind: "amount",
      token: "@DIM",
      // A MULTIPLIER over a fixed divisor of 6, never a divisor of its own, so a larger number
      // is brighter. 6 is the palette itself; 2 a third of it, for a dark room.
      values: ["2", "3", "4", "6"],
      default: 1,
    },
  ],

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    key: 0,
    delay: 0,
    flash: 1,
    dim: 1,
  },

  // FALSE: thirty-six cells in five colours, none of them ever going out. frames.spec.ts test 5.
  restsBlack: false,
};
