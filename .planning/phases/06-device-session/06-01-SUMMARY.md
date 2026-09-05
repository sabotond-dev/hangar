---
phase: 06-device-session
plan: 01
subsystem: device
tags: [baseline, spike, runes, transport, taxonomy, identify, CONN-04, CONN-07]

# Dependency graph
requires:
  - "src/lib/transport/transport.ts (02-01) — the OpenFailure union, classifyOpenError's branch-on-name rule and failureCopy's trailing-label contract"
  - "src/lib/transport/sequence.ts (02-03) — identify()'s heartbeatType === 1 rule, borrowed here by its other half"
  - "src/lib/transport/fixtures/synthetic.ts (02-05) — heartbeatFrame, which builds real encoder-derived frames for any hwcfg and any address"
  - "src/lib/device/try-on.ts (04-08) — identifyOnly and its three outcomes"
  - "scripts/check-counts.mjs (08-01, D-17) — baseline plus delta, never a literal total"
  - ".planning/phases/05.1-catalog-browse/05.1-11-SUMMARY.md — the four-name block this phase extends to five"
provides:
  - "The five-name carry-forward block for Phase 6, measured on a clean tree at 746cfa2: BASE_FILES 66, BASE_TESTS 691, BASE_SWEEP `3 13`, BASE_E2E 61, PREV_E2E 61"
  - "A measurement, not an assumption, under plan 06-03: a .svelte.ts module IS compiled and collected by the `server` Vitest project, and $state compiles to a PLAIN own class field under the SSR transform"
  - "src/lib/transport/transport.ts — OpenFailure gains `already-open`; classifyOpenError gains the InvalidStateError branch; failureCopy renders it through the `unknown` row with one sentence and no steps"
  - "src/lib/device/try-on.ts — the not-zona refusal names the module reporting heartbeat type 1, with arrival order as the fallback"
affects:
  - ".planning/phases/06-device-session/deferred-items.md — created, one item"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 1/14"

tech-stack:
  added: []
  patterns:
    - "A phase's baselines are measured on a CLEAN tree before the first edit, and the e2e total is written down twice under two names from the one run: BASE_E2E is frozen so the phase gate has something the phase's own additions have not already absorbed, PREV_E2E rolls"
    - "An architectural assumption a later plan rests on is spiked in five minutes with a throwaway pair, recorded verbatim, and deleted — with the count gate re-run after the deletion to prove the tree is back where it started"
    - "A new OpenFailure member costs no call site: the union widens, every consumer switch has a default, and nothing in the tree switches over OpenFailure outside transport.ts itself"

key-files:
  created:
    - ".planning/phases/06-device-session/06-01-SUMMARY.md"
    - ".planning/phases/06-device-session/deferred-items.md"
  modified:
    - "src/lib/transport/transport.ts"
    - "src/lib/transport/transport.spec.ts"
    - "src/lib/device/try-on.ts"
    - "src/lib/device/try-on.spec.ts"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The runes spike PASSED and the documented fallback stays on the shelf: src/lib/device/spike.svelte.ts compiled, was collected by the `server` project, and its $state field arrived as a PLAIN own property on the instance with no accessor on the prototype — so a node suite reading and writing plan 06-03's session fields tests the machine's logic, not a signal graph. svelte-check type-checked the .svelte.ts and its spec at 519 files 0 errors"
  - "BASE_E2E and PREV_E2E are both 61, from the one Playwright run on the clean tree at 746cfa2. BASE_E2E never moves again; 06-14 asserts BASE_E2E + 16 = 77"
  - "classifyOpenError's new comment could not say the engine's name: transport.spec.ts test 6 scans transport.ts for it, and the first draft of the InvalidStateError comment turned that existing test red. The comment now says `the browser's own`, which is the same claim without the word the spec forbids"
  - "already-open renders through the `unknown` row rather than as a tenth state, and the spec asserts that by comparing the two titles rather than by repeating a literal — so a retitled `unknown` moves both together or fails"
  - "The rig fixture uses a FOURTH module type (PO16 RevH, hwcfg 3) for the module on the cable, beyond the plan's three. With the cable module drawn from the same two types as the chained ones, `it named the type-1 module` and `it named whichever module arrived first` could be satisfied by the same string, and the test would have been unfalsifiable in one direction"
  - "docs/TESTING.md's `66 files, 691 passed` line is stale from this commit and is NOT fixed here: 06-14 names the file in its own files_modified and re-measures it end to end. Logged in deferred-items.md rather than churned fourteen times"

