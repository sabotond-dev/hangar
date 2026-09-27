// SNAKE - the game, played on eighty-one lights, with a note for every bite.
//
// Steer with a finger, eat, grow, hear a note for every bite. Nobody touching: an autopilot steers
// onto the food, so the card is alive on a browse page and in the OG image; a game's first finger
// switches it off. Death is a flash, a pause and a restart; every game's food walk is seeded by the
// generation count, so the module never replays one short game (change 14). Change 24: Step time
// every 10 ms from 50 to 1000, the death pause a fixed 1.32 s, and ORBIT's clock sync (@SYNC, @DIV).
// Knobs: @SPEED (both events), @SNAKEC, @FOODC, @SYNC (both events), @DIV, the Bite (@TYPE @CH
// @NOTE) and the Death (@DT @DCH @DN). Setup 904 of 908 at the picker corner (894 at the defaults),
// Timer 892 (882); restsBlack false. Kind "lua". History: docs/entries/snake.md.
//
// MECHANISM
//   - self.b is the body as a RING BUFFER of cell indices, self.p the ring slot of the head,
//     self.l the length; self.o an occupancy table keyed by cell (one lookup, no scan); self.u,
//     self.v the direction as a column step and a row step; self.f the food cell; self.t set by
//     the first finger of a game (the autopilot's off switch); self.c the generation counter,
//     incremented on every step and NEVER reset; self.g the food walk's seed for this game;
//     self.d the death countdown (nil while alive); self.z the note to release, a pair's
//     {channel, type, number} (the off computed at release); self.q the clock count and self.r
//     the run flag (External).
//   - THREE SETUP LOCALS PUBLISHED ON SELF, read back into Timer locals (`local P,I,F=s.P,s.I,
//     s.F`): a Timer body is a separate chunk, `self.P(...)` would be a field call
//     host-surface.spec.ts refuses, and a GLOBAL function the classifier would refuse too (it
//     admits only host names, library names and locals of the same event). `P(k,r,g,b)` writes
//     the colour to BOTH layers and lifts both phases to 255 (one layer caps at 49.6 per cent);
//     P(k,0,0,0) blacks a cell. `I(s,q)` blacks all 81 cells and, unless q, restarts: the
//     two-cell snake at 39 and 40 travelling right, the food at 41, `s.t` and `s.d` cleared,
//     `s.q=0`, `s.g=s.c`, and `gtt(0,@SPEED)`. The Setup runs it once (`s.c=0` first), so the
//     board is cleared at install. `F(s)` is the BITE: the length grows, the next food is placed
//     (the first free cell computed first as the fallback, then the walk `w=(w*7+23+s.g)%81`
//     from the food just eaten, re-rolled while it lands on the body - the new head is already in
//     `s.o` - BOUNDED BY THE LITERAL 12; with `s.g` 0 the walk is the pre-change one), and the
//     Bite's note plays.
//   - The handler: `if e==3 or e>4 and e<9 then return end`; `s.t=1`; the touch cell through
//     the library's calibrated `N(x,y)` (12.1's map); the direction is the dominant axis of
//     (touch cell minus head cell), `c*c>r*r`; a horizontal steer is accepted only while s.u is 0
//     and a vertical one only while s.v is 0, so a reversal is refused by construction; the sign
//     is the host's `glim(c,-1,1)`. Every sample re-steers; a still finger sends no sample (the
//     firmware's change gate) and the direction stays; the lift changes nothing.
//   - The Timer, `gtt(0,@SPEED)` first (the handler runs inside a pcall), makes three locals and
//     the clock callback on every call: `u()` releases the pending note; `f()` is ONE STEP - the
//     counter, `u()`, then while s.d the death countdown (below), else the autopilot only while
//     s.t is nil (turn onto the food's row when travelling horizontally and its column when
//     travelling vertically: one floored subtraction, one sign, the PERPENDICULAR axis only, so it
//     never reverses), then the move. THE STEP IS TWO SIGNED FIELDS, NOT ONE SIGNED INDEX: n =
//     (h//9 + s.v) % 9 * 9 + (h%9 + s.u) % 9, both floor-moduli, so -1 % 9 is 8 and the snake
//     wraps on both axes. If s.o[n]: death - the low note, every occupied cell painted @FOODC
//     (the flash), `s.d=6`. Else advance the head (into `s.o` first); on the food `F(s)`,
//     otherwise black the vacated tail. Three cells a step, never a full repaint. The Timer ends
//     `if not @SYNC then f()end`: Internal steps here, External steps nowhere here.
//   - THE CLOCK (change 24; ORBIT's idiom, docs/entries/orbit.md): `grxm(2,@SYNC and 3 or 0)` in
//     the Setup routes MIDIRTM to Lua under External only; `s.rtmrx_cb=function(s,h,b)`
//     (decode.lua:42-44's shape) is made by the Timer, so it reaches `f` and `u` as upvalues:
//     250 Start and 252 Stop release the pending note (`u()`), Start then restarts (`I(s)`: a
//     fresh game from the two-cell snake, the clock count at 0); 250 or 251 sets the run flag, 252
//     clears it (the snake stays where it is); 248 while running steps through `f()` every @DIV
//     clocks (12 / 6 / 3 = an 8th / 16th / 32nd at 24 per quarter), the first clock after Start
//     landing a step. Before the Timer's first call (one Step time after a Store) there is no
//     callback: a Start or a clock inside that period is not seen (ORBIT's first-period caveat).
//   - THE DEATH SEQUENCE (change 24: a FIXED 1.32 s under Internal): the death step paints the
//     flash and re-arms the Timer at 220 ms; every countdown call re-arms 220 again; the third
//     blacks the board (`I(s,true)`), the sixth restarts (`I(s,false)`, whose `gtt(0,@SPEED)`
//     wins). Flash 660 ms, dark 660 ms, at any Step time - the same six 220 ms beats the default
//     always had. Under External the countdown is six STEPS of the clock (the re-arms are inert:
//     the Timer steps nothing), so the game restarts on the DAW's grid and a Stop freezes it too.
//
// WHAT IT SENDS (two outputs since change 17B, each Note or CC; `T*3//2-88` is the note-off 128,
// or the controller again at 0)
//   Bite   s:gms(@CH,@TYPE,m,100), m = (@NOTE+s.l%12)%128 - a chromatic octave climbing with the
//          length from the Bite's Number (the wrap keeps a top Number inside seven bits)
//   Death  s:gms(@DCH,@DT,@DN,110) - its own Number since 17B, 36 by default: the old @NOTE-12, an
//          octave below anything a bite reaches at the defaults
//   off    s:gms(z[1],z[2]*3//2-88,z[3],0) at the NEXT step, before anything else, and on the
//          clock's Start and Stop - the pair in s.z (RADAR POINTS's pending-list shape, one note
//          deep: a bite and a death are mutually exclusive, so one note is ever pending). Nothing
//          hangs; one note-on per bite, ever.
//   At most two messages a step (an off and an on), far under the 256-byte per-cycle protocol
//   buffer (about eighteen 14-byte voice messages). At the defaults the wire is the first game's
//   as before, tick for tick (lua-smoke.spec.ts holds the old entry's sequence).
// WHAT IT RECEIVES (change 17B): no voice MIDI - the notes are a game's events and hold no value a
//   received note could set; the Setup assigns `self.midirx_cb=nil`. The realtime clock under
//   External (above) is a different field, `rtmrx_cb`. The latch: one control, the steer - a
//   finger re-steering from wherever it is IS the game.
//
// TRAPS
//   - EVERY LOOP IS BOUNDED BY A LITERAL (0..80 twice, 39..40, 1..12, 1..2) OR BY THE
//     OCCUPANCY TABLE (the flash's `pairs(s.o)`, at most 81 keys); no while, no repeat. DO NOT
//     REMOVE A BOUND: an unbounded loop inside a Timer hangs the port task forever with the
//     watchdog's panic disabled, and the only recovery is a power cycle. The flash walks s.o,
//     never the ring buffer (its stale slots) and never a bound of s.l.
//   - NO math.random: the firmware VM's generator is weakly seeded on ESP-IDF and the golden
//     frames at ticks 0, 37, 101, 500, 1009 need determinism. The variety between games is
//     `s.g`, the generation count at the restart, folded into the walk. Every operation is
//     integer.
//   - EVERY DIVISION AND MODULO IS FLOORED: h//9, h%9, n//9, n%9, s.f//9, s.f%9, s.l%12,
//     (s.p+1)%81, (s.p-s.l)%81, (w*7+23+s.g)%81, d%3, s.q%@DIV.
//   - @SPEED AND @SYNC APPEAR IN BOTH EVENTS and both must move together. @SPEED is 50..1000 in
//     tens (96 rungs, a wide stamp field); the corner's `1000` is one character over the old
//     `300` in each event.
//   - `grxm(2,mode)` NEEDS A NUMBER (`l_grid_rx_mode`: a nil second argument is #GTV.invalidParams),
//     which is why the Sync literal is a boolean folded to 3 or 0.
//   - 254 (active sensing) MUST NOT RUN THE SNAKE: the run test is `b>249 and b<253`, never `b>249`.
//   - THE PREVIEW HAS NO CLOCK: `sync` declares `previewIndex: 0`, so the browser renders Internal
//     whatever the knob says and the inspector says so; the wire carries the visitor's choice.
//   - EVENT CODES: the guard is `e==3 or e>4 and e<9 then return`, so a code-9 tap steers and
//     so do moves; e == 5 is never tested on its own. A refused steer (a reversal, the axis
//     already travelled) still sets s.t: a finger that touched the game owns it.
//   - MOVING INTO THE CELL THE TAIL IS ABOUT TO VACATE COUNTS AS DEATH: the occupancy table is
//     read before the tail is released - a rule, one cell stricter than the arcade's.
//   - THE NOTE RANGE: a bite tops at 72 + 11 = 83, a death bottoms at 36 - 12 = 24.
//   - NO KEEPER AND NO DECAY ANYWHERE; glp is never called with a negative phase.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @SNAKEC and @FOODC is 0..255, and
//     their own colours are nine characters, the lattice's 5 to 11 (change 19): the Setup's three
//     token sites and the Timer's two put the corner (255,255,255) at +6 and +4 over the
//     defaults; the rest of each event's ten is the two-digit channels, the three-digit Numbers,
//     `1000` and (Timer) Division's `12`.
//   - THE BUDGET IS SPENT: 4 free in the Setup and 16 in the Timer at the corner. A new knob on
//     this card needs a cut first.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//   - THE RESIDUE PROBE (lua-smoke.spec.ts) CANNOT SEE THIS CARD: every cell is at phase 255
//     from the Setup's clear, black or coloured, so its untouched run never holds a phase 0.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local function P(k,r,g,b)local a=glag(0,k)for l=1,2 do glc(a,l,r,g,b,1)glp(a,l,255)end end local function I(s,q)for k=0,80 do P(k,0,0,0)end if q then return end s.b={}s.o={}s.p=1 s.l=2 s.u=1 s.v=0 s.f=41 s.q=0 s.t,s.d=nil s.g=s.c for k=39,40 do s.b[k-39]=k s.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)gtt(0,@SPEED)end local function F(s)s.l=s.l+1 local g=0 for k=0,80 do if not s.o[k]then g=k break end end local w=s.f for _=1,12 do w=(w*7+23+s.g)%81 if not s.o[w]then g=w break end end s.f=g P(g,@FOODC)local m=(@NOTE+s.l%12)%128 s:gms(@CH,@TYPE,m,100)s.z={@CH,@TYPE,m}end local s=self s.P=P s.I=I s.F=F s.c=0 I(s)s.touch_cb=function(s,i,e,x,y)if e==3 or e>4 and e<9 then return end s.t=1 local h,n=s.b[s.p],N(x,y)local c,r=n%9-h%9,n//9-h//9 if c*c>r*r then if s.u==0 then s.u=glim(c,-1,1)s.v=0 end elseif r~=0 and s.v==0 then s.v=glim(r,-1,1)s.u=0 end end s.midirx_cb=nil grxm(2,@SYNC and 3 or 0)";

