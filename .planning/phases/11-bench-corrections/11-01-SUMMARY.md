---
phase: 11-bench-corrections
plan: 01
subsystem: catalog
tags: [catalog, facets, decay, vitest, removal, browse, playwright]
requires:
  - phase: 10-redesign
    provides: "the clean tree the eleven-name baseline was measured on, and the ?for=/?feels= link migration D-01 told this plan to follow rather than invent"
provides:
  - "Nine configurations removed from the catalog, the listing, the front door's exclusion list, frames.json, wild-stamps.json and the audition checklist"
  - "Eight FOR terms, every one carrying two or more entries, with the zero-singleton rule unweakened"
  - "src/lib/catalog/decay-idiom.spec.ts - the class-A gate and the permanent home of both decay idioms"
  - "The eleven-name baseline block every later plan in this phase carries"
affects: [11-02, 11-03, 11-04, 11-14, 11-15, 11-16]
tech-stack:
  added: []
  patterns:
    - "KNOWN_VIOLATIONS: a gate's exception table that is exhaustive AND shrinking - an unrecorded violation fails, and a recorded site that now passes fails too, naming the row to delete"
key-files:
  created:
    - src/lib/catalog/decay-idiom.spec.ts
  modified:
    - src/lib/browse/facets.ts
    - src/lib/catalog/index.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/frames.json
    - docs/HARDWARE-AUDITION.md
key-decisions:
  - "D-01 executed as option (a): drums and clips retired, ninepads re-homed to play and stage to shortcuts, both on how the card feels rather than on arithmetic"
  - "docs/TESTING.md's dated measurement rows were NOT rewritten to 27 - a measurement edited to match a later tree is no longer a measurement. A dated amendment block was added instead and 11-16 owns the re-measure"
  - "The typed e2e search word moved from drums to colour, because drums lived only in the retired tag and the e2e assertion would have failed on the deployed artefact with nothing in the quick run to catch it"
patterns-established:
  - "A non-vacuity floor is re-chosen by its own construction, not by its old number: og/build.spec.ts, artifacts.e2e.ts, facets.spec.ts and stamp-roundtrip.sweep.spec.ts each say what the new number guards against"
requirements-completed: [CAT-01, CAT-03, CAT-04, CONT-02, CONT-03]
duration: 3h 05m
completed: 2026-09-09
---

# Phase 11 Plan 01: Nine Removals, the Facet Re-cut and the Decay Gate — Summary

**Nine bench-reported configurations deleted, the FOR vocabulary re-cut from ten terms to eight with
its zero-singleton rule untouched, and the decay idiom rescued out of two files being deleted into a
three-test gate that now names five open violations — with seven files the plan's blast-radius table
does not list, and two arithmetic claims the tree does not support, both reported rather than
absorbed.**

## Performance

- **Duration:** 3 h 05 m
- **Tasks:** 4 of 4
- **Files:** 9 deleted, 1 created, **24 edited** (the plan declared 17)
- **Commits:** `e180d7e`, `91c7007`, `b8c42c6`, `170eea5`

---

## The baseline block, measured on a clean tree

Measured at `b29a00f` (the tree Phase 10 closed plus four Phase 11 planning commits; `git diff --stat
a17e926 HEAD` touches nothing outside `.planning/`, so every source line number in the plan's
blast-radius table still held). `git status --porcelain` was empty before the first measurement.

| Name | Observed | Free memory at run start | Brief's figure | Agreement |
|---|---|---|---|---|
| `BASE_FILES` | **81** | 2,984 MB | 81 | agrees |
| `BASE_TESTS` | **828** passing, **1 todo** (reported, never asserted) | 2,984 MB | 828 | agrees |
| `BASE_SWEEP` | **4 19** (member list, not a total) | 3,010 MB | `4 19` | agrees |
| `BASE_SWEEP_WALL` | **134 s** | 3,010 MB | not stated | n/a |
| `BASE_E2E` | **103** | 3,260 MB | 103 | agrees |
| `BASE_CHECK` | **584 FILES 0 ERRORS 0 WARNINGS** (provenance only) | 2,384 MB | 584 | agrees |
| `BASE_CATALOG` | **36** | — | 36 | agrees |
| preset / Lua split | **9 ported preset + 27 hand-authored** | — | 9 / 27 | agrees |
| `FRONT_DOOR.length` | **8** | — | 8 | agrees |
| `EXCLUDED_FROM_ROW.length` | **28** | — | 28 | agrees |
| `BASE_OG_BYTES` | **213,919 bytes over 36 files** (5,942 B mean) | — | 36 files | agrees |

