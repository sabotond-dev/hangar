---
phase: 12-touch-framework
plan: 07
subsystem: catalog
tags:
  [
    touch-library,
    hysteresis,
    expiry,
    system-element,
    lua-host,
    negative-check,
    counts,
    finding,
  ]
requires:
  - phase: 12-touch-framework
    plan: 05
    provides: "PREV_FILES 84 / PREV_TESTS 876 / e2e 87 titles, 106 runs / BASE_CHECK 579 / BASE_SWEEP 4 19 / catalog 26 (9 + 17), and CONSOLE's 56 free at the picker corner that 12-09 must fit a Q call into"
  - phase: 12-touch-framework
    plan: 03
    provides: "The third string on the wire and in the install store: ConfigStrings.system, TunerOptions.systemSetup, and install.svelte.ts's #pageInit as the ONE place the empty string becomes SYSTEM_DEFAULT_SETUP"
  - phase: 12-touch-framework
    plan: 02
    provides: "Element 255 event 0 reachable - fetchAll / writeAll over 255/0, 0/6, 0/0, written in that order"
provides:
  - "TOUCH_LIBRARY: one canonical string, 769 of 908, 139 free, measured under the pinned compressScript after padReady() and a fixed point of it. Six functions - W E Q X A D - plus the R convention, every one with a named caller in this phase"
  - "THE SAME-ID DEFECT CLOSED AND MEASURED: the superseded Q returns nil on a re-press by the same contact id on the same cell (returns [40] where the revision returns [40,40]). Driven in wasmoon, asserted on Q's RETURN VALUE"
  - "The probe's 71/72 boundary held in a real VM across a seven-value band, 68..74, at an effective margin of 3.89 raw units up and 4.11 down"
  - "All four expiry paths release through R - an end code, a same-id re-press, a stale-cell press by another contact, and the Timer sweep - and a contact that keeps reporting is never swept"
  - "LuaHostOptions.system: run after the pristine snapshot and before Setup, and again after every RESTART_WIPE, so a remounted card rebuilds H T C P empty. LuaHost.globalSize() is the read hook that makes emptiness assertable"
  - "host-surface.spec.ts admits LIBRARY_GLOBALS and LIBRARY_CONVENTIONS and scans the library itself: twenty sites, and the host names it reaches asserted EQUAL to glag, glpfs, glt and self:gms"
  - "The tuner lands the library for a Lua entry and the caller's page init for a preset; wire-pin.spec.ts pins the landed page init to TOUCH_LIBRARY verbatim"
  - "A FINDING R MUST BE IDEMPOTENT: Q expires contact i on EVERY onset without asking whether it held anything, so R fires on a first press too"
  - "A FINDING the plan's nine-sample expectation is the research's <9 figure and is false of the shipped <11 window; the VM reads 0,0,0,0,0,0,1,1,1,1"
affects:
  - "12-08 (EUCLID, STEPS, RADAR POINTS, SONAR call Q and X)"
  - "12-09 (CHORUS defines R and calls X; CONSOLE calls Q into its 56 free)"
  - "12-10 (GLIDE calls Q and D)"
  - "12-11 (LUMEN calls Q and A - A's only caller)"
  - "12-12 (the bench row that decides the sweep window; the TESTING.md rewrite)"
tech-stack:
  added: []
  patterns:
    - "A shipped Lua string built from NAMED PARTS, so its cost is auditable per function and the planning arithmetic is asserted rather than copied"
    - "The canonical join is not uniform: the head is concatenated and the functions are space-joined, because that IS the minifier's fixed point"
    - "A second admitted surface in host-surface.spec.ts - the host's names and the library's - with the library's derived from its own source"
key-files:
  created:
    - src/lib/catalog/library.ts
    - src/lib/catalog/library.spec.ts
  modified:
    - src/lib/sim/lua-host.ts
    - src/lib/sim/lua-host.spec.ts
    - src/lib/sim/lua-pad-sim.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/catalog/host-surface.spec.ts
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/device/wire-pin.spec.ts
    - docs/TESTING.md
