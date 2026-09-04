# Stack Research

**Domain:** Static, animation-heavy public web playground that drives USB hardware from the browser (Intech Studio ZONA, 9x9 XY-pad) over Web Serial
**Researched:** 2026-09-02
**Confidence:** HIGH on versions and Web Serial support (verified against npm registry, MDN BCD, webstatus.dev, Cloudflare docs, and the shipped `@intechstudio/grid-protocol` tarball on disk). MEDIUM on the rendering-ceiling numbers (reasoned from measured op counts in the existing code, not profiled).

---

## Headline: one finding changes a PROJECT.md assumption

PROJECT.md states "Web Serial is Chromium-only (Chrome, Edge, Opera)" and "Firefox, Safari and every iOS browser can never install."

**Firefox shipped Web Serial in Firefox 151, released 2026-05-19.** Current Firefox stable is 155.0 (2026-09-01), so it has had four releases of penetration. Confirmed by three independent sources: MDN browser-compat-data (`api/Serial.json`, `firefox: {version_added: "151"}`, no flags), `api.webstatus.dev/v1/features/serial` (`firefox: {date: "2026-05-19", status: "available", version: "151"}`), and the Mozilla Hacks announcement post.

Safari remains a hard no and WebKit's formal standards position is **"oppose"** (concerns: privacy, security, use cases, device independence) — so Safari is not "not yet", it is "not planned". iOS is therefore permanently out for every browser.

Practical consequence: the degrade path is still required and still carries a large share of visitors, but it should be written as a **runtime feature detect on `navigator.serial`**, never as a browser sniff, and the copy should not say "Chrome only". See the Web Serial section for the Firefox caveats that matter.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **SvelteKit** | 2.70.3 | App framework, routing, build | `profile-cloud` already ships SvelteKit + `adapter-static` + `@intechstudio/grid-protocol` in this exact ecosystem — the risky combination is pre-proven. SvelteKit's client-side router keeps the JS context alive across navigation, which HANGAR *requires*: an open `SerialPort` and a running shared `requestAnimationFrame` loop must survive a move from catalog to detail page. Gives per-route prerendering (`export const prerender = true`) so every catalog entry is a real static HTML file with its own `<head>` — which is what makes a Discord link preview work. Peer range explicitly allows `vite ^8.0.0`. |
| **Svelte** | 5.57.0 | Component + reactivity model | Runes give signal-level reactivity: turning one tune knob invalidates one card's derived state, not a 30-item list. That is not a micro-optimisation here — the page has 10-30 live canvases and a 100 Hz simulator loop, and a framework that re-runs a component tree per knob tick will fight the rAF loop for the main thread. Also: `grid-editor`, `grid-uikit` and `profile-cloud` are all Svelte 5, so components and idioms are portable in both directions. |
| **Vite** | 8.2.2 | Bundler / dev server | What SvelteKit runs on. Relevant beyond convention: Vite is the toolchain that correctly emits the `@wasm-fmt/lua_fmt` `.wasm` asset that `grid-protocol` needs, and the known-good `optimizeDeps.exclude` incantation is already proven in `grid-editor/renderer.vite.config.mjs`. |
| **@sveltejs/adapter-static** | 3.0.10 | Static output | Produces a plain directory of HTML/JS/CSS/wasm. No server, no adapter runtime, no Node at request time. Exactly the PROJECT.md constraint. |
| **TypeScript** | 6.0.3 | Types | **Not 7.0.2.** TypeScript 7.0.2 (the native/Go port, published 2026-07-08) is `dist-tags.latest`, but `@sveltejs/kit@2.70.3` declares `typescript: "^5.3.3 \|\| ^6.0.0"` and `svelte-check@4.7.6` declares `"^5.0.0 \|\| ^6.0.0"`. Neither admits 7 yet. 6.0.3 (2026-04-16) is the newest version the Svelte toolchain actually supports. Revisit when kit widens the peer range. |
| **@intechstudio/grid-protocol** | 1.20260828.1315 (or pin 1.20260825.1135 to match grid-editor) | Grid wire protocol, Lua minifier, `ModuleType.ZONA` | Upstream Intech's package, public on npm, 130 published versions, registry last modified 2026-08-28. Non-negotiable dependency: it owns packet encode/decode and `GridScript.compressScript`, which is the *actual* character-cost function the 908-byte fit ladder is calibrated against. See the dedicated section below — it is browser-safe but has a WASM initialisation trap. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@types/w3c-web-serial** | 1.0.8 | `navigator.serial` typings | Always. `grid-editor/src/renderer/serialport/serial-transport.ts` hand-rolls a local `WebSerialPort` interface because it predates convenient typings; do not copy that. This package types `Serial`, `SerialPort`, `SerialPortFilter`, `SerialOptions`, and the `connect`/`disconnect` events properly. Add `"types": ["w3c-web-serial"]` to tsconfig. |
| **Tailwind CSS** | 4.3.3 | Styling | Optional but recommended. v4 is CSS-first (`@import "tailwindcss"` + `@theme` block), no JS config file, Oxide engine. HANGAR's palette is literally two tokens (black, `#D6FF4E`), so `@theme` is about eight lines. Use it for layout/spacing/type-tracking discipline; the generative glyph field and the halftone grain are a canvas/CSS-gradient job, not a utility-class job. |
| **@tailwindcss/vite** | 4.3.3 | Tailwind's Vite plugin | If using Tailwind. Peer range covers `vite ^8`. Faster than the PostCSS path; no `postcss.config`. |
| **@wasm-fmt/lua_fmt** | 0.2.0 (transitive) | StyLua compiled to WASM | Do **not** install directly. It arrives as a dependency of `grid-protocol`, which pins `^0.2.0`. (Registry latest is 0.3.3 — do not force-resolve it; grid-protocol is built against the 0.2 API.) |
| **wasmoon** | 1.16.0 | Lua 5.4 compiled to WASM; runs a hand-authored configuration's real Lua so the vendored simulator's LED engine can render it | Lazy, on first open of a Lua-backed card. A RUNTIME dependency shipped to the browser, MIT, exact pin - not a caret: the phase's budget and fidelity results are measured against one Lua implementation, and a minor bump is a fidelity change until `src/lib/fidelity/lua-parity.spec.ts` says otherwise. Never imported at boot; `src/lib/sim/ready.ts` is the only module that names it. Added in Phase 8 (D-06, D-14); the emitted asset is `build/_app/immutable/assets/glue.<hash>.wasm`, 271,581 bytes, and `e2e/catalog.e2e.ts` proves a cold catalog load never fetches it. |

