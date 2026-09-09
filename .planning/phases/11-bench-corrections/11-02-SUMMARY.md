---
phase: 11-bench-corrections
plan: 02
subsystem: catalog
tags: [catalog, decay, touch, vitest, gates, budget, knobs]
requires:
  - phase: 11-bench-corrections
    plan: 01
    provides: "the five KNOWN_VIOLATIONS rows, the computed decay form rescued from gridlock.ts before it was deleted, and the PREV_FILES 82 / PREV_TESTS 831 baseline"
provides:
  - "Class A closed at all five sites: every decaying layer in every hand-authored entry lands on phase 0, with KNOWN_VIOLATIONS empty"
  - "Class B closed at six sites (five 'ended', one 'started'): a fast tap sends what a slow tap sends on every hand-authored entry"
  - "src/lib/catalog/touch-guard.spec.ts - the class-B gate, with DECLARED_EXCEPTIONS holding stage.ts and forge.ts and a reason for each"
  - "Two behavioural probes in lua-smoke.spec.ts: matched-pair residue and fast-tap parity"
  - "CHORUS's bloom on the computed decay form, which makes entries/chorus.ts the live worked example of that arm"
affects: [11-08, 11-09, 11-11, 11-16]
tech-stack:
  added: []
  patterns:
    - "DECLARED_EXCEPTIONS keyed on the whole if/elseif BRANCH rather than on the comparison, so a guard that is correct because of the chain around it stops being excused the moment it is moved out of that chain"
    - "A behavioural probe that separates ALIVE from FROZEN by sampling at coprime gaps, and asks the rendered PIXEL rather than the layer phase"
key-files:
  created:
    - src/lib/catalog/touch-guard.spec.ts
  modified:
    - src/lib/catalog/entries/arc.ts
    - src/lib/catalog/entries/chorus.ts
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/entries/forge.ts
    - src/lib/catalog/entries/ghost.ts
    - src/lib/catalog/entries/lattice.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/catalog/entries/sonar.ts
    - src/lib/catalog/entries/stage.ts
    - src/lib/catalog/decay-idiom.spec.ts
    - src/lib/catalog/frames.json
    - src/lib/sim/lua-smoke.spec.ts
key-decisions:
  - "SONAR and GHOST fixed as 252,250 with glt 42 UNCHANGED - the same house idiom at T=42 - rather than the plan's 252,247 with glt 28. Both are +0 characters; only one preserves the 420 ms trail the card was designed around"
  - "CHORUS's @BLOOMRATE becomes @SPREAD and stops being a rate. A knob-semantics change, named as one; the knob ID and arity do NOT move, because wild-stamps.json holds two CHORUS records keyed on bloomSpeed at indices 1 and 4"
  - "DECLARED_EXCEPTIONS holds TWO rows, not the plan's one. forge.ts's bare e==4 is the FIX rather than the bug and is declared with that reason"
  - "GHOST's second-finger erase took the STARTED form of the same class-B bug (+7 characters), found by the new gate rather than by the plan"
requirements-completed: []
duration: 2h 40m
completed: 2026-09-09
---

# Phase 11 Plan 02: Two Class Bugs, Two Gates and Two Probes — Summary

**Both bug classes closed and made unrepeatable — five decays that could never
reach phase 0 and six touch guards that read a fast tap as a lift — at +0 to +30
characters a site, with CHORUS's bloom fitting the computed form and 137
characters still free at its worst knob position; and with eight things the plan
or its predecessors asserted that the tree does not support, every one reported
rather than reconciled.**

## Performance

- **Duration:** 2 h 40 m
- **Tasks:** 3 of 3
- **Files:** 1 created, **12 edited** (the plan declared 11 paths)
- **Commits:** `8759554`, `0b7c8db`, `0be3832`

---

## Counts, as carried name plus delta

| Name          | Carried            | Declared | Observed                       | Agreement |
| ------------- | ------------------ | -------- | ------------------------------ | --------- |
| quick files   | `PREV_FILES` 82    | +1       | **83**                         | agrees    |
| quick tests   | `PREV_TESTS` 831   | +5       | **836** (+1 todo)              | agrees    |
| sweep         | `4 19` at 120 s    | +0       | **4 19** at **112 s**          | agrees    |
| e2e           | `PREV_E2E` 103     | +0       | **103**, not run — see below   | agrees    |
| `svelte-check`| `BASE_CHECK` 576   | not stated | **577**, 0 errors 0 warnings | reconciles |
| catalog       | 27 (9 + 18)        | +0       | **27** (9 preset + 18 Lua)     | agrees    |
| files touched | —                  | 11 paths | **13 paths**                   | **+2**    |

