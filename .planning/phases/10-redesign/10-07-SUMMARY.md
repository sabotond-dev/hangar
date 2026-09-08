---
phase: 10-redesign
plan: 07
subsystem: browse
tags:
  [
    d-11,
    a-19,
    a-20,
    a-22,
    g-10,
    facet-rows,
    url-migration,
    cat-02,
    cat-03,
    cat-04,
    sort-removal,
  ]

requires:
  - phase: 10-redesign
    plan: 06
    provides: PREV_FILES 78 / PREV_TESTS 802 / PREV_E2E 97 / BASE_CHECK 575, the closed sixteen, and LEGACY_TAG_MAP with all fifty-five keys
provides:
  - "src/lib/ui/FacetRow.svelte - one captioned facet row in two modes: a checkbox group on /browse/, a link row on /, each a role=group with an aria-labelledby derived from the facet's name, 44px on BOTH axes per member"
  - "BrowseSort is two: featured and name. newestOrder, orderFor's middle branch and the NEWEST e2e arm are gone, and ?sort=newest falls back silently with a test that says so"
  - "addedAt has left ListingEntry and all thirty-six restatements in listing.ts; no entry file was touched and catalog.spec.ts still holds the field on the catalog entry"
  - "BrowseQuery is { sort, q, for, feels }; ?for= and ?feels= are the written address and ?tag= is read-only for one release. G-10 rules the four ways an inbound tag can go and the ?q= precedence the spec left open"
  - "filterListing takes an ActiveFacets and applies OR-within / AND-across; chipTags() and the outsider chip are deleted; disabledTags() survives with a narrowed predicate that takes the row it is asked about"
  - "The front door carries a FOR link row: ten static <a href=\"/browse/?for={term}\"> in build/index.html, front-door.ts still import-free, the ring still at eight"
  - "PREV_FILES 78, PREV_TESTS 801, PREV_E2E 97, BASE_CHECK 576 - the carry-forward block for 10-08 onward"
affects: [10-08, 10-13, 10-14, browse, front-door, url-migration]

tech-stack:
  added: []
  patterns:
    - "A RESTATEMENT WITH A GATE beats a widened import scan: filterListing restates matchesFacets rather than importing it, and filter.spec.ts runs both over every selection it tests and asserts they agree entry by entry - the same shape sort.ts uses for index.ts's nameAsc"
    - "An assertion that INVERTS is stronger evidence than one that survives: restoring the old intersection expectation on playable + generative goes red with 'Expected < 13, Received 21', which proves both terms landed in FEELS rather than merely that the new assertion passes"
    - "A read-only legacy parameter needs a WRITE on arrival to be a migration rather than a translation: the address is canonicalised once through the existing 500 ms trailing timer, so a shared ?tag= link stops saying ?tag= the moment it lands"
    - "A key that is PRESENT with an undefined value and a key that is ABSENT are different rulings: the first becomes ?q=, the second is dropped under W-12 unamended"
    - "A negative check can fail to fire and still be worth taking: the gate the plan named for browse-webkit.e2e.ts does not cover e2e/ at all, which is a finding rather than a pass"

key-files:
  created:
    - src/lib/ui/FacetRow.svelte
  modified:
    - src/lib/browse/sort.ts
    - src/lib/browse/sort.spec.ts
    - src/lib/browse/query.ts
    - src/lib/browse/query.spec.ts
    - src/lib/browse/filter.ts
    - src/lib/browse/filter.spec.ts
    - src/lib/browse/return.spec.ts
    - src/lib/catalog/listing.ts
    - src/lib/catalog/listing.spec.ts
    - src/lib/catalog/copy.spec.ts
    - src/lib/ui/BrowseToolbar.svelte
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/browse-ui.spec.ts
    - src/routes/browse/+page.svelte
    - e2e/browse.e2e.ts
    - e2e/browse-webkit.e2e.ts
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "G-10's fourth case is a ruling this plan added: a ?tag= value that is not a KEY of LEGACY_TAG_MAP is dropped under W-12 unamended, because no link this site ever produced can name it. Only a key with an explicit undefined - a word the site really shipped - becomes ?q=. That is exactly the distinction 10-06 wrote the thirty-three explicit undefineds for"
  - "The address is canonicalised ONCE on arrival, through the existing 500 ms trailing timer rather than a write in onMount, because replaceState throws before Kit's router has started. Without it ?tag=playable would have stayed in the address bar for the whole visit and :1058 could not have been a migration proof"
  - "filterListing RESTATES matchesFacets rather than importing it. The plan asked for both 'through matchesFacets' and 'filter.ts keeps its single import type'; those collide, and the standing rule wins, with an equivalence gate added so the restatement cannot drift"
  - "disabledTags() takes the facet it is asked about rather than deriving it from the term, which keeps facetOf() - and therefore a second specifier - out of filter.ts"
  - "The FOR row sits below the fidelity line rather than between the plate and it, because both of those are Coverflow.svelte's own fragments and that file is not edited. Recorded as a deferred item rather than smoothed over"
  - "filter.spec.ts's RECORDED loses chips and chipCounts - a census of a derivation that no longer exists - and gains counts, keyed by term in the row's own order, which is a fact about the DATA rather than a second declaration of the row"

patterns-established:
  - "When a plan's two instructions collide, the standing rule wins and the collision is reported with the gate that makes the resolution safe"
  - "A negative check whose named gate does not exist is reported as a finding, the real gate is located by measurement, and the absence is logged as a deferred item"

