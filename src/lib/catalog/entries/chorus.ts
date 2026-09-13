// CHORUS - nine diatonic triads, and every one of them blooms.
//
// Nine 3x3 pads (the only division a 9-wide grid does honestly), each a triad baked in Setup
// from a seven-note scale table - degree z, z+2, z+4 with an octave lift - so at the default
// key of 48 in C major the pads are C, Dm, Em, F, G, Am, Bdim, C(8va), Dm(8va). ONE CHORD AT A
// TIME: a press on another pad releases the sounding chord and starts the new one; a press on
// the sounding pad re-owns it; a slide is legato; a chord held dead still for two seconds is
// released by the library's sweep. A blue / violet chessboard on layer 1 and, on every press, a
// bloom on layer 2 expanding from the pad you hit. Knobs: @KEY, @SCALE, @BLOOMC, @SPREAD (a
// multiple of four, at most 24), @VEL, @CH. Setup 822 of 908 at the picker corner (819 at the
// defaults), Timer 29; restsBlack false. History: docs/entries/chorus.md (11-02, 12-09, 12.1-04).
//
// MECHANISM
//   - Setup: layer 1 the chessboard at phase 255 (`(n%9//3+n//9//3)%2`), layer 2 @BLOOMC at
//     phase 0; `self.h[z]` the nine triads, c[j+1] = @KEY + t[d%7+1] + d//7*12 for d = z + j*2;
//     `R=function(s,i)` the library's release convention - IDEMPOTENT: it returns unless `s.c`
//     is the contact being expired, sends the three note-offs, clears s.z and s.c. `E` calls it
//     on an end code, on a stale press by another contact, on the Timer sweep and on EVERY
//     onset including a first press, so an unconditional note-off would fire on every press.
//   - State: `s.z` the pad that is sounding (or nil), `s.c` the contact that owns it (or nil).
//   - The callback: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n then return end`;
//     z = n%9//3 + n//9//3*3; if z == s.z re-own (`s.c=i`) and return; if a chord is sounding,
//     `R(s,s.c)` FIRST; the three note-ons; the bloom: for every cell, w = glim(248 -
//     sqrt(p*p+q*q)*@SPREAD//4*4, 0, 248) from the pad's centre, `glpfs(a,2,w,4,0)` and
//     `glt(a,2,(256-w)//4)`; s.z = z, s.c = i. `Q` holds the cell with hysteresis and returns it
//     only on a change or an onset (the live test and the onset test are inside it; a pad
//     boundary is a cell boundary, so the hysteresis is zone hysteresis for free). `G` draws the
//     library's finger in WHITE on layer 0 (a literal, not a knob), the layer neither the
//     chessboard nor the bloom writes; `Q` before `G` because `Q`'s `E` clears the block through `V`.
//   - The Timer is `gtt(0,100)X(self,20)`: the library's sweep releases (through `R`) a contact
//     quiet for twenty calls - two seconds, the same window the private watchdog carried. The
//     window is the CALLER's argument (library.ts section 5).
//   - A new press REPLACES the bloom rather than stacking it: layer 2 is one field.
//
// WHAT IT SENDS
//   note-on   s:gms(@CH,144,s.h[z][j],@VEL,0) for j = 1..3, on a press on a new pad
//   note-off  s:gms(@CH,128,s.h[s.z][j],0,0) for j = 1..3, from `R` - before the new chord, on
//             a lift, on a stale press, on the sweep. The receiver never hears two triads overlap.
//
// TRAPS
//   - THE BLOOM USES THE COMPUTED DECAY FORM, AND IT MUST: the starting phase is per cell, so a
//     FIXED timeout cannot land it on zero - the old 255-dist*22 / @BLOOMRATE / glt 64 pair froze
//     all 81 cells at the brightness they opened on ("colour stucks after touching it"). The
//     rate is fixed at 4, w is a multiple of 4 by construction, w + 4*((256-w)/4) = 256 = 0 for
//     every cell; glim holds w inside 0..248 so the timeout stays inside 2..64 and is never the
//     0 that CANCELS a countdown. decay-idiom.spec.ts carries the form.
//   - EVERY @SPREAD VALUE IS A MULTIPLE OF FOUR (the glpfs rate, and the two must stay equal)
//     AND AT MOST 24: the farthest cell from a corner pad is 9.9 units, and above 25 the start
//     clamps to 0 and every far cell dies on the same tick. NEVER A KEEPER on this layer.
//   - THE KNOB ID `bloomSpeed` AND ITS ARITY DO NOT MOVE: wild-stamps.json holds two CHORUS
//     records keyed on it (indices 1 and 4). The knob changed meaning in 11-02 (rate -> spread).
//   - R IS IDEMPOTENT, and must stay so (above).
//   - THE ENTRY CARRIES NO EVENT-CODE GUARD OF ITS OWN: it is inside `Q`, and touch-guard.spec.ts
//     REQUIRES a body with no chain of its own to carry `Q(s,i,e,x,y)`.
//   - @CH APPEARS TWICE, both in the Setup (the note-off in R, the note-on in the callback), so
//     the two cannot drift; the Timer carries no MIDI.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts white on every call; `glc(...,1)` forces the
//     min to 0.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @BLOOMC value is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)if(n%9//3+n//9//3)%2==0 then glc(a,1,0,60,120,1)else glc(a,1,80,40,140,1)end glp(a,1,255)glc(a,2,@BLOOMC,1)glp(a,2,0)end local t={@SCALE}self.h={}for z=0,8 do local c={}for j=0,2 do local d=z+j*2 c[j+1]=@KEY+t[d%7+1]+d//7*12 end self.h[z]=c end R=function(s,i)if s.c==i then for j=1,3 do s:gms(@CH,128,s.h[s.z][j],0,0)end s.z=nil s.c=nil end end self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n then return end local z=n%9//3+n//9//3*3 if z==s.z then s.c=i return end if s.z then R(s,s.c)end for j=1,3 do s:gms(@CH,144,s.h[z][j],@VEL,0)end local u,v=z%3*3+1,z//3*3+1 for n=0,80 do local p,q=n%9-u,n//9-v local w=glim(248-math.sqrt(p*p+q*q)*@SPREAD//4*4,0,248)local a=glag(0,n)glpfs(a,2,w,4,0)glt(a,2,(256-w)//4)end s.z=z s.c=i end gtt(0,100)";

