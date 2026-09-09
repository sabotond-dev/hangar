# Phase 11: Bench Corrections - Research

**Researched:** 2026-09-09
**Domain:** the shipped catalog itself - ZONA Lua configurations, the vendored compiler's descriptor
vocabulary, the firmware LED phase engine, and the thirty-odd files that name a catalog of thirty-six
**Confidence:** HIGH on everything measured against the simulator, the minifier and the firmware C
source. MEDIUM on three per-entry diagnoses where the user's note admits two readings. LOW on nothing
that is stated as fact below; where the evidence stops, the sentence says so.

---

## Summary

Thirty-five of thirty-six entries were tested on real hardware on 2026-09-09. **Four faders was not
tested and this document invents no verdict for it.** QUADRANT and CULL pass as written. SNAKE is
deferred by the user ("not right now") with design notes attached; those notes are recorded here and
acted on by nothing.

Three findings change the shape of the phase.

**First, the decay class bug is real, it is worse than the roadmap states, and its mechanism is not
"the phase stops at 3".** The firmware advances a layer's phase with `ledbuf->pha += ledbuf->fre` on
a `uint8_t` - it **wraps**, it does not clamp and it does not stop - and freezes wherever it happens
to be when the timeout expires. The freeze point is exactly `(start + rate * timeout) mod 256`. With
`start = 255` and `rate = 250` (a step of 6) the walk can **never** reach 0, because `6k` is always
even and 255 is odd. The best any timeout achieves is phase 3; most timeouts freeze the cell
somewhere between 31 and 195. Measured in HANGAR's own simulator: **CHORUS leaves all 81 cells stuck
at up to 126 of 255 forever**, and **MORPH leaves every crossed cell at rgb [47,66,66] at its
shortest trail setting**. Both match the user's words exactly. The same defect is in the **vendored
compiler**, which HANGAR may not edit: every `comet` and `perFinger` trail freezes at phase 3
(residue 1-2 units per crossed cell, permanent) and `bloom` and `disturb` freeze at up to 125. That
is AURORA's "redish glow" and STARFIELD's "colour stucks", and it is not fixable inside `src/vendor/`.

**Second, a class bug the roadmap does not name at all: `e >= 5` swallows the fast tap.** Firmware
coalesces a sub-cycle press-and-lift into ONE message with event code **9 (DOWNUP)** and no separate
DOWN or UP. Five surviving entries write "contact ended" as `e == 3 or e >= 5` with no `and e < 9`
escape, so a fast tap is classified as a lift and **produces nothing at all**. Verified by counting
MIDI messages in the simulator: LATTICE fast tap = **0** messages, slow tap = 2. CHORUS 0 vs 6.
MORPH 0 vs 4. GHOST 0 vs 8. That is LATTICE's "not precise enough" and it is eight characters per
site to fix.

**Third, the removal breaks the facet vocabulary in a way that needs a user decision before any plan
is written.** Removing the nine takes three FOR terms - `play`, `drums`, `clips` - down to **exactly
one entry each**, and `facets.spec.ts` asserts, in its own words, "ZERO SINGLETONS, ASSERTED RATHER
THAN IMPLIED. It is the whole point of a closed vocabulary and it is the one number D-10 was raised
about." There is no way to remove the nine and leave `src/lib/browse/facets.ts` untouched.

**Primary recommendation:** wave the removal first (it closes nine reports outright and shrinks every
later wave's surface from thirty-six entries to twenty-seven), then the two class bugs (which clear
seven more between them at near-zero budget cost), then preset ownership (which unlocks four free
descriptor wins), then the redesigns. Open the phase by putting the facet-vocabulary question to the
user, because it is a taste decision and it blocks the first wave.

---

## Project Constraints (from CLAUDE.md)

These are directives, not preferences. A plan that contradicts one is wrong.

| Directive | Source | How it binds this phase |
|-----------|--------|-------------------------|
| **908 characters per event**, measured with `GridScript.compressScript` | PROJECT.md Budget | Every proposed change is costed below. `cost = max(compressed, raw)`. |
| **Never edit `src/vendor/`** | Licensing / fidelity | Machine-enforced: `src/lib/fidelity/vendored-diff.spec.ts` reconstructs pristine upstream bytes and compares a sha256 against `upstream-manifest.json`. `git diff --stat HEAD -- src/vendor/` is currently **empty**. |
| **Sibling repos are read-only** | Working agreement | `../grid-editor`, `../grid-fw`, `../zona-docs`, `../profile-cloud` were read for this document and not written. No `git checkout/restore/stash/clean` was run in any of them. |
| **HANGAR's Lua host registers 15 globals and 9 `self:` methods, and nothing else** | `src/lib/sim/lua-host.ts:144-171` | Anything outside that list ships unpreviewable. `gln`, `gld`, `glx`, `gmss` are all outside it. |
| GPLv3, no Claude/Anthropic attribution anywhere | PROJECT.md | Every file header this phase touches keeps `Copyright (C) 2026 Botond Sandor`. |
| **Nothing in this phase may be claimed as hardware-verified** | PROJECT.md / user | Everything below was measured in the simulator or read out of firmware C. The user tests hardware personally. |
| Minimalist identity, black + `#D6FF4E`, no emoji | PROJECT.md | Affects any copy this phase writes. |
| Start work through a GSD command; no direct edits | CLAUDE.md | This document changed no source file. |

---

## Phase Requirements

The roadmap records **Requirements: TBD** for Phase 11. Nothing in `REQUIREMENTS.md` is claimed by
this phase, and none of the fifty v1 requirements maps here. That is correct and it is the Phase 10
precedent: this is a correction phase over requirements that earlier phases already closed. The
planner should either extend `CONT-02` / `CONT-03` with qualifiers in the Phase 10 style, or record
explicitly that Phase 11 owns no requirement row.

---

## The thirty-five notes, grouped by root cause

Six classes have a named root cause. Eleven notes are their own problem. Nine are removals.

### Class A - the LED phase never reaches zero (4 live reports, 2 latent sites)

**Named cause.** `grid_led_tick` (`../grid-fw/common/src/c/grid_led.c:190-211`) is three lines:

```c
if (ledbuf->timeout) {
  ledbuf->pha += ledbuf->fre;          /* uint8_t: WRAPS at 256 */
  if (ledbuf->timeout == 1) { ledbuf->fre = 0; }   /* freeze where it landed */
  --ledbuf->timeout;
}
```

`src/vendor/botor/pad-sim.ts:883-891` reproduces it exactly (`L.pha = (L.pha + L.fre) & 255`), so
**the simulator and the firmware cannot disagree here** and the mechanism is HIGH confidence from two
independent sources. The roadmap's "the phase walks down to 3 and stops" is wrong in mechanism and
optimistic in consequence: nothing stops. The freeze point is

> `frozen phase = (start + rate x timeout) mod 256`, and shape 0 renders intensity = phase.

Measured against the real minifier and the real Lua host, one cell painted red on layer 2 with
`glc(a,2,255,0,0,1)`:

| `glpfs(a,2,255,250,0)` + `glt(a,2,T)` | T=10 | 20 | 21 | 28 | 42 | 43 | 60 | 64 | 80 | 100 | 120 | 150 | 255 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| frozen phase | 195 | 135 | 129 | 87 | **3** | 253 | 151 | 127 | 31 | 167 | 47 | 123 | 5 |
| rendered red | 96 | 66 | 63 | 43 | **1** | 125 | 74 | 63 | 15 | 82 | 23 | 61 | 2 |

**There is no timeout that lands on 0 from 255 with step 6.** Parity forbids it.

**The correct idiom, verified empirically at all fifteen divisors of 252 under 256:**
`glpfs(a, l, 252, 256 - 252//T, 0)` + `glt(a, l, T)` renders rgb `[0,0,0]` for
T in {4, 6, 7, 9, 12, 14, 18, 21, 28, 36, 42, 63, 84, 126, 252}, and leaves a residue for every T that
does **not** divide 252 (T=8 -> 1, T=20 -> 5, T=100 -> 25). So the rule is stricter than "the decay
length divides 252": **the timeout must be an exact divisor of 252**, because the emitted step is
`252//T` and the walk lands on `252 - T*(252//T)`.

252 is the right start for the same reason: `252 = 2^2 x 3^2 x 7` has eighteen divisors, against 255's
eight, and 256 cannot be a start because the field is a byte.

**Where the idiom already lives:** `src/lib/catalog/entries/life.ts` writes it as
`glpfs(a,1,252,256-252//@DECAY,0)` - and **LIFE is one of the nine removals.** The idiom must be
carried somewhere before that file is deleted, or the phase throws away the one worked example it has.
`cull.ts` (`256-252//@FLASH`), `switch.ts` (`252,247`) and `slam.ts` (`256-252//@DECAY`) also carry it;
`cull` survives, `switch` and `slam` do not.

**Measured consequences, per entry, in HANGAR's own simulator** (two identical runs, one with a
gesture and one without, compared 25 s later; any latch double-tapped back to its start so a genuine
state change is not counted as residue):