`check-counts.mjs` exited zero against `83 836` and against `4 19`. Both were run
against the literal, not read off a transcript.

**`svelte-check` reconciles exactly:** 576 + 1 new spec file = **577**. Reported,
never asserted.

**The sweep got faster again**, 120 s to 112 s, measured at 1,735 MB free.

**The e2e suite was NOT RUN, and the +0 is proved rather than claimed.**
`git diff --name-only 38a7d78 HEAD -- e2e src/routes scripts static` is **empty**
and `cat e2e/*.ts | grep -c "test("` is **85**, the same number 11-01 measured
before and after itself. No Playwright title was added, moved or removed and no
file the browser loads at run time changed shape. Warning 1 of the brief - a
`build/` held by a server making the e2e run test a STALE artefact - is the
reason a run that could prove nothing new was not performed to produce a number.

**The two extra files are `forge.ts` and `stage.ts`**, the two DECLARED
EXCEPTIONS. Each carries its own reason in its own header, so a reader of the
entry learns why before a reader of the gate does. Named here rather than
absorbed, per the standing rule.

`git diff --stat HEAD -- src/vendor/` is **empty**. No agent connected to or
wrote to a device, and nothing here is claimed as hardware-verified.

---

## What the plan asserts that the tree does not support

Eight findings. None was reconciled into a passing number.

### 1. The plan's "free at worst" column is optimistic on every row, by 1 to 11

Measured with `max(text.length, GridScript.compressScript(text))` after
`padReady()`, at the all-longest corner including the widened colour lattice.

| Site           | Plan's free at worst | Observed before | Observed after |
| -------------- | -------------------- | --------------- | -------------- |
| `sonar.timer`  | 627                  | **626**         | 626            |
| `ghost.timer`  | 573                  | **571**         | 571            |
| `euclid.timer` | 688                  | **687**         | 678            |
| `morph.setup`  | 400                  | **398**         | 381            |
| `chorus.setup` | 177                  | **175**         | 137            |
| `lattice.setup` after B | 283         | 290             | **282**        |
| `arc.setup` after B     | 519         | 526             | **518**        |
| `ghost.setup` after B   | 593         | 600             | **585**        |
| `chorus.setup` after B  | 169         | —               | **137**        |
| `morph.setup` after B   | 392         | —               | **381**        |

The last two are not off by one: the plan's class-B table states MORPH's and
CHORUS's free-after as if class A had cost nothing, and both sites take BOTH
fixes. Every margin in this SUMMARY is stated **at worst**.

### 2. EUCLID's fix is +9, not −5

The plan's class-A table gives `euclid.timer` a delta of **−5**. The
parameterised idiom replaces the seven characters `255,250` with fifteen at the
defaults (`252,256-252//42`) and nineteen in the template. Measured: Timer
**218 → 226** at the defaults and **221 → 230** at the all-longest corner, so
**+8 and +9**. There is no reading of the substitution that removes characters.

### 3. EUCLID's and SONAR's residue is NOT zero, and it is not invisible

The plan states, as a measurement, that EUCLID, SONAR and GHOST "all have a
Timer that repaints the same cells before residue accumulates — **measured
residue after 25 s: zero cells**", and calls fixing them "correctness hygiene,
not a bug fix".

`frames.json`, which records an **untouched** run with no gesture at all, says
otherwise:

| Entry  | tick 37 | tick 101 | tick 500 | tick 1009 |
| ------ | ------- | -------- | -------- | --------- |
| euclid | 45 → 45 | 73 → **50** | 111 → **51** | 111 → **45** |
| sonar  | 81 → 81 | 184 → **102** | 194 → **96** | 188 → **78** |

Roughly **half of each pad** was permanent glow that the entry's own Timer put
there and never took away — on a catalog card, with nobody touching anything.
The hashes moved at all four ticks for both. That is a bug fix, not hygiene, and
it is the one most visitors would have seen without ever plugging anything in.

### 4. `frames.json` cannot move for CHORUS or MORPH, and the plan predicts it will

The plan's task 1 item 5 says "a cell that used to freeze lit now goes dark, so
`nonZeroBytes` should fall at the later ticks for chorus and morph, **and if it
does not, the fix did not reach the picture**". `frames.spec.ts` samples every
entry through `createEngine` and **drives no touch at all**; CHORUS's bloom and
MORPH's comet are both touch-driven, so neither can appear in that fixture under
any implementation. Two entries moved - euclid and sonar - and that is the
correct and complete answer. The picture claim for chorus and morph is carried
instead by the residue probe in task 3, which does drive a gesture.

