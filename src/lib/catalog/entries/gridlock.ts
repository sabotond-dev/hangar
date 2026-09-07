// GRIDLOCK - eighty-one clips under one hand, and the ring tells you it took.
//
// Nine tracks across, nine scenes down, one cell per clip. Fire one and a ring
// rolls out from it and leaves the pad, so the confirmation is a thing you see
// on the module rather than a thing you look for on a screen. At rest the nine
// 3x3 track blocks sit there in two shades of one colour, countable without a
// legend.
//
// THIS IS NOT CHORUS, AND THE SHARED MECHANISM IS DELIBERATE. CHORUS's bloom is
// the same firmware trick - one glpfs per cell with a per-cell starting phase,
// after which the LED engine expands the figure in C with no Lua running at all
// - and reusing it here costs nothing, because it is the cheapest spectacular
// thing this module can do. WHAT IS DIFFERENT IS THE CARD. CHORUS is nine chord
// pads and the bloom is decoration; GRIDLOCK is eighty-one launch cells and the
// ring is the receipt. The mechanism is shared on purpose; the configuration is
// not.
//
// THE MECHANISM, and its arithmetic.
//
//   u = x*9//128, v = y*9//128            the fired cell
//   d = max(|n%9 - u|, |n//9 - v|)        Chebyshev distance, 0..8
//   p = glim(248 - d*@SPREAD, 0, 248)     the starting phase for that cell
//   glpfs(a, 1, p, 4, 0) + glt(a, 1, (256 - p)//4)
//
// Shape 0 is the ramp, so brightness IS the phase. Every cell climbs at 4 phase
// units a tick and its timeout is chosen so it climbs EXACTLY to 256, which
// wraps to 0 on the last tick and freezes there. So the fired cell peaks and
// dies immediately, its neighbours peak a beat later, and the bright edge walks
// outward until it runs off the pad - and the layer is at exact black
// afterwards, every cell, at every knob setting. Measured: a corner fire is
// back to a byte-identical resting frame at tick 17, 33, 49 and 63 for the four
// spread values, and three overlapping fires in different places still settle
// to the same frame.
//
// THE EXACT LANDING IS THE WHOLE ARITHMETIC, and it is 09-03's decay lesson
// turned around. That lesson - a decay's rate must be derived from its length,
// or the timeout expires part-way down and firmware freezes the cell half lit -
// applies per cell here, because every cell starts at a DIFFERENT phase. A
// uniform timeout would strand each ring at a different brightness, GRIDLOCK
// HAS NO TIMER TO REPAINT ANYTHING, and the pad would silt up with half-lit
// cells as you played it. So the timeout is derived from the phase instead of
// the phase from the timeout: (256 - p)//4 for a rate of 4, exact for every
// spread value because 248 and every @SPREAD are multiples of 4.
//
// THE CLAMP IS LOAD-BEARING, NOT DEFENSIVE. 248 - 8*32 is -8, and pha is a
// uint8 that WRAPS: without glim the far corners would arrive at phase 248 and
// light up brightest of all, which is a silent, plausible-looking fault nobody
// would find by reading. glim pins them at 0 instead, where they start black,
// climb last and die last, which is what an expanding ring should do. It also
// keeps the derived timeout at its maximum of 64 ticks rather than a negative.
//
// THE SEND. Nine tracks by nine scenes does not fit a note number, and an
// eighty-one note range would push past 127. So THE COLUMN IS THE NOTE AND THE
// ROW RIDES IN THE VELOCITY: self:gms(@CH, 144, @BASE + u, v*14 + 14, 0). Nine
// notes, @BASE to @BASE + 8, and nine velocities, 14 to 126, fourteen apart so
// no two rows land in the same DAW velocity bucket. Both are inside range and
// both are mappable in a minute. A reader will otherwise assume a note per
// cell, so it is stated here and in the entry's SUMMARY.
//
// THE NOTE-OFF IS UNCONDITIONAL AND IMMEDIATE, and that is how the code-9 trap
// is answered by DESIGN rather than by a branch. A clip launcher is a trigger,
// not a held note: the note-off is sent on the line after the note-on, no state
// is kept per contact, and a fast tap - firmware event 9, which arrives as one
// message with no separate lift - needs no special case anywhere in this file.
// It is the one entry in this phase where that is true.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints all 81 cells on layer 2
// in @BLOCKC, at phase 255 or 130 depending on the parity of
// (n%9//3 + n//9//3): a chessboard of 3x3 blocks, so the nine tracks are
// countable at rest and the OG image is not a black square. 162 lit bytes.
// Layer 1 carries @RIPC at phase 0 - the colour is written once in Setup and
// the ripple only ever moves the phase, which is what makes the touch handler
// one glpfs and one glt per cell.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE glim CLAMP ON THE STARTING PHASE, do-not-remove. See above: without
//     it the uint8 wrap lights the far corners brightest.
//   - F2Ieq on every division. x*9//128, y*9//128, n%9, n//9 and (256-p)//4 are
//     all floored; a fractional argument to a firmware call becomes 0, silently.
//     math.abs and math.max preserve Lua's integer subtype and need no //1, and
//     both are on the host's allow-list; math.sqrt, which would need one, is
//     deliberately not used - Chebyshev distance draws a square ring, which is
//     what a square grid of clips wants anyway.
//   - NO KEEPER ANYWHERE. Layer 1 carries a decaying trail and the longest
//     timeout it can hold is 64 ticks. glt(a,1,65535) here is pitfall 1
//     exactly; grep for 65535 over these strings finds nothing.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @RIPC and @BLOCKC value is inside 0..255 by construction.
//   - TOKEN PREFIX CHECK, done before a line was written: @BASE, @CH, @RIPC,
//     @SPREAD, @BLOCKC. @BASE and @BLOCKC share "@B" and neither is a prefix of
//     the other; nothing else comes close.
//
// GRIDLOCK HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION.
// The block picture is static, and every ripple carries its own countdown down
// to exact black. There is nothing for a Timer to advance, so the Timer is the
// empty string, the same shape MORPH, SLAM and KEYS use. createLuaPadSim maps
// "" onto undefined for the host, and docs/HARDWARE-AUDITION.md row 1's
// install-order rule already carries that exemption.
//
// THE HONEST LIMIT, for the card copy. THE PAD SHOWS WHAT YOU FIRED, NOT WHAT
// THE HOST IS PLAYING. There is no inbound MIDI anywhere in this phase (D-04),
// so a clip that stops on its own, or one launched from the mouse, leaves this
// pad with nothing to say about it. The ring confirms that the message left the
// module; it does not confirm that the clip started. The description is written
// to claim only the first.
//
// ROUTE: kind "lua", not kind "state". sends.grid is "3x3" | "4x4" | "9x9", and
// on the 9x9 the compiler emits a chromatic zone map with one gridColour and
// one heldColour - there is no per-cell fired state and no ripple in the
// vocabulary at all. A per-cell picture over a per-cell gesture is outside it.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: Setup 425 characters, a fixed point of compressScript and
// accepted by checkSyntax. The all-longest corner of the five-knob
// cross-product is 431, leaving 477 free of 908, and the all-shortest corner is
// 424. The Timer is the empty string at every corner, and the empty string is a
// fixed point of compressScript.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)glc(a,1,@RIPC,1)glp(a,1,0)glc(a,2,@BLOCKC,1)glp(a,2,(n%9//3+n//9//3)%2==0 and 255 or 130)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local u=x*9//128 local v=y*9//128 for n=0,80 do local a=glag(0,n)local p=glim(248-math.max(math.abs(n%9-u),math.abs(n//9-v))*@SPREAD,0,248)glpfs(a,1,p,4,0)glt(a,1,(256-p)//4)end s:gms(@CH,144,@BASE+u,v*14+14,0)s:gms(@CH,128,@BASE+u,0,0)end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: GRIDLOCK has
// no Timer EVENT, and a named constant holding nothing would only invite
// someone to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const GRIDLOCK: CatalogEntry = {
  id: "gridlock",
  name: "GRIDLOCK",
  description:
    "Eighty-one clips under one hand, and a ring rolls out from the one you fired so you know it took.",
  // Feel-based, never a compiler kind (CONT-03).
  tags: ["clips", "launcher", "rippling", "playable"],
  featured: false,
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
      // The LEFTMOST COLUMN's note; the rightmost is this plus eight. The
      // largest value is 60 and 60 + 8 = 68, well inside the MIDI range. It
      // appears twice - the note-on and the note-off on the line after it - so
      // a clip can never be released on a note it was not fired on.
      values: ["36", "48", "60", "24"],
      default: 1,
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
      id: "ripple",
      label: "Ring colour",
      kind: "colour",
      token: "@RIPC",
      // Layer 1, written ONCE in Setup at phase 0; every ripple after that
      // moves only the phase. Bright on purpose: it is one layer, which can
      // never exceed 254/512 of the value asked for, and it is the thing the
      // card is watched for. Every channel is inside 0..255 - the firmware
      // truncates rather than clamps, so 260 would render as 4.
      values: ["255,90,0", "0,200,255", "0,255,120", "255,255,255"],
      default: 0,
    },
    {
      id: "spread",
      label: "Ring spacing",
      kind: "size",
      token: "@SPREAD",
      // Phase units of head start per ring of distance, so a bigger number is a
      // slower, wider ring: a corner fire clears in 17, 33, 49 and 63 ticks for
      // these four. EVERY VALUE IS A MULTIPLE OF FOUR, because the derived
      // timeout is (256 - p)//4 and it has to be exact - see the header. A
      // value that is not would strand a ring part-way down with no Timer to
      // repaint it.
      values: ["8", "16", "24", "32"],
      default: 3,
    },
    {
      id: "blocks",
      label: "Track colour",
      kind: "colour",
      token: "@BLOCKC",
      // Layer 2, the nine 3x3 track blocks, in two shades: phase 255 and phase
      // 130 by block parity. Deliberately dim - it is the scaffolding the ring
      // is read against, and a bright grid would compete with the receipt it is
      // there to frame.
      values: ["0,60,90", "60,0,90", "80,50,0", "50,50,50"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    base: 1,
    channel: 0,
    ripple: 0,
    spread: 3,
    blocks: 0,
  },

  // FALSE. Setup lights all 81 cells on layer 2 at phase 255 or 130, so a
  // sampler that never touches the pad reads the nine track blocks at every
  // tick - 162 lit bytes. frames.spec.ts test 5 turns that declaration into a
  // checked fact.
  restsBlack: false,
};
