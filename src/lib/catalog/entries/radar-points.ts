// RADAR POINTS - a ping rolls out from the centre, and the points you placed sound as it passes
// over them.
//
// A tap arms or disarms a cell (fixed pink on layer 1); five rings expand from cell 40 one per
// Timer step, an armed cell sounds a note-on as the ring crosses it and a note-off on the next
// step: the ring is the time, the compass direction the pitch. SONAR reused openly (D-03): the
// arming callback, `R`, the layer split, the pending list, the decay pair and the rack are its,
// character for character; the one difference is geometric (an angle there, a ring here, so the
// pitch map flips). Beside the ported RADAR preset, which cannot express placed points. Setup 592
// of 908 at the picker corner, Timer 288 (286 at the defaults); @SCALE @ROOT @SWEEPC @PERIOD @CH.
// History: docs/entries/radar-points.md (the ask, 11-14, 12-08, 12.1-03 costings, measurements).
//
// MECHANISM
//   - Setup head: `R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,255)end` - the
//     library's release convention, defined by this entry to re-light and RE-COLOUR the centre
//     marker on layer 0; `E` calls it after `V` on every expiry path and the callback after `G`.
//     Idempotent, as `R` must be (library.ts section 5: `Q` calls `E` on a first press too).
//   - Per cell: layer 1 the fixed pink 255,60,120 at phase 0 (armed points), layer 2 @SWEEPC at
//     phase 0 (the ring); `self.a[n]` = the Chebyshev distance from the centre,
//     max(|n%9-4|, |n//9-4|) - the step at which the ring crosses cell n; `self.o[n]` the pitch:
//     b = (math.atan(n//9-4,n%9-4)*41//1+16)%256//32 the compass bucket 0..7 (the +16 half-bucket
//     offset INSIDE the modulo centres each bucket on its direction - without it cells 30 and 39
//     both read bucket 4), pitch @ROOT+t[b%#t+1]+b//#t*12 WALKING the scale table and wrapping an
//     octave (a seven-note mode puts its octave on the eighth direction). Ring 1 has exactly
//     eight cells, one per direction, east first. The centre cell 40 is lit on layer 0.
//   - The callback: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end`
//     then `s.v[n]=not s.v[n]` and the pink at 255 or 0. `Q` holds the cell with hysteresis and
//     returns it only on a change or an onset (the live filter, the onset test and the code-9
//     store `H[i]=e<9 and n` are inside it); `G` draws the finger on layer 0; `Q` before `G`
//     because `Q`'s `E` clears the block through `V`; `R` after `G` because the finger's 2x2 block
//     can cover cell 40 at weight 0.
//   - The Timer: re-arm `gtt(0,@PERIOD)` first; `X(s,20)` sweeps contacts quiet for twenty
//     calls (a lost lift is reached by `X`, never by `Q`; 2.8 s at the default period); k =
//     (s.k or 0)%8; release the whole pending list s.z; then for every cell with s.a[n]==k the
//     decay pair glpfs(a,2,252,250,0) glt(a,2,42) and, if armed, a note-on pushed onto s.z.
//     Rings 0..4 are crossed on steps 0..4; steps 5..7 match nothing (k is COMPARED, never
//     indexed) - the three quiet steps are what make the wave read as a ring.
//   - s.v[n] is read at the moment the ring crosses, never cached: a point disarmed between two
//     pings is silent on the next one (lua-smoke.spec.ts arms two, disarms one).
//
// WHAT IT SENDS
//   note-on   s:gms(@CH,144,m,100,0) - m = @ROOT + t[b%#t+1] + 12*(b//#t), at most 77 across
//             every declared value; nothing is computed from a coordinate, so nothing can go
//             negative.
//   note-off  s:gms(@CH,128,m,0,0) for every note in s.z on the FOLLOWING fire - a note is exactly
//             one step long and nothing can hang; s.z is keyed by the Timer's fire, not a finger,
//             so an expiry through `X` never cuts a sounding note.
//
// TRAPS
//   - THE SCALE TABLE MAY BE ANY LENGTH BUT EVERY VALUE MUST BE A NAMED SET: `#t` makes the
//     walk safe for any length; view.spec.ts (SCALE_WORDS) makes an unnamed set red.
//   - THE HALF-BUCKET OFFSET IS +16 AND SITS INSIDE THE MODULO. Move it outside and the top
//     bucket reads 8, a ninth direction the pad does not have.
//   - k IS COMPARED AND NEVER INDEXED. `if s.a[n]==k`; steps 5..7 match nothing by design.
//   - @PERIOD APPEARS IN BOTH EVENTS and both must move together: the Setup arms the first fire,
//     the Timer re-arms every subsequent one. The token is @PERIOD, not @SWEEP (a prefix of
//     @SWEEPC).
//   - THE DECAY PAIR IS 252 / 250 / 42 (a step of 6 from 252 lands on phase 0 at T = 42).
//     decay-idiom.spec.ts holds the arithmetic; 255 never lands on zero.
//   - THE LIVE FILTER IS NOT HERE ANY MORE - it is inside `Q`; touch-guard.spec.ts knows this
//     body delegates and requires the call rather than excusing its absence.
//   - LAYER 0 IS THE FIRMWARE'S ALERT LAYER (grid_led.h:7): `G` re-asserts @SWEEPC on every
//     call and `R` on every expiry, so an alert's recolour heals on the next sample.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @SWEEPC value is 0..255.
//   - restsBlack is FALSE from tick 0 (the emitter is lit), so no DEMO_PATHS gesture.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,255)end self.a={}self.o={}self.v={}local t={@SCALE}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,@SWEEPC,1)glp(c,2,0)self.a[n]=math.max(math.abs(n%9-4),math.abs(n//9-4))local b=(math.atan(n//9-4,n%9-4)*41//1+16)%256//32 self.o[n]=@ROOT+t[b%#t+1]+b//#t*12 end local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,@PERIOD)";