**No disagreement with the phase brief's `81 / 828 / 103 / 584 / 4 19` block.** Each of the five was
produced by `scripts/check-counts.mjs` exiting zero against the brief's own literal, rather than read
off a transcript.

`grep -c "test("` over `e2e/` totals **85** across fifteen files, against a Playwright total of 103.
The gap is parameterised titles. **85 is the number this plan's e2e zero is proved with, not 103.**

---

## The closing block, as carried name plus delta

| Name | Carried | Delta | Observed | Free memory |
|---|---|---|---|---|
| quick files | `PREV_FILES` 81 | **+1** | **82** | 1,700-2,900 MB |
| quick tests | `PREV_TESTS` 828 | **+3** | **831** (+1 todo) | " |
| sweep | `BASE_SWEEP` `4 19` | **+0** | **4 19** | 1,356 MB |
| sweep wall | `BASE_SWEEP_WALL` 134 s | **−14 s** | **120 s** | 1,356 MB |
| e2e | `PREV_E2E` 103 | **+0** | **103** | 1,634 MB |
| `svelte-check` | `BASE_CHECK` 584 | **−8** | **576**, 0 errors 0 warnings | — |
| catalog | `BASE_CATALOG` 36 | **−9** | 9 preset + 18 Lua | — |
| `static/og/` | `BASE_OG_BYTES` 213,919 B / 36 | **−52,165 B / −9 files** | **161,754 B over 27 files** | — |

**The spec-file count ROSE while nine source files were deleted, and that is correct.**
`check-counts.mjs` counts *test files*; the nine deletions are sources. The one new file is
`src/lib/catalog/decay-idiom.spec.ts` with three tests. A reader expecting a deletion to lower the
file column would think the gate was broken.

**`BASE_CHECK` reconciles exactly:** 584 − 9 deleted sources + 1 new spec = **576**. Reported, not
asserted.

**The sweep got faster, and it did so under worse conditions.** 134 s at 3,010 MB free became 120 s
at 1,356 MB free. The removal reached it.

**The e2e zero is proved, not asserted.** `cat e2e/*.ts | grep -c "test("` was **85** before the plan
and **85** after. No Playwright title was added, moved or removed.

`git diff --stat HEAD -- src/vendor/` is **empty**. No agent connected to or wrote to a device, and
nothing here is claimed as hardware-verified.

---

## What the plan asserts that the tree does not support

Five findings. None was reconciled into a passing number.

### 1. Seventeen edited files is an undercount. The observed number is TWENTY-FOUR.

The plan reconciles its own three numbers carefully — "fourteen is a row count, thirteen is a file
count, and seventeen is this plan's edit count" — and all three of those internal statements are
consistent. The blast-radius table's thirteen files were all real and all needed editing, and every
line number in it held at `a17e926` and still held at `b29a00f`.

**But seven further files needed editing, every one found by running the suite rather than by
reading the plan.** Each carries a comment in its own source saying it is not in the table and that
the omission is reported here.

| File | What it holds | Found by |
|---|---|---|
| `src/lib/browse/sort.spec.ts` | `RECORDED = { entries: 36, featured: 15 }` — **four of the nine removed entries were featured** (HOLD, KEYS, LEARN, SWITCH), so both numbers moved: 27 and 11 | `test:quick` |
| `src/lib/browse/filter.spec.ts` | the `RECORDED` vocabulary census — `entries` 36→27, `tags` 16→14, all sixteen counts, plus four assertions sampling the retired `drums` term | `test:quick` |
| `src/lib/browse/query.spec.ts` | **nine** sites naming `drums` as a live FOR chip, including the whole `?tag=` migration test | `test:quick` |
| `src/lib/catalog/copy.spec.ts` | the search anchor asserting a typed `drums` narrows without emptying | `test:quick` |
| `e2e/browse.e2e.ts` | the same word, typed into the real browser | reasoning from `copy.spec.ts`, then the Playwright run |
| `src/lib/tune/colour-picker.spec.ts` | the colour-knob split `14 / 14 / 3 / 5` over the catalog | `test:quick` |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | **three** literals inside one sweep test | `test:sweep` |

