# Code style: comments, headers and the refactor gate

Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

The rule for what a source file says about itself, written once (Phase 13.2, 2026-09-13; the
decisions are `.planning/phases/13.2-readability/13.2-CONTEXT.md` D-01 to D-07) so every later plan
can point at it. It applies to everything under `src/` outside the refuse-list in section 6 - `.ts`,
`.svelte.ts`, `.svelte` and `.spec.ts` files alike. The history a comment used to carry is not lost:
it lives in the plan SUMMARYs under `.planning/`, and a pointer is how a comment reaches it.

## 1. The header: at most ten lines

A header says three things and no more: **what the module is, what it owns, and how it is used.**
It is at most **ten comment lines** of text, not counting the copyright line (which stays, and is the
header's last line), the one provenance line of section 2, or a bare `//` separator and the `/**` `*/`
fences of a block comment. Section headings, ASCII rules,
dated "IT WAS N UNTIL PLAN …" paragraphs and the alternative that lost are not header material.

A header from this rule's first plan (`src/lib/browse/grid.ts`):

```ts
// The browse grid's arithmetic: how many columns, and where an arrow key goes.
//
// Imports nothing - every input is a number, so grid.spec.ts pins the whole
// keyboard model in node with no DOM (the house pattern: arithmetic written
// inside a .svelte file would be untested and would look tested).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
```

The mechanical test is `node scripts/gate/comment-lines.mjs --todo <paths…>`: it prints every file
whose leading comment run, less the copyright line and one provenance line, exceeds ten. A file it
does not print is at the rule.

## 2. Provenance: one line, one pointer

Where a header or a section carries a decision, it says so in one line, in this format and no other:

```ts
// Decided at 13-12 (D-06); see .planning/phases/13-gui-overhaul/13-12-SUMMARY.md
```

At most one per header and one per section. The plan id and the decision id are the pointer; the
argument, the measurement and the alternative are in the SUMMARY the line names. A `// Decided at`
line is the one line `comment-lines.mjs --todo` does not count against the ten.

## 3. Body comments: the fact, not the argument

The pattern a body comment must not have: a fact, then the alternative, then why the alternative
lost, then the plan that measured it. **Keep the fact; cut the argument; point at the plan.** A rule
the file obeys because a spec enforces it stays as one line and says which spec.

The worked example, `src/lib/device/session.svelte.ts`'s `#started` field. The comment used to carry
twelve lines: the two call sites with their plan ids, and a paragraph arguing that an instance field
beats a module-scope flag because a shared flag would leave the second test in `session.spec.ts`
asserting against a session that never attached a listener. What the rule keeps is the fact (the
edit is 13.2-04's):

```ts
/**
 * start() runs once per instance; a second call attaches nothing.
 * Per instance: every test constructs its own session.
 */
#started = false;
```

The module-scope-flag argument is in 06-06's and 06-09's SUMMARYs. The test that would catch a
regression is still there, which is why the argument does not need to be.

Measured figures a spec asserts stay where the spec reads them (the five firmware defaults' lengths in
`protocol/constants.ts`, the firmware `file:line` citations in `fidelity/firmware-oracle.ts`); a
figure nobody asserts leaves with its paragraph.

## 4. A catalog entry: three headings

A hand-authored entry under `src/lib/catalog/entries/` keeps its design narrative under exactly three
headings - `MECHANISM`, `WHAT IT SENDS`, `TRAPS` - because they are what the next editor of the
string needs. The costings, the bench verdicts, the re-cut history and the "why not the other shape"
paragraphs live in `docs/entries/<id>.md`, one file per entry, and the entry's header ends with one
pointer to that file. The `SETUP` and `TIMER` strings are never edited by a readability plan (section
6); `hash-wire --full` before and after is the proof.

## 5. `.svelte` files

Three places a `.svelte` file carries comments, all under the same rule: the `<!-- -->` block before
`<script>` (the header - the ten-line rule counts it together with the leading comment inside
`<script>`), the comments in the script body (section 3), and comments inside `<style>` (Vite strips
them from the built CSS; they follow section 3 all the same).

Two things a readability edit may never do to a `.svelte` file: **rename or move it** (Svelte hashes
the filename into every scoped class, so the built CSS moves, and specs read components by path), and
**move a rule between components** (the same reason; a rule that moves is a design change, not a
readability one).

## 6. The refuse-list (13.2-CONTEXT D-06), absolute

No readability plan touches:

| Refused                                                                                                                                                                                                                                                | Proved by                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `src/vendor/`                                                                                                                                                                                                                                          | `git diff --stat` in the gate; `vendored-diff.spec.ts` |
| every Lua literal: the library's two halves and every `LIBRARY_PARTS` row, every entry's `SETUP` / `TIMER`, every preset's compiled output, `sandbox/runtime.ts`'s `STATE / RELEASE / ENTRY / BRANCH_TEXT` and `emit.ts`'s templates                   | `hash-wire` set and `--full`                           |
| `src/lib/fidelity/upstream-manifest.json`                                                                                                                                                                                                              | `git diff --stat`; `vendored-diff.spec.ts`             |
| the fixtures and the OG images: `frames.json`, `golden-frames.json`, `preset-baseline.json`, `synthetic-zona.json`, `static/og/`                                                                                                                       | `git status` after the build; `git hash-object`        |
| `CIRCLES` in `ui/radius-allowlist.ts` and the two circle files, `Knob.svelte` and `ColourPicker.svelte`                                                                                                                                                | `git diff --stat`; `radius.spec.ts` layer A            |
| every persisted key and field: `hangar.*.v1`, `hangar.snapshot.v4` and the readable older keys, `hangar:browse-return`, `system / systemTimer / systemUtility / setup / timer / page / v`, `EXPORT_APP`, `SCHEMA_VERSION`, the stamp letters `w x y z` | the literal census; the fixtures the specs write       |
| every user-facing literal and every `data-testid`                                                                                                                                                                                                      | the literal census; the testid hash                    |
| every test title and every `describe`                                                                                                                                                                                                                  | the titles hash; `check-counts.mjs`                    |
| every `.svelte` filename                                                                                                                                                                                                                               | the scoped CSS hash; `git diff --name-status`          |
| a new spec file (unless a dead export leaves with its spec, named)                                                                                                                                                                                     | `check-counts.mjs`'s files term                        |

Two more rules the specs enforce on comments: a comment under `src/lib/**/*.ts` never spells the two
erase / clear instruction names or the two page classes outside `protocol/descriptors.ts`
(`forbidden-instructions.spec.ts` scans raw source, comments included - use the event numbers); and
the tree's `strip`-style needles read some comments as text (`sandbox-ui.spec.ts` reads `history.ts`'s
headings; `presets.spec.ts` reads its own header) - a plan names each such pin before it edits.

## 7. The gate

Every readability plan is bracketed by `scripts/13.2-gate.sh`:

```
bash scripts/13.2-gate.sh --before <tag>
bash scripts/13.2-gate.sh --after <tag> --against <tag> --check <n> [--js-equal]
```

`--before` runs before the plan's first edit and records; `--after` runs after its last source
commit and compares, exiting 1 on the first inequality with the term named. The records go under
`.planning/phases/13.2-readability/gate/` (`<tag>.txt` is what the SUMMARY pastes; `<tag>-after.txt`
its pair). A `--before` record is never rewritten - the script exits 2 when `gate/<tag>.wire.json`
exists - because plan 01's record is the phase baseline the phase gate compares against.

What it holds: the wire (every Lua string HANGAR can put on a ZONA, set and `--full`); the literal
census, the copy modules' export lists and the `data-testid` values; svelte-check at `--check <n>`;
lint; the quick suite through `check-counts.mjs 94 966`; the build; the fixtures and the OG bytes;
the built CSS scoped past the two Tailwind layers (section 8) with every utility that appeared or
disappeared printed by name; the sorted test titles; the name-status of `src/` (no rename, no
deletion); the normalised built JS (asserted equal under `--js-equal` on a comments-only plan). The
sweep and the e2e chunks run beside it where 13.2-CONTEXT D-18 says.

The proof that a helper swap changed no behaviour is the same shape as `strip-variants.mjs`'s: apply
the old and the new function to every input the specs feed them and print `equal` or `DIFFERS` per
file, before the swap, in the log.

## 8. A comment must not introduce a word shaped like a Tailwind utility

`src/app.css:1` is `@import "tailwindcss" source(".")`: Tailwind v4's scanner reads every file under
`src/` - `.ts`, `.svelte`, `.spec.ts`, comments included - and emits a utility rule for every token
that spells one. 13-01 learned this the hard way (`rounded-md` in a planning document put a corner in
the production stylesheet; `app.css`'s `@source not inline(…)` refuses that one family by name). So a
word such as `row-0`, `ring-4`, `ordinal`, `truncate`, `shadow`, `container`, `filter`, `invert` in a
comment emits a rule nobody uses. Measured at the start of Phase 13.2: 45 utilities in the built CSS,
5 named by markup (`block grid outline ring sr-only`), 40 from comment and spec vocabulary.

The gate's CSS term hashes the stylesheets with the `@layer properties` and `@layer utilities`
blocks removed - that hash must be equal after every plan - and prints every utility that appears or
disappears by name. A comment cut may make a utility disappear (right: it was never used); **a comment
that adds one is reworded.** The classes the markup names are asserted still emitted.

## 9. Appended

Later plans add a dated line here only when the rule learned something it did not say.

- 2026-09-13 (13.2-02): a catalog entry's `MECHANISM / WHAT IT SENDS / TRAPS` block is not counted
  against the ten - `comment-lines.mjs --todo` stops at the `MECHANISM` heading - and a trap
  paragraph is kept whole; `library.ts` keeps its numbered section banners as a table of contents
  because other files cite them by number, so `--todo` prints it by construction.
