---
phase: 11-bench-corrections
plan: 12
subsystem: catalog
tags:
  [shuttle, blank-page, latching-transport, class-b, stop-key, budget, legibility]
requires:
  - phase: 11-bench-corrections
    plan: 11
    provides: "the PREV_FILES 84 / PREV_TESTS 863 / PREV_E2E 86 source + 105 runs / BASE_CHECK 580 / sweep 4 19 / catalog 27 baseline, GHOST's lit-corner key as a reusable idiom, and the finding that no test asserts what a demo path depicts"
  - phase: 11-bench-corrections
    plan: 02
    provides: "the two live gates - decay-idiom.spec.ts and touch-guard.spec.ts - and the class-B code-9 trap this entry's own header warned about before the gate existed"
provides:
  - "A SHUTTLE re-authored from a blank page: a three-row transport bar on the axis the finger pushes, a white zero mark, direction as colour AND position, a latching speed, and a stop that is the whole bottom row painted red"
  - "Both of shuttle.ts:79-89's documented reasons answered in writing before any design was drawn - reason 1 structurally, reason 2 by removing the dependency on the lift entirely"
  - "The measured proof that the latching shape DOES NOT FIT with the repaint in touch_cb - 935 of 908, 27 over - and fits at 540 / 542 once the repaint moves into the Timer"
  - "PARITY_ALLOWANCES emptied: SHUTTLE's fast tap now sends exactly what a slow press sends, 51 messages against 51"
  - "D-11-12-a: nothing in the tree catches a Timer re-armed with a period of zero. Planted, and 105 server tests plus 6 sweep tests stayed green"
  - "D-11-12-b: nothing in the tree asserts that a card is legible. Forward and reverse given one colour, and once frames.json is regenerated the whole tree is green"
affects: [11-15, 11-16]
tech-stack:
  added: []
  patterns:
    - "A budget shortfall answered by moving work between events rather than by trimming the design: the Setup was 27 over 908 and the Timer had 727 free"
    - "A latching gesture whose EXIT IS A CELL rather than a lift, which makes the code-9 trap structurally unreachable instead of solved"
    - "A resting picture that carries the card's whole legend - each side's colour at one fifth brightness, plus a marked zero - so the control is readable before it is touched"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/shuttle.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/frames.json
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/11-bench-corrections/deferred-items.md
key-decisions:
  - "THE REDESIGN LATCHES, reversing a documented decision - because the objection was never to latching but to a latch whose only exit is an unmarked centre column, and a painted nine-cell stop row answers that objection outright"
  - "There is NO tap-versus-hold rule, and that is the point: the exit is a press, so a coalesced code-9 tap stops the transport in one message and no branch reads contact duration"
  - "The hybrid - latch above a speed threshold, spring below - was costed at 601 / 533 and REJECTED ON LEGIBILITY, not price: a rule that changes behaviour at an invisible threshold re-earns the bench note it was meant to answer"
  - "The repaint moved from touch_cb into the Timer because the Setup did not fit; the picture is now re-derived from self.s on every fire and cannot drift out of step with the state"
  - "The track carries each side's colour at one fifth brightness, so 'which side is forward' is answered at rest with no finger on the pad"
  - "The two colour knobs keep the ids `arc` and `rest` although both names are now stale - wild-stamps.json pins them, and the shape character 2 and the captured x2333333 are both unmoved"
patterns-established:
  - "A wave that re-authors an entry re-measures that entry's row in docs/HARDWARE-AUDITION.md and says whether the row was already stale - three rows checked in three waves, one stale"
requirements-completed: [CONT-02, CONT-03, PREV-01]
duration: 47min
completed: 2026-09-10
---

# Phase 11 Plan 12: SHUTTLE re-authored, the lift owed nothing, and the stop painted red Summary

**The latching design the plan asked to be costed DOES NOT FIT: 935 characters
of 908 on the Setup, twenty-seven over, while its Timer sat at 181 with 727
free. Moving the repaint out of `touch_cb` and into the Timer - the event that
had the room - brings it to Setup 540 and Timer 542 at the RGB444 picker corner,
368 and 366 free. A request that could not fit was made to fit by spending the
other half of the budget, not by trimming the ask.**

## Performance

- **Duration:** 47 min, one executor session
- **Tasks:** 2 of 2
- **Files modified:** 6, across two commits

---

## THE ANSWER TO `shuttle.ts:79-89`, WRITTEN BEFORE ANY DESIGN WAS DRAWN

The plan requires this paragraph first, and it is first. The old file gave two
reasons for refusing to let a speed survive the lift. Both are restated here in
my own words and answered one at a time.

### Reason 1 — *"a video that scrubs forever and can only be stopped by touching the exact centre column"*

**Restated:** if the speed outlives the finger, the only way back to zero is to
land on the one column of nine that means zero. That column is unmarked, it is
the same size as every other column, and it sits between the two lowest speeds -
so the gesture that stops the transport is the hardest one on the pad to
perform, and there is nothing on the pad that says so.

**Verdict: REVERSED, and the reason is ANSWERED STRUCTURALLY.** The objection is
correct about that latch and it is not an objection to latching as such. It is
an objection to a latch **whose exit has no affordance**. The rewrite gives the
exit an affordance: **the whole bottom row, nine cells wide, painted red the
entire time there is anything to stop, and dark otherwise.** It is the largest
target on the pad and the only red thing on it. The row being dark while the
transport is stopped is the other half - the pad never carries a key that does
nothing, which is GHOST's lit-corner idiom from 11-11 reused rather than
reinvented.

### Reason 2 — *"a DOWNUP arrives with NO LIFT BEHIND IT, so a tap that set a speed could never be cleared by the same gesture that set it"*

**Restated:** firmware coalesces a sub-cycle press-and-lift into one message with
event code 9. A latch that is released by the lift will never see one. So a fast
tap arms a latch that nothing clears.

