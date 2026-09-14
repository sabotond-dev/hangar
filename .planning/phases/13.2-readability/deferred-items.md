# Phase 13.2 deferred items

Out-of-scope discoveries a plan's executor logged instead of fixing (the executor's scope boundary:
only what the current task's own files touch).

## From 13.2-04 (2026-09-13)

- **Seven comment lines naming the merged substitution's old names outside the plan's file list.**
  13.2-04 merged `#pageInit` / `#pageTimer` / `#pageUtility` into `#systemStringOr(config, event,
  protocolLib?)` and reworded the seven spec comments the plan named plus two in the store's own
  `ConfigStrings` JSDoc. The tree still spells the old names in comments in two files the plan
  declared untouched: `src/lib/tune/model.ts` (`:234`, `:251`, `:252`, `:261`, `:326`, `:337` -
  six lines, 13.2-01's leaf tier, under the plan's "sweep by declaration: nothing under
  `src/lib/tune/` moves") and `src/routes/dev/install/+page.svelte:91` (13.2-06's route tier).
  Comments only, no assertion reads them. For 13.2-06 (the route is its file; `model.ts`'s six
  lines are a one-line reword each: "`#systemStringOr` substitutes … in one place per slot") or a
  `/gsd:quick` task. Until then the six comments cite a private method that no longer exists.
- **`page-target.spec.ts`'s own `import * as P from "$lib/protocol"` alias** (`:4`, read at `:117-119`
  and `:133`). The plan's task 1 grep `\b[PT]\.` over `src/lib/device/*.spec.ts` prints these four
  lines; they are that spec's namespace import, not the store's handle, and the file is outside
  13.2-04. Left as is; noted so the next reader of that grep does not take it for a missed site.
