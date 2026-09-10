---
phase: 12-touch-framework
plan: 03
subsystem: device
tags:
  [
    install-store,
    snapshot,
    schema,
    classifier,
    copy,
    e2e,
    counts,
    negative-check,
  ]
requires:
  - phase: 12-touch-framework
    plan: 02
    provides: "fetchAll / writeAll over 255/0, 0/6, 0/0 with three new step ids and a FetchedEvent label; fetchBoth / writeBoth kept as two-event adapters for exactly one plan's length; the synthetic ZONA's second RAM; and the finding that moduleState is EIGHTEEN call sites at :229"
  - phase: 12-touch-framework
    plan: 01
    provides: "PREV_FILES 84 / PREV_TESTS 874 (via 12-02) / e2e 87 titles, 106 runs / BASE_CHECK 582 / BASE_SWEEP 4 19 / catalog 29, and the eighteenth install.e2e.ts title whose count 12-01 itself predicted this plan would move"
provides:
  - "THE ADAPTERS ARE GONE. fetchBoth, writeBoth and EventStrings deleted; sequence.spec.ts asserts the removal by exports AND by a comment-stripped source scan, so 12-02's promise is kept where a reader of the two SUMMARYs finds it"
  - "The install store's five sites over three strings: snapshot (fetchAll), TRY, PUT BACK, CLEAR and the store proof, with canWriteBack over three and armed over three"
  - "CLEAR RESETS BOTH ELEMENTS (research option A), so D-21's 41-character line stays literally true of every element HANGAR has written, and a KEEP after a CLEAR leaves no HANGAR cfg on the module"
  - "hangar.snapshot.v2: three strings per entry; a v1 record is read with the CALLER's default page init and fromV1 beside it, is never overwritten, never deleted, and blocks a v2 entry for its own page"
  - "A three-way classifier over write order, with the partial that cannot occur named as unreachable in code and asserted as unreachable in a test"
  - "install-system: a third textarea on /dev/install/, first in write order - the site's only route for pasting an arbitrary page init at a module"
  - "D-11-08.1-a closed, with its diagnosis corrected: the baseline was read short, not a third write arriving"
affects: [12-04, 12-05, 12-07, 12-12]
tech-stack:
  added: []
  patterns:
    - "A count in a browser test is derived from the STEP LINES beside it, one site at a time, and the two that do not move are proved not to move with their step lines re-subjected - a blanket multiple got one of twenty-two wrong"
    - "A wait that guards an exact count belongs on the THING THE ASSERTION READS. A panel caption is published in the browser; a frame counter lives in Node; waiting on the caption does not imply the counter has caught up"
    - "A structural gate that forbids a layer from reaching another layer is honoured by MOVING THE FACT, never by spelling the specifier differently - a relative path that passes a substring scan while reaching the same module is the gate defeated, not satisfied"
    - "A copy amendment is asserted from both sides like a cap amendment: the contract's form must be in an approved contract, the shipped form must be what the module really produces, and an INSERTION must delete back to the contract's string character for character"
    - "Two closed unions rather than one open string, when the pairings encode a fact about the writer: a partial the writer cannot produce becomes a type error rather than a sentence somebody has to notice"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-03-SUMMARY.md
  modified:
    - src/lib/transport/sequence.ts
    - src/lib/transport/sequence.spec.ts
    - src/lib/transport/capture.ts
    - src/lib/device/install.svelte.ts
    - src/lib/device/install.spec.ts
    - src/lib/device/install-copy.ts
    - src/lib/device/install-copy.spec.ts
    - src/lib/device/snapshot.ts
    - src/lib/device/snapshot.spec.ts
    - src/lib/device/wire-pin.spec.ts
    - src/lib/tune/model.ts
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/InstallState.svelte
    - src/lib/ui/TryOnDevice.svelte
    - src/lib/ui/TuningRegion.svelte
    - src/routes/dev/install/+page.svelte
    - src/routes/dev/session/+page.svelte
    - e2e/install.e2e.ts
    - e2e/session.e2e.ts
    - docs/INSTALL-RUNBOOK.md
    - .planning/phases/11-bench-corrections/deferred-items.md
key-decisions:
  - "THE TUNER DOES NOT REACH THE PROTOCOL, AND THE PLAN'S MECHANISM FOR IT DOES NOT EXIST. The plan says model.ts should read SYSTEM_DEFAULT_SETUP 'through the same lazy import the file already uses for the protocol'. There is no such import - model.ts's only dynamic import is ../sim/lua-pad-sim - and adding one is forbidden: ladder.spec.ts:275 scans every file under src/lib/tune/, comment-stripped, for lib/protocol, lib/transport, lib/device and the transport write. It went RED with the import in place. The tuner therefore publishes system verbatim from a new systemSetup option, empty when the entry has none, and the install store substitutes the firmware default in ONE function used by the write path and by armed alike"
  - "CLEAR RESETS BOTH ELEMENTS, option A, and the cost is one acknowledgement. Under option B a KEEP after a CLEAR would store HANGAR's library to flash and D-21's line would be untrue by one element on a page HANGAR did write"
  - "A V1 ENTRY FOR A PAGE BLOCKS A V2 ENTRY FOR THE SAME PAGE. The plan asks only that v1 is never overwritten; that is not enough, because readSnapshot reads v2 first - a v2 entry written beside a v1 one SHADOWS the original, which is the same loss with a longer name"
  - "THE FAULT LISTS MOVED WITH THE COUNTS AND THE NUMBERS ARE DERIVED. A RAM leg is three writes, so the acknowledgement carrying the last event's first attempt is the third: dropAcks234 became dropThreeAcksFrom(class, first) and its CONFIG callers moved to 3, its PAGESTORE caller stayed at 2. The plan's tables do not name the fault lists"
  - "THE MISMATCH FAULT IN install.spec.ts HAD TO BE SCOPED BY ELEMENT, exactly as 12-02 scoped fake-zona.ts's. It matched any CONFIG/FETCH at event 0, which is the system element's setup too, so it answered the system re-fetch with a report echoing element 0 and the leg TIMED OUT in a test written to prove mismatch handling. 12-02 measured that failure mode and named it; this is where it would have landed"
