# THE TOUCH LIBRARY - the history behind src/lib/catalog/library.ts

The touch library is the two Lua strings HANGAR writes into the system element - 255/0 holding the
state and the calibrated map, 255/6 holding the painters and the senders - and the thirteen
functions every hand-authored entry and every preset card calls by name. Its source is
`src/lib/catalog/library.ts`. 12-07 authored the one-slot library from the probe's six rules;
12.1-02 and 12.1-03 split it over two slots on the user's answer and added the calibrated axis and
the bilinear finger (781 + 705); 12.1-08b factored `Z` and `Y` out of `G`, added the decaying stamp
`K` for the preset cards and moved `N` to 255/0 (842 / 66 + 873 / 35). The file's own header now
carries the ten section headings as a table of contents with the facts under each; everything the
header said before 13.2-02 - the firmware citations at length, the one-slot measurements, the
page-load doubt, the probe rules' history, the hold-band worked figures and the cost ladder - is
below, verbatim.

## Moved from src/lib/catalog/library.ts on 2026-09-13 (13.2-02)

```text
THE TOUCH LIBRARY: two strings, thirteen functions, one convention. The first
is written into the system element's Setup (element 255, event 0) and holds
the state and the map; the second into the system element's Timer (element
255, event 6) and holds the painters and the senders. Every hand-authored
entry's touch Setup calls both halves by name, and since 12.1-08b so does
every preset card's compiled Setup (section 5, `K`, `G` and `N`).

---------------------------------------------------------------------------
1. WHY IT LIVES IN THE SYSTEM ELEMENT, WITH THE FIRMWARE LINES
---------------------------------------------------------------------------

`../grid-fw/common/src/lua/init.lua:46-50` runs `ele[#ele]:post_init_cb()`
FIRST and then every other element in ascending order. On a ZONA `ele` has
exactly two entries - touch at 0, system at 1 - so `ele[#ele]` IS the system
element. A global defined in the system element's Setup therefore exists
before any touch Setup runs, on every page load, by construction.

`grid_decode.c:1283-1288` is the other half, and it is the one that decides
HANGAR's write order: a CONFIG/EXECUTE registers the body and runs it
IMMEDIATELY. At install time the init order is HANGAR's write order, not the
firmware's page-load order, which is why the install store writes 255/0
before 0/0 (plan 12-03) - a touch Setup that called this library before it
was written would raise "attempt to call a nil value" once, on the desk.

`grid_ui.c:370-383` wraps every stored event body as
`ele[N].<fn> = function (self) local _efn = EFN; EFN = "<fn>"; <body>
EFN = _efn end`. Two consequences, and both are load-bearing here:

  - A `local function` in either string is INVISIBLE to the touch Setup,
    because each body is its own function scope. Every name below is a plain
    global, and so are the six state tables and scalars.
  - The system element's own `self` carries `gtt`, `gtp`, `get`, `gsen` and
    `ggen` and nothing else (`grid_ui_system.c:9-15`) - no `lwi`, no touch
    accessors. So a library function that needs the TOUCH element takes it as
    a parameter (`Q(s, ...)`, `G(s, ...)`, `A(s, ...)`), exactly as the
    entries' own helpers already do.

---------------------------------------------------------------------------
2. WHY TWO SLOTS, AND THE ORDER THEY ARE WRITTEN IN (phase 12.1, D-03)
---------------------------------------------------------------------------

The gradient does not fit beside Q6.5's expiry machinery in one slot. Every
one-slot variant was measured under the pinned minifier (12.1-RESEARCH B.3,
re-run by plans 01 and 02): everything 1,446; without `N` 1,384; without `N`
and `D` 1,315; without `N`, `D`, `A` 1,164; with a two-knot linear `U` 1,100;
with the expiry block clear removed as well 1,043 - STILL 135 OVER 908, and
that last variant leaves a lost lift's gradient lit forever, which the
probe's rules forbid. The gradient parts alone (`U`, the tables, `V`, `G`,
`E`'s clause) are 614; the hysteresis and expiry machinery (`W E Q X`) is
521 as shipped. One slot cannot hold both.

The system element's Timer, 255/6, is a 908-character slot nobody had
claimed - `SLOT-ARITHMETIC.md` section 2 records it as "nothing, never
asked". The user was asked on 2026-09-11 - "Use 255/6 (the system Timer) as
the library's second slot? It means HANGAR writes a fourth string to the
module and PUT BACK restores it" - and answered "yes"
(`BENCH-2026-09-11.txt`, recorded as 12.1-CONTEXT D-03). So:

  255/0  system Setup   marker, `H T C P B L`, `KX`, `KY`, `U W E Q X N`,
                        `self:tim()`                       842, 66 free
  255/6  system Timer   marker, `V G Z Y K A D`             873, 35 free

(The research and the plans carried 782 and 714: those are the raw lengths
of a `W` and an `N` written `return (` - one space each that the minifier
removes - and `cost = max(raw, compressed)` charged the raw. The shipped
strings are the fixed points, one character shorter on each side. 255/6
then read 713 until 12.1-03 took ` and e<9` out of `G` - section 5 - and
12.1-02 / 12.1-03 shipped 781 + 705.)

THE 12.1-08b REVISION (12.1-CONTEXT D-26 item 2, D-27): the eight preset
cards take the gradient too, and what they need is a DECAYING stamp - the
comet on AURORA, STARFIELD, RADAR and DIAL and the per-finger trail on
PINWHEEL are stateless fades, not a live block `V` clears. That is `K`,
and `K` needs the block origin and the corner weights `G` computed inline,
so both were factored into `Z` and `Y` and `G` re-written through them
(identical output at every sampled point, library.spec.ts test 6; 352 ->
221). Then 255/6 could not hold `K` beside `N`: `V G Z Y K N A D` measures
934, 26 over. `N` IS THE MAP - the nearest calibrated cell, no LED write
and no send - so it belongs on the 255/0 side of the split rule below in
any case, and it moved there: 255/0 781 -> 842 (66 free), 255/6 705 -> 873
(35 free). Moving `D` to 255/0 instead was measured at 891 / 850 and not
taken: `D` writes LEDs, and the split rule says which side it lives on.

THE RULE THAT DECIDES WHICH SIDE A THING LIVES ON: 255/0 holds STATE and THE
MAP, 255/6 holds THE PAINTERS AND THE SENDERS. A change to how the finger
looks never touches the string that holds the knots, and the string that
holds the knots never writes an LED or sends a message. `library.spec.ts`
test 4 asserts it: every `glp(`, `glc(` and `gms(` call site is in 255/6;
`KX=` and `KY=` appear in 255/0 only.

THE JOIN IS ONE CALL. 255/0 ends with `self:tim()`, which runs the 255/6
body as the system element's own Timer method, so the thirteen functions are
all defined by the time the system Setup returns. That is why 255/6 is written
FIRST: `grid_decode.c:1286-1287` registers a written body and runs it at
once, and a 255/0 written before its `tim` method existed would raise
"attempt to call a nil value (method 'tim')" on the desk. The install order
is therefore 255/6, 255/0, 0/6, 0/0 - the same rule that already puts 0/6
before 0/0 (Band 2, plan 12.1-06).

THE PAGE-LOAD HALF IS SUPPORTED BY SOURCE AND NOT YET TAPPED ON A MODULE -
MEDIUM. After a KEEP and a power cycle, `init.lua:25-50` registers every
stored body of every element as a method (`gas(i, eve[j], path)`) BEFORE
`ele[#ele]:post_init_cb()` runs; `grid_ui_system.c:26` binds the system
element's event index 2 to `GRID_LUA_FNC_A_TIMER_short`, which
`grid_protocol.h:876` spells "tim"; so `tim` is a method on the system
element when the system `ini` calls `self:tim()`. The same mechanism is
proved on the user's ZONA for the touch element's own `tim` (probe 1) and for
the system element's `map` called from the touch element (probe 2). What no
probe has tapped is THIS combination - the system `ini` calling the system
`tim` on a page load. It is 12.1-CONTEXT D-04's runbook row (KEEP, power
cycle, tap one re-fitted entry), and its failure signature is `attempt to
call a nil value (global 'G')`. The fallback with no new doubt is written
there: drop `self:tim()` from 255/0 and open every re-fitted Setup with
`ele[#ele]:tim()`, a touch script calling a system method, which probe 2
proved. Nothing in this file assumes the outcome.