**Deliberately not in the list:** no state-management library (Svelte 5 runes + a couple of `.svelte.ts` modules cover it), no chart library, no router, no date library, no HTTP client (there is no backend to call), no animation library (the animation *is* the simulator).

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **Vitest** | 4.1.11 | Unit tests for the ported compiler + simulator | Matches the source repo (`grid-editor` runs `vitest ^4.1.0`, `"test": "vitest run"`). The existing `src/renderer/tests/` suite is 7,869 lines of `.js` tests importing `.ts` sources directly. Node environment, no browser, no config beyond defaults. |
| **@vitest/coverage-v8** | 4.1.11 | Coverage | Only if you want a gate. Peer-pinned to the exact vitest version. |
| **Playwright** | 1.62.1 | Browser E2E for the **non-serial** half | Catalog renders, cards animate, URL stamp round-trips, tune panel recompiles, and — most valuably — the no-Web-Serial degrade path, which is trivially forced with an init script that deletes `navigator.serial`. That is the path most visitors hit, and it is fully automatable. |
| **svelte-check** | 4.7.6 | Type-check `.svelte` files | `npm run check`. Peer: `typescript ^5 \|\| ^6`. |
| **prettier + prettier-plugin-svelte** | 3.x / 4.1.1 | Formatting | Same as every sibling repo; keeps diffs against `grid-editor` readable when re-syncing ported files. |
| **wrangler** | 4.128.0 | Deploy to Cloudflare | `wrangler deploy`. Note: file-count limits above 20,000 need wrangler ≥ 4.34.0; you are far under either way. |
| **sv** | 0.17.0 | Project scaffolder | `npx sv create hangar` — the current Svelte CLI (replaced `create-svelte`). |

---

## Decision 1 — Framework: SvelteKit + adapter-static

**Verdict: SvelteKit 2.70.3 with `@sveltejs/adapter-static` 3.0.10.** Confidence: **HIGH**.

Three things decide it, in order:

1. **The combination is already proven in this ecosystem.** `profile-cloud` is SvelteKit 2 + `adapter-static` 3 + `@intechstudio/grid-protocol` + `grid-uikit`, in production. The single genuinely risky integration in HANGAR's stack — a WASM-bearing Intech package inside a Vite static build — is the one that already has a working precedent 200 metres away on the same disk.
2. **Session continuity across navigation is a hard requirement.** An open `SerialPort` and a running shared rAF loop cannot survive a full-document navigation. SvelteKit's client router is an SPA after first paint, so both survive. This is also the exact reason Astro is wrong here (below).
3. **Prerendered per-config HTML is how a Discord link gets a preview.** PROJECT.md's sharing story is "a tuned config travels through a Discord link". `adapter-static` + `entries()` emits a real HTML file per catalog entry with its own OG tags. Plain Vite would make you build that yourself.

**Why not Astro.** Astro's model is a static content page with small interactive islands, and MPA navigation by default. HANGAR is the inverse: the entire page *is* the application — 10-30 running simulators sharing one rAF loop, one persistent serial connection, one compile/cost pipeline. To make Astro work you would enable the `ClientRouter`, put everything in a single hydrated island, and hoist all state above it — at which point you have reimplemented SvelteKit with more moving parts and worse HMR. Astro is the right call for `zona-docs`; it is the wrong call for HANGAR.

**Why not Next.js static export.** No React anywhere in this ecosystem, so every ported component and every future contribution pays a translation tax. `output: 'export'` carries real constraints (no route handlers, no dynamic OG, image optimisation off). React's re-render model is actively hostile to "30 canvases and a 100 Hz tick loop" without careful `memo`/`useSyncExternalStore` work that Svelte 5 runes give for free. Zero upside.

**Why not plain Vite + TypeScript.** Genuinely defensible — it is the smallest thing that works, and the ported code (`_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts`) has zero framework coupling. It loses: file-based routing, per-entry prerendering with per-entry `<head>`, and `$app/*` niceties. You would rebuild the first two by hand within a week. Take this option **only** if the site collapses to a single page with no per-config URLs — which contradicts the shareable-stamp requirement. Note that `grid-editor` had to shim `$app/environment` (`renderer.vite.config.mjs`) precisely because it is plain Vite pretending to be SvelteKit; do not inherit that debt in a greenfield.

**SvelteKit 3 (`3.0.0-next.25`) — do not use.** Prerelease. Start on 2.70.3; the migration surface for a static site is small.

---

## Decision 2 — Rendering 10-30 live 81-LED grids

**Verdict: keep 2D canvas, one `<canvas>` per card, one shared rAF host — port `pad-sim-host.ts`'s *scheduling* verbatim, but rewrite its *painting*.** Confidence: **MEDIUM-HIGH** on the architecture, **MEDIUM** on the specific throughput numbers (arithmetic from the code, not a profile — measure before trusting).

### The existing approach scales. The existing `blit()` does not.

The scheduling design in `grid-editor/src/renderer/main/zona/pad-sim-host.ts` is correct and should be carried over unchanged in shape:

- **One shared `requestAnimationFrame`** for the whole page, not one per card. Right: N rAF callbacks is N times the scheduler overhead and N chances to desync.
- **A 10 ms tick accumulator with a `MAX_CATCHUP_MS = 100` clamp.** Right: rAF stops in a backgrounded tab; without the clamp a tab restored after two minutes replays 12,000 ticks in one frame.
- **`RENDER_INTERVAL_MS = 33` decoupling paint from tick.** Right, and it is the single most important lever: engines advance at logical 100 Hz while canvases repaint at ~30 Hz.
- **`IntersectionObserver` gating.** Right, and it is the real answer to "does 30 cards scale": *it is never 30*. In a grid layout 6-12 cards are on screen; the rest are paused with `visible: false` and cost literally zero. Any capacity estimate should be made against on-screen count, not catalog size.
- **The self-cancelling loop** (`if (any) rAF(...) else lastNow = undefined`) plus `sim.animating` freeze detection. Right: a catalog of static instrument layouts settles to zero CPU instead of spinning forever.
- **`prefers-reduced-motion` snapping to tick 64.** Right, and it doubles as a performance escape hatch.

Two small gaps worth closing on the port:
- The observer uses `{ threshold: 0 }` with no `rootMargin`. A card therefore wakes exactly as it crosses the viewport edge, showing a frozen frame for a beat. Use `{ threshold: 0, rootMargin: "200px" }`.
- Nothing throttles by device capability. Consider dropping `RENDER_INTERVAL_MS` to 50 (20 fps) when `navigator.hardwareConcurrency <= 4`.

### Where it will actually break

Counting the work in the current code:

**Ticking is free.** `PadSim.tick()` does one FIFO shift, an integer clock add, and `ledTick()` over 243 layers (`CELLS 81 × LAYER_COUNT 3`) of integer phase arithmetic. `render()` is 243 iterations of ~12 integer ops and is lazy (only on `frame` access when dirty). At 12 visible cards × 100 ticks/s that is on the order of 10^6 simple integer ops per second. Nothing. Even 30 cards is nothing.

