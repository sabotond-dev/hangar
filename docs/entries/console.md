# CONSOLE - the history behind src/lib/catalog/entries/console.ts

CONSOLE is the nine-strip mixer with a tappable mute cap on each column: slide to set a level,
tap the cap to mute, tap again to put the level back. Its source is
`src/lib/catalog/entries/console.ts`. 11-07 corrected the divisor so the eight steps reach 127,
added the mute-row dedup and read the bench's mute sentence as inert; 12-05 reversed that on the
user's own correction (a muted strip moves and stays silent, 852 at the picker corner); 12-09
handed the cell to the library's `Q` (781); 12.1-04 added the white finger (807). The entry's own
header now carries the mechanism, the wire and the traps; everything the header said before
13.2-02 - why it is not Mackie Control or the `faders` preset, the three mute shapes, the `self.q`
costing and the budget ladder - is below, verbatim.

## Moved from src/lib/catalog/entries/console.ts on 2026-09-13 (13.2-02)

```text
CONSOLE - nine strips, and a mute you can tap.

Nine faders side by side, one per column. Slide anywhere in a column to set
that strip's level; tap the cell at the top of the column to mute it, and tap
it again to put the level back exactly where it was. Nothing else in HANGAR
is a mixer.

THIS IS NOT A MACKIE CONTROL SURFACE, and the reason is worth saying in
plain words rather than leaving as an absence. Mackie Control is a
BIDIRECTIONAL protocol - the desk sends fader positions, track names, meter
data and button lamp states back to the surface - and nothing in this phase
receives inbound MIDI at all (D-04). A controller that only talks is half a
Mackie controller, and half a Mackie controller is worse than none, because
it looks like it should follow the desk and then does not. CONSOLE therefore
sends PLAIN CONTROLLER MESSAGES a mixer can learn in a minute, and it claims
nothing more on the card. Whether HANGAR should ever ship a real MCU surface
is item 1 of .planning/phases/09-twenty-configurations/deferred-items.md; it
depends on docs/MIDI-IN-PROBE.md exactly as the clock-locked family does.

THIS IS NOT THE SHELF'S `faders` PRESET EITHER, and overlap is a rejection
reason in this repository - Phase 8 dropped a nine-step sequencer for
occupying EUCLID's slot. Three differences earn CONSOLE its place:

  1. NINE strips rather than four, so a strip is exactly one column and the
     mapping from finger to controller needs no explanation at all.
  2. A MUTE ROW. Mute is a LATCHING state, and the compiler cannot express
     one: there is no mute anywhere in the `sends` sheet, in either branch.
  3. THE RAIL IS A CAP, NOT A COLUMN. `faders` draws a white rail BESIDE each
     strip, which costs a column per rail. CONSOLE draws it as the top cell
     of each column instead, so nine strips fit in nine columns with nothing
     wasted - and that same cap is the mute button, so the mute row costs no
     extra cells either.

THE MECHANISM, with its 9x9 arithmetic.

  - The column is c = x*9//128, so there are nine strips and no spare column.
  - The level is h = 8 - y*9//128, and because +y RUNS DOWN on this module
    (ZONA-CAPABILITIES.md 2.2) the top of the pad is the top of the fader.
    THE FADER BODY IS ROWS 1 TO 8, NEVER ROW 0 - row 0 is the mute cap - so
    r runs 1..8 and h runs 0..7. EIGHT values, not nine. h is stored in
    self.v[c] and drawn over the eight body cells: row r is lit when
    8-r < h, so h cells light and h = 0 lights nothing.
  - THE CONTROLLER VALUE IS self.v[c]*127//7, AND THE DIVISOR IS 7 BECAUSE
    THE MUTE ROW OWNS THE TOP OF THE TRAVEL. It used to be *127//8, whose
    maximum over the reachable h is 7*127//8 = 111: sweeping a column through
    the real Lua host emitted exactly 0, 15, 31, 47, 63, 79, 95, 111 and
    could not reach 127 at any point of any column. That is the bench report
    "clamp issue in the top row because its not precise" - the fader was not
    imprecise, it was short of full scale by an eighth. Dividing by 7 makes
    the eight steps span 0..127 exactly, at +0 characters, because both
    literals are one digit. src/lib/sim/lua-smoke.spec.ts sweeps every column
    and asserts 127 is present and the distinct count is 8.
    THE PICTURE STILL TOPS OUT AT SEVEN OF EIGHT BODY CELLS, and that is a
    separate fact rather than a leftover of the same defect: h cells light
    for h in 0..7, so the row you touch to reach full scale is itself dark.
    Lighting 0..8 cells would need nine levels over eight touchable rows, so
    it is a layout change and not a constant, and it is a bench question
    rather than an arithmetic one. Recorded in 11-07-SUMMARY.md.
  - self.m[c] is the mute latch. Row 0 toggles it, sends the column's
    controller at 0, and repaints the column. Untoggling re-sends the
    REMEMBERED level, which is still in self.v[c] - muting never touches it.
    A MUTED COLUMN MOVES AND STAYS SILENT, AND THAT IS THE SECOND READING
    OF ONE BENCH SENTENCE - REVERSED ON THE RECORD, TWICE (plans 11-07 then
    12-05). Three shapes have shipped here and each one is a different
    answer to the same question, so all three are written down:

      BEFORE 11-07 - the fader body CLEARED the mute (s.m[c]=nil), on the
      argument that moving a fader is an unambiguous request for that level.
      11-07 - the bench said "you should not be able to interact with the
      'muted' faders", so the body was folded into `and not s.m[c]` and a
      muted column emitted nothing AND STORED NOTHING. That fold cost -6
      characters, because it dropped the s.m[c]=nil it replaced.
      12-05 - THE USER'S OWN CORRECTION, verbatim: "you should be able to
      change the muted ones only don't send the midi from those." 11-07 read
      "do not interact" as INERT; the sentence above says the column is
      interactive and SILENT. So the store and the repaint are unconditional
      and only the gms is gated: `if h~=s.v[c]then s.v[c]=h if not s.m[c]
      then s:gms(...)end P(s,c)end`. +8 characters, 844 -> 852 at the picker
      corner, 56 free.

    WHAT THE UNMUTE THEN SENDS IS THE LEVEL THE FINGER MOVED IT TO, and that
    falls out of the mute-row branch being untouched: it still sends
    `m and 0 or s.v[c]*127//7`, and s.v[c] is now whatever the muted drag
    stored. So a muted strip can be set up in silence and dropped in at the
    right level, which is what a mixer's mute is for. THE MUTE CAP IS STILL
    THE ONLY WAY BACK and it is still reachable by construction: it is row 0
    of the same column, the cell directly above the fader the finger is
    already on, and it is painted in @MUTEC on both layers while the mute is
    held, so it is the one cell in that column that says what to press.
    src/lib/sim/lua-smoke.spec.ts test 8 carries the reversal: it used to
    assert a muted column INERT and now asserts it moves, repaints, sends
    zero controller messages while muted, and sends exactly one carrying the
    moved level on unmute.
  - THE CELL COMES FROM THE TOUCH LIBRARY, AND self.q IS GONE (plan 12-09).
    THE BENCH NOTE THIS ANSWERS, and it is the one that named the framework:
    "CONSOLE: needs to setup a framework how your finger interacts with the
    LEDs because everything needs touch detection." The framework is
    src/lib/catalog/library.ts, written into the system element's Setup, and
    this entry's whole finger-to-cell path is now one call, followed since
    plan 12.1-04 by the library's painter (the paragraph on the finger,
    further down):

        local n=Q(s,i,e,x,y)G(s,i,e,x,y,0,255,255,255)if not n then return end
        local c=n%9 local r=n//9

    THREE THINGS LEFT WITH THAT LINE, and none of them was deleted - each one
    moved into `Q` and is spelled there once for every caller:

      1. THE LIVE TEST. `if e~=1 and e~=4 and e<9 then return end` was the
         outer gate. `Q`'s end test is its negation, and it also EXPIRES the
         contact rather than merely returning.
      2. THE MUTE ROW'S DEDUP. self.q[i] was the last mute cell each CONTACT
         toggled and the branch read `if e==4 or e>8 or s.q[i]~=c`. That IS
         `Q`'s change signal - it returns the cell only when the cell
         changed, and an onset always returns one - so the branch is now
         unconditional inside `if r==0 then`. MEASURED before the guard
         existed at all (plan 11-07): a contact wobbling inside one mute cell
         delivered 210 samples and got 210 CHANGES, and a swipe across the
         row toggled each column fourteen or fifteen times rather than once.
         With the guard, and now with `Q`: 1 and 1.
      3. THE FADER PATH'S CLEAR (`s.q[i]=nil`), which existed for the gesture
         the dedup would otherwise eat - slide off the cap into the strip and
         back onto the same cap. `Q` needs no clear: the cell changed twice,
         so it returned twice.

    AND `Q` ADDS TWO THINGS THIS CARD NEVER HAD. Per-axis HYSTERESIS, so a
    fader finger on the line between two columns drives ONE fader instead of
    flickering between two (PROBE-RESULTS-2026-09-10.md Q2: a motionless
    finger sent 71, 72, 71, 71, 71, and 71*9//128 = 4 while 72*9//128 = 5).
    And the onset expiry, so a press by a contact whose lift was lost is read
    against a clean slate rather than against a stale cell.

    COSTED BOTH WAYS AT THE RGB444 PICKER CORNER, and the smaller shipped:
    781 with self.q gone, 847 with self.q and its two sites kept beside the
    call. Both pass the mute-row swipe and the resting-finger probes in
    src/lib/sim/lua-smoke.spec.ts, so the 66 characters buy nothing.
    (12-RESEARCH costed the kept shape at 845 against a FOUR-argument `Q`;
    the shipped `Q` takes `s`, which is the two characters, per 12-VALIDATION
    R-5.)

    THERE IS NO TIMER, SO THERE IS NO `X`. The library's sweep is a Timer-side
    function and this card declares `timer: ""`. A contact whose lift is lost
    therefore keeps its entry in the library's `H` until the next press by
    that id, which `Q` expires first - and nothing here holds a note, so a
    stale cell costs a mute toggle that never happened rather than a hung
    voice. That is why CHORUS takes `X` in the same plan and CONSOLE does not.
  - A repaint is ONE PASS over the column, every cell written exactly once,
    never erase-then-paint: firmware has no double buffer and a two-pass
    repaint can tear. The repaint is also GATED - a sample that lands on the
    same level in the same column paints nothing - which keeps touch_cb short
    under a fast slide. DO NOT REMOVE THE GATE.
  - `timer: ""`. The picture is repainted on change and nothing advances on
    its own, so the declared motion is `static` and the fixture agrees.

THE @CC ARITHMETIC, AND WHY THE KNOB VALUES ARE WHAT THEY ARE. Nine adjacent
controllers are sent, @CC through @CC + 8, so EVERY value of the knob must
satisfy @CC + 8 < 128. The four shipped values are 16, 48, 80 and 102, whose
top controllers are 24, 56, 88 and 110. All four are inside 128 with room,
and the arithmetic is checked at the largest value, not at the default.

THE LOOK, and why restsBlack is FALSE. Setup gives every strip a level of 4
and paints all nine columns, so the card arrives showing nine rails and nine
half-open faders - forty-five lit cells - and the OG image is a mixer rather
than a black square. The level and the mute cap are painted on BOTH layers,
because one layer can never exceed 254/512 of the colour asked for.

THE FINGER IS THE LIBRARY'S GRADIENT, IN WHITE, ON LAYER 0 (plan 12.1-04;
12.1-CONTEXT D-11, D-13). `G(s,i,e,x,y,0,255,255,255)` follows the `Q` call
and draws the bilinear finger over the 2x2 block of LEDs around the
calibrated position, peak 255 dead on an LED, on layer 0 - the one layer
`P` never writes (the rails, the levels and the mute caps are all on 1 and
2), so the strips are untouched by it and it is untouched by a repaint. THE
COLOUR IS A LITERAL, NOT A KNOB: a knob would move this card's shape
character and demote every captured stamp (D-13), and white reads against
every level, rail and mute colour the three knobs declare. `G` RE-ASSERTS
THE COLOUR ON EVERY CALL, and that is the alert-layer heal: layer 0 is the
layer `grid_alert_all_set` recolours (grid_led.h:7; a CONFIG write, a page
discard, a refused page change, a TX overflow, boot), so a finger coloured
once in an init loop would turn grey or purple after a page switch until
the Setup re-ran. There is no floor - `glc(...,1)` forces the layer's
minimum to 0 - so a cell `V` clears is dark. `Q` COMES BEFORE `G`, and the
order is a measurement (12.1-02): `Q` calls `E` on every onset and `E`
clears the contact's block through `V`, so a `G` drawn before `Q` is wiped
on the press that drew it. `G` sits before the `if not n then return end`,
so it sees every sample - a finger sliding INSIDE one cell, where `Q` says
nil, still moves the gradient, and a lift clears it. And the cell `Q`
returns is now the LED under the finger, so the strip you move is the strip
the finger is lighting, and the mute cap you tap is the cap under it.
CONSOLE needed nothing but the call: no `R` (it holds no note and paints
nothing on layer 0 of its own), no Timer, no init-loop colouring.

