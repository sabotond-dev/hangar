---
phase: 01-scaffold-licence-and-pin
plan: 02
subsystem: testing
tags: [vitest, prettier, pinning, grid-protocol, vendoring, config-guard]

# Dependency graph
requires:
  - phase: 01-01
    provides: "the scaffold, Vitest's `server` project glob, `@intechstudio/grid-protocol@1.20260825.1135` in package.json + package-lock.json, and grid-editor Prettier parity (`.prettierrc`, prettier@3.6.2, prettier-plugin-svelte@3.4.0)"
provides:
  - "`PROTOCOL_PIN` exported from `src/lib/protocol-pin.ts` as the literal `1.20260825.1135` — read internally, never displayed (D-12)"
  - "A three-way pin gate: package.json, package-lock.json and `PROTOCOL_PIN` must agree, the declared string must carry no range operator, and the literal itself is asserted so `npm update` cannot pass quietly (D-10)"
  - "`docs/PIN-POLICY.md` — the D-11 bump checklist, an empty bump log, and the D-12 internal-only tested-firmware-range note"
  - "`src/vendor/botor/VENDOR.md` — the D-16 sync-document skeleton Phase 3 fills (empty file table, verbatim per-file header template, read-only sync procedure)"
  - "`src/lib/config-shape.spec.ts` — red if a `svelte.config.{js,ts}` reappears, if Kit options gain a `kit: {}` wrapper, if the grid-protocol `optimizeDeps` exclusion is dropped, or if the Prettier config drifts"
  - "`src/lib/format-parity.spec.ts` — the D-15 vendor canary, reformulated as formatter-OUTPUT parity: HANGAR's Prettier must emit bytes identical to grid-editor's own Prettier for real BOTOR sources"
