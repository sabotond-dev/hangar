// EUCLID - three Euclidean rings, one polyrhythm. The first configuration authored for HANGAR
// rather than ported from BOTOR's shelf.
//
// Concentric square rings on a 9x9 hold exactly 8, 16 and 24 cells, so three tracks of 8, 16
// and 24 steps sit on the pad with no rounding. Each ring's pattern is the Bresenham Euclidean
// test at three, five and seven pulses; layer 1 holds the static pulse markers (15 lit from
// Setup), layer 2 a bright head running each ring at its own speed with a short decay; the three
// lengths beat on a 48-tick cycle. Tap or swipe a ring cell to toggle that step. Knobs: @TEMPO
// (both events), @PULSES, @RINGC, @TRAIL (a divisor of 252), @NOTE, @CH. Setup 726 of 908 at the
// picker corner (722 at the defaults), Timer 237 (233); restsBlack false. MIDI sync: not built.
// History: docs/entries/euclid.md (08-06, 11-02, 11-08, 12-08, 12.1-03 measurements, readings).
//
// MECHANISM
//   - Setup: layer 1 the fixed 255,90,0 at phase 0 (the markers), layer 2 @RINGC at phase 0 (the
//     head). For each ring d = 1..3 (n = d*8 cells): step t walks the square's four sides
//     (q = t//(d*2) the side, w = t%(d*2) the offset) to the cell m = a+4+(b+4)*9; `self.c[d][t]`
//     = m, `self.i[m]` = d*32+t (the pad cell -> ring position map; nil for the centre and the
//     outermost square), `self.p[d][t]` = t*h[d]//n ~= (t-1)*h[d]//n (the Euclidean test, h =
//     {@PULSES}), lit at 255 where true. `gtt(0,@TEMPO)`.
//   - The callback: `local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end`,
//     then `local v=s.i[m]if not v then return end`, d = v//32, t = v%32, toggle s.p[d][t] and
//     paint the marker. `Q` holds the cell with hysteresis and returns it only on a change or an
//     onset (a swipe toggles each ring cell it crosses once; a resting finger toggles nothing
//     twice; the live test, the onset test and the code-9 store are inside it). `G` draws the
//     library's finger in WHITE on layer 0 (a literal, not a knob). `Q` before `G` because
//     `Q`'s `E` clears the block through `V`. THE KEY `Q` REMEMBERS IS THE PAD CELL, before the
//     self.i lookup: a ring position is not a unique name for a place on the pad.
//   - The Timer, `gtt(0,@TEMPO)` first: `X(s,20)` sweeps contacts quiet for twenty calls (2.2 s
//     at the default; a lost lift is reached by `X`, never by `Q`); k = (s.k or 0)%24; for each
//     ring t = k%(d*8): the head's decay pair glpfs(a,2,252,256-252//@TRAIL,0) glt(a,2,@TRAIL)
//     on cell s.c[d][t], the ring's note-off, then its note-on if the step is set.
//   - No `R` (it holds no note per contact and paints nothing of its own on layer 0).
//   - A swipe that crosses a cell twice toggles it twice - correct for a toggle, not what a paint
//     gesture does; the set-rather-than-toggle alternative is an open bench question.
//
// WHAT IT SENDS
//   Per ring per step: s:gms(@CH,128,@NOTE+d*2,0,0) then, if the step is set,
//   s:gms(@CH,144,@NOTE+d*2,100,0) - the three voices are @NOTE + 2, 4, 6 (kick, snare, hat at
//   the default 34), each note exactly one step long.
//
// TRAPS
//   - THE TRAIL'S DECAY PAIR IS THE HOUSE IDIOM: glpfs(a,2,252,256-252//@TRAIL,0) lands on phase
//     0 only when @TRAIL is an EXACT DIVISOR of 252; the old 255/250 pair (odd minus even) never
//     landed and every ring cell the head passed froze faintly lit. @TRAIL's values are 21, 42,
//     63, 84, 126 for that reason; a stamp encodes the INDEX, so old links still decode.
//     decay-idiom.spec.ts holds the arithmetic and the usable timeouts.
//   - NEVER A KEEPER ON LAYER 2: it carries a decaying trail, and 65535 would replace the
//     countdown and strobe every touched cell forever.
//   - @TEMPO APPEARS IN BOTH EVENTS and both must move together.
//   - THE CELL `Q` RETURNS IS THE LED UNDER THE FINGER: under the naive `x*9//128` the outer
//     ring sat a third of a cell inward of its LEDs - a finger dead on LED (1,4) read column 0,
//     on no ring, and `if not v then return end` dropped the press silently ("i need to tap
//     multiple times"). lua-smoke.spec.ts presses all 81 LED centres.
//   - THE LIVE FILTER IS NOT HERE ANY MORE - it is inside `Q`; touch-guard.spec.ts knows this
//     body delegates and requires the call.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts white on every call; `glc(...,1)` forces the
//     min to 0, so the dark pad is as dark as it ever was.
//   - EVERY DIVISION IS FLOORED: t//(d*2), t*h[d]//n, v//32, 252//@TRAIL.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @RINGC value is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,@RINGC,1)glp(a,2,0)end self.c={}self.p={}self.i={}local h={@PULSES}for d=1,3 do local n=d*8 local u={}local v={}for t=0,n-1 do local q=t//(d*2)local w=t%(d*2)local a,b if q==0 then a,b=d,w-d elseif q==1 then a,b=d-w,d elseif q==2 then a,b=-d,d-w else a,b=w-d,-d end local m=a+4+(b+4)*9 u[t]=m self.i[m]=d*32+t v[t]=t*h[d]//n~=(t-1)*h[d]//n if v[t]then glp(glag(0,m),1,255)end end self.c[d]=u self.p[d]=v end self.touch_cb=function(s,i,e,x,y)local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end local v=s.i[m]if not v then return end local d=v//32 local t=v%32 s.p[d][t]=not s.p[d][t]glp(glag(0,s.c[d][t]),1,s.p[d][t]and 255 or 0)end gtt(0,@TEMPO)";

