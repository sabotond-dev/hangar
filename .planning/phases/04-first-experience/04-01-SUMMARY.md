---
phase: 04-first-experience
plan: 01
subsystem: identity
tags: [identity, tokens, typography, licensing, favicon, IDENT-01, D-24, W-01, W-02]
requires:
  - "src/lib/catalog/ (Phase 8 plan 08-01) — preflighted present and green, never recreated"
provides:
  - "src/app.css — the eight-token IDENT-01 ladder, two font stacks, the global focus ring"
  - "@fontsource/quicksand@5.3.0 self-hosted, latin 400 + 600, exactly pinned"
  - "OFL-1.1 in scripts/gen-licenses.mjs ALLOWED, with the reasoning in the file"
  - "THIRD-PARTY.md + licenses/@fontsource/quicksand@5.3.0-LICENSE.txt regenerated"
  - "src/lib/assets/favicon.svg — the 9x9 mark, 32x32, 3,651 bytes"
  - "src/lib/ui/identity.spec.ts — 6 tests over the ladder, the contrast floor and the mark"
affects:
  - "Every later Phase 4 plan renders against these tokens and this font"
  - "src/lib/licence-notices.spec.ts test 4 now sees three production dependencies"
  - "src/lib/ui/ exists; plans 04-05 to 04-08 add components beside identity.spec.ts"
tech-stack:
  added:
    - "@fontsource/quicksand 5.3.0 (OFL-1.1), production dependency, exact pin"
  patterns:
    - "Design tokens asserted structurally with comments stripped first, config-shape.spec.ts style"
    - "Contrast recomputed from the declared alpha rather than restated from the spec table"
    - "Values normalised before comparison so the spec encodes the contract, not Prettier's output"
key-files:
  created:
    - src/lib/ui/identity.spec.ts
    - licenses/@fontsource/quicksand@5.3.0-LICENSE.txt
  modified:
    - src/app.css
    - src/lib/assets/favicon.svg
    - scripts/gen-licenses.mjs
    - THIRD-PARTY.md
    - package.json
    - package-lock.json
    - .planning/phases/04-first-experience/04-VALIDATION.md
decisions:
  - "OFL-1.1 accepted into the GPL-compatible allowlist: the fonts ship as separate static woff2 assets and are never linked into the bundle, so this is aggregation beside the GPLv3 work"
  - "The identity spec normalises numbers before comparing, because Prettier rewrites 0.50 to 0.5 in CSS and the spec must encode UI-SPEC rather than the formatter"
  - "The favicon is inlined as a data URI, not emitted as an asset: at 3,651 bytes it sits under Vite's 4,096-byte threshold"
metrics:
  duration: 14 min
  tasks: 3
  files: 9
  completed: 2026-09-04
---

# Phase 4 Plan 01: Identity Foundation Summary

The HANGAR design system is now eight tokens over true black with a spec that goes red on a ninth
token, a third hue or a below-AA text colour; Quicksand ships from `node_modules` behind a
deliberately extended licence allowlist; and the browser tab carries the 9x9 pad instead of the
scaffold's framework logo.

---

## The catalog was found, not created

The preflight ran before anything was written:

```
node -e "...existsSync check on types.ts, index.ts, entries/ported.ts + CATALOG/byId/build..."
catalog module present

npx vitest run --project server src/lib/catalog/catalog.spec.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

Both passed, so the plan proceeded. **`src/lib/catalog/` was found on disk, exactly as Phase 8 plan
08-01 left it. Nothing in this plan created a second catalog**, and `test ! -f
src/lib/catalog/entries.ts` exits 0. Phase 4 consumes the module and does not touch a file 08-01
wrote.

---

## Suite totals — the Phase 4 baseline

**Captured on this machine on 2026-09-04, BEFORE this plan touched anything.** It reproduces
08-01's recorded end state exactly, so nothing landed in the tree in between.

```
npm run test:quick
 Test Files  28 passed (28)
      Tests  468 passed | 1 todo (469)
