// WHEELS - a pitch wheel on the left, a mod wheel on the right, and the whole point of the card
// is that THEY ARE NOT THE SAME CONTROL.
//
// Columns 0..3 are a spring-loaded pitch wheel (fourteen-bit bend, one lit row that travels,
// rests at the middle row, springs home on the wire when the finger lifts); columns 5..8 are a
// mod wheel (seven-bit CC, a bar that fills from the bottom, stays where it was left, rests at
// zero); column 4 is a lit divider that belongs to neither. Both events near full: Setup 900 of
// 908 at the picker corner (890 at the defaults; 8 free), Timer 895 (880; 13 free). Knobs: @PWC,
// @MWC, @DVC, @RATE and since change 17B two MIDI outputs - the Pitch wheel (@PT @PCH @PN @PR)
// and the Mod wheel (@MT @CH @CC @MR). Kind "lua": the compiler's sheet has no pitch-bend
// out-call. lua-smoke.spec.ts asserts the four asymmetries.
// History: docs/entries/wheels.md (the ask, the sketch ladder 1118 / 1035 / 922 / 895, 11-15;
// change 17B).
//
// MECHANISM
//   - Setup: `txma(1023) tyma(1023)` (ten-bit, both axes - lua-host.ts keeps ONE `_coordMax`
//     behind both names, so unlocking y alone would simulate a ten-bit x the module lacks; the
//     pitch wheel's OUTPUT is finer than a seven-bit axis, which is the rule for unlocking),
//     `self.o={}` the onset column per contact, `self.b=8192` the bend, `self.m=0` the mod value.
//   - ONE painter `D(s)` paints the whole pad - colour and phase, all eighty-one cells - gated on
//     `(r,k)` changing: r = (16383-b)*9//16384 the marker row, k = m*10//128 the bar height.
//     Pitch columns: @PWC on layers 1 and 2, phase 255 on row r, 30 elsewhere; mod columns: @MWC
//     on both layers, 255 where w >= 9-k, 30 elsewhere; column 4: @DVC on layer 1 ONLY (half
//     brightness by the render sum; measured 142 against the rails' 50 / 46). `self.r` and
//     `self.k` start nil so the first call paints. Setup hands `D` over as `self.z`, calls
//     `D(self)`, and ends `self:tim()P,M=self.q,self.w` (change 17B): the Timer body run once
//     inside the Setup - at rest it does nothing but make the two senders and the receive once per
//     install (`s.j`), which the Setup takes as its upvalues `P` (pitch) and `M` (mod).
//   - The LEDs are the readout, not the quantiser: pitch sends (1023-y)*16383//1023 (1024 bend
//     values; the marker row is a second, independent derivation), mod sends (1023-y)*127//1023.
//   - THE ORIGIN LOCK: `s.o[i]` is written on `e==4 or e>8 or c==nil` and read on every later
//     sample, so a finger that starts on pitch and crosses the divider keeps bending. The two
//     branches are `c<4` and `c>4`; a contact that begins on column 4 does nothing.
//   - A lift (`e~=1 and e~=4 and e<9`): if the contact's onset column was pitch, `s.h=nil` and
//     `gtt(0,20)` arms the spring; `s.o[i]=nil`. A pitch sample sets `s.h=1` (a held finger
//     stops the spring); a code 9 in the pitch branch is its own release and arms it too.
//   - THE TIMER (armed on a lift, never by Setup - which only runs its body once, at rest):
//     first, once per install, the senders and the receive (above); then `d = s.h and 0 or s.b-8192` (0 is truthy, so
//     a held wheel does nothing and does not re-arm); if d ~= 0, re-arm `gtt(0,20)`, walk d
//     towards zero by @RATE and STOP AT EXACTLY ZERO (`else d=0`), b = 8192+d, send the bend,
//     and repaint the pitch columns' PHASES only (its own smaller copy of the pitch repaint - a
//     Timer body is a separate chunk and cannot see a Setup local). The fire that lands on zero
//     does not re-arm: the disarm is the absence of a re-arm, never gtt(0,0). The re-arm is
//     not the first statement because whether to re-arm is the question; nothing before it can
//     raise. The period is the literal 20.
//
// WHAT IT SENDS (two outputs since change 17B, through the Timer's two senders)
//   pitch  P(b): under a pitch bend (@PT 224, the default) s:gms(@PCH,224,b%128,b//128) -
//          fourteen bits, centre 8192, LOW BYTE FIRST; on every pitch sample and on every spring
//          step, the last one exactly 8192. 16383 at y = 0 and 0 at y = 1023, both ends exact;
//          8192 is not reachable by hand - a spring-loaded wheel is one you let go of. Under a
//          controller or a pressure the top seven bits, b//128, on @PN or as the pressure. THE
//          WHEEL KEEPS ITS FOURTEEN BITS under a pitch bend: docs/MIDI.md's pitch bend is 7-bit
//          (64 the centre) for a seven-bit value; this one is a fourteen-bit wheel and was one first.
//   mod    M(v) by @MT: a controller @CC (the default), a pitch bend 0, v, a pressure v, 0; only
//          when v changed.
//   At the defaults the wire is the card's before change 17B, message for message.
// WHAT IT RECEIVES (change 17B; @PR / @MR the header INSTR, 13 On, 0 Off)
//   Pitch: a host pitch bend (lsb, msb) sets b = lsb + msb*128 (a controller or pressure, w*128)
//   and the marker row follows; it HOLDS until the next touch - nothing arms the spring, so a
//   received bend is shown, not sent back or walked home. Mod: the value sets m and the bar. Both
//   repaint through D (self.z). Nothing is sent back. The latch: `s.o[i]` fixes each contact's
//   wheel at its onset - already latched.
//   `gmbs` IS NOT PITCH BEND: it is the mouse-button HID call. Neither string carries gmbs,
//   gmms or gks at any knob position and the host's HID log is empty (lua-smoke.spec.ts, twice).
//
// TRAPS
//   - THE SPRING'S LAST BEND MUST BE EXACTLY 8192. The `else d=0` arm is what makes it exact.
//     Replace it with anything proportional (`(b-8192)*3//4`) and the card sits permanently a
//     code flat: `//` floors towards minus infinity and -1 maps to -1 forever.
//   - EVERY DIVISION IS FLOORED. //1023, //1024, //16384, //128 and //9. A fraction reaching a
//     firmware call becomes 0, silently.
//   - THE BEND IS SENT LOW BYTE FIRST. `b%128` then `b//128`. Swapped, the card bends in
//     128-code jumps and looks almost right.
//   - NEVER gtt(0,0) TO STOP THE TIMER: it stops silently on firmware, and lua-host.ts:679-685
//     returns early on a period of zero WITHOUT clearing the deadline, so the module would stop
//     and the preview keep running with nothing red.
//   - THE LIVE FILTER IS THE BLESSED SPELLING `e~=1 and e~=4 and e<9`, the onset beside it
//     `e==4 or e>8 or c==nil` (`c==nil` for a MOVE whose onset was never delivered, which would
//     otherwise index nil). A fast tap bends and springs back in one code 9 on the module; the
//     browser delivers a 4 and a 5 instead, which the card also handles.
//   - `s.h` IS CLEARED IN TWO PLACES and both are required: the ordinary lift, and the `e>8`
//     arm inside the pitch branch.
//   - THE TIMER'S PITCH REPAINT DUPLICATES `D`'s ON PURPOSE and the duplication is closed by an
//     assertion: lua-smoke.spec.ts settles the spring and asserts the whole frame is
//     byte-identical to the boot frame. `self.D=function...` would remove it and is refused by
//     host-surface.spec.ts's classifier (recorded as a gate finding in 11-15-SUMMARY.md).
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @PWC, @MWC, @DVC is 0..255.
//   - NO KEEPER AND NO DECAY: nothing writes glt, glf or glpfs.
//   - The card is `static` in frames.json though it stores a Timer: Setup never arms it (it runs
//     the body once through `self:tim()` since change 17B, which arms nothing at rest).
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local P,M self:txma(1023)self:tyma(1023)self.o={}self.b=8192 self.m=0 local function D(s)local r=(16383-s.b)*9//16384 local k=s.m*10//128 if r==s.r and k==s.k then return end s.r=r s.k=k for n=0,80 do local c=n%9 local w=n//9 local a=glag(0,n)local p=255 if c<4 then glc(a,1,@PWC,1)glc(a,2,@PWC,1)p=w==r and 255 or 30 elseif c>4 then glc(a,1,@MWC,1)glc(a,2,@MWC,1)p=w>=9-k and 255 or 30 else glc(a,1,@DVC,1)end glp(a,1,p)glp(a,2,p)end end self.z=D D(self)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then if(s.o[i]or 9)<4 then s.h=nil gtt(0,20)end s.o[i]=nil return end local c=s.o[i]if e==4 or e>8 or c==nil then c=x*9//1024 s.o[i]=c end if c<4 then s.h=1 s.b=(1023-y)*16383//1023 P(s.b)if e>8 then s.o[i]=nil s.h=nil gtt(0,20)end elseif c>4 then local v=(1023-y)*127//1023 if v~=s.m then s.m=v M(v)end end D(s)end self:tim()P,M=self.q,self.w";

