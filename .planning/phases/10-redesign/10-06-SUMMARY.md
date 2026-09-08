---
phase: 10-redesign
plan: 06
subsystem: browse
tags:
  [
    d-10,
    facets,
    tag-vocabulary,
    cat-03,
    cat-04,
    cont-03,
    g-09,
    a-20,
    closed-vocabulary,
    legacy-tag-map,
  ]

requires:
  - phase: 10-redesign
    plan: 05
    provides: PREV_FILES 77 / PREV_TESTS 798 / PREV_E2E 97 / BASE_CHECK 573, and the discipline that long content goes through the Write tool
provides:
  - "src/lib/browse/facets.ts - ten FOR terms, six FEELS, FACETS, facetOf(), matchesFacets() with OR-within/AND-across, RETIRED_VOCABULARY (the 55 as history) and LEGACY_TAG_MAP (all 55 keys, 22 mapped, 33 explicit undefined). ZERO imports, not even an erased one"
  - "src/lib/browse/facets.spec.ts - four tests: the closed sixteen, exactly-three-per-entry in both directions, both health rules with a full histogram in every message, and the import scan plus the legacy table's bounds"
  - "The re-cut landed in 28 source files and listing.ts: 36 declarations, every entry exactly three tags, zero singletons, zero unused terms"
  - "KNOWN_TAGS in copy.spec.ts is now [...FOR_TERMS, ...FEELS_TERMS] rather than a 55-line array; the three-or-four-tags rule becomes exactly three"
  - "filter.spec.ts's RECORDED re-cut with singletons ASSERTED 0, and a new assertion that chipTags(LISTING) and the declared facets are the same sixteen words - the evidence 10-07's deletion is a replacement"
  - "chipTags() marked deprecated naming 10-07; disabledTags() untouched and documented as surviving"
  - "05.1-UI-SPEC.md: three dated amendments, including the MORE TAGS correction (nine mentions, never built) and the outsider chip named for the first time"
  - "PREV_FILES 78, PREV_TESTS 802, PREV_E2E 97, BASE_CHECK 575 - the carry-forward block for 10-07 onward"
affects: [10-07, 10-13, 10-14, browse, catalog-copy, url-migration]

tech-stack:
  added: []
  patterns:
    - "A vocabulary that is DECLARED and closed beats one DERIVED from counts: the derived row moved every time an entry landed, and three quarters of it matched a single card"
    - "A module that declares no import at all - not even `import type` - forces every function in it to take its data structurally, which is a stronger version of the import-free discipline its neighbours carry"
    - "An explicit `undefined` value is not the same as a missing key: `\"looper\" in LEGACY_TAG_MAP` is true, which is how 10-07 will tell a real retired tag from a word that was never one"
    - "A both-directions equality across twenty-nine files is what makes a data re-cut safe: editing the listing alone is red on arrival rather than quietly disagreeing"
    - "Arithmetic that can only be done ONCE - who carried `hypnotic` - is recorded in a summary and bounded by a history constant, never pretended to be a live test"

key-files:
  created:
    - src/lib/browse/facets.ts
    - src/lib/browse/facets.spec.ts
  modified:
    - src/lib/catalog/entries/ported.ts
    - src/lib/catalog/entries/arc.ts
    - src/lib/catalog/entries/chorus.ts
    - src/lib/catalog/entries/console.ts
    - src/lib/catalog/entries/cull.ts
    - src/lib/catalog/entries/etch.ts
    - src/lib/catalog/entries/euclid.ts
    - src/lib/catalog/entries/forge.ts
    - src/lib/catalog/entries/ghost.ts
    - src/lib/catalog/entries/gridlock.ts
    - src/lib/catalog/entries/hold.ts
    - src/lib/catalog/entries/keys.ts
    - src/lib/catalog/entries/lattice.ts
    - src/lib/catalog/entries/learn.ts
    - src/lib/catalog/entries/life.ts
    - src/lib/catalog/entries/lumen.ts
    - src/lib/catalog/entries/morph.ts
    - src/lib/catalog/entries/pomodoro.ts
    - src/lib/catalog/entries/quadrant.ts
    - src/lib/catalog/entries/shuttle.ts
    - src/lib/catalog/entries/slam.ts
    - src/lib/catalog/entries/snake.ts
    - src/lib/catalog/entries/sonar.ts
    - src/lib/catalog/entries/stage.ts
    - src/lib/catalog/entries/steps.ts
    - src/lib/catalog/entries/strip.ts
    - src/lib/catalog/entries/switch.ts
    - src/lib/catalog/entries/table.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/copy.spec.ts
    - src/lib/browse/filter.ts
    - src/lib/browse/filter.spec.ts
    - src/lib/browse/sort.spec.ts
    - src/lib/browse/query.spec.ts
    - .planning/phases/05.1-catalog-browse/05.1-UI-SPEC.md
  deleted: []