**Verdict: SOLVED BY REMOVING THE DEPENDENCY, which is the only honest way to
answer it.** The old reasoning is exactly right *about a latch whose exit is the
lift*. This one's exit is not a lift. **Stopping is a press**, and a press is
something code 9 delivers as completely as codes 4 and 1 do - so a coalesced tap
on the red row is a full stop, in one message, with nothing owed afterwards.

The consequence is the design's best property and it is written into the header:
**there is no tap-versus-hold rule in this file, and no branch anywhere reads how
long a contact lasted.**

```
press, drag or tap, anywhere above the bottom row -> set the speed
press, drag or tap on the bottom row while it is red -> stop
lift -> nothing at all
```

**"The gate now exists" is NOT the answer, and the plan is right to say so.**
`touch-guard.spec.ts` checks that code 9 is *classified* correctly; it cannot
check that a latching transport can be *stopped*. What answers reason 2 is that
the stop needs no classification at all.

**A tap-versus-hold rule was considered and rejected on evidence, not on price.**
`src/lib/sim/touch.ts` never emits code 9 (`TOUCH-CODE-9.md`, commit `4b259f0`),
so a design whose behaviour turns on spotting a coalesced tap is invisible in the
browser preview. 11-09.1 rejected one on those grounds and this wave did not
author a second.

### And a third reason, which is the one the bench actually filed

Neither behaviour answers *"don't understand how it works"* on its own, and D-04
says the verdict is on the behaviour. **The real defect was that the indicator
and the gesture shared no geometry.** The control was a horizontal axis across
all nine columns; the picture was a ring of sixteen cells at radius two. A ring
says *turn me*. Nothing in it said *slide left and right*, nothing in it marked
zero, and forward and reverse were **the same colour**, distinguished only by
which way round the ring the arc had grown - invisible unless you happened to be
watching it grow, and invisible entirely once it stopped.

That is a verdict on the behaviour and not on the copy: **the shape of the
control was wrong for the gesture.** A legend would not have fixed it.

---

## THE THREE SHAPES, COSTED AS LUA BEFORE A LINE WAS AUTHORED

Every figure `max(GridScript.compressScript(lua).length, lua.length)` after
`await padReady()`, at the **RGB444 picker corner** - both colour knobs at
`255,255,255`.

### SHUTTLE before a character moved

| | Setup | free | Timer | free |
| --- | --- | --- | --- | --- |
| defaults | 663 | 245 | 201 | 707 |
| all-longest declared | **663** | 245 | **201** | 707 |
| all-shortest declared | 659 | 249 | 201 | 707 |
| **RGB444 picker corner** | **683** | **225** | **201** | **707** |

**THE PLAN'S OBJECTIVE QUOTES THE WRONG CORNER**, and it is the same defect
11-16 owns for five other entries. *"Setup 663 of 908, 245 free"* is the
**all-longest DECLARED** corner. At the picker corner the Setup is **683 and the
free space is 225**, twenty fewer than the plan budgeted against. The Timer half
- 201 of 908, 707 free - is right at both corners, because it carries no colour
token.

**SHUTTLE is the tenth entry checked and the SIXTH confirmed quoting the declared
corner rather than the picker corner** (after CONSOLE, FORGE, STEPS, POMODORO and
STAGE). Eleven headers have never been checked.

### The three sketches, and a fourth architecture the shortfall forced

Written as Lua and run through `measureLua` with nothing committed:

| Sketch | Setup | free | Timer | free |
| --- | --- | --- | --- | --- |
| **A** — lift-stops kept, legibility rebuilt, repaint in Setup | **686** | 222 | 181 | 727 |
| **B** — latching, painted stop row, repaint in Setup | **935** | **−27** | 181 | 727 |
| **A2** — lift-stops kept, repaint moved into the Timer | 423 | 485 | 401 | 507 |
| **B2** — latching, painted stop row, repaint in the Timer | **540** | **368** | **533** | **375** |
| **C2** — hybrid: latch above a threshold, spring below | **601** | 307 | 533 | 375 |

**B DOES NOT FIT.** That is the plan's own asymmetry note cashed in: the Setup
was 27 characters over 908 while the Timer sat at 181 with 727 free. **A request
that cannot fit is a finding, not a failure** - so the finding was reported to
the architecture rather than to the design, and the repaint moved into the event
that had the room. Nothing was trimmed from the ask: B2 is B, cell for cell.

**The move is not only a budget trick.** The Timer already runs at the
transport's own cadence, and a picture re-derived from `self.s` on every fire
**cannot drift out of step with the state it is drawing**. `touch_cb` is left
doing exactly one thing - writing a number.

### The choice, and why the hybrid was rejected on grounds other than price

**B2 ships.** C2 fits, at 61 more Setup characters, and was **rejected on
legibility**:

> A visitor lifts at speed 2 and the transport stops; lifts at speed 3 and it
> keeps going. That is a hidden rule with no affordance on the pad, and it would
> earn the bench note *"don't understand how it works"* a second time. It
> answers both documented reasons structurally, exactly as the plan says a
> hybrid can - and it answers them by making the card harder to read, which is
> the thing this plan exists to fix.

**A2 was the honest alternative and it was not taken**, for the reason the plan
demands be stated: D-04 puts the verdict on the behaviour, and the
keep-lift-stops shape has to argue the behaviour was right and only unreadable.
**That argument can be made about the ring's geometry but not about the lift.**
A transport bar with no stop control on it cannot tell a visitor, from the pad
alone, what will happen when they lift - the plan's own first must-have. **A pad
with a stop button obviously latches; a pad without one says nothing either
way.** The red row *is* the answer to "what happens when you lift", and it exists
only in the latching shape.

### SHUTTLE, shipped

