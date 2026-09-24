// STEPS - an eight by eight step grid with a bright column sweeping across it, on its own Timer or
// on the DAW's MIDI clock (change 12, 2026-09-18, BENCH-2026-09-16.txt section 12).
//
// Tap or swipe to arm cells; a column sweeps left to right and plays what you armed on the way
// past. Eight tracks, eight steps; the ninth column and the bottom row are dark by design (a step
// is a 16th at the BPM knob, so the eight columns are two beats; eight tracks is a drum kit). The
// plain rectangular grid ORBIT and SONAR deliberately are not. Setup arms a default pattern - the
// bottom row on every second step - so the card plays before anyone touches it. Knobs: @BPM (both
// events), @ARMC, @SWEEPC, @TRAIL (a divisor of 252), @SYNC (both events), @DIV, and since change
// 17B eight MIDI outputs, Track 1..8 (row 0..7), each @Td, a channel (@CH for track 1, @C2..@C8), a
// note (@NOTE for track 1, @N2..@N8) and @Rd - forty knobs. Setup 746 of 908 at the picker corner
// (739 at the defaults), Timer 826 (810); restsBlack false.
// History: docs/entries/steps.md (11-07, 11-08, 12-08, 12.1-03 measurements; change 12's sync;
// change 17B's tracks).
//
// MECHANISM
//   - self.p is a flat table indexed 0..63, one boolean per cell, the column in the low three
//     bits: index n is column n%8, row n//8, and the pad cell under it is n%8 + n//8*9. self.k
//     is the sweep column, self.q the clock count, self.r the run flag. Setup: layer 1 @SWEEPC at
//     phase 0 (the column), layer 2 @ARMC at 255 where armed (n>55 and n%2==0) else 0;
//     `grxm(2,@SYNC and 3 or 0)` routes MIDIRTM to Lua under External only; `gtt(0,15000//@BPM)`.
//   - The callback: `local a=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not a then return end`,
//     then c = a%9, r = a//9, `if c>7 or r>7 then return end`, n = c+r*8, toggle s.p[n] and paint
//     the cell's layer 2. `Q` holds the cell with hysteresis and returns it only on a change or
//     an onset (a swipe arms each cell it crosses once; a resting finger arms nothing twice; the
//     live test, the onset test and the code-9 store are inside it). `G` draws the library's
//     finger in WHITE on layer 0 (a literal, not a knob). `Q` before `G` because `Q`'s `E`
//     clears the block through `V`. THE 8x8 GUARD RUNS AFTER `Q`, NOT BEFORE: `Q` hit-tests the
//     9x9 pad so the hysteresis is measured in PAD cells, the frame the physical boundary is in;
//     an 8x8 test in front of `Q` would make the ninth column a hole in the contact tracking.
//     The dedup key inside `Q` is the 9x9 cell, which is unique over all 81 (c+r*8 aliases).
//   - The Timer, `gtt(0,15000//@BPM)` first (the handler runs inside a pcall; a re-arm at the end
//     dies permanently on the first raise): `X(s,20)` sweeps contacts quiet for twenty calls
//     (2.4 s at the default; a lost lift is reached by `X`, never by `Q`). Then two locals: the
//     release `u(s)` - the off for the SOUNDING column's armed rows, (s.k+7)%8 - and the step
//     `f(s)`: `u(s)`, k = s.k%8, advance, then for each row paint column k's decay pair
//     glpfs(a,1,252,256-252//@TRAIL,0) glt(a,1,@TRAIL) and play the armed rows. Both are
//     published on every call (`s.f=f s.u=u`), then `if @SYNC then return end f(s)`: Internal
//     steps here, External steps nowhere here. Note-off before note-on in the same body, so a
//     held note never overlaps itself.
//   - `self.rtmrx_cb=function(s,h,b)` - ORBIT's clock idiom (docs/entries/orbit.md): 250 Start
//     releases the sounding column through `s.u`, resets k and q, and runs; 251 Continue runs;
//     252 Stop halts and releases the sounding column; 248 while running steps through `s.f`
//     every @DIV clocks (12 / 6 / 3 = an 8th / 16th / 32nd at 24 per quarter), the first clock
//     after Start landing column 0. Both are field READS (a field call is refused by
//     host-surface.spec.ts); a byte before the Timer's first call finds neither published.
//   - No `R` (it holds no note per contact and paints nothing of its own on layer 0).
//   - A swipe that crosses a cell twice toggles it twice - correct for a toggle (orbit.md names
//     the set-rather-than-toggle alternative as an open bench question).
//
// WHAT IT SENDS (each track its own output since change 17B; T, h, N the Timer's tables of the
// eight tracks' types, channels and numbers, d = r+1)
//   on    s:gms(h[d],T[d],N[d],100) for every armed row of the new column - a note, or a controller
//   off   s:gms(h[d],T[d]*3//2-88,N[d],0) (128, or the controller at 0) for every armed row of the
//         previous column, first; the same offs on the DAW's Start and Stop, so nothing hangs
//         across a transport. At the defaults the tracks are 36..43 on channel 10 (wire 9): the
//         wire STEPS sent, message for message.
// WHAT IT RECEIVES (change 17B; @Rd the header INSTR per track, 13 On, 0 Off)
//   A host note-on (a controller above 0 under CC) on a track's type, channel and number ARMS the
//   track's step at the playhead - the column last played, (s.k-1)%8 - and lights it: live step
//   recording, ORBIT's rule. A note-off, a zero, another channel or number do nothing; RX NEVER
//   CLEARS a step, so STEPS's own notes echoed back by a DAW's MIDI thru change nothing. Nothing is
//   sent. The callback is made by the TIMER once per install (`s.j`); the Setup assigns
//   `self.midirx_cb=nil`. The latch: a swipe toggling every cell it crosses is the gesture - swipe
//   by design.
//
// TRAPS
//   - THE DECAY RATE IS DERIVED FROM THE TRAIL LENGTH: rate 256 - 252//@TRAIL from phase 252
//     lands on exactly 0 only when @TRAIL divides 252 (12 -> step 21, 28 -> 9, 42 -> 6, 63 -> 4).
//     A fixed rate of 250 at any other length expires part-way down and THE CELL FREEZES HALF
//     LIT (measured at phase 183 / 111 / 127 for trails of 12 / 24 / 64). Any new value must
//     divide 252.
//   - NO KEEPER IS WRITTEN ON LAYER 1 AT ALL: the column is a decay, and glt(a,1,65535) on a
//     decaying layer is pitfall 1 exactly - the countdown is replaced, the rate wraps, every
//     swept cell strobes forever.
//   - EACH TRACK'S NUMBER IS ITS OWN (0..127) since change 17B; no arithmetic joins the rows.
//   - @BPM AND @SYNC APPEAR IN BOTH EVENTS and both must move together. The step is a 16th,
//     `15000//@BPM` ms: 200 150 120 90 60 at 75 100 125 166 250 - today's five periods exactly,
//     125 the default (the 120 ms column the card always had, so the rest frame did not move).
//   - THE STEP ROUTINE AND THE RELEASE LIVE IN THE TIMER and the clock callback reaches them
//     through `s.f` and `s.u`, both published by the Timer's FIRST call - at most one step
//     period after the Setup. A clock inside that period is counted, not stepped.
//   - THE PREVIEW HAS NO CLOCK: `sync` declares `previewIndex: 0`, so the browser renders Internal
//     whatever the knob says and the inspector says so; the wire carries the visitor's choice.
//   - `grxm(2,mode)` NEEDS A NUMBER, which is why the Sync literal is a boolean folded to 3 or 0.
//   - 254 (active sensing) MUST NOT RUN THE SWEEP: the run test is `b==250 or b==251`.
//   - EVENT CODES: this entry no longer reads one; `e` is passed straight to `Q`. e == 5 appears
//     nowhere here and nowhere in the library; touch-guard.spec.ts knows this body delegates.
//   - EVERY DIVISION IS FLOORED: `a%9`, `a//9`, `15000//@BPM`, `s.q%@DIV` (the library's `Q`,
//     `U`, `W`, `G` floor with `//`).
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE: every phase here is an explicit 0 or 255.
//   - TWO SPACES WERE MEASURED OUT OF THE SETUP: `self.p[n]and 255 or 0` with no space is what
//     compressScript emits; the readable form fails the canonical-form gate.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts white on every call; `glc(...,1)` forces the
//     min to 0, so the dark column and row stay dark under no finger.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @ARMC and @SWEEPC is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  previewFor,
  type CatalogEntry,
  type CatalogSource,
  type LuaKnob,
  type MidiOutput,
} from "../types";
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

