# Phase 2: Walking Skeleton - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove that a bare browser page — no Grid Editor runtime, no `WriteBuffer`, no `GridRuntime` object
graph — completes the whole write cycle against a real ZONA using a write that changes nothing:
connect over Web Serial → identify the module from its heartbeat → fetch the touch element's Setup
and Timer strings → write the identical strings back → PAGESTORE → re-fetch and prove byte-identity.
Every step is reported complete only on a matching ACKNOWLEDGE frame. The run records written
answers to the protocol questions the desktop app never had to ask.

Requirement: FOUND-01. Success criteria 1–4 are hardware-verified by the user with a ZONA on the
desk; criterion 5's WASM half is ALREADY ANSWERED by Phase 3 (the formatter loads and runs from the
production build in Chromium — `03-06-SUMMARY.md`), so this phase settles only the heartbeat and
pacing questions and measures the timing.

Not in this phase: any UI beyond a plain diagnostic page; snapshot persistence; PUT BACK; the
catalog; anything that changes what the module holds. Phase 6 (Device Session) and Phase 7 (Install
Flow) build on the pure modules this phase leaves behind.

</domain>

<decisions>
## Implementation Decisions

### Hardware and module state
- **D-01:** A ZONA is on the user's desk now. The phase executes end to end in one sitting: the
  pure modules and the page are built first, then the user runs the hardware checklist personally.
  Agents never touch the hardware.
