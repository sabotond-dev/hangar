# Phase 2: Walking Skeleton - Research

**Researched:** 2026-09-03
**Domain:** Grid wire protocol from a bare browser page over Web Serial; a provable-no-op write cycle against a real ZONA
**Confidence:** HIGH for everything read from source (the protocol package, the desktop instruction payloads, the firmware decode paths, the HANGAR harness). MEDIUM for the two questions the phase exists to settle by measurement (host heartbeat required? 10 ms pacing load-bearing?) — but both now have a source-grounded prediction, which turns the hardware run from an open experiment into a confirmation with a falsifiable expectation.

## Summary

Every protocol fact this phase needs is now read from source rather than remembered, and three of them
change the plan. First, **`grid.decode_packet_frame` returns `undefined` on a bad frame, never `false`**
— so the desktop's `class_array !== false` guard (`serialport.ts:173`) is dead code and its
`decode_packet_classes`-before-check ordering (`:170-172`) is a real, reachable bug; HANGAR checks
truthiness first. Second, **`CONFIG/ACKNOWLEDGE` and `PAGESTORE/ACKNOWLEDGE` do carry a correlator**:
firmware echoes the request's BRC `ID` into `CLASS_CONFIG_LASTHEADER` (`grid_decode.c:1307`) and
`CLASS_PAGESTORE_LASTHEADER` (`grid_decode.c:947`), and `grid.encode_packet` returns that `id`. CONTEXT
D-06 assumes there is nothing to correlate against; there is, for ACKs and NACKs, and HANGAR should
assert it (but must **not** apply it to `CONFIG/REPORT`, where the same byte offset is `VERSIONMAJOR`).
Third, and most consequential for safety: **a `CONFIG/EXECUTE` sets `grid_ui_state.page_change_enabled = 0`
in firmware (`grid_decode.c:1279`) and the only thing that ever sets it back to 1 is an inbound
`HEARTBEAT` with `TYPE == 255` (`grid_decode.c:717`)** — the restore-on-timeout line is commented out
(`grid_esp32_port.c:480`). A skeleton run that writes with the host heartbeat off leaves the user's ZONA
unable to change page until it is power-cycled. That is not a no-op, and it must be designed around.

The heartbeat question now has a strong prediction. The module heartbeats every 250 ms from an
unconditional port-task timer (`grid_esp32_port.c:417`, `grid_protocol.h:116`), its `TYPE` flips to `1`
the moment USB is connected (`grid_esp32_port.c:470`) with no host involvement, and a `TYPE == 1`
heartbeat carries a `PAGEACTIVE/REPORT` class **in the same BRC frame** naming the active page
(`grid_transport.c:199-203`). Nothing in the `CONFIG` or `PAGESTORE` decode paths consults
`editor_connected` — its only effect anywhere in the tree is gating LEDPREVIEW generation
(`grid_ui.c:746-748`). So the predicted answer is: **the host heartbeat is not required for the write
cycle, and the active page arrives free with every heartbeat** — which also resolves D-10 without
needing a `PAGEACTIVE/FETCH` that does not exist. The run confirms or falsifies it.

The pacing question has a mechanism rather than an answer. A `CONFIG/EXECUTE` frame is `49 + ACTIONLENGTH`
bytes (measured, not derived) — 690 bytes for the 641-char factory Setup, 957 at the 908 budget — against
a 512-byte TinyUSB CDC RX buffer (`tusb_config.h:39`) feeding a 2048-byte port ring
(`grid_transport.h:13`), where an over-full ring **silently drops the whole message**
(`grid_transport.c:151-153`). That is a testable hypothesis, and the cheapest way to test it is a burst
of `CONFIG/FETCH` (which writes nothing) at 0 ms and at 10 ms spacing, counting timeouts — far better
evidence than the two writes the no-op run performs.

**Primary recommendation:** build `src/lib/protocol/` (pure descriptors, matcher, framing) and
`src/lib/transport/` (interface, `WebSerialTransport`, `FakeTransport`, `RequestQueue`) as
Vitest-covered modules against a **synthetic** fixture generated through `grid.encode_packet`; ship
`/dev/skeleton/` copying `/dev/fidelity/`'s prerendered-unlinked shape with the module loaded in
`onMount` and `requestPort()` called first inside the click; run the hardware checklist; then commit the
real capture as the fixture and re-point `FakeTransport` at it. Address the module by the `SX/SY` and
`PAGENUMBER` its own heartbeat reports, never by constants. Send `HEARTBEAT/EXECUTE TYPE 255` at least
once at the end of every run, in both A/B arms, to restore `page_change_enabled`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hardware and module state**
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

**Where it lives (Claude's discretion, choice made)**
- **D-05:** The page is a **prerendered, unlinked `/dev/skeleton/` route** in the SvelteKit app —
  the same harness as `/dev/fidelity/`, behind Basic Auth on the preview URL, so it can be tested over
  HTTPS from any Web-Serial-capable machine, not only `localhost`. "Bare" is preserved by rule: the
  page imports nothing from the app except `@intechstudio/grid-protocol` and the new pure modules
  below — no `src/lib/pad`, no vendored code, no compile, no WASM (the skeleton never needs the
  formatter).

**What survives**
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

**What the run records**
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

**Safety rails**
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

### Deferred Ideas (OUT OF SCOPE)

- **Second run against an animating BOTOR config** — Phase 7's hardware checklist (audition,
  Put back, store, replug).
- **Snapshot persistence (localStorage)**, PUT BACK, PAGEDISCARD recovery — Phase 7.
- **Multi-module "warn, still allow"** — Phase 7 (SAFE-06); the skeleton refuses to store instead.
- **Heartbeat loop design and reconnect via `getPorts()`** — Phase 6, informed by D-08's answers.
- **Firmware-version comparison at connect** — Phase 6 reads `PROTOCOL_PIN` internally (never shown).
- **`SerialPort.forget()` control** — Phase 6.
</user_constraints>

### Two locked decisions that source contradicts — planner must reconcile

Both are stated here rather than silently overridden. Neither changes the phase's scope; both change a
detail of how a task is written.

| Decision text | What source says | Recommended reconciliation |
|---|---|---|
| D-06: "one outstanding request process-wide (**CONFIG/ACKNOWLEDGE carries no correlating parameters**)" | Firmware sets `CLASS_CONFIG_LASTHEADER` to the request's BRC `ID` on both ACKNOWLEDGE and NACKNOWLEDGE (`grid_decode.c:1307`, `:1330`); `PAGESTORE` likewise (`grid_decode.c:947`, `:997`). `grid.encode_packet` returns that `id`. Verified by round-trip: an encoded frame with `ID = 1` decodes with `class_parameters.LASTHEADER === 1`. | **Keep the one-outstanding rule** (it is still the right design, and `CONFIG/REPORT` genuinely has no correlator). **Additionally assert `LASTHEADER === id`** on `CONFIG`/`PAGESTORE` ACK and NACK, and record the match in the fixture. Do **not** apply it to `CONFIG/REPORT`: `VERSIONMAJOR` occupies the same offset 5, so a REPORT decodes `LASTHEADER === 1` (the firmware's protocol major version) for every request. |
| D-06: "`decode_packet_frame` result checked for **`false`** ... (the desktop's `serialport.ts:161` bug)" | `decode_packet_frame` returns **`undefined`**, at every one of its seven failure exits (`dist/index.js:4018, 4023, 4028, 4034, 4048, 4053, 4076`). It never returns `false`. Confirmed by running it on a checksum-corrupted frame: result `undefined`, `=== false` is `false`. | Check **truthiness** (`if (!frame) continue;`), not `!== false`. A literal `!== false` port would reproduce the desktop bug exactly. The bug also sits at `serialport.ts:170-173` in the current tree, not `:161`. |

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **FOUND-01** | A bare browser page (no framework, no Editor) connects to a ZONA over Web Serial, fetches the touch element's existing Setup and Timer configs, writes the identical strings back, and stores — every step acknowledged by the module, the whole run a provable no-op on the hardware (the walking skeleton) | §The Protocol, Verified gives the exact five descriptors, the exact response filters, the wire byte layout and the frame sizes; §Firmware Truths proves what the module actually gates each step on (page must be active, ACTIONLENGTH must be exact, ACK carries the request id); §Architecture Patterns gives the module layout, the `RequestQueue` rules and the framing scanner; §Validation Architecture maps criteria 1–4 to a manual checklist and criterion 5 plus every mechanism to automated commands. |

Requirements this phase *proves the mechanism for* without completing (their own phases own them):

| ID | Phase | What this phase establishes |
|----|-------|------------------------------|
| CONN-04 | 6 | The `NetworkError` / `Failed to open serial port.` branch is exercised for real against a running Grid Editor (D-04) — the first true test of the recovery copy. |
| CONN-07 | 6 | `requestPort({ filters: [{ usbVendorId: 0x303a, usbProductId: 0x8123 }] })` is the only filter; bootloader `0x8122` is never listed. Identity is confirmed from `HWCFG === 161` in the heartbeat, not from the filter. |
| SAFE-07 | 7 | "Installed" = a matching `ACKNOWLEDGE` frame, per event, never a resolved `writer.write()` promise. |
| SAFE-09 | 7 | Bounded retry (3) with an `AbortSignal`, and a named failure state on disconnect mid-write. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

These are directives, not preferences. Research below never recommends anything that contradicts them.

| Directive | Source | Effect on this phase |
|---|---|---|
| **GSD workflow enforcement** — no direct repo edits outside a GSD workflow | `hangar/CLAUDE.md` §GSD Workflow Enforcement | All work lands through `/gsd:execute-phase`. |
| **Exact pin on `@intechstudio/grid-protocol`, no caret** | §What NOT to Use; FOUND-03 | `1.20260825.1135` stays. Every wire fact below was read from *this* version's `dist/index.js`. Any bump re-opens all of them (`docs/PIN-POLICY.md`). |
| **Never call `initLuaFormatter()` at app boot** | §What NOT to Use | The skeleton never calls it at all — D-05 already forbids the compile surface. Note that importing `@intechstudio/grid-protocol` does **not** initialise the formatter; it only logs `HEARTBEAT_INTERVAL 250000 250` at module scope (`dist/index.js:3709`). Filter console assertions to `type === "error"` or that log fails them. |
| **`requestPort()` first inside the click handler, compile second** | §What NOT to Use | Confirmed and sharpened in §Web Serial below: the mechanism is *expiry* (~4.9 s), not consumption. |
| **Never browser-sniff the Web Serial gate** | §What NOT to Use | `"serial" in navigator && isSecureContext`, then a `requestPort()` try/catch. |
| **Feature-detect, never assume parity** (Firefox WPT 0.727) | §Decision 3 | `SerialPort.connected` and `forget()` are typed as always-present by `@types/w3c-web-serial`; guard with `"connected" in port`. |
| **No `src/vendor/` formatting; vendored tree quarantined** | §Conventions, Phase 1/3 decisions | The skeleton touches none of it. The `tsconfig` `exclude: ["src/vendor/**"]` stays as-is. |
| **Sibling repos are read-only** | Phase 1/3 established pattern | `grid-editor` and `grid-fw` were read only. Verified: `grid-editor` shows exactly the user's two pre-existing PROTECTED modifications (`ElementName.svelte`, `SimpleColor.svelte`) and nothing else; `grid-fw` is clean. |
| **No Claude attribution in any commit or doc** | Phase 1/3 established pattern | Applies to every commit this phase produces. |

---

## Standard Stack

Nothing new is installed. **This phase adds zero dependencies.** Everything it needs is already in the
tree at a verified version.

### Core (already present, verified in `package.json` and `node_modules`)

| Package | Version | Purpose | Why it is already right |
|---|---|---|---|
| `@intechstudio/grid-protocol` | `1.20260825.1135` (exact, no caret) | `grid.encode_packet`, `decode_packet_frame`, `decode_packet_classes`, `module_type_from_hwcfg`, `module_hwcfgs`, `getProperty`, `ModuleType`, `ElementType`, `EventType`, `EventTypeToNumber` | FOUND-03. Every byte-level fact in this document was read from this exact copy of `dist/index.js`. |
| `@types/w3c-web-serial` | `1.0.8` | `Serial`, `SerialPort`, `SerialOptions`, `SerialPortFilter`, `SerialPortRequestOptions` | **Already installed and already wired.** `tsconfig.json` has `"types": ["w3c-web-serial", "node"]`. |
| `svelte` / `@sveltejs/kit` / `vite` | `5.56.1` / `2.63.0` / `8.0.16` (ranges) | The `/dev/skeleton/` route | Same harness `/dev/fidelity/` already proved. |
| `vitest` | `4.1.8` | `src/**/*.spec.ts` in the `server` project, node environment | `expect: { requireAssertions: true }` is inherited by both projects — every new test must assert. |
| `@playwright/test` | `1.62.1` | `e2e/skeleton.e2e.ts` | Chromium 151.0.7922.34 installed at `~/AppData/Local/ms-playwright/chromium-1234`. |
| `wrangler` | `4.128.0` | `npm run preview` → the harness Playwright drives | Cold start measured at 4.6 s (`playwright.config.ts` header). |

