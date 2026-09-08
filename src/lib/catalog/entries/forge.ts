// FORGE - twenty-seven macros in three colour families, and a second bank
// under a held corner.
//
// USE-CASES.md N7: build and run, format, git add-commit-push, toggle the
// terminal, jump to a file. A developer does not need a picture of the command;
// they need to know which THIRD of the pad they are reaching into, and then to
// double the pad without doubling its size. Three colour bands answer the
// first. A held corner answers the second - and a held corner is a latch in
// everything but name, which is why most of this header is about the one
// firmware bug that could strand it.
//
// THE MECHANISM, with its 9x9 arithmetic.
//
//   - THREE BANDS OF THREE ROWS. Band index is y//3: rows 0-2 are build in
//     @FAMA, rows 3-5 test in @FAMB, rows 6-8 source control in @FAMC. The
//     palette index into the flat nine-number table B is y//3*3.
//   - TWENTY-SEVEN MACROS, one per 1-cell-wide, 3-cell-tall strip. The macro
//     index is n = y//3*9 + x, which runs 0..26 down the bands and across the
//     columns, so a family's nine macros are its nine columns in reading order.
//     From a finger's raw coordinates that is y*3//128*9 + x*9//128: the outer
//     division is folded, because floor(floor(9t/128)/3) IS floor(3t/128).
//   - THE MIDDLE ROW OF EACH BAND IS THE PIP. d is 6 on y%3 == 1 and 2
//     otherwise, and every channel is written as channel*d//6, so each band
//     reads as a bright row of nine pips - one per macro - on a dim field of
//     its own colour. That is what makes twenty-seven targets countable on a
//     pad with no labels.
//   - BOTH LAYERS CARRY THE SAME COLOUR AT PHASE 255. One layer caps at 49.6 %
//     of the colour asked for, and this card's entire picture is those three
//     bands, so painting one layer would ship it at half brightness for no
//     saving worth having. There is no press flash and layer 1 is not reserved
//     for one: a repaint per press is what the touch budget forbids, and the
//     feedback a macro pad actually gives is the application doing the thing.
//   - THE BANK CORNER IS CELL 80, the single bottom-right cell, painted
//     200,200,200 on both layers so it is findable without counting. Holding it
//     puts the pad in bank B; releasing it returns to bank A.
//   - BANK B ROTATES THE CHANNELS of every band - r,g,b becomes g,b,r - so the
//     whole pad changes hue at once and the state is unmistakable from across a
//     desk. ONE REPAINT PER BANK CHANGE, NEVER PER PRESS: W(k) is called on the
//     corner's onset, on its release and by the watchdog, and by nothing else.
//
// THE KEYSTROKE, ONE CALL FOR BOTH BANKS, AND ITS ARITY.
//
//   gks(10, 1,1,@MOD, 1,1,m, 0,2,@KEY0+n, 1,0,m, 1,0,@MOD)
//
// One leading default delay of 10 ms, then FIVE TUPLES: modifier down, bank
// modifier down, key DOWN-THEN-UP, bank modifier up, modifier up. Sixteen
// arguments, and firmware rejects the call unless (nargs - 1) % 3 == 0:
// (16 - 1) % 3 = 0. A REJECTED gks IS SILENT, so that arithmetic is checked
// here rather than discovered at a bench.
//
// m IS self.b * 225 - THE DEAD TUPLE AGAIN, AND IT IS DELIBERATE. In bank A m
// is 0, which the Keyboard/Keypad page defines as "no event indicated": two
// wasted tuples, sixteen bytes of a 256-byte per-cycle buffer, on a call that
// happens once per press. In bank B m is 225, left shift. Branching to emit a
// ten-argument call in bank A would cost more characters than the two dead
// tuples and would put a second gks call site in the file, which is a second
// place for the arity to be wrong. STAGE measured the same trade and took the
// same side.
//
// WHY BANK B IS A SECOND MODIFIER RATHER THAN A KEYCODE SHIFT. A shift of the
// keycode has to land somewhere for all four @KEY0 values, and there is nowhere
// safe: from F13 (104) the twenty-seven macros already reach 130, and any
// further offset walks into the LANG and system usage ids above 130, which do
// nothing on most machines and something surprising on the rest. Shift plus the
// same key is the chord every editor already understands, it cannot land on a
// usage id nobody chose, and it needs no arithmetic proof. @MOD therefore
// carries 224, 226, 227 and 0 and NOT 225: left shift as the base modifier
// would make the two banks send the same chord.
//
// @KEY0 + 26 < 256 AT EVERY KNOB VALUE, because twenty-seven adjacent usage ids
// are sent. The four values and their tops, every one read off the USB HID
// Usage Tables' Keyboard/Keypad page (0x07):
//
//   4   -> 30    a..z, then digit 1          (the default: twenty-six letters)
//   30  -> 56    digits 1..0, then Enter, Escape, Backspace, Tab, Space and
//                the punctuation run to /
//   58  -> 84    F1..F12, then the navigation cluster and keypad /
//   104 -> 130   F13..F24, then the editing and media run to Locking Caps Lock
//
// A wrong usage id is a card that presses the wrong key on somebody's machine
// and NO GATE IN THIS REPOSITORY CAN CATCH IT, which is why each of those four
// runs is written out rather than trusted.
//
// THE LOOK, and why restsBlack is FALSE. Setup paints all eighty-one cells in
// three colours before anything is touched, and none of them ever goes out.
//
// THE TRAPS THIS ENTRY CONTAINS.
//
//   - THE DROPPED-RELEASE BUG, AND THE TWO MITIGATIONS IT NEEDS.
//     ZONA-CAPABILITIES.md section 6 point 5: firmware's prev_* advances BEFORE
//     the writability check (grid_ui_touch.c:126-142, verified still present at
//     current HEAD), so any latching logic can end up with a permanently stuck
//     contact - and the HANGAR simulator cannot reproduce it, so it looks fine
//     in a browser. A stuck bank is a module that is in bank B forever with no
//     way back. Both mitigations below are REQUIRED - DO NOT REMOVE EITHER.
//
//       (a) RELEASE ON ANY END EVENT FOR THE CORNER'S CONTACT ID, not on a lift
//           of the corner cell. self.k holds the contact id that armed the
//           bank, and the end branch fires on e >= 5 and e < 9 for THAT id
//           wherever the finger has slid to. A cell-based test misses the
//           commonest real gesture there is: press the corner, drift off it,
//           lift. Observed rather than reasoned about - the release was watched
//           arriving at (10,10) with the bank returning to A.
//
//       (b) A SLOW TIMER WATCHDOG. The corner's onset arms gtt(0,4000); the
//           Timer clears the bank if TWO consecutive fires arrive with no touch
//           sample in between, which is eight to twelve seconds of complete
//           silence - comfortably past the >= 5 s section 6 prescribes. self.w
//           is the flag and EVERY touch sample sets it to zero, including
//           samples from other contacts, so pressing macros keeps a genuine
//           hold alive.
//
//     THE WATCHDOG IS ARMED BY THE CORNER AND BY NOTHING ELSE, AND THAT IS
//     LOAD-BEARING - DO NOT MOVE THE gtt INTO SETUP. The Timer is a ONE-SHOT
//     (lua-host.ts:604-618): a fire consumes the deadline and only the body's
//     own gtt re-arms it. The body re-arms only while self.b is 1, so with no
//     hand on the pad nothing is armed, nothing fires and the entry is honestly
//     STATIC. A gtt in Setup would make this card report `animating` at every
//     sampled tick - lua-pad-sim.ts:150-152 returns host.animating ||
//     host.timerArmed - on a pad where nothing moves, and the declared motion
//     would then be a word rather than a fact.
//
//   - CODE 9 ON THE CORNER MUST NOT LATCH THE BANK. A fast tap arrives as one
//     DOWNUP message with no separate press or lift, so a bank armed by e > 8
//     could never be released by the gesture that armed it. The corner branch
//     arms on e == 4 ONLY and returns for everything else, so a DOWNUP on the
//     corner does nothing at all - which is right for a key whose whole meaning
//     is a hold. Observed rather than read: a tap on the corner was followed by
//     a macro press and the press still carried m = 0.
//
//   - THE gks ARITY RULE, above, for the exact call shipped.
//   - @KEY0 + 26 < 256 AT EVERY KNOB VALUE, above.
//   - EVERY DIVISION IS FLOORED. y = n//9, the band index, the palette index,
//     the dim term channel*d//6 and both coordinate divisions are `//`; a
//     fractional argument to a firmware call silently becomes 0.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. Every channel of every value of
//     @FAMA, @FAMB and @FAMC is inside 0..255, and d is at most 6 against a
//     divisor of 6, so channel*d//6 can never exceed the channel and can never
//     go negative. The bank-B rotation only reorders the three channels.
//   - NO DECAY AND NO KEEPER ANYWHERE. The stored Setup and Timer hold no glf,
//     no glpfs and no 65535 - that claim is made about the two EVENT STRINGS
//     and not about this file, because a header that names a trap number
//     contains it and a grep over the file counts itself.
//   - THE TIMER REDECLARES ITS OWN PALETTE AND ITS OWN REPAINT. W is a local of
//     the Setup chunk and the Timer is a separate chunk, so it cannot see it;
//     hanging the painter off self and calling self.W(0) would be a field call
//     the host-surface classifier refuses, and 09-01's rule is that the entry
//     is wrong, not the gate. The Timer's copy writes colours only, because the
//     phases were set in Setup and nothing on this card ever changes them.
//
// THE HONEST LIMIT, for the card copy. TWO, and both matter.
//
//   HANGAR CANNOT SHOW THE KEYSTROKE ARRIVING. gks is recorded and inert in the
//   browser: src/lib/sim/lua-host.ts binds it to recordHid and says at :429
//   that nothing in HANGAR consumes them. The bank change is visible here; the
//   twenty-seven keystrokes are not.
//
//   AND A MACRO PAD IS ONLY AS GOOD AS WHAT YOU BIND TO IT. The card names the
//   FAMILY and never the command, because it cannot know yours: the pad sends
//   twenty-seven chords and what they do is a decision in your editor.
//
// Row 26 of docs/HARDWARE-AUDITION.md is the only place either the wire or the
// stuck bank can be checked, and it is the second D-11-shaped row in this
// phase.
//
// ROUTE: kind "lua", not kind "state", for two independent reasons.
// THE SEND: there is NO KEYBOARD IN `sends`. The vocabulary is
// none | xy | zones | faders | trackpad | dial (_pad.ts:185), and the only HID
// kind among them is `sends.trackpad` (_pad.ts:334), which is a mouse - a
// relative pointer and a button bitmask, with no usage id anywhere in it.
// THE STATE: there is no modal state in PadState AT ALL. Nothing in the sheet
// reads a held cell as a mode, and `sends.showGrid` paints its zones in ONE
// `gridColour` (_pad.ts:331-332), so neither the three colour families nor the
// bank-B hue rotation is expressible either.
//
// THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
// defaults by renderLua they are byte-identical to the canonical text measured
// against the pinned minifier: Setup 716 characters, Timer 373, both fixed
// points of compressScript and both accepted by checkSyntax. The all-longest
// corner of the five-knob cross-product is 722 / 377, leaving 186 free of 908,
// and the all-shortest corner is 712 / 373 - the four characters are the two
// sites of @MOD at its shortest value, 0.
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
  "--[[@cb]]local B={@FAMA,@FAMB,@FAMC}local function W(k)for n=0,80 do local y=n//9 local i=y//3*3 local d=y%3==1 and 6 or 2 local a=glag(0,n)local p=B[i+1]*d//6 local q=B[i+2]*d//6 local v=B[i+3]*d//6 if k>0 then p,q,v=q,v,p end glc(a,1,p,q,v,1)glc(a,2,p,q,v,1)glp(a,1,255)glp(a,2,255)end local a=glag(0,80)glc(a,1,200,200,200,1)glc(a,2,200,200,200,1)end W(0)self.b=0 self.w=0 self.k=-1 self.touch_cb=function(s,i,e,x,y)s.w=0 if e>=5 and e<9 then if i==s.k then s.k=-1 s.b=0 W(0)end return end local c=x*9//128 local r=y*9//128 if c==8 and r==8 then if e==4 then s.k=i s.b=1 W(1)gtt(0,4000)end return end if e~=4 and e<9 then return end local m=s.b*225 gks(10,1,1,@MOD,1,1,m,0,2,@KEY0+r//3*9+c,1,0,m,1,0,@MOD)end";

