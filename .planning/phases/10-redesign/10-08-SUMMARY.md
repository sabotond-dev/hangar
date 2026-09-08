---
phase: 10-redesign
plan: 08
subsystem: tune
tags:
  [
    d-06,
    g-07,
    a-11,
    x-05,
    x-06,
    tune-01,
    tune-05,
    share-01,
    share-03,
    colour-lattice,
    two-pass-sweep,
    format-w,
  ]

requires:
  - phase: 10-redesign
    plan: 07
    provides: PREV_FILES 78 / PREV_TESTS 801 / PREV_E2E 97 / BASE_CHECK 576, and the finding that nothing type-checks e2e/
  - phase: 10-redesign
    plan: 01
    provides: BASE_SWEEP 4 19 and BASE_SWEEP_WALL 123 s, taken before the sweep grew
provides:
  - "The colour knob is the whole RGB444 lattice: 4,096 positions, read()/apply() as index <-> RGB444 arithmetic through the vendored quantiseColour, read(apply(state, i)) === i by construction on every colour-bearing preset"
  - "Two passes in three sweep files, with every non-vacuity floor re-derived to a number above EITHER pass alone: reachability 19,502 + 24,576 = 44,078; stamp-roundtrip compiler 44,078 and Lua 50,464 + 184,320 = 234,784; lua-entries 1,728 combinations / 3,456 measurements"
  - "HANGAR_FORMAT_LUA_COLOUR = w, twelve raw bits per colour knob as three base-32 characters. Emitted for the 25 colour-bearing Lua entries; cull and quadrant keep emitting x; x decodes forever, proved against 54 literals captured one commit before w existed"
  - "widgetFor's colour branch is chosen by KIND ALONE (the X-05/X-06 amendment), and KnobView.positions plus view.ts's knobPosition() are the bridge that keeps the rack usable until 10-10's picker"
  - "PREV_FILES 78, PREV_TESTS 801, PREV_E2E 97, BASE_CHECK 577, PREV_SWEEP_WALL 119 s - the carry-forward block for 10-09 onward"
affects: [10-09, 10-10, 10-13, 10-14, tune, share, sweep]

tech-stack:
  added: []
  patterns:
    - "MEASURE THE PIN, DO NOT ASSUME IT: Pass B runs FIRST and hands Pass A the dearest literal it just measured. The assumption (255,255,255) was wrong on five of the six presets - 102,102,102 is the first nine-digit literal in index order and they tie - and only ninepads discriminates, for a reason the spec names"
    - "A FLOOR ABOVE EITHER PASS ALONE. Splitting one enumeration into two makes a floor derived from the sum meaningless; a floor set above the larger single pass can only be cleared when both really ran"
    - "A FIXTURE IS EVIDENCE ONLY IF IT PREDATES THE CHANGE. wild-stamps.json is committed in its own step, before format w exists, and the test asserts that 25 of its 27 entries now emit a DIFFERENT format - so the fixture is proved to be doing work rather than agreeing with itself"
    - "EXEMPT BY FORMAT, NEVER BY RAISING THE CEILING. STAMP_OPTION_CEILING stays 32 and the colour knob is excluded at the assertion, because raising the number would silently remove the guard from every other knob"
    - "WHEN A DATA WIDENING BREAKS A WIDGET, BUILD THE BRIDGE AND NAME ITS REMOVAL. KnobView.positions is documented as 10-10's to delete, and the one external reader goes through a named helper rather than repeating the translation"

key-files:
  created:
    - src/lib/share/fixtures/wild-stamps.json
  modified:
    - src/lib/tune/reachability.sweep.spec.ts
    - src/lib/tune/knobs.preset.ts
    - src/lib/tune/knobs.preset.spec.ts
    - src/lib/tune/knobs.lua.spec.ts
    - src/lib/tune/view.ts
    - src/lib/tune/view.spec.ts
    - src/lib/tune/model.ts
    - src/lib/tune/model.spec.ts
    - src/lib/share/stamp.ts
    - src/lib/share/stamp.spec.ts
    - src/lib/share/stamp-roundtrip.sweep.spec.ts
    - src/lib/catalog/lua-entries.sweep.spec.ts
    - src/lib/ui/Knob.svelte
    - src/lib/ui/TuningRegion.svelte
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The dearest literal is MEASURED per preset, not assumed. It is 102,102,102 on aurora, pinwheel, starfield, radar and joystick - the first index whose three channels are all three digits - and 255,255,255 only on ninepads, whose checkerboard emits a dimmed second copy. With the pin measured, all nine worst-cost figures reproduce 10-UI-SPEC 11.4 exactly; with the six-option palette as the pin, aurora and radar each read one character high"
  - "The Lua half's Pass B is a FORMAT-level enumeration, not a knob-level one, and the asymmetry is the seam between this plan and 10-10. A Lua colour knob still offers its entry's declared literals; what 10-08 lands is a format that carries all 4,096, which is what the picker will need"
  - "KnobView.positions exists because the lattice broke the swatch row. Rendering 4,096 radio inputs was measured breaking thirteen of twenty tuning e2e tests through pointer interception, not merely being slow. The rack shows two swatches - where the card ships and where the visitor is - and the picker at 10-10 removes the bridge"
  - "decodeLuaColour FAILS CLOSED on a colour the knob's own list cannot name, and maps by QUANTISED literal on both sides so that freely authored palettes like 0,200,255 still round-trip through RGB444"
  - "The plan's w/x split of 'twenty-two of the twenty-seven' is wrong and 25/2 is right, confirmed against 10-UI-SPEC 11.4's own sentence - 45 colour knobs across 25 of the 27 entries"

