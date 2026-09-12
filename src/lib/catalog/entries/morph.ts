// MORPH - four macros in the corners, one finger between them.
//
// A four-corner macro morph pad. Each corner owns one CC; your finger's
// position is blended bilinearly into four weights that always sum to the full
// range. Park in a corner and that macro is at 127 and the other three at 0;
// sit in the middle and all four sit at a quarter. It is the paradigm players
// already know from Kaoss pads, NI morph pads and Ableton macro racks, and
// mapping four consecutive CCs is the easiest MIDI-learn job there is.
//
// EACH CORNER'S BRIGHTNESS IS ITS OWN WEIGHT, so the mix is readable across a
// room. The four 3x3 corner blocks - 2x2 until plan 12-09 - get four distinct
// hues out of one arithmetic expression, 255-j*spread, j*spread, 128, which is
// why four coloured corners cost the budget almost nothing. @SPREAD APPEARS TWICE in that expression and
// both sites must be substituted, or the four corners stop being four hues.
//
// MORPH HAS NO TIMER, AND THAT IS THE RIGHT ANSWER RATHER THAN AN OMISSION.
// Its only animation is a per-touch decay, which is self-limiting: the cells
// under your finger are handed glpfs(a,2,252,256-252//@DECAY,0) plus
// glt(a,2,@DECAY) and then die on their own. There is nothing for a Timer to
// advance - which is also why nothing was ever coming back to clear the cells
// the old pair left stranded. See the class-A note below.
//
// DO NOT ADD THE STANDARD KEEPER. The reflex is to write
// "for a=0,80 do glt(a,L,65535) end" into a Timer so a layer never expires.
// Applied to THIS layer it is pitfall 1 exactly: the 42-tick countdown is
// replaced by 65535, the decay rate of 250 keeps decrementing past zero and
// wraps, and every touched cell strobes forever. The smoke gate's pitfall-1
// guard - a keeper-height timeout together with a fast decay rate - would catch
// it, but this comment exists so nobody writes it in the first place.
//
// The empty Timer needs no special case anywhere in the gate, and none was
// added: compressScript("") is "" (already a fixed point) and checkSyntax("")
// is true, both measured at the pin. createLuaPadSim maps the catalog's
// always-a-string shape onto LuaHost's undefined, so MORPH cannot arm a timer
// at all - which is what firmware does too, since gtt is a no-op until the
// Timer event holds at least one stored action.
//
// THE COMET'S DECAY PAIR IS THE HOUSE IDIOM, AND @DECAY'S VALUES ARE PART OF
// IT (plan 11-02). Setup shipped glpfs(a,2,255,250,0) with glt(a,2,@DECAY), and
// that pair can NEVER land on phase 0 at any value: glpfs walks the phase with
// `pha += fre` on a uint8_t, 255 is odd, the step 256 - 250 = 6 is even, so
// 255 - 6T is odd at every T. Re-choosing @DECAY could not have fixed it - the
// STARTING PHASE had to move. Measured in the simulator, every crossed cell was
// left at rgb [47,66,66] forever, and MORPH HAS NO TIMER, so nothing was ever
// going to repaint it. That is the bench report "the LED's colors stuck again".
//
// It now writes glpfs(a,2,252,256-252//@DECAY,0), the parameterised house idiom
// steps.ts and cull.ts already ship: start at 252, step 252//T, land on
// 252 - T*(252//T) = 0 whenever T is an EXACT DIVISOR of 252. Cost: +8
// characters at the defaults, +9 at the all-longest corner.
//
// @DECAY'S VALUES MOVED WITH IT, AND A SHARED LINK IS THE PRICE. 20, 80 and 120
// do not divide 252, so they became 21, 84 and 126 - the nearest legal value to
// each, same arity, still ascending, 42 already legal and untouched. A stamp
// encodes the knob's INDEX, not its value, so every link anybody has ever
// shared still decodes and still restores; a link carrying index 3 now renders
// a 1260 ms trail where it used to render a 1200 ms one. stamp.spec.ts compares
// indices and stays green either way, so no test says this out loud and this
// comment does.
//
// src/lib/catalog/decay-idiom.spec.ts holds the rule, the arithmetic and the
// list of usable timeouts, and it is CITED here rather than restated.
//
// MORPH'S BENCH NOTE HAS THREE CLAUSES. "mapping mode needed in, if something
// doesn't change don't send it don't send 0 value, also the LED's colors stuck
// again" - the stuck colours are the class-A fix above and the class-B fix
// below (plan 11-02); the SUPPRESSION is the section immediately following
// (plan 11-08); and "mapping mode" was a question at 11-09's checkpoint
// because it admitted several readings. IT IS ANSWERED NOW, in the section
// below on the corner tap (plan 11-09.1). All three clauses are closed.
//
// ---------------------------------------------------------------------------
// A CORNER TAP SPEAKS FOR ONE CORNER (plan 11-09.1)
// ---------------------------------------------------------------------------
//
// The user answered "mapping mode needed in" with "when you tap morphs corners
// it should only send one MIDI message"
// (.planning/phases/11-bench-corrections/11-09-ANSWERS.md). Tap corner j, emit
// only CC @CCB+j. The continuous bilinear morph is unchanged.
//
// THIS IS A FOURTH READING AND IT IS CHEAPER THAN THE THREE THE CHECKPOINT
// COSTED, and the reason belongs here rather than only in a plan. The richest
// option was an assignment MODE - a latch, a selection gesture and a
// single-corner emit - and it named THE GESTURE as the expensive part. That
// expense is gone: self.k already declares four corner blocks - 2x2 then, 3x3
// since plan 12-09 - so THE CORNER TAP IS THE SELECTION. No latch, no mode, no
// new gesture, nothing to exit.
//
// WHY IT MATTERS, AND IT IS THE SAME COMPLAINT AS THE SUPPRESSION CLAUSE. In a
// DAW, MIDI-learn binds whichever message arrives first. With four CCs
// streaming from every touch, corner 3 cannot be bound to a filter: the moment
// you hit learn, one of the other three lands first and takes it. That is why
// "mapping mode needed in" sat in the same sentence as "if something doesn't
// change don't send it don't send 0 value" - BOTH CLAUSES ARE ABOUT THE PAD
// SHOUTING OVER ITSELF. 11-08 fixed the shouting; this makes each corner
// individually reachable.
//
// THE MEASUREMENT CAME FIRST AND IT DID NOT SHRINK THE TASK, WHICH IS WORTH
// SAYING BECAUSE IT COULD HAVE. 11-08's per-corner suppression already
// silences three of the four AT A CORNER, because three weights are
// arithmetically 0 there and s.p holds them at 0. Driven through the real Lua
// host before any change:
//
//   press on the exact extreme pixel (0,0)          1 message
//   press on the CENTRE of the corner block (2x2)   4 messages
//   the same, arriving after a stroke elsewhere     4 messages
//
// A finger aimed at a corner lands in the BLOCK, not on the one pixel where
// the arithmetic is already clean - at (14,14) the weights are 100/12/12/1 and
// all four leave. So the gap is real at the point a hand reaches, and
// lua-smoke.spec.ts pins its probes to points where all four weights are
// non-zero, so a one-message result can never be the old behaviour wearing the
// new one's clothes. ALL THREE FIGURES ABOVE ARE 11-09.1'S, ON THE 2x2 BLOCKS
// AND WITHOUT THE MARGIN, and plan 12-09 moved both: (14,14) is now inside the
// dead margin and reads 127/0/0/0, so the test's aiming point moved to the
// block's INNER cell - (35,35) for corner 1, weights 95/14/14/2 - which is
// where all four are non-zero AND where a hand reaching from the middle of the
// pad lands. The non-vacuity clause is unchanged; only the point is.
//
// THE DISCRIMINATION IS THE ONSET EDGE, "e==4 or e>8", and it is the SAME edge
// arc.ts takes in the same plan - one idiom in the catalogue for telling a
// discrete tap from the start of a drag, cited to stage.ts and to
// src/vendor/botor/pad-sim.ts:228-241 rather than re-derived. On the onset
// sample, if the cell is inside a corner block, only that corner may speak; on
// any MOVE sample q is 0 and the full bilinear morph runs exactly as 11-08
// left it.
//
// THE REJECTED ALTERNATIVE - "only a coalesced DOWNUP (e>8) counts as a tap" -
// IS CHEAPER STILL AND IT IS REJECTED BY MEASUREMENT TWICE OVER. First, the
// shipped src/lib/sim/touch.ts NEVER PRODUCES CODE 9 AT ALL: measured, a press
// held 300 ms and the fastest press a pointer can make both deliver 4 then 5,
// so the headline gesture of the card would be invisible in the browser, which
// is the failure PREV-01 exists to prevent and the same reason 11-09 rejected
// a second contact. Second, on hardware a deliberate tap aimed at a MIDI-learn
// button is exactly the slow kind that arrives as 4 then 5, so the feature
// would be unreliable in the one situation it exists for.
//
// THE CORNER BLOCKS ARE DERIVED FROM self.k, NOT TYPED. The Lua walks
// s.k[j] + d%3 + d//3*9 for d = 0..8, the same expression the Setup paint loop
// and the send loop already use, so moving a corner moves all three together.
// lua-smoke.spec.ts reads self.k AND the block's side out of the entry's own
// source for the same reason.
//
// 11-08'S SUPPRESSION IS NOT BYPASSED, RE-KEYED OR RESET. A corner tap updates
// s.p FOR THAT CORNER ONLY. The other three keep their old entries on purpose:
// they were not sent, so the receiver has not heard them, and the next
// continuous sample must be free to say so. THE HONEST PRICE, stated rather
// than discovered: tap corner 1 and then corner 2 and a receiver holds corner
// 1 at its tapped value until a continuous stroke moves it. That is what
// "speaks for one corner" means, and it is what makes MIDI-learn work.
//
// THE PAINT STAYS UNCONDITIONAL, exactly as the section further down says: the
// picture is a READOUT and the wire is TRAFFIC. A corner tap repaints all four
// corners' current weights even though it speaks for one.
//
// THE CELL INDEX IS NOW A LOCAL, WHICH PAID FOR PART OF THE FEATURE. The comet
// at the end of the handler recomputed x*9//128+y*9//128*9; the corner test
// needs the same value, so it is bound once as `c` and used twice - 18
// characters back. Plan 12-09 replaced that arithmetic with `Q(s,i,e,x,y)`;
// see the section immediately below.
//
// COST: Setup 579 -> 710 of 908 at the RGB444 picker corner (plan 11-09.1),
// then 710 -> 772 in plan 12-09, then 772 -> 814 in plan 12.1-04 (the finger),
// 94 free. Timer still the empty string, and NO KEEPER WAS ADDED - see the
// capitalised note above, which stands.
//
// ---------------------------------------------------------------------------
// BIGGER CORNERS, A DEAD MARGIN, AND THE TRAIL CELL FROM THE LIBRARY (12-09)
// ---------------------------------------------------------------------------
//
// THE BENCH NOTE, VERBATIM: "MORPH: kozepen random vilagitas, ne csak teljesen
// a sarokban legyen 0 pont, legyen nagyobb tere a mappolasnak ahol. tehat a
// sarkokban legyenek nagyobbak a teruletek ahol csak egy ch-t kuld ki" -
// random lighting in the middle; the zero point should not be only in the exact
// corner; bigger corner regions where only one channel is sent. Three clauses,
// three edits, each measured on its own at the RGB444 picker corner.
//
// 1. THE CORNER BLOCKS ARE 3x3, AT +0 CHARACTERS (710 -> 710). self.k moves
//    from {0,7,63,70} to {0,6,54,60} and the walk from `d%2+d//2*9` over
//    d = 0..3 to `d%3+d//3*9` over d = 0..8, at all three sites. Both literals
//    are the same length, so the whole clause is free: nine cells of eighty-one
//    per corner instead of four, which is the "bigger regions where only one
//    channel is sent" the note asks for. THE CORNER TAP IS STILL THE SELECTION
//    and nothing about the mechanism above changes - only how big a target it
//    is. A finger aimed at a corner from the middle of the pad lands on the
//    block's INNER cell, which is now a real cell rather than a pixel away from
//    the edge, and lua-smoke.spec.ts aims there for exactly that reason.
//
// 2. A DEAD MARGIN, AT +56 (710 -> 766). "The zero point should not sit ONLY in
//    the exact corner." The raw axis is remapped before the weights:
//
//        x=glim((x-24)*127//79,0,127)  y=glim((y-24)*127//79,0,127)
//
//    so raw 0..24 reads 0, raw 24..103 spans 0..127, and raw 103..127 reads
//    127. Twenty-four raw units is 1.7 cells - a cell is 128/9 = 14.22 - so the
//    whole of cells 0 and 1 on each axis is already saturated and a finger a
//    cell and a half in from a corner reads a FULL 127 on that macro and an
//    exact 0 on the others. Before this, (10,10) read corner 1 at 107 and only
//    the literal pixel (0,0) read 127. THE MARGIN RUNS ON THE RAW x AND y AFTER
//    `Q`, deliberately: the trail cell is where the FINGER is, not where the
//    mapping says it is, so the light under your hand stays under your hand.
//
// 3. THE TRAIL CELL COMES FROM `Q`, AT +6 (766 -> 772) - and this is the
//    "random lighting in the middle". The comet was re-armed at a cell computed
//    as x*9//128+y*9//128*9 on EVERY sample, and PROBE-RESULTS-2026-09-10.md Q2
//    measured a motionless finger sending 71, 72, 71, 71, 71 - one raw unit of
//    wobble, and 71*9//128 = 4 against 72*9//128 = 5. So a finger resting on a
//    cell line re-armed two cells alternately at 100 Hz, which is what the
//    middle of this pad looked like. `Q`'s per-axis hysteresis holds one cell,
//    and it returns that cell only when the cell CHANGED, so the comet is armed
//    once per cell entered.
//
// WHY MORPH DOES NOT RETURN ON `Q`'S NIL, AND WHY THE RESEARCH IS WRONG HERE.
// 12-RESEARCH writes the caller as
//
//     if i>0 then return end local c=Q(s,i,e,x,y)if not c then return end
//
// and that shape WOULD FREEZE THIS CARD. `Q` returns nil when the cell has not
// changed; MORPH's output is a bilinear blend of the RAW position, and a cell is
// fourteen raw units wide, so every macro it owns keeps moving all the way
// across one. Measured, as 12-09's negative check, by shipping that exact line:
// a four-sample wobble inside one cell sent 4 messages instead of 16 - four on
// the DOWN and NOTHING on the three MOVEs. So MORPH keeps its own end test
// first, calls `Q` for the trail cell ALONE, sends its weights regardless, and
// paints the comet only when `Q` returned a cell. (The wrong shape also costs
// 25 characters MORE, at 797, because the guard is not free.)
//
// `Q` NOW SITS IN FRONT OF MORPH'S OWN END TEST, NOT BEHIND IT (plan 12.1-04),
// and the reason is the finger below: `G` has to see a lift to clear the block
// it drew, and `G` has to come AFTER `Q` (12.1-02's finding, in the finger
// paragraph), so both moved in front of the end test together. What that
// changes, stated rather than discovered: `Q`'s expiry path NOW RUNS for this
// card - a lift or a code 3 reaches `E`, which drops the contact from `H` and
// `T` and clears its block through `V`; until 12.1-04 a quiet contact kept its
// `H` entry until the next onset, which expired it anyway. On live codes
// nothing moved: an onset expires `H[i]` before the cell is read either way,
// so the cell `Q` returns and the hysteresis it applies are the same as before.
// MORPH still has no Timer and so no `X`; NOTHING IS HELD, so a stale entry
// never cost anything and now does not exist. And because this card returns
// for i > 0 before either call, the only contact the library ever tracks for
// it is 0.
//
// THE FINGER IS THE LIBRARY'S GRADIENT IN THE TRAIL COLOUR, ON LAYER 0 (plan
// 12.1-04; 12.1-CONTEXT D-11, D-13). `G(s,i,e,x,y,0,@TRAILC)` draws the
// bilinear finger over the 2x2 block of LEDs around the calibrated position,
// peak 255 dead on an LED, on layer 0 - the layer neither the corner blocks
// (layer 1) nor the comet (layer 2) writes - and in the SAME colour as the
// comet, so the finger and its trail read as one thing. The colour is the
// entry's own knob token and not a new knob (D-13: a knob would move the shape
// character). `G` RE-ASSERTS THE COLOUR ON EVERY CALL, which is the
// alert-layer heal: layer 0 is the layer `grid_alert_all_set` recolours
// (grid_led.h:7; a CONFIG write, a page discard, a refused page change, a TX
// overflow, boot), so a finger coloured once at Setup would turn grey or
// purple after a page switch. There is no floor - `glc(...,1)` forces the
// layer's minimum to 0 - so a cleared block is dark and the card is still
// black at rest (restsBlack stays true; frames.json did not move).
//
// THE ORDER OF THE FIRST LINE IS THE WHOLE DESIGN, AND EACH PIECE HAS ITS
// REASON:
//
//     if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)
//     if e==3 or e>=5 and e<9 then return end
//
//   1. THE SINGLE-CONTACT RULE STAYS FIRST. A second finger is refused before
//      `Q` or `G` sees it, so `B[1]` is never set, nothing is drawn for it, and
//      there is nothing for a sweep to clear - the same rule as before, now
//      split from the end-code test it used to share a line with. Measured in
//      lua-smoke.spec.ts: a second contact pressed while the first is down
//      lights nothing new on layer 0.
//   2. `Q` BEFORE `G`, because `Q` calls `E` on every onset and `E` clears the
//      contact's block through `V`: a `G` drawn before `Q` is wiped on the
//      press that drew it. Plan 12.1-04's own interfaces block wrote `G`
//      first; driven in wasmoon that shape lights NOTHING on a press and the
//      finger appears only on the first move. Shipped `Q` first.
//   3. `G` BEFORE THE END TEST, so an end code reaches it: `G` returns on
//      `e~=1 and e~=4` after clearing the contact's previous block (a code 9
//      draws nothing, 12.1-03), and `Q`'s `E` has already cleared it on the
//      same lift - so the lift is clean by two paths, and the finger goes out
//      when the finger does. Put `G` behind the end test with the old guard in
//      front and a lift leaves the block lit forever, MORPH having no Timer to
//      sweep it (the negative check the plan names).
//   4. THE END TEST ITSELF IS UNCHANGED, `e==3 or e>=5 and e<9` (class B, plan
//      11-02), and still keeps a code-9 fast tap for the weights below.
//
// SAME CHARACTERS AS THE PLAN'S ORDER: 772 -> 814 (+42) at the picker corner
// either way, so every figure the plan carries holds.
//
// `D` IS NOT USED, AND THAT IS THE LIBRARY'S OWN ARITHMETIC RATHER THAN A
// PREFERENCE. `D(n,l,w)` derives its timeout as `w//6` from a byte, so it
// covers at most 42 ticks; @DECAY reaches 126. The inline pair below is the one
// decay-idiom.spec.ts already reads, and it stays.
//
// A CORNER SPEAKS ONLY WHEN THAT CORNER MOVED. self.p={0,0,0,0} holds the last
// value sent for each of the four macros and the send is guarded on
// z ~= s.p[j]. Before it, four CC messages left on EVERY accepted sample, at
// 100 Hz for as long as a finger moved: measured through the real Lua host, a
// 128-sample stroke along the top edge sent 512 messages and now sends 255, and
// a jittering finger inside one cell sent 840 and now sends 450.
//
// "DON'T SEND 0 VALUE" IS A READING OF THE USER'S WORDS AND IT IS WRITTEN HERE
// AS ONE. The four weights are a bilinear corner split - w = {u*v//127,
// x*v//127, u*y//127, x*y//127} with u = 127-x and v = 127-y - so at any EDGE
// two of the four are exactly 0 and at any CORNER three are, and all four were
// being sent regardless. The reading taken is: A CORNER THAT IS AT ZERO AND WAS
// AT ZERO SENDS NOTHING, AND A CORNER THAT FALLS TO ZERO SENDS ZERO ONCE. The
// zero-initialised table is what delivers both halves with one mechanism -
// every corner is 0 at Setup, so a corner the finger is far from never speaks
// at all; measured on a y = 0 stroke, the two bottom corners send exactly 0
// messages over 128 samples.
//
// THE ALTERNATIVE READING - never emit a 0 at all - WAS REJECTED, and the
// reason is a worse bug than the one reported. The finger has to be able to
// LEAVE a corner. Under the literal reading the receiver would hold the last
// non-zero value of every corner the finger walked away from, forever, so a
// slide from one corner to the opposite one would leave both macros up. The
// top-left corner's single 0 at the end of a top-edge stroke is asserted by
// name in lua-smoke.spec.ts, as is the fact that it is that corner's LAST word
// rather than a value it passed through.
//
// THE PAINT IS DELIBERATELY LEFT UNCONDITIONAL, from the same local z the send
// is guarded on. A suppressed send with a suppressed repaint is one decision
// and a suppressed send with a live repaint is another; this is the second,
// because the picture is a READOUT and the wire is TRAFFIC. glp is a local
// write with no bus behind it, so repainting a corner that has not moved costs
// nothing and guarantees the picture cannot drift from the last value sent -
// which is the failure mode a shared guard would have introduced.
//
// s.p IS INDEXED BY CORNER, NOT BY CONTACT, and that was checked rather than
// assumed: the callback's first words are "if i>0 then return end" (12.1-04
// split the single-contact rule from the end-code test, which now follows the
// two library calls), so this card is single-contact by construction. If that
// guard ever moves, the table's key has to move with it.
//
// THE TOKEN FOR THE TRAIL LENGTH IS @DECAY, NOT @TRAIL. renderLua substitutes
// by plain string replacement, so a token that is a PREFIX of another token is
// eaten or corrupted depending on knob order - "@TRAIL" inside "@TRAILC" would
// render the colour as "42C". The trail-length knob therefore carries @DECAY.
// Its knob id is still "trail"; only the substitution token moved.
//
// THE HONEST LIMIT, for the card copy: single-contact by design. The callback
// returns immediately for i > 0, because four fingers fighting over one blend
// is noise rather than expression.
//
// THE GUARD IS "e==3 or e>=5 and e<9", AND THE UPPER BOUND IS THE POINT
// (plan 11-02, class B). Firmware coalesces a sub-cycle press-and-lift into ONE
// message with event code 9 - a down AND an up, no separate DOWN and no
// separate UP. Setup used to write "e>=5" bare, so a fast tap returned
// early and the four macros never moved - 0 MIDI messages against 4 on a slow
// press. MORPH HAS NO TIMER, so nothing was going to catch up later either.
// src/lib/catalog/touch-guard.spec.ts holds the convention and gates it; the
// event table itself lives in src/vendor/botor/pad-sim.ts:228-241 and in
// zona-docs/docs/ZONA_REFERENCE.md s4.6 and is CITED, never restated. +8
// characters.
//
// THE STRING BELOW IS A TEMPLATE OVER CANONICAL LUA. Rendered at the defaults
// by renderLua it is byte-identical to the canonical text measured against the
// pinned minifier: a fixed point of compressScript and accepted by
// checkSyntax. THE CORNER THE 908 GATE READS IS 814, leaving 94 free - under
// the 890 BUDGET_ERROR line (_pad.ts:3076-3078) by 76 - and it is the RGB444
// PICKER corner (D-06) rather than the all-longest corner of the declared
// palettes - the two coincide here only because @TRAILC already declares
// 255,255,255, and plan 11-07 measured them 21 characters apart on CONSOLE.
// At the defaults it is 810. It was 579 before plan 11-09.1's corner tap, 710
// before plan 12-09's three edits and 772 before plan 12.1-04's finger, and
// every figure is re-measured rather than inherited: 710 after the 3x3
// corners (+0), 766 after the margin (+56), 772 after the library call (+6),
// 814 after the `G` call and the split end test (+42; @TRAILC now appears
// TWICE, the comet's init loop and the finger, both substituted). Cheaper than
// the pre-coloured shape D-11 replaced, because no 81-cell layer-0 colouring
// was added to the init loop - `G` carries the colour.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for a=0,80 do glc(a,2,@TRAILC,1)glp(a,2,0)end self.k={0,6,54,60}self.p={0,0,0,0}for j=0,3 do for d=0,8 do local a=glag(0,self.k[j+1]+d%3+d//3*9)glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)glp(a,1,0)end end self.touch_cb=function(s,i,e,x,y)if i>0 then return end local c=Q(s,i,e,x,y)G(s,i,e,x,y,0,@TRAILC)if e==3 or e>=5 and e<9 then return end local q=0 if e==4 or e>8 then for j=1,4 do for d=0,8 do if c==s.k[j]+d%3+d//3*9 then q=j end end end end x=glim((x-24)*127//79,0,127)y=glim((y-24)*127//79,0,127)local u=127-x local v=127-y local w={u*v//127,x*v//127,u*y//127,x*y//127}for j=1,4 do local z=w[j]if z~=s.p[j]and(q<1 or q==j)then s.p[j]=z s:gms(@CH,176,@CCB+j,z,0)end local b=s.k[j]for d=0,8 do glp(glag(0,b+d%3+d//3*9),1,z*2)end end if c then local a=glag(0,c)glpfs(a,2,252,256-252//@DECAY,0)glt(a,2,@DECAY)end end";

