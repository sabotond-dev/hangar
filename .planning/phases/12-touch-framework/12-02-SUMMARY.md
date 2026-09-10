---
phase: 12-touch-framework
plan: 02
subsystem: transport
tags: [protocol, wire, system-element, fixture, adapter, write-order, negative-check]
requires:
  - phase: 12-touch-framework
    plan: 01
    provides: "PREV_FILES 84 / PREV_TESTS 870 / e2e 87 titles, 106 runs / BASE_CHECK 582 / BASE_SWEEP 4 19 / catalog 29, and the verdict that a knob reaches the wire"
  - phase: 12-touch-framework
    plan: 00
    provides: "PROBE-RESULTS-2026-09-10.md - an event body is a callable method on its element and its globals persist, proved on the user's ZONA. The premise the write order rests on"
provides:
  - "ELEMENT_SYSTEM (255), SYSTEM_EVENTS and SYSTEM_DEFAULT_SETUP, all read from the pinned package; defaultFor(element, event) throwing at module load on a missing element as well as a missing event"
  - "fetchConfig and sendConfig take an element as their LAST parameter, defaulting to ELEMENT_TOUCH, and put it in the descriptor AND the response filter"
  - "writeAll: 255/0, then 0/6, then 0/0, under write-system / write-timer / write-setup. fetchAll: three fetches under fetch-system / fetch-setup / fetch-timer"
  - "fetchBoth and writeBoth kept as TWO-EVENT adapters over the same per-event primitives, so every count above the transport is unmoved until 12-03"
  - "The synthetic ZONA holds the system element's RAM and flash beside the touch element's and echoes the element it was asked about on every report"
  - "STEP_IDS gains fetch-system, write-system and refetch-system; FetchedEvent.label gains 'System'"
affects: [12-03, 12-07, 12-12]
tech-stack:
  added: []
  patterns:
    - "A new parameter that must keep every existing call site compiling goes LAST, even where a middle position would read better - and the two functions that take it use the same rule so a reader need not remember which is which"
    - "An adapter that promises a frame count is built from the primitive, never from the wider function with a result discarded: calling the wider one and throwing a string away would put the extra frame on the wire"
    - "A fixture that gains a second addressable thing gains a SECOND MAP beside the first rather than a re-keyed single map, when the first map's key is what every existing call site already passes"
    - "A comment naming a function that a structural gate scans for is itself a gate failure; the comment names the function in prose and says which gate forbids the literal"
    - "A negative check is planted through a file-to-file replacement whose count is asserted before the write, and reverted from a scratch copy compared by sha256 either side"
key-files:
  created:
    - .planning/phases/12-touch-framework/12-02-SUMMARY.md
  modified:
    - src/lib/protocol/constants.ts
    - src/lib/protocol/constants.spec.ts
    - src/lib/protocol/descriptors.ts
    - src/lib/protocol/descriptors.spec.ts
    - src/lib/protocol/write-guard.ts
    - src/lib/transport/capture.ts
    - src/lib/transport/sequence.ts
    - src/lib/transport/sequence.spec.ts
    - src/lib/transport/fixtures/synthetic.ts
    - src/lib/transport/fixtures/synthetic.spec.ts
    - e2e/fake-zona.ts
key-decisions:
  - "THE ELEMENT IS THE LAST PARAMETER of both fetchConfig and sendConfig. Beside `event` was the plan's first option and it is impossible for sendConfig: `config` already sits there, so an element inserted before it would silently retarget every existing five-argument call at a config string coerced to a number. Trailing on BOTH rather than trailing on one and middle on the other"
  - "THE FIXTURE TAKES A SECOND MAP, NOT A RE-KEY. `system` and `systemFlash` sit beside `configs` and `flash`, all four keyed by event number. 12-RESEARCH's `${element}/${event}` shape is tidier and was not taken: `configs` keyed by event is what the moduleState factory and every synthetic.spec.ts literal already pass, and install.spec.ts asserts `state.flash` with toEqual against a two-key object"
  - "STEP_IDS AND FetchedEvent.label BOTH MOVED, neither named by the plan. The step ids are a typed union q.request takes, so three new ids were the only way writeAll could compile; the label union gained 'System' so a write-guard refusal names the slot that failed instead of calling the system setup 'Setup'"
  - "THE TASKS WERE COMMITTED 01, 03, 02. Task 02's own test asserts the element echoed on a report, which is task 03's fixture work - the plan says so in its own words ('as task 03 leaves it'). Committing in plan order would have made the middle commit red"
  - "THE moduleState CALL SITES ARE EIGHTEEN, NOT SEVENTEEN, and the factory is at :229, not :215. 12-01 added the eighteenth. Reported as found, not reconciled"
