---
phase: 09-twenty-configurations
plan: 02
subsystem: catalog
tags: [browse-literals, RECORDED, copy-gate, CONT-03, tag-vocabulary, hid, PHASE_ADDED_AT]

# Dependency graph
requires:
  - ".planning/phases/09-twenty-configurations/09-01-SUMMARY.md - the seven-name block. BASE_FILES 73 and BASE_TESTS 776 frozen at the clean tree; PREV_FILES 73 and PREV_TESTS 775 as 09-01 left it, which is what this plan asserted against"
  - "09-CONTEXT.md D-01 (twenty entries), D-03, D-06 as amended (twenty lua entries, zero state) - the slate this plan builds gates for without authoring any of it"
  - "09-VALIDATION.md, the per-plan delta table row 09-02 (+1 file, +5 tests) and the negative-check table rows for this plan"
  - "src/lib/browse/filter.ts:121-125 - the standing chip row is DERIVED, count descending then name ascending; the nine names are today's data and are what RECORDED reviews"
  - "src/lib/browse/typographic.ts:53 - an ASCII apostrophe BETWEEN TWO LETTERS is curled at render time, which is why the copy gate exempts the vendored shelf sentences by source kind"
  - "src/lib/sim/lua-host.ts:771 - the hid accessor 09-01 added, and :429's note that gmms, gmbs and gks are recorded and inert"
provides:
  - "PHASE_ADDED_AT = 2026-09-07, the one arrival date every configuration of this phase carries"
  - "The rolling pair for 09-03: PREV_FILES 74, PREV_TESTS 780 (+ 1 todo)"
  - "src/lib/catalog/copy.spec.ts - the CONT-03 copy gate, 5 tests, a fixed count, with KNOWN_TAGS (41) and the COPY_CENSUS=1 table"
  - "One RECORDED block in filter.spec.ts (entries, tags, singletons, chips, chipCounts) and one in sort.spec.ts (entries, featured) - the only census literals left in the browse suites"
  - "sort.spec.ts's NEWEST asserted as date blocks, so a third addedAt is a structural pass; proved by running the third date in lockstep"
  - "lua-smoke.spec.ts test 2 asking for MIDI or HID, with the MIDI non-vacuity half landed and the HID half marked at its spot for 09-06"
affects:
  - "09-03 to 09-09 - every entry wave updates the two RECORDED blocks and KNOWN_TAGS deliberately, copies PHASE_ADDED_AT verbatim, and is held to the five copy rules below"
  - "09-03 - the first wave to move the chip row; it carries the instruction to update 05.1-UI-SPEC.md, The tag chips, in the same commit"
  - "09-06 - adds the HID non-vacuity assertion at the marked spot in lua-smoke.spec.ts, with STAGE and SHUTTLE"
  - "09-10's phase gate - BASE_FILES + 1 and BASE_TESTS + 4, the chain closed by this plan's +1 / +5"

tech-stack:
  added: []
  patterns:
    - "DERIVED, OR RECORDED, stated at the top of both browse specs: a number that is arithmetic over the shipped data is derived; a number that is a review of the shipped data stays a literal in one named block, so changing it is a decision somebody made rather than a test somebody silenced"
    - "A derived expectation is paired with a floor. Every derivation asserts the derived list is non-trivial (more than one carrier, a narrowing second term, a disabled set that is neither empty nor every chip), so a predicate that returned everything cannot pass"
    - "The predicate under test is RESTATED in the spec rather than imported, in three places now: filter.spec.ts's search, sort.spec.ts's byCodePoint, and 09-01's SELF_PRELUDE precedent. Agreeing with an independent statement is evidence; agreeing with the module is a tautology"
    - "An order is asserted as STRUCTURE, not as sizes. NEWEST says the dates run descending, each date's entries are contiguous, and inside a block the name tie-break decides - which is true at two dates, three dates or ten"
    - "A copy corpus is assembled BY SOURCE KIND and never by a name list. A preset entry's name and description are the vendored shelf's bytes and are excluded because of where they came from, so no id is ever written down as an exception"
    - "An assertion that cannot be true yet is not written. The HID half of the output gate is marked in a comment at the exact spot it belongs, naming the plan that lands it, because a scheduled failure is not a gate"