requirements-completed: [CAT-02, CAT-03, CAT-04]

duration: 70min
completed: 2026-09-08
---

# Phase 10 Plan 07: Sixteen chips in two rows, two sorts, and one URL migration Summary

**The browse toolbar's single count-derived tag row became two declared facet rows of sixteen chips
with the outsider chip and `chipTags()` deleted beside it; the Newest sort, `newestOrder` and
`addedAt`'s browse projection are gone; `?tag=` is read-only for one release and an unmapped value
lands in `?q=` rather than on the floor; and the front door gained ten static `FOR` links. Six e2e
sites were repaired inside their own titles and the e2e total is unchanged, proved by
`grep -c "test("` at 11 and 3 before and after rather than by argument. 78 files / 801 tests
(+0 / −1), 97 e2e (+0), check 576 (+1).**

## Performance

- **Duration:** ~70 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files created:** 1 · **Files modified:** 17 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                                            |
| ----------------- | ---------- | ---------- | ------------------------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                                 |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                                 |
| `PREV_FILES`      | **78**     | **78**     | **+0** — no spec file created, none deleted                                     |
| `PREV_TESTS`      | **802**    | **801**    | **−1** — `sort.spec.ts` 6 → 5, and nothing else moved                           |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | **not re-run, by derivation** — see below                                       |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | frozen at 10-01                                                                 |
| `PREV_SWEEP_WALL` | **123 s**  | **123 s**  | not carried from this plan                                                      |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                                 |
| `PREV_E2E`        | **97**     | **97**     | **+0** — re-measured at `--workers 3`, 97 passed, exit 0, 1.9 min               |
| `BASE_CHECK`      | **575**    | **576**    | **+1**: `src/lib/ui/FacetRow.svelte`. Always 0 / 0                              |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                                          |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                                       |