const TIMER =
  "--[[@cb]]local s=self if s.b>0 then if s.w>0 then s.b=0 s.k=-1 local B={@FAMA,@FAMB,@FAMC}for n=0,80 do local y=n//9 local i=y//3*3 local d=y%3==1 and 6 or 2 local a=glag(0,n)local p=B[i+1]*d//6 local q=B[i+2]*d//6 local v=B[i+3]*d//6 glc(a,1,p,q,v,1)glc(a,2,p,q,v,1)end local a=glag(0,80)glc(a,1,200,200,200,1)glc(a,2,200,200,200,1)else s.w=1 gtt(0,4000)end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const FORGE: CatalogEntry = {
  id: "forge",
  name: "FORGE",
  description:
    "Editor and terminal macros in colour families, with a second bank under a held corner.",
  // D-10: one FOR term then two FEELS, drawn from the closed sixteen in
  // src/lib/browse/facets.ts. Feel-based, never a compiler kind (CONT-03).
  // "macros" and "hotkeys" retire. What this pad is FOR is shortcuts, and
  // twenty-seven targets that sit perfectly still until a finger arrives is
  // the rest of it.
  tags: ["shortcuts", "readable", "still"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Five knobs, each one literal token substitution over the vendored
  // compiler's own widget vocabulary (TUNE-01). Every default is the INDEX of
  // the value that reproduces the canonical text. NO CHANNEL KNOB: this card
  // sends no MIDI at all. @BANK, the default delay and the watchdog period are
  // LITERALS, not knobs - five knobs is already a comfortable size and every
  // extra knob is sweep cost.
  //
  // TOKEN PREFIX CHECK, done before a line was written: @KEY0, @MOD, @FAMA,
  // @FAMB and @FAMC. renderLua substitutes by plain String.replaceAll, so a
  // token that is a prefix of another is eaten or corrupted depending on knob
  // order. @FAMA, @FAMB and @FAMC share three letters and no one of them
  // continues into another.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY0",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST
      // of twenty-seven contiguous ones - see the header for all four runs and
      // their tops. 4 is the default because a..z plus digit 1 is twenty-seven
      // ordinary characters, and a chord built on an ordinary character is the
      // one thing every editor on every platform can bind.
      values: ["4", "30", "58", "104"],
      default: 0,
    },
    {
      id: "modifier",
      label: "Modifier",
      kind: "mode",
      token: "@MOD",
      // A modifier usage id from the same page, or 0 for none: 224 left
      // control, 226 left alt, 227 left GUI. 225, LEFT SHIFT, IS DELIBERATELY
      // ABSENT - bank B adds left shift, so a base modifier of left shift would
      // make the two banks send the same chord. See the header.
      values: ["224", "226", "227", "0"],
      default: 0,
    },
    {
      id: "bandA",
      label: "Build colour",
      kind: "colour",
      token: "@FAMA",
      // Rows 0-2. Cyan first: build is the family you look at while waiting,
      // and a cool colour is the one that does not read as an alarm.
      values: ["0,200,255", "0,255,120", "255,180,0", "60,120,255"],
      default: 0,
    },
    {
      id: "bandB",
      label: "Test colour",
      kind: "colour",
      token: "@FAMB",
      // Rows 3-5. Green first, because a test family wearing green is the one
      // association every developer already has.
      values: ["0,255,120", "255,180,0", "180,0,255", "255,90,30"],
      default: 0,
    },
    {
      id: "bandC",
      label: "Source colour",
      kind: "colour",
      token: "@FAMC",
      // Rows 6-8. Warm first: the source-control family is the one that changes
      // other people's day, and it should not look like the other two.
      values: ["255,60,0", "180,0,255", "255,0,120", "255,255,255"],
      default: 0,
    },
  ],

  // The same five indices, keyed by knob identifier - the shape Phase 5's tune
  // panel reads. catalog.spec.ts asserts the two agree.
  defaults: {
    key: 0,
    modifier: 0,
    bandA: 0,
    bandB: 0,
    bandC: 0,
  },

  // FALSE. Setup paints every one of the eighty-one cells in one of three
  // colours and nothing ever turns them off. frames.spec.ts test 5 turns that
  // declaration into a checked fact.
  restsBlack: false,
};