patterns-established:
  - "A plan-named mechanism that a structural gate forbids is reported as a plan defect and routed around by moving the FACT to the layer that already owns it, never by weakening or side-stepping the gate"
requirements-completed: []
duration: 65min
completed: 2026-09-10
---

# Phase 12 Plan 03: The two seams above the transport, and everything that counted to two Summary

**Every write HANGAR makes is three strings now, and every number that said two
says three except the four that say something else. The install store
snapshots, tries, puts back, clears and proves over `fetchAll` / `writeAll`; the
two-event adapters are deleted and `sequence.spec.ts` asserts their absence by
exports and by source; the schema is `hangar.snapshot.v2` with a v1 record read
as `system = default`, surfaced through a `fromV1` flag, never overwritten,
never deleted and never shadowed; CLEAR resets BOTH elements so D-21's
41-character line stays literally true; and the classifier names which of three
landed and says in code which partial this writer cannot produce. Twenty-two
numeric sites in `install.e2e.ts` were walked one at a time and derived from the
step lines beside them: twenty moved, `:644` and `:670` are proved unchanged,
and `:613` landed on FIVE — the site a blanket multiple gets wrong, and the
negative check that set it to six went red with `Received: 5`. Counts:
`PREV_FILES 84 + 0 = 84`, `PREV_TESTS 874 + 3 = 877`, sweep `4 19`, e2e `87 + 0`
titles and `106 + 0` runs, green TWICE. Nothing touched a ZONA and nothing was
deployed.**

## Performance

- **Duration:** about 65 min
- **Tasks:** 2 of 2
- **Files:** 0 created, 21 modified, across two commits plus this document's own

---

## Counts, as carried names plus deltas

| Name              | Carried from  | Term      | Observed                                       |
| ----------------- | ------------- | --------- | ---------------------------------------------- |
| `PREV_FILES`      | **84** (12-02) | `+0`      | **84**                                         |
| `PREV_TESTS`      | **874** (12-02) | **`+3`** | **877** passed, 1 todo (reported, never asserted) |
| `BASE_SWEEP`      | **`4 19`**    | `+0`      | **`4 19`**                                     |
| `PREV_E2E` titles | **87** (12-01) | `+0`      | **87** (`grep -c "test(" e2e/*.e2e.ts`, summed) |
| `PREV_E2E` runs   | **106** (12-01) | `+0`     | **106 passed**, twice                          |
| `BASE_CHECK`      | **582**       | provenance | **582 files, 0 ERRORS 0 WARNINGS**             |
| catalog           | **29** (9 + 20) | `+0`    | 29 (untouched; no entry, preset or facet moved) |

`check-counts.mjs 84 877` and `check-counts.mjs 4 19` both report _"matches the
expected counts"_, exit 0. **This plan's term in the phase chain is `+3`,
exactly as the plan declares**, and it lands as the two per-file terms the plan
names:

| File                             | Term | Observed   |
| -------------------------------- | ---- | ---------- |
| `src/lib/device/install.spec.ts`  | +2   | 21 → **23** |
| `src/lib/device/snapshot.spec.ts` | +1   | 7 → **8**  |
| `src/lib/transport/sequence.spec.ts` | +0 | 12 → **12** (rewritten, not added) |
| `src/lib/device/install-copy.spec.ts` | +0 | 6 → **6** |

### The suites, as run

| Command                             | Result                                                     |
| ----------------------------------- | ---------------------------------------------------------- |
| `npm run check`                     | 582 files, 0 errors, 0 warnings                            |
| `npm run lint`                      | clean (prettier + eslint)                                  |
| `npm run test:quick`                | 84 files / 877 passed / 1 todo                             |
| `npm run test:sweep`                | 4 files / 19 passed                                        |
| `npm run build`                     | clean; `postbuild` archived `source-15ee5186….tar.gz`, 1687 KB |
| `npx playwright test --workers 3` (1) | **106 passed**, 2.2 m                                    |
| `npx playwright test --workers 3` (2) | **106 passed**, 2.0 m                                    |

`test-results/` removed by hand after every run, and nothing was committed while
a suite was running.

---

## `install.e2e.ts`, every numeric site as found

The plan's table is written against line numbers from `c5fd1cd`. **Every row's
line number in the tree is higher — by 14 in the probe block and by 19 in the
real-page block** — because 12-01 added a title. Each row below is matched by
CONTENT and its tree line is given as found. The counts are derived from the
step lines beside them, never multiplied.

