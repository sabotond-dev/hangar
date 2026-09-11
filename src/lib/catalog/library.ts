// THE TOUCH LIBRARY: one string, six functions, one convention, written into
// the system element's Setup (element 255, event 0) so that every hand-authored
// entry's touch Setup can call it by name.
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
//   - A `local function` in the system Setup is INVISIBLE to the touch Setup,
//     because each body is its own function scope. Every name below is a plain
//     global, and so are the four state tables.
//   - The system element's own `self` carries `gtt`, `gtp`, `get`, `gsen` and
//     `ggen` and nothing else (`grid_ui_system.c:9-15`) - no `lwi`, no touch
//     accessors. So a library function that needs the TOUCH element takes it as
//     a parameter (`Q(s, ...)`, `A(s, ...)`), exactly as the entries' own
//     helpers already do.
//
// EVERY NAME IS A SINGLE CAPITAL, and that is a measurement rather than a
// style: every call site pays the name, and no firmware Lua global is a single
// capital (`init.lua`, `events.lua`, `mapsat.lua`, `simplecolor.lua`,
// `simplemidi.lua`, `autovalue.lua`, checked in 12-RESEARCH §3b). The one
// firmware global that is close is `EFN`, which is three.
//
// ---------------------------------------------------------------------------
// 2. THE SIX PROBE RULES, AND THE TWO THAT ARE NOT THIS FILE'S
// ---------------------------------------------------------------------------
//
// `.planning/phases/12-touch-framework/PROBE-RESULTS-2026-09-10.md` is the
// phase's ground truth - measured on the user's own ZONA, and everything the
// simulator says about touch is subordinate to it. Six rules came out of it:
//
//   1. Cell hit-testing with hysteresis (Q1, Q2). HERE: `W` and `Q`.
//      Q2's trace is the whole reason: a finger resting on the line between two
//      cells sent 71, 72, 71, 71, 71 - and `71*9//128 = 4` while
//      `72*9//128 = 5`, so a ONE-UNIT wobble flipped the cell. That is what the
//      bench reported as "not precise" on EUCLID, STEPS and RADAR POINTS.
//   2. A lift is never trusted on its own (Q6.5, Q7). HERE: `Q`'s two onset
//      expiry clauses and `X`, all releasing through `E` and the entry's `R`.
//      Q6.5: four of five contacts never sent their code 5 after a five-finger
//      chord. An entry that sends note-on at press and note-off at release
//      hangs notes exactly that way, and no simulator shows it.
//   3. Per-axis send-on-change, never on every sample (Q1). HERE: `A`.
//   4. Single contact by default (Q6, Q6.5). NOT HERE, deliberately. This
//      library tracks EVERY contact - `H`, `T` and `P` are keyed by `i` -
//      because CHORUS, CONSOLE, EUCLID and WHEELS all want per-contact
//      tracking. The rule is an ENTRY-level one, written `if i>0 then return
//      end` in the cards that are single-pointer (MORPH and GHOST carry it
//      today), and each entry that takes it says so in its own header.
//   5. The finger lights its cell. NOT HERE, AND NO FUNCTION SHIPS FOR IT. The
//      planner's sketch carried an `F` for this and NOTHING CALLS IT: the four
//      cell-toggling sequencers decline it by name (their armed cells toggle
//      under the finger and that IS the feedback), CONSOLE repaints through its
//      own `P`, MORPH lights its trail, CHORUS its bloom, LUMEN its cursor
//      cell, TRACKPAD its edges. `F` was dropped and its 123 characters returned
//      to the budget - together with the `O={}` table and the `L` light layer
//      that existed only for it. If a later entry wants it, it comes back WITH
//      ITS CALLER NAMED, not on speculation.
//   6. Nothing is built on code 9 (Q3). The onset edge `(e==4 or e>8)` stays
//      and `H[i]=e<9 and n` keeps the research's harmless handling of a 9;
//      nothing depends on the `e>8` half. Q3 measured ten taps as fast as a
//      hand can make them and NOT ONE arrived as a 9 - every one was 4, at
//      least one 1, then 5.
//
// ---------------------------------------------------------------------------
// 3. THE CONTRACT, FUNCTION BY FUNCTION, WITH EACH ONE'S CALLER
// ---------------------------------------------------------------------------
//
// A function with no caller is not shipped. Each of the six below names the
// plan that calls it, and `library.spec.ts` is where the cost of shipping one
// is measured.
//
// `W(v, p)` - ONE-AXIS HYSTERESIS. If the contact held cell `p` on this axis,
//   keep it while `v` is within +-10 of `p`'s centre `(p*128+64)//9`; else read
//   the axis naively as `v*9//128`. A cell is 128/9 = 14.22 units wide, so its
//   half-width is 7.11 and leaving a held cell needs 11 units from the centre -
//   AN EFFECTIVE MARGIN OF ~3.9 RAW UNITS, stated as 4, against the probe's
//   "at least 2, 3 is the working figure".
//   ON THE PROBE'S OWN 71/72 BOUNDARY THE OVERLAP IS SEVEN VALUES, 68..74:
//   centres are 64 (cell 4) and 78 (cell 5); from cell 4, x = 72, 73 and 74
//   stay in 4 and 75 switches; from cell 5, x = 68 stays in 5 and 67 switches
//   back. Seven, not eight - count them. Called by `Q`, twice.
//
// `E(s, i)` - EXPIRE CONTACT `i`. Forget its cell and its stamp, and call
//   `R(s, i)` if the entry defined one. It lights and darkens nothing, because
//   no entry asked the library to. Called by `Q` and `X`.
//
// `Q(s, i, e, x, y)` - THE CELL A CONTACT IS ON, when it changed, else nil.
//   An end code (`e~=1 and e~=4 and e<9`) expires the contact and returns nil.
//   Otherwise, ON AN ONSET (`e==4 or e>8`), IT FIRST EXPIRES CONTACT `i`
//   ITSELF - a press by an id that still holds a cell means that id's lift was
//   lost, and the hysteresis must not read the new press against the stale
//   cell. Then it stamps `T[i]=C`, computes the cell with hysteresis on both
//   axes, and on an onset ALSO expires any other contact holding the cell just
//   landed on. The cross-contact scan needs no `j~=i` guard because `H[i]` is
//   already gone. The cell is returned only when it changed; an onset therefore
//   ALWAYS returns one. Callers: EUCLID, STEPS, RADAR POINTS, SONAR (12-08),
//   CHORUS and CONSOLE (12-09), LUMEN (12-11). Not TRACKPAD (12-10): a
//   trackpad is relative motion and never asks which cell a finger is on.
//
// `X(s, n)` - THE TIMER-SIDE SWEEP. `C=C+1`, then expire every contact whose
//   stamp is older than `n` calls. `n` IS IN TIMER CALLS AND IT IS THE
//   CALLER'S, not a library constant - see section 5. Callers: EUCLID, STEPS,
//   RADAR POINTS and SONAR (12-08), CHORUS (12-09).
//
// `A(s, i, e, x, y, c, d, h)` - PER-AXIS SEND-ON-CHANGE, per contact, and it is
//   the user's own bench snippet. On live codes (`e<4`) it sends CC `c` = x
//   when x moved and CC `d` = `127-y` when y moved, on channel `h`; a DOWN
//   primes `P[i]` without sending. `127-y` IS THE SNIPPET'S OWN INVERSION -
//   screen y grows downwards and a fader does not - so nobody reads it as a
//   bug. ONE CALLER: LUMEN (12-11), whose two `s:gms` calls are outside every
//   gate today.
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
//   notes sets `R=function(s,i) ... end` in its own Setup, releasing whatever
//   contact `i` held. `E` calls it on every expiry path: an end code, a same-id
//   re-press, a stale-cell press by another contact, and the Timer sweep. ONE
//   CALLER: CHORUS (12-09).
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
// 4. THE DEFECT THE PLAN-CHECK FOUND, AND WHY THE SELF-EXPIRY IS FIRST
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
//
// ---------------------------------------------------------------------------
// 5. WHERE THE RISK IN THE EXPIRY LIVES, AND WHO DECIDES IT
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
// 6. THE COST
// ---------------------------------------------------------------------------
//
// 769 of 908, 139 free - measured under the pinned `GridScript.compressScript`
// after `padReady()`, and a fixed point of it. The raw source below is 770
// (25 + 109 + 56 + 282 + 74 + 150 + 68, joined with six single spaces) and the
// minifier's one edit is the space between `P={}` and `function W`, which is
// why `TOUCH_LIBRARY` is built with that join and no other. The superseded
// sketch, with `F` and its light layer, read 885. `library.spec.ts` measures
// all of it rather than trusting this paragraph.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * The library's state, and the head of the string.
 *
 * `H` cell by contact, `T` last-seen stamp by contact, `C` the Timer counter
 * `X` advances, `P` last (x, y) by contact for `A`. All four are globals
 * because `grid_ui.c:370-383` puts each event body in its own function scope,
 * so a local here would be invisible to every touch Setup.
 *
 * The `--[[@cb]]` marker is the event marker every stored body carries. It is a
 * Lua BLOCK comment, so it costs the string nine characters and the VM nothing.
 */
