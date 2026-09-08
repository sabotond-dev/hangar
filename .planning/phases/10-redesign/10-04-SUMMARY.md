---
phase: 10-redesign
plan: 04
subsystem: ui
tags:
  [
    crt,
    glitch,
    ident-01,
    ident-02,
    d-07,
    layer-scoping,
    off-switch,
    aesthetic-scans,
    compositor-assertions,
    measurement,
  ]

requires:
  - phase: 10-redesign
    plan: 01
    provides: aesthetic.spec.ts with scan 4 and its five parse helpers, and the 10 rules / 25 declarations floor the file actually parses to
  - phase: 10-redesign
    plan: 02
    provides: --crt-scanline at :root in src/app.css, the widened rgb() regex that admits the ground at an alpha, and negative check 4's open finding
  - phase: 10-redesign
    plan: 03
    provides: PREV_FILES 76 / PREV_TESTS 787 / PREV_E2E 89 / BASE_CHECK 570
provides:
  - "Four CRT layers - G the page ground, S the pad frames' scanlines, R one roll bar, T the tear - none of them an ancestor of .band or .stage, and none able to reach a text node"
  - "The .crt-band shell in FrontDoor.svelte, bound to .band's box by five literals asserted string-equal across two files"
  - "SCREEN: TEXTURED / FLAT in the footer on every route, one attribute on <html>, persisted at hangar.screen.v1"
  - "aesthetic.spec.ts at seven scans - the six this plan adds each in the same commit as the layer it gates"
  - "e2e/aesthetic.e2e.ts - four titles, both projects, eight tests, each with its non-vacuity assertion first"
  - "10-02's negative check 4 re-run and RED, with identity.spec.ts still green: the hole that plan left open is closed"
  - "PREV_FILES 76, PREV_TESTS 793, PREV_E2E 97, BASE_CHECK 571 - the carry-forward block for 10-05 onward"
affects:
  [10-05, 10-06, 10-09, 10-12, 10-13, 10-14, identity, motion, performance]

tech-stack:
  added: []
  patterns:
    - "A gate that reads ONE file cannot see a colour written into another: every --crt custom property is declared in src/app.css, with the one exception asserted from both sides"
    - "A colour percent-encoded inside a data-URI is invisible to a hex walk, so a GREEN reading from that gate is uninformative rather than reassuring - proved by writing fill='%23ff0000' into the tile and watching seven pass"
    - "An animation declared at rest and PAUSED is what makes a reduced-motion assertion mean something: animationName reads crt-tear at rest and none under reduced motion, instead of none in both states"
    - "A declared fallback that ships without a gate is a comment - the measured Layer S scoping is asserted in the browser, not just recorded in a summary"

key-files:
  created:
    - src/lib/ui/ScreenToggle.svelte
    - e2e/aesthetic.e2e.ts
  modified:
    - src/app.css
    - src/lib/ui/PadFrame.svelte
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/aesthetic.spec.ts
    - src/lib/device/session.svelte.ts
    - src/routes/+layout.svelte
    - .planning/phases/10-redesign/deferred-items.md
  deleted: []

key-decisions:
  - "The noise tile lives in PadFrame.svelte and not in src/app.css, and the reason was OBSERVED: identity.spec.ts is green with the tile there AND green with a pure red hidden inside it"
  - "Layer S is scoped to the front door's seven frames - 10-UI-SPEC 8.5's declared fallback, applied because webkit-phone measured a 61 ms p95 delta against a 2 ms threshold"
  - "Layer G's vignette is a radial-gradient, not an inset box-shadow: the blur cost 105 ms per scrolled frame at p95 on webkit-phone where the spec says Layer G is free"
  - "Scan 1 carries a half 10-UI-SPEC 8.7 did not ask for, because the half it does ask for cannot catch the hole 10-02 measured"
  - "The tear's animation is armed and paused at rest, so the reduced-motion gate reads a real difference at the compositor rather than none in both states"
  - "prefers-reduced-motion is read ONCE for the SCREEN default and never subscribed to: the host's live subscription is private and per-instance, and a live read would flip a visitor's own choice"

patterns-established:
  - "Long content goes through the Write tool: a heredoc halved a double backslash and turned a word boundary into a backspace character, and the check it was in matched nothing while claiming an element was missing"
  - "A cost claim in a spec is re-measured when the thing it is about ships, and a decomposition is recorded even when the residual is left alone"

requirements-completed: [IDENT-01, IDENT-02]

duration: 105min
completed: 2026-09-08
---

# Phase 10 Plan 04: The CRT, placed so it cannot reach a word Summary