| Plan line | Tree line | Assertion | Before | After | Derivation |
| --- | --- | --- | --- | --- | --- |
| `:415` | **`:429`** | `CONFIG/FETCH` | 2 | **3** | one snapshot, three fetches; the comment above amended |
| `:445` | **`:459`** | `CONFIG/FETCH` | 4 | **6** | two snapshot attempts × 3 |
| `:485` | **`:499`** | `CONFIG/EXECUTE` | 2 | **3** | one RAM leg × 3 |
| `:505` | **`:519`** | `CONFIG/EXECUTE` | 4 | **6** | two RAM legs × 3. `HEARTBEAT` beside it stays **2** — one restore per leg, and there are still two legs |
| `:547` | **`:561`** | `CONFIG/EXECUTE` | 2 | **3** | one RAM leg |
| `:548` | **`:562`** | `CONFIG/FETCH` | 4 | **6** | snapshot 3 + one refetch round of 3 |
| `:574` | **`:588`** | `CONFIG/EXECUTE` | 2 | **3** | one RAM leg |
| `:575` | **`:589`** | `CONFIG/FETCH` | `2 + 6` | **`3 + 9`** | snapshot 3 + three rounds × 3. The `3` in the round-count lines does **not** move; a `refetch-system` line joined them |
| `:613` | **`:627`** | `CONFIG/EXECUTE` | 4 | **5, not 6** | `write-system ok 1` + `write-timer ok 1` + `write-setup` × 3 |
| `:644` | **`:658`** | `CONFIG/EXECUTE` | 1 | **1 — UNCHANGED** | `nackFirstWrite` refuses the first write and nothing is retried; one write is attempted either way. What moved is WHICH write: `write-system nack 1` |
| `:670` | **`:684`** | `CONFIG/EXECUTE` | 3 | **3 — UNCHANGED** | `dropAck` nth 1, 2, 3 is still the first write's three attempts; the step line became `write-system timeout 3` |
| `:690` | **`:704`** | `n = writes + 1` | 4 | **5** | SERIALNUMBER 1 + CONFIG 3 = four frames, so the next write is the fifth; the comment's "three" amended |
| `:752` | **`:766`** | `CONFIG/FETCH` | 4 | **6** | two snapshots × 3. `SERIALNUMBER` beside it stays **2** |
| `:788` | **`:802`** | `CONFIG/EXECUTE` | 2 | **3** | one RAM leg. `PAGESTORE` beside it stays **3** |
| `:829` | **`:843`** | `CONFIG/EXECUTE` | 4 | **6** | two RAM legs × 3. `PAGESTORE` beside it stays `1 + 3` |
| `:1327` | **`:1346`** | `CONFIG/EXECUTE` | 2 | **3** | one try-on |
| `:1418` | **`:1437`** | `CONFIG/EXECUTE` | 2 | **3** | one try-on |
| `:1459` | **`:1478`** | `CONFIG/EXECUTE` | 2 | **3** | one try-on |
| `:1575` | **`:1594`** | `CONFIG/EXECUTE` | 6 | **9** | three RAM legs × 3 |
| `:1708` | **`:1727`** | `CONFIG/EXECUTE` | 4 | **6** | two settled RAM legs × 3 |
| `:1765` | **`:1784`** | `CONFIG/EXECUTE − configBefore` | 2 | **3** | CLEAR writes three firmware defaults. **D-11-08.1-a's site**; the wait landed first |
| `:1789` | **`:1808`** | `CONFIG/EXECUTE` | 6 | **9** | try-on + clear + put-back, three each; the comment amended |

**Twenty-two sites, twenty moved, two proved unchanged, one at five.** All three
figures assert.

### The sites the table does not name, and there are three

1. **`:1945` → tree `:2023`, 12-01's own title, 4 → 6.** Named in the plan's
   task 3 in prose but not in its table, and named in 12-01's own comment at the
   site: _"12-03 moves this literal to 6 when the system element lands, and its
   plan names this site."_ It is a RAM leg per click and two clicks. **Not a
   plan defect** — anticipated twice, in two documents, and re-derived here.
2. **`:433`, `expect((await writesOf(page)).length).toBe(3)` → 4.** A
   `writesOf` site, not a `seen(` site, in the same family as the row at `:690`
   that the table DOES name. Found by reading, not by grep.
3. **`:420`, the `install-snapshot` READOUT string, `durable 17 17` →
   `durable 33 17 17`.** Not a count at all: a rendered string whose shape moved
   because the probe page prints three lengths. **No grep for a numeric literal
   finds it, and no reading of the table would have.** It was found by the first
   full Playwright run, which went red on exactly this one title — the single
   most useful thing the first suite run did.

### The second class: eleven step-line arrays, plus the negatives

Every `stepLines` comparison gained a `write-system` or `refetch-system` element
in write order. `grep toBe(2)` finds none of them.

