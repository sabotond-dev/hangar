// MORPH - four macros in the corners, one finger between them.
//
// A four-corner macro morph pad: each corner is one MIDI output (change 17B: its own Type,
// Channel, Number and Receive; one CC base before it), the finger's position is blended
// bilinearly into four weights that sum to the full range, each weight is then shaped by the
// @CENTRE knob - the value a corner sends dead centre - and each 3x3 corner block's brightness
// is the value it SENT, so the mix reads across a room. A tap inside a corner block speaks for
// that corner alone (MIDI-learn). Single-contact; its only animation is a per-touch decay that
// dies on its own - the Timer event is PULLED IN by the Setup (`s:tim()`) and never armed (change
// 17B). Knobs: @TRAILC, @SPREAD (twice), @CENTRE (three times), @DECAY (the trail length; NOT
// @TRAIL, a prefix of @TRAILC), and per corner j the block @Tj @CH|@Cj @Nj @Rj (corner 1's
// channel is the old @CH). Setup 786 / Timer 535 of 908 at the picker corner (784 / 527 at the
// defaults); restsBlack true. History: docs/entries/morph.md (11-02, 11-08, 11-09.1, 12-09,
// 12.1-04, change 9, change 17B).
//
// MECHANISM
//   - Setup: `local s,T,C,N=self` (the element as an upvalue, and the three per-corner tables the
//     Timer fills); s.k = {0,6,54,60} the four corner blocks' origin cells, walked as
//     s.k[j]+d%3+d//3*9 for d = 0..8 at every site (paint, tap test, send loop, receive) - move a
//     corner and all move; s.p = {0,0,0,0} the last value sent per corner; the handler; then
//     `s:tim()` and `T,C,N=s.t,s.h,s.n`.
//   - The Timer body, run once by that `s:tim()` (THE PULL-IN: nothing arms it, so the card stays
//     still and dark at rest): layer 2 coloured @TRAILC at phase 0 on every cell (the comet's
//     layer); the corner hues, one expression, 255-j*@SPREAD, j*@SPREAD, 128 on layer 1 at phase
//     0; the four corners' types T, channels C and numbers N as tables, handed to the Setup
//     through `s.t, s.h, s.n`; the receive callback (below).
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
//   - The weights: u = 127-x, v = 127-y, w = {u*v//127, x*v//127, u*y//127, x*y//127}, and they
//     still sum to the full range - @CENTRE shapes what is SENT, never the blend. Per corner:
//       z=z<32 and z*@CENTRE//32 or @CENTRE+(z-32)*(127-@CENTRE)//95
//     two linear segments over the 0..127 weight with the breakpoint at 32, the weight dead
//     centre: 0 stays 0, 127 stays 127, 32 lands on @CENTRE, and the map is monotone at every
//     knob value. AT @CENTRE = 32 IT IS THE EXACT INTEGER IDENTITY (z*32//32 = z and
//     32+(z-32)*95//95 = z), so the card at its defaults sends byte for byte what it sent before
//     change 9 - lua-smoke.spec.ts holds the pinned diagonal against it.
//   - For each corner j: send only if z ~= s.p[j] and (q<1 or q==j), then s.p[j] = z; the PAINT
//     of the block at phase z*2 is unconditional and reads the SHAPED z, so the lights follow
//     what the DAW hears (the picture is a readout, the wire is traffic).
//   - The comet: when c is a cell, glpfs(a,2,252,256-252//@DECAY,0) and glt(a,2,@DECAY) - the
//     house decay idiom (decay-idiom.spec.ts holds the rule and the usable timeouts). The
//     library's `D` is not used: it covers at most 42 ticks and @DECAY reaches 126.
//
// WHAT IT SENDS
//   corner j on its own output: t=T[j], s:gms(C[j],t,t==208 and z or t>223 and 0 or N[j],t==208
//   and 0 or z) - a controller N[j], a pitch bend (0, z), a pressure (z, 0) - for j = 1..4, z the
//   corner's weight through the @CENTRE map, only
//   when that value changed from the last one sent, and on a corner tap only for that corner. A
//   corner at zero that was at zero sends nothing; a corner that falls to zero sends zero once
//   (so a finger can LEAVE a corner), which is also what keeps a @CENTRE of 0 honest - the
//   middle of the pad is silent because every corner has already said 0, not because a value is
//   stuck. The other three corners' s.p entries are not reset by a tap - the receiver has not
//   heard them. At the defaults the corners are 16, 17, 18 and 19 on channel 0 - the old @CCB+j
//   at base 15 - so the card sends what it sent.
// WHAT IT RECEIVES (change 17B; @Rj the header INSTR per corner, 13 On, 0 Off)
//   The host's message on corner j's type, channel and (a controller) number is that corner's
//   value HELD UNTIL THE NEXT TOUCH: s.p[j] takes it (so a finger landing on the same value sends
//   nothing - no echo) and the corner block lights at its phase, z*2, as a sent value does. The
//   next touch recomputes every corner from the finger and takes them back. Nothing is sent. The
//   callback acts only while the touch callback it was made beside is the element's. The latch:
//   one contact and one control (the blend), the corner tap read at the onset - already latched.
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
//   - @CENTRE APPEARS THREE TIMES, once in each segment and once in the second segment's slope,
//     and all three are one token substitution - a partial rewrite gives a map with a step in it.
//   - A @CENTRE OF 0 IS NOT A FALSY ARM. `z<32 and z*0//32 or ...` still takes the first arm,
//     because Lua's only false values are nil and false and 0 is a number. A reader arriving
//     from JavaScript or Python will expect this branch to be broken; it is not.
//   - @CENTRE STOPS AT 96, AND 127 IS REJECTED BY MEASUREMENT: at 127 the second segment is
//     127+(z-32)*0//95, so every weight at or above 32 reads 127 - 33 distinct values over the
//     whole travel against 128 at the default, with a 95-step plateau - and each macro pins full
//     across the quadrant nearest its corner instead of moving. 96 keeps 64 distinct values.
//   - THE BREAKPOINT 32 IS WHAT MAKES THE DEFAULT FREE, and it costs one unit of symmetry: the
//     four raw weights dead centre are 31, 31, 31, 32 (integer division, the card's arithmetic
//     since 11-08), so three corners land on @CENTRE - @CENTRE//32 and the fourth on @CENTRE
//     exactly - 62/62/62/64 at 64, measured in the Lua host, the same one-unit split the card has
//     always had at its centre.
//   - THE TOKEN FOR THE TRAIL LENGTH IS @DECAY, NOT @TRAIL: renderLua substitutes by plain
//     string replacement, and "@TRAIL" inside "@TRAILC" would render the colour as "42C".
//   - THE GUARD'S UPPER BOUND IS THE POINT: a bare `e>=5` returns early on a coalesced code-9
//     tap and the macros never move. touch-guard.spec.ts holds the convention.
//   - s.p IS INDEXED BY CORNER, NOT BY CONTACT, which the single-contact rule makes safe; if
//     that guard ever moves, the table's key has to move with it.
//   - EACH CORNER'S NUMBER IS ITS OWN (0..127) since change 17B; the old @CCB base is gone, and
//     its five values name the top-left corner's first five rungs (16, 21, 41, 71, 111).
//   - THE TIMER IS NEVER ARMED: nothing calls gtt. An armed Timer would make the preview read
//     motion at tick 0; the Setup runs the body itself. Install order matters again (0/6 first).
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
import { onLattice } from "../lattice";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_ON_INDEX,
  RECEIVE_VALUES,
  numberValues,
} from "../../tune/midi";

