---
phase: 11-bench-corrections
plan: 13
subsystem: catalog
tags:
  [strip, re-layout, two-controls, origin-lock, ten-bit-unlock, budget, legibility]
requires:
  - phase: 11-bench-corrections
    plan: 12
    provides: "the PREV_FILES 84 / PREV_TESTS 864 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline, the one-fifth-brightness track idiom, and D-11-12-b - that nothing in the tree asserts a card is legible"
  - phase: 11-bench-corrections
    plan: 11
    provides: "the finding that no test asserts what a demo path depicts, and the rule that an entry which does not rest black cannot have one at all"
  - phase: 11-bench-corrections
    plan: 07
    provides: "the full-scale lesson - CONSOLE's h*127//8 topping out at 111 because the mute row owned the top of the travel - which is the divisor rule this entry applies twice"
  - phase: 11-bench-corrections
    plan: 02
    provides: "the two live gates, decay-idiom.spec.ts and touch-guard.spec.ts, and the blessed spellings of the live filter and the onset"
provides:
  - "A STRIP re-laid-out as TWO controls: the big fader over rows 0..7 and a crossfader on row 8, each on its own controller, with every gesture locked at its onset to the control it started on"
  - "The measured correction to the plan's ten-bit reasoning: the unlock is worth nothing to a control that owns a WHOLE axis and worth fourteen codes to one that owns a fraction of it - the test is ownership, not continuity"
  - "D-11-13-a: src/lib/sim/lua-host.ts keeps ONE _coordMax for both axes while firmware has two, so an entry that unlocked one axis alone would be simulated wrongly and nothing would say so"
  - "The measured proof that the plan's THREE-control reading DOES NOT FIT - 1,088 of 908 at the picker corner, 180 over, in a Setup-only architecture"
  - "Sixteen NEGATIVE controller values found on the wire by a probe, with every gate in the tree green, and the eleven-character clamp that closes them"
  - "The first legibility assertion in the repository, stated as SHAPE and naming no colour - a narrow answer to D-11-12-b and a worked example of what a wider one could look like"
affects: [11-15, 11-16]
tech-stack:
  added: []
  patterns:
    - "A per-contact ORIGIN LOCK: s.o[i] is written at the onset and every later sample of that contact goes to the same control, so two controls that share an edge cannot interfere"
    - "A divisor derived from the share of an axis a control owns - 910 for the fader that owns eight rows of nine, none at all for the crossfader that owns the whole width"
    - "A legibility claim asserted as SHAPE rather than colour, so it survives two colour knobs a visitor may set to the same value"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/strip.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/frames.json
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/11-bench-corrections/deferred-items.md
key-decisions:
  - "TWO CONTROLS, NOT THREE, against the plan's own must-haves: 'two faders, one crossfader at the bottom and the big one' is a count followed by an apposition naming the two things counted, and the three-control reading contradicts its own 'two faders' while leaving 'the big one' without a referent"
  - "The three-control reading was COSTED rather than argued away - 1,088 of 908, 180 over - so a future wave that wants it starts from a measurement and knows the price is a Timer and an `animated` reclassification"
  - "The ten-bit unlock SURVIVES, and the plan's stated reason for keeping it is wrong: continuity is not the test, axis ownership is. The crossfader owns the whole x axis and sends x//8 - literally what a locked axis would have reported - while the fader owns eight rows of nine and would lose fourteen of the 128 codes without it"
  - "BOTH axes are unlocked although only y needs it, because the Lua host models one _coordMax for both and an entry that unlocked y alone would be simulated with a ten-bit x it does not have on the module"
  - "The origin lock ships at 61 characters, and its own bug - a fader branch that can now see coordinates past its last row - was closed with glim at eleven more rather than by dropping the lock"
  - "The vernier knob keeps the id `vernier` as a deliberately stale name, because wild-stamps.json pins STRIP's captured xn33333 on it"
  - "Tags UNCHANGED after the histogram was read: `precise` survives seven bits because both controls resolve all 128 codes of a 7-bit controller, which no other entry in the catalog does"
patterns-established:
  - "A wave that re-authors an entry re-measures that entry's row in docs/HARDWARE-AUDITION.md and says whether the row was already stale - four rows checked in four waves, one stale"
requirements-completed: [CONT-02, CONT-03, TUNE-01]
duration: 40min
completed: 2026-09-10
---

# Phase 11 Plan 13: STRIP re-laid-out, the axes split, and the plan's third control priced at 180 over Summary

**The bench note reads "two faders, one crossfader at the bottom and the big
one". That is a COUNT followed by an APPOSITION NAMING THE TWO THINGS COUNTED,
and the plan reads it as three controls. The three-control layout was written
out and measured anyway rather than argued away: 1,088 characters of 908 at the
RGB444 picker corner, ONE HUNDRED AND EIGHTY OVER, in a Setup-only
architecture. The two-control layout ships at 875 with 33 free, and a probe of
it found SIXTEEN NEGATIVE CONTROLLER VALUES on the wire with every gate in the
tree green.**

## Performance

- **Duration:** 40 min, one executor session
- **Tasks:** 2 of 2
- **Files modified:** 6, across two commits

---

## THE COUNT, WHICH IS THE ONE THING THIS WAVE DECIDED AGAINST ITS OWN PLAN

> STRIP: this is just an XY pad, it should be two faders, one crossfader at the
> bottom and the big one, sending midi independently

**Parsed:** *"two faders"* is the count. *"one crossfader at the bottom and the
big one"* is an appositive with exactly two members, and the idiom *"one X and
the big one"* contrasts the first member against the second. So: **fader one is
the crossfader at the bottom, fader two is the big one. TWO.**

The three-control reading — two vertical faders **plus** a crossfader — has to
discard the sentence's own *"two faders"*, and it leaves *"the big one"* with no
referent at all.

