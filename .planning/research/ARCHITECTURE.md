# Architecture Research

**Domain:** Static browser app driving USB hardware over Web Serial, with an in-browser source compiler and a firmware-faithful simulator
**Researched:** 2026-09-02
**Confidence:** HIGH for everything traced from local source (write path, protocol instructions, port coupling). MEDIUM for the claim that a bare browser page can complete the write without the editor runtime around it — that is the walking skeleton, and it is unproven.

---

## 1. The Desktop Write Path, Traced

Everything below is read from `C:\Users\sabot\Documents\Claude\grid-editor`. File:line references are real.

### 1.1 Connect

| Step | File | Function |
|------|------|----------|
| Port picker | `src/renderer/serialport/serialport.ts:186` | `GridConnectionManager.tryConnectSerial()` — `navigator.serial.requestPort({ filters })`, filters built by `getSerialFilter()` (`serialport.ts:27`) from `window.ctxProcess.configuration()` |
| Open | `src/renderer/serialport/serial-transport.ts:52` | `SerialTransport.open()` → `port.open({ baudRate: 2000000 })` |
| Wire up | `src/renderer/serialport/serialport.ts:84` | `GridConnectionManager.openTransport()` — constructs `new WriteBuffer(transport)`, `new GridRuntime()`, binds `buffer.messageStream.bind(incoming)`, starts `GridService.AutoEventFetcher`, registers with `runtime_manager` |
| Framing | `src/renderer/serialport/serialport.ts:135` | `setupFrameHandler()` — accumulates bytes; a frame ends where `rxBuffer[i] === 10 && rxBuffer[i-3] === 4` (LF at `i`, EOT three back, two checksum chars between); then `grid.decode_packet_frame(msg)` and `grid.decode_packet_classes(class_array)`, then `connection.buffer.messageStream.deliver_inbound(class_array)` |
| Read loop | `serial-transport.ts:150` | `startReadLoop()` — `port.readable.getReader()`, loop `reader.read()` |

VID/PID values, from `grid-editor/configuration.json`:

```
USB_VID_0 0x03eb  USB_PID_0 0xecac      (D51 family)
USB_VID_1 0x03eb  USB_PID_1 0xecad
USB_VID_2 0x303a  USB_PID_2 0x8123      (ESP32 family — this is ZONA)
BOOTLOADER_GRID_ESP32  0x303a / 0x8122  <-- HANGAR must NEVER list this
BOOTLOADER_GRID_D51    0x03eb / 0x2402  <-- nor this
BOOTLOADER_KNOT        0x303a / 0x8124  <-- nor this
```

ZONA is `hwcfg 161` (`GRID_MODULE_ZONA_RevH = "161"`, grid-protocol `dist/index.js:51`). `grid.module_architecture_from_hwcfg` is `hwcfg % 2 === 1 ? ESP32 : D51` (`dist/index.js:3916`), so 161 is ESP32, so **ZONA's only application VID/PID is `0x303a` / `0x8123`**. Filtering to that one pair alone satisfies the "must never brick a module" constraint at the port-picker level: the bootloader PID is never offered to the user.

### 1.2 Identify

Nothing is requested. The module announces itself.

`MessageStream.deliver_inbound` (`src/renderer/serialport/message-stream.store.ts:207`) dispatches on `class_descr.class_name`. On `"HEARTBEAT"` it calls `GridRuntime.incoming_heartbeat_handler(descr)` (`src/renderer/runtime/runtime.ts:2118`), which:

- `findModule(SX, SY)` (`runtime.ts:2078`) — if found, bumps `aliveModules` timestamp
- if not found, `create_module(brc_parameters, class_parameters)` (`runtime.ts:2365`), which reads `Number(class_parameters.HWCFG)` and resolves it through `grid.module_type_from_hwcfg(hwcfg)` and `grid.module_hwcfgs()`. That is the entire ZONA-detection mechanism.
- then fires `requestLedReport()` / `requestNameReport()` / `requestEventReport()` (`runtime.ts:1765-1804`)

Liveness is a second timer: `GridRuntimeManager.startHeartbeat` (`src/renderer/runtime/runtime-manager.store.ts:211`) runs `editor_heartbeat_interval_handler` every `heartbeat_editor_ms = 300` and `grid_heartbeat_interval_handler` every `heartbeat_grid_ms = 250`. The editor heartbeat sends `GridInstruction.SendHeartbeatImmediate(type)` with `TYPE = 255` normally and `TYPE = 254` when there are unsaved changes (which tells firmware to refuse page changes). `GridRuntime.isAlive` (`runtime.ts:2418`) destroys a module after `3 x 250 ms` of silence, relaxed to `6 x 250 ms` while the write buffer is non-empty.

Every inbound descriptor, whatever its class, ends by calling `this._buffer.validate_incoming(class_descr)` (`message-stream.store.ts:406`). That is the only path that resolves a pending request.

### 1.3 Write one event config

```
GridEvent.sendToGrid()                        runtime.ts:865
  ├─ walks parents: element → page → module → runtime
  ├─ GridScript.compressScript(this.toLua())  <-- WASM Lua minifier
  ├─ new GridInstruction.SendConfig(dx, dy, page.pageNumber,
  │       element.elementIndex, this.type, script, simulate)
  │                                           instructions.ts:118
  └─ instruction.executeOn(runtime.connection)
        ├─ rejects if ACTIONLENGTH >= Grid.Protocol.maxScriptLength
        │    (= grid.getProperty("CONFIG_LENGTH") = 909; lib/_utils.ts:297)
        └─ connection.buffer.add_last(bufferElement)

WriteBuffer.add_last(obj)                     engine.store.ts:447
  ├─ validateBufferElement(obj)               engine.store.ts:425
  │    throws "Module [DX, DY] is not connected" — reads runtime_manager
  ├─ push to queue array
  └─ execute(obj)                             engine.store.ts:465
       └─ processElement(current)             engine.store.ts:320
            ├─ busy-wait, sleep(1) per turn, until:
            │    !transport.isWriteLocked()
            │    && queue head === current
            │    && waiter is undefined         <-- ONE outstanding request, globally
            ├─ await sleep(10)                  <-- fixed inter-message pacing gap
            └─ sendToGrid(current, sendImmediate)   engine.store.ts:272
                 ├─ sendDataToGrid(descr)          engine.store.ts:237
                 │    ├─ grid.encode_packet(descr) → { serial, id }
                 │    ├─ serial.push(10)           <-- LF appended by the CALLER
                 │    └─ transport.write(new Uint8Array(serial))
                 ├─ if (filter.class_parameters.LASTHEADER !== undefined)
                 │       filter.class_parameters.LASTHEADER = id
                 └─ waitResponseFromGrid(el, responseTimeout ?? 250)
                      └─ new ResponseWaiter(...)   engine.store.ts:112
                           setTimeout(timeout) → resolve(TIMEOUT)
```

