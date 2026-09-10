---
phase: 12-touch-framework
plan: 09
subsystem: catalog
tags:
  [
    touch-library,
    hysteresis,
    expiry,
    release-convention,
    morph-geometry,
    budget,
    negative-check,
    counts,
    finding,
  ]
requires:
  - phase: 12-touch-framework
    plan: 08
    provides: "PREV_FILES 85 / PREV_TESTS 885 / e2e 87 titles, 106 runs / BASE_CHECK 581 / sweep 4 19 / catalog 26 (9 + 17); Q's call shape at 45 with its space and X(s,20) at 7 after a local s=self; touch-guard's delegation arm bounded from both ends; the boundary cell is 49"
  - phase: 12-touch-framework
    plan: 07
    provides: "TOUCH_LIBRARY at 769 of 908; Q returns only on change and expires contact i on EVERY onset, so R must be IDEMPOTENT; X(s,n) counts the CALLER's Timer calls; host-surface's LIBRARY_GLOBALS / LIBRARY_CONVENTIONS admission"
provides:
  - "CHORUS IS THE LIBRARY'S ONE `R` CALLER AND IT SOUNDS ONE CHORD: s.z the sounding pad, s.c the contact that owns it, R(s,i) returning unless s.c==i. A second finger on another pad releases the first chord and starts the second IN THAT ORDER; a non-owner's lift is silent; a chord whose finger goes quiet is released by X(self,20)"
  - "THE PRIVATE WATCHDOG REPLACED AND MEASURED: CHORUS's Timer 174 -> 29 at the picker corner (Setup 771 -> 796), the pair 945 -> 825. The window is unchanged - twenty of CHORUS's own calls at gtt(0,100) - and the release lands on tick 210, Timer call 21, 2.1 s"
  - "CONSOLE TAKES ITS CELL FROM Q AND IT FITS WITH ROOM: 852 -> 781 at the picker corner, 127 free, against 847 for the shape that keeps self.q. The tightest card in the catalog is no longer the tightest"
  - "MORPH'S THREE EDITS, EACH MEASURED ALONE: 3x3 corner blocks at +0 (710 -> 710), a dead margin at +56 (710 -> 766), Q for the trail cell at +6 (766 -> 772)"
  - "THE RESEARCH'S MORPH CALL SHAPE PROVED WRONG WITH A NUMBER: `if not c then return end` after Q sends 4 messages on a four-sample in-cell wobble against 16, and costs 25 characters MORE at 797"
  - "A FINDING host-surface.spec.ts's shadow scan would have refused the first correct caller of the R convention. It now scans LIBRARY_GLOBALS, asserts the convention is assigned a FUNCTION, and requires at least one entry to define it"
  - "A FINDING MORPH_MACROS was typed to the 2x2 geometry, so the residue probe reported fifteen legitimate macro readouts as frozen residue. Derived from the entry now, both the bases and the block's side"
  - "A FINDING the plan's CONSOLE negative check is wrong as written: restoring the pre-plan shape leaves the mute-row swipe GREEN. What it reddens is the new seam assertion; what reddens the swipe is removing the dedup entirely. Both were run"
affects:
  - "12-10 (GLIDE calls Q and D; the residue allowance and the corner-tap helpers are now derived, so a geometry change moves them)"
  - "12-11 (LUMEN calls Q and A)"
  - "12-12 (the bench row that decides the sweep window - FIVE callers of X, and CHORUS is the only one holding a note; audition rows 7, 8 and 13 rewritten; the tenth stale cost row named)"
tech-stack:
  added: []
  patterns:
    - "An entry that HOLDS state across contacts defines the library's `R` convention and calls it from its own callback, so the release is written once and reached from four paths"
    - "A test that reads a geometry constant out of the entry's own Lua rather than typing it, so a widened block moves the probe with it - applied to the corner-tap aim, the residue allowance and the margin"
    - "A captured literal that a deliberate change invalidates is RE-CAPTURED with the reason, and the clause it existed for is asserted separately so the pin's teeth survive the re-capture"