THE TRAPS THIS ENTRY CONTAINS.

  - EVERY DIVISION IS FLOORED. x*9//128, y*9//128 and *127//7 are all `//`.
    A fraction reaching a firmware call becomes 0, silently.
  - @CC + 8 < 128 AT EVERY KNOB VALUE. See the arithmetic above.
  - CODE 9 IS HANDLED, AND IT IS THE WHOLE MUTE. A fast tap arrives as a
    single DOWNUP 9 with no separate press or lift. The onset test is now the
    library's - `Q` spells it `e==4 or e>8` and returns the cell on it
    unconditionally - so a fast tap on the cap still toggles the mute. A
    branch written against e == 5 would miss every fast tap on the mute row
    and the mute would appear to work only sometimes; that is the failure
    src/lib/catalog/touch-guard.spec.ts exists to prevent, and it now gates
    the library string instead of this entry's own chain.
  - COLOUR CHANNELS TRUNCATE, NEVER CLAMP. 260 renders as 4. Every channel of
    every value of @LEVELC, @RAILC and @MUTEC is inside 0..255 by
    construction.
  - NO KEEPER AND NO DECAY. Nothing here writes glt, glf or glpfs at all, so
    there is no countdown to freeze and no rate to wrap, and pitfall 1 cannot
    arise. Count the maximum timeout in the SETUP STRING rather than in this
    file, for the reason STRIP's header gives about its own trap number: a
    trap nobody wrote down is a trap somebody re-introduces.
  - THE LATCH WARNING, and it is the same one HOLD carries. Firmware advances
    prev_* before the writability check, so a dropped release leaves a
    permanently stuck contact, and pad-sim.ts states plainly that it cannot
    manufacture one. A LATCHING CONFIGURATION CAN LOOK PERFECT IN A BROWSER
    AND STICK ON HARDWARE: a mute that latches on and will not clear is
    exactly how that bug would present here. Row 13 of
    docs/HARDWARE-AUDITION.md is HOLD's bench row for it and row 19 is this
    entry's. A green lua-smoke.spec.ts is not evidence that latching is safe
    on a module.

