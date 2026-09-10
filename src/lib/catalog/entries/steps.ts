// STEPS - an eight by eight step grid with a bright column sweeping across it.
//
// Tap a cell to arm it; a column sweeps left to right and plays what you armed
// on the way past. Eight tracks, eight steps, a position you can read at a
// glance. The archetypal grid sequencer, at the size the pad actually is.
//
// THE MECHANISM. self.p is a flat table indexed 0..63, one boolean per cell,
// with the column in the low three bits: index n is column n%8 and row n//8, and
// the pad cell under it is n%8 + n//8*9. self.k is the column the sweep is on.
// Every Timer period re-arms the Timer FIRST - matching the compiler's own
// gtt-first bodies, because the handler runs inside a pcall and a re-arm placed
// at the end dies permanently on the first raise - then advances the column,
// releases the PREVIOUS column's armed rows, and paints and plays the new one.
// Note-off before note-on in the same body, so a held note never overlaps
// itself.
//
// EIGHT BY EIGHT, AND THE NINTH COLUMN AND ROW ARE DARK BY DESIGN. Eight by
// eight is what a step sequencer is: eight steps is a bar of eighths and eight
// tracks is a drum kit. Inventing a ninth track to fill the pad would be
// filling the pad rather than making an instrument, so the outer column and the
// bottom row are left black and the touch handler returns for any cell in them.
//
// THIS IS NOT EUCLID AND IT IS NOT SONAR. EUCLID is three concentric rings
// beating against each other on a 48-tick cycle; SONAR is a radial sweep
// through 16 angle buckets where the ring is the pitch. STEPS is the plain
// rectangular grid both of those deliberately are not. Phase 8 dropped a
// nine-step sequencer for overlapping EUCLID's slot and kept it as a follow-on
// (08-06-SUMMARY.md:628-629); this is that follow-on.
//
// THE LOOK, and why restsBlack is FALSE. Setup arms a default pattern - the
// bottom row on every second step, which reads as four-on-the-floor - so the
// card is lit and playing before anyone touches it. That is what makes it a
// card rather than a black square, and it is what puts a real frame in
// frames.json and in the OG image. Armed cells sit dim and static on layer 2 in
// @ARMC; the sweeping column is layer 1 in @SWEEPC, handed
// glpfs(a,1,252,256-252//@TRAIL,0) plus glt(a,1,@TRAIL) - the self-erasing
// trail idiom, where the sixth argument of glc forces the layer's minimum stop
// black so a phase running down to 0 is exact black, and firmware does the
// whole fade in C with no erase pass and no per-cell bookkeeping.
//
// THE DECAY RATE IS DERIVED FROM THE TRAIL LENGTH, AND THAT IS MEASURED RATHER
// THAN STYLED. A fixed rate of 250 - the shipped idiom - is a phase step of 6 a
// tick, which lands on black only at 42 ticks. At any other trail length the
// timeout expires part-way down, firmware sets the rate to 0 and THE CELL
// FREEZES HALF LIT: measured here at phase 183, 111 and 127 for trails of 12,
// 24 and 64, which on a swept grid is every cell glowing at roughly two fifths
// forever. So the rate is 256 - 252//@TRAIL and the starting phase is 252, and
// every trail value is a divisor of 252. The product is then exactly 252 at
// every setting and the phase lands on exactly 0:
//
//   12 ticks -> step 21    28 ticks -> step 9
//   42 ticks -> step 6     63 ticks -> step 4
//
// That is why the trail values are 12, 28, 42 and 63 rather than a rounder
// looking 12, 24, 42, 64. Any new value must divide 252.
//
// A SWIPE ARMS EVERY CELL IT CROSSES, AND THE ONSET-ONLY GUARD THIS HEADER
// USED TO DEFEND IS DELIBERATELY REVERSED (plan 11-08). The trap list below
// used to read "a move never toggles a cell" as a design statement. The bench
// asked for the opposite - "STEPS: same as SONAR or EUCLID", against SONAR's
// "not precise enough" and EUCLID's "you should be able to add by swiping your
// finger" - so the decision is overturned rather than quietly replaced.
// Measured through the real Lua host before the change: a 128-sample swipe
// along row 4 armed exactly 1 cell, the one the finger landed on. It now arms
// all eight that row 4 contains inside the 8x8 grid.
//
// ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT. A MOVE
// arrives every 10 ms, so a finger resting inside one cell would arm and disarm
// it at 100 Hz - measured unguarded at 209 changes over 209 further samples.
// self.q[i] remembers the cell the contact last touched and swallows a repeat;
// the contact-end branch clears it so a fresh press on the same cell is not
// eaten.
//
// EVERY EVENT IS DEDUPED, AND THE FAST TAP ESCAPES BY STORING NOTHING. The
// store is "s.q[i]=e<9 and a", not the bare "s.q[i]=a" plan 11-08 sketched,
// and the eight characters that costs buy a real fix. Event code 9 is a whole
// contact in ONE message with no lift after it, so the contact-end branch never
// runs for a tap and under the bare store the SECOND fast tap on the same cell
// would find s.q[i] still holding it and be swallowed. Measured on the bare
// shape: three fast taps on one cell read 0 -> 255 -> 255 -> 255, a step that
// can be armed from the pad and never disarmed. "e<9 and a" evaluates to
// false for a tap, and false is never equal to a cell index, so the next tap
// always lands. src/lib/catalog/touch-guard.spec.ts holds the event-code
// convention the clear is written in.
//
// THE GUARD'S KEY IS THE 9x9 PAD CELL c+r*9, NOT THE 8x8 PATTERN INDEX c+r*8,
// AND THAT IS THE ONE PLACE THIS ENTRY DIFFERS FROM ITS TWO SIBLINGS. The
// pattern index is only defined for c <= 7 and r <= 7; extended over the whole
// pad it ALIASES - c=8,r=0 and c=0,r=1 are both 8 - so a finger that swiped
// down the dark ninth column and then crossed into cell (0,1) would find its
// own stale key waiting and lose the arm. c+r*9 is unique over all 81 cells,
// and it is the value glp already needs, so keying on it costs nothing and
// saves the second expression.
//
// WHAT THE REVERSAL COSTS: a swipe that crosses a cell twice toggles it twice,
// so dragging back over your own stroke erases it. That is correct for a toggle
// and it is not what a paint gesture does; the set-rather-than-toggle
// alternative is named as an open bench question in euclid.ts.
//
// CLOCK SYNC IS NOT BUILT. STEPS carries the request only by reference - the
// bench note is "same as SONAR or EUCLID" - so the two blockers are stated ONCE
// each, in sonar.ts's and euclid.ts's headers, and CITED here. Three statements
// of one fact drift.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - F2Ieq on both coordinate divisions. x*9//128 and y*9//128 are floored; a
//     fractional argument to a firmware call becomes 0, silently.
//   - THE NOTE RANGE IS EIGHT WIDE. Row r plays @NOTE + r, so @NOTE + 7 must
//     stay under 128 for every value of the knob. The largest is 60, and
//     60 + 7 = 67. The arithmetic is stated here so a future value is checked
//     against it rather than guessed.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every @ARMC and @SWEEPC value is inside 0..255 by construction.
//   - EVENT CODES. The guard admits MOVE - "e~=1 and e~=4 and e<9 then
//     s.q[i]=nil return" - which is the LIVE spelling of the class-B
//     convention, and e == 5 still appears nowhere: a handler that tested for
//     it would leak on a fast tap, which arrives as code 9 with no separate
//     lift. src/lib/catalog/touch-guard.spec.ts holds the convention.
//   - glp IS NEVER CALLED WITH A NEGATIVE PHASE. glp(n,l,-1) does nothing on
//     ZONA; every phase here is an explicit 0 or 255.
//   - NO KEEPER IS WRITTEN ON LAYER 1 AT ALL, and that is deliberate. The
//     column is a decay, and glt(a,1,65535) on a decaying layer is pitfall 1
//     exactly: the countdown is replaced, the fast rate keeps decrementing past
//     zero and wraps, and every swept cell strobes forever. The trail knob's
//     longest value is 63 ticks.
//
// THE HONEST LIMIT, for the card copy. Eight rows is eight voices, and the pad
// has no way to show you what the host is playing: there is no inbound MIDI in
// this phase (D-04), so the column tells you where the sequencer is, not where
// your DAW is.
//
// ROUTE: kind "lua", not kind "state". There is no sequencer anywhere in the
// PadState vocabulary - sends.kind is none | xy | zones | faders | trackpad |
// dial and not one of them has a clock.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 473 characters, Timer 251, both fixed
// points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
// GATE READS IS 479 / 253, leaving 429 free of 908 on the Setup and 655 on the
// Timer, and the all-shortest corner a picker can reach is 466 / 250.
//
// THAT CORNER IS NOT THE ONE THIS HEADER USED TO QUOTE, and the correction is
// plan 11-07's finding applied here. It read "391 / 253, leaving 517 free" -
// the all-longest corner of the DECLARED PALETTES. Since plan 10-08 the sweep
// writes any colour an RGB444 picker can (D-06), and @ARMC's longest declared
// literal is the eight-character "30,30,30" against the picker's eleven, so the
// binding corner was 394, not 391, and the entry had 514 free before this plan
// rather than 517. Fifteen other hand-authored entries are still unchecked for
// the same error; that is 11-16's row (f).
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// TWO SPACES WERE MEASURED OUT OF THE SETUP, not designed out. The readable
// form writes "self.p[n] and 255 or 0"; the pinned minifier emits
// "self.p[n]and 255 or 0" with no space, and both sites are stored that way.
// Storing the readable form would fail the canonical-form gate on its first run
// for a reason that has nothing to do with the configuration - the same finding
// SONAR's header records for "if s.v[n]then".
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.p={}self.q={}self.k=0 for n=0,63 do self.p[n]=n>55 and n%2==0 local a=glag(0,n%8+n//8*9)glc(a,1,@SWEEPC,1)glp(a,1,0)glc(a,2,@ARMC,1)glp(a,2,self.p[n]and 255 or 0)end self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then s.q[i]=nil return end local c=x*9//128 local r=y*9//128 local a=c+r*9 if s.q[i]==a then return end s.q[i]=e<9 and a if c>7 or r>7 then return end local n=c+r*8 s.p[n]=not s.p[n]glp(glag(0,a),2,s.p[n]and 255 or 0)end gtt(0,@TEMPO)";

const TIMER =
  "--[[@cb]]gtt(0,@TEMPO)local s=self local k=s.k%8 s.k=k+1 local q=(k+7)%8 for r=0,7 do if s.p[q+r*8]then s:gms(@CH,128,@NOTE+r,0,0)end end for r=0,7 do local a=glag(0,k+r*9)glpfs(a,1,252,256-252//@TRAIL,0)glt(a,1,@TRAIL)if s.p[k+r*8]then s:gms(@CH,144,@NOTE+r,100,0)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STEPS: CatalogEntry = {
  id: "steps",
  name: "STEPS",
  description:
    "Tap a cell to arm it and a bright column sweeps across, playing back the pattern you drew.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "drums" moves OFF this entry. The re-cut gives it to the two pads that are
  // drum pads and calls this one what it is, a sequencer. Moving the chip row
  // by adding a third carrier is exactly the derivation the re-cut retires.
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the cap (D-12) - each one literal token substitution over the
  // vendored compiler's own widget vocabulary (TUNE-01). Every default is the
  // INDEX of the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @TEMPO, @ARMC,
  // @SWEEPC, @TRAIL, @NOTE and @CH. renderLua substitutes by plain
  // String.replaceAll, so a token that is a prefix of another is eaten or
  // corrupted depending on knob order. No one of these six is a prefix of
  // another; @TEMPO and @TRAIL share only "@T".
  knobs: [
    {
      id: "tempo",
      label: "Step time",
      kind: "speed",
      token: "@TEMPO",
      // Milliseconds a column holds, so a full bar of eight is eight of these:
      // 120 is 0.96 s a bar, which is 125 bpm in eighths. Ordered slow to fast
      // so the display reads naturally as the knob turns. APPEARS IN BOTH
      // EVENTS - the Setup's first arm and the Timer's re-arm - and both must
      // move together, or the grid steps once at one rate and forever at
      // another.
      values: ["200", "150", "120", "90", "60"],
      default: 2,
    },
    {
      id: "armed",
      label: "Armed colour",
      kind: "colour",
      token: "@ARMC",
      // The armed cells, on layer 2, static. Deliberately dim: it is what the
      // sweeping column has to stay readable against. Every channel is inside
      // 0..255 - the firmware truncates rather than clamps, so 260 would render
      // as 4.
      values: ["0,40,60", "40,0,60", "60,30,0", "30,30,30"],
      default: 0,
    },
    {
      id: "sweep",
      label: "Column colour",
      kind: "colour",
      token: "@SWEEPC",
      // The sweeping column, on layer 1, bright. One layer can never exceed
      // 254/512 of the value asked for, so these are the loud end of the range
      // on purpose; the column is the thing the card is watched for.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,255,255"],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail length",
      kind: "feel",
      token: "@TRAIL",
      // Ticks of decay behind the column, at 10 ms a tick. EVERY VALUE DIVIDES
      // 252, because the rate is 256 - 252//@TRAIL and the phase starts at 252,
      // so the product is exactly 252 and the fade lands on exactly 0 at every
      // setting - see the header. NEVER A KEEPER: this layer carries a decaying
      // trail, and 65535 here would replace the countdown and strobe every
      // swept cell forever.
      values: ["12", "28", "42", "63"],
      default: 2,
    },
    {
      id: "note",
      label: "Lowest note",
      kind: "note",
      token: "@NOTE",
      // Row 0 plays this and row 7 plays this plus seven. 36 is the General
      // MIDI kick, so the default eight rows are 36..43 - the bottom of a
      // standard drum map. The largest value here is 60, and 60 + 7 = 67, well
      // inside the MIDI range.
      values: ["36", "48", "60", "24"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). Four channels, not sixteen - a sixteen-value channel knob alone
      // would add 16 combinations to the sweep for a choice nobody makes. The
      // default is 9, which is channel 10, where a drum machine listens.
      // APPEARS TWICE in the Timer, on the release and on the note-on, so a
      // step can never be released on a channel it was not played on.
      values: ["0", "1", "9", "15"],
      default: 2,
    },
  ],

  // The same six indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    tempo: 2,
    armed: 0,
    sweep: 0,
    trail: 2,
    note: 0,
    channel: 2,
  },

  // FALSE. Setup arms four cells of the bottom row and lights them at phase
  // 255, so tick 0 is already a picture. frames.spec.ts test 5 turns that
  // declaration into a checked fact.
  restsBlack: false,
};
