# Vendored BOTOR sources

Everything under `src/vendor/botor/` is copied from `github.com/sabotond-dev/botor` (branch `main`), is
licensed under the GNU GPL v3 or later, and keeps Intech Studio's original file headers intact. The
directory is excluded from HANGAR's Prettier run (`.prettierignore`) and from its ESLint run
(`eslint.config.js`) so that a re-sync against upstream diffs cleanly instead of showing every line
rewritten. Do not format, lint-fix, rename or reorder anything in here.

Direction of flow is one-way: BOTOR → HANGAR. A fix made here is not a fix BOTOR has.

**These files are no longer byte-identical to upstream, and that is policy, not drift.** D-02
(`.planning/phases/11-bench-corrections/11-CONTEXT.md`) permits editing the vendored tree, because the
decay defect behind AURORA's residual glow and STARFIELD's stuck colour is inside the vendored
compiler's codegen. The byte-pin that used to forbid this was not decoration — it was the only thing
stopping a re-sync from silently reverting a local fix — so it was **replaced rather than dropped**:

> **`intendedDivergence` in `src/lib/fidelity/upstream-manifest.json` is the single authority on what
> HANGAR has deliberately changed, and every row carries the hunk, a reason, the plan that chose it and
> a date.**

`src/lib/fidelity/vendored-diff.spec.ts` inverts that list, and the delta list, before hashing, so
**upstream's sha256 still rules**: a change recorded in neither list still moves the hash and still
names the file. The gate did not get weaker. It got specific.

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

| HANGAR path                                     | BOTOR path                                  | Upstream SHA                               | Header lines | Last synced | Mechanical deltas                                          |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------ | ------------ | ----------- | ---------------------------------------------------------- |
| `src/vendor/botor/_pad.ts`                      | `src/renderer/main/zona/_pad.ts`            | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 8            | 2026-09-02  | `RGB` type inlined (upstream line 37)                       |
| `src/vendor/botor/pad-sim.ts`                   | `src/renderer/main/zona/pad-sim.ts`         | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | none                                                        |
| `src/vendor/botor/pad-sim-host.ts`              | `src/renderer/main/zona/pad-sim-host.ts`    | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | none                                                        |
| `src/vendor/botor/tests/pad.test.js`            | `src/renderer/tests/pad.test.js`            | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (1 specifier, upstream line 85)           |
| `src/vendor/botor/tests/pad-sim.test.js`        | `src/renderer/tests/pad-sim.test.js`        | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (2 specifiers, upstream lines 10 and 33)  |
| `src/vendor/botor/tests/pad-invariants.test.js` | `src/renderer/tests/pad-invariants.test.js` | `a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c` | 7            | 2026-09-02  | import paths only (1 specifier, upstream line 18)           |

**The last column is deltas only, and is deliberately not a second copy of the divergence record.** A
table maintained by hand next to a machine-checked list is a table that drifts out of agreement with it
and then gets believed. For what HANGAR has deliberately changed, and why, read
`intendedDivergence` in `src/lib/fidelity/upstream-manifest.json` — nothing else is authoritative, and
`vendored-diff.spec.ts` fails if a file's bytes and that record disagree.

`Header lines` is the provenance block plus the single blank line that follows it. Any document citing
a line number in a vendored file cites the **upstream** number and adds that offset: vendored line =
upstream line + header lines. A line number in a file that carries an intended divergence is only valid
against the vendored copy, because a divergence can change a line's length but nothing here re-numbers
lines.

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

**A plan that lands an intended divergence updates that file's `Modified for HANGAR:` line in the same
commit**, naming the divergence rather than only the import rewrites. The header block is stripped
before hashing, so this costs no hash change — which is exactly why it has to be remembered rather than
enforced by the sha256.

## What may differ from upstream

Two kinds of difference, and they are not the same kind of thing:

1. **The provenance header block** above, plus the one blank line after it. Stripped whole, never
   inverted.