| | Setup | free | Timer | free |
| --- | --- | --- | --- | --- |
| defaults | **540** | 368 | **538** | 370 |
| all-longest declared | 540 | 368 | 538 | 370 |
| all-shortest declared | 540 | 368 | 535 | 373 |
| **RGB444 picker corner** | **540** | **368** | **542** | **366** |

**The Setup is 540 at EVERY corner**, which is a stronger statement than "540 at
its worst": after the repaint moved out, the Setup carries no colour token at all
and every value of `@BASEP` is three characters, so its cost is a **constant**
rather than a maximum. Both events are fixed points of `compressScript` and both
pass `checkSyntax`.

**Net at the picker corner: Setup −143, Timer +341.**

---

## The counts, as a carried name plus a delta

| Name | Carried (11-11) | Observed | Delta |
| --- | --- | --- | --- |
| `PREV_FILES` | 84 | **84** | **+0** |
| `PREV_TESTS` | 863 | **864** | **+1** — exactly the declared term |
| `PREV_E2E` | 86 source titles / 105 runs | **86 source titles** | **+0** (the suite is not run here) |
| `BASE_CHECK` | 580 | **580**, `0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` | **+0** |
| sweep members | `4 19` | **`4 19`** | **+0** |
| catalog | 27 | **27** | **+0** |

`npm run test:quick` exits **0**: *"84 passed (84) / 864 passed | 1 todo (865)"*.
`check-counts.mjs 84 864` exits **0**; `84 863` exits **1**, *"tests: observed
864, expected 863"*. **Both were run and both are reported.**
`npm run test:sweep | node scripts/check-counts.mjs 4 19` exits **0**.
`npm run lint` clean. `grep -c "test(" e2e/*.e2e.ts` totals **86**.

**The single test is `lua-smoke.spec.ts` 19 -> 20**, which is where 11-09.2,
11-10 and 11-11 each put an entry-pinned test. The plan names that file directly.

### The sweep totals, re-observed and all unmoved

| Sweep readout | Carried | Observed | Moved? |
| --- | --- | --- | --- |
| compiler route / reachability | Pass A **20,782**, Pass B 24,576, total **45,358** | identical | **no** |
| Lua route round trip | Pass A **49,824** (w 49,424, x 382), Pass B 118,784, total **168,608** | identical | **no** |
| `lua-entries` | **1,176** combinations, 2,352 measurements | identical | **no** |
| kind cross-product | 1,296 combinations, worst **906 of 908** | identical | **no** |

**A SIXTH independent confirmation that compiler Pass A cannot move for a
hand-authored Lua entry**, and the Lua-route Pass A did not move either - it
counts knob POSITIONS, and this rewrite kept all six knobs at exactly their old
value counts.

---

## What SHUTTLE is now, and what it looks like

**The bar is rows 3, 4 and 5** - cells 27..53, one contiguous run, so a cell's
column is `n%9` and no table is needed. `d = n%9 - 4` is a signed distance from
the centre in −4..4, which is the same scale the speed `v = x*9//128 - 4` is on:
**a cell is lit exactly when `d` and `v` share a sign and `|d| <= |v|`.** Four
columns each side, four speeds each way, one cell per unit.

**The centre column is the zero mark** - cells 31, 40 and 49 - in a fixed white,
painted once in Setup. Layer 1 holds a still white at phase 160 and layer 2 runs
the sine shape from phase 0 at rate 2, so it breathes. **Measured over 300 ticks
it swings between 79 and 205 of 255 and never reaches 0**: a marker that dips to
black is not a marker.

**The track already answers "which side is forward", at rest.** Every bar cell is
painted in the colour of the side it is on and divided down by five when it is
not part of the current speed. Measured at the defaults:

```
AT REST
  row 4  [50,21,0] [50,21,0] [50,21,0] [50,21,0] [181,181,181] [0,39,50] [0,39,50] [0,39,50] [0,39,50]
  row 8  [0,0,0] x9

FORWARD 3, finger down
  row 4  [50,21,0] [50,21,0] [50,21,0] [50,21,0] [81,81,81] [0,198,253] [0,198,253] [0,198,253] [0,39,50]
  row 8  [195,0,0] x9

AFTER THE LIFT, 60 ticks
  row 4  unchanged, [0,198,253] still lit; 8 further keystrokes -> IT LATCHED

AFTER A FAST TAP AT COLUMN 1 (code 9)
  row 4  [50,21,0] [253,109,0] [253,109,0] [253,109,0] [147,147,147] [0,39,50] x4

AFTER A FAST TAP ON THE RED ROW
  row 4  back to the track; row 8 dark; 0 keystrokes since
```

Lit against track is a factor of **five** - `[0,198,253]` against `[0,39,50]` -
which is unmistakable and still far from "a speed the transport is not doing",
which is the old file's own reason for keeping the track dim.

**The stop row is cells 72..80**, the bottom row, because `+y` runs down on this
module (`console.ts:37`). Red when `|v| > 0`, black otherwise, on both layers,
with layer 2 pulsing at `@GAIN*|v| + 2` so a faster transport asks to be stopped
more loudly.

---

## Both gates, green, with NO new rows in either table

| Gate | Rows before | Rows after | Result |
| --- | --- | --- | --- |
| `touch-guard.spec.ts` `DECLARED_EXCEPTIONS` | 2 (stage, forge) | **2** | green, 3 tests |
| `decay-idiom.spec.ts` `KNOWN_VIOLATIONS` | 0 | **0** | green, 3 tests |

**And the onset guard is now EXAMINED rather than merely correct.** The old entry
wrote `(e==1 or e==4)`, which `isLiveTest` classifies as a live test and test 2
skips - correct, and unchecked. The rewrite splits the two questions:

- the live filter is the blessed spelling `if i>0 or e~=1 and e~=4 and e<9 then return end`, the same one CONSOLE and LUMEN use, which is a non-trigger by construction;
- the stop is guarded by `(e==4 or e>8)`, a chain with no `e==1` in it, so test 2 **reads it** and confirms it admits the fast tap.