**The sweep file matters most, because the plan asserts the sweep "unchanged at `4 19`" and that is
true of the member list and the test count and NOT true of the test contents.** Three literals inside
one test had to be re-chosen: `guarded` 88→**62**, `exempted` 45→**29**, and a non-vacuity floor of
200,000 that had become a permanent red (observed total 168,576). A plan reading "sweep unchanged"
as "sweep untouched" would have shipped a red sweep.

**`stamp.spec.ts` has a THIRD count literal the table does not name.** The table names `:421` and
`:422` (both 27 → 18) and both were exactly right. `:433`'s `expect(moved.length, ...).toBe(25)` is
the count of captured entries that now emit a different format; it is **16** at eighteen entries,
because CULL and QUADRANT declare no colour knob and still emit `x`. Verified by running, not
assumed.

### 2. The decay gate's expected failing values are wrong for EUCLID and MORPH. All of them fail, not three of four or three of five.

The plan and `11-VALIDATION.md` both state that the parameterised arm "fails EUCLID's `@TRAIL` on
`64`, `100` and `150` and MORPH's `@DECAY` on `20`, `80` and `120`" — implying `21`/`42` and `42`
pass. **They do not.** Both sites write `glpfs(a,l,255,250,0)`: the start is **255** and the step is
**6**, and 255 is odd while every multiple of 6 is even, so `255 − 6T ≡ 0 (mod 256)` has **no
solution at all**. Measured freeze points:

- EUCLID `@TRAIL`: 21 → **129**, 42 → **3**, 64 → **127**, 100 → **167**, 150 → **123**
- MORPH `@DECAY`: 20 → **135**, 42 → **3**, 80 → **31**, 120 → **47**

The failing subsets the plan names are exactly *the values that are not divisors of 252* — the
planner applied the literal form's rule (`start 252`, `rate 256 − 252//T`) to a pair whose start is
255 and whose rate is a fixed 250. The gate implements **the plan's own stated rule**,
`(start + rate × timeout) mod 256 === 0`, and therefore reports every value. Nothing was adjusted to
make an expected subset appear.

**This strengthens 11-02's brief rather than weakening it:** EUCLID and MORPH cannot be fixed by
re-choosing knob values. Their start/rate pair has to change.

### 3. "The fifteen legal timeouts under 256" is fifteen by taste, not by arithmetic.

The plan lists `4, 6, 7, 9, 12, 14, 18, 21, 28, 36, 42, 63, 84, 126, 252` and, in the same paragraph,
correctly says 252 has **eighteen** divisors. `1`, `2` and `3` satisfy the arithmetic as completely as
the other fifteen (T=1 emits rate 4 and lands on 252 + 4 = 256 ≡ 0). The gate's header carries the
fifteen as the plan wrote them **and** an honest footnote saying the other three are excluded as
degenerate — a decay finishing inside three ticks is a flicker — **not as illegal**. The tests check
the arithmetic and not the list, so an entry that genuinely wanted T=2 would pass.

### 4. `src/lib/catalog/listing.ts`'s header still says "sixteen configurations" and did before this plan.

Lines 1 and 18 describe the listing as "all sixteen configurations". That was already wrong at 36
and is out of this plan's scope — pre-existing, not caused by the removal. Logged, not fixed.

### 5. `audition.spec.ts`'s message said "the rows are numbered 1 to 30" while `ROW_COUNT` was 32.

Pre-existing prose/assertion mismatch in a message string; the assertion itself derived from
`ROW_COUNT`. Corrected to 1 to 23 while renumbering, and named here rather than left silent.

