// WHEELS - a pitch wheel on the left, a mod wheel on the right, and the whole point of the card
// is that THEY ARE NOT THE SAME CONTROL.
//
// Columns 0..3 are a spring-loaded pitch wheel (fourteen-bit bend, one lit row that travels,
// rests at the middle row, springs home on the wire when the finger lifts); columns 5..8 are a
// mod wheel (seven-bit CC, a bar that fills from the bottom, stays where it was left, rests at
// zero); column 4 is a lit divider that belongs to neither. The only entry that spends both
// events: Setup 895 of 908 at the picker corner (882 at the defaults; 13 free, the tightest in
// the catalog), Timer 343 (338). Knobs: @CC, @CH, @PWC, @MWC, @DVC, @RATE. Kind "lua": the
// compiler's sheet has no pitch-bend out-call. lua-smoke.spec.ts asserts the four asymmetries.
// History: docs/entries/wheels.md (the ask, the sketch ladder 1118 / 1035 / 922 / 895, 11-15).
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
//     `self.k` start nil so the first call paints. Setup ends `D(self)` and has no paint loop.
//   - The LEDs are the readout, not the quantiser: pitch sends (1023-y)*16383//1023 (1024 bend
//     values; the marker row is a second, independent derivation), mod sends (1023-y)*127//1023.
//   - THE ORIGIN LOCK: `s.o[i]` is written on `e==4 or e>8 or c==nil` and read on every later
//     sample, so a finger that starts on pitch and crosses the divider keeps bending. The two
//     branches are `c<4` and `c>4`; a contact that begins on column 4 does nothing.
//   - A lift (`e~=1 and e~=4 and e<9`): if the contact's onset column was pitch, `s.h=nil` and
//     `gtt(0,20)` arms the spring; `s.o[i]=nil`. A pitch sample sets `s.h=1` (a held finger
//     stops the spring); a code 9 in the pitch branch is its own release and arms it too.
//   - THE TIMER (armed on a lift, never by Setup): `d = s.h and 0 or s.b-8192` (0 is truthy, so
//     a held wheel does nothing and does not re-arm); if d ~= 0, re-arm `gtt(0,20)`, walk d
//     towards zero by @RATE and STOP AT EXACTLY ZERO (`else d=0`), b = 8192+d, send the bend,
//     and repaint the pitch columns' PHASES only (its own smaller copy of the pitch repaint - a
//     Timer body is a separate chunk and cannot see a Setup local). The fire that lands on zero
//     does not re-arm: the disarm is the absence of a re-arm, never gtt(0,0). The re-arm is
//     not the first statement because whether to re-arm is the question; nothing before it can
//     raise. The period is the literal 20.
//
// WHAT IT SENDS
//   pitch  s:gms(@CH,224,b%128,b//128,0) - status 224, fourteen bits, centre 8192, LOW BYTE
//          FIRST; on every pitch sample and on every spring step, the last one exactly 8192.
//          16383 at y = 0 and 0 at y = 1023, both ends exact; 8192 is not reachable by hand
//          (8199 at y = 511, 8183 at y = 512) - a spring-loaded wheel is one you let go of.
//   mod    s:gms(@CH,176,@CC,v,0), only when v changed.
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
//   - The card is `static` in frames.json though it stores a Timer: Setup never arms it.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self:txma(1023)self:tyma(1023)self.o={}self.b=8192 self.m=0 local function D(s)local r=(16383-s.b)*9//16384 local k=s.m*10//128 if r==s.r and k==s.k then return end s.r=r s.k=k for n=0,80 do local c=n%9 local w=n//9 local a=glag(0,n)local p=255 if c<4 then glc(a,1,@PWC,1)glc(a,2,@PWC,1)p=w==r and 255 or 30 elseif c>4 then glc(a,1,@MWC,1)glc(a,2,@MWC,1)p=w>=9-k and 255 or 30 else glc(a,1,@DVC,1)end glp(a,1,p)glp(a,2,p)end end D(self)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then if(s.o[i]or 9)<4 then s.h=nil gtt(0,20)end s.o[i]=nil return end local c=s.o[i]if e==4 or e>8 or c==nil then c=x*9//1024 s.o[i]=c end if c<4 then s.h=1 s.b=(1023-y)*16383//1023 s:gms(@CH,224,s.b%128,s.b//128,0)if e>8 then s.o[i]=nil s.h=nil gtt(0,20)end elseif c>4 then local v=(1023-y)*127//1023 if v~=s.m then s.m=v s:gms(@CH,176,@CC,v,0)end end D(s)end";

const TIMER =
  "--[[@cb]]local s=self local d=s.h and 0 or s.b-8192 if d~=0 then gtt(0,20)if d>@RATE then d=d-@RATE elseif d<-@RATE then d=d+@RATE else d=0 end s.b=8192+d s:gms(@CH,224,s.b%128,s.b//128,0)local r=(16383-s.b)*9//16384 if r~=s.r then s.r=r for n=0,80 do if n%9<4 then local a=glag(0,n)local p=n//9==r and 255 or 30 glp(a,1,p)glp(a,2,p)end end end end";

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
      // ONE controller: pitch bend has a status byte of its own. CC1 is the modulation wheel
      // by convention; 11 expression, 74 brightness (GM2/GS), 2 breath. All inside 0..127.
      values: ["1", "11", "74", "2"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, the first argument of gms; both streams ride it. Four channels, not sixteen.
      values: ["0", "1", "9", "15"],
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
  ],

  // The same six indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    pitch: 0,
    mod: 0,
    divider: 0,
    spring: 1,
  },

  // FALSE: Setup's D(self) lights all eighty-one cells - both rest states visible at power-on.
  // frames.spec.ts test 5 checks it; a lit entry cannot carry a DEMO_PATHS gesture
  // (listing.spec.ts).
  restsBlack: false,
};