/**
 * Track d's knobs past the eight the card had (change 17B): its Type, Channel (track 1's is the
 * old `channel`), Number (track 1's is the old `note`) and Receive, appended track by track.
 * Track d is row d-1, top to bottom.
 */
function trackKnobs(d: number): LuaKnob[] {
  const type: LuaKnob = {
    id: `type${d}`,
    label: `Track ${d} MIDI type`,
    kind: "mode",
    token: `@T${d}`,
    values: TRIGGER_STATUSES,
    default: 0,
  };
  const receive: LuaKnob = {
    id: `receive${d}`,
    label: `Track ${d} MIDI receive`,
    kind: "mode",
    token: `@R${d}`,
    values: RECEIVE_VALUES,
    default: RECEIVE_ON_INDEX,
  };
  if (d === 1) return [type, receive];
  return [
    type,
    {
      id: `channel${d}`,
      label: `Track ${d} MIDI channel`,
      kind: "amount",
      token: `@C${d}`,
      // 9 by default (the drum channel, 10 as the rows read it), as every track sent before.
      values: CHANNEL_VALUES,
      default: 9,
    },
    {
      id: `note${d}`,
      label: `Track ${d} MIDI note`,
      kind: "note",
      token: `@N${d}`,
      // 36 + d - 1 by default: the old @NOTE+r at the default lowest note.
      values: numberValues(),
      default: 35 + d,
    },
    receive,
  ];
}