---------------------------------------------------------------------------
3. WHY `G` CARRIES THE COLOUR (D-11) - LAYER 0 IS THE ALERT LAYER
---------------------------------------------------------------------------

The finger is drawn on layer 0 everywhere, and layer 0 is the firmware's
alert layer. `grid_alert_one_set` (`grid_led.c:260-271`) rewrites layer 0's
COLOUR on an LED (`grid_led_set_layer_color`), forces its min to 0, and sets
shape, timeout and phase; `grid_alert_all_set` does it to all eighty-one.
It is called:

  - on a CONFIG write (`grid_decode.c:1282`, WHITE 64) - BEFORE the written
    body runs, so a Setup that colours layer 0 wins over it;
  - on page-discard completion (`grid_decode.c:887`, WHITE_DIM 64,64,64);
  - on a refused page change (`grid_lua_api.c:1695`, PURPLE);
  - on a TX overflow (`grid_transport.c:253`, BLUE);
  - and at boot.

A finger coloured ONCE, in an init loop over eighty-one cells, turns grey,
purple or blue after any of those and stays so until the Setup re-runs -
13-12's page switch alone would do it. So `G(s,i,e,x,y,l,r,g,b)` TAKES THE
COLOUR and re-asserts it with `glc(a,l,r,g,b,1)` on each of its four cells on
every call: the finger heals on the next sample, the init colouring goes
from every entry, and the peak is fixed at 255 because every caller passed
255. The trailing `1` matters: `l_grid_led_layer_color` with six arguments
(`grid_lua_api.c:1062-1100`, the `nargs == 6` branch) forces the layer's min
to 0, so there is no byte-6 floor under a coloured layer and a cell `V`
clears is DARK, not dim. The research's floor paragraph was wrong, and it is
corrected here rather than left.