---

## The removal

**Catalog: `BASE_CATALOG − 9`, split 9 ported preset + 18 hand-authored Lua.** Nine entry files
deleted, 1,910 lines. HOLD, KEYS, LEARN, SWITCH, ETCH, GRIDLOCK, LIFE, SLAM and TABLE — the user's
own words, no diagnosis offered and none needed.

**Every line number in the blast-radius table was verified before it was edited and every one held.**

| File | Table said | Found at | Result |
|---|---|---|---|
| `index.ts` imports | 14, 18-22, 30, 34, 37 | identical | 9 lines out |
| `index.ts` `CATALOG` | 66, 68-71, 74, 80, 82-83 | identical | 9 lines out |
| `index.ts` re-exports | 95, 97-100, 103, 109, 111-112 | identical | 9 lines out; **27 total** |
| `front-door.ts` | 94, 102, 106, 110, 114, 126, 150, 158, 162 | identical | 36 lines out |
| `listing.ts` | 318, 340, 353, 366, 379, 418, 492, 516, 531 | identical | 115 lines out |
| `frames.json` | 9 `entries` keys | identical | regenerated |
| `wild-stamps.json` | 18 of 54 records | identical | 36 remain |
| `stamp.spec.ts` | `:421`, `:422` | identical | plus `:433`, see finding 1 |
| `demo.ts` | `ETCH_PATH` 224, `DEMO_PATHS.etch` 258, prose 6 and 288 | identical | GHOST and MORPH untouched |
| `audition.spec.ts` | `:52` `ROW_COUNT = 32` | identical | → 23 |
| `og/build.spec.ts` | `:220` `>= 36` | identical | → 27 |
| `artifacts.e2e.ts` | `:73` `>= 36` | identical | → 27 |

**`FRONT_DOOR` is asserted UNMOVED AT 8.** The eight ring-eligible ported presets are aurora,
pinwheel, ninepads, starfield, joystick, radar, faders and dial, and none of the nine was among them.
Only `EXCLUDED_FROM_ROW` shrank, **28 → 19**, and `front-door.spec.ts`'s row-plus-exclusions-equals-
`CATALOG` assertion is green at 8 + 19 = 27. *The removal touched the front door; it did not shrink
the ring.*

**`wild-stamps.json` shrank; it was not regenerated.** The eighteen records naming a removed entry
were deleted and the `entries` field went 27 → 18. Every surviving payload is still the byte-for-byte
literal captured at `b3f99bb`, which is the only thing that makes that fixture a test against history
rather than a round trip of the encoder against itself.

**`frames.json` regenerated through the sanctioned path.** `UPDATE_FRAMES=1 npx vitest run --project
server src/lib/catalog/frames.spec.ts` rewrote it, ran prettier and failed by design; the re-run
without the variable is green at **27** entries. The nine keys removed are `hold`, `keys`, `learn`,
`switch`, `etch`, `gridlock`, `life`, `slam`, `table`.

**`docs/HARDWARE-AUDITION.md` — the largest single edit.** Nine cost-table rows out, nine checklist
rows out (13, 15, 16, 17, 18, 21, 27, 29, 30 — exactly the set the plan named), renumbered 1..23
contiguously, five prose lists re-cut. **The six rows where a green test is not evidence are now
five**, because the sixth was HOLD's latch and it left with HOLD. Row 19 (now 14, CONSOLE) had been
cross-referencing the deleted row 13 for the dropped-release bug and now states the bug itself, which
is the one place in the document where a deletion cost real content rather than a number. Setup-only
entries 13 → 6; Timer files 14 → 12; `restsBlack` "GHOST, MORPH and ETCH" → GHOST and MORPH.

**`docs/TESTING.md` carries a dated amendment, not a rewrite — and this was a deliberate departure
from the plan's item 7.** The plan asks for the prose counts to "move". Most of the numbers it names
sit inside tables whose own first sentence is *"Every number here is observed, never predicted"*,
each dated and tied to a commit. Rewriting `27.2 million pixels at thirty-six` to a number nobody
measured would destroy a measurement record to make prose tidy. What moved is what the catalog **is**
(two present-tense statements of composition, and the `restsBlack` triple); what did not move is
every dated observation, now headed by a 2026-09-09 amendment block naming the removal and saying
plan 11-16 owns the re-measure. Reported here as a deviation, not slipped in.

