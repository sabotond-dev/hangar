// GHOST - draw a curve once, and it loops until you take it back.
//
// A gesture looper. Hold a finger and drag: the Timer records the raw path at 50 Hz while the
// X / Y pair goes out as two CCs. Lift, and a ghost retraces exactly what you drew, forever,
// still sending. One gesture is one loop (every onset starts a fresh recording); the reset is a
// lit red key at cell 80 that exists exactly when there is something to erase. Single-contact.
// Re-authored from a blank page in 11-11 on the user's words; the finger and the calibrated cell
// came from the library in 12.1-08a. Knobs: @RECC, @GHOSTC, @LEN, @CCX (the pair is @CCX and
// @CCX+1), @CH. Setup 491 of 908 at the picker corner (486 at the defaults), Timer 409 (405);
// restsBlack true. No row in either gate's exception table.
// History: docs/entries/ghost.md (the three reset sketches, 11-11, 12.1-08a costings and findings).
//
// MECHANISM
//   - Setup: layer 1 @RECC and layer 2 @GHOSTC at phase 0 on every cell; cell 80 coloured
//     255,0,0 on layer 1 (the key - a function, not the palette); `self.k` its address, `self.g`
//     the recording (raw `x*128+y` per point), `self.n` its length, `self.j` the replay index,
//     `self.p` the key's pulse counter; `gtt(0,20)`.
//   - The callback: `if i>0 then return end`, then `G(s,i,e,x,y,0,@RECC)` (the library's
//     bilinear finger on layer 0 in the recording colour; it clears the contact's previous
//     block and returns on an end code and on a 9). On an onset (`e==4 or e>8`): clear both
//     layers on all 81 cells with `glpfs(a,l,0,0,0)`, reset j and p, `s.h=nil`; if a recording
//     exists and `N(x,y)==80` (the LED at (8,8) through the calibrated map) erase it, else start
//     `s.g={x*128+y}`, `s.n=1`, `s.h=e<9` - a contact is live iff it is not a press-and-lift in
//     one message, so a tap records one point and goes straight to playback. On an end
//     (`e==3 or e>=5 and e<9`) `s.h=nil`. Every sample stores `s.x`, `s.y`.
//   - The Timer, 20 ms, `gtt(0,20)` first: while `s.h`, append the held raw point up to @LEN
//     (a motionless finger still records - the callback's enqueue is change-gated, the Timer's
//     is not) and hold j at 0; else if a recording exists, step j modulo n and decode the point.
//     If a point is in hand: send the pair, and arm the house decay pair on `N(x,y)` - layer 1
//     while recording, layer 2 while replaying. If a recording exists, pulse the key: every
//     fourteenth tick re-arm cell 80's decay (42 ticks armed, re-armed after 28: the phase
//     breathes 252 -> 84 and never reaches black, so the corner is a cell still being DRIVEN).
//   - No `Q`, `X` or `R`: the library's expiry would end the recording of a STILL finger, which
//     is a behaviour change (docs/HARDWARE-AUDITION.md row 27(d) asks; the shape is measured in
//     the doc). A lost lift leaves the comet at the last point, the recording running to @LEN,
//     and one lit block on layer 0 that the next onset's `G` clears.
//
// WHAT IT SENDS
//   s:gms(@CH,176,@CCX,x,0) and s:gms(@CH,176,@CCX+1,127-y,0) once per Timer tick while a point
//   is in hand - recording or replaying - with the RAW sensor pair (D-14); only the picture goes
//   through the calibrated map. The second CC is "@CCX+1" rather than a literal so the pair
//   can never drift apart. Erasing sends nothing.
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
//   - THE RACK IS BYTE-IDENTICAL TO THE ONE THIS ENTRY REPLACED: 5, 5, 5, 4, 16 values is shape
//     character `6`, and every GHOST link ever shared decodes against it.
//   - WHILE A GHOST LOOPS, A NEW DRAG CANNOT START ON CELL 80 without erasing first; a comet or
//     ghost dot passing OVER it is unaffected (the key acts on an onset only).
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts @RECC on every call, so an alert's recolour
//     heals on the next sample; `glc(...,1)` forces the min to 0, so the black rest frame holds.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of both colour knobs is 0..255.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,@RECC,1)glp(a,1,0)glc(a,2,@GHOSTC,1)glp(a,2,0)end local k=glag(0,80)glc(k,1,255,0,0,1)self.k=k self.g={}self.n=0 self.j=0 self.p=0 self.touch_cb=function(s,i,e,x,y)if i>0 then return end G(s,i,e,x,y,0,@RECC)if e==4 or e>8 then for a=0,80 do glpfs(a,1,0,0,0)glpfs(a,2,0,0,0)end s.j=0 s.p=0 s.h=nil if s.n>0 and N(x,y)==80 then s.g={}s.n=0 else s.g={x*128+y}s.n=1 s.h=e<9 end end if e==3 or e>=5 and e<9 then s.h=nil end s.x=x s.y=y end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local x,y if s.h then x=s.x y=s.y if s.n<@LEN then s.n=s.n+1 s.g[s.n]=x*128+y end s.j=0 elseif s.n>0 then s.j=s.j%s.n+1 local v=s.g[s.j]x=v//128 y=v%128 end if x then s:gms(@CH,176,@CCX,x,0)s:gms(@CH,176,@CCX+1,127-y,0)local a=glag(0,N(x,y))local l=s.h and 1 or 2 glpfs(a,l,252,250,0)glt(a,l,42)end if s.n>0 then s.p=s.p%14+1 if s.p==1 then glpfs(s.k,1,252,250,0)glt(s.k,1,42)end end";

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

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. THE RACK IS BYTE-IDENTICAL TO THE ONE THIS
  // ENTRY REPLACED: 5, 5, 5, 4, 16 values is shape character `6` and every shared GHOST link
  // decodes against it.
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
      label: "Loop length",
      kind: "size",
      token: "@LEN",
      // Recorded samples at 20 ms each: 250 is five seconds. NONE may exceed 250 (TRAPS); the
      // loop is the first @LEN points, not the last.
      values: ["60", "120", "180", "220", "250"],
      default: 4,
    },
    {
      id: "cc",
      label: "CC pair",
      kind: "amount",
      token: "@CCX",
      // X on this number, Y on "@CCX+1"; every value leaves the pair inside 0..127.
      values: ["16", "20", "74", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058). Twice in
      // the Timer, once per half of the pair, so both leave on the same channel.
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
    recordColour: 0,
    ghostColour: 0,
    loopLength: 4,
    cc: 0,
    channel: 0,
  },

  // TRUE: both layers are coloured at Setup and left at phase 0, and the key is only LIT by
  // the Timer while there is a recording. frames.spec.ts test 5 checks it in both directions.
  restsBlack: true,
};