THE HONEST LIMIT, for the card copy. Two things.

  1. EIGHT steps per strip is the resolution the pad has - eight, because the
     ninth cell of the column is the mute cap and never a level. This is a
     control surface, not a motorised console, and a fader you can put in
     eight places is what eight cells buy. The eight now span 0..127 exactly.
  2. It cannot show what the mixer is doing. Nothing in this phase receives
     (D-04), so the pad shows the level YOU set, never the level the desk is
     at, and a fader moved in the DAW leaves this pad with nothing to say.

ROUTE: kind "lua", not kind "state". Two independent reasons, and either
alone would decide it. `sends.faders` is typed `3 | 4` in the `PadState`
sends sheet (_pad.ts:290), so a nine-strip mixer is outside the vocabulary by
a literal type; and there is NO MUTE ANYWHERE IN THAT SHEET, in either the
zones branch or the faders branch - `sends.toggle` is read only when
`sends.kind` is "zones" and it toggles a note, not a fader. Nine strips with
a latching mute row is outside the vocabulary twice over.

THE TWO STRINGS BELOW ARE TEMPLATES OVER CANONICAL LUA. Rendered at the
defaults by renderLua they are byte-identical to the canonical text measured
against the pinned minifier: Setup 784 characters, Timer 0, both fixed points
of compressScript and both accepted by checkSyntax.