**Four CRT layers ship behind one attribute on `<html>`, with a visible `SCREEN` control on every
route; `Coverflow.svelte` is byte-untouched and its three load-bearing rules are asserted in both
directions; and 10-02's negative check 4 — the one that left both gates green on a colour hidden in
a component — now goes red and names the file. Two cost claims in the UI spec were re-measured and
one of them was false: Layer G's inset-blur vignette cost 105 ms per scrolled frame at p95 on
webkit-phone where §8.5 calls it "zero by construction". 76 files / 793 tests (+6), 97 e2e (+8).**

## Performance

- **Duration:** ~105 min
- **Completed:** 2026-09-08
- **Tasks:** 3
- **Files created:** 2 · **Files modified:** 7 · **Files deleted:** 0

---

## THE ELEVEN-NAME BLOCK, CARRIED

| Name              | Carried in | Leaves as  | Note                                                              |
| ----------------- | ---------- | ---------- | ----------------------------------------------------------------- |
| `BASE_FILES`      | **74**     | **74**     | frozen at 10-01                                                   |
| `BASE_TESTS`      | **780**    | **780**    | frozen at 10-01                                                   |
| `PREV_FILES`      | **76**     | **76**     | **+0** — the six new tests all land in `aesthetic.spec.ts`        |
| `PREV_TESTS`      | **787**    | **793**    | **+6** — `aesthetic.spec.ts` 1 → 7                                |
| `BASE_SWEEP`      | **`4 19`** | **`4 19`** | not run; this plan touches no sweep input                         |
| `BASE_SWEEP_WALL` | **123 s**  | **123 s**  | unchanged                                                         |
| `PREV_SWEEP_WALL` | **123 s**  | **123 s**  | unchanged                                                         |
| `BASE_E2E`        | **89**     | **89**     | frozen at 10-01                                                   |
| `PREV_E2E`        | **89**     | **97**     | **+8** — four titles × two projects, re-measured at `--workers 3` |
| `BASE_CHECK`      | **570**    | **571**    | **+1**: `ScreenToggle.svelte` created. Always 0 / 0               |
| `CH_PER_LINE`     | **43**     | **43**     | spent, not re-measured                                            |
| `FONT_SRC`        | **(b)**    | **(b)**    | untouched                                                         |

`npm run check` prints one line:
`COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.

---

## 10-02's negative check 4, re-run — and it is now RED

**This was the live instruction carried into this plan, and it is the first thing to report.**

10-02 moved `--crt-scanline` out of `src/app.css` and into `PadFrame.svelte`'s `<style>` and watched
`identity.spec.ts` pass all seven and `aesthetic.spec.ts` pass its one scan. `10-VALIDATION.md:486`
expects that row to read *"`identity.spec.ts` green and `aesthetic.spec.ts` **red**"*, and 10-02
recorded the correction: the scans that would catch it arrive here.

Re-run against this plan's tree, at the exact same perturbation:

| Gate                    | Result                | Message                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity.spec.ts`      | **green, 7 passed**   | (as 10-02 recorded, and as it should be — that file reads one file)                                                                                                                                                                                                                                                                                                                            |
| `aesthetic.spec.ts` scan 1 | **RED, 1 failed / 4 passed** | *"`--crt-scanline` is declared in src/lib/ui/PadFrame.svelte. Every CRT custom property is declared in src/app.css, the one file identity.spec.ts reads … which plan 10-02 observed directly (its negative check 4 left identity.spec.ts green on exactly this move). The rule is 10-UI-SPEC 7.1's, and this is where it is held."* |

`sha256` before and after: `src/app.css` `458037ed780aa83458b6572c758d2ef627dc2a139b014d2c0d26f4adcb51b6c9`,
`src/lib/ui/PadFrame.svelte` `fa9e7b50efe992cfa1269131a1f90f80ef5b971729bb50090b48d07e3155b68b`.
Identical both times, restored by inverse edit.

**But the scan as 10-UI-SPEC §8.7 words it would NOT have caught this, and that is worth saying
plainly.** §8.7 states scan 1 as *"the four layer selectors appear only in an explicit allowlist of
files"*. `PadFrame.svelte` is on that allowlist. So the selector half of the scan is satisfied by
the very move that hides the colour, and the first version of scan 1 written for this plan was
green on the perturbation. Scan 1 therefore also holds 10-UI-SPEC §7.1's **placement** rule:

1. every `--crt` custom property is declared in `src/app.css` — the one file `identity.spec.ts`
   reads — with `--crt-noise` as the single named exception, asserted from **both** sides (it IS in
   `PadFrame.svelte` and it is NOT in `app.css`); and