requirements-completed: []
requirements-contributed: [CONN-04, CONN-07]

# Metrics
duration: 22min
completed: 2026-09-05
---

# Phase 6 Plan 01: The five baselines, the runes spike, and two holes in the shipped device vocabulary Summary

**The phase's ground is measured rather than inherited — 66 files / 691 tests, sweep `3 13`, 61 Playwright tests, svelte-check 517 files 0 errors, all on a clean tree at `746cfa2` — and the one architectural assumption under plan 06-03 is now a measurement: a `.svelte.ts` module compiles, is collected by the `server` project, and its `$state` field arrives in node as a plain own class property, so the documented fallback stays on the shelf. Two holes in the shipped device vocabulary close underneath any component: a racing `open()` lands in `already-open` and renders as one sentence with no steps instead of `The port is already open.`, and a rig on the cable is named by the module reporting heartbeat type 1 rather than by whichever module happened to speak first.**

## The five-name carry-forward block

Measured on a clean tree at `746cfa2`, **before any edit in this plan**, on 2026-09-05.

| Name         | Value                       | Measured                                                                                        |
| ------------ | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                      | `npm run test:quick` — this plan adds no spec file                                                |
| `BASE_TESTS` | **691** (+ 1 todo = 692)    | `npm run test:quick` — this plan adds 3, so the tree now stands at 694                            |
| `BASE_SWEEP` | **`3 13`**                  | `npm run test:sweep` — the literal it actually printed. Never re-derived                          |
| `BASE_E2E`   | **61 (measured by 06-01)**  | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77**            |
| `PREV_E2E`   | **61 (measured by 06-01)**  | the same run. Rolls at 06-06, 06-07 and 06-13                                                     |

`BASE_CHECK` (provenance only, asserted nowhere): **517 files, 0 errors**, `npm run check`.

**`BASE_E2E` and `PREV_E2E` are equal and come from one run**, exactly as `06-VALIDATION.md`
specifies. They are two names because they move differently: `PREV_E2E` is re-measured by the four
plans that run `test:e2e`, while `BASE_E2E` is frozen here so 06-14's gate asserts against the clean
tree rather than against a number the phase's own additions have already absorbed.

**No number in `06-VALIDATION.md` or `06-RESEARCH.md` was carried forward.** The research's
`59 files / 651 tests`, `3 13`, `44 e2e` were written before Phase 5.1 landed and are provenance
only. The re-measurement confirms `BASE_SWEEP` is still the documented `3 13` literal and that
Phase 5.1 closed at exactly the numbers `05.1-11-SUMMARY.md` records.

### The commands, verbatim

```
npm run check      2>&1 | tail -5          # 517 FILES 0 ERRORS 0 WARNINGS
npm run test:quick 2>&1 | tail -6          # Test Files 66 passed (66) / Tests 691 passed | 1 todo (692)
npm run test:sweep 2>&1 | tail -6          # Test Files  3 passed (3) / Tests 13 passed (13)
npm run build && npm run test:e2e 2>&1     # 61 passed (48.9s)
```

The sweep run also printed its own recorded line, unchanged from Phase 5:
`counted 1296 combinations in 2.7s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0`.

The e2e run was clean: exit 0, `61 passed (48.9s)`, output captured to the gitignored `.tmp-e2e/`.
No re-run was needed. Afterwards there was **no listener on 4173** and **no `wrangler.exe` or
`workerd.exe` process** — only TIME_WAIT sockets, which is ordinary teardown.

## Task 1 — the baselines and the runes-in-node spike (no commit)

**This task produced no commit, and that is correct.** Its only artifact is this SUMMARY, and its
only files were the two spike files it deleted again; the tree at the end of task 1 was
byte-identical to the tree at the start (`git status --short` empty). The baselines land with the
final documentation commit.

### The spike, verbatim