**Painting is the whole cost.** `blit()` currently issues, per card per paint: 1 `fillRect` background, then **81 `strokeRect`** (1 px stroke at `+0.5` offsets — a path stroke, the expensive canvas 2D primitive) plus up to **81 `fillRect`** for lit cells. That is ~163 draw calls per card per paint. At 12 visible cards × 30 fps → **~59,000 canvas draw calls/second**, all on the main thread, competing with Svelte updates and the serial read loop. At 30 visible cards it is ~147,000/s.

Rough expectation (unprofiled — **verify**): the current `blit` gets uncomfortable somewhere around **10-16 simultaneously visible animating cards** on a mid-range laptop, and the symptom will be a stuttering, not-quite-30-fps card wall — precisely the thing PROJECT.md says must feel like "a rack of running machines".

### The fix, in two changes

**A. Stop repainting the grid outline.** The 81 `strokeRect` calls draw a frame that never changes. Move it out of the per-frame path entirely — a sibling absolutely-positioned element carrying a `repeating-linear-gradient` grid (or one pre-rendered SVG/PNG) laid over the canvas. The compositor draws it once on the GPU and it costs nothing per frame. This alone removes half the draw calls and the most expensive half.

**B. Blit the frame as a 9x9 image, upscaled with nearest-neighbour.** `PadSim.frame` is already a `Uint8Array` of 81×3 bytes in screen row-major order. Widen it into a reused `ImageData(9, 9)` (RGBA, alpha 255), `putImageData` into a persistent 9x9 offscreen canvas, then one `drawImage(off, 0, 0, 9, 9, 0, 0, size, size)` with `ctx.imageSmoothingEnabled = false`.

That takes a card's paint from ~163 draw calls to **2**. Roughly 59,000 draw calls/s → ~720/s. 30 visible cards then sits well under 2 ms of main-thread paint per frame, and the ceiling moves from "how many cards" to "how many canvases the compositor wants to keep resident" — a much higher and much softer wall.

Cost of B: nearest-neighbour upscale yields hard, gapless squares. If the design needs rounded or gapped cells, get the gaps from the static overlay in change A (a grid of transparent gutters punched over the solid blit), not from the fill loop. If the design needs a genuine per-LED bloom, do it as **one** CSS `filter: blur()` / `box-shadow` on the canvas element (compositor, once) — never as per-cell `shadowBlur`, which the existing code already learned to remove and documented as "measurable jank".

### What NOT to use for this, and why

- **DOM elements (81 `<div>` per card): hard no.** 12 visible cards × 81 = 972 elements each taking a style write at 30 fps ≈ 29,000 style mutations/second, each forcing style recalculation and paint over a large subtree. This is the textbook way to kill an animation-heavy page. 30 cards makes it 73,000/s.
- **WebGL / regl, one context per card: hard no, and it fails loudly rather than slowly.** Chrome caps live WebGL contexts at roughly **16 per tab** (8 on Android); Firefox allows **8 per principal, 16 per browser**. Exceeding it fires `webglcontextlost` on the *least recently used* context — i.e. the cards the user just scrolled to. A 10-30 card wall walks straight into this. (A single shared WebGL context rendering all grids into one atlas canvas behind the cards would work and would be genuinely fast, but it requires manual scroll-position syncing between a fixed GL surface and flowed DOM cards. Enormous complexity to solve a problem `putImageData` already solves.)
- **OffscreenCanvas in a worker: not now — keep it as the documented escape hatch.** It is well supported and it is the correct answer *if profiling after fixes A and B still shows main-thread jank*. Reasons to defer: `transferControlToOffscreen()` is one-way and per-canvas, so 30 cards means 30 transfers plus message plumbing; the sim state would have to live in the worker, which puts a thread boundary between the interactive preview's pointer events and the tick-locked, at-most-one-sample-per-tick delivery that makes the preview firmware-faithful. If you do go there later, move **only the thumbnail grid** into one worker holding all card sims and posting `ImageBitmap`s back; leave the interactive preview on the main thread. Confidence that this is never needed: **MEDIUM**.

### The honest ceiling

- Simulation: not the limit at any plausible catalog size.
- Painting with the current `blit`: expect roughly 10-16 concurrently visible animating cards before visible stutter on mid-range hardware. **Unverified estimate — profile it.**
- Painting after fixes A and B: 30+ concurrently visible cards at 30 fps should be comfortable; the limiting factor becomes canvas memory and compositor layer count, not draw calls.
- `IntersectionObserver` means catalog size is essentially unbounded either way. A 200-entry catalog costs the same as a 20-entry one.

**Instrument it from day one.** A `performance.measure` around the paint pass and a dev-only overlay showing visible-card count and ms/frame will settle this in an afternoon and is worth more than any of the estimates above.

---

## Decision 3 — Web Serial on a static site

Confidence: **HIGH** (MDN browser-compat-data, webstatus.dev Baseline API, Mozilla release notes, WebKit standards-positions).

### Support matrix, as of 2026-09-02

| Browser | Web Serial | Notes |
|---------|-----------|-------|
| Chrome desktop | **89+** (2021-03-02) | Reference implementation. Current stable 153. WPT 0.909. |
| Edge desktop | **89+** (2021-03-04) | Mirrors Chrome. |
| Opera desktop | Yes (mirrors Chrome) | |
| **Firefox desktop** | **151+** (2026-05-19) | **New.** Current stable 155.0. WPT 0.727 — supported but second-class. Caveats below. |
| Safari (all platforms) | **No** | WebKit standards position is formally **"oppose"** (privacy, security, use cases, device independence). Not "not yet". |
| iOS / iPadOS, any browser | **No** | All iOS browsers are WKWebView. Permanently out. |
| Chrome Android | 138+, **partial** | *"Serial ports are only available if they're provided by Bluetooth RFCOMM serial port emulation."* A USB-attached ZONA is **not** reachable. Treat Android Chrome as unsupported for HANGAR's purposes. |
| Firefox Android | No | |
| Android WebView | No | crbug 40740509 |

Baseline status: **"limited"** — not Baseline, and won't be while Safari opposes.

### Firefox-specific caveats that will bite

- **Two-step permission.** Firefox shows a site-permission add-on prompt *before* the port picker (the same gating it uses for Web MIDI). That is more friction than Chrome's single chooser, and it needs its own copy in the connect flow: users will see something that looks like an extension install and bail without an explanation.
- **Disabled by default under Firefox Enterprise** via the `DefaultSerialGuardSetting` policy. Corporate machines may silently have no `navigator.serial`.
- **WPT 0.727 vs Chrome's 0.909.** Roughly a quarter of the test suite fails. Do not assume feature parity across every property; feature-detect the individual bits you use, not just `navigator.serial`.

### What a static site needs

