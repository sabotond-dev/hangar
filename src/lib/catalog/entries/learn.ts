// LEARN - it sends one axis at a time, and the light tells you which.
//
// A mapping helper. Every major DAW binds a parameter to the NEXT incoming
// message, so a surface that sends X and Y at once is inherently ambiguous to
// map - documented across Kaoss Pad, padKONTROL, nanoPAD, TouchOSC, Lemur and
// Renoise from 2005 to 2025, and admitted by Sensel in the Morph's own manual,
// which prescribes disabling two dimensions while learning
// (.planning/research/USE-CASES.md 1.3). LEARN fixes that ON THE DEVICE: tap
// the centre cell to step through X only, Y only, and both, and the pad lights
// exactly the axis it is sending on.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - self.k is the mode: 0 sends X only, 1 sends Y only, 2 sends both. A tap
//     on the centre cell - x*9//128 + y*9//128*9 == 40 - advances it modulo 3
//     and repaints. Everything else on the pad is an ordinary XY surface.
//   - THE LEGEND IS THE LIGHT, not a label beside one. Mode 0 lights the BOTTOM
//     row, cells 72..80, because +y RUNS DOWN and row 8 is the bottom
//     (ZONA-CAPABILITIES.md 2.2) - a horizontal bar for the horizontal axis.
//     Mode 1 lights the LEFT column, n%9 == 0 - a vertical bar for the vertical
//     axis. Mode 2 lights both, seventeen cells, and the corner they share is
//     lit once.
//   - IN A SOLO MODE THE OTHER AXIS IS NOT SENT AT ALL. Not sent at a fixed
//     value, not sent at its last value: NOT SENT. That is the entire feature.
//     A host's learn function latches onto whatever moves, and a constant
//     stream is still a stream - a Y message repeating the same number would
//     be bound just as readily as a moving one.
//   - @STEP throttles each axis independently: a message goes out only when
//     that axis has moved at least @STEP since the last one it sent, with the
//     last sent value kept in self.x and self.y. A learn function is happier
//     with a few clean messages than with a hundred, and it keeps the 10 ms
//     cycle clear. Both start at -9 so the first sample of either axis always
//     sends, at every value of the knob.
//   - THE REPAINT IS ON A MODE CHANGE ONLY, never on a sample. Eighty-one cells
//     is far too much to redraw at 100 Hz and the legend does not depend on
//     where the finger is. DO NOT MOVE THE REPAINT INTO THE SAMPLE PATH.
//   - Both layers carry the same colour, and the PHASES ARE WRITTEN ONCE in
//     Setup and never again - the repaint only changes colours.
//   - `timer: ""`. Nothing advances on its own; the declared motion is
//     `static` and the fixture agrees.
//
// THE MODE CELL IS NOT SEPARATELY MARKED, AND THAT IS THE POINT. The centre
// cell paints in @OFFC like every other cell that is not the active axis. A
// second lit shape would dilute the legend, and the legend is the whole
// product: in a solo mode there must be exactly ONE lit shape on the pad, so
// that what you see and what the host is about to bind are the same thing. The
// card copy carries the centre tap instead, where it costs no light.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE CENTRE TAP USES e == 4 or e > 8. A fast tap on the mode cell arrives
//     as a single DOWNUP 9 with no separate press or lift, and it is exactly
//     how a mode cell gets used - one quick poke. A branch written against
//     e == 5 would miss it and the mode would appear not to change.
//   - EVERY DIVISION IS FLOORED. x*9//128, y*9//128, x*127//128 and y*127//128
//     are all `//`. A fraction reaching a firmware call becomes 0, silently.
//   - THE THROTTLE IS TWO COMPARISONS, NOT AN ABSOLUTE VALUE. `v-s.x>=@STEP or
//     s.x-v>=@STEP` avoids a math.* call entirely, so there is no float result
//     to close with `// 1` and nothing whose rounding could differ between the
//     browser VM and the firmware VM.
//   - @CC + 1 < 128 AT EVERY KNOB VALUE. X goes out on @CC and Y on @CC + 1, so
//     the pair is always adjacent and a two-drag learn pass is two drags. The
//     four values top out at 2, 17, 75 and 103.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every value of @ONC and @OFFC is inside 0..255 by construction.
//   - NO KEEPER AND NO DECAY. Nothing writes glt, glf or glpfs, so there is no
//     countdown to freeze and no rate to wrap.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints the legend for mode 0 -
// nine bright cells along the bottom and seventy-two dim ones - so all
// eighty-one cells are lit at tick 0 and the card arrives already explaining
// itself.
//
// THE HONEST LIMIT, for the card copy. It fixes the problem on the device, and
// it cannot tell you whether the host heard it. Nothing in this phase receives
// (D-04), so the pad shows what it is SENDING, never what the DAW has bound.
// The last step of a mapping is still a look at the other screen.
//
// ROUTE: kind "lua", not kind "state", and this is the sharpest route argument
// in the phase, because the compiler HAS this idea and deliberately refuses to
// persist it. `PadState.soloStream` exists and compiles a variant body that
// emits exactly one stream - and _pad.ts:346-352 says in its own words that it
// is "AUDITION-ONLY derived state", that "encodeStamp never writes it, so the
// stamp always records the real card", and that "withChange, fit and the ledger
// strip it before measuring". encodeStamp restates it at :2637. A configuration
// whose whole point is soloing one stream cannot BE a PadState, because the one
// field that would express it is deliberately not persistable - a stamp
// carrying it would round-trip back to the un-soloed card.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 657 characters, Timer 0, both fixed points
// of compressScript and both accepted by checkSyntax. The all-longest corner of
// the five-knob cross-product is 665 / 0, leaving 243 free of 908, and the
// all-shortest corner is 655 / 0.
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
  "--[[@cb]]self.k=0 self.x=-9 self.y=-9 local function L(k)for n=0,80 do local a=glag(0,n)if(k~=1 and n>71)or(k~=0 and n%9==0)then glc(a,1,@ONC,1)glc(a,2,@ONC,1)else glc(a,1,@OFFC,1)glc(a,2,@OFFC,1)end end end for n=0,80 do local a=glag(0,n)glp(a,1,255)glp(a,2,255)end L(0)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end if x*9//128+y*9//128*9==40 then if e==4 or e>8 then local k=(s.k+1)%3 s.k=k L(k)end return end local k=s.k if k~=1 then local v=x*127//128 if v-s.x>=@STEP or s.x-v>=@STEP then s.x=v s:gms(@CH,176,@CC,v,0)end end if k~=0 then local v=y*127//128 if v-s.y>=@STEP or s.y-v>=@STEP then s.y=v s:gms(@CH,176,@CC+1,v,0)end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const LEARN: CatalogEntry = {
  id: "learn",
  name: "LEARN",
  description:
    "Mapping helper: it sends one axis at a time and lights the row or column it is sending on.",
  // Feel-based, never a compiler kind (CONT-03). Every one is already carried:
  // "utility" by tpad, "readable" by faders and MORPH, "xy-control" by joystick
  // and HOLD, "precise" by dial.
  tags: ["utility", "readable", "xy-control", "precise"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @ONC, @OFFC
  // and @STEP. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these five is a prefix of another - @ONC and @OFFC share only
  // "@O" and neither continues into the other.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // X on @CC and Y on @CC + 1, so the two are always adjacent and every
      // value plus one is still under 128. 1 is the modulation wheel, 16 a
      // general-purpose controller, 74 the filter cutoff by convention, and 102
      // is inside the undefined 102..119 range that no convention claims.
      values: ["1", "16", "74", "102"],
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
      id: "on",
      label: "Active colour",
      kind: "colour",
      token: "@ONC",
      // The lit row, column, or both, on layers 1 and 2. Bright: it is the
      // legend, and it has to be unmistakable from across a desk while your
      // attention is on the other screen.
      values: ["0,255,120", "255,90,0", "0,200,255", "255,0,180"],
      default: 0,
    },
    {
      id: "off",
      label: "Idle colour",
      kind: "colour",
      token: "@OFFC",
      // Every cell that is not the active axis, on layers 1 and 2. Dim on
      // purpose: it says the pad is alive without saying anything about which
      // axis is going out.
      values: ["0,25,50", "25,0,50", "40,20,0", "20,20,20"],
      default: 0,
    },
    {
      id: "step",
      label: "Send step",
      kind: "feel",
      token: "@STEP",
      // How far an axis must move before it sends again, in controller units.
      // 1 sends on every change, 8 sends about sixteen messages across the
      // whole pad. APPEARS FOUR TIMES - two comparisons per axis, which is the
      // absolute value written without a math.* call.
      values: ["1", "2", "4", "8"],
      default: 1,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    on: 0,
    off: 0,
    step: 1,
  },

  // FALSE. Setup paints the mode 0 legend over all eighty-one cells - nine
  // bright along the bottom and seventy-two dim. frames.spec.ts test 5 turns
  // that declaration into a checked fact.
  restsBlack: false,
};