key-files:
  created: []
  modified:
    - src/lib/catalog/entries/chorus.ts
    - src/lib/catalog/entries/console.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/catalog/host-surface.spec.ts
    - src/lib/sim/lua-smoke.spec.ts
    - docs/HARDWARE-AUDITION.md
key-decisions:
  - "CHORUS's callback releases through R(s,s.c) rather than an inline note-off loop: 23 characters against 57, and the release is then written in ONE place that all four expiry paths reach"
  - "CONSOLE ships WITHOUT self.q. Both shapes pass the mute-row swipe and the resting-finger probes, so the 66 characters buy nothing"
  - "MORPH does NOT return on Q's nil, and the research is corrected on the record rather than followed"
  - "MORPH's dead margin runs on the RAW x and y AFTER Q, so the trail cell is where the finger is and not where the mapping says"
  - "The corner-tap probe aims at the block's INNER cell, which is both where all four weights are non-zero and where a hand reaching from the middle of the pad lands"
patterns-established:
  - "A library CONVENTION is scanned differently from a library DEFINITION: assigning the first is the mechanism working, assigning the second is a card overwriting library state"
requirements-completed: [CONT-02, PREV-01, TUNE-05]
duration: 75min
completed: 2026-09-11
---

# Phase 12 Plan 09: Three Bench Notes onto the Library Summary

**CHORUS holds one chord and its two-second watchdog is now seven characters of
Timer; CONSOLE stopped being the tightest card in the catalog by taking its cell
from `Q`; and MORPH's corners are nine cells wide with a dead margin around
them — with the research's call shape shipped, measured at four messages against
sixteen, and reverted.**

## Performance

- **Duration:** 75 min
- **Started:** 2026-09-11T01:10Z
- **Completed:** 2026-09-11T02:25Z
- **Tasks:** 2 of 2
- **Files modified:** 6 (0 created, 6 edited)

## Commits

| Hash      | Message                                                                            |
| --------- | ---------------------------------------------------------------------------------- |
| `68ba174` | `refactor(12-09): CHORUS sounds one chord through Q, R and X; CONSOLE takes its cell from Q` |
| `8c9d726` | `feat(12-09): MORPH's corners widened, a dead margin, and the trail cell from Q`    |

## Counts, as carried names plus deltas

| Name         | Carried (12-08)      | Delta                     | Observed                           |
| ------------ | -------------------- | ------------------------- | ---------------------------------- |
| `PREV_FILES` | 85                   | **+0**                    | **85**                             |
| `PREV_TESTS` | 885                  | **+2**                    | **887**                            |
| sweep        | `4 19`               | +0 / +0                   | `4 19`                             |
| `BASE_CHECK` | 581                  | +0                        | **581 files, 0 ERRORS 0 WARNINGS** |
| catalog      | 26 (9 + 17)          | +0                        | 26                                 |
| e2e          | 87 titles / 106 runs | **+0, proved not run**    | 87 titles                          |

**The declared term was `+0 / +2` and both halves match**, checked by
`scripts/check-counts.mjs 85 887` on `npm run test:quick` and by
`scripts/check-counts.mjs 4 19` on `npm run test:sweep`. The two are
`lua-smoke.spec.ts` **+2**: the CHORUS chord probe and the MORPH geometry probe.
Nothing else added a test — `host-surface.spec.ts` stays at **6**,
`touch-guard.spec.ts` at **3** and `decay-idiom.spec.ts` untouched — because the
CONSOLE seam assertion went **inside** the existing travel test and the corner
geometry went inside the existing corner-tap test, both as the plan asks.

**The e2e zero is proved rather than declared.** `git diff --stat HEAD~2 -- e2e/`
is empty, so no file under `e2e/` changed in either commit. `grep -c "test("` over
`e2e/*.ts` reads **88**, and one of those is a comment in `e2e/poll.ts:47` saying
that module carries no `test( )` title — so the real count is **87**, matching the
carried baseline exactly. The suite was not run; `12-VALIDATION.md`'s sampling
table does not ask this plan to run it.