- **Secure context.** HTTPS is mandatory. `http://localhost` counts as a secure context, so `vite dev` works with no certificates. Any custom domain on Cloudflare or GitHub Pages gets HTTPS automatically. Non-issue in practice — but it *does* mean a "just open `index.html` from disk" build will silently have no `navigator.serial` (`file://` is not a secure context). Flag that for anyone testing a local build.
- **Transient user activation** for `requestPort()`. It must be called synchronously-ish inside a real click handler. Do not await anything slow before it (notably: do not `await initLuaFormatter()` in the same handler before calling `requestPort()` — the WASM fetch will consume the activation window). Fetch the port first, compile second.
- **`Permissions-Policy: serial`.** Default-allow for same-origin top-level documents, so nothing to do. Only matters if HANGAR is ever embedded — the embedder then needs `<iframe allow="serial">`. Worth noting that a Cloudflare Worker lets you set this header if you later want to lock it down; GitHub Pages does not.

### Permission persistence and the connection lifecycle

- **`navigator.serial.getPorts()`** returns previously-permitted ports with **no user gesture required**. Call it on load: if a permitted ZONA is already attached, offer instant reconnect ("ZONA detected — connect?") instead of forcing a fresh chooser. Note the returned ports are permitted, not open — you still call `open({ baudRate: 2_000_000 })`.
- **`navigator.serial` `connect` / `disconnect` events** fire when a *permitted* device is physically plugged or unplugged. This is the HANGAR hero moment: the user plugs in their ZONA while browsing and the site notices. **Important gap in the code being ported:** `grid-editor`'s `SerialTransport` attaches `disconnect` to the **port**, not to `navigator.serial`, and never listens for `connect` at all. Add a `navigator.serial`-level listener pair in HANGAR.
- **`SerialPort.connected`** (Chrome 130+, Firefox 151+) — a boolean for "physically attached". Useful for rendering state, but feature-detect it: it is not in the Chrome 89 baseline.
- **`SerialPort.forget()`** (Chrome 103+, Firefox 151+) — revokes the permission. Given PROJECT.md's safety stance ("the site talks to hardware people paid for"), ship a visible "Revoke this site's access to your ZONA" control backed by `forget()`. It is three lines and it is exactly the kind of thing that earns trust for a site that writes firmware config.
- Reuse the proven transport shape. `grid-editor/src/renderer/serialport/serial-transport.ts` is ~180 lines and already handles the awkward parts: `writable.locked` checks before `getWriter()`, `releaseLock()` in a `finally`, a read loop that only starts once a data callback is registered, and cancel-then-release on close. Port it; replace its hand-rolled `WebSerialPort` interface with `@types/w3c-web-serial`.

### Polyfills and WebUSB fallback

**There is no polyfill, and WebUSB is not worth building.** Confidence: **HIGH**.

Web Serial is an OS capability, not a JS API surface — nothing can shim it. As for WebUSB: Grid enumerates as USB CDC-ACM, and WebUSB *can* in principle drive CDC-ACM by claiming the data interface. Do not do it, for three independent reasons, any one of which is fatal:

1. **It buys zero new browsers.** WebUSB is Chromium-only. Firefox has never shipped it and its standards position is "harmful"; Safari's is also negative. Every browser that has WebUSB already has Web Serial.
2. **It breaks on Windows.** The OS CDC driver claims the interface, so `claimInterface()` fails. The fix is a WinUSB/Zadig driver swap — completely unacceptable for a "open a URL, no install" product.
3. Chromium blocks WebUSB on protected interface classes, and CDC has historically been in scope for that blocklist.

The correct fallback is not a fallback. It is the honest degrade PROJECT.md already specifies: feature-detect `"serial" in navigator`, and when absent show the full catalog and full simulator with a plain sentence naming which browsers can install. Since Firefox 151 now qualifies, that sentence should be generated from the detect, not hard-coded to "Chrome".

---

## Decision 4 — `@intechstudio/grid-protocol`

Confidence: **HIGH** — verified against the public npm registry *and* by reading the shipped `dist/` on disk at `grid-editor/node_modules/@intechstudio/grid-protocol/`.

**Published:** yes, publicly, unscoped-access. 130 versions. `dist-tags.latest = 1.20260828.1315`, registry `time.modified = 2026-08-28T13:15:50Z`. `grid-editor` pins `1.20260825.1135`; `profile-cloud` is far behind at `1.20250305.1735`. Unpacked size ~313 KB. Repository: `github.com/intechstudio/grid-protocol`.

**Browser-safe: yes.** `dist/index.js` is a single pre-bundled **ESM** file (`main`, `module` and `types` all point into `dist/`). Grepping the shipped bundle:
- zero `require()` of `fs`/`path`/`os`/`crypto`/`child_process`/`stream`/`buffer`
- zero `node:` specifier imports
- only two external imports at the top: `tslib` helpers and `@wasm-fmt/lua_fmt`

So there is nothing to `node-polyfill` and nothing to alias away.

**What it exports** (from `dist/index.d.ts`):
- `grid` — namespace with `encode_packet`, `decode_packet_frame`, `decode_packet_classes`, `module_type_from_hwcfg`, `module_architecture_from_hwcfg`, `get_module_element_list`, `get_element_events`, `getProperty`, `module_hwcfgs`, `lua_function_to_human_map`, `lua_function_forbiddens`, `get_lua_function_helper`, `is_element_compatible_with`, `ActionBlock`
- `GridScript` — static class: `compressScript`, `expandScript`, `shortify`, `humanize`, `minifyScript`, `checkSyntax`, `typeCheck`, `splitShortScript`, `splitArrayToString`, `validator`
- `initLuaFormatter()` — `Promise<void>`
- enums/helpers: `ModuleType` (**includes `ZONA`**), `EventType` (includes `SETUP`, `TIMER`, `TOUCH`), `ElementType`, `Architecture`, `CEEAT`, `NumberToEventType`, `EventTypeToNumber`

### The trap: the WASM Lua formatter

`dist/index.js` line 1-2 statically imports `init` and `format` from `@wasm-fmt/lua_fmt` — a **628 KB** StyLua-compiled `.wasm` plus ~18 KB of glue JS. The call chain that matters:

```
GridScript.compressScript(script)
  -> GridScript.shortify(script)
  -> GridScript.minifyScript(...)
     -> minifyLua(code)
        -> checkInitialized()   // THROWS if initLuaFormatter() has not resolved
        -> format(code, "main.lua", {...})   // the WASM call
```

Two asymmetric failure modes, and this is why `_pad.ts` has an explicit readiness gate rather than defensive noise:

- `compressScript` / `minifyScript` / `beautifyLua` **throw** `"Lua formatter not initialized. Call initLuaFormatter() first."`
- `GridScript.checkSyntax` **silently returns `false`** (it try/catches `beautifyLua`). A compiler that validated before init resolved would report every correct config as broken.

`grid-editor/src/renderer/main/zona/_pad.ts:44-70` already solves this with `padCompilerReady()` / `isPadCompilerReady()` / `assertPadCompilerReady()` — a cached promise plus a `checkSyntax("local a=1")` probe. **Port that gate verbatim.** It is load-bearing.

### Bundle-size relief: the 628 KB is already lazy

