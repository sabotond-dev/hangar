// THE TOUCH LIBRARY: two strings, ten functions, one convention. The first is
// written into the system element's Setup (element 255, event 0) and holds the
// state and the map; the second into the system element's Timer (element 255,
// event 6) and holds the painters and the senders. Every hand-authored entry's
// touch Setup calls both halves by name.
//
// ---------------------------------------------------------------------------
// 1. WHY IT LIVES IN THE SYSTEM ELEMENT, WITH THE FIRMWARE LINES
// ---------------------------------------------------------------------------
//
// `../grid-fw/common/src/lua/init.lua:46-50` runs `ele[#ele]:post_init_cb()`
// FIRST and then every other element in ascending order. On a ZONA `ele` has
// exactly two entries - touch at 0, system at 1 - so `ele[#ele]` IS the system
// element. A global defined in the system element's Setup therefore exists
// before any touch Setup runs, on every page load, by construction.
//
// `grid_decode.c:1283-1288` is the other half, and it is the one that decides
// HANGAR's write order: a CONFIG/EXECUTE registers the body and runs it
// IMMEDIATELY. At install time the init order is HANGAR's write order, not the
// firmware's page-load order, which is why the install store writes 255/0
// before 0/0 (plan 12-03) - a touch Setup that called this library before it
// was written would raise "attempt to call a nil value" once, on the desk.
//
// `grid_ui.c:370-383` wraps every stored event body as
// `ele[N].<fn> = function (self) local _efn = EFN; EFN = "<fn>"; <body>
// EFN = _efn end`. Two consequences, and both are load-bearing here:
//
//   - A `local function` in either string is INVISIBLE to the touch Setup,
//     because each body is its own function scope. Every name below is a plain
//     global, and so are the six state tables and scalars.
//   - The system element's own `self` carries `gtt`, `gtp`, `get`, `gsen` and
//     `ggen` and nothing else (`grid_ui_system.c:9-15`) - no `lwi`, no touch
//     accessors. So a library function that needs the TOUCH element takes it as
//     a parameter (`Q(s, ...)`, `G(s, ...)`, `A(s, ...)`), exactly as the
//     entries' own helpers already do.
//
// ---------------------------------------------------------------------------
// 2. WHY TWO SLOTS, AND THE ORDER THEY ARE WRITTEN IN (phase 12.1, D-03)
// ---------------------------------------------------------------------------
//
// The gradient does not fit beside Q6.5's expiry machinery in one slot. Every
// one-slot variant was measured under the pinned minifier (12.1-RESEARCH B.3,
// re-run by plans 01 and 02): everything 1,446; without `N` 1,384; without `N`
// and `D` 1,315; without `N`, `D`, `A` 1,164; with a two-knot linear `U` 1,100;
// with the expiry block clear removed as well 1,043 - STILL 135 OVER 908, and
// that last variant leaves a lost lift's gradient lit forever, which the
// probe's rules forbid. The gradient parts alone (`U`, the tables, `V`, `G`,
// `E`'s clause) are 614; the hysteresis and expiry machinery (`W E Q X`) is
// 521 as shipped. One slot cannot hold both.
//
// The system element's Timer, 255/6, is a 908-character slot nobody had
// claimed - `SLOT-ARITHMETIC.md` section 2 records it as "nothing, never
// asked". The user was asked on 2026-09-11 - "Use 255/6 (the system Timer) as
// the library's second slot? It means HANGAR writes a fourth string to the
// module and PUT BACK restores it" - and answered "yes"
// (`BENCH-2026-09-11.txt`, recorded as 12.1-CONTEXT D-03). So:
//
//   255/0  system Setup   marker, `H T C P B L`, `KX`, `KY`, `U W E Q X`,
//                         `self:tim()`                       781, 127 free
//   255/6  system Timer   marker, `V G N A D`                 713, 195 free
//
// (The research and the plans carried 782 and 714: those are the raw lengths
// of a `W` and an `N` written `return (` - one space each that the minifier
// removes - and `cost = max(raw, compressed)` charged the raw. The shipped
// strings are the fixed points, one character shorter on each side.)
//
// THE RULE THAT DECIDES WHICH SIDE A THING LIVES ON: 255/0 holds STATE and THE
// MAP, 255/6 holds THE PAINTERS AND THE SENDERS. A change to how the finger
// looks never touches the string that holds the knots, and the string that
// holds the knots never writes an LED or sends a message. `library.spec.ts`
// test 4 asserts it: every `glp(`, `glc(` and `gms(` call site is in 255/6;
// `KX=` and `KY=` appear in 255/0 only.
//
// THE JOIN IS ONE CALL. 255/0 ends with `self:tim()`, which runs the 255/6
// body as the system element's own Timer method, so the ten functions are all
// defined by the time the system Setup returns. That is why 255/6 is written
// FIRST: `grid_decode.c:1286-1287` registers a written body and runs it at
// once, and a 255/0 written before its `tim` method existed would raise
// "attempt to call a nil value (method 'tim')" on the desk. The install order
// is therefore 255/6, 255/0, 0/6, 0/0 - the same rule that already puts 0/6
// before 0/0 (Band 2, plan 12.1-06).
//
// THE PAGE-LOAD HALF IS SUPPORTED BY SOURCE AND NOT YET TAPPED ON A MODULE -
// MEDIUM. After a KEEP and a power cycle, `init.lua:25-50` registers every
// stored body of every element as a method (`gas(i, eve[j], path)`) BEFORE
// `ele[#ele]:post_init_cb()` runs; `grid_ui_system.c:26` binds the system
// element's event index 2 to `GRID_LUA_FNC_A_TIMER_short`, which
// `grid_protocol.h:876` spells "tim"; so `tim` is a method on the system
// element when the system `ini` calls `self:tim()`. The same mechanism is
// proved on the user's ZONA for the touch element's own `tim` (probe 1) and for
// the system element's `map` called from the touch element (probe 2). What no
// probe has tapped is THIS combination - the system `ini` calling the system
// `tim` on a page load. It is 12.1-CONTEXT D-04's runbook row (KEEP, power
// cycle, tap one re-fitted entry), and its failure signature is `attempt to
// call a nil value (global 'G')`. The fallback with no new doubt is written
// there: drop `self:tim()` from 255/0 and open every re-fitted Setup with
// `ele[#ele]:tim()`, a touch script calling a system method, which probe 2
// proved. Nothing in this file assumes the outcome.
//
// ---------------------------------------------------------------------------
// 3. WHY `G` CARRIES THE COLOUR (D-11) - LAYER 0 IS THE ALERT LAYER
// ---------------------------------------------------------------------------
//
// The finger is drawn on layer 0 everywhere, and layer 0 is the firmware's
// alert layer. `grid_alert_one_set` (`grid_led.c:260-271`) rewrites layer 0's
// COLOUR on an LED (`grid_led_set_layer_color`), forces its min to 0, and sets
// shape, timeout and phase; `grid_alert_all_set` does it to all eighty-one.
// It is called:
//
//   - on a CONFIG write (`grid_decode.c:1282`, WHITE 64) - BEFORE the written
//     body runs, so a Setup that colours layer 0 wins over it;
//   - on page-discard completion (`grid_decode.c:887`, WHITE_DIM 64,64,64);
//   - on a refused page change (`grid_lua_api.c:1695`, PURPLE);
//   - on a TX overflow (`grid_transport.c:253`, BLUE);
//   - and at boot.
//
// A finger coloured ONCE, in an init loop over eighty-one cells, turns grey,
// purple or blue after any of those and stays so until the Setup re-runs -
// 13-12's page switch alone would do it. So `G(s,i,e,x,y,l,r,g,b)` TAKES THE
// COLOUR and re-asserts it with `glc(a,l,r,g,b,1)` on each of its four cells on
// every call: the finger heals on the next sample, the init colouring goes
// from every entry, and the peak is fixed at 255 because every caller passed
// 255. The trailing `1` matters: `l_grid_led_layer_color` with six arguments
// (`grid_lua_api.c:1062-1100`, the `nargs == 6` branch) forces the layer's min
// to 0, so there is no byte-6 floor under a coloured layer and a cell `V`
// clears is DARK, not dim. The research's floor paragraph was wrong, and it is
// corrected here rather than left.
//
// Measured: 255/6 at 714 against 683 for a `G` that relied on a pre-coloured
// layer; every re-fit CHEAPER than that shape, because the init loop goes.
// 12.1-CONTEXT D-11 costed the alternatives - another layer (there is none;
// `GRID_LED_LAYER_COUNT` is 3 and every entry paints 1 and 2) and accepting the
// recolouring (free, and wrong after every page switch).
//
// ---------------------------------------------------------------------------
// 4. THE SIX PROBE RULES, AND WHERE EACH ONE LIVES NOW
// ---------------------------------------------------------------------------
//
// `.planning/phases/12-touch-framework/PROBE-RESULTS-2026-09-10.md` is the
// ground truth - measured on the user's own ZONA, and everything the simulator
// says about touch is subordinate to it. Six rules came out of it:
//
//   1. Cell hit-testing with hysteresis (Q1, Q2). HERE: `W` and `Q`, now in
//      CALIBRATED space (section 6). Q2's trace is the whole reason: a finger
//      resting on the line between two cells sent 71, 72, 71, 71, 71 - and
//      `71*9//128 = 4` while `72*9//128 = 5`, so a ONE-UNIT wobble flipped the
//      cell. The gradient (rule 5) removes the cell for the LIGHT, not for the
//      TOGGLE: a bare argmax would toggle both neighbours alternately at 100 Hz
//      for a finger resting on a seam - the exact Q2 failure. The hysteresis
//      stays.
//   2. A lift is never trusted on its own (Q6.5, Q7). HERE: `Q`'s two onset
//      expiry clauses and `X`, all releasing through `E` and the entry's `R`.
//      Q6.5: four of five contacts never sent their code 5 after a five-finger
//      chord. An entry that sends note-on at press and note-off at release
//      hangs notes exactly that way, and no simulator shows it. From 12.1 `E`
//      also darkens the contact's gradient block through `V`, because a lost
//      lift must take the light away as well as the note.
//   3. Per-axis send-on-change, never on every sample (Q1). HERE: `A`.
//   4. Single contact by default (Q6, Q6.5). NOT HERE, deliberately. This
//      library tracks EVERY contact - `H`, `T`, `P` and `B` are keyed by `i` -
//      because CHORUS, CONSOLE, EUCLID and WHEELS all want per-contact
//      tracking. The rule is an ENTRY-level one, written `if i>0 then return
//      end` in the cards that are single-pointer (MORPH and GHOST carry it
//      today), and each entry that takes it says so in its own header.
//   5. The finger lights where the firmware thinks it is. HERE, SINCE
//      2026-09-11: `G`, the bilinear finger, with eight callers named (EUCLID,
//      STEPS, RADAR POINTS, SONAR, CHORUS, MORPH, CONSOLE, LUMEN - plans
//      12.1-03 and 12.1-04). Plan 12-07 wrote this rule as "NOT HERE, AND NO
//      FUNCTION SHIPS FOR IT ... if a later entry wants it, it comes back WITH
//      ITS CALLER NAMED, not on speculation", and dropped the sketch's `F`,
//      which lit one cell. That sentence is superseded exactly as it said it
//      would be: the user's specification (12.1-CONTEXT D-01) is that a finger
//      between two LEDs lights both dimly and a finger in the middle of four
//      lights all four, so what ships is not `F` - `G` is a different
//      primitive with a different contract - and `F` stays dropped.
//   6. Nothing is built on code 9 (Q3). The onset edge `(e==4 or e>8)` stays
//      and `H[i]=e<9 and n` keeps the research's harmless handling of a 9;
//      nothing depends on the `e>8` half. Q3 measured ten taps as fast as a
//      hand can make them and NOT ONE arrived as a 9 - every one was 4, at
//      least one 1, then 5.
//
// ---------------------------------------------------------------------------
// 5. THE CONTRACT, FUNCTION BY FUNCTION, WITH EACH ONE'S CALLER
// ---------------------------------------------------------------------------
//
// A function with no caller is not shipped. Each of the ten below names the
// plan that calls it, and `library.spec.ts` is where the cost of shipping one
// is measured. The unit `U` returns is a 64th of an LED pitch: LED `n` sits at
// `n*64`, the axis runs 0..512, and every cell and every weight in this file is
// integer arithmetic in that unit - firmware Lua is 5.4 with integers and `glp`
// wants an integer phase, so there is no float anywhere for it to reject.
//
// 255/0 - state and the map:
//
// `U(v, k)` - THE CALIBRATED AXIS. Raw 0..127 through the nine-knot table `k`
//   (`KX` or `KY`, rendered from `src/lib/catalog/calibration.ts`, MEASURED on
//   the user's ZONA by Probe C on 2026-09-11) -> 0..512, piecewise-linear
//   between knots and clamped to the table's ends with `glim`. `KX[n]` is the
//   raw x the sensor reports with a finger centred on LED `n`, so `U(KX[n],
//   KX) == n*64` exactly. `calibratedAxis()` in `calibration.ts` is its
//   TypeScript twin with the same floor division, and `lua-smoke.spec.ts`
//   drives the two against each other for every value on both axes. Called
//   by `Q` (twice), `G` (twice), `N` (twice) and TRACKPAD's Timer (12.1-04,
//   its two flash centres).
//
// `W(u, p)` - ONE-AXIS HYSTERESIS IN CALIBRATED SPACE. If the contact held
//   LED `p` on this axis, keep it while `u` is within 45/64 of a pitch of `p`'s
//   centre `p*64`; else read the nearest LED, `(u+32)//64`. Section 6 says what
//   the band is on the measured map. Called by `Q`, twice.
//
// `E(s, i)` - EXPIRE CONTACT `i`. Forget its cell and its stamp; if `G` drew a
//   block for it, clear that block through `V` and forget it; then call
//   `R(s, i)` if the entry defined one. Called by `Q` and `X`.
//
// `Q(s, i, e, x, y)` - THE CELL A CONTACT IS ON, when it changed, else nil.
//   An end code (`e~=1 and e~=4 and e<9`) expires the contact and returns nil.
//   Otherwise, ON AN ONSET (`e==4 or e>8`), IT FIRST EXPIRES CONTACT `i`
//   ITSELF (section 7), then stamps `T[i]=C`, computes the cell with hysteresis
//   on both axes - `W(U(x,KX), ...)` and `W(U(y,KY), ...)` - and on an onset
//   ALSO expires any other contact holding the cell just landed on. The
//   cross-contact scan needs no `j~=i` guard because `H[i]` is already gone.
//   The cell is returned only when it changed; an onset therefore ALWAYS
//   returns one. The contract is 12-07's, unchanged; the cells now come from
//   the measured map, so the toggle and the gradient agree on where the LEDs
//   are because both read `U`. Callers: EUCLID, STEPS, RADAR POINTS, SONAR
//   (12-08), CHORUS and CONSOLE (12-09), LUMEN (12-11), and every one of them
//   again after its 12.1 re-fit - eight. Not TRACKPAD: a trackpad is relative
//   motion and never asks which cell a finger is on.
//
// `X(s, n)` - THE TIMER-SIDE SWEEP. `C=C+1`, then expire every contact whose
//   stamp is older than `n` calls. `n` IS IN TIMER CALLS AND IT IS THE
//   CALLER'S, not a library constant - see section 8. Callers: EUCLID, STEPS,
//   RADAR POINTS and SONAR (12-08), CHORUS (12-09) - five.
//
// 255/6 - the painters and the senders:
//
// `V(n)` - CLEAR THE 2x2 BLOCK whose origin is cell `n`, on layer `L` (the
//   layer `G` last drew on), by writing phase 0 to its four cells. Called by
//   `G` (the contact's previous block) and `E` (every expiry path).
//
// `G(s, i, e, x, y, l, r, g, b)` - THE BILINEAR FINGER. Touch element, contact,
//   code, raw x, raw y, layer, colour. Clears the contact's previous block;
//   then, unless `e` is an end code, takes `u = U(x,KX)`, `w = U(y,KY)`, the
//   block origin `c + q*9` with `c = glim(u//64,0,7)` and `q = glim(w//64,0,7)`,
//   the fractions `f = u - c*64` and `h = w - q*64` (0..63, or 64 at the far
//   end of the last segment - the ninth LED is reached as the SECOND column of
//   the eighth block, so no index leaves 0..8 and no cell is written twice),
//   and lights the four cells `n, n+1, n+9, n+10` at phases
//   `255*(64-f)*(64-h)//4096`, `255*f*(64-h)//4096`, `255*(64-f)*h//4096` and
//   `255*f*h//4096` - SETTING THE COLOUR ON EACH CELL FIRST (section 3).
//   Remembers the block in `B[i]` and the layer in `L`. The weights are LINEAR
//   on purpose (12.1-CONTEXT D-12): the firmware's phase-to-output curve is
//   already convex, so half weight lands on about 25 % duty, which the eye
//   reads as roughly 55-60 %; a square-law variant was costed and is not the
//   default. Callers, each named: EUCLID, STEPS, RADAR POINTS, SONAR
//   (12.1-03), CHORUS, MORPH, CONSOLE, LUMEN (12.1-04) - eight.
//
// `N(x, y)` - THE NEAREST CALIBRATED CELL, no hysteresis and no state, for a
//   press-time lookup: `(U(x,KX)+32)//64 + (U(y,KY)+32)//64*9`. Callers: ARC's
//   stop tap (12.1-03, `N(x,y)==40`) and 13-15's region lookup, named in
//   advance.
//
// `A(s, i, e, x, y, c, d, h)` - PER-AXIS SEND-ON-CHANGE, per contact, and it is
//   the user's own bench snippet. On live codes (`e<4`) it sends CC `c` = x
//   when x moved and CC `d` = `127-y` when y moved, on channel `h`; a DOWN
//   primes `P[i]` without sending. `127-y` IS THE SNIPPET'S OWN INVERSION -
//   screen y grows downwards and a fader does not - so nobody reads it as a
//   bug. It sends RAW coordinates and is not calibrated (12.1-CONTEXT D-14): a
//   calibrated pair would change what a DAW receives from the one entry that
//   sends a position, silently. ONE CALLER: LUMEN (12-11).
//
// `D(n, l, w)` - A DECAY THAT LANDS ON PHASE 0. `glpfs(a,l,w,250,0)` plus
//   `glt(a,l,w//6)`: rate 250 is -6 on the byte ring, so a `w` that is a
//   multiple of 6 walks down to exactly 0 in `w//6` ticks and the layer freezes
//   dark. This is `decay-idiom.spec.ts`'s class-A rule, parameterised.
//   `w` IS A BYTE, SO `D` COVERS TIMEOUTS OF AT MOST 42 TICKS (w = 252). An
//   entry whose decay knob reaches beyond that - MORPH's `@DECAY` runs 21..126 -
//   keeps the inline idiom that gate already reads. ONE CALLER: TRACKPAD
//   (12-10), from its Timer, with every `w` a multiple of six by construction.
//
// `R` - A CONVENTION, NOT A FUNCTION THIS LIBRARY DEFINES. An entry that holds
//   notes, or paints something on layer 0 that a block clear could take away,
//   sets `R=function(s,i) ... end` in its own Setup. `E` calls it on every
//   expiry path, AFTER the block clear: an end code, a same-id re-press, a
//   stale-cell press by another contact, and the Timer sweep. Callers: CHORUS
//   (12-09, its note-off); RADAR POINTS and SONAR (12.1-03, D-15: their centre
//   marker on layer 0 re-lit and re-coloured after every clear).
//
//   AND IT MUST BE IDEMPOTENT. `Q` expires contact `i` on EVERY onset, without
//   first checking whether that contact held anything - the guard would cost
//   nine characters to save a call - so `R` is invoked on a contact's FIRST
//   press as well as on a re-press. Measured in wasmoon (12-07): a single
//   DOWN on a fresh contact produces one `R` call. An `R` that reads its own
//   note table and returns when the contact holds nothing is correct; an `R`
//   that sends an unconditional note-off is not.
//
// ---------------------------------------------------------------------------
// 6. THE HOLD BAND IS A FRACTION OF THE PITCH, NOT A WIDTH (D-18)
// ---------------------------------------------------------------------------
//
// `W` holds the previous LED while the calibrated coordinate is within 45/64
// of a pitch of its centre. That margin is a fraction of WHERE THE LEDS
// ACTUALLY ARE, so in raw sensor units the band is as wide as the local pitch
// makes it. On the measured tables, between LED 4 and LED 5 in x (pitch 21)
// the band is EIGHT raw values, 71..78 - from LED 4 the first switch up is at
// x = 79 (u = 301, 45 past 256), from LED 5 the first switch down is at x = 70
// (u = 274; 320 - 274 = 46 is not under 45, so 71 at u = 277 still holds);
// on the outer x segment, LED 7 -> LED 8 (pitch 6), it is THREE, 122..124; and
// between LED 2 and LED 3 (pitch 17) it is SIX, 35..40. 12-07's `W` measured
// seven values around the naive boundary at 71.1 and the research called the
// new band "the same width"; that is true only where the pitch happens to be
// 17. `lua-smoke.spec.ts` asserts the band as a function of the table -
// switch-up at the first `x` with `calibratedAxis(x) >= p*64 + 45`, switch-down
// at the first with `calibratedAxis(x) <= (p+1)*64 - 45` - and prints the
// width per segment, so the figures above are observed, never typed.
//
// ---------------------------------------------------------------------------
// 7. THE DEFECT THE 12-07 PLAN-CHECK FOUND, AND WHY THE SELF-EXPIRY IS FIRST
// ---------------------------------------------------------------------------
//
// The superseded sketch expired OTHER contacts on an onset (`j~=i`) and never
// contact `i` itself. FIRMWARE ASSIGNS THE LOWEST FREE CONTACT ID, so after a
// lost lift the next press is normally THE SAME ID. Traced, and then measured
// in a real Lua VM: contact 0 presses cell 40; the lift is lost; contact 0
// presses cell 40 again; `h = H[0] = 40`, the hysteresis holds the stale cell
// so `n` is 40, the scan skips `j==i`, and `if n==h then return end` fires.
// `Q` RETURNED NIL AND THE PRESS VANISHED - the cell was dead until the finger
// moved elsewhere. That is the probe's Q6.5 case leaking through the fix meant
// to catch it.
//
// The fix is one clause: on an onset, expire contact `i` BEFORE its cell is
// computed. `h` is then nil, the hysteresis cannot hold the stale cell, and an
// onset always returns a cell. `library.spec.ts` and `lua-smoke.spec.ts` drive
// the same-id sequence FIRST, because it is the case the hardware normally
// takes, and they assert the RETURN VALUE and not merely that a release fired.
// From 12.1 the same path also darkens the stale block: `E` reaches `V`.
//
// ---------------------------------------------------------------------------
// 8. WHERE THE RISK IN THE EXPIRY LIVES, AND WHO DECIDES IT
// ---------------------------------------------------------------------------
//
// The firmware's change gate (`grid_ui_touch_store_input:127-131`) drops
// repeats, so a finger that is PERFECTLY still sends nothing at all. Q1 shows a
// real finger wobbles on every sample - x 65<->66, y 66<->67 at 100 Hz - but
// nothing GUARANTEES it. A Timer window shorter than the longest genuine hold
// would release a held chord.
//
// So the window is the caller's argument in `X(s,n)` and never a constant in
// here. CHORUS already carries a 20-call watchdog at 100 ms (2 s) and keeps
// that figure. THE BENCH ROW IN 12-12 ASKS THE USER TO HOLD A CHORD STILL FOR
// TEN SECONDS AND REPORT WHETHER IT RELEASES, and that answer moves the
// CALLERS, not this file.
//
// Note that `Q` stamps `T[i]=C` on every live sample, including the ones whose
// cell did not change, so a finger that is merely wobbling inside one cell
// keeps its contact alive. Only genuine silence expires it.
//
// Q7'S PHANTOMS ARE NOT THIS LIBRARY'S TO FIX. A large contact - a flat palm -
// that loses its lift and then keeps JITTERING AND SENDING is reported by the
// controller as live, and no timeout can see it as quiet. That is a hardware
// finding recorded for the production unit, not a semantic a configuration can
// reach. What the expiry answers is Q6.5: contacts that went quiet without a 5.
//
// ---------------------------------------------------------------------------
// 9. THE COST
// ---------------------------------------------------------------------------
//
// 255/0: 781 of 908, 127 free. 255/6: 713 of 908, 195 free. Both measured under
// the pinned `GridScript.compressScript` after `padReady()`, and each a fixed
// point of it. The parts of 255/0 are 32 + 65 + 126 + 86 + 88 + 294 + 74 + 10
// with seven single-space joins (782 uniform), and the minifier's one edit is
// the space between the map's closing `}` and `function U`; the parts of 255/6
// are 9 + 62 + 360 + 60 + 150 + 68 with five joins (714 uniform), and its one
// edit is the space between the marker's `]]` and `function V`. That is why
// each string is built with its head concatenated and its functions
// space-joined, and no other way. 12-07's one-slot library read 769; a 255/6
// with a pre-coloured `G` read 683 (682 canonical, by the same `return (`
// space); the one-slot variants are in section 2. `library.spec.ts` measures
// all of it rather than trusting this paragraph.
//
// ---------------------------------------------------------------------------
// 10. THE NAMES
// ---------------------------------------------------------------------------
//
// EVERY NAME IS A SINGLE CAPITAL, WITH EXACTLY TWO EXCEPTIONS, and that is a
// measurement rather than a style: every call site pays the name, and no
// firmware Lua global is a single capital (`init.lua`, `events.lua`,
// `mapsat.lua`, `simplecolor.lua`, `simplemidi.lua`, `autovalue.lua`, checked
// in 12-RESEARCH section 3b). The two exceptions are the knot tables `KX` and
// `KY` - two letters, because a table per axis needs the axis in its name and
// each is paid for six times in the whole library. `../grid-fw/common/src/lua/
// *.lua` was grepped for `KX`, `KY`, `function U`, `function G`, `function V`
// and `function N` by the planner, by the plan-check and again by plan
// 12.1-02 on 2026-09-11: zero matches. The one firmware global that is close
// to a single capital is `EFN`, which is three.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { renderKnots } from "./calibration";

