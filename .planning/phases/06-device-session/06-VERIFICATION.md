---
phase: 06-device-session
verified: 2026-09-05T10:15:00Z
status: human_needed
score: 2/5 success criteria verified; 3/5 human_needed (every automatable half of them passes)
human_verification:
  - test: "Runbook row A - the grant survives a browser restart, on 127.0.0.1:4173 AND on the deployed HTTPS origin"
    expected: "On reload after a full browser quit the header reads `ZONA detected` over `CONNECT ZONA` with no picker; one click connects with no list"
    why_human: "Permission persistence is browser profile state and is per origin; the scripted serial only shows HANGAR's reaction to getPorts()"
  - test: "Runbook row B - unplug and replug a real ZONA while connected"
    expected: "Header flips to `ZONA unplugged` / `NO ZONA` at once with no click; replug returns `ZONA detected` / `CONNECT ZONA`; one click reconnects with no picker and no error"
    why_human: "Whether the browser really hands back a different SerialPort object on replug is a source reading (serial_service.cc); the shim reproduces the reading, it cannot prove it"
  - test: "Runbook row C - Grid Editor holds the port"
    expected: "`Another program is holding the port` opens by itself with focus inside it, names Grid Editor, lists the six steps in order, and `Failed to open serial port.` appears nowhere; Escape returns focus to the slot. Also: does the copy read as helpful or as jargon"
    why_human: "The suite proves the block against a scripted NetworkError; that Grid Editor produces that error on this OS was never exercised (SKELETON-RUNBOOK row 0 was skipped in Phase 2)"
  - test: "Runbook row D - a second Grid module beside the ZONA, then a non-ZONA alone"
    expected: "Rig: slot gains `· with <TYPE>` at desktop width and the disclosure `Also on the cable: <TYPE>.`, order stable. Non-ZONA alone: the picker still offers it and HANGAR refuses it by name (`That module is not a ZONA` ... `It reported itself as <TYPE>.`), the port released"
    why_human: "Every frame in the Phase 2 capture carried SX 0, SY 0; the other-module path has met only synthetic heartbeats"
  - test: "Runbook row E - FORGET THIS ZONA"
    expected: "Port closes at once, slot reads `CONNECT ZONA` with no caption; after reload `NO ZONA` with no offer and the picker is required again; Grid Editor can open the module without a replug"
    why_human: "Revocation is browser profile state and OS port exclusivity; the shim records close-before-forget ordering only"
  - test: "Runbook row F (optional) - Firefox 151+ two-step prompt on a clean profile"
    expected: "Site-permission prompt before the chooser, then a normal connection; dismissing the first prompt lands in `Did not connect` / `You closed the chooser` with the two-step sentence beneath `Nothing listed?`"
    why_human: "No Firefox 151+ desktop is known on this machine and the copy is unconditional by design (Y-05); only a person on Firefox can say whether it was enough"
---

# Phase 6: Device Session Verification Report

**Phase Goal:** A visitor with a ZONA can get from a cold page to a verified connection, and every way that can go wrong tells them what to do next in plain language.
**Verified:** 2026-09-05T10:15:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Gates, run by the verifier (observed, not copied)

