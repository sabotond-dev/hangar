---
phase: 04-first-experience
plan: 03
subsystem: simulation
tags: [clock, painter, touch, PREV-01, PREV-04, PREV-05, D-02, D-14, D-15]
requires:
  - "src/vendor/botor/pad-sim-host.ts - read as a reference design for the scheduling and touch semantics, never imported"
  - "src/vendor/botor/pad-sim.ts - the shape TouchTarget was cut to fit (touchDown/touchMove/touchUp), and the producer of the 243-byte frame paintPad consumes"
provides:
  - "src/lib/sim/schedule.ts - TICK_MS, MAX_CATCHUP_MS, HERO_INTERVAL_MS, SIDE_INTERVAL_MS, LOW_POWER_HERO_MS, LOW_POWER_SIDE_MS, REDUCED_MOTION_TICKS, ticksFor, shouldPaint, intervalFor, isLowPower"
  - "src/lib/sim/paint.ts - GRID_SIDE, createScratch, paintPad"
  - "src/lib/sim/touch.ts - MAX_CONTACTS, mapAxis, TouchTarget, TouchSampler"
  - "three specs, 20 tests, all in the node server project: schedule.spec.ts (7), paint.spec.ts (5), touch.spec.ts (8)"
affects:
  - "Plan 04-05 builds the host directly against all three exported surfaces"
  - "Plan 04-07's PadFrame.svelte owns the three static layers paintPad deliberately does not draw"
  - "Any future change to the vendored host's TICK_MS, MAX_CATCHUP_MS or REDUCED_MOTION_TICKS turns schedule.spec test 7 red"
tech-stack:
  added: []
  patterns:
    - "An anti-drift gate that reads the origin file with readFileSync and asserts the match was found, so a renamed constant upstream fails loudly instead of silently matching nothing (same idea as src/lib/protocol-pin.spec.ts)"
    - "A recording stub context that proves an absence: one putImageData and zero of every forbidden call, asserted by iterating a counter object so a technique added later is caught without editing the spec"
    - "Pure arithmetic extracted out of the component and the host so it runs in node, because this repository collects no .svelte.spec.ts in any Vitest project"
key-files:
  created:
    - src/lib/sim/schedule.ts
    - src/lib/sim/schedule.spec.ts
    - src/lib/sim/paint.ts
    - src/lib/sim/paint.spec.ts
    - src/lib/sim/touch.ts
    - src/lib/sim/touch.spec.ts
  modified: []
decisions:
  - "paint.spec test 4 zeroes the counter object after createScratch, because createScratch legitimately calls createImageData once and the plan's 'every other counter is 0' would otherwise be false for correct code; the iterate-all-counters property is preserved"
  - "TouchSampler.down() returns false for an already-tracked pointer as well as for a full slot table, matching the vendored previewDown's early return, so a duplicate pointerdown cannot silently take a second slot"
  - "The engine-facing id in TouchTarget is the contact SLOT (0..4), not the pointer id - the vendored deliverPending passes c.slot, and plan 04-05's host must not pass a pointer id there"
metrics:
  duration: 14 min
  tasks: 3
  files: 6
  completed: 2026-09-04
---

# Phase 4 Plan 03: The Clock, the Painter and the Finger Summary

The three pure pieces the simulator host is built from: whole 10 ms ticks with a 100 ms catch-up
clamp and a paint cadence decoupled from them, a 9x9 backing store written with exactly one
`putImageData` per pad per paint, and a pointer buffer that hands the engine at most one sample per
contact per tick. All three run in node with no browser, no canvas and no `PadSim`.

---

## Suite totals — observed

**Previous end state, from 04-02-SUMMARY:** quick **31 files / 490 passed | 1 todo**, sweep
**1 file / 9**, e2e **10**.