/**
 * The library's state, and the head of the 255/0 string.
 *
 * `H` cell by contact, `T` last-seen stamp by contact, `C` the Timer counter
 * `X` advances, `P` last (x, y) by contact for `A`, `B` the gradient block by
 * contact for `G` and `V`, `L` the layer `G` last drew on. All six are globals
 * because `grid_ui.c:370-383` puts each event body in its own function scope,
 * so a local here would be invisible to every touch Setup.
 *
 * The `--[[@cb]]` marker is the event marker every stored body carries. It is a
 * Lua BLOCK comment, so it costs the string nine characters and the VM nothing.
 */
const HEAD = "--[[@cb]]H={}T={}C=0 P={}B={}L=0";

/** The event marker alone - the head of the 255/6 string. */
const MARKER = "--[[@cb]]";

/**
 * The map: `KX={...}KY={...}`, rendered from `calibration.ts` and never typed
 * here. A knot that moves in the table moves on the wire by derivation.
 */
const MAP = renderKnots();

const U =
  "function U(v,k)v=glim(v,k[1],k[9])for i=1,8 do if v<k[i+1]then " +
  "return i*64-64+(v-k[i])*64//(k[i+1]-k[i])end end return 512 end";

// `return(` with no space, as in `N` below: the minifier's own fixed point.
const W =
  "function W(u,p)if p and u-p*64<45 and p*64-u<45 then return p end " +
  "return(u+32)//64 end";