/**
 * The four corners in the order the Lua walks them (`s.k`: cells 0, 6, 54, 60) - each one MIDI
 * output since change 17B, named by where it is.
 */
const CORNERS = [
  "Top left",
  "Top right",
  "Bottom left",
  "Bottom right",
] as const;

/**
 * Corner j's knobs past the first corner's (change 17B): its Type, Channel, Number and Receive,
 * appended in corner order after the six the card had. The first corner's Channel and Number are
 * the old `channel` and `ccBase` knobs' positions (the stamp's indices land where they were).
 */
function cornerKnobs(j: number): LuaKnob[] {
  const name = CORNERS[j - 1];
  const type: LuaKnob = {
    id: `type${j}`,
    label: `${name} MIDI type`,
    kind: "mode",
    token: `@T${j}`,
    values: CONTINUOUS_STATUSES,
    default: 0,
  };
  const receive: LuaKnob = {
    id: `rx${j}`,
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
      id: `ch${j}`,
      label: `${name} MIDI channel`,
      kind: "amount",
      token: `@C${j}`,
      values: CHANNEL_VALUES,
      default: 0,
    },
    {
      id: `cc${j}`,
      label: `${name} controller`,
      kind: "amount",
      token: `@N${j}`,
      // 16 + j - 1 by default: the old @CCB+j at the default base 15.
      values: numberValues(),
      default: 15 + j,
    },
    receive,
  ];
}

/** Corner j's output: the block of four under its name. */
const cornerOutput = (j: number): MidiOutput => ({
  id: `corner${j}`,
  name: CORNERS[j - 1],
  kind: "continuous",
  tokens: {
    type: `@T${j}`,
    channel: j === 1 ? "@CH" : `@C${j}`,
    number: `@N${j}`,
    receive: `@R${j}`,
  },
});

