// SHUTTLE - a transport bar you push, that keeps going, with a stop you can see.
//
// The middle three rows are a horizontal bar, and it is already on the pad
// before anyone touches it: dim reverse colour to the left, dim forward colour
// to the right, and a breathing white tick down the centre column where zero
// is. Push right and the right half fills at full brightness; push left and the
// left half does. The speed is how far out you pushed. LIFTING CHANGES NOTHING
// - the bar holds what you set and the transport keeps running - and the moment
// it starts, the whole bottom row lights red. Press that row and everything
// stops.
//
// J/K/L is universal - Premiere, Resolve, Final Cut - and it is plain
// keystrokes, so this works on a machine with nothing installed (USE-CASES.md
// N2).
//
// ---------------------------------------------------------------------------
// WHAT WAS THROWN OUT, AND THE TWO REASONS IT WAS OWED AN ANSWER
// ---------------------------------------------------------------------------
//
// Until plan 11-12 this file was a ring of sixteen cells at radius two and a
// HOLD-TO-SCRUB gesture: a speed lived only while a finger was down, and every
// other event - a lift, a grip-suppression code, a coalesced tap - set zero.
// That was not an accident and the file said so at :79-89. It gave two reasons
// for refusing to latch, and both are answered here rather than ignored.
//
// REASON 1, IN ITS OWN WORDS: a speed that survives the lift is "a video that
// scrubs forever and can only be stopped by touching the exact centre column".
//
//   ANSWERED, STRUCTURALLY. The stop is no longer the centre column. It is the
//   WHOLE BOTTOM ROW, nine cells wide, and it is PAINTED RED the entire time
//   there is anything to stop. The objection was never to latching as such -
//   it was to a latch whose only exit is an unmarked target the size of one
//   ninth of the pad. Give the exit a name and a colour and the objection is
//   spent. The row is dark and inert while the transport is stopped, so the
//   pad never carries a key that does nothing; that is GHOST's erase key from
//   plan 11-11, reused deliberately rather than reinvented.
//
// REASON 2, IN ITS OWN WORDS: "a DOWNUP arrives with NO LIFT BEHIND IT, so a
// tap that set a speed could never be cleared by the same gesture that set it".
//
//   ANSWERED BY REMOVING THE DEPENDENCY. This is the sharper of the two and it
//   is the class-B trap written down in this file before plan 11-02 made it a
//   gate, so it deserves a direct answer instead of a citation.
//
//   The old reasoning is exactly right about a latch whose EXIT IS THE LIFT.
//   This one's exit is not a lift. Stopping is a press on the red row, and a
//   press is something event code 9 delivers as completely as codes 4 and 1 do
//   - a coalesced tap on the red row is a stop, in one message, with nothing
//   owed afterwards. So the design never needs to tell a tap from a hold, and
//   THERE IS NO TAP-VERSUS-HOLD RULE IN THIS FILE. That is the point:
//
//     - press, drag or tap, anywhere above the bottom row -> set the speed;
//     - press, drag or tap on the bottom row while it is red -> stop;
//     - lift -> nothing at all.
//
//   Three sentences, one code path, and no branch anywhere reads how long a
//   contact lasted. A rule that DID - "a tap springs back, a hold latches" -
//   was considered and rejected, and not only on price: src/lib/sim/touch.ts
//   never emits code 9 (docs/TOUCH-CODE-9.md, commit 4b259f0), so a design
//   whose whole behaviour turns on spotting a coalesced tap is INVISIBLE in the
//   browser preview and can only be judged on hardware. Plan 11-09.1 rejected
//   one on those grounds and this file does not author a second.
//
// AND A THIRD REASON, WHICH IS THE ONE THE BENCH ACTUALLY FILED. "Don't
// understand how it works" is not answered by either behaviour on its own. The
// ring was the real defect: THE INDICATOR AND THE GESTURE SHARED NO GEOMETRY.
// The control was a horizontal axis across all nine columns; the picture was a
// circle. A ring says "turn me". Nothing about it says "slide left and right",
// nothing in it marks where zero is, and forward and reverse were the SAME
// COLOUR distinguished only by which way round the ring the arc had grown -
// which is invisible unless you happened to be watching the growth. A bar on
// the axis you actually push shows direction as POSITION and magnitude as
// LENGTH, in the same geometry as the gesture, and the centre mark is where
// zero is whether anything is moving or not.
//
// ---------------------------------------------------------------------------
// THE MECHANISM, with its 9x9 arithmetic
// ---------------------------------------------------------------------------
//
//   - The pad is one horizontal shuttle: v = x*9//128 - 4, a SIGNED speed in
//     -4..4. At x = 127 that is 1143//128 - 4 = 4 and at x = 0 it is -4, so
//     both ends of the axis are reachable and the centre column is exactly 0.
//   - v lives in self.s. touch_cb writes it and NOTHING ELSE DOES; the Timer
//     only ever reads it.
//   - THE BAR IS ROWS 3, 4 AND 5 - cells 27..53, one contiguous run, so the
//     column of a cell is n%9 and no table is needed. d = n%9 - 4 is a signed
//     distance from the centre column in -4..4, which is the same scale v is
//     on: a cell is lit exactly when d and v share a sign and |d| <= |v|.
//     Four columns each side, four speeds each way, one cell per unit.
//   - THE CENTRE COLUMN IS THE ZERO MARK - cells 31, 40 and 49 - and it is
//     painted ONCE, in Setup, in a fixed white, and never repainted. It is a
//     function and not decoration: it has to stay legible at every setting of
//     both colour knobs, which is the same argument GHOST's red erase key
//     makes in the same words.
//   - THE MARK BREATHES AND NEVER GOES OUT. Layer 1 holds a still white at
//     phase 160 and layer 2 runs the sine shape from phase 0 at rate 2, so the
//     mark rises and falls on a slow cycle with a floor under it. MEASURED over
//     300 ticks: it swings between 79 and 205 of 255 and never reaches 0. A
//     marker that dips to black is not a marker, and a card whose whole resting
//     picture went dark on a sampled tick would take the social preview with it.
//   - THE UNLIT BAR IS A TRACK, AND THE TRACK IS ALREADY THE ANSWER TO "WHICH
//     SIDE IS FORWARD". Every bar cell is painted in the colour of the side it
//     is on - @FWDC right of the mark, @REVC left of it - and a cell that is not
//     currently part of the speed is divided down by five on all three channels.
//     So the RESTING card reads left-is-this-colour, right-is-that-colour,
//     zero-is-here, with no finger on it and nothing moving. That is the single
//     largest thing the ring could not do, and it costs one integer division:
//     measured at the defaults, the track sits at 50,21,0 and 0,39,50 against a
//     lit 0,198,253, which is a factor of five and unmistakable.
//     A BRIGHTER TRACK WOULD BE WRONG, and the old file said why: it would read
//     as a speed the transport is not doing. Five is the ratio that keeps the
//     hue readable without the track ever looking lit.
//   - THE STOP ROW IS CELLS 72..80 - the bottom row, because +y RUNS DOWN on
//     this module (console.ts:37), so y*9//128 == 8 is the row your hand is
//     already nearest. It is red when |v| > 0 and black otherwise, on both
//     layers, and layer 2 pulses at @GAIN*|v| + 2 so the faster the transport
//     is running the more insistent the stop looks. A pulse reads as "act on
//     me" where a steady cell reads as furniture - GHOST measured that.
//   - THE KEYSTROKE. The Timer sends ONE @KEYF for a positive speed and one
//     @KEYB for a negative one, per period. Four arguments, one delay plus one
//     tuple: (4 - 1) % 3 = 0.
//   - BOTH LAYERS CARRY THE SAME COLOUR. One layer caps at 254/512 of the
//     colour asked for; on layer 2 alone the old arc measured 0/99/126 at its
//     brightest instead of 0/198/253. A bar whose lit and unlit cells differ by
//     a factor of two is a bar nobody can read across a room, so every write
//     sets both layers from the same value in the same pass.
//
// ---------------------------------------------------------------------------
// THE PAINT LIVES IN THE TIMER, AND THAT IS WHAT MADE THE DESIGN FIT
// ---------------------------------------------------------------------------
//
// This is a measured decision and it is the whole reason the shipped shape is
// the shipped shape. Costed as Lua before a line of it was authored, at the
// RGB444 picker corner, which is the corner the 908 gate actually reads:
//
//   latching, stop row, repaint called from touch_cb   Setup 935  -  27 OVER
//   latching, stop row, repaint moved into the Timer   Setup 540, Timer 542
//
// The natural architecture - a local function A(v) in Setup that touch_cb
// calls - DOES NOT FIT. It is twenty-seven characters over 908 on the Setup
// while the Timer sits at 181 with 727 free. Moving the repaint into the Timer
// spends the event that had the room and costs nothing the card needs: the
// Timer already runs at the transport's own cadence, and a picture re-derived
// from self.s on every fire cannot drift out of step with the state it is
// drawing. touch_cb is left doing one thing - writing a number.
//
// SETUP THEREFORE PAINTS NO BAR AT ALL. It blacks all eighty-one cells, paints
// the mark, arms the phases the stop row will need, and closes with gtt(0, 20)
// rather than gtt(0, @BASEP) - so the Timer draws the whole card 20 ms after
// boot instead of after a whole period. That is why frames.json records nine
// lit bytes at tick 0 and fifty-seven at every later sample: the mark alone,
// and then the mark plus the track. It is a real property of the card and it is
// recorded rather than smoothed over.
//
// THE PRICE, STATED AS A NUMBER RATHER THAN WAVED AT: a speed change made while
// the transport is already running is drawn on the next Timer fire, which is at
// worst @BASEP//(1+1) = 200 ms at the slowest period and the slowest moving
// speed, and shrinks as the speed rises because the period does. A start and a
// stop do not wait for it - see the kick below.
//
// ---------------------------------------------------------------------------
// THE gtt ZERO GUARD, AND THE SILENT STOP IT PREVENTS
// ---------------------------------------------------------------------------
//
// gtt(0, 0) NEVER FIRES. A Timer that re-arms itself with a period of zero does
// not run fast, it STOPS - permanently, with no error, no raise and nothing in
// the picture to say so. In this shape that is worse than it was before the
// rewrite, because the Timer is now the only thing that paints: a period of
// zero freezes the bar at whatever it last drew AND stops the keystrokes, and
// the pad goes on showing a speed it is no longer sending.
//
// THE math.max FLOOR IS THEREFORE DELIBERATE AND IT IS LOAD-BEARING. DO NOT
// REMOVE IT. The floor is 20, not 1 - a period below 20 ms is a keystroke rate
// no host would keep up with anyway - and it is closed with //1 like every
// other math result in this catalog. @BASEP//(1+k) is 24 at its smallest over
// the shipped values (120 at speed 4), so the guard never fires today; it is
// there because the divisor is DATA and the failure it prevents is invisible.
// Plan 11-12 removed it and drove the period to zero on purpose: the picture
// froze, the keystrokes stopped, and NOT ONE TEST IN THIS REPOSITORY NOTICED.
//
// ---------------------------------------------------------------------------
// THE KICK, generalised from "leaving zero" to "crossing zero"
// ---------------------------------------------------------------------------
//
// touch_cb re-arms the Timer with gtt(0, 20) when v CROSSES ZERO in either
// direction - stopped to running, or running to stopped - and only then. The
// old file kicked on the first half of that and it was right to; the second
// half is new and the rewrite needs it, because with the paint in the Timer a
// stop that waited out a 400 ms period would leave the red row lit and the bar
// showing a speed for most of half a second after the press that killed it.
//
// RE-ARMING ON EVERY CHANGE INSTEAD WOULD BE WORSE THAN EITHER, and that
// warning is carried over from the old file verbatim in substance: a fast slide
// changes the speed every time it crosses a column boundary, each change would
// push the deadline out by a whole 20 ms, and the Timer would never fire at all
// while the finger was moving - which now means the pad would not repaint
// either. The zero-crossing test is what makes the kick a kick.
//
// ---------------------------------------------------------------------------
// THE LOOK, why restsBlack is FALSE, and why the declared motion is honest
// ---------------------------------------------------------------------------
//
// Setup paints the white mark and the Timer paints the track 20 ms later, so
// the card arrives showing a horizontal bar - dim reverse colour on the left,
// dim forward colour on the right - with a breathing white tick at its centre
// and a black bottom row. restsBlack is FALSE from the very first tick, because
// the mark is a Setup write; frames.spec.ts test 5 turns that declaration into a
// checked fact.
//
// The listing derives motion from frames.json, and for a Lua entry the engine
// reports `host.animating || host.timerArmed` (lua-pad-sim.ts:150-152): a Timer
// that re-arms itself on every fire NEVER SETTLES, so any entry with a stored
// Timer classifies as `animated` whatever its picture is doing. front-door.ts
// says that field must never be guessed or aspirational - "faking motion here
// would be faking the one thing the product claims" - so the mark is given a
// real breath rather than the card being given a claim. The declaration is
// re-derived from the regenerated fixture and not inherited.
//
// ---------------------------------------------------------------------------
// THE TRAPS THIS ENTRY CONTAINS
// ---------------------------------------------------------------------------
//
//   - THE gtt ZERO GUARD, written out above. It is the one that has actually
//     bitten this configuration.
//   - THE PARENTHESES IN (e==4 or e>8) ARE REQUIRED. `and` binds tighter than
//     `or`, so the bare pattern copied out of stage.ts and dropped into a
//     longer chain silently becomes `e==4 or (e>8 and ...)` - which admits
//     every press as a stop press. They are load-bearing punctuation, not
//     style.
//   - 0 IS TRUTHY IN LUA. `cond and 0 or expr` is safe here, and the whole stop
//     test reads
//         (e==4 or e>8) and s.s~=0 and y*9//128==8 and 0 or x*9//128-4
//     which parses as (((onset) and (running) and (bottom row)) and 0) or
//     (speed). Only nil and false are falsy, so the 0 arm really is reachable.
//   - THE STOP ROW IS AN ONSET, NOT A LIVE EVENT. It is guarded by
//     (e==4 or e>8) rather than by the outer live test, so a DRAG that wanders
//     into the bottom row does not stutter the transport off and on. Stopping
//     is a decision you make with a press.
//   - EVERY DIVISION IS FLOORED. x*9//128, y*9//128, n%9, @BASEP//(1+k) and the
//     //1 closing math.max are all `//`. A fraction reaching a firmware call
//     becomes 0, silently - and for the period argument that is the silent stop
//     again.
//   - THE gks ARITY RULE. gks(0, 0, 2, key) is four arguments, one delay plus
//     one tuple, and (4 - 1) % 3 = 0. Firmware rejects any other shape and the
//     rejection is silent.
//   - THE PULSE RATE IS A uint8 AND WRAPS. @GAIN*k + 2 peaks at 32*4 + 2 = 130
//     over the knob's own values, checked at the largest speed rather than at
//     the default. A rate of 260 would be a rate of 4 - a fast pulse that
//     silently became a crawl.
//   - THE TIMEOUT IS 30000 AND NOT 65535. Only the mark and the stop row carry
//     a running rate at all, the Timer refreshes both every period, and a
//     maximum timeout beside a live rate is pitfall 1's exact signature. 30000
//     ticks refreshed every period answers the firmware ceiling just as
//     completely without wearing the signature.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every value of
//     @FWDC and @REVC is inside 0..255 by construction.
//
// THE KNOB IDS DO NOT MOVE, AND TWO OF THEM ARE NOW STALE NAMES ON PURPOSE.
// The colour knobs are still called `arc` and `rest` although there is no arc
// and nothing rests in either of them: src/lib/share/fixtures/wild-stamps.json
// holds two SHUTTLE records keyed on those ids, captured byte-for-byte at
// b3f99bb, and renaming either would break a fixture whose whole value is that
// it was never regenerated. The arity does not move either - four values each,
// six knobs, twenty-four options - because the stamp's shape character is
// (6*7 + 24) mod 32 and a resize would demote every SHUTTLE link anyone has
// shared from `restored` to `older`. CHORUS's @SPREAD carries the identical
// note for the identical reason. The LABELS say what the knobs now mean; the
// ids are history.
//
// THE HONEST LIMIT, for the card copy. Two things, and the first is STAGE's.
//
//   1. HANGAR CANNOT SHOW A KEYSTROKE ARRIVING. gks is recorded and inert in
//      the browser: src/lib/sim/lua-host.ts binds it to recordHid and says at
//      :429 that nothing in HANGAR consumes them. The bar animates exactly as
//      it will on hardware and the keystroke is a claim the simulator does not
//      check. Row 18 of docs/HARDWARE-AUDITION.md is where the wire is checked;
//      row 17 is STAGE's and carries the same reason.
//   2. A LATCHED TRANSPORT KEEPS SENDING UNTIL IT IS STOPPED. That is what a
//      transport is, and it is the behaviour the redesign chose, but it is also
//      the one thing about this card that a visitor must not learn by accident:
//      walk away with a speed set and the module goes on pressing a key into
//      whatever has focus. The red row exists so that state is never invisible,
//      the description names it, and row 18 of the audition asks a human to
//      confirm on a module that the row really does end it.
//
// ROUTE: kind "lua", not kind "state". Two things, either alone decisive.
// NOTHING IN PadState REPEATS ANYTHING at a rate derived from a finger's
// position - there is no timer expression in the sends sheet at all - and
// THERE IS NO KEYBOARD IN `sends` in either branch; the only HID kind is
// "trackpad", which is a mouse. A repeating keystroke whose period is the data
// is outside the vocabulary twice over.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 540 characters, Timer 538, both fixed
// points of compressScript and both accepted by checkSyntax.
//
// THE COSTED CORNER IS THE RGB444 PICKER CORNER - both colour knobs at
// 255,255,255 - because that is the corner D-06 lets a picker reach and
// therefore the corner the 908 gate actually has to hold at. It is NOT the
// all-longest DECLARED corner, which is what this file quoted before plan 11-12
// and what five other entries still quote. At the picker corner: Setup 540,
// leaving 368 free, and Timer 542, leaving 366 free. THE SETUP IS 540 AT EVERY
// CORNER, because after the repaint moved into the Timer the Setup carries no
// colour token at all and every value of @BASEP is three characters - so its
// cost is a constant rather than a maximum. The all-longest declared corner is
// 540 / 538 and the all-shortest is 540 / 535.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them: a trailing comment was measured surviving
// verbatim into the budget. Everything worth saying about this configuration is
// said here, in TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]for n=0,80 do local a=glag(0,n)glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)glpfs(a,1,255,0,0)glpfs(a,2,255,0,0)end for n=31,49,9 do local a=glag(0,n)glc(a,1,255,255,255,1)glc(a,2,255,255,255,1)glpfs(a,1,160,0,0)glpfs(a,2,0,2,3)glt(a,2,30000)end for n=72,80 do local a=glag(0,n)glpfs(a,2,0,2,3)glt(a,2,30000)end self.s=0 self.touch_cb=function(s,i,e,x,y)if i>0 or e~=1 and e~=4 and e<9 then return end local v=(e==4 or e>8)and s.s~=0 and y*9//128==8 and 0 or x*9//128-4 if v~=s.s then if(v==0)~=(s.s==0)then gtt(0,20)end s.s=v end end gtt(0,20)";