const E =
  "function E(s,i)H[i]=nil T[i]=nil if B[i]then V(B[i])B[i]=nil end " +
  "if R then R(s,i)end end";

const Q =
  "function Q(s,i,e,x,y)if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 if o then E(s,i)end T[i]=C local h=H[i]" +
  "local n=W(U(x,KX),h and h%9)+W(U(y,KY),h and h//9)*9 " +
  "if o then for j,g in pairs(H)do if g==n then E(s,j)end end end " +
  "if n==h then return end H[i]=e<9 and n return n end";

const X =
  "function X(s,n)C=C+1 for i,t in pairs(T)do if C-t>n then E(s,i)end end end";

/** The one call that joins the two slots. */
const CALL = "self:tim()";

const V = "function V(n)for d=0,3 do glp(glag(0,n+d%2+d//2*9),L,0)end end";

const G =
  "function G(s,i,e,x,y,l,r,g,b)L=l local o=B[i]if o then V(o)end " +
  "if e~=1 and e~=4 and e<9 then B[i]=nil return end " +
  "local u,w=U(x,KX),U(y,KY)local c,q=glim(u//64,0,7),glim(w//64,0,7)" +
  "local f,h=u-c*64,w-q*64 local n=c+q*9 for d=0,3 do local p,t=d%2,d//2 " +
  "local a=glag(0,n+p+t*9)glc(a,l,r,g,b,1)" +
  "glp(a,l,255*(p>0 and f or 64-f)*(t>0 and h or 64-h)//4096)end B[i]=n end";

