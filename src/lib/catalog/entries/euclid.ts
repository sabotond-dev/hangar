// EUCLID - three Euclidean rings, one polyrhythm. The first configuration
// authored for HANGAR rather than ported from BOTOR's shelf.
//
// Concentric square rings on a 9x9 hold exactly 8, 16 and 24 cells, so three
// tracks of 8, 16 and 24 steps sit on the pad with no rounding at all. Each
// ring's pattern comes from the Bresenham Euclidean test
// (t*k//n ~= (t-1)*k//n) at three, five and seven pulses. Layer 1 holds the
// static pulse markers - 15 of them lit from Setup, which is why restsBlack is
// false - and layer 2 carries a bright head running each ring at its own speed
// with a short decay behind it. The three ring lengths beat against each other
// on a 48-tick cycle. Tapping a cell toggles that step - and so does dragging
// across it, which is a REVERSAL and is recorded as one below.
//
// A SWIPE ARMS EVERY RING CELL IT CROSSES, AND THE ONSET-ONLY GUARD THAT USED
// TO FORBID THAT IS DELIBERATELY REVERSED (plan 11-08). The callback opened
// with "e~=4 and e~=9 then return", so every MOVE was thrown away at the first
// line and a finger drawn across the pad changed the cell it landed on and
// nothing else. Measured through the real Lua host: a 128-sample swipe along
// row 4 changed 0 cells, because the cell that swipe lands on is not on a ring
// at all. That is the bench note "doesn't sense the finger its really difficult
// to add or remove, and you should be able to add by swiping your finger".
//
// ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT, and that is
// what the guard is for. A MOVE arrives every 10 ms, so a finger resting inside
// one cell would toggle that step back and forth at 100 Hz - measured
// unguarded at 209 changes over 209 further samples. self.q[i] remembers the
// CELL the contact last touched and swallows a repeat; the contact-end branch
// clears it so a fresh press on the same cell is not eaten.
//
// THE GUARD IS KEYED ON THE PAD CELL, NOT THE RING POSITION, and it is stored
// BEFORE the self.i[m] lookup rather than after. Both halves matter. self.i
// maps a pad cell to d*32+t and is nil for the centre and the outermost square,
// so a ring position is not a unique name for a place on the pad; and storing
// it before the lookup means a finger that wanders off the ring and comes back
// onto the SAME ring cell arms it again, because it genuinely crossed it twice.
//
// WHAT THE REVERSAL COSTS, said plainly: a swipe that crosses a cell twice
// toggles it twice. That is correct for a toggle and it is NOT what a paint
// gesture does - dragging back over your own stroke erases it. A swipe that
// SET rather than toggled would paint, and it is a different behaviour from the
// one the bench asked for, so it is named here as the open question rather than
// shipped as an interpretation. It is also cheaper: CONSOLE measured the
// set-rather-than-toggle shape at 37 characters less than the dedup in 11-07.
//
// EVERY EVENT IS DEDUPED, AND THE FAST TAP ESCAPES BY STORING NOTHING. The
// store is "s.q[i]=e<9 and m", not the bare "s.q[i]=m" plan 11-08 sketched,
// and the eight characters that costs buy a real fix. Event code 9 is a whole
// contact in ONE message with no lift after it, so the contact-end branch never
// runs for a tap and under the bare store the SECOND fast tap on the same cell
// would find s.q[i] still holding it and be swallowed. Measured on the bare
// shape: three fast taps on one cell read 0 -> 255 -> 255 -> 255, a step that
// can be armed from the pad and never disarmed. "e<9 and m" evaluates to
// false for a tap, and false is never equal to a cell index, so the next tap
// always lands. src/lib/catalog/touch-guard.spec.ts holds the event-code
// convention the clear is written in.
//
// THE TRAIL'S DECAY PAIR IS THE HOUSE IDIOM, AND @TRAIL'S VALUES ARE PART OF
// IT (plan 11-02). The Timer shipped glpfs(a,2,255,250,0) with glt(a,2,@TRAIL),
// and that pair can NEVER land on phase 0 at any value: glpfs walks the phase
// with `pha += fre` on a uint8_t, 255 is odd, the step 256 - 250 = 6 is even,
// so 255 - 6T is odd at every T. Re-choosing @TRAIL could not have fixed it -
// the STARTING PHASE had to move. Every ring cell the head passed over froze
// part-way down and stayed permanently, faintly lit.
//
// It now writes glpfs(a,2,252,256-252//@TRAIL,0), which is the parameterised
// house idiom steps.ts and cull.ts already ship: start at 252, step 252//T, land
// on 252 - T*(252//T) = 0 whenever T is an EXACT DIVISOR of 252. Cost: +8
// characters on the Timer at the defaults, +9 at the all-longest corner.
//
// @TRAIL'S VALUES MOVED WITH IT, AND A SHARED LINK IS THE PRICE. 64, 100 and
// 150 do not divide 252, so they became 63, 84 and 126 - the nearest legal
// value to each, same arity, still ascending, 21 and 42 already legal and
// untouched. A stamp encodes the knob's INDEX, not its value, so every link
// anybody has ever shared still decodes and still restores; a link carrying
// index 3 now renders an 840 ms trail where it used to render a 1000 ms one.
// stamp.spec.ts compares indices and stays green either way, so no test says
// this out loud and this comment does.
//
// AND THE RESIDUE WAS NOT INVISIBLE HERE, contrary to what 11-02 predicted.
// frames.json, which records an UNTOUCHED run, went 111 -> 51 lit bytes at tick
// 500 and 111 -> 45 at tick 1009. Half the pad was permanent glow the Timer put
// there itself.
//
// src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
// list of usable timeouts, and it is CITED here rather than restated.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 786 characters, Timer 226, both fixed
// points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
// GATE READS IS 790 / 230, leaving 118 free, and it is the RGB444 PICKER corner
// (D-06), not the all-longest corner of the declared palettes - since plan
// 10-08 the sweep writes any colour a picker can, and for this entry the two
// corners happen to coincide because @RINGC already declares 255,255,255. Plan
// 11-07 found the two diverging by 21 characters on CONSOLE, so the corner is
// named here rather than left to be inferred. That is what makes
// the budget meter honest, because cost() charges max(compressed, raw) and a
// readable, indented version of this configuration would be charged its raw
// length. src/lib/catalog/lua-entries.sweep.spec.ts asserts all of it, at the
// defaults and across the whole knob cross-product.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,255,90,0,1)glp(a,1,0)glc(a,2,@RINGC,1)glp(a,2,0)end self.c={}self.p={}self.i={}self.q={}local h={@PULSES}for d=1,3 do local n=d*8 local u={}local v={}for t=0,n-1 do local q=t//(d*2)local w=t%(d*2)local a,b if q==0 then a,b=d,w-d elseif q==1 then a,b=d-w,d elseif q==2 then a,b=-d,d-w else a,b=w-d,-d end local m=a+4+(b+4)*9 u[t]=m self.i[m]=d*32+t v[t]=t*h[d]//n~=(t-1)*h[d]//n if v[t]then glp(glag(0,m),1,255)end end self.c[d]=u self.p[d]=v end self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then s.q[i]=nil return end local m=x*9//128+y*9//128*9 if s.q[i]==m then return end s.q[i]=e<9 and m local v=s.i[m]if not v then return end local d=v//32 local t=v%32 s.p[d][t]=not s.p[d][t]glp(glag(0,s.c[d][t]),1,s.p[d][t]and 255 or 0)end gtt(0,@TEMPO)";