const HEAD = "--[[@cb]]H={}T={}C=0 P={}";

const W =
  "function W(v,p)if p then local k=(p*128+64)//9 if v-k<11 and k-v<11 then return p end end return v*9//128 end";

const E = "function E(s,i)H[i]=nil T[i]=nil if R then R(s,i)end end";

const Q =
  "function Q(s,i,e,x,y)if e~=1 and e~=4 and e<9 then E(s,i)return end " +
  "local o=e==4 or e>8 if o then E(s,i)end T[i]=C local h=H[i]" +
  "local n=W(x,h and h%9)+W(y,h and h//9)*9 " +
  "if o then for j,g in pairs(H)do if g==n then E(s,j)end end end " +
  "if n==h then return end H[i]=e<9 and n return n end";

const X =
  "function X(s,n)C=C+1 for i,t in pairs(T)do if C-t>n then E(s,i)end end end";

const A =
  "function A(s,i,e,x,y,c,d,h)local p=P[i]or{}if e<4 then " +
  "if x~=p[1]then s:gms(h,176,c,x,0)end " +
  "if y~=p[2]then s:gms(h,176,d,127-y,0)end end P[i]={x,y}end";

const D =
  "function D(n,l,w)local a=glag(0,n)glpfs(a,l,w,250,0)glt(a,l,w//6)end";

