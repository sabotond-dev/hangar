// SNAKE - the game, played on eighty-one lights, with a note for every bite.
//
// Steer with a finger, eat, grow, and hear a note for every bite. Let go and the snake carries
// on playing by itself (an autopilot steers it onto the food), so the card is alive on a browse
// page with nobody in front of it. The board is a torus; death is a deterministic reset to a
// two-cell snake at cells 39 and 40, so the shelf plays the same short game over and over and
// the golden frames are reproducible. No random source anywhere (lua-entries.sweep.spec.ts
// test 4 refuses it). Knobs: @SPEED (both events), @SNAKEC, @FOODC, @NOTE, @CH. Setup 585 of
// 908 at the picker corner (581 at the defaults), Timer 880 (870; TWENTY-EIGHT free); restsBlack
// false. Kind "lua": PadState has no state machine. At most one MIDI message per generation.
// History: docs/entries/snake.md (09-08 authoring, the deferred bench note, 11-16's corner sweep).
//
// MECHANISM
//   - self.b is the body as a RING BUFFER of cell indices, self.p the ring slot of the head,
//     self.l the length; self.o an occupancy table keyed by cell (one lookup, no scan); self.u,
//     self.v the direction as a column step and a row step; self.f the food cell; self.t how
//     many more generations a hand still has control for. Setup: the two-cell snake, the food
//     at 41, `gtt(0,@SPEED)`.
//   - `P(k,r,g,b)` writes the colour to BOTH layers and lifts both phases to 255 (one layer caps
//     at 49.6 per cent); P(k,0,0,0) blacks a cell. Declared in the Setup AND in the Timer: a
//     Timer body is a separate chunk, and `self.P(...)` would be a field call host-surface.spec.ts
//     refuses.
//   - The handler: `if e==3 or e>=5 and e<9 then return end`; `s.t=3`; the direction is the
//     dominant axis of (touch cell minus head cell); a horizontal steer is accepted only while
//     s.u is 0 and a vertical one only while s.v is 0, so a reversal is refused by construction.
//     Touch enqueue is change-gated, so a moving finger keeps control and a still one hands the
//     snake back after three generations.
//   - The Timer, `gtt(0,@SPEED)` first (the handler runs inside a pcall): while s.t > 0 spend the
//     credit, else the autopilot turns onto the food's row when travelling horizontally and its
//     column when travelling vertically - one floored subtraction, one sign, the PERPENDICULAR
//     axis only, so it never reverses. THE STEP IS TWO SIGNED FIELDS, NOT ONE SIGNED INDEX:
//     n = (h//9 + s.v) % 9 * 9 + (h%9 + s.u) % 9, both floor-moduli, so -1 % 9 is 8 and the
//     snake wraps on both axes (a signed index step cannot: (-1)//9 is -1). If s.o[n]: death -
//     the low note, all 81 cells blacked in one bounded pass, the reset. Else advance the head;
//     on the food, grow, place the next food by g = (g*7+23)%81 re-rolled while it lands on the
//     body or the new head, BOUNDED BY THE LITERAL 12, with a first-free-cell pass over 0..80
//     computed first as the fallback, and play the bite; otherwise black the vacated tail in the
//     same pass as the head is painted. Three cells a generation, never a full repaint.
//
// WHAT IT SENDS
//   bite   s:gms(@CH,144,@NOTE+s.l%12,100,0) - a chromatic octave climbing with the length
//   death  s:gms(@CH,144,@NOTE-12,110,0) - an octave below anything a bite can reach
//   No note-offs; a bite and a death are mutually exclusive, so at most one message per
//   generation - one every eleven 10 ms cycles at the fastest @SPEED, far under the 256-byte
//   per-cycle protocol buffer (about eighteen 14-byte voice messages).
//
// TRAPS
//   - EVERY LOOP IS BOUNDED BY A LITERAL (39..40, 0..80 three times, 1..12); no while, no
//     repeat. DO NOT REMOVE A BOUND: an unbounded loop inside a Timer hangs the port task
//     forever with the watchdog's panic disabled, and the only recovery is a power cycle.
//   - NO math.random: the firmware VM's generator is weakly seeded on ESP-IDF and the golden
//     frames at ticks 0, 37, 101, 500, 1009 need determinism. Every operation is integer.
//   - EVERY DIVISION AND MODULO IS FLOORED: h//9, h%9, s.f//9, s.f%9, s.l%12, (s.p+1)%81,
//     (s.p-s.l)%81, (w*7+23)%81, x*9//128.
//   - @SPEED APPEARS IN BOTH EVENTS and both must move together.
//   - EVENT CODES: the guard is `e==3 or e>=5 and e<9 then return`, so a code-9 tap steers and
//     so do moves; e == 5 is never tested on its own.
//   - MOVING INTO THE CELL THE TAIL IS ABOUT TO VACATE COUNTS AS DEATH: the occupancy table is
//     read before the tail is released - a rule, one cell stricter than the arcade's.
//   - THE NOTE RANGE: a bite tops at 72 + 11 = 83, a death bottoms at 36 - 12 = 24.
//   - NO KEEPER AND NO DECAY ANYWHERE; glp is never called with a negative phase.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @SNAKEC and @FOODC is 0..255, and
//     all values are nine characters (the Timer's four token sites are what put the corner at
//     +8 over the defaults).
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end self.b={}self.o={}self.p=1 self.l=2 self.u=1 self.v=0 self.f=41 self.t=0 for k=39,40 do self.b[k-39]=k self.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then return end s.t=3 local h=s.b[s.p]local c=x*9//128-h%9 local r=y*9//128-h//9 local m=c<0 and -c or c local w=r<0 and -r or r if m>w then if s.u==0 then s.u=c>0 and 1 or -1 s.v=0 end elseif w>0 then if s.v==0 then s.v=r>0 and 1 or -1 s.u=0 end end end gtt(0,@SPEED)";