```

**BASE_FILES = 28**
**BASE_TESTS = 468**
(sweep 1 file / 9 tests; e2e 10 — both carried forward from 08-01 and both re-observed unchanged
below.)

### Totals observed AFTER this plan

```
npm run test:quick
 Test Files  29 passed (29)
      Tests  474 passed | 1 todo (475)

npm run test:sweep
 Test Files  1 passed (1)
      Tests  9 passed (9)

npm run test:e2e
  10 passed (22.4s)
```

Exactly `BASE_FILES + 1` file and `BASE_TESTS + 6` tests — the one new file is
`src/lib/ui/identity.spec.ts` and its six tests. Verified through the helper at each step:

| After task | Command | Result |
|---|---|---|
| 4-01-01 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 29 473` | exit 0 |
| 4-01-02 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 29 473` | exit 0 (no test delta; the font is a dependency change) |
| 4-01-03 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 29 474` | exit 0 |
| plan end | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |

**Plan 04-02 should treat 29 / 474 (quick), 1 / 9 (sweep) and 10 (e2e) as its baseline** — but
should re-measure rather than trust them, because Phase 8 lands specs in the same tree.

---

## Task 4-01-01 — the token ladder

`src/app.css` went from four lines and two placeholder tokens to the whole approved contract: the
eight colour tokens, the two font stacks, and the three global rules (`html`, `body`,
`:focus-visible`). No `prefers-reduced-motion` block was added — motion belongs to the components
that own it, and a blanket `* { animation: none }` would also silence reasoning the pad canvases
need to do per component.

### The three contrast ratios test 2 computed

Composited over `#000000` from the alpha declared in the file and the accent's sRGB, using the
standard relative-luminance formula:

| Token | Alpha | Computed on `#000000` | UI-SPEC says | Floor asserted |
|---|---|---|---|---|
| `--color-ink` | 0.72 | **9.26:1** | 9.3:1 | >= 4.5 |
| `--color-ink-quiet` | 0.55 | **5.57:1** | 5.6:1 | >= 4.5 |
| `--color-ink-dim` | 0.50 | **4.72:1** | 4.7:1 | >= 4.5 |
| `--color-line` | 0.40 | **3.31:1** | 3.3:1 | >= 3.0 |
| `--color-accent` | 1.00 | 18.27:1 | 18.3:1 | — (not a text token) |

Every figure agrees with the approved table to the rounding the table used. The ratios are written
into the assertion messages, so a future token change reports what it actually produced rather than
just failing.

### Negative check — observed red, quoted verbatim

`--color-ink-dim`'s alpha changed from `0.5` to `0.2`. Both files were `git add`ed first. **Two**
tests went red, which is the belt-and-braces the ladder deserves:

```
FAIL  |server| src/lib/ui/identity.spec.ts > IDENT-01 identity tokens (src/app.css) > every text token clears WCAG AA on black
AssertionError: --color-ink-dim is 1.58:1 on #000000: expected 1.5826314482157149 to be greater than or equal to 4.5
```

```
FAIL  |server| src/lib/ui/identity.spec.ts > IDENT-01 identity tokens (src/app.css) > the token ladder is exactly the eight tokens the spec approved
AssertionError: --color-ink-dim carries its approved value: expected 'rgb(214 255 78 / 0.2)' to be 'rgb(214 255 78 / 0.5)' // Object.is equality
```

Restored with `git checkout -- src/app.css`; `git diff --quiet` exited 0 and the spec returned to
5 passed.

---

## Task 4-01-02 — Quicksand through the licence gate

### The version and the faces

**`@fontsource/quicksand@5.3.0`** — the version the UI spec named was published and installed
without substitution. `package.json` records it as `"@fontsource/quicksand": "5.3.0"`, with no range
character; `--save-exact` did its job.

The two faces imported are exactly the ones the plan named, and both exist in the published package:

```
node_modules/@fontsource/quicksand/latin-400.css
node_modules/@fontsource/quicksand/latin-600.css
```

