---
phase: 10-redesign
plan: 02
subsystem: ui
tags:
  [
    typography,
    inter,
    grifter,
    licensing,
    gitattributes,
    source-archive,
    identity-gate,
    crt,
  ]

requires:
  - phase: 10-redesign
    plan: 01
    provides: FONT_SRC candidate (b) proved at src/app.css's own depth, and font-assets.spec.ts's five tests written to take one allowlist row unchanged
provides:
  - "src/app.css with two @font-face blocks, --font-display, --font-sans retargeted to Inter Variable, and --crt-scanline at :root outside @theme"
  - "identity.spec.ts at 7 tests - the ninth token still ninth, the widened rgb() regex, and --font-display equal to EVERY display @font-face family"
  - "static/fonts/GRIFTER-Bold.woff2 served from the site, export-ignored from the archive, with static/fonts/README.md standing in its place"
  - "deploy.mjs step 5 checking the archive from both sides - no font binary AND the note present"
  - "PREV_FILES 76, PREV_TESTS 787, PREV_E2E 89, PREV_CHECK 571 - the carry-forward pair for 10-03 onward"
affects: [10-03, 10-04, 10-05, 10-09, 10-12, 10-13, 10-14, typography, licensing]

tech-stack:
  added: []
  removed: ["@fontsource/quicksand@5.3.0"]
  patterns:
    - "A swappable asset is reachable through ONE custom property and ONE declaration block, and a test asserts the two agree - so a licence answer changing is a token edit, not a hunt"
    - "A record that duplicates a fact a test already reads from a file is worse than no record: the exclusion is asserted, not declared"
    - "An archive exclusion is checked from BOTH sides - the thing absent and its replacement present - because a one-sided check goes green on a build that dropped both"

key-files:
  created:
    - static/fonts/GRIFTER-Bold.woff2
    - static/fonts/README.md
    - .planning/phases/10-redesign/deferred-items.md
  modified:
    - src/app.css
    - .gitattributes
    - src/lib/ui/identity.spec.ts
    - src/lib/ui/font-assets.spec.ts
    - scripts/gen-licenses.mjs
    - scripts/deploy.mjs
    - package.json
    - package-lock.json
    - THIRD-PARTY.md
  deleted:
    - licenses/@fontsource/quicksand@5.3.0-LICENSE.txt

key-decisions:
  - "The allowlist row carries NO exportIgnored field. The plan's draft row has one; it would be a second source of truth for a fact test 4 already reads out of .gitattributes"
  - "The archive half of the D-13 negative check was exercised by procedure (a) - a scratch commit, a build, the listing, then git reset --hard - because git archive HEAD reads .gitattributes from HEAD and a no-commit procedure proves the opposite of what it claims"
  - "gen-licenses.mjs:41's SPDX allowlist was NOT touched. OFL-1.1 is already there for Inter, and Grifter has no SPDX identifier by design"
  - "The A-02 reversal is EIGHT edits, not seven: deploy.mjs step 5's note-present predicate has to go with the note, or every deploy refuses"

requirements-extended: [IDENT-01, FOUND-02]
requirements-completed: []

duration: 18min
completed: 2026-09-08
---

# Phase 10 Plan 02: The type settlement Summary

**Two faces ship, the display one behind a single token and a single `@font-face` block that a test
asserts agree; the Grifter binary is served 200 from `/fonts/` and is absent from the source archive
with its note standing in its place, proved from both sides on real listings; and the identity gate
widened in exactly three ways with all four of its non-changes observed.**

## Performance

- **Duration:** ~18 min (2026-09-08T09:52:11Z → 2026-09-08T10:09:44Z)
- **Tasks:** 3
- **Files created:** 3 · **Files modified:** 9 · **Files deleted:** 1

---

## THE ELEVEN-NAME BLOCK, CARRIED AND UPDATED

Stated as 10-01's carried name plus this plan's delta, never as a bare total.