TWO CORNERS, AND THE BINDING ONE IS NOT THE PALETTE'S. The all-longest corner
a VISITOR CAN ACTUALLY REACH is 807 / 0, leaving 101 free of 908, because
D-06 lets the colour picker write any of the 4,096 RGB444 literals and
255,255,255 is two characters longer than the longest colour this card
declares. THREE colour tokens, occurring 3 + 2 + 2 times, is 19 of the 23
characters between the two corners.
src/lib/catalog/lua-entries.sweep.spec.ts gates the PICKER corner - that is
the number 908 is checked against - so it is the one this header quotes and
the one every margin in 11-07-SUMMARY.md is stated at.

THIS CARD WAS THE TIGHTEST IN THE CATALOG AND IT IS NOT ANY MORE. Plan 12-05
left it at 852 with 56 free, and 12-VALIDATION's budget table asked whether a
`Q` call could be fitted beside that at all - "if `Q` does not fit beside +8,
a finding". It fits with room to spare, because the call REPLACES more text
than it adds: 852 -> 781 at the picker corner, 829 -> 758 at the defaults, a
net -71 in both columns. See the self.q section above for what the 71 is.

AND THEN THE FINGER, AT +26 (plan 12.1-04): 781 -> 807 AT THE PICKER CORNER,
101 FREE, 758 -> 784 at the defaults - the `G` call and nothing else, under
the 890 BUDGET_ERROR line (_pad.ts:3076-3078) by 83. Cheaper than the
pre-coloured shape D-11 replaced, because no 81-cell layer-0 colouring was
added to the init loop - `G` carries the colour. Every figure re-measured
under the pinned compressScript in this tree, canonical and checkSyntax
true, rather than inherited.

