// SNAKE - the game, played on eighty-one lights, with a note for every bite.
//
// Steer with a finger, eat, grow, and hear a note for every bite. Nobody touching: an autopilot
// steers the snake onto the food, so the card is alive on a browse page and in the OG image; the
// first finger switches it off for the rest of that game, and the snake keeps its last direction
// after the lift. Death is a flash, a pause and a restart from the two-cell snake; every game's
// food walk is seeded by the generation count at its restart, so the module never replays one
// short game (change 14, 2026-09-21; the first game from Setup is byte-identical to the one
// before it). Knobs: @SPEED (both events), @SNAKEC, @FOODC, and since change 17B two MIDI
// outputs - Bite (@TYPE @CH @NOTE) and Death (@DT @DCH @DN). Setup 896 of 908 at the picker corner
// (890 at the defaults), Timer 768 (757); restsBlack false. Kind "lua".
// History: docs/entries/snake.md (09-08 authoring, 11-16's corner sweep, change 14's remake;
// change 17B).
//
// MECHANISM
//   - self.b is the body as a RING BUFFER of cell indices, self.p the ring slot of the head,
//     self.l the length; self.o an occupancy table keyed by cell (one lookup, no scan); self.u,
//     self.v the direction as a column step and a row step; self.f the food cell; self.t set by
//     the first finger of a game (the autopilot's off switch); self.c the generation counter,
//     incremented on every Timer call and NEVER reset; self.g the food walk's seed for this
//     game; self.d the death countdown (nil while alive); self.z the note to release - since
//     change 17B a triple {channel, off-status, number}, so the release leaves on the output that
//     played it.
//   - THREE SETUP LOCALS PUBLISHED ON SELF, read back into Timer locals (`local P,I,F=s.P,s.I,
//     s.F`): a Timer body is a separate chunk, `self.P(...)` would be a field call
//     host-surface.spec.ts refuses, and a GLOBAL function the classifier would refuse too (it
//     admits only host names, library names and locals of the same event). `P(k,r,g,b)` writes
//     the colour to BOTH layers and lifts both phases to 255 (one layer caps at 49.6 per cent);
//     P(k,0,0,0) blacks a cell. `I(s)` is the restart: black all 81 cells, the two-cell snake at
//     39 and 40 travelling right, the food at 41, `s.t` and `s.d` cleared, `s.g=s.c`. The Setup
//     runs it once (`self.c=0` first), so the board is cleared at install. `F(s,n)` places the
//     next food: the first free cell computed first as the fallback, then the walk
//     `w=(w*7+23+s.g)%81` from the food just eaten, re-rolled while it lands on the body or the
//     new head `n`, BOUNDED BY THE LITERAL 12. With `s.g` 0 the walk is the pre-change one.
//   - The handler: `if e==3 or e>=5 and e<9 then return end`; `s.t=1`; the touch cell through
//     the library's calibrated `N(x,y)` (12.1's map; the raw `x*9//128` was one cell out near
//     the edges); the direction is the dominant axis of (touch cell minus head cell); a
//     horizontal steer is accepted only while s.u is 0 and a vertical one only while s.v is 0,
//     so a reversal is refused by construction. Every sample re-steers; a still finger sends no
//     sample (the firmware's change gate) and the direction stays; the lift changes nothing.
//   - The Timer, `gtt(0,@SPEED)` first (the handler runs inside a pcall): the counter; the
//     pending note released; while s.d the countdown - blacks at 3, `I(s)` at 0, nothing else;
//     the autopilot only while s.t is nil - turn onto the food's row when travelling
//     horizontally and its column when travelling vertically (one floored subtraction, one
//     sign, the PERPENDICULAR axis only, so it never reverses). THE STEP IS TWO SIGNED FIELDS,
//     NOT ONE SIGNED INDEX: n = (h//9 + s.v) % 9 * 9 + (h%9 + s.u) % 9, both floor-moduli, so
//     -1 % 9 is 8 and the snake wraps on both axes. If s.o[n]: death - the low note, every
//     occupied cell painted @FOODC (the flash, one bounded pass), `s.d=6`. Else advance the
//     head; on the food, grow, `F(s,n)`, the bite's note; otherwise black the vacated tail in
//     the same pass as the head is painted. Three cells a generation, never a full repaint.
//   - THE DEATH SEQUENCE, in generations: the death call paints the flash; two more calls
//     hold it; the third blacks the board; two calls dark; the sixth restarts. 1.32 s at the
//     default 220 ms, 0.66 s at 110, 1.8 s at 300.
//
// WHAT IT SENDS (two outputs since change 17B, each Note or CC; `T*3//2-88` is the note-off 128,
// or the controller again at 0)
//   Bite   s:gms(@CH,@TYPE,m,100), m = (@NOTE+s.l%12)%128 - a chromatic octave climbing with the
//          length from the Bite's Number (the wrap keeps a top Number inside seven bits)
//   Death  s:gms(@DCH,@DT,@DN,110) - its own Number since 17B, 36 by default: the old @NOTE-12, an
//          octave below anything a bite reaches at the defaults
//   off    s:gms(z[1],z[2],z[3],0) on the NEXT Timer call, before anything else - the triple in s.z
//          (RADAR POINTS's pending-list shape, one note deep: a bite and a death are mutually
//          exclusive, so one note is ever pending). Nothing hangs; one note-on per bite, ever.
//   At most two messages a generation (an off and an on), far under the 256-byte per-cycle
//   protocol buffer (about eighteen 14-byte voice messages). At the defaults the wire is the
//   first game's as before, tick for tick (lua-smoke.spec.ts holds the old entry's sequence).
// WHAT IT RECEIVES (change 17B): nothing. The notes are a game's events - a bite, a death - and
//   hold no value a received note could set; the Setup assigns `self.midirx_cb=nil`. The latch:
//   one control, the steer - a finger re-steering from wherever it is IS the game.
//
// TRAPS
//   - EVERY LOOP IS BOUNDED BY A LITERAL (0..80 four times, 39..40, 1..12); no while, no
//     repeat. DO NOT REMOVE A BOUND: an unbounded loop inside a Timer hangs the port task
//     forever with the watchdog's panic disabled, and the only recovery is a power cycle. The
//     flash walks 0..80 and tests s.o[k], never the ring buffer (its stale slots) and never a
//     bound of s.l.
//   - NO math.random: the firmware VM's generator is weakly seeded on ESP-IDF and the golden
//     frames at ticks 0, 37, 101, 500, 1009 need determinism. The variety between games is
//     `s.g`, the generation count at the restart, folded into the walk. Every operation is
//     integer.
//   - EVERY DIVISION AND MODULO IS FLOORED: h//9, h%9, n//9, n%9, s.f//9, s.f%9, s.l%12,
//     (s.p+1)%81, (s.p-s.l)%81, (w*7+23+s.g)%81.
//   - @SPEED APPEARS IN BOTH EVENTS and both must move together.
//   - EVENT CODES: the guard is `e==3 or e>=5 and e<9 then return`, so a code-9 tap steers and
//     so do moves; e == 5 is never tested on its own. A refused steer (a reversal, the axis
//     already travelled) still sets s.t: a finger that touched the game owns it.
//   - MOVING INTO THE CELL THE TAIL IS ABOUT TO VACATE COUNTS AS DEATH: the occupancy table is
//     read before the tail is released - a rule, one cell stricter than the arcade's.
//   - THE NOTE RANGE: a bite tops at 72 + 11 = 83, a death bottoms at 36 - 12 = 24.
//   - NO KEEPER AND NO DECAY ANYWHERE; glp is never called with a negative phase.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @SNAKEC and @FOODC is 0..255, and
//     all values are nine characters (the Setup's three token sites and the Timer's three are
//     what put the corner at +6 and +7 over the defaults, with @CH's 15 the Timer's seventh).
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//   - THE RESIDUE PROBE (lua-smoke.spec.ts) CANNOT SEE THIS CARD: every cell is at phase 255
//     from the Setup's clear, black or coloured, so its untouched run never holds a phase 0.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import {
  CHANNEL_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end local function I(s)for k=0,80 do P(k,0,0,0)end s.b={}s.o={}s.p=1 s.l=2 s.u=1 s.v=0 s.f=41 s.t=nil s.d=nil s.g=s.c for k=39,40 do s.b[k-39]=k s.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)end local function F(s,n)local g=0 for k=0,80 do if k~=n and not s.o[k]then g=k break end end local w=s.f for _=1,12 do w=(w*7+23+s.g)%81 if w~=n and not s.o[w]then g=w break end end s.f=g P(g,@FOODC)end self.P=P self.I=I self.F=F self.c=0 I(self)self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then return end s.t=1 local h=s.b[s.p]local n=N(x,y)local c=n%9-h%9 local r=n//9-h//9 local m=c<0 and -c or c local w=r<0 and -r or r if m>w then if s.u==0 then s.u=c>0 and 1 or -1 s.v=0 end elseif w>0 then if s.v==0 then s.v=r>0 and 1 or -1 s.u=0 end end end self.midirx_cb=nil gtt(0,@SPEED)";