patterns-established:
  - "A three-event writer whose order is a firmware fact carries BOTH reasons above it, stated as independent, with the file and line of each"
requirements-completed: [SAFE-03, SAFE-07, CAT-04]
duration: 55min
completed: 2026-09-10
---

# Phase 12 Plan 02: The system element, reachable — at the wire and in the fake Summary

**Element 255 reaches the wire. `writeAll` puts three CONFIG/EXECUTE frames on it in the order
255/0, 0/6, 0/0 — system setup, touch Timer, touch Setup — under the step ids `write-system`,
`write-timer`, `write-setup`, and the order is asserted by element, event, string and id in one
test. Events 4 and 6 of element 255 are never written and never fetched; `constants.ts`'s header
carries the utility-button reason and `sequence.spec.ts` asserts the absence rather than assuming
it. The synthetic ZONA now holds two RAMs and echoes the element it was asked about, so a fetch of
255 is answered instead of timing out — proved by a plant that made it echo the touch element
again and produced `Timed out after 300 ms waiting for CONFIG REPORT`. `fetchBoth` and `writeBoth`
are two-event adapters built from the same per-event primitives, and they still put exactly two
frames on the wire in node and in the browser: `install.e2e.ts` and `session.e2e.ts` ran 33 green.
Counts: `PREV_FILES 84 + 0 = 84`, `PREV_TESTS 870 + 4 = 874`, sweep `4 19`, e2e `87 + 0`, check
582 / 0 errors / 0 warnings. Nothing touched a ZONA and nothing was deployed.**

## Performance

- **Duration:** about 55 min
- **Tasks:** 3 of 3
- **Files:** 0 created, 11 modified, across three commits plus this document's own

---

## The write order as shipped, and the proof it holds

```
writeAll(q, target, { system, timer, setup })
  1. CONFIG/EXECUTE  element 255  event 0   "write-system"
  2. CONFIG/EXECUTE  element 0    event 6   "write-timer"
  3. CONFIG/EXECUTE  element 0    event 0   "write-setup"
```

Two reasons are written above the function and they are **independent**, which is why both are
stated rather than one summarised:

**Reason one, new to this phase.** `../grid-fw/common/src/c/grid_decode.c:1286-1287` — read
directly, not quoted from the research — is, inside the accepted-write branch:

```c
grid_ui_register_script(&grid_ui_state, element, event, script);
grid_ui_process_single(&grid_ui_state, ele, eve);
```

The body is registered **and run immediately**, in write order. So at install time the
initialisation order is HANGAR's, not the firmware's page-load order. A touch Setup that calls a
library function by name before the system setup defining it has been written raises `attempt to
call a nil value` once, at install, on the user's desk, and installs no `touch_cb` at all — the pad
goes dead rather than looking wrong. The system element is the right slot because
`../grid-fw/common/src/lua/init.lua:46-50` runs `ele[#ele]:post_init_cb()` — the last element in
the list, the system one — **before** the loop over `0 .. #ele - 1`, and 12-00's slot probe
confirmed on the user's own ZONA that an event body is callable from another event's body and that
its globals persist.

**Reason two, the old one.** Timer before Setup, `_pad.ts:3908-3913`'s reason: `gtt` is a no-op
until the Timer event holds a stored action. Unchanged, and unaffected by the first write.

**The proof.** `sequence.spec.ts` asserts the three frames as
`[[255, 0], [0, 6], [0, 0]]` — element and event together, decoded off the wire — then the three
strings in the same order, then the three step ids with their outcomes, then that the two RAMs of
the fake are apart afterwards. The negative check below swapped the first two writes and the
assertion went red naming element 255 in the second position.

