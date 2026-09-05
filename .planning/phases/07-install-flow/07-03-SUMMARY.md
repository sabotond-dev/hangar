---
phase: 07-install-flow
plan: 03
subsystem: device
tags: [snapshot, localStorage, persistIfAbsent, install-copy, copywriting-contract, caps, KEEP_REASONS, moduleList, import-free, SAFE-04, SAFE-05, SAFE-08]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-02-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 69 / 731, sweep `3 13`"
  - ".planning/phases/07-install-flow/07-UI-SPEC.md - the approved Copywriting Contract, the source of every literal; the fourteen states I0..I13; the three caps 129 / 129 / 86"
  - "07-CONTEXT.md D-04 amended (the key is the module's serial, read over the wire), D-05 / SAFE-06 (the rig sentence), D-07 / SAFE-08 (about a second, once), D-15 (the inline confirmation)"
  - "07-RESEARCH.md Pattern 4 (the record keyed twice), Pitfall 4 (a snapshot from another page), Pitfall 9 (storage that throws on property access; the in-memory copy is the rail)"
  - "src/lib/browse/return.ts (05.1) - the injected-Storage shape, undefined during prerender, nothing throws; return.spec.ts - the throwing-store pattern"
  - "src/lib/device/session-copy.ts and session-copy.spec.ts (06-02) - the import-free copy module, the stripped-source scan, the export walk with SAMPLES, the scripted match against the spec"
  - "src/lib/tune/copy.ts (05-02) - the already-capitalised {Setup|Timer} rule, so this module imports nothing for the event words"
provides:
  - "src/lib/device/snapshot.ts - SNAPSHOT_KEY hangar.snapshot.v1, EventPair, SnapshotStore, PersistOutcome, readSnapshot, persistIfAbsent, rememberLast, lastModuleId, hasSnapshotFor: pure, import-free, never throws, keyed module then page, never overwrites a valid entry, never deletes"
  - "src/lib/device/install-copy.ts - every string of 07-UI-SPEC's Copywriting Contract once: 31 string constants, 3 caps, KEEP_REASONS closed over a six-member KeepReason union, 15 builders including the seven failure blocks, moduleList and confirmRig; zero import specifiers"
  - "HONESTY_CAP 129, PUT_BACK_CAP 129, KEEP_CAP 86 - exported so the store and the components quote the contract's numbers rather than restate them"
  - "snapshot.spec.ts 7 and install-copy.spec.ts 6; the fourteen capped lengths measured by code point and every contract figure exact"
affects:
  - "07-04 (session seams) may author SNAPSHOT_SESSION_LINE beside these; this plan wrote no session-only sentence"
  - "07-06 (install.svelte.ts) calls persistIfAbsent after fetchModuleKey and the fetch, readSnapshot / hasSnapshotFor / lastModuleId at connect and on a fresh tab, and reads the honesty strings and KEEP_REASONS by key"
  - "07-07 (KEEP ON DEVICE) renders CONFIRM_* and confirmRig(identity.otherModules), keptBody / KEPT_PROOF_LINE after the re-fetch proof, and the I10-I13 blocks"
  - "07-09 walks install-copy in the allow-list mutation; 07-10 / 07-11 render the panel and the header disclosure from these names"
  - ".planning/phases/07-install-flow/deferred-items.md - item 4 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 3/13"

tech-stack:
  added: []
  patterns:
    - "A persistent record that is somebody's only copy is written by a function whose name says it declines (persistIfAbsent), returns what it did as a three-way outcome, and treats a store that throws on read as a reason not to write rather than as an absent record"
    - "A copy module reads its own contract from disk in its spec: every literal over a length threshold is a substring of the approved document, with builder samples folded back into the contract's placeholders, so a paraphrase is a red run naming the string"
    - "A closed set of reasons is a Readonly<Record<Union, string>>, so widening it is a compile error rather than a lint finding, and the negative check for it is a diagnostic rather than a test name"

