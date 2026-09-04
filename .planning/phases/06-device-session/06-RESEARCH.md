# Phase 6: Device Session - Research

**Researched:** 2026-09-04
**Domain:** Web Serial session lifecycle in a prerendered SvelteKit app — permission persistence, plug/unplug events, failure taxonomy, and proving all of it without hardware
**Confidence:** HIGH on the API and browser facts (Chromium source, WICG spec, MDN BCD, grid-fw source read directly); MEDIUM on Firefox behavioural detail; MEDIUM on layout arithmetic that a UI spec must finish.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**The controls**
- **D-01 [user, brief]** `TRY ON DEVICE` stays the primary action in the chosen panel — "that's the whole point" — and becomes the consumer of the session rather than its owner.
- **D-02 [orchestrator]** The roadmap's "one primary `CONNECT` control" is the session's own control in the header's device slot: a quiet indicator that reads `NO ZONA` / `ZONA DETECTED — CONNECT` / `ZONA · fw 1.5.5 · page 3` / `DISCONNECT ZONA`. On the front door it is secondary in weight to the pad; `TRY ON DEVICE` in the panel and `CONNECT` in the header call the same session action. Enabled only when `"serial" in navigator && isSecureContext`; never gated by user agent.
- **D-03 [user, kickoff]** Two different messages for unsupported browser and insecure context, each naming the fix; the unsupported one names Chrome, Edge and desktop Firefox 151+ and never says "Chromium". Phase 4's `UNSUPPORTED_DETAIL` already satisfies the wording; this phase places it.
- **D-04 [orchestrator]** CONN-03's pre-click explanation is one quiet Body line beside the control: what the browser's picker is, that the browser asks and not HANGAR, and that HANGAR sees nothing until the visitor chooses. On Firefox the line gains the two-step wording (a site-permission prompt first, then the picker) — detected by the prompt's behaviour, never by user agent.