## Events 4 and 6 are never touched, and it is asserted rather than assumed

`grid.get_element_events(ElementType.SYSTEM)` returns **three** events at the pin — setup 0
(24 characters), utility 4 (19), timer 6 (22) — and `SYSTEM_EVENTS` carries all three so a pin bump
that renumbered one goes red here. **Only event 0 is ever addressed.**

- `constants.ts`'s header states the reason in the two sentences the plan asked for: event 4 is the
  module's physical utility button, default `gpl(gpn())` — `gpn` is
  `../grid-fw/common/src/c/grid_protocol.h:354`, `gpl` is `:366` and lands in `l_grid_page_load` at
  `../grid-fw/common/src/c/grid_lua_api.c:1676-1714` — so writing it changes what a button the
  visitor paid for does, and fetching it would put it in a snapshot HANGAR then offers to write
  back. Event 6's default is `print("tick")`, which nothing arms.
- `sequence.ts` repeats the one-line rule above `writeAll` and above `fetchAll`, each pointing at
  that header.
- `sequence.spec.ts` **asserts** it: every frame `writeAll` produced is checked for
  `element === 255 && (event === 4 || event === 6)` and the answer must be `false`. An absence
  nobody asserts is an absence that comes back.
- `constants.spec.ts` asserts the opposite half — that `defaultFor(255, 4)` and `(255, 6)`
  **resolve**. They exist; HANGAR simply never asks. That distinction is what stops a later reader
  "fixing" the omission.

## The parameter position, and why

`element` is the **last** parameter of both `fetchConfig` and `sendConfig`, defaulting to
`ELEMENT_TOUCH`.

The plan offered "after `event`, before `body` in `sendConfig` — or as a trailing parameter; pick
one, say why". The first is not available: `sendConfig(sx, sy, page, event, config)` already has
`config` in that position, so an element inserted before it would have made every existing
five-argument call pass a Lua string where a number was expected — a change that compiles under
`number` only if the string were typed away, and silently retargets the write if it were. Trailing
it is. `fetchConfig` could have gone either way, and it takes the same rule so that a reader need
not remember which function is which. **Every existing call site compiles unchanged**, and the
count says so: `npm run check` reads 582 files, 0 errors, both before and after.

The element goes into the descriptor **and into the response filter**, and the filter is the half
that matters. Firmware maps 255 back to 255 before it builds the REPORT
(`grid_decode.c:1337-1338`), so a filter that always named the touch element would let a system
fetch time out while its own answer sat undelivered in the queue. `descriptors.spec.ts` proves both
directions **through `match.ts`**, never by hand: a report echoing 0 does not satisfy a 255 filter,
a report echoing 255 does, and the mirror holds for the default.

Labels became `fetch-${element}-${event}` / `write-${element}-${event}`. Checked before changing:
`req.label` is read in exactly two places, both `queue.ts` error messages (`:220`, `:233`), and no
test pins either string. `fetch-serial` is asserted by name in `descriptors.spec.ts:210` and is a
different function, untouched.

## The fixture shape, and the call-site count as found

`ZonaState` gained `system?: Record<number, string>` and `systemFlash?: Record<number, string>`
**beside** `configs` and `flash`. All four are keyed by event number.

12-RESEARCH proposed one map keyed `${element}/${event}`. That shape is tidier and it was not taken,
for the blast radius the plan names: `configs` keyed by event number is what the `moduleState`
FACTORY and every state literal in `synthetic.spec.ts` already pass, and `install.spec.ts:1095` and
`:1264` assert `state.flash` with `toEqual` against a **two-key object** — a flash map that had
grown a system key would have moved those two assertions for no gain. **Not one existing fixture
was re-keyed.** The reason is written into `synthetic.ts`'s own `ZonaState` doc comment, with the
shape not taken named.

**The call-site count, as counted, beside this plan's expectation.**

| | This plan and 12-VALIDATION.md say | The tree says |
| --- | --- | --- |
| `moduleState` declaration | `e2e/install.e2e.ts:215` | **`:229`** |
| call sites | **seventeen**, ids 1..17 | **eighteen**, ids **1..18** |

