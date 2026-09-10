---
phase: 11-bench-corrections
plan: 11
subsystem: catalog
tags:
  [ghost, blank-page, reset-gesture, class-a, class-b, residue, demo-path, budget]
requires:
  - phase: 11-bench-corrections
    plan: 10
    provides: "the PREV_FILES 84 / PREV_TESTS 862 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline, and the fourth confirmation that compiler Pass A cannot move for a hand-authored Lua entry"
  - phase: 11-bench-corrections
    plan: 02
    provides: "the two live gates - decay-idiom.spec.ts and touch-guard.spec.ts - and the code-9 latch it handed forward to this plan by name"
  - phase: 11-bench-corrections
    plan: 01
    provides: "the rescued decay idioms, both forms, in decay-idiom.spec.ts's header"
provides:
  - "A GHOST re-authored from a blank page: a lit red corner that erases, one gesture per loop, and a coalesced tap that plays instead of sticking"
  - "The measured mechanism behind 'resetting is not reliable': glp(a,l,0) does not touch the rate, so a cell mid-decay set to phase 0 is at phase 250 on the next tick - the old erase was CREATING a class-A freeze on every cell it cleared, and never touched layer 2 at all"
  - "glpfs(a,l,0,0,0) as the house clear, phase 0 AND rate 0, already known to decay-idiom.spec.ts by its rate-0 skip"
  - "Three reset gestures costed as Lua before any was authored, with the two rejected ones costed rather than argued away"
  - "A demo path that presses the erase key, and the finding that NO test asserts what a demo path depicts"
  - "The proof that the residue probe reaches GHOST, obtained by planting the steady marker the design rejected"
affects: [11-15, 11-16]
tech-stack:
  added: []
  patterns:
    - "A blank-page entry costed at three gesture sketches before a line is authored, with the chosen one justified against the two rejected on grounds other than price"
    - "A design decision converted from an argument into a measurement by planting the rejected alternative and reading which gate catches it"
    - "A demo path whose period deliberately does not end on its own reset, because gen-og captures a demo entry at the END of its path"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/ghost.ts
    - src/lib/catalog/listing.ts
    - src/lib/sim/demo.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/browse/typographic.spec.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/11-bench-corrections/deferred-items.md
key-decisions:
  - "ONE lit corner cell over a held press and over a two-cell corner, and not because it is cheapest: a hold has no affordance, so it answers 'resetting is not reliable' with 'and now you must also hold it for the right length of time'"
  - "The key EXISTS ONLY WHILE IT IS LIT, so the pad never has a dead square and the visitor never presses something that does nothing"
  - "The marker PULSES rather than sitting steady - measured: the steady form is reported by the residue probe as cell 80 at phase 252 against an untouched run holding 0"
  - "Every onset starts a FRESH recording, so a second drag replaces the first instead of being glued onto its end"
  - "s.h=e<9 closes the code-9 latch in one assignment: a contact is live if and only if it is not a press-and-lift in one message"
  - "restsBlack STAYS TRUE and the knob rack stays byte-identical, both re-derived rather than carried, and the second one is what keeps the shape character at 6"
  - "The description moved to name the erase key, because a redesign whose whole answer is discoverability cannot leave the affordance unnamed in the card's one line"
patterns-established:
  - "A wave that re-authors an entry re-measures that entry's row in docs/HARDWARE-AUDITION.md, and says whether the row was already stale"
requirements-completed: [CONT-02, CONT-03, PREV-01]
duration: 41min
completed: 2026-09-10
---

# Phase 11 Plan 11: GHOST re-authored, and the reset that was relighting the cells it cleared Summary

**The old erase wrote `glp(a,1,0)`, which sets the phase and touches neither the
rate nor the timeout - so a cell mid-decay at rate 250 was at phase 250 on the
very next tick. Planted on the new entry's own shape with only the clear idiom
swapped, that form leaves three cells lit at every one of the 120 ticks after
the reset and never clears them. THE RESET WAS CREATING THE CLASS-A FREEZE
RATHER THAN UNDOING IT, and it never touched layer 2 at all.**

## Performance

- **Duration:** 41 min, one executor session
- **Tasks:** 2 of 2
- **Files modified:** 7, across three commits

---

## The counts, as a carried name plus a delta

