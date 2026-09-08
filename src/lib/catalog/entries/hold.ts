// HOLD - the value you lift from stays put, lit and breathing.
//
// A latching effect pad. Slide anywhere to set an X and a Y; lift, and the
// value stays where you left it, with the cell you lifted from lit and
// breathing. Touch again and it moves. Nothing else in HANGAR latches.
//
// THE MECHANISM. self.h holds the index of the currently held cell. Every
// onset or move sample computes n = x*9//128 + y*9//128*9 and, only when n has
// changed, does ONE pass: it stops and clears the old cell, then paints the new
// one on layers 1 AND 2 in @COL and arms it with glpfs(a,L,0,@RATE,3) plus
// glt(a,L,60000). Shape 3 is the sine, which is what makes the cell breathe
// rather than flash, and painting both layers is what makes it bright - one
// layer can never exceed 254/512 of the value you ask for. Every sample, held
// or moving, sends two 7-bit CCs, @CC for x and @CC+1 for y. A LIFT SENDS
// NOTHING AND RESETS NOTHING. That is the whole feature.
//
// THIS IS NOT ARC. ARC is an LFO you shape and leave running, where the
// animation IS the data and the swirl shows the rate. HOLD holds a STATIC
// value and the breathing is only how it says "this is where the value is".
// Turning HOLD's rate knob changes nothing about what it sends.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints a dim frame - the 32
// border cells - on layer 2 in @RINGC at phase 255, static, so the card is
// legible with no finger on it and the OG image is not a black square. It also
// latches the centre cell, index 40, so the breathing latch is visible on
// arrival and every recorded frame shows it. Two lit things at tick 0, so
// restsBlack is false and the frames prove it.
//
// THE TIMER'S WHOLE JOB IS THE 655 s CEILING. glt(a,L,60000) is 600 s, and the
// LED engine decrements it every tick; at 655 s the maximum uint16 timeout runs
// out no matter what is written. So the Timer re-arms itself with
// gtt(0,2560) and re-issues glpfs on the held cell, and does nothing else.
// Without it the breathing freezes after ten minutes on a visitor's real
// hardware, and a card that dies after ten minutes is a broken card.
//
// 2560 ms IS NOT AN ARBITRARY PERIOD. It is 256 ticks, and the total phase
// advance over T ticks is exactly rate*T mod 256, so at every one of {1,2,3,5}
// the phase after 256 ticks is back to 0 - which is the phase the Timer writes.
// The re-issue is therefore invisible. A cell latched part-way through a period
// is re-phased once, at the next boundary, and is seamless from then on. It
// also keeps the argument inside a uint16 millisecond field, which a lazier
// period of several minutes would not.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - F2Ieq on both coordinate divisions and on both CC scalings. x*9//128,
//     y*9//128, x*127//128 and y*127//128 are all floored; a fractional
//     argument to a firmware call becomes 0, silently.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every value of @COL and @RINGC is inside 0..255 by construction.
//   - EVENT CODES. The guard is "e~=1 and e~=4 and e<9 then return", so onset
//     is e == 4 or e > 8 and a move is e == 1. e == 5 appears nowhere: a
//     handler that tested for it would leak on a fast tap, which arrives as
//     code 9 with no separate lift, and the vendored scanner raises
//     trap-end-of-contact on it.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE. glp(n,l,-1) does nothing on
//     ZONA; every phase here is an explicit 0 or 255.
//   - THE FRAME AND THE LATCH SHARE LAYER 2, so releasing a border cell must
//     put the frame back. Clearing the old cell writes @RINGC to layer 2 and
//     sets its phase to 255 if that index is on the border and 0 if it is not,
//     with glt(b,2,0) first so the restored frame cell sits still instead of
//     inheriting the breathe. Without that, latching onto the border and
//     moving away would punch a permanent hole in the frame.
//   - THE KEEPER IS 60000 AND IT IS LEGITIMATE. DO NOT "FIX" IT TO 65535. The
//     pitfall is a maximum timeout on a layer carrying a DECAYING trail, where
//     the fast rate keeps decrementing past zero and wraps. This layer's rate
//     is single-digit and 60000 is three orders of magnitude below the
//     keeper-height floor lua-smoke.spec.ts test 3 discriminates on, which is
//     exactly the shape that test calls legitimate.
//
// THE HONEST LIMIT, for the card copy. Two things.
//
//   1. Single contact by design. A second finger moves the same value; there is
//      no per-contact latch and the character budget would not carry one.
//   2. THE ONE THE SIMULATOR CANNOT SHOW. Firmware advances prev_* before the
//      writability check (grid_ui_touch.c:126-142, still present at current
//      HEAD), so a dropped release leaves a permanently stuck contact - and
//      pad-sim.ts:262-268 states plainly that the simulator "cannot manufacture
//      the stuck contact". A LATCHING CONFIGURATION CAN LOOK PERFECT IN A
//      BROWSER AND STICK ON HARDWARE. That is D-11, it is why HOLD carries its
//      own row in docs/HARDWARE-AUDITION.md, and it is why a green
//      lua-smoke.spec.ts is not evidence that latching is safe on a module.
//
// ROUTE: kind "lua", not kind "state". sends.toggle is read only when
// sends.kind is "zones" and spring only when it is "xy" (_pad.ts, the sends
// sheet), so a latching XY is in neither branch and is not expressible as a
// PadState at all.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 696 characters, Timer 102, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the five-knob cross-product is 706 / 102, leaving 202 free of 908,
// and the all-shortest corner is 696 / 102 - identical to the defaults, because
// every default here already selects its knob's shortest value.
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
  "--[[@cb]]for n=0,80 do if n<9 or n>71 or n%9==0 or n%9==8 then local a=glag(0,n)glc(a,2,@RINGC,1)glp(a,2,255)end end self.h=40 local a=glag(0,40)glc(a,1,@COL,1)glc(a,2,@COL,1)glpfs(a,1,0,@RATE,3)glpfs(a,2,0,@RATE,3)glt(a,1,60000)glt(a,2,60000)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 local h=s.h if n~=h then local b=glag(0,h)glt(b,1,0)glt(b,2,0)glc(b,1,0,0,0,1)glp(b,1,0)glc(b,2,@RINGC,1)glp(b,2,(h<9 or h>71 or h%9==0 or h%9==8)and 255 or 0)s.h=n b=glag(0,n)glc(b,1,@COL,1)glc(b,2,@COL,1)glpfs(b,1,0,@RATE,3)glpfs(b,2,0,@RATE,3)glt(b,1,60000)glt(b,2,60000)end s:gms(@CH,176,@CC,x*127//128,0)s:gms(@CH,176,@CC+1,y*127//128,0)end gtt(0,2560)";