const TIMER =
  "--[[@cb]]gtt(0,@SPEED)local s=self local P,I,F=s.P,s.I,s.F local function u()local z=s.z if z then s:gms(z[1],z[2]*3//2-88,z[3],0)s.z=nil end end local function f()s.c=s.c+1 u()local d=s.d if d then d=d-1 s.d=d gtt(0,220)if d%3<1 then I(s,d>0)end return end local h=s.b[s.p]if not s.t then local o=s.u~=0 local d=o and s.f//9-h//9 or s.f%9-h%9 if d~=0 then d=glim(d,-1,1)s.u,s.v=o and 0 or d,o and d or 0 end end local n=(h//9+s.v)%9*9+(h%9+s.u)%9 if s.o[n]then s:gms(@DCH,@DT,@DN,110)s.z={@DCH,@DT,@DN}for k in pairs(s.o)do P(k,@FOODC)end s.d=6 gtt(0,220)return end s.p=(s.p+1)%81 s.o[n]=1 if n==s.f then F(s)else local t=s.b[(s.p-s.l)%81]s.o[t]=nil P(t,0,0,0)end s.b[s.p]=n P(n,@SNAKEC)end s.rtmrx_cb=function(s,h,b)if b>249 and b<253 then s.r=b<252 if b~=251 then u()end if b<251 then I(s)end elseif b==248 and s.r then if s.q%@DIV<1 then f()end s.q=s.q+1 end end if not @SYNC then f()end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