Measured: 255/6 at 714 against 683 for a `G` that relied on a pre-coloured
layer; every re-fit CHEAPER than that shape, because the init loop goes.
12.1-CONTEXT D-11 costed the alternatives - another layer (there is none;
`GRID_LED_LAYER_COUNT` is 3 and every entry paints 1 and 2) and accepting the
recolouring (free, and wrong after every page switch).

---------------------------------------------------------------------------
4. THE SIX PROBE RULES, AND WHERE EACH ONE LIVES NOW
---------------------------------------------------------------------------

`.planning/phases/12-touch-framework/PROBE-RESULTS-2026-09-10.md` is the
ground truth - measured on the user's own ZONA, and everything the simulator
says about touch is subordinate to it. Six rules came out of it:

  1. Cell hit-testing with hysteresis (Q1, Q2). HERE: `W` and `Q`, now in
     CALIBRATED space (section 6). Q2's trace is the whole reason: a finger
     resting on the line between two cells sent 71, 72, 71, 71, 71 - and
     `71*9//128 = 4` while `72*9//128 = 5`, so a ONE-UNIT wobble flipped the
     cell. The gradient (rule 5) removes the cell for the LIGHT, not for the
     TOGGLE: a bare argmax would toggle both neighbours alternately at 100 Hz
     for a finger resting on a seam - the exact Q2 failure. The hysteresis
     stays.
  2. A lift is never trusted on its own (Q6.5, Q7). HERE: `Q`'s two onset
     expiry clauses and `X`, all releasing through `E` and the entry's `R`.
     Q6.5: four of five contacts never sent their code 5 after a five-finger
     chord. An entry that sends note-on at press and note-off at release
     hangs notes exactly that way, and no simulator shows it. From 12.1 `E`
     also darkens the contact's gradient block through `V`, because a lost
     lift must take the light away as well as the note.
  3. Per-axis send-on-change, never on every sample (Q1). HERE: `A`.
  4. Single contact by default (Q6, Q6.5). NOT HERE, deliberately. This
     library tracks EVERY contact - `H`, `T`, `P` and `B` are keyed by `i` -
     because CHORUS, CONSOLE, EUCLID and WHEELS all want per-contact
     tracking. The rule is an ENTRY-level one, written `if i>0 then return
     end` in the cards that are single-pointer (MORPH and GHOST carry it
     today), and each entry that takes it says so in its own header.
  5. The finger lights where the firmware thinks it is. HERE, SINCE
     2026-09-11: `G`, the bilinear finger, with eight callers named (EUCLID,
     STEPS, RADAR POINTS, SONAR, CHORUS, MORPH, CONSOLE, LUMEN - plans
     12.1-03 and 12.1-04). Plan 12-07 wrote this rule as "NOT HERE, AND NO
     FUNCTION SHIPS FOR IT ... if a later entry wants it, it comes back WITH
     ITS CALLER NAMED, not on speculation", and dropped the sketch's `F`,
     which lit one cell. That sentence is superseded exactly as it said it
     would be: the user's specification (12.1-CONTEXT D-01) is that a finger
     between two LEDs lights both dimly and a finger in the middle of four
     lights all four, so what ships is not `F` - `G` is a different
     primitive with a different contract - and `F` stays dropped. Since
     12.1-08a GHOST is `G`'s ninth caller, and since 12.1-08b the vendored
     compiler emits `G` for JOYSTICK's glow and `K` - the DECAYING stamp,
     the same four cells at the same weights but fading through `D` - for
     the comets and PINWHEEL's per-finger trail, so the eight preset cards
     draw the finger the way the user specified as well.
  6. Nothing is built on code 9 (Q3). The onset edge `(e==4 or e>8)` stays
     and `H[i]=e<9 and n` keeps the research's harmless handling of a 9;
     nothing depends on the `e>8` half. Q3 measured ten taps as fast as a
     hand can make them and NOT ONE arrived as a 9 - every one was 4, at
     least one 1, then 5. BUT NOTHING MAY BE LEFT LIT BY ONE EITHER: `G`
     treats a 9 as an end for the drawing (section 5), because the residue
     gate in lua-smoke.spec.ts synthesises one and a block that stayed lit
     after it was the first red of 12.1-03.

