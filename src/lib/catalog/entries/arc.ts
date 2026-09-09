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
// 3x3 heart on layer 1 pulses at the LFO value SCALED BY THE DEPTH, so you can
// see the modulation and not only hear it.
//
// THE HEART IS SCALED BY s.d BECAUSE THE CC IS, AND THE PICTURE MUST NOT LIE
// (plan 11-09, from the bench: "cannot see amplitude need visual feedback for
// that"). Until 11-09 the heart was painted with the RAW triangle - glp(a,1,v)
// - while the CC went out as glim(64+(v-128)*s.d//255,0,127), depth-scaled. At
// the bottom edge of the pad s.d = 127 - y = 0, so the controller pinned at 64
// and the card was sending nothing AT ALL while the heart went on swinging its
// full 0..254. Measured through the real Lua host before the change, at three
// depths:
//
//   d = 127   heart span 254   CC excursion from 64: 64
//   d =  63   heart span 254   CC excursion from 64: 32
//   d =   0   heart span 254   CC excursion from 64:  0   <- the lie
//
// and after it: spans 254 / 126 / 0 against excursions 64 / 32 / 0. The heart
// now goes dark and still exactly when the card goes quiet.
//
// THE SCALE IS v*s.d//127 AND NOT THE EMITTED BYTE ITSELF. Painting the heart
// with (64+(v-128)*s.d//255)*2 would be the more literal reading of "show what
// you are sending", and it is the wrong one: at zero depth that is a CONSTANT
// 128 - a heart glowing steadily on a card that is sending nothing, which is
// the same lie in a quieter voice. Scaling the amplitude makes the dead zone
// black. It also leaves the resting picture byte-identical, because self.d is
// 127 until a finger moves it, so src/lib/catalog/frames.json does not move.
// +9 characters, all in the Timer.
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
// keeper pass. A STOPPED CARD HAS NO WRAP, which is why "or s.s<1" was added
// beside it in plan 11-09.1 - see the stop/resume section below.
//
// Honest limit for the card copy: the 20 ms Timer is the LFO clock, so the
// fastest cycle is about 165 ms and anything faster gets steppy.
//
// THE GUARD IS "e==3 or e>=5 and e<9", AND THE UPPER BOUND IS THE POINT
// (plan 11-02, class B). Firmware coalesces a sub-cycle press-and-lift into ONE
// message with event code 9 - a down AND an up, no separate DOWN and no
// separate UP. It used to write "e>=5" bare, so a fast tap returned
// early and neither the ARM count nor the depth followed the finger. ARC's own
// MIDI comes from the Timer, so the symptom here was a knob that did not move
// rather than silence - quieter than LATTICE's, and the same bug.
// src/lib/catalog/touch-guard.spec.ts holds the convention and gates it; the
// event table itself lives in src/vendor/botor/pad-sim.ts:228-241 and in
// zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated. +8
// characters.
//
// TAP THE CENTRE TO STOP IT, TAP AGAIN TO RESUME - AND THE SIMULATOR WAS
// NEVER WRONG ABOUT THIS (plan 11-09.1). The bench note read "if you press the
// center it stops, pressing it again resumes, not intuitive enough", and until
// this plan ARC HAD NO STOP, NO RESUME AND NO TOGGLE OF ANY KIND: s.r is
// 1 + x*31//127, which is at least 1 at every x, so the oscillator could not
// reach rate 0 by any gesture. The open worry was therefore that the hardware
// did something the preview does not reproduce - that a card in the catalogue
// was being shown as something it is not. It is not. Asked at 11-09's
// checkpoint the user answered "i meant to add stopping and resuming tap as a
// feature" (.planning/phases/11-bench-corrections/11-09-ANSWERS.md). This is a
// FEATURE, the note was an intention rather than an observation, and a whole
// class of worry about the simulator closes with it.
//
// THE STATE IS A SEPARATE FLAG, self.s, AND ZEROING s.r WOULD NOT HAVE WORKED.
// The touch handler recomputes r = 1 + x*31//127 on every accepted sample, so
// a zeroed rate is revived by the next touch. Measured as a negative check:
// planting "stop by s.r = 0" leaves the card stopped and the SECOND tap stops
// it again - "the controller took 1 distinct value over 50 messages" - so the
// toggle would work in one direction only. self.s is 1 running, 0 stopped; the
// Timer multiplies the phase step by it (s.h + s.r*s.s) so a stopped card
// freezes its phase instead of losing its rate.
//
// THE TARGET IS CELL 40, THE MIDDLE PIXEL OF THE 3x3 HEART, AND THE HOLE IT
// LEAVES IS NAMED. Three gestures were costed:
//
//   (a) CHOSEN - cell 40, one cell test on the onset edge. A press there is
//       aimed at the middle of a shape the card already draws. THE HOLE: raw
//       x and y in 57..71 map to it, so a press STARTING in cell 40 can no
//       longer set rate 14..18 (of 1..32) at depth 56..70 (of 0..127) - the
//       middle of both ranges. It is halved by the onset gating: a finger that
//       presses anywhere else and DRAGS through the centre still sets both,
//       because a MOVE sample never reaches the toggle. lua-smoke.spec.ts
//       asserts exactly that.
//   (b) REJECTED - the whole 3x3 heart, a nine-times bigger target and a
//       nine-times bigger hole: rate 11..21 and depth 42..84 unreachable from
//       a press starting there, which is precisely where a user aiming for
//       "medium rate, medium depth" puts their finger.
//   (c) REJECTED - a second contact, which this handler currently ignores
//       outright (i > 0 returns). Plan 11-09 MEASURED the half everyone
//       assumes is the problem and found it fine: touch_cb really does see
//       i = 0, 1, 2 through the Lua host and TouchSampler really does allocate
//       three slots. It fails downstream of that, and PREV-01 is the reason -
//       Coverflow.svelte maps ONE pointerId to ONE contact, so a visitor
//       driving the preview with a mouse could never perform the headline
//       gesture of the card. Cited from stage.ts's own note rather than
//       re-derived.
//
// THE STOPPED PICTURE IS THE FROZEN SWIRL, NOT THE FROZEN HEART ALONE. Two
// were costed:
//
//   (i)  REJECTED - freeze the heart and let the swirl turn. Free, because it
//        falls out of freezing the phase, AND IT CAN FREEZE BLACK: measured
//        across 60 consecutive stop moments at full depth the heart lands
//        anywhere in 0..254 and below 16 on 2 of the 60. A stopped card that
//        is sometimes indistinguishable from a dead one is the "not intuitive
//        enough" of the bench note arriving by a second route.
//   (ii) CHOSEN - freeze the heart AND stop the swirl, F(0) on stop and F(s.f)
//        on resume. glf is a RATE-ONLY setter, so rate 0 holds the swirl's
//        picture rather than blanking it: measured, the brightest frozen cell
//        is 253 of 255, so a stopped ARC is a still, plainly lit pad and never
//        a dark one. It reuses the 81-write shape the rate-change branch
//        already performs, through a shared local function F - the same
//        Setup-local-closure idiom stage.ts's Z(z,f,g) uses.
//
// self.f CARRIES THE SWIRL RATE SO THE RESUME IS EXACT. Setup arms layer 2 at
// rate 4 while the touch path writes glim(r//2,1,120), which is 2 at the
// default r = 4 - so a resume that recomputed the rate would hand the card
// back slightly slower than it left. self.f = 4 at Setup and s.f = the value
// actually written on every rate change, so F(s.f) restores what was there.
//
// THE KEEPER RE-ARM GAINED "or s.s<1", AND IT IS NOT DECORATION. The Timer's
// keeper rides on "p<s.r", true exactly on the phase wrap - but a stopped card
// has no wrap, so 65535 ticks (655 seconds) after a stop the LED engine would
// expire layer 2 and the frozen swirl would go out. While stopped the keeper
// is re-armed every tick instead. A zero rate together with a keeper is the
// LEGITIMATE form and not pitfall 1: the pitfall's signature is a keeper
// TOGETHER WITH a decay at or above 200, and 0 is as far from that as a rate
// gets. src/lib/catalog/decay-idiom.spec.ts is green on it.
//
// A STOPPED ARC GOES ON SENDING, AND THE NUMBER IS 50 MESSAGES A SECOND. The
// Timer still runs at 20 ms and still emits the frozen value. Suppressing it
// the way morph.ts suppresses an unmoved corner was considered and REJECTED,
// for three reasons: (1) MORPH's shouting was four DIFFERENT CCs racing each
// other for a MIDI-learn binding, and ARC has exactly ONE CC, so repeating it
// is what makes it learnable rather than what makes it unreachable; (2) MIDI
// is stateful, so a host that connects mid-stop learns the held value at once
// instead of waiting for a resume; (3) A STOP THAT WENT SILENT WOULD BE
// INDISTINGUISHABLE FROM A TIMER THAT RAISED, and the smoke gate's
// non-vacuity clause would have nothing left to stand on. A general
// last-value guard is also not available here at any price: at depth 0 the
// controller is a constant 64 by design, and 11-09's amplitude test asserts
// that ARC still sends there.
//
// THE ONSET EDGE IS "e==4 or e>8" AND IT IS CITED, NOT DERIVED. It is the
// house spelling for "this contact STARTED", stage.ts ships it, and
// src/lib/catalog/touch-guard.spec.ts is where the convention lives; the event
// table itself is src/vendor/botor/pad-sim.ts:228-241 and
// zona-docs/docs/ZONA_REFERENCE.md s4.6. No DECLARED_EXCEPTIONS row is earned
// by it - an onset test with no unbounded elseif behind it is what that gate
// wants. MORPH takes the same edge in the same plan, so the catalogue has ONE
// idiom for telling a discrete tap from the onset of a drag.
//
// AND ONE THING THE PLAN ASSERTED THAT THIS ENTRY DOES NOT SUPPORT: the
// dangerous naive spelling "e==4 or e>=5" is HARMLESS here, and it was
// measured that way rather than assumed. Code 5 never reaches the toggle at
// all, because the ended guard on the line above already returns for
// "e>=5 and e<9" - so the plant came back GREEN. What DOES double-fire is a
// toggle placed ABOVE that guard, and it double-fires on the SLOW tap (4 then
// 5), not on the fast one: code 9 is the safe arrival and code 5 is the
// hazard. Planted that way the test is red with "50 message(s) over 50 Timer
// runs taking 50 distinct values". The correct spelling ships anyway, because
// it is the house form and because it stays correct if that guard ever moves.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: both fixed points of compressScript and both
// accepted by checkSyntax. AT THE RGB444 PICKER CORNER, which is the one the
// 908 gate reads, this entry is Setup 523 of 908 (385 free) and Timer 275 of
// 908 (633 free). Plan 11-09.1 measured it at 390 / 262 before its work and
// spent +133 on the Setup and +13 on the Timer.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those.
//
// THE CORNER QUOTED ABOVE IS THE RGB444 PICKER CORNER, WHICH IS THE ONE THE
// 908 GATE READS, and it was re-measured rather than inherited (plans 11-09
// and 11-09.1). Plans 11-07, 11-08 and 11-09 found CONSOLE's, FORGE's,
// STEPS's, POMODORO's and STAGE's headers quoting the DECLARED-PALETTE corner
// instead, which is lower and therefore wrong in the dangerous direction. ARC
// is clean by accident and the accident is worth naming: both of its colour
// knobs already declare 255,255,255, so the two corners coincide here. Do not
// read that as the house norm - five entries out of the twenty were wrong.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local function F(f)for a=0,80 do glf(a,2,f)end end for n=0,80 do local a=glag(0,n)glc(a,2,@SWIRLC,1)glpfs(a,2,math.atan(n//9-4,n%9-4)*@ARMS//1%256,4,3)glt(a,2,65535)glc(a,1,@HEARTC,1)glp(a,1,0)end self.r=4 self.d=127 self.h=0 self.s=1 self.f=4 self.touch_cb=function(s,i,e,x,y)if i>0 or e==3 or e>=5 and e<9 then return end if(e==4 or e>8)and x*9//128+y*9//128*9==40 then s.s=1-s.s F(s.s<1 and 0 or s.f)return end s.d=127-y local r=1+x*31//127 if r~=s.r then s.r=r s.f=glim(r//2,1,120)F(s.f)end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local p=(s.h+s.r*s.s)%256 s.h=p if p<s.r or s.s<1 then for a=0,80 do glt(a,2,65535)end end local v=p<128 and p*2 or 510-p*2 s:gms(@CH,176,@CC,glim(64+(v-128)*s.d//255,0,127),0)for j=-1,1 do for k=-1,1 do glp(glag(0,40+j*9+k),1,v*s.d//127)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const ARC: CatalogEntry = {
  id: "arc",
  name: "ARC",
  description:
    "Draw a modulation shape with your finger; it keeps sending after you let go, and the swirl shows the rate.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["modulation", "generative", "expressive"],
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