key-decisions:
  - "The library is 769 of 908 canonical, 139 free - measured, not planned. No fallback was needed and neither A nor D was dropped"
  - "F stays dropped and its 123 characters stay returned: no entry in this phase calls it"
  - "Q expires contact i on every onset UNCONDITIONALLY. The nine-character guard was refused and R's idempotence is the contract instead"
  - "The library's gate is a server spec by choice; the sweep's member list stays 4 19"
  - "A preset still lands the EMPTY page init, not SYSTEM_DEFAULT_SETUP: ladder.spec.ts:275 keeps a firmware default out of src/lib/tune/, and install.svelte.ts's #pageInit is where the substitution lives"
patterns-established:
  - "Run the Lua in a VM before the string is pinned: the VM corrected a figure the plan carried from the research"
  - "Assert a negative check's replacement count, restore by inverse edit, and sha256 either side"
requirements-completed: [CONT-02, PREV-01, PREV-02, TUNE-05, SAFE-02]
duration: 80min
completed: 2026-09-10
---

# Phase 12 Plan 07: The Touch Library Summary

**One string in the system element's Setup - 769 of 908, canonical, six functions each with a
named caller - and the same-id re-press that the superseded sketch swallowed now measured returning
its cell in a real Lua VM.**

## Performance

- **Duration:** 80 min
- **Started:** 2026-09-10T21:56Z
- **Completed:** 2026-09-10T23:15Z
- **Tasks:** 2 of 2
- **Files modified:** 11 (2 created, 9 edited)

## The cost, measured, beside the two planning figures

| Figure | Characters | Where it came from |
| --- | --- | --- |
| **Shipped, canonical** | **769** | `GridScript.compressScript` after `padReady()`, a fixed point of itself. **139 free of 908** |
| Raw source | 770 | Seven segments joined with six single spaces - the plan's own figure, recomputed |
| Superseded sketch | 885 | The planning figure this plan replaces (884 raw) |

**The minifier makes exactly one edit, and it is named rather than absorbed:** the space between
`P={}` and `function W` is the only separator it can drop, because `}` and `f` need none while every
other seam is `end function`. So `TOUCH_LIBRARY` is built as `HEAD + [W,E,Q,X,A,D].join(" ")` and
`library.spec.ts` asserts that the uniform 770-character join **compresses to exactly the shipped
string**. That makes the canonical form a measurement instead of a claim.

`cost = max(compressed, raw) = 769`. No fallback fired: neither `A` nor `D` was dropped, and the
plan's "never `Q W E X`" was never reached.

### Per part, before and after

| Part | Superseded | Shipped | Delta |
| --- | --- | --- | --- |
| header + tables | 9 + 23 = 32 | 9 + 16 = 25 | **-7** (`O={}` and `L=1` left with `F`) |
| `W` | 109 | 109 | 0 |
| `E` | 60 | 56 | **-4** (no `F(i)` call) |
| `Q` | 261 | 282 | **+21** (the self-expiry clause, less `if o then` and the dropped ` and j~=i`) |
| `X` | 74 | 74 | 0 |
| `A` | 150 | 150 | 0 |
| `F` | 123 | **gone** | **-123** |
| `D` | 68 | 68 | 0 |
| joins | 7 | 6 | **-1** |
| **raw total** | **884** | **770** | **-114** |

`884 - 114 = 770`, and `library.spec.ts` test 1 asserts that arithmetic from the parts rather than
carrying the number. The parts also sum independently: `25 + 109 + 56 + 282 + 74 + 150 + 68 = 764`,
plus six joins = 770.

## The nil the superseded `Q` returned, and it is the whole reason this plan differs

Driven in wasmoon before anything was pinned, on the sequence the hardware normally takes - firmware
assigns the lowest free contact id, so after a lost lift the next press is usually **the same id**:

```
contact 0 DOWN (64,64)   cell 40
contact 0 MOVE (65,64)   inside the same cell
contact 0 DOWN (65,64)   the lift never came
```

| Sketch | `Q`'s returns | Releases through `R` |
| --- | --- | --- |
| **Superseded** (`j~=i` scan, no self-expiry) | **`[40]`** - the second press returned **nil** | `[]` |
| **Shipped** (self-expiry first) | `[40, 40]` | `[0, 0]` |

The press vanished and the cell was dead until the finger moved elsewhere. That is the probe's Q6.5
case leaking through the fix meant to catch it, and the test asserts **`Q`'s return value**, not
only that a release fired - the defect was a swallowed press, not a missing release.

## The two cell sequences, as observed

**The probe's own 71/72 boundary** (`lua-smoke.spec.ts`, printed by a green run):

