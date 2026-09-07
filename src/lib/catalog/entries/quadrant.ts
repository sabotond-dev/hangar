// QUADRANT - four targets you can hit without looking, and tell apart without
// colour.
//
// The thesis is a hand, not a picture. Four zones over eighty-one cells is the
// largest target a 9x9 pad can offer, and a target that large is one you press
// with your eyes somewhere else. So the whole card is built around two
// questions a photograph cannot answer: is the zone big enough to hit blind,
// and is it distinguishable to somebody who cannot rely on hue. The second one
// was MEASURED before this file was written - the four fills are reduced to a
// single channel and compared as patterns, exactly as CULL's five were - and
// the measurement is in 09-09-SUMMARY.md. A card that claims shape and ships
// two identical fills is worse than one that claims only colour.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - FOUR 4x4 QUADRANTS AND A ONE-CELL DARK CROSS. Row 4 and column 4 are
//     unlit and send nothing. The quadrant of a cell is q = x//5 + y//5*2,
//     which is 0 for x,y < 5 and 1 for x,y > 4 in each axis - one floored
//     division per axis rather than a pair of comparisons, and it lands on
//     0,1,2,3 reading left-to-right then top-to-bottom. The cell's position
//     INSIDE its quadrant is x%5, y%5, which is 0..3 for both halves because 5
//     and 6 and 7 and 8 reduce to 0 and 1 and 2 and 3.
//   - THE DEAD BAND IS THE POINT, NOT DECORATION. The cross is what makes the
//     four targets hittable without looking: a finger that lands between two
//     zones sends nothing at all rather than sending the wrong one, and a miss
//     that fires the wrong note is worse than a miss. It costs nine cells of
//     the eighty-one and it buys the whole claim on the card.
//   - THE FILLS ARE A MASK TABLE, not a chain of predicates - the shape CULL
//     established. M holds one SIXTEEN-BIT integer per quadrant; the cell at
//     (u, v) inside a quadrant is lit when (M[q+1] >> v*4+u) % 2 is 1. Four
//     integers is four literals, the drawing is one loop, and the geometry is
//     auditable as data:
//
//       q0  65535  ####  solid       16 of 16 cells
//                  ####
//                  ####
//                  ####
//       q1  23130  .#.#  checker      8 of 16
//                  #.#.
//                  .#.#
//                  #.#.
//       q2  63903  ####  outline     12 of 16
//                  #..#
//                  #..#
//                  ####
//       q3  33825  #...  diagonal     4 of 16
//                  .#..
//                  ..#.
//                  ...#
//
//     Sixteen, eight, twelve and four lit cells - four different densities as
//     well as four different shapes, which is what makes them separable at two
//     metres through a diffuser and not only under a pixel comparison.
//   - THE COLOUR COMES FROM A FLAT TWELVE-NUMBER PALETTE read at i = q*3, and
//     both layers get it. Layer 2 sits at phase 255 and is the resting picture;
//     layer 1 carries the SAME colour at phase 0, which is black, because the
//     sixth argument of glc forces the layer's minimum stop black. A press
//     lifts layer 1 to 255 and the pressed quadrant roughly doubles in
//     brightness.
//   - @FILL HAS THREE POSITIONS AND THE MIDDLE ONE IS THE DEFAULT. "1" is
//     fills on, "0" is colour only, "2" is high contrast - fills on with the
//     palette forced to four hues 90 degrees apart. The numbers are not in
//     prose order on purpose: the default index is 1 and the description this
//     card ships promises a colour AND a fill, so the value at index 1 has to
//     be the one that draws fills. A declaration must never be aspirational.
//   - timer is "". Nothing animates, and that is a design decision: a browse
//     page of thirty-six cards needs its still ones, and a target you are
//     supposed to find without looking must not move.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints forty of the eighty-one
// cells - 16 + 8 + 12 + 4 - on layer 2 at phase 255, and none of them ever goes
// out. The card arrives as four readable targets rather than as a black square.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - EVERY DIVISION IS FLOORED. The quadrant index, the in-quadrant position,
//     the palette index, the B() address arithmetic and both coordinate
//     divisions x*9//128 and y*9//128 are all `//` or `%`; a fractional
//     argument to a firmware call is silently zeroed by the F2Ieq rule.
//   - THE DEAD CROSS MUST SEND NOTHING - DO NOT "FIX" THE GAP. `if c==4 or
//     r==4 then return end` is the whole reason the targets are hittable
//     blind. Removing it makes the picture no better and makes every near-miss
//     fire a note.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of all five
//     palettes - the four selectable ones and the high-contrast override - is
//     inside 0..255, checked value by value. 260 would render as 4.
//   - CODE 9 IS HANDLED, AND IT SENDS BOTH. A fast press-and-lift arrives as
//     one message with no separate DOWN or UP, so the code-9 branch issues the
//     note-on, lifts the quadrant, and then issues the note-off and drops it
//     again in the same handler. Onset is `e == 4 or e > 8`; an end is
//     `e == 3 or e > 4 and e < 9`.
//   - THE BIT TEST IS `(M[q+1] >> v*4+u) % 2`, NOT `& 1` - DO NOT "TIDY" IT.
//     The pinned minifier rewrites `&1` as `& 1`, so a stored `&` is not a
//     fixed point of compressScript and the canonical-form gate goes red;
//     `>>` survives untouched. `>>` also binds looser than `+` and `*` in Lua,
//     which is why `v*4+u` needs no parentheses of its own.
//   - THE NOTE RANGE IS @NOTE .. @NOTE + 3, so the top is 60 + 3 = 63 and the
//     bottom is 24, both well inside 0..127.
//   - NO KEEPER AND NO DECAY ANYWHERE. This entry writes no glt, no glf and no
//     glpfs at all, so pitfall 1 is unreachable rather than merely avoided.
//   - PER-CONTACT STATE IS KEYED BY id AND CLEARED ON AN END. self.k[i] holds
//     the quadrant a contact pressed, so a lift releases the note it started
//     and never a different one, and two fingers in two quadrants are two
//     independent notes.
//
// THE HONEST LIMIT, for the card copy. Four zones is the whole point, so
// nothing here is fine control: this pad has four values and no more, and a
// finger that wants a fifth has to go somewhere else. And the dividing cross is
// a deliberate dead band rather than a gap in the picture - a press that lands
// on it is a press that goes nowhere, on purpose.
//
// ROUTE: kind "lua", not kind "state", and this is the shortest route note in
// the phase. `sends.grid` is `3x3 | 4x4 | 9x9` (_pad.ts). THERE IS NO 2x2.
// Four zones is outside the sheet's vocabulary by arithmetic, not by taste, and
// nothing about the fills or the dead cross even gets a chance to matter.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 835 characters, no Timer, a fixed point of
// compressScript and accepted by checkSyntax. The all-longest corner of the
// four-knob cross-product is 838, leaving 70 free of 908, and the all-shortest
// corner is 835. src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of
// those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local C={@HUE}if @FILL>1 then C={255,0,0,128,255,0,0,255,255,128,0,255}end local M={65535,23130,63903,33825}local function B(q,p)for j=0,15 do glp(glag(0,q%2*5+j%4+(q//2*5+j//4)*9),1,p)end end for n=0,80 do local x=n%9 local y=n//9 if x~=4 and y~=4 then local q=x//5+y//5*2 if @FILL==0 or(M[q+1]>>y%5*4+x%5)%2>0 then local a=glag(0,n)local i=q*3 glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1],C[i+2],C[i+3],1)glp(a,1,0)glp(a,2,255)end end end self.k={}self.touch_cb=function(s,i,e,x,y)local o=s.k[i]if e==3 or e>4 and e<9 then if o then s:gms(@CH,128,@NOTE+o,0,0)B(o,0)s.k[i]=nil end return end if e~=4 and e<9 then return end local c=x*9//128 local r=y*9//128 if c==4 or r==4 then return end local q=c//5+r//5*2 s:gms(@CH,144,@NOTE+q,100,0)B(q,255)if e==9 then s:gms(@CH,128,@NOTE+q,0,0)B(q,0)else s.k[i]=q end end";