The repository contains zero `.svelte.ts` files, so nothing proved the `server` Vitest project could
compile one. Plan 06-03 puts a Svelte 5 runes class in `src/lib/device/session.svelte.ts` and tests
it in node. Two throwaway files:

- `src/lib/device/spike.svelte.ts` — a class with `n = $state(0)` and `rows = $state.raw<string[]>([])`,
  exported as a singleton.
- `src/lib/device/spike.spec.ts` — one test that assigns and reads both, then introspects the shape.

```
npx vitest run --project server src/lib/device/spike.spec.ts

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  538ms (transform 286ms, setup 0ms, import 366ms, tests 4ms, environment 0ms)
```

With `--reporter=verbose`, the introspection:

```
stdout | src/lib/device/spike.spec.ts > runes in the server project > assigns and reads a $state scalar and a $state.raw field
SPIKE own properties: n,rows
SPIKE prototype descriptor for n: none (plain field)
SPIKE typeof fresh.n: number
 ✓ |server| src/lib/device/spike.spec.ts > runes in the server project > ... 2ms
```

**All four questions answered, and all four the way plan 06-03 needs:**

1. **It compiled.** No transform error, no "rune outside a `.svelte` file" diagnostic.
2. **It was collected.** The `server` project's include is `src/**/*.{test,spec}.{js,ts}` and its
   exclude is `src/**/*.svelte.{test,spec}.{js,ts}`. A spec named `spike.spec.ts` matches the include
   and misses the exclude; only a spec named `spike.svelte.spec.ts` would have been silently dropped.
   This is the trap `06-RESEARCH.md` names, and this spike is the direct evidence that the shipped
   naming (`session.svelte.ts` implemented, `session.spec.ts` testing it) sits on the right side of it.
3. **The rune survived as a plain assignment, not a signal.** `Object.getOwnPropertyNames(fresh)` is
   `n,rows` — both are own properties of the *instance* — and
   `Object.getOwnPropertyDescriptor(Spike.prototype, "n")` is `undefined`, so there is **no
   accessor pair on the prototype**. That is the SSR transform: a `$state` field compiles to a plain
   class field. A node suite reading and writing it is therefore testing the machine's logic, which
   is exactly the property the plan said would decide whether the fallback is needed.
4. **Reads and writes round-tripped.** `spike.n = 7` reads back 7; `spike.rows = ["a","b"]` reads back
   deeply equal; a fresh instance starts at the declared defaults.

One extra, for provenance rather than because the plan asked: with the spike in the tree,
`npm run check` reported **519 FILES 0 ERRORS 0 WARNINGS** — svelte-check type-checks a `.svelte.ts`
and its plain spec without complaint, at +2 files.

**Result: the runes module is safe to test in node as plan 06-03 plans it. The documented fallback
(`session-machine.ts` behind a runes shell, with its four downstream edits) is NOT taken and stays on
the shelf.** Nothing in 06-03, 06-04 or 06-05 needs to retarget.

**Both spike files were deleted**, and the count gate re-run to prove the tree was back:

```
rm src/lib/device/spike.svelte.ts src/lib/device/spike.spec.ts
npm run test:quick 2>&1 | node scripts/check-counts.mjs 66 691
check-counts: observed 66 files, 691 tests passed, 1 todo
check-counts: matches the expected counts
```

`src/lib/device/` contains `try-on.ts` and `try-on.spec.ts` and nothing else.

The design's avoidance of `$derived` in either shape is not tested here and does not need to be: the
spike shows the plain-field property holds for `$state` and `$state.raw`, and a derived value is
precisely the thing the SSR transform does not make plain. That constraint stands as written.

## Task 2 — `already-open` (commit `364a13d`)

### The classification

`OpenFailure` gains a seventh member, between `unplugged` and `unknown`. `classifyOpenError` gains
one branch inside the existing `err instanceof DOMException` block:

```ts
if (err.name === "InvalidStateError") return "already-open";
```

The comment beside it names both Chromium source lines — `"The port is already open."`
(`serial_port.cc:121-122`) and `"A call to open() is already in progress."` (`serial_port.cc:114-116`)
— and states the reason in prose: a per-panel connect control could not reach either, while a
site-wide session with a header control **and** a panel control bound to one action reaches them on a
double click. Plan 06-03's in-flight guard is the fix; this branch is the net under it.