`npm run check` prints one line:
`COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

`npm run test:quick | node scripts/check-counts.mjs 78 801` →
*"observed 78 files, 801 tests passed, 1 todo … matches the expected counts"*.

**The sweep was NOT run, and the derivation is written out rather than the number assumed.** The
sweep project's inputs are `src/vendor/botor/tests/pad-invariants.test.js` and
`src/**/*.sweep.spec.ts`, which is three files: `lua-entries.sweep.spec.ts`,
`stamp-roundtrip.sweep.spec.ts` and `reachability.sweep.spec.ts`. Their imports were read: all three
reach `CATALOG` — the entry files — and **not one of them names `listing`, `sort`, `filter`,
`query` or `facets`**. This plan touched no entry file, nothing under `src/vendor/`, and nothing in
`pad`, `stamp` or `knobs`. The 908-character ladder cannot have moved. (10-06 ran it because it
edited twenty-seven entry files; this plan edited none.)

---

## THE E2E DELTA IS 0, AND IT IS COUNTED RATHER THAN ARGUED

`grep -c "test(" e2e/browse.e2e.ts e2e/browse-webkit.e2e.ts`:

| File                      | Before | After  |
| ------------------------- | ------ | ------ |
| `e2e/browse.e2e.ts`       | **11** | **11** |
| `e2e/browse-webkit.e2e.ts` | **3**  | **3**  |

`npx playwright test --workers 3` → **97 passed, exit 0, 1.9 min**, against `PREV_E2E` **97**.
Arithmetic: `BASE_E2E 89 + 8` from waves 1–6 `+ 0` here `= 97`. The phase total after this plan
remains on course for **`BASE_E2E + 12`**.

Every Playwright count in this document comes from a run written to a file and read to completion.
No run was piped through `grep | head`, which 10-05 measured truncating via SIGPIPE and reporting a
false total. `test-results/` was removed by hand after each run and `git status --porcelain` is
empty.

**`browse.e2e.ts`'s round-trip test did not flake this time.** 10-05 and 10-06 both recorded it
failing once under full-suite load at the card count, racing the toolbar's 500 ms trailing address
projection between `fill()` and `click()`. It passed on the first attempt in both the targeted run
(17 passed) and the full suite (97 passed), and it now carries a NAME sort and a `feels` chip rather
than a retired sort and a tag. The race is not fixed and is not claimed to be.

---

## THE SIX SITES, EACH AT ITS REAL LINE

**Every citation in the plan was re-measured with `grep -n` before it was edited, and five of the
seven had moved.** The plan's own instruction — "a stale number is how a rewrite silently misses its
target" — earned its place.

| # | Plan's citation | Measured at | What it became |
| - | --------------- | ----------- | -------------- |
| 5a | `browse.e2e.ts:268` / `:289-311` | title at **`:276`**, NEWEST arm at **`:297-322`** | The arm is deleted and replaced by a named retirement block. The title keeps its other three arms — FEATURED on arrival, NAME, FEATURED again — and is now at `:283` |
| 5b | `browse.e2e.ts:121` | **`:125`** | `orderOf(sort: BrowseSort)`. The type flows from `sortListing`'s signature instead of restating it |
| 5b | `browse-webkit.e2e.ts:79` | **`:79`** — the one citation that was exact | Same narrowing. Its two call sites ask for `featured` and `name` only, so no assertion moved |
| 5c | `browse.e2e.ts:332-404` | **`:331-434`** (`:364`'s W-04 comment at **`:369`**, `both` at **`:387`**, `toBeLessThan` at **`:391`**, the disabled assertion at **`:400-405`**) | Rewritten: union within `FEELS`, a cross-facet AND on `modulation`, W-04 amended to A-19 by name, the disabled selector widened to the two facet rows |
| 5d | `browse.e2e.ts:852-888` (`:856`, `:867`, `:880`, `:885`) | test at **`:916`**; URL asserts at **`:945`**, **`:956`**, **`:974`**; cold `goto` at **`:969`** | The three `toHaveURL` become `?feels=playable`; the `goto` keeps `?tag=playable` and now carries a DO-NOT-FIX paragraph saying why |
| 5e | `browse.e2e.ts:1029-1120` (`:1048`, `:1059`, `:1070`, `:1072`, `:1105`) | test at **`:1119`**; `filterListing` at **`:1137-1140`**; NEWEST click at **`:1148`**; URLs at **`:1159`**/**`:1161`**; re-assert at **`:1194`** | Restated inside its own title: two-list arity, NAME sort, `feels=${TAG}` |
| 5f | `browse.e2e.ts:437` | title at **`:437`**, the `coldGoto` at **`:445`** | **Examined and left.** Nothing asserted, one comment added recording why |

**The BrowseToolbar citation moved too.** The plan names `BrowseToolbar.svelte:49-52` as "the
outsider chip branch". `:44-52` is the *header paragraph* describing it; the branch itself was the
`const row = $derived([...standing, ...tags.filter(...)])` at **`:172-179`**. Both are gone.

**And `sort.spec.ts`'s three citations had all moved:** `:82` → **`:94`** (the hand-written literal),
`:125` → **`:136-138`** (the pair-sweep expectation, byte-untouched), `:179` → **`:191`** (the NEWEST
date-block test, retired by name).

---

## THE `?tag=` MIGRATION MATRIX — SIX CASES, EVERY ONE ASSERTED

| Address | Output | Rule |
| ------- | ------ | ---- |
| `?tag=drums` | `for: ["drums"]`, `q: ""` | MAPPED, clause 1 — a surviving word maps to itself |
| `?tag=sequencer` | `for: ["sequencing"]` | MAPPED, clause 2 — a fold |
| `?tag=hypnotic` | `feels: ["generative"]` | MAPPED into the OTHER facet, which is why the parser asks the vocabulary rather than assuming a row |
| `?tag=looper` | `for: []`, `feels: []`, `q: "looper"` | SHIPPED BUT UNMAPPED → the search query. 10-UI-SPEC §9.4's own worked example |
| `?tag=looper&q=aurora` | `q: "aurora"`, `looper` **gone** | **The explicit query wins.** Asserted in both address orders, so the precedence is not an accident of position |
| `?tag=looper&tag=lighting` | `q: "looper lighting"` | Two unmapped, one space, ADDRESS order — and `?tag=lighting&tag=looper` gives `"lighting looper"` |
| `?tag=drums&tag=looper` | `for: ["drums"]`, `q: "looper"` | Mixed: each goes where it belongs |
| `?tag=arpeggio` | the DEFAULT query, unchanged | **NEVER A TAG.** Not a key of `LEGACY_TAG_MAP`, so no link this site produced can name it. Dropped under W-12 unamended |
| `?sort=newest` | `sort: "featured"`, silently | D-11's fallback, and it took `&feels=playable` with it unharmed |
| `?q=+++&tag=looper` | `q: "looper"` | A whitespace-only query is EMPTY, so the retired tag still lands |

**The question the spec left open, answered from an observed run:** `?tag=looper&q=aurora` →
**`aurora` survived**, `looper` did not reach `q` and did not become a chip. A plan that guessed here
would have broken a link in the least visible way available — by silently replacing the visitor's own
search with a word from an address they inherited.

**The fourth case is a ruling this plan added, and it is the one 10-06 built the table for.**
`"looper" in LEGACY_TAG_MAP` is `true` with `LEGACY_TAG_MAP.looper === undefined`;
`"arpeggio" in LEGACY_TAG_MAP` is `false`. All three facts are asserted beside the two outcomes, so
the distinction is a test rather than a comment. Without it, `?tag=<anything>` would have become a
search query, and a third party's stray `tag` parameter would have silently filtered the shelf.

**`serialiseBrowseQuery` never writes `tag` again**, asserted over every one of the five round-trip
states rather than on one, plus `serialiseBrowseQuery(parse("tag=drums&tag=looper"))` →
`"q=looper&for=drums"`: a legacy address is re-written into the new shape, never echoed.

---

## THE `:331-434` REWRITE — THE ASSERTION THAT INVERTED

Every number below was measured through the shipped modules (`filterListing`, `matchesFacets`,
`matches`) over the shipped `LISTING`, not off the assignment table.

| Quantity | Value | Entries |
| -------- | ----- | ------- |
| `playable` alone | **13** | — |
| `generative` alone | **13** | — |
| `playable` ∪ `generative` (one facet, OR) | **21** of 36 | — |
| `playable` ∩ `generative` (what the old assertion asserted) | 5 | — |
| `modulation` × the union (across facets, AND) | **4** | radar, arc, ghost, shuttle |
| `sequencing` × the union (the stated fallback) | 3 | euclid, sonar, steps |
| `mixing` / `shortcuts` / `pointing` × the union | **0 / 0 / 0** | — the three that render `disabled` |

The block now presses `playable`, asserts 13; presses `generative`, asserts the **union** at 21 with
the guard `expect(union.length, "the union is larger than either chip alone").toBeGreaterThan(13)`
and a second guard that 21 < 36 so the first is not vacuous; then presses the `FOR` chip
**`modulation`** and asserts the **intersection** at 4, with guards that it narrows the union and
does not empty the grid; then presses `modulation` again and watches the grid return to 21, which is
also the proof that removing an active chip is clicking it again.

**`:369`'s `05.1-UI-SPEC W-04` citation is amended by name, not deleted.** The paragraph keeps
W-04's argument, states that it was RIGHT about the data it was written against — 32 of the 41 tags
then shipped sat on exactly one configuration, so a union would have made a second chip ADD one card
— and records that D-10's re-cut inverted the argument and A-19 supersedes the rule. Its stale
opening sentence, *"playable is carried by four entries and generative by three"*, is re-derived to
13 and 13 in place.

**The disabled-chip assertion survived, and it was verified rather than trusted.** With
`feels = [playable, generative]` active, three of the ten `FOR` terms land on zero entries, so
`disabledTags()` still fires. The selector moved from `[data-testid="browse-tags"]` — which retired
with the count-derived row it wrapped — to the two facet rows. A **second** assertion was added
beside it: `[data-testid="facet-feels"] input:disabled` must be **0**, because under OR-within a chip
beside an active sibling can only widen the result and can never be dead. That is the narrowed
predicate's own proof, asserted from the browser, and it is the half that would have gone unnoticed
if the old assertion had merely been left to pass.

---

## THE TWO SEARCH ANCHORS, RE-VERIFIED WITH THEIR COUNTS

| Anchor | Where | Result |
| ------ | ----- | ------ |
| `?q=aurora` | `browse.e2e.ts:553` — the live region's silence-on-arrival proof | **1** result: `aurora` |
| `ghost` | `filter.spec.ts` — `filterListing(LISTING, "ghost", NO_FACETS)` | **1** result: `ghost` |

Both measured through the shipped `matches()` over the shipped `LISTING` after the re-cut, and both
tests are green. The haystack `matches()` folds is name + description + three tags rather than three
or four, and neither anchor moved.

---

## `expectedIds.length` AT THE ROUND TRIP, AND THE GUARDS THAT DEPEND ON IT

`filterListing(LISTING, "pad", { for: [], feels: ["playable"] })` sorted by NAME is **7** entries:
`ninepads, chorus, lattice, slam, keys, etch, life`. The non-vacuity guards at `:1241-1245` require
`> 1` and `< 36`; 7 satisfies both with room, and the number was **measured** rather than inferred
from the old test happening to pass — `QUERY = "pad"` intersected with a `feels` term is a different
question than it was with a tag, even though the answer here is the same set.

The sort became **NAME** rather than FEATURED deliberately: FEATURED is the shelf's own order, so
the ordering assertion at `:1254` would have been weaker under it.

---

## SCREEN 2c, ITEMISED AS UNCHANGED

`CatalogCard.svelte` is **byte-untouched by this plan** — it is not in the diff at all. Every 05.1
property therefore holds by construction rather than by inspection, and each is named because "the
card is unchanged except" is a claim worth itemising:

| Property | State |
| -------- | ----- |
| the reserved 16px `FEATURED` band | unchanged |
| the arrowless name plate as the card's ONE link | unchanged — `browse-ui.spec.ts` still asserts exactly one `<a>` per card |
| the whole-card `::after` overlay over a `position: relative` card | unchanged |
| `aria-hidden="true"` on the pad wrapper | unchanged — still asserted structurally |
| the never-truncated description | unchanged |
| the quiet non-interactive chips at 24.4px, spans and never controls | unchanged |
| `SIDE_INTERVAL_MS = 50` paint cadence | unchanged |
| the two off-nominal states (the quiet line, the demo-touch note) | unchanged |
| the resting-black note | already gone (R-10, 10-05) |
| **the number of chips** | **three** — and it needed no edit: the card renders `entry.tags`, which 10-06 made exactly three for every entry. The "three or four" split ended with the data, not with the markup |

---

## THE FRONT DOOR

- **Ten `<a>` in `build/index.html`, as static markup**, in `FOR_TERMS` order:
  `./browse/?for=modulation`, `show`, `keys`, `mixing`, `sequencing`, `shortcuts`, `pointing`,
  `play`, `drums`, `clips`. Counted off the prerendered file after `npm run build`.
- **`src/lib/catalog/front-door.ts` declares zero specifiers** — `grep -c 'from "'` returns **0** —
  and `git diff --stat HEAD -- src/lib/catalog/front-door.ts` is **empty**. `front-door.spec.ts` is
  untouched and green: the ring is still **8**, `EXCLUDED_FROM_ROW` still **28**, the partition still
  exact.
- **`src/lib/ui/Coverflow.svelte` and `src/vendor/` are byte-untouched**, proved with
  `git diff --stat HEAD -- src/vendor/ src/lib/ui/Coverflow.svelte src/lib/catalog/front-door.ts`,
  which returns nothing.

---

## THE FIVE NEGATIVE CHECKS — AND THE ONE THAT DID NOT FIRE

| # | Perturbation | Gate | Result |
| - | ------------ | ---- | ------ |
| 1a | `"newest"` restored to `BROWSE_SORTS` and `BrowseSort`, `newestOrder` NOT restored | `sort.spec.ts` test 1 | **red** at `:96`: *"the two sorts, in the toolbar's order: expected [ 'featured', 'newest', 'name' ] to deeply equal [ 'featured', 'name' ]"* |
| 1b | the same, with the hand-written literal ALSO widened to three | `sort.spec.ts` | **5 passed** — the pair sweep self-adjusted to 3 × 36 × 35 = **3,780** with no edit |
| 2 | `addedAt: "2026-09-02"` added back to ONE `LISTING` entry | field walk / type check | **the field walk PASSED (5/5)**; `npm run check` caught it: *"listing.ts 125:5 Object literal may only specify known properties, and 'addedAt' does not exist in type 'ListingEntry'"* |
| 3 | an unmapped `?tag=` dropped instead of landing in `q` | `query.spec.ts` | **red**, naming `looper`: *"?tag=looper must land as ?q=looper: expected { q: '' } to deeply equal { q: 'looper' }"* — and a second test red on the re-write assertion |
| 4 | `FacetRow`'s `aria-labelledby` removed | `browse-ui.spec.ts` test 5 | **red**: *"a facet row declares role=\"group\" without an aria-labelledby, so a screen reader announces a boundary and never says which facet it is"* |
| 5 | `min-inline-size: auto` on a `FacetRow` member | `browse-ui.spec.ts` test 2 | **red**, naming the class: *`src/lib/ui/FacetRow.svelte -> .link`* |
| 6 | the shipped **intersection** expectation restored at the two `FEELS` chips | `browse.e2e.ts` | **red**: *"the intersection is smaller than either chip alone — Expected: < 13, Received: 21"* |
| 7 | `browse-webkit.e2e.ts:79`'s three-member literal union restored | `npm run check` | **STAYED GREEN.** See below |

**Check 1's asymmetry is exactly what §9.5 predicted, and it was observed in two steps.** The
hand-written literal at `:94` fails first and aborts the test, so the self-adjusting sweep at
`:136-138` was observed by widening the literal too and re-running: 5 passed, with `compared`
reaching 3,780 rather than 2,520. `:136-138` is byte-untouched in the shipped tree. Both files
restored by their own inverse edit, `sha256` identical before and after:
`sort.ts 8a5684be…`, `sort.spec.ts 8faf5f18…`.

**Check 2 answered its own question the way the plan hoped it would not have to guess.** The field
walk is now blind to `addedAt` — it has one fewer field to compare and cannot notice an extra one —
so the TYPE CHECK is the gate, and it names the file and the line. The field left the projection
WITH a gate, and the gate is the excess-property check rather than the test.

**Check 6 is the one that proves the inversion was understood rather than merely edited.** On the old
vocabulary that assertion was TRUE. It is now false by 21 against 13, which is only possible if
`playable` and `generative` both landed in `FEELS` — so 10-06's assignment table is confirmed by an
assertion failing in the right direction, not by one passing.

**Check 7 did not fire, and that is a finding rather than a pass.**

> `npm run check` printed `COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` with
> `orderOf` reverted to `"featured" | "newest" | "name"` in `e2e/browse-webkit.e2e.ts`.

The plan's retraction is **right about the file and wrong about the gate**. The file does name
`newest` at `:79`, it is in `files_modified`, and it was edited. But `.svelte-kit/tsconfig.json`'s
`include` globs are `ambient.d.ts`, `env.d.ts`, `non-ambient.d.ts`, `./types/**/$types.d.ts`,
`../vite.config.*`, `../src/**`, `../test/**` and `../tests/**` — **`e2e/**` is in none of them** —
and ESLint's type-aware block is scoped to `**/*.svelte`. Nothing in `src/` imports an e2e file, so
nothing pulls it into the program either.

The gate exists and is simply not wired. Run directly, it says precisely what the plan expected:

```
$ npx tsc --ignoreConfig --noEmit --strict e2e/browse-webkit.e2e.ts
e2e/browse-webkit.e2e.ts(88,24): error TS2345: Argument of type
  '"featured" | "name" | "newest"' is not assignable to parameter of type 'BrowseSort'.
  Type '"newest"' is not assignable to type 'BrowseSort'.
