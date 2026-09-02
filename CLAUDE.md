<!-- GSD:project-start source:PROJECT.md -->
## Project

**HANGAR**

A public web playground for Intech Studio's ZONA — the 9x9 XY-pad module. Visitors browse a catalog
of flashy, show-off pad configurations, watch every one of them animate live in a firmware-faithful
simulator in the browser, turn a few real knobs, and load the result straight onto their own ZONA
over Web Serial. No Grid Editor, no install, no account, and no hardware required to look around.

It is the playground half of the ZONA story: BOTOR is where configs get engineered, HANGAR is where
people fall in love with them.

**Core Value:** Plug in a ZONA, open a URL, and half a minute later the pad is doing something spectacular.
If everything else fails, browser-to-hardware install must work.

### Constraints

- **Compatibility**: Web Serial needs HTTPS plus a user gesture and exists in Chromium (Chrome 89+,
  Edge, Opera) and, since 2026-05-19, desktop Firefox 151+ (with its own per-site prompt and an
  enterprise policy that can switch it off). Safari, every iOS browser and Firefox on Android can never
  install. A large share of visitors will still be browse-only, so the catalog and the simulator have
  to carry the site on their own. Detect the capability (`"serial" in navigator && isSecureContext`),
  never the browser.
- **Budget**: 908 characters for Setup and 908 for Timer, comments included (the minifier does not
  strip them). Every knob a visitor turns has to keep the config inside that.
- **Licensing**: `grid-editor` is GPLv3. Porting `_pad.ts` and `pad-sim.ts` into HANGAR makes HANGAR a
  derivative work, so HANGAR ships GPLv3; the corresponding source is served as a per-deploy archive
  from the site itself and the repository stays private (D-02, GPLv3 section 6(d)). Consistent with
  the BOTOR decision, but it is a decision, not an accident.
- **Safety**: the site talks to hardware people paid for. Nothing writes without an explicit click,
  flash writes stay separate from RAM auditions, and the module's original config is always recoverable.
