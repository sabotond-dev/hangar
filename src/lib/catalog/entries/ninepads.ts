// NINE PADS - sixteen (or nine) drum pads drawn on the lights, each one a note, the one you are
// holding lit up; one MIDI output that receives, and a finger keeps the pad it landed on (change
// 17C, 2026-09-23, BENCH-2026-09-16.txt sections 17 and 18).
//
// The ported NINE PADS preset rebuilt by hand, RADAR's route (change 12b, entries/radar.ts), for the
// latch: the compiled preset re-triggered pads under a slide - "legato for free", the compiler's own
// words (`_pad.ts` zones) - and section 18's rule makes every side-by-side control keep the finger
// that landed on it, as CHORUS's pads did at 17B. A wrapped `padsim` card (entries/ported-midi.ts)
// could not show it: the vendored PadSim runs the PadState's pad-under-the-finger rule, so the
// preview would still re-trigger while the module latched. The preset stays on the shelf
// (presets.ts) untouched, reached through `portedEntry("ninepads")`. Setup 749 of 908 at the
// defaults (752 at the RGB444 picker corner and the dearest literals), Timer 759 (764); seven
// knobs, the preset's five first. Off the front door: a Lua card cannot sit in the row
// (front-door.ts). History: docs/entries/ninepads.md.
//
// MECHANISM
//   - The grid, `G` pads a side (`@PADS>9 and 4 or 3`, the Pads knob's 16 or 9), is the compiled
//     preset's arithmetic for both sizes written once: the zone of LED n is `n%9*G//9+n//9*G//9*G`
//     (at 3, `n%9*3//9` IS `n%9//3`). The picture - painted by the Timer body the Setup pulls in -
//     is the compiled one byte for byte: at 4x4 the grid colour on every cell of layer 1 and the
//     sixteen marker cells (odd column, odd row: `c%2*r%2*255`) lit; at 3x3 a checkerboard of the
//     colour and its two-fifths (the compiler's `dim(c,2,5)`), every cell lit; layer 2 the fixed
//     255,136,34 at phase 0. frames.json's `ninepads` block did not move.
//   - `P(z)`, a pad's note: the scale's degree list `S` (the Scale knob's literal - the degrees
//     view.ts already words), `B+12*(z//#S)+S[z%#S+1]`, capped at 127 - the compiler's zoneNotes
//     for every scale, and `B+z` for the chromatic twelve. `L(q,w)` lights zone q's highlight on
//     layer 2: its marker cell at 4x4, its nine cells at 3x3 (the compiler's two repaints).
//   - The callback: the contact's pad is PINNED on its onset (`e==4 or e>8`, or a live sample from
//     a contact with no pin), never re-read from a later sample; a release (`e==3 or e>=5 and
//     e<9`, touch-guard.spec.ts's escaped form) lets it go. `D(s,i,z)` is the compiled body: the
//     pad differs from the last one sent (`s.n[i]`) -> the old one's off, the new one's on, the
//     highlight moved. A FAST TAP (9) plays its pad - the note-on and the note-off in the one
//     callback, `D(s,i,z)` then `D(s,i)`: the compiled preset sent NOTHING on one (lua-smoke.spec.ts
//     PRESET_PARITY_ALLOWANCES, "NINEPADS IS A FINDING, NOT A FIX" - a shape change D-02 did not
//     grant the vendored compiler), and a hand-authored card may make it.
//   - The watchdog, the compiled Timer's: a contact silent for more than 100 Timer runs has its note
//     released. The compiled preset armed its 20 ms Timer at power-on and forever; this card arms
//     it on a live sample when it is not running (`s.w`) and re-arms it only while a contact was
//     held on this run (the run sets `s.w` again as it walks `s.p`), so it lapses when none is,
//     because an armed Timer reads as motion to the preview and the pad rests still (docs/MIDI.md
//     section 6). The Timer's first run is the pull-in (`s:tim()`): it paints the grid and makes
//     the receive, once per install (`s.j`, the touch callback it was made beside).
//
// WHAT IT SENDS (one output, Pads - a bank, the preset's notes knob its Number)
//   Note (default): a note-on at velocity 100 on the pad's note, its note-off (128, 0) on the pad
//   left or the release. CC: the pad's note number as a controller at 100, and 0 as its off (17B's
//   gate). `@T*3//2-88` is the off's status: 128 under a note, 176 under a controller. At the
//   defaults the preset's wire exactly: notes 36..51 chromatic on channel 1 (wire 0).
// WHAT IT RECEIVES (@RX the header INSTR, 13 On, 0 Off)
//   A host note-on on the output's channel whose number is a pad's note lights that pad's highlight;
//   its note-off (or a note-on at 0) darkens it; under CC a controller of a pad's number, above 0 on
//   and 0 off. Nothing is sent back, and a pad's own notes echoed back light and darken it as the
//   finger did.
// THE LATCH (section 18): a finger keeps the pad it landed on until it lifts - a slide across pads
//   plays nothing new. Two fingers on two pads play two notes.
//
// TRAPS
//   - `s.q` AND `s.l` CARRY `P` AND `L` TO THE TIMER (a field READ into a local,
//     host-surface.spec.ts's rule); `s.n`, `s.p`, `s.z`, `s.w`, `s.j` are the card's other fields.
//   - THE PADS KNOB AND THE CHANNEL / TYPE / BASE APPEAR IN BOTH EVENTS - one substitution each.
//   - `C` IS A PALETTE (brightness.ts ENTRY_SITES): the grid colour and its two-fifths are read
//     through it, so the brightness scales the constructor and the forms follow.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import {
  CHANNEL_VALUES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  TRIGGER_STATUSES,
  numberValues,
} from "../../tune/midi";

