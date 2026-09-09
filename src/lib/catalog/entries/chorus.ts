// CHORUS - nine diatonic triads, and every one of them blooms.
//
// The 3x3 pad layout is the only division a 9-wide grid does honestly: three
// LEDs per pad, 0.19 LED of boundary error. Setup bakes nine triads out of a
// seven-note scale table - degree z, z+2 and z+4, wrapped with an octave lift -
// so the module never computes a scale degree at play time. At the default key
// of 48 in C major the nine pads are C, Dm, Em, F, G, Am, Bdim, C(8va) and
// Dm(8va), which is a whole diatonic harmony generated in 130 characters.
//
// The look is a blue/violet chessboard on layer 1, painted at phase 255 from
// Setup - which is why restsBlack is false - and, on every press, a warm amber
// bloom expanding outward from the pad you hit. The bloom is 81 glpfs calls in
// one burst and then zero Lua for up to 0.64 s: the LED engine's own
// phase-from-start argument does the expansion, and math.sqrt of the cell's
// distance from the pressed pad is what makes it a circle rather than a square.
//
// THE BLOOM USES THE COMPUTED DECAY FORM, AND IT MUST (plan 11-02, class A).
// The starting phase is per cell, so a FIXED timeout cannot land it on zero:
// glpfs walks the phase around a 256-value ring with `pha += fre` on a uint8_t,
// and whatever phase the countdown expires on is where the cell stays, forever.
// The shipped pair was start 255 - dist*22 with rate @BLOOMRATE and glt 64, and
// @BLOOMRATE * 64 mod 256 is 0 for every multiple of four - so every one of the
// 81 cells froze at exactly the brightness it opened on and the whole pad kept
// a permanent amber wash. That is the bench report "colour stucks after
// touching it", word for word.
//
// The form it now uses is the one src/lib/catalog/decay-idiom.spec.ts's header
// carries, rescued out of gridlock.ts before that file was deleted: DERIVE THE
// TIMEOUT FROM THE START.
//
//     local w=glim(248 - dist*@SPREAD//4*4, 0, 248)
//     glpfs(a,2,w,4,0)  glt(a,2,(256-w)//4)
//
// The rate is fixed at 4, w is a multiple of 4 by construction, and
// w + 4*((256-w)/4) = 256 = 0 for every cell. glim is not decoration: it holds
// w inside 0..248 so the timeout stays inside 2..64 and can never be the 0 that
// CANCELS a countdown rather than scheduling one.
//
// TWO CONSEQUENCES, both real and both stated rather than discovered later.
// The leading edge is very slightly dimmer, because the start is a multiple of
// four capped at 248 instead of 255 - frames.json records the new picture. And
// the bloom now passes ONCE and dies, where the old pair cycled the ring for a
// fixed 0.64 s and could show two or three ripples at a high rate. That is the
// fix, not a side effect: the third ripple was the one that never went out.
//
// THE TIMER IS A PER-CONTACT CHORD WATCHDOG, not an animator. Touch enqueue is
// change-gated per contact, so a finger held perfectly still emits no further
// events and a note-off driven only by the touch callback could hang a track.
// The Timer counts 100 ms ticks since the last event on each contact and lets
// the chord go after twenty of them. That is also the honest limit worth
// knowing: hold a chord dead still for two seconds and it releases.
//
// The other honest limit belongs in the card copy: a new press REPLACES the
// bloom rather than stacking it, because layer 2 is one field and the second
// burst overwrites the first. Sliding between pads is legato by construction.
//
// THE GUARD IS "e==3 or e>=5 and e<9", AND THE UPPER BOUND IS THE POINT
// (plan 11-02, class B). Firmware coalesces a sub-cycle press-and-lift into ONE
// message with event code 9 - a down AND an up, no separate DOWN and no
// separate UP. It used to write "e>=5" bare, so a fast tap was read as a
// lift, z was cleared before the chord was built, and a quick stab at a pad
// sent NOTHING - 0 MIDI messages against 6 on a slow press. A tap now sounds
// the triad and the Timer's two-second watchdog releases it, because a
// coalesced tap brings no lift of its own.
// src/lib/catalog/touch-guard.spec.ts holds the convention and gates it; the
// event table itself lives in src/vendor/botor/pad-sim.ts:228-241 and in
// zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated. +8
// characters.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 768 characters, Timer 173, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the six-knob cross-product is 771 / 174, against a budget of 908 an
// event. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)if(n%9//3+n//9//3)%2==0 then glc(a,1,0,60,120,1)else glc(a,1,80,40,140,1)end glp(a,1,255)glc(a,2,@BLOOMC,1)glp(a,2,0)end local t={@SCALE}self.h={}for z=0,8 do local c={}for j=0,2 do local d=z+j*2 c[j+1]=@KEY+t[d%7+1]+d//7*12 end self.h[z]=c end self.z={}self.t={}self.touch_cb=function(s,i,e,x,y)s.t[i]=0 local z=x*3//128+y*3//128*3 if e==3 or e>=5 and e<9 then z=nil end local o=s.z[i]if o==z then return end if o then for j=1,3 do s:gms(@CH,128,s.h[o][j],0,0)end end if z then for j=1,3 do s:gms(@CH,144,s.h[z][j],@VEL,0)end local u,v=z%3*3+1,z//3*3+1 for n=0,80 do local p,q=n%9-u,n//9-v local w=glim(248-math.sqrt(p*p+q*q)*@SPREAD//4*4,0,248)local a=glag(0,n)glpfs(a,2,w,4,0)glt(a,2,(256-w)//4)end end s.z[i]=z end gtt(0,100)";

