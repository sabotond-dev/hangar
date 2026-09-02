# Feature Research

**Domain:** Browser-based hardware configuration playground (Web Serial write path + visual preset catalog)
**Researched:** 2026-09-02
**Confidence:** HIGH on comparable behaviour (source code and live product copy read directly); MEDIUM on which features actually move HANGAR's needle (no user research exists yet)

---

## How This Was Researched

Nine real comparables examined, split across the two halves of HANGAR's job.

**Browser-writes-to-hardware:**

| Product | Transport | What it is |
|---|---|---|
| ESP Web Tools / ESPHome Web (`web.esphome.io`) | Web Serial | Reference implementation for browser flashing. Source read directly: `src/install-dialog.ts`, `src/install-button.ts` |
| WLED Web Installer (`install.wled.me`) | Web Serial | Consumer-facing single-purpose flasher for an LED product |
| Adafruit WebSerial ESPTool | Web Serial | Expert-mode flasher, raw offsets, no guardrails |
| VIA (`usevia.app`) | WebHID | Keyboard config, writes live to EEPROM on every edit |
| Vial / Vialite (`vialite.viii.me`) | WebHID | Same domain as VIA, but with an explicit RAM-vs-EEPROM split |
| QMK Configurator (`config.qmk.fm`) | none — produces a file | Config authoring, flashing is a separate desktop app |
| Novation Components | Web MIDI | Slot-based "send to device" for Launchpad/Launchkey custom modes |

**Visual catalogs where the reward is looking at it:**

