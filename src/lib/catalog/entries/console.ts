// CONSOLE - nine strips, and a mute you can tap.
//
// Nine faders side by side, one per column: slide anywhere in a column to set that strip's level
// (eight steps spanning 0..127 exactly), tap the cap at the top of the column to mute it, tap it
// again to put the level back. A muted strip still moves and repaints and sends nothing until
// it is unmuted, when it sends the level it was moved to. Plain controller messages, not Mackie
// Control (bidirectional, and nothing here receives MIDI). No Timer (`timer: ""`, `static`).
// Knobs: @CC (nine adjacent controllers), @CH, @LEVELC, @RAILC, @MUTEC (three sites). Setup 807
// of 908 at the picker corner (784 at the defaults), Timer 0; restsBlack false. Kind "lua":
// `sends.faders` is typed `3 | 4` and the sends sheet has no mute.
// History: docs/entries/console.md (11-07, 12-05, 12-09, 12.1-04 measurements and the three mutes).
//
// MECHANISM
//   - The cell comes from the library: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n
//     then return end local c=n%9 local r=n//9`. `Q` holds the cell with per-axis hysteresis and
//     returns it only on a change or an onset - the live test, the mute row's dedup and the
//     onset expiry are all inside it, so a finger on the line between two columns drives ONE
//     fader and a wobble inside a mute cell toggles once. `G` draws the library's bilinear
//     finger in WHITE on layer 0 (a literal, not a knob - a knob would move the shape character),
//     the one layer `P` never writes; it sits before the `return` so an in-cell slide still
//     moves it and a lift clears it. `Q` before `G` because `Q`'s `E` clears the block through `V`.
//   - THE FADER BODY IS ROWS 1 TO 8, NEVER ROW 0 (the cap): h = 8-r runs 0..7, eight values,
//     stored in self.v[c]; row r is lit when 8-r < h, so h cells light and the row you touch to
//     reach full scale is itself dark (a layout question, not a constant).
//   - self.m[c] is the mute latch. Row 0: toggle it, send the column's controller at 0 or at
//     the REMEMBERED level, repaint. Rows 1..8: `if h~=s.v[c]then s.v[c]=h if not s.m[c]then
//     s:gms(...)end P(s,c)end` - the store and the repaint unconditional, only the send gated.
//   - `P(s,c)` repaints ONE column in ONE PASS, every cell written exactly once, never
//     erase-then-paint (no double buffer; a two-pass repaint can tear). Cap: @MUTEC or @RAILC
//     on both layers at 255. Body, muted: @MUTEC on layer 2 at 90 where lit (the remembered
//     level stays readable). Body, live: @LEVELC on both layers at 255 or 0. The repaint is
//     GATED on a change - DO NOT REMOVE THE GATE.
//   - Setup gives every strip a level of 4 and paints all nine columns (forty-five lit cells).
//   - No `X` (no Timer to sweep from) and no `R` (it holds no note and paints nothing of its
//     own on layer 0): a lost lift costs a stale cell until the next press by that id.
//
// WHAT IT SENDS
//   s:gms(@CH,176,@CC+c,v,0): v = h*127//7 on a level change (0, 18, 36, 54, 72, 90, 108, 127 -
//   THE DIVISOR IS 7 because the mute row owns the top of the travel; //8 topped out at 111);
//   0 on mute; the remembered level on unmute. Nothing while muted.
//
// TRAPS
//   - EVERY DIVISION IS FLOORED: n%9, n//9, *127//7. A fraction reaching a firmware call is 0.
//   - @CC + 8 < 128 AT EVERY KNOB VALUE: the four top out at 24, 56, 88 and 110.
//   - CODE 9 IS HANDLED, AND IT IS THE WHOLE MUTE: `Q` spells the onset `e==4 or e>8` and
//     returns the cell on it, so a fast tap on the cap toggles. touch-guard.spec.ts gates the
//     library string rather than this entry's chain.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of the three colour knobs is 0..255.
//   - NO KEEPER AND NO DECAY: nothing writes glt, glf or glpfs. Count the timeout in the SETUP
//     STRING, not this file.
//   - THE LATCH WARNING: firmware advances prev_* before the writability check, so a dropped
//     release leaves a permanently stuck contact that pad-sim.ts cannot manufacture. A mute
//     that latches on and will not clear is how that would present; docs/HARDWARE-AUDITION.md
//     row 19 is this entry's bench row. A green lua-smoke.spec.ts is not evidence it is safe.
//   - LAYER 0 IS THE ALERT LAYER: `G` re-asserts white on every call, so an alert's recolour
//     heals on the next sample; `glc(...,1)` forces the min to 0.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.v={}self.m={}local function P(s,c)local m=s.m[c]local h=s.v[c]for r=0,8 do local a=glag(0,c+r*9)if r==0 then if m then glc(a,1,@MUTEC,1)glc(a,2,@MUTEC,1)else glc(a,1,@RAILC,1)glc(a,2,@RAILC,1)end glp(a,1,255)glp(a,2,255)elseif m then glc(a,2,@MUTEC,1)glp(a,1,0)glp(a,2,8-r<h and 90 or 0)else glc(a,1,@LEVELC,1)glc(a,2,@LEVELC,1)local p=8-r<h and 255 or 0 glp(a,1,p)glp(a,2,p)end end end for c=0,8 do self.v[c]=4 P(self,c)end self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n then return end local c=n%9 local r=n//9 if r==0 then local m=not s.m[c]s.m[c]=m s:gms(@CH,176,@CC+c,m and 0 or s.v[c]*127//7,0)P(s,c)return end local h=8-r if h~=s.v[c]then s.v[c]=h if not s.m[c]then s:gms(@CH,176,@CC+c,h*127//7,0)end P(s,c)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const CONSOLE: CatalogEntry = {
  id: "console",
  name: "Console",
  description:
    "Nine strips with rails: slide anywhere in a column to set its level, tap the top cell to mute it.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["mixing", "precise", "readable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @CC, @CH,
  // @LEVELC, @RAILC, @MUTEC is a prefix of another.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // Nine adjacent controllers, @CC through @CC + 8, so every value must satisfy
      // @CC + 8 < 128: the four top out at 24, 56, 88 and 110.
      values: ["16", "48", "80", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. Four channels, not sixteen.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
    {
      id: "level",
      label: "Level colour",
      kind: "colour",
      token: "@LEVELC",
      // The lit part of a strip, on layers 1 and 2. Bright: the one thing carrying information.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "rail",
      label: "Rail colour",
      kind: "colour",
      token: "@RAILC",
      // The cap at the top of each column, on layers 1 and 2. Pale: a target, not data.
      values: ["60,60,60", "40,50,60", "60,50,20", "40,40,60"],
      default: 0,
    },
    {
      id: "mute",
      label: "Mute colour",
      kind: "colour",
      token: "@MUTEC",
      // Warm, so a muted strip reads as a warning. APPEARS THREE TIMES: the cap on both layers
      // and the dim body on layer 2 while muted.
      values: ["255,40,0", "255,80,0", "200,0,40", "255,0,0"],
      default: 0,
    },
  ],

  // The same five indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    level: 0,
    rail: 0,
    mute: 0,
  },

  // FALSE: nine caps and nine half-open faders, forty-five lit cells at tick 0.
  // frames.spec.ts test 5 checks it.
  restsBlack: false,
};