```
edge x:  71, 72, 71, 72, 73, 74, 75, 74, 68, 67
column:   4,  4,  4,  4,  4,  4,  5,  5,  5,  4
overlap: 68, 69, 70, 71, 72, 73, 74 (7 values)
margin:  3.89 up, 4.11 down, against a cell half-width of 7.11
```

**Seven values, 68..74**, exactly as the plan's contract table says. The margin is asymmetric because
the naive boundary sits at `128*5/9 = 71.11` and the switches are at integers: 75 going up is 3.89
past it, 67 coming down is 4.11 - "~3.9, stated as 4" holds, measured.

**The research's nine drift samples, and the figure the VM corrected:**

```
drift x: 14, 15, 14, 15, 16, 15, 20, 24, 26, 30
naive:    0,  1,  0,  1,  1,  1,  1,  1,  1,  2   (4 crossings)
library:  0,  0,  0,  0,  0,  0,  1,  1,  1,  1   (1 crossing)
```

**The plan's stated expectation `0,0,0,0,1,1,1,1,1,2` is the RESEARCH's figure and is false of the
shipped window.** The research measured `<9` (+-8); the probe raised the margin to 3, which makes the
window `<11` (+-10), and at 11 units x=16 is 9 from cell 0's centre of 7 and x=30 is 9 from cell 1's
centre of 21 - both inside the wider band. The library is right and the plan's line was carried
forward without re-derivation. Recorded here, not reconciled.

## The four expiry paths, and the fifth row that proves the sweep is not a kill switch

```
same id, same cell: returns [40,40], releases [0,0]
same id, new cell:  returns [40,41], releases [0,0]
cross contact:      returns [40,40], releases [0,1,0]
timer sweep:        releases [0,0] after 21 X(s,20) calls
still reporting:    releases [0] over 40 sweeps
D(40,2,252):        246 -> 6 -> 0 in 42 ticks
```

The cross-contact release order is `[0, 1, 0]`: contact 1's own onset expiry first, then the stale
contact 0 the cross-contact scan finds on that cell. The "still reporting" row drives a wobbling
finger for forty sweeps and it is **never** released - `Q` stamps `T[i]=C` on every live sample,
including the ones whose cell did not change, so only genuine silence expires a contact. The input is
varied deliberately (x alternating 64/65): the host change-gates its FIFO per contact on
`(event, x, y)`, so a repeated identical MOVE would be dropped before the VM saw it and the probe
would be measuring the gate.

## The finding: `R` must be idempotent

`Q` expires contact `i` on **every** onset without first asking whether that contact held anything.
The guard - `if o and H[i] then` - costs nine characters, and it was refused: with 139 free the
question is not budget, it is which contract is cheaper to keep true. So `R` is invoked on a
contact's **first** press as well as on a re-press, which the release columns above show directly
(a single DOWN on a fresh contact produces one `R` call). An `R` that reads its own note table and
returns when the contact holds nothing is correct; an `R` that sends an unconditional note-off is
not. Written into `library.ts` section 3, where CHORUS will read it in 12-09.

## The six functions, each with its caller

| Name | Contract as shipped | Caller |
| --- | --- | --- |
| `W(v,p)` | one-axis hysteresis: hold cell `p` while `v` is within +-10 of its centre `(p*128+64)//9`, else `v*9//128`. Effective margin ~3.9 units; band 68..74 on the probe's boundary | `Q`, twice |
| `E(s,i)` | expire contact `i`: forget its cell and its stamp, call `R(s,i)` if the entry defined one. Lights and darkens nothing | `Q`, `X` |
| `Q(s,i,e,x,y)` | end code expires and returns nil; on an onset expire contact `i` FIRST, then stamp, then compute both axes with hysteresis, then expire any other contact holding that cell. Returns the cell only when it changed - so an onset always returns one | EUCLID, STEPS, RADAR POINTS, SONAR (12-08), CHORUS, CONSOLE (12-09), GLIDE (12-10), LUMEN (12-11) |
| `X(s,n)` | `C=C+1`, expire every contact whose stamp is older than `n` **Timer calls**. `n` is the caller's | EUCLID, STEPS, RADAR POINTS, SONAR (12-08), CHORUS (12-09) |
| `A(s,i,e,x,y,c,d,h)` | per contact, on `e<4`: CC `c` = x when x moved, CC `d` = `127-y` when y moved, channel `h`. A DOWN primes `P[i]` without sending. `127-y` is the snippet's own inversion | **one**: LUMEN (12-11) |
| `D(n,l,w)` | `glpfs(a,l,w,250,0)` + `glt(a,l,w//6)`. Rate 250 is -6 on the byte ring, so a `w` that is a multiple of 6 lands on phase 0 in `w//6` ticks. **`w` is a byte, so D covers timeouts of at most 42 ticks**; MORPH's `@DECAY` reaches 126 and keeps the inline idiom | **one**: GLIDE (12-10) |
| `R` | a CONVENTION the library calls and does not define. `E` calls it on every expiry path. **Must be idempotent** - see above | **one**: CHORUS (12-09) |