const TIMER =
  "--[[@cb]]gtt(0,@SPEED)local s=self local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)glp(a,1,255)glp(a,2,255)end local h=s.b[s.p]local o=s.u~=0 if s.t>0 then s.t=s.t-1 else local d=o and s.f//9-h//9 or s.f%9-h%9 if d~=0 then d=d>0 and 1 or -1 if o then s.v=d s.u=0 else s.u=d s.v=0 end end end local n=(h//9+s.v)%9*9+(h%9+s.u)%9 if s.o[n]then s:gms(@CH,144,@NOTE-12,110,0)for k=0,80 do P(k,0,0,0)end s.o={}s.b={}s.p=1 s.l=2 s.u=1 s.v=0 s.f=41 for k=39,40 do s.b[k-39]=k s.o[k]=1 P(k,@SNAKEC)end P(41,@FOODC)return end s.p=(s.p+1)%81 if n==s.f then s.l=s.l+1 local g=0 for k=0,80 do if k~=n and not s.o[k]then g=k break end end local w=s.f for _=1,12 do w=(w*7+23)%81 if w~=n and not s.o[w]then g=w break end end s.f=g P(g,@FOODC)s:gms(@CH,144,@NOTE+s.l%12,100,0)else local t=s.b[(s.p-s.l)%81]s.o[t]=nil P(t,0,0,0)end s.b[s.p]=n s.o[n]=1 P(n,@SNAKEC)";

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
      label: "Step time",
      kind: "speed",
      token: "@SPEED",
      // Milliseconds a generation lasts. APPEARS IN BOTH EVENTS and both must move together.
      // 110 is eleven ticks, as fast as a 100 Hz timer can usefully be steered by a finger.
      values: ["300", "220", "160", "110"],
      default: 1,
    },
    {
      id: "body",
      label: "Snake colour",
      kind: "colour",
      token: "@SNAKEC",
      // Painted on BOTH layers (one layer caps at 49.6 per cent). Every channel inside 0..255;
      // all four values nine characters, which keeps the Timer's corner two over its defaults.
      values: ["0,255,120", "0,200,255", "255,0,255", "255,255,0"],
      default: 0,
    },
    {
      id: "food",
      label: "Food colour",
      kind: "colour",
      token: "@FOODC",
      // Warm against a cool default body: hue is what tells one cell from six. Nine characters
      // each, for the same corner reason.
      values: ["255,140,0", "255,0,120", "255,255,0", "120,0,255"],
      default: 0,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // A bite plays this plus (length % 12), a death this minus twelve: 83 at the top, 24 at
      // the bottom across the four values.
      values: ["48", "60", "36", "72"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. Four channels, not sixteen. TWICE in the Timer,
      // the bite and the death.
      values: ["0", "1", "9", "15"],
      default: 0,
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
  },

  // FALSE: a two-cell snake and its food at phase 255 from tick 0. frames.spec.ts test 5.
  restsBlack: false,
};
