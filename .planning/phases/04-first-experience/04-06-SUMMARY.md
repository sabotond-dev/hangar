---
phase: 04-first-experience
plan: 06
subsystem: ui
tags:
  [
    coverflow,
    pad,
    canvas,
    css-3d,
    listbox,
    pointer,
    dynamic-import,
    PREV-01,
    PREV-02,
    PREV-04,
    IDENT-01,
    D-10,
    D-16,
    D-21,
  ]
requires:
  - "src/lib/catalog/front-door.ts (04-02) - FRONT_DOOR, frontDoorIndex, FrontDoorEntry"
  - "src/lib/coverflow/slots.ts (04-02) - step, slotOffset, slotFor, radiusForWidth, visibleWindow"
  - "src/lib/sim/host.ts (04-05) - SimHost, HostEngine; register owns the 9x9 backing store and every paint"
  - "src/lib/sim/touch.ts (04-04) - mapAxis, the only DOM-to-LED conversion"
  - "src/vendor/botor/pad-sim.ts and _pad.ts - reached ONLY through an awaited dynamic import inside onMount"
  - "src/app.css (04-01) - the eight identity tokens every rule here reads"
provides:
  - "src/lib/ui/PadFrame.svelte - the four-layer pad: frame, static dot field, canvas slot, static gutter grid"
  - "src/lib/ui/PadCanvas.svelte - the 9x9 element, its role=img name, and the onready callback"
  - "src/lib/ui/Coverflow.svelte - the band, the slot window, every stepping input, the listbox semantics, the hero's finger"
  - "src/lib/ui/FrontDoor.svelte - the composition both routes render"
  - "e2e/first-experience.e2e.ts - 3 tests: an animated pad moves, a static one does not, the row steps and wraps"
affects:
  - "Plan 04-07 renders the splash from FrontDoor's already-declared `splash` prop and the name plate from Coverflow's `onskipped` report"
  - "Plan 04-08 adds choosing on top of the hero pointer handlers that already exist here"
  - "Plan 04-09's /c/{id}/ route renders <FrontDoor {initialId} /> with no splash"
  - "Phase 8 plan 08-03's createEngine(entry) replaces the two dynamic imports and the presetById call, and nothing else moves"
tech-stack:
  added: []
  patterns:
    - "A component that owns an element but not its pixels: PadCanvas hands its canvas up through an onready callback and never takes a context"
    - "Three-element CSS 3D split - clip and mask on the outer wrapper, perspective on the inner stage, brightness on the leaf slot - so no grouping property ever lands on the element that carries preserve-3d"
    - "Scalars only across the rune boundary; engines, canvases and element maps live in plain let/const with the lint rule that wants SvelteMap disabled and the reason written beside it"
    - "A browser test that asserts motion AND stillness from the same sampler, so the catalog's honesty claim is falsifiable in both directions"
key-files:
  created:
    - src/lib/ui/PadFrame.svelte
    - src/lib/ui/PadCanvas.svelte
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/FrontDoor.svelte
    - e2e/first-experience.e2e.ts
  modified:
    - src/routes/+page.svelte
    - docs/TESTING.md
decisions:
  - "The skipped-entry set is a string[] in a rune plus an onskipped callback, not the plan's plain Set: the markup has to read it to decide whether a slot gets a canvas, and Svelte's SvelteSet is exactly the reactive proxy the standing rule forbids near the loop"
  - "Pointer handlers sit on the hero slot itself rather than on an inner wrapper - which is what the plan actually specifies - because a plain div carrying them warns a11y_no_static_element_interactions while the slot already has role=option"
  - "role=img on a canvas and role=option without a tabindex are both suppressed with a documented svelte-ignore rather than obeyed: the first is the approved accessibility contract, and the second is required by it, since a tabindex on an option would move focus off the band on a side-pad click and the next arrow key would go nowhere"
  - "The band is capped at max-inline-size: 100% as well as min(100vw, 1280px), because 100vw counts the scrollbar and the front door always has one"
metrics:
  duration: 41 min
  tasks: 3
  files: 7
  completed: 2026-09-04
---

# Phase 4 Plan 06: The Living Row Summary

