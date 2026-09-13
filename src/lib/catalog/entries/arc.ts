// ARC - a modulation LFO you draw with your finger.
//
// A hands-free modulation source: slide left-right to set the rate, up-down to set the depth,
// lift, and it keeps sending. The Timer runs a triangle oscillator at 50 Hz and sends it as a
// CC. THE ANIMATION IS THE DATA: the whole pad is a swirl on layer 2 whose rotation speed IS the
// LFO rate (glf is a rate-only setter, so it accelerates without a phase jump), and a 3x3 heart
// on layer 1 pulses at the LFO value scaled by the depth. Tap the centre to stop it (the swirl
// freezes lit, the CC holds), tap again to resume. Single-contact; ARC draws no finger. Knobs:
// @SWIRLC, @ARMS, @HEARTC, @CC, @CH. Setup 528 of 908 at the picker corner (525 at the defaults),
// Timer 275 (273); restsBlack false, `animated`. Fastest cycle about 165 ms on the 20 ms clock.
// History: docs/entries/arc.md (11-02, 11-09, 11-09.1, 12-05, 12.1-03 measurements and costings).
//
// MECHANISM
//   - Setup: `F(f)` sets layer 2's rate on all 81 cells; per cell, layer 2 @SWIRLC with a phase
//     stagger math.atan(n//9-4,n%9-4)*@ARMS//1%256 (41 is one arm: 256/(2*pi) rounded) at rate
//     4, shape 3, glt 65535 (the keeper); layer 1 @HEARTC at phase 0. State: self.r the rate
//     (1..32), self.d the depth (0..127), self.h the phase, self.s 1 running / 0 stopped,
//     self.f the swirl rate actually written (4 at Setup; glim(r//2,1,120) afterwards, so the
//     resume is exact). `gtt(0,20)`.
//   - The handler: `if i>0 or e==3 or e>=5 and e<9 then return end` (single contact; the ended
//     guard). On the onset edge `(e==4 or e>8) and N(x,y)==40` - the nearest CALIBRATED cell,
//     no hysteresis, the right shape for a press-time lookup - toggle s.s and F(0) or F(s.f),
//     return. Otherwise s.d = 127-y; r = 1+x*31//127; on a rate change store it, s.f =
//     glim(r//2,1,120), and `if s.s>0 then F(s.f)end` - the swirl is re-armed only while
//     running, so a still finger's wobble (a real rate change: cell 40 alone spans six of the
//     thirty-one steps) cannot restart the picture of a stopped card while s.d, s.r and s.f
//     keep tracking the drag.
//   - The Timer, `gtt(0,20)` first: p = (s.h + s.r*s.s)%256 (a stopped card freezes its phase,
//     not its rate); `if p<s.r or s.s<1` re-arm the keeper on layer 2 (true on the phase wrap,
//     and every tick while stopped - a stopped card has no wrap and 65535 ticks later the layer
//     would expire); v = the triangle p<128 and p*2 or 510-p*2; send the CC; paint the heart's
//     nine cells at v*s.d//127 - scaled by the depth because the CC is, so the heart goes dark
//     and still exactly when the card goes quiet (not the emitted byte: at depth 0 that is a
//     constant 128, a steady glow on a silent card).
//   - The hole the stop target leaves: a press STARTING in cell 40 (x 55..74, y 58..75 on the
//     measured knots) cannot set rate 14..19 at depth 52..69; a drag through the centre still
//     sets both, because a MOVE never reaches the toggle.
//
// WHAT IT SENDS
//   s:gms(@CH,176,@CC,glim(64+(v-128)*s.d//255,0,127),0) every Timer tick, 50 a second, running
//   or stopped - a stopped ARC goes on sending its frozen value (one CC repeated is what makes it
//   learnable; a silent stop would be indistinguishable from a Timer that raised). At depth 0 the
//   controller is a constant 64 by design.
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
//     of a cell off the LED at (4,4) on the user's module (calibration.ts, Probe C).
//   - THE GUARD IS `e==3 or e>=5 and e<9` AND THE UPPER BOUND IS THE POINT: a bare `e>=5`
//     returned early on a coalesced code-9 tap and neither the rate nor the depth followed.
//     touch-guard.spec.ts holds the convention. The onset edge `e==4 or e>8` is the house
//     spelling; a toggle placed ABOVE the ended guard would double-fire on a SLOW tap (4 then 5).
//   - `if s.s>0 then F(s.f)end` IN THE RATE BRANCH IS WHAT STOPS THE SWIRL ON THE PAD: without
//     it a resting finger's MOVEs re-armed layer 2 while the CC stayed frozen ("MIDI stops
//     reliably but the visual doesn't"); the preview cannot show it (a click has no MOVE).
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @SWIRLC and @HEARTC is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local function F(f)for a=0,80 do glf(a,2,f)end end for n=0,80 do local a=glag(0,n)glc(a,2,@SWIRLC,1)glpfs(a,2,math.atan(n//9-4,n%9-4)*@ARMS//1%256,4,3)glt(a,2,65535)glc(a,1,@HEARTC,1)glp(a,1,0)end self.r=4 self.d=127 self.h=0 self.s=1 self.f=4 self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 and e<9 then return end if(e==4 or e>8)and N(x,y)==40 then s.s=1-s.s F(s.s<1 and 0 or s.f)return end s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r s.f=glim(r//2,1,120)if s.s>0 then F(s.f)end end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local p=(s.h+s.r*s.s)%256 s.h=p if p<s.r or s.s<1 then for a=0,80 do glt(a,2,65535)end end local v=p<128 and p*2 or 510-p*2 s:gms(@CH,176,@CC,glim(64+(v-128)*s.d//255,0,127),0)for j=-1,1 do for k=-1,1 do glp(glag(0,40+j*9+k),1,v*s.d//127)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const ARC: CatalogEntry = {
  id: "arc",
  name: "Arc",
  description:
    "Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows the rate.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["modulation", "generative", "expressive"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "swirlColour",
      label: "Swirl colour",
      kind: "colour",
      token: "@SWIRLC",
      // Layer 2's colour. Every channel inside 0..255: the firmware truncates rather than clamps.
      values: [
        "0,110,255",
        "255,40,120",
        "0,255,140",
        "180,0,255",
        "255,255,255",
      ],
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
      // Layer 1's colour, the 3x3 heart; a contrast with the swirl makes the depth readable.
      values: [
        "255,255,120",
        "255,255,255",
        "255,90,0",
        "0,255,255",
        "255,0,120",
      ],
      default: 0,
    },
    {
      id: "cc",
      label: "CC number",
      kind: "amount",
      token: "@CC",
      // The controller the LFO is sent on: 1 the modulation wheel, 74 filter cutoff by
      // convention, 16 and 20 general-purpose.
      values: ["1", "16", "20", "74", "102"],
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058).
      values: [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
      ],
      default: 0,
    },
  ],

  // The same five indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    swirlColour: 0,
    arms: 0,
    heartColour: 0,
    cc: 1,
    channel: 0,
  },

  // FALSE: the swirl is armed at Setup, so the card is lit and moving from the first tick.
  // frames.spec.ts checks it in both directions.
  restsBlack: false,
};
