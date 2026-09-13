// LUMEN - a colour picker that is the colour it is sending.
//
// Hue runs across the pad, depth runs down it, and the pad paints itself in the colour it is
// about to send: there is no legend because the pad is the legend. Setup paints the field once
// and `timer: ""` - nothing runs after it. Knobs: @CC (two adjacent controllers), @CH, @CURSORC
// (the cursor's white) and @DEPTH (the ramp's multiplier, 1..4). Setup 733 of 908 at the picker
// corner (730 at the defaults), Timer 0. Kind "lua", not "state": eighty-one distinct computed
// colours are not a PadState. The touch library is a separate budget on the system element
// (255/0 842, 255/6 873 since 12.1-08b; library.ts section 1).
// History: docs/entries/lumen.md (11-09.2, 11-10, 12-01, 12-11, 12.1-04 costings and verdicts).
//
// MECHANISM
//   - Cell n = 0..80: column n%9, row n//9; `glag(0,n)` once.
//   - Hue is a flat nine-entry anchor table: H holds twenty-seven numbers, three per column, and
//     column c reads H[c*3+1..c*3+3]. Eight are a hue wheel forty degrees apart, offset so no
//     column is a bare primary; the ninth (column 8) is an amber white, 255,230,190.
//   - Depth is one multiply and one floor: d = 32 - row*@DEPTH, every channel anchor*d//32. Row 0
//     is d = 32 at every knob value - the anchor row never moves - and the bottom row is d = 24,
//     16, 8 or 0, so @DEPTH 4 turns it OFF. A larger @DEPTH is a deeper ramp.
//   - Both layers carry the same colour (one layer caps at 254/512 of the asked colour); every
//     phase is written to 255 once, in F's first paint. `F(n)` paints cell n and RETURNS r,g,b;
//     on a cell change the handler calls it twice - once to restore the cell being left, once to
//     read the colour of the cell entered - then paints @CURSORC over the new cell on layers 1
//     and 2. `s.c` is the cursor cell (which cell is painted over); the library's `Q` owns which
//     cell a contact is on.
//   - The touch handler's order, and each step is a measurement: `Q(s,i,e,x,y)` (the hysteresis
//     cell, returned only on a change or an onset; it expires the contact on an end code, so a
//     lift reaches the library), `G(s,i,e,x,y,0,@CURSORC)` (the bilinear finger on layer 0, the
//     layer F never writes; G re-asserts the colour every call, which heals the alert layer),
//     the end test `e~=1 and e~=4 and e<9`, the cursor block `if n then ... end`, then
//     `A(s,i,e,x,y,@CC,@CC+1,@CH)` OUTSIDE that block so a move inside one cell still sends its
//     axis. Q before G because `E` clears the block through `V` on every onset; G before the end
//     test so a lift clears the finger.
//   - No `X`: there is no Timer to sweep from and the card holds no note; a lost lift leaves a
//     stale `H[i]` that the next press by that id expires.
//
// WHAT IT SENDS
//   @CC      raw x, through the library's `A`, only when x moved
//   @CC + 1  127-y, through the same `A`, only when y moved (inverted; a fader does not grow down)
//   sysex    the colour under the finger as SIX ASCII HEX DIGITS, whenever `Q` returns a cell:
//            gmss(240,125,D(r//16),D(r%16),D(g//16),D(g%16),D(b//16),D(b%16),247) - 0xF0 supplied
//            by this configuration, 0x7D the non-commercial manufacturer id, "FF" "5A" "00" at the
//            top-left cell, 0xF7. Every gmss argument is one payload byte and the caller supplies
//            the framing (grid_lua_api.c:905-935; grid_decode.c:96-100 transmits unframed anyway).
//            `D(v)` is `v<10 and 48+v or 55+v`: '0'..'9' then 'A'..'F'. Hex and not raw RGB because
//            sysex data bytes are seven-bit and row 0 emits a channel of 255.
//   A down primes without sending (`A` gates on e<4): the first CC of a gesture is the first move.
//
// TRAPS
//   - `local function D` AND `local function F` SHADOW LIBRARY NAMES INSIDE THIS CHUNK, AND THAT
//     IS HARMLESS - DO NOT "FIX" THE NAMES. The library defines a global `D(n,l,w)` (a decay)
//     and this entry declares a local `D(v)` (a hex digit); it also declares a local `F(n)` while
//     the library defines no `F` at all. A `local function` is visible only inside the body that
//     declares it, so this entry's `D` and `F` are its own and the library's `E` and `Q` resolve
//     their own names in their own chunk. Renaming them would cost characters and buy nothing.
//     What an entry must NOT do is assign a single-capital GLOBAL the library owns, which
//     host-surface.spec.ts refuses outright.
//   - EVERY DIVISION IS FLOORED: anchor*d//32, n%9, n//9, r//16, r%16. A fraction reaching a
//     firmware call becomes 0, silently.
//   - THE CONTROLLERS SEND x UNSCALED AND y INVERTED, AND BOTH ARE FIXES. `x*127//128` maps
//     0..127 onto 0..126 and can never emit 127; this entry never calls txma or tyma, so the
//     touch range IS 0..127 and there was nothing to scale.
//   - SYSEX DATA BYTES ARE SEVEN-BIT AND NOTHING IN HANGAR CHECKS THAT: lua-host.ts records what
//     was asked byte for byte, and `gmss` is not in _pad.ts's OUT_CALLS. The encoding here and
//     lua-smoke.spec.ts's clause (every emitted data byte 0..127) are the only guards; a second
//     sysex entry needs its own.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP - a 260 renders as 4, a negative as garbage. The
//     depth divisor is the LITERAL 32 and never a knob; `8*max(@DEPTH) <= 32` WITH EQUALITY
//     ALLOWED is the whole guarantee (8*4 lands the bottom row on exact black; 5 would land it on
//     -8). The knob's four values {1, 2, 3, 4} are the whole legal travel, and lua-smoke.spec.ts
//     reddens if one is widened without the other.
//   - THE CURSOR RESTORES, IT DOES NOT REPAINT. DO NOT SIMPLIFY THIS to "call F over all
//     eighty-one cells": touch_cb has a 1000-microsecond budget at 100 Hz, eighty-one cells is
//     four firmware calls each, and a handler that overruns drops touch samples exactly when the
//     finger moves fastest. Two F calls plus a glc pair is the whole repaint, at most two cells
//     per sample, and only when the cell changes or a contact begins.
//   - CODE 9 (a fast tap as one DOWNUP) IS HANDLED IN TWO PLACES: the entry's `e~=1 and e~=4 and
//     e<9` and the library's `Q` through its own `e==4 or e>8`.
//   - @CC + 1 < 128 AT EVERY KNOB VALUE: the four top out at 17, 49, 81 and 103.
//   - NO KEEPER AND NO DECAY in the Setup STRING (no glt, glf or glpfs) - a claim about the
//     string, not this file, and not about the library string, whose decay this card never calls.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//   - restsBlack is FALSE: 171 of the frame's 243 bytes are non-zero at every tick (152 at
//     @DEPTH 4, where the bottom row goes out). frames.spec.ts test 5 checks it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local H={255,90,0,200,255,0,30,255,0,0,255,150,0,150,255,30,0,255,200,0,255,255,0,100,255,230,190}local function D(v)return v<10 and 48+v or 55+v end local function F(n)local a=glag(0,n)local i=n%9*3 local d=32-n//9*@DEPTH local r=H[i+1]*d//32 local g=H[i+2]*d//32 local b=H[i+3]*d//32 glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)return r,g,b end for n=0,80 do F(n)end self.c=-1 self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@CURSORC)if e~=1 and e~=4 and e<9 then return end if n then if s.c>=0 then F(s.c)end local r,g,b=F(n)gmss(240,125,D(r//16),D(r%16),D(g//16),D(g%16),D(b//16),D(b%16),247)local a=glag(0,n)glc(a,1,@CURSORC,1)glc(a,2,@CURSORC,1)s.c=n end A(s,i,e,x,y,@CC,@CC+1,@CH)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const LUMEN: CatalogEntry = {
  id: "lumen",
  name: "Lumen",
  description:
    "A colour picker for a lighting desk: hue across, depth down, and the colour goes out as hex over sysex.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["show", "still", "readable"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: renderLua substitutes by
  // plain String.replaceAll, so a token that is a prefix of another is eaten or corrupted
  // depending on knob order. @CC, @CH and @CURSORC share only "@C" and none continues into
  // another; @DEPTH shares nothing with any of them.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // Two adjacent controllers, @CC for hue and @CC + 1 for depth, so every value must
      // satisfy @CC + 1 < 128: the four top out at 17, 49, 81 and 103.
      values: ["16", "48", "80", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. Four channels, not sixteen.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
    {
      id: "cursor",
      label: "Cursor colour",
      kind: "colour",
      token: "@CURSORC",
      // The one cell under the finger, at FULL brightness on both layers regardless of its row,
      // so the cursor is the brightest thing on the pad; three whites.
      values: ["255,255,255", "255,240,200", "200,240,255"],
      default: 0,
    },
    {
      id: "depth",
      label: "Depth",
      kind: "amount",
      token: "@DEPTH",
      // The MULTIPLIER in d = 32 - row*@DEPTH, never the divisor. Larger is deeper: the bottom
      // row lands at 24, 16, 8 or 0 out of 32. THESE FOUR ARE THE WHOLE LEGAL TRAVEL: 5 would
      // put the bottom row's d at -8 and truncate a channel rather than clamp it (TRAPS above);
      // lua-smoke.spec.ts holds the travel clause red the day one is widened without the other.
      values: ["1", "2", "3", "4"],
      default: 2,
    },
  ],

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    cursor: 0,
    depth: 2,
  },

  // FALSE: Setup lights all eighty-one cells (171 of 243 bytes non-zero). frames.spec.ts test 5.
  restsBlack: false,
};
