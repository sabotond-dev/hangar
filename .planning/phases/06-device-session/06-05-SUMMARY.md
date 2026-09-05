---
phase: 06-device-session
plan: 05
subsystem: testing
tags: [gates, compile-surface, chunk-guard, probe-routes, forbidden-instructions, mutation-testing, CONN-01, SAFE-01]

# Dependency graph
requires:
  - "src/lib/config-shape.spec.ts (04, 05.1-05, 05.1-08) — test 13's COMPILER_MARKERS and compile-surface rule, test 12's dev/skeleton scan, test 14 untouched"
  - "src/lib/protocol/forbidden-instructions.spec.ts (02-01) — SCANNED_DIRS over protocol and transport, the fragment-assembled needles"
  - "src/lib/device/session.svelte.ts (06-03, 06-04) — exactly four static specifiers, the thing this plan makes a rule"
  - "src/lib/device/session-copy.ts, src/lib/protocol/usb.ts, src/lib/transport/ports.ts, src/lib/transport/transport.ts (06-02, 06-03, 02-01) — the five permitted modules, each read rather than trusted"
  - ".planning/phases/04-first-experience/deferred-items.md — the SCANNED_DIRS gap carried from 04-04 and 04-07"
  - ".planning/phases/05-tuning-budgets-and-shareable-links/05-12-SUMMARY.md deviation 1 — the precedent for describing a sibling probe in prose"
provides:
  - "COMPILER_MARKERS covers lib/transport, lib/protocol and lib/device; a static import of any of them from the front door is red at edit time"
  - "PERMITTED_SPECIFIERS: five exact paths, verified by a walk that follows an exact permitted match and marker-checks every other, seeded with the five modules themselves"
  - "src/routes/+layout.svelte in FRONT_DOOR_PAGES, proven in the walk by mutation"
  - "Test 12 discovers every directory under src/routes/dev/ instead of naming dev/skeleton"
  - "forbidden-instructions.spec.ts scans all of src/lib: 65 files instead of 16, src/lib/device/ inside it"
affects:
  - "06-06 — re-runs the dev/session mutation once the directory exists; the discovery scan's stated limit"
  - "06-08 to 06-12 — every device component is under test 13's widened rule the moment it is written; only the five permitted paths may be named statically"
  - "06-09 — +layout.svelte is watched now, so the session's own static import there is the one case the rule allows"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 5/14"

tech-stack:
  added: []
  patterns:
    - "A gate widened onto an allow-list VERIFIES the list: the walk follows an exactly matching permitted specifier into the file it names and marker-checks everything else, and the permitted files are seeded into the walk so the allowance is checked before anyone has used it"
    - "A discovery-based scan states its limit: a directory that does not exist cannot be discovered, so the plan that creates one re-runs the mutation rather than trusting the scan"
    - "A widened scan's output is read before it is believed: the file list and every match are surfaced and recorded, and an exclusion, had one been needed, would be a named constant with its reason beside it"
    - "vitest swallows console.log in this repository's configuration; a number a test computes is surfaced through a temporary failing assertion whose received value is the report, applied and restored by the mutation runner"

key-files:
  created:
    - ".planning/phases/06-device-session/06-05-SUMMARY.md"
  modified:
    - "src/lib/config-shape.spec.ts"
    - "src/lib/protocol/forbidden-instructions.spec.ts"
    - "src/routes/dev/catalog/+page.svelte"
    - "src/routes/dev/skeleton/+page.svelte"
    - "src/routes/dev/tune/+page.svelte"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The compile-surface rule is markers PLUS an allow-list of five EXACT paths, never a prefix, and the list is verified by walking what those five modules import; the walk FOLLOWS an exact permitted match and marker-checks every other specifier, so $lib/protocol inside session-copy.ts is red on the walk while $lib/protocol/usb inside ports.ts is followed"
  - "The five permitted modules are seeded into the walk themselves rather than reached only through the front door, so the allowance is verified today - when nothing on the front door imports the session yet - and not on the day a component first does"
  - "The marker rule keeps its no-exemption stance for `import type`: the device path's house pattern for an erased reference is a `typeof import(...)` alias, which no specifier scan sees, and a type import of a barrel would otherwise be a specifier the rule has to reason about"
  - "The generalised probe-route scan exempts only a probe's OWN directory; a sibling probe naming another is an offender, which is what surfaced three shipped pages naming the fidelity probe - described in prose now, as 05-12 did for the skeleton"
  - "forbidden-instructions.spec.ts reads comments deliberately and keeps doing so over src/lib; the .svelte components it does not read are a stated limit recorded in deferred-items item 4, not an exemption"

