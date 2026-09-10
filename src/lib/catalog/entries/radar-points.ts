// RADAR POINTS - a ping rolls out from the centre, and the points you placed
// sound as it passes over them.
//
// THE ASK, VERBATIM, from the bench: "should act like a radar, should send
// note on note off when the sonar wave hits a LED point which a user can add
// or remove, multiple active points".
//
// ---------------------------------------------------------------------------
// WHY THIS IS A SECOND CARD AND NOT THE RADAR PRESET REWRITTEN
// ---------------------------------------------------------------------------
//
// The catalog already has a RADAR - the ported preset, ring position 5 of the
// front door, "Rings roll out from the centre, and the pad sends your finger's
// position". It is a compiler-driven card whose ripple look plus xy sends
// cannot express user-placed points at all, so the ask means hand-authored
// Lua, and a hand-authored card cannot sit in the front-door ring: the ring
// requires preview === "padsim" (front-door.spec.ts), and 11-14-HANDOVER.md
// measured that the rule is LIVE for a reason nobody wrote beside it -
// Coverflow.svelte builds an engine for every ring entry, so a "lua" entry on
// the front page puts 271 KB of Lua VM on its first paint, which
// e2e/tuning.e2e.ts forbids in words. Plan 11-14 put the four ways out to the
// user and the answer was "new-entry": the preset stays exactly where it is,
// and this card carries the ask. The id is the plan's placeholder, descriptive
// of the ask - points - and the user may rename it.
//
// ---------------------------------------------------------------------------
// D-03 BINDS THIS FILE IN BOTH DIRECTIONS, AND SONAR IS REUSED OPENLY
// ---------------------------------------------------------------------------
//
// SONAR already does every clause of the ask except the word "radar": a sweep,
// cells a tap arms and disarms, any number of them, a note-on when the sweep
// crosses each and a note-off on the following step. D-03 says both get built
// and the overlap is accepted, and it says the planner may not quietly
// differentiate them to tidy the catalog. So this card does not re-derive any
// of SONAR's decisions. TAKEN FROM sonar.ts VERBATIM, and named here so the
// reuse is a statement rather than a resemblance:
//
//   - the arming callback, character for character: the blessed live filter
//     `if e~=1 and e~=4 and e<9 then`, the per-contact last-cell guard s.q[i]
//     that lets a swipe arm every cell it crosses once (11-08), and the
//     `s.q[i]=e<9 and n` store that lets a fast tap escape it;
//   - the layer split: armed cells on layer 1 in a fixed pink, the wave on
//     layer 2 in @SWEEPC, and the centre on layer 0 in @SWEEPC, always lit,
//     because layer 0 is the one layer neither the wave nor a touch writes
//     (11-08's measured reason, and it is even more apt here - the centre is
//     the emitter);
//   - the pending list s.z: every note the Timer starts goes into it and the
//     FOLLOWING fire releases the whole list before it plays anything, so a
//     note is exactly one step long and nothing can hang;
//   - the wave's decay pair `glpfs(a,2,252,250,0)glt(a,2,42)`, the house
//     idiom 11-02 rescued - a step of 6 from 252 lands on phase 0 at T = 42
//     exactly, so no cell the wave touched stays faintly lit for ever;
//   - the rack: a scale table, a root, the wave colour, the wave period and a
//     MIDI channel, at the same value counts, and the @PERIOD token name with
//     its prefix-hazard reason.
//
// THE ONE DIFFERENCE IS GEOMETRIC AND IT IS THE ONE THE TWO NAMES IMPLY. SONAR
// sweeps an ANGLE: sixteen wedges, one per step, turning. A radar ping is a
// RING rolling out from the centre: five rings, one per step, expanding. So
// self.a[n] - the step at which cell n is crossed - is the cell's Chebyshev
// distance from the centre here, where SONAR's is its angle bucket.
//
// AND THAT FORCES THE PITCH MAP TO FLIP, WHICH IS A CONSEQUENCE AND NOT A
// SECOND DIFFERENCE. A cell has two polar coordinates. SONAR spends the angle
// on time, so its ring is the pitch; this card spends the ring on time, so the
// angle is the pitch: eight compass directions, b in 0..7, WALKING the scale
// table and wrapping an octave - `t[b%#t+1]+b//#t*12` - so a seven-note mode
// puts its octave on the eighth direction and a five-note set climbs into its
// second octave on the sixth. Ring 1 has exactly eight cells and they land one
// per direction, so the eight cells around the emitter are the scale in order,
// east first. The table is NOT indexed straight by direction, and that is a
// gate rather than a taste: the tune panel names every `scale` value from
// view.ts's SCALE_WORDS - semitone SETS with mode names - and view.spec.ts
// derives its check from the catalog, so an eight-entry table invented for
// eight directions was red on the first full run and was replaced by the
// walk. No other distinction is taken.
//
// THE HALF-BUCKET OFFSET IS MEASURED, NOT DECORATIVE. The angle expression is
// the vendored Pinwheel's own `math.atan(y,x)*41//1%256`, which SONAR divides
// by 16; dividing by 32 straight off puts every bucket EDGE on a compass
// direction, and the floor of a negative angle then tips a diagonal cell into
// the bucket beside it. Checked over all 81 cells before a line was authored:
// cells 30 and 39 both read bucket 4 and bucket 7 held six cells. Adding 16
// before the modulo centres every bucket on its direction - `(...*41//1+16)
// %256//32` - and ring 1 then reads one cell per bucket, 0 to 7. Three
// characters.
//
// ---------------------------------------------------------------------------
// THE WAVE HAS EIGHT STEPS AND THE PAD HAS FIVE RINGS, AND THAT IS THE BOUNDARY
// ---------------------------------------------------------------------------
//
// k counts 0..7. Rings 0..4 are crossed on steps 0..4; on steps 5, 6 and 7 the
// ring has LEFT THE PAD and the Timer's `if s.a[n]==k` matches nothing. That
// is the radius exceeding the pad, and it is handled by a comparison that
// fails rather than by an index that goes out of range: k is NEVER used as a
// table index, only compared against a distance that is 0..4 by construction.
// The silence is also the ping - three quiet steps and then the next pulse
// from the centre - and it is what lets the wave read as a ring rather than as
// a permanent glow: the trail is 42 ticks and at the default 140 ms step that
// is three steps of fade, so `%5` would have kept the whole pad lit at all
// times. `%8` is the same character count as `%5`.
//
// WHAT REACHES THE WIRE, CHECKED FOR SIGN AND RANGE: note-on 144 with pitch
// @ROOT + t[b%#t+1] + 12*(b//#t) - at most 60 + 5 + 12 = 77 across every
// declared value - and velocity 100; note-off 128 with the same pitch and velocity 0. Nothing is
// computed from a coordinate, so nothing can go negative (11-13's finding on
// STRIP), and the channel is a knob token 0..15.
//
// A POINT THAT IS DISARMED FALLS SILENT ON THE NEXT PASS. s.v[n] is read at
// the moment the wave crosses the cell, never cached, so a tap that toggles a
// point off between two pings is honoured by the next one. That clause is
// what "add or remove" means, and lua-smoke.spec.ts arms two points on
// different rings, hears both in ring order, disarms one, and asserts the
// disarmed one is silent while the other keeps sounding - the check a
// happy-path test would miss, and the one that reddens on a card that cannot
// forget.
//
// ---------------------------------------------------------------------------
// MOTION, REST, AND WHAT THE PREVIEW CANNOT SHOW
// ---------------------------------------------------------------------------
//
// ANIMATED, and the fixture says so rather than this file: Setup arms the
// Timer with gtt(0,@PERIOD) and the body re-arms unconditionally on its first
// statement, which is the shape 11-15 measured as the actual cause of
// `animating` (a stored Timer alone is not). restsBlack is FALSE: the centre is
// lit on layer 0 from tick 0, three non-zero bytes in frames.json's first
// record, so the card cannot carry a demonstration gesture (listing.spec.ts
// refuses a DEMO_PATHS key for a lit entry) and the OG image is the pad with
// its emitter lit and, if the sampled tick lands on one, a ring.
//
// ON CODE 9: src/lib/sim/touch.ts never emits it (TOUCH-CODE-9.md), so in a
// browser a tap arrives as a 4 and a 5 and this card's arming gesture is a
// PRESS, which the preview delivers completely. The `e<9 and n` store handles
// the module's coalesced tap for the reason sonar.ts gives at length.
//
// ---------------------------------------------------------------------------
// THE BUDGET, MEASURED BEFORE THE ENTRY WAS AUTHORED
// ---------------------------------------------------------------------------
//
// Every figure is `max(GridScript.compressScript(lua).length, lua.length)`
// after `padReady()`, at the corner lua-entries.sweep.spec.ts actually gates:
//
//                            Setup   free   Timer   free
//   RGB444 picker corner       579    329     281    627
//   at the defaults            579    329     279    629
//   all-shortest declared      569    339     278    630
//
// Both events are fixed points of compressScript at every corner and pass
// checkSyntax. SONAR's 559 / 282 at the same corner is the reference the plan
// named; this card is twenty over it on the Setup - the compass walk with its
// octave wrap, the half-bucket offset, and a three-digit default period - and
// one under on the Timer. The first sketch, indexing an eight-entry table
// straight by direction, measured 560 / 281 and was withdrawn on the word
// table rather than on cost.
//
// ---------------------------------------------------------------------------
// THE TRAPS THIS ENTRY CONTAINS
// ---------------------------------------------------------------------------
//
//   - THE SCALE TABLE MAY BE ANY LENGTH BUT EVERY VALUE MUST BE A NAMED SET.
//     `#t` makes the walk safe for any length; view.spec.ts makes an unnamed
//     set red. Both are asserted, neither is assumed.
//   - THE HALF-BUCKET OFFSET IS +16 AND SITS INSIDE THE MODULO. Move it
//     outside and the top bucket reads 8, a ninth direction the pad does not
//     have.
//   - k IS COMPARED AND NEVER INDEXED. `if s.a[n]==k`; steps 5..7 match
//     nothing and that is the design.
//   - @PERIOD APPEARS IN BOTH EVENTS and both must move together, for the
//     reason sonar.ts gives: the Setup arms the first fire and the Timer
//     re-arms every subsequent one.
//   - THE DECAY PAIR IS 252 / 250 / 42. decay-idiom.spec.ts holds the
//     arithmetic; 255 never lands on zero.
//   - THE LIVE FILTER IS THE BLESSED SPELLING and touch-guard.spec.ts reads it.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every @SWEEPC
//     value is inside 0..255.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 579, Timer 279. THE LUA CARRIES NO
// COMMENTS beyond the nine-character event marker, because compressScript does
// not strip them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.a={}self.o={}self.v={}self.q={}local t={@SCALE}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,@SWEEPC,1)glp(c,2,0)self.a[n]=math.max(math.abs(n%9-4),math.abs(n//9-4))local b=(math.atan(n//9-4,n%9-4)*41//1+16)%256//32 self.o[n]=@ROOT+t[b%#t+1]+b//#t*12 end local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then s.q[i]=nil return end local n=x*9//128+y*9//128*9 if s.q[i]==n then return end s.q[i]=e<9 and n s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,@PERIOD)";

