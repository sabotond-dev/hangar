// STAGE - nine scenes for a stream, over plain keystrokes.
//
// Nine big zones, one per scene. The live one glows; the one under your finger
// breathes while you hold it. It works on a machine with NOTHING INSTALLED -
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
//   - Z(z, f) is the whole painter and f is a RATE, not a flag: f = 0 paints
//     the idle box, f > 0 paints a live box in @LIVEC on layer 2 and arms a
//     breathe on layer 1 at rate f. The live zone breathes at 4 and the zone
//     under a finger breathes at 24, which is the difference between "this is
//     the scene you are on" and "this is the scene your hand is on".
//   - The Timer refreshes the live zone's four layer-1 TIMEOUTS every 2560 ms
//     and does nothing else. See the trap about re-issuing glpfs below.
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
//   - THE KEEPER IS 30000 ON A LAYER WHOSE RATE IS SINGLE DIGIT, and that is
//     LEGITIMATE - DO NOT FIX IT. Pitfall 1 is a keeper on a layer carrying a
//     DECAY; the live zone's rate is 4 (24 under a finger), an order of
//     magnitude below the rate floor the guard discriminates on, and the
//     picture is a continuous breathe rather than a trail that has to reach
//     black.
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
// against the pinned minifier: Setup 505 characters, Timer 109, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the four-knob cross-product is 511 / 109, leaving 397 free of 908,
// and the all-shortest corner is 504 / 109.
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
  "--[[@cb]]local function Z(z,f)local r=z//3*27+z%3*3 for j=0,3 do local a=glag(0,r+j%2*2+j//2*18)if f>0 then glc(a,1,@LIVEC,1)glc(a,2,@LIVEC,1)glpfs(a,1,0,f,3)glt(a,1,30000)else glc(a,1,0,0,0,1)glc(a,2,@ZONEC,1)glp(a,1,0)glt(a,1,0)end glp(a,2,255)end end for z=0,8 do Z(z,0)end Z(0,4)self.l=0 self.touch_cb=function(s,i,e,x,y)local z=x*3//128+y*3//128*3 if e==4 or e>8 then if z~=s.l then Z(s.l,0)s.l=z end Z(z,e>8 and 4 or 24)gks(10,1,1,@MOD,0,2,@KEY0+z,1,0,@MOD)elseif e>=5 then Z(s.l,4)end end gtt(0,2560)";

const TIMER =
  "--[[@cb]]gtt(0,2560)local z=self.l local r=z//3*27+z%3*3 for j=0,3 do glt(glag(0,r+j%2*2+j//2*18),1,30000)end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STAGE: CatalogEntry = {
  id: "stage",
  name: "STAGE",
  description:
    "Nine scenes for your stream: the live one glows and the one you are lining up breathes.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "streaming" and "hotkeys" were both coined here and both retire. Nine
  // scenes you fire and watch is what "clips" and "playable" mean, and it puts
  // this card on the same shelf as GRIDLOCK, which is where a visitor looking
  // for either would look.
  tags: ["clips", "playable", "readable"],
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