### 5. The negative check for EUCLID goes red at test 2, not test 1

The plan's task-1 negative check says "Expect `decay-idiom.spec.ts` **test 1**
red". EUCLID's site carries `@TRAIL`, so it is a PARAMETERISED site and test 2 is
the arm that reads it. Test 2 went red naming all five declared values. Observed,
not adjusted.

### 6. CHORUS is a THIRD entry whose knob value list moved, and the plan names two

The plan's Pitfall-5 warning - "changing a knob's VALUES while keeping its arity
keeps every shared link decodable and silently changes what it renders" - is
raised for EUCLID and MORPH. CHORUS's bloom knob had to move too, further than
either: not only its five values but its **meaning**. `wild-stamps.json` holds
**two CHORUS records keyed on `bloomSpeed`, at indices 1 and 4**, captured
byte-for-byte at `b3f99bb`. Both still decode, both still restore, and index 4
now renders a spread of 24 where it used to render a rate of 12.

### 7. `DECLARED_EXCEPTIONS` needs two rows, not one

The plan describes `stage.ts` as "the" false positive and asks for "One row".
The gate's first run found a second: `forge.ts` writes a bare `if e==4` as the
onset for its corner hold, and that is **correct**, because the latch it arms is
only cleared by a lift and a coalesced tap has none. Admitting code 9 there would
arm a hold that never releases. Declared with that reason rather than "fixed"
into a stuck mode.

### 8. GHOST carries the STARTED form of class B, which the plan does not name

The plan's class B is five "ended" sites. `ghost.setup`'s second-finger erase
tests a bare `e==4`, so a quick two-finger stab did not clear the recording. Six
sites, not five. Fixed at **+7 characters**, found by `touch-guard.spec.ts` test
2 on its first run.

---

## Class A: five sites, closed

| Entry.event    | as shipped                                        | now                                                         | delta (worst) | free at worst |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------------- | ------------- |
| `sonar.timer`  | `glpfs(a,2,255,250,0)` + `glt(a,2,42)`            | `glpfs(a,2,252,250,0)` + `glt(a,2,42)`                       | **+0**        | **626**       |
| `ghost.timer`  | `glpfs(a,l,255,250,0)` + `glt(a,l,42)`            | `glpfs(a,l,252,250,0)` + `glt(a,l,42)`                       | **+0**        | **571**       |
| `euclid.timer` | `glpfs(a,2,255,250,0)` + `glt(a,2,@TRAIL)`        | `glpfs(a,2,252,256-252//@TRAIL,0)` + `glt(a,2,@TRAIL)`       | **+9**        | **678**       |
| `morph.setup`  | `glpfs(a,2,255,250,0)` + `glt(a,2,@DECAY)`        | `glpfs(a,2,252,256-252//@DECAY,0)` + `glt(a,2,@DECAY)`       | **+9**        | **389** (A only) |
| `chorus.setup` | `glpfs(a,2,255-sqrt()*22//1,@BLOOMRATE,0)` + `glt(a,2,64)` | the computed form — below                           | **+30**       | **145** (A only) |

### The arithmetic, verified before it was acted on

The brief's correction was checked rather than taken. `pha += fre` on a
`uint8_t`; `250 ≡ −6 (mod 256)`; so the walk is `255 − 6T (mod 256)`. `gcd(6,
256) = 2` and 255 is odd, so `6T ≡ 255 (mod 256)` has **no solution at any T**.
The start had to move. It is correct as stated.

### SONAR and GHOST: 252,250 with the timeout UNCHANGED, not 252,247 with glt 28

The plan prescribes `252,247` + `glt 28`. Both that and what shipped are +0
characters. What shipped is `252,250` with **`glt 42` untouched**, because
`256 − 252//42 = 250` — the plan's own parameterised idiom, instantiated at
T = 42. `252 − 6 × 42 = 0` exactly.

The difference is the picture: the plan's version shortens both trails from 420
ms to 280 ms for no stated reason, where this one changes only the starting
phase and leaves the decay exactly as long as the card was designed around. A
deviation, recorded here and in both entries' headers.

### The two knob re-cuts, and the shared-link consequence