**The plan reads it as three**, in its must-haves (*"STRIP is two faders and a
crossfader… independently of the other two"*), in its interfaces (*"`@CC`,
`@CC+1`, `@CC+2`"*) and in its success criteria. **The executor's own prompt
reads it as two**, twice, and states the acceptance test in those terms:
*"Two controls on one pad, each sending its own MIDI, neither moving when the
other does."*

**Two ships.** Both because the prompt is the later and more specific direction
and because it is the better parse. **And the rejected reading is PRICED rather
than dismissed** — see the layout table below.

**This also happens to be the tightest reading of the note's first clause.**
*"This is just an XY pad"* is a complaint that x and y were tied into one
number; splitting them into one control per axis is the minimal, exact fix, and
it is what two controls are.

---

## THE BUDGET, RE-MEASURED, AND THE PLAN'S CORNER IS WRONG AGAIN

Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`. The **RGB444 picker corner** is every colour knob at
`255,255,255` and every other knob at its longest declared value.

### STRIP before a character moved

|                              | Setup   | free    | Timer |
| ---------------------------- | ------- | ------- | ----- |
| defaults                     | **638** | 270     | 0     |
| all-longest declared         | 646     | 262     | 0     |
| all-shortest declared        | 634     | 274     | 0     |
| **RGB444 picker corner**     | **662** | **246** | **0** |

**THE PLAN'S OBJECTIVE QUOTES THE DEFAULTS CORNER.** *"Budget: 638 Setup of 908,
270 free"* is the figure at the knobs' default positions — not even the
all-longest declared corner (646 / 262) that the entry's own header quoted. At
the picker corner, the one the 908 gate actually reads, the Setup was **662 and
the free space 246**, twenty-four fewer than the plan budgeted against.

**STRIP is the ELEVENTH entry checked and the SEVENTH found quoting a corner
that is not the picker corner** — after CONSOLE, FORGE, STEPS, POMODORO, STAGE
and SHUTTLE. It is the first of the seven whose plan quoted the *defaults*
corner rather than the declared one. **Ten headers have never been checked.
11-16 owns the sweep.**

### The layouts, costed as Lua before a line was authored

Written out and run through `measureLua` with nothing committed. All at the
picker corner.

| Sketch | Layout                                                                        | Setup    | free     |
| ------ | ----------------------------------------------------------------------------- | -------- | -------- |
| **1**  | **two controls: fader rows 0..7 full width, crossfader row 8, origin-locked**  | **864**  | **44**   |
| 1b     | the same **without the origin lock**                                          | 803      | 105      |
| 2      | two controls, **crossfader two rows deep** (7 and 8), fader on rows 0..6       | 864      | 44       |
| 3      | **THE PLAN'S THREE CONTROLS**: big fader cols 0..5, narrow cols 7..8, xf row 8 | **1088** | **−180** |
| 4      | sketch 1 with **the ten-bit unlock dropped**                                   | 820      | 88       |

*(Sketch 2's raw first measurement was 875 because its draft carried an
`elseif true then` where sketch 1 had a plain `else`; the eleven characters are
removed above so the two are compared on their layouts.)*

**SKETCH 3 DOES NOT FIT, AND BY A WIDE MARGIN.** 180 characters over, in an
entry whose Timer is empty. It *can* be made to fit — 11-12's move, putting the
repaint in a Timer that re-derives the picture from state, would take 400-odd
characters out of the Setup — but **any entry with a stored Timer classifies as
`animated`**, which the plan's own objective says a card of static faders should
not be. **A request that cannot fit is a finding, not a failure**, and this one
is reported with its number so a future wave that wants three controls starts
from a measurement rather than from an argument.

**Sketch 2 was rejected on legibility and travel, not on price** — it costs the
same. A second row buys a crossfader **no resolution at all**: it reads x, and
height is target area rather than travel. It costs the fader an eighth of its
picture, and the user called the other control *"the big one"*.

### STRIP, shipped

|                              | Setup   | free   | Timer |
| ---------------------------- | ------- | ------ | ----- |
| defaults                     | **857** | 51     | 0     |
| all-longest declared         | 865     | 43     | 0     |
| all-shortest declared        | 853     | 55     | 0     |
| **RGB444 picker corner**     | **875** | **33** | **0** |

**Net at the picker corner: +213.** The Setup is a fixed point of
`compressScript` at the defaults and passes `checkSyntax`; the sweep gate is
green across all 1,176 combinations.

Sketch 1 measured 864 and the shipped entry is **875**, because the probe of the
shipped layout found a bug and the fix costs eleven characters. That is the next
section.

---

## SIXTEEN NEGATIVE CONTROLLER VALUES, FOUND BY A PROBE AND NOT BY A GATE

**The origin lock buys its own bug**, and it is worth stating as a general shape
rather than as a typo: *locking a contact to a control means that control's
branch now sees coordinates outside its own region* — precisely the samples the
unlocked layout would have handed to the other control.

STRIP's fader owns rows 0..7, so y in 0..910, and its value is
`(910-y)*127//910`. Under the lock, a finger that starts on the fader and runs
off the bottom keeps feeding that expression y values up to 1023. Driven through
the real Lua host, a drag from y = 800 to y = 1023:

```
drag off the bottom: 32 messages, controller 1,
  values 15,14,13,...,2,1,0,-1,-2,-3,...,-14,-15,-16
```

**Sixteen negative controller values on the wire, no error raised anywhere, and
every gate in the tree green** — the entry compiled, fitted, syntax-checked,
passed both 11-02 gates and passed the sweep. `glim((910-y)*127//910,0,127)` is
the fix; it is eleven characters; and the same drag now reads
`16 messages, controller 1, values 15..0`.

This was found by writing a throwaway probe and reading what it printed, which
is the only reason it is in the entry rather than in a bench report.

---

## THE TEN-BIT UNLOCK: KEPT, AND THE PLAN'S REASON FOR KEEPING IT IS WRONG

The plan says: *"Decide deliberately whether the unlock survives, and the answer
is probably yes for one of the three controls… It matters only for continuous
output. A crossfader read as a continuous position is continuous output."*

**Measured, that is backwards.** The criterion is not continuity, it is **what
fraction of an axis a control owns**:

| Control        | Owns                   | Locked axis (0..127)                      | Unlocked (0..1023)     |
| -------------- | ---------------------- | ----------------------------------------- | ---------------------- |
| **Crossfader** | the WHOLE x axis       | 128 raw positions → **all 128 codes**     | 1024 → **all 128**     |
| **Fader**      | 8 rows of 9 (y ≤ 910)  | 114 raw positions → **114 of 128 codes**  | 911 → **all 128**      |

Firmware reports a locked axis as 0..127 by dividing the native 0..1023 by
eight. **A control that owns a whole axis and sends seven bits is therefore
already at full resolution**: unlocking multiplies the input by eight and the
code divides it straight back down. The shipped crossfader says so *in the
code* — it sends **`x//8`**, character for character what firmware would have
handed it had the axis stayed locked.

**The fader is the customer.** Its ninth row belongs to the crossfader, so on a
locked axis its travel is 114 of the 128 raw positions and fourteen codes are
unreachable at every position of the control. Unlocked, all 128 are reachable —
and the shipped test measures exactly that, **128 distinct values, 0..127**.

**Cost: 44 characters** (864 against 820 on the pre-clamp draft), including the
wider literals `1024` and `910` force over `128` and `113`.

**HANGAR THEREFORE STILL HAS ITS ONLY WORKED EXAMPLE OF `txma`/`tyma`, AND IT IS
STILL STRIP'S.** `grep -rn "txma\|tyma" src/lib/catalog/entries/` returns nine
lines: three in `strip.ts` (two of them prose, one the Lua at `:268`), and six in
`forge.ts`, `lattice.ts` and `lumen.ts` — all six of those being prose saying it
is the wrong answer for a cell-grid card. **The technique survives, and it now
survives with a better-stated reason than it had.**

The old header's arithmetic is retained and is still correct as far as it goes:
7-bit quantisation locates a nine-cell column boundary to within 0.07 of a cell,
unlocking improves that to 0.009, and no grid card should ever spend it.

### D-11-13-a — and this is why BOTH axes are unlocked when only y needs it

Firmware has two independent calls. **HANGAR's preview has one field.**
`src/lib/sim/lua-host.ts:713-719` is a single `axisMax` handler behind both
names, writing `this._coordMax`, and `enqueue` clamps **both** x and y against
it. An entry that wrote `self:tyma(1023)` alone would run in the browser with a
ten-bit x it does not have on the module — **every `x*9//1024` in it would map
the whole pad into the leftmost column on real hardware while looking perfect in
the preview**, with nothing red anywhere.

**Fifteen characters buys agreement between the simulator and the firmware.**
STRIP unlocks both, and the divergence is filed as `D-11-13-a` with a concrete
proposal rather than fixed here: STRIP is the only entry in the catalog that
unlocks either axis today, so nothing is currently broken by it.

---

## WHAT STRIP IS NOW, AND WHAT IT LOOKS LIKE

**Rows 0..7, all nine columns: the big fader.** Value
`glim((910-y)*127//910,0,127)` on `@CC`, bar height `k = v*9//128` over the eight
body rows — nine heights over eight cells, including none-lit at 0 and all-eight
at 127. Lit cells `@BARC`, unlit `@RAILC`, both layers, **phases written once in
Setup and never again**.

**Row 8, all nine columns: the crossfader.** Value `x//8` on `@CC+1`, marker
column `x*9//1024`. The whole row carries `@XFC` with the marker at phase 255 and
its eight neighbours at **51 — one fifth**, which is 11-12's track idiom rather
than CONSOLE's.

**Every gesture is locked at its onset to the control it started on.** `s.o[i]`
is written when `e==4 or e>8 or s.o[i]==nil` and read on every later sample of
that contact.

Measured, at the defaults, with the entry's own colours:

```
AT REST
  rows 0-3  [0,24,49] x9        the rail
  rows 4-7  [0,198,253] x9      the bar, four rows of eight
  row 8     [50,35,11] x4  [253,178,59]  [50,35,11] x4
```

Lit against rail is a factor of eight; marker against track is a factor of five.

**The two controls are DIFFERENT SHAPES as well as different hues**, which is
what the test asserts and why it can: both hues are knobs a visitor may set to
the same value, and no knob can make a solid block of uniform rows look like a
line with one bright cell in it.

---

## The counts, as a carried name plus a delta

| Name          | Carried (11-12)             | Observed                                              | Delta                              |
| ------------- | --------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `PREV_FILES`  | 84                          | **84**                                                | **+0**                             |
| `PREV_TESTS`  | 864                         | **866**                                               | **+2** — exactly the declared term |
| `PREV_E2E`    | 86 source titles / 105 runs | **86 source titles**                                  | **+0** (the suite is not run here) |
| `BASE_CHECK`  | 580                         | **580**, `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`  | **+0**                             |
| sweep members | `4 19`                      | **`4 19`**                                            | **+0**                             |
| catalog       | 27                          | **27**                                                | **+0**                             |

`npm run test:quick` exits **0**: *"84 passed (84) / 866 passed | 1 todo (867)"*.
`check-counts.mjs 84 866` exits **0**; `84 864` exits **1**, *"tests: observed
866, expected 864"*. **Both were run and both are reported.**
`npm run test:sweep | node scripts/check-counts.mjs 4 19` exits **0**.
`npm run lint` clean. `grep -c "test(" e2e/*.e2e.ts` totals **86**.

**Both tests are `lua-smoke.spec.ts` 20 → 22**, which is where 11-09.2, 11-10,
11-11 and 11-12 each put an entry-pinned test. The plan names that file directly.

### THE QUICK RUN FAILED ONCE BEFORE THE BUILD, AND THE REASON IS REPORTED

`src/lib/og/build.spec.ts` read the **previous** build's Open Graph head and
compared it against the new description: *"strip: expected 'The whole pad is one
long fader, with…' to be 'Slide up the pad for the big fader an…'"*. That is the
gate working — a description change without a rebuild is a stale social preview
— and `npm run build` followed by a second `npm run test:quick` is green at
84 / 866. **Both runs are reported rather than only the passing one.**

### The sweep totals, re-observed and all unmoved

| Sweep readout                 | Carried                                             | Observed  | Moved? |
| ----------------------------- | --------------------------------------------------- | --------- | ------ |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358**   | identical | **no** |
| Lua route round trip          | Pass A **49,824** (w 49,424, x 382), Pass B 118,784, total **168,608** | identical | **no** |
| `lua-entries`                 | **1,176** combinations, 2,352 measurements           | identical | **no** |
| kind cross-product            | 1,296 combinations, worst **906 of 908**             | identical | **no** |

**A SEVENTH independent confirmation that compiler Pass A cannot move for a
hand-authored Lua entry**, and the Lua-route Pass A did not move either — it
counts knob POSITIONS, and this rewrite kept all five knobs at exactly their old
value counts. STRIP's own row reads `passA 16 passB 12288 format w payload 13
characters`, unchanged.

---

## THE MEASUREMENT PROVING THE TWO CONTROLS SEND INDEPENDENTLY

`lua-smoke.spec.ts` test 21, *"drives STRIP's two controls on their own
controllers, and neither on the other's"*. Printed by the test from live runs:

```
STRIP independence, plan 11-13:
  at rest: fader rows [73,73,73,73,451,451,451,451]
  at rest: crossfader row [96,96,96,96,490,96,96,96,96]
  crossfader driven: 128 messages, controller [2], fader bar unmoved at 4
  dragged up out of the crossfader: 88 messages, controller [2]
  fader driven: 128 messages, controller [1], marker unmoved at column 7
  dragged off the bottom of the fader: 16 messages, controller [1]
```

**Four drives, and the last two are the ones that matter.**

1. **The crossfader driven across its whole row: 128 messages, controller 2 and
   nothing else**, and the fader's bar is still at the height Setup gave it. The
   "unmoved at 4" is asserted non-vacuously — the test first asserts the bar is
   open at all, so "did not move" cannot be satisfied by a card that draws
   nothing.
2. **A contact that BEGINS on the crossfader and is dragged the entire height of
   the fader**: 88 messages, **controller 2 only**, and the bar is still at 4.
   The finger crossed all eight fader rows.
3. **The fader driven down the rows it owns: 128 messages, controller 1 and
   nothing else**, and the crossfader's marker is still where drive 2 left it.
4. **The overshoot** — a contact that begins on the fader and runs off the bottom
   and across the crossfader row, **sweeping x by 520 units** while it does:
   16 messages, **controller 1 only**, and **the marker did not move a cell**.

**Every drive moves its coordinate on every step**, because the host's own change
gate silently drops a repeated `(event, x, y)` per contact — a probe built out of
identical samples would be defeated by the host rather than answered by the
entry. That is this phase's third standing warning, honoured by construction, and
the message counts are asserted above zero so no drive can pass by sending
nothing.

### And the full-scale half

`lua-smoke.spec.ts` test 22, *"carries both of STRIP's controls from 0 to 127,
and never outside seven bits"*:

```
STRIP full scale and seven bits, plan 11-13:
  fader      controller 1: 128 messages, 128 distinct, 0..127, all seven-bit
  crossfader controller 2: 128 messages, 128 distinct, 0..127, all seven-bit
  overshoot  controller 1: 128 messages, 0..127 (a pre-clamp draft reached -16)
```

**THE FOURTEEN-BIT LOSS IS RECORDED AS AN ASSERTION AND IT IS ASSERTED FIRST.**
Every emitted value must fit seven bits before anything else is checked, so that
re-introducing the vernier — or mode 1 — is a deliberate edit to that clause
rather than a silent regression. **It is first for a reason found in 11-10:** a
control emitting 0..255 would also fail *"reaches 127"*, and a check that reddens
on the wrong clause leaves its own clause untested.

---

## Each stream's divisor, and where it came from

| Control        | Owns                | Boundary  | Value expression                 | Reaches       |
| -------------- | ------------------- | --------- | -------------------------------- | ------------- |
| **Fader**      | rows 0..7 of nine   | y ≤ **910** | `glim((910-y)*127//910,0,127)`   | 0 and 127, all 128 codes |
| **Crossfader** | the whole x axis    | y > 910   | `x//8`                           | 0 and 127, all 128 codes |
| Bar height     | the eight body rows | —         | `k = v*9//128`, row lit when `r >= 8-k` | 0..8 lit cells |
| Marker column  | the nine columns    | —         | `c = x*9//1024`                  | 0..8          |

**910 is BOTH the boundary and the divisor**, and the test asserts they are the
same number rather than reading them separately: the fader's last row and the
scale that maps that row to zero are one fact. `y*9//1024 == 8` iff `y >= 911`,
so rows 0..7 are exactly y in 0..910.

**The crossfader has NO divisor and that is the derivation**, not an omission: a
control that owns a whole axis needs no scaling, and the contrast with the
fader's 910 is what makes "derive it from what the control owns" a rule rather
than a slogan. **This is the CONSOLE lesson applied twice** — `h*127//8` over a
reachable h of 0..7 topped out at 111 because the mute row owned the top of the
travel, and 11-07 fixed it to `//7`.

---

## What was borrowed from `console.ts`, named rather than reinvented

1. **The rail-and-level treatment.** A bright level colour over a dim body, so
   the control reads as a fader with a body rather than a bar floating in
   nothing, and a **third colour spent on a functional marker** rather than on
   decoration — CONSOLE's mute cap, STRIP's crossfader.
2. **The one-pass gated repaint.** Every cell written exactly once, never
   erase-then-paint, because firmware has no double buffer and a two-pass
   repaint can tear; and the repaint is gated on the drawn quantity changing.
3. **The full-scale lesson**, which is the one that cost CONSOLE a bench note.

**One thing was borrowed from 11-12 instead**, and it is said in the header: the
crossfader's track carries its own colour at **one fifth brightness**, which is
SHUTTLE's resting-legend idiom. CONSOLE's unlit body cells are the level colour
at phase **0** — black — and a crossfader whose unmarked cells are black is a
single dot, and a dot is not a strip.

---

## The first legibility assertion in this repository

D-11-12-b says nothing in the tree asserts that a card is legible, and 11-12
proved it by giving forward and reverse one colour and watching the whole tree
stay green. **Two controls on one pad have the same failure available to them:
they can read as ONE picture.**

The assertion added here is about **shape**, and it names no colour:

- each of the fader's eight rows must be **uniform across all nine columns** — a
  fader is a block, not a dot;
- the fader must draw exactly **two states**, and the lit rows must form **one
  contiguous run ending at the bottom row** of its region;
- the crossfader's row must draw exactly two states with **exactly one** cell at
  the brighter one;
- the crossfader's track must be **visible at rest** (brightness > 0), and the
  marker must stand at more than **twice** the track.

**That is a narrow gate.** It proves the two controls draw *different* pictures;
it does not prove either picture is *readable*. **D-11-12-b stands**, and the
amendment recorded in `deferred-items.md` says so and offers this as the worked
example a wider gate should start from rather than reinvent.

---

## Both gates, green, with NO new rows in either table

| Gate                                              | Rows before      | Rows after | Result        |
| ------------------------------------------------- | ---------------- | ---------- | ------------- |
| `touch-guard.spec.ts` `DECLARED_EXCEPTIONS`       | 2 (stage, forge) | **2**      | green, 3 tests |
| `decay-idiom.spec.ts` `KNOWN_VIOLATIONS`          | 0                | **0**      | green, 3 tests |

The live filter is the blessed spelling
`if e~=1 and e~=4 and e<9 then return end`, which `isLiveTest` classifies as live
and test 2 skips by construction. The onset beside it is
`if e==4 or e>8 or s.o[i]==nil then`, and the scanner reads it as its own chain —
`e==4` joined to `e>8` by `or`, with the `s.o[i]==nil` clause breaking the run —
so **test 2 examines it and confirms it admits the fast tap** rather than
skipping it. **The chain is a pure disjunction, so no parenthesis is
load-bearing here**; that was checked rather than assumed, because `and` binds
tighter than `or` and the trap 11-12 documented is one clause away.

The decay gate has nothing to check and that is by construction: this entry
writes no `glt`, no `glf` and no `glpfs` at all. **No keeper, no decay, no
countdown to freeze, no rate to wrap.**

**`PARITY_ALLOWANCES` is untouched and still empty.** Test 5 reports
`strip: fast tap 2, slow tap 2` — identical, with no allowance row, because a
fader has nothing to release and code 9 arrives through the live filter as a
normal sample.

---

## `frames.json` DID move, and what it pulled in with it

**The fixture runs each entry at its defaults with no gesture, and a re-layout
changes what the Setup paints at rest — so unlike the six waves before 11-12,
this one is on the far side of that line.** It moved, and each consequence was
re-derived rather than assumed.

| Property                          | Carried | Re-derived  | Moved? |
| --------------------------------- | ------- | ----------- | ------ |
| `nonZeroBytes` at all five ticks  | 163     | **171**     | **yes** |
| `sha256` at all five ticks        | `755bc054…` | **`be22c58f…`** | **yes** |
| `animating` at all five           | false   | **false**   | **no** |
| `motion` in `listing.ts`          | `static` | **`static`** | **no** |
| `restsBlack`                      | false   | **false**   | **no** |

**171 non-zero bytes of 243 at every tick**, identical at all five, because the
entry stores no Timer: the picture is what Setup painted and nothing advances.
`animating` is **false**, so `motion` stays `static` and the `quiet` line stays
required — it moved, to *"The bar and the crossfader rest where you left them;
nothing here moves on its own."* (83 characters).

`git diff --stat src/lib/catalog/frames.json` is **10 insertions, 10 deletions**
— five ticks × two fields, STRIP's rows only. `frames.spec.ts` was then re-run
**without** `UPDATE_FRAMES` and is green at 5 tests, which is the proof rather
than the regeneration.

### restsBlack, the demo path and the OG image

**`restsBlack` stays FALSE**, so the `restsBlack` pair is still GHOST and MORPH,
`docs/TESTING.md:676` and `docs/INSTALL-RUNBOOK.md:102` are both still true, and
neither was touched.

**The demo path was CHECKED, not assumed, and there is none.** `DEMO_PATHS` holds
exactly two keys, `ghost` and `morph`, and `listing.spec.ts` fails any key whose
entry does not rest black. **STRIP rests lit, so it is on the side of that line
where it cannot have one**, and `src/lib/sim/demo.ts` is byte-untouched
(`git diff --quiet` exits 0). 11-11's finding — that nothing asserts what a demo
path depicts — does not bite here, because there is nothing to depict.

**The OG image is therefore STRIP's resting picture, and it was inspected by eye
after `npm run build`:** a half-open cyan fader four rows deep over a dim navy
rail, and beneath it an amber bottom row with one bright cell at its centre.
**Two controls, unmistakably two pictures, in a static social preview.** That is
the whole card at rest and there is nothing about it a gesture would add.

---

## The copy, counted by script

|        | String                                                                                                    | Length  |
| ------ | --------------------------------------------------------------------------------------------------------- | ------- |
| before | *"The whole pad is one long fader, with a fine row along the bottom for the last few numbers."*              | **89**  |
| after  | *"Slide up the pad for the big fader and along the bottom for the crossfader; each sends its own controller."* | **106** |

The cap is **110** (`catalog.spec.ts`). Changed in **both** `entries/strip.ts`
and `listing.ts`; `listing.spec.ts` asserts the two equal in both directions.

**The word "vernier" is gone**, from the copy and from the labels, and it was
never a word a visitor knew. The sentence is gesture-first, names both controls
and names the independence, and its semicolon matches SHUTTLE's and GHOST's
neighbouring lines.

**The `quiet` line moved too**, because STRIP's `motion` is `static` and
`listing.spec.ts` requires one: *"The bar and the crossfader rest where you left
them; nothing here moves on its own."* — 83 characters, plural where the old one
was singular.

---

## The tags, checked BEFORE the question was answered

**Unchanged**: `["mixing", "precise", "still"]`.

**The histogram, computed over all 27 listing rows against the closed vocabulary
in `facets.ts`, before deciding:**

| Facet     | Histogram                                                                       | Sum    |
| --------- | ------------------------------------------------------------------------------- | ------ |
| **FOR**   | modulation 7, show 5, mixing 3, sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 | **27** |
| **FEELS** | generative 12, expressive 11, readable 11, playable 8, **precise 6**, **still 6** | **54** |

Identical before and after this wave, because no tag moved.

**THE `precise` QUESTION THE PLAN RAISES IS REAL AND THE ANSWER IS THAT THE TAG
SURVIVES.** The plan's worry: *"`precise` may have been STRIP's honest FEELS tag
because it was 14-bit… moving it off `precise` takes that term to 5, below the
floor"*. Measured, the tag is still honest and no floor collision arises:
**both of STRIP's controls resolve EVERY ONE of the 128 codes of a seven-bit
controller across their whole travel**, which no other entry in the catalog does
— CONSOLE's strips give eight values each, LATTICE and FORGE are quantised to
cells. STRIP is still the catalog's precise card; it is precise at a smaller
scale, and **the new test is what turns that from a preference into a fact**.

**`mixing` is stronger than it was** — a fader and a crossfader is literally a
mixing pair, where one long fader was mixing by analogy. **`still` is untouched**:
no Timer, nothing advancing.

---

## The shape character: proved before and after, not asserted

|             | knobs | ids                                   | value counts  | total | shape |
| ----------- | ----- | ------------------------------------- | ------------- | ----- | ----- |
| **before** (`git show HEAD:…`) | 5 | cc, channel, bar, vernier, rail | `[4,4,4,4,4]` | 20    | **`n`** |
| **after**   | 5     | cc, channel, bar, vernier, rail       | `[4,4,4,4,4]` | 20    | **`n`** |

`(5 × 7 + 20) mod 32 = 55 mod 32 = 23`, and `STAMP_ALPHABET[23]` is `n`. **No new
knob, no changed value count and no changed id.**
`decodeFor(STRIP, "xn33333")` returns
`{"kind":"restored","indices":{"cc":3,"channel":3,"bar":3,"vernier":3,"rail":3}}`
— the capture in `wild-stamps.json` still lands **restored**. **The POMODORO
tripwire is not spent.** `git diff --quiet HEAD -- src/lib/share/stamp.ts src/lib/share/fixtures/wild-stamps.json`
exits **0**.

**ONE KNOB ID IS NOW A STALE NAME ON PURPOSE, and the file says so.** The
crossfader's colour knob is still `vernier`, although there is no vernier and
its label reads *"Crossfader colour"* and its token is now `@XFC`.
`wild-stamps.json` keys STRIP's two records on that id and `stamp.spec.ts`
asserts the decoded indices equal them, so renaming it would break a fixture
whose whole value is that it was never regenerated. SHUTTLE's `arc` and `rest`
and CHORUS's `@SPREAD` carry the identical note. **The labels carry the meaning;
the ids are history.**

**No knob's four VALUES moved either**, and that was checked rather than assumed:
at every one of the four indices the bar's hue and the crossfader's hue already
differ — cyan against amber, orange against white, green against magenta,
magenta against green — because the old palette was chosen so a fine row would
not read as more bar, and a crossfader must not read as more fader for the same
reason. `@CC`'s four values are also unchanged, which matters: mode 1 forced them
into 0..31 because it sent the low byte on `@CC + 32`, **that constraint went
with mode 1**, and keeping the values anyway means an old stamp still decodes to
the same four controllers.

---

## The three negative checks, with both exit codes, AND ONE OF THEM CAUGHT ITSELF

**Every plant was restored from a scratch copy with `sha256` compared either
side. No `git checkout`, `git restore`, `git stash` or `git clean` was run at any
point.** `strip.ts` reads `cb5f34c5…b72a6` before every plant and after every
restore, four times over.

| #      | Plant                                                                       | Exit                | Reddened on                                                                                                         |
| ------ | --------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **1**  | the fader branch ALSO sends `@CC+1` from x — the axes recombined            | **1** (restored 0)  | the independence test, **naming both controllers**: *"strip: THE FADER SENDS ON 1 AND ON NOTHING ELSE. Observed [1,2]"* |
| **2**  | the crossfader shifted `x//4`, so it emits 0..255                           | **1** (restored 0)  | the SEVEN-BIT clause by name: *"…and 128 is outside 0..127"*                                                        |
| **3**  | the fader's numerator cut from 127 to 120, so it tops out short             | **0 — GREEN**       | **NOTHING. The plant landed in a COMMENT.**                                                                          |
| **3b** | the same plant, targeted at the SETUP STRING                                 | **1** (restored 0)  | the full-scale clause, naming the observed maximum: *"A CONTROL MUST REACH THE TOP OF ITS RANGE. Observed maximum 120 on controller 1 over 121 messages"* |

### Check 3 came back green and the check was at fault, which is this phase's first standing warning cashed in

The plant was a single `String.replace` of `(910-y)*127//910` → `(910-y)*120//910`.
`String.replace` with a string needle replaces the **first** occurrence, and the
first occurrence of that expression in `strip.ts` is **in the header comment at
line 66**, where the entry explains the negative-value bug. `grep -c` confirmed
it: one hit, in prose, none in the Lua.

**A COMMENT PARTICIPATED IN A MEASUREMENT** — the phase's fourth standing warning,
in the other direction from the one it usually means. The tree was never green
about a short fader; it was green about an unchanged fader. Re-planted against
`else local v=glim((910-y)*127//910,0,127)` it reddens exactly as predicted, on
the clause it was aimed at, naming the observed maximum.

### And check 3b required a test change to reach its own clause

The first draft of `stripGeometry` parsed the fader with
`/glim\(\((\d+)-y\)\*127\/\/(\d+),0,127\)/` — pinning the numerator at 127. Under
plant 3b that regex would not match and the test would have reddened on *"the
fader must still scale, AND CLAMP"*, **on the shape of the source rather than on
the wire**. That is 11-10's finding — a check that reddens on the wrong clause
leaves its own clause untested — so the numerator was deliberately left free
before the plant was run, with a comment saying why. **What the numerator has to
be is measured on the wire, not read out of the source.**

The same reasoning reordered the assertions in test 22: seven bits is checked
before full scale, so plant 2 reddens the seven-bit clause rather than
*"reaches 127"*.

---

## Deviations from Plan

### 1. [judgement, reported] TWO controls, where the plan's must-haves say three

- **Found during:** task 01, before any code
- **Issue:** the plan's `must_haves`, `interfaces` and `success_criteria` all
  specify three controls on three controller numbers. The executor's prompt
  specifies two, twice, and states the acceptance test in those terms.
- **Decision:** two ships, and the reason is grammatical rather than a
  preference — *"two faders, one crossfader at the bottom and the big one"* is a
  count plus a two-member apposition naming what was counted. **The rejected
  reading was written out and MEASURED rather than dismissed: 1,088 of 908, 180
  over.** If the user meant three, the next wave starts from that number and
  from the knowledge that the price is a Timer and an `animated`
  reclassification.
- **Files modified:** `src/lib/catalog/entries/strip.ts`
- **Commit:** `485670c`

### 2. [Rule 1 - bug] Sixteen negative controller values, found by a probe

- **Found during:** task 01, first behaviour probe of the shipped layout
- **Issue:** the origin lock routes a contact that started on the fader to the
  fader branch even after it passes y = 910, and `(910-y)*127//910` floors
  negative there. Measured: `-1` through `-16` on `@CC`, no error, every gate
  green.
- **Fix:** `glim(...,0,127)`, eleven characters. The regression is now pinned by
  test 22's overshoot sweep.
- **Files modified:** `src/lib/catalog/entries/strip.ts`
- **Commit:** `485670c`

### 3. [Rule 3 - blocking] Two of task 02's three files moved in task 01's commit

- **Found during:** task 01
- **Issue:** the plan puts `listing.ts` and `frames.json` under task 02. Both are
  coupled to the entry and leave the tree red if they move separately:
  `listing.spec.ts` asserts the entry's description and the listing's are equal
  in both directions, and `frames.spec.ts` re-samples every entry live.
- **Fix:** both moved in task 01's commit. This is the same deviation 11-11 and
  11-12 each recorded.
- **Files modified:** `src/lib/catalog/listing.ts`, `src/lib/catalog/frames.json`
- **Commit:** `485670c`

### 4. [Rule 3 - blocking] Task 01's negative check needs task 02's test, so all three ran in task 02

- **Found during:** task 01
- **Issue:** the plan asks task 01 to run a plant and *"expect the independence
  test in task 02 red"*. That test does not exist during task 01.
- **Fix:** all three plants ran after the test landed. All three are reported,
  with both exit codes, and one of them found a fault in itself.
- **Commit:** `a23b40c`

### 5. [Rule 2 - missing critical functionality] The audition's row 15 tested a claim this card no longer makes

- **Found during:** task 02
- **Issue:** row 15 read *"This is where the two-message claim is checked, and it
  is the only place it can be"* — about `mode: 1` expanding into `@CC` and
  `@CC + 32`. There is no mode 1 in this entry any more, so the row asked a bench
  operator to check a wire behaviour that no longer exists.
- **Fix:** row 15 **rewritten** rather than a row 24 added, for the reason 11-11
  and 11-12 both gave: `audition.spec.ts` pins `ROW_COUNT = 23` and its test
  title spells "twenty-three". It now carries **(a)** a hardware cross-check of
  the full-scale claim the ten-bit unlock rests on, **(b)** the independence
  check driven on real hardware where a finger has width, and **(c)** the
  ungatable one: hand somebody the module and ask them what the two things are.
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `a23b40c`

### 6. [Rule 1 - bug] The audition's STRIP budget row moved, and was NOT stale first

- **Found during:** task 02
- **Issue:** the row read **638 / 0**, which this wave makes wrong.
- **Fix:** moved to **857 / 0** (the table is measured at default knob
  positions), with the provenance paragraph saying plainly that the old row **was
  accurate for the entry that carried it** — unlike GHOST's, which 11-11 found
  stale by fifteen. `D-11-10-b` is amended: **four rows checked in four waves,
  one stale, fourteen unchecked.**
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `a23b40c`

**No other rule fired.** No missing dependency, no broken import, and no
architectural question — the entry stayed inside its one event and its existing
knob rack.

---

## Everything the plan asserts that the tree does not support

1. **THE OBJECTIVE'S BUDGET QUOTES THE DEFAULTS CORNER.** *"638 Setup of 908,
   270 free"* is the figure at the knobs' defaults. At the RGB444 picker corner —
   the one the 908 gate reads — STRIP's Setup was **662**, leaving **246** free.
   The plan budgeted the design against twenty-four characters that were not
   there. **STRIP is the eleventh entry checked and the seventh confirmed
   quoting a corner that is not the picker corner.**

2. **THE ASK IS FOR TWO CONTROLS, NOT THREE.** The plan's must-haves, interfaces
   and success criteria all say three. The sentence says two, and the executor's
   prompt says two. Deviation 1 above.

3. **THE THREE-CONTROL READING DOES NOT FIT.** 1,088 of 908 at the picker corner
   in a Setup-only architecture. The plan does not anticipate this; it budgets
   three streams against 270 free that were in fact 246.

4. **THE PLAN'S REASON FOR KEEPING THE TEN-BIT UNLOCK IS WRONG, THOUGH ITS
   CONCLUSION IS RIGHT.** *"Keep it for a control whose output is genuinely
   continuous — most plausibly the crossfader."* Measured, the crossfader is the
   one control it buys nothing: it owns the whole x axis, so a locked axis
   already gives it all 128 codes, and the shipped code says so by sending
   `x//8`. **The criterion is axis ownership, not continuity.**

5. **NOTHING IN THE PLAN ANTICIPATES THAT THE HOST CANNOT MODEL ONE UNLOCKED
   AXIS.** `D-11-13-a`. The plan invites an entry to unlock a single control's
   axis; doing so would be simulated wrongly with nothing red anywhere.

6. **THE PLAN'S TASK 01 NEGATIVE CHECK CANNOT RUN IN TASK 01.** It requires a
   test that task 02 adds. Deviation 4.

7. **`docs/HARDWARE-AUDITION.md` ROW 15 IS NOT MENTIONED BY THE PLAN AND WAS
   FALSIFIED BY IT.** The row's whole subject is the mode-1 two-message
   expansion, which the redesign removes.

8. **`src/lib/sim/lua-smoke.spec.ts`'s header still opens "Thirteen tests"**, and
   the file now carries **22**. **Not corrected here**, for the same reason
   11-10, 11-11 and 11-12 left it: it is one of the stale header counts **11-16
   owns**, and correcting one would make the rest look checked.

---

## Invariants, each proved by a command

| Claim                                        | Command                                                              | Result                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| both gates green, no new rows                | `decay-idiom.spec.ts`, `touch-guard.spec.ts`                          | **green, 3 + 3**; tables 0 and 2, unchanged                            |
| `frames.spec.ts` green with no `UPDATE_FRAMES` | run in the server project after the regeneration                    | **green, 5 tests**                                                      |
| `src/vendor/` untouched by this plan         | `git diff --stat HEAD -- src/vendor/`                                 | **empty**. No manifest row declared                                     |
| `src/vendor/` unmoved since 11-04            | `git diff --stat 4131ff5 HEAD -- src/vendor/`                         | the recorded **four-file** output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited | `git diff --quiet HEAD -- …`; run                                     | **exit 0**; green                                                       |
| `upstream-manifest.json` untouched (**13th** wave) | `git diff --quiet HEAD -- …`                                    | **exit 0** — the four mislabelled *"free at its worst knob position"* rows stand for 11-16 |
| configs and roadmap untouched                | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0**                                        |
| `stamp.ts` and `wild-stamps.json` untouched   | `git diff --quiet HEAD -- …`                                         | **exit 0**                                                              |
| `demo.ts` untouched, and STRIP has no path    | `git diff --quiet HEAD -- src/lib/sim/demo.ts`; `DEMO_PATHS` read     | **exit 0**; keys are `ghost` and `morph` only                          |
| the repository still has a `txma`/`tyma` example | `grep -rn "txma\|tyma" src/lib/catalog/entries/`                   | **9 lines**; the only Lua one is `strip.ts:268`                        |
| shape character `n` before and after          | knob rack read off `git show HEAD:…` and off `CATALOG`               | `[4,4,4,4,4]`, `(5*7+20)%32 = 23 -> n` **both times**                   |
| the captured stamp still restores             | `decodeFor(STRIP, "xn33333")`                                        | `{kind: "restored", indices: {…}}`                                      |
| `svelte-check`                                | `npm run check`                                                       | **580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS**                |
| lint                                          | `npm run lint`                                                        | **clean** (prettier + eslint)                                           |
| build                                         | `npm run build`                                                       | **exit 0**; writes only gitignored paths (`build/`, `static/og/`, `.svelte-kit/`) |
| quick suite after the build                   | `npm run test:quick`                                                  | **84 files / 866 tests + 1 todo, exit 0**                              |
| e2e term `+0`                                 | `grep -c "test(" e2e/*.e2e.ts`                                        | **86**; the suite is **not run** by this plan                          |
| no Playwright suite was running at any commit | no Playwright run happened at all                                     | —                                                                       |
| canonical form and syntax                     | `lua-entries.sweep.spec.ts` tests 1, 3, 6                             | **green** across 1,176 combinations                                     |
| no sibling repository touched                 | none read or written                                                  | —                                                                       |
| nothing hardware-verified                     | no agent connected to or wrote to a device                            | —                                                                       |
| nothing deployed                              | no `wrangler`, no `npm run deploy`                                    | —                                                                       |
| tree clean                                    | `git status --porcelain`                                              | empty before this SUMMARY                                               |

Five scratch measurement specs were used (`zz-measure`, `zz-sketch`,
`zz-sketch2`, `zz-shape`, `zz-behave`) and **deleted before any commit**; they do
not appear in the file count, and `npm run check` reads 580 with them gone.

---

## WHAT IS NOT CLAIMED

**Nothing here is hardware-verified.** *"Sending midi independently"* was asked
for by a person at a pad, and **no agent connected to a device, wrote to a
device, or deployed anything.** Independence proved against a simulated touch
stream is a claim about a simulated touch stream; a real finger has width, and a
drag across the boundary between the two controls is exactly where an origin lock
would show a seam a probe cannot feel.

**And the ten-bit claim rests on the simulator's model of the sensor.** The
assertion that the fader reaches all 128 codes is arithmetic over coordinates the
host generates; the module is the thing that actually has the sensor. Row 15(a)
of `docs/HARDWARE-AUDITION.md` is the cross-check.

**Whether the re-layout ANSWERED the note is not claimed at all.** Negative
check 2 in 11-12 established that an illegible card is fully green, and the
shape assertion added here narrows that gap without closing it — it proves the
two controls draw different pictures, not that a stranger can tell which is
which. That is row 15(c), and only a bench closes it.

---

## Commits

| Hash      | Message                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `485670c` | `feat(11-13): STRIP re-laid-out as two independent controls, with the fourteen bits named as the price` |
| `a23b40c` | `test(11-13): four drives that prove independence, the fourteen-bit loss written as an assertion, and a comment that ate a plant` |

---

## Carry-forward for the next wave

**`PREV_FILES` 84 · `PREV_TESTS` 866 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 580 · sweep members `4 19` · catalog 27**

**Sweep totals, re-observed and all unmoved:**

- compiler route **Pass A 20,782**, Pass B 24,576, **total 45,358**
- Lua route **Pass A 49,824** (format w 49,424, format x 382), Pass B 118,784, **total 168,608**
- `lua-entries` **1,176 combinations, 2,352 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908**

**Entry headers or plans found quoting something other than the RGB444 picker
corner: now SEVEN** — CONSOLE, FORGE, STEPS, POMODORO, STAGE, SHUTTLE and
**STRIP (corrected here)**. STRIP is the **eleventh** entry checked; four of the
eleven were correct only by the ARC/MORPH/LUMEN/GHOST accident of already
declaring `255,255,255`. **Ten headers have never been checked. 11-16 owns the
sweep.**

Suite-running plans in this phase remain **five**: 11-01, 11-05, 11-08.1, 11-15,
11-16.

**Six open items handed forward:**

1. **`D-11-13-a` — the Lua host keeps ONE `_coordMax` for both axes.** New.
   Firmware has `touch_x_max` and `touch_y_max` independently; the host has one
   field behind both names and `enqueue` clamps both coordinates against it. An
   entry that unlocked one axis alone would be simulated wrongly with nothing
   red. STRIP is the only entry that unlocks either axis today, and it pays
   fifteen characters to unlock both.
2. **The plan's THREE-CONTROL READING, priced at 1,088 of 908.** New, and it is
   the number a future wave needs if the user meant three. Making it fit means a
   Timer, and a Timer means `animated`.
3. **`D-11-12-b` is AMENDED, not closed.** The shape assertion added here is the
   first legibility claim in the tree and it is narrow: it proves two controls
   draw different pictures, not that either is readable.
4. **`D-11-12-a` — nothing catches a Timer re-armed with a period of zero**,
   carried unchanged from 11-12. STRIP has no Timer and does not touch it.
5. **`D-11-10-b` is one row better informed.** Four rows examined in four waves,
   one stale, **fourteen unchecked**.
6. **The LUMEN depth discrepancy, unchanged and unreconciled** (carried from
   11-09.2, 11-10, 11-11 and 11-12). Only the bench closes it.

---

## Known Stubs

**None.** Nothing was stubbed. The fader, the crossfader, the origin lock, the
clamp, both repaints and both controller streams are complete, reachable and
driven by the two tests; every property the entry declares is derived from the
fixture rather than asserted by hand.

**Three things are deliberately absent and are named rather than left as edges:**

- **The fader sends finer than it draws.** 128 values through eight cells: the
  bar moves once every sixteen values, and between two steps of the picture the
  controller is still moving. That is what a fader with an LED bar is, and it is
  the same honest limit the fourteen-bit card had, one order of magnitude
  smaller.
- **The crossfader's row cannot start a fader gesture, and the fader's bottom row
  cannot start a crossfader one.** That is the origin lock working, and it is the
  price of two controls sharing an edge on a nine-row pad. Written into the
  header rather than discovered later.
- **The picture is a readout of the last value YOU sent.** Nothing in this phase
  receives (D-04), so a fader moved at the other end leaves this pad with nothing
  to say.

---

## Self-Check: PASSED

- `src/lib/catalog/entries/strip.ts` FOUND, `src/lib/catalog/listing.ts` FOUND,
  `src/lib/catalog/frames.json` FOUND, `src/lib/sim/lua-smoke.spec.ts` FOUND,
  `docs/HARDWARE-AUDITION.md` FOUND,
  `.planning/phases/11-bench-corrections/deferred-items.md` FOUND,
  `.planning/phases/11-bench-corrections/11-13-SUMMARY.md` FOUND.
- `485670c` FOUND in `git log --oneline --all`; `a23b40c` FOUND.