requirements-completed: [TUNE-01, TUNE-05, SHARE-01, SHARE-03]

duration: 115min
completed: 2026-09-08
---

# Phase 10 Plan 08: The 4,096-colour lattice and the two-pass sweep Summary

**The colour knob stopped being a six-swatch palette and became the whole reachable RGB444 lattice,
with `read()` and `apply()` as index arithmetic through the vendored `quantiseColour` rather than
array lookups; the reachability sweep split into a colour-pinned cross-product and a linear colour
dimension and the honest total ROSE, 32,852 to 44,078; format `w` was implemented and is emitted for
the 25 colour-bearing Lua entries while format `x` keeps decoding forever, proved against 54 literals
captured one commit before `w` existed. Every arithmetic figure the plan named reproduced from a real
run, including `ninepads` at 640 of 908 with 268 free and zero of Pass B's 24,576 states over the
wall. 78 files / 801 tests (+0 / +0), 97 e2e (+0), check 577 (+1), sweep `4 19` unchanged at 119 s
against `BASE_SWEEP_WALL` 123 s.**

## Performance

- **Duration:** ~115 min
- **Completed:** 2026-09-08
- **Tasks:** 3 (four commits — the fixture is its own step, by design)
- **Files created:** 1 · **Files modified:** 15 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                     |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------------ |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                          |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                          |
| `PREV_FILES`      | **78**     | **78**     | **+0** — no spec file created, none deleted                              |
| `PREV_TESTS`      | **801**    | **801**    | **+0** — every new assertion landed inside an existing test              |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **unchanged** — re-run in full, 4 files / 19 tests                       |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                          |
| `PREV_SWEEP_WALL` | **123 s**  | **119 s**  | **−4 s**, and the direction is the surprise — see below                  |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                          |
| `PREV_E2E`        | **97**     | **97**     | **+0** — 97 passed, exit 0, 106 s at `--workers 3`                       |
| `BASE_CHECK`      | **576**    | **577**    | **+1**: `src/lib/share/fixtures/wild-stamps.json`. Always 0 / 0          |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                   |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                |