const TIMER =
  "--[[@cb]]local s=self if s.j~=s.touch_cb then s.j=s.touch_cb local k,D=s.j,s.z s.q=function(b)local t=@PT if t>223 then s:gms(@PCH,t,b%128,b//128)else b=b//128 s:gms(@PCH,t,t==208 and b or @PN,t==208 and 0 or b)end end s.w=function(o)local t=@MT s:gms(@CH,t,t==208 and o or t>223 and 0 or @CC,t==208 and 0 or o)end s.midirx_cb=function(s,e,v)local function f(r,t,c,n)return e[1]==r and v[2]==t and v[1]==c and(t>207 or v[3]==n)end if s.touch_cb==k then if f(@PR,@PT,@PCH,@PN)then s.b=@PT>223 and v[3]+v[4]*128 or v[@PT//16%3+2]*128 D(s)end if f(@MR,@MT,@CH,@CC)then s.m=v[@MT//16%3+2]D(s)end end end end local P,d=s.q,s.h and 0 or s.b-8192 if d~=0 then gtt(0,20)if d>@RATE then d=d-@RATE elseif d<-@RATE then d=d+@RATE else d=0 end s.b=8192+d P(s.b)local r=(16383-s.b)*9//16384 if r~=s.r then s.r=r for n=0,80 do if n%9<4 then local a=glag(0,n)local p=n//9==r and 255 or 30 glp(a,1,p)glp(a,2,p)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const WHEELS: CatalogEntry = {
  id: "wheels",
  name: "Wheels",
  description:
    "Pitch on the left springs home the moment you let go; the mod wheel on the right stays where you left it.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  // "precise" is true at a scale nothing else reaches (1024 bend positions) and lifts that
  // term off the floor facets.spec.ts asserts.
  tags: ["modulation", "expressive", "precise"],
  featured: false,
  addedAt: "2026-09-10",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs, the catalog's maximum (catalog.spec.ts caps a Lua entry at six), each one
  // literal token substitution (TUNE-01); every default is the INDEX of the value that
  // reproduces the canonical text. TOKEN PREFIX CHECK: no one of @CC, @CH, @PWC, @MWC, @DVC,
  // @RATE is a prefix of another. @RATE APPEARS ONLY IN THE TIMER and the three colours only
  // in the Setup; lua-entries.sweep.spec.ts asserts no live token survives in either event.
  knobs: [
    {
      id: "cc",
      label: "Mod controller",
      kind: "amount",
      token: "@CC",
      // The Mod wheel output's Number (change 17B): all of 0..127, its four old rungs first (CC1
      // the modulation wheel by convention; 11 expression, 74 brightness, 2 breath).
      values: numberValues(["1", "11", "74", "2"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Mod wheel MIDI channel",
      kind: "amount",
      token: "@CH",
      // The Mod wheel output's Channel (change 17B; both streams' before it). ZERO-BASED on the
      // wire, the rows read 1..16; sixteen since 17B (four before: 0, 1, 9, 15).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "pitch",
      label: "Pitch wheel colour",
      kind: "colour",
      token: "@PWC",
      // Columns 0..3, on layers 1 and 2: the marker row at phase 255, the rail at 30. APPEARS
      // TWICE - once per layer.
      values: ["0,180,255", "255,255,255", "180,0,255", "0,255,120"],
      default: 0,
    },
    {
      id: "mod",
      label: "Mod wheel colour",
      kind: "colour",
      token: "@MWC",
      // Columns 5..8, on layers 1 and 2. The four values sit apart from @PWC's at every index
      // (D-11-12-b); the shapes differ too, so no knob makes the two wheels read as one.
      values: ["255,150,0", "0,255,120", "255,0,180", "0,220,220"],
      default: 0,
    },
    {
      id: "divider",
      label: "Divider colour",
      kind: "colour",
      token: "@DVC",
      // Column 4, ON LAYER 1 ONLY - half brightness by the render sum, which is what a divider
      // wants. A boundary, not a control.
      values: ["90,90,110", "120,90,0", "0,90,90", "255,255,255"],
      default: 0,
    },
    {
      id: "spring",
      label: "Spring speed",
      kind: "spring",
      token: "@RATE",
      // How far the bend walks back towards 8192 per 20 ms fire: a full deflection comes home
      // in 32, 16, 8 or 4 fires (640 to 80 ms). Every value lands on EXACTLY 8192 because the
      // walk's last step is `else d=0`; lua-smoke.spec.ts drives all four.
      values: ["256", "512", "1024", "2048"],
      default: 1,
    },
    {
      id: "modType",
      label: "Mod wheel MIDI type",
      kind: "mode",
      token: "@MT",
      // The Mod wheel output's type (change 17B): a controller, a pitch bend, a channel pressure.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "modReceive",
      label: "Mod wheel MIDI receive",
      kind: "mode",
      token: "@MR",
      // The header INSTR the receive answers for the Mod wheel: 13 the host (On), 0 (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
    {
      id: "pitchType",
      label: "Pitch wheel MIDI type",
      kind: "mode",
      token: "@PT",
      // The Pitch wheel output's type (change 17B): a PITCH BEND by default (index 1), and under a
      // pitch bend the wheel keeps its fourteen bits (the card's whole point); under a controller
      // or a pressure it sends the top seven.
      values: CONTINUOUS_STATUSES,
      default: 1,
    },
    {
      id: "pitchChannel",
      label: "Pitch wheel MIDI channel",
      kind: "amount",
      token: "@PCH",
      // The Pitch wheel output's Channel (change 17B), the Mod wheel's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "pitchCc",
      label: "Pitch wheel controller",
      kind: "amount",
      token: "@PN",
      // The Pitch wheel output's Number (change 17B), read only under a controller: 16 by default
      // (general purpose 1), so a wheel switched to CC does not land on the mod wheel's 1.
      values: numberValues(),
      default: 16,
    },
    {
      id: "pitchReceive",
      label: "Pitch wheel MIDI receive",
      kind: "mode",
      token: "@PR",
      // The header INSTR the receive answers for the Pitch wheel.
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // Two outputs (change 17B): the Pitch wheel and the Mod wheel, continuous, each with its own
  // Type, Channel, Number and Receive - a received value moves the wheel's light and is held until
  // the next touch.
  outputs: [
    {
      id: "pitch",
      name: "Pitch wheel",
      kind: "continuous",
      tokens: { type: "@PT", channel: "@PCH", number: "@PN", receive: "@PR" },
    },
    {
      id: "mod",
      name: "Mod wheel",
      kind: "continuous",
      tokens: { type: "@MT", channel: "@CH", number: "@CC", receive: "@MR" },
    },
  ],

  // The same twelve indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    pitch: 0,
    mod: 0,
    divider: 0,
    spring: 1,
    modType: 0,
    modReceive: RECEIVE_ON_INDEX,
    pitchType: 1,
    pitchChannel: 0,
    pitchCc: 16,
    pitchReceive: RECEIVE_ON_INDEX,
  },

  // FALSE: Setup's D(self) lights all eighty-one cells - both rest states visible at power-on.
  // frames.spec.ts test 5 checks it; a lit entry cannot carry a DEMO_PATHS gesture
  // (listing.spec.ts).
  restsBlack: false,
};
