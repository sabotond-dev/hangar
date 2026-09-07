// ETCH - a drawing surface you clear with a fast sweep.
//
// Draw on the pad with a finger and it stays. Sweep across it fast and the
// whole thing wipes clean. No timer, no decay, no fade: a mark you make is a
// mark that is still there when you come back to it.
//
// THE MECHANISM, and its 9x9 arithmetic. self.c is the canvas, an entry per
// drawn cell keyed by index; self.q is the previous cell each contact was seen
// at, keyed by contact id. On any live sample the cell under the finger is
// c + r*9 with c = x*9//128 and r = y*9//128, both floored. A cell that is not
// already drawn is marked, painted in @INKC on BOTH layers at phase 255, and
// plays a note. A cell already drawn returns immediately, which is what
// rate-limits the sound to one note per NEW cell rather than one per sample.
//
// A PERSISTENT MARK IS EXACTLY WHAT A CELL WITH NO TIMEOUT IS, AND THAT IS WHY
// THIS ENTRY EXISTS. touch.kind on the compiler's sheet offers
// none | comet | perFinger | bloom | glow | disturb, and every one of them is a
// self-erasing decay - a mark that stays is the one thing the touch sheet is
// built not to do. Here the phase is written once and nothing ever counts it
// down, so firmware holds the cell lit for nothing per tick.
//
//   NO glt ON THE INK, AND THIS IS DO-NOT-ADD. A timeout on a persistent mark
//   would make the drawing fade; a 65535 keeper on it would be pitfall 1
//   exactly - the countdown replaced, the rate decrementing past zero and
//   wrapping, and every drawn cell strobing forever. There is no glt, no glf
//   and no glpfs anywhere in this entry, so both failure modes are unreachable
//   by construction rather than by care.
//
// THE WIPE, and the one place this entry repaints everything. self.q[i] holds
// the cell this contact was last seen at. If the CHEBYSHEV distance between
// consecutive cells - the larger of the column and row differences - exceeds
// @WIPE, the canvas table is thrown away and all eighty-one cells are blacked
// in one bounded pass, and the sample that triggered it draws nothing. That is
// a full repaint, and it is affordable precisely because it is a gesture a
// visitor makes deliberately: it happens at most once per sweep, never per
// sample, and never on the drawing path the touch budget actually cares about.
//
// THE PREVIOUS CELL IS CLEARED ON AN END EVENT, and that is a fix rather than
// tidiness. Without it a lift at one corner followed by a fresh touch at the
// other reads as one enormous jump and wipes a drawing nobody asked to lose.
// Measured: draw at column 0, lift, touch column 8 - the canvas grows from one
// cell to two and no wipe fires.
//
// WHAT EACH @WIPE VALUE ACTUALLY DOES, measured on a scripted drag from column
// 0 (the wipe fires on a jump STRICTLY GREATER than the threshold):
//
//   @WIPE 2  wipes at a jump of 3 cells and further
//   @WIPE 3  wipes at 4 and further        (the default)
//   @WIPE 4  wipes at 5 and further
//   @WIPE 6  wipes at 7 and further - which on a nine-column pad means very
//            nearly the full width, so this setting is close to "never wipe"
//
// THE ROW IS THE PITCH, so drawing plays a line: a new cell in row r sends
// @NOTE + 8 - r, top row highest. NOTE-ON AND NOTE-OFF GO OUT TOGETHER, which
// is not laziness: this entry stores no Timer, so there is no scheduler that
// could ever turn a note off later, and a note-on with a deferred off would
// stick forever the moment a finger lifted. Two messages per sample, 28 of the
// 256-byte protocol buffer.
//
// THE PROTOCOL CEILING, made explicit. GRID_LUA_STDO_LENGTH is 256 bytes,
// cleared once per 10 ms cycle, and a gms voice message is 14 bytes - about
// EIGHTEEN messages per cycle, and an append that does not fit is REFUSED WITH
// NO ERROR. One touch sample is one cycle and a sample can draw at most one new
// cell, so ETCH's ceiling is two messages a cycle by construction. There is no
// rate limiter here because the shape of the entry is the rate limiter.
//
// THE LOOK, and why restsBlack is TRUE. Setup paints nothing at all: it
// declares two tables and a touch handler, and every cell's stops are still the
// zeroes grid_led_reset left. A blank canvas is black, and that is THE
// CONFIGURATION rather than a broken picture - which is why the entry declares
// it, why motion is "dark", why its quiet line is RESTS_DARK_NOTE verbatim, and
// why gen-og.mjs is allowed to write a black OG image for it. The catalog needs
// its dark cards: listing.spec.ts requires all three motions to occur, and this
// is one of them. frames.spec.ts test 5 turns the declaration into a checked
// fact in both directions - measured at zero non-zero bytes at every one of the
// five sampled ticks.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - NO TIMEOUT ON THE INK, marked do-not-add above, with both failure modes
//     written out.
//   - EVERY DIVISION AND MODULO IS FLOORED. x*9//128, y*9//128, p%9 and p//9
//     are integer operations; a fractional argument to a firmware call silently
//     becomes 0.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @INKC value is inside 0..255 by construction.
//   - EVENT CODES. The guard is "e==3 or e>=5 and e<9 then s.q[i]=nil return",
//     so an end - including a grip suppression at code 3 - clears the stored
//     coordinate, and a fast tap at code 9 falls through and draws. e == 5 is
//     never tested for on its own, which is what stops a fast tap being missed.
//   - PER-CONTACT STATE IS KEYED BY id, never by cell. A finger that starts on
//     one cell and lifts on another is the commonest real gesture there is.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE. Every phase here is 255, and a
//     cell is blacked by writing an all-zero colour with the sixth argument of
//     glc set, which forces the minimum stop black.
//   - THE ONLY LOOP IS BOUNDED BY A LITERAL, 0..80, and it is the wipe. There
//     is no while and no repeat in the stored string.
//   - THE NOTE RANGE IS NINE WIDE. Row 0 plays @NOTE + 8 and row 8 plays @NOTE.
//     The largest value is 72, so the top note is 80; the smallest is 36. Both
//     are inside 0..127.
//   - NO RANDOM SOURCE. There is no call into the numeric library at all.
//
// THE HONEST LIMIT, for the card copy. A wipe is a gesture, so a genuinely fast
// stroke will erase what you meant to draw - which is why the threshold is a
// knob.
//
// ROUTE: kind "lua", not kind "state". Two reasons, and the first is the whole
// card: sends.kind is none | xy | zones | faders | trackpad | dial and every
// touch look on the sheet is a self-erasing decay, so an eighty-one cell
// PERSISTENT canvas cannot be expressed at all. Second, showGrid paints its
// zones in one gridColour, so a per-cell drawing has no representation there
// either.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua the Setup is byte-identical to the canonical text
// measured against the pinned minifier at 535 characters, a fixed point of
// compressScript and accepted by checkSyntax; the Timer is the empty string,
// the shape MORPH, SLAM, KEYS, GRIDLOCK, TABLE, CONSOLE, STRIP, LEARN, LUMEN,
// SWITCH and CULL also use. The all-longest corner of the four-knob
// cross-product is 537, leaving 371 free of 908, and the all-shortest is 535.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.c={}self.q={}self.touch_cb=function(s,i,e,x,y)if e==3 or e>=5 and e<9 then s.q[i]=nil return end local c=x*9//128 local r=y*9//128 local n=c+r*9 local p=s.q[i]s.q[i]=n if p then local m=c-p%9 local w=r-p//9 if m<0 then m=-m end if w<0 then w=-w end if m>@WIPE or w>@WIPE then s.c={}for k=0,80 do local a=glag(0,k)glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)end return end end if s.c[n]then return end s.c[n]=1 local a=glag(0,n)glc(a,1,@INKC,1)glc(a,2,@INKC,1)glp(a,1,255)glp(a,2,255)s:gms(@CH,144,@NOTE+8-r,90,0)s:gms(@CH,128,@NOTE+8-r,0,0)end";

