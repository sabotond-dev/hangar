---
phase: 03-vendor-the-domain
plan: 02
subsystem: testing
tags: [vendoring, sha256, provenance, gplv3, botor, vitest, d-04, manifest]

# Dependency graph
requires:
  - phase: 03-vendor-the-domain
    provides: "Plan 01's six vendored BOTOR files at a0fb69d5 with their 8/7-line provenance header offsets, the `src/vendor/** -text` EOL pin that keeps their bytes stable on disk, the two-project Vitest split, and the `root()`/`text()` spec idiom"
  - phase: 01-scaffold-licence-and-pin
    provides: "The Vitest `server` project, `.prettierignore`/`eslint.config.js` vendor exclusions, and the worktree-safe sibling resolution block in src/lib/format-parity.spec.ts"
provides:
  - "src/lib/fidelity/upstream-manifest.json - the sha256 and byte length of the PRISTINE upstream bytes of all six vendored files at a0fb69d5, plus the five inverse deltas that are the entire D-04 allow-list"
  - "scripts/record-upstream-manifest.mjs - a read-only re-recorder for step 5 of the VENDOR.md sync procedure, which asserts the D-01 SHA against both `git ls-remote` and the sibling's HEAD and fails if the sibling working tree moves during the run"
  - "src/lib/fidelity/vendored-diff.spec.ts - 14 tests turning 'import paths only' from a sentence into a byte-level assertion that names the offending file"
  - "A fidelity suite that needs no grid-editor checkout: the upstream bytes are pinned by a committed 1 KB hash manifest, not re-read from the sibling"
affects:
  - "03-03..03-06 (any change to a vendored file during oracle/baseline/golden-frame work now turns this suite red by name; D-08's 'fix upstream, never patch here' is mechanically enforced)"
  - "Every future re-sync (D-03): step 5 of VENDOR.md is now a runnable command whose output is committed"
  - "07 (PadWriteAdapter must be a seam OUTSIDE the vendored files - a local edit to _pad.ts would move its sha256)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pin upstream by hash, not by copy: a 1 KB manifest asserts the same property as a 436 KB second copy, and does not duplicate itself into every per-deploy GPLv3 source archive"
    - "Reconstruct-and-hash: strip the header block whole, invert each recorded delta in place, then compare - so line offsets never enter the diff logic and a header that grows by a line breaks nothing"
    - "Assert the byte length BEFORE the hash: a length mismatch names the delta size, a hash mismatch names nothing"
    - "Every delta must occur EXACTLY once before it is inverted, so an unrecorded rewrite site cannot hide behind a replace-all"
    - "The expected upstream SHA is a literal in the spec, never read from the file under test"

key-files:
  created:
    - scripts/record-upstream-manifest.mjs
    - src/lib/fidelity/upstream-manifest.json
    - src/lib/fidelity/vendored-diff.spec.ts
    - .planning/phases/03-vendor-the-domain/deferred-items.md
  modified: []

key-decisions:
  - "The manifest records the PRISTINE upstream sha256 and the spec reconstructs it from the vendored copy, rather than committing a second pristine copy of all six files - 1 KB instead of 436 KB, asserting exactly the same property, and not duplicated into every per-deploy GPLv3 source archive"
  - "The delta table is hard-coded in the recorder script rather than discovered by diffing: it is the D-04 allow-list, so an unrecorded delta MUST fail to reconstruct rather than being silently absorbed into the manifest"
  - "The spec reads nothing outside the repository, so it is green on a machine with no grid-editor checkout; src/lib/format-parity.spec.ts remains the one deliberate sibling-dependent canary"
  - "The header block is stripped as a whole through the sentinel plus one blank line, never by a fixed line count, so the 8/7 per-file offset never enters this spec and a future header edit cannot silently shift a delta"
  - "vendored-diff.spec.ts lives in src/lib/fidelity/, NOT in src/vendor/ - that directory is Prettier-ignored and ESLint-ignored, and a spec placed there would silently stop being formatted and linted"

patterns-established:
  - "Negative checks are executed, not assumed: each guard is watched going red with its exit code and failing test name recorded, then reverted with `git checkout --` and re-run green"
  - "Generated fixtures are proven byte-stable across two runs (`git add`, re-run, `git diff --quiet`) before they are committed"
  - "Cross-repo scripts capture the sibling's `git status --porcelain` before and after and treat any difference as fatal"

requirements-completed: [FOUND-02]

# Metrics
duration: 11 min
completed: 2026-09-03
---

# Phase 3 Plan 02: The Vendored-Diff Gate Summary