/** Track d's output: a trigger - a set step's note-on, the next column's note-off. */
const trackOutput = (d: number): MidiOutput => ({
  id: `track${d}`,
  name: `Track ${d}`,
  kind: "trigger",
  tokens: {
    type: `@T${d}`,
    channel: d === 1 ? "@CH" : `@C${d}`,
    number: d === 1 ? "@NOTE" : `@N${d}`,
    receive: `@R${d}`,
  },
});

const SETUP =
  "--[[@cb]]self.p={}self.k=0 self.q=0 for n=0,63 do self.p[n]=n>55 and n%2==0 local a=glag(0,n%8+n//8*9)glc(a,1,@SWEEPC,1)glp(a,1,0)glc(a,2,@ARMC,1)glp(a,2,self.p[n]and 255 or 0)end self.touch_cb=function(s,i,e,x,y)local a=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not a then return end local c=a%9 local r=a//9 if c>7 or r>7 then return end local n=c+r*8 s.p[n]=not s.p[n]glp(glag(0,a),2,s.p[n]and 255 or 0)end self.rtmrx_cb=function(s,h,b)if b==250 then local u=s.u if u then u(s)end s.k=0 s.q=0 end if b==250 or b==251 then s.r=1 elseif b==252 then s.r=nil local u=s.u if u then u(s)end elseif b==248 and s.r then local f=s.f if s.q%@DIV==0 and f then f(s)end s.q=s.q+1 end end self.midirx_cb=nil grxm(2,@SYNC and 3 or 0)gtt(0,15000//@BPM)";

