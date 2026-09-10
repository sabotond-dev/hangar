// WHEELS - a pitch wheel on the left, a mod wheel on the right, and the whole
// point of the card is that THEY ARE NOT THE SAME CONTROL.
//
// THE ASK, VERBATIM, given after the bench notes and after Phase 11 was
// registered: "also: add a pitch and modwheel configs, leftside a pitchwheel
// rightside a modwheel on the ZONA beautifully visualized on the module".
// The word is plural - "configs" - but the layout sentence describes ONE module
// carrying BOTH wheels, pitch left and mod right, which is how a synthesiser's
// left-hand controller section is actually laid out. One catalog entry with two
// wheels side by side is the reading taken here, and it is the reading
// WHEELS-REQUEST.md records. The other reading - two entries, one per wheel,
// each using the whole pad - is not obviously wrong, but it loses the pair
// sitting next to each other the way they do on a keyboard, and changing the
// reading belongs to the user rather than to an executor.
//
// ---------------------------------------------------------------------------
// THE ASYMMETRY IS THE ENTRY
// ---------------------------------------------------------------------------
//
// A PITCH WHEEL IS SPRING-LOADED. It returns to centre the instant you let go,
// and its rest value is the middle of its range. A MOD WHEEL STAYS EXACTLY
// WHERE YOU LEFT IT, and its rest value is wherever that was. Build them as one
// control in two colours and there is no reason for this configuration to
// exist - it is two faders that happen to be painted differently.
//
// So the two halves differ in four places, and every one of them is asserted in
// src/lib/sim/lua-smoke.spec.ts rather than merely written down here:
//
//   1. WHAT THEY SEND. Pitch is fourteen-bit PITCH BEND on status 224. Mod is
//      an ordinary seven-bit CONTROL CHANGE on status 176.
//   2. WHAT HAPPENS ON A LIFT. Pitch springs home; mod does nothing at all.
//   3. WHAT THEY LOOK LIKE. Pitch is ONE LIT ROW that travels - a marker on a
//      rail. Mod is A BAR THAT FILLS FROM THE BOTTOM - an amount. The two are
//      DIFFERENT SHAPES, not merely different hues, and that matters because
//      both hues are knobs a visitor can set to the same value (D-11-12-b, and
//      the shape idiom 11-13 introduced for STRIP).
//   4. WHERE THEY REST. Pitch rests at the middle row. Mod rests at zero, which
//      is its rail alone.
//
// ---------------------------------------------------------------------------
// THE SPRING RETURNS ON THE WIRE, NOT ONLY IN THE LIGHT
// ---------------------------------------------------------------------------
//
// This is the failure mode WHEELS-REQUEST.md names by itself, and it is the one
// worth a test: IF THE PICTURE COMES HOME AND THE BEND DOES NOT, A HELD NOTE
// STAYS BENT AFTER THE FINGER IS GONE. The Timer therefore emits a bend on
// every step of the spring, and THE LAST ONE IT EMITS IS EXACTLY 8192 - the
// integer, not "near centre".
//
// That exactness is not a nicety, it is the shipped precedent. The joystick
// preset's compiled spring lands on EXACT LITERALS (8192 for a bend axis, 64
// for a CC axis) rather than on a scaled position, so it comes home
// bit-perfect wherever the finger left it. This card does the same, and it does
// it by construction: the Timer walks `d = b - 8192` towards zero by @RATE a
// step and STOPS THE WALK AT EXACTLY ZERO -
//
//     if d > @RATE then d = d - @RATE
//     elseif d < -@RATE then d = d + @RATE
//     else d = 0 end
//     b = 8192 + d
//
// - so the final assignment is `8192 + 0` and nothing rounds. A PROPORTIONAL
// SPRING WOULD NOT DO THIS AND WAS REJECTED FOR IT: `b = 8192 + (b-8192)*3//4`
// never lands, because Lua's `//` FLOORS TOWARDS MINUS INFINITY and a deflection
// of -1 maps to -3//4 = -1 forever. The card would sit one code flat, for good,
// with every gate in this repository green.
//
// ---------------------------------------------------------------------------
// gmbs IS NOT PITCH BEND, AND A CONFIG BUILT ON THAT READING SENDS MOUSE CLICKS
// ---------------------------------------------------------------------------
//
// `gmbs` is one of the compiler's HID out-calls - `gmms`, `gmbs` and `gks` are
// mouse-move, MOUSE-BUTTON and keyboard, recorded by `recordHid` in
// src/lib/sim/lua-host.ts:458 - and it is bound bare in the host only because
// tpad's compiled Setup opens with `gmbs(3,0)`. Reading the name as "bend send"
// gives a configuration that compiles, fits, simulates, installs and then
// SILENTLY CLICKS THE MOUSE instead of bending a note. It appears nowhere in
// the LUA - and that qualifier is load-bearing. A `grep -n "gmbs"` over this
// FILE returns four hits, every one of them in this paragraph, so the file-wide
// grep the plan asked for could never have been empty and would have been
// satisfied by prose either way. That is this phase's own warning cashed in
// before it cost anything: 11-13 lost a negative check to a plant that landed
// in a comment. lua-smoke.spec.ts therefore asserts the absence TWICE and
// neither assertion can be moved by a comment: the two rendered event strings
// carry no `gmbs`, `gmms` or `gks` at any knob position, and the host's HID log
// is EMPTY after the whole drive - a behavioural check no amount of prose can
// satisfy.
//
// MIDI pitch bend is status 224 (0xE0), fourteen bits, centre 8192, sent low
// byte first: `self:gms(@CH,224,b%128,b//128,0)`. The catalog already sends 144,
// 128 and 176 through the same call, so the status byte is DATA and is not
// special-cased anywhere.
//
// ---------------------------------------------------------------------------
// WHERE THE DIVIDE FALLS, AND WHY COLUMN 4 IS PAINTED
// ---------------------------------------------------------------------------
//
// NINE COLUMNS DO NOT HALVE. Columns 0..3 are the pitch wheel, columns 5..8 are
// the mod wheel, AND COLUMN 4 IS A LIT DIVIDER THAT BELONGS TO NEITHER. The
// alternative - 0..4 and 4..8, sharing the middle column - would make the
// boundary a lie: one column of the pad would answer to whichever wheel the
// arithmetic happened to reach first, and a finger landing on it could not know
// which. The divider is also free visual language. It marks the line a finger
// must not cross and it costs one column of paint.
//
// A CONTACT THAT BEGINS ON COLUMN 4 DOES NOTHING AT ALL, which is the honest
// consequence: `s.o[i]` records the onset COLUMN, the two branches are `c<4` and
// `c>4`, and 4 falls through both. The divider is not a dead cell the card
// forgot; it is a control-free strip and it is painted so a visitor can see
// that.
//
// ---------------------------------------------------------------------------
// THE ORIGIN LOCK - 11-13'S IDIOM, FOR THE SAME REASON
// ---------------------------------------------------------------------------
//
// Every gesture is locked at its onset to the wheel it started on. `s.o[i]` is
// written when `e==4 or e>8 or c==nil` and read on every later sample of that
// contact, so a finger that starts on pitch and slides across the divider onto
// the mod columns KEEPS BENDING and never touches the mod controller. Without
// it the two wheels share an edge and a diagonal drag jogs both. Costed at 50
// characters (895 against 845 without it), and it is the difference between two
// controls that merely send different messages and two controls that cannot
// interfere.
//
// `c==nil` is in the same onset test for the neighbouring hole: a MOVE for a
// contact whose onset was never delivered would otherwise index a nil column
// and raise.
//
// ---------------------------------------------------------------------------
// THE LEDS ARE THE READOUT, NOT THE QUANTISER
// ---------------------------------------------------------------------------
//
// The pad shows nine rows. THE VALUE IS NOT ROUNDED TO THEM. Pitch reads the raw
// coordinate and sends `(1023-y)*16383//1023`, which is 1024 distinct bend
// values over the travel; the marker row is a SECOND, INDEPENDENT derivation
// from the bend, `(16383-b)*9//16384`, computed only so the eye has something to
// follow. Mod reads `(1023-y)*127//1023`, all 128 codes, and its bar height
// `m*10//128` is likewise a readout of the value rather than the value itself.
// This is the distinction 11-13 drew for STRIP and the opposite of the one 11-07
// drew for CONSOLE, and the reason is the same in all three: continuous output
// wants resolution, a cell grid does not.
//
// THE TEN-BIT UNLOCK IS TAKEN, AND IT IS TAKEN FOR A THIRD REASON THAT NEITHER
// 11-13 NOR THE PLAN NAMES. `self:txma(1023)self:tyma(1023)` costs 53
// characters here (895 against 842 without it, the narrower literals it lets go
// of included). 11-13 measured the test as AXIS OWNERSHIP: a seven-bit control
// that owns a whole axis gains nothing, because firmware divides the native
// 0..1023 by eight and the code divides it straight back down. THE PITCH WHEEL
// OWNS THE WHOLE Y AXIS AND STILL WANTS IT, because its OUTPUT IS WIDER THAN
// THE AXIS: a locked axis offers 128 raw positions to a FOURTEEN-BIT value, so a
// bend would move in jumps of 128 codes and the card would be a seven-bit
// controller wearing a fourteen-bit label. Unlocked, it resolves 1024 positions.
//
//   SO THE RULE IS: unlock when a control owns a FRACTION of its axis (STRIP's
//   fader), or when its OUTPUT IS FINER THAN THE AXIS (this pitch wheel). Do
//   not unlock a cell grid, which is neither.
//
// AND BOTH AXES ARE UNLOCKED THOUGH ONLY y NEEDS IT, for the divergence 11-13
// filed as D-11-13-a: src/lib/sim/lua-host.ts:713-719 keeps ONE `_coordMax`
// behind both names, so an entry that unlocked y alone would be simulated with a
// ten-bit x it does not have on the module and every `x*9//1024` in it would map
// the whole pad into one column on real hardware, with nothing red anywhere.
//
// THE ONE VALUE A FINGER CANNOT HOLD IS THE ONE THE SPRING GUARANTEES, and that
// is worth saying out loud rather than leaving to be discovered. `(1023-y)*
// 16383//1023` reaches 16383 at y = 0 and 0 at y = 1023 - both ends EXACT, which
// is the CONSOLE lesson - but it steps from 8199 at y = 511 to 8183 at y = 512,
// so 8192 IS NOT REACHABLE BY HAND. That is what a spring-loaded wheel is: you
// cannot hold dead centre, you let go and it is dead centre. A centre detent
// that made 8192 holdable was costed at 922 of 908 and does not fit.
//
// ---------------------------------------------------------------------------
// THE TIMER: ARMED ON A LIFT, STOPPED WHEN THE SPRING LANDS
// ---------------------------------------------------------------------------
//
// SETUP DOES NOT ARM IT. Nothing in this card moves until a finger has bent the
// pitch wheel and let go, so arming at boot would be a Timer with nothing to do.
// The consequence is recorded rather than assumed: `frames.json` reports
// `animating` FALSE at all five sampled ticks and the declared motion is
// `static`. FORGE was the shipped precedent - a stored Timer of 373
// characters, armed only from touch_cb, and `static` at every tick - until
// plan 12-04 removed FORGE on the user's bench report, so this entry is now
// the only one of that shape. "Any entry with a stored Timer classifies as
// animated" is TRUE ONLY OF AN ENTRY WHOSE SETUP ARMS IT AND WHOSE TIMER
// RE-ARMS UNCONDITIONALLY. This one does neither.
//
// THE DISARM IS THE ABSENCE OF A RE-ARM, NEVER gtt(0,0). `gtt(index,0)` stops a
// Timer SILENTLY on firmware and is this catalog's documented trap - it was
// documented in shuttle.ts, which plan 12-04 deleted with the entry, so this
// header is what survives of it - and worse,
// src/lib/sim/lua-host.ts:679-685 returns early on a
// period of zero WITHOUT clearing the deadline - so a card that stopped itself
// that way would stop on the module and keep running in the preview, with
// nothing red. Instead the Timer body re-arms itself with `gtt(0,20)` only while
// there is still deflection to walk off, and the fire that lands on zero does
// not re-arm. THE PERIOD IS THE LITERAL 20 AND IS NEVER COMPUTED, so the
// `math.max(...,1)//1` floor the phase requires of a computed period has nothing
// to floor here.
//
// THE RE-ARM IS NOT THE FIRST STATEMENT IN THE BODY, AND THAT IS DELIBERATE.
// Firmware runs every handler inside a pcall (grid_lua.c:369), so a re-arm
// placed after something that raises dies permanently - which is why the idiom
// in this catalog is gtt-first. It cannot be first here, because whether to
// re-arm at all is the question the body exists to answer. What precedes it is
// `local s=self local d=s.h and 0 or s.b-8192 if d~=0 then` - two locals and one
// integer comparison over fields Setup writes before any Timer can fire. There
// is no raise path in front of the gtt.
//
// A NEW PRESS STOPS THE SPRING, and `s.h` is what makes that true. Without it a
// finger that lands during the return would set the bend from y and the next
// Timer fire, still armed, would pull it back towards centre UNDER A HELD
// FINGER. `s.h` is set on every pitch sample and cleared on the lift that arms
// the spring, and the Timer opens with `s.h and 0 or s.b-8192` - which works
// because 0 IS TRUTHY IN LUA, so a held wheel yields d = 0, does no work and
// does not re-arm. The honest edge: with TWO fingers on the pitch wheel, the
// first lift arms the spring and the second finger's next sample stops it again,
// so at most one spring step happens under the remaining finger.
//
// ---------------------------------------------------------------------------
// THE BUDGET, AND THE ARCHITECTURE IT CHOSE
// ---------------------------------------------------------------------------
//
// This is the phase's only entry that spends BOTH events, and it was costed as
// Lua before a line of it was authored. Every figure is
// `max(GridScript.compressScript(lua).length, lua.length)` after `padReady()`,
// at the RGB444 PICKER CORNER - every colour knob at 255,255,255 and every other
// knob at its longest declared value - which is the corner
// lua-entries.sweep.spec.ts actually gates.
//
//   sketch 1  a paint function per wheel, colour AND phase per repaint   1118
//   sketch 6  colours written once in Setup, a phase-only repaint        1035
//   sketch 11 ONE paint function, no separate Setup paint loop            922
//   shipped   sketch 11 slimmed: no sentinels, a one-layer divider        895
//
// THE NATURAL SHAPE DOES NOT FIT, BY 210 CHARACTERS, and the shipped one exists
// because of two moves. FIRST, ONE FUNCTION PAINTS THE WHOLE PAD - colour and
// phase together, all eighty-one cells - and Setup has no paint loop of its own
// at all; it sets two fields and calls `D(self)`. That costs four firmware calls
// per cell per repaint where two would do, which is exactly the trade strip.ts
// spends 34 characters to AVOID; here the characters are the scarce thing and
// the calls are not, because the repaint is gated on `(r,k)` changing and a
// whole pitch traverse fires it nine times. SECOND, `self.r` AND `self.k` GET NO
// SENTINEL VALUES: they start nil, and `r==s.r` against nil is false, so the
// first call paints. That is 19 characters of nothing.
//
// THE DIVIDER IS PAINTED ON ONE LAYER, and it is the only thing in this card
// that is. Layers ADD in the render sum (pad-sim.ts:1487-1508) and one layer
// caps at 254/512 of the asked colour, so a single-layer cell is at most half
// brightness - which is the brightness a divider wants anyway, and it is 22
// characters at the picker corner. Both wheels get both layers: with them, the
// divider measures 142 against the wheels' rails at 50 and 46, so it reads as a
// LINE rather than as more rail. That was measured off the rendered frame, not
// chosen by eye, and the first draft at phase 90 measured 38 - DIMMER than both
// rails, which is a divider nobody can see.
//
// SHIPPED, AT THREE CORNERS:
//
//                            Setup   free   Timer   free
//   RGB444 picker corner       895     13     343    565
//   all-longest declared       891     17     343    565
//   all-shortest declared      880     28     338    570
//   at the defaults            882     26     338    570
//
// THIRTEEN CHARACTERS FREE ON THE SETUP is the tightest margin in the catalog -
// STRIP's 33 was the previous one - and four shapes were priced out by it rather
// than argued away:
//
//   a deflection ribbon (the rows between centre and the marker lit)      939
//   a centre detent (so a finger can hold exactly 8192)                   922
//   a two-layer divider                                                   917
//   a mod wheel drawn as a bar WITH a marker cell on its top edge         914
//
// And four levers the card DOES take, priced by removing them: the ten-bit
// unlock 53, the second layer on both wheels 54, the origin lock 50, the
// held-finger guard 22. All eight numbers are in 11-15-SUMMARY.md, so a wave
// that wants any of them starts from a measurement.
//
// THE TIMER HAS 565 FREE AND NONE OF THE FOUR REJECTED SHAPES CAN USE IT: they
// are all Setup-side paint or Setup-side arithmetic, and moving the whole
// repaint into the Timer is the one thing this card cannot do. touch_cb has to
// repaint IMMEDIATELY, and the only way a Timer could do it is if touch_cb
// re-armed on every sample - which was SHUTTLE's documented trap until plan
// 12-04 removed that entry: it stops a Timer firing at all while a finger is
// moving, because each `gtt` pushes the deadline out by a whole period.
//
// WHAT THE TIMER DOES CARRY IS ITS OWN COPY OF THE PITCH REPAINT, and that
// duplication is deliberate and is the shipped idiom rather than an oversight:
// snake.ts declares `local function P(k,r,g,b)` in its Setup AND again in its
// Timer for exactly this reason - a Timer body is a separate chunk and cannot
// see a Setup local. The Timer's copy is SMALLER than `D` because during a
// spring only `r` can move: the mod wheel is untouched, every cell's colour is
// already set, and so the Timer writes PHASES on the pitch columns only.
// THE DUPLICATION IS CLOSED BY AN ASSERTION RATHER THAN BY A COMMENT:
// lua-smoke.spec.ts drives the pitch wheel away from centre, lets go, settles
// the spring and asserts the WHOLE FRAME IS BYTE-IDENTICAL TO THE BOOT FRAME.
// A Timer that repainted with a different rail phase, a different marker phase
// or a different row derivation is red there.
//
// AND `self.D` WAS TRIED FIRST AND WITHDRAWN. Storing the painter on `self` -
// `self.D=function(s)...end` plus `s:D()` - is legal Lua, is what every entry
// already does with `self.touch_cb`, ran green in a live host probe, and would
// have saved this duplication outright. It is NOT shipped because
// src/lib/catalog/host-surface.spec.ts refuses it: its classifier resolves a
// `self:` call only against HOST_SELF_METHODS, so an entry-installed method
// reads as "a self: method the host's SELF_PRELUDE does not install". THE GATE
// IS INCOMPLETE RATHER THAN RIGHT - `self` is a plain table an entry writes to,
// which is the whole mechanism behind `self.touch_cb` - and it is recorded as a
// finding in 11-15-SUMMARY.md rather than widened here, because a card the user
// is going to flash is the wrong place to introduce the catalog's first
// entry-installed method.
//
// ---------------------------------------------------------------------------
// THE TRAPS THIS ENTRY CONTAINS
// ---------------------------------------------------------------------------
//
//   - THE SPRING'S LAST BEND MUST BE EXACTLY 8192. The `else d=0` arm is what
//     makes it exact. Replace it with anything proportional and the card sits
//     permanently a code or two flat.
//   - EVERY DIVISION IS FLOORED. //1023, //1024, //16384, //128 and //9 are all
//     `//`. A fraction reaching a firmware call becomes 0, silently.
//   - THE BEND IS SENT LOW BYTE FIRST. `b%128` then `b//128`. Swapping them is
//     a card that bends in 128-code jumps and looks almost right.
//   - THE LIVE FILTER IS THE BLESSED SPELLING. `e~=1 and e~=4 and e<9 then` -
//     which lets a coalesced DOWNUP 9 through as a normal sample - and the
//     onset beside it is `e==4 or e>8 or c==nil`, which admits it. A fast tap on
//     the pitch wheel therefore bends and springs back in one message, which is
//     what the module does and what the preview cannot show: src/lib/sim/
//     touch.ts never emits code 9 (TOUCH-CODE-9.md), so in a browser the same
//     gesture arrives as a 4 and a 5 - WHICH THIS CARD ALSO HANDLES, and which
//     is why the spring is triggered by a plain lift rather than by anything
//     only code 9 can deliver.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
//     every value of @PWC, @MWC and @DVC is inside 0..255 by construction.
//   - NO KEEPER AND NO DECAY. Nothing writes glt, glf or glpfs, so there is no
//     countdown to freeze and no rate to wrap. decay-idiom.spec.ts has nothing
//     to check here and that is by construction rather than by exemption.
//   - `s.h` IS CLEARED IN TWO PLACES and both are required: the ordinary lift,
//     and the `e>8` arm inside the pitch branch, where a coalesced tap is its
//     own release.
//
// ROUTE: kind "lua", not kind "state". The compiler's sheet has no pitch-bend
// out-call at all - `sends` covers notes, controllers, keys and mouse - and no
// way to say "these four columns are one control and those four are another".
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 882, Timer 338, both fixed points of
// compressScript and both accepted by checkSyntax.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them. Everything worth saying is said here, in
// TypeScript, where it costs nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self:txma(1023)self:tyma(1023)self.o={}self.b=8192 self.m=0 local function D(s)local r=(16383-s.b)*9//16384 local k=s.m*10//128 if r==s.r and k==s.k then return end s.r=r s.k=k for n=0,80 do local c=n%9 local w=n//9 local a=glag(0,n)local p=255 if c<4 then glc(a,1,@PWC,1)glc(a,2,@PWC,1)p=w==r and 255 or 30 elseif c>4 then glc(a,1,@MWC,1)glc(a,2,@MWC,1)p=w>=9-k and 255 or 30 else glc(a,1,@DVC,1)end glp(a,1,p)glp(a,2,p)end end D(self)self.touch_cb=function(s,i,e,x,y)if e~=1 and e~=4 and e<9 then if(s.o[i]or 9)<4 then s.h=nil gtt(0,20)end s.o[i]=nil return end local c=s.o[i]if e==4 or e>8 or c==nil then c=x*9//1024 s.o[i]=c end if c<4 then s.h=1 s.b=(1023-y)*16383//1023 s:gms(@CH,224,s.b%128,s.b//128,0)if e>8 then s.o[i]=nil s.h=nil gtt(0,20)end elseif c>4 then local v=(1023-y)*127//1023 if v~=s.m then s.m=v s:gms(@CH,176,@CC,v,0)end end D(s)end";