requirements-completed: []
requirements-contributed: [CONN-01, SAFE-01]

# Metrics
duration: 25min
completed: 2026-09-05
---

# Phase 6 Plan 05: Three shipped-gate widenings, each proven by a mutation Summary

**Three gates learned about the device path before a component could violate a rule nothing was watching. `config-shape.spec.ts` test 13 now forbids `lib/transport`, `lib/protocol` and `lib/device` in a static specifier - a hole that was OBSERVED, not assumed: `import { openZonaPort } from "$lib/transport"` in a `src/lib/ui/` component left the file at 14 passed before the widening and is red after it - and allows exactly five paths, which it verifies by walking what they import, following an exact permitted match and marker-checking every other, with the five modules seeded into the walk so the allowance is checked today rather than on the day a header first uses it. Test 12 discovers every probe directory under `src/routes/dev/` instead of naming the skeleton's, and the first thing the discovery found was three shipped probe pages spelling the fidelity probe's path. `forbidden-instructions.spec.ts` scans all of `src/lib` - 65 files instead of 16 - with its output read before it was believed: no new match. Eight mutations observed, two of them deliberately green, and no test count moved: 14 stays 14, 5 stays 5, quick stays 68 / 715.**

## The five-name carry-forward block

Measured by **06-01** on a clean tree at `746cfa2`. Carried forward verbatim, unchanged by this plan.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **61 (measured by 06-01)** | the same run. Rolls at 06-06, 06-07 and 06-13                                           |

**`PREV_E2E` does not move here.** No route's rendered output and no component changed (three probe pages changed a comment each); `test:e2e` was not run.

### Observed totals: previous SUMMARY plus this plan's delta

06-04 left the tree at **68 files / 715 tests**. This plan's delta is **+0 files / +0 tests** - three widenings of existing assertions, as the plan required - so quick stands at **68 / 715**, still `BASE_FILES + 2` and `BASE_TESTS + 24`.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 715
  check-counts: observed 68 files, 715 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npx vitest run --project server src/lib/config-shape.spec.ts
  Test Files  1 passed (1)
       Tests  14 passed (14)

npx vitest run --project server src/lib/protocol/forbidden-instructions.spec.ts
  Test Files  1 passed (1)
       Tests  5 passed (5)

npm run check 2>&1 | grep -Ei "error|warning"
  1788577445679 COMPLETED 523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` stays at **523 files**: no file was added.

## Task 1 — the compile-surface rule learns about the device path (commit `b9700eb`)

`config-shape.spec.ts` +126 / −7.

### The widening, as declared

`COMPILER_MARKERS` is `["vendor", "intechstudio", "lib/pad", "lib/transport", "lib/protocol", "lib/device"]`, with the reason beside the three new entries: `constants.ts`, `decode.ts`, `descriptors.ts` and `sequence.ts` each import the package at module scope and `device/try-on.ts` imports both barrels, and none of the three strings matched before. `PERMITTED_SPECIFIERS` is the plan's five, verbatim, with `transport.ts`'s zero-import fact written beside the fifth. `FRONT_DOOR_PAGES` gained `src/routes/+layout.svelte` with its reason: it renders on every route including `/`, and 06-09 puts the session's start and the live region there, so it is the file most likely to carry the session's own static import.

The amendment note sits in the file's own header block above `PERMITTED_SPECIFIERS` (*AMENDMENT (Phase 6, plan 06-05)*), and test 13's comment carries a second one describing the walk.

### The walk, and the branch that follows rather than trips

Every specifier is resolved (`$lib/x` to `src/lib/x`, a relative form against the importing file) and its file found by trying `.ts` then `/index.ts`. The worklist is seeded with the front-door set **and the five permitted files**. The branch, quoted from the committed file:

```ts
        // THE BRANCH THAT MAKES THE ALLOW-LIST MORE THAN A COMMENT. An EXACT
        // match for a permitted path is FOLLOWED - the file it names joins the
        // walk and its own imports are read - and it is never marker-checked,
        // because all five permitted paths contain a marker substring and a
        // check here would go red on the allowance itself. Everything else is
        // collected and marker-checked below. Exact, never prefix: $lib/protocol
        // is not $lib/protocol/usb, so a barrel import inside a permitted
        // module is an offender on the walk, named with the file that wrote it.
        if (PERMITTED.includes(path)) {
          followed.push(`${file} -> ${specifier}`);
          queue.push(fileOf(path) as string);
          continue;
        }
