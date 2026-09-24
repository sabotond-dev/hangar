// RADAR - rings roll out from the centre and the pad sends the first finger's position; the
// ring rolls in the firmware at the speed knob or steps on the DAW's MIDI clock (change 12b,
// 2026-09-18, BENCH-2026-09-16.txt section 12).
//
// The ported RADAR preset rebuilt by hand so it can take ORBIT's clock idiom: the compiled
// preset's ripple loop, comet and first-finger CC pair carried verbatim with the knobs as tokens,
// plus Sync and Division. The preset itself stays on the shelf (presets.ts) untouched. Setup 856
// of 908 at the picker corner (847 at the defaults), Timer 412 (408); @COL @SPEED @SYNC @DIV and
// since change 17B two MIDI outputs, the X axis (@XT @CH @CC @XR) and the Y axis (@YT @YCH @YCC
// @YR), twelve knobs. Off the front door: a Lua card cannot sit in the row (front-door.ts).
// History: docs/entries/radar.md (the ask, the preset's strings pinned, the divergences, the costs;
// change 17B).
//
// MECHANISM
//   - Setup, the preset's loop: for every cell `p = math.sqrt(u*u+v*v)*45//1` (u, v the offset
//     from cell 40; 45 the largest multiplier that keeps the corner under 256, so exactly one
//     ring is ever on screen), kept in `self.a[n]`; layer 2 `glc(a,2,@COL,1)` then
//     `glpfs(a,2,p,@SYNC and 0 or 256-@SPEED,3)glt(a,2,65535)` - the firmware's sine (shape 3)
//     walked from p at 256-@SPEED a tick (the firmware ADDS fre, grid_led.c:191-211, so 254 is
//     -2: the crest moves outward, 256/@SPEED ticks a ring), a keeper the Timer re-arms; layer 1
//     `glc(a,1,255,170,34,1)` the comet's colour, the preset's fixed 255,170,34. Byte for byte
//     the compiled preset's calls, so frames.json's radar block did not move. Under External
//     fre is 0: the phase FREEZES at p (the rest picture) until the DAW's clock moves it.
//   - `local function f(s)`, the step, a Setup LOCAL (the Setup has the room, and a clock inside
//     the Timer's 300 s period must find it): k = s.k%8, advance, then every cell's layer-2 phase
//     to (s.a[n]+k*32)%256 - eight steps a ring, so at Division 16th a ring is eight 16ths, half
//     a bar (RADAR POINTS's ping), at 8th a bar, at 32nd a beat. Nothing is published: no `s.f`
//     step (see TRAPS - `s.f` is the finger).
//   - The callback is the compiled preset's, verbatim but for the tokens: `K(x,y,1,252)` the
//     library's calibrated comet on layer 1; `if(e==4 or e==9)and not s.f then s.f=i end` claims
//     the FIRST finger; `if i==s.f then` on 1 / 4 / >8 the pair through `M` (change 17B: each
//     axis on its output's type), on 3 / >=5 the release.
//   - `self.rtmrx_cb=function(s,h,b)` - ORBIT's clock idiom (docs/entries/orbit.md): 250 Start
//     resets k and q (the next clock lands step 0, the rest picture: the ring back at the
//     centre) and runs; 251 Continue runs; 252 Stop halts - the ring stays where it is; 248
//     while running steps every @DIV clocks (12 / 6 / 3 = an 8th / 16th / 32nd at 24 per
//     quarter). No release: this card holds no note. `grxm(2,@SYNC and 3 or 0)` routes MIDIRTM to
//     Lua under External only; `gtt(0,3e5)` the preset's Timer period; then `self:tim()` (change
//     17B): the Timer body run once inside the Setup - it re-arms the same period and the same
//     keepers (no state moves) and makes the receive callback on its first run.
//   - The Timer is the preset's: re-arm, then `glt(a,2,65535)` on every cell so the look layer
//     never reaches timeout 0 while the module lives. It steps nothing under either mode - the
//     firmware rolls the ring under Internal, the clock under External. Since change 17B it also
//     makes the receive, once per install (`s.j`, the touch callback it was made beside) - which
//     is why the Setup pulls it in: its first timed run is five minutes away.
//
// WHAT IT SENDS (two outputs since change 17B)
//   M(@XT,@CH,@CC,x) M(@YT,@YCH,@YCC,y) - the raw sensor pair, each axis by its type (a controller
//             n, o; a pitch bend 0, o; a pressure o, 0), on every sample of the first finger
//             (press, move and the fast tap), as the compiled preset sends it: no send-on-change,
//             no calibration, no second finger. The mode changes none of it. At the defaults the
//             pair is the preset's: 16 and 17 on channel 1 (zero-based 0).
// WHAT IT RECEIVES (change 17B; @XR / @YR the header INSTR, 13 On, 0 Off)
//   The host's message on an axis's type, channel and (a controller) number sets that axis of the
//   held pair `s.u, s.w` (the centre until one arrives) and the library's comet is drawn there,
//   `K(s.u,s.w,1,252)` - the lights follow the DAW's value. Nothing is sent back. The latch: one
//   control, claimed by the first finger - already latched.
//
// TRAPS
//   - `s.f` IS THE FIRST FINGER'S CONTACT ID, the compiled preset's own field, NOT the idiom's
//     published step: the step is the Setup local `f`, called directly. Nothing reads `s.f` as
//     a function and nothing may publish one under that name.
//   - THE FIRMWARE ADDS fre: 256-@SPEED is the outward roll; @SPEED itself would roll inward
//     (the preset's rings-from-edge). A sign-turned walk (128-p at +@SPEED) was measured and
//     NOT taken: the sine lookup is symmetric only to rounding (s(0) 128, s(128) 126), so the
//     frames moved by a byte here and there. The rate 254 beside a keeper on this layer is the
//     compiler's own idiom, and lua-smoke.spec.ts's keeper guard reads the SHAPE to tell it
//     from pitfall 1 (a keeper on a shape-0 decay).
//   - EVERY @SPEED VALUE IS THE PRESET'S DETENT (1 2 3 4 6 8 12 16, SPEED_TABLE); the rail
//     ascends with the speed, 256/@SPEED ticks a ring.
//   - `@SYNC and 0 or 256-@SPEED`: 0 is TRUTHY in Lua, so `true and 0` is 0 and External freezes
//     the walk; the same fold as `grxm(2,@SYNC and 3 or 0)`.
//   - THE STEP WRITES 81 PHASES AND NO RATE: `glp` leaves fre at 0, so a stepped ring never
//     starts rolling on its own; k*32 is a phase, taken %256 so it stays a byte.
//   - @SYNC APPEARS TWICE IN THE SETUP (the fre fold and the routing) and both must move
//     together; @SPEED once. THE TIMER CARRIED NO TOKEN until change 17B; it carries the receive's.
//   - THE PREVIEW HAS NO CLOCK: `sync` declares `previewIndex: 0`, so the browser renders Internal
//     whatever the knob says and the inspector says so; the wire carries the visitor's choice.
//   - `grxm(2,mode)` NEEDS A NUMBER, which is why the Sync literal is a boolean folded to 3 or 0.
//   - 254 (active sensing) MUST NOT STEP: the run test is `b==250 or b==251`.
//   - THE EVENT GUARDS ARE THE COMPILER'S: `e==4 or e==9` for the claim, `e==1 or e==4 or e>8`
//     for the live sample, `e==3 or e>=5` for the release - touch-guard.spec.ts reads them as the
//     compiled presets are read; a re-spelling is a wire change, not a tidy.
//   - LAYER 0 IS THE FIRMWARE'S ALERT LAYER; this card paints nothing on it (the comet is on
//     layer 1, the ring on 2), so an alert's recolour touches nothing of its own.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @COL value is 0..255.
//   - restsBlack is FALSE from tick 0 (the ring is lit), so no DEMO_PATHS gesture.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
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
  "--[[@cb]]self.a={}self.k=0 self.q=0 for n=0,80 do local a,u,v=glag(0,n),n%9-4,n//9-4 local p=math.sqrt(u*u+v*v)*45//1 self.a[n]=p glc(a,2,@COL,1)glpfs(a,2,p,@SYNC and 0 or 256-@SPEED,3)glt(a,2,65535)glc(a,1,255,170,34,1)end local function f(s)local k=s.k%8 s.k=k+1 for n=0,80 do glp(glag(0,n),2,(s.a[n]-k*32)%256)end end local function M(t,c,n,o)self:gms(c,t,t==208 and o or t>223 and 0 or n,t==208 and 0 or o)end self.touch_cb=function(s,i,e,x,y)K(x,y,1,252)if(e==4 or e==9)and not s.f then s.f=i end if i==s.f then if e==1 or e==4 or e>8 then M(@XT,@CH,@CC,x)M(@YT,@YCH,@YCC,y)end if e==3 or e>=5 then s.f=nil end end end self.rtmrx_cb=function(s,h,b)if b==250 then s.k=0 s.q=0 end if b==250 or b==251 then s.r=1 elseif b==252 then s.r=nil elseif b==248 and s.r then if s.q%@DIV==0 then f(s)end s.q=s.q+1 end end grxm(2,@SYNC and 3 or 0)gtt(0,3e5)self:tim()";

