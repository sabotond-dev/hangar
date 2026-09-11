---
phase: 12-touch-framework
plan: 11
subsystem: catalog
tags:
  [
    lumen,
    depth,
    emitted-frame,
    touch-library,
    hysteresis,
    per-axis,
    wire-change,
    frames-fixture,
    negative-check,
    counts,
    finding,
  ]
requires:
  - phase: 12-touch-framework
    plan: 09
    provides: "PREV_FILES 85 / PREV_TESTS 887 / e2e 87 titles, 106 runs / BASE_CHECK 581 / sweep 4 19 / catalog 26 (9 + 17), measured on a clean tree at 542d77a"
  - phase: 12-touch-framework
    plan: 07
    provides: "TOUCH_LIBRARY at 769 of 908. `Q(s,i,e,x,y)` returns the cell only on change and expires contact i on every onset; `A(s,i,e,x,y,c,d,h)` is per-axis send-on-change with `127-y` and a silent DOWN, and SHIPPED - neither A nor D was dropped under the fallback order"
  - phase: 12-touch-framework
    plan: 01
    provides: "THE VERDICT, quoted in this plan's entry header: the knob reaches the module's RAM, the wiring is sound and nothing was fixed there"
  - phase: 11-bench-corrections
    plan: 09.2
    provides: "The two costed deepening routes, the row-0 immovability as arithmetic, and the measurement that {1,2,3,4} is the only four-element set the knob can carry"
provides:
  - "LUMEN'S RAMP REACHES EXACT BLACK: d = 32 - row*@DEPTH with anchor*d//32, four literals moved, CHARACTER-NEUTRAL at 746 before and 746 after at the RGB444 picker corner. The bottom row emits 189,66,0 / 126,44,0 / 62,21,0 / 0,0,0 at the four declared depths and the frame's non-zero bytes fall 171 to 152 at @DEPTH 4"
  - "THE CARD NAMES ITS ANCHOR ROW where a visitor reads it: listing.ts's quiet line, rendered by FidelityLine.svelte on every still card's page"
  - "LUMEN'S CURSOR COMES FROM `Q`: five sysex messages over a six-sample 71/72 wobble before, ZERO after the press. -20 at the picker corner"
  - "THE LIBRARY'S `A` HAS ITS CALL SITE: both `s:gms` calls replaced, a DOWN primes silently, each axis sends only when it moved, and @CC+1 carries 127-y. Twelve CCs over the same wobble before, SIX after. -19 at the picker corner"
  - "746 -> 707 at the picker corner and 742 -> 704 at the defaults, 201 free of 908; the two library deltas measured alone (726 with Q only, 727 with A only) and they add exactly"
  - "frames.json regenerated for LUMEN alone - five hashes, nonZeroBytes unchanged at 171 - and the gitignored OG image rebuilt, sha256 994ea1a5 -> c4d7c748"
  - "A FINDING the tap-parity probe was blind to sysex, and LUMEN's move to `A` exposed it: the probe now records gmss beside midi and gks"
  - "A FINDING 72 of 81 cells move at the default, not the eighty 11-09.2 predicted - the nine that do not are row 0, which is the deliverable"
  - "A FINDING static/og/ holds 26 files and is GITIGNORED, so the plan's `static/og/lumen.png` is regenerated and never committed"
affects:
  - "12-12 (the bench row that settles the depth on hardware is row 15; TESTING.md's fourth stale cost row is deferred-items.md item 4)"
  - "12-06, 12-10 (this plan ran AHEAD of both - see the ordering note below)"
tech-stack:
  added: []
  patterns:
    - "A knob re-cut is shipped only when the SUBTRAHEND and the DIVISOR move together and the character cost is measured on both sides of the edit, so a picture change is never also a budget change"
    - "A library call that must fire on every sample sits OUTSIDE the gate that only fires on a change, and the test asserts the in-cell case rather than the changed case"
    - "A probe that reads a card's output reads EVERY output channel the host records; a channel it cannot see is a card it cannot audit"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-11-SUMMARY.md
  modified:
    - src/lib/catalog/entries/lumen.ts
    - src/lib/catalog/listing.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/catalog/frames.json
    - docs/HARDWARE-AUDITION.md
    - e2e/install.e2e.ts
    - src/lib/tune/model.spec.ts
    - .planning/phases/12-touch-framework/deferred-items.md