const TIMER = "--[[@cb]]gtt(0,100)X(self,20)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CHORUS: CatalogEntry = {
  id: "chorus",
  name: "Chorus",
  description:
    "Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["play", "playable", "expressive"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the cap (D-12) - each one literal token substitution (TUNE-01); every default
  // is the INDEX of the value that reproduces the canonical text.
  knobs: [
    {
      id: "key",
      label: "Key",
      kind: "note",
      token: "@KEY",
      // The MIDI note of the first degree (48 is C3); the ninth pad's top voice is key + 21.
      values: ["36", "41", "43", "45", "48", "50", "55", "60"],
      default: 4,
    },
    {
      id: "scale",
      label: "Scale",
      kind: "scale",
      token: "@SCALE",
      // Seven semitone offsets, one per degree; the builder reads t[d%7+1] + d//7*12, so any
      // seven-note table works. Major first.
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
      // Layer 2's colour. Every channel inside 0..255: the firmware truncates rather than clamps.
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
      // The SPREAD: phase units of head start per unit of distance from the pressed pad (larger
      // is a slower, wider ring). EVERY VALUE IS A MULTIPLE OF FOUR AND THE CEILING IS 24
      // (TRAPS). The id `bloomSpeed` and the arity do not move: wild-stamps.json keys two CHORUS
      // records on it.
      values: ["8", "12", "16", "20", "24"],
      default: 1,
    },
    {
      id: "velocity",
      label: "Velocity",
      kind: "amount",
      token: "@VEL",
      // Sent on all three notes of the triad; the note-off is always velocity zero.
      values: ["40", "70", "100", "127"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058). TWICE, both
      // in the Setup - the note-off inside R and the note-on in the callback.
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

  // The same six indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    key: 4,
    scale: 0,
    bloomColour: 0,
    bloomSpeed: 1,
    velocity: 2,
    channel: 0,
  },

  // FALSE: the chessboard is lit at phase 255 from Setup. frames.spec.ts checks it.
  restsBlack: false,
};
