---
phase: 12-touch-framework
plan: 08
subsystem: catalog
tags:
  [
    touch-library,
    hysteresis,
    expiry,
    sequencers,
    budget,
    negative-check,
    counts,
    finding,
  ]
requires:
  - phase: 12-touch-framework
    plan: 07
    provides: "TOUCH_LIBRARY at 769 of 908 with six functions; Q's contract (returns only on change, expires contact i first on every onset, hysteresis band 68..74); X's contract (n is in the CALLER's Timer calls); R must be idempotent; LuaHost.globalSize() as the read hook; host-surface's LIBRARY_GLOBALS admission"
  - phase: 11-bench-corrections
    plan: 08
    provides: "The inlined swipe guard this plan removes, and lua-smoke.spec.ts's swipe test, whose counting shape the new test copies and which stays green on all three of its named entries"
provides:
  - "FOUR SEQUENCERS ON THE LIBRARY: EUCLID, STEPS, RADAR POINTS and SONAR call Q(s,i,e,x,y) and carry no event-code test of their own; all four call X(s,20) in the Timer they already had"
  - "EIGHT MEASURED BEFORE/AFTER PAIRS at the RGB444 picker corner: -90 / -85 / -90 / -90 on the four Setups and +7 on every Timer, and the research's four-argument projections contradicted by exactly the +2 the five-argument call costs"
  - "THE BOUNDARY FINGER, COUNTED, ON ALL FOUR: one arm across the probe's six-MOVE Q2 trace where the naive read crosses five times, with the NET STATE asserted as well as the count"
  - "THE PRE-PLAN COUNTS, MEASURED FROM HEAD~1: three toggles on the held cell and three on its neighbour on the probe's own trace, and FOUR on a trace one sample longer - where SONAR's cell ends OFF, back at rest, armed and disarmed under a finger that never moved"
  - "THE SWEEP PROVED WIRED, not present: SONAR takes a DOWN with no UP and the library's H is read through globalSize - 1 after nine Timer calls, 0 after thirty"
  - "A FINDING the plan's negative check is wrong in BOTH placements: a duplicate guard is NOT invisible to every gate. 11-08's swipe test catches it after the call and both tests catch it before"
  - "A FINDING QUADRANT's Timer-plus-sweep FITS at 874 of 908 (34 free) once R replaces its inline release branch - the plan expected it not to - and it was still deferred, with the three reasons written into deferred-items.md section 3"
  - "A FINDING the plan's boundary cell is 49, not the 58 its own arithmetic states; the same paragraph's STEPS index (c=4, r=5) contradicts it"
affects:
  - "12-09 (CHORUS defines R and calls X; CONSOLE calls Q into its 56 free) - touch-guard.spec.ts's non-vacuity arm is now bounded from both ends and admits any number of delegating entries without an edit"
  - "12-12 (the bench row that decides the sweep window - now five callers, four of them here; QUADRANT's deferred row; the audition rows this plan wrote)"
tech-stack:
  added: []
  patterns:
    - "An entry whose event-code test lives in the library is REQUIRED to carry the call, not excused from carrying a guard - the non-vacuity question asked of a different observable"
    - "A toggling entry's boundary test asserts the NET STATE as well as the transition count, because an even number of crossings returns the cell to rest while the count still looks right"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/entries/steps.ts
    - src/lib/catalog/entries/radar-points.ts
    - src/lib/catalog/entries/sonar.ts
    - src/lib/catalog/touch-guard.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/phases/12-touch-framework/deferred-items.md
key-decisions:
  - "SONAR was re-fitted with the three the bench named, because it carried the guard byte for byte and toggles - not because a note asked for it"
  - "All four take X, reversing this plan's own earlier reasoning: Q's onset rules need a press and a lost contact may never press again"
  - "QUADRANT was NOT re-fitted even though the arithmetic fits at 874 of 908, because the shape it needs is a release-path refactor, a period nobody has chosen and a test this plan's declared term has no room for"
  - "touch-guard.spec.ts's non-vacuity arm is bounded from both ends rather than against a literal count of delegating entries, so waves 8 to 11 move no number in it"
patterns-established:
  - "Measure the negative check's own trace before measuring the fix: the naive column for the probe's gesture is asserted to cross five times before any entry is opened"
requirements-completed: [CONT-02, PREV-01, TUNE-05]
duration: 35min
completed: 2026-09-10
---