// `return(` with no space: that is the minifier's own fixed point, and the
// research's `return (` was one character the minifier removed - 12.1-02
// measured 713 canonical where the research carried 714 as max(raw, compressed).
const N = "function N(x,y)return(U(x,KX)+32)//64+(U(y,KY)+32)//64*9 end";

const A =
  "function A(s,i,e,x,y,c,d,h)local p=P[i]or{}if e<4 then " +
  "if x~=p[1]then s:gms(h,176,c,x,0)end " +
  "if y~=p[2]then s:gms(h,176,d,127-y,0)end end P[i]={x,y}end";

const D =
  "function D(n,l,w)local a=glag(0,n)glpfs(a,l,w,250,0)glt(a,l,w//6)end";

/** The two slots the library occupies: the system element's Setup and Timer. */
export type LibrarySlot = 0 | 6;

/**
 * The library in named parts, each with its slot, which is what makes its
 * cost auditable per function.
 *
 * The parts are the ONLY copy of the Lua: `TOUCH_LIBRARY` and
 * `TOUCH_LIBRARY_TIMER` below are built from them, so a part edited here moves
 * the shipped string and the measured cost together and cannot drift from
 * either. The map part is `renderKnots()`, so it cannot drift from
 * `calibration.ts` either.
 */
export const LIBRARY_PARTS: readonly {
  readonly name: string;
  readonly lua: string;
  readonly slot: LibrarySlot;
}[] = [
  { name: "header and tables", lua: HEAD, slot: 0 },
  { name: "the map", lua: MAP, slot: 0 },
  { name: "U", lua: U, slot: 0 },
  { name: "W", lua: W, slot: 0 },
  { name: "E", lua: E, slot: 0 },
  { name: "Q", lua: Q, slot: 0 },
  { name: "X", lua: X, slot: 0 },
  { name: "the call", lua: CALL, slot: 0 },
  { name: "marker", lua: MARKER, slot: 6 },
  { name: "V", lua: V, slot: 6 },
  { name: "G", lua: G, slot: 6 },
  { name: "N", lua: N, slot: 6 },
  { name: "A", lua: A, slot: 6 },
  { name: "D", lua: D, slot: 6 },
];