Resolution comes from the inbound side:

```
WriteBuffer.validate_incoming(descr)          engine.store.ts:360
  ├─ returns immediately if no waiter, or descr.class_name === "HEARTBEAT"
  ├─ BRC gate: every key in filter.brc_parameters must equal descr.brc_parameters
  │    (SendConfig filters on SX/SY = the module's dx/dy)
  ├─ if descr.class_instr === NACKNOWLEDGE and class_name matches
  │    (and LASTHEADER matches, if the filter set one) → waiter.destroy()
  │    → GridResponse(ERROR) → the promise REJECTS
  └─ else class_name must match and every filter class_parameter EXCEPT
       "LASTHEADER" must match → waiter.provideResponse(descr) → OK
```

Note the asymmetry: `LASTHEADER` is explicitly `continue`d in the positive-match loop (`engine.store.ts:392`). It is only ever used to disambiguate NACKs. Positive ACKs are matched by class + instruction + BRC alone.

Then back in `sendToGrid`:

| Response | Behaviour |
|----------|-----------|
| `OK` | resolve with the descriptor |
| `ERROR` (NACK or module destroyed) | reject |
| `TIMEOUT` | `retryCount++`, `resolve(this.sendToGrid(bufferElement))` — **unbounded recursive retry, forever** (`engine.store.ts:302`) |

### 1.4 Store to flash

```
GridRuntime.storePage(index)                  runtime.ts:2257
  ├─ await restoreZoneSoloBeforeStore()       zona/zone-solo-guard.ts
  │    (ZONA-specific: a RAM-only audition must be put back before flashing)
  ├─ new GridInstruction.StorePage(virtual)   instructions.ts:326
  │    brc DX/DY = -127/-127  → GLOBAL BROADCAST, not addressed to one module
  │    responseTimeout: 3000
  │    filter { PAGESTORE, ACKNOWLEDGE, class_parameters: { LASTHEADER: null } }
  ├─ executeOn(this.connection) → same WriteBuffer path as above
  └─ on success: for each module, module.findPage(index).store()
       — local bookkeeping only; marks the in-memory model as "stored"
```

### 1.5 Read back an existing config

```
GridEvent.load()                              runtime.ts:1057
  ├─ guard: already loaded or FETCHING → resolve
  ├─ new GridInstruction.FetchConfig(dx, dy, page, element, type)
  │                                           instructions.ts:64
  │    class CONFIG / instr FETCH
  │    class_parameters: VERSIONMAJOR/MINOR/PATCH from grid.getProperty("VERSION"),
  │                      PAGENUMBER, ELEMENTNUMBER, EVENTTYPE, ACTIONLENGTH: 0
  │    responseRequired: true, NO responseTimeout → falls back to 250 ms
  │    filter { CONFIG / REPORT, brc SX/SY, PAGENUMBER, ELEMENTNUMBER, EVENTTYPE }
  ├─ const script = descr.class_parameters.ACTIONSTRING
  └─ this.push(...GridAction.parse(script))   runtime.ts:401
       splits on /--\[\[@(.*?)\]\]\s*(.*?)(?=(--\[\[@|$))/gs
```

### 1.6 The ZONA pad layer sitting on top

`_pad.ts:writePad(adapter, result, reserved)` (`src/renderer/main/zona/_pad.ts:3890`) is already transport-agnostic — it takes an **injected `PadWriteAdapter`**:

```typescript
export type PadEventWriter = { replace(actions: PadAction[]): Promise<void>; send(): Promise<void> };
export type PadWriteAdapter = { setup: PadEventWriter; timer: PadEventWriter; storePage?(): Promise<void> };
```

and enforces, in order:
1. `validate(result, reserved)` — throw `PadCompileError` on any error diagnostic
2. **Timer first, always** — storing Setup alone leaves a mouse button held down, and `gtt` is a no-op until Timer holds a stored action
3. `withRetry("timer", 3, ...)` then `withRetry("setup", 3, ...)` — three attempts each, sequential, never `Promise.all`
4. Setup failing after Timer landed throws `PadPartialWriteError(["timer"], "setup", e)`
5. `await adapter.storePage?.()` — omitted for an audition, present for a flash store

The desktop implementation of that adapter is `pad-editor.store.ts:575`, built from `writerFor(resolved.setup, true)` / `writerFor(resolved.timer, true)` where `resolvePadEvents` (`pad-editor.store.ts:436`) does `runtime.findModule(dx,dy) → findPage(page) → control_elements.find(e => e.elementIndex === 0) → findEvent(0) / findEvent(6)`.

### 1.7 Every acknowledgement, retry and timeout the path depends on

| Instruction | BRC target | Response filter | Timeout | Retry |
|-------------|-----------|-----------------|---------|-------|
| `HEARTBEAT / EXECUTE` | global `-127,-127` | none (`responseRequired: false`, `sendImmediate: true`) | — | none |
| `CONFIG / FETCH` | `dx, dy` | `CONFIG / REPORT` + SX/SY + PAGENUMBER + ELEMENTNUMBER + EVENTTYPE | **250 ms** (default) | unbounded recursion |
| `CONFIG / EXECUTE` | `dx, dy` | `CONFIG / ACKNOWLEDGE` + SX/SY (no parameter match) | **500 ms** | unbounded recursion, wrapped in `withRetry(3)` by `writePad` |
| `PAGESTORE / EXECUTE` | global `-127,-127` | `PAGESTORE / ACKNOWLEDGE` (+ LASTHEADER for NACKs) | **3000 ms** | unbounded recursion |
| `PAGECLEAR` / `PAGEDISCARD` / `NVMERASE` | global | matching `ACKNOWLEDGE` | 3000 ms | unbounded |

Cross-cutting invariants the path also depends on, none of them documented anywhere but the code:

- **One outstanding request at a time, process-wide.** `waiter` is a module-level `let` in `engine.store.ts:170`, shared by every `WriteBuffer` instance. `processElement` blocks while it is defined.
- **A 10 ms gap before every send** (`engine.store.ts:337`). Not derived from anything; empirically load-bearing pacing.
- **A NACK rejects immediately** rather than retrying.
- **Inbound HEARTBEAT never resolves a waiter** — it is filtered out first, because it arrives every 250 ms and would otherwise match loose filters.
- **The frame detector requires four bytes of context** (`... EOT c c LF`), so a partial chunk simply stays in `rxBuffer` until the next read.
- A latent bug worth not copying: `serialport.ts:161` calls `grid.decode_packet_classes(class_array)` *before* checking `class_array !== false`. A corrupt frame gets passed to the decoder.

---

## 2. Import vs Reimplement

### 2.1 Import from `@intechstudio/grid-protocol` (pinned `1.20260825.1135`)

| API | Used for | Notes |
|-----|----------|-------|
| `grid.encode_packet(descr)` | building every outbound frame | `dist/index.js:3925`. Self-contained: assigns `ID` via `utility_genId()`, `SESSION` (a per-load `Math.floor(Math.random()*255)`, `dist/index.js:3876`), `SX/SY = 0`, offsets `DX/DY` by +127, writes SOH/BRC/EOB/STX/class/ETX/EOT, appends a two-char XOR checksum. Returns `{ serial, id }`. **Does not append the LF** — the caller pushes `10`. |
| `grid.decode_packet_frame(bytes)` | verifying + splitting an inbound frame | Returns `false` on checksum mismatch |
| `grid.decode_packet_classes(arr)` | turning raw classes into named descriptors | Mutates in place, returns `undefined` |
| `grid.module_type_from_hwcfg(161)` | ZONA detection | Returns `ModuleType.ZONA` |
| `grid.module_hwcfgs()` | revision string | Optional for HANGAR |
| `grid.getProperty("VERSION")` | CONFIG `VERSIONMAJOR/MINOR/PATCH` | Required on both FETCH and EXECUTE |
| `grid.getProperty("CONFIG_LENGTH")` | the 909 hard cap | `EVENT_BUDGET = 908` in `_pad.ts` is the usable figure |
| `ModuleType`, `ElementType`, `EventType`, `EventTypeToNumber` | typing | ZONA's element list is `[TOUCH, ...254 holes, SYSTEM@255]` (`dist/index.js:3624`) |
| `GridScript.compressScript(lua)` | the compiler's `measure()` / `cost()`, and the wire string | `shortify()` then `minifyScript()` → `minifyLua()` |
| `initLuaFormatter()` | **mandatory async bootstrap** | `compressScript` throws `"Lua formatter not initialized"` until this resolves. It `await init()`s the `@wasm-fmt/lua_fmt` WASM module. |

**The WASM dependency is the second architectural constraint on the whole site.** Nothing can compile, cost, fit or measure before `await initLuaFormatter()`. `_pad.ts` already wraps this correctly in `padCompilerReady()` / `isPadCompilerReady()` / `assertPadCompilerReady()` (`_pad.ts:51-72`), with a note that `checkSyntax` silently returns `false` (rather than throwing) when uninitialised, which would make every valid config look broken.

### 2.2 Reimplement as a thin client — do NOT port

| Desktop machinery | Why HANGAR does not want it | HANGAR's replacement |
|-------------------|----------------------------|----------------------|
| `WriteBuffer` (504 lines, `engine.store.ts`) | Svelte store, module-global `waiter`, `appSettings`, `runtime_manager`, `ConnectionSimulator`, `debug_lowlevel_store`, **unbounded retry** | `RequestQueue` (~120 lines): one in-flight request, per-session waiter, `AbortSignal`, **bounded** retry (3 attempts, then surface the failure) |
| `GridRuntime` / `GridModule` / `GridPage` / `GridElement` / `GridEvent` / `GridAction` / `ActionData` (2480 lines, `runtime.ts`) | A reactive object graph for a full editor: clipboard, tours, analytics, profiles, presets, snippets, syncing, `getComponentInformation` (which throws until the whole Svelte component library boots) | A flat `ZonaDevice = { dx, dy, hwcfg, type, fw, page }` plus raw ACTIONSTRINGs. HANGAR never needs an action model. |
| `MessageStream` (409 lines) | MIDI monitor, debug text, LED preview, event preview, name reports, launcher hooks, package manager IPC | ~40-line dispatcher: `HEARTBEAT` → presence; `PAGEACTIVE/REPORT` → current page; everything else → waiter matcher |
| `GridInstruction` namespace (`instructions.ts`) | Coupled to `BufferElement`, `logger`, `appSettings`, `uuid` | Five plain descriptor-builder functions, copied structurally from `instructions.ts` but returning `{ descr, filter, timeout }` records |
| `runtime_manager`, `user_input`, `appSettings`, `logger`, `Analytics`, `GridService.AutoEventFetcher`, `ConnectionSimulator` | Editor-only | Nothing |
| `GridAction.parse` (`runtime.ts:401`) | The one useful 15 lines in the file | **Vendor the regex only** — needed to feed `readPad` |

### 2.3 The five protocol instructions HANGAR needs, exactly