**The session**
- **D-05 [orchestrator]** A single session store (`src/lib/device/session.svelte.ts`, runes, one instance per page load) owns the port, the identity, the phase and the failure; components subscribe. Navigation between `/`, `/c/<id>/` and `/browse/` never closes it (SvelteKit's client router keeps the module alive); a full reload re-establishes it through silent reconnect.
- **D-06 [user, kickoff pull-in]** Silent reconnect: on load, `navigator.serial.getPorts()`; if a previously granted ZONA is attached, the header offers `ZONA DETECTED — CONNECT` and one click connects without the picker (Phase 2 measured the grant surviving a browser restart). It never auto-opens the port without a click (SAFE-01's spirit: nothing happens without an explicit click, and an open port is exclusive — the visitor may want Grid Editor to have it).
- **D-07 [orchestrator]** `navigator.serial`-level `connect` and `disconnect` listeners (Phase 2's transport listens on the port only): unplugging flips the session to `unplugged` immediately and says so; replugging a granted port offers reconnect. `SerialPort.connected` is used where present, feature-detected.
- **D-08 [user, kickoff]** Multi-module rigs are detected (Phase 2's identification already sees the other modules' heartbeats) and named in the identity line: `ZONA · fw 1.5.5 · page 3 · with EN16, BU16`. Phase 7 uses this for SAFE-06.
- **D-09 [orchestrator]** CONN-07: the picker is filtered to VID 0x303a / PID 0x8123 only (already in `openZonaPort`); after opening, the module is verified as a ZONA from its heartbeat before any control enables; any other module lands in `not-zona` with the plain message. CONN-08: type and firmware are always visible while connected.
- **D-10 [orchestrator]** A visible `FORGET THIS ZONA` control (backed by `SerialPort.forget()`, feature-detected) lives in a quiet disclosure beneath the identity — the trust control the STACK research recommended for a site that will write firmware config.

**Failures**
- **D-11 [user, kickoff]** Port held by another program names Grid Editor as the likely culprit with the recovery in order: quit the other app, unplug, wait, replug, reload, connect (Phase 4's `failureCopy` already has it; this phase surfaces it in the session's failure slot).
- **D-12 [orchestrator]** CONN-05: a cancelled picker is its own state ("you cancelled — nothing happened"); an empty picker branches to the cable and driver checks with the charge-only USB cable warning. Distinguishing "cancelled" from "nothing listed" is not exposed by the API (`requestPort` rejects with `NotFoundError` in both), so the empty-picker copy is reached by a `Nothing listed?` disclosure next to the cancelled state — research confirms or corrects.
- **D-13 [orchestrator]** Every failure is a named state in the session (`unsupported`, `insecure`, `cancelled`, `port-busy`, `not-zona`, `silent`, `unplugged`, `unknown`), each with `failureCopy` and a way out; no raw exception text ever reaches the screen except as the quoted detail line.

**Proof**
- **D-14 [orchestrator]** `FakeTransport` and the Phase 2 captures drive the session in Vitest (state machine, reconnect offer, unplug/replug transitions, multi-module naming, never-writes); a `/dev/session/` probe page with a scripted fake serial (`navigator.serial` shimmed by an init script) lets Playwright walk the states in both projects, including the degrade path.
- **D-15 [user, standing]** The hardware truths — silent reconnect after a browser restart, unplug/replug, the Grid-Editor-holds-the-port message, the not-a-ZONA refusal — are the user's daytime checklist (`docs/SESSION-RUNBOOK.md`), a `checkpoint:human-verify` in the final plan.

### Claude's Discretion

CONTEXT.md declares no explicit discretion section. Read against D-01..D-15, the researcher/planner freedoms are: the internal shape of the session store (class vs. closure, which fields are `$state` vs. `$state.raw`), the module/file split under `src/lib/device/`, the exact name and shape of the Playwright serial shim, the wording of new copy that CONTEXT.md does not fix, and the ordering of plans. The three questions CONTEXT.md leaves **open for the user** are:
1. Whether the header device slot may show the firmware/page line permanently or only on hover.
2. Whether silent reconnect should auto-open on a returning visit (decided NO — one click).
3. Whether `FORGET THIS ZONA` belongs in v1.

### Deferred Ideas (OUT OF SCOPE)

Any write (Phase 7: snapshot, PUT BACK, KEEP ON DEVICE). Android WebUSB and iOS transports (recorded as a possible later spike; not here). Changing the front door's choreography.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **CONN-01** | One primary `CONNECT` control, enabled only when `"serial" in navigator && isSecureContext` — never gated by user-agent sniffing | `capabilityOf()` and `webSerialAvailable()` already ship (Phase 2/4) and are pure over an explicit env record. §Browser Support Matrix gives the true support set; §Pitfall 8 gives the enterprise-Firefox hole in the current copy. The session hoists this one capability read to one place site-wide (§Pattern 1). |
| **CONN-02** | Two different messages for unsupported browser and insecure context, each naming the fix; the unsupported one names Chrome, Edge and desktop Firefox 151+ and never says "Chromium" | Phase 2's `failureCopy("no-web-serial")` / `("insecure-context")` already carry exactly this wording. Phase 6 places them in the header slot and the panel. §Pitfall 8 argues for one added sentence covering the enterprise-policy case; §Code Example 6 shows how to reach the `insecure` branch in a real browser for the first time. |
| **CONN-03** | Pre-click explanation of the picker: what it is, that the browser asks not HANGAR, that HANGAR sees nothing until they choose | §Firefox Two-Step confirms the Firefox "add-on gating" prompt appears **before** the port picker on first request, per Mozilla's own announcement. §Pattern 6 gives a behaviour-based (not user-agent) way to earn the two-step wording. |
| **CONN-04** | Port held by another program names Grid Editor and gives the ordered recovery, not the raw exception | Chromium source read directly: `NetworkError` + literal `"Failed to open serial port."` (`serial_port.cc:46`). `classifyOpenError` already branches on `name`, never the string. §Failure Taxonomy adds the two `InvalidStateError` cases the current classifier maps to `unknown`. |
| **CONN-05** | Cancelled picker is distinct from an empty picker; the empty branch names cable and driver, charge-only cable included | **D-12 is CONFIRMED, and it is worse than stated.** §Failure Taxonomy, row `cancelled`: the WICG algorithm has exactly one post-prompt rejection, and Chromium reaches it from three different causes with one message. |
| **CONN-06** | Returning user reconnected from `getPorts()` without the picker; unplug/replug updates the UI via `connect`/`disconnect` instead of failing on the next write | §Permission Persistence proves the grant is **persistent on all three desktop platforms** for a ZONA (firmware source: `iSerialNumber` is set to a 12-hex chip ID). §The Replug Identity Trap is the single most important implementation fact in this document: after a replug the `SerialPort` **object is new**. |
| **CONN-07** | Picker filtered to 0x303a/0x8123, bootloader identities never offered, heartbeat verification before any control enables, other modules refused plainly | **Filter-and-verify is mandatory, confirmed at firmware source:** `grid_esp32_usb.c:24` calls `grid_usb_init(0x303a, 0x8123, serial)` in the component shared by *every* ESP32-S3 Grid module. The filter does **not** narrow the picker to a ZONA. §Multi-module and Wrong-module. |
| **CONN-08** | Module type and firmware visible, so "connected" means "connected to a ZONA" | `Identity` already carries `zona.moduleType`, `zona.revision`, `zona.firmware`, `activePage`, `otherModules`. §Pattern 4 and §Header Coexistence cover where it goes and what it must degrade to on a phone. |
| **SAFE-01** (spirit) | Nothing written without an explicit click; the connect screen says so | §Pattern 8, the never-writes gate: reproduce `try-on.spec.ts`'s two-halves proof over the session module. D-06's "never auto-open" is the same principle applied to the port itself. |
| **DEGR-02** (partial) | Install controls present-but-disabled with the reason inline, never hidden | Already satisfied by `TryOnDevice`; the header slot must obey the same rule (present, real `disabled`, reason adjacent) rather than disappearing on WebKit. Owned in full by Phase 7. |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

Actionable directives extracted from `hangar/CLAUDE.md` that bind this phase:

| Directive | Consequence for Phase 6 |
|-----------|-------------------------|
| **Feature-detect, never sniff.** `if ("serial" in navigator)` plus a `requestPort()` try/catch. Browser sniffing for the Web Serial gate is listed under **What NOT to Use**. | No plan may introduce a user-agent read. The Firefox two-step copy must be earned behaviourally (§Pattern 6). |
| **`requestPort()` first inside the click handler; never after an `await`.** Listed under What NOT to Use as "Calling `requestPort()` after an `await` of the WASM init". | The session's `connect()` must be callable such that the chooser call is the first statement of the click handler with nothing awaited in front — from **two** call sites now (header and panel). §Pattern 5. |
| **No Web Serial polyfill; no WebUSB fallback.** | Nothing in this phase attempts either. |
| **Reuse the proven transport shape** (`serial-transport.ts` port, `@types/w3c-web-serial`, `navigator.serial`-level listener pair). | Already shipped in `src/lib/transport/web-serial.ts`. Phase 6 consumes it; it does not re-port it. |
| **Exact pin on `@intechstudio/grid-protocol`; no caret.** | `1.20260825.1135` stays. No plan may bump it. |
| **`SerialPort.forget()` — ship a visible "Revoke this site's access to your ZONA" control.** | D-10 is CLAUDE.md-endorsed, not merely orchestrator discretion. |
| **`navigator.serial.getPorts()` for silent reconnect; a real chooser otherwise.** | D-06 is CLAUDE.md-endorsed. |
| **`SerialPort.connected` — feature-detect it; not in the Chrome 89 baseline.** | Already `portIsAttached()`. The same discipline is now needed for `forget()` (§Pitfall 3). |
| **GPLv3 header on every source file**; `Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.` | Every new file in this phase. |
| **GSD workflow enforcement** — no direct repo edits outside a GSD workflow. | This research writes exactly one file and commits nothing. |
| **No emojis anywhere.** | Copy and code comments. |

Nothing in this research recommends an approach that contradicts CLAUDE.md.

---

<research_summary>
## Summary

Phase 6 is not a Web Serial phase. Every byte-level question was answered by Phase 2 and every visitor-facing string but a handful was written by Phase 4. What Phase 6 actually builds is **one long-lived object that outlives a component**, and the research that matters is about lifetimes: which JS object survives a client navigation (all of them), which survives a reload (none), which survives an unplug (the permission, but **not** the `SerialPort` object), and which of those the browser will hand back without a gesture.

Three findings change the shape of the work. **First**, the picker filter does not do what CONN-07's phrasing implies: reading `grid-fw/esp32s3/components/grid_esp32_usb/grid_esp32_usb.c:24` shows `grid_usb_init(0x303a, 0x8123, serial)` sitting in the component every ESP32-S3 Grid module builds against — so an EN16 RevH on a cable appears in the *filtered* picker, and only the heartbeat refuses it. Filter-and-verify is not belt-and-braces; the verify is the whole of it. **Second**, after an unplug and replug of a wired port Chromium mints a **new token** and therefore a **new `SerialPort` JS object** (`content/browser/serial/serial_service.cc:317-325` returns `nullopt` from `GetPersistentIdentifier` for every non-Bluetooth port, so `ToBlinkType` passes the enumerator's fresh token straight through). A session that stores its port and waits for `connect` to fire on that object waits forever. **Third**, D-12 is confirmed and understated: the WICG algorithm has exactly one post-prompt rejection path, and Chromium reaches it from three separate causes — user cancelled, list was empty and the user dismissed it, and serial blocked by a content setting — all with the identical `NotFoundError: No port selected by the user.` A disclosure is the only honest UI.

The good news is larger than the bad. `grid-fw` sets `iSerialNumber` to a 12-hex-character chip ID, which means `SerialChooserContext::CanStorePersistentEntry` returns true on **all three** desktop platforms, not only Windows — so CONN-06's silent reconnect is a real promise everywhere, and PITFALLS C10's LOW-confidence "may only be ephemeral" row can be closed. `MODULE_GONE_MS = 750` has been sitting unused in `constants.ts` since Phase 2 waiting for exactly this phase's liveness watchdog. And the one genuine architectural hazard — a session module imported by a header component that renders on the first paint of `/` would drag the 131 KB protocol chunk onto the critical path and turn `config-shape.spec.ts` test 14 red — is solved by the discipline Phase 4 already proved: dynamic imports resolved in `onMount`, nothing awaited in front of `requestPort()`.

**Primary recommendation:** build `src/lib/device/session.svelte.ts` as a runes **class** whose reactive fields are scalars and `$state.raw` snapshots only, whose port and transport live in plain private fields, and which reaches `$lib/transport` / `$lib/protocol` / `$lib/device/try-on` **exclusively through dynamic imports resolved once in a root-layout `onMount`** — then have `TryOnDevice` and a new header slot both render from it and both call its one `connect()` action. Prove the state machine in Vitest against `FakeTransport` and the Phase 2 captures, prove the browser half against a scripted `navigator.serial` shim installed by `addInitScript`, and hand the five things a shim cannot fake to the user as `docs/SESSION-RUNBOOK.md`.
</research_summary>

---

<standard_stack>
## Standard Stack

**No new runtime or dev dependency is required or recommended for this phase.** Every capability it needs is already installed and already pinned. Verified against the working tree on 2026-09-04.

### Core (already present)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `svelte` | 5.57.0 (installed) | Runes; `.svelte.ts` module reactivity | D-05 requires runes in a `.ts` module, which is a first-class Svelte 5 feature (`.svelte.js` / `.svelte.ts`). Verified in `node_modules/svelte/src/internal/client/proxy.js:53` that `$state` only deep-proxies plain objects and arrays — a `SerialPort` or a `WebSerialTransport` placed in `$state` is stored unproxied. |
| `@sveltejs/kit` | 2.70.3 (installed) | Client router that keeps the module graph alive across navigation | D-05's "navigation never closes it" is a property of the client router, not of any code Phase 6 writes. The port is only closed by `pagehide`, which a client navigation does not fire. |
| `@types/w3c-web-serial` | 1.0.8 (installed) | `Serial`, `SerialPort`, `SerialPortFilter` typings | Already in `devDependencies` and already used. **Read the file before writing feature detection:** it declares `connected` and `forget()` as **non-optional** members of `SerialPort`, exactly as it declares `Navigator.serial` non-optional. TypeScript will not stop a Chrome 89 build calling `port.forget()`. Every capability check must be a runtime `in` test. |
| `@intechstudio/grid-protocol` | 1.20260825.1135 (exact pin) | `grid.module_type_from_hwcfg`, `grid.module_hwcfgs()` for the identity line | Already the only source of a module's human name. `module_hwcfgs()` returns 42 entries; one of them (`hwcfg 255`) has **no `type` field at all**, so `moduleType` is legitimately `undefined` and every consumer must handle it. |

### Supporting (already present)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.11 | The session state machine, driven by `FakeTransport` | The `server` project already compiles `.svelte.ts` through the inherited `sveltekit()` plugin. See §Pitfall 10 for the spec-naming trap. |
| `@playwright/test` | 1.62.1 | The browser half, through a scripted `navigator.serial` shim | `context.addInitScript` is the proven mechanism — `e2e/skeleton.e2e.ts` and `e2e/first-experience.e2e.ts` already use it to **delete** `Navigator.prototype.serial`, which proves the property is `configurable` and therefore redefinable. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A runes class in `session.svelte.ts` (D-05) | A plain TS module with a subscriber list plus a thin rune wrapper | This is the codebase's existing convention — `src/lib/sim/host.ts:41` and `src/lib/tune/model.ts:56` both state "nothing here may go into a Svelte rune" and the repo currently contains **zero** `.svelte.ts` files. D-05 is locked, so build the runes class — but obey the convention *inside* it: scalars and `$state.raw` snapshots in runes, engines and ports in plain fields. |
| `$state` for the identity | `$state.raw` for the identity | `Identity` is a plain object holding a plain object and an array, so `$state` **would** deep-proxy all of it. It is replaced wholesale, never mutated. `$state.raw` is correct and cheaper. |
| A module-level singleton | `setContext` in the root layout | Context would be tidier for SSR isolation but requires every consumer to be inside the layout's component tree, which they are, and adds a lookup for no gain. The prerenderer never evaluates the device path anyway (§Pattern 2). Singleton is right; D-05 says "one instance per page load" and a module singleton on the client is exactly that. |
| A `BroadcastChannel` "already connected in another tab" detector (PITFALLS C10) | Nothing | Two HANGAR tabs produce the identical `NetworkError` as Grid Editor, so the visitor is told to quit Grid Editor when the culprit is their own second tab. Real, but not in CONN-01..08 and not in CONTEXT.md. Log as a deferred item; do not build it here. |

**Installation:** none.

```bash
# Nothing to install. Verified present in package.json / node_modules on 2026-09-04:
#   svelte 5.57.0, @sveltejs/kit 2.70.3, @types/w3c-web-serial 1.0.8,
#   vitest 4.1.11, @playwright/test 1.62.1, @intechstudio/grid-protocol 1.20260825.1135
```
</standard_stack>

---

## Browser Support Matrix (verified 2026-09-04)

Source: `mdn/browser-compat-data` `api/Serial.json` and `api/SerialPort.json`, fetched from `main`. HIGH confidence — this is the data MDN's own tables render.

| Feature | Chrome | Edge | Firefox desktop | Safari (all) | Chrome Android | Firefox Android |
|---------|--------|------|-----------------|--------------|----------------|-----------------|
| `Serial`, `getPorts`, `requestPort` | **89** | mirrors Chrome | **151** | never | 138, *partial* | never |
| `SerialPort.open` / `close` / `readable` / `writable` / `getInfo` | 89 | mirror | 151 | never | 138 | never |
| `connect` / `disconnect` events | 89 | mirror | 151 | never | 138 | never |
| **`SerialPort.forget()`** | **103** | mirror | **151** | never | 138 | never |
| **`SerialPort.connected`** | **130** | mirror | **151** | never | 138 | never |

Chrome Android 138's note, verbatim from BCD: *"Serial ports are only available if they're provided by Bluetooth RFCOMM serial port emulation."* A USB-attached ZONA is unreachable there. Safari on iOS mirrors Safari: never.

**Consequences the planner must carry:**
- `forget()` (D-10) is Chrome **103+**, not the Chrome 89 baseline. Feature-detect with `"forget" in port`. On a browser without it, the control must not render at all — a `FORGET THIS ZONA` button that does nothing is worse than none.
- `connected` (D-07) is Chrome **130+**. `portIsAttached()` already returns `boolean | undefined` for exactly this reason; every consumer must treat `undefined` as "unknown", never as `false`.
- There is **no** browser that has Web Serial but lacks `connect`/`disconnect`. D-07's listener pair is unconditional.

---

## The Failure Taxonomy — D-12 confirmed, and one correction

### The `requestPort()` rejection, from the spec and from Chromium

The WICG algorithm (https://wicg.github.io/serial/, `requestPort()` method steps) has exactly **three** rejection points and only one of them is after the prompt:

1. `SecurityError` — the document is not allowed to use the `serial` permission policy.
2. `SecurityError` — *"If the relevant global object of this does not have transient activation"*. Chromium's message: `"Must be handling a user gesture to show a permission request."` (`third_party/blink/renderer/modules/serial/serial.cc:291-293`). This one is **thrown synchronously**, not rejected — it is an `ExceptionState` throw, so `await navigator.serial.requestPort(...)` inside a `try` still catches it, but `.catch()` on a stored promise does **not** see it. The Phase 4 handler stores the promise (`const picking = navigator.serial.requestPort(...)`) and attaches `.catch()` — **a lost activation would throw at the call site, not reject `picking`.** Wrap the call.
3. `TypeError` — a malformed filter. Not reachable with `ZONA_USB`.

And then, after the prompt: *"If the user does not choose a port, queue a global task … to reject promise with a `NotFoundError` DOMException"*. That is the **whole** of it.

### Chromium reaches that one rejection from three causes

`third_party/blink/renderer/modules/serial/serial.cc`:

```
 47: const char kNoPortSelected[] = "No port selected by the user.";
...
425:   resolver->RejectWithDOMException(DOMExceptionCode::kNotFoundError, kNoPortSelected);   // service connection lost
...
504:   if (!port_info) {
505:     resolver->RejectWithDOMException(DOMExceptionCode::kNotFoundError, kNoPortSelected);  // chooser returned nothing
```

Cause A: the user pressed Cancel. Cause B: the filtered list was empty, the chooser still opened, and the user dismissed it — Chromium does not short-circuit an empty chooser, and `port_info` is null either way. Cause C: serial is blocked by a content/site setting, in which case (crbug 373660806, "Better handling of navigator.serial.requestPort when serial is blocked by content setting") the chooser never appears and the site gets the same `NotFoundError` with the same message. **There is no `name`, no `message`, and no side-channel that separates them.**

**Verdict on D-12: CONFIRMED, and extend it by one.** The `cancelled` state's disclosure needs two branches beneath it, not one:
- `Nothing listed?` → the cable and driver branch, charge-only cable warning included (CONN-05).
- `The chooser never appeared?` → serial may be blocked for this site in the browser's own settings. This is the third cause, it is real, and it is currently invisible.

Firefox: no evidence of a different rejection. It implements the same spec algorithm and there is one rejection point in it. **MEDIUM confidence** — not verified against Gecko source, and the Firefox-only add-on-gating prompt sits in front of the chooser, so a user who declines *that* prompt presumably also lands in `NotFoundError`. Treat identically; the runbook row (§Hardware Checklist, row F) is where it gets checked.

### The complete taxonomy for the session

`OpenFailure` today is `"no-web-serial" | "insecure-context" | "cancelled" | "port-busy" | "unplugged" | "unknown"`. D-13 names eight session states. Here is every DOMException the two calls can produce, mapped, with the two rows `classifyOpenError` currently drops into `unknown`:

| Cause | `name` | Chromium message (source-verified) | Session state | Handled today? |
|-------|--------|-----------------------------------|---------------|----------------|
| No `navigator.serial` | — | — | `unsupported` | ✅ `capabilityOf` |
| Not a secure context | — | — | `insecure` | ✅ `capabilityOf` |
| No transient activation | `SecurityError` (**thrown**) | `Must be handling a user gesture to show a permission request.` | → `unknown` | ⚠️ **and it is thrown, not rejected** — see above |
| Permissions-Policy blocks `serial` | `SecurityError` | `Access to the feature "serial" is disallowed by permissions policy.` | → `unknown` | ⚠️ only reachable if HANGAR is ever embedded |
| User cancelled / list empty / blocked by setting | `NotFoundError` | `No port selected by the user.` | `cancelled` (+ two disclosures) | ✅ |
| Port held by another program | `NetworkError` | `Failed to open serial port.` (`serial_port.cc:46`) | `port-busy` | ✅ |
| Device gone between pick and open | `NetworkError` | same string | `unplugged` (via `port.connected === false`) | ✅ |
| **`open()` on an already-open port** | `InvalidStateError` | `The port is already open.` (`serial_port.cc:121-122`) | **new: `already-open`** | ❌ → `unknown` |
| **Two `open()` calls racing** | `InvalidStateError` | `A call to open() is already in progress.` (`serial_port.cc:114-116`) | **new: `already-open`** | ❌ → `unknown` |
| Reads/writes after device loss | `NetworkError` | `The device has been lost.` (`serial_port.cc:47`) | `unplugged` | n/a — read loop path |

The two `InvalidStateError` rows are exactly the two-components-racing hazard that a **site-wide** session introduces and a per-panel one did not (research focus 10). They are not user errors and they must never reach the screen as copy — they are a bug in HANGAR. Recommended handling: an in-flight guard in the session (§Pattern 5) makes them unreachable, and `classifyOpenError` gains an `already-open` branch whose copy is a plain "HANGAR is already connecting — one moment" with no recovery steps, so that if the guard ever fails the visitor sees a sentence rather than `The port is already open.`

---

## Permission Persistence — CONN-06's foundation, now proven rather than hoped

PITFALLS C10 carried two rows at **MEDIUM/LOW**: whether grants persist across a browser restart, and whether persistence depends on the device exposing a distinguishing USB serial-number string, with the note *"I could not find a serial number string descriptor in `grid-fw`'s ESP32-S3 tree"*. Both are now closed.

**Chromium's rule** (`chrome/browser/serial/serial_chooser_context.cc:542-565`):

```cpp
bool SerialChooserContext::CanStorePersistentEntry(const SerialPortInfo& port) {
  if (!port.display_name || port.display_name->empty()) return false;
  ...
#if BUILDFLAG(IS_WIN)
  return !port.device_instance_id.empty();
#else
  const bool has_usb = port.has_vendor_id && port.has_product_id &&
                       port.serial_number && !port.serial_number->empty();
  if (!has_usb) return false;
```

If this returns false, the grant goes into `ephemeral_ports_` instead — and `SerialChooserContext::OnPortRemoved` (line 625-638) **erases an ephemeral grant the moment the device is unplugged** (`kEphemeralByDisconnect`).

**`grid-fw`'s answer** (`esp32s3/components/grid_esp32_usb/grid_esp32_usb.c:20-24`):

```c
uint32_t id[4] = {0};
grid_platform_get_id(id);
static char serial[13];
grid_platform_id_to_hex((const uint8_t*)id, 6, serial);
grid_usb_init(0x303a, 0x8123, serial);
```

and `common/src/c/grid_usb.c:116-120`:

```c
void grid_usb_init(uint16_t vid, uint16_t pid, const char* serial) {
  s_device_desc.idVendor = vid;
  s_device_desc.idProduct = pid;
  s_str_table[3] = serial;
  s_device_desc.iSerialNumber = (serial != NULL) ? 0x03 : 0x00;
```

ZONA presents a **12-hex-character serial number derived from the chip's unique ID**, and `iSerialNumber` is set. Therefore `CanStorePersistentEntry` returns true on Windows (via `device_instance_id`), on macOS and on Linux (via VID + PID + non-empty serial). **The grant is persistent on all three desktop platforms, and an unplug does not revoke it.** Confidence: HIGH — two source trees read directly, corroborated by Phase 2's measurement (`docs/SKELETON-RESULTS.md`, "the grant survived quitting Chrome 152 completely and reopening it: `previously granted ports: 1`").

**Three consequences the copy must respect:**

1. The grant is **per physical module**, because the serial number is per chip. A visitor who plugs in a *second, different* ZONA gets a port this origin has never been granted — `getPorts()` will not return it and the picker is required. The header's returning-visitor copy should therefore say **"ZONA detected"**, not "your ZONA is remembered", and the reconnect offer must silently fall through to the full picker when `getPorts()` comes back empty.
2. The grant is **per origin**. `docs/SKELETON-RESULTS.md` already flags this: the `http://127.0.0.1:4173` grant says nothing about the deployed HTTPS origin. Still open; §Hardware Checklist row A covers it.
3. `getPorts()` is spec'd to return only **available** ports — *"A serial port is available if it is a wired serial port and the port is physically connected to the system"*. A granted-but-unplugged ZONA is simply absent from the list. So `getPorts().length === 0` means "not plugged in right now", **not** "no grant", and the UI must not say the latter.

---

## The Replug Identity Trap (read this before writing the connect listener)

This is the highest-value finding in the phase and it is not documented anywhere in the project's existing research.

**`content/browser/serial/serial_service.cc:317-325`:**

```cpp
std::optional<std::string> SerialService::GetPersistentIdentifier(
    const device::mojom::SerialPortInfo& port) {
  if (!port.bluetooth_service_class_id) {
    return std::nullopt;          // <-- every wired port
  }
  ...
}
```

and `ToBlinkType` (line 299-312) therefore takes the `else` branch for a wired ZONA: `info->token = port.token` — the **enumerator's** token, which `SerialDeviceEnumerator::AddPort` generates fresh on every physical attach (`services/device/serial/serial_device_enumerator.cc:85-93`; `RemovePort` erases it outright at :97-108).

Blink caches `SerialPort` JS objects by that token (`serial.cc:441-452`, `GetOrCreatePort`). So:

| Event | What Chromium does | What your JS sees |
|-------|--------------------|-------------------|
| **Unplug** | `RemovePort` sets `connected = false`, then `SerialService::OnPortRemoved` forwards `OnPortConnectedStateChanged` | `disconnect` fires **on the port object you are holding**, `ev.target === yourPort`, and `yourPort.connected` is now `false`. ✅ |
| **Replug** | `AddPort` with a **brand-new token** → `SerialService::OnPortAdded` → `OnPortConnectedStateChanged` | `connect` fires on a **different `SerialPort` object**. Your stored reference is orphaned forever and its `connected` stays `false`. ❌ |

**Therefore:**
- The `disconnect` handler may compare `ev.target === this.port`. `WebSerialTransport.handleDisconnect` already does, and it is correct.
- The `connect` handler **must not**. It must identify the arriving port by `ev.target.getInfo()` matching `ZONA_USB`, and the session must **adopt** that new object — discarding its old reference — before offering the one-click reconnect.
- The reconnect click must `open()` the **adopted** port, or re-run `getPorts()` and take the first match. Reusing the pre-unplug object yields `NetworkError` at best.
- The permission is untouched by all of this (it is keyed by VID/PID/serial in `SerialChooserContext`, not by token), which is why `getPorts()` returns the replugged module immediately.

Confidence: **HIGH** for Chromium (three source files read). **MEDIUM** for Firefox — unverified, and the defensive design (identify by `getInfo()`, adopt the event's port) is correct on both regardless.

---

## Multi-module, and why the picker filter is not a filter (CONN-07, D-08)

`grid-fw/esp32s3/components/grid_esp32_usb/grid_esp32_usb.c` is a **shared** component: every ESP32-S3-generation Grid module — EN16 RevH, BU16 RevH, PBF4 RevH, PO16 RevH, VSN*, OCTV, TEK*, ZONA — links it, and it hard-codes `0x303a, 0x8123`. The USB string table (`common/src/c/grid_usb.c:59-66`) is `"Intech Studio"` / `"Grid"` for every one of them.

So the picker, filtered exactly as CONN-07 requires, offers **every attached ESP32-S3 Grid module, all labelled the same way**. The older SAMD51 generation uses `0x03eb, 0xecad` (`d51n20a/grid/d51/grid_d51_usb.c:20`) and is correctly excluded, as is any ESP32 bootloader identity. This is not a defect to fix — it is the reason CONN-07 says *filter **and** verify*, and it makes the `not-zona` state a routine outcome for a visitor with a rig, not an exotic one.

**Naming the other modules (D-08).** `absorbFrame` already folds every inbound `HEARTBEAT` into `state.seen`, keyed `${sx},${sy}`, carrying `moduleType`, `revision`, `firmware` and `heartbeatType`; `identify()` splits out the one module with `heartbeatType === 1 && hwcfg === ZONA_HWCFG` and returns the rest as `otherModules`. Everything D-08 needs already exists. Three details:

- **Timing.** `identify()` resolves the instant the ZONA's own heartbeat with a page report lands — Phase 2 measured that at roughly 250 ms (the module heartbeats at 4.00/s unprompted). But a chained module's heartbeat may not have arrived yet. The identity line's `· with EN16, BU16` tail is therefore **late-arriving**: it must render as a slot that fills in, not as part of the first paint of the identity, and it must keep filling for the whole `IDENTIFY_WINDOW_MS` at minimum. Recommendation: keep folding heartbeats for the life of the session (§Pattern 7) and derive `otherModules` continuously rather than freezing it at `identify()`.
- **Ordering.** `[...state.seen.values()]` is Map insertion order — arrival order, which is non-deterministic across runs. Sort for the display: by `sx`, then `sy`. A line that reorders itself between two loads reads as a bug.
- **`moduleType` can be `undefined`.** `grid.module_hwcfgs()` contains an entry with `hwcfg 255` and **no `type` key**, and `module_type_from_hwcfg` returns undefined for anything unlisted. Render `unknown module` (Phase 4's `notZonaBody` already does exactly this) rather than an empty slot.
- **`not-zona` names the wrong module arbitrarily.** `identifyOnly` returns `seen[0].moduleType` — the first module *by arrival*. With a rig on the cable that may not be the USB-attached one. Recommendation: prefer the module with `heartbeatType === 1`, which is by definition the one on the cable (`grid_decode.c:695-700`), and fall back to `seen[0]`. This is a small, testable change to `try-on.ts` and it makes the sentence true.

**What is unproven:** `docs/SKELETON-RESULTS.md` section (e) is explicit — *"every BRC header carried SX 0, SY 0. Not one frame in the run came from any address but the ZONA on the USB cable"*, and *"D-12's other-module path … was never exercised against real traffic."* D-08 is provable only against `FakeTransport` in this phase. `src/lib/transport/fixtures/synthetic.ts` exports `heartbeatFrame({ sx, sy, type, hwcfg, activePage, firmware })`, which builds a real encoder-derived heartbeat for **any** hwcfg — so a synthetic EN16 RevH (`hwcfg 195`) and BU16 RevH (`hwcfg 131`) at `sx 1,0` and `sx 2,0` with `type 0` is a three-line fixture. Use it. The hardware row is §Hardware Checklist row D.

---

## Firefox: the two-step prompt and the enterprise hole

**The two-step prompt (D-04, CONN-03).** Mozilla's own announcement (hacks.mozilla.org, 2026-05): *"To help users understand when and why a site requests access to a serial port, Firefox uses add-on gating… The add-on gating prompts appear before the port selection prompt the first time a site requests port access."* Permissions are **per-site and per-port**. HIGH confidence — first-party source.

Two behavioural consequences:
- The `choosing` state can last **much** longer on Firefox than on Chrome: two modal prompts, the first of which looks like an extension install. `CONNECTING…` with a spinner and no explanation for thirty seconds is how a visitor bails.
- It appears **"the first time a site requests port access"** — so it is a first-visit-only cost, which is another reason the copy should describe it rather than assert it every time.

**The enterprise hole, and it is a real hole in the copy we ship today.** `DefaultSerialGuardSetting` (mozilla.github.io/enterprise-admin-reference, Firefox 151+, ESR 153+): *"If any enterprise policies are set, the WebSerial API is blocked by default."* To allow it the admin must explicitly set the value to `3`. The policy's stated effect is on the preference **`dom.webserial.enabled`**.

Gecko's convention is to gate a WebIDL interface on such a pref, which would make `navigator.serial` **absent** — landing an enterprise-managed Firefox 151+ user in HANGAR's `unsupported` state, reading *"This browser cannot talk to hardware… Open this page in Chrome, Edge, or desktop Firefox 151+"* while they are sitting in desktop Firefox 155. That is the copy telling them to do the thing they have already done.

Confidence: **MEDIUM** — the policy documentation is first-party and names the pref, but I could not retrieve the Gecko WebIDL to confirm the pref removes the interface rather than only failing the calls. Both outcomes need the same fix.

**Recommended fix, and it costs one sentence and no user-agent read:** the `no-web-serial` copy gains a final line to the effect that if the visitor is already in a browser from the list, Web Serial may be switched off by a policy on that computer, and names the check (`about:policies` on Firefox, `chrome://settings/content/serialPorts` on Chrome). It is honest, it is actionable, and it names a setting rather than a browser. This is new copy CONTEXT.md does not fix, so it is the UI spec's to word — research's job is to say the state exists.

---

<architecture_patterns>
## Architecture Patterns

### Recommended file layout

```
src/lib/device/
├── try-on.ts                  # unchanged: capabilityOf, identifyOnly, TRY_ON_LABEL
├── try-on.spec.ts             # unchanged
├── session.svelte.ts          # NEW (D-05): the runes class. Scalars + $state.raw only.
├── session.spec.ts            # NEW. NOT session.svelte.spec.ts — see Pitfall 10.
├── session-copy.ts            # NEW: every visitor-facing session string, import-free
└── session-copy.spec.ts       # NEW

src/lib/ui/
├── DeviceSlot.svelte          # NEW: the header's device indicator + CONNECT/DISCONNECT
├── DeviceDetail.svelte        # NEW (optional): the identity disclosure + FORGET THIS ZONA
├── TryOnDevice.svelte         # MODIFIED: owns no port; renders the session; calls connect()
├── FrontDoor.svelte           # MODIFIED: the header row gains a second right-hand child
└── ...

src/routes/dev/session/
└── +page.svelte               # NEW: the unlinked probe route (D-14)

e2e/
└── session.e2e.ts             # NEW
└── fake-serial.ts             # NEW: the addInitScript payload + its control API

docs/
└── SESSION-RUNBOOK.md         # NEW (D-15)
```

### Pattern 1 — The session store: scalars in runes, the port in a plain field

**What:** a class exported as a module singleton. Reactive fields are scalars and `$state.raw` snapshots. The `SerialPort`, the `WebSerialTransport`, the `FrameScanner` and the `IdentifyState` accumulator are **plain private fields**, never runes.

**Why:** verified in `node_modules/svelte/src/internal/client/proxy.js:49-55`, `$state` only proxies values whose prototype is `object_prototype` or `array_prototype` — so a `SerialPort` would pass through unproxied and a plain `Identity` object would **not**. `Identity` is replaced wholesale and never mutated, so `$state.raw` is both correct and cheaper. The wider reason is the codebase's own standing rule (`src/lib/sim/host.ts:41`, `src/lib/tune/model.ts:56`): only scalars cross into a rune.

**Why a class and not `export const session = $state({...})`:** the module must be able to hold non-reactive fields beside the reactive ones. A class does that; an exported `$state` object does not. Svelte's documented restriction — *"you can only export that state if it's not directly reassigned"* — is satisfied either way, because nothing here reassigns the singleton.

```ts
// src/lib/device/session.svelte.ts
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

export type SessionPhase =
  | "unknown"        // before onMount resolved the capability
  | "unsupported" | "insecure"
  | "idle"           // capable, nothing granted or nothing attached
  | "detected"       // getPorts() found a granted ZONA — one click away
  | "choosing" | "opening" | "identifying"
  | "connected"
  | "not-zona" | "silent" | "unplugged"
  | "failed";

class DeviceSession {
  // --- reactive: scalars and whole-value snapshots only ---
  phase = $state<SessionPhase>("unknown");
  identity = $state.raw<Identity | null>(null);
  failure = $state.raw<FailureCopy | null>(null);
  /** Populated only when the browser has forget(); drives whether the control renders. */
  canForget = $state(false);

  // --- NOT reactive: host objects and hot-loop state ---
  #port: SerialPort | undefined;
  #transport: GridTransport | undefined;
  #scanner: FrameScanner | undefined;
  #identifyState: IdentifyState | undefined;
  #detachHide: (() => void) | undefined;
  #busy = false;                    // the in-flight guard, see Pattern 5
  #T: typeof import("$lib/transport") | undefined;   // resolved in start()
  #P: typeof import("$lib/protocol")  | undefined;
  #D: typeof import("$lib/device/try-on") | undefined;
}

export const session = new DeviceSession();
```

### Pattern 2 — The dynamic-import discipline, and the gate it protects

**What:** `session.svelte.ts` must contain **no static import** of `$lib/transport`, `$lib/protocol` or `$lib/device/try-on`. All three arrive through `import()` inside `start()`, which the root layout calls from `onMount`.

**Why it is not optional:** `src/lib/protocol/constants.ts:15`, `decode.ts:7`, `descriptors.ts:13` and `src/lib/transport/sequence.ts:11` all import `@intechstudio/grid-protocol` at module scope. `04-RESEARCH` measured the resulting chunk at **131,101 bytes**. A `DeviceSlot.svelte` in the header renders on the **first paint of `/`**, so a static chain `DeviceSlot → session → $lib/transport → grid-protocol` puts the whole thing on the critical path of the page whose entire job is to paint in under two seconds — and `config-shape.spec.ts`'s test *"the built front door does not preload the protocol chunk"* goes red on `build/index.html`.

**A gap the planner must close.** `config-shape.spec.ts`'s *source*-scan test (*"the front door never reaches the compiler at module scope"*) walks `src/lib/ui/` and matches specifier strings against `COMPILER_MARKERS = ["vendor", "intechstudio", "lib/pad"]`. `$lib/transport` matches none of them, so **the source scan would pass on a `DeviceSlot.svelte` that statically imports the session which statically imports the transport.** Only the artefact scan would catch it, and only after a build. Recommendation: add `"lib/transport"`, `"lib/protocol"` and `"lib/device"` to `COMPILER_MARKERS` as part of this phase, with the reason in a comment — one deliberate, named edit to a shipped gate, in the class of Phase 4's W-02 and Phase 5.1's D-13.

### Pattern 3 — Lifetime: what survives what

| Event | Session module | `SerialPort` object | Open port | Grant |
|-------|----------------|---------------------|-----------|-------|
| SvelteKit client navigation (`/` → `/c/x/` → `/browse/`) | **survives** | survives | **survives** — `pagehide` does not fire | survives |
| `<a rel="external">` (the footer's three links) | destroyed | destroyed | closed by `closeOnHide` | survives |
| Full reload / typed URL | destroyed | destroyed | closed by `closeOnHide` | **survives** — re-establish via `getPorts()` |
| Tab hidden (switch away) | survives | survives | **survives** — `closeOnHide` listens to `pagehide`, not `visibilitychange` | survives |
| Unplug | survives | survives, `connected === false` | read loop errors; `disconnect` fires | **survives** (persistent grant, §Permission Persistence) |
| Replug | survives | **NEW object** (§Replug Identity Trap) | must be re-opened | survives |
| `forget()` | survives | survives as a dead object | **not closed by `forget()`** — close first | **revoked** |
| Browser restart | destroyed | destroyed | closed | **survives** (measured, Phase 2) |

The `pagehide`-not-`visibilitychange` row is load-bearing and it is already right in the shipped code (`web-serial.ts:141-148`, with the reason in its comment: `beforeunload` is skipped by a bfcache restore). `docs/SKELETON-RUNBOOK.md` says *"The page also closes the port when the tab is hidden"* — that sentence is loose; the shipped behaviour is close-on-navigate-away, which is exactly what a site-wide session needs. Do not "fix" it toward `visibilitychange`: a visitor who alt-tabs to Ableton must not lose their connection.

**One consequence to accept and state:** while HANGAR holds the port, Grid Editor cannot open it, and a visitor who leaves a HANGAR tab open for a week is locked out of their own Editor. The `DISCONNECT ZONA` control and the `pagehide` close are the mitigations; PITFALLS C1 also suggests an idle-timeout close on `visibilitychange`. That is a Phase 7 conversation (it interacts with an in-flight write); log it as a deferred item.

### Pattern 4 — Start, on load, without a gesture

```ts
// Called once, from the root layout's onMount. Never at module scope:
// the prerenderer evaluates module scope and there is no navigator there.
async start(): Promise<void> {
  const [P, T, D] = await Promise.all([
    import("$lib/protocol"),
    import("$lib/transport"),
    import("$lib/device/try-on"),
  ]);
  this.#P = P; this.#T = T; this.#D = D;

  const capability = D.capabilityOf({
    hasSerial: "serial" in navigator,
    secure: isSecureContext,
  });
  if (capability !== "ok") {
    this.failure = T.failureCopy(
      capability === "unsupported" ? "no-web-serial" : "insecure-context",
      undefined,
      CONNECT_LABEL,
    );
    this.phase = capability;
    return;
  }

  // navigator-level listeners, for the life of the page (D-07).
  navigator.serial.addEventListener("connect", this.#onSerialConnect);
  navigator.serial.addEventListener("disconnect", this.#onSerialDisconnect);

  // No gesture required. getPorts() is spec'd to return only ports that are
  // BOTH granted AND physically present, so an empty list means "not plugged
  // in", never "no grant".
  const granted = await T.grantedZonaPorts();
  const live = granted.filter((p) => T.portIsAttached(p) !== false);
  if (live.length > 0) {
    this.#adopt(live[0]);            // permitted, NOT open (D-06)
    this.phase = "detected";
  } else {
    this.phase = "idle";
  }
}
```

`grantedZonaPorts()` already exists in `web-serial.ts:46-58` and already filters by `ZONA_USB`. The extra `portIsAttached(p) !== false` pass is belt-and-braces for the wireless/`connected` edge and costs nothing; note the `!== false`, because `undefined` on Chrome 89 must mean "keep it", not "drop it".

**`start()` never calls `open()`.** D-06 and SAFE-01's spirit. The port is adopted, the header says `ZONA DETECTED — CONNECT`, and one click opens it.

### Pattern 5 — One connect action, two call sites, one activation window

The chooser call must be the first statement of a real click handler with nothing awaited in front of it. With two controls calling the same action (D-02), the discipline has to live in the session, not in each component.

```ts
/**
 * MUST be called synchronously from a click handler.
 * requestPort() is the first statement; every module it needs was resolved in
 * start(). Transient activation EXPIRES (~4.9 s in current engines) rather than
 * being consumed, so an await in front of this call makes the picker reject
 * with something that reads to a visitor as a permissions bug.
 */
connect(): void {
  if (this.#busy) return;                    // kills both InvalidStateError rows
  this.#busy = true;

  // The adopted-port path takes no chooser at all (D-06) and therefore needs
  // no activation - but it is still behind a click, so the branch is safe here.
  if (this.#port && !this.#transport) {
    void this.#openAdopted();
    return;
  }

  let picking: Promise<SerialPort>;
  try {
    // FIRST statement. And in a try, not only a .catch(): a lost activation is
    // THROWN by Chromium (serial.cc:291-293), not rejected, so a bare
    // .catch() on the stored promise would never see it.
    picking = navigator.serial.requestPort({ filters: [this.#P!.ZONA_USB] });
  } catch (err) {
    this.#refuse(err);
    this.#busy = false;
    return;
  }
  this.failure = null;
  this.phase = "choosing";
  void this.#afterPick(picking);
}
```

**`#busy` is the whole answer to research focus 10's "two components racing to open the same port".** With the header and the panel both bound to one action, a double click, or a click on each control inside the same second, is now trivially reachable — and the failure it produces (`InvalidStateError: A call to open() is already in progress.`) is a HANGAR bug wearing a DOMException. Guard it in the session; assert it in a spec (`connect()` twice → exactly one `requestPort` call).

### Pattern 6 — Earning the Firefox two-step copy without sniffing (D-04)

The rule is behavioural, not nominal:

> Show the standard picker line always. If `requestPort()` has been pending for longer than a short threshold **and** the session has never completed a pick on this origin before, expand the line to name the two-step prompt.

Implementation: a `#pickingSince` timestamp set when `phase` becomes `"choosing"`, and a derived `slowPicker = phase === "choosing" && elapsed > TWO_STEP_HINT_MS`. Chrome's single chooser is answered in a second or two; Firefox's add-on-gating prompt plus chooser is not. `TWO_STEP_HINT_MS` should be generous (3-4 s) so a slow Chrome user never sees Firefox wording. This costs one timer and reads no browser name.

The alternative — showing the two-step sentence to everyone, always — is also acceptable and simpler, at the cost of confusing every Chrome visitor. Recommend the behavioural version; the UI spec owns the wording and the threshold.

### Pattern 7 — Stay folded while connected: liveness from `MODULE_GONE_MS`

`identifyOnly` registers one `onData` callback, folds until `identify()` resolves, and returns. For a **session**, that is not enough: after identification the page holds an open port and stops listening to a module that is still speaking 4 times a second.

`src/lib/protocol/constants.ts:59` declares:

```ts
/** Three missed heartbeats, the desktop's isAlive rule (runtime.ts:2426-2430). */
export const MODULE_GONE_MS = 750;
```

and **nothing in the repository uses it.** It has been waiting for this phase. Keeping the fold running for the life of the connection buys three things the OS-level `disconnect` event cannot:

1. **Liveness.** A module that stops heartbeating while the OS still shows the port — a firmware crash, a cable that keeps power and loses data, a hub browning out — produces no `disconnect` event and no read error. `now() - identity.zona.lastSeen > MODULE_GONE_MS` catches it. `ModuleSeen.lastSeen` is already populated by `absorbFrame`.
2. **A live active page (CONN-08).** The visitor can change page on the module itself while HANGAR is connected; the heartbeat reports it four times a second, so `· page 3` can be true rather than a snapshot from connect time.
3. **Late-arriving other modules (D-08).**

Two implementation notes: `absorbFrame` reads a module-scope `now = () => performance.now()` and is not injectable, so the watchdog should carry its own injectable clock and compare against `lastSeen` from outside — or the plan may add an optional `now` parameter to `absorbFrame` (a two-line, backwards-compatible change with an existing spec to protect it). And the watchdog must be a **self-rescheduling `setTimeout`**, never `setInterval` — `04-UI-SPEC`'s motion contract says "`setInterval`: zero, anywhere", and PITFALLS C11 warns that a timer *chain* of ≥5 is one of Chrome's intensive-throttling conditions.

### Pattern 8 — The never-writes gate, reproduced over the session

`src/lib/device/try-on.spec.ts`'s third test is the model and it should be copied, not invented:

- **Half one, dynamic:** run a full adopt → open → identify → unplug → close cycle against a `FakeTransport` that records every `write()`, and assert `transport.writes` has length 0.
- **Half two, static:** read `session.svelte.ts`'s own source, strip comments, and assert it contains none of `".write("`, `"RequestQueue"`, `"hostHeartbeat"`, `"sendConfig"`, `"storePage"`, `"fetchConfig"`, `"storeToFlash"`, `"writeBack"` — each needle assembled from fragments so the spec's own source does not contain what it forbids.

The static half is what makes it a **property of the file** rather than a claim about one code path, which is the standard the phase's honesty copy is held to.

### Anti-Patterns to Avoid

- **`$state` on the `SerialPort`, the transport, or the `IdentifyState` accumulator.** The accumulator is mutated inside a callback that runs 4+ times a second; a proxy there is pure cost. Plain fields.
- **Auto-opening on load.** D-06 forbids it, and the reason is not squeamishness: an open port is exclusive, so a HANGAR tab that auto-connects silently takes the visitor's ZONA away from Grid Editor with no click and no notice.
- **Comparing `ev.target === this.port` in the `connect` handler.** §Replug Identity Trap. Compare `getInfo()`.
- **Calling `forget()` on an open port.** The spec's `forget()` steps do not close anything. `close()` first, then `forget()`, then clear every reference.
- **Treating `portIsAttached() === undefined` as false.** Chrome 89-129 has no `connected`.
- **Branching on `"Failed to open serial port."`** It is a Chromium implementation string and it is localisable. `transport.ts` already says this; keep saying it.
- **Attaching `.catch()` to a stored `requestPort()` promise without a `try`.** The activation failure is thrown, not rejected.
- **A `setInterval` anywhere in the session.**
- **Statically importing `$lib/transport` from anything under `src/lib/ui/`.** §Pattern 2.
</architecture_patterns>

---

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Open failure classification | A new `switch` over error text in the session | `classifyOpenError(err, port)` in `src/lib/transport/transport.ts`, **extended** with one `already-open` branch | It already branches on `DOMException.name` and already uses `port.connected` to split unplugged from busy. Extend it in place; a second classifier is a second thing to keep true. |
| Failure copy | New sentences for `cancelled` / `port-busy` / `unplugged` | `failureCopy(f, raw, controlLabel)` — six failures, already written, already tested, already reviewed for the Grid Editor recovery order | CONTEXT.md D-11 and D-13 say so explicitly. Only genuinely new states need new copy. |
| Capability detection | `if (isChrome || isEdge …)` | `capabilityOf({ hasSerial, secure })` | Pure over an explicit record, so both branches are reachable from a node test. CONN-01 and CLAUDE.md both forbid the alternative. |
| Opening the port | A fresh `navigator.serial.requestPort` + `open` pair | `openZonaPort()` / `grantedZonaPorts()` / `portIsAttached()` in `web-serial.ts` | The filter, the 4096-byte `bufferSize` (MDN's default is 255, and a 690-byte REPORT would arrive in three chunks) and the granted-port filter are all already correct there. |
| The read loop, lock ordering, close ordering | Anything | `WebSerialTransport` | It already owns cancel → await-loop-exit → release-once → close, which PITFALLS C12 identifies as the thing the desktop gets wrong. It already attaches the `navigator.serial`-level listener pair D-07 asks for. |
| Frame reassembly across chunks | A byte scanner | `FrameScanner` + `decodeFrame` | Phase 2, tested against real split-chunk captures. |
| Identity from heartbeats | A heartbeat parser | `newIdentifyState` / `absorbFrame` / `identify` / `identifyTimedOut` | The three-condition page rule (`PAGENUMBER` + a `HEARTBEAT` in the same decoded frame + no `EVENTTYPE`/`ACTIONLENGTH`) kept 124 `CONFIG/REPORT` frames out of the active-page tracker in the real run. Rewriting it loses that. |
| Naming a module from an hwcfg | A lookup table | `grid.module_type_from_hwcfg()` + `grid.module_hwcfgs()` | Pinned to the same package version as the wire format. A hand-written table drifts silently at the next pin bump. |
| A fake module for tests | Hand-written hex | `FakeTransport` (+ `fromCapture`) and `fixtures/synthetic.ts`'s `heartbeatFrame` / `zonaResponder` | `synthetic.ts` builds frames through the **real encoder** and then fixes up the two documented encoder quirks. Hand-rolled hex tests the test, not the code. |
| Suite-total assertions | A literal count in a plan | `scripts/check-counts.mjs` with an observed baseline plus a stated delta | D-17. Phases interleave in one tree; a literal total is wrong the moment another phase lands a spec. |

**Key insight:** Phase 6 has almost no new primitives to write. Its risk is entirely in *lifetime and ownership* — one object, two controls, three routes, four ways the hardware can leave. Every line of new low-level code is a line that duplicates something Phase 2 already proved against a real ZONA.
</dont_hand_roll>

---

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: The replugged port is a different object
**What goes wrong:** The visitor unplugs and replugs. `disconnect` fires and the UI correctly says so. They plug back in — and nothing happens, forever.
**Why it happens:** Chromium mints a new token for a re-added wired port, so `connect` fires on a **new** `SerialPort` object. Code that listens on the stored port, or that tests `ev.target === this.port`, never sees it.
**How to avoid:** Listen on `navigator.serial`. Identify the arriving port by `ev.target.getInfo()` against `ZONA_USB`. Adopt it, replacing the stored reference. Never reuse the pre-unplug object.
**Warning signs:** `connect` handler that compares object identity; a reconnect that works after a reload but not after a replug; a test that only ever unplugs and never replugs.

### Pitfall 2: The transient activation is thrown, not rejected
**What goes wrong:** A lost activation surfaces as an unhandled exception at the call site instead of the `cancelled` state, and the visitor sees nothing at all.
**Why it happens:** `serial.cc:291-293` uses `ExceptionState::ThrowSecurityError`, which is a synchronous throw from `requestPort()`, not a promise rejection. The Phase 4 handler stores the promise and attaches `.catch()`.
**How to avoid:** Wrap the `requestPort()` call itself in `try`/`catch`, in addition to catching the rejection. Keep the call as the first statement.
**Warning signs:** An uncaught `SecurityError: Must be handling a user gesture…` in the console with no state change on screen.

### Pitfall 3: `forget()` and `connected` are typed as always present
**What goes wrong:** `port.forget()` throws `TypeError: port.forget is not a function` on Chrome 89-102 with a clean `svelte-check`.
**Why it happens:** `@types/w3c-web-serial@1.0.8` declares both as non-optional members of `SerialPort` (verified in `node_modules/@types/w3c-web-serial/index.d.ts`), exactly as it declares `Navigator.serial` non-optional — the trap `transport.ts` already documents for `navigator.serial`.
**How to avoid:** `"forget" in port` before rendering the control at all; `portIsAttached()`'s `"connected" in port` pattern for the flag. Set `canForget` once in `start()` from the first port seen.
**Warning signs:** any `port.forget()` or `port.connected` without a guard within three lines.

### Pitfall 4: `forget()` does not close the port
**What goes wrong:** The visitor clicks `FORGET THIS ZONA`, the grant is revoked, and HANGAR is still holding the port open — so Grid Editor still cannot have it, and the site is talking to a device it just told the visitor it had forgotten.
**Why it happens:** The WICG `forget()` steps remove the port from the permitted sequence and resolve. There is no close step.
**How to avoid:** `await close()` → `await port.forget()` → clear `#port`, `#transport`, `identity` → `phase = "idle"`. Assert the ordering in a spec against a fake port that records both calls.
**Warning signs:** a `forget()` call not preceded by a close in the same function.

### Pitfall 5: The protocol chunk lands on the front door's first paint
**What goes wrong:** `/` gets 131 KB of `@intechstudio/grid-protocol` on its critical path and `config-shape.spec.ts`'s artefact test goes red — after a build, not at edit time.
**Why it happens:** A header component present on every route statically imports the session, which statically imports `$lib/transport`, which imports `sequence.ts`, which imports the package at module scope.
**How to avoid:** §Pattern 2 — dynamic imports only, resolved in `start()`. And widen `COMPILER_MARKERS` so the **source** scan catches it at edit time instead of the artefact scan catching it after a build.
**Warning signs:** `from "$lib/transport"` or `from "$lib/protocol"` anywhere under `src/lib/ui/`; a build where `build/index.html` references the chunk containing `GRID_PARAMETER_ELEMENT_POTMETER`.

### Pitfall 6: The prerenderer evaluates the session's module scope
**What goes wrong:** `npm run build` dies with `navigator is not defined`, or worse, prerenders a page whose device slot is in a state derived from a server-side singleton.
**Why it happens:** `export const prerender = true` in `src/routes/+layout.ts` means every route is rendered in Node. A module-scope `navigator.serial` read, or a `start()` called at module scope, runs there.
**How to avoid:** The constructor touches nothing global. `start()` is called from `onMount` only. `phase` initialises to `"unknown"` and every component renders a stable, device-free markup for it — which is also what keeps the prerendered HTML identical for every route. Phase 4's `mounted` flag pattern (`TryOnDevice`'s `onDestroy` guard, which fires on the server immediately after render) applies unchanged.
**Warning signs:** a build error naming `navigator`, `isSecureContext` or `window`; a device slot that renders differently in `build/index.html` than on the client's first frame.

### Pitfall 7: The e2e degrade test breaks silently when the copy moves
**What goes wrong:** `e2e/first-experience.e2e.ts`'s *"with no Web Serial the control is present, disabled, and says why"* asserts the unsupported copy inside `getByTestId("connect-status")`, inside the chosen panel. If the session moves that copy to the header slot, the assertion fails — or worse, passes for the wrong reason because the panel now renders nothing.
**Why it happens:** The test asserts a location as well as a message.
**How to avoid:** Decide deliberately whether the panel keeps the unsupported block (recommended: it does — DEGR-02 says the reason is rendered *adjacent to the disabled control*, and there are now two disabled controls). If the location changes, edit the gate in the plan that changes it and name the edit in the SUMMARY — the 05.1 D-13 precedent.
**Warning signs:** any plan that touches `TryOnDevice`'s status region without naming `e2e/first-experience.e2e.ts`.

### Pitfall 8: The unsupported copy is wrong for an enterprise Firefox
**What goes wrong:** A Firefox 155 user on a managed machine is told to open the page in "Chrome, Edge, or desktop Firefox 151+".
**Why it happens:** `DefaultSerialGuardSetting` blocks Web Serial by default whenever *any* enterprise policy is set, via `dom.webserial.enabled`.
**How to avoid:** one added sentence naming the possibility and the place to check. No user-agent read.
**Warning signs:** none — this state is invisible without a managed machine to test on. It is a copy fix, not a code fix.

### Pitfall 9: `getPorts()` returning empty is read as "no grant"
**What goes wrong:** The header says something like "HANGAR has not been given access to a ZONA" when the truth is "nothing is plugged in".
**Why it happens:** The spec's `getPorts()` returns *available* ports — available means physically connected. A granted, unplugged ZONA is simply not in the list.
**How to avoid:** `getPorts().length === 0` maps to `idle` with neutral copy (`NO ZONA`), never to a statement about permission. The only honest statement about permission is made after `forget()`, which HANGAR itself performed.
**Warning signs:** any copy in the `idle` state that uses the words "access", "permission" or "granted".

### Pitfall 10: The session spec is silently excluded from the test run
**What goes wrong:** `session.svelte.spec.ts` is written, passes locally under a direct `vitest run` invocation, and is collected by **nothing** in `npm run test:quick`. The suite is green and the session is untested.
**Why it happens:** `vite.config.ts`'s `server` project excludes `"src/**/*.svelte.{test,spec}.{js,ts}"`. A spec for `session.svelte.ts` named by the obvious convention matches that glob exactly. This is the same class as the green-and-vacuous trap `docs/TESTING.md` devotes a section to.
**How to avoid:** name it **`src/lib/device/session.spec.ts`**. Add a comment at the top saying why. And verify the file count moves: `npm run test:quick 2>&1 | node scripts/check-counts.mjs <files> <tests>` fails loudly if the new file was not collected.
**Warning signs:** a new spec that adds tests but not a file to the reported count.

### Pitfall 11: A backgrounded tab starves the identify poll
**What goes wrong:** A visitor clicks connect, alt-tabs while the chooser is up, comes back, and identification has "timed out" against a module that never stopped talking.
**Why it happens:** `identifyOnly` polls every 50 ms via `setTimeout` and compares against `IDENTIFY_WINDOW_MS = 1500`. Chrome throttles hidden-tab timers to ~1 Hz, and intensively to 1/min after 5 minutes. `performance.now()` keeps real time, so the deadline passes while the poll has run once.
**How to avoid:** The window is only 1500 ms and it starts *after* the port opens, so the exposure is narrow — but a session that reconnects on a `connect` event could hit it squarely. Recommendation: do not run identification while `document.hidden`; on `visibilitychange` → visible, restart the window. Do not extend the timeout — that hides the symptom. PITFALLS C11 is the standing reference.
**Warning signs:** `silent` states that only reproduce when the developer tabs away to read the docs.

### Pitfall 12: The identity line overflows the phone header
**What goes wrong:** On a 360px viewport the header row holds `HANGAR`, the Phase 5.1 `BROWSE ALL` slot and `ZONA · FW 1.5.5 · PAGE 3` and either wraps, truncates mid-word, or pushes a horizontal scrollbar onto the front door.
**Why it happens:** Micro role is 12px / 600 / **0.18em tracking / uppercase**. At 360px the gutter is 24px each side, leaving ~312px. Rough arithmetic at ~9.7px per uppercase character including tracking: `HANGAR` ≈ 58px, `BROWSE ALL` ≈ 97px, `ZONA · FW 1.5.5 · PAGE 3` ≈ 233px. Total ≈ 388px against 312px available — before any gap between them.
**How to avoid:** the identity must have declared degradations. §Header Coexistence proposes three tiers. **The arithmetic above is an estimate, not a measurement** — the UI spec owns the real one, and it should be measured in the browser at 360px against Quicksand rather than trusted here.
**Warning signs:** a `data-testid="device-slot"` whose `innerText` is the full identity at every viewport; a horizontal scrollbar on `/` at 360px.
</common_pitfalls>

---

## Header Coexistence with Phase 5.1 (research focus 7)

**The situation on the ground.** `FrontDoor.svelte` today renders `<h1 class="wordmark">` and `<p class="headline">` as siblings with `padding-inline: 32px` and **no right-hand slot at all**. Phase 5.1, in flight, turns the wordmark into a flex row (`justify-content: space-between; align-items: center; min-block-size: 44px`) carrying that same gutter, with **one** right-hand child: `BrowseLink.svelte`, `data-testid="browse-link"`, a bare Micro text control reading `BROWSE ALL` or `BACK TO BROWSE` (05.1-UI-SPEC W-01, W-02, D-19). It is the **first** tab stop on `/` and `/c/{id}/`. On `/browse/` the header has **no** right-hand slot at all, and the wordmark is a real link to `/`.

**What Phase 6 must do.** Add a **second** child to that same row, on the right, so the right-hand end becomes a two-item cluster:

```
HANGAR                                    NO ZONA        BROWSE ALL
└ h1, Micro, accent                       └ device slot  └ Phase 5.1's slot
```

Concretely:

1. **Wrap the right-hand end in its own flex cluster** (`display: flex; align-items: center; gap: 16px`), so `FrontDoor.svelte`'s outer row stays `space-between` with exactly two children — wordmark, cluster. This is a smaller edit than making the row a three-column grid and it leaves 5.1's `BrowseLink` untouched.
2. **Order within the cluster: device first, then `BROWSE ALL`.** Two reasons. Phase 5.1 fixed `BROWSE ALL` as the first tab stop; putting the device slot *before* it in the DOM would displace that and require editing a shipped spec for no benefit. Putting it *after* `BROWSE ALL` in the DOM but before it visually would break DOM/visual order for a keyboard user. So: device slot second in the DOM, second in the tab order, and **rightmost is a design choice the UI spec makes** — recommend device slot to the **left** of `BROWSE ALL` visually and second in the DOM only if the two can be reconciled; otherwise accept device-slot-rightmost and leave `BROWSE ALL` first in both. Research's position: leave `BROWSE ALL` first in the DOM and first in the tab order, and put the device slot immediately after it. One tab-order line changes in 05.1's spec and nothing else does.
3. **`/browse/` has no right-hand slot today.** The device session is site-wide (D-05), so `/browse/` needs the device slot even though it has no `BROWSE ALL`. That page builds its own header (`<h1>` linking to `/`), so the device slot has to be a standalone component both headers mount — which is the right shape anyway.
4. **The splash.** `BrowseLink` carries the wordmark's `.covered` treatment: `opacity: 0; transition: none` while the splash covers the row, then up to 1 across the 700ms dissolve. **The device slot must carry the identical treatment**, or a `ZONA DETECTED — CONNECT` indicator appears over the opening on a returning visitor's very first frame and breaks the choreography Phase 4 spent a plan on.
5. **`/c/{id}/` and the chosen panel.** `TRY ON DEVICE` and the header device slot are visible simultaneously and call the same action (D-02). They must never disagree: both render from `session.phase`. While `phase === "connected"` the panel's primary is disabled with the "already identified" reason (Phase 4 behaviour, unchanged) and the header carries the identity.

**Phone degradation (three tiers, for the UI spec to finish):**

| Available width | Device slot shows |
|---|---|
| ≥ 900px | `ZONA · FW 1.5.5 · PAGE 3` and, when a rig is present, `· WITH EN16, BU16` |
| 640-899px | `ZONA · 1.5.5` — the full line moves into the disclosure |
| < 640px | `ZONA` alone, with a lit state marker; everything else in the disclosure |

The full identity, the other modules and `FORGET THIS ZONA` all live in the quiet disclosure beneath the identity that D-10 already calls for — which is exactly where the overflow goes. **This table is a proposal from arithmetic, not a measurement.** §Pitfall 12.

---

<code_examples>
## Code Examples

### 1. The `navigator.serial` listener pair, done right (D-07)

```ts
// Source: WICG Serial spec §4.1/4.2 (events fire AT the port, bubbles: true, so
// navigator.serial sees them and ev.target is the port) + Chromium
// third_party/blink/renderer/modules/serial/serial.cc:176-179.

#onSerialConnect = (ev: Event): void => {
  const port = ev.target as SerialPort | null;
  if (!port) return;
  const info = port.getInfo();
  // NOT `port === this.#port`. A replugged wired port is a NEW object
  // (content/browser/serial/serial_service.cc:317-325 returns nullopt from
  // GetPersistentIdentifier for every non-Bluetooth port, so ToBlinkType
  // passes the enumerator's fresh token through and blink mints a new
  // SerialPort for it). Identify by USB identity and ADOPT.
  if (info.usbVendorId !== ZONA_USB.usbVendorId) return;
  if (info.usbProductId !== ZONA_USB.usbProductId) return;
  if (this.#transport) return;              // already connected to something
  this.#adopt(port);
  this.phase = "detected";                  // one click away. Never auto-open.
};

#onSerialDisconnect = (ev: Event): void => {
  if (ev.target !== this.#port) return;     // this one IS safe: same object
  void this.#teardown();
  this.identity = null;
  this.phase = "unplugged";                 // immediately, not on the next write
};
```

### 2. Silent reconnect, and what an empty list means

```ts
// Source: WICG Serial spec, getPorts() steps + "A serial port is AVAILABLE if
// it is a wired serial port and the port is physically connected to the
// system." An empty list therefore means "not plugged in", never "no grant".
const granted = await grantedZonaPorts();               // already filters ZONA_USB
const live = granted.filter((p) => portIsAttached(p) !== false);
//                                                   ^^^^^^^^ not `=== true`:
//                                 Chrome 89-129 has no `connected` at all.
this.phase = live.length > 0 ? "detected" : "idle";
if (live.length > 0) this.#adopt(live[0]);              // permitted, NOT open
```

### 3. Feature-detected `forget()`, in the only safe order (D-10)

```ts
// Source: WICG Serial spec §forget() — the steps remove the port from the
// permitted sequence and resolve. There is NO close step. And
// @types/w3c-web-serial declares forget() non-optional, so TypeScript will not
// stop this on Chrome 89-102: the `in` test is the only real guard.
async forget(): Promise<void> {
  const port = this.#port;
  if (!port || !("forget" in port)) return;
  await this.#teardown();          // close() first: forget() does not close.
  await port.forget();
  this.#port = undefined;
  this.identity = null;
  this.canForget = false;
  this.phase = "idle";             // getPorts() will not return it again.
}
```

### 4. The Playwright serial shim, installed before any page script

```ts
// e2e/fake-serial.ts — the addInitScript payload.
//
// `serial` is an ACCESSOR on Navigator.prototype in Chromium, which is why the
// shipped degrade tests delete it from the prototype rather than the instance
// (e2e/skeleton.e2e.ts). That delete returning true is also the proof that the
// property is configurable, so defineProperty on the same slot works — and on
// WebKit the slot is simply absent and defineProperty creates it.
//
// THE BUBBLE DOES NOT COME FOR FREE. Real connect/disconnect events are fired
// at the port with bubbles:true and reach navigator.serial through the event
// PATH. A plain EventTarget has no path, so the shim must dispatch on BOTH the
// fake port and the fake serial object. Getting this wrong makes every
// navigator-level listener test pass against a page that would fail in Chrome.
export const FAKE_SERIAL = () => {
  const listeners = { serial: new EventTarget() };
  const ports: FakePort[] = [];
  let nextRequest: { ok: true; port: FakePort } | { ok: false; name: string; message: string } | undefined;

  class FakePort extends EventTarget {
    info: { usbVendorId: number; usbProductId: number };
    connected = true;
    readable: ReadableStream<Uint8Array> | null = null;
    writable: WritableStream<Uint8Array> | null = null;
    #push: ((b: Uint8Array) => void) | undefined;
    #openError: string | undefined;

    getInfo() { return this.info; }
    async open() {
      if (this.#openError) {
        throw new DOMException("Failed to open serial port.", this.#openError);
      }
      this.readable = new ReadableStream({ start: (c) => { this.#push = (b) => c.enqueue(b); } });
      this.writable = new WritableStream({ write: (chunk) => { (window as any).__hangarWrites.push(chunk); } });
    }
    async close() { this.readable = null; this.writable = null; }
    async forget() { ports.splice(ports.indexOf(this), 1); }
    feed(bytes: number[]) { this.#push?.(Uint8Array.from(bytes)); }
  }

  const fire = (type: "connect" | "disconnect", port: FakePort) => {
    port.connected = type === "connect";
    // BOTH targets, in this order, mirroring a real bubble.
    port.dispatchEvent(Object.assign(new Event(type), { target: port }));
    listeners.serial.dispatchEvent(
      new Proxy(new Event(type), { get: (e, k) => (k === "target" ? port : (e as any)[k]) }),
    );
  };

  const serial = Object.assign(listeners.serial, {
    async getPorts() { return ports.filter((p) => p.connected); },
    async requestPort() {
      const r = nextRequest;
      nextRequest = undefined;
      if (!r) throw new DOMException("No port selected by the user.", "NotFoundError");
      if (!r.ok) throw new DOMException(r.message, r.name);
      return r.port;
    },
  });

  Object.defineProperty(Navigator.prototype, "serial", {
    configurable: true,
    get: () => serial,
  });

  // The control surface the test drives from page.evaluate().
  (window as any).__hangarWrites = [];
  (window as any).__hangarSerial = {
    /** A ZONA already granted and attached, so getPorts() finds it. */
    grant: (vid = 0x303a, pid = 0x8123) => {
      const p = new FakePort();
      p.info = { usbVendorId: vid, usbProductId: pid };
      ports.push(p);
      return ports.length - 1;
    },
    /** The next requestPort() resolves with port `i`. */
    pick: (i: number) => { nextRequest = { ok: true, port: ports[i] }; },
    /** The next requestPort() rejects. Default: the cancelled/empty/blocked one. */
    reject: (name = "NotFoundError", message = "No port selected by the user.") => {
      nextRequest = { ok: false, name, message };
    },
    /** open() on port `i` fails as Grid Editor would make it fail. */
    busy: (i: number) => { (ports[i] as any)["#openError"] = "NetworkError"; },
    unplug: (i: number) => fire("disconnect", ports[i]),
    /** Replug mints a NEW port object, exactly as Chromium does. */
    replug: (vid = 0x303a, pid = 0x8123) => {
      const p = new FakePort();
      p.info = { usbVendorId: vid, usbProductId: pid };
      ports.push(p);
      fire("connect", p);
    },
    /** Bytes read in Node from a committed fixture and pushed in by the test. */
    feed: (i: number, bytes: number[]) => ports[i].feed(bytes),
    writes: () => (window as any).__hangarWrites.length,
  };
};
```

Used as:

```ts
// e2e/session.e2e.ts
import { readFileSync } from "node:fs";
const capture = JSON.parse(
  readFileSync("src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json", "utf8"),
);
// Only rx chunks - the same rule FakeTransport.fromCapture obeys.
const RX = capture.events
  .filter((e: any) => e.dir === "rx" && e.kind === "chunk")
  .map((e: any) => [...Buffer.from(e.hex, "hex")]);

test.beforeEach(async ({ context }) => { await context.addInitScript(FAKE_SERIAL); });
```

The **fixture is read in Node and pushed in by the test**, never inlined into the init script — so the single committed capture stays the one source of truth and the shim stays small.

### 5. Reaching the `insecure` branch in a real browser for the first time

```ts
// try-on.ts's own comment notes that `insecure` is "deliberately reachable
// [in tests] even though Chromium can barely produce it" — navigator.serial is
// [SecureContext] there, so an insecure page lands in `unsupported` instead.
// CONN-02 requires two DIFFERENT messages, and the second has never been seen
// in a browser. It can be, with one own property shadowing the global getter:
await context.addInitScript(() => {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
});
// navigator.serial is left in place, so capabilityOf({hasSerial: true,
// secure: false}) === "insecure" and the second message renders for real.
```

### 6. A synthetic rig, for D-08's identity line

```ts
// src/lib/device/session.spec.ts
// hwcfg values read from grid.module_hwcfgs() against the pinned package:
// ZONA RevH 161, EN16 RevH 195, BU16 RevH 131.
import { heartbeatFrame } from "$lib/transport/fixtures/synthetic";

const rig = [
  heartbeatFrame({ sx: 0, sy: 0, type: 1, hwcfg: 161, activePage: 3, firmware: FW }),
  heartbeatFrame({ sx: 1, sy: 0, type: 0, hwcfg: 195, activePage: 3, firmware: FW }),
  heartbeatFrame({ sx: 2, sy: 0, type: 0, hwcfg: 131, activePage: 3, firmware: FW }),
];
// -> identity.zona.moduleType === "ZONA"
// -> identity.otherModules sorted by sx: ["EN16", "BU16"]
// -> identity.storeAllowed === false   (PAGESTORE is a global broadcast)
```
</code_examples>

---

## Runtime State Inventory

Phase 6 refactors `TryOnDevice` from *owner* of a connection to *consumer* of a session, so the inventory applies. Every category answered explicitly.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| **Stored data** | **None in HANGAR.** No `localStorage`, no `sessionStorage`, no IndexedDB is written by any device-path code today (`grep` over `src/` for `localStorage`/`sessionStorage`/`indexedDB` finds only Phase 5.1's planned `hangar:browse-return`, which is unrelated). **One item outside HANGAR:** the browser's own serial permission store, keyed by origin + VID/PID/serial-number in `SerialChooserContext`. Phase 6 gains a control that **mutates** it (`forget()`), and it is the only persistent state this phase touches. | Code edit only. No data migration — the grant is the browser's, and `forget()` is the sanctioned mutation. The runbook must warn that running the checklist will consume/revoke a real grant. |
| **Live service config** | **None.** No external service holds HANGAR configuration. The Cloudflare Worker (`worker/index.js`) serves static assets and Basic Auth and knows nothing about devices. Two Worker secrets exist (`SITE_USER`, `SITE_PASSWORD`) and are untouched. | None. |
| **OS-registered state** | **None registered by HANGAR.** What exists is OS-level and transient: the exclusive port lock the OS grants on `open()` (Windows `CreateFile dwShareMode=0`, POSIX `TIOCEXCL` — PITFALLS C1). Phase 6 makes HANGAR hold it for longer (a whole visit rather than one panel), which is a **behaviour** change with a real consequence for Grid Editor. | No registration to update. Do document the longer hold in `docs/SESSION-RUNBOOK.md` and keep `DISCONNECT ZONA` prominent. |
| **Secrets / env vars** | **None.** `.dev.vars` holds only the two Basic Auth values. Nothing in the device path reads an env var. | None. |
| **Build artifacts / installed packages** | **None stale.** No dependency changes, so `node_modules` is unaffected. `build/` is regenerated by `npm run preview` before every e2e run. The one artefact worth naming: `config-shape.spec.ts`'s chunk guard reads `build/_app/immutable/chunks/` and is a no-op when `build/` is absent, so it proves nothing until a build has run — a phase that adds a header component **must** run a full build before claiming that gate is green. | Run `npm run build` (or `npm run preview`) in the wave that adds the header component, before reading the chunk guard as evidence. |

**The canonical question — after every file in the repo is updated, what runtime systems still have the old state?** One: the browser's serial permission store, on the machine of anyone who ran a previous version. It is per-origin and unaffected by a code change; nothing needs migrating.

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | build, Vitest, Playwright | ✓ | v24.14.0 (`engines` requires ≥24) | — |
| npm | everything | ✓ | 11.9.0 | — |
| Vitest | session state machine specs | ✓ | 4.1.11 | — |
| Playwright | `session.e2e.ts`, both projects | ✓ | 1.62.1 | — |
| Chromium (Playwright) | the `chromium` project | ✓ | bundled | — |
| WebKit (Playwright) | the `webkit-phone` project, DEGR-01 | ✓ | bundled | — |
| `wrangler` | `npm run preview` — the e2e web server | ✓ | ^4.128.0 in devDependencies | `npx sirv-cli build --port 4173 --host 127.0.0.1 --single` (documented in `playwright.config.ts`; loses Basic Auth coverage) |
| `@types/w3c-web-serial` | typing the shim and the session | ✓ | 1.0.8 | — |
| `@intechstudio/grid-protocol` | `module_type_from_hwcfg`, `module_hwcfgs` | ✓ | 1.20260825.1135 (exact pin) | — |
| Committed hardware captures | driving the fake serial and `FakeTransport` | ✓ | 3 fixtures, 16 KB of rx hex in the smallest | — |
| **A real ZONA** | the five hardware truths (§Hardware Checklist) | **✗ to the executor** | — | **`checkpoint:human-verify` (D-15).** Not simulable; see below. |
| **A second Grid module** | D-08's rig line against real traffic | **✗** | — | `synthetic.ts`'s `heartbeatFrame` for the machine half; runbook row D for the truth |
| **Grid Editor, running** | CONN-04's port-conflict message against a real conflict | **✗ to the executor** | — | The shim's `busy()` proves the code path; runbook row C proves the message |
| **Firefox 151+ desktop** | the two-step prompt (D-04) | unknown on this machine | — | Runbook row F, marked optional |
| **macOS or Linux** | cross-platform persistence | **✗** | — | Not needed: §Permission Persistence proves the rule from source on all three platforms. No fallback required. |

**Missing with no fallback:** the real ZONA. This is by design — `docs/SKELETON-RUNBOOK.md` states it plainly: *"Web Serial cannot be automated — there is no CDP domain and no fake-device hook."* Everything a machine can check is checkable; the five rows below are the user's.

**Missing with a fallback:** the second Grid module, Grid Editor, and Firefox — each has a machine-checkable proxy that proves the *code path* and leaves only the *hardware truth* to the checklist.

---

## Testing without hardware (research focus 8)

### What the fake serial can prove, and what it cannot

| Provable with `addInitScript` | Not provable, and why |
|---|---|
| Every state transition in the session's machine | That Chromium really rejects with `NotFoundError` when the list is empty (only a real empty picker shows that) |
| That `connect` on a *new* port object is adopted (the replug trap) | That Chromium really mints a new object on replug — the shim is *modelled on* the source read, so the shim proving it is circular |
| That `getPorts()` on load produces `ZONA DETECTED — CONNECT` and one click connects with no picker | That a grant survives a browser restart |
| That the port-busy `NetworkError` produces the Grid Editor copy in the right order | That Grid Editor is what produces it |
| That a non-ZONA hwcfg lands in `not-zona` with the module named | That a real EN16 says so on the wire |
| That the session writes zero bytes across a full cycle | Nothing — this one is fully provable, both dynamically and by source scan |
| The WebKit degrade path (no `navigator.serial` at all) | Nothing — this one is fully provable |
| The `insecure` branch, for the first time ever (§Code Example 5) | Nothing |

The circularity in row 2 is worth naming out loud rather than hiding: the shim is built from a source reading, so it can only prove HANGAR is consistent with that reading. Runbook row B is what closes it.

### The `/dev/session/` probe route (D-14)

Follow the four existing probes exactly (`/dev/skeleton/`, `/dev/fidelity/`, `/dev/catalog/`, `/dev/tune/`): prerendered, linked from nowhere, `trailingSlash: "always"`. Two gates already cover unlinked-ness partially and **one needs widening**:

- `e2e/fidelity.e2e.ts:70` asserts `a[href*="/dev/"]` count is 0 **on `/`** — site-wide enough for the rendered page, and it needs no change.
- `config-shape.spec.ts`'s *"the walking skeleton route is linked from nowhere"* scans `src/routes/` source for the literal `dev/skeleton` and is **hardcoded to that one route**. A new `/dev/session/` gets no source-level protection unless the test is generalised to walk `src/routes/dev/*` and assert no other route file names any of them. Recommend generalising it in this phase — it is a strictly better gate and it closes the gap for the two future probes too.

What the probe page must expose beyond the real UI: a plain-text readout of `phase`, the identity fields, the failure title, and a write counter, so an e2e can assert on states the production chrome deliberately compresses.

### The Vitest surface

| What | How |
|---|---|
| The state machine | `FakeTransport` + a hand-driven fake port object (no browser needed — the session takes an injectable "serial-like" surface, or the spec calls the internal transitions directly) |
| Identification from a real capture | `FakeTransport.fromCapture(zona-hardware-a-hb-on-pace-0.json)` — 119 rx chunks, real chunk boundaries |
| The rig line (D-08) | `synthetic.heartbeatFrame` × 3 (§Code Example 6) |
| Unplug | `FakeTransport`'s `{ kind: "disconnect", afterTxFrames: n }` fault, or `onClose` driven directly |
| The liveness watchdog | `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(MODULE_GONE_MS + 1)` — the `src/lib/tune/model.spec.ts` precedent |
| The in-flight guard | `connect()` twice synchronously → exactly one `requestPort` call recorded |
| Never-writes | Both halves of `try-on.spec.ts`'s test 3, over `session.svelte.ts` |
| `forget()` ordering | a fake port recording `close` then `forget`, asserted in that order |

**Design the session so its serial surface is injectable.** `identifyOnly` already takes `now`, `pollMs` and `sleep` for exactly this reason, and `try-on.ts` is pure over its arguments. Give `DeviceSession` an optional constructor/`start()` parameter carrying `{ requestPort, getPorts, addEventListener }` defaulting to `navigator.serial`. That is the difference between a session tested in node and a session only testable in a browser.

---

## Hardware Checklist — `docs/SESSION-RUNBOOK.md` (D-15)

Model it on `docs/SKELETON-RUNBOOK.md`: a "Before you start" block, a "Getting the page open" block naming both `npm run preview` and `npm run deploy` (and the Basic Auth prompt, and the `file://` trap), and a pass column. Six rows, each with **why a machine cannot do it**.

| # | Row | Do this | Passes when | Why it cannot be simulated |
|---|-----|---------|-------------|----------------------------|
| **A** | **The grant survives a browser restart** (CONN-06) | Connect once. Quit the browser completely. Reopen, open the site. Do not click anything. | The header reads `ZONA DETECTED — CONNECT` on load, with no picker and no gesture. Record whether the **deployed HTTPS origin** behaves like `127.0.0.1:4173` — grants are per origin and only the local one has ever been tested (`SKELETON-RESULTS.md`, "Open, still"). | Permission storage is the browser's own profile state. A shim can only assert HANGAR's reaction to `getPorts()`, never that the browser really kept the grant. |
| **B** | **Unplug and replug** (CONN-06, D-07) | Connect. Physically unplug the cable. Wait. Plug it back in. Do not reload. | Unplug flips the header to `unplugged` **immediately** — before any click, and without waiting for a failed write. Replug returns it to `ZONA DETECTED — CONNECT`, and **one click reconnects with no picker**. If the click produces a picker or an error, the replug-identity handling is wrong. | The `connect`/`disconnect` events and the new-token behaviour are Chromium's. The shim is modelled on a source reading; this row is what makes the reading evidence. |
| **C** | **Grid Editor holds the port** (CONN-04) | With Grid Editor **running and connected**, click `CONNECT` and pick the ZONA. | The named `Another program is holding the port` block appears, names Grid Editor, and lists the six recovery steps in order — never the raw `Failed to open serial port.` Then quit Grid Editor from its tray, reload, and reconnect. | Skeleton runbook row 0 was **never exercised** — the operator had no Grid Editor running. `SKELETON-RESULTS.md` names it as still open and says *"Phase 6 owns the failure vocabulary and should close it."* This row is that closure. Also report whether the copy read as helpful or as jargon. |
| **D** | **A second Grid module, and a non-ZONA** (CONN-07, D-08) | Attach a second Grid module alongside the ZONA. Then, separately, connect with **only** a non-ZONA module attached. | With the rig: the identity line names the other modules (`· with EN16`), sorted stably. With only a non-ZONA: the picker still **lists** it (VID/PID are shared across every ESP32-S3 Grid module), and HANGAR refuses it with the plain `That module is not a ZONA` naming what it actually is. | `SKELETON-RESULTS.md` (e): every frame in the whole run carried `SX 0, SY 0`. The other-module path has **never** met real traffic and is proven only against `FakeTransport`. |
| **E** | **`FORGET THIS ZONA`** (D-10) | Connect, open the disclosure, click `FORGET THIS ZONA`. Then reload. | The port closes, the header returns to `NO ZONA`, and after the reload there is **no** `ZONA DETECTED` offer — the picker is required again. The grant is also gone from the browser's own site settings (`chrome://settings/content/serialPorts`). Grid Editor can open the module immediately. | Revocation is browser profile state, and the "Grid Editor can now have it" half is an OS-level exclusivity fact. |
| **F** | **Firefox 151+ two-step prompt** *(optional — only if a Firefox 151+ desktop is available)* (D-04, CONN-03) | Connect from a clean Firefox 151+ profile. | A site-permission prompt appears **before** the port chooser on the first request, and the pre-click copy prepared the visitor for it. Record how long the two prompts took end to end, so §Pattern 6's threshold can be set from a measurement rather than a guess. Note whether a **second** connect on the same profile skips the first prompt. | The whole Phase 2 run was Chrome 152 only. `SKELETON-RESULTS.md` names Firefox under "Open, still". |

**What to hand back:** which rows passed; for any that did not, exactly what the page showed instead; the row A answer for the **deployed** origin specifically; the row F timing; and anything the runbook did not predict.

---

<sota_updates>
## State of the Art

| Old approach | Current approach | When changed | Impact on Phase 6 |
|--------------|------------------|--------------|-------------------|
| "Web Serial is Chromium-only" | Chrome/Edge/Opera **and desktop Firefox 151+** | 2026-05-19 | Already absorbed by the shipped copy. The new wrinkle is that Firefox's enterprise default is *blocked*, which the copy does not yet cover (§Pitfall 8). |
| `event.port` on connect/disconnect | `event.target` | Chrome 89 | The shipped `WebSerialTransport` already uses `ev.target`. Chrome's own docs still suggest `event.port \|\| event.target` for pre-89 compatibility; Phase 6 does not need it — the baseline is 89. |
| No way to know if a permitted port is attached | `SerialPort.connected` | Chrome 130, Firefox 151 | Feature-detected via `portIsAttached()`. Still absent for Chrome 89-129, so `undefined` must mean "unknown". |
| No way for a site to revoke its own grant | `SerialPort.forget()` | Chrome 103, Firefox 151 | D-10. Feature-detect; do not render the control without it. |
| Ephemeral-only serial grants (crbug 40603963, "no data is saved across browser restart") | Persistent grants for USB serial devices, gated on `CanStorePersistentEntry` | pre-dates Chrome 89 in current source | **Resolves PITFALLS C10's two MEDIUM/LOW rows.** For a ZONA the answer is yes on all three desktop platforms, because `grid-fw` sets a per-chip `iSerialNumber`. |

**Deprecated / not to be used:**
- Any Web Serial polyfill: does not and cannot exist.
- WebUSB as a fallback: Chromium-only too, and blocked on the CDC interface class.
- Browser sniffing: would have wrongly excluded Firefox 151+ from install on 2026-05-19 and would wrongly *include* Chrome Android 138.
</sota_updates>

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.11, two projects (`server`, `sweep`), config in `vite.config.ts` |
| E2E framework | Playwright 1.62.1, two projects (`chromium`, `webkit-phone` filtered to `@webkit`), `playwright.config.ts` |
| Quick run | `npm run test:quick` (the `server` project) |
| Sweep | `npm run test:sweep` |
| Full unit | `npm run test:unit -- --run` |
| E2E | `npm run test:e2e` (rebuilds and serves `build/` through `wrangler dev`) |
| Type check | `npm run check` |
| Count gate | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — **baseline + delta only, never a literal total (D-17)** |

**Baselines to carry into the plans**, from Phase 5.1's final SUMMARY at planning time. As of 2026-09-04 with Phase 5.1 in flight: `test:quick` **59 files / 651 passed | 1 todo**, `test:sweep` **3 files / 13 tests**, `test:e2e` **44 tests**. Phase 6 plans must re-observe these at their own start and express every assertion as *baseline + N*.

### Phase Requirements → Test Map

| Req | Behaviour | Type | Automated command | Exists? |
|-----|-----------|------|-------------------|---------|
| CONN-01 | Capability gate is a pure function of `{hasSerial, secure}`; the header control is enabled only when `ok` | unit | `npx vitest run --project server src/lib/device/session.spec.ts` | ❌ Wave 0 (`capabilityOf` half exists in `try-on.spec.ts`) |
| CONN-01 | No visitor-facing string names an engine; source names no user agent | unit (source scan) | same file | ❌ Wave 0 |
| CONN-02 | Two distinct messages; **the `insecure` branch renders in a real browser** | e2e | `npx playwright test e2e/session.e2e.ts -g "insecure"` (§Code Example 5) | ❌ Wave 0 |
| CONN-02 | WebKit / no-`navigator.serial` degrade in the header **and** the panel | e2e, both projects | `npx playwright test e2e/session.e2e.ts -g "@webkit"` | ❌ Wave 0 (panel half exists in `first-experience.e2e.ts`) |
| CONN-03 | The picker line is present before any click; the two-step expansion appears only after `TWO_STEP_HINT_MS` in `choosing` | unit + e2e | `session.spec.ts` (threshold, fake timers) + `session.e2e.ts` | ❌ Wave 0 |
| CONN-04 | `NetworkError` + `connected !== false` → `port-busy` → Grid Editor copy in order | unit + e2e | `session.spec.ts`; `session.e2e.ts` via `__hangarSerial.busy()` | partial — `classifyOpenError` and `failureCopy` are covered by `transport.spec.ts` |
| CONN-05 | `NotFoundError` → `cancelled`, **and** the two disclosures are reachable | unit + e2e | `session.spec.ts` + `session.e2e.ts` | ❌ Wave 0 |
| CONN-06 | `getPorts()` with a granted attached ZONA → `detected`; one click opens with no `requestPort` call | e2e | `session.e2e.ts` via `__hangarSerial.grant()` | ❌ Wave 0 |
| CONN-06 | Unplug → `unplugged` immediately, with **zero writes attempted** | unit + e2e | `session.spec.ts`; `session.e2e.ts` via `unplug()` | ❌ Wave 0 |
| CONN-06 | **Replug adopts the NEW port object** and one click reconnects | e2e | `session.e2e.ts` via `replug()` — the single highest-value new test | ❌ Wave 0 |
| CONN-06 | The session survives client navigation `/` → `/c/x/` → `/browse/` with the port open | e2e | `session.e2e.ts`, asserting phase and identity across three `page.click` navigations | ❌ Wave 0 |
| CONN-07 | Filter is `ZONA_USB`; a non-ZONA hwcfg lands in `not-zona` naming the module | unit | `session.spec.ts` with `synthetic.heartbeatFrame({ hwcfg: 195 })` | partial — `try-on.spec.ts` covers the outcome, not the session state |
| CONN-07 | No control is enabled before identification resolves | e2e | `session.e2e.ts` | ❌ Wave 0 |
| CONN-08 | Identity line carries type, firmware and page; the rig tail names other modules, sorted | unit | `session.spec.ts` (§Code Example 6) | ❌ Wave 0 |
| SAFE-01 | **Zero writes** across adopt → open → identify → unplug → forget → close; and the source cannot write | unit (both halves) | `session.spec.ts` | ❌ Wave 0 |
| SAFE-01 | Zero writes recorded in the browser across a full connect + browse cycle | e2e | `session.e2e.ts` asserting `__hangarSerial.writes() === 0` | ❌ Wave 0 |
| D-10 | `close()` precedes `forget()`; the control is absent without `"forget" in port` | unit | `session.spec.ts` | ❌ Wave 0 |
| D-05 | The front door's built HTML does not reference the protocol chunk **after** the header component lands | unit (artefact) | `npm run build && npx vitest run --project server src/lib/config-shape.spec.ts` | ✅ exists — **must be re-run against a fresh build** |
| D-14 | `/dev/session/` is linked from nowhere | unit (source scan) + e2e | `config-shape.spec.ts` (generalised) + `fidelity.e2e.ts:70` | partial — the source scan is hardcoded to `dev/skeleton` |
| — | Header coexistence: `browse-link` and `device-slot` both present, tab order unchanged | e2e | `session.e2e.ts` | ❌ Wave 0 (depends on Phase 5.1 landing) |

### Sampling Rate

- **Per task commit:** `npm run test:quick`, plus `npm run lint` when a source file changed.
- **Per wave merge:** `npm run check && npm run lint && npm run test:quick && npm run test:sweep`.
- **The wave that adds the header component additionally runs `npm run build`** before reading `config-shape.spec.ts`'s chunk guard — that assertion is a silent no-op without `build/`.
- **Phase gate:** all of the above plus `npm run test:e2e`, then the `checkpoint:human-verify` for `docs/SESSION-RUNBOOK.md`.

### Wave 0 Gaps

- [ ] `src/lib/device/session.spec.ts` — **not** `session.svelte.spec.ts` (§Pitfall 10). Covers CONN-01, 03, 04, 05, 06, 07, 08, SAFE-01, D-10.
- [ ] `src/lib/device/session-copy.spec.ts` — the new strings, asserted character-for-character in the `tune/copy.ts` style.
- [ ] `e2e/fake-serial.ts` — the shim and its `__hangarSerial` control surface (§Code Example 4). Not a test file; a fixture module.
- [ ] `e2e/session.e2e.ts` — the browser half, both projects, at least one `@webkit`-tagged title.
- [ ] `src/routes/dev/session/+page.svelte` — the probe route.
- [ ] `docs/SESSION-RUNBOOK.md` — the six hardware rows.
- [ ] **Edits to shipped gates, each deliberate and named in a SUMMARY:**
  - `src/lib/config-shape.spec.ts` — `COMPILER_MARKERS` gains `lib/transport`, `lib/protocol`, `lib/device`; the "linked from nowhere" test generalises from `dev/skeleton` to every `src/routes/dev/*`.
  - `src/lib/protocol/forbidden-instructions.spec.ts` — `SCANNED_DIRS` widens to `src/lib` (the item carried forward from plan 04-04/04-07 in `04-first-experience/deferred-items.md`); this phase is where `src/lib/device/` finally comes under it.
  - `src/lib/transport/transport.ts` — `OpenFailure` gains `already-open`; `classifyOpenError` gains the `InvalidStateError` branch; `failureCopy` gains its case. `transport.spec.ts` gains coverage. All three call sites keep working (the union widens, the switch has a `default`).
  - `src/lib/device/try-on.ts` — `not-zona` prefers the `heartbeatType === 1` module over `seen[0]`. `try-on.spec.ts` gains a rig case.
  - `e2e/first-experience.e2e.ts` — only if the unsupported copy's location moves (§Pitfall 7). Prefer not moving it.
- [ ] Framework install: **none**.

---

<open_questions>
## Open Questions

1. **Does Firefox's `dom.webserial.enabled=false` remove `navigator.serial`, or only make its calls fail?**
   - Known: `DefaultSerialGuardSetting` is documented as controlling that preference, and it blocks by default whenever any enterprise policy is set. Gecko's convention is to gate WebIDL interfaces on such prefs.
   - Unclear: I could not retrieve the Gecko WebIDL to confirm the interface is `[Pref=]`-gated.
   - Recommendation: **do not branch on it.** Both outcomes are covered — interface absent lands in `unsupported`, calls failing lands in `cancelled`/`unknown`. Add the one copy sentence that names the possibility and the place to check (`about:policies`). Confidence MEDIUM; harmless either way.

2. **Does Firefox mint a new `SerialPort` object on replug, like Chromium?**
   - Known: Chromium does, and it is source-proven.
   - Unclear: Gecko's implementation.
   - Recommendation: the defensive design (identify by `getInfo()`, adopt the event's port, never compare object identity in the `connect` handler) is correct on both. No branch needed. Runbook row F is the only place it could be observed, and even there only incidentally.

3. **Does the grant persist for the deployed HTTPS origin as it does for `http://127.0.0.1:4173`?**
   - Known: grants are per origin. Only the local origin has ever been tested.
   - Unclear: nothing technical — it should behave identically — but it has not been seen.
   - Recommendation: runbook row A, explicitly for the deployed origin. Carried forward from `SKELETON-RESULTS.md`'s own "Open, still" list.

4. **Should a second HANGAR tab be detected and named (PITFALLS C10's `BroadcastChannel` suggestion)?**
   - Known: a second tab produces the identical `NetworkError` as Grid Editor, so a visitor with two tabs is told to quit an app that is not the problem. A `BroadcastChannel` heartbeat solves it in a few lines.
   - Unclear: whether it is worth the surface.
   - Recommendation: **out of scope.** Not in CONN-01..08, not in CONTEXT.md. Log as a deferred item with this note attached, so Phase 7 (where a mid-write conflict is much worse) inherits the reasoning rather than rediscovering it.

5. **Should the header identity refresh live from ongoing heartbeats, or freeze at identification?**
   - Known: §Pattern 7's case for live is strong — liveness detection, a true active page, and late-arriving rig modules. `MODULE_GONE_MS` exists and is unused.
   - Unclear: whether CONTEXT.md's open question 1 ("permanently or only on hover") interacts. A line that changes while the visitor is not looking at it is fine; a line that changes *under their cursor* is not.
   - Recommendation: fold continuously (cheap, and it is the only way to notice a dead-but-attached module), but debounce the *rendered* page number so it cannot flicker. Ask the user CONTEXT.md's open question 1 at the UI-spec review.

6. **Does the device slot sit left or right of `BROWSE ALL`?**
   - Known: `BROWSE ALL` is fixed as the first tab stop by 05.1-UI-SPEC W-01, and DOM order must match visual order for a keyboard user.
   - Unclear: which reads better. Research's position: `BROWSE ALL` first in DOM and tab order, device slot immediately after — one line of 05.1's tab-order list changes and nothing else does.
   - Recommendation: hand to the UI spec with the arithmetic in §Pitfall 12 attached.
</open_questions>

---

<sources>
## Sources

### Primary (HIGH confidence)

**Specification**
- https://wicg.github.io/serial/ — `requestPort()` steps (the single post-prompt `NotFoundError`; the `SecurityError` for missing transient activation), `getPorts()` steps and the definition of *available* ("physically connected to the system"), `forget()` steps (no close step), `onconnect`/`ondisconnect` (fired **at the port**, `bubbles: true`), the definition of *logically connected*.

**Chromium source, read directly**
- `third_party/blink/renderer/modules/serial/serial.cc` — `kNoPortSelected = "No port selected by the user."` (:47); the two `RejectWithDOMException(kNotFoundError, kNoPortSelected)` sites (:425, :504); `"Must be handling a user gesture to show a permission request."` thrown, not rejected (:291-293); `OnPortConnectedStateChanged` dispatching at the port (:142-214); `GetOrCreatePort` caching by token (:441-463).
- `third_party/blink/renderer/modules/serial/serial_port.cc` — `kOpenError = "Failed to open serial port."` (:46), `kDeviceLostError` (:47), `"The port is already open."` (:120-123), `"A call to open() is already in progress."` (:113-118), `forget()` (:384-404).
- `content/browser/serial/serial_service.cc` — `OnPortAdded`/`OnPortRemoved` → `OnPortConnectedStateChanged` (:170-203); `ToBlinkType` and `GetPersistentIdentifier` returning `nullopt` for every non-Bluetooth port (:284-325). **This is the replug-identity proof.**
- `services/device/serial/serial_device_enumerator.cc` — `AddPort` minting a token, `RemovePort` erasing it and setting `connected = false` (:85-108).
- `chrome/browser/serial/serial_chooser_context.cc` — `CanStorePersistentEntry` (:542-565) and `OnPortRemoved` revoking ephemeral grants on unplug (:625-638). **This is the permission-persistence proof.**

**`grid-fw` source, read directly (sibling repo, read-only)**
- `esp32s3/components/grid_esp32_usb/grid_esp32_usb.c:20-24` — `grid_usb_init(0x303a, 0x8123, serial)` with a 12-hex chip-ID serial, in the component **every** ESP32-S3 Grid module shares.
- `common/src/c/grid_usb.c:59-66, :116-120` — the string table (`"Intech Studio"` / `"Grid"`, identical for every module) and `iSerialNumber = 0x03`.
- `d51n20a/grid/d51/grid_d51_usb.c:20` — the SAMD51 generation's different identity (`0x03eb, 0xecad`), correctly excluded by the filter.

**MDN**
- `mdn/browser-compat-data` `api/Serial.json` and `api/SerialPort.json` (fetched from `main`, 2026-09-04) — the full support matrix including `forget` Chrome 103 / Firefox 151, `connected` Chrome 130 / Firefox 151, and Chrome Android 138's Bluetooth-RFCOMM-only note.

**Svelte / project**
- `node_modules/svelte/src/internal/client/proxy.js:38-55` — `$state` proxies only `object_prototype` / `array_prototype` values.
- `node_modules/@types/w3c-web-serial/index.d.ts` — `connected` and `forget()` declared non-optional.
- The HANGAR tree itself: `src/lib/transport/{transport,web-serial,sequence,fake,capture}.ts`, `src/lib/protocol/constants.ts` (the unused `MODULE_GONE_MS`), `src/lib/device/try-on.ts` and its spec, `src/lib/ui/{TryOnDevice,ChosenPanel,FrontDoor,Coverflow}.svelte`, `src/lib/config-shape.spec.ts`, `src/lib/protocol/forbidden-instructions.spec.ts`, `src/lib/transport/fixtures/synthetic.ts` and the three committed captures, `vite.config.ts`, `playwright.config.ts`, `e2e/{skeleton,first-experience,fidelity}.e2e.ts`, `docs/{SKELETON-RESULTS,SKELETON-RUNBOOK,TESTING}.md`, `scripts/check-counts.mjs`.
- `.planning/`: `ROADMAP.md` Phase 6, `REQUIREMENTS.md` CONN-01..08 / SAFE-01 / DEGR-02, `phases/06-device-session/06-CONTEXT.md`, `research/{STACK,FEATURES,PITFALLS}.md`, `phases/04-first-experience/{04-UI-SPEC,04-08-SUMMARY,deferred-items}.md`, `phases/05.1-catalog-browse/{05.1-CONTEXT,05.1-UI-SPEC}.md`.

### Secondary (MEDIUM confidence)

- https://hacks.mozilla.org/2026/05/web-serial-support-in-firefox/ — Firefox 151 desktop; add-on gating **before** the port picker on first request; per-site and per-port permissions. First-party, but the article discusses none of `getPorts`/`forget`/`connected` behaviour.
- https://mozilla.github.io/enterprise-admin-reference/reference/policies/defaultserialguardsetting/ — values `2` (block) / `3` (allow); *"If any enterprise policies are set, the WebSerial API is blocked by default"*; affects `dom.webserial.enabled`; Firefox 151+, ESR 153+. First-party, but silent on what the block looks like to a script.
- Chromium issue 373660806, *"Better handling of navigator.serial.requestPort when serial is blocked by content setting"* — the third `NotFoundError` cause. Corroborated by the two source sites above; the issue itself is the only description of the user-visible symptom.
- https://developer.chrome.com/docs/capabilities/serial — the `event.port || event.target` pre-89 note; `forget()` from Chrome 103. Does not settle whether `getPorts()` can return disconnected ports.

### Tertiary (LOW confidence — flagged for validation)

- The Firefox WebIDL pref-gating inference in §Pitfall 8. Not verified against Gecko source; the recommended handling is safe under either outcome.
- The header width arithmetic in §Pitfall 12 and the three-tier degradation table. Estimated from the Micro role's declared metrics (12px / 600 / 0.18em / uppercase) and a nominal advance width; **must be measured in a browser at 360px against Quicksand** before the UI spec fixes it.
- `TWO_STEP_HINT_MS` (§Pattern 6) has no measurement behind it. Runbook row F is what would supply one.
- Whether Firefox mints a new `SerialPort` on replug. Unverified; the recommended design does not depend on the answer.
</sources>

---

<metadata>
## Metadata

**Research scope:**
- Core technology: Web Serial session lifetime — permission persistence, port-object identity, connect/disconnect semantics, the complete DOMException taxonomy
- Ecosystem: nothing new; the phase adds no dependency
- Patterns: Svelte 5 runes in a `.svelte.ts` singleton, dynamic-import discipline against a shipped chunk guard, one action with two call sites inside one activation window, a scripted `navigator.serial` for Playwright
- Pitfalls: twelve, of which four (replug identity, thrown-not-rejected activation, the excluded spec name, the protocol chunk on the first paint) would each have cost a debugging session

**Confidence breakdown:**
- Standard stack: **HIGH** — no new dependency; every version verified in the working tree.
- Browser support matrix: **HIGH** — MDN BCD read from source.
- Failure taxonomy: **HIGH** for Chromium (every message quoted from `serial.cc` / `serial_port.cc`); **MEDIUM** for Firefox.
- Permission persistence: **HIGH** — Chromium and `grid-fw` source both read; corroborated by Phase 2's measured browser-restart result.
- Replug identity: **HIGH** for Chromium (three source files); **MEDIUM** for Firefox, and the design is indifferent.
- Architecture patterns: **HIGH** — every pattern is an extension of something already shipped and tested in this tree.
- Pitfalls: **HIGH** for the ten grounded in source or in the repo's own configuration; **MEDIUM** for the enterprise-Firefox copy hole; **LOW** for the header arithmetic.
- Testing approach: **HIGH** on what is provable, and explicit about the one circularity the fake serial cannot escape.

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 (30 days). Two things would invalidate parts of it sooner: a `@intechstudio/grid-protocol` pin bump (re-opens every hwcfg and parameter name) or a ZONA firmware update (re-opens the heartbeat contract). Neither affects the Web Serial findings, which are spec- and Chromium-level.
</metadata>

---

*Phase: 06-device-session*
*Research completed: 2026-09-04*
*Ready for planning: yes*

---

## RESEARCH COMPLETE

1. **The picker filter is not a filter.** `grid-fw`'s shared ESP32-S3 USB component hard-codes `0x303a/0x8123` for *every* module, all labelled `"Grid"` — so CONN-07's verify step is the whole of CONN-07, and `not-zona` is a routine outcome. Plan it as a first-class state, not an edge case.
2. **After a replug the `SerialPort` object is new** (Chromium mints a fresh token for wired ports). The `connect` listener must identify by `getInfo()` and adopt; comparing object identity silently breaks CONN-06's replug half. This deserves its own plan task and its own e2e.
3. **The grant is persistent on all three desktop platforms**, because ZONA sets a per-chip `iSerialNumber` — so silent reconnect is a real promise, not a Windows accident, and PITFALLS C10's LOW row is closed. But the grant is **per module**, so the copy must say "ZONA detected", never "we remembered yours".
4. **D-12 is confirmed and understated.** One `NotFoundError` covers cancelled, empty-and-dismissed, *and* blocked-by-setting. The `cancelled` state needs **two** disclosures, not one.
5. **Two new failures exist that today land in `unknown`:** both `InvalidStateError` forms of a racing `open()`. A site-wide session with two controls makes them reachable for the first time. An in-flight guard in the session is the fix; the taxonomy entry is the safety net.
6. **The transient-activation failure is thrown, not rejected.** The Phase 4 handler's stored-promise `.catch()` would not see it. Any plan that touches the connect handler must wrap the call.
7. **The session must never be statically imported into the header's import graph** or the 131 KB protocol chunk lands on `/`'s first paint and the artefact gate goes red — and the *source* gate would not have caught it, so widening `COMPILER_MARKERS` is a task, not a nicety.
8. **`MODULE_GONE_MS = 750` has been unused since Phase 2** and is the liveness watchdog this phase was waiting for. Fold heartbeats for the life of the connection: it buys liveness, a live active page, and D-08's late-arriving rig modules in one mechanism.
9. **Name the session spec `session.spec.ts`, not `session.svelte.spec.ts`** — the `server` project's exclude glob would silently collect nothing, and the suite would be green and vacuous.
10. **Split the work along ownership, not along screens:** (a) the session store and its taxonomy extensions, proven in node; (b) the fake serial and `/dev/session/`, proven in both browsers; (c) `TryOnDevice`'s migration from owner to consumer, with `e2e/first-experience.e2e.ts` kept green deliberately; (d) the header slot and its coexistence with Phase 5.1's `BrowseLink`, which cannot start until 5.1 lands; (e) `forget()` and the disclosure; (f) `docs/SESSION-RUNBOOK.md` and the `checkpoint:human-verify`. (a) and (b) are independent and can run in parallel; (c) depends on (a); (d) depends on (a) **and** on Phase 5.1's header row existing.