key-decisions:
  - "THE 32/32 ROUTE SHIPPED AND THE MOVED DEFAULT DID NOT. Index 3 at 32/32 turns a row of the card off AT REST, and that is the visitor's choice to make with the knob rather than the card's to make for them"
  - "THE END TEST SITS AFTER THE `Q` CALL, so a genuine lift releases the contact in the library's tables. Both orderings cost 707; the end test is KEPT rather than deleted because `A` fires on e<4 and a code this card does not handle would otherwise reach the controllers"
  - "`A` SHIPPED FROM THE LIBRARY and was not inlined: 12-07's SUMMARY records the fallback order never firing, with 139 free"
  - "THE Y INVERSION IS TAKEN, and it is a WIRE CHANGE on @CC+1 rather than a refactor - the user's own bench snippet asks for it, and the header and the audition row both say so"
  - "THE TAP-PARITY PROBE WAS WIDENED RATHER THAN ITS TAP MOVED. Its non-vacuity clause says `Move PARITY_TAP, do not weaken this`, and neither was the answer: a static tap sends no controller anywhere on this card now, by design"
patterns-established:
  - "When a plan's predicted number disagrees with the measurement, the measurement is reported and the prediction is named (eighty cells against seventy-two; two literals against four)"
requirements-completed: [CONT-02, TUNE-01, TUNE-05, PREV-01, PREV-02, SHARE-01]
duration: 40min
completed: 2026-09-11
---

# Phase 12 Plan 11: LUMEN, with the Verdict Attached Summary

**The last "nothing changed" is answered with a picture that cannot be misread: at its deepest
setting LUMEN's bottom row is now EXACTLY BLACK — `0,0,0` in all nine columns, measured on emitted
bytes — while row 0 stays byte-identical at every index, and the card's own copy finally tells the
visitor which row is the anchor. The re-cut cost nothing (746 at the picker corner before and after),
and the same wave gave the cursor to the library's `Q` and the two axis controllers to its `A`, which
took the entry to 707 and gave the probe's rule 3 its first call site in the catalog.**

## Performance

- **Duration:** about 40 min
- **Started:** 2026-09-11T01:48Z
- **Completed:** 2026-09-11T02:28Z
- **Tasks:** 1 of 1
- **Files:** 0 created, 7 modified in the task commit (plus `deferred-items.md` and this document)

## Commits

| Hash      | Message                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- |
| `ff67efb` | `feat(12-11): LUMEN's ramp reaches exact black, its cursor comes from Q and its two axis CCs from A` |

---

## The ordering note: this plan ran AHEAD of an open checkpoint, and why that was safe

`12-11-PLAN.md` declares `depends_on: ["12-10"]`, 12-10 depends on `12-06`, and **12-06 is a blocking
checkpoint awaiting the user.** Neither has run. This plan was cleared by the user to run ahead, and
the reason the terms commute is arithmetic rather than optimism:

| Plan  | tests | files | catalog | e2e |
| ----- | ----- | ----- | ------- | --- |
| 12-06 | +0    | +0    | +0      | +0  |
| 12-10 | +1    | +0    | **+1**  | +0  |
| 12-11 | **+0**| **+0**| **+0**  | +0  |

**Every count in this document is a CARRIED NAME PLUS A DELTA and never an absolute total**, so when
12-06 and 12-10 land, their `+0` and `+1` apply to the observed figures here without reconciliation.
11-15 ran ahead of 11-14 on exactly this reasoning. **Nothing under JOYSTICK, TRACKPAD or GLIDE was
read or written**, and nothing under `.planning/phases/13-gui-overhaul/` was touched — a concurrent
session owns it.

**The plan's frontmatter carries `PREV_TESTS 888`, which is the figure AFTER 12-10's `+1`.** On this
tree the carried figure is **887** and the observed figure is **887**. That is the disagreement the
ordering produces, it is reported rather than reconciled, and `check-counts.mjs 85 887` is the check
that was run.

---

## The verdict this plan consumes, quoted

From `12-01-SUMMARY.md`, and it is now quoted in `lumen.ts`'s own header:

> **"THE VERDICT: A KNOB TURNED IN THE BROWSER REACHES THE MODULE. … the fake ZONA's RAM held a
> 742-character Setup carrying `d=36-n//9*3` after the first click and a 742-character Setup carrying
> `d=36-n//9*4` after the second, with neither carrying the other's literal. … The wiring is SOUND,
> nothing was fixed here"**

**So the branch this plan took is the one the plan's objective calls the honest deliverable.** The
knob reached the wire; Probe B read **four distinct brightness levels** on the user's own module with
27 *"clearly lit"*; the LEDs were never the suspect and the research's sRGB-gamma hypothesis is
retired. What was left was the picture the four values make, and the sentence nobody had written
down. **This plan is not a fix. It is a re-cut and a sentence, and the entry header says so.**

---

## The re-cut, in emitted bytes

`d = 32 - n//9*@DEPTH` with `H[i+1]*d//32` on each of the three channels. **FOUR literals moved**,
not the two `11-09.2` predicted: one subtrahend and **three** channel divisors. Counted in the
string, reported here, and the entry header now says four.

### The bottom row at all four indices, after the re-cut

| Column | @DEPTH 1 | @DEPTH 2 | @DEPTH 3 (default) | @DEPTH 4  |
| ------ | -------- | -------- | ------------------ | --------- |
| 0      | 189,66,0 | 126,44,0 | **62,21,0**        | **0,0,0** |
| 8      | 189,170,140 | 126,114,94 | **62,56,46**    | **0,0,0** |

All nine columns are `0,0,0` at @DEPTH 4 — asserted, not sampled. **Row 0 is `253,89,0` and
`253,228,188` at every index**, byte-identical as a whole row. `11-09.2`'s two predictions for the
default both reproduce to the byte: the bottom-left cell moves `84,29,0` → **`62,21,0`**, and the
frame's non-zero bytes at @DEPTH 4 fall **171 → 152**.

Row spreads across the four values, printed by the green run: **0, 24, 48, 72, 95, 119, 143, 167,
189** — zero at the anchor and the full 189 counts of 255 at the bottom.

### The knob did not move, and the proof it did not

`shapeOf` is `STAMP_ALPHABET[(knobs * 7 + total options) % 32]`. LUMEN's knobs are `[4, 4, 3, 4]`,
total **15**, both before and after:

```
before  knobs 4,4,3,4  total 15  shape b
after   knobs 4,4,3,4  total 15  shape b
```

**`b` before, `b` after.** No knob gained or lost a value, `{1, 2, 3, 4}` is untouched, the default
is still index 2, and `stamp.spec.ts`'s LUMEN literals still restore — green in the quick run.

---

## The cost at the RGB444 picker corner, measured at every step

All figures `max(compressScript(lua).length, lua.length)` after `padReady()`, at the corner
`lua-entries.sweep.spec.ts` gates (every knob at its longest declared value, `@CURSORC` overridden to
`255,255,255`).

| Shape                          | Picker corner | Defaults | Δ corner  |
| ------------------------------ | ------------- | -------- | --------- |
| as it shipped (11-10)          | **746**       | 742      | —         |
| 32/32 re-cut only              | **746**       | 742      | **+0**    |
| re-cut + `Q` only              | 726           | 722      | −20       |
| re-cut + `A` only              | 727           | 724      | −19       |
| **re-cut + `Q` + `A`, SHIPPED**| **707**       | **704**  | **−39**   |

**746 before and 746 after the re-cut alone — character-neutral, measured on both sides**, exactly as
`11-09.2` measured 608 against 608 on the pre-sysex string. The two library deltas are independent
and **add exactly**: −20 − 19 = −39. **201 free of 908 on Setup; the Timer is still the empty string
and still the most free in the catalog.**

`A` saves 19 at the corner rather than the plan's projected 20 because `@CC` renders as `102` there
and appears twice in the call, `@CH` as `15` and appears once: the corner is now **three** characters
dearer than the defaults rather than four, and the header records why.

---

## `Q`, `A`, and the ordering decisions taken on the record

### The end test sits AFTER the `Q` call

