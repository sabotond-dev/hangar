// SHUTTLE - scrub video with a finger, and the arc IS the speed.
//
// Slide left or right of centre and the video shuttles that way. The further
// out you are, the more of the ring lights and the faster it spins - the
// animation rate is not decoration, it IS the number being sent. That is ARC's
// argument applied to a different quantity: ARC turns a rate into a modulation
// value you can hear, SHUTTLE turns a rate into a transport speed you can see.
// The difference is that ARC's rate is a knob and SHUTTLE's is the data.
//
// J/K/L is universal - Premiere, Resolve, Final Cut - and it is plain
// keystrokes, so this works on a machine with nothing installed (USE-CASES.md
// N2).
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - The pad is one horizontal shuttle: v = x*9//128 - 4, a SIGNED speed in
//     -4..4. At x = 127 that is 1143//128 - 4 = 4 and at x = 0 it is -4, so
//     both ends of the axis are reachable and the centre column is exactly 0.
//   - v lives in self.s and is set by touch_cb; NOTHING ELSE READS THE FINGER.
//   - THE TIMER IS THE SHUTTLE. It re-arms itself with
//     gtt(0, math.max(@BASEP//(1+k), 20)//1) where k is |v|, so a faster speed
//     is a SHORTER period, and then sends ONE keystroke: @KEYF for a positive
//     speed and @KEYB for a negative one. Four arguments, one delay plus one
//     tuple: (4 - 1) % 3 = 0.
//   - THE ARC IS THE RING AT RADIUS TWO - the sixteen cells of the 5x5 border,
//     held in R in clockwise order STARTING AT THE TOP CENTRE (cell 22). A
//     positive speed lights R[1..4k] clockwise from the top; a negative one
//     reads the same table backwards through R[17-j], so the arc grows
//     anticlockwise from the same starting cell. Four cells per unit of speed,
//     so |v| = 4 lights the whole ring.
//     THE RING SHIPPED, NOT THE BAR the plan allowed as a fallback: the table
//     is sixty-five characters and the whole Setup came in at 663 of 908, so
//     there was never a reason to spend the card's own word on a straight line.
//   - THE SIXTEEN PHASES ARE SET ONCE, IN SETUP, AND STAGGERED: cell j starts
//     at phase j*16, which is the whole 0..255 cycle spread evenly around the
//     ring. That stagger is what makes the ring SPIN rather than pulse in
//     unison - every cell is at a different point of the same gradient, so a
//     common rate moves a bright point around the circle. Sixteen times
//     sixteen is 256, which wraps to 0 and is why the spacing is exact.
//     A(v) therefore writes only COLOUR and RATE and never touches the phase
//     again, so a speed change accelerates the spin instead of restarting it.
//   - Lit cells get the rate f on both layers; unlit ring cells get the idle
//     rate 2 and @RESTC. At rest the whole ring drifts slowly - see the look
//     note, which is where that turned out to be load-bearing rather than
//     decorative.
//   - THE SPIN REVERSES WITH THE TRANSPORT: f is @GAIN*k forwards and
//     256 - @GAIN*k backwards. The phase is a uint8, so advancing by 256 - r
//     each tick IS advancing by -r, and the arc turns the way the video is
//     going for the price of one subtraction.
//   - BOTH LAYERS CARRY THE SAME COLOUR AND THE SAME RATE. One layer caps at
//     254/512 of the colour asked for, and on layer 2 alone the arc measured
//     0/99/126 at its brightest instead of 0/198/253 - a card whose whole
//     picture is one shape cannot afford to be half lit. The two layers stay
//     in lockstep because every write sets both from the same value in the
//     same pass, so they can never beat against each other.
//
// THE UINT8 RATE WRAP, WRITTEN OUT, AND IT IS USED ON PURPOSE IN ONE PLACE.
// The animation rate is a uint8 and wraps at 256, so a rate of 260 is a rate
// of 4 - a fast spin that silently becomes a crawl. The forward rate is
// @GAIN*k with k <= 4, so the maximum over the knob's own values is 8*4 = 32,
// 16*4 = 64, 24*4 = 96 and 32*4 = 128. ALL FOUR ARE UNDER 256, checked at the
// largest speed rather than at the default. The BACKWARD rate is 256 - that
// number, which is 128 at its smallest and 248 at its largest and is the same
// wrap read as a negative step. Because those backward rates cross the rate
// floor pitfall 1's guard discriminates on, THE TIMEOUT IS 30000 AND NOT
// 65535: a maximum timeout beside a rate of 248 is exactly the signature that
// guard exists to catch, and 30000 ticks refreshed every period answers the
// firmware ceiling just as completely without wearing the signature.
//
// THE gtt ZERO GUARD, AND THE SILENT STOP IT PREVENTS. gtt(0, 0) NEVER FIRES.
// A Timer that re-arms itself with a period of zero does not run fast, it
// STOPS - permanently, with no error, no raise and nothing in the picture to
// say so, because the arc goes on showing the last speed the finger asked for
// while the transport sits still. @BASEP//(1+k) is 24 at its smallest over the
// shipped values (120 at speed 4), so the guard never fires today; it is there
// because the divisor is data and the failure it prevents is invisible.
// math.max is closed with //1 like every other math result in this catalog.
//
// THE LIFT STOPS THE SHUTTLE, AND IT IS THE ONE PLACE THIS ENTRY DEPARTS FROM
// A LATCHING READING OF ITS OWN GESTURE. touch_cb reads
// `(e == 1 or e == 4) and x*9//128-4 or 0`, so a press or a move sets a speed
// and EVERY OTHER EVENT SETS ZERO - an end (e >= 5), a grip-suppression code
// (2 or 3) and a DOWNUP tap (9) all stop the transport. The alternative, a
// speed that survives the lift, is a video that scrubs forever and can only be
// stopped by touching the exact centre column; and a DOWNUP arrives with NO
// LIFT BEHIND IT, so a tap that set a speed could never be cleared by the same
// gesture that set it. A shuttle runs while your finger is down. Note that 0
// is TRUTHY in Lua, so the `and ... or 0` form is safe at the centre column -
// only nil and false are falsy, and x*9//128-4 is neither.
//
// THE FIRST KICK. touch_cb re-arms the Timer with gtt(0, 20) when the speed
// leaves zero, and ONLY then. Without it the shuttle would not move until the
// period armed in Setup expired - up to 400 ms of nothing after the finger
// lands. Re-arming on EVERY change instead would be worse than either: a fast
// slide changes the speed every 10 ms, each change would push the deadline out
// by a whole period, and the Timer would never fire at all while the finger
// was moving. The 0-to-non-zero test is what makes the kick a kick.
//
// THE LOOK, why restsBlack is FALSE, AND WHY THE RING DRIFTS AT REST.
// Setup paints the full ring dim in @RESTC, so the card arrives showing a
// sixteen-cell ring around an empty centre.
//
// The ring drifts at rate 2 with nobody touching it, and THAT IS NOT
// DECORATION - it is what makes the declared motion true. The listing derives
// motion from frames.json, and for a Lua entry the engine reports
// `host.animating || host.timerArmed` (lua-pad-sim.ts:150-152): a Timer that
// re-arms itself on every fire NEVER SETTLES, so any entry with a stored Timer
// classifies as `animated` whatever its picture is doing. A still ring
// declared `animated` would be the one thing front-door.ts says this field
// must never be - "never guessed and never aspirational... faking motion here
// would be faking the one thing the product claims". The first draft of this
// entry had a still ring and the fixture called it animated; rather than
// declare a motion the pad did not have, the pad was given the motion. It
// costs four characters and it is a better card.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE UINT8 RATE WRAP and THE gtt ZERO GUARD, both written out above.
//   - EVERY DIVISION IS FLOORED. x*9//128, @BASEP//(1+k) and the //1 closing
//     math.max are all `//`. A fraction reaching a firmware call becomes 0,
//     silently - and for the period argument that is the silent stop again.
//   - THE gks ARITY RULE. gks(0, 0, 2, key) is four arguments, one delay plus
//     one tuple, and (4 - 1) % 3 = 0. Firmware rejects any other shape and the
//     rejection is silent.
//   - CODE 9 IS HANDLED, and it stops rather than starts. See the lift note.
//   - THE TIMEOUT IS 30000, NOT A 65535 KEEPER, AND THE REASON IS THE
//     BACKWARD RATE. See the wrap note above: a maximum timeout beside a rate
//     of 248 is pitfall 1's exact signature, and this ring carries no decay at
//     all. The Timer refreshes both layers of all eighty-one cells every
//     period, so the firmware ceiling of 655 s is never approached; it
//     refreshes eighty-one rather than sixteen because a bare `for n=0,80`
//     costs less than declaring the ring table a second time in the second
//     event, and a timeout on a cell with no colour stops renders nothing.
//   - THE PHASES ARE SET ONCE AND NEVER RE-WRITTEN - DO NOT "FIX" A(v) TO USE
//     glpfs. Writing the phase on a speed change would snap all sixteen cells
//     back to their starting stagger every time the finger crossed a column
//     boundary, which is a visible jolt exactly while the user is doing the
//     one thing this card is for.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every value of
//     @ARCC and @RESTC is inside 0..255 by construction.
//
// THE HONEST LIMIT, for the card copy. Two things, and the first is STAGE's.
//
//   1. HANGAR CANNOT SHOW A KEYSTROKE ARRIVING. gks is recorded and inert in
//      the browser: src/lib/sim/lua-host.ts binds it to recordHid and says at
//      :429 that nothing in HANGAR consumes them. The arc animates exactly as
//      it will on hardware and the keystroke is a claim the simulator does not
//      check. Row 24 of docs/HARDWARE-AUDITION.md is where the wire is
//      checked; row 23 is STAGE's and carries the same reason.
//   2. A KEYSTROKE SHUTTLE IS COARSE NEXT TO A JOG WHEEL. The host advances
//      one frame per key press, so the resolution is the press rate, and the
//      press rate is bounded by the 256-byte per-cycle protocol buffer: gks
//      costs 10 + 4n bytes, one 10 ms cycle holds about sixty-one key steps,
//      and the Timer sends one press per period. Whether the module can press
//      a key as fast as the top speed asks is a firmware question, and it is
//      the second half of row 24.
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
// against the pinned minifier: Setup 663 characters, Timer 201, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the six-knob cross-product is 663 / 201, leaving 245 free of 908,
// and the all-shortest corner is 659 / 201.
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
  "--[[@cb]]local R={22,23,24,33,42,51,60,59,58,57,56,47,38,29,20,21}for j=1,16 do local a=glag(0,R[j])glc(a,1,@RESTC,1)glc(a,2,@RESTC,1)glpfs(a,1,j*16,2,3)glpfs(a,2,j*16,2,3)glt(a,1,30000)glt(a,2,30000)end local function A(v)local k=v<0 and -v or v local f=v<0 and 256-@GAIN*k or @GAIN*k for j=1,16 do local a=glag(0,R[v<0 and 17-j or j])if j<=k*4 then glc(a,1,@ARCC,1)glc(a,2,@ARCC,1)glf(a,1,f)glf(a,2,f)else glc(a,1,@RESTC,1)glc(a,2,@RESTC,1)glf(a,1,2)glf(a,2,2)end glt(a,1,30000)glt(a,2,30000)end end self.s=0 self.touch_cb=function(s,i,e,x,y)local v=(e==1 or e==4)and x*9//128-4 or 0 if v~=s.s then if s.s==0 then gtt(0,20)end s.s=v A(v)end end gtt(0,@BASEP)";