**A stamp encodes a knob's INDEX, not its value.** Every link anybody has ever
shared still decodes and still restores; a link carrying index 3 now renders
something slightly different from what its author saw. `stamp.spec.ts` compares
indices and stayed green through both changes, so no test says this out loud —
which is why both entry files now do.

**EUCLID `@TRAIL`**, ticks of decay behind the ring head:

| index | was | now | reason                                |
| ----- | --- | --- | ------------------------------------- |
| 0     | 21  | **21** | already an exact divisor of 252    |
| 1     | 42  | **42** | already an exact divisor; the default |
| 2     | 64  | **63** | nearest legal value, 1 away        |
| 3     | 100 | **84** | nearest legal value, 16 away (126 is 26 away) |
| 4     | 150 | **126**| nearest legal value, 24 away       |

**MORPH `@DECAY`**, ticks the comet takes to fade:

| index | was | now | reason                                |
| ----- | --- | --- | ------------------------------------- |
| 0     | 20  | **21** | nearest legal value, 1 away        |
| 1     | 42  | **42** | already legal; the default         |
| 2     | 80  | **84** | nearest legal value, 4 away        |
| 3     | 120 | **126**| nearest legal value, 6 away        |

Both keep their arity, both stay ascending, both keep the default at 42 so the
canonical rendered text still reproduces at the defaults. The ring arithmetic
each knob feeds was read before it was assumed: EUCLID's `@TRAIL` appears once,
in the Timer's decay, and nothing derives from it; MORPH's `@DECAY` likewise
appears once.

### CHORUS's bloom: the computed form, costed BEFORE it was designed

**It fits, with room.** Setup went **729 / 733 → 768 / 771** across class A and
class B together, leaving **137 characters free at the worst knob position**. No
shortfall, so no alternative had to be proposed.

```
local w=glim(248-math.sqrt(p*p+q*q)*@SPREAD//4*4,0,248)
glpfs(a,2,w,4,0) glt(a,2,(256-w)//4)
```

The rate is fixed at 4, `w` is a multiple of 4 by construction (`//4*4`), and
`w + 4 × ((256 − w)/4) = 256 ≡ 0` for every cell. `glim` is not decoration: it
holds `w` inside 0..248, which keeps the derived timeout inside 2..64 and stops
it ever being the **0 that CANCELS a countdown** rather than scheduling one.

**`@BLOOMRATE` IS NOW `@SPREAD`, AND THAT IS A KNOB-SEMANTICS CHANGE, NOT A BUG
FIX.** It used to be the phase step handed to `glpfs`. The step is now fixed at
4 so the timeout can derive from the start, and what the knob controls is how
many phase units of head start each unit of distance gives up. The label moved
from "Bloom speed" to "Bloom spread" and the help text was rewritten with it.

| index | was (rate) | now (spread) |
| ----- | ---------- | ------------ |
| 0     | 2          | **8**        |
| 1     | 4 (default)| **12** (default) |
| 2     | 6          | **16**       |
| 3     | 8          | **20**       |
| 4     | 12         | **24**       |

Every value is a multiple of four, as GRIDLOCK's `@SPREAD` was and for the same
reason. **The ceiling is 24 and not 32**: the farthest cell from a corner pad's
centre is `sqrt(7² + 7²) = 9.9` units away, so a spread above 25 drives the start
below zero, `glim` clamps it, and every cell past that distance dies on the same
tick instead of in sequence. 24 is the largest multiple of four that keeps the
whole ring travelling.

**The knob ID and the arity do NOT move**, and that is load-bearing:
`src/lib/share/fixtures/wild-stamps.json` holds two CHORUS records keyed on
`"bloomSpeed"` at indices 1 and 4, captured byte-for-byte at `b3f99bb`, and its
whole value is that it has never been regenerated.

**Two picture changes, both stated rather than discovered later.** The leading
edge is very slightly dimmer, because the start is a multiple of four capped at
248 instead of 255. And the bloom now passes **once and dies** where the old pair
cycled the ring for a fixed 0.64 s and could show two or three ripples at a high
rate — the third ripple being the one that never went out.

### `KNOWN_VIOLATIONS` is empty

All five rows deleted. Test 3's tail was re-cut with them: it asserted `.toBe(5)`
and `toContain("chorus")` and now asserts the roll is empty, the length is 0, and
— the non-vacuity half — that **every** decay site in the catalog is being
checked rather than merely counted, so an empty table cannot make the file a
no-op. The type and all three tests stay: a mechanism deleted the day it empties
is a mechanism the next author has to reinvent.

### Where the residue showed, and where it did not