`npm run lint` clean on every file this plan touched (`prettier --check` and
`eslint`, both exit 0); `prettier --write` was run on `lua-smoke.spec.ts` and
`HARDWARE-AUDITION.md` and on nothing else. `src/vendor/` unmoved
(`git diff --stat HEAD -- src/vendor/` empty), `firmware-oracle.spec.ts`
unedited, `.planning/ROADMAP.md` untouched, **CAT-04 still `[ ]`**.

## The six costs at the RGB444 picker corner, before and after

Every figure is `max(text.length, compressScript(text).length)` after
`padReady()`, at the corner `lua-entries.sweep.spec.ts` gates: every knob at its
longest declared value with each colour knob overridden to `255,255,255`. Each
one was measured against the shipped entry file, and the harness reproduced all
three carried "before" figures exactly (771 / 174, 852, 710) before anything was
edited.

| Entry             | Event | Before  | After   | Δ        | Free after |
| ----------------- | ----- | ------- | ------- | -------- | ---------- |
| **CHORUS**        | Setup | 771     | **796** | **+25**  | **112**    |
| **CHORUS**        | Timer | 174     | **29**  | **−145** | **879**    |
| **CHORUS**        | pair  | 945     | **825** | **−120** | —          |
| **CONSOLE**       | Setup | 852     | **781** | **−71**  | **127**    |
| **CONSOLE**, `s.q` kept | Setup | 852 | _847_   | _−5_     | _61_       |
| **MORPH**         | Setup | 710     | **772** | **+62**  | **136**    |

At the defaults, which is what `docs/HARDWARE-AUDITION.md` records:
CHORUS 768 / 173 → **793 / 29**, CONSOLE 829 → **758**, MORPH 706 → **768**. All
five strings are fixed points of `compressScript` and pass `checkSyntax` at the
defaults and across the whole sweep (1,103 combinations, 2,206 measurements).

### MORPH, at each of its three edits

The plan asks for the three separately and the projections hold to the character:

| Step                                    | Setup   | Δ       | The plan projected |
| --------------------------------------- | ------- | ------- | ------------------ |
| as it shipped                           | 710     | —       | 710                |
| 3x3 corners (`{0,6,54,60}`, `d%3+d//3*9`) | **710** | **+0**  | **+0**             |
| the dead margin                         | **766** | **+56** | **+56**            |
| `Q` for the trail cell                  | **772** | **+6**  | "measure"          |

766 is also `12-RESEARCH`'s "after the plain fixes" figure, reproduced. The +0 is
arithmetic rather than luck: `0,7,63,70` and `0,6,54,60` are both nine
characters, `for d=0,3` and `for d=0,8` are both nine, and `d%2+d//2*9` and
`d%3+d//3*9` are both ten — at all three geometry sites.

### CONSOLE both ways, and the research figure corrected

**781 without `self.q`, 847 with it kept beside the call.** Both pass the
mute-row swipe and the resting-finger probes, so the smaller shipped. The
research costed the kept shape at **845**; the shipped `Q` takes `s`, and the
measured figure is **two more** — the same five-argument correction
`12-VALIDATION` R-5 predicts and 12-08 measured on all four sequencers.

The −71 breaks down as: the live test out (−40 with its separating space), the
`Q` call in (+45), `x*9//128` / `y*9//128` traded for `n%9` / `n//9` (−9), the
mute row's `if e==4 or e>8 or s.q[i]~=c then s.q[i]=c` and its `end` out (−45),
`s.q[i]=nil` out (−11), `self.q={}` out (−9).

## `X`'s window, in milliseconds, per entry

`X(s,n)` counts the CALLER's Timer calls (12-07's contract), so twenty is a
different wall time in every caller. This plan adds **one** caller and leaves the
other four alone.

| Entry       | Timer         | 20 calls  | When the release actually lands           |
| ----------- | ------------- | --------- | ----------------------------------------- |
| **CHORUS**  | `gtt(0,100)`  | **2.0 s** | **tick 210 — Timer call 21 — 2.1 s**      |
| **CONSOLE** | none          | —         | no Timer, so no `X`, and nothing is held  |
| **MORPH**   | none          | —         | no Timer, so no `X`, and nothing is held  |

