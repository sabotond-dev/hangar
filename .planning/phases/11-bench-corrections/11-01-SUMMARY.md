---
phase: 11-bench-corrections
plan: 01
subsystem: catalog
tags: [catalog, facets, decay, vitest, removal]
requires: []
provides:
  - "The eleven-name baseline block for Phase 11"
affects: [11-02, 11-03, 11-04, 11-16]
tech-stack:
  added: []
  patterns: []
key-files:
  created: []
  modified: []
key-decisions: []
patterns-established: []
requirements-completed: []
duration: in progress
completed: 2026-09-09
---

# Phase 11 Plan 01: Nine Removals, the Facet Re-cut and the Decay Gate — Summary

**In progress. Task 11-01-01 landed the baseline block; the removal, the re-cut and the gate follow.**

## The baseline block, measured on a clean tree

Measured at `b29a00f` (the tree Phase 10 closed plus four Phase 11 planning commits; `git diff --stat
a17e926 HEAD` touches nothing outside `.planning/`, so every source line number in the plan's
blast-radius table still holds). `git status --porcelain` was empty before the first measurement.

| Name | Observed | Free memory at run start | Brief's figure | Agreement |
|---|---|---|---|---|
| `BASE_FILES` | **81** | 2,984 MB | 81 | agrees |
| `BASE_TESTS` | **828** passing, **1 todo** (reported, never asserted) | 2,984 MB | 828 | agrees |
| `BASE_SWEEP` | **4 19** (member list, not a total) | 3,010 MB | `4 19` | agrees |
| `BASE_SWEEP_WALL` | **134 s** | 3,010 MB | not stated | n/a |
| `BASE_E2E` | **103** | 3,260 MB | 103 | agrees |
| `BASE_CHECK` | **584 FILES 0 ERRORS 0 WARNINGS** (provenance only) | 2,384 MB | 584 | agrees |
| `BASE_CATALOG` | **36** | — | 36 | agrees |
| preset / Lua split | **9 ported preset + 27 hand-authored** | — | 9 / 27 | agrees |
| `FRONT_DOOR.length` | **8** | — | 8 | agrees |
| `EXCLUDED_FROM_ROW.length` | **28** | — | 28 | agrees |
| `BASE_OG_BYTES` | **213,919 bytes over 36 files** (5,942 B mean) | — | 36 files | agrees |

**No disagreement with the phase brief's `81 / 828 / 103 / 584 / 4 19` block.** Every one of the five
was observed rather than assumed, and each was produced by `scripts/check-counts.mjs` exiting zero
against the brief's own literal rather than by reading a number off a transcript.

Two supporting observations recorded here because later tasks are measured against them:

- **`grep -c "test("` over `e2e/` totals 85** across fifteen files, against a Playwright total of 103.
  The gap is parameterised titles. 85 is the number this plan's e2e zero is proved with, not 103.
- The FOR histogram at 36 entries is `modulation 9, expressive-side terms aside: show 5, mixing 3,
  sequencing 3, shortcuts 3, keys 3, pointing 3, play 3, drums 2, clips 2` — ten terms summing to 36,
  matching the plan's "now (36)" column exactly. FEELS is `readable 16, expressive 14, generative 13,
  playable 13, precise 8, still 8`.

`test-results/` was removed by hand after the Playwright run and `git status --porcelain` was empty
again before the first edit of task 02.