| Site (plan) | What changed |
| --- | --- |
| `:421-423` | the snapshot's ids gained `fetch-system ok 1` in second position |
| `:481-482` | `write-system ok 1` first |
| `:501-502` | `write-system ok 1` first |
| `:543-544` | `refetch-system ok 1` first |
| `:571-572` | a third `refetch-system` filter joined the two; **the 3 is the ROUND count and did not move** |
| `:609-610` | `write-system ok 1` first |
| `:640` | `write-timer nack 1` → **`write-system nack 1`** |
| `:643` | the `write-setup` negative gained a **`write-timer` sibling**, so the abort is proved over both unreached legs |
| `:667` | `write-timer timeout 3` → **`write-system timeout 3`** |
| `:715` | `lostLines[0]` `write-timer aborted 1` → **`write-system aborted 1`** |
| `:719` | the `write-setup` negative gained its **`write-timer` sibling** |
| `:823-824` | `write-system ok 1` first, so the put-back's record is four steps then the store |

### A third class the plan does not name: the fault lists

`dropAck` `nth` values are derived from the write count, and a RAM leg is three
writes now.

| Site | Before | After | Why |
| --- | --- | --- | --- |
| `install.e2e.ts` partial title | CONFIG nth 2, 3, 4 | **3, 4, 5** | ack 1 is the page init and 2 the Timer — both must land — so the Setup's three attempts are 3, 4, 5. Without this the title would have proved a DIFFERENT partial |
| `install.e2e.ts` deaf title | CONFIG nth 1, 2, 3 | **unchanged** | still the first write's three attempts |
| `install.e2e.ts` store titles | PAGESTORE nth 1-3 / 2-4 | **unchanged** | a store leg is one write per attempt |
| `install.spec.ts` `dropAcks234` | fixed at 2, 3, 4 | **`dropThreeAcksFrom(class, first)`**; CONFIG callers at 3, PAGESTORE caller at 2 | same derivation, in a helper that now takes the number rather than hiding it in its name |

### A fourth class: two content assertions

- The decoded frame at the unplug asserted `EVENTTYPE === EVENT_TIMER`. The
  causing frame is the page init now, so it asserts **`ELEMENTNUMBER === 255`
  AND `EVENTTYPE === EVENT_SETUP`** — both, because 255/0 and 0/0 share an event
  number and an event-only assertion would pass for the wrong frame.
- One title's TEXT was amended: _"TRY ON DEVICE lands both acknowledgements…"_ →
  _"…lands all three acknowledgements…"_. A title is a claim; that one became
  untrue. The count of titles did not move.

## `session.e2e.ts`, enumerated

| Line | Assertion | Before | After |
| --- | --- | --- | --- |
| `:314` | the `expect.poll` message | _"both config reads"_ | _"all three config reads - the page init, the Setup and the Timer"_ |
| `:317` | polled `CONFIG/FETCH` | `2 * connects` | **`3 * connects`** |
| `:337` | `CONFIG/FETCH` | `2 * connects` | **`3 * connects`** |
| `:338` | `writes(page)` | `3 * connects` | **`4 * connects`** |
| `:273` | the diagnosis comment | _"three round trips"_, _"expected 4, received 3"_, `fetchBoth` | four round trips, `fetchAll`, and the same failure re-derived as **expected 6, received 5** |
| `:295` | _"reaching 2 \* connects"_ | prose | **`3 * connects`** |
| `:887` | _"Two connects, two snapshots, six reads"_ | prose | **eight reads**, with the composition spelled |

**`:338` was found by READING, not by grep, and this is the sentence that stops
the next reader trusting the grep:** it is a `3 *` and a WRITE count, so neither
a search for `2 *` nor a search for a fetch counter would have surfaced it. Its
new value is `4 * connects` — one SERIALNUMBER/FETCH plus three CONFIG/FETCH per
connect — and it is the only site in either file whose multiplier goes from three
to four.

---

## D-11-08.1-a, closed — and its diagnosis was the wrong way round

**Closed at `e2e/install.e2e.ts`'s CLEAR title, in commit `df71d0b`, the same
commit as the literal it guards.** The wait landed before the literal, as the
plan asks, but it did **not** land where the plan expected and the reason is
worth the paragraph.

The deferred item reads the failure — `Expected: 2, Received: 3` — as _"a third
write arriving rather than a second one not yet having gone out"_, because the
observed value was HIGHER. That reading points at the final read. It is the same
arithmetic seen from the other end:

- `configBefore` is taken with **no wait**, immediately after `tryOnPage`.
- `tryOnPage` returns as soon as `PLAYING NOW` is on screen, and that caption is
  published by the install store **in the browser**, the moment `#ramLeg`
  returns — while the try-on's last frame may still be crossing the CDP hop to
  the **Node** fake that owns `zona.seen`.
- So the BASELINE was read one short, and the delta came out one long.

**No third write of the old shape existed**, which is the branch the plan asked
to be named if the wait alone could not explain the number. It can: the fix is a
`expect.poll` on the COUNTER, not on the panel, because the counter is what the
assertion reads and therefore the thing that has to have settled. The poll's
message states the completion it implies — a try-on is three writes, so the
counter reaching three IS "every frame of it has been answered in Node".

`deferred-items.md` carries the closure and the corrected diagnosis in full.

---

## The three-way classifier, and the partial that cannot occur

`#classify` reads three step ids in write order. Three cases, and only three:

| Steps | Phase | `landed` | `failed` |
| --- | --- | --- | --- |
| `write-system` failed | `nothing-landed` | — | — |
| `write-system` ok, `write-timer` failed | `partial` | `The page init` | `the Timer and the Setup` |
| `write-system` and `write-timer` ok, `write-setup` failed | `partial` | `The page init and the Timer` | `the Setup` |

**"The page init did not land but the Setup did" CANNOT HAPPEN WITH THIS
WRITER**, and it is said twice: in the classifier's own comment, at length, with
12-RESEARCH Pitfall 6 named so a reader who came looking for it finds the
answer; and in `install.spec.ts`'s new test, which walks all three cases by
refusing a different write in each and then asserts over all three runs that no
module ends holding the tuner's Setup while its page init is not the tuner's.
The reason is structural rather than lucky: the write that would have to fail
first is the one that goes first.

`landed` and `failed` are two **closed unions** (`LandedWords`, `FailedWords`)
rather than one open string, so the two pairings above are the only ones
expressible and a fourth is a type error rather than a sentence somebody has to
notice.

---

## The snapshot at v2, and the v1 record proved

`snapshot.ts` **takes the default from its caller**, and it has to: its own first
test asserts the module has **zero specifiers of any kind**, `import type`
included, so it can never reach the pinned package. The install store passes
`P.SYSTEM_DEFAULT_SETUP` from the protocol module it already resolves lazily
inside `#snapshot`.

Proved in `snapshot.spec.ts`'s new test, on a v1 record written by hand:

- it reads as `{ system: <the caller's default>, setup, timer, fromV1: true }`;
- a **different** caller default lands a different string, so the value really
  comes from the parameter rather than from anything the module invented;
- `hasSnapshotFor` and `lastModuleId` both answer from it;
- `persistIfAbsent` for that module and page returns **`"kept"`** — see the
  decision below — and the v1 record's raw string is **byte-unchanged**,
  asserted against the exact string that was written;
- a page the v1 record does NOT have is written under v2 beside it, read back as
  a v2 entry, and the v1 record is byte-unchanged again;
- where both keys hold the same module and page, **v2 wins**;
- a v2 entry missing `system` is **absent**, not half-read.

**A v1 entry blocks a v2 entry for its own page, and the plan does not ask for
that.** The plan asks only that v1 is never overwritten. That is not enough:
`readSnapshot` reads v2 first, so a v2 entry written beside a v1 one **shadows**
the original. The concrete loss is a returning visitor who reconnects while
HANGAR's own configuration is still in the module's RAM — the fetch returns
HANGAR's work, `persistIfAbsent` would file it as the v2 "original", and from
that moment PUT BACK puts HANGAR back. Recorded as a deviation below.

---

## CLEAR resets both elements, proved

Asserted in node three ways in `install.spec.ts`:

- the wire, by element and event and string:
  `[[255, 0, SYSTEM_DEFAULT_SETUP], [0, 6, TOUCH_DEFAULT_TIMER], [0, 0, TOUCH_DEFAULT_SETUP]]`,
  read through the pinned package and never from `install-copy.ts`;
- the fake's second RAM holds `SYSTEM_DEFAULT_SETUP` afterwards, and the test
  asserts `SYSTEM_DEFAULT_SETUP !== MODULE_SYSTEM` so the check cannot pass by
  the module never having had a page init of its own;
- **three distinct page inits pass through the system slot in one test** — the
  module's own at connect, the tuner's after the try-on, the firmware's after
  the clear — asserted as three distinct strings, so nothing above can be a
  coincidence.

And in the browser: the CLEAR title's delta is **3**, and `PAGESTORE/EXECUTE` is
a counted **0** either side, so A-26's RAM-only ruling is unweakened.

The store's own comment carries the D-21 reason and the `grid_ui.c:398-409` /
`:1126-1134` consequence: writing an event its OWN default sets
`cfg_default_flag` and `grid_ui_bulk_page_store` then DELETES the cfg, so a KEEP
after a CLEAR leaves no HANGAR file on the module at all. **The 41-character line
is byte-untouched.**

---

## The copy that a third script made untrue, before and after

Four sentences moved. Every other string `install-copy.ts` ships is
byte-identical, and the mechanism that proves it is new: `AMENDED_BY_THE_THIRD_SCRIPT`,
asserted from both sides exactly as `AMENDED_BY_MEASUREMENT` is — the contract's
form must be present in an approved contract, the shipped form must be the one
the module really produces under that name, and an **insertion must delete back
to the contract's string character for character**, so an amendment cannot
rewrite the rest of a sentence under cover of adding a clause.

| Name | Before | After |
| --- | --- | --- |
| `SNAPSHOTTING_BODY` | `Taking a copy of the Setup and Timer scripts already on your ZONA’s touch element.` | `…touch element, and the page’s own init script.` |
| `identifiedBody` | `…Its own Setup and Timer are saved here, so PUT BACK can undo anything you try.` | `…saved here, and the page’s own init script, so PUT BACK can undo anything you try.` |
| `CONFIRM_REPLACES` (SAFE-05) | `This replaces the Setup and Timer scripts on your ZONA’s touch element, and it survives a power cycle.` | `…touch element and the page’s own init script, and it survives a power cycle.` |
| `partialBlock` detail | `{Timer} reached your ZONA and {Setup} did not. What is on the module now is half this configuration and half your own.` | `The page init and the Timer reached your ZONA and the Setup did not. What is on the module now is part of this configuration and part of your own.` (and the page-init-only branch) |
| `partialBlock` step 1 | `Click TRY ON DEVICE to send both again` | `Click TRY ON DEVICE to send all three again` |

