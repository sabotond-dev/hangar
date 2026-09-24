// ARC - an LFO you draw with your finger: a wave-shape knob and an offset fader.
//
// Slide left-right for the rate, up-down for the depth, lift, and it keeps sending a CC at 50 Hz.
// The Timer is the oscillator: the phase p steps by the rate, v is the chosen wave over p (@SHAPE,
// six: a parabolic sine, saw up, saw down, triangle, square, a random held for one cycle), and the
// CC is glim(64+(v-128)*s.d//255+offset,0,127). THE ANIMATION IS THE DATA: columns 0..7 are a swirl
// on layer 2 whose speed IS the rate (glf is rate-only), the 3x3 heart on layer 1 pulses at v scaled
// by the depth, and column 8 is the offset fader - a finger's height there is a held -64..+63 added
// to every CC, marked by one lit cell. Tap cell 40 to stop / resume. Knobs: @SWIRLC @ARMS @HEARTC @SHAPE
// and the LFO output's block @TYPE @CH @CC @RX (change 17; a received value sets the LFO's centre).
// History: docs/entries/arc.md (11-02, 11-09, 11-09.1, 12-05, 12.1-03, change 6 of 2026-09-17, change 17A).
//
// MECHANISM
//   - Setup: `F(f)` sets layer 2's rate on all 81 cells; per cell in columns 0..7, layer 2 @SWIRLC
//     with a phase stagger math.atan(n//9-4,n%9-4)*@ARMS//1%256 (41 is one arm: 256/(2*pi)
//     rounded) at rate 4, shape 3, glt 65535 (the keeper); column 8's layer 2 is painted black
//     (`glc(a,2,0,0,0,1)`: a Store lands on a live module, so the column is not left to whatever
//     the last configuration lit); layer 1 @HEARTC at phase 0 on all 81. State: self.r the rate
//     (1..32), self.d the depth (0..127), self.h the phase, self.s 1 running / 0 stopped, self.f
//     the swirl rate actually written (4 at Setup; glim(r//2,1,120) afterwards, so the resume is
//     exact), self.u the fader's calibrated height (0..512, 256 at Setup: no offset), self.c the
//     fader's lit cell (0 at Setup so the first tick paints 44), self.n the random's seed (1),
//     self.z the fader's contact id and self.w the swirl's (nil until a finger lands). `gtt(0,20)`.
//   - The handler, two contacts by role. An ended code (`e==3 or e>=5 and e<9`) forgets whichever
//     role the contact held and returns. On the onset edge (`e==4 or e>8`) the calibrated cell
//     `N(x,y)` decides the role: column 8 (`n%9==8`) makes this contact the fader (`s.z=i` - a
//     second finger on the fader takes it over; the first is ignored until it lifts and lands
//     again); anywhere else makes it the swirl's contact if none is held (`s.w=s.w or i`; a
//     second finger in the playing area is ignored, its centre taps included) and notes a cell-40
//     press (`t`). The fader's contact stores `s.u=U(y,KY)` on every sample and returns. A contact
//     that is neither returns. The swirl's contact: a code 9 (press and lift in one message)
//     releases the role first (`s.w=e<9 and i`, the fader's branch the same); a cell-40 press
//     toggles s.s, writes F(0) or F(s.f) and returns - so the stop finger stays the swirl's and a
//     wobble after the tap goes on tracking (12-05); otherwise s.d = 127-y; r = 1+x*31//127; on a rate change store it, s.f =
//     glim(r//2,1,120), and `if s.s>0 then F(s.f)end` - re-armed only while running, so a still
//     finger's wobble cannot restart the picture of a stopped card. A swirl finger dragged into
//     column 8 keeps driving the rate (x there is the right edge, as it always was).
//   - The Timer, `gtt(0,20)` first: p = (s.h + s.r*s.s)%256 (a stopped card freezes its phase, not
//     its rate); on the wrap (`p<s.h`, never true while stopped) the random advances,
//     s.n=(s.n*75+74)%65537, so the Random wave holds one value per cycle; `if p<s.r or s.s<1`
//     re-arm the keeper on layer 2; v = @SHAPE over p; the fader's cell c = 8+(s.u+32)//64*9 is
//     repainted on layer 1 only when it moved (the old cell to 0, the new to 255); send the CC;
//     paint the heart's nine cells at v*s.d//127 - scaled by the depth because the CC is, so the
//     heart goes dark and still exactly when the card goes quiet.
//   - The six waves, each an expression over p (0..255) landing in 0..255, comparison-free so
//     the offset and the depth scaling apply to every one unchanged: Sine
//     `128+(1-p//128*2)*(p%128*(128-p%128)*127//4096)` (a parabola per half-wave, 128 at 0, 255
//     at 64, 128 at 128, 1 at 192; D-08 admits no math.sin), Saw up `p`, Saw down `255-p`,
//     Triangle `255-math.abs(p*2-255)` (byte for byte the old `p<128 and p*2 or 510-p*2`), Square
//     `255-p//128*255` (high for the first half), Random `s.n%256`.
//   - The offset is 63-s.u*127//512: +63 at the top cell, 0 at the centre (u 256), -64 at the
//     bottom, held after the lift (a fader keeps its value) and added on every tick - running,
//     stopped, or while the other finger drags the rate.
//   - The hole the stop target leaves: a press STARTING in cell 40 (x 55..74, y 58..75 on the
//     measured knots) cannot set rate 14..19 at depth 52..69; a drag through the centre still
//     sets both, because a MOVE never reaches the toggle.
//
// WHAT IT SENDS
//   o = glim(64+(v-128)*s.d//255+63-s.u*127//512,0,127) every Timer tick, 50 a second, running or
//   stopped - a stopped ARC goes on sending its frozen value (one message repeated is what makes it
//   learnable; a silent stop would be indistinguishable from a Timer that raised), and the fader
//   moves that held value live. At depth 0 the value is 64 plus the offset. Since change 17 on the
//   output's TYPE (@TYPE, the status: 176 a controller @CC,o; 224 a pitch bend 0,o - 64 is the
//   centre; 208 a channel pressure o,0), kept in s.l as the last value sent.
// WHAT IT RECEIVES (change 17)
//   The host's message on the same type, channel and (a controller) number sets the LFO's CENTRE:
//   the offset fader moves to the value (s.u, the inverse of the offset, rounded so the value comes
//   back exactly at depth 0) and the Timer repaints its lit cell. A value equal to s.l is ARC's own
//   coming back and is ignored. @RX is the header INSTR it answers (13 On, 0 Off). The callback is
//   made by the TIMER, once per install - when s.touch_cb is not the one it saw (s.k) - because the
//   Setup is 806 of 908; it acts only while that touch callback is still the element's.
//
// TRAPS
//   - THE TWO glt(a,2,65535) CALLS ARE CORRECT AND MUST NOT BE REMOVED. 65535 is the keeper
//     idiom; it is the WRONG thing on a layer carrying a fast decay (the countdown is replaced
//     and the cell strobes forever - lua-smoke.spec.ts test 3), but layer 2 here is a continuous
//     background at rate 4, at most 120, three orders of magnitude below the guard's floor. A
//     zero rate with a keeper (stopped) is the legitimate form too. Do not "fix" it.
//   - THE STATE IS A SEPARATE FLAG, self.s; zeroing s.r would not work, because the handler
//     recomputes r on every accepted sample and the toggle would work in one direction only.
//   - THE STOP TAP TESTS `N(x,y)==40`, NOT `x*9//128+y*9//128*9==40`: the naive cell is a third
//     of a cell off the LED at (4,4) on the user's module (calibration.ts, Probe C). The fader
//     test `n%9==8` is the same calibrated cell, so the fader's edge is where the LEDs' is.
//   - THE GUARD IS `e==3 or e>=5 and e<9` AND THE UPPER BOUND IS THE POINT: a bare `e>=5`
//     returned early on a coalesced code-9 tap and neither the rate nor the depth followed.
//     touch-guard.spec.ts holds the convention. The onset edge `e==4 or e>8` is the house
//     spelling; a toggle placed ABOVE the ended guard would double-fire on a SLOW tap (4 then 5).
//   - `if s.s>0 then F(s.f)end` IN THE RATE BRANCH IS WHAT STOPS THE SWIRL ON THE PAD: without
//     it a resting finger's MOVEs re-armed layer 2 while the CC stayed frozen ("MIDI stops
//     reliably but the visual doesn't"); the preview cannot show it (a click has no MOVE).
//   - THE ROLES ARE PER CONTACT, NOT `i>0`: the fader may be contact 0 and the rate finger
//     contact 1, or the other way round, and a fader that lifts first must not hand the rate
//     finger's samples to nobody. `s.z` and `s.w` are ids; both are cleared on their own end code
//     and never on the other's. A lost lift (no end code) holds a role until the same id lands
//     again - the same class of stale as every entry without the library's `X` sweep.
//   - THE RANDOM IS AN LCG, NOT math.random: D-08 (lua-entries.sweep.spec.ts) forbids the VM's
//     random source (weakly seeded on ESP-IDF); (s.n*75+74)%65537 is a full-period arithmetic
//     scatter, the same sequence after every power cycle, one new value per LFO cycle.
//   - THE WAVE LITERAL IS FOLLOWED BY A COMMA (`local v,c=@SHAPE,...`), never by a space and a
//     name: `p s:gms(` needs the space and `...)s:gms(` does not, so a template with the literal
//     before a name is a fixed point of compressScript for some waves and not for others.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @SWIRLC and @HEARTC is 0..255.
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
  "--[[@cb]]local function F(f)for a=0,80 do glf(a,2,f)end end for n=0,80 do local a=glag(0,n)if n%9<8 then glc(a,2,@SWIRLC,1)glpfs(a,2,math.atan(n//9-4,n%9-4)*@ARMS//1%256,4,3)glt(a,2,65535)else glc(a,2,0,0,0,1)end glc(a,1,@HEARTC,1)glp(a,1,0)end self.r=4 self.d=127 self.h=0 self.s=1 self.f=4 self.u=256 self.c=0 self.n=1 self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then if i==s.z then s.z=nil elseif i==s.w then s.w=nil end return end local t if e==4 or e>8 then local n=N(x,y)if n%9==8 then s.z=i else s.w=s.w or i t=n==40 end end if i==s.z then s.u=U(y,KY)s.z=e<9 and i return end if i~=s.w then return end s.w=e<9 and i if t then s.s=1-s.s F(s.s<1 and 0 or s.f)return end s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r s.f=glim(r//2,1,120)if s.s>0 then F(s.f)end end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local p=(s.h+s.r*s.s)%256 if p<s.h then s.n=(s.n*75+74)%65537 end s.h=p if p<s.r or s.s<1 then for a=0,80 do glt(a,2,65535)end end local v,c=@SHAPE,8+(s.u+32)//64*9 if c~=s.c then glp(glag(0,s.c),1,0)glp(glag(0,c),1,255)s.c=c end local o,t=glim(64+(v-128)*s.d//255+63-s.u*127//512,0,127),@TYPE s.l=o s:gms(@CH,t,t==208 and o or t>223 and 0 or @CC,t==208 and 0 or o)for j=-1,1 do for k=-1,1 do glp(glag(0,40+j*9+k),1,v*s.d//127)end end if s.k~=s.touch_cb then s.k=s.touch_cb s.midirx_cb=function(s,h,v)if s.k==s.touch_cb and h[1]==@RX and v[1]==@CH and v[2]==@TYPE and(@TYPE>207 or v[3]==@CC)then local w=@TYPE==208 and v[3]or v[4]if w~=s.l then s.u=-((w-127)*512//127)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const ARC: CatalogEntry = {
  id: "arc",
  name: "Arc",
  description:
    "Draw an LFO with your finger: rate, depth and its wave, an offset fader down the right, and it keeps sending.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["modulation", "generative", "expressive"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Eight knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. The wave, then change 17's type and receive, are
  // last so a record's older indices still land on the knobs they were.
  knobs: [
    {
      id: "swirlColour",
      label: "Swirl colour",
      kind: "colour",
      token: "@SWIRLC",
      // Layer 2's colour. Every channel inside 0..255: the firmware truncates rather than clamps.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice([
        "0,110,255",
        "255,40,120",
        "0,255,140",
        "180,0,255",
        "255,255,255",
      ]),
      default: 0,
    },
    {
      id: "arms",
      label: "Arms",
      kind: "count",
      token: "@ARMS",
      // The phase multiplier on the cell's angle: 41 is one arm, 82 two, 123 three - the
      // compiler's own radial multipliers (41 is 256 / (2 * pi) rounded).
      values: ["41", "82", "123"],
      default: 0,
    },
    {
      id: "heartColour",
      label: "Heart colour",
      kind: "colour",
      token: "@HEARTC",
      // Layer 1's colour: the 3x3 heart and the fader's lit cell; a contrast with the swirl
      // makes the depth readable.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice([
        "255,255,120",
        "255,255,255",
        "255,90,0",
        "0,255,255",
        "255,0,120",
      ]),
      default: 0,
    },
    {
      id: "cc",
      label: "CC number",
      kind: "amount",
      token: "@CC",
      // The controller the LFO is sent on, 0..127 (change 17): the five it offered before first
      // (1 the modulation wheel, 16 and 20 general-purpose, 74 filter cutoff by convention, 102),
      // so a saved copy's index lands on its controller, then the rest ascending.
      values: numberValues(["1", "16", "20", "74", "102"]),
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "shape",
      label: "Wave shape",
      kind: "mode",
      token: "@SHAPE",
      // The wave as an expression over p (0..255) landing in 0..255, comparison-free (see the
      // header); worded by SHAPE_WORDS in src/lib/tune/view.ts - Sine, Saw up, Saw down,
      // Triangle, Square, Random - a six-option select. Triangle is index 3: the wave ARC had.
      values: [
        "128+(1-p//128*2)*(p%128*(128-p%128)*127//4096)",
        "p",
        "255-p",
        "255-math.abs(p*2-255)",
        "255-p//128*255",
        "s.n%256",
      ],
      default: 3,
    },
    {
      id: "midiType",
      label: "MIDI type",
      kind: "mode",
      token: "@TYPE",
      // The LFO output's type (change 17): the status byte - a controller, a pitch bend, a
      // channel pressure; worded by view.ts's MIDI_TYPE_WORDS through the output's role.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "midiReceive",
      label: "MIDI receive",
      kind: "mode",
      token: "@RX",
      // The header INSTR the callback answers: 13 the host's REPORT (On), 0 nothing (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // The one output (change 17): the LFO, continuous, its four rows in the MIDI section.
  outputs: [
    {
      id: "lfo",
      name: "LFO",
      kind: "continuous",
      tokens: {
        type: "@TYPE",
        channel: "@CH",
        number: "@CC",
        receive: "@RX",
      },
    },
  ],

  // The same eight indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    swirlColour: 0,
    arms: 0,
    heartColour: 0,
    cc: 1,
    channel: 0,
    shape: 3,
    midiType: 0,
    midiReceive: RECEIVE_ON_INDEX,
  },

  // FALSE: the swirl is armed at Setup, so the card is lit and moving from the first tick.
  // frames.spec.ts checks it in both directions.
  restsBlack: false,
};
