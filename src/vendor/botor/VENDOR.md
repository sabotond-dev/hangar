# Vendored BOTOR sources

Everything under `src/vendor/botor/` is copied from `github.com/sabotond-dev/botor` (branch `main`), is
licensed under the GNU GPL v3 or later, and keeps Intech Studio's original file headers intact. The
directory is excluded from HANGAR's Prettier run (`.prettierignore`) and from its ESLint run
(`eslint.config.js`) so that a re-sync against upstream diffs cleanly instead of showing every line
rewritten. Do not format, lint-fix, rename or reorder anything in here.

Direction of flow is one-way: BOTOR → HANGAR. HANGAR-authored content never lands in a vendored file.

## Upstream

- Repository: `https://github.com/sabotond-dev/botor`
- Branch: `main`
- Recorded upstream SHA: `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c`

This file previously named `intechstudio/grid-editor` branch `redesign`, which was wrong on both
counts: `redesign` exists only in the fork, and the `zona` files have never existed in the Intech
repository, so a header citing it would name a commit that does not contain the file (D-02). Intech
Studio's own header stays inside each vendored file and is what credits them for the base; the GPLv3
section 5(a) "modified it, and giving a relevant date" and 5(b) licence-notice obligations are carried
by the per-file header block below.

## Vendored files

| HANGAR path                                   | BOTOR path                                 | Upstream SHA                               | Header lines | Last synced | Local modifications                            |
| --------------------------------------------- | ------------------------------------------ | ------------------------------------------ | ------------ | ----------- | ---------------------------------------------- |
| `src/vendor/botor/_pad.ts`                     | `src/renderer/main/zona/_pad.ts`            | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 8            | 2026-09-02  | `RGB` type inlined (upstream line 37); nothing else |
| `src/vendor/botor/pad-sim.ts`                  | `src/renderer/main/zona/pad-sim.ts`         | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | none                                            |
| `src/vendor/botor/pad-sim-host.ts`             | `src/renderer/main/zona/pad-sim-host.ts`    | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | none                                            |
| `src/vendor/botor/tests/pad.test.js`           | `src/renderer/tests/pad.test.js`            | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (1 specifier, upstream line 85) |
| `src/vendor/botor/tests/pad-sim.test.js`       | `src/renderer/tests/pad-sim.test.js`        | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (2 specifiers, upstream lines 10 and 33) |
| `src/vendor/botor/tests/pad-invariants.test.js`| `src/renderer/tests/pad-invariants.test.js` | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (1 specifier, upstream line 18) |

`Header lines` is the provenance block plus the single blank line that follows it. Any document citing
a line number in a vendored file cites the **upstream** number and adds that offset: vendored line =
upstream line + header lines.

## Per-file header template

GPLv3 §5(a) requires "prominent notices stating that you modified it, and giving a relevant date", and
§5(b) requires the licence notice. Every vendored file is stamped with this block, verbatim, above the
original Intech header, followed by exactly one blank line before the original first byte:

```
// Vendored from sabotond-dev/botor
//   path:   <BOTOR path>
//   commit: <upstream SHA>
//   synced: <YYYY-MM-DD>
// Modified for HANGAR: <one line, or "import paths only (N specifiers)">
// Original copyright and licence (GNU GPL v3 or later) retained below.
```

The last line is a sentinel: it is byte-identical in all six files and is what
`src/lib/fidelity/vendored-diff.spec.ts` strips on when it reconstructs the pristine upstream bytes.
`_pad.ts` is the one file whose `Modified for HANGAR:` note wraps onto a second `//   ` line, which is
why its block is 7 lines and every other block is 6.

## Permitted deltas

Exactly three kinds of change may exist between an upstream file and its vendored copy (D-04):

1. The provenance header block above, plus the one blank line after it.
2. Import-path rewrites, one specifier per site — `../main/zona/_pad` → `../_pad`,
   `../main/zona/pad-sim` → `../pad-sim`. The flat vendor layout keeps `./_pad` and `./pad-sim` valid,
   so `pad-sim.ts` and `pad-sim-host.ts` need no rewrite at all.
3. The one type inline in `_pad.ts`: `import type { RGB } from "../../config-blocks/_screen";` becomes
   `export type RGB = { r: number; g: number; b: number };`. The replacement text is character-identical
   to `grid-editor/src/renderer/config-blocks/_screen.ts:6`.

No formatting, no lint fixes, no renames, no reordering, no local bug fixes.
`src/lib/fidelity/vendored-diff.spec.ts` (Plan 02) asserts this at the byte level against a sha256
manifest — a fourth change of any kind moves the hash.

A fidelity bug is a BOTOR bug (D-08): it is fixed upstream and re-synced, never patched here, and the
oracle is never edited to match the simulator.

## Sync procedure

**Read-only. Never run a git command that writes in a sibling repository** — no checkout, no stash, no
clean, no commit, no restore. The sibling working tree must be byte-identical before and after; capture
its `git status --porcelain` before and after and compare.

1. `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` — record the SHA. This is
   the recorded upstream, not the local sibling's HEAD.
2. Copy the file into `src/vendor/botor/` as bytes (`cp`, or Node `copyFileSync`). Do not round-trip it
   through a text editor: `pad.test.js` is UTF-8 with non-ASCII characters and the exact byte stream is
   what the manifest hashes.
3. Re-apply the permitted deltas from the table in `src/lib/fidelity/upstream-manifest.json` (Plan 02)
   and nothing else.
4. Update the per-file header block and this file's table row.
5. `node scripts/record-upstream-manifest.mjs` to re-record the sha256 of the new pristine bytes.
6. `npm run test:quick` — the ported suites must report 176 and 96 tests.
7. `npm run test:sweep` — 9 tests.
8. `npx vitest run --project server src/lib/fidelity/` — vendored-diff, the preset baseline, the
   firmware oracle and the golden frames must all be green.
9. `npm run check` and `npm run lint`.

Note on formatting: `src/lib/format-parity.spec.ts` is the standing canary (D-15) that HANGAR's Prettier
and grid-editor's own Prettier emit identical bytes for real BOTOR sources, which is what keeps a
re-sync diff clean. It asserts formatter-output parity, not cleanliness — three of grid-editor's zona
files are not Prettier-clean upstream, so a `prettier --check` gate would be permanently red for a
reason outside HANGAR's control. A vendored file is never itself formatted.

## Status

Six files are vendored at `a0fb69d5`: the compiler (`_pad.ts`), the simulator (`pad-sim.ts`), the render
loop (`pad-sim-host.ts`) and their three test suites. Measured under HANGAR's own toolchain:
`pad.test.js` 176 tests, `pad-sim.test.js` 96, `pad-invariants.test.js` 9.

The Vitest suite is split into two projects (D-10 fired: the whole run was 39.9 s and
`pad-invariants.test.js` was 38.6 s of it, because its sweep is 4,860 labelled states):

- `npm run test:quick` — the `server` project, every spec except the sweep. Run per task.
- `npm run test:sweep` — the `sweep` project, `pad-invariants.test.js` alone. Run per wave. It is the
  anti-drift mechanism, so it runs less often and never less fully.

Re-sync is on demand (D-03), by following the procedure above — never automatic, never at phase start.
Escalation rule (`.planning/research/ARCHITECTURE.md` §4.2): promote `_pad.ts` + `pad-sim.ts` into a
shared `@zona/pad` package and make both repos consume it only after a sync requires manual conflict
resolution twice in a row, or a third consumer appears. Not before.