| Product | What it is |
|---|---|
| Shadertoy | 120k+ shaders, sort/filter/tag browse, preview *is* the artifact running |
| Patchstorage | Cross-platform patch library (ZOIA, Organelle, Norns), tag-chip filtering |
| Profile Cloud (Intech's own) | Grid config browser inside the Editor — read locally from `profile-cloud/src/routes/` |
| WLED effect previews (`photocromax/WLED-live-visualizations`) | Pre-rendered animated previews of every effect, built *because* the device stream isn't always available |
| Excalidraw / TypeScript Playground | The two canonical no-account URL-hash state-sharing implementations |

---

## FLAGGED FINDING (read before anything else)

### Firefox now supports Web Serial. PROJECT.md is out of date.

PROJECT.md's Constraints say *"Web Serial is Chromium-only (Chrome, Edge, Opera) … Firefox, Safari and every iOS browser can never install."* and the Active requirements name Firefox in the honest-degrade list.

**Firefox 151 shipped Web Serial on desktop on 2026-05-19**, developed in collaboration with Adafruit. Confirmed by Mozilla Hacks, Hackster, gHacks and Slashdot, and corroborated by the Adafruit WebSerial ESPTool's own live browser-check string: *"make sure you are running at least Firefox 151 or Chrome 89."* ESP Web Tools' unsupported-browser copy already reads *"Use Mozilla Firefox, Google Chrome or Microsoft Edge."*

Implications HANGAR must absorb:

- The install audience is materially larger than PROJECT.md assumes. Do not hard-code a Chromium check.
- **Feature-detect, never sniff.** `"serial" in navigator && window.isSecureContext` is the correct gate — this is literally what `install-button.ts` does, and it is why ESP Web Tools got Firefox support for free on release day.
- Firefox grants ports **per-site and per-port**, and shows an extra "add-on gating" explanation before the port picker. Firefox's picker chrome differs from Chrome's, so any screenshot-based onboarding will be wrong for half the users. Describe the picker in words, not pictures.
- Firefox has an enterprise policy (`DefaultSerialGuardSetting`) that can disable Web Serial entirely — so "your browser supports it but the port list is empty / blocked" is a real state.
- **Still permanently excluded:** Safari (all platforms), every iOS browser (all are WebKit), Firefox on Android. The browse-only majority argument in PROJECT.md still holds — mobile is browse-only forever. Only the desktop-Firefox slice changes.

This does not change scope, but it changes the copy, the gate, and probably the tone: "install works in most desktop browsers" is a better story than "Chrome only."

---

## Feature Landscape

Complexity is S / M / L (S ≈ under a day, M ≈ a few days, L ≈ a week-plus or genuinely hard).

### Table Stakes (Users Expect These)

Missing any of these and the user either bounces or does not trust HANGAR with hardware they paid for.

#### A. Connect flow

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| A1 | **Single primary `CONNECT` button, disabled-with-reason when unsupported** | Every comparable does exactly this. ESP Web Tools, Adafruit ESPTool and Vialite all use the literal word **"Connect"**. Not "Pair", not "Link", not "Sync". | S | Gate on `"serial" in navigator && window.isSecureContext`. ESP Web Tools splits these two into different messages — do the same. |
| A2 | **Two distinct unsupported messages: no-API vs insecure-context** | These are different problems with different fixes and collapsing them produces an unactionable error. | S | Steal the shape verbatim: no-API → *"Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge."* Insecure → *"You can only install ESP devices on HTTPS websites or on the localhost."* HANGAR's version must name the browsers that *do* work and must not say "Chromium". |
| A3 | **Pre-click explanation of the browser picker** | The site cannot see the device until the click. Users interpret an empty list as "the site is broken". WLED's installer front-loads this with a literal 3-step list: connect device via USB → click Install → **select the correct COM port** → wait ~3 min. | S | One line above the button: what will pop up, that it is the browser asking not HANGAR, and that HANGAR sees nothing until they pick. Depends on nothing. |
| A4 | **Port-in-use error with named culprits and an ordered fix** | This is the single most common Web Serial failure. The raw exception is `NetworkError: Failed to execute 'open' on 'SerialPort': Failed to open serial port.` — meaningless to a musician. | S | ESP Web Tools rewrites it to: *"Serial port is not readable/writable. Close any other application using it and try again."* Good, but generic. HANGAR knows the culprit: **Grid Editor**. Name it. Also name the recovery order that actually works: quit the other app → unplug → wait 5s → replug → reload the page → click Connect. Espressif's canonical five causes are: another program owns the port, the port no longer exists, the device disconnected, driver missing/faulty, no permission. |
| A5 | **User-cancelled-the-picker recovery** | `requestPort()` rejects when the user hits Cancel or picks nothing. Silence here reads as a crash. ESP Web Tools explicitly shows a guidance dialog when no port is returned. | S | Distinguish "you cancelled" from "nothing was listed". The second needs the driver/cable branch. |
| A6 | **Bad-cable and driver hint on empty picker** | WLED's installer puts this on the front page unprompted: *"You might be missing the drivers for your board"* with CP2102/CH34x links, and *"Make sure your USB cable supports data transfer."* Charge-only USB-C cables are an enormous share of real support load. | S | ZONA is native USB on the Grid MCU, so driver advice differs — but the charge-only-cable line is universal and must be there. |
| A7 | **Persistent connection indicator with a click-through** | Novation Components puts a connection icon top-right and *"you can click the Connection icon to find out more information."* Users need to answer "is it still connected?" without re-running the ritual. | S | Show module type + firmware version once identified, so "connected" means "connected **to a ZONA**", not "a port is open". |
| A8 | **Silent reconnect for returning visitors** | Chrome and Firefox both persist the grant. `navigator.serial.getPorts()` returns ports the site was previously granted. Making a returning user re-pick from a picker every visit is friction with no security benefit. | M | Also wire `connect` / `disconnect` events so unplugging updates the UI instead of failing on the next write. Requires A1. |
| A9 | **Wrong-module refusal** | Writing ZONA Lua to a PBF4 is the worst possible outcome. Identify via `@intechstudio/grid-protocol` after opening, and refuse politely. | S | VID/PID filters in `requestPort` narrow the picker but do not guarantee a ZONA — Grid modules share a VID. Filter *and* verify. |

#### B. Non-destructive install — the trust core

The comparables split cleanly into two camps, and the split maps exactly onto HANGAR's stated safety constraint.

**Camp 1 — write immediately, no undo.** VIA: every keymap edit is written straight to the keyboard's EEPROM, no save button, no snapshot, no revert. Novation Components: `Send to` → choose slot → **`Overwrite Custom Mode`** — an explicit destination and an explicitly destructive verb, but no restore. WLED's installer: presents "Install" as a plain action with **no warning at all** about existing settings being lost. This camp works only because the prior state was cheap or the user chose the slot.

**Camp 2 — audition then commit.** Vialite's RGB pane: *"Changes are RAM-only until saved to EEPROM."* ESP Web Tools makes erasure a **separate, opt-in, confirmed step**: the `ASK_ERASE` state, a checkbox labelled **"Erase device"**, and a manifest flag `new_install_prompt_erase` that defaults to **false**.

HANGAR is unambiguously Camp 2, and this is where it can beat every comparable — because **not one of them snapshots and restores the prior state.**

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| B1 | **Nothing is written until an explicit click** | ESP Web Tools' entire dialog machine (`ERROR / DASHBOARD / PROVISION / INSTALL / ASK_ERASE / LOGS`) exists so no byte moves without a confirmation state. Auto-applying on connect would be a betrayal. | S | Also say it out loud on the connect screen, per PROJECT.md's "make it obvious that opening HANGAR never writes anything by itself". |
| B2 | **RAM audition as the default action, flash as a separate one** | Vialite's exact model. The two actions must not sit adjacent as equal-weight buttons. | M | Requires A1, A9. See "Verb choice" below. |
| B3 | **Snapshot-on-connect + one-click restore** | PROJECT.md calls it "Put back". **No comparable does this** — VIA, Novation and WLED all destroy prior state silently. This is table stakes *for HANGAR specifically* because the module belongs to the user and HANGAR is a stranger's website. | M | Read both events off the touch element at connect, hold in memory, offer `RESTORE ORIGINAL`. Requires A1. Interacts with B7. |
| B4 | **Snapshot durability warning** | An in-memory snapshot dies on tab close, and the user will not predict that. | S | Either persist to `localStorage` keyed by module serial, or state plainly that the snapshot lives until the tab closes and offer a download. Persisting is better and is still static-site-compatible. |
| B5 | **Explicit "this is now permanent" confirmation on flash** | ESP Web Tools' `ASK_ERASE` precedent: destructive step gets its own screen, its own checkbox, and its own sentence. | S | Name what is being replaced: *"This replaces the Setup and Timer scripts on your ZONA's touch element and survives a power cycle."* Requires B2, B3. |
| B6 | **Progress + "don't navigate away" during write** | ESP Web Tools: *"Preparing installation" → "Erasing" → "Wrapping up"*, plus *"This will take a minute"* and *"Keep this page visible for fastest installation."* WLED promises "less than 3 minutes" up front. | S | HANGAR's write is two 908-char strings — near-instant. That is an *advantage worth stating*: "takes about a second." A progress bar for a 200 ms operation is theatre; a settled-state confirmation is not. |
| B7 | **Page-change / VM-reset warning** | ZONA hard fact: a page change destroys the whole Lua VM. If the user changes page on the module after an audition, the audition evaporates and they will think HANGAR failed. | S | Detect page-change events over the protocol if available; otherwise warn in the audition state. Requires B2. |

**Verb choice — synthesised from the comparables.** "Flash" and "burn" belong to firmware and both imply irreversibility and brick risk; PROJECT.md explicitly puts firmware/DFU out of scope, so borrowing firmware vocabulary actively misleads. "Install" is what ESP Web Tools and WLED use and it reads permanent. "Save" is what Vialite uses for the EEPROM step and it reads permanent-but-safe. "Overwrite" is Novation's, and it is the honest word for the destructive step.

Recommended pairing:

- Temporary RAM write → **`TRY ON DEVICE`** (or `AUDITION` if the identity can carry it). Never "install", never "flash".
- Permanent flash write → **`KEEP ON DEVICE`** or **`STORE TO MODULE`**. Explicitly *not* "flash" and *not* "burn".
- Revert → **`PUT BACK`** — PROJECT.md's own phrase, and better than "restore" because it names the outcome rather than the mechanism.

#### C. Preview

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| C1 | **Every card animating, with no hardware attached** | Shadertoy's whole trust model is that the preview *is* the artifact executing. The WLED community built `photocromax/WLED-live-visualizations` — pre-rendered animated previews of every effect mode — precisely because the device's own live stream (`/liveview`, WebSocket `{"lv":true}`) is often unavailable, and **serves only one client at a time**. HANGAR has the harder version of the same problem: the ZONA's LED mirror was measured at 3.3 Hz. | L | Already scoped: port `pad-sim.ts`. This is the single highest-leverage feature in the product. |
| C2 | **Preview runs the same compiled config that gets installed** | This is what makes preview *trust* rather than *marketing*. Profile Cloud only ships a static `ConfigThumbnail.svelte` — a still image — which is exactly the weak version. | M | The claim "what you see is what gets written" must be literally true: the simulator consumes the compiler output, not a hand-authored animation. Requires C1 and the `_pad.ts` port. |
| C3 | **State the fidelity honestly** | Trust is destroyed by an over-promise more than by a caveat. `pad-sim.ts` is firmware-faithful (integer weight tables summing 254, single `/512` after layer sum, verbatim 256-entry sine LUT, freeze-on-expiry tick order) and is pinned by tests that already caught a real committed bug. That is a *credential* — publish it. | S | One line near the preview: what the simulator matches exactly, and what it cannot show (physical LED colour, diffusion, touch feel). |
| C4 | **Focused card takes mouse-as-finger** | Static motion shows the animation; interaction shows the *instrument*. Rive's differentiator over Lottie is exactly this: animations respond to clicks and hovers rather than replaying a fixed timeline. | M | Already in PROJECT.md. One focused card only — see D5. |
| C5 | **Offscreen previews paused; `prefers-reduced-motion` honoured** | Eighty simultaneously animating 81-cell grids is a laptop-fan generator. Standard 2026 practice: `IntersectionObserver` (threshold ~0.01) to cancel `requestAnimationFrame` offscreen and resume on re-entry; `matchMedia('(prefers-reduced-motion: reduce)')` to fall back to a still frame or a play-on-hover. | M | Non-negotiable given PROJECT.md's "motion-forward … rack of running machines". Requires C1. Animate `transform`/`opacity` only. |

#### D. Browsing the catalog

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| D1 | **Deep link to a single config** | Shadertoy: `/view/XXXXXX`. Without it nothing is shareable and nothing is linkable from Discord. | S | Prerequisite for all of section E. |
| D2 | **Free-text search** | Profile Cloud's own search box already trains Grid users to expect one, with token suggestions drawn from module types (`BU16`, `EF44`, `EN16`, `PBF4`, `PO16`, `TEK2`, `VSN1L/R`, `VSN2`), element types (`Button`, `Encoder`, `Potmeter`, `Fader`, `System`, `Endless`) and a `$`-prefixed special search over action-block names. | S | HANGAR's vocabulary is smaller — one module, one element. Search over name, tags and description. Do **not** port the `$` syntax; that is power-user surface for a playground. |
| D3 | **Tag chips that filter on click and are individually removable** | Patchstorage's exact pattern: click a tag anywhere to add it to a filter list in the toolbar, click it again or hit `[x]` to remove. Cheap, discoverable, no dropdown chrome. | S | Tag vocabulary should be about *feel* — `ambient`, `reactive`, `geometric`, `fast`, `minimal`, `chaotic`, `midi` — not about implementation. |
| D4 | **Sort control** | Shadertoy: Popular / Newest / Love / Hot. Profile Cloud: Name / Date / Type with an ASC↔DESC toggle button. Users expect a way to reorder. | S | With no accounts there are no like counts, so HANGAR's honest axes are **Featured / Newest / Name / Complexity**. Do not fake popularity. |
| D5 | **Focus / detail view for one config** | Every catalog has one. It is also the performance escape valve: only the focused card gets interaction and full framerate. | M | Requires D1, C4. Deep link lands here. |
| D6 | **Filters that map to real constraints** | Shadertoy's filters are capability-based (Multipass, Sound, VR, Microphone, Webcam) — they answer "will this work for me". | S | HANGAR's equivalents: *needs MIDI destination*, *uses touch input*, *animation only*, *fits at max brightness*. That last one is honest and useful given the 941/908 fit-ladder debt. |
| D7 | **Curated shelves, not one undifferentiated grid** | Profile Cloud already segments into three shelves — *my configurations*, *recommended*, *community* — explicitly so the important set stays at the top regardless of name or date. Shadertoy has a slideshow view for the same purpose. | S | HANGAR launches with nine ported BOTOR presets. A single flat grid of nine is fine; the shelf structure matters the moment the catalog grows. Build the shelf primitive at v1, populate it later. |

#### E. Sharing without accounts

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| E1 | **Tuned state encoded in the URL hash** | The two canonical implementations: Excalidraw puts state after `#` (`#json={id},{key}`) explicitly because **the hash is never sent to the server**; the TypeScript Playground uses `#code/` with `lz-string`'s `compressToEncodedURIComponent`. Both work on pure static hosting. | M | HANGAR already has the base36 stamp from `_pad.ts` — use it. Put it in the **hash**, not the query string: it keeps the state off Cloudflare's logs and out of any analytics, and it is the pattern users' tooling already handles. |
| E2 | **Explicit `COPY LINK` with a confirmation** | Users do not reliably copy from the address bar, and on a hash-based app the address bar may not visibly update. | S | Requires E1. Confirm with a state change on the button itself, not a toast that vanishes. |
| E3 | **Version the stamp and fail gracefully on old links** | A Discord link is permanent; the compiler is not. An unversioned share format guarantees a future silent-corruption incident. | S | The stamp is already versioned. Surface it: an unreadable stamp must say *"this link was made with an older version of HANGAR"* and land on the base config, never on a broken or subtly-wrong one. |
| E4 | **Link preview metadata (OG image + title)** | The share target is Discord. A HANGAR link that unfurls as a bare URL wastes the single best distribution channel this product has. | M | Static-site-compatible: pre-render one OG image per catalog config at build time. Per-tuning OG images would need a server — out of scope, and the per-config image is 90% of the value. |
| E5 | **URL is the state, bidirectionally** | Turning a knob should update the URL; loading a URL should restore the knobs. Half-implemented URL state is worse than none. | M | Requires E1. Use `replaceState` on knob drags so the back button does not fill with every intermediate value. |

#### F. Parameter tuning and the 908-character budget

The budget is HANGAR's most unusual UX problem and has **no direct comparable** — none of the config tools examined expose a hard capacity limit in the tuning UI. The nearest analogues come from embedded toolchains, where the limit surfaces *at build time*, after the user has already committed effort:

- Arduino IDE: `Sketch uses 1299853 bytes (99%) of program storage space. Maximum is 1310720 bytes.` — a live percentage against a named maximum, printed on every compile whether or not it fits.
- QMK: firmware-too-large is a **build failure**. The remedies (link-time optimisation, disabling features) are all things the user must go and do elsewhere. This is the failure mode to avoid.

The lesson: **surface the budget continuously, before the failure, in the same place as the knobs — never as an error at write time.**

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| F1 | **3–6 knobs per config, no more** | PROJECT.md's own line: colour, speed, layout, brightness, MIDI destination. QMK Configurator's full key-matrix surface is exactly the complexity HANGAR is defined against. | M | Knob *set* varies per config; the *widget vocabulary* must not. Requires the `_pad.ts` port. |
| F2 | **Recompile + re-simulate live on every knob change** | If the preview lags the knob the tuning loop dies. Shadertoy's edit-and-see-it is the standard. | M | Requires C1, C2, F1. Debounce the recompile, not the preview. |
| F3 | **Live dual budget meters — Setup and Timer, separately** | Two independent 908-char budgets. One combined meter would be a lie: 900/908 Setup and 400/908 Timer is fine, and a merged bar would hide that. | S | Show `chars / 908` with a percentage, mirroring the Arduino wording. Two thin bars beside the knobs. Requires F2. |
| F4 | **The fit ladder degrades visibly, not silently** | `_pad.ts` already has a fit ladder. If it silently drops a feature to fit, the preview diverges from the user's mental model and the *simulator's* credibility takes the hit for the *compiler's* decision. | M | State it in one line: *"trimmed the trail length to fit."* This converts an invisible compromise into a visible, trustworthy one. Requires F3. |
| F5 | **Over-budget is a blocked state, not a failed write** | The worst measured BOTOR stack is 941/908 at full brightness — known pre-existing debt, and a combination a user *will* hit. | S | Disable `TRY ON DEVICE`, turn the offending meter red, name the knob that pushed it over and offer a one-click "back off brightness" fix. Never let the click reach the wire and fail there. Requires F3, F4. |
| F6 | **Reset-to-default per knob and for the whole config** | Users tune themselves into a corner. Without a reset they reload the page and lose everything. | S | Double-click a knob to reset; a `RESET` control on the config. Requires F1. |

#### G. Honest degrade

| # | Feature | Why Expected | Cx | Notes |
|---|---|---|---|---|
| G1 | **Full catalog and full simulation on every browser** | Vialite frames this exactly right: Safari and Firefox *"can open this page but can't connect to a keyboard."* The site is not broken, one capability is absent. VIA by contrast just tells you your browser is wrong. | S | The whole site must work on iOS Safari except the write. |
| G2 | **Install controls present-but-disabled, with the reason inline** | Hiding the button makes the feature undiscoverable and makes the user think HANGAR does not do the thing. Showing it disabled with a reason teaches them what to do next. | S | ESP Web Tools exposes this as a first-class API — `<span slot="unsupported">` — i.e. it treats the unsupported message as a designed surface, not an afterthought. Requires A2. |
| G3 | **No fake fallback path** | QMK Configurator's answer is "download a `.hex`, then get QMK Toolbox". VIA's is "download the desktop app". Both punt to an install, which is precisely the friction PROJECT.md exists to remove. | S | On an unsupported browser HANGAR should offer **`COPY LINK`** — "open this on a desktop browser" — not a download. Requires E2. |

---

### Differentiators (Competitive Advantage)

| # | Feature | Value Proposition | Cx | Notes |
|---|---|---|---|---|
| X1 | **Snapshot + `PUT BACK`** | Genuinely unique among the nine comparables. VIA writes to EEPROM with no undo; Novation says `Overwrite Custom Mode`; WLED's installer does not even mention that settings are lost. HANGAR being the one that hands the module back unchanged is a *reputation* feature, not a checkbox. | M | Same work as B3 — it is table stakes *for HANGAR* and a differentiator *versus the market*. |
| X2 | **A catalog that is alive with no hardware attached** | Shadertoy's magic is that the browse page is already the product. Profile Cloud ships static thumbnails; Patchstorage ships text and a download link. A wall of 81-cell grids all running the real compiled config has no equivalent in the hardware-preset world. | L | Same work as C1. This is the reason to open the URL. |
| X3 | **Zero-to-spectacle in under a minute** | PROJECT.md's core value. ESP Web Tools budgets "a minute" and WLED "less than 3 minutes" — both for firmware. HANGAR writes 1.8 kB of Lua. **Say the number.** "About a second" is a differentiating claim in this category. | S | Requires B2, B6. |
| X4 | **The tuned config, not just the config, travels through a link** | Shadertoy shares the shader; Patchstorage shares a file; QMK shares a JSON download. Sharing a *personalised* artifact as a plain URL that anyone can open, watch animate, and push to their own hardware is a materially better loop than any of them. | M | Requires E1, E5. The Discord loop is the growth mechanism. |
| X5 | **Budget as a visible instrument, not an error** | Every embedded toolchain examined reveals the limit at build/flash time. Making 908 chars a live gauge next to the knobs reframes a constraint as a *game*. Fits the "playground" identity. | M | Requires F3, F4. Consider showing the generated Lua on demand — Shadertoy's code pane is a large part of why people trust and learn from it. |
| X6 | **"Compare with what's on your module"** | Snapshot the module's existing config, then simulate *it* side by side with the candidate. Turns the abstract risk of overwriting into a visible before/after. | M | Requires B3 and C1. Only works if the existing config is ZONA-pad-compatible — degrade to "unknown config, we'll put it back exactly" otherwise. |
| X7 | **Deterministic named links (`/c/starfield#stamp`)** | Human-readable and typeable, unlike Shadertoy's `/view/ssjyWc`. Cheap because the catalog is static and small. | S | Requires D1. |
| X8 | **Randomise / "surprise me"** | Cheap, on-brand for a playground, and the single best answer to "I don't know what any of these words mean." Shadertoy's slideshow view serves the same appetite. | S | Requires F1. Must respect F5 — never randomise into an over-budget state. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| # | Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|---|
| N1 | **Accounts / cloud library / community uploads** | "Let people share their own." It is what Shadertoy, Patchstorage and Profile Cloud all do, so it looks like table stakes. | PROJECT.md rules it out and the research **supports the ruling**. Every catalog with uploads carries moderation, spam, storage cost and abuse surface. Worse: user-uploaded Lua is *arbitrary code executed on someone else's hardware from a stranger's website* — a categorically different trust proposition from Shadertoy's sandboxed GPU shaders. | URL-encoded sharing (E1–E5). If curation is later needed, accept configs by PR into the static catalog — Patchstorage-quality browsing with zero backend. |
| N2 | **Full layer/zone authoring in the browser** | The knobs will make people want more knobs. | PROJECT.md's boundary, and QMK Configurator is the cautionary tale: full authoring means a full key-matrix UI, a compile step, a download, and a *separate desktop app* to flash. That entire chain is the friction HANGAR exists to delete. | Tune named configs (F1). Link out to BOTOR / Grid Editor for authoring. |
| N3 | **Firmware update / bootloader / DFU** | "You're already talking to it over serial." ESP Web Tools, WLED and Adafruit ESPTool all do exactly this. | PROJECT.md: HANGAR must never be able to brick a module. It also drags in chip detection, manifests, erase flows, recovery documentation and a support burden. The comparables carry this cost because firmware *is* their product. | Write only two Lua event strings on one element. Never touch flash outside that. Say so on the page — it is a trust asset. |
| N4 | **Streaming the real ZONA's LEDs to the browser as the preview** | It is the most obviously "honest" preview and WLED does it (`/liveview`, WebSocket `{"lv":true}`). | Measured at **3.3 Hz** on ZONA. It would make a spectacular config look broken. Note WLED's own stream also serves only one client at a time — even where it works it is fragile. | The `pad-sim` simulator (C1–C3), with its fidelity credentials published. |
| N5 | **Auto-apply the config on connect ("instant demo")** | Removes a click from the hero flow. | Violates the "nothing writes without an explicit click" constraint and reproduces VIA's model, where connecting means committing. Reads as a website taking over your hardware. | Connect and audition are two clicks. Make the second one enormous and obviously safe. |
| N6 | **A single "Install" button that does RAM and flash together** | Simpler; matches ESP Web Tools and WLED. | Collapses the audition/commit distinction that is HANGAR's entire safety story. Vialite's explicit *"RAM-only until saved to EEPROM"* is the model that fits. | `TRY ON DEVICE` primary, `KEEP ON DEVICE` secondary, `PUT BACK` always available (B2, B3). |
| N7 | **Browser sniffing for the install gate** | "Web Serial is Chromium-only" — which was true until 2026-05-19. | Firefox 151 broke this assumption. Any UA check written today is wrong for a growing share of users, and will be wrong again. | Feature-detect: `"serial" in navigator && window.isSecureContext`. |
| N8 | **A raw log / serial console pane** | ESP Web Tools has `LOGS` with Download Logs; Adafruit ESPTool has a full console with Autoscroll and Clear Text. | Those are debugging tools for people flashing arbitrary firmware. For a playground it converts a delightful surface into an intimidating one, and PROJECT.md's visual identity has no room for a terminal. | Plain-language errors (A4). A hidden diagnostics panel behind a query flag if support ever needs it. |
| N9 | **Like counts / view counts / trending** | Shadertoy's browse page is built on them. | Requires a backend (N1). Fake or client-side counts are worse than none and corrode the honesty the rest of the product depends on. | Editorially curated `Featured` shelf (D7) + `Newest` + `Name` (D4). |
| N10 | **QR codes for cross-device handoff** | Standard for provisioning flows; feels like an obvious "no accounts" companion to E1. | Install requires USB, which requires a desktop. A QR sends a tuned config to a **phone**, which is the one device that can never install it. It sells the destination that cannot deliver. | `COPY LINK` (E2). If a QR appears at all, it should point *from* a phone *to* "open this on your computer" — the reverse direction — and even that is v2. |
| N11 | **Onboarding screenshots of the browser's port picker** | Users get lost in the native dialog and screenshots seem to help. | Chrome's and Firefox's pickers look different, Firefox adds its own gating explanation, and both change across versions. Screenshots go stale invisibly and then actively mislead. | Describe it in words (A3), name the recovery steps (A4). |
| N12 | **"Erase device" / factory reset** | ESP Web Tools has both `Erase device` and `Erase User Data` / `Reset Device`. | HANGAR should not own a button whose only function is to destroy the user's work. It is the opposite of `PUT BACK`. | Restore-to-snapshot only (B3). Anything more belongs in Grid Editor. |

---

## Feature Dependencies

```
[A1 Connect button]
    └──requires──> [A2 Unsupported gating]  (feature-detect, not UA — see N7)

[A8 Silent reconnect] ──requires──> [A1]
[A9 Wrong-module refusal] ──requires──> [A1]

[B2 RAM audition / flash split]
    └──requires──> [A1] + [A9]
[B3 Snapshot + PUT BACK]
    └──requires──> [A1]
    └──enables───> [X1 differentiator] + [X6 before/after compare]
[B4 Snapshot durability] ──requires──> [B3]
[B5 Permanence confirmation] ──requires──> [B2] + [B3]
[B7 Page-change VM warning] ──requires──> [B2]

[C1 Live simulator on every card]        <-- FOUNDATION, no hardware dependency
    ├──requires──> pad-sim.ts port
    ├──enables───> [C2 same-config guarantee] ──requires──> _pad.ts compiler port
    ├──enables───> [C4 mouse-as-finger] ──requires──> [D5 focus view]
    ├──enables───> [C5 offscreen pause / reduced-motion]
    ├──enables───> [F2 live recompile]
    └──enables───> [X2] + [X6]

[D1 Deep link] ──enables──> [D5 Focus view] ──enables──> [C4]
[D2 Search] [D3 Tag chips] [D4 Sort] [D6 Filters] ──all require──> catalog schema
[D7 Curated shelves] ──requires──> catalog schema + editorial "featured" flag

[F1 Knobs] ──requires──> _pad.ts compiler port
[F2 Live recompile] ──requires──> [F1] + [C1] + [C2]
[F3 Dual budget meters] ──requires──> [F2] + cost function from _pad.ts
[F4 Visible fit-ladder degradation] ──requires──> [F3]
[F5 Over-budget blocked state] ──requires──> [F3] + [F4] + blocks [B2]
[F6 Reset knobs] ──requires──> [F1]

[E1 URL hash state] ──requires──> [F1] + base36 stamp
    ├──requires──> [D1]
    ├──enables───> [E2 Copy link] ──enables──> [G3 no-fake-fallback]
    ├──enables───> [E5 bidirectional URL]
    └──enables───> [X4 tuned config travels]
[E3 Stamp versioning] ──requires──> [E1]
[E4 OG metadata] ──requires──> [D1]

[G1 Full browse everywhere] ──conflicts──> any UA-sniffing gate (N7)
[N5 Auto-apply on connect] ──conflicts──> [B1 nothing writes by itself]
[N6 Single Install button] ──conflicts──> [B2 audition/commit split]
[N4 Device LED streaming] ──conflicts──> [C1] (3.3 Hz makes it worse, not better)
```

### Dependency Notes

- **C1 is the true foundation and has no hardware dependency at all.** The simulator, the catalog and the knobs form a complete, shippable, valuable product with the Web Serial path stubbed out. Every install feature (A, B) depends only on A1. These are two nearly-independent tracks and can be phased separately — which is fortunate, because C1/`pad-sim` is the largest single piece of work.
- **F5 blocks B2 by design.** The over-budget state must gate the install button, meaning the budget system and the install system must agree on a single "can this be written" predicate. Build that predicate once; do not let the button and the meter compute fitness independently.
- **B3 (snapshot) must be wired at connect time, not at install time.** If it is deferred to the install path, the first audition destroys the state it was supposed to preserve. This is the ordering bug most likely to be introduced.
- **E1 depends on F1 but D1 does not.** Deep links to catalog entries can ship before tuning exists; that is the cheap half of sharing and it unlocks E4 (OG images) immediately.
- **C2 is the trust hinge.** If the simulator ever renders something other than the exact compiler output, C3's honesty claim collapses and with it the case for the whole preview strategy. Enforce it structurally: one code path from parameters → Lua → simulator, and the same Lua goes to the wire.
- **G2 depends on A2 but must be designed, not bolted on.** ESP Web Tools treats the unsupported message as a first-class slot in its public API. Treat HANGAR's the same way — one component, one message source, used identically everywhere install is offered.

---

## MVP Definition

### Launch With (v1)

The bar: a stranger with a ZONA opens a link from Discord and is delighted within a minute, and a stranger without a ZONA still enjoys the site.

**Catalog & preview track** (ships standalone, no hardware needed)
- [ ] C1 — Live `pad-sim` preview on every card. Without this there is no reason to open the URL.
- [ ] C2 — Preview runs the actual compiled config. The trust claim.
- [ ] C5 — Offscreen pause + `prefers-reduced-motion`. Nine grids is survivable; the practice must exist before the catalog grows.
- [ ] D1 — Deep link per config. Prerequisite for all sharing.
- [ ] D5 — Focus / detail view.
- [ ] C4 — Mouse-as-finger on the focused card.
- [ ] D4 — Sort (Featured / Newest / Name).

**Tuning track**
- [ ] F1 — 3–6 knobs per config.
- [ ] F2 — Live recompile + re-simulate.
- [ ] F3 — Dual 908-char budget meters. Non-optional: the constraint is real and will be hit.
- [ ] F5 — Over-budget blocks install with a named cause.
- [ ] F6 — Reset knobs.

**Install track**
- [ ] A1, A2, A3 — Connect button, correct feature-detected gating, pre-click explanation.
- [ ] A4 — Port-in-use error naming Grid Editor and giving the ordered fix.
- [ ] A5 — Cancelled-picker recovery.
- [ ] A9 — Wrong-module refusal.
- [ ] B1 — Nothing writes without a click, said out loud.
- [ ] B2 — `TRY ON DEVICE` (RAM) separate from `KEEP ON DEVICE` (flash).
- [ ] B3 — Snapshot at connect + `PUT BACK`.
- [ ] B5 — Permanence confirmation on the flash step.
- [ ] G1, G2 — Full browse everywhere, install disabled-with-reason.

**Sharing track**
- [ ] E1, E2 — URL-hash stamp + `COPY LINK`.
- [ ] E3 — Versioned stamp with graceful failure.

### Add After Validation (v1.x)

- [ ] A6 — Cable/driver hints. *Trigger:* first "nothing showed up in the picker" report.
- [ ] A7 — Connection indicator with click-through detail. *Trigger:* the connect state stops being momentary, i.e. once people tune while connected.
- [ ] A8 — Silent reconnect via `getPorts()`. *Trigger:* evidence of repeat visitors.
- [ ] B4 — Durable snapshot in `localStorage`. *Trigger:* first "I closed the tab and lost my config" report. Ship the honest warning at v1 instead.
- [ ] B7 — Page-change VM-reset warning. *Trigger:* first "the audition disappeared" report.
- [ ] D2, D3, D6 — Search, tag chips, capability filters. *Trigger:* catalog exceeds ~20 entries. Nine entries need none of this.
- [ ] D7 — Curated shelves. *Trigger:* same.
- [ ] E4 — OG images per config. *Trigger:* as soon as anyone shares a link — arguably pull this into v1, it is build-time work and the share loop is the growth mechanism.
- [ ] E5 — Fully bidirectional URL state (knob drag → `replaceState`). *Trigger:* v1 can ship with copy-link-on-demand.
- [ ] F4 — Named fit-ladder degradation. *Trigger:* v1 can ship with "trimmed to fit" generic; naming the trim needs compiler introspection.
- [ ] X8 — Randomise. *Trigger:* whenever there is a spare afternoon; disproportionately fun per unit of work.
- [ ] G3 — `COPY LINK` as the unsupported-browser fallback. *Trigger:* v1 can ship with just the explanation.

### Future Consideration (v2+)

- [ ] X6 — Before/after compare against the module's existing config. *Defer:* needs reverse-parsing an arbitrary existing config into simulator parameters, which may be impossible for non-HANGAR configs.
- [ ] X5 (extended) — Show the generated Lua. *Defer:* delightful for the technical minority, and it invites "let me edit it", which is N2.
- [ ] X7 — Named deterministic slugs. *Defer:* only matters once links get spoken aloud.
- [ ] Community submission by PR into the static catalog. *Defer:* the honest, backend-free answer to N1, but it needs a review process that does not exist yet.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---|---|---|---|
| C1 Live simulator on every card | HIGH | HIGH | P1 |
| C2 Preview == installed config | HIGH | MEDIUM | P1 |
| B3 Snapshot + `PUT BACK` | HIGH | MEDIUM | P1 |
| B2 RAM audition vs flash split | HIGH | MEDIUM | P1 |
| A1–A5 Connect ritual + real error copy | HIGH | LOW | P1 |
| F3/F5 Budget meters + blocked state | HIGH | LOW | P1 |
| E1/E2 URL-hash share + copy link | HIGH | MEDIUM | P1 |
| F1/F2 Knobs + live recompile | HIGH | MEDIUM | P1 |
| G1/G2 Honest degrade | HIGH | LOW | P1 |
| C5 Offscreen pause / reduced motion | MEDIUM | MEDIUM | P1 |
| A9 Wrong-module refusal | HIGH | LOW | P1 |
| E4 OG link previews | HIGH | MEDIUM | P1/P2 |
| D1/D5 Deep link + focus view | HIGH | MEDIUM | P1 |
| C4 Mouse-as-finger | MEDIUM | MEDIUM | P1 |
| A8 Silent reconnect | MEDIUM | MEDIUM | P2 |
| B4 Durable snapshot | MEDIUM | LOW | P2 |
| A6/A7 Cable hints, connection indicator | MEDIUM | LOW | P2 |
| D2/D3/D4/D6 Search, tags, sort, filters | MEDIUM | LOW | P2 |
| F4 Named fit-ladder degradation | MEDIUM | MEDIUM | P2 |
| X8 Randomise | MEDIUM | LOW | P2 |
| D7 Curated shelves | LOW (at 9 configs) | LOW | P2 |
| X6 Before/after compare | MEDIUM | HIGH | P3 |
| X7 Named slugs | LOW | LOW | P3 |
| Show generated Lua | LOW | LOW | P3 |

---

## Competitor Feature Analysis

| Feature | ESP Web Tools / WLED | VIA / Vialite | Novation Components | Shadertoy / Patchstorage | HANGAR's approach |
|---|---|---|---|---|---|
| **Connect ritual** | "Connect" button → native picker. WLED pre-lists 3 steps and warns about drivers and charge-only cables. | Vialite: "click Connect, and pick your keyboard from the browser's device chooser". | Browser MIDI permission on page load; status icon top-right, clickable. | n/a — no hardware. | One `CONNECT`. Explain the picker in words before the click. Identify as ZONA, show module + firmware in a persistent indicator. |
| **Unsupported browser** | *"Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge."* Separate insecure-context message. WLED: *"Sorry, your browser is not yet supported! Please try on Desktop Chrome or Edge."* | VIA: *"we only support browsers that have WebHID enabled"* → download the desktop app. Vialite is kinder: Safari/Firefox *"can open this page but can't connect to a keyboard."* | Needs Web MIDI (Chrome/Opera/Edge). | n/a. | Vialite's framing. Everything works except the write; the write button stays visible, disabled, with the reason inline. Feature-detect only (Firefox 151 now qualifies). |
| **Port held by another app** | *"Serial port is not readable/writable. Close any other application using it and try again."* Community docs name culprits: Arduino Serial Monitor, PlatformIO, M5Burner, qFlipper, other flasher tabs. | n/a (HID). | n/a (MIDI, but the same class of exclusive-access problem). | n/a. | Name **Grid Editor** explicitly. Give the ordered recovery: quit it → unplug → 5s → replug → reload → Connect. |
| **Protecting existing state** | ESP Web Tools: separate `ASK_ERASE` state, opt-in "Erase device" checkbox, `new_install_prompt_erase` defaults false. WLED installer: **no warning at all**. | VIA: writes to EEPROM instantly, no save, no undo, no snapshot. Vialite: *"Changes are RAM-only until saved to EEPROM."* | *"Send to"* → choose slot → *"Overwrite Custom Mode"* — destination and destruction both explicit, but no restore. | n/a. | **Beat all of them.** Snapshot at connect, `PUT BACK` always available, and say on the landing page that opening HANGAR writes nothing. |
| **Temporary vs permanent** | Not distinguished — install is install. | The one comparable that distinguishes it (Vialite RGB pane). | Not distinguished — send is overwrite. | n/a. | `TRY ON DEVICE` (RAM) → `KEEP ON DEVICE` (flash) → `PUT BACK`. Never "flash", never "burn" — those belong to firmware, which is out of scope. |
| **Preview before commit** | None. You flash and find out. WLED's *device* has `/liveview` Peek — but only after install, and only one client at a time. Community built pre-rendered GIF previews to fill the gap. | Keymap preview is a static key legend. | Static grid rendering of the custom mode. | Shadertoy: the preview **is** the shader executing on your GPU. Patchstorage: text + screenshots. | Shadertoy's model applied to hardware: the firmware-faithful simulator runs the real compiled config, before connecting and before writing. |
| **Catalog browse** | n/a. | n/a. | n/a. | Shadertoy: sort Popular/Newest/Love/Hot; filters Multipass/Sound/VR/Mic/Webcam; slideshow; `/view/XXXXXX`. Patchstorage: click-any-tag-to-filter with removable chips. Profile Cloud: search with token suggestions, sort Name/Date/Type ± direction, three shelves. | Featured/Newest/Name at nine configs. Tag chips + search when the catalog grows. |
| **Sharing** | n/a. | n/a. | n/a. | Shadertoy: permalink. Patchstorage/QMK: download a file. Excalidraw/TS Playground: compressed state in the **URL hash**, never sent to the server. | Base36 stamp in the hash, `COPY LINK`, versioned, per-config OG image so Discord unfurls it. |
| **Budget / capacity limit** | Not surfaced. | Not surfaced. | Slot count is the limit; shown as slot pickers. | n/a. | Arduino's `Sketch uses X bytes (Y%)` idea, but **live and next to the knobs**: two meters, one per event, blocking rather than failing. No comparable does this. |

---

## Sources

**Source code read directly (HIGH confidence)**
- `esphome/esp-web-tools` — `src/install-dialog.ts` (state machine `ERROR|DASHBOARD|PROVISION|INSTALL|ASK_ERASE|LOGS`, all user-facing strings), `src/install-button.ts` (feature detection, unsupported/insecure-context messages) — https://github.com/esphome/esp-web-tools
- `profile-cloud` (local checkout, read-only) — `src/routes/Filter.svelte`, `Sorter.svelte`, `SearchBar.svelte`, `ConfigCardDisplay.svelte`, `ConfigThumbnail.svelte` — search-token vocabulary, sort axes, `Overwrite`/`Delete` card actions
- `grid-editor` (local checkout, read-only) — `src/renderer/serialport/serialport.ts:202` (`requestPort({ filters })`), `serial-transport.ts` — confirms the Web Serial path already works from a browser build

**Live product copy (HIGH confidence)**
- ESP Web Tools docs — https://esphome.github.io/esp-web-tools/ (`unsupported` slot API, `new_install_prompt_erase` default false)
- WLED Web Installer — https://install.wled.me/ (3-step flow, browser message, CP2102/CH34x driver hints, data-cable warning, CORS failure copy, Basic/Advanced split)
- Adafruit WebSerial ESPTool — https://adafruit.github.io/Adafruit_WebSerial_ESPTool/ ("Connect", *"at least Firefox 151 or Chrome 89"*, Erase Program, log console)
- Vialite — https://vialite.viii.me/ (connect ritual copy, Safari/Firefox degrade framing, *"RAM-only until saved to EEPROM"*)
- Novation SL MkIII / Launchpad Components guides — https://support.novationmusic.com/hc/en-gb/articles/360012446819 and /360009860380 (`Send to` → slot → `Overwrite Custom Mode`, connection icon)
- Shadertoy browse — https://www.shadertoy.com/browse (sort and filter sets, thumbnail metadata, `/view/` deep links)
- Patchstorage + ZOIA librarian docs — https://patchstorage.com/ , https://github.com/meanmedianmoge/zoia_lib (tag-chip filtering with `[x]` removal)

**Platform / API (HIGH confidence)**
- Mozilla Hacks, *Announcing Web Serial Support in Firefox* — https://hacks.mozilla.org/2026/05/web-serial-support-in-firefox/ (Firefox 151 desktop, per-site/per-port grants, add-on gating prompt, `DefaultSerialGuardSetting`). Corroborated by Hackster, gHacks, Slashdot, GIGAZINE.
- Chrome for Developers, *Read from and write to a serial port* — https://developer.chrome.com/docs/capabilities/serial (`requestPort` filters, `getPorts()` persistence, `connect`/`disconnect` events)
- MDN Web Serial API — https://developer.mozilla.org/docs/Web/API/Web_Serial_API (Limited Availability, secure context, transient activation)
- flash.pingequa.com troubleshooting — https://flash.pingequa.com/troubleshooting/failed-to-open-serial-port (verbatim `NetworkError`, Espressif's five causes, named conflicting programs, ordered recovery)

**Patterns (MEDIUM confidence — multiple consistent secondary sources)**
- Excalidraw hash-fragment sharing — https://plus.excalidraw.com/blog/end-to-end-encryption ; TypeScript Playground URL structure — https://www.typescriptlang.org/_playground-handbook/url-structure.html (`lz-string` `compressToEncodedURIComponent`)
- VIA instant-EEPROM-write behaviour — https://docs.keeb.io/via and multiple keyboard guides, consistent across sources
- Arduino sketch-size message — https://support.arduino.cc/hc/en-us/articles/4405339237522 ; QMK firmware-size failure — https://thomasbaart.nl/2018/12/01/reducing-firmware-size-in-qmk/
- WLED Peek / `/liveview` and one-client limit — https://kno.wled.ge/basics/web-ui/ , https://github.com/Aircoookie/WLED/wiki/Websocket ; pre-rendered effect previews — https://github.com/photocromax/WLED-live-visualizations
- `prefers-reduced-motion` + IntersectionObserver animation gating — Adobe Design, CSS-Tricks, and 2026 practitioner guides, consistent

**Known gaps**
- QMK Configurator's live UI could not be fetched (client-rendered; docs page 403/thin). Its flow is characterised from official docs and secondary guides — MEDIUM confidence, but only used as a negative example.
- Shadertoy's browse page returns 403 to fetchers; its sort/filter vocabulary comes from search-indexed page titles and the `shadertoy` Dart client's `Sort` enum — MEDIUM confidence on the exact label set, HIGH on the pattern.
- No user research exists for HANGAR. Every "users expect" claim here is inferred from comparable-product behaviour, not observed. The table-stakes/differentiator split is an argued judgement, not a measurement.

---
*Feature research for: browser-based hardware configuration playground (Web Serial + visual preset catalog)*
*Researched: 2026-09-02*
