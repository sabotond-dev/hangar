# Project Research Summary

**Project:** HANGAR
**Domain:** Public static web playground that drives USB hardware (Intech Studio ZONA) over Web Serial, built around an in-browser firmware-faithful simulator and a compiler ported from a GPLv3 desktop editor
**Researched:** 2026-09-02
**Confidence:** HIGH

## Executive Summary

HANGAR is two nearly-independent products stitched together at one seam. The larger half — a catalog of animating 81-LED grids, each running a firmware-faithful simulator (`pad-sim.ts`) fed by a ported compiler (`_pad.ts`) — has no hardware dependency at all and can be built, tested, and shipped as a complete, delightful experience before a single byte touches Web Serial. The smaller, riskier half — connect, snapshot, audition, store, put-back — depends on a protocol that has never been driven from a browser without the full Grid Editor Electron runtime around it. All four researchers converged independently on the same structural conclusion: build the simulator/catalog/tuning track first (it de-risks nothing about hardware but delivers the entire "worth opening the URL" value), and prove the bare-browser write path as an isolated, first-week experiment, because if it fails the product's core value is in question and everything else is moot.

The recommended stack is SvelteKit 2.70.3 + Svelte 5 + adapter-static, chosen specifically because `profile-cloud` already proves the one genuinely risky integration (a WASM-bearing Intech package inside a Vite static build) in this exact ecosystem, and because SvelteKit's SPA router keeps an open `SerialPort` and a shared `requestAnimationFrame` loop alive across navigation — something Astro's MPA model and a plain multi-page site cannot do. Rendering 10-30 live grids is solved by porting `pad-sim-host.ts`'s scheduling verbatim (one shared rAF, `IntersectionObserver` gating, decoupled 100 Hz tick / 30 Hz paint) while rewriting its `blit()` from ~163 draw calls per card down to 2 (`putImageData` + one `drawImage`). PROJECT.md's Web Serial browser matrix is out of date on one material point — Firefox 151 (2026-05-19) shipped Web Serial on desktop — and every researcher flagged this independently; the fix is cheap (feature-detect, never browser-sniff) but the copy and onboarding across the whole install flow must be rewritten to not say "Chrome only."

The risks are concentrated, well-understood, and almost all have a known prior-art fix from the desktop Grid Editor codebase: a write that resolves "success" on the local promise instead of the module's ACK (the trap `GridEvent.sendToGrid()` already fell into); a half-written config when Setup lands but Timer does not (a real hardware incident, already fixed with Timer-first ordering, bounded per-half retry, and `PAGEDISCARD` as an atomic RAM-from-flash recovery); a snapshot that races the module's response and captures an empty string, turning HANGAR's central safety promise into the worst possible outcome (a recorded FATAL, already fixed with `awaitEventLoaded`); a simulator test that pins the same misreading of firmware that produced the bug it's meant to catch (a real committed bug — `ledIndexToCell` mirrored the wrong rows — caught only because a later cross-check existed); and the WASM Lua formatter's async init gate, whose absence makes every card silently report "invalid syntax" with no visible cause. None of these are exotic — they are documented, file:line-cited, and in several cases already fixed once in the sibling repository. The job is porting the fix alongside the code, not rediscovering the bug.

## Key Findings

### Recommended Stack

SvelteKit 2.70.3 + Svelte 5.57.0 + `@sveltejs/adapter-static` 3.0.10, on Vite 8.2.2, deployed to Cloudflare Workers with Static Assets. `@intechstudio/grid-protocol` is pinned exact (no caret) at `1.20260825.1135` to match `grid-editor` during the port. 2D canvas (one per card, one shared rAF host) beats WebGL (hard context caps: ~16/tab Chrome, 8/principal Firefox) and DOM (73,000 style mutations/sec at 30 visible cards) for rendering. Vitest in node for all ported domain logic (the 5,924-line test suite from `grid-editor` ports with only an import-path rewrite); Playwright for the non-serial browser paths (catalog, degrade path, URL round-trip); Web Serial itself is **not automatable** — no CDP domain, no fake device hook — so a written hardware smoke checklist is the only verification for the install path.

