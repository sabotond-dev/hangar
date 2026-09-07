// LUMEN - a colour picker that is the colour it is sending.
//
// Hue runs across the pad, depth runs down it, and the pad paints itself in
// the colour it is about to send. There is no legend, because the pad IS the
// legend: a lighting operator who has never seen a ZONA can walk past this
// card and read it. USE-CASES.md ranks it fifth of forty-four and calls it
// "the single most self-evident config on the entire list".
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - The cell index is n = 0..80, so the column is n%9 and the row is n//9.
//     glag(0, n) is glag(0, x + y*9) written once rather than twice.
//   - HUE IS A NINE-ENTRY ANCHOR TABLE, flat: H holds twenty-seven numbers,
//     three per column, and column c reads H[c*3+1..c*3+3]. Eight of the nine
//     are a hue wheel at full saturation, one step of forty degrees apart and
//     offset so that no column lands on a bare primary; THE NINTH IS AN AMBER
//     WHITE, 255,230,190, because a lighting desk's most-used colour is white
//     and a picker without one is a picker missing its first choice. See the
//     colour arithmetic below for what that ninth column is worth in the
//     picture.
//   - DEPTH IS ONE MULTIPLY AND ONE FLOOR: d = 36 - row*@DEPTH, and every
//     channel is anchor*d//36. Row 0 is d = 36, so the top row is the anchor
//     colour exactly. @DEPTH is 1, 2, 3 or 4, so the bottom row is d = 28, 20,
//     12 or 4 out of 36 - between 78 per cent and 11 per cent of the anchor,
//     and never black. A LARGER @DEPTH IS A DEEPER RAMP, which is the way
//     round the label reads.
//   - Both layers carry the same colour, because one layer can never exceed
//     254/512 of the colour asked for and this card's whole claim is that the
//     colour on the pad is the colour on the wire.
//   - Every cell's phase is written to 255 once, when F first paints it, and
//     the picture's brightness never varies again. A repaint is glc alone plus
//     two glp that rewrite the value already there - the phase-set-once shape
//     STRIP and LEARN established.
//   - `timer: ""`. Once Setup has painted the field NOTHING RUNS AT ALL, which
//     makes this the cheapest spectacular card in the catalog: eighty-one
//     distinct computed colours for zero recurring cost.
//
// THE COLOUR ARITHMETIC, CHECKED AT ALL FOUR CORNERS RATHER THAN IN THE
// MIDDLE. Channels TRUNCATE rather than clamp, so a 260 renders as 4 and a
// negative renders as garbage; both ends have to be proved, not assumed.
//
//   upper bound  every anchor channel is <= 255, d <= 36 and the divisor is
//                36, so anchor*d//36 <= 255*36//36 = 255. The maximum is
//                attained on row 0 and is exactly the anchor. Nothing can
//                exceed 255 because d can never exceed its own divisor.
//   lower bound  d = 36 - 8*@DEPTH at the bottom row, which is 28, 20, 12 or 4
//                - POSITIVE AT EVERY KNOB VALUE. This is the trap: the obvious
//                form, anchor*(@DEPTH-row)//@DEPTH, goes NEGATIVE at @DEPTH 6
//                and exactly BLACK at @DEPTH 8, because the row index reaches
//                8 and a divisor smaller than that is a bottom row that is not
//                there. Subtracting a multiple from a fixed 36 cannot do that.
//   the corners  top left is the anchor 255,90,0 exactly; top right is the
//                amber white 255,230,190 exactly; bottom left at @DEPTH 4 is
//                255*4//36, 90*4//36, 0 = 28,10,0; bottom right is 28,25,21.
//                All twelve channels inside 0..255, none of them zero that was
//                not zero at the top.
//
// THE LOOK, and why restsBlack is FALSE. Setup lights all eighty-one cells and
// this is the most lit card in the catalog: 171 non-zero bytes of 243 at tick
// 0, against STRIP's 163, LEARN's 162 and CONSOLE's 99. Eight of the nine
// columns are a two-channel hue and the ninth is a three-channel white, which
// is where the extra nine bytes come from and is a second reason the white
// column earns its place.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - EVERY DIVISION IS FLOORED. anchor*d//36, n%9, n//9, x*9//128, y*9//128
//     and *127//128 are all `//` or `%`. A fraction reaching a firmware call
//     becomes 0, silently.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Proved at all four corners above,
//     over the knob's own values rather than at the default.
//   - THE DEPTH DIVISOR IS THE LITERAL 36 AND IS NEVER A KNOB, so it can never
//     be zero and the bottom row can never be black. @DEPTH is the multiplier,
//     not the divisor, and 8*4 = 32 < 36 is the whole guarantee.
//   - THE CURSOR RESTORES, IT DOES NOT REPAINT. DO NOT SIMPLIFY THIS to "call
//     F over all eighty-one cells". touch_cb has a 1000-microsecond budget at
//     100 Hz; eighty-one cells is four firmware calls each, and a handler that
//     overruns starts dropping touch samples, so the cursor would stutter
//     exactly when the finger moves fastest. One pass over ONE cell to restore
//     the field colour and one glc pair on the new cell is the whole repaint,
//     and it is at most two cells per sample.
//   - CODE 9 IS HANDLED. A fast tap arrives as a single DOWNUP 9 with no
//     separate press or lift, and it must both move the cursor and send, so
//     the filter is the shipped `e~=1 and e~=4 and e<9`.
//   - @CC + 1 < 128 AT EVERY KNOB VALUE. Two adjacent controllers are sent;
//     the four values top out at 17, 49, 81 and 103.
//   - NO KEEPER AND NO DECAY. The stored Lua holds no glt, no glf and no
//     glpfs, so there is no countdown to freeze and no rate to wrap and
//     pitfall 1 cannot arise here. That claim is made about the SETUP STRING
//     and not about this file, because a header that names a trap contains the
//     word it is warning about and a grep over the file counts itself.
//
// THE HONEST LIMIT, for the card copy. The pad shows the colour it is SENDING,
// which is not necessarily the colour the fixture is producing. The desk in
// between has its own curve, the lamp has its own gamut, and there is no gamma
// correction anywhere in the module's LED path - so two lights that agree on a
// number can still disagree to the eye. Comparing the pad against a lit
// fixture is row 22 of docs/HARDWARE-AUDITION.md and is the only place that
// question can be answered.
//
// ROUTE: kind "lua", not kind "state". The field is eighty-one DISTINCT
// COMPUTED COLOURS, and the `look` sheet has no such thing. `look.kind` is one
// of none, breathe, shimmer, scan, wave, swirl, ripple, drift and showpiece
// (_pad.ts:161-170), and every one of them carries exactly one `colour` plus a
// `colourB` that only drift and showpiece read at all (_pad.ts:2624). The
// nearest is `drift`, which ramps between those two colours along x and
// animates - one axis, two colours, and no way to darken by row. A two-axis
// per-cell colour map is not expressible as a PadState.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 604 characters, Timer 0, both fixed points
// of compressScript and both accepted by checkSyntax. The all-longest corner of
// the four-knob cross-product is 608 / 0, leaving 300 free of 908, and the
// all-shortest corner is 604 / 0.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local H={255,90,0,200,255,0,30,255,0,0,255,150,0,150,255,30,0,255,200,0,255,255,0,100,255,230,190}local function F(n)local a=glag(0,n)local i=n%9*3 local d=36-n//9*@DEPTH local r=H[i+1]*d//36 local g=H[i+2]*d//36 local b=H[i+3]*d//36 glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end for n=0,80 do F(n)end self.c=-1 self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 if n~=s.c then if s.c>=0 then F(s.c)end local a=glag(0,n)glc(a,1,@CURSORC,1)glc(a,2,@CURSORC,1)s.c=n end s:gms(@CH,176,@CC,x*127//128,0)s:gms(@CH,176,@CC+1,y*127//128,0)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const LUMEN: CatalogEntry = {
  id: "lumen",
  name: "LUMEN",
  description:
    "A colour picker for a lighting desk: hue across, depth down, and the pad is the colour it sends.",
  // Feel-based, never a compiler kind (CONT-03). "lighting" is coined here and
  // is a singleton until a later wave gives it a second carrier.
  tags: ["colour", "lighting", "readable", "expressive"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @CURSORC and
  // @DEPTH. renderLua substitutes by plain String.replaceAll, so a token that
  // is a prefix of another is eaten or corrupted depending on knob order.
  // @CC, @CH and @CURSORC share only "@C" and none of the three continues into
  // another; @DEPTH shares nothing with any of them.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // Two adjacent controllers, @CC for hue and @CC + 1 for depth, so every
      // value must satisfy @CC + 1 < 128. The four here top out at 17, 49, 81
      // and 103. 16 and 80 are general-purpose controllers, 48 is the coarse
      // half of a free block, and 102 is inside the undefined 102..119 range
      // no convention claims.
      values: ["16", "48", "80", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add 16 combinations to the sweep for a choice nobody makes.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
    {
      id: "cursor",
      label: "Cursor colour",
      kind: "colour",
      token: "@CURSORC",
      // The one cell under the finger, painted at FULL brightness on both
      // layers regardless of its row, so the cursor is always the brightest
      // thing on the pad and reads against every column including the amber
      // white one. Three values rather than four: a cursor is a highlight and
      // the only question is which white.
      values: ["255,255,255", "255,240,200", "200,240,255"],
      default: 0,
    },
    {
      id: "depth",
      label: "Depth",
      kind: "amount",
      token: "@DEPTH",
      // The MULTIPLIER in d = 36 - row*@DEPTH, never the divisor. Larger is
      // deeper: the bottom row lands at 28, 20, 12 or 4 out of 36. The largest
      // value costs 8*4 = 32 of the 36, which is why no value can take the
      // bottom row to black or below it.
      values: ["1", "2", "3", "4"],
      default: 2,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    cursor: 0,
    depth: 2,
  },

  // FALSE, and further from true than any other entry in the catalog: Setup
  // lights all eighty-one cells and 171 of the frame's 243 bytes are non-zero
  // at tick 0. frames.spec.ts test 5 turns that declaration into a checked
  // fact.
  restsBlack: false,
};
