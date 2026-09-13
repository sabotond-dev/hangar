// THE TOUCH LIBRARY: two strings, thirteen functions, one convention. `TOUCH_LIBRARY` is written
// into the system element's Setup (element 255, event 0) and holds the state and the map -
// `H T C P B L`, `KX KY`, `U W E Q X N`, `self:tim()`; `TOUCH_LIBRARY_TIMER` into the system
// element's Timer (255, event 6) and holds the painters and the senders - `V G Z Y K A D`. Every
// hand-authored entry's touch Setup calls both halves by name, and since 12.1-08b so does every
// preset card's compiled Setup (`K`, `G`, `N`). Both strings are built from `LIBRARY_PARTS`, the
// only copy of the Lua; `library.spec.ts` measures every part. 255/0 is 842 of 908 (66 free),
// 255/6 873 (35 free). The ten headings below are cited by number from other files and stay.
// History: docs/entries/library.md (12-07, 12.1-02, 12.1-03, 12.1-08b: the measurements,
// the one-slot variants, the probe rules' history, the hold-band figures, the cost ladder).
//
// ---------------------------------------------------------------------------
// 1. WHY IT LIVES IN THE SYSTEM ELEMENT, WITH THE FIRMWARE LINES
// ---------------------------------------------------------------------------
//
// `../grid-fw/common/src/lua/init.lua:46-50` runs `ele[#ele]:post_init_cb()` FIRST; on a ZONA
// `ele[#ele]` is the system element, so a global defined in its Setup exists before any touch
// Setup runs, on every page load. `grid_decode.c:1283-1288`: a CONFIG/EXECUTE registers the body
// and runs it IMMEDIATELY, so at install time HANGAR's write order is the init order (255/0 before
// 0/0). `grid_ui.c:370-383` wraps every stored body in its own function scope, so a `local` in
// either string is invisible to the touch Setup - every name here is a plain global - and the
// system element's `self` carries only `gtt gtp get gsen ggen` (`grid_ui_system.c:9-15`), so a
// function that needs the touch element takes it as `s`.
//
// ---------------------------------------------------------------------------
// 2. WHY TWO SLOTS, AND THE ORDER THEY ARE WRITTEN IN (phase 12.1, D-03)
// ---------------------------------------------------------------------------
//
// The gradient does not fit beside the expiry machinery in one slot (every one-slot variant is
// measured in the doc; the smallest was 135 over). The user gave 255/6 as the second slot
// (12.1-CONTEXT D-03), so:
//
//   255/0  system Setup   marker, `H T C P B L`, `KX`, `KY`, `U W E Q X N`, `self:tim()`  842, 66 free
//   255/6  system Timer   marker, `V G Z Y K A D`                                        873, 35 free
//
// THE RULE THAT DECIDES WHICH SIDE A THING LIVES ON: 255/0 holds STATE and THE MAP, 255/6 holds
// THE PAINTERS AND THE SENDERS. `library.spec.ts` test 4 asserts it: every `glp(`, `glc(` and
// `gms(` call site is in 255/6; `KX=` and `KY=` appear in 255/0 only. `N` is the map, so it moved
// to 255/0 in 12.1-08b when `K` joined 255/6. THE JOIN IS ONE CALL: 255/0 ends with `self:tim()`,
// which runs the 255/6 body as the system element's Timer method, so 255/6 is written FIRST and
// the install order is 255/6, 255/0, 0/6, 0/0. The page-load half (the system `ini` calling the
// system `tim` after a power cycle) is supported by source (`init.lua:25-50`,
// `grid_ui_system.c:26`, `grid_protocol.h:876`) and not yet tapped on a module - 12.1-CONTEXT
// D-04's runbook row; its failure signature is `attempt to call a nil value (global 'G')`.
// Slot arithmetic: SLOT-ARITHMETIC.md, 12.1-02-SUMMARY.md, 12.1-08b-SUMMARY.md.
//
// ---------------------------------------------------------------------------
// 3. WHY `G` CARRIES THE COLOUR (D-11) - LAYER 0 IS THE ALERT LAYER
// ---------------------------------------------------------------------------
//
// The finger is drawn on layer 0 everywhere, and layer 0 is the firmware's alert layer:
// `grid_alert_one_set` (`grid_led.c:260-271`) rewrites layer 0's colour and forces its min to 0,
// called on a CONFIG write (`grid_decode.c:1282`), on page-discard completion (`:887`), on a
// refused page change (`grid_lua_api.c:1695`), on a TX overflow (`grid_transport.c:253`) and at
// boot. So `G` TAKES THE COLOUR and re-asserts it with `glc(a,l,r,g,b,1)` on each of its four
// cells on every call; the trailing `1` (`grid_lua_api.c:1062-1100`, the six-argument branch)
// forces the layer's min to 0, so a cell `V` clears is DARK. The peak is fixed at 255.
//
// ---------------------------------------------------------------------------
// 4. THE SIX PROBE RULES, AND WHERE EACH ONE LIVES NOW
// ---------------------------------------------------------------------------
//
// `.planning/phases/12-touch-framework/PROBE-RESULTS-2026-09-10.md`, measured on the user's ZONA:
//   1. Cell hit-testing with hysteresis (Q1, Q2): `W` and `Q`, in calibrated space (section 6).
//   2. A lift is never trusted on its own (Q6.5, Q7): `Q`'s two onset expiry clauses and `X`,
//      all releasing through `E` and the entry's `R`; `E` also darkens the block through `V`.
//   3. Per-axis send-on-change, never on every sample (Q1): `A`.
//   4. Single contact by default (Q6, Q6.5): NOT HERE - the library tracks every contact
//      (`H T P B` keyed by `i`); the rule is the entry's `if i>0 then return end`.
//   5. The finger lights where the firmware thinks it is: `G` (nine hand-authored callers and
//      the compiler's glow) and `K` (the compiler's comets and PINWHEEL's per-finger trail).
//   6. Nothing is built on code 9 (Q3): the onset edge is `e==4 or e>8`, `H[i]=e<9 and n` keeps
//      the harmless handling, and `G` treats a 9 as an end for the drawing.
//
// ---------------------------------------------------------------------------
// 5. THE CONTRACT, FUNCTION BY FUNCTION, WITH EACH ONE'S CALLER
// ---------------------------------------------------------------------------
//
// A function with no caller is not shipped. The unit `U` returns is a 64th of an LED pitch: LED
// `n` sits at `n*64`, the axis runs 0..512, and everything here is integer arithmetic in it.
//
// 255/0 - state and the map:
//   `U(v, k)`        the calibrated axis: raw 0..127 through the nine-knot table `k` (`KX` or
//                    `KY`, rendered from calibration.ts) -> 0..512, piecewise-linear, clamped;
//                    `U(KX[n], KX) == n*64`. Called by `Q`, `Z`, `N` (twice each) and TRACKPAD.
//   `W(u, p)`        one-axis hysteresis: keep LED `p` while `u` is within 45/64 of a pitch of
//                    `p*64`, else the nearest LED `(u+32)//64`. Called by `Q`, twice.
//   `E(s, i)`        expire contact `i`: forget its cell and stamp, clear its block through `V`,
//                    then `R(s, i)` if the entry defined one. Called by `Q` and `X`.
//   `Q(s, i, e, x, y)` the cell a contact is on, when it changed, else nil. An end code (`e~=1
//                    and e~=4 and e<9`) expires the contact and returns nil; on an onset (`e==4
//                    or e>8`) it FIRST expires contact `i` itself (section 7), then stamps
//                    `T[i]=C`, computes the cell with hysteresis on both axes, and expires any
//                    other contact holding the cell landed on; an onset always returns a cell.
//                    Callers: EUCLID, STEPS, RADAR POINTS, SONAR, CHORUS, MORPH, CONSOLE, LUMEN.
//   `X(s, n)`        the Timer-side sweep: `C=C+1`, expire every contact whose stamp is older
//                    than `n` calls; `n` is the CALLER's (section 8). Callers: EUCLID, STEPS,
//                    RADAR POINTS, SONAR, CHORUS.
//   `N(x, y)`        the nearest calibrated cell, no hysteresis, no state:
//                    `(U(x,KX)+32)//64+(U(y,KY)+32)//64*9`. Callers: ARC (the stop tap), GHOST
//                    (the erase key, the comet cell), the vendored compiler's zone and fader
//                    emission under `touchLibrary`.
//
// 255/6 - the painters and the senders:
//   `V(n)`           clear the 2x2 block at origin `n` on layer `L` (phase 0 on its four cells).
//                    Called by `G` and `E`.
//   `G(s, i, e, x, y, l, r, g, b)` the bilinear finger: clears the contact's previous block;
//                    returns on `e~=1 and e~=4` (a 9 is a press AND a lift, so nothing is drawn);
//                    takes the origin and fractions from `Z`, lights `n, n+1, n+9, n+10` at
//                    `255*Y(f,h,d)//4096`, setting the colour on each cell first (section 3);
//                    remembers the block in `B[i]` and the layer in `L`. Linear weights (D-12).
//                    Callers: EUCLID, STEPS, RADAR POINTS, SONAR, CHORUS, MORPH, CONSOLE, LUMEN,
//                    GHOST, and the compiler's `glow` (JOYSTICK, layer 1).
//   `Z(x, y)`        the block: origin `c+q*9` with `c = glim(u//64,0,7)`, `q = glim(v//64,0,7)`,
//                    and the fractions `u-c*64`, `v-q*64` (0..63, or 64 at the far end of the
//                    last segment). Callers: `G` and `K`.
//   `Y(f, h, d)`     one corner's weight, 0..4096: `(64-f or f) * (64-h or h)` for corner `d`.
//                    Callers: `G` and `K`.
//   `K(x, y, l, w, r, g, b)` the decaying bilinear stamp: the same four cells at the same
//                    weights, each a one-shot fade through `D` from `w*Y(f,h,d)//4096` quantised
//                    down to a multiple of 6; a cell whose start is 0 is not written; the colour
//                    set only when `r` is handed. Stateless. `w` is a byte, so `K` shares `D`'s
//                    42-tick ceiling. Callers: the compiler's `comet` (AURORA, STARFIELD, RADAR,
//                    DIAL) and `perFinger` (PINWHEEL) emission under `touchLibrary`.
//   `A(s, i, e, x, y, c, d, h)` per-axis send-on-change, per contact: on live codes (`e<4`) CC
//                    `c` = x when x moved and CC `d` = `127-y` when y moved, on channel `h`; a
//                    DOWN primes `P[i]` without sending. RAW coordinates, not calibrated (D-14).
//                    One caller: LUMEN.
//   `D(n, l, w)`     a decay that lands on phase 0: `glpfs(a,l,w,250,0)` and `glt(a,l,w//6)`;
//                    `w` a multiple of 6, at most 252 (42 ticks). Callers: TRACKPAD and `K`.
//   `R`              A CONVENTION, NOT A FUNCTION THIS LIBRARY DEFINES: an entry that holds notes
//                    or paints layer 0 outside `G` sets `R=function(s,i) ... end` in its Setup;
//                    `E` calls it on every expiry path after the block clear. IT MUST BE
//                    IDEMPOTENT: `Q` expires contact `i` on EVERY onset, a first press included.
//                    Callers: CHORUS, RADAR POINTS, SONAR.
//
// ---------------------------------------------------------------------------
// 6. THE HOLD BAND IS A FRACTION OF THE PITCH, NOT A WIDTH (D-18)
// ---------------------------------------------------------------------------
//
// `W` holds the previous LED while the calibrated coordinate is within 45/64 of a pitch of its
// centre, so in raw units the band is as wide as the local pitch makes it (eight raw values
// between LED 4 and 5 in x, three on the outer segment, six between LED 2 and 3).
// `lua-smoke.spec.ts` asserts the band as a function of the table and prints the width per segment.
//
// ---------------------------------------------------------------------------
// 7. THE DEFECT THE 12-07 PLAN-CHECK FOUND, AND WHY THE SELF-EXPIRY IS FIRST
// ---------------------------------------------------------------------------
//
// FIRMWARE ASSIGNS THE LOWEST FREE CONTACT ID, so after a lost lift the next press is normally
// THE SAME ID; a `Q` that expired only other contacts held the stale cell and returned nil, and
// the press vanished. So on an onset `Q` expires contact `i` BEFORE its cell is computed, and an
// onset always returns a cell. `library.spec.ts` and `lua-smoke.spec.ts` drive the same-id
// sequence first and assert the return value.
//
// ---------------------------------------------------------------------------
// 8. WHERE THE RISK IN THE EXPIRY LIVES, AND WHO DECIDES IT
// ---------------------------------------------------------------------------
//
// The firmware's change gate (`grid_ui_touch_store_input:127-131`) drops repeats, so a finger
// that is perfectly still sends nothing; a real finger wobbles on every sample (Q1) but nothing
// guarantees it. So the window is the caller's argument in `X(s,n)`, never a constant here
// (CHORUS carries 20 calls at 100 ms), and the bench row in 12-12 moves the callers. `Q` stamps
// `T[i]=C` on every live sample, so a wobbling finger keeps its contact alive. Q7's phantoms (a
// palm that keeps jittering) are a hardware finding, not this library's to fix.
//
// ---------------------------------------------------------------------------
// 9. THE COST
// ---------------------------------------------------------------------------
//
// 255/0: 842 of 908, 66 free. 255/6: 873 of 908, 35 free. Both measured under the pinned
// `GridScript.compressScript` after `padReady()`, each a fixed point. The parts of 255/0 are
// 32 + 65 + 126 + 86 + 88 + 294 + 74 + 60 + 10 with eight single-space joins (843 uniform; the
// minifier's one edit is the space between the map's `}` and `function U`); the parts of 255/6
// are 9 + 62 + 221 + 111 + 70 + 176 + 150 + 68 with seven joins (874 uniform; the one edit is the
// space between `]]` and `function V`). That is why each string is built with its head
// concatenated and its functions space-joined. `library.spec.ts` measures all of it.
//
// ---------------------------------------------------------------------------
// 10. THE NAMES
// ---------------------------------------------------------------------------
//
// EVERY NAME IS A SINGLE CAPITAL, WITH EXACTLY TWO EXCEPTIONS - the knot tables `KX` and `KY` -
// because every call site pays the name and no firmware Lua global is a single capital
// (`../grid-fw/common/src/lua/*.lua` grepped for every one of `U W E Q X N V Z Y G K A D`, `KX`,
// `KY`: zero matches; the nearest is `EFN`, three letters).
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

