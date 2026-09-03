---
phase: 03-vendor-the-domain
plan: 05
subsystem: infra
tags: [wasm, lua-formatter, grid-protocol, gate, memoisation, vitest, found-05]

# Dependency graph
requires:
  - phase: 03-01
    provides: "The vendored BOTOR compiler at src/vendor/botor/_pad.ts with its padCompilerReady() / isPadCompilerReady() / assertPadCompilerReady() readiness block, and pad-sim.ts"
  - phase: 03-03
    provides: "src/lib/fidelity/preset-baseline.json - the aurora costs and compressed lengths the gated call is asserted to return, and the mustPreset narrowing idiom"
  - phase: 03-04
    provides: "The measured fact that PadSim needs no Lua formatter (firmware-oracle.spec.ts and golden-frames.spec.ts both run with the WASM uninitialised and neither has a beforeAll gate)"
provides:
  - "src/lib/pad/ready.ts - padReady(), the single memoised WASM gate, plus resetPadReadyForTests()"
  - "src/lib/pad/index.ts - HANGAR's compile / cost / fit / measure / validate surface; six async entry points, each awaiting the gate as its first statement"
  - "src/lib/pad/ready.spec.ts - the FOUND-05 proof in its own file (5 tests, ROADMAP criterion 5)"
affects:
  - "04 (the catalog imports PadSim directly and costOf/compilePreset from $lib/pad; what a page shows while the first gate resolves is Phase 4's concern)"
  - "05 (the fit ladder and budget meter call costOf/fitsIn/measureLua and inherit the gate for free)"
  - "07 (the install sequencer compiles and costs before writing; it must go through this surface, not the vendored functions)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The gate hangs off the compile surface, never the app root: nothing awaits padReady() until something asks for a cost, so the catalog paints without fetching 628 KB of WASM"
    - "A pre-init assertion must be the first gate-crossing call in its file, or it is a tautology - Vitest isolates module state per file, and the cold branch is observable exactly once"
    - "A negative check that stays green is a finding about the test, not a licence to weaken the check"

key-files:
  created:
    - src/lib/pad/ready.ts
    - src/lib/pad/index.ts
    - src/lib/pad/ready.spec.ts
  modified: []

key-decisions:
  - "compilePreset and compileState await the gate although compile() never touches the formatter: every caller of compile in HANGAR immediately costs the result, and one rule across the whole surface cannot be misapplied - the SUMMARY records that those two awaits are therefore unobservable by any test"
  - "Test 3 builds with the VENDORED compile rather than compilePreset, so costOf is the first call in the file to cross the gate; as the plan wrote it, compilePreset opened the gate first and the plan's own negative check stayed green"
  - "PadReserved and PadUserCode are re-exported as types from src/lib/pad/index.ts, so a caller can name every argument of the surface without importing from src/vendor/"
  - "PadSim is not re-exported from src/lib/pad/index.ts at all - a consumer imports it straight from src/vendor/botor/pad-sim, which makes 'the simulator is outside the gate' a fact about the module graph rather than a comment"

patterns-established:
  - "Negative check per gate: perturb, observe red with the exact failing test name and both exit codes, restore, observe green - and when it does not go red, fix the test rather than the criterion"
  - "Comment the absence: both gate files carry a full-line // comment saying why PadSim is NOT behind the gate, and neither imports it"

requirements-completed: [FOUND-05]

# Metrics
duration: 12 min
completed: 2026-09-03
---

# Phase 03 Plan 05: The WASM gate Summary

**One memoised `padReady()` in front of a six-entry-point compile / cost / fit / measure / validate surface, so the vendored compiler's "not initialised" throw and `checkSyntax`'s silent-false diagnostic are both unreachable from HANGAR — proven by a 5-test spec whose first two tests observe the cold branch and whose third goes red the moment any gate is deleted.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-03T10:38:00Z
- **Completed:** 2026-09-03T10:50:00Z
- **Tasks:** 2
- **Files created:** 3 (0 modified)

## Accomplishments

- ROADMAP criterion 5 is a test, not a claim. A cost call issued before the WASM has loaded
  **waits** and returns `setup.used = 250`, `timer.used = 55`, `measureLua(setupLua) = 249` — the
  values `preset-baseline.json` recorded from BOTOR's own compiler.
- The protocol package's `"ERROR: Lua formatter not initialized!"` `console.error` is asserted to
  fire on the vendored path (test 1) and asserted **not** to fire through HANGAR's surface
  (test 3). The silent-false mode is real, observable, and unreachable from HANGAR.
- `validate` through the surface never returns `not-ready` and never invents a `syntax`
  diagnostic.
- The simulator is outside the gate as a fact about the module graph: neither `ready.ts` nor
  `index.ts` imports `pad-sim`, and `PadSim` renders a 243-byte frame at tick 64 with the
  formatter uninitialised.
