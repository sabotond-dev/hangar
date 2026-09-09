// LATTICE - the whole pad is one instrument, tuned in fourths.
//
// An isomorphic note grid: note = base + column + (8 - row) * rowInterval, so
// one step right is a semitone and one step up is a perfect fourth at the
// default. That is the LinnStrument / Push / guitar tuning, and its whole
// argument is that EVERY CHORD SHAPE IS THE SAME SHAPE IN EVERY KEY - learn a
// voicing once and it transposes by moving your hand. 81 cells span four
// octaves, multi-touch, with a per-contact watchdog in the Timer.
//
// THE LOOK IS THE THEORY. Layer 2 is a static three-tone map painted once at
// Setup and never touched again: roots amber, in-scale degrees blue,
// out-of-scale cells nearly black at 0,25,50. Because the layout is isomorphic
// the roots fall into a regular diagonal lattice, so the picture of the scale
// IS the scale. In a rack of animated cards this is the still one, and that is
// deliberate contrast rather than a missing feature.
//
// LATTICE LIGHTS ALL 81 CELLS ON LAYER 2, including the deliberately dim
// out-of-scale ones, which is why restsBlack is false. It is also why the smoke
// gate asks "did anything ever light" rather than budgeting lit cells: a
// lit-cell ceiling would have failed this entry for doing exactly what it is
// designed to do. The pitfall-1 guard is a layer-record signature - a keeper
// timeout together with a fast decay rate - and not a cell count, for the same
// reason. LATTICE writes no glt at all, so it cannot trip it.
//
// @BASE OCCURS TWICE IN THE SETUP and both sites matter: the note table
// (local n=@BASE+...) and the scale-degree test (local p=(n-@BASE)%12) have to
// agree, or the highlight map lights cells that are not the scale it claims.
// Substituting one and not the other compiles, fits the budget and is silently
// wrong on the pad.
//
// THE HONEST LIMIT, for the card copy: two fingers in the same cell clear that
// cell's light when the first one leaves, though the note itself stays correct.
// It is the same known limitation the shipped Nine pads card has, because the
// repaint keys on the cell rather than on a per-cell contact count.
//
// THE GUARD IS "e==3 or e>=5 and e<9", AND THE UPPER BOUND IS THE POINT
// (plan 11-02, class B). Firmware coalesces a sub-cycle press-and-lift into ONE
// message with event code 9 - a down AND an up, no separate DOWN and no
// separate UP. It used to write "e>=5" bare, so a fast tap was read as a
// lift, the press it also carried was thrown away, and a quick stab at a key
// sent NOTHING - 0 MIDI messages against 2 on a slow press. That is the bench
// report "not precise enough" exactly: the card was not imprecise, it was
// ignoring the touch. A tap now sounds the note and the Timer's own
// two-second watchdog releases it, because a coalesced tap brings no lift.
// src/lib/catalog/touch-guard.spec.ts holds the convention and gates it; the
// event table itself lives in src/vendor/botor/pad-sim.ts:228-241 and in
// zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated. +8
// characters.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 623 characters, Timer 171, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the six-knob cross-product is 626 / 172, against a budget of 908 an
// event. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.m={@SCALE}self.n={}self.p={}self.t={}for i=0,80 do local a=glag(0,i)local n=@BASE+i%9+(8-i//9)*@ROW self.n[i]=n local p=(n-@BASE)%12 local q=0 for j=1,7 do if self.m[j]==p then q=1 end end if p==0 then glc(a,2,@ROOTC,1)elseif q>0 then glc(a,2,0,90,160,1)else glc(a,2,0,25,50,1)end glp(a,2,255)glc(a,1,255,255,255,1)glp(a,1,0)end self.touch_cb=function(s,i,e,x,y)s.t[i]=0 local c=x*9//128+y*9//128*9 if e==3 or e>=5 and e<9 then c=nil end local o=s.p[i]if o~=c then if o then s:gms(@CH,128,s.n[o],0,0)glp(glag(0,o),1,0)end if c then s:gms(@CH,144,s.n[c],@VEL,0)glp(glag(0,c),1,255)end s.p[i]=c end end gtt(0,100)";

