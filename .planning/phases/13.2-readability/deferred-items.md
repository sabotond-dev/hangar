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

## From 13.2-06 (2026-09-14), and the rows above closed

- **13.2-04's seven stale-name comment lines: closed.** `src/lib/tune/model.ts`'s six lines
  (`:234`, `:251`, `:252`, `:261`, `:326`, `:337` at `ccf9cc3`) and
  `src/routes/dev/install/+page.svelte:91` now read `#systemStringOr` (keyed by the event number);
  no comment in the tree names `#pageInit`, `#pageTimer`, `#pageUtility`, `keptThisSession`,
  `askForecast` or `landLua` at all (`grep -rn` over every `.ts` and `.svelte` under `src/`
  prints nothing).
- **13.2-05's scoped-CSS `@property` gap: observed, not closed.** 06 cut no comment that was a
  utility's sole source (the build after each task printed `44 -> 44, 0 disappeared, 0 appeared`,
  the raw CSS `174411ee` unmoved), so the gap did not bite; it stands as CODE-STYLE section 9's
  13.2-05 line and TESTING.md's H-1 paragraph. Closing it (strip top-level `@property --tw-*` from
  the scoped term, or `source(none)` in `app.css`) is 13.2-CONTEXT question 7, the user's.
- **13.2-05's census baseline: closed by proof, not by rewrite.** The phase gate reports `FAIL: the
  literal census` against `gate/01.*` by construction; a `git worktree --detach` at `21c5ff8` with
  the fixed `hash-strings.mjs` copied in measures `6ac1cdf3`, and its JSON is equal to
  `gate/06-phase-after.strings.json` on every field but `head`. Recorded in TESTING.md.
- **13.2-05's quick-before-build order in `--after`: worked around, not changed.** 06 ran `npm run
  build` on the final tree before each `--after`, so layer B never refused. The script is unchanged
  (a gate script edit at the last plan would itself be unbracketed); for a later phase that reuses
  it, build first or move the build above the quick suite.
- **Sixteen spec headers over ten lines that no plan named** (`radius.spec.ts` 45 by D-01's
  exception, `decay-idiom.spec.ts` 39 by 13.2-02 D-20, `wire-pin.spec.ts` 46, `lua-parity.spec.ts`
  26, `stamp.spec.ts` 18, `transfer.spec.ts` 18, `query.spec.ts` 16, `ready.spec.ts` 16,
  `collections.spec.ts` 16, `snapshot.spec.ts` 15, `listing.spec.ts` 14, `surprise.spec.ts` 14,
  `return.spec.ts` 13, `facets.spec.ts` 12, `typographic.spec.ts` 11, `calibration.spec.ts` 11):
  outside every plan's file list, left as they are, named in TESTING.md as what the phase did not do.
- **`library.ts` prints under `--todo` by construction** (header 162: the ten banners kept as a
  table of contents, CODE-STYLE section 9's 13.2-02 line); a later reader of the `--todo` list
  should not take it for a missed file.