const TIMER =
  "--[[@cb]]local s=self local d=s.h and 0 or s.b-8192 if d~=0 then gtt(0,20)if d>@RATE then d=d-@RATE elseif d<-@RATE then d=d+@RATE else d=0 end s.b=8192+d s:gms(@CH,224,s.b%128,s.b//128,0)local r=(16383-s.b)*9//16384 if r~=s.r then s.r=r for n=0,80 do if n%9<4 then local a=glag(0,n)local p=n//9==r and 255 or 30 glp(a,1,p)glp(a,2,p)end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const WHEELS: CatalogEntry = {
  id: "wheels",
  name: "WHEELS",
  description:
    "Pitch on the left springs home the moment you let go; the mod wheel on the right stays where you left it.",
  // D-10: one FOR term then two FEELS, drawn from the closed fourteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  //
  // CHOSEN FOR WHAT IS TRUE OF THE CARD, AND THE HISTOGRAM WAS READ AFTERWARDS
  // RATHER THAN BEFORE. "modulation" is the truthful FOR term - a pitch and mod
  // wheel pair IS the modulation section of a keyboard - and it takes that term
  // from 7 to 8. "expressive" is what a wheel pair is for: it is the half of a
  // synthesiser you play with your left hand while the right hand holds a note,
  // and it goes from 11 to 12. "precise" is true at a scale nothing else in this
  // catalog reaches - 1024 distinct bend positions across the travel, against
  // STRIP's 128 - and it goes from 6 to 7, WHICH LIFTS IT OFF THE FLOOR
  // facets.spec.ts asserts. That is a CONSEQUENCE and it is reported as one; it
  // is not why the tag was picked, and "still" - the tag that would have left
  // the floor where it was - is simply not true of a card whose whole gesture is
  // something moving on its own after your finger has gone.
  tags: ["modulation", "expressive", "precise"],
  featured: false,
  addedAt: "2026-09-10",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Six knobs, the catalog's maximum (catalog.spec.ts caps a Lua entry at six),
  // each one literal token substitution over the vendored compiler's own widget
  // vocabulary (TUNE-01). Every default is the INDEX of the value that
  // reproduces the canonical text.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @CC, @CH, @PWC, @MWC,
  // @DVC and @RATE. renderLua substitutes by plain String.replaceAll, so a token
  // that is a prefix of another is eaten or corrupted depending on knob order.
  // No one of these six is a prefix of another - @CC and @CH share only "@C" and
  // neither continues into the other.
  //
  // @RATE APPEARS ONLY IN THE TIMER and the three colours only in the Setup.
  // That is legal and it is checked: lua-entries.sweep.spec.ts asserts no live
  // token survives rendering IN EITHER EVENT, at every value of every knob, so a
  // token that went missing from the one event that carries it is red.
  knobs: [
    {
      id: "cc",
      label: "Mod controller",
      kind: "amount",
      token: "@CC",
      // ONE controller, not a pair: the pitch half of this card does not use a
      // controller number at all, because pitch bend has a status byte of its
      // own. CC1 is the modulation wheel by convention and is the default; 11 is
      // expression, 74 is brightness on the GM2/GS convention, and 2 is breath.
      // All four are seven-bit and inside 0..127 at every index.
      values: ["1", "11", "74", "2"],
      default: 0,
    },
    {
      id: "channel",
      label: "Channel",
      kind: "mode",
      token: "@CH",
      // ZERO-BASED, and it is the FIRST argument: self:gms(ch, cmd, p1, p2,
      // mode). BOTH streams ride it - the bend and the controller - because a
      // pitch wheel and a mod wheel on a keyboard address one instrument. Four
      // channels rather than sixteen: a sixteen-value knob would add twelve
      // combinations to the sweep for a choice nobody makes.
      values: ["0", "1", "9", "15"],
      default: 0,
    },
    {
      id: "pitch",
      label: "Pitch wheel colour",
      kind: "colour",
      token: "@PWC",
      // Columns 0..3, on layers 1 and 2. The marker row rides at phase 255 and
      // the rail beneath and above it at 30, so the wheel has a visible body and
      // the eye can find the marker on it. APPEARS TWICE - once per layer.
      values: ["0,180,255", "255,255,255", "180,0,255", "0,255,120"],
      default: 0,
    },
    {
      id: "mod",
      label: "Mod wheel colour",
      kind: "colour",
      token: "@MWC",
      // Columns 5..8, on layers 1 and 2, same rail-and-level treatment. The four
      // values are chosen to sit apart from @PWC's at every index - amber
      // against cyan, green against white, magenta against violet, cyan against
      // green - because two wheels that read as one picture is exactly the
      // failure D-11-12-b names. THE SHAPES DIFFER TOO, which is what the test
      // asserts: no knob can make a travelling single row look like a bar
      // growing from the bottom.
      values: ["255,150,0", "0,255,120", "255,0,180", "0,220,220"],
      default: 0,
    },
    {
      id: "divider",
      label: "Divider colour",
      kind: "colour",
      token: "@DVC",
      // Column 4, ON LAYER 1 ONLY - the single-layer cell in this card, capped
      // at half brightness by the render sum, which is what a divider wants. It
      // is a boundary marker rather than a control, and a contact that begins on
      // it does nothing at all.
      values: ["90,90,110", "120,90,0", "0,90,90", "255,255,255"],
      default: 0,
    },
    {
      id: "spring",
      label: "Spring speed",
      kind: "spring",
      token: "@RATE",
      // How far the bend walks back towards 8192 on each 20 ms Timer fire, so a
      // full deflection of 8191 comes home in 32, 16, 8 or 4 fires - 640, 320,
      // 160 or 80 milliseconds. THE DEFAULT IS 512, which reads as travel rather
      // than as a jump. Every value lands on EXACTLY 8192 whatever the
      // deflection was, because the walk's last step is `else d=0`, and the test
      // drives all four rather than trusting the arithmetic.
      values: ["256", "512", "1024", "2048"],
      default: 1,
    },
  ],

  // The same six indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    cc: 0,
    channel: 0,
    pitch: 0,
    mod: 0,
    divider: 0,
    spring: 1,
  },

  // FALSE. Setup calls D(self) once, which lights all eighty-one cells: the
  // pitch rail with its marker on the middle row, the divider, and the mod rail
  // with nothing above it because a fresh mod wheel is at zero. BOTH REST STATES
  // ARE VISIBLE AT POWER-ON, which is the point - a card that looks dark before
  // it is touched looks broken. frames.spec.ts test 5 turns this declaration
  // into a checked fact, and because the entry does not rest black it CANNOT
  // carry a demonstration gesture: listing.spec.ts fails any DEMO_PATHS key
  // whose entry is lit.
  restsBlack: false,
};
