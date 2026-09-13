// QUADRANT - four targets you can hit without looking, and tell apart without colour.
//
// Four 4x4 quadrants and a one-cell dark cross: the largest target a 9x9 pad can offer, each
// with its own colour and its own fill pattern (solid, checker, outline, diagonal - measured as
// patterns before the file was written, as CULL's five were), so a press with the eyes elsewhere
// finds a zone and a colour-blind visitor tells the four apart. The cross sends nothing: a miss
// that fires the wrong note is worse than a miss. A press sends a note and lifts the quadrant's
// brightness; a lift releases it. No Timer: a target found without looking must not move. Knobs:
// @HUE (a flat twelve-number palette), @FILL (twice), @NOTE, @CH. Setup 838 of 908 at the
// all-longest corner (835 at the defaults); restsBlack false. Kind "lua": `sends.grid` has no 2x2.
// History: docs/entries/quadrant.md (09-09's fill measurement, the palette-as-one-knob costing).
//
// MECHANISM
//   - The quadrant of a cell is q = x//5 + y//5*2 (0..3, left-to-right then top-to-bottom); the
//     position inside it is x%5, y%5 (0..3 for both halves). Row 4 and column 4 are unlit.
//   - THE FILLS ARE A MASK TABLE: M holds one SIXTEEN-BIT integer per quadrant, and the cell at
//     (u, v) is lit when (M[q+1] >> v*4+u) % 2 is 1:
//       q0  65535  solid     16 of 16      q1  23130  checker   8 of 16
//       q2  63903  outline   12 of 16      q3  33825  diagonal  4 of 16
//     - four densities as well as four shapes, separable at two metres through a diffuser.
//   - C is a flat twelve-number palette read at i = q*3 (@HUE, or the high-contrast four when
//     @FILL > 1); `@FILL==0` skips the mask. Layer 2 at phase 255 is the resting picture; layer 1
//     carries the SAME colour at phase 0 (black, because glc's sixth argument forces the minimum
//     stop). `B(q,p)` writes phase p to the quadrant's sixteen cells on layer 1, so a press
//     roughly doubles the quadrant's brightness.
//   - The handler: on an end (`e==3 or e>4 and e<9`), if this contact holds a quadrant, the
//     note-off, B(o,0), clear; return. `if e~=4 and e<9 then return end`; c = x*9//128, r =
//     y*9//128; `if c==4 or r==4 then return end`; q = c//5 + r//5*2; the note-on and B(q,255);
//     on a code 9 the note-off and B(q,0) in the same handler, else `s.k[i]=q`. Per-contact state
//     is keyed by id and cleared on an end, so two fingers in two quadrants are two notes.
//
// WHAT IT SENDS
//   note-on   s:gms(@CH,144,@NOTE+q,100,0) on a press inside a quadrant
//   note-off  s:gms(@CH,128,@NOTE+o,0,0) on the lift of the contact that started it, or in the
//             same handler on a coalesced code 9. @CH is at all three gms sites.
//
// TRAPS
//   - THE DEAD CROSS MUST SEND NOTHING - DO NOT "FIX" THE GAP: `if c==4 or r==4 then return end`
//     is the whole reason the targets are hittable blind.
//   - THE BIT TEST IS `(M[q+1] >> v*4+u) % 2`, NOT `& 1` - DO NOT "TIDY" IT: the pinned minifier
//     rewrites `&1` as `& 1`, so a stored `&` is not a fixed point of compressScript. `>>` binds
//     looser than `+` and `*` in Lua, so `v*4+u` needs no parentheses.
//   - @FILL APPEARS TWICE and the two sites answer different questions (`@FILL>1` the palette,
//     `@FILL==0` the mask); substituting one and not the other is silently wrong on the pad.
//     "1" IS THE DEFAULT AND IT IS FILLS ON - the description promises a colour AND a fill.
//   - CODE 9 IS HANDLED, AND IT SENDS BOTH: the note-on, the lift and the note-off in one handler.
//     Onset is `e==4 or e>8`; an end is `e==3 or e>4 and e<9`.
//   - EVERY DIVISION IS FLOORED: x//5, y//5, x%5, y%5, q*3, the B() address arithmetic, x*9//128.
//   - THE NOTE RANGE IS @NOTE..@NOTE+3: 24 to 63.
//   - NO KEEPER AND NO DECAY ANYWHERE: no glt, glf or glpfs at all.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of all five palettes is 0..255, and
//     every @HUE value is EXACTLY 39 characters so the knob's budget contribution is zero.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local C={@HUE}if @FILL>1 then C={255,0,0,128,255,0,0,255,255,128,0,255}end local M={65535,23130,63903,33825}local function B(q,p)for j=0,15 do glp(glag(0,q%2*5+j%4+(q//2*5+j//4)*9),1,p)end end for n=0,80 do local x=n%9 local y=n//9 if x~=4 and y~=4 then local q=x//5+y//5*2 if @FILL==0 or(M[q+1]>>y%5*4+x%5)%2>0 then local a=glag(0,n)local i=q*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1],C[i+2],C[i+3],1)glp(a,1,0)glp(a,2,255)end end end self.k={}self.touch_cb=function(s,i,e,x,y)local o=s.k[i]if e==3 or e>4 and e<9 then if o then s:gms(@CH,128,@NOTE+o,0,0)B(o,0)s.k[i]=nil end return end if e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if c==4 or r==4 then return end local q=c//5+r//5*2 s:gms(@CH,144,@NOTE+q,100,0)B(q,255)if e==9 then s:gms(@CH,128,@NOTE+q,0,0)B(q,0)else s.k[i]=q end end";