/**
 * The string written to element 255, event 0 - state and the map. Canonical: a
 * fixed point of the pinned `GridScript.compressScript`, so
 * `cost = max(compressed, raw)` charges exactly its own length and the budget
 * meter is not lying.
 *
 * THE JOIN IS NOT UNIFORM, AND THAT IS THE CANONICAL FORM ITSELF. The map ends
 * `}` and the minifier deletes the space before `function U`, because `}` and
 * `f` need no separator; every other seam - `L=0 KX`, `end function`,
 * `end self` - is two names that would otherwise run together. So the head and
 * the map are joined with the one space they need, the map and the functions
 * are concatenated, and the functions and the call are joined with single
 * spaces. Joining all eight parts uniformly gives 782 raw, which compresses to
 * exactly this string - asserted in `library.spec.ts`, not assumed.
 */
export const TOUCH_LIBRARY =
  HEAD + " " + MAP + [U, W, E, Q, X].join(" ") + " " + CALL;

/**
 * The string written to element 255, event 6 - the painters and the senders.
 * Canonical on the same rule: the marker is a block comment and `]]` needs no
 * separator before `function V`, so the marker is concatenated and the five
 * functions are space-joined. Written to the module BEFORE `TOUCH_LIBRARY`,
 * whose closing `self:tim()` runs this body as the system element's Timer
 * method (section 2).
 */