2. no CRT rule outside that file writes a colour literal at all, `mask-image` excepted, because a
   colour in a mask is opacity rather than paint — and scan 7 additionally pins that gradient
   byte-equal to `Coverflow.svelte`'s, so it cannot drift into a hue.

---

## The Layer S measurement, taken twice, with its verdict

### Take 1 — injected, before Layer S's selector was written (V-02)

Against the shipped `/browse/` at thirty-six entries, `chromium` and `webkit` at an iPhone 15
viewport, a throwaway Playwright script in the scratchpad. Arm A injected the exact two background
layers at **document-start** rather than through `page.addStyleTag`; arm B is the `SCREEN: FLAT`
arm. Median of three runs per arm, p95 of `requestAnimationFrame` deltas across a full scroll down
and back.

| Engine           | Arm                   | first paint | p95 frame time | frames sampled |
| ---------------- | --------------------- | ----------- | -------------- | -------------- |
| **chromium**     | A — Layer S injected  | **292 ms**  | **16.70 ms**   | 361            |
| **chromium**     | B — `SCREEN: FLAT`    | **280 ms**  | **16.70 ms**   | 359            |
| **webkit-phone** | A — Layer S injected  | **505 ms**  | **139.00 ms**  | 62             |
| **webkit-phone** | B — `SCREEN: FLAT`    | **389 ms**  | **76.00 ms**   | 131            |

**The eight numbers, and the deltas: chromium `0.00 ms` at p95; webkit-phone `63.00 ms`.**

The plan's prescribed selector, `[data-testid^="pad-"]::after`, also matches the 36 `<canvas>`
elements — `pad-canvas-*` — so the run was repeated with
`div[data-testid^="pad-"]:not([data-testid^="pad-canvas-"])::after`. The confound is worth about
2 ms: **138.00 ms against 77.00 ms, a delta of 61.00 ms**, with the sampled frame count halving
from 128 to 65.

### The verdict, stated explicitly: **OVER 2 ms. The declared fallback applies.**

§8.5: *"If the delta exceeds 2 ms at the 95th percentile, Layer S is scoped to the front door's
seven frames only and the browse grid keeps Layer G alone."* One of the two engines exceeds it by a
factor of thirty. Layer S's selector is `:global(.front-door) .pad::after` — one line, in
`PadFrame.svelte`, with the numbers written above it.

### Take 2 — re-taken against the real `SCREEN` control, and reconciled

| Surface    | Engine           | `SCREEN: TEXTURED` p95 | `SCREEN: FLAT` p95 | delta       |
| ---------- | ---------------- | ---------------------- | ------------------ | ----------- |
| `/browse/` | chromium         | 16.80 ms               | 16.70 ms           | **0.10 ms** |
| `/browse/` | webkit-phone     | 202.00 ms              | 79.00 ms           | 123.00 ms   |
| `/`        | chromium         | 16.80 ms               | 16.70 ms           | **0.10 ms** |
| `/`        | webkit-phone     | 294.00 ms              | 117.00 ms          | 177.00 ms   |

**The verdict did not change, and the re-take is NOT comparable to take 1 in the way the plan
assumed — which is itself the finding.** Take 1's arm B was a page with no CRT at all, so its delta
isolated Layer S. Take 2's arms are the whole treatment against nothing: on `/browse/` that is
Layer G alone (Layer S is not there any more — `getComputedStyle(pad, "::after").content` reads
`none` in both arms, printed by the script), and on `/` it is G plus S plus R plus T.

So the 123 ms on `/browse/` cannot be Layer S. It is Layer G, and §8.5 says Layer G is free.

---

## The cost claim that was false, and the fix

§8.5's table: *"**G** — Zero by construction. Two static backgrounds and one inset shadow,
rasterised once."* Four arms on `/browse/`, webkit at a phone viewport, each arm's `SCREEN` state
and each of Layer G's two computed properties read **after** the settle so the arm is proved rather
than assumed:

| Arm                                       | p95           | frames | over the FLAT baseline |
| ----------------------------------------- | ------------- | ------ | ---------------------- |
| 1 — `SCREEN: FLAT`, no Layer G             | **79.00 ms**  | 102    | —                      |
| 2 — as first shipped                       | **196.00 ms** | 39     | +117 ms                |
| 3 — same page, `box-shadow` forced off     | **101.00 ms** | 84     | +22 ms                 |
| 4 — same page, `background-image` forced off | **184.00 ms** | 42     | +105 ms                |

**The `box-shadow: inset 0 0 26vmax 9vmax` was 105 of the 117 milliseconds**, re-rastered every
scrolled frame rather than once. Chromium measured **16.70–16.80 ms in every one of the four arms** —
no cost at all.

