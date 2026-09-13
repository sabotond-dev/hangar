// SONAR - a radial 16-step sequencer, five voices deep.
//
// A polar sequencer: a sweep line rotates through sixteen angle buckets (1.12 s a revolution at
// the default period); tap or swipe to arm cells, and an armed cell fires when the sweep crosses
// it. The pitch comes from the cell's RING (its Chebyshev distance from the centre, inner low,
// outer high, minor pentatonic by default) and the time from its ANGLE, so the pad is a 16-step,
// 5-voice grid in polar coordinates. The centre is always lit on layer 0. Setup 572 of 908 at
// the picker corner (571 at the defaults), Timer 289 (286). Knobs: @RINGS (exactly five entries),
// @ROOT, @SWEEPC, @PERIOD (both events; NOT @SWEEP, a prefix of @SWEEPC), @CH. Clock sync is not
// built and is not stubbed: HANGAR's Lua host has no inbound MIDI path (docs/MIDI-IN-PROBE.md).
// History: docs/entries/sonar.md (11-02, 11-08, 12-08, 12.1-03 costings, measurements, readings).
//
// MECHANISM
//   - Setup head: `R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,255)end` - the
//     library's release convention, defined here to re-light and RE-COLOUR the centre marker on
//     layer 0; `E` calls it after `V` on every expiry path and the callback after `G`. Idempotent
//     (`Q` calls `E` on a first press too).
//   - Per cell: layer 1 the fixed pink 255,60,120 at phase 0 (armed cells), layer 2 @SWEEPC at
//     phase 0 (the sweep); `self.a[n]` = (math.atan(n//9-4,n%9-4)*41//1%256)//16 - the vendored
//     Pinwheel's own angle expression divided by 16, so the buckets line up with the swirl's
//     phase geometry; `self.o[n]` = @ROOT + t[d+1] with d the Chebyshev ring 0..4. Cell 40 lit
//     in @SWEEPC on layer 0 - the layer neither the sweep (2) nor the arming touch (1) writes.
//   - The callback: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end`
//     then `s.v[n]=not s.v[n]` and the pink at 255 or 0. `Q` holds the cell with hysteresis and
//     returns it only on a change or an onset - so a swipe arms every cell it crosses once and a
//     resting finger arms nothing twice; the end test, the onset test and the code-9 store
//     `H[i]=e<9 and n` are inside it. `Q` before `G` because `Q`'s `E` clears the block through
//     `V`; `R` after `G` because the finger's 2x2 block can cover cell 40 at weight 0.
//   - The Timer: re-arm `gtt(0,@PERIOD)` first; `X(s,20)` sweeps contacts quiet for twenty
//     calls (a lost lift is reached by `X`, never by `Q`; 1.4 s at the default period); k =
//     (s.k or 0)%16; release the whole pending list s.z; then for every cell in bucket k the
//     decay pair glpfs(a,2,252,250,0) glt(a,2,42) and, if armed, a note-on pushed onto s.z.
//   - A swipe that crosses a cell twice toggles it twice - correct for a toggle; the
//     set-rather-than-toggle alternative is an open bench question (euclid.ts).
//
// WHAT IT SENDS
//   note-on   s:gms(@CH,144,m,100,0), m = @ROOT + t[d+1], well under an octave above the root.
//   note-off  s:gms(@CH,128,m,0,0) for every note in s.z on the FOLLOWING fire - a note is
//             exactly one step (one @PERIOD) long and nothing can hang; one step is the shortest
//             gate the card can express. s.z is keyed by the Timer's fire, not by a contact.
//
// TRAPS
//   - @RINGS HAS EXACTLY FIVE ENTRIES, always: a 9x9 grid has five Chebyshev rings and the Setup
//     indexes t[d+1] for d in 0..4; a four-entry table leaves the outer ring nil and silent.
//   - THE TOKEN FOR THE PERIOD IS @PERIOD, NOT @SWEEP: renderLua substitutes by plain string
//     replacement, and "@SWEEP" inside "@SWEEPC" would render the colour as "70C".
//   - @PERIOD APPEARS IN BOTH EVENTS and both must move together: the Setup arms the first fire,
//     the Timer re-arms every subsequent one; a mismatch ticks once at one rate and then forever
//     at another.
//   - THE SWEEP'S DECAY PAIR IS 252 / 250 / 42 AND MUST STAY THAT WAY: 255 with a step of 6 is
//     odd at every T and never lands on phase 0 - every crossed cell froze faintly lit.
//     decay-idiom.spec.ts holds the arithmetic.
//   - THE TIMER IS THE CANONICAL TEXT, `if s.v[n]then` with no space: what compressScript
//     produces and a fixed point of it; the printed form would fail the canonical-form gate.
//   - THE LIVE FILTER IS NOT HERE ANY MORE - it is inside `Q`; touch-guard.spec.ts knows this
//     body delegates and requires the call.
//   - THE CENTRE IS ON LAYER 0 ON PURPOSE: layer 1 would be erased by the first tap on it, and
//     layer 2 looks right twice and then the sweep's decay runs it to black.
//   - LAYER 0 IS THE FIRMWARE'S ALERT LAYER (grid_led.h:7): `G` re-asserts @SWEEPC on every
//     call and `R` on every expiry, so an alert's recolour heals on the next sample.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every @SWEEPC value is 0..255.
//   - restsBlack is FALSE at tick 0 (the centre), so no DEMO_PATHS gesture.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]R=function(s,i)local a=glag(0,40)glc(a,0,@SWEEPC,1)glp(a,0,255)end self.a={}self.o={}self.v={}local t={@RINGS}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,@SWEEPC,1)glp(c,2,0)self.a[n]=(math.atan(n//9-4,n%9-4)*41//1%256)//16 local d=math.max(math.abs(n%9-4),math.abs(n//9-4))self.o[n]=@ROOT+t[d+1]end local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,@SWEEPC)R(s,i)if not n then return end s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,@PERIOD)";