| Name              | 10-01 left it        | 10-02 delta | 10-02 leaves it        | How it was taken                                             |
| ----------------- | -------------------- | ----------- | ---------------------- | ------------------------------------------------------------ |
| `BASE_FILES`      | **74**               | frozen      | **74**                 | frozen at 09's clean tree; never re-measured                 |
| `BASE_TESTS`      | **780** (+1 todo)    | frozen      | **780**                | frozen                                                       |
| `PREV_FILES`      | **76**               | **+0**      | **76**                 | `npm run test:quick`, 30.06 s wall                           |
| `PREV_TESTS`      | **786**              | **+1**      | **787** (+1 todo)      | same run; `identity.spec.ts` 6 → 7                           |
| `BASE_SWEEP`      | **`4 19`**           | untouched   | **`4 19`**             | not re-run; this plan touches no sweep member                |
| `BASE_SWEEP_WALL` | **123 s**            | untouched   | **123 s**              | not re-run                                                   |
| `PREV_SWEEP_WALL` | **123 s**            | untouched   | **123 s**              | not re-run                                                   |
| `BASE_E2E`        | **89**               | frozen      | **89**                 | frozen                                                       |
| `PREV_E2E`        | **89**               | **+0**      | **89**                 | `npx playwright test --workers 3`, **89 passed, 1.6 min**    |
| `BASE_CHECK`      | 567 → **571**        | **+0**      | **571** (0 / 0)        | `COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `CH_PER_LINE`     | **43**               | not spent   | **43**                 | 10-03's to spend, not this plan's                            |
| `FONT_SRC`        | candidate **(b)**    | shipped     | shipped verbatim       | pasted, not re-derived — the string is below                 |

**The arithmetic, written out:** `PREV_FILES 76 + 0 = 76`. `PREV_TESTS 786 + 1 = 787`. Observed:
`Test Files 76 passed (76)`, `Tests 787 passed | 1 todo (788)`, and `scripts/check-counts.mjs 76 787`
printed *"observed 76 files, 787 tests passed, 1 todo … matches the expected counts"*. That is
10-VALIDATION's stated delta for this plan — **+0 files / +1 test** — met exactly.

**`PREV_E2E` re-measured rather than assumed.** This plan changes the body face of every sentence on
the site, and Inter is 2.35 % wider than Quicksand, so a layout assertion could plausibly have moved.
It did not: **89 passed** in both projects at `--workers 3`. `BASE_E2E + 0` still holds and 10-03 can
carry 89.

---

## `FONT_SRC` as shipped, and both font assets by byte size

The string in `src/app.css`, pasted from 10-01 and not re-derived:

```css
src: url("../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
  format("woff2-variations");
```

with 10-01's valid `unicode-range` list beneath it. Prettier reflowed the list's line breaks (`U+2212`
moved up a line); no range changed.

| Asset | On disk | In `build/` | Served by `wrangler dev` on `./build` |
| ----- | ------- | ----------- | -------------------------------------- |
| Inter Variable | `node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2` — **48,256 B** | `build/_app/immutable/assets/inter-latin-wght-normal.Dx4kXJAl.woff2` — **48,256 B** | `200` / `font/woff2` / **48,256 B** |
| Grifter Bold | `static/fonts/GRIFTER-Bold.woff2` — **13,752 B** | `build/fonts/GRIFTER-Bold.woff2` — **13,752 B** | `200` / `font/woff2` / **13,752 B** |

The copy is byte-identical to the read-only sibling and to the bytes the server returned:
`sha256 dcba1340532cec76cf1e4ce57bc4c60d7a6ffb19301c4c80a51ed28280aad1bc` at
`C:\Users\sabot\Documents\Claude\gridstrument-landing\fonts\grifter\GRIFTER-Bold.woff2`, at
`static/fonts/GRIFTER-Bold.woff2`, and on the response body. **Nothing was written into the sibling.**

A neighbouring bad path was fetched as a control: `/fonts/GRIFTER-Bold-nope.woff2` → **404**. The
server is not blanket-200ing.

### One thing Vite did that the spec does not predict, and it is worth recording

§5.1 writes the Grifter `src` as a root-absolute `url("/fonts/GRIFTER-Bold.woff2")`. Vite **rewrote
it** into a stylesheet-relative form in the built CSS:

```
build/_app/immutable/assets/0.BGFH1MZL.css:url(../../../fonts/GRIFTER-Bold.woff2)
build/_app/immutable/assets/0.BGFH1MZL.css:url(./inter-latin-wght-normal.Dx4kXJAl.woff2)
```

`../../../fonts/` from `_app/immutable/assets/` resolves to `build/fonts/`, and CSS `url()` resolves
against the **stylesheet**, not the document, so it is correct at every route depth. It served 200.
Recorded because someone grepping the built CSS for the literal `/fonts/` string will not find it, and
would be right to worry until they read this.

---

## The archive, listed rather than asserted

`scripts/postbuild.mjs:82-89` writes the tarball with `git archive HEAD`. The listing at the delivered
commit `209c236`, filtered to font-shaped lines:

```
$ tar -tzf build/source-209c236a260d78d49e0d2c5c0833c9a49faad34d.tar.gz | grep -Ei "woff|fonts/"
hangar-209c236/static/fonts/
hangar-209c236/static/fonts/README.md
```

**334 entries, 1,230 KB.** The binary is absent; the note is present. That is D-13 working, observed.

### The correction to §16 and §18, recorded as the plan asks

The archive is written by **`scripts/postbuild.mjs`**, not by `deploy.mjs`. `deploy.mjs` step 5 is
where it is **verified**. §18's phrasing — *"excluded from `scripts/deploy.mjs`'s archive"* — names the
wrong file, and the difference is load-bearing rather than pedantic: `git archive HEAD` reads
`.gitattributes` **from HEAD**, so an edit to the working tree cannot change what the archive holds.
That fact dictated the negative-check procedure below and is now written into step 5's own comment.

---

## G-01 — the four negative checks, with their messages

Three planted, one deliberately green. Every perturbation reverted with `git checkout --`, confirmed
with `git diff --quiet`, and the file's sha256 stated before and after.

| # | Perturbation | Test | Result | Message |
| - | ------------ | ---- | ------ | ------- |
| 1 | `--font-display`'s first family → `"Archivo"`, the `@font-face` left at `"Grifter"` | test 7 | **red** (1 failed, 6 passed) | *"every display @font-face is the family --font-display names, and \"Grifter\" is not \"Archivo\": expected '\"Grifter\"' to be '\"Archivo\"'"* |
| 2 | `--color-crt: rgb(0 0 0 / 0.5);` added **inside** `@theme` | test 1 | **red** (1 failed, 6 passed) | *"expected [ '--color-accent', …(9) ] to deeply equal [ '--color-accent', …(8) ]"* |
| 3 | `--crt-ground: #0a0a0b;` added (the ZONA landing's ground, Open item 4) | test 5 | **red** (1 failed, 6 passed) | *"#0a0a0b is one of the three approved colours: expected '#0a0a0b' to match /^(#000000\|#d6ff4e\|#ff3b30)$/"* |
| 4 | `--crt-scanline` moved out of `app.css` into `PadFrame.svelte`'s `<style>` | `identity.spec.ts` | **GREEN, 7 passed** — and that is the finding | no message; `aesthetic.spec.ts` was green too |

**Check 1 is the one that matters.** It is what makes the D-14 licence answer a two-line edit instead
of a hunt through thirty components for a family name, and it names *both* strings so the fix is
obvious from the failure alone.

**Check 2 is the proof that the widening did not widen the ladder.** `rgb(0 0 0 / 0.5)` is now a
permitted *literal* anywhere in the file, and it is still **not** a permitted *token*. Test 5 stayed
green while test 1 went red — which is exactly the separation §7.1 asks for.

**Check 4's green result, recorded as §7.1 predicts.** With `--crt-scanline` deleted from `app.css`
and declared instead on `.frame` inside `PadFrame.svelte`'s `<style>`, `identity.spec.ts` passes all
seven and `aesthetic.spec.ts` passes its one scan. A gate that reads one file cannot see a colour
written into a component; that is the silent-green hole the placement rule exists to close, and it is
why the value lives in `app.css` rather than beside the rule that uses it.

**A correction to 10-VALIDATION:486.** That row expects *"`identity.spec.ts` green and
`aesthetic.spec.ts` **red**"*. `aesthetic.spec.ts` is **green** today, because it carries only scan 4
over `Coverflow.svelte`; the scans that would catch a colour authored in a component arrive in **10-04**
(scans 1, 2, 3, 5, 6, 7). The register row describes the post-10-04 state, not this one. **10-04 should
add a component-`<style>` colour scan and re-run this exact perturbation** — until it does, the hole is
open and only the convention closes it.

### The four non-changes, restated

The ladder is still nine (check 2 red on a tenth). The hex set is still three (check 3 red on a
fourth). `alphaOf()`'s AA loop keeps its four members — `rgb(0 0 0 / 0.5)` is not an alpha of the
accent, so it never enters that loop, and the loop's four `expect`s still run on ink, ink-quiet,
ink-dim and line. The favicon's own two-hue regex is untouched: no black and no red enters the mark.

### Test 7's wording, and why it is that wording

`--font-display` is asserted equal to the `font-family` of **every** display `@font-face` in the file —
not "the second one". That survives the D-14 route the site ships (one Grifter face), the A-02 reversal
(one Archivo face) and any later two-face arrangement, without the test itself being rewritten. The
body face is identified by matching `--font-sans`'s first family, and the test also asserts the body
face is declared, so a file that lost its Inter block is red too.

---

## The font-asset gate's two negative checks

| # | Perturbation | Test | Result | Message |
| - | ------------ | ---- | ------ | ------- |
| A | the `export-ignore` line removed from `.gitattributes` | test 4 | **red** (1 failed, 4 passed) | *"every allowlisted font is export-ignored, so the record and the exclusion cannot drift apart. Missing an `<path> export-ignore` line in .gitattributes for one of: static/fonts/GRIFTER-Bold.woff2."* |
| B | the row's `licence` changed to `"OFL-1.1"` | test 3 | **red** (1 failed, 4 passed) | *"static/fonts/GRIFTER-Bold.woff2 records \"OFL-1.1\", which is SPDX-shaped. A font recorded here is one we serve and do NOT redistribute, so an SPDX identifier would claim a permission D-13 says we may not have. Write the licence's own name."* |

`.gitattributes` restored: `sha256 f66b9a3c81c6567fc9edfad420114f5f97b1d282978aa3ba4702793d8e3371bf`
before and after, `git diff --quiet` exit 0. `font-assets.spec.ts` restored by inverse edit (it was
uncommitted at the time, so `git checkout --` would have taken the whole task with it):
`sha256 928a99ef352ba17ee7db2265d091310d4ba46b6a23ff5fc413412541f3b82f08` before and after, and
**5 passed** on the re-run.

### The archive half: procedure (a), and it was actually run

**Chosen and executed: (a) — scratch commit, build, list, `git reset --hard`, rebuild.** Procedure (b)
(not exercising it at all) was available and was declined, because the two-sided check in `deploy.mjs`
is this plan's own new code and shipping it unwatched would be the same class of mistake it exists to
prevent.

The tree was clean and `209c236` recorded before anything was committed. Then:

```
$ git commit -m "SCRATCH: negative check for D-13, to be reset" --only -- .gitattributes
[master bf20d13] 1 file changed, 1 deletion(-)
$ npm run build
postbuild: bf20d13… source-bf20d13….tar.gz is 1246 KB
$ tar -tzf build/source-bf20d13*.tar.gz | grep -Ei "woff|fonts/"
hangar-bf20d13/static/fonts/
hangar-bf20d13/static/fonts/GRIFTER-Bold.woff2      <-- the binary, PRESENT
hangar-bf20d13/static/fonts/README.md
```

**335 entries and 1,246 KB against the real archive's 334 and 1,230 KB.** Feeding that listing through
step 5's own predicates, copied verbatim out of `deploy.mjs`: `fonts.length` **1**, verdict **REFUSE**,
message *"deploy: source-bf20d13….tar.gz carries a font binary we may not redistribute:
hangar-bf20d13/static/fonts/GRIFTER-Bold.woff2 — D-13 says it is served, not shipped. Check the
export-ignore line in .gitattributes is committed."*

Restored: `git reset --hard 209c236a260d78d49e0d2c5c0833c9a49faad34d`, `git log --oneline -1` back at
`209c236`, `git status --porcelain` empty, `.gitattributes` at
`sha256 f66b9a3c81c6567fc9edfad420114f5f97b1d282978aa3ba4702793d8e3371bf` with the `export-ignore` line
at line 14, and `npm run build` re-run so `build/` holds the real archive again.

**The note-present half was exercised too**, on the real listing with the note's own line filtered out
— `hasFontNote` reads only the listing, so that is the predicate itself and not a simulation of it:
333 entries, `hasFontNote` **false**, verdict **REFUSE**, message *"deploy: … carries no
static/fonts/README.md — the note that stands in the archive where the excluded font binary does not.
Without it the archive is a weaker Corresponding Source, not a stronger one."*

**And the positive direction, on the delivered archive:** 334 entries, `fonts.length` 0, `hasFontNote`
true, `hasLockfile` true, `leaked` 0, verdict **PASS**. `npm run deploy` was **not** run by any agent.

---

## The licence pipeline

`npm rm @fontsource/quicksand` — `node_modules/@fontsource/` is gone entirely and `package.json`'s
`dependencies` is down to four. `npm run licenses` exit 0:

```
gen-licenses: wrote THIRD-PARTY.md and licenses/ for 5 production dependencies
(@fontsource-variable/inter@5.3.0, @intechstudio/grid-protocol@1.20260825.1135,
 @types/emscripten@1.39.10, @wasm-fmt/lua_fmt@0.2.0, wasmoon@1.16.0)
```

`licenses/@fontsource/quicksand@5.3.0-LICENSE.txt` is gone (the `rmSync` at `:191-192` did it in one
rerun); `licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt` is there;
`grep -c -i quicksand THIRD-PARTY.md` returns **0**; and THIRD-PARTY.md now names Inter at line 17 and
Grifter at lines 21 and 26.

**`gen-licenses.mjs:41`'s SPDX allowlist was NOT touched, and that is a decision rather than an
oversight.** `OFL-1.1` is already in it for Inter, and Grifter has no SPDX identifier by design — its
record is family, licensee and licence name, in prose, with no `licenses/` file. That allowlist's own
contract, written in its own comment, is that it is extended deliberately in a commit with a reason; a
silent addition here would be exactly the wrong precedent.

**Quicksand's survivors in `src/`, checked and left alone:** thirteen prose mentions in component
header comments (`BudgetMeter`, `KnobRack`, `TuningRegion`, `DeviceSlot`, `BrowseToolbar`,
`session-copy`) that describe a historical measurement, and the `.quicksand` class name in the
unlinked `/dev/type/` probe. None is a dependency. The probe's now-degenerate column is in
`deferred-items.md`.

---

## The A-02 reversal recipe — and it is EIGHT edits, not seven

If the user takes Open item 2 (Archivo instead of Grifter), this is the whole cost. **No component is
touched and no test is rewritten**, because `identity.spec.ts` test 7 says "every display `@font-face`"
rather than "the second one".

1. **`npm i @fontsource-variable/archivo@5.3.0`** — exact pin, **not** `-D`. The plan's draft writes
   `-D`; that is 10-01's deviation 1 all over again. `src/app.css` is shipped to every visitor and
   `license-checker-rseidelsohn` runs `--production`, so a devDependency would be invisible to
   `npm run licenses`, to `THIRD-PARTY.md` and to `licenses/` while its woff2 sat in the artefact.
   `licence-notices.spec.ts` would say so by going red.
2. **`src/app.css`, the swappable block:** its `font-family` becomes `"Archivo Variable"` and its `src`
   becomes the same relative-`url()` shape as Inter's, into
   `@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2`. Add `font-weight: 100 900`
   for the variable axis; §5.2 notes Display can return to 900 at zero extra bytes.
3. **`src/app.css`, the token:** `--font-display`'s first family becomes `"Archivo Variable"`. Edits 2
   and 3 are the "two lines" §5.1 promises, and test 7 is red until both are done.
4. **`.gitattributes`:** remove the `static/fonts/GRIFTER-Bold.woff2 export-ignore` line and its
   D-13 comment block.
5. **`src/lib/ui/font-assets.spec.ts`:** remove the one `ALLOWED_FONTS` row. The array goes back to
   empty, test 4's branch goes vacuous again, and 10-01 already proved the file is green in that state.
   Amend the census note in the header, which is prose, not an assertion.
6. **`scripts/gen-licenses.mjs`:** remove the two Grifter paragraphs. Archivo needs no new paragraph of
   its own — extend Inter's OFL-1.1 sentence, or leave it, since `THIRD-PARTY.md`'s generated rows name
   the package and its licence anyway.
7. **`static/fonts/` deleted**, both the binary and the README.
8. **`scripts/deploy.mjs` step 5: remove the `hasFontNote` predicate along with the note.** *This is
   the edit the plan's list of seven misses, and it is not cosmetic: with `static/fonts/README.md`
   gone and the check left in, `hasFontNote` is false on every archive and **every deploy refuses**.*
   Found by running the predicate against a listing with that line removed rather than by reading it.
   The font-binary half can stay — with no font in the tree it is a cheap standing guard.

Then `npm run licenses`, `npm run build`, `npm run test:quick`. Nothing else moves.

---

## Task Commits

1. **Task 10-02-01: the two faces, the swappable block and the token** — `86f89e7` (feat)
2. **Task 10-02-02: G-01, the gate widened in three ways** — `7fdeb7d` (test)
3. **Task 10-02-03: Quicksand out, Grifter recorded, the archive both-sided** — `209c236` (feat)

**Two of the three commits are red on one test, by construction, and it is stated rather than hidden.**
At `86f89e7` `identity.spec.ts` is red on exactly the two assertions `7fdeb7d` widens
(*"expected '\"Inter Variable\"' to be '\"Quicksand\"'"* and *"rgb(0 0 0 / 0.5) is an alpha of the
accent over black: expected '0 0 0 / 0.5' to match /^214 255 78 \/ [0-9.]+$/"*) — the gate noticing the
swap rather than sleeping through it. At `7fdeb7d` `font-assets.spec.ts` test 1 is red on
*"static/fonts/GRIFTER-Bold.woff2 is a tracked font binary outside licenses/ with no row in
ALLOWED_FONTS"* — **10-01's gate catching the binary 10-02-01 tracked, unplanted, and the best evidence
in this plan that the Wave 0 gate was worth writing.** `209c236` is green on everything.

---

## Decisions Made

1. **The allowlist row carries no `exportIgnored` field.** The plan's draft row has
   `exportIgnored: true`. It does not type-check against 10-01's `FontRecord`, and adding the field
   would be worse than the type error: it would be a second source of truth for a fact test 4 already
   reads out of `.gitattributes`, free to disagree with the file it describes. The exclusion is
   asserted, not declared. The reason is written into the row as a comment.
2. **Procedure (a) for the archive negative check**, executed, with the scratch commit named
   `SCRATCH:` and reset by explicit sha.
3. **`--crt-scanline` is `rgb(0 0 0 / 0.5)`, not `0.50`.** Prettier rewrites `0.50` to `0.5` in CSS —
   the shipped ladder already reads `0.5`, `0.4`, `0.2` for the same reason — and `identity.spec.ts`'s
   `normalise()` compares them equal, so the contract is unchanged and the file matches its own house
   style.
4. **`gen-licenses.mjs:41` untouched**, for the reason above.
5. **The e2e suite was run** even though 10-VALIDATION marks it unchanged for this plan, because a
   site-wide body-face change with a 2.35 % width difference is the kind of thing a layout assertion
   notices. 89 passed.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — blocking] The plan's allowlist row does not type-check, and the field it adds should not
exist**

- **Found during:** Task 10-02-03
- **Issue:** The row in `<action>` step 4 carries `exportIgnored: true`. `FontRecord` (written in
  10-01, and not this plan's to widen) declares `path`, `family`, `licensee`, `licence` and nothing
  else, so the literal is an excess-property error under `svelte-check`.
- **Fix:** The field is omitted rather than the interface widened. Test 4 reads `.gitattributes`
  directly for every row; a declared `exportIgnored` would duplicate that fact without being checked
  against it, and a record free to disagree with the file it describes is worse than no record. The
  reasoning is a comment in the row.
- **Files modified:** `src/lib/ui/font-assets.spec.ts`
- **Verification:** `npm run check` COMPLETED 571 FILES 0 ERRORS 0 WARNINGS; `font-assets.spec.ts`
  5 passed; negative check A still red on the removed `export-ignore` line, so the assertion is intact.
- **Committed in:** `209c236`

**2. [Rule 1 — bug] Test 4's failure message forecast a state it was already in**

- **Found during:** Task 10-02-03, negative check A
- **Issue:** The message read *"This branch is vacuously true while ALLOWED_FONTS is empty; 10-02-03
  closes it with static/fonts/GRIFTER-Bold.woff2."* — which only ever prints when `ALLOWED_FONTS` is
  **not** empty. A diagnostic that describes the opposite of the situation it fires in sends the reader
  the wrong way.
- **Fix:** The message now names the allowlisted paths from the array itself and puts the vacuity note
  in the past tense. **No assertion changed** — this is a string argument to `expect`, not a predicate.
  Recorded here because the plan asks to be told if any of the five tests needed editing beyond adding
  the row: **none did, to pass.** All five accepted the row unchanged. This edit and the header census
  note are prose corrections, and the fixture string at test 1 (below) is the third.
- **Files modified:** `src/lib/ui/font-assets.spec.ts`
- **Verification:** re-ran negative check A; the message now reads *"Missing an `<path> export-ignore`
  line in .gitattributes for one of: static/fonts/GRIFTER-Bold.woff2."*
- **Committed in:** `209c236`

**3. [Rule 3 — blocking] A proof fixture named a package the plan uninstalls**

- **Found during:** Task 10-02-03
- **Issue:** Test 1 proves `FONT_SHAPED` does **not** fire on a `.txt` using the literal
  `"licenses/@fontsource/quicksand@5.3.0-LICENSE.txt"`. After the uninstall that path names nothing.
  The assertion still passes — the string is synthetic — but a fixture pointing at a deleted file is a
  trap for the next reader.
- **Fix:** Replaced with `"licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt"`, which exists and
  proves the identical thing. The header's census note was rewritten in the same breath, since it
  described the tree as 10-01 left it.
- **Files modified:** `src/lib/ui/font-assets.spec.ts`
- **Verification:** `font-assets.spec.ts` 5 passed.
- **Committed in:** `209c236`

**4. [Rule 2 — missing critical functionality] The A-02 reversal is eight edits, not seven**

- **Found during:** Task 10-02-03, after step 5 was written
- **Issue:** The plan's reversal recipe deletes `static/fonts/` and does not touch `deploy.mjs`. But
  step 5's new `hasFontNote` predicate refuses on a missing `static/fonts/README.md` — so the recipe as
  written would leave a repository in which **every deploy fails**, with a message about a note that is
  correctly absent.
- **Fix:** The eighth edit is written into the recipe above and its reason stated. Found by running the
  predicate against a filtered listing, not by reading the code.
- **Files modified:** none — the finding is the SUMMARY's recipe.
- **Verification:** the note-present half exercised on the real listing: `hasFontNote` false → REFUSE.

**5. [Rule 2 — missing critical functionality] `deploy.mjs` step 5 was given the mechanism note it was
missing**

- **Found during:** Task 10-02-03
- **Issue:** Step 5's existing comment already warned that *"`export-ignore` fails silently from an
  uncommitted .gitattributes"* — which is right but under-stated, and §16/§18 name `deploy.mjs` as the
  file that writes the archive. Anyone testing the exclusion from the working tree gets a green listing
  and concludes the exclusion works when it has not been tested at all.
- **Fix:** The comment now says plainly that `scripts/postbuild.mjs` writes the tarball, that
  `git archive HEAD` reads `.gitattributes` from HEAD, and that removing the line without committing it
  cannot make the binary appear.
- **Files modified:** `scripts/deploy.mjs`
- **Verification:** the claim was then proved by procedure (a) above.
- **Committed in:** `209c236`

**Total deviations:** 5 auto-fixed — 1 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
2 × Rule 3 (blocking). **No Rule 4.** Nothing architectural came up.
**Impact on plan:** No scope creep and nothing dropped. Two of the five (1 and 4) are corrections to
things the plan states that would have shipped a type error and a broken deploy respectively; two
(2 and 3) are diagnostics and fixtures made honest; one (5) is a comment that keeps the next person
from testing the wrong mechanism.

---

## Issues Encountered

**`check-counts.mjs` does not read a `<` redirection under this shell.** `node scripts/check-counts.mjs
76 787 < file` printed *"no Vitest summary lines found on stdin"*; `cat file | node
scripts/check-counts.mjs 76 787` worked. Environmental, not a fault in the script; recorded so a later
plan does not read it as a red count.

**`wrangler dev` was stopped parents-first before every rebuild**, per 10-01's deviation 6. No `EPERM`
occurred. `Get-NetTCPConnection` reports **0 listeners on 4173 and 4174** at the end.

**Nothing else.** No test was retried, no run was flaky, and every number in this document came from a
runner's, a build's, a server's or a script's own output in this session.

## Known Stubs

None. Every artefact this plan names is wired: the token names a face that is served, the exclusion is
read from the file that carries it, and the note is present in the archive that omits the binary.

---

## Verification

| Gate | Result |
| ---- | ------ |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | one line: `COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run lint` | clean — `All matched files use Prettier code style!`, ESLint silent |
| `npm run test:quick … check-counts.mjs 76 787` | **76 files, 787 tests, 1 todo** — `PREV_FILES 76 + 0`, `PREV_TESTS 786 + 1`. *"matches the expected counts"* |
| per-file | `identity.spec.ts` **7 passed**, `font-assets.spec.ts` **5 passed** |
| `npm run build` | green, exit 0; `source-209c236….tar.gz` 1,230 KB |
| both font assets | **200** / `font/woff2` / 48,256 B and 13,752 B through `wrangler dev` on `./build`; a neighbouring bad path 404 |
| the archive | 334 entries; font-shaped lines are `static/fonts/` and `static/fonts/README.md` only |
| `deploy.mjs` step 5 predicates | PASS on the real listing; REFUSE on both perturbations. **`npm run deploy` was not run** |
| `npm run licenses` | exit 0, 5 production dependencies, no Quicksand file in `licenses/` |
| `npx playwright test --workers 3` | **89 passed**, 1.6 min — `PREV_E2E` unchanged at `BASE_E2E` |
| `git diff --stat HEAD -- src/vendor/` | empty |
| `git status --porcelain` | empty. `test-results/` removed by hand; 0 listeners on 4173 and 4174 |
| `src/lib/ui/Coverflow.svelte` | untouched all plan; it appears in no diff |

**The nine colour tokens and `--font-mono` are byte-unchanged**, proved by `git diff -- src/app.css`:
every one of those eleven lines appears as a context line, never as a `-`/`+` pair.

---

## Notes for the plans that follow

- **10-03** spends `CH_PER_LINE = 43`, untouched here. `HONESTY_CAP` 129 → 86 and two literals shorten
  by four. Carry `PREV_FILES 76` / `PREV_TESTS 787` / `PREV_E2E 89` / `BASE_CHECK 571`.
- **10-04** owns the `feTurbulence` data-URI, Layer G's `body::before` and the `--crt` gate, none of
  which entered `src/app.css` here. `--crt-scanline` is already at `:root` waiting to be referenced
  from `PadFrame.svelte` — **reference it, never re-author the value**. And 10-04 inherits an open
  hole: negative check 4 above shows a colour authored inside a component `<style>` is invisible to
  every gate the site has today. `aesthetic.spec.ts`'s new scans should close it, and re-running that
  exact perturbation is the cheapest way to prove they did.
- **Anyone touching `src/app.css`** should know it now declares exactly two `@font-face` blocks and
  exactly one `--font-display`, and that `identity.spec.ts` test 7 asserts the two agree. Adding a
  second display face is legal; giving it a different family name is red.
- **10-14 / `docs/TESTING.md`** may want the D-13 mechanism in one place: the binary is served, the
  exclusion is in `.gitattributes`, the note is `static/fonts/README.md`, and step 5 checks both sides.
- **The licence answer is still open (D-14).** If it comes back no, the reversal recipe above is the
  whole cost, and it is eight edits.

## A note on the two requirements, and why neither was ticked

The plan's frontmatter says `requirements: [IDENT-01, FOUND-02]`. **Neither checkbox in
`REQUIREMENTS.md` was moved, deliberately.**

- **IDENT-01** is `[ ]`, traced to Phase 4, and 10-VALIDATION:315 says this phase **extends** it
  across *"10-02, 10-04"*. Its own text names *"generative glyph-field texture as wallpaper"* and
  *"wide-tracked uppercase type"*, which are 10-04's and 10-05's. Ticking it here would claim a
  requirement met by a plan that shipped a third of it.
- **FOUND-02** is already `[x]`, traced to Phase 3 and Complete since then. This plan gave its licence
  gate eyes it did not have; there is no checkbox left to tick.

Both are recorded in this SUMMARY's frontmatter as `requirements-extended` rather than
`requirements-completed`, which is the honest key.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module, or deployed anything in
this plan. The Grifter licence confirmation remains the user's, running in parallel per D-14; nothing
in this plan depends on its outcome beyond the two lines the recipe names.

## Next Phase Readiness

Wave 2 is complete and Wave 3 is unblocked. The type settlement is shipped as a structure rather than
as a promise: one token, one block, one test that says they agree, and a licence pipeline that can see
a file npm cannot.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

Every file named above is on disk: `src/app.css`, `static/fonts/GRIFTER-Bold.woff2`,
`static/fonts/README.md`, `.gitattributes`, `src/lib/ui/identity.spec.ts`,
`src/lib/ui/font-assets.spec.ts`, `scripts/gen-licenses.mjs`, `scripts/deploy.mjs`,
`THIRD-PARTY.md`, `licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt`,
`.planning/phases/10-redesign/deferred-items.md` and this SUMMARY.
`licenses/@fontsource/quicksand@5.3.0-LICENSE.txt` is confirmed **gone**. All three commit hashes
resolve in `git log`: `86f89e7`, `7fdeb7d`, `209c236`, and `git log --all | grep -c SCRATCH` returns
**0**, so the negative-check commit is unreachable from every ref.

Every count, byte size, sha256, status code, archive entry count, exit code and failure message quoted
above was read from a runner's, a build's, a server's or a script's own output in this session. The
three places where an observation disagrees with an approved document are stated as disagreements
rather than smoothed: §16/§18 naming `deploy.mjs` as the file that writes the archive when
`postbuild.mjs` does; 10-VALIDATION:486 expecting `aesthetic.spec.ts` red on the check-4 perturbation
when it is green until 10-04; and the plan's seven-edit reversal recipe, which is eight.
