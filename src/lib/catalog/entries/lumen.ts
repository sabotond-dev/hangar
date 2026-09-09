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
// WHAT THE DEPTH KNOB DOES TO THE EMITTED FRAME, IN BYTES RATHER THAN IN
// RATIOS (plan 11-09.2, answering the bench note "the color depth / opacity
// doesn't work" and the checkpoint answer "try it but we observed no
// difference in the LEDs").
//
// THE OPTION THAT NOTE WAS COSTED FROM QUOTED 78 PER CENT AT @DEPTH 1 DOWN TO
// 11 PER CENT AT @DEPTH 4, AND THAT FIGURE IS THE ARITHMETIC d/36 - NOT A
// READING OF A FRAME. Between the arithmetic and a lit LED sit glc's three
// colour stops, glp's phase, shapeIntensity, the per-layer weights, the
// two-layer sum and the single divide by 512 with its clamp at 255
// (pad-sim.ts, render()). So the frame was read, with no gesture, at all four
// declared values. Both columns are shown because column 0 is a pure hue with
// a ZERO channel and column 8 is the only three-channel column, and the two
// truncate differently. * is the shipped default, index 2 of 4.
//
//   column 0, the anchor 255,90,0
//              @DEPTH 1   @DEPTH 2   @DEPTH 3*  @DEPTH 4
//     row 0    253,89,0   253,89,0   253,89,0   253,89,0
//     row 1    245,86,0   238,84,0   231,81,0   224,79,0
//     row 2    238,84,0   224,79,0   210,74,0   196,69,0
//     row 3    231,81,0   210,74,0   189,66,0   168,59,0
//     row 4    224,79,0   196,69,0   168,59,0   139,49,0
//     row 5    217,76,0   182,64,0   146,51,0   112,39,0
//     row 6    210,74,0   168,59,0   126,44,0   84,29,0
//     row 7    203,71,0   153,54,0   105,36,0   55,19,0
//     row 8    196,69,0   139,49,0   84,29,0    27,9,0
//
//   column 8, the amber white 255,230,190
//              @DEPTH 1      @DEPTH 2      @DEPTH 3*     @DEPTH 4
//     row 0    253,228,188   253,228,188   253,228,188   253,228,188
//     row 1    245,221,182   238,215,177   231,208,172   224,202,166
//     row 2    238,215,177   224,202,166   210,189,156   196,176,145
//     row 3    231,208,172   210,189,156   189,170,140   168,151,125
//     row 4    224,202,166   196,176,145   168,151,125   139,126,104
//     row 5    217,196,161   182,164,135   146,132,109   112,101,83
//     row 6    210,189,156   168,151,125   126,114,94    84,75,62
//     row 7    203,183,151   153,138,115   105,94,78     55,50,41
//     row 8    196,176,145   139,126,104   84,75,62      27,24,20
//
// FOUR VALUES, FOUR DISTINCT 243-BYTE FRAMES: THE KNOB DELIVERS, and the
// costed ratio survives to the bytes almost exactly - the bottom row is 196 of
// the emitted anchor's 253 at @DEPTH 1 (77 per cent) and 27 of it at @DEPTH 4
// (11 per cent).
//
// NOTE WHAT THE CORNER PROOF ABOVE IS MEASURING AND THIS TABLE IS NOT. 255,90,0
// is the colour ASKED FOR; the frame emits 253,89,0, because both layers carry
// the same colour and one layer caps at 254/512 of what it was given. Every
// figure in the corner proof is an asked colour, every figure here is an
// emitted byte, and they differ by one count. Neither is wrong; they are
// different measurements and this card has now had both.
//
// AND WHY "NO DIFFERENCE IN THE LEDS" IS STILL CONSISTENT WITH A KNOB THAT
// WORKS. d = 36 - row*@DEPTH, so ROW 0 IS d = 36 AT EVERY VALUE AND CANNOT
// MOVE - that is arithmetic, not a defect. The worst channel spread across all
// four values, row by row from the top, is 0, 21, 42, 63, 85, 105, 126, 148,
// 169. The whole of the knob's travel is in the lower half of the pad, and the
// shipped default is index 2 of 4, so ONE STEP moves row 1 by seven counts of
// 255 and the bottom row by fifty-five. Somebody watching the top of the pad
// while turning the knob is reporting what the pad does.
//
// THERE IS NO DEEPER FOUR-VALUE RE-CUT, AND THAT IS THE SHORTFALL AGAINST THE
// ASK RATHER THAN A REFUSAL OF IT. 8*max(@DEPTH) has to stay inside the
// subtrahend 36 or the bottom row's d goes negative and a channel truncates
// rather than clamping (see the lower bound above), so 4 is the largest value
// the arithmetic admits - and {1, 2, 3, 4} is therefore the ONLY four-element
// set of positive integers this knob can carry. The ramp is already at full
// travel. Deepening it means moving the SUBTRAHEND and the DIVISOR together,
// which makes it a different card, and both routes were costed rather than
// chosen:
//
//   move the default   index 2 -> 3 ships the deepest ramp there is. Costs
//                      ZERO characters and no arithmetic, but rewrites eighty
//                      of the eighty-one cells in frames.json, moves the OG
//                      image with them, and spends the knob's last step.
//   subtrahend 32      d = 32 - row*@DEPTH with anchor*d//32 and the same four
//                      values. MEASURED at 608 at the picker corner, which is
//                      the same 608 it costs today, and the bottom row reaches
//                      EXACT BLACK at @DEPTH 4 - 0,0,0, with the frame falling
//                      from 171 non-zero bytes to 152. At the shipped default
//                      the bottom row becomes 62,21,0 where it is 84,29,0
//                      today, so this rewrites frames.json and the OG image
//                      too, and the never-black guarantee below has to be
//                      restated as 8*max(@DEPTH) <= 32 with equality allowed.
//
// NEITHER IS SHIPPED, AND THAT IS A DECISION RATHER THAN AN OMISSION. Both
// change the picture this card is known by, the note being answered described
// an effect the simulator says is already present, and NOTHING HERE IS
// HARDWARE-VERIFIED - every figure above is a statement about the simulator
// and this source. THE OBSERVATION THAT SETTLES IT ON THE MODULE: install at
// @DEPTH 1, install again at @DEPTH 4, and compare the BOTTOM row rather than
// the pad as a whole.
//
// THE LOOK, and why restsBlack is FALSE. Setup lights all eighty-one cells,
// and the frame carries 171 non-zero bytes of 243 at every sampled tick.
// MEASURED, NOT ASSUMED, AND IT IS NOT THE HIGHEST IN THE CATALOG: the ported
// starfield holds 222 to 226 and the hand-authored CHORUS holds a flat 198, so
// LUMEN is THIRD. It is the highest of the three configurations landed in this
// wave and it is ahead of STRIP's 163, LEARN's 162 and CONSOLE's 99, but a
// pure hue is two channels by definition and eight of the nine columns are
// therefore two-channel. The ninth column - the amber white - is the only
// three-channel one and is worth nine of the 171 on its own, which is a second
// reason it earns its place beside the first.
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
// RE-MEASURED BY PLAN 11-09.2 AT THE RGB444 PICKER CORNER (D-06), WHICH IS THE
// CORNER THE 908 GATE ACTUALLY READS: Setup 608 of 908 leaving 300 free, Timer
// 0 of 908 leaving the whole 908 - the most free Timer in the catalog. THAT IS
// THE SAME 608 THE DECLARED CROSS-PRODUCT GIVES, AND IT IS A COINCIDENCE
// RATHER THAN A RULE: @CURSORC already declares 255,255,255, which is the
// longest literal any picker can write, so this entry's declared corner and
// its picker corner are the same point. ARC and MORPH are correct by the same
// accident; five entry headers in this catalog are NOT, and quote the declared
// corner as though it were the picker one. Do not read this line as the norm.
// AND 604 IS THE DEFAULTS FIGURE, NOT A CORNER AT ALL - it happens to equal
// the all-shortest declared corner because every default is that knob's
// shortest literal, and quoting it as the budget figure understates the cost
// by four characters. @CC and @CH each appear TWICE in the Setup, which is why
// two knobs one character longer cost four rather than two.
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
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "lighting" was coined here and no later wave ever gave it a second
  // carrier. It retires rather than waiting: this pad is FOR a show, and a
  // term that waits for a carrier is a term the vocabulary did not need.
  tags: ["show", "expressive", "readable"],
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
      //
      // THESE FOUR ARE THE WHOLE LEGAL TRAVEL, not a sample of it: 5 would put
      // the bottom row's d at -4 and truncate a channel rather than clamp it,
      // so {1, 2, 3, 4} is the only four-element set of positive integers this
      // knob can carry at subtrahend 36. There is no deeper re-cut without
      // moving the arithmetic. The header's depth table says what each value
      // is worth in emitted bytes, and lua-smoke.spec.ts holds the travel
      // clause red the day one is widened without the other.
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

  // FALSE, and about as far from true as this catalog gets: Setup lights all
  // eighty-one cells and 171 of the frame's 243 bytes are non-zero at every
  // sampled tick - third in the catalog, behind starfield and CHORUS.
  // frames.spec.ts test 5 turns that declaration into a checked fact.
  restsBlack: false,
};
