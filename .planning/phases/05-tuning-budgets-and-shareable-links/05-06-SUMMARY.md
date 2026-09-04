---
phase: 05-tuning-budgets-and-shareable-links
plan: 06
subsystem: sharing
tags: [og, png, zlib, node-only, identity, textless]

# Dependency graph
requires:
  - phase: 05-tuning-budgets-and-shareable-links
    provides: "05-05's measured baseline of 54 files / 627 tests, sweep 3 / 13, e2e 23"
  - phase: 04-first-experience
    provides: "src/app.css - the accent token and the two alphas the image flattens; src/lib/sim/paint.ts - the 243-byte screen-order frame and the lit test; the tick-64 reduced-motion contract"
  - phase: 03-the-vendored-compiler
    provides: "src/vendor/botor/pad-sim.ts - PadSim.frame, the buffer both halves are calibrated against"
provides:
  - "src/lib/og/png.ts - encodePng(rgb, width, height) and PngSizeError, over node:zlib alone"
  - "src/lib/og/render.ts - renderOgPixels(frame), OG_WIDTH, OG_HEIGHT, OG_TICK, ACCENT_RGB, LINE_ALPHA, LINE_SOFT_ALPHA, flattenOnBlack, UNLIT_DOT_RGB, FRAME_RGB, and the geometry constants"
  - "the node-only rule as a test rather than a comment: png.spec.ts walks 138 files under src/ and e2e/ and asserts none reaches $lib/og"
  - "two measured file sizes for 05-07's ceiling assertion: aurora 6,641 bytes, tpad 4,192 bytes"