**"Import paths only" is now a failing test rather than a sentence: a committed 1 KB sha256 manifest pins the pristine upstream bytes of all six vendored BOTOR files at `a0fb69d5`, and a 14-test spec reconstructs those bytes from each vendored copy — header block stripped, five recorded deltas inverted — so any fourth change of any kind moves a hash and names the file.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-03T09:48:20Z
- **Completed:** 2026-09-03T09:59:10Z
- **Tasks:** 2
- **Files modified:** 4 (4 created, 0 modified)

## Accomplishments

- `src/lib/fidelity/upstream-manifest.json` pins the pristine sha256 and byte length of all six upstream files at `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c`, together with the five inverse rewrites that constitute the entire D-04 permitted-delta set. All six recorded byte lengths match the plan's table exactly.
- `src/lib/fidelity/vendored-diff.spec.ts` reports **14 passed (14)** and reads nothing outside the repository — the fidelity gate no longer depends on a grid-editor checkout existing.
- `scripts/record-upstream-manifest.mjs` makes step 5 of the VENDOR.md sync procedure a runnable command. It is read-only, worktree-safe, gated on the D-01 SHA from both `git ls-remote` and the sibling's HEAD, and byte-idempotent across two runs.
- Both negative checks were observed red with the correct test named and both exit codes recorded, then reverted byte-exactly.
- `npm run test:quick` reports `Test Files 7 passed (7)` and `Tests 309 passed | 1 todo (310)`; `npm run test:sweep` still reports 9; `npm run check` reports `337 FILES 0 ERRORS`; `npm run lint` exits 0.

## Task Commits

1. **Task 3-02-01: Record the pristine upstream bytes as a sha256 manifest** — `4f62971` (feat)
2. **Task 3-02-02: The vendored-diff gate — sha256 equality after inverting exactly three deltas** — `5debc55` (test)

## Files Created/Modified

**Created:**

- `scripts/record-upstream-manifest.mjs` — plain Node ESM, no dependencies. Resolves the sibling via `git rev-parse --git-common-dir` (never `REPO_ROOT/..`, which lands inside `.claude/` under a worktree), honours `BOTOR_REPO`, fails-never-skips if the checkout is missing, asserts the D-01 SHA twice, reads the six upstream files as Buffers, and writes the manifest with `JSON.stringify(m, null, 2) + "\n"`.
- `src/lib/fidelity/upstream-manifest.json` — 1,033 bytes. `upstream` block, `headerSentinel`, `note`, and six `files` entries carrying `vendored` / `upstream` / `bytes` / `sha256` / `deltas`.
- `src/lib/fidelity/vendored-diff.spec.ts` — 14 tests in four blocks. HANGAR-authored, so deliberately outside `src/vendor/` (which is Prettier- and ESLint-ignored).
- `.planning/phases/03-vendor-the-domain/deferred-items.md` — one out-of-scope discovery, below.

**Modified:** none. No vendored byte was touched; the two perturbations were reverted with `git checkout --`.

## Measured numbers

### The manifest — six pristine upstream hashes at `a0fb69d5`

| Vendored file | Upstream path | Bytes | sha256 (first 12) |
|---|---|---|---|
| `src/vendor/botor/_pad.ts` | `src/renderer/main/zona/_pad.ts` | 152,570 | `4e2c7a49c583` |
| `src/vendor/botor/pad-sim.ts` | `src/renderer/main/zona/pad-sim.ts` | 56,314 | `23464381580b` |
| `src/vendor/botor/pad-sim-host.ts` | `src/renderer/main/zona/pad-sim-host.ts` | 19,382 | `fe2088884b61` |
| `src/vendor/botor/tests/pad.test.js` | `src/renderer/tests/pad.test.js` | 127,944 | `8e6ccde06719` |
| `src/vendor/botor/tests/pad-sim.test.js` | `src/renderer/tests/pad-sim.test.js` | 65,818 | `7cf50173cb7e` |
| `src/vendor/botor/tests/pad-invariants.test.js` | `src/renderer/tests/pad-invariants.test.js` | 14,422 | `1aedd81a7356` |

Every byte length matches the plan's round-trip guard table exactly. Five delta entries across the six files: one `RGB` type inline in `_pad.ts`, one import specifier in `pad.test.js`, two in `pad-sim.test.js`, one in `pad-invariants.test.js`; `pad-sim.ts` and `pad-sim-host.ts` carry `"deltas": []`.

### The two negative checks

Both were executed, both went red naming the right file, both were reverted byte-exactly.