affects:
  - 01-03 (licence generator specs share the same Vitest server project and the `root()`/`text()` spec idiom)
  - 03-vendor-botor (VENDOR.md is filled there; format-parity.spec.ts is the gate that keeps re-sync diffs clean; PIN-POLICY.md's D-11 cost-baseline half is the `it.todo` filled there)
  - 06 (reads PROTOCOL_PIN internally for the tested-firmware range)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spec files resolve repo files through `new URL('../../<file>', import.meta.url)` so they work from any cwd, in the main tree and in a worktree alike"
    - "Sibling repos are resolved from `git rev-parse --git-common-dir`, never from `REPO_ROOT/..` — under `git worktree` the latter lands inside `.claude/`"
    - "Gates fail loudly, never `.skip`: a missing checkout or a missing upstream toolchain is a test failure with a message naming the path and the `BOTOR_REPO` override"
    - "Cross-repo formatting parity is asserted by comparing formatter OUTPUTS, not by asserting either side is already clean"
    - "Every negative check is observed going red once, reverted, and both exit codes recorded"

key-files:
  created:
    - src/lib/protocol-pin.ts
    - src/lib/protocol-pin.spec.ts
    - src/lib/config-shape.spec.ts
    - src/lib/format-parity.spec.ts
    - docs/PIN-POLICY.md
    - src/vendor/botor/VENDOR.md
  modified:
    - .planning/phases/01-scaffold-licence-and-pin/01-02-PLAN.md
    - .planning/phases/01-scaffold-licence-and-pin/01-VALIDATION.md

key-decisions:
  - "The D-15 vendor canary asserts formatter-output parity with grid-editor, not absolute Prettier cleanliness of a copied BOTOR file — three of the four grid-editor zona files are not Prettier-clean upstream, so `prettier --check` exit 0 was permanently unpassable and was measuring BOTOR's hygiene rather than HANGAR's config"
  - "The canary's upstream side runs grid-editor's OWN `node_modules/prettier/bin/prettier.cjs` in stdout mode with cwd set to the BOTOR root, so a Prettier version or plugin difference between the repos is caught, not papered over"
  - "The pin's negative check is a caret injection into package.json; the canary's negative check is a `.prettierrc` drift — the old mangle-the-copy check no longer discriminates because Prettier normalises the mangle away on both sides"

patterns-established:
  - "Structural guards live in `src/lib/*.spec.ts` under the Vitest `server` project and read config files as text, stripping line comments before structural matches so a comment can never pass or fail a check"
  - "Cross-repo assertions never write to a sibling checkout; the sibling's `git status --porcelain` is captured before and after and compared"

requirements-completed: [FOUND-03]

# Metrics
duration: 15 min
completed: 2026-09-02
---

# Phase 01 Plan 02: The Pin Gate, the Vendor Seam and the Config Guards Summary

**A three-way `grid-protocol` pin gate (`package.json` = lockfile = `PROTOCOL_PIN` = the hard-coded literal `1.20260825.1135`), the D-11 bump policy and D-16 vendor-doc skeleton, a config-shape guard against a resurrected `svelte.config.js`, and a D-15 vendor canary that proves HANGAR's Prettier emits bytes identical to grid-editor's own Prettier on real BOTOR sources.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-02T14:32:00Z
- **Completed:** 2026-09-02T14:47:00Z
- **Tasks:** 3
- **Files modified:** 8 (6 created, 2 planning documents amended)

## Accomplishments

- `PROTOCOL_PIN` exists and is guarded four ways: the declared string must match `/^\d+\.\d+\.\d+$/` (no `^ ~ > < = * x`, no hyphen range, no `||`), must equal `PROTOCOL_PIN`, the lockfile's resolved version must equal `PROTOCOL_PIN`, and `PROTOCOL_PIN` must equal the hard-coded literal. The first three would all agree after a silent `npm update`; the fourth would not.
- `docs/PIN-POLICY.md` writes the bump rule down as a checklist with an empty bump log, and records the tested firmware range as internal-only (D-12).
- `src/vendor/botor/VENDOR.md` is the seam Phase 3 fills — upstream identity, an empty per-file table, the verbatim per-file header template, and a read-only sync procedure.
- `src/lib/config-shape.spec.ts` closes four structural regressions at once: a resurrected `svelte.config.{js,ts}` (which Kit ≥ 2.62 honours while silently ignoring the options passed to `sveltekit()`), a `kit: {}` wrapper, a dropped `optimizeDeps` exclusion for grid-protocol, and Prettier config drift.
- `src/lib/format-parity.spec.ts` proves the property Phase 3 actually depends on: HANGAR's formatter and grid-editor's formatter produce the same bytes for `_pad.ts` (152 KB) and `pad-sim-host.ts`, so a vendored file re-syncs with a clean diff.
- Whole suite green: 3 files, 11 passing tests, 1 `todo` (the D-11 cost-baseline half, Phase 3). `npm run lint`, `npm run check` and `npm run format` all exit 0.

## Task Commits

1. **Task 1-02-01: The PROTOCOL_PIN constant and the three-way pin gate** — `226a99f` (feat)
2. **Task 1-02-02: The bump policy, the vendor seam and the config-shape guard** — `0593669` (docs)
3. **Task 1-02-03: The D-15 vendor canary** — `f92e6c8` (test)

**Plan metadata:** see the `docs(01-02)` commit following this summary.

## Files Created/Modified

- `src/lib/protocol-pin.ts` — exports `PROTOCOL_PIN = "1.20260825.1135"`; the internal-only pin Phase 6 reads (D-12)
- `src/lib/protocol-pin.spec.ts` — the D-10 three-way agreement gate plus the D-11 `it.todo` placeholder
- `docs/PIN-POLICY.md` — the D-11 bump checklist, empty bump log, D-12 internal-only note
- `src/vendor/botor/VENDOR.md` — the D-16 skeleton: file table, header template, read-only sync procedure
- `src/lib/config-shape.spec.ts` — four structural guards over `vite.config.ts`, `svelte.config.*`, `.prettierrc`, `.prettierignore`
- `src/lib/format-parity.spec.ts` — the D-15 vendor canary as formatter-output parity against grid-editor's own Prettier
- `.planning/phases/01-scaffold-licence-and-pin/01-02-PLAN.md` — Task 1-02-03 acceptance criteria, one `must_haves` truth and one `key_link` amended to the parity formulation
- `.planning/phases/01-scaffold-licence-and-pin/01-VALIDATION.md` — the canary's negative-check row replaced with the `.prettierrc`-drift form

## Decisions Made

- **The D-15 canary asserts parity, not cleanliness.** D-15's stated property is that a vendored file "diffs cleanly against BOTOR on every re-sync". That holds if and only if HANGAR's formatter emits the same bytes as BOTOR's formatter — it does not require upstream to have run the formatter. Asserting `prettier --check` exit 0 on a copy asserted the second, stronger and irrelevant thing.
- **The upstream side runs grid-editor's own Prettier binary,** not HANGAR's, with cwd set to the BOTOR root so grid-editor's config and plugin resolution apply. A version or plugin divergence between the two repos is therefore a test failure rather than an invisible assumption.
- **Nothing is normalised in the comparison.** A CRLF/LF difference between the two outputs would be a real parity failure and must stay visible.
- **The negative check moved from mangling a copy to drifting `.prettierrc`.** Under the parity formulation, mangling the copy no longer discriminates: Prettier normalises the mangle away on both sides and the outputs still agree. Config drift is the failure the gate actually exists to catch.

## Deviations from Plan

### Checkpoint decision (Task 1-02-03)

**1. [Rule 4 - Architectural] The D-15 canary as planned was unpassable; reformulated as formatter-output parity**

- **Found during:** Task 1-02-03 (the D-15 vendor canary)
- **Issue:** The plan required a copied grid-editor file to pass `prettier --check` under HANGAR's config with zero diff. It does not, and cannot be made to without editing the sibling repo. Verified read-only against grid-editor's own Prettier 3.6.2:

  | grid-editor `src/renderer/main/zona/` file | `prettier --check` under grid-editor's own Prettier 3.6.2 |
  |---|---|
  | `_pad.ts` (152 KB) | clean |
  | `pad-sim-host.ts` (19 KB) | 1 hunk / 3 lines |
  | `_zone-blocks.ts` | 5 hunks |
  | `pad-sim.ts` | 6 hunks / 57 lines — mostly Prettier reflowing a hand-laid 256-entry sine table |

  HANGAR's Prettier config is at exact parity with grid-editor's (byte-identical `.prettierrc`, same 3.6.2, no `prettier.config.js`, no tailwind plugin), so the failure was upstream hygiene, not HANGAR drift. The `--ignore-path .prettierignore` half of the design worked exactly as intended.
- **Resolution:** Escalated as a checkpoint. **User selected option B:** reformulate the canary as parity-with-upstream's-formatter rather than absolute cleanliness. `src/lib/format-parity.spec.ts` now computes `hangarOut` (HANGAR's `npx prettier --ignore-path .prettierignore <copy>`, cwd = HANGAR root) and `upstreamOut` (`node <BOTOR>/node_modules/prettier/bin/prettier.cjs <original>`, cwd = BOTOR root) and asserts `hangarOut === upstreamOut` byte for byte. The plan's helpers, the `git rev-parse --git-common-dir` sibling resolution, the fail-never-skip semantics, the `--ignore-path` flag and its comment, and the `afterAll` cleanup are all preserved.
- **Files modified:** `src/lib/format-parity.spec.ts`, `.planning/phases/01-scaffold-licence-and-pin/01-02-PLAN.md`, `.planning/phases/01-scaffold-licence-and-pin/01-VALIDATION.md`
- **Verification:** `npx vitest run src/lib/format-parity.spec.ts` → 3 passing. Negative check observed red (below). `git -C ../grid-editor status --porcelain` byte-identical before and after.
- **Committed in:** `f92e6c8`