The static `import init from '@wasm-fmt/lua_fmt'` pulls in only the ~18 KB glue at load. The `.wasm` binary itself is fetched inside `init()`, which only runs when you call `initLuaFormatter()`. So the catalog and every simulator paint before a single byte of WASM is fetched — **provided you do not call `initLuaFormatter()` on boot.**

This works because simulation does not need the compiler: `new PadSim(state)` takes a `PadState` object, not Lua. The only things needing WASM are (a) computing the 908-character cost for the fit ladder and (b) producing the Lua actually written to the module. So:

- Do **not** `await padCompilerReady()` in the root layout.
- Do call it when the user first opens a tune panel, and again (idempotent, it caches) before any install.
- Prefetch it opportunistically on `requestIdleCallback` or on hover of a Tune/Install control, so the first knob turn does not stall on a 628 KB download.

### Consuming it in a static Vite build

The one config line that matters, lifted from `grid-editor/renderer.vite.config.mjs`:

```js
// vite.config.ts
optimizeDeps: {
  exclude: ["@intechstudio/grid-protocol"],
}
```

Excluding it from dependency pre-bundling keeps `@wasm-fmt/lua_fmt`'s `new URL('lua_fmt_bg.wasm', import.meta.url)` resolving against the real module URL, so Vite emits the `.wasm` as a proper hashed asset instead of producing a mangled pre-bundle path. This is proven in grid-editor's web build.

If it still misresolves under Vite 8 / SvelteKit's build, the package ships a purpose-built subpath — `"./vite": "./lua_fmt_vite.js"`, which does `import wasm from "./lua_fmt_bg.wasm?url"` — reachable via:

```js
resolve: { alias: { "@wasm-fmt/lua_fmt": "@wasm-fmt/lua_fmt/vite" } }
```

Under **Vitest / Node** no config is needed at all: the package's `exports` map has a `"node"` condition pointing at `lua_fmt_node.js`, which loads the wasm with `node:fs/promises`. That is why `grid-editor`'s headless Vitest suite can call `padCompilerReady()` in a `beforeAll` and get a working formatter.

**Pinning:** PROJECT.md already says HANGAR pins this package. Pin the **exact** version with no caret — its versioning is a firmware-tracking datestamp, not semver, so `^` is meaningless and a bump could change wire encoding. Recommend pinning `1.20260825.1135` to match `grid-editor` exactly during the port (so the ported `_pad.ts` cost function produces byte-identical character counts against a known-good baseline), then deliberately bumping to `1.20260828.1315` afterwards as its own reviewable change with the fit-ladder tests as the gate.

---

## Decision 5 — Static hosting

**Verdict: Cloudflare Workers with Static Assets.** Confidence: **HIGH** (primary Cloudflare docs).

Cloudflare's own Pages landing page carries the callout: *"Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. **Start new projects with Workers.**"* Pages remains supported for existing sites but new investment goes to Workers.

Why it is right for HANGAR specifically:

- **Cost is genuinely zero.** Cloudflare's billing docs state plainly: *"Requests to static assets are free and unlimited."* Only Worker script invocations bill. A motion-heavy public playground with no backend never invokes a script, so traffic spikes from a Discord link cost nothing. (Contrast: the 100,000 req/day free-tier limit applies to Worker invocations, not asset serves — so avoid `run_worker_first` unless you actually add a Worker.)
- **HTTPS by default** on `*.workers.dev` and on custom domains. Web Serial's secure-context requirement is satisfied without thought.
- **Limits are irrelevant here**: 20,000 files per version on free (100,000 paid), 25 MiB per file. HANGAR's largest single asset is the 628 KB `lua_fmt_bg.wasm`.
- **You can set response headers.** Matters if you ever want `Permissions-Policy: serial=(self)` or a tight CSP. GitHub Pages cannot do this at all.
- **It is already the established host on this account** (`zona-docs`). One vendor, one `wrangler`, one deploy story, one dashboard.
- **The escape hatch is a config toggle, not a re-platform.** The one thing a purely static build genuinely cannot do is generate an OG preview image for a *tuned* URL (a per-preset OG image can be prerendered at build time by running `PadSim` in Node and encoding a PNG; an arbitrary base36 stamp cannot). If that turns out to matter for the Discord-sharing story, a Worker in front of the same assets renders it on demand — no migration. On GitHub Pages that would mean moving hosts.

Config with `adapter-static`:

```jsonc
// wrangler.jsonc
{
  "name": "hangar",
  "compatibility_date": "2026-09-01",
  "assets": {
    "directory": "./build",
    "not_found_handling": "404-page"
  }
}
```

`npm run build && wrangler deploy`. No `main` entry needed for an assets-only Worker.

**Alternatives:**

| Option | Verdict |
|--------|---------|
| **Cloudflare Pages** | Works fine today, free HTTPS, Git-based CI. But Cloudflare's own docs steer new projects away from it, and it lacks Workers' feature set. Choose only if you specifically want Pages' built-in Git integration and will never need a request-time hook. |
| **GitHub Pages** | Free, HTTPS via Let's Encrypt, and it puts the GPLv3 source and the deployed artifact in one place — a real fit with the "public source" constraint. Costs: no custom response headers, no server-side escape hatch ever, a second vendor alongside `zona-docs`, and a 1 GB site / 100 GB-month soft bandwidth guidance that a viral Discord moment could brush. Acceptable fallback; not the first choice. |
| **Workers + `@cloudflare/vite-plugin`** | Only if you later add real Worker logic. For assets-only, `adapter-static` + a `wrangler.jsonc` `assets` block is simpler and has fewer moving parts. |

---

## Decision 6 — Testing

**Verdict: Vitest 4.1.11 in the node environment for all ported logic; Playwright 1.62.1 for the non-serial browser paths; Web Serial itself is not automatable and should not be pretended otherwise.** Confidence: **HIGH**.

### Unit tests: Vitest, node environment

This is not a preference, it is a transfer:

- `grid-editor` runs `vitest ^4.1.0` with `"test": "vitest run"` and **no config file** — Vite's defaults suffice.
- `src/renderer/tests/` is 7,869 lines across 8 suites, including `pad-sim.test.js`, `pad.test.js` and `pad-invariants.test.js` — the suites that pin the firmware-faithful simulator and the fit ladder, and that PROJECT.md says "already caught a real committed bug".
- Those tests are plain `.js` importing `.ts` sources directly, and they run headless in node with `beforeAll(() => padCompilerReady())`. That works because `@wasm-fmt/lua_fmt` has a `"node"` export condition (`lua_fmt_node.js`, `node:fs/promises`).

So porting the test suite is a file copy plus an import-path rewrite. Any other runner throws away a validated regression net for nothing. Do not consider one.

Setup: `environment: "node"` (the default) for `_pad`, `pad-sim`, the stamp codec, the fit ladder and the install sequencer. Add a second Vitest project with `environment: "jsdom"` or `@vitest/browser` **only** for `pad-sim-host`'s scheduling logic if you want to test `IntersectionObserver` gating — and honestly, a hand-rolled fake `IntersectionObserver` in a node test is simpler and less flaky than a real browser for that.