THE LUA CARRIES NO COMMENTS beyond the nine-character event marker, because
compressScript does not strip them: a trailing comment was measured surviving
verbatim into the budget. Everything worth saying about this configuration is
said here, in TypeScript, where it costs nothing.
```

## Change 17B, 2026-09-23: the Faders output, MIDI RX, the latch (`BENCH-2026-09-16.txt` sections 17 and 18)

CONSOLE moves onto the per-output MIDI model (`docs/MIDI.md` section 4) with ONE output, `faders`, named "Faders",
continuous: the nine strips are one bank, the way a DAW maps a mixer, rather than nine blocks of four rows each.

- **Knobs.** `@CC` (`cc`, "First controller") is the Number: all of 0..127 with its four old rungs (16, 48, 80, 102)
  first, so a saved copy's index keeps its controller; fader c sends on `(@CC+c)%128`, so a first controller past 119
  wraps the bank to 0 rather than send a data byte over 127. `@CH` (`channel`) is the Channel, all sixteen in order
  (it was four: 0, 1, 9, 15 - a saved copy at index 2 or 3 reopens on channel 3 or 4 as the rows read them, because
  Same channel for all needs the sixteen in order; its kind moved `mode` -> `amount`, so no rung is worded Off).
  `@TYPE` (`midiType`, CC / Pitch bend / Channel pressure) and `@RX` (`midiReceive`, On) are appended last. The rack
  grew and `@CC` is a wide knob now, so CONSOLE's captured wild stamp lands `unreadable` (the known pattern); its null
  default record still carries no stamp.
- **The send** (`M(c,v)`): a controller on `(@CH, (@CC+c)%128, v)`; under a pitch bend or a channel pressure fader c
  goes on its OWN channel `(@CH+c)%16` - the Mackie layout: nine faders on one channel as one pitch bend would be one
  message - pitch bend `0, v` (64 the centre), pressure `v, 0`. `@CH+t//177*c` is that rule in eleven characters
  (`t//177` is 0 for a controller, 1 for the other two). At the defaults the wire is CONSOLE's before the change,
  message for message (controller 16 + c on channel 0, the eight levels, the mute's 0 and its unmute).
- **The receive** (Timer, pulled in): the host's message on the output's type - a controller on `@CH` numbered
  `@CC..@CC+8`, or a pitch bend / channel pressure on channels `@CH..@CH+8` - sets that fader to the nearest of its
  eight steps (`(w*7+63)//127`; every value the fader sends comes back to its own step) and repaints it; a muted fader
  keeps its mute and shows the level dimly, as a finger's move while muted does. Nothing is sent back. Receive Off
  answers no header; a neighbour's traffic (INSTR 14), another channel, another type and a number past the ninth fader
  are ignored.
- **Where it lives - the pull-in.** The Setup was 807 of 908 at the corner; the latch and the typed send take it to
  890, and the receive (240) fits nowhere in it. A one-shot Timer armed by the Setup would make the callback, but an
  armed Timer is what the preview reads as motion: frames.json's tick-0 flag moved and the listing's derivation turned
  CONSOLE from `static` to `animated` (both seen, then refused). So the callback lives in the TIMER text and the Setup
  closes with `s:tim()`: the module runs a touch element's Timer body as a method (the Sandbox's first probe,
  `sandbox/emit.ts` PULL_IN_TIMER), synchronously, arming nothing. The host models it since `33fc889`. The Timer never
  runs as a Timer. The Setup keeps `self` as an upvalue (`local s,t=self,@TYPE`) so one `@TYPE` literal serves the send
  and the receive, `P` loops its two layers (`@MUTEC` once instead of three times), and `L(c,h,q)` - the level, sent
  when `q` - serves the finger and the receive; `self.l` hands it to the Timer's callback.