**THE PARENTHESES IN `(e==4 or e>8)` ARE LOAD-BEARING HERE AND THE HEADER SAYS
SO.** The full expression is

```
local v=(e==4 or e>8)and s.s~=0 and y*9//128==8 and 0 or x*9//128-4
```

and `and` binds tighter than `or`, so a bare copied pattern would parse as
`e==4 or (e>8 and ...)` and turn every press into a stop press.

The decay gate has nothing to check and that is by construction: the only shaped
writes are keepers (`shape 3`, skipped by section 4 of its header) and every
other `glpfs` carries **rate 0**, which the gate skips by its own rule rather
than by an excuse.

---

## `PARITY_ALLOWANCES` IS NOW EMPTY, AND THAT IS A RESULT RATHER THAN A TIDY-UP

Its one row excused SHUTTLE. The old `(e==1 or e==4)` evaluated a coalesced tap
to a speed of **zero**, so a fast tap on that card sent nothing at all - and the
row said so in as many words.

```
fast tap against slow tap, per entry:
  shuttle: fast tap 51, slow tap 51
```

**Identical.** Test 5 fails a row whose two lists have stopped differing, so the
row had to go; the table and its type stay, with the history in a comment, for
the reason `KNOWN_VIOLATIONS` stays empty in `decay-idiom.spec.ts`.

**THE CONDITION IS MEASURED AND WRITTEN DOWN RATHER THAN LEFT TO LUCK.** The slow
run holds for `PARITY_HOLD` = 6 ticks longer than the fast one, and at the
defaults the Timer's period at the probe's column is `300//(1+3)` = 75 ms = 7.5
ticks. Six ticks is less than one period, so the extra hold buys no extra
keystroke. **A shorter default period would make the two runs differ again - by a
count, not by a defect** - and that sentence is now in the file above the table.

**The residue probe (test 4) is green on SHUTTLE with no allowance row, and the
reason it is green is worth knowing.** A latching card by definition leaves state
behind. It passes because the probe's diagnosis is **phase-based** and this
card's state is expressed in **colour**: the lit bar cells sit at phase 255 in
both runs, and the untouched run holds the same phase, so the probe's
`there.some(pha !== 0)` arm excludes them; the stop row's layer 2 is `sha 3` and
excluded as a keeper. **This is the SNAKE case in reverse, and it means the green
result is not evidence that the card leaves no state.** It is recorded here
rather than claimed as a pass.

---

## The three negative checks, with both exit codes, and TWO OF THEM FOUND GAPS

**Every plant restored from a scratch copy with `sha256` compared either side. No
`git checkout`, `git restore`, `git stash` or `git clean` was run at any point.**
`shuttle.ts` `7353a86…4505` before the first plant and after its restore;
`9dbb06e…c2d5` before the second and third and after both restores;
`frames.json` `c2b8db1…8c05` either side of the third.

| # | Plant | Exit | Reddened on |
| --- | --- | --- | --- |
| **1** | the `math.max` floor removed, the Timer period driven to zero at every knob value | **0** | **NOTHING.** 18 files / 105 server tests green, sweep 6 tests green, `frames.spec.ts` included |
| **2** | the stop clause replaced by a plain `x*9//128-4`, making the red row a no-op | **1** (restored **0**) | the new test, on the stop clause by name: *"shuttle column 0: THE RED ROW MUST STOP THE TRANSPORT. 50 keystroke(s) arrived in the 300 ticks after the tap on it"* |
| **3** | forward and reverse given the SAME four colours | **1**, then **0** | `frames.spec.ts` only, on a **pixel hash**. Regenerating `frames.json` made 23 files / 133 tests and the 6 sweep tests green again |

### Check 1 — the silent Timer stop, and the gap it found

The plan predicted the picture would freeze silently with no test complaining.
**It does, and none does.** Observed under the plant:

```
FORWARD 3 held:  row 8 [195,0,0] x9, ONE keystroke total
AFTER THE LIFT:  0 further keystrokes
AFTER A FAST TAP AT COLUMN 1: row 4 STILL SHOWS FORWARD 3 in cyan
```

The Timer fired once, called `gtt(0, 0)`, and never fired again. The pad went on
showing a speed it was no longer sending, and a tap in the other direction
changed nothing at all. **No error, no raise, and every gate green.**

The fixture could not see it because SHUTTLE's resting picture is identical
whether the Timer repaints it or not, and nothing else drives a Timer entry long
enough to notice it stop. **Nine of the eighteen hand-authored entries store a
Timer.** Recorded as **`D-11-12-a`**, with a concrete proposal: every `gtt` in a
Timer whose argument resolves statically must resolve above zero, which is the
same arithmetic `decay-idiom.spec.ts` already does for phases.

### Check 3 — legibility, and the gap that is larger than the plan predicted

The plan expects *nothing to fail*. Something did: `frames.spec.ts`, on a frame
hash. **That is a change detector and not a legibility gate**, and the
distinction is the whole finding - **regenerating the fixture, which is exactly
what an author does when a picture legitimately moves, turned the entire tree
green with a card on which the direction of travel cannot be read at all.**

This is 11-11's demo-path finding generalised: every gate in the catalog reads
well-formedness, budget, arithmetic and change. **None reads meaning.** Recorded
as **`D-11-12-b`**, and it is explicitly left open whether it *should* be gated
at all - the honest answer may be that legibility belongs on a bench, which is
what row 18(b) now is.

---

## The copy, counted by script

| | String | Length |
| --- | --- | --- |
| before | *"Scrub video with your finger, and the arc grows and spins faster the harder you push it."* | **88** |
| after | *"Push right to run the video forward and left to run it back; it keeps going until you press the red row."* | **104** |