**2.0 s is the window and 2.1 s is the release**, because `X` expires a stamp
`C-t>n` — strictly older than n calls, not n-or-older. Measured tick by tick
rather than observed to have happened somewhere in a long run: the DOWN is on
tick 1 with the stamp reading `C = 0`, nineteen Timer calls later nothing has
left, and the note-offs arrive on tick 210. **The figure itself is unchanged** —
CHORUS's private watchdog counted twenty 100 ms ticks too — and 12-12's bench row
is what moves it.

CONSOLE's and MORPH's headers both say plainly why they take no `X`: a contact
whose lift is lost keeps its entry in the library's `H` until the next press by
that id, which `Q` expires first, and **neither card holds a note** — a stale
cell costs a mute toggle that never happened, not a hung voice. That is the
distinction between them and CHORUS, and it is written where a reader of either
file will meet it.

## CHORUS's exclusive chord, with the note counts

Printed by a green run, four stages plus the held finger:

```
finger 0 on pad 4:                                144:55 144:59 144:62          sounding 55,59,62
finger 1 on pad 5, finger 0 still down:  128:55 128:59 128:62 144:57 144:60 144:64   sounding 57,60,64
finger 0 lifts (not the owner):                   (nothing)                     sounding 57,60,64
finger 1 goes quiet:  released on tick 210 = Timer call 21 at 100 ms = 2.1 s  128:55 128:59 128:62
finger held on pad 4, 40 Timer calls of wobble:   (nothing)                     sounding 55,59,62
```

| Step | note-ons | note-offs | sounding after | peak |
| --- | --- | --- | --- | --- |
| finger 0 presses pad 4 | **3** | **0** | 3 | 3 |
| finger 1 presses pad 5, finger 0 still down | **3** | **3, FIRST** | 3 | 3 |
| finger 0 lifts | 0 | **0** | 3 | 3 |
| finger 1 goes quiet, 21 Timer calls | 0 | **3** | **0** | 3 |
| a finger that keeps reporting, 40 Timer calls | 0 | **0** | 3 | 3 |

**The peak is counted after every single MESSAGE, not after every step**, because
the claim is about an overlap that would exist for three messages in the middle
of one sample if the release came after the note-ons rather than before them. It
never exceeds **3**. Per contact — which is what this card did until this plan —
step 2 leaves **six** notes sounding.

**Three separate proofs of `R`'s idempotence are in there and each is a different
half.** The first press sends three note-ons AND NOTHING ELSE, even though `Q`
expires contact 0 before it computes the cell and therefore calls `R(s,0)` on it
— an `R` that sent an unconditional note-off would put three note-offs in front
of a chord that never sounded. The non-owner's lift sends nothing, because `s.c`
is 1 and the contact expiring is 0. And the pitches are derived from the entry's
own scale table and key knob rather than pasted: pad 4 is 55/59/62 (G major at
the default key of 48), pad 5 is 57/60/64 (A minor).

## MORPH's frozen-weight count, and the research corrected

**The negative check the plan asks for, shipped verbatim.** One replacement,
asserted: `local c=Q(s,i,e,x,y)` → `local c=Q(s,i,e,x,y)if not c then return end`.

```
morph: THE WEIGHTS MUST MOVE INSIDE A CELL ... Observed 4, 0, 0, 0 message(s) per sample
```

**Four messages against sixteen** — four on the DOWN, which is the one sample
where `Q` returns a cell, and **NOTHING** on the three MOVEs. That is a macro pad
that answers the first pixel of each cell and then goes silent for the fourteen
raw units after it. The shipped shape reads `4 + 4 + 4 + 4 = 16`, with the
weights walking `38/31/31/25 → 37/32/30/26 → 38/31/31/25 → 37/32/30/26`.

**And the wrong shape costs 25 characters MORE**: 797 at the picker corner
against the shipped 772. The guard is not free, so the research's line is worse
on both axes at once.

The probe's non-vacuity is asserted before anything is measured: all four samples
are the same cell under the naive read (so `Q` really does return nil three
times), and the mapped position really moves (so there is a weight to freeze).

## The corner-zone geometry, before and after

