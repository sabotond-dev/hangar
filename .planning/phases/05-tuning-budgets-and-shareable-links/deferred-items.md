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