**2. [Rule 3 - Blocking] The canary's negative check was replaced**

- **Found during:** Task 1-02-03
- **Issue:** The planned negative check (append `const  x   =    1 ;` to a copy, expect `prettier --check` non-zero with `--ignore-path` and zero without) no longer discriminates under the parity formulation: Prettier normalises the mangle away on both sides, so both outputs still agree and the test stays green. A gate never observed failing is not a gate.
- **Fix:** Substituted a `.prettierrc`-drift check, which targets the failure the parity gate actually exists to catch. Both exit codes recorded below.
- **Files modified:** `.planning/phases/01-scaffold-licence-and-pin/01-VALIDATION.md` (the negative-check row), `01-02-PLAN.md` (the corresponding acceptance criterion)
- **Committed in:** `f92e6c8`

**3. [Rule 3 - Blocking] The canary now requires grid-editor's `node_modules/prettier` to be installed**

- **Found during:** Task 1-02-03
- **Issue:** The parity comparison needs the upstream formatter on disk. If it is absent the test would have thrown an opaque ENOENT from `execFileSync`.
- **Fix:** The "can see the BOTOR checkout" test now asserts `<BOTOR>/node_modules/prettier/bin/prettier.cjs` exists, with a message telling the reader to run `npm install` in the grid-editor checkout. It fails, it does not skip — same semantics as the missing-checkout assertion.
- **Committed in:** `f92e6c8`