key-decisions:
  - "The legacy map's rule is two clauses, and the first outranks the second: a surviving term maps to itself, and a retired term maps to a facet member only when TWO OR MORE entries carried it and every one of them carries that member after the re-cut. No singleton is mapped, which is what makes 10-UI-SPEC 9.4's own example - ?tag=looper landing as ?q=looper - true rather than contradicted"
  - "facets.ts declares NO import, not even `import type`, which is one notch tighter than front-door.ts and sort.ts. That is what forces matchesFacets() to take its entry structurally instead of reaching for ListingEntry"
  - "All fifty-five terms are keys of LEGACY_TAG_MAP, thirty-three of them with `undefined` written out, so 10-07 can tell a shipped-but-unmappable tag from a word that was never a tag"
  - "KNOWN_TAGS is imported rather than restated. The comment that justified the literal - 'declaring one is a line a reviewer sees' - is satisfied better by facets.ts, where the facets and the health rules are"
  - "The clause-2 arithmetic is recorded here rather than asserted: after the re-cut nothing in the repository knows who carried `hypnotic`, so a test claiming to check it would be checking nothing"
  - "filter.spec.ts gains one assertion rather than a test: chipTags(LISTING) sorted equals the sixteen sorted. It is the proof that 10-07's deletion of the count derivation is a replacement and not a change"

patterns-established:
  - "A negative check whose target test is already red for another reason is deferred to the moment the baseline is green, and the deferral is stated rather than the check being reported against a masked message"
  - "A verification grep that does not come back empty is reported hit by hit, with each hit classified, rather than being narrowed until it does"

requirements-completed: [CAT-03, CAT-04, CONT-03]

duration: 75min
completed: 2026-09-08
---

# Phase 10 Plan 06: Fifty-five tags become sixteen Summary

**Thirty-six entries carried 55 distinct tags, 27 of them on exactly one entry, with 28 chips
standing in the toolbar. They now carry 16 terms in two declared facets — one `FOR` and two `FEELS`
each — with **zero singletons by construction**, zero unused terms, and a chip rule that is a
membership test rather than a count. The edit landed in twenty-eight source files as well as in
`listing.ts`, proved by reverting one of them and watching the both-directions equality name it.
78 files / 802 tests (+1 / +4), 97 e2e (+0), check 575 (+2).**

## Performance

- **Duration:** ~75 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files created:** 2 · **Files modified:** 35 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                      |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                           |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                           |
| `PREV_FILES`      | **77**     | **78**     | **+1** — `src/lib/browse/facets.spec.ts`                                  |
| `PREV_TESTS`      | **798**    | **802**    | **+4** — `facets.spec.ts` 4. No existing file's count moved               |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **run, and unchanged** — twenty-seven entry files were edited             |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                           |
| `PREV_SWEEP_WALL` | **123 s**  | **123 s**  | **not carried from this plan** — 10-08 and 10-14 re-measure it. Observed 104 s |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                           |
| `PREV_E2E`        | **97**     | **97**     | **+0** — no title added or removed, re-measured at `--workers 3`          |
| `BASE_CHECK`      | **573**    | **575**    | **+2**: `facets.ts` and `facets.spec.ts`. Always 0 / 0                    |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                    |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                 |