`npm run check` prints one line:
`COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`npm run test:quick | node scripts/check-counts.mjs 78 801` →
*"observed 78 files, 801 tests passed, 1 todo … matches the expected counts"*.

`npm run test:sweep | node scripts/check-counts.mjs 4 19` →
*"observed 4 files, 19 tests passed, 0 todo … matches the expected counts"*.

**`PREV_TESTS` is +0 and the plan asked for one more test.** Task 3 says *"`stamp.spec.ts` gains a
test that says so in those words"*, and the plan's own `<verification>` says the quick delta is
**+0 / +0**. Those collide. The numeric budget wins: the wild-stamp block is a named section inside
`stamp.spec.ts`'s existing format-letters test, with a comment saying why it rides there, and that
file's header sentence — *"eight tests, and the count never moves"* — stays true.

---

## THE THREE WALL CLOCKS, AGAINST `BASE_SWEEP_WALL`

| Run                                 | Wall      | Free memory     | Against 123 s |
| ----------------------------------- | --------- | --------------- | ------------- |
| Full `npm run test:sweep`, task 1   | **87 s**  | 0.79 → 1.07 GB  | **−36 s**     |
| Full `npm run test:sweep`, delivered| **119 s** | 1.57 → 0.69 GB  | **−4 s**      |
| Vitest's own `Duration`, delivered  | 116.92 s  | —               | —             |

Components of the delivered run, from the files' own reports:

| File                              | Wall                             | What it costs                                         |
| --------------------------------- | -------------------------------- | ----------------------------------------------------- |
| `reachability.sweep.spec.ts`      | **113.1 s** cost + 0.0 s ladder  | 44,078 `cost(compile(state))` calls through the minifier |
| `stamp-roundtrip.sweep.spec.ts`   | **1.5 s** compiler + **0.4 s** Lua | 44,078 + 234,784 vectors of pure string arithmetic     |
| `lua-entries.sweep.spec.ts`       | **~12 s**                        | 3,456 `compressScript` + `measureLua` measurements     |

**The direction is the finding, and it is not the one the plan expected.** The plan warned that a
third more work needs a new wall clock recorded; the total work rose 34% and the wall clock **fell
by 4 s**. The reason is in the shape rather than the machine: the single cross-product measured
32,852 states through the WASM minifier, and the two passes measure 44,078 — but 24,576 of those are
Pass B, where only one knob moves and the compiler's own work per state is smaller. At task 1's
option counts, before the lattice, the same restructure ran in **87 s** on 19,538 states. So the
restructure bought back more than the lattice cost, and the 600,000 ms timeout was never approached.

**Free memory is recorded because it has bitten this repository before.** The task-1 sweep started at
**0.79 GB** — inside the 0.8–1.7 GB band `docs/TESTING.md` records three 2026-09-05 timeouts in — and
passed anyway. The delivered run ended at **0.69 GB**. Nothing was retried for memory.

---

## THE FOUR JUDGED NUMBERS, FROM REAL RUNS

### 1. Pass A, Pass B, and the honest total

```
Pass A 19502, Pass B 24576, total 44078 states in 113.1s;
laddered 9 in 0.0s; over budget 0; Pass B colours excluded 0
```

| | today | after | delta |
| --- | --- | --- | --- |
| Pass A (the cross-product, colour pinned) | — | **19,502** | — |
| Pass B (the colour dimension, linear) | — | **24,576** | — |
| **total** | **32,852** | **44,078** | **+11,226, +34%** |

Every per-preset figure agrees with the plan's table, exactly:

| preset | today | Pass A | Pass B |
| --- | --- | --- | --- |
| aurora | 1,440 | **240** | 4,096 |
| pinwheel | 720 | **120** | 4,096 |
| starfield | 60 | **10** | 4,096 |
| radar | 2,880 | **480** | 4,096 |
| joystick | 3,240 | **540** | 4,096 |
| ninepads | 7,680 | **1,280** | 4,096 |
| faders | 960 | **960** | **0** |
| dial | 15,360 | **15,360** | **0** |
| tpad | 512 | **512** | **0** |
| **total** | **32,852** | **19,502** | **24,576** |

### 2. The worst state per preset — and it now reproduces the spec on all nine

| preset | colour knob | spec | **measured** | free | agreement |
| --- | --- | --- | --- | --- | --- |
| aurora | yes | 260 | **260** | 648 | exact |
| pinwheel | yes | 310 | **310** | 598 | exact |
| starfield | yes | 254 | **254** | 654 | exact |
| radar | yes | 451 | **451** | 457 | exact |
| joystick | yes | 544 | **544** | 364 | exact |
| ninepads | yes | **640** | **640** | **268** | exact |
| faders | no | 517 | **517** | 391 | exact |
| dial | no | 707 | **707** | 201 | exact |
| tpad | **no** | **907** | **907** | **1** | exact |

**A disagreement that appeared and then resolved itself, recorded because the resolution is the
lesson.** At task 1, with the colour pinned at the dearest of the SIX palette options, `aurora`
measured **261** and `radar` **452** — each one character above the spec. Both fell to the spec's
figures the moment the lattice landed and the pin became `102,102,102`. The six-option palette simply
did not contain the preset’s genuinely dearest literal; the lattice does. **The plan's instruction to measure
the pin rather than assume it is what turned a one-character disagreement into a match.**

### 3. Zero over 908, printed as a count

`over budget 0` and `Pass B colours excluded 0`, and both are assertions rather than observations:

- `expect(over.map(...)).toEqual([])` — no state in either pass crosses `EVENT_BUDGET`.
- `expect(rows.flatMap(row => row.excluded)).toEqual([])` — **the set of colours the picker would have
  to disable is asserted EMPTY**, not skipped. Today it is empty; the assertion is what makes the day
  it stops being empty visible.
- `expect(EVENT_BUDGET - dearestBearing.worst.used).toBe(268)` — the margin as an **equality**, so it
  cannot shrink quietly. `expect(dearestBearing.entry).toBe("ninepads")` sits beside it.

### 4. The dearest literal per preset — measured, and the assumption was wrong five times out of six

| preset | measured dearest | cost at it (other knobs at defaults) |
| --- | --- | --- |
| aurora | **102,102,102** | 259 |
| pinwheel | **102,102,102** | 308 |
| starfield | **102,102,102** | 240 |
| radar | **102,102,102** | 451 |
| joystick | **102,102,102** | 541 |
| ninepads | **255,255,255** | **593** |

`102,102,102` is lattice position **1,638** — the first index whose three channels are all three
digits, since 102 is the smallest three-digit multiple of 17. It **ties** `255,255,255` on the five
presets that emit their colour once, exactly as 10-UI-SPEC says (*"a card that emits its colour once
charges one character per digit, so every three-digit-per-channel literal ties"*), and the sweep's
argmax takes the first. `ninepads` is the one preset where the tie breaks, and it breaks for the
documented reason: its checkerboard emits a dimmed second copy, and `255,255,255` dims to
`102,102,102` (nine digits) while `102,102,102` dims to `41,41,41` (six) — three characters dearer,
which is why `ninepads`' pin is 255,255,255 and its Pass B worst is **593**, the figure the plan
named.

The spec's four aurora costings also reproduce: `0,204,255` **257**, `255,255,255` **259**, and
`0,0,0` **253** (measured in negative check 2, below).

---

## THE OTHER TWO SWEEPS, MEASURED

```
stamp round-trip sweep - the compiler route, two passes
  Pass A 19502, Pass B 24576, total 44078 vectors, longest payload 17 characters, 1.5s

stamp round-trip sweep - the Lua route, two passes
  Pass A 50464 vectors (format w 50055, format x 382), Pass B 184320 colours, total 234784, 0.4s