const TIMER =
  "--[[@cb]]gtt(0,@SPEED)local s=self local P,I,F=s.P,s.I,s.F s.c=s.c+1 local z=s.z if z then s:gms(z[1],z[2],z[3],0)s.z=nil end local d=s.d if d then d=d-1 s.d=d if d==3 then for k=0,80 do P(k,0,0,0)end elseif d==0 then I(s)end return end local h=s.b[s.p]if not s.t then local o=s.u~=0 local d=o and s.f//9-h//9 or s.f%9-h%9 if d~=0 then d=d>0 and 1 or -1 if o then s.v=d s.u=0 else s.u=d s.v=0 end end end local n=(h//9+s.v)%9*9+(h%9+s.u)%9 if s.o[n]then s:gms(@DCH,@DT,@DN,110)s.z={@DCH,@DT*3//2-88,@DN}for k=0,80 do if s.o[k]then P(k,@FOODC)end end s.d=6 return end s.p=(s.p+1)%81 if n==s.f then s.l=s.l+1 F(s,n)local m=(@NOTE+s.l%12)%128 s:gms(@CH,@TYPE,m,100)s.z={@CH,@TYPE*3//2-88,m}else local t=s.b[(s.p-s.l)%81]s.o[t]=nil P(t,0,0,0)end s.b[s.p]=n s.o[n]=1 P(n,@SNAKEC)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SNAKE: CatalogEntry = {
  id: "snake",
  name: "Snake",
  description:
    "Snake on eighty-one lights: steer with a finger, eat, grow, and hear a note for every bite.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["play", "playable", "generative"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @SPEED,
  // @SNAKEC, @FOODC, @NOTE, @CH is a prefix of another.
  knobs: [
    {
      id: "speed",
      label: "Step time (ms)",
      kind: "speed",
      token: "@SPEED",
      // Milliseconds a generation lasts. APPEARS IN BOTH EVENTS and both must move together.
      // 110 is eleven ticks, as fast as a 100 Hz timer can usefully be steered by a finger.
      // The death sequence is six generations at whichever value is set.
      values: ["300", "220", "160", "110"],
      default: 1,
    },
    {
      id: "body",
      label: "Snake colour",
      kind: "colour",
      token: "@SNAKEC",
      // Painted on BOTH layers (one layer caps at 49.6 per cent). Every channel inside 0..255;
      // all four values nine characters. ONE site in the Setup (the restart) and one in the
      // Timer (the head).
      values: ["0,255,120", "0,200,255", "255,0,255", "255,255,0"],
      default: 0,
    },
    {
      id: "food",
      label: "Food colour",
      kind: "colour",
      token: "@FOODC",
      // Warm against a cool default body: hue is what tells one cell from six. Nine characters
      // each. TWO sites in the Setup (the restart, the placer) and one in the Timer (the death
      // flash paints the whole body in it).
      values: ["255,140,0", "255,0,120", "255,255,0", "120,0,255"],
      default: 0,
    },
    {
      id: "note",
      label: "Bite MIDI note",
      kind: "note",
      token: "@NOTE",
      // The Bite output's Number (change 17B; "Lowest note" before it): a bite plays this plus
      // (length % 12), wrapped inside 0..127. All of 0..127, its four old rungs first so a saved copy
      // keeps its note. The death was this minus twelve until 17B and is its own Number now.
      values: numberValues(["48", "60", "36", "72"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Bite MIDI channel",
      kind: "amount",
      token: "@CH",
      // The Bite output's Channel (change 17B; both notes' before it). ZERO-BASED, the first argument
      // of gms; the rows read 1..16; sixteen since 17B (four before: 0, 1, 9, 15). A note's release
      // reads its channel from the pending triple, so it leaves where its note-on did.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "midiType",
      label: "Bite MIDI type",
      kind: "mode",
      token: "@TYPE",
      // The Bite output's type (change 17B): 144 a note, 176 a controller; its off, a generation
      // later, is @TYPE*3//2-88 (a note-off, or the controller at 0).
      values: TRIGGER_STATUSES,
      default: 0,
    },
    {
      id: "deathType",
      label: "Death MIDI type",
      kind: "mode",
      token: "@DT",
      // The Death output's type (change 17B).
      values: TRIGGER_STATUSES,
      default: 0,
    },
    {
      id: "deathChannel",
      label: "Death MIDI channel",
      kind: "amount",
      token: "@DCH",
      // The Death output's Channel (change 17B), the Bite's by default.
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "deathNote",
      label: "Death MIDI note",
      kind: "note",
      token: "@DN",
      // The Death output's Number (change 17B): 36 by default - the old @NOTE-12 at the default
      // lowest note, an octave below anything a bite reaches.
      values: numberValues(),
      default: 36,
    },
  ],

  // Two outputs (change 17B), both triggers, neither receiving: the Bite (a chromatic climb from
  // its note, one per bite) and the Death (one note when the snake dies). docs/entries/snake.md.
  outputs: [
    {
      id: "bite",
      name: "Bite",
      kind: "trigger",
      tokens: { type: "@TYPE", channel: "@CH", number: "@NOTE" },
    },
    {
      id: "death",
      name: "Death",
      kind: "trigger",
      tokens: { type: "@DT", channel: "@DCH", number: "@DN" },
    },
  ],

  // The same five indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    speed: 1,
    body: 0,
    food: 0,
    note: 0,
    channel: 0,
    midiType: 0,
    deathType: 0,
    deathChannel: 0,
    deathNote: 36,
  },

  // FALSE: a two-cell snake and its food at phase 255 from tick 0. frames.spec.ts test 5.
  restsBlack: false,
};