| | Before (11-09.1) | After (12-09) |
| --- | --- | --- |
| `self.k` | `{0,7,63,70}` | **`{0,6,54,60}`** |
| block walk | `d%2+d//2*9`, `d=0,3` | **`d%3+d//3*9`, `d=0,8`** |
| block size | 2x2 — **4 cells**, 16 of 81 | **3x3 — 9 cells, 36 of 81** |
| corner 1's cells | 0, 1, 9, 10 | **0, 1, 2, 9, 10, 11, 18, 19, 20** |
| axis mapping | raw 0..127 straight through | **raw 24..103 → 0..127, saturated outside** |
| a full 127 | only at the literal extreme pixel | **anywhere in raw 0..24 (1.7 cells)** |
| at (10, 10) | corner 1 reads **107** | corner 1 reads **127**, the other three **0** |
| at (14, 14) | 100 / 12 / 12 / 1 | inside the margin: **127 / 0 / 0 / 0** |
| where the test aims | the block's middle, (14,14) | the block's **inner** cell, (35,35) |
| weights at the aim | 100 / 12 / 12 / 1 | **95 / 14 / 14 / 2** |

The margin is stated in cells rather than in raw units where a reader will meet
it, because a cell is `128/9 = 14.22` raw units and 24 of them is **1.7 cells**:
the whole of cells 0 and 1 on each axis reads saturated, and so does part of cell
2. The test asserts that as `mapped(cellCentre(0))`, `mapped(cellCentre(1))` and
`mapped(cellCentre(7))` reading `0, 0, 127`.

**All four corner taps still send exactly one message each, slow and fast, from
rest and from elsewhere** — twelve probes, and the value each sends is that
corner's own bilinear weight at the aiming point (95, 94, 94, 93).

## `frames.json`: the zero, proved

`git diff --quiet -- src/lib/catalog/frames.json` exits **0** after both commits.

The zero is proved twice, and the second is the one the plan asks for.
`frames.spec.ts` (5 tests) is **green with `UPDATE_FRAMES` unset** — confirmed
unset in the same shell — and that spec re-renders every entry from its own Lua
and compares against the fixture, so a green run with the variable unset is a
positive proof that the rendered pictures are identical, not merely that nobody
regenerated the file.

**The plan's own guess was right and the reason is in the Lua.** MORPH's corner
blocks are painted `glc(...)` then `glp(a,1,0)` — coloured at phase 0 — so
widening them from four cells to nine changes which cells are coloured and
changes no pixel: `restsBlack` is `true` and the card is black at rest either
way. CHORUS's chessboard paint and CONSOLE's `P()` are untouched, and every other
change in this plan is inside a `touch_cb` that the fixture never triggers.
**Nothing was regenerated and no OG image was rebuilt.**

## The audition rows

Three cost rows and three checklist rows, and **the table is still twenty-two
rows** because all three are amendments.

- **Row 7 (CHORUS)** keeps the dead-still chord question and gains (b) the
  exclusive-pads sequence — hold one pad, press a second, then lift the FIRST
  finger — (c) a finger resting on the line between two pads for five seconds,
  and (d) "play it for two minutes and report whether ANY note is left sounding".
- **Row 8 (MORPH)** gains (b) the 3x3 blocks, tapped at the INNER cell; (c) the
  margin — a finger a cell and a half in must already read a full 127 and an
  exact 0 on the others, with "report where the value starts to move"; and (d) no
  flicker in the middle, the comet on ONE cell.
- **Row 13 (CONSOLE)** gains (b) the framework by name — a finger on the line
  between two columns must move ONE fader, and a swipe across all nine mute caps
  must toggle each once — and (c) the resting finger inside one cap.
- **The cost table**: `chorus` 768 / 173 → **793 / 29**, `morph` 706 → **768**,
  `console` 821 → **758**, with a paragraph beside 12-08's recording that the
  three move in three different directions and why.

**CONSOLE's row was stale by eight and this plan names it.** It read 821, which
is plan 11-07's figure; 12-05's interactive-but-silent muted fader took the entry
to 829 without moving the table. The before figure quoted above is the
re-measured one. That is the tenth stale row this table has produced in two
phases, and the reason is unchanged: `audition.spec.ts` gates the document's
SHAPE and asserts nothing about these numbers.

## The negative checks: four run, four red, every replacement count asserted

