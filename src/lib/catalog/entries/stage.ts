// STAGE - nine scenes for a stream, over plain keystrokes.
//
// Nine big zones, one per scene. The live one glows; the one you are LINING UP
// breathes on the idle base; the one under your finger breathes fastest while
// you hold it. It works on a machine with NOTHING INSTALLED -
// no plugin, no bridge, no MIDI mapping - because OBS scene switching is a
// plain global hotkey and a ZONA can press one. USE-CASES.md V5 calls that the
// cheapest configuration on the whole slate to build, and it is HANGAR's
// thesis in one card: plug it in, and it works.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - Nine 3x3 zones. Zone z has zone-row z//3 and zone-column z%3, so its
//     top-left cell is z//3*27 + z%3*3 and its FOUR CORNERS are that cell plus
//     0, 2, 18 and 20. The loop writes j = 0..3 and offsets by
//     j%2*2 + j//2*18, which is those four numbers in that order.
//   - Only the corners are painted, never the nine cells: four corners read as
//     a countable BOX at arm's length, and a filled 3x3 block reads as a
//     smear. Thirty-six lit cells at rest, not eighty-one, and the card is
//     legible in a thumbnail.
//   - A finger's zone is x*3//128 + y*3//128*3, so the zone under the finger
//     is found in two divisions and no search. +y RUNS DOWN, so zone 0 is the
//     TOP-LEFT one and the numbering reads the way an operator would count.
//   - self.l is the live zone. On onset the handler repaints AT MOST TWO
//     ZONES - the old live one back to idle, the pressed one to @LIVEC - and
//     never the pad. Eight cells, not eighty-one.
//   - self.p is the LINED-UP zone, and "nothing is lined up" is spelled
//     `self.p == self.l` rather than with a sentinel. That is not a saving for
//     its own sake: it makes CUTTING TO THE LINED-UP SCENE clear the line-up
//     for free, because the assignment `s.l = z` on a zone that was already
//     `s.p` makes the two equal in the same step. Setup opens with both at 0.
//   - Z(z, f, g) is the whole painter and it takes TWO independent axes,
//     because the third state is a mix of the other two. `f` is a layer-1
//     RATE: 0 paints black and stands still, f > 0 paints @LIVEC and arms a
//     breathe at rate f. `g` is the layer-2 BASE: 0 is @ZONEC, 1 is @LIVEC.
//     The three states are therefore
//
//       idle      Z(z, 0,  0)   dim @ZONEC base, still
//       lined up  Z(z, 10, 0)   dim @ZONEC base, @LIVEC pulsing through it
//       live      Z(z, 4,  1)   @LIVEC base, @LIVEC breathing slowly over it
//       (held)    Z(z, 24, 1)   the live box while a finger is on it
//
//     Layers SUM before the single divide by 512 (pad-sim.ts render), so the
//     lined-up box really is the idle box with a live-coloured pulse washing
//     through it - and its FLOOR is the idle floor exactly, which is the half
//     of the design that says "not on air". Measured at the defaults over 512
//     ticks: idle 248 constant, lined up 248..836, live 580..1168.
//   - The Timer refreshes the LIVE and LINED-UP zones' four layer-1 TIMEOUTS
//     every 2560 ms and does nothing else. R(z) is called twice; when nothing
//     is lined up the two calls name the same zone and the second is a
//     harmless repeat of the first, which is cheaper than guarding it. See the
//     trap about re-issuing glpfs below.
//
// THE KEYSTROKE, ONE CALL, AND ITS ARITY.
//
//   gks(10, 1,1,@MOD, 0,2,@KEY0+z, 1,0,@MOD)
//
// One leading default delay of 10 ms, then THREE TUPLES: modifier down, key
// DOWN-THEN-UP, modifier up. Ten arguments, and firmware rejects the call
// unless (nargs - 1) % 3 == 0: (10 - 1) % 3 = 0. A REJECTED gks IS SILENT, so
// that arithmetic is checked here rather than discovered at a bench.
//
// STATE 2 IS WHAT KEEPS IT TO ONE CALL. gks costs 10 + 4n bytes of the
// 256-byte per-cycle protocol buffer, so about sixty-one key steps fit in one
// 10 ms cycle and a chatty handler starves everything else that cycle. Three
// tuples is thirty-two bytes and one press can never come close.
//
// @KEY0 + 8 < 256 AT EVERY KNOB VALUE, because nine adjacent usage ids are
// sent. The four values and their tops: 104 -> 112 (F13..F21), 30 -> 38
// (1..9), 58 -> 66 (F1..F9), 89 -> 97 (keypad 1..9). Every one of those blocks
// is contiguous in the USB HID Usage Tables' Keyboard/Keypad page (0x07), and
// each was read off that table rather than remembered - a wrong usage id is a
// card that presses the wrong key on somebody's machine and NO GATE IN THIS
// REPOSITORY CAN CATCH IT.
//
// @MOD IS A USAGE ID OR ZERO. 224 is left control, 225 left shift, 226 left
// alt, all from the same page. At @MOD = 0 the two modifier tuples send usage
// id 0, which that page defines as "no event indicated" - wasted but harmless.
// Measured: branching on @MOD to emit a four-argument gks instead costs 35
// MORE characters of Setup than the two dead tuples, and saves eight bytes of
// a 256-byte buffer on a call that happens once per press. The dead tuples
// ship.
//
// THE LINED-UP STATE WAS DESCRIBED, SHIPPED IN THE COPY, AND NEVER BUILT.
// src/lib/catalog/listing.ts has carried "the live one glows and THE ONE YOU
// ARE LINING UP BREATHES" since phase 9, while this file carried only live and
// held. The bench note "Lining up breathing is missing" is therefore not a
// regression report - the state never existed. This is AUTHORING WORK WITH A
// BUDGET COST against copy that was already written, and the answer that
// commissioned it is recorded verbatim in
// .planning/phases/11-bench-corrections/11-09-ANSWERS.md: "implement breathing
// as planned".
//
// listing.ts IS DELIBERATELY UNCHANGED BY THAT WORK, and its absence from the
// diff is the point rather than an oversight: the sentence it already carries
// describes exactly what now ships, and the shipped gesture does not make it
// inaccurate in any new way - it says WHAT the pad shows, never how a scene is
// selected. The `description` field in this file is the same sentence and moves
// with it or not at all; listing.spec.ts is the gate that asserts the two agree.
//
// THE SELECTION GESTURE: THE SLIDE, AND THE THREE THAT WERE REJECTED.
// A third state needs a second gesture on a nine-zone pad with no modifier key,
// and the pad is already spoken for: `e==4 or e>8` cuts and fires the
// keystroke, `e>=5` settles the live zone back down. Four candidates were
// costed and three were rejected FOR MEASURED REASONS, not for taste.
//
//   - CHOSEN - THE SLIDE. Event code 1 (MOVE) reached NO branch of this
//     handler before now: a finger that pressed and then dragged did nothing
//     after the initial cut. So a slide onto another zone lines that zone up,
//     and THE CUT PATH IS NOT TOUCHED AT ALL - press still cuts, on both
//     arrival codes, exactly as an installed card already behaves. It is the
//     only candidate that adds a state without reversing a behaviour, it is
//     deterministic from the operator's side, and it is reachable in the
//     browser preview with a mouse, which is what PREV-01 asks of a headline
//     gesture. The price is stated rather than hidden: a finger that rolls
//     across a zone boundary during a press lines up a scene nobody asked for.
//     That is visible, costs nothing on air - lining up never sends a
//     keystroke, asserted in lua-smoke.spec.ts - and clears on the next slide.
//   - REJECTED - THE TAP-VERSUS-HOLD DISCRIMINATION THIS CARD ALREADY
//     COMPUTES. `Z(z, e>8 and 4 or 24)` already tells a coalesced DOWNUP from
//     a held press, so mapping one to "cut" and the other to "line up" costs
//     nothing in characters. It is rejected because it is EXACTLY THE
//     DISCRIMINATION THE CLASS-B GATE EXISTS TO FORBID. Measured: gating the
//     gks on `e==4` turns lua-smoke.spec.ts's fast-tap-against-slow-tap test
//     red at stage with "fast tap sent 0 message(s), slow tap sent 1", and
//     shipping it would mean adding a PARITY_ALLOWANCES row. And the reason
//     that gate exists applies here in full: whether one quick tap arrives as
//     4-then-5 or as a coalesced 9 depends on sub-cycle timing the operator
//     cannot control, so the same physical gesture would sometimes cut and
//     sometimes not. On a card that switches a live camera feed that is not a
//     trade-off, it is a fault.
//   - REJECTED - A SECOND CONTACT. STAGE is the one entry in this catalog
//     whose touch_cb does not reject i > 0, so this looked free. MEASURED, in
//     both directions the plan asked for: a second contact IS deliverable -
//     touch_cb sees i = 0, 1, 2 for three contacts through the real Lua host,
//     and the shipped src/lib/sim/touch.ts allocates slots 0, 1, 2 for three
//     pointers (MAX_CONTACTS = 5). It is rejected for the reason downstream of
//     that: A MOUSE HAS EXACTLY ONE POINTER. Coverflow.svelte maps one
//     pointerId to one contact, so a visitor driving the preview with a mouse
//     can never perform it - and the multi-touch audience that could is the
//     audience Web Serial cannot reach anyway (no iOS browser has it, and
//     Chrome on Android only exposes Bluetooth RFCOMM ports, never a USB
//     ZONA). A headline gesture invisible in the browser is the failure
//     PREV-01 exists to prevent.
//   - REJECTED - A LONG PRESS. The conventional answer, and the one that costs
//     something other than characters: STAGE's only clock is its Timer, and
//     the Timer's period is PINNED AT 2560 MS by the trap below - 256 ticks,
//     a whole number of phase cycles. The cheapest threshold it can express is
//     therefore 2.56 s with 2.56 s of jitter, and buying a usable half-second
//     threshold means shortening the period, which re-opens the glpfs re-issue
//     question that trap closed. It would also have to defer the cut until the
//     press resolved, which puts latency on the one thing this card must do
//     instantly.
//
// NO KNOB WAS ADDED, AND THAT WAS A CONSTRAINT RATHER THAN AN OUTCOME.
// share/stamp.ts's `shapeOf` sums a rack's option counts, so a fifth knob - a
// lined-up colour, say - would move STAGE's shape character and demote every
// STAGE link ever shared from `restored` to `older`. The lined-up state's
// colour is drawn entirely from the existing @LIVEC and @ZONEC, and the knob
// array is the same four knobs of four values it has always been.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints nine idle boxes in
// @ZONEC and one live box in @LIVEC, and the live box breathes from the first
// tick, so the card arrives with thirty-six lit cells and one of the nine
// alive. That is also why the declared motion is `animated` rather than
// `static`: the rate is armed in Setup, not by a finger.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE gks ARITY RULE, above. (10 - 1) % 3 = 0, checked for the exact call
//     shipped, not for a call shaped like it.
//   - @KEY0 + 8 < 256 AT EVERY KNOB VALUE, above.
//   - THE DEFAULT DELAY IS 0..255 ONLY. It ships as the literal 10 and is not
//     a knob; a value above 255 would be truncated by firmware into a delay
//     nobody asked for.
//   - CODE 9 IS HANDLED, AND IT IS THE WHOLE CARD. A fast tap arrives as a
//     single DOWNUP 9 with no separate press or lift, so the fire test is
//     `e == 4 or e > 8` and a branch written against e == 5 would miss every
//     fast scene change. A DOWNUP also has NO LIFT BEHIND IT, so it settles
//     the zone to the slow rate immediately (`e>8 and 4 or 24`) rather than
//     leaving a zone breathing fast forever with no gesture that can clear it.
//   - THE KEEPER IS 30000 ON LAYERS WHOSE RATES ARE 4, 10 AND 24, and that is
//     LEGITIMATE - DO NOT FIX IT. Pitfall 1 is a keeper on a layer carrying a
//     DECAY; all three of this card's rates sit an order of magnitude below
//     the rate floor the guard discriminates on, and every one of them paints
//     a continuous breathe rather than a trail that has to reach black. The
//     three are far enough apart to READ as three states - 4, 10 and 24 turn
//     over 8, 20 and 48 times in 512 ticks, and 10 is close to the geometric
//     mean of its two neighbours, so it is as distinguishable from the slow
//     one as from the fast one. lua-smoke.spec.ts asserts the SEPARATION and
//     never the rates, so re-tuning is free and collapsing is not.
//   - THE TIMER REFRESHES glt AND DOES NOT RE-ISSUE glpfs. A glpfs re-issue
//     writes phase 0, and the phase a cell is at when the Timer fires depends
//     on when the FINGER armed it, not on the Timer's period - so a re-issue
//     snaps the breathe back to black mid-breath at an arbitrary moment.
//     Refreshing the timeout alone is what the 655 s firmware ceiling actually
//     needs: the countdown never approaches its end, so the rate is never
//     zeroed and nothing freezes. The period is 2560 ms - 256 ticks, HOLD's
//     number - because a whole number of phase cycles is the one period at
//     which a re-issue would have been invisible, and keeping it means the
//     choice above is a preference rather than a necessity.
//   - THE LINED-UP ZONE NEEDS THAT REFRESH TOO, and this is the one place the
//     third state is not free. 30000 is 300 seconds, so a scene lined up and
//     left alone for five minutes would simply stop breathing. The Timer's
//     single loop became R(z) and is called for BOTH zones; it did not gain a
//     glpfs, which is the trap directly above.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every value of
//     @LIVEC and @ZONEC is inside 0..255 by construction.
//   - NO DECAY ANYWHERE. The stored Lua of both events holds no glf and no
//     65535; that claim is made about the SETUP AND TIMER STRINGS and not
//     about this file, because a header that names a trap number contains it
//     and a grep over the file counts itself.
//
// THE HONEST LIMIT, for the card copy - and it is A NEW KIND OF LIMIT FOR THIS
// CATALOG. HANGAR CANNOT SHOW A KEYSTROKE ARRIVING. gks is recorded and inert
// in the browser: src/lib/sim/lua-host.ts binds it to recordHid and says at
// :429 that nothing in HANGAR consumes them. This card therefore animates
// perfectly in a browser while the keystroke - the entire point of it - is a
// claim the simulator does not check. The description promises the PICTURE and
// never the result, and row 23 of docs/HARDWARE-AUDITION.md is the only place
// the wire can be checked. Every keystroke configuration in this catalog is
// unverified until that row is run.
//
// ROUTE: kind "lua", not kind "state". THE ONLY HID IN THE `sends` VOCABULARY
// IS `sends.kind: "trackpad"`, which is a mouse - `gmms` and `gmbs`, a
// relative pointer and a button bitmask. There is no keyboard anywhere in
// PadState, in either branch of the sends sheet, and no field of any kind
// carries a usage id. A configuration whose whole output is keystrokes is
// outside the compiler's vocabulary by absence, not by a type.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 640 characters, Timer 136, both fixed
// points of compressScript and both accepted by checkSyntax.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE CORNER THIS ENTRY IS COSTED AT IS THE RGB444 PICKER CORNER, AND THE
// FIGURE THIS HEADER CARRIED UNTIL PLAN 11-09 WAS THE WRONG ONE. D-06 lets a
// colour picker write any of the 4,096 RGB444 literals into a colour token, and
// 255,255,255 is eleven characters against this card's longest DECLARED literal
// of nine. STAGE declares two colour knobs and @LIVEC reaches two sites, so the
// declared corner and the picker corner sit seven characters apart - and the
// picker one is what the 908 gate reads. Measured, all four corners, before and
// after the lined-up state:
//
//                                       before        after
//   defaults                          505 / 109     640 / 136
//   all-longest DECLARED palettes     511 / 109     646 / 136
//   RGB444 PICKER (D-06) - the gate   518 / 109     653 / 136
//   all-shortest a picker can reach   495 / 109     630 / 136
//
// So the work was costed against 390 free and leaves 255 free: +135 on the
// Setup and +27 on the Timer. THE HEADER PREVIOUSLY QUOTED 511 / 397, which is
// the declared corner and is seven characters optimistic; the plan that
// commissioned this work quoted 505 with 399 free, which is neither corner and
// does not even agree with itself (908 - 505 is 403). STAGE IS THE FIFTH ENTRY
// FOUND QUOTING THE DECLARED CORNER, after CONSOLE, FORGE and STEPS (plan
// 11-07) and POMODORO (plan 11-09 task 01). Fifteen entry headers were never
// checked and all five found so far were wrong in the dangerous direction; the
// running count is 11-16's.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// STAGE IS A DECLARED EXCEPTION TO THE CLASS-B GATE, AND IT IS NOT A HOLE
// (plan 11-02). Setup writes
// "if e==4 or e>8 then ... elseif e==1 then ... elseif e>=5 then ... end".
// The elseif has no upper bound, which is the exact shape
// src/lib/catalog/touch-guard.spec.ts test 1 forbids - but code 9 satisfies the
// FIRST branch and never reaches it, so the guard is correct because of the
// chain around it rather than because of its own text. A scan of the text alone
// cannot see that, so the row is declared in DECLARED_EXCEPTIONS with that
// reason, keyed on the whole branch clause; write the same comparison as a
// standalone "if" and the gate goes red, which is the difference between a
// declared exception and a per-file amnesty.
//
// THE LINED-UP BRANCH SITS BETWEEN THE TWO AND DOES NOT DISTURB EITHER. The
// DECLARED_EXCEPTIONS row is keyed on the clause "elseif e>=5", which is
// unchanged, and its stated reason is that the branch is PRECEDED IN THE SAME
// IF-CHAIN by "if e==4 or e>8" - still true, and not weakened by an interposed
// clause, because code 9 still satisfies the first branch and still never
// reaches either of the later ones. DECLARED_EXCEPTIONS stays at two rows. The
// new clause names code 1, which touch-guard.spec.ts classifies as a LIVE test
// and correctly leaves alone: a coalesced tap is not a move.
//
// STAGE also USES the code rather than merely tolerating it: Z(z,e>8 and 4 or
// 24,1) lights the zone at rate 4 for a fast tap and 24 for a held press.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local function Z(z,f,g)local r=z//3*27+z%3*3 for j=0,3 do local a=glag(0,r+j%2*2+j//2*18)if f>0 then glc(a,1,@LIVEC,1)glpfs(a,1,0,f,3)glt(a,1,30000)else glc(a,1,0,0,0,1)glp(a,1,0)glt(a,1,0)end if g>0 then glc(a,2,@LIVEC,1)else glc(a,2,@ZONEC,1)end glp(a,2,255)end end for z=0,8 do Z(z,0,0)end Z(0,4,1)self.l=0 self.p=0 self.touch_cb=function(s,i,e,x,y)local z=x*3//128+y*3//128*3 if e==4 or e>8 then if z~=s.l then Z(s.l,0,0)s.l=z end Z(z,e>8 and 4 or 24,1)gks(10,1,1,@MOD,0,2,@KEY0+z,1,0,@MOD)elseif e==1 then if z~=s.l and z~=s.p then if s.p~=s.l then Z(s.p,0,0)end s.p=z Z(z,10,0)end elseif e>=5 then Z(s.l,4,1)end end gtt(0,2560)";