- **Hosting**: static only. Cloudflare is the established host on this machine (zona-docs runs there).
- **Dependency**: `@intechstudio/grid-protocol` is upstream Intech's package and its version tracks
  firmware; HANGAR pins it.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Headline: one finding changes a PROJECT.md assumption
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
## Decision 1 — Framework: SvelteKit + adapter-static
## Decision 2 — Rendering 10-30 live 81-LED grids
### The existing approach scales. The existing `blit()` does not.
- **One shared `requestAnimationFrame`** for the whole page, not one per card. Right: N rAF callbacks is N times the scheduler overhead and N chances to desync.
- **A 10 ms tick accumulator with a `MAX_CATCHUP_MS = 100` clamp.** Right: rAF stops in a backgrounded tab; without the clamp a tab restored after two minutes replays 12,000 ticks in one frame.
- **`RENDER_INTERVAL_MS = 33` decoupling paint from tick.** Right, and it is the single most important lever: engines advance at logical 100 Hz while canvases repaint at ~30 Hz.
- **`IntersectionObserver` gating.** Right, and it is the real answer to "does 30 cards scale": *it is never 30*. In a grid layout 6-12 cards are on screen; the rest are paused with `visible: false` and cost literally zero. Any capacity estimate should be made against on-screen count, not catalog size.
- **The self-cancelling loop** (`if (any) rAF(...) else lastNow = undefined`) plus `sim.animating` freeze detection. Right: a catalog of static instrument layouts settles to zero CPU instead of spinning forever.
- **`prefers-reduced-motion` snapping to tick 64.** Right, and it doubles as a performance escape hatch.
- The observer uses `{ threshold: 0 }` with no `rootMargin`. A card therefore wakes exactly as it crosses the viewport edge, showing a frozen frame for a beat. Use `{ threshold: 0, rootMargin: "200px" }`.
- Nothing throttles by device capability. Consider dropping `RENDER_INTERVAL_MS` to 50 (20 fps) when `navigator.hardwareConcurrency <= 4`.
### Where it will actually break
### The fix, in two changes
### What NOT to use for this, and why
- **DOM elements (81 `<div>` per card): hard no.** 12 visible cards × 81 = 972 elements each taking a style write at 30 fps ≈ 29,000 style mutations/second, each forcing style recalculation and paint over a large subtree. This is the textbook way to kill an animation-heavy page. 30 cards makes it 73,000/s.
- **WebGL / regl, one context per card: hard no, and it fails loudly rather than slowly.** Chrome caps live WebGL contexts at roughly **16 per tab** (8 on Android); Firefox allows **8 per principal, 16 per browser**. Exceeding it fires `webglcontextlost` on the *least recently used* context — i.e. the cards the user just scrolled to. A 10-30 card wall walks straight into this. (A single shared WebGL context rendering all grids into one atlas canvas behind the cards would work and would be genuinely fast, but it requires manual scroll-position syncing between a fixed GL surface and flowed DOM cards. Enormous complexity to solve a problem `putImageData` already solves.)
- **OffscreenCanvas in a worker: not now — keep it as the documented escape hatch.** It is well supported and it is the correct answer *if profiling after fixes A and B still shows main-thread jank*. Reasons to defer: `transferControlToOffscreen()` is one-way and per-canvas, so 30 cards means 30 transfers plus message plumbing; the sim state would have to live in the worker, which puts a thread boundary between the interactive preview's pointer events and the tick-locked, at-most-one-sample-per-tick delivery that makes the preview firmware-faithful. If you do go there later, move **only the thumbnail grid** into one worker holding all card sims and posting `ImageBitmap`s back; leave the interactive preview on the main thread. Confidence that this is never needed: **MEDIUM**.
### The honest ceiling
- Simulation: not the limit at any plausible catalog size.
- Painting with the current `blit`: expect roughly 10-16 concurrently visible animating cards before visible stutter on mid-range hardware. **Unverified estimate — profile it.**
- Painting after fixes A and B: 30+ concurrently visible cards at 30 fps should be comfortable; the limiting factor becomes canvas memory and compositor layer count, not draw calls.
- `IntersectionObserver` means catalog size is essentially unbounded either way. A 200-entry catalog costs the same as a 20-entry one.
## Decision 3 — Web Serial on a static site
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
## Decision 4 — `@intechstudio/grid-protocol`
- zero `require()` of `fs`/`path`/`os`/`crypto`/`child_process`/`stream`/`buffer`
- zero `node:` specifier imports
- only two external imports at the top: `tslib` helpers and `@wasm-fmt/lua_fmt`
- `grid` — namespace with `encode_packet`, `decode_packet_frame`, `decode_packet_classes`, `module_type_from_hwcfg`, `module_architecture_from_hwcfg`, `get_module_element_list`, `get_element_events`, `getProperty`, `module_hwcfgs`, `lua_function_to_human_map`, `lua_function_forbiddens`, `get_lua_function_helper`, `is_element_compatible_with`, `ActionBlock`
- `GridScript` — static class: `compressScript`, `expandScript`, `shortify`, `humanize`, `minifyScript`, `checkSyntax`, `typeCheck`, `splitShortScript`, `splitArrayToString`, `validator`
- `initLuaFormatter()` — `Promise<void>`
- enums/helpers: `ModuleType` (**includes `ZONA`**), `EventType` (includes `SETUP`, `TIMER`, `TOUCH`), `ElementType`, `Architecture`, `CEEAT`, `NumberToEventType`, `EventTypeToNumber`
### The trap: the WASM Lua formatter
- `compressScript` / `minifyScript` / `beautifyLua` **throw** `"Lua formatter not initialized. Call initLuaFormatter() first."`
- `GridScript.checkSyntax` **silently returns `false`** (it try/catches `beautifyLua`). A compiler that validated before init resolved would report every correct config as broken.
### Bundle-size relief: the 628 KB is already lazy
- Do **not** `await padCompilerReady()` in the root layout.
- Do call it when the user first opens a tune panel, and again (idempotent, it caches) before any install.
- Prefetch it opportunistically on `requestIdleCallback` or on hover of a Tune/Install control, so the first knob turn does not stall on a 628 KB download.
### Consuming it in a static Vite build
## Decision 5 — Static hosting
- **Cost is genuinely zero.** Cloudflare's billing docs state plainly: *"Requests to static assets are free and unlimited."* Only Worker script invocations bill. A motion-heavy public playground with no backend never invokes a script, so traffic spikes from a Discord link cost nothing. (Contrast: the 100,000 req/day free-tier limit applies to Worker invocations, not asset serves — so avoid `run_worker_first` unless you actually add a Worker.)
- **HTTPS by default** on `*.workers.dev` and on custom domains. Web Serial's secure-context requirement is satisfied without thought.
- **Limits are irrelevant here**: 20,000 files per version on free (100,000 paid), 25 MiB per file. HANGAR's largest single asset is the 628 KB `lua_fmt_bg.wasm`.
- **You can set response headers.** Matters if you ever want `Permissions-Policy: serial=(self)` or a tight CSP. GitHub Pages cannot do this at all.
- **It is already the established host on this account** (`zona-docs`). One vendor, one `wrangler`, one deploy story, one dashboard.
- **The escape hatch is a config toggle, not a re-platform.** The one thing a purely static build genuinely cannot do is generate an OG preview image for a *tuned* URL (a per-preset OG image can be prerendered at build time by running `PadSim` in Node and encoding a PNG; an arbitrary base36 stamp cannot). If that turns out to matter for the Discord-sharing story, a Worker in front of the same assets renders it on demand — no migration. On GitHub Pages that would mean moving hosts.
| Option | Verdict |
|--------|---------|
| **Cloudflare Pages** | Works fine today, free HTTPS, Git-based CI. But Cloudflare's own docs steer new projects away from it, and it lacks Workers' feature set. Choose only if you specifically want Pages' built-in Git integration and will never need a request-time hook. |
| **GitHub Pages** | Free, HTTPS via Let's Encrypt, and it puts the GPLv3 source and the deployed artifact in one place — a real fit with the "public source" constraint. Costs: no custom response headers, no server-side escape hatch ever, a second vendor alongside `zona-docs`, and a 1 GB site / 100 GB-month soft bandwidth guidance that a viral Discord moment could brush. Acceptable fallback; not the first choice. |
| **Workers + `@cloudflare/vite-plugin`** | Only if you later add real Worker logic. For assets-only, `adapter-static` + a `wrangler.jsonc` `assets` block is simpler and has fewer moving parts. |
## Decision 6 — Testing
### Unit tests: Vitest, node environment
- `grid-editor` runs `vitest ^4.1.0` with `"test": "vitest run"` and **no config file** — Vite's defaults suffice.
- `src/renderer/tests/` is 7,869 lines across 8 suites, including `pad-sim.test.js`, `pad.test.js` and `pad-invariants.test.js` — the suites that pin the firmware-faithful simulator and the fit ladder, and that PROJECT.md says "already caught a real committed bug".
- Those tests are plain `.js` importing `.ts` sources directly, and they run headless in node with `beforeAll(() => padCompilerReady())`. That works because `@wasm-fmt/lua_fmt` has a `"node"` export condition (`lua_fmt_node.js`, `node:fs/promises`).
### Web Serial testing: say it plainly
### The honest alternative: three layers
- the install sequencer (Setup event 0, Timer event 6, RAM-first ordering)
- the store-to-flash path being a genuinely separate command sequence
- snapshot-at-connect and restore
- the frame scanner (the `rxBuffer[i] === 10 && rxBuffer[i-3] === 4` EOT+LF scan from `serialport.ts`) against split-chunk, coalesced-chunk and torn-frame inputs — this is the single most bug-prone piece and it is 100% testable
- module identification as ZONA via `grid.module_type_from_hwcfg`
- timeouts, retries, and the write-lock backoff
- the "never write without an explicit click" invariant, asserted as "zero `write()` calls recorded after a full connect + browse cycle"
### Playwright: worth having, for the other half
- catalog renders, cards are animating (assert canvas pixels change between two samples)
- the base36 stamp round-trips through the URL
- a knob turn recompiles and the cost stays inside 908 characters
- **the degrade path**, forced with `addInitScript(() => { delete navigator.serial })` — the branch a large share of visitors will hit and the one no manual tester will remember to check
- reduced-motion snapping to a static representative frame
## Installation
# Scaffold (SvelteKit + Svelte 5 + TypeScript + Vite)
# Static adapter
# Grid protocol — EXACT pin, no caret (datestamp versioning, not semver).
# Matches grid-editor during the port; bump deliberately afterwards.
# Web Serial typings
# Styling (optional but recommended)
# Browser E2E for the non-serial paths
# Deploy
# Pin the toolchain TypeScript (sv may install 7.x, which kit/svelte-check do not yet accept)
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
## Stack Patterns by Variant
- Move only the thumbnail simulators into a single dedicated worker; `transferControlToOffscreen()` each card canvas; keep the interactive preview on the main thread.
- Because the preview's firmware fidelity depends on tick-locked, at-most-one-sample-per-tick pointer delivery, and a thread boundary would put message-queue latency in the middle of that guarantee.
- Add a Worker script in front of the same static assets that renders the sim frame on demand for `/og/:stamp.png`.
- Because Workers Static Assets already hosts the site; this is a `main` entry plus a route pattern, not a re-platform. Choosing GitHub Pages now forecloses this.
- Add virtualisation to the card grid (or lazy-mount canvases on approach) on top of the existing `IntersectionObserver` gating.
- Because `IntersectionObserver` already stops the *simulation* of offscreen cards, but 200 mounted `<canvas>` elements still consume compositor memory even when idle.
- Drop `RENDER_INTERVAL_MS` to 50 (20 fps) and reduce simultaneously-visible cards via layout when `navigator.hardwareConcurrency <= 4`.
- Because install is impossible on every mobile browser anyway (Android Chrome 138 only exposes Bluetooth RFCOMM ports; iOS has nothing), so mobile is purely a rendering-budget problem.
- The embedder must set `<iframe allow="serial">`, and HANGAR should be served with a permissive `Permissions-Policy: serial=(self "https://embedder.example")`.
- Because Web Serial is Permissions-Policy-gated and defaults to same-origin-only; this is another reason the Worker (which can set headers) beats GitHub Pages (which cannot).
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
| `@tailwindcss/vite@4.3.3` | `vite ^5.2 \|\| ^6 \|\| ^7 \|\| ^8` | Vite 8 in range. |
| `@vitest/coverage-v8@4.1.11` | `vitest 4.1.11` | Exact-version peer. Bump together. |
| `wrangler@4.128.0` | `@cloudflare/workers-types ^5.20260831.1` | Types only needed if you add an actual Worker script. Assets-only deploys need neither. |
## Sources
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