// `return(` with no space: that is the minifier's own fixed point, and the
// research's `return (` was one character the minifier removed - 12.1-02
// measured 713 canonical where the research carried 714 as max(raw, compressed).
// IN 255/0 SINCE 12.1-08b: it is the map, and 255/6 could not hold it beside
// `K` (section 2).
const N = "function N(x,y)return(U(x,KX)+32)//64+(U(y,KY)+32)//64*9 end";

const V = "function V(n)for d=0,3 do glp(glag(0,n+d%2+d//2*9),L,0)end end";

// The block origin and the two fractions, factored out of `G` (12.1-08b) so
// `K` can share them: `c+q*9`, `u-c*64`, `v-q*64` - exactly what `G` computed
// inline until this revision, with the same clamp of the origin to 0..7.
const Z =
  "function Z(x,y)local u,v=U(x,KX),U(y,KY)" +
  "local c,q=glim(u//64,0,7),glim(v//64,0,7)return c+q*9,u-c*64,v-q*64 end";

// One corner's weight, 0..4096: corner `d` of the block is `d%2` columns and
// `d//2` rows from the origin, so its weight is `f` or `64-f` times `h` or
// `64-h`. The linear weights of D-12, unchanged in value from `G`'s inline form.
const Y =
  "function Y(f,h,d)return(d%2>0 and f or 64-f)*(d//2>0 and h or 64-h)end";