const TIMER =
  "--[[@cb]]gtt(0,2560)local function R(z)local r=z//3*27+z%3*3 for j=0,3 do glt(glag(0,r+j%2*2+j//2*18),1,30000)end end R(self.l)R(self.p)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STAGE: CatalogEntry = {
  id: "stage",
  name: "STAGE",
  description:
    "Nine scenes for your stream: the live one glows and the one you are lining up breathes.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "streaming" and "hotkeys" were both coined here and both retire. Nine
  // scenes you fire and watch is what "clips" and "playable" mean, and it puts
  // this card on the same shelf as GRIDLOCK, which is where a visitor looking
  // for either would look.
  tags: ["shortcuts", "playable", "readable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @KEY0, @MOD, @LIVEC
  // and @ZONEC. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these four shares even a first letter with another.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY0",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST
      // of nine contiguous ones: F13 (104..112), digit 1 (30..38), F1 (58..66)
      // and keypad 1 (89..97). F13 is the default because F13..F24 exist on no
      // keyboard, so OBS can own them without colliding with anything the
      // machine already binds.
      values: ["104", "30", "58", "89"],
      default: 0,
    },
    {
      id: "modifier",
      label: "Modifier",
      kind: "mode",
      token: "@MOD",
      // A modifier usage id from the same page, or 0 for none: 224 left
      // control, 226 left alt, 225 left shift. Sent as its own down tuple
      // before the key and its own up tuple after it.
      values: ["0", "224", "226", "225"],
      default: 0,
    },
    {
      id: "live",
      label: "Live colour",
      kind: "colour",
      token: "@LIVEC",
      // The live scene, on both layers. Red first, because a red tally light
      // is what "on air" means everywhere a camera has ever pointed.
      values: ["255,40,0", "255,0,120", "0,255,120", "255,180,0"],
      default: 0,
    },
    {
      id: "zone",
      label: "Idle colour",
      kind: "colour",
      token: "@ZONEC",
      // The eight scenes that are not live, on layer 2 only. Deliberately dim:
      // they are a map of where the zones are, not data, and a bright idle box
      // would compete with the one box that matters.
      values: ["40,40,50", "50,40,30", "30,50,40", "50,30,50"],
      default: 0,
    },
  ],

  // The same four indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    key: 0,
    modifier: 0,
    live: 0,
    zone: 0,
  },

  // FALSE. Setup paints thirty-six corner cells - nine boxes - and one of them
  // is live and breathing from the first tick. frames.spec.ts test 5 turns
  // that declaration into a checked fact.
  restsBlack: false,
};