### Web Serial testing: say it plainly

**Web Serial cannot be tested automatically, with or without hardware.** Three independent blockers:

1. `navigator.serial.requestPort()` opens a **native browser chooser** that lives outside the page. Playwright, Puppeteer and raw CDP cannot interact with it.
2. There is no permission-granting or device-faking hook. Chromium exposes fakes for geolocation, camera, microphone, Bluetooth (`Bluetooth.simulate*` in CDP) — but **not** for serial. There is no CDP `Serial` domain and no `context.grantPermissions("serial")`.
3. Even with a virtual COM pair (`com0com` on Windows, `socat` on Linux) presenting a real port to the OS, blocker 1 still applies: no driver can pick from the chooser.

Anyone who claims otherwise is either testing in Electron (where the main process can auto-select via the `select-serial-port` event — which is exactly how `grid-editor` sidesteps this and is **not** available to a static site) or is not actually exercising `requestPort()`.

### The honest alternative: three layers

**Layer 1 — a fake transport, and put ~95% of the risk behind it.**
The `GridTransport` interface already exists (`transport.ts`: `open` / `close` / `isConnected` / `isWriteLocked` / `write` / `onData` / `onDisconnect` / `getInfo`) and already has two non-serial implementations shipping (`websocket-transport.ts`, `virtual-transport.ts`). Port the interface and write a `FakeTransport` that records every `write()` and can replay canned inbound byte sequences. Then unit-test in Vitest, with no browser:

- the install sequencer (Setup event 0, Timer event 6, RAM-first ordering)
- the store-to-flash path being a genuinely separate command sequence
- snapshot-at-connect and restore
- the frame scanner (the `rxBuffer[i] === 10 && rxBuffer[i-3] === 4` EOT+LF scan from `serialport.ts`) against split-chunk, coalesced-chunk and torn-frame inputs — this is the single most bug-prone piece and it is 100% testable
- module identification as ZONA via `grid.module_type_from_hwcfg`
- timeouts, retries, and the write-lock backoff
- the "never write without an explicit click" invariant, asserted as "zero `write()` calls recorded after a full connect + browse cycle"

That last one is worth calling out: PROJECT.md's central safety promise is testable as a property against a fake transport, and should be.

**Layer 2 — keep the `navigator.serial` layer too thin to need tests.**
One module: feature-detect, `requestPort({ filters })`, `getPorts()`, `open({ baudRate: 2_000_000 })`, wire `connect`/`disconnect`, hand a `SerialTransport` to the sequencer. No branching business logic. Roughly 60-80 lines with no decisions in them. Code with no branches needs no unit tests; it needs a human to plug in a ZONA once.

**Layer 3 — a written hardware smoke checklist, run by a person before each release.**
Connect → identified as ZONA → snapshot captured → RAM audition visibly changes the pad → restore returns the original → store-to-flash survives a power cycle → unplug mid-write recovers cleanly → replug fires `connect` → reconnect via `getPorts()` needs no chooser. Ten minutes, once per release. Automating it needs a robot arm and a USB switch; do not pretend otherwise, and do not let a green CI badge imply this was covered.

### Playwright: worth having, for the other half

Playwright **cannot** test the install path, but it can test what most visitors actually experience, and these are all high-value:

- catalog renders, cards are animating (assert canvas pixels change between two samples)
- the base36 stamp round-trips through the URL
- a knob turn recompiles and the cost stays inside 908 characters
- **the degrade path**, forced with `addInitScript(() => { delete navigator.serial })` — the branch a large share of visitors will hit and the one no manual tester will remember to check
- reduced-motion snapping to a static representative frame

---

## Installation

```bash
# Scaffold (SvelteKit + Svelte 5 + TypeScript + Vite)
npx sv create hangar        # sv 0.17.0 — choose: SvelteKit minimal, TypeScript, Prettier, ESLint, Vitest

cd hangar

# Static adapter
npm i -D @sveltejs/adapter-static@3.0.10

# Grid protocol — EXACT pin, no caret (datestamp versioning, not semver).
# Matches grid-editor during the port; bump deliberately afterwards.
npm i @intechstudio/grid-protocol@1.20260825.1135

# Web Serial typings
npm i -D @types/w3c-web-serial@1.0.8

# Styling (optional but recommended)
npm i -D tailwindcss@4.3.3 @tailwindcss/vite@4.3.3

# Browser E2E for the non-serial paths
npm i -D @playwright/test@1.62.1 && npx playwright install chromium firefox

# Deploy
npm i -D wrangler@4.128.0

# Pin the toolchain TypeScript (sv may install 7.x, which kit/svelte-check do not yet accept)
npm i -D typescript@6.0.3
```

