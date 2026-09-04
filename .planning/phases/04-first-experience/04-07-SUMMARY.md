---
phase: 04-first-experience
plan: 07
subsystem: ui
tags:
  [
    splash,
    glyph-field,
    canvas,
    name-plate,
    fidelity,
    reduced-motion,
    prng,
    PREV-03,
    PREV-05,
    IDENT-01,
    IDENT-02,
    D-03,
    D-06,
    D-14,
    D-17,
    D-20,
  ]
requires:
  - "src/lib/catalog/front-door.ts (04-02) - FrontDoorEntry, its `motion` flag and its `quiet` line"
  - "src/lib/ui/Coverflow.svelte (04-06) - stepBy, the centred index, and the ids it could not build an engine for"
  - "src/lib/ui/FrontDoor.svelte (04-06) - the `splash` prop, declared there and given a body here"
  - "src/lib/sim/host.ts (04-05) - the live matchMedia subscription that stills every engine at tick 64"
  - "src/app.css (04-01) - the eight identity tokens; the field's own alphas sit outside them by declared exemption"
provides:
  - "src/lib/ui/NamePlate.svelte - the row's only navigation, carrying the centred configuration's name and the broken-entry copy"
  - "src/lib/ui/FidelityLine.svelte - PREV-03's constant line plus the centred entry's quiet line when it is not animated"
  - "src/lib/ui/glyph-field.ts - a seeded, deterministic, DOM-free glyph field and its four punched rectangles"
  - "src/lib/ui/glyph-field.spec.ts - 5 tests in the node project"
  - "src/lib/ui/Splash.svelte - the canvas field, the grain, the wordmark, the timing, the skip rules and the reduced-motion path"
  - "e2e/first-experience.e2e.ts - now 6 tests: 04-06's three plus the splash, the skip and reduced motion"
affects:
  - "Plan 04-08 passes NamePlate's already-declared onchoose and gives the name button a body"
  - "Plan 04-09's deep-link route renders <FrontDoor {initialId} /> with no splash prop, which is the whole of D-12"
  - "Plan 04-09's e2e additions extend the same six-test file and must re-pin its per-file count"
tech-stack:
  added: []
  patterns:
    - "The reduced-motion preference read in BOTH halves: a plain @media block for anything expressible in CSS, and svelte/motion's live prefersReducedMotion MediaQuery for the durations only JavaScript can set - a Svelte transition length and a setTimeout"
    - "A generated identity split into a pure module and a painter, so the thing that has to be the same on every load is asserted in node while the canvas work stays in the component"
    - "A published data-phase attribute as the test surface for a timed animation, so a browser test reads a state machine instead of racing a stopwatch"
    - "A flight computed from measured rectangles at the moment it starts, rather than from constants, so the mark lands on wherever the header actually is"
key-files:
  created:
    - src/lib/ui/NamePlate.svelte
    - src/lib/ui/FidelityLine.svelte
    - src/lib/ui/glyph-field.ts
    - src/lib/ui/glyph-field.spec.ts
    - src/lib/ui/Splash.svelte
  modified:
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/FrontDoor.svelte
    - e2e/first-experience.e2e.ts
    - docs/TESTING.md
decisions:
  - "NamePlate takes a fifth prop, `unavailable`, that the plan's interface list omits: the plan requires the plate to render `{name} - unavailable` for an entry whose engine could not be built, and the four declared props carry no way to know that"
  - "Splash takes a second callback, `ondissolve`: the plan requires the header wordmark to reach full strength AS the flight lands, and onfinished alone fires 700 ms too late - the header would pop in after the mark had already arrived"
  - "The name plate's crossfade duration is read from svelte/motion's prefersReducedMotion rather than from a media query, because a Svelte transition's duration is a number and no @media rule can reach it; the subscription is live, which is what IDENT-02 actually asks for"
  - "glyph-field's block extents are a fraction of the viewport rather than a fixed cell count: a mosaic sized in absolute cells is confetti at 1920px and a solid wall on a phone. Block coverage is now ~52% of the viewport at every width tested"
  - "buildField returns a third key, `blocks`, so the contract's own 6-to-10 block count is assertable; the declared {cells, rects} return reveals nothing about it"
  - "The plate reads Coverflow's `skipped` rune directly rather than round-tripping through the onskipped callback prop: both live in the same component, and the callback stays for FrontDoor's future use"