# Phase 12 Plan 08: The Sequencers onto the Library Summary

**Four entries that carried the same 126-character cell guard now carry one call each, at 90
characters less in Setup and 7 more in the Timer — and a finger resting on the line between two
cells arms one cell instead of three, counted in a VM against the entry as it shipped this
morning.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-10T22:40Z
- **Completed:** 2026-09-10T23:15Z
- **Tasks:** 2 of 2
- **Files modified:** 8 (0 created, 8 edited)

## Commits

| Hash      | Message                                                                    |
| --------- | -------------------------------------------------------------------------- |
| `804d4b4` | `refactor(12-08): four sequencers onto the library's Q, four Timers onto X` |
| `2dc7bc2` | `test(12-08): a boundary finger arms one cell on all four, counted`         |

## Counts, as carried names plus deltas

| Name         | Carried (12-07)      | Delta                     | Observed                    |
| ------------ | -------------------- | ------------------------- | --------------------------- |
| `PREV_FILES` | 85                   | **+0**                    | **85**                      |
| `PREV_TESTS` | 884                  | **+1**                    | **885**                     |
| sweep        | `4 19`               | +0 / +0                   | `4 19`                      |
| `BASE_CHECK` | 581                  | +0                        | **581 files, 0 ERRORS 0 WARNINGS** |
| catalog      | 26 (9 + 17)          | +0                        | 26                          |
| e2e          | 87 titles / 106 runs | **+0, declared, not run** | not measured                |

**A fourth entry added no test.** SONAR joins the one boundary test as a fourth subject and it was
already a subject of `lua-smoke.spec.ts`'s swipe test alongside EUCLID and STEPS, so the term does
not move. `touch-guard.spec.ts` stays at **3 tests** — its non-vacuity arm was rewritten inside
test 1 rather than added as a fourth.

`npm run lint` exit 0. `git diff --stat HEAD -- src/vendor/` empty; `firmware-oracle.spec.ts`
unedited. `git diff --quiet -- .planning/ROADMAP.md` clean. **`git diff --quiet --
src/lib/catalog/frames.json` exit 0** — every change is inside `touch_cb` and the fixture runs each
entry with no gesture, so nothing was regenerated and nothing moved.

**e2e was not run.** No file under `e2e/` changed and the plan's verification block does not ask for
it; `+0` is a carried declaration, not a measurement.

## The eight costs, at the RGB444 picker corner, before and after

Every figure is `max(text.length, measureLua(text))` after `padReady()`, at the corner
`lua-entries.sweep.spec.ts` gates: every knob at its longest declared value with each colour knob
overridden to `255,255,255`.

| Entry            | Setup before | Setup after | Δ       | Setup free after | Timer before | Timer after | Δ      | Timer free after |
| ---------------- | ------------ | ----------- | ------- | ---------------- | ------------ | ----------- | ------ | ---------------- |
| **EUCLID**       | 790          | **700**     | **−90** | **208**          | 230          | **237**     | **+7** | 671              |
| **STEPS**        | 479          | **394**     | **−85** | **514**          | 253          | **260**     | **+7** | 648              |
| **RADAR POINTS** | 579          | **489**     | **−90** | **419**          | 281          | **288**     | **+7** | 620              |
| **SONAR**        | 559          | **469**     | **−90** | **439**          | 282          | **289**     | **+7** | 619              |

At the defaults, which is what `docs/HARDWARE-AUDITION.md` records: EUCLID 786 / 226 → **696 / 233**,
STEPS 473 / 251 → **388 / 258**, RADAR POINTS 579 / 279 → **489 / 286**, SONAR 558 / 279 →
**468 / 286**. All eight strings are fixed points of `compressScript` and pass `checkSyntax` at the
defaults and across the whole sweep.

**The arithmetic, checked rather than quoted.** The guard is `if e~=1 and e~=4 and e<9 then
s.q[i]=nil return end local m=x*9//128+y*9//128*9 if s.q[i]==m then return end s.q[i]=e<9 and m ` —
**126 characters with its trailing space**, not the plan's 125, which counts it without. The
replacement is 45 with its space, not 44. `126 − 45 + 9 (self.q={}) = 90`, and three of the four
land exactly there. STEPS lands at **85** because it also trades `local a=c+r*9` for
`local c=a%9 local r=a//9`, which is the entry's own index arithmetic and the plan says so.