The cap is **110** (`catalog.spec.ts`, and `copy.spec.ts` again). Changed in
**both** `entries/shuttle.ts` and `listing.ts`; `listing.spec.ts` asserts the two
equal in both directions, and `front-door.ts` carries no description for SHUTTLE
(it is on the exclusion list, `id` and `why` only).

**Written for someone who has never edited video.** "Scrub", "jog" and
"transport" are all gone. The sentence names the direction, the latch and the
stop, and every word in it is a word a person who has never opened Premiere
already owns. The house register is plain and unexclamatory, and the semicolon
matches GHOST's neighbouring line.

**THERE IS NO `quiet` LINE TO MOVE.** The plan's task 02 asks for "the entry's
`quiet` line". `CatalogEntry` has no such field - `quiet` lives on
`FrontDoorEntry`/`ListingEntry`, and `listing.spec.ts` requires one only for an
entry whose `motion` is not `animated`. SHUTTLE's is `animated`, its listing row
carries no `quiet`, and `grep -c quiet src/lib/catalog/entries/shuttle.ts` is
**0**. Reported below rather than invented.

---

## The tags, checked BEFORE the question was asked

**Unchanged**: `["modulation", "expressive", "generative"]`. What the card is FOR
did not move - pushing further still scrubs further, which is modulation - and a
tag moved off this entry could only have cost.

**The histogram, computed over all 27 listing rows against the closed vocabulary
in `facets.ts`, before deciding:**

| Facet | Histogram | Sum |
| --- | --- | --- |
| **FOR** | modulation 7, show 5, mixing 3, sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 | **27** |
| **FEELS** | generative 12, expressive 11, readable 11, playable 8, **precise 6**, **still 6** | **54** |

`precise` and `still` sit at exactly **6**, the floor `facets.spec.ts:186`
asserts, unchanged since 11-01. The histogram is identical before and after this
wave, because no tag moved.

---

## `frames.json`, `motion` and `restsBlack`, all re-derived from the fixture

**The fixture DID move, and it had to.** This rewrite changes what the Setup and
the Timer paint at rest, which is precisely the class of change the plan says can
move it - and, unlike the six waves before it, this one is on the far side of
that line.

| Property | Carried | Re-derived | Moved? |
| --- | --- | --- | --- |
| `nonZeroBytes` at tick 0 | 29 | **9** | **yes** |
| `nonZeroBytes` at 37, 101, 500, 1009 | 28, 28, 28, 29 | **57 at all four** | **yes** |
| `animating` at all five | true | **true** | **no** |
| `motion` in `listing.ts` | `animated` | **`animated`** | **no** |
| `restsBlack` | false | **false** | **no** |

**Nine bytes at tick 0 and fifty-seven afterwards is a real property of the card
and it is recorded rather than smoothed over.** Setup paints the white zero mark
and nothing else, and closes with `gtt(0, 20)` rather than `gtt(0, @BASEP)` - so
the Timer draws the whole card 20 ms after boot. The mark is a Setup write, so
`restsBlack` is FALSE from the very first frame and not only from tick 3.

**`motion` was re-derived from `animating` and not inherited.** `animating` is
true at all five ticks, so `animated` stands; `listing.ts` did not move on that
account and no front-door row exists to move.

**The `restsBlack` pair did not change.** GHOST and MORPH are still the two, so
`docs/TESTING.md:676` and `docs/INSTALL-RUNBOOK.md:102` are both still true and
neither was touched.

### The demo path was CHECKED, not assumed, and there is none

The prompt is explicit that a rewrite puts the demo path in scope and that
nothing would report a forgotten one. **`DEMO_PATHS` holds exactly two keys,
`ghost` and `morph`**, and `listing.spec.ts` fails any key whose entry does not
rest black - *"declares a demonstration gesture but does not rest black; a lit
pad needs no finger from us"*. SHUTTLE rests lit, so it has no path and cannot
be given one without changing that rule. `src/lib/sim/demo.ts` is byte-untouched
by this plan.

**The consequence is a real limitation and it is reported rather than
swallowed:** SHUTTLE's social preview is its RESTING picture, so it can show the
bar, both direction colours and the zero mark - which it now does, in colour -
but it can never show the red stop row, because the stop row exists only while
something is running. **Inspected by eye after `npm run build`:** amber to the
left, cyan to the right, a white tick down the centre, on a nine-by-nine field.
Before the track was coloured the same image was a near-monochrome grey band that
read as *off* rather than as *waiting*; that was seen, and fixed, rather than
shipped.

---

## The test, and the three claims it pins

`lua-smoke.spec.ts` **19 -> 20**: *"runs SHUTTLE faster the further out you push,
and stops it on the red row"*. Printed by the test from live runs:

```
SHUTTLE push, latch and stop, plan 11-12:
  presses per column in a 300-tick window: [50,37,30,20,0,20,30,37,50]
  key code per column: [13,13,13,13,null,15,15,15,15]
  every gesture was a coalesced fast tap (code 9); the red row stopped all nine
```

1. **SPEED RISES WITH DISTANCE FROM CENTRE, as a MONOTONIC RELATION and never as
   literals**, strictly, on both sides, with nothing at the centre - so a
   re-tuned period moves the numbers and not the test. **The key code is
   asserted per side as well**, because a probe that only counted messages would
   pass a card that ran the video backwards on both halves.
2. **THE STOP GESTURE STOPS IT.** Not "sends less" - sends **nothing**, over a
   settle as long as the slowest period the card can carry, with the bar back to
   its track and the red row dark. Asserted after every one of the nine pushes.
3. **EVERY GESTURE IN THE TEST IS A FAST TAP.** `touchTap` is the only path that
   makes the coalesced code-9 message, so the same probe asserts that a tap SETS
   a speed and that a tap CLEARS one. **That pair is the machine form of the
   second documented reason** and it is the assertion the plan says must not be
   skipped.