`grep -n moduleState e2e/install.e2e.ts` returns one declaration at `:229` and eighteen calls at
`:396 :440 :471 :532 :571 :603 :640 :667 :696 :779 :810 :1212 :1357 :1450 :1488 :1604 :1736 :1834`,
carrying `nth` 1 through 18 with no gap and no repeat.

**This is not a defect in either document — it is 12-01.** 12-01 added one chromium title to
`install.e2e.ts` (the LUMEN verdict, `6aed004`), which is `moduleState(18)` at `:1834` and which
pushed the declaration down by fourteen lines. Both documents were written against the tree at
`c5fd1cd`. **Reported, not reconciled**; 12-03 and 12-12 should expect eighteen. Nothing in this
plan touched any of them, which is the point the number was being counted to establish.

**`e2e/fake-zona.ts` IMPORTS `ZonaState`** — `:71`, from
`../src/lib/transport/fixtures/synthetic` — rather than re-declaring it, so the two new maps
arrived on the browser fake's handle with no type edit at all. The cheap branch, as 12-01's check
predicted. The file was still edited, for the reason in Deviation 3.

## The step ids, and the two-frame proof for the adapters

Six step ids now exist where four did:

| Stage | Touch, unchanged | System, added |
| --- | --- | --- |
| fetch | `fetch-setup`, `fetch-timer` | `fetch-system` |
| re-fetch | `refetch-setup`, `refetch-timer` | `refetch-system` |
| write | `write-timer`, `write-setup` | `write-system` |

The four existing ids are **byte-identical**; `install.spec.ts`, `capture.spec.ts` and plan 05's
gate read them and none moved.

**The adapters' promise, asserted twice.** `fetchBoth` and `writeBoth` are built from `fetchOne` /
`writeOne`, the same per-event primitives `fetchAll` and `writeAll` use — **not** by calling the
three-event pair and discarding the system string, which would put a third frame on the wire and
move every count above this file. `sequence.spec.ts` asserts `writeBoth` produces exactly two
CONFIG/EXECUTE frames under `["write-timer", "write-setup"]` and `fetchBoth` exactly two
CONFIG/FETCH frames under `["fetch-setup", "fetch-timer"]`.

In the browser: `npx playwright test --workers 3 e2e/install.e2e.ts e2e/session.e2e.ts` — **33
passed**, 1.6 m, zero failures. Every write-count assertion in those two files is still green at its
pinned two. `test-results/` removed after the run, and nothing was committed while it ran.

---

## Deviations from the plan

### 1. [Rule 3 — Blocking] `STEP_IDS` had to gain three ids before `writeAll` could compile

`RequestQueue.request(req, stepId)` takes `StepId`, a union derived from `STEP_IDS` in
`src/lib/transport/capture.ts` — a file the plan does not list. `writeAll` and `fetchAll` cannot
name `write-system`, `fetch-system` or `refetch-system` until that array carries them.

**Fix:** the three ids added beside the four existing ones, in read order, with the reason written
in the array's comment. The four existing ids are byte-unchanged. Nothing counts `STEP_IDS.length`;
the two consumers (`fixtures.spec.ts:141`, `synthetic.spec.ts:341`) assert `toContain`, which is
satisfied by a superset. **Files modified:** `src/lib/transport/capture.ts`. **Commit:** `0041c52`.

### 2. [Rule 2 — Missing critical functionality] `FetchedEvent.label` gained `"System"`

`fetchAll` returns three `FetchedEvent` records and `canWriteBack` (`write-guard.ts`) builds its
refusal sentence out of `label`. The union was `"Setup" | "Timer"`, so the system element's setup
would have had to be labelled `"Setup"` — and a refusal reading *"Setup fetch returned an empty
config string"* would have sent a visitor looking at the wrong slot on their module.

**Fix:** `"System"` added to the union, with the reason and the boundary written above it: the
page's own copy words are `install-copy.ts`'s separate `EventWord` type, which 12-03 moves with the
classifier, and nothing switches exhaustively on this one. `write-guard.spec.ts` is green
unchanged. **Files modified:** `src/lib/protocol/write-guard.ts`. **Commit:** `0041c52`.