**1. One space appended to the end of line 200 of `src/vendor/botor/pad-sim.ts`** (byte 8132; 56,625 → 56,626 bytes on disk).

| State | Command | Result | Exit code |
|---|---|---|---|
| Perturbed | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | `Tests 1 failed \| 13 passed (14)`. Failing test: **`vendored BOTOR files (D-04) > src/vendor/botor/pad-sim.ts is byte-identical to upstream once the permitted deltas are inverted`**, at `vendored-diff.spec.ts:115` — the byte-length guard, not the hash: `reconstructed 56315 bytes, upstream src/renderer/main/zona/pad-sim.ts is 56314. A change of 1 bytes is not one of the three permitted deltas.` | **1** |
| Reverted (`git checkout -- src/vendor/botor/pad-sim.ts`) | same | `Tests 14 passed (14)`, `git status --porcelain src/vendor/` empty | **0** |

The length guard firing before the hash is the designed behaviour: it names the size of the change instead of printing two opaque hex strings.

**2. One hex digit flipped in the manifest's `_pad.ts` sha256** (`4e2c7a49…` → `0e2c7a49…`; byte length untouched, so the hash assertion had to be what fired).

| State | Command | Result | Exit code |
|---|---|---|---|
| Perturbed | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | `Tests 1 failed \| 13 passed (14)`. Failing test: **`vendored BOTOR files (D-04) > src/vendor/botor/_pad.ts is byte-identical to upstream once the permitted deltas are inverted`**, at `vendored-diff.spec.ts:120` — the sha256 assertion, with the D-03/D-08 "fix it upstream, never patch a vendored file locally" message attached | **1** |
| Reverted (`git checkout -- src/lib/fidelity/upstream-manifest.json`) | same | `Tests 14 passed (14)`, `git status --porcelain src/vendor/ src/lib/fidelity/upstream-manifest.json` empty | **0** |

Exactly one of the 14 tests went red in each case, and it was the one whose title names the perturbed file.

### The sibling checkout (`C:\Users\sabot\Documents\Claude\grid-editor`)

`git status --porcelain`, captured before Task 1 and again after Task 2, byte-identical (`diff` exit **0** both times):

```
 M src/renderer/config-blocks/ElementName.svelte
 M src/renderer/config-blocks/SimpleColor.svelte
```

`git -C ../grid-editor rev-parse HEAD` was `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` before and after. The only commands run there were `status --porcelain` and `rev-parse HEAD`; the six upstream files were read with `readFileSync` only. No state-changing git command was run in a sibling repository at any point.

### The D-01 gate, re-asserted by the recorder

```
$ git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main
a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c	refs/heads/main
```

and `git -C <BOTOR> rev-parse HEAD` equal to the same SHA. The script exits non-zero on either mismatch, so re-recording against a tree that has moved on is not possible by accident.

### Idempotence

`git add src/lib/fidelity/upstream-manifest.json`, re-run `node scripts/record-upstream-manifest.mjs`, `git diff --quiet -- src/lib/fidelity/upstream-manifest.json` → exit **0**. The generated manifest is byte-stable across two runs and Prettier-clean as written (`npx prettier --check` exit 0 with no `--write` ever applied to it).

### Suite state

