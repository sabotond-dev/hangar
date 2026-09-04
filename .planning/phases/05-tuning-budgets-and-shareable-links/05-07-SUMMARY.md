---
phase: 05-tuning-budgets-and-shareable-links
plan: 07
subsystem: sharing
tags: [og, build-script, prerender, open-graph, discord, vite-ssr-load]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-06's renderOgPixels, encodePng, OG_WIDTH/OG_HEIGHT/OG_TICK, UNLIT_DOT_RGB and FRAME_RGB; the corrected not-black tripwire; the 56 files / 636 tests quick baseline"
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-05's SITE_ORIGIN in src/lib/share/url.ts and ogAlt() in src/lib/tune/copy.ts"
  - phase: 04-first-experience
    provides: "src/lib/catalog/front-door.ts - the eight routed entries; src/routes/c/[id]/+page.ts entries(); the prerendered per-configuration page and its head"
provides:
  - "scripts/gen-og.mjs - one 1200x630 PNG per routed entry into static/og/, from createEngine at tick 64, with three refusing gates"
  - "package.json build = gen-og -> vite build -> postbuild, as one visible chain"
  - "the eleven Open Graph tags on every prerendered /c/<id>/ page and on /"
  - "src/lib/og/build.spec.ts - 5 tests over static/og/ and build/, guarded on existsSync with an assertion in both branches"
  - "e2e/artifacts.e2e.ts test 3 - the image served as image/png by the deployed artifact"
  - "MEASURED CORRECTION for any later plan: SvelteKit's crawler follows og:image only when it is RELATIVE; an absolute og:image is cross-origin and is never followed, so the build is not the guard"
