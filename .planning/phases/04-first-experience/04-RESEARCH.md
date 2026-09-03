# Phase 4: First Experience - Research

**Researched:** 2026-09-04
**Domain:** Svelte 5 coverflow over a firmware-faithful canvas simulator; CSS 3D compositing; static-site deep links; Web Serial connect-and-identify
**Confidence:** HIGH on the measured and source-read findings; MEDIUM on the visual choices that need eyeballing; LOW on nothing that blocks planning

<user_constraints>

## User Constraints (from CONTEXT.md)

**These are NON-NEGOTIABLE. Copied verbatim from `.planning/phases/04-first-experience/04-CONTEXT.md`.**

### Locked Decisions

#### The screen **[user]**

- **D-01:** First real screen is a **coverflow**: one 9×9 pad large and centred, neighbours receding
  left and right with real depth (smaller, dimmer, overlapping, falling off the viewport edge).
- **D-02:** **Every visible pad animates** — its own config's simulation. Centre: full size, full
  fidelity, mouse-as-finger. Sides: smaller, still moving (reduced tick/frame rate allowed).
- **D-03:** **The pad is the card.** No title block, no description, no chrome around a pad. The only
  text: a quiet mixed-case headline above ("You've got to start somewhere…" — rounded geometric sans)
  and a lime-outlined **name plate** below the centre pad with solid lime triangle arrows
  `◀ <name> ▶`. Name and navigation are one element.
- **D-04:** **Coverflow = front door only.** It is the wow moment where the visitor picks an initial
  config. The sophisticated catalog is a later, separate screen.
- **D-05:** **Choosing the centre pad reveals `TRY ON DEVICE`** ("that's the whole point"); a
  `KEEP ON DEVICE` control exists, visibly secondary (SAFE-02). Nothing appears until chosen.
- **D-06:** **Splash → dissolve.** The glyph-field HANGAR wordmark holds, then dissolves into the
  coverflow. No click-through.