**Fixed (Rule 1).** The vignette is now a `radial-gradient` in the same `background-image` list,
carrying the identical picture with no blur pass, and `will-change: transform` gives the
pseudo-element its own compositor layer so a scroll composites it instead of repainting it —
which is exactly the one viewport-sized surface §8.5 already budgets for this layer. Re-measured on
the same four arms after the fix: **101.00 ms** where it had been 196, against a FLAT baseline of
**78.00 ms**. Chromium unchanged at 16.70 ms.

**The residual, decomposed and deferred rather than quietly left:** the 3px-pitch halftone is
**+22 ms** and the gradient vignette **+10 ms**, both on one engine, on a harness already running at
about 13 fps with thirty-six animating canvases, and §8.5's 2 ms threshold is written about **Layer
S** — there is no declared rule for Layer G, and inventing one to scope the site's ground texture
off its busiest page on a harness artefact would be a design change made by a benchmark. Logged in
`deferred-items.md` with its three options.

---

## The noise tile's home, and which gate decided it

The plan asked for the tile to be declared as `--crt-noise` at `:root` in `src/app.css` and for
`identity.spec.ts` to be run immediately. It was, and the answer came in two parts.

| Step                                                                                 | `identity.spec.ts` |
| ------------------------------------------------------------------------------------ | ------------------ |
| the tile declared at `:root` in `src/app.css`, `url(%23crtNoise)` and all             | **7 passed**       |
| the same tile with `fill='%23ff0000'` — a pure red, a fourth hue — written into it    | **7 passed**       |

**The gate stayed green with a fourth hue inside the file it guards.** That file's hex walk matches
a literal `#`, and a percent-encoded one is not one. So the green reading is uninformative rather
than reassuring — which is precisely the silent-green hole 10-UI-SPEC §7.1's placement rule exists
to close, and precisely why `<interfaces>` says the tile *"lives in `PadFrame.svelte` and never in
`src/app.css`"*.

**The tile therefore lives in `PadFrame.svelte`, Layer G keeps the halftone and the vignette and has
no noise, and `aesthetic.spec.ts` scan 6 is the gate that decided it** — it reads the tile and
asserts it declares no `fill` in any of four spellings, so the filter's own output is the only thing
that may colour a pixel of it. Both runs are recorded in `src/app.css`'s and `PadFrame.svelte`'s own
comments, where the next person to be tempted will read them.

---

## The seven scans, and what each one catches