### 3. [Rule 2 — Missing critical functionality] `fake-zona.ts`'s `mismatchRefetch` fault is scoped to the touch element by name

The plan says of `fake-zona.ts`: *"if it imports it, nothing moves."* It imports it, and one thing
moved anyway. The `mismatchRefetch` fault (`:188-204` before this plan) matched **any** CONFIG/FETCH
with `EVENTTYPE === EVENT_SETUP`. Once 12-03 makes the store fetch the system element — also at
event 0 — that condition fires on the system fetch too and answers it with a report echoing element
**0**, which the system fetch's own filter refuses. The fault would then present as a *timeout*
rather than as the mismatch it is named for, in a test written to prove mismatch handling.

**Fix:** `Number(cls.class_parameters.ELEMENTNUMBER) === ELEMENT_TOUCH` added to the condition and
`element: ELEMENT_TOUCH` passed to the report it builds, with the reason and the words *"Behaviour
today is unchanged: nothing above the transport fetches 255 until 12-03"* in the comment. Verified
unchanged: `install.e2e.ts` and `session.e2e.ts` 33 green, including the two titles that use the
fault. **Files modified:** `e2e/fake-zona.ts`. **Commit:** `4995c2c`.

### 4. [Rule 3 — Blocking] A comment naming `encode_packet` broke a structural gate

The first draft of `constants.ts`'s `ELEMENT_SYSTEM` doc said *"Nothing in `encode_packet` changes
for it."* `forbidden-instructions.spec.ts` test 3 scans every shipped module's **source text** for
that string and asserts the list of matches is exactly `["src/lib/protocol/descriptors.ts"]`. The
run went red with `constants.ts` in the received array — a real gate doing its job on a comment.

**Fix:** the comment names the function in prose ("the packet encoder") and says which gate forbids
the literal, so the next person to write it knows why not before they write it. **The gate was not
weakened**: `forbidden-instructions.spec.ts` is byte-unchanged and green. **Files modified:**
`src/lib/protocol/constants.ts`. **Commit:** `f08a4a4`.

### 5. [Rule 3 — Blocking] The tasks were committed 01, 03, 02

Task 02's test asserts that a fetch of element 255 is answered with a report echoing 255 — which is
task **03**'s fixture work. The plan says so in its own words: *"Through a `FakeTransport` with the
synthetic responder (as task 03 leaves it)."* Committing in plan order would have produced a middle
commit whose tree is red.

**Fix:** the fixture (task 03) committed first as `4995c2c`, the writer (task 02) second as
`0041c52`. Each commit's own tree compiles and passes; the task names are carried in the commit
subjects, so the plan's three tasks are still three commits and still identifiable. No task's
content moved between commits.

---

## The negative checks — four plants, four exit codes, every one reverted

Warning taken as written: **when a negative check comes back green, suspect the check.** Every plant
was made in CODE through a file-to-file replacement whose **count was asserted before the write**
(the helper refuses and exits 2 on a disagreement), and every one was reverted by copying back a
scratch copy and comparing `sha256sum` either side — never `git checkout`, `git restore`,
`git stash` or `git clean`.

| # | Task | Plant | Where | Observed | Exit |
| --- | --- | --- | --- | --- | --- |
| 1 | 01 | the fetch filter names `ELEMENT_TOUCH` again | `descriptors.ts` filter block, 1 replacement | red: **`expected +0 to be 255`** on `filter.class_parameters?.ELEMENTNUMBER` | 1 |
| 2 | 01 | `defaultFor` falls back to `TOUCH_EVENTS` for an unknown element | `constants.ts:100`, 1 replacement | red: `defaultFor(7, EVENT_SETUP)` **did not throw** — received `undefined` where a throw was expected | 1 |
| 3 | 02 | the first two writes of `writeAll` swapped | `sequence.ts` writer body, 1 replacement | red on the order assertion, the diff showing **255 in the second position** and `0, 6` in the first | 1 |
| 4 | 03 | `configReportFrame` echoes `ELEMENT_TOUCH` unconditionally | `synthetic.ts:207`, 1 replacement | red **twice**: `synthetic.spec` **`the report for element 255: expected +0 to be 255`**, and `sequence.spec` **`Timed out after 300 ms waiting for CONFIG REPORT`** | 1 |
| — | — | restored, `src/lib/protocol/` | — | green, 53 passed | 0 |
| — | — | restored, `src/lib/transport/ src/lib/device/` | — | green, 126 passed | 0 |

