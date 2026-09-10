---
phase: 12-touch-framework
plan: 04
subsystem: catalog
tags:
  [
    removal,
    facets,
    vocabulary,
    fixtures,
    counts,
    negative-check,
    audition,
    requirements,
  ]
requires:
  - phase: 12-touch-framework
    plan: 03
    provides: "PREV_FILES 84 / PREV_TESTS 877 / e2e 87 titles, 106 runs / BASE_CHECK 582 / BASE_SWEEP 4 19 / catalog 29 (9 + 20), measured on a clean tree at d78e087"
  - phase: 11-bench-corrections
    plan: 01
    provides: "D-01 - the precedent this plan follows for the second time: retire the thin FOR term and re-home its survivors onto words that describe how the cards feel, never weaken a rule that was raised deliberately"
provides:
  - "THE CATALOG IS 26, split 9 preset + 17 Lua. LATTICE, FORGE and SHUTTLE are gone from the catalog, the listing, the exclusion list, frames.json, wild-stamps.json, the smoke suite, the audition checklist, static/og and the routed set"
  - "THIRTEEN FACET TERMS: seven FOR summing to 26, six FEELS summing to 52, every one of the thirteen carried by two or more. `keys` retired, CHORUS on `play`, LUMEN on `still` - the floor of six held by re-homing rather than lowered"
  - "LEGACY_TAG_MAP's `harmonic` re-targeted to `play` from the recorded derivation, with the twice-folded fact written in; RETIRED_VOCABULARY byte-identical and the five fifty-five sites proved unmoved by diff"
  - "The ?for=keys chip link and the three dead /c/<id>/ addresses recorded in REQUIREMENTS.md CAT-01 as decided costs rather than discovered at deploy"
  - "PREV_FILES 84 + 0 = 84, PREV_TESTS 877 - 3 = 874 - the first NEGATIVE term in Phase 12"
affects: [12-05, 12-07, 12-11, 12-12]
tech-stack:
  added: []
  patterns:
    - "A count that is a FLOOR only goes red when the listing falls THROUGH it, so a floor left behind by growth is invisible until a removal arrives - sort.spec.ts's 27 had been wrong for two waves and was green the whole time"
    - "A prose figure with no assertion under it drifts silently and is only ever found by the wave that has to move it; four separate sentences in this tree were stale before this plan touched them, and each is corrected with the drift named rather than the number quietly swapped"
    - "A UNION SAMPLE THAT NAMES A DEAD WORD STILL PASSES. A term nothing carries contributes nothing to either side of the comparison, so the OR test would have gone on asking the OR question of a single chip and looking green - the pair is re-chosen, not left"
    - "The zero-singleton assertion is unreachable as a first red: the FOR floor of two and the FEELS floor of six both run before it and both fire first for any singleton, so it restates rather than guards"
    - "A count literal found by RUNNING a suite rather than by reading a blast-radius table is recorded as such in the file itself, with the tally of how many waves in a row have found it that way"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-04-SUMMARY.md
  modified:
    - src/lib/catalog/entries/lattice.ts
    - src/lib/catalog/entries/forge.ts
    - src/lib/catalog/entries/shuttle.ts
    - src/lib/catalog/index.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/frames.json
    - src/lib/catalog/audition.spec.ts
    - src/lib/catalog/touch-guard.spec.ts
    - src/lib/catalog/decay-idiom.spec.ts
    - src/lib/catalog/host-surface.spec.ts
    - src/lib/catalog/lua-entries.sweep.spec.ts
    - src/lib/catalog/entries/ported.ts
    - src/lib/catalog/entries/arc.ts
    - src/lib/catalog/entries/chorus.ts
    - src/lib/catalog/entries/console.ts
    - src/lib/catalog/entries/cull.ts
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/entries/ghost.ts
    - src/lib/catalog/entries/lumen.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/catalog/entries/pomodoro.ts
    - src/lib/catalog/entries/quadrant.ts
    - src/lib/catalog/entries/radar-points.ts
    - src/lib/catalog/entries/snake.ts
    - src/lib/catalog/entries/sonar.ts
    - src/lib/catalog/entries/stage.ts
    - src/lib/catalog/entries/steps.ts
    - src/lib/catalog/entries/strip.ts
    - src/lib/catalog/entries/wheels.ts
    - src/lib/sim/lua-smoke.spec.ts
    - src/lib/share/fixtures/wild-stamps.json
    - src/lib/share/stamp.spec.ts
    - src/lib/share/stamp-roundtrip.sweep.spec.ts
    - src/lib/tune/colour-picker.spec.ts
    - src/lib/browse/facets.ts
    - src/lib/browse/facets.spec.ts
    - src/lib/browse/filter.spec.ts
    - src/lib/browse/sort.spec.ts
    - src/lib/browse/query.ts
    - src/lib/browse/query.spec.ts
    - src/lib/ui/FacetRow.svelte
    - src/lib/ui/browse-ui.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/og/build.spec.ts
    - e2e/artifacts.e2e.ts
    - docs/HARDWARE-AUDITION.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "LUMEN ON `still` WAS TAKEN, NOT STOPPED ON, and the plan's doubt is answered by the term's own cohort rather than by the arithmetic. `still` and `generative` are opposites on the MOTION axis - 'show me the ones that move by themselves' - and LUMEN has no Timer at all, so nothing about it moves untouched. Every other carrier of `still` moves under a finger too: JOYSTICK is a joystick, TPAD is an XY pad, STRIP is a crossfader, MORPH is four macros you slide between. The word has never meant inert; it means it does not run on its own. LUMEN's own quiet line in listing.ts already reads 'The whole field stays lit and still'"
  - "THE PLAN'S EXPECTED CARRIER FOR `harmonic` IS WRONG AND THE DESTINATION IS RIGHT. The plan says one of harmonic's two carriers was LATTICE, deleted by this plan. The derivation says otherwise: 09-04-SUMMARY.md:597 records the two as CHORUS and the ENTRY called KEYS, and plan 11-01 deleted that entry. So the surviving carrier is CHORUS either way and `harmonic: \"play\"` stands - but the fact written into the comment is a different fact from the one the plan drafted"
  - "NO `keys` ROW WAS ADDED AND RETIRED_VOCABULARY IS BYTE-IDENTICAL, verified three ways before anything was edited and proved by diff afterwards"
  - "THE ZERO-SINGLETON ASSERTION IS NOT THE ASSERTION THAT CATCHES A SINGLETON. facets.spec.ts's FOR floor of two runs first and fired first; the singleton line at :246 never ran. It is a restatement, and the plan calls it the guard"
  - "THE PLAN'S TASK 01 CANNOT BE GREEN, and its own task 02 depends on that. The removals take `keys` to one and `still` to five, so facets.spec.ts and filter.spec.ts are red at the task 01 commit by construction - which IS the plan's first two negative checks, arriving without a plant"
  - "FOUR STALE PROSE FIGURES WERE CORRECTED WITH THEIR DRIFT NAMED rather than silently swapped: facets.ts's floor sentence (precise had been 7 since 11-15, not 6), FOR_TERMS' declared descending order (sequencing passed mixing at 11-14 and nobody re-sorted), lua-entries.sweep.spec.ts's colour-knob census (two waves out of date) and nineteen files saying the closed vocabulary is sixteen or fourteen"