key-files:
  created:
    - "src/lib/device/snapshot.ts"
    - "src/lib/device/snapshot.spec.ts"
    - "src/lib/device/install-copy.ts"
    - "src/lib/device/install-copy.spec.ts"
    - ".planning/phases/07-install-flow/07-03-SUMMARY.md"
  modified:
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "snapshot.ts reads the store exactly once per call through readRaw(), which returns a REFUSED sentinel when getItem throws; persistIfAbsent then answers unavailable instead of writing blind, because with no way to know whether an entry exists a write could overwrite one, and rule 3 outranks the courtesy"
  - "A record this version cannot parse (not JSON, v 2, no modules) is replaced whole by persistIfAbsent, and a malformed page entry is replaced in place, because neither was ever a copy of anything; a VALID neighbour entry beside a malformed one is preserved, and test 6 asserts both halves"
  - "confirmRig returns undefined for an empty list, as session-copy's multiModuleLine does, so the confirmation renders no fourth row rather than an empty one; the plan's interface said string, and undefined is the honest value for a sentence that does not exist"
  - "unconfirmedBlock's step 1 is the Copywriting Contract table's `Click KEEP ON DEVICE to send the store again`, not the I11 section's `Click KEEP ON DEVICE and confirm to send the store again`; the table is the source the plan names, the two disagree by two words, and deferred item 4 records it for the contract's owner"
  - "The speed-rule check in test 4 is case-insensitive, because HONESTY_NO_SESSION opens its second sentence with `About a second`; a case-sensitive match would have found one string and passed vacuously against the plan's two-element list"
  - "InstallBlock is declared locally with a REQUIRED title, where session-copy's SessionBlock has an optional one, because every one of the seven install failures has a title and announceTitle() needs one"
  - "Test 2 walks the other branch of each two-form builder (nothingLandedBlock put-back, lostBlock store leg, confirmRig plural, partialBlock reversed) so both forms are held against the contract, not only the sampled one; 42 literals over 40 characters, 0 misses"
  - "No erratum: every figure 07-UI-SPEC states (106, 71 / 101 / 26, 42, 14) measured exact by code point, where 06-02 found two miscounts in its contract"

requirements-completed: []
requirements-contributed: [SAFE-04, SAFE-05, SAFE-08]

# Metrics
duration: 25min
completed: 2026-09-05
---

# Phase 7 Plan 03: The record and the words, each in a module that imports nothing Summary

**The module's original now has a place to live that outlasts the tab, and the install flow has every sentence it will ever say. `snapshot.ts` keeps one record under `hangar.snapshot.v1`, keyed by the module's 32-character serial key and then by page, written only when no valid entry exists (`persistIfAbsent` returns `"written"`, `"kept"` or `"unavailable"`), read once per call inside a try, replacing only what was never a copy of anything, and deleting nothing - the store is an argument, `undefined` during prerender, and nothing throws. `install-copy.ts` holds 31 string constants, three caps, a six-key `KEEP_REASONS` closed over a `KeepReason` union, and fifteen builders including the seven failure blocks, with zero import specifiers; its spec reads `07-UI-SPEC.md` from disk and matches all 42 literals over forty characters against it with no miss, asserts every one of the fourteen capped strings under 129 / 129 / 86 by name, and finds every figure the contract states exact. Eight negative checks observed (seven red tests, one compile error) and restored byte-identical. Quick 69 / 731 -> 71 / 744, sweep `3 13`.**

## The five-name carry-forward block

Carried verbatim from 07-02, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                              |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **2** spec files. Tree: **71** (+ 2)                                                                |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5 (731); this plan adds **13** (snapshot 7, install-copy 6). Tree: **744** (+ 20)                |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                   |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no component, no build)          |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                        |

`BASE_CHECK` (provenance only): **537 files, 0 errors, 0 warnings**, `npm run check`, after Task 3 (535 after Task 1, 536 after Task 2 - the two files each add one).

### Observed totals: previous SUMMARY plus this plan's delta

07-02 left the tree at **69 / 731**; re-measured here **before the first edit** and equal. This plan's delta is **+2 files / +13 tests**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 731     # before any edit
  check-counts: observed 69 files, 731 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 71 744     # after 8974fef
  check-counts: observed 71 files, 744 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788606362847 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)