| Entry | Verdict | Evidence |
|---|---|---|
| **CHORUS** | **Catastrophic.** 81 cells frozen at up to 126, at every `@BLOOMRATE` value. | Positive rate on the bloom: freeze = `start + rate*64 mod 256`, and 4, 8, 12 all give `rate*64 = 0 mod 256`, so the bloom freezes at **exactly its opening brightness**. Matches "color stucks after touching it". |
| **MORPH** | **Real.** Touched cell frozen at rgb [47,66,66] (`@DECAY`=20), [10,15,15] (80), [16,23,23] (120), [1,1,1] at the default 42. | Matches "the LED's colors stuck again". The sixteen corner cells also differ, but that is the last blend legitimately held. |
| **AURORA, STARFIELD, RADAR, DIAL, PINWHEEL** | **Real but small, and NOT fixable in HANGAR.** Every cell a finger crosses freezes at 1-2 of 255, permanently. | The **vendored compiler** emits `glpfs(a,1,255,<DECAY_TABLE rate>,0)` at `_pad.ts:1204/1223/2064`, and every one of the twelve `DECAY_TABLE` rows has `step x ticks` in {248, 250, 252, 253, 254}, never 255. Freeze phases 1..7. |
| **EUCLID, SONAR, GHOST** | **Present but invisible.** Both carry the bad literal; both have a Timer that repaints the same cells before the residue accumulates. Measured residue after 25 s: **zero cells**. | Their user complaints are precision, swipe and sync - not stuck colour. Fixing the literal here is correctness hygiene, not a bug fix. |
| **LIFE** | Removed. | - |

**The vendored-compiler half is the hard part and it needs a decision.** The residue for the four
comet cards is not reachable from any knob: every `DECAY_TABLE` row freezes at 1-7. The only escapes
inside the descriptor vocabulary are `touch.kind = "none"` (0 residue, no trail) or
`touch.kind = "glow"` (0 residue, single dot). Measured on the aurora base after a 40-tick drag:

| `touch.kind` | cells left lit forever | max residue | Setup cost |
|---|---|---|---|
| `none` | 0 | 0 | 126 |
| `glow` | **0** | **0** | 304 |
| `comet` | 7 | 1 | 250 |
| `perFinger` | 7 | 1 | 282 |
| `disturb` | 34 | **125** | 311 |
| `bloom` | 79 | **125** | 336 |

**Rule for the planner: a HANGAR-owned preset must never select `bloom` or `disturb`.** They are the
worst cases of the same defect, in code that cannot be repaired.

Whether 1-2 units of residue is what the user saw is a bench question. The magnitude is stated here so
they can answer it in one look.

### Class B - `e >= 5` swallows the fast tap (DOWNUP, code 9) (4 live reports)

**The touch event vocabulary, read out of the vendored simulator and cross-checked against
`../zona-docs`.** `e` is the raw maXTouch T100 event nibble, `status & 0x0f`, forwarded untranslated;
it is not a Grid concept and appears nowhere in Intech's own documentation.

| `e` | Name | Meaning | Confidence (per `../zona-docs/docs/ZONA_REFERENCE.md:670-690`) |
|---|---|---|---|
| 0 | NONE | no event this cycle | INFERRED |
| **1** | **MOVE** | contact moved | **VERIFIED on hardware by the user** |
| 2 | UNSUP | contact un-suppressed | INFERRED |
| 3 | SUP | suppressed by grip/palm rejection | INFERRED |
| **4** | **DOWN** | contact started | **VERIFIED on hardware by the user** |
| **5** | **UP** | contact ended | **VERIFIED on hardware by the user** |
| 6 | UNSUPSUP | un-suppressed and suppressed in one cycle | INFERRED |
| 7 | UNSUPUP | un-suppressed and lifted in one cycle | INFERRED |
| 8 | DOWNSUP | down and suppressed in one cycle | INFERRED |
| **9** | **DOWNUP** | **down and lifted in one cycle - a very fast tap** | INFERRED |

The shipped config has `TCHEVENTCFG = 0x00`, so nothing is disabled and every event type is reported.
Palm messages are dropped before they reach the callback, so a palm produces no callback at all.

**The three guards, and which is correct for what:**

| Intent | Correct guard | Why |
|---|---|---|
| "this contact ONSET" | `e == 4 or e > 8` | 9 is a down with no separate down. |
| "this contact ENDED" | `e == 3 or e >= 5 and e < 9` | 9 both starts and ends; treating it as a plain end throws the onset away. |
| "this contact is LIVE (down or moving)" | `e ~= 1 and e ~= 4 and e < 9 then return` | Lets MOVE, DOWN and DOWNUP through. |
| "act on taps only, not on drags" | `e ~= 4 and e < 9 then return` | Rejects MOVE. |

The vendored simulator states the same rule in its own words at `pad-sim.ts:228-241`, and never
synthesises code 9 for a compiled preset - `touchTap()` is the one path that produces it.

**Verified failures.** MIDI messages produced by a fast tap versus a slow tap on the same cell,
counted in the real Lua host:

| Entry | guard as shipped | fast tap | slow tap | swipe |
|---|---|---|---|---|
| **LATTICE** | `if e==3 or e>=5 then c=nil end` | **0** | 2 | 16 |
| **CHORUS** | `if e==3 or e>=5 then z=nil end` | **0** | 6 | 18 |
| **MORPH** | `if i>0 or e==3 or e>=5 then return end` | **0** | 4 | 84 |
| **GHOST** | `if e==3 or e>=5 then s.h=nil return end` | **0** | 8 | 28 |
| ARC | `if i>0 or e==3 or e>=5 then return end` | 3 | 4 | 14 |

ETCH, FORGE, KEYS, SLAM, SNAKE and QUADRANT already write `e >= 5 and e < 9` (or `e > 4 and e < 9`)
and are correct. So this is not a house convention that was never established - it is a convention
that five files did not follow.

**The fix is eight characters per site**, measured against the pinned minifier:

| Site | before -> after | delta | free after | syntax |
|---|---|---|---|---|
| `lattice.setup` `e>=5` -> `e>=5 and e<9` | 615 -> 623 | **+8** | 285 | accepted |
| `morph.setup` same | 507 -> 515 | **+8** | 393 | accepted |
| `chorus.setup` same | 729 -> 737 | **+8** | 171 | accepted |

**This is the single most reusable finding in the phase, and it deserves a gate.** A spec that scans
every hand-authored entry's Lua for `e>=5` or `e>4` not immediately followed by `and e<9` would make
the class unrepeatable. It is the same shape as `host-surface.spec.ts` (which already classifies
every call site in every entry) and it costs one test.

### Class C - the guard rejects MOVE, so a swipe does nothing (3 live reports)

Distinct from class B: these entries handle the fast tap correctly and simply never look at drags.

| Entry | guard | user's note |
|---|---|---|
| **EUCLID** | `if e~=4 and e~=9 then return end` | "you should be able to add by swiping your finger" |
| **SONAR** | `if e~=4 and e~=9 then return end` | "not precise enough" |
| **STEPS** | `if e~=4 and e<9 then return end` | "same as SONAR or EUCLID" |

Accepting MOVE is not enough on its own: all three **toggle** a cell, and a swipe delivers a MOVE
every 10 ms, so a finger resting inside one cell would toggle it back and forth at 100 Hz. A
per-contact last-cell guard is required. Costed on EUCLID against the minifier:

```
self.q={} ... if e~=1 and e~=4 and e<9 then s.q[i]=nil return end
local m=x*9//128+y*9//128*9 if s.q[i]==m then return end s.q[i]=m
```

EUCLID Setup **702 -> 778 (+76)**, 130 characters free, `checkSyntax` accepts. Affordable. SONAR
(432, 475 free) and STEPS (388, 518 free) have far more headroom.

**CONSOLE is NOT in this class, and the roadmap's grouping is wrong on that point.** CONSOLE already
ships `if e~=1 and e~=4 and e<9 then return end` - it accepts MOVE today, and its fader body already
tracks a swipe. Only its **mute row** is onset-gated (`if e==4 or e>8`). See its own entry below.

### Class D - a value the arithmetic can never emit (2 live reports, 3 latent)

**CONSOLE tops out at 111 of 127 and full scale is unreachable.** Verified by sweeping a finger down
column 4 through the real Lua host and reading the emitted controller values:

```
observed:  0, 15, 31, 47, 63, 79, 95, 111        (8 values, controller 20)
```

Row 0 is the mute strip, so `r` runs 1..8, `h = 8 - r` runs 7..0, and the emitted value is
`h*127//8`, whose maximum is `7*127//8 = 111`. Both readings of the user's "clamp issue in the top
row because its not precise" land on the same fact - the mute row owns the top of the fader's travel,
so the fader has eight steps and cannot reach the top. **Rescaling to `h*127//7` is +0 characters**
(both literals are one digit) and makes the eight steps span 0..127 exactly.

The same family, latent, in the surviving entries: `x*127//128` maps 0..127 onto 0..**126** and can
never emit 127. It is in **LUMEN** (both axes). It was also in HOLD, LEARN and TABLE, all removed.
`x*127//127` would be wrong (it overflows at x=127 only if the coordinate really reaches 127); the
honest form is `x*127//127` guarded, or `glim(x,0,127)` since the coordinate is already 0..127. This
is a small correctness note, not one of the user's complaints - report it, do not necessarily fix it.

### Class E - missing MIDI that is one descriptor field away (3 live reports, all free)

Verified by compiling the mutated state through the vendored compiler and costing it. All three fit
with hundreds of characters to spare:

| Ask | Change | Setup / Timer | free |
|---|---|---|---|
| **AURORA** "send MIDI" | `sends.kind = "xy"`, `sends.fingers = "first"` | 250/55 -> **408/55** | 500 |
| **PINWHEEL** "make this send MIDI" | same | 305/55 -> **463/55** | 445 |
| **STARFIELD** "should send midi" | same | 238/55 -> **396/55** | 512 |
| **NINE PADS** "make it selectable to 4x4" | `sends.grid = "4x4"` | 580/158 -> **550/158** (cheaper) | 358 |

The roadmap says three of the eight preset items need no new behaviour. It is **four**: STARFIELD's
MIDI half is the same free `sends.kind = "xy"` change. Only STARFIELD's stuck colour is hard.

`fingers = "each"` is cheaper still on AURORA (313) and PINWHEEL (368) if per-finger streams are
wanted; `hiRes` costs about 56 more. All four states pass `planLayers` with `sends: true` alongside
`look` and `touch`, so the picture is unchanged - `xy` claims no LED layer.

### Class F - the removals (9 reports, closed by deletion)

HOLD, KEYS, LEARN, SWITCH, ETCH, GRIDLOCK, LIFE, SLAM, TABLE. Full blast radius below.

### The eleven that are their own problem

| Entry | Note | Diagnosis |
|---|---|---|
| **ARC** | "cannot see amplitude need visual feedback... if you press the center it stops, pressing it again resumes, not intuitive enough" | **Named cause for the first half.** The 3x3 heart is painted `glp(...,1,v)` with the **raw** triangle, while the CC is `glim(64+(v-128)*s.d//255,0,127)` - depth-scaled. At the bottom edge `s.d = 127-y = 0`, so the output is pinned at 64 and dead while the heart keeps pulsing at full scale. The picture lies about the amplitude. Scaling the heart to the same value costs **+21** (251 -> 272 Timer, 636 free). **The second half is ambiguous** - see Ambiguities. |
| **GHOST** | "doesn't work reliably... need to redesign this from scratch" | The user asked for a redesign in their own words. No diagnosis needed; note only that GHOST's `e>=5` guard (class B) and its `glt(a,l,42)` (class A) both go away with the redesign, and that GHOST is one of only three surviving `restsBlack` entries, so its `frames.json` row and its demo path in `src/lib/sim/demo.ts:177` are both load-bearing. |
| **SHUTTLE** | "don't understand how it works, rework" | **Ambiguous - see Ambiguities. Do not pick a reading silently.** |
| **STRIP** | "this is just an XY pad, it should be two faders, one crossfader at the bottom and the big one, sending midi independently" | Redesign, and the ask is precise. Note what is being discarded: STRIP today is a **14-bit** fader - the bottom row is a vernier and the two axes combine into one `glim(v*8+f,0,16383)` on mode 1. It already calls `self:txma(1023)self:tyma(1023)`, which is the repository's only worked example of the 10-bit unlock. Two independent faders plus a crossfader is three streams and almost certainly 7-bit each. That is a deliberate trade, not an oversight, and it should be named in the plan. Budget: 638 Setup, no Timer, 270 free. |
| **RADAR** | "should act like a radar, should send note on note off when the sonar wave hits a LED point which a user can add or remove, multiple active points" | **This is SONAR.** That description is SONAR's shipped behaviour almost word for word ("A sweep turns like radar and fires the cells you armed"). RADAR is a compiler-driven card whose `ripple` look plus `xy` sends cannot express user-placed points at all; delivering the ask means writing a second hand-authored Lua entry that duplicates SONAR. **Needs a user decision**, not a plan: retire RADAR, or fold the request into SONAR, or accept two near-identical cards. |
| **JOYSTICK** | "should start from the middle by default and should improve the visual aspect on ZONA, maybe more led animation, trail or something" | **Descriptor-reachable, both halves.** `sends.springTo = "centre"` with `invertY = false` moves `springRestCell` to cell 40 - the dot rests in the middle and is lit from power-on. 535 -> **532**. Adding `touch.kind = "comet"` for a trail: 535 -> **468**, or with a `breathe` look behind it 517. Caution: `comet` is a class-A residue source (1 unit per crossed cell, permanent). `glow` (the shipped kind) leaves zero. The trail is a real trade-off the plan must state, not assume. |
| **DIAL** | "spinning it counter clockwise sends messages too aggressively" | **The simulator says the two directions are exactly symmetric.** Three turns clockwise: 192 messages, all value 65. Three turns counter-clockwise: 192 messages, all value 63. Identical rates at 64 and at 128 samples per turn. The compiler emits **binary-offset** relative CC (64 = zero, 65 = +1, 63 = -1). **Strong hypothesis, MEDIUM confidence:** the user's host is set to *signed-bit* relative mode, in which bit 6 is the sign - 65 reads as -1 (gentle) and **63 reads as +63** (violent), in exactly the one direction reported. This is a one-question bench check ("what encoder mode is the control set to?"). It is **not** descriptor-reachable: `DialMode` offers only `relative` and `absolute`, and the binary-offset convention is hard-coded at `_pad.ts:2043`. Delivering an alternative convention means a hand-authored Lua dial. The `K/2` round-to-nearest bias and the carried residual at `_pad.ts:1932-1998` are symmetric and correct: `DIAL_SENSE_TABLE` is `[256,192,128,96,64,48,32,16]`, every entry even, so `K/2` is exact. |
| **TRACKPAD** | "needs an animation on ZONA" | **Not reachable, on two independent grounds, and this is the hardest of the eight.** (1) `normalisePadState` forces `look.kind` and `touch.kind` to `"none"` for a trackpad state - measured: setting `look.kind="breathe"` and `touch.kind="comet"` produces a state that normalises straight back to `none`/`none` and compiles to the identical 902 characters. Trackpad is `exclusive`. (2) There are **six characters free** (902 of 908; 907 at the worst reachable knob position). Any animation means a hand-authored Lua trackpad, which means re-implementing a 902-character compiled handler that drains the firmware touch queue with `touch_pop`/`tid`/`tev`/`txv`/`tyv`. That is a wave of its own, and it may be an honest "not in this phase". |
| **LUMEN** | "should send HEX in sysex, and the color depth / opacity doesn't work" | **Two separate problems, one of them blocked.** The sysex call is `gmss` (verified, `../zona-docs/docs/ZONA_REFERENCE.md:1241` -> `grid_lua_api.c:905-935`; every argument is one payload byte and you supply `0xF0`/`0xF7` yourself). **`gmss` is not in HANGAR's `HOST_GLOBALS`.** Adding it is a small, well-shaped change to `src/lib/sim/lua-host.ts` - the `recordHid` path that already handles `gmms`, `gmbs` and `gks` is the exact template - plus `HOST_GLOBALS`, `host-surface.spec.ts` and `lua-host.spec.ts`. Without it the entry ships unpreviewable. Second half: `@DEPTH` is 1..4 and `d = 36 - row*@DEPTH` runs 36..4, so the bottom row is 78% of the anchor at DEPTH 1 and 11% at DEPTH 4 and **never black**. "Doesn't work" most likely means the ramp is too shallow to read at the low settings, or that opacity should be an emitted value rather than a picture. Ambiguous - see Ambiguities. Budget: 604 Setup, **no Timer at all**, so 302 + 908 free. This entry has the most room in the catalog for new behaviour. |
| **STAGE** | "Lining up breathing is missing." | **Ambiguous - see Ambiguities.** Note that STAGE already breathes: the live zone at rate 4, the held zone at 24, four corners all armed from phase 0 so they are in phase with each other. Budget: 505/109, 399 free. |
| **POMODORO** | "make a 1 minute and a 5 minute one." | **Free, with one hard rule.** `@MINS` is `["15","20","25","50"]`, reaching one site (`self.n=@MINS*60`). One-digit values are *shorter* than the current two-digit ones, so the budget moves the right way. **The two new values must be APPENDED, never inserted**: `@MINS` is knob index 4 of 5, the stamp encodes one base-32 character per knob **by index**, and inserting at the front would silently re-point every POMODORO link ever shared at a different interval. Verified that the ring arithmetic survives: `m = s.t*32//s.n` at n=60 drains the 32-cell ring in 32 steps of 1.875 s. |
| **CULL**, **QUADRANT** | "good", "its okay" | Nothing to do. Both still get touched by the removal (front-door exclusion list is unaffected; `frames.json` and the count literals are). |
| **SNAKE** | "not right now: pathfinding... follow... one note per movement and a higher pitched note when it eats" | **Deferred by the user. Record, do not act.** The notes belong in a Deferred section of the phase's own documents and in `snake.ts`'s header, nowhere else. Note in passing that SNAKE is the tightest entry in the catalog - Timer **870 of 908, 36 characters free** - so "one note per movement" would not fit in the Timer as it stands. That is a finding, and it is exactly why the deferral is the right call. |

### Clock sync is blocked, and it is blocked twice (4 notes)

EUCLID "MIDI sync the circles", SONAR "include synchronization, clock sync", STEPS "same as SONAR",
RADAR "should act like a radar" - the roadmap groups these as a clock-sync family. Both gates are shut.