`F` is not in the table because it is not in the library: nothing in this phase calls it, and its
**123 characters** are the single largest reason the shipped string has 139 free. `O` and `L` left
with it, which is the header's `-7`.

## Which route test (c) took for the decay gate, and why

**Route two: the pairing is scanned in `decay-idiom.spec.ts`'s own shape and the arithmetic is then
asserted directly.** The reason is stated in the test rather than left as "by construction":
that gate's evaluator refuses anything it cannot resolve to a literal, and `D`'s starting phase **is
the parameter `w`** while its timeout is `w//6` - so `evalInt` returns null for both and the site
reads as "computed at run time, so never provably 0". The one arm that accepts a computed start,
`derivesTimeout`, matches GRIDLOCK's `(256-p)//R` shape, and `w//6` is not it.

So test 3 splits both calls' arguments at depth 0, asserts the pair names the same cell and the same
layer, asserts shape 0 and rate 250 and `w` and `w//6` by name, and then walks every legal `w`:
`(w + 250*(w//6)) mod 256 = 0` for every multiple of six from 6 to 252, the longest timeout is
**42**, and `w = 7` is asserted to strand - so the multiple-of-six rule is a rule and not a
tautology. `lua-smoke.spec.ts` then runs `D(40,2,252)` in the VM and reads the layer down to 0.

The class-B gate runs over the string too, with needles assembled from fragments: **zero** "contact
ended" sites (the library's end test is the negation of the live test, which names 9 by admitting
everything at or above it), exactly one onset written `e==4 or e>8`, and exactly one `e==4` in the
whole string.

## The `R` convention and the window's owner

The window is the caller's argument in `X(s,n)`, never a library constant, and the reason is written
where the callers will read it (`library.ts` section 5): the firmware's change gate
(`grid_ui_touch_store_input:127-131`) drops repeats, so a *perfectly* still finger sends nothing.
Q1 shows a real finger wobbles on every sample but nothing guarantees it, and a window shorter than
the longest genuine hold would release a held chord. CHORUS keeps its 20-call watchdog at 100 ms
(2 s). **The bench row in 12-12 asks the user to hold a chord still for ten seconds and report
whether it releases, and that answer moves the callers, not the library.**

Q7's phantoms are recorded as a hardware finding and explicitly not this library's to fix: a palm
that loses its lift and keeps jittering and sending is reported as live, and no timeout can see it
as quiet.

## The host order, before and after

```
before  install(): registerGlobals -> SELF_PRELUDE -> timer wrapper -> PRISTINE_SNAPSHOT -> Setup -> TOUCH_DISPATCH
after   install(): registerGlobals -> SELF_PRELUDE -> timer wrapper -> PRISTINE_SNAPSHOT -> system -> Setup -> TOUCH_DISPATCH

before  restart(): RESTART_WIPE -> SELF_PRELUDE -> Setup -> TOUCH_DISPATCH
after   restart(): RESTART_WIPE -> system -> SELF_PRELUDE -> Setup -> TOUCH_DISPATCH
```

`HOST_GLOBALS` does not move: **16**, unchanged. The library names four of them - `glag`, `glpfs`,
`glt` and `s:gms` - and `host-surface.spec.ts` asserts the resolved set **equals** those four rather
than merely containing them. `glp` left with `F`; `math.abs` was never in either sketch.

**`LuaHost.globalSize(name)` is new**, and it is a deviation the plan did not name (Rule 3): the
plan asks the restart test to prove `H`, `T` and `P` are **empty tables**, and neither `globalKeys()`
nor `selfNumber()` can see inside a global table. It is the third read hook, a sibling of the other
two, and its header says why the observable has to be the size and not the existence.