affects: [05-07, 05-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "An encoder whose spec inflates its own output back to the input and recomputes every chunk CRC, so the framing, the lengths and the offsets are proven rather than asserted from numbers the encoder also produced"
    - "A renderer that computes its structural colours from the identity token's channels and an alpha, with a spec that holds both the channels and the alphas against src/app.css - so neither hex is typed anywhere and the image cannot drift from the site"
    - "A geometry spec that restates the UI spec's coordinates as its own literals rather than importing the module's constants, so a constant that moves moves the picture and not the expectation"

key-files:
  created:
    - src/lib/og/png.ts
    - src/lib/og/png.spec.ts
    - src/lib/og/render.ts
    - src/lib/og/render.spec.ts
  modified: []

key-decisions:
  - "The unlit dot is a 6px circle (the pixels whose centres fall within 3px of the cell centre - six across on both axes with the four corners off), not a 6x6 square: it is the CSS radial-gradient dot field's stand-in and it should read as a dot. render.spec.ts asserts the sixth pixel lit and the seventh black on the centre row"
  - "The frame stroke is a rounded-rect difference - inside the outer 484px round at radius 12, and not inside the same shape inset by the 2px stroke width at radius 10 - evaluated at pixel CENTRES (x + 0.5), so a 2px stroke lands on exactly two columns instead of straddling three at half strength. There is no anti-aliasing anywhere in the image and there should not be"
  - "encodePng writes filter type 0 (None) on every scanline and never tries the other four. The measured file is 4-7 KB against a 1 MB ceiling, and an unfiltered stream is one a human can inflate and read"
  - "Both size guards throw rather than truncate - PngSizeError for a buffer that does not match its dimensions, and a named 243-byte refusal in renderOgPixels - and both are asserted inside the test that already owns the size contract, so the plan's exact 5 + 4 test count is kept with no untested branch"
  - "FINDING FOR 05-07: a resting-black entry's OG image is NOT black. tpad's frame is 243 zero bytes and its PNG is still 4,192 bytes of dot field and frame stroke, so 05-VALIDATION's 'at least one non-black pixel' tripwire is satisfied by the composition alone and cannot tell a black pad from a rendering failure. build.spec.ts must count pixels that are neither black, nor UNLIT_DOT_RGB, nor FRAME_RGB - or assert on the frame bytes - and must exempt the restsBlack entries by their declared flag (D-19)"

patterns-established:
  - "Pattern 1: when a plan fixes an exact test count and a module needs a guard the behaviour list does not name, the guard's assertion joins the test that already owns that contract from the other side, rather than becoming a sixth test or an untested branch"
  - "Pattern 2: a forbid-scan asserts how many files it read before it asserts none of them matched - 138 here, against a floor of 30"

requirements-completed: []
requirements-contributed: [SHARE-04]

# Metrics
duration: 22 min
completed: 2026-09-04
---

# Phase 5 Plan 06: The OG Image's Two Pure Halves Summary

HANGAR can now turn a simulated pad into a 1200x630 PNG with nothing but Node's own zlib — no native
module, no headless browser, no paid service and no new dependency — and the picture is the site's
own: true black, the firmware's LED bytes copied byte for byte, the dot field and the frame computed
from `src/app.css`'s accent at its two declared alphas, and no text at all.

## Observed totals

`05-05-SUMMARY.md` recorded `54 files / 627 tests (1 todo)`, sweep `3 / 13`, e2e `23`. The quick suite
was **re-measured on a clean tree at `eafcb1d`, before any file in this plan was written**, and
reproduced that baseline exactly:

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 54 627     (clean tree, eafcb1d)
check-counts: observed 54 files, 627 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0
```

| Suite | Before | After | Delta |
|---|---|---|---|
| `test:quick` | 54 files / 627 tests (1 todo) | **56 files / 636 tests (1 todo)** | **+2 files / +9 tests** |
| `test:sweep` | 3 files / 13 tests | **3 files / 13 tests** | unchanged |
| `test:e2e` | 23 passed | **23 passed** (not re-run — no e2e file touched, and nothing in this plan is reachable from a browser) | unchanged |
| `check` | 479 files, 0 errors | **483 files, 0 errors** | +4 files, still 0 errors |

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 56 636
check-counts: observed 56 files, 636 tests passed, 1 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
check-counts: matches the expected counts
                                                              -> exit 0
```

Per-file, all green:

```
npx vitest run --project server src/lib/og/png.spec.ts      ->  5 passed
npx vitest run --project server src/lib/og/render.spec.ts   ->  4 passed
```

Gates:

```
npm run check 2>&1 | grep -Ei "0 errors"
  1788523101304 COMPLETED 483 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint   ->   exit 0 ("All matched files use Prettier code style!")

git diff --quiet HEAD -- package.json package-lock.json   ->  exit 0   (no dependency added)
```

Import shape, over the comment-stripped source of each module:

```
src/lib/og/png.ts     specifiers: ["node:zlib"]      node: specifiers: ["node:zlib"]
src/lib/og/render.ts  specifiers: []                 node: specifiers: []
grep -c "2b3310" src/lib/og/render.ts  ->  0
grep -c "56661f" src/lib/og/render.ts  ->  0
```

## The measured file sizes

Real frames, not synthetic ones: both entries were built through `createEngine`, run to `OG_TICK`
(64), rendered by `renderOgPixels` and encoded by `encodePng`, inside a throwaway Vite
`ssrLoadModule` host that wrote nothing into the repository. The 05-07 build script will do exactly
this, which is the point of measuring it now.

| Entry | `restsBlack` | Non-zero frame bytes at tick 64 | **PNG** |
|---|---|---|---|
| `aurora` (lit) | false | 146 of 243 | **6,641 bytes** |
| `tpad` (resting black) | true | 0 of 243 | **4,192 bytes** |

Against Discord's practical 1 MB ceiling that is 0.63% and 0.40%. 05-RESEARCH projected ~4 KB from a
hand-built frame; the real lit entry is 6.6 KB, because 81 blocks of *different* firmware colours
deflate less well than one lime block does. Still two orders of magnitude of headroom, and nothing in
the encoder needs to get cleverer.

**The number that matters for 05-07 is 4,192.** A resting-black entry's image is not black: the dot
field and the frame stroke are there whatever the pad is doing, which is why the `key-decisions`
entry above tells `build.spec.ts` to count pixels that are none of the three structural colours
rather than merely "not black". As written, that tripwire would pass on a renderer that dropped every
LED.

## Both negative checks, observed red

**Task 1 — swap the IHDR's width and height writes.** `ihdr.writeUInt32BE(width, 0)` and
`ihdr.writeUInt32BE(height, 4)` exchanged:

```
 × writes an IHDR that decodes to its own arguments 6ms
AssertionError: expected 3 to be 7 // Object.is equality
      Tests  1 failed | 4 passed (5)
```

Red on the 7 x 3 case and naming both numbers, which is exactly why the test asserts on a
non-square: at 1200 x 630 alone a transposition also fails, but on any square image it would be
invisible. Restored; 5 passed.

**Task 2 — soften an LED channel.** `[r, g, b]` at the `paintLitCell` call changed to
`[r, Math.round(g * 0.9), b]`, the "just take the edge off it" mutation this module exists to forbid:

```
 × copies a lit cell's firmware bytes across its whole 48 x 48 block 9ms
 × places the face, the cells and the frame where the spec puts them 6ms
AssertionError: expected '576,291: 3,225,128' to be '576,291: 3,250,128'
AssertionError: expected [ 17, 180, 90 ] to deeply equal [ 17, 200, 90 ]
      Tests  2 failed | 2 passed (4)
```

Test 2 goes red naming the exact pixel and the exact byte — 250 became 225 at (576, 291) — and test 4
goes red as well, because every one of its corner-cell samples is a firmware byte too. Restored;
4 passed.

## What was built

### `src/lib/og/png.ts`

`encodePng(rgb, width, height)`: the eight-byte signature, `IHDR` (bit depth 8, colour type 2, zero
compression/filter/interlace), `IDAT` from `deflateSync(scanlines, { level: 9 })`, `IEND`, and a
`crc32` over `type + data` on every chunk. Two imports from `node:zlib` and nothing else in the file.

The header records the three measured facts that make the dependency-free path viable — `zlib.crc32`
exists in Node 24 (verified on v24.14.0, and `engines` already says `node >= 24`), `deflateSync`
emits the RFC-1950 stream `IDAT` holds, and the measured size is kilobytes — and the one design rule:
**this module is node-only.**

`PngSizeError` refuses a buffer that does not match the dimensions the `IHDR` will advertise. A file
whose header promises 1200x630 and whose data holds less is rendered by some decoders and rendered
*wrong* by most; a failed build is better.

### `src/lib/og/png.spec.ts` — 5 tests

1. The signature is the eight bytes, the last chunk is `IEND` with no payload, and the file ends
   where `IEND`'s CRC ends — nothing trails the terminator.
2. `IHDR` decodes back to the arguments it was given, on 7 x 3 and again on 1200 x 630, with bit
   depth 8, colour type 2 and three zeros. Plus the same contract from the other side: a buffer one
   byte short and a buffer one byte long are both refused.
3. The `IDAT` `inflateSync`es back to exactly the scanlines the encoder was handed — every row
   prefixed with a `0` filter byte, `Buffer.compare` to zero against an independently built
   expectation. This is the test that makes the encoder checkable rather than plausible.
4. A chunk-by-chunk walk from the byte after the signature, asserting it found at least three chunks
   and that they are `IHDR`, `IDAT`, `IEND`, then recomputing every CRC over `type + data`. A walk
   that drifted by one byte would land on a type that is not four ASCII letters and a CRC that does
   not match, so this test also pins the framing, the lengths and the offsets.
5. A realistic 1200 x 630 pad image encodes under 1 MB; and the node-only rule, enforced. The scan
   walks `src/` and `e2e/` for `.ts`, `.js`, `.mjs` and `.svelte`, skips `src/lib/og/`, strips
   comments, and asserts **no file reaches `$lib/og`** — after asserting it read at least 30 files.
   It read **138**.

### `src/lib/og/render.ts`

`renderOgPixels(frame)`: a 243-byte screen-order RGB pad frame into a 1200 x 630 RGB buffer, pure,
**zero imports**. The composition is 05-UI-SPEC's table, row by row:

| Property | Implementation |
|---|---|
| Ground | the buffer is zero-initialised, and `#000000` is zero |
| Face | 468 x 468 at `(1200 - 468) / 2, (630 - 468) / 2` = 366, 81 — centred at (600, 315) |
| Cells | 52px pitch; a lit cell fills 48 x 48 at a 2px offset; the gutter is simply not painted |
| Lit colour | `frame[3n]`, `frame[3n+1]`, `frame[3n+2]`, copied — the same bytes and the same lit test as `paint.ts` |
| Unlit | a 6px dot at the cell's centre in `flattenOnBlack(ACCENT_RGB, 0.2)` |
| Frame | 484 x 484 at 358, 73; the outer round at radius 12 minus the same shape inset 2px at radius 10; `flattenOnBlack(ACCENT_RGB, 0.4)` |
| Text, grain, glow, gradient | none |

`OG_TICK = 64` is exported with the reason beside it: it is the representative frame Phase 4 already
contracted for `prefers-reduced-motion`, so the unfurled still and the still preview show the same
thing, and a future change of tick is a diffable decision rather than a mystery.

The header states the rule the module exists to keep — no colour in this image was authored by
anything but the simulator or the identity ladder — and explains why the function reproduces the
*recipe* rather than the DOM: three of `PadCanvas.svelte`'s four layers are CSS gradients and a
border, and none of them exists in Node.

### `src/lib/og/render.spec.ts` — 4 tests

1. The buffer is exactly `1200 * 630 * 3`, and **all 756,000 pixels outside the frame's bounding box
   are checked exhaustively** for `#000000` — "the ground is black" is the one claim a spot check
   cannot make. Plus the 243-byte refusal.
2. A lit cell's three firmware bytes appear unmodified at the block's four corners and its centre,
   and the gutter around it is still the ground, so the block really is 48 wide.
3. `ACCENT_RGB` is `[0xd6, 0xff, 0x4e]`, `flattenOnBlack` at 0.20 and 0.40 equal the UI spec's
   `#2b3310` and `#56661f`, **and the accent and both alphas are read out of `src/app.css`** and
   asserted equal to the module's — so the identity ladder and the image cannot drift. Then the dot
   itself: lit at the centre, lit at the sixth pixel across, black at the seventh, black at the
   block's corner.
4. The geometry, sampled at literal coordinates this spec restates from the UI spec rather than
   importing: the face's first and last painted pixel, its gutters, all four corner cells, the 52px
   pitch on both axes, both 2px stroke edges with black at the third pixel in, and the rounded
   corner — `(358, 73)` is outside the radius-12 round and therefore black.

## Deviations from Plan

**1. [Rule 2 — missing correctness guard] `renderOgPixels` refuses a frame that is not 243 bytes.**

- **Found during:** Task 2.
- **Issue:** the plan specifies the signature and four tests but no input validation. A short frame
  would read `undefined` past its end, which a `Uint8Array` store silently coerces to `0` — a
  half-painted pad, rendered, encoded and shipped with no error anywhere.
- **Fix:** a named throw, asserted inside test 1, which already owns the size contract from the
  output side. The plan's exact test count is unchanged and there is no untested branch.
- **Files:** `src/lib/og/render.ts`, `src/lib/og/render.spec.ts`. **Commit:** `10405ac`.

**2. [scope, recorded not fixed] 05-VALIDATION's "not black" tripwire is vacuous as written.**

Measured above: `tpad` rests at 243 zero bytes and still encodes to 4,192 bytes, because the dot
field and the frame stroke are in every image. `build.spec.ts`'s planned "at least one non-black
pixel" assertion therefore passes on a renderer that dropped every LED. This plan owns neither
`build.spec.ts` nor the script, so nothing was changed here; the correction is written into
`key-decisions` for 05-07, which is the plan that will write that test.

**3. [addition, inside the plan's own intent] the flattened colours are held against `src/app.css`.**

The plan requires the two structural colours to be computed rather than typed, and the spec to assert
the computed values equal the UI spec's hexes. Test 3 does that and one thing more: it reads
`--color-accent`, `--color-line` and `--color-line-soft` out of `src/app.css` and asserts the
module's channels and alphas are those. Without it, an edit to the token would leave the image on the
old identity with every test still green — which is the drift the plan's own sentence ("the identity
ladder and the image cannot drift") is trying to prevent.

Nothing else deviated. No dependency was added, no vendored file was touched, no route or component
imports `$lib/og`, `svelte.config.js` and `+page.ts` are untouched, and `scripts/gen-og.mjs` — 05-07's
job — does not exist.

## Commits

| Task | Commit | What |
|---|---|---|
| 5-06-01 | `9d4260b` | `feat(05-06): a PNG encoder over node:zlib alone, verified byte by byte` |
| 5-06-02 | `10405ac` | `feat(05-06): renderOgPixels - the pad at 1200x630, with no invented colour` |

## For plan 05-07

- `renderOgPixels` and `encodePng` are the two calls; the whole script is
  `createEngine(entry) -> run(OG_TICK) -> renderOgPixels(engine.frame) -> encodePng(px, OG_WIDTH,
  OG_HEIGHT) -> writeFileSync`. Measured end to end at 896 ms of Vite boot plus milliseconds per
  entry.
- Import `OG_WIDTH`, `OG_HEIGHT` and `OG_TICK` from `render.ts` rather than restating 1200, 630 and
  64 in the script.
- A **Lua** entry's engine is `async` and needs the wasmoon VM; the eight routed entries should be
  checked for which route each takes before the script assumes `PadSim`.
- The "not black" assertion needs the correction in `key-decisions` above.
- `png.spec.ts` test 5 exempts `src/lib/og/` and expects `scripts/` to be the only other importer —
  `scripts/` is not scanned at all, so `scripts/gen-og.mjs` needs no change to that test.

## Self-Check: PASSED

All four created files exist on disk; both commit hashes resolve in `git log`; `scripts/gen-og.mjs`
is correctly absent (05-07's job); the working tree carries nothing but this SUMMARY.