`lua-entries.sweep.spec.ts`'s header prose corrected to **29 colour knobs across 16 of 18 entries**,
total knobs **133 → 91** — both verified by counting `token: "@` and `kind: "colour"` across the
entry files before and after, and both exactly as the plan predicted.

---

## The facet re-cut (D-01)

### Before, and it is the state D-01 was raised about

Observed at 27 entries with the old ten terms, by lowering only the non-vacuity floors and running
the spec — **watched go red before anything was changed**:

`modulation 7, show 5, keys 2, mixing 3, sequencing 3, shortcuts 2, pointing 2, play 1, drums 1,
clips 1`

**This is the plan's "after removal, before re-homing" column, term for term.** Three singletons
against a rule that asserts zero.

### After

| FOR term | entries |
|---|---|
| modulation | **7** |
| show | **5** |
| mixing | **3** |
| sequencing | **3** |
| shortcuts | **3** (+ stage) |
| keys | **2** |
| pointing | **2** |
| play | **2** (+ ninepads) |
| **total** | **27** |

Eight terms, **every one carrying two or more**, summing to `BASE_CATALOG − 9` — one FOR slot per
entry. `drums` and `clips` retired. `FOR_TERMS` re-sorted into its documented descending order.

**FEELS did not move**, and lands at `readable 11, expressive 11, generative 12, playable 8,
precise 6, still 6` — 54 slots, two per entry.

**The zero-singleton assertion passes on the data, unweakened, uncommented and unloosened.**

### The re-homing is a judgement about the cards, per CONT-03

Neither reads as a stretch, and both were checked against the card rather than against the
arithmetic:

- **`ninepads` → `play`.** "Nine drum pads drawn on the lights, each one a note, with the one you are
  holding lit up." Nine pads under your fingers, each sounding a note, is playing. Truthful.
- **`stage` → `shortcuts`.** "Nine scenes for your stream: the live one glows and the one you are
  lining up breathes." Its `@KEY0` and `@MOD` knobs send real USB HID keystrokes to a streaming
  application. A scene button **is** a shortcut; this is the more honest of the two, not the weaker.

Both edited in **`listing.ts` and in the entry file each lives in** (`ported.ts`, `stage.ts`), so
`listing.spec.ts`'s two-directional equality was never the thing that caught it.

### `LEGACY_TAG_MAP`, and the fact the data can no longer recover

`clips` and `drums` were **clause 1** self-maps and are no longer facet members, so they fall to
**clause 2**: `clips → "shortcuts"`, `drums → "play"`. Clause counts 10 + 12 → **8 + 14**; the total
is still 55 and `RETIRED_VOCABULARY` did not grow, because both words were already on it.

**The comment records what a future reader could not derive:** each tag had exactly two carriers as a
chip, and **one of each pair was DELETED rather than re-homed** — `slam` for `drums`, `gridlock` for
`clips`. Somebody counting carriers in today's listing would find one apiece and wrongly read these
as the singleton folds clause 2's first half forbids. `clips` also gets its two-history note: a
singleton on `gridlock` in the fifty-five-term vocabulary, a two-carrier chip after 10-06, and the
second is the count clause 2 asks about because a `?tag=clips` link could only have been made while
it was a chip. `game: "play"` was already correct and did not move.

### The link migration, followed rather than invented

Per D-01 and the phase brief, Phase 10's `?for=`/`?feels=` migration was the precedent.
`query.spec.ts`'s `?tag=drums` test previously proved a clause-1 self-map; it now proves the D-01
fold (`for: ["play"]`), and **`?tag=clips → ["shortcuts"]` was added beside it** so both retired
terms are covered rather than one standing in for the pair. An address somebody shared while `drums`
was a chip still lands on a live grid.

### The FEELS floor, written where it will be seen