- **D-07:** Identity: true-black ground; one acid lime (~#D6FF4E); glyph-field texture belongs to the
  splash, the coverflow background stays calm black so pads read as light; wide-tracked uppercase
  wordmark; the 9×9 outline is logo, loading state and pad frame.

#### Placement of what comes later **[orchestrator — user said "figure it out"]**

- **D-08:** Knobs and the two 908 meters (Phase 5) belong to the **chosen** pad, not the coverflow.
  On choose, the row recedes (side pads dim further and shrink) and the hero stays centred; a
  **panel slides in beneath the name plate** holding, top to bottom: `TRY ON DEVICE` (primary) and
  `KEEP ON DEVICE` (secondary, smaller, separated), then — Phase 5 — the knobs, then the two meters.
  Why: it keeps the pad the largest thing on screen, the arrows still step configs while chosen
  (the panel re-fills), and nothing competes with the pad horizontally at phone widths. Phase 4
  builds the panel with the two install controls and a labelled empty region reserved for knobs.
- **D-09:** Un-choose: `Esc`, clicking the dimmed row, or stepping with the arrows past the chosen
  config returns to the plain coverflow; the panel slides away.

#### Interaction **[orchestrator]**

- **D-10:** Stepping: name-plate arrows, `←`/`→`, horizontal wheel/trackpad swipe, and clicking a
  side pad (brings it to centre). Wraps at both ends. Order = catalog data order (featured first,
  then the nine seeds, then Phase 8 additions).
- **D-11:** Choosing: click/tap the centre pad, `Enter`, or clicking the name plate's name. Hover
  over the centre pad already shows mouse-as-finger (the instrument is playable before choosing).
- **D-12:** Deep link `#/c/<id>` (or the route the planner prefers) lands with that config centred,
  splash skipped on deep links (the wow is for the front door; a shared link should open fast).
- **D-13:** `TRY ON DEVICE` in this phase: enabled only when `"serial" in navigator && isSecureContext`;
  on click it runs Phase 2's connect + identify (the proven `sequence.ts` path) and then shows a
  plain "Install arrives in the next release — your ZONA <fw> on page <n> is identified" state. It
  NEVER writes. On unsupported browsers it is present-but-disabled with the DEGR-02 reason.
  `KEEP ON DEVICE` is disabled with the reason "after a try-on" in this phase.
- **D-14:** Reduced motion: `prefers-reduced-motion` stills every pad to a representative frame
  (tick 64), the splash dissolve becomes a 200 ms crossfade, coverflow stepping is instant.

#### Rendering **[orchestrator, per STACK research]**

- **D-15:** One shared `requestAnimationFrame` for the whole page (the vendored `pad-sim-host.ts`
  scheduling: 10 ms accumulator, 100 ms clamp, 33 ms paint throttle, IntersectionObserver with
  `rootMargin: "200px"`, self-cancelling loop). Paint = 9×9 `ImageData` upscaled with
  `imageSmoothingEnabled = false`; the grid outline is a static SVG/CSS overlay, never `strokeRect`
  per cell per frame. Side pads render at 20 fps; the hero at 30.
- **D-16:** Depth is CSS 3D (`perspective`, `translateZ`, `rotateY` small angles, `filter: brightness`)
  on canvas-bearing elements — no WebGL, no per-card contexts beyond the 2D canvas.
- **D-17:** The fidelity line ("what the simulator matches exactly and cannot show") sits under the
  name plate in small text, always present, quiet.

#### Data **[orchestrator]**

- **D-18:** Catalog data file `src/lib/catalog/entries.ts`: Profile-Cloud-shaped objects
  `{ id, name, description, tags, featured, configType: "profile", type: ModuleType.ZONA, version,
  configs: [{ controlElementNumber: 0, events: [{ event: 0, config }, { event: 6, config }] }] }`
  PLUS `state: PadState` (the compiler input; the Lua is derived by the vendored compiler at build or
  load, never hand-authored — PREV-02) and `preview` metadata. Seeds = the nine BOTOR presets by
  `presetById`. Phase 8 appends. A Vitest gate compiles every entry and asserts both events ≤ 908
  compressed and character-identical to `preset-baseline.json` for the nine seeds.
- **D-19:** The compile surface is `src/lib/pad` (Phase 3) behind `padReady()`; the simulator needs
  no WASM, so the coverflow animates before the formatter loads; the formatter is prefetched on
  `requestIdleCallback` and awaited only when a cost is asked for (Phase 5) or `TRY ON DEVICE` needs
  a compiled string (Phase 7).

### Claude's Discretion

- Exact typography (a free, GPL-compatible rounded geometric sans for the headline; the wordmark's
  wide-tracked face), spacing, the dissolve duration (~1.2 s), the coverflow geometry (angles, gaps,
  how many neighbours are visible: 2–3 per side at desktop, 1 per side at phone widths).
- Splash implementation (canvas-drawn glyph field vs a static generated image).
- Whether the hero's mouse-as-finger uses the vendored host's preview canvas path or a thin adapter.
- Route shape for deep links and how the prerenderer handles them.

### Deferred Ideas (OUT OF SCOPE)

- **Sophisticated catalog** (sort Featured/Newest/Name — CAT-02; search, tags, capability filters,
  list/detail browse — D2/D3/D6/D7) → **new phase inserted after Phase 5** ("Catalog Browse").
- Knobs, meters, SURPRISE ME, URL stamps, OG images → Phase 5 (dock into the ChosenPanel, D-08).
- Real install (`TRY ON DEVICE` writing, snapshot, PUT BACK, `KEEP ON DEVICE`) → Phase 7.
- The user's further layout references (promised after his breather) → revisit D-08..D-17 then.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description (from REQUIREMENTS.md) | Research Support |
|----|-------------------------------------|------------------|
| **PREV-01** | Every card in the catalog animates live in the firmware-faithful simulator with no hardware attached | §Measured Facts (tick cost 0.35 µs, render 6 µs — the simulator is not a budget constraint at any plausible pad count); §Pitfall 1 (**four of the nine seeds do not animate and one is entirely dark** — this requirement cannot be met literally by the seed row; recommendation given) |
| **PREV-02** | The simulator consumes the exact compiler output that would be written to the module — no hand-authored animation anywhere | §Architecture Pattern 4 (catalog carries `state: PadState`, never Lua; the Vitest gate compiles every entry against `preset-baseline.json`); §Don't Hand-Roll (never fake motion for a static preset) |
| **PREV-03** | The site states in one line what the simulator matches exactly and what it cannot show | §Code Examples (draft fidelity line, grounded in what the simulator provably does and does not model); §Pitfall 1 (the line must also carry the static/dark truth) |
| **PREV-04** | The focused card accepts mouse-as-finger input so the user can play the instrument | §Architecture Pattern 3 (one engine per entry, pointer samples delivered tick-locked; the vendored `attachPreview` design must be adapted, not reused as-is, because re-attaching restarts the engine at tick 0) |
| **PREV-05** | Offscreen cards pause (IntersectionObserver with a wake margin), `prefers-reduced-motion` falls back to a still frame, render path stays in budget at a dozen visible cards at 30 fps | §Architecture Pattern 2 (HANGAR-owned host); §Measured Facts (budget headroom quantified); §Pitfall 4 (IO alone is not enough in a coverflow — pads are on-screen but slot-hidden) |
| **CAT-01** | Every configuration has a deep link that lands on its detail view | §Architecture Pattern 5 (`#/c/<id>`, hash-only, zero prerender changes, forward-compatible with Phase 5's stamp); §Pitfall 7 (ESLint `svelte/no-navigation-without-resolve` blocks the obvious call) |
| **CAT-04** | The catalog is a static data file of Profile-Cloud-shaped config objects plus tuning metadata, buildable with no backend | §Architecture Pattern 4; §Code Examples (entry shape) |
| **CONT-01** | The nine BOTOR shelf presets are in the catalog, each compiling to the same Lua as BOTOR at the pinned protocol version | §Validation Architecture (the compile gate against `src/lib/fidelity/preset-baseline.json`, which was produced by BOTOR's own compiler) |
| **CONT-03** | Every catalog entry has a name, a one-line description, feel-based tags, a Featured flag and a default knob state | §Architecture Pattern 4 (`PadPreset` already supplies `name`, `sentence`, `knobs`, `state`, `quiet`; HANGAR authors `tags` and `featured`) |
| **IDENT-01** | True-black ground, single acid-lime accent, generative glyph-field texture as wallpaper, wide-tracked uppercase type, 9×9 pad outline as logo/loading/frame | §Architecture Pattern 6 (splash glyph field drawn as canvas primitives, not text); §Architecture Pattern 1 (the pad frame is a static CSS overlay that doubles as the logo and the loading state) |
| **IDENT-02** | The site is motion-forward while honouring `prefers-reduced-motion` | §Architecture Pattern 2 (live media-query subscription, tick-64 representative frame); §Validation Architecture (Playwright `reducedMotion: 'reduce'`) |
| *(DEGR-02, mapped to Phase 7)* | Install controls present but disabled with the reason inline on unsupported browsers, never hidden | Phase 4 delivers the Phase-4 half via D-13; §Architecture Pattern 7 reuses `failureCopy("no-web-serial")` unchanged |

</phase_requirements>

<research_summary>

## Summary

This phase does not need a new library. Everything it renders is already in the repository: the
vendored `PadSim` engine, the nine `PRESETS`, the fidelity fixtures that pin them, and the Phase 2
transport. The research therefore concentrated on three questions the planner cannot answer from the
existing documents: **what the render budget actually is** (measured, not estimated), **what the nine
seed presets actually look like when simulated** (read off a committed fixture), and **which of the
locked decisions have a mechanism that does not exist as written**.

The measurement result is decisive and it changes the shape of the plan. A `PadSim.tick()` costs
**0.28–0.40 µs** and a full 81-cell frame render costs **4.4–9.0 µs** on this machine. Seven pads
ticking at the firmware's 100 Hz cost **0.25 ms of CPU per second**; seven pads painting at
30/20 fps cost **0.9 ms per second**. The simulator is three orders of magnitude away from being the
constraint. Every render-budget instinct in the prior research — reduced tick rates for side pads,
worry about a dozen engines — is aimed at the wrong half. The entire budget question in Phase 4 is
**canvas paint calls and CSS compositing**, and the two levers that matter are (a) not putting
`filter: blur()` on anything that repaints and (b) not letting a CSS 3D scale change force a
re-rasterisation of a canvas mid-transition.

The fixture result is the one the user needs told to him. `src/lib/fidelity/golden-frames.json` says
it in its own note: *"Four presets are static at every tick by design — joystick, ninepads, faders
and tpad — and tpad's frame is all zeros because it writes no LEDs."* Only **five of the nine seeds
animate** (aurora, pinwheel, starfield, radar, dial). Two are static but lit (ninepads, faders), one
is a single dim dot on black (joystick, 2 non-zero bytes out of 243), and one — the Trackpad — is a
**completely black pad**, correctly, because the trackpad configuration writes no LEDs at all. The
acceptance picture for criterion 1 ("every visible pad is animating live") cannot be met by the seed
row as it stands, and the honest answers are catalog ordering plus a per-entry motion classification,
not faked animation.

Third, three of the locked decisions need a corrected mechanism rather than a corrected decision.
`putImageData` is *"not affected by the canvas transformation matrix"* (MDN) — it cannot upscale, so
D-15's "9×9 ImageData upscaled" has to be a 9×9 scratch canvas plus a `drawImage` with
`imageSmoothingEnabled = false`. D-16's `filter: brightness` is legal on a 3D-transformed leaf but
`filter` is one of the CSS grouping properties that forces `transform-style: flat` on descendants,
and so is `overflow` at any value other than `visible` **or `clip`** — which is exactly how the
coverflow gets pads to fall off the viewport edge without collapsing its own 3D space. And D-12's
hash update cannot be written the obvious way, because `svelte/no-navigation-without-resolve` is
`error` in the recommended config this repo uses and it allows only an empty string or a `resolve()`
call as the first argument to `replaceState`.

**Primary recommendation:** write a HANGAR-owned simulator host (`src/lib/sim/`) that borrows the
vendored host's *scheduling* — 10 ms accumulator, 100 ms clamp, decoupled paint, self-cancelling
loop, live reduced-motion subscription — but owns its own painter, its own per-slot paint intervals
and one uniform backing-store size for every pad; keep `PadSim` as the only thing imported from the
vendored tree; keep every piece of geometry, stepping and deep-link logic in pure `.ts` modules so it
is testable in the existing node Vitest project; and dynamic-import the whole simulator bundle inside
`onMount` so the splash has a job and `/` keeps its current 131 KB-lighter preload list.

</research_summary>

<project_constraints>

## Project Constraints (from CLAUDE.md)

### ⚠️ First, a conflict the planner must not walk into

Two `CLAUDE.md` files are in scope. `C:\Users\sabot\Documents\Claude\CLAUDE.md` (the parent
directory) describes the **Intech Studio Marketing Dashboard** — Next.js 16, React 19, Recharts,
Tailwind, `google-spreadsheet`. **None of it applies to HANGAR.** A naive reading of the merged
instructions would have the planner reaching for Recharts and `next/dynamic`. Only
`C:\Users\sabot\Documents\Claude\hangar\CLAUDE.md` governs this repository.

### Directives that bind this phase

| Directive | Source | Effect on the plan |
|---|---|---|
| Start work through a GSD command; no direct edits outside a GSD workflow | hangar/CLAUDE.md §GSD Workflow Enforcement | All Phase 4 work runs under `/gsd:execute-phase` |
| SvelteKit 2.70.3 + Svelte 5.57.0 + Vite 8.2.2 + TypeScript 6.0.3 + Tailwind 4.3.3, `adapter-static` | §Recommended Stack (verified installed, see §Environment Availability) | No framework additions; no `svelte.config.js` (a spec forbids it) |
| **Never** 81 DOM elements per card | §What NOT to Use | One `<canvas>` per pad |
| **Never** WebGL, one context per card | §What NOT to Use | 2D canvas only |
| **Never** `ctx.shadowBlur` per lit cell | §What NOT to Use | Glow comes from a static CSS layer or a `lighter` composite pass |
| **Never** 81 `strokeRect` per card per frame | §What NOT to Use | The grid is a static CSS overlay — and the vendored `blit()` does exactly this, which is why it cannot be reused |
| **Never** browser sniffing for the Web Serial gate | §What NOT to Use | `webSerialAvailable()` from `$lib/transport`, unchanged |
| **Never** `initLuaFormatter()` at app boot | §What NOT to Use | The coverflow must not await `padReady()`; prefetch on idle only |
| **Never** `requestPort()` after an `await` of the WASM init | §What NOT to Use | `requestPort()` is the first statement in the click handler |
| Exact pin, no caret, on `@intechstudio/grid-protocol` | §What NOT to Use | Untouched by this phase |
| Never format `src/vendor/`; `.prettierignore` covers it | 03-CONTEXT / config-shape.spec | Any adaptation of the vendored host is a **new file**, never an edit |
| No emojis, minimal chrome, one accent colour | PROJECT.md §Visual Identity | Copy and markup discipline |
| "Do not spend any money" | 04-CONTEXT §Specific Ideas | Free OFL fonts, Cloudflare free tier, no paid assets |

</project_constraints>

<measured_facts>

## Measured Facts (this machine, 2026-09-04)

These were measured, not estimated. Method: `npx esbuild` bundled `src/vendor/botor/pad-sim.ts` and
`_pad.ts` to ESM and ran under Node v24.14.0 (same V8 as Chromium). 20,000 ticks per preset after a
200-tick warm-up; the frame column steps and reads `sim.frame` every iteration, so it is one tick
plus one full 81-cell render.

| Preset | `tick()` | `tick()` + full frame render | `animating` | Non-zero frame bytes (of 243) |
|---|---|---|---|---|
| aurora | 0.35 µs | 9.38 µs | **true** | 136–159 |
| pinwheel | 0.34 µs | 5.08 µs | **true** | 145–152 |
| starfield | 0.36 µs | 7.60 µs | **true** | 222–226 |
| radar | 0.35 µs | 5.05 µs | **true** | 126–157 |
| dial | 0.34 µs | 5.51 µs | **true** | 145–154 |
| joystick | 0.28 µs | 4.68 µs | **false** | **2** (one dim dot) |
| ninepads | 0.40 µs | 4.98 µs | **false** | 162 (static) |
| faders | 0.28 µs | 4.73 µs | **false** | 135 (static) |
| tpad | 0.28 µs | 4.88 µs | **false** | **0** (entirely black) |

`new PadSim(state)` costs **0.044 ms**. Constructing all nine engines at boot costs 0.4 ms — do it
eagerly, there is no reason to lazy-construct.

The `animating` and non-zero columns are corroborated independently by
`src/lib/fidelity/golden-frames.json`, whose own note states the same four presets are static by
design and that tpad's zero is correct. **HIGH confidence** — a committed fixture and a fresh
measurement agree.

### What the budget actually is

| Scenario | Ticks/s | Renders/s | Simulator CPU |
|---|---|---|---|
| 7 pads, hero 30 fps + 6 sides 20 fps | 700 | 150 | **~1.1 ms/s** (0.11% of one core) |
| 12 visible pads, all 30 fps (PREV-05's stated ceiling) | 1,200 | 360 | ~2.6 ms/s |
| 30 visible pads, all 30 fps (the STACK.md "honest ceiling") | 3,000 | 900 | ~5.8 ms/s |

**Conclusion the planner must act on:** the simulator is not a constraint. Do **not** spend a task on
reduced *tick* rates for side pads (D-02 permits it; it buys nothing and costs firmware fidelity —
a pad ticking at 50 Hz is no longer running the 100 Hz firmware). Reduced *paint* rate for side pads
is still worth having, because paint is compositor work, but it is a precaution and not a necessity.
The whole render budget lives in the CSS layer: how many composited layers, how large they are, and
whether any of them carries a per-frame `filter: blur()`.

### Bundle facts

`build/_app/immutable/chunks/C1rLf53t.js` is **131,101 bytes** and contains `@intechstudio/grid-protocol`
(matched on `GRID_PARAMETER_ELEMENT_POTMETER`). `build/index.html` does **not** preload it today,
because `/dev/fidelity/` and `/dev/skeleton/` reach it through dynamic imports inside `onMount`.

`src/vendor/botor/_pad.ts:42` is `import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";`
at module scope, and `pad-sim.ts` imports `./_pad`. The package's `package.json` declares **no**
`sideEffects` field and no `exports` map, so Rollup will not shake it out. **Any static import of the
simulator from `+page.svelte` puts that 131 KB chunk on the front door's critical path.**

</measured_facts>

<standard_stack>

## Standard Stack

This phase adds **no runtime framework dependency**. Everything animated is already vendored. The
only candidate additions are fonts, and even those are optional.

### Core (already installed and verified)

| Library | Installed version | Purpose | Why standard |
|---|---|---|---|
| svelte | **5.57.0** | Runes, keyed `{#each}`, snippets | Already the project's model; `$state.raw` is declared in the installed `types/index.d.ts` (lines 3435–3452) and is required here — see §Pitfall 3 |
| @sveltejs/kit | **2.70.3** | Routing, prerender, `$app/navigation` | `replaceState` from `$app/navigation` is the sanctioned way to touch history; kit patches `history.pushState`/`replaceState` and warns otherwise (`client.js:112`) |
| @sveltejs/adapter-static | **3.0.10** | `/` as a real prerendered HTML file | No change needed for hash deep links |
| vite | **8.2.2** | Bundler; emits the `.wasm` asset correctly | No config change needed |
| tailwindcss + @tailwindcss/vite | **4.3.3** | `@theme` tokens in `src/app.css` | v4 CSS-first; the file already carries `--color-ground` and `--color-accent` placeholders |
| typescript | **6.0.3** | Strict types across the pure modules | Do not bump to 7.x — kit's peer range is `^5.3.3 \|\| ^6.0.0` |
| @intechstudio/grid-protocol | **1.20260825.1135** (exact pin) | Reached transitively by `_pad.ts` | Untouched; the coverflow never calls into it |

### Vendored (import from `src/vendor/botor/`, never edit)

| Module | What Phase 4 uses | What Phase 4 must NOT use |
|---|---|---|
| `pad-sim.ts` | `PadSim` — `tick()`, `run(n)`, `reset()`, `setState()`, `frame` (Uint8Array 243, screen order, lazily rendered behind a `dirty` flag), `animating`, `coordMax`, `pendingTouches`, `touchDown/Move/Up` | — |
| `_pad.ts` | `PRESETS`, `presetById`, `PadState`, `GRID`, `CELLS`, `encodeStamp`, `EVENT_BUDGET` (908), `SETUP_EVENT` (0), `TIMER_EVENT` (6) | `compile`/`cost`/`measure` directly — those go through `$lib/pad` behind `padReady()` |
| `pad-sim-host.ts` | **Read it as the reference design. Import nothing from it.** | Its `SimHost` class — see §Pitfall 2 for the four reasons it cannot host a coverflow |

### Supporting (optional, discretionary)

| Library | Version | Purpose | When to use |
|---|---|---|---|
| `@fontsource-variable/quicksand` | 5.3.0 (OFL-1.1, verified on npm 2026-09-04) | The mixed-case rounded geometric headline (D-03) | If self-hosted fonts are wanted; see §Pitfall 8 for the licence-gate step it forces |
| `@fontsource/space-grotesk` | 5.3.0 (OFL-1.1, verified) | The wide-tracked uppercase wordmark (D-07) | Same |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| A HANGAR-owned host | The vendored `SimHost` verbatim | It paints 81 `strokeRect` per pad per frame (the exact thing CLAUDE.md forbids), hardcodes `THUMB_CELL = 12`, has one global `RENDER_INTERVAL_MS`, uses `threshold: 0` with no `rootMargin`, and its `blit` is a module-private function. Adapting any of it means editing a vendored file, which `VENDOR.md` and the byte gate forbid. |
| `drawImage` upscale of a 9×9 scratch | CSS `image-rendering: pixelated` on a 9×9 canvas | Cheapest possible (81 pixels of backing store per pad), but `image-rendering` is a rasterisation hint and the compositor may still bilinear-filter a 3D-transformed layer. MDN also flags canvas support as varying. Keep as a fallback, not the default. |
| `drawImage` upscale | 81 `fillRect` with insets (the vendored geometry minus `strokeRect`) | Perfectly affordable at these numbers (17k fillRect/s at 7 pads) and it produces the inter-cell gaps natively without an overlay. **Use this if the overlay proves fiddly.** It is not the recommendation only because it is 81 draw calls where 2 will do, and because it forecloses the cheap bloom pass. |
| Self-hosted OFL fonts | `system-ui` / a local stack | Zero licence work, zero bytes, but it forfeits the identity D-03/D-07 describe. |
| Hash deep link `#/c/<id>` | Real prerendered `/c/<id>/` routes | Real routes would let Phase 5 prerender a per-config OG image. CAT-09 ("named deterministic slugs `/c/starfield#stamp`") is explicitly **deferred** in REQUIREMENTS.md, and Phase 5's SC4 requires state in the hash and never the query string. See §Open Question 3. |

**Installation (only if fonts are adopted):**

```bash
npm i @fontsource-variable/quicksand @fontsource/space-grotesk
# then, mandatory, in the same task:
npm run licenses    # will FAIL until "OFL-1.1" is added to ALLOWED in scripts/gen-licenses.mjs
```

</standard_stack>

<architecture_patterns>

## Architecture Patterns

### Recommended project structure

```
src/lib/
├── catalog/
│   ├── entries.ts           # CAT-04 data file. Seeds by presetById; Phase 8 appends here.
│   ├── entries.spec.ts      # integrity + budget + motion-classification gate
│   ├── deep-link.ts         # pure: parseHash / hashFor. No DOM, no kit imports.
│   └── deep-link.spec.ts
├── coverflow/
│   ├── slots.ts             # pure: step(), slotOffset(), visibleWindow(), transformFor()
│   └── slots.spec.ts
├── sim/
│   ├── schedule.ts          # pure: the clock. ticksFor(dt), shouldPaint(), intervalFor(slot)
│   ├── schedule.spec.ts
│   ├── paint.ts             # the canvas painter (thin DOM; one exported function)
│   └── host.ts              # HANGAR's SimHost: one rAF, IO, reduced motion, teardown
├── device/
│   ├── try-on.ts            # pure state machine over GridTransport. Zero writes.
│   └── try-on.spec.ts
└── ui/
    ├── Splash.svelte        # glyph field + dissolve
    ├── Coverflow.svelte     # the row; mounts PadCanvas per entry
    ├── PadCanvas.svelte     # <canvas> + static grid/frame overlay + scrim
    ├── NamePlate.svelte     # ◀ name ▶
    └── ChosenPanel.svelte   # TRY ON DEVICE / KEEP ON DEVICE + reserved knob region
src/routes/+page.svelte      # the front door; dynamic-imports src/lib/sim in onMount
```

**Rationale.** Everything in `catalog/`, `coverflow/`, `sim/schedule.ts` and `device/try-on.ts` is
pure and runs in the existing `server` Vitest project. That is not a stylistic preference: the
project has **no client/browser Vitest project**, and `vite.config.ts` *excludes*
`src/**/*.svelte.{test,spec}.{js,ts}` from `server` without any other project picking them up — a
`.svelte.spec.ts` file written today would silently never run. See §Pitfall 6.

---

### Pattern 1: The pad is one canvas plus two static layers

Three stacked elements per pad, only the first of which ever repaints:

```
<div class="pad">                     ← transform: 3D. No filter, no overflow, no opacity<1.
  <canvas>                            ← repaints at 30 fps (hero) / 20 fps (sides)
  <div class="pad-grid">              ← static. CSS gradients draw the inter-cell gaps.
  <div class="pad-frame">             ← static. Lime rounded-square outline + the glow.
  <div class="pad-scrim">             ← static per slot. background:#000; opacity varies by depth.
</div>
```

The grid is two repeating gradients, sized off one custom property, and it never repaints:

```css
.pad-grid {
  --pitch: calc(100% / 9);
  --gap: calc(var(--pitch) / 2);          /* matches the vendored inset geometry: pad = cell/4 */
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    repeating-linear-gradient(to right,  rgb(0 0 0 / 0.86) 0 var(--gap), transparent var(--gap) var(--pitch)),
    repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.86) 0 var(--gap), transparent var(--gap) var(--pitch));
  background-position: calc(var(--gap) / -2) calc(var(--gap) / -2);
}
```

Slightly transparent black rather than opaque, so the bloom pass (Pattern 1b) leaks a little into the
gaps and the pad reads as a light source rather than a checkerboard.

The glow — the thing that makes a pad look like it is emitting — belongs on `.pad-frame`, which never
repaints, so `filter: blur()` there is paid once:

```css
.pad-frame {
  position: absolute; inset: 0; pointer-events: none;
  border: 1px solid var(--color-accent);
  border-radius: 12%;
  box-shadow: 0 0 24px -6px color-mix(in oklab, var(--color-accent) 55%, transparent),
              inset 0 0 18px -10px color-mix(in oklab, var(--color-accent) 40%, transparent);
}
```

**Never put `filter: blur()` on the canvas or on any ancestor of it.** A blur is a convolution
re-evaluated on every repaint of the filtered layer; a canvas that repaints 30 times a second turns a
one-off cost into a per-frame one. `brightness()`/`saturate()` are colour matrices and are cheap, but
the scrim div is cheaper still and avoids the `transform-style` flattening question entirely
(§Pitfall 5).

**Depth dimming: use the scrim, not `filter: brightness()`.** Same visual result, pure compositing,
no grouping-property side effects.

---

### Pattern 1b: The painter — two draw calls, one shared 9×9 scratch

D-15's mechanism needs correcting. Per MDN, `putImageData()` is *"not affected by the canvas
transformation matrix"* — it writes pixels 1:1 and cannot upscale. The working shape is a **single
page-wide 9×9 scratch canvas** that every pad reuses:

```ts
// src/lib/sim/paint.ts
import { GRID } from "../../vendor/botor/_pad";

let scratch: HTMLCanvasElement | undefined;
let scratchCtx: CanvasRenderingContext2D | undefined;
let scratchData: ImageData | undefined;

function ensureScratch(): void {
  if (scratch) return;
  scratch = document.createElement("canvas");
  scratch.width = GRID;
  scratch.height = GRID;
  // willReadFrequently is deliberately absent: we only ever WRITE this canvas.
  scratchCtx = scratch.getContext("2d")!;
  scratchData = scratchCtx.createImageData(GRID, GRID);
}

/** One pad, one frame. `frame` is PadSim.frame: 243 bytes, screen order, RGB. */
export function paintPad(
  ctx: CanvasRenderingContext2D,
  frame: Uint8Array,
  size: number,
  bloom: boolean,
): void {
  ensureScratch();
  const px = scratchData!.data;
  for (let n = 0; n < GRID * GRID; n++) {
    px[n * 4] = frame[n * 3];
    px[n * 4 + 1] = frame[n * 3 + 1];
    px[n * 4 + 2] = frame[n * 3 + 2];
    px[n * 4 + 3] = 255;
  }
  scratchCtx!.putImageData(scratchData!, 0, 0);

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;          // hard cell edges
  ctx.drawImage(scratch!, 0, 0, size, size);

  if (!bloom) return;
  // A cheap LED bloom without a convolution: the same 9x9 redrawn slightly
  // larger with bilinear filtering ON, added in. One extra textured quad per
  // pad per frame - not a blur filter, and never a per-cell shadowBlur.
  const grow = size * 0.06;
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.45;
  ctx.drawImage(scratch!, -grow / 2, -grow / 2, size + grow, size + grow);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}
```

Two `drawImage` calls and one 81-pixel `putImageData` per pad per frame, versus the vendored
`blit()`'s 81 `strokeRect` + up to 81 `fillRect`. **Confidence: HIGH on cost, MEDIUM on whether the
bloom looks right — it needs eyeballing and the `grow`/`globalAlpha` numbers are a starting point.**

---

### Pattern 2: One host, one rAF, one backing-store size

`src/lib/sim/host.ts` — a HANGAR file that borrows the vendored host's proven scheduling and
nothing else.

Keep verbatim (each of these is a bug someone already paid for):

- `TICK_MS = 10`, accumulator, `MAX_CATCHUP_MS = 100` clamp.
- `REDUCED_MOTION_TICKS = 64` for the representative frame, applied via `sim.reset(); sim.run(64)`.
- A **live** `matchMedia("(prefers-reduced-motion: reduce)")` subscription, so an OS toggle takes
  effect without a remount.
- The self-cancelling loop (`if (any) rAF(...) else lastNow = undefined`) plus `sim.animating`
  freeze detection — with four static seeds this is what makes a coverflow of instruments cost zero.
- Paint on the render cadence **and** on the frame where the animation expires, so the frozen frame
  shown is the true final one.
- One `destroy()` that cancels the rAF, disconnects the observer, detaches pointer listeners and
  removes the media listener. No `setInterval` anywhere.

Change, deliberately:

| Vendored | HANGAR | Why |
|---|---|---|
| `RENDER_INTERVAL_MS = 33` globally | Per-slot: hero **33 ms**, sides **50 ms** | D-15. Costs nothing to implement, and side pads at 20 fps halve the compositor work for six layers |
| `THUMB_CELL = 12` / `PREVIEW_CELL = 24 × dpr` | **One `CELL_PX` for every pad**, `clamp(round(HERO_CSS / 9 × min(dpr, 2)), 24, 64)` | A pad promoted from side to centre must not change backing-store size mid-transition — see §Pitfall 5 |
| `{ threshold: 0 }` | `{ threshold: 0, rootMargin: "200px" }` | D-15 and the STACK.md correction |
| `visible = IO says intersecting` | `running = IO intersecting **AND** \|slotOffset\| ≤ VISIBLE_RADIUS` | In a coverflow the far pads are on-screen but invisible; IO alone will not pause them |
| Separate thumbnail engine + preview engine | **One engine per catalog entry**; the centre entry additionally receives pointer input | Re-attaching a preview constructs a new `PadSim` at tick 0, so the centre pad would visibly restart on every step. See Pattern 3 |
| `blit()` with 81 `strokeRect` | `paintPad()` from Pattern 1b | CLAUDE.md forbids the strokeRect approach outright |

Extract the arithmetic into `src/lib/sim/schedule.ts` so it is testable in node:

```ts
// src/lib/sim/schedule.ts - pure, no DOM, no globals.
export const TICK_MS = 10;
export const MAX_CATCHUP_MS = 100;
export const HERO_INTERVAL_MS = 33;
export const SIDE_INTERVAL_MS = 50;
export const LOW_POWER_HERO_MS = 50;
export const LOW_POWER_SIDE_MS = 100;

/** Whole ticks owed for a frame gap, and the millisecond remainder to carry. */
export function ticksFor(pendingMs: number, dtMs: number): { ticks: number; carryMs: number } {
  const acc = pendingMs + Math.min(dtMs, MAX_CATCHUP_MS);
  const ticks = Math.floor(acc / TICK_MS);
  return { ticks, carryMs: acc - ticks * TICK_MS };
}

export function shouldPaint(now: number, lastPaint: number, intervalMs: number): boolean {
  return now - lastPaint >= intervalMs;
}

export function intervalFor(isHero: boolean, lowPower: boolean): number {
  if (lowPower) return isHero ? LOW_POWER_HERO_MS : LOW_POWER_SIDE_MS;
  return isHero ? HERO_INTERVAL_MS : SIDE_INTERVAL_MS;
}

/** navigator.hardwareConcurrency is Baseline-since-2022 but is a hint and may be capped or absent. */
export function isLowPower(cores: number | undefined): boolean {
  return (cores ?? 8) <= 4;
}
```

**Low-power fallback (`hardwareConcurrency <= 4`), concretely:** `VISIBLE_RADIUS` 3 → 2, hero
33 → 50 ms, sides 50 → 100 ms, `CELL_PX` cap 64 → 40, and skip the bloom pass. Default to 8 cores
when the property is absent — MDN documents it as *"Baseline Widely available… since March 2022"*
but also warns *"don't treat this as an absolute measurement."*

---

### Pattern 3: Mouse-as-finger on the hero (PREV-04)

The vendored host's `attachPreview` is the right *sampling* model and the wrong *lifecycle* model
for a coverflow. Keep the sampling verbatim, change the lifecycle.

Keep:

- `mapAxis` with the `max + 1` factor (the emitted Lua is `x*9//128`, so a 128-wide domain lands each
  ninth of the canvas on exactly one LED column, edges included).
- Handlers only *stash* samples; delivery is **tick-locked, at most one sample per contact per tick**.
  This is what makes the preview firmware-faithful against the 100 Hz pop budget, and it is why the
  simulator must stay on the main thread (STACK.md's OffscreenCanvas note).
- MOVE coalescing to the newest sample; DOWN and UP always keep their place.
- `MAX_CONTACTS = 5`; a sixth pointer ignored, as on hardware.
- `setPointerCapture` in a `try`/`catch`; the single-shot `ended` flag so `pointerup`,
  `pointercancel` and `lostpointercapture` produce exactly one UP.
- Reduced motion animates the preview **only while the user is actively causing it** — *"uninvited
  ambient animation is not the carve-out."*

Change: there is one `PadSim` per catalog entry for the whole session. Becoming the hero attaches
pointer listeners to that entry's existing canvas; leaving the centre detaches them and clears held
contacts. No engine is constructed or destroyed by stepping, so no pad ever restarts at tick 0
because the visitor pressed an arrow.

D-11 says hover already shows mouse-as-finger before choosing. That falls out for free: attach the
listeners to whichever entry is centred, chosen or not.

---

### Pattern 4: The catalog data file (CAT-04, CONT-01, CONT-03, PREV-02)

`PadPreset` already carries `id`, `name`, `sentence` (the one-line description), `knobs`
(the default knob *vocabulary*), `state` (the default knob *values*), `cost` and an optional `quiet`
line. HANGAR authors only what is missing: `tags`, `featured`, and the motion classification.

```ts
// src/lib/catalog/entries.ts
import { PRESETS, presetById, type PadState } from "../../vendor/botor/_pad";

/** Feel-based, closed vocabulary. CONT-03. The spec asserts every tag is in this list. */
export const TAGS = [
  "ambient", "rhythmic", "playable", "melodic", "utility",
  "calm", "bold", "spatial", "responds-to-touch",
] as const;
export type Tag = (typeof TAGS)[number];

/**
 * What the pad actually does with no finger on it. Derived from the simulator,
 * asserted against src/lib/fidelity/golden-frames.json - never guessed.
 *   animated  - the picture changes on its own (sim.animating === true)
 *   static    - a fixed lit picture (sim.animating === false, frame is non-empty)
 *   dark      - the configuration writes no LEDs at all (frame is all zeros)
 */
export type PreviewMotion = "animated" | "static" | "dark";

export type CatalogEntry = {
  id: string;
  name: string;
  description: string;      // PadPreset.sentence
  tags: readonly Tag[];
  featured: boolean;
  /** Extra honesty for a static or dark pad; PadPreset.quiet when it has one. */
  quiet?: string;
  preview: { motion: PreviewMotion };
  /** The compiler input. The Lua is derived, never hand-authored (PREV-02). */
  state: PadState;
  /* Profile-Cloud shape (D-18) is written by a derive step, not stored twice. */
};
```

The Profile-Cloud envelope (`configType`, `type: ModuleType.ZONA`, `version`, `configs[...]` with
`{ event: 0 }` / `{ event: 6 }`) should be produced by a **derive function**, not stored alongside
`state`. Two representations of the same configuration in one literal is exactly the drift the
`preset-baseline.json` gate exists to catch. Phase 5/7 call `toProfileCloud(entry)`; Phase 4 only
needs it to exist and be tested.

Do **not** import `$lib/pad` from `entries.ts`. `$lib/pad/ready.ts` imports `initLuaFormatter` at
module scope; the catalog must be importable by the simulator without dragging the compile surface
along. Import `PadState`/`PRESETS`/`presetById` straight from the vendored `_pad`.

---

### Pattern 5: Deep links — `#/c/<id>`, hash only, no new routes

**Confirmed decision:** `#/c/<id>`, exactly as D-12 proposes. Reasons, in order of weight:

1. **Phase 5's success criterion 4 is explicit:** tuned state travels *"in the URL hash, never the
   query string"*. A `?c=` form would have to be migrated one phase later.
2. **CAT-09** — named deterministic slugs `/c/starfield#stamp` — is listed under deferred
   requirements in `REQUIREMENTS.md`. Building real routes now is building a deferred requirement.
3. **Zero build changes.** `/` is already prerendered (`prerender.entries: ["*"]` in
   `vite.config.ts`, `trailingSlash: "always"` in `+layout.ts`). A hash never reaches the server, so
   `adapter-static`, the `404.html` fallback and the Basic Auth Worker are all untouched. A `/c/[id]/`
   route would need explicit prerender entries, because `entries: ["*"]` does not expand routes with
   required dynamic parameters.
4. It is forward-compatible with Phase 5 at no cost: `#/c/<id>` today, `#/c/<id>/z.<stamp>` later —
   ids are lowercase alphanumeric and every stamp begins with the `z.` prefix (`STAMP_PREFIX` in
   `_pad.ts:2466`), so the two segments are unambiguous.

```ts
// src/lib/catalog/deep-link.ts - pure. No DOM, no $app imports, node-testable.
const RE = /^#\/c\/([a-z0-9-]+)(?:\/(.+))?$/;

export function parseHash(hash: string): { id: string; stamp?: string } | undefined {
  const m = RE.exec(hash);
  if (!m) return undefined;
  // Phase 4 parses the stamp segment and ignores it, so a Phase 5 link opened
  // against a Phase 4 build lands on the base configuration rather than 404ing.
  return m[2] === undefined ? { id: m[1] } : { id: m[1], stamp: m[2] };
}

export function hashFor(id: string): string {
  return `#/c/${id}`;
}
```

**Skipping the splash on a deep link without a flash.** The splash markup is in the prerendered HTML,
so a decision made in `onMount` arrives after first paint. Use the same before-paint pattern a theme
flash uses — an inline script in `src/app.html`'s `<head>`, which for a prerendered document runs
before the body is painted:

```html
<script>
  // Deep links skip the splash (D-12). Runs before paint so the splash never flashes.
  document.documentElement.dataset.entry =
    /^#\/c\//.test(location.hash) ? "deep" : "front";
</script>
```

```css
html[data-entry="deep"] .splash { display: none; }
```

**Updating the hash on step** must go through `$app/navigation` — see §Pitfall 7 for the exact call
that lints and the one that does not.

---

### Pattern 6: The splash glyph field, drawn as primitives

Draw the `x o + □ ◦` mosaic as **canvas paths, not text**. Rationale: no web-font dependency on the
first paint, no FOUT, no font-metric variance between platforms, deterministic output for a
screenshot test, and it lets the glyph set be exactly the five shapes the identity names rather than
whatever the font has. A 1920×1080 field at a 22 px pitch is ~4,200 glyphs — a one-off cost of a few
milliseconds, then the canvas is a static bitmap.

Sequence, all in one `onMount` pass:
1. Fill black.
2. Seeded PRNG (a small xorshift, ~10 lines — do not add a dependency) picks a glyph and a dim grey
   per cell. Seed from a constant so a Playwright screenshot is stable; seed from `Date.now()` only
   if per-load variation is wanted, in which case do not screenshot it.
3. Punch the lime rectangles: `fillStyle = accent`, a handful of axis-aligned rects, then redraw the
   glyphs inside them in black with `globalCompositeOperation = "destination-out"` — or simply draw
   them in black over the lime.
4. Halftone grain: build a 128×128 noise tile in a second offscreen canvas once,
   `createPattern(tile, "repeat")`, `fillRect` the whole field at `globalAlpha ≈ 0.06`.
5. The wordmark on top, wide-tracked uppercase, in the accent.

**The dissolve.** A true dissolve rather than a fade, and it costs nothing: drive it from the same
shared rAF the pads already use, erasing a random subset of glyph cells per frame with `clearRect`.
4,200 cells over a 1.2 s dissolve at ~36 painted frames is ~117 `clearRect` per frame. Fade the
whole canvas's `opacity` over the last 300 ms so the tail is clean. Under
`prefers-reduced-motion`, skip the erase entirely and run a 200 ms `opacity` crossfade (D-14).

**Do not** apply `mask-image` to the coverflow container to achieve the dissolve — `mask-image` is
one of the grouping properties that flattens `transform-style: preserve-3d` (§Pitfall 5).

**When to fire the dissolve.** The splash has a real job, not just a decorative one: the simulator
bundle is a dynamic import (§Measured Facts — 131 KB of grid-protocol rides along). Gate the
dissolve on both:

```ts
const MIN_SPLASH_MS = 900;
const [host] = await Promise.all([
  import("$lib/sim/host"),
  new Promise((r) => setTimeout(r, MIN_SPLASH_MS)),
]);
// ...construct engines, paint the first frame of every visible pad, THEN dissolve.
```

That is what delivers *"the pads are already running when the dissolve finishes."*

---

### Pattern 7: `TRY ON DEVICE` — connect and identify, provably zero writes

The Phase 2 hardware run already answered the question that makes this trivially safe. From
`docs/SKELETON-RESULTS.md` §(a) and §(d): the host heartbeat is **not required**, and the module
emits a heartbeat carrying its active page **four times a second, unprompted**. So identification is
a purely passive fold over inbound frames.

What Phase 4 needs from `$lib/transport` and `$lib/protocol`:

| Needed | Not needed |
|---|---|
| `webSerialAvailable()`, `failureCopy()`, `classifyOpenError()` | `RequestQueue` — nothing is requested |
| `WebSerialTransport`, `closeOnHide()` | the keeper/`hostHeartbeat()` timer — **starting it would be a write** |
| `FrameScanner`, `decodeFrame` | `fetchConfig`/`sendConfig`/`storePage`, `canWriteBack`, `CaptureRecorder` |
| `newIdentifyState()`, `absorbFrame()`, `identify()`, `identifyTimedOut()` | |
| `ZONA_USB` (`0x303a` / `0x8123`), `BAUD_RATE` (2,000,000), `READ_BUFFER_SIZE` (4096), `IDENTIFY_WINDOW_MS` (1500), `ZONA_HWCFG` (161) | |

Because the queue and the keeper are both absent, **`transport.write()` is never reachable** from this
path — which makes "it never writes" a testable invariant rather than a promise (§Validation).

**State names and the copy hook each one needs.** `identify()` returns only when a module with
`heartbeatType === 1 && hwcfg === ZONA_HWCFG` has been seen *and* an active page has been reported:

| State | Entered when | Copy source |
|---|---|---|
| `unsupported` | `!webSerialAvailable()` at mount | `failureCopy("no-web-serial")` — names Chrome, Edge, desktop Firefox 151+, never "Chromium" |
| `idle` | supported, nothing clicked | — |
| `requesting` | inside the click handler, picker open | — |
| `cancelled` | `requestPort()` threw `NotFoundError` | `failureCopy("cancelled")` |
| `opening` | port picked, `open()` in flight | — |
| `port-busy` | `NetworkError`, `port.connected !== false` | `failureCopy("port-busy")` — names Grid Editor and the six recovery steps in order |
| `unplugged` | `NetworkError`, `port.connected === false` | `failureCopy("unplugged")` |
| `open-failed` | anything else | `failureCopy("unknown", raw)` |
| `identifying` | port open, waiting on heartbeats | — |
| `identified` | `identify()` returned | *"Install arrives in the next release — your ZONA \<major.minor.patch\> on page \<n\> is identified."* Also has `otherModules` and `storeAllowed` available |
| `not-a-zona` | `identifyTimedOut()` fired with no ZONA seen | Plain: this module is not the one on the cable, or its firmware predates the piggybacked page report |
| `disconnected` | `onClose` fired | — |

Two notes the UI spec will need. First, `webSerialAvailable()` already folds `isSecureContext`, so
`failureCopy("insecure-context")` is **unreachable** from this path — on `file://` there is no
`navigator.serial` at all and the `no-web-serial` branch fires. Do not build two states where the
code can only produce one. Second, `WebSerialTransport.closeOnHide()` attaches to `pagehide` only;
also close the port on un-choose (D-09) and on `Escape`, so a visitor browsing the catalog is not
silently holding the port away from Grid Editor.

**The user-gesture rule, restated because it is the one that bites:** `requestPort()` must be the
**first statement** in the click handler, with nothing awaited in front of it. Transient activation
*expires* (~4.9 s in current engines) rather than being consumed, so an `await import(...)` or an
`await padReady()` ahead of it makes the picker reject with what reads as a permissions bug.
`src/routes/dev/skeleton/+page.svelte` already does this correctly — copy its shape. The transport
and protocol modules are loaded in `onMount`, never in the handler.

**Formatter prefetch (D-19).** `requestIdleCallback(() => { void import("$lib/pad").then((m) => m.padReady()); })`
on first choose, or on `pointerenter` of the panel. Never at boot, never inside the click handler.
`requestIdleCallback` is absent in Safari before 17; guard with
`(window.requestIdleCallback ?? ((cb) => setTimeout(cb, 500)))`.

---

### Pattern 8: The coverflow — mount once, never reorder, transform only

Render **all** entries in a keyed `{#each}` in stable catalog order and never reorder the DOM.
Stepping changes one number, `centre`, and every pad's transform derives from
`slotOffset(index, centre, count)`. A keyed each that reorders would move DOM nodes; a canvas that
moves keeps its backing store, but its transition would be fighting the layout engine instead of the
compositor.

```ts
// src/lib/coverflow/slots.ts - pure.
export const VISIBLE_RADIUS_DESKTOP = 3;   // 7 pads
export const VISIBLE_RADIUS_TABLET = 2;    // 5 pads
export const VISIBLE_RADIUS_PHONE = 1;     // 3 pads
export const MOUNTED_RADIUS = 4;           // canvases exist; beyond this the backing store is released

/** Signed shortest distance from centre on a ring of `count`. Wraps both ends (D-10). */
export function slotOffset(index: number, centre: number, count: number): number {
  const raw = (((index - centre) % count) + count) % count;
  return raw > count / 2 ? raw - count : raw;
}

export function step(centre: number, delta: number, count: number): number {
  return (((centre + delta) % count) + count) % count;
}

export type Slot = {
  offset: number;
  translateX: number;   // px
  translateZ: number;   // px
  rotateY: number;      // deg
  scale: number;
  scrim: number;        // 0..1 black overlay opacity
  mounted: boolean;
  running: boolean;     // ticks and paints
  hero: boolean;
};

export function slotFor(offset: number, hero: number, radius: number): Slot {
  const k = Math.abs(offset);
  const sign = Math.sign(offset);
  return {
    offset,
    translateX: k === 0 ? 0 : sign * hero * (0.55 + 0.36 * (k - 1)),
    translateZ: -160 * k,
    rotateY: k === 0 ? 0 : -sign * 22,     // constant per side: real coverflow keeps side cards parallel
    scale: Math.pow(0.78, k),
    scrim: [0, 0.35, 0.55, 0.72][Math.min(k, 3)],
    mounted: k <= MOUNTED_RADIUS,
    running: k <= radius,
    hero: k === 0,
  };
}
```

Geometry starting numbers (all discretionary, all overturnable): container `perspective: 1400px`;
hero edge 340 px desktop / 280 tablet / 240 phone; transition
`transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 380ms` and **0 ms** under
`prefers-reduced-motion` (D-14).

**Do not set `z-index` for stacking.** Inside a `preserve-3d` context the browser sorts by 3D depth,
and `translateZ` already puts the centre in front. `z-index` on a preserve-3d child is the source of
a whole family of "why is the wrong card on top" bugs.

**Stepping inputs (D-10).** Arrows and side-pad clicks are `<button>`s. Keyboard is `←`/`→` on the
container (which carries `tabindex="0"`). Wheel: `onwheel` in Svelte 5 attaches **directly to the
element** — `wheel` is not in Svelte's `DELEGATED_EVENTS` list (verified in
`node_modules/svelte/src/utils.js:110`) — and element-level wheel listeners are non-passive by
default (the Chrome intervention applies only to `window`, `document` and `document.body`), so
`event.preventDefault()` works without any action or `svelte/events` plumbing. Accumulate
`deltaX` (and `deltaY` when `Math.abs(deltaY) > Math.abs(deltaX)` is false) against a threshold of
~40 px with a ~250 ms cooldown, so a trackpad flick steps once rather than eleven times.

**Accessibility.** The W3C APG carousel pattern applies with one simplification: HANGAR does not
auto-rotate, so the rotation control it requires is not needed. Take from it: the container is
`role="group"` with `aria-roledescription="carousel"` and an `aria-label`; each pad wrapper is
`role="group"` with `aria-roledescription="slide"` and an accessible name; the previous/next controls
are buttons that do not move focus. Add an `aria-live="polite"` region that announces the centred
configuration's name on step, and give each pad a real `<button>` so `Tab`/`Enter` reach it.

</architecture_patterns>

<dont_hand_roll>

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Firmware-faithful pad animation | Any hand-authored loop, CSS keyframes, GIF, or sprite sheet | `PadSim` from `src/vendor/botor/pad-sim.ts` | PREV-02 is a hard requirement; and `src/vendor/botor/tests/` is 7,869 lines pinning this engine, including a 4,860-state invariant sweep |
| Making a static preset "look alive" | Injecting synthetic touch events on side pads to fake motion | Classify it honestly (`preview.motion`) and say so in copy | The whole product claim is "this is exactly what your module will do". Four of nine seeds are static **by design** and one is dark; faking motion is the silent-lie class the compiler and its oracle exist to abolish |
| Firmware tick timing | `setInterval`, or ticking once per rAF frame | The 10 ms accumulator + 100 ms clamp | A variable timestep drifts against the 100 Hz firmware and breaks the golden-frame determinism; no clamp means a restored background tab replays minutes of ticks in one frame |
| The 908-character check | Estimating from `lua.length` | `cost()` via `$lib/pad` behind `padReady()` | `cost().used` is `max(compressScript(lua).length, lua.length) + reserved`; the minifier does not strip comments and the module rejects at 909 |
| Preset Lua | Copying compiled strings into the catalog file | `state: PadState` + the vendored `compile()` | Two representations drift. `preset-baseline.json` exists precisely to catch that |
| The connect/identify sequence | A fresh Web Serial read loop | `WebSerialTransport` + `FrameScanner` + `absorbFrame`/`identify` | The frame scanner is the most bug-prone piece in the project and it already has 9 tests against split, coalesced and torn chunks plus real hardware captures |
| Web Serial failure copy | New strings per state | `failureCopy(kind)` from `$lib/transport` | Six named states with recovery steps in order, already written and already tested, and the e2e already asserts they never say "Chromium" |
| A carousel | An npm carousel/coverflow component | ~60 lines of pure slot math (`slots.ts`) | Every carousel library owns the DOM, mounts/unmounts slides, and would destroy the canvases the whole page exists to keep alive |
| Deep-link routing | A hash router library, or SvelteKit `router.type: "hash"` | One regex in `deep-link.ts` + `replaceState` | Switching kit to hash routing would change every URL in the site including `/dev/` and the GPLv3 footer links |
| Glow / bloom | `ctx.shadowBlur` per lit cell, or `filter: blur()` on the canvas | Static `box-shadow` on the frame layer + one `lighter` composite pass | The vendored host removed `shadowBlur` with a measurement: *"a blurred rect per lit cell at 30 fps across nine canvases is measurable jank"*. A CSS blur on a canvas re-runs a convolution every repaint |
| Reduced-motion detection | A one-shot `matchMedia().matches` read at mount | A live `change` subscription | An OS toggle mid-session must take effect without a remount — IDENT-02 |

**Key insight:** almost everything this phase could get wrong is already solved *inside this
repository*, by code that has a test suite and, in two cases, a hardware run behind it. The genuinely
new work is 200 lines of pure geometry, a data file, and a painter — and the painter is the only
place where a wrong choice is expensive.

</dont_hand_roll>

<common_pitfalls>

## Common Pitfalls

### Pitfall 1: Four of the nine seed pads do not animate, and one is completely black

**What goes wrong:** The acceptance picture for criterion 1 is *"every visible pad is animating
live."* Built as specified, the coverflow shows five animated pads, two static lit pictures, one
black pad with a single dim dot (joystick — **2** non-zero bytes out of 243), and one entirely black
square (tpad). A visitor stepping right from the opening centre reaches a dead-looking pad within two
presses, and the wow evaporates.

**Why it happens:** It is correct behaviour. `sim.animating` is *"true while any layer still counts
down with a nonzero rate"*. The instrument presets set `look.kind = "none"` and `enabled.look = false`
because their picture is the instrument itself; the Trackpad preset writes no LEDs at all, by design,
because a trackpad has nothing to draw. `golden-frames.json` names all four in its own note.

**How to avoid — four things, all cheap:**

1. Give every entry a `preview.motion` field (`animated` / `static` / `dark`) and **gate it with a
   Vitest assertion against `golden-frames.json`**, so a mis-declared entry is a red test, not a
   surprise on screen.
2. **Order the catalog so the opening window is all motion.** `featured: true` on the five animated
   presets; put `tpad` and `joystick` last. With `VISIBLE_RADIUS = 3` and the centre at index 0, the
   opening seven are indices 0,1,2,3 and the three wrapped from the end — so the wrap neighbours
   matter as much as the forward ones. Concretely: order the row so that `tpad` and `joystick` are at
   the two positions furthest from index 0 on the ring, and verify it with a test that asserts every
   entry in `visibleWindow(0, 3)` has `preview.motion !== "dark"`.
3. **Surface `PadPreset.quiet` under the name plate.** The presets already carry honest one-liners
   (tpad: *"The pad has no pressure sensing…"*). For the dark and static ones add HANGAR's own line —
   *"This one is an instrument, not a light show: it lights up under your finger."*
4. **Do not fake motion.** See §Don't Hand-Roll.

**Warning signs:** a demo where the reviewer steps twice and says "is it broken?"; a "canvases change
between samples" e2e test that is flaky because it happened to land on `ninepads`.

---

### Pitfall 2: Reusing the vendored `SimHost` — it cannot host a coverflow

**What goes wrong:** the obvious plan ("wrap `pad-sim-host.ts` in a Svelte component") produces a row
of 108×108 canvases that all paint at the same rate, all draw 81 `strokeRect` per frame, wake exactly
at the viewport edge, and restart the centre pad at tick 0 on every step.

**Why it happens:** `SimHost` was written for a fixed nine-card rail plus one preview inside an
Electron panel. `THUMB_CELL = 12` and `PREVIEW_CELL = 24` are module constants; `RENDER_INTERVAL_MS`
is one global; `blit()` is module-private; the observer is `{ threshold: 0 }` with no `rootMargin`;
and `attachPreview()` constructs a fresh `PadSim`. None of it is parameterised, and
`src/vendor/botor/VENDOR.md` plus the sha256 byte gate in `src/lib/fidelity/vendored-diff.spec.ts`
forbid editing it.

**How to avoid:** write `src/lib/sim/host.ts` as a HANGAR file. Import `PadSim` and nothing else from
the vendored tree. Copy the *comments* that explain the clamp, the decoupled cadence and the
single-teardown rule — every one of them is a paid-for bug — and cite `pad-sim-host.ts` as the origin.

**Warning signs:** a `git diff` touching `src/vendor/`; `npm run test:quick` reporting a failure in
`vendored-diff.spec.ts`; a plan task worded "adapt the vendored host".

---

### Pitfall 3: Putting a `PadSim` or a `Uint8Array` frame into `$state`

**What goes wrong:** `$state` deep-proxies objects and arrays. A `PadSim` holds `layers`, a `fifo`, a
`Map` gate and an 81×3 `Uint8Array`; proxying it turns every internal field access inside a 100 Hz
tick loop into a `Proxy` trap. It will not crash — it will just be inexplicably slow, and the
measured 0.35 µs tick becomes something else entirely.

**Why it happens:** the natural Svelte instinct is to make everything reactive.

**How to avoid:** engines, canvases and frame buffers live in **plain module or class fields inside
`host.ts`**, never in a rune. Only scalars cross into Svelte: `centre` (number), `chosen` (boolean),
`tryOnState` (a string union), `reduced` (boolean). If a non-scalar must be reactive, use
`$state.raw` (declared in the installed `svelte/types/index.d.ts:3451`), which skips proxy creation
and updates only on whole-value reassignment.

**Warning signs:** `$state(new PadSim(...))`; `$state(entries)` where entries carry `PadState`
objects; a `$derived` that reads `sim.frame`.

---

### Pitfall 4: `IntersectionObserver` alone does not pause a coverflow

**What goes wrong:** in a scrolling grid, offscreen means invisible. In a coverflow, the pad at
offset 5 is scaled to 0.36, hidden behind three others and covered by a 0.72 scrim — but its bounding
box is still inside the viewport, so IO reports it intersecting and it keeps ticking and painting.

**Why it happens:** IO answers a geometric question, and coverflow invisibility is a z-order and
opacity question.

**How to avoid:** `running = intersecting && Math.abs(slotOffset) <= VISIBLE_RADIUS`, as an explicit
AND. Keep IO anyway — it is what pauses the whole row when the visitor scrolls to the footer, and
`rootMargin: "200px"` is what stops a pad showing a frozen frame for a beat on re-entry.

**Warning signs:** CPU that does not drop when the row is scrolled out of view; the rAF loop never
self-cancelling on a catalog of nine static instruments.

---

### Pitfall 5: CSS grouping properties silently flatten the 3D coverflow

**What goes wrong:** the depth disappears. Pads line up flat, `rotateY` looks like a skew, and
`translateZ` does nothing. Or, subtler: it works until someone adds `overflow: hidden` to stop the
edge pads causing a horizontal scrollbar.

**Why it happens:** MDN's `transform-style` page lists the CSS grouping property values that force a
used value of `transform-style: flat` even when `preserve-3d` is specified:

> `overflow` (any value other than `visible` **or `clip`**), `opacity` < 1, `filter` other than
> `none`, `clip` other than `auto`, `clip-path` other than `none`, `isolation: isolate`,
> `mask-image`/`mask-border-source` other than `none`, `mix-blend-mode` other than `normal`, and
> `contain: paint`.

Every one of those is something a designer reaches for here: `overflow: hidden` to clip the row,
`opacity` to fade side pads, `filter: brightness()` per D-16, `mask-image` for the dissolve.

**How to avoid, concretely:**

- Clip with **`overflow: clip`** on an **outer wrapper** that does *not* carry `preserve-3d`. Put
  `perspective` and `transform-style: preserve-3d` on an inner element. (`overflow: clip` is on the
  allowed list, but keeping the clipping and the 3D context on different elements removes the
  question entirely.)
- Dim with the **scrim div**, not `opacity` on the pad and not `filter: brightness()`.
- If `filter: brightness()` is used anyway, put it on the **leaf** pad element whose descendants
  contain no further 3D transforms — flattening only affects descendants, so a leaf is safe. Never
  put it on the `preserve-3d` container.
- Never `mask-image` on the coverflow container. Do the dissolve inside the splash canvas.

**Warning signs:** side pads that scale but never appear to rotate away; a `rotateY(22deg)` that
looks identical to `skewY`.

---

### Pitfall 6: A `.svelte.spec.ts` file that never runs

**What goes wrong:** component tests are written, `npm run test:quick` is green, and nothing in the
file was ever executed. This is the exact failure `docs/TESTING.md` calls "the green-and-vacuous
trap", which already cost this project once.

**Why it happens:** `vite.config.ts`'s `server` project has
`exclude: ["src/**/*.svelte.{test,spec}.{js,ts}", ...]` and there is **no** `client` project. There
is no `@vitest/browser`, no `vitest-browser-svelte`, no `jsdom` and no `happy-dom` installed
(verified). Files matching that pattern are collected by nothing.

**How to avoid:** do not write component tests in this phase. Put every decidable thing in a pure
module — `slots.ts`, `schedule.ts`, `deep-link.ts`, `entries.ts`, `try-on.ts` — and test those in the
`server` project. Put the DOM behaviour in Playwright, where it runs in a real browser against the
real build. If a browser Vitest project is genuinely wanted later, that is a deliberate dependency
decision, not a side effect of a file name.

**Warning signs:** a test count that does not rise when a spec file is added. Note that
`vite.config.ts` sets `expect: { requireAssertions: true }`, so a spec with no assertion also fails —
use it.

---

### Pitfall 7: `replaceState` fails lint, and `history.replaceState` warns in dev

**What goes wrong:** the natural line for keeping the URL in step —
`replaceState("#/c/starfield", {})` — is an ESLint **error**, and the workaround
`history.replaceState(null, "", "#/c/starfield")` logs a SvelteKit dev warning on every arrow press.

**Why it happens:** two independent, verified mechanisms.
`eslint-plugin-svelte`'s `no-navigation-without-resolve` is `'error'` in the `recommended` config
this repo extends (`lib/configs/flat/recommended.js:21`), and its `checkShallowNavigationCall` passes
only `{ allowEmpty: true }` — so `replaceState`'s first argument may be `""` or a `resolve()` call,
and **fragments are not on the allow-list for shallow navigation** (they are only allowed for `<a href>`).
Separately, `@sveltejs/kit` monkey-patches `history.pushState`/`replaceState` in dev to warn
*"Avoid using `history.pushState(...)` and `history.replaceState(...)` … Use the `pushState` and
`replaceState` imports from `$app/navigation` instead."* (`client.js:112`).

**How to avoid:** use kit's `replaceState` with one documented, reasoned disable — matching this
repo's existing style of explaining every rule interaction in a comment:

```ts
import { replaceState } from "$app/navigation";
import { hashFor } from "$lib/catalog/deep-link";

function syncHash(id: string): void {
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- fragment-only
  // shallow update. resolve() exists for pathnames; this never changes the path,
  // and the rule's allow-list for replaceState is only "" or a resolve() call.
  replaceState(hashFor(id), {});
}
```

`replaceState` throws in dev if called before the router is initialised, so this only runs after
`onMount`. Use `replaceState`, not `pushState`: stepping must not fill the back stack with one entry
per arrow press.

**Warning signs:** `npm run lint` failing on a file that "only changes the hash"; a console full of
kit warnings in `vite dev`; a back button that needs eleven presses to leave the page.

---

### Pitfall 8: A font dependency breaks `npm run licenses` and the notices test

**What goes wrong:** `npm i @fontsource-variable/quicksand` and then `npm run build`, or
`npm run test:quick`, fails — in two different places, neither of which mentions fonts.

**Why it happens:** `scripts/gen-licenses.mjs` carries a GPL-compatible `ALLOWED` allow-list
(`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `GPL-3.0*`) and **exits 1** on anything
outside it. `@fontsource*` declares `OFL-1.1`. Separately,
`src/lib/licence-notices.spec.ts` asserts that *every* non-dev entry in `package-lock.json` appears
in `THIRD-PARTY.md` — and `THIRD-PARTY.md` is fully machine-generated from a fixed header, so a
hand-written font paragraph would be erased by the next `npm run licenses`. `licenses/` is
`rmSync`-ed and regenerated, so nothing can be parked there by hand either.

**How to avoid (one task, three steps, in this order):**
1. Extend `ALLOWED` in `scripts/gen-licenses.mjs` with `"OFL-1.1"`, with a comment recording the
   reasoning: the OFL is an FSF-approved free licence; the fonts are served as separate static
   `.woff2` assets and are never linked into the JS bundle, so this is aggregation rather than
   combination with the GPLv3 work. **Confidence: MEDIUM** — secondary sources disagree on whether
   the OFL is "GPL-compatible" in the strict combination sense, and the FSF licence list page was
   unreachable (HTTP 429) during this research. Serving fonts as separate files is the position that
   does not depend on resolving that.
2. Add a paragraph to the fixed `header` array in `gen-licenses.mjs` naming the font(s) and the OFL.
3. Run `npm run licenses` and commit the regenerated `THIRD-PARTY.md` and `licenses/` in the same
   commit.

**The zero-risk alternative** is a system font stack, at the cost of the identity D-03/D-07
describes. If fonts are adopted, `@fontsource-variable/quicksand@5.3.0` (headline) and
`@fontsource/space-grotesk@5.3.0` (wide-tracked uppercase wordmark) were both verified on npm on
2026-09-04 as `OFL-1.1`.

**Warning signs:** `gen-licenses: ... is outside the GPL-compatible allowlist`; a red
`licence-notices.spec.ts` test 4 naming a package nobody thought was a "dependency".

---

### Pitfall 9: A static import puts 131 KB on the front door's critical path

**What goes wrong:** `import { PadSim } from "$lib/sim/host"` at module scope in `+page.svelte` adds
`build/_app/immutable/chunks/C1rLf53t.js` (131,101 bytes) to `/`'s `modulepreload` list. The splash
then waits on a chunk that exists only because `_pad.ts:42` imports `GridScript` for a compile path
the coverflow never uses.

**Why it happens:** `pad-sim.ts` imports `./_pad`, and `_pad.ts` imports `@intechstudio/grid-protocol`
at module scope. The package declares no `sideEffects: false` and no `exports` map, so Rollup keeps
it.

**How to avoid:** dynamic-import the simulator inside `onMount`, exactly as `/dev/fidelity/` and
`/dev/skeleton/` already do. This is also what gives the splash a principled duration (Pattern 6).
Add a structural guard to `src/lib/config-shape.spec.ts` in the established style: assert that
`src/routes/+page.svelte` contains no module-scope `import` of the simulator or the vendored tree,
and — guarded on `build/` existing — that `build/index.html` does not reference the chunk containing
`GRID_PARAMETER_ELEMENT_POTMETER`.

**Warning signs:** `/`'s preload list growing; a splash that visibly waits on a slow connection.

---

### Pitfall 10: A CSS scale transition re-rasterises the canvas mid-step

**What goes wrong:** during the 380 ms step transition the promoted pad looks soft, then snaps
crisp when the transition ends.

**Why it happens:** Chrome rasterises composited content at a fixed scale and re-rasterises when the
transform scale changes — *"all content is re-rastered when its transform scale changes, if it does
not have the `will-change: transform` CSS property"*, and *"this only applies to transform scales that
happen via script manipulation, and does not apply to CSS animations or Web Animations."* So during a
CSS transition the pre-rastered bitmap is stretched, and with `will-change: transform` it stays
stretched permanently.

**How to avoid:** **give every pad the same backing-store size and only ever scale down.** With
`CELL_PX` computed once from the *hero* size (`clamp(round(HERO_CSS / 9 × min(dpr, 2)), 24, 64)`) and
applied to all pads, side pads are a downscale of a full-resolution bitmap — which never softens —
and promotion to centre needs no reallocation. Memory: at `CELL_PX = 56` a pad is 504×504×4 B ≈ 1.0 MB;
nine mounted pads ≈ 9 MB. Acceptable, and the `MOUNTED_RADIUS = 4` limit caps it as the catalog grows.

Recompute `CELL_PX` only on resize, debounced ≥ 200 ms, and skip the work when the value is unchanged
— reallocating nine backing stores per resize event is its own jank source. Per PITFALLS C14, release
long-unmounted canvases with `canvas.width = 0`.

**Warning signs:** a pad that is sharp when still and soft while stepping; memory growth on window
resize.

</common_pitfalls>

<code_examples>

## Code Examples

### The identify-only device path (zero writes by construction)

```ts
// src/lib/device/try-on.ts - pure over GridTransport. Node-testable with FakeTransport.
// Source: adapted from src/routes/dev/skeleton/+page.svelte (Phase 2) and
// docs/SKELETON-RESULTS.md (a): the host heartbeat is NOT required, and the
// module reports its active page unprompted, four times a second. So this
// path never constructs a RequestQueue and never starts a keeper - which is
// what makes "it never writes" provable rather than promised.
import {
  FrameScanner, decodeFrame, IDENTIFY_WINDOW_MS,
} from "$lib/protocol";
import {
  newIdentifyState, absorbFrame, identify, identifyTimedOut,
  type GridTransport, type Identity,
} from "$lib/transport";

export type TryOnResult =
  | { kind: "identified"; identity: Identity }
  | { kind: "not-a-zona" };

export function identifyOnly(transport: GridTransport): Promise<TryOnResult> {
  const scanner = new FrameScanner();
  const state = newIdentifyState();
  return new Promise((resolve) => {
    transport.onData((chunk) => {
      for (const frame of scanner.push(chunk)) {
        const decoded = decodeFrame(frame);
        if (!decoded.ok) continue;          // the decode guard returns undefined, never false
        absorbFrame(decoded.classes, state);
      }
    });
    const look = () => {
      const found = identify(state);
      if (found) return resolve({ kind: "identified", identity: found });
      if (identifyTimedOut(state)) return resolve({ kind: "not-a-zona" });
      setTimeout(look, 50);
    };
    look();
  });
}
```

### The click handler, with `requestPort()` first

```ts
// Source: src/routes/dev/skeleton/+page.svelte, connect(). Transient activation
// EXPIRES (~4.9 s) rather than being consumed, so nothing may be awaited before
// requestPort(). P and T were loaded in onMount.
async function tryOnDevice(): Promise<void> {
  const picked = await navigator.serial
    .requestPort({ filters: [P.ZONA_USB] })
    .catch((err: unknown) => { show(T.failureCopy("cancelled")); return undefined; });
  if (!picked) return;

  try {
    await picked.open({ baudRate: P.BAUD_RATE, bufferSize: P.READ_BUFFER_SIZE });
  } catch (err) {
    show(T.failureCopy(T.classifyOpenError(err, picked)));
    return;
  }

  const grid = new T.WebSerialTransport(picked);
  detachHide = grid.closeOnHide();
  state = "identifying";
  const result = await identifyOnly(grid);
  state = result.kind === "identified" ? "identified" : "not-a-zona";
  identity = result.kind === "identified" ? result.identity : null;
}
```

### The fidelity line (PREV-03), grounded in what is actually true

```
Every pad here runs the same compiled Setup and Timer your ZONA would run, stepped at the
firmware's 100 Hz. It cannot show the real LED colour, the light spreading through the silicone,
or how the pad feels under a finger.
```

For an entry whose `preview.motion` is `static` or `dark`, add its own line beneath — for tpad, the
preset's existing `quiet` string already says the honest thing.

### The one-line motion gate (this is the test that keeps Pitfall 1 fixed)

```ts
// src/lib/catalog/entries.spec.ts
import golden from "../fidelity/golden-frames.json";
import { ENTRIES } from "./entries";

it("declares each seed's motion exactly as the golden frames record it", () => {
  for (const e of ENTRIES.filter((x) => x.id in golden.presets)) {
    const frames = golden.presets[e.id as keyof typeof golden.presets];
    const animates = frames.some((f) => f.animating);
    const lights = frames.some((f) => f.nonZeroBytes > 0);
    const expected = animates ? "animated" : lights ? "static" : "dark";
    expect(e.preview.motion, e.id).toBe(expected);
  }
});
```

</code_examples>

<sota_updates>

## State of the Art

| Old approach | Current approach | When changed | Impact here |
|---|---|---|---|
| `history.pushState` / `replaceState` directly | `pushState` / `replaceState` from `$app/navigation` | SvelteKit 2 shallow routing | The direct call is patched and warns in dev (`client.js:112`) |
| Svelte event modifiers (`on:wheel\|passive`) | Plain `onwheel` properties; `on()` from `svelte/events` when a listener option is needed | Svelte 5 | `wheel` is not delegated, so `preventDefault()` works on the plain attribute — no plumbing needed |
| `$state.frozen` | `$state.raw` | Pre-5.0 rename | Verified present in the installed `svelte@5.57.0` types |
| `overflow: hidden` to clip a 3D scene | `overflow: clip` on a non-3D wrapper | `overflow: clip` Baseline ~2022; the flattening rule is in css-transforms-2 | The only way to clip the row without collapsing the coverflow's 3D space |
| One `requestAnimationFrame` per animated element | One shared host loop with a fixed-timestep accumulator | Long settled; the vendored host is the reference | Required by CLAUDE.md and PITFALLS C14 |
| Animating `filter: blur()` for glow | Static blur on a non-repainting layer, or a `lighter` composite pass | Chrome's own "Animating a blur" guidance | The single most expensive mistake available in this phase |

**Deprecated / not applicable here:**

- `next/dynamic` with `ssr: false`, Recharts, `google-spreadsheet` — these come from the **parent
  directory's** `CLAUDE.md`, which belongs to a different project. Ignore entirely.
- WebUSB as a fallback: Chromium-only too, so it buys zero additional browsers.
- Any "Web Serial polyfill": it is an OS capability, not an API shape.

</sota_updates>

<open_questions>

## Open Questions

1. **Does the coverflow ship the Trackpad preset at all?**
   - What we know: `tpad`'s simulated frame is all zeros at every tick, provably and correctly, and
     `padLightsAnything()` returns false for it. It is also the tightest preset in the catalog
     (Setup 902 of 908) and therefore the most interesting engineering artefact on the shelf.
   - What's unclear: whether a black square belongs in a row whose stated purpose is a wow moment.
   - Recommendation: keep it in the data file (CONT-01 names all nine), mark it
     `featured: false, preview.motion: "dark"`, place it at the ring position furthest from the
     opening centre, and surface its `quiet` line. Flag it explicitly in the morning summary as the
     one thing the user may want to overturn.

2. **Does the bloom pass look right?**
   - What we know: it costs one extra textured quad per pad per frame — negligible.
   - What's unclear: whether a bilinear upscale added with `lighter` at `globalAlpha 0.45` reads as
     LED bloom or as mush, and how it interacts with the semi-transparent grid overlay.
   - Recommendation: build it behind a single boolean in the painter, land the plain path first, and
     make the bloom a separate verify-with-eyes task. It is one `if` to remove.

3. **Hash deep links foreclose per-configuration OG images.**
   - What we know: crawlers never see a fragment, so `#/c/starfield` cannot produce a per-config
     link preview. Phase 5's SC5 wants *"a shared link unfurls on Discord with a build-time OG image
     rendered from the simulator."*
   - What's unclear: whether Phase 5 will accept one global OG image or will need real routes.
   - Recommendation: ship hash-only in Phase 4 (it is the cheapest thing that satisfies CAT-01 and it
     matches Phase 5's hash requirement), but keep `deep-link.ts` pure and route-agnostic so adding
     prerendered `/c/[id]/` routes in Phase 5 is additive rather than a rewrite. Record this as a
     known Phase 5 decision point.

4. **Where does the visible-pad ceiling actually sit on low-end hardware?**
   - What we know: the simulator costs ~1 ms/s at seven pads, so the ceiling is entirely a
     compositing question — layer count, layer area, and the scrim/transform work.
   - What's unclear: the real number on a 4-core laptop with integrated graphics. STACK.md's
     "10–16 concurrently visible cards" estimate was explicitly marked unverified, and it was made
     against the old 81-`strokeRect` painter which this phase does not use.
   - Recommendation: do not plan around a number nobody has measured. Ship the `hardwareConcurrency <= 4`
     branch as a precaution, and add one Playwright timing observation (frame count over 2 s on the
     built site) as a *recorded measurement*, not a pass/fail gate — a perf assertion on CI hardware
     is a flake generator.

5. **Typography.**
   - What we know: the CONTEXT grants this to Claude's discretion; the constraint is "free, no money".
   - What's unclear: whether the user wants rounded (Quicksand/Nunito) or geometric-industrial
     (Space Grotesk/Outfit) for the wordmark.
   - Recommendation: Quicksand Variable for the mixed-case headline (it is genuinely the rounded
     geometric sans D-03 describes), Space Grotesk 700 uppercase at ~0.32em tracking for the wordmark.
     Both OFL-1.1. Present it as a first cut the user can overturn after his breather, and keep the
     two families behind two CSS custom properties so swapping is a one-line change.

</open_questions>

<environment_availability>

## Environment Availability

Probed on this machine, 2026-09-04.

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | ✓ | v24.14.0 (`engines: >=24`) | — |
| npm | install, scripts | ✓ | 11.9.0 | — |
| wrangler | `npm run preview`, the Playwright `webServer` | ✓ | 4.128.0 | `npx sirv-cli build --port 4173 --single` (loses Basic Auth coverage) |
| Playwright | e2e | ✓ | 1.62.1 | — |
| Playwright browsers | e2e | ✓ **chromium only** (`chromium-1234`, `chromium_headless_shell-1234`) | — | Firefox/WebKit not installed; do not plan a cross-browser e2e task without an install step |
| Port 4173 | e2e harness | ✓ free at probe time | — | Kill the stale wrangler tree — see `docs/TESTING.md` |
| git | commits, `__COMMIT_SHA__` | ✓ | 2.53.0.windows.2 | — |
| esbuild | (research only) | ✓ | via `node_modules/.bin` | — |
| A real ZONA | `TRY ON DEVICE`'s hardware half | ✗ (not required by this phase) | — | The whole automatable surface is the degrade path + `FakeTransport`; identify against real hardware is a one-line human check, not a gate |
| Network (npm) | fonts, if adopted | assumed ✓ | — | System font stack |
| `@vitest/browser` / jsdom / happy-dom | component tests | ✗ | — | **No fallback — do not write component tests.** See §Pitfall 6 |

**Missing with no fallback:** none that block this phase.

**Missing with fallback:** Playwright Firefox/WebKit binaries; browser-mode Vitest.

**Working-tree note at probe time:** `.planning/ROADMAP.md` and `.planning/STATE.md` are modified and
`.planning/phases/02-walking-skeleton/02-VERIFICATION.md` is untracked. `scripts/deploy.mjs` has a
clean-tree gate, so this matters at deploy time, not at plan time.

</environment_availability>

<validation_architecture>

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest **4.1.11** (two projects: `server` node, `sweep` node) + Playwright **1.62.1** (chromium, over `wrangler dev` serving `build/`) |
| Config file | `vite.config.ts` (`test.projects`) and `playwright.config.ts`. **No `svelte.config.js` — a spec forbids one.** |
| Quick run command | `npm run test:quick` (26 files, 454 tests, ~6 s wall) |
| Full suite command | `npm run check && npm run lint && npm run test:unit -- --run && npm run test:e2e` |

Baselines to preserve (from `docs/TESTING.md`): `pad.test.js` 176, `pad-sim.test.js` 96,
`pad-invariants.test.js` 9. If any drops, the suite is silent, not green.
`expect: { requireAssertions: true }` is on — a spec with no assertion fails.

### Phase requirements → test map

| Req | Behaviour | Type | Automated command | File exists? |
|---|---|---|---|---|
| CONT-01 | Every seed compiles character-identical to `preset-baseline.json` at the pin | unit | `npx vitest run --project server src/lib/catalog/entries.spec.ts -t "baseline"` | ❌ Wave 1 |
| CONT-01 / D-18 | Both events of every entry are ≤ 908 by `cost()` | unit | same file, `-t "budget"` | ❌ Wave 1 |
| CONT-03 | Every entry has name, description, ≥1 tag from the closed vocabulary, a `featured` flag and a `state` | unit | same file, `-t "shape"` | ❌ Wave 1 |
| CAT-04 | Entry → Profile-Cloud envelope derives correctly (events 0 and 6, element 0, `ModuleType.ZONA`) | unit | same file, `-t "profile-cloud"` | ❌ Wave 1 |
| PREV-01 / **Pitfall 1** | Declared `preview.motion` equals what `golden-frames.json` records; every pad in the opening window is not `dark` | unit | same file, `-t "motion"` | ❌ Wave 1 |
| PREV-02 | The catalog contains no Lua string anywhere (only `PadState`) | unit (structural) | same file, `-t "no hand-authored"` | ❌ Wave 1 |
| CAT-01 | `parseHash`/`hashFor` round-trip; unknown id → `undefined`; a Phase 5 stamp segment is parsed and ignored | unit | `npx vitest run --project server src/lib/catalog/deep-link.spec.ts` | ❌ Wave 1 |
| D-10 | `step()` wraps both ends; `slotOffset()` is the signed shortest ring distance; `slotFor()` is symmetric and monotone in `\|offset\|` | unit | `npx vitest run --project server src/lib/coverflow/slots.spec.ts` | ❌ Wave 1 |
| PREV-05 / D-15 | `ticksFor()` clamps at 100 ms and carries the remainder; `shouldPaint()` honours 33/50; `intervalFor()` switches on low power; `isLowPower(undefined) === false` | unit | `npx vitest run --project server src/lib/sim/schedule.spec.ts` | ❌ Wave 1 |
| D-13 | **Zero `write()` calls** across a full connect + identify + close cycle against `FakeTransport` | unit | `npx vitest run --project server src/lib/device/try-on.spec.ts -t "never writes"` | ❌ Wave 2 |
| D-13 | A non-ZONA hwcfg → `not-a-zona`; window expiry → `not-a-zona`; each `OpenFailure` maps to its `failureCopy` | unit | same file | ❌ Wave 2 |
| Pitfall 9 | `+page.svelte` has no module-scope import of the simulator or `src/vendor/`; `build/index.html` does not preload the grid-protocol chunk | unit (structural) | `npx vitest run --project server src/lib/config-shape.spec.ts` | ✅ extend existing |
| PREV-01 | Hero canvas pixels **differ** between two samples 400 ms apart on an animated entry | e2e | `npx playwright test e2e/first-experience.e2e.ts -g "animates"` | ❌ Wave 3 |
| Pitfall 1 | Hero canvas pixels are **identical** between two samples on `ninepads` — proving the static classification is real, not a stalled loop | e2e | same file, `-g "static"` | ❌ Wave 3 |
| CAT-01 | `/#/c/radar` lands with Radar centred and the splash never visible | e2e | same file, `-g "deep link"` | ❌ Wave 3 |
| IDENT-02 / D-14 | Under `test.use({ reducedMotion: "reduce" })` two samples are identical and stepping is instant | e2e | same file, `-g "reduced motion"` | ❌ Wave 3 |
| DEGR-02 (Phase 4 half) | With `delete Navigator.prototype.serial`, after choosing, `TRY ON DEVICE` is **present and disabled** with a reason naming Chrome, Edge and Firefox 151, and the body never contains "Chromium" | e2e | same file, `-g "no Web Serial"` | ❌ Wave 3 |
| D-10 / D-11 | Keyboard: `ArrowRight` steps, `Enter` chooses, `Escape` un-chooses; the live region announces the centred name | e2e | same file, `-g "keyboard"` | ❌ Wave 3 |
| IDENT-01 | Zero console errors on the front door (established pattern) | e2e | same file | ❌ Wave 3 |
| (regression) | `/` still links to nothing under `/dev/` | e2e | `e2e/fidelity.e2e.ts` — already asserts it | ✅ exists |
| (recorded, not gated) | Painted frames over 2 s on the built site, at the default viewport | e2e observation | same file, logged to `.tmp-e2e/` | ❌ Wave 3 |

### Sampling rate

- **Per task commit:** `npm run test:quick`, plus `npm run lint` when the task touched a source file.
- **Per wave merge:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **Phase gate:** all of the above plus `npm run test:e2e`, green, before `/gsd:verify-work`.

### Wave 0 gaps

- [ ] No new framework or config is needed — **do not** add a Vitest client/browser project (§Pitfall 6).
- [ ] `src/lib/catalog/entries.ts` + `entries.spec.ts` — CONT-01, CONT-03, CAT-04, PREV-01, PREV-02
- [ ] `src/lib/catalog/deep-link.ts` + spec — CAT-01
- [ ] `src/lib/coverflow/slots.ts` + spec — D-10
- [ ] `src/lib/sim/schedule.ts` + spec — PREV-05, D-15
- [ ] `src/lib/device/try-on.ts` + spec — D-13
- [ ] `e2e/first-experience.e2e.ts` — the seven browser assertions above
- [ ] Extend `src/lib/config-shape.spec.ts` with the two Pitfall-9 structural guards

### Harness discipline (from `docs/TESTING.md`, non-negotiable)

- Before any e2e run: `netstat -ano | grep -w LISTENING | grep ":4173"`. If occupied, walk the process
  tree to the `npx-cli.js` root and `taskkill /PID <root> /T /F` **from PowerShell** (Git Bash mangles
  `/PID`). Killing `workerd.exe` alone does not work — `cli.js` restarts it and the zombie accepts
  connections it never answers.
- Capture e2e output to `.tmp-e2e/`, never under `test-results/` or `playwright-report/` (Playwright
  wipes its `outputDir` at the start of each run).
- **No Playwright test title may contain the word `failed`** — acceptance checks grep the captured log.
- Never run `npm run format` across `src/vendor/`; scope it to new files.

</validation_architecture>

<sources>

## Sources

### Primary — HIGH confidence

**Read directly from this repository (the strongest source available for this phase):**
- `src/vendor/botor/pad-sim-host.ts` — the whole reference scheduling design; `blit()`'s 81
  `strokeRect`; `THUMB_CELL`/`PREVIEW_CELL`; `{ threshold: 0 }`; `attachPreview` constructing a fresh engine
- `src/vendor/botor/pad-sim.ts` — `frame` getter (lazy render behind `dirty`), `animating`
  (lines 1465–1470), `coordMax`, `pendingTouches`, `run`, `reset`, `setState`
- `src/vendor/botor/_pad.ts` — `PRESETS` (lines 4214–4384) and all nine preset bodies; `PadPreset`
  shape; `PadState`; `DEFAULT_PAD_STATE`; `padLightsAnything` / `sendsIsVisible` (876–895);
  `EVENT_BUDGET = 908`; `STAMP_PREFIX = "z."`; module-scope grid-protocol import at line 42
- `src/lib/fidelity/golden-frames.json` — the motion classification, in its own note, plus per-preset
  `animating` and `nonZeroBytes` at ticks 0/37/101/500/1009
- `src/lib/fidelity/preset-baseline.json` — the compile oracle (BOTOR's own compiler, commit `a0fb69d`)
- `src/lib/pad/index.ts`, `src/lib/pad/ready.ts` — the gated compile surface; the explicit note that
  `PadSim` is deliberately **not** gated
- `src/lib/transport/transport.ts` — `webSerialAvailable()`, `classifyOpenError()`, `failureCopy()`
  and all six `OpenFailure` states with their copy
- `src/lib/transport/sequence.ts` — `identify()`, `newIdentifyState()`, `identifyTimedOut()`,
  `absorbFrame()`, `Identity`
- `src/lib/protocol/constants.ts` — `ZONA_USB` `0x303a`/`0x8123`, `ZONA_HWCFG` 161,
  `IDENTIFY_WINDOW_MS` 1500, `BAUD_RATE` 2 000 000, `READ_BUFFER_SIZE` 4096
- `src/routes/dev/skeleton/+page.svelte`, `src/routes/dev/fidelity/+page.svelte` — the prerender +
  `onMount` dynamic-import pattern, and the `requestPort()`-first click handler
- `src/lib/config-shape.spec.ts`, `src/lib/licence-notices.spec.ts` — the structural-guard style, the
  no-`svelte.config.js` rule, and the every-production-dependency-in-the-notices assertion
- `scripts/gen-licenses.mjs` — the `ALLOWED` allow-list and the fully generated `THIRD-PARTY.md`
- `vite.config.ts`, `playwright.config.ts`, `worker/index.js`, `wrangler.jsonc`, `tsconfig.json`,
  `eslint.config.js`, `docs/TESTING.md`, `docs/SKELETON-RESULTS.md`
- **Measurement:** `npx esbuild` bundle of `pad-sim.ts` + `_pad.ts`, run under Node v24.14.0,
  2026-09-04 — the tick/render/construct numbers in §Measured Facts
- **Bundle inspection:** `build/_app/immutable/chunks/*.js` grepped for `GRID_PARAMETER_ELEMENT_POTMETER`;
  `build/index.html` preload list

**Read directly from `node_modules` (installed versions, not documentation):**
- `svelte@5.57.0` `src/utils.js:110` — `DELEGATED_EVENTS` (wheel absent) and `PASSIVE_EVENTS:250`
- `svelte@5.57.0` `types/index.d.ts:3435–3452` — `$state.raw`
- `@sveltejs/kit@2.70.3` `src/runtime/client/client.js:100–130, 2500–2580` — the history patch, its
  warning text, and `pushState`/`replaceState`
- `eslint-plugin-svelte` `lib/configs/flat/recommended.js:21` and
  `lib/rules/no-navigation-without-resolve.js` — the rule is `error`, and `checkShallowNavigationCall`
  passes only `{ allowEmpty: true }`
- `playwright` `types/test.d.ts:6973, 7619` — `reducedMotion` is a supported test option
- `@intechstudio/grid-protocol@1.20260825.1135` `package.json` — no `sideEffects`, no `exports` map

**Official documentation:**
- MDN, `CanvasRenderingContext2D.putImageData` — *"This method is not affected by the canvas
  transformation matrix."*
- MDN, `transform-style` — the complete list of grouping property values that force a used value of
  `flat`, including that `overflow: clip` does **not**
- MDN, `Navigator.hardwareConcurrency` — *"Baseline Widely available… since March 2022"*, plus the
  spec's warning not to treat it as an absolute core count
- MDN, `image-rendering` — the `pixelated` algorithm, and the caveat that canvas support varies
- Chrome for Developers, *Re-rastering composited layers on scale change* — re-raster on scale change
  since Chrome 53; `will-change: transform` pins the bitmap and keeps it blurry
- Chrome for Developers, *Making wheel scrolling fast by default* / *Making touch scrolling fast by
  default* — the passive-by-default intervention applies to `window`, `document` and `document.body`,
  not to element listeners
- W3C WAI-ARIA Authoring Practices, Carousel pattern — roles, `aria-roledescription`, slide-picker
  buttons that do not move focus

### Secondary — MEDIUM confidence

- Chrome for Developers, *Animating a blur*, plus Mozilla bug 925025 — CSS `blur()` is a convolution
  re-evaluated per repaint; corroborated by the vendored host's own measured removal of `shadowBlur`
- npm registry, 2026-09-04 — `@fontsource-variable/quicksand@5.3.0` and
  `@fontsource/space-grotesk@5.3.0`, both `license: OFL-1.1`
- SIL OFL status: multiple sources agree it is an FSF-approved free licence and that OFL fonts may be
  distributed alongside GPL software; they **disagree** on strict GPL-combination compatibility. The
  aggregation position (separately served `.woff2`, never linked into the bundle) is what this
  research relies on

### Tertiary — LOW confidence, flagged for validation

- The bloom pass's appearance (`grow = 6%`, `globalAlpha = 0.45`, `lighter`) — cost is certain,
  looks are not. Eyeball it.
- The coverflow geometry constants (perspective 1400px, 22° rotateY, 0.78 scale falloff, −160px per
  step) — plausible starting values, not measured against a design reference.
- The concurrently-visible-pad ceiling on low-end hardware — deliberately not estimated. STACK.md's
  earlier "10–16 cards" figure was self-marked unverified and was measured against a painter this
  phase does not use.
- FSF licence-list page — **could not be fetched** (HTTP 429). The OFL position above rests on
  secondary sources plus the aggregation argument, not on a primary FSF quote.

</sources>

<metadata>

## Metadata

**Research scope:**
- Core technology: Svelte 5 runes over a canvas simulator; CSS 3D compositing; `adapter-static` deep
  links; Web Serial connect-and-identify
- Ecosystem: nothing new — the phase adds at most two OFL font packages
- Patterns: shared-rAF host, one-backing-store-size coverflow, pure-module-plus-thin-DOM split,
  hash-only deep links, identify-without-writing
- Pitfalls: the static/dark seeds, the unreusable vendored host, rune proxying, IO insufficiency, CSS
  grouping-property flattening, the never-collected `.svelte.spec.ts`, the lint-blocked `replaceState`,
  the licence gate, the 131 KB critical-path regression, mid-transition re-rasterisation

**Confidence breakdown:**
- Standard stack: **HIGH** — every version read from `node_modules`, not from training data
- Architecture: **HIGH** on mechanism (all corrections traced to MDN, kit source or plugin source);
  **MEDIUM** on the geometry and typography constants, which the CONTEXT grants as discretionary
- Measured facts: **HIGH** — a fresh measurement and a committed fixture agree independently
- Pitfalls: **HIGH** — nine of ten are verified against installed source or an official spec; the
  licence one is MEDIUM by its nature
- Code examples: **HIGH** — adapted from working code in this repository, or from MDN-specified APIs

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 (30 days — the stack is pinned and the load-bearing findings are repository
facts, not ecosystem news; re-check only if `svelte`, `@sveltejs/kit` or `eslint-plugin-svelte` moves)

</metadata>

---

## RESEARCH COMPLETE

**Phase:** 4 — First Experience
**Confidence:** HIGH

Ten lines that should change how the work is split:

1. **The simulator is not the budget.** Measured: `tick()` 0.28–0.40 µs, full frame render 4.4–9.0 µs. Seven pads cost ~1 ms of CPU per second. Delete any task about reduced *tick* rates for side pads — it buys nothing and costs firmware fidelity.
2. **Four of the nine seeds do not animate and one (Trackpad) is a completely black pad** — stated outright in `golden-frames.json`. Criterion 1 cannot be met literally by the seed row. Plan a `preview.motion` field, a gate against the fixture, and a catalog order that keeps the opening window all motion.
3. **The vendored `pad-sim-host.ts` cannot be reused** — it paints 81 `strokeRect` per pad per frame (which CLAUDE.md forbids), hardcodes two cell sizes, has one global paint interval, and its painter is module-private. Plan a HANGAR-owned `src/lib/sim/host.ts` that imports only `PadSim`.
4. **`putImageData` cannot upscale** ("not affected by the canvas transformation matrix" — MDN). D-15's mechanism becomes: one shared 9×9 scratch canvas → `drawImage` with `imageSmoothingEnabled = false` → a static CSS grid overlay supplying the inter-cell gaps.
5. **Give every pad the same backing-store size and only ever scale down.** Chrome re-rasterises on transform-scale change, so a side pad promoted to centre would soften mid-transition otherwise. One `CELL_PX`, computed from the hero size, recomputed only on debounced resize.
6. **`filter`, `opacity < 1`, `mask-image` and `overflow: hidden` all force `transform-style: flat`** — but `overflow: clip` does not. Dim side pads with a black scrim div, clip the row on a non-3D wrapper, and never put `filter: blur()` on anything that repaints.
7. **There is no browser Vitest project, and `.svelte.spec.ts` is excluded from `server` with nothing else collecting it.** Every decidable thing must live in a pure module — `slots.ts`, `schedule.ts`, `deep-link.ts`, `entries.ts`, `try-on.ts` — with the DOM behaviour in Playwright.
8. **`TRY ON DEVICE` needs no `RequestQueue` and no heartbeat keeper**, because the Phase 2 hardware run proved identification is passive. That makes "it never writes" a testable invariant: assert zero `write()` calls through a full connect + identify cycle against `FakeTransport`.
9. **Two one-line traps that will each cost an hour if unplanned:** `replaceState("#/c/id", {})` is an ESLint *error* (`no-navigation-without-resolve` allows only `""` or `resolve()` for shallow navigation), and adding any `@fontsource` package fails `npm run licenses` until `"OFL-1.1"` joins the allow-list — then fails `licence-notices.spec.ts` until the notices are regenerated.
10. **Dynamic-import the simulator inside `onMount`.** A static import puts a measured 131,101-byte grid-protocol chunk on the front door's preload list. Doing it lazily also gives the splash a principled duration: dissolve on `Promise.all([import(...), MIN_SPLASH_MS])`, which is what makes the pads already be running when it clears.

**File created:** `C:\Users\sabot\Documents\Claude\hangar\.planning\phases\04-first-experience\04-RESEARCH.md`

| Area | Level | Reason |
|---|---|---|
| Standard stack | HIGH | Every version read from `node_modules`; no new dependency needed |
| Architecture | HIGH mechanism / MEDIUM aesthetics | Corrections traced to MDN, kit source, plugin source; geometry constants are discretionary starting values |
| Measured facts | HIGH | Fresh benchmark and a committed fixture agree independently |
| Pitfalls | HIGH | Nine of ten verified against installed source or an official spec |

**Open questions:** whether Trackpad belongs in the row at all; whether the bloom pass looks right; that hash-only deep links foreclose per-config OG images in Phase 5; the low-end-hardware pad ceiling (deliberately unestimated); typography.

**Ready for planning.** Nothing is blocked.