**Core technologies:**
- SvelteKit + adapter-static: session continuity across navigation for an open SerialPort and a shared rAF loop — proven combination via `profile-cloud`
- Svelte 5 runes: signal-level reactivity so one knob invalidates one card, not a 30-item list re-render, competing for the main thread with a 100 Hz sim loop
- `@intechstudio/grid-protocol` (exact pin): owns packet encode/decode and the real `compressScript` cost function the 908-char fit ladder is calibrated against — non-negotiable dependency, browser-safe, but has a mandatory async WASM init gate
- Cloudflare Workers Static Assets: free unlimited static-asset serving, HTTPS by default (satisfies Web Serial's secure-context requirement), custom response headers available (CSP, `Permissions-Policy: serial`) unlike GitHub Pages

### Expected Features

**Must have (table stakes):** Connect flow with feature-detected gating and named error copy (not browser-sniffed — Firefox 151 changes the audience); RAM audition (`TRY ON DEVICE`) strictly separate from flash Store (`KEEP ON DEVICE`), never a single combined "Install"; snapshot-at-connect with a `PUT BACK` control — no comparable product examined (VIA, Novation, WLED, ESP Web Tools) does this, making it simultaneously table stakes for HANGAR's safety promise and a genuine differentiator; live simulator on every card running the actual compiled config (not a static thumbnail); dual 908-char budget meters shown live next to the knobs, blocking install rather than failing at write time; URL-hash-encoded shareable state; honest degrade (full catalog + simulation everywhere, install disabled-with-reason, never hidden).

**Should have (differentiators):** Snapshot + Put Back as the reputation feature; a catalog that's alive with zero hardware attached (Shadertoy's model applied to hardware); "about a second" framed as an advantage over every firmware-flashing comparable's multi-minute promise; budget-as-visible-instrument reframing a constraint as part of the playground identity; randomise / "surprise me."

**Defer (v2+):** Search, tag chips, curated shelves (irrelevant at 9 catalog entries); OG images beyond one per base config; before/after compare against the module's pre-existing config (needs reverse-parsing arbitrary Lua, may be impossible); showing generated Lua (invites "let me edit it," which is explicitly out of scope).