lua-entries sweep - 1728 combinations, 3456 measurements;
  the colour dimension is sampled at 27 literals per colour knob
```

| Suite | plan | **measured** |
| --- | --- | --- |
| `stamp-roundtrip`, compiler half | 32,852 → 44,078 | **44,078** = 19,502 + 24,576 |
| `stamp-roundtrip`, Lua half | 276,160 → 234,784 | **234,784** = 50,464 + 184,320, **−15%** |
| `lua-entries` | 701 → 1,728 combinations | **1,728** combinations, **3,456** measurements |

**The Lua half gets cheaper, and that is asserted rather than merely observed.** The plan says: *"if
it does not, the two passes were cross-producted."* So the file now carries
`expect(examined).toBeLessThan(276160)` with that sentence beside it. The shrink is real: lifting
four- and five-option colour knobs out of a product divides more than 45 × 4,096 adds back.

**The two halves' Pass B are different shapes, deliberately.** On the compiler route the lattice IS
the knob, so Pass B enumerates the knob's own 4,096 options through `encodeFor`/`decodeFor`. On the
Lua route the lattice is the FORMAT's capacity and not yet the knob's — a Lua colour knob still
offers the literals its entry declares — so Pass B enumerates the payload space per colour knob
through `readLuaColourPayload`, building the three characters from `STAMP_ALPHABET` directly so the
test states the wire format independently and the module has to agree with it. That asymmetry is the
seam this plan leaves for 10-10, and it is written into the file's header rather than left to be
inferred.

**All five non-vacuity floors re-derived, each to a number above EITHER pass alone:**

| File | old floor | **new floor** | why that number |
| --- | --- | --- | --- |
| `reachability`, `costed` | `>= 16000` | **`>= 40000`** | above Pass B (24,576) and above Pass A (19,502); losing ONE colour knob costs 4,096 and lands on 39,982 |
| `reachability`, `costedA` / `costedB` | — | **`toBe(expectedA)` / `toBe(expectedB)`** | derived from `racked()` independently of the loops |
| `stamp-roundtrip`, compiler | `> 16000` | **`> 40000`** | same derivation |
| `stamp-roundtrip`, Lua | `> 100000` | **`> 200000`** | above Pass B alone (184,320) and far above Pass A (50,464) |
| `lua-entries`, `measured` | `> 0` | **`toBe(combined * 2)`** | derived, so a wave adding a configuration moves no number |

**The 600,000 ms timeout is unchanged everywhere.** `grep -n "600000"` finds it at
`reachability.sweep.spec.ts:460` and `lua-entries.sweep.spec.ts:663`, both untouched.

---

## THE COLOUR SAMPLE, AND WHY 27 IS ENOUGH

`COLOUR_SAMPLE_CHANNELS = [0, 17, 255]`, cross-producted three ways: 0 is the only one-digit lattice
step, 17 the smallest two-digit one, 255 the largest three-digit one. All 27 are multiples of 17 and
therefore colours a picker can really write — asserted, not assumed. The file asserts the sample's
**length-completeness** rather than arguing it:

- every reachable literal length, 3 digits to 9: `[3,4,5,6,7,8,9]`
- every per-channel digit count in every position: `[1,2,3]` for channels 0, 1 and 2
- both corners present: `255,255,255` and `0,0,0`
- every channel on the lattice: `value % 17 === 0`

`:358-384`'s separability passage is **quoted** in the new comment, not restated, exactly as the plan
required.

Enumerating instead of sampling would make this file **184,833** combinations of `compressScript` +
`measureLua`. At the measured 12 s for 1,728, that is roughly 21 minutes for one test.

---

## FORMAT `w`, AND THE FIXTURE THAT PROVES `x` STILL WORKS

**The ordering was the point and it is visible in the log.** `4924ee7` commits
`src/lib/share/fixtures/wild-stamps.json` **alone**, before `b31f292` implements `w`. Fifty-four
records across all 27 hand-authored entries: the defaults vector (payload `null`, because a URL with
no fragment IS the base configuration) and a wild vector with every knob at its last position. The
capture ran through the **unmodified** encoder; every payload begins with `x`.

`stamp.spec.ts` now asserts, in those words, that decoding of `x` is never removed:

- 27 captured `x` literals still land `{ kind: "restored", indices }` with their exact vectors
- 27 captured default vectors still encode to `undefined`
- **25 of the 27 entries now emit a DIFFERENT format**, asserted — which is what makes the fixture
  evidence rather than a round trip of the new encoder against itself

**The `w`/`x` split is 25 / 2, and the plan's "twenty-two of the twenty-seven" is wrong.** Measured:
45 colour knobs across **25** of the 27 entries; `cull` and `quadrant` declare none and keep emitting
`x`. 10-UI-SPEC §11.4 says the same thing in its own sentence (*"45 colour knobs across 25 of the 27
hand-authored entries"*), so the plan contradicts its own source and the source is right. The sweep
counts it from the wire: **format w 50,055 payloads, format x 382**.

**The layout, and why three characters rather than one.** A colour is twelve bits. Base 32 is five
bits per character, so twelve bits is three characters at four bits each — one per channel, top bit
unused. Packing would save nothing (still three characters) and would cost the property that makes
the format readable by hand: character 1 IS red's step, 2 IS green's, 3 IS blue's. Payload length is
`2 + Σ(colour ? 3 : 1)`, measured at 6 characters for `cull` and 13 for `console`, `strip` and
`forge`.

**`decodeLuaColour` maps a stored colour onto a knob position by QUANTISED literal on both sides.** A
Lua palette is authored freely — `0,200,255`, `255,90,0` — and `w` stores RGB444, so `0,200,255` goes
out as `0,204,255` and would match nothing on a raw comparison. A colour the knob's own list cannot
name **fails closed** as `unreadable`; nothing today can produce one, and 10-10 widens the lookup to
the same arithmetic `knobs.preset.ts` already uses.

**`STAMP_OPTION_CEILING` stays 32 and is exempted BY FORMAT, at the assertion, in two files.** The
sweep now also pins the value itself (`expect(STAMP_OPTION_CEILING).toBe(32)`), which it did not
before — see negative check 5.

---

## THE FIVE NEGATIVE CHECKS

| # | Perturbation | Gate | Result |
| - | ------------ | ---- | ------ |
| 1 | one preset removed from Pass A's enumeration | `reachability` test 1 | **red**, naming the shortfall: *"Pass A's enumeration silently shrank: expected 19262 to be 19502"* — 240 states, exactly aurora's Pass A |
| 2 | Pass A pinned at `0,0,0` instead of the measured dearest | `reachability` test 1 | **red on the margin only**, and the table shifted by a measured amount — below |
| 3 | lattice position 1,234 given `r = 5` | `knobs.preset.spec.ts` | **red in TWO tests**, naming the index and the literal: *"aurora.colour option 1234 (5,221,34): expected 210 to be 1234"* and *"aurora.colour has options that compile identically: [ '0,221,34', '5,221,34' ]"* |
| 4 | format `w` forced on every Lua entry, including the two the fixture captured as `x` | `stamp.spec.ts` | **red in THREE tests**, naming `cull`: *"cull at every knob at its first value: 0 colour knob(s) must emit format x: expected 'w' to be 'x'"*, and the fixture's own guard *"no entry changed format, so the fixture is proving nothing: expected 27 to be 25"* |
| 5 | `STAMP_OPTION_CEILING` raised to 4096 | whole suite | **red in exactly two places, and NOTHING ELSE** — recorded in full below |

**Check 2's shift, stated as the plan asked.** With `0,0,0` pinned instead of the measured dearest:

| preset | measured pin | `0,0,0` pin | shift |
| --- | --- | --- | --- |
| aurora | 260 | 259 | **−1** |
| pinwheel | 310 | 308 | **−2** |
| starfield | 254 | 248 | **−6** |
| radar | 451 | 451 | **0** |
| joystick | 544 | 541 | **−3** |
| ninepads | **640** | **628** | **−12** |

**The over-908 verdict does not change** — `over budget 0`, `Pass B colours excluded 0` — and
confirming that is the point: the guard is about the dearest, and the dearest is now measured. What
DOES go red is the margin equality: *"ninepads leaves 280 characters free at its dearest colour, not
268: expected 280 to be 268"*. A guessed pin would have reported a 12-character-optimistic margin and
nothing would have said so. The run also independently reproduces the spec's `0,0,0` costing on
aurora: **253**.

**Check 3's asymmetry, recorded.** The quantise-stability assertion never fired, because the
round-trip assertion above it aborts the test first — the same ordering asymmetry 10-07 observed on
`sort.spec.ts`. That is not a weakness: `read(apply(state, i)) === i` failing is a *stronger*
statement than "position 1,234 is not a fixed point", and it names both the index and the literal.

**Check 5's result, recorded either way as the plan required.**

> With `STAMP_OPTION_CEILING = 4096`, exactly two assertions go red — `knobs.lua.spec.ts` test 2 and
> `stamp-roundtrip.sweep.spec.ts` test 2 — and **both are the direct `expect(STAMP_OPTION_CEILING)
> .toBe(32)` value pin**. Every derived check (`knob.options.length <= STAMP_OPTION_CEILING`) passes
> trivially, because today's widest non-colour knob is 16 and no knob actually truncates. `npm run
> test:quick` reports 1 failed / 800 passed; nothing else in 78 files notices.

**So the value pin is the only guard, and that is worth writing down.** It is also why the exemption
had to be written at the assertion rather than by raising the number: raising it removes the guard
from every knob at once and nothing downstream would have said so. Before this plan the raised
ceiling would have gone red in **one** place; the sweep now pins the value too, so it is **two**.

Every perturbed file was restored by its own inverse edit and confirmed byte-identical with
`sha256sum` before and after — `knobs.preset.ts 3617a6ae…`, `reachability.sweep.spec.ts ae44da34…`,
`stamp.ts 5bac80ba…`, and `knobs.lua.ts` by an empty `git diff --stat`. **No `git checkout`,
`restore`, `stash` or `clean` was run at any point.**

---

## Task Commits

1. **Task 10-08-01: the two-pass restructure, at today's option counts, with the wall clock** — `5ab3e73` (refactor), 1 file.
2. **Task 10-08-02: the lattice colour knob, and the honest 44,078** — `b3f99bb` (feat), 8 files.
3. **Task 10-08-03a: the wild stamps, captured before format `w` existed** — `4924ee7` (test), 1 file, committed alone and first.
4. **Task 10-08-03b: format `w`, format `x` forever, and the two other sweeps** — `b31f292` (feat), 9 files.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — Prettier and ESLint |
| `npm run test:quick \| node scripts/check-counts.mjs 78 801` | *"observed 78 files, 801 tests passed, 1 todo … matches"* |
| `npm run test:sweep \| node scripts/check-counts.mjs 4 19` | *"observed 4 files, 19 tests passed … matches"*, 119 s |
| `knobs.preset.spec.ts` / `view.spec.ts` / `knobs.lua.spec.ts` | **6** / **6** / **6** — none moved |
| `stamp.spec.ts` / `model.spec.ts` / `lua-entries.sweep.spec.ts` | **8** / **10** / **6** — none moved |
| `npm run build` | green, exit 0 |
| `npx playwright test --workers 3` | **97 passed, exit 0, 106 s** — `PREV_E2E` unchanged |
| `grep -n "600000"` in every sweep file | unchanged, two hits, both pre-existing |
| `git diff --stat HEAD -- src/vendor/` | **empty** |
| `git diff --stat HEAD -- src/lib/ui/Coverflow.svelte` | **empty** |
| `git status --porcelain` | empty. `test-results/` removed by hand after every run |

**The e2e suite needed a standalone preview server, and the reason is recorded rather than hidden.**
Two full runs died mid-suite with 50 × `net::ERR_CONNECTION_REFUSED` and `TypeError: fetch failed`
after 11 and 28 tests: Playwright's `webServer` command is `npm run preview` (`vite build` **and**
`wrangler dev`), and at ~1.0 GB free the wrangler process did not survive the run. Starting
`npx wrangler dev --port 4173 --ip 127.0.0.1` by hand first and re-running gave **97 passed, exit 0,
106 s, first attempt**. This is the infrastructure failure 10-05 and 10-07 each flagged the absence
of; it is not a code regression, and the same tree passes cleanly against a server that stays up.

---

## Decisions Made

1. **The pin is measured, not assumed** — and the assumption was wrong on five of the six presets.
2. **The Lua half's Pass B is a format-level enumeration**, and the asymmetry with the compiler
   half's is written into the file header as the seam 10-10 closes.
3. **`KnobView.positions` is a named bridge with a named removal**, because rendering the lattice as
   a swatch row was measured breaking the panel rather than merely slowing it.
4. **`decodeLuaColour` fails closed** on an off-palette colour and matches on the quantised literal.
5. **The ceiling is exempted at the assertion, never raised**, in both files that hold it, and the
   sweep now pins the value itself.
6. **The plan's 22/27 split is corrected to 25/2** against the spec's own sentence.
7. **The new test the plan asked for rides inside an existing one**, because the plan's own +0/+0
   budget outranks it and `stamp.spec.ts`'s header promises the count never moves.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] `knobs.lua.spec.ts` and `view.spec.ts` hold assertions the lattice makes
false, and neither is in the plan's file list**

- **Found during:** Task 10-08-02, first `npm run test:quick` after the lattice landed
- **Issue:** `knobs.lua.spec.ts` test 2 applies `STAMP_OPTION_CEILING` to **both** routes and caught
  the six preset colour knobs at 4,096 — *"a knob has more options than one stamp character: expected
  [ 'aurora.colour (4096)', …(5) ] to deeply equal []"*. `view.spec.ts` asserted
  `widgetFor("colour", ["red"]) === "rail"`, which is the per-configuration fall-through the X-05 /
  X-06 amendment removes. The plan places the ceiling exemption at
  `stamp-roundtrip.sweep.spec.ts:167-172` only; there is a second holder.
- **Fix:** the ceiling exemption is written at **both** assertions, by kind, with the reason inline,
  and the exempted knobs are held to their own domain (`toBe(COLOUR_LATTICE_SIZE)`, and
  `toBe(6)` for how many there are) so the carve-out is not a hole. `view.spec.ts`'s two
  fall-through assertions are kept and **inverted** rather than deleted, with the verdict change
  visible in the suite, plus the amendment's own assertion at `n = 4096` and a stated "no other
  kind's mapping moved".
- **Files modified:** `src/lib/tune/knobs.lua.spec.ts`, `src/lib/tune/view.spec.ts`
- **Committed in:** `b3f99bb`

**2. [Rule 2 — missing critical functionality] The lattice breaks the swatch row, and the picker is
10-10's**

- **Found during:** Task 10-08-02, `npx playwright test e2e/tuning.e2e.ts e2e/tuning-webkit.e2e.ts`
- **Issue:** `Knob.svelte` draws one element per option and `model.ts` materialises one
  `KnobValueView` per option, so a colour knob put **4,096 radio inputs** in the rack. Measured:
  **13 of 20 tuning e2e tests failed**, all with
  `<label class="option"> from <div data-testid="knob-rack"> subtree intercepts pointer events` —
  the row overflows and swallows RESET ALL, SURPRISE ME and COPY LINK. Not a slow row; a broken
  panel.
- **Fix:** `SWATCH_ROW_MAX = 16` in `view.ts`, and `knobViews` shows a **window** above it: the
  card's own position and the visitor's, deduped. `KnobView.positions` carries each slot's real knob
  index so a click still writes lattice position 1,638 rather than window slot 1. Every Lua colour
  knob (four or five options) is untouched. The field and the branch are both documented as 10-10's
  to delete. **20 of 20 tuning e2e tests pass.**
- **Files modified:** `src/lib/tune/view.ts`, `src/lib/tune/model.ts`, `src/lib/ui/Knob.svelte`
- **Committed in:** `b3f99bb`

**3. [Rule 1 — bug] `TuningRegion` reported a window slot as a knob index, and KEEP ON DEVICE went
dead after a write nobody had touched**

- **Found during:** the full `npx playwright test --workers 3` at the end of Task 10-08-03
- **Issue:** `install.e2e.ts:1148` failed — `keep-on-device` disabled where the test requires it
  enabled. `TuningRegion.svelte:425` does `indices[knob.id] = knob.index`, and with the window
  `knob.index` is a **window slot**. Aurora's colour reported as 0 instead of lattice position 95, so
  the install store's `#recomputeArmed` saw a different config, `armed` went false and `keepReason`
  returned `knobs-moved`. **This is the exact class of bug `positions` was introduced to prevent, and
  it escaped into the one consumer outside the widget.**
