# Deferred items — Phase 5

Out-of-scope discoveries, logged rather than fixed (execute-plan.md scope boundary).

## STATE.md's velocity block is stale, and has been since Phase 1

Found during 05-02's state update. `.planning/STATE.md` § Performance Metrics still reads:

```
- Total plans completed: 5
- Average duration: 20 min
- Total execution time: 1.7 hours

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 100 min | 20 min |
```

Thirty-five plans are complete across seven phases and the per-plan metric table beneath it is
correct and current — only the summary block above it was never recalculated. `gsd-tools state
record-metric` appends a row and does not touch the summary.

Not caused by this plan and not fixed here: it is a whole-project bookkeeping figure, not a Phase 5
artefact, and rewriting it mid-phase would put a number in the file that no tool maintains. Worth one
pass at phase close, or a `state recompute-velocity` if the toolchain grows one.

## The sweep project is no longer one file, and two documents still say it is

Found during 05-05, which widened the `sweep` Vitest project from `1 file / 9 tests` to
`3 files / 13 tests` (`vite.config.ts`).

Two committed documents now describe the old shape and neither is in this plan's file list:

- `docs/TESTING.md` line 22 — "the `sweep` project: `src/vendor/botor/tests/pad-invariants.test.js`
  alone | 1 file, 9 tests". The whole table there is already stale from before this phase
  (it reads 42 files / 559 tests for `test:quick`, against 54 / 627 today).
- `docs/PIN-POLICY.md` lines 42-43 and 64-65 — the bump checklist names "`npm run test:sweep`
  reports 9" and "the 9-test invariant sweep".

Not fixed here. `docs/PIN-POLICY.md` is plan 05-12's file (it is the plan that records the pinned
compiler's role in the unreachability finding), and `docs/TESTING.md`'s numbers want one pass at
phase close rather than a partial correction now. Nothing asserts either number mechanically, so the
suite is green either way — which is exactly why it needs to be written down rather than noticed.

## RESOLVED by 05-12: both documents that described the old sweep shape

`docs/TESTING.md` and `docs/PIN-POLICY.md` were both corrected in plan 05-12, which is the plan that
owns the phase's record. Every number in `docs/TESTING.md`'s "How to run it" table was re-measured on
2026-09-04 (quick 58 files / 646 + 1 todo, sweep 3 files / 13, both projects 61 / 659 + 1 todo, e2e
44, check 494 files / 0 errors), the Playwright per-file table was rebuilt from an observed run, and
`docs/PIN-POLICY.md` gained a sixth checklist item naming `npm run test:sweep` and its 3 / 13.

## "1 characters over 908" - the over-budget copy does not decline its noun

Found during 05-12, while rehearsing the probe: with `tpad` one index below the reserve's threshold
the block reads *"Scroll pushed Setup 1 characters over 908."* `overBudgetKnob`, `overBudgetArrived`,
`overBudgetKnobBoth`, `overBudgetArrivedBoth` and `liveOverBudget` in `src/lib/tune/copy.ts` all
interpolate `${by} characters` with no singular form.

Not fixed here, and the reason is the scope rule rather than indifference: it is pre-existing copy,
`copy.spec.ts` asserts several of those sentences character for character, and every one of them is
inside the branch this phase measured as unreachable - a visitor cannot produce an over-budget state
at all, let alone one that is over by exactly one character. It is a real defect and it is one line
per function plus the spec's expectations; it belongs in whatever plan next opens `copy.ts`.

## STATE.md's velocity block, one pass taken at phase close

The staleness recorded above was recomputed by hand at the end of 05-12 from the per-plan metric
table beneath it - 44 plans, 960 minutes, 16.0 hours, and a per-phase table for all six phases that
have executed. `gsd-tools state record-metric` still only appends a row, so the summary block will go
stale again the moment the next plan lands. The durable fix is a `state recompute-velocity`
subcommand, not another manual pass.