metrics:
  duration: 38 min
  tasks: 3
  files: 9
  completed: 2026-09-04
---

# Phase 4 Plan 07: The Name Plate, the Fidelity Line and the Opening Summary

The front door now opens the way the brief describes: a seeded glyph-field HANGAR wordmark holds for a
beat over a coverflow that has been running since the first frame, then dissolves while the mark flies
into the header, leaving a named, steppable row with one quiet line under it that says exactly what a
screen cannot show — and a visitor who asks for less motion gets the same screen, lit, still and
instantly steppable.

---

## Suite totals — observed

**Previous end state, from 04-06-SUMMARY:** quick **36 files / 527 passed | 1 todo**, sweep
**1 file / 9**, e2e **13**.

**Re-measured on this machine before this plan touched anything:**

```
npm run test:quick
 Test Files  36 passed (36)
      Tests  527 passed | 1 todo (528)
```

It reproduced 04-06's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  37 files, 532 passed | 1 todo (533)
npm run test:sweep   ->   1 file,    9 passed (9)
npx playwright test  ->  16 passed (33.0s)
```

Exactly `BASE_FILES + 1` and `BASE_TESTS + 5` — the one new `glyph-field.spec.ts` — and
`BASE_E2E + 3`. Verified through `scripts/check-counts.mjs` at each task boundary:

| After task | Command                                                            | Result              |
| ---------- | ------------------------------------------------------------------ | ------------------- |
| 4-07-01    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 527`   | exit 0              |
| 4-07-02    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 532`   | exit 0              |
| 4-07-03    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 532`   | exit 0              |
| plan end   | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9`      | exit 0              |
| plan end   | `npx playwright test e2e/first-experience.e2e.ts`                   | `6 passed (31.3s)`  |
| plan end   | `npx playwright test`                                              | `16 passed (33.0s)` |

**Plan 04-08 should treat 37 / 532 (quick), 1 / 9 (sweep) and 16 (e2e) as its baseline** — and should
re-measure rather than trust them.

---

## The three components' props, verbatim

### `src/lib/ui/NamePlate.svelte`

```ts
let {
  entry,
  unavailable = false,
  onprev,
  onnext,
  onchoose,
}: {
  /** The centred entry. Its name is the plate's only text. */
  entry: FrontDoorEntry;
  /**
   * True when the row could not build a simulator engine for this entry.
   * Coverflow reports the set through its onskipped callback; the plate then
   * says so in the copy contract's words instead of pretending it is playable.
   */
  unavailable?: boolean;
  onprev: () => void;
  onnext: () => void;
  /**
   * Choosing. Declared and called here so that plan 04-08, which gives it a
   * body, changes that plan's file rather than this markup a second time.
   * Nothing passes it yet, so the name button is inert for one plan.
   */
  onchoose?: () => void;
} = $props();
```

Test ids `nameplate`, `nameplate-prev`, `nameplate-name`, `nameplate-next`, plus `data-name={entry.name}`
on the plate so a later test can read the centred name without racing the 260 ms crossfade (during
which both the outgoing and the incoming span are in the DOM, stacked in one grid cell). The two
triangles are inline `<svg width="10" height="12">` polygons filled `currentColor` and
`aria-hidden="true"`; the arrows' accessible names come from `aria-label="Previous configuration"` and
`aria-label="Next configuration"` alone. The name button carries `aria-label="Choose {name}"` while its
visible text stays the bare name — **except when `unavailable`**, where the aria-label is dropped so
the accessible name is the visible `{name} — unavailable` rather than an offer to choose a disabled
control. Hover on any of the three lights the whole box through `.plate:has(button:hover)`, 160 ms.

### `src/lib/ui/FidelityLine.svelte`

```ts
let { entry }: { entry: FrontDoorEntry } = $props();
```

`data-testid="fidelity-line"` on the constant line, `data-testid="fidelity-quiet"` on the entry's own
line when `entry.motion !== "animated"`. The constant lives in a `const` in the script block, not in
markup, because Prettier reflows element text and this sentence is asserted character-for-character.

### `src/lib/ui/Splash.svelte`

```ts
let {
  ondissolve,
  onfinished,
}: {
  /**
   * Fired the instant the dissolve starts, which is NOT a fixed point in
   * time: any key, click or wheel cuts to it early. The front door needs it
   * because its header wordmark has to come up to full strength over the
   * same 700 ms the mark is flying, and a callback that only fired at the
   * end would make the header pop in after the flight had already landed.
   */
  ondissolve?: () => void;
  /** Fired when the layer has removed itself and the row is uncovered. */
  onfinished?: () => void;
} = $props();
```

`data-testid="splash"`, `data-phase` in `in` | `hold` | `dissolve` (the element does not exist in
`done`), and `data-testid="splash-wordmark"` on the mark. The mark is a `<span>`, never a heading.

---

## The numbers the plan asked for

### The seed literal's exact form

**`0x48414e47`** — lowercase hexadecimal, written once in `src/lib/ui/glyph-field.ts` as
`export const FIELD_SEED = 0x48414e47;` with the comment `// "HANG"`. The UI spec writes it
`0x48414E47`; the value is identical and the acceptance criterion accepts either case. The spec file
never restates it — it imports `FIELD_SEED` and asserts the stream from it.

