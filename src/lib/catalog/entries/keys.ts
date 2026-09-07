// KEYS - every note of one key across the pad, and nothing else.
//
// An isomorphic note grid with the wrong notes REMOVED rather than merely
// marked. Roots are painted on both layers and read as bright, the rest of the
// scale sits on one layer at a fifth of that, and everything out of key is not
// painted at all. So a wrong note is not a wrong note you played, it is A CELL
// THAT WAS NEVER THERE - it sends nothing, it lights nothing, and there is no
// way to hit it by accident.
//
// THIS IS NOT LATTICE, AND THE TWO MAKE OPPOSITE ARGUMENTS. LATTICE is
// chromatic and tuned in fourths, and its whole claim is that every chord shape
// is the same shape in every key: it lets you play anything and asks you to
// know the shape. KEYS takes notes away. One teaches a geometry, the other
// removes the need for one, and the two descriptions are written to read as the
// two different arguments they are.
//
// THE MECHANISM.
//
//   note = @BASE + column + (8 - row) * @ROW
//
// for the cell at (column, row), so the layout is isomorphic in the same sense
// LATTICE's is and the row interval is a knob. +y RUNS DOWN on this module
// (ZONA-CAPABILITIES.md section 2.2), so the row term is inverted: without the
// (8 - row) the bottom of the pad would be the bottom of nothing and moving up
// would lower the pitch.
//
// Setup turns @SCALE - seven or five semitone offsets, the same literal
// vocabulary LATTICE and CHORUS already ship - into a twelve-slot lookup in one
// ipairs pass, then walks n = 0..80 once. A cell whose degree is in the lookup
// gets its note stored in self.k[n] AND its light; a cell whose degree is not
// gets neither. self.k IS THE MEMBERSHIP TEST as well as the note map: under a
// finger the whole refusal is `local m=s.k[o]if m==nil then return end`.
//
// EVERY VALUE OF @BASE IS A MULTIPLE OF TWELVE, so note%12 is the degree above
// the root with no subtraction anywhere and degree 0 is the root. The four
// scales, checked against their degree lists before they were written down,
// because a wrong list is a card that plays a scale nobody asked for and no gate
// would notice:
//
//   0,2,4,5,7,9,11   major               41 of 81 cells lit at the defaults
//   0,2,3,5,7,8,10   natural minor       40
//   0,2,4,7,9        major pentatonic    29
//   0,2,4,6,8        whole tone          31
//
// A TWELVE-BIT MASK WAS MEASURED AND REJECTED. The obvious cheaper build is one
// decimal integer per scale - 2741, 1453, 661, 1365 - tested with
// (@SCALE >> note%12) & 1. It works, it is 33 characters cheaper, the bit
// operators survive the pinned minifier and the VM, and it is WRONG HERE: a
// `scale` knob's values are read by src/lib/tune/view.ts's SCALE_WORDS, which
// names semitone sets and knows nothing about masks, so the tune panel would
// render "2741" on a rail instead of "Major". Two shipped gates say so out
// loud - knobs.lua.spec.ts wants a word row and view.spec.ts derives its scale
// vocabulary FROM the catalog. The semitone list is the vocabulary this
// repository already has; the mask would have needed a second one.
//
// THE NOTE RANGE, worked out before the knob values were chosen. The highest
// cell is @BASE + 8 + 8*@ROW, so the largest pair the two knobs can select must
// stay under 128: @BASE tops out at 60 and @ROW at 7, and 60 + 8 + 56 = 124.
// THE ROW INTERVAL IS NOT 12 AND CANNOT BE. Twelve semitones a row spans 8
// octaves plus 8 semitones across nine rows, which forces @BASE under 24 -
// four sensible root notes do not exist under that ceiling, and a nine-column
// octave layout is missing three of its twelve degrees anyway. The fourth value
// is 4, a major third, and the arithmetic holds at every corner.
//
// THE LOOK, and why restsBlack is FALSE. A root gets @ROOTC on BOTH layers at
// phase 255; layers add before the single divide by 512, so a root is
// essentially the full colour asked for. An in-scale degree gets @ROOTC on
// layer 2 alone at PHASE 96 - THE BRIGHTNESS SCALER IS THE PHASE, NOT THE
// COLOUR, because the colour arrives as one knob literal and Lua cannot divide
// its channels without parsing it. Measured on the rendered frame at the
// defaults: red 253, 47 and 0. Three levels, one colour, 141 lit bytes.
//
// LAYER 1 IS ALSO THE TOUCH LIGHT, and that is what pins the layer plan. A
// press writes glp(a,1,255) and a release writes it back to
// s.k[o]%12==0 and 255 or 0 - full for a root, dark for anything else. A root
// is therefore already at phase 255 when it is pressed and shows no change; it
// is already as bright as this pad goes. The in-scale cells, which are the ones
// a player needs help finding, go from 47 to 174.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - F2Ieq on both coordinate divisions. x*9//128 and y*9//128 are floored;
//     a fractional argument to a firmware call becomes 0, silently.
//   - THE RELEASE RESTORES THE MAP, IT DOES NOT WRITE BLACK, and this is
//     do-not-fix. The scale map and the touch light share layer 1. Blacking
//     layer 1 on release would put a permanent hole in the root lattice, and
//     KEYS has no Timer to repaint it - 09-03's HOLD deviation, in the same
//     shape.
//   - THE STORED FORM WRITES `if m[d]then` WITH NO SPACE, and that is the
//     minifier's canonical spelling rather than a typo. Storing the readable
//     `if m[d] then` fails the canonical-form gate on its first run - the same
//     finding STEPS records for `if s.p[n]then` and SONAR for `if s.v[n]then`.
//   - PER-CONTACT STATE IS KEYED BY CONTACT ID. s.c[i] holds the cell that
//     contact is sounding, so two fingers cannot cancel each other's note-off.
//   - CODE 9 IS HANDLED EXPLICITLY. A fast tap arrives as one message with no
//     separate lift, so the handler sends its own note-off immediately and
//     stores nothing. e == 5 appears nowhere; the end branch is e >= 5 and
//     e < 9.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @ROOTC value is inside 0..255 by construction.
//   - TOKEN PREFIX CHECK. @BASE, @ROW, @SCALE, @ROOTC, @CH. @ROW and @ROOTC
//     share "@RO" and neither is a prefix of the other, which is the only pair
//     worth checking here and was checked before a line was written.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE and NO KEEPER IS WRITTEN
//     ANYWHERE. Nothing in this entry decays, so there is no countdown for a
//     65535 to replace.
//
// KEYS HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION. The
// scale map is painted once and never moves, the touch light is written and
// restored by the touch callback itself, and no layer holds a rate. There is
// nothing for a Timer to advance, so the Timer is the empty string, the same
// shape MORPH and SLAM use. createLuaPadSim maps "" onto undefined for the
// host, and docs/HARDWARE-AUDITION.md row 1's install-order rule already
// carries that exemption.
//
// THE HONEST LIMIT, for the card copy. Two things. Two fingers on one cell: the
// light clears when the first one leaves, though the notes themselves stay
// correct - the same documented limitation LATTICE and the shipped Nine pads
// card carry, because the repaint keys on the cell rather than on a per-cell
// contact count. And A SCALE IS A PICTURE, NOT A FILTER. The pad refuses to
// send a wrong note; it cannot stop your host transposing one after it arrives.
//
// ROUTE: kind "lua", not kind "state". sends.scale is read only when
// sends.kind is "zones" and ONLY ON THE 3x3 AND 4x4 GRIDS, and _pad.ts:314-316
// says why in its own words: "an 81-entry table cannot fit the budget and an
// 81-zone scale is not an instrument, so the 9x9 grid stays chromatic." A 9x9
// in-key grid is outside the vocabulary by an explicit compiler decision, and
// it is the whole card.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 644 characters, a fixed point of compressScript and
// accepted by checkSyntax. The all-longest corner of the five-knob
// cross-product is 649, leaving 259 free of 908, and the all-shortest corner is
// 635. The Timer is the empty string at every corner, and the empty string is a
// fixed point of compressScript.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.k={}self.c={}local m={}for _,v in ipairs({@SCALE})do m[v]=1 end for n=0,80 do local p=@BASE+n%9+(8-n//9)*@ROW local d=p%12 if m[d]then self.k[n]=p local a=glag(0,n)glc(a,1,@ROOTC,1)glc(a,2,@ROOTC,1)glp(a,1,d==0 and 255 or 0)glp(a,2,d==0 and 255 or 96)end end self.touch_cb=function(s,i,e,x,y)if e>=5 and e<9 then local o=s.c[i]if o then s:gms(@CH,128,s.k[o],0,0)glp(glag(0,o),1,s.k[o]%12==0 and 255 or 0)s.c[i]=nil end return end if e~=4 and e<9 then return end local o=x*9//128+y*9//128*9 local m=s.k[o]if m==nil then return end s:gms(@CH,144,m,100,0)if e==9 then s:gms(@CH,128,m,0,0)else glp(glag(0,o),1,255)s.c[i]=o end end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: KEYS has no
// Timer EVENT, and a named constant holding nothing would only invite someone
// to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const KEYS: CatalogEntry = {
  id: "keys",
  name: "KEYS",
  description:
    "Every note of one key across the pad: roots bright, the scale dim, and the wrong notes dark.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["harmonic", "in-key", "playable", "readable"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "base",
      label: "Lowest note",
      kind: "note",
      token: "@BASE",
      // The bottom-left cell, and the key. EVERY VALUE IS A MULTIPLE OF TWELVE
      // on purpose: the degree test is note%12, so a C-rooted base makes offset
      // 0 the root with no subtraction anywhere. The largest value is 60 and
      // the widest row interval is 7, so the top-right cell is
      // 60 + 8 + 56 = 124 and every combination stays inside the MIDI range.
      values: ["36", "48", "24", "60"],
      default: 0,
    },
    {
      id: "row",
      label: "Row interval",
      kind: "size",
      token: "@ROW",
      // Semitones per row, and what makes the layout what it is. 5 is fourths
      // (LinnStrument, Push, the bottom four guitar strings), 7 is fifths, 3
      // minor thirds and 4 major thirds. NOT 12: an octave a row spans 104
      // semitones over nine rows, which would force @BASE under 24 and leave
      // three degrees of every octave off the pad. See the header.
      values: ["3", "5", "7", "4"],
      default: 1,
    },
    {
      id: "scale",
      label: "Scale",
      kind: "scale",
      token: "@SCALE",
      // Semitone offsets above the root, the SAME LITERAL VOCABULARY LATTICE
      // and CHORUS ship - and that is not a style choice. src/lib/tune/view.ts's
      // SCALE_WORDS turns exactly these strings into "Major", "Minor", "Major
      // pentatonic" and "Whole tone" on the tune panel; anything outside it
      // renders as a numbered rail. A twelve-bit mask was measured, is 33
      // characters cheaper, and was rejected for that reason - see the header.
      values: ["0,2,4,5,7,9,11", "0,2,3,5,7,8,10", "0,2,4,7,9", "0,2,4,6,8"],
      default: 0,
    },
    {
      id: "root",
      label: "Root colour",
      kind: "colour",
      token: "@ROOTC",
      // ONE COLOUR FOR THE WHOLE MAP, and the three brightness levels come from
      // the phase rather than from three colours: 255 on both layers for a
      // root, 96 on layer 2 alone for the rest of the scale, nothing at all out
      // of key. Every channel is inside 0..255 - the firmware truncates rather
      // than clamps, so 260 would render as 4.
      values: ["255,180,60", "255,255,255", "0,200,255", "255,60,0"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add 16 combinations to the sweep for a choice nobody makes. It
      // appears three times: the note-on, the fast tap's own note-off and the
      // release, so a note can never be released on a channel it was not
      // played on.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    base: 0,
    row: 1,
    scale: 0,
    root: 0,
    channel: 0,
  },

  // FALSE. Setup lights every in-scale cell and never moves it, so a sampler
  // that never touches the pad reads the full static map at every tick - 141
  // lit bytes at the defaults. frames.spec.ts test 5 turns that declaration
  // into a checked fact.
  restsBlack: false,
};