- **The latch (section 18).** A finger that landed on a fader body drove whatever column it slid into (`Q` returns the
  new cell). Now the onset records what the contact landed on (`s.o[i]`: its column, or `false` on a cap): a fader
  contact drives THAT column for the whole gesture, its level from the row it is on (`glim(8-r,0,7)` - the cap row
  reads as the top); a cap contact toggles each cap it crosses along the mute row (11-07's swipe, the user's ask,
  kept) and nothing in the bodies. **Latch: fault fixed** (the bodies); the cap row's swipe is by design.
- **Cost** (RGB444 picker corner, pinned `compressScript`): Setup 784 / 807 -> 880 / 890 (defaults / corner; 18
  free), Timer 0 -> 237 / 240. frames.json and the OG image unmoved: the picture at rest is the same forty-five cells,
  and no Timer is armed.
- **Proved.** `lua-smoke.spec.ts` "CONSOLE: the Faders output ...": no Timer armed after the Setup; the defaults'
  wire for fader 3 exactly as before; a finger landed on fader 5 slid across onto fader 7 and down to the cap row moves
  fader 5 alone (7 and 4 lit); the host's controller 18 at 54 sets fader 2 to 3 and 16 at 127 fader 0 to 7, nothing
  echoed, four mismatches ignored; a pitch bend and a channel pressure from channel 5 (wire 4) on fader 3's channel
  8, a controller bank from 120 wrapping its ninth fader to 0, each received back; Receive Off. The existing CONSOLE
  cases (the whole travel, the muted fader, the swipe across the mute row, the resting finger) unchanged but for the
  restated muted-body call, which now reads `(j>1 and 90 or 0)`.