2. **A delta** — a mechanical rewrite forced by vendoring, recorded in `deltas`. Import-path rewrites,
   one specifier per site: `../main/zona/_pad` → `../_pad`, `../main/zona/pad-sim` → `../pad-sim`. The
   flat vendor layout keeps `./_pad` and `./pad-sim` valid, so `pad-sim.ts` and `pad-sim-host.ts` need
   no rewrite at all. Plus the one type inline in `_pad.ts`:
   `import type { RGB } from "../../config-blocks/_screen";` becomes
   `export type RGB = { r: number; g: number; b: number };`, character-identical to
   `grid-editor/src/renderer/config-blocks/_screen.ts:6`. A delta is not a decision — nobody re-checks
   it at a re-sync, it is simply re-applied. The list is closed: five entries across six files, and
   `vendored-diff.spec.ts` asserts that count.
3. **An intended divergence** — a deliberate behaviour change HANGAR chose, recorded in
   `intendedDivergence` with the hunk, a reason, the plan and a date. This list is **not** closed and is
   not capped by a count. A delta is allowed by being on a list; a divergence is allowed by carrying
   its own justification, and `vendored-diff.spec.ts` fails a row without one.

Still forbidden, and none of it is a divergence: formatting, lint fixes, renames, reordering, and any
edit that is not in one of the two lists. Both lists are asserted to match **exactly once** in the
file, because a hunk that matched twice reached a site nobody recorded.

**The boundary D-02 draws inside these files matters more than the permission.** The compiler's
emitted constants may change — a start/rate pair whose timeout cannot divide down to phase 0 is a
codegen bug. The **simulator's phase walk may not**: `pad-sim.ts`'s `ledTick` reproduces
`grid-fw`'s `grid_led.c:190-211` line for line, `pha += fre` on a `uint8_t` that wraps, and that wrap
is the firmware's real behaviour. Clamping it would make the preview *less* faithful while appearing
to fix the symptom. `src/lib/fidelity/firmware-oracle.spec.ts` is the mechanical proof of that half and
is never edited to accommodate a change here.

A fidelity bug is still preferably a BOTOR bug (D-08): fix it upstream and re-sync where that is open.
D-02 permits fixing it here when it is not, and the price of that permission is the record.

## Sync procedure — a merge, not a copy

**Read-only. Never run a git command that writes in a sibling repository** — no checkout, no stash, no
clean, no commit, no restore. The sibling working tree must be byte-identical before and after; capture
its `git status --porcelain` before and after and compare.

1. `git ls-remote https://github.com/sabotond-dev/botor.git refs/heads/main` — record the SHA. This is
   the recorded upstream, not the local sibling's HEAD.
2. Copy the file into `src/vendor/botor/` as bytes (`cp`, or Node `copyFileSync`). Do not round-trip it
   through a text editor: `pad.test.js` is UTF-8 with non-ASCII characters and the exact byte stream is
   what the manifest hashes.
3. **Re-apply each `delta`** from `src/lib/fidelity/upstream-manifest.json`, and nothing else. These
   are mechanical; they are not re-decided.
4. **Re-apply each `intendedDivergence`, and re-check every one before you do.** This is the step the
   byte-pin used to make unnecessary and the step the record exists for:
   - If the new upstream lands the same behaviour by itself, the row is **retired**: delete it, do not
     re-apply it, and say in the commit message that upstream fixed it. A record that only ever grows
     is a record nobody trusts.
   - If a row no longer applies cleanly, that is a **conflict to resolve by hand, with the row's
     `reason` as the brief** — the sentence is there so the resolver knows what behaviour must survive,
     not merely what text used to be there.
   - If the row still applies and is still needed, re-apply it and update its `dated`.
   - Two re-syncs in a row that need hand resolution is the escalation trigger recorded below.
5. Update the per-file header block — including its `Modified for HANGAR:` line — and this file's
   table row.