const TIMER =
  "--[[@cb]]gtt(0,15000//@BPM)local s=self X(s,20)local T,h,N={@T1,@T2,@T3,@T4,@T5,@T6,@T7,@T8},{@CH,@C2,@C3,@C4,@C5,@C6,@C7,@C8},{@NOTE,@N2,@N3,@N4,@N5,@N6,@N7,@N8}local function u(s)local q=(s.k+7)%8 for r=0,7 do if s.p[q+r*8]then s:gms(h[r+1],T[r+1]*3//2-88,N[r+1],0)end end end local function f(s)u(s)local k=s.k%8 s.k=k+1 for r=0,7 do local a=glag(0,k+r*9)glpfs(a,1,252,256-252//@TRAIL,0)glt(a,1,@TRAIL)if s.p[k+r*8]then s:gms(h[r+1],T[r+1],N[r+1],100)end end end s.f=f s.u=u if s.j~=s.touch_cb then s.j=s.touch_cb local R,j={@R1,@R2,@R3,@R4,@R5,@R6,@R7,@R8},s.j s.midirx_cb=function(s,e,v)local q,w=v[2],v[4]if q==128 then w=0 end if s.touch_cb==j and w>0 then local c=(s.k-1)%8 for r=0,7 do local d=r+1 if e[1]==R[d]and q==T[d]and v[1]==h[d]and v[3]==N[d]then s.p[c+r*8]=true glp(glag(0,c+r*9),2,255)end end end end end if @SYNC then return end f(s)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STEPS: CatalogEntry = {
  id: "steps",
  name: "Steps",
  description:
    "Tap a cell to arm it and a bright column sweeps across, playing back the pattern you drew.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Eight knobs - past TUNE-01's six by the user's word for a sync card (change 8, answer 2;
  // change 12) - each one literal token substitution; every default is the INDEX of the value
  // that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @BPM, @ARMC, @SWEEPC,
  // @TRAIL, @SYNC, @DIV, @NOTE, @CH is a prefix of another.
  knobs: [
    {
      id: "tempo",
      label: "Tempo (BPM)",
      kind: "speed",
      token: "@BPM",
      // Beats per minute, ascending, so the bigger number and the faster column are the same end
      // (change 12, ORBIT's 8b shape); a column is a 16th, `15000//@BPM` ms: 200 150 120 90 60 -
      // the five periods the card had in milliseconds, and 125 is exactly the 120 ms default.
      // APPEARS IN BOTH EVENTS. Ignored by the sweep under External (the Timer still runs at it
      // for the finger sweep). The id stays `tempo`: the stamp and the specs read the id.
      values: ["75", "100", "125", "166", "250"],
      default: 2,
    },
    {
      id: "armed",
      label: "Armed colour",
      kind: "colour",
      token: "@ARMC",
      // The armed cells, on layer 2, static. Its four are dim, so the column stays readable against it.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,40,60", "40,0,60", "60,30,0", "30,30,30"]),
      default: 0,
    },
    {
      id: "sweep",
      label: "Column colour",
      kind: "colour",
      token: "@SWEEPC",
      // The sweeping column, on layer 1, bright: one layer never exceeds 254/512 of the value.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,200,255", "255,90,0", "0,255,120", "255,255,255"]),
      default: 0,
    },
    {
      id: "trail",
      label: "Trail length",
      kind: "feel",
      token: "@TRAIL",
      // Ticks of decay behind the column, at 10 ms a tick. EVERY VALUE DIVIDES 252 (TRAPS).
      // NEVER A KEEPER on this layer.
      values: ["12", "28", "42", "63"],
      default: 2,
    },
    {
      id: "sync",
      label: "Sync",
      kind: "mode",
      token: "@SYNC",
      // Internal: the Timer steps at the BPM knob and MIDIRTM stays unrouted (`grxm(2,0)`). External:
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
      // MIDI clocks per column at 24 per quarter: 12 an 8th, 6 a 16th, 3 a 32nd. Worded by
      // view.ts's DIVISION_WORDS. Read under External only.
      values: ["12", "6", "3"],
      default: 1,
    },
    {
      id: "note",
      label: "Track 1 MIDI note",
      kind: "note",
      token: "@NOTE",
      // Track 1's Number (change 17B; "Lowest note" before it, row r playing it plus r): all of
      // 0..127, its four old rungs first so a saved copy keeps its note. 36 is the GM kick.
      values: numberValues(["36", "48", "60", "24"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Track 1 MIDI channel",
      kind: "amount",
      token: "@CH",
      // Track 1's Channel (change 17B; every track's before it). ZERO-BASED on the wire, the rows
      // read 1..16. The default is 9 (channel 10, where a drum machine listens) - index 9 of the
      // sixteen since 17B, index 2 of the four (0, 1, 9, 15) before it.
      values: CHANNEL_VALUES,
      default: 9,
    },
    ...[1, 2, 3, 4, 5, 6, 7, 8].flatMap(trackKnobs),
  ],

  // Eight outputs (change 17B), one per track - eight tracks is a drum kit, and a kit's notes are
  // seldom neighbours - each a trigger with Type, Channel, Number and Receive (a received note arms
  // the track's step at the playhead).
  outputs: [1, 2, 3, 4, 5, 6, 7, 8].map(trackOutput),

  // The same eight indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    tempo: 2,
    armed: 0,
    sweep: 0,
    trail: 2,
    sync: 0,
    division: 1,
    note: 0,
    channel: 9,
    // The tracks' knobs past the eight (change 17B), at their own defaults.
    ...Object.fromEntries(
      [1, 2, 3, 4, 5, 6, 7, 8]
        .flatMap(trackKnobs)
        .map((knob) => [knob.id, knob.default]),
    ),
  },

  // FALSE: Setup arms four cells of the bottom row at phase 255. frames.spec.ts test 5.
  restsBlack: false,
};
