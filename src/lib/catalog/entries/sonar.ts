// SONAR - a radial 16-step sequencer, five voices deep.
//
// A polar sequencer. A sweep line rotates through 16 angle buckets, once every
// 1.12 s at the default period; tap any cell to arm it, and it fires when the
// sweep crosses it. The pitch comes from the cell's RING - its Chebyshev
// distance from the centre - and the time from its ANGLE, so the pad is a
// 16-step, 5-voice grid in polar coordinates: inner rings low, outer rings
// high, minor pentatonic by default. Nothing else on a desk sequences in a
// circle.
//
// The angle buckets come from EXACTLY the same math.atan(...)*41//1%256
// expression the vendored Pinwheel look uses, divided by 16, so the sweep's
// step boundaries line up with the swirl's own phase geometry rather than with
// a second, subtly different polar map.
//
// PENDING NOTE-OFFS ARE TRACKED, which is what stops a hung track. Every note
// the Timer starts goes into s.z, and the FOLLOWING fire releases the whole
// list before it plays anything new. There is no watchdog because there is no
// contact to watch: the notes are machine-driven, one step long by
// construction.
//
// THIS TIMER IS THE CANONICAL TEXT, NOT THE ONE PRINTED IN 08-RESEARCH.md.
// The research prints "if s.v[n] then"; the pinned minifier emits
// "if s.v[n]then" with no space, 280 raw characters collapsing to 279. Storing
// the printed form would fail the canonical-form gate on its first run for a
// reason that has nothing to do with the configuration. The form below is what
// compressScript produces and is a fixed point of it.
//
// THE TOKEN FOR THE SWEEP PERIOD IS @PERIOD, NOT @SWEEP. renderLua substitutes
// by plain string replacement, so a token that is a PREFIX of another token is
// eaten or corrupted depending on knob order - "@SWEEP" inside "@SWEEPC" would
// render the colour as "70C" - and lua-entries.sweep.spec.ts's per-event occurrence
// count would see two @SWEEP sites in the Setup where the knob only moves one.
// The period knob therefore carries @PERIOD. Its knob id is still "sweep";
// only the substitution token moved.
//
// THE PERIOD APPEARS IN BOTH EVENTS and both must move together: the Setup arms
// the first fire and the Timer re-arms every subsequent one, so a mismatch
// would tick once at one rate and then forever at another.
//
// A SWIPE ARMS EVERY CELL IT CROSSES, AND THE ONSET-ONLY GUARD IS DELIBERATELY
// REVERSED (plan 11-08). The callback opened with "e~=4 and e~=9 then return",
// so every MOVE was thrown away at the first line: measured through the real
// Lua host, a 128-sample swipe along row 4 armed exactly 1 cell, the one the
// finger landed on. That is the bench note "not precise enough". It now arms
// all nine.
//
// ACCEPTING MOVE ALONE WOULD HAVE BEEN WORSE THAN THE COMPLAINT. A MOVE
// arrives every 10 ms, so a finger resting inside one cell would arm and disarm
// it at 100 Hz - measured unguarded at 209 changes over 209 further samples.
// self.q[i] remembers the pad cell the contact last touched and swallows a
// repeat; the contact-end branch clears it so a fresh press on the same cell is
// not eaten.
//
// EVERY EVENT IS DEDUPED, AND THE FAST TAP ESCAPES BY STORING NOTHING. The
// store is "s.q[i]=e<9 and n", not the bare "s.q[i]=n" plan 11-08 sketched,
// and the eight characters that costs buy a real fix. Event code 9 is a whole
// contact in ONE message with no lift after it, so the contact-end branch never
// runs for a tap and under the bare store the SECOND fast tap on the same cell
// would find s.q[i] still holding it and be swallowed. Measured on the bare
// shape: three fast taps on one cell read 0 -> 255 -> 255 -> 255, a step that
// can be armed from the pad and never disarmed. "e<9 and n" evaluates to
// false for a tap, and false is never equal to a cell index, so the next tap
// always lands. src/lib/catalog/touch-guard.spec.ts holds the event-code
// convention the clear is written in.
//
// WHAT THE REVERSAL COSTS: a swipe that crosses a cell twice toggles it twice,
// so dragging back over your own stroke erases it. That is correct for a toggle
// and it is not what a paint gesture does; the set-rather-than-toggle
// alternative is named as an open bench question in euclid.ts rather than
// shipped as an interpretation.
//
// THE CENTRE IS ALWAYS LIT, ON LAYER 0, AND THE LAYER IS THE WHOLE POINT
// (plan 11-08). Cell 40 is the sweep's own pivot and it used to be the one
// cell on the pad with nothing to say. Setup now writes it in @SWEEPC on LAYER
// 0, which NEITHER the sweep nor the arming touch writes: the Timer writes
// layer 2 and armed cells are layer 1. Layer 1 would have been erased by the
// first tap on the centre. LAYER 2 IS THE INTERESTING WRONG ANSWER, because it
// looks right twice - the hub is lit at rest and lit under the sweep - and then
// the sweep's 42-tick decay runs it down to black with nothing to put it back;
// measured on that plant, [0,0,0] sixty ticks after the pass. On layer 0 the
// centre reads [59,126,126] at rest, [116,248,248] with the sweep on top of it
// because the LED engine ADDS layers, and [59,126,126] again once the trail
// expires. Cost: +52 characters, and +0 at the picker corner over a hard-coded
// white, since a colour token and 255,255,255 are the same eleven characters
// there.
//
// "NOTES SHOULD DISAPPEAR AFTER A WHILE" DESCRIBES SOMETHING THIS CARD ALREADY
// DOES, and that is reported rather than answered with a change. Of the two
// honest readings - a missing or mistimed note-off, or a note length that wants
// a shorter constant - the source supports the SECOND, and the constant is
// already at its floor. Every note the Timer starts goes into s.z and the
// FOLLOWING fire releases the whole list before playing anything: measured
// through the real Lua host at the defaults, three notes fired and three
// released, every one of them exactly 7 ticks later, which is one @PERIOD, and
// nothing left open after 400 ticks. One step is also the shortest gate this
// card can express, because it has one timer and its resolution IS one step.
// There is no constant to shorten and no bug to fix, so nothing was changed and
// the behaviour is now pinned by an assertion instead.
//
// THE THIRD READING IS A REAL DESIGN QUESTION AND IT IS LEFT AS ONE. The words
// could instead mean that the ARMED CELLS should fade, so a pattern you drew
// decays on its own. That is a much larger behaviour change - 81 per-cell
// countdowns with no spare table and no Timer budget for a second sweep of the
// grid - it is not what "notes should disappear" most naturally says, and it is
// MORE attractive after plan 11-08 than before it, because a swipe now arms
// nine cells where a tap armed one. It is a bench question, not a guess.
//
// CLOCK SYNC IS NOT BUILT, AND IT IS NAMED HERE RATHER THAN DROPPED. The bench
// asked to "include synchronization, clock sync"; two gates are shut and the
// second does not open when the first does. FIRST, the hardware answer is
// unknown: docs/MIDI-IN-PROBE.md is a written, minifier-checked pair of probe
// scripts for exactly this question whose Results section reads "None yet. This
// probe has not been run", and since gts is dead on ZONA and rtmrx_cb is the
// only clock route the hardware has, a NO on that probe CLOSES this family
// rather than redirecting it. SECOND, even a yes leaves the card
// UNPREVIEWABLE: HANGAR's Lua host has no inbound MIDI path of any kind - grxm
// is a recorded no-op that discards its slot argument, and neither midirx_cb
// nor rtmrx_cb is ASSIGNED or BOUND anywhere under src/, in a host binding or
// in a catalog entry's Lua, which is the grep that proves nothing here was
// stubbed - so a clock-locked SONAR would run on a real ZONA and sit
// motionless in its own catalog card. The prerequisite is a synthetic MIDI
// source and a synthetic clock in src/lib/sim/, which is a phase and not a
// task. Nothing here is stubbed, flagged or reserved against an answer nobody
// has: a knob held back "for later" is a stamp slot, and a stamp slot spent on
// a feature that may never exist is a link format nobody can take back.
//
// THE HONEST LIMIT, for the card copy: cells on the same ring share a pitch.
// That is the point rather than a compromise - ring is voice, angle is time.
//
// THE SWEEP'S DECAY PAIR IS THE HOUSE IDIOM AND MUST STAY THAT WAY (11-02).
// It shipped glpfs(a,2,255,250,0) with glt(a,2,42), and that pair can NEVER
// land on phase 0: glpfs walks the phase with `pha += fre` on a uint8_t, 255 is
// odd, the step 256 - 250 = 6 is even, so 255 - 6T is odd at every T and never
// reaches zero. Every cell the sweep touched froze part-way down and stayed
// permanently, faintly lit with nothing coming back to clear it.
//
// It now writes glpfs(a,2,252,250,0) - the same idiom at T = 42, since the step
// is 6, 6 x 42 = 252 and 252 - 252 = 0 exactly. THE TIMEOUT DID NOT MOVE,
// deliberately: the trail is the same 420 ms it always was and only the
// starting phase changed. Cost: +0 characters.
//
// AND THE RESIDUE WAS NOT INVISIBLE HERE, contrary to what 11-02 predicted.
// frames.json, which records an UNTOUCHED run, went 194 -> 96 lit bytes at tick
// 500 and 188 -> 78 at tick 1009. Roughly half the pad was permanent glow left
// behind by the sweep's own Timer, on a card nobody had to touch.
//
// src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
// list of usable timeouts, and it is CITED here rather than restated.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 558 characters, Timer 279, both fixed
// points of compressScript and both accepted by checkSyntax. THE CORNER THE 908
// GATE READS IS 559 / 282, leaving 349 free, and it is the RGB444 PICKER corner
// (D-06) rather than the all-longest corner of the declared palettes - the two
// coincide here only because @SWEEPC already declares 255,255,255, and plan
// 11-07 measured them 21 characters apart on CONSOLE. src/lib/catalog/
// lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self.a={}self.o={}self.v={}self.q={}local t={@RINGS}for n=0,80 do local c=glag(0,n)glc(c,1,255,60,120,1)glp(c,1,0)glc(c,2,@SWEEPC,1)glp(c,2,0)self.a[n]=(math.atan(n//9-4,n%9-4)*41//1%256)//16 local d=math.max(math.abs(n%9-4),math.abs(n//9-4))self.o[n]=@ROOT+t[d+1]end local h=glag(0,40)glc(h,0,@SWEEPC,1)glp(h,0,255)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then s.q[i]=nil return end local n=x*9//128+y*9//128*9 if s.q[i]==n then return end s.q[i]=e<9 and n s.v[n]=not s.v[n]glp(glag(0,n),1,s.v[n]and 255 or 0)end gtt(0,@PERIOD)";