key-files:
  created:
    - "src/lib/catalog/copy.spec.ts"
    - ".planning/phases/09-twenty-configurations/09-02-SUMMARY.md"
  modified:
    - "src/lib/browse/filter.spec.ts"
    - "src/lib/browse/sort.spec.ts"
    - "src/lib/sim/lua-smoke.spec.ts"

decisions:
  - "PHASE_ADDED_AT is 2026-09-07, the date this plan ran. Every entry plan from 09-03 to 09-09 copies that string verbatim into every entry file and every LISTING row, and none of them uses its own run date"
  - "The NEWEST negative check was run in TWO halves, because as literally specified it fails for the wrong reason. Editing addedAt in listing.ts alone breaks the listing-agrees-with-the-catalog assertion, which sits ABOVE the structural one and short-circuits the test. Half one recorded that (and the catalog disagreement listing.spec.ts caught); half two edited listing.ts and entries/sonar.ts in lockstep and observed the NEWEST test pass at three dates, which is the point of the restructure"
  - "filter.spec.ts:168-171 carried a FOURTH hard-coded id list the plan's interfaces table did not enumerate - the drums-alone expectation in test 3. It is derived now, because a drums configuration in 09-03 would otherwise have reddened a test about power syntax"
  - "Every census number in PROSE moved too, not only the ones in assertions. Both file headers said sixteen or forty-one, and sort.spec.ts's FEATURED comment justified the name tie-break with only two distinct dates exist. A stale sentence in a comment is the thing that teaches the next reader the wrong number"
  - "lua-smoke.spec.ts test 2's title reads sends something rather than plays. The assertion under it now admits a keyboard, and a title that says plays would be false the moment 09-06 lands STAGE"
  - "The quiet lines are held WHOLE by the copy gate. Two of the four in the front-door row come from the vendored shelf and two are HANGAR's; all four satisfy every rule as authored, and the file says in those words that a future vendored line breaking a rule earns an exemption recorded in source-kind terms rather than an edit to vendored bytes"

requirements-completed: []
requirements-contributed: [CONT-02, CONT-03]

# Metrics
duration: 42min
completed: 2026-09-07
---

# Phase 9 Plan 02: The Literals, the Copy Gate and the Output Gate — Summary

Adding a configuration now moves two recorded blocks and one tag array instead of nineteen literals
spread across two suites; every string a visitor reads is counted by a script that names the entry,
the field and the offending code point; and the execution gate asks whether a configuration sent
anything rather than whether it sent MIDI.

---

## The seven-name block

| Name | Value | Where it came from |
|---|---|---|
| `BASE_FILES` | **73** — **frozen** | 09-01, the clean tree Phase 7 closed at `34d0fd6`. Copied forward unchanged |
| `BASE_TESTS` | **776** (+ 1 todo) — **frozen** | 09-01. Copied forward unchanged |
| `PREV_FILES` | **74** | measured by this plan: ` Test Files  74 passed (74)` |
| `PREV_TESTS` | **780** (+ 1 todo) | measured by this plan: `      Tests  780 passed \| 1 todo (781)` |
| `BASE_SWEEP` | **`4 19`** | re-measured here, unchanged |
| `BASE_E2E` | **89** — **frozen** | 09-01. **Not re-measured by this plan**; the plan does not ask for an e2e run and this plan adds no e2e title |
| `PREV_E2E` | **89 (measured by 09-01)** | copied verbatim |

**The two arithmetics, said out loud so 09-10 can check the chain from either end.**