const SETUP =
  "--[[@cb]]local s,T,C,N=self s.k={0,6,54,60}s.p={0,0,0,0}s.touch_cb=function(s,i,e,x,y)if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)if e==3 or e>=5 and e<9 then return end local q=0 if e==4 or e>8 then for j=1,4 do for d=0,8 do if c==s.k[j]+d%3+d//3*9 then q=j end end end end x=glim((x-24)*127//79,0,127)y=glim((y-24)*127//79,0,127)local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do local z,t=w[j],T[j]z=z<32 and z*@CENTRE//32 or @CENTRE+(z-32)*(127-@CENTRE)//95 if z~=s.p[j]and(q<1 or q==j)then s.p[j]=z s:gms(C[j],t,t==208 and z or t>223 and 0 or N[j],t==208 and 0 or z)end local b=s.k[j]for d=0,8 do glp(glag(0,b+d%3+d//3*9),1,z*2)end end if c then local a=glag(0,c)glpfs(a,2,252,256-252//@DECAY,0)glt(a,2,@DECAY)end end s:tim()T,C,N=s.t,s.h,s.n";

// The Timer is the empty string, written inline: MORPH has no Timer event.
const TIMER =
  "--[[@cb]]local s=self for a=0,80 do glc(a,2,@TRAILC,1)glp(a,2,0)end for j=0,3 do for d=0,8 do local a=glag(0,s.k[j+1]+d%3+d//3*9)glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)glp(a,1,0)end end local k,T,C,N,R=s.touch_cb,{@T1,@T2,@T3,@T4},{@CH,@C2,@C3,@C4},{@N1,@N2,@N3,@N4},{@R1,@R2,@R3,@R4}s.t,s.h,s.n=T,C,N s.midirx_cb=function(s,h,v)if s.touch_cb==k then for j=1,4 do local t=T[j]if h[1]==R[j]and v[2]==t and v[1]==C[j]and(t>207 or v[3]==N[j])then local z=v[t//16%3+2]s.p[j]=z local b=s.k[j]for d=0,8 do glp(glag(0,b+d%3+d//3*9),1,z*2)end end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

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

  // Six knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. hueSpread is "amount", not "colour": its
  // value is the scalar in 255-j*60, j*60, 128, not an RGB triple. MIDI channel and CC number
  // are "amount" because the vendored KnobKind union has no MIDI-destination kind and D-12
  // forbids a HANGAR-local one; every @CH and @CC knob in the catalog does the same. `centre`
  // is APPENDED, the house rule for a new knob (the Phase 11 gate qualifier on TUNE-01).
  knobs: [
    {
      id: "trailColour",
      label: "Trail colour",
      kind: "colour",
      token: "@TRAILC",
      // Layer 2, the comet, and the finger on layer 0. Every channel inside 0..255: the
      // firmware truncates rather than clamps.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice([
        "180,255,255",
        "255,255,255",
        "0,200,255",
        "255,180,120",
        "120,255,180",
      ]),
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
      id: "cc1",
      label: "Top left controller",
      kind: "amount",
      token: "@N1",
      // The top-left corner's Number (change 17B; until then "CC base", the corners sending
      // base+1..base+4): all of 0..127 with the five corner-one controllers the base gave first
      // (16, 21, 41, 71, 111), so a saved copy's index keeps its first corner's controller.
      values: numberValues(["16", "21", "41", "71", "111"]),
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
      label: "Top left MIDI channel",
      kind: "amount",
      token: "@CH",
      // The top-left corner's Channel (change 17B; every corner's before it). ZERO-BASED, the
      // first argument of gms (zona-docs/docs/ZONA_RECIPES.md:1058); the rows read 1..16.
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
    {
      id: "centre",
      label: "Centre",
      kind: "amount",
      token: "@CENTRE",
      // The CC value each corner sends with the finger dead centre (change 9). 32 IS TODAY'S
      // BEHAVIOUR and is the default, so an untouched card is byte-identical on the wire; 127
      // is NOT offered (TRAPS above). "amount" because the vendored KnobKind union has no
      // curve or response kind; five integers render as a five-dot rail with a readout.
      values: ["0", "16", "32", "64", "96"],
      default: 2,
    },
    ...[1, 2, 3, 4].flatMap(cornerKnobs),
  ],

  // Four outputs (change 17B), one per corner, each continuous with its own Type, Channel, Number
  // and Receive - four macros a DAW routes to four different places.
  outputs: [1, 2, 3, 4].map(cornerOutput),

  // The same six indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    trailColour: 0,
    hueSpread: 2,
    cc1: 0,
    trail: 1,
    channel: 0,
    centre: 2,
    // The corners' knobs past the six (change 17B), at their own defaults.
    ...Object.fromEntries(
      [1, 2, 3, 4].flatMap(cornerKnobs).map((knob) => [knob.id, knob.default]),
    ),
  },

  // TRUE: the corner blocks are coloured at Setup but left at phase 0, there is no Timer, so
  // with no finger MORPH is black. frames.spec.ts test 5 checks it.
  restsBlack: true,
};
