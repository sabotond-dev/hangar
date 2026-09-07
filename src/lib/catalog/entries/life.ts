// LIFE - Conway's Game of Life on a nine by nine torus, seeded by tapping.
//
// Tap to seed it and the pattern plays itself out in light and notes. A glider
// is already running when the card loads, so there is something to watch before
// anybody arrives, and the entry re-seeds itself rather than dying quietly on a
// browse page.
//
// THE MECHANISM, and its 9x9 arithmetic. self.g is the current generation, an
// eighty-one entry table of 0 or 1; self.h is the next one. self.i and self.j
// are the two most recent generation hashes.
//
//   COMPUTE INTO h AND THEN SWAP. NEVER IN PLACE, AND THIS IS
//   DO-NOT-SIMPLIFY. A single buffer would count neighbours that the same pass
//   had already updated, so the top half of the grid would evolve against
//   generation n and the bottom half against a mixture of n and n+1. It is the
//   single most likely bug in this entry, it produces a picture that still
//   looks like Life, and no gate in this repository could tell the difference.
//   The swap is two field writes at the end of the Timer.
//
// THE GRID IS A TORUS. A neighbour is G[(y+j)%9*9 + (x+i)%9] with i and j each
// running -1..1, and both moduli are Lua's floor-modulo, so -1 % 9 is 8 and the
// wrap is free in both axes. The centre cell is counted by the same nine-way
// loop and then subtracted, which is one statement instead of a comparison
// inside the inner loop. A torus is what lets a glider survive: on a bounded
// 9x9 the seed collides with a wall and settles inside four generations, and a
// card that settles in four generations is a still picture.
//
// SETUP SEEDS A GLIDER at cells 1, 11, 18, 19 and 20 - the canonical
// .#. / ..# / ### in the top-left corner - so the card evolves from tick 0 and
// the five golden frames are five real generations. On a 9x9 torus a glider
// walks the diagonal and returns to where it started after thirty-six
// generations, so with nobody touching it this card never settles at all.
// restsBlack is FALSE and the OG image is a real glider.
//
// THE SETTLE DETECTOR IS FOR THE PAD SOMEBODY HAS TOUCHED, and it is
// DO-NOT-REMOVE. A tap adds cells, the pattern stops being a glider, and almost
// every seed on eighty-one cells settles into a still life or a two-cycle
// within seconds. self.i and self.j hold the previous two generations' hashes -
// k = k*3 + v folded over all eighty-one cells, which overflows and wraps, and
// wraparound on 64-bit integers is defined identically in Lua 5.3, 5.4 and 5.5 -
// so a repeat at period one or two is caught and the glider is re-seeded. The
// hash is set to 0 on a re-seed, which is the all-dead value and therefore
// cannot collide with the pattern that was just written. Without this a browse
// page fills up with dead grids.
//
// THE PAINT, in three cases and one pass. Live cells go to @LIVEC on BOTH
// layers, because one layer caps at 49.6 per cent of the colour asked for.
// Cells that JUST DIED go black on layer 1 and to @DYINGC on layer 2 with a
// self-erasing decay - glpfs(a,2,252,247,0) plus glt(a,2,28) - so the pattern
// leaves a trace of where it has been. Cells that were already dead are left
// alone, because their decay has already run to exact black.
//
//   THE LIVE BRANCH USES glpfs AND NOT glp, AND THAT IS A FIX. glp writes the
//   phase and nothing else, so a cell coming back to life would keep the rate
//   of 247 the dying branch gave it and immediately fade out again. Writing
//   phase 255 with rate 0 and shape 0 is what puts the cell back under manual
//   control.
//
//   THE DECAY LENGTH DIVIDES 252. The rate is 256 - 252//28 = 247 and the
//   starting phase is 252, so the phase steps by 9 and lands on exactly 0 in
//   exactly 28 ticks. A length that does not divide 252 expires part-way down,
//   firmware sets the rate to 0 and THE CELL FREEZES PART LIT, forever. 28 is
//   one of the four values 09-04 measured landing on exact black.
//
//   NO KEEPER ON THE DECAYING LAYER. glt(a,2,65535) here would be pitfall 1
//   exactly: the countdown replaced, the rate decrementing past zero and
//   wrapping, and every dying cell strobing forever. The longest timeout in
//   this entry is 28 ticks.
//
// SOUND, AND THE PROTOCOL CEILING WRITTEN OUT. A birth plays @NOTE + 8 - row,
// so the pattern's height is its pitch, and the note-off goes out with the
// note-on because a settled generation must not leave a note held. AT MOST SIX
// BIRTHS SOUND PER GENERATION, and the 6 is a literal in the source rather than
// a knob. The reason is arithmetic: GRID_LUA_STDO_LENGTH is 256 bytes, cleared
// once per 10 ms cycle, and a gms voice message is 14 bytes, so about EIGHTEEN
// messages fit in one cycle and AN APPEND THAT DOES NOT FIT IS REFUSED WITH NO
// ERROR - no raise, no return code, the note simply never leaves. A busy
// generation on a torus can have twenty or more births; six births is twelve
// messages is 168 of the 256 bytes, a third of the ceiling clear. Measured on a
// deliberately dense seed: the busiest sampled generation sent exactly twelve
// messages, which is the cap doing its job.
//
// A TAP SEEDS A CELL and paints it immediately, so the feedback is instant
// rather than one generation late. The guard is "e~=4 and e<9 then return", so
// an onset is e == 4 or e > 8 and a FAST TAP - code 9, one message with no
// separate lift - seeds as well as a press does. A move never seeds, which is
// what stops a dragged finger painting a stripe nobody asked for.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE DOUBLE BUFFER, marked do-not-simplify above.
//   - EVERY DIVISION AND MODULO IS FLOORED. n%9, n//9, (y+j)%9, (x+i)%9,
//     x*9//128, y*9//128 and n//9 in the note are integer operations; a
//     fractional argument to a firmware call silently becomes 0.
//   - THE LOOPS ARE BOUNDED BY LITERALS: 0..80 three times and -1..1 twice.
//     There is no while and no repeat in either stored string. An unbounded
//     loop inside a Timer hangs the port task forever with the watchdog's panic
//     disabled, and the only recovery is a power cycle.
//   - THE NOTE CEILING IS A LITERAL, with the 256-byte reason above.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @LIVEC and @DYINGC value is inside 0..255 by construction.
//   - CODE 9. A tap seeds, and it must work as a fast tap.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE. Every phase written here is an
//     explicit 0, 252 or 255.
//   - NO RANDOM SOURCE, and no call into the numeric library at all. The seed
//     is a fixed glider and the settle detector is arithmetic, so two builds
//     run to the same tick produce byte-identical frames - measured.
//   - THE NOTE RANGE IS NINE WIDE. Row 0 plays @NOTE + 8 and row 8 plays @NOTE.
//     The largest value is 72, so the top note is 80; the smallest is 36.
//
// THE HONEST LIMIT, for the card copy. Eighty-one cells on a torus is a very
// small universe - most seeds settle in seconds, which is why tapping matters
// and why the card re-seeds itself.
//
// ROUTE: kind "lua", not kind "state". Nothing in PadState evolves state at
// all: sends.kind is none | xy | zones | faders | trackpad | dial, every
// look.kind is a phase generator with no memory between ticks, and showGrid
// paints its zones in one gridColour - so neither the automaton nor its
// per-cell two-colour picture has any representation on the sheet.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 435 characters, Timer 674, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the five-knob cross-product is 435 / 677, leaving 473 free of 908
// on the Setup and 231 on the Timer, and the all-shortest is 435 / 674.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.g={}self.h={}self.i=1 self.j=2 for n=0,80 do self.g[n]=0 self.h[n]=0 end local S={1,11,18,19,20}for k=1,5 do local n=S[k]self.g[n]=1 local a=glag(0,n)glc(a,1,@LIVEC,1)glc(a,2,@LIVEC,1)glp(a,1,255)glp(a,2,255)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local n=x*9//128+y*9//128*9 s.g[n]=1 local a=glag(0,n)glc(a,1,@LIVEC,1)glc(a,2,@LIVEC,1)glp(a,1,255)glpfs(a,2,255,0,0)end gtt(0,@GEN)";

