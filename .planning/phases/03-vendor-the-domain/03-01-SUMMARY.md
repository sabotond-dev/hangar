---
phase: 03-vendor-the-domain
plan: 01
subsystem: testing
tags: [vendoring, vitest, botor, zona, provenance, gplv3, svelte-check, gitattributes]

# Dependency graph
requires:
  - phase: 01-scaffold-licence-and-pin
    provides: "The Vitest `server` project, the `root()`/`text()`/`code()` spec idiom in src/lib/config-shape.spec.ts, `.prettierignore`/`eslint.config.js` vendor exclusions, `src/vendor/botor/VENDOR.md` skeleton, and the pinned @intechstudio/grid-protocol@1.20260825.1135"
provides:
  - "Six BOTOR files vendored at a0fb69d5 under src/vendor/botor/ with GPLv3 section 5(a)/5(b) provenance headers"
  - "281 ported tests collected and green inside HANGAR: pad.test.js 176, pad-sim.test.js 96, pad-invariants.test.js 9"
  - "A two-project Vitest split: `npm run test:quick` (server, per task) and `npm run test:sweep` (sweep, per wave)"
  - "Five structural guards in src/lib/config-shape.spec.ts that fail loudly if the unquarantine, the split, the svelte-check exclusion or the EOL pin is reverted"
  - "`src/vendor/** -text` in .gitattributes, landed before any vendored byte was staged"
  - "A VENDOR.md naming the repository that actually contains the vendored commit, with a per-file header-offset table and an executable sync procedure"
affects:
  - "03-02 (upstream-manifest.json + vendored-diff.spec.ts hash exactly the bytes committed here; the header-offset table is its delta-inversion input)"
  - "03-03..03-06 (the firmware oracle, preset baseline and golden frames all import the vendored compiler and simulator)"
  - "04 (the catalog imports pad-sim-host.ts; test:quick is its per-task loop)"
  - "07 (PadWriteAdapter replaces the only Editor-coupled seam in the vendored compiler)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A vendored tree is unquarantined from the test runner BEFORE the files land, and every acceptance check on it asserts a test COUNT, never `the suite is green`"
    - "The invariant sweep is excluded from the quick project by FILE NAME, not by directory, so a directory-wide exclusion can never silently return"
    - "Vendored bytes are opted out of EOL normalisation (`src/vendor/** -text`) before the first `git add`"
    - "Cross-repo copies are Buffer-level: a Buffer.indexOf/concat splice per permitted delta, with a hard assertion that each delta string occurs exactly once"

key-files:
  created:
    - src/vendor/botor/_pad.ts
    - src/vendor/botor/pad-sim.ts
    - src/vendor/botor/pad-sim-host.ts
    - src/vendor/botor/tests/pad.test.js
    - src/vendor/botor/tests/pad-sim.test.js
    - src/vendor/botor/tests/pad-invariants.test.js
  modified:
    - vite.config.ts
    - tsconfig.json
    - package.json
    - .gitattributes
    - src/lib/config-shape.spec.ts
    - src/vendor/botor/VENDOR.md

key-decisions:
  - "D-10 fired on the measured numbers: test:sweep is 38.8 s wall against test:quick's 6.5 s, so pad-invariants.test.js runs as its own Vitest project per wave rather than per task; the split is by file name inside the server project's exclude, never by directory"
  - "tsconfig.json gains `\"exclude\": [\"src/vendor/**\"]` rather than `\"checkJs\": false` — surgical, keeps checkJs for HANGAR's own future JS, and still type-checks the three vendored .ts sources the moment HANGAR code imports them"
  - "The provenance header block is 7 lines for _pad.ts and 6 for the other five, because only _pad.ts's `Modified for HANGAR:` note wraps; VENDOR.md records the resulting 8/7 line offset so any citation of an upstream line number can be converted"
  - "The copy is Buffer-level, never a decode/re-encode round trip: pad.test.js is UTF-8 with non-ASCII content and plan 02's manifest hashes its exact byte stream"

patterns-established:
  - "Wave 0 config-before-content: a runner exclusion, a type-checker exclusion and a .gitattributes rule all land and are guarded in the commit BEFORE the content they govern exists"
  - "Every vendored file carries a six- or seven-line provenance block ending in a byte-identical sentinel line, followed by exactly one blank line, so a diff tool can strip the block deterministically"
  - "The negative check is executed, not assumed: the exclusion is re-added, the guard is watched going red with its exit code recorded, then reverted and re-run green"

requirements-completed: [FOUND-02]

# Metrics
duration: 9 min
completed: 2026-09-03
---

# Phase 3 Plan 01: Vendor the BOTOR Domain Summary

**BOTOR's ZONA compiler, simulator and render loop vendored at `a0fb69d5` with GPLv3 provenance headers and exactly three permitted deltas, behind a Vitest suite that was un-quarantined first so all 281 ported tests are counted (176 / 96 / 9) rather than silently skipped.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-03T09:36:22Z
- **Completed:** 2026-09-03T09:45:32Z
- **Tasks:** 3
- **Files modified:** 12 (6 created, 6 modified)