patterns-established:
  - "A removal wave states what the NEXT removal would break, in the file whose spec goes red, and recounts every term rather than subtracting from the sentence it is replacing - because the sentence it is replacing has drifted twice out of two"
requirements-completed: []
duration: 90min
completed: 2026-09-10
---

# Phase 12 Plan 04: Removals ten, eleven and twelve, and the two facet rules they break Summary

**LATTICE, FORGE AND SHUTTLE ARE GONE AND THE VOCABULARY IS HONEST A SECOND
TIME.** The catalog is `BASE_CATALOG 29 - 3 = 26`, split **9 preset + 17 Lua**.
`keys` fell to one carrier and was **retired**; `still` fell to five and was
**re-homed back to six**; neither rule was touched. CHORUS carries `play` and
LUMEN carries `still` — **taken, not stopped on**, because every other carrier
of `still` is a control that moves under a hand and the axis the term sits on
is "moves by itself", which LUMEN, having no Timer at all, does not.
`LEGACY_TAG_MAP`'s `harmonic` row pointed at the term being retired and is
re-targeted to `play` from `09-04-SUMMARY.md:597` — whose record names CHORUS
and the **entry** called KEYS, not LATTICE as the plan expected. `RETIRED_VOCABULARY`
is byte-identical and the five `55` sites are proved unmoved by diff. Counts:
`PREV_FILES 84 + 0 = 84`, `PREV_TESTS 877 **- 3** = 874` — **the first negative
term in Phase 12**, and `check-counts.mjs` treated it exactly like a positive
one, because it is a plain equality in both columns. Sweep `4 19` in 136 s,
e2e `87 + 0` titles and `106 + 0` runs, `check` 579 files / 0 / 0, `static/og`
**26 images, 155,278 B** against 11-16's 172,699 B over 29. Nothing touched a
ZONA and nothing was deployed.

## Performance

- **Duration:** about 90 min
- **Tasks:** 2 of 2
- **Files:** 3 deleted, 45 modified, across two commits plus this document's own

---

## Counts, as carried names plus deltas

| Name              | Carried from    | Term      | Observed                                          |
| ----------------- | --------------- | --------- | ------------------------------------------------- |
| `PREV_FILES`      | **84** (12-03)  | `+0`      | **84**                                            |
| `PREV_TESTS`      | **877** (12-03) | **`-3`**  | **874** passed, 1 todo (reported, never asserted)  |
| `BASE_SWEEP`      | **`4 19`**      | `+0`      | **`4 19`**, wall clock **136 s**                  |
| `PREV_E2E` titles | **87** (12-01)  | `+0`      | **87** (`grep -c "test(" e2e/*.e2e.ts`, summed)   |
| `PREV_E2E` runs   | **106** (12-01) | `+0`      | **106 passed**                                    |
| `BASE_CHECK`      | **582**         | **`-3`**  | **579 files, 0 ERRORS 0 WARNINGS** (reported)     |
| catalog           | **29** (9 + 20) | **`-3`**  | **26** (9 + 17)                                   |
| `static/og`       | **29** / 172,699 B | **`-3`** | **26** / **155,278 B**                          |

`check-counts.mjs 84 874` and `check-counts.mjs 4 19` both report _"matches the
expected counts"_, exit 0; `check-counts.mjs --playwright 106` likewise.

### What `check-counts.mjs` did with a negative term, since it had never seen one

**Nothing different, and that is the finding.** The script's whole comparison is
`if (files !== expectedFiles)` and `if (tests !== expectedTests)` — two plain
equalities. It has no notion of direction, no sign, and no separate message for
a fall; a disagreement in either direction produces the same
`"tests: observed N, expected M"` line and exit 1. The only thing a negative
term changes is which side of that sentence is the larger number. **So the
guard against a silently shrinking suite is not this script — it is the plan's
declared term.** A wave that deleted three tests and wrote `877` would be red;
a wave that deleted three tests and wrote `874` without noticing it had deleted
them would be green. That is worth writing down, because the phase has now spent
its first negative term and will spend more.

### The suites, as run