Then, `vite.config.ts`:

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    // Load-bearing: keeps @wasm-fmt/lua_fmt's `new URL(..., import.meta.url)`
    // resolving so Vite emits lua_fmt_bg.wasm as a real asset.
    // Proven in grid-editor/renderer.vite.config.mjs.
    exclude: ["@intechstudio/grid-protocol"],
  },
});
```

and `src/routes/+layout.ts`:

```ts
export const prerender = true;
export const ssr = false;   // the app is a client-side machine; nothing to render on a server
export const trailingSlash = "always";
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SvelteKit 2.70.3 + adapter-static | Plain Vite 8 + TypeScript | If HANGAR collapses to a single page with no per-config URLs and no link previews. The ported code is framework-free, so this is genuinely viable — you just rebuild routing and per-entry prerendering by hand. |
| SvelteKit | Astro 5 | If HANGAR were mostly static prose with a few interactive demos (i.e. if it were `zona-docs`). Not this project: MPA navigation would tear down the serial connection and the shared rAF loop. |
| SvelteKit | Next.js static export | Only if a React-fluent team inherits the project. Costs a full port of framework-free TS into React idioms plus manual memoization to survive 30 canvases. |
| SvelteKit 2.70.3 | SvelteKit 3.0.0-next.25 | When 3.0 is stable. Not before. |
| 2D canvas + `putImageData` upscale | Single shared WebGL context, all grids in one atlas | If a design requirement appears that canvas 2D genuinely cannot hit — real per-LED bloom with per-cell parameters at 60 fps across 30+ cards. Buys real headroom; costs manual scroll-syncing between a fixed GL surface and flowed DOM. |
| Main-thread rAF host | OffscreenCanvas + one worker holding all thumbnail sims | If profiling *after* the static-overlay and `putImageData` fixes still shows main-thread jank. Move only the thumbnails; keep the interactive preview on the main thread so tick-locked pointer delivery stays intact. |
| Cloudflare Workers static assets | GitHub Pages | If you want the GPLv3 source repo and the deployed artifact to be one thing, and are certain you will never need a request-time hook or a custom response header. |
| Cloudflare Workers static assets | Cloudflare Pages | If you want Pages' built-in Git-push CI and nothing else. Cloudflare's own docs steer new projects to Workers. |
| Vitest node environment | `@vitest/browser` 4.1.11 | For `pad-sim-host` scheduling if you want a real `IntersectionObserver` and real `requestAnimationFrame`. A fake `IntersectionObserver` in node is usually simpler and less flaky. |
| TypeScript 6.0.3 | TypeScript 7.0.2 | Once `@sveltejs/kit` and `svelte-check` widen their peer ranges past `^6`. The 10x type-check speedup is real; the toolchain just is not there yet. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **81 DOM elements per card** | ~29,000 style mutations/second at 12 visible cards, 73,000 at 30 — each forcing style recalc and paint over a large subtree. Kills the page. | One `<canvas>` per card |
| **WebGL / regl, one context per card** | Chrome caps live WebGL contexts at ~16/tab (8 on Android); Firefox 8 per principal. Exceeding it fires `webglcontextlost` on the least-recently-used context — i.e. the cards the user just scrolled to. It fails visibly and confusingly. | 2D canvas; or one shared GL context with an atlas if you truly need GL |
| **`ctx.shadowBlur` per lit cell** | The existing `pad-sim-host.ts` already removed it and documented it as "measurable jank on the renderer thread" at 30 fps across nine canvases. It gets worse at 30. | One CSS `filter: blur()` / `box-shadow` on the canvas element (compositor, once per frame) |
| **81 `strokeRect` per card per frame** | ~50% of the current draw-call cost, painting a frame that never changes. Path stroking is the expensive 2D primitive. | Static CSS/SVG grid overlay in a sibling element |
| **A WebUSB fallback for non-Chromium browsers** | Buys **zero** new browsers (WebUSB is Chromium-only too); breaks on Windows because the OS CDC driver holds the interface, requiring a Zadig driver swap; and Chromium blocks protected interface classes. Strictly worse than Web Serial in every dimension. | Runtime feature-detect + the honest degrade PROJECT.md already specifies |
| **Any "Web Serial polyfill"** | Does not and cannot exist. It is an OS capability, not an API shape. | Feature-detect |
| **Browser sniffing for the Web Serial gate** | Would have wrongly excluded Firefox 151+ from install as of 2026-05-19, and would wrongly *include* Chrome Android 138 (which only exposes Bluetooth RFCOMM ports, not a USB ZONA). | `if ("serial" in navigator)`, plus a `requestPort()` try/catch |
| **Calling `initLuaFormatter()` at app boot** | Fetches 628 KB of WASM before the catalog paints, for a capability only needed when tuning or installing. | Lazy: on first tune-panel open / install click, prefetched on idle or hover |
| **Calling `requestPort()` after an `await` of the WASM init** | Burns the transient user activation; `requestPort()` then rejects. | `requestPort()` first inside the click handler, compile second |
| **`^` on `@intechstudio/grid-protocol`** | Its version is a firmware-tracking datestamp (`1.YYYYMMDD.HHMM`), not semver. A caret range is meaningless and a silent bump could change wire encoding or the minifier's output length — which would silently move the 908-character fit ladder. | Exact pin; bump as a deliberate, test-gated change |
| **Forcing `@wasm-fmt/lua_fmt` to 0.3.3** | grid-protocol pins `^0.2.0` and is built against that API. npm's `latest` is 0.3.3. Do not add a resolution override. | Let it resolve transitively |
| **`ts-jest` / Jest** | `grid-editor` has a vestigial `ts-jest` dependency and a `jest.config.js`, but the real suite runs on Vitest. Copying Jest in would mean rewriting 7,869 lines of working tests. | Vitest 4.1.11 |
| **Electron's `select-serial-port` pattern** | That is how `grid-editor` auto-selects a port without a chooser. It is a main-process API and does not exist in a browser. Any test or doc assuming it will mislead. | `navigator.serial.getPorts()` for silent reconnect; a real chooser otherwise |
| **A `file://` build for local testing** | `file://` is not a secure context, so `navigator.serial` is `undefined` and the site silently shows the degrade path. Wastes an hour. | `vite dev` or `vite preview` on `localhost` (a secure context) |

---

## Stack Patterns by Variant

**If profiling shows main-thread jank persists after the static-overlay + `putImageData` fixes:**
- Move only the thumbnail simulators into a single dedicated worker; `transferControlToOffscreen()` each card canvas; keep the interactive preview on the main thread.
- Because the preview's firmware fidelity depends on tick-locked, at-most-one-sample-per-tick pointer delivery, and a thread boundary would put message-queue latency in the middle of that guarantee.

**If per-tuned-config OG images turn out to matter for the Discord sharing story:**
- Add a Worker script in front of the same static assets that renders the sim frame on demand for `/og/:stamp.png`.
- Because Workers Static Assets already hosts the site; this is a `main` entry plus a route pattern, not a re-platform. Choosing GitHub Pages now forecloses this.

**If the catalog grows past ~50 entries:**
- Add virtualisation to the card grid (or lazy-mount canvases on approach) on top of the existing `IntersectionObserver` gating.
- Because `IntersectionObserver` already stops the *simulation* of offscreen cards, but 200 mounted `<canvas>` elements still consume compositor memory even when idle.

**If a browse-only mobile experience becomes a priority:**
- Drop `RENDER_INTERVAL_MS` to 50 (20 fps) and reduce simultaneously-visible cards via layout when `navigator.hardwareConcurrency <= 4`.
- Because install is impossible on every mobile browser anyway (Android Chrome 138 only exposes Bluetooth RFCOMM ports; iOS has nothing), so mobile is purely a rendering-budget problem.