### Measured wall time, navigation to splash detachment

Measured in Chromium at Playwright's default 1280 × 720 viewport with two temporary probes inside
tests 4 and 6, then reverted (the file was restored from a pristine copy under the system temp
directory; `grep -c PROBE` prints `0` and the committed file has never contained them):

| Motion mode | Sequence | `page.goto("/")` → splash detached |
| --- | --- | --- |
| Full | 240 + 900 + 700 = **1,840 ms** | **2,784 ms** |
| `prefers-reduced-motion: reduce` | 0 + 400 + 200 = **600 ms** | **874 ms** |

The roughly 900 ms and 270 ms of overhead are navigation, the prerendered document, and hydration —
the splash's clock starts at `onMount`, not at `goto`. Both are comfortably inside the 5 s detach
timeout the tests allow, and the tests assert **that** it clears, never how fast.

### The tick-64 still frame, observed

**222 of 324 bytes non-zero** on aurora's 9×9 RGBA backing store, sampled through the same probe.
`golden-frames.json` samples ticks 0, 37, 101, 500 and 1009 and therefore pins no preset at tick 64,
so the test asserts only "lit and unchanging"; the number is recorded here so it exists somewhere if
a later phase wants to pin it. It is a stable number for a given build — the still frame is
`reset()` then `run(64)`, which is deterministic — but it is **not** currently a gate.

### Whether the wordmark flight landed cleanly, and by what mechanism

**It landed with a plain CSS transform, and it needed two things the plan did not name.**

The mechanism is a `transform: translate(dx, dy) scale(0.428…)` on the mark's plate, with
`transform-origin: 0 0`, transitioned over the same 700 ms `cubic-bezier(0.22, 0.61, 0.36, 1)` as the
dissolve. The scale is `12 / 28` — the Micro size over the Display size. `dx` and `dy` are **computed
at the moment the dissolve starts** from three measured rectangles (the plate, the mark inside it, and
the header wordmark), rather than from constants:

```
d = targetTopLeft - plateTopLeft - scale * (markTopLeft - plateTopLeft)
```

The subtraction of the scaled padding is the part that is easy to get wrong: the transform scales
about the plate's corner, so the mark's 32 px offset inside the plate shrinks with it.

The two additions:

1. **A target the flight can measure.** `FrontDoor.svelte`'s `<h1>` now wraps its text in a
   `<span data-testid="header-wordmark">`. Measuring the `<h1>` itself would have flown the mark to
   `x = 0`, because the heading spans the full width and its 32 px gutter is padding.
2. **`ondissolve`.** The header wordmark holds at opacity 0 while the splash covers the page and
   transitions to 1 over `--arrive-ms` (700 ms, or 200 ms under reduced motion). It has to *start*
   when the dissolve starts, and the dissolve does not start at a fixed time — any key, click or
   wheel cuts to it early. `onfinished` fires 700 ms too late.

Because the mark does not fade (the contract is explicit), both marks are at full strength in almost
the same place at the moment of landing, and the splash layer's removal is invisible. The tracking
differs — 0.50em against 0.18em — so they are not pixel-identical; that is the flight reading as a
flight rather than as a morph, and it is what the spec describes.

