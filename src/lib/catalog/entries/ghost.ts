// GHOST - draw a curve once, and it loops until you take it back; the ghost replays on its own
// 20 ms Timer or one point per DAW MIDI clock (change 12, 2026-09-18, BENCH-2026-09-16.txt s. 12).
//
// A gesture looper. Hold a finger and drag: the Timer records the raw path at 50 Hz while the
// X / Y pair goes out as two CCs. Lift, and a ghost retraces exactly what you drew, forever,
// still sending. One gesture is one loop (every onset starts a fresh recording); the reset is a
// lit red key at cell 80 that exists exactly when there is something to erase. Single-contact.
// Re-authored from a blank page in 11-11; the finger and the calibrated cell came from the library
// in 12.1-08a. Eleven knobs: @RECC, @GHOSTC, @LEN, @SYNC (both events), @DIV, and since change 17B
// two MIDI outputs - the X axis (@XT @CH @CCX) and the Y axis (@YT @YCH @CCY). Setup 749 of 908 at
// the picker corner (744), Timer 560 (556); dark at rest.
// History: docs/entries/ghost.md (the three reset sketches, 11-11, 12.1-08a; change 12's sync;
// change 17B's outputs).
//
// MECHANISM
//   - Setup: layer 1 @RECC and layer 2 @GHOSTC at phase 0 on every cell; cell 80 coloured
//     255,0,0 on layer 1 (the key - a function, not the palette); `self.k` its address, `self.g`
//     the recording (raw `x*128+y` per point), `self.n` its length, `self.j` the replay index,
//     `self.p` the key's pulse counter, `self.q` the clock count; `self.midirx_cb=nil` (change
//     17B, below); `grxm(2,@SYNC and 3 or 0)` routes MIDIRTM to Lua under External only;
//     `gtt(0,20)`.
//   - The callback: `if i>0 then return end`, then `G(s,i,e,x,y,0,@RECC)` (the library's
//     bilinear finger on layer 0 in the recording colour; it clears the contact's previous
//     block and returns on an end code and on a 9). On an onset (`e==4 or e>8`): clear both
//     layers on all 81 cells with `glpfs(a,l,0,0,0)`, reset j and p, `s.h=nil`; if a recording
//     exists and `N(x,y)==80` (the LED at (8,8) through the calibrated map) erase it, else start
//     `s.g={x*128+y}`, `s.n=1`, `s.h=e<9` - a contact is live iff it is not a press-and-lift in
//     one message, so a tap records one point and goes straight to playback. On an end
//     (`e==3 or e>=5 and e<9`) `s.h=nil`. Every sample stores `s.x`, `s.y`.
//   - The Timer, 20 ms, `gtt(0,20)` first. If a recording exists, pulse the key: every
//     fourteenth tick re-arm cell 80's decay (42 ticks armed, re-armed after 28: the phase
//     breathes 252 -> 84 and never reaches black, so the corner is a cell still being DRIVEN).
//     Then three locals: `m(t,c,n,o)` sends one axis on its type (below); `p(x,y,l)` sends the
//     pair through it and arms the house decay pair on `N(x,y)` on
//     layer l; the replay step `f(s)` returns while a finger is held or nothing is recorded, else
//     steps j modulo n, decodes the point and calls `p` on layer 2. `s.f=f` publishes it. While
//     `s.h`: append the held raw point up to @LEN (a motionless finger still records - the
//     callback's enqueue is change-gated, the Timer's is not), hold j at 0, `p` on layer 1 and
//     return - RECORDING IS REAL-TIME UNDER BOTH MODES. Else `if @SYNC then return end f(s)`:
//     Internal replays one point a tick here, External replays nowhere here.
//   - `self.rtmrx_cb=function(s,h,b)` - ORBIT's clock idiom (docs/entries/orbit.md): 250 Start
//     resets j and q and runs (the loop restarts on the bar); 251 Continue runs; 252 Stop halts
//     (no sends, the picture stops, the key still pulses); 248 while running replays one point
//     through `s.f` every @DIV clocks - 1, 2 or 3 clocks a point (at 120 BPM a clock is 20.8 ms,
//     so one point a clock is very nearly the speed it was drawn, and the loop stretches with the
//     DAW's tempo). A field READ (a field call is refused by host-surface.spec.ts).
//   - No `Q`, `X` or `R`: the library's expiry would end the recording of a STILL finger, which
//     is a behaviour change (docs/HARDWARE-AUDITION.md row 27(d) asks; the shape is measured in
//     the doc). A lost lift leaves the comet at the last point, the recording running to @LEN,
//     and one lit block on layer 0 that the next onset's `G` clears.
//
// WHAT IT SENDS (two outputs since change 17B, X axis and Y axis)
//   m(@XT,@CH,@CCX,x) and m(@YT,@YCH,@CCY,127-y) once per Timer tick while a point is in hand -
//   recording, or replaying under Internal - and once per @DIV clocks while replaying under
//   External, with the RAW sensor pair (D-14); only the picture goes through the calibrated map.
//   `m` sends by the axis's type: a controller `n, o`, a pitch bend `0, o` (64 the centre), a
//   channel pressure `o, 0`. Until 17B the pair was one channel and "@CCX+1"; each axis now has
//   its own Channel and Number, the Y axis 17 and the X axis's channel by default, so the defaults
//   send exactly what they sent. Erasing sends nothing; a stopped ghost sends nothing.
// WHAT IT RECEIVES (change 17B): nothing. The values are a recording's replay - no position is
//   held for a received value to set (the next replayed point overwrites it within 20 ms), and a
//   DAW recording the ghost would hear its own loop come back - so neither axis has a Receive and
//   the Setup assigns `self.midirx_cb=nil` (`rtmrx_cb`, the clock, is a different field and
//   stays). The latch: one contact, one control, the red key acted on at the onset only - already
//   latched.
//
// TRAPS
//   - THE CLEAR IS glpfs(a,l,0,0,0), AND glp(a,l,0) WAS THE BUG: `glp` does not touch the RATE or
//     the TIMEOUT, and grid_led_tick does `pha += fre` on every tick a timeout is still running
//     (pad-sim.ts:885-895; grid_led.c:191-211), so a cell mid-decay set to phase 0 is at phase
//     250 on the next tick. Rate 0 is the house idiom for taking a cell back from a decay it
//     started; decay-idiom.spec.ts skips it by name.
//   - THE KEY IS `N(x,y)==80`, NOT `x*9//128+y*9//128*9==80`: the naive ninth read cell 80 for
//     every raw pair at 114 or above, which on the user's module is where LED (7,7) sits - a
//     finger on LED (7,7) while a loop played erased the loop. lua-smoke.spec.ts pins both
//     readings in the real VM.
//   - `s.h=e<9` IS THE WHOLE CODE-9 FIX: a coalesced tap used to set `s.h` and nothing cleared it,
//     so the card recorded one frozen point forever. touch-guard.spec.ts holds the convention.
//   - CONTACT ENDED is `e==3 or e>=5 and e<9`, CONTACT STARTED `e==4 or e>8`, unbracketed
//     because each chain is the whole condition here; copied into a larger expression they need
//     brackets (`and` binds tighter than `or`).
//   - EVERY DECAY LANDS ON PHASE 0: both pairs are the house idiom at T = 42 (252, step 6).
//   - @LEN MAY NOT EXCEED 250: the replay walks s.g modulo s.n; the loop is the FIRST @LEN
//     points, and a drag past the cap keeps sending and stops recording.
//   - @SYNC APPEARS IN BOTH EVENTS and both must move together. THE REPLAY STEP LIVES IN THE
//     TIMER, published by its FIRST call - at most 20 ms after the Setup. A clock inside that
//     window is counted, not stepped.
//   - THE PREVIEW HAS NO CLOCK: `sync` declares `previewIndex: 0`, so the browser renders Internal
//     whatever the knob says and the inspector says so; the wire carries the visitor's choice.
//   - `grxm(2,mode)` NEEDS A NUMBER, which is why the Sync literal is a boolean folded to 3 or 0.
//   - 254 (active sensing) MUST NOT RUN THE GHOST: the run test is `b==250 or b==251`.
//   - THE RACK GREW AT CHANGE 12: 5, 5, 5, 2, 3, 4, 16 values; a GHOST link shared before it
//     carries five indices and lands `unreadable` (the card opens at its defaults) - the length
//     check, by design (stamp.spec.ts). Until then the rack was byte-identical to 11-11's. AND AT
//     CHANGE 17B: @CCX 4 -> 128 values (wide, two stamp characters) and four knobs appended.
//   - WHILE A GHOST LOOPS, A NEW DRAG CANNOT START ON CELL 80 without erasing first; a comet or
//     ghost dot passing OVER it is unaffected (the key acts on an onset only).
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts @RECC on every call, so an alert's recolour
//     heals on the next sample; `glc(...,1)` forces the min to 0, so the black rest frame holds.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of both colour knobs is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,@RECC,1)glp(a,1,0)glc(a,2,@GHOSTC,1)glp(a,2,0)end local k=glag(0,80)glc(k,1,255,0,0,1)self.k=k self.g={}self.n=0 self.j=0 self.p=0 self.q=0 self.touch_cb=function(s,i,e,x,y)if i>0 then return end G(s,i,e,x,y,0,@RECC)if e==4 or e>8 then for a=0,80 do glpfs(a,1,0,0,0)glpfs(a,2,0,0,0)end s.j=0 s.p=0 s.h=nil if s.n>0 and N(x,y)==80 then s.g={}s.n=0 else s.g={x*128+y}s.n=1 s.h=e<9 end end if e==3 or e>=5 and e<9 then s.h=nil end s.x=x s.y=y end self.rtmrx_cb=function(s,h,b)if b==250 then s.j=0 s.q=0 end if b==250 or b==251 then s.r=1 elseif b==252 then s.r=nil elseif b==248 and s.r then local f=s.f if s.q%@DIV==0 and f then f(s)end s.q=s.q+1 end end self.midirx_cb=nil grxm(2,@SYNC and 3 or 0)gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self if s.n>0 then s.p=s.p%14+1 if s.p==1 then glpfs(s.k,1,252,250,0)glt(s.k,1,42)end end local function m(t,c,n,o)s:gms(c,t,t==208 and o or t>223 and 0 or n,t==208 and 0 or o)end local function p(x,y,l)m(@XT,@CH,@CCX,x)m(@YT,@YCH,@CCY,127-y)local a=glag(0,N(x,y))glpfs(a,l,252,250,0)glt(a,l,42)end local function f(s)if s.h or s.n==0 then return end s.j=s.j%s.n+1 local v=s.g[s.j]p(v//128,v%128,2)end s.f=f if s.h then local x,y=s.x,s.y if s.n<@LEN then s.n=s.n+1 s.g[s.n]=x*128+y end s.j=0 p(x,y,1)return end if @SYNC then return end f(s)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const GHOST: CatalogEntry = {
  id: "ghost",
  name: "Ghost",
  description:
    "Drag once and a ghost retraces your path forever, still sending; the red corner takes it back.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["modulation", "generative", "expressive"],
  featured: false,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Seven knobs - past TUNE-01's six by the user's word for a sync card (change 8, answer 2;
  // change 12) - each one literal token substitution; every default is the INDEX of the value
  // that reproduces the canonical text. TOKEN PREFIX CHECK: none of @RECC, @GHOSTC, @LEN, @SYNC,
  // @DIV, @CCX, @CH is a prefix of another.
  knobs: [
    {
      id: "recordColour",
      label: "Recording colour",
      kind: "colour",
      token: "@RECC",
      // Layer 1 (the comet under your own finger) and the library's gradient on layer 0. Every
      // channel inside 0..255: the firmware truncates rather than clamps. The erase key on
      // layer 1 does NOT take this colour - Setup writes cell 80 red after the loop.
      values: [
        "0,255,180",
        "0,200,255",
        "255,140,0",
        "120,255,0",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "ghostColour",
      label: "Ghost colour",
      kind: "colour",
      token: "@GHOSTC",
      // Layer 2 - the replay. Clearly different from the recording colour: telling your hand
      // from its ghost is the point of two layers.
      values: [
        "255,80,255",
        "255,140,0",
        "0,200,255",
        "180,255,255",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "loopLength",
      label: "Loop length (points)",
      kind: "size",
      token: "@LEN",
      // Recorded samples at 20 ms each: 250 is five seconds. NONE may exceed 250 (TRAPS); the
      // loop is the first @LEN points, not the last.
      values: ["60", "120", "180", "220", "250"],
      default: 4,
    },
    {
      id: "sync",
      label: "Sync",
      kind: "mode",
      token: "@SYNC",
      // Internal: the ghost replays one point a tick on the 20 ms Timer and MIDIRTM stays
      // unrouted (`grxm(2,0)`). External: `grxm(2,3)` routes the host's realtime bytes to
      // `rtmrx_cb`, which replays one point every @DIV clocks from Start; the Timer replays
      // nothing and still records. Worded by view.ts's SYNC_WORDS. APPEARS IN BOTH EVENTS. The
      // browser has no clock: the preview renders Internal (`previewIndex`) and says so.
      values: ["false", "true"],
      default: 0,
      previewIndex: 0,
    },
    {
      id: "division",
      label: "Clocks a point",
      kind: "count",
      token: "@DIV",
      // MIDI clocks per replayed point under External, 24 to the quarter: 1 replays at very
      // nearly the drawn speed at 120 BPM (a clock is 20.8 ms against the 20 ms recording), 2
      // and 3 stretch the loop. Not ORBIT's 8th / 16th / 32nd: twelve clocks a point would play a
      // five-second drawing over a minute. A three-dot rail with the bare number as its readout.
      values: ["1", "2", "3"],
      default: 0,
    },
    {
      id: "cc",
      label: "X controller",
      kind: "amount",
      token: "@CCX",
      // The X axis's Number (change 17B; the pair's first controller before it, "CC pair"): all of
      // 0..127, its four old rungs first so a saved copy's index keeps its controller.
      values: numberValues(["16", "20", "74", "102"]),
      default: 0,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // The X axis's Channel, ZERO-BASED on the wire (gms's first argument); the rows read 1..16.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "xType",
      label: "X MIDI type",
      kind: "mode",
      token: "@XT",
      // The X axis's type (change 17B): a controller, a pitch bend, a channel pressure.
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "yType",
      label: "Y MIDI type",
      kind: "mode",
      token: "@YT",
      // The Y axis's type (change 17B).
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "yChannel",
      label: "Y MIDI channel",
      kind: "amount",
      token: "@YCH",
      // The Y axis's Channel (change 17B): its own, the X axis's by default (Same channel for all
      // sets both).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "yCc",
      label: "Y controller",
      kind: "amount",
      token: "@CCY",
      // The Y axis's Number (change 17B): its own controller, 17 by default - the X axis's
      // default plus one, as "@CCX+1" sent it before the axes were two outputs.
      values: numberValues(),
      default: 17,
    },
  ],

  // Two outputs (change 17B): the pair GHOST always sent, now each axis on its own Type, Channel
  // and Number. No Receive: the values are a recording's replay (docs/entries/ghost.md).
  outputs: [
    {
      id: "x",
      name: "X axis",
      kind: "continuous",
      tokens: { type: "@XT", channel: "@CH", number: "@CCX" },
    },
    {
      id: "y",
      name: "Y axis",
      kind: "continuous",
      tokens: { type: "@YT", channel: "@YCH", number: "@CCY" },
    },
  ],

  // The same seven indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    recordColour: 0,
    ghostColour: 0,
    loopLength: 4,
    sync: 0,
    division: 0,
    cc: 0,
    channel: 0,
    xType: 0,
    yType: 0,
    yChannel: 0,
    yCc: 17,
  },

  // TRUE: both layers are coloured at Setup and left at phase 0, and the key is only LIT by
  // the Timer while there is a recording. frames.spec.ts test 5 checks it in both directions.
  restsBlack: true,
};