### The typing question, answered without installing anything

**No install was performed and no file was touched.** `@types/w3c-web-serial@1.0.8` is already a
devDependency and already listed in `tsconfig.json`'s `types` array (added in Phase 1, with the comment
explaining why `"node"` must sit beside it). `npm run check` was run to confirm the current state:

```
1788434911774 COMPLETED 353 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

`git status --porcelain` is empty before and after. **Item 3 needs no work from the planner beyond
knowing the typings are live.** The four typing facts that matter, read from
`node_modules/@types/w3c-web-serial/index.d.ts`:

| Line | Declaration | Consequence for HANGAR |
|---|---|---|
| `:127-129` | `interface Navigator { readonly serial: Serial }` — **non-optional, non-nullable** | TypeScript will happily let you write `navigator.serial.requestPort()` on Safari. The compiler is not the gate. `"serial" in navigator && isSecureContext` is, and it must be a real runtime branch (CONN-01/DEGR-02). |
| `:103` | `requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>` with `filters?: SerialPortFilter[]` (`:87-95`) and `SerialPortFilter { usbVendorId?, usbProductId? }` (`:80-84`) | `requestPort({ filters: [{ usbVendorId: 0x303a, usbProductId: 0x8123 }] })` type-checks exactly as written. Do **not** hand-roll the `SerialPortFilter` interface the way `serialport.ts:21-25` does. |
| `:57-66`, `:104-113` | `addEventListener(type: "connect" \| "disconnect", listener: (this: this, ev: Event) => void, useCapture?: boolean)` on **both** `SerialPort` and `Serial` | The listener parameter is a plain `Event`, not a `SerialConnectionEvent`. `ev.target` is `EventTarget \| null`; getting a `SerialPort` out of it needs a cast. The third parameter is `boolean`, not `AddEventListenerOptions`, on the narrow overload — pass `{ signal }` and you fall through to the wide `string` overload, which still compiles. |
| `:46`, `:55` | `readonly connected: boolean` and `forget(): Promise<void>` typed as unconditionally present | Both are Chrome 130+/103+ and Firefox 151+. Feature-detect at runtime (`"connected" in port`), because the types will not warn you. |

### Alternatives Considered

| Instead of | Could Use | Why not, here |
|---|---|---|
| `@types/w3c-web-serial` | The hand-rolled `WebSerialPort` interface at `grid-editor/src/renderer/serialport/serial-transport.ts:9-39` | It predates the typings, omits `connected`, `forget()`, `getPorts()` and the `Serial` object entirely, and types `open(options: SerialOptions)` against its own local `SerialOptions`. STACK.md §Decision 3 already says "do not copy that". |
| A dedicated `src/lib/device/` folder | `src/lib/transport/queue.ts` for the `RequestQueue` | ARCHITECTURE §3.3 puts `RequestQueue` under `device/`, but that folder is Phase 6's (`device/session.ts`). D-06 creates only `protocol/` and `transport/`. Put the queue in `transport/queue.ts` this phase — it depends only on `GridTransport` plus the pure matcher — and let Phase 6 decide whether to move it under `device/`. Record that as an explicit note in the module header so Phase 6 does not have to rediscover the choice. |
| Recording decoded frames only | Recording raw chunks **and** framed packets **and** decoded classes | Only raw chunks exercise the framing scanner. See §The fixture shape. |

---

## The Protocol, Verified

Everything in this section was read from
`node_modules/@intechstudio/grid-protocol/dist/index.js` at version `1.20260825.1135`, or executed
against it in Node. Line numbers are grep-verified against that file.

### The wire frame, byte for byte

`grid.encode_packet(descriptor)` (`:3925`) builds one BRC header plus one class block. Measured output
for a `CONFIG/EXECUTE` carrying `"--[[@cb]]print(1)"` (17 chars):

```
\x01 \x0f 003f 02 f8 0000 7f7f 00 00 0000 \x17 \x02 060 e 0105050000060011--[[@cb]]print(1) \x03 \x04 41
SOH  BRC  LEN  ID SESS SX SY DX DY R PR MSGAGE EOB  STX cls in <-------- class parameters --------> ETX EOT ck
```

| Region | Bytes | Detail |
|---|---|---|
| BRC header | **23** | `SOH`(1) + `BRC`(15) + 20 hex chars + `EOB`(23). Field offsets from `grid.getProperty("BRC")`: `LEN` 2/4, `ID` 6/2, `SESSION` 8/2, `SX` 10/2, `SY` 12/2, `DX` 14/2, `DY` 16/2, `ROT` 18/1, `PORTROT` 19/1, `MSGAGE` 20/2. |
| Class block | `1 + n + 1` | `STX`(2) + 3 hex class code + 1 hex instr code + parameters at their declared offsets + `ETX`(3). |
| Tail | **3** | `EOT`(4) + two lowercase-hex checksum chars. |
| **Terminator** | **1** | **`encode_packet` does NOT append it** (`:3994-3997` returns `{ serial, id }` straight after pushing the checksum). The caller pushes `10` — `engine.store.ts:250` does exactly `retval.serial.push(10)`. |

**Frame length is `49 + ACTIONLENGTH` for `CONFIG/EXECUTE`, including the LF.** Measured:

| Frame | Bytes on the wire (with LF) |
|---|---|
| `HEARTBEAT/EXECUTE` | 43 |
| `PAGESTORE/EXECUTE` | 33 |
| `CONFIG/FETCH` | 49 |
| `CONFIG/EXECUTE`, factory ZONA Setup (641 chars) | **690** |
| `CONFIG/EXECUTE`, factory ZONA Timer (22 chars) | 71 |
| `CONFIG/EXECUTE` at the 908 budget | **957** |

(Factory lengths measured from `grid.get_element_events(ElementType.TOUCH)[n].defaultConfig` — 641 for
Setup, 22 for Timer, both pure ASCII. Firmware regenerates the same default when `cfg_default_flag` is
set, `grid_ui.c:491-493`, so a factory module's FETCH should return strings of about these lengths.
Treat that as an expectation to check in the run, not a guarantee.)

### `encode_packet` — the exact contract

| Fact | Line | Consequence |
|---|---|---|
| Returns `undefined` if `descriptor === undefined` | `:3926-3928` | Guard the return. |
| Deep-clones the descriptor, then mutates the clone | `:3929` | Your descriptor object is not modified; the `ID` you need is only in the return value. |
| `brc_parameters.ID = utility_genId()` — a module-level counter cycling **1..255** | `:3930`, `:3524` | This is the correlator. `encode_packet` **returns it** as `.id`. Capture it *before* the write, not after. |
| Forces `SX = 0`, `SY = 0`, `MSGAGE = 0`; `SESSION` from a per-load `Math.floor(Math.random()*255)` hex | `:3931-3934`, `:3876` | Outbound SX/SY are always zero on the wire (which decodes as −127). Never set them. |
| `DX = parseInt(DX) + 127`; `undefined` → `0` | `:3936-3946` | `DX: 0` → wire `7f` = 127 = **IS_ME**. `DX: -127` → wire `00` = **IS_GLOBAL**. Omitting `DX` entirely also gives global. |
| Any `class_parameters` key whose declared `length > 0` is written as zero-padded hex; `length === 0` is written as raw chars via `value.charCodeAt(i)` | `:3962-3978`, `:3491-3503` | **The ACTIONSTRING is not escaped or encoded.** Each JS char becomes one byte. Non-ASCII would truncate to the low byte of a UTF-16 unit. `compressScript` output is single-line ASCII, so this is safe — but it means a control byte inside a config would corrupt framing. Assert ASCII before writing. |
| A parameter whose value is `undefined` is skipped entirely (bytes left as written by earlier fields) | `:3968-3977` | `PAGESTORE` with `class_parameters: {}` produces `\x02 061 e \x03` and nothing else — measured. |
| Checksum = XOR of every byte, `.toString(16).padStart(2,"0")`, pushed as two ASCII chars | `:3987-3993` | Lowercase hex. `decode_packet_frame` reverses it (`:4001-4011`). |

### `decode_packet_frame` — returns `undefined`, never `false`

`:4000-4079`. Seven failure exits, all `return undefined`, all preceded by a `console.log`:

| Check | Line | Log text |
|---|---|---|
| checksum mismatch | `:4013-4019` | `Checksum mismatch, packet dropped! Received: N Calculated: M` + the whole byte array |
| `array[0] !== SOH` | `:4020-4023` | `Frame error: SOH not found!` |
| `array[1] !== BRC` | `:4025-4028` | `Frame error: BRC not found!` |
| `array[length-3] !== EOT` | `:4030-4034` | `Frame error: EOT not found!` |
| `array.length - 2 !== brc.LEN` | `:4045-4048` | `Frame error: Invalid BRC_LEN parameter! ...` |
| `array[22] !== EOB` | `:4050-4053` | `Frame error: EOB not found!` |
| STX/ETX mismatch inside a class block | `:4073-4076` | `Frame error: STX ETX mismatch!` |

Two consequences the planner must encode as rules:

1. **`if (!frame) continue;`** — never `!== false`. Confirmed empirically: flipping one checksum char
   makes the return `undefined` and `result === false` is `false`.
2. **These are `console.log`, not `console.error`, and they cannot be suppressed.** A noisy cable will
   spam the console. The skeleton's frame log should record the same failure itself so the fixture
   captures it; and a Playwright console assertion must filter to `type === "error"` (the existing
   `fidelity.e2e.ts:36` pattern already does).

On success it returns an **array of class blocks**, all sharing one decoded `brc_parameters` object,
each with `raw` = the block minus its STX and ETX (`:4055-4078`). `brc.SX/SY/DX/DY` each have 127
subtracted (`:4040-4043`), so a directly-attached module reports `SX: 0, SY: 0` and a
globally-addressed frame reports `DX: -127, DY: -127`.

**A single BRC frame can carry more than one class.** This is not theoretical — it is the normal case:

- Every `TYPE == 1` heartbeat carries `HEARTBEAT` **and** `PAGEACTIVE/REPORT` (`grid_transport.c:199-203`).
- Every `PAGESTORE/ACKNOWLEDGE` carries `PAGESTORE` **and** a `DEBUGTEXT` reading `nvm store success`
  (`grid_decode.c:945-948`, `grid_msg.c:373-388`).

**Iterate the array. Never take `[0]`.**

### `decode_packet_classes` — mutates in place, returns `undefined`

`:4082-4114`. Handles `undefined` input safely (`:4083-4085`), so the desktop's ordering bug does not
crash there — it crashes one layer up in `deliver_inbound(undefined)`. Per class it sets `class_name`,
`class_instr`, `class_parameters` and `timestamp: Date.now()` (`:4096`), reading each declared parameter
from `raw` at `offset - 1` (because `raw` excludes the STX).

**Two decoding traps that follow from the offset tables:**

1. **`CONFIG.LASTHEADER` and `CONFIG.VERSIONMAJOR` share offset 5, length 2.** Both keys are populated
   from the same two bytes on every inbound `CONFIG` class. On an `ACKNOWLEDGE`/`NACKNOWLEDGE` those
   bytes are the request's BRC id (firmware sets `CLASS_CONFIG_LASTHEADER`). On a `REPORT` they are the
   firmware's protocol major version (firmware sets `CLASS_CONFIG_VERSIONMAJOR`). **Use `LASTHEADER`
   only on ACK/NACK; use `VERSIONMAJOR` only on REPORT.**
2. **Fields beyond the frame's actual length decode as `undefined`** (`read_integer_from_asciicode_array`
   returns `undefined` on overrun, `:3474-3479`) and a variable-length string beyond the frame decodes
   as `undefined` too (`:3506-3510`). A `CONFIG/ACKNOWLEDGE` is a six-byte class block, so its
   `PAGENUMBER`, `ELEMENTNUMBER`, `EVENTTYPE`, `ACTIONLENGTH` and `ACTIONSTRING` are all `undefined`.
   A matcher that requires them will never match an ACK.

### `module_type_from_hwcfg` and `module_hwcfgs` — the number/string trap

```js
grid.module_type_from_hwcfg(161)    // "ZONA"        <- number works
grid.module_type_from_hwcfg("161")  // undefined     <- string does NOT
grid.module_hwcfgs().find(h => h.type === "ZONA")
// { type: "ZONA", revision: "RevH", hwcfg: "161" }   <- hwcfg is a STRING here
```

`module_type_from_hwcfg` compares against `getProperty("HWCFG")`, whose values are numeric-coerced at
parse time (`:3705`, `HWCFG[paramName] = +grid_protocol[key]`), so it needs a `number`.
`module_hwcfgs()` (`:4154-4172`) reads the raw protocol constants, which are strings. `grid-editor`
handles both correctly (`runtime.ts:2366` `Number(heartbeat_class_param.HWCFG)`, `:2370`
`Number(e.hwcfg) === hwcfg`). **Copy both coercions.**

`grid.getProperty("VERSION")` is `{ MAJOR: 1, MINOR: 5, PATCH: 5 }`.
`grid.getProperty("CONFIG_LENGTH")` is `909`. `grid.getProperty("HEARTBEAT_INTERVAL")` is `250` (ms).

ZONA's element list is `get_module_element_list(ModuleType.ZONA)` — length 256, index 0 = `"touch"`,
index 255 = `"system"`, everything between `undefined`. Touch events from
`get_element_events(ElementType.TOUCH)`: `{ desc: "setup", value: 0, key: "INIT" }` and
`{ desc: "timer", value: 6, key: "TIMER" }`. `EventTypeToNumber(EventType.SETUP) === 0`,
`EventTypeToNumber(EventType.TIMER) === 6`.

### The five descriptors, verbatim from the desktop

Copy these parameter names **literally**. Sources: `grid-editor/src/renderer/serialport/instructions.ts`
and `.../runtime/engine.store.ts` (enums at `:18-39`). Line numbers below are from the current tree and
supersede the approximate ones in CONTEXT.

#### 1. `HEARTBEAT / EXECUTE` — outbound, global (`instructions.ts:28-64`)

```ts
{
  brc_parameters: { DX: -127, DY: -127 },            // GLOBAL
  class_name: "HEARTBEAT",
  class_instr: "EXECUTE",
  class_parameters: {
    TYPE: 255,      // 254 = "I have unsaved changes, refuse page changes". HANGAR sends 255 ONLY.
    HWCFG: 255,     // the host is not a module
    VMAJOR: <host major>, VMINOR: <host minor>, VPATCH: <host patch>,
  },
}
// responseRequired: false, sendImmediate: true   -> no filter, no timeout, no waiter
```

The desktop reads `VMAJOR/VMINOR/VPATCH` from `appSettings.version` — the *editor's* version, not the
protocol's. HANGAR should send its own version (a `__COMMIT_SHA__`-adjacent constant, or simply
`1/0/0`). Firmware ignores these fields entirely for `type > 127` (`grid_decode.c:711-733`).

`SendHeartbeatImmediate.executeOn` refuses to enqueue if a heartbeat is already queued
(`instructions.ts:52-60`) — HANGAR's queue should do the equivalent: a heartbeat that cannot be sent
immediately is dropped, never queued behind a write.

#### 2. `CONFIG / FETCH` → `CONFIG / REPORT` (`instructions.ts:66-116`)

```ts
descr: {
  brc_parameters: { DX: sx, DY: sy },               // the module's own SX/SY from its heartbeat
  class_name: "CONFIG", class_instr: "FETCH",
  class_parameters: {
    VERSIONMAJOR: grid.getProperty("VERSION").MAJOR,   // 1
    VERSIONMINOR: grid.getProperty("VERSION").MINOR,   // 5
    VERSIONPATCH: grid.getProperty("VERSION").PATCH,   // 5
    PAGENUMBER: page, ELEMENTNUMBER: 0, EVENTTYPE: 0 | 6,
    ACTIONLENGTH: 0,
  },
},
filter: {
  brc_parameters: { SX: sx, SY: sy },
  class_name: "CONFIG", class_instr: "REPORT",
  class_parameters: { LASTHEADER: null, PAGENUMBER: page, ELEMENTNUMBER: 0, EVENTTYPE: 0 | 6 },
},
// responseRequired: true, NO responseTimeout -> falls back to 250 ms (engine.store.ts:318)
```

`LASTHEADER: null` in the desktop filter exists **only** so that `sendToGrid` (`engine.store.ts:315-317`)
overwrites it with the id for NACK matching; the positive-match loop skips it (`:419`). HANGAR should
keep NACK-by-LASTHEADER and drop the null placeholder in favour of an explicit `expectedId` field.

`ROT` is never set on FETCH or SEND (only `FetchPageCount` sets it, `instructions.ts:323`). Omit it —
`encode_packet` writes 0.

#### 3. `CONFIG / EXECUTE` → `CONFIG / ACKNOWLEDGE` (`instructions.ts:118-178`)

```ts
descr: {
  brc_parameters: { DX: sx, DY: sy },
  class_name: "CONFIG", class_instr: "EXECUTE",
  class_parameters: {
    VERSIONMAJOR: 1, VERSIONMINOR: 5, VERSIONPATCH: 5,   // from grid.getProperty("VERSION")
    PAGENUMBER: page, ELEMENTNUMBER: 0, EVENTTYPE: 0 | 6,
    ACTIONLENGTH: config.length,      // MUST equal config.length exactly - see Firmware Truths
    ACTIONSTRING: config,
  },
},
responseTimeout: 500,
filter: {
  brc_parameters: { SX: sx, SY: sy },
  class_name: "CONFIG", class_instr: "ACKNOWLEDGE",
  // NO class_parameters in the desktop filter at all
},
```

Rejected client-side at `ACTIONLENGTH >= Grid.Protocol.maxScriptLength` (`instructions.ts:166`), where
`maxScriptLength === grid.getProperty("CONFIG_LENGTH") === 909`. **D-09's "≥ 909" refusal is exactly
the desktop's rule** — keep it.

HANGAR's addition: `filter.class_parameters = { LASTHEADER: <id from encode_packet> }`, which firmware
guarantees (`grid_decode.c:1307`).

#### 4. `PAGESTORE / EXECUTE` → `PAGESTORE / ACKNOWLEDGE` (`instructions.ts:341-370`)

```ts
descr: {
  brc_parameters: { DX: -127, DY: -127 },            // GLOBAL BROADCAST - this is why D-12 exists
  class_name: "PAGESTORE", class_instr: "EXECUTE",
  class_parameters: {},                               // empty; encode writes nothing past the instr
},
responseTimeout: 3000,
filter: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE", class_parameters: { LASTHEADER: null } },
// note: NO brc_parameters in the filter - the ACK is global too
```

#### 5. `PAGEACTIVE / REPORT` — inbound only, never sent

The desktop's `ChangePage` (`instructions.ts:224-246`) builds `PAGEACTIVE/EXECUTE` with
`DX/DY = -127`. **D-06 forbids it forever.** Not implemented, not exported, not reachable. A structural
spec should assert the string `PAGEACTIVE` never appears beside `EXECUTE` anywhere under `src/lib/`.

Inbound handling in the desktop is `message-stream.store.ts:386-404` — it just records the page number.

### `validate_incoming` — the matching rules, verbatim (`engine.store.ts:377-434`)

The rules, in order, and what HANGAR keeps:

| # | Desktop rule | Line | HANGAR |
|---|---|---|---|
| 1 | No waiter → return | `:378` | Keep. |
| 2 | Waiter's element has no `filter` → return | `:380` | Keep. |
| 3 | **`class_name === "HEARTBEAT"` → return, always** | `:382-384` | **Keep, and keep it early.** Heartbeats arrive every 250 ms and would match loose filters. |
| 4 | Every key in `filter.brc_parameters` must `==` the incoming value; else return | `:389-399` | Keep, but use `===` after normalising both to numbers. The desktop's `!=` is loose on purpose because some fields are strings; HANGAR's decoder produces numbers throughout. |
| 5 | If `class_instr === "NACKNOWLEDGE"` and `class_name` matches and (`filter.LASTHEADER === undefined` or it `==` the incoming `LASTHEADER`) → `waiter.destroy()` → **reject**, then return | `:401-413` | Keep. A NACK rejects immediately and is **not** retried. |
| 6 | Otherwise `class_name` must match, and every `filter.class_parameters` key **except `LASTHEADER`** must `==` the incoming value | `:415-429`, note `:419` `continue` | Keep for `REPORT`. **Change for `ACKNOWLEDGE`:** include `LASTHEADER` in the positive match too, because firmware guarantees it there. Guard: only when the response class is `CONFIG` or `PAGESTORE` **and** the instruction is `ACKNOWLEDGE`/`NACKNOWLEDGE`. |
| 7 | Match → `waiter.provideResponse(descr)` → resolve | `:431-433` | Keep. |

Note the desktop calls `validate_incoming` for **every** class in **every** frame
(`message-stream.store.ts:406`), after its own dispatch. HANGAR does the same: dispatch heartbeat and
PAGEACTIVE first, then offer the class to the queue.

---

## Firmware Truths (grid-fw, local clone, `common/` + `esp32s3/`)

This is the section that turns two open questions into predictions. Everything here is read from the
public `intechstudio/grid-fw` clone at `C:\Users\sabot\Documents\Claude\grid-fw`, which the user's own
notes name as "the authority whenever firmware, the editor, or the npm protocol package disagree."

### The module heartbeats unconditionally, and its heartbeat carries the active page

| Fact | Source |
|---|---|
| The ESP32 port task fires `grid_utask_heart` on a timer whose period is `GRID_PARAMETER_HEARTBEATINTERVAL_us` | `grid_esp32_port.c:209-223`, `:415-418` |
| That constant is **250000 µs = 250 ms** | `grid_protocol.h:116` |
| Nothing in `grid_utask_heart` consults the host, `editor_connected`, or anything else. It reads `heartbeat_type`, `hwcfg`, `page_activepage`, `gccount` and sends. | `grid_esp32_port.c:214-222` |
| `heartbeat_type` is set to **1** by the port loop the moment `grid_usb_connected()` is true — again, no host involvement | `grid_esp32_port.c:463-471` |
| **When `type == 1`, the heartbeat message gains a second class block: `PAGEACTIVE / REPORT` with `PAGENUMBER = activepage`** | `grid_transport.c:199-203` |
| Chained (non-USB) modules keep `type == 0` — firmware's own comment on the inbound decode is `case 0: // Other grid module`, `case 1: // USB connected grid module` | `grid_decode.c:695-700` |