```

…and reports nothing once the narrowing is restored. So the narrowing DID reach `BrowseSort` — the
sort is fully retired, which is what the check was really asking — and what the check discovered
instead is that `e2e/` sits outside every type gate this repository runs. Playwright transpiles with
esbuild and never type-checks, so `orderOf("newest")` would have fallen through `orderFor()` to the
NAME comparator and the assertion would have passed against the wrong order. Logged in
`deferred-items.md` with the two ways to wire it.

`browse-webkit.e2e.ts` restored byte-identical: `sha256 bb26556f…` before and after.
`browse.e2e.ts` likewise: `57776f7b…`.

---

## Task Commits

1. **Task 10-07-01: D-11 — the Newest sort is removed, and `addedAt` leaves the browse projection** — `aba34b0` (refactor), 4 files.
2. **Task 10-07-02: `?for=` and `?feels=`, and G-10 — no shared link dropped on the floor** — `f178f20` (feat), 4 files.
3. **Task 10-07-03: two facet rows, the `FOR` link row, and six e2e sites repaired inside their own titles** — `ef1c229` (feat), 11 files.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — Prettier and ESLint |
| `npm run test:quick \| node scripts/check-counts.mjs 78 801` | *"observed 78 files, 801 tests passed, 1 todo … matches the expected counts"* |
| `sort.spec.ts` / `listing.spec.ts` / `catalog.spec.ts` | **5** / **5** / **10** |
| `query.spec.ts` / `filter.spec.ts` / `facets.spec.ts` | **5** / **6** / **4** — none moved |
| `browse-ui.spec.ts` / `copy.spec.ts` / `return.spec.ts` | **6** / **5** / **4** — none moved |
| `npm run build` | green, exit 0; `source-f178f206….tar.gz` 1,299 KB |
| ten `<a href="./browse/?for=…">` in `build/index.html` | **10**, in `FOR_TERMS` order |
| `npx playwright test e2e/browse.e2e.ts e2e/browse-webkit.e2e.ts --workers 3` | **17 passed**, exit 0, 39.0 s, first attempt |
| `npx playwright test --workers 3` | **97 passed**, exit 0, 1.9 min — `PREV_E2E` unchanged |
| `grep -c "test(" e2e/browse.e2e.ts e2e/browse-webkit.e2e.ts` | **11** and **3**, before and after |
| `git diff --stat HEAD -- src/vendor/ src/lib/ui/Coverflow.svelte src/lib/catalog/front-door.ts` | **empty** |
| `grep -c 'from "' src/lib/catalog/front-door.ts` | **0** |
| `grep -rn "newest\|newestOrder\|chipTags" src e2e` | **not empty — every hit classified below** |
| `git status --porcelain` | empty. `test-results/` removed by hand after every run |

### The verification grep, hit by hit

The plan asks that this grep return "only deliberate history in comments". It very nearly does, and
the exceptions are live tests rather than leftovers, so every hit is classified rather than the
pattern narrowed until it passed.

| Hits | Where | Verdict |
| ---- | ----- | ------- |
| 6 × `chipTags` | `facets.ts:5`, `filter.ts:4`, `filter.spec.ts:19,121,450`, `copy.spec.ts:355`, `BrowseToolbar.svelte:60` | **Comments only, all naming the deleted function as history.** Zero call sites; the symbol is not exported and not imported anywhere |
| 3 × `newest` | `query.spec.ts:179,184,188` | **Live assertions, and required.** `?sort=newest` is the one retired value really out there on shared links, and D-11 says it must fall back SILENTLY. A test is the only way that rule is enforced |
| 2 × `newest` | `sort.spec.ts:195-196` | The retirement block quoting what 09-02's assertion said |
| 1 × `newest` | `query.ts:141` | The fallback's own prose reason |
| 1 × `newest` | `+page.svelte:439` | The canonicalisation comment, naming the retired sort as a case it handles for free |
| 2 × `newest` | `browse.e2e.ts:128`, `browse-webkit.e2e.ts:82` | The two `orderOf` doc comments recording what the literal union used to say |
| 6 × `newest` | `src/lib/sim/*` | **Unrelated and out of scope.** "MOVEs coalesce to the newest position" — the touch sampler's English, nothing to do with a sort |

---

## Decisions Made

1. **G-10 has a fourth case, and it is the one the explicit-`undefined` table was built for.** A
   `?tag=` value that is not a KEY of `LEGACY_TAG_MAP` is dropped under W-12 unamended; only a key
   whose value is `undefined` — a word the site really shipped — becomes `?q=`. Without that
   distinction any third party's stray `tag` parameter would silently filter the shelf.
2. **The address is canonicalised once on arrival**, through the existing 500 ms trailing timer
   rather than a write in `onMount`, because `replaceState` throws before Kit's router has started.
3. **`filterListing` restates `matchesFacets` rather than importing it**, with an equivalence gate
   in `filter.spec.ts` that runs both over every selection tested.
4. **`disabledTags()` takes the facet it is asked about** rather than deriving it from the term,
   which keeps `facetOf()` — and a second specifier — out of `filter.ts`.
5. **The `FOR` row sits below the fidelity line**, because the plate and that line are
   `Coverflow.svelte`'s own fragments and that file is not edited.
6. **`RECORDED.chips` and `RECORDED.chipCounts` retire and `RECORDED.counts` replaces them** — a
   fact about the data rather than a second declaration of the row.
7. **CLEAR FILTERS became its own band** beneath the two rows: appended to `FEELS` it would read as a
   seventh `FEELS` chip.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] The plan's two instructions for `filter.ts` collide, and the standing rule
wins**

- **Found during:** Task 10-07-02, item 4
- **Issue:** The task says `filterListing` applies OR-within / AND-across "**through
  `matchesFacets`**". The plan's `<standing_rules>` say `filter.ts` keeps "their single `import type`
  and no other specifier. Their source scans say so." A runtime `import { matchesFacets } from
  "./facets"` is a second specifier AND a non-type one, so `filter.spec.ts` test 1 would go red and
  the standing rule would be broken.
- **Fix:** `filterListing` **restates** the three-line predicate, exactly as `sort.ts` restates
  `index.ts`'s module-private `nameAsc`, with the reason written beside it. A restatement with no
  gate is a divergence waiting to happen, so `filter.spec.ts` gained `agreesWithFacets()`: every
  selection the file tests is run through **both** `filterListing` and `matchesFacets` and asserted
  to agree entry by entry, naming the selection in its message.
- **Files modified:** `src/lib/browse/filter.ts`, `src/lib/browse/filter.spec.ts`
- **Committed in:** `f178f20`

**2. [Rule 2 — missing critical functionality] `:1058`'s migration proof needs a WRITE, not just a
read**

- **Found during:** Task 10-07-03, item 5d
- **Issue:** The plan requires the cold `goto` at `:969` to stay on `?tag=playable` so that the
  assertion after the Back becomes `?feels=playable`. Nothing in the shipped page would have made
  that true: the seed reads the address once and the address is only written by a control. A visitor
  arriving on a legacy link would have seen the right shelf under an address bar still saying
  `?tag=playable`, for the whole visit, on a link they can copy and send onwards — which is the same
  defect 05.1-09 logged in the other direction.
- **Fix:** `onMount` compares the address the document was entered with against the one the state
  composes, and calls the existing `scheduleAddress()` when they differ. It goes through the 500 ms
  trailing timer rather than writing inline because `replaceState` throws before Kit's router has
  started, and the timer coalesces with an early chip press. A canonical arrival writes nothing, so
  `/browse/` and `/browse/?q=aurora` are untouched and the live region's silence-on-arrival proof at
  `:553` is unaffected. A retired `?sort=newest` is canonicalised by the same line for free.
- **Files modified:** `src/routes/browse/+page.svelte`
- **Committed in:** `ef1c229`

**3. [Rule 3 — blocking] `copy.spec.ts` imports `chipTags` and is not in the plan's file list**

- **Found during:** Task 10-07-03, at the first `npm run check` after the toolbar landed
- **Issue:** *"Module '$lib/browse/filter' has no exported member 'chipTags'"* — `copy.spec.ts:42`
  imports it for its census table's "standing chips" line. The plan names `filter.spec.ts`'s
  `RECORDED` as `chipTags()`'s last dependant; there was a second.
- **Fix:** the census reads `[...FOR_TERMS, ...FEELS_TERMS]` — the declared row — with a comment
  saying the meaning is unchanged and the derivation is what retired. `copy.spec.ts` stays at **5**
  tests and its singleton line still prints 0 by subtraction.
- **Files modified:** `src/lib/catalog/copy.spec.ts`
- **Committed in:** `ef1c229`

**4. [Rule 2 — missing critical functionality] `FacetRow.svelte` would have escaped every browse
structural gate**

- **Found during:** Task 10-07-03, item 1
- **Issue:** `browse-ui.spec.ts`'s `browseFiles()` is a NAMED list — card, grid, toolbar, chip,
  link, page, plus `src/lib/browse/*.ts`. A new component is not picked up by it, so the phase's
  newest browse component would have been outside the popularity-word scan, the hex-colour scan, the
  44px floor and the role rules. The plan's own negative checks assume it is inside them.
- **Fix:** `FACET` joins the list the same way `LINK` did, behind the same `existsSync` skip. Two
  assertions were added inside existing tests (the file stays at **6**): the labelled-group check in
  test 5, and the both-axes 44px derivation from `device-ui.spec.ts:278-306` in test 2, scoped to the
  two components whose members are one short word wide.
- **Files modified:** `src/lib/ui/browse-ui.spec.ts`
- **Committed in:** `ef1c229`

**5. [Rule 1 — bug] `browse-ui.spec.ts`'s both-axes walk flagged `.sr-only`, which is the deliberate
opposite of a box**

- **Found during:** Task 10-07-03, first run of the new assertion
- **Issue:** It reported `src/lib/ui/TagChip.svelte -> .sr-only`. `sr-only` is the visually-hidden
  class on the real `<input>`; the 44px box and Phase 4's focus ring are drawn on the `<label>` around
  it, which is the relocation `Knob.svelte` makes and `TagChip.svelte`'s own header explains.
  Demanding a floor there would demand the one edit that would undo the relocation.
- **Fix:** one exclusion, `cls !== "sr-only"`, with the reason written beside it. It is the only
  exclusion, and the negative check confirms the assertion still fires on a real member.
- **Files modified:** `src/lib/ui/browse-ui.spec.ts`
- **Committed in:** `ef1c229`

**6. [Rule 1 — bug] `FacetRow`'s caption id captured only its initial value**

- **Found during:** Task 10-07-03, `npm run check`
- **Issue:** *"This reference only captures the initial value of `name`"* — `const CAPTION_ID` read a
  prop at component-init scope. One page renders both rows, so a stale id would have pointed a
  group's `aria-labelledby` at the other facet's caption.
- **Fix:** `$derived`. The reason is in a comment, and `browse-ui.spec.ts` now asserts the id is
  derived from `name` rather than merely present.
- **Files modified:** `src/lib/ui/FacetRow.svelte`
- **Committed in:** `ef1c229`

**7. [Rule 1 — bug] Two `return.spec.ts` fixtures asserted round trips over addresses the serialiser
can no longer emit**

- **Found during:** the plan's own verification greps
- **Issue:** `return.spec.ts:74` used `"/browse/?sort=newest&tag=drums"` and `:110` used
  `"/browse/?q=caf%C3%A9+noir&tag=gestural&tag=generative"` — a retired sort, a retired parameter and
  a word (`gestural`) D-10 retired entirely. Nothing was red: `return.ts` stores a string and hands
  it back and never parses it. But a round trip proved against an address nothing can produce is
  weaker evidence than one proved against an address the site writes.
- **Fix:** `"/browse/?sort=name&for=drums"` and `"/browse/?q=caf%C3%A9+noir&for=drums&feels=generative"`,
  each with a comment saying what moved and that `return.ts` itself is untouched. The file stays at
  **4** tests. One stale `?tag=drums` in a `+page.svelte` comment moved with them; the block at
  `:336-344` recording four MEASURED journeys on `?tag=playable` was **left verbatim**, because a
  measurement is history and rewriting it would be falsifying it.
- **Files modified:** `src/lib/browse/return.spec.ts`, `src/routes/browse/+page.svelte`
- **Committed in:** `ef1c229`

### Departures from the plan's letter, stated rather than smoothed

**8. The `FOR` row is below the fidelity line, not between the plate and it.** 10-UI-SPEC §9.1 and
the plan both put it between them. `.plate` and `.fidelity` are `Coverflow.svelte`'s own top-level
fragments — they become children of `FrontDoor.svelte`'s `.row` — and `Coverflow.svelte` is not
edited in this phase, so there is no seam to insert into from outside it. The row follows the
coverflow block at the same 32px rhythm. Everything else about it is the spec's: ten links, `FOR`
caption, both 44px axes, static markup, no import cost. Logged in `deferred-items.md`.

**9. Negative check 7's gate does not exist.** Reported in full above rather than as a pass, with the
real gate located by measurement and the absence logged as a deferred item.

**10. The sweep was not run**, by a derivation over the sweep project's actual inputs rather than by
assumption. Written out above.

---

**Total deviations:** 7 auto-fixed — 3 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
2 × Rule 3 (blocking) — plus three stated departures.
**Impact on plan:** four files outside the plan's list (`src/lib/catalog/copy.spec.ts`,
`src/lib/browse/return.spec.ts`, `deferred-items.md`, and `src/lib/browse/filter.spec.ts`'s new
equivalence gate, which the plan does name as a file). Nothing in the objective was dropped.

---

## Issues Encountered

**None that survived.** The round-trip e2e test that flaked once in each of 10-05 and 10-06 passed
first time in both runs here. Both Playwright runs completed; neither died mid-suite.

**One thing worth flagging for whoever owns the toolbar next.** The 500 ms trailing address
projection now has a second caller — the arrival canonicalisation — and both go through the same
timer, so they coalesce rather than racing. The known race is unchanged: a `fill()` immediately
followed by a `click()` in a test can still read a card count from before the query landed.

---

## Notes for the plans that follow

- **10-08 onward** inherits `PREV_FILES 78` / `PREV_TESTS 801` / `PREV_E2E 97` / `BASE_CHECK 576`.
- **`e2e/` is not type-checked by anything this repository runs.** If a later plan changes a shipped
  signature that `e2e/` names, `npm run check` will NOT catch it and Playwright will run the stale
  annotation silently. Until it is wired, run
  `npx tsc --ignoreConfig --noEmit --strict e2e/<file>.e2e.ts` by hand after any such change.
- **`?tag=` is read-only for ONE release.** The branch is in `parseBrowseQuery` and is three lines;
  the plan that retires it deletes the branch, the `legacy` member of `BrowseVocabulary`,
  `LEGACY_TAG_MAP` and `RETIRED_VOCABULARY` together, and the two e2e legs at `browse.e2e.ts:518`
  and `:1053` with them. Do not retire it piecemeal: `:1053` and `:518` are the migration proof and
  they are the only legacy addresses left in the suite.
- **`disabledTags()` is rare now, and `browse.e2e.ts` asserts BOTH halves.** At least one `FOR` chip
  dead beside two active `FEELS` chips, and **zero** `FEELS` chips dead beside them. If a later data
  change makes every `FOR` term reachable from every `FEELS` pair, the first of those goes red for a
  reason that is not a fault — and the message says so.
- **`addedAt` is on the catalog entry and on nothing else.** `catalog.spec.ts` holds its format and
  its parse. A plan that wants an arrival order back needs more than two useful dates first.
- **The chip testid is still `tag-{term}`** in both of `FacetRow`'s modes, so every shipped e2e press
  resolves and the front door's links are addressable the same way. The row testids are `facet-for`
  and `facet-feels`; `browse-tags` is gone.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything.

## Next Phase Readiness

Wave 7 is complete. CAT-02 is amended to two sorts and asserted at two; CAT-03 and CAT-04 are
rendered as two captioned facet rows of sixteen chips with OR-within / AND-across proved from a
browser in both directions; A-20's migration is shipped with every case tested and the precedence
the spec left open ruled and asserted; A-22's `FOR` link row is static markup in the prerendered
front door with the ring still at eight and `front-door.ts` still import-free.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

The one created file and all seventeen modified files are on disk, and all three commit hashes
resolve in `git log`: `aba34b0`, `f178f20`, `ef1c229`.

Every count, line number, exit code, `sha256`, wall clock and failure message quoted above was read
from a runner's, a build's, a compiler's or a probe's own output in this session. The two places this
plan's result disagrees with its own instructions - negative check 7's gate, which does not cover
`e2e/`, and the `FOR` row's position, which `Coverflow.svelte`'s immunity forces - are reported in
full with the measurement behind each rather than smoothed over. The one verification grep that does
not come back clean is reported hit by hit with a verdict on every hit.