| # | Mutation | Replacements | Result | What it printed |
| --- | --- | --- | --- | --- |
| 1 | **`R` removed from CHORUS** — the definition deleted and the call site replaced by an inline note-off loop | 2 | **RED, exit 1** | `A CHORD WHOSE FINGER WENT QUIET MUST BE RELEASED BY THE TIMER ... expected [] to deeply equal [ '128:55', '128:59', '128:62' ]` — **the three notes are still sounding after 21 Timer calls**, and `host.midi.length` never moved past 3 in 400 ticks |
| 2 | **CONSOLE's pre-plan callback restored** — `self.q={}`, the live test, `s.q[i]~=c` and `s.q[i]=nil`, `Q` gone | 2 | **RED, exit 1** | `A FADER FINGER ON THE LINE BETWEEN TWO COLUMNS MUST DRIVE ONE FADER ... Observed columns 3, 4` |
| 3 | **CONSOLE's dedup removed entirely** — the cell computed naively, no `s.q`, no `Q` | 1 | **RED, exit 1** | the mute-row swipe reads `0:14 1:14 2:14 3:14 4:15 5:14 6:14 7:14 8:14` — **fourteen or fifteen toggles a column**, which is 11-07's own pre-guard measurement reproduced |
| 4 | **the research's `if not c then return end`** after MORPH's `Q` | 1 | **RED, exit 1** | `Observed 4, 0, 0, 0 message(s) per sample` — see above |

**Check 2 is the plan's own CONSOLE check and the plan is wrong about what it
reddens.** The plan says "restore CONSOLE's `s.q[i]=nil` line without `Q` —
expect the mute-row swipe count red". The mute-row swipe stays **GREEN** on that
shape, and it has to: that shape shipped for two plans and passed it. What the
pre-plan shape reddens is the NEW seam assertion, which is the thing this plan
added. Check 3 is the one that reddens the swipe, and it is the one that measures
what `Q`'s change signal is actually worth — so it was run as well rather than
substituted. Both are recorded.

Every mutation was applied with an asserted replacement count and restored by
inverse edit. `chorus.ts` sha256 `087bc59f…` identical either side of check 1,
`console.ts` `b2a6d1fd…` identical either side of checks 2 and 3, `morph.ts`
`ba8ad9a7…` identical either side of check 4. **No `git checkout`, `restore`,
`stash` or `clean` was run at any point**, and the scratch measurement and
mutation scripts were never committed.

## Deviations

**1. [Rule 3 — Blocking] `host-surface.spec.ts` had to move, and the plan's
`files_modified` does not name it.** Its shadow scan refuses an entry that
assigns a single-capital global in `LIBRARY_NAMES` — and `LIBRARY_NAMES` is
`LIBRARY_GLOBALS` **plus `LIBRARY_CONVENTIONS`**, which is `R`. So CHORUS's
`R=function(s,i)`, the first correct caller of the convention 12-07 shipped,
would have been the first failure of the gate meant to protect it. The scan now
reads `LIBRARY_GLOBALS`, and the teeth are kept by two arms rather than removed:
the convention must be assigned a **`function`** (so `R=4` in a card is still
caught) and **at least one entry must define it**, bounded from below only so
that 12-10 and 12-11 can add a second note-holding caller without moving a
number. Folded into the existing test; the file stays at **6 tests**. The plan's
verification line — "`host-surface.spec.ts` resolving `R=` if the scanner sees
it" — anticipates the collision without saying which way it resolves.

**2. [Rule 3 — Blocking] `MORPH_MACROS` in `lua-smoke.spec.ts` was typed to the
old geometry**, as `[0, 7, 63, 70]` and a 2x2 walk, so the residue probe went red
with **fifteen** legitimate macro readouts reported as frozen residue the moment
the blocks widened. It is now derived from the entry's own `self.k` and its own
paint loop — both the four bases and the block's side — exactly as the corner-tap
test derives them, so the next geometry change moves it with no second edit. The
allowance's reason also states the price plainly: it is per CELL and not per
layer, so the comet is excused wherever it lands inside a corner block, nine
cells a corner rather than four, and the forty-five cells still under the probe
are what watch it.

