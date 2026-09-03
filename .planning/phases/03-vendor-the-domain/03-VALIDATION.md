---
phase: 3
slug: vendor-the-domain
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-02
reconciled: 2026-09-02
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is the Nyquist contract. `docs/TESTING.md` (plan 06) is the developer-facing companion and
> deliberately does not duplicate the map below. There is no `docs/VALIDATION.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 (node env, `expect.requireAssertions`, `passWithNoTests`), split into two projects per D-10: `server` (quick) and `sweep` (the 4,860-state invariant sweep) + @playwright/test 1.6x over `wrangler dev` on `./build` |
| **Config file** | `vite.config.ts` `test.projects` — task 3-01-01 removes the `src/vendor/**` exclusion and adds the `sweep` project; `playwright.config.ts` (exists, unchanged) |
| **Quick run command** | `npm run test:quick` (= `vitest run --project server`) — measured 4.64 s / 291 tests during research, 352 tests at end of phase |
| **Sweep command** | `npm run test:sweep` (= `vitest run --project sweep`) — measured 38.57 s / 9 tests |
| **Full suite command** | `npm run check && npm run lint && npm run test:quick && npm run test:sweep && npm run test:e2e` |
| **Estimated runtime** | quick ~5 s; sweep ~39 s; e2e ~60-90 s (build + wrangler cold start) |

**Research-measured facts the map depends on:** without the task 3-01-01 config change,
`npx vitest run` reports 4 files / 18 tests and never runs the vendored suites — acceptance criteria
MUST assert test counts, never "green". The load-bearing counts are per file and do not move as
HANGAR adds specs: `pad.test.js` 176, `pad-sim.test.js` 96, `pad-invariants.test.js` 9. `checkJs: true`
in `tsconfig.json` makes the three vendored `.js` tests produce 489 svelte-check errors; task
3-01-01 excludes `src/vendor/**` from type-checking (measured 489 → 0).

### Expected counts after each plan

| After plan | `test:quick` files | `test:quick` tests | `test:sweep` |
|---|---|---|---|
| (before) | 4 | 18 passed \| 1 todo (19) | n/a |
| 03-01 | 6 | 295 passed \| 1 todo (296) | 1 file / 9 tests |
| 03-02 | 7 | 309 passed \| 1 todo (310) | 9 |
| 03-03 | 8 | 329 passed (329) | 9 |
| 03-04 | 10 | 347 passed (347) | 9 |
| 03-05 | 11 | 352 passed (352) | 9 |
| 03-06 | 11 | 352 passed (352) | 9 |

Whole run at phase end: `npx vitest run` = 12 files / 361 tests.

---

## Sampling Rate

- **After every task commit:** `npm run test:quick` (plus `npm run lint` for tasks touching
  HANGAR-owned files)
- **After every plan wave:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`
- **Before `/gsd:verify-work`:** full suite incl. `npm run test:e2e` must be green
- **Max feedback latency:** 10 seconds (quick), 45 seconds (wave)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | FOUND-02 | config + structural guard | `npm run test:quick` reports `Test Files 4 passed (4)` / `Tests 23 passed \| 1 todo (24)`; `npm run check` reports `0 errors` | created here | ⬜ pending |
| 3-01-02 | 01 | 1 | FOUND-02 | vendored suite | `npx vitest run --project server src/vendor/botor/tests/pad.test.js` reports `176 passed`; `pad-sim.test.js` reports `96 passed`; `npm run test:sweep` reports `9 passed` | created here | ⬜ pending |
| 3-01-03 | 01 | 1 | FOUND-02 | doc shape | `npm run test:quick` reports `295 passed \| 1 todo (296)`; `grep -c "TBD" src/vendor/botor/VENDOR.md` prints `0` | exists (skeleton) | ⬜ pending |
| 3-02-01 | 02 | 2 | FOUND-02 | fixture generation | `node scripts/record-upstream-manifest.mjs` exits 0; manifest has 6 files, 5 deltas, the D-01 commit | created here | ⬜ pending |
| 3-02-02 | 02 | 2 | FOUND-02 | unit | `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` reports `14 passed` | created here | ⬜ pending |
| 3-03-01 | 03 | 3 | FOUND-02 (crit. 3), D-11a | fixture generation | `node scripts/capture-preset-baseline.mjs` exits 0; fixture has 9 presets with raw AND compressed lengths; sibling `git status --porcelain` unchanged | created here | ⬜ pending |
| 3-03-02 | 03 | 3 | FOUND-02 (crit. 3), D-11b | unit | `npx vitest run --project server src/lib/fidelity/preset-baseline.spec.ts` reports `19 passed` | created here | ⬜ pending |
| 3-03-03 | 03 | 3 | FOUND-02 (crit. 3) - closes Phase 1 FOUND-03/D-11 | unit | `npx vitest run --project server src/lib/protocol-pin.spec.ts` reports `5 passed`; `grep -c "it.todo"` prints `0` | exists (todo) | ⬜ pending |
| 3-04-01 | 04 | 4 | PREV-06 | oracle authoring (delegated) | `npx prettier --check src/lib/fidelity/firmware-oracle.ts`; all ten exports present; `dc7d301…` cited | created here | ⬜ pending |
| 3-04-02 | 04 | 4 | PREV-06 (crit. 4) | oracle | `npx vitest run --project server src/lib/fidelity/firmware-oracle.spec.ts` reports `7 passed` | created here | ⬜ pending |
| 3-04-03 | 04 | 4 | PREV-06 (D-07) | regression | `npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts` reports `11 passed`; `npm run test:quick` reports `347 passed (347)` | created here | ⬜ pending |
| 3-05-01 | 05 | 5 | FOUND-05 | source + structural | `node -e` counts ≥ 6 `await padReady()` in `src/lib/pad/index.ts`; `npm run check` reports `0 errors` | created here | ⬜ pending |
| 3-05-02 | 05 | 5 | FOUND-05 (crit. 5) | unit | `npx vitest run --project server src/lib/pad/ready.spec.ts` reports `5 passed`; `npm run test:quick` reports `352 passed (352)` | created here | ⬜ pending |
| 3-06-01 | 06 | 6 | FOUND-02/05 (crit. 1) | build artefact | `npm run build`; `build/dev/fidelity/index.html` exists; `build/_app/immutable/assets/lua_fmt_bg.*.wasm` exists | created here | ⬜ pending |
| 3-06-02 | 06 | 6 | FOUND-05 (crit. 1) | e2e | `npx playwright test e2e/fidelity.e2e.ts` reports `2 passed`; wasm response is `application/wasm`; console empty | created here | ⬜ pending |
| 3-06-03 | 06 | 6 | FOUND-02 | doc shape | `npx prettier --check docs/TESTING.md`; every script name and the 176/96/4,860/489/4173 facts present; `docs/VALIDATION.md` does NOT exist | created here | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All Wave 0 gaps are closed by **task 3-01-01** unless noted; each maps to a creating task.

- [ ] `vite.config.ts` — delete the `src/vendor/**` element from the `server` project's `exclude`; add a `sweep` project matching `src/vendor/botor/tests/pad-invariants.test.js` and exclude that file by name from `server` → **3-01-01**
- [ ] `package.json` — `test:quick` and `test:sweep` scripts; `test:unit` / `test` semantics preserved → **3-01-01**
- [ ] `tsconfig.json` — `"exclude": ["src/vendor/**"]` (measured 489 → 0 svelte-check errors) → **3-01-01**
- [ ] `.gitattributes` — `src/vendor/** -text`, appended after `* text=auto eol=lf`, BEFORE any vendored byte is staged → **3-01-01**
- [ ] `src/lib/config-shape.spec.ts` — five structural guards making all four config properties fail loudly if reverted → **3-01-01**
- [ ] `src/lib/fidelity/upstream-manifest.json` + `vendored-diff.spec.ts` → **3-02-01 / 3-02-02**
- [ ] `src/lib/fidelity/preset-baseline.json` + `preset-baseline.spec.ts` → **3-03-01 / 3-03-02**
- [ ] `src/lib/fidelity/firmware-oracle.ts` + `firmware-oracle.spec.ts` → **3-04-01 / 3-04-02**
- [ ] `src/lib/fidelity/golden-frames.json` + `golden-frames.spec.ts` → **3-04-03**
- [ ] `src/lib/pad/ready.ts` + `index.ts` + `ready.spec.ts` → **3-05-01 / 3-05-02**
- [ ] `src/routes/dev/fidelity/+page.svelte` + `e2e/fidelity.e2e.ts` → **3-06-01 / 3-06-02**
- [ ] `docs/TESTING.md` → **3-06-03**
- [ ] No framework install needed. `npm ci` is already correct.

---

## What the fixtures prove

| Fixture | Status | Proves |
|---|---|---|
| `src/lib/fidelity/upstream-manifest.json` | byte record | The vendored files differ from upstream only by the header block and the five recorded import/type rewrites |
| `src/lib/fidelity/preset-baseline.json` | independent | Captured from BOTOR's own compiler in BOTOR's own tree, so agreement proves the port changed nothing |
| `src/lib/fidelity/firmware-oracle.ts` | **oracle** | Re-derived from cited firmware source by an author structurally prevented from reading the simulator (D-05) |
| `src/lib/fidelity/golden-frames.json` | **regression tripwire, not an oracle** | Its hashes come from the simulator itself, so it proves only that a change to a shared helper altered a named preset's appearance. It says nothing about firmware fidelity (D-07) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| The oracle author never read the simulator | PREV-06 | Process property, not code | Task 3-04-01's SUMMARY carries the subagent's verbatim list of every file it opened; a reviewer confirms `pad-sim.ts`, `_pad.ts`, `src/vendor/botor/tests/*`, `03-RESEARCH.md` and `03-CONTEXT.md` are all absent |
| BOTOR public SHA equals the vendored SHA | FOUND-02 (D-01) | Network read of a remote | `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` prints `a0fb69d5…` (asserted in task 3-01-02 and again in 3-02-01 and 3-03-01) and every vendored header cites it |
| The sibling checkouts are byte-unchanged | standing rule | Filesystem state outside the repo | `git -C ../grid-editor status --porcelain` and `git -C ../grid-fw status --porcelain` captured before and after every task that touches them, quoted in the SUMMARY |
| Freeze-on-expiry tick order, if the fallback fires | PREV-06 (D-06 e) | Only if no reachable `PadState` produces an animating true→false transition within 2000 ticks | Task 3-04-02 records the finding, asserts the weaker static-preset form, and adds a row here naming the residual gap |

---

## Negative checks (observe red before trusting)

| Gate | How to make it red | Expected | Task |
|------|--------------------|----------|------|
| Vendored suite actually runs | Re-add `src/vendor/**` to the `server` project's exclude | `config-shape.spec.ts` red; test count collapses | 3-01-01 |
| vendored-diff (file) | Append one space to a line in `src/vendor/botor/pad-sim.ts` | red, names `pad-sim.ts` | 3-02-02 |
| vendored-diff (manifest) | Change one hex digit of `_pad.ts`'s sha256 | red, names `_pad.ts` | 3-02-02 |
| Preset baseline | Edit one character of a preset's fixture Lua | red, names the preset | 3-03-02 |
| Firmware oracle | Flip one entry in the oracle's LED table | red, names the cell | 3-04-02 |
| Tick order | Flip `TICK_ORDER.phaseAdvanceOffsetAtExpiry` to the other value | the tick-order test goes red | 3-04-02 |
| Golden frames | Change one hash in the fixture | red, names the preset and tick | 3-04-03 |
| WASM gate | Remove `await padReady()` from `costOf` | `ready.spec.ts` test 3 red with the vendored "not initialised" throw | 3-05-02 |
| Production WASM proof | Change one expected number in `e2e/fidelity.e2e.ts` | red, diff names the field | 3-06-02 |

Every negative check is observed going red once, reverted, and both exit codes recorded in the
plan's SUMMARY — the Phase 1 convention.

---

## Validation Sign-Off

- [x] All tasks have an `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references, each mapped to a creating task
- [x] No watch-mode flags (`test:unit` stays `vitest`, but every task command uses `--run` semantics via `test:quick` / `test:sweep`)
- [x] Feedback latency < 10 s quick / < 45 s wave
- [x] Every claim that the vendored suite is green is a test-count assertion, never an exit code
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned, pending execution