Under reduced motion `flightStyle()` returns the empty string and the plate crossfades to opacity 0
instead, which is the contract's "crossfades into the header slot rather than flying". An inline
transform would have beaten the `@media` rule that removes every scale, which is why the decision is
made in JavaScript rather than in CSS.

### The field, as generated

| Viewport | Blocks | Glyph cells | Block coverage | Punches |
| --- | --- | --- | --- | --- |
| 1920 × 1080 | 10 | 4,734 | 52% | 4 |
| 1280 × 720 | 10 | 2,085 | 51% | 4 |
| 390 × 844 | 10 | 754 | 52% | 4 |

Ten blocks at every size is not a bug: the first draw of the stream seeded with `0x48414e47` lands in
the top fifth of `[6, 10]`, deterministically. The spec asserts the range, not the value.

---

## Verification

| Check | Result |
| --- | --- |
| Task 1 — the five test ids in the prerendered page | exit 0 (`nameplate`, `nameplate-prev`, `nameplate-next`, `nameplate-name`, `fidelity-line`) |
| Task 1 — both arrow labels present | exit 0 / exit 0 |
| Task 1 — both triangles `aria-hidden` | **2** occurrences (see deviation 4 — the plan's matcher is broken) |
| Task 1 — the fidelity copy is character-exact, with U+2019 | exit 0 |
| Task 1 — the line is in `build/index.html`, not injected later | exit 0 |
| Task 1 — full Playwright suite unaffected | `13 passed (36.3s)`, `grep -ci failed` prints `0` |
| Task 2 — `glyph-field.spec.ts` RED | `Tests 5 failed (5)` |
| Task 2 — `glyph-field.spec.ts` GREEN | `Tests 5 passed (5)` |
| Task 2 — the generator is pure (comment-stripped: no `document`, `window`, `canvas`, `getContext`) | exit 0 |
| Task 2 — the seed is the declared one | exit 0 (`0x48414e47`) |
| Task 2 — the splash exposes `data-phase` | exit 0 |
| Task 2 — `grep -c "setInterval" src/lib/ui/Splash.svelte` | prints `0` |
| Task 2 — the 3D stage carries no grouping property | exit 0 |
| Task 2 — `mask-image` in the comment-stripped splash | **0** — the dissolve is opacity and scale only |
| Task 3 — `npx playwright test e2e/first-experience.e2e.ts` | **6 passed (31.3s)**; `grep -ci failed` prints `0` |
| Task 3 — full suite `npx playwright test` | **16 passed (33.0s)**; `grep -qE "Tests? +[0-9]+ failed"` exits 1; `grep -ci failed` prints `0` |
| Task 3 — the splash ships in the prerendered front door | exit 0 |
| Task 3 — exactly one `<h1>` across `src/lib/ui` and the non-dev routes | exit 0 (raw scan, after deviation 5) |
| Task 3 — no blanket `* { animation: none }` | exit 0 |
| Task 3 — `docs/TESTING.md` names `first-experience.e2e.ts` | exit 0 |
| `npm run check` | 414 files, **0 ERRORS, 0 WARNINGS** |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `npm run test:quick` through the helper at 36 / 527, then 37 / 532 twice | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| Port 4173 free before each Playwright run; nothing listening afterwards | confirmed before all four runs and after the last |
| Working tree clean after every commit; no scratch file left in the repository | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 - Missing critical functionality] The name plate had no way to know an entry was broken**

- **Found during:** Task 4-07-01.
- **Issue:** The plan requires the plate to render `{name} — unavailable` with the name button disabled
  when the centred id is one the row could not build an engine for. Its declared props —
  `{ entry, onprev, onnext, onchoose }` — carry no channel for that fact, so the requirement was
  unimplementable as specified.
- **Fix:** a fifth prop, `unavailable?: boolean`, defaulting to `false`. `Coverflow.svelte` passes
  `skipped.includes(centred.id)` from the rune 04-06 already maintains.
- **Files modified:** `src/lib/ui/NamePlate.svelte`, `src/lib/ui/Coverflow.svelte`
- **Commit:** `6a883eb`

**2. [Rule 2 - Missing critical functionality] `onfinished` alone cannot land the flight**