**The research's projection is contradicted by exactly the amount the plan predicted.** It measured
698 / 392 / 487 against a FOUR-argument call; the shipped `Q` takes `s`, and the three entries the
research costed measure **700 / 394 / 489** — two characters more, each. RADAR POINTS' header table
now carries all three of its rows re-measured, and STEPS' carries its all-shortest corner
(381 / 257) as well.

**The 394 coincidence, named in `steps.ts` so nobody reads it as a copy.** 11-07 measured STEPS at
394 BEFORE 11-08 inlined the swipe guard, which took it to 479; 12-08 handed the guard to the library
and it came back to 394. The entry costs today what it cost two plans ago, having gained a
per-contact dedup, hysteresis and an expiry sweep in between.

**`shapeOf` is unchanged for all four**, measured as the two quantities it sums: knob count and total
option count. EUCLID 6 / 45, STEPS 6 / 25, RADAR POINTS 5 / 36, SONAR 5 / 36 — identical before and
after. No knob was added, removed or resized, so no shared link changes meaning.

## What twenty `X` calls mean, in milliseconds, per entry

`X(s,n)` counts the CALLER's Timer calls (12-07's contract), so twenty is a different wall time in
each of the four and the knob moves it.

| Entry            | Knob      | Default   | 20 calls at the default | Range across the knob        |
| ---------------- | --------- | --------- | ----------------------- | ---------------------------- |
| **EUCLID**       | `@TEMPO`  | 110 ms    | **2.2 s**               | 1.4 s (70) — 4.8 s (240)     |
| **STEPS**        | `@TEMPO`  | 120 ms    | **2.4 s**               | 1.2 s (60) — 4.0 s (200)     |
| **RADAR POINTS** | `@PERIOD` | 140 ms    | **2.8 s**               | 1.6 s (80) — 5.6 s (280)     |
| **SONAR**        | `@PERIOD` | 70 ms     | **1.4 s**               | 0.8 s (40) — 3.2 s (160)     |

Every header says the number is a starting value and names 12-12's bench row as what moves it, and
says why it is safe to ship unbenched here where it was not in CHORUS: none of the four holds a note
per contact, so an early expiry forgets a stale cell rather than cutting a note. RADAR POINTS' and
SONAR's `s.z` pending lists are keyed by the TIMER's own fire, not by a finger, and the header says
that explicitly.

**The spelling was measured, not assumed.** All four Timers already open `local s=self`, so `X(s,20)`
(7) goes after that line rather than `X(self,20)` (10) in front of it. The plan asked for both to be
measured on SONAR; 7 < 10 and the same holds for the other three.

## The boundary finger, counted, before and after

**The gesture is the probe's Q2 trace**: a DOWN at raw (71, 80) — column 4, row 5, **cell 49**,
derived from the entries' own `t*9//128` division — then six MOVEs at x = 72, 71, 72, 71, 73, 72
with y held at 80. Then a real crossing to x = 76 and back to x = 66.

**The naive column for that trace is 4, 5, 4, 5, 4, 5, 5 — five crossings out of six samples**, and
the test asserts that before it opens a single entry, so the gesture is a real boundary wobble and
not a still finger.

### After (the shipped test, `lua-smoke.spec.ts`, printed by a green run)

```
euclid:       rest [255, 0] -> wobble 1/0 -> across 0/1 -> back 1/0; cell 49 after the wobble 0
steps:        rest [0, 0]   -> wobble 1/0 -> across 0/1 -> back 1/0; cell 49 after the wobble 255
radar-points: rest [0, 0]   -> wobble 1/0 -> across 0/1 -> back 1/0; cell 49 after the wobble 255
sonar:        rest [0, 0]   -> wobble 1/0 -> across 0/1 -> back 1/0; cell 49 after the wobble 255
sonar sweep:  H 1 after the press, 1 after 9 Timer calls, 0 after 30 (T 0)
```

**One arm on cell 49 and nothing on cell 50, on all four.** Crossing for real moves the arm once
each way, so the hysteresis is a held cell and not a dead zone.

### Before — the two negative checks, from `git show HEAD~1:` into the scratchpad

Rendered from the pre-plan templates over the CURRENT knob defaults, with the library still landed,
so the only thing that differs is the entry's own callback.