const TIMER =
  "--[[@cb]]local v=self.s local k=v<0 and -v or v gtt(0,math.max(@BASEP//(1+k),20)//1)for n=0,80 do local a=glag(0,n)glt(a,1,30000)glt(a,2,30000)end if v>0 then gks(0,0,2,@KEYF)elseif v<0 then gks(0,0,2,@KEYB)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const SHUTTLE: CatalogEntry = {
  id: "shuttle",
  name: "SHUTTLE",
  description:
    "Scrub video with your finger, and the arc grows and spins faster the harder you push it.",
  // Feel-based, never a compiler kind (CONT-03). "video" is coined here;
  // "hotkeys" is coined by STAGE in the same wave and therefore stands as a
  // chip immediately.
  tags: ["video", "hotkeys", "gestural", "hypnotic"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs - the ceiling catalog.spec.ts allows - each one literal token
  // substitution over the vendored compiler's own widget vocabulary (TUNE-01).
  // Every default is the INDEX of the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @BASEP, @GAIN, @KEYF,
  // @KEYB, @ARCC and @RESTC. renderLua substitutes by plain String.replaceAll,
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
      // by 1 + |v|. The smallest quotient over these four values is 120//5 =
      // 24 ms, which is 24 presses a second at full tilt and well inside the
      // 256-byte cycle.
      values: ["400", "300", "200", "120"],
      default: 1,
    },
    {
      id: "gain",
      label: "Spin gain",
      kind: "amount",
      token: "@GAIN",
      // The animation rate per unit of speed. The rate is a uint8 that WRAPS,
      // so the top of this list is chosen by 32*4 = 128 < 256 and not by
      // taste.
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
      // A SIXTH KNOB RATHER THAN AN ARITHMETIC PARTNER, and the reason is that
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
      label: "Arc colour",
      kind: "colour",
      token: "@ARCC",
      // The lit part of the ring, on layer 2, with the phase running. Bright:
      // it is the only thing on this card that carries information.
      values: ["0,200,255", "255,90,0", "0,255,120", "255,0,180"],
      default: 0,
    },
    {
      id: "rest",
      label: "Resting colour",
      kind: "colour",
      token: "@RESTC",
      // The unlit part of the ring, on layer 2, still. Deliberately dim: it is
      // the track the arc runs on, and a bright track would read as a speed
      // the transport is not doing.
      values: ["0,25,50", "40,20,0", "0,40,20", "40,0,30"],
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

  // FALSE. Setup paints the full sixteen-cell ring in @RESTC, so the card
  // arrives showing a ring around an empty centre. frames.spec.ts test 5 turns
  // that declaration into a checked fact.
  restsBlack: false,
};
