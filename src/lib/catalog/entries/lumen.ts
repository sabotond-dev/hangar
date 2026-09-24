// LUMEN - a colour picker that is the colour it is sending.
//
// Hue runs across the pad, depth runs down it, and the pad paints itself in the colour it is
// about to send: there is no legend because the pad is the legend. Setup paints the field once;
// nothing runs after it - the Timer event holds the senders and the MIDI receive and is PULLED IN
// by the Setup's `s:tim()`, never armed (change 17B). Knobs: @CURSORC (the cursor's white),
// @DEPTH (the ramp's multiplier, 1..4) and two MIDI outputs (change 17B), Hue (@XT @CH @CC @XR)
// and Depth (@YT @YCH @YCC @YR). Setup 882 / Timer 461 of 908 at the picker corner (878 / 457 at
// the defaults). Kind "lua", not "state": eighty-one distinct computed colours are not a PadState.
// The touch library is a separate budget on the system element (255/0 842, 255/6 873 since
// 12.1-08b; library.ts section 1).
// History: docs/entries/lumen.md (11-09.2, 11-10, 12-01, 12-11, 12.1-04 costings and verdicts;
// change 17B).
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
//     `C(n)` moves the cursor - F restores the cell being left, F reads the colour of the cell
//     entered, @CURSORC is painted over it on layers 1 and 2 - and returns that colour. `s.c` is
//     the cursor cell (which cell is painted over); the library's `Q` owns which cell a contact is
//     on. `self.f` hands C to the Timer's receive.
//   - THE PULL-IN (change 17B): the Setup declares `local s,M,D=self`, defines the handler over
//     them, calls `s:tim()` - the Timer body runs once, synchronously, arming nothing - and then
//     takes `M,D=s.m,s.h`: the typed sender and the hex digit the Timer defined. The handler's
//     upvalues are the variables, so it sees the assignment.
//   - The touch handler's order, and each step is a measurement: `Q(s,i,e,x,y)` (the hysteresis
//     cell, returned only on a change or an onset; it expires the contact on an end code, so a
//     lift reaches the library), `G(s,i,e,x,y,0,@CURSORC)` (the bilinear finger on layer 0, the
//     layer F never writes; G re-asserts the colour every call, which heals the alert layer),
//     the end test `e~=1 and e~=4 and e<9`, the cursor block `if n then ... end`, then the axes
//     OUTSIDE that block so a move inside one cell still sends its axis: the library's `A` until
//     change 17B, inlined since - the same per-contact last pair in the library's `P[i]`, the same
//     `e<4` gate, each axis through `M(t,c,n,o)` on its own type, channel and number - then
//     `s.u,s.v=x,y`, the pair the receive holds. Q before G because `E` clears the block through
//     `V` on every onset; G before the end test so a lift clears the finger.
//   - No `X`: there is no Timer to sweep from and the card holds no note; a lost lift leaves a
//     stale `H[i]` that the next press by that id expires.
//
// WHAT IT SENDS (the two outputs since change 17B, each by its type: a controller `n, o`, a pitch
// bend `0, o`, a pressure `o, 0`)
//   Hue      raw x on @XT / @CH / @CC, only when x moved
//   Depth    127-y on @YT / @YCH / @YCC, only when y moved (inverted; a fader does not grow down).
//            At the defaults the pair is the one `A` sent: controllers 16 and 17 on channel 0.
//   sysex    the colour under the finger as SIX ASCII HEX DIGITS, whenever `Q` returns a cell:
//            gmss(240,125,D(r//16),D(r%16),D(g//16),D(g%16),D(b//16),D(b%16),247) - 0xF0 supplied
//            by this configuration, 0x7D the non-commercial manufacturer id, "FF" "5A" "00" at the
//            top-left cell, 0xF7. Every gmss argument is one payload byte and the caller supplies
//            the framing (grid_lua_api.c:905-935; grid_decode.c:96-100 transmits unframed anyway).
//            `D(v)` is `v<10 and 48+v or 55+v`: '0'..'9' then 'A'..'F'. Hex and not raw RGB because
//            sysex data bytes are seven-bit and row 0 emits a channel of 255.
//   A down primes without sending (the `e<4` gate): the first CC of a gesture is the first move.
// WHAT IT RECEIVES (change 17B; @XR / @YR the header INSTR, 13 On, 0 Off)
//   The host's message on an output's type, channel and (a controller) number sets that axis of
//   the held pair `s.u, s.v` (Depth's value is 127 - y), and the CURSOR moves to the cell the pair
//   picks through the calibrated map, `C(N(s.u,s.v))` - the colour the DAW's value is. Nothing is
//   sent back: no controller, no sysex. The other axis keeps the finger's last value (the top-left
//   before any). The callback acts only while the touch callback it was made beside is the
//   element's. The latch: one control, the whole pad - already latched.
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
//   - EACH AXIS HAS ITS OWN NUMBER since change 17B (0..127 each); no pair arithmetic is left.
//   - THE LIBRARY'S `A` HAS NO CALLER since change 17B: library.ts is untouched (every card's
//     system records would move), and the next library change can drop it.
//   - NO KEEPER AND NO DECAY in the Setup STRING (no glt, glf or glpfs) - a claim about the
//     string, not this file, and not about the library string, whose decay this card never calls.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//   - restsBlack is FALSE: 171 of the frame's 243 bytes are non-zero at every tick (152 at
//     @DEPTH 4, where the bottom row goes out). frames.spec.ts test 5 checks it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local s,M,D=self local H={255,90,0,200,255,0,30,255,0,0,255,150,0,150,255,30,0,255,200,0,255,255,0,100,255,230,190}local function F(n)local a=glag(0,n)local i=n%9*3 local d=32-n//9*@DEPTH local r=H[i+1]*d//32 local g=H[i+2]*d//32 local b=H[i+3]*d//32 glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)return r,g,b end for n=0,80 do F(n)end local function C(n)if s.c>=0 then F(s.c)end local r,g,b=F(n)local a=glag(0,n)glc(a,1,@CURSORC,1)glc(a,2,@CURSORC,1)s.c=n return r,g,b end s.c=-1 s.u=0 s.v=0 s.f=C s.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@CURSORC)if e~=1 and e~=4 and e<9 then return end if n then local r,g,b=C(n)gmss(240,125,D(r//16),D(r%16),D(g//16),D(g%16),D(b//16),D(b%16),247)end local p=P[i]or{}if e<4 then if x~=p[1]then M(@XT,@CH,@CC,x)end if y~=p[2]then M(@YT,@YCH,@YCC,127-y)end end P[i]={x,y}s.u,s.v=x,y end s:tim()M,D=s.m,s.h";