/**
 * The library in named parts, which is what makes its cost auditable.
 *
 * The parts are the ONLY copy of the Lua: `TOUCH_LIBRARY` below is built from
 * them, so a part edited here moves the shipped string and the measured cost
 * together and cannot drift from either.
 */
export const LIBRARY_PARTS: readonly {
  readonly name: string;
  readonly lua: string;
}[] = [
  { name: "header and tables", lua: HEAD },
  { name: "W", lua: W },
  { name: "E", lua: E },
  { name: "Q", lua: Q },
  { name: "X", lua: X },
  { name: "A", lua: A },
  { name: "D", lua: D },
];

/**
 * The string written to element 255, event 0. Canonical: a fixed point of the
 * pinned `GridScript.compressScript`, so `cost = max(compressed, raw)` charges
 * exactly its own length and the budget meter is not lying.
 *
 * THE JOIN IS NOT UNIFORM, AND THAT IS THE CANONICAL FORM ITSELF. The head ends
 * `P={}` and the minifier deletes the space before `function W`, because `}`
 * and `f` need no separator; every other seam is `end function`, where two
 * names would otherwise run together. So the head is concatenated and the six
 * functions are joined with single spaces. Joining all seven uniformly gives
 * the planning figure of 770 raw, which compresses to exactly this string -
 * asserted in `library.spec.ts`, not assumed.
 */
export const TOUCH_LIBRARY = HEAD + [W, E, Q, X, A, D].join(" ");

/**
 * The library's own version, IN TYPESCRIPT AND NOT IN THE LUA, because a
 * comment in the string costs real characters out of 908.
 *
 * What it is for: a runtime CONFIG/EXECUTE write does NOT clear `_G`. Firmware
 * runs the new body over the globals the old one left behind
 * (`grid_decode.c:1283-1288`), so a future version that REMOVES a global does
 * not remove it from a module that is already running - only a page load or a
 * power cycle does. A version that only ADDS or CHANGES functions is safe to
 * write over a live module; one that DROPS a name must bump this, and the
 * difference is visible to a reader here rather than discovered on the desk.
 */
export const LIBRARY_VERSION = "1";

/**
 * Every global the library DEFINES, derived from the source at module load and
 * never typed out.
 *
 * Two patterns, because the library defines two kinds of name: `function Q(`
 * for the six functions and `C=0` / `H={}` for the four state tables. A
 * function renamed in the string above moves this list with it, which is what
 * lets `host-surface.spec.ts` admit the library's call sites without a second
 * copy of the list to keep in step.
 */
export const LIBRARY_GLOBALS: readonly string[] = [
  ...new Set([
    ...[...TOUCH_LIBRARY.matchAll(/\bfunction\s+([A-Z])\s*\(/g)].map(
      (m) => m[1],
    ),
    ...[...TOUCH_LIBRARY.matchAll(/\b([A-Z])=/g)].map((m) => m[1]),
  ]),
].sort();

/**
 * The names the library CALLS but does not define - the `R` convention, and
 * only it.
 *
 * `R` is the entry's release function (section 3). `E` calls it behind an
 * `if R then` guard, so a library running under an entry that defines no `R`
 * is correct and silent. It is listed separately from `LIBRARY_GLOBALS`
 * BECAUSE IT IS NOT A DEFINITION: a scanner that derived it from the source
 * would admit any single capital anybody typed. `library.spec.ts` asserts that
 * the single-capital call sites in the string are exactly
 * `LIBRARY_GLOBALS` plus this list, so a seventh function or a second
 * convention cannot arrive unannounced.
 */
export const LIBRARY_CONVENTIONS: readonly string[] = ["R"];
