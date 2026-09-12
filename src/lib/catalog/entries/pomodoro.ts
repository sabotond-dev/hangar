// POMODORO - twenty-five minutes that mean something in a room.
//
// A countdown you read at a glance from three metres away and never have to
// look at twice. The 32 border cells are the ring; one goes out for every
// forty-seven seconds of a twenty-five minute interval, and the inner 7x7
// breathes in the working colour while it runs and in the resting colour after
// it ends. The point of putting a timer on a pad instead of in a menu bar is
// that the time left stops being a number you go and check and becomes a thing
// in the room, which is why the ring is the whole edge and why nothing about
// this card needs reading.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - THE RING IS THE 32 BORDER CELLS, WALKED CLOCKWISE ONCE IN SETUP into
//     self.r, so the Timer indexes rather than recomputes. The walk is four
//     small loops: the top row 0..8 (nine cells), the right column k*9+8 for
//     k = 1..8 (eight), the bottom row 80-k for k = 1..8 (eight, right to
//     left), and the left column (8-k)*9 for k = 1..7 (seven, bottom to top).
//     Nine plus eight plus eight plus seven is thirty-two, every index appears
//     exactly once, and r[1] is the top-left corner.
//   - THE DRAIN IS ONE FLOORED DIVIDE. self.t is the seconds remaining and
//     self.n is the interval in seconds, fixed in Setup as @MINS * 60. The
//     Timer lights r[1] .. r[m] in the working colour and blacks the rest,
//     where m = self.t * 32 // self.n. The lit arc therefore retreats
//     clockwise from index 32 back toward index 1, so the darkness opens just
//     below the top-left corner and eats backwards down the left edge. One
//     divide, floored, and thirty-two glc pairs a second, which is nothing.
//   - THE RING'S PHASE IS WRITTEN ONCE. Setup puts all 32 border cells at
//     phase 255 on both layers and the Timer only ever rewrites their COLOUR.
//     An all-zero colour renders black at every phase because the sixth
//     argument of glc forces the layer's minimum stop black, so one call
//     serves both lighting and blacking.
//   - THE INNER 7x7 BREATHES on layer 2 only, at glpfs(a, 2, (x+y)*16, 1, 3) -
//     shape 3 is the sine table, rate 1 advances the phase one step per 10 ms
//     tick, and the (x+y)*16 spread runs 32..224 across the diagonal so the
//     breathe rolls corner to corner rather than pulsing in unison. A full
//     cycle is 256 ticks, about two and a half seconds.
//   - START AND PAUSE IS ONE TAP anywhere in the inner 7x7. Running, a tap
//     pauses and self.t stops moving, so the ring HOLDS where it is rather
//     than resetting. Paused, a tap resumes. At zero, a tap resets self.t to
//     the full interval and puts the inner colour back to the working one.
//     A tap on the ring itself does nothing, which is deliberate: the ring is
//     a readout and not a control.
//   - EVERY TAP ALSO SENDS A TRANSPORT NOTE AN OCTAVE BELOW THE ALARM, note-on
//     and its note-off together, and it is not decoration. A card whose only
//     output arrives twenty-five minutes after somebody starts it has no way
//     to tell anything that it started, and lua-smoke.spec.ts test 2 says so
//     in those words: it runs a scripted gesture plus two hundred further
//     ticks - 218 in total, about 2.2 seconds - and fails an entry that
//     produced no output at all. The octave gap is the idiom SNAKE uses for
//     its death note and it keeps the transport note distinguishable from the
//     alarm on the same channel. Recorded as a deviation in 09-09-SUMMARY.md.
//   - AT ZERO the Timer sends one note-on and its note-off, stops itself, and
//     paints the WHOLE ring plus the whole inner field in the resting colour.
//     ONE NOTE, ONCE - not a note a second - because self.p goes to 0 in the
//     same branch and the branch can never be entered again until a tap resets
//     the interval.
//
// THE SIX INTERVALS, AND WHY TWO OF THEM ARE SHORT (plan 11-09, from the
// bench: "make a 1 minute and a 5 minute one").
//
//   @MINS carries 15, 20, 25, 50, 1 and 5, IN THAT ORDER, and the order is not
//   untidiness. A knob position is stamp payload: format x and format w both
//   write ONE base-32 character per non-colour knob, BY INDEX, so inserting 1
//   and 5 at the front would have silently re-pointed every POMODORO link ever
//   shared at a different interval - a 50-minute link rendering as 1 minute,
//   with nothing anywhere going red. APPEND. NEVER INSERT, NEVER SORT, NEVER
//   TIDY. src/lib/share/stamp.spec.ts test 9 pins indices 0..3 to 15, 20, 25
//   and 50 against four payload literals captured before the append.
//
//   THE PRICE OF THE APPEND, STATED RATHER THAN DISCOVERED LATER. Appending
//   keeps the four old indices pointing at the four old intervals, which is
//   the silent failure it exists to avoid - but it is still a RESIZE, and the
//   stamp's shape character is a resize tripwire. luaColour/lua shapeOf sums
//   the option counts, so POMODORO's shape moves from `n` to `p` and every
//   POMODORO stamp minted before this change now lands `older` instead of
//   `restored`. That is the tripwire working: stamp.spec.ts test 3 already
//   pins "a resized knob must be older, never restored", and `older` is the
//   graceful apology rather than a wrong interval. It cannot be avoided while
//   the knob grows - the shape character is a function of the option count -
//   and it is the reason test 9 asserts the INDEX MAPPING through
//   readLuaColourPayload rather than asserting a landing of `restored`.
//
//   THE SHORT INTERVALS ARE THE EASY CASE, AND THE OBVIOUS WORRY IS THE WRONG
//   ONE. Everything below about the 655 second ceiling belongs to the LONG
//   intervals: 25 minutes is 1500 seconds and 50 is 3000, both far past the
//   600-second keeper, and both depend on the Timer's 300-second re-issue.
//   One minute and five minutes are 60 and 300 seconds and cannot reach the
//   ceiling during their countdown at all. They still need the re-issue AFTER
//   they finish - the card goes on breathing forever and the re-arm branch
//   sits outside `if s.p > 0` precisely so that it does - which is measured:
//   the inner breathe is still advancing a phase step per tick at t = 700 s at
//   1, 5 and 25 minutes alike.
//
//   THE RING ARITHMETIC HOLDS AT BOTH, CHECKED RATHER THAN ASSUMED.
//   m = s.t*32//s.n takes all 33 values 32..0 at every interval, so no cell is
//   skipped and none is drawn twice: at n = 60 a step is 1.875 s and at
//   n = 300 it is 9.375 s. Measured end to end through the real Lua host, the
//   ring drains monotonically to zero and exactly one alarm note-on is sent.
//
//   AT FIVE MINUTES THE RE-ISSUE AND THE COMPLETION LAND ON THE SAME TIMER
//   CALL, and the order is the one that works. self.c reaches 0 at tick 300
//   and self.t reaches 0 at tick 300; the re-issue branch runs FIRST and only
//   re-arms glpfs and glt, then the completion branch writes @BREAKC over it.
//   A re-issue that also wrote a colour would have to move.
//
// THE 655 SECOND CEILING, AND WHY THIS ENTRY EXISTS IN THIS FORM.
//
//   glt CAPS AT 65535 TICKS, WHICH IS ABOUT 655 SECONDS. THE INNER BREATHE IS
//   ARMED AT 60000 TICKS - 600 SECONDS - AND A TWENTY-FIVE MINUTE INTERVAL IS
//   1500 SECONDS, SO IT WOULD FREEZE TWICE DURING ONE POMODORO. ON THE LAST
//   TICK OF A COUNTDOWN FIRMWARE SETS THE LAYER'S RATE TO 0 AND THE ANIMATION
//   STOPS AT WHATEVER PHASE IT REACHED, AND RE-ARMING WITH glt ALONE WILL NOT
//   RESTART IT - THE RATE HAS ALREADY BEEN ZEROED. THE TIMER THEREFORE
//   RE-ISSUES glpfs AND glt ON ALL 49 INNER CELLS EVERY 300 SECONDS, WHICH IS
//   HALF THE TIMEOUT AND WELL BEFORE ANY EXPIRY. DO NOT REMOVE THAT BRANCH AND
//   DO NOT REPLACE IT WITH glt ALONE. A card that dies after ten minutes on a
//   visitor's real hardware is a broken card, and no gate in this repository
//   runs an entry long enough to notice: lua-smoke.spec.ts runs 200 ticks and
//   frames.json samples to 1009. The 160,000-tick run that checks it is in
//   09-09-SUMMARY.md and it is the only place it has ever been checked.
//
//   The re-arm branch sits OUTSIDE the `if s.p > 0` test on purpose. After the
//   interval ends the countdown stops but the breathe must not, so the re-issue
//   has to keep running while the card is paused, finished or waiting.
//
//   ZONA-CAPABILITIES.md 5.3 lists three ways to beat the ceiling and says
//   there is no fourth: a Timer event re-arming, a self.tim rawset from Setup,
//   or re-arming inside touch_cb - which only works while somebody is touching
//   the pad and is therefore wrong for an ambient card. This is the first.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints a full ring and starts
// the breathe, so the card is complete on arrival: the golden frames open on
// thirty-two lit border cells and a moving interior, and they show the ring
// already draining by tick 1009.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE 655 SECOND RE-ISSUE, above, in capitals, DO NOT REMOVE.
//   - glt(a, 2, 60000) IS A LONG KEEPER AND IT IS LEGITIMATE - DO NOT "FIX" IT.
//     Pitfall 1 is a keeper on a layer carrying a DECAY, and its signature is a
//     long timeout together with a fast rate. This layer's rate is 1. The
//     smoke gate's rate floor is 200, three orders of magnitude above it, and
//     60000 is below the gate's keeper floor as well, so this entry is outside
//     the signature on both axes rather than only one. ARC's two keepers are
//     the same case and carry the same note.
//   - THE TIMER PERIOD IS THE LITERAL 1000 AND IS NEVER COMPUTED. gtt(index, 0)
//     never fires - firmware's guard is `> 0` - and is indistinguishable from
//     stopping the timer. A period derived from a knob could reach zero; this
//     one cannot.
//   - EVERY DIVISION IS FLOORED. The drain m = s.t*32//s.n, both coordinate
//     divisions x*9//128 and y*9//128, and n//9 in every cell loop are all `//`
//     or `%`. A fractional argument to a firmware call is silently zeroed.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of both palettes is
//     inside 0..255. The breathe's phase spread is (x+y)*16 with x and y in
//     1..7, so it runs 32..224 and can never wrap.
//   - CODE 9 IS HANDLED. `if e~=4 and e<9 then return end` fires on a press
//     (4) and on a coalesced fast tap (9) and on nothing else, so a quick
//     start-pause is never missed and a move never toggles anything.
//   - AN ALERT LIGHTS THE SAME 32 CELLS. On ZONA the alert system touches only
//     the border LEDs - the exact ring this card draws on - and it is
//     ADDITIVE, so a page change or a USB event briefly brightens the ring.
//     That is a fact about the module, not a fault in the configuration, and
//     nothing here should be changed to avoid it.
//   - THE ALARM NOTE IS SENT ONCE. self.p is cleared in the same branch that
//     sends it, so the zero branch cannot be re-entered until a tap resets the
//     interval. The transport note is per tap, which is a different thing and
//     is bounded by how fast a finger can tap.
//   - THE NOTE RANGE IS @NOTE - 12 .. @NOTE. The bottom is 48 - 12 = 36 and
//     the top is 84, both inside 0..127 at every knob position.
//
// THE HONEST LIMIT, for the card copy. The pad has no clock of its own beyond
// its Timer, and firmware fires a Timer on the next 100 Hz UI cycle AFTER the
// countdown expires - so every tick is 10 ms late at best and later under load,
// and the error accumulates over 1500 of them. This is a kitchen timer, not a
// stopwatch: expect the ring to reach zero a little after the wall clock does,
// and expect the gap to be visible over twenty-five minutes.
//
// ROUTE: kind "lua", not kind "state". NOTHING IN PadState COUNTS. `sends.kind`
// is none | xy | zones | faders | trackpad | dial and none of them has a notion
// of elapsed time; every `look.kind` is a phase generator that computes a
// colour from a tick and has no memory of how many ticks have gone by, so a
// value that decreases once a second and survives across ticks has no
// representation on the sheet at all. `showGrid` paints its zones in one
// gridColour as well, so a ring of thirty-two individually decided cells could
// not be drawn there even if something could count.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 733 characters, Timer 647, both fixed
// points of compressScript and both accepted by checkSyntax.
// src/lib/catalog/lua-entries.sweep.spec.ts asserts every one of those claims.
//
// THE CORNER, RE-MEASURED AT THE ONE THE GATE READS (plan 11-09). This header
// used to say the all-longest corner was 735 / 649 with 173 and 259 free. That
// is the DECLARED-PALETTE corner - the longest literal each colour knob
// happens to ship - and it is not what the 908 gate reads. A picker can write
// any RGB444 colour into a colour token (D-06), so the real worst corner puts
// 255,255,255 in both colour knobs, and POMODORO declares neither. The picker
// corner is 743 / 659, which leaves 165 free on the Setup and 249 on the
// Timer. Lower than the header claimed, in the dangerous direction, and the
// same systematic error plans 11-07 and 11-08 corrected in CONSOLE, FORGE and
// STEPS. POMODORO is the fourth.
//
// APPENDING TWO ONE-DIGIT INTERVALS DID NOT MOVE THE WORST CORNER AND COULD
// NOT HAVE. The worst corner takes each knob's LONGEST value, and "1" and "5"
// are shorter than the four that were already there, so the corner is still
// 743 / 659 exactly. What moved is the ALL-SHORTEST corner, 717 -> 716 on the
// Setup and 627 unchanged on the Timer - a single character, which is also the
// proof that @MINS reaches exactly one site and that site is in the Setup.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them and they would be charged to the budget.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]local r={}for k=0,8 do r[k+1]=k end for k=1,8 do r[k+9]=k*9+8 r[k+17]=80-k end for k=1,7 do r[k+25]=(8-k)*9 end self.r=r self.n=@MINS*60 self.t=self.n self.p=1 self.c=300 local function I(p,q,w)for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glc(a,2,p,q,w,1)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end I(@RINGC)for k=1,32 do local a=glag(0,r[k])glc(a,1,@RINGC,1)glc(a,2,@RINGC,1)glp(a,1,255)glp(a,2,255)end self.touch_cb=function(s,i,e,x,y)if e~=4 and e<9 then return end local c=x*9//128 local w=y*9//128 if c<1 or c>7 or w<1 or w>7 then return end if s.t<1 then s.t=s.n I(@RINGC)s.p=1 else s.p=1-s.p end s:gms(@CH,144,@NOTE-12,90,0)s:gms(@CH,128,@NOTE-12,0,0)end gtt(0,1000)";