// THE EMPTY STRING, and it is load-bearing. firmware's gtt is a no-op until the
// Timer event holds at least one stored action, and LuaHost draws the same
// distinction on undefined versus "": an entry that stores nothing here cannot
// arm a timer at all. Nothing on this card evolves - a drawing stays until you
// wipe it - so there is nothing for a Timer to do.
const TIMER = "";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const ETCH: CatalogEntry = {
  id: "etch",
  name: "ETCH",
  description:
    "Draw on the pad with a finger and it stays; sweep across it fast and the whole thing wipes.",
  // Feel-based, never a compiler kind (CONT-03). "drawing" is coined here.
  // "still" is already carried by LATTICE, and a second carrier is what the
  // RECORDED block in filter.spec.ts exists to make visible.
  tags: ["drawing", "playable", "gestural", "still"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @INKC, @WIPE, @NOTE and
  // @CH. renderLua substitutes by plain String.replaceAll, so a token that is a
  // prefix of another is eaten or corrupted depending on knob order. No one of
  // these four is a prefix of another.
  knobs: [
    {
      id: "ink",
      label: "Ink colour",
      kind: "colour",
      token: "@INKC",
      // Painted on BOTH layers, because one layer caps at 49.6 per cent of the
      // value asked for and a drawing has to read at a glance. Every channel is
      // inside 0..255: firmware truncates rather than clamps, so 260 would
      // render as 4. All four values are nine characters long, which keeps the
      // Setup's worst corner two characters from its defaults.
      values: ["0,200,255", "255,140,0", "0,255,120", "255,0,255"],
      default: 0,
    },
    {
      id: "wipe",
      label: "Wipe distance",
      kind: "size",
      token: "@WIPE",
      // Cells of CHEBYSHEV distance between two consecutive samples of the same
      // contact. The wipe fires on a jump STRICTLY GREATER than this, measured
      // on a scripted drag: 2 wipes at 3, 3 wipes at 4, 4 wipes at 5, 6 wipes
      // at 7. The pad is nine columns wide, so 6 is very nearly "never wipe" -
      // which is the point of having it, for anyone who draws fast.
      values: ["2", "3", "4", "6"],
      default: 1,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // Row 8 plays this and row 0 plays this plus eight, so a line drawn
      // upwards plays upwards. The largest value is 72, and 72 + 8 = 80, well
      // inside the MIDI range. APPEARS TWICE, on the note-on and on the
      // note-off, so a note can never be released at a pitch it was not played
      // at.
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

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    ink: 0,
    wipe: 1,
    note: 0,
    channel: 0,
  },

  // TRUE, and it is the design rather than a fault. Setup writes no colour and
  // no phase to any cell, so a sampler that never touches the pad reads an
  // all-zero frame at every tick. ETCH paints only under a finger, and the mark
  // it leaves is the whole card. frames.spec.ts test 5 is what turns that
  // declaration into a checked fact.
  restsBlack: true,
};