const TIMER =
  "--[[@cb]]gtt(0,100)local s=self for i,c in pairs(s.p)do local t=(s.t[i]or 0)+1 s.t[i]=t if t>20 then s:gms(@CH,128,s.n[c],0,0)glp(glag(0,c),1,0)s.p[i]=nil s.t[i]=nil end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const LATTICE: CatalogEntry = {
  id: "lattice",
  name: "LATTICE",
  description:
    "The whole pad tuned in fourths, so every chord shape is the same shape in every key.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["keys", "playable", "readable"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs, each one literal token substitution over the vendored compiler's
  // own widget vocabulary (TUNE-01). Every default is the INDEX of the value
  // that reproduces the canonical text.
  knobs: [
    {
      id: "scale",
      label: "Scale",
      kind: "scale",
      token: "@SCALE",
      // The HIGHLIGHT map, not the note map: every cell keeps its chromatic
      // pitch and this only decides which degrees are drawn blue. Seven
      // semitone offsets, and every table here is fourteen characters wide, so
      // the scale costs the budget nothing at any corner.
      values: [
        "0,2,4,5,7,9,11",
        "0,2,3,5,7,8,10",
        "0,2,3,5,7,9,10",
        "0,2,4,5,7,9,10",
        "0,2,4,6,7,9,11",
        "0,1,3,5,7,8,10",
      ],
      default: 0,
    },
    {
      id: "base",
      label: "Root note",
      kind: "note",
      token: "@BASE",
      // The bottom-left cell. THIS TOKEN APPEARS TWICE in the Setup - see the
      // header. Every value is two digits on purpose: a three-digit root would
      // add two characters to the Setup at once and move the measured corner.
      // The top-right cell is base + 8 + 8 * rowInterval, so 60 with fourths
      // reaches 108 and stays inside the MIDI range at every combination.
      values: ["24", "31", "36", "43", "48", "60"],
      default: 2,
    },
    {
      id: "rowInterval",
      label: "Row interval",
      kind: "size",
      token: "@ROW",
      // What makes the layout what it is. 5 is fourths - LinnStrument, Push and
      // the bottom four guitar strings - 4 is major thirds, 3 minor thirds, and
      // 2 turns the whole pad whole-tone. Changing this changes every chord
      // shape on the grid at once, which is the point of an isomorphic layout.
      values: ["5", "3", "4", "2"],
      default: 0,
    },
    {
      id: "rootColour",
      label: "Root colour",
      kind: "colour",
      token: "@ROOTC",
      // Layer 2, the root cells only - the diagonal lattice that makes the
      // layout legible. The in-scale blue and the out-of-scale near-black are
      // fixed, because three tunable tones would be three ways to make the map
      // unreadable. Every channel is inside 0..255: the firmware truncates
      // rather than clamps, so 260 would render as 4.
      values: [
        "255,180,60",
        "255,255,255",
        "255,60,0",
        "0,255,140",
        "255,0,120",
      ],
      default: 0,
    },
    {
      id: "velocity",
      label: "Velocity",
      kind: "amount",
      token: "@VEL",
      // Fixed velocity: the pad reports position, not pressure, so a played
      // note has no dynamic of its own. This is the one place to set it.
      values: ["40", "70", "100", "127"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. It appears twice in the Setup -
      // the note-on and the previous cell's note-off - and once in the Timer's
      // watchdog release, so a held note can never be released on a channel it
      // was not started on.
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
    scale: 0,
    base: 2,
    rowInterval: 0,
    rootColour: 0,
    velocity: 2,
    channel: 0,
  },

  // FALSE. All 81 cells are painted on layer 2 at phase 255 from Setup, so a
  // sampler that never touches the pad still reads the full static map at every
  // tick. frames.spec.ts test 5 turns that declaration into a checked fact.
  restsBlack: false,
};