const TIMER =
  "--[[@cb]]gtt(0,100)local s=self for i,z in pairs(s.z)do local t=(s.t[i]or 0)+1 s.t[i]=t if t>20 then for j=1,3 do s:gms(@CH,128,s.h[z][j],0,0)end s.z[i]=nil s.t[i]=nil end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CHORUS: CatalogEntry = {
  id: "chorus",
  name: "CHORUS",
  description:
    "Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["keys", "playable", "expressive"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the cap (D-12) - each one literal token substitution over the
  // vendored compiler's own widget vocabulary (TUNE-01). Every default is the
  // INDEX of the value that reproduces the canonical text.
  knobs: [
    {
      id: "key",
      label: "Key",
      kind: "note",
      token: "@KEY",
      // The MIDI note the first degree of the scale sits on. 48 is C3, and the
      // triads are built upward from it, so a high key pushes the top voice of
      // the ninth pad to key + 21.
      values: ["36", "41", "43", "45", "48", "50", "55", "60"],
      default: 4,
    },
    {
      id: "scale",
      label: "Scale",
      kind: "scale",
      token: "@SCALE",
      // Seven semitone offsets, one per degree. Any seven-note table works:
      // the chord builder reads t[d%7+1] and adds d//7*12, so the octave lift
      // is arithmetic rather than a second table. Major first, then the modes
      // that change the mood most for the fewest characters.
      values: [
        "0,2,4,5,7,9,11",
        "0,2,3,5,7,8,10",
        "0,2,3,5,7,9,10",
        "0,2,4,5,7,9,10",
        "0,2,4,6,7,9,11",
        "0,1,3,5,7,8,10",
      ],
      default: 0,
    },
    {
      id: "bloomColour",
      label: "Bloom colour",
      kind: "colour",
      token: "@BLOOMC",
      // Layer 2's colour, as three uint8 channels. Every channel is inside
      // 0..255 on purpose: the firmware truncates rather than clamps, so 260
      // would render as 4 and turn a bright bloom nearly black with no warning.
      values: [
        "255,200,80",
        "255,60,0",
        "0,255,200",
        "120,0,255",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "bloomSpeed",
      label: "Bloom spread",
      kind: "speed",
      token: "@SPREAD",
      // THIS KNOB CHANGED MEANING IN PLAN 11-02, AND THE CHANGE IS NAMED RATHER
      // THAN SLIPPED IN. It used to be @BLOOMRATE - the phase step handed to
      // glpfs - and the rate is now FIXED AT 4 so the per-cell timeout can be
      // derived from the per-cell starting phase (see the header). What the
      // knob controls now is the SPREAD: how many phase units of head start
      // each unit of distance from the pressed pad gives up. Larger is a slower,
      // wider-travelling ring; smaller is a flatter flash where the whole pad
      // finishes at once.
      //
      // EVERY VALUE IS A MULTIPLE OF FOUR, exactly as GRIDLOCK's @SPREAD was and
      // for the same reason: the derived timeout is (256 - w)//4 and it has to
      // be exact, or a ring is stranded part-way down with no Timer to repaint
      // it. The four is not arbitrary either - it is the glpfs rate, and the two
      // must stay equal.
      //
      // THE CEILING IS 24, NOT 32. The farthest cell from a corner pad's centre
      // is sqrt(7*7 + 7*7) = 9.9 units away, so a spread above 25 drives the
      // starting phase below zero, glim clamps it to 0, and every cell past that
      // distance dies on the same tick instead of in sequence. 24 is the largest
      // multiple of four that keeps the whole ring travelling.
      //
      // NEVER A KEEPER - this layer carries a decaying burst, and the derived
      // countdown is one the engine is meant to finish.
      //
      // THE KNOB ID DOES NOT MOVE. src/lib/share/fixtures/wild-stamps.json holds
      // two CHORUS records keyed on "bloomSpeed" (indices 1 and 4), captured
      // byte-for-byte at b3f99bb; renaming the id would break a fixture whose
      // whole value is that it was never regenerated. The arity does not move
      // either, for the same reason - index 4 must still resolve.
      values: ["8", "12", "16", "20", "24"],
      default: 1,
    },
    {
      id: "velocity",
      label: "Velocity",
      kind: "amount",
      token: "@VEL",
      // Sent on all three notes of the triad. The note-off is always velocity
      // zero and is not knob-driven, because a release velocity is not what
      // this control means to anyone turning it.
      values: ["40", "70", "100", "127"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. This token appears TWICE in Setup
      // - the note-off that releases the previous chord and the note-on that
      // starts the new one - and once in the Timer's watchdog release, so the
      // three can never drift onto different channels.
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

  // The same six indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    key: 4,
    scale: 0,
    bloomColour: 0,
    bloomSpeed: 1,
    velocity: 2,
    channel: 0,
  },

  // Setup paints the chessboard on layer 1 at phase 255, so the card is lit
  // before any finger arrives. frames.spec.ts proves this in both directions.
  restsBlack: false,
};