| Trace                                | Entry  | Cell 49 toggles | Cell 50 toggles | Cell 49 final state       |
| ------------------------------------ | ------ | --------------- | --------------- | ------------------------- |
| the probe's six MOVEs                | EUCLID | **3**           | **3**           | 255 → 0 (changed)         |
| the probe's six MOVEs                | SONAR  | **3**           | **3**           | 0 → **255** (armed)       |
| seven MOVEs (one more wobble sample) | EUCLID | **4**           | **3**           | 255 → **255, BACK AT REST** |
| seven MOVEs (one more wobble sample) | SONAR  | **4**           | **3**           | 0 → **0, BACK AT REST**   |

**Both counts are inside the plan's predicted 3..6, and the plan's warning was right about the
shape.** On the probe's own six-MOVE trace SONAR's crossing count is ODD, so the cell ends armed and
the failure hides. **One more wobble sample makes it EVEN and the cell ends OFF** — armed and
disarmed under a finger that never moved, with four toggles and a neighbour that also flickered
three times. That is Phase 11 wave 8's shape exactly: the naive fix looks like the bug. It is why
the shipped test asserts the NET STATE (`afterWobble !== restHeld`) beside the count, and why SONAR's
is additionally asserted literally as `[0, 255]`.

The same two longer traces run against the POST-plan entries — seven samples and twelve — read
**1 toggle** on cell 49 and 0 on cell 50 in every case.

### SONAR's final-state assertion, in the test's own words