const TIMER =
  "--[[@cb]]local v=self.s local k=v<0 and -v or v gtt(0,math.max(@BASEP//(1+k),20)//1)for n=27,53 do local d=n%9-4 if d~=0 then local a=glag(0,n)local r,g,b if d>0 then r,g,b=@FWDC else r,g,b=@REVC end if d*v<1 or(d<0 and -d or d)>k then r,g,b=r//5,g//5,b//5 end glc(a,1,r,g,b,1)glc(a,2,r,g,b,1)end end local q=k>0 and 255 or 0 local f=@GAIN*k+2 for n=72,80 do local a=glag(0,n)glc(a,1,q,0,0,1)glc(a,2,q,0,0,1)glf(a,2,f)glt(a,2,30000)end for n=31,49,9 do glt(glag(0,n),2,30000)end if v>0 then gks(0,0,2,@KEYF)elseif v<0 then gks(0,0,2,@KEYB)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SHUTTLE: CatalogEntry = {
  id: "shuttle",
  name: "SHUTTLE",
  description:
    "Push right to run the video forward and left to run it back; it keeps going until you press the red row.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // UNCHANGED BY THE REWRITE, and checked against the histogram BEFORE the
  // question was asked rather than after: what the card is FOR did not move -
  // pushing further still scrubs further, which is modulation - and `precise`
  // and `still` sit exactly on the FEELS floor of 6 after plan 11-01, so a tag
  // moved off this entry could only have cost and never paid.
  tags: ["modulation", "expressive", "generative"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the ceiling catalog.spec.ts allows - each one literal token
  // substitution over the vendored compiler's own widget vocabulary (TUNE-01).
  // Every default is the INDEX of the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @BASEP, @GAIN, @KEYF,
  // @KEYB, @FWDC and @REVC. renderLua substitutes by plain String.replaceAll,
  // so a token that is a prefix of another is eaten or corrupted depending on
  // knob order. @KEYF and @KEYB share "@KEY" and neither continues into the
  // other; no other pair shares a first letter.
  knobs: [
    {
      id: "period",
      label: "Slowest step",
      kind: "speed",
      token: "@BASEP",
      // The period at speed 1, in milliseconds; every faster speed divides it
      // by 1 + |v|. It is also the repaint cadence, because the Timer is what
      // draws. The smallest quotient over these four values is 120//5 = 24 ms,
      // which is 24 presses a second at full tilt and well inside the 256-byte
      // cycle.
      values: ["400", "300", "200", "120"],
      default: 1,
    },
    {
      id: "gain",
      label: "Stop-row pulse",
      kind: "amount",
      token: "@GAIN",
      // How hard the red stop row pulses, per unit of speed: the layer-2 rate
      // is @GAIN*|v| + 2, so a fast transport asks to be stopped more loudly
      // than a slow one. The rate is a uint8 that WRAPS, so the top of this
      // list is chosen by 32*4 + 2 = 130 < 256 and not by taste.
      values: ["8", "16", "24", "32"],
      default: 1,
    },
    {
      id: "forward",
      label: "Forward key",
      kind: "note",
      token: "@KEYF",
      // USB HID usage ids from the Keyboard/Keypad page (0x07): 15 is the
      // letter L, 79 the right arrow, 55 the full stop and 54 the comma. L is
      // the default because J/K/L is the universal shuttle in every editor
      // this card is for.
      values: ["15", "79", "55", "54"],
      default: 0,
    },
    {
      id: "backward",
      label: "Backward key",
      kind: "note",
      token: "@KEYB",
      // A FOURTH KNOB RATHER THAN AN ARITHMETIC PARTNER, and the reason is that
      // no arithmetic works: L to J is minus two, right arrow to left arrow is
      // PLUS one, and full stop to comma is minus one. Deriving the backward
      // key from the forward one would ship a wrong key on two of the four
      // settings, and a wrong key is a card that does something nobody asked
      // for. The values below pair index for index with the forward list: J,
      // left arrow, comma, full stop.
      values: ["13", "80", "54", "55"],
      default: 0,
    },
    {
      id: "arc",
      label: "Forward colour",
      kind: "colour",
      token: "@FWDC",
      // The bar to the RIGHT of the mark. Bright: direction is carried by
      // position and by colour together, and half of a two-colour scheme that
      // is dim is a scheme with one colour.
      //
      // THE ID SAYS `arc` AND THERE IS NO ARC. See the note in this file's
      // header: wild-stamps.json pins the id, so it stays and the label carries
      // the meaning.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "rest",
      label: "Reverse colour",
      kind: "colour",
      token: "@REVC",
      // The bar to the LEFT of the mark, and the whole answer to "which side is
      // forward". Every value below is chosen as the OPPOSITE HUE of the
      // forward value at the same index - cyan against amber, orange against
      // blue, green against rose, magenta against lime - so the two halves of
      // the bar can never be confused at any setting of either knob, and a
      // visitor who has seen the card once knows which way it is running from
      // across the room. Both colours are also on the pad AT REST, divided by
      // five, so the answer does not wait for a finger.
      //
      // THE ID SAYS `rest` AND IT NO LONGER MEANS THE RESTING COLOUR. Same
      // reason as `arc`: wild-stamps.json pins the id.
      values: ["255,110,0", "0,160,255", "255,0,90", "160,255,0"],
      default: 0,
    },
  ],

  // The same six indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    period: 1,
    gain: 1,
    forward: 0,
    backward: 0,
    arc: 0,
    rest: 0,
  },

  // FALSE, AND TRUE AT TICK 0 AS WELL AS LATER. Setup paints the white zero
  // mark on cells 31, 40 and 49 before the Timer has fired once, so the card is
  // lit from its first frame; the Timer adds the coloured track 20 ms in.
  // frames.spec.ts test 5 turns that declaration into a checked fact, and the
  // fixture records the two states as nine lit bytes at tick 0 and fifty-seven
  // at every later sample.
  restsBlack: false,
};