| Command                               | Result                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| `npm run check`                       | **579** files, 0 errors, 0 warnings (582 − 3)             |
| `npm run lint`                        | clean (prettier + eslint), exit 0                         |
| `npm run test:quick` (1)              | 84 files / 874 passed / 1 todo                            |
| `npm run test:sweep`                  | 4 files / 19 passed, **136 s** wall                       |
| `npm run build`                       | clean; `gen-og.mjs` wrote **26** images; `postbuild` archived `source-f33c125….tar.gz`, 1665 KB |
| `npm run test:quick` (2, after build) | 84 files / 874 passed / 1 todo                            |
| `npx playwright test --workers 3`     | **106 passed**, 2.5 m                                      |

`test-results/` removed by hand before and after, and nothing was committed
while a suite was running.

---

## The catalog, as a chain term

**`BASE_CATALOG - 3`**, split **9 + 17**. `build/c/` holds 26 prerendered
directories, `static/og/` 26 images, `frames.json` 26 keys, `FRONT_DOOR` 8 and
`EXCLUDED_FROM_ROW` 18 — and 8 + 18 = 26, which is the partition
`front-door.spec.ts` asserts.

**`FRONT_DOOR` IS UNMOVED AT 8.** None of the three removed entries was ever in
the ring; all three sat in `EXCLUDED_FROM_ROW`. "Touched the front door" and
"shrank the ring" are different sentences and only the first is true here.

---

## Every file edited, with each line number as found

Line numbers are the plan's, checked against the tree before editing. **Every
row of the plan's blast-radius table was found exactly where the plan said**,
with two exceptions noted below — which is a materially better table than
11-01's.