The site stops being a scaffold. Opening `/` shows seven ZONA pads receding left and right in real CSS
3D, every one of them running its own compiled configuration in the firmware simulator at 100 Hz with
no hardware attached, steppable by arrow keys, `Home`/`End`, a horizontal wheel, a swipe or a click on
a side pad, with the centre pad taking a mouse as a finger — and the 131 KB compiler chunk is not on
the front door's critical path.

---

## Suite totals — observed

**Previous end state, from 04-05-SUMMARY:** quick **36 files / 527 passed | 1 todo**, sweep
**1 file / 9**. 04-05 did **not** re-measure e2e; the last measured value was **10** (04-02).

**Re-measured on this machine before this plan touched anything:**

```
npm run test:quick
 Test Files  36 passed (36)
      Tests  527 passed | 1 todo (528)
```

It reproduced 04-05's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  36 files, 527 passed | 1 todo (528)   (unchanged: this plan adds no Vitest file)
npm run test:sweep   ->   1 file,    9 passed (9)
npx playwright test  ->  13 passed (50.6s)                     (re-measured, was 10)
```

The Vitest totals are deliberately unchanged. This plan writes four Svelte components and one
Playwright file, and **no `.svelte.spec.ts` was created**: `vite.config.ts`'s `server` project excludes
that pattern and no other project collects it, so such a file would be green and vacuous. Everything
decidable about the row — the wrap, the mirror symmetry, the breakpoint ladder, the tick accounting,
the touch coalescing — was already pinned in the pure modules plans 04-02 to 04-05 tested. What is
left is behaviour in a real browser, and that is what the three Playwright tests are.

Verified through `scripts/check-counts.mjs` at each task boundary:

| After task | Command                                                         | Result |
| ---------- | --------------------------------------------------------------- | ------ |
| 4-06-01    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 527` | exit 0 |
| 4-06-02    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 527` | exit 0 |
| 4-06-03    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 527` | exit 0 |
| plan end   | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9`    | exit 0 |
| plan end   | `npx playwright test`                                            | `13 passed (50.6s)` |

**Plan 04-07 should treat 36 / 527 (quick), 1 / 9 (sweep) and 13 (e2e) as its baseline** — and should
re-measure rather than trust them.

---

## The four components' props, verbatim

Plans 04-07, 04-08 and 04-09 all extend these.

### `src/lib/ui/PadFrame.svelte`

```ts
let {
  entry,
  hero = false,
  children,
}: {
  entry: FrontDoorEntry;
  hero?: boolean;
  children?: Snippet;
} = $props();
```

`data-testid="pad-{entry.id}"`. The root carries the border (`--color-line` on the hero,
`--color-line-soft` on a side pad), the 10px radius and, on the hero only, `box-shadow: 0 0 40px
var(--color-glow)`. Three absolutely positioned children, all inset **6px**: `.dots` (one
`radial-gradient` at `background-size: 11.111% 11.111%`), `.face` (the snippet), `.gutters` (two
`repeating-linear-gradient`s with hard stops at `0 0.9%` / `0.9% 11.111%` and
`background-position: -0.45% -0.45%`). Both static layers are `pointer-events: none`.

### `src/lib/ui/PadCanvas.svelte`

```ts
let {
  entry,
  hero = false,
  onready,
}: {
  entry: FrontDoorEntry;
  hero?: boolean;
  /** Hands the element to the parent, which is what registers it. */
  onready: (id: string, canvas: HTMLCanvasElement) => void;
} = $props();
```

`data-testid="pad-canvas-{entry.id}"`, `role="img"`,
`aria-label="{entry.name}, live pad simulation"`. CSS is `display: block; inline-size: 100%;
block-size: 100%; image-rendering: pixelated`, plus `cursor: crosshair` when `hero`. It sets **no**
`width`/`height` attribute and takes **no** 2D context — `SimHost.register` owns both.

### `src/lib/ui/Coverflow.svelte`

```ts
let {
  initialId,
  onskipped,
}: {
  /** Centre this entry on arrival. An unknown id opens on the row's first. */
  initialId?: string;
  /**
   * The ids the vendored shelf could not build an engine for. Reported once,
   * after mount, so plan 04-07's name plate can render "{name} - unavailable"
   * without reaching into this component.
   */
  onskipped?: (ids: readonly string[]) => void;
} = $props();
```

`data-testid="coverflow"`, `data-ready={ready}`, `role="listbox"`,
`aria-label="ZONA configurations"`, `aria-orientation="horizontal"`, `tabindex="0"`,
`aria-activedescendant="slot-{heroId()}"`. Each slot is `id="slot-{entry.id}"`, `role="option"`,
`aria-selected`, `data-offset={slot.offset}`.

Its six runes, and nothing else, cross into Svelte — the check printed them:

```
untrack(openingCentre | 3 | 0 | false | false | []
```

(`centre`, `radius`, `heroPx`, `ready`, `transitions`, `skipped`. The first is truncated by the
matcher's `[^)]*`, which stops at the first `)`.) The `SimHost`, the `Map<string, HostEngine>` and the
`Map<string, HTMLCanvasElement>` are plain `let`/`const`.

### `src/lib/ui/FrontDoor.svelte`

```ts
let {
  initialId,
  splash = false,
}: {
  /** Centre this entry on arrival. Plan 04-09's deep-link route passes it. */
  initialId?: string;
  /** Declared for plan 04-07, which renders the splash from it. */
  splash?: boolean;
} = $props();
```

`data-testid="front-door"`, `data-splash={splash}`. One `<h1>` (the wordmark, Micro role, accent),
the headline (Body role, `--color-ink-quiet`, centred, 48px below the wordmark), then the row 32px
below that. `src/routes/+page.svelte` is now `<FrontDoor splash />` and nothing else; the layout's
GPLv3 footer is untouched.

---

## The numbers the plan asked for

### The measured hero pixel size at the default Playwright viewport

Measured in Chromium at the default 1280 × 720 viewport with a temporary probe inside test 1, then
reverted (`git checkout --`, tree clean, confirmed):

```
{"viewport":[1280,720],"stage":[1280,374.390625],"heroCanvas":[360.390625,360.390625]}
```

`--pad-hero: clamp(260px, 52vmin, 560px)` resolves to **374.390625px** (52% of the 720px minimum
dimension), which is what `slotFor` is handed. The hero **canvas** is 360.390625px square: the stage
height less the 1px border on each side and the 6px inset on each side (374.39 − 2 − 12).

### The row really recedes — the rendered geometry

The same probe read every mounted slot's client rect. This is the check that would catch a silent
flattening, which is the most likely way the 3D ladder fails:

| slot | offset | left | width | height |
| ---- | ------ | ---- | ----- | ------ |
| aurora | 0 | 453 | 374 | 374 |
| pinwheel | +1 | 771 | 270 | 278 |
| ninepads | +2 | 936 | 193 | 195 |
| starfield | +3 | 1035 | 138 | 137 |
| dial | −1 | 238 | 270 | 278 |
| faders | −2 | 151 | 193 | 195 |
| radar | −3 | 106 | 138 | 137 |

Mirror-symmetric about x = 640 to the pixel, monotonically smaller outward, and the ±1 neighbours
overlap the hero by 56px — about a seventh of its width, against the spec's "roughly a fifth". The ±1
slot is **taller than it is wide** (278 vs 270), which is the perspective foreshortening doing its job:
the near edge of a rotated pad is larger than the far edge. A flattened scene would show equal squares.

A screenshot of the front door was captured to `.tmp-e2e/front-door.png` (gitignored) and inspected:
black ground, lime wordmark top-left, the quiet centred headline, the hero framed in lime with its
glow, and the neighbours turning their inner edges toward the viewer and dissolving into the ground at
both edges through the gradient mask. No stacking anomaly, no side pad in front of the hero,
`zIndex` and `translateZ` agreeing as `slots.ts` predicted.

### The grid-protocol chunk the guard found

```
front door is clear of C1rLf53t.js
```

`build/_app/immutable/chunks/C1rLf53t.js` is the chunk containing
`GRID_PARAMETER_ELEMENT_POTMETER`, and `build/index.html` does not reference it. The prerendered
front door contains all seven pad frames and their seven canvases before any of it loads:

```
pad frames: pad-aurora pad-pinwheel pad-ninepads pad-starfield pad-radar pad-faders pad-dial
canvases: 7
activedescendant: aria-activedescendant="slot-aurora"
```

### Whether the wheel and touch-drag thresholds needed adjusting

**No.** They shipped at the contract's **40px** accumulated `|deltaX|` with a **260ms** cooldown, and
**48px** for a horizontal touch drag. Neither is exercised by an automated test — Playwright can
synthesise a wheel event but not a trackpad's momentum curve, and the drag threshold needs a real
touch device to judge — so both stand as the approved numbers rather than as tuned ones. One addition
that is not a change to either threshold: a gesture that goes quiet for **300ms** starts its
accumulation again, so two unrelated small nudges a second apart cannot add up to a step.

### Anything about the 3D stacking that behaved differently from the UI spec's ladder

Nothing did. The one thing worth writing down is a rendering detail rather than a divergence: at ±3
the combination of `opacity: 0.24`, `filter: brightness(0.55)` and the edge mask's fade makes the
outermost pads very nearly invisible — visible as structure, not as content. That is the approved
ladder behaving as specified (the mask exists so the row dissolves rather than being guillotined), but
if the row ever reads as five pads rather than seven, that is where to look, and the fix is the
`SLOT_OPACITY` rung in `slots.ts`, not new CSS here.

---

## The import scan

Written to a scratch `.mjs` under the system temp directory and run with `node`, per the acceptance
criterion — never into the repository. It strips comments with the standing rule's backslash-free
expression, collects only **static** specifiers (the `from` form, anchored per line), fails if it
collected none, fails on any that names the vendored tree, the upstream package or the compile
surface, and then separately asserts that the vendored tree *does* arrive through an awaited
`import(` inside `onMount`.

```js
import { readFileSync } from "node:fs";

const strip = (t) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const file = "src/lib/ui/Coverflow.svelte";
const src = strip(readFileSync(file, "utf8"));

// STATIC specifiers only: the `from` form, anchored per line. A dynamic
// import( ) is deliberately not collected - it is the point of the rule.
const specs = [];
const re = /^[^\n]*\bfrom\s*("([^"]*)"|'([^']*)')/gm;
let m;
while ((m = re.exec(src)) !== null) specs.push(m[2] ?? m[3]);