const TIMER =
  "--[[@cb]]gtt(0,@PERIOD)local s=self X(s,20)local k=(s.k or 0)%16 s.k=k+1 if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,252,250,0)glt(a,2,42)if s.v[n]then local m=s.o[n]s:gms(@CH,144,m,100,0)s.z[#s.z+1]=m end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SONAR: CatalogEntry = {
  id: "sonar",
  name: "Sonar",
  description:
    "A sweep turns like radar and fires the cells you armed: the ring is the pitch, the angle the time.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "rings",
      label: "Ring scale",
      kind: "scale",
      token: "@RINGS",
      // EXACTLY FIVE ENTRIES, always (TRAPS): semitone offsets from the root, innermost first.
      // The default is minor pentatonic.
      values: [
        "0,3,5,7,10",
        "0,2,4,7,9",
        "0,2,4,6,8",
        "0,2,3,7,9",
        "0,1,5,7,10",
      ],
      default: 0,
    },
    {
      id: "root",
      label: "Root note",
      kind: "note",
      token: "@ROOT",
      // The innermost ring; the pad spans well under an octave above it.
      values: ["24", "31", "36", "43", "48"],
      default: 2,
    },
    {
      id: "sweepColour",
      label: "Sweep colour",
      kind: "colour",
      token: "@SWEEPC",
      // Layer 2 (the rotating line and its 0.42 s wake) and layer 0 (the centre, the finger).
      // The armed-cell pink on layer 1 is fixed so the sweep stays readable against it.
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
      label: "Sweep speed",
      kind: "speed",
      token: "@PERIOD",
      // Milliseconds per step; a revolution is sixteen of these (70 is 1.12 s). TOKEN IS
      // @PERIOD, not @SWEEP, and it APPEARS IN BOTH EVENTS.
      values: ["40", "55", "70", "110", "160"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058). TWICE in
      // the Timer - the release and the note-on - so a step is released on the channel it was
      // played on.
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
    rings: 0,
    root: 2,
    sweepColour: 0,
    sweep: 2,
    channel: 0,
  },

  // FALSE at tick 0: the always-lit centre puts three non-zero bytes into the first frame.
  // frames.spec.ts test 5 checks it.
  restsBlack: false,
};