const TIMER =
  "--[[@cb]]gtt(0,@PERIOD)local s=self local k=(s.k or 0)%16 s.k=k+1 if s.z then for j=1,#s.z do s:gms(@CH,128,s.z[j],0,0)end end s.z={}for n=0,80 do if s.a[n]==k then local a=glag(0,n)glpfs(a,2,252,250,0)glt(a,2,42)if s.v[n]then local m=s.o[n]s:gms(@CH,144,m,100,0)s.z[#s.z+1]=m end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SONAR: CatalogEntry = {
  id: "sonar",
  name: "SONAR",
  description:
    "A sweep turns like radar and fires the cells you armed: the ring is the pitch, the angle the time.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["sequencing", "generative", "playable"],
  featured: false,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  knobs: [
    {
      id: "rings",
      label: "Ring scale",
      kind: "scale",
      token: "@RINGS",
      // EXACTLY FIVE ENTRIES, always: a 9x9 grid has exactly five Chebyshev
      // rings and the Setup indexes this table with t[d+1] for d in 0..4. A
      // four-entry table would leave the outer ring nil and every cell on it
      // silent. Semitone offsets from the root, innermost first. The default is
      // minor pentatonic.
      values: [
        "0,3,5,7,10",
        "0,2,4,7,9",
        "0,2,4,6,8",
        "0,2,3,7,9",
        "0,1,5,7,10",
      ],
      default: 0,
    },
    {
      id: "root",
      label: "Root note",
      kind: "note",
      token: "@ROOT",
      // The innermost ring. The outermost is root + the last ring offset, so
      // the whole pad spans well under an octave and every value here leaves it
      // inside the MIDI range.
      values: ["24", "31", "36", "43", "48"],
      default: 2,
    },
    {
      id: "sweepColour",
      label: "Sweep colour",
      kind: "colour",
      token: "@SWEEPC",
      // Layer 2 - the rotating line and its 0.42 s wake. The armed-cell pink on
      // layer 1 underneath is fixed, because the sweep has to stay readable
      // against it. Every channel is inside 0..255: the firmware truncates
      // rather than clamps, so 260 would render as 4.
      values: [
        "120,255,255",
        "255,60,120",
        "0,255,140",
        "255,255,255",
        "180,0,255",
      ],
      default: 0,
    },
    {
      id: "sweep",
      label: "Sweep speed",
      kind: "speed",
      token: "@PERIOD",
      // Milliseconds per step, so a full revolution is sixteen of these: 70 is
      // 1.12 s and 160 is 2.56 s. TOKEN IS @PERIOD, not @SWEEP - see the header
      // on the prefix hazard - and it APPEARS IN BOTH EVENTS, the Setup's first
      // arm and the Timer's re-arm.
      values: ["40", "55", "70", "110", "160"],
      default: 2,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. It appears TWICE in the Timer -
      // the pending-note release and the note-on - so a step can never be
      // released on a channel it was not played on.
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

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    rings: 0,
    root: 2,
    sweepColour: 0,
    sweep: 2,
    channel: 0,
  },

  // FALSE, and since plan 11-08 it is false at TICK 0 too. It used to be true
  // in the narrow sense that both layers were coloured at Setup and left at
  // phase 0, so the very first frame was black and the sweep's first fire at
  // 70 ms lit a wedge seven ticks later. The always-lit centre now puts three
  // non-zero bytes into frames.json's tick-0 record - the hub, on layer 0 -
  // so nothing this card is sampled at reads black. frames.spec.ts test 5
  // turns that declaration into a checked fact.
  restsBlack: false,
};
