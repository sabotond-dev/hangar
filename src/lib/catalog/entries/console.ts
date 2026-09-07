// CONSOLE - nine strips, and a mute you can tap.
//
// Nine faders side by side, one per column. Slide anywhere in a column to set
// that strip's level; tap the cell at the top of the column to mute it, and tap
// it again to put the level back exactly where it was. Nothing else in HANGAR
// is a mixer.
//
// THIS IS NOT A MACKIE CONTROL SURFACE, and the reason is worth saying in
// plain words rather than leaving as an absence. Mackie Control is a
// BIDIRECTIONAL protocol - the desk sends fader positions, track names, meter
// data and button lamp states back to the surface - and nothing in this phase
// receives inbound MIDI at all (D-04). A controller that only talks is half a
// Mackie controller, and half a Mackie controller is worse than none, because
// it looks like it should follow the desk and then does not. CONSOLE therefore
// sends PLAIN CONTROLLER MESSAGES a mixer can learn in a minute, and it claims
// nothing more on the card. Whether HANGAR should ever ship a real MCU surface
// is item 1 of .planning/phases/09-twenty-configurations/deferred-items.md; it
// depends on docs/MIDI-IN-PROBE.md exactly as the clock-locked family does.
//
// THIS IS NOT THE SHELF'S `faders` PRESET EITHER, and overlap is a rejection
// reason in this repository - Phase 8 dropped a nine-step sequencer for
// occupying EUCLID's slot. Three differences earn CONSOLE its place:
//
//   1. NINE strips rather than four, so a strip is exactly one column and the
//      mapping from finger to controller needs no explanation at all.
//   2. A MUTE ROW. Mute is a LATCHING state, and the compiler cannot express
//      one: there is no mute anywhere in the `sends` sheet, in either branch.
//   3. THE RAIL IS A CAP, NOT A COLUMN. `faders` draws a white rail BESIDE each
//      strip, which costs a column per rail. CONSOLE draws it as the top cell
//      of each column instead, so nine strips fit in nine columns with nothing
//      wasted - and that same cap is the mute button, so the mute row costs no
//      extra cells either.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - The column is c = x*9//128, so there are nine strips and no spare column.
//   - The level is h = 8 - y*9//128, which is 8 at the top row and 0 at the
//     bottom, because +y RUNS DOWN on this module (ZONA-CAPABILITIES.md 2.2).
//     h is stored in self.v[c] and is NINE values, 0 to 8, drawn over the eight
//     body cells of the column: row r (1..8) is lit when 8-r < h. h = 0 lights
//     nothing and h = 8 lights all eight.
//   - The controller value is self.v[c]*127//8, which is exactly 0 at h = 0 and
//     exactly 127 at h = 8, with no scaling error at either end.
//   - self.m[c] is the mute latch. A tap (e == 4 or e > 8) whose row is 0
//     toggles it, sends the column's controller at 0, and repaints the column.
//     Untoggling re-sends the REMEMBERED level, which is still in self.v[c] -
//     muting never touches it. Sliding a muted column clears the mute, because
//     moving a fader is an unambiguous request for that level.
//   - A repaint is ONE PASS over the column, every cell written exactly once,
//     never erase-then-paint: firmware has no double buffer and a two-pass
//     repaint can tear. The repaint is also GATED - a sample that lands on the
//     same level in the same column paints nothing - which keeps touch_cb short
//     under a fast slide. DO NOT REMOVE THE GATE.
//   - `timer: ""`. The picture is repainted on change and nothing advances on
//     its own, so the declared motion is `static` and the fixture agrees.
//
// THE @CC ARITHMETIC, AND WHY THE KNOB VALUES ARE WHAT THEY ARE. Nine adjacent
// controllers are sent, @CC through @CC + 8, so EVERY value of the knob must
// satisfy @CC + 8 < 128. The four shipped values are 16, 48, 80 and 102, whose
// top controllers are 24, 56, 88 and 110. All four are inside 128 with room,
// and the arithmetic is checked at the largest value, not at the default.
//
// THE LOOK, and why restsBlack is FALSE. Setup gives every strip a level of 4
// and paints all nine columns, so the card arrives showing nine rails and nine
// half-open faders - forty-five lit cells - and the OG image is a mixer rather
// than a black square. The level and the mute cap are painted on BOTH layers,
// because one layer can never exceed 254/512 of the colour asked for.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - EVERY DIVISION IS FLOORED. x*9//128, y*9//128 and *127//8 are all `//`.
//     A fraction reaching a firmware call becomes 0, silently.
//   - @CC + 8 < 128 AT EVERY KNOB VALUE. See the arithmetic above.
//   - CODE 9 IS HANDLED, AND IT IS THE WHOLE MUTE. A fast tap arrives as a
//     single DOWNUP 9 with no separate press or lift, so the mute test is
//     `e == 4 or e > 8`. A branch written against e == 5 would miss every fast
//     tap on the mute row and the mute would appear to work only sometimes.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every value of @LEVELC, @RAILC and @MUTEC is inside 0..255 by
//     construction.
//   - NO KEEPER AND NO DECAY. Nothing here writes glt, glf or glpfs at all, so
//     there is no countdown to freeze and no rate to wrap, and pitfall 1 cannot
//     arise. Count the maximum timeout in the SETUP STRING rather than in this
//     file, for the reason STRIP's header gives about its own trap number: a
//     trap nobody wrote down is a trap somebody re-introduces.
//   - THE LATCH WARNING, and it is the same one HOLD carries. Firmware advances
//     prev_* before the writability check, so a dropped release leaves a
//     permanently stuck contact, and pad-sim.ts states plainly that it cannot
//     manufacture one. A LATCHING CONFIGURATION CAN LOOK PERFECT IN A BROWSER
//     AND STICK ON HARDWARE: a mute that latches on and will not clear is
//     exactly how that bug would present here. Row 13 of
//     docs/HARDWARE-AUDITION.md is HOLD's bench row for it and row 19 is this
//     entry's. A green lua-smoke.spec.ts is not evidence that latching is safe
//     on a module.
//
// THE HONEST LIMIT, for the card copy. Two things.
//
//   1. Nine steps per strip is the resolution the pad has. This is a control
//      surface, not a motorised console, and a fader you can put in nine places
//      is what nine cells buy.
//   2. It cannot show what the mixer is doing. Nothing in this phase receives
//      (D-04), so the pad shows the level YOU set, never the level the desk is
//      at, and a fader moved in the DAW leaves this pad with nothing to say.
//
// ROUTE: kind "lua", not kind "state". Two independent reasons, and either
// alone would decide it. `sends.faders` is typed `3 | 4` in the `PadState`
// sends sheet (_pad.ts:290), so a nine-strip mixer is outside the vocabulary by
// a literal type; and there is NO MUTE ANYWHERE IN THAT SHEET, in either the
// zones branch or the faders branch - `sends.toggle` is read only when
// `sends.kind` is "zones" and it toggles a note, not a fader. Nine strips with
// a latching mute row is outside the vocabulary twice over.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 785 characters, Timer 0, both fixed points
// of compressScript and both accepted by checkSyntax. The all-longest corner of
// the five-knob cross-product is 789 / 0, leaving 119 free of 908, and the
// all-shortest corner is 780 / 0.
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
  "--[[@cb]]self.v={}self.m={}local function P(s,c)local m=s.m[c]local h=s.v[c]for r=0,8 do local a=glag(0,c+r*9)if r==0 then if m then glc(a,1,@MUTEC,1)glc(a,2,@MUTEC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end glp(a,1,255)glp(a,2,255)elseif m then glc(a,2,@MUTEC,1)glp(a,1,0)glp(a,2,8-r<h and 90 or 0)else glc(a,1,@LEVELC,1)glc(a,2,@LEVELC,1)local p=8-r<h and 255 or 0 glp(a,1,p)glp(a,2,p)end end end for c=0,8 do self.v[c]=4 P(self,c)end self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if r==0 then if e==4 or e>8 then local m=not s.m[c]s.m[c]=m s:gms(@CH,176,@CC+c,m and 0 or s.v[c]*127//8,0)P(s,c)end return end local h=8-r if h~=s.v[c]or s.m[c]then s.v[c]=h s.m[c]=nil s:gms(@CH,176,@CC+c,h*127//8,0)P(s,c)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const CONSOLE: CatalogEntry = {
  id: "console",
  name: "CONSOLE",
  description:
    "Nine strips with rails: slide anywhere in a column to set its level, tap the top cell to mute it.",
  // Feel-based, never a compiler kind (CONT-03). "latching" arrived with HOLD
  // as a singleton and becomes a standing chip here - two carriers is the
  // threshold (filter.ts:121-125).
  tags: ["mixing", "rails", "readable", "latching"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @LEVELC,
  // @RAILC and @MUTEC. renderLua substitutes by plain String.replaceAll, so a
  // token that is a prefix of another is eaten or corrupted depending on knob
  // order. No one of these five is a prefix of another - @CC and @CH share only
  // "@C" and neither continues into the other.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // Nine adjacent controllers, @CC through @CC + 8, so every value must
      // satisfy @CC + 8 < 128. The four here top out at 24, 56, 88 and 110.
      // 16 and 80 are general-purpose controllers, 48 is the coarse half of a
      // free block, and 102 is inside the undefined 102..119 range that no
      // convention claims.
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
      id: "level",
      label: "Level colour",
      kind: "colour",
      token: "@LEVELC",
      // The lit part of a strip, on layers 1 and 2. Bright on purpose: it is
      // the only thing on this card that carries information, and it has to
      // read against the rail cap at a glance.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "rail",
      label: "Rail colour",
      kind: "colour",
      token: "@RAILC",
      // The cap at the top of each column, on layers 1 and 2. Deliberately
      // pale: it is a boundary marker and a target, not data, and a bright
      // rail would compete with the level it is supposed to frame.
      values: ["60,60,60", "40,50,60", "60,50,20", "40,40,60"],
      default: 0,
    },
    {
      id: "mute",
      label: "Mute colour",
      kind: "colour",
      token: "@MUTEC",
      // Warm, so a muted strip reads as a warning rather than as another
      // colour choice. APPEARS THREE TIMES - the cap on both layers when the
      // strip is muted, and the dim body on layer 2 that keeps the remembered
      // level readable while it is muted.
      values: ["255,40,0", "255,80,0", "200,0,40", "255,0,0"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    level: 0,
    rail: 0,
    mute: 0,
  },

  // FALSE. Setup paints nine rail caps and nine half-open faders - forty-five
  // lit cells at tick 0. frames.spec.ts test 5 turns that declaration into a
  // checked fact.
  restsBlack: false,
};