- Against 09-01's rolling pair, which is what a wave asserts: `PREV_FILES + 1` = **74** and
  `PREV_TESTS + 5` = **780**. That is what `check-counts.mjs 74 780` was run against, and it exited 0.
- Against the frozen pair, which is what the phase gate asserts: `BASE_FILES + 1` = **74** and
  `BASE_TESTS + 4` = **780**. Same two numbers. The chain is
  `BASE_TESTS 776 → −1 (09-01) → +5 (09-02) → +0 × 7 = BASE_TESTS + 4`.

`BASE_CHECK`: **547 files, 0 errors, 0 warnings** as this plan left the tree; it was 546 when 09-01
left it, and the one new file is `copy.spec.ts`. Provenance only — the count line is never asserted.

---

## PHASE_ADDED_AT

```
PHASE_ADDED_AT = 2026-09-07
```

**Every one of the twenty configurations in this phase carries this exact string.** Plans 09-03 to
09-09 copy it verbatim into every entry file and every `LISTING` row they write, and none of them
uses its own run date. The reason is the NEWEST sort: `addedAt` blocks the page into groups, and
seven waves running on seven days would be seven blocks of three, which reads as a machine's output
rather than as a catalog with a history. One date says the honest thing — twenty configurations
arrived together.

**The expected end state of the listing after the phase**, three blocks:

| `addedAt` | Entries | Which |
|---|---|---|
| `2026-09-07` | **20** | this phase |
| `2026-09-04` | 7 | Phase 8's hand-authored entries |
| `2026-09-02` | 9 | the ported shelf |

Task 9-02-01 restructured `sort.spec.ts` so three blocks is a **structural pass**, and that was
observed rather than assumed — see the second negative check below.

---

## The two RECORDED blocks, verbatim

A later wave updates these and nothing else. It never deletes an assertion against them.

### `src/lib/browse/filter.spec.ts:74-107`

```ts
/**
 * TODAY'S TAG CENSUS, RECORDED ON PURPOSE.
 *
 * Derived facts - a chip is a tag two or more entries carry, count descending
 * then name ascending (filter.ts:121-125) - are asserted as rules below and
 * need no maintenance. These four are a REVIEW: they say what the vocabulary
 * currently looks like, so a wave that adds configurations sees the row it
 * moved and decides whether it likes it. A wave updates this block; it never
 * deletes an assertion against it.
 *
 * Re-recorded by: 08-06 (sixteen entries), then every entry wave of phase 09.
 *
 * This block has a reader outside the repository's source: 05.1-UI-SPEC.md,
 * "The tag chips", quotes the row and its counts verbatim. A wave that moves
 * the row updates that document in the same commit - 09-03 is the first, and it
 * carries the instruction.
 */
const RECORDED = {
  entries: 16,
  tags: 41,
  singletons: 32,
  chips: [
    "playable",
    "generative",
    "gestural",
    "hypnotic",
    "ambient",
    "colour",
    "drums",
    "expressive",
    "readable",
  ] as const,
  chipCounts: [4, 3, 3, 3, 2, 2, 2, 2, 2] as const,
} as const;
```

### `src/lib/browse/sort.spec.ts:56-57`

```ts
/** Recorded on purpose; see filter.spec.ts's RECORDED. */
const RECORDED = { entries: 16, featured: 8 } as const;
```

**Every surviving bare sixteen, with its line number**, as the acceptance criterion requires. A
word-boundary grep over both files prints exactly two lines and both sit inside a `RECORDED` block:

```
src/lib/browse/filter.spec.ts:92:  entries: 16,
src/lib/browse/sort.spec.ts:57:const RECORDED = { entries: 16, featured: 8 } as const;
```

`NINE_CHIPS` is gone; its content and its header are inside `RECORDED`. `grep -c "const RECORDED"`
prints **1** in each file. `grep -n "slice(0, 8)\|slice(8)"` prints nothing.
`grep -c "seven newest before the nine older"` prints **0**. `grep -c "Four faders"` prints **0**.
`grep -q "byCodePoint"` and `grep -q "LISTING.filter((e) => e.featured).length"` both exit **0**.
`grep -c "  it("` prints **6** in each file.