const TIMER =
  "--[[@cb]]gtt(0,@TEMPO)local s=self X(s,20)local k=(s.k or 0)%24 s.k=k+1 for d=1,3 do local t=k%(d*8)local a=glag(0,s.c[d][t])glpfs(a,2,252,256-252//@TRAIL,0)glt(a,2,@TRAIL)s:gms(@CH,128,@NOTE+d*2,0,0)if s.p[d][t]then s:gms(@CH,144,@NOTE+d*2,100,0)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const EUCLID: CatalogEntry = {
  id: "euclid",
  name: "Euclid",
  description:
    "Three Euclidean rings turn at their own speeds and beat against each other; tap a step to change the pattern.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["sequencing", "generative", "playable"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the cap (D-12) - each one literal token substitution (TUNE-01); every default
  // is the INDEX of the value that reproduces the canonical text (722 / 233 at the defaults).
  knobs: [
    {
      id: "tempo",
      label: "Tempo",
      kind: "speed",
      token: "@TEMPO",
      // Milliseconds between steps, ordered slow to fast. APPEARS IN BOTH EVENTS.
      values: ["240", "180", "140", "110", "90", "70"],
      default: 3,
    },
    {
      id: "pulses",
      label: "Pulses",
      kind: "count",
      token: "@PULSES",
      // Pulses per ring, inner to outer, over 8, 16 and 24 steps; 3, 5 and 7 beat on a 48-tick
      // cycle.
      values: ["3,5,7", "2,3,5", "5,9,13", "3,8,11", "4,8,16", "7,11,17"],
      default: 0,
    },
    {
      id: "ringColour",
      label: "Ring colour",
      kind: "colour",
      token: "@RINGC",
      // The running head's colour on layer 2. Every channel inside 0..255: the firmware
      // truncates rather than clamps.
      values: [
        "0,200,255",
        "255,90,0",
        "0,255,120",
        "255,255,255",
        "120,0,255",
      ],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail",
      kind: "size",
      token: "@TRAIL",
      // Ticks of decay behind the head, at 10 ms a tick. EVERY VALUE IS AN EXACT DIVISOR OF
      // 252 (TRAPS). Never a keeper on this layer.
      values: ["21", "42", "63", "84", "126"],
      default: 1,
    },
    {
      id: "note",
      label: "Base note",
      kind: "note",
      token: "@NOTE",
      // The three voices send this base plus 2, 4 and 6: 36 / 38 / 40 at the default 34 -
      // kick, snare and hat by General MIDI convention.
      values: ["24", "30", "34", "36", "40", "48", "60"],
      default: 2,
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

  // The same six indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    tempo: 3,
    pulses: 0,
    ringColour: 0,
    trail: 1,
    note: 2,
    channel: 0,
  },

  // FALSE: Setup lights the 15 generated pulse cells on layer 1. frames.spec.ts checks it.
  restsBlack: false,
};
