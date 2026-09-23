// QUADRANT - four targets you can hit without looking, and tell apart without colour.
//
// Four 4x4 quadrants and a one-cell dark cross: the largest target a 9x9 pad can offer, each
// with its own colour and its own fill pattern (solid, checker, outline, diagonal - measured as
// patterns before the file was written, as CULL's five were), so a press with the eyes elsewhere
// finds a zone and a colour-blind visitor tells the four apart. The cross sends nothing: a miss
// that fires the wrong note is worse than a miss. A press sends a note and lifts the quadrant's
// brightness; a lift releases it. No running Timer: a target found without looking must not move -
// the Timer event holds the paint and the MIDI receive and is PULLED IN by the Setup's `s:tim()`,
// never armed (change 17B). Knobs: @HUE (a flat twelve-number palette), @FILL (twice), and four MIDI
// outputs, one per quadrant (@Tj, @CH|@Cj, @NOTE|@Nj, @Rj). Setup 537 / Timer 726 of 908 at the
// all-longest corner (537 / 718 at the defaults); restsBlack false. Kind "lua": `sends.grid` has no
// 2x2. History: docs/entries/quadrant.md (09-09's fill measurement, the palette-as-one-knob costing;
// change 17B).
//
// MECHANISM
//   - The quadrant of a cell is q = x//5 + y//5*2 (0..3, left-to-right then top-to-bottom); the
//     position inside it is x%5, y%5 (0..3 for both halves). Row 4 and column 4 are unlit.
//   - THE FILLS ARE A MASK TABLE: M holds one SIXTEEN-BIT integer per quadrant, and the cell at
//     (u, v) is lit when (M[q+1] >> v*4+u) % 2 is 1:
//       q0  65535  solid     16 of 16      q1  23130  checker   8 of 16
//       q2  63903  outline   12 of 16      q3  33825  diagonal  4 of 16
//     - four densities as well as four shapes, separable at two metres through a diffuser.
//   - THE PULL-IN (change 17B): the Setup declares `local s,T,h,N=self`, defines `B` and the
//     handler over them, hands `B` over as `s.b`, calls `s:tim()` - the Timer body runs once,
//     synchronously, arming nothing: it paints the field (so the picture at tick 0 is the one it
//     was), builds the four quadrants' types T, channels h and numbers N and the receive - and
//     then takes `T,h,N=s.t,s.h,s.n`.
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
// WHAT IT SENDS (each quadrant its own output since change 17B, j = q+1)
//   on    s:gms(h[j],T[j],N[j],100) on a press inside a quadrant - a note, or a controller at 100
//   off   s:gms(h[j],T[j]*3//2-88,N[j],0) on the lift of the contact that started it, or in the
//         same handler on a coalesced code 9 - the note-off 128, or the controller at 0.
//   At the defaults the quadrants are 48, 49, 50, 51 on channel 0: the wire QUADRANT sent.
// WHAT IT RECEIVES (change 17B; @Rj the header INSTR per quadrant, 13 On, 0 Off)
//   A host note-on on a quadrant's type, channel and number lights the quadrant as a press does
//   (`B(q,255)`); its note-off - or a note-on at 0, or a controller at 0 - darkens it. Nothing is
//   sent: the Sandbox button's receive. The callback acts only while the touch callback it was
//   made beside is the element's. The latch: a contact keeps the quadrant it pressed (`s.k[i]`,
//   and only an onset picks one) - already latched.
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
//   - EACH QUADRANT'S NUMBER IS ITS OWN (0..127) since change 17B; no arithmetic joins them.
//   - NO KEEPER AND NO DECAY ANYWHERE: no glt, glf or glpfs at all. THE TIMER IS NEVER ARMED.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of all five palettes is 0..255, and
//     every @HUE value is EXACTLY 39 characters so the knob's budget contribution is zero.
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
import {
  CHANNEL_VALUES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

/** The four quadrants in the Lua's order, q = x//5 + y//5*2 - each one MIDI output since change 17B. */
const QUADRANTS = [
  "Top left",
  "Top right",
  "Bottom left",
  "Bottom right",
] as const;

/**
 * Quadrant j's knobs past the four the card had (change 17B): its Type, Channel, Number and
 * Receive, appended in quadrant order. The first quadrant's Channel and Number are the old
 * `channel` and `note` knobs' positions (the stamp's indices land where they were).
 */
function quadrantKnobs(j: number): LuaKnob[] {
  const name = QUADRANTS[j - 1];
  const type: LuaKnob = {
    id: `type${j}`,
    label: `${name} MIDI type`,
    kind: "mode",
    token: `@T${j}`,
    values: TRIGGER_STATUSES,
    default: 0,
  };
  const receive: LuaKnob = {
    id: `receive${j}`,
    label: `${name} MIDI receive`,
    kind: "mode",
    token: `@R${j}`,
    values: RECEIVE_VALUES,
    default: RECEIVE_ON_INDEX,
  };
  if (j === 1) return [type, receive];
  return [
    type,
    {
      id: `channel${j}`,
      label: `${name} MIDI channel`,
      kind: "amount",
      token: `@C${j}`,
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: `note${j}`,
      label: `${name} MIDI note`,
      kind: "note",
      token: `@N${j}`,
      // 48 + j - 1 by default: the old @NOTE+q at the default lowest note.
      values: numberValues(),
      default: 47 + j,
    },
    receive,
  ];
}

/** Quadrant j's output: a trigger - its note on the press, its off on the lift. */
const quadrantOutput = (j: number): MidiOutput => ({
  id: `quadrant${j}`,
  name: QUADRANTS[j - 1],
  kind: "trigger",
  tokens: {
    type: `@T${j}`,
    channel: j === 1 ? "@CH" : `@C${j}`,
    number: j === 1 ? "@NOTE" : `@N${j}`,
    receive: `@R${j}`,
  },
});

const SETUP =
  "--[[@cb]]local s,T,h,N=self local function B(q,p)for j=0,15 do glp(glag(0,q%2*5+j%4+(q//2*5+j//4)*9),1,p)end end s.k={}s.b=B s.touch_cb=function(s,i,e,x,y)local o=s.k[i]if e==3 or e>4 and e<9 then if o then o=o+1 s:gms(h[o],T[o]*3//2-88,N[o],0)B(o-1,0)s.k[i]=nil end return end if e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if c==4 or r==4 then return end local q=c//5+r//5*2 local j=q+1 s:gms(h[j],T[j],N[j],100)B(q,255)if e==9 then s:gms(h[j],T[j]*3//2-88,N[j],0)B(q,0)else s.k[i]=q end end s:tim()T,h,N=s.t,s.h,s.n";

const TIMER =
  "--[[@cb]]local s=self local C={@HUE}if @FILL>1 then C={255,0,0,128,255,0,0,255,255,128,0,255}end local M={65535,23130,63903,33825}for n=0,80 do local x=n%9 local y=n//9 if x~=4 and y~=4 then local q=x//5+y//5*2 if @FILL==0 or(M[q+1]>>y%5*4+x%5)%2>0 then local a=glag(0,n)local i=q*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1],C[i+2],C[i+3],1)glp(a,1,0)glp(a,2,255)end end end local T,h,N,R,B,k={@T1,@T2,@T3,@T4},{@CH,@C2,@C3,@C4},{@NOTE,@N2,@N3,@N4},{@R1,@R2,@R3,@R4},s.b,s.touch_cb s.t,s.h,s.n=T,h,N s.midirx_cb=function(s,e,v)local t,w=v[2],v[4]if t==128 then t,w=144,0 end if s.touch_cb==k then for j=1,4 do if e[1]==R[j]and t==T[j]and v[1]==h[j]and v[3]==N[j]then B(j-1,w>0 and 255 or 0)end end end end";

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
      label: "Top left MIDI note",
      kind: "note",
      token: "@NOTE",
      // The top-left quadrant's Number (change 17B; "Lowest note" before it, the other three this
      // plus 1, 2 and 3): all of 0..127, its four old rungs first so a saved copy keeps its note.
      values: numberValues(["36", "48", "60", "24"]),
      default: 1,
    },
    {
      id: "channel",
      label: "Top left MIDI channel",
      kind: "amount",
      token: "@CH",
      // The top-left quadrant's Channel (change 17B; every quadrant's before it). ZERO-BASED on the
      // wire, the rows read 1..16; sixteen since 17B (four before: 0, 1, 9, 15). A held note is
      // released on its quadrant's channel, read from the same table as its on.
      values: CHANNEL_VALUES,
      default: 0,
    },
    ...[1, 2, 3, 4].flatMap(quadrantKnobs),
  ],

  // Four outputs (change 17B), one per quadrant - four pads, four notes a drum map can name.
  outputs: [1, 2, 3, 4].map(quadrantOutput),

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    hue: 0,
    fill: 1,
    note: 1,
    channel: 0,
    // The quadrants' knobs past the four (change 17B), at their own defaults.
    ...Object.fromEntries(
      [1, 2, 3, 4]
        .flatMap(quadrantKnobs)
        .map((knob) => [knob.id, knob.default]),
    ),
  },

  // FALSE: forty cells on layer 2 at phase 255, none of them ever going out. frames.spec.ts test 5.
  restsBlack: false,
};
