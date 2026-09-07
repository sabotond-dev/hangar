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
// one burst and then zero Lua for 0.64 s: the LED engine's own phase-from-start
// argument does the expansion, and math.sqrt of the cell's distance from the
// pressed pad is what makes it a circle rather than a square.
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
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 729 characters, Timer 173, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the six-knob cross-product is 733 / 174, against a budget of 908 an
// event. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)if(n%9//3+n//9//3)%2==0 then glc(a,1,0,60,120,1)else glc(a,1,80,40,140,1)end glp(a,1,255)glc(a,2,@BLOOMC,1)glp(a,2,0)end local t={@SCALE}self.h={}for z=0,8 do local c={}for j=0,2 do local d=z+j*2 c[j+1]=@KEY+t[d%7+1]+d//7*12 end self.h[z]=c end self.z={}self.t={}self.touch_cb=function(s,i,e,x,y)s.t[i]=0 local z=x*3//128+y*3//128*3 if e==3 or e>=5 then z=nil end local o=s.z[i]if o==z then return end if o then for j=1,3 do s:gms(@CH,128,s.h[o][j],0,0)end end if z then for j=1,3 do s:gms(@CH,144,s.h[z][j],@VEL,0)end local u,v=z%3*3+1,z//3*3+1 for n=0,80 do local p,q=n%9-u,n//9-v local a=glag(0,n)glpfs(a,2,255-math.sqrt(p*p+q*q)*22//1,@BLOOMRATE,0)glt(a,2,64)end end s.z[i]=z end gtt(0,100)";

const TIMER =
  "--[[@cb]]gtt(0,100)local s=self for i,z in pairs(s.z)do local t=(s.t[i]or 0)+1 s.t[i]=t if t>20 then for j=1,3 do s:gms(@CH,128,s.h[z][j],0,0)end s.z[i]=nil s.t[i]=nil end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const CHORUS: CatalogEntry = {
  id: "chorus",
  name: "CHORUS",
  description:
    "Press any of nine pads for a whole chord, and a warm bloom spreads outward from the pad you hit.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["chords", "harmonic", "blooming", "playable"],
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
      label: "Bloom speed",
      kind: "speed",
      token: "@BLOOMRATE",
      // The decay rate handed to glpfs, in phase units per tick. Small is slow:
      // at 2 the bloom takes about 1.3 s to cross the pad, at 12 it is a flash.
      // NEVER a keeper - this layer carries a decaying burst, and the paired
      // glt timeout of 64 is a countdown the engine is meant to finish.
      values: ["2", "4", "6", "8", "12"],
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
