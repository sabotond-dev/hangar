// ORBIT - four Euclidean rings, one polyrhythm, stepped by its own Timer or by the DAW's MIDI clock.
// EUCLID until change 8 (2026-09-18, BENCH-2026-09-16.txt section 8): the fourth ring is the outer 32,
// every ring has its own colour and its own note, and the rings can follow a host clock.
//
// Concentric square rings on a 9x9 hold exactly 8, 16, 24 and 32 cells, so four tracks of those
// lengths sit on the pad with no rounding and beat on a 96-step cycle. Layer 1 holds the pulse
// markers (lit from Setup), layer 2 a bright head per ring with a short decay. Tap or swipe a ring
// cell to toggle that step. Fourteen knobs (TUNE-01's six lifted for this card by the user's word):
// @TEMPO (both events), @PULSES, @R1C..@R4C, @TRAIL, @SYNC (both events), @DIV, @N1..@N4, @CH.
// Setup 846 of 908 at the picker corner (843 at the defaults), Timer 404 (383); restsBlack false.
// History: docs/entries/orbit.md (08-06 .. 12.1-03 as EUCLID; change 8's forms, costs and the clock idiom).
//
// MECHANISM
//   - Setup: layer 1 the fixed 255,90,0 at phase 0 (the markers), layer 2 at phase 0 with no colour
//     yet (the head colours its cell when it lights it). For each ring d = 1..4 (n = d*8 cells):
//     step t starts at (d, t%(d*2)-d) and is rotated a quarter turn t//(d*2) times (`a,b=-b,a`) to
//     the cell m = a+4+(b+4)*9; `self.c[d][t]` = m, `self.i[m]` = d*32+t (the pad cell -> ring
//     position map; nil for the centre alone), `self.p[d][t]` = t*h[d]//n ~= (t-1)*h[d]//n (the
//     Euclidean test, h = {@PULSES}), lit at 255 where true. `s.k` the step, `s.q` the clock count,
//     `s.r` the run flag. `grxm(2,@SYNC and 3 or 0)` routes MIDIRTM to Lua under External only, then
//     `gtt(0,@TEMPO)`.
//   - The step routine is the Timer's `local function f(s)`, published as `s.f` on every call: k =
//     s.k, then for each ring t = k%(d*8): the head cell takes its ring's colour (`c`, twelve
//     channels), the decay pair glpfs(a,2,252,256-252//@TRAIL,0) glt(a,2,@TRAIL), the ring's note-off,
//     then its note-on if the step is set. The Timer, `gtt(0,@TEMPO)` first, `X(s,20)` (a lost lift
//     is reached by `X`, never by `Q`), then `if @SYNC then return end f(s)`: Internal steps here,
//     External steps nowhere here.
//   - `self.rtmrx_cb=function(s,h,b)` (decode.lua:42-44's shape: a header triple and ONE byte):
//     250 Start resets k and q; 250 or 251 sets the run flag; 252 Stop clears it; 248 while running
//     steps through `s.f` every @DIV clocks (12 / 6 / 3 = an 8th / 16th / 32nd at 24 per quarter),
//     the first clock after Start landing step 0. A clock before the Timer's first call (at most one
//     @TEMPO period after the Setup) is counted, not stepped: `s.f` is not yet published.
//   - The callback: `local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end`,
//     then `local v=s.i[m]if not v then return end`, d = v//32, t = v%32, toggle s.p[d][t] and
//     paint the marker on m. `Q` before `G` because `Q`'s `E` clears the block through `V`. THE KEY
//     `Q` REMEMBERS IS THE PAD CELL, before the self.i lookup.
//   - No `R` (it holds no note per contact and paints nothing of its own on layer 0).
//
// WHAT IT SENDS
//   Per ring per step: s:gms(@CH,128,n[d],0,0) then, if the step is set, s:gms(@CH,144,n[d],100,0) -
//   n = {@N1,@N2,@N3,@N4}, inner to outer, 36 38 42 46 at the defaults (kick, snare, closed hat,
//   open hat by General MIDI), each note exactly one step long. Under External the same, on the
//   DAW's clock; nothing is sent while stopped.
//
// TRAPS
//   - THE TRAIL'S DECAY PAIR IS THE HOUSE IDIOM: glpfs(a,2,252,256-252//@TRAIL,0) lands on phase
//     0 only when @TRAIL is an EXACT DIVISOR of 252; @TRAIL's values are 21, 42, 63, 84, 126 for
//     that reason. decay-idiom.spec.ts holds the arithmetic and the usable timeouts.
//   - NEVER A KEEPER ON LAYER 2: it carries a decaying trail.
//   - @TEMPO AND @SYNC APPEAR IN BOTH EVENTS and both must move together.
//   - THE STEP ROUTINE LIVES IN THE TIMER because the Setup has 62 free and the routine costs ~300;
//     the clock callback reaches it through `s.f`, a field READ (a field CALL is refused by
//     host-surface.spec.ts). `local f=s.f if ... and f then f(s)end` is that read.
//   - THE PREVIEW HAS NO CLOCK: `sync` declares `previewIndex: 0`, so the browser renders Internal
//     whatever the knob says and the inspector says so; the wire carries the visitor's choice.
//   - `grxm(2,mode)` NEEDS A NUMBER (`l_grid_rx_mode`: a nil second argument is #GTV.invalidParams),
//     which is why the Sync literal is a boolean folded to 3 or 0 in the Setup.
//   - 254 (active sensing) MUST NOT RUN THE RINGS: the run test is `b==250 or b==251`, never `b>249`.
//   - THE CELL `Q` RETURNS IS THE LED UNDER THE FINGER: lua-smoke.spec.ts presses all 81 LED centres.
//   - EVERY DIVISION IS FLOORED: t//(d*2), t*h[d]//n, v//32, 252//@TRAIL, s.q%@DIV.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of every ring colour is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glp(a,2,0)end local s=self s.c={}s.p={}s.i={}s.k=0 s.q=0 local h={@PULSES}for d=1,4 do local n=d*8 local u={}local v={}for t=0,n-1 do local a,b=d,t%(d*2)-d for j=1,t//(d*2)do a,b=-b,a end local m=a+4+(b+4)*9 u[t]=m s.i[m]=d*32+t v[t]=t*h[d]//n~=(t-1)*h[d]//n if v[t]then glp(glag(0,m),1,255)end end s.c[d]=u s.p[d]=v end s.rtmrx_cb=function(s,h,b)if b==250 then s.k=0 s.q=0 end if b==250 or b==251 then s.r=1 elseif b==252 then s.r=nil elseif b==248 and s.r then local f=s.f if s.q%@DIV==0 and f then f(s)end s.q=s.q+1 end end s.touch_cb=function(s,i,e,x,y)local m=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not m then return end local v=s.i[m]if not v then return end local d=v//32 local t=v%32 s.p[d][t]=not s.p[d][t]glp(glag(0,m),1,s.p[d][t]and 255 or 0)end grxm(2,@SYNC and 3 or 0)gtt(0,@TEMPO)";