- **Fix:** `knobPosition(view)` exported from `view.ts` as the single named translation, used by
  `TuningRegion`'s report and by `Knob.svelte`'s `pick`. `model.spec.ts` gained the invariant inside
  its existing first test — for **every** knob, `knobPosition(view) === tuner.indices[id]`, so the
  identity case is covered beside the windowed one — with the measured failure written beside it.
- **Files modified:** `src/lib/tune/view.ts`, `src/lib/ui/TuningRegion.svelte`,
  `src/lib/ui/Knob.svelte`, `src/lib/tune/model.spec.ts`
- **Committed in:** `b31f292`

**4. [Rule 3 — blocking] `knobs.preset.spec.ts` crossed Vitest's 5,000 ms default under full-suite
load**

- **Found during:** Task 10-08-02, `npm run test:quick`
- **Issue:** *"Test timed out in 5000ms"* on test 4. The lattice takes its round trip from ~250
  states to 24,576, and test 5's `compile()` count with it. The whole file is ~3 s run alone; under
  78 files and memory pressure it crossed the default.
- **Fix:** an explicit `120000` ms timeout on both tests, in the idiom `lua-entries.sweep.spec.ts`
  already uses at its own long test, with the reason written out and the rule restated: **nothing is
  sampled or trimmed to fit — `read(apply(state, i)) === i` is required for all 4,096, so the number
  that moves is the timeout.** The sweep project's 600,000 ms is untouched, which is what the
  standing rule protects. Quick-run duration moved 34.75 s → 41.10 s → 34.75 s across the session.
