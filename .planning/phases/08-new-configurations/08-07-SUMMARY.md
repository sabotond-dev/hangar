---
phase: 08-new-configurations
plan: 07
subsystem: catalog
tags:
  [
    laziness,
    wasm,
    wasmoon,
    e2e,
    playwright,
    probe-page,
    docs,
    pin-policy,
    D-14,
    D-17,
    CONT-02,
    PREV-02,
  ]
requires:
  - "src/lib/catalog/ (08-01) - CATALOG, frames.json, scripts/check-counts.mjs"
  - "src/lib/sim/ready.ts (08-02) - the lazy VM gate and the explicit glue URI; the emitted asset name"
  - "src/lib/sim/engine.ts + lua-pad-sim.ts (08-03) - createEngine and its dynamic Lua branch"
  - "e2e/fidelity.e2e.ts + src/routes/dev/fidelity/+page.svelte (Phase 3) - the unlinked probe-page pattern"
  - "src/lib/catalog/entries/ (08-04..08-06) - seven hand-authored entries, all in EXCLUDED_FROM_ROW"
provides:
  - "src/routes/dev/catalog/+page.svelte - an unlinked prerendered probe page: the catalog from a static import, an engine only from an explicit click"
  - "e2e/catalog.e2e.ts - 2 Playwright tests: the cold load fetches no WebAssembly, and opening a Lua entry is what fetches glue.<hash>.wasm as application/wasm with a real 243-byte frame"
  - "src/lib/sim/lazy.spec.ts - 3 fast structural guards over the source tree"
  - "docs/TESTING.md - the catalog and Lua host section, re-measured command table, the laziness proof and its asymmetry"
  - "docs/PIN-POLICY.md - a fifth bump-checklist item that re-measures every hand-authored entry, and the VM pin as a separate gate"
  - ".planning/research/STACK.md + CLAUDE.md - wasmoon recorded as a runtime dependency"
affects:
  - "Plan 08-08 and the phase verification: the observed totals are 42 / 559 (quick), 1 / 9 (sweep), 23 (e2e)"
  - "Any future protocol bump: item (4) of the PIN-POLICY checklist now covers the hand-authored entries"
  - "Phase 5: the tune panel recompiles through the same lazy seam these tests pin"
tech-stack:
  added: []
  patterns:
    - "A dev probe page makes a module-graph property observable from outside the process: static import for what must be cheap, dynamic import inside a click handler for what must be lazy"
    - "A source-scanning spec assembles the needle it searches for from fragments, so the walk can exclude specs by file name without needing an exception for itself"
key-files:
  created:
    - src/routes/dev/catalog/+page.svelte
    - e2e/catalog.e2e.ts
    - src/lib/sim/lazy.spec.ts
  modified:
    - docs/TESTING.md
    - docs/PIN-POLICY.md
    - .planning/research/STACK.md
    - CLAUDE.md
decisions:
  - "The plan's predicted pairing does not hold and the measurement says why: a static import of ./lua-pad-sim in engine.ts turns lazy.spec.ts red and leaves the e2e cold-load test GREEN, because every consumer of engine.ts (the coverflow row and the probe page alike) already reaches it through a dynamic import. The perturbation that does turn the e2e red is reaching the VM from a page's own load path. Both observations are recorded in docs/TESTING.md, and both layers are kept because they fail for different reasons."
  - "lua-parity.spec.ts is NOT the most expensive VM-backed spec, contrary to the plan's expectation. Measured: lua-entries.spec.ts 2.18 s, lua-parity.spec.ts 0.93 s. docs/TESTING.md records the measurement rather than the expectation. Neither is near the 10 s / 20 s thresholds their plans set."
  - "docs/TESTING.md records the e2e total as 23, the observed number, not the plan's '12' - which was arithmetic off a stale BASE_E2E of 10 from 08-01, superseded by 21 in 08-03."
metrics:
  duration: 10 min (resumed run; an interrupted first run had landed task 1)
  tasks: 3
  files: 7
  completed: 2026-09-04
---

# Phase 8 Plan 07: The Production-Build Laziness Proof Summary

The 271 KB Lua VM is now provably free for a visitor who only browses. A cold load of a page that
renders the whole sixteen-entry catalog, served out of `build/` through the real Worker, fetches
**zero** bytes of WebAssembly — not the VM, not the formatter — and clicking one button is what
brings `glue.Dlydm7r2.wasm` down, 200, `application/wasm`, followed by a real 243-byte frame rendered
by real Lua in real Chromium.