1. **The hardware answer is unknown.** `docs/MIDI-IN-PROBE.md` is a written, minifier-checked,
   264- and 328-character pair of probe scripts for exactly this question, and its last line reads
   **"Results: None yet. This probe has not been run."** The document is explicit that `gts` is dead
   on ZONA and `rtmrx_cb` is the only clock route the hardware has, so **"a no on Part B does not send
   that family down a different road; it closes it."**
2. **Even a yes does not unblock the site.** HANGAR's Lua host has no inbound MIDI path of any kind.
   `grxm` is a recorded no-op that discards its slot argument; `midirx_cb` and `rtmrx_cb` appear
   nowhere under `src/`. A clock-locked card would run on a real ZONA and sit motionless in its own
   catalog card. The prerequisite is a synthetic MIDI source and a synthetic clock in `src/lib/sim/`.

The honest plan for this group is: **carry the probe to the user as a hardware row, and plan nothing
that depends on its answer.** The non-sync halves of EUCLID (swipe), SONAR (swipe, note length,
centre lit) and STEPS (swipe) are all independently deliverable.

---

## The removal's blast radius, by file and line

Nine hand-authored entries. Nothing vendored moves, and `git diff --stat HEAD -- src/vendor/` is
empty today and must stay empty.

**Catalog goes 36 -> 27. Hand-authored Lua entries go 27 -> 18. The nine presets are untouched.**

### Deletions

| Path | What |
|---|---|
| `src/lib/catalog/entries/{hold,keys,learn,switch,etch,gridlock,life,slam,table}.ts` | Nine files, 1,910 lines. |

### Edits, with line numbers as of `a17e926`

| File | Lines | What |
|---|---|---|
| `src/lib/catalog/index.ts` | imports 14, 18-22, 30, 34, 37; `CATALOG` members 66, 68-71, 74, 80, 82-83; re-exports 95, 97-100, 103, 109, 111-112 | 27 lines out. |
| `src/lib/catalog/front-door.ts` | `EXCLUDED_FROM_ROW` rows at 94, 102, 106, 110, 114, 126, 150, 158, 162 | **The eight-entry ring itself is untouched** - it is the eight ported presets, and none of the nine is in it. Only the exclusion list shrinks. `front-door.spec.ts` asserts row + exclusions is exactly `CATALOG`, so both sides must move together. |
| `src/lib/catalog/listing.ts` | rows at 318, 340, 353, 366, 379, 418, 492, 516, 531 | Nine `ListingEntry` blocks. `listing.spec.ts` asserts equality with `CATALOG` in **both** directions. |
| `src/lib/catalog/frames.json` | `entries` keys at 517, 581, 613, 645, 677, 773, 965, 1029, 1061 | 36 -> 27 entries. `frames.spec.ts` asserts the fixture covers the catalog exactly and that `nonZeroBytes` agrees with each entry's `restsBlack` in both directions. |
| `src/lib/share/fixtures/wild-stamps.json` | 18 of 54 records name a removed entry | **Hard failure**, not a stale comment: `stamp.spec.ts:399` does `expect(each, "wild-stamps.json names ${record.entry}").toBeDefined()`. |
| `src/lib/share/stamp.spec.ts` | `expect(wild).toBe(27)`, `expect(nulls).toBe(27)` | Both become 18. |
| `src/lib/sim/demo.ts` | `ETCH_PATH` at 224, `DEMO_PATHS.etch` at 258, prose at 6 and 288 | GHOST and MORPH survive; only ETCH's demo path goes. `DARK_BY_CONSTRUCTION` holds only `tpad` and is unaffected. |
| `src/lib/browse/facets.spec.ts` | 99, 169: `expect(LISTING.length).toBeGreaterThan(30)` | Fails at 27. Two sites. |
| `src/lib/og/build.spec.ts` | 220: `expect(wanted.length).toBeGreaterThanOrEqual(36)` | Fails at 27. The comment already anticipates this: *"a number a person chose has to be re-chosen when the catalog shrinks past it."* |
| `e2e/artifacts.e2e.ts` | 73: `expect(ROUTED.length).toBeGreaterThanOrEqual(36)` | Same, same comment. |
| `src/lib/catalog/audition.spec.ts` | 52: `const ROW_COUNT = 32` | Nine of the thirty-two checklist rows name a removed entry (13, 15, 16, 17, 18, 21, 27, 29, 30). Becomes 23, and the doc renumbers. |
| `docs/HARDWARE-AUDITION.md` | cost table rows 88, 90-93, 96, 102, 104-105; prose at 18, 43, 47, 73-75, 109-117, 142, 159; checklist rows 187, 189-192, 195, 201, 203-204 | Nine table rows, nine checklist rows, a renumber from 32 to 23, and five prose lists. **This is the single largest edit in the removal.** |
| `docs/TESTING.md` | 20, 27, 41, 64, 72, 87, 89, 129-132, 373, 399, 408, 665, 1037 | Prose counts: "thirty-six configurations, twenty-seven of them hand-authored", the sweep's 701 combinations, the OG pixel budget, the restsBlack triple ("ghost, morph and etch"), and `static/og/` at 36 files. Not load-bearing, but wrong. |
| `src/lib/browse/facets.ts` | see below | **The real decision.** |

### Safe by construction (verify, do not edit)

| Concern | Why it is safe |
|---|---|
| Prerendered routes | `src/routes/c/[id]/+page.ts` `entries()` maps `LISTING`. Nine pages simply stop being generated. |
| OG images | `scripts/gen-og.mjs` does `rmSync(OUT_DIR, {recursive:true, force:true})` before writing, explicitly so "an id that leaves the routed set cannot leave a stale picture behind". `static/og/` is gitignored. |
| The sweep gate | `lua-entries.sweep.spec.ts` is count-agnostic (`> 0`, and its total is derived as `combined * EVENTS.length`). Only its header prose ("45 colour knobs across 25 of the 27") goes stale. After removal: **29 colour knobs across 16 of 18 entries**, total knobs 133 -> 91. |
| Browse e2e | Every count is `LISTING.length` or derived from `frames.json`. |
| `knobs.lua.spec.ts:56,145` | Counts knob mappings (91 after removal), not entries. Stays above 30. |
| `session-copy.spec.ts:394`, `instrument.spec.ts:611`, `og/png.spec.ts:233` | Count strings and source files, not catalog entries. |
| `catalog.spec.ts` `PRESETS.length === 9` | The nine presets do not move. |

### The facet vocabulary - a singleton problem, and a worked way out

`facets.ts` declares a closed sixteen and `facets.spec.ts` enforces two health rules plus an explicit
zero-singleton assertion. Computed over the real listing:

| FOR term | now (36) | after (27) | verdict |
|---|---|---|---|
| modulation | 9 | 7 | ok |
| show | 5 | 5 | ok |
| keys | 3 | 2 | ok (at the floor) |
| mixing | 3 | 3 | ok |
| sequencing | 3 | 3 | ok |
| shortcuts | 3 | 2 | ok (at the floor) |
| pointing | 3 | 2 | ok (at the floor) |
| **play** | 3 | **1** | **SINGLETON** - snake only |
| **drums** | 2 | **1** | **SINGLETON** - ninepads only |
| **clips** | 2 | **1** | **SINGLETON** - stage only |

| FEELS term | now | after | rule 6..18 |
|---|---|---|---|
| readable | 16 | 11 | ok |
| expressive | 14 | 11 | ok |
| playable | 13 | 8 | ok |
| generative | 13 | 12 | ok |
| precise | 8 | **6** | ok, **exactly at the floor** |
| still | 8 | **6** | ok, **exactly at the floor** |

The nine carry these tags away: hold (modulation, expressive, readable), slam (drums, playable,
expressive), keys (keys, playable, readable), gridlock (clips, playable, readable), table (modulation,
expressive, precise), learn (pointing, precise, readable), switch (shortcuts, readable, still), etch
(play, playable, still), life (play, generative, playable).

**Three options, and this is a user decision, not a planner decision:**

- **(a) Retire two FOR terms and re-home two entries.** Retire `drums` and `clips`; move ninepads to
  `play` and stage to `shortcuts`. Result: modulation 7, show 5, mixing 3, sequencing 3, shortcuts 3,
  keys 2, pointing 2, play 2 - **eight terms, every one at two or more, sums to 27**. Costs three
  literals in `facets.spec.ts` (`toHaveLength(10)` -> 8, `(6)` -> 6, `(16)` -> 14), the two entries'
  `tags` in both `listing.ts` and `ported.ts`/`stage.ts`, a re-sort of `FOR_TERMS` into its documented
  descending order, and two rows of `LEGACY_TAG_MAP` (`clips: "clips"` and `drums: "drums"` need new
  targets; `game: "play"` is fine).
- **(b) Retag three entries so each singleton gains a partner.** Cheaper in files, but it means giving
  a card a FOR term that is not the truest thing about it, which is precisely what D-10 forbade.
- **(c) Change the rule.** Lower the floor to one. Explicitly rejected by the spec's own prose ("a
  term matching one card is a thing the search field does better").

**(a) is the recommendation.** It is the only one that keeps D-10's argument intact.

Also note: `precise` and `still` land at exactly six after the removal. **A tenth removal in any later
phase breaks a FEELS rule.** Write that down where whoever proposes one will see it.

### Live-user state that survives the deployment

The removal is a migration in one respect that no file grep finds.