- **D-02:** The module carries its **factory configuration** for the run (one run, one config).
  "Behaves exactly as before" is proven by the re-fetched strings being byte-identical, not by eye —
  the factory Setup is dim and static. (A second run against an animating BOTOR config is deferred to
  Phase 7's hardware checklist.)
- **D-03:** **PAGESTORE is included**, behind its own click. It is a no-op (it flashes what is
  already stored) and one flash cycle is negligible against the part's endurance; Phase 7's KEEP ON
  DEVICE depends on knowing PAGESTORE/ACKNOWLEDGE works from a bare page.
- **D-04:** Grid Editor holds the port exclusively. The page catches the `open()` failure
  (`DOMException: Failed to open serial port`, identical on Windows/macOS/Linux — PITFALLS §C1),
  names Grid Editor as the likely holder and shows the CONN-04 recovery order (quit Editor → unplug →
  wait → replug → reload → connect). This is the first real test of that message.

### Where it lives (Claude's discretion, choice made)
- **D-05:** The page is a **prerendered, unlinked `/dev/skeleton/` route** in the SvelteKit app —
  the same harness as `/dev/fidelity/`, behind Basic Auth on the preview URL, so it can be tested over
  HTTPS from any Web-Serial-capable machine, not only `localhost`. "Bare" is preserved by rule: the
  page imports nothing from the app except `@intechstudio/grid-protocol` and the new pure modules
  below — no `src/lib/pad`, no vendored code, no compile, no WASM (the skeleton never needs the
  formatter).

### What survives
- **D-06:** The pure parts are written as **real, Vitest-covered modules** Phase 6 inherits; only
  the page and its run script are throwaway:
  - `src/lib/protocol/` — descriptors for exactly the five instructions (outbound HEARTBEAT/EXECUTE
    TYPE 255; CONFIG/FETCH; CONFIG/EXECUTE; PAGESTORE/EXECUTE) plus the inbound decoders
    (HEARTBEAT, CONFIG/REPORT, CONFIG/ACKNOWLEDGE, PAGESTORE/ACKNOWLEDGE, PAGEACTIVE/REPORT); a
    response matcher (class + instr + SX/SY, plus PAGENUMBER/ELEMENTNUMBER/EVENTTYPE where the
    response carries them); the rx frame scanner (`b[i] === 10 && b[i-3] === 4`, EOT+LF) with the
    buffer trimmed after every frame.
  - `src/lib/transport/` — a `GridTransport` interface, `WebSerialTransport` (ported shape of
    grid-editor's `serial-transport.ts`, typed with `@types/w3c-web-serial`, plus `navigator.serial`
    `connect`/`disconnect` listeners the desktop never had), and a `FakeTransport` that replays
    recorded frames and can inject failures (dropped ACK, delayed ACK, disconnect mid-write).
  - A `RequestQueue`: one outstanding request process-wide (CONFIG/ACKNOWLEDGE carries no
    correlating parameters), honest timeouts, **bounded** retry (3) — never the desktop's unbounded
    recursion (`engine.store.ts:302`). `decode_packet_frame` result checked for `false` BEFORE
    `decode_packet_classes` (the desktop's `serialport.ts:161` bug is not inherited).
- **Explicitly NOT implemented, ever:** `PAGEACTIVE/EXECUTE` (a page change destroys the Lua VM —
  a write the user did not ask for), `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD` (Phase 7 decides),
  anything bootloader-adjacent.

### What the run records
- **D-07:** **Every frame on the wire is recorded** — heartbeats, FETCH/REPORT, EXECUTE/ACK,
  PAGESTORE/ACK, PAGEACTIVE — as hex plus decoded JSON with millisecond timestamps, exported from the
  page as one JSON file and committed under `src/lib/transport/fixtures/`. `FakeTransport` replays a
  genuine ZONA from it, and the framing tests (split chunk, coalesced chunks, torn frame) use real
  bytes. Nothing secret is on the wire (no serial numbers beyond what heartbeats carry); record it all.
- **D-08:** The run produces **`docs/SKELETON-RESULTS.md`**, written by the executor from the
  exported JSON the user hands back, settling in writing: (a) whether an outbound 300 ms host
  heartbeat is required — module still heartbeats / still ACKs without it?; (b) whether the desktop's
  fixed 10 ms pre-send sleep is load-bearing at 2 Mbaud; (c) measured ACK latencies for CONFIG/FETCH,
  CONFIG/EXECUTE and PAGESTORE against the desktop's 250 / 500 / 3000 ms timeouts, and the honest
  timeouts HANGAR should use; (d) whether PAGEACTIVE/REPORT was observed unprompted and the page
  number it carried; (e) whether heartbeats from any other module were seen; (f) the WASM question,
  answered by reference to Phase 3. Each answer cites the fixture file and timestamps.

### Safety rails
- **D-09:** The page **refuses to write** if CONFIG/FETCH for either event returned no
  ACTIONSTRING, failed to decode, or is ≥ 909 characters — write buttons stay disabled and the page
  says why. A no-op is only provable when the fetched string is trustworthy.
- **D-10:** Fetch, write and store target the module's **reported active page** from
  PAGEACTIVE/REPORT — never a hardcoded 0. If no PAGEACTIVE arrives in the identify window, request
  it explicitly if the protocol allows, otherwise refuse with a message. Hardcoding 0 against a module
  on page 2 is a silent no-op that proves nothing.
- **D-11:** Write order is **Timer (event 6) first, then Setup (event 0)** — BOTOR's field-tested
  `writePad` order; each write awaits its own ACK with one request outstanding and bounded retry;
  PAGESTORE fires only after both ACKs and only on a **separate click** whose label names what it
  does ("Store to flash — writes the config that is already there"). Nothing is written without a
  click: connect is one click, write-back a second, store a third.
- **D-12:** If heartbeats from more than one Grid module arrive, the page **names the other modules
  and disables the store button** (PAGESTORE is a global broadcast); fetch and RAM write-back still
  target the ZONA only (HWCFG 161, its SX/SY). Phase 7's "warn, still allow" policy needs a UI this
  experiment does not have.

### Claude's Discretion
- A/B mechanics: a heartbeat on/off toggle on the page, two complete runs per setting; a pacing
  toggle (10 ms vs 0 ms between sends) recorded in the same JSON; what "required" means (module stops
  heartbeating or stops ACKing within N seconds) — define it before the run, in the page text.
- Honest timeouts (1000 ms FETCH, 500 ms EXECUTE, 3000 ms PAGESTORE) as starting values, revised by
  the measurements in D-08.
- Identify window and disconnect rule (750 ms without a heartbeat = gone), `SerialPort.connected`
  feature-detected, `requestPort()` called synchronously inside the click handler before any `await`.
- Page layout: plain diagnostic — status line, the two fetched strings verbatim, per-step ACK
  latencies, a frame log, an Export JSON button. Reduced-motion irrelevant; no identity work here.
- An e2e for the page's degrade path (`Navigator.prototype` `serial` deleted → the page explains
  itself and shows no connect button) so the route stays green in the suite without hardware.
- Module layout under `src/lib/protocol/` and `src/lib/transport/`, fixture naming, how the export
  JSON is shaped so `FakeTransport` reads it directly.

</decisions>

<specifics>
## Specific Ideas

- The provable-no-op idea is the whole design: the highest-risk experiment must also be the safest
  thing to run on the user's own hardware. Every write is of a string the module already holds.
- The user runs the hardware checklist personally with Grid Editor closed; the executor waits at a
  checkpoint, then writes the results doc from the JSON the user provides.
- The mixed-state incident from BOTOR (a 20 ms keeper timer made the link drop a write; Timer landed,
  Setup did not; a retry fixed it) is the reason for bounded retry and for reporting each event's ACK
  separately.
- "Bare" is a discipline, not a toolchain: the page must be able to answer "what does it import"
  with two names.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirement and prior decisions
- `.planning/REQUIREMENTS.md` — FOUND-01; CONN-04 (the port-conflict message this phase tests
  first); CONN-07 (VID 0x303a / PID 0x8123, bootloader IDs never offered); SAFE-07/09 (ACK-based
  "installed", bounded retry — this phase proves the mechanism)
- `.planning/ROADMAP.md` §Phase 2 — goal and five criteria (criterion 5's WASM half answered by
  Phase 3)
- `.planning/phases/01-scaffold-licence-and-pin/01-CONTEXT.md` — D-07 (Basic Auth gate; the preview
  URL the page ships behind), D-08 (manual deploy)
- `.planning/phases/03-vendor-the-domain/03-06-SUMMARY.md` — the `/dev/fidelity/` route pattern
  (prerendered, unlinked, `onMount` dynamic import, e2e over `wrangler dev`) and the WASM answer

### Research that decides this phase
- `.planning/research/ARCHITECTURE.md` §1 (the desktop write path traced with file:line — connect,
  identify, write, store, read-back — and §1.7 the load-bearing invariants: one outstanding request,
  fixed `sleep(10)`, NACK rejects, HEARTBEAT never resolves a waiter, LASTHEADER skipped), §2.2–2.3
  (reimplement as a thin client; the five instructions exactly, with parameters and timeouts),
  §3.2–3.3 (purity split; `protocol/`, `transport/`, `device/` layout), §6.1–6.2 (the riskiest
  unknown and the smallest experiment — this phase IS §6.2), §Anti-Patterns ("Porting WriteBuffer
  because it works", "Hardcoding page 0")
- `.planning/research/PITFALLS.md` §C1 (exclusive port; the exact exception string; symmetric
  conflict with the Editor), §C2 (success ≠ bytes reached the OS buffer), §C3 (half-written config —
  the BOTOR incident), §C10 (`getPorts()` is not a session), §C11 (backgrounded tabs throttle timers
  the heartbeat depends on; firmware's 2 s EDITOR TIMEOUT), §C12 (read-loop lock ordering, framing
  across chunks, rx buffer growth)
- `.planning/research/STACK.md` §Decision 3 (Web Serial support matrix incl. Firefox 151+; secure
  context; transient user activation — `requestPort()` before any await; `getPorts()`, `connect`/
  `disconnect` events, `SerialPort.connected`, `forget()`), §Supporting Libraries
  (`@types/w3c-web-serial`)

### Reference implementations outside this repo (read-only, never modify, never run git there)
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\serialport\serial-transport.ts` — the
  proven Web Serial transport shape (open at 2 000 000 baud, `writable.locked` checks, read loop,
  cancel-then-release on close)
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\serialport\serialport.ts` —
  `requestPort` filters, `setupFrameHandler` (`rxBuffer[i] === 10 && rxBuffer[i-3] === 4`), the
  `decode_packet_classes`-before-validation bug at :161 NOT to inherit
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\serialport\instructions.ts` —
  `SendConfig` (:118), `FetchConfig` (:64), `StorePage` (:326): the exact parameter names and values
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\runtime\engine.store.ts` — `WriteBuffer`
  (:170 waiter, :272 sendToGrid, :302 unbounded retry NOT to copy, :360 validate_incoming, :392
  LASTHEADER skip) and the 250/500/3000 ms timeouts
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\runtime\runtime.ts` — `:2118
  incoming_heartbeat_handler`, `:2365 create_module` via `grid.module_type_from_hwcfg`, `:865
  GridEvent.sendToGrid`, `:2257 storePage`, `:1057 GridEvent.load`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\runtime\runtime-manager.store.ts:42` —
  the 300 ms editor heartbeat
- `node_modules/@intechstudio/grid-protocol/dist/index.js` — `grid.encode_packet`,
  `decode_packet_frame`, `decode_packet_classes`, `module_type_from_hwcfg`, `module_hwcfgs`
- `C:\Users\sabot\.claude\projects\C--Users-sabot-Documents-Claude\memory\project_zona_module_config.md`
  — the user's verified ZONA facts (908 budget, one touch element, events 0 and 6, the mixed-state
  write incident, page change destroys the VM)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/routes/dev/fidelity/+page.svelte` + `e2e/fidelity.e2e.ts` — the prerendered unlinked
  diagnostic-route pattern with a dynamic import inside `onMount`; copy the shape for
  `/dev/skeleton/`.
- `e2e/smoke.e2e.ts` — the `Navigator.prototype` `serial` deletion technique for the degrade e2e.
- `playwright.config.ts` — the harness over `wrangler dev` on `./build`; `.tmp-e2e/` for captured
  logs; `.dev.vars` credentials.
- `worker/index.js` — Basic Auth gate; the page ships behind it on the preview URL.
- `src/lib/config-shape.spec.ts` helpers (`text()`, `code()`) for structural guards.

### Established Patterns
- Count-based acceptance; negative checks observed red before trusted; files created in a task are
  `git add`ed before any perturbation; `.tmp-*` dirs gitignored; no formatting of `src/vendor/`.
- Sibling repos read-only with before/after `status --porcelain` assertions.
- Deploys are the user's (`npm run deploy`); the executor never deploys. Testing the page over HTTPS
  on the preview URL therefore requires the user to deploy first — or test on `localhost` via
  `npm run preview` (a secure context) with the same page.

### Integration Points
- `src/lib/protocol/`, `src/lib/transport/` (new) — Phase 6's `device/session.ts` sits on top.
- `src/lib/transport/fixtures/` (new) — real ZONA frames for FakeTransport.
- `docs/SKELETON-RESULTS.md` (new) — Phase 6's research reads it before designing the session.

</code_context>

<deferred>
## Deferred Ideas

- **Second run against an animating BOTOR config** — Phase 7's hardware checklist (audition,
  Put back, store, replug).
- **Snapshot persistence (localStorage)**, PUT BACK, PAGEDISCARD recovery — Phase 7.
- **Multi-module "warn, still allow"** — Phase 7 (SAFE-06); the skeleton refuses to store instead.
- **Heartbeat loop design and reconnect via `getPorts()`** — Phase 6, informed by D-08's answers.
- **Firmware-version comparison at connect** — Phase 6 reads `PROTOCOL_PIN` internally (never shown).
- **`SerialPort.forget()` control** — Phase 6.

</deferred>

---

*Phase: 02-walking-skeleton*
*Context gathered: 2026-09-02*