`PARTIAL_TITLE` is **unchanged** — it never named a count. **D-21's CLEAR line is
unchanged.**

### The copy that was READ and deliberately LEFT

`install-copy.ts:228, 312, 329, 381, 430, 434, 520` and `session-copy.ts:280, 302, 311`
were each read against _"is this untrue now that three strings are copied?"_ and
left, on the plan's instruction. **One reading is worth recording as a judgement
rather than as a silence:** `nothingLandedBlock` says _"Neither script got
through"_ and its steps say _"send both again"_. `nothing-landed` is reachable
only when the FIRST write fails, so the two scripts it names genuinely never
went out and the sentence is true of what it names; but the click it describes
now sends three. Left per the plan's "amend those, keep the rest", and **handed
to 12-12** with the rest of the count prose.

---

## The negative checks — four plants, four exit codes, every one reverted

Every plant was made in CODE through a file-to-file replacement whose **count was
asserted before the write** (the helper exits 2 on a disagreement), and every one
was reverted by copying back a scratch copy and comparing `sha256sum` either side
— never `git checkout`, `git restore`, `git stash` or `git clean`.

| # | Task | Plant | Where | Observed | Exit |
| --- | --- | --- | --- | --- | --- |
| A | 01 | the CALLER's set order swapped — Setup key first | `install.svelte.ts`, `tryOnDevice`'s `strings` literal, 1 replacement | **GREEN, 1 passed** — and this is the RIGHT answer | **0** |
| B | 01 | `validV2` accepts a two-string entry | `snapshot.ts`, 1 replacement | red: **`a half-read entry reached the caller: expected { system: '', setup: 's', … } to be undefined`** | 1 |
| C | 02 | one `toBe(3)` put back to `toBe(2)` | `install.e2e.ts:522`, 1 replacement | red: **`Expected: 2  Received: 3`** | 1 |
| D | 02 | `:613`'s five set to the blanket multiple six | `install.e2e.ts`, 1 replacement | red: **`Expected: 6  Received: 5`** | 1 |

**Plant A is green because the order is not the caller's to get wrong.** It
lives in `writeAll`, one function, and a caller that hands the set over with its
keys in another order changes nothing at all. That is the finding, and it is now
a permanent assertion in `sequence.spec.ts` rather than a one-off run: a second
rig writes the same three strings with `setup` first and the same
`[[255,0],[0,6],[0,0]]` comes off the wire.

**Plant C is the proof the third write is on the wire IN THE BROWSER** and not
only in node. **Plant D is the proof the enumeration was derived rather than
pattern-matched**: six is exactly what a blanket ×1.5 would have produced, and
the module answers five.

Checksums, every planted file, before the plant and after the restore —
identical in all four:

```
install.svelte.ts 2ede71170eba991c7c76d46a4c0ab6f58b3c8e4cd2c43e6dd4e801c79e5392ad
snapshot.ts       c1e4064bede68ac32d58db88df964eec82be6e9822912c116d4037c2c77f6c9d
install.e2e.ts    db14981fb25d9f7ec71b1c2218dd7d0fa1f877ddd1da7a78fdc81835db183308
```

---

## Deviations from the plan

### 1. [Rule 3 — Blocking] The plan's mechanism for `model.ts` does not exist, and a structural gate forbids it

The plan's task 01 step 2 says `landLua` and the preset landing should pass
`SYSTEM_DEFAULT_SETUP` _"read through the same lazy import the file already uses
for the protocol"_. **There is no such import.** `model.ts`'s only dynamic
import is `../sim/lua-pad-sim`; it has never named `$lib/protocol` in any form.

Adding one is not merely absent, it is **forbidden**.
`src/lib/tune/ladder.spec.ts:275` reads every file directly under
`src/lib/tune/`, strips its comments, and asserts the offender list is empty for
four needles: the transport write, `lib/transport`, `lib/protocol` and
`lib/device` — the structural half of _"nothing in the tuning model can reach a
port"_. With `import("$lib/protocol")` in place it went **red**, naming
`src/lib/tune/model.ts -> lib/protocol`.

Two ways out were refused. A relative `../protocol` specifier passes the
substring scan while reaching the same module — that is the gate defeated rather
than satisfied, and it is exactly what 12-02 declined to do to
`forbidden-instructions.spec.ts`. Re-deriving the constant from
`@intechstudio/grid-protocol` inside `model.ts` would be a **second copy of
D-20's rule**, and two derivations that agree today are not one that cannot
disagree.

