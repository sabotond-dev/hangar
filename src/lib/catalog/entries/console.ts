// CONSOLE - nine strips, and a mute you can tap.
//
// Nine faders side by side, one per column: slide anywhere in a column to set that strip's level
// (eight steps spanning 0..127 exactly), tap the cap at the top of the column to mute it, tap it
// again to put the level back. A muted strip still moves and repaints and sends nothing until
// it is unmuted, when it sends the level it was moved to. Since change 17B the nine are one MIDI
// output, "Faders" (a controller, a pitch bend or a channel pressure per fader), and a DAW that
// sends a fader's message moves that fader. Knobs: @LEVELC, @RAILC, @MUTEC and the Faders' block
// @TYPE @CH @CC @RX. Setup 890 / Timer 240 of 908 at the picker corner (880 / 237 at the
// defaults); restsBlack false. Kind "lua": `sends.faders` is typed `3 | 4` and the sends sheet has
// no mute.
// History: docs/entries/console.md (11-07, 12-05, 12-09, 12.1-04 measurements and the three
// mutes, change 17B).
//
// MECHANISM
//   - The cell comes from the library: `local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n
//     then return end local c,r=n%9,n//9`. `Q` holds the cell with per-axis hysteresis and
//     returns it only on a change or an onset - the live test, the mute row's dedup and the
//     onset expiry are all inside it, so a wobble inside a mute cell toggles once. `G` draws the
//     library's bilinear finger in WHITE on layer 0 (a literal, not a knob - a knob would move
//     the shape character), the one layer `P` never writes; it sits before the `return` so an
//     in-cell slide still moves it and a lift clears it. `Q` before `G` because `Q`'s `E` clears
//     the block through `V`.
//   - THE LATCH (change 17B, BENCH-2026-09-16.txt section 18): on the onset edge (`e==4 or e>8`)
//     `s.o[i]` records what the contact landed on - its column on a fader body, `false` on a cap.
//     A fader contact drives THAT column for the rest of the gesture whatever column the finger
//     reaches (a slide past the strip's edge no longer drives the next fader), its level from
//     the row it is on, `glim(8-r,0,7)`, so the cap row reads as the top of the travel; a cap
//     contact toggles each cap it crosses along the mute row (11-07's swipe, kept) and nothing in
//     the bodies.
//   - THE FADER BODY IS ROWS 1 TO 8: h = 8-r runs 0..7, eight values, stored in self.v[c]; row r
//     is lit when 8-r < h, so h cells light and the row you touch to reach full scale is itself
//     dark (a layout question, not a constant).
//   - self.m[c] is the mute latch. A cap: toggle it, send the column at 0 or at the REMEMBERED
//     level, repaint. A body sample: `if h~=s.v[o]then s.v[o]=h if not s.m[o]then M(...)end
//     P(s,o)end` - the store and the repaint unconditional, only the send gated.
//   - `P(s,c)` repaints ONE column in ONE PASS, every cell written once per layer, never
//     erase-then-paint (no double buffer; a two-pass repaint can tear). Per row, per layer j:
//     cap @MUTEC or @RAILC at 255; body, muted: @MUTEC on layer 2 only, phase 90 on layer 2 where
//     lit and 0 on layer 1 (the remembered level stays readable); body, live: @LEVELC at 255 or 0.
//     The repaint is GATED on a change - DO NOT REMOVE THE GATE.
//   - `M(c,v)` sends fader c's value on the output's type (below). `L(c,h,q)` sets fader c to level
//     h when it moved - stored, sent if `q` and not muted, repainted; the touch passes `q`, the
//     receive does not. Kept as `self.l` for the Timer's callback.
//   - THE SETUP HOLDS ITS ELEMENT AS AN UPVALUE (`local s,t=self,@TYPE`): every function reads `s`
//     and the one @TYPE literal, which is what paid for the latch and the typed send.
//   - Setup gives every strip a level of 4, paints all nine columns (forty-five lit cells) and
//     closes with `s:tim()`: THE TIMER IS PULLED IN, NEVER ARMED - its body runs once inside the
//     Setup and makes the receive callback (below). An armed Timer would make a still card
//     "animated" at tick 0 (frames.json, the listing's motion); the Setup is 890 of 908.
//   - No `X` (the Timer never runs as a Timer) and no `R` (it holds no note and paints nothing of its own
//     on layer 0): a lost lift costs a stale cell until the next press by that id.
//
// WHAT IT SENDS (the Faders output, @TYPE)
//   176  s:gms(@CH,176,(@CC+c)%128,v,0) - fader c on the controller @CC + c.
//   224  s:gms((@CH+c)%16,224,0,v,0) - a pitch bend per fader on its own channel from @CH (the
//        Mackie layout: nine faders on one channel would be one message); 64 is the centre.
//   208  s:gms((@CH+c)%16,208,v,0,0) - a channel pressure per fader, the same channels.
//   v = h*127//7 on a level change (0, 18, 36, 54, 72, 90, 108, 127 - THE DIVISOR IS 7 because
//   the mute row owns the top of the travel; //8 topped out at 111); 0 on mute; the remembered
//   level on unmute. Nothing while muted. `@CH+t//177*c`: t//177 is 0 for a controller, 1 else.
//
// WHAT IT RECEIVES (change 17B, @RX the header INSTR: 13 On, 0 Off)
//   The host's message on the output's type - a controller on @CH numbered @CC..@CC+8, or a
//   pitch bend / channel pressure on channels @CH..@CH+8 - sets that fader's level to the value
//   rounded to the nearest of the eight steps ((w*7+63)//127; w is `v[t//16%3+2]`, a pressure's
//   first data byte and anything else's second) and repaints it (`L` with no send); a muted
//   fader keeps its mute and shows the level dimly, as a finger's move would. Nothing is sent
//   (no echo). The callback acts only while the touch callback it was made beside is the
//   element's (`s.touch_cb==k`): inert after another landing.
//
// TRAPS
//   - EVERY DIVISION IS FLOORED: n%9, n//9, *127//7. A fraction reaching a firmware call is 0.
//   - A DATA BYTE IS SEVEN BITS: (@CC+c)%128 and (@CH+c)%16 wrap rather than overflow.
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
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local s,t=self,@TYPE s.v={}s.m={}s.o={}local function P(c)local m,h=s.m[c],s.v[c]for r=0,8 do local a,l=glag(0,c+r*9),r<1 or 8-r<h for j=1,2 do if m then glc(a,r<1 and j or 2,@MUTEC,1)elseif r<1 then glc(a,j,@RAILC,1)else glc(a,j,@LEVELC,1)end glp(a,j,l and(m and r>0 and(j>1 and 90 or 0)or 255)or 0)end end end local function M(c,v)s:gms((@CH+t//177*c)%16,t,t==208 and v or t>223 and 0 or(@CC+c)%128,t==208 and 0 or v)end local function L(c,h,q)if h~=s.v[c]then s.v[c]=h if q and not s.m[c]then M(c,h*127//7)end P(c)end end s.l=L for c=0,8 do s.v[c]=4 P(c)end s.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n then return end local c,r=n%9,n//9 if e==4 or e>8 then s.o[i]=r>0 and c end local o=s.o[i]if o==false and r<1 then local m=not s.m[c]s.m[c]=m M(c,m and 0 or s.v[c]*127//7)P(c)elseif o then L(o,glim(8-r,0,7),1)end end s:tim()";

const TIMER =
  "--[[@cb]]local s=self local k,l,t=s.touch_cb,s.l,@TYPE s.midirx_cb=function(s,h,v)local c=t>176 and(v[1]-@CH)%16 or(v[3]-@CC)%128 if s.touch_cb==k and h[1]==@RX and v[2]==t and c<9 and(t>176 or v[1]==@CH)then l(c,(v[t//16%3+2]*7+63)//127)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

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

  // Seven knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @CC, @CH,
  // @LEVELC, @RAILC, @MUTEC, @TYPE, @RX is a prefix of another. The Faders output's Type and
  // Receive (change 17B) are appended last, so a record's older indices land on the knobs they
  // were.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // The Faders output's Number (change 17B): the first of nine adjacent controllers, fader c
      // on (@CC + c) % 128 - all of 0..127, the four it offered before (16, 48, 80, 102) first so a
      // saved copy's index keeps its controller; past 119 the bank wraps to 0 rather than send a
      // data byte over 127.
      values: numberValues(["16", "48", "80", "102"]),
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms; the rows read it 1..16 (change 17B). Under a pitch
      // bend or a channel pressure it is the FIRST channel: fader c on (@CH + c) % 16. Sixteen
      // since change 17B (four before: 0, 1, 9, 15 - a saved copy at 9 or 15 reopens on 2 or 3,
      // the sixteen being in order for Same channel for all).
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: "level",
      label: "Level colour",
      kind: "colour",
      token: "@LEVELC",
      // The lit part of a strip, on layers 1 and 2. Bright: the one thing carrying information.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["0,200,255", "255,90,0", "0,255,120", "255,0,180"]),
      default: 0,
    },
    {
      id: "rail",
      label: "Rail colour",
      kind: "colour",
      token: "@RAILC",
      // The cap at the top of each column, on layers 1 and 2. Pale: a target, not data.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["60,60,60", "40,50,60", "60,50,20", "40,40,60"]),
      default: 0,
    },
    {
      id: "mute",
      label: "Mute colour",
      kind: "colour",
      token: "@MUTEC",
      // Warm, so a muted strip reads as a warning. APPEARS ONCE since change 17B: the cap on both
      // layers and the dim body on layer 2 while muted come from one call inside P's layer loop.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,40,0", "255,80,0", "200,0,40", "255,0,0"]),
      default: 0,
    },
    {
      id: "midiType",
      label: "MIDI type",
      kind: "mode",
      token: "@TYPE",
      // The Faders output's type (change 17B): 176 a controller per fader, 224 a pitch bend and
      // 208 a channel pressure per fader on its own channel (the Mackie layout).
      values: CONTINUOUS_STATUSES,
      default: 0,
    },
    {
      id: "midiReceive",
      label: "MIDI receive",
      kind: "mode",
      token: "@RX",
      // The header INSTR the Timer-made callback answers: 13 the host's REPORT (On), 0 (Off).
      values: RECEIVE_VALUES,
      default: RECEIVE_ON_INDEX,
    },
  ],

  // The one output (change 17B): the nine Faders, continuous - one bank, as a DAW maps a mixer.
  outputs: [
    {
      id: "faders",
      name: "Faders",
      kind: "continuous",
      tokens: {
        type: "@TYPE",
        channel: "@CH",
        number: "@CC",
        receive: "@RX",
      },
    },
  ],

  // The same seven indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    level: 0,
    rail: 0,
    mute: 0,
    midiType: 0,
    midiReceive: RECEIVE_ON_INDEX,
  },

  // FALSE: nine caps and nine half-open faders, forty-five lit cells at tick 0.
  // frames.spec.ts test 5 checks it.
  restsBlack: false,
};