The plan expected one thing that turned out to be false, and measuring it was the most useful part of
the work. See "The negative checks" below.

---

## The resume: what was on disk, what was kept

A previous executor was killed by a session restart mid-plan. Found on disk:

| Artefact                            | State                     | Disposition                                                                                                       |
| ----------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `eafcb1d` the probe page            | committed                 | **Kept unchanged.** Re-verified against every task-1 acceptance criterion; all pass.                              |
| `e2e/catalog.e2e.ts`                | staged, uncommitted       | **Kept unchanged.** Reviewed line by line against the task-2 action; complete and correct. Committed in `3ed6d36`. |
| `src/lib/sim/lazy.spec.ts`          | staged, uncommitted       | **Kept unchanged.** Same review; 3 tests, needle assembled from fragments. Committed in `3ed6d36`.                 |
| `+page.svelte` unstaged `onMount`   | working tree only         | **Reverted.** It eagerly called `luaReady()` on mount, which is precisely what the cold-load test forbids.        |

The reverted hunk was almost certainly the interrupted run's negative check — it is exactly the
perturbation that turns e2e test 1 red, and it does so for the right reason. It has been re-applied,
observed red, and reverted again under controlled conditions (below), so the evidence exists without
the perturbation living in the tree.

Nothing was redone. No file the previous run produced was rewritten.

---

## The laziness result: which requests were made, and which were not

Observed against `build/` served by `worker/index.js` under `wrangler dev` on 127.0.0.1:4173.

**A cold load of `/dev/catalog/`** — page load, sixteen entries rendered from the static `CATALOG`
import, `catalog-count` awaited, then `networkidle`:

| Request class                  | Observed  |
| ------------------------------ | --------- |
| `glue.*.wasm` (the Lua VM)     | **none**  |
| `lua_fmt_bg.*.wasm` (formatter)| **none**  |
| any other `.wasm`              | **none**  |
| error-level console lines      | **none**  |

**After clicking `start-padsim`** (the vendored simulator path, a ported preset): still **zero**
non-formatter `.wasm` responses. The simulator route is not what brings the VM in.

**After clicking `start-lua`** (the first `preview === "lua"` entry):

| Property     | Observed                                                  |
| ------------ | --------------------------------------------------------- |
| URL          | `/_app/immutable/assets/glue.Dlydm7r2.wasm`                |
| Filename     | `glue.Dlydm7r2.wasm` — identical to the one 08-02 recorded |
| Size on disk | **271,581 bytes**                                          |
| Status       | **200**                                                    |
| Content type | **`application/wasm`**                                     |
| Probe output | `frameLength: 243`, `nonZeroBytes > 0`                     |
| Console      | empty                                                      |

The formatter's asset in the same directory is `lua_fmt_bg.D_18ElAm.wasm` (628,148 bytes), and the
discriminator the e2e uses is the **absence** of `lua_fmt_bg` in the URL rather than the VM's own
filename, so a Vite hashing change cannot turn this red for the wrong reason.

That is the browser half of PREV-02 and the whole of D-14's bundle assertion.

---

## The negative checks

Four runs, all four recorded, and one of them refuted the plan.

### 1. The static import in `engine.ts` — the unit guard goes red

`import { createLuaPadSim } from "./lua-pad-sim";` added at the top of `src/lib/sim/engine.ts`,
leaving the dynamic import in place.

```
npx vitest run --project server src/lib/sim/lazy.spec.ts   -> exit 1
  Tests  1 failed | 2 passed (3)
  FAILING: the Lua VM stays out of a cold load
           > engine.ts reaches the Lua wrapper only through a dynamic import
```

### 2. The same perturbation — the e2e cold-load test stays **GREEN**

```
npx playwright test e2e/catalog.e2e.ts   -> exit 0
  2 passed (10.3s)
```

**This contradicts the plan's prediction, and the reason is structural.** Nothing in this repository
imports `engine.ts` statically: `src/lib/ui/Coverflow.svelte` has an `import type` and an
`await import("$lib/sim/engine")`, and the probe page does the same. A fatter `engine.ts` chunk is
therefore not a fatter cold load — the chunk is not in the cold-load graph at all. `lazy.spec.ts`
test 2 guards a **chunk-composition** property one level upstream of the fetch the e2e watches, which
is worth guarding (a future component that does import `engine.ts` statically would pay for it), but
it is not the same property.