**`O` is not asserted.** The plan's interfaces block lists `H, T, O, P`; `O` belonged to `F` and left
with it in the same revision, so the test asserts `globalSize("O")` is **undefined** instead - a
name the library does not define cannot be asserted empty.

## Counts, as carried names plus deltas

| Name | Carried (12-05) | Delta | Observed |
| --- | --- | --- | --- |
| `PREV_FILES` | 84 | **+1** (`library.spec.ts`) | **85** |
| `PREV_TESTS` | 876 | **+8** | **884** |
| sweep | `4 19` | +0 / +0 **by choice** | `4 19` |
| `BASE_CHECK` | 579 | +2 files (`library.ts`, `library.spec.ts`) | **581 files, 0 ERRORS 0 WARNINGS** |
| catalog | 26 (9 + 17) | +0 | 26 |
| e2e | 87 titles / 106 runs | **+0, declared and not re-run** | not measured |

The eight: `library.spec.ts` **3**, `lua-smoke.spec.ts` **+2**, `lua-host.spec.ts` **+1**,
`host-surface.spec.ts` **+1**, `model.spec.ts` **+1**. `wire-pin.spec.ts` stayed at **4**.

`npm run lint` clean (exit 0). `git diff --quiet -- src/lib/catalog/frames.json` passes: the library
defines functions and lights nothing, so no picture moved and nothing was regenerated.
`src/vendor/` unmoved, `firmware-oracle.spec.ts` unedited, `.planning/ROADMAP.md` untouched.

**e2e was not run.** No file under `e2e/` changed and the plan's own verification block does not ask
for it; the `+0` term is a declaration carried forward, not a measurement. A reader who needs the
number should take it from 12-05.

## The negative checks: five run, four red, one green with a reason

| # | Mutation | Result | What it printed |
| --- | --- | --- | --- |
| 1 | `W`'s window `<11` -> `<8` (2 replacements) | **RED** | the drift reads `0,1,1,1,1,1,1,1,1,2` - it toggles on the first sample instead of holding |
| 2 | the superseded `Q` (`j~=i` scan, no self-expiry), 1 replacement | **RED**, exit 1 | `expected [ 40 ] to deeply equal [ 40, 40 ]` - **the nil, measured** |
| 3 | the cross-contact scan removed, 1 replacement | **RED**, exit 1 | `expected [ 0, 1 ] to deeply equal [ 0, 1, 0 ]` - the squatter is never released |
| 4 | `system` moved before `PRISTINE_SNAPSHOT`, nothing else | **GREEN, exit 0** | see below |
| 4a | that, **plus** the restart re-run removed | **RED**, exit 1 | `expected [ 1, 1, 0 ] to deeply equal [ 0, 0, 0 ]` - **H still holds a contact across a remount**, which is the symptom the plan predicted |
| 4b | the restart re-run removed with `system` in its shipped place | **RED**, exit 1 | the restart raised: `Q` is nil, so the re-run of Setup could not see the library |
| 5 | the `LIBRARY_NAMES` admission removed from the resolver, 1 replacement | **RED**, exit 1 | `the touch library at index 34: "W" is a bare call the HANGAR Lua host does not register` |