### The copy

```ts
case "already-open":
  return {
    title: "The port would not open",
    detail: "HANGAR is already connecting — one moment.",
    steps: [],
  };
```

The detail is **one literal** containing a **U+2014 em dash**, quoted here in full:

> `HANGAR is already connecting — one moment.`

`raw` is deliberately not interpolated. The browser's own words for this failure describe HANGAR's
bug and mean nothing to a visitor. `steps` is empty because there is nothing for the visitor to do.
The title is `unknown`'s, because per `06-UI-SPEC.md` this renders **through** the `unknown` row and
is not a tenth state.

### The two tests, 7 to 9

- **"a racing open is its own state and never the raw browser text"** — both `InvalidStateError`
  forms classify as `already-open`, and a `NetworkError` carrying the literal string
  `The port is already open.` still classifies as `port-busy`, which is what proves the classifier
  branches on `name` and never on the message.
- **"the already-open copy is a sentence with no recovery and no raw report"** — `steps` is `[]`, the
  detail is the exact sentence, the detail does **not** contain the raw text it was handed, and the
  title equals `failureCopy("unknown", raw).title` rather than a repeated literal.

`ALL_FAILURES` in the spec gained `"already-open"` as its seventh member, so the existing
no-engine-name sweep covers the new row too. `NAMES_A_CONTROL` is unchanged at five entries; its
assertion message was corrected from "five of the six failures" to "five of the seven".

### Both negative checks, observed red

**1. Delete the `InvalidStateError` branch.** Test 8 went red:

```
FAIL |server| ... > a racing open is its own state and never the raw browser text
AssertionError: expected 'unknown' to be 'already-open' // Object.is equality
Expected: "already-open"
Received: "unknown"
```

Restored; 9 passed.

**2. Give `already-open` a step.** Test 9 went red:

```
FAIL |server| ... > the already-open copy is a sentence with no recovery and no raw report
AssertionError: there is nothing a visitor can do about it: expected [ Array(1) ] to deeply equal []
- []
+ [ "NEGATIVE CHECK - restored immediately" ]
```

Restored; 9 passed.

### No call site was edited

The union widened and every consumer keeps working, because **nothing in the tree switches over
`OpenFailure` outside `transport.ts` itself** — `grep -rn "OpenFailure" src e2e` returns only
`transport.ts` (the declaration and two signatures) and `transport.spec.ts` (two arrays). The call
sites, all unedited, are:

| Call site | Shape |
| --- | --- |
| `src/lib/ui/TryOnDevice.svelte:243` | `failureCopy("no-web-serial", undefined, device.TRY_ON_LABEL)` |
| `src/lib/ui/TryOnDevice.svelte:250` | `failureCopy("insecure-context", undefined, device.TRY_ON_LABEL)` |
| `src/lib/ui/TryOnDevice.svelte:310` | `failureCopy(kind, raw, D!.TRY_ON_LABEL)` — positional, after `classifyOpenError` at :306 |
| `src/routes/dev/skeleton/+page.svelte:93` | `T.failureCopy("no-web-serial")` |
| `src/routes/dev/skeleton/+page.svelte:122` | `failureCopy(kind, raw)` — positional, after `classifyOpenError` at :121 |
| `e2e/tuning-webkit.e2e.ts:559` | `failureCopy("no-web-serial", undefined, PRIMARY_LABEL)` |

The three positional `raw` callers keep their argument order; the trailing `controlLabel` contract
(D-23) is untouched.

## Task 3 — the refusal names the module on the cable (commit `ee126ba`)

`identifyOnly`'s `not-zona` tail no longer reads `seen[0]`:

```ts
const onCable = seen.find((m) => m.heartbeatType === 1) ?? seen[0];
return { kind: "not-zona", moduleType: onCable.moduleType };
```

The firmware citation is in the comment beside it: the module on the USB cable reports heartbeat
type 1 (`grid_decode.c:695-700`), which is the same rule `identify()` already uses to find the ZONA.
The fallback is stated too — a rig where nothing reports type 1 still names *something* rather than
nothing, because a module IS on the cable either way.