- `npm run test:quick` is **11 files / 352 passed | 1 todo (353)**, exactly as the plan predicted.
  `npm run test:sweep` is still 9. `npm run check` reports `351 FILES 0 ERRORS 0 WARNINGS`;
  `npm run lint` exits 0. `git diff --stat HEAD -- src/vendor/` prints nothing.

## Task Commits

1. **Task 3-05-01: The memoised gate and the awaited compile / cost / fit surface** — `3262388` (feat)
2. **Task 3-05-02: Prove the gate — waits rather than throws, and never leaks a bogus syntax error** — `65d546e` (test)

## The exported surface of `src/lib/pad/index.ts`

Phase 4 consumes this. Nothing else in HANGAR should import the vendored compiler's measuring
functions directly.

| Export | Signature | Gate |
|---|---|---|
| `compilePreset` | `(id: string, user?: PadUserCode) => Promise<CompileResult>` | awaits (belt-and-braces) |
| `compileState` | `(state: PadState, user?: PadUserCode) => Promise<CompileResult>` | awaits (belt-and-braces) |
| `costOf` | `(result: CompileResult, reserved?: PadReserved) => Promise<PadCost>` | **load-bearing** |
| `fitsIn` | `(result: CompileResult, reserved?: PadReserved) => Promise<boolean>` | **load-bearing** |
| `measureLua` | `(lua: string) => Promise<number>` | **load-bearing** |
| `validateCompiled` | `(result: CompileResult, reserved?: PadReserved) => Promise<PadDiagnostic[]>` | **load-bearing** |
| `padReady` | `() => Promise<void>` | re-exported from `./ready` |
| `PRESETS`, `presetById` | re-exported verbatim from the vendored compiler | not gated (no Lua) |
| types | `CompileResult`, `PadCost`, `PadDiagnostic`, `PadReserved`, `PadState`, `PadUserCode` | — |

`compilePreset` throws `unknown preset: {id}` for an id not on the shelf, so a caller never gets
`undefined` back and never has to narrow.

**`PadSim` is deliberately absent.** It takes a `PadState`, never Lua, and renders with the
formatter uninitialised. Phase 4 imports it from `src/vendor/botor/pad-sim` directly; gating it
would make the catalog wait on a 628 KB WASM download for a picture that does not need it.

## `resetPadReadyForTests()` — what it is and why it exists

`src/lib/pad/ready.ts` exports a second function that sets the memo back to `undefined`. It is
test-only and **is not called anywhere**, including in `ready.spec.ts`, which observes the natural
cold state instead.

It exists for a future spec that needs a second cold observation inside a single Vitest file — the
one thing Vitest's per-file module isolation cannot give you twice. Its honest limit is written on
its own doc comment and repeated here: dropping HANGAR's memo does **not** reset the vendored
module's `formatterReady` flag or `readyPromise`, so after one real initialisation the vendored
compiler stays ready no matter what this function does. It restores the *gate's* cold state, not
the *formatter's*. Anything wanting a genuinely uninitialised formatter needs its own file.

## The negative check (task 3-05-02)

The plan's instruction: remove the `await padReady();` line from `costOf` in
`src/lib/pad/index.ts`, run the spec, confirm test 3 goes red.

**First attempt — it did not go red.** Recorded because it is the interesting part.

| State | Command | Result | Exit code |
|---|---|---|---|
| `costOf` gate removed, test 3 as the plan wrote it | `npx vitest run --project server src/lib/pad/ready.spec.ts` | `Test Files 1 passed (1)`, `Tests 5 passed (5)` | **0** |

Cause: as drafted, test 3's first line was `const built = await compilePreset("aurora")`, and
`compilePreset` awaits the gate. By the time `costOf` ran, the formatter was already initialised —
so the test named "cost through HANGAR's surface awaits the gate" was not, in fact, issuing a cost
call before the WASM had loaded. It asserted the baseline numbers correctly and would have stayed
green through the deletion of the very await it was written to protect.

**Fix (Rule 1, below), then the check again.** Test 3 now builds with the vendored `compile`,
which needs no formatter (test 1 proves that), so `costOf` is the first call in the whole file to
cross the gate.

| State | Command | Result | Exit code |
|---|---|---|---|
| `costOf` gate removed | `npx vitest run --project server src/lib/pad/ready.spec.ts` | `Tests 1 failed \| 4 passed (5)`. Failing test: **`the Lua formatter gate (FOUND-05) > cost through HANGAR's surface awaits the gate and returns the recorded baseline`** | **1** |
| Restored (`git checkout -- src/lib/pad/index.ts`) | same | `Test Files 1 passed (1)`, `Tests 5 passed (5)` | **0** |