`precise` and `still` land at **exactly 6**, which is the floor `facets.spec.ts:186` asserts. **A
tenth removal in any later phase breaks a FEELS rule.** That sentence is in `facets.ts`'s header,
beside the zero-singleton note — in the file whose spec goes red, not in a planning document nobody
greps.

### The four re-chosen non-vacuity floors, each saying what it now guards

| Site | Was | Is | What it guards now |
|---|---|---|---|
| `og/build.spec.ts:220` | `>= 36` | **`>= 27`** | a routed set that shortens without this file being edited |
| `e2e/artifacts.e2e.ts:73` | `>= 36` | **`>= 27`** | the same, on the deployed artefact |
| `facets.spec.ts` × 2 | `> 30` | **`> 20`** | a listing that quietly lost a quarter of itself — a partial import or a bad regeneration |
| `stamp-roundtrip.sweep.spec.ts` | `> 200000` | **`> 120000`** | kept by construction, not by number: above either pass alone (49,792 and 118,784), clearable only by the sum |

---

## The decay gate

`src/lib/catalog/decay-idiom.spec.ts`, **three tests**, created and committed as `91c7007` —
**before** `b8c42c6` deleted `life.ts` and `gridlock.ts`. The ordering constraint was honoured
literally: the rescue landed first.

**Both idioms survive their files' deletion.** Confirmed by `git show b8c42c6` (the deletion) coming
after `git show 91c7007` (the rescue), and by the header carrying both verbatim:

- **The literal-parameterised form**, moved verbatim from `life.ts:59-61` — "THE DECAY LENGTH DIVIDES
  252. The rate is 256 − 252//28 = 247 and the starting phase is 252, so the phase steps by 9 and
  lands on exactly 0 in exactly 28 ticks. A length that does not divide 252 expires part-way down." —
  plus the correction `life.ts` never stated: T must be an **exact divisor**, because the emitted
  step is `252//T`.
- **The computed form**, moved verbatim from `gridlock.ts:129` and its `@SPREAD` comment at
  `:194-200` — the Lua line and "EVERY VALUE IS A MULTIPLE OF FOUR, because the derived timeout is
  (256 − p)//4 and it has to be exact." — generalised to `glpfs(a,l,p,R,0)` + `glt(a,l,(256−p)//R)`,
  **which is the shape 11-02 needs for CHORUS.**

**`11-RESEARCH.md` named one idiom for rescue where there were two.** `11-CONTEXT.md`'s closing note
names only `life.ts`. The plan caught the omission and this SUMMARY records it: `gridlock.ts`'s
computed form is the one 11-02 needs, and it would have been destroyed by the same commit that
deleted the file.

`cull.ts` is **cited, not restated** — its `@FLASH` values `["12","28","42","63"]` are all four exact
divisors of 252, measured here and something the research did not check. `steps.ts` ships the same
shape with the same four.