const G =
  "function G(s,i,e,x,y,l,r,g,b)L=l local o=B[i]if o then V(o)end " +
  // NOT the live test's `e~=1 and e~=4 and e<9`: a 9 is a press AND a lift in
  // one message, so there is no finger left to draw (12.1-03, section 5).
  "if e~=1 and e~=4 then B[i]=nil return end " +
  // Through `Z` and `Y` since 12.1-08b: identical output at every point
  // (library.spec.ts test 6 holds the 12.1-03 form as a literal and drives
  // both), 131 characters cheaper, and the room is what `K` fits into.
  "local n,f,h=Z(x,y)for d=0,3 do local a=glag(0,n+d%2+d//2*9)" +
  "glc(a,l,r,g,b,1)glp(a,l,255*Y(f,h,d)//4096)end B[i]=n end";

// The decaying bilinear stamp (12.1-08b): the four cells around the finger,
// each started at `w` scaled by its weight, QUANTISED DOWN TO A MULTIPLE OF 6
// (`//6*6`) so `D`'s walk lands every one of them on exactly 0; a cell whose
// quantised start is 0 is not written at all, so a trail is not eaten by a
// finger resting on a neighbour; the colour is set only when one is handed.
const K =
  "function K(x,y,l,w,r,g,b)local n,f,h=Z(x,y)for d=0,3 do " +
  "local z=w*Y(f,h,d)//4096//6*6 if z>0 then local m=n+d%2+d//2*9 " +
  "if r then glc(glag(0,m),l,r,g,b,1)end D(m,l,z)end end end";

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
  { name: "N", lua: N, slot: 0 },
  { name: "the call", lua: CALL, slot: 0 },
  { name: "marker", lua: MARKER, slot: 6 },
  { name: "V", lua: V, slot: 6 },
  { name: "G", lua: G, slot: 6 },
  { name: "Z", lua: Z, slot: 6 },
  { name: "Y", lua: Y, slot: 6 },
  { name: "K", lua: K, slot: 6 },
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
 * spaces. Joining all nine parts uniformly gives 843 raw, which compresses to
 * exactly this string - asserted in `library.spec.ts`, not assumed.
 */
