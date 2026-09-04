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