| Entry  | Visible without a finger? | Evidence |
| ------ | ------------------------- | -------- |
| euclid | **YES** | untouched frames: 111 → 51 lit bytes at tick 500 |
| sonar  | **YES** | untouched frames: 194 → 96 lit bytes at tick 500 |
| ghost  | no      | its decay only runs once a gesture has been recorded |
| chorus | on touch | all 81 cells stuck at up to phase 126, the user's report |
| morph  | on touch | every crossed cell stuck, the user's report |

**Five fixes are not five separately-reported bugs, and they are not three
invisible ones either.** The plan's split (euclid/sonar/ghost invisible,
chorus/morph seen) is right about ghost and wrong about the other two — see
finding 3.

---

## Class B: six sites, one gate, two declared exceptions

| Site                        | before (def / worst) | after (def / worst) | delta | free at worst |
| --------------------------- | -------------------- | ------------------- | ----- | ------------- |
| `lattice.setup` ended       | 615 / 618            | 623 / 626           | +8    | **282**       |
| `arc.setup` ended           | 379 / 382            | 387 / 390           | +8    | **518**       |
| `morph.setup` ended         | 515 / 519 (post-A)   | 523 / 527           | +8    | **381**       |
| `chorus.setup` ended        | 760 / 763 (post-A)   | 768 / 771           | +8    | **137**       |
| `ghost.setup` ended         | 305 / 308            | 313 / 316           | +8    | 592           |
| `ghost.setup` **started**   | 313 / 316            | 320 / 323           | **+7**| **585**       |

`e>=5` became `e>=5 and e<9`; `and` binds tighter than `or` in Lua, so
`e==3 or e>=5 and e<9` groups as intended and no brackets were needed. GHOST's
bare `if e==4` became `if e==4 or e>8`.

**GHOST is fixed here even though 11-11 rewrites it**, so the gate is green when
it lands and the redesign inherits an enforced convention rather than one it has
to remember.

### `src/lib/catalog/touch-guard.spec.ts`, three tests

The event table is **cited, never restated**: `src/vendor/botor/pad-sim.ts:228-241`
and `../zona-docs/docs/ZONA_REFERENCE.md` §4.6 already hold it twice, and a third
statement would drift from both.

The scan does not match substrings. It collects every event-code **comparison**
in a body and groups consecutive ones into **chains**, where two comparisons join
a chain if the only thing between them is `and` or `or` and brackets. The intent
is then read off the chain. That is what lets SHUTTLE's `(e==1 or e==4)` be
classified as a LIVE test and skipped with a reason — excluding code 9 there is
correct, because a coalesced tap's contact is already gone — instead of being
reported as a missing onset escape.

**Every needle is assembled from fragments at run time.** This file's own prose
and failure messages contain the exact text they forbid.

**Observed by the walk:** **9** "contact ended" guards and **4** "contact
started" guards across the eighteen hand-authored entries. Both counts were read
by temporarily raising the non-vacuity floors and reading the failure, then
restoring from a scratch copy with matching sha256 — not inferred from a green
run.

**Non-vacuity is derived, not hard-coded** (warning 3 of the brief): every entry
that installs a touch callback must have yielded at least one event-code chain,
asserted per entry. A walk that read nothing would otherwise pass every
assertion by finding nothing.

### `DECLARED_EXCEPTIONS`, two rows, keyed on the BRANCH

| Entry | Rule | Branch | Why it is correct |
| ----- | ---- | ------ | ----------------- |
| `stage.setup` | ended | `elseif e>=5` | preceded in the same if-chain by `if e==4 or e>8`, so code 9 takes the first branch and never reaches this one. STAGE also USES the code: `Z(z,e>8 and 4 or 24)` lights the zone at rate 4 for a fast tap and 24 for a held press |
| `forge.setup` | started | `if e==4` | this onset arms a latch only a lift clears, and the release is in the same handler's `e>=5 and e<9` branch. A coalesced tap has no lift, so admitting 9 would arm the corner hold forever |

A row is keyed on the whole `if`/`elseif` clause, not on the comparison, which is
what makes the second negative check below work. Both entries also say so in
their own headers.

---

## The two behavioural probes

`src/lib/sim/lua-smoke.spec.ts`, **3 tests → 5**.

### The matched-pair residue probe

Two runs of the same length per entry, one double-tapped and one never touched,
at **two renderings** (the defaults, and every knob at its first declared value).
A cell is residue when it is **visibly lit at every sample in the gesture run,
visibly dark at every sample in the quiet run, and carries a shape-0 layer whose
phase is non-zero and unchanged across all four samples**.

