// ARC - a modulation LFO you draw with your finger.
//
// A hands-free modulation source, which is the one thing a controller usually
// cannot do: modulate without you. Slide left-right to set the rate, up-down to
// set the depth, lift, and it keeps sending. The Timer runs a triangle
// oscillator at 50 Hz and sends it as a CC.
//
// THE ANIMATION IS THE DATA. The whole pad is a swirl on layer 2 - a phase
// stagger from math.atan of each cell's angle from the centre - and the swirl's
// rotation speed IS the LFO rate. That works because glf(a, layer, fre) is a
// RATE-ONLY setter: it changes speed without resetting phase, so the swirl
// accelerates smoothly under your finger instead of jumping. In the middle, a
// 3x3 heart on layer 1 pulses at exactly the LFO value, so you can see the
// modulation and not only hear it.
//
// THE TWO glt(a,2,65535) CALLS ARE CORRECT AND MUST NOT BE REMOVED. 65535 is
// the keeper idiom - a maximum timeout that stops the LED engine ever freezing
// the layer - and it is the WRONG thing to write on a layer carrying a fast
// decaying trail, because it replaces the countdown and the cell strobes
// forever. That bug shipped in three drafts during research, and
// src/lib/sim/lua-smoke.spec.ts test 3 exists to make it impossible. It does
// not fire here, and it should not: its signature is a near-maximum timeout
// TOGETHER WITH a decay rate at or above 200. Layer 2 here is a continuous
// background whose rate is 4 at rest and at most glim(r//2, 1, 120) under a
// finger, three orders of magnitude of margin below the guard's floor. This is
// the legitimate keeper form. Do not "fix" it.
//
// The Timer's keeper is folded into the oscillator rather than written
// separately: "if p<s.r" is true exactly on the phase wrap, so layer 2 is
// re-armed once per LFO revolution for forty characters instead of a second
// keeper pass.
//
// Honest limit for the card copy: the 20 ms Timer is the LFO clock, so the
// fastest cycle is about 165 ms and anything faster gets steppy.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 379 characters, Timer 251, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the five-knob cross-product is 382 / 253, against a budget of 908
// an event. src/lib/catalog/lua-entries.spec.ts asserts every one of those.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)glc(a,2,@SWIRLC,1)glpfs(a,2,math.atan(n//9-4,n%9-4)*@ARMS//1%256,4,3)glt(a,2,65535)glc(a,1,@HEARTC,1)glp(a,1,0)end self.r=4 self.d=127 self.h=0 self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 then return end s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r local f=glim(r//2,1,120)for a=0,80 do glf(a,2,f)end end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local p=(s.h+s.r)%256 s.h=p if p<s.r then for a=0,80 do glt(a,2,65535)end end local v=p<128 and p*2 or 510-p*2 s:gms(@CH,176,@CC,glim(64+(v-128)*s.d//255,0,127),0)for j=-1,1 do for k=-1,1 do glp(glag(0,40+j*9+k),1,v)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const ARC: CatalogEntry = {
  id: "arc",
  name: "ARC",
  description:
    "Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows the rate.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["modulation", "hands-free", "hypnotic", "gestural"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "swirlColour",
      label: "Swirl colour",
      kind: "colour",
      token: "@SWIRLC",
      // Layer 2's colour, as three uint8 channels. Every channel is inside
      // 0..255 on purpose: the firmware truncates rather than clamps, so 260
      // would render as 4 and turn a bright swirl nearly black with no warning.
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
      // The phase multiplier on the cell's angle, which is what decides how
      // many arms the swirl has. 41 is one arm, 82 two, 123 three - the same
      // multipliers the compiler's own radial looks use, because 41 is
      // 256 / (2 * pi) rounded and one full turn is therefore one full phase
      // cycle.
      values: ["41", "82", "123"],
      default: 0,
    },
    {
      id: "heartColour",
      label: "Heart colour",
      kind: "colour",
      token: "@HEARTC",
      // Layer 1's colour, worn by the 3x3 heart that pulses at the LFO value.
      // A colour that contrasts with the swirl is what makes the depth
      // readable at a glance.
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
      // The controller number the LFO is sent on. 1 is the modulation wheel and
      // 74 is filter cutoff by the MIDI CC convention most synths follow; 16
      // and 20 are in the general-purpose range and collide with nothing.
      values: ["1", "16", "20", "74", "102"],
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. A channel silently swapped with a
      // command byte produces a configuration that runs clean and plays
      // nothing.
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

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    swirlColour: 0,
    arms: 0,
    heartColour: 0,
    cc: 1,
    channel: 0,
  },

  // The swirl is armed at Setup with a continuous rate and a keeper, so the
  // card is lit and moving from the first tick, with no finger anywhere near
  // it. frames.spec.ts proves this in both directions.
  restsBlack: false,
};