## Accomplishments

- The Phase 1 vendor quarantine is gone from the Vitest `server` project, and five structural guards in `src/lib/config-shape.spec.ts` make its return a test failure rather than a silently faster run.
- Six BOTOR files (436 KB) are vendored at `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` — verified publicly resolvable on `sabotond-dev/botor` before a byte was copied — each with a provenance header naming repository, upstream path, commit and sync date.
- 281 ported tests are collected and green under HANGAR's own toolchain: `pad.test.js` 176, `pad-sim.test.js` 96, `pad-invariants.test.js` 9. `npm run test:quick` reports 6 files / 295 passed | 1 todo (296).
- `npm run check` reports `336 FILES 0 ERRORS` with the vendored tree on disk (measured 489 errors without the tsconfig exclusion), and `npm run lint` exits 0.
- `VENDOR.md` now names the repository that actually contains the vendored commit, with a filled per-file table carrying the header-line offset, the three permitted deltas, and a sync procedure that is a sequence of runnable commands.

## Task Commits

1. **Task 3-01-01: Wave 0 — unquarantine the suite, split the sweep, silence checkJs, pin the bytes** — `e4778fb` (chore)
2. **Task 3-01-02: Assert the D-01 upstream SHA, then copy the six BOTOR files with provenance headers** — `dd817ce` (feat)
3. **Task 3-01-03: Correct VENDOR.md to the real upstream and fill the per-file table** — `9c87dc7` (docs)

## Files Created/Modified

**Created (vendored, byte-near, never formatted):**

- `src/vendor/botor/_pad.ts` — the ZONA compiler; 152,943 bytes / 4,388 lines (upstream 152,570 / 4,380 + 8 header offset). One delta: the `RGB` inline.
- `src/vendor/botor/pad-sim.ts` — the firmware-faithful simulator; 56,625 bytes / 1,576 lines (upstream 56,314 / 1,569 + 7). No delta.
- `src/vendor/botor/pad-sim-host.ts` — the rAF render loop; 19,712 bytes / 564 lines (upstream 19,382 / 557 + 7). No delta.
- `src/vendor/botor/tests/pad.test.js` — 176 compiler tests; 128,222 bytes. One import specifier rewritten.
- `src/vendor/botor/tests/pad-sim.test.js` — 96 simulator tests; 66,091 bytes. Two import specifiers rewritten.
- `src/vendor/botor/tests/pad-invariants.test.js` — the 9-test, 4,860-state sweep; 14,711 bytes. One import specifier rewritten.

**Modified:**

- `vite.config.ts` — `server` project no longer excludes `src/vendor/**`; excludes `pad-invariants.test.js` by file name instead. New `sweep` project includes that file alone.
- `tsconfig.json` — root `"exclude": ["src/vendor/**"]` with the three caveats (it replaces rather than merges the generated exclude; it only filters `include` expansion, not imports; only the untyped `.js` tests needed it) written into the file.
- `package.json` — `test:quick` and `test:sweep` added; `test:unit`, `test:e2e` and `test` untouched so `npm test` stays a whole-suite gate.
- `.gitattributes` — `src/vendor/** -text` appended after `* text=auto eol=lf`, committed in task 1 before any vendored file was staged.
- `src/lib/config-shape.spec.ts` — five new structural guards.
- `src/vendor/botor/VENDOR.md` — rewritten.

## Measured numbers

### Header line counts (the VENDOR.md offset column)

| File | Header lines | + blank | Offset |
|---|---|---|---|
| `_pad.ts` | 7 | 1 | **8** |
| `pad-sim.ts` | 6 | 1 | **7** |
| `pad-sim-host.ts` | 6 | 1 | **7** |
| `tests/pad.test.js` | 6 | 1 | **7** |
| `tests/pad-sim.test.js` | 6 | 1 | **7** |
| `tests/pad-invariants.test.js` | 6 | 1 | **7** |

`_pad.ts` is the odd one out because its `Modified for HANGAR:` note wraps onto a second `//   ` line.

### Pristine byte/line check before the deltas were applied

All six upstream files matched the recorded sizes exactly (152,570 / 4,380 · 56,314 / 1,569 · 19,382 / 557 · 127,944 / 3,705 · 65,818 / 1,863 · 14,422 / 356), and none contained a CRLF.

### Wall times (measured on this machine, after the vendored tree landed)

| Command | Files | Tests | Vitest duration | Wall time |
|---|---|---|---|---|
| `npm run test:quick` | 6 passed (6) | 295 passed \| 1 todo (296) | 4.15 s | **6.53 s** |
| `npm run test:sweep` | 1 passed (1) | 9 passed (9) | 36.43 s | **38.80 s** |
| `npx vitest run --project server .../pad.test.js` | 1 passed (1) | 176 passed (176) | 2.81 s | — |
| `npx vitest run --project server .../pad-sim.test.js` | 1 passed (1) | 96 passed (96) | 0.59 s | — |

D-10's ~30 s threshold is comfortably exceeded by the sweep alone, so the split stands: the sweep runs per wave, the quick run per task.

### The negative check (task 3-01-01)