export const TOUCH_LIBRARY =
  HEAD + " " + MAP + [U, W, E, Q, X, N].join(" ") + " " + CALL;

/**
 * The string written to element 255, event 6 - the painters and the senders.
 * Canonical on the same rule: the marker is a block comment and `]]` needs no
 * separator before `function V`, so the marker is concatenated and the seven
 * functions are space-joined. Written to the module BEFORE `TOUCH_LIBRARY`,
 * whose closing `self:tim()` runs this body as the system element's Timer
 * method (section 2).
 */
export const TOUCH_LIBRARY_TIMER = MARKER + [V, G, Z, Y, K, A, D].join(" ");

/**
 * The library's own version, IN TYPESCRIPT AND NOT IN THE LUA (a comment in either string costs
 * characters out of 908). A runtime CONFIG/EXECUTE write does NOT clear `_G`
 * (`grid_decode.c:1283-1288`): a version that only ADDS or CHANGES functions is safe to write
 * over a live module; one that DROPS a name must bump this. Still "1" through 12.1 and 12.1-08b:
 * every name 12-07's library defined (`H T C P W E Q X A D`) is still defined by the pair, so
 * nothing left `_G`.
 */
export const LIBRARY_VERSION = "1";

/**
 * Every global the library DEFINES, across BOTH strings, derived from the
 * source at module load and never typed out.
 *
 * Two patterns, because the library defines two kinds of name: `function Q(`
 * for the thirteen functions and `C=0` / `H={}` / `KX={` for the eight state
 * names.
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