| Category | Found | Action |
|---|---|---|
| **Stored data** | None. No database, no local storage of catalog state. Verified: no ChromaDB, Mem0, Redis, SQLite anywhere in the tree. | None. |
| **Live service config** | **Shared links in the wild.** Every `/c/hold/#z.x...` URL a visitor ever copied 404s the moment this deploys. Nine ids stop resolving. `src/routes/c/[id]/+page.ts` already handles an unknown id gracefully (`index` is -1 and the page renders the shelf centred on its first entry rather than dead-ending) but only for ids that still generate a page; a removed id generates **no page at all** and adapter-static falls through to `404.html`. **Decide deliberately whether that is acceptable**, and if not, the fix is a prerendered stub or a `_redirects`-style rule at the Worker. | Decision required. |
| **OS-registered state** | None. No scheduled tasks, no services, no pm2. | None - verified by absence of any registration in `scripts/`. |
| **Secrets / env vars** | None touched. `BOTOR_REPO` is the only env var any spec reads (`format-parity.spec.ts:45`) and it names a sibling path, not a catalog entry. | None. |
| **Build artefacts** | `static/og/` (gitignored, rebuilt from empty by `gen-og.mjs`), `build/`, `.svelte-kit/`. Nine stale PNGs on a dirty working tree; zero after any `npm run build`. The **deployed** artifact keeps serving nine images until the next `wrangler deploy`. | Redeploy. |

---

## Preset ownership: the cheapest honest mechanism, and what it costs

### What is true today

The nine are built by a module-private `preset()` factory at `_pad.ts:4189-4211` and exported as
`PRESETS` (`:4214`) and `presetById` (`:4386`). `PadPreset` carries `id`, `name`, `sentence`,
`category`, `knobs: KnobKind[]`, optional `exclusive`/`quiet`, `state: PadState`, and a declared
`cost`. `ported.ts:96` reads `name` and `sentence` through `presetById` **precisely so a BOTOR
re-sync cannot silently disagree**.

Six runtime readers, not counting specs:

| Site | Reads |
|---|---|
| `src/lib/catalog/entries/ported.ts:96` | `name`, `sentence` |
| `src/lib/pad/index.ts:60` (`compilePreset`) | `state` |
| `src/lib/pad/index.ts:41` | re-exports `PRESETS`, `presetById` to the rest of HANGAR |
| `src/lib/sim/engine.ts:120` | `state` for the preview |
| `src/lib/tune/state.ts:112` | `state`, cloned per tune session |
| `src/lib/tune/knobs.preset.ts:730` | `knobs` (the kind list) **and** the shipped `state` (every knob default is derived from it and throws at import time if the value is not in its own option list) |

Plus eight spec files, `scripts/capture-preset-baseline.mjs`, and two committed fixtures.

### The recommended mechanism

**A new `src/lib/catalog/presets.ts` that re-declares the nine, importing only TYPES and pure helpers
from the vendored module.** The vendored `PRESETS` array stays exactly where it is and is never
touched.

```
import {
  defaultState, normalisePadState,
  type PadPreset, type PadState, type KnobKind,
} from "../../vendor/botor/_pad";
```

All three of `defaultState`, `normalisePadState` and the `PadPreset` type are already exported, so
HANGAR reimplements only the twenty-line private factory: `defaultState()` -> apply the mutator ->
`state.preset = id` -> `normalisePadState(state)`. `PadPreset` and `PadState` **stay vendored** -
HANGAR owns the nine *values*, never the shapes.

Then flip the six runtime readers from `../../vendor/botor/_pad` to `$lib/catalog/presets`.

### What it costs, honestly

| Cost | Detail |
|---|---|
| **A new module of ~160 lines** | Nine `preset(...)` calls with their mutators, plus the factory. The mutators are short: Aurora's is empty, Pinwheel's is three lines, the longest (Joystick) is nine. |
| **Nine re-measured `cost` declarations** | `PadPreset.cost` is asserted against the compiler's own output. Measured today, for the record: aurora 250/55, pinwheel 305/55, starfield 238/55, radar 438/55, joystick 535/24, ninepads 580/158, faders 513/24, dial 646/55, tpad 902/146. Every one matches its declaration exactly. HANGAR's edited nine need new numbers. |
| **`knobs.preset.spec.ts:108` must be repointed** | It compares HANGAR's knob **kinds** against `presetById(id).knobs`. If it keeps reading the vendored shelf, adding a `count` knob to ninepads for the 3x3/4x4 switch goes red for the wrong reason. The gate compares deduped kind *sets*, not counts, so there is no four-knob cap to break. |
| **`front-door.spec.ts:303` must be repointed** | It asserts the row's `quiet` line is byte-equal to `PadPreset.quiet` on the shelf. |
| **THE TWO FIDELITY FIXTURES MUST KEEP READING THE VENDORED NINE** | `src/lib/fidelity/preset-baseline.json` was captured **by running BOTOR's own compiler in BOTOR's own tree at the pinned commit**, and its spec's header says a mismatch is *"a STOP-and-report, never a fixture edit (D-08): the fixture is the original's behaviour, and the copy is what is on trial."* `golden-frames.json` is the same shape for simulator frames. **These specs must continue to import `PRESETS` from `src/vendor/`.** They stop being the catalog's gate and become purely the port's gate, which is what they always actually were. HANGAR's nine are covered instead by `src/lib/catalog/frames.json`, which already carries a row per catalog entry. |
| **`scripts/capture-preset-baseline.mjs`** | Reads `pad.PRESETS` with `EXPECTED_PRESET_COUNT`. Unchanged - it captures the vendored shelf, which is the point. |

### The guarantee that changes shape, and what replaces it

Today's guarantee is narrow: **two strings** (`name`, `sentence`) are read through rather than
restated, so a BOTOR rename shows up. Once HANGAR owns the values, that read-through is gone.

**The replacement is a divergence spec, and it is strictly stronger than what it replaces.** A new
`src/lib/catalog/presets.spec.ts` that, for each of the nine, diffs HANGAR's `PadPreset` against the
vendored one field by field and fails on any difference **not listed in an explicit
`INTENDED_DIVERGENCE` table with a reason**. Same shape as `EXCLUDED_FROM_ROW` in `front-door.ts`,
same shape as the `deltas` array in `upstream-manifest.json`. It holds `id`, `name`, `sentence`,
`category`, `knobs`, `exclusive`, `quiet` **and the whole of `state`**, where today only two strings
are held. A BOTOR re-sync that renames a card, adds a knob kind or changes a colour still goes red and
still names the card; the difference is that HANGAR now has to *say* which divergences are on purpose.

That is the honest trade and it should be written into the plan in those words.

---

## Per-entry budget headroom

Measured against the pinned `@intechstudio/grid-protocol@1.20260825.1135` minifier, cost =
`max(compressScript(lua).length, lua.length)`, budget 908 per event. "Worst" is the maximum over
varying each knob one at a time from the defaults; the full cross-product is bounded by the same
corners the sweep gate measures.

### The eighteen surviving hand-authored entries

| Entry | Setup (default) | Setup (worst) | **Setup free** | Timer (default) | Timer (worst) | **Timer free** | knobs |
|---|---|---|---|---|---|---|---|
| **quadrant** | 835 | 838 | **70** | 0 | 0 | 908 | 4 |
| **console** | 785 | 787 | **121** | 0 | 0 | 908 | 5 |
| **pomodoro** | 733 | 735 | **173** | 647 | 649 | **259** | 5 |
| **chorus** | 729 | 731 | **177** | 173 | 174 | 734 | 6 |
| **forge** | 716 | 719 | **189** | 373 | 376 | **532** | 5 |
| **euclid** | 702 | 704 | **204** | 218 | 220 | 688 | 6 |
| **shuttle** | 663 | 663 | **245** | 201 | 201 | 707 | 6 |
| **strip** | 638 | 642 | **266** | 0 | 0 | 908 | 5 |
| **lattice** | 615 | 617 | 291 | 171 | 172 | 736 | 6 |
| **lumen** | 604 | 606 | 302 | 0 | 0 | 908 | 4 |
| **snake** | 581 | 581 | 327 | **870** | **872** | **36** | 5 |
| **cull** | 564 | 565 | 343 | 0 | 0 | 908 | 4 |
| **stage** | 505 | 509 | 399 | 109 | 109 | 799 | 4 |
| **morph** | 507 | 508 | 400 | 0 | 0 | 908 | 5 |
| **sonar** | 432 | 433 | 475 | 279 | 281 | 627 | 5 |
| **steps** | 388 | 390 | 518 | 251 | 253 | 655 | 6 |
| **arc** | 379 | 381 | 527 | 251 | 252 | 656 | 5 |
| **ghost** | 305 | 307 | 601 | 333 | 335 | 573 | 5 |

**Read this before designing anything.** The three entries the user asked most of - CONSOLE (three
separate requests), CHORUS and EUCLID - are the three tightest Setups in the catalog after QUADRANT,
which needs nothing. **SNAKE's Timer has 36 characters free**, which is the phase's clearest example
of a request that cannot fit; the user deferring it is fortunate rather than merely convenient.

### The nine presets, compiled