- **Files modified:** `src/lib/tune/knobs.preset.spec.ts`
- **Committed in:** `b3f99bb`

**5. [Rule 1 — bug] The spec's colourless assertion, as written, is false of `faders`**

- **Found during:** Task 10-08-02, writing the A-11 assertions
- **Issue:** `expect(colourTargetFor(stateOf("faders"))).toBe(undefined)` went red with `'sends'`.
  `faders` draws its sends picture, so `colourTargetFor` resolves it — what decides whether a card is
  OFFERED a colour knob is BOTOR's own declaration, which gives `faders` two knobs and neither a
  colour.
- **Fix:** the assertion is on the KNOB TABLE, with the distinction written beside it and both facts
  asserted: `colourTargetFor("faders")` is `"sends"`, `colourTargetFor("tpad")` is `undefined`, and
  all three of `faders`, `dial`, `tpad` declare `[]` colour knobs. `colourTargetFor` answers "which
  field WOULD a colour knob move", never "does this card have one".
- **Files modified:** `src/lib/tune/knobs.preset.spec.ts`
- **Committed in:** `b3f99bb`

**6. [Rule 3 — blocking] The JSON fixture import types each record as its own literal shape**

- **Found during:** Task 10-08-03, `npm run check`
- **Issue:** two `TS2345`s — the union over 27 racks gives every record an optional member for each
  knob id in the catalog, and no structural conversion to `Record<string, number>` reaches it.