const TIMER =
  "--[[@cb]]gtt(0,@TEMPO)local s=self local k=(s.k or 0)%24 s.k=k+1 for d=1,3 do local t=k%(d*8)local a=glag(0,s.c[d][t])glpfs(a,2,252,256-252//@TRAIL,0)glt(a,2,@TRAIL)s:gms(@CH,128,@NOTE+d*2,0,0)if s.p[d][t]then s:gms(@CH,144,@NOTE+d*2,100,0)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const EUCLID: CatalogEntry = {
  id: "euclid",
  name: "EUCLID",
  description:
    "Three Euclidean rings turn at their own speeds and beat against each other; tap a step to change the pattern.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["sequencing", "generative", "playable"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the cap (D-12) - each one literal token substitution over the
  // shared widget vocabulary the compiler-driven cards use (TUNE-01). The
  // default of every knob is the INDEX of the value that reproduces the
  // canonical text, so renderLua at the defaults is the measured 702/226.
  knobs: [
    {
      id: "tempo",
      label: "Tempo",
      kind: "speed",
      token: "@TEMPO",
      // Milliseconds between steps, ordered fast to slow so the display reads
      // naturally as the knob turns.
      values: ["240", "180", "140", "110", "90", "70"],
      default: 3,
    },
    {
      id: "pulses",
      label: "Pulses",
      kind: "count",
      token: "@PULSES",
      // Pulses per ring, inner to outer, over 8, 16 and 24 steps. The three
      // numbers are what make the polyrhythm: 3, 5 and 7 beat on a 48-tick
      // cycle you can hear immediately.
      values: ["3,5,7", "2,3,5", "5,9,13", "3,8,11", "4,8,16", "7,11,17"],
      default: 0,
    },
    {
      id: "ringColour",
      label: "Ring colour",
      kind: "colour",
      token: "@RINGC",
      // The running head's colour on layer 2, as three uint8 channels. Every
      // channel here is inside 0..255 on purpose: the firmware truncates rather
      // than clamps, so 260 would render as 4 and turn a bright cell nearly
      // black with no warning.
      values: [
        "0,200,255",
        "255,90,0",
        "0,255,120",
        "255,255,255",
        "120,0,255",
      ],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail",
      kind: "size",
      token: "@TRAIL",
      // Ticks of decay behind the head, at 10 ms a tick. Never a keeper: this
      // layer carries a decaying trail, and 65535 here would replace the
      // countdown and strobe every touched cell forever.
      //
      // EVERY VALUE IS AN EXACT DIVISOR OF 252, because the emitted rate is
      // 256 - 252//@TRAIL and the phase starts at 252, so the walk lands on
      // exactly 0 only when the division is exact. 64, 100 and 150 were not,
      // and became 63, 84 and 126 in plan 11-02 - see the header for what that
      // does to a link somebody already shared.
      values: ["21", "42", "63", "84", "126"],
      default: 1,
    },
    {
      id: "note",
      label: "Base note",
      kind: "note",
      token: "@NOTE",
      // The three voices send this base plus 2, 4 and 6. At the default 34 that
      // is 36 / 38 / 40 - kick, snare and hat by General MIDI convention.
      values: ["24", "30", "34", "36", "40", "48", "60"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. It is the one MIDI argument
      // position worth writing down in prose, because a channel silently
      // swapped with a command byte produces a configuration that runs clean
      // and plays nothing.
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

  // The same six indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    tempo: 3,
    pulses: 0,
    ringColour: 0,
    trail: 1,
    note: 2,
    channel: 0,
  },

  // Setup lights the 15 generated pulse cells on layer 1, so the card is lit
  // before any finger arrives. frames.spec.ts proves this in both directions.
  restsBlack: false,
};