Failure message, as observed — the vendored throw, reached through HANGAR's surface:

```
Error: The Lua formatter is not initialised. Await padCompilerReady() first.
 ❯ assertPadCompilerReady src/vendor/botor/_pad.ts:76:11
 ❯ measure src/vendor/botor/_pad.ts:3042:3
 ❯ budgetOf src/vendor/botor/_pad.ts:3060:25
 ❯ cost src/vendor/botor/_pad.ts:3068:17
 ❯ costOf src/lib/pad/index.ts:72:10
 ❯ src/lib/pad/ready.spec.ts:89:26
```

After the restore: `git diff --quiet HEAD -- src/lib/pad/index.ts` exit **0**, and
`git diff --quiet -- src/lib/pad/ready.spec.ts` exit **0** (the spec was `git add`ed the moment it
first went green, before any perturbation — on an untracked path `git checkout --` fails outright
and `git diff --quiet` passes vacuously).

**What the check can and cannot cover.** The four load-bearing gates are `costOf`, `fitsIn`,
`measureLua` and `validateCompiled`; tests 3 and 4 exercise two of them cold-first and the other
two share the same one-line pattern. `compilePreset` and `compileState` await the gate for
uniformity, and **no test can detect the deletion of those two awaits**, because `compile()` never
touches the formatter. That is written into the spec beside test 4 so nobody later mistakes the
absence of coverage for an absence of intent.

## Files Created

- `src/lib/pad/ready.ts` (39 lines) — `padReady()`, a memoised IIFE promise awaiting
  `initLuaFormatter()` and then the vendored `padCompilerReady()`; `resetPadReadyForTests()`. The
  header states why the simulator is outside the gate and why nothing awaits this at boot.
- `src/lib/pad/index.ts` (98 lines) — the six awaited entry points, the `PRESETS` / `presetById`
  pass-through and the type re-exports.
- `src/lib/pad/ready.spec.ts` (121 lines) — 5 tests, order load-bearing, `ORDER MATTERS` in the
  first line of the file.

## Verification results

| Command | Result |
|---|---|
| `npx vitest run --project server src/lib/pad/ready.spec.ts` | `Test Files 1 passed (1)`, `Tests 5 passed (5)` |
| `npm run test:quick` | `Test Files 11 passed (11)`, `Tests 352 passed \| 1 todo (353)` |
| `npm run test:sweep` | `Test Files 1 passed (1)`, `Tests 9 passed (9)` |
| `npm run check` | `351 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | exit 0 |
| `npx prettier --write` on the three new files | all three `(unchanged)` — Prettier-clean as written |
| `git diff --stat HEAD -- src/vendor/` | prints nothing (0 bytes) |
| `test -f src/lib/pad/ready.ts && test -f src/lib/pad/index.ts` | exit 0 |
| `(s.match(/await padReady\(\)/g)).length` in `index.ts` | **6** |
| `grep -c 'await initLuaFormatter()' src/lib/pad/ready.ts` | **1** |
| `grep -v '^\s*//' src/lib/pad/index.ts \| grep -c 'initLuaFormatter'` | **0** |
| `grep -v '^\s*//' {index,ready}.ts \| grep -c 'PadSim\|pad-sim'` | **0** and **0**; both files mention it in a full-line `//` comment (**1** each) |
| `ls src/vendor/botor/*.spec.ts src/vendor/botor/ready.ts` | nothing found (exit 2) |
| `grep -c "Lua formatter" src/lib/pad/ready.spec.ts` | **4** (≥ 2 required) |

Task 3-05-01 was verified against the *pre-spec* counts before its commit:
`Test Files 10 passed (10)`, `Tests 347 passed | 1 todo (348)` — adding source files changed no
counts, as the plan required.

## Decisions Made

- **The gate attaches to the compile surface, not to the app root.** CONTEXT's "the app root awaits
  it before first render of anything that compiles" and CLAUDE.md's "never call
  `initLuaFormatter()` at boot" both hold, because nothing calls `padReady()` until something asks
  for a cost. `src/lib/pad/ready.ts` says so in its own header so a future reader does not
  re-litigate it.
- **`PadReserved` and `PadUserCode` are re-exported as types** (the plan's snippet exported four
  types; this exports six). Both appear in the public signatures, and a caller that could not name
  them would have to import from `src/vendor/` — which is exactly what this module exists to stop.
  No runtime consequence, no acceptance criterion touched.
- **`PadSim` is not re-exported here.** Making the consumer reach into `src/vendor/botor/pad-sim`
  keeps "the simulator is outside the gate" enforceable by grep on the import graph rather than by
  a comment nobody re-reads.
- **Test 3 builds with the vendored `compile`.** See the negative check above: this is the
  difference between a test that proves the gate and a test that merely passes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 3 could not observe the pre-init branch it was written to observe**