const TIMER =
  "--[[@cb]]local s=self local k,C=s.touch_cb,s.f s.h=function(v)return v<10 and 48+v or 55+v end s.m=function(t,c,n,o)s:gms(c,t,t==208 and o or t>223 and 0 or n,t==208 and 0 or o)end s.midirx_cb=function(s,h,v)local function f(r,t,c,n)return h[1]==r and v[2]==t and v[1]==c and(t>207 or v[3]==n)and v[t//16%3+2]end if s.touch_cb==k then local a,b=f(@XR,@XT,@CH,@CC),f(@YR,@YT,@YCH,@YCC)if a then s.u=a end if b then s.v=127-b end if a or b then C(N(s.u,s.v))end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

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
      label: "Hue controller",
      kind: "amount",
      token: "@CC",
      // The Hue output's Number (change 17B; "First controller" of an adjacent pair before it):
      // all of 0..127, its four old rungs first so a saved copy's index keeps its controller.
      values: numberValues(["16", "48", "80", "102"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Hue MIDI channel",
      kind: "amount",
      token: "@CH",
      // The Hue output's Channel, ZERO-BASED on the wire (gms's first argument); the rows read
      // 1..16. Sixteen since change 17B (four before: 0, 1, 9, 15).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "cursor",
      label: "Cursor colour",
      kind: "colour",
      token: "@CURSORC",
      // The one cell under the finger, at FULL brightness on both layers regardless of its row,
      // so the cursor is the brightest thing on the pad; its own three are whites.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,255,255", "255,240,200", "200,240,255"]),
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
    {
      id: "xType",
      label: "Hue MIDI type",
      kind: "mode",
      token: "@XT",
      // The Hue output's type (change 17B): a controller, a pitch bend, a channel pressure.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "xReceive",
      label: "Hue MIDI receive",
      kind: "mode",
      token: "@XR",
      // The header INSTR the receive answers for Hue: 13 the host (On), 0 (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
    {
      id: "yType",
      label: "Depth MIDI type",
      kind: "mode",
      token: "@YT",
      // The Depth output's type (change 17B).
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "yChannel",
      label: "Depth MIDI channel",
      kind: "amount",
      token: "@YCH",
      // The Depth output's Channel (change 17B): its own, the Hue's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "yCc",
      label: "Depth controller",
      kind: "amount",
      token: "@YCC",
      // The Depth output's Number (change 17B): 17 by default, the old "@CC+1" at the default.
      // @YCC, not @CCY: @CC would be a prefix of it.
      values: numberValues(),
      default: 17,
    },
    {
      id: "yReceive",
      label: "Depth MIDI receive",
      kind: "mode",
      token: "@YR",
      // The header INSTR the receive answers for Depth.
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // Two outputs (change 17B): the Hue (x, across) and the Depth (127 - y, down), each on its own
  // Type, Channel and Number, each receiving - a received value moves the cursor.
  outputs: [
    {
      id: "hue",
      name: "Hue",
      kind: "continuous",
      tokens: { type: "@XT", channel: "@CH", number: "@CC", receive: "@XR" },
    },
    {
      id: "depth",
      name: "Depth",
      kind: "continuous",
      tokens: { type: "@YT", channel: "@YCH", number: "@YCC", receive: "@YR" },
    },
  ],

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    cursor: 0,
    depth: 2,
    xType: 0,
    xReceive: RECEIVE_ON_INDEX,
    yType: 0,
    yChannel: 0,
    yCc: 17,
    yReceive: RECEIVE_ON_INDEX,
  },

  // FALSE: Setup lights all eighty-one cells (171 of 243 bytes non-zero). frames.spec.ts test 5.
  restsBlack: false,
};
