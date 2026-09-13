// MORPH - four macros in the corners, one finger between them.
//
// A four-corner macro morph pad: each corner owns one CC, the finger's position is blended
// bilinearly into four weights that sum to the full range, and each 3x3 corner block's
// brightness is its own weight, so the mix reads across a room. A tap inside a corner block
// speaks for that corner alone (MIDI-learn). Single-contact by design; no Timer (`timer: ""`) -
// its only animation is a per-touch decay that dies on its own. Knobs: @TRAILC, @SPREAD (twice
// in the string), @CCB, @DECAY (the trail length; NOT @TRAIL, a prefix of @TRAILC), @CH. Setup
// 814 of 908 at the picker corner (810 at the defaults), Timer 0; restsBlack true.
// History: docs/entries/morph.md (11-02, 11-08, 11-09.1, 12-09, 12.1-04 costings and measurements).
//
// MECHANISM
//   - Setup: layer 2 coloured @TRAILC at phase 0 on every cell (the comet's layer); self.k =
//     {0,6,54,60} the four corner blocks' origin cells, walked as s.k[j]+d%3+d//3*9 for d = 0..8
//     at all three sites (paint, tap test, send loop) - move a corner and all three move; the
//     corner hues are one expression, 255-j*@SPREAD, j*@SPREAD, 128 on layer 1 at phase 0;
//     self.p = {0,0,0,0} the last value sent per corner.
//   - The handler's first line, in this order and each piece measured:
//       if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)
//       if e==3 or e>=5 and e<9 then return end
//     1. the single-contact rule first, so a second finger is refused before Q or G sees it;
//     2. `Q` before `G`, because Q calls E on every onset and E clears the block through V - a G
//        drawn first is wiped on the press that drew it; 3. `G` before the end test so a lift
//        clears the finger (MORPH has no Timer to sweep it); 4. the end test `e==3 or e>=5 and
//        e<9` keeps a code-9 fast tap. MORPH does NOT return on Q's nil: the weights are a blend
//        of the RAW position and keep moving inside one cell; `Q` is called for the trail cell
//        alone, and the comet is armed only when Q returned a cell.
//   - On the onset edge (`e==4 or e>8`) the cell c is tested against the four blocks: q = j if
//     inside corner j, else 0; on a move q is 0 and the full morph runs.
//   - A dead margin remaps the raw axes AFTER Q: x=glim((x-24)*127//79,0,127), the same for y -
//     raw 0..24 reads 0, 103..127 reads 127, so a finger a cell and a half in from a corner reads
//     a full 127 on that macro and exact 0 on the others. The trail cell stays under the finger.
//   - The weights: u = 127-x, v = 127-y, w = {u*v//127, x*v//127, u*y//127, x*y//127}. For each
//     corner j: send only if z ~= s.p[j] and (q<1 or q==j), then s.p[j] = z; the PAINT of the
//     block at phase z*2 is unconditional (the picture is a readout, the wire is traffic).
//   - The comet: when c is a cell, glpfs(a,2,252,256-252//@DECAY,0) and glt(a,2,@DECAY) - the
//     house decay idiom (decay-idiom.spec.ts holds the rule and the usable timeouts). The
//     library's `D` is not used: it covers at most 42 ticks and @DECAY reaches 126.
//
// WHAT IT SENDS
//   s:gms(@CH,176,@CCB+j,z,0) for j = 1..4, only when corner j's weight changed from the last
//   value sent, and on a corner tap only for that corner. A corner at zero that was at zero
//   sends nothing; a corner that falls to zero sends zero once (so a finger can LEAVE a corner).
//   The other three corners' s.p entries are not reset by a tap - the receiver has not heard them.
//
// TRAPS
//   - DO NOT ADD THE STANDARD KEEPER ("for a=0,80 do glt(a,L,65535) end" in a Timer). Applied to
//     layer 2 it is pitfall 1 exactly: the countdown is replaced by 65535, the decay rate keeps
//     decrementing past zero and wraps, and every touched cell strobes forever.
//   - THE DECAY PAIR MUST LAND ON PHASE 0: glpfs walks `pha += fre` on a uint8_t, so the start
//     252 and the step 252//@DECAY reach exactly 0 only when @DECAY is an EXACT DIVISOR of 252.
//     The old 255/250 pair could never land on 0 (odd minus even) and left every crossed cell
//     lit forever. @DECAY's values are 21, 42, 84, 126 for that reason; a stamp encodes the
//     knob's INDEX, so old links still decode.
//   - @SPREAD APPEARS TWICE and both sites must be substituted, or the corners stop being four
//     hues. Every value is at or under 85: corner 3 is handed 255-3*spread, and more would wrap.
//   - THE TOKEN FOR THE TRAIL LENGTH IS @DECAY, NOT @TRAIL: renderLua substitutes by plain
//     string replacement, and "@TRAIL" inside "@TRAILC" would render the colour as "42C".
//   - THE GUARD'S UPPER BOUND IS THE POINT: a bare `e>=5` returns early on a coalesced code-9
//     tap and the macros never move. touch-guard.spec.ts holds the convention.
//   - s.p IS INDEXED BY CORNER, NOT BY CONTACT, which the single-contact rule makes safe; if
//     that guard ever moves, the table's key has to move with it.
//   - @CCB values are at or under 110, so the fourth CC is at most 114 (guaranteed by the values,
//     not by a spec).
//   - The empty Timer needs no special case: compressScript("") is "" and checkSyntax("") is
//     true; gtt is a no-op on the module until the Timer holds an action.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,2,@TRAILC,1)glp(a,2,0)end self.k={0,6,54,60}self.p={0,0,0,0}for j=0,3 do for d=0,8 do local a=glag(0,self.k[j+1]+d%3+d//3*9)glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)glp(a,1,0)end end self.touch_cb=function(s,i,e,x,y)if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)if e==3 or e>=5 and e<9 then return end local q=0 if e==4 or e>8 then for j=1,4 do for d=0,8 do if c==s.k[j]+d%3+d//3*9 then q=j end end end end x=glim((x-24)*127//79,0,127)y=glim((y-24)*127//79,0,127)local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do local z=w[j]if z~=s.p[j]and(q<1 or q==j)then s.p[j]=z s:gms(@CH,176,@CCB+j,z,0)end local b=s.k[j]for d=0,8 do glp(glag(0,b+d%3+d//3*9),1,z*2)end end if c then local a=glag(0,c)glpfs(a,2,252,256-252//@DECAY,0)glt(a,2,@DECAY)end end";