const TIMER =
  "--[[@cb]]gtt(0,@TEMPO)local s=self X(s,20)local function f(s)local c={@R1C,@R2C,@R3C,@R4C}local n={@N1,@N2,@N3,@N4}local k=s.k s.k=(k+1)%96 for d=1,4 do local t=k%(d*8)local a=glag(0,s.c[d][t])glc(a,2,c[d*3-2],c[d*3-1],c[d*3],1)glpfs(a,2,252,256-252//@TRAIL,0)glt(a,2,@TRAIL)s:gms(@CH,128,n[d],0,0)if s.p[d][t]then s:gms(@CH,144,n[d],100,0)end end end s.f=f if @SYNC then return end f(s)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

/** The running head's palette, shared by the four ring colour knobs. Every channel inside 0..255. */
const RING_PALETTE: readonly string[] = [
  "0,200,255",
  "255,90,0",
  "0,255,120",
  "255,255,255",
  "120,0,255",
];

/** Every MIDI note, 0..127: the typed field takes `C#3` or `49` and the stamp carries the index. */
const NOTES: readonly string[] = Array.from({ length: 128 }, (_, n) =>
  String(n),
);

/** The sixteen zero-based channels, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058). */
const CHANNELS: readonly string[] = Array.from({ length: 16 }, (_, n) =>
  String(n),
);