// THE TIMER IS THE EMPTY STRING, WRITTEN INLINE. See the header: MORPH has no
// Timer EVENT, and a named constant holding nothing would only invite someone
// to fill it in.
const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: "" };

export const MORPH: CatalogEntry = {
  id: "morph",
  name: "Morph",
  description:
    "Four macros in the corners; slide between them and each corner’s brightness is its own weight.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  tags: ["modulation", "expressive", "still"],
  featured: true,
  addedAt: "2026-09-04",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TWO KIND CHOICES, WRITTEN DOWN SO THEY ARE NOT RE-ARGUED:
  //
  //   - hueSpread is "amount", NOT "colour". Its value is a single scalar - the
  //     60 in 255-j*60, j*60, 128 - that widens the arithmetic spread between
  //     the four corner hues. A colour widget renders a picker and would be
  //     handed a bare number it cannot show. "amount" is the kind for a scalar
  //     with a range, which is exactly what this is. trailColour is a real RGB
  //     triple and stays "colour".
  //
  //   - MIDI channel and CC number are "amount" DELIBERATELY. The vendored
  //     KnobKind union has no MIDI-destination kind: its "note" is a pitch, and
  //     "mode", "bend" and "spring" are named switches. D-12 forbids inventing
  //     a Lua-specific kind, so "amount" - a bounded integer chosen from a list
  //     - is the closest honest fit. If Phase 5 wants a distinct widget for a
  //     MIDI destination, that is a KnobKind addition in BOTOR followed by a
  //     re-sync, never a HANGAR-local union. Every @CH and @CC knob in this
  //     phase uses "amount" for that reason.
  knobs: [
    {
      id: "trailColour",
      label: "Trail colour",
      kind: "colour",
      token: "@TRAILC",
      // Layer 2 - the pale comet under your hand, which is the only thing on
      // this card that moves. Every channel is inside 0..255: the firmware
      // truncates rather than clamps, so 260 would render as 4.
      values: [
        "180,255,255",
        "255,255,255",
        "0,200,255",
        "255,180,120",
        "120,255,180",
      ],
      default: 0,
    },
    {
      id: "hueSpread",
      label: "Hue spread",
      kind: "amount",
      token: "@SPREAD",
      // The scalar in the corner-colour arithmetic - see the note above on why
      // this is an amount and not a colour. APPEARS TWICE in the Setup. Every
      // value is at or under 85, because corner j = 3 is handed 255 - 3 *
      // spread on red and 3 * spread on green: at 85 that is exactly 0 and 255,
      // and anything larger would wrap red round the truncation boundary into a
      // bright colour where the design wants none.
      values: ["20", "40", "60", "85"],
      default: 2,
    },
    {
      id: "ccBase",
      label: "CC base",
      kind: "amount",
      token: "@CCB",
      // The four corners send @CCB+1 through @CCB+4, in corner order. EVERY
      // VALUE HERE IS AT OR UNDER 110, so the fourth CC is at most 114 and the
      // whole quartet stays inside the 0..127 controller range. That is not
      // asserted in a spec - it is guaranteed by choosing the values, which is
      // the cheaper of the two and the reason this comment exists.
      values: ["15", "20", "40", "70", "110"],
      default: 0,
    },
    {
      id: "trail",
      label: "Trail length",
      kind: "size",
      token: "@DECAY",
      // Ticks the comet takes to fade. TOKEN IS @DECAY, not @TRAIL - see the
      // header on the prefix hazard. These are countdowns and nothing here is
      // anywhere near keeper height, so the pitfall-1 guard stays quiet by
      // construction rather than by exemption.
      //
      // EVERY VALUE IS AN EXACT DIVISOR OF 252, because the emitted rate is
      // 256 - 252//@DECAY and the phase starts at 252, so the walk lands on
      // exactly 0 only when the division is exact. 20, 80 and 120 were not, and
      // became 21, 84 and 126 in plan 11-02 - see the header for what that does
      // to a link somebody already shared.
      values: ["21", "42", "84", "126"],
      default: 1,
    },
    {
      id: "channel",
      label: "MIDI channel",
      kind: "amount",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument. The recipe book pins the
      // signature as self:gms(ch, cmd, p1, p2, mode) at
      // zona-docs/docs/ZONA_RECIPES.md:1058. One occurrence, inside the loop
      // that sends all four macros, so the quartet always leaves together.
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
    trailColour: 0,
    hueSpread: 2,
    ccBase: 0,
    trail: 1,
    channel: 0,
  },

  // TRUE, and it is the design. The four corner blocks are COLOURED at Setup
  // but left at phase 0, glc's sixth argument forces the minimum stop black,
  // and there is no Timer to light anything - so with no finger on the pad
  // MORPH is black forever and every sampled tick reads all-zero. Its only
  // animation is a per-touch decay. frames.spec.ts test 5 turns that
  // declaration into a checked fact, and the fixture is cross-checked
  // independently in plan 08-06: one distinct hash, nonZeroBytes 0 at every
  // tick, animating false at every tick.
  restsBlack: true,
};