**Anti-features to actively refuse:** accounts/cloud uploads (arbitrary Lua executed on a stranger's hardware from a stranger's website is a categorically different trust proposition than Shadertoy's sandboxed shaders); full layer/zone authoring; firmware update/bootloader/DFU; streaming the real ZONA's LEDs as the preview (measured 3.3 Hz — would make good configs look broken); auto-apply on connect; a combined install button; browser sniffing; a raw serial console.

### Architecture Approach

Three components are already proven separately and have never been combined: the desktop editor's browser-to-hardware transport, Profile Cloud's JSON config shape, and BOTOR's compiler + simulator pair. The port strategy is **vendor, don't extract-as-package**: `_pad.ts` (4380 lines) has exactly one runtime import (`grid-protocol`) and one type-only import; `pad-sim.ts` (1569 lines) has exactly one import, `_pad.ts` itself; `pad-sim-host.ts` (557 lines) uses raw DOM only, no framework. All three, plus their 5,924 lines of Vitest coverage, port with a single inlined type alias. What is explicitly left behind is the desktop editor's 2480-line reactive object graph (`GridRuntime`/`GridEvent`/`GridAction`) and its 504-line `WriteBuffer`, both replaced by much smaller purpose-built equivalents.

**Major components:**
1. **`vendor/`** — byte-identical ported compiler, simulator, and render host; quarantined from lint/refactor, synced against BOTOR's upstream SHA
2. **`protocol/` + `transport/`** — pure instruction descriptors/framing separated from the impure `GridTransport` interface (`WebSerialTransport` | `FakeTransport`), which is what makes the entire hardware write path testable in CI without hardware
3. **`device/session.ts` + `device/queue.ts`** — the connect → identify → snapshot → audition → store → restore state machine and a bounded-retry, one-in-flight `RequestQueue` (explicitly *not* the desktop's unbounded-recursive-retry `WriteBuffer`)
4. **`catalog/` + `state/tuning.ts`** — pure catalog data and a pure tuning reducer feeding both the simulator and the compiler from one shared `PadState`, so "preview == what gets written" is structurally enforced, not just claimed

### Critical Pitfalls

1. **Exclusive serial port ownership (Chromium opens ports exclusively on all 3 OSes)** — Grid Editor auto-connects on launch and can sit in the tray invisibly; the visitor's first Connect attempt fails with a generic `NetworkError: Failed to open serial port.` Name Grid Editor explicitly in the error copy and release HANGAR's own port aggressively on hide/idle so the failure mode isn't mutual.
2. **A write that reports success before the module ACKs** — the exact trap `GridEvent.sendToGrid()` already fell into (`resolve({value:true})` on an invalid config). "Installed" must be defined as *the module returned a matching ACK frame*, ported as a real response-waiter, before any write feature ships.
3. **Half-written config: Timer lands, Setup doesn't** — a documented real hardware incident. Mitigation is four layers together: Timer-always-first, bounded per-half retry, a distinct `PadPartialWriteError` UI state offering both retry and Put Back, and `PAGEDISCARD` as an atomic RAM-from-flash recovery (only works because auditions are RAM-only).
4. **Snapshot captures an empty string** — a recorded FATAL from prior art: the load promise can resolve before the event content actually arrives. Gate every write button on a confirmed non-empty snapshot, never trust the load promise, snapshot the raw wire string (not a parsed model), and offer it as a download.
5. **Simulator fidelity drift pinned by a same-misreading test** — a real committed bug (`ledIndexToCell` mirrored the wrong parity) shipped with a green suite because the test was written from the same wrong reading of firmware. Fix: transcribe firmware constants as literal cited data (`grid-fw file:line`), never as a derived English rule.

## Implications for Roadmap

Based on combined research, the phase structure below reconciles the architecture researcher's dependency chain, the pitfalls researcher's ordering constraints, and the features researcher's MVP split. All four sources agree on the shape: a pure catalog/simulator/tuning track that never touches hardware, and a hardware track that starts with a single no-op experiment before any feature is built on top of it. They join only at the install-flow phase.

### Phase 0: Scaffold — stack, licence, pin policy

**Rationale:** Every researcher independently placed licence and dependency-pin decisions here. GPLv3 obligations (public source repo, Source link with deployed commit SHA, origin headers on every ported file, third-party licences page) are free to satisfy at project creation and miserable to retrofit across a 3.2k-line ported compiler later. The exact-pin policy on `@intechstudio/grid-protocol` (no caret — its version is a firmware datestamp, not semver) must be a written rule from commit one, or a routine dependency bump silently moves the 908-character fit ladder.
**Delivers:** SvelteKit + adapter-static scaffold, Tailwind, Vitest/Playwright wired, `vite.config.ts` with the `optimizeDeps.exclude` incantation for grid-protocol's WASM asset, `LICENSE` served at the site root, `THIRD-PARTY.md` generation, Source-link chrome.
**Addresses:** the "Licensing" and "Dependency" constraints in PROJECT.md.
**Avoids:** C13 (GPLv3 non-compliance), C15 pin policy (protocol/firmware version drift).

### Phase 1: Walking skeleton — bare-browser write to a real ZONA (RISKIEST, RUN IN PARALLEL WITH PHASE 2)

**Rationale:** This is the single riskiest unknown in the whole project and every researcher flagged it: nothing in either sibling repository has ever completed a CONFIG write and a PAGESTORE against real hardware without the full Grid Editor `GridRuntime` object graph running underneath it. The architecture researcher specifies the exact experiment — ~150 lines, no framework — and its defining property: the write it performs is a **provable no-op** (fetch the existing Setup/Timer strings, write those exact same strings back unchanged, then store unchanged). This makes the highest-risk experiment also the safest one to run against a user's paid-for hardware. It answers, in one afternoon: does identify work from an unsolicited heartbeat alone; is an outbound host heartbeat required; is the 10ms inter-message pacing gap load-bearing at 2 Mbaud; does `@wasm-fmt/lua_fmt`'s `.wasm` resolve from a plain static Vite build.
**Delivers:** Confirmed or refuted: connect → identify (HWCFG 161) → CONFIG/FETCH → CONFIG/EXECUTE (no-op) → PAGESTORE/EXECUTE (no-op), each gated on real ACK frames, against a real ZONA, with no editor runtime present.
**Addresses:** the core-value requirement ("if everything else fails, browser-to-hardware install must work").
**Avoids:** C1 (exclusive port — first real-world test of this), C9 (bootloader VID/PID — the filter is one line, `0x303a`/`0x8123` only, fixed here), C2 (ACK-based success — the whole experiment is built around waiting for a real ACK, not a local promise).

### Phase 2: Vendor the domain — compiler, simulator, tests (depends on nothing; parallel to Phase 1)

**Rationale:** `_pad.ts` and `pad-sim.ts` have near-zero coupling to the desktop editor (one runtime import between them) and their 5,924-line Vitest suite ports with only an import-path rewrite. This is also where the fidelity-oracle strategy must be decided and written — before, not during, the port — because the prior art's worst bug (`ledIndexToCell`'s wrong-row mirroring) shipped with a green suite precisely because the test was written from the same misreading as the code. Firmware constants must be transcribed as literal cited data before a single card renders.
**Delivers:** Byte-identical vendored `_pad.ts`/`pad-sim.ts`/`pad-sim-host.ts` with a `BOTOR-SYNC.md` provenance record; `padCompilerReady()` gate ported verbatim; ported test suite green against a `vite build && vite preview` static bundle (proving the WASM asset resolves outside dev mode).
**Uses:** `@intechstudio/grid-protocol`, `@wasm-fmt/lua_fmt` (transitive), Vitest.
**Implements:** the `compiler/` and `sim/` domain layer.
**Avoids:** C6 (fidelity drift — oracle strategy chosen here, before the simulator port), C7 (WASM init gate — the app-boot ordering trap where `checkSyntax` silently returns `false` instead of throwing).

### Phase 3: Catalog and simulator host

**Rationale:** All four researchers call this "the phase that makes the site worth opening" and note it needs no hardware at all — it is the true foundation, and the largest single piece of work is porting `pad-sim-host.ts`'s scheduling design (one shared rAF, `IntersectionObserver` gating, decoupled 100Hz-tick/30fps-paint) while rewriting its `blit()` (163 draw calls/card → 2, via `putImageData`). Natural home for the visual identity work since it's purely rendering, no protocol risk.
**Delivers:** The nine ported BOTOR presets as catalog entries, live per-card canvases, offscreen pause + `prefers-reduced-motion`, deep link + focus view, mouse-as-finger on the focused card, sort control.
**Addresses:** C1 (live simulator on every card), C2 (preview == compiled output), C4 (fidelity honesty), C5 (offscreen pause), D1/D4/D5 (deep link, sort, focus view).
**Avoids:** C14 (dozens of animated canvases — port `pad-sim-host.ts` structure, not a rewrite).

### Phase 4: Tuning, fit ladder, URL stamp

**Rationale:** Depends on Phases 2 and 3; still pure, still no hardware. The 908-character budget has no direct comparable in any product examined — every embedded toolchain reveals the limit at build/flash time as a failure, and the explicit lesson from that survey is to surface it continuously, live, next to the knobs, never as an error at write time.
**Delivers:** 3-6 knobs per config, live recompile + re-simulate, dual budget meters (Setup/Timer are separate, non-fungible 908-char budgets), fit ladder as a visible/named degrade rather than a silent one, over-budget as a blocked state, reset-to-default, base36 stamp in `location.hash`.
**Uses:** the compiler's `cost`/`fit` functions from Phase 2.
**Implements:** `state/tuning.ts`, `url/stamp.ts`.
**Avoids:** C8 (908-char budget with comments preserved by the minifier — cost with the real `compressScript`, never `.length` on pretty source), the known stamp-checksum hole (a relabelled stamp decoding to a *different* card — ship the checksum before the share feature goes public, this is a known open hole, not hypothetical).

### Phase 5: Device session — productionize the write path

**Rationale:** Depends on Phase 1's findings. This is where the walking skeleton's proof becomes a real transport layer: bounded retry (never the desktop's unbounded recursion), disconnect handling, the honest degrade UI, hidden-tab write policy. C2 (ACK-based transport) must be fully solid here — every downstream safety feature leans on it.
**Delivers:** `RequestQueue`, `WebSerialTransport` + `FakeTransport` with recorded frames, connect/identify state machine, feature-detected (never browser-sniffed) degrade messaging that names which browsers work (including Firefox 151+, correcting PROJECT.md).
**Uses:** the protocol descriptors and framing logic specified exactly in ARCHITECTURE.md section 2.3 (five instructions: HEARTBEAT in/out, CONFIG/FETCH, CONFIG/EXECUTE, PAGESTORE/EXECUTE, plus passive PAGEACTIVE/REPORT listening).
**Avoids:** C10 (getPorts() is not a session — design as if nothing is remembered), C11 (background-tab timer throttling stalls writes — never busy-wait, derive timeouts from `performance.now()` deadlines), C12 (read-loop lock ordering, framing across chunk boundaries, unbounded rx buffer).

### Phase 6: Install flow — where the two tracks meet

**Rationale:** Depends on Phases 4 and 5 both being complete. This is the single phase every researcher agreed must carry the snapshot-at-connect safety net *in the same phase as the first write*, never deferred — deferring it means the first audition destroys the very state it was supposed to preserve. Store-to-flash is explicitly its own step within this phase (or a sub-phase), gated by RAM-audition and Put-Back both already working.
**Delivers:** `device/adapter.ts` building the `PadWriteAdapter`; `TRY ON DEVICE` (RAM, no storePage); `KEEP ON DEVICE` (flash, with storePage) as a separate deliberate labelled action with its own permanence confirmation; `PUT BACK` (writes the snapshot strings back verbatim, re-stores if a store happened this session); wrong-module refusal; the RAM/flash distinction made structurally unmissable in the UI.
**Addresses:** B1-B7, A1-A9 from FEATURES.md's MVP install track.
**Avoids:** C3 (half-written config — Timer-first, bounded retry, PAGEDISCARD escape hatch), C4 (empty snapshot — gate every write button on confirmed non-empty snapshot), C5 (audition reaching flash — single guarded store call site that restores-then-aborts if unconfirmed; test the negative, not just the happy path).

### Phase 7: New catalog entries authored for spectacle

**Rationale:** Deliberately last. Authoring against a working simulator and a working budget meter is a materially easier job than authoring blind, and this phase has zero technical risk once Phases 2-4 exist.
**Delivers:** Catalog expansion beyond the nine ported BOTOR presets.

### Phase Ordering Rationale

- **The pure chain (2→3→4) and the hardware chain (1→5→6) are nearly independent and can run in parallel**, joining only at Phase 6. This is the single clearest convergence across all four researchers: FEATURES.md calls the simulator "the true foundation... two nearly-independent tracks"; ARCHITECTURE.md's dependency reasoning says the same in different words; PITFALLS.md's phase mapping keeps them separate until the install phase; STACK.md's whole framework argument (SvelteKit over Astro) exists because both tracks must coexist in one session without tearing each other down.
- **Phase 1 (the no-op write skeleton) is deliberately out of order** — before the compiler port, before the catalog, before anything user-facing — because it is the only phase whose failure invalidates the product's core value, and it is also the cheapest phase to run (roughly 150 lines, no framework). Running it first means finding out in week one, not week six, whether a bare browser page can actually complete a CONFIG write and a PAGESTORE against real hardware with none of Grid Editor's runtime around it.
- **The fidelity-oracle strategy is chosen before the simulator port, not after** (Phase 2) — this is a direct pitfall-driven ordering constraint: the prior art's worst bug was hidden by a test written from the same misreading as the buggy code, and the only defense is deciding the transcription discipline (cite `grid-fw file:line`, never restate in English) before any test is written.
- **Snapshot/Put-Back ships in the same phase as the first real write feature (Phase 6), never as a follow-up** — this is the pitfalls researcher's most emphatic ordering rule, backed by a recorded FATAL in prior art (a load-promise race producing an empty snapshot) and the observation that deferring it means the first audition destroys the state it exists to protect.
- **Store-to-flash is its own phase-internal step, strictly after audition and Put Back both work** — because the flash-write escape hatches (PAGEDISCARD, unplug/replug) only function correctly if RAM auditions never touch flash, which must already be proven before Store is introduced.
- **ACK-based transport (Phase 5, building on Phase 1) precedes every write feature** — C2 is described by the pitfalls researcher as "the wall everything else leans on": every downstream safety claim (partial-write detection, put-back confirmation, store confirmation) is unverifiable if "success" is defined as a resolved local promise rather than a matched ACK frame from the module.
- **Licence and pin decisions land in Phase 0** — free at project creation, expensive after a 3.2k-line compiler has been ported without origin headers.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (walking skeleton):** MEDIUM confidence per ARCHITECTURE.md — genuinely unproven whether a bare browser page can complete the protocol without the editor runtime; whether an outbound heartbeat is required is explicitly LOW confidence and needs its own A/B test as part of this phase.
- **Phase 6 (install flow) — flash unplug-during-store ordering:** firmware writes Setup before Timer to flash (opposite of HANGAR's RAM write order), an unplug mid-store can leave a mixed flash state; the mitigation (re-store from snapshot, read back and compare) needs validation against real hardware timing.
- **Phase 4 (tuning/stamp) — checksum format for the shared URL stamp:** PITFALLS.md flags this as a known *open* hole in prior art ("a `b` xy-axes stamp relabelled `a` can decode to a DIFFERENT card"), not a hypothetical — needs its own design pass before the share feature is public.
- **Any phase touching `getPorts()` persistence semantics:** Chromium's own sources conflict on whether/when serial-port grants persist across browser restarts; treat as UX-polish-only since the design is deliberately insensitive to the answer.

Phases with standard patterns (skip research-phase):
- **Phase 0 (scaffold):** Stack choices are HIGH confidence, verified against npm registry and a working sibling-repo precedent (`profile-cloud`).
- **Phase 2 (vendor domain):** Port is mechanical — near-zero coupling already measured by grep, tests port with a path rewrite.
- **Phase 3 (catalog/simulator host):** `pad-sim-host.ts`'s scheduling design is proven prior art; the only new work (static overlay + `putImageData` blit rewrite) is a well-specified, bounded change.
- **Phase 5 (device session) protocol shape:** The five instructions, their ACK filters, and timeouts are fully specified with file:line citations in ARCHITECTURE.md section 2.3 — this is transcription, not discovery.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified against npm registry directly; the one risky integration (WASM package in a static Vite build) has a working sibling-repo precedent read from disk; browser-compat facts cross-checked against three independent sources (MDN BCD, webstatus.dev, Mozilla release notes) |
| Features | HIGH on comparable behaviour (source code and live product copy read directly for 9 real products); MEDIUM on which features actually move HANGAR's needle specifically, since no user research exists yet — explicitly flagged by the researcher as argued judgement, not measurement |
| Architecture | HIGH for everything traced from local source (the full desktop write path, protocol instructions, port coupling, vendoring analysis); MEDIUM for the one open question — whether a bare browser page can complete the write without the editor runtime, which is exactly Phase 1's job to resolve |
| Pitfalls | HIGH for firmware and Chromium facts (read directly from `grid-fw` source and Chromium source) and for prior-art incidents (read from `grid-editor` source and the user's own engineering notes); MEDIUM for Web Serial permission-persistence behaviour and flash-endurance numbers, both explicitly flagged inline as unverified |

**Overall confidence:** HIGH

### Gaps to Address

- Whether the bare-browser write path works at all without the editor runtime (Phase 1's entire purpose) — MEDIUM confidence, resolve first, before any other hardware-facing work.
- Whether an outbound host heartbeat is strictly required for the module to keep responding — LOW confidence, resolved by the A/B built into Phase 1's experiment.
- Chrome's serial-port grant persistence conditions (conflicting sources) — deliberately not a blocker since the connect UX is designed to never depend on it; revisit only if reconnect UX feels wrong in testing.
- Whether ZONA exposes a distinguishing USB serial-number descriptor (affects whether Chrome can tell two ZONAs apart) — settle with real hardware (`lsusb -v` / Device Manager) whenever convenient, not phase-blocking.
- Flash endurance rating for ZONA's SPI NOR part — mechanism is verified (LittleFS, power-fail-safe, per-event files), the actual cycle count was not looked up; irrelevant as long as "never auto-store" holds as a hard rule.
- Whether `CONFIG/FETCH` succeeds for a page the module is not currently displaying, and whether `PAGESTORE`'s global-broadcast nature is safe when other Grid modules share the same bus (HANGAR assumes a lone ZONA) — both are Phase-5/6-adjacent open questions noted by the architecture researcher.
- The 941/908 over-budget preset combination flagged in PROJECT.md is known pre-existing compiler debt, not an architecture question — lands naturally in Phase 4's full-range knob sweep.

## Sources

### Primary (HIGH confidence)
- Local source read directly: `C:\Users\sabot\Documents\Claude\grid-editor` (serialport, runtime, engine.store, `_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts`, test suites), `grid-fw` @ `dc7d301e` (protocol headers, LED lookup tables, VM lifecycle, Lua event loop), `node_modules/@intechstudio/grid-protocol` dist and LICENSE
- npm registry (`registry.npmjs.org`), queried 2026-09-02 — exact versions and peer-dependency ranges for the full recommended stack
- MDN browser-compat-data, `api.webstatus.dev`, Mozilla Firefox 151 release notes — Web Serial support matrix
- Chromium source (`serial_io_handler.cc`, `serial_io_handler_posix.cc`, `serial_port.cc`) — exclusive-port mechanism and exact error strings
- Cloudflare official docs — static-assets billing and platform limits
- User's ZONA engineering notes (`project_zona_module_config.md`) — hardware-confirmed incidents and traps

### Secondary (MEDIUM confidence)
- Draw-call/op-count arithmetic in STACK.md's rendering-ceiling analysis — reasoned from code, not profiled; flagged as needing measurement on target hardware
- Mozilla Hacks Firefox Web Serial announcement — two-step permission model, enterprise policy gate
- Comparable-product live copy (ESP Web Tools, WLED, Vialite, Novation Components, Shadertoy, Patchstorage) — HIGH confidence on the pattern, MEDIUM on exact label sets for two sources that returned 403 to fetchers
- GPLv3-and-minified-JS conveying analysis — reasoned from licence text plus community practice (Drupal core issues), not legal advice

### Tertiary (LOW confidence, explicitly flagged for later verification)
- Whether Chrome persists serial-port grants across restarts, and under what conditions (sources conflict)
- Whether ZONA exposes a USB serial-number descriptor
- The exact `LUA_FLOORN2I` build setting (macro present, specific behaviour taken from user notes, not re-verified this session)
- `self:glc`/`self:glp` no-op behaviour and Mode-block Setup-abort — taken from user notes, not re-verified against firmware this session

---
*Research completed: 2026-09-02*
*Ready for roadmap: yes*
