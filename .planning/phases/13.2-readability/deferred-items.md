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

## From 13.2-05 (2026-09-14)

- **The scoped CSS hash is not independent of the utility vocabulary.** `css-terms.mjs` removes the
  `@layer properties{...}` and `@layer utilities{...}` blocks, but Tailwind v4 also emits one
  top-level `@property --tw-<name>` rule per utility family in use (48 in the 05 build), outside
  both layers. When the only source of `ease-out` (a prose line in `DeviceNote.svelte`'s old
  header) was cut, the utility left AND `@property --tw-ease` left with it, and the SCOPED hash
  moved from `e296d0af` to `b191a610` with no rule touched; the word was kept in the new header and
  the hash returned. For the phase gate (13.2-06): either strip top-level `@property --tw-*` rules
  from the scoped term as well (they are a function of the utility set, exactly like the two
  layers), or state that a utility with a `--tw-*` property may not disappear. The at-risk sole
  sources today: `sepia` (`PadFrame.svelte`'s header only), `ordinal` (`FacetRow.svelte` gone;
  `instrument.spec.ts:643` and `:663` remain), `backdrop-filter` (`colour-picker.spec.ts:243`),
  `ring-1` / `ring-4` (`lua-smoke.spec.ts`).
- **The `--before 05` census was the instrument's number, not the tree's.** `hash-strings.mjs`
  removed `<style>...</style>` before `<!-- -->`, and `PadSpinner.svelte:15`'s old header spelled
  `<style>` in prose, so the census had never counted that component's seven template literals
  (plus one `img` and four `true`). Fixed in `9bb9c06` (HTML comments first); the corrected census is
  `6ac1cdf3` (2,728 distinct / 6,354 occurrences) on this tree AND on a worktree at `ccf9cc3`, every
  literal, count, export and testid equal. The before records `gate/01.*` to `gate/05.*` carry
  `e6af80e0` (2,721 / 6,342); `--after 05` therefore reports `FAIL: the literal census` against `05`
  by construction, and 13.2-06's phase gate against `gate/01.*` will print the same seven `+` lines
  and two `-` lines. 13.2-06 should compare the census against `gate/05-after.strings.json` (the
  first corrected record) or name the seven literals as the known delta; the before records are not
  rewritten.
- **`13.2-gate.sh --after` runs the quick suite before the build**, so `radius.spec.ts` layer B refuses
  a build older than the last source edit (as it should) and the record reads `quick exit 1` with
  `check-counts: no Vitest summary lines`. Seen once here (the second `--after 05`, after the
  `9bb9c06` edit); the third run, with the fresh build in place, was `94 / 966`. Either build before
  the quick suite in `--after`, or run `--after` only after `npm run build` on the final tree.
- **A `git add -N .` slip** during the task 2 commit marked the untracked files (the user's
  `.claude/launch.json`, the three bible files at the root, the `gate/05.*` records) intent-to-add;
  `git reset -- .` undid it the same minute, nothing was committed from it, and the working files
  were never touched. Named so the next reader of the reflog is not surprised.
