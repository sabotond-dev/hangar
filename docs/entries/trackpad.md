# TRACKPAD - the history behind src/lib/catalog/entries/trackpad.ts

TRACKPAD is the vendored trackpad recipe with every gesture kept and the edges flashing in the
direction the finger moves, the flash a tune option with an off state that is the plain trackpad.
Its source is `src/lib/catalog/entries/trackpad.ts`. 12-06 asked whether the flash should sit
beside the preset or replace it and the user answered "as is, selectable tuning options under
Trackpad"; 12-10 authored the card and measured every Setup-side shape out (1113 down to 942,
all over 908) before putting the flash in the Timer; 12-12 corrected the Timer figures; 12.1-04
moved the flash centres through the measured map (490 to 510). The entry's own header now
carries the mechanism, the wire and the traps; everything the header said before 13.2-02 - the
bench line, the measurement table, the figure corrections and the id reasoning - is below,
verbatim.

## Moved from src/lib/catalog/entries/trackpad.ts on 2026-09-13 (13.2-02)

```text
TRACKPAD - the vendored trackpad recipe, every gesture kept, and the edges
flash in the direction the finger moves. The flash is a tune option.

THE BENCH LINE, VERBATIM, AND ITS TRANSLATION.

  "Trackpad: still no animation. edgek villanjanak fel lekerekitve amelyik
   iranyba a mozgas tortenik"
  - the edges should flash, rounded, in the direction the movement goes.

WHY IT COULD NEVER HAVE BEEN A TUNE. Plans 11-05 and 11-06 measured the
vendored `tpad` preset at 902 of 908 at its defaults and 907 at its worst
knob state - ONE character free - and `normalisePadState` strips every look
from a trackpad state (`_pad.ts:1393`, `s.touch.kind = "none"`), so no knob
on the compiler route could ever have produced a lit cell. 11-16 named it
non-delivery 3.

THE ANSWER THIS ENTRY ACTS ON, VERBATIM. Plan 12-06 asked whether the flash
should be built BESIDE the preset or REPLACE it. The user answered:

  "as is, selectable tuning options under Trackpad"

Neither. One TRACKPAD card, the trackpad's gestures kept, the look chosen in
its own tune panel with an off state that is the plain trackpad. That is a
HANGAR-authored trackpad, because the compiler route cannot carry a look, and
it is this file.

---------------------------------------------------------------------------
WHAT IS KEPT, LINE FOR LINE, AND WHAT THE FLASH ADDS
---------------------------------------------------------------------------

The Setup below is the vendored trackpad recipe (`_pad.ts:2241-2311`,
`trackpadSetup`, "transcribed from hardware-tested Lua") with its seven
knobs at the preset's own defaults, plus ELEVEN characters. Nothing the
preset does is dropped:

  - single-finger relative motion through `gmms(1,..)` / `gmms(2,..)`, each
    delta clamped to +-63;
  - two-finger scroll: a second contact turns the accumulated vertical
    travel into notches on `gmms(3,-d)`, one per 128 units, biased by half
    a unit so both directions fire on the same travel;
  - tap to click: a contact that lifts with less than 120 units of travel
    per finger presses button 1 through `gmbs(1,1)`, and the Timer releases
    it four Timer calls later with `gmbs(3,0)`;
  - right-click on two: the same lift with two fingers seen presses button
    2 (`glim(s.k,1,2)`);
  - the 24-deep drain loop over `touch_pop`, so a backlog inside one
    dispatch is consumed rather than dropped;
  - the four-sample pointer hold-off after any contact change (`s.j`), so
    a second finger landing does not jump the pointer;
  - the idle reset: a touch arriving after more than 25 Timer calls of
    silence starts a fresh gesture (`s.q`), which is what recovers a lost
    lift (probe Q6.5);
  - the Timer's safety release of every button at 100 quiet calls;
  - `gmbs(3,0)` at load, and `gtt(0,20)` on the last lift, both as the
    recipe has them.

The eleven characters are `s.u,s.v=f,h` at the end of the single-finger
send branch: the net delta of this dispatch, stored for the Timer. That is
the whole of the flash's footprint in the Setup, and the reason is the
measurement below.

The only textual change to the recipe is `self.z=function(s)` becoming
`local function z(s)` with `s:z()` becoming `z(s)`: three characters cheaper
and, more to the point, a method call on `self` that the host's
`SELF_PRELUDE` does not install is refused by host-surface.spec.ts, while a
local declared in the same event is admitted. The reset runs the same seven
assignments at the same three sites.

THE FLASH LIVES IN THE TIMER, AND THAT IS A MEASUREMENT RATHER THAN A STYLE.
The recipe costs 893 under HANGAR's nine-character marker. Every Setup-side
shape was measured at the RGB444 picker corner through the pinned minifier
(12-10, 2026-09-11):

  the whole flash in the Setup, everything kept          1113   over by 205
  minus the 24-deep drain                                1033   over by 125
  minus the drain and the pointer hold-off                993   over by  85
  minus the drain, the flash not centred on the finger    992   over by  84
  minus the drain, the hold-off, the centring and the
    on/off knob - everything cut that is not a gesture    942   over by  34

So no Setup-side flash fits beside the four gestures, and the hand-off's
condition ("if it does not fit 908, return to the user") would have fired.
The Timer is the other budget: the recipe's Timer is 141 of 908, and the
flash needs only the net delta and the finger's position, both of which the
handler already holds. Stored as `s.u,s.v` (11 characters) and painted from
the Timer, the two events read:

  Setup   903 of 908 at EVERY knob state - no knob token is in it -  5 free
  Timer   510 of 908 at the picker corner (`false`, `255,255,255`, any
          reach, any fade)  508 at the defaults                     398 free

THE TIMER WAS 490 / 488 FROM 12-12 UNTIL PLAN 12.1-04, which moved the two
flash centres through the measured map (+20, the section below; the Setup
byte-identical at 903). AND THE TWO TIMER FIGURES WERE 488 AND 486 FROM THIS
FILE'S FIRST COMMIT UNTIL THE 12-12 GATE, two short on both. The gate
re-measured the Timer at all eighteen (flash, reach, fade) states with the
colour at 255,255,255: every `true` state read 489 and every `false` state
490, so reach and fade move nothing and the corner is any `false` state;
12.1-04 re-measured the same way (509 / 510). 12-10's SUMMARY and the
audition table's 486 carried the short figures; the audition row is
corrected, the SUMMARY is a record and is pointed at rather than edited.

Both are fixed points of `compressScript` and both pass `checkSyntax`. The
price is a lag of at most one Timer period - 20 ms, two firmware ticks -
between the finger and the edge, which no eye resolves.

---------------------------------------------------------------------------
THE FLASH ITSELF
---------------------------------------------------------------------------

  - THE DIRECTION is the dominant axis of the net delta, sign included:
    `h*h>f*f` picks vertical, `u>0` picks the far edge (column 8 or row 8).
    A wobble is not a direction: `f*f+h*h>2` is the dead band, so a finger
    resting on the pad - which probe Q1 shows wobbling by one unit on every
    sample - flashes nothing, and a one-unit crawl flashes nothing either.
  - THE POSITION is the contact's own last coordinate, read from `s.p`
    through `pairs` - the one contact there is while `s.n<2` - and the edge
    is centred on the OTHER coordinate: a rightward move lights the right
    column around the finger's row. THE CENTRE GOES THROUGH THE MEASURED
    MAP (plan 12.1-04; 12.1-CONTEXT D-17): the row is
    `(U(c[2]//8,KY)+32)//64` and the column `(U(c[1]//8,KX)+32)//64` - the
    library's `N` written out per axis, because `N` returns a cell and the
    Timer wants one axis of it. Until 12.1-04 both read the naive
    `c*9//1024`, the one divisor the phase exists to remove, and the bench
    saw it a cell early near the edges: the sensor's range runs out a third
    of an LED inside the outer LEDs (calibration.ts section 1), so a finger
    dead on row 1 (raw y = 12, hi-res 96) read `96*9//1024 = 0` - the top
    row. `c//8` IS THE HI-RES TO SENSOR STEP: `txma(1023)` makes the
    firmware's lerp the identity at eight times the 0..127 scale (research
    section 1.1), so the ten-bit coordinate divided by eight is the raw
    sensor value the knot tables were measured in, and `U` clamps it inside
    the outer knots. +10 characters per axis, +20 in the Timer, 398 free;
    the Setup does not move, because the flash was already painted from the
    Timer and the position was already stored hi-res.
  - "ROUNDED": the cells fall off from the centre by a quadratic,
    `@T*(16-k*k)//16*6`. Every value is a multiple of six BY CONSTRUCTION -
    the `*6` is the last operation - so every one lands on phase 0 through
    the library's `D`. The twelve values the knobs can reach:

      fade 42 ticks:  252 234 186 108      (k = 0, 1, 2, 3)
      fade 31 ticks:  186 174 138  78
      fade 21 ticks:  126 114  90  54

    All twelve are multiples of six between 54 and 252, so all twelve are
    inside `D`'s 42-tick ceiling. `src/lib/sim/lua-smoke.spec.ts` computes
    the same twelve from the same formula and asserts it, and then reads
    the layer in a real VM down to 0.
  - `glim(o+k,0,8)` clamps the neighbours at the pad's edge, so a flash near
    a corner is clipped rather than wrapped onto the opposite row.
  - THE COLOUR is written once, by the Timer's first call, over all 81 cells
    of layer 1 (`if not s.i then`). It is in the Timer because 46 characters
    do not fit in the Setup's five free, and a one-shot in the Timer costs
    22. The first Timer call is 20 ms after Setup; no finger can arrive
    before it.
  - TWO-FINGER SCROLL DOES NOT FLASH. `s.u` is only written in the
    single-finger branch, and the Timer's `s.n<2` guard keeps a second
    finger landing between two Timer calls from being painted twice. The
    bench line describes a finger moving a pointer; if the user wants the
    scroll to flash too, that is a Timer-side addition with 398 characters
    of room.
  - THE HOLD-OFF SUPPRESSES THE FLASH along with the pointer: for four
    samples after a contact change nothing is sent and `s.u` is not written.

THE DECAY GATE CANNOT SEE THIS ENTRY'S FLASH, AND THAT IS RECORDED RATHER
THAN HIDDEN. `decay-idiom.spec.ts` reads literal `glpfs`/`glt` pairs in the
entry's own text; every write here goes through `D(`, whose arithmetic is
in `library.ts` and asserted in `library.spec.ts` for every multiple of six
from 6 to 252. A `w` here that was NOT a multiple of six would pass that
gate green - 12-07 recorded the same for GLIDE's sketch - which is why the
smoke test's phase walk is the gate for this card. The `*6`-last formula is
what makes the proof structural rather than a table.

---------------------------------------------------------------------------
WHY THE ID IS `trackpad` AND NOT `tpad`
---------------------------------------------------------------------------

The tree does not let a preset id become a Lua entry. `tpad` is the key of
four vendored-shelf fixtures and gates that keep describing the VENDORED
preset - `golden-frames.json`, `preset-baseline.json`, `lua-parity.spec.ts`
and `front-door.spec.ts`'s derived-motion cross-check - so a catalog entry
under that key would be held against another configuration's frames;
`catalog.spec.ts` forbids a non-preset entry taking a shelf id (D-09); and
`ladder.spec.ts`, `/dev/tune/` and `e2e/tuning.e2e.ts` reach `byId("tpad")`
expecting the over-budget PRESET, the only card on the shelf whose knob
band straddles 908. So the card is `trackpad`, the preset leaves the
catalog, and it stays on HANGAR's shelf (`../presets.ts`) as the compiler's
over-budget fixture, reachable through `portedEntry("tpad")` and never
listed. `/c/tpad/` is therefore a dead address, recorded for 12-12.

BOTH AXES ARE UNLOCKED (`txma` and `tyma`), as the recipe has them and as
D-11-13-a requires of the preview: `lua-host.ts` keeps one `_coordMax` for
both axes.

THE KNOBS, AND THE SHAPE CHARACTER AT BIRTH. Four knobs, all of them the
flash's: the trackpad's own seven tunables (scroll units, tap tolerance,
pointer cap, ...) are carried at the preset's defaults as literals, because
each one's widest value is a Setup character the Setup does not have. Every
knob token is in the TIMER, so the Setup's cost is the same at every knob
state and the sweep's worst corner is a Timer figure. The knob set is free
at birth and fixed afterwards: `shapeOf` is `(knobs * 7 + options) mod 32`
over the stamp alphabet, here (4 * 7 + 12) mod 32 = 8, so the shape
character is `8` and the format is `w` (a colour knob is declared) -
measured by encoding a wild vector, `w81fa022`, which decodes `restored`.
Every stamp minted under `8` restores for as long as no knob is resized.

TOKEN PREFIX CHECK: @FX, @C, @N, @T - none is a prefix of another.

THE TOUCH-GUARD ROWS. `touch-guard.spec.ts` reads `e==3 or e>=5` as a
"contact ended" test that does not escape the fast tap, `e>4` in the click
test the same way, and `e==4 or e>7` as an onset that does not admit it
(the gate wants `>8` by the letter). All three are the recipe's, all three
are correct BECAUSE OF THE ORDER AROUND THEM - a code 9 is registered by the
onset test first and ended by the same pass, which is exactly what makes a
hardware fast tap click - and all three are declared in that file's
DECLARED_EXCEPTIONS with this reason, keyed on the whole branch.

NOTHING HERE IS HARDWARE-VERIFIED. The gestures are the recipe's and the
recipe is hardware-tested; the flash, its lag, its dead band and its
two-finger silence are proved in wasmoon and go to the bench as a row in
docs/HARDWARE-AUDITION.md.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them.
```

## Change 17B, 2026-09-23: no MIDI, and a previous landing's receive cleared (`BENCH-2026-09-16.txt` sections 17 and 18)

TRACKPAD sends mouse reports (`gmms`, `gmbs`), not MIDI, so it declares no output and gains no knob (the rack and the
stamp are unmoved). Section 17's decision - every card assigns its own receive callback or nil - could not go in the
Setup, which has 5 free (`self.midirx_cb=nil` is 18 characters, and TRACKPAD COMET's Setup is held byte for byte
equal to this one). So the TIMER assigns `s.midirx_cb=nil` on every call, from its first, 20 ms after the Setup arms
it; a previous landing's callback guards itself on the touch callback it was made beside, so it is inert inside that
window too. Timer 508 / 510 -> 524 / 526 (defaults / corner), Setup 903 unmoved; frames.json and the OG image unmoved.
**Latch: one control** - the pad is one mouse surface; the edge flash is a picture, not a control.
`lua-smoke.spec.ts` "TRACKPAD: no MIDI ...": after three ticks no callback over a previous landing's, the pointer
still moves, no MIDI.