```

Three non-vacuity guards stand in front of the offender check, two of them new: a permitted path that resolves to no file is red (*a permitted specifier names no file on disk*), the walk must have read **at least four** permitted modules (*the walk read N permitted module(s) - it has gone silent*), and it must have followed **at least one** permitted edge (*the walk followed no permitted specifier - the matcher has gone blind inside the permitted modules*). The two existing guards - the front-door list longer than three, imports collected - stay.

### The walk's report

Surfaced by a temporary failing assertion whose received value was the report (vitest swallows `console.log` here - see deviation 3), applied and restored byte-identical by the runner:

```
walkedCount: 5
  src/lib/device/session.svelte.ts, src/lib/device/session-copy.ts,
  src/lib/protocol/usb.ts, src/lib/transport/ports.ts, src/lib/transport/transport.ts
followedCount: 5
  src/lib/device/session.svelte.ts -> ./session-copy
  src/lib/device/session.svelte.ts -> $lib/protocol/usb
  src/lib/device/session.svelte.ts -> $lib/transport/ports
  src/lib/device/session.svelte.ts -> $lib/transport/transport
  src/lib/transport/ports.ts -> $lib/protocol/usb
```

**Five modules read, five permitted edges followed** - the session's four (06-04's scan, reproduced by the gate that now enforces it) and `ports.ts`'s one - and every other specifier the walk met (116 of them, from `src/routes/+page.svelte -> $lib/catalog/front-door` to `src/lib/browse/sort.ts -> $lib/catalog/listing`) was collected and marker-checked, none matching. `session-copy.ts`, `usb.ts` and `transport.ts` contributed zero specifiers, which is the fact the allowance rests on, now checked on every run.

### The four mutations, every one restored byte-identical

Each was applied by the scratchpad runner (`mutate.mjs`: asserts the anchor occurs exactly once, inserts, runs the one spec, restores in a `finally`, reports `restored byte-identical`). All printed `true`.

**1. `import { openZonaPort } from "$lib/transport";` in `src/lib/ui/TagChip.svelte` — BEFORE the widening, at `fc1a70c`:**

```
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

**Green.** That is the hole. **AFTER the widening:**

```
FAIL ... > the front door never reaches the compiler at module scope
AssertionError: a front-door file, or a permitted module the walk followed, statically imports the compiler, the protocol package, the transport or the device path at module scope: expected [ Array(1) ] to deeply equal []
+   "src/lib/ui/TagChip.svelte -> $lib/transport",
      Tests  1 failed | 13 passed (14)
```

**2. `import { identifyOnly } from "$lib/device/try-on";` in the same file** — red, proving the allowance is a list of paths and not the `lib/device` namespace:

```
+   "src/lib/ui/TagChip.svelte -> $lib/device/try-on",
      Tests  1 failed | 13 passed (14)
```

