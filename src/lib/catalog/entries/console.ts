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
//   - The level is h = 8 - y*9//128, and because +y RUNS DOWN on this module
//     (ZONA-CAPABILITIES.md 2.2) the top of the pad is the top of the fader.
//     THE FADER BODY IS ROWS 1 TO 8, NEVER ROW 0 - row 0 is the mute cap - so
//     r runs 1..8 and h runs 0..7. EIGHT values, not nine. h is stored in
//     self.v[c] and drawn over the eight body cells: row r is lit when
//     8-r < h, so h cells light and h = 0 lights nothing.
//   - THE CONTROLLER VALUE IS self.v[c]*127//7, AND THE DIVISOR IS 7 BECAUSE
//     THE MUTE ROW OWNS THE TOP OF THE TRAVEL. It used to be *127//8, whose
//     maximum over the reachable h is 7*127//8 = 111: sweeping a column through
//     the real Lua host emitted exactly 0, 15, 31, 47, 63, 79, 95, 111 and
//     could not reach 127 at any point of any column. That is the bench report
//     "clamp issue in the top row because its not precise" - the fader was not
//     imprecise, it was short of full scale by an eighth. Dividing by 7 makes
//     the eight steps span 0..127 exactly, at +0 characters, because both
//     literals are one digit. src/lib/sim/lua-smoke.spec.ts sweeps every column
//     and asserts 127 is present and the distinct count is 8.
//     THE PICTURE STILL TOPS OUT AT SEVEN OF EIGHT BODY CELLS, and that is a
//     separate fact rather than a leftover of the same defect: h cells light
//     for h in 0..7, so the row you touch to reach full scale is itself dark.
//     Lighting 0..8 cells would need nine levels over eight touchable rows, so
//     it is a layout change and not a constant, and it is a bench question
//     rather than an arithmetic one. Recorded in 11-07-SUMMARY.md.
//   - self.m[c] is the mute latch. Row 0 toggles it, sends the column's
//     controller at 0, and repaints the column. Untoggling re-sends the
//     REMEMBERED level, which is still in self.v[c] - muting never touches it.
//     A MUTED COLUMN MOVES AND STAYS SILENT, AND THAT IS THE SECOND READING
//     OF ONE BENCH SENTENCE - REVERSED ON THE RECORD, TWICE (plans 11-07 then
//     12-05). Three shapes have shipped here and each one is a different
//     answer to the same question, so all three are written down:
//
//       BEFORE 11-07 - the fader body CLEARED the mute (s.m[c]=nil), on the
//       argument that moving a fader is an unambiguous request for that level.
//       11-07 - the bench said "you should not be able to interact with the
//       'muted' faders", so the body was folded into `and not s.m[c]` and a
//       muted column emitted nothing AND STORED NOTHING. That fold cost -6
//       characters, because it dropped the s.m[c]=nil it replaced.
//       12-05 - THE USER'S OWN CORRECTION, verbatim: "you should be able to
//       change the muted ones only don't send the midi from those." 11-07 read
//       "do not interact" as INERT; the sentence above says the column is
//       interactive and SILENT. So the store and the repaint are unconditional
//       and only the gms is gated: `if h~=s.v[c]then s.v[c]=h if not s.m[c]
//       then s:gms(...)end P(s,c)end`. +8 characters, 844 -> 852 at the picker
//       corner, 56 free.
//
//     WHAT THE UNMUTE THEN SENDS IS THE LEVEL THE FINGER MOVED IT TO, and that
//     falls out of the mute-row branch being untouched: it still sends
//     `m and 0 or s.v[c]*127//7`, and s.v[c] is now whatever the muted drag
//     stored. So a muted strip can be set up in silence and dropped in at the
//     right level, which is what a mixer's mute is for. THE MUTE CAP IS STILL
//     THE ONLY WAY BACK and it is still reachable by construction: it is row 0
//     of the same column, the cell directly above the fader the finger is
//     already on, and it is painted in @MUTEC on both layers while the mute is
//     held, so it is the one cell in that column that says what to press.
//     src/lib/sim/lua-smoke.spec.ts test 8 carries the reversal: it used to
//     assert a muted column INERT and now asserts it moves, repaints, sends
//     zero controller messages while muted, and sends exactly one carrying the
//     moved level on unmute.
//   - THE CELL COMES FROM THE TOUCH LIBRARY, AND self.q IS GONE (plan 12-09).
//     THE BENCH NOTE THIS ANSWERS, and it is the one that named the framework:
//     "CONSOLE: needs to setup a framework how your finger interacts with the
//     LEDs because everything needs touch detection." The framework is
//     src/lib/catalog/library.ts, written into the system element's Setup, and
//     this entry's whole finger-to-cell path is now one call:
//
//         local n=Q(s,i,e,x,y)if not n then return end
//         local c=n%9 local r=n//9
//
//     THREE THINGS LEFT WITH THAT LINE, and none of them was deleted - each one
//     moved into `Q` and is spelled there once for every caller:
//
//       1. THE LIVE TEST. `if e~=1 and e~=4 and e<9 then return end` was the
//          outer gate. `Q`'s end test is its negation, and it also EXPIRES the
//          contact rather than merely returning.
//       2. THE MUTE ROW'S DEDUP. self.q[i] was the last mute cell each CONTACT
//          toggled and the branch read `if e==4 or e>8 or s.q[i]~=c`. That IS
//          `Q`'s change signal - it returns the cell only when the cell
//          changed, and an onset always returns one - so the branch is now
//          unconditional inside `if r==0 then`. MEASURED before the guard
//          existed at all (plan 11-07): a contact wobbling inside one mute cell
//          delivered 210 samples and got 210 CHANGES, and a swipe across the
//          row toggled each column fourteen or fifteen times rather than once.
//          With the guard, and now with `Q`: 1 and 1.
//       3. THE FADER PATH'S CLEAR (`s.q[i]=nil`), which existed for the gesture
//          the dedup would otherwise eat - slide off the cap into the strip and
//          back onto the same cap. `Q` needs no clear: the cell changed twice,
//          so it returned twice.
//
//     AND `Q` ADDS TWO THINGS THIS CARD NEVER HAD. Per-axis HYSTERESIS, so a
//     fader finger on the line between two columns drives ONE fader instead of
//     flickering between two (PROBE-RESULTS-2026-09-10.md Q2: a motionless
//     finger sent 71, 72, 71, 71, 71, and 71*9//128 = 4 while 72*9//128 = 5).
//     And the onset expiry, so a press by a contact whose lift was lost is read
//     against a clean slate rather than against a stale cell.
//
//     COSTED BOTH WAYS AT THE RGB444 PICKER CORNER, and the smaller shipped:
//     781 with self.q gone, 847 with self.q and its two sites kept beside the
//     call. Both pass the mute-row swipe and the resting-finger probes in
//     src/lib/sim/lua-smoke.spec.ts, so the 66 characters buy nothing.
//     (12-RESEARCH costed the kept shape at 845 against a FOUR-argument `Q`;
//     the shipped `Q` takes `s`, which is the two characters, per 12-VALIDATION
//     R-5.)
//
//     THERE IS NO TIMER, SO THERE IS NO `X`. The library's sweep is a Timer-side
//     function and this card declares `timer: ""`. A contact whose lift is lost
//     therefore keeps its entry in the library's `H` until the next press by
//     that id, which `Q` expires first - and nothing here holds a note, so a
//     stale cell costs a mute toggle that never happened rather than a hung
//     voice. That is why CHORUS takes `X` in the same plan and CONSOLE does not.
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
//   - EVERY DIVISION IS FLOORED. x*9//128, y*9//128 and *127//7 are all `//`.
//     A fraction reaching a firmware call becomes 0, silently.
//   - @CC + 8 < 128 AT EVERY KNOB VALUE. See the arithmetic above.
//   - CODE 9 IS HANDLED, AND IT IS THE WHOLE MUTE. A fast tap arrives as a
//     single DOWNUP 9 with no separate press or lift. The onset test is now the
//     library's - `Q` spells it `e==4 or e>8` and returns the cell on it
//     unconditionally - so a fast tap on the cap still toggles the mute. A
//     branch written against e == 5 would miss every fast tap on the mute row
//     and the mute would appear to work only sometimes; that is the failure
//     src/lib/catalog/touch-guard.spec.ts exists to prevent, and it now gates
//     the library string instead of this entry's own chain.
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
//   1. EIGHT steps per strip is the resolution the pad has - eight, because the
//      ninth cell of the column is the mute cap and never a level. This is a
//      control surface, not a motorised console, and a fader you can put in
//      eight places is what eight cells buy. The eight now span 0..127 exactly.
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
// against the pinned minifier: Setup 758 characters, Timer 0, both fixed points
// of compressScript and both accepted by checkSyntax.
//
// TWO CORNERS, AND THE BINDING ONE IS NOT THE PALETTE'S. The all-longest corner
// a VISITOR CAN ACTUALLY REACH is 781 / 0, leaving 127 free of 908, because
// D-06 lets the colour picker write any of the 4,096 RGB444 literals and
// 255,255,255 is two characters longer than the longest colour this card
// declares. THREE colour tokens, occurring 3 + 2 + 2 times, is 19 of the 23
// characters between the two corners.
// src/lib/catalog/lua-entries.sweep.spec.ts gates the PICKER corner - that is
// the number 908 is checked against - so it is the one this header quotes and
// the one every margin in 11-07-SUMMARY.md is stated at.
//
// THIS CARD WAS THE TIGHTEST IN THE CATALOG AND IT IS NOT ANY MORE. Plan 12-05
// left it at 852 with 56 free, and 12-VALIDATION's budget table asked whether a
// `Q` call could be fitted beside that at all - "if `Q` does not fit beside +8,
// a finding". It fits with room to spare, because the call REPLACES more text
// than it adds: 852 -> 781 at the picker corner, 829 -> 758 at the defaults, a
// net -71 in both columns. See the self.q section above for what the 71 is.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.v={}self.m={}local function P(s,c)local m=s.m[c]local h=s.v[c]for r=0,8 do local a=glag(0,c+r*9)if r==0 then if m then glc(a,1,@MUTEC,1)glc(a,2,@MUTEC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end glp(a,1,255)glp(a,2,255)elseif m then glc(a,2,@MUTEC,1)glp(a,1,0)glp(a,2,8-r<h and 90 or 0)else glc(a,1,@LEVELC,1)glc(a,2,@LEVELC,1)local p=8-r<h and 255 or 0 glp(a,1,p)glp(a,2,p)end end end for c=0,8 do self.v[c]=4 P(self,c)end self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)if not n then return end local c=n%9 local r=n//9 if r==0 then local m=not s.m[c]s.m[c]=m s:gms(@CH,176,@CC+c,m and 0 or s.v[c]*127//7,0)P(s,c)return end local h=8-r if h~=s.v[c]then s.v[c]=h if not s.m[c]then s:gms(@CH,176,@CC+c,h*127//7,0)end P(s,c)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const CONSOLE: CatalogEntry = {
  id: "console",
  name: "CONSOLE",
  description:
    "Nine strips with rails: slide anywhere in a column to set its level, tap the top cell to mute it.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "latching" arrived with HOLD and became a standing chip here, on its
  // second carrier. The re-cut retires the word and the threshold together: a
  // chip is a facet member now, and what this pad is FOR is mixing.
  tags: ["mixing", "precise", "readable"],
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