---

## KNOWN_TAGS, verbatim

41 members, sorted, asserted in both directions by `copy.spec.ts` test 3: every tag in the catalog is
a member, **and** every member is carried by at least one entry, so a coined tag and a retired tag are
equally red. An entry wave that needs a new word adds it here on purpose.

```ts
const KNOWN_TAGS = [
  "ambient",
  "automation",
  "blend",
  "blooming",
  "calm",
  "chords",
  "colour",
  "desktop",
  "drums",
  "endless",
  "expressive",
  "flowing",
  "generative",
  "gestural",
  "grid",
  "hands-free",
  "harmonic",
  "hypnotic",
  "instrument",
  "isomorphic",
  "looper",
  "macros",
  "mixing",
  "modulation",
  "multi-touch",
  "pitch-bend",
  "playable",
  "pointer",
  "polar",
  "polyrhythm",
  "precise",
  "radial",
  "rails",
  "readable",
  "rippling",
  "rotating",
  "sequencer",
  "sprung",
  "still",
  "utility",
  "xy-control",
] as const;
```

`KNOWN_TAGS.length` is **41** and the array is sorted (checked mechanically, both reported by a
one-off `node -e` read of the file).

---

## The COPY_CENSUS=1 table, verbatim

`COPY_CENSUS=1 npx vitest run --project server src/lib/catalog/copy.spec.ts --reporter=verbose`
(the default reporter suppresses stdout from a passing test; `--reporter=verbose` is what prints it):

```
entries                    16
hand-authored entries      7
strings in the corpus      54
distinct strings           42
characters                 1892
longest description        euclid at 109 of 110
’ (U+2019) occurrences   2
— (U+2014) occurrences   0
distinct tags              41
standing chips             9
singletons                 32
```

Two of those are worth a sentence. **`euclid` sits at 109 of the 110-character cap** — the twenty new
descriptions have less headroom than the cap suggests, and the failure message in test 1 names the
longest description whether or not anything failed, precisely so a near-miss is visible. And the
corpus holds **54 strings but only 42 distinct ones**: `RESTS_DARK_NOTE` is carried by three entries,
and the four front-door quiet lines are byte-equal to their listing counterparts (asserted by
`listing.spec.ts:236-238`), so the walk sees them twice on purpose.

---

## The copy gate's rules, in the imperative

An entry plan can quote this list. Every one of them is a loop in `copy.spec.ts` that names the entry,
the field, the offending character and its code point in hex.

1. **No exclamation mark**, anywhere in HANGAR-authored copy. `install-copy.ts:44-46`'s house rule,
   project-wide.
2. **No emoji** — nothing matching `\p{Extended_Pictographic}`.
3. **Write the typographic apostrophe.** U+2019 in the source, never an ASCII U+0027 between two
   letters. `typographic.ts` curls one at render time for the vendored sentence it may not edit; that
   is a display transform, not a licence to author one.
4. **No hyphen doing a dash's job** in a description or a quiet line: no ` - `, no `--`. A real em
   dash is U+2014 and a semicolon is usually better. **Tags are exempt from this rule and only this
   one**, because the slug grammar requires a hyphen (`hands-free`, `multi-touch`).
5. **No ellipsis in a description**: no `...` anywhere, and no U+2026 in a description. An ellipsis
   means "this is still happening", never "there is more", and a description is never clamped
   (`CatalogCard.svelte:40-44`).
6. **One line, at most 110 characters, non-empty**, in `CATALOG` and in `LISTING`.
7. **No two descriptions the same**, case-folded, in either collection.
8. **Four tags on a hand-authored entry, three on a shelf preset**, and every tag a member of
   `KNOWN_TAGS`.