They are imported in `src/app.css` immediately after `@import "tailwindcss";` and before the
`@theme` block, so no rule precedes them. `grep -c 'fontsource/quicksand' src/app.css` prints `2`,
and the file contains no `https?:` — nothing reaches a network origin.

**The build proves the allowlist reasoning rather than just asserting it.** `npm run build` emits
the faces as separate static assets beside the bundle:

```
build/_app/immutable/assets/quicksand-latin-400-normal.BSDtH9U0.woff2
build/_app/immutable/assets/quicksand-latin-400-normal.BqXBKzPR.woff
build/_app/immutable/assets/quicksand-latin-600-normal.DTBPeRoM.woff2
build/_app/immutable/assets/quicksand-latin-600-normal.CkxN0sDw.woff
```

That is aggregation beside the GPLv3 work, not linkage into it — which is the whole argument for the
allowlist extension, now visible in the artefact.

### The licence text really materialised

`licenses/` is written with one scope directory per scoped package, so a flat `readdirSync` cannot
see the font's text. The recursive walk found it:

```
licenses/@fontsource/quicksand@5.3.0-LICENSE.txt
```

whose first line is

```
Copyright 2019 The Quicksand Project Authors (https://github.com/andrew-paglinawan/QuicksandFamily.git), with Reserved Font Name "Quicksand"
```

and which carries the full SIL Open Font License 1.1 text. `THIRD-PARTY.md` names the typeface in
the generated header and in the dependency list:

```
The Quicksand typeface (`@fontsource/quicksand`) is Copyright the Quicksand Project Authors,
designed by Andrew Paglinawan, and is licensed under the SIL Open Font License 1.1. It is
conveyed as separate static font files beside the program rather than linked into it.
...
- [@fontsource/quicksand@5.3.0](https://github.com/fontsource/font-files) — OFL-1.1
```

Nothing was hand-edited into `THIRD-PARTY.md`; the paragraph lives in the `header` array in
`scripts/gen-licenses.mjs` and the file was regenerated. `npm run licenses` now reports **three**
production dependencies where it reported two:

```
gen-licenses: wrote THIRD-PARTY.md and licenses/ for 3 production dependencies (@fontsource/quicksand@5.3.0, @intechstudio/grid-protocol@1.20260825.1135, @wasm-fmt/lua_fmt@0.2.0)
```

### Negative check — the allowlist extension is load-bearing

`"OFL-1.1"` removed from `ALLOWED` (the reasoning comment left in place, so only the entry itself
was gone). `npm run licenses` exited **1**:

```
gen-licenses: @fontsource/quicksand@5.3.0 has licence OFL-1.1 which is outside the GPL-compatible allowlist
gen-licenses: allowlist is [MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, GPL-3.0, GPL-3.0-only, GPL-3.0-or-later]. Remove the dependency or extend the allowlist deliberately.
```

The line names the font package, the licence and the allowlist, exactly as the gate promises.
Restored with `git checkout -- scripts/gen-licenses.mjs` (the file was `git add`ed before the
perturbation), `git diff --quiet` exited 0, and `npm run licenses` went back to exit 0.

### The lockfile

**`package-lock.json` was reformatted by the install, and the reformatted file is committed with the
dependency rather than reverted.** `npm install` on this machine rewrites the whole lockfile's
indentation from tabs to two spaces — Phase 1 recorded the same behaviour. The diff is
**7,007 insertions / 6,994 deletions in one file**, of which the semantic change is the thirteen
lines that add `@fontsource/quicksand` and its entry. `src/lib/licence-notices.spec.ts` test 4 reads
this file on every `npm run test:quick` and stayed green throughout, which is why this plan ran alone
in wave 1.

---

## Task 4-01-03 — the 9x9 mark

`src/lib/assets/favicon.svg` is now a hand-written 32x32 document, **3,651 bytes**:

- `viewBox="0 0 32 32"`, `width="32" height="32"`
- a `#000000` rounded-square ground, `rx="6"`, filling the box
- the pad frame: a `#d6ff4e` outline inset 2px, `rx="5"`, `stroke-width="1.5"`, `fill="none"`
- 81 dots on a 9x9 lattice at pitch 2.75 centred on 16 (cx/cy of 5, 7.75, 10.5, 13.25, 16, 18.75,
  21.5, 24.25, 27), radius 0.9, in one `<g fill="#d6ff4e" fill-opacity=".35">` group — the
  generated-mark alpha the UI spec puts outside the token ladder by design
- five of those cells drawn again at full `#d6ff4e`, radius 1.4, forming the diagonal from the
  top-left cell to the centre
- `<title>HANGAR</title>`

86 `<circle` elements, counted and asserted rather than sampled. No script, no animation: it is a
static document, as an SVG favicon must be.

**The mark is inlined, not emitted as an asset.** At 3,651 bytes it sits under Vite's 4,096-byte
inline threshold, so `build/index.html` carries it as a `data:image/svg+xml,...` URI on the
`<link rel="icon">`. The acceptance probe against `build/index.html` passed: no `svelte-logo`, and
`%23d6ff4e` present. Source-level test 6 covers the mark either way, so this stays true if the mark
ever grows past 4 KB and Vite starts emitting a file instead. `04-VALIDATION.md`'s 4-01-03 row was
corrected to say this rather than "a favicon asset emitted".

### Negative check — observed red

The framework logo restored from git into the path (`git show HEAD:src/lib/assets/favicon.svg`), the
new mark having been `git add`ed first:

```
FAIL  |server| src/lib/ui/identity.spec.ts > IDENT-01 identity tokens (src/app.css) > the favicon is the 9x9 mark, not a framework logo
AssertionError: the favicon names no framework: expected '<svg xmlns="http://www.w3.org/2000/sv…' not to match /svelte/i
```

Restored with `git checkout --`; `git diff --quiet` exited 0 and the spec returned to 6 passed.

---

## Verification