**Four things had to be got right, and each of them had made an earlier cut of
this probe wrong.** All four were found by running it.

1. **The host's `enqueue` is change-gated per contact on `(event, x, y)`**, so a
   second `touchTap` at exactly the same point on the same contact is silently
   dropped and the latch reset never happens. The probe reported SONAR's toggled
   step — a cell the user asked to light — as residue. The reset tap now moves by
   one coordinate unit, and the test **proves** that is the same LED cell at both
   a 3-wide and a 9-wide mapping rather than assuming it.
2. **Layer records are keyed by HARDWARE index and the frame is SCREEN order**,
   and the mapping is serpentine. Conflating them printed one cell's phase beside
   another cell's colour and reported CONSOLE's fader at column 7 when it had
   moved column 1.
3. **Two samples 40 ticks apart ALIAS onto GHOST's 2-tick repaint cycle** and
   called a live cell frozen. The gaps are **1, 7 and 32** now — odd and mutually
   coprime, so no timer period in the catalog can hide behind all three.
4. **SNAKE erases its tail with `P(k,0,0,0)`, a BLACK colour at phase 255**, so
   every cell the snake ever vacated is permanently "frozen above zero" and
   permanently invisible. A phase-only probe reports a game working exactly as
   designed. The pixel is the question; the phase is the diagnosis.

**A shaped layer is skipped**, and it is the same exclusion `decay-idiom.spec.ts`
§4 makes for the same reason: ARC, POMODORO, SHUTTLE and STAGE each run one
keeper deliberately and forever, and a gesture is allowed to change what it looks
like.

**`RESIDUE_ALLOWANCES`, two rows, each naming its cells and never an entry:**

| Entry | Cells | Why |
| ----- | ----- | --- |
| morph | the sixteen macro-quad cells, derived from the entry's own `k={0,7,63,70}` | they ARE the four macro readouts. No coordinate returns all four to zero — the four products of `x`, `y`, `127−x` and `127−y` cannot all vanish at once — so this cannot be double-tapped away. **The comet on layer 2 is not allowed and is exactly what the probe watches** |
| console | fader column 2, rows 3 and 4, derived from `h = 8 − r` | a fader is an ABSOLUTE control, not a toggle: a second tap on the same row sets the same level again. The other eight columns and the whole mute row stay under the probe |

Both are narrow by construction, both fail if they stop matching anything, and
both carry a reason the test length-checks. **The gesture point is chosen so the
allowances stay narrow**: it is inside the top-left ninth so a 3×3 latch —
STAGE — double-taps back to where Setup left it and needs no allowance at all,
and at column 2 rather than column 1 so it does not land inside MORPH's macro
quad, where the allowance would have swallowed the comet as well.

### The fast-tap parity probe

`touchTap` against a slow down/up on the same cell must produce the same MIDI and
HID **list**, not the same count, so a note-off arriving without its note-on
fails.

| Entry | fast / slow | Research |
| ----- | ----------- | -------- |
| **lattice** | **2 / 2** | 0 vs 2 |
| **chorus**  | **6 / 6** | 0 vs 6 |
| **morph**   | **4 / 4** | 0 vs 4 |
| **ghost**   | **406 / 406** | 0 vs 8 |
| euclid | 151 / 151 | — |
| arc | 213 / 213 | — |
| sonar | 8 / 8 | — |
| steps | 45 / 45 | — |
| console | 1 / 1 | — |
| strip | 1 / 1 | — |
| lumen | 2 / 2 | — |
| stage | 1 / 1 | — |
| cull | 1 / 1 | — |
| forge | 1 / 1 | — |
| snake | 5 / 5 | — |
| quadrant | 2 / 2 | — |
| pomodoro | 2 / 2 | — |
| **shuttle** | **0 / 1** | declared |

The research's four zeroes are all closed. GHOST's 406 is a run-length figure
rather than a per-tap one — its Timer emits two controllers every second tick for
the whole run — and the two lists are identical message for message.

**Two more findings out of building it:**

- **The settle has to outlast the watchdog.** CHORUS releases a chord after
  twenty 100 ms Timer ticks with no event on the contact, so a 200-tick settle
  measured the watchdog rather than the tap and reported three note-ons with no
  note-offs. `PARITY_SETTLE` is 400.