- **Found during:** Task 3-05-02, at the plan's own negative check.
- **Issue:** the plan's test 3 opened with `const built = await compilePreset("aurora")`, and
  `compilePreset` awaits `padReady()`. The gate was therefore already resolved before `costOf` ran,
  so the test asserted the baseline numbers against an already-initialised formatter. Deleting
  `costOf`'s `await padReady();` left the whole spec green (exit 0, `5 passed (5)`) — the plan's
  negative check did not bite, and the FOUND-05 proof was weaker than its own test name claimed.
- **Fix:** test 3 now builds its `CompileResult` with the vendored `compile` (which needs no
  formatter — test 1 establishes that in the same file), making `costOf` the first call in the file
  to cross the gate. Six lines of comment beside it explain why reaching for `compilePreset` there
  would re-introduce the tautology. A second comment beside test 4 records that `compilePreset`'s
  and `compileState`'s own awaits are unobservable by construction.
- **Files modified:** `src/lib/pad/ready.spec.ts` only. No production code changed; no acceptance
  criterion was altered or weakened.
- **Verification:** with the fix, the plan's exact perturbation produces exit **1** and names test
  3; the restore produces exit **0**. Both recorded above.
- **Committed in:** `65d546e` (the task 2 commit).

**2. [Rule 2 - Missing Critical] Two extra type re-exports**

- **Found during:** Task 3-05-01.
- **Issue:** `costOf`, `fitsIn`, `validateCompiled`, `compilePreset` and `compileState` take
  `PadReserved` / `PadUserCode` parameters, but the plan's snippet re-exported only
  `CompileResult`, `PadCost`, `PadDiagnostic` and `PadState`. A Phase 4 caller wanting to name
  either type would have had to import from `src/vendor/botor/_pad` — the one thing this module
  exists to prevent.
- **Fix:** `export type { CompileResult, PadCost, PadDiagnostic, PadReserved, PadState, PadUserCode };`
- **Files modified:** `src/lib/pad/index.ts`.
- **Verification:** `npm run check` → 0 errors; `npm run lint` exit 0; the `await padReady()` count
  is unchanged at 6.
- **Committed in:** `3262388` (the task 1 commit).

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical).
**Impact on plan:** the first strengthened the deliverable the plan exists to produce — without it
FOUND-05 would have been asserted by a test that could not fail. The second is a two-word
type-export widening with no runtime effect. No scope creep; both plan files landed with the
structure and the names the plan specified.

## Issues Encountered

- **The plan's negative check was green on the first attempt.** Handled as above rather than by
  weakening the criterion. Worth carrying forward as a rule: in a file where test order is
  load-bearing, a "before the gate" assertion has to be the *first* gate-crossing call in the file,
  and the way you find out whether it is, is the negative check — which is precisely why the plan
  demanded one.
- **`HEARTBEAT_INTERVAL 250000 250` on stdout.** The vendored `_pad.ts` prints one line of its own
  on import (upstream's `console.log`, and D-04 forbids touching it), so it appears in this spec's
  output too, as it does in `preset-baseline.spec.ts`. Cosmetic; noted so nobody parses around it.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 03-06. What it inherits:

- A stable public surface at `src/lib/pad/`. Anything in 03-06 that needs a cost, a fit or a
  diagnostic should import from `$lib/pad` (or `../pad`) rather than from `src/vendor/`, and gets
  the gate for free.
- The counts later plans should write their criteria against: `test:quick` is **11 files /
  352 passed | 1 todo (353)**; `test:sweep` is **9**; `npm run check` sees **351 files**. Exactly
  one `it.todo` remains in the server project — the named gap in `firmware-oracle.spec.ts` from
  03-04. A second one appearing is a regression.
- 03-06 is the D-12 plan, and its `key_links` already point `src/routes/dev/fidelity/+page.svelte`
  at `src/lib/pad/ready.ts` through a dynamic `await import` inside `onMount`. That works as
  written: `padReady()` has no import-time side effect, nothing fetches the WASM until it is
  called, and calling it from `onMount` keeps the fetch out of the prerender pass. The probe should
  compile and cost through `$lib/pad`'s `compilePreset` / `costOf` rather than the vendored
  functions — then it is exercising the same gate the browser build has to satisfy.

No blockers.

---

_Phase: 03-vendor-the-domain_
_Completed: 2026-09-03_

## Self-Check: PASSED

All three created files and this summary exist on disk. Both task commits (`3262388`, `65d546e`)
are present in `git log --oneline --all`, neither carries a trailer of any kind
(`git log -1 --format='%(trailers)'` is empty for both), and neither message mentions Claude. The
working tree is clean apart from this summary and the planning files committed alongside it.