| # | Scan                                                                             | Catches                                                                                                                        |
| - | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1 | the CRT vocabulary appears only inside its allowlist — **plus** the placement rule | a fifth surface growing a CRT rule; a `--crt` colour moved into a component where no colour gate can see it (**10-02's check 4**) |
| 2 | every layer declares `pointer-events: none`; R and T are on `aria-hidden` elements | a decorative overlay that swallows a click, or a decorative box read out in somebody's reading order                            |
| 3 | no text-bearing element is a descendant of a CRT container                        | a `<p>` put inside `.crt-band`; a text-bearing tag arriving in `PadFrame`; a CRT layer declared on the SCREEN control itself     |
| 4 | `Coverflow.svelte` in both directions (10-01's)                                    | a grouping property added to `.stage`; the band's `overflow: clip` or `mask-image` **deleted** by a tidy-up                      |
| 5 | no CRT selector names a `canvas`                                                  | a fidelity violation — `paint.ts:17-35`'s rule, held as source structure                                                        |
| 6 | the noise tile declares no `fill`                                                 | a hue smuggled into a data-URI, where `identity.spec.ts` provably cannot see it                                                 |
| 7 | `.crt-band`'s five literals are string-equal to `.band`'s                         | a change to one file that is not made to the other — the shell slipping out of register with the pads                           |

Scan 1's floor asserts each of the seven vocabulary words is really present somewhere in the
allowlist, so a renamed layer is red rather than a walk that passes on an empty search. Scan 3's
allowlist is asserted in **both** directions: every CRT component has a row, and no row names a file
that is not a CRT component.

---

## Task Commits

1. **Task 10-04-01: Layers G and S behind the `--crt` gate, and scans 1, 2, 5, 6** — `ec12c5c` (feat).
2. **Task 10-04-02: the `.crt-band` shell, Layers R and T, `ScreenToggle`, scans 3 and 7** — `755b83c` (feat).
3. **Task 10-04-03: `e2e/aesthetic.e2e.ts`, and the Layer G cost it turned up** — `cec5f49` (test).

---

## Negative checks — six planned, six observed red

| # | Perturbation                                                             | Test                        | Exit | Message                                                                                                                                                |
| - | ------------------------------------------------------------------------ | --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | `--crt-scanline` moved from `app.css` into `PadFrame.svelte`'s `<style>` | `aesthetic.spec.ts` scan 1  | 1    | *"`--crt-scanline` is declared in src/lib/ui/PadFrame.svelte. Every CRT custom property is declared in src/app.css, the one file identity.spec.ts reads"* |
| 1b | the same, read on the other gate                                         | `identity.spec.ts`          | 0    | **green, 7 passed** — the pair `10-VALIDATION:486` predicts, both halves now observed                                                                   |
| 2 | `.crt-band`'s `clamp(260px, 52vmin, 560px)` changed to `50vmin`          | `aesthetic.spec.ts` scan 7  | 1    | *"the hero pad size DIFFERS between the two files. Coverflow.svelte's .band says "clamp(260px, 52vmin, 560px)" and FrontDoor.svelte's .crt-band says …"*  |
| 3 | `<p>Hello</p>` added inside `.crt-band`                                  | `aesthetic.spec.ts` scan 3  | 1    | *"a text-bearing element is a descendant of .crt-band. The condition this file is allowlisted under is: …"* — the condition quoted in the failure         |
| 4 | `opacity: 0.99` added to `.stage` in `Coverflow.svelte`                  | `aesthetic.spec.ts` scan 4  | 1    | *"SOMETHING WAS ADDED: Coverflow.svelte declares "opacity: 0.99" on ".stage". An opacity below 1 groups, and grouping flattens the ladder."*              |
| 5 | the `hardwareConcurrency` forcing removed from e2e test 1, run at 4      | `e2e/aesthetic.e2e.ts` t1   | 1    | *"the roll bar is in the DOM, so there is an animation to stop — Expected: > 0, Received: 0"*                                                             |
| 6 | `fill='%23ff0000'` written into the noise tile inside `src/app.css`      | `identity.spec.ts`          | **0** | **green, 7 passed** — the finding, and the reason the tile may not live there                                                                           |

**Restoration, byte-identical, stated rather than assumed.** Every perturbed file's `sha256` was
taken before and after:

- `src/app.css` — `458037ed780aa83458b6572c758d2ef627dc2a139b014d2c0d26f4adcb51b6c9` before and after
  checks 1 and 6.
- `src/lib/ui/PadFrame.svelte` — `fa9e7b50efe992cfa1269131a1f90f80ef5b971729bb50090b48d07e3155b68b`
  before and after check 1.
- `src/lib/ui/FrontDoor.svelte` — `9e860d8b5e1d11b0a9f1bd9e5a6b78d8ab3c2b44b9c904075950664130de772c`
  before and after checks 2 and 3.
- `src/lib/ui/Coverflow.svelte` — `a5c4b519cd51a0ada07bf889bc42b549f9f7e8dc0d0fd81c94f96b29965e37e2`
  before and after check 4. `git checkout --` was used for this one and only this one, and only
  because the file was committed and clean.
- `e2e/aesthetic.e2e.ts` — `f0308fe7f7c1959578cf900534cc9e047db0ab8434afefd7161407c6d8d4d56a`
  before and after check 5.

---

## `Coverflow.svelte`, untouched, proved

```
$ git diff --stat 123f42c HEAD -- src/lib/ui/Coverflow.svelte src/vendor/
(no output)
```

Taken at the plan's base commit against its head, so it covers all three task commits rather than
the last one. `git diff --stat HEAD -- src/lib/ui/Coverflow.svelte` was also run and was empty at
the end of every task.

---

## The four layers as shipped

| z  | Layer | Where                                                | Off under FLAT by         | Off under reduced motion |
| -- | ----- | ---------------------------------------------------- | ------------------------- | ------------------------ |
| −1 | **G** | `body::before` in `src/app.css`                      | `background-image: none`  | not applicable — static  |
| 3  | **S** | `:global(.front-door) .pad::after` in `PadFrame.svelte` | `content: none`         | not applicable — static  |
| 4  | **R** | `.crt-roll`, a real `<div>` inside `.crt-band`        | **not mounted at all**    | `animation: none`        |
| 5  | **T** | `.crt-band::after`                                     | `content: none`           | `animation: none`        |

None of the four is set on `.stage`, and none is an element between `.stage` and a `.slot`. G is
behind all content and an ancestor of nothing; S is a leaf inside a slot, in the position
`filter: brightness()` already legally occupies; R and T are bound to `.band`'s box through a shell
that is a **sibling** of the whole Coverflow output.

**The three switches, all three asserted in the browser:**

| # | Switch                                    | Reaches                | Gate                                    |
| - | ----------------------------------------- | ---------------------- | --------------------------------------- |
| 1 | `prefers-reduced-motion: reduce`          | R's and T's `animation` | e2e test 1, `animationName === "none"`  |
| 2 | `SCREEN: TEXTURED · FLAT`, `hangar.screen.v1` | **all four layers** | e2e test 2, present-then-absent          |
| 3 | `navigator.hardwareConcurrency <= 4`      | R does not mount        | e2e test 4, at a forced 4               |

The tear fires on `navigator.serial`'s `connect` and on nothing else, through a `plugged` counter
incremented in `#onSerialConnect` past its two guards. `grep -c "filter:" src/lib/ui/FrontDoor.svelte`
reports **0**; the only two occurrences of the string `filter` in that file are prose in comments
explaining its absence.

---

## Verification

| Gate                                                                    | Result                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run check 2>&1 \| grep -Ei "error\|warning"`                        | one line: `COMPLETED 571 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`  |
| `npm run lint`                                                          | clean — Prettier and ESLint                                               |
| `npm run test:quick … check-counts.mjs 76 793`                          | *"observed 76 files, 793 tests passed, 1 todo … matches the expected counts"* — **+0 / +6** |
| per-file                                                                | `aesthetic.spec.ts` **7**, `identity.spec.ts` **7**                       |
| `npx playwright test --workers 3`                                       | **97 passed**, 1.9 min — `PREV_E2E` **89 + 8**                            |
| `npx playwright test e2e/aesthetic.e2e.ts --workers 3`                  | **8 passed** — four titles in chromium and four in webkit-phone           |
| `npm run build`                                                         | green; `source-755b83ce….tar.gz` 1,260 KB                                 |
| `npm run test:quick` after the build                                    | 76 / 793 again                                                            |
| `git diff --stat 123f42c HEAD -- src/lib/ui/Coverflow.svelte src/vendor/` | empty                                                                   |
| `git status --porcelain`                                                | empty. `test-results/` removed by hand                                    |

---

## Decisions Made

1. **The noise tile lives in `PadFrame.svelte`.** Decided by running `identity.spec.ts` twice, not
   by assumption: green with the tile in `app.css`, and green again with a pure red hidden inside
   it. A gate that cannot see a thing does not license it.
2. **Layer S is scoped to the front door.** 10-UI-SPEC §8.5's declared fallback, applied because
   webkit-phone measured 61 ms against a 2 ms threshold. Held by an assertion in `e2e`, not only by
   a number in this document.
3. **Layer G's vignette is a gradient, not an inset blur.** The spec's cost claim for that layer was
   measured and was false on one of the two engines.
4. **Scan 1 holds the placement rule as well as the allowlist**, because the allowlist alone is
   satisfied by exactly the move 10-02 measured.
5. **The tear's animation is declared at rest and paused.** Without it, `animationName` reads `none`
   both with and without reduced motion and gate 1 asserts nothing. The price is that the shell is
   re-keyed per arrival so a finished animation can replay; at one rebuild per physical plug-in that
   is a fair price, and it restarts the roll bar's sweep at the same moment, which is arguably the
   right picture.
6. **`prefers-reduced-motion` is read once for the SCREEN default and never subscribed to.**
7. **The measured Layer S fallback is gated inside e2e test 3 rather than in a fifth title**, so the
   file's four-title contract and its `+8` delta both hold and the decision still has a gate.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — bug] Layer G's inset-blur vignette cost 105 ms per scrolled frame at p95 on webkit-phone**

- **Found during:** Task 10-04-03, in the re-take of the Layer S measurement
- **Issue:** 10-UI-SPEC §8.5 records Layer G as "zero by construction … rasterised once". Measured
  on `/browse/`, the `box-shadow: inset 0 0 26vmax 9vmax` took p95 from 79 ms to 184 ms with the
  halftone removed — a blur re-rastered every scrolled frame over the whole viewport, which is the
  same class of mistake `CLAUDE.md`'s "What NOT to use" table names for `ctx.shadowBlur`.
- **Fix:** the vignette is a `radial-gradient` in the same `background-image` list, and the
  pseudo-element carries `will-change: transform` so a scroll composites it. Re-measured: 101 ms
  against a FLAT baseline of 78 ms, down from 196 ms. Chromium unchanged at 16.70 ms throughout.
- **Files modified:** `src/app.css`
- **Committed in:** `cec5f49`

**2. [Rule 2 — missing critical functionality] scan 1 as the spec words it does not close 10-02's hole**

- **Found during:** Task 10-04-01
- **Issue:** §8.7 states scan 1 as an allowlist of FILES for layer SELECTORS. `PadFrame.svelte` is
  on that allowlist, so moving `--crt-scanline` into it satisfies the scan — the first version
  written for this plan was green on the perturbation, which is the exact hole this plan was told to
  close.
- **Fix:** scan 1 also holds §7.1's placement rule, in two parts, with `--crt-noise` as the one
  named exception asserted from both sides and `mask-image` as the one colour-literal exception with
  its reason.
- **Files modified:** `src/lib/ui/aesthetic.spec.ts`
- **Committed in:** `ec12c5c`

**3. [Rule 3 — blocking] `--crt-roll` had to enter `src/app.css`, which is not in task 2's file list**

- **Found during:** Task 10-04-02
- **Issue:** Layers R and T are painted in `FrontDoor.svelte`, and scan 1's own new rule forbids a
  CRT colour literal outside `app.css`. The task could not be completed without either weakening the
  rule it had just shipped or adding the token.
- **Fix:** `--crt-roll: rgb(214 255 78 / 0.05)` at `:root` beside `--crt-scanline`, with the reason
  written into that file's comment. It is the accent at the reference implementation's alpha; the
  reference's own cold blue would have been a fourth colour.
- **Files modified:** `src/app.css`
- **Committed in:** `755b83c`

**4. [Rule 3 — blocking] the reduced-motion source the plan names is unreachable**

- **Found during:** Task 10-04-02
- **Issue:** The plan requires Switch 1's JS half to be read "through the host's existing live
  `matchMedia` subscription … never a second one-off". There is no singleton: `Coverflow.svelte` and
  `BrowseGrid.svelte` each construct their own `SimHost`, `reduced` is a private field, and
  `ScreenToggle` mounts in `+layout.svelte` where no host exists at all. Reaching it would mean
  editing `Coverflow.svelte`, which this phase forbids.
- **Fix:** a ONE-SHOT `matchMedia(...).matches` read that picks the default and attaches nothing.
  The live half of Switch 1 is entirely in CSS, where the media query needs no JavaScript to stay
  current. This is also the better behaviour: a live subscription would flip a visitor's own
  explicit choice the moment the OS setting changed.
- **Files modified:** `src/lib/ui/ScreenToggle.svelte`
- **Committed in:** `755b83c`

**5. [Rule 1 — bug] a heredoc halved a double backslash and turned a word boundary into a backspace**

- **Found during:** Task 10-04-02
- **Issue:** Scan 2's aria-hidden check was appended through a shell heredoc as
  `` `…class="[^"]*\\b${name}\\b[^"]*"…` ``. It arrived on disk as `\b` inside a TEMPLATE LITERAL,
  which is the backspace character rather than a word boundary. The check matched nothing and
  reported that Layer R's element was missing — a gate that was red for a reason that had nothing to
  do with the code.
- **Fix:** the check is a scan rather than a regular expression, with the reason written above it,
  and every other backslash in the file was audited line by line (exactly one was wrong). The
  standing rule — long content through the Write tool, never a heredoc — is now the file's own
  documented discipline as well.
- **Files modified:** `src/lib/ui/aesthetic.spec.ts`
- **Committed in:** `755b83c`

**6. [Rule 1 — bug] one read of `data-screen` after a reload is a race, and it lost on webkit-phone**

- **Found during:** Task 10-04-03
- **Issue:** e2e test 3 read the attribute once after `page.reload()`. Every route is prerendered
  and the static HTML carries no attribute, so there is a window — one frame or two — before
  `ScreenToggle.svelte`'s module scope writes it. The read returned `null` on webkit-phone and
  `"flat"` on chromium, purely on timing.
- **Fix:** the assertion is an `expect.poll` and says "once this page has hydrated", which is the
  claim the test is actually making. The underlying window is a real if small flaw, recorded in
  `ScreenToggle.svelte`'s header and in `deferred-items.md` with its one-line fix costed.
- **Files modified:** `e2e/aesthetic.e2e.ts`, `src/lib/ui/ScreenToggle.svelte`
- **Committed in:** `cec5f49`

**7. [Rule 2 — missing critical functionality] the measured Layer S fallback shipped with no gate**

- **Found during:** Task 10-04-03
- **Issue:** Scoping Layer S off `/browse/` is a decision made by a measurement, and nothing
  anywhere would have gone red if a later tidy-up unscoped it.
- **Fix:** asserted in `e2e/aesthetic.e2e.ts` test 3 — the browse grid carries Layer G and nothing
  else — rather than in a fifth title, so the plan's four-title contract and its `+8` e2e delta both
  hold. The title says both jobs and a comment says why the second one is there.
- **Files modified:** `e2e/aesthetic.e2e.ts`
- **Committed in:** `cec5f49`

**8. [Rule 3 — blocking] the injected measurement's first-paint half would have been vacuous**

- **Found during:** Task 10-04-01
- **Issue:** The plan specifies `page.addStyleTag` for arm A. That lands after load, so the
  first-paint figure would have been identical in both arms by construction and half the required
  measurement would have measured nothing.
- **Fix:** the arm is injected at document-start through `addInitScript`, so the layers participate
  in the first paint. The injected style element's presence is counted and printed per run, so the
  arm is proved rather than assumed.
- **Files modified:** none shipped — a scratchpad script
- **Committed in:** n/a

---

**Total deviations:** 8 auto-fixed — 3 × Rule 1 (bug), 2 × Rule 2 (missing critical functionality),
3 × Rule 3 (blocking).
**Impact on plan:** No scope creep beyond one file — `src/app.css` was edited in task 3 as well as
tasks 1 and 2, for deviation 1, and it is in the plan's own `files_modified`. Nothing in the
objective was dropped: four layers, one visible control, seven source scans, four browser gates, and
`Coverflow.svelte` byte-untouched.

---

## Issues Encountered

**Two of this plan's own instructions could not both be true, and the conflict is recorded rather
than resolved silently.** The plan's task 1 says to declare the noise tile in `src/app.css` and let
`identity.spec.ts` decide its home, describing the trigger as *"if the tile's encoding contains a
`%23` or a `#`, the hex loop goes red"*. The hex loop does **not** go red on `%23` — measured, twice.
`<interfaces>` is unambiguous the other way (*"the data-URI lives in `PadFrame.svelte` and never in
`src/app.css`"*) and gives the same reason. The tile went to the component, because a gate that
provably cannot see a hue does not license putting one where it cannot be seen.

**The plan's `[data-testid^="pad-"]::after` matches the canvases too.** 72 elements on `/browse/`,
36 divs and 36 canvases. The measurement was re-run with the precise selector; the confound is worth
about 2 ms of the 63.

**Nothing was retried and no run was flaky.** Every number in this document came from a runner's, a
build's or a measurement script's own output in this session. `wrangler dev` held `build/` with
`EPERM` twice and was stopped parents-first — including its two `workerd` children, which do not
match a `wrangler` command-line filter and had to be found by parent id.

---

## Notes for the plans that follow

- **10-05 onward** inherits `PREV_FILES 76` / `PREV_TESTS 793` / `PREV_E2E 97` / `BASE_CHECK 571`.
  All four moved: +6 tests, +8 e2e, +1 check file.
- **A new component that wants any CRT rule** must join `CRT_FILES` in `aesthetic.spec.ts` **and**
  `TEXT_CONDITIONS` if it renders text, and its condition is asserted rather than merely stated.
  Three scans read those two tables.
- **A new CRT colour goes in `src/app.css` as a `--crt-*` property.** Scan 1 is red otherwise, and
  it names the file.
- **`Coverflow.svelte`'s five geometry literals now live in two files.** Scan 7 names both on a
  difference; there is no third place to look.
- **Layer G's halftone residual** (+22 ms at p95 on one engine) and **the one unstyled frame of a
  cold arrival** are both in `deferred-items.md` with their numbers and their options.
- **10-UI-SPEC §8.5's Layer G row should be amended** — "zero by construction" is true of what ships
  now, and was not true of what it described.

## User Setup Required

None. No agent connected to a device, opened a serial port, wrote to a module or deployed anything
in this plan. The `connect` event is exercised through a counter on the session's existing
navigator-level listener and through no hardware.

## Next Phase Readiness

Wave 4 is complete. D-07 is confirmed with an off switch that is two switches and a third that is
automatic, every one of them asserted in both browser projects. The open item 10-03 handed forward —
a colour authored inside a component `<style>` being invisible to every gate the site has — is
closed, observed red, and the observation is written into the file that holds it.

---

_Phase: 10-redesign_
_Completed: 2026-09-08_

## Self-Check: PASSED

All nine files this plan created or modified are on disk, and all three commit hashes resolve in
`git log`: `ec12c5c`, `755b83c`, `cec5f49`.

Every measurement, exit code, sha256, test count and failure message quoted above was read from a
runner's, a build's or a measurement script's own output in this session. The three places where
this plan's result disagrees with an approved document are stated as disagreements and given their
reasons rather than smoothed: 10-UI-SPEC 8.5's "Layer G is zero by construction", which was false on
one of the two engines by 105 ms; 10-UI-SPEC 8.7's wording of scan 1, which cannot catch the hole
this plan was sent to close; and this plan's own instruction that a `%23` inside a data-URI turns
the hex loop red, which it does not - measured twice, once with a pure red hidden inside the tile.