**Every boundary is read off the entry's own Lua**: the bar's cell run, the stop
row's cell run and both key codes are parsed or derived, so a card re-cut onto
different rows moves this test with it instead of drifting past it. **"Lit" is
defined against the card's own resting track** rather than a colour literal, and
the breathing zero mark is excluded from that comparison - a cell that is
brighter and dimmer than itself by design would otherwise report its breath as a
speed. Non-vacuity is asserted twice: the total press count must exceed zero, and
the two key codes must differ.

---

## The shape character: proved before and after, not asserted

| | knobs | ids | value counts | total | shape |
| --- | --- | --- | --- | --- | --- |
| **before** (`git show HEAD~2`) | 6 | period, gain, forward, backward, arc, rest | `[4,4,4,4,4,4]` | 24 | **`2`** |
| **after** | 6 | period, gain, forward, backward, arc, rest | `[4,4,4,4,4,4]` | 24 | **`2`** |

`(6 × 7 + 24) mod 32 = 66 mod 32 = 2`. **No new knob, no changed value count and
no changed id.** `decodeFor(SHUTTLE, "x2333333")` returns
`{"kind":"restored","indices":{"period":3,"gain":3,"forward":3,"backward":3,"arc":3,"rest":3}}`
- the byte-for-byte capture from commit `b3f99bb` still lands **restored**. The
POMODORO tripwire is not spent again. `git diff --quiet HEAD -- src/lib/share/stamp.ts src/lib/share/fixtures/wild-stamps.json`
exits **0**.

**TWO KNOB IDS ARE NOW STALE NAMES ON PURPOSE, and the file says so.** The colour
knobs are still `arc` (now "Forward colour", token `@FWDC`) and `rest` (now
"Reverse colour", token `@REVC`) although there is no arc and nothing rests in
either. `wild-stamps.json` keys its two SHUTTLE records on those ids and
`stamp.spec.ts` asserts the decoded indices equal them, so renaming either would
break a fixture whose whole value is that it was never regenerated. CHORUS's
`@SPREAD` carries the identical note for the identical reason. **The labels carry
the meaning; the ids are history.**

**`rest`'s four VALUES did move** - from four dim track colours to four bright
reverse colours, each the opposite hue of the forward value at the same index
(cyan against amber, orange against blue, green against rose, magenta against
lime). A value's CONTENT is not a resize: index 0 still decodes to index 0, the
arity is unchanged, and the shape character does not see it.

---

## Deviations from Plan

### 1. [Rule 3 - blocking] Three of task 02's four files moved in task 01's commit

- **Found during:** task 01
- **Issue:** the plan puts `listing.ts`, `frames.json` and `lua-smoke.spec.ts`
  under task 02. All three are **coupled to the entry** and leave the tree red if
  they move separately: `listing.spec.ts` asserts the entry's description and the
  listing's are equal in both directions; `frames.spec.ts` re-samples every entry
  live and fails a moved picture; and `lua-smoke.spec.ts` test 5 fails a
  `PARITY_ALLOWANCES` row whose two runs have stopped differing, which SHUTTLE's
  did the moment the rewrite landed.
- **Fix:** all four moved in task 01's commit. Task 02's commit carries the new
  test, the audition row and the deferred items. This is the same deviation
  11-11 recorded for `listing.ts` alone, widened by the fixture and the
  allowance.
- **Files modified:** `src/lib/catalog/listing.ts`, `src/lib/catalog/frames.json`, `src/lib/sim/lua-smoke.spec.ts`
- **Commit:** `cf6d770`

### 2. [Rule 1 - bug] `PARITY_ALLOWANCES` had to be EMPTIED, which the plan does not mention

- **Found during:** task 01, first full run of `lua-smoke.spec.ts`
- **Issue:** the table's SHUTTLE row is not an excuse the plan controls - test 5
  asserts that an excused entry's two runs **still differ**, and fails with
  *"PARITY_ALLOWANCES excuses shuttle and its two runs now agree. Delete the
  row"*. The rewrite makes them agree at 51 messages each.
- **Fix:** the row deleted and replaced by a comment carrying the history, the
  measurement and the condition under which the two runs would differ again. The
  type and the table are kept for the reason `KNOWN_VIOLATIONS` is kept.
- **Files modified:** `src/lib/sim/lua-smoke.spec.ts`
- **Commit:** `cf6d770`

### 3. [judgement, reported] The plan's task 02 test asks for a "stateless" fast tap, and a latching card cannot have one

- **Found during:** task 02
- **Issue:** the plan asks the test to assert that a fast tap *"does something
  sensible and stateless - it does not leave the transport running with no way to
  stop it"*. The first half presumes the momentary shape. Under the shipped
  design a fast tap **does** leave the transport running.
- **Decision:** the clause was read as its own second half, which survives the
  reversal intact and is the part that matters: the test asserts that a fast tap
  starts the transport **and** that a fast tap on the red row stops it dead. That
  is "with a way to stop it", asserted rather than assumed, nine times.
- **Files modified:** `src/lib/sim/lua-smoke.spec.ts`
- **Commit:** `b06810b`

### 4. [Rule 2 - missing critical functionality] The first OG image read as "off" rather than "waiting"

- **Found during:** task 01, inspecting `static/og/shuttle.png` after the build
- **Issue:** the first draft painted an uncoloured grey track at `28,28,28` and a
  mark at layer-1 phase 70. The social preview was a near-black card. The plan's
  own legibility requirement is *"a resting cue - the pad should look like
  something that is waiting, not like something that is off"*, and the picture
  failed it.
- **Fix:** the track carries **each side's colour at one fifth brightness** and
  the mark's still layer moved to phase 160. The resting card now answers "which
  side is forward" before it is touched, which is a legibility gain and not a
  cosmetic one. `frames.json` regenerated twice in the wave for this reason and
  the final figures are the ones reported above.
- **Files modified:** `src/lib/catalog/entries/shuttle.ts`, `src/lib/catalog/frames.json`
- **Commit:** `cf6d770`