**If Intech ever wants HANGAR embedded inside Grid Editor or another origin:**
- The embedder must set `<iframe allow="serial">`, and HANGAR should be served with a permissive `Permissions-Policy: serial=(self "https://embedder.example")`.
- Because Web Serial is Permissions-Policy-gated and defaults to same-origin-only; this is another reason the Worker (which can set headers) beats GitHub Pages (which cannot).

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `@sveltejs/kit@2.70.3` | `vite ^5.0.3 \|\| ^6 \|\| ^7.0.0-beta.0 \|\| ^8.0.0` | Vite 8.2.2 is explicitly in range. Verified from the published manifest. |
| `@sveltejs/kit@2.70.3` | `typescript ^5.3.3 \|\| ^6.0.0` | **Excludes TypeScript 7.x.** Use 6.0.3. |
| `@sveltejs/kit@2.70.3` | `@sveltejs/vite-plugin-svelte ^7.0.0` | Plugin latest is 7.3.0. |
| `@sveltejs/vite-plugin-svelte@7.3.0` | `vite ^8.0.0`, `svelte ^5.46.4` | Requires Vite 8 — it no longer supports Vite 7. Node `^20.19 \|\| ^22.12 \|\| >=24`. |
| `@sveltejs/adapter-static@3.0.10` | `@sveltejs/kit ^2.0.0` | Published 2025-10-02; stable, not stale. `4.0.0-next.4` exists for kit 3 — do not use. |
| `svelte-check@4.7.6` | `svelte ^5`, `typescript ^5 \|\| ^6` | Same TS-7 exclusion as kit. |
| `@intechstudio/grid-protocol@1.2026*` | Any ESM bundler; **no** Node builtins | Verified by grepping the shipped `dist/index.js`: zero `require("fs"\|"path"\|...)`, zero `node:` imports. |
| `@intechstudio/grid-protocol` | `@wasm-fmt/lua_fmt@^0.2.0` | Hard runtime dependency. `GridScript.compressScript` throws until `await initLuaFormatter()` resolves; `GridScript.checkSyntax` silently returns `false` instead. |
| `@wasm-fmt/lua_fmt@0.2.0` | Vite: needs `optimizeDeps.exclude` on grid-protocol, or alias to the `/vite` subpath | Node/Vitest: the `"node"` export condition handles it with no config. |
| `wasmoon@1.16.0` | `@types/emscripten` 1.39.10 — its only runtime dependency | Both MIT, both inside `scripts/gen-licenses.mjs`'s allowlist, both discharged into `THIRD-PARTY.md` and `licenses/`. In a browser the factory MUST be handed an explicit glue URI (`new URL("wasmoon/dist/glue.wasm", import.meta.url)`), or it silently fetches `https://unpkg.com/wasmoon@1.16.0/dist/glue.wasm` from a third-party CDN; under Node the URI is left undefined so emscripten resolves it off disk. |
| `@tailwindcss/vite@4.3.3` | `vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8` | Vite 8 in range. |
| `@vitest/coverage-v8@4.1.11` | `vitest 4.1.11` | Exact-version peer. Bump together. |
| `wrangler@4.128.0` | `@cloudflare/workers-types ^5.20260831.1` | Types only needed if you add an actual Worker script. Assets-only deploys need neither. |

---

## Sources

**npm registry (`registry.npmjs.org`), queried 2026-09-02 — HIGH confidence.** Exact `dist-tags`, publish dates and `peerDependencies` read from the packuments for: `@intechstudio/grid-protocol` (latest `1.20260828.1315`, modified 2026-08-28), `svelte` (5.57.0), `@sveltejs/kit` (2.70.3), `@sveltejs/adapter-static` (3.0.10), `@sveltejs/vite-plugin-svelte` (7.3.0), `@sveltejs/adapter-cloudflare` (7.2.9), `vite` (8.2.2), `vitest` (4.1.11), `@vitest/browser` (4.1.11), `@vitest/coverage-v8` (4.1.11), `typescript` (7.0.2 latest / 6.0.3 last 6.x), `svelte-check` (4.7.6), `tailwindcss` (4.3.3), `@tailwindcss/vite` (4.3.3), `@types/w3c-web-serial` (1.0.8), `@playwright/test` (1.62.1), `wrangler` (4.128.0), `sv` (0.17.0), `@wasm-fmt/lua_fmt` (0.3.3 latest, 0.2.0 pinned transitively).

**Local package inspection — HIGH confidence.** `grid-editor/node_modules/@intechstudio/grid-protocol/{package.json,dist/index.js,dist/*.d.ts}` and `grid-editor/node_modules/@wasm-fmt/lua_fmt/{package.json,lua_fmt.js,lua_fmt_vite.js,lua_fmt_node.js,lua_fmt_bg.wasm}` — read directly to establish the export surface, ESM format, absence of Node builtins, the `compressScript → minifyLua → checkInitialized` throw path, the 628 KB wasm size and the three loader variants.

**MDN browser-compat-data (`github.com/mdn/browser-compat-data`, `api/Serial.json` + `api/SerialPort.json`, main branch) — HIGH confidence.** Chrome/Edge 89, Firefox 151, Safari false, Chrome Android 138 partial (Bluetooth RFCOMM only), WebView Android false. `SerialPort.connected` Chrome 130. `SerialPort.forget` Chrome 103.

**`api.webstatus.dev/v1/features/serial` — HIGH confidence.** Baseline "limited"; Chrome 89 / 2021-03-02, Edge 89 / 2021-03-04, Firefox 151 / 2026-05-19. WPT stable scores: Chrome 0.909, Firefox 0.727, Safari 0. Vendor positions: Mozilla neutral, **Apple oppose** (privacy, security, use cases, device independence).

**Firefox 151 release notes (`firefox.com/en-US/firefox/151.0/releasenotes/`), released 2026-05-19 — HIGH confidence.** *"You can now manage microcontrollers that support serial communications in Firefox via the Web Serial API."*

**Mozilla Hacks, "Announcing Web Serial Support in Firefox" (hacks.mozilla.org, 2026-05) — MEDIUM-HIGH confidence.** Two-step permission model (site-permission add-on prompt before the port picker, same as Web MIDI); disabled by default under Firefox Enterprise via `DefaultSerialGuardSetting`.

**`product-details.mozilla.org/1.0/firefox_versions.json` and Chrome Version History API — HIGH confidence.** Firefox stable 155.0 (2026-09-01); Chrome stable 153.0.8010.12 (Windows).

**MDN Web Serial API page — HIGH confidence.** Secure-context requirement, transient user activation for `requestPort()`, `Permissions-Policy: serial`, availability in dedicated workers.

**Cloudflare docs (`developers.cloudflare.com`) — HIGH confidence.** Pages landing page callout: *"Workers supports most Pages use cases and offers a broader feature set. It is Cloudflare's primary platform for building applications. Start new projects with Workers."* Static-assets billing page: *"Requests to static assets are free and unlimited."* Platform limits: 20,000 files/version free, 100,000 paid, 25 MiB per file, wrangler ≥ 4.34.0 for the higher count.

**Chromium issue tracker 40939743 / 40543269, Bugzilla 790138 — MEDIUM-HIGH confidence.** WebGL context caps: ~16 per tab in Chrome (8 on Android); Firefox 8 per principal, 16 per browser; exceeding it fires `webglcontextlost` on the least-recently-used context.

**Sibling-repo source read (read-only) — HIGH confidence, primary.** `grid-editor/package.json`, `renderer.vite.config.mjs`, `vite.config.mjs`, `src/renderer/serialport/{serial-transport,serialport,transport,virtual-transport}.ts`, `src/renderer/main/zona/{pad-sim-host,pad-sim,_pad}.ts`, `src/renderer/tests/`, and `profile-cloud/package.json`.

**Draw-call and op-count arithmetic in Decision 2 — MEDIUM confidence.** Derived by counting operations in the shipped `blit()`, `tick()`, `ledTick()` and `render()`, not by profiling. The *relative* conclusion (paint dominates, ticking is free, `strokeRect` is the hot primitive) is solid. The *absolute* card-count thresholds are estimates and must be measured on target hardware before being treated as fact.

---
*Stack research for: static Web Serial hardware playground with many concurrent canvas simulations*
*Researched: 2026-09-02*