const TIMER =
  "--[[@cb]]gtt(0,@PERIOD)local s=self local k=(s.k or 0)%8 s.k=k+1 if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,252,250,0)glt(a,2,42)if s.v[n]then local m=s.o[n]s:gms(@CH,144,m,100,0)s.z[#s.z+1]=m end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const RADAR_POINTS: CatalogEntry = {
  id: "radar-points",
  name: "RADAR POINTS",
  description:
    "Rings roll out from the centre and play the points you placed: the ring is the time, the direction the pitch.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  //
  // THE SAME THREE AS SONAR, AND THAT IS DELIBERATE. They are true of this
  // card for exactly the reasons they are true of that one - it sequences, it
  // runs on its own, and you play it by placing points live - and choosing
  // different ones to spread the histogram would be the tidying D-03 forbids.
  // Read afterwards: sequencing 3 to 4, generative 12 to 13, playable 8 to 9;
  // no term touches the FEELS floor of 6 and no singleton appears.
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-10",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, SONAR's rack at SONAR's value counts, each one literal token
  // substitution (TUNE-01). Declared once here and never moved: the stamp
  // shape character is derived from these counts. Every default is the INDEX
  // of the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK: @SCALE, @ROOT, @SWEEPC, @PERIOD, @CH. None is a prefix
  // of another - @SCALE and @SWEEPC share only "@S".
  knobs: [
    {
      id: "scale",
      label: "Compass scale",
      kind: "scale",
      token: "@SCALE",
      // ANY LENGTH, and every value is a set the tune panel can NAME: view.ts's
      // SCALE_WORDS maps semitone sets to mode names and view.spec.ts derives
      // its check from the catalog, so an invented set is red rather than a
      // rail. The eight compass directions WALK the set and wrap an octave -
      // t[b%#t+1]+b//#t*12 - so a seven-note mode puts the octave on the
      // eighth direction and a pentatonic climbs into its second octave on
      // the sixth. Three of the five are SONAR's own values. The default is
      // Major: east is the root, and the direction just short of it is the
      // root an octave up.
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
      // The east cell. The highest note is root plus the seventh direction's
      // degree plus its octave - at most 60 + 5 + 12 = 77 on the minor
      // pentatonic - so every value here leaves the whole pad inside the MIDI
      // range.
      values: ["36", "43", "48", "55", "60"],
      default: 2,
    },
    {
      id: "sweepColour",
      label: "Ping colour",
      kind: "colour",
      token: "@SWEEPC",
      // Layer 2 - the ring and its 0.42 s wake - and layer 0, the emitter at
      // the centre. The armed-point pink on layer 1 underneath is fixed,
      // because the ring has to stay readable against it. Every channel is
      // inside 0..255: the firmware truncates rather than clamps.
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
      // Milliseconds per ring, so a whole ping - five rings out and three
      // steps of quiet - is eight of these: 140 is 1.12 s, the same cycle as
      // SONAR's default revolution. TOKEN IS @PERIOD, not @SWEEP - see
      // sonar.ts on the prefix hazard - and it APPEARS IN BOTH EVENTS. Every
      // value is a whole number of 10 ms ticks.
      values: ["80", "110", "140", "200", "280"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). It appears TWICE in the Timer - the release and the note-on -
      // so a point can never be released on a channel it was not played on.
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
    scale: 0,
    root: 2,
    sweepColour: 0,
    sweep: 2,
    channel: 0,
  },

  // FALSE, from tick 0: the emitter at cell 40 is written on layer 0 at phase
  // 255 by Setup, so the very first frame carries three non-zero bytes before
  // the first ring fires. frames.spec.ts test 5 turns that declaration into a
  // checked fact, and because the entry does not rest black it CANNOT carry a
  // demonstration gesture.
  restsBlack: false,
};