const TIMER =
  "--[[@cb]]gtt(0,2560)local a=glag(0,self.h)glpfs(a,1,0,@RATE,3)glpfs(a,2,0,@RATE,3)glt(a,1,60000)glt(a,2,60000)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const HOLD: CatalogEntry = {
  id: "hold",
  name: "HOLD",
  description:
    "A latching effect pad: lift your finger and the value stays where you left it, lit and breathing.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "latching" was coined here and was a singleton until CONSOLE reached it in
  // wave 5. It retires: latching is how this pad works, not something a
  // visitor would filter on. What survives is that the held value is readable
  // across the room.
  tags: ["modulation", "expressive", "readable"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @COL, @RATE, @RINGC,
  // @CC and @CH. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these five is a prefix of another - @RATE and @RINGC share only
  // "@R", and @CC and @CH share only "@C". The Timer period is a LITERAL, not a
  // knob, so it needs no token at all.
  knobs: [
    {
      id: "colour",
      label: "Held colour",
      kind: "colour",
      token: "@COL",
      // The latched cell, on layers 1 and 2, as three uint8 channels. Every
      // channel is inside 0..255 on purpose: the firmware truncates rather than
      // clamps, so 260 would render as 4 and turn a bright cell nearly black
      // with no warning.
      values: ["255,90,0", "0,200,255", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "rate",
      label: "Breathe rate",
      kind: "speed",
      token: "@RATE",
      // The phase advance per 10 ms tick, so a full breath is 256/rate ticks:
      // 2.56 s at 1 and 0.51 s at 5. Single-digit by design - see the header on
      // the keeper. All four values divide 256 evenly enough that the Timer's
      // 256-tick re-issue lands on phase 0 for every one of them.
      values: ["1", "2", "3", "5"],
      default: 1,
    },
    {
      id: "ring",
      label: "Frame colour",
      kind: "colour",
      token: "@RINGC",
      // The 32 border cells, on layer 2, static. Deliberately dim: it is the
      // thing the latched cell has to stay readable against, and a bright frame
      // would compete with it. APPEARS TWICE in the Setup - once painting the
      // frame and once restoring it when a latch leaves a border cell - and
      // both sites move together.
      values: ["0,25,50", "25,0,50", "40,20,0", "20,20,20"],
      default: 0,
    },
    {
      id: "cc",
      label: "Controller",
      kind: "amount",
      token: "@CC",
      // X is sent on this controller and Y on the next one up, so the pair is
      // always adjacent and a MIDI-learn pass is two drags. 1 is the modulation
      // wheel, 11 expression, 74 the filter cutoff by convention, 16 a general
      // purpose controller. Every value plus one is still under 128.
      values: ["1", "11", "74", "16"],
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
      // 0 is channel 1, 1 is channel 2, 9 is channel 10 and 15 is channel 16.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    colour: 0,
    rate: 1,
    ring: 0,
    cc: 0,
    channel: 0,
  },

  // FALSE, and doubly so: Setup lights 32 border cells at phase 255 and latches
  // the centre cell breathing. frames.spec.ts test 5 turns that declaration
  // into a checked fact.
  restsBlack: false,
};