// The Timer is the empty string, written inline: MORPH has no Timer event.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const MORPH: CatalogEntry = {
  id: "morph",
  name: "Morph",
  description:
    "Four macros in the corners; slide between them and each corner’s brightness is its own weight.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["modulation", "expressive", "still"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. hueSpread is "amount", not "colour": its
  // value is the scalar in 255-j*60, j*60, 128, not an RGB triple. MIDI channel and CC number
  // are "amount" because the vendored KnobKind union has no MIDI-destination kind and D-12
  // forbids a HANGAR-local one; every @CH and @CC knob in the catalog does the same.
  knobs: [
    {
      id: "trailColour",
      label: "Trail colour",
      kind: "colour",
      token: "@TRAILC",
      // Layer 2, the comet, and the finger on layer 0. Every channel inside 0..255: the
      // firmware truncates rather than clamps.
      values: [
        "180,255,255",
        "255,255,255",
        "0,200,255",
        "255,180,120",
        "120,255,180",
      ],
      default: 0,
    },
    {
      id: "hueSpread",
      label: "Hue spread",
      kind: "amount",
      token: "@SPREAD",
      // The scalar in the corner-colour arithmetic; APPEARS TWICE in the Setup. At or under 85,
      // because corner 3 is handed 255-3*spread on red (TRAPS above).
      values: ["20", "40", "60", "85"],
      default: 2,
    },
    {
      id: "ccBase",
      label: "CC base",
      kind: "amount",
      token: "@CCB",
      // The four corners send @CCB+1 through @CCB+4 in corner order; every value at or under
      // 110 so the fourth CC is at most 114 - guaranteed by the values, not by a spec.
      values: ["15", "20", "40", "70", "110"],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail length",
      kind: "size",
      token: "@DECAY",
      // Ticks the comet takes to fade. TOKEN IS @DECAY, not @TRAIL (the prefix hazard, TRAPS).
      // EVERY VALUE IS AN EXACT DIVISOR OF 252, or the decay never lands on phase 0.
      values: ["21", "42", "84", "126"],
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, the first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058). One
      // occurrence, inside the loop that sends all four macros.
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
    trailColour: 0,
    hueSpread: 2,
    ccBase: 0,
    trail: 1,
    channel: 0,
  },

  // TRUE: the corner blocks are coloured at Setup but left at phase 0, there is no Timer, so
  // with no finger MORPH is black. frames.spec.ts test 5 checks it.
  restsBlack: true,
};