/** Change 24: every 10 ms from 50 to 1000, ascending - 96 rungs, 220 at index 17. */
const STEP_TIMES: readonly string[] = Array.from({ length: 96 }, (_, i) =>
  String(50 + 10 * i),
);

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

  // Eleven knobs, each one literal token substitution (TUNE-01; the six lifted for a sync card by
  // change 8's answer 2); every default is the INDEX of the value that reproduces the canonical
  // text. TOKEN PREFIX CHECK: no one of @SPEED, @SNAKEC, @FOODC, @SYNC, @DIV, @NOTE, @CH, @TYPE,
  // @DT, @DCH, @DN is a prefix of another.
  knobs: [
    {
      id: "speed",
      label: "Step time (ms)",
      kind: "speed",
      token: "@SPEED",
      // Milliseconds a step lasts under Internal (ignored under External). APPEARS IN BOTH EVENTS
      // and both must move together. Change 24 (BENCH-2026-09-16.txt section 24): every 10 ms from
      // 50 to 1000, ascending - 96 rungs, a typed value snapping to the nearest ten; 220 (index
      // 17) stays the default, so the first game, frames.json and the OG are unmoved. It was
      // 300 220 160 110, declared descending. The death pause no longer follows it (1.32 s).
      values: STEP_TIMES,
      default: 17,
    },
    {
      id: "body",
      label: "Snake colour",
      kind: "colour",
      token: "@SNAKEC",
      // Painted on BOTH layers (one layer caps at 49.6 per cent). Every channel inside 0..255; its
      // own four nine characters each (the lattice runs 5 to 11, costed at 255,255,255). ONE site
      // in the Setup (the restart) and one in the Timer (the head).
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,255,120", "0,200,255", "255,0,255", "255,255,0"]),
      default: 0,
    },
    {
      id: "food",
      label: "Food colour",
      kind: "colour",
      token: "@FOODC",
      // Warm against a cool default body: hue is what tells one cell from six. Its own four nine
      // characters each. TWO sites in the Setup (the restart, the placer) and one in the Timer (the death
      // flash paints the whole body in it).
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,140,0", "255,0,120", "255,255,0", "120,0,255"]),
      default: 0,
    },
    {
      id: "sync",
      label: "Sync",
      kind: "mode",
      token: "@SYNC",
      // Change 24 (ORBIT's idiom). Internal: the Timer steps at the Step time and MIDIRTM stays
      // unrouted (`grxm(2,0)`). External: `grxm(2,3)` routes the host's realtime bytes to
      // `rtmrx_cb`, which steps every @DIV clocks from Start; the Timer steps nothing. Worded by
      // view.ts's SYNC_WORDS. APPEARS IN BOTH EVENTS. The browser has no clock: the preview
      // renders Internal (`previewIndex`) and says so.
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
      // DIVISION_WORDS. Read under External only (change 24).
      values: ["12", "6", "3"],
      default: 1,
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

  // The same eleven indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    speed: 17,
    body: 0,
    food: 0,
    sync: 0,
    division: 1,
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