### 5. [Rule 2] The audition's row 18 was EXTENDED rather than a row 24 added

- **Found during:** task 02, step 5
- **Issue:** `audition.spec.ts` pins `ROW_COUNT = 23`, its test TITLE spells
  "twenty-three", and the document's prose says so in three more places. Adding a
  row 24 would move a number in five places to add a check to a configuration
  that already has row 18.
- **Fix:** row 18 now carries **(a)** the original scrub-and-keep-up check and
  **(b)** the cold-pickup check this plan owes, with the reason no gate can take
  it - including the planted proof from negative check 3. Identical treatment to
  11-11's row 6.
- **Files modified:** `docs/HARDWARE-AUDITION.md`
- **Commit:** `b06810b`

### 6. [Rule 1 - bug] `docs/HARDWARE-AUDITION.md`'s SHUTTLE row moved, and was NOT stale first

- **Found during:** task 02
- **Issue:** the row read **663 / 201**, which this wave makes wrong.
- **Fix:** moved to **540 / 538**, with the provenance paragraph saying plainly
  that the old row **was accurate for the entry that carried it** - unlike
  GHOST's, which 11-11 found stale by fifteen. `D-11-10-b` is amended: three rows
  checked in three waves, **one** of the three stale, **fifteen** unchecked.
- **Files modified:** `docs/HARDWARE-AUDITION.md`, `deferred-items.md`
- **Commit:** `b06810b`

### 7. [reported] A third negative check the plan did not ask for

Check 1 in the table above is the plan's; checks 2 and 3 are task 02's. All three
were run. No fourth was needed: this phase's first standing warning is about
green negative results, and **two of the three came back green** - both were
chased to a mechanism rather than filed as passes, which is what the warning
asks.

**No other rule fired.** No missing dependency, no broken import, and no
architectural question - the entry stayed inside its two events and its existing
knob rack.

---

## Everything the plan asserts that the tree does not support

1. **THE OBJECTIVE'S BUDGET QUOTES THE WRONG CORNER.** *"Setup 663 of 908, 245
   free"* is the all-longest DECLARED corner. At the RGB444 picker corner - the
   one the 908 gate reads - SHUTTLE's Setup was **683**, leaving **225** free.
   The plan budgeted the design against twenty characters that were not there.
   SHUTTLE is the **tenth entry checked** and the **sixth confirmed wrong**.

2. **THE PLAN MIS-CITES THE TIMER FLOOR AS `math.max(...,1)//1`.** It is
   `math.max(@BASEP//(1+k),20)//1` and always has been - the floor is **20 ms**,
   not 1. The stronger floor was kept, and 20 satisfies the plan's requirement
   with room to spare.

3. **THE ENTRY HAS NO `quiet` LINE AND CANNOT HAVE ONE WHILE IT IS `animated`.**
   Task 02 step 1 asks for "the entry's `quiet` line" to move with the redesign.
   `CatalogEntry` carries no such field; `listing.spec.ts` requires one only of
   entries whose `motion` is not `animated`. SHUTTLE's is, so it has none.

4. **`shuttle.ts:80-92` IS CITED BY LINE AND THE PASSAGE IS AT `:79-89`.** Three
   lines out. The passage is unambiguous and was read in full; noted because the
   plan cites it four separate times.

5. **THE LATCHING SHAPE THE PLAN ASKS FOR DOES NOT FIT IN THE ARCHITECTURE THE
   PLAN IMPLIES.** 935 of 908 with the repaint in `touch_cb`. The plan
   anticipates the asymmetry in general terms; the shortfall itself is a finding
   and is reported as one.

6. **TASK 02'S NEGATIVE CHECK 2 PREDICTS "NOTHING TO FAIL" AND ONE THING DOES.**
   `frames.spec.ts` reddens on a pixel hash. The prediction is right in substance
   and wrong in the letter, and the difference is the finding: a change detector
   is not a legibility gate, and regenerating the fixture erases it.

7. **`src/lib/sim/lua-smoke.spec.ts`'s header still opens "Thirteen tests"**, and
   the file now carries **20**. **Not corrected here**, for the same reason
   11-10, 11-11 and the two waves before them left it: it is one of the stale
   header counts **11-16 owns**, and correcting one would make the rest look
   checked.

---

## Invariants, each proved by a command

| Claim | Command | Result |
| --- | --- | --- |
| both gates green, no new rows | `decay-idiom.spec.ts`, `touch-guard.spec.ts` | **green, 3 + 3**; tables 0 and 2, unchanged |
| `frames.spec.ts` green with no `UPDATE_FRAMES` | run in the server project after each regeneration | **green, 5 tests** |
| `src/vendor/` untouched by this plan | `git diff --stat HEAD -- src/vendor/` | **empty**. No manifest row declared |
| `src/vendor/` unmoved since 11-04 | `git diff --stat 4131ff5 HEAD -- src/vendor/` | the recorded **four-file** output (`_pad.ts` 70, `pad-sim.ts` 29, `tests/pad-sim.test.js` 19, `tests/pad.test.js` 7) |
| `firmware-oracle.spec.ts` green and unedited | `git diff --quiet 9d06b00 HEAD -- ...`; run | **exit 0**; **green, 7 + 1 todo** |
| `upstream-manifest.json` untouched (**12th** wave) | `git diff --quiet 2d249f3 HEAD -- ...` | **exit 0** — the four mislabelled *"free at its worst knob position"* rows stand for 11-16 |
| configs and roadmap untouched | `git diff --quiet HEAD -- playwright.config.ts vite.config.ts .planning/ROADMAP.md` | **exit 0** |
| `stamp.ts` and `wild-stamps.json` untouched | `git diff --quiet HEAD -- ...` | **exit 0** |
| `demo.ts` untouched, and SHUTTLE has no path | `git diff --quiet HEAD -- src/lib/sim/demo.ts`; `DEMO_PATHS` read | **exit 0**; keys are `ghost` and `morph` only |
| shape character `2` before and after | knob rack read off `git show HEAD:...` and off `CATALOG` | `[4,4,4,4,4,4]`, `(6*7+24)%32 = 2` **both times** |
| the captured stamp still restores | `decodeFor(SHUTTLE, "x2333333")` | `{kind: "restored", indices: {...}}` |
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