**The corpus is assembled by `source.kind`, never by a name list.** Name and description are taken
only from entries whose `source.kind` is not `"preset"`; tags from the same; plus every quiet line in
`LISTING` and in `FRONT_DOOR`, plus `RESTS_DARK_NOTE`. The one ASCII apostrophe in shipped
user-facing catalog copy is the shelf's, and it is byte-equal to the vendored sentence — it stays that
way and the gate does not ask otherwise. `grep -q "source.kind"` exits **0**;
`grep -n '"radar"\|"aurora"'` prints exactly one line, `copy.spec.ts:334`, inside test 4's anchor
table where naming the id is the point.

---

## The two protected search anchors

| Anchor | Rule | The two consumers |
|---|---|---|
| `aurora` | exactly **one** entry's searchable text contains it, and it is the entry with that id | `e2e/browse.e2e.ts:719-734` — `?q=aurora` must leave exactly one card, and that single padsim card is what proves a browse load fetching **zero** WebAssembly |
| `ghost` | exactly **one**, same shape | `src/lib/browse/filter.spec.ts` — `filterListing(LISTING, "ghost", ...)` must return exactly `["ghost"]`, three times over in the tag-and-query intersection test |
| `drums` | **more than one**, the inverse anchor | `e2e/browse.e2e.ts:337-349` — a typed word must narrow the grid without emptying it |

All three are asserted in the thirty-second quick run, so a careless word in one of twenty new
descriptions is caught before a Playwright run finds it.

---

## SMOKE_REPORT=1, the seven shipped entries

`SMOKE_REPORT=1 npx vitest run --project server src/lib/sim/lua-smoke.spec.ts --reporter=verbose`:

```
euclid: 76 MIDI, 0 HID, first three MIDI (0,128,36,0,0) (0,144,36,100,0) (0,128,38,0,0)
chorus: 18 MIDI, 0 HID, first three MIDI (0,144,48,100,0) (0,144,52,100,0) (0,144,55,100,0)
arc: 109 MIDI, 0 HID, first three MIDI (0,176,16,18,0) (0,176,16,31,0) (0,176,16,43,0)
ghost: 218 MIDI, 0 HID, first three MIDI (0,176,16,25,0) (0,176,17,102,0) (0,176,16,38,0)
lattice: 14 MIDI, 0 HID, first three MIDI (0,144,72,100,0) (0,128,72,0,0) (0,144,68,100,0)
morph: 28 MIDI, 0 HID, first three MIDI (0,176,16,81,0) (0,176,17,20,0) (0,176,18,20,0)
sonar: 8 MIDI, 0 HID, first three MIDI (0,144,43,100,0) (0,128,43,0,0) (0,144,43,100,0)
```

**Every shipped entry reads 0 HID**, which is the measured reason the HID non-vacuity assertion is
deferred rather than written today.

### Where the HID assertion goes, and who writes it

`src/lib/sim/lua-smoke.spec.ts:287-293`, immediately after the MIDI non-vacuity block in test 2, as a
comment:

> THE HID SIDE OF THAT GUARANTEE IS SCHEDULED, NOT WRITTEN HERE. The matching assertion — at least
> one entry produced HID — belongs at this exact spot and plan **09-06** adds it, with STAGE and
> SHUTTLE, the first two configurations whose whole output is keystrokes. It is deliberately not
> here: no entry in the catalog sends HID today, so the assertion would be red on arrival, and an
> assertion that cannot be true yet is not a gate, it is a scheduled failure.

`grep -q "at least one entry produced HID"` exits **0** and the string sits inside a comment, not an
assertion.

---

## The six negative checks

Each was observed with the stated command, then reverted, and `git diff --quiet` was run on the
perturbed path afterwards. Nothing was ever left perturbed.