**3. `import { FrameScanner } from "$lib/protocol";` in `src/lib/device/session-copy.ts`** — red **on the walk**: `session-copy.ts` is in no front-door list and is only read because the walk followed `./session-copy` from the session (and because it is seeded). The message names the file and the specifier, so the exact-match rule is visibly doing the work - `$lib/protocol` is not `$lib/protocol/usb`, and a prefix rule would have passed it:

```
+   "src/lib/device/session-copy.ts -> $lib/protocol",
      Tests  1 failed | 13 passed (14)
```

**4. `import { openZonaPort } from "$lib/transport";` in `src/routes/+layout.svelte`** — red, so `FRONT_DOOR_PAGES`'s new entry is genuinely in the walk:

```
+   "src/routes/+layout.svelte -> $lib/transport",
      Tests  1 failed | 13 passed (14)
```

Restored after each: **14 passed**.

## Task 2 — every probe route is unlinked, not just the first one (commit `53437f1`)

`config-shape.spec.ts` +34 / −8 (the test is renamed *every probe route under /dev/ is linked from nowhere*); three probe pages a comment each.

### Discovery instead of a name

`DEV_ROUTES = "src/routes/dev"`; the probe list is every directory under it, rendered as `dev/<name>` and sorted. Every file under `src/routes/` is read, and for each probe the file is checked unless it sits in that probe's **own** directory - a probe may name itself and nothing else. **Discovered on this tree: `dev/catalog`, `dev/fidelity`, `dev/skeleton`, `dev/tune`** - four.

Both non-vacuity guards, quoted:

```ts
    expect(scanned.length, "routes were actually read").toBeGreaterThan(0);
    expect(
      probes.length,
      "at least two probe directories were discovered",
    ).toBeGreaterThan(1);
```

The comment explaining why sibling probe pages describe each other in prose stays, extended with what this plan found (below), and the test's own amendment note records the discovery rule and its limit.

### What the widening found first

Run before any other edit, the generalised test went red on three shipped files:

```
FAIL ... > every probe route under /dev/ is linked from nowhere
AssertionError: expected [ …(3) ] to deeply equal []
+   "dev/catalog/+page.svelte mentions dev/fidelity",
+   "dev/skeleton/+page.svelte mentions dev/fidelity",
+   "dev/tune/+page.svelte mentions dev/fidelity",
```