| Command | Expected (06-14) | Observed |
| ------- | ---------------- | -------- |
| `npm run check 2>&1 \| grep -Ei "error\|warning"` | 533 files, 0 errors | `COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0 |
| `npm run lint` | clean | `All matched files use Prettier code style!`, eslint silent, exit 0 |
| `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 69 724` | 69 / 724 | `observed 69 files, 724 tests passed, 1 todo` - matches; Duration 22.88s |
| `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 3 13` | 3 / 13 | `observed 3 files, 13 tests passed` - matches; Duration 76.92s |
| `npx playwright test --workers 3` (nothing held 4173/4174 or build/ beforehand) | 77 = 67 + 10 | `77 passed (1.2m)`; tally 67 `[chromium]` + 10 `[webkit-phone]`; no retry, no `ProxyController`, no `Network connection lost`; `format-parity.spec.ts` did not flake; `test-results/` removed afterwards; no listener left on 4173/4174, no workerd/wrangler process |

Every number matches 06-14's gate first time. The five-name block reconciles: 66 + 3 files, 691 + 33 tests, `3 13` unchanged, 61 + 16 e2e.

## Goal Achievement

### The five success criteria (ROADMAP)

| # | Criterion | Status | Evidence |
| --- | --------- | ------ | -------- |
| 1 | One primary `CONNECT` control, enabled only by `"serial" in navigator && isSecureContext`, never by user agent; two different messages for unsupported vs insecure, naming Chrome, Edge, desktop Firefox 151+ and never "Chromium" | VERIFIED | `session.svelte.ts` `start()` decides `capabilityOf({hasSerial, secure})` synchronously (lines 431-449) and nothing else gates the control; `grep userAgent` over `src`/`e2e` finds only capture metadata and the Phase 2 skeleton probe recording its UA into a capture - no gate reads it. `transport.ts` `UNSUPPORTED_DETAIL` names Chrome, Edge, "desktop Firefox 151 and newer"; `insecure-context` names HTTPS. `session.e2e.ts` tests 3 (probe) and 13 (`@webkit`, shipped header) render `unsupported` on a WebKit with no `navigator.serial`; test 4 renders `insecure` through a shadowed `isSecureContext`; both assert `body` does not contain "Chromium". The slot is one `<button data-testid="device-slot">` on `/`, `/c/[id]/` (FrontDoor) and `/browse/` (browse page line 428) |
| 2 | Before clicking, the visitor reads what the picker is, that the browser asks not HANGAR, and that HANGAR sees nothing until they choose | VERIFIED | `PICKER_EXPLAINER` (130 chars, asserted in `session-copy.spec.ts` test 5) rendered by `PickerExplainer.svelte`; mounted in `DeviceNote.svelte` (S1/S7, hidden by twin when `panelOwnsProse`) and in `TryOnDevice.svelte` (idle/detected/forgotten), never both - `device-ui.spec.ts` test 7 and `DeviceNote` `line` derivation. The note is present in the prerendered document (S1) and absent in S0a/S0b; e2e test 13 asserts the absence only after `data-hydrated` and the settled caption |
| 3 | *(hardware)* Picker offers only 0x303a/0x8123, never bootloader identities; heartbeat verifies ZONA before any control enables; other module refused plainly; type and firmware shown | HUMAN_NEEDED (automated half VERIFIED) | `ZONA_USB = {0x303a, 0x8123}` in `protocol/usb.ts` (zero imports); `connect()` passes `{ filters: [ZONA_USB] }` and nothing else; 0x8122 (bootloader) is named as never listed and `session.spec.ts` test 11 ignores a 0x8122 arrival. `#openAdopted` reaches `connected` only after `identifyOnly` returns `identified` (heartbeat type 1 + `ZONA_HWCFG`), else `not-zona`/`silent` with the port closed (spec tests 7, 8). Header label `ZONA · fw 1.5.5 · page 3` from the real capture (e2e test 10). **Hardware halves - a real rig, a real non-ZONA refusal - are runbook row D, unanswered** |
| 4 | *(hardware)* Each failure is a named state; port-busy names Grid Editor with the six-step recovery in order; cancelled distinct from empty picker; empty picker branches to cable and driver with charge-only warning | HUMAN_NEEDED (automated half VERIFIED) | Nine named states (`NAMED_STATES`, 6 + 3, spec test 3); `slotStateOf` covers all 17 phases with no default. `failureCopy("port-busy")` detail names Grid Editor and the tray icon; steps: quit / unplug / wait / replug / reload / click - asserted in order in e2e tests 6 (probe) and 12 (shipped header, auto-opened drawer, focus inside, Escape returns focus). `cancelled` is its own phase with `You closed the chooser`; `Nothing listed?` `<details>` carries the three steps, charge-only cable first, plus `The chooser never appeared?` and the two-step sentence (`DeviceDetails.svelte` 213-227; e2e test 2). **That Grid Editor is what raises the NetworkError on this OS is runbook row C, unanswered** |
| 5 | *(hardware)* Returning visitor reconnected silently from a granted port without the picker; unplug/replug updates the UI immediately, not on the next write | HUMAN_NEEDED (automated half VERIFIED) | `#offerGranted` calls `grantedZonaPorts(serial)` on `start()` with no gesture and never `open()` (spec test 2: `open === 0`); one click takes the adopted path with zero `requestPort()` calls (e2e tests 5, 10, 11 assert `requests() === 0`). `navigator.serial`-level `connect`/`disconnect` listeners (`#attachListeners`); disconnect flips to S5 in the same turn (spec test 9 asserts with no await; e2e test 7). **Grant across a browser restart (both origins), real replug, real revoke are runbook rows A, B, E, unanswered** |