---------------------------------------------------------------------------
5. THE CONTRACT, FUNCTION BY FUNCTION, WITH EACH ONE'S CALLER
---------------------------------------------------------------------------

A function with no caller is not shipped. Each of the thirteen below names
the plan that calls it, and `library.spec.ts` is where the cost of shipping
one is measured. The unit `U` returns is a 64th of an LED pitch: LED `n` sits at
`n*64`, the axis runs 0..512, and every cell and every weight in this file is
integer arithmetic in that unit - firmware Lua is 5.4 with integers and `glp`
wants an integer phase, so there is no float anywhere for it to reject.

255/0 - state and the map:

`U(v, k)` - THE CALIBRATED AXIS. Raw 0..127 through the nine-knot table `k`
  (`KX` or `KY`, rendered from `src/lib/catalog/calibration.ts`, MEASURED on
  the user's ZONA by Probe C on 2026-09-11) -> 0..512, piecewise-linear
  between knots and clamped to the table's ends with `glim`. `KX[n]` is the
  raw x the sensor reports with a finger centred on LED `n`, so `U(KX[n],
  KX) == n*64` exactly. `calibratedAxis()` in `calibration.ts` is its
  TypeScript twin with the same floor division, and `lua-smoke.spec.ts`
  drives the two against each other for every value on both axes. Called
  by `Q` (twice), `Z` (twice, for `G` and `K`), `N` (twice) and TRACKPAD's
  Timer (12.1-04, its two flash centres).

`W(u, p)` - ONE-AXIS HYSTERESIS IN CALIBRATED SPACE. If the contact held
  LED `p` on this axis, keep it while `u` is within 45/64 of a pitch of `p`'s
  centre `p*64`; else read the nearest LED, `(u+32)//64`. Section 6 says what
  the band is on the measured map. Called by `Q`, twice.

`E(s, i)` - EXPIRE CONTACT `i`. Forget its cell and its stamp; if `G` drew a
  block for it, clear that block through `V` and forget it; then call
  `R(s, i)` if the entry defined one. Called by `Q` and `X`.

`Q(s, i, e, x, y)` - THE CELL A CONTACT IS ON, when it changed, else nil.
  An end code (`e~=1 and e~=4 and e<9`) expires the contact and returns nil.
  Otherwise, ON AN ONSET (`e==4 or e>8`), IT FIRST EXPIRES CONTACT `i`
  ITSELF (section 7), then stamps `T[i]=C`, computes the cell with hysteresis
  on both axes - `W(U(x,KX), ...)` and `W(U(y,KY), ...)` - and on an onset
  ALSO expires any other contact holding the cell just landed on. The
  cross-contact scan needs no `j~=i` guard because `H[i]` is already gone.
  The cell is returned only when it changed; an onset therefore ALWAYS
  returns one. The contract is 12-07's, unchanged; the cells now come from
  the measured map, so the toggle and the gradient agree on where the LEDs
  are because both read `U`. Callers: EUCLID, STEPS, RADAR POINTS, SONAR
  (12-08), CHORUS, MORPH and CONSOLE (12-09), LUMEN (12-11) - eight, and
  every one of them again after its 12.1 re-fit. Not TRACKPAD: a trackpad
  is relative motion and never asks which cell a finger is on.

`X(s, n)` - THE TIMER-SIDE SWEEP. `C=C+1`, then expire every contact whose
  stamp is older than `n` calls. `n` IS IN TIMER CALLS AND IT IS THE
  CALLER'S, not a library constant - see section 8. Callers: EUCLID, STEPS,
  RADAR POINTS and SONAR (12-08), CHORUS (12-09) - five.

`N(x, y)` - THE NEAREST CALIBRATED CELL, no hysteresis and no state, for a
  press-time lookup: `(U(x,KX)+32)//64 + (U(y,KY)+32)//64*9`. IN 255/0
  SINCE 12.1-08b, because it is the map and not a painter (section 2).
  Callers: ARC's stop tap (12.1-03, `N(x,y)==40`); GHOST twice (12.1-08a -
  the erase key `N(x,y)==80` in its Setup and the comet / ghost cell in its
  Timer); the vendored compiler's zone and fader emission for a state that
  carries `touchLibrary` (12.1-08b - NINE PADS' `local n=N(x,y)` ahead of
  the LED-side zone rule, FOUR FADERS' `local f=N(x,y)%9*4//9`;
  `src/vendor/botor/_pad.ts` `zoneStatements` and `sendsPaint`'s fader
  branch, each a declared manifest row); and 13-15's region lookup, named
  in advance.