affects: [05-11, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A build-time asset generator that loads the app's own TypeScript through Vite's ssrLoadModule, so the picture is made by the same simulator the site runs rather than by a second implementation"
    - "A refusing gate read against the data's own declared flag (restsBlack) rather than against a constant, so the guard stays strict for the entries it applies to and does not have to be weakened when the row admits an entry it does not"
    - "When the build cannot be the guard, the spec is: build.spec.ts resolves every absolute og:image back to a path under build/ and asserts the file is there"

key-files:
  created:
    - scripts/gen-og.mjs
    - src/lib/og/build.spec.ts
  modified:
    - package.json
    - .gitignore
    - src/routes/c/[id]/+page.svelte
    - src/routes/+page.svelte
    - e2e/artifacts.e2e.ts

key-decisions:
  - "static/og/ is GENERATED AND GITIGNORED, not committed. A clean checkout regenerates it in ~1.5 s, the deploy script's clean-tree gate stays satisfiable because an ignored path is never a dirty one, and eight binaries never enter the source archive or a diff. Byte-stability was observed anyway - aurora reproduced 05-06's 6,641 bytes exactly - so committing would also have worked; it was not chosen"
  - "FINDING, and it overturns this plan's stated premise. SvelteKit's crawler DOES carry og:image in CRAWLABLE_META_NAME_ATTRS, and a RELATIVE missing og:image fails the build (observed: `Error: 404 /og/nope.png (linked from /c/aurora/)`). But HANGAR's og:image is ABSOLUTE, which is a different origin from the prerender base, so the crawler never follows it and the same missing file builds green. The build is therefore NOT the guard for HANGAR's heads. The ordering is still mandatory for a plainer reason: `vite build` copies static/ into build/, so an image made afterwards never reaches the artifact"
  - "Because the build cannot be the guard, build.spec.ts became it: assertCompleteHead resolves every absolute og:image back to a path under build/ and asserts the file exists. Observed red by hiding build/og/aurora.png. It is an assertion inside the plan's existing tests 4 and 5, not a sixth test"
  - "/ unfurls on FRONT_DOOR[0]'s picture (D-14's accepted compromise). There is no shelf-level image: making one would be a second composition to keep true to the site, and the opening centre is what a visitor sees first anyway. A designer may overturn this - it is one const and one new file"
  - "The unknown-address branch of /c/<id>/ (index -1) unfurls as the shelf on the opening centre's picture, handled explicitly rather than letting an undefined id produce /og/undefined.png"
  - "The not-black tripwire is the corrected one from 05-06: it counts pixels that are none of black, UNLIT_DOT_RGB or FRAME_RGB, and exempts a dark entry by its declared restsBlack (D-19). The structural guard beside it counts FRAME_RGB and UNLIT_DOT_RGB together rather than the dot field alone, because ninepads lights all 81 cells and therefore has no dot field at all"

patterns-established:
  - "Pattern 1: when a plan's stated mechanism turns out not to hold, replace the mechanism with a real assertion in the same wave rather than inheriting a comforting paragraph - and record the measurement that overturned it, in the file whose ordering depended on it"
  - "Pattern 2: an HTML attribute matcher closes on a BACKREFERENCE to its opening quote, never on [\"'] - three of the row's descriptions carry an apostrophe, and a character class truncates both sides of the comparison equally for a green test that proves nothing"

requirements-completed: []
requirements-contributed: [SHARE-04]

# Metrics
duration: 14 min
completed: 2026-09-04
---

# Phase 5 Plan 07: The Picture On Disk, And The Tags In The Head Summary

Every ZONA configuration with an address now has a 1200x630 picture of itself, painted by the same
firmware simulator the site runs, generated before every build with no new dependency; and every
prerendered page carries the eleven Open Graph tags that make a shared link unfurl as a large embed
rather than a bare URL.

## Observed totals

`05-06-SUMMARY.md` recorded `56 files / 636 tests (1 todo)`, sweep `3 / 13`, e2e `23` (`BASE_E2E`).
The quick suite was **re-measured on a clean tree at `2be05c8`, before any file in this plan was
written**, and reproduced that baseline exactly:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 56 636     (clean tree, 2be05c8)
check-counts: observed 56 files, 636 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0
```

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 56 files / 636 tests (1 todo) | **57 files / 641 tests (1 todo)** | **+1 file / +5 tests** |
| `test:sweep` | 3 files / 13 tests | **3 files / 13 tests** | unchanged |
| `test:e2e` | 23 passed (`BASE_E2E`) | **24 passed** (re-measured, not inherited) | **+1** |
| `check` | 483 files, 0 errors | **484 files, 0 errors** | +1 file, still 0 errors |

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 57 641
check-counts: observed 57 files, 641 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0

npm run test:e2e 2>&1 | tee .tmp-e2e/og.log | node scripts/check-counts.mjs --playwright 24
check-counts: observed 24 tests passed
check-counts: matches the expected counts
                                                              -> exit 0

grep -c failed .tmp-e2e/og.log   ->  0
netstat -ano | grep -w LISTENING | grep ":4173"   ->  nothing (no listener left behind)
```

Per-file, all green:

```
npx vitest run --project server src/lib/og/build.spec.ts       ->  5 passed
npx vitest run --project server src/lib/config-shape.spec.ts   ->  14 passed
npx playwright test e2e/artifacts.e2e.ts --project chromium    ->  3 passed
```

Gates:

```
npm run build   ->   exit 0   (gen-og runs first)
npm run check 2>&1 | grep -Ei "0 errors"
  1788524065677 COMPLETED 484 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint    ->   exit 0 ("All matched files use Prettier code style!")

git diff --quiet HEAD -- package-lock.json        ->  exit 0   (no dependency added)
git diff --quiet HEAD -- vite.config.ts           ->  exit 0   (handleHttpError not widened)
git diff --quiet HEAD -- src/lib/config-shape.spec.ts  ->  exit 0
git status --porcelain static                     ->  empty    (static/og/ is ignored)
grep -c "static/og" .gitignore                    ->  1
grep -c "FRONT_DOOR" e2e/artifacts.e2e.ts         ->  4
```

## The generator's printed block, in full

```
$ node scripts/gen-og.mjs
gen-og: aurora       6641 bytes   76 of 81 cells lit
gen-og: pinwheel     6739 bytes   77 of 81 cells lit
gen-og: ninepads     6512 bytes   81 of 81 cells lit
gen-og: starfield    6957 bytes   78 of 81 cells lit
gen-og: joystick     4327 bytes    1 of 81 cells lit
gen-og: radar        6711 bytes   77 of 81 cells lit
gen-og: faders       6329 bytes   45 of 81 cells lit
gen-og: dial         6774 bytes   74 of 81 cells lit
gen-og: 8 images in static/og/ at 1200x630, tick 64, largest 6957 bytes
                                                              -> exit 0
```

**Largest observed: `starfield.png` at 6,957 bytes** — 0.66% of the 1 MB ceiling. Smallest is
`joystick` at 4,327, which lights exactly one cell at tick 64 and is therefore mostly dot field and
frame; it sits just above 05-06's fully dark `tpad` measurement of 4,192, which is the arithmetic
behind the corrected tripwire below. `aurora` reproduced 05-06's 6,641 bytes **exactly**, so the
encoder is byte-stable across runs.

The id sets were compared as sets rather than against a list, through a throwaway script that read
`FRONT_DOOR` via `ssrLoadModule` (left in the scratch directory, not in the repository):

```
wanted 8 found 8
missing []
extra []
                                                              -> exit 0
```

**Eight of the sixteen catalog entries deliberately have no image, because they have no address.**
`src/routes/c/[id]/+page.ts` generates `entries()` from `FRONT_DOOR`, so `/c/euclid/` does not exist
and has no `<head>` to carry an `og:image`. The generator reads the same source, so Phase 5.1 widens
the row and the images follow with no change to the script.

## The commit-vs-generate decision

**`static/og/` is generated and gitignored.** Recorded because the plan required a choice:

- The whole set regenerates in about 1.5 s of Vite boot plus milliseconds per entry, from a clean
  checkout, with no argument and no second command.
- `scripts/deploy.mjs`'s clean-tree gate stays satisfiable: an ignored path is never a dirty one.
  A generated-but-untracked file would have made every deploy refuse.
- Eight binaries stay out of the source archive and out of every diff.
- The generator rebuilds the directory from empty, so an id that leaves the row cannot leave a stale
  picture behind for a later `og:image` to keep resolving against.

Committing would also have worked — byte-stability was observed rather than assumed (`aurora` is
6,641 bytes on both 05-06's run and this one) — but it buys nothing that the 1.5 s regeneration does
not, and it costs a binary diff on every simulator change.

## The negative checks, observed red

### 1. The black-frame gate fires and names the entry

`const frame = engine.frame` replaced with `const frame = new Uint8Array(243)`:

```
gen-og: "aurora" rendered an entirely dark pad at tick 64, and the entry does not
declare restsBlack. The simulator produced nothing rather than the card being dark.
                                                              -> exit 1
```

Restored; the full eight-line block above printed again and exited 0.

### 2. A missing tag turns test 4 red, naming the tag

The `<meta property="og:image">` line deleted from `src/routes/c/[id]/+page.svelte`, rebuilt:

```
 × gives every prerendered configuration page a complete Open Graph head 4ms
AssertionError: /c/aurora/ carries og:image: expected undefined to be defined
      Tests  1 failed | 4 passed (5)
```

Restored; 5 passed.

### 3. The one the plan predicted — and it came out the other way. **This is the finding.**

The plan's whole shape rests on "the prerender crawler follows `og:image`, so a missing image fails
the build". Pointing `og:image` at `${SITE_ORIGIN}/og/nope.png` and running `npm run build`:

```
postbuild: 7250e677... - LICENSE, THIRD-PARTY.md and licenses/ copied into build/
                                                              -> exit 0
```

**Green.** The same bad path spelled **relatively** as `/og/nope.png`:

```
[404] GET /og/nope.png
Error: 404 /og/nope.png (linked from /c/aurora/)
    at handleHttpError (.../vite.config.ts.timestamp-....mjs:34:11)
                                                              -> exit 1
```

So the mechanism is real but narrower than described. `node_modules/@sveltejs/kit/src/core/postbuild/crawl.js`
does carry `og:image` in `CRAWLABLE_META_NAME_ATTRS` — verified by reading it — and a relative bad
path fails the build exactly as promised. But an **absolute** `og:image` is a different origin from
the prerender base, so the crawler never follows it. HANGAR's `og:image` must be absolute (a crawler
resolves nothing relative; 05-UI-SPEC and D-15 both require it), so **the build is not the guard for
this repository's heads.**

Two consequences, both acted on rather than noted:

1. **The ordering is still mandatory**, for a plainer and entirely sufficient reason: `vite build`
   copies `static/` into `build/`. An image generated after it would sit in `static/og/` forever and
   never reach the artifact, and all eight `og:image` values would 404 in production with nothing red
   anywhere. `scripts/gen-og.mjs`'s header now records the measurement and both reasons; it no longer
   claims a guard that does not fire.
2. **`build.spec.ts` became the guard.** `assertCompleteHead` now resolves every absolute `og:image`
   back to a path under `build/` and asserts the file is there. Observed red by hiding one image:

```
$ mv build/og/aurora.png build/og/aurora.png.hidden
 × gives every prerendered configuration page a complete Open Graph head 7ms
 × gives the shelf itself the same head, on the opening centre's picture 1ms
AssertionError: /c/aurora/ og:image resolves to C:\...\hangar\build\og\aurora.png:
expected false to be true
```

Restored; 5 passed. `vite.config.ts` is byte-identical — `handleHttpError` was **not** widened, and
the guard that already earned its keep on a broken footer link is untouched.

## What was built

### `scripts/gen-og.mjs`

`createServer` in middleware mode over the repository's own `vite.config.ts`, then `ssrLoadModule`
for the front door, the catalog, `$lib/sim/engine`, the renderer and the encoder. Plain Node cannot
do this: `pad-sim.ts`'s extensionless `from "./_pad"` is not resolvable by Node's ESM loader, as
`scripts/capture-preset-baseline.mjs` already records. Vite is already a devDependency, so this adds
nothing to `package.json`.

Per entry: `byId(id)` → `createEngine(entry)` → `run(OG_TICK)` → `renderOgPixels(frame)` →
`encodePng(px, OG_WIDTH, OG_HEIGHT)` → `static/og/<id>.png`. The three dimensions and the tick are
imported from `render.ts` rather than restated.

Three refusing gates in `postbuild.mjs`'s style — print the reason, exit 1:

| Gate | Fires when | Why it is fatal rather than a skip |
|---|---|---|
| engine | `createEngine` throws for an entry | A skipped entry ships a page whose `og:image` 404s in production |
| dark frame | zero lit cells **and** the entry does not declare `restsBlack` | Every routed entry declares false, so a dark frame means the simulator broke |
| size | over 1,048,576 bytes | Nothing plausible reaches it, which is why crossing it means something is wrong |

The dark-frame gate reads the entry's **own declared flag** rather than a constant. D-19 exists so
that "the picture went black" and "this one is meant to be black" are distinguishable; writing the
gate this way keeps it strict for all eight current entries and needs no weakening if the row is ever
widened to admit a dark one.

`await server.close()` in a `finally`, and one printed line per entry carrying the id, the byte size
and the lit-cell count — so a changed picture is a diffable decision rather than a mystery.

### `package.json` and `.gitignore`

```
"build": "node scripts/gen-og.mjs && vite build && node scripts/postbuild.mjs"
```

In the `build` script itself, not as a `prebuild` hook: a hook does not run for a bare
`npx vite build`, and the failure would then be eight silent 404s in production. One visible chain is
the honest form.

`.gitignore` gains `static/og/` beside the other build output with its one-line reason.

### The two heads

Eleven tags on `/c/<id>/` and on `/`, from 05-UI-SPEC § The OG image, every value held in a `const`
or a `$derived` and never inline in markup — Prettier reflows element text and Phase 2 already lost a
load-bearing sentence that way.

| Tag | `/c/<id>/` | `/` |
|---|---|---|
| `og:type` | `website` | `website` |
| `og:site_name` | `HANGAR` | `HANGAR` |
| `og:title` | `{name} — HANGAR` | `HANGAR` |
| `og:description` | `entry.description` | the shelf's own description |
| `og:url` | `{SITE_ORIGIN}/c/{id}/` | `{SITE_ORIGIN}/` |
| `og:image` | `{SITE_ORIGIN}/og/{id}.png` | `{SITE_ORIGIN}/og/aurora.png` |
| `og:image:type` | `image/png` | `image/png` |
| `og:image:width` / `:height` | `1200` / `630` | `1200` / `630` |
| `og:image:alt` | `ogAlt(name)` | `ogAlt("Aurora")` |
| `twitter:card` | `summary_large_image` | `summary_large_image` |

`twitter:card = summary_large_image` is what makes Discord render the large embed rather than an
80x80 thumbnail; nothing here is about Twitter. `SITE_ORIGIN` comes from `$lib/share/url` — the
module that imports nothing, which is exactly why the origin lives there — and the alt string from
`ogAlt()` in `$lib/tune/copy`, so no second copy of either exists. Neither specifier names the
vendored tree, the protocol package or the compile surface, so `config-shape.spec.ts` test 13 stays
green (14 passed, and the file is byte-identical). The renderer is deliberately **not** imported: it
is node-only, and `png.spec.ts` test 5 forbids any file outside `src/lib/og/` from reaching it — so
1200 and 630 appear in the routes as literals with a comment saying why.

The **unknown-address branch** (`data.index === -1`) keeps the shelf's title and description and
unfurls on the opening centre's picture, handled explicitly rather than letting an `undefined` id
produce `/og/undefined.png`.

**`/` on `FRONT_DOOR[0]`'s image is the accepted compromise.** There is no shelf-level picture: making
one would be a second composition to keep true to the site, and the opening centre is what a visitor
sees first anyway. It is the one thing 05-UI-SPEC does not fix, so it is called out here as a
decision a designer may overturn — it is one `const` and one new file.

### `src/lib/og/build.spec.ts` — 5 tests

Every test is guarded on `existsSync` and asserts in **both** branches, the shape
`licence-notices.spec.ts` established, because `requireAssertions` is on.

1. `static/og/` holds exactly one PNG per `FRONT_DOOR` entry and no extras, compared as sorted sets
   so a grown row is covered without editing the spec.
2. Every file opens with the eight signature bytes and its **IHDR decodes to** 1200 x 630, bit depth
   8, colour type 2, and is under 1 MB. Read out of the file at its real offsets — the type name
   starts at 12, not 8, which the first run of this spec caught.
3. **The corrected tripwire.** Every IDAT is inflated and de-filtered back to RGB (asserting filter
   type 0 on every row, so a filtered row cannot be counted as noise), then each pixel is classified.
   05-06 measured that a resting-black entry still encodes to 4,192 bytes of dot field and frame, so
   "at least one non-black pixel" passes on a renderer that dropped every LED. This counts pixels
   that are **none of** black, `UNLIT_DOT_RGB` or `FRAME_RGB`, and exempts a dark entry by its
   declared `restsBlack` (D-19). The structural guard beside it counts `FRAME_RGB` **and**
   `UNLIT_DOT_RGB` together rather than the dot field alone — `ninepads` lights all 81 cells and
   therefore has no dot field at all, which the first run of this spec also caught.
4. Every `build/c/<id>/index.html` carries all eleven tags; `og:url` and `og:image` are absolute
   against `SITE_ORIGIN`; the file each `og:image` names really exists under `build/`; `og:title`
   equals the page's own `<title>` and `og:description` equals its own `<meta name="description">`,
   so the head cannot say one thing to a reader and another to a crawler; and `og:image:alt` equals
   `ogAlt(name)` from `copy.ts`.
5. The same over `build/index.html`, with the shelf's own title and description and the opening
   centre's image.

### `e2e/artifacts.e2e.ts` — one more test

**"every configuration's link image is served by the built site"** requests `/og/<id>.png` for every
`FRONT_DOOR` entry through Playwright's `request` fixture — nothing about rendering belongs in a test
about serving — and asserts status 200, `content-type: image/png`, and the eight PNG signature bytes
in the body. The row is imported rather than listed, and `FRONT_DOOR.length >= 8` is asserted first
so an empty row cannot make the test pass on nothing. It runs against `build/` served by
`worker/index.js` under `wrangler dev`: the deployed bytes, through the real Basic Auth gate.

## The honest limitation

**A real Discord unfurl remains unverifiable, and SHARE-04 was not observed end to end.**
`worker/index.js` gates the whole site behind Basic Auth, fail-closed, so no crawler can fetch
anything until the embargo lifts on launch day. What is proven here is structural and nothing more:
the files exist, they are 1200 x 630 truecolour PNGs under a megabyte, they carry real LEDs rather
than only the dot field and the frame, they are referenced by absolute `og:image` values from every
routed page, the file each of those values names is in the artifact, and the artifact serves it as
`image/png` over HTTP. That a crawler ever fetched one, and that Discord rendered a large embed from
it, is not claimed.

**And the second qualifier, carried forward as 05-VALIDATION requires:** an image is generated for
**routed entries only — 8 of the 16 catalog entries.** The other eight are not in `FRONT_DOOR`, have
no prerendered `/c/<id>/` page and therefore no `<head>` to carry an `og:image`. That is not an
omission to fix in this phase; it is what "per catalog configuration" means while half the catalog
has no address.

SHARE-04 is **contributed, not completed** — 05-VALIDATION assigns it to 05-12 for recording, with
both qualifiers.

## Deviations from Plan

**1. [Rule 1 — the plan's stated mechanism does not hold] The build does not fail on a missing
absolute `og:image`, and `build.spec.ts` now does instead.**

- **Found during:** Task 2, running the plan's own second negative check.
- **Issue:** the plan's whole shape is justified by "the prerender crawler follows `og:image`, so a
  missing image fails the build". Measured: it follows a **relative** `og:image` and fails
  (`Error: 404 /og/nope.png (linked from /c/aurora/)`), but an **absolute** one is cross-origin and
  is never followed — `${SITE_ORIGIN}/og/nope.png` built green. HANGAR's `og:image` must be absolute,
  so the promised guard would never have fired, and a plan success criterion ("the build fails when
  the image is missing — observed, not assumed") could not be met as written.
- **Fix:** `assertCompleteHead` resolves each absolute `og:image` back to a path under `build/` and
  asserts the file exists, observed red by hiding `build/og/aurora.png`. It is an assertion inside
  the plan's existing tests 4 and 5, so the exact 5-test count is unchanged and there is no untested
  branch. `scripts/gen-og.mjs`'s header was corrected to record the measurement and to state the
  reason the ordering is still mandatory (`vite build` copies `static/` into `build/`).
- **Files:** `src/lib/og/build.spec.ts`, `scripts/gen-og.mjs`. **Commit:** `96f8fcb`.

**2. [Rule 1 — spec bug, caught by its own first run] The structural guard in test 3 counted the dot
field alone, which is zero for a fully lit pad.**

- **Found during:** Task 2's RED step. `ninepads` lights all 81 cells, so it has no unlit dot at all
  and the guard failed on a correct image. Counting `FRAME_RGB` and `UNLIT_DOT_RGB` together is the
  claim that actually holds for every image: the frame stroke is painted whatever the pad is doing.
- **Files:** `src/lib/og/build.spec.ts`. **Commit:** `96f8fcb`.

**3. [Rule 1 — spec bug that would have made a green test prove nothing] The attribute matcher
truncated at an apostrophe.**

- **Found during:** Task 2's GREEN step, on `radar`: `content=["']([^"']*)["']` cut
  "your finger's position" at the apostrophe. It only surfaced because the test compares against
  `entry.description`; the `og:description === meta description` assertion beside it had been
  comparing two **equally truncated** strings and passing.
- **Fix:** the closing delimiter is a backreference to the opening one, `content=(["'])(.*?)\1`.
- **Files:** `src/lib/og/build.spec.ts`. **Commit:** `96f8fcb`.

**4. [out of scope, recorded not fixed] `@intechstudio/grid-protocol` prints
`HEARTBEAT_INTERVAL 250000 250` to stdout on load.**

Visible in `gen-og`'s output and in every Vitest run that imports the catalog. It comes from the
pinned upstream package, not from HANGAR, and it is pre-existing — it predates this plan and is
unrelated to anything it changed. Not touched; logged here rather than in `deferred-items.md`
because it is upstream's output and not a HANGAR defect.

Nothing else deviated. No dependency was added, no vendored file was touched, `vite.config.ts` and
`src/lib/config-shape.spec.ts` are byte-identical, `handleHttpError` was not widened, no
`.svelte.spec.ts` was created, and no Playwright title contains the word `failed`.

## Commits

| Task | Commit | What |
|---|---|---|
| 5-07-01 | `7250e67` | `feat(05-07): gen-og.mjs, and the build step that has to come first` |
| 5-07-02 | `96f8fcb` | `feat(05-07): the Open Graph head, and the build gate over it` |
| 5-07-03 | `521a2bd` | `test(05-07): the link image, served by the deployed artifact` |

## For the plans after this one

- **The e2e baseline moves here.** `PREV_E2E` for 05-08 onward is **24**, not `BASE_E2E`'s 23.
- **Do not write "the build fails if the og:image is missing" anywhere.** It does not, for absolute
  URLs. `src/lib/og/build.spec.ts` test 4 is the guard; say that instead.
- 05-11's and 05-12's counts start from `57 files / 641 tests`, sweep `3 / 13`, e2e `24`.
- Widening `FRONT_DOOR` (Phase 5.1) needs **no change** to `scripts/gen-og.mjs`,
  `src/lib/og/build.spec.ts` or `e2e/artifacts.e2e.ts`: all three read the row.
- 05-12 records SHARE-04 with **both** qualifiers verbatim: routed entries only (8 of 16), and no
  real unfurl until the Basic Auth embargo lifts.

## Self-Check: PASSED

Both created files exist on disk (`scripts/gen-og.mjs`, `src/lib/og/build.spec.ts`); all eight images
are in `static/og/` and all eight are in `build/og/`; all three commit hashes resolve in `git log`;
`static/og/` is ignored, so `git status --porcelain static` is empty and the deploy script's
clean-tree gate stays satisfiable; and the working tree carries nothing but this SUMMARY and the
state files.