### 3. The perturbation that does turn the e2e red

An `onMount(() => import("$lib/sim/ready").then((m) => m.luaReady()))` on the probe page — reaching
the VM from the page's own load path. `LuaFactory`'s constructor starts the WASM load, so this is
enough:

```
npx playwright test e2e/catalog.e2e.ts   -> exit 1
  2 failed
  e2e\catalog.e2e.ts:78:3 > a cold catalog load fetches no WebAssembly at all
  e2e\catalog.e2e.ts:93:3 > opening a Lua configuration is what fetches the VM
  diff: + "http://127.0.0.1:4173/_app/immutable/assets/glue.Dlydm7r2.wasm"
```

So the cold-load assertion is **not vacuous**: a real regression in the page's own load path produces
exactly the failure it is written to produce, naming the asset.

### 4. The content type — the MIME assertion is live

`application/wasm` changed to `application/octet-stream` in `e2e/catalog.e2e.ts`:

```
npx playwright test e2e/catalog.e2e.ts   -> exit 1
  1 failed, 1 passed
  e2e\catalog.e2e.ts:93:3 > opening a Lua configuration is what fetches the VM
  Expected: "application/octet-stream"
  Received: "application/wasm"
```

That failure message is also the independent read of the served MIME quoted in the table above.

All four perturbations were reverted with `git checkout --`; afterwards
`git diff --quiet -- src/lib/sim/engine.ts e2e/catalog.e2e.ts src/routes/dev/catalog/+page.svelte`
exits 0.

---

## Observed totals, re-measured

Machine: Windows 11, Node v24.14.0. Date: 2026-09-04. Baseline from `08-06-SUMMARY.md`:
**41 files / 556 passed (quick), 1 / 9 (sweep), 21 (e2e, carried from 08-03)**.

| Command                      | Observed after this plan               | Against baseline           |
| ---------------------------- | -------------------------------------- | -------------------------- |
| `npm run test:quick`         | **42 files, 559 passed + 1 todo (560)** | baseline **+1 file, +3**   |
| `npm run test:sweep`         | **1 file, 9 passed**                    | unchanged                  |
| `npm run test:unit -- --run` | 43 files, 568 passed + 1 todo (569)     | —                          |
| `npm run test:e2e`           | **23 passed**                           | baseline **+2**            |
| `npm run check`              | 455 files, 0 errors, 0 warnings         | —                          |
| `npm run lint`               | exit 0                                  | —                          |

Verified through the helper, never against a literal in a plan (D-17):

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 42 559           -> exit 0
npm run test:sweep 2>&1 | node scripts/check-counts.mjs 1 9              -> exit 0
npm run test:e2e   2>&1 | node scripts/check-counts.mjs --playwright 23  -> exit 0
grep -c "failed" .tmp-e2e/e2e.log                                        -> 0
```

**The 41 / 556 baseline was confirmed rather than assumed.** `lazy.spec.ts` alone reports exactly
1 file / 3 tests, and the full quick run reports 42 / 559, so the tree at `eafcb1d` was 41 / 556 —
identical to what 08-06 recorded. The e2e baseline of 21 was likewise confirmed: 23 observed, of which
this plan's `catalog.e2e.ts` contributes exactly 2.

### Re-measured wall times (the `docs/TESTING.md` table)

Wall time is the whole command; the parenthesised figure is the runner's own duration.

| Command                      | Wall | Runner  |
| ---------------------------- | ---- | ------- |
| `npm run test:quick`         | 7 s  | 4.72 s  |
| `npm run test:sweep`         | 40 s | 38.28 s |
| `npm run test:unit -- --run` | 46 s | 44.89 s |
| `npm run test:e2e`           | 36 s | 34.1 s  |
| `npm run check`              | 7 s  | —       |
| `npm run lint`               | 30 s | —       |
| `npm run build`              | 8 s  | 5.65 s  |

### Per-file costs of the catalog and Lua specs

Each run on its own, wall time of the single-file run:

| File                                  | Tests | Cost   |
| ------------------------------------- | ----- | ------ |
| `src/lib/catalog/catalog.spec.ts`     | 10    | 0.48 s |
| `src/lib/catalog/frames.spec.ts`      | 5     | 0.81 s |
| `src/lib/catalog/lua-entries.spec.ts` | 6     | 2.18 s |
| `src/lib/sim/lua-host.spec.ts`        | 8     | 0.49 s |
| `src/lib/sim/lua-smoke.spec.ts`       | 3     | 0.66 s |
| `src/lib/fidelity/lua-parity.spec.ts` | 5     | 0.93 s |
| `src/lib/sim/lazy.spec.ts`            | 3     | 0.23 s |

**No VM-backed spec exceeded the threshold its plan set, and no recommendation is needed.**
`lua-entries.spec.ts` is the costliest at 2.18 s against a 10-second threshold; `lua-parity.spec.ts`
is 0.93 s against a 20-second threshold. The plan expected the parity spec to be the expensive one; it
is not, and `docs/TESTING.md` records the measurement rather than the expectation, along with the
precedent to follow if a future wave does push one over (a separate Vitest project, as D-10 did for
the invariant sweep — never trimming coverage).

---

## `CLAUDE.md` was regenerated, not edited

```
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-claude-md --force
  -> "Generated 3/5 sections. Fallback: conventions, architecture."