const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const QUADRANT: CatalogEntry = {
  id: "quadrant",
  name: "QUADRANT",
  description:
    "Four targets big enough to hit without looking, each with its own colour and its own fill.",
  // Feel-based, never a compiler kind (CONT-03). "accessible" arrived with CULL
  // in wave 7 as a singleton and takes its second carrier here, which is what
  // makes it a standing chip.
  tags: ["accessible", "readable", "still", "utility"],
  featured: true,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @HUE, @FILL, @NOTE and
  // @CH. renderLua substitutes by plain String.replaceAll, so a token that is a
  // prefix of another is eaten or corrupted depending on knob order. No one of
  // these four is a prefix of another and no two share a first letter.
  knobs: [
    {
      id: "hue",
      label: "Palette",
      // "mode", NOT "colour", AND THAT IS A MEASURED CONSTRAINT RATHER THAN A
      // preference. src/lib/tune/view.ts's widgetFor requires every value of a
      // "colour" knob to be a single RGB triple, because the swatch row paints
      // one square per value; knobs.lua.spec.ts turns that into a rule -
      // "a colour that reaches a rail is a malformed value set, not a
      // rendering choice" - and view.spec.ts asserts swatchOf and hueName over
      // every colour value in the catalog. A four-colour palette is four
      // squares, so it is not a colour by that vocabulary and it renders as a
      // four-position rail. src/lib/tune/ is not this entry's to edit, so the
      // entry carries the correct kind instead. Recorded in 09-09-SUMMARY.md.
      kind: "mode",
      token: "@HUE",
      // FOUR COLOURS AS ONE FLAT TWELVE-NUMBER VALUE, read at i = q*3. Every
      // palette is EXACTLY 39 characters - twenty-eight digits and eleven
      // commas - which is deliberate and is what keeps this knob's
      // contribution to the budget corner at zero. The measurement that
      // licensed shipping the palette as ONE knob rather than two knobs of two
      // colours each is in 09-09-SUMMARY.md: the all-longest corner is 838 of
      // 908, so there was never a reason to split it.
      //
      // Every channel is inside 0..255: firmware truncates rather than clamps,
      // so 260 would render as 4.
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
      // "1" IS THE DEFAULT AND IT IS FILLS ON. The three positions are colour
      // only ("0"), colour and fill ("1"), and high contrast ("2") - fills on
      // with the palette forced to red, chartreuse, cyan and violet, four hues
      // ninety degrees apart on the wheel. The middle position exists because
      // somebody who does not need the fills should be able to have a cleaner
      // picture; the third exists because "high contrast" is an accessibility
      // setting people look for by name rather than a style.
      //
      // The token appears TWICE in the Setup and the two sites answer different
      // questions - `@FILL>1` picks the palette, `@FILL==0` skips the mask -
      // so substituting one and not the other compiles, fits, and is silently
      // wrong on the pad.
      values: ["0", "1", "2"],
      default: 1,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // The note the TOP-LEFT quadrant sends; the other three are this plus 1,
      // 2 and 3, reading left-to-right then top-to-bottom. Every value is two
      // digits, so this knob costs the budget nothing at any corner, and the
      // top of the range is 60 + 3 = 63 and the bottom is 24 - both inside
      // 0..127 at every position.
      values: ["36", "48", "60", "24"],
      default: 1,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument of self:gms(ch, cmd, p1, p2,
      // mode). Four common channels rather than all sixteen: a sixteen-value
      // channel knob alone would be sixteen of this entry's seventeen sweep
      // combinations, and 10 is the General MIDI drum channel in one-based
      // counting, which is 9 here. The token appears at all THREE gms sites -
      // the note-on, the lift's note-off and the fast tap's note-off - so a
      // held note can never be released on a channel it was not started on.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    hue: 0,
    fill: 1,
    note: 1,
    channel: 0,
  },

  // FALSE. Setup paints forty cells on layer 2 at phase 255 and none of them
  // ever goes out. frames.spec.ts test 5 turns that declaration into a checked
  // fact.
  restsBlack: false,
};