| Check | Result |
|---|---|
| Preflight: catalog module present | `catalog module present` |
| Preflight: `catalog.spec.ts` | 1 file, **10 passed** |
| `npx vitest run --project server src/lib/ui/identity.spec.ts` | 1 file, **6 passed** |
| All ten tokens declared in `src/app.css` | exit 0 |
| No second catalog (`test ! -f src/lib/catalog/entries.ts`) | exit 0 |
| `npm run licenses` | exit 0, three production dependencies |
| `grep -q '"OFL-1.1"' scripts/gen-licenses.mjs` | exit 0 |
| `grep -qi quicksand THIRD-PARTY.md` | exit 0 |
| Recursive walk of `licenses/` for the font text | `@fontsource/quicksand@5.3.0-LICENSE.txt` |
| Exact pin, no range character | `5.3.0` |
| `grep -c 'fontsource/quicksand' src/app.css` | `2` |
| No network origin in `src/app.css` | exit 0 |
| `npx vitest run --project server src/lib/licence-notices.spec.ts` | 1 file, **7 passed** |
| `npm run build` | exit 0; `build/THIRD-PARTY.md` present |
| Built page carries the mark, not the framework logo | exit 0 |
| 86 circles, no framework string in the favicon | exit 0 |
| `npm run test:quick` through the helper at 29 / 474 | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `npm run test:e2e` | **10 passed** (22.4s), unchanged |
| `npm run check` | 391 files, **0 errors**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts` | 1 file, **14 passed** |
| Port 4173 free before and after the e2e run; no `wrangler`/`workerd` left | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The plan's literal token values are unrepresentable after Prettier**

- **Found during:** Task 4-01-01.
- **Issue:** The plan and the UI spec write the ladder's alphas as `0.50`, `0.40` and `0.20`, and
  test 1 was specified as "assert the stripped CSS contains `--name: value;`". Prettier's CSS
  printer normalises numbers and strips trailing zeros, so `npm run lint` requires the file to say
  `0.5`, `0.4` and `0.2`. A literal substring assertion against the spec's own table could therefore
  never pass on a file that also passes lint.
- **Fix:** `TOKENS` in `identity.spec.ts` still holds the **approved** values verbatim from
  04-UI-SPEC (`0.50`, `0.40`, `0.20`), and both sides are put through a `normalise()` helper —
  collapsed whitespace plus canonical number formatting — before comparison. The spec therefore
  encodes the design contract rather than the formatter's output, and it still catches a real change
  (the negative check proved it: `0.2` vs `0.5` reported as a mismatch).
- **Files modified:** `src/lib/ui/identity.spec.ts`
- **Commit:** `39b102a`

**2. [Rule 2 - Correctness] `04-VALIDATION.md`'s 4-01-03 expectation was factually wrong**

- **Found during:** Task 4-01-03.
- **Issue:** The per-task table expected "a favicon asset emitted". The plan's own acceptance
  criterion for the same task says the opposite and explains why: a 3,651-byte SVG is under Vite's
  4,096-byte threshold and is inlined into `build/index.html` as a data URI, so
  `build/_app/immutable/assets/` never receives it. A verifier reading only the table would have
  looked for a file that correctly does not exist. The document's own rule is that a stale
  expectation is worse than none.
- **Fix:** The cell now states what the build does, with the observed byte count.
- **Files modified:** `.planning/phases/04-first-experience/04-VALIDATION.md`
- **Commit:** `41897ee`

### Observations, not deviations

- **`npm run check` is piped, so it prints `0 ERRORS` in capitals.** Every check in this plan used
  `grep -Ei`, as 08-01's note advised. Kept for later plans.
- **The negative check on the token ladder turns two tests red, not one.** The plan predicted test 2.
  Test 1 also fires because it compares the declared value against the approved one. Both are
  recorded above; the extra failure is the ladder catching the same lie twice, which is a stronger
  gate rather than a surprise.
- **Prettier does not format `.svg`**, so the mark ships exactly as generated and `npm run lint`
  passes over it untouched.

---

## Notes for later plans

- **Baseline for 04-02: quick 29 / 474 (plus the one pre-existing todo), sweep 1 / 9, e2e 10.**
  Re-measure before applying a delta; Phase 8 shares this tree.
- **The tokens are Tailwind v4 `@theme` entries**, so they are available both as
  `var(--color-ink-quiet)` and as utilities (`text-ink-quiet`, `border-line`, and so on). There is no
  Tailwind config file and none should be created.
- **`identity.spec.ts` fails on a ninth `--color-` token in the `@theme` block.** A component that
  needs a new surface colour must argue for it in the UI spec first, then add it to `TOKENS`.
- **The accent is reserved** (UI-SPEC Color): wordmark, name-plate triangles, the primary fill, the
  focus ring, the walking cell. Never body text, never a border, never a disabled control.
- **`src/lib/ui/` now exists** and holds one spec. Wave 4 onward add `.svelte` components beside it;
  note that no `.svelte.spec.ts` is collected by any Vitest project in this repository, so a
  component test written there would be green and vacuous.
- **The font is a production dependency.** Any future `npm install` in this tree will reformat
  `package-lock.json` again; commit it with whatever change caused it rather than reverting.

## Requirements

`requirements: [IDENT-01, CAT-04, CONT-01]` in the plan frontmatter is phase-level attribution.
None of the three is complete after this plan, and none is marked:

- **IDENT-01** ("the site reads as HANGAR: black, acid lime, the 9x9 motif as logo and loading
  state") has its **tokens and its mark** here, but the wordmark, the glyph field, the loading motif
  and every surface that renders in these colours arrive in plans 04-06 to 04-08.
- **CAT-04** and **CONT-01** were touched only by the preflight, which proved the catalog module
  exists. Plan 04-02 builds the front-door row on it; that is where they can honestly be assessed.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All seven claimed files exist on disk and all three claimed commits are in the history
(`39b102a`, `f97ef18`, `41897ee`).