**Check 4 is the one the plan wrote, and it comes back green.** Suspecting the check rather than the
code (the phase's own standing warning): the emptiness of `H` across a remount is delivered by
`restart()` **re-running the library**, whose head re-creates all four tables, not by the wipe. The
snapshot position decides something different - whether the wipe *removes* the library at all - and
4a and 4b separate the two guarantees and are both red. The plan's single check conflates them.
Recorded, not reconciled.

Every mutation was applied with an asserted replacement count and restored by inverse edit;
`library.ts`, `lua-host.ts` and `host-surface.spec.ts` were each sha256-identical after restore
(`620a3f88...`, `9a55cdcd...`, `2c67cfae...`). No `git checkout`, `restore`, `stash` or `clean` was
run at any point.

## Deviations

**1. [Rule 3 - Blocking] `wire-pin.spec.ts` had to move, and the plan's file list does not name it.**
Its Lua test pinned the landed `system` to the empty string **for every entry** - 12-03's own pin,
with a comment saying "12-07 is where this stops being empty for a Lua entry". Landing the library
made it false, and the full quick run caught it. It now pins the landed page init to `TOUCH_LIBRARY`
verbatim and additionally asserts that string is its own minified form, so the identity of what
reaches 255/0 is still gated. **Test count unchanged at 4.**

**2. [Rule 3 - Blocking] `LuaHost.globalSize()` added.** The plan's restart assertion is not
expressible with the host's existing read hooks. See "The host order" above.

**3. [Rule 2 - Missing critical check] `host-surface.spec.ts`'s new test also refuses an entry that
assigns a single-capital GLOBAL the library owns.** Folded into the new test rather than added as a
ninth, so the declared `+8` holds. It is a real hazard: the catalog does use single capitals - CULL's
`M` and `C`, LUMEN's `H`, QUADRANT's `C` and `M`, CONSOLE's, SNAKE's and WHEELS' `P` - and every one
of them is a `local`, which shadows nothing outside its own event body. **QUADRANT is why the check
resolves locals with `localsIn` rather than looking at the six characters before the `=`:** it opens
`local C={@HUE}` and re-assigns `C={255,0,0,...}` inside a branch, which a naive scanner reports as a
global write. That false positive was caught by the check going red on its first run.

**4. [Rule 1 - Plan figure corrected] The nine-sample expectation.** See "The two cell sequences".

**5. Task 02's `lua-host.ts` step landed in task 01's commit.** Task 01's two `lua-smoke` tests drive
the `system` option, so the option had to exist for them; the plan licenses the merge ("both tasks
are one commit if that is simpler - say which"). The split taken was: commit 1 = the library, its
gates, the two smoke tests and the host option; commit 2 = everything else. Both commits leave the
tree green.

## What the plan asserts that the tree does not support

1. **"the nine samples expect cells 0,0,0,0,1,1,1,1,1,2"** - the research's `<9` figure, false of the
   shipped `<11` window. The VM's answer is `0,0,0,0,0,0,1,1,1,1`.
2. **"`H`, `T`, `O`, `P` are empty tables after restart"** - `O` does not exist; it left with `F` in
   the same revision that the plan's own objective describes.
3. **"12-03 left `system: SYSTEM_DEFAULT_SETUP` everywhere"** - it did not. 12-03 left
   `system: options.systemSetup ?? ""` in `model.ts` and put the substitution to
   `SYSTEM_DEFAULT_SETUP` in `install.svelte.ts`'s `#pageInit`, because `ladder.spec.ts:275` refuses
   `lib/protocol` to every file under `src/lib/tune/`. So **a preset still lands the empty string**
   and the plan's "a preset's equals `SYSTEM_DEFAULT_SETUP`" cannot be asserted on the tuner's side
   of that line. `model.spec.ts` asserts the empty string and names the one place it becomes the
   firmware default; `install.spec.ts` from 12-03 already proves that half.
4. **The negative check for the host order does not go red as written.** See check 4 above.
5. **`lua-smoke.spec.ts`'s line numbers in the interfaces block** (`121, 432, 572, 3407, 3660, 4825`)
   are stale by a few lines; the six `createLuaHost` sites are at 128, 439, 579, 3361, 3614 and 4526
   on the tree as found. Five take the library; `presetParity` deliberately does not, and says so.

## Notes for the next plan

- **`Q`'s call shape costs 44 characters** as the plan states: `local m=Q(s,i,e,x,y)if not m then
  return end`. `X(s,20)` is 7, `A(s,i,e,x,y,@CC,@CC+1,@CH)` is 26, `D(n,2,252)` is 10.
- **CONSOLE has 56 free at the picker corner** (12-05) and 12-09 must fit a `Q` call into it. Known,
  not acted on here.
- **An entry's `R` must be idempotent.** 12-09 is the first plan that writes one.
- **A card that calls the library needs the host's `system` option**, which `createLuaPadSim` now
  passes for every hand-authored entry and `lua-smoke`'s five hand-built hosts pass too. A sixth
  hand-built host added later without it will raise on the first finger, which is what
  `host-surface.spec.ts` and the smoke gate are there to catch.

**No device was touched, nothing was deployed, and nothing in this plan is hardware-verified.** Every
semantic above was proved in wasmoon; the bench is the only instrument that sees touch correctly and
12-12 hands it the rows.

## Self-Check: PASSED