- **The probe's tap had to move off the middle row.** At the smoke gesture's
  `TAP`, CONSOLE's row was its default fader level and QUADRANT's was its dead
  cross, so both sent **nothing on either run** and passed having proved nothing.
  A per-entry non-vacuity assertion now refuses a slow run that produced no
  output at all, and names the constant to move rather than the assertion to
  weaken.

**`PARITY_ALLOWANCES`, one row.** SHUTTLE is a jog wheel whose output is a
function of contact DURATION; `(e==1 or e==4)` correctly evaluates a coalesced
press-and-lift to speed 0 and sends nothing. Making the two agree would mean
jogging the transport on a tap nobody held. The row fails if the two lists ever
start agreeing.

---

## The seven negative checks, with exit codes

| # | Task | Check | Observed | Exit |
| - | ---- | ----- | -------- | ---- |
| 1 | 01 | EUCLID's `255,250` restored | **test 2 red** (not test 1 — the site is parameterised), naming the rule first then all five values: `21 → 129, 42 → 3, 63 → 133, 84 → 7, 126 → 11` | **1** |
| 2 | 01 | MORPH's `@DECAY` back to `20/42/80/120` | **test 2 red**, naming `20 → 12`, `80 → 12`, `120 → 12` and leaving 42 alone — exactly the three the plan predicted | **1** |
| 3 | 02 | `and e<9` dropped from `lattice.ts` | **test 1 red**, message opens with the convention: *"'this contact ended' is written `e==3 or e>=5 and e<9`; code 9 is a down AND an up, and treating it as a plain end throws the onset away, so a fast tap produces nothing at all. lattice.setup writes `if e==3 or e>=5`."* | **1** |
| 4 | 02 | STAGE's branch written as a standalone `if e>=5` | **tests 1 AND 3 red.** Test 1 names it unescaped; test 3 says the declared branch *"no longer appears in the entry. The exception is about the BRANCH, not about the file."* The exception is not a per-file amnesty | **1** |
| 5 | 02 | `stage` removed from `DECLARED_EXCEPTIONS` | **tests 1 AND 3 red together** — the pair that proves the exception is declared rather than pattern-matched away | **1** |
| 6 | 03 | `lattice.ts`'s `e>=5` restored | **fast-tap probe red**, naming lattice and printing an empty list beside a two-message one: `fast tap sent 0 message(s): (nothing)` against `slow tap sent 2: midi(0,144,52,100,0), midi(0,128,52,0,0)` | **1** |
| 7 | 03 | `morph.setup`'s `255,250` restored | **residue probe red**: *"morph at defaults: cell 20 (col 2, row 2, hardware 24): layer 2 at phase 3, where an untouched run holds 0; rendered [0,0,0] against [1,1,1]"* | **1** |

**Check 7 took three attempts, and the two failures are worth recording.** The
first two patched `glpfs(a,2,252,256-252//@DECAY,0)` with a plain
`String.replace`, which replaces the FIRST occurrence — and the first occurrence
is now inside the header comment this plan added, not in the Lua. The probe was
green because nothing had been broken. It was only red once the anchor included
the surrounding Lua and the script asserted the anchor was unique. **A negative
check that silently patches a comment is a negative check that proves the
opposite of what it claims**, and it is the exact shape of warning 3 in the
brief. Every patch script in this plan asserts its anchor count before writing;
that one did not, twice.

Two comments in `lua-smoke.spec.ts` had been written on the strength of the
false result and were corrected before the commit rather than left standing.

**Every restore was done from a scratch copy with sha256 compared either side**,
never with `git checkout --`, per the Phase 10 warning. `euclid.ts`, `morph.ts`,
`lattice.ts`, `stage.ts`, `touch-guard.spec.ts` and `lua-smoke.spec.ts` all
verified byte-identical after their checks.

---

## MORPH's three clauses, and the plan that owns each

The bench note is *"mapping mode needed in, if something doesn't change don't
send it don't send 0 value, also the LED's colors stuck again"*.

| Clause | Owner | Status |
| ------ | ----- | ------ |
| "the LED's colors stuck again" | **11-02, this plan** | **Answered.** The class-A pair could never reach phase 0, and the class-B guard threw the fast tap away |
| "if something doesn't change don't send it don't send 0 value" | **11-08** | Open. A per-contact last-sent guard, the same idiom 11-08 gives EUCLID, SONAR and STEPS |
| "mapping mode needed in" | **11-09's checkpoint** | Open, as a question. It admits two readings that produce different work |

**MORPH is one third answered.** Nothing here should be read as closing its bench
report.

---

## Deviations from Plan