**Plant 4 answers the question the plan asked** — *"a timeout or a filter mismatch; name which the
queue reports"*. It is a **timeout**, raised by `RequestQueue.settle` at `queue.ts:363-365` after
`TIMEOUTS.fetchMs` of 300 ms. The report arrives, decodes and is delivered; `matchResponse` returns
`"no"` on the ELEMENTNUMBER comparison, so nothing settles the waiter and the deadline fires. That
is exactly the failure a system fetch would have on a real module against a filter that named the
wrong element, and it is worth knowing that it presents as silence rather than as a rejection.

Checksums, every planted file, before the plant and after the restore — identical in all four:

```
constants.ts   af9cf8132e25ae877fa9fa7889a3e0c7429eb9490f80d23ca61321cf3723c4a7
descriptors.ts a1692558ca5a9ab06b79ded1ca89f39abc0b99e6b634f861d3d5eb933f2c0ad3
sequence.ts    cba3b29826ef42610442a924f28f3cdb51fcab27c043b2e532fce395f797ba1e
synthetic.ts   6c34bb9f74c630f47f402ac8329552dd8e93691c9b8650c08e69150ff30cefbf
```

---

## Counts, as carried names plus deltas

| Name | Carried from | Term | Observed |
| --- | --- | --- | --- |
| `PREV_FILES` | **84** (12-01) | `+0` | **84** |
| `PREV_TESTS` | **870** (12-01) | **`+4`** | **874** passed, 1 todo (reported, never asserted) |
| `BASE_SWEEP` | **`4 19`** | `+0` | **`4 19`** |
| `PREV_E2E` titles | **87** (12-01) | `+0` | **87** (`grep -c "test(" e2e/*.e2e.ts`, summed) |
| `PREV_E2E` runs | **106** (12-01) | `+0` | not re-measured — the full suite is 12-03's; two files ran, **33 passed** |
| `BASE_CHECK` | **582** | provenance | **582 files, 0 ERRORS 0 WARNINGS** |
| catalog | **29** (9 + 20) | `+0` | 29 (untouched; no entry, preset or facet moved) |

`check-counts.mjs 84 874` and `check-counts.mjs 4 19` both report *"matches the expected counts"*,
exit 0. **This plan's term in the phase chain is `+4`, exactly as 12-VALIDATION.md declares**, and
it lands as the four per-file terms that document names:

| File | Term | Observed |
| --- | --- | --- |
| `src/lib/protocol/constants.spec.ts` | +1 | 7 → **8** |
| `src/lib/protocol/descriptors.spec.ts` | +1 | 12 → **13** |
| `src/lib/transport/sequence.spec.ts` | +1 | 11 → **12** |
| `src/lib/transport/fixtures/synthetic.spec.ts` | +1 | 6 → **7** |

### The suites, as run

| Command | Result |
| --- | --- |
| `npm run check` | 582 files, 0 errors, 0 warnings |
| `npm run lint` | clean (prettier + eslint) |
| `npm run test:quick` | 84 files / 874 passed / 1 todo |
| `npm run test:sweep` | 4 files / 19 passed |
| `npm run build` | clean; `postbuild` archived `source-f08a4a46…tar.gz`, 1667 KB |
| `npx playwright test --workers 3 e2e/install.e2e.ts e2e/session.e2e.ts` | **33 passed**, 1.6 m |

The full Playwright suite was **not** run: no title moved and 12-03 runs it twice.

`grep -rn "page init" src/ e2e/` finds **one** line — `constants.spec.ts:128`, the assertion that
`constants.ts` does **not** contain it. The 24-character default itself is compared against
`grid.get_element_events(ElementType.SYSTEM)` read inside the test, so that test cannot pass on a
string somebody typed.

---

## Count disagreements, reported and not reconciled