`"src/vendor/**"` was re-added to the `server` project's `exclude` array, then removed again.

| State | Command | Result | Exit code |
|---|---|---|---|
| Exclusion re-added | `npm run test:quick` | `1 failed \| 22 passed \| 1 todo (24)` — red on `config-shape.spec.ts:53`, the first of the five guards (`expect(config).not.toContain("src/vendor/**")`) | **1** |
| Reverted | `npm run test:quick` | `4 passed (4)` / `23 passed \| 1 todo (24)` | **0** |

The guard fires on exactly the property it names, and only that one of the five went red.

### The sibling checkout (`C:\Users\sabot\Documents\Claude\grid-editor`)

`git status --porcelain` before and after the copy, byte-identical (`diff` exit 0):

```
 M src/renderer/config-blocks/ElementName.svelte
 M src/renderer/config-blocks/SimpleColor.svelte
```

`git -C ../grid-editor rev-parse HEAD` was `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` before and after. No state-changing git command was run there; the six files were read with `readFileSync` only.

### The D-01 gate

```
$ git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main
a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c	refs/heads/main
```

Local sibling HEAD matched. The precondition was already satisfied by the user's push; the assertion was run as written before anything was copied, and re-run as an acceptance criterion.

## Decisions Made

- **D-10 fired, on measurement not on prediction.** 38.80 s wall for the sweep against 6.53 s for everything else. `test:sweep` is a separate Vitest project rather than a `describe.skip` or an env flag, so the sweep is never *partially* run — the anti-drift mechanism runs less often, never less fully.
- **The sweep is excluded from `server` by file name, not by directory.** A directory exclusion is exactly the failure mode this task exists to remove; naming the single file makes a resurrected `src/vendor/**` both wrong and visibly wrong.
- **tsconfig option A over option B.** `"exclude": ["src/vendor/**"]` rather than `"checkJs": false`. Option B also gives 0 errors, but it lowers the bar for every future first-party HANGAR `.js` file. The three caveats (replace-not-merge, include-only filtering, imports still checked) are written into the file as comments so the next reader does not have to rediscover them.
- **The copy is Buffer-level with a uniqueness assertion per delta.** `Buffer.indexOf` + `concat`, and a hard throw if a delta string occurs zero or more than one time. A decode/re-encode round trip through a string would have been fine today but plan 02 hashes these exact bytes, and `pad.test.js` is UTF-8 with non-ASCII content.

## Deviations from Plan

None - plan executed exactly as written.

The plan's `<interfaces>` delta table was exhaustive and correct: all four import specifiers and the one `RGB` line were found exactly once each at the stated content, and the `_screen.ts:6` replacement text matched character for character. All six upstream files matched their recorded byte and line counts before any modification.

## Issues Encountered

- **The Bash tool transport halves backslashes**, which silently corrupted the five appended guards in `src/lib/config-shape.spec.ts` on the first attempt (`/name:\s*"server"/` arrived as `/name:s*"server"/`, `/^src\/vendor\/\*\* -text$/m` as `/^src/vendor/** -text$/m`). Caught by reading the file back before running anything. `git checkout -- src/lib/config-shape.spec.ts` reverted it cleanly and the block was written with the Edit tool instead. Nothing was committed in the corrupted state. Backslash-heavy greps and node one-liners were run from script files thereafter, per the environment note.
- **Prettier reflowed one guard line** (`expect(JSON.parse(code("tsconfig.json")).exclude).toContain("src/vendor/**")` onto three lines) during the single permitted unscoped `npm run format` in task 1. Expected and harmless — that format ran before any vendored byte existed on disk, and `git diff --stat -- .planning CLAUDE.md` was empty afterwards. `npm run format` was not run again at any point in this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 03-02. What it inherits:

- Six vendored files whose exact committed bytes are what `src/lib/fidelity/upstream-manifest.json` must hash, with `src/vendor/** -text` already in effect so no EOL rule can move them.
- The per-file header offsets (8 / 7 / 7 / 7 / 7 / 7) that `vendored-diff.spec.ts` needs to strip the provenance block and invert the delta set.
- `PRESETS` is exported from `_pad.ts` at upstream line 4206 — vendored line 4214 (upstream + 8). Any HANGAR document citing a vendored line must apply the offset; VENDOR.md states the rule.
- `npm run test:quick` (6.5 s) as the per-task loop and `npm run test:sweep` (38.8 s) as the per-wave gate.

No blockers. The `it.todo` in `src/lib/protocol-pin.spec.ts` is still the one todo in the quick run and remains D-11b's seam, to be filled by a later plan in this phase.

---
*Phase: 03-vendor-the-domain*
*Completed: 2026-09-03*

## Self-Check: PASSED

All six vendored files, `VENDOR.md` and this summary exist on disk. All three task commits
(`e4778fb`, `dd817ce`, `9c87dc7`) are present in `git log --all`. The header-offset rule was
spot-checked against a real citation: `PRESETS` is `export const PRESETS: readonly PadPreset[] = [`
at upstream `_pad.ts:4206` and at vendored `_pad.ts:4214` — upstream + 8, as VENDOR.md states.