The header states the mechanism (`pha` is a `uint8_t`, `+=` wraps, nothing clamps and nothing stops,
`grid_led.c:190-211` and `pad-sim.ts:883-891` agreeing line for line), the freeze point
`(start + rate × timeout) mod 256`, and one sentence saying **the ROADMAP's "the phase walks down to
3 and stops" is wrong in mechanism**: nothing walks down to 3; 3 is simply what `(255 + 250×42) mod
256` equals, and EUCLID at `@TRAIL 100` freezes at 167, which no reading of "walks down to 3"
predicts.

### `KNOWN_VIOLATIONS`, five rows

| Entry | Event | Pair | Frozen at | Closed by |
|---|---|---|---|---|
| **euclid** | timer | `glpfs(a,2,255,250,0)` + `glt(a,2,@TRAIL)` | 21→**129**, 42→**3**, 64→**127**, 100→**167**, 150→**123**; no timeout can reach 0 | 11-02 |
| **ghost** | timer | `glpfs(a,l,255,250,0)` + `glt(a,l,42)` | **3** | 11-02 |
| **morph** | setup | `glpfs(a,2,255,250,0)` + `glt(a,2,@DECAY)` | 20→**135**, 42→**3**, 80→**31**, 120→**47**; no value can reach 0 | 11-02 |
| **sonar** | timer | `glpfs(a,2,255,250,0)` + `glt(a,2,42)` | **3** | 11-02 |
| **chorus** | **setup** | `glpfs(a,2,255-math.sqrt(p*p+q*q)*22//1,@BLOOMRATE,0)` + `glt(a,2,64)` | the **opening brightness itself** at `@BLOOMRATE` 4, 8 and 12, because `rate*64 mod 256` is 0 for every multiple of 4; opening brightness **+128** at 2 and 6 | 11-02 |

The plan places CHORUS's bloom in the **timer**; it is in the **setup**, found by the gate refusing
the row and naming the mismatch. Corrected against the tree.

**Skips, each with its reason in the source:** a `glpfs` whose shape is not 0 is a keeper, not a decay
(ARC, POMODORO, SHUTTLE and STAGE each carry one deliberately); a `glt` of 0 cancels; and — found by
running, not planned — **a rate of 0 does not walk at all** and is how an entry takes a cell back
from a decay it started earlier, which is exactly what `life.ts`'s live branch did.

`STEPS` and `CULL` both pass the parameterised arm on all four values. The **derived-timeout arm** —
`glt(a,l,(256−p)//R)` — is implemented and documented as **currently unexercised by any shipped
entry**, because the one entry that used it, GRIDLOCK, is deleted by this same plan. Said in the
source rather than left for a reader to discover.

---

## The four negative checks, with exit codes

| # | Check | Observed | Exit |
|---|---|---|---|
| 1 | `cull.ts`'s `@FLASH` values set to `["12","28","42","64"]` | **test 2 red**, message names the rule first (`A DECAYING LAYER MUST LAND ON PHASE 0`) then `@FLASH=64 -> freezes at 60` | **1** |
| 2 | `ghost` removed from `KNOWN_VIOLATIONS` | **tests 1 and 3 red**; test 1 names ghost as an unrecorded violation with the rule first, test 3 names the row count | **1** |
| 3 | `stage` left on `clips` (the pre-re-cut tree, floors lowered) | **facets.spec.ts health rule red**; the message names the term and prints the histogram, which carries `play 1, drums 1, clips 1` | **1** |
| 4 | a ninth `ForTerm` (`nosuchterm`) carried by nothing | **three tests red**; `facets.spec.ts:146` reads *"nosuchterm is declared in a facet and carried by no entry"* with the full histogram | **1** |

Two notes on how these differ from the plan's wording:

- Check 3's failure surfaces at the **"no FOR term below two"** rule and names **`play` first**,
  because the loop reaches `play` before `clips`. The message's histogram names all three singletons,
  so the term is named — but the plan's "naming `clips`" is naming the second of three.
- Check 4 fails at **`:146`** (the "carried by no entry" rule) rather than the plan's `:177` (the
  "below two" rule). A term at 0 trips the earlier rule first. Both are health rules in the same file
  and both would have caught it.

**Restores were done from scratch copies with sha256 comparison, never with `git checkout --`**, per
the Phase 10 warning. `cull.ts` back to `2720a29c…`, `decay-idiom.spec.ts` back to `79b1971e…`,
`facets.spec.ts` back to `58f7313c…`, `facets.ts` back to `19405fd0…`, and `listing.ts` (temporarily
reverted so the two commits could be split cleanly) back to `1a17cacb…`. Every hash matched.

---

## The seventeen the plan declared, and the twenty-four observed

The plan's `files_modified` carries 27 paths = 9 deleted + 1 created + 17 edited, and the objective's
reconciliation of fourteen/thirteen/seventeen is internally correct: **fourteen is the blast-radius
table's ROW count, thirteen is its FILE count** (the first row is the nine deletions, not an edit),
and seventeen is thirteen + the three D-01 files + `lua-entries.sweep.spec.ts`.

Observed: **9 deleted + 1 created + 24 edited = 34 paths.** The seven extra are listed in finding 1
above. `git diff --name-status a17e926 HEAD -- src e2e docs` reports `1 A, 9 D, 24 M`.