### The hwcfg numbers, read from the pinned package

Verified against `grid.module_hwcfgs()` on `@intechstudio/grid-protocol@1.20260825.1135` before
being hard-coded. **No correction was needed** — all three of the plan's numbers are the package's:

| Module | Revision | hwcfg | `module_type_from_hwcfg` |
| --- | --- | --- | --- |
| ZONA | RevH | **161** | `ZONA` (and `ZONA_HWCFG` in `src/lib/protocol/constants.ts` is 161) |
| EN16 | RevH | **195** | `EN16` |
| BU16 | RevH | **131** | `BU16` |
| PO16 | RevH | **3** | `PO16` |

`PO16 RevH 3` is a fourth value the plan did not name; see the deviation below.

### The test, 6 to 7

*"a rig refuses by naming the module on the cable, not the first one that spoke"* builds three real
encoder-derived heartbeats through `heartbeatFrame` and feeds them in an order that puts a **type-0
module first**:

1. EN16 RevH at `sx 1, sy 0, type 0`
2. BU16 RevH at `sx 2, sy 0, type 0`
3. PO16 RevH at `sx 0, sy 0, type 1` — the module on the cable, with a non-ZONA hwcfg

The `seen` map is keyed on `sx,sy` and preserves insertion order, so `seen[0]` is the EN16. The
outcome is asserted `not-zona` with `moduleType === "PO16"`, and separately `not.toBe("EN16")`.

### The negative check, observed red

With `seen[0]` restored:

```
FAIL |server| ... > a rig refuses by naming the module on the cable, not the first one that spoke
AssertionError: the module reporting heartbeat type 1: expected 'EN16' to be 'PO16' // Object.is equality
Expected: "PO16"
Received: "EN16"
```

Restored; 7 passed. The refusal named a module the visitor had not plugged into anything, which is
the exact defect the change removes.

## Verification, as the plan specifies it

```
npm run check 2>&1 | grep -Ei "0 errors"
  1788572486233 COMPLETED 517 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)

npx vitest run --project server src/lib/transport/transport.spec.ts    ->  9 passed (9)
npx vitest run --project server src/lib/device/try-on.spec.ts          ->  7 passed (7)

npm run test:quick 2>&1 | node scripts/check-counts.mjs 66 694
  check-counts: observed 66 files, 694 tests passed, 1 todo
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo
  check-counts: matches the expected counts
```

**Quick is `BASE_FILES + 0` files and `BASE_TESTS + 3` tests**, as the plan's arithmetic requires:
two in `transport.spec.ts`, one in `try-on.spec.ts`, no new spec file. `svelte-check` is back at 517
files after the spike deletion.

**The tree at the end of this plan: 66 files / 694 tests + 1 todo, sweep `3 13`, e2e 61 (not re-run
after the source edits — neither change is reachable from any e2e path, and `PREV_E2E` does not roll
until 06-06).**

## Deviations from Plan

### 1. [Rule 1 - Bug] The InvalidStateError comment named the browser engine, and an existing test caught it

**Found during:** Task 2, on the first run of the amended spec.

**Issue:** The first draft of the comment beside the new branch read "the two message strings above
are Chromium's". `transport.spec.ts` test 6 asserts, as its last line,
`expect(transportSource()).not.toContain("Chromium")` — a CONN-02 invariant that a visitor is never
told an engine name they cannot map onto the icon on their desktop, enforced against the module's
whole source rather than only against its branches. The run reported:

```
FAIL ... > no message says Chromium, and the unsupported one names the browsers that work
AssertionError: transport.ts names an engine: expected '// The transport contract and the ope…' not to contain 'Chromium'
```

**Fix:** the comment now reads "the two message strings above are the browser's own, are specified
nowhere, and are localisable" — the same claim, in the house style the file already used for the
busy case. The `serial_port.cc` line citations stayed; they name a file, not an engine.

**Worth recording rather than glossing:** the invariant is stronger than it looks. It fires on
comments, not only on copy, and this is the first time it has fired.

**Files modified:** `src/lib/transport/transport.ts`. **Commit:** `364a13d`.