```
self.touch_cb=function(s,i,e,x,y)local n=Q(s,i,e,x,y)if e~=1 and e~=4 and e<9 then return end
  if n then <restore s.c, paint n, sysex, cursor> s.c=n end A(s,i,e,x,y,@CC,@CC+1,@CH)end
```

**Both orderings cost 707**, so the choice was made on behaviour: calling `Q` first means a genuine
lift reaches the library and releases the contact, where an end test in front of it would leave a
stale `H[i]` waiting for the next press. **The end test is KEPT rather than deleted** — CONSOLE
deleted its live test in 12-09 and saved 40 — because `A` fires on `e<4` and any code this card does
not handle would otherwise reach the two controllers. It also still stands between a lift and a CC.

### `A` is OUTSIDE the `if n then ... end` block

A finger moving **inside** one cell still moves an axis. `Q` returns nil for that sample, so an `A`
inside the gate sends nothing at all — 12-VALIDATION R-4's trap, and negative check 3 proves it on a
second entry. `s.c` stays and is not replaced by the library's `H`: it is the CURSOR (which cell is
painted over), a different question from which cell a contact is on.

### The y inversion, stated as a wire change

`A` sends `127-y` on `@CC + 1`, because the user's bench snippet does (`map_saturate(y, 0, 127, 127,
0)`). **This card sent raw y until today.** It is written into the entry header in one sentence, into
`docs/HARDWARE-AUDITION.md` row 15 so the bench sees it, and asserted as a literal in the test
(`MOVE to (61,62)` sends `cc17 = 65`). A desk with a learned mapping on that controller will read the
axis the other way round after a re-install.

### The CC and sysex counts, before and after

Driven in wasmoon through the host's own FIFO, with the input varied so the host's change gate cannot
defeat the probe (x alternating 71/72, y stepping once mid-gesture):

| Gesture                              | pre-plan      | shipped         |
| ------------------------------------ | ------------- | --------------- |
| DOWN at (60,60)                      | **2 CCs**     | **0 CCs**       |
| MOVE to (61,60) — x only             | 2 CCs (`cc16=61 cc17=60`) | **1 CC** (`cc16=61`) |
| MOVE to (61,62) — y only             | 2 CCs (`cc16=61 cc17=62`, RAW y) | **1 CC** (`cc17=65`, INVERTED) |
| MOVE inside one cell                 | 2 CCs         | **1 CC**, 0 sysex |
| six-sample 71/72 wobble — **CCs**    | **12**        | **6**           |
| six-sample 71/72 wobble — **sysex**  | **5**         | **0** (one for the press, none after) |

**Twelve is the flood number and it was recorded from negative check 2**, on the tree with the two
bare `s:gms` calls restored. Six is one per axis that actually moved, and the test derives that
number from the gesture rather than typing it.

---

## The test, extended and not added

**`+0`, written out.** No test was added anywhere. Both LUMEN titles in `lua-smoke.spec.ts` were
extended in place:

- **the depth test** (11-09.2's) gains **clause 2a**: the bottom row is exactly black in all nine
  columns and all three channels at the deepest index, asserted on the 27 emitted bytes; the row
  ABOVE it must still be lit wherever row 0 is, so the knob is a ramp and not a blanking control; and
  row 0 is byte-identical as a WHOLE ROW at every index. Clause 4's travel bound is unchanged and
  still green: `8*4 = 32 <= 32` holds **at equality**, `8*5 = 40 > 32` keeps the knob at full travel,
  and subtrahend and divisor are still parsed out of the entry's own Lua.
- **the sysex test** gains **clause 6**, five assertions: a DOWN sends no axis CC; a MOVE that moves
  only x sends exactly one CC on `@CC` carrying 61; a MOVE that moves only y sends exactly one CC on
  `@CC + 1` carrying `127 − 62 = 65`; an in-cell MOVE still sends its moved axis and no sysex; and the
  six-sample boundary wobble sends **one sysex for the whole gesture** and one CC per moved axis. Its
  title now names the second half.

Both print their tables into the run.

---

## The three negative checks, plus the one the suite found on its own

Every plant was made in CODE with an asserted replacement count, run, and restored by copying back a
scratch copy compared by `sha256sum` either side. **No `git checkout`, `restore`, `stash` or `clean`
was run at any point.** `lumen.ts` is `72963a1abf1be10294707f0009bf4ff48258aa1c99559150f1dbb242cd1e85d7`
before the first plant and after every restore.

| # | Plant                                                  | Replacements | Exit | What it printed                                                                 |
| - | ------------------------------------------------------ | ------------ | ---- | ------------------------------------------------------------------------------- |
| 1 | one `36` of the four kept (the subtrahend)             | 1            | **1** | the exact-black clause red: the bottom row rendered **`30,10,0  24,30,0  2,30,0  0,30,17  0,17,30  2,0,30  24,0,30  30,0,11  30,27,22`** — the divisor and the subtrahend disagree and nothing is black |
| 2 | the two bare `s:gms` calls restored in place of `A`    | 1            | **1** | red on the DOWN: `expected [ 'cc16=60', 'cc17=60' ] to deeply equal []`. The wobble count taken from the same tree: **12 CCs over six samples**, y raw |
| 3 | `A` moved INSIDE the `if n then ... end` block         | 1            | **1** | red with **zero CCs**, on the per-axis MOVE rather than on the in-cell clause — see below |
| — | restored                                               | —            | **0** | both LUMEN titles green                                                          |

**Check 3 reddens one clause earlier than the plan predicts, and the reason is worth keeping.** The
plan expects the in-cell MOVE assertion. What fires first is the x-only MOVE from (60,60) to (61,60)
— because with the library's hysteresis **that move is also inside one cell**, so `Q` returns nil
there too and `A` never runs. Same trap, same zero, earlier clause. The in-cell clause stays: it is
the one that names the trap, and it is the one that would catch a variant where the moves cross
cells.

### And a fourth red the plan did not predict: the tap-parity probe was blind to sysex

The first full `test:quick` run failed on **`sends the same on a fast tap as on a slow one`**:

```
lumen: the slow tap at (0.15, 0.65) produced no MIDI and no HID, so comparing the
two runs proves nothing. Move PARITY_TAP, do not weaken this
```

**This is the probe working.** LUMEN's response to a tap that never moves is a sysex message and
nothing else now, because `A` primes on the DOWN and a lift is not `e<4`. The probe collected
`host.midi` and `host.hid` and **not `host.sysex`**, so the catalog's only sysex emitter was audited
through a channel it had only ever used incidentally.

Neither of the clause's two named escapes was the answer: moving `PARITY_TAP` cannot help, because a
static tap sends no controller **anywhere** on this card, and weakening the clause is what it forbids.
`parity()` now records `sysex(...)` beside `midi(...)` and `hid(...)`, `presetParity()` deliberately
does not (the compiler has no sysex emitter at all), and LUMEN reads **fast tap 1, slow tap 1** —
equal, and non-vacuous. Documented on the `Sent` type. **[Rule 2 — missing critical check.]**

---

## `frames.json`, the OG image, and `restsBlack` — re-proved, not assumed

Regenerated with `UPDATE_FRAMES=1`, which rewrites and then fails by design; re-run clean afterwards,
**5 passed**.

- **Exactly five lines changed**, all of them LUMEN's `sha256` at the five sampled ticks:
  `b9fe7a52…` → `10916cba…`. No other entry moved.
- **`nonZeroBytes` is still 171** at every tick, so **`restsBlack: false` is re-proved rather than
  carried**: the re-cut darkens every cell below row 0 at the default but takes none of them to zero.
  152 is the @DEPTH 4 figure and frames.json records the default. `frames.spec.ts` test 5 is the gate
  and it is green.
- **72 of the 81 cells move at the default**, not the **eighty** `11-09.2` predicted. The nine that do
  not are row 0 — which is the entire point of the card and of this plan's sentence. Reported, not
  reconciled.
- **`static/og/lumen.png` was regenerated by `npm run build`** (`gen-og: lumen 6835 bytes 81 of 81
  cells lit`): **sha256 `994ea1a5…` → `c4d7c748…`**, byte length 6835 either side. **It is not in any
  commit, because `static/og/` is gitignored** (`.gitignore:23`) — the images are build artefacts.
  The directory holds **26** files, one per catalog entry, and not the 27 the plan's verification
  block states.

---

## Counts, as carried names plus deltas

| Name         | Carried (12-09)      | Term                   | Observed                           |
| ------------ | -------------------- | ---------------------- | ---------------------------------- |
| `PREV_FILES` | **85**               | **+0**                 | **85**                             |
| `PREV_TESTS` | **887**              | **+0**                 | **887** passed, 1 todo (reported, never asserted) |
| sweep        | `4 19`               | +0 / +0                | **`4 19`**                         |
| `BASE_CHECK` | **581**              | +0                     | **581 files, 0 ERRORS 0 WARNINGS** |
| catalog      | **26** (9 + 17)      | +0                     | **26**                             |
| e2e          | 87 titles / 106 runs | **+0 titles**, file touched | **87** (`grep -c "test(" e2e/*.e2e.ts`); **NOT RUN** |
| `static/og/` | —                    | +0                     | **26 files**, gitignored           |

`node scripts/check-counts.mjs 85 887` on `npm run test:quick`: *"matches the expected counts"*.
`node scripts/check-counts.mjs 4 19` on `npm run test:sweep`: *"matches the expected counts"*.
**Run twice, once before `npm run build` and once after, with the same result.**

**`e2e/install.e2e.ts` was edited and the suite was not run.** The edit is **comment-only** — four
inserted lines and two removed, all of them inside a `//` block — correcting a comment that said the
depth token *"sits in `local d=36-n//9*@DEPTH`"* in a *"742-character Setup"*. The literal that test
compares is **sliced out of the template at run time**, which is precisely why the re-cut did not
break it, and the corrected comment now says so. `grep -c "test(" e2e/*.e2e.ts` is 87 before and
after; the raw `e2e/*.ts` figure is 88 because `e2e/poll.ts:47` carries one in a comment.

### The suites, as run

| Command                             | Result                                      |
| ----------------------------------- | ------------------------------------------- |
| `npm run check`                     | **581 files, 0 ERRORS 0 WARNINGS**          |
| `npm run lint`                      | clean (prettier + eslint), exit 0           |
| `npm run test:quick`                | **85 files / 887 passed / 1 todo**          |
| `npm run test:sweep`                | **4 files / 19 passed**; over budget 0      |
| `npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts` | 6 passed — LUMEN inside 908 at every knob position, **201 free at the corner** |
| `npm run build`                     | clean, exit 0; `source-542d77a….tar.gz` 1726 KB |

**No transient failure appeared in any run.** The one red was the tap-parity probe above, and it was
a real finding rather than a flake — it reproduced on demand and it is fixed rather than re-run.

---

## Deviations from the plan

### 1. [Rule 2 — Missing critical check] The tap-parity probe now records sysex

Full account above. `src/lib/sim/lua-smoke.spec.ts`, the `Sent` type and `parity()`. **Commit
`ff67efb`.**

### 2. [Rule 1 — Stale claim the tree no longer supports] Two comments naming the old ramp and the old cost

- `e2e/install.e2e.ts:1946` said the depth token sits in `local d=36-n//9*@DEPTH` inside a
  742-character Setup. **Comment-only**, no title or assertion touched, and the corrected text names
  the run-time slice as the reason the test survived the re-cut.
- `src/lib/tune/model.spec.ts:788` said *"so 742 is 742 either way"*. The claim — LUMEN's two landed
  Setups are the same LENGTH and different STRINGS — is unchanged and still green; only the number
  moved, to 704, and both figures are now named with their plans.

Neither file is in the plan's `files_modified`. Both are **statements about the tree that the tree no
longer supported**, which this plan is required to report; fixing a comment is cheaper than carrying
it. **Commit `ff67efb`.**

### 3. [Rule 3 — Out of scope, logged not fixed] `docs/TESTING.md`'s LUMEN cost row

It still reads 742 / 746 / 162 free. It is the **fourth** row of that table this phase has
invalidated — 12-09 left CHORUS, CONSOLE and MORPH stale for the same reason and handed the rewrite
to 12-12 by name. Logged as **`deferred-items.md` item 4** with the correct row written out, not
edited here. **Nothing gates any number in that table.**

---

## What the plan asserts that the tree does not support

1. **"Four literals move (36 → 32 at four sites, the research says two)"** — the plan is right and
   `11-09.2` was wrong: there are **four**. Counted. The entry header now says four.
2. **"eighty of eighty-one cells move at the default"** — **72 of 81**. Row 0's nine cells do not
   move, by construction. `11-09.2` said eighty; the frames say seventy-two.
3. **"`static/og/` at 27 + 0 files"** — it holds **26**, one per catalog entry, and it is
   **gitignored**, so `static/og/lumen.png` can be regenerated and re-measured but never committed.
4. **`PREV_TESTS 888`** in the plan's standing rules — that is the figure after 12-10's `+1`. The
   carried and observed figure on this tree is **887**. See the ordering note.
5. **"`A` is 26 against the 46 it replaces, so the entry gets 20 characters cheaper"** — at the picker
   corner the saving is **19**, because `@CC` renders as `102` there and is named twice. The plan says
   "measure it; do not carry these numbers", and it was measured.
6. **"the never-black guarantee in the header becomes `8*max(@DEPTH) <= 32`"** — done, and the
   corresponding clause in `lua-smoke.spec.ts` needed **no change**: the bound was already `<=`. What
   moved is that the entry now sits ON it.

---

## What was NOT done, and why

- **NOTHING HERE IS HARDWARE-VERIFIED.** Every figure in this document is a statement about the
  simulator, the pinned minifier and this source. **No device was touched and nothing was deployed.**
  Probe B is the only hardware observation any of it rests on and it was the user's own bench. **The
  observation that settles the re-cut is a gate row and it is the user's**: install at @DEPTH 1,
  install again at @DEPTH 4, and compare the BOTTOM row — at 4 it is off, while the top row is the
  same both times, by design. That is now `docs/HARDWARE-AUDITION.md` row 15, which also asks the
  bench to watch `@CC + 1` fall as the finger moves down.
- **`gsd-tools roadmap update-plan-progress` was SKIPPED**, on instruction. `.planning/ROADMAP.md` is
  byte-unchanged (`git diff --quiet`, exit 0).
- **`prettier --write .` was NOT run.** Formatting was applied to the five files this plan edited and
  to nothing else; `npm run lint` is clean over the whole tree.
- **`src/vendor/` is unmoved** (`git diff --stat HEAD -- src/vendor/` empty) and
  `firmware-oracle.spec.ts` is unedited and green in the quick run. **CAT-04 stays `[ ]`.**
- **No sibling repository was read or written**, and nothing under
  `.planning/phases/13-gui-overhaul/` was touched.
- **The three untracked files at the repo root** (`HANGAR for ZONA.pdf`,
  `HANGAR-ZONA-GUI-design-specification.md`, `hangar-logo-w.svg`) are the user's and were left alone.
  Every commit used `git commit --only <paths> -F <message-file>`, pathspec before the message flag.

---

## Notes for the next plan

- **12-12's bench sheet:** row 15 is now the depth comparison plus the inversion on `@CC + 1`. It is
  the row that closes two bench notes, and no test can close them.
- **`deferred-items.md` item 4** is `docs/TESTING.md`'s LUMEN row, with the measured replacement
  written out beside CHORUS's, CONSOLE's and MORPH's.
- **`A` now has a caller and a test.** If a second entry ever wants per-axis sends, the assertions in
  `lua-smoke.spec.ts` clause 6 are the shape to copy — particularly the in-cell MOVE, which is the one
  that catches the gate mistake.

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk, and the one commit hash it
names resolves in `git log --oneline --all`:

```
FOUND  src/lib/catalog/entries/lumen.ts
FOUND  src/lib/catalog/listing.ts
FOUND  src/lib/sim/lua-smoke.spec.ts
FOUND  src/lib/catalog/frames.json
FOUND  docs/HARDWARE-AUDITION.md
FOUND  e2e/install.e2e.ts
FOUND  src/lib/tune/model.spec.ts
FOUND  .planning/phases/12-touch-framework/deferred-items.md
FOUND  .planning/phases/12-touch-framework/12-11-SUMMARY.md
FOUND  commit ff67efb
```

`static/og/lumen.png` exists and was regenerated; it is gitignored and is in no commit, which is
recorded above rather than asserted here.