export const ORBIT: CatalogEntry = {
  id: "orbit",
  name: "Orbit",
  description:
    "Four Euclidean rings, a colour and a note each, on their tempo or your DAW’s clock; tap a step to change it.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["sequencing", "generative", "playable"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Fourteen knobs - past TUNE-01's six by the user's word (change 8, answer 2) - each one literal
  // token substitution; every default is the INDEX of the value that reproduces the canonical text.
  knobs: [
    {
      id: "tempo",
      label: "Tempo",
      kind: "speed",
      token: "@TEMPO",
      // Milliseconds between steps, reversed at change 8 so the bigger number sits on the right;
      // the default is the same 110 ms. APPEARS IN BOTH EVENTS. Ignored by the rings under External
      // (the Timer still runs at it for the finger sweep).
      values: ["70", "90", "110", "140", "180", "240"],
      default: 2,
    },
    {
      id: "pulses",
      label: "Pulses",
      kind: "count",
      token: "@PULSES",
      // Pulses per ring, inner to outer, over 8, 16, 24 and 32 steps.
      values: [
        "3,5,7,11",
        "2,3,5,7",
        "5,9,13,17",
        "3,8,11,19",
        "4,8,12,16",
        "7,11,17,23",
      ],
      default: 0,
    },
    {
      id: "ring1Colour",
      label: "Ring 1 colour",
      kind: "colour",
      token: "@R1C",
      values: RING_PALETTE,
      default: 0,
    },
    {
      id: "ring2Colour",
      label: "Ring 2 colour",
      kind: "colour",
      token: "@R2C",
      values: RING_PALETTE,
      default: 2,
    },
    {
      id: "ring3Colour",
      label: "Ring 3 colour",
      kind: "colour",
      token: "@R3C",
      values: RING_PALETTE,
      default: 4,
    },
    {
      id: "ring4Colour",
      label: "Ring 4 colour",
      kind: "colour",
      token: "@R4C",
      values: RING_PALETTE,
      default: 3,
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
      id: "sync",
      label: "Sync",
      kind: "mode",
      token: "@SYNC",
      // Internal: the Timer steps at @TEMPO and MIDIRTM stays unrouted (`grxm(2,0)`). External:
      // `grxm(2,3)` routes the host's realtime bytes to `rtmrx_cb`, which steps every @DIV clocks
      // from Start; the Timer steps nothing. Worded by view.ts's SYNC_WORDS. APPEARS IN BOTH EVENTS.
      // The browser has no clock: the preview renders Internal (`previewIndex`) and says so.
      values: ["false", "true"],
      default: 0,
      previewIndex: 0,
    },
    {
      id: "division",
      label: "Division",
      kind: "mode",
      token: "@DIV",
      // MIDI clocks per step at 24 per quarter: 12 an 8th, 6 a 16th, 3 a 32nd. Worded by view.ts's
      // DIVISION_WORDS. Read under External only.
      values: ["12", "6", "3"],
      default: 1,
    },
    {
      id: "note1",
      label: "Ring 1 MIDI note",
      kind: "note",
      token: "@N1",
      // The inner ring's note, 0..127 (C-1 to G9 in the readout's spelling, C4 = 60); 36 (C1,
      // kick) at the default.
      values: NOTES,
      default: 36,
    },
    {
      id: "note2",
      label: "Ring 2 MIDI note",
      kind: "note",
      token: "@N2",
      // 38 (D1, snare) at the default.
      values: NOTES,
      default: 38,
    },
    {
      id: "note3",
      label: "Ring 3 MIDI note",
      kind: "note",
      token: "@N3",
      // 42 (F#1, closed hat) at the default.
      values: NOTES,
      default: 42,
    },
    {
      id: "note4",
      label: "Ring 4 MIDI note",
      kind: "note",
      token: "@N4",
      // The outer ring's note; 46 (A#1, open hat) at the default.
      values: NOTES,
      default: 46,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. TWICE, both in the Timer.
      values: CHANNELS,
      default: 0,
    },
  ],

  // The same fourteen indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    tempo: 2,
    pulses: 0,
    ring1Colour: 0,
    ring2Colour: 2,
    ring3Colour: 4,
    ring4Colour: 3,
    trail: 1,
    sync: 0,
    division: 1,
    note1: 36,
    note2: 38,
    note3: 42,
    note4: 46,
    channel: 0,
  },

  // FALSE: Setup lights the generated pulse cells on layer 1. frames.spec.ts checks it.
  restsBlack: false,
};