| File | Plan | As found | What moved |
| --- | --- | --- | --- |
| `entries/lattice.ts`, `entries/forge.ts`, `entries/shuttle.ts` | delete | 245 / 361 / 460 lines | deleted |
| `catalog/index.ts` | `:15 :17 :24 :56 :64 :66 :78 :86 :88` | **all nine exact** | 3 imports, 3 CATALOG members, 3 re-exports |
| `catalog/front-door.ts` | `:82 :114 :122` | **exact** | three `EXCLUDED_FROM_ROW` blocks |
| `catalog/listing.ts` | `:284-293`, `:379-388`, `:403-412`, prose `:469` | blocks at **`:283`, `:378`, `:402`** (the plan's line is the `id:` line, one inside the `{`); prose **`:469` exact** | three blocks; the WHEELS comment that called FORGE "the shipped precedent" |
| `catalog/frames.json` | keys | `lattice :421`, `shuttle :677`, `forge :741` | **regenerated** through `UPDATE_FRAMES=1` at 26 keys |
| `share/fixtures/wild-stamps.json` | 2 records each, 6 of 36 | `:108 :121 :300 :313 :348 :360` | six records out, `"entries": 18 -> 15` |
| `share/stamp.spec.ts` | `:465-466` `toBe(18)` ×2 | **exact** | → 15 twice, **plus `:482` `toBe(16)` → 13 — see below** |
| `sim/lua-smoke.spec.ts` | `:833-923` `:948` helpers, `:1750` `:1874` `:4044` tests | **all five exact** | −3 tests, −143 lines of helper, header 25 → 22 |
| `catalog/touch-guard.spec.ts` | `:41` `:63` comments, row `:136`, `:519` `toBe(2)` | **all four exact** | row out, count → 1, **plus `:516-518` `toContain("forge")`** |
| `catalog/decay-idiom.spec.ts` | `:124` | **exact** | SHUTTLE out of the keeper list |
| `catalog/host-surface.spec.ts` | `:76` | **exact** | LATTICE out; `pairs` stays for SONAR |
| `tune/colour-picker.spec.ts` | `:583` the four-entry list | **exact** | **a TYPED list, not a derived one** — see below |
| `catalog/audition.spec.ts` | `:52` `ROW_COUNT 25` | **exact** | → 22, plus the title, the `1 to 25` message and the `row 11` message |
| `browse/sort.spec.ts` | `:81` `RECORDED` | **exact** | featured 11 → 10, entries 27 → 26 |
| `browse/filter.spec.ts` | `:176-190` `RECORDED` | **`:176`** | entries 29 → 26, tags 14 → 13, seven counts re-observed |
| `browse/facets.ts` | `:315` `harmonic: "keys"` | **exact** | re-targeted to `play` |
| `browse/facets.spec.ts` | `:63 :65` and the five `55` sites | `:63 :65` exact; the five at `:262 :263 :264-267 :285 :302`; the member walk at **`:287-295`**, not the plan's `:286-294` | **three** literals moved, not two |
| `og/build.spec.ts` | `:227` `>= 27` | **exact** | → 26, kept a literal for the reason its own comment gives |
| `e2e/artifacts.e2e.ts` | `:124` `>= 27` | **exact** | → 26, same reason |
| `docs/HARDWARE-AUDITION.md` | rows, renumber 1..22 | Setup-only six at **`:161`** exact | three cost rows, three checklist rows, renumbered, five prose lists re-cut |
| `.planning/REQUIREMENTS.md` | CAT-01 | `:184` | three dead links plus the `?for=keys` cost |
| `catalog/lua-entries.sweep.spec.ts` | header prose | `:40-42` | colour-knob census recounted |

### The two line numbers that had moved, and why

1. **`listing.ts`'s LUMEN block is at `:351`, not the plan's `:362`** — eleven
   lower, because LATTICE's block was removed from above it in the same task.
   Matched by content.
2. **`facets.spec.ts`'s value-is-a-facet-member walk is at `:287-295`, not
   `:286-294`.** One line low, and the plan's range would have pointed a reader
   at the closing brace of the loop above.

---

## The three tests `lua-smoke.spec.ts` lost, and the proof no shared helper went

| Test | Line | Helpers taken with it |
| --- | --- | --- |
| _"reaches every one of FORGE's twenty-seven macros, at both ends"_ | `:1750` | `FORGE_GKS_ARITY` `:841`, `FORGE_KEY_ARG` `:842`, `NO_SEND` `:845`, `sweepForge` `:854-946` |
| _"reaches both ends of LATTICE's range across the whole travel"_ | `:1874` | `sweepLattice` `:949-974` |
| _"runs SHUTTLE faster the further out you push, and stops it on the red row"_ | `:4044` | none — the title is self-contained and reaches the entry through `entryById` |

**The proof, three ways.** (a) `grep -n` for all five removed identifiers over
the whole file returns nothing, so nothing left behind references them.
(b) `sweepConsoleBody`, `coordinatesIn` and `sweepConsoleColumn` sit in the same
block and were **kept**, and `grep -n` finds them still used at `:815`, `:816`,
`:840`, `:1425`, `:1488`, `:1526` and `:1682`. (c) The file runs green at
**22 titles** (`grep -c "^  it("`), which is `25 - 3`, and the whole quick suite
lands on `874 = 877 - 3` — so exactly three tests went and no fourth was taken
by a broken import.

The file's own header count is corrected from **TWENTY-FIVE to TWENTY-TWO**,
with the sentence 11-16 wrote about it kept and a new one added: this is the
first wave that ever subtracted here, and what it cost is exactly what a
per-entry title costs when the entry goes.

---

## The FOR histogram, before and after, and the FEELS census

Both recounted from `LISTING`, never subtracted from the plan's table.

| Term | At 29 | After the removals (26) | After re-homing (26) |
| --- | --- | --- | --- |
| FOR `modulation` | 8 | **7** (− shuttle) | **7** |
| FOR `show` | 5 | 5 | **5** |
| FOR `sequencing` | 4 | 4 | **4** |
| FOR `mixing` | 3 | 3 | **3** |
| FOR `play` | 2 | 2 | **3** (+ chorus) |
| FOR `shortcuts` | 3 | **2** (− forge) | **2** |
| FOR `pointing` | 2 | 2 | **2** |
| FOR `keys` | 2 (chorus, lattice) | **1** — the singleton | **RETIRED** |
| **FOR total** | **29** | 26 | **26**, seven terms |
| FEELS `generative` | 13 | **12** (− shuttle) | **12** |
| FEELS `expressive` | 12 | **11** (− shuttle) | **10** (− lumen) |
| FEELS `readable` | 11 | **9** (− lattice, − forge) | **9** |
| FEELS `playable` | 9 | **8** (− lattice) | **8** |
| FEELS `precise` | **7** | **7** | **7** |
| FEELS `still` | 6 | **5** (− forge) — the floor broken | **6** (+ lumen) |
| **FEELS total** | **58** | 52 | **52**, six terms |

**Thirteen terms, every one at two or more, FOR summing to 26 and FEELS to 52.**
Zero singletons.

**`precise` is at 7, and it is worth stating because `facets.ts:15` said 6.**
The header has claimed since 11-01 that _"`precise` and `still` land at EXACTLY 6"_;
plan 11-15 added WHEELS carrying `precise` and took it to 7 without touching
that line, because nothing gates a sentence. `precise` was never in danger from
this plan and is not now: it has one to spare. The corrected header says so and
names the drift.

`facets.spec.ts:63` `toHaveLength(8)` → **7** and `:65` `toHaveLength(14)` →
**13**, as the plan asks — **and a third literal the plan does not name**:
`:69`'s `expect(new Set(ALL_TERMS).size, ...).toBe(14)` → **13**, the same
number written a second time three lines down. Two would have left the file red.

### The FOR row was re-sorted, and it had been wrong for two waves

`FOR_TERMS`' doc comment declares the array is _"descending by how many entries
carry them"_. It was `modulation, show, mixing, sequencing, …` while
`sequencing` was 4 and `mixing` 3 — plans 11-14 and 11-15 each added an entry
and neither re-sorted. Recounted and re-sorted here to **modulation 7, show 5,
sequencing 4, mixing 3, play 3, shortcuts 2, pointing 2**, ties keeping the
order they had. Nothing asserts the order, which is why it drifted; the comment
now says that too.

---

## LUMEN on `still`: **TAKEN**, and why it is not a stretch

The plan attaches a specific doubt and a guard — _"if it reads as a stretch to
whoever executes this, stop and say so before editing"_ — and names CONSOLE,
STRIP, CULL and QUADRANT as the alternatives. **The guard was considered and
not invoked.** Three reasons, in the order they settle it:

1. **The axis is declared and LUMEN is on the right side of it.** `facets.ts:106-108`
   says `still` and `generative` are opposites on the **motion** axis — _"show me
   the ones that move by themselves"_. `docs/HARDWARE-AUDITION.md:161` lists
   LUMEN among the six cards with **no Timer at all**. Nothing about it moves
   untouched. That is the question the axis asks, and it answers yes without
   qualification.
2. **The doubt applies to every carrier of the term, so it is not a doubt about
   LUMEN.** The five survivors are JOYSTICK (a joystick), FADERS, TPAD (an XY
   pad), MORPH (four macros you slide between) and STRIP (a crossfader). Four of
   the five exist to move under a hand. The card that just left the term, FORGE,
   changed under a held corner and its own quiet line said so. `still` has never
   meant inert in this vocabulary; it means _it does not run on its own_. LUMEN's
   cursor cell is the same kind of motion as STRIP's fader, and 12-11 making the
   cursor more visible does not change which side of the axis the card is on.
3. **The word is already in the entry's own copy.** `listing.ts`'s LUMEN `quiet`
   line reads _"The whole field stays lit and **still**, so you read the colour
   instead of watching it."_ The tag was not chosen to close the arithmetic; it
   was chosen because the card's own sentence had already chosen it. That is
   CONT-03 exactly — the tag describes how the card feels — and it is the
   strongest form of the test, because the sentence was written before the term
   was needed.

`expressive` is what LUMEN gave up, and it can afford to: it lands at 10, four
above the floor. **No second card was re-homed and the floor was not touched.**
The alternatives are recorded above so that a future reader can see they were
weighed rather than unseen.

The reasoning is written into `FEELS_TERMS`' doc comment in `facets.ts` rather
than left in this document, because the next person to ask _"why is a colour
picker `still`?"_ will be reading that file.

---

## `harmonic`, re-targeted — and the plan's expected carrier is not the recorded one

**`harmonic: "keys"` → `harmonic: "play"`.**

**The derivation, followed rather than taken from the plan.** `10-06-SUMMARY.md:280`
is the clause-2 table and it records the fold `harmonic`→`keys`, but it does
**not** name the carriers. The carriers survive one line further back:
**`09-04-SUMMARY.md:597`** — _"Two tags crossed the two-carrier threshold —
`harmonic` (CHORUS plus KEYS) and `rippling` (Radar plus GRIDLOCK)"_. So
`harmonic`'s two carriers were **CHORUS and the entry called KEYS**.

**The plan expects LATTICE and names this plan as the deleter; both are wrong,
and the destination is right anyway.** The plan's interfaces block says
_"`harmonic` had two carriers when it shipped; one of them, LATTICE, was deleted
by this plan rather than re-homed"_. The record says the second carrier was the
**entry** KEYS, and `11-01-SUMMARY.md:232` lists `keys` among the nine ids that
plan deleted. LATTICE carried the **term** `keys` after the 10-06 re-cut, which
is presumably where the confusion came from — but it is a different thing with
the same spelling. Either way CHORUS is the only surviving carrier and task 01
had just sent CHORUS to `play`, so clause 2 is satisfied by `play`: every
surviving carrier carries it.

**The fact written into the comment is therefore a different fact from the one
the plan drafted**, and it is the one a future reader cannot recover: the row
has been folded **twice**, at two different re-cuts, and the two things sharing
the word `keys` are unrelated — a deleted **entry** named KEYS and a retired
**term** named `keys`. Somebody counting carriers in today's listing finds one
and would read this as a singleton fold. It is not.

**The clause counts do not move, asserted rather than assumed.** Counted from
the shipped table: **55 rows, 22 mapped, 33 explicit `undefined`, clause 1 = 8
identities, clause 2 = 14 folds.** 8 + 14 + 26 + 7 = 55, exactly as before.
`harmonic` was a clause-2 fold before the re-target and is one after it.

---

## `RETIRED_VOCABULARY` did not grow, and the five `55` sites are unmoved

**Checked before editing, three ways, exactly as the plan's revision instructs.**
`RETIRED_VOCABULARY` holds `harmonic` and `hotkeys`; it does **not** hold `keys`,
which was minted at the 10-06 re-cut as `harmonic`'s destination and was
therefore never a shipped `?tag=`. `facets.ts:174-178` forbids the list growing.
`query.ts:185` reads the table only under `key === "tag"`.

**Proved after editing, by diff.** `git diff 378360a~1 -- src/lib/browse/facets.ts`
touches exactly five array lines and all five are `FOR_TERMS` being re-sorted;
the `RETIRED_VOCABULARY` block is **byte-identical**, 815 characters, confirmed
by extracting it from both revisions and comparing.

**The five sites, named as checked and unmoved:**

| Site | What it asserts | Status |
| --- | --- | --- |
| `facets.spec.ts:262` | `toHaveLength(55)` | **unmoved**, green |
| `facets.spec.ts:263` | `new Set(...).size` `toBe(55)` | **unmoved**, green |
| `facets.spec.ts:264-267` | the sorted-order equality | **unmoved**, green |
| `facets.spec.ts:285` | `keys.length` `toBe(55)` — the table covers the vocabulary exactly | **unmoved**, green |
| `facets.spec.ts:302` | `mapped` `toBeLessThan(55)` | **unmoved**, green |

`git diff HEAD~1 -- src/lib/browse/facets.spec.ts | grep "55"` returns **nothing**.
A plan that moved a literal it did not need to move would be as much a defect as
one that missed a literal it did, and this one moved none of the five.

---

## The `?for=keys` link, stated rather than assumed

`keys` shipped as a chip after 10-06, so `?for=keys` addresses exist. After the
retirement `vocabulary.for` no longer includes it, and `query.ts:182` reads
`if (key === "for" && vocabulary.for.includes(value)) activate(value)` with no
`else` reaching the stray list — **so the value is dropped silently under W-12
unamended and the visitor lands on the full catalog.** Not a 404, not an apology,
and **not the search field**, because the search fallback at `:192`
(`strays.join(" ")`) is fed only from the `tag` branch at `:185-188`.

**This is the shipped behaviour and this plan does not change it. It records
it**, in `.planning/REQUIREMENTS.md` under CAT-01, beside the three dead
`/c/<id>/` addresses — because that is the file that decides what a decided cost
is. It differs from `drums` (11-01) only in that `drums` was one of the
fifty-five retired **shipped tags** and `keys` never was, so no `LEGACY_TAG_MAP`
row could have migrated it even if the table were allowed to grow.

**No `?for=` migration was smuggled into `LEGACY_TAG_MAP`.** That would be a
`query.ts` change and a new mechanism, and the plan says to stop and say so
rather than use the wrong table. Said, here.

---

## The three dead `/c/<id>/` addresses

`/c/lattice/`, `/c/forge/` and `/c/shuttle/` now fall through to `404.html`,
beside the nine plan 11-01 removed — **twelve shared links in all**. Recorded in
`REQUIREMENTS.md` CAT-01 with the same costed reversal `deferred-items.md`
already carries (a prerendered stub per removed id, or one redirect rule at the
Worker, the second possible only because the site is on Cloudflare Workers).
Twelve stubs is the same edit as nine. Decided, not discovered at deploy.

---

## The negative checks — three states, three reds, every term named

| # | State | Where it fired | Message | Exit |
| --- | --- | --- | --- | --- |
| A | CHORUS left on `keys` with the three entries removed | `facets.spec.ts` health rules | **`FOR "keys" lands on 1 entries; a term matching one card is a thing search does better.`** followed by the whole histogram | 1 |
| B | LUMEN left on `expressive` | `facets.spec.ts:225` | **`FEELS "still" lands on 5 entries; below six it is not a filter.`** with the histogram reading `still 5` | 1 |
| C | `harmonic: "keys"` left in place after `keys` was retired | `facets.spec.ts:309` | **`"harmonic" maps to "keys", which no facet declares: expected undefined not to be undefined`** | 1 |

**A arrived without a plant.** It is the state of the tree at the end of task 01
and it was observed in the full `test:quick` run there — which is also why the
plan's task 01 cannot be green (see the deviations). **B and C were each planted
as a single replacement whose count was asserted before the write**, run, and
restored from a scratch copy compared by `sha256sum` either side — never
`git checkout`, `git restore`, `git stash` or `git clean`. Checksums identical
in all three files:

```
facets.ts   a1bd37cc2b1af7b5b2cae42cd2fbae4f95a36f454b7e85b2fde0c35ddaa07d45
listing.ts  c7a6b7110801a12909c6a7fcec573e4292568c634d019bc49a29158cd9c41ad9
lumen.ts    60f7bc0ae907fec2a81d8bdd7157ea444f6f9093418259ba07d2d71d85e47423
```

### And check A did not fire where the plan says it would

The plan calls the zero-singleton assertion _"the zero-singleton assertion red
**naming `keys`**"_. **It is not the assertion that fired, and it cannot be.**
`facets.spec.ts` runs the FOR floor (`count >= 2`, now `:216`) and the FEELS
floor (`count >= 6`, now `:225`) **before** the singleton line (now `:246`) in
the same test, and a singleton violates a floor by definition — so a FOR
singleton always trips `:216` and a FEELS singleton always trips `:225`. The
singleton assertion is unreachable as a first red. It **restates** the rule
rather than guarding it, and it still earns its place as documentation of what
D-10 was raised about — but the plan's sentence describes an assertion that
never runs.

---

## Deviations from the plan

### 1. [Rule 3 — Blocking] The plan's task 01 cannot be green, and its own task 02 depends on that

The plan's task 01 `<verify>` reads
`npm run test:quick 2>&1 | node scripts/check-counts.mjs 84 874`. **It cannot
pass.** Removing the three entries takes `keys` to one carrier and `still` to
five, so `facets.spec.ts` and `filter.spec.ts` are red until the vocabulary is
re-cut — which is task 02. The plan's own task 02 then asks for exactly those
two reds as negative checks A and B, to be produced by *planting* them.

**Fix:** task 01 was executed and committed as specified, its two reds recorded
as negative checks A and B arriving without a plant, and the commit message says
in as many words that the tree is red at that commit and why. Task 02 makes it
green. The alternative — folding the facet re-cut into task 01 — would have
collapsed the plan's two tasks into one and thrown away the free negative
checks. **The plan's task 01 list of "expect green" files is accurate: it names
`front-door.spec`, `listing.spec`, `frames.spec`, `stamp.spec`, `catalog.spec`,
`audition.spec`, `touch-guard.spec` and `lua-smoke.spec`, and every one of those
was green. It is the `check-counts` line above them that cannot be.**

### 2. [Rule 1 — Bug] `stamp-roundtrip.sweep.spec.ts` asserts the colour-knob count and is in no table

`expect(exempted, "the colour knobs, exempt by format").toBe(33)` went red on
the sweep run: `expected 27 to be 33`. The file is **not** in this plan's
`files_modified` and **not** in its blast-radius table, and its own comment
records that it was not in 11-01's, 11-15's or 11-14's either — **this is the
fourth wave in a row to find that literal by running the sweep.** Moved to 27,
with the arithmetic: LATTICE (six knobs, one colour), SHUTTLE (six, two) and
FORGE (five, three) leave, so the hand-authored knob total goes 102 → 85,
`exempted` 33 → 27 and `guarded` 69 → 58, reconciling at 58 + 27 = 85. The
`guarded > 50` floor is **not** re-chosen — it has eight to spare, which is the
whole point of its being a floor. **Commit:** `f33c125`.

### 3. [Rule 1 — Bug] `stamp.spec.ts` has a third literal, and the plan's table missed it exactly as 11-01's did

Beside the two `toBe(18)` at `:465-466`, `:482` asserts `moved` `toBe(16)` — how
many captured entries now emit a different format. All three removed entries
declared a colour knob and all three emitted `w`, so it falls by three to **13**;
CULL and QUADRANT remain the two that still emit `x`. The comment beside it
already said 11-01's plan _"named the two literals above and missed this third
one"_. **This plan's table does the same thing**, and the comment now says that
too. **Commit:** `378360a`.

### 4. [Rule 2 — Missing critical functionality] Four prose figures were already false before this plan, and are corrected with their drift named

None was caused by this plan; all four are statements about the vocabulary or
the catalog that nothing asserts, so all four drifted silently. Correcting them
while the neighbouring code is being edited is cheaper than a deferred item, and
naming the drift is what stops the next reader trusting the next one.

- **`facets.ts:15`** claimed `precise` and `still` sit at exactly 6. `precise`
  has been 7 since 11-15's WHEELS.
- **`FOR_TERMS`' declared descending order** was wrong by one pair since 11-14
  took `sequencing` to 4.
- **`lua-entries.sweep.spec.ts:40-42`** claimed _"29 colour knobs across 16 of 18
  entries"_ and a knob total of 91 — two waves out of date. **Counted rather than
  subtracted**, as the plan instructs: **27 colour knobs across 15 of 17 entries,
  85 knobs in all** — and the count is confirmed independently by
  `stamp-roundtrip.sweep.spec.ts`'s `exempted` landing on the same 27.
- **Nineteen files said the closed vocabulary is "sixteen" or "fourteen".** It is
  thirteen. Corrected wherever the sentence is in the **present tense**; left
  wherever it is historical (_"under the closed sixteen"_, _"clause 2 — fourteen
  folds"_), because those are true of the vocabulary they name.

**Commits:** `378360a`, `f33c125`.

### 5. [Rule 1 — Bug] The union sample in `facets.spec.ts` named a dead word and would have gone on passing

The OR test used `for: ["play", "keys"]`. With `keys` retired it is not a
compile error and not a red: a word nothing carries contributes nothing to
either side of the comparison, so the test would have asked the OR question of a
**single** chip and looked green doing it. Re-chosen to `play` / `shortcuts` —
the two terms 11-01's re-homings created — so the pair still asks the union
question of cards that were moved. **Commit:** `f33c125`.

### 6. [Rule 2] `touch-guard.spec.ts:516-518` and the exception table's own doc comment

The plan names the `forge` row and `:519`'s `toBe(2)`. It does not name
`:516-518`'s `expect(roll, …).toContain("forge")`, which would go red on a
table that no longer contains the word, nor the doc comment at `:105` that says
_"in both rows below"_. Both moved with the row; the doc comment gains a
paragraph saying the table shrank by a **deletion** rather than by a fix, which
is the first time it has. **Commit:** `378360a`.

### 7. [Rule 2] `colour-picker.spec.ts:583` is a TYPED list, not a derived one

The plan asks which. It is typed: `expect(three.sort(), …).toEqual(["console", "forge", "strip", "wheels"])`,
where `three` is accumulated from `colourKnobsOf` over `CATALOG`. So the list had
to be **re-chosen**, not merely allowed to shrink — and the split beside it moved
in three of its four buckets, which is a first: LATTICE has one colour knob,
SHUTTLE two and FORGE three, so `none` 13 → 12, `two` 7 → 6, `three` 4 → 3 and
`noPicker` unmoved at 5. FORGE leaving takes one of the four worst cases the
six-canvas colour-rail budget is measured against out of the catalog.
**Commit:** `378360a`.

---

## Files touched that `files_modified` does not name

**Eighteen**, and every one is listed here because 11-01's own table missed
seven and said so.

| File | Why it had to move | Caused by this plan? |
| --- | --- | --- |
| `src/lib/share/stamp-roundtrip.sweep.spec.ts` | `exempted` `toBe(33)` — a hard red on the sweep | **yes** |
| `src/lib/catalog/entries/wheels.ts` | called FORGE _"the shipped precedent"_ in the present tense, and pointed twice at `shuttle.ts` as documentation — a path this plan deleted | **yes** |
| `src/lib/catalog/entries/strip.ts` | _"SHUTTLE's `arc` and `rest` … carry the identical note"_, present tense about a deleted entry | **yes** |
| `src/lib/ui/tune-ui.spec.ts` | named `forge` as one of _"the three entries the rule exists for"_ | **yes** |
| `src/lib/ui/FacetRow.svelte` | used `keys` as its worked example of a four-character chip; also said "sixteen words" and "sixteen sentences" | **yes** (the `keys` example) |
| `src/lib/ui/browse-ui.spec.ts` | _"a facet row's members read `keys`, `play` and `still`"_ | **yes** |
| `src/lib/browse/query.ts` | _"`vocabulary` is the closed sixteen"_, present tense | no — stale since 11-01 |
| `src/lib/browse/query.spec.ts` | _"They are **now** drawn from the closed sixteen"_ | no — stale since 11-01 |
| `src/lib/catalog/entries/ported.ts` | the same sentence, twice | no — stale since 11-01 |
| `src/lib/catalog/entries/` × 17 (`arc`, `chorus`, `console`, `cull`, `euclid`, `ghost`, `lumen`, `morph`, `pomodoro`, `quadrant`, `radar-points`, `snake`, `sonar`, `stage`, `steps`, `strip`, `wheels`) | the `// D-10: … drawn from the closed sixteen` header line, one per file (`radar-points` and `wheels` said "fourteen") | no — stale since 11-01 |

`chorus.ts` and `lumen.ts` are in `files_modified` for their tags; they are
listed above only for the D-10 line they also carry.

### And the files that were READ and deliberately LEFT

- **`docs/TESTING.md:1130`** still says `DECLARED_EXCEPTIONS` holds _"`stage.ts`
  and `forge.ts`"_, and `:1330-1333` and `:1372` name FORGE, LATTICE and SHUTTLE
  in the corner sweep. **Left for 12-12**, which rewrites every count in that
  file — the same call 12-03 made and recorded. Named here so it is not lost.
- **`.planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md`** quotes a tag row,
  and `filter.spec.ts`'s comment says 10-06 _"amended that document by name"_.
  Read: the document already declares its own table _"deliberately left at
  sixteen"_ and points at `filter.spec.ts`'s `RECORDED` as **the live census**,
  so it has already delegated. The amendment named in `filter.spec.ts`'s comment
  is the whole obligation and the row is not restated there.
- **`src/lib/ui/ColourPicker.svelte:473`** and **`tune-ui.spec.ts:713`** say
  _"the fourteen entries with ONE colour knob"_ and _"the seventeen with two or
  three"_. Both were already wrong before this plan (they sum to 31 against a
  catalog of 29) and neither is asserted. Today's figures are **12** and **9**.
  Out of scope per the plan's scope boundary; recorded here rather than fixed.
- **`lua-smoke.spec.ts:541`, `:671`, `:1022`, `:1212`, `:1666`** and
  **`entries/arc.ts:68`, `:198`, `entries/pomodoro.ts:202`,
  `entries/stage.ts:257`** name removed entries in explicitly historical
  sentences — what a past plan measured or corrected. All true; all left.
- **`.planning/ROADMAP.md`** — `git diff --quiet` clean. Not touched.
- **`src/vendor/`** — `git diff --stat HEAD -- src/vendor/` empty.
  `firmware-oracle.spec.ts` byte-unchanged and green.

---

## `docs/HARDWARE-AUDITION.md`, re-cut

Three cost rows out (`lattice` 623 / 171, `shuttle` 540 / 538, `forge` 716 / 373
— **all three accurate at the 11-16 gate when they went**, so the table lost
three correct rows rather than three stale ones, and the document now says so).
Three checklist rows out (8 LATTICE, 18 SHUTTLE, 20 FORGE) and the shared row 7
`CHORUS / LATTICE` keeps its surviving name. **Renumbered 1..22 contiguously**,
which `audition.spec.ts:207-211` asserts.

The renumbering moves three cross-references and all three were followed:
MIRROR 11 → **10**, CONSOLE 14 → **13**, STAGE 17 → **16**, POMODORO 23 → **20**.
`audition.spec.ts`'s MIRROR message moves with it.

The "five rows where a green test is not evidence" become **three**: the
latch-and-time family loses FORGE (the second of its two latches) and the
keystroke family loses SHUTTLE, leaving STAGE alone in it. The keystroke count
falls from four configurations to **two** (STAGE and CULL). Every prose count in
the document moves: twenty → seventeen configurations, twenty-five → twenty-two
rows and lines, twenty Setup files and fourteen Timer files → **seventeen and
eleven**.

---

## Count disagreements, reported and NOT reconciled

1. **`STATE.md`'s frontmatter `total_plans` and `completed_plans` are
   contaminated by a concurrent Phase 13 session**, which is committing
   `13-*` files while this plan runs — three of its commits landed between this
   plan's two. The tools recompute totals from disk. **Reported, not reconciled**;
   not one of those files was read or touched, and every commit here used
   `git commit --only <paths>`.
2. **`STATE.md`'s frontmatter `percent` still reads 100** and has since Phase 10.
   Left alone, as instructed.
3. **`STATE.md`'s "Current focus" still reads _Phase 11 — bench corrections_.**
   Pre-existing; not this plan's to move.
4. **`lua-entries.sweep.spec.ts`'s amendment note says test 6 goes to
   "1,728 combinations (3,456 measurements)"**; the run reports **1,103
   combinations, 2,206 measurements**. That note is 10-08's, written against a
   36-entry catalog, and the file's own rule is that its numbers are derived at
   run time. Reported, not reconciled.
5. **The Lua-route round-trip total is 152,992 vectors**, against 11-16's
   187,056 — three entries' worth smaller. The **compiler route is 45,358,
   unchanged**, as it must be: the nine presets were not touched. Format `w`
   42,001 and format `x` 382, the latter unchanged because CULL and QUADRANT are
   still the two entries with no colour knob.

---

## Things the plan asserts that the tree does not support

1. **`harmonic`'s second carrier was not LATTICE.** `09-04-SUMMARY.md:597`
   records CHORUS and the **entry** called KEYS, which plan 11-01 deleted. The
   destination `play` is unaffected; the fact in the comment is not.
2. **The zero-singleton assertion is not what catches a singleton.** Two floors
   above it fire first, by construction. Negative check A named `keys` through
   the FOR floor, not through the line the plan points at.
3. **Task 01's `check-counts` line cannot pass**, and task 02's first two
   negative checks are the reason.
4. **`facets.spec.ts` moves three literals, not two.** `:69`'s `toBe(14)` is the
   same number as `:65`'s, written again three lines down.
5. **`stamp.spec.ts` has three literals, not two** — `:482`'s `toBe(16)`.
6. **`stamp-roundtrip.sweep.spec.ts` is a hard red and is in no table**, for the
   fourth consecutive wave.
7. **The plan's `facets.spec.ts:286-294` is `:287-295`**, and
   **`listing.ts`'s LUMEN block is `:351`, not `:362`** after task 01.

---

## What was NOT done, and why

- **`gsd-tools roadmap update-plan-progress` was SKIPPED**, on instruction.
  `.planning/ROADMAP.md` is byte-unchanged.
- **`gsd-tools requirements mark-complete` was SKIPPED, and it is a judgement.**
  The plan's frontmatter names `[CAT-01, CAT-03, CAT-04, CONT-02, CONT-03,
  SHARE-03]`. Five of the six are already `[x]` and re-ticking them would say
  nothing; CAT-01 instead gains a dated Phase 12 qualifier recording what is
  proved and what is decided. **CAT-04 stays `[ ]` for the sixth time** — its
  subject is the shape of the catalog data file, and nothing here touched it.
- **CONT-02's and CONT-03's traceability rows were read and left.** CONT-02's
  floor is six hand-authored configurations and the catalog holds seventeen;
  CONT-03's rule is satisfied by every one of the 26 entries and asserted in both
  directions. Their prose carries phase-gate counts that 12-12 rewrites.
- **`static/og/` is NOT tracked** (`git ls-files static/og` returns nothing), so
  the three deleted images cost no commit. They are rebuilt from empty by
  `gen-og.mjs` on every build: **26 images, 155,278 B**, against 11-16's
  172,699 B over 29.
- **No device was touched and nothing was deployed.** Nothing in this plan is
  hardware-verified; the three configurations were removed on the user's own
  bench report and the audition rows that would have tested them left with them.
- **No sibling repository was read or written.**

---

## Commits

| Commit | What |
| --- | --- |
| `378360a` | `feat(12-04): LATTICE, FORGE and SHUTTLE removed, and every assertion that counted them moved` — 23 files, +178 / −2024 |
| `f33c125` | `refactor(12-04): seven FOR terms, CHORUS and LUMEN re-homed, and harmonic re-targeted off a term that no longer exists` — 28 files, +202 / −88 |

---

## Self-Check: PASSED

Every file this document names as modified exists on disk and the three it names
as deleted are gone; both commit hashes resolve in `git log --oneline --all`.