**Re-measured on this machine before this plan touched anything** (Phase 8 shares the tree, so the
baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  31 passed (31)
      Tests  490 passed | 1 todo (491)
```

It reproduced 04-02's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  34 files, 510 passed | 1 todo (511)
npm run test:sweep   ->   1 file,    9 passed (9)
npm run test:e2e     ->  10 passed (20.3s)
```

Exactly `BASE_FILES + 3` and `BASE_TESTS + 20`. Verified through `scripts/check-counts.mjs` at each
task boundary:

| After task | Command | Result |
|---|---|---|
| 4-03-01 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 32 497` | exit 0 |
| 4-03-02 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 33 502` | exit 0 |
| 4-03-03 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 34 510` | exit 0 |
| plan end | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| plan end | `npm run test:e2e` | `10 passed (20.3s)` |

**Plan 04-04 should treat 34 / 510 (quick), 1 / 9 (sweep) and 10 (e2e) as its baseline** — and
should re-measure rather than trust them.

---

## Exported surfaces, verbatim

Plan 04-05 builds the host directly against these three files. Nothing else in the tree imports any
of them yet.

### `src/lib/sim/schedule.ts`

```ts
export const TICK_MS = 10;
export const MAX_CATCHUP_MS = 100;
export const HERO_INTERVAL_MS = 33;
export const SIDE_INTERVAL_MS = 50;
export const LOW_POWER_HERO_MS = 50;
export const LOW_POWER_SIDE_MS = 100;
export const REDUCED_MOTION_TICKS = 64;

/** Whole ticks owed for a frame gap, and the millisecond remainder to carry. */
export function ticksFor(
  pendingMs: number,
  dtMs: number,
): { ticks: number; carryMs: number };

/** True when this pad is due a repaint. Paint is decoupled from tick. */
export function shouldPaint(
  now: number,
  lastPaint: number,
  intervalMs: number,
): boolean;

/** The paint interval for one slot: the hero repaints faster than the sides. */
export function intervalFor(isHero: boolean, lowPower: boolean): number;

/** Four cores or fewer is the low-power ladder; an absent count defaults to eight. */
export function isLowPower(cores: number | undefined): boolean;
```

The module imports nothing and contains none of `import`, `document`, `window`, `navigator` or
`requestAnimationFrame` in code — asserted over the comment-stripped source, because its comments
legitimately discuss `navigator.hardwareConcurrency`, which is exactly the token the check forbids.

### `src/lib/sim/paint.ts`

```ts
/** The pad is nine by nine. The canvas backing store is exactly that. */
export const GRID_SIDE = 9;

/** One ImageData per canvas, created once and written in place on every paint. */
export function createScratch(ctx: CanvasRenderingContext2D): ImageData;

/**
 * Paint one pad's frame. `frame` is PadSim.frame: 243 bytes, screen order, RGB,
 * with cell n at bytes 3n, 3n+1, 3n+2.
 */
export function paintPad(
  ctx: CanvasRenderingContext2D,
  frame: Uint8Array,
  scratch: ImageData,
): void;
```

`createScratch` takes the context rather than calling `new ImageData(...)`, so the module is testable
in node against a stub and does not depend on a global constructor the runner does not have. The
`scratch` belongs to the caller and lives as long as the canvas does.

### `src/lib/sim/touch.ts`

```ts
export const MAX_CONTACTS = 5;

/** Canvas offset to an LED coordinate. The factor is max + 1, not max. */
export function mapAxis(offset: number, extent: number, max: number): number;

/** The minimum an engine must offer for a finger to reach it. PadSim satisfies it. */
export interface TouchTarget {
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
}

export class TouchSampler {
  /** Number of live contacts. The host uses it to decide the pad is active. */
  get size(): number;
  down(pointerId: number, x: number, y: number): boolean;
  move(pointerId: number, x: number, y: number): void;
  end(pointerId: number): void;
  /** At most one sample per contact. Called once per tick, by the host. */
  deliver(target: TouchTarget): void;
  clear(): void;
}
```

---

## The three negative checks, observed red

### 1. The catch-up clamp — `MAX_CATCHUP_MS` set to 1000

Predicted: `schedule.spec` red **twice**. Observed exactly that:

```
FAIL  |server| src/lib/sim/schedule.spec.ts > the simulation clock (src/lib/sim/schedule.ts) > clamps the gap before dividing, so a restored tab cannot fast-forward
AssertionError: a five second gap is clamped to 100 ms of ticks: expected 100 to be 10 // Object.is equality

FAIL  |server| src/lib/sim/schedule.spec.ts > the simulation clock (src/lib/sim/schedule.ts) > carries exactly the vendored host's constants
AssertionError: the anti-fast-forward clamp: expected 1000 to be 100 // Object.is equality
```

The second line is the one worth having: it is the anti-drift gate reading `pad-sim-host.ts` and
reporting the divergence in the same run.

### 2. The unlit-cell alpha — unlit cells given alpha 255

Predicted: test 1 red naming the cell index. Observed that, **and a second failure the plan did not
predict** — the cell-to-pixel mapping test, because with every cell opaque there is no longer exactly
one lit pixel to locate:

```
FAIL  |server| src/lib/sim/paint.spec.ts > the pad painter (src/lib/sim/paint.ts) > writes an unlit cell at alpha 0 so the dot field shows through
AssertionError: cell 0 is dark: expected 255 to be +0 // Object.is equality

FAIL  |server| src/lib/sim/paint.spec.ts > the pad painter (src/lib/sim/paint.ts) > maps cell n to pixel n, with no transposition and no offset
AssertionError: exactly the centre cell is opaque: expected [ Array(81) ] to deeply equal [ 40 ]
```

This is the check that matters most in this plan: with opaque black cells the pad still looks
plausible on screen and only the CSS dot field and gutter grid silently vanish — a failure nobody
catches in a screenshot.

### 3. MOVE coalescing — always push instead of overwriting the last MOVE

Predicted: the coalescing test red reporting the extra call. Observed that plus the tick-lock test,
which is the stronger of the two because it names the wrong coordinate rather than a length:

```
FAIL  |server| src/lib/sim/touch.spec.ts > the tick-locked finger (src/lib/sim/touch.ts) > coalesces MOVEs to the newest and keeps DOWN and UP in their place
AssertionError: two MOVEs became one, carrying the newest: expected [ [ 'down', +0, 10, 10 ], ...(3) ] to deeply equal [ [ 'down', +0, 10, 10 ], ...(2) ]

FAIL  |server| src/lib/sim/touch.spec.ts > the tick-locked finger (src/lib/sim/touch.ts) > is tick-locked: three MOVEs between ticks cost one delivery each tick
AssertionError: the coalesced MOVE carries the LAST position: expected [ 'move', +0, 5, 5 ] to deeply equal [ 'move', +0, 7, 7 ]
```

Without coalescing the pad lags the pointer by however many events the browser queued between ticks:
the second line is that lag, made visible as a coordinate.

All three perturbations were reverted with `git checkout --`, and `git diff --quiet` over each file
exited 0 afterwards; each spec returned to its full count.

---

## Where the vendored semantics were subtler than the plan described

1. **The engine-facing id is the contact SLOT, not the pointer id.**
   `pad-sim-host.ts:381-395` (`deliverPending`) calls `sim.touchDown(c.slot, sm.x, sm.y)` — the slot
   index 0..4, never `e.pointerId`. The plan's `TouchTarget` signature names the parameter `id`,
   which reads like a pointer id. `TouchSampler.deliver` passes the slot, and `touch.spec` asserts
   the exact ids (`0, 1, 2, 3, 4` for five contacts, and slot `2` reused by a later pointer). **Plan
   04-05's host must not pass a pointer id into a `TouchTarget`.**

2. **`down()` has two reasons to refuse, not one.**
   The plan documents `false` as "no slot is free". `pad-sim-host.ts:317-319` also returns early when
   `this.contacts.has(e.pointerId)`, and that guard matters: without it a repeated `pointerdown` for
   the same pointer would take a second slot and leak it, since only one `end()` will ever arrive.
   `down()` therefore returns `false` for an already-tracked pointer too, with the reason in the
   doc comment.

3. **The slot frees on the UP's *delivery*, and the spec has to prove the gap.**
   `pad-sim-host.ts:388-394`. Between `end()` and the next `deliver()` the engine still holds the
   contact, so the slot is not reusable. `touch.spec` asserts both halves: `down()` returns `false`
   in that window, and `true` on the tick after.

4. **`RENDER_INTERVAL_MS` has no counterpart to assert.**
   The parity gate compares the three constants whose meaning HANGAR kept unchanged — `TICK_MS`,
   `MAX_CATCHUP_MS`, `REDUCED_MOTION_TICKS`. The vendored `RENDER_INTERVAL_MS = 33`
   (`pad-sim-host.ts:34`) is deliberately split into `HERO_INTERVAL_MS` / `SIDE_INTERVAL_MS` per
   D-15, so it is cited in a comment rather than asserted. The gate asserts each regex match was
   **found**, so a rename upstream fails loudly instead of silently matching nothing.

5. **`mapAxis` guards `extent <= 0`, not `extent === 0`.**
   `pad-sim-host.ts:303`. A negative extent is just as arithmetically fatal as a zero one, and a
   `NaN` or negative coordinate reaching the engine poisons a whole zone rather than one cell.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/sim/schedule.spec.ts` | 1 file, **7 passed** |
| `npx vitest run --project server src/lib/sim/paint.spec.ts` | 1 file, **5 passed** |
| `npx vitest run --project server src/lib/sim/touch.spec.ts` | 1 file, **8 passed** |
| All three in one run | 3 files, **20 passed** |
| `schedule.ts` is pure (no `import` / `document` / `window` / `navigator` / `requestAnimationFrame`), comment-stripped | exit 0 |
| `grep -q "pad-sim-host" src/lib/sim/schedule.spec.ts` | exit 0 |
| `paint.ts` uses none of `drawImage` / `strokeRect` / `shadowBlur` / `fillRect` / `createPattern` / `getContext`, and does contain `putImageData`, comment-stripped | exit 0 |
| `grep -q "GRID_SIDE = 9" src/lib/sim/paint.ts` | exit 0 |
| `touch.ts` is DOM-free (no `document` / `window` / `PointerEvent` / `getBoundingClientRect` / `setPointerCapture` / `addEventListener`), comment-stripped | exit 0 |
| `grep -q "MAX_CONTACTS = 5" src/lib/sim/touch.ts` | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| Negative check 1 (clamp 1000) red **twice**, then `git diff --quiet` | observed, exit 0 |
| Negative check 2 (unlit alpha 255) red, then `git diff --quiet` | observed, exit 0 |
| Negative check 3 (no MOVE coalescing) red, then `git diff --quiet` | observed, exit 0 |
| `npm run test:quick` through the helper at 32 / 497, 33 / 502, then 34 / 510 | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `npm run test:e2e` | **10 passed** (20.3s), unchanged |
| `npm run check` | 401 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| Port 4173 free before the e2e run; no `wrangler` / `workerd` left afterwards | confirmed (0 matching processes) |
| Working tree clean after every commit | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The plan's "every other counter is 0" was false for correct code**

- **Found during:** Task 4-03-02, writing test 4.
- **Issue:** The plan's stub counts `createImageData`, and test 4 is specified as "assert
  `calls.putImageData === 1` and that every other counter is `0`, iterating the counter object".
  `createScratch` legitimately calls `createImageData` once, so the assertion as written fails on a
  correct painter — and the obvious repair (skip `createImageData` by name) would give the
  iterate-everything property a permanent hole exactly where a future second surface would appear.
- **Fix:** The counters are zeroed after `createScratch` and before the paint, with the reason in a
  comment: what is measured is one paint, not the setup. The iteration still covers every counter
  including `createImageData`, so a painter that allocated a new `ImageData` per frame would be red.
- **Files modified:** `src/lib/sim/paint.spec.ts`
- **Commit:** `ff31380`

**2. [Rule 2 - Missing critical functionality] A duplicate `pointerdown` could take a second slot**

- **Found during:** Task 4-03-03.
- **Issue:** The plan documents `down()` returning `false` only for a full slot table. The vendored
  `previewDown` also returns early when the pointer is already tracked (`pad-sim-host.ts:317-319`).
  Without that guard a repeated `pointerdown` for one pointer id overwrites the contact record and
  leaks its old slot forever, because only one `end()` will ever arrive for that pointer — the exact
  stuck-contact failure the single-shot `ended` flag exists to prevent, arriving through the other
  door.
- **Fix:** `down()` returns `false` when the pointer is already tracked, with the reason in the doc
  comment; the five-slot test exercises it implicitly (the sixth pointer uses a fresh id).
- **Files modified:** `src/lib/sim/touch.ts`
- **Commit:** `15fdc87`

### Observations, not deviations

- **Two of the three negative checks went red on two tests rather than one.** In both cases the
  second failure is the more informative one (the vendored-parity gate; the coordinate the pointer
  actually lagged by). Recorded above with both lines.
- **`src/lib/sim/` did not exist before this plan.** 04-02 recorded that the orchestrator's objective
  for that plan named `src/lib/sim/slots.ts` while the plan said `src/lib/coverflow/slots.ts`; the
  geometry stayed in `src/lib/coverflow/` and this plan created `src/lib/sim/` for the first time,
  holding only the clock, the painter and the finger.
- **The purity, DOM-free and forbidden-call scans were run from scratch `.mjs` files under the
  system temp directory**, as the standing rules permit, because the strip expression contains `$`
  inside a shell-quoted string. Identical logic to the plan's `node -e` forms, all exit 0, no scratch
  file left in the repository.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.
- **One assertion was rewritten before the RED commit was finalised.** The first draft of
  `touch.spec` test 1 compared `mapAxis(511.5, 90, 1023)` with itself — a tautology that would have
  passed against any implementation. It is now `mapAxis(45, 90, 1023) === 512`, which is the hiRes
  half of the `max + 1` factor. The RED commit was amended rather than followed by a fixup, so no
  vacuous assertion exists anywhere in the history.

---

## Notes for later plans

- **Baseline for 04-04: quick 34 / 510 (plus the one pre-existing todo), sweep 1 / 9, e2e 10.**
  Re-measure before applying a delta.
- **The host (plan 04-05) owns everything these three modules deliberately do not:** the single
  `requestAnimationFrame` loop, the `pendingMs` field that `ticksFor`'s `carryMs` is written back
  into, the `IntersectionObserver` with `rootMargin: "200px"`, the live
  `matchMedia("(prefers-reduced-motion: reduce)")` subscription, the `reset()` + `run(64)` still
  frame, and `destroy()`. None of that is in `src/lib/sim/` yet.
- **The host must call `deliver()` once per tick, before `sim.tick()`**, matching
  `pad-sim-host.ts:449-452`. Delivering once per frame instead of once per tick silently restores the
  pointer-rate dependence the sampler exists to remove, and no test in this plan can catch that —
  it is the host's test to write.
- **`PadFrame.svelte` (plan 04-07) owns three of the pad's four layers.** `paintPad` writes only the
  LEDs, and writes unlit cells at alpha 0 precisely so the CSS dot field (layer 1) and gutter grid
  (layer 3) show through. A component that paints a background colour behind the canvas, or that
  applies a colour-adding `filter` to it, breaks the arrangement without breaking a test in this
  plan.
- **The canvas element must be `width="9" height="9"` with `image-rendering: pixelated`,** CSS-sized
  to the face. `putImageData` ignores the transform matrix, so any other backing-store size makes
  `paintPad` paint a 9x9 patch in the corner of a larger canvas.
- **`schedule.spec` test 7 is a tripwire on the vendored tree.** A resync of `pad-sim-host.ts` that
  changes `TICK_MS`, `MAX_CATCHUP_MS` or `REDUCED_MOTION_TICKS`, or renames any of them, turns it
  red. That is the intended behaviour: the constants are a contract with the firmware, and a resync
  that moves them is a decision, not a merge.

## Known Stubs

None. All three modules are complete and fully exercised; nothing in any of them returns a
placeholder, an empty value standing in for real data, or copy that says "coming soon".

## Requirements

`requirements: [PREV-01, PREV-04, PREV-05]` in the plan frontmatter is phase-level attribution.
**None of the three is complete after this plan, and none is marked** in `.planning/REQUIREMENTS.md`:

- **PREV-01** ("every card animates live in the firmware-faithful simulator") now has the painter
  that will put its pixels on screen, but nothing mounts a canvas yet. Assessable after plans 04-05
  to 04-07.
- **PREV-04** (mouse-as-finger on the focused card) has the whole sampling rule set, proven in node,
  and no pointer handler to feed it. The component arrives in plan 04-07.
- **PREV-05** (offscreen cards pause, reduced motion falls back to a still frame, the render path
  stays in budget) has its arithmetic — `ticksFor`, `shouldPaint`, `intervalFor`, `isLowPower`,
  `REDUCED_MOTION_TICKS` — and none of its behaviour: the `IntersectionObserver` and the
  `matchMedia` subscription belong to the host in plan 04-05.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All six claimed source files and this SUMMARY exist on disk, and all six claimed commits
(`a3021f9`, `1346e78`, `ff31380`, `3fe949e`, `f5590c0`, `15fdc87`) are in the history.