Line numbers as found rather than as planned: every one in the blast-radius table was identical to
the plan's, with the single expected exception of `listing.ts`'s `stage` tag, which the plan cites at
`:449` and which sits at **`:373`** after the nine `ListingEntry` blocks were removed above it.
`ninepads`' tag is at `:188`, exactly as the plan says.

---

## Commits

| Commit | Task | What |
|---|---|---|
| `e180d7e` | 11-01-01 | the eleven-name baseline block, and five figures that agreed |
| `91c7007` | 11-01-04 | the decay rule rescued into a gate, before its two files are deleted |
| `b8c42c6` | 11-01-02 | nine configurations gone, and four files the plan's table missed |
| `170eea5` | 11-01-03 | eight FOR terms, and the rule that was not weakened |

Task 04 was executed before task 02, as the plan permits and its ordering constraint requires.

---

## Deviations from Plan

**1. [Rule 2 — missing critical functionality] Seven files outside the blast-radius table.** Found
during tasks 02 and 03. Fixed inline; each carries a source comment naming the omission. Without
them the quick suite, the sweep and the Playwright suite would all have been red. See finding 1.

**2. [Rule 1 — bug] The typed e2e search word.** `e2e/browse.e2e.ts` types `drums` and asserts the
grid narrows without emptying. `drums` lived **only** in the retired tag — no entry's name or
description contains it — so D-01 took that assertion from two entries to zero. Moved to `colour`, a
description word carried by six entries that no vocabulary re-cut can empty, in both
`e2e/browse.e2e.ts` and its `copy.spec.ts` anchor. **This is the only place in this plan where a
vocabulary decision reached the e2e suite, and nothing in the quick run would have caught it** —
warning 3 from Phase 10, earned again.

**3. [Rule 3 — blocking] A `glpfs` with rate 0.** The gate's first run threw on `life.setup`'s
`glpfs(a,2,255,0,0)`, which has no paired `glt` because it does not decay — it is how a cell is taken
back from a decay. Added as a documented skip.

**4. [judgement, reported rather than executed as written] `docs/TESTING.md`.** The plan asks for
dated measurement rows to be rewritten to the new catalog size. They were not. A dated amendment
block was added instead. Reasoning in "The removal" above.

**5. [Rule 1 — bug] `CHORUS`'s bloom is in `setup`, not `timer`.** The plan's task-04 text places it
in the Timer. Corrected against the tree; the gate found it.

No Rule 4 checkpoints were reached.

---

## Known Stubs

None. Nothing in this plan renders placeholder data or leaves a component unwired.

---

## For the waves that follow

- **11-02 inherits five `KNOWN_VIOLATIONS` rows, and two of them cannot be closed by re-choosing knob
  values.** EUCLID's and MORPH's `255,250` pairs can never land on 0 for any timeout. The start and
  the rate have to change. CHORUS needs the **computed** form from `gridlock.ts`, which is in
  `decay-idiom.spec.ts`'s header and nowhere else.
- **The gate fails a violating site that is not in the table**, so a wave that touches a decay without
  reading the header will hear about it.
- **`precise` and `still` sit at exactly 6.** Any tenth removal, in any later phase, breaks a FEELS
  rule. `facets.ts`'s header says so.
- **`PREV_FILES` 82 · `PREV_TESTS` 831 · `PREV_E2E` 103 · sweep `4 19` at 120 s** are what wave 2
  carries forward. `BASE_FILES` 81, `BASE_TESTS` 828, `BASE_E2E` 103, `BASE_CATALOG` 36,
  `BASE_SWEEP_WALL` 134 s, `BASE_OG_BYTES` 213,919 / 36 never move.

## Self-Check: PASSED

Created files verified present: `src/lib/catalog/decay-idiom.spec.ts`, and `src/lib/browse/facets.ts`
and `src/lib/catalog/frames.json` still on disk. All nine deleted entry files verified GONE. All four
commit hashes verified present in `git log --oneline --all`: `e180d7e`, `91c7007`, `b8c42c6`,
`170eea5`.