**3. [Rule 1 — A pin invalidated by a deliberate change] `DIAGONAL_BEFORE` was
re-captured and renamed `DIAGONAL_MORPH`.** It pinned the continuous morph to a
literal captured "BEFORE the change" — the entry as 11-08 left it — and the dead
margin **deliberately** moves that sequence, from 158 messages to 120: every
value in it is a bilinear weight of the remapped axis. A literal that survived
the margin would mean the margin had not landed. So it is re-captured against the
entry as this plan leaves it, **and the clause it existed for is now asserted
separately** — all four corners must speak across a stroke whose onset is the
centre cell, which is exactly what a corner branch reaching MOVE samples would
destroy. The pin's teeth do not depend on the literal's provenance any more.

**4. [Rule 2 — Missing critical check] A third negative check was run that the
plan does not ask for** (check 3 above), because the plan's own CONSOLE check
does not test the claim the plan makes for `Q` on that card. See the negative
check table.

**5. [Rule 1 — Plan figure sharpened] The release lands on Timer call 21, not 20.**
The plan and the library both say the window is twenty calls, and it is; `X`
expires on `C-t>n`, so the note-offs arrive on the twenty-first — tick 210, 2.1 s
of wall time against a 2.0 s window. The test asserts the tick and the call
number together and says why, rather than rounding either.

**6. The measurement and mutation harnesses were scratch files at the repository
root** (`.measure.mjs`, `.variant.mjs`, `.mutate.mjs`, `.commitmsg`), used with
`git commit --only` so they were never staged, and deleted before the plan
closed. `git status` at the close shows only the concurrent Phase 13 session's
three untracked files, which were not touched.

## What the plan asserts that the tree does not support

1. **"the research's 845 with `s.q` kept"** — measured **847**. Two more, and it
   is the same five-argument `Q` correction `12-VALIDATION` R-5 predicts and
   12-08 measured on all four sequencers. The research's figure is against a
   four-argument call.
2. **"restore CONSOLE's `s.q[i]=nil` line without `Q` — expect the mute-row swipe
   count red"** — the mute-row swipe is GREEN on that shape. See check 2.
3. **`lua-smoke.spec.ts`'s line numbers in the plan's `read_first` blocks are
   stale by two to three hundred lines.** The plan names `:1560` for the CONSOLE
   tests (they are at 1447 and 1502), `:2335-2540` for the MORPH suppression and
   corner-tap tests (2083 and 2252), `:2504` for the corner-tap test (2252) and
   `:2541` for the `self.k` read (2363). 12-07 recorded the same drift and the
   plan carries it forward; every number above is from the tree as found.
4. **The plan's CHORUS sketch inlines the release** (`if s.z then <release> end`).
   The shipped shape calls `R(s,s.c)` instead — 23 characters against 57, and it
   puts the release in ONE place that all four expiry paths reach. Not a
   contradiction of the plan's intent, but it is not the plan's text.
5. **`files_modified` omits `src/lib/catalog/host-surface.spec.ts`.** See
   deviation 1.
6. **The plan's `must_haves` say MORPH's trail cell holds "under a wobbling
   finger" and that the weights update "on every sample inside a cell".** Both
   hold, but they are two different probes and neither implies the other: the
   trail claim needs a wobble that CROSSES a cell line (x 71,72,71,72,73,72,
   where the naive read lights cells 40 and 41 and `Q` lights only 40), while the
   frozen-weight claim needs a wobble that stays INSIDE one (x 60,61,60,61). The
   test carries both and says which is which.

## Notes for the next plan

- **`Q`'s call shape is 45 characters with its separating space** and `X(self,20)`
  is 10 in front of a Timer that has no `local s=self` — CHORUS's does not, so it
  pays the 10 and the whole Timer is 29.
- **`R` is defined once, in CHORUS**, and `host-surface.spec.ts` now requires at
  least one definition without capping the number. A second note-holding caller
  moves no count in that file.
- **The corner-tap helpers and the residue allowance are DERIVED from MORPH's own
  Lua now.** A plan that moves `self.k`, the block's side or the margin's two
  constants moves both probes with it and does not need to touch either test.
