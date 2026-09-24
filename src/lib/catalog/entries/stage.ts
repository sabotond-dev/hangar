// STAGE - nine scenes for a stream, over plain keystrokes.
//
// Nine 3x3 zones, one per scene, drawn as four-corner boxes. Press one and it cuts: the zone goes
// live (@LIVEC, breathing) and a keystroke goes out - OBS scene switching is a global hotkey and a
// ZONA can press one, so it works on a machine with nothing installed. Slide onto another zone
// and it is LINED UP (an @LIVEC pulse through the idle base); the one under a held finger breathes
// fastest. Knobs: @KEY0 (nine adjacent usage ids), @MOD, @LIVEC, @ZONEC - no fifth knob, because
// a knob would move the stamp's shape character. No MIDI: the Setup assigns `self.midirx_cb=nil`
// (change 17B: a previous landing's receive callback never survives this one). Setup 672 of 908 at
// the picker corner (659 at the defaults), Timer 136; restsBlack false, `animated`. Kind "lua":
// PadState has no keyboard.
// History: docs/entries/stage.md (11-02, 11-09 gesture costings, the four-corner table, 11-16;
// change 17B).
//
// MECHANISM
//   - Zone z: zone-row z//3, zone-column z%3, top-left cell z//3*27 + z%3*3, its four corners
//     that cell plus 0, 2, 18, 20 - written as j = 0..3, offset j%2*2 + j//2*18. Only the
//     corners are painted: thirty-six lit cells at rest, legible in a thumbnail.
//   - A finger's zone is x*3//128 + y*3//128*3; +y runs down, so zone 0 is top-left.
//   - `Z(z,f,g)` is the whole painter with two independent axes: `f` is a layer-1 RATE (0 paints
//     black and stands still; f > 0 paints @LIVEC, glpfs(a,1,0,f,3), glt(a,1,30000)); `g` is
//     the layer-2 BASE (0 @ZONEC, 1 @LIVEC) at phase 255. The states: idle Z(z,0,0); lined up
//     Z(z,10,0); live Z(z,4,1); held Z(z,24,1). Layers sum before the divide by 512, so the
//     lined-up box is the idle box with a live-coloured pulse through it, its floor the idle floor.
//   - self.l is the live zone, self.p the lined-up zone; "nothing lined up" is `s.p == s.l`
//     (no sentinel), so cutting to the lined-up scene clears the line-up for free. Both 0 at Setup.
//   - The handler's if-chain: `e==4 or e>8` (an onset, code 9 included) repaints at most two
//     zones - the old live one to idle, the pressed one to Z(z,e>8 and 4 or 24,1) - and sends
//     the keystroke; `elseif e==1` (a MOVE onto a zone that is neither live nor lined up) idles
//     the previous line-up and lines this one up at rate 10; `elseif e>=5` settles the live zone
//     to Z(s.l,4,1). A DOWNUP has no lift behind it, so it settles to rate 4 at once.
//   - The Timer (2560 ms, a whole number of 10 ms phase cycles): R(z) refreshes the four layer-1
//     TIMEOUTS of the live and the lined-up zone to 30000 and does nothing else; when nothing is
//     lined up the second call repeats the first, harmlessly.
//
// WHAT IT SENDS
//   gks(10, 1,1,@MOD, 0,2,@KEY0+z, 1,0,@MOD) - one default delay of 10 ms, then three tuples:
//   modifier down, key DOWN-THEN-UP (state 2, so one call), modifier up. Ten arguments; firmware
//   accepts a gks only when (nargs - 1) % 3 == 0, and a rejected gks is SILENT. Thirty-two bytes
//   of the 256-byte per-cycle buffer. At @MOD = 0 the two modifier tuples send usage id 0, "no
//   event indicated" - harmless, and 35 characters cheaper than branching. Lining up never sends.
//   HANGAR cannot show a keystroke arriving: lua-host.ts records gks and nothing consumes it
//   (docs/HARDWARE-AUDITION.md row 23 is where the wire is checked).
//
// TRAPS
//   - THE gks ARITY RULE: (10 - 1) % 3 = 0, checked for the exact call shipped.
//   - @KEY0 + 8 < 256 AT EVERY KNOB VALUE: 104..112 (F13..F21), 30..38 (1..9), 58..66 (F1..F9),
//     89..97 (keypad 1..9), each contiguous on the USB HID Keyboard/Keypad page (0x07) and read
//     off that table - a wrong usage id presses the wrong key on somebody's machine and no gate
//     in this repository can catch it. @MOD is a usage id (224, 225, 226) or zero.
//   - THE DEFAULT DELAY IS 0..255 ONLY: the literal 10, not a knob.
//   - CODE 9 IS HANDLED, AND IT IS THE WHOLE CARD: the fire test is `e==4 or e>8`; a branch on
//     e == 5 would miss every fast scene change. STAGE IS A DECLARED EXCEPTION TO THE CLASS-B
//     GATE, NOT A HOLE: `elseif e>=5` has no upper bound, the shape touch-guard.spec.ts test 1
//     forbids, but code 9 satisfies the first branch and never reaches it; the row is in
//     DECLARED_EXCEPTIONS keyed on the whole clause. The `elseif e==1` between them is a LIVE
//     test the gate leaves alone.
//   - DO NOT MAP TAP-VERSUS-HOLD TO CUT-VERSUS-LINE-UP: whether a quick tap arrives as 4-then-5
//     or as a 9 is sub-cycle timing the operator cannot control; gating gks on `e==4` reddens
//     lua-smoke.spec.ts's fast-tap test.
//   - THE KEEPER IS 30000 ON LAYERS WHOSE RATES ARE 4, 10 AND 24, AND THAT IS LEGITIMATE - DO NOT
//     FIX IT. Pitfall 1 is a keeper on a layer carrying a DECAY; these three are continuous
//     breathes an order of magnitude below the guard's rate floor. lua-smoke.spec.ts asserts
//     their SEPARATION and never the rates.
//   - THE TIMER REFRESHES glt AND DOES NOT RE-ISSUE glpfs: a re-issue writes phase 0 and snaps
//     the breathe to black mid-breath at a moment set by when the finger armed it. Refreshing
//     the timeout alone is what the 655 s firmware ceiling needs. The lined-up zone needs the
//     refresh too (30000 is 300 s), which is why R(z) is called for both.
//   - COLOUR CHANNELS TRUNCATE, NEVER CLAMP; every channel of @LIVEC and @ZONEC is 0..255.
//   - NO DECAY ANYWHERE in the two strings (no glf, no 65535) - a claim about the strings.
//   - THE LUA CARRIES NO COMMENTS beyond the nine-character marker: compressScript keeps them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { onLattice } from "../lattice";