- **Found during:** Task 4-07-03.
- **Issue:** The plan states "the header wordmark starts at opacity 0 while the splash is running and
  reaches 1 as the flight lands". The splash's only declared callback fires at `done`, 700 ms after
  the flight begins, so the header would have popped in after the mark had already arrived. The
  dissolve does not start at a fixed time either — any key, click or wheel cuts to it early — so a
  constant delay in `FrontDoor` would have been wrong in exactly the case the skip rule exists for.
- **Fix:** a second optional callback, `ondissolve`, fired the instant the phase becomes `dissolve`.
  `FrontDoor` uses it to drop the `covered` class, and the header transitions to opacity 1 over
  `--arrive-ms`, which the reduced-motion media query sets to 200 ms.
- **Files modified:** `src/lib/ui/Splash.svelte`, `src/lib/ui/FrontDoor.svelte`
- **Commit:** `058a1c6`

**3. [Rule 3 - Blocking] `onDestroy` runs during prerender, and there is no `window` there**

- **Found during:** Task 4-07-03, the first `npm run build` after mounting the splash.
- **Issue:** `npm run build` died with `[500] GET /` — `ReferenceError: window is not defined` inside
  `disarmSkip`. Svelte runs `onDestroy` on the server immediately after rendering, and the splash's
  teardown removes three `window` listeners.
- **Fix:** a `mounted` flag set in `onMount` and checked at the top of `onDestroy`, which is exactly
  the guard `Coverflow.svelte` already uses. The reason is written beside it.
- **Files modified:** `src/lib/ui/Splash.svelte`
- **Commit:** `058a1c6`

**4. [Rule 1 - Bug] The plan's `aria-hidden` matcher cannot match correct source**

- **Found during:** Task 4-07-01, running the acceptance criteria.
- **Issue:** The criterion counts `/aria-hidden=..true./g` — two characters between `=` and `true`.
  Correct markup is `aria-hidden="true"`, which has one. The criterion was authored against an escaped
  form (`aria-hidden=\"true\"`) and reported **0** occurrences against source that is right. This is
  the same class of transport damage the plan's own standing rules warn about.
- **Fix:** the check was run as `/aria-hidden=["']true["']/g`, which reports **2**, and cross-checked
  with `grep -c 'aria-hidden="true"'`, which also prints **2**. The source is unchanged; only the
  matcher was corrected, and it is recorded here rather than silently substituted.
- **Files modified:** none
- **Commit:** n/a

**5. [Rule 1 - Bug] The heading-count criterion counts headings inside comments**

- **Found during:** Task 4-07-03.
- **Issue:** The criterion scans raw `.svelte` source for `<h1[ >]` and requires exactly one. The
  splash's header comment explained *why the wordmark is not a heading* and named the tag to do it, so
  a correct implementation counted **2**. The plan's own standing rule says every structural scan
  strips comments first; this criterion does not.
- **Fix:** the comment was reworded to say "level-1 heading" instead of naming the tag, so the
  criterion passes **as written** on the raw source rather than only under a corrected matcher. The
  explanation is intact and now also records why the tag name is spelled out in prose.
- **Files modified:** `src/lib/ui/Splash.svelte`
- **Commit:** `058a1c6`

**6. [Rule 1 - Bug] `test.use({ reducedMotion: "reduce" })` did not reach the page**

- **Found during:** Task 4-07-03, the first run of test 6 — which failed, correctly, because the pad
  was still animating.
- **Issue:** With Playwright 1.62.1 and this harness, the declarative option left
  `window.matchMedia("(prefers-reduced-motion: reduce)").matches` reporting **`false`** inside the
  page. Probed directly:
  ```
  PROBE A: false
  PROBE B after emulateMedia: true
  ```
  HANGAR reads the preference in JavaScript — `src/lib/sim/host.ts` subscribes to that query to still
  the engines, and both new components read it through `svelte/motion` — so the test would have
  exercised the full-motion path under a reduced-motion title. That is worse than no test.