1. **`HEARTBEAT / EXECUTE`, outbound, global.** `TYPE: 255`, `HWCFG: 255`, `VMAJOR/VMINOR/VPATCH` (HANGAR's own version). No response expected. Every 300 ms. *Confidence MEDIUM that this is strictly required* — firmware announces itself unprompted, and no inbound path depends on it. But `TYPE 254` is what firmware uses to lock page changes, and every working host on this bus sends one. Send it; prove in the skeleton whether omitting it changes anything.

2. **`HEARTBEAT`, inbound.** Unsolicited, ~250 ms cadence. Carries `brc_parameters.SX / SY / ROT` (position) and `class_parameters.HWCFG / VMAJOR / VMINOR / VPATCH / PORTSTATE / GCCOUNT`. `HWCFG === 161` → ZONA. This is the whole identify path: no request, no handshake, no enumeration. Absence of a heartbeat for 750 ms is a disconnect.

3. **`CONFIG / FETCH` → `CONFIG / REPORT`.** The snapshot. Two calls, `EVENTTYPE 0` (Setup) and `EVENTTYPE 6` (Timer), on `PAGENUMBER = current`, `ELEMENTNUMBER = 0`. `ACTIONLENGTH: 0` on the request. Response carries `ACTIONSTRING`. Filter on class + instr + SX/SY + PAGENUMBER + ELEMENTNUMBER + EVENTTYPE. Raise the timeout from the desktop's accidental 250 ms default to something honest (1000 ms) since HANGAR retries a bounded number of times.

4. **`CONFIG / EXECUTE` → `CONFIG / ACKNOWLEDGE`.** The write. `ACTIONLENGTH: config.length`, `ACTIONSTRING: config`, reject at `>= 909`. ACK is matched on class + instr + SX/SY only — no parameter echo — so with two writes in flight you cannot tell which one was acked. That is exactly why the one-outstanding-request rule exists, and HANGAR must keep it. 500 ms timeout.

5. **`PAGESTORE / EXECUTE` → `PAGESTORE / ACKNOWLEDGE`.** The flash commit. Global broadcast (`DX/DY = -127`). 3000 ms timeout. Fires once, after both CONFIG writes have been acked.

Plus one passive listener, not an instruction: **`PAGEACTIVE / REPORT`**, inbound, tells HANGAR which page the module is actually on. HANGAR must fetch, write and store against *that* page, not a hardcoded 0, or a user whose ZONA is on page 2 gets a silent no-op. HANGAR must **never** send `PAGEACTIVE / EXECUTE` — a page change destroys the Lua VM (PROJECT.md), and that is a write the user did not ask for.

Explicitly not needed and never to be implemented: `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`, and anything bootloader-adjacent.

---

## 3. Component Boundaries

### 3.1 System overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  UI  (impure — DOM)                                                       │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ CardGrid  │ │ TuneRail │ │ InstallBar│ │ BudgetBar│ │ ShareButton  │  │
│  └─────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘ └──────┬───────┘  │
├────────┼────────────┼─────────────┼────────────┼──────────────┼──────────┤
│  APP STATE  (pure reducers + one impure store shell)                      │
│  ┌───────────────────┐  ┌────────────────────┐  ┌──────────────────────┐ │
│  │  tuning state     │  │  session state     │  │  url stamp codec     │ │
│  │  (owned)          │  │  (owned)           │  │  (pure, in compiler) │ │
│  └─────────┬─────────┘  └─────────┬──────────┘  └──────────┬───────────┘ │
├────────────┼──────────────────────┼────────────────────────┼─────────────┤
│  DOMAIN  (pure — vitest in node, no browser, no hardware)                  │
│  ┌──────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  compiler/_pad.ts        │  │  sim/pad-sim.ts                        │ │
│  │  PadState → Lua          │  │  PadState → Uint8Array(243) per tick   │ │
│  │  cost / fit / validate   │◄─┤  imports SPEED_TABLE, planLayers,      │ │
│  │  encodeStamp/decodeStamp │  │  groundPadState, springLed … from _pad │ │
│  │  PRESETS, readPad        │  └────────────────────────────────────────┘ │
│  └───────────┬──────────────┘                                             │
│              │ (needs WASM: await initLuaFormatter)                       │
│  ┌───────────▼──────────────┐  ┌────────────────────────────────────────┐ │
│  │  catalog/                │  │  protocol/descriptors.ts               │ │
│  │  entries + knob schema   │  │  5 builders + response matchers (pure) │ │
│  └──────────────────────────┘  └───────────────────┬────────────────────┘ │
├────────────────────────────────────────────────────┼──────────────────────┤
│  ADAPTERS  (impure)                                 │                      │
│  ┌────────────────────────┐  ┌─────────────────────▼────────────────────┐ │
│  │  sim/host.ts           │  │  device/session.ts                       │ │
│  │  canvas, rAF, IO,      │  │  connect / identify / snapshot /         │ │
│  │  matchMedia, pointers  │  │  audition / store / restore              │ │
│  └────────────────────────┘  │       └─ RequestQueue (1 in flight)      │ │
│                              └─────────────────────┬────────────────────┘ │
│                              ┌─────────────────────▼────────────────────┐ │
│                              │  transport/  (interface)                 │ │
│                              │  WebSerialTransport | FakeTransport      │ │
│                              └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
                              navigator.serial @ 2 000 000 baud
                                       │
                                    ZONA (hwcfg 161)
```

### 3.2 Component responsibilities and purity

| Component | Owns | Pure? | How it is tested |
|-----------|------|-------|------------------|
| `compiler/` (vendored `_pad.ts`) | `PadState` model, Lua emission, `cost`/`fit`/`validate`/`ledger`, base36 stamp codec, `PRESETS`, `readPad` | **Pure**, with one async precondition (`padCompilerReady()`). No DOM, no timers, no `Date.now`. | vitest in node — `pad.test.js` (3705 lines) ports verbatim |
| `sim/pad-sim.ts` (vendored) | 81-LED firmware model, 10 ms `tick()`, touch FIFO, MIDI callback, `frame` getter | **Pure and deterministic.** Header comment is explicit: "no Date.now, no timers, no DOM anywhere in this file" | vitest — `pad-sim.test.js` (1863) + `pad-invariants.test.js` (356) port verbatim |
| `catalog/` | Card entries: id, name, sentence, category, base `PadState`, which knobs are exposed | **Pure** data | Snapshot tests: every entry compiles and fits |
| `protocol/descriptors.ts` | The five instruction builders + the response-matching predicate | **Pure** — descriptor in, descriptor out. No I/O. | Unit tests over recorded byte frames |
| `stamp/url.ts` | `location.hash` read/write, debounce | Impure shell over a pure codec (`encodeStamp`/`decodeStamp` live in `_pad.ts`) | Codec tested pure; shell tested in jsdom |
| `tuning/` | Per-card knob overrides, the reducer that folds them onto a base `PadState` | **Pure** reducer + impure store shell | Pure reducer tests |
| `transport/` | `open`, `close`, `write(Uint8Array)`, `onData`, `onDisconnect`, `isWriteLocked` | **Impure**, but behind a one-file interface. Copy the shape of `grid-editor/src/renderer/serialport/transport.ts` — it already has three implementations, which proves the seam. | Not tested; `FakeTransport` is what the layer above uses |
| `device/session.ts` | Connect → identify → snapshot → audition → store → restore state machine; `RequestQueue` | **Impure by position, testable in fact** — drive it with `FakeTransport` replaying recorded ZONA frames | Integration tests with `FakeTransport`, no hardware |
| `sim/host.ts` (vendored `pad-sim-host.ts`) | The rendering loop: one rAF, 10 ms tick accumulator with 100 ms catch-up clamp, 33 ms repaint cadence, `IntersectionObserver` visibility gating, `prefers-reduced-motion`, pointer-as-finger with 5-contact cap | **Impure** — canvas, rAF, IO, matchMedia, PointerEvent. Framework-agnostic though: no Svelte, no React. | Manual + a jsdom smoke test |
| UI | Layout, the black/lime identity, the glyph field | Impure | Visual |

The line that matters: **everything that decides what a config *is* is pure and already has 5924 lines of passing tests. Everything that touches the world is small, and all of it hides behind two interfaces (`GridTransport` and `PadWriteAdapter`) that already exist in the source we are porting.**

### 3.3 Recommended project structure

```
src/
├── vendor/                    # byte-near copies from BOTOR, GPLv3, do not refactor
│   ├── _pad.ts                # the compiler (4380 lines)
│   ├── pad-sim.ts             # the simulator engine (1569 lines)
│   ├── pad-sim-host.ts        # the rendering loop (557 lines)
│   ├── grid-action-parse.ts   # the 15-line regex from runtime.ts:401
│   └── BOTOR-SYNC.md          # upstream SHA + the exact local deltas
├── protocol/
│   ├── descriptors.ts         # 5 instruction builders (pure)
│   ├── match.ts               # response filter predicate (pure)
│   └── framing.ts             # rx accumulator + EOT/LF detector (pure)
├── transport/
│   ├── transport.ts           # the interface
│   ├── web-serial.ts          # navigator.serial implementation
│   └── fake.ts                # replays recorded frames, for tests
├── device/
│   ├── queue.ts               # RequestQueue: 1 in flight, bounded retry
│   ├── session.ts             # connect/identify/snapshot/audition/store/restore
│   └── adapter.ts             # builds a PadWriteAdapter from a session
├── catalog/
│   ├── entries.ts             # the nine seeds + new ones
│   └── knobs.ts               # KnobKind → control mapping
├── state/
│   ├── tuning.ts              # pure reducer
│   └── store.ts               # the framework-shaped shell
├── url/stamp.ts               # hash <-> stamp
├── ui/                        # components
└── main.ts                    # await initLuaFormatter() before anything renders
tests/
├── pad.test.ts                # ported verbatim
├── pad-sim.test.ts            # ported verbatim
├── pad-invariants.test.ts     # ported verbatim
└── session.test.ts            # new, FakeTransport
```

**Structure rationale:**

- `vendor/` is quarantined and explicitly not refactored, because every local edit is a merge conflict with BOTOR forever. It is the only folder with a sync document.
- `protocol/` is separate from `transport/` because the descriptors are pure and the bytes are not. That split is what makes `FakeTransport` possible, and `FakeTransport` is what makes the hardware path testable in CI.
- `device/` is the only place that knows both. It is the thinnest layer with the highest risk, so it gets its own folder rather than being smeared into the store.

---

## 4. Port Strategy for the Two Big Pieces

### 4.1 Actual coupling, measured

`_pad.ts` (4380 lines) has **two** import statements in the entire file:

```typescript
import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";   // line 34
import type { RGB } from "../../config-blocks/_screen";                        // line 37
```

The second is `type`-only and the type is `{ r: number; g: number; b: number }` (`config-blocks/_screen.ts:6`). The header comment says why: "Type-only, so nothing from the screen module is pulled in at runtime and this file stays importable in a headless test."

`pad-sim.ts` (1569 lines) has **one** import statement, and it is `from "./_pad"`.

`pad-sim-host.ts` (557 lines) has **two**: `from "./_pad"` and `from "./pad-sim"`. It uses raw DOM only (`canvas.getContext("2d")`, `requestAnimationFrame`, `IntersectionObserver`, `window.matchMedia`, `addEventListener("pointerdown"...)`). No Svelte import anywhere.

What has to be stubbed or vendored to run all three in a plain static site:

| Thing | Action | Cost |
|-------|--------|------|
| `import type { RGB }` | Inline `export type RGB = { r: number; g: number; b: number }` at the top of `_pad.ts` | 1 line |
| `GridScript.compressScript` | Import from the same npm package. It works in a browser — profile-cloud already does. | 0 |
| `initLuaFormatter` | Same. But **must be awaited before first render**, and the bundler must emit the `@wasm-fmt/lua_fmt` `.wasm` asset and serve it from the static host. | Build config, not code |
| Nothing else | — | — |

That is the whole port. Three files, one inlined type alias.

**And the tests come with it.** `src/renderer/tests/pad.test.js` (3705 lines), `pad-sim.test.js` (1863) and `pad-invariants.test.js` (356) import only from `../main/zona/pad-sim` and `../main/zona/_pad`. They move with a path rewrite. HANGAR gets 5924 lines of regression coverage on day one of the port, covering the exact things nobody can eyeball: the 256-entry sine table, integer weight tables summing 254, decay snapping, the fit ladder, the stamp round-trip across four format versions.

What is explicitly left behind: `pad-editor.store.ts` (882 lines — imports `GridRuntime`, `runtime_manager`, `user_input`, `ActionData`, `GridAction`, `GridElement`, `GridEvent`, `Grid` utils), `PadPanel.svelte`, `zone-blocks.store.ts`, `_zone-blocks.ts`, `zone-solo-guard.ts`. HANGAR's `device/adapter.ts` replaces `pad-editor.store.ts:575` in about thirty lines, because `PadWriteAdapter` is the whole contract.

### 4.2 Vendor-and-adapt, not extract-as-a-shared-package

**Recommendation: vendor.** Reasons, in order of weight:

1. The coupling is already zero. There is nothing to extract *from*. Extraction buys nothing that copying does not already have.
2. A shared npm package needs a release cadence, a version matrix (BOTOR ships an Electron app, HANGAR a static site), a second CI, and a publishing credential — for two files that always change together and have exactly two consumers.
3. `_pad.ts` and `pad-sim.ts` are pinned against each other by the test suite by design ("every table the compiler owns is imported from `_pad.ts` rather than copied"). Splitting them across a package boundary introduces a version skew that the tests currently make structurally impossible.
4. HANGAR's constraint is a static site with no backend. Fewer moving publish steps is directly aligned with that.

**How the port stays in sync with BOTOR:**

- Vendored files stay **byte-identical** to upstream except (a) a five-line provenance header and (b) the inlined `RGB` type. No formatting, no lint fixes, no renames. Add `// prettier-ignore` at the folder level and exclude `src/vendor/` from HANGAR's linter.
- `src/vendor/BOTOR-SYNC.md` records the upstream commit SHA for each file and the exact local delta as a diff hunk.
- Syncing is `git diff <old-sha>..<new-sha> -- src/renderer/main/zona/_pad.ts` applied by hand, then run the ported test suite. Because the tests came across too, a bad sync fails loudly rather than drifting.
- Escalation rule, decided now so it is not re-litigated later: if a sync requires manual conflict resolution twice in a row, or a third consumer appears, promote `_pad.ts` + `pad-sim.ts` into `@zona/pad` and make both repos consume it. Not before.
- Direction of flow is one-way: BOTOR → HANGAR. New presets authored in HANGAR live in `catalog/`, not in `PRESETS` inside the vendored file, so the vendored file never accumulates HANGAR-only content.

---

## 5. Data Flow

### 5.1 Catalog entry → screen, and catalog entry → wire

```
catalog/entries.ts
  CatalogCard { id, name, sentence, category, knobs: KnobKind[], base: PadState }
        │
        │  (user turns a knob)
        ▼
state/tuning.ts   Map<cardId, Partial<PadState>>            ◄── OWNED STATE
        │
        │  applyTuning(base, overrides)
        ▼
normalisePadState() / groundPadState()          [_pad.ts:1290 / :1498]
        │
        ▼
  effective PadState                                        ◄── DERIVED, memoised
        │
        ├────────────────────── SCREEN PATH ──────────────────────────┐
        │                                                              │
        ▼                                                              ▼
  new PadSim(state)                                     encodeStamp(state)  [_pad.ts:2624]
  sim.tick()  every 10 ms of accumulated wall clock            │
  sim.frame → Uint8Array(81*3), hardware-indexed               ▼
        │                                                 location.hash
        ▼                                                 "z." + base36 payload
  hwToScreen(hw) → {x,y}                                       │
  blit(canvas, frame, cellPx)   [pad-sim-host.ts:86]           ▼
        │                                              shareable URL
        ▼
  9x9 canvas, repainted at most every 33 ms

        ├────────────────────── WIRE PATH ────────────────────────────┐
        ▼
  compile(state)                                        [_pad.ts:2323]
    → CompileResult { setupLua, timerLua, setup: PadAction[],
                      timer: PadAction[], stamp, timerPeriodMs, seams }
        │
        ▼
  cost(result, reserved)                                [_pad.ts:3056]
    budgetOf() = max(GridScript.compressScript(lua).length, lua.length) + reserved
    against EVENT_BUDGET = 908
        │
        ├── fits: false ──► fit(state, { pinned })       [_pad.ts:4081]
        │                     FitPlan.steps[] → user picks, or auto-apply
        │                     → resolved PadState → recompile
        ▼
  writePad(adapter, result, reserved)                    [_pad.ts:3890]
    validate → TIMER first (3 tries) → SETUP (3 tries) → storePage?()
        │
        ▼
  device/adapter.ts   PadEventWriter.send()
    lua = actions.map(padActionToLua).join("")
    script = GridScript.compressScript(lua)
        │
        ▼
  protocol/descriptors.ts  sendConfig(dx, dy, page, 0, eventType, script)
        │
        ▼
  device/queue.ts  → grid.encode_packet(descr) → serial.push(10)
        │
        ▼
  transport/web-serial.ts  port.writable.getWriter().write(Uint8Array)
        │
        ▼                                       ZONA
  CONFIG / ACKNOWLEDGE  ◄────────────────────────┘
```

### 5.2 The read-back / restore flow, which runs first

```
connect
  └─ HEARTBEAT arrives unsolicited → { SX, SY, HWCFG:161, VMAJOR.. } → ZonaDevice
       └─ PAGEACTIVE / REPORT (passive) → currentPage
            └─ CONFIG/FETCH (page, elem 0, event 0) → snapshot.setupString
            └─ CONFIG/FETCH (page, elem 0, event 6) → snapshot.timerString
                 │
                 ├─► stored verbatim as SNAPSHOT              ◄── OWNED STATE
                 │     restore = write these two strings back, unchanged,
                 │     via the same CONFIG/EXECUTE path
                 │
                 └─► parseActions(snapshot)  [vendored regex]
                       └─ readPad({ setup, timer })  [_pad.ts:3824]
                            → PadRead { state?, user, foreign[], claims[] }
                              state defined  → the pad was HANGAR/BOTOR-made,
                                               show it as the starting card
                              state undefined → hand-built or factory default,
                                               warn before overwriting
```

The snapshot is stored as **raw ACTIONSTRINGs**, not as a parsed action model. Restore then cannot lose anything HANGAR does not understand — including `foreign` blocks from the Grid Editor that `readPad` flags but cannot reproduce. This is the single most important decision for the "never destroys the user's config" requirement, and it is why HANGAR does not need `GridAction` / `ActionData` at all.

### 5.3 State ownership

| Kind | What | Where |
|------|------|-------|
| **Owned** | selected card id; `Map<cardId, Partial<PadState>>` tuning overrides; connection status; `ZonaDevice { dx, dy, page, fw }`; `Snapshot { setupString, timerString, page, capturedAt }`; `auditioned` / `stored` flags | one store |
| **Derived, never persisted** | effective `PadState`; `CompileResult`; `PadCost`; `FitPlan`; `LedgerRow[]`; sim `frame`; `stamp`; budget bar values; the ACTIONSTRING itself | recomputed |
| **Projection** | `location.hash` | written debounced from tuning state; read once at boot |
| **Cache key for all of it** | `encodeStamp(state)` | `SimHost.updateCard` already does exactly this (`pad-sim-host.ts:196`: `if (stamp === entry.stamp) return`) — a content hash, not an identity. Reuse the same key for compile memoisation, because `compressScript` is a WASM call and `ledger()` costs N+1 of them. |

---

## 6. Build Order

### Phase 0 — Walking skeleton: browser writes to a ZONA (RISKIEST, FIRST)

No framework. No compiler. No simulator. No UI. One HTML file, one TS file, one button, `console.log`.

### Phase 1 — Vendor the domain

`_pad.ts`, `pad-sim.ts`, `pad-sim-host.ts`, the three test files, the `RGB` inline, `BOTOR-SYNC.md`. Prove `await initLuaFormatter()` works from a `vite build` + `vite preview` static bundle and that `compile(PRESETS[0].state)` produces the same bytes it does in BOTOR. Depends on nothing; can run in parallel with Phase 0.

### Phase 2 — Catalog and simulator host

The nine seeds as catalog entries, `SimHost` wired to a card grid, `IntersectionObserver` gating, reduced-motion path, mouse-as-finger on the focused card. Depends on Phase 1 only. **This is the phase that makes the site worth opening**, and it needs no hardware, so it is the natural place for the visual identity work.

### Phase 3 — Tuning, fit ladder, URL stamp

Knob controls per `KnobKind`, `applyTuning` reducer, `cost` display, `fit` ladder surfaced as "turn this down to fit", `encodeStamp`/`decodeStamp` ↔ `location.hash`. Depends on Phases 1 and 2. Pure work; no hardware.

### Phase 4 — Device session

`RequestQueue`, `WebSerialTransport`, `FakeTransport` + recorded frames, connect/identify/snapshot state machine, honest degrade when `navigator.serial` is undefined. Depends on Phase 0's findings. This phase productionises the skeleton — bounded retries, disconnect handling, error surfaces.

### Phase 5 — Install flow

`device/adapter.ts` building a `PadWriteAdapter`, audition (RAM, no `storePage`), Store (with `storePage`), Put Back (write the snapshot strings verbatim), and the UI that makes the RAM/flash distinction unmissable. Depends on Phases 3 and 4. This is where the two halves meet.

### Phase 6 — New catalog entries authored for spectacle

Depends on 2 and 3. Deliberately last: authoring against a working simulator and a working budget meter is a different, easier job than authoring blind.

**Dependency reasoning.** Phases 1→2→3 are a pure chain that never touches hardware and can be developed on any machine in any browser. Phase 0→4→5 is the hardware chain. They join only at Phase 5. Phase 0 is out of order on purpose: it is the only phase whose failure invalidates the product, and it is also the cheapest phase to run.

### 6.1 The single riskiest unknown

**Can a plain static web page complete a CONFIG write and a PAGESTORE against a real ZONA, with none of the Grid Editor's runtime around it?**

Nothing in either repository has ever done this. The editor's *web build* uses `navigator.serial` (PROJECT.md is right about that), but it does so with the full `GridRuntime` object graph, `runtime_manager`, `AutoEventFetcher`, an editor heartbeat and `WriteBuffer`'s pacing all present. `grid-editor/tools/zona-store.js` looks like a standalone driver and is not — it is a CDP client that evaluates an expression *inside the running Electron renderer* (`Runtime.evaluate` against `localhost:9222`, targeting the page at `localhost:5173`). It reaches the real `runtime_manager` singleton. It proves the compiler against hardware; it proves nothing about a bare client.

The specific things that could fail:

1. The module may not emit heartbeats at all, or may not ACK, without a host heartbeat at ~300 ms. (`sendImmediate` exists specifically to let heartbeats jump the queue, which hints the cadence matters.)
2. The `await sleep(10)` before every send may be load-bearing pacing at 2 Mbaud, not incidental.
3. `CONFIG / ACKNOWLEDGE` carries no parameters to correlate against, so any misordering is silent.
4. `@wasm-fmt/lua_fmt` may not resolve its `.wasm` asset from a static host under a plain Vite build.

### 6.2 The smallest experiment that proves it

One page, roughly 150 lines, no framework, no build tooling beyond `vite`:

1. A button calls `navigator.serial.requestPort({ filters: [{ usbVendorId: 0x303a, usbProductId: 0x8123 }] })` and `port.open({ baudRate: 2000000 })`.
2. Read loop → accumulate → frame on `b[i] === 10 && b[i-3] === 4` → `grid.decode_packet_frame` (bail if `false`) → `grid.decode_packet_classes` → log `class_name` / `class_instr` for everything.
3. **Assert identify:** a `HEARTBEAT` arrives unprompted with `class_parameters.HWCFG === 161`, and `grid.module_type_from_hwcfg(161) === "ZONA"`. Record `brc_parameters.SX / SY`.
4. **Assert read:** send `CONFIG / FETCH` for `(SX, SY, page 0, element 0, event 0)`; print the returned `ACTIONSTRING`. Proves outbound framing, checksum, ACK matching and inbound parsing in one shot.
5. **Assert write, safely:** send `CONFIG / EXECUTE` with **that exact same string, unchanged**, and wait for `CONFIG / ACKNOWLEDGE` within 500 ms. This is a provable no-op — the module ends up holding precisely what it already held — so the highest-risk experiment is also the safest one to run on the user's own hardware.
6. **Assert store:** send `PAGESTORE / EXECUTE` (global `-127,-127`) and wait for `PAGESTORE / ACKNOWLEDGE` within 3000 ms. Again a no-op: it flashes the config that was already there.
7. **Vary one thing:** run the whole sequence once with a 300 ms outbound `HEARTBEAT / EXECUTE (TYPE 255)` timer, and once without. That single A/B answers whether HANGAR needs a heartbeat loop at all.

Run alongside it, in twenty lines: a page that does `await initLuaFormatter(); console.log(GridScript.compressScript("local a = 1"))`, served from `vite build && vite preview`. That settles the WASM-on-a-static-host question for a couple of minutes' work.

If steps 3–6 pass, every remaining risk in HANGAR is browser code that already has 5924 lines of tests. If step 5 or 6 fails, the product's core value is in question on week one, which is exactly when you want to know.

---

## Anti-Patterns

### Porting `WriteBuffer` because it works

**What people do:** Copy `engine.store.ts` because it is proven against hardware.
**Why it is wrong:** It carries a module-global `waiter` shared across all connections, a Svelte store, `appSettings`, `ConnectionSimulator`, `runtime_manager` validation, and an **unbounded recursive retry on timeout** (`engine.store.ts:302`). In an editor a hung retry shows up in a debug panel; in HANGAR it is a spinner that never stops on a page with no debug panel.
**Instead:** Reimplement the *rules* — one outstanding request, 10 ms pre-send gap, NACK rejects immediately, HEARTBEAT never resolves a waiter — in ~120 lines with a bounded retry count and an `AbortSignal`.

### Modelling the device config as an action graph

**What people do:** Port `GridAction` / `ActionData` / `GridEvent` so the snapshot can be inspected and edited.
**Why it is wrong:** It is the entry point to 2480 lines of editor. `ActionData.information` routes through `getComponentInformation` in the config-block registry, which throws until the whole Svelte component library has initialised — `_pad.ts:3873` calls this out as the reason `writePad` takes an injected adapter in the first place.
**Instead:** Keep raw `ACTIONSTRING`s. Parse only when `readPad` needs it, with the vendored 15-line regex. Restore writes the original string back byte for byte, so anything HANGAR cannot model survives anyway.

### Refactoring the vendored files

**What people do:** Reformat `_pad.ts` to HANGAR's lint rules, split it into modules, rename `s` to `state`.
**Why it is wrong:** Every edit is a permanent merge conflict against BOTOR, and the file's density is deliberate — the comments explain firmware traps ("no code path emits `e == 5`", "every division is `//`") that a refactor would quietly break.
**Instead:** Quarantine `src/vendor/`, exclude it from lint and format, record the upstream SHA.

### Hardcoding page 0

**What people do:** Fetch, write and store against page 0 because that is the common case.
**Why it is wrong:** A user whose ZONA sits on page 2 gets a completely silent no-op — the write succeeds, the ACK arrives, and nothing on the pad changes.
**Instead:** Track the live page from inbound `PAGEACTIVE / REPORT`, default to 0 until one arrives, and never send `PAGEACTIVE / EXECUTE` — a page change destroys the Lua VM.

### Streaming the real pad to the screen

**What people do:** Use `LEDPREVIEW` fetch to mirror the hardware, since the editor does.
**Why it is wrong:** Measured at 3.3 Hz. It also puts a permanent request load on the same one-in-flight queue the install path needs.
**Instead:** The simulator, always. It is the only honest preview, and it is the reason the site works with no hardware attached.

---

## Integration Points

### External

| Service | Integration | Gotchas |
|---------|-------------|---------|
| `navigator.serial` | `requestPort({ filters })` + `open({ baudRate: 2000000 })` | Chromium only; HTTPS required; **must be inside a user-gesture handler**; `port.writable.locked` must be checked before every write (`serial-transport.ts:95`); `disconnect` event fires on unplug |
| `@intechstudio/grid-protocol` | pinned npm dep | Version tracks firmware. `initLuaFormatter()` is a mandatory async bootstrap; `compressScript` throws without it but `checkSyntax` returns `false` silently. Bundler must emit the `@wasm-fmt/lua_fmt` `.wasm` asset. |
| Static host (Cloudflare) | `vite build` output | HTTPS is required for Web Serial anyway, so this is free. Must serve `.wasm` with the right MIME type. |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `compiler` ↔ `sim` | direct import, `sim` → `compiler` only | One-way by design; `pad-sim.ts` imports tables from `_pad.ts` rather than copying them, and the test suite pins both sides |
| `compiler` ↔ `device` | the `PadWriteAdapter` interface (`_pad.ts:3883`) | Already exists upstream. HANGAR implements three methods. The compiler never learns what a serial port is. |
| `device` ↔ `transport` | the `GridTransport` interface (copy of `serialport/transport.ts`) | Already proven upstream by three implementations (serial, websocket, virtual). `FakeTransport` is the fourth. |
| `protocol` ↔ `device` | plain descriptor objects | Keeps every byte-layout decision pure and unit-testable |
| `state` ↔ `sim/host` | content hash (`encodeStamp`) | Not object identity. `SimHost.updateCard` short-circuits on an unchanged stamp, so store churn does not restart animations. |

---

## Confidence and Gaps

| Claim | Confidence | Basis |
|-------|-----------|-------|
| Desktop write path as traced | HIGH | Read directly from `serialport.ts`, `serial-transport.ts`, `engine.store.ts`, `runtime.ts`, `instructions.ts`, `message-stream.store.ts` |
| The five protocol instructions and their ACK/timeout shapes | HIGH | `instructions.ts` literal values |
| ZONA = hwcfg 161, ESP32, VID `0x303a` / PID `0x8123` | HIGH | grid-protocol `dist/index.js:51`, `module_architecture_from_hwcfg`, `configuration.json` |
| `_pad.ts` / `pad-sim.ts` / `pad-sim-host.ts` have near-zero editor coupling | HIGH | Exhaustive `grep` for `import` across all three files |
| The three test files port verbatim | HIGH | Their import lists reference only `../main/zona/_pad` and `../main/zona/pad-sim` |
| `compressScript` requires an awaited WASM init | HIGH | `dist/lua-formatter.d.ts`, `dist/index.js:4200`, and `_pad.ts:40-72` documenting the failure mode |
| A bare browser page can complete the write | **MEDIUM / unproven** | The editor's web build uses `navigator.serial`, but always with the full runtime. This is Phase 0. |
| An outbound heartbeat is required | **LOW** | Nothing in the inbound path depends on it, but every working host sends one. The Phase 0 A/B settles it. |
| `PAGEACTIVE / REPORT` is the right way to learn the live page | MEDIUM | `message-stream.store.ts:388` handles it, but the editor's authority is `user_input.pagenumber`, so HANGAR's passive-only approach is untested |

**Gaps for later, phase-specific research:**

- Whether a ZONA answers `CONFIG / FETCH` for a page it is not currently displaying.
- Whether `PAGESTORE` as a global broadcast is safe when other Grid modules share the bus (HANGAR assumes a lone ZONA; a user with a full Grid rig would flash every module's current page).
- The 941/908 over-budget preset noted in PROJECT.md — a compiler debt, not an architecture question, but it lands in Phase 3.

## Sources

- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\serialport\{serialport,serial-transport,transport,instructions,message-stream.store}.ts`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\runtime\{engine.store,runtime,runtime-manager.store}.ts`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\main\zona\{_pad,pad-sim,pad-sim-host,pad-editor.store}.ts`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\main\panels\profileCloud\ProfileCloud.svelte`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\lib\_utils.ts`
- `C:\Users\sabot\Documents\Claude\grid-editor\tools\zona-store.js`
- `C:\Users\sabot\Documents\Claude\grid-editor\configuration.json`
- `C:\Users\sabot\Documents\Claude\grid-editor\node_modules\@intechstudio\grid-protocol@1.20260825.1135\dist\{index.js,index.d.ts,grid-protocol.d.ts,string-operations.d.ts,lua-formatter.d.ts}`
- `C:\Users\sabot\Documents\Claude\grid-editor\src\renderer\tests\{pad,pad-sim,pad-invariants}.test.js`
- `.planning\PROJECT.md`

---
*Architecture research for: static browser-to-hardware config playground (ZONA / HANGAR)*
*Researched: 2026-09-02*
