// TRACKPAD - the vendored trackpad recipe, every gesture kept, and the edges
// flash in the direction the finger moves. The flash is a tune option.
//
// THE BENCH LINE, VERBATIM, AND ITS TRANSLATION.
//
//   "Trackpad: still no animation. edgek villanjanak fel lekerekitve amelyik
//    iranyba a mozgas tortenik"
//   - the edges should flash, rounded, in the direction the movement goes.
//
// WHY IT COULD NEVER HAVE BEEN A TUNE. Plans 11-05 and 11-06 measured the
// vendored `tpad` preset at 902 of 908 at its defaults and 907 at its worst
// knob state - ONE character free - and `normalisePadState` strips every look
// from a trackpad state (`_pad.ts:1393`, `s.touch.kind = "none"`), so no knob
// on the compiler route could ever have produced a lit cell. 11-16 named it
// non-delivery 3.
//
// THE ANSWER THIS ENTRY ACTS ON, VERBATIM. Plan 12-06 asked whether the flash
// should be built BESIDE the preset or REPLACE it. The user answered:
//
//   "as is, selectable tuning options under Trackpad"
//
// Neither. One TRACKPAD card, the trackpad's gestures kept, the look chosen in
// its own tune panel with an off state that is the plain trackpad. That is a
// HANGAR-authored trackpad, because the compiler route cannot carry a look, and
// it is this file.
//
// ---------------------------------------------------------------------------
// WHAT IS KEPT, LINE FOR LINE, AND WHAT THE FLASH ADDS
// ---------------------------------------------------------------------------
//
// The Setup below is the vendored trackpad recipe (`_pad.ts:2241-2311`,
// `trackpadSetup`, "transcribed from hardware-tested Lua") with its seven
// knobs at the preset's own defaults, plus ELEVEN characters. Nothing the
// preset does is dropped:
//
//   - single-finger relative motion through `gmms(1,..)` / `gmms(2,..)`, each
//     delta clamped to +-63;
//   - two-finger scroll: a second contact turns the accumulated vertical
//     travel into notches on `gmms(3,-d)`, one per 128 units, biased by half
//     a unit so both directions fire on the same travel;
//   - tap to click: a contact that lifts with less than 120 units of travel
//     per finger presses button 1 through `gmbs(1,1)`, and the Timer releases
//     it four Timer calls later with `gmbs(3,0)`;
//   - right-click on two: the same lift with two fingers seen presses button
//     2 (`glim(s.k,1,2)`);
//   - the 24-deep drain loop over `touch_pop`, so a backlog inside one
//     dispatch is consumed rather than dropped;
//   - the four-sample pointer hold-off after any contact change (`s.j`), so
//     a second finger landing does not jump the pointer;
//   - the idle reset: a touch arriving after more than 25 Timer calls of
//     silence starts a fresh gesture (`s.q`), which is what recovers a lost
//     lift (probe Q6.5);
//   - the Timer's safety release of every button at 100 quiet calls;
//   - `gmbs(3,0)` at load, and `gtt(0,20)` on the last lift, both as the
//     recipe has them.
//
// The eleven characters are `s.u,s.v=f,h` at the end of the single-finger
// send branch: the net delta of this dispatch, stored for the Timer. That is
// the whole of the flash's footprint in the Setup, and the reason is the
// measurement below.
//
// The only textual change to the recipe is `self.z=function(s)` becoming
// `local function z(s)` with `s:z()` becoming `z(s)`: three characters cheaper
// and, more to the point, a method call on `self` that the host's
// `SELF_PRELUDE` does not install is refused by host-surface.spec.ts, while a
// local declared in the same event is admitted. The reset runs the same seven
// assignments at the same three sites.
//
// THE FLASH LIVES IN THE TIMER, AND THAT IS A MEASUREMENT RATHER THAN A STYLE.
// The recipe costs 893 under HANGAR's nine-character marker. Every Setup-side
// shape was measured at the RGB444 picker corner through the pinned minifier
// (12-10, 2026-09-11):
//
//   the whole flash in the Setup, everything kept          1113   over by 205
//   minus the 24-deep drain                                1033   over by 125
//   minus the drain and the pointer hold-off                993   over by  85
//   minus the drain, the flash not centred on the finger    992   over by  84
//   minus the drain, the hold-off, the centring and the
//     on/off knob - everything cut that is not a gesture    942   over by  34
//
// So no Setup-side flash fits beside the four gestures, and the hand-off's
// condition ("if it does not fit 908, return to the user") would have fired.
// The Timer is the other budget: the recipe's Timer is 141 of 908, and the
// flash needs only the net delta and the finger's position, both of which the
// handler already holds. Stored as `s.u,s.v` (11 characters) and painted from
// the Timer, the two events read:
//
//   Setup   903 of 908 at EVERY knob state - no knob token is in it -  5 free
//   Timer   510 of 908 at the picker corner (`false`, `255,255,255`, any
//           reach, any fade)  508 at the defaults                     398 free
//
// THE TIMER WAS 490 / 488 FROM 12-12 UNTIL PLAN 12.1-04, which moved the two
// flash centres through the measured map (+20, the section below; the Setup
// byte-identical at 903). AND THE TWO TIMER FIGURES WERE 488 AND 486 FROM THIS
// FILE'S FIRST COMMIT UNTIL THE 12-12 GATE, two short on both. The gate
// re-measured the Timer at all eighteen (flash, reach, fade) states with the
// colour at 255,255,255: every `true` state read 489 and every `false` state
// 490, so reach and fade move nothing and the corner is any `false` state;
// 12.1-04 re-measured the same way (509 / 510). 12-10's SUMMARY and the
// audition table's 486 carried the short figures; the audition row is
// corrected, the SUMMARY is a record and is pointed at rather than edited.
//
// Both are fixed points of `compressScript` and both pass `checkSyntax`. The
// price is a lag of at most one Timer period - 20 ms, two firmware ticks -
// between the finger and the edge, which no eye resolves.
//
// ---------------------------------------------------------------------------
// THE FLASH ITSELF
// ---------------------------------------------------------------------------
//
//   - THE DIRECTION is the dominant axis of the net delta, sign included:
//     `h*h>f*f` picks vertical, `u>0` picks the far edge (column 8 or row 8).
//     A wobble is not a direction: `f*f+h*h>2` is the dead band, so a finger
//     resting on the pad - which probe Q1 shows wobbling by one unit on every
//     sample - flashes nothing, and a one-unit crawl flashes nothing either.
//   - THE POSITION is the contact's own last coordinate, read from `s.p`
//     through `pairs` - the one contact there is while `s.n<2` - and the edge
//     is centred on the OTHER coordinate: a rightward move lights the right
//     column around the finger's row. THE CENTRE GOES THROUGH THE MEASURED
//     MAP (plan 12.1-04; 12.1-CONTEXT D-17): the row is
//     `(U(c[2]//8,KY)+32)//64` and the column `(U(c[1]//8,KX)+32)//64` - the
//     library's `N` written out per axis, because `N` returns a cell and the
//     Timer wants one axis of it. Until 12.1-04 both read the naive
//     `c*9//1024`, the one divisor the phase exists to remove, and the bench
//     saw it a cell early near the edges: the sensor's range runs out a third
//     of an LED inside the outer LEDs (calibration.ts section 1), so a finger
//     dead on row 1 (raw y = 12, hi-res 96) read `96*9//1024 = 0` - the top
//     row. `c//8` IS THE HI-RES TO SENSOR STEP: `txma(1023)` makes the
//     firmware's lerp the identity at eight times the 0..127 scale (research
//     section 1.1), so the ten-bit coordinate divided by eight is the raw
//     sensor value the knot tables were measured in, and `U` clamps it inside
//     the outer knots. +10 characters per axis, +20 in the Timer, 398 free;
//     the Setup does not move, because the flash was already painted from the
//     Timer and the position was already stored hi-res.
//   - "ROUNDED": the cells fall off from the centre by a quadratic,
//     `@T*(16-k*k)//16*6`. Every value is a multiple of six BY CONSTRUCTION -
//     the `*6` is the last operation - so every one lands on phase 0 through
//     the library's `D`. The twelve values the knobs can reach:
//
//       fade 42 ticks:  252 234 186 108      (k = 0, 1, 2, 3)
//       fade 31 ticks:  186 174 138  78
//       fade 21 ticks:  126 114  90  54
//
//     All twelve are multiples of six between 54 and 252, so all twelve are
//     inside `D`'s 42-tick ceiling. `src/lib/sim/lua-smoke.spec.ts` computes
//     the same twelve from the same formula and asserts it, and then reads
//     the layer in a real VM down to 0.
//   - `glim(o+k,0,8)` clamps the neighbours at the pad's edge, so a flash near
//     a corner is clipped rather than wrapped onto the opposite row.
//   - THE COLOUR is written once, by the Timer's first call, over all 81 cells
//     of layer 1 (`if not s.i then`). It is in the Timer because 46 characters
//     do not fit in the Setup's five free, and a one-shot in the Timer costs
//     22. The first Timer call is 20 ms after Setup; no finger can arrive
//     before it.
//   - TWO-FINGER SCROLL DOES NOT FLASH. `s.u` is only written in the
//     single-finger branch, and the Timer's `s.n<2` guard keeps a second
//     finger landing between two Timer calls from being painted twice. The
//     bench line describes a finger moving a pointer; if the user wants the
//     scroll to flash too, that is a Timer-side addition with 398 characters
//     of room.
//   - THE HOLD-OFF SUPPRESSES THE FLASH along with the pointer: for four
//     samples after a contact change nothing is sent and `s.u` is not written.
//
// THE DECAY GATE CANNOT SEE THIS ENTRY'S FLASH, AND THAT IS RECORDED RATHER
// THAN HIDDEN. `decay-idiom.spec.ts` reads literal `glpfs`/`glt` pairs in the
// entry's own text; every write here goes through `D(`, whose arithmetic is
// in `library.ts` and asserted in `library.spec.ts` for every multiple of six
// from 6 to 252. A `w` here that was NOT a multiple of six would pass that
// gate green - 12-07 recorded the same for GLIDE's sketch - which is why the
// smoke test's phase walk is the gate for this card. The `*6`-last formula is
// what makes the proof structural rather than a table.
//
// ---------------------------------------------------------------------------
// WHY THE ID IS `trackpad` AND NOT `tpad`
// ---------------------------------------------------------------------------
//
// The tree does not let a preset id become a Lua entry. `tpad` is the key of
// four vendored-shelf fixtures and gates that keep describing the VENDORED
// preset - `golden-frames.json`, `preset-baseline.json`, `lua-parity.spec.ts`
// and `front-door.spec.ts`'s derived-motion cross-check - so a catalog entry
// under that key would be held against another configuration's frames;
// `catalog.spec.ts` forbids a non-preset entry taking a shelf id (D-09); and
// `ladder.spec.ts`, `/dev/tune/` and `e2e/tuning.e2e.ts` reach `byId("tpad")`
// expecting the over-budget PRESET, the only card on the shelf whose knob
// band straddles 908. So the card is `trackpad`, the preset leaves the
// catalog, and it stays on HANGAR's shelf (`../presets.ts`) as the compiler's
// over-budget fixture, reachable through `portedEntry("tpad")` and never
// listed. `/c/tpad/` is therefore a dead address, recorded for 12-12.
//
// BOTH AXES ARE UNLOCKED (`txma` and `tyma`), as the recipe has them and as
// D-11-13-a requires of the preview: `lua-host.ts` keeps one `_coordMax` for
// both axes.
//
// THE KNOBS, AND THE SHAPE CHARACTER AT BIRTH. Four knobs, all of them the
// flash's: the trackpad's own seven tunables (scroll units, tap tolerance,
// pointer cap, ...) are carried at the preset's defaults as literals, because
// each one's widest value is a Setup character the Setup does not have. Every
// knob token is in the TIMER, so the Setup's cost is the same at every knob
// state and the sweep's worst corner is a Timer figure. The knob set is free
// at birth and fixed afterwards: `shapeOf` is `(knobs * 7 + options) mod 32`
// over the stamp alphabet, here (4 * 7 + 12) mod 32 = 8, so the shape
// character is `8` and the format is `w` (a colour knob is declared) -
// measured by encoding a wild vector, `w81fa022`, which decodes `restored`.
// Every stamp minted under `8` restores for as long as no knob is resized.
//
// TOKEN PREFIX CHECK: @FX, @C, @N, @T - none is a prefix of another.
//
// THE TOUCH-GUARD ROWS. `touch-guard.spec.ts` reads `e==3 or e>=5` as a
// "contact ended" test that does not escape the fast tap, `e>4` in the click
// test the same way, and `e==4 or e>7` as an onset that does not admit it
// (the gate wants `>8` by the letter). All three are the recipe's, all three
// are correct BECAUSE OF THE ORDER AROUND THEM - a code 9 is registered by the
// onset test first and ended by the same pass, which is exactly what makes a
// hardware fast tap click - and all three are declared in that file's
// DECLARED_EXCEPTIONS with this reason, keyed on the whole branch.
//
// NOTHING HERE IS HARDWARE-VERIFIED. The gestures are the recipe's and the
// recipe is hardware-tested; the flash, its lag, its dead band and its
// two-finger silence are proved in wasmoon and go to the bench as a row in
// docs/HARDWARE-AUDITION.md.
//
// THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
// compressScript does not strip them.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

