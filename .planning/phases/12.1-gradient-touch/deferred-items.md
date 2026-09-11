# Phase 12.1 - deferred items

Out-of-scope discoveries logged by executors, not fixed in the plan that found them. Each names the
plan that found it and the plan expected to take it.

## From 12.1-08a (2026-09-11)

- **`src/lib/catalog/library.ts` section 5 - the caller lists for `N` and `G` are now incomplete.**
  `N`'s reads "Callers: ARC's stop tap (12.1-03, `N(x,y)==40`) and 13-15's region lookup, named in
  advance"; `G`'s reads "Callers, each named: EUCLID, STEPS, RADAR POINTS, SONAR (12.1-03), CHORUS,
  MORPH, CONSOLE, LUMEN (12.1-04) - eight". GHOST calls `N` twice (the erase key in the Setup, the
  comet / ghost cell in the Timer) and `G` once since 12.1-08a. Not edited by 12.1-08a because the
  run's brief forbade touching `library.ts` short of a Rule-1 bug. **For 12.1-08b**, which rewrites
  `N`'s paragraph when it moves `N` to 255/0 (R-20) and can add GHOST to both lists in the same edit.
- **`src/lib/catalog/entries/arc.ts:207-208` - "ARC is `N`'s one caller today and the reason it
  ships; 13-15's region lookup is the named second."** GHOST is a second caller since 12.1-08a.
  `arc.ts` is not in 12.1-08a's file set. **For 12.1-08b** (or 13-19, which re-cases entry names and
  touches every entry header).