const TIMER =
  "--[[@cb]]gtt(0,3e5)for a=0,80 do glt(a,2,65535)end local s=self if s.j~=s.touch_cb then s.j=s.touch_cb s.u=64 s.w=64 local k=s.j s.midirx_cb=function(s,e,v)local function f(r,t,c,n)return e[1]==r and v[2]==t and v[1]==c and(t>207 or v[3]==n)and v[t//16%3+2]end if s.touch_cb==k then local a,b=f(@XR,@XT,@CH,@CC),f(@YR,@YT,@YCH,@YCC)if a then s.u=a end if b then s.w=b end if a or b then K(s.u,s.w,1,252)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const RADAR: CatalogEntry = {
  id: "radar",
  name: "Radar",
  // The preset's sentence, with the house apostrophe (U+2019, copy.spec.ts): the shelf's ASCII
  // one is what typographic.ts curls at render time on a preset card.
  description:
    "Rings roll out from the centre, and the pad sends your finger’s position to your computer.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts; the
  // ported card's three, unchanged, so the FEELS histogram moves by zero.
  tags: ["modulation", "generative", "expressive"],
  featured: false,
  addedAt: "2026-09-18",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs: the preset's three (colour, speed, send) as tokens plus Sync and Division, each
  // one literal token substitution; the stamp shape character is derived from these counts.
  // Every default is the INDEX of the value that reproduces the preset's compiled text. TOKEN
  // PREFIX CHECK: none of @COL, @SPEED, @CC, @SYNC, @DIV is a prefix of another.
  knobs: [
    {
      id: "colour",
      label: "Ring colour",
      kind: "colour",
      token: "@COL",
      // Layer 2, the ring. The preset's 255,68,0 first; the comet's 255,170,34 is fixed.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice([
        "255,68,0",
        "0,110,255",
        "0,255,140",
        "255,255,255",
        "180,0,255",
      ]),
      default: 0,
    },
    {
      id: "speed",
      label: "Ring speed",
      kind: "speed",
      token: "@SPEED",
      // The firmware's phase units per 10 ms tick, the preset's eight detents (SPEED_TABLE):
      // 256/@SPEED ticks a ring - 2.56 s, 1.28 s (the preset's default), 0.85, 0.64, 0.43,
      // 0.32, 0.21, 0.16 s. Ascending, so the bigger number and the faster ring are the same end.
      // Not a BPM rail: a ring is 256/@SPEED ticks and no BPM ladder lands 1.28 s exactly.
      // Read under Internal only (the fold in the Setup zeroes it under External).
      values: ["1", "2", "3", "4", "6", "8", "12", "16"],
      default: 1,
    },
    {
      id: "send",
      label: "X controller",
      kind: "amount",
      token: "@CC",
      // X on this number, Y on "@CC+1"; the preset's SEND_OPTIONS (knobs.preset.ts), the same
      // twelve, so a tuned RADAR reaches the same controllers it did. Every value leaves the pair
      // inside 0..127.
      values: numberValues([
        "16",
        "20",
        "24",
        "28",
        "32",
        "36",
        "40",
        "44",
        "48",
        "52",
        "64",
        "80",
      ]),
      default: 0,
    },
    {
      id: "sync",
      label: "Sync",
      kind: "mode",
      token: "@SYNC",
      // Internal: the firmware rolls the ring at the speed knob and MIDIRTM stays unrouted
      // (`grxm(2,0)`). External: the walk is frozen (fre 0) and `grxm(2,3)` routes the host's
      // realtime bytes to `rtmrx_cb`, which steps the ring every @DIV clocks from Start. Worded
      // by view.ts's SYNC_WORDS. APPEARS TWICE IN THE SETUP. The browser has no clock: the preview
      // renders Internal (`previewIndex`).
      values: ["false", "true"],
      default: 0,
      previewIndex: 0,
    },
    {
      id: "division",
      label: "Division",
      kind: "mode",
      token: "@DIV",
      // MIDI clocks per ring step at 24 per quarter: 12 an 8th, 6 a 16th, 3 a 32nd; eight steps
      // a ring. Worded by view.ts's DIVISION_WORDS. Read under External only.
      values: ["12", "6", "3"],
      default: 1,
    },
    {
      id: "channel",
      label: "X MIDI channel",
      kind: "amount",
      token: "@CH",
      // The X axis's Channel (change 17B; the preset's fixed 0 before it - the default).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "xType",
      label: "X MIDI type",
      kind: "mode",
      token: "@XT",
      // The X axis's type (change 17B): a controller, a pitch bend, a channel pressure.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "xReceive",
      label: "X MIDI receive",
      kind: "mode",
      token: "@XR",
      // The header INSTR the receive answers for X: 13 the host (On), 0 (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
    {
      id: "yType",
      label: "Y MIDI type",
      kind: "mode",
      token: "@YT",
      // The Y axis's type (change 17B).
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "yChannel",
      label: "Y MIDI channel",
      kind: "amount",
      token: "@YCH",
      // The Y axis's Channel (change 17B), the X axis's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "yCc",
      label: "Y controller",
      kind: "amount",
      token: "@YCC",
      // The Y axis's Number (change 17B): 17 by default, the old "@CC+1" at the default. @YCC,
      // not @CCY: @CC would be a prefix of it.
      values: numberValues(),
      default: 17,
    },
    {
      id: "yReceive",
      label: "Y MIDI receive",
      kind: "mode",
      token: "@YR",
      // The header INSTR the receive answers for Y.
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // Two outputs (change 17B): the first finger's raw pair, each axis on its own Type, Channel and
  // Number, each receiving - a received value draws the comet where the DAW's pair is.
  outputs: [
    {
      id: "x",
      name: "X axis",
      kind: "continuous",
      tokens: { type: "@XT", channel: "@CH", number: "@CC", receive: "@XR" },
    },
    {
      id: "y",
      name: "Y axis",
      kind: "continuous",
      tokens: { type: "@YT", channel: "@YCH", number: "@YCC", receive: "@YR" },
    },
  ],

  // The same five indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    colour: 0,
    speed: 1,
    send: 0,
    sync: 0,
    division: 1,
    channel: 0,
    xType: 0,
    xReceive: RECEIVE_ON_INDEX,
    yType: 0,
    yChannel: 0,
    yCc: 17,
    yReceive: RECEIVE_ON_INDEX,
  },

  // FALSE from tick 0: the ring is lit by Setup. frames.spec.ts test 5 checks it; a lit entry
  // cannot carry a demonstration gesture.
  restsBlack: false,
};
