// GHOST - draw a curve once, and it loops until you take it back.
//
// A gesture looper. Hold a finger and drag: the pad records your path at 50 Hz
// while sending X and Y as a CC pair. Lift, and a ghost retraces exactly what
// you drew, forever, still sending. It is drawn automation with no DAW, no lane
// and no mouse.
//
// RE-AUTHORED FROM A BLANK PAGE IN PLAN 11-11, on the user's own words:
// "doesn't work reliably, the LED colors the pad and resetting is not reliable,
// need to redesign this from scratch". The promise did not change. The
// behaviour did.
//
// ---------------------------------------------------------------------------
// WHAT ITS RELIABILITY RESTS ON, IN TWO SENTENCES
// ---------------------------------------------------------------------------
//
// The class-B repair 11-02 made is what stops a fast tap producing nothing, and
// the class-A repair it made is what stops a crossed cell staying faintly lit
// forever - both are inherited, both are now gated, and neither is re-derived
// here. Everything else the bench reported rests on THIS file's new structure:
// the coalesced tap no longer arms a latch nothing clears, a second gesture no
// longer glues itself onto the first, and the reset is a lit key on the pad
// that stops the decays it clears instead of a second finger that restarted
// them.
//
// Which symptom each change answers, so the next bench run can tell the
// redesign from the gates:
//
//   "doesn't work reliably"        -> the code-9 latch (new, below) and
//                                     one-gesture-one-loop (new, below);
//                                     the class-B guard (inherited, 11-02)
//   "the LED colors the pad"       -> glpfs(a,l,0,0,0) as the clear (new);
//                                     the class-A landing (inherited, 11-02)
//   "resetting is not reliable"    -> the lit corner key (new, below)
//
// ---------------------------------------------------------------------------
// THE THREE THINGS THAT CHANGED, AND THE DEFECT EACH ONE CLOSES
// ---------------------------------------------------------------------------
//
// 1. THE RESET IS A LIT KEY ON THE PAD, NOT A SECOND FINGER.
//
//    The old erase was `if i>0 then if e==4 or e>8 then ...`: a second contact,
//    anywhere. Nothing on the pad said so, nothing showed it had happened, and
//    on a pad with no modifier a second finger is both undiscoverable and easy
//    to mistime. That is the specific thing the user called unreliable.
//
//    SCREEN CELL 80 - the bottom-right corner - is coloured 255,0,0 at Setup
//    and lit by the Timer whenever there is something to erase. Press it and
//    the recording is gone. THE KEY EXISTS EXACTLY WHEN IT IS LIT: with nothing
//    recorded the corner is dark and is an ordinary cell you may start a drag
//    on, so the pad never has a dead square and the visitor never presses a key
//    that does nothing.
//
//    It is red because red is the one colour a person reads as "this undoes
//    something" without being told, and because it must stay legible whichever
//    pair of colours the two colour knobs are set to - the erase key is a
//    function, not decoration, so it does not take the palette.
//
//    IT PULSES, ON A 280 ms CADENCE, and that is three things at once. It reads
//    as "act on me" where a steady cell reads as furniture; it puts the one
//    permanently-present light on this pad under the same class-A rule as
//    everything else; and it means the corner is a cell something is still
//    DRIVING rather than a cell left behind, which is the distinction
//    src/lib/sim/lua-smoke.spec.ts's residue probe draws. The pulse never
//    reaches black: the decay is armed for 42 ticks and re-armed after 28, so
//    the phase breathes 252 -> 84 and back.
//
// 2. ONE GESTURE IS ONE LOOP.
//
//    The old recorder APPENDED. `if s.n<@LEN then s.n=s.n+1 ...` ran on every
//    Timer tick a finger was down, whatever had been recorded before, so a
//    second drag was glued onto the end of the first and the only way back was
//    the second finger nobody could find. Two drags produced one incoherent
//    loop, which is "doesn't work reliably" as a user experiences it.
//
//    Every onset now clears the pad and starts a fresh recording at the point
//    it began. Draw, lift, watch; draw again, and you replace it. There is
//    exactly one recording and there is exactly one way to have none.
//
// 3. A COALESCED TAP NO LONGER ARMS A LATCH NOTHING CLEARS.
//
//    11-02 handed this forward by name: a code-9 tap set `s.h` and nothing ever
//    cleared it, because only a lift does and a coalesced tap has none. The old
//    card then recorded one frozen point forever and never entered playback.
//
//    The onset now ends with `s.h=e<9`, which is the whole fix and the whole
//    statement of it: a contact is live if and only if it is not a
//    press-and-lift in one message. A tap therefore records its one point and
//    goes straight to playback - tap a cell and that cell loops, which is a
//    real answer rather than a stuck one. This is QUADRANT's treatment of the
//    same event in its cheapest form; src/lib/catalog/touch-guard.spec.ts holds
//    the convention and cites QUADRANT as the worked example.
//
// ---------------------------------------------------------------------------
// THE CLEAR IS glpfs(a,l,0,0,0), AND glp(a,l,0) WAS THE BUG
// ---------------------------------------------------------------------------
//
// This is the mechanism behind "resetting is not reliable", derived from the
// engine rather than guessed. The old erase wrote `for a=0,80 do glp(a,1,0)end`
// - phase 0, and nothing else. But `glp` does not touch the RATE or the
// TIMEOUT, and grid_led_tick does `pha += fre` on every tick a timeout is still
// running (src/vendor/botor/pad-sim.ts:885-895, firmware grid_led.c:191-211).
// A cell mid-decay at rate 250 that is set to phase 0 is at phase 250 on the
// very next tick. THE OLD RESET RELIT EVERY CELL IT CLEARED, at 98 per cent
// brightness, and sent it down the decay again. It also never touched layer 2
// at all, so the ghost's own trail was outside the erase entirely.
//
// The clear is now `glpfs(a,1,0,0,0)` and `glpfs(a,2,0,0,0)` on all 81 cells:
// phase 0, RATE 0, shape 0. Rate 0 is the house idiom for taking a cell back
// from a decay it started earlier - decay-idiom.spec.ts skips it by name,
// because a layer that does not walk has no landing to check - and it is what
// makes "the reset leaves no cell lit" true at the next tick rather than 420 ms
// later.
//
// ---------------------------------------------------------------------------
// THE BUDGET, COSTED BEFORE THE ENTRY WAS WRITTEN (D-04)
// ---------------------------------------------------------------------------
//
// Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
// `await padReady()`, at the RGB444 PICKER CORNER - both colour knobs at
// 255,255,255 and every other knob at its longest declared value. That is the
// corner the 908 gate reads. GHOST's picker corner and its declared corner
// coincide, by the same accident ARC, MORPH and LUMEN have: both colour knobs
// already declare 255,255,255, so the two points are the same one. DO NOT read
// that as the norm - five entry headers in this catalog quote the wrong corner.
//
// Three reset gestures were sketched as Lua and MEASURED before a line of this
// entry was written:
//
//   A  a HELD press on the marked cell   Setup 533 / 375 free   Timer 571 / 337
//   B  ONE lit corner cell               Setup 478 / 430 free   Timer 422 / 486
//   C  a two-cell corner (79 and 80)     Setup 542 / 366 free   Timer 457 / 451
//
// ALL THREE FIT. B was chosen and it was not chosen because it is cheapest.
//
//   A answers "resetting is not reliable" with "and now you must also hold it
//   for the right length of time". A hold has no affordance: nothing on a pad
//   says how long, so the user has to already know, and a user who releases too
//   early has performed the failure the note is about. It also costs 149 more
//   Timer characters for a countdown, an abort path and a fill to render.
//   C doubles the area a drag can accidentally start on - two cells of 81
//   instead of one - and buys nothing: one lit red corner on an otherwise black
//   pad is already unmistakable. It is the more expensive of the two on Setup.
//
// SHIPPED: Setup 478 of 908 at the picker corner, 430 free; 475 at the
// defaults. Timer 422 of 908 at the picker corner, 486 free; 418 at the
// defaults. The all-shortest corner is not read by any gate and is not quoted.
//
// ---------------------------------------------------------------------------
// THE CONVENTIONS THIS ENTRY IS WRITTEN INSIDE, CITED AND NOT RESTATED
// ---------------------------------------------------------------------------
//
// CONTACT ENDED is `e==3 or e>=5 and e<9`; CONTACT STARTED is `e==4 or e>8`,
// and the brackets are absent because the chain is the whole condition here -
// `and` binds tighter than `or`, so a bare pattern copied into a larger
// expression needs them and this one does not.
// src/lib/catalog/touch-guard.spec.ts is the gate and the event table lives in
// src/vendor/botor/pad-sim.ts:228-241 and zona-docs ZONA_REFERENCE.md s4.6.
//
// EVERY DECAY LANDS ON PHASE 0. Both decaying pairs here are the literal house
// idiom at T = 42: `glpfs(a,l,252,250,0)` with `glt(a,l,42)`, step 6, 6 x 42 =
// 252, 252 - 252 = 0 exactly. src/lib/catalog/decay-idiom.spec.ts holds the
// rule, the arithmetic and the fifteen usable timeouts, and it is CITED here
// rather than restated. THIS ENTRY CARRIES NO ROW IN EITHER GATE'S EXCEPTION
// TABLE, which is the point of authoring a blank page after the gates exist.
//
// THE TIMER IS 20 ms AND IS RE-ARMED FIRST. `gtt(0,20)` opens the Timer body,
// so a tick that later raises still leaves the next one scheduled. Both the
// record and the replay advance one point per Timer tick, which is what makes
// the loop play back at the speed it was drawn - and it is why the recorder
// lives here rather than in the touch callback, whose enqueue is CHANGE-GATED
// per contact and would take fewer points from a slow drag than from a fast one.
// A motionless finger still records, which is correct.
//
// THE SECOND CC NUMBER IS "@CCX+1" RATHER THAN A LITERAL. Two characters, and
// the pair can never drift into a configuration that sends X on 16 and Y on
// some unrelated controller.
//
// ONE THING THE DESIGN COSTS AND IT IS SAID RATHER THAN HIDDEN: while a ghost
// is looping, cell 80 is the erase key, so a NEW drag cannot be started in the
// bottom-right corner without erasing first. One cell of 81, in the corner
// furthest from where a hand rests, and only while the key is lit. A comet or a
// ghost dot passing OVER cell 80 is unaffected - the key acts on an onset and
// on nothing else.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are fixed points of the pinned minifier and
// accepted by checkSyntax; src/lib/catalog/lua-entries.sweep.spec.ts asserts
// both across the whole five-knob cross-product.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,1,@RECC,1)glp(a,1,0)glc(a,2,@GHOSTC,1)glp(a,2,0)end local k=glag(0,80)glc(k,1,255,0,0,1)self.k=k self.g={}self.n=0 self.j=0 self.p=0 self.touch_cb=function(s,i,e,x,y)if i>0 then return end if e==4 or e>8 then for a=0,80 do glpfs(a,1,0,0,0)glpfs(a,2,0,0,0)end s.j=0 s.p=0 s.h=nil if s.n>0 and x*9//128+y*9//128*9==80 then s.g={}s.n=0 else s.g={x*128+y}s.n=1 s.h=e<9 end end if e==3 or e>=5 and e<9 then s.h=nil end s.x=x s.y=y end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self local x,y if s.h then x=s.x y=s.y if s.n<@LEN then s.n=s.n+1 s.g[s.n]=x*128+y end s.j=0 elseif s.n>0 then s.j=s.j%s.n+1 local v=s.g[s.j]x=v//128 y=v%128 end if x then s:gms(@CH,176,@CCX,x,0)s:gms(@CH,176,@CCX+1,127-y,0)local a=glag(0,x*9//128+y*9//128*9)local l=s.h and 1 or 2 glpfs(a,l,252,250,0)glt(a,l,42)end if s.n>0 then s.p=s.p%14+1 if s.p==1 then glpfs(s.k,1,252,250,0)glt(s.k,1,42)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const GHOST: CatalogEntry = {
  id: "ghost",
  name: "GHOST",
  description:
    "Drag once and a ghost retraces your path forever, still sending; the red corner takes it back.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  //
  // UNCHANGED BY THE REDESIGN, AND CHECKED RATHER THAN ASSUMED. The card is
  // still a record-and-replay gesture pad, so what it is FOR did not move -
  // and "expressive" and "generative" both sit above the FEELS floor of 6
  // while "precise" and "still" sit exactly ON it after 11-01, so a tag moved
  // off this entry could only cost and never pay.
  tags: ["modulation", "generative", "expressive"],
  featured: false,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // THE RACK IS BYTE-IDENTICAL TO THE ONE THIS ENTRY REPLACES, DELIBERATELY.
  // Five knobs with 5, 5, 5, 4 and 16 values is shape character `6`
  // (5 * 7 + 35 = 70, 70 mod 32 = 6), and every GHOST link anyone has ever
  // shared decodes against it. POMODORO spent that tripwire in 11-09 - two
  // appended values took its shape from `n` to `p` and demoted a captured
  // stamp from `restored` to `older` - and a rewrite is exactly where a rack
  // drifts without anybody deciding to move it. Measured before and after.
  knobs: [
    {
      id: "recordColour",
      label: "Recording colour",
      kind: "colour",
      token: "@RECC",
      // Layer 1 - the comet that follows your own finger. Every channel is
      // inside 0..255 on purpose: the firmware truncates rather than clamps, so
      // 260 would render as 4 and turn a bright comet nearly black with no
      // warning. The erase key is on this layer too and does NOT take this
      // colour: Setup writes cell 80 red after the loop, so the key stays
      // legible at every setting of both colour knobs.
      values: [
        "0,255,180",
        "0,200,255",
        "255,140,0",
        "120,255,0",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "ghostColour",
      label: "Ghost colour",
      kind: "colour",
      token: "@GHOSTC",
      // Layer 2 - the replay. Keep it clearly different from the recording
      // colour: telling your hand from its ghost is the entire point of there
      // being two layers.
      values: [
        "255,80,255",
        "255,140,0",
        "0,200,255",
        "180,255,255",
        "255,255,255",
      ],
      default: 0,
    },
    {
      id: "loopLength",
      label: "Loop length",
      kind: "size",
      token: "@LEN",
      // Recorded samples, at 20 ms each, so 250 is five seconds and 60 is one
      // and a fifth. NONE of these may exceed 250: the recorder writes into
      // s.g while the replay walks it modulo s.n, and a cap larger than the
      // table the loop replays would be a longer recording than the loop can
      // play. A drag that runs past the cap keeps sending and stops recording -
      // the loop is the first @LEN points, not the last.
      values: ["60", "120", "180", "220", "250"],
      default: 4,
    },
    {
      id: "cc",
      label: "CC pair",
      kind: "amount",
      token: "@CCX",
      // X is sent on this number and Y on the one above it - the template
      // writes the second as "@CCX+1", so the two can never drift apart. Every
      // value here leaves the pair inside the 0..127 controller range.
      values: ["16", "20", "74", "102"],
      default: 0,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. This token appears twice in the
      // Timer, once for each half of the CC pair, so both always leave on the
      // same channel.
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
    recordColour: 0,
    ghostColour: 0,
    loopLength: 4,
    cc: 0,
    channel: 0,
  },

  // TRUE, AND RE-DERIVED FROM THE REGENERATED FIXTURE RATHER THAN CARRIED OVER.
  // Both layers are COLOURED at Setup and left at phase 0, and glc's sixth
  // argument forces the minimum stop black, so a sampler that never touches the
  // pad reads an all-zero frame at every tick. The erase key does not change
  // that: it is coloured at Setup but only LIT by the Timer, and the Timer
  // lights it only while there is a recording to erase - so an untouched GHOST
  // is still black and a GHOST with nothing recorded has no key showing.
  // frames.spec.ts test 5 is what turns that declaration into a checked fact,
  // in both directions.
  restsBlack: true,
};