`expect(finalState.get("sonar")).toEqual([0, 255])` — SONAR's Setup writes `glp(c,1,0)` for all 81
cells, so rest is phase 0 and armed is 255. RADAR POINTS and STEPS are asserted the same way on the
line below (STEPS' cell 44 is not one of its default-armed ones); EUCLID's cell 49 is a lit pulse
marker at rest, so only the net-toggle assertion applies to it.

## The sweep proof, and which entry carried it

**SONAR**, and the reason is arithmetic: its 70 ms default `@PERIOD` is the shortest of the four
against RADAR POINTS' 140, STEPS' 120 and EUCLID's 110, so 21 Timer calls are **147 ticks** here and
up to 294 elsewhere — the same proof at half the run.

A DOWN and one MOVE with **no UP** is Q6.5 exactly. The observable is the LIBRARY's `H`, read through
`LuaHost.globalSize("H")`, because a stale cell held for a session is invisible in the picture until
the next press is measured against it. `H` is **1** after the press, still **1** after 63 ticks
(nine Timer calls, inside the twenty-call window), and **0** after 160 more (thirty calls), with `T`
empty beside it. Without the middle reading the assertion would pass on a sweep with no window at
all.

## The three negative checks, with exit codes

| # | Mutation | Result | What it printed |
| --- | --- | --- | --- |
| 1 | EUCLID's `self.q={}` and its inlined guard restored **AFTER** the `Q` call (2 replacements) | `host-surface` + `touch-guard` **GREEN exit 0**; the new boundary test **GREEN**; `lua-smoke` **RED exit 1** | `euclid: A SECOND CONTACT ON THE SAME CELL MUST NOT BE SWALLOWED ... Observed 0 -> 255 -> 255` |
| 1b | the same duplicate placed **BEFORE** the `Q` call (2 replacements) | **RED exit 1**, two tests | the swipe test AND the new boundary test |
| 2 | the library's `W` window `<11` → `<8` (2 replacements) | **RED exit 1** | `euclid: A FINGER RESTING ON THE LINE ... Observed 1 change(s) on cell 49 and 1 on cell 50` |
| 3 | `X(s,20)` removed from SONAR's Timer (1 replacement) | **RED exit 1** | `A CONTACT WHOSE LIFT WAS LOST IS RELEASED BY THE TIMER SWEEP AND BY NOTHING ELSE ... Observed H 1 -> 1 -> 1` |

**Check 1 is the plan's own, and the plan is wrong about it in both placements.** The plan predicts
"a duplicate guard is invisible to every gate, so it is caught by reading". It is not: 11-08's swipe
test at `lua-smoke.spec.ts:1694` goes red for the placement the plan describes, because the
duplicate's `s.q[i]=nil` clear sits behind `if not m then return end` and therefore never runs on an
end code — the second press on the same cell is swallowed. Placed before the call it is caught by
that test AND by the new one. **The gate is stronger than the plan believed**; the headers still name
what was removed, and now for a better reason than "nothing would catch it".

Every mutation was applied with an asserted replacement count and restored by inverse edit.
`euclid.ts` sha256 `2b6c501c…` identical either side of checks 1 and 1b, `library.ts`
`1d270c01…` either side of check 2, `sonar.ts` `2253c0af…` either side of check 3. No `git checkout`,
`restore`, `stash` or `clean` was run at any point.

## QUADRANT: the finding, and the arithmetic that surprised the plan

Written in full into `deferred-items.md` section 3. In short:

- **It is a different failure.** QUADRANT computes `x*9//128` too, but it acts on ONSETS ONLY —
  `if e~=4 and e<9 then return end` — so a MOVE returns before any cell is computed and Q2's
  boundary wobble cannot reach it. The hysteresis half of the library buys it nothing.
- **Its exposure is Q6.5**: it holds one note per contact in `s.k[i]` and releases it only on codes
  3 and 5..8. A lost lift hangs a note with nothing in the entry to reach it.
- **Closing it needs `R` AND a Timer, and it has no Timer at all.**

**Measured at the RGB444 picker corner, not taken from the audition row** (`@HUE` at the picker's
eleven-character-per-triple corner, `@FILL=0`, `@NOTE=36`, `@CH=15`):

| Shape | Setup | Free |
| --- | --- | --- |
| as it ships | **838** | 70 |
| `R` added, existing end branch left alone | 924 | over |
| that, plus `gtt(0,100)` | 935 | over |
| `R` added AND the end branch rewritten to `if e==3 or e>4 and e<9 then R(s,i)return end` | 863 | 45 |
| that, plus `gtt(0,100)` | **874** | **34** |

A new Timer would be `--[[@cb]]gtt(0,100)X(self,20)` — 29 characters against its own 908.

**So it FITS, which the plan expected it not to, and it was still deferred.** The plan licenses a
re-fit "if the executor measures it and finds it fits cleanly"; it does not fit cleanly, it fits
tightly and only after a shape change. Three costs this plan is not licensed to spend: it needs a
release-path refactor on the one entry that handles code 9 explicitly (a behaviour change on the
card whose claim is that you can hit it without looking); the window is not measurable from here
because QUADRANT has no period and 100 ms is an illustration, not a decision; and a hung note
released by a sweep is an assertion with no existing home, so it cannot be folded in the way SONAR
was and the declared `+1` has no room for it. `docs/HARDWARE-AUDITION.md` row 19 now asks the desk
whether the note really hangs, before a Timer is added to a card documented as deliberately having
none. **Owner: 12-12.**

## The audition rows touched

- **Four cost rows re-measured at the defaults** — `euclid` 786/226 → 696/233, `sonar` 558/279 →
  468/286, `steps` 473/251 → 388/258, `radar-points` 579/279 → 489/286 — with a paragraph beside the
  11-16 re-measurement recording that this is **the first time the table has recorded an entry
  getting cheaper**.
- **Row 3 (EUCLID / SONAR)** gains the boundary finger: rest one finger on the line for five
  seconds, one cell arms and holds, no flicker, no second cell — and **on SONAR read the FINAL
  state**, because it toggles and an even number of crossings leaves the cell off.
- **Row 12 (STEPS)** gains the same, with the bench line it answers.
- **Row 22 (RADAR POINTS)** gains it as part (d), with the same final-state reading.
- **Row 19 (QUADRANT)** gains the hung-note observation: press four quadrants, lift together, report
  whether anything is still sounding; then a flat palm.

**The table is still twenty-two rows**, because all four are amendments to existing rows rather than
new ones. Prettier re-aligned the whole table when the cells grew, which is most of that file's
diff.

## Deviations

**1. [Rule 3 — Blocking] `touch-guard.spec.ts` had to move, and the plan's file list does not name
it.** Its test 1 carries a non-vacuity check — *every entry that installs a touch callback must have
yielded at least one event-code chain* — and after the re-fit all four bodies carry no event-code
comparison at all, so it went red on `euclid.setup` with `expected 0 to be greater than 0`. The arm
now asks the same non-vacuity question of a different observable: **a body with no chain is REQUIRED
to contain `Q(s,i,e,x,y)`**, which is a requirement rather than an exemption, and the library's own
chains are gated where the library lives (`library.spec.ts` asserts zero "contact ended" sites and
exactly one onset in the string). It is bounded from both ends — at least one entry delegates, at
least one still writes its own — rather than against a literal count, so waves 8 to 11 add callers
without moving a number in it. **Folded into test 1; the file stays at 3 tests.**

**2. [Rule 1 — Plan figure corrected] The plan's boundary cell is 49, not 58.** Its interfaces block
says "a DOWN at x=71, y=80 (cell 4 + 6\*9 = 58)", but `80*9//128 = 5`, so the cell is `4 + 5*9 = 49`.
The same paragraph's own STEPS index contradicts it: "on STEPS that is c=4, **r=5** → n=44", and
`4 + 5*8 = 44` is right. The test derives both cells from `t*9//128` and asserts them, so the
arithmetic is in the tree rather than in a paragraph.

**3. [Rule 1 — Plan figure corrected] The guard is 126 characters and the replacement 45**, counted
with the trailing space that separates them from the statement after; the plan says 125 and 44,
counted without. The delta the plan states — 90 — is right either way, and it is what three of the
four entries measure.

**4. [Rule 3 — Blocking] The task-01 negative check was run after task 02**, because the plan's own
wording for it names "the smoke test of task 02" as one of the two things to observe. Both
placements were run and both are recorded above.

**5. [Rule 2 — Missing critical check] Two further negative checks were run that the plan does not
ask for**: the library's hysteresis window narrowed, and `X` removed from SONAR's Timer. The new
test asserts two independent claims and the plan supplies a check for neither; a test whose teeth
are unmeasured is the phase's own standing warning.

## What the plan asserts that the tree does not support

1. **"a duplicate guard is invisible to every gate"** — false in both placements. 11-08's swipe test
   catches it either way and the new boundary test catches the earlier placement. See check 1 above.
2. **"cell 4 + 6\*9 = 58"** — the cell is 49. See deviation 2.
3. **"125 characters" / "44 characters"** — 126 and 45 with their separating spaces. See deviation 3.
4. **"SONAR ... toggles a cell, so a finger on a boundary arms and disarms the same cell rather than
   merely re-arming it — a strictly worse reading of Q2 than the three that were reported."** The
   distinction does not exist: **all four toggle.** EUCLID writes `s.p[d][t]=not s.p[d][t]`, STEPS
   `s.p[n]=not s.p[n]`, and RADAR POINTS and SONAR both `s.v[n]=not s.v[n]` — RADAR POINTS' callback
   is SONAR's verbatim, which the plan itself says elsewhere. SONAR is not worse than the other
   three; it is the same, and the reason to re-fit it is that it carried the same guard, which is the
   plan's other and correct argument. The shipped test therefore asserts the net state on **all
   four**, not only on SONAR.
5. **"QUADRANT ... re-fit it only if the executor measures it and finds it fits cleanly"** — it fits,
   at 874 of 908, once `R` replaces the inline release branch. The plan's framing assumes it will
   not. Deferred anyway, with reasons; see the QUADRANT section.
6. **"`touch-guard.spec.ts` ... green with no new row"** — green, and with no new row, but only after
   the file was edited. The plan's `files_modified` does not name it. See deviation 1.
7. **"`docs/HARDWARE-AUDITION.md:146` records 558 Setup / 279 Timer"** — the row is correct as a
   DEFAULTS row and the plan's own instruction to re-measure at the picker corner was followed: 559 /
   282 before, 469 / 289 after. Not a defect; recorded because the plan flagged the row as possibly
   stale and it was not.

## Notes for the next plan

- **`Q`'s call shape is 45 characters with its separating space**, `X(s,20)` is 7 after a
  `local s=self`, 10 as `X(self,20)` in front of one.
- **`touch-guard.spec.ts` now has a delegation arm.** An entry that calls `Q` and keeps its own event
  test — MORPH in 12-09 is expected to — still lands in the chain arm and is gated exactly as before.
- **CONSOLE has 56 free at the picker corner** (12-05) and 12-09 must fit a `Q` call into it. A
  CONSOLE that also drops an inlined guard gets it back; one that does not, does not.
- **Five callers of `X` after 12-09**, four of them written here, and every one carries `20`. The
  bench row in 12-12 moves five numbers, not one.

**No device was touched, nothing was deployed, and nothing in this plan is hardware-verified.** Every
count above was measured in wasmoon or under the pinned minifier; the desk is the only instrument
that sees touch correctly and 12-12 hands it the rows.

## Self-Check: PASSED

All eight modified files and the SUMMARY present on disk; both commits (`804d4b4`, `2dc7bc2`)
resolve in `git log --all`. `Q(s,i,e,x,y)` present in all four entries' Lua and `X(s,20)` in all
four Timers; `self.q` survives only in the four headers, where it names what was removed.