`npm run check` prints one line:
`COMPLETED 575 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

**The sweep was run rather than assumed**, because twenty-seven `src/lib/catalog/entries/*.ts` files
are sweep inputs and this plan edited every one of them. Every edit is inside a header comment block
or the `tags:` field and none touches a template string; `npm run test:sweep` reports **4 files /
19 tests passed**, `worst 906 of 908 at none/none/trackpad/hi=false/grid=false`, `over budget 0`, in
**104 s** against `BASE_SWEEP_WALL`'s 123 s. That number is recorded, not carried.

---

## THE SPEC'S ASSIGNMENT TABLE, VERIFIED BEFORE A SOURCE FILE WAS TOUCHED

The plan's standing rule is that every count comes from a script and that the spec's arithmetic is
checked rather than trusted. It was, before task 2 began, and **no disagreement was found** — which
is worth stating explicitly, because the alternative outcome was the one the plan told me to stop on.

| Check                                                                        | Result       |
| ---------------------------------------------------------------------------- | ------------ |
| rows                                                                          | **36**       |
| every row is one `FOR` and two **distinct** `FEELS`, all sixteen from the vocabulary | **pass** |
| `FOR` slots                                                                   | **36**       |
| `FEELS` slots                                                                 | **72**       |
| `FOR` histogram against the spec's declared counts (9/5/3/3/3/3/3/3/2/2)      | **all agree** |
| `FEELS` histogram against the spec's declared counts (16/14/13/13/8/8)        | **all agree** |
| the spec's ten per-term ENTRY LISTS against its own thirty-six rows           | **all agree** |
| every id parsed out of `listing.ts`, in order, against the table's ids        | **identical, 36 of 36** |
| terms matching exactly one entry                                              | **0**        |

---

## THE FINISHED VOCABULARY, READ OFF THE SHIPPED `listing.ts`

Not off the assignment table — off the data, after the edit landed.

```
entries: 36
distinct terms carried: 16
tags per entry: 3          (a single value, not a range)
```

### `FOR` — ten terms, exactly one per entry, 36 slots

| Term         | n | Entries                                                          |
| ------------ | - | ---------------------------------------------------------------- |
| `modulation` | 9 | radar, joystick, dial, arc, ghost, morph, hold, table, shuttle    |
| `show`       | 5 | aurora, pinwheel, starfield, lumen, pomodoro                      |
| `keys`       | 3 | chorus, lattice, keys                                            |
| `mixing`     | 3 | faders, console, strip                                           |
| `sequencing` | 3 | euclid, sonar, steps                                             |
| `shortcuts`  | 3 | cull, forge, switch                                              |
| `pointing`   | 3 | tpad, learn, quadrant                                            |
| `play`       | 3 | snake, etch, life                                                |
| `drums`      | 2 | ninepads, slam                                                   |
| `clips`      | 2 | gridlock, stage                                                  |

### `FEELS` — six terms, exactly two per entry, 72 slots

| Term         | n  |
| ------------ | -- |
| `readable`   | 16 |
| `expressive` | 14 |
| `playable`   | 13 |
| `generative` | 13 |
| `precise`    | 8  |
| `still`      | 8  |

### The three numbers D-10 was raised about

| Measure                              | Before | After  |
| ------------------------------------ | ------ | ------ |
| distinct terms                        | **55** | **16** |
| **terms matching exactly one entry**  | **27** | **0**  |
| chips standing in the toolbar         | **28** | **16** |
| tags per entry                        | 3 or 4 | **3**  |
| terms carried by no entry             | 0      | **0**  |
| entries carrying a term outside the vocabulary | n/a | **0** |

`min FOR 2`, `min FEELS 8`, `max FEELS 16` — inside both health rules (`FOR` at least 2, `FEELS`
between 6 and 18) with room at every edge.

---

## THE TWENTY-EIGHT FILES, AND THE TENTH `tags:` IN `ported.ts`

**Enumerated from `LISTING`'s ids, never grepped for.** Each id was mapped to its declaring file and
the counts asserted: **28 files, 36 declarations, 36 ids.**

| File                                  | Declares | Entries                                                                 |
| ------------------------------------- | -------- | ----------------------------------------------------------------------- |
| `entries/ported.ts`                   | **9**    | aurora, pinwheel, starfield, radar, joystick, ninepads, faders, dial, tpad |
| `entries/{euclid,chorus,arc,ghost}.ts` | 1 each   | euclid, chorus, arc, ghost                                              |
| `entries/{lattice,morph,sonar,hold}.ts` | 1 each  | lattice, morph, sonar, hold                                             |
| `entries/{steps,slam,keys,gridlock}.ts` | 1 each  | steps, slam, keys, gridlock                                             |
| `entries/{table,console,strip,learn}.ts` | 1 each | table, console, strip, learn                                            |
| `entries/{lumen,stage,shuttle,cull}.ts` | 1 each  | lumen, stage, shuttle, cull                                             |
| `entries/{forge,switch,snake,etch}.ts` | 1 each   | forge, switch, snake, etch                                              |
| `entries/{life,quadrant,pomodoro}.ts` | 1 each   | life, quadrant, pomodoro                                                |
| **`listing.ts`**                      | **36 restatements** | all                                                          |

**The tenth `tags:` occurrence in `ported.ts` is `:98`, `tags: meta.tags`.** It sits inside
`PORTED_META.map(...)` and is a **projection** of the declared array onto the `CatalogEntry` it
builds — the same line that projects `meta.featured` beside it. It is not a declaration, it names no
term, and it is untouched. The nine real declarations are at `:33`–`:81`, one per `PORTED_META` row.

`listing.ts` was edited **last**, so `listing.spec.ts` was one-directionally red in the middle
rather than mutually.

### Sixteen sentences rewritten rather than deleted

Sixteen entry files carried a comment telling a story about the retired vocabulary — a coinage, a
singleton waiting for its second carrier, or "all four are already carried". Every one of them was
**rewritten to name the re-cut**, per the plan, rather than removed:

| Entry                    | What its old sentence said                     | What it says now                                                          |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- |
| **hold** / **console**   | `"latching"` coined, singleton until wave 5     | it retires; latching is how the pad works, not what a visitor filters on   |
| **cull** / **quadrant**  | `"accessible"` singleton until QUADRANT         | the word retires, the claim survives as `readable`                        |
| **snake** / **life**     | `"game"` needed a second carrier to be a chip   | it is `play` now, a facet member that needs nobody's second carrier        |
| **stage** / **shuttle**  | `"hotkeys"` stood because two landed in one wave | the accident of counting the closed vocabulary removes                    |
| **steps**                | a third `drums` carrier moves the chip row      | `drums` moves OFF; this one is a sequencer                                 |
| **strip**                | `"hands-free"` carried by ARC and HOLD          | its carriers scattered, so it maps to nothing                             |
| **lumen**                | `"lighting"` singleton until a later wave       | no later wave ever came; it retires rather than waiting                    |
| **etch**, **forge**, **learn**, **pomodoro**, **switch** | coinages and "already carried" | each names what retired and why the three that replaced it say more |

`listing.ts`'s `tags` field doc and `ported.ts`'s `PORTED_META` header both carry the new rule and
name the three-versus-four split as gone.

---

## THE LEGACY `?tag=` TABLE, AND THE RULE THAT DECIDED EVERY ROW

All **55** keys are present. **22 map**, **33 are `undefined` written out.**

> **Clause 1.** A term that is itself one of the sixteen maps to **itself**. Ten do.
> **Clause 2.** A retired term maps to a facet member only when **two or more entries carried it**
> **and** every one of those entries carries that member after the re-cut. Twelve do.
> Anything else maps to `undefined`. Clause 1 outranks clause 2.

| Clause | n  | Rows |
| ------ | -- | ---- |
| 1 — identity | **10** | `clips`, `drums`, `expressive`, `generative`, `mixing`, `modulation`, `playable`, `precise`, `readable`, `still` |
| 2 — folds    | **12** | `accessible`→`readable`, `ambient`→`generative`, `blooming`→`playable`, `calm`→`generative`, `colour`→`show`, `game`→`play`, `harmonic`→`keys`, **`hypnotic`→`generative`**, `latching`→`readable`, `macros`→`still`, `rails`→`mixing`, `sequencer`→`sequencing` |
| unmapped — singletons | **26** | `automation`, `blend`, `chords`, `desktop`, `drawing`, `endless`, `flowing`, `in-key`, `instrument`, `isomorphic`, `launcher`, `lighting`, **`looper`**, `multi-touch`, `photo`, `pitch-bend`, `pointer`, `polar`, `polyrhythm`, `radial`, `rotating`, `sound-design`, `sprung`, `streaming`, `video`, `wavetable` |
| unmapped — multi-carrier, no common home | **7** | `gestural` (6 carriers), `grid` (5), `hands-free` (3), `hotkeys` (4), `rippling` (2), `utility` (8), `xy-control` (4) |

10 + 12 + 26 + 7 = **55**. The twenty-seventh singleton is `clips`, which sat on GRIDLOCK alone and
is in clause 1, because a surviving word maps to itself whatever its old count was.

**Why no singleton is mapped, and why that matters.** 10-UI-SPEC §9.4's own worked example is
`?tag=looper` landing as `?q=looper`. A rule that folded singletons into their entry's `FOR` term
would have made `looper` map to `modulation` and contradicted the approved document's illustration
of the unmapped path. §9.4 also says *why*: "a singleton tag is what somebody shares when they mean
*this one card*". Sending them to a nine-entry `modulation` chip shows them a grid they never saw.

**`hypnotic`→`generative` was not chosen — it was derived.** §9.4 says "`hypnotic` is folded into
`generative`" in prose; clause 2 arrives at the same answer independently, because `generative` is
the only one of the sixteen that all five of `hypnotic`'s carriers (radar, arc, sonar, shuttle,
life) carry. The two agreeing is the check.

**One honest limit, written into `facets.ts` rather than smoothed.** Clause 2's arithmetic can only
be done **once**, against the listing as it stood before the re-cut. After it, nothing in the
repository knows who carried `hypnotic`, so no test can recompute it. That is why
`RETIRED_VOCABULARY` is written down as history that never grows, why the derivation's output is in
this document, and why `facets.spec.ts` test 4 asserts only what remains checkable: the table's keys
are the fifty-five, and its values are facet members or `undefined`.

**All fifty-five values are explicit, including the thirty-three `undefined`s**, so
`"looper" in LEGACY_TAG_MAP` is `true` while `LEGACY_TAG_MAP.looper` is `undefined`. 10-07 needs
that distinction to tell a tag this site really shipped from a word that was never one.

---

## `facets.ts` IMPORTS NOTHING — one notch tighter than its neighbours

`front-door.ts`, `listing.ts`, `sort.ts` and `filter.ts` all carry the import-free discipline, and
three of them still declare one `import type`. `facets.ts` declares **none at all**, and
`facets.spec.ts` test 4 asserts both halves separately: zero `import` declaration lines, and zero
`from "..."` specifiers.

That is not decoration. It is what forces `matchesFacets(entry: { readonly tags: readonly string[] },
active)` to take its entry **structurally** rather than reaching for `ListingEntry` — the
vocabulary-as-argument shape `parseBrowseQuery` already uses. The measured reason is unchanged: a
runtime import of `$lib/catalog` would drag `entries/ported.ts`, the vendored compiler and
`@intechstudio/grid-protocol` — **131,101 bytes**, measured in 04-RESEARCH — onto the first paint of
`/browse/`, which is prerendered and needs the sixteen terms in its HTML.

`filter.ts` and `query.ts` each keep their single-specifier scan green: neither imports `facets.ts`.

---

## THE FOUR NEGATIVE CHECKS

| # | Perturbation                                            | Test                              | Exit | Message                                                                                                                                                                                                                                     |
| - | ------------------------------------------------------- | --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | an eleventh `FOR` term, `looping`, carried by nothing    | `facets.spec.ts` test 2, reverse  | 1    | *"`looping` is declared in a facet and carried by no entry. FOR: modulation 9, show 5, keys 3, mixing 3, sequencing 3, shortcuts 3, pointing 3, play 3, drums 2, clips 2, looping 0 \| FEELS: readable 16, expressive 14, playable 13, generative 13, precise 8, still 8: expected 0 to be greater than 0"* |
| 1b | the same edit, second red                              | `facets.spec.ts` test 3           | 1    | *"FOR `looping` lands on 0 entries; a term matching one card is a thing search does better."* — same histogram                                                                                                                               |
| **2** | **`entries/arc.ts`'s tags reverted alone, `listing.ts` left re-cut** | **`listing.spec.ts` test 1** | **1** | ***"arc: tags disagree with the catalog: expected [ 'modulation', 'hands-free', …(2) ] to deeply equal [ 'modulation', 'generative', …(1) ]"***                                                                              |
| 3 | a seventeenth term, `looper`, appended to `KNOWN_TAGS`   | `copy.spec.ts` test 3, reverse    | 1    | *"`looper` is declared in a facet and carried by no entry in the CATALOG; a retired tag is red too: expected false to be true"*                                                                                                              |
| 4 | `RECORDED.singletons` set to `1`                         | `filter.spec.ts` test 5           | 1    | *"no tag is left out of the row: the vocabulary is closed and every member is a chip: expected [] to have a length of 1 but got +0"*                                                                                                          |

**Check 2 is the one that matters** and its message belongs here verbatim, because it is the proof
that the re-cut had to touch twenty-eight files rather than one. One entry file reverted, the listing
left correct, and the both-directions equality names the entry and the field.

**Check 4 records that the zero was asserted rather than omitted.** `RECORDED.singletons` is `0`, and
the assertion against it is live: setting it to `1` goes red. An omitted zero is how a closed
vocabulary quietly reopens — a wave that coined one word would move `tags` and nothing would say the
row had grown a term matching a single card.

**Restoration, byte-identical, stated rather than assumed.** `sha256` before and after every
perturbation:

- `src/lib/browse/facets.ts` — `8c09ed11b0c1616860516cbb5200359b99b37e93ed92267a7569edfab5cf7a11`
  before and after check 1.
- `src/lib/catalog/entries/arc.ts` — `6e7e4f4d1c74e5d3ddd2423940d09ba5441488d4745153f7d75901274550db0e`
  before and after check 2.
- `src/lib/catalog/copy.spec.ts` — `b4b322199ad63f127990da68c2b1c759bf577f1044f061e982d898df3f68f466`
  before and after check 3.
- `src/lib/browse/filter.spec.ts` — `d39598f8a63349f6324e8da88e5aba0723a384f159851fee720f87c1a4b4f14c`
  before and after check 4.

No `git checkout`, `restore`, `stash` or `clean` was run at any point; every perturbation was undone
by its own inverse edit.

**Check 1 was deferred and the deferral is stated.** The plan puts it in task 1, where
`facets.spec.ts` tests 2 and 3 are red on purpose because `LISTING` does not carry the vocabulary
yet. An eleventh term added there would have produced a message masked by the red already present, so
the check was taken at the first moment the baseline was green — immediately after task 2 landed —
and the reverse direction named `looping` cleanly.

---

## THE GATE THAT ARRIVED WITH ITS DATA

`facets.spec.ts` tests 2 and 3 were written, committed and **observed red** at the end of task 1, and
went green when task 2 landed. Recorded at the time:

```
test 2  aurora carries ambient, flowing, colour, which no facet declares:
        expected [ 'ambient', 'flowing', 'colour' ] to deeply equal []
test 3  FOR "show" lands on 0 entries; a term matching one card is a thing search
        does better. FOR: modulation 2, show 0, keys 0, mixing 2, sequencing 0,
        shortcuts 0, pointing 0, play 0, drums 4, clips 1 | FEELS: readable 11,
        expressive 5, playable 10, generative 5, precise 4, still 4
```

That histogram is itself a picture of the problem D-10 names: six of the ten `FOR` terms did not
exist in the old vocabulary at all, and the four that did were carried by 1, 2, 2 and 4 entries.

---

## THE FOUR GATE BLOCKS

**1. `KNOWN_TAGS` is imported, not restated.** It was a fifty-five-line array in `copy.spec.ts`. It
is now `[...FOR_TERMS, ...FEELS_TERMS]`. The comment that justified the literal — *"declaring one is
a line in this array that a reviewer sees"* — is satisfied better by `facets.ts`, where the line sits
beside the two facets and the health rules. **The both-directions loop stays and is not a duplicate**
of `facets.spec.ts` test 2: that one holds `facets.ts` against `LISTING`, the browse projection, and
this one against `CATALOG`, the source those records are projected from. `copy.spec.ts` stays at
**5** tests.

The three-tags-for-a-preset / four-for-a-hand-authored rule becomes **exactly three for every entry**,
with the message rewritten to say so. That is CONT-03's "four feel tags" amended.

**2. `filter.spec.ts`'s `RECORDED`**, re-cut with the amendment named in its header in 09-02's shape:

| Field | Was | Is |
| ----- | --- | -- |
| `entries` | 36 | 36 |
| `tags` | 55 | **16** |
| `singletons` | 27 | **0** |
| `chips` | 28 names | **16 names** |
| `chipCounts` | `11,10,8,6,5,5,5,5,4,4,4,4,4,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2` | **`16,14,13,13,9,8,8,5,3,3,3,3,3,3,2,2`** |

> **The derivation retires and is replaced by name.** "Chips are the tags carried by two or more
> entries" (D-15) becomes **"chips are the facet members"** (G-09).

The block also gained a new assertion rather than a new test: `chipTags(LISTING)` sorted equals the
sixteen sorted. On today's data the retired derivation and the declared vocabulary are the **same set
of words**, which is the evidence that 10-07's deletion of `chipTags()` is a replacement and not a
change. `filter.spec.ts` stays at **6** tests.

**3. `sort.spec.ts`'s `RECORDED` holds no tag figure**, and this plan says so explicitly rather than
leaving it as an absence: `{ entries: 36, featured: 15 }` is unmoved because ordering has never read
a tag, and the file's one `tags: []` is a synthetic fixture naming no term. Its test count does not
move here; the NEWEST retirement is 10-07's. **6** tests.

**4. `disabledTags()` is untouched and `chipTags()` is marked for 10-07.** `disabledTags()` keeps its
signature, its body and its behaviour, with a paragraph added naming what survives and what narrows:
under OR-within / AND-across a chip is disabled only when it would return zero given the **other**
facet's active set, which makes it rare rather than common. `chipTags()` carries a `DEPRECATED BY
10-06 … DELETED BY 10-07` block naming the outsider chip that goes with it and pointing at the
equality assertion above. `filterListing()`'s W-04 paragraph carries the OR/AND amendment.

---

## `05.1-UI-SPEC.md` — three dated amendments, none of them a deletion

1. **The census**, as a dated block at the head of "The tag chips", keeping the old numbers as
   history in a two-column table: nine chips / forty-one tags / thirty-two singletons at sixteen
   entries, then twenty-eight / fifty-five / twenty-seven at thirty-six, becoming **sixteen terms in
   two facets, exactly three per entry, zero singletons**.
2. **`MORE TAGS` is corrected, not retired, because it was never built.** That document names it and
   its `FEWER TAGS` counterpart in **nine** places, counted and cited by line: `:94`, `:128`, `:155`,
   `:297` (the ASCII mock), `:504`, `:1042`, `:1116` (which even reserves a `browse-more-tags`
   test id), `:1195` (W-19) and `:1227`. `BrowseToolbar.svelte:44-52` says in as many words that
   05.1-CONTEXT's D-15 beat 05.1-UI-SPEC's W-19 and the disclosure is *deliberately* not built.
   A-20 rules on it. `:94` and `:154` are amended inline by name as the plan asks; the block states
   the correction for the whole document, and says that the quoted chip row and the ASCII mock are
   stale as of this plan.
3. **"Combining is AND" gains its amendment** — OR within a facet, AND across — with the reason
   (`FOR` gives every entry one term, so the second `FOR` chip under AND is permanently dead) and a
   note that the disabled-chip contract quoted beneath it survives verbatim.

**The block also names the outsider chip, which no spec had ever named.**
`BrowseToolbar.svelte:49-52` renders an active tag that is not one of the standing chips after them,
and it is what makes a shared `/browse/?tag=looper` link **removable** instead of a filter with no
visible control. It retires in 10-07, because a closed vocabulary cannot produce an outsider, and its
job passes to the search field's own `CLEAR`.

---

## Task Commits

1. **Task 10-06-01: a closed vocabulary of sixteen, two facets, and no runtime imports** — `1813aa3` (feat).
2. **Task 10-06-02: the re-cut, in twenty-eight source files and in the listing** — `2ac9b31` (refactor), 29 files changed.
3. **Task 10-06-03: the gate blocks re-cut, and 05.1-UI-SPEC amended by name** — `340618c` (test).

---

## Verification

| Gate                                                             | Result                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`                 | one line: `COMPLETED 575 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`                   |
| `npm run lint`                                                   | clean — Prettier and ESLint                                                                |
| `npm run test:quick \| node scripts/check-counts.mjs 78 802`     | *"observed 78 files, 802 tests passed, 1 todo … matches the expected counts"*               |
| `facets.spec.ts`                                                  | **4 passed**                                                                                |
| `listing.spec.ts` / `catalog.spec.ts`                            | **5** / **10** — no count moved                                                            |
| `copy.spec.ts` / `filter.spec.ts` / `sort.spec.ts`               | **5** / **6** / **6** — no count moved                                                     |
| `query.spec.ts`                                                   | **5** — no count moved                                                                     |
| a script printing both histograms and the slot sums               | 36 / 72, both matching the spec exactly; 0 singletons, 0 unused, 0 strangers                |
| `npm run build`                                                  | green, exit 0; `source-340618cf….tar.gz` 1,293 KB                                          |
| `npx playwright test --workers 3`                                | **97 passed**, exit 0, 2.0 min — `PREV_E2E` unchanged                                      |
| `npx playwright test e2e/browse.e2e.ts --workers 3`              | **11 passed**                                                                              |
| `npm run test:sweep`                                             | **4 files / 19 tests**, `over budget 0`, 104 s — `BASE_SWEEP` unchanged                    |
| `grep -rn "hypnotic\|gestural\|multi-touch\|xy-control" src/lib/catalog` | **three hits, all comments — see below.** Zero in any `tags:` array               |
| `git diff --stat -- src/vendor/ src/lib/ui/Coverflow.svelte`     | empty, against the plan's base commit and against the working tree                          |
| `git status --porcelain`                                         | empty. `test-results/` removed by hand                                                      |

### The verification grep is not empty, and here is every hit

The plan asks for `grep -rn "hypnotic\|gestural\|multi-touch\|xy-control" src/lib/catalog` to come
back empty. It does not. It returns **three lines, none of them data**, and narrowing the pattern
until it passed would have been the wrong move:

| Hit | What it is | Verdict |
| --- | ---------- | ------- |
| `copy.spec.ts:229` | the hyphen-exemption comment, whose examples were `hands-free` and `multi-touch` | **Fixed.** Rewritten: the exemption is now **vacuous** — not one of the sixteen contains a hyphen — and is kept deliberately, because deleting it would silently forbid a hyphenated term the day the vocabulary gains one, which `SLUG` still permits |
| `lattice.ts:8` | *"octaves, multi-touch, with a per-contact watchdog in the Timer"* | **Left.** English prose describing what the configuration does with more than one finger. It was never a reference to the tag |
| `learn.ts:118` | *"`utility` and `xy-control` retire. Eight entries carried `utility` …"* | **Left, and required.** This is one of the sixteen rewritten sentences the plan asks for by name: *"rewrite the sentence rather than deleting it, naming this re-cut"* |

**A stricter grep over the data alone — every `tags: [...]` array in `entries/` and `listing.ts`
against all twenty-one retired words — returns nothing.** The retired vocabulary is gone from the
data, which is what the check exists to prove.

---

## Decisions Made

1. **The legacy map's two clauses, and clause 1 outranking clause 2.** A surviving term maps to
   itself; a retired term maps only where two or more entries carried it and every carrier carries
   the destination today. Everything else is `undefined`.
2. **No singleton is mapped**, which keeps 10-UI-SPEC §9.4's own `?tag=looper` → `?q=looper` example
   true rather than contradicting it, and keeps a shared link from landing on a grid its author
   never saw.
3. **`facets.ts` declares no import at all**, one notch tighter than its neighbours, which is what
   forces the vocabulary-as-argument shape.
4. **Every one of the fifty-five is a key**, thirty-three with `undefined` written out, so 10-07 can
   distinguish a shipped tag with no home from a word that was never a tag.
5. **`KNOWN_TAGS` is imported rather than restated**, and the both-directions loop is kept and
   re-aimed at `CATALOG` so it is not a duplicate of the `LISTING` check.
6. **The clause-2 arithmetic is reported, not asserted**, because after the re-cut nothing in the
   repository can recompute it and a test claiming to would be checking nothing.
7. **`filter.spec.ts` gains an assertion, not a test**: the derived row and the declared facets are
   the same sixteen words today, which is the evidence 10-07's deletion is a replacement.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] `query.spec.ts` is red on the re-cut and is not in the plan's file list**

- **Found during:** Task 10-06-02, in the first full quick run after the data landed
- **Issue:** Three of `query.spec.ts`'s five tests use `gestural`, `hypnotic` and `ambient` as
  sample tag values. Its `KNOWN` vocabulary is `allTags(LISTING)` — derived from the catalog — so a
  parser working perfectly drops a sample word nobody carries. Red for the right reason.
- **Fix:** the three sample words become `modulation`, `precise` and `readable`. Nothing else moved:
  the diff is twenty-six lines, all of them sample values, and the header records why. `query.ts`
  itself is **untouched** — `?tag=` to facets is 10-07's, including the ruling that an unmapped value
  becomes `?q=`.
- **Files modified:** `src/lib/browse/query.spec.ts`
- **Committed in:** `340618c`

**2. [Rule 3 — blocking] `filter.spec.ts`'s two search anchors stopped working, and one of them
stopped *narrowing***

- **Found during:** Task 10-06-03
- **Issue:** Two separate breakages. `matches(byId("euclid"), "polyrhythm")` — *"a term in the tags
  only"* — anchored on one of the twenty-seven retired singletons. And `search("drums")` versus
  `search("nine drums")` asserted that a second term **narrows**: after the re-cut `drums` sits on
  exactly Nine pads and SLAM, and **both** of their descriptions begin with "Nine", so the second
  term narrowed 2 to 2 and `toBeLessThan` failed.
- **Fix:** `sequencing` replaces `polyrhythm` (carried by EUCLID, absent from its name and
  description — verified by script over all sixteen terms). `playable` / `nine playable` replaces
  the drums pair: 4 of 13, a real narrowing. Both replacements carry the reason in a comment,
  including the observation that a search test anchored on a singleton was itself a symptom of the
  vocabulary this plan re-cut.
- **Files modified:** `src/lib/browse/filter.spec.ts`
- **Committed in:** `340618c`

**3. [Rule 3 — blocking] `filter.ts` needed editing and is not in the plan's file list**

- **Found during:** Task 10-06-03
- **Issue:** The plan's own action asks for `chipTags()` to be "marked deprecated in a comment naming
  10-07" and for `disabledTags()`'s survival to be recorded — both of which live in `filter.ts`,
  which the plan's `files_modified` omits.
- **Fix:** three comment blocks in `filter.ts`; **no code changed**, which `filter.spec.ts` test 1's
  source scan confirms (still exactly one specifier, still `import type`). Also corrected a stale
  census sentence in `filterListing()`'s doc that stated "32 of the 41 tags sit on exactly one entry"
  in the present tense.
- **Files modified:** `src/lib/browse/filter.ts`
- **Committed in:** `340618c`

**4. [Rule 1 — bug] `copy.spec.ts`'s hyphen exemption cited two retired tags as its live examples**

- **Found during:** the plan's own verification grep
- **Issue:** *"A tag may carry one because the slug grammar requires it (hands-free, multi-touch)"* —
  both retired, and **not one of the sixteen contains a hyphen**, so the exemption is now vacuous.
- **Fix:** the comment says so, and says why the exemption is kept anyway: deleting it would work
  today and would silently forbid a hyphenated term the day the vocabulary gains one, which `SLUG`
  still allows. A rule that is currently unexercised is not the same as a wrong rule.
- **Files modified:** `src/lib/catalog/copy.spec.ts`
- **Committed in:** `340618c`

**5. [Rule 2 — missing critical functionality] `filter.spec.ts`'s singleton loop became vacuous, and
a vacuous loop is not a gate**

- **Found during:** Task 10-06-03
- **Issue:** Test 5's `for (const tag of excluded) expect(count(tag)).toBe(1)` now runs **zero
  times**, because `chipTags()`'s two-or-more filter excludes nothing. Left alone it would read as
  coverage while asserting nothing.
- **Fix:** the emptiness is named in a comment as the point rather than a gap, the `toHaveLength(0)`
  above it is what carries the claim, and a **new** assertion was added — the derived row and the
  declared facets are the same set — so the test says something live again.
- **Files modified:** `src/lib/browse/filter.spec.ts`
- **Committed in:** `340618c`

**6. [Ordering, not a rule] Task 1's negative check was taken after task 2 landed**

- The plan puts the eleventh-`FOR`-term check in task 1, where the target test is already red for
  another reason and its message would have been masked. It was taken at the first green baseline
  instead. Both the deferral and the resulting message are recorded above.

---

**Total deviations:** 5 auto-fixed — 1 × Rule 1 (bug), 1 × Rule 2 (missing critical functionality),
3 × Rule 3 (blocking) — plus one stated ordering change.
**Impact on plan:** three files outside the plan's list (`src/lib/browse/query.spec.ts`,
`src/lib/browse/filter.ts`, and `05.1-UI-SPEC.md`'s two inline lines, which the plan does name).
Nothing in the objective was dropped, and the one place the plan's verification does not come back
clean — the retired-vocabulary grep — is reported hit by hit rather than narrowed until it passed.

---

## Issues Encountered

**One test failed once under full-suite load and passed alone and in a second full suite.**
`browse.e2e.ts:1119` — *"browse, open a configuration, and come back to the same view"* — failed once
at `expect(page.locator(CARDS)).toHaveCount(7)` receiving 13, which is `playable`'s carrier count:
the typed query `pad` had not been applied when the chip was clicked. **This is the same test 10-05
recorded failing once for the same cause** — it races the toolbar's 500 ms trailing address
projection between `fill()` and `click()`. It passed alone (11 passed) and in a full re-run
(**97 passed, exit 0**). The mechanism is independent of the vocabulary; what the re-cut changed is
the number the mismatch reports. Recorded rather than dismissed, and left for whoever owns the
toolbar next, which is 10-07.

**One full Playwright run died mid-suite with `ECONNREFUSED 127.0.0.1:4173`.** The dev server went
away during `install.e2e.ts`'s scripted-ZONA probe and everything after it cascaded. It is not a
finding about this plan — the re-run at the same commit was 97 passed, exit 0 — and it is recorded so
the count in this document is known to come from a run that completed.

**Every Playwright count here comes from a run written to a file and read to completion**, never from
a pipeline through `grep | head`, which 10-05 measured truncating a run via SIGPIPE and reporting a
false total.

---

## Notes for the plans that follow

- **10-07 onward** inherits `PREV_FILES 78` / `PREV_TESTS 802` / `PREV_E2E 97` / `BASE_CHECK 575`.
- **10-07 owns the whole URL migration.** `LEGACY_TAG_MAP` is declared and bounded here and read
  nowhere: `?tag=` to `?for=`/`?feels=`, and the ruling that an **unmapped** value becomes `?q=`
  rather than being dropped, are entirely 10-07's. `query.ts` is untouched by this plan.
- **`chipTags()` is deprecated with a named executioner.** Delete it in 10-07 together with the
  outsider chip in `BrowseToolbar.svelte:49-52` and `filter.spec.ts`'s `RECORDED.chips` /
  `chipCounts`. The equality assertion added to test 5 is the evidence that the swap is safe on
  today's data; run it once before deleting.
- **`disabledTags()` stays and its narrowing is yours.** Under OR-within / AND-across a chip is
  disabled only when it would return zero given the *other* facet's active set.
  `e2e/browse.e2e.ts:402` asserts at least one chip is disabled beside an active one and is green
  under the current AND predicate; check it survives the new one.
- **`e2e/browse.e2e.ts` still speaks `?tag=` and `tag-<term>` in thirteen places**, every one of them
  on `playable` — literally at `:445`, `:464`, `:941`, `:945`, `:953`, `:956`, `:961`, `:969`,
  `:974`, `:977`, and through its `TAG` constant at `:1152`, `:1161`, `:1197`. `playable` survives as
  a `FEELS` term, which is why they are all green today; all thirteen move with the URL migration.
- **A new entry must carry exactly three terms from the sixteen** — one `FOR`, two `FEELS`.
  `facets.spec.ts` test 2 names the entry and the offending word in both directions, and
  `copy.spec.ts` test 3 says the same thing against `CATALOG`. An entry that cannot be described with
  the sixteen is evidence the vocabulary is wrong, not that the entry needs a new word.
- **`RETIRED_VOCABULARY` never grows.** It is history, it bounds `LEGACY_TAG_MAP`, and it is the only
  record left of who carried what before the re-cut.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 6 is complete. D-10 is met as data and as gates: the vocabulary is sixteen closed terms in two
declared facets, every one of the thirty-six entries carries exactly three, no term matches a single
entry, no term is unused, and the chip rule is a membership test that cannot drift as the catalog
grows. Nothing was rendered — the two toolbar rows, the URL parameters, the sort removal and the
card's three chips are 10-07's, and everything it needs is declared, tested and import-free.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

Both created files and all thirty-five modified files are on disk, and all three commit hashes
resolve in `git log`: `1813aa3`, `2ac9b31`, `340618c`.

Every count, histogram, exit code, sha256, wall clock and failure message quoted above was read from
a runner's, a build's or a probe script's own output in this session. The one place this plan's
result disagrees with its own verification list - the retired-vocabulary grep, which returns three
comment lines rather than nothing - is reported hit by hit with a verdict on each, and the stricter
grep over the data alone is empty.