255/6 - the painters and the senders:

`V(n)` - CLEAR THE 2x2 BLOCK whose origin is cell `n`, on layer `L` (the
  layer `G` last drew on), by writing phase 0 to its four cells. Called by
  `G` (the contact's previous block) and `E` (every expiry path).

`G(s, i, e, x, y, l, r, g, b)` - THE BILINEAR FINGER. Touch element, contact,
  code, raw x, raw y, layer, colour. Clears the contact's previous block;
  then, unless `e` is anything but a MOVE or a DOWN (`e~=1 and e~=4` - NOT
  `Q`'s live test: a 9 is a press AND a lift in one message, so `Q` returns
  its cell for the toggle but there is no finger left to draw, and a 9
  drawn would stay lit until the sweep; 12.1-03, from the residue gate, -8
  characters), takes the block origin and the two fractions from `Z(x,y)`
  (below - until 12.1-08b the same arithmetic was inline here) and lights
  the four cells `n, n+1, n+9, n+10` at phases `255*Y(f,h,d)//4096` for
  `d = 0..3` - SETTING THE COLOUR ON EACH CELL FIRST (section 3).
  Remembers the block in `B[i]` and the layer in `L`. The weights are LINEAR
  on purpose (12.1-CONTEXT D-12): the firmware's phase-to-output curve is
  already convex, so half weight lands on about 25 % duty, which the eye
  reads as roughly 55-60 %; a square-law variant was costed and is not the
  default. THE CONTRACT DID NOT MOVE WITH THE REVISION: library.spec.ts
  test 6 holds the 12.1-03 text as a literal and drives both forms over
  the raw plane every 7 units, 361 points, zero differences. Callers, each
  named: EUCLID, STEPS, RADAR POINTS, SONAR (12.1-03), CHORUS, MORPH,
  CONSOLE, LUMEN (12.1-04), GHOST (12.1-08a) - nine hand-authored - and the
  vendored compiler's `glow` emission for a state that carries
  `touchLibrary` (12.1-08b, JOYSTICK: `G(s,i,e,x,y,1,r,g,b)` on layer 1 in
  the touch colour, the parked dot doused first; `_pad.ts` `touchPaint`
  case "glow", a declared manifest row).

`Z(x, y)` - THE BLOCK. `u = U(x,KX)`, `v = U(y,KY)`, the origin `c + q*9`
  with `c = glim(u//64,0,7)` and `q = glim(v//64,0,7)`, and the fractions
  `u - c*64` and `v - q*64` (0..63, or 64 at the far end of the last
  segment - the ninth LED is reached as the SECOND column of the eighth
  block, so no index leaves 0..8 and no cell is written twice). Three
  return values. FACTORED OUT OF `G` IN 12.1-08b because `K` needs the same
  three numbers and 255/6 could not hold two copies. Callers: `G` and `K`.

`Y(f, h, d)` - ONE CORNER'S WEIGHT, 0..4096: corner `d` (0..3) of the block
  is `d%2` columns and `d//2` rows from the origin, so its weight is
  `(64-f or f) * (64-h or h)`. The linear weights, in one place. Callers:
  `G` and `K`.

`K(x, y, l, w, r, g, b)` - THE DECAYING BILINEAR STAMP (12.1-08b). The same
  four cells as `G` at the same weights, but each is a one-shot fade through
  `D` rather than a live block: cell `d` starts at `w*Y(f,h,d)//4096`
  QUANTISED DOWN TO A MULTIPLE OF 6 (`//6*6`), so with `D`'s rate 250 every
  one of the four walks to exactly 0 and freezes dark - both Phase 11 gates,
  per cell, by construction. A cell whose quantised start is 0 is NOT
  WRITTEN (`if z>0`): a decaying trail beside a finger resting dead on a
  neighbouring LED keeps its own phase instead of being stamped to 0. The
  colour is set on a cell only when `r` is handed (`if r then glc(...)`),
  because the comet's layer-1 colour is set once for all 81 cells at Setup
  and PINWHEEL's per-finger hue is not. `w` is the start the caller would
  have handed `glpfs` - the compiler emits 252 (`(256-250)*42`, its house
  pair for `trailMs` 420) - and it is a byte, so `K` shares `D`'s 42-tick
  ceiling. Stateless: no `B[i]`, no end test, a 9 stamps like a 4 (as the
  naive comet did). Callers, five, all in the vendored compiler for a state
  that carries `touchLibrary` (declared manifest rows, 12.1-08b): the
  `comet` emission `K(x,y,1,252)` on AURORA, STARFIELD, RADAR and DIAL, and
  the `perFinger` emission `K(x,y,1,252,255-i*60,i*60,128)` on PINWHEEL.
  Emitted only when the state's `trailMs` resolves to rate 250 - every
  reachable HANGAR state, `presets.spec.ts` asserts the 420 on all nine -
  and the naive comet otherwise.

`A(s, i, e, x, y, c, d, h)` - PER-AXIS SEND-ON-CHANGE, per contact, and it is
  the user's own bench snippet. On live codes (`e<4`) it sends CC `c` = x
  when x moved and CC `d` = `127-y` when y moved, on channel `h`; a DOWN
  primes `P[i]` without sending. `127-y` IS THE SNIPPET'S OWN INVERSION -
  screen y grows downwards and a fader does not - so nobody reads it as a
  bug. It sends RAW coordinates and is not calibrated (12.1-CONTEXT D-14): a
  calibrated pair would change what a DAW receives from the one entry that
  sends a position, silently. ONE CALLER: LUMEN (12-11).

`D(n, l, w)` - A DECAY THAT LANDS ON PHASE 0. `glpfs(a,l,w,250,0)` plus
  `glt(a,l,w//6)`: rate 250 is -6 on the byte ring, so a `w` that is a
  multiple of 6 walks down to exactly 0 in `w//6` ticks and the layer freezes
  dark. This is `decay-idiom.spec.ts`'s class-A rule, parameterised.
  `w` IS A BYTE, SO `D` COVERS TIMEOUTS OF AT MOST 42 TICKS (w = 252). An
  entry whose decay knob reaches beyond that - MORPH's `@DECAY` runs 21..126 -
  keeps the inline idiom that gate already reads. Callers: TRACKPAD
  (12-10), from its Timer, with every `w` a multiple of six by construction;
  and `K` (12.1-08b), four times per stamp, with every start quantised to a
  multiple of six before the call.

`R` - A CONVENTION, NOT A FUNCTION THIS LIBRARY DEFINES. An entry that holds
  notes, or paints something on layer 0 that a block clear could take away,
  sets `R=function(s,i) ... end` in its own Setup. `E` calls it on every
  expiry path, AFTER the block clear: an end code, a same-id re-press, a
  stale-cell press by another contact, and the Timer sweep. Callers: CHORUS
  (12-09, its note-off); RADAR POINTS and SONAR (12.1-03, D-15: their centre
  marker on layer 0 re-lit and re-coloured after every clear).

  AND IT MUST BE IDEMPOTENT. `Q` expires contact `i` on EVERY onset, without
  first checking whether that contact held anything - the guard would cost
  nine characters to save a call - so `R` is invoked on a contact's FIRST
  press as well as on a re-press. Measured in wasmoon (12-07): a single
  DOWN on a fresh contact produces one `R` call. An `R` that reads its own
  note table and returns when the contact holds nothing is correct; an `R`
  that sends an unconditional note-off is not.

---------------------------------------------------------------------------
6. THE HOLD BAND IS A FRACTION OF THE PITCH, NOT A WIDTH (D-18)
---------------------------------------------------------------------------

`W` holds the previous LED while the calibrated coordinate is within 45/64
of a pitch of its centre. That margin is a fraction of WHERE THE LEDS
ACTUALLY ARE, so in raw sensor units the band is as wide as the local pitch
makes it. On the measured tables, between LED 4 and LED 5 in x (pitch 21)
the band is EIGHT raw values, 71..78 - from LED 4 the first switch up is at
x = 79 (u = 301, 45 past 256), from LED 5 the first switch down is at x = 70
(u = 274; 320 - 274 = 46 is not under 45, so 71 at u = 277 still holds);
on the outer x segment, LED 7 -> LED 8 (pitch 6), it is THREE, 122..124; and
between LED 2 and LED 3 (pitch 17) it is SIX, 35..40. 12-07's `W` measured
seven values around the naive boundary at 71.1 and the research called the
new band "the same width"; that is true only where the pitch happens to be
17. `lua-smoke.spec.ts` asserts the band as a function of the table -
switch-up at the first `x` with `calibratedAxis(x) >= p*64 + 45`, switch-down
at the first with `calibratedAxis(x) <= (p+1)*64 - 45` - and prints the
width per segment, so the figures above are observed, never typed.

---------------------------------------------------------------------------
7. THE DEFECT THE 12-07 PLAN-CHECK FOUND, AND WHY THE SELF-EXPIRY IS FIRST
---------------------------------------------------------------------------

The superseded sketch expired OTHER contacts on an onset (`j~=i`) and never
contact `i` itself. FIRMWARE ASSIGNS THE LOWEST FREE CONTACT ID, so after a
lost lift the next press is normally THE SAME ID. Traced, and then measured
in a real Lua VM: contact 0 presses cell 40; the lift is lost; contact 0
presses cell 40 again; `h = H[0] = 40`, the hysteresis holds the stale cell
so `n` is 40, the scan skips `j==i`, and `if n==h then return end` fires.
`Q` RETURNED NIL AND THE PRESS VANISHED - the cell was dead until the finger
moved elsewhere. That is the probe's Q6.5 case leaking through the fix meant
to catch it.

The fix is one clause: on an onset, expire contact `i` BEFORE its cell is
computed. `h` is then nil, the hysteresis cannot hold the stale cell, and an
onset always returns a cell. `library.spec.ts` and `lua-smoke.spec.ts` drive
the same-id sequence FIRST, because it is the case the hardware normally
takes, and they assert the RETURN VALUE and not merely that a release fired.
From 12.1 the same path also darkens the stale block: `E` reaches `V`.

---------------------------------------------------------------------------
8. WHERE THE RISK IN THE EXPIRY LIVES, AND WHO DECIDES IT
---------------------------------------------------------------------------

The firmware's change gate (`grid_ui_touch_store_input:127-131`) drops
repeats, so a finger that is PERFECTLY still sends nothing at all. Q1 shows a
real finger wobbles on every sample - x 65<->66, y 66<->67 at 100 Hz - but
nothing GUARANTEES it. A Timer window shorter than the longest genuine hold
would release a held chord.

So the window is the caller's argument in `X(s,n)` and never a constant in
here. CHORUS already carries a 20-call watchdog at 100 ms (2 s) and keeps
that figure. THE BENCH ROW IN 12-12 ASKS THE USER TO HOLD A CHORD STILL FOR
TEN SECONDS AND REPORT WHETHER IT RELEASES, and that answer moves the
CALLERS, not this file.

Note that `Q` stamps `T[i]=C` on every live sample, including the ones whose
cell did not change, so a finger that is merely wobbling inside one cell
keeps its contact alive. Only genuine silence expires it.

Q7'S PHANTOMS ARE NOT THIS LIBRARY'S TO FIX. A large contact - a flat palm -
that loses its lift and then keeps JITTERING AND SENDING is reported by the
controller as live, and no timeout can see it as quiet. That is a hardware
finding recorded for the production unit, not a semantic a configuration can
reach. What the expiry answers is Q6.5: contacts that went quiet without a 5.

---------------------------------------------------------------------------
9. THE COST
---------------------------------------------------------------------------

255/0: 842 of 908, 66 free. 255/6: 873 of 908, 35 free. Both measured under
the pinned `GridScript.compressScript` after `padReady()`, and each a fixed
point of it. The parts of 255/0 are 32 + 65 + 126 + 86 + 88 + 294 + 74 + 60
+ 10 with eight single-space joins (843 uniform), and the minifier's one
edit is the space between the map's closing `}` and `function U`; the parts
of 255/6 are 9 + 62 + 221 + 111 + 70 + 176 + 150 + 68 with seven joins (874
uniform), and its one edit is the space between the marker's `]]` and
`function V`. That is why each string is built with its head concatenated
and its functions space-joined, and no other way. The figures before
12.1-08b: 781 + 705, with 255/0 at 32 + 65 + 126 + 86 + 88 + 294 + 74 + 10
(782 uniform) and 255/6 at 9 + 62 + 352 + 60 + 150 + 68 (706 uniform; 12.1-02
shipped `G` at 360 and 255/6 at 713 before 12.1-03 dropped the eight
characters of ` and e<9` from `G`'s end test - section 5). 12-07's one-slot
library read 769; a 255/6 with a pre-coloured `G` read 683 (682 canonical,
by the same `return (` space); the one-slot variants are in section 2.
`library.spec.ts` measures all of it rather than trusting this paragraph.

---------------------------------------------------------------------------
10. THE NAMES
---------------------------------------------------------------------------

EVERY NAME IS A SINGLE CAPITAL, WITH EXACTLY TWO EXCEPTIONS, and that is a
measurement rather than a style: every call site pays the name, and no
firmware Lua global is a single capital (`init.lua`, `events.lua`,
`mapsat.lua`, `simplecolor.lua`, `simplemidi.lua`, `autovalue.lua`, checked
in 12-RESEARCH section 3b). The two exceptions are the knot tables `KX` and
`KY` - two letters, because a table per axis needs the axis in its name and
each is paid for six times in the whole library. `../grid-fw/common/src/lua/
*.lua` was grepped for `KX`, `KY`, `function U`, `function G`, `function V`
and `function N` by the planner, by the plan-check and again by plan
12.1-02 on 2026-09-11: zero matches; and for `function Z`, `function Y`,
`function K` and the three as assignments by plan 12.1-08b on the same day,
across all fourteen files in that directory: zero matches. The one firmware
global that is close to a single capital is `EFN`, which is three.
```

## 2026-09-18 (change 8): the MIDI clock idiom lives in an entry, not here

ORBIT (EUCLID until change 8) follows a DAW's clock through `self.rtmrx_cb=function(s,h,b)` and a
step routine the Timer publishes as a field the callback reads. It is the reusable sequencer
piece the user asked to save (BENCH-2026-09-16.txt section 8, answer 6), and it is written out in
`docs/entries/orbit.md` under "The clock idiom" with the firmware and protocol evidence; STEPS,
RADAR POINTS and SONAR take it later on the user's word. It is an idiom and not a library
function by measurement: 255/0 has 66 free and 255/6 has 35, the callback is a hundred and
seventy characters and its step routine is the entry's own, so nothing here would pay for
itself. `library.ts` is untouched by the change; the callers named in its section 5 still say
EUCLID where they mean ORBIT, because that file is on the change's untouched list.
