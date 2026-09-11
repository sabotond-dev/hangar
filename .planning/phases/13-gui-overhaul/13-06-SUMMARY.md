---
phase: 13-gui-overhaul
plan: 06
subsystem: store
tags:
  [
    local-storage,
    guard,
    pitfall-9,
    schema,
    version-in-key,
    version-in-body,
    envelope,
    drafts,
    saved-copy,
    favorites,
    drop-on-read,
    recent,
    intro-flag,
    motion-key,
    negative-check,
    counts,
    keep-01,
    keep-02,
    keep-03,
    keep-05,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 05
    provides: "PREV_FILES 87 / PREV_TESTS 892 (+1 todo) / e2e 84 titles, 100 runs / BASE_CHECK 594 / sweep 4 19 / catalog 26 / radius allowlist 13 rows, 28 declarations, observed on the clean tree at 50a7089; the earned warning that a Playwright-spawned wrangler dies inside 30 s and a hand-started one serves, and that its workerd children outlive a taskkill on the parent"
  - phase: 13-gui-overhaul
    plan: 04
    provides: "src/lib/sim/motion.svelte.ts with MOTION_KEY hangar.motion.v1 storing the bare word animated | still, the guard copied from ScreenToggle.svelte, motionDeps() reporting os || still, and the tagged reduced-motion title in e2e/browse.e2e.ts that writes the key by hand - the proof this plan reuses"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure), D-05 (the register; no string here), D-13 (Collections ship v1 - the key is reserved here, the shape is 13-13's checkpoint), D-14 Q2 (the intro flag turns Card A into Resume draft; no redirect)"
  - phase: 13-gui-overhaul
    plan: validation
    provides: "D-6: the stores land at wave 6, before the intro (13-07), the gallery (13-08) and My configs (13-13) that read them"
  - phase: 12-touch-framework
    plan: 03
    provides: "hangar.snapshot.v2 beside .v1 - the v1 record read, never overwritten, never deleted, never shadowed - the precedent this module inherits by name (read only)"
  - phase: 12-touch-framework
    plan: 04
    provides: "the three ids Phase 12 removed (lattice, forge, shuttle) beside Phase 11's nine (hold, keys, learn, switch, etch, gridlock, life, slam, table) - the twelve the favorites drop rule is proved against (read only)"
provides:
  - "THE GUARDED PRIMITIVE, src/lib/store/local.ts: imports nothing (grep '^import' empty, asserted by test 1's source scan), takes the store as an argument, keeps the property access inside each try; readString / writeString for the bare motion word, probe() telling absent from corrupt from refused so a read-modify-write store never writes blind, readJson with a REQUIRED validator, writeJson returning false on a refused or unserialisable write, removeKey; the reader never deletes what it cannot parse"
  - "THE SCHEMA, src/lib/store/schema.ts: SCHEMA_VERSION 1; storeKey(name, version) as the one place the .vN suffix is spelled; six owned keys (drafts, library, favorites, recent, intro, motion) and hangar.collections.v1 RESERVED and unread for 13-13; every key an envelope { schema: 1, ... } so KEEP-05 is literal; the Draft / SavedCopy record shapes 13-13 expects and a Region / Surface shape 13-14 may widen; validators that read a record whole or not at all"
  - "FIVE STORES, each naming which of section 9's three objects it holds: drafts.ts (DRAFT), library.ts (SAVED COPY), favorites.ts / recent.ts / intro.ts (none of the three, said so); the third object, device state, stays in the install store and no module here offers a generic Saved (test 9 scans for it)"
  - "FAVORITES DROP UNKNOWN IDS ON READ AND COUNT THE DROPS, with the validator an argument and never a catalog import; proved against all twelve removed ids (dropped 12); reading never writes, the next star persists the pruned list"
  - "RECENT: 12 kept, 6 shown, both numbers in the header with the reason; deduped by id; pushed on open with the moment passed in; thirteen opens leave twelve and list(6) is the six newest in order"
  - "THE INTRO FLAG written once on the first successful mount, with the safe direction stated as a decision: a refusing browser sees the intro every time"
  - "THE MOTION KEY FOLDED IN WITH ITS BEHAVIOUR PROVED UNMOVED: store/motion.ts owns the key and the two bare words; motion.svelte.ts reads and writes through it, keeps storage() as the one line naming the browser store, keeps the additive OR; the tagged reduced-motion e2e title green in chromium and webkit-phone, then every motion title twice each (8 of 8)"
  - "SIZES MEASURED, not estimated: a Playground draft record is 185 bytes and the PDF's page-3 four-element surface record is 706 bytes; no thumbnail is stored; IndexedDB's trigger written into drafts.ts's header (stored thumbnails, imported binaries, or a capture log)"
  - "COUNTS: 88 / 902 (+1 todo) = 87 + 1 / 892 + 10 - TEN TESTS, NOT SEVEN, the term restated with the reason; e2e 84 / 100 unmoved; check 603 = 594 + 9; sweep 4 19; allowlist 13 / 28 untouched (no CSS in this plan)"
  - "NINE NEGATIVE CHECKS red on the named test, each restored with sha256 identical: three on the primitive (the access outside the try, the quota swallowed, the reader opening the .v1 sibling - named in the message) and six on the stores (drops uncounted, the cap gone, the dedupe gone, createdAt moved, a copy overwritten, seen on a refusing store)"
  - "NO STRING LANDED; four questions ledgered in 13-COPY-NEW.md (the drop-count sentence, 12 kept / 6 shown, the motion key's shape, the prune-on-write)"
affects: [13-07, 13-08, 13-11, 13-13, 13-14, 13-16, 13-17, 13-18]
tech-stack:
  added: []
  patterns:
    - "A read-modify-write over localStorage classifies its read (absent / corrupt / refused) before it writes: refused declines, corrupt replaces whole, absent starts fresh - because a fresh record written after a refused read is every draft destroyed"
    - "The version lives in the key name (a reader never opens the other version's record) AND in the body (an exported file has no key); every key is an envelope { schema: 1, ... }, not a bare array, so the body rule is literal"
    - "A store module that must validate against the catalog takes the validator as an argument; the catalog is a 131 KB chunk and a store must be importable at a prerendered page's first paint"
    - "Tests land with the modules they drive, even when the plan lists them under an earlier task, so every commit is green on its own"
key-files:
  created:
    - src/lib/store/local.ts
    - src/lib/store/schema.ts
    - src/lib/store/local.spec.ts
    - src/lib/store/drafts.ts
    - src/lib/store/library.ts
    - src/lib/store/favorites.ts
    - src/lib/store/recent.ts
    - src/lib/store/intro.ts
    - src/lib/store/motion.ts
  modified:
    - src/lib/sim/motion.svelte.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
key-decisions:
  - "Every key holds an envelope { schema: 1, ... }; the bare motion word is the one named exception because 13-04's behaviour was not allowed to move and the e2e title writes it by hand"
  - "probe() classifies a read before any write; a refused read declines a read-modify-write rather than writing blind"
  - "readJson requires a validator: 'JSON of the wrong shape' is a failure mode of its own"
  - "favorites' validator is an argument; reading never writes; the drop count is returned and its sentence is 13-08's question"
  - "recent keeps 12 and shows 6; pushed on open only"
  - "the intro flag keeps its first moment and is never reported seen on a refusing store"
  - "ten tests, not seven: the drop rule, the never-overwrite rule and the two flags had no honest home; +1 / +10 restated"
  - "gsd-tools state commands not run; STATE.md by script against a copy with every touched line asserted"
patterns-established:
  - "src/lib/store/local.ts is the fourth instance of the guard shape (snapshot.ts, return.ts, the retired ScreenToggle); every later local key goes through it"
  - "storeKey(name, version) is how a .v2 is minted: a call, not a rename"
requirements-completed: []
requirements-touched: [KEEP-01, KEEP-02, KEEP-03, KEEP-05]
duration: 35min
completed: 2026-09-11
---

# Phase 13 Plan 06: The stores, before the screens that read them - Summary

**One-liner:** `src/lib/store/` - a zero-import guarded primitive that classifies every read as absent,
corrupt or refused before any store writes; a schema with the version in the key name AND in every
body; and five thin stores (draft, saved copy, favorites with counted drops, recent at twelve-kept /
six-shown, the intro flag) plus 13-04's motion key folded in with its behaviour proved unmoved in
both browser engines - measured at 185 and 706 bytes per record, tested ten times not seven, and
never once naming a window.

## Performance

- **Duration:** 35 min
- **Started:** 2026-09-11T04:45Z (the first read of the plan)
- **Completed:** 2026-09-11T05:20Z
- **Tasks:** 2 of 2
- **Files:** 9 created, 2 modified in the task commits; STATE.md and this file in the third

## Commits

| Hash      | Message                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `095cdd2` | `feat(13-06): the guarded primitive and the schema - four failure modes each proved, the version in the key and in the body` (3 files, +855)                                  |
| `209ae69` | `feat(13-06): the five stores over the primitive, the drop-on-read rule counted, twelve kept and six shown, and the motion key folded in unmoved` (9 files, +1318 / -40)      |

## The baseline, carried from 13-05, and this plan's term written out

Observed on the clean tree at `50a7089` before the first edit: **87 files / 892 tests (+1 todo) / 84
e2e titles / 100 runs / check 594 / catalog 26 / sweep `4 19` / radius allowlist 13 rows, 28
declarations**. The plan's carried `892` matches the tree.

| Count            | Carried (13-05) | This plan                                                                     | Observed                                                                  |
| ---------------- | --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| unit files       | **87**          | **+1** (`local.spec.ts`)                                                      | **88**                                                                    |
| unit tests       | **892**         | **+10** - the plan said +7, allowed +8; see "Ten, not seven"                  | **902** (+1 todo, `firmware-oracle.spec.ts:209`, unchanged)               |
| e2e titles       | **84**          | **+0**                                                                        | **84** (`grep -c "test("` summed over `e2e/`)                             |
| e2e runs         | **100**         | **+0**                                                                        | **100** (not re-run in full; the motion titles ran 2 + 8, all green)      |
| check            | **594**         | **+9** (eight modules and the spec)                                           | **603**, 0 errors, 0 warnings                                             |
| sweep            | `4 19`          | unchanged                                                                     | `4 19` (`check-counts.mjs 4 19` matches)                                  |
| radius allowlist | 13 rows / 28    | **+0** - this plan has no CSS                                                 | not re-measured; no stylesheet touched                                    |
| catalog          | 26              | not touched (the plan's "27 today" is stale: 12-04 took it to 26)             | not re-measured                                                           |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 88 902`: **902 passed, 1 todo, matches**.
`npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: matches. `npm run check`: 603 files,
0 errors, 0 warnings. `npm run lint` (prettier --check over the tree, then eslint): clean. `npm run
build`: green after each task - the only gate that catches an import-time `localStorage`, run twice.
`git diff --stat HEAD -- src/vendor/`: empty. `.planning/ROADMAP.md`: untouched. **CAT-04 stays `[ ]`.**

The proof the plan asked to paste, `grep -rn "^import" src/lib/store/local.ts`:

```
(no output)
```

and test 1 asserts the same on the comment-stripped source, `import type` and `import(` included, and
that none of `window`, `localStorage`, `sessionStorage`, `document`, `globalThis` appears in code.

## The six keys and the one reserved

| Key                     | Body                                                                     | Owner                     |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------- |
| `hangar.drafts.v1`      | `{ schema: 1, drafts: { [draftId]: Draft } }` - each Draft carries `schema: 1` too | `drafts.ts`               |
| `hangar.library.v1`     | `{ schema: 1, copies: { [copyId]: SavedCopy } }`                          | `library.ts`              |
| `hangar.favorites.v1`   | `{ schema: 1, ids: string[] }`                                            | `favorites.ts`            |
| `hangar.recent.v1`      | `{ schema: 1, items: { id, at }[] }` - at most 12                          | `recent.ts`               |
| `hangar.intro.v1`       | `{ schema: 1, seen: true, at }`                                            | `intro.ts`                |
| `hangar.motion.v1`      | the bare word `animated` or `still` - **not JSON**, 13-04's shape kept     | `motion.ts`               |
| `hangar.collections.v1` | **RESERVED** - `COLLECTIONS_KEY_RESERVED` in `schema.ts`; no function reads or writes it; test 9 scans every store source for the word and allows it in `schema.ts` only | 13-13 (D-13's checkpoint) |

`storeKey(name, version)` is the one place the `.vN` suffix is spelled; a `.v2` is a call, and test 5
proves a v2 reader over `storeKey("drafts", 2)` never asks the store for the v1 key.

**The envelope, and the one exception.** The plan's interface sketch had `hangar.favorites.v1` as a
bare `string[]` and `hangar.recent.v1` as a bare array. KEEP-05 says *"every stored record carries its
version in the key name and in the body"*, and a bare array carries it in the key only. Every key is
therefore an envelope `{ schema: 1, ... }` - eleven characters per key - so the requirement is
literal rather than mostly true. `hangar.motion.v1` is the exception: 13-04 stored the bare word, the
tagged e2e title writes `animated` into the key by hand to prove the OS wins, and the plan's own rule
is that the behaviour must not change. It is a two-word preference and not a record, nothing exports
it, and a `.v2` would still sit beside it by the key rule. `schema.ts`'s header says so, so nobody
"fixes" it into JSON.

## The four failure modes, and what each returns

| # | Failure                                                         | `readString`     | `probe`                 | `readJson`  | `writeJson` / `writeString` | `removeKey` | Proved by |
| - | --------------------------------------------------------------- | ---------------- | ----------------------- | ----------- | --------------------------- | ----------- | --------- |
| 1 | the key is not there                                            | `null`           | `{ state: "absent" }`   | `undefined` | (n/a)                       | `true`      | test 1    |
| 2 | not JSON, or JSON the validator rejects (wrong schema, wrong field, missing field) | the raw string | `{ state: "corrupt" }` - **the value is left in place** | `undefined` | (a later write replaces it whole) | (n/a) | test 2, eight shapes |
| 3 | `setItem` throws quota                                          | (reads still work) | (reads still work)    | (reads still work) | **`false` - the caller is told**; the previous value survives | (n/a) | test 3 |
| 4 | the store throws on property ACCESS (a Proxy whose `get` throws), or on use, or is `undefined` (prerender) | `undefined` | `{ state: "refused" }` | `undefined` | `false` | `false` | test 4 (and `expect(() => ACCESS_THROWS.getItem).toThrow()` so the fake is not vacuous) |

The reader degrades silently and the writer tells its caller: a missing courtesy may never be the
reason a page fails to paint, but a silent drop on a draft is a lost draft. `writeJson` also returns
`false` for a value that will not serialise (a cycle, `undefined`) rather than throwing.

**`probe` is the honest read.** `snapshot.ts` has a `REFUSED` symbol for the same reason; this
module gives it a printable name and a fourth state. The four read-modify-write stores (drafts,
library, favorites, recent) decline on `refused` - test 7 proves a store whose `getItem` throws and
whose `setItem` works writes nothing - replace on `corrupt` (nothing in a corrupt envelope was ever a
draft; `snapshot.ts` makes the same call), and start fresh on `absent`.

## The version, in the key and in the body, with 12-03's precedent

`schema.ts`'s header names `SNAPSHOT_KEY = "hangar.snapshot.v1"` and 12-03's `hangar.snapshot.v2`
beside it, with the v1 record read as `system = default`, never overwritten, never deleted and never
shadowed. Test 5 spends the same rule: a `.v1` record and a `.v2` record under `storeKey("drafts", 1)`
and `storeKey("drafts", 2)`; the v2 reader returns the v2 record; the store's `getItem` log shows the
v1 key was **never asked for** (the guarantee a key-name version gives that a body field cannot); a
v2 write and a v2 remove leave the v1 record byte-identical; and the v1 reader over its own key does
not see v2's body (test 2's body-version rule refuses it, and the key rule means it is never opened).
Negative check C - the reader also opening the `.v1` sibling - went red with the message
*"the v2 reader opened a record it must never read: hangar.drafts.v1, hangar.drafts.v2"*.

## Three objects, three words, three stores

| Section 9 object | Store        | Words the interface may use                                             | Word it may not use                              |
| ---------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------ |
| Draft            | `drafts.ts`  | Draft, Draft saved locally, Resume draft, Your draft is safe             | Saved alone                                      |
| Saved copy       | `library.ts` | Saved copy, Save copy, Named copies, Saved on a copy                     | anything about the device                        |
| Device state     | the install store, untouched | Stored on ZONA · Page N, On device · not stored           | not this module's                                |
| (none)           | `favorites.ts`, `recent.ts`, `intro.ts` | Favorites, Recently used, Pick up where you left off | saved                                            |

Test 9 strips every store source and asserts none contains `"Saved"` as a literal or `Stored on ZONA`,
none imports Svelte or the catalog, and only `schema.ts` names `collections`.

`library.ts`'s `saveCopy` answers `"kept"` for an existing id and never overwrites - Bible section 11's
*"Create a new snapshot; do not overwrite the source preset"*, proved byte for byte in test 9 (the
source moved on, the copy did not). Rename moves `editedAt` and not `createdAt`; duplicate is a new
copy at its own moment; delete is one id.

## Favorites: the drop count against the twelve removed ids

`readFavorites(store, isKnown)` returns `{ ids, dropped }`. Test 8 seeds `["arc", "forge", "ghost",
"keys", "euclid"]` (`forge` removed by 12-04, `keys` by 11-01) and reads `ids: ["arc", "ghost",
"euclid"], dropped: 2` with the raw record untouched; then seeds all twelve removed ids
(`hold, keys, learn, switch, etch, gridlock, life, slam, table` from 11-01; `lattice, forge, shuttle`
from 12-04) beside `arc` and reads `ids: ["arc"], dropped: 12`. The validator is an argument -
`(id) => byId(id) !== undefined` or a listing lookup, the caller's choice - because the catalog reaches
the protocol package at module scope. An id the validator rejects cannot be starred (`setFavorite`
returns `false`). The next star or unstar writes the pruned list; reading never writes. Whether the
sentence *"two favorites are no longer in the catalog"* is ever shown is 13-08's call and is
ledgered as question 1.

## Recently used: the two numbers

`RECENT_CAP = 12` kept, `RECENT_SHOWN = 6` shown. The PDF's rail shows `Recently used 06`, so six is
what a caller asking for the rail gets; twelve is kept because a visitor who opens seven things and
reopens the sixth should still find the first behind it, and a cap equal to what is shown forgets an
entry the moment it scrolls off. Twelve is two rows of the rail's six; the cap exists at all because
an uncapped list grows without bound in a store of about 5 MB shared with every draft. Test 6: thirteen
opens leave twelve with `e1` gone; `listRecent(store)` is `e13..e8`; reopening `e5` moves it to the
front at its new moment, still twelve, appearing once; a malformed item hides no neighbour. Pushed on
**open**, not on edit or save, with the moment passed in.

## The intro flag: the safe direction

`markIntroSeen(store, at)` writes `{ schema: 1, seen: true, at }` once - a second mark keeps the first
moment and reports success - and is meant to be called from `onMount` after `/` has painted, never at
module scope. A refusing, throwing or full store is never reported seen (`hasSeenIntro` false on
`HOSTILE_STORE`, on the access-throwing Proxy, on `undefined`, and on a full store after a failed mark),
so that visitor gets the intro every time - the harmless failure, stated in the header as a decision.
Negative check I (reporting seen on a refusing store) went red on test 10.

## The motion key, folded in, and the proof its behaviour did not move

**The plan's shape was a guess.** 13-06-PLAN.md lists `hangar.motion.v1` as `{ ambient: boolean }`;
13-04 had already landed it as the bare word `animated | still` under that key, and the plan was
written before. The rule "the behaviour must not change" wins.

**What moved.** `src/lib/store/motion.ts` owns `MOTION_KEY` (through `schema.ts`), `MotionChoice`,
`MOTION_CHOICES`, `readMotion(store)` and `writeMotion(store, choice)` over `local.ts`'s `readString`
and `writeString`. `src/lib/sim/motion.svelte.ts` imports those and re-exports the three names 13-04
published (nothing outside it imported them - `MotionControl.svelte`, `BrowseGrid.svelte` and
`Coverflow.svelte` import `motion`, `chooseMotion`, `osQuery`, `motionDeps` and the two strings, which
are unchanged); its `recorded()` and `remember()` are now one-line calls; its `storage()` stays as the
one line in the motion path that names the browser store, because the store modules take it as an
argument. The rune, the listeners, `osQuery()` and `motionDeps()`'s `os || still` are untouched (a
70-line diff, all header and the two functions).

**The proof, three ways.**

1. **The tagged e2e title**, `@webkit reduced motion snaps a normal entry to its representative frame,
   and it is not tick 0` (`e2e/browse.e2e.ts:847`), which sets `localStorage["hangar.motion.v1"] =
   "animated"` by hand under the OS preference and asserts the pad still holds the tick-64 frame:
   **2 of 2** (chromium 4.2 s, webkit-phone 7.0 s) on the fresh build of this tree, then `--grep
   "motion" --repeat-each 2` covering it, the untagged `reduced motion stills every card` and
   `first-experience.e2e.ts`'s `reduced motion stills the pads`: **8 of 8**. Wrangler was started by
   hand (`npx wrangler dev --port 4173 --ip 127.0.0.1`) and `reuseExistingServer` took it, per 13-05's
   finding; it answered on the first probe and served both runs without a refused connection.
2. **Test 10's unit half**: `readMotion` returns `undefined` for an absent key (the caller decides the
   default, as 13-04's `recorded() ?? "animated"` does), `"still"` and `"animated"` for the two words,
   `undefined` for `"off"` and for the JSON string `"\"still\""`, and `writeMotion` stores the bare word
   (`map.get(MOTION_KEY) === "still"`, asserted "not JSON").
3. **Test 10's source scan** of `motion.svelte.ts`: the key literal is spelled nowhere in it, it
   carries no `getItem` / `setItem` of its own, it calls `readMotion(` and `writeMotion(`, and the
   additive `|| motion.choice === "still"` is still there.

No unit spec of `motionDeps()`'s OR was added (13-04's suggestion); the module carries a rune and the
e2e title holds the rule in a browser, which is the stronger thing. The four `.svelte.ts`-side
behaviours - read once at module scope before hydration, OS subscribed, listeners notified, default
`animated` - are byte-unchanged in the diff.

## Sizes, measured

Printed by test 7 (`13-06 measured: ...`) with `JSON.stringify(record).length`, on the full record
including `schema`, `id`, `name`, `createdAt`, `editedAt` and `source`:

| Record                                                                                          | Bytes   | Asserted |
| ----------------------------------------------------------------------------------------------- | ------- | -------- |
| a Playground draft (`arc`, five knob indices)                                                    | **185** | `< 256`  |
| the PDF's page-3 surface as a sandbox draft (a 2x6 Fader, a 4x4 XY pad, a 2x2 Button, a 3x3 Knob - D-18's four kinds) | **706** | `< 1024` |

The plan's "under 100 bytes" was for the bare `{ entryId, knobIndices[] }`; the full record with its
envelope fields is 185. At these sizes a 5 MB store holds on the order of seven thousand surfaces or
twenty-five thousand Playground drafts. **Nothing stores a thumbnail** - a 96x96 PNG is roughly 10-30
KB, two hundred of them is megabytes, and the live simulator already renders sixteen at a time on the
gallery. **The IndexedDB trigger, as written in `drafts.ts`'s header:** *"STORED THUMBNAILS, IMPORTED
BINARIES, OR A CAPTURE LOG. None of the three is v1."*

## Ten, not seven

The plan asked for seven tests and allowed an eighth for the favorites drop rule *"if that cannot be
done honestly"*. It could not, and neither could two more:

| Test | Subject                                                              | Why not folded                                                                  |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 8    | favorites drop unknown ids on read and count the drops               | the plan's own candidate; a drop rule is not a drafts round trip                |
| 9    | a saved copy is created and never overwritten; rename, duplicate, delete | section 9's thesis is that a draft and a saved copy are different objects - a test treating them as one would contradict the plan |
| 10   | the intro flag written once and never seen on a refusing store; the motion word unmoved | the two single-value stores whose absence is the default, and the fold's unit half |

The term is **+1 / +10**, restated. The tests landed with the modules they drive (6-10 in task 2), not
in task 1 as the plan's file list has them, because a spec importing `recent.ts` before it exists is a
red commit. The spec's header says all of this in the tree.

## Negative checks

Every check mutated the shipped file by a string replacement asserted to match exactly once, ran the
store spec, restored from the pristine string, and printed sha256 on both sides - identical each time.
No `git checkout` / `restore` / `stash` / `clean` was run.

| Check | Mutation                                                              | Expected red | Result                                                                                                   |
| ----- | --------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| A     | `readString`: `store.getItem` read outside the try, called inside     | test 4       | **RED, test 4**: `expected [Function] to not throw ... SecurityError` (the access threw)                  |
| B     | `writeString`: `catch { return true }`                                | test 3       | **RED, tests 3 and 4**: `THE CALLER IS TOLD: a silent drop on a draft is a lost draft: expected true to be false` |
| C     | `readString` also asks for the `.v1` sibling of a `.v2` key            | test 5       | **RED, test 5**: `the v2 reader opened a record it must never read: hangar.drafts.v1, hangar.drafts.v2`  |
| D     | `favorites.ts`: `dropped += 1` removed                                | test 8       | **RED, test 8**: `a shorter list without a count is the coy state D-05 forbids: expected +0 to be 2`     |
| E     | `recent.ts`: `.slice(0, RECENT_CAP)` removed                          | test 6       | first run **skipped** - prettier had rewrapped the call and the anchor matched 0 times; a skipped check is not a green one, so the anchor was fixed and E re-run alone: **RED, test 6**: `capped at twelve: expected 13 to be 12` |
| F     | `recent.ts`: the dedupe filter removed                                | test 6       | **RED, test 6**: `expected [ { id: 'e5', ... } ] to have a length of 1 but got 2`                          |
| G     | `drafts.ts`: an edit takes the caller's `createdAt`                    | test 7       | **RED, test 7**: `createdAt did not: expected '...10:12...' to be '...10:00...'`                            |
| H     | `library.ts`: the `"kept"` line removed from `saveCopy`                | test 9       | **RED, test 9**: `a copy was overwritten from its source: expected 'written' to be 'kept'`                 |
| I     | `intro.ts`: `hasSeenIntro` reports seen unless the store is undefined | test 10      | **RED, test 10**: `expected true to be false`                                                             |

The plan's task-2 "negative check" (feed favorites an id the validator rejects; feed recent thirteen
opens) is what tests 8 and 6 already assert positively; the mutations above are the checks that
prove those assertions can fail.

## Deviations from Plan

### 1. [Rule 2 - correctness] Every key is an envelope, not a bare array

**Found during:** Task 1. **Issue:** the interface sketch's `string[]` and `{ id, at }[]` carry the
version in the key only, and KEEP-05 says "in the key name and in the body". **Fix:** `{ schema: 1,
ids }`, `{ schema: 1, items }`, `{ schema: 1, drafts }`, `{ schema: 1, copies }`, `{ schema: 1, seen,
at }`. **Files:** `schema.ts`, all five stores. **Commits:** `095cdd2`, `209ae69`.

### 2. [Plan stale - 13-04 landed after it was written] The motion key's shape is 13-04's bare word

The plan's `{ ambient: boolean }` was a planner guess; the tree had `animated | still` under the key
with an e2e title depending on it. Folded with the shape 13-04 wrote; see the motion section.

### 3. [Design, stated] `readJson` requires a validator; `probe` added beside it

The plan's signature is `readJson<T>(store, key)`. "JSON of the wrong shape" (failure mode 2) needs a
shape check, so the validator is a required argument; and the read-modify-write stores need to tell a
refused read from an absent one, so `probe` exists and `readJson` is its convenience.

### 4. [Design, stated] Ten tests, not seven; tests 6-10 landed with task 2

See "Ten, not seven". The plan's task 1 lists test 6 (recent) and test 7 (drafts) although those
modules are task 2's; they landed with their modules so each commit is green.

### 5. [Rule 3 - blocking] Long content through the Write tool, not a heredoc

The first attempt to append tests 6-10 through a bash heredoc failed to parse (the earned warning);
nothing was written, verified by line count, and the block went through the Write tool and `cat`.

### 6. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run (13-01 to 13-05's reasons). STATE.md
was edited by a script that asserts every line it touches, with `status: executing`, `completed_phases
11`, `completed_plans 139`, `percent 100`, `total_phases 14` and `total_plans 160` asserted unchanged,
and Phase 13 recorded alongside Phase 12. Observed and not corrected: the Performance Metrics table
has no P04 row; P06's row was added after P05.

## What the plan asserts that the tree does not support

1. **"27 today"** in the recent section - the catalog is 26 (12-04). Not a code path here.
2. **`hangar.motion.v1 { ambient: boolean }`** - the tree's shape is the bare word; see above.
3. **`hangar.favorites.v1 string[]` / `hangar.recent.v1 { id, at }[]`** as bare arrays - enveloped, see
   deviation 1.
4. **"Seven tests" / "`local.spec.ts` gains no test" in task 2** - ten, and tests 6-10 are task 2's by
   necessity.
5. **"A Playground draft ... under 100 bytes"** - the bare pair would be; the full record is 185.
6. **`readJson<T>(store, key)`** with no validator - a validator is required.
7. Nothing else. The plan's `bible/HANGAR-ZONA-GUI-design-specification.md` is
   `.planning/phases/13-gui-overhaul/bible/`; the root copy read here is the same file byte for
   byte per `.prettierignore`'s note, and neither was edited.

## Known Stubs

None. Every store reads and writes real records; nothing renders yet (13-07, 13-08, 13-13 do).

## Questions for the user, recorded rather than answered (D-01)

Ledgered in `13-COPY-NEW.md` under "From 13-06":

1. **The favorites drop count has a number and no sentence** - shown or not is 13-08's call; the
   sentence would be invented.
2. **Twelve kept, six shown** - if the rail should show the kept count, `RECENT_SHOWN` is one number.
3. **The motion key's stored shape is the bare word** - a JSON body would be a `.v2` beside it and a
   re-run of the tagged title.
4. **Starring writes the pruned list** - if dropped ids should be kept until the visitor is told, the
   prune moves out of `setFavorite`.

## Notes for the next plans

- **13-07:** `hasSeenIntro(localStorage)` and `newestDraft(localStorage)` from `onMount`, never at
  module scope; `markIntroSeen(localStorage, new Date().toISOString())` after the page has painted.
  `Draft.name` is the resume card's name; `editedAt` is its "Last edited" moment.
- **13-08:** `readFavorites(localStorage, (id) => byId(id) !== undefined)` gives `{ ids, dropped }`;
  `listRecent(localStorage)` gives six; `touchRecent` on open of a workspace, not on knob turns.
- **13-11:** `writeDraft` returns `false` on a refused write - the context bar's "Draft saved locally"
  should not be shown on `false`.
- **13-13:** `COLLECTIONS_KEY_RESERVED` and `storeKey("collections", 1)` are yours; `Draft` and
  `SavedCopy` share `StoredRecord` and each carries `schema: 1` for the export file; `saveCopy` answers
  `"kept"` on an existing id - mint a new id per copy.
- **13-14:** `Region` / `Surface` in `schema.ts` are the sketch from 13-14-PLAN.md's own block;
  widen `ElementKind` or the fields there and `isRegion` follows.
- **The harness:** wrangler's `workerd` children needed a second `taskkill` after the parent, exactly
  as 13-05 warned.

## Self-Check: PASSED

- `src/lib/store/local.ts`, `schema.ts`, `local.spec.ts`, `drafts.ts`, `library.ts`, `favorites.ts`,
  `recent.ts`, `intro.ts`, `motion.ts`: FOUND.
- `src/lib/sim/motion.svelte.ts` and `13-COPY-NEW.md`: modified in `209ae69`.
- Commits `095cdd2` and `209ae69`: FOUND in `git log`.
- Counts: 88 / 902 (+1 todo); e2e 84; check 603; sweep 4 19.