if (specs.length === 0) {
  console.error("collected no static specifiers - the matcher is broken");
  process.exit(1);
}

const forbidden = [
  "vendor",
  "intechstudio",
  "$lib/pad",
  "lib/pad",
  "pad-sim",
  "_pad",
];
const bad = specs.filter((s) => forbidden.some((f) => s.includes(f)));
console.log("static specifiers:", JSON.stringify(specs));
if (bad.length > 0) {
  console.error("forbidden static specifiers: " + JSON.stringify(bad));
  process.exit(1);
}

const dynamic = [...src.matchAll(/await[^;]*import[(]\s*("([^"]*)"|'([^']*)')/g)]
  .map((d) => d[2] ?? d[3])
  .concat(
    [...src.matchAll(/import[(]\s*("([^"]*)"|'([^']*)')/g)].map(
      (d) => d[2] ?? d[3],
    ),
  );
const uniqueDynamic = [...new Set(dynamic)];
console.log("dynamic specifiers:", JSON.stringify(uniqueDynamic));
if (uniqueDynamic.length === 0) {
  console.error("no dynamic import( ) found - the simulator is not lazy");
  process.exit(1);
}
if (!/onMount\([^]*await Promise\.all\(\[[^]*import\(/.test(src)) {
  console.error("the dynamic import is not awaited inside onMount");
  process.exit(1);
}
console.log(
  "ok - " +
    specs.length +
    " static specifiers, none forbidden; the vendored tree arrives through " +
    uniqueDynamic.length +
    " awaited dynamic imports inside onMount",
);
```

```
static specifiers: ["svelte","$lib/catalog/front-door","$lib/coverflow/slots","$lib/sim/host","$lib/sim/touch","./PadCanvas.svelte","./PadFrame.svelte"]
dynamic specifiers: ["../../vendor/botor/_pad","../../vendor/botor/pad-sim"]
ok - 7 static specifiers, none forbidden; the vendored tree arrives through 2 awaited dynamic imports inside onMount
EXIT: 0
```

---

## Verification

| Check | Result |
| --- | --- |
| Task 1 — neither pad component reaches the simulator (comment-stripped) | exit 0 |
| Task 1 — `image-rendering: pixelated` present | exit 0 |
| Task 1 — the canvas is `role="img"` with the live-simulation name | exit 0 |
| Task 1 — one `radial-gradient`, exactly **2** `repeating-linear-gradient` | exit 0 |
| Task 1 — no `drop-shadow` / `hue-rotate` / `blur(` / `sepia` / `invert(` (comment-stripped) | exit 0 |
| Task 1 — the 6px canvas inset present | exit 0 |
| Task 2 — the import scan above | exit 0 |
| Task 2 — `.band` clips with `overflow: clip` and carries no `preserve-3d`; `.stage` carries `preserve-3d` + `perspective` and no `filter` | exit 0 (`band clips without preserve-3d; stage is the 3D context and carries no filter`) |
| Task 2 — `grep -c "overflow: hidden"` | prints `0` |
| Task 2 — `slotFor` and `slotOffset` both used | exit 0 / exit 0 |
| Task 2 — no non-scalar in a rune | exit 0, printed `untrack(openingCentre \| 3 \| 0 \| false \| false \| []` |
| Task 2 — `role="listbox"`, `aria-activedescendant`, `role="option"` | exit 0 / exit 0 / exit 0 |
| Task 3 — `npx playwright test e2e/first-experience.e2e.ts` | **3 passed (40.7s)**; `grep -ci failed .tmp-e2e/04-06.log` prints `0` |
| Task 3 — full suite `npx playwright test` | **13 passed (50.6s)**; `grep -qE "Tests? +[0-9]+ failed"` exits 1; `grep -ci failed` prints `0` |
| Task 3 — exactly one level-1 heading in `FrontDoor.svelte` | exit 0 |
| Task 3 — `build/index.html` exists and contains `data-testid="coverflow"` | exit 0 / exit 0 |
| Task 3 — the front door does not reference the grid-protocol chunk | exit 0 (`clear of C1rLf53t.js`) |
| Task 3 — the headline is the contract string with U+2019 and U+2026 | exit 0 |
| `npm run check` | 409 files, **0 ERRORS, 0 WARNINGS** |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 |
| `npm run test:quick` through the helper at 36 / 527, three times | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| Port 4173 free before each Playwright run; nothing listening afterwards | confirmed four times (`netstat` empty; no `workerd` or `wrangler` process) |
| Working tree clean after every commit; no scratch file left in the repository | confirmed |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The band pushed a horizontal scrollbar onto the front door**

- **Found during:** Task 4-06-03, composing the page.
- **Issue:** `inline-size: min(100vw, 1280px)` is the approved geometry, but `100vw` includes the
  vertical scrollbar's width and the containing block does not. The front door is always taller than
  the viewport (the GPLv3 footer is below the fold), so the band was about fifteen pixels wider than
  the space it sat in — and `margin-inline: auto` is over-constrained at that width and resolves to
  zero, so the overflow was not even symmetric.
- **Fix:** `max-inline-size: 100%` beside it, with the reason in a comment. The approved intent —
  full-bleed, capped at 1280px — is unchanged; only the pathological case is.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `eec68bc`

**2. [Rule 3 - Blocking] `role="img"` on a canvas is a Svelte a11y warning**

- **Found during:** Task 4-06-01, first `npm run check`.
- **Issue:** `svelte-check` reported `a11y_no_interactive_element_to_noninteractive_role` — Svelte
  counts `<canvas>` as interactive because it can be scripted into a control. The approved contract
  (04-UI-SPEC, Accessibility) requires exactly `role="img"` with the "live pad simulation" name, and
  ARIA itself places no role restriction on canvas. Obeying the linter would have broken the contract.
- **Fix:** one `<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->` with the
  reasoning in a **separate** comment above it. The separation is not cosmetic: everything after the
  rule name inside a `svelte-ignore` comment is parsed as further rule names, and the first attempt
  produced **78** `svelte/no-unused-svelte-ignore` errors, one per word of the explanation.
- **Files modified:** `src/lib/ui/PadCanvas.svelte`
- **Commit:** `58205bb`

**3. [Rule 3 - Blocking] `role="option"` without a tabindex is a Svelte a11y warning**

- **Found during:** Task 4-06-02.
- **Issue:** `a11y_interactive_supports_focus` wants every element with an interactive role to be
  focusable. The approved pattern is a `listbox` that keeps focus itself and names the centred option
  through `aria-activedescendant`, in which options are deliberately not focusable.
- **Fix:** a documented `svelte-ignore`. Adding `tabindex="-1"` to each option would satisfy the rule
  and break the interaction: a click on a side pad would move focus off the band, so the next arrow
  key would go nowhere.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `289ee41`

**4. [Rule 3 - Blocking] `svelte/prefer-svelte-reactivity` wanted the engine map to be a `SvelteMap`**

- **Found during:** Task 4-06-02, `npm run lint`.
- **Issue:** ESLint reported both `new Map` instances as missed reactivity. Here the rule is exactly
  backwards: `SvelteMap` is a reactive proxy, and a proxy trap around an engine that is read on every
  one of the hundred ticks a second is the precise performance cliff the plan's standing rule 3
  exists to prevent (04-RESEARCH §Pitfall 3).
- **Fix:** `// eslint-disable-next-line svelte/prefer-svelte-reactivity` on each, with a five-line
  comment stating why, and the fact that neither map is ever read from the markup so nothing needs to
  react to it.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `289ee41`

**5. [Rule 3 - Blocking] Reading `initialId` at component-init scope warned `state_referenced_locally`**

- **Found during:** Task 4-06-02.
- **Issue:** The opening centre is computed once from the `initialId` prop, which Svelte 5 warns about
  because only the initial value is captured. Capturing only the initial value is precisely what is
  wanted — a later change to `initialId` must not yank the row out from under a visitor who has
  stepped it — so the warning is right about the mechanism and wrong about the intent.
- **Fix:** the read moved into `openingCentre()` and called through `untrack`, with the intent stated
  in the doc comment.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `289ee41`

**6. [Rule 3 - Blocking] The hero's pointer handlers on a plain wrapper warned `a11y_no_static_element_interactions`**

- **Found during:** Task 4-06-02.
- **Issue:** The first draft put the five pointer handlers on an inner `<div class="face">` to keep
  them off the `role="option"` element. A plain div with a `pointerdown` handler must have an ARIA
  role, so `svelte-check` warned.
- **Fix:** the handlers moved onto the slot itself — which is what the plan's action text actually
  says ("on the hero slot only") — and the wrapper deleted. The slot already has `role="option"`, so
  the warning goes away with no suppression, and `touch-action: pan-y` moved onto the slot with it.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `289ee41`

### Observations, not deviations

- **The skipped-entry collection is a `string[]` in a rune, not the plan's plain `Set<string>`.** The
  markup has to read it to decide whether a slot gets a canvas at all, so it must be reactive; a
  `Set` in a rune would be `$state`-proxied, and `SvelteSet` is the very thing deviation 4 argues
  against. A short array of ids read once per render is a scalar-ish value with no engine, canvas or
  frame buffer in it, and the rune check passes on it. It is *exposed* through the `onskipped`
  callback prop rather than as an instance export, because a callback is what plan 04-07's name plate
  can actually consume without `bind:this`.
- **`data-ready` and `data-splash` are on the DOM.** `ready` had to be observable for plan 04-07's
  splash to know when the machines are running, and `splash` had to be *used* somewhere or ESLint
  would call the prop unused. Both are attributes rather than classes so a test can read them.
- **Nothing calls `unregister` when a slot leaves the window.** `register` on an id that already
  exists unregisters the old canvas first, and re-registering the **same engine object** does not
  reset it, so a slot leaving and returning resumes rather than restarting at tick 0 — which is the
  behaviour 04-05 pinned in its test 7. Unregistering eagerly on the step would zero a canvas that
  Svelte is about to remove anyway, for no benefit.
- **`setInWindow` is called for every entry on every step**, per 04-05's note that nothing else sets
  it and `inWindow` defaults to `true`.
- **The transition is suppressed for exactly one frame after mount.** `heroPx` is 0 during prerender,
  so every slot's `translateX` is 0 and the server-rendered row is a stack. Turning the CSS transition
  on inside a `requestAnimationFrame` after the first measurement is what stops the row visibly
  fanning out of that stack on arrival.
- **Playwright ran four times** (the new file alone, twice more for the two temporary probes, and the
  full suite once). The plan asks for one full-suite run and it got exactly one; the probe runs were
  `--grep`-scoped to a single test. Port 4173 was confirmed empty before each and after all of them.
- **Both temporary probes were reverted with `git checkout --`** and `git diff --quiet` exited 0
  afterwards. Neither is in any commit.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.
- **The import scan and the two file edits that needed multi-line replacements ran from `node -e` and
  from a scratch `.mjs` under the system temp directory.** Nothing was left in the repository.

---

## Notes for later plans

- **Baseline for 04-07: quick 36 / 527 (plus the one pre-existing todo), sweep 1 / 9, e2e 13.**
  Re-measure before applying a delta.
- **`FrontDoor.svelte` already declares `splash`.** Plan 04-07 changes that one file and neither route
  file, which is why the prop is there now.
- **The splash must sit above the row without touching it.** The coverflow is mounted and ticking from
  `t = 0` (W-10) — it already is, because `Coverflow`'s `onMount` runs regardless of what is painted
  over it. A splash that unmounts the row would make "you arrive and the machines are already running"
  false.
- **`onskipped` is how the name plate learns about a broken entry.** It fires once, after the dynamic
  import resolves, with the ids the vendored shelf could not build. Today it fires with an empty array.
- **The hero's pointer handlers exist and deliver touches; the tap-versus-choose rule does not.**
  Plan 04-08 owns the 250ms / 6px disambiguation, and half of it was deliberately not written here.
- **`replaceState` on step is not implemented.** D-10 and W-16 call for it; plan 04-09 owns the URL,
  and adding it here would have meant two plans editing the same handler.
- **If the row ever reads as two fans instead of one row**, the cause is the `rotateY` sign in
  `slots.ts`, not this component — `slots.spec.ts` test 4 is the gate.
- **Do not add a second `<h1>`.** `e2e/smoke.e2e.ts` asserts a visible level-1 heading on `/`, and the
  wordmark is it.

## Known Stubs

**One, declared and bounded.** `FrontDoor.svelte`'s `splash` prop is accepted and does nothing except
render as `data-splash`. That is deliberate sequencing, stated in the plan's own objective
("Deliberately **not** here: the name plate, the fidelity line and the splash — plan 04-07"), and the
prop exists now so the two route files are written once rather than twice. It does not prevent this
plan's goal: `/` is fully functional without it.

Nothing else stubs. Every pad in the row is running a real `PadSim` over a real compiled
configuration; no frame is hand-authored, no motion is faked, no entry renders placeholder copy, and
the one honestly-still pad is asserted to be still rather than quietly hidden.

## Requirements

`requirements: [PREV-01, PREV-02, PREV-04, IDENT-01]` in the plan frontmatter is phase-level
attribution. Three of the four are now genuinely demonstrable and one is not yet whole, and
**none is marked** in `.planning/REQUIREMENTS.md`:

- **PREV-01** ("every visible pad is animating") is now true on screen and asserted in a browser, in
  both directions — but its honest caveat is the row's three static entries, whose quiet copy is shown
  by the fidelity line and name plate that plan 04-07 builds. Assess it after 04-07.
- **PREV-02** (the preview is compiled, never hand-authored) holds structurally: every pad's pixels
  come from `new PadSim(presetById(id).state)` and there is no hand-authored frame anywhere. The
  visitor-facing *claim* — the fidelity line — is 04-07's.
- **PREV-04** (mouse-as-finger) is implemented on the hero and cannot be automated: Playwright can
  synthesise pointer events, but whether the instrument *feels* right under a finger is a human check.
  It belongs on the phase's manual checklist.
- **IDENT-01** (the 9×9 outline is logo, pad frame and loading state) has its pad frame and its logo;
  the loading state — the walking-cell motif — is 04-07's `PadSpinner`.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All five created files, the two modified files and this SUMMARY exist on disk, and all three claimed
commits (`58205bb`, `289ee41`, `eec68bc`) are in the history.