| Preset | Setup | Timer | Setup free | knob kinds |
|---|---|---|---|---|
| **tpad** | **902** | 146 | **6** (907 at the worst reachable knob position, so **1**) | feel, amount |
| dial | 646 | 55 | 262 | note, feel, mode, amount |
| ninepads | 580 | 158 | 328 | colour, note, scale, amount |
| joystick | 535 | 24 | 373 | colour, note, bend, spring |
| faders | 513 | 24 | 395 | note, amount |
| radar | 438 | 55 | 470 | colour, speed, note |
| pinwheel | 305 | 55 | 603 | colour, speed, count |
| aurora | 250 | 55 | 658 | colour, speed, direction, size |
| starfield | 238 | 55 | 670 | colour, feel |

---

## Costed candidate fixes

Every row below was rendered at the entry's defaults, patched, and re-measured through the real
minifier. `checkSyntax` accepted all of them. These are *illustrative costings for planning*, not
proposed patches - the planner designs the real ones.

| Change | Entry.event | before -> after | delta | free after |
|---|---|---|---|---|
| Decay lands on 0: `255,250` + `glt 42` -> `252,247` + `glt 28` | sonar.timer | 279 -> 279 | **+0** | 629 |
| Same | ghost.timer | 333 -> 333 | **+0** | 575 |
| Decay parameterised on the trail knob: `252,256-252//@TRAIL` | euclid.timer | 218 -> 213 | **-5** | 695 |
| DOWNUP escape: `e>=5` -> `e>=5 and e<9` | lattice.setup | 615 -> 623 | +8 | 285 |
| Same | morph.setup | 507 -> 515 | +8 | 393 |
| Same | chorus.setup | 729 -> 737 | +8 | 171 |
| CONSOLE full scale: `h*127//8` -> `h*127//7` | console.setup | 785 -> 785 | **+0** | 123 |
| CONSOLE muted faders inert | console.setup | 785 -> 790 | +5 | 118 |
| ARC amplitude visible in the heart | arc.timer | 251 -> 272 | +21 | 636 |
| EUCLID swipe-to-toggle with a per-contact cell guard | euclid.setup | 702 -> 778 | +76 | 130 |
| 10-bit unlock `self:txma(1023)self:tyma(1023)` | lattice.setup | 615 -> 645 | +30 | 263 |

**A warning on the EUCLID `@TRAIL` knob.** Parameterising the decay on `@TRAIL` requires every value
to be a divisor of 252. The shipped values are `["21","42","64","100","150"]`; 21 and 42 qualify, 64,
100 and 150 do not. The nearest legal set is `["21","42","63","84","126"]`. Changing a knob's
**values** (not its arity) keeps every shared link decodable - the stamp encodes an *index* - but
silently changes what an existing link renders. `stamp.spec.ts` compares indices and would stay green.
**Say so in the plan.**

**A note on the 10-bit unlock, because it is the obvious wrong answer to "not precise enough".** The
firmware already reports 0..127 by dividing the native 0..1023 by 8. For a nine-cell grid each column
is 14.22 units wide, so the 7-bit quantisation determines a column boundary to within about 0.07 of a
cell. Unlocking 10 bits improves that to 0.009 of a cell - imperceptible. **Coordinate resolution is
not the precision problem for any cell-grid entry.** It matters only for continuous output (STRIP
already uses it for 14-bit). Do not spend budget on `txma`/`tyma` for LATTICE, EUCLID, FORGE or
CONSOLE expecting it to answer the complaint.

---

## Ambiguities the planner must not resolve silently

Four notes admit two readings that produce different work.

### SHUTTLE - "don't understand how it works, rework"

SHUTTLE is a hold-to-scrub video jog: press left of centre for reverse, right for forward, distance
from centre sets speed, **lift stops the transport**. A sixteen-cell ring shows the speed as an arc.
`shuttle.ts:80-92` records the lift-stops behaviour as a **deliberate design decision** with two
reasons: a latching speed is "a video that scrubs forever and can only be stopped by touching the
exact centre column", and a DOWNUP tap arrives with no lift behind it, so a tap that set a speed could
never be cleared by the same gesture that set it.

- **Reading 1 - discoverability.** The behaviour is right and unreadable. Nothing on the pad says
  which side is which, where zero is, or that lifting stops it. Work: a visual redesign - a centre
  marker, direction colour, a resting cue - plus card copy. Fits comfortably in 245 free characters.
  No behaviour change, no decision reversed.
- **Reading 2 - the gesture is wrong.** The user wants a latching shuttle. Work: reverse a documented
  decision, re-solve the DOWNUP problem it names, and re-argue the "scrubs forever" objection.

**Ask.** These are not the same phase's work.

### ARC - "if you press the center it stops, pressing it again resumes"

The amplitude half is diagnosed above and is unambiguous. This half is not: **ARC has no stop, no
resume, and no toggle anywhere in its source.** `s.r = 1 + x*31//127` is at least 1 for every x, so
the oscillator cannot reach rate 0. Two readings:

- **Reading 1 - "stops" means "the output goes flat".** At the bottom edge `s.d = 127 - y = 0` and
  the CC pins at 64 while the heart keeps pulsing at full scale. That is the same defect as the
  amplitude complaint and one fix answers both. Consistent with the words "pressing it again resumes"
  if the second press was higher up the pad.
- **Reading 2 - the user observed something on hardware the simulator does not reproduce.**

**Ask, and note it as a hardware row either way.**

### STAGE - "Lining up breathing is missing."

STAGE already breathes: `Z(z, f)` arms `glpfs(a,1,0,f,3)` on all four corners of a zone from phase 0,
live at rate 4 and held at 24, refreshed every 2560 ms by the Timer.

- **Reading 1 - broadcast "lining up".** A preview/standby zone - the scene you are *about to* cut to
  - has no indication at all. The card has live and held; the user wants a third state that breathes.
  Real feature work, and 399 characters free.
- **Reading 2 - the four corners breathe out of step.** Read against the source they do not: all four
  are armed from phase 0 in the same call. If the user saw them drift, that is a hardware finding.

**Ask.**

### LUMEN - "the color depth / opacity doesn't work"

The sysex half is unambiguous and blocked only on `gmss` reaching the Lua host.

- **Reading 1 - the ramp is too shallow.** `d = 36 - row*@DEPTH` bottoms out at 78% of the anchor at
  DEPTH 1 and 11% at DEPTH 4, never black. Turning the knob at the low settings changes very little.
  Work: re-cut `@DEPTH`, possibly to reach black.
- **Reading 2 - opacity should be an emitted value.** LUMEN sends only raw X and Y on `@CC` and
  `@CC+1`; a lighting desk receives a position, not a colour and not an intensity. Work: a third
  stream, or the hex-over-sysex change makes it moot.

**Ask.**

### RADAR - a request that collides with an existing card

Not an ambiguity in the note; an ambiguity in what to do about it. The user's RADAR description is
SONAR's shipped behaviour. **Retire RADAR, fold the request into SONAR, or accept two near-identical
cards** - a product decision.

---

## Don't hand-roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| A fade that ends at black | A per-tick Lua countdown that writes `glp` | `glpfs(a, l, 252, 256 - 252//T, 0)` + `glt(a, l, T)` with **T an exact divisor of 252** | Firmware runs the ramp for free. A Lua countdown costs a Timer pass per cell per tick and cannot beat the LED engine. |
| Deciding "did this contact end" | A per-entry re-derivation | `e == 3 or e >= 5 and e < 9` | Five entries got this wrong. See class B. |
| Deciding "did this contact start" | `e == 4` alone | `e == 4 or e > 8` | Code 9 is a down with no separate down. |
| Coordinate -> cell | Anything but `x*9//128` | `x*9//128` | The `x*8//127` form drifts a crosshair. **Verified absent from every entry in the catalog.** |
| Measuring a configuration's cost | `lua.length` | `max(GridScript.compressScript(lua).length, lua.length)` via `measureLua` / `costOf` | Comments are not stripped; a raw form can be longer than its compressed form and the compiler charges the max. |
| Waiting for the minifier | Calling `compressScript` directly | `await padReady()` first, always | `compressScript` **throws** and `checkSyntax` **silently returns false** before `initLuaFormatter()` resolves. A gate that skipped it would report every correct configuration as broken. |
| Re-declaring which touch codes mean what | New prose in a new file | `../zona-docs/docs/ZONA_REFERENCE.md` s4.6 and `pad-sim.ts:228-241` | Two existing statements of the same table. A third will drift. |
| Fixing the comet residue | Editing `src/vendor/botor/_pad.ts` | Choose `glow` or `none`, or hand-author the card | Machine-enforced by `vendored-diff.spec.ts` against a sha256 manifest. |
| Restating catalog counts | A new literal | `LISTING.length`, `ROUTED`, `CATALOG.length`, or `frames.json` | Four literals already have to be re-chosen by this phase. Do not add a fifth. |

---

## Common pitfalls

### Pitfall 1: assuming the LED phase clamps at zero

**What goes wrong:** a decay is designed by picking a pleasing start and rate and a timeout that
"looks about right", and the cell freezes lit forever.
**Why:** `pha` is `uint8_t` and `+=` wraps. Nothing clamps and nothing stops.
**How to avoid:** compute `(start + rate*timeout) mod 256` before writing the call, and require it to
be 0. Start from 252 and pick a timeout that divides it.
**Warning sign:** a `glt` value that is not a divisor of the start.