const SETUP =
  "--[[@cb]]self:txma(1023)self:tyma(1023)gmbs(3,0)self.r=0 local function z(s)s.p={}s.n=0 s.k=0 s.m=0 s.w=0 s.j=0 s.q=0 end z(self)self.touch_cb=function(s,i,e,x,y)if s.q>25 then z(s)end s.q=0 local o,g,f,h=true,0,0,0 while o and g<24 do g=g+1 local c,t=s.p[i],e==3 or e>=5 if e==4 or e>7 or not c and not t then if not c then s.n=s.n+1 s.k=glim(s.k,s.n,9)end c={x,y}s.p[i]=c s.j=4 end if t then if c then s.p[i]=nil s.n=s.n-1 s.j=4 if s.n<1 then if s.r<1 and e>4 and s.m<s.k*120 then gmbs(glim(s.k,1,2),1)s.r=4 end gtt(0,20)z(s)end end else local u,v=x-c[1],y-c[2]c[1]=x c[2]=y s.m=s.m+math.abs(u)+math.abs(v)if s.n>1 then s.w=s.w+v else f=f+u h=h+v end end o=s:touch_pop()i=s:tid()e=s:tev()x=s:txv()y=s:tyv()end if s.j>0 then s.j=s.j-1 elseif s.n>1 then local d=(s.w+64)//128 if d~=0 then s.w=s.w-d*128 s.m=999 gmms(3,-d)end else gmms(1,glim(f,-63,63))gmms(2,glim(h,-63,63))s.u,s.v=f,h end end gtt(0,20)";

