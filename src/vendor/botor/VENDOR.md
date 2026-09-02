# Vendored BOTOR sources

Everything under `src/vendor/botor/` is copied from `github.com/intechstudio/grid-editor` (branch
`redesign`), is licensed under the GNU GPL v3 or later, and keeps Intech Studio's original file headers
intact. The directory is excluded from HANGAR's Prettier run (`.prettierignore`) and from its ESLint run
(`eslint.config.js`) so that a re-sync against upstream diffs cleanly instead of showing every line
rewritten. Do not format, lint-fix, rename or reorder anything in here.

Direction of flow is one-way: BOTOR → HANGAR. HANGAR-authored content never lands in a vendored file.

## Upstream

- Repository: `https://github.com/intechstudio/grid-editor`
- Branch: `redesign`
- Recorded upstream SHA: TBD (Phase 3)

## Vendored files

| HANGAR path | BOTOR path | Upstream SHA | Last synced | Local modifications |
| ----------- | ---------- | ------------ | ----------- | ------------------- |

## Per-file header template

GPLv3 §5(a) requires "prominent notices stating that you modified it, and giving a relevant date", and
§5(b) requires the licence notice. Every vendored file is stamped with this block, verbatim, above the
original Intech header:

```
// Vendored from intechstudio/grid-editor
//   path:   <BOTOR path>
//   commit: <upstream SHA>
//   synced: <YYYY-MM-DD>
// Modified for HANGAR: <one line, or "import paths only">
// Original copyright and licence (GNU GPL v3 or later) retained below.
```

## Sync procedure

1. Record the upstream SHA: `git -C ../grid-editor rev-parse HEAD`.
   **Read-only. Never run a git command that writes in a sibling repository** — no checkout, no stash,
   no clean, no commit, no restore. The sibling working tree must be byte-identical before and after.
2. Copy the file into `src/vendor/botor/`.
3. Rewrite import paths only. No formatting, no lint fixes, no renames, no reordering.
4. Update the per-file header block with the path, SHA, date and the one-line modification note.
5. Update this file's `## Vendored files` table row.
6. Run the vendored test suite.
7. Run the fidelity oracle.
8. Run `npx prettier --check --ignore-path .prettierignore <copied file>` to confirm the file still
   formats clean under HANGAR's config. `src/lib/format-parity.spec.ts` is the standing canary for this
   (D-15); this step is the per-file confirmation.

## Status

This directory is intentionally empty in Phase 1 — `VENDOR.md` is what makes it exist, since git does
not track empty directories. Phase 3 (FOUND-02) copies the files in and fills the table above.