### Pitfall 2: `e >= 5` as "ended"

**Warning sign:** the string `e>=5` or `e>4` in an entry's Lua without `and e<9` immediately after.
Grep-able, gate-able, and five surviving entries fail it today.

### Pitfall 3: a keeper timeout on a decaying layer

`glt(a, l, 65535)` beside a fast decay rate replaces the countdown and the cell strobes forever.
`src/lib/sim/lua-smoke.spec.ts` test 3 already guards it (signature: near-maximum timeout together
with a rate at or above 200). **The legitimate keeper form exists too** - ARC and POMODORO both carry
one deliberately with capitalised "do not fix" notes in their headers. Read the note before touching
either.

### Pitfall 4: `gtt(index, 0)` never fires

A Timer that re-arms itself with period 0 does not run fast; it stops, silently, with the picture
still showing whatever the last frame was. Any computed period needs a `math.max(...,1)//1` floor.
SHUTTLE already carries one for exactly this reason.

### Pitfall 5: inserting a knob value

Knob positions are stamp payload. Inserting a value re-points every shared link that carries an index
at or above it, and no test catches it because `stamp.spec.ts` compares indices. **Append only**, and
if a value set must be re-cut (EUCLID's `@TRAIL`), say so in the plan.

### Pitfall 6: regenerating `frames.json` before the removal lands

Every fixture that is keyed by catalog id - `frames.json`, `static/og/`, the wild-stamps fixture -
gets regenerated once per wave that changes an entry's appearance. Removing first means regenerating
27 rows once instead of 36 rows twice.

### Pitfall 7: the `glt` 65535 ceiling is 655 seconds

POMODORO's header says it in capitals: a 25-minute interval is 1,500 seconds and the inner breathe
would freeze twice inside one pomodoro if the Timer did not re-issue `glpfs` **and** `glt` every 300
seconds. Re-arming with `glt` alone will not restart it, because the rate has already been zeroed.
Any long-running card this phase writes inherits that.

### Pitfall 8: a Setup-only entry still classifies as animated

For a Lua entry the engine reports `host.animating || host.timerArmed`, so any entry with a stored
Timer classifies as `animated` whatever its picture is doing. `front-door.ts` says motion must never
be "guessed or aspirational". A redesign that adds or removes a Timer moves an entry's declared motion
and `frames.json` proves it in both directions.

---

## Recommended wave order

Reasoning first, then the order.

**The removal leads on three independent grounds, and the third is the strongest.** (1) It closes nine
of thirty-five reports outright - more than any other single change. (2) It shrinks every later wave's
surface from thirty-six entries to twenty-seven and from twenty-seven Lua entries to eighteen, which
is a real saving in the sweep gate, the frames fixture and the OG build. (3) **It is the only change
that must precede the fixture regenerations**, because `frames.json`, `static/og/` and the wild-stamps
fixture are all keyed by catalog id and would otherwise be regenerated twice.

Its one blocker is a taste decision, so the phase opens by asking.

| Wave | What | Clears | Why here |
|---|---|---|---|
| **0** | **Put the questions to the user.** The facet-vocabulary option (a/b/c). SHUTTLE's two readings. ARC's second half. STAGE's two readings. LUMEN's two readings. RADAR-versus-SONAR. Whether nine dead `/c/<id>/` links matter. And hand over `docs/MIDI-IN-PROBE.md`, which has never been run. | - | Every one of these blocks a plan, and none of them is a planner's call. |
| **1** | **The removal.** Nine files deleted; `index.ts`, `front-door.ts`, `listing.ts`, `frames.json`, `wild-stamps.json`, `demo.ts`, `audition.spec.ts`, `facets.ts` + spec, the four re-chosen count literals, `docs/HARDWARE-AUDITION.md` (32 -> 23 rows, renumbered), `docs/TESTING.md`. | **9 reports** | Above. |
| **2** | **The two class bugs.** Class A (decay lands on zero) at CHORUS, MORPH, EUCLID, SONAR, GHOST + the `life.ts` idiom rescued into a comment that survives. Class B (DOWNUP escape) at LATTICE, CHORUS, MORPH, ARC, GHOST. **Add the two gates** - a spec that fails on a `glt` timeout that does not divide its `glpfs` start, and a spec that fails on `e>=5` without `and e<9`. | **~7 reports** (CHORUS, MORPH, LATTICE, and the honest half of AURORA/STARFIELD) | Highest ratio of reports cleared to characters spent: +0 to +8 per site. The gates are what stop wave 4's redesigns re-introducing both. |
| **3** | **Preset ownership**, and the four free descriptor wins it unlocks: AURORA `xy`, PINWHEEL `xy`, STARFIELD `xy`, NINE PADS 4x4, plus JOYSTICK's centre rest and trail. Includes the divergence spec that replaces the read-through guarantee, and repointing the six runtime readers while the two fidelity fixtures stay on the vendored nine. | **5 reports** | Cross-cutting but mechanical, and every one of its behaviour changes is already measured to fit. Doing it after wave 2 means the residue trade-off for JOYSTICK's trail is decided with the class-A numbers in hand. |
| **4** | **Per-entry corrections that need no redesign.** CONSOLE (full scale +0, muted faders inert +5, mute row accepts a swipe). EUCLID/SONAR/STEPS swipe-to-toggle with the per-contact cell guard. ARC amplitude. POMODORO's two appended intervals. SONAR's centre always lit and note length. | **~8 reports** | All costed, all fit, none depends on a decision. |
| **5** | **The redesigns.** GHOST from scratch. STRIP as two faders plus a crossfader. SHUTTLE, per the answer from wave 0. LUMEN's `gmss` host addition + hex sysex. | **4 reports** | Largest and least certain. `gmss` touches `src/lib/sim/lua-host.ts`, `HOST_GLOBALS`, `host-surface.spec.ts` and `lua-host.spec.ts` - a contained change with an exact template in `gmms`/`gmbs`/`gks`. |
| **6** | **Record what cannot be done in this phase.** DIAL's encoder convention (needs a hand-authored dial, and first a one-question bench check). TRACKPAD's animation (blocked twice: `normalisePadState` strips it, and six characters free). The clock-sync family (blocked on the un-run probe *and* on a simulator that has no MIDI in). RADAR per wave 0. SNAKE's deferral with its design notes. Four faders **untested**. | 0, honestly | A phase that quietly drops six requests is worse than one that names them. |

**Lead with the removal.** If a single behavioural change has to lead instead, it is class A - it is
the named cause behind four reports and it costs zero to eight characters a site.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | yes | v24.14.0 (`engines: >=24`) | - |
| Vitest | unit + sweep gates | yes | 4.1.11 | - |
| Playwright | e2e | yes | 1.62.1 | - |
| Wrangler | deploy | yes | 4.128.0 | - |
| `@intechstudio/grid-protocol` | minifier, budgets | yes | **1.20260825.1135**, exact pin, no caret | - |
| `wasmoon` | Lua preview | yes | 1.16.0 exact pin | - |
| `../grid-editor` (the BOTOR sibling) | `format-parity.spec.ts` (deliberate canary; **fails, never skips**) | yes | - | `BOTOR_REPO` env override exists |
| `../grid-fw` | reading firmware C for this document | yes | - | vendored simulator restates it |
| `../zona-docs` | the event enum, `gmss`, the recipes | yes | - | - |
| **A real ZONA** | every hardware claim | **no** | - | **None. Nothing in this phase may be claimed as hardware-verified.** |
| **A DAW with MIDI clock out** | `docs/MIDI-IN-PROBE.md` Part B | **no** (user's bench) | - | **None. The clock-sync family stays unplanned until Part B answers.** |

Baseline, run for this document: `npx vitest run --project server` -> **81 files, 828 tests passed, 1
todo, 44.96 s**. `git diff --stat HEAD -- src/vendor/` -> **empty**.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.11, two projects (`server`, `sweep`); Playwright 1.62.1 for e2e |
| Config file | `vite.config.ts` (`test.projects`) |
| Quick run | `npx vitest run --project server` - 81 files, 828 tests, ~45 s |
| Sweep run | `npm run test:sweep` - the CONT-02 gate plus `pad-invariants.test.js`; slow and memory-sensitive by design |
| E2E | `npm run test:e2e` |
| Type check | `npm run check` |
| The one file to run while authoring Lua | `npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts` |

The naming convention **is** the rule: `*.sweep.spec.ts` anywhere under `src/` joins the sweep project
and is excluded from `server` by the same glob. A new load-sensitive gate is renamed, never moved.

### Requirements -> test map

Phase 11 owns no `REQUIREMENTS.md` row, so the map is per behaviour.

| Behaviour | Test type | Automated command | Exists? |
|---|---|---|---|
| Every `glpfs` start / `glt` timeout pair in a hand-authored entry lands the phase on 0 | unit (source scan + arithmetic) | `npx vitest run --project server src/lib/catalog/` | **No - Wave 0 gap** |
| No entry writes `e>=5` / `e>4` as "ended" without `and e<9` | unit (source scan) | same | **No - Wave 0 gap** |
| A fast tap (`touchTap`) produces the same MIDI as a slow tap, per entry | unit (Lua host) | same | **No - Wave 0 gap** |
| A gesture leaves no cell lit that a never-touched run leaves dark | unit (Lua host, two matched runs) | same | **No - Wave 0 gap** |
| CONSOLE reaches full scale | unit (Lua host, sweep a column, assert 127 in the emitted set) | same | **No - Wave 0 gap** |
| HANGAR's nine presets diverge from the vendored nine only where declared | unit | `... src/lib/catalog/presets.spec.ts` | **No - Wave 3 gap** |
| Every entry fits 908 at every knob position | unit | `npm run test:sweep` | yes - `lua-entries.sweep.spec.ts` test 6 |
| The catalog, the listing and the front door stay a partition | unit | `npx vitest run --project server src/lib/catalog/` | yes |
| The fixture covers the catalog exactly and `restsBlack` agrees both ways | unit | same | yes - `frames.spec.ts` |
| Facet health rules and zero singletons | unit | `... src/lib/browse/facets.spec.ts` | yes |
| Every format-`x` stamp ever emitted still lands `restored` | unit | `... src/lib/share/stamp.spec.ts` | yes |
| `src/vendor/` is byte-identical to upstream | unit | `... src/lib/fidelity/vendored-diff.spec.ts` | yes |
| The port reproduces BOTOR's compiler character for character | unit | `... src/lib/fidelity/preset-baseline.spec.ts` | yes |
| Every routed page's `og:image` resolves under `build/` | unit | `... src/lib/og/build.spec.ts` | yes |
| Every configuration's image is served by the built site | e2e | `npm run test:e2e` | yes |
| **Anything on real hardware** | **manual** | - | **The user's bench. Not automatable: Web Serial has no CDP domain and no fake-device hook.** |

### Sampling rate

- **Per task commit:** `npx vitest run --project server` (~45 s).
- **Per wave that touches an entry's Lua:** add `npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts`.
- **Per wave merge:** `npm run test:unit -- --run` (both projects) plus `npm run check`.
- **Phase gate:** `npm run test` (unit + e2e) green, `git diff --stat HEAD -- src/vendor/` empty, and
  the hardware rows handed to the user unasserted.

### Wave 0 gaps

- [ ] `src/lib/catalog/decay-idiom.spec.ts` - scans every hand-authored entry's Lua, pairs each
      `glpfs(...,start,rate,0)` with the `glt(...)` that follows it on the same cell, and fails unless
      `(start + rate*timeout) mod 256 == 0`. This is the gate that makes class A unrepeatable.
- [ ] `src/lib/catalog/touch-guard.spec.ts` - fails on `e>=5` or `e>4` not immediately followed by
      `and e<9`, and on an onset test written as `e==4` alone. Build the needles from fragments at
      runtime, the way `forbidden-instructions.spec.ts` and `lua-entries.sweep.spec.ts` test 4 already
      do, so the spec does not match itself.
- [ ] Extend `src/lib/sim/lua-smoke.spec.ts` (or a sibling) with the **matched-pair residue probe**
      used throughout this document: run an entry twice for the same tick count, once with a gesture
      and once without, double-tapping any latch back to its start, and assert no cell differs after
      settling. It is about twenty lines and it catches every future class-A regression behaviourally
      rather than syntactically.
- [ ] Extend the same file with a **fast-tap parity probe**: `touchTap` and a slow down/move/up on the
      same cell must produce the same MIDI. It caught four entries here in one run.
- [ ] `src/lib/catalog/presets.spec.ts` (Wave 3) - the divergence table described above.

No framework install is needed. Every gap is a new file in an existing project.

---

## Open questions

1. **The facet vocabulary.** Option (a), (b) or (c)? Blocks wave 1.
2. **Nine dead `/c/<id>/` addresses.** Acceptable, or worth a stub? Blocks nothing, but it is a
   user-visible consequence of a deletion and should be a decision rather than a side effect.
3. **SHUTTLE, ARC's second half, STAGE, LUMEN.** Four two-reading notes. Each blocks its own plan.
4. **RADAR versus SONAR.** Product decision.
5. **DIAL's encoder mode.** One question at the bench: what relative-CC convention is the control set
   to in the host? If it is signed-bit, the diagnosis is confirmed and the fix is a hand-authored dial
   or a documented "set your host to binary offset".
6. **The comet residue.** 1-2 units per crossed cell, permanent, unfixable inside HANGAR. Is that what
   the user saw on AURORA and STARFIELD, or is it something larger the simulator does not reproduce?
   Only the bench can say. Until it does, the honest options for those two cards are `glow`, `none`,
   or accept.
7. **`docs/MIDI-IN-PROBE.md` has never been run**, and Part B's answer is load-bearing for four notes.
   Ten minutes at a bench.
8. **Four faders.** Untested. No verdict is invented here and none should be.

---

## Sources

### Primary (HIGH confidence)

- `../grid-fw/common/src/c/grid_led.c:190-211` - `grid_led_tick`, the three lines the whole decay
  class rests on. `pha` is `uint8_t` and `+=` wraps.
- `src/vendor/botor/pad-sim.ts:100-130, 228-241, 470-535, 860-891, 980-1035, 1200-1250` - the
  simulator's reproduction of the LED engine, the event codes, `glpfs`, `ledTick`, `weightsOf`,
  `shapeIntensity`, `glcStops`.
- `src/vendor/botor/_pad.ts:161-360` (`PadState` and the descriptor unions), `:395-432`
  (`DECAY_TABLE`, `nearestDecay`), `:520-560` (`DIAL_*`), `:1196-1250` (`touchPaint`), `:1932-2003`
  (`dialPaint`), `:3037-3070` (`EVENT_BUDGET`, `measure`, `cost`), `:4150-4388` (`PRESETS`,
  `presetById`, the private `preset()` factory).
- `src/lib/sim/lua-host.ts:130-205` - `HOST_GLOBALS` (15) and `HOST_SELF_METHODS` (9), verbatim.
- `docs/MIDI-IN-PROBE.md` - the whole document, including "Results: None yet."
- `../zona-docs/docs/ZONA_REFERENCE.md:660-700` (the event enum with per-code confidence), `:1241-1250`
  and `:2022` (`gmss` sysex), `:1276-1300` (`midirx_cb`, `rtmrx_cb`, `grxm` modes).
- `../zona-docs/docs/ZONA_BRIEF.md:20-40` - the event code table and the DOWNUP trap.
- `../zona-docs/docs/ZONA_RECIPES.md:304-306, 1454-1456, 2401-2415, 2510` - the event vocabulary and
  its confidence, restated independently.
- **Direct measurement, this session**, against the pinned minifier and the real Lua host: the full
  per-entry budget table; the nine compiled preset costs; the descriptor-variant costs; the
  phase-freeze table for the broken and the correct idiom at 28 timeouts; the residue probes; the
  fast-tap/slow-tap/swipe MIDI counts for all 27 Lua entries; the CONSOLE value sweep; the DIAL
  CW/CCW symmetry test; the facet histogram before and after removal; and every costed candidate fix.
  Every script ran read-only against the working tree and wrote nothing into the repository.
- `npx vitest run --project server` -> 81 files, 828 passed, 1 todo, 44.96 s.

### Secondary (MEDIUM confidence)

- The DIAL signed-bit hypothesis. The arithmetic is HIGH (measured symmetric, 192 messages each way,
  values 65 and 63); the inference about the user's host is MEDIUM and needs one bench answer.
- The three "two-reading" diagnoses (SHUTTLE, STAGE, LUMEN) and ARC's second half. Each reading is
  supported by the source; which one the user meant is not.
- `../zona-docs`'s event codes 0, 2, 3 and 6-9 are marked INFERRED from Microchip's ordering by their
  own author. 1, 4 and 5 are user-verified. Code 9's behaviour is inferred but is treated as real
  throughout the catalog, and this document does the same.

### Tertiary (LOW confidence)

None. Nothing above rests on a single unverified source. Where the evidence stops - hardware
behaviour, the user's intent, the un-run probe - the sentence says so.

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| The decay class mechanism | **HIGH** | Firmware C and the vendored simulator agree line for line, and 28 timeouts were measured through the real Lua host. |
| The event-vocabulary class | **HIGH** | Four entries measured producing zero MIDI on a fast tap; the enum is documented in three independent places. |
| Per-entry budgets | **HIGH** | Measured with the pinned `compressScript`, not read from comments. Every declared cost in the tree matched. |
| Descriptor reachability (the preset asks) | **HIGH** | Each variant compiled and costed; `normalisePadState` behaviour for tpad measured rather than inferred. |
| Removal blast radius | **HIGH** | Enumerated by grep with line numbers and cross-checked against the assertions that read each site. |
| The facet arithmetic | **HIGH** | Histogram computed from the real listing. |
| Preset-ownership mechanism | **MEDIUM-HIGH** | The mechanism is sound and every exported helper it needs exists; the exact spec repointing list is complete to the best of a full-tree grep. |
| DIAL, SHUTTLE, STAGE, LUMEN, ARC-second-half | **MEDIUM** | Ambiguous input, flagged rather than resolved. |
| Anything on hardware | **NONE CLAIMED** | The user's bench is the only authority. |

**Research date:** 2026-09-09
**Valid until:** 2026-10-09 for the ecosystem facts. The measurements are pinned to this tree at
`a17e926` and to `@intechstudio/grid-protocol@1.20260825.1135`; they go stale the moment either moves.