`catalog/+page.svelte:16` and `tune/+page.svelte:85` each said *exactly as src/routes/dev/fidelity/+page.svelte does*; `skeleton/+page.svelte:5` and `:85` said *exactly like /dev/fidelity/*. The tune page's header even announced *THE THREE SIBLING ROUTES ARE DESCRIBED RATHER THAN SPELLED* - true of the skeleton, which was the only one the old scan read for, and false of the fidelity probe. All four are prose now (*the fidelity probe's page*, *the fidelity probe*), and the tune page's paragraph describes the rule as it is: every probe's directory, discovered. Deviation 1.

### The two observations

**`dev/tune` planted in `src/routes/+page.svelte`** (inside its header comment - this scan reads comments) — red, naming the file and the route:

```
FAIL ... > every probe route under /dev/ is linked from nowhere
AssertionError: expected [ '+page.svelte mentions dev/tune' ] to deeply equal []
+   "+page.svelte mentions dev/tune",
      Tests  1 failed | 13 passed (14)
```

**`dev/session` planted in the same place — GREEN, 14 passed.** `src/routes/dev/session/` does not exist, so a discovery-based scan cannot know the string names a probe. That is the honest limit of discovery and it is recorded here because it is why plan 06-06, which creates the route, re-runs this mutation and expects red. Both restored byte-identical.

## Task 3 — the forbidden-instruction scan reaches the device path (commit `0b4ba2b`)

`forbidden-instructions.spec.ts` +17 / −3.

`SCANNED_DIRS` is `["src/lib"]`. The header carries the note: the scan covered protocol and transport only from the day it was written, `src/lib/device/` has been outside it since Phase 4 wrote `try-on.ts`, `04-first-experience/deferred-items.md` carried the gap from 04-04 and 04-07, and a phase whose whole promise is "this never writes" is where it ends. The stale line *src/lib/transport/ arrives in a later plan of this phase* went with it; the `existsSync` guard stays.

### The output, read before it was believed

The file count, surfaced the same way as the walk's report:

```
AssertionError: SCAN-REPORT: expected '65 files: src/lib/index.ts, src/lib/p…' to be ''
```

**65 files, up from 16.** By directory (`find`, the same skips): browse 6, catalog 12, coverflow 1, device 3, fidelity 1, og 2, pad 2, protocol 8, share 2, sim 8, transport 8, tune 8, ui 2, plus `src/lib/index.ts` and `src/lib/protocol-pin.ts`. Across all 65: **no file names an erase or clear instruction, and `descriptors.ts` is still the only file containing `encode_packet`** (test 5's allowed one). The catalog entries' Lua strings, the one thing the plan named as a plausible scan artefact, matched nothing. **No exclusion was added, silent or named**, because none was needed. `src/vendor/` is not under `src/lib` and is unaffected.

### The two mutations

**A. A string literal in `src/lib/device/session.svelte.ts`** (`const plantedLiteral = "PAGECLEAR";`, inserted after the `ZONA_USB` import; a fragment-assembled twin on the line before it does not contain the needle contiguously and is not what went red):

```
FAIL ... > no shipped module names an erase or clear instruction
AssertionError: src/lib/device/session.svelte.ts names a forbidden instruction: expected true to be false
      Tests  1 failed | 4 passed (5)
```

**B. The same text inside a comment** (`// PAGECLEAR is named here in a comment only`) — **also red**, identically. The spec does not strip comments, and that is the correct behaviour for a scan whose subject is the vocabulary the codebase may contain: a forbidden name in a comment is one uncomment away from being revived, which is what the descriptor test's own comment has said since Phase 2. It did not strip; it went red. Both restored byte-identical; **5 passed** after each.

## Deviations from Plan

### 1. [Rule 3 - Blocking] Three sibling probe pages named the fidelity probe's path

**Found during:** task 2, the first run of the generalised test 12 (quoted above).

**Issue:** the plan said to keep the comment explaining that the sibling probe pages describe each other in prose. Three of them did not: `catalog/+page.svelte`, `skeleton/+page.svelte` (twice) and `tune/+page.svelte` all spelled `dev/fidelity`, and the old scan never read for it. A rule that exempted `src/routes/dev/` whole would have hidden this; the plan's rule ("outside a probe's **own** directory") is what found it, and it is the right rule - a probe linking a sibling is a path a visitor who typed one probe could follow to another.

**Fix:** the four mentions are prose (*the fidelity probe's page*, *the fidelity probe*), with the reason written beside two of them, exactly as 05-12's deviation 1 did for the skeleton's. The tune page's paragraph, which described the old skeleton-only rule, now describes discovery and records both observations (05-12's and this one). The spec was not weakened.

**Files modified:** `src/routes/dev/catalog/+page.svelte`, `src/routes/dev/skeleton/+page.svelte`, `src/routes/dev/tune/+page.svelte` - three files outside the plan's `files_modified`, comments only. **Commit:** `53437f1`.

### 2. [Rule 2 - Missing critical functionality] Two more non-vacuity guards on the walk

**Found during:** task 1, writing the walk.

**Issue:** the plan asks for one guard - at least four files visited. Because the five permitted files are seeded into the worklist, that count is 5 whenever the files exist, whether or not the matcher read a single import inside them; and a permitted path that resolved to no file would be skipped silently and "verified" by never being read.

**Fix:** `PERMITTED.filter((path) => fileOf(path) === undefined)` must be empty, and `followed.length` must be greater than zero. With the plan's guard that is three, and the second is the one that would catch a matcher gone blind inside a `.ts` file.

**Files modified:** `src/lib/config-shape.spec.ts`. **Commit:** `b9700eb`.

### 3. [Process] Numbers surfaced through a temporary failing assertion, not `console.log`

A `console.log` inserted into test 13 printed nothing under `vitest run` in this repository's configuration (the run stayed green and silent), so the walk's report and the scan's file count were each surfaced by a temporary `expect(JSON, "WALK-REPORT").toBe("")` whose received value vitest prints in full. Both insertions were applied and restored byte-identical by the runner and never committed. The first attempt at the log broke the file's syntax by landing inside a `filter(...)` argument, which the runner also restored.

### 4. [Rule 2 - Missing critical functionality] Deferred item 4: the widened scan reads `.ts` only

The Phase 4 item this closes named `src/lib/ui/` beside `src/lib/device/`. Widening to `src/lib` brings the two `.ts` files under `ui/` in and leaves the twenty-three `.svelte` components out, because the scan's filter is `.ts`. Not widened here - the plan's subject is the device path, which is `.ts` end to end, and a second extension changes what the scan is rather than where it looks. Recorded in the spec's header as a stated limit and in `deferred-items.md` item 4 with the one-line change that would close it.

### 5. [Process] The ROADMAP was edited and committed mid-run by the parallel Phase 7 workflow

Between this plan's task 1 and task 2 commits, `.planning/ROADMAP.md` showed as modified with Phase 7's thirteen-plan list, and then commit `5cb0530` (*docs(07): thirteen plans in thirteen waves…*) landed it and the Phase 7 plan files, which are no longer untracked. Nothing of that was staged, read or formatted by this plan; every commit used `--only -- <paths>`. The ROADMAP edit below is this plan's own two rows.

### 6. [Process] Commit invocation

`git commit -m "…" --only -- <paths>` failed once with `pathspec '-m' did not match` because the `--only -- <paths>` had been placed before `-m`; every commit then used `git commit -F <scratch message file> --only -- <paths>`, which keeps multi-line messages out of the shell.

## Requirements

**`requirements-contributed: [CONN-01, SAFE-01]`** - contributed, not completed, on the phase's convention. CONN-01's control is not rendered until 06-10 and 06-11; this plan is what lets it render on the first paint of `/` without carrying the compiler, and proves that by mutation. SAFE-01 is Phase 7's requirement; this plan puts the directory that would do the writing inside the scan that forbids destructive instructions. Neither is marked complete in REQUIREMENTS.md.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs.
- `PREV_FILES` / `PREV_TESTS` for plan 06-06 are **68 / 715**; `PREV_E2E` is **61** and rolls there.
- A component under `src/lib/ui/` may name statically only `$lib/device/session.svelte`, `$lib/device/session-copy`, `$lib/protocol/usb`, `$lib/transport/ports` and `$lib/transport/transport` from the device side; anything else under those three directories is red at edit time, `import type` included - use a `typeof import(...)` alias for an erased reference, as the session and `TryOnDevice.svelte` do.
- `src/routes/dev/session/` is protected by test 12 the moment it exists; 06-06 re-runs the `dev/session` mutation and expects red.
- `forbidden-instructions.spec.ts` reads every `.ts` under `src/lib`, comments included. A device component's `.svelte` is outside it (deferred item 4).
- The runner: `scratchpad/mutate.mjs <file> <anchor> <insertion> <spec> [label]`, one unique anchor, restore in a `finally`, byte-identity reported.

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/config-shape.spec.ts` - FOUND
- `src/lib/protocol/forbidden-instructions.spec.ts` - FOUND
- `src/routes/dev/catalog/+page.svelte`, `src/routes/dev/skeleton/+page.svelte`, `src/routes/dev/tune/+page.svelte` - FOUND
- `.planning/phases/06-device-session/deferred-items.md` - FOUND, item 4 appended
- `.planning/phases/06-device-session/06-05-SUMMARY.md` - FOUND

Commits claimed, verified in `git log`:

- `b9700eb` test(06-05): the compile-surface rule learns about the device path - FOUND
- `53437f1` test(06-05): every probe route under /dev/ is unlinked, not just the first one - FOUND
- `0b4ba2b` test(06-05): the forbidden-instruction scan reaches the device path - FOUND