- **Fix:** one `WildStamp` type and one assertion at the import boundary, rather than 27 at the use
  sites, with the reason in a doc comment. The runtime shape is checked by the two counts the test
  asserts.
- **Files modified:** `src/lib/share/stamp.spec.ts`
- **Committed in:** `b31f292`

### Departures from the plan's letter, stated rather than smoothed

**7. The plan's `w`/`x` split of "twenty-two of the twenty-seven" is wrong; it is 25 and 2.** Measured
from `luaKnobs`: 45 colour knobs across 25 entries, `cull` and `quadrant` with none.
10-UI-SPEC §11.4 says exactly that in its own prose, so the plan contradicts its source. Every
downstream figure the plan gives — Pass A 50,464, Pass B 184,320 (= 45 × 4,096), 1,728 combinations
(= 647 − 188 + 45 × 27 + 54) — is consistent with 45 and 25 and inconsistent with 22, so the
arithmetic corroborates the correction.

**8. The plan's ninth test in `stamp.spec.ts` rides inside the eighth.** The plan's own verification
block sets the quick delta at +0 / +0 and that file's header promises the count never moves. The
wild-stamp block is a named, commented section with the same assertions it would have had alone.

**9. `docs/PIN-POLICY.md` is not edited.** The plan says *"Note it; 10-14 writes it"*, so item 4's
raised stake — the pin now also decides whether all 4,096 lattice literals fit, and `ninepads`' 268
free characters are the margin it eats into — is logged in `deferred-items.md` for 10-14.