const TIMER =
  "--[[@cb]]gtt(0,1000)local s=self s.c=s.c-1 if s.c<1 then s.c=300 for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then local a=glag(0,n)glpfs(a,2,(x+y)*16,1,3)glt(a,2,60000)end end end if s.p>0 then s.t=s.t-1 if s.t>0 then local m=s.t*32//s.n for k=1,32 do local a=glag(0,s.r[k])if k<=m then glc(a,1,@RINGC,1)glc(a,2,@RINGC,1)else glc(a,1,0,0,0,1)glc(a,2,0,0,0,1)end end else s.p=0 s:gms(@CH,144,@NOTE,110,0)s:gms(@CH,128,@NOTE,0,0)for k=1,32 do local a=glag(0,s.r[k])glc(a,1,@BREAKC,1)glc(a,2,@BREAKC,1)end for n=0,80 do local x=n%9 local y=n//9 if x>0 and x<8 and y>0 and y<8 then glc(glag(0,n),2,@BREAKC,1)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const POMODORO: CatalogEntry = {
  id: "pomodoro",
  name: "Pomodoro",
  description:
    "A twenty-five minute ring draining around the edge, so the time left is a thing in the room.",
  // D-10: one FOR term then two FEELS, drawn from the closed thirteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "ambient", "calm" and "utility" all retire. A ring you can read from
  // across the room that keeps draining on its own is three terms rather than
  // four, and it says more.
  tags: ["show", "readable", "generative"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @MINS, @RINGC, @BREAKC,
  // @NOTE and @CH. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these five is a prefix of another.
  //
  // 300 - the re-arm period in seconds - IS A LITERAL AND NOT A KNOB, and so is
  // the Timer's 1000 ms period. Both are load-bearing against the 655 second
  // ceiling and against gtt's `> 0` guard; a visitor who could raise the first
  // or zero the second would get a card that freezes or a card that never ticks
  // again, and neither failure would be visible in a browser inside 1009 ticks.
  knobs: [
    {
      id: "mins",
      label: "Minutes",
      kind: "count",
      token: "@MINS",
      // The interval. 25 is the pomodoro proper; 15 and 20 are the shorter
      // intervals people actually keep to, and 50 is the two-pomodoro block.
      // 1 and 5 are the bench's ask (plan 11-09) - a one-minute and a
      // five-minute timer, for the short things a pomodoro is too long for.
      //
      // THE ORDER IS THE POINT AND IT IS NOT SORTED. The two new values are
      // APPENDED, so 15, 20, 25 and 50 keep indices 0, 1, 2 and 3 forever. A
      // knob position is stamp payload - one base-32 character per non-colour
      // knob, by index, in both format x and format w - so an insertion at the
      // front would re-point every link ever shared at a different interval,
      // silently, with no test anywhere going red. `stamp.spec.ts` test 9
      // exists for exactly this and pins the four to four captured literals.
      //
      // It reaches ONE site - self.n = @MINS * 60 in the Setup - and
      // everything downstream divides by self.n, so the ring's arithmetic
      // cannot disagree with the interval it is drawing. Two of the six values
      // are now one digit rather than two, which lowers the all-shortest
      // corner by one character and leaves the worst corner exactly where it
      // was.
      values: ["15", "20", "25", "50", "1", "5"],
      default: 2,
    },
    {
      id: "ring",
      label: "Working colour",
      kind: "colour",
      token: "@RINGC",
      // The draining ring and the breathing interior while the interval runs.
      // Four warm triples, EXACTLY NINE CHARACTERS EACH on purpose: the token
      // reaches four sites in the Setup and two in the Timer, so a mixed-length
      // set would move six positions at once and put the corner somewhere that
      // has to be re-measured every time the palette is touched.
      values: ["255,120,0", "255,30,10", "255,200,0", "255,60,90"],
      default: 0,
    },
    {
      id: "break",
      label: "Resting colour",
      kind: "colour",
      token: "@BREAKC",
      // What the whole pad turns when the interval ends - the ring and the
      // interior together, which is what makes "done" readable from across a
      // room without counting cells. Four cool triples, nine characters each
      // for the same reason as above; this token reaches three sites, all in
      // the Timer.
      values: ["0,140,255", "0,255,180", "60,90,255", "0,200,220"],
      default: 0,
    },
    {
      id: "note",
      label: "Alarm note",
      kind: "note",
      token: "@NOTE",
      // The alarm, sent at the moment the interval ends with its note-off in
      // the same branch. Every tap also sends this note MINUS TWELVE - an
      // octave below - so starting and pausing are on the wire too and the two
      // can never be confused. Two digits at every position; the range across
      // the whole knob is 36..84 and every value of it is inside 0..127.
      values: ["60", "72", "48", "84"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument of self:gms(ch, cmd, p1, p2,
      // mode). Four common channels rather than all sixteen, for the reason
      // the phase gives everywhere: a sixteen-value channel knob alone would be
      // sixteen of this entry's twenty-two sweep combinations. It appears at
      // ALL FOUR gms sites - the alarm and its note-off in the Timer, the
      // transport note and its note-off in the Setup - so no note-off can ever
      // go out on a channel its note-on did not.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    mins: 2,
    ring: 0,
    break: 0,
    note: 0,
    channel: 0,
  },

  // FALSE. Setup paints all 32 border cells at phase 255 on both layers and
  // starts the interior breathing, so a sampler that never touches the pad
  // reads a full ring at every tick. frames.spec.ts test 5 turns that
  // declaration into a checked fact.
  restsBlack: false,
};