| Command | Files | Tests | Notes |
|---|---|---|---|
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | 1 passed (1) | **14 passed (14)** | 268 ms |
| `npm run test:quick` | **7 passed (7)** | **309 passed \| 1 todo (310)** | ~11 s; three consecutive clean runs |
| `npm run test:sweep` | 1 passed (1) | **9 passed (9)** | 40.9 s, unchanged |
| `npm run check` | — | — | `337 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | — | — | exit 0 |

## Decisions Made

- **Hash the pristine bytes; do not commit them.** A second committed copy of all six files would be ~436 KB duplicated in the repository *and* re-duplicated inside every per-deploy GPLv3 source archive that `scripts/postbuild.mjs` produces, to assert exactly the property a 1 KB manifest already asserts.
- **The delta table is hard-coded in the recorder, not discovered by diffing.** It is the D-04 allow-list. A recorder that learned the deltas from the files would absorb an unrecorded change into the manifest and report success — the precise failure this plan exists to prevent.
- **Strip the header through the sentinel, never by line count.** Plan 01 produced 8-line and 7-line offsets; this spec is blind to both. A future header edit changes nothing here, and no delta can be silently shifted out of the compared region.
- **Assert length before hash.** `reconstructed 56315 bytes, upstream is 56314. A change of 1 bytes…` is a diagnosis; two differing hex strings are a puzzle. It is also what catches a lossy UTF-8 decode of `pad.test.js`, the one file with non-ASCII content.
- **Each delta must occur exactly once before inversion.** `body.split(d.vendored).length - 1 === 1`, with the file and the text in the message. A replace-all would silently paper over a second, unrecorded rewrite site.
- **The pinned SHA is a literal in the spec.** Reading the expected commit from the manifest under test would make that assertion tautological.
- **The spec is deliberately sibling-free.** `format-parity.spec.ts` requires the grid-editor checkout on purpose and stays that way; the fidelity gate must not, or it becomes unrunnable on a fresh clone. Asserted mechanically: no executable line in the spec mentions `grid-editor`, `git-common-dir` or `BOTOR_REPO`.

## Deviations from Plan

None - plan executed exactly as written.

The plan's `<interfaces>` delta table and pristine byte-length table were both exhaustive and correct: all six recorded lengths matched the upstream files exactly, all five delta strings occurred exactly once in their vendored files, and the reconstruction hashed clean on the first run. The manifest shape, the four test blocks and the 14-test count were produced as specified.

Two files were reformatted by a Prettier run scoped to the single file being authored (`npx prettier --write scripts/record-upstream-manifest.mjs` and the same for the spec) — a cosmetic reflow of one `fail()` argument list and one `expect().toContain()` call. `npm run format` was never run, no vendored file was touched, and `git status --porcelain src/vendor/` is empty.

## Issues Encountered

- **One flaky failure in `src/lib/format-parity.spec.ts`.** The first `npm run test:quick` after the 7th spec file landed reported `Test Files 1 failed | 6 passed (7)` / `Tests 1 failed | 308 passed | 1 todo (310)`, failing in the pre-existing formatter-parity canary. The spec passes in isolation (`3 passed`) and three immediately subsequent full runs were all green (`7 passed (7)` / `309 passed | 1 todo (310)`). It spawns two Prettier subprocesses over a 152 KB file inside Vitest's default 5,000 ms timeout, which a cold `npx` resolution under parallel load can cross. **Out of scope** under the executor scope boundary — a pre-existing spec untouched by this plan, whose fix is a judgement call about that spec's design. Logged to `.planning/phases/03-vendor-the-domain/deferred-items.md` with a suggested fix (explicit `{ timeout: 30_000 }` and dropping `npx` in favour of the local `prettier.cjs`).
- **The Bash transport halves backslashes** (the issue plan 01 hit). Every file here was authored with the Write tool and read back before being run, and every backslash-heavy check — the `grep -v '^\s*//'` sibling-mention criterion, the `grep -E "Tests +309 passed \| 1 todo \(310\)"` count criteria, and both perturbation scripts — was executed from a script file rather than inline. No file was ever committed in a corrupted state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 03-03. What it inherits:

- A byte-level D-04 gate that names the offending file. Any plan in 03-03..03-06 that is tempted to "just fix" something inside `src/vendor/` now gets a red test with the D-08 instruction ("fix it upstream and re-sync; never patch a vendored file locally") printed in the failure message.
- `src/lib/fidelity/` exists and is on the formatted, linted, type-checked side of the line — the natural home for `firmware-oracle.ts` (D-05/D-06), `preset-baseline.json` (D-11a) and the golden frames (D-07). Note for those plans: `src/lib/fidelity/` is **not** in `.prettierignore`, so any generated fixture landing there must be Prettier-clean as written, exactly as `upstream-manifest.json` is.
- `scripts/record-upstream-manifest.mjs` is a working template for the D-11a baseline script: same worktree-safe sibling resolution, same read-only discipline, same before/after `status --porcelain` assertion.
- `npm run test:quick` is 7 files / 309 passed | 1 todo (310); `npm run test:sweep` is 9. Those are the numbers the next plan's count-based acceptance criteria should be written against.

No blockers. The `it.todo` in `src/lib/protocol-pin.spec.ts` remains the one todo in the quick run and is still D-11b's seam.

---
*Phase: 03-vendor-the-domain*
*Completed: 2026-09-03*

## Self-Check: PASSED

All four created files plus this summary exist on disk. Both task commits (`4f62971`, `5debc55`) are
present in `git log --all`, and neither carries a trailer of any kind (`git log --format='%(trailers)'`
is empty for both). The six sha256 prefixes quoted in the table above were re-read from
`src/lib/fidelity/upstream-manifest.json` and match it exactly. `git status --porcelain src/vendor/`
and the sibling's `git status --porcelain` are both back to their pre-plan state.