- **CONSOLE has 127 free at the picker corner**, not 56. It is no longer the
  tightest card; **WHEELS at 882 and STRIP at 857 (defaults) are worth
  re-measuring at the picker corner before anything is asked of them.**
- **Five callers of `X` and one of them holds a note.** 12-12's bench row moves
  five numbers, and only CHORUS's can cut a sound.

**No device was touched, nothing was deployed, and nothing in this plan is
hardware-verified.** All three bench notes are the user's own and only the user's
bench can confirm the fixes; every number above was measured in wasmoon or under
the pinned minifier, and 12-12 hands the desk rows 7, 8 and 13.

## Self-Check: PASSED

All six modified files and this SUMMARY present on disk; both commits (`68ba174`,
`8c9d726`) resolve in `git log --all`. The frontmatter's three `contains` claims
are checked directly: `R=function` in `chorus.ts`, `self.k={0,6,54,60}` in
`morph.ts`, `Q(s,i,e,x,y)` in `console.ts`, and `X(self,20)` in CHORUS's Timer
for the `key_links` pattern `X\(s,`.

## STATE.md, and what the five tool runs did to it

`STATE.md` was copied to the scratchpad before the first command
(sha256 `b5b9e649…`, 826 lines) and again before each of the next four, and every
command was repaired by inverse edit against the copy taken immediately before
it. **No `git checkout`, `restore`, `stash` or `clean` was used.**

**All five commands corrupt the same three frontmatter lines, and it is one bug
in three places** — each run re-derives the frontmatter from the BODY of the file
and gets all three wrong:

| Line | What the tools write | Why it is wrong |
| --- | --- | --- |
| `status:` | the body's `Status:` prose, in full | the field is a state machine value; it must read `executing` |
| `stopped_at:` | a **`Previous status, retained (…)`** line | so it goes BACKWARDS — after `update-progress` it named 12-08 again |
| `completed_phases:` | `12` | phase 12 is **plan 8 of 12**; it is not complete |

`advance-plan` additionally **destroys the `Status:` body line** — it writes
`Status: Ready to execute` over it and does NOT retain the old text, which is why
`Previous status, retained (…)` in this file jumps from 12-05 straight back to
11-14: 12-06's, 12-07's and 12-08's were each destroyed in turn. **12-08's was
recovered from the copy and re-inserted** as
`Previous status, retained (12-08):`, so this plan puts one back rather than
losing a fourth. 12-06's and 12-07's are gone and cannot be recovered from here.

`advance-plan` also leaves the `Plan:` line's DESCRIPTION naming the previous
plan while bumping its counter, and `record-session` shortens the body's
`Stopped at:` to a bare filename where the file's convention carries the full
description. Both were rewritten by hand.

**`percent` was left at 100 as the standing rule says.** `update-progress`
reported `percent: 85` in its JSON and did not write it to the file, so nothing
had to be reverted there. **`roadmap update-plan-progress` was skipped**, and
`.planning/ROADMAP.md` is byte-identical.

**The diff below the splice, in full** — nine changed lines and five added ones,
826 lines to 831:

```
stopped_at:        12-08 -> 12-09 (the long description, requoted)
last_updated:      2026-09-10T23:05:39.126Z -> 2026-09-10T23:47:06.150Z
completed_plans:   135 -> 136
Plan:              7 of 12 complete - 12-08 (...)  ->  8 of 12 complete - 12-09 (...)
Status:            12-08's -> 12-09's
+ Previous status, retained (12-08): ...        (recovered)
+ | Phase 12 P09 | 75 | 2 tasks | 6 files |     (record-metric)
+ three "- [Phase 12]: 12-09: ..." decisions    (add-decision x3)
Last session:      2026-09-10T23:05:39.109Z -> 2026-09-10T23:47:06.134Z
Stopped at:        12-08's long form -> 12-09's long form
```

`completed_phases` reads **11**, `percent` reads **100**, `status` reads
**executing**.

`requirements mark-complete CONT-02 PREV-01 TUNE-05` reported all three
**already complete** and wrote nothing: `.planning/REQUIREMENTS.md` is
byte-identical.