**Fix:** the fact moved to the layer that already owns it.
`TunerOptions` gains `systemSetup?: string`; `buildTuner` reads it once,
synchronously, so `land()` stays synchronous; the tuner publishes it verbatim,
and an entry with none publishes the **empty string**, meaning "no page init of
its own". `install.svelte.ts` — which already resolves the protocol module
lazily in every action and already reads `SYSTEM_DEFAULT_SETUP` for CLEAR —
substitutes the firmware default in **one function**, `#pageInit`, used by the
write path and by `armed` alike so the two cannot disagree about what is
playing. The empty string can never reach the wire, and `install.spec.ts`
asserts exactly that: a config with `system: ""` produces `SYSTEM_DEFAULT_SETUP`
on the wire and arms. 12-07 fills `systemSetup` in per entry and the
substitution stops firing for those entries. **The gate was not weakened**:
`ladder.spec.ts` is byte-unchanged and green. **Files:** `src/lib/tune/model.ts`,
`src/lib/device/install.svelte.ts`, `src/lib/device/wire-pin.spec.ts`.
**Commit:** `15ee518`.

**A measured sub-finding worth keeping.** The first attempt awaited the string
inside the two measure routes. Four tests went red — `wire-pin.spec.ts`'s Lua
pin and three of `model.spec.ts`'s — because a real asynchronous boundary in the
middle of a landing is not covered by the fixed microtask hops those files wait
on (`settle()`, and wire-pin's own "TWO CLOCKS" paragraph). Resolving it once in
`buildTuner`, before anything can land, is why `land()` had to stay synchronous.

### 2. [Rule 1 — Bug] A v1 entry has to BLOCK a v2 entry for its own page, not merely survive one

The plan says `persistIfAbsent` _"never writes v1, never deletes v1"_. Doing only
that loses the original anyway: `readSnapshot` reads v2 first, so a v2 entry
written beside a v1 one for the same page **shadows** it. The reachable path is
ordinary — a returning visitor reconnects while HANGAR's configuration is still
in the module's RAM, the fetch returns HANGAR's work, and it would be filed as
the v2 "original".

**Fix:** `persistIfAbsent` consults the v1 record for that module and page and
returns **`"kept"`** when it finds a valid entry, leaving both records exactly
where they are. Asserted in `snapshot.spec.ts`'s new test from both ends: the
outcome is `"kept"`, the read still returns the ORIGINAL's setup, and the v1
raw string is byte-identical to the one written. **Files:**
`src/lib/device/snapshot.ts`, `src/lib/device/snapshot.spec.ts`. **Commit:**
`15ee518`.

### 3. [Rule 3 — Blocking] `install.spec.ts`'s mismatch fault had to be scoped by ELEMENT

The `kept-mismatch` test's `wrap` lied about any `CONFIG/FETCH` whose
`EVENTTYPE` was `EVENT_SETUP`. The system element's setup is event 0 too, so
once the store fetched three the fault answered the SYSTEM re-fetch with a report
echoing element **0** — which the system fetch's own filter refuses. The leg then
**timed out** instead of mismatching, in a test written to prove mismatch
handling. **This is the exact failure 12-02 measured and named** when it scoped
`fake-zona.ts`'s `mismatchRefetch` the same way, and the queue answers it with a
300 ms timeout rather than a rejection, so it presents as silence.

**Fix:** `ELEMENTNUMBER === ELEMENT_TOUCH` added to the condition and
`element: ELEMENT_TOUCH` passed to the report it builds, with 12-02's finding
cited in the comment. **Files:** `src/lib/device/install.spec.ts`. **Commit:**
`15ee518`.

### 4. [Rule 3 — Blocking] Four files the plan does not list had to move for the tree to compile

- `src/lib/ui/TryOnDevice.svelte`, `src/lib/ui/Coverflow.svelte` and
  `src/lib/ui/TuningRegion.svelte` each declare the tuner's pair
  **structurally** — `{ setup: string; timer: string }` — because no file under
  `src/lib/ui/` may import the tuning model. All three gained `system`, and
  without them `npm run check` reports the store's `ConfigStrings` as
  unsatisfiable at three call sites.
- `src/lib/ui/InstallState.svelte` passes `install.landed ?? "Timer"` into
  `partialBlock`; the fallbacks moved to the new unions' members.
- `src/routes/dev/skeleton/+page.svelte` called `T.fetchBoth` twice and typed two
  fields `FetchedPair`; it moves to `fetchAll` / `FetchedSet`, guards three and
  compares three. Nothing counts its frames (`skeleton.e2e.ts` tests only the
  no-Web-Serial half), so no literal moved with it.
- `src/lib/transport/capture.ts`'s `STEP_IDS` comment named the adapters.

**Commit:** `15ee518`.

### 5. [Rule 3 — Blocking] `/dev/install/+page.svelte` was committed with task 01, not task 02

The plan lists the probe page under task 02. Its `pair()` returned two strings,
so with task 01's `ConfigStrings` in place the page does not type-check — a task
01 commit without it would have had a red tree. The page moved in `15ee518`; the
runbook sentence that names its third textarea moved in `df71d0b`, with task 02.
No content moved between the two commits; only the boundary did.

### 6. [Rule 2 — Missing critical functionality] `install-copy.spec.ts` gained a second amendment mechanism

Test 2 requires every literal over forty characters to appear in one of the two
approved contracts verbatim. Four amended sentences do not, and the existing
`AMENDED_BY_MEASUREMENT` escape is specifically about CAPS. Excusing them by name
would have been an exemption rather than an amendment.

**Fix:** `AMENDED_BY_THE_THIRD_SCRIPT`, seven rows, asserted from both sides —
see the copy section above. The approved contracts were **not edited**.
**Commit:** `15ee518`.

### 7. [Rule 2 — Missing critical functionality] `shape()` in `install.spec.ts` gained the element

The frame-shape helper read `EVENTTYPE` and not `ELEMENTNUMBER`. With three
writes, 255/0 and 0/0 share an event number, so `ramLegFrames` would have been
satisfied by two frames in the wrong slots. The element is in the shape now, and
`ramLegFrames` carries it per frame. **Commit:** `15ee518`.

### 8. [Rule 2 — Missing critical functionality] `deferred-items.md` records the closure and the corrected diagnosis

Leaving a closed item reading as open — and reading with a diagnosis this plan
found to be inverted — would be a false statement on disk.
`.planning/phases/11-bench-corrections/deferred-items.md` gains a CLOSED
paragraph naming the commit and the corrected reading. **Commit:** to follow with
this document.

---

## Count disagreements, reported and NOT reconciled

1. **`moduleState` is EIGHTEEN call sites at `:229`, not seventeen at `:215`**,
   exactly as 12-02 reported. Confirmed again here:
   `grep -n moduleState e2e/install.e2e.ts` returns one declaration and eighteen
   calls carrying `nth` 1 through 18 with no gap and no repeat. The plan and
   `12-VALIDATION.md` were written against `c5fd1cd`; 12-01 added the
   eighteenth. **Reported, not reconciled.** The factory gained one key
   (`system`) in this plan; not one call site moved.
2. **Every line number in the plan's `install.e2e.ts` table is 14 or 19 lower
   than the tree's**, for the same reason. Every row was matched by content and
   its tree line is recorded in the table above.
3. **`grep -rn "fetchBoth\|writeBoth\|EventStrings" src/ e2e/` is not literally
   empty**, and cannot be: the four remaining hits are inside
   `sequence.spec.ts`'s **removal assertion** and its comment — the assertion
   that names the absence has to name the names. Every other occurrence in the
   tree is gone.
4. **`STATE.md`'s frontmatter `total_plans` and `completed_plans` are
   contaminated by a concurrent Phase 13 session**, which has committed
   twenty-one `13-*` files. The tools recompute totals from disk. Reported, not
   reconciled; not one of those files was read or touched.
5. **`STATE.md`'s frontmatter `percent` still reads 100** and has since Phase 10.
   Left alone, as instructed.

---

## Things the plan asserts that the tree does not support

1. **`model.ts` has no lazy protocol import to use**, and `ladder.spec.ts:275`
   forbids adding one. Deviation 1, with the red run recorded.
2. **The plan's `install.e2e.ts` table misses three numeric sites**: `:1945`
   (12-01's title, anticipated in prose by both documents), `:433` (a `writesOf`
   site) and the `install-snapshot` READOUT string. Only the last is a genuine
   gap in the enumeration — it is not a count at all, and no reading of the
   tables would have found it. The first full suite run did.
3. **The plan's tables do not cover the `dropAck` fault lists**, which have to
   move with the counts or the tests prove a different partial.
4. **`docs/SESSION-RUNBOOK.md` states no fetch count**, so it is untouched, as
   the plan's own conditional allows. Its line 14 test totals (724 / 13 / 77) are
   stale against 877 / 19 / 87, and that is 12-12's, which rewrites every count.

---

## What was NOT done, and why

- **`gsd-tools roadmap update-plan-progress` was SKIPPED**, on instruction.
  `.planning/ROADMAP.md` is byte-unchanged by this plan.
- **`gsd-tools requirements mark-complete` was SKIPPED, and this is a judgement.**
  The plan's frontmatter names `[SAFE-01, SAFE-03, SAFE-04, SAFE-05, SAFE-07,
  SAFE-09, TUNE-02]`. **All seven are already `[x]`.** SAFE-03 and SAFE-07 are
  falsified in their present wording by the third string and are amended by name
  at 12-12, not here; re-ticking them would say nothing and pre-empt that
  amendment. **CAT-04 stays `[ ]` for the fifth time** — its subject is the shape
  of the catalog data file, and nothing here touched it.
- **`docs/TESTING.md` was NOT touched.** Its line 859 still describes
  `sequence.spec.ts` as _"`writeBoth` as the one writer"_, which this plan makes
  untrue. Left for 12-12, which rewrites every count in that file, and named
  here so it is not lost.
- **Nothing under `src/vendor/` moved.** `git diff --stat HEAD -- src/vendor/` is
  empty. `firmware-oracle.spec.ts` is byte-unchanged and green.
- **No device was touched and nothing was deployed.** Every ZONA in this plan is
  a function in Node or in a Playwright worker. The firmware facts CLEAR's
  option A rests on are a source reading of `../grid-fw` — read, never edited —
  and only a bench run turns them into evidence on hardware.
- **No sibling repository was read or written.**

---

## Commits

| Commit | What |
| --- | --- |
| `15ee518` | `feat(12-03): the store over three strings, the schema at v2, and a classifier that names which of three landed` — 17 files, +1433 / −480 |
| `df71d0b` | `test(12-03): both e2e files at three, every number derived from its step lines, and D-11-08.1-a closed` — 4 files, +212 / −89 |

---

## Self-Check: PASSED

Every file this document names as created or modified exists on disk; both
commit hashes resolve in `git log --oneline --all`.
