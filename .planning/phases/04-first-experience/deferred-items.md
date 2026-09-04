# Deferred items — Phase 4

Out-of-scope discoveries logged during execution. Nothing here was fixed.

## GSD tooling: `state update-progress` silently no-ops on this STATE.md

**Found during:** plan 04-01, the state-update step.

`cmdStateUpdateProgress` in `~/.claude/get-shit-done/bin/lib/state.cjs:389` falls back to

```js
const plainProgressPattern = /^(Progress:\s*).*/im;
```

The `i` flag makes `^Progress:` match the **YAML frontmatter key** `progress:` (line 9 of
STATE.md) before it reaches the body's `Progress: [bar] N%` line, and the greedy `\s*` then
swallows the newline and indentation so `.*` consumes `total_phases: 9`. The replacement therefore
mangles a frontmatter line rather than the progress bar; `writeStateMd` then rebuilds the
frontmatter from the body via `syncStateFrontmatter`, discarding the damage and leaving the bar
stale. The command reports `"updated": true` with the correct percentage and writes byte-identical
content — observed: reported 55%, file unchanged at 52%, mtime unchanged.

The bar was corrected by hand in plan 04-01 (18 summaries / 33 plans = 55%). It will go stale again
on the next plan unless the pattern is anchored past the frontmatter or made case-sensitive.

**Not fixed here:** it is a defect in the shared GSD toolchain outside this repository, and this
phase has no mandate to edit it.

## From plan 04-08

- `docs/TESTING.md`'s `npm run test:unit -- --run` row still reads **27 files, 462 passed + 1 todo**,
  which cannot be right when `test:quick` alone is 37 / 532. It was already stale before this plan and
  this plan did not observe that command, so it was left alone rather than guessed at: the plan's rule
  is that only OBSERVED totals go into that document. One `npm run test:unit -- --run` in a later plan
  fixes it.
- `src/lib/ui/` and `src/lib/device/` are still outside `forbidden-instructions.spec.ts`'s
  `SCANNED_DIRS` (`src/lib/protocol`, `src/lib/transport`). Widening it to `src/lib` would close both
  gaps at once and cost no tests. Carried forward from 04-04 and 04-07.
