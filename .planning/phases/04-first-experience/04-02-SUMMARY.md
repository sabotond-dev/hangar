---
phase: 04-first-experience
plan: 02
subsystem: catalog
tags: [front-door, coverflow, motion, geometry, CAT-04, CONT-01, CONT-03, PREV-01, PREV-02, D-10, D-20]
requires:
  - "src/lib/catalog/ (Phase 8 plan 08-01) - CATALOG, byId, CatalogEntry.preview, CatalogEntry.restsBlack"
  - "src/lib/fidelity/golden-frames.json (Phase 3) - the animating / nonZeroBytes columns the motion classification is derived from"
  - "src/vendor/botor/_pad.ts - presetById().quiet, read by the spec only, never by the shipped module"
provides:
  - "src/lib/catalog/front-door.ts - FRONT_DOOR (eight entries in ring order), EXCLUDED_FROM_ROW, frontDoorIndex, PreviewMotion, FrontDoorEntry"
  - "src/lib/coverflow/slots.ts - MAX_SLOT, the six ladder arrays, Slot, step, slotOffset, radiusForWidth, visibleWindow, slotFor"
  - "src/lib/catalog/front-door.spec.ts - 8 tests: the partition, the motion derivation, the opening window, the quiet copy"
  - "src/lib/coverflow/slots.spec.ts - 8 tests: wrapping, mirror symmetry, monotonicity, the breakpoint ladder"
affects:
  - "Plans 04-06 and 04-09 build directly against both exported surfaces"
  - "Any later phase that appends to CATALOG must register the new id in the row or in EXCLUDED_FROM_ROW, or front-door.spec test 2 goes red"
tech-stack:
  added: []
  patterns:
    - "A literal held against another source by a spec (src/lib/protocol-pin.ts, Phase 8's ZONA_MODULE_TYPE), used here to keep the compiler out of the front door's first chunk"
    - "A product claim derived from a committed fixture rather than declared: motion comes out of golden-frames.json"
    - "Partition assertions instead of count assertions, so a shared, growing tree cannot make a correct change red"
    - "Geometry separated from the component that applies it, because no .svelte.spec.ts is collected by any Vitest project here"
key-files:
  created:
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/coverflow/slots.ts
    - src/lib/coverflow/slots.spec.ts
  modified: []
decisions:
  - "The opening window is 'no dark pad, the three largest animated, no two quiet pads adjacent' rather than D-20's motion-only, because seven of eight visible slots make motion-only arithmetically impossible while three entries are honestly still - and faking motion is forbidden"
  - "The forbidden-import scan names ./index and ./entries as well as the plan's four tokens, because a relative import from inside src/lib/catalog/ contains none of them and would drag the 131 KB compiler chunk into the front door"
  - "An even ring's antipode resolves to the POSITIVE offset, stated out loud in both the module and the spec, so the row cannot flicker between two equally correct answers"
  - "visibleWindow caps its span at the catalog size, so a catalog shorter than the window mounts distinct pads rather than the same pad twice with two engines"
metrics:
  duration: 18 min
  tasks: 2
  files: 4
  completed: 2026-09-04
---

# Phase 4 Plan 02: The Front-Door Row and the Slot Arithmetic Summary

Eight configurations, in a decided ring order, whose motion is derived from `golden-frames.json`
rather than declared — plus every number the coverflow's CSS will apply, as one pure function of the
signed ring distance, tested in node with no DOM.

---

## Suite totals — observed

**Previous end state, from 04-01-SUMMARY:** quick **29 files / 474 passed | 1 todo**, sweep
**1 file / 9**, e2e **10**.