6. `node scripts/record-upstream-manifest.mjs` to re-record the sha256 of the new pristine bytes. It
   **carries the `intendedDivergence` rows forward** from the existing manifest and prints them, so
   nothing in the record is lost by regenerating it; the printed list is the checklist for step 4.
7. **`node scripts/capture-preset-baseline.mjs`** — re-take `src/lib/fidelity/preset-baseline.json`
   from BOTOR's own compiler at the new commit. The baseline is the ORIGINAL's behaviour and is only
   meaningful at the commit it was captured from, so a re-sync that moves the commit and leaves the
   fixture behind is comparing today's copy against yesterday's original. Never hand-edit that fixture:
   a mismatch against an un-moved commit is a STOP-and-report (D-08).
8. `npm run test:quick` — the ported suites must report 176 and 96 tests.
9. `npm run test:sweep` — 9 tests.
10. `npx vitest run --project server src/lib/fidelity/` — vendored-diff, the preset baseline, the
    firmware oracle and the golden frames must all be green. `preset-baseline.spec.ts` has its own
    `INTENDED_DIVERGENCE` table, declared per preset and per field; the same re-check applies to it.
11. `npm run check` and `npm run lint`.

Note on formatting: `src/lib/format-parity.spec.ts` is the standing canary (D-15) that HANGAR's Prettier
and grid-editor's own Prettier emit identical bytes for real BOTOR sources, which is what keeps a
re-sync diff clean. It asserts formatter-output parity, not cleanliness — three of grid-editor's zona
files are not Prettier-clean upstream, so a `prettier --check` gate would be permanently red for a
reason outside HANGAR's control. A vendored file is never itself formatted.

## Status

Six files are vendored at `a0fb69d5`: the compiler (`_pad.ts`), the simulator (`pad-sim.ts`), the render
loop (`pad-sim-host.ts`) and their three test suites. Measured under HANGAR's own toolchain:
`pad.test.js` 176 tests, `pad-sim.test.js` 96, `pad-invariants.test.js` 9.

2026-09-11, plan 12.1-08b (12.1-CONTEXT D-26 item 2, D-27 "mirror"): sixteen `intendedDivergence` rows
added - eight on `_pad.ts` (the `PadState.touchLibrary` field, `clonePadState`, the `libraryOn` /
`libraryXY` helpers, the comet, per-finger and glow cases of `touchPaint`, `zoneStatements`, the fader
branch of `sendsPaint`) and eight on `pad-sim.ts` (the `libraryBlocks` store and its reset, the same
three `touchPaint` cases, the mirror helpers, `touchZone`, `fadersBody`) - so a state that carries
HANGAR's touch-library knots emits calls into the library (`N`, `K`, `G`) and the simulator mirrors
the same measured map. Every state without the field, the vendored `PRESETS` included, compiles and
simulates byte-identically to before; `pad-sim.ts`'s `ledTick` is untouched (the sha256 of its
extract is equal before and after, recorded in `12.1-08b-SUMMARY.md`); the three test suites are
unedited and at the counts above. The manifest reads 6 files, 38 rows.

The Vitest suite is split into two projects (D-10 fired: the whole run was 39.9 s and
`pad-invariants.test.js` was 38.6 s of it, because its sweep is 4,860 labelled states):

- `npm run test:quick` — the `server` project, every spec except the sweep. Run per task.
- `npm run test:sweep` — the `sweep` project, `pad-invariants.test.js` alone. Run per wave. It is the
  anti-drift mechanism, so it runs less often and never less fully.

Re-sync is on demand (D-03), by following the procedure above — never automatic, never at phase start.
Escalation rule (`.planning/research/ARCHITECTURE.md` §4.2): promote `_pad.ts` + `pad-sim.ts` into a
shared `@zona/pad` package and make both repos consume it only after a sync requires manual conflict
resolution twice in a row, or a third consumer appears. Not before.