### Negative checks observed

| Check | Task | Result |
|---|---|---|
| Inject a caret into `dependencies["@intechstudio/grid-protocol"]` in `package.json` | 1-02-01 | **RED** — `protocol-pin.spec.ts` failed 2 of 4 assertions (the range-operator regex and the equality with `PROTOCOL_PIN`). Reverted; suite green again. |
| Drift `.prettierrc` to `{"plugins":["prettier-plugin-svelte"],"singleQuote":true}`, run `npx vitest run src/lib/format-parity.spec.ts` | 1-02-03 | **exit 1** — 2 of 3 tests failed on `expect(hangarOut).toBe(upstreamOut)`. Both canary files diverged. |
| Restore `.prettierrc` byte-exactly (md5 `a2deb9ef28ee6e0c3622a34dd6c942cb` before and after; `git status --porcelain -- .prettierrc` empty; `JSON.parse` shape equals `{plugins:["prettier-plugin-svelte"]}`), re-run | 1-02-03 | **exit 0** — 3 of 3 passing. |

The old mangle-the-copy check (non-zero with `--ignore-path .prettierignore`, zero without) is **not applicable** under the parity formulation and was not run as the canary's negative check: Prettier normalises the appended `const  x   =    1 ;` away on both sides, so `hangarOut === upstreamOut` still holds and the gate would stay green. `--ignore-path .prettierignore` nonetheless remains in the spec with its explanatory comment — without it Prettier obeys `.gitignore`, `.tmp-format-parity/` is gitignored, and `hangarOut` would be an empty string.

---

**Total deviations:** 1 architectural (escalated to a checkpoint, resolved by user decision B), 2 blocking (auto-fixed as consequences of that decision)
**Impact on plan:** The D-15 gate is stronger than planned, not weaker — it now fails on any Prettier version, plugin or config divergence between the two repos, which is the actual re-sync risk, whereas the planned form would have been permanently red for a reason outside HANGAR's control. No scope creep. Two planning documents were amended in place with the decision cited inline.

## Issues Encountered

- **Residual inconsistency:** `01-02-PLAN.md`'s bottom `<success_criteria>` block still describes the canary as "observed going RED on a deliberately mangled copy". The checkpoint decision authorised amending only the Task 1-02-03 acceptance criteria, the `must_haves` truth and the `key_link`, so that line was deliberately left alone. It is superseded by the amended acceptance criteria and by this summary.
- Three of the four grid-editor zona files are not Prettier-clean upstream. This is worth knowing before Phase 3 vendors them: `npm run format` will reformat `pad-sim-host.ts`, `_zone-blocks.ts` and `pad-sim.ts` on the way in, producing a one-time diff against BOTOR. `.prettierignore` already excludes `src/vendor/`, so the vendored copies stay byte-identical to upstream unless someone formats them deliberately — but the first re-sync after any such formatting will be noisy. The `pad-sim.ts` sine-table reflow (57 lines) is the worst case.

## User Setup Required

None — no external service configuration required. The canary does require a grid-editor checkout with its `node_modules` installed, at `<siblings>/grid-editor` or wherever `BOTOR_REPO` points; the test fails with an explicit message naming both if it is missing.

## Next Phase Readiness

- FOUND-03 is complete and gated. The pin cannot drift silently in either direction.
- The vendor seam (`src/vendor/botor/VENDOR.md`) and the formatting-parity gate are both in place ahead of Phase 3, which is what D-15 and D-16 were scheduled early for.
- The D-11 cost-baseline assertion is a live `it.todo` in `protocol-pin.spec.ts` and is Phase 3's to fill, once the vendored compiler can measure `compressScript` costs.
- Ready for 01-03 (licence files, `.gitattributes`, source archive, `THIRD-PARTY.md`).

---
_Phase: 01-scaffold-licence-and-pin_
_Completed: 2026-09-02_

## Self-Check: PASSED

All six created files and the summary exist on disk; all three task commits (`226a99f`, `0593669`, `f92e6c8`) are present in the history.
