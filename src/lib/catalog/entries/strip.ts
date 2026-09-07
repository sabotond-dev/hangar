// STRIP - the whole pad is one fader, and the bottom row is the vernier.
//
// Eighty-one cells spent on ONE number. The upper eight rows are a coarse bar
// you slide with your whole hand; the bottom row is a fine row that moves the
// last three bits. Together they send a real fourteen-bit controller pair.
//
// THE MECHANISM, with its arithmetic.
//
//   - Setup unlocks the range: self:txma(1023) self:tyma(1023). Element state
//     resets on a page change, so Setup is the only place it can be asserted,
//     and every division that would have been /127 is now //1023 or //1024.
//   - coarse = (1023 - y)*2047//1023, which is 2047 at the TOP of the pad and 0
//     at the bottom, because +y RUNS DOWN (ZONA-CAPABILITIES.md 2.2). BE
//     HONEST ABOUT WHAT THAT IS: the sensor gives ten real bits and the
//     multiply scales them to eleven. It does not invent resolution; it puts
//     the ten bits where the top of the fourteen-bit word needs them.
//   - fine = x*8//1024, which is 0..7 - three bits - across the bottom row.
//   - value = glim(coarse*8 + fine, 0, 16383). The maximum is 2047*8 + 7,
//     which is exactly 16383, so the top of the range is reachable and the
//     clamp is a guard rather than a cropper.
//   - The bar height is h = coarse*9//2048, which is 0..8 over the eight body
//     rows: row r (0..7) is lit when 8-r <= h.
//   - A repaint is gated on (h, fine) changing, so a slide inside one cell's
//     travel sends its new value and paints nothing. DO NOT REMOVE THE GATE:
//     eighty-one cells is far too much to redraw on every 10 ms sample.
//   - Both layers carry the same colour, and the PHASES ARE WRITTEN ONCE in
//     Setup and never again - the redraw only changes colours. That is what
//     makes an 81-cell repaint cheap enough to do under a finger at all.
//   - `timer: ""`. Nothing advances on its own; the declared motion is
//     `static` and the fixture agrees.
//
// THE FOURTEEN-BIT SEND, AND THE CONSTRAINT IT PUTS ON A KNOB.
// self:gms(@CH, 176, @CC, value, 1) - mode 1 - is the element wrapper's 14-bit
// CC. On the module firmware expands ONE call into TWO messages:
// gms(ch, 0xB0, p1, p2//128) and then gms(ch, 0xB0, p1 + 32, p2%128)
// (ZONA-CAPABILITIES.md:489-493). BECAUSE THE LEAST SIGNIFICANT BYTE GOES OUT
// ON p1 + 32, EVERY VALUE OF @CC MUST BE 0..31. The four shipped values are 1,
// 7, 11 and 16, whose partners are 33, 39, 43 and 48. A controller above 31
// would put its low seven bits on a controller number that means something
// else, silently and only under fine movement, which is the worst possible
// place for a wrong number to appear.
//
// WHAT HANGAR CAN AND CANNOT SEE OF THAT PAIR. The expansion is firmware
// behaviour and the browser host does not model it: lua-host.ts:556-572 pushes
// exactly ONE HostMidi per gms call and records `mode` as a field on it. So the
// pad sends two CC messages, HANGAR records the ONE CALL that produces them,
// and a scripted run therefore shows one message per send with mode 1 and p1 in
// range - which is the observable, and the only thing any test here asserts.
// Whether the two arrive, arrive in order, and arrive in the same 10 ms cycle
// for a host to reassemble is a wire question no simulator answers. It is
// row 20 of docs/HARDWARE-AUDITION.md and it belongs at a bench.
//
// NEVER txma(16383). DO NOT "FIX" THE 1023. The temptation is to ask the axis
// for the full fourteen-bit range directly. It does not work: the sensor
// resolves 1024 steps whatever maximum is set, and 16384*1023/1024 is 16368, so
// the top fifteen codes would be permanently unreachable and the fader would
// stop short of the top for no visible reason. Set 1023 and scale in Lua. The
// only 16383 in this file is the value clamp.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints the bar at h = 4, so the
// card arrives as a half-open fader over a dim rail rather than as a black
// square. Unlit cells are @RAILC on both layers, which is what makes the pad
// read as a fader with a body rather than as a bar floating in nothing. The bar
// and the vernier are painted on BOTH layers, because one layer can never
// exceed 254/512 of the colour asked for.
//
// THE NINTH VERNIER CELL IS A RAIL, AND THAT IS DELIBERATE. Three bits is eight
// positions and the bottom row has nine cells, so cell 8 of that row never
// lights. Nine vernier positions would need value = coarse*9 + fine, whose
// maximum is 18431 - outside fourteen bits - so the ninth cell is spent on the
// rail instead of on a number that cannot be sent.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - @CC MUST BE 0..31. In capitals above, and it is the one that would ship
//     a plausible-looking wrong result.
//   - THE txma(16383) TRAP, named and refused above.
//   - EVERY DIVISION IS FLOORED. //1023, //1024, //2048, //9 are all `//`. A
//     fraction reaching a firmware call becomes 0, silently.
//   - glim ON THE VALUE. It is exact at both ends today; it stays because a
//     later knob value or a re-scaled coarse term would otherwise overflow
//     into a uint14 wrap with nothing red anywhere.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every value of @BARC, @VERNC and @RAILC is inside 0..255 by construction.
//   - CODE 9 IS HARMLESS HERE, AND THAT IS WORTH SAYING RATHER THAN LEAVING A
//     READER TO HUNT FOR THE NOTE-OFF. A tap sets a value; a fader has nothing
//     to release. The guard is `e~=1 and e~=4 and e<9 then return`, which lets
//     a DOWNUP 9 through as a normal sample, and no state is kept per contact,
//     so a dropped release cannot strand anything.
//   - NO KEEPER AND NO DECAY. Nothing writes glt, glf or glpfs, so there is no
//     countdown to freeze and no rate to wrap.
//
// THE HONEST LIMIT, for the card copy. Fourteen bits of resolution shown
// through nine cells: you can send a number finer than you can see. The bar
// moves once every 2048 steps of the coarse half, and the vernier row is the
// only part of the picture that moves at all for the last three bits.
//
// ROUTE: kind "lua", not kind "state". Two reasons in the same sheet.
// `sends.faders` is typed `3 | 4` (_pad.ts:290), so one whole-pad fader is
// outside the vocabulary by a literal type; and `sends.hiRes` is a CARD-WIDE
// flag, not a per-fader one - the compiler's own fader branch never reads it
// (_pad.ts:1143 excludes "faders" from the hi-res coordinate range at all). A
// single fourteen-bit fader with a vernier row is not expressible as a
// PadState.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 638 characters, Timer 0, both fixed points
// of compressScript and both accepted by checkSyntax. The all-longest corner of
// the five-knob cross-product is 646 / 0, leaving 262 free of 908, and the
// all-shortest corner is 634 / 0.
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
  "--[[@cb]]self:txma(1023)self:tyma(1023)local function D(h,f)for n=0,80 do local a=glag(0,n)local r=n//9 if r==8 then if n%9==f then glc(a,1,@VERNC,1)glc(a,2,@VERNC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end elseif 8-r<=h then glc(a,1,@BARC,1)glc(a,2,@BARC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end end end for n=0,80 do local a=glag(0,n)glp(a,1,255)glp(a,2,255)end self.h=4 self.f=0 D(4,0)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end local v=(1023-y)*2047//1023 local f=x*8//1024 s:gms(@CH,176,@CC,glim(v*8+f,0,16383),1)local h=v*9//2048 if h~=s.h or f~=s.f then s.h=h s.f=f D(h,f)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const STRIP: CatalogEntry = {
  id: "strip",
  name: "STRIP",
  description:
    "The whole pad is one long fader, with a fine row along the bottom for the last few numbers.",
  // Feel-based, never a compiler kind (CONT-03). Every one is already carried:
  // "precise" by dial, "readable" by faders and MORPH, "modulation" by ARC,
  // "hands-free" by ARC and HOLD.
  tags: ["precise", "readable", "modulation", "hands-free"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @BARC,
  // @VERNC and @RAILC. renderLua substitutes by plain String.replaceAll, so a
  // token that is a prefix of another is eaten or corrupted depending on knob
  // order. No one of these five is a prefix of another.
  knobs: [
    {
      id: "cc",
      label: "Controller",
      kind: "amount",
      token: "@CC",
      // EVERY VALUE IS 0..31, AND THAT IS NOT A PREFERENCE. Mode 1 sends the
      // least significant byte on @CC + 32, so a controller above 31 would
      // collide with a real controller number. 1 is the modulation wheel, 7
      // volume, 11 expression and 16 a general-purpose controller; their
      // partners are 33, 39, 43 and 48.
      values: ["1", "7", "11", "16"],
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
      id: "bar",
      label: "Bar colour",
      kind: "colour",
      token: "@BARC",
      // The coarse bar, on layers 1 and 2. Bright: it is the number, and it is
      // what the eye tracks while the hand moves.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "vernier",
      label: "Fine colour",
      kind: "colour",
      token: "@VERNC",
      // The single lit cell of the bottom row, on layers 1 and 2. Deliberately
      // NOT the bar colour: the fine row is a different quantity and reading it
      // as more bar is the one misreading this card can produce.
      values: ["255,180,60", "255,255,255", "255,0,180", "0,255,120"],
      default: 0,
    },
    {
      id: "rail",
      label: "Rail colour",
      kind: "colour",
      token: "@RAILC",
      // Every unlit cell, on layers 1 and 2. Dim on purpose: it gives the fader
      // a body without competing with the bar. APPEARS FOUR TIMES - the unlit
      // vernier row and the unlit part of the bar, on two layers each.
      values: ["0,25,50", "25,0,50", "40,20,0", "20,20,20"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    bar: 0,
    vernier: 0,
    rail: 0,
  },

  // FALSE. Setup lights all eighty-one cells - a four-row bar, a vernier cell
  // and a dim rail everywhere else. frames.spec.ts test 5 turns that
  // declaration into a checked fact.
  restsBlack: false,
};