git diff --stat CLAUDE.md
  -> CLAUDE.md | 2 ++
```

Exactly two inserted lines, both of them the new `wasmoon` rows sourced from
`.planning/research/STACK.md` — one in Supporting Libraries, one in Version Compatibility. **Nothing
unexpected in the diff**; no normalisation churn, no reordering, no dropped section. `grep -c wasmoon`
prints 2 for `CLAUDE.md` and 2 for `STACK.md`.

---

## Deviations from Plan

### Auto-fixed and recorded

**1. [Rule 1 - Bug] The interrupted run's uncommitted `onMount` prefetch was reverted**

- **Found during:** the resume inspection, before task 2
- **Issue:** `src/routes/dev/catalog/+page.svelte` carried an unstaged
  `onMount(() => import("$lib/sim/ready").then((m) => m.luaReady()))`, which loads the Lua VM on page
  load — the exact behaviour e2e test 1 forbids. Left in, the plan's central assertion could never
  pass.
- **Fix:** `git checkout --` on the file, restoring the committed `eafcb1d` content. Re-applied later
  as a controlled negative check, observed red, reverted again.
- **Files modified:** `src/routes/dev/catalog/+page.svelte` (returned to its committed state)
- **Commit:** none needed — the tree was already correct at `eafcb1d`

**2. [Rule 1 - Bug] The plan's paired negative check does not hold, and the docs say what does**

- **Found during:** task 2, negative check 1
- **Issue:** the plan asserts that a static `./lua-pad-sim` import in `engine.ts` turns **both**
  `lazy.spec.ts` test 2 and the e2e cold-load test red. Measured: the unit guard goes red, the e2e
  stays green (exit 0, 2 passed). No module in the repository imports `engine.ts` statically, so the
  perturbation cannot reach any page's cold-load graph.
- **Fix:** ran a second perturbation that does exercise the property (an `onMount` reaching
  `luaReady()`), observed both e2e tests red naming `glue.Dlydm7r2.wasm`, and wrote the asymmetry into
  `docs/TESTING.md` so the next reader does not re-derive it. Both layers kept.
- **Files modified:** `docs/TESTING.md`
- **Commit:** `09057c4`

**3. [Rule 2 - Missing critical functionality] `docs/TESTING.md` records the measured cost ordering, not the expected one**

- **Found during:** task 3
- **Issue:** the plan instructs the guide to name `lua-parity.spec.ts` as the most expensive VM-backed
  spec. Measured, it is the second cheapest of the seven; `lua-entries.spec.ts` costs 2.4x more.
  Writing the plan's sentence would have put a false measurement into the developer-facing document
  the whole point of which is observed numbers.
- **Fix:** the section names `lua-entries.spec.ts` as the costliest, gives both figures against both
  thresholds, and explains why the parity spec is cheap (wasmoon boots in milliseconds under Node;
  per-preset samples are memoised at module scope).
- **Files modified:** `docs/TESTING.md`
- **Commit:** `09057c4`

**4. [Rule 1 - Bug] The e2e total in the guide is 23, not the plan's 12**

- **Found during:** task 3
- **Issue:** the plan's `<interfaces>` block states a 10-test e2e baseline and instructs the guide to
  say the total is now 12. That baseline is from `08-01-SUMMARY.md` and was superseded by 21 in
  `08-03-SUMMARY.md` (Phase 4 landed eleven tests in this shared tree).
- **Fix:** the guide records the observed **23**, broken down per file, and this SUMMARY's counts are
  checked against 21 + 2 with `check-counts.mjs --playwright 23`.
- **Files modified:** `docs/TESTING.md`
- **Commit:** `09057c4`

### Observations, not deviations

**Two commits from another session landed in this tree mid-plan**: `541883e`
(`docs(phase-04): TRY ON DEVICE confirmed on hardware`) and `f982eda`
(`docs(05): capture phase 5 context`). Both touch `.planning/` only — no source file, no spec, no
count. They are noted because they sit between `eafcb1d` and this plan's commits in `git log`, and
because `.planning/STATE.md` was **not** among the files they changed.

### Authentication gates

None. This plan deploys nothing and talks to no device.

---

## Verification

| Check                                                                       | Result                                    |
| --------------------------------------------------------------------------- | ----------------------------------------- |
| `npx vitest run --project server src/lib/sim/lazy.spec.ts`                  | 3 passed                                  |
| `npm run test:quick` vs `check-counts.mjs 42 559`                           | exit 0                                    |
| `npm run test:sweep` vs `check-counts.mjs 1 9`                              | exit 0                                    |
| `npm run test:e2e` vs `check-counts.mjs --playwright 23`                    | exit 0                                    |
| `grep -c "failed" .tmp-e2e/e2e.log`                                         | 0                                         |
| `npm run build`                                                             | exit 0                                    |
| `test -f build/dev/catalog/index.html`                                      | exit 0                                    |
| `npm run check`                                                             | 455 files, **0 ERRORS**, 0 warnings       |
| `npm run lint`                                                              | exit 0                                    |
| `npx prettier --check docs/TESTING.md docs/PIN-POLICY.md`                   | exit 0                                    |
| `grep -c "  it(" src/lib/sim/lazy.spec.ts`                                  | 3                                         |
| `grep -c "wasmoon" src/lib/sim/lazy.spec.ts`                                | 0                                         |
| `grep -c "  test(" e2e/catalog.e2e.ts`                                      | 2                                         |
| `grep -c "16" e2e/catalog.e2e.ts` / `grep -q frames.json`                   | 0 / present                               |
| six `data-testid`s on the probe page                                        | all present                               |
| `grep -c "wasmoon\|lib/pad" src/routes/dev/catalog/+page.svelte`            | 0 / 0                                     |
| `src/lib/config-shape.spec.ts` untouched and green                          | 14 passed, `git diff --quiet` exit 0      |
| `git diff --stat HEAD -- src/vendor/`                                       | empty                                     |
| `test ! -f docs/VALIDATION.md`                                              | exit 0                                    |
| both negative checks observed red, all four exit codes recorded, reverted   | yes; `git diff --quiet` on all three files |
| port 4173 free, no `workerd`/`wrangler` process left                        | confirmed, `tasklist` empty               |

---

## Commits

| Commit    | Message                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| `eafcb1d` | `feat(08-07): the unlinked catalog probe page` (landed by the interrupted run)   |
| `3ed6d36` | `test(08-07): the production-build laziness proof and its fast guards`           |
| `09057c4` | `docs(08-07): the catalog and Lua host test surface, the VM pin and the bump checklist` |

---

## For the next plan

- **08-08 (the hardware checkpoint):** the suite baseline to inherit is **42 / 559 (quick), 1 / 9
  (sweep), 23 (e2e)**. Re-measure rather than trust it; this tree is shared with Phase 4 and Phase 5.
- **Anyone touching the lazy seam:** `lazy.spec.ts` and `e2e/catalog.e2e.ts` do not guard the same
  property. The unit spec is about which module lands in which chunk; the e2e is about which bytes a
  browser actually fetches on a cold load. Breaking one does not necessarily break the other, and
  `docs/TESTING.md` explains why.
- **Anyone bumping the protocol pin:** `docs/PIN-POLICY.md` item (4) is new and it is the one that
  covers the hand-authored entries. The nine-preset gate cannot see them.

---

## Self-Check: PASSED

All eight files named in this SUMMARY exist on disk, and all three commits
(`eafcb1d`, `3ed6d36`, `09057c4`) exist in `git log`. Nothing missing.