const TIMER =
  "--[[@cb]]gtt(0,20)local s=self if s.n then if s.r>0 then s.r=s.r-1 if s.r<1 then gmbs(3,0)end end s.q=s.q+1 if s.q==100 then gmbs(3,0)end if not s.i then s.i=1 for n=0,80 do glc(glag(0,n),1,@C,1)end end if @FX and s.u and s.n<2 then local f,h=s.u,s.v s.u=nil if f*f+h*h>2 then for _,c in pairs(s.p)do local u,p,q,o=f,1,9,(U(c[2]//8,KY)+32)//64 if h*h>f*f then u,p,q,o=h,9,1,(U(c[1]//8,KX)+32)//64 end for k=-(@N//2),@N//2 do D((u>0 and 8 or 0)*p+glim(o+k,0,8)*q,1,@T*(16-k*k)//16*6)end end end end end";

const SOURCE: CatalogSource = { kind: "lua", setup: SETUP, timer: TIMER };

export const TRACKPAD: CatalogEntry = {
  id: "trackpad",
  name: "TRACKPAD",
  description:
    "One finger moves the pointer, two fingers scroll, a tap clicks, and the edge you move toward lights up.",
  // The preset's three, unchanged, and the histogram moves by zero. `still`
  // is the motion-at-rest term - facets.ts names TPAD and MORPH among its
  // carriers, and MORPH lights under a finger exactly as this card does - so
  // it is true of a card that paints nothing until it is touched. `precise`
  // is what ten-bit relative motion is; `pointing` is what the card is for.
  tags: ["pointing", "precise", "still"],
  featured: false,
  addedAt: "2026-09-11",
  source: SOURCE,
  preview: previewFor(SOURCE),

  // Four knobs, every one in the Timer. Defaults reproduce the canonical text.
  knobs: [
    {
      id: "flash",
      label: "Edge flash",
      kind: "mode",
      token: "@FX",
      // `false` is the plain trackpad: the Timer never paints, and the card
      // is the vendored preset's gestures with nothing else. The literal is
      // Lua's own boolean, so the panel shows the word.
      values: ["true", "false"],
      default: 0,
    },
    {
      id: "colour",
      label: "Flash colour",
      kind: "colour",
      token: "@C",
      // Written once over layer 1 by the Timer's first call. The picker can
      // reach any RGB444 literal; the sweep gates 255,255,255.
      values: ["214,255,78", "255,255,255", "0,200,255", "255,170,0"],
      default: 0,
    },
    {
      id: "reach",
      label: "Flash width",
      kind: "size",
      token: "@N",
      // The number of cells lit along the edge, centred on the finger. The
      // loop runs `-(@N//2)..@N//2`, so the literal IS the cell count.
      values: ["3", "5", "7"],
      default: 1,
    },
    {
      id: "fade",
      label: "Fade length",
      kind: "speed",
      token: "@T",
      // Ticks of ten milliseconds for the centre cell to reach black: 42 is
      // `D`'s ceiling (w = 252), 21 is half of it. The neighbours are shorter
      // by the quadratic, and every value is a multiple of six by
      // construction.
      values: ["42", "31", "21"],
      default: 0,
    },
  ],

  defaults: {
    flash: 0,
    colour: 0,
    reach: 1,
    fade: 0,
  },

  // TRUE. Nothing is lit until a finger moves, and the flash decays to exact
  // black. frames.spec.ts test 5 checks the declaration against the fixture,
  // and src/lib/sim/demo.ts gives the card a demonstration drag so its picture
  // shows the edge rather than a black square (D-09).
  restsBlack: true,
};