**Re-measured on this machine before this plan touched anything** (Phase 8 shares the tree, so the
baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  29 passed (29)
      Tests  474 passed | 1 todo (475)
```

It reproduced 04-01's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  31 files, 490 passed | 1 todo (491)
npm run test:sweep   ->   1 file,    9 passed (9)
npm run test:e2e     ->  10 passed (20.3s)
```

Exactly `BASE_FILES + 2` and `BASE_TESTS + 16`. Verified through `scripts/check-counts.mjs` at each
task boundary:

| After task | Command | Result |
|---|---|---|
| 4-02-01 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 30 482` | exit 0 |
| 4-02-02 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 31 490` | exit 0 |
| plan end | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |
| plan end | `npm run test:e2e` | `10 passed (20.3s)` |

**Plan 04-03 should treat 31 / 490 (quick), 1 / 9 (sweep) and 10 (e2e) as its baseline** — and
should re-measure rather than trust them.

---

## Task 4-02-01 — the row

### The final ring order, with each entry's motion

| index | id | name | motion | why it sits here |
|---|---|---|---|---|
| 0 | `aurora` | Aurora | **animated** | featured, and the opening centre |
| 1 | `pinwheel` | Pinwheel | **animated** | featured, first step right |
| 2 | `ninepads` | Nine pads | static | featured, and the first quiet pad sits two steps out |
| 3 | `starfield` | Starfield | **animated** | |
| 4 | `joystick` | Joystick | static | |
| 5 | `radar` | Radar | **animated** | |
| 6 | `faders` | Four faders | static | |
| 7 | `dial` | Dial | **animated** | first step **left** from the opening centre, so the wrap neighbour moves |

Excluded: `tpad` (Trackpad), with the reason recorded in `EXCLUDED_FROM_ROW`:

> It writes no LEDs at all, so it is a black square. It stays in the catalog; the front door is not
> where it belongs until a look gives it lights.

Every one of those five `animated` and three `static` labels was **derived** from
`src/lib/fidelity/golden-frames.json` by the spec, never read off this table. The fixture's own
columns:

| id | any `animating` | any `nonZeroBytes > 0` | derived |
|---|---|---|---|
| aurora, pinwheel, starfield, radar, dial | yes | — | `animated` |
| ninepads (162 bytes), faders (135), joystick (2) | no | yes | `static` |
| tpad | no | **no** | `dark` |

`joystick` lights 2 bytes of 243 — one dim dot — which is why it is honestly `static` and carries a
quiet line rather than pretending to be a light show.

### What the opening window actually promises

D-20 asks for a motion-only opening window. With eight entries and a radius of three the window is
**seven of the eight**, so a motion-only window is arithmetically impossible while three entries are
honestly still — and faking their motion is the one thing this phase may not do. The order above
achieves, and the spec asserts, the strongest property that is reachable:

- no `dark` pad is in the opening window (tpad is out of the row entirely);
- the three largest pads at the opening — offsets −1, 0, +1, which are `dial`, `aurora`, `pinwheel` —
  all move;
- the three quiet pads land on 2, 4 and 6, so no two of them are ever side by side on the ring,
  **including across the wrap**.

That reasoning is written into `front-door.ts` above the array, so the next reader knows the weaker
property is deliberate rather than sloppy.

### The `quiet` copy HANGAR authored

Two entries have no quiet line on the vendored shelf, so this phase wrote one each. These are the
strings the copy review should look at:

- **`ninepads`** — `This one is an instrument rather than a light show. The nine zones stay lit and wait for a finger.`
- **`faders`** — `Four rails, lit and still. They move when you move them.`

Both are sentence case, present tense, no exclamation marks, no "loading" and no "Error".

The other two quiet lines are the shelf's own, byte-for-byte, and the spec asserts the equality:

- **`joystick`** — `Left-right is pitch bend and snaps back straight. Up-down is a mod amount that falls to zero on lift.`
- **`dial`** — `Clockwise raises, counter-clockwise lowers. The middle of the pad stays quiet.`

`dial` is `animated` and still carries a quiet line. That is correct: it is a usage hint, not a
motion caveat.

### Negative check 1 — the motion gate, observed red

`ninepads`'s declared `motion` changed from `static` to `animated`, the file having been `git add`ed
first. Exactly one test went red, the one the plan predicted:

```
FAIL  |server| src/lib/catalog/front-door.spec.ts > the front-door row (src/lib/catalog/front-door.ts) > the declared motion is what the golden frames record
AssertionError: ninepads: declared motion disagrees with golden-frames.json: expected 'animated' to be 'static' // Object.is equality
```

### Negative check 2 — the ordering rule, observed red

Indices 4 and 5 (`joystick` and `radar`) swapped, so `joystick` at 5 lands next to `faders` at 6:

```
FAIL  |server| src/lib/catalog/front-door.spec.ts > the front-door row (src/lib/catalog/front-door.ts) > no two quiet pads are adjacent on the ring
AssertionError: joystick and faders are both quiet and sit side by side: expected true to be false // Object.is equality
```

This is the check that keeps the row from quietly degrading as Phase 8 adds entries — it names the
pair, so a future reorder reports which two pads collided rather than just "false".

Both reverted with `git checkout --`; `git diff --quiet -- src/lib/catalog/front-door.ts` exited 0
after each, and the spec returned to 8 passed.

### Exported surface — `src/lib/catalog/front-door.ts`

```ts
export type PreviewMotion = "animated" | "static" | "dark";

export type FrontDoorEntry = {
  id: string;
  name: string;
  description: string;
  motion: PreviewMotion;
  quiet?: string;
};

export const EXCLUDED_FROM_ROW: readonly { id: string; why: string }[];
export const FRONT_DOOR: readonly FrontDoorEntry[];

/** Index in the row, or -1. Used by the deep-link route to centre an entry. */
export function frontDoorIndex(id: string): number;
```

**The module imports nothing at all.** Not `src/vendor`, not `@intechstudio/grid-protocol`, not
`$lib/pad`, and not `./index`. Test 8 scans its own source and fails on any of them, which is what
keeps the 131,101-byte compiler chunk out of the front door's first paint.

---

## Task 4-02-02 — the slot arithmetic

### Negative check — the mirror, observed red

The sign inversion dropped from `rotateY` (`-sign * SLOT_ROTATE[k]` → `sign * SLOT_ROTATE[k]`), the
file having been `git add`ed first:

```
FAIL  |server| src/lib/coverflow/slots.spec.ts > the coverflow slot geometry (src/lib/coverflow/slots.ts) > left slots rotate positive on Y and right slots negative
AssertionError: left slot 1 turns positive: expected -20 to be 20 // Object.is equality
```

Reverted with `git checkout --`; `git diff --quiet -- src/lib/coverflow/slots.ts` exited 0 and the
spec returned to 8 passed.

### Exported surface — `src/lib/coverflow/slots.ts`

```ts
export const MAX_SLOT = 3;

/** X in multiples of the hero pad's CSS side length; index is |offset|. */
export const SLOT_X = [0, 0.78, 1.28, 1.66] as const;
/** Depth in px. Negative recedes from the viewer. */
export const SLOT_Z = [0, -160, -320, -480] as const;
/** The turn magnitude in degrees; slotFor applies the sign. */
export const SLOT_ROTATE = [0, 20, 26, 30] as const;
export const SLOT_SCALE = [1, 0.8, 0.62, 0.48] as const;
export const SLOT_OPACITY = [1, 0.8, 0.5, 0.24] as const;
export const SLOT_BRIGHTNESS = [1, 0.85, 0.7, 0.55] as const;

export type Slot = {
  offset: number;
  translateX: number;   // px
  translateZ: number;   // px
  rotateY: number;      // deg
  scale: number;
  opacity: number;
  brightness: number;
  zIndex: number;
  hero: boolean;
  mounted: boolean;
};

export function step(centre: number, delta: number, count: number): number;
export function slotOffset(index: number, centre: number, count: number): number;
export function radiusForWidth(px: number): 1 | 2 | 3;
export function visibleWindow(centre: number, radius: number, count: number): number[];
export function slotFor(offset: number, heroPx: number): Slot;
```

### The four contracts a consumer should not re-derive

1. **`rotateY` is signed AGAINST the offset.** Left slots rotate **positive**, right slots
   **negative**, so both turn their inner edge toward the viewer. It is the first thing to check if
   the built row ever reads as two fans instead of one row.
2. **An even ring's antipode is the POSITIVE offset.** `slotOffset(4, 0, 8) === 4`, deliberately and
   always, so the row cannot flicker between two equally correct answers as the centre moves.
3. **An out-of-range offset still returns a well-formed `Slot`**, clamped to the last rung, with
   `mounted: false`. A caller that asks for slot 9 gets something it can render nothing from, not a
   crash on a property of `undefined`.
4. **`visibleWindow` caps its span at `count`.** A four-entry catalog on a wide screen mounts four
   distinct pads rather than the same pad twice with two engines running against it.

`zIndex` is `100 - |offset|`, per the UI spec, and the module records the caveat: inside a
`preserve-3d` context the browser also sorts by 3D depth, so `z-index` is belt-and-braces; because it
agrees with the depth order it cannot fight it. If a side pad ever paints in front of the hero, the
fix is to drop `zIndex` and let `translateZ` sort — never to invent a new ladder.

The breakpoint ladder is `≥1024px → 3` (7 pads), `640–1023px → 2` (5), `<640px → 1` (3), asserted at
1280, 1024, 1023, 640, 639 and 320.

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/catalog/front-door.spec.ts` | 1 file, **8 passed** |
| `npx vitest run --project server src/lib/coverflow/slots.spec.ts` | 1 file, **8 passed** |
| Both specs in one run | 2 files, **16 passed** |
| `npx vitest run --project server src/lib/catalog/catalog.spec.ts` | 1 file, **10 passed** — Phase 8's gate untouched |
| Row order asserted through the **comment-stripped** source | exit 0 (`row order OK`) |
| Phase 8's files untouched (`git diff --quiet` over the six) | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| `slots.ts` is pure: no import, no `document` / `window` / `navigator` | exit 0 (`slots.ts is pure`) |
| The ladder values `0.78 1.28 1.66 -160 -320 -480 0.62 0.48 0.24 0.85` all present | exit 0 |
| Negative check 1 (ninepads motion) red, then `git diff --quiet` | observed, exit 0 |
| Negative check 2 (swap 4 and 5) red, then `git diff --quiet` | observed, exit 0 |
| Negative check 3 (rotateY sign) red, then `git diff --quiet` | observed, exit 0 |
| `npm run test:quick` through the helper at 30 / 482, then 31 / 490 | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `npm run test:e2e` | **10 passed** (20.3s), unchanged |
| `npm run check` | 395 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| Port 4173 free before the e2e run; no `wrangler` / `workerd` left afterwards | confirmed (TIME_WAIT sockets only, nothing listening) |
| Working tree clean after every commit | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 - Missing critical functionality] The forbidden-import scan could not catch the import it most needed to**

- **Found during:** Task 4-02-01, writing test 8.
- **Issue:** The plan specifies the scan as "no `from "..."` specifier contains `vendor`,
  `intechstudio`, `lib/pad` or `lib/catalog`". `front-door.ts` lives **inside** `src/lib/catalog/`,
  so the natural mistake — `import { byId } from "./index"` — contains none of those four tokens and
  would have passed the gate while dragging the vendored compiler and its 131,101-byte
  `grid-protocol` chunk into the front door's first paint. That is precisely the failure the test
  exists to prevent, and as specified it was blind to it.
- **Fix:** The forbidden list is the plan's four plus `./index` and `./entries`, with the reason in a
  comment beside it. The four the plan named are all still enforced.
- **Files modified:** `src/lib/catalog/front-door.spec.ts`
- **Commit:** `a88bf71`

**2. [Rule 2 - Missing critical functionality] `frontDoorIndex` was exported but never exercised**

- **Found during:** Task 4-02-01.
- **Issue:** The plan's eight tests never call `frontDoorIndex`, so the deep-link route's only
  entry point into this module would have shipped with no coverage at all — and an off-by-one there
  centres the wrong pad on a shared link.
- **Fix:** Two assertions folded into test 1 (which is already the identity-and-lookup test): the
  index round-trips for every row entry, and an unknown id returns `-1` rather than `0`. The test
  count stays 8.
- **Files modified:** `src/lib/catalog/front-door.spec.ts`
- **Commit:** `a88bf71`

### Observations, not deviations

- **The orchestrator's objective named `src/lib/sim/slots.ts`; the plan, its `artifacts` block, its
  acceptance criteria and `04-VALIDATION.md` rows 4-02-02 and Wave 2 all say
  `src/lib/coverflow/slots.ts`.** The plan is authoritative, so the module is at
  `src/lib/coverflow/slots.ts`. No `src/lib/sim/` directory was created.
- **`slotFor` needs an explicit zero branch for `translateX` and `rotateY`.** `Math.sign(0)` is `0`
  and `-0 * 20` is `-0`, which is a different value from `0` under `Object.is` and therefore under
  `toBe`. The branch is commented in the module so it does not look like defensive noise.
- **The `node -e` purity and ladder checks were run from a scratch `.mjs` under the system temp
  directory**, as the plan's standing rules permit, because the strip expression contains `$` inside
  a shell-quoted string. Identical logic, both exit 0, no scratch file left in the repository.
- **Only one test went red on the `ninepads` perturbation**, exactly as the plan predicted. Test 7
  stayed green because a `ninepads` that claims to animate is no longer a quiet pad, so no two quiet
  pads become adjacent. The two negative checks are genuinely independent gates.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used
  `grep -Ei`, per 08-01's and 04-01's note.

---

## Notes for later plans

- **Baseline for 04-03: quick 31 / 490 (plus the one pre-existing todo), sweep 1 / 9, e2e 10.**
  Re-measure before applying a delta.
- **Plans 04-06 and 04-09 build against the two exported surfaces quoted verbatim above.** Nothing
  else in the tree imports either module yet.
- **`front-door.ts` must stay import-free.** Test 8 fails on any specifier containing `vendor`,
  `intechstudio`, `lib/pad`, `lib/catalog`, `./index` or `./entries`. If a later plan genuinely needs
  something from the catalog on the front door, the correct move is a dynamic import inside
  `onMount` (D-21), not a static one here.
- **Any phase that appends to `CATALOG` must register the new id in `FRONT_DOOR` or in
  `EXCLUDED_FROM_ROW`.** Test 2 asserts the partition, so a forgotten entry is red and names itself.
  The assertion carries no literal size on either side.
- **The row's ordering rule is a test, not a convention.** Test 7 goes red if two quiet pads ever
  become adjacent, including across the wrap, so a new entry cannot be dropped into the middle of the
  row without thinking about where the quiet pads land.
- **`golden-frames.json` is the oracle for `motion`.** A new entry that is not in that fixture has no
  derivable motion; test 3 asserts the fixture records every row id, so such an entry fails loudly
  rather than defaulting to `animated`.
- **`src/lib/coverflow/` now exists** and holds the geometry plus its spec. The component that
  applies these numbers belongs beside it or in `src/lib/ui/`; remember that no `.svelte.spec.ts` is
  collected by any Vitest project here, so behaviour that needs testing must stay in a `.ts` module.

## Known Stubs

None. Both modules are complete and fully exercised; nothing in either returns a placeholder, an
empty array standing in for real data, or copy that says "coming soon".

## Requirements

`requirements: [CAT-04, CONT-01, CONT-03, PREV-01, PREV-02]` in the plan frontmatter is phase-level
attribution. **None of the five is complete after this plan, and none is marked** in
`.planning/REQUIREMENTS.md`:

- **PREV-01** ("every visible pad is animating") now has its honest, fixture-derived classification
  and the row order that makes the claim survivable — but nothing renders yet. It can be assessed
  after plans 04-05 to 04-07 land the host, the paint path and the row.
- **PREV-02** (the preview is compiled, never hand-authored) is untouched here: this plan compiles
  nothing.
- **CAT-04** (the Profile-Cloud-shaped export) lives in Phase 8's `build()`; this plan only consumes
  the catalog it belongs to.
- **CONT-01** and **CONT-03** get the row's copy — names, descriptions and four quiet lines — but the
  surfaces that show them arrive in plans 04-06 and 04-08.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All four claimed source files and this SUMMARY exist on disk; all four claimed commits
(`a88bf71`, `f3cfbc1`, `513650b`, `587cff1`) are in the history; and `src/lib/sim/` was not created.