1. **`moduleState`: eighteen call sites at `:229`, not seventeen at `:215`.** Cause identified
   (12-01's eighteenth title); neither document is at fault, both were written against `c5fd1cd`.
   Handed to 12-03 and 12-12.
2. **`STATE.md`'s frontmatter `total_plans` is contaminated by a concurrent Phase 13 session.** It
   was writing untracked `13-*-PLAN.md` files while this plan ran and **committed twenty of them as
   `4825694`, on top of this plan's three commits**, between this plan's last task commit and this
   document. The tools recompute totals from disk, so the numbers moved for reasons that are not
   this plan's. Reported, not reconciled, and not one of those files was read or touched here.
3. **`STATE.md`'s frontmatter `percent` still reads 100** and has since Phase 10. Left alone, as
   instructed.

---

## What was NOT done, and why

- **`gsd-tools roadmap update-plan-progress` was SKIPPED**, on instruction. `.planning/ROADMAP.md`
  is byte-unchanged by this plan (`git diff --quiet a8cae28..HEAD -- .planning/ROADMAP.md`, exit 0).
- **`gsd-tools requirements mark-complete` was SKIPPED, and this one is a judgement, not an
  instruction.** The plan's frontmatter names `[SAFE-03, SAFE-07, CAT-04]`. **SAFE-03 and SAFE-07
  are already `[x]`**, closed by Phase 7, and 12-VALIDATION.md says both are *falsified by the third
  string* and amended by name at 12-12 — re-ticking them would say nothing and pre-empt that
  amendment. **CAT-04 is `[ ]` deliberately**: `REQUIREMENTS.md:226` says *"CAT-04 stays `Pending`
  for the third time — its subject is the shape of the catalog data file and nothing here touched
  it"*, and nothing here touched it either. Ticking it would have written a false claim into the
  requirements file to satisfy a frontmatter field. Reported instead.
- **`STATE.md` was repaired by inverse edit, twice.** `advance-plan` blanked the `Status:` paragraph
  to *"Ready to execute"* and left the `Plan:` line's prose describing 12-01 under a counter reading
  2; both were rewritten for this plan. `advance-plan` and `record-metric` each moved
  `completed_phases` from 11 to 12 — Phase 12 is 2 of 12, not complete — and `record-metric` moved
  `status` from `executing` to `planning`; all three were put back. The file went 794 → 799 lines,
  which is the one metrics row plus four decisions and nothing else; every line below each splice
  was diffed and none was lost. `percent: 100` left alone, as instructed.
- **Nothing above the transport moved.** The install store, `install.spec.ts`, `session.svelte.ts`
  and every page component are byte-unchanged. That is the plan's whole split and it holds:
  `install.spec.ts` is green at its pinned twos and so are the two e2e files.
- **Nothing under `src/vendor/` moved.** `git diff --stat HEAD -- src/vendor/` is empty and so is
  `git diff --stat a8cae28..HEAD -- src/vendor/`. `firmware-oracle.spec.ts` is byte-unchanged and
  green in the quick suite.
- **No device was touched and nothing was deployed.** Every ZONA in this plan is a function in
  Node or in a Playwright worker. The firmware facts the write order rests on are a **source
  reading** of `../grid-fw` — read, never edited — plus 12-00's probe, which a human ran on their
  own module. Only a bench run turns the ordering claim into evidence on hardware.
- **No sibling repository was written.** `../grid-fw` was read at four files and cited by line.

---

## Commits

| Commit | What |
| --- | --- |
| `f08a4a4` | `feat(12-02): the constants and the descriptors know a second element` — `constants.ts`, `constants.spec.ts` +1, `descriptors.ts`, `descriptors.spec.ts` +1 |
| `4995c2c` | `feat(12-02): the synthetic ZONA holds two elements and echoes the one it was asked about` — `synthetic.ts`, `synthetic.spec.ts` +1, `fake-zona.ts` |
| `0041c52` | `feat(12-02): fetchAll and writeAll, in the one safe order` — `sequence.ts`, `sequence.spec.ts` +1, `capture.ts`, `write-guard.ts` |

`4825694` sits between the last of these and this document. **It is not this plan's** — it is the
concurrent Phase 13 planning session committing its own plan files.

---

## Self-Check: PASSED

Every file this document names as modified exists on disk; all three commit hashes resolve in
`git log --oneline --all`.