const SETUP =
  "--[[@cb]]local function Z(z,f,g)local r=z//3*27+z%3*3 for j=0,3 do local a=glag(0,r+j%2*2+j//2*18)if f>0 then glc(a,1,@LIVEC,1)glpfs(a,1,0,f,3)glt(a,1,30000)else glc(a,1,0,0,0,1)glp(a,1,0)glt(a,1,0)end if g>0 then glc(a,2,@LIVEC,1)else glc(a,2,@ZONEC,1)end glp(a,2,255)end end for z=0,8 do Z(z,0,0)end Z(0,4,1)self.l=0 self.p=0 self.touch_cb=function(s,i,e,x,y)local z=x*3//128+y*3//128*3 if e==4 or e>8 then if z~=s.l then Z(s.l,0,0)s.l=z end Z(z,e>8 and 4 or 24,1)gks(10,1,1,@MOD,0,2,@KEY0+z,1,0,@MOD)elseif e==1 then if z~=s.l and z~=s.p then if s.p~=s.l then Z(s.p,0,0)end s.p=z Z(z,10,0)end elseif e>=5 then Z(s.l,4,1)end end self.midirx_cb=nil gtt(0,2560)";

const TIMER =
  "--[[@cb]]gtt(0,2560)local function R(z)local r=z//3*27+z%3*3 for j=0,3 do glt(glag(0,r+j%2*2+j//2*18),1,30000)end end R(self.l)R(self.p)";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const STAGE: CatalogEntry = {
  id: "stage",
  name: "Stage",
  description:
    "Nine scenes for your stream: the live one glows and the one you are lining up breathes.",
  // D-10: one FOR term then two FEELS from the closed thirteen in src/lib/browse/facets.ts.
  tags: ["shortcuts", "playable", "readable"],
  featured: false,
  addedAt: "2026-09-07",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, each one literal token substitution (TUNE-01); every default is the INDEX of
  // the value that reproduces the canonical text. TOKEN PREFIX CHECK: no one of @KEY0, @MOD,
  // @LIVEC, @ZONEC shares even a first letter with another.
  knobs: [
    {
      id: "key",
      label: "First key",
      kind: "note",
      token: "@KEY0",
      // USB HID usage ids from the Keyboard/Keypad page (0x07), each the FIRST of nine
      // contiguous ones: F13, digit 1, F1, keypad 1. F13 is the default because F13..F24 exist
      // on no keyboard, so OBS can own them.
      values: ["104", "30", "58", "89"],
      default: 0,
    },
    {
      id: "modifier",
      label: "Modifier",
      kind: "mode",
      token: "@MOD",
      // A modifier usage id from the same page, or 0 for none: 224 left control, 226 left alt,
      // 225 left shift. Its own down tuple before the key and up tuple after it.
      values: ["0", "224", "226", "225"],
      default: 0,
    },
    {
      id: "live",
      label: "Live colour",
      kind: "colour",
      token: "@LIVEC",
      // The live scene, on both layers. Red first: a red tally light is what "on air" means.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["255,40,0", "255,0,120", "0,255,120", "255,180,0"]),
      default: 0,
    },
    {
      id: "zone",
      label: "Idle colour",
      kind: "colour",
      token: "@ZONEC",
      // The scenes that are not live, on layer 2 only. Its four are deliberately dim: a map, not data.
      // Change 19: these first - the picker's quick picks - then the rest of the RGB444 lattice.
      ...onLattice(["40,40,50", "50,40,30", "30,50,40", "50,30,50"]),
      default: 0,
    },
  ],

  // The same four indices keyed by knob id, the shape the tune panel reads; catalog.spec.ts
  // asserts the two agree.
  defaults: {
    key: 0,
    modifier: 0,
    live: 0,
    zone: 0,
  },

  // FALSE: thirty-six corner cells, one box live and breathing from the first tick.
  // frames.spec.ts test 5 checks it.
  restsBlack: false,
};