| Name          | Carried (11-10)             | Observed             | Delta                                |
| ------------- | --------------------------- | -------------------- | ------------------------------------ |
| `PREV_FILES`  | 84                          | **84**               | **+0**                               |
| `PREV_TESTS`  | 862                         | **863**              | **+1** — exactly the declared term   |
| `PREV_E2E`    | 86 source titles / 105 runs | **86 source titles** | **+0** (the suite is not run here)   |
| `BASE_CHECK`  | 580                         | **580**, `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | **+0** |
| sweep members | `4 19`                      | **`4 19`**           | **+0**                               |
| catalog       | 27                          | **27**               | **+0**                               |

`npm run test:quick` exits **0**: *"84 passed (84) / 863 passed | 1 todo (864)"*.
`check-counts.mjs 84 863` exits **0**; `84 862` exits **1**, *"tests: observed
863, expected 862"*. **Both were run and both are reported.**
`npm run test:sweep | node scripts/check-counts.mjs 4 19` exits **0**.
`npm run lint` clean. `grep -c "test(" e2e/*.e2e.ts` totals **86**.

**The single test is `lua-smoke.spec.ts` 18 -> 19**, which is where 11-09.2 and
11-10 each put an entry-pinned test for the same reason. The plan names that file
directly, so this is not the deviation the last two waves recorded.

### The sweep totals, re-observed and all unmoved

| Sweep readout | Carried | Observed | Moved? |
| --- | --- | --- | --- |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358** | identical | **no** |
| Lua route round trip | Pass A **49,824** (w 49,424, x 382), Pass B 118,784, total **168,608** | identical | **no** |
| `lua-entries` | **1,176** combinations, 2,352 measurements | identical | **no** |
| kind cross-product | 1,296 combinations, worst **906 of 908** | identical | **no** |

**A FIFTH independent confirmation that compiler Pass A cannot move for a
hand-authored Lua entry** — and this wave rewrote one from a blank page, adding
155 characters of Setup Lua. **The LUA-ROUTE Pass A did not move either**, which
is a stronger statement than the previous four waves could make: it counts knob
POSITIONS, and this rewrite kept all five knobs at exactly their old value
counts.

---

## THE BUDGET, COSTED BEFORE THE DESIGN, AND THE SKETCH NUMBERS FIRST

Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`. The **RGB444 picker corner** is both colour knobs at
`255,255,255` and every other knob at its longest declared value.

### GHOST, before a character moved

| | defaults | picker corner | free of 908 at the corner |
| --- | --- | --- | --- |
| Setup | **320** | **323** | 585 |
| Timer | **333** | **337** | 571 |

**GHOST's declared corner and its picker corner COINCIDE**, by the same accident
ARC, MORPH and LUMEN have: both colour knobs already declare `255,255,255`, so
the two points are the same one. **GHOST is the ninth entry checked and the
fourth found correct by accident.** Five remain confirmed wrong (CONSOLE, FORGE,
STEPS, POMODORO, STAGE) and twelve have never been checked. **11-16 owns the
sweep.**

### The three sketches, measured before the entry was authored

Written as Lua and run through `measureLua` with nothing committed:

| Sketch | Setup at the picker corner | free | Timer at the picker corner | free |
| --- | --- | --- | --- | --- |
| **A** — a HELD press on the marked cell | **533** | 375 | **571** | 337 |
| **B** — ONE lit corner cell | **478** | **430** | **422** | **486** |
| **C** — a two-cell corner (79 and 80) | **542** | 366 | **457** | 451 |

**ALL THREE FIT, so this is a choice and not a constraint.** B was chosen and
**it was not chosen because it is cheapest:**

- **A answers *"resetting is not reliable"* with *"and now you must also hold it
  for the right length of time"*.** A hold has no affordance — nothing on a pad
  says how long — so the user has to already know, and a user who releases too
  early has performed the failure the note is about. It also costs 149 more Timer
  characters for a countdown, an abort path and a fill to render.
- **C doubles the area a drag can accidentally start on** — two cells of 81
  instead of one — and buys nothing. One lit red corner on an otherwise black pad
  is already unmistakable, and C is the dearer of the two on Setup.

### GHOST, shipped

| | defaults | picker corner | free of 908 at the corner |
| --- | --- | --- | --- |
| Setup | **475** | **478** | **430** |
| Timer | **418** | **422** | **486** |

**Net at the picker corner: Setup +155, Timer −85.** The Timer got *smaller*: the
old one carried the whole recorder's arming logic that the touch callback now
owns outright.

### WHAT THE PLAN SAYS ABOUT THIS BUDGET IS WRONG IN BOTH HALVES

The objective states, *"Budget, stated up front because D-04 requires it: Setup
**305** of 908, **601 free**; Timer **333** of 908, **573 free**."*

- **305 is not GHOST's Setup and has not been since 11-02.** It is the plan-08-06
  figure; 11-02 took the Setup to **320** with two touch-guard repairs (+8 for
  the ended guard, +7 for the started one). The same stale 305 was sitting in
  `docs/HARDWARE-AUDITION.md` and is corrected by this wave's third commit.
- **Both "free" figures disagree with their own "used" figures by exactly two.**
  908 − 305 is **603**, not 601. 908 − 333 is **575**, not 573. Every corner of
  GHOST was measured here rather than inherited, and the entry header's own
  numbers — `Setup 320`, all-longest `323 / 337` — were the only ones in the tree
  that were right.

---

## The reset, chosen deliberately, and what it looks like on the pad

**Screen cell 80 — the bottom-right corner — is coloured `255,0,0` at Setup and
lit by the Timer only while there is something to erase.** An onset on it, while
it is lit, clears everything. While it is dark it is an ordinary cell you may
start a drag on.

**THE KEY EXISTS EXACTLY WHEN IT IS LIT**, and that is the half of the design
that keeps the pad honest: there is no dead square, and the visitor never presses
a key that does nothing. It is also the state indicator the plan's first
must-have asks for — **marker dark means nothing is recorded, marker lit means a
ghost is looping and here is how to stop it.**

**It is RED rather than palette-coloured** because the erase key is a function
and not decoration: it has to stay legible at every setting of both colour knobs.

**IT PULSES, ON A 280 ms CADENCE** — `glpfs(s.k,1,252,250,0)` with
`glt(s.k,1,42)` re-armed every fourteenth Timer tick, so the phase breathes
252 → 84 and never reaches black. Three reasons, and the third is measured below:
a pulse reads as "act on me" where a steady cell reads as furniture; it puts the
one permanently-present light on this pad under the same class-A rule as
everything else; and **a steady marker fails the residue probe.**

### The header's two sentences on what reliability rests on

Quoted from the entry, because the plan asks for them by name:

> The class-B repair 11-02 made is what stops a fast tap producing nothing, and
> the class-A repair it made is what stops a crossed cell staying faintly lit
> forever — both are inherited, both are now gated, and neither is re-derived
> here. Everything else the bench reported rests on THIS file's new structure:
> the coalesced tap no longer arms a latch nothing clears, a second gesture no
> longer glues itself onto the first, and the reset is a lit key on the pad that
> stops the decays it clears instead of a second finger that restarted them.

| Symptom | Answered by |
| --- | --- |
| *"doesn't work reliably"* | the code-9 latch and one-gesture-one-loop (**new**); the class-B guard (**inherited**, 11-02) |
| *"the LED colors the pad"* | `glpfs(a,l,0,0,0)` as the clear (**new**); the class-A landing (**inherited**, 11-02) |
| *"resetting is not reliable"* | the lit corner key (**new**) |

---

## THE MECHANISM BEHIND "RESETTING IS NOT RELIABLE", MEASURED

`glp(a,l,p)` writes the phase and **touches neither the rate nor the timeout**,
and `grid_led_tick` does `pha += fre` on every tick a timeout is still running
(`src/vendor/botor/pad-sim.ts:885-895`, firmware `grid_led.c:191-211`). A cell
mid-decay at rate 250 that is set to phase 0 is at **phase 250** on the next
tick, and then walks off a phase the timeout was never armed for.

**Planted on the new entry's own shape with ONLY the clear idiom swapped** — one
variable, everything else identical:

```
old clear,   1 tick  after: 3 lit [28,31,80]
old clear,   2 ticks after: 3 lit [28,31,80]
old clear,   3 ticks after: 3 lit [28,31,80]
old clear,  42 ticks after: 3 lit [28,31,80]
old clear,  60 ticks after: 3 lit [28,31,80]
old clear: last tick with any cell lit 120 of 120
```

**It never clears.** And the shipped card, same gesture, same points:

```
round 1: after the reset +1 -> 0 lit, +2 -> 0 lit, +200 -> 0 lit
round 2: after the reset +1 -> 0 lit, +2 -> 0 lit, +200 -> 0 lit
```

The clear is now `glpfs(a,1,0,0,0)` and `glpfs(a,2,0,0,0)` over all 81 cells:
phase 0, **rate 0**, shape 0. Rate 0 is the house idiom for taking a cell back
from a decay it started earlier and `decay-idiom.spec.ts` skips it by name,
because a layer that does not walk has no landing to check. **The old erase also
only ever touched layer 1**, so the ghost's own trail was outside it entirely.

---

## The fast-tap count on the rewrite

| Run | messages | errors | lit after settling |
| --- | --- | --- | --- |
| **fast tap** (coalesced code 9) | **406** | none | cell 47 looping, cell 80 the key |
| **slow press** (down, hold 6, up) | **406** | none | cell 47 looping, cell 80 the key |

**Identical, and 406 is the same run-length figure 11-02 measured** — GHOST's
Timer emits two controllers per Timer tick for as long as the probe runs, so the
number is a function of the window rather than of the tap. The research figure it
replaces was **0 on a fast tap against 8 on a slow one.** Neither defect is
reintroduced: the parity probe (test 5) is green on GHOST with no allowance row,
and the fast tap now *does* something — it records its one point and goes
straight to playback, so tapping a cell loops that cell.

**`s.h=e<9` is the whole fix and the whole statement of it**: a contact is live
if and only if it is not a press-and-lift in one message. That is the latch
11-02 handed forward by name, closed.

---

## Both gates, green, with NO new rows in either table

| Gate | Rows before | Rows after | Result |
| --- | --- | --- | --- |
| `touch-guard.spec.ts` `DECLARED_EXCEPTIONS` | 2 (stage, forge) | **2** | green, 3 tests |
| `decay-idiom.spec.ts` `KNOWN_VIOLATIONS` | 0 | **0** | green, 3 tests |

The entry writes contact-end as `e==3 or e>=5 and e<9` and onset as
`e==4 or e>8`, and every decaying pair is the literal house idiom at T = 42:
`glpfs(...,252,250,0)` with `glt(...,42)`, step 6, 6 × 42 = 252, landing on
exactly 0. Both of the Setup's clearing calls carry rate 0 and are skipped by the
gate's own rule rather than by an excuse. **A blank page written after the gates
exist needed no excuse, which is what the gates were built to demonstrate.**

---

## `restsBlack` and `motion`, re-derived from the fixture

| Property | Carried | Re-derived | Moved? |
| --- | --- | --- | --- |
| `restsBlack` | true | **true** | **no** |
| `nonZeroBytes` at ticks 0, 37, 101, 500, 1009 | 0, 0, 0, 0, 0 | **0 at all five** | **no** |
| `animating` at all five | true | **true** | **no** |
| `motion` in `listing.ts` | `dark` | **`dark`** | **no** |

**`frames.json` WAS NOT REGENERATED, AND THAT IS PROVED RATHER THAN ASSERTED.**
`frames.spec.ts` test 3 re-samples every entry live and compares against the
fixture, so a green run **without** `UPDATE_FRAMES` is the proof: green, and
`git diff --quiet HEAD -- src/lib/catalog/frames.json` exits **0**.

**Why it could not move, structurally**: the fixture runs each entry at its
defaults with **no gesture**. Everything this rewrite added lives in `touch_cb`
or behind `if s.n>0` in the Timer, and `s.n` is 0 until a finger arrives. The one
Setup-time addition is `glc(k,1,255,0,0,1)`, which sets cell 80's layer-1 COLOUR
while the loop above leaves it at phase 0 — and `glc`'s sixth argument forces the
minimum stop black. **A coloured cell at phase 0 renders as three zero bytes.**
`animating` stays true because the engine reports `host.animating || timerArmed`
and GHOST still stores a Timer.

**THE `restsBlack` PAIR DID NOT CHANGE.** GHOST and MORPH are still the two, so
`docs/TESTING.md:676` (*"ghost and morph carry no lit LED at all"*) and
`docs/INSTALL-RUNBOOK.md:102` are both still true and neither was touched.
Nothing here moves for 11-16 on that account.

**This is the sixth consecutive plan in the phase that does not regenerate the
fixture.** The plan's `files_modified` lists `src/lib/catalog/frames.json`; it
cannot move, and that is reported below rather than forced.

---

## The residue probe, re-run and PROVED ABLE TO REDDEN ON GHOST

**Green, at both renderings, with no `RESIDUE_ALLOWANCES` row.** The table still
holds exactly two rows, morph and console, neither touched.

**And it was not left at that, because this phase's first standing warning says
to suspect a green negative check.** The design's own rationale — that the marker
must PULSE — was converted from an argument into a measurement by planting the
steady marker it rejected (`glpfs(s.k,1,252,0,0)`, rate 0):

```
ghost at defaults: A GESTURE MUST LEAVE NO CELL LIT THAT A NEVER-TOUCHED RUN
LEAVES DARK. ... cell 80 (col 8, row 8, hardware 72): layer 1 at phase 252,
where an untouched run holds 0; rendered [0,0,0] against [125,0,0]
```

**Two things at once.** The probe demonstrably reaches GHOST's cell 80 and is not
passing it vacuously; and **the steady marker really would have failed**, so the
pulse is load-bearing rather than decorative. Exit **1** planted, **0** restored,
`sha256` identical either side.

---

## The demo path, and the gap nobody's test covers

Rewritten with the entry, in the same wave. The three beats, **measured against
the real engine over one 600-tick period**:

| ticks | what happens | lit cells |
| --- | --- | --- |
| 8 – 76 | a drag, recorded, comet following the finger | 8–11, cell 80 among them |
| 76 – 240 | the ghost retraces it with no finger on the pad | 10–11 at tick 239 |
| **241** | **the erase key was pressed at 240** | **0** |
| 241 – 300 | dark, for **61 ticks** — the beat that shows the reset worked | 0 |
| 300 – 352 | a second, different drag that REPLACES the first | 6 at tick 320 |
| 352 – 600 | the second ghost, looping | **12 at tick 599** |

**THE PERIOD DELIBERATELY DOES NOT END ON THE RESET.** `scripts/gen-og.mjs`
captures a demo entry **at the end of its path**, not at `OG_TICK`, and its gate
2 fails an entirely dark frame for any entry not in `DARK_BY_CONSTRUCTION`. A
path that erased last would have shipped a black social preview and reddened that
gate. Ending on the second ghost shows the reset **and** leaves the card on a lit,
moving frame.

### The OG image, inspected by eye

**With the new path:** the second drag's magenta ghost tracing down-left and
back down-right, and **the red erase key lit in the bottom-right corner** — the
redesign's new affordance, visible in the social preview.

### THE NEGATIVE CHECK THAT DID NOT REDDEN, AND IS THE MORE USEFUL RESULT

The plan predicts that leaving the old demo path in place makes *"the OG image
show the wrong gesture"*. It was planted and the image regenerated. **The result
is that NOTHING WENT RED.** `gen-og`'s gate 2 stayed green, `demo.spec.ts` stayed
green, `listing.spec.ts` stayed green, and the picture was entirely plausible:
the first drag's ghost, and the red key lit in the corner.

**The stale path is wrong only in what it OMITS.** It advertises a red corner and
never presses it, so the social preview shows the affordance the whole redesign
is about without ever demonstrating it — and **no test in this repository can
tell the difference.** Every gate reads whether a demo path is well-formed,
whether it closes its contacts and whether the final frame is non-dark. **Not one
asserts what it depicts.** That is the gap the plan asked to be reported, and it
is larger than the plan's own prediction: the failure mode is not a visibly wrong
picture, it is a *plausible* one.

`sha256` of `demo.ts` identical either side; the regenerated `static/og/ghost.png`
is byte-identical to the pre-plant render (`cmp` clean). `static/og/` is
gitignored.

---

## The test, and the three claims it pins

`lua-smoke.spec.ts` **18 -> 19**: *"records a GHOST path, replays it, and takes it
back on the red corner - twice"*. Printed by the test from live runs:

```
GHOST record, replay and reset, plan 11-11:
  round 1: replayed [28,31,34,80] on CC 16 values [21,64,106]; after the reset +1 -> 0 lit, +2 -> 0 lit, +200 -> 0 lit
  round 2: replayed [28,31,34,80] on CC 16 values [21,64,106]; after the reset +1 -> 0 lit, +2 -> 0 lit, +200 -> 0 lit
```

1. **The round trip, in the picture AND on the wire.** A drag over cells 28, 31
   and 34 is replayed as **exactly** those three cells and nothing else, and the
   controller stream carries **exactly** the three coordinates the finger visited.
   Both, because a loop that lit the right cells while sending stale values would
   pass either one alone. Cell 80 is in the list because the key is lit — which is
   the state the card is in.
2. **The reset leaves no cell lit**, asserted against the frame at **+1**, **+2**
   and **+200** ticks — plus a second assertion that every layer sits at phase 0
   **with rate 0**, because a black colour at a live phase renders identically to
   a cleared cell and comes back the moment a colour is written.
3. **It works TWICE IN A ROW.** *"Resetting is not reliable"* is a claim about
   the second time, and a single-shot test cannot see it.

**The two reset presses are at different pixels inside cell 80** (118,118 and
120,120, both asserted to resolve to cell 80 first). That is this phase's third
standing warning: the host's enqueue is change-gated per contact on
`(event, x, y)`, so a probe pressing one pixel twice would measure the HOST's
dedup and report it as the entry's.

---

## The shape character: proved before and after, not asserted

`shapeOf(knobs) = STAMP_ALPHABET[(knobs.length * 7 + total options) % 32]`, read
off `CATALOG` through `stampKnobs` and `encodeFor` **before task 01** and again
**after task 02**:

| | knobs | value counts | total | shape | full stamp |
| --- | --- | --- | --- | --- | --- |
| **before** | 5 | `[5, 5, 5, 4, 16]` | 35 | **`6`** | `w60fbf5f401` |
| **after** | 5 | `[5, 5, 5, 4, 16]` | 35 | **`6`** | `w60fbf5f401` |

`(5 × 7 + 35) mod 32 = 70 mod 32 = 6`. **No new knob, no changed value count, and
the whole stamp is byte-identical rather than only its shape character.** No
GHOST link anyone has shared is demoted from `restored` to `older`. The tripwire
POMODORO spent in 11-09 (`@MINS` four values to six, shape `n` to `p`, `xn33333`
demoted) is **not spent again**. `git diff --quiet HEAD -- src/lib/share/stamp.ts
src/lib/share/fixtures/wild-stamps.json` exits **0**.

**A rewrite is exactly where a knob rack drifts without anyone deciding to move
it**, which is why the rack is byte-identical on purpose and says so in its own
comment.

---

## The tags and the two copy lines

**The tags did not move**: `["modulation", "generative", "expressive"]`, checked
**before** deciding rather than after. The card is still a record-and-replay
gesture pad, so what it is FOR did not move — and `precise` and `still` sit
exactly on the FEELS floor of 6 after 11-01, so a tag moved off this entry could
only have cost and never paid.

**The description DID move, and it is a judgement rather than a requirement:**

| | String | Length |
| --- | --- | --- |
| before | *"Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger's."* | **103** |
| after | *"Drag once and a ghost retraces your path forever, still sending; the red corner takes it back."* | **94** |

The cap is **110** (`catalog.spec.ts`, and `copy.spec.ts` again). The card's
PROMISE is unchanged — that is the clause that survived verbatim. What the second
clause buys is the thing the redesign is entirely about: **a reset the visitor
cannot discover is a reset they will call unreliable again**, and a card whose
new affordance is unnamed in its one line is half-discoverable. Changed in
**both** `entries/ghost.ts` and `listing.ts`; `listing.spec.ts` asserts the two
equal in both directions and `front-door.ts` carries no description for GHOST
(it is on the exclusion list, `id` and `why` only).

**The `quiet` line is unchanged** — `DEMO_TOUCH_NOTE`, which `listing.spec.ts`
test 3 requires verbatim for every entry that has a demo path.

---

## The negative checks, with what each one actually reddened on

**Every plant restored from a scratch copy with `sha256` compared either side. No
`git checkout`, `git restore`, `git stash` or `git clean` was run at any point.**
`ghost.ts` `5d41fd460a5654a1327fdfae8b25809fb7cfff126cddaf28bbf7dbb7f6fe9e6c`
identical before each plant and after each restore; `demo.ts`
`fb7109e2e6ff8eeeea772e5e2576ca6421ffccb97ab4de483c75eb88b6771f25` likewise.

| # | Plant | Exit | Reddened on |
| --- | --- | --- | --- |
| **1** | contact-end written as bare `e>=5` | **1** (restored **0**) | `touch-guard.spec.ts` test 1, naming the branch: *"ghost.setup writes `if e==3 or e>=5`. Escape it, or declare it in DECLARED_EXCEPTIONS with a reason."* |
| **2** | the erase branch re-lights one cell (`glpfs(s.k,1,200,0,0)`) | **1** (restored **0**) | the new test, at the **+1 tick** sample: *"THE RESET MUST LEAVE NO CELL LIT. 1 of 81 are still showing 1 tick(s) after the press on the erase key: cell 80 (col 8, row 8, hardware 72) rendered [99,0,0]"* |
| **3** | the OLD demo path left in place | **0** | **NOTHING. Every gate stayed green** and the OG image was plausible — see above. This is the finding. |
| **4** | *(not asked for)* the marker made steady at rate 0 | **1** (restored **0**) | the residue probe, on GHOST, naming cell 80 layer 1 at phase 252 against an untouched run holding 0 |

**Check 1 is the one the plan asked for and it confirms what it was written to
confirm**: a blank-page entry is covered by the class-B gate from its first
commit, and the gate names the entry, the event and the branch.

**Check 4 was added rather than found in the plan**, for the reason the phase's
first standing warning gives. The residue probe came back green on GHOST, and a
green negative result about a card whose bench note is *"the LED colors the pad"*
is exactly the result that should be distrusted. It is now known that the probe
reaches this entry's cell 80 and that the rejected alternative fails it.

---

## Deviations from Plan

### 1. [Rule 3 - blocking] `listing.ts` moved in task 01's commit, not task 02's

- **Found during:** task 01, changing the description
- **Issue:** the plan lists `src/lib/catalog/listing.ts` under task 02's files.
  `listing.spec.ts` asserts the entry's description and the listing's are equal in
  both directions, so moving one without the other leaves the tree red.
- **Fix:** both moved in the same commit as the entry. Task 02's `<files>` is
  otherwise honoured exactly.
- **Files modified:** `src/lib/catalog/listing.ts`
- **Commit:** `0eeed1c`

### 2. [judgement, reported] The description moved at all

- **Found during:** task 01, step 5
- **Issue:** the plan says the two copy lines move only *"if the redesign changes
  what the card IS"*. It does not — the card is still a record-and-replay gesture
  pad, and the promise clause is verbatim.
- **Decision:** the second clause moved anyway, to *"the red corner takes it
  back"*. The plan's own task 01 step 2 requires the reset to be **visible**, and
  the note being answered is about discoverability; a card whose one line does not
  name its new affordance answers half the note. 94 of 110 characters, and the
  tags were checked against the closed vocabulary before rather than after.
- **Files modified:** `src/lib/catalog/entries/ghost.ts`, `src/lib/catalog/listing.ts`
- **Commit:** `0eeed1c`

### 3. [Rule 1 - bug] `frames.json` was NOT regenerated, because it cannot move

- **Found during:** task 02, step 2
- **Issue:** the plan's task 02 says *"Regenerate `frames.json`"* and its
  frontmatter lists the file as modified. The fixture builds every entry at its
  DEFAULTS with NO GESTURE, and every character this wave added is behind a touch
  or behind `if s.n>0`.
- **Fix:** proved rather than regenerated — `frames.spec.ts` green **without**
  `UPDATE_FRAMES` (which re-samples live and compares), and `git diff --quiet`
  exit 0. Both declared properties re-derived from the fixture as the plan's
  `<done>` requires.
- **Files modified:** none
- **Commit:** —

### 4. [Rule 2 - missing critical functionality] `typographic.spec.ts`'s GHOST literal claimed to track `ghost.ts`

- **Found during:** task 02, after the description moved
- **Issue:** the constant's doc comment read *"GHOST's description as
  src/lib/catalog/entries/ghost.ts holds it TODAY"*. That sentence became false
  the moment the entry changed, and the file's own header explains that these
  literals are deliberately decoupled — so a reader who noticed the drift would
  most plausibly "fix" it by making it a read, which the header forbids in as many
  words.
- **Fix:** the comment now says the sentence is the one the entry carried **until
  plan 11-11**, why the literal is unweakened by that, and why the constant keeps
  its name. **No assertion changed and no test count moved.**
- **Files modified:** `src/lib/browse/typographic.spec.ts`
- **Commit:** `fb88a73`

### 5. [Rule 1 - bug] `docs/HARDWARE-AUDITION.md`'s GHOST row was stale BEFORE this plan, and is now corrected

- **Found during:** task 02, checking for a second home for GHOST's cost
- **Issue:** the row read **305 / 333**. 305 is the plan-08-06 figure; **plan
  11-02 took GHOST's Setup to 320 and did not move this table.** This wave then
  moved it to 475 / 418. `audition.spec.ts` gates the document's SHAPE and asserts
  nothing about these numbers, so a wrong one stays green forever — the same class
  of defect 11-10 recorded as `D-11-10-b`.
- **Fix:** the row moved to **475 / 418**, the provenance paragraph names the
  prior staleness explicitly, and `D-11-10-b` is **amended rather than closed**:
  two rows have now been looked at and **one of them was demonstrably stale**, so
  the item is worse rather than smaller. Sixteen rows remain unchecked.
- **Files modified:** `docs/HARDWARE-AUDITION.md`, `deferred-items.md`
- **Commit:** `53af9a0`

### 6. [Rule 2] Bench row 6 was EXTENDED rather than a row 24 added

- **Found during:** task 02, step 5 — listing GHOST as a bench row
- **Issue:** `audition.spec.ts` pins `ROW_COUNT = 23`, its test TITLE spells
  "twenty-three", and the document's prose says *"Twenty-three rows"* in two
  places. A new row 24 would have moved a number in four places to add a check to
  a configuration that **already has row 6**.
- **Fix:** row 6 now carries **(a)** the original playback-speed check and
  **(b)** the exact reset sequence, twice, with the honest reason it cannot be
  simulated — *the bench said the reset does not work and the simulator says it
  does, and only a module closes that.* The dark-at-rest paragraph also gained a
  line saying the red corner is the erase key and not a stuck cell, so a bench
  operator does not report it as one.
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `53af9a0`

### 7. [reported] A fourth negative check the plan did not ask for

Check 4 above. See the phase's first standing warning.

**No other rule fired.** No missing dependency, no broken import, and no
architectural question — the entry stayed inside its two events and its existing
knob rack.

---

## Everything the plan asserts that the tree does not support

1. **THE OBJECTIVE'S BUDGET IS WRONG IN BOTH HALVES.** *"Setup 305 of 908, 601
   free; Timer 333 of 908, 573 free."* GHOST's Setup was **320** at the defaults
   and **323** at the picker corner, not 305 — 305 has been stale since 11-02.
   And both "free" figures are two short of their own arithmetic: 908 − 305 is
   603 and 908 − 333 is 575. **Every corner was measured here; nothing was
   inherited.**

2. **`src/lib/catalog/frames.json` IS IN `files_modified` AND CANNOT MOVE.** The
   fixture runs each entry at its defaults with no gesture. See Deviation 3.

3. **`src/lib/catalog/listing.ts` IS UNDER TASK 02 AND IS COUPLED TO TASK 01.**
   `listing.spec.ts` asserts the two descriptions equal in both directions. See
   Deviation 1.

4. **TASK 02'S NEGATIVE CHECK 1 PREDICTS THE WRONG OUTCOME.** It expects the
   stale demo path to make *"the OG image show the wrong gesture"*. It shows a
   **plausible** gesture, every gate stays green, and nothing reddens anywhere.
   The real finding is stronger than the predicted one and is written up above.

5. **`docs/TESTING.md` NEEDS NOTHING FROM THIS WAVE.** The plan asks for any
   change to the `restsBlack` pair to be flagged for it. The pair did not change:
   GHOST and MORPH are still the two, and both documents that say so are still
   true.

6. **`src/lib/sim/lua-smoke.spec.ts`'s header still opens "Thirteen tests"**, and
   the file now carries **19**. **Not corrected here**, for the same reason 11-10
   and the two waves before it left it: it is one of the stale header counts
   **11-16 owns**, and correcting one would make the rest look checked.

7. **The plan's interfaces section says GHOST is *"one of only three surviving
   `restsBlack` entries, and after 11-01 removed ETCH there are two"*** — two
   counts in one sentence. The operative one (two: GHOST and MORPH) is right and
   is what everything downstream reads.

---

## Invariants, each proved by a command

| Claim | Command | Result |
| --- | --- | --- |
| `frames.json` byte-untouched | `git diff --quiet HEAD -- src/lib/catalog/frames.json` | **exit 0** |
| `frames.spec.ts` green with no `UPDATE_FRAMES` | run in the server project after each task | **green, 5 tests** |
| both gates green, no new rows | `decay-idiom.spec.ts`, `touch-guard.spec.ts` | **green, 3 + 3**; tables 0 and 2, unchanged |
| `src/vendor/` untouched by this plan | `git diff --stat HEAD -- src/vendor/` | **empty**. No manifest row declared |
| `src/vendor/` unmoved since 11-04 | `git diff --stat 4131ff5 HEAD -- src/vendor/` | the recorded **four-file** output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited | `git diff --quiet 9d06b00 HEAD -- ...`; run | **exit 0**; **green** |
| `upstream-manifest.json` untouched (**11th** wave) | `git diff --quiet 2d249f3 HEAD -- ...` | **exit 0** — the four mislabelled *"free at its worst knob position"* rows stand for 11-16 |
| configs and roadmap untouched | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0** |
| `stamp.ts` and `wild-stamps.json` untouched | `git diff --quiet HEAD -- ...` | **exit 0** |
| shape character `6` before and after | `stampKnobs` + `encodeFor` over `CATALOG` | `[5,5,5,4,16]`, stamp `w60fbf5f401` **both times** |
| `svelte-check` | `npm run check` | **580 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS** |
| lint | `npm run lint` | **clean** (prettier + eslint) |
| build | `npm run build` | **exit 0**; writes only gitignored paths (`build/`, `static/og/`, `.svelte-kit/`) |
| e2e term `+0` | `grep -c "test(" e2e/*.e2e.ts` | **86**; the suite is **not run** by this plan |
| no Playwright suite was running at any commit | no Playwright run happened at all | - |
| canonical form and syntax | `lua-entries.sweep.spec.ts` tests 1, 3, 6 | **green** across 1,176 combinations |
| no sibling repository touched | none read or written | - |
| nothing hardware-verified | no agent connected to or wrote to a device | - |
| nothing deployed | no `wrangler`, no `npm run deploy` | - |
| tree clean | `git status --porcelain` | empty before this SUMMARY |

Three scratch measurement specs were used (`zz-measure`, `zz-behave`, `zz-demo`)
and **deleted before any commit**; they do not appear in the file count, and
`npm run check` reads 580 with them gone.

---

## WHAT IS NOT CLAIMED

**Nothing here is hardware-verified.** *"Doesn't work reliably, the LED colors
the pad and resetting is not reliable"* was observed by the user on a module, and
**no agent connected to a device, wrote to a device, or deployed anything.** A
reset that empties a simulated frame is a claim about the simulator; whether a
ZONA's LEDs go out is a claim only a ZONA can settle.

**The bench row for 11-16, with the exact sequence to repeat** — now
`docs/HARDWARE-AUDITION.md` row 6(b):

> Draw a curve, lift, watch the ghost loop and the bottom-right corner pulse red,
> then press that red corner. **The pad must go completely dark and stay dark.**
> Now draw a second, different curve, lift, and press the red corner again.
> **Both resets must leave no cell lit, and the second must work as well as the
> first.** Note anything still glowing, and how long for.

---

## Commits

| Hash | Message |
| --- | --- |
| `0eeed1c` | `feat(11-11): GHOST re-authored, with a lit corner that erases and a clear that stops the decay instead of restarting it` |
| `fb88a73` | `test(11-11): the demo presses the red corner, and the round trip, the empty pad and the second reset are one test` |
| `53af9a0` | `docs(11-11): GHOST's audition row was stale by fifteen before this plan moved it by a hundred and fifty-five` |

---

## Carry-forward for wave 15

**`PREV_FILES` 84 · `PREV_TESTS` 863 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 580 · sweep members `4 19` · catalog 27**

**Sweep totals, re-observed and all unmoved:**

- compiler route **Pass A 20,782**, Pass B 24,576, **total 45,358**
- Lua route **Pass A 49,824** (format w 49,424, format x 382), Pass B 118,784, **total 168,608**
- `lua-entries` **1,176 combinations, 2,352 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908**

**Entry headers found quoting the declared-palette corner instead of the RGB444
picker corner: still FIVE** — CONSOLE, FORGE, STEPS, POMODORO and STAGE. GHOST is
the **ninth** entry checked and the **fourth** correct by the ARC/MORPH/LUMEN
accident of already declaring `255,255,255`. **Twelve headers have never been
checked. 11-16 owns the sweep.**

Suite-running plans in this phase remain **five**: 11-01, 11-05, 11-08.1, 11-15,
11-16.

**Three open items handed forward:**

1. **NO TEST ASSERTS WHAT A DEMO PATH DEPICTS.** Measured, not supposed: the old
   GHOST path left in place produced a plausible OG image and turned nothing red.
   Every gate on `demo.ts` checks well-formedness and non-darkness. A path that
   demonstrates the wrong half of a card is invisible to all of them.
2. **`D-11-10-b` is worse, not smaller.** Two rows of
   `docs/HARDWARE-AUDITION.md`'s cost table have now been examined and **one was
   stale** — GHOST's, by fifteen characters, produced by 11-02 within this same
   phase. Sixteen rows remain unchecked.
3. **The LUMEN depth discrepancy, unchanged and unreconciled** (carried from
   11-09.2 and 11-10). Only the bench closes it.

---

## Known Stubs

**None.** Nothing was stubbed. The erase key is painted, lit, pressable and
tested; the recorder, the replay and the clear are all complete and reachable;
and every property this entry declares is derived from the fixture rather than
asserted by hand.

**Two things are deliberately absent and are named rather than left as edges:**

- **While a ghost is looping, a new drag cannot BEGIN on the bottom-right corner
  without erasing first.** One cell of 81, in the corner furthest from where a
  hand rests, and only while the key is lit. Written into the entry header rather
  than discovered later. A comet or a ghost dot passing OVER cell 80 is
  unaffected — the key acts on an onset and on nothing else.
- **The erase key takes a fixed red rather than a knob.** It is a function and not
  decoration, and it has to stay legible at every setting of both colour knobs.
  Adding a knob for it would have moved the shape character, which is the one
  thing this plan was told not to do.

---

## Self-Check: PASSED

- `src/lib/catalog/entries/ghost.ts` FOUND, `src/lib/catalog/listing.ts` FOUND,
  `src/lib/sim/demo.ts` FOUND, `src/lib/sim/lua-smoke.spec.ts` FOUND,
  `src/lib/browse/typographic.spec.ts` FOUND, `docs/HARDWARE-AUDITION.md` FOUND,
  `.planning/phases/11-bench-corrections/deferred-items.md` FOUND,
  `.planning/phases/11-bench-corrections/11-11-SUMMARY.md` FOUND.
- `0eeed1c` FOUND in `git log --oneline --all`; `fb88a73` FOUND; `53af9a0` FOUND.