const TIMER =
  "--[[@cb]]gtt(0,@GEN)local s=self local G=s.g local H=s.h local k=0 for n=0,80 do local x=n%9 local y=n//9 local c=0 for j=-1,1 do for i=-1,1 do c=c+G[(y+j)%9*9+(x+i)%9]end end c=c-G[n]local v=(c==3 or c==2 and G[n]>0)and 1 or 0 H[n]=v k=k*3+v end if k==s.i or k==s.j then for n=0,80 do H[n]=0 end H[1]=1 H[11]=1 H[18]=1 H[19]=1 H[20]=1 k=0 end s.i=s.j s.j=k local m=0 for n=0,80 do local a=glag(0,n)if H[n]>0 then glc(a,1,@LIVEC,1)glc(a,2,@LIVEC,1)glp(a,1,255)glpfs(a,2,255,0,0)if G[n]==0 and m<6 then m=m+1 s:gms(@CH,144,@NOTE+8-n//9,100,0)s:gms(@CH,128,@NOTE+8-n//9,0,0)end elseif G[n]>0 then glc(a,1,0,0,0,1)glc(a,2,@DYINGC,1)glpfs(a,2,252,247,0)glt(a,2,28)end end s.g=H s.h=G";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const LIFE: CatalogEntry = {
  id: "life",
  name: "LIFE",
  description:
    "Conway’s Life on the pad: tap to seed it, and the pattern plays itself out in light and notes.",
  // Feel-based, never a compiler kind (CONT-03). "game" arrives with SNAKE
  // earlier in this same wave and reaches its second carrier here, which is
  // what turns it into a standing chip.
  tags: ["game", "generative", "hypnotic", "grid"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @GEN, @LIVEC, @DYINGC,
  // @NOTE and @CH. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these five is a prefix of another.
  //
  // THE SIX-BIRTH NOTE CEILING IS A LITERAL, NOT A KNOB, and deliberately so:
  // it is the 256-byte protocol buffer expressed in births, not a taste, and a
  // knob that let a visitor set it to twenty would let them silently lose
  // notes with no error anywhere.
  knobs: [
    {
      id: "gen",
      label: "Generation time",
      kind: "speed",
      token: "@GEN",
      // Milliseconds a generation lasts, at 10 ms a tick. APPEARS IN BOTH
      // EVENTS - Setup's first arm and the Timer's re-arm - and both must move
      // together, or the first generation lands at one rate and every later one
      // at another. At the default of 400 the first generation arrives at tick
      // 40, which is why the golden frames at ticks 0 and 37 are the same seed.
      values: ["600", "400", "260", "160"],
      default: 1,
    },
    {
      id: "live",
      label: "Living colour",
      kind: "colour",
      token: "@LIVEC",
      // Painted on BOTH layers, because one layer caps at 49.6 per cent of the
      // value asked for and a living cell has to win against the trail behind
      // it. Every channel is inside 0..255: firmware truncates rather than
      // clamps, so 260 would render as 4. All four values are nine characters
      // long, which keeps the corner arithmetic flat.
      values: ["0,255,120", "0,200,255", "255,140,0", "255,0,255"],
      default: 0,
    },
    {
      id: "dying",
      label: "Fading colour",
      kind: "colour",
      token: "@DYINGC",
      // Layer 2 only, and DIM on purpose: it is the trace of where the pattern
      // has been and it must never compete with a living cell. Handed
      // glpfs(a,2,252,247,0) plus glt(a,2,28) - the self-erasing trail idiom,
      // where the sixth argument of glc forces the layer's minimum stop black
      // so a phase running down to 0 is exact black, and firmware does the whole
      // fade in C with no erase pass. NEVER A KEEPER on this layer.
      values: ["60,20,0", "0,30,60", "40,0,60", "30,30,30"],
      default: 0,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // A birth in row 8 plays this and one in row 0 plays this plus eight, so
      // a pattern climbing the pad climbs in pitch. The largest value is 72,
      // and 72 + 8 = 80, well inside the MIDI range. APPEARS TWICE, on the
      // note-on and on the note-off, so a note can never be released at a pitch
      // it was not played at.
      values: ["48", "60", "36", "72"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add sixteen combinations to the sweep for a choice nobody makes.
      // APPEARS TWICE, on the note-on and the note-off, so both always leave on
      // the same channel.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    gen: 1,
    live: 0,
    dying: 0,
    note: 0,
    channel: 0,
  },

  // FALSE. Setup seeds a glider and lights its five cells at phase 255, so tick
  // 0 is already a picture and every sampled tick is a real generation.
  // frames.spec.ts test 5 turns that declaration into a checked fact.
  restsBlack: false,
};