const SETUP =
  "--[[@cb]]local s,S,G,B=self,{@SCALE},@PADS>9 and 4 or 3,@BASE local function P(z)return math.min(B+12*(z//#S)+S[z%#S+1],127)end local function L(q,w)for m=0,80 do if m%9*G//9+m//9*G//9*G==q and(G<4 or m%9%2*(m//9)%2>0)then glp(glag(0,m),2,w)end end end local function D(s,i,z)local o=s.n[i]if o~=z then if o then s:gms(@CH,@T*3//2-88,P(o),0)L(o,0)end if z then s:gms(@CH,@T,P(z),100)L(z,255)end s.n[i]=z end end s.n={}s.p={}s.z={}s.q=P s.l=L s.touch_cb=function(s,i,e,x,y)local z=s.z[i]if e==4 or e>8 or not z then local n=N(x,y)z=n%9*G//9+n//9*G//9*G s.z[i]=z end if e==3 or e>=5 and e<9 then z=nil end D(s,i,z)if e>8 then D(s,i)end if z and e<9 then s.p[i]=0 if not s.w then s.w=1 gtt(0,20)end else s.p[i]=nil s.z[i]=nil end end s:tim()";

const TIMER =
  "--[[@cb]]local s=self local P,L,G=s.q,s.l,@PADS>9 and 4 or 3 if s.j~=s.touch_cb then s.j=s.touch_cb local C={@COL}for n=0,80 do local a,c,r=glag(0,n),n%9,n//9 if G>3 then glc(a,1,C[1],C[2],C[3],1)glp(a,1,c%2*r%2*255)else if(c//3+r//3)%2==0 then glc(a,1,C[1],C[2],C[3],1)else glc(a,1,C[1]*2//5,C[2]*2//5,C[3]*2//5,1)end glp(a,1,255)end glc(a,2,255,136,34,1)glp(a,2,0)end local k=s.j s.midirx_cb=function(s,h,v)local t,w=v[2],v[4]if t==128 then t,w=144,0 end if s.touch_cb==k and h[1]==@RX and v[1]==@CH and t==@T then for q=0,G*G-1 do if P(q)==v[3]then L(q,w>0 and 255 or 0)end end end end end s.w=nil for i,t in pairs(s.p)do s.w=1 s.p[i]=t+1 if t>100 then if s.n[i]then s:gms(@CH,@T*3//2-88,P(s.n[i]),0)s.n[i]=nil end s.p[i]=nil end end if s.w then gtt(0,20)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

/**
 * The scales as their degree lists - the literal the Lua reads, which view.ts's SCALE_WORDS words
 * (Chromatic, Major, Minor, Major pentatonic) - in the preset's Scale order, chromatic first.
 */
const SCALES: readonly string[] = [
  "0,1,2,3,4,5,6,7,8,9,10,11",
  "0,2,4,5,7,9,11",
  "0,2,3,5,7,8,10",
  "0,2,4,7,9",
];

const KNOBS: CatalogEntry["knobs"] = [
  // The preset's five, by id and in their order, so a saved copy's positions keep landing on them.
  {
    id: "colour",
    label: "Pad colour",
    kind: "colour",
    token: "@COL",
    // Layer 1, the grid. The preset's 0,68,204 first; the held pad's 255,136,34 is fixed.
    values: ["0,68,204", "255,68,0", "0,204,102", "204,0,204", "255,255,255"],
    default: 0,
  },
  {
    id: "notes",
    label: "Pads MIDI note",
    kind: "note",
    token: "@BASE",
    // The Pads output's Number: the lowest pad's note. The preset's four octaves of C first.
    values: numberValues(["24", "36", "48", "60"]),
    default: 1,
  },
  {
    id: "scale",
    label: "Scale",
    kind: "scale",
    token: "@SCALE",
    values: SCALES,
    default: 0,
  },
  {
    id: "channel",
    label: "Pads MIDI channel",
    kind: "amount",
    token: "@CH",
    // The preset's 1..16 are the wire's 0..15, index for index; read 1..16 on the panel.
    values: CHANNEL_VALUES,
    default: 0,
  },
  {
    id: "grid",
    label: "Pads",
    kind: "count",
    token: "@PADS",
    // The number of pads, as the preset's knob words it: 9 is 3x3, 16 is 4x4.
    values: ["9", "16"],
    default: 1,
  },
  {
    id: "midiType",
    label: "Pads MIDI type",
    kind: "mode",
    token: "@T",
    values: TRIGGER_STATUSES,
    default: 0,
  },
  {
    id: "midiReceive",
    label: "Pads MIDI receive",
    kind: "mode",
    token: "@RX",
    values: RECEIVE_VALUES,
    default: RECEIVE_ON_INDEX,
  },
];

export const NINEPADS: CatalogEntry = {
  id: "ninepads",
  name: "Nine pads",
  description:
    "Sixteen drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
  // D-10: the ported card's three, unchanged, so the FEELS histogram moves by zero.
  tags: ["play", "playable", "readable"],
  featured: true,
  // The rebuild's date (RADAR's precedent, change 12b), so the card sorts newest.
  addedAt: "2026-09-23",
  source: SOURCE,
  preview: previewFor(SOURCE),
  knobs: KNOBS,
  // One output, a bank (17B's CONSOLE shape for a set of like controls under one base): the pads'
  // notes are the scale laid from the Number up, so a per-pad Number would fight the Scale knob.
  outputs: [
    {
      id: "pads",
      name: "Pads",
      kind: "trigger",
      tokens: {
        type: "@T",
        channel: "@CH",
        number: "@BASE",
        receive: "@RX",
      },
    },
  ],
  defaults: Object.fromEntries(KNOBS.map((knob) => [knob.id, knob.default])),
  // FALSE from tick 0: the grid is lit by the Setup's pull-in.
  restsBlack: false,
};