Three scratch measurement specs were used (`zz-measure`, `zz-canon`, `zz-behave`)
and **deleted before any commit**; they do not appear in the file count, and
`npm run check` reads 580 with them gone.

---

## WHAT IS NOT CLAIMED

**Nothing here is hardware-verified.** *"Don't understand how it works"* was a
judgement made by a person at a pad, and **no agent connected to a device, wrote
to a device, or deployed anything.** A bar that reads clearly in a frame buffer
is a claim about a frame buffer; whether a ZONA's LEDs make the direction obvious
across a desk is a claim only a ZONA can settle.

**And whether the redesign ANSWERED the note is not claimed at all.** It cannot
be: negative check 3 proves that a SHUTTLE on which the direction cannot be read
is fully green. **The bench row for 11-16, now `docs/HARDWARE-AUDITION.md` row
18(b):**

> **Pick the module up cold and say what it does before anyone tells you.**
> Without being told: which side runs the video forward, where is zero, and what
> happens when you lift your finger? Then push a speed, lift, and stop it. Note
> whether you looked for the stop or found it, and how long each answer took.

---

## Commits

| Hash | Message |
| --- | --- |
| `cf6d770` | `feat(11-12): SHUTTLE re-authored as a latching transport bar, with the stop painted red and the lift owed nothing` |
| `b06810b` | `test(11-12): nine pushes and nine stops, all of them coalesced taps, and the two things nothing in the tree can see` |

---

## Carry-forward for the next wave

**`PREV_FILES` 84 · `PREV_TESTS` 864 · `PREV_E2E` 86 source titles / 105 runs ·
`BASE_CHECK` 580 · sweep members `4 19` · catalog 27**

**Sweep totals, re-observed and all unmoved:**

- compiler route **Pass A 20,782**, Pass B 24,576, **total 45,358**
- Lua route **Pass A 49,824** (format w 49,424, format x 382), Pass B 118,784, **total 168,608**
- `lua-entries` **1,176 combinations, 2,352 measurements**
- kind cross-product 1,296 combinations, **worst 906 of 908**

**Entry headers found quoting the declared-palette corner instead of the RGB444
picker corner: now SIX** — CONSOLE, FORGE, STEPS, POMODORO, STAGE and **SHUTTLE
(corrected here)**. SHUTTLE is the **tenth** entry checked; four of the ten were
correct only by the ARC/MORPH/LUMEN/GHOST accident of already declaring
`255,255,255`. **Eleven headers have never been checked. 11-16 owns the sweep.**

Suite-running plans in this phase remain **five**: 11-01, 11-05, 11-08.1, 11-15,
11-16.

**Five open items handed forward:**

1. **`D-11-12-a` — nothing catches a Timer re-armed with a period of zero.** New.
   Measured: the floor removed, the period driven to zero, 105 server tests and 6
   sweep tests green while the pad showed a speed it was not sending. Nine of the
   eighteen hand-authored entries store a Timer.
2. **`D-11-12-b` — nothing asserts that a card is legible.** New, and it is
   11-11's demo-path finding generalised. An illegible SHUTTLE is green once the
   fixture is regenerated.
3. **`D-11-10-b` is one row better informed.** Three rows examined in three
   waves, one stale, **fifteen unchecked**.
4. **NO TEST ASSERTS WHAT A DEMO PATH DEPICTS** (carried from 11-11), and this
   wave adds a corollary: an entry that does NOT rest black cannot have a demo
   path at all, so its social preview can only ever show its resting picture.
   SHUTTLE's red stop row is therefore invisible in `static/og/shuttle.png` by
   construction.
5. **The LUMEN depth discrepancy, unchanged and unreconciled** (carried from
   11-09.2, 11-10 and 11-11). Only the bench closes it.

---

## Known Stubs

**None.** Nothing was stubbed. The bar, the zero mark, the track, the stop row,
the latch and the keystroke path are all complete, reachable and driven by the
one test; every property the entry declares is derived from the fixture rather
than asserted by hand.

**Three things are deliberately absent and are named rather than left as edges:**

- **The bottom row cannot start a drag while the transport is running**, because
  while it is running that row is the stop. One row of nine, and only while it is
  lit red. Written into the entry header rather than discovered later.
- **The zero mark and the stop row take fixed colours rather than knobs.** Both
  are functions, not decoration, and both must stay legible at every setting of
  both colour knobs. Adding knobs for them would have moved the shape character,
  which is the one thing this plan was told not to do.
- **A speed CHANGE made while the transport is already running is drawn on the
  next Timer fire**, up to 200 ms at the slowest period and the slowest moving
  speed. Starts and stops do not wait for it - they kick the Timer to 20 ms. The
  price is stated as a number in the header, and re-arming on every change was
  rejected for the reason the old file gave: it starves the Timer, which now
  starves the paint as well.

---

## Self-Check: PASSED

- `src/lib/catalog/entries/shuttle.ts` FOUND, `src/lib/catalog/listing.ts` FOUND,
  `src/lib/catalog/frames.json` FOUND, `src/lib/sim/lua-smoke.spec.ts` FOUND,
  `docs/HARDWARE-AUDITION.md` FOUND,
  `.planning/phases/11-bench-corrections/deferred-items.md` FOUND,
  `.planning/phases/11-bench-corrections/11-12-SUMMARY.md` FOUND.
- `cf6d770` FOUND in `git log --oneline --all`; `b06810b` FOUND.