| # | Task | Perturbation | Observed |
|---|---|---|---|
| 1 | 9-02-01 | add `"colour"` to EUCLID's tags in `listing.ts` — a tag a second entry already carries | **Red on test 5**, exit **1**: `AssertionError: today's standing row, count descending then name: expected [ 'playable', 'colour', …(7) ] to deeply equal [ 'playable', 'generative', …(7) ]`. `Tests 1 failed \| 5 passed (6)`. The recorded row is still a tripwire: colour's count went 2 → 3 and the row reordered |
| 2a | 9-02-01 | SONAR's `addedAt` → `2026-09-06`, **in `listing.ts` alone**, as the plan literally specifies | **Red on the NEWEST test for the wrong reason**, exit **1**: `NEWEST disagrees with the catalog's byNewest()` — the listing-agrees-with-the-catalog assertion sits above the structural one. The received sequence in the diff, `sonar, arc, chorus, …`, shows the browse comparator handled three dates correctly. `listing.spec.ts` went **red as intended**, exit **1**: `AssertionError: sonar: addedAt disagrees with the catalog` |
| 2b | 9-02-01 | the same date change in `listing.ts` **and** `entries/sonar.ts`, in lockstep | **`sort.spec.ts` 6 passed and `listing.spec.ts` 5 passed**, exit **0** — the restructured NEWEST test is green at three `addedAt` dates, which is the whole point of the restructure and the fact PHASE_ADDED_AT depends on |
| 3 | 9-02-02 | GHOST's U+2019 → ASCII `'`, in `listing.ts` and `entries/ghost.ts` in lockstep | **Red on test 2**, exit **1**: `AssertionError: ghost: description has a typewriter apostrophe (U+0027) between two letters; write U+2019 - "Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger's."` — the entry, the field and the code point, all three named |
| 4 | 9-02-02 | `!` appended to LATTICE's description, both files | **Red on test 2**, exit **1**: `AssertionError: lattice: description shouts - U+0021 in "The whole pad tuned in fourths, so every chord shape is the same shape in every key!"` |
| 5 | 9-02-02 | MORPH's description copied onto SONAR, both files | **Red on test 1**, exit **1**: `AssertionError: sonar and morph share one description; the longest in the catalog is euclid at 109 of 110 characters` — both ids named, and the near-miss reported beside them |
| 6 | 9-02-03 | `s:gms(@CH,176,@CCB+j,w[j],0)` deleted from MORPH's Setup template | **Red on test 2**, exit **1**: `AssertionError: morph: produced no MIDI and no HID at all across 218 ticks - the scripted gesture never reached anything this configuration sends`. The new message, not the old one |

**Two of these are deliberately not red, and the plan framed them that way.** Check **2b** expects a
pass — a third `addedAt` is a structural fact after the restructure, not a fault. Check **2a** is the
half that exposes a listing/catalog disagreement, and it is red on a different assertion than the plan
predicted; see deviation 1.

After each check: `git checkout -- <path>` then `git diff --quiet -- <path>` exiting **0**.
`copy.spec.ts` was `git add`ed **before** anything was perturbed, per the standing rule — on an
untracked path `git checkout --` fails outright and `git diff --quiet` passes vacuously.

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 — bug] The NEWEST negative check, as specified, fails for the wrong reason**

- **Found during:** Task 9-02-01, running the second negative check.
- **Issue:** The plan says to change one entry's `addedAt` in `listing.ts` and confirm the NEWEST test
  **passes**. It cannot. `sort.spec.ts`'s NEWEST test compares `sortListing(LISTING, "newest")`
  against the catalog's own `byNewest()`, and that assertion sits **above** the structural block. An
  edit to `listing.ts` alone makes the two disagree, so the test goes red on the agreement assertion
  and the structural assertions are never reached. The plan itself states the correct idiom two tasks
  later — *"in `src/lib/catalog/listing.ts` and its catalog entry in lockstep (or the assertion fails
  for the wrong reason)"* — it simply is not applied to this check.
- **Fix:** The check was run in two halves and both are recorded above. Half **2a** is the plan's
  literal instruction, and it produced the useful half of the claim: `listing.spec.ts` red on the
  disagreement, and the printed diff showing the browse comparator ordering three dates correctly.
  Half **2b** is the lockstep edit, and it produced the other half: `sort.spec.ts` **6 passed** with
  three `addedAt` dates in the data. Together they are the evidence the plan asked for.
- **Files modified:** none — both halves were reverted.
- **Commit:** the task's own, `b29257e`.

**2. [Rule 2 — missing critical functionality] `filter.spec.ts` carried a fourth hard-coded id list
the interfaces table did not enumerate**

- **Found during:** Task 9-02-01.
- **Issue:** The table lists `filter.spec.ts:140`'s `drums -> ["ninepads","euclid"]`. There is a
  second one at `:168-171`, in **test 3**, the power-syntax test: `expect(ids(filterListing(LISTING,
  "drums", []))).toEqual(["ninepads","euclid"])`. It is the proof that `$tag:drums` is a literal
  rather than the word, and it is exactly as fragile as the one the table names. 09-03's SLAM is a
  drum configuration, so it would have reddened a test about power syntax for a reason that has
  nothing to do with power syntax.
- **Fix:** derived from the same restated search predicate, with a `> 1` floor beside it so the proof
  is still a proof.
- **Files modified:** `src/lib/browse/filter.spec.ts`.
- **Commit:** `b29257e`.

**3. [Rule 2 — missing critical functionality] The census numbers in PROSE were moved too**

- **Found during:** Task 9-02-01.
- **Issue:** The plan's table covers assertions. Three comments carried the same numbers and would
  have gone stale silently: `filter.spec.ts`'s header (*"32 of the 41 tags sit on exactly one
  entry"*), `sort.spec.ts`'s header (*"a page whose job is to list sixteen names"*), and
  `sort.spec.ts`'s FEATURED comment justifying the name tie-break with *"only two distinct dates
  exist"* — which is false the moment PHASE_ADDED_AT lands and is the reasoning a later reader would
  trust. Nine test messages also said *"all sixteen"*.
- **Fix:** the header sentences point at `RECORDED` instead of restating it, the tie-break reason is
  now *"whole blocks of entries share one date"*, and the messages read *"every entry"*. No census
  number survives in prose in either file.
- **Files modified:** `src/lib/browse/filter.spec.ts`, `src/lib/browse/sort.spec.ts`.
- **Commit:** `b29257e`.

**4. [Rule 1 — bug] `lua-smoke.spec.ts` test 2's title said "and plays"**

- **Found during:** Task 9-02-03.
- **Issue:** The plan renames `sort.spec.ts`'s NEWEST title on the principle that *"a stale title is
  worse than a stale literal: nothing goes red, and the runner prints a sentence that is not true"*.
  The same principle applies here and the plan does not say so: after the widening, the test admits a
  configuration that plays nothing and types instead, so *"and plays"* would print as a false sentence
  the moment 09-06 lands STAGE.
- **Fix:** the title reads *"survives the gesture plus two hundred further ticks, and sends
  something"*. `grep -rn` confirmed no document, script or spec quoted the old title, so nothing else
  moved with it.
- **Files modified:** `src/lib/sim/lua-smoke.spec.ts`.
- **Commit:** `c5f5701`.

### Scope notes, recorded because a later reader will wonder

- **`src/lib/og/build.spec.ts` and `e2e/artifacts.e2e.ts` were NOT touched**, although the plan's
  frontmatter lists them under `files_modified`. The interfaces table says of both, twice and
  explicitly, *"left alone here; 09-10 raises it"*, and no task mentions either file. The table won.
  Both `>= 16` floors were read and confirmed to be at `build.spec.ts:215` and `artifacts.e2e.ts:69`,
  where 09-10 expects them.
- **The quiet lines are held whole by the copy gate**, and the file says so in its own header. Two of
  the four front-door quiet lines come from the vendored shelf (`front-door.ts:164, 190`) and two are
  HANGAR's (`:147, :181`); the distinction is not available from `source.kind`, because all four
  entries are `preset`. All four satisfy every rule as authored, so no exemption is needed today, and
  the header records that a future vendored line breaking a rule earns an exemption written in
  source-kind terms rather than an edit to vendored bytes.
- **Every line number in the plan's interfaces table was confirmed by `grep -n` before editing** and
  every one matched — including the three Prettier-wrapped `16`s alone on `sort.spec.ts:110`, `:146`
  and `:167`, and the featured/plain split at `:133` and `:136`. Nobody else had edited either file.

---

## Verification

| Gate | Result |
|---|---|
| `npx vitest run --project server src/lib/browse/filter.spec.ts src/lib/browse/sort.spec.ts` | **12 passed in 2 files** |
| `npx vitest run --project server src/lib/catalog/copy.spec.ts` | **5 passed in 1 file** |
| `npx vitest run --project server src/lib/sim/lua-smoke.spec.ts` | **3 passed in 1 file** |
| `npm run test:quick \| check-counts 73 775` (baseline, before any edit) | **exit 0** — the tree 09-01 left, re-measured |
| `npm run test:quick \| check-counts 74 780` (after tasks 2 and 3) | **exit 0** — `PREV + 1 / PREV + 5`, and `BASE + 1 / BASE + 4` |
| `npm run test:sweep \| check-counts 4 19` | **exit 0** |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | `547 FILES 0 ERRORS 0 WARNINGS` and nothing else |
| `npm run lint` | **exit 0** |
| `git diff --stat aea4d2c HEAD -- src/vendor/ src/lib/catalog/index.ts src/lib/catalog/listing.ts src/lib/catalog/front-door.ts src/lib/catalog/frames.json` | prints nothing — **this plan changed no data** |
| `git diff --stat aea4d2c HEAD` | four files, all specs: `filter.spec.ts`, `sort.spec.ts`, `copy.spec.ts`, `lua-smoke.spec.ts` |
| `grep -c "  it("` on the four files | **6, 6, 5, 3** — every count is what the plan requires |
| All six negative checks | observed with their stated outcomes and reverted byte-identical |

**Observed totals as baseline plus delta**, in the form the phase asks for:

- quick: `PREV_FILES 73 + 1 = 74`, `PREV_TESTS 775 + 5 = 780` (+ 1 todo, reported never asserted)
- sweep: `BASE_SWEEP 4 19 + 0 = 4 19`
- svelte-check: `546 + 1 = 547` files, `0 errors, 0 warnings` unchanged
- e2e: **not run** — the plan does not ask for it and this plan adds no e2e title. `PREV_E2E` stays
  89, measured by 09-01.

No device was connected to, looked for or written to. Nothing under `src/vendor/` was read for editing
or edited. No sibling repository was touched. `wrangler` was not run. The one scratch script used for
the negative-check perturbations lives in the scratchpad and was never added to the repository.

## Commits

| Commit | What |
|---|---|
| `b29257e` | `refactor(09-02): the browse literals become derived arithmetic and one recorded review` |
| `6fdde66` | `test(09-02): the copy gate counts every catalog string instead of reading it` |
| `c5f5701` | `test(09-02): the execution gate asks whether a configuration sends anything` |

## Self-Check: PASSED

All five files this SUMMARY claims to have created or modified are on disk, all three commit hashes
resolve in `git log`, and every line number quoted above was re-read from the file after the final
format pass: the `RECORDED` blocks at `filter.spec.ts:74-107` and `sort.spec.ts:56-57`, the two
surviving bare sixteens at `filter.spec.ts:92` and `sort.spec.ts:57`, the single `"aurora"` literal at
`copy.spec.ts:334`, and the deferred-HID comment at `lua-smoke.spec.ts:287-293`. Every count quoted
was read from a runner's own summary line in this session.