**Score:** 2/5 verified outright; 3/5 human_needed with every automatable half green. No criterion failed.

### The particular checks the verifier was asked for

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | The session has exactly four static specifiers | VERIFIED | `grep '^} from "\|^import .* from "' session.svelte.ts` -> `./session-copy`, `$lib/protocol/usb`, `$lib/transport/ports`, `$lib/transport/transport` (lines 125-137). Heavy modules only via `await import` at 263-265 inside `loadHeavy()`, reached from `#openAdopted` after the chooser |
| 2 | The `/c/[id]` cold-load surface is light: config-shape 13 (permitted-module walk) and 14 (built HTML graph) | VERIFIED | `config-shape.spec.ts` test 13 walks the five `PERMITTED_SPECIFIERS` by exact match, follows them and marker-checks everything else, with non-vacuity guards (walked >= 4, followed > 0); test 14 walks `build/index.html`, `build/browse/index.html`, `build/c/aurora/index.html`, `build/c/euclid/index.html` transitively against the chunk carrying the protocol symbol. Both ran green in this verifier's `test:quick` with a `build/` present; `build/*.html` carry zero `data-hydrated` |
| 3 | Never-writes proof in node, both halves | VERIFIED | `session.spec.ts` test 15: half one drives offer -> connect -> identify -> unplug -> replug -> connect -> forget over two recording `FakeTransport`s and asserts `writes` length 0 (`expect.soft`); half two strips comments from `session.svelte.ts` and asserts nine fragment-assembled needles (`.write(`, `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `fetchConfig`, `storeToFlash`, `writeBack`, `setInterval`) are absent. `forbidden-instructions.spec.ts` `SCANNED_DIRS = ["src/lib"]` now covers `src/lib/device` |
| 4 | Never-writes proof in the browser (whole visit) | VERIFIED | `session.e2e.ts` test 9 "a whole visit writes nothing and can revoke its own permission": grant, load, connect, identify, unplug, replug, connect, identify, forget, then `writes() === 0` and `requests() === 0`; every other shim-installed test ends on `writes() === 0` too. 06-07-SUMMARY records the planted write making the counter 2 before it was trusted |
| 5 | The nine named states each reachable from a test | VERIFIED | `unsupported`/`insecure`: spec test 1, e2e 3/4/13. `cancelled`: spec 6, e2e 2. `port-busy`: spec 6, e2e 6/12. `not-zona`: spec 8. `silent`: `#fail("silent")` path; `silentBlock` copy spec 4 (no e2e drives it - rig probe only). `unplugged-at-open`: spec 6. `unplugged-while-connected`: spec 9/10/12, e2e 7/8. `unknown` (incl. `already-open`): spec 5/6. `slotStateOf` reachability of all nine slot states: session-copy.spec test 2 |
| 6 | Replug adoption by `isZonaPort`, not identity | VERIFIED | `#onSerialConnect` (session.svelte.ts 465-470): `isZonaPort(port)` then `#offer(port)` -> `#adopt` replaces `#port`; no `===` against `#port`. `#onSerialDisconnect` uses identity, correctly (the asymmetry is documented). Spec test 10 fires `connect` with a fresh object and asserts the click opens THAT object (`replugged.open === 1`, `first.open` unchanged, `requestPort === 0`); e2e test 8 asserts `openCount(1) === 1`, `openCount(0)` unchanged |
| 7 | Watchdog's `portIsAttached` guard | VERIFIED | `#armWatchdog` (753-767): `gone && port && portIsAttached(port) === false` - `undefined` (Chrome 89-129) is not `false`. Self-rescheduling `setTimeout`, disarmed on every teardown. Spec test 12 (a) fires on silence + detached, (b) heartbeats keep it alive even with `connected=false`, (c) silence with the port attached or with no `connected` property leaves `connected` - no tenth state |
| 8 | `forget()` is teardown-then-revoke | VERIFIED | `forget()` (881-892): `await this.#teardown(); await port.forget();` then drop references, `phase = "forgotten"`. Spec test 14 asserts `port.order === ["open","close","forget"]` and that a port without `forget` renders no control and moves nothing. `canForget = "forget" in port` at adoption |
| 9 | Reconnect offer with no gesture, never auto-open | VERIFIED | `start()` -> `#offerGranted()` -> `grantedZonaPorts` (`getPorts()` needs no gesture) -> `#offer` -> `detected`; no `open()` anywhere on that path. Spec test 2, e2e test 5 (`openCount(0) === 0` in `detected`), e2e 11 (reload lands S2 with `openCount 0`) |
| 10 | One live region per page; no heartbeat announced | VERIFIED | `SessionAnnouncer.svelte` is the one `aria-live` among the seven device components (device-ui.spec test 4) and mounted once in `+layout.svelte`; site-wide count is exactly three (`session-live`, `tuning-live`, `browse-live`) with `TryOnDevice`'s removed (device-ui.spec test 7). `#say` has six call sites; the fold's `#publish` never speaks (spec test 16: a page change republishes identity and adds no utterance). Verifier probe: `session-live` count on `/c/aurora/` = 1. e2e test 14: connect moves only `session-live`; RESET ALL moves only `tuning-live` |
| 11 | Header height constant across states at every width | VERIFIED (measured) | Verifier's scratch Playwright probe over the served build, `/c/aurora/`, states S1 -> S6 -> S2 -> S3 -> S4 -> S5: header block 196px / headline top 276px / slot 44px / note 152px identical across all six states at 1280, 1024, 900 and 640; 288 / 360 / 44 / 200 identical across all six at 320. Structurally: two 14px line boxes (Y-10), `min-block-size: 44px` on `.header` and `grid-auto-rows: minmax(44px, auto)` below 640, `DeviceNote`'s one-cell sizing-twin grid |
| 12 | The opening untouched; slot and note absent from the first painted frame | VERIFIED (structural + 06-11 measured) | `FrontDoor.svelte` passes the wordmark's own `covered` to `DeviceSlot` and `DeviceNote`; both declare `.covered { opacity: 0; transition: none }`; `holdSpeech()` taken in `onMount` only when `opening`, released from `Splash`'s `onfinished` and `onDestroy`. `Splash.svelte`, `Coverflow.svelte` untouched by the phase (git). Spec test 17 covers hold/replace/release. 06-11 measured the rise (0 at 900ms, 1 at 2100ms) - not re-measured here |
| 13 | Degrade path on WebKit waits on the hydration marker | VERIFIED | `session.e2e.ts` test 13 (`@webkit`, ran on webkit-phone this run): `toHaveAttribute("data-hydrated","true")` then the settled `CAPTION_UNSUPPORTED` before `device-note` count 0 and the panel's reason. `data-hydrated` is set only in `DeviceSlot`'s `onMount` (device-ui.spec test 6 pins it); prerendered `build/*.html` carry none |
| 14 | `requestPort()` first inside the click handler, nothing awaited before it | VERIFIED (code + probe) | `DeviceSlot.handleClick` -> `session.connect()` synchronously; `connect()` (568-591): `#busy` guard, then `picking = serial.requestPort({ filters: [ZONA_USB] })` inside a `try` as the first statement of the chooser path; `TryOnDevice.tryOnDevice` and the probe's `connect` identical. Verifier probe: inside the shim's `requestPort`, `window.event` was `{type:"click", isTrusted:true}` with `navigator.userActivation.isActive === true` - the call ran synchronously within the trusted click dispatch. Spec test 5 proves the thrown-activation path is caught at the call site |
| 15 | No attribution text in the phase's files | VERIFIED | `grep -ri "claude\|anthropic" src e2e docs .planning/phases/06-device-session` -> 55 raw hits, all of which are: `$HOME/.claude/get-shit-done/...` tool paths and the rule sentence "No Claude or Anthropic attribution" inside the PLANs; `C:\Users\sabot\.claude\projects` / `Documents\Claude\grid-fw` filesystem paths in pre-existing `firmware-oracle.ts` and `format-parity.spec.ts`; the pre-existing licence gate asserting `CLAUDE.md export-ignore` (Phase 1); and the GSD template heading `### Claude's Discretion` in 06-RESEARCH.md. Zero attribution in any shipped source, e2e, doc or SUMMARY |
| 16 | No engine names in copy or comments in `src/lib/device`, `src/lib/ui` | PARTIAL - zero in copy, four in comments | Strings: none (session-copy.spec test 6 walks every export; transport.spec test 6 scans `transport.ts`; e2e asserts `body` never contains "Chromium"). Comments: `session.svelte.ts:10` ("Chromium keys a wired port's JS object..."), `session.svelte.ts:764` ("older Chromium never takes this path"), `session.spec.ts:857`, `DeviceDetails.svelte:13` ("Chromium reaches it from three different causes") - all citing browser source behaviour, none visitor-facing. Pre-existing: `BrowseToolbar.svelte:222`, `KnobRack.svelte:69`, `TuningRegion.svelte:69`. No "WebKit"/"Gecko"/"Blink" in either directory. `docs/SESSION-RUNBOOK.md`: none. See Anti-Patterns |
| 17 | Every summary commit exists; unedited files really are unedited | VERIFIED | `gsd-tools verify commits` over 48 distinct 7-char hashes from the fourteen SUMMARYs: `all_valid: true`. `git log 746cfa2..HEAD --` is empty for `e2e/first-experience.e2e.ts`, `src/app.css`, `identity.spec.ts`, `tune-ui.spec.ts`, `playwright.config.ts`, `vite.config.ts`, `e2e/catalog.e2e.ts`, `sim/lazy.spec.ts` |

### Required Artifacts

`gsd-tools verify artifacts` over all fourteen PLANs: every artifact exists and passes (30/30). Levels 2-4 by reading:

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/device/session.svelte.ts` | The runes session store | VERIFIED | 1017 lines; `DeviceSession` class + `session` singleton; four static specifiers; wired from `+layout.svelte`, `DeviceSlot`, `DeviceDetails`, `DeviceNote`, `TryOnDevice`, `FrontDoor`, `SessionAnnouncer`, `dev/session` |
| `src/lib/device/session-copy.ts` | Every string, nine-state table, `capabilityOf` | VERIFIED | 440 lines, zero imports (spec test 1); `try-on.ts` re-exports `capabilityOf` |
| `src/lib/device/session.spec.ts` / `session-copy.spec.ts` | 17 / 6 gates | VERIFIED | 17 and 6 `it(` blocks; both ran green |
| `src/lib/protocol/usb.ts` / `src/lib/transport/ports.ts` | The light seam | VERIFIED | zero imports / one import (`$lib/protocol/usb`); `constants.ts` and `transport/index.ts` re-export |
| `src/lib/transport/transport.ts` | `already-open` row | VERIFIED | `OpenFailure` has it; `classifyOpenError` branches on `InvalidStateError`; `failureCopy` returns the unknown title with one sentence and no steps |
| `src/lib/device/try-on.ts` | rig-aware not-zona | VERIFIED | `seen.find((m) => m.heartbeatType === 1) ?? seen[0]` |
| `DeviceSlot.svelte` | nine states, 14px boxes, twin, describedby, `EXPANDS` of four | VERIFIED | 516 lines; `EXPANDS = ["S0a","S0b","S4","S5"]`; `data-hydrated` from `onMount`; mounts `DeviceDetails` (06-11's fix, commit d510037) |
| `DeviceDetails.svelte` | five states, two cancelled branches, DISCONNECT / FORGET | VERIFIED | `rendered` only in S0a/S0b/S4/S5/S6 and never while `panelOwnsProse`; `opener` fallback for focus return (06-13's fix, commit 9420282); `FORGET` gated on `session.canForget` |
| `DeviceNote.svelte` | reserved note, twins, absent in S0a/S0b | VERIFIED | `rendered = slot !== "S0a" && slot !== "S0b"`; five candidates in one cell + SAFE_PROMISE twin |
| `PickerExplainer.svelte`, `SessionAnnouncer.svelte`, `DeviceMark.svelte`, `FailureBlock.svelte`, `PadSpinner.svelte` | leaf components | VERIFIED | `PadSpinner` `size`/`decorative` default 32/false; `DeviceMark` renders `<PadSpinner size={24} decorative />` for `connecting`; `FailureBlock` renders no `<ol>` for empty steps |
| `TryOnDevice.svelte` | consumer, not owner | VERIFIED | no port, no `onDestroy`, no `closeOnHide`, `release()` is a no-op, no `aria-live`; `PRIMARY` interpolated via `session.failureFor(PRIMARY)` |
| `FrontDoor.svelte`, `routes/browse/+page.svelte`, `routes/+layout.svelte` | header cluster, browse slot, one start + one announcer | VERIFIED | `session.start()` in `onMount`; `<SessionAnnouncer />` before `{@render children()}`; browse header holds wordmark + slot + note |
| `e2e/fake-serial.ts`, `e2e/session.e2e.ts`, `routes/dev/session/+page.svelte` | shim, 14 titles (2 `@webkit`), probe | VERIFIED | shim fires at both port and serial with an own `target`; `replug()` mints a new object; 14 titles counted, 3 `@webkit` markers across 2 titles (test 13 carries the tag twice) |
| `src/lib/ui/device-ui.spec.ts`, `config-shape.spec.ts`, `forbidden-instructions.spec.ts` | 7 / 14 (widened) / 5 (widened) | VERIFIED | all green in this run |
| `docs/SESSION-RUNBOOK.md`, `docs/TESTING.md` | six rows; re-measured | VERIFIED | 164 / 751 lines; runbook names no engine; TESTING.md's numbers match what this verifier observed |

### Key Link Verification

`gsd-tools verify key-links` over fourteen PLANs: 26 of 27 verified by the tool. The one it reported as "Target not referenced" (06-03: `session.svelte.ts` -> `session-copy.ts`) is a tool false-negative: the tool searches for the target's path text while the code imports `from "./session-copy"` (line 125) and the pattern the plan named is present. Manually WIRED.

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| `+layout.svelte` | `session.start()` | `onMount` only; `start()` throws if called with no window (spec test 1) | WIRED |
| `DeviceSlot` / `TryOnDevice` / probe | `session.connect()` | synchronous from `onclick`; `requestPort` first statement | WIRED (probe-witnessed) |
| `session` | `navigator.serial` | `addEventListener("connect"/"disconnect")` on the serial object | WIRED |
| `session` | `$lib/protocol` `$lib/transport` `$lib/device/try-on` | `await import` in `loadHeavy()`, only from `#openAdopted` | WIRED (lazy) |
| `DeviceSlot` | `DeviceDetails` | `{open}` owned by the slot, `panelOwnsProse` threaded through | WIRED |
| `FrontDoor` | `session.holdSpeech()` | onMount when `opening`; released on `onfinished`/`onDestroy` | WIRED |
| `SessionAnnouncer` | `session.speech` | renders it, nothing else | WIRED |
| `e2e/session.e2e.ts` | `e2e/fake-serial.ts` | `context.addInitScript(FAKE_SERIAL)` | WIRED |
| `e2e/session.e2e.ts` | hardware capture JSON | `readFileSync` in Node, rx chunks fed via `feed()` | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
| -------- | ------------- | ------ | --------- | ------ |
| `DeviceSlot` identity label | `session.identity` | `#startFold` -> `FrameScanner.push` -> `decodeFrame` -> `absorbFrame` -> `identify` -> `#publish` (only on rendered-field change) | Yes - e2e test 10 renders `fw 1.5.5` / `page 3` from `zona-hardware-a-hb-on-pace-0.json`'s bytes, not a literal | FLOWING |
| `DeviceSlot` caption / label | `slotStateOf(session.phase)` | `start()`, `#offer`, `#refuse`/`#fail`, `#publishUnplugged`, `disconnect()`, `forget()` | Yes - every phase driven by spec and e2e | FLOWING |
| `DeviceDetails` failure block | `session.failureFor(CONNECT_LABEL)` | synchronous `failureCopy` / authored blocks; `failureKind`, `failureRaw`, `refusedModule`, `permissionDeclined` | Yes | FLOWING |
| `DeviceNote` line | `slot`, `session.phase`, `panelOwnsProse` | as above; `panelOwnsProse` from `page.state.chosen === true` (FrontDoor) / literal `false` (browse) | Yes | FLOWING |
| `SessionAnnouncer` | `session.speech` | `#say` -> 500ms trailing `#flushSpeech`, hold-aware | Yes - e2e 14 observes the sentence land once | FLOWING |
| `dev/session` `writes` readout | `window.__hangarSerial.writes()` | the shim's counter, re-read on phase/identity | Yes (test-only surface) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full suite against the production build in two engines | `npx playwright test --workers 3` | 77 passed (1.2m), 67 + 10 | PASS |
| Header block / headline / slot / note heights constant across S1,S6,S2,S3,S4,S5 at 1280/1024/900/640/320 | scratch Playwright probe over `wrangler dev` (scratchpad, removed) | 196/276/44/152 at the four desktop widths; 288/360/44/200 at 320; all six states equal per width | PASS |
| `requestPort()` invoked synchronously inside the trusted click | probe: `window.event` inside the shim's `requestPort` | `{"evt":"click","trusted":true,"activation":true}` | PASS |
| One `session-live` region on `/c/aurora/` | probe count | 1 | PASS |
| Prerendered HTML carries no `data-hydrated` | `grep -c data-hydrated build/{index,browse/index,dev/session/index}.html` | 0 / 0 / 0 | PASS |
| Documented commits exist | `gsd-tools verify commits` (48 hashes) | `all_valid: true` | PASS |

### Requirements Coverage

| Requirement | Source plans | Description | Status | Evidence |
| ----------- | ------------ | ----------- | ------ | -------- |
| CONN-01 | 03, 05, 06, 10, 11, 14 | One `CONNECT` control, capability-gated, never UA | SATISFIED | criterion 1 |
| CONN-02 | 02, 06, 12, 14 | Two messages; names Chrome/Edge/Firefox 151+; never "Chromium" | SATISFIED | criterion 1; e2e 3, 4, 13 |
| CONN-03 | 02, 09, 12, 14 | Pre-click picker explanation | SATISFIED | criterion 2 |
| CONN-04 | 01, 07, 08, 14 | Grid Editor named, six ordered steps, no raw exception | SATISFIED (scripted) / hardware row C pending | criterion 4 |
| CONN-05 | 02, 03, 06, 10, 14 | Cancelled distinct; cable/driver branch with charge-only warning | SATISFIED | criterion 4; `NOTHING_LISTED_STEPS[0]` is the charge-only cable |
| CONN-06 | 03, 04, 07, 10, 13, 14 | Silent reconnect; connect/disconnect events | SATISFIED (scripted) / hardware rows A, B pending | criterion 5 |
| CONN-07 | 01, 03, 13, 14 | Filter to ZONA identity, verify from heartbeat, refuse others | SATISFIED with the research correction (filter is shared by every ESP32-S3 Grid module; the heartbeat is the whole verify) / hardware row D pending | criterion 3 |
| CONN-08 | 02, 04, 08, 10, 11, 14 | Type and firmware visible while connected | SATISFIED | live identity in header; spec test 13 (page change republishes) |
| SAFE-01 | 04, 05, 07, 09, 13 (contributed) | Nothing written without a click; said out loud | NOT CLAIMED - Phase 7's (correct) | zero writes proven twice; `SAFE_PROMISE` rendered in note and disclosure; REQUIREMENTS.md keeps it `[ ]` |
| DEGR-02 | 06, 11, 12 (contributed) | Install controls present but disabled with reason | NOT CLAIMED - Phase 7's (correct) | header slot and panel obey it on WebKit (e2e 13) |

Orphaned requirements: none. REQUIREMENTS.md maps exactly CONN-01..08 to Phase 6, every one of which appears in at least one plan's `requirements`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/lib/device/session.svelte.ts` | 10, 764 | "Chromium" in comments | Info | Not visitor-facing; 06-UI-SPEC's rule is about strings, which are clean. Note the asymmetry: `transport.spec.ts` test 6 fails on the word anywhere in `transport.ts` (it caught a comment in 06-01), while no gate scans `session.svelte.ts` or the components for it. A future widening of that scan would go red on correct code here |
| `src/lib/device/session.spec.ts` | 857 | "Chromium" in a test comment | Info | as above |
| `src/lib/ui/DeviceDetails.svelte` | 13 | "Chromium" in the header comment | Info | as above |
| `src/lib/device/session-copy.ts` | 135-138 | comment says `failureCopy` has "exactly the six branches" - it has seven since 06-01 (`already-open`) | Info (known erratum, recorded by 06-14) | The nine-state count is right; the transport branch count in the sentence is stale. One-line comment fix owed by the next editor |
| `06-UI-SPEC.md` / `06-02-PLAN.md` | - | `SAFE_PROMISE` stated as 125 characters; it is 126 | Info (known erratum) | `session-copy.spec.ts` test 5 asserts 126 against the verbatim contract string |
| `src/routes/browse/+page.svelte` | 494-499 | header is one flex row at every width (no two-row rule below 640) | Info | Consistent with the spec's reasoning - the two-row rule exists for the row that holds `BROWSE ALL`/`BACK TO BROWSE`, which `/browse/` does not; the runbook's "alone on the header's second row" describes `/` and `/c/<id>/` |
| `e2e/first-experience.e2e.ts` | 156, 535 | key presses before any hydration marker (deferred item 8) | Warning (pre-existing, outside the phase's files) | Did not fire in this run (77 first time). Race is real, recorded twice; owner Phase 7. `session.e2e.ts` applies the wait on its own side |
| `src/lib/ui/Coverflow.svelte` | - | 6px horizontal overflow at 320 (deferred item 9) | Info (pre-existing) | Reproduced by the verifier's probe: `scrollWidth` exceeds `clientWidth` by 6 at every width (1030/1024, 906/900, 646/640, 326/320) - the coverflow's `overflow-clip-margin`, not the header |
| `playwright.config.ts` | - | no `outputDir`; `test-results/` written after a green run (deferred item 5) | Info | Reproduced: present after this run, removed by hand |
| Empty implementations / placeholders / TODO / FIXME | - | `grep` over every phase file | none | `TryOnDevice.release()` is an intentionally empty function documented as such (Y-17) |

No blocker anti-patterns. No stub: every component renders session data that a spec or an e2e drives with real values.

### Human Verification Required

The three *(hardware)* success criteria cannot be closed by anything this verifier may do - the instruction was not to connect to or write to any device, and Web Serial has no automation hook in any case. The six items are `docs/SESSION-RUNBOOK.md` rows A-F, listed in the frontmatter above with their pass conditions. Row F is optional. The runbook also asks two design questions that are the user's rather than a verifier's: whether 152px of header note is worth its cost (06-UI-SPEC open question 7) and whether `FORGET THIS ZONA` belongs in v1 (06-CONTEXT open question 3).

### Gaps Summary

No gaps block the goal. Every artifact the fourteen plans name exists, is substantive, is wired and carries real data; every gate the phase set for itself is green on this machine at the numbers 06-14 recorded (533 / 0, lint clean, 69 / 724, 3 / 13, 77 = 67 + 10); the session's four-specifier discipline, the never-writes property (node and browser), the nine named states, the replug adoption by USB identity, the watchdog's attached-port guard, the close-before-forget order, the one-click reconnect with no picker, the single session live region, the constant header height, the untouched opening, the hydration-marker-ordered degrade test on WebKit, and `requestPort()`-first-inside-the-click were each verified against the code and, where a browser was needed, observed on the served build.

What remains is exactly what the phase said remains: the hardware halves of CONN-04, CONN-06 and CONN-07 are the user's six runbook rows, presented and unanswered. The phase has made no claim about a real ZONA, and this report makes none either.

Two spec errata and four engine-name comments are recorded above as information, not defects. Deferred items 5, 7, 8, 9 and 10 were reproduced or re-read and stand as written, with their owners.

---

_Verified: 2026-09-05T10:15:00Z_
_Verifier: Claude (gsd-verifier)_