const TIMER =
  "--[[@cb]]gtt(0,@PERIOD)local s=self X(s,20)local k=(s.k or 0)%8 s.k=k+1 if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,252,250,0)glt(a,2,42)if s.v[n]then local m=s.o[n]s:gms(@CH,144,m,100,0)s.z[#s.z+1]=m end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const RADAR_POINTS: CatalogEntry = {
  id: "radar-points",
  name: "Radar points",
  description:
    "Rings roll out from the centre and play the points you placed: the ring is the time, the direction the pitch.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts;
  // the same three as SONAR, deliberately (D-03 forbids tidying the two apart).
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-10",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, SONAR's rack at SONAR's value counts, each one literal token substitution
  // (TUNE-01); the stamp shape character is derived from these counts. Every default is the
  // INDEX of the value that reproduces the canonical text. TOKEN PREFIX CHECK: none of @SCALE,
  // @ROOT, @SWEEPC, @PERIOD, @CH is a prefix of another.
  knobs: [
    {
      id: "scale",
      label: "Compass scale",
      kind: "scale",
      token: "@SCALE",
      // ANY LENGTH, and every value is a set view.ts's SCALE_WORDS can name (view.spec.ts).
      // The eight directions walk the set and wrap an octave; the default is Major, east the
      // root.
      values: [
        "0,2,4,5,7,9,11",
        "0,2,3,5,7,8,10",
        "0,3,5,7,10",
        "0,2,4,7,9",
        "0,2,4,6,8",
      ],
      default: 0,
    },
    {
      id: "root",
      label: "Root note",
      kind: "note",
      token: "@ROOT",
      // The east cell. The highest note is at most 60 + 5 + 12 = 77, inside the MIDI range.
      values: ["36", "43", "48", "55", "60"],
      default: 2,
    },
    {
      id: "sweepColour",
      label: "Ping colour",
      kind: "colour",
      token: "@SWEEPC",
      // Layer 2 (the ring and its 0.42 s wake) and layer 0 (the emitter, the finger). The
      // armed-point pink on layer 1 is fixed so the ring stays readable against it.
      values: [
        "120,255,255",
        "255,60,120",
        "0,255,140",
        "255,255,255",
        "180,0,255",
      ],
      default: 0,
    },
    {
      id: "sweep",
      label: "Ping speed",
      kind: "speed",
      token: "@PERIOD",
      // Milliseconds per ring; a whole ping is eight of these (140 is 1.12 s, SONAR's default
      // revolution). TOKEN IS @PERIOD, not @SWEEP, and it APPEARS IN BOTH EVENTS. Whole 10 ms
      // ticks.
      values: ["80", "110", "140", "200", "280"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. TWICE in the Timer - the release and the
      // note-on - so a point is released on the channel it was played on.
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
    scale: 0,
    root: 2,
    sweepColour: 0,
    sweep: 2,
    channel: 0,
  },

  // FALSE from tick 0: the emitter at cell 40 is lit by Setup. frames.spec.ts test 5 checks it;
  // a lit entry cannot carry a demonstration gesture.
  restsBlack: false,
};