```

`format-parity.spec.ts` did not flake; nothing was re-run.

### Per-file counts after this plan

| File                                    | Before | After | Plan said |
| --------------------------------------- | ------ | ----- | --------- |
| `src/lib/device/snapshot.spec.ts`       | -      | **7** | 7         |
| `src/lib/device/install-copy.spec.ts`   | -      | **6** | 6         |
| `src/lib/device/` (all five spec files) | 30     | **43**| -         |

## Task 1 - `snapshot.ts` and its seven gates (commit `cb9d846`)

`src/lib/device/snapshot.ts`, 285 lines after Prettier, zero import specifiers. The header says the four things the plan required in prose and each is a numbered paragraph: the key is the serial and not a content hash (the fetched strings change the instant `TRY ON DEVICE` writes, so a hash stops finding its own snapshot at the moment `PUT BACK` matters); the record is keyed by page underneath the module (Pitfall 4 - firmware's `currentpage` NACK is a backstop, not a design); an existing entry is never overwritten (the record is the module's *original*, not its latest, and a re-connect's fetch after a write returns HANGAR's own configuration); and nothing here deletes anything (Z-13 - revoking a permission is not a reason to destroy somebody's only copy).

The shape is `return.ts`'s exactly: `SnapshotStore = Pick<Storage, "getItem" | "setItem" | "removeItem">`, `undefined` during prerender, every function a no-op or its absent form on `undefined`. The one design step beyond the plan's interfaces block: **the store is read exactly once per call.** `readRaw(store)` wraps the one `getItem` in the one `try` and returns a `REFUSED` symbol when the store threw; `parse(raw)` is pure and treats `REFUSED`, `null`, non-JSON, non-object, `v !== 1`, a missing or non-object or array `modules` as absent. `persistIfAbsent` and `rememberLast` see `REFUSED` and return `"unavailable"` / return silently rather than writing blind - with no way to know whether an entry exists, a write could overwrite one, and rule 3 outranks the courtesy. Page entries are validated at the point they are read (`validEntry`: two strings and a string `takenAt`), so one malformed entry never hides its neighbours.

The `removeItem` scan, quoted from test 1: `code.match(/[.]removeItem[(]/g) ?? []` is `[]` on the stripped source, while `'"removeItem"'` is still present (the type carries the three-method shape). The header sentence: *"NO FUNCTION IN THIS MODULE CALLS removeItem, and snapshot.spec.ts scans for it."*

The specifier and global scan, quoted: on the comment-stripped source, `from "` 0, `from '` 0, `import(` 0, `import ` 0, `require(` 0; `window` 0, `localStorage` 0, `sessionStorage` 0, `document` 0. The raw source names `localStorage` in the header, asserted, so the code scan is not vacuous.

`src/lib/device/snapshot.spec.ts`, seven tests as the plan listed them: the import-freedom and no-`removeItem` scan; the round trip with the raw JSON parsed to `{ v: 1, modules: {...} }` under the key; the never-overwrite (a second persist with HANGAR's strings returns `"kept"`, the raw record is byte-equal to before, `takenAt` unchanged, a third persist also `"kept"`); two modules times two pages giving four entries with a never-snapshotted page absent beside them and `hasSnapshotFor` false for a third id; the hostile store (`SecurityError` on read, `QuotaExceededError` on write), a read-fine-write-refusing store leaving the map empty, and `undefined`; thirteen malformed shapes each read as absent, each counted as no snapshot, each **replaced** by a subsequent `persistIfAbsent` returning `"written"`, plus the neighbour rule (a malformed page 0 beside a valid page 3: page 3 reads, the module counts, and replacing page 0 leaves page 3 where it was); and the `rememberLast` / `lastModuleId` round trip with a non-string `last` reading as none and a hostile store neither throwing nor remembering.

### The three negative checks, each observed red on the intended test and restored byte-identical

A scratch runner applied each mutation as an exact single-occurrence replacement, ran the one spec, restored the original bytes and compared SHA-256 (`5d95f11d…` all three times). `snapshot.ts` never appeared in `git status`.

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `if (validEntry(pages[key])) return "kept";` removed from `persistIfAbsent` | test 3 (1 failed, 6 passed) | `AssertionError: the second persist must decline: expected 'written' to be 'kept'` |
| 2 | `readSnapshot` returns `pages[String(page)]` unvalidated | test 6 (5 failed, 2 passed) | `AssertionError: not JSON at all: the replacement did not read back: expected { setup: …, …(2) } to deeply equal { setup: …, …(1) }` - the raw entry with its `takenAt` reached the caller; tests 2, 3, 4 and 7 went red on the same passthrough |
| 3 | the `try` around `getItem` removed from `readRaw` | test 5 (2 failed, 5 passed) | `AssertionError: expected [Function] to not throw an error but 'SecurityError: The operation is insecure.' was thrown`; test 7's hostile-store line went red on the same throw |

## Task 2 - `install-copy.ts`, every sentence once, importing nothing (commit `ad5c0b2`)

`src/lib/device/install-copy.ts`, 393 lines, **35 constants + 15 functions + 3 types**. The constants: 31 strings, the three caps (`HONESTY_CAP` 129, `PUT_BACK_CAP` 129, `KEEP_CAP` 86) and `KEEP_REASONS`. The functions: `identifiedBody`, `settledBody`, `keptBody`, the seven failure builders (`keptMismatchBlock`, `unconfirmedBlock`, `restoredUnconfirmedBlock`, `nothingLandedBlock`, `partialBlock`, `lostBlock`, `snapshotFailedBlock`), `moduleList`, `confirmRig`, `liveSettled`, `liveKept`, `announceTitle`. The types: `EventWord`, `InstallBlock`, `KeepReason`. Every export in the plan's interfaces table exists under the name given.

The header says why it imports nothing (Phase 4's chunk guard matches specifier text; the header's device disclosure paints on the first frame of `/` and names this module for its snapshot line), and writes down the three rules the plan asked for beside the code: the six reasons are a closed record over a six-member union (a seventh key is a type error, observed below); `{Name}` is interpolated raw and never re-cased; failure titles carry no terminal punctuation and `announceTitle` adds the full stop because the title is spoken.

The specifier scan, quoted, on the comment-stripped source (18,444 raw bytes, 8,857 stripped): `from "` 0, `from '` 0, `import(` 0, `import ` 0, `require(` 0. The engine name appears 0 times in the raw file.

### The fourteen measured lengths, against the contract's stated figures

Measured by code point (`[...s].length`) with a scratch script that imports the module, never by eye.

| Export | Measured | Cap | Contract said |
| --- | --- | --- | --- |
| `HONESTY_NO_SESSION` | **106** | 129 | "the longest new honesty string is 106" - **exact** |
| `HONESTY_READY` | 104 | 129 | - |
| `HONESTY_SNAPSHOTTING` | 68 | 129 | - |
| `HONESTY_INCAPABLE` | 72 | 129 | - |
| `PUT_BACK_LINE` | **71** | 129 | 71 - **exact** |
| `PUT_BACK_LINE_AFTER_KEEP` | **101** | 129 | 101 - **exact** ("longest is 101") |
| `PUT_BACK_NEEDS_ZONA` | **26** | 129 | 26 - **exact** |
| `KEEP_LINE_ENABLED` | 82 | 86 | - |
| `KEEP_REASONS["never-tried"]` | 25 | 86 | - |
| `KEEP_REASONS["knobs-moved"]` | 62 | 86 | - |
| `KEEP_REASONS["after-partial"]` | 69 | 86 | - |
| `KEEP_REASONS["already-kept"]` | 69 | 86 | - |
| `KEEP_REASONS["after-mismatch"]` | **42** | 86 | 42 - **exact** |
| `KEEP_REASONS["incapable"]` | 36 | 86 | - |

Also measured because the contract states it: `LIVE_STILL_WRITING` **14** - exact. **No erratum.** Every figure the contract states agrees with its string; 06-02 found two miscounts in its contract and this plan found none, so nothing was recorded as arithmetic.

### Every long literal, verified against the approved contract rather than proofread

The same scratch script walked every export (constants, and each builder at a fixed sample), folded the sample values back into the contract's placeholders (`{Name}`, `{major}.{minor}.{patch}` / `{n}`, `{Timer}` / `{Setup}`, `{label}`, `{EN16}`), and asked whether `07-UI-SPEC.md` contains each literal longer than 40 characters:

```
OK    102  CONFIRM_REPLACES              OK     46  keptMismatchBlock.steps[0]
OK     58  CONFIRM_WAY_BACK              OK     62  keptMismatchBlock.steps[1]
OK     72  HONESTY_INCAPABLE             OK     57  liveKept
OK    106  HONESTY_NO_SESSION            OK     81  liveSettled
OK    104  HONESTY_READY                 OK    145  lostBlock.detail
OK     68  HONESTY_SNAPSHOTTING          OK     64  lostBlock.steps[2]
OK     82  KEEP_LINE_ENABLED             OK    138  nothingLandedBlock.detail
OK     62  KEEP_REASONS.knobs-moved      OK     59  nothingLandedBlock.steps[1]
OK     69  KEEP_REASONS.after-partial    OK    114  partialBlock.detail
OK     69  KEEP_REASONS.already-kept     OK     62  partialBlock.steps[1]
OK     42  KEEP_REASONS.after-mismatch   OK     41  restoredUnconfirmedBlock.title
OK    124  KEPT_PROOF_LINE               OK    163  restoredUnconfirmedBlock.detail
OK     44  LIVE_RESTORED                 OK    182  settledBody
OK     68  LIVE_SNAPSHOT_SAVED           OK    119  snapshotFailedBlock.detail
OK     71  PUT_BACK_LINE                 OK     43  snapshotFailedBlock.steps[0]
OK    101  PUT_BACK_LINE_AFTER_KEEP      OK    155  unconfirmedBlock.detail
OK    104  RESTORED_BODY                 OK     44  unconfirmedBlock.steps[0]
OK     54  RESTORED_STORED_LINE          OK     62  unconfirmedBlock.steps[1]
OK     82  SNAPSHOTTING_BODY             OK    111  confirmRig
OK     63  STILL_WRITING_LINE            OK    109  identifiedBody
OK    124  keptMismatchBlock.detail      OK     74  keptBody

42 OK, 0 MISS, 72 strings walked
```

**Zero misses, so zero typography corrections.** The contract already uses U+2019 in every apostrophe this module carries (`ZONA’s`, `site’s`), U+2014 in the `knobs-moved` reason and `settledBody`, U+2026 in the three busy labels. Test 2 of the spec repeats this match at every run and additionally walks the *other* branch of the four two-form builders (`nothingLandedBlock("put-back")`, `lostBlock(true, …)`, `confirmRig(["EN16", "BU16"])`, `partialBlock("Setup", "Timer")`), all four also OK.

### One transcription decision, recorded

The contract table's `unconfirmed` step 1 is `Click KEEP ON DEVICE to send the store again`; the I11 section body above it reads `Click KEEP ON DEVICE and confirm to send the store again`. The plan names the table as the source ("every literal is transcribed from it, not from this plan"), so the table's form shipped; the two differ by two words and say the same thing. Deferred item 4 records it for the contract's owner rather than this plan amending an approved document.

## Task 3 - `install-copy.spec.ts`, six gates over the words and the caps (commit `8974fef`)

Six tests in the plan's order. Test 1 is the three-needle scan (plus `from '` and `require(`) on the stripped source with non-vacuity on both reads. Test 2 reads `07-UI-SPEC.md` from disk (`../../../.planning/phases/07-install-flow/07-UI-SPEC.md` relative to the spec), asserts it is over 50,000 characters, contains `## Copywriting Contract` and `status: approved`, then requires the miss list to be `[]` over at least 40 long literals, and asserts the four other-branch names are among them. Test 3 asserts the three caps are the literals 129, 129 and 86, every honesty string under `HONESTY_CAP` by name, every `PUT BACK` line under `PUT_BACK_CAP` by name, `KEEP_LINE_ENABLED` and all six reasons under `KEEP_CAP` by key, and pins the contract's five stated figures. Test 4 walks the namespace export with a declared `SAMPLES` map (a function without a sample fails by name), recurses into arrays and blocks, and asserts per string: not empty, no emoji, no `!`, no U+0027, no `...`, no ` -- `, never `/error/i`, never `/loading/i`, never the assembled engine name; then U+2019, U+2026 and U+2014 each present; then exactly seven `_LABEL` exports, each uppercase and free of the three assembled wire words; then `/about a second/i` matching exactly `["HONESTY_NO_SESSION", "HONESTY_READY"]`; then the raw-source engine scan. Test 5: `Object.keys(KEEP_REASONS)` is the six keys, six distinct values, seven failure titles each ending in a letter with `announceTitle(title) === title + "."`, and the four success utterances plus `LIVE_STILL_WRITING` plus the seven announced titles making twelve distinct sentences, `LIVE_SNAPSHOT_SAVED` ending `Nothing has been written.` Test 6: `moduleList` over one to four names (no `, and`, an ` and ` in every list of two or more), `confirmRig` singular and plural both ending `at once.` and `undefined` for none, both `nothingLandedBlock` forms, `lostBlock` from both surfaces and both legs with `Nothing was stored` present on the RAM leg and absent on the store leg (Z-11), `partialBlock` in both orders, and a scan of every step in nine sampled blocks for multi-word uppercase runs, each of which must be one of `TRY ON DEVICE`, `PUT BACK`, `KEEP ON DEVICE` or the interpolated `CONNECT ZONA` (at least 12 controls named, so the loop is not empty).

### The five negative checks, four red tests and one compile error, all restored byte-identical

Same runner; `install-copy.ts` restored to `7ac0c186…` all five times; `git diff HEAD` empty afterwards.

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `PUT_BACK_LINE_AFTER_KEEP` lengthened to 142 characters | test 3 (and test 2; 2 failed, 4 passed) | `AssertionError: PUT_BACK_LINE_AFTER_KEEP is over the PUT BACK cap: expected 142 to be less than or equal to 129` |
| 2 | `about a second` inserted into `settledBody` | test 4 (and test 2; 2 failed, 4 passed) | `AssertionError: about a second appears only in the honesty slot: expected [ 'HONESTY_NO_SESSION', …(2) ] to deeply equal [ 'HONESTY_NO_SESSION', …(1) ]` |
| 3 | a seventh key `"after-lost"` added to `KEEP_REASONS` | `npm run check` (**4 errors**) | `install-copy.ts 366:3 Object literal may only specify known properties, and '"after-lost"' does not exist in type 'Readonly<Record<KeepReason, string>>'` - the diagnostic the plan asked for, naming the union |
| 4 | `PARTIAL_TITLE` given a trailing full stop | test 5 (1 failed, 5 passed) | `AssertionError: partialBlock's title does not end in a letter: Only one of the two scripts landed.: expected false to be true` |
| 5 | an Oxford comma in `moduleList` | test 6 (and test 2; 2 failed, 4 passed) | `AssertionError: expected 'EN16, and BU16' to be 'EN16 and BU16'` |

Test 2 going red alongside tests 3, 4 and 6 is the point of reading the contract from disk: a lengthened line, a repeated claim and a re-punctuated list are all also sentences the contract does not contain.

## Files created and modified

- `src/lib/device/snapshot.ts` - created; `SNAPSHOT_KEY`, `EventPair`, `SnapshotStore`, `PersistOutcome`, `readRaw` / `parse` / `save` / `fresh` / `validEntry` / `pagesOf` (private), `readSnapshot`, `persistIfAbsent`, `rememberLast`, `lastModuleId`, `hasSnapshotFor`
- `src/lib/device/snapshot.spec.ts` - created; 7 tests
- `src/lib/device/install-copy.ts` - created; 35 constants, 15 functions, 3 types
- `src/lib/device/install-copy.spec.ts` - created; 6 tests
- `.planning/phases/07-install-flow/07-03-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - item 4 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 3/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug] The spec's `_LABEL` type predicate did not type-check**
- **Found during:** Task 3, negative check 3 (`npm run check` on the seventh-reason mutation reported the expected error at `install-copy.ts 366:3` and three more at `install-copy.spec.ts 355-362`)
- **Issue:** `Object.entries(copy).filter((entry): entry is [string, string] => …)` narrows from `[string, <union of every export's value type>]`, and TypeScript rejects a predicate whose target is not assignable to its parameter. Vitest strips types, so the spec's 6 passed; svelte-check would have reported 3 errors on the clean tree.
- **Fix:** `(Object.entries(copy) as [string, unknown][]).filter(…)`. One line; the test's behaviour is unchanged.
- **Files modified:** `src/lib/device/install-copy.spec.ts`, before its commit. **Commit:** `8974fef` (the fixed file; no commit carried the error). `npm run check` after: 537 files, 0 errors.

Nothing else under Rules 1 to 4. Three notes, none a deviation:

1. **`snapshot.ts` reads the store once per call.** The first draft called `getItem` twice inside `persistIfAbsent` (once to distinguish a throw, once inside the parser). The `readRaw` / `parse` split with a `REFUSED` sentinel replaced it before the first test run and is recorded in the decisions; it is the design the plan's "parses it inside a try" describes, made explicit.
2. **`confirmRig` returns `string | undefined`**, `undefined` for no other module, where the plan's interfaces block wrote `string`. It is `multiModuleLine`'s convention from 06-02 and lets the block render no fourth row rather than an empty one; test 6 asserts it and the SAMPLES walk skips a non-string.
3. **`PersistOutcome` is exported** as a named type for the three-way return, additive to the interfaces block's inline union.

## Known stubs

None. Two pure modules with no UI and no data source; every export has a test that reads or drives it.

## Requirements

**`requirements-contributed: [SAFE-04, SAFE-05, SAFE-08]`** - contributed, not completed. SAFE-04's durability exists as a pure record that survives its own writes, a throwing store and a wrong schema, but nothing calls it yet (07-06). SAFE-05's confirmation sentence and SAFE-08's honest speed exist as literals a test holds character for character, but no component renders them yet (07-07, 07-10). `REQUIREMENTS.md` is not edited here.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 4** - `07-UI-SPEC.md`'s I11 section and its Copywriting Contract table disagree by two words on `unconfirmed` step 1 (`and confirm to send` versus `to send`); the table's form shipped. Owner: the contract's owner, at the next revision; no code.

## Next plan readiness

07-04 (the session's seams) starts from: quick **71 / 744**, sweep `3 13`, svelte-check 537 / 0. It does not import either module written here. 07-06 imports `readSnapshot`, `persistIfAbsent`, `rememberLast`, `lastModuleId` and `hasSnapshotFor` from `$lib/device/snapshot`, and the honesty strings, `KEEP_REASONS` and the builders from `$lib/device/install-copy`; every name in the plan's interfaces table exists. The session-only honest sentence for a module whose serial went unanswered (07-CONTEXT D-04 amended) is **not** in `install-copy.ts` - the plan did not list it and the orchestrator's brief assigns it to 07-04; whoever authors it should add it here so the module stays the one home of every install sentence, and test 2 will hold it against the contract the day it is added if the contract carries it.

The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T11:12:06.000Z.

- FOUND: `src/lib/device/snapshot.ts`
- FOUND: `src/lib/device/snapshot.spec.ts`
- FOUND: `src/lib/device/install-copy.ts`
- FOUND: `src/lib/device/install-copy.spec.ts`
- FOUND: `.planning/phases/07-install-flow/07-03-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md`
- FOUND: commit `cb9d846`
- FOUND: commit `ad5c0b2`
- FOUND: commit `8974fef`
- PASS: snapshot.ts contains hangar.snapshot.v1
- PASS: snapshot.ts carries the Pick<Storage shape
- PASS: install-copy.ts contains PERMANENT
- PASS: install-copy.spec.ts names 07-UI-SPEC
- PASS: install-copy.spec.ts contains 129
- engine name occurrences in this SUMMARY: 0