const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const QUADRANT: CatalogEntry = {
  id: "quadrant",
  name: "Quadrant",
  description:
    "Four targets big enough to hit without looking, each with its own colour and its own fill.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["pointing", "precise", "readable"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no two of @HUE, @FILL,
  // @NOTE, @CH share a first letter.
  knobs: [
    {
      id: "hue",
      label: "Palette",
      // "mode", NOT "colour": view.ts's widgetFor requires every value of a "colour" knob to be
      // a single RGB triple (knobs.lua.spec.ts, view.spec.ts), and a four-colour palette is
      // four squares, so it renders as a four-position rail.
      kind: "mode",
      token: "@HUE",
      // FOUR COLOURS AS ONE FLAT TWELVE-NUMBER VALUE, read at i = q*3. Every palette is EXACTLY
      // 39 characters, so the knob's budget contribution is zero. Every channel inside 0..255.
      values: [
        "255,140,0,0,200,255,0,255,120,255,0,180",
        "255,90,0,0,180,255,40,255,90,255,10,150",
        "0,255,200,60,120,255,90,0,255,255,200,0",
        "255,255,255,255,80,0,0,200,80,60,90,255",
      ],
      default: 0,
    },
    {
      id: "fill",
      label: "Fills",
      kind: "mode",
      token: "@FILL",
      // "1" IS THE DEFAULT AND IT IS FILLS ON: colour only ("0"), colour and fill ("1"), high
      // contrast ("2", the palette forced to four hues ninety degrees apart). TWICE in the Setup
      // and the two sites answer different questions (TRAPS).
      values: ["0", "1", "2"],
      default: 1,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // The TOP-LEFT quadrant's note; the other three are this plus 1, 2 and 3. Two digits at
      // every position; 24 to 63 across the knob.
      values: ["36", "48", "60", "24"],
      default: 1,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, the first argument of gms. Four channels, not sixteen (9 is the GM drum
      // channel). At all THREE gms sites, so a held note is released on the channel it started on.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    hue: 0,
    fill: 1,
    note: 1,
    channel: 0,
  },

  // FALSE: forty cells on layer 2 at phase 255, none of them ever going out. frames.spec.ts test 5.
  restsBlack: false,
};