- **Fix:** `await page.emulateMedia({ reducedMotion: "reduce" })` **before** `goto`, so the page
  arrives stilled rather than being stilled after it has started moving. The `test.use` line is kept
  (it is the plan's declaration of intent and it does emulate the CSS side), and the reason for the
  belt-and-braces is written into the test and into `docs/TESTING.md`.
- **Files modified:** `e2e/first-experience.e2e.ts`, `docs/TESTING.md`
- **Commit:** `058a1c6`

**7. [Rule 3 - Blocking] `bind:this` on a plain `let` inside `{#if}` warns**

- **Found during:** Task 4-07-02.
- **Issue:** `svelte-check` reported three `non_reactive_update` warnings for the splash's canvas,
  plate and mark bindings. The repository's bar is 0 errors **and** 0 warnings, which 04-06 met.
- **Fix:** the three are `$state()` with the reason beside them: `$state` deep-proxies plain objects
  and arrays only, and a DOM node is neither, so nothing is wrapped. The standing rule that keeps
  runes away from canvases is about the 100 Hz loop in `Coverflow.svelte`, where a proxy trap would
  sit inside every tick; this canvas is painted once.
- **Files modified:** `src/lib/ui/Splash.svelte`
- **Commit:** `7e25c67`

**8. [Rule 3 - Blocking] Reading `splash` at component-init scope warns**

- **Found during:** Task 4-07-03.
- **Issue:** `state_referenced_locally`, twice — the same warning 04-06 hit on `initialId`. Capturing
  only the initial value is exactly right: a later change to the prop must never re-open a splash over
  a page the visitor is already using.
- **Fix:** the read moved into `opensWithSplash()` and called through `untrack`, with the intent in
  the doc comment — the pattern `Coverflow.svelte` already established.
- **Files modified:** `src/lib/ui/FrontDoor.svelte`
- **Commit:** `058a1c6`

### Observations, not deviations

- **`buildField` returns a third key, `blocks`.** The plan's `<behavior>` requires "between 6 and 10
  blocks" to be assertable and its declared return — `{ cells, rects }` — reveals nothing about block
  count; recovering it from the cells would mean connected-component analysis in a test. The three
  declared exports are unchanged and the extra key costs nothing.
- **Block extents are viewport fractions, not fixed cell counts.** The first implementation used
  absolute cell ranges and produced 608 cells covering about 6% of a 1920 × 1080 viewport — confetti,
  not a mosaic. Sized as fractions (16–42% of columns, 12–38% of rows, with a floor of 5 × 3 cells) it
  is the same picture at every width: ~52% coverage on a desktop, a laptop and a phone.
- **The plate reads `skipped` directly rather than through `onskipped`.** Both live in
  `Coverflow.svelte`, so routing the fact out through a callback and back in would be ceremony. The
  `onskipped` prop 04-06 added is untouched and still available to `FrontDoor`.
- **`data-name` on the plate is new and unasserted.** During the 260 ms crossfade the outgoing and
  incoming name spans coexist in one grid cell, so `textContent` of `nameplate-name` briefly reads
  both. Any later test that needs the centred name deterministically should read `data-name`.
- **The reduced-motion rules the plan asked for in `Coverflow.svelte` were already there.** 04-06
  landed `@media (prefers-reduced-motion: reduce) { .stage.measured .slot { transition: none } }`;
  `transition: none` resets `transition-duration` to its initial `0s`, which is what test 6 reads from
  `getComputedStyle`. Nothing was added.
- **Test 6's `transition-duration` assertion is weaker than it looks.** Before the row's first
  measurement the transition rule is not applied at all, so `0s` would also be the answer for a
  different reason. It is asserted after a real step on a settled page, which is the strongest form
  available without a second, full-motion test — and this file is pinned at six.
- **Four Playwright runs.** The new file alone twice (both probe runs), the new file once clean, and
  the full suite once. The plan asks for one full-suite run and it got exactly one. Port 4173 was
  confirmed empty before each and after the last, and no `workerd` or `wrangler` process remains.
- **Both probes were reverted from a pristine copy** kept under the system temp directory;
  `grep -c PROBE` prints `0` and no committed revision of the test file has ever contained them.
- **One file had to be written with the editor rather than a heredoc.** `Splash.svelte`'s first write
  through a quoted heredoc died with `unexpected EOF while looking for matching '` and left no file;
  it was written directly instead. Two later `node -e` edits lost content to the shell — a backtick
  inside a double-quoted `node -e` ran as command substitution and swallowed a word, and two anchors
  written with `’` failed to match source that uses a plain ASCII apostrophe. All three were
  caught and repaired; the lesson is the plan's own: multi-character escapes belong in a scratch
  `.mjs`, never inline.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.
- **`src/lib/ui/` is still not covered by `forbidden-instructions.spec.ts`'s `SCANNED_DIRS`.** Nothing
  in this plan encodes a packet or writes to a device — the three new components import a catalog
  type, a pure generator and `svelte/motion`, and nothing else.

---

## Notes for later plans

- **Baseline for 04-08: quick 37 / 532 (plus the one pre-existing todo), sweep 1 / 9, e2e 16.**
  Re-measure before applying a delta.
- **`onchoose` is declared on `NamePlate` and nothing passes it.** Plan 04-08 passes it from
  `Coverflow.svelte`, beside `unavailable`, and the markup does not move.
- **The name button is a real, enabled `<button>` that currently does nothing when clicked.** That is
  this plan's one stub, sanctioned by the plan's own action text, and 04-08 closes it. It is also the
  reason the plate's crossfade and hover were built now rather than later: the control is finished
  except for its body.
- **`FrontDoor` takes `splash` and 04-09's deep-link route simply does not pass it** — that is the
  whole of D-12. `data-splash` on the section already reports which way it went.
- **The splash's clock starts at `onMount`, not at navigation.** Any later assertion about "the front
  door is interactive at 1,840 ms" has to say from when; measured from `goto` it is about 2.8 s at
  1280 × 720 on this machine.
- **Do not add a second `<h1>`, and do not name the tag in a comment either.** `e2e/smoke.e2e.ts`
  asserts a single level-1 heading through strict `getByRole`, and this plan's own heading count scans
  raw source.
- **If the field ever looks like noise rather than a mark, the lever is the block fraction range in
  `glyph-field.ts`, not the density.** Density below 1 is what makes a block breathe; the fractions are
  what make it a block.
- **The reduced-motion contract now lives in three places and they must agree:** `host.ts`'s live
  subscription (the pads), `svelte/motion` in `NamePlate` and `Splash` (durations JavaScript owns), and
  `@media (prefers-reduced-motion: reduce)` in `Coverflow`, `FrontDoor` and `Splash` (everything CSS
  can express). A change to one is a change to all three.

## Known Stubs

**One, declared and bounded.** `NamePlate.svelte`'s name button is enabled, focusable, correctly
labelled `Choose {name}` — and calls an `onchoose` that nothing passes, so clicking it does nothing.
That is the plan's own sequencing ("declare the prop so the call site does not change twice, and say
so in a comment"), it is stated in the component, and plan 04-08 gives it a body. It does not prevent
this plan's goal: every other route to the same place — the arrows, the arrow keys, `Home`/`End`, the
wheel, a click on a side pad — works, and choosing does not exist anywhere yet.

Nothing else stubs. The glyph field is really generated and really deterministic, the splash really
paints a canvas and really removes itself, the fidelity line is the approved copy character for
character, and the quiet line under a still pad is that entry's own sentence from the catalog rather
than filler.

## Requirements

`requirements: [PREV-03, PREV-05, IDENT-01, IDENT-02]` in the plan frontmatter is phase-level
attribution. **None is marked** in `.planning/REQUIREMENTS.md` by this plan.

- **PREV-03** (state what the simulator matches and what it cannot show) is now genuinely on screen,
  always, in the approved words, with a still pad explaining itself in its own. It is the one of the
  four that is arguably complete; it is left unmarked because the phase's own verification, not a
  plan, is where that call belongs.
- **PREV-05** (offscreen pads pause, reduced motion falls back to a still frame, the render path stays
  in budget) has its reduced-motion half asserted in a browser for the first time here — lit,
  unchanging, instantly steppable. The budget half is still unmeasured against a real row.
- **IDENT-01** (the glyph field as wallpaper, the wide-tracked wordmark, the 9×9 outline as logo, pad
  frame and loading state) gains the field and the wordmark. The **loading state** — the walking-cell
  `PadSpinner` — does not exist yet and belongs with the connect states.
- **IDENT-02** (motion-forward, `prefers-reduced-motion` honoured completely) now has all three of its
  layers wired and one of them asserted end to end. The hover and panel rows of the override table
  arrive with the panel in 04-08.

## Self-Check: PASSED

All five created files, the four modified files and this SUMMARY exist on disk, and all four claimed
commits (`6a883eb`, `e6b6137`, `7e25c67`, `058a1c6`) are in the history.