---

**Total deviations:** 6 auto-fixed — 2 × Rule 1 (bug), 1 × Rule 2 (missing critical functionality),
3 × Rule 3 (blocking) — plus three stated departures.
**Impact on plan:** six files outside the plan's list (`knobs.lua.spec.ts`, `view.spec.ts`,
`model.spec.ts`, `Knob.svelte`, `TuningRegion.svelte`, `deferred-items.md`), every one of them
forced by an assertion or a measured breakage rather than chosen. Nothing in the objective was
dropped.

---

## Issues Encountered

**The e2e web server dies under memory pressure.** Twice, at ~1.0 GB free, `wrangler dev` (started by
Playwright's `webServer: npm run preview`) stopped answering mid-suite and every remaining test
failed with `ERR_CONNECTION_REFUSED`. Starting the server by hand and re-running gave 97 passed on
the first attempt. Worth wiring `reuseExistingServer` into the local workflow, or noting it in
`docs/TESTING.md` beside the three 2026-09-05 sweep timeouts, which are the same shape of failure.

**The `browse.e2e.ts` round-trip race did not fire** in the successful run.

---

## Notes for the plans that follow

- **10-09 onward** inherits `PREV_FILES 78` / `PREV_TESTS 801` / `PREV_E2E 97` / `BASE_CHECK 577` /
  `PREV_SWEEP_WALL 119 s`, sweep `4 19`.
- **10-10 owns three removals**, all named in the source: `KnobView.positions`, `SWATCH_ROW_MAX` and
  the window branch in `knobViews` go when the three-rail picker lands. Until then a preset's colour
  is **not editable from the rack** — SURPRISE ME, RESET ALL, the stamp and the default marker all
  still move it.
- **A Lua colour knob's positions are still its entry's palette.** Format `w` carries all 4,096 and
  the sweep proves it, but `luaKnobs` does not yet. Widening it moves 25 entries' shipped literals
  onto the lattice (`0,200,255` → `0,204,255`) and therefore requires regenerating
  `src/lib/catalog/frames.json` by its own `UPDATE_FRAMES=1` procedure. That was deliberately not
  done here; it is in `deferred-items.md`.
- **`ninepads` at 268 free is an equality, on purpose.** A protocol-pin bump that costs three
  characters on the checkerboard's dimmed copy turns it red and names the number. That is the
  behaviour `docs/PIN-POLICY.md` item 4 should describe at 10-14.
- **`STAMP_OPTION_CEILING`'s value pin is the only guard.** Negative check 5 measured that raising it
  breaks nothing else in 78 files. Do not "simplify" the two `toBe(32)` assertions away.
- **`e2e/` is still not type-checked by anything** (10-07's finding, unchanged). `TuningRegion` and
  `Knob.svelte` changed shape this plan and no e2e file names their types, but the rule stands.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 8 is complete. TUNE-01's colour clause is the lattice; TUNE-05 stays proven-unreachable with its
margin recorded as a number that can move; SHARE-01 and SHARE-03 are extended by a new format letter
without breaking a link, and the not-breaking is proved against literals captured before the letter
existed. The picker at 10-10 has the knob, the format and the sweep it needs, and the one bridge it
must remove is named in three places.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

The one created file and all fifteen modified files are on disk, and all four commit hashes resolve
in `git log`: `5ab3e73`, `b3f99bb`, `4924ee7`, `b31f292`. `git diff --stat HEAD -- src/vendor/
src/lib/ui/Coverflow.svelte` returns nothing. `grep -n "600000"` finds the sweep timeout unchanged at
`reachability.sweep.spec.ts:460` and `lua-entries.sweep.spec.ts:663`, and nowhere else.

Every count, wall clock, character cost, exit code, `sha256` and failure message quoted above was
read from a runner's, a compiler's or a probe's own output in this session. The two places this
plan's result disagrees with its instructions are reported with the measurement behind each rather
than smoothed over: the plan's `w`/`x` split of twenty-two entries is 25 and 2, corroborated by its
own downstream arithmetic and by the spec's own sentence; and the plan's ninth `stamp.spec.ts` test
rides inside the eighth, because the plan's own `+0 / +0` budget outranks it. The one-character
disagreement that appeared at task 1 on `aurora` and `radar` is reported together with the
measurement that resolved it, rather than only in its resolved form.