### 2. [Rule 2 - Missing critical functionality] The rig fixture needed a fourth module type

**Found during:** Task 3, writing the test.

**Issue:** The plan names three hwcfg values (ZONA 161, EN16 195, BU16 131) and asks for three
heartbeats: EN16 at `sx 1` type 0, BU16 at `sx 2` type 0, and "the module on the cable at `sx 0`,
`sy 0`, type 1 with a non-ZONA hwcfg". ZONA is excluded by construction, so drawing the cable
module from the remaining two would make it a second EN16 or a second BU16 — and then
`moduleType === "BU16"` would be satisfied by the chained module at `sx 2` as readily as by the one
on the cable. The test would have been unfalsifiable in one direction: it could not distinguish "it
named the type-1 module" from "it named a module that happens to share the right name".

**Fix:** the module on the cable is a **PO16 RevH, hwcfg 3**, verified against `grid.module_hwcfgs()`
exactly as the plan requires of the other three (`module_type_from_hwcfg(3)` returns `PO16`). Three
distinct types, three distinct addresses, one unambiguous answer — and the negative check names
`EN16` while the positive names `PO16`, so both directions are observable.

**Files modified:** `src/lib/device/try-on.spec.ts`. **Commit:** `ee126ba`.

### 3. [Scope] `docs/TESTING.md` is stale and was deliberately not fixed

`docs/TESTING.md` line 22 records `66 files, 691 passed + 1 todo (692)`, which this plan's +3 makes
stale. It is **not** fixed here: `06-14-PLAN.md` names `docs/TESTING.md` in its own `files_modified`
and its task 2 re-measures the document end to end against a fresh production build. Editing it in
each of fourteen plans would be churn against a number that is wrong again by the next commit, and no
spec reads the file, so nothing is green-and-vacuous in the meantime. Logged as item 1 in
`.planning/phases/06-device-session/deferred-items.md`, with 06-14 named as the owner.

### 4. [Process] Task 1 produced no commit

Its only outputs are measurements and this SUMMARY; its two spike files were created and deleted
inside the task, leaving the tree byte-identical. The baselines land with the final documentation
commit. Recorded so a later reader does not go looking for a missing commit between `746cfa2` and
`364a13d`.

## Requirements

**`requirements-contributed: [CONN-04, CONN-07]`** — contributed, **not completed**. Neither closes
here:

- **CONN-04** ("a named state instead of a raw exception") gains its last missing row, but the
  requirement is about what a visitor sees, and no component renders `already-open` until the session
  panel exists.
- **CONN-07** ("refused with a plain message") gains a refusal that names the right module, but the
  refusal itself is rendered by `TryOnDevice.svelte` today and by the session surface later.

Both are layer-below-a-component changes, which is what the plan's objective says they are.

## What the next plan inherits

- The five-name block above. **Carry all five verbatim**, whether or not the plan moves them.
  `BASE_E2E` is **61** and must be byte-identical in all fourteen SUMMARYs.
- `PREV_FILES` / `PREV_TESTS` for plan 06-02 are **66 / 694** — this plan's closing numbers, not its
  baseline.
- Plan 06-03 may write `src/lib/device/session.svelte.ts` with `$state` fields and test it from
  `src/lib/device/session.spec.ts` **as planned**. The fallback is not taken. The one rule the spike
  does not license is `$derived`, which the design already avoids for this reason.
- `OpenFailure` has seven members. Any new exhaustive switch over it must handle `already-open`, and
  the rendering contract is "the `unknown` row's title, one sentence, no steps".

## Self-Check: PASSED

Files claimed created, verified present:

- `.planning/phases/06-device-session/06-01-SUMMARY.md` — FOUND
- `.planning/phases/06-device-session/deferred-items.md` — FOUND

Files claimed deleted, verified absent:

- `src/lib/device/spike.svelte.ts` — ABSENT
- `src/lib/device/spike.spec.ts` — ABSENT

Commits claimed, verified in `git log`:

- `364a13d` feat(06-01): already-open - the row a two-control session makes reachable — FOUND
- `ee126ba` feat(06-01): the refusal names the module that is actually on the cable — FOUND
