// TABLE - the pad draws the wave it is asking for.
//
// Wavetable position across, filter down. Slide left to right and the grid
// redraws itself as the shape you have landed on - saw, triangle, square,
// pulse train - so the position knob stops being a number and becomes a
// picture. Slide up and down inside a shape and the filter moves without the
// plot changing, which is exactly the thing a wavetable synth wants you to feel:
// the shape is where you are, the filter is what you do there.
//
// THE MECHANISM.
//
//   w = x*4//128                    the shape index, 0..3
//   h = the shape's height for column c, closed with glim(h, 0, 8)
//   lit when r + h > 7              i.e. rows 8-h .. 8, filled from the bottom
//
// A lit cell gets @WAVEC on BOTH layers at phase 255 - layers add before the
// single divide by 512, so the plot is essentially the full colour asked for -
// and every other cell gets @BGC on layer 2 alone with layer 1 phased to zero,
// so the plot reads against a field rather than against black. The four heights
// are arithmetic rather than a table:
//
//   0  saw            h = c                        0 1 2 3 4 5 6 7 8
//   1  triangle       h = (4-math.abs(c-4))*2      0 2 4 6 8 6 4 2 0
//   2  square         h = c<4 and 8 or 0           8 8 8 8 0 0 0 0 0
//   3  pulse train    h = c%3*4                    0 4 8 0 4 8 0 4 8
//
// BOTH FORMS WERE MEASURED, AND THE PLAN'S PREDICTION WAS WRONG. A four-by-nine
// literal table - {{0,1,2,...},{...},{...},{...}} plus a two-index read - was
// expected not to fit beside four knobs. It fits easily and it is THREE
// CHARACTERS CHEAPER: 526 at the defaults and 533 at the all-longest corner
// against the arithmetic form's 529 and 536, both far inside 908. So cost did
// not decide it and the header says so. The arithmetic form ships because each
// expression NAMES its shape - a reader sees a triangle in (4-|c-4|)*2 and a
// pulse train in c%3*4 - while 36 literals in a row name nothing, and a fifth
// shape is one elseif rather than nine more numbers.
//
// THE REDRAW IS GATED ON self.w, AND THAT IS NOT AN OPTIMISATION. Firmware
// delivers up to one touch sample per 100 Hz cycle and touch_cb has to stay
// somewhere under a millisecond or the module starts dropping samples; the
// budget is Lua time, not LED writes, which are cheap and flat. Repainting 81
// cells a hundred times a second is 162 glc calls plus 162 glp calls per
// second per cell of the grid, and that is the wrong side of the line. The
// shape index takes four values and changes rarely, so the whole redraw hangs
// off `if w~=s.w`. DO NOT REMOVE IT. Measured: five successive Y-only moves
// leave the rendered frame byte-identical, and a move across a shape boundary
// redraws.
//
// SETUP DRAWS THE PLOT ITSELF, through the same local function the touch
// handler calls, and stores self.w = 0. One definition, two callers, no
// duplicated painting loop - and it is a `local function`, not a method on
// self, because a self: call would have to be one of the nine names the HANGAR
// Lua host registers and this is not one of them.
//
// THE SENDS ARE UNGATED, and that is the point of the split. X goes out on @CC
// and Y on @CC + 1, both 7-bit, on EVERY sample - x*127//128 and y*127//128 -
// so the filter is continuous even though the picture is not. Two control
// messages a cycle is well inside the eighteen-message ceiling.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints all 81 cells: the plot in
// @WAVEC on both layers and the field in @BGC on layer 2. 162 lit bytes at
// tick 0 and at every sampled tick after it, because nothing here moves on its
// own.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE HEIGHT IS CLAMPED WITH glim(h,0,8) and the clamp stays even though
//     all four expressions are already inside 0..8. It is the guard on the next
//     shape somebody adds: a height of 9 writes a cell belonging to no row and
//     a negative one writes a glp with a negative phase, which is pitfall 6.
//   - F2Ieq on every division. x*4//128, x*127//128, y*127//128, c%3 and c+r*9
//     are all integer arithmetic; a fractional argument to a firmware call
//     becomes 0, silently. math.abs preserves Lua's integer subtype and is on
//     the host's allow-list.
//   - THE FIELD BRANCH WRITES glp(a,1,0) RATHER THAN A COLOUR. Layer 1 carries
//     only the plot, so a cell that has just left the plot is darkened by
//     phasing it out, not by repainting it black - which also means the layer's
//     colour is written only where it is needed.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @WAVEC and @BGC value is inside 0..255 by construction.
//   - NO KEEPER AND NO RATE ANYWHERE. Nothing in this entry decays, so there is
//     no countdown for a 65535 to replace and no phase for a uint8 to wrap.
//   - TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @WAVEC,
//     @BGC. @CC and @CH share "@C" and neither is a prefix of the other.
//
// FOUR KNOBS, AND THE FIFTH IS DROPPED ON PURPOSE. An earlier draft carried a
// "Redraw step" knob on a fifth token. It has no home here: the redraw is
// gated on the shape index, which takes four values from X and nothing else, so
// there is no step size for it to be. A token that appears in neither event
// fails lua-entries.sweep.spec.ts's token-liveness check, so the knob would have
// been red on arrival rather than merely useless. If a redraw-rate control is
// ever wanted it is a different mechanism - gating on a quantised Y as well as
// on the shape - and it belongs in a follow-on. Four is inside
// catalog.spec.ts's three-to-six rule and it is one knob less of sweep cost.
//
// TABLE HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION.
// The plot moves only when you do, no layer holds a rate, and there is nothing
// for a Timer to advance - so the Timer is the empty string, the same shape
// MORPH, SLAM, KEYS and GRIDLOCK use. createLuaPadSim maps "" onto undefined
// for the host, and docs/HARDWARE-AUDITION.md row 1's install-order rule
// already carries that exemption. It also makes TABLE one of the phase's still
// cards, which listing.spec.ts's three-motion requirement needs somebody to be.
//
// THE HONEST LIMIT, for the card copy. Two things. NINE COLUMNS OF NINE CELLS
// IS A CARICATURE OF A WAVETABLE, not an oscilloscope: the plot is a shape
// class, not a waveform you could measure. And the pad draws the shape it is
// ASKING FOR, not the one your synth is producing - there is no inbound audio
// and no inbound MIDI in this phase (D-04), so if the receiving instrument maps
// the controller somewhere else, the picture is still the picture.
//
// ROUTE: kind "lua", not kind "state". look.kind is
// "none" | "breathe" | "shimmer" | "scan" | "wave" | "swirl" | "ripple" |
// "drift" | "showpiece" and not one of them is a data plot; sends.kind "xy"
// sends the two axes and paints nothing at all. The plot IS the card, and it is
// outside the vocabulary.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 529 characters, a fixed point of compressScript and
// accepted by checkSyntax. The all-longest corner of the four-knob
// cross-product is 536, leaving 372 free of 908, and the all-shortest corner is
// 527. The Timer is the empty string at every corner, and the empty string is a
// fixed point of compressScript.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local function D(w)for c=0,8 do local h=c if w==1 then h=(4-math.abs(c-4))*2 elseif w==2 then h=c<4 and 8 or 0 elseif w==3 then h=c%3*4 end h=glim(h,0,8)for r=0,8 do local a=glag(0,c+r*9)if r+h>7 then glc(a,1,@WAVEC,1)glp(a,1,255)glc(a,2,@WAVEC,1)glp(a,2,255)else glp(a,1,0)glc(a,2,@BGC,1)glp(a,2,255)end end end end D(0)self.w=0 self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end s:gms(@CH,176,@CC,x*127//128,0)s:gms(@CH,176,@CC+1,y*127//128,0)local w=x*4//128 if w~=s.w then s.w=w D(w)end end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: TABLE has no
// Timer EVENT, and a named constant holding nothing would only invite someone
// to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const TABLE: CatalogEntry = {
  id: "table",
  name: "TABLE",
  description:
    "Slide across to change the wave and down to filter it, and the grid draws the shape you land on.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["wavetable", "sound-design", "xy-control", "gestural"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs - see the header for the fifth, which was dropped on purpose -
  // each one literal token substitution over the vendored compiler's own widget
  // vocabulary (TUNE-01). Every default is the INDEX of the value that
  // reproduces the canonical text.
  knobs: [
    {
      id: "cc",
      label: "First controller",
      kind: "amount",
      token: "@CC",
      // X rides this and Y rides the one above it, so the pair is @CC and
      // @CC + 1. The default is 74, General MIDI's filter cutoff, which puts
      // resonance on 75 next to it; 1 is the modulation wheel, 11 expression
      // and 16 the first general-purpose controller. APPEARS TWICE - once bare
      // and once as the leading term of @CC + 1 - so the two axes can never
      // drift onto unrelated controllers.
      values: ["1", "11", "74", "16"],
      default: 2,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add 16 combinations to the sweep for a choice nobody makes.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
    {
      id: "wave",
      label: "Wave colour",
      kind: "colour",
      token: "@WAVEC",
      // The plot, on BOTH layers at phase 255, which is why it can be this
      // bright: one layer alone can never exceed 254/512 of the value asked
      // for. Every channel is inside 0..255 - the firmware truncates rather
      // than clamps, so 260 would render as 4.
      values: ["0,200,255", "255,180,60", "0,255,120", "255,255,255"],
      default: 0,
    },
    {
      id: "field",
      label: "Field colour",
      kind: "colour",
      token: "@BGC",
      // Everything the plot is not, on layer 2 alone. Deliberately dim: it is
      // the paper the wave is drawn on, and a bright field would flatten the
      // one contrast the card has.
      values: ["0,25,50", "25,0,50", "40,20,0", "20,20,20"],
      default: 0,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 2,
    channel: 0,
    wave: 0,
    field: 0,
  },

  // FALSE. Setup paints all 81 cells - the plot and the field it is read
  // against - so a sampler that never touches the pad reads the default saw at
  // every tick, 162 lit bytes. frames.spec.ts test 5 turns that declaration
  // into a checked fact.
  restsBlack: false,
};