**Three planning consequences:**

1. **D-10 is solved without a `PAGEACTIVE/FETCH`.** There is no such instruction anywhere — not in
   `instructions.ts` (only `ChangePage`/`EXECUTE`), not in firmware's decode switch
   (`grid_decode.c:302-340`, which handles only `EXECUTE` and `REPORT`). The active page arrives
   piggybacked on **every** heartbeat once USB is connected, four times a second. D-10's fallback
   ("request it explicitly if the protocol allows, otherwise refuse") resolves to: **it does not need
   requesting; if no `PAGEACTIVE/REPORT` appears within the identify window, refuse and say so** —
   because its absence means the module is not the USB-attached one, or is on firmware older than this
   behaviour.
2. **D-12 has a cleaner discriminator than SX/SY.** The USB-attached module is the one sending
   `HEARTBEAT` with `TYPE === 1`. Other modules on the rig send `TYPE === 0`. Combine with
   `HWCFG === 161` for the ZONA check, and treat any distinct `(SX, SY)` pair as another module.
3. **The identify window can be short and honest.** Two heartbeats is 500 ms. A 750 ms window (3 ×
   250 ms, the desktop's `isAlive` rule at `runtime.ts:2426-2430`) is the right disconnect threshold.

### The host heartbeat: what it actually does, and the trap

Inbound heartbeat decode, `grid_decode.c:689-735`. For `type > 127` (i.e. 254 or 255) the module does
exactly three things:

```c
grid_ui_state.page_change_enabled = type == 255 ? 1 : 0;                       // :717
grid_msg_set_editor_heartbeat_lastrealtime(&grid_msg_state, ...);              // :720
if (grid_sys_get_editor_connected_state(&grid_sys_state) == 0) { ... = 1; }    // :723-727
```

Search the whole tree for what those two pieces of state gate:

| State | Every use | Effect |
|---|---|---|
| `editor_connected` | `grid_ui.c:746-748` only (plus the timeout that clears it) | Gates **LEDPREVIEW report generation**. Nothing else. HANGAR never asks for LEDPREVIEW (ARCHITECTURE §Anti-Patterns, N4). |
| `page_change_enabled` | Read at `grid_decode.c:319` (inbound `PAGEACTIVE/EXECUTE`) and `grid_lua_api.c:1692` (the Lua `gpl(n)` page-load call). Written at `grid_ui.c:79` (init = 1), `grid_decode.c:717` (from a host heartbeat), and **`grid_decode.c:1279`**. | Gates page changes. |

**`grid_decode.c:1279` is inside the `CONFIG/EXECUTE` success path.** A successful config write sets
`page_change_enabled = 0`. The EDITOR-TIMEOUT branch that would restore it is **commented out**
(`grid_esp32_port.c:480`, `grid_d51n20a.c:443`). So:

> After HANGAR writes a config, the user's ZONA cannot change page — from Lua's `gpl()` or from an
> inbound `PAGEACTIVE/EXECUTE` — until something sends it a `HEARTBEAT` with `TYPE == 255`, or it is
> power-cycled.

**Mandate for the planner:** every run, in **both** A/B arms, ends by sending one
`HEARTBEAT/EXECUTE TYPE 255`. Do it as an explicit final step *after* the last measurement and after the
JSON is assembled, logged in the fixture as a distinct step (suggested id `restore-page-change`), so it
cannot contaminate the heartbeat-off measurement. Say what it is for in the page text. This is a
one-line send that prevents leaving the user's hardware in a degraded state, and it is the single most
valuable thing this research found.

*(Also: never send `TYPE 254`. It disables page change and nothing in HANGAR would ever re-enable it.)*

### `CONFIG / EXECUTE` — the five conditions, and what NACK means

`grid_decode.c:1260-1313`:

```c
bool validlength   = scriptlength <= GRID_PARAMETER_ACTIONSTRING_maxlength;   // 909, grid_protocol.h:127
bool endswithetx   = validlength ? script[scriptlength] == GRID_CONST_ETX : false;
bool currentpage   = page == grid_ui_state.page_activepage;
bool validelement  = element < grid_ui_state.element_list_length;
struct grid_ui_event* eve = validelement ? grid_ui_event_find(ele, event) : NULL;
if (validlength && endswithetx && currentpage && validelement && ele && eve) { ... ACKNOWLEDGE }
else { ... NACKNOWLEDGE }
```

| Condition | What it means for HANGAR |
|---|---|
| `endswithetx` | **`ACTIONLENGTH` must be byte-exact.** Firmware indexes `script[scriptlength]` and requires an `ETX` there. Off by one in either direction is an unconditional NACK. `config.length` is the only correct value. |
| `currentpage` | **A write to a non-active page is NACKed, not silently ignored.** ARCHITECTURE §Anti-Patterns calls hardcoding page 0 "a completely silent no-op"; the firmware is kinder than that — it NACKs. D-10 still stands (you must target the right page), but the failure is loud, and the ACK is therefore *evidence the page was right*. |
| destination gate at `:1243` | `IS_ME \| IS_LOCAL` — so `DX/DY` must be `0,0` (wire `7f7f`) or `128,128` (wire `ffff` = LOCAL). **A globally-addressed `CONFIG` is ignored entirely, with no response at all.** |
| response | Always sent, with `CLASS_CONFIG_LASTHEADER = <request BRC ID>` (`:1307`). |

`grid_check_destination` (`:37-53`) reads the *raw* wire bytes:
`DEFAULT_POSITION = 127` (IS_ME), `GLOBAL_POSITION = 0` (IS_GLOBAL), `LOCAL_POSITION = 255` (IS_LOCAL)
— `grid_protocol.h:142-144`. Since `encode_packet` adds 127, descriptor `DX: 0` → wire 127 → **IS_ME**.
The USB-attached module reports `SX: 0, SY: 0` (its own BRC template bakes in `7f7f`,
`grid_protocol.h:181`), so `DX: heartbeat.SX, DY: heartbeat.SY` is correct and self-consistent. Read it
from the heartbeat anyway — do not hardcode 0.

### `CONFIG / FETCH` — a failed fetch sends **both** a NACK and an empty REPORT

`grid_decode.c:1315-1360`. `grid_ui_event_recall_configuration` (`grid_ui.c:464-501`) returns non-zero
when a bulk NVM operation is in progress (`:466`), when `page != page_activepage` (`:471`), or when the
element is invalid (`:478`). On non-zero, firmware sends a `CONFIG/NACKNOWLEDGE` **and then falls
through and sends the `CONFIG/REPORT` anyway**, with `ACTIONLENGTH = strlen(temp)` where `temp` is still
the zeroed buffer — i.e. length 0 and an empty string.

**Two rules for HANGAR:**

1. The NACK arrives *before* the REPORT, so a matcher that rejects on NACK (rule 5 above) wins the race
   and the run fails loudly. Keep NACK-rejects-immediately.
2. **D-09's "returned no ACTIONSTRING" check is not paranoia — it is the documented failure shape.**
   An empty `ACTIONSTRING` with `ACTIONLENGTH: 0` is exactly what a fetch of an inactive page produces.
   Refuse to write on it.

An unknown event type is a *different* case: firmware returns 0 and fills the buffer with the literal
string `"--[[@cb]] --[[event deprecated]]"` (`grid_ui.c:487`). Worth checking for; not expected for
events 0 and 6 on a touch element.

### `PAGESTORE / EXECUTE` — a store is not passive, and a busy store is dropped silently

`grid_decode.c:963-989` and the success callback at `:939-961`:

| Fact | Line | Consequence |
|---|---|---|
| Destination gate is `IS_ME \| IS_GLOBAL` | `:965` | The desktop's `DX/DY = -127` (global) is correct. |
| **The page stored is `grid_ui_page_get_activepage()` — the module's choice, not a parameter** | `:976` | There is nothing to get wrong. It also means PAGESTORE is genuinely a no-op for D-03 only if the RAM config equals the flash config, which the write-back guarantees. |
| **If a bulk NVM operation is already in progress, the request is dropped with `return 1` — no ACK, no NACK, nothing** | `:979-981` | A timeout is the *only* signal. A bounded retry after timeout is correct and safe (PAGESTORE is idempotent). |
| ACK is asynchronous, from `grid_protocol_nvm_store_success_callback(id)`, carrying `CLASS_PAGESTORE_LASTHEADER = id` plus a `DEBUGTEXT` class reading `"nvm store success"` | `:939-952` | Correlate on `LASTHEADER`. Expect two classes in the ACK frame. |
| Border LEDs animate yellow-dim during the store (`GRID_LED_COLOR_YELLOW_DIM`, frequency −4), cleared in the callback | `:986-987`, `:954` | The user will see it. Say so on the page so it does not read as a fault. |
| **The callback ends with `grid_ui_bulk_start_with_state(..., grid_ui_bulk_page_load, activepage, 0, NULL)` — the module reloads the page from flash, restarting the Lua VM** | `:956-960` | **This is the honest caveat on "provable no-op".** The *stored bytes* are provably identical. The *running VM* is restarted, exactly as a page change would restart it. For the factory config (dim, static) this is invisible; for an animating config it is a visible reset. Phase 7 must know this before it designs KEEP ON DEVICE. Record it in `docs/SKELETON-RESULTS.md`. |

### The pacing hypothesis, with numbers

| Layer | Size | Source |
|---|---|---|
| TinyUSB CDC RX buffer | **512 bytes** | `esp32s3/components/tinyusb/include/tusb_config.h:39` |
| Per-port ring (`swsr`) capacity | `GRID_PORT_SWSR_SIZE = GRID_PARAMETER_SPI_TRANSACTION_length * 2` = **2048 bytes** | `grid_transport.h:13`, `grid_protocol.h:129` |
| Behaviour when the ring cannot fit a whole message | `if (!grid_swsr_writable(rx, msg->length)) return;` — **the entire message is discarded, silently** | `grid_transport.c:151-153` |
| A factory-Setup `CONFIG/EXECUTE` | 690 bytes | measured |
| A budget-maximum `CONFIG/EXECUTE` | 957 bytes | measured |

So: one large config frame exceeds the CDC RX buffer and must be drained across several USB transactions;
two back-to-back large frames (1380–1914 bytes) approach and can exceed the 2048-byte ring if the port
task has not run in between. That is a concrete, falsifiable mechanism for the desktop's undocumented
`await this.sleep(10)` (`engine.store.ts:372`) and for the "the link drops requests while the module is
busy" note in `_pad.ts:3455-3459`.

**Recommended measurement, and it is better than the one the no-op run performs.** `CONFIG/FETCH`
writes nothing to the module and is 49 bytes outbound but produces a ~690-byte inbound REPORT. Run a
**burst probe**: 20 consecutive `CONFIG/FETCH` for event 0, one outstanding at a time, at 0 ms pre-send
delay and again at 10 ms, counting timeouts, NACKs, checksum failures and per-request latency. It is
completely safe (read-only), it is repeatable, and it stresses exactly the buffer the hypothesis names.
The two config writes in the no-op run are too few to measure anything.

---

## Web Serial

### Transient activation — the mechanism is expiry, not consumption

The WICG Serial spec's `requestPort()` steps say only: *"If the relevant global object of this does not
have transient activation, reject promise with a 'SecurityError' DOMException and return promise."*
There is **no** "consume user activation" step. Chromium's transient-activation lifespan is ~4900 ms.

So the accurate rule is: **an `await` before `requestPort()` is dangerous because the activation can
expire, not because the call consumes it.** A microtask is fine; a 628 KB WASM fetch on a slow
connection is not. The practical guidance is unchanged and simpler to enforce as a rule:

> **`requestPort()` is the first statement in the click handler. Nothing is awaited before it.**

For `/dev/skeleton/` specifically: a dynamic `import("$lib/protocol")` inside the click handler *before*
`requestPort()` is a network round trip on a cold cache and could plausibly exceed 4.9 s on a bad link.
**Load the modules in `onMount` and keep the reference; the click handler awaits nothing before
`requestPort()`.** This is exactly the shape `/dev/fidelity/+page.svelte:25-27` already uses, for a
different reason (prerender purity), so the two constraints agree.

### Open, close, and the read loop

Port `grid-editor/src/renderer/serialport/serial-transport.ts` structurally, with four changes:

| Desktop | Line | HANGAR |
|---|---|---|
| `port.open({ baudRate: 2000000 })` | `:54` | Add `bufferSize: 4096`. MDN's default is 255 bytes; a 690-byte REPORT would otherwise arrive as at least three chunks (PITFALLS §C12.2). |
| Local `WebSerialPort` interface | `:9-39` | Delete. Use the global `SerialPort` from `@types/w3c-web-serial`. |
| `disconnect` listener attached to the **port** only; no `connect` listener anywhere | `:58` | Attach `connect` **and** `disconnect` to `navigator.serial` as well (STACK §Decision 3 names this as the gap). |
| `close()`: `reader.cancel()` → `releaseLock()` in one `try`, then `port.close()` in another, while the read loop's own `finally` **also** calls `releaseLock()` | `:63-84`, `:175-184` | Own the ordering: keep a `Promise<void>` that resolves when the read loop exits; `cancel()` → `await that promise` → single `releaseLock()` → `close()`. The double release currently throws and is swallowed by `console.warn` (PITFALLS §C12.1). |

Keep these, unchanged, because they are correct:

- `write()` throws if `!port.writable` or `port.writable.locked`, then `getWriter()` /
  `await writer.write(data)` / `releaseLock()` in a `finally` (`:97-112`).
- The read loop starts only once a data callback is registered (`:114-120`), which avoids losing the
  first chunk.

### `open()` failure taxonomy (D-04, CONN-04, CONN-05)

| Symptom | Detection | Message |
|---|---|---|
| Port held by another program (typically Grid Editor) | `DOMException.name === "NetworkError"`; message is the literal `Failed to open serial port.` on all three platforms | Name Grid Editor, name the tray, give the CONN-04 order: quit → unplug → wait → replug → reload → connect. Match on `name`, use the message string only as a secondary signal (PITFALLS §C1). |
| User cancelled the picker | `requestPort()` rejects with `NotFoundError` | "You closed the chooser." Distinct state. |
| Unplugged between pick and open | also `NetworkError`, but `port.connected === false` | Feature-detect `connected` first. |
| No `navigator.serial` | `!("serial" in navigator)` | The degrade path the e2e asserts. |
| Not a secure context | `!isSecureContext` | Separate message (CONN-02). Reachable in practice by opening `build/index.html` from disk. |

---

## Architecture Patterns

### Recommended structure

```
src/lib/
├── protocol/
│   ├── constants.ts        # ZONA_HWCFG=161, USB ids, EVENT_SETUP=0, EVENT_TIMER=6,
│   │                       # ELEMENT_TOUCH=0, CONFIG_MAX=909, timeouts. Pure data.
│   ├── descriptors.ts      # the 4 outbound builders + the response filter each one expects
│   ├── match.ts            # matchesFilter(descr, filter, expectedId) -> "ok"|"nack"|"no"
│   ├── framing.ts          # FrameScanner class: push(chunk) -> Frame[]; cursor + ceiling
│   ├── decode.ts           # scanned frame -> DecodedFrame { ok, classes[], brc } (the !frame guard)
│   ├── index.ts            # barrel. The ONLY thing the page imports from protocol/
│   └── *.spec.ts
├── transport/
│   ├── transport.ts        # GridTransport interface (5 methods; the desktop's shape minus getInfo)
│   ├── web-serial.ts       # WebSerialTransport
│   ├── fake.ts             # FakeTransport: replays a capture, injects faults
│   ├── queue.ts            # RequestQueue. NOTE in the header: Phase 6 may move this to device/
│   ├── fixtures/
│   │   ├── synthetic-zona.json      # generated via encode_packet; NOT hardware evidence
│   │   └── zona-<date>-<arm>.json   # the real captures, after the checkpoint
│   └── *.spec.ts
src/routes/dev/skeleton/+page.svelte
e2e/skeleton.e2e.ts
docs/SKELETON-RESULTS.md
```

### Pattern 1: the frame scanner, with a cursor and a ceiling

**What:** accumulate bytes, emit complete frames, never rescan from zero, never grow without bound.

**Why not the desktop's:** `setupFrameHandler` (`serialport.ts:143-185`) rescans `rxBuffer` from index 0
on every chunk (quadratic in a long partial frame) and has no ceiling (PITFALLS §C12.3).

```ts
// Source: shape from grid-editor/src/renderer/serialport/serialport.ts:143-185,
// with the cursor and ceiling from PITFALLS C12.
const EOT = 4, LF = 10;
const MAX_BUFFER = 8192;           // ~8 max-size frames. Anything larger is not a frame.

export class FrameScanner {
  private buf: number[] = [];
  private scanned = 0;             // index already examined; never rescan below it

  push(chunk: Uint8Array): number[][] {
    for (const b of chunk) this.buf.push(b);
    const out: number[][] = [];
    let start = 0;
    // i-3 needs three bytes of context; start the scan where we left off, but
    // never closer than 3 bytes to the previous frame boundary.
    for (let i = Math.max(this.scanned, 3); i < this.buf.length; i++) {
      if (this.buf[i] === LF && this.buf[i - 3] === EOT) {
        out.push(this.buf.slice(start, i));   // frame EXCLUDES the LF, INCLUDES the checksum
        start = i + 1;
      }
    }
    this.buf = this.buf.slice(start);
    this.scanned = start > 0 ? 0 : this.buf.length;
    if (this.buf.length > MAX_BUFFER) {
      // No delimiter in 8 KB. Drop everything; a real frame will resync at the next EOT+LF.
      this.buf = [];
      this.scanned = 0;
      this.onOverflow?.();
    }
    return out;
  }
}
```

The slice bounds are load-bearing and match the desktop exactly: the emitted frame runs from the last
boundary up to but **not** including the LF, so it ends `... ETX EOT c c` — precisely what
`decode_packet_frame` expects (`dist/index.js:4030-4034` requires `array[length-3] === EOT`).

**Known limitation, shared with the desktop, worth writing down:** the delimiter is not escape-safe. A
byte 4 three positions before a byte 10 *inside* an ACTIONSTRING would split a frame early; both halves
then fail their checksum and are dropped, and the real frame is lost. Minified Lua is printable ASCII so
this cannot happen with compiler output, but it is the reason to assert ASCII before writing and the
reason the "torn frame" test exists.

### Pattern 2: `RequestQueue` — the desktop's rules, none of its machinery

Reimplement the five invariants (ARCHITECTURE §1.7), drop everything else:

| Invariant | Desktop | HANGAR |
|---|---|---|
| One outstanding request | module-global `let waiter` + a `while (...) await sleep(1)` busy-wait (`engine.store.ts:170`, `:357-370`) | A single instance field plus a promise chain. **Never busy-wait** — PITFALLS §C11 calls `sleep(1)` actively harmful in a throttled tab. |
| Pre-send gap | fixed `await sleep(10)` (`:372`) | Configurable `preSendDelayMs`, default 10, settable to 0 for the A/B. |
| NACK rejects immediately | `:401-413` | Same. Not retried. |
| HEARTBEAT never resolves a waiter | `:382-384` | Same, and checked first. |
| Timeout → retry | **unbounded recursion** (`:337`) | **Bounded: 3 attempts, then a named failure.** Backoff `120 * (i + 1)` ms to stay compatible with `_pad.ts`'s `withRetry` (`src/vendor/botor/_pad.ts:3492-3509`). |

Two additions the desktop does not have:

1. **Deadlines from `performance.now()`, not `setTimeout` duration.** A hidden tab throttles timers to
   1 Hz (PITFALLS §C11), so a `setTimeout(500)` can fire at 1000 ms and report a timeout that never
   happened. On fire, re-check `performance.now() - startedAt`; if it is short, re-arm for the
   remainder. Record `startedAt`/`resolvedAt` on every request — those are the D-08(c) latencies.
2. **An `AbortSignal`** wired to disconnect, so a mid-write unplug rejects every pending waiter with a
   distinguishable error rather than waiting out the timeout.

**Error text compatibility matters.** `_pad.ts`'s `TRANSIENT_WRITE = /interrupted|timeout|timed out|busy|no response/i`
(`:3477`) decides what Phase 7 retries. The queue's rejection messages should already match it —
suggested: `"Timed out after 500 ms waiting for CONFIG ACKNOWLEDGE"`,
`"Waiting for response was interrupted (device disconnected)"`. Reject with real `Error` instances, not
the plain `{ value, text, type }` objects the desktop runtime uses (`_pad.ts:3480-3488` documents the
pain that caused).

### Pattern 3: the page — copying `/dev/fidelity/` exactly

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  let mod: typeof import("$lib/protocol") | null = null;
  let tx:  typeof import("$lib/transport") | null = null;

  onMount(async () => {
    // Dynamic + inside onMount, exactly as /dev/fidelity/ does: at module scope the
    // SERVER build would import grid-protocol during prerender and resolve
    // @wasm-fmt/lua_fmt through its "node" condition. Harmless, meaningless, and it
    // puts grid-protocol in the prerendered page's server graph for no reason.
    mod = await import("$lib/protocol");
    tx  = await import("$lib/transport");
  });

  async function connect() {
    // FIRST statement. Transient activation expires in ~4.9 s and an await here
    // could outlast it. mod/tx are already resolved from onMount.
    const port = await navigator.serial.requestPort({
      filters: [{ usbVendorId: 0x303a, usbProductId: 0x8123 }],
    });
    await port.open({ baudRate: 2_000_000, bufferSize: 4096 });
    // ...
  }
</script>
```

Route mechanics, all already proven by `/dev/fidelity/`:

| Mechanism | Where it comes from | Note |
|---|---|---|
| Prerendered as a real file | `vite.config.ts` `prerender.entries: ["*"]` | Produces `build/dev/skeleton/index.html`. `build/dev/fidelity/` exists today, confirmed. |
| Trailing slash required | `src/routes/+layout.ts` `trailingSlash = "always"` | Playwright must navigate to `/dev/skeleton/`, with the slash. Without it the static build 404s. |
| Unlinked | nothing links to `/dev/` | `fidelity.e2e.ts:68-71` already asserts `a[href*="/dev/"]` count is 0 site-wide; it will cover this page for free. |
| Behind Basic Auth | `worker/index.js` + `run_worker_first` | The page is reachable over HTTPS on the preview URL for a real-hardware test from any machine (D-05). **But the user must deploy first — the executor never deploys** (`npm run deploy` is the user's). The alternative is `npm run preview` on `localhost`, which is also a secure context. |
| No CSP is set today | Phase 3 measurement, `docs/TESTING.md` | Nothing to do. If one is ever added it needs `'wasm-unsafe-eval'` — irrelevant here since the skeleton never loads WASM, but the note stands. |

### Pattern 4: recording every frame

An append-only array with `performance.now()` timestamps and a monotonic sequence number. **No ring
buffer** — a whole run is a few thousand entries at most (heartbeats at 4 Hz plus a handful of
transactions), and truncating the log is exactly how you lose the frame that explains the failure.
Estimated size: a 60 s run with heartbeats on is ~240 heartbeat frames × ~110 hex chars ≈ 30 KB, plus
two ~690-byte configs. Trivial.

Export via a `Blob` download (this is a normal page; no artifact sandbox applies):

```ts
const blob = new Blob([JSON.stringify(capture, null, 1)], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = Object.assign(document.createElement("a"), {
  href: url,
  download: `hangar-skeleton-${capture.run.id}-${capture.capturedAt.replace(/[:.]/g, "-")}.json`,
});
a.click();
URL.revokeObjectURL(url);
```

Four observation points, all four recorded:

| Point | Why it must be recorded separately |
|---|---|
| Outbound bytes, per `write()` call | The only record of what HANGAR actually sent. Lets a failure be replayed offline. |
| Inbound raw chunks from `reader.read()` | **The only input `FakeTransport` can replay to exercise the framing scanner.** Frames alone would make every framing test synthetic. |
| Framed packets (post-scanner, pre-decode), with `ok: true|false` | Proves the scanner's boundaries against real chunk splits, and records checksum failures the console log would otherwise own. |
| Decoded classes | Human-readable, and what the assertions read. |

### The fixture shape

One schema for both the page's export and `FakeTransport`'s input. Recommended:

```json
{
  "schema": "hangar.skeleton.capture/1",
  "source": "hardware",
  "capturedAt": "2026-09-04T18:22:31.004Z",
  "run": {
    "id": "a-hb-on-pace-10",
    "hostHeartbeat": { "enabled": true, "intervalMs": 300, "type": 255 },
    "pacing": { "preSendDelayMs": 10 },
    "timeouts": { "fetchMs": 1000, "executeMs": 500, "pagestoreMs": 3000 },
    "retries": 3,
    "userAgent": "Mozilla/5.0 ...",
    "origin": "https://hangar.<sub>.workers.dev",
    "protocolPin": "1.20260825.1135"
  },
  "identity": {
    "usbVendorId": 12346, "usbProductId": 33059,
    "sx": 0, "sy": 0, "rot": 0,
    "hwcfg": 161, "moduleType": "ZONA", "revision": "RevH",
    "firmware": { "major": 1, "minor": 5, "patch": 5 },
    "heartbeatType": 1, "activePage": 0,
    "otherModules": []
  },
  "events": [
    { "n": 0, "t": 12.4, "dir": "tx", "kind": "bytes", "hex": "010f00280..." },
    { "n": 1, "t": 13.9, "dir": "rx", "kind": "chunk", "hex": "010f0035..." },
    { "n": 2, "t": 14.0, "dir": "rx", "kind": "frame", "hex": "010f0035...", "ok": true,
      "classes": [
        { "class_name": "HEARTBEAT", "class_instr": "EXECUTE",
          "class_parameters": { "TYPE": 1, "HWCFG": 161, "VMAJOR": 1, "VMINOR": 5, "VPATCH": 5,
                                "PORTSTATE": 0, "GCCOUNT": 0 } },
        { "class_name": "PAGEACTIVE", "class_instr": "REPORT",
          "class_parameters": { "PAGENUMBER": 0 } }
      ] },
    { "n": 9, "t": 44.2, "dir": "rx", "kind": "frame", "hex": "010f...", "ok": false,
      "reason": "decode_packet_frame returned undefined" }
  ],
  "steps": [
    { "id": "fetch-timer", "descr": "CONFIG/FETCH ev6", "requestId": 3,
      "sentAt": 120.2, "settledAt": 131.4, "latencyMs": 11.2,
      "attempts": 1, "outcome": "ok", "matchedOn": ["class","instr","SX","SY","PAGENUMBER","ELEMENTNUMBER","EVENTTYPE"] },
    { "id": "restore-page-change", "descr": "HEARTBEAT/EXECUTE TYPE 255", "outcome": "sent" }
  ],
  "burst": { "preSendDelayMs": 0, "n": 20, "timeouts": 0, "nacks": 0,
             "latencyMs": { "min": 8.1, "p50": 9.4, "max": 31.7 } },
  "results": {
    "setupBefore": "--[[@cb]]...", "timerBefore": "--[[@cb]]...",
    "setupAfter":  "--[[@cb]]...", "timerAfter":  "--[[@cb]]...",
    "byteIdentical": true
  }
}
```

Design notes the planner should lock in:

- **`t` is `performance.now()` milliseconds** with the fractional part kept. `Date.now()` is
  millisecond-granular and useless for a 9 ms ACK.
- **`FakeTransport` reads only `events[].dir === "rx" && kind === "chunk"`** and replays them at their
  recorded inter-arrival deltas (or instantly, in a `speed: "instant"` mode, for fast unit tests). The
  `frame` and `classes` entries exist for assertions, not for replay. This is what makes the framing
  tests use real chunk boundaries.
- **`source` distinguishes `"synthetic"` from `"hardware"`.** Before the hardware checkpoint the tests
  run against `synthetic-zona.json`, generated by encoding real descriptors through
  `grid.encode_packet` — genuine bytes, invented content and timing. A spec should assert that at least
  one committed fixture has `"source": "hardware"` **after** the checkpoint task, so nobody can ship the
  phase on synthetic data alone.
- **One file per A/B arm.** Four arms if both toggles are crossed (hb on/off × pace 10/0); at minimum
  the two heartbeat arms plus the burst probe at both pacings.

### `FakeTransport` fault injection

```ts
export type Fault =
  | { kind: "drop";       match: { class_name: string; class_instr: string }; nth?: number }
  | { kind: "delay";      match: { class_name: string; class_instr: string }; byMs: number }
  | { kind: "disconnect"; afterTxFrames: number }
  | { kind: "corrupt";    match: { class_name: string }; nth?: number }   // flip a checksum char
  | { kind: "truncate";   afterRxBytes: number };                          // stop mid-frame
```

The five tests that matter, each naming the invariant it pins:

| Test | Fault | Asserts |
|---|---|---|
| One outstanding request | none; enqueue two requests at once | the second `write()` is not observed until the first settles |
| Bounded retry | `drop` the `CONFIG/ACKNOWLEDGE` every time | exactly **3** `write()` calls, then a rejection whose message matches `TRANSIENT_WRITE`, and **no fourth** |
| Honest timeout | `delay` the ACK to `timeout + 50 ms` | rejects; and with `delay` at `timeout - 50 ms` it resolves — proving the boundary is the deadline, not the arrival order |
| Disconnect mid-write | `disconnect` after 1 tx frame | the pending waiter rejects with a named disconnect error, the queue drains, no unhandled rejection |
| NACK is not retried | replay a `CONFIG/NACKNOWLEDGE` with the matching `LASTHEADER` | exactly **1** `write()` call, immediate rejection |

### Frame-scanner test inputs

Derive every one from a **real** captured frame (or a real `encode_packet` output before the
checkpoint), so no test invents bytes:

| Input | Expectation |
|---|---|
| whole frame in one chunk | 1 frame, buffer empty |
| **every** split point `1..len-1`, one property test | always exactly 1 frame, always byte-identical to the whole-chunk result |
| split at `len-1` (LF alone in the second chunk) | 1 frame — the `i-3` lookback must survive the boundary |
| split at `len-3` (EOT alone in the second chunk) | 1 frame |
| three frames coalesced into one chunk | 3 frames, in order |
| two frames plus a trailing partial | 2 frames, the partial retained |
| leading garbage before the first SOH | the garbage lands inside the first emitted "frame", `decode_packet_frame` returns `undefined`, the scanner keeps going and the **second** frame decodes cleanly (this is the resync property) |
| a frame with one checksum char flipped | scanner emits it, decoder returns `undefined`, nothing reaches the queue, the next frame still decodes |
| 8 KB with no delimiter | buffer resets, `onOverflow` fires once, a following good frame decodes |

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Packet encode/decode, checksum, hex field packing | Your own writer | `grid.encode_packet` / `decode_packet_frame` / `decode_packet_classes` | The field offsets are generated from `grid-fw`. Hand-rolling forks them from the firmware silently. This is the whole reason FOUND-03 pins the version. |
| The 909 cap | A constant | `grid.getProperty("CONFIG_LENGTH")` | Same table, same source of truth. It is 909 today, and a bump is a `docs/PIN-POLICY.md` event. |
| The `VERSIONMAJOR/MINOR/PATCH` triple on every CONFIG | Literals | `grid.getProperty("VERSION")` | `{1,5,5}` today. `instructions.ts:87-89` does exactly this. |
| ZONA identification | `if (hwcfg === 161)` | `grid.module_type_from_hwcfg(Number(hwcfg)) === ModuleType.ZONA`, then `module_hwcfgs().find(e => Number(e.hwcfg) === hwcfg)` for the revision | Survives a new ZONA revision with a different hwcfg. Both coercions are required (see the number/string trap). |
| Event numbers | `0` and `6` inline | `EventTypeToNumber(EventType.SETUP)` / `(EventType.TIMER)`, cross-checked against `get_element_events(ElementType.TOUCH)` | Cheap, and it fails loudly if the table ever changes. |
| Web Serial typings | A local `WebSerialPort` interface (`serial-transport.ts:9-39`) | `@types/w3c-web-serial` — already installed, already in `tsconfig` | The hand-rolled one is missing `connected`, `forget`, `getPorts` and `Serial`. |
| Retry / partial-write semantics | A fresh policy | The shapes in `src/vendor/botor/_pad.ts:3460-3509` (`PadPartialWriteError`, `isTransient`, `withRetry`) | Phase 7 will drive the queue through `writePad`. Producing incompatible error text now means rewriting it then. Do not *import* them (D-05 forbids the vendored tree); do match the text. |
| A "Web Serial polyfill" or WebUSB fallback | Anything | Feature detection plus the honest degrade | STACK §Decision 3: no polyfill can exist, and WebUSB buys zero new browsers and breaks on Windows. |
| Discovering the active page | A `PAGEACTIVE/FETCH` | The `PAGEACTIVE/REPORT` class riding on every `TYPE 1` heartbeat | `PAGEACTIVE/FETCH` does not exist in the protocol package or in firmware's decode switch. |

**Key insight:** every custom solution in this domain forks a table that is generated from firmware.
The one thing that is genuinely HANGAR's to write is the *policy* — one outstanding request, bounded
retry, honest deadlines, refuse-before-write — and that is exactly the 200 lines this phase produces.

---

## Common Pitfalls

### Pitfall 1: porting `class_array !== false`

**What goes wrong:** `decode_packet_frame` returns `undefined`, so `!== false` is always true and a
corrupt frame reaches the consumer.
**Why it happens:** the desktop wrote the guard against a documented-but-wrong return value, and it has
never fired.
**How to avoid:** `if (!frame) { record({ ok: false }); continue; }` before `decode_packet_classes`.
**Warning sign:** a spec that asserts `=== false` anywhere. Add a spec that feeds a checksum-corrupted
real frame through the decode path and asserts nothing reaches the queue.

### Pitfall 2: matching `LASTHEADER` on a `CONFIG/REPORT`

**What goes wrong:** `LASTHEADER` and `VERSIONMAJOR` share offset 5. A REPORT decodes `LASTHEADER === 1`
(the firmware protocol major) for every request, so a matcher comparing it to the request id rejects
every fetch — or, worse, accepts one by coincidence when the id happens to be 1.
**How to avoid:** apply the id check only when `class_instr` is `ACKNOWLEDGE` or `NACKNOWLEDGE`.
**Warning sign:** the very first FETCH works (id 1) and the second times out.

### Pitfall 3: taking `classes[0]`

**What goes wrong:** the `PAGEACTIVE/REPORT` riding on the heartbeat is silently dropped (so D-10 never
gets its page number), and the `PAGESTORE/ACKNOWLEDGE` is missed because `DEBUGTEXT` happened to be
first in the block order.
**How to avoid:** always `for (const c of frame.classes)`.
**Warning sign:** "the page number never arrives" or "PAGESTORE always times out but the LEDs flashed".

### Pitfall 4: `ACTIONLENGTH` off by one

**What goes wrong:** firmware checks `script[scriptlength] === ETX` and NACKs otherwise. Sending
`config.length + 1` or a length computed from a byte count after some transform is an unconditional NACK
with no other diagnostic.
**How to avoid:** `ACTIONLENGTH: config.length`, from the same string in the same expression as
`ACTIONSTRING: config`. Assert `/^[\x20-\x7e]*$/` on the string first — a multi-byte character makes
`.length` (UTF-16 units) disagree with the bytes `encode_packet` writes.

### Pitfall 5: the write that disables page change

**What goes wrong:** a heartbeat-off run leaves the user's ZONA with `page_change_enabled = 0`
permanently (until power cycle). No error, no symptom on the wire, discovered days later when the page
button stops working.
**How to avoid:** every run ends with one `HEARTBEAT/EXECUTE TYPE 255`, in both arms, logged as its own
step. Never send `TYPE 254`.
**Warning sign:** none on the wire. This is why it has to be designed in rather than tested for.

### Pitfall 6: assuming a store is passive

**What goes wrong:** `PAGESTORE` reloads the page from flash and restarts the Lua VM
(`grid_decode.c:960`). "Provable no-op" is a claim about the stored bytes, not about the running VM.
**How to avoid:** say exactly that in `docs/SKELETON-RESULTS.md` and on the page. With D-02's static
factory config it is invisible; Phase 7 needs to know it is not.

### Pitfall 7: a busy-wait or a `setInterval` chain in the transport

**What goes wrong:** PITFALLS §C11 — Chrome throttles hidden-tab timers to 1 Hz and, after 5 minutes,
to 1/min; a chain of ≥5 `setInterval`s is one of the intensive-throttling triggers. The desktop's
`while (...) await this.sleep(1)` becomes a 1-second-per-iteration spin.
**How to avoid:** event-driven queue; deadlines measured with `performance.now()`; the 300 ms heartbeat
as a self-rescheduling `setTimeout`, not `setInterval`. For this phase, also: **the page should say
"keep this tab in front"** and the run script should note whether the tab was ever backgrounded, because
that would invalidate a latency measurement.

### Pitfall 8: `port.open()` succeeding while Grid Editor is running

It cannot — Chromium takes the port exclusively on all three platforms (PITFALLS §C1). But the reverse
also holds: **once `/dev/skeleton/` holds the port, Grid Editor cannot connect.** Close the port on
`pagehide` and on `visibilitychange → hidden` after an idle timeout, or the user's next Editor session
fails mysteriously.

### Pitfall 9: the console noise that fails an e2e

`@intechstudio/grid-protocol` logs `HEARTBEAT_INTERVAL 250000 250` at module scope
(`dist/index.js:3709`), and `decode_packet_frame` logs every rejected frame. Both are `console.log`.
Any Playwright assertion must filter to `msg.type() === "error"` — the existing `fidelity.e2e.ts:36`
already does, so copy it rather than writing a fresh one.

### Pitfall 10: the fixture path that does not exist yet

**What goes wrong:** a task writes `FakeTransport` tests against `fixtures/zona-*.json` before the
hardware run, and the whole wave is blocked on a human.
**How to avoid:** sequence it explicitly — synthetic fixture first, hardware checkpoint, then a task
that swaps the fixture in and adds the hardware-only assertions. Both fixtures share one schema, so the
swap is a filename.

---

## Code Examples

### Building and sending a CONFIG/FETCH, with the id captured

```ts
// Source: grid-editor/src/renderer/serialport/instructions.ts:66-116 (payload),
//         grid-editor/src/renderer/runtime/engine.store.ts:241-262 (send).
import { grid } from "@intechstudio/grid-protocol";

const V = grid.getProperty("VERSION");            // { MAJOR: 1, MINOR: 5, PATCH: 5 }

export function fetchConfig(sx: number, sy: number, page: number, event: 0 | 6) {
  return {
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "CONFIG",
      class_instr: "FETCH",
      class_parameters: {
        VERSIONMAJOR: V.MAJOR, VERSIONMINOR: V.MINOR, VERSIONPATCH: V.PATCH,
        PAGENUMBER: page, ELEMENTNUMBER: 0, EVENTTYPE: event,
        ACTIONLENGTH: 0,
      },
    },
    filter: {
      brc_parameters: { SX: sx, SY: sy },
      class_name: "CONFIG",
      class_instr: "REPORT",
      // NO LASTHEADER here: offset 5 is VERSIONMAJOR on a REPORT.
      class_parameters: { PAGENUMBER: page, ELEMENTNUMBER: 0, EVENTTYPE: event },
    },
    timeoutMs: 1000,
  };
}

// The send. encode_packet returns the ID it assigned; capture it BEFORE the write.
const encoded = grid.encode_packet(descr);
if (!encoded) throw new Error("encode_packet returned undefined");
encoded.serial.push(10);                          // the LF. encode_packet does NOT add it.
const requestId = encoded.id;                     // 1..255, use for ACK/NACK LASTHEADER
await transport.write(new Uint8Array(encoded.serial));
```

### Reading identity out of one inbound frame

```ts
// Source: grid-editor/src/renderer/runtime/runtime.ts:2365-2418 (create_module),
//         grid-fw/common/src/c/grid_transport.c:199-203 (the PAGEACTIVE piggyback).
for (const c of frame.classes) {
  if (c.class_name === "HEARTBEAT") {
    const hwcfg = Number(c.class_parameters.HWCFG);
    const type  = grid.module_type_from_hwcfg(hwcfg);              // needs a NUMBER
    const entry = grid.module_hwcfgs().find(e => Number(e.hwcfg) === hwcfg);  // stores a STRING
    seen.set(`${c.brc_parameters.SX},${c.brc_parameters.SY}`, {
      sx: c.brc_parameters.SX, sy: c.brc_parameters.SY, rot: c.brc_parameters.ROT,
      hwcfg, moduleType: type, revision: entry?.revision,
      heartbeatType: c.class_parameters.TYPE,      // 1 = the USB-attached module, 0 = a chained one
      firmware: { major: c.class_parameters.VMAJOR,
                  minor: c.class_parameters.VMINOR,
                  patch: c.class_parameters.VPATCH },
      lastSeen: performance.now(),
    });
  }
  if (c.class_name === "PAGEACTIVE" && c.class_instr === "REPORT") {
    activePage = c.class_parameters.PAGENUMBER;    // D-10's answer, four times a second
  }
}
```

### The write-back, in D-11's order

```ts
// Source: src/vendor/botor/_pad.ts:3898-3936 (order and retry policy; NOT imported - D-05).
// Timer (6) first, then Setup (0). Sequential, never Promise.all. Each awaits its own ACK.
await queue.request(sendConfig(sx, sy, page, 6, timerBefore));   // 500 ms, 3 attempts
await queue.request(sendConfig(sx, sy, page, 0, setupBefore));   // 500 ms, 3 attempts
// Only now, and only on a separate click:
await queue.request(storePage());                                // 3000 ms, global broadcast
// Then, unconditionally, in both A/B arms:
await queue.sendImmediate(heartbeat(255));                       // restores page_change_enabled
```

---

## Runtime State Inventory (device-side)

Not a rename phase, but this phase writes to hardware, so the same question applies in its device form:
**after the tab is closed, what state does the ZONA still carry that the run put there?**

| Category | What this run changes | Action required |
|---|---|---|
| **Module RAM (live Lua VM)** | `CONFIG/EXECUTE` re-registers the same script and calls `grid_ui_process_single` (`grid_decode.c:1286-1287`) — the event handler is re-run. Byte-identical config, freshly executed. | None. It is the same script. Note in `SKELETON-RESULTS.md` that "no-op" means byte-identical config, not "the VM was never touched". |
| **Module flash (NVM)** | `PAGESTORE` writes the active page. One erase/program cycle. Contents identical to what was there. | None. D-03 accepted the cycle. |
| **`grid_ui_state.page_change_enabled`** | **Set to 0 by the CONFIG write** (`grid_decode.c:1279`) and never restored automatically. | **Send `HEARTBEAT/EXECUTE TYPE 255` at the end of every run.** Mandatory in both arms. |
| **`grid_sys_state.editor_connected`** | Set to 1 by any host heartbeat (`grid_decode.c:723-727`); cleared 2 s after the last one (`grid_esp32_port.c:473-481`). Only gates LEDPREVIEW. | None — it self-clears. Worth recording in the run when the `EDITOR TIMEOUT` transition would have occurred. |
| **Module heartbeat type** | Set to 1 on USB connect by the module itself; HANGAR never changes it. | None. |
| **Browser-side permission grant** | `requestPort()` grants this origin access to that port; it appears in `chrome://settings/content/serialPorts` and may persist across restarts (PITFALLS §C10 — MEDIUM confidence on persistence). | None this phase. `forget()` is Phase 6 (deferred). Mention it in `SKELETON-RESULTS.md` so the user knows the grant exists. |
| **The OS port lock** | Held for as long as the port is open; Grid Editor cannot connect meanwhile. | Close on `pagehide`. Say so on the page. |
| **HANGAR repository state** | New source files, a new route, new fixtures, `docs/SKELETON-RESULTS.md`. `build/` is gitignored. | Normal commits. Nothing outside `hangar/`. |

Verified as **nothing found**: no `localStorage`/`sessionStorage` writes (snapshot persistence is Phase 7,
deferred), no secrets or env vars (the skeleton reads none; `.dev.vars` is untouched), no OS-registered
state, no build artifacts that carry a stale identifier, no new dependency and therefore no lockfile
change.

---

## Environment Availability

Probed on this machine on 2026-09-03.

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node | everything | ✓ | v24.14.0 (`engines: >=24`) | — |
| npm | everything | ✓ | 11.9.0 | — |
| `@intechstudio/grid-protocol` | protocol descriptors | ✓ | 1.20260825.1135 (exact pin) | — |
| `@types/w3c-web-serial` | Web Serial typings | ✓ | 1.0.8, already in `tsconfig.types` | — |
| Vitest | unit specs | ✓ | 4.1.8, two projects configured | — |
| Playwright | degrade e2e | ✓ | 1.62.1, Chromium 151.0.7922.34 installed | — |
| wrangler | `npm run preview` harness | ✓ | 4.128.0 | `npx sirv-cli build` (loses the auth-gate coverage) |
| `.dev.vars` | Basic Auth for the local harness | ✓ | present | — |
| `build/` | Playwright target | ✓ | present, contains `build/dev/fidelity/` | rebuilt by `npm run preview` |
| grid-editor clone (read-only) | instruction payloads | ✓ | clean apart from the user's two PROTECTED files | the citations in this document |
| grid-fw clone (read-only) | firmware truths | ✓ | clean | the citations in this document |
| **A physical ZONA on a USB cable** | criteria 1–4 | **user-owned** | — | **None. Criteria 1–4 cannot be automated.** |
| **A Web-Serial-capable browser at the user's desk** | criteria 1–4 | assumed (Chrome/Edge/Firefox 151+) | — | none |
| **A deployed preview URL over HTTPS** | testing from another machine | **only the user can create it** | — | `npm run preview` on `localhost` (a secure context) — the executor can do this, the user still runs the hardware |
| **Grid Editor installed, to test D-04** | the port-conflict message | assumed on the user's machine | — | skip that checklist row and mark it untested |

**Missing dependencies with no fallback:** the ZONA itself. Every hardware criterion is a human
checkpoint. **Missing with fallback:** the HTTPS preview URL — `localhost` works and the executor can
serve it.

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|---|---|
| Unit framework | Vitest 4.1.8, two projects (`server`, `sweep`), node environment |
| Config file | `vite.config.ts` (`test.projects`); `expect.requireAssertions: true` is inherited by both |
| Browser framework | Playwright 1.62.1 over `build/` served by `worker/index.js` under `wrangler dev` |
| Browser config | `playwright.config.ts`; `webServer: npm run preview`; credentials from `.dev.vars` |
| Quick run | `npm run test:quick` — the `server` project. Baseline today: 11 files, 352 passed + 1 todo, ~6 s wall |
| Wave run | `npm run check && npm run lint && npm run test:quick && npm run test:sweep` |
| Full suite | the above plus `npm run test:e2e` (baseline 8 tests, ~12 s) |

New specs go in `src/lib/protocol/` and `src/lib/transport/`; the `server` project's include is
`src/**/*.{test,spec}.{js,ts}` so they are picked up with no config change. The `sweep` project is
excluded **by file name** and is unaffected.

### Phase Requirements → Test Map

| Req / criterion | Behaviour | Test type | Automated command | File exists? |
|---|---|---|---|---|
| FOUND-01 / descriptors | The four outbound descriptors carry exactly the desktop's parameter names and values; `PAGESTORE` is global, `CONFIG` is addressed | unit | `npx vitest run --project server src/lib/protocol/descriptors.spec.ts` | ❌ Wave 1 |
| FOUND-01 / descriptors | `encode_packet` of each descriptor round-trips through `decode_packet_frame`+`decode_packet_classes` to the same parameters; frame length is `49 + ACTIONLENGTH` for CONFIG/EXECUTE | unit | same file | ❌ Wave 1 |
| FOUND-01 / never-send | `PAGEACTIVE/EXECUTE`, `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD` appear nowhere under `src/lib/` | unit (structural, `config-shape.spec.ts` style) | `npx vitest run --project server src/lib/protocol/forbidden-instructions.spec.ts` | ❌ Wave 1 |
| FOUND-01 / framing | The nine scanner inputs in §Frame-scanner test inputs, over real bytes | unit | `npx vitest run --project server src/lib/protocol/framing.spec.ts` | ❌ Wave 1 |
| FOUND-01 / decode guard | A checksum-corrupted real frame yields `undefined` and never reaches the queue; the guard is truthiness, not `!== false` | unit | `npx vitest run --project server src/lib/protocol/decode.spec.ts` | ❌ Wave 1 |
| FOUND-01 / matcher | HEARTBEAT never resolves; BRC gate; NACK rejects; `LASTHEADER` used on ACK/NACK and **not** on REPORT | unit | `npx vitest run --project server src/lib/protocol/match.spec.ts` | ❌ Wave 1 |
| SAFE-07 mechanism | "Acknowledged" requires a matching ACK frame; a resolved `write()` alone never resolves a request | unit (FakeTransport) | `npx vitest run --project server src/lib/transport/queue.spec.ts` | ❌ Wave 2 |
| SAFE-09 mechanism | Bounded retry: exactly 3 `write()` calls on a dropped ACK, then a named rejection | unit (FakeTransport, `drop`) | same file | ❌ Wave 2 |
| SAFE-09 mechanism | Disconnect mid-write rejects the pending waiter with a distinguishable error; no unhandled rejection | unit (FakeTransport, `disconnect`) | same file | ❌ Wave 2 |
| FOUND-01 / one-outstanding | Two enqueued requests produce a second `write()` only after the first settles | unit | same file | ❌ Wave 2 |
| FOUND-01 / honest deadline | ACK at `timeout − 50 ms` resolves; at `timeout + 50 ms` rejects | unit (FakeTransport, `delay`) | same file | ❌ Wave 2 |
| D-09 refusal | Write buttons stay disabled when a fetch returned an empty/undecodable ACTIONSTRING or one ≥ 909 chars | unit (pure guard function) | `npx vitest run --project server src/lib/protocol/write-guard.spec.ts` | ❌ Wave 2 |
| D-05 "bare" | `/dev/skeleton/+page.svelte`'s import specifiers ⊆ `{svelte, $lib/protocol, $lib/transport}`; no `$lib/pad`, no `src/vendor` | unit (structural) | `npx vitest run --project server src/lib/config-shape.spec.ts` (extend) | ✅ extend |
| DEGR / route health | With `Navigator.prototype.serial` deleted the page explains itself and shows no connect control | e2e | `npx playwright test e2e/skeleton.e2e.ts` | ❌ Wave 3 |
| Criterion 5 (WASM half) | Already answered by Phase 3 | e2e (existing) | `npx playwright test e2e/fidelity.e2e.ts` | ✅ exists |
| Build shape | `build/dev/skeleton/index.html` exists after a build | build | `npm run build && test -f build/dev/skeleton/index.html` | ✅ command |
| Type/lint health | 0 errors, 0 warnings; Prettier + ESLint clean | static | `npm run check && npm run lint` | ✅ exists |
| **D-07 fixture is real** | At least one committed fixture has `"source": "hardware"` and a non-empty `identity.moduleType === "ZONA"` | unit | `npx vitest run --project server src/lib/transport/fixtures.spec.ts` | ❌ Wave 4 (post-checkpoint) |
| **D-08 results doc** | `docs/SKELETON-RESULTS.md` exists, answers (a)–(f), contains no `TBD`, and every answer cites a fixture filename | unit (structural, `licence-notices.spec.ts` style) | `npx vitest run --project server src/lib/skeleton-results.spec.ts` | ❌ Wave 4 (post-checkpoint) |

### Manual-Only: criteria 1–4

Web Serial cannot be automated (STACK §Decision 6: "say it plainly"). These four are the user's, in one
sitting, with the ZONA on the desk. **Preconditions, stated so a failure is not misdiagnosed:**

- Grid Editor **fully quit** — tray icon → Quit, not just the window closed (PITFALLS §C1).
- The module carries its **factory configuration** (D-02).
- Only the ZONA is attached — no other Grid module (D-12 will otherwise disable the store button, which
  is correct but ends the run early).
- The page is served over HTTPS (the deployed preview URL) **or** `http://localhost` via
  `npm run preview`. **Never `file://`** — it is not a secure context and `navigator.serial` is simply
  absent, which reads as a broken page.
- Keep the tab in the foreground for the whole run (PITFALLS §C11).
- Chrome, Edge, or Firefox 151+. On Firefox, expect a **site-permission add-on prompt before** the port
  chooser — that is normal, not an extension install.

| # | Criterion | Exact steps | Pass |
|---|---|---|---|
| **0** | *(precondition, D-04)* The port-conflict message | With Grid Editor **running**, click CONNECT, pick the ZONA. | The page names Grid Editor and shows the recovery order (quit → unplug → wait → replug → reload → connect). Not a raw `Failed to open serial port.` Then quit the Editor and continue. |
| **1** | Connect + identify | Click CONNECT. In the chooser, confirm **only the ZONA is offered**. Pick it. | The picker lists one device (VID `0x303a` / PID `0x8123`); no bootloader entry. Within ~1 s the page shows `ZONA`, revision `RevH`, firmware `M.m.p`, `SX/SY`, heartbeat `TYPE 1`, and an active page number. |
| **2** | Fetch | Click FETCH. | Both strings appear verbatim, with their character counts. Neither is empty; neither is ≥ 909. Setup should be several hundred characters (the factory default is 641), Timer short (22). Each fetch shows an ACK latency in ms. |
| **3** | Write back + store | Click WRITE BACK (Timer first, then Setup — the page shows the order). Then click **STORE TO FLASH — writes the config that is already there**. | Three ACKs, each with a latency and each reported separately. The module's border LEDs animate yellow-dim during the store and settle. No NACK. No retry, or at most a retry that then succeeds. |
| **4** | Re-fetch proves byte identity | Click FETCH again. | The page reports **byte-identical: yes** for both events, comparing the re-fetched strings to the ones captured in step 2. |
| **A/B-1** | Heartbeat off | Reload. Set **host heartbeat: OFF**. Repeat steps 1–4. | Record whether inbound heartbeats keep arriving for ≥ 10 s and whether all three ACKs still arrive. |
| **A/B-2** | Pacing burst | On each arm, click RUN BURST PROBE at 10 ms and at 0 ms. | 20 read-only `CONFIG/FETCH` each. Record timeouts, NACKs and latency spread. |
| **R** | Restore | The page sends one `HEARTBEAT TYPE 255` at the end of every run automatically and says so. | Confirm the page reports `page change restored`. |
| **E** | Export | Click EXPORT JSON on each arm. Hand the files back. | One JSON per arm, plus the burst results. |

The executor waits at a checkpoint, then writes `docs/SKELETON-RESULTS.md` from the JSON, commits the
captures under `src/lib/transport/fixtures/`, and re-points `FakeTransport` at the real ones.

### Sampling Rate

- **Per task commit:** `npm run test:quick` (~6 s), plus `npm run lint` when a source file changed.
- **Per wave merge:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **Phase gate:** all of the above plus `npm run test:e2e` and `npm run build` with the
  `build/dev/skeleton/index.html` check, then the hardware checklist, then the post-checkpoint wave
  green.

### Wave 0 Gaps

None. The framework, both Vitest projects, Playwright, the wrangler harness, `.dev.vars` and the
`@types/w3c-web-serial` wiring are all in place and green (`353 FILES 0 ERRORS`). No install, no config
change, no new fixture directory conventions beyond `src/lib/transport/fixtures/`.

**One sequencing constraint the planner must honour:** every fixture-backed test is written against
`synthetic-zona.json` first and only re-pointed after the human checkpoint. A plan that puts
`fixtures.spec.ts` before the checkpoint blocks its own wave on a person.

**One naming constraint, inherited:** no Playwright test title may contain the word `failed` — the e2e
gate greps the captured `.tmp-e2e/` log for it (Phase 3 decision).

---

## Open Questions

1. **Is the outbound host heartbeat required for the write cycle?**
   - What we know: the module heartbeats on an unconditional 250 ms timer; `editor_connected` gates
     only LEDPREVIEW; nothing in the `CONFIG` or `PAGESTORE` decode paths consults it. Prediction:
     **not required**, HIGH confidence from source.
   - What's unclear: whether USB CDC flow control or some ESP32-side power/idle behaviour changes when
     no host traffic arrives for tens of seconds. Nothing in the tree suggests it does; it was not
     exhaustively searched.
   - Recommendation: define "required" **before the run, in the page text**, as: *with the host
     heartbeat off, within a 10 s window from connect, (i) inbound HEARTBEAT frames arrive at ≥ 3/s,
     (ii) both `CONFIG/FETCH` return a REPORT within 1000 ms, (iii) both `CONFIG/EXECUTE` return an
     ACKNOWLEDGE within 500 ms, and (iv) `PAGESTORE` returns an ACKNOWLEDGE within 3000 ms. If all four
     hold, it is not required.* Regardless of the outcome, send the closing `TYPE 255`.

2. **Is the 10 ms pre-send sleep load-bearing at 2 Mbaud?**
   - What we know: a 512-byte CDC RX buffer, a 2048-byte port ring, and a silent whole-message drop when
     the ring cannot fit. Config frames are 690–957 bytes. The mechanism is plausible and specific.
   - What's unclear: whether the ESP32 port task drains fast enough in practice that the gap never
     matters. Unmeasurable without hardware.
   - Recommendation: the 20-request read-only burst probe at 0 ms and 10 ms, on both heartbeat arms.
     Report timeouts, NACKs and latency percentiles. If 0 ms shows zero failures across 20 requests on
     both arms, HANGAR can drop the gap; if it shows even one, keep 10 ms and say why.

3. **What are the real ACK latencies, and are the desktop's timeouts honest?**
   - What we know: the desktop uses 250 ms (FETCH, by accident — it never sets `responseTimeout`),
     500 ms (EXECUTE), 3000 ms (PAGESTORE). Flash programming genuinely takes time; 250 ms for a
     690-byte REPORT at 2 Mbaud has no headroom for a busy module.
   - Recommendation: start at 1000 / 500 / 3000 as D-08 proposes, measure, and set the shipped values in
     `SKELETON-RESULTS.md` at roughly 10× the observed p99 for the fast paths.

4. **Does a factory ZONA's fetched Setup match the package's `defaultConfig` (641 chars)?**
   - What we know: firmware regenerates the default when `cfg_default_flag` is set (`grid_ui.c:491-493`),
     and the package ships a 641-char default for the touch INIT event. They *should* agree.
   - What's unclear: whether the shipping units carry a factory-written config rather than the flag.
   - Recommendation: record the observed lengths in `SKELETON-RESULTS.md` and note whether they match.
     A mismatch is interesting, not a failure — the run echoes whatever it fetched.

5. **Does serial-port permission persist across a browser restart for a ZONA?**
   - PITFALLS §C10 flags this as MEDIUM/LOW (sources conflict; persistence may depend on a distinguishing
     USB serial-number descriptor, which was not found in `grid-fw`'s ESP32 tree).
   - Recommendation: **out of scope for this phase** (deferred to Phase 6 with `getPorts()`), but the
     run costs nothing to check: after the run, restart the browser, reopen the page, call
     `navigator.serial.getPorts()` and record the array length. One line in `SKELETON-RESULTS.md` that
     saves Phase 6 an experiment.

6. **Where does `RequestQueue` finally live?**
   - `src/lib/transport/queue.ts` this phase; ARCHITECTURE §3.3 wants `device/queue.ts`. The move is
     Phase 6's call. Record the reasoning in the file header so it is a decision, not a drift.

---

## Sources

### Primary (HIGH confidence — read from local source, line-verified)

- `hangar/node_modules/@intechstudio/grid-protocol/dist/index.js` @ `1.20260825.1135` —
  `encode_packet` (`:3925-3998`), `decode_packet_frame` (`:4000-4079`), `decode_packet_classes`
  (`:4082-4114`), `module_type_from_hwcfg` (`:3897`), `module_hwcfgs` (`:4154`), `getProperty`
  (`:3893`), the field-offset tables (`:3436-3471`), the read/write hex+string helpers (`:3473-3510`),
  `utility_genId` (`:3524`), `HWCFG` numeric coercion (`:3705`), `SESSION` (`:3876`)
- `hangar/node_modules/@intechstudio/grid-protocol/dist/grid-protocol.d.ts` — the exported surface
- `hangar/node_modules/@types/w3c-web-serial/index.d.ts` @ `1.0.8` — the four typing facts
- Executed against the installed package in Node: parameter tables, frame lengths, an encode/decode
  round trip, the `LASTHEADER`/`VERSIONMAJOR` offset collision, `module_type_from_hwcfg(161)` vs
  `("161")`, the 641/22-char touch defaults, and the `undefined`-not-`false` failure return
- `grid-editor/src/renderer/serialport/instructions.ts` — `SendHeartbeatImmediate` `:28-64`,
  `FetchConfig` `:66-116`, `SendConfig` `:118-178`, `ChangePage` `:224-246`, `StorePage` `:341-370`
- `grid-editor/src/renderer/runtime/engine.store.ts` — enums `:18-39`, `BufferElement` `:41-90`,
  `ResponseWaiter` `:114-168`, module-global `waiter` `:170`, `sendDataToGrid` `:241-262` (LF at `:250`),
  `sendToGrid` `:305-349` (250 ms default `:318`, unbounded retry `:337`), `processElement` `:351-375`
  (busy-wait `:357-370`, `sleep(10)` `:372`), `validate_incoming` `:377-434`
- `grid-editor/src/renderer/serialport/serialport.ts` — `getSerialFilter` `:27`, `setupFrameHandler`
  `:143-185` (the `!== false` bug at `:170-173`), `tryConnectSerial` `:196-206`
- `grid-editor/src/renderer/serialport/serial-transport.ts` — the whole file, 186 lines
- `grid-editor/src/renderer/serialport/transport.ts` — the `GridTransport` interface `:11-64`
- `grid-editor/src/renderer/runtime/runtime-manager.store.ts` — `:42-43` heartbeat constants,
  `:231-260` editor heartbeat handler
- `grid-editor/src/renderer/runtime/runtime.ts` — `incoming_heartbeat_handler` `:2118`, `create_module`
  `:2365-2418`, `isAlive` `:2420-2430`
- `grid-editor/src/renderer/serialport/message-stream.store.ts` — `deliver_inbound` `:208-408`
- `grid-fw/common/src/c/grid_protocol.h` — `:116` heartbeat interval, `:127` ACTIONSTRING maxlength,
  `:129` SPI transaction length, `:142-144` destination constants, `:181` BRC frame template,
  `:1020-1025` PAGEACTIVE
- `grid-fw/common/src/c/grid_decode.c` — `grid_check_destination` `:37-53`, PAGEACTIVE `:302-340`,
  heartbeat `:689-735` (`page_change_enabled` at `:717`), store callback `:939-961`, PAGESTORE
  `:963-1010`, CONFIG `:1241-1360` (`page_change_enabled = 0` at `:1279`, LASTHEADER at `:1307`)
- `grid-fw/common/src/c/grid_transport.c` — `grid_transport_heartbeat` `:173-208` (PAGEACTIVE piggyback
  `:199-203`), silent ring drop `:151-153`
- `grid-fw/common/src/c/grid_ui.c` — `page_change_enabled` init `:79`, getter `:366`,
  `recall_configuration` `:464-501`, LEDPREVIEW gate `:746-748`
- `grid-fw/common/src/c/grid_lua_api.c` — `gpl` gate `:1692-1697`
- `grid-fw/common/src/c/grid_msg.c` — `init_brc` `:279-288`, `close_brc` `:290-301`,
  `grid_str_transform_brc_params` `:466-521`
- `grid-fw/esp32s3/components/grid_esp32_port/grid_esp32_port.c` — `grid_utask_heart` `:209-223`,
  timer period `:415-418`, heartbeat type on USB connect `:463-471`, EDITOR TIMEOUT `:473-482`
- `grid-fw/esp32s3/components/tinyusb/include/tusb_config.h` — CDC buffer sizes `:39-41`
- `grid-fw/common/src/c/grid_transport.h` — `GRID_PORT_SWSR_SIZE` `:13`
- HANGAR's own tree: `package.json`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`,
  `worker/index.js`, `.gitignore`, `src/routes/+layout.ts`, `src/routes/dev/fidelity/+page.svelte`,
  `e2e/smoke.e2e.ts`, `e2e/fidelity.e2e.ts`, `src/lib/config-shape.spec.ts`, `docs/TESTING.md`,
  `src/vendor/botor/_pad.ts:3455-3509` and `:3880-3936`
- Commands run on this machine: `npm run check` (353 files, 0 errors), `node --version` (v24.14.0),
  `npm --version` (11.9.0), `playwright --version` (1.62.1), `wrangler --version` (4.128.0),
  `git status --porcelain` in all three repos

### Secondary (MEDIUM — HANGAR's own prior research and phase records)

- `.planning/research/ARCHITECTURE.md` §1, §2.2-2.3, §3.2-3.3, §6.1-6.2, §Anti-Patterns
- `.planning/research/PITFALLS.md` §C1, §C2, §C3, §C10, §C11, §C12
- `.planning/research/STACK.md` §Decision 3, §Decision 6, §Supporting Libraries
- `.planning/phases/03-vendor-the-domain/03-06-SUMMARY.md` — the `/dev/fidelity/` pattern, the WASM
  answer, the `.tmp-e2e/` convention, the no-`failed`-in-a-title rule
- `.planning/STATE.md` — accumulated decisions, including the Phase 2 MEDIUM/LOW confidence flags
- `C:\Users\sabot\.claude\projects\C--Users-sabot-Documents-Claude\memory\project_zona_module_config.md`
  — the mixed-state write incident, the `sendToGrid`-reports-success trap, the plain-object rejection
  shape, "grid-fw is the authority"

### Tertiary (verified against the spec, flagged where it corrects prior research)

- [WICG Web Serial API](https://wicg.github.io/serial/) — `requestPort()` requires transient activation
  and does **not** consume it. Corrects the "burn the activation" framing in STACK §Decision 3.
- [MDN — User activation](https://developer.mozilla.org/en-US/docs/Web/Security/User_activation) and
  [Chromium issue 40058598](https://issues.chromium.org/issues/40058598) — the ~4900 ms Chromium
  transient-activation lifespan. MEDIUM: the exact constant is an implementation detail that can move.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Protocol API and wire format | **HIGH** | Read from the pinned `dist/index.js`, then executed: encode, decode, round trip, corrupt-frame behaviour, offset collision, all reproduced on this machine. |
| Desktop instruction payloads | **HIGH** | Copied verbatim from the current `grid-editor` tree with grep-verified line numbers. CONTEXT's approximate line numbers are corrected in place. |
| Firmware behaviour (page gate, ACK correlator, active-page piggyback, store side effects, the five CONFIG conditions) | **HIGH** | Read from the public `grid-fw` clone the user's own notes name as the authority. Every claim has a file:line. |
| Web Serial typing and route mechanics | **HIGH** | The typings are installed and wired; `npm run check` is 0/0; `/dev/fidelity/` already proves the route pattern end to end. |
| Transient-activation mechanism | **MEDIUM-HIGH** | Spec text confirms the check and the absence of a consume step; the 4.9 s constant is Chromium-internal. |
| Host heartbeat requirement | **MEDIUM** | Strong source-grounded prediction (not required) with a specific falsification test. Only hardware settles it — which is the phase. |
| 10 ms pacing | **MEDIUM** | A concrete buffer-size mechanism and a proposed measurement, no measurement yet. |
| Permission persistence across restart | **LOW** | Inherited from PITFALLS §C10; sources conflict; out of scope but cheap to observe during the run. |

**Research date:** 2026-09-03
**Valid until:** 2026-10-03 for the browser and hosting facts. The protocol and firmware facts are
pinned rather than dated: they are valid for `@intechstudio/grid-protocol@1.20260825.1135` and for the
firmware revision the user's ZONA is running. A pin bump (`docs/PIN-POLICY.md`) or a firmware update
re-opens every field offset, every parameter name and every frame length in this document.

**Tree state:** `hangar` clean (`git status --porcelain` empty) before and after this research. Nothing
was installed. `grid-editor` shows only the user's two pre-existing PROTECTED modifications;
`grid-fw` is clean. No git command that changes state was run in any repository. No serial port was
opened and no hardware was touched.