**1. [judgement, reported] SONAR and GHOST fixed at `252,250` with `glt 42`
rather than `252,247` with `glt 28`.** Both are +0 characters and both land on
phase 0; only one leaves the trail the length the card was designed around. `256
− 252//42 = 250`, so what shipped IS the plan's own parameterised idiom at T=42.
Recorded in both entry headers. Commit `8759554`.

**2. [Rule 2 — missing critical functionality] `DECLARED_EXCEPTIONS` has two rows
and `forge.ts` is the second.** Found by the gate on its first run. See finding
7. Commit `0b7c8db`.

**3. [Rule 1 — bug] GHOST's second-finger erase tested a bare `e==4`.** The
STARTED form of class B, at a site the plan does not list. +7 characters. Commit
`0b7c8db`.

**4. [Rule 2] `forge.ts` and `stage.ts` edited, two files outside the plan's
list.** Each carries its declared-exception reason in its own header, so the
entry teaches before the gate does. Commit `0b7c8db`.

**5. [Rule 2] The residue probe runs at TWO renderings, not one.** Where a decay
freezes depends on the knob, and the default is not the worst; MORPH's broken
pair freezes at phase 3 at the default and renders `[1,1,1]` — caught, but only
just. One rendering would have staked the probe on whichever value an author
happened to make the default. Commit `0be3832`.

**6. [Rule 1 — bug in the probe, four times] The residue probe was wrong in four
ways before it was right**, and every one was found by running it rather than by
reading it: the change gate coalescing the reset tap, the hardware/screen index
conflation, the sample gaps aliasing onto GHOST's repaint cycle, and SNAKE's
black-at-255 tail. All four are documented in the file at the line that fixes
them. Commit `0be3832`.

**7. [Rule 1 — bug] The parity probe's settle and tap point.** 200 ticks measured
CHORUS's watchdog rather than its tap, and the smoke gesture's `TAP` landed where
CONSOLE and QUADRANT both send nothing. Both corrected, and the vacuous-pass hole
closed with a per-entry assertion. Commit `0be3832`.

**8. [reported, not executed] `REQUIREMENTS.md` was not edited.** The plan's
frontmatter carries `[CONT-02, PREV-01, PREV-02]` and **all three are already
ticked complete**, from Phases 4, 8, 9 and 10. This plan strengthens what they
claim rather than closing them, and ticking a ticked box or rewriting a dated
traceability row would be churn. `requirements-completed` is empty in this
SUMMARY's frontmatter for the same reason.

No Rule 4 checkpoints were reached.

---

## Known Stubs

None. Nothing in this plan renders placeholder data or leaves a component
unwired.

---

## For the waves that follow

- **`PREV_FILES` 83 · `PREV_TESTS` 836 · `PREV_E2E` 103 · `BASE_CHECK`-derived
  577 · sweep `4 19` at 112 s · catalog 27 (9 preset + 18 Lua)** are what wave 3
  carries forward.
- **Both classes are now gated, and both gates fail by naming the convention.**
  A wave that authors a new entry with `e>=5` bare, or with a decay pair that
  cannot reach phase 0, will hear about it in a sentence that teaches.
- **11-11 inherits one thing GHOST's +8 does not close.** A code-9 tap sets
  `s.h` and nothing ever clears it, because only a lift does and a coalesced tap
  has none, so GHOST records one frozen point forever instead of entering
  playback. It is invisible in the MIDI — both runs send the same values for a
  single-cell gesture — and it is written in `ghost.ts`'s header. The honest fix
  costs more than the escape and changes what the card means.
- **`chorus.ts` is now the live worked example of the computed decay arm**, cited
  by `decay-idiom.spec.ts` rather than restated in it. GRIDLOCK held that role
  and was deleted by 11-01, which left the arm unexercised for exactly one plan.
- **CHORUS has 137 characters free at its worst knob position**, the tightest in
  the catalog. Any later wave adding to its Setup should cost first.
- **A third entry's knob values moved and the plan named two.** If a later wave
  audits shared-link stability, CHORUS's `bloomSpeed` belongs on that list beside
  EUCLID's `trail` and MORPH's `trail`.

## Self-Check: PASSED

Created file verified present: `src/lib/catalog/touch-guard.spec.ts`. All twelve
modified files verified present and modified in `git diff --name-status 38a7d78
HEAD`. All three commit hashes verified present in `git log --oneline --all`:
`8759554`, `0b7c8db`, `0be3832`. `git status --porcelain` empty before this
SUMMARY was written.