export const TOUCH_LIBRARY_TIMER = MARKER + [V, G, N, A, D].join(" ");

/**
 * The library's own version, IN TYPESCRIPT AND NOT IN THE LUA, because a
 * comment in either string costs real characters out of 908.
 *
 * What it is for: a runtime CONFIG/EXECUTE write does NOT clear `_G`. Firmware
 * runs the new body over the globals the old one left behind
 * (`grid_decode.c:1283-1288`), so a future version that REMOVES a global does
 * not remove it from a module that is already running - only a page load or a
 * power cycle does. A version that only ADDS or CHANGES functions is safe to
 * write over a live module; one that DROPS a name must bump this, and the
 * difference is visible to a reader here rather than discovered on the desk.
 *
 * STILL "1" AFTER THE 12.1 REVISION, AND HERE IS WHY. The revision added `U`,
 * `V`, `G`, `N`, `B`, `L`, `KX` and `KY`, changed `W`, `E` and `Q`, and moved
 * `A` and `D` to the second string - but every name 12-07's library defined
 * (`H T C P W E Q X A D`) is still defined by this one. Nothing left `_G`, so
 * a live module written over with both strings holds no stale name, and the
 * rule above says an addition or a change does not bump.
 */
export const LIBRARY_VERSION = "1";

/**
 * Every global the library DEFINES, across BOTH strings, derived from the
 * source at module load and never typed out.
 *
 * Two patterns, because the library defines two kinds of name: `function Q(`
 * for the ten functions and `C=0` / `H={}` / `KX={` for the eight state names.
 * One or two capitals, because the two knot tables are the library's only
 * two-letter names (section 10). A function renamed in a string above moves
 * this list with it, which is what lets `host-surface.spec.ts` admit the
 * library's call sites without a second copy of the list to keep in step.
 */
export const LIBRARY_GLOBALS: readonly string[] = [
  ...new Set(
    [TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER].flatMap((text) => [
      ...[...text.matchAll(/\bfunction\s+([A-Z]{1,2})\s*\(/g)].map((m) => m[1]),
      ...[...text.matchAll(/\b([A-Z]{1,2})=/g)].map((m) => m[1]),
    ]),
  ),
].sort();

/**
 * The names the library CALLS but does not define - the `R` convention, and
 * only it.
 *
 * `R` is the entry's release function (section 5). `E` calls it behind an
 * `if R then` guard, so a library running under an entry that defines no `R`
 * is correct and silent. It is listed separately from `LIBRARY_GLOBALS`
 * BECAUSE IT IS NOT A DEFINITION: a scanner that derived it from the source
 * would admit any single capital anybody typed. `library.spec.ts` asserts that
 * the capital call sites in both strings are exactly `LIBRARY_GLOBALS` plus
 * this list, so an eleventh function or a second convention cannot arrive
 * unannounced.
 */
export const LIBRARY_CONVENTIONS: readonly string[] = ["R"];
