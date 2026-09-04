# Phase 6: Device Session — Context

**Gathered:** 2026-09-04, unattended (overnight delegation #2: "proceed without confirmation at your
best discretion"). Sources: the user's kickoff decisions (multi-module detect-and-warn; name Grid
Editor as the likely port holder; silent reconnect pulled into v1; capability detection never
user-agent sniffing), the STACK research's Web Serial section (Firefox 151+ two-step prompt,
`navigator.serial` `connect`/`disconnect` listeners, `SerialPort.forget()`, `getPorts()`), the
Phase 2 hardware run (identification is passive; the grant survives a browser restart) and what
Phase 4 already shipped (`capabilityOf`, `identifyOnly`, `TryOnDevice` with its connect states,
`failureCopy` for six failures, port release on un-choose). [user] decisions are the user's;
[orchestrator] ones were taken without the user and are open to veto.

## Phase boundary

Phase 6 turns Phase 4's per-panel connect into a site-wide **device session**: one connection that
survives navigation, silent reconnect for returning visitors, plug/unplug awareness, the module's
identity on screen, every failure named with its recovery, and a revoke control. It never writes
(Phase 7). It does not change the front door's choreography.

## Decisions

### The controls
- **D-01 [user, brief]** `TRY ON DEVICE` stays the primary action in the chosen panel — "that's the
  whole point" — and becomes the consumer of the session rather than its owner.
- **D-02 [orchestrator]** The roadmap's "one primary `CONNECT` control" is the session's own control
  in the header's device slot: a quiet indicator that reads `NO ZONA` / `ZONA DETECTED — CONNECT` /
  `ZONA · fw 1.5.5 · page 3` / `DISCONNECT ZONA`. On the front door it is secondary in weight to the
  pad; `TRY ON DEVICE` in the panel and `CONNECT` in the header call the same session action.
  Enabled only when `"serial" in navigator && isSecureContext`; never gated by user agent.
- **D-03 [user, kickoff]** Two different messages for unsupported browser and insecure context, each
  naming the fix; the unsupported one names Chrome, Edge and desktop Firefox 151+ and never says
  "Chromium". Phase 4's `UNSUPPORTED_DETAIL` already satisfies the wording; this phase places it.
- **D-04 [orchestrator]** CONN-03's pre-click explanation is one quiet Body line beside the control:
  what the browser's picker is, that the browser asks and not HANGAR, and that HANGAR sees nothing
  until the visitor chooses. On Firefox the line gains the two-step wording (a site-permission prompt
  first, then the picker) — detected by the prompt's behaviour, never by user agent.

### The session
- **D-05 [orchestrator]** A single session store (`src/lib/device/session.svelte.ts`, runes, one
  instance per page load) owns the port, the identity, the phase and the failure; components
  subscribe. Navigation between `/`, `/c/<id>/` and `/browse/` never closes it (SvelteKit's client
  router keeps the module alive); a full reload re-establishes it through silent reconnect.
- **D-06 [user, kickoff pull-in]** Silent reconnect: on load, `navigator.serial.getPorts()`; if a
  previously granted ZONA is attached, the header offers `ZONA DETECTED — CONNECT` and one click
  connects without the picker (Phase 2 measured the grant surviving a browser restart). It never
  auto-opens the port without a click (SAFE-01's spirit: nothing happens without an explicit click,
  and an open port is exclusive — the visitor may want Grid Editor to have it).
- **D-07 [orchestrator]** `navigator.serial`-level `connect` and `disconnect` listeners (Phase 2's
  transport listens on the port only): unplugging flips the session to `unplugged` immediately and
  says so; replugging a granted port offers reconnect. `SerialPort.connected` is used where present,
  feature-detected.
- **D-08 [user, kickoff]** Multi-module rigs are detected (Phase 2's identification already sees the
  other modules' heartbeats) and named in the identity line: `ZONA · fw 1.5.5 · page 3 · with EN16,
  BU16`. Phase 7 uses this for SAFE-06.
- **D-09 [orchestrator]** CONN-07: the picker is filtered to VID 0x303a / PID 0x8123 only (already
  in `openZonaPort`); after opening, the module is verified as a ZONA from its heartbeat before any
  control enables; any other module lands in `not-zona` with the plain message. CONN-08: type and
  firmware are always visible while connected.
- **D-10 [orchestrator]** A visible `FORGET THIS ZONA` control (backed by `SerialPort.forget()`,
  feature-detected) lives in a quiet disclosure beneath the identity — the trust control the STACK
  research recommended for a site that will write firmware config.

### Failures
- **D-11 [user, kickoff]** Port held by another program names Grid Editor as the likely culprit
  with the recovery in order: quit the other app, unplug, wait, replug, reload, connect (Phase 4's
  `failureCopy` already has it; this phase surfaces it in the session's failure slot).
- **D-12 [orchestrator]** CONN-05: a cancelled picker is its own state ("you cancelled — nothing
  happened"); an empty picker branches to the cable and driver checks with the charge-only USB
  cable warning. Distinguishing "cancelled" from "nothing listed" is not exposed by the API
  (`requestPort` rejects with `NotFoundError` in both), so the empty-picker copy is reached by a
  `Nothing listed?` disclosure next to the cancelled state — research confirms or corrects.
- **D-13 [orchestrator]** Every failure is a named state in the session (`unsupported`, `insecure`,
  `cancelled`, `port-busy`, `not-zona`, `silent`, `unplugged`, `unknown`), each with `failureCopy`
  and a way out; no raw exception text ever reaches the screen except as the quoted detail line.

### Proof
- **D-14 [orchestrator]** `FakeTransport` and the Phase 2 captures drive the session in Vitest
  (state machine, reconnect offer, unplug/replug transitions, multi-module naming, never-writes);
  a `/dev/session/` probe page with a scripted fake serial (`navigator.serial` shimmed by an init
  script) lets Playwright walk the states in both projects, including the degrade path.
- **D-15 [user, standing]** The hardware truths — silent reconnect after a browser restart,
  unplug/replug, the Grid-Editor-holds-the-port message, the not-a-ZONA refusal — are the user's
  daytime checklist (`docs/SESSION-RUNBOOK.md`), a `checkpoint:human-verify` in the final plan.

### Amended at the UI check (2026-09-04) **[orchestrator]**
- **D-02 amended:** the slot's connect affordance is the caption `ZONA detected` over the label
  `CONNECT ZONA` (a label must be a verb phrase; `ZONA DETECTED — CONNECT` fails Phase 4's
  label-versus-statement rule); `DISCONNECT ZONA` moves off the slot into the disclosure.
- **D-04 amended:** the Firefox two-step wording is unconditional ("some browsers") because no
  non-brand behavioural signal for that prompt exists; `NotAllowedError` adds one sentence inside
  `cancelled`, not a ninth state.
- **D-13 amended:** the taxonomy is NINE states — `unplugged` splits into `unplugged-at-open`
  (`classifyOpenError`: `NetworkError` during `open()` with `port.connected === false`; renders
  `failureCopy("unplugged", …)` verbatim with the cable/hub steps) and `unplugged-while-connected`
  (the `navigator.serial` `disconnect` of a live session; Phase 4's sentence plus the replug offer).
- **D-16:** CONN-03's pre-click line and the SAFE-01 sentence render INLINE beneath the header row
  in the not-connected states on `/`, `/c/<id>/` and `/browse/` (no disclosure — a control that both
  acts and expands lies in one of its two jobs); the chosen panel's honesty slot keeps its own copy.
- **D-17:** exactly one SESSION live region site-wide; Phase 5's tuning region and Phase 5.1's browse
  region coexist with disjoint trigger sets; in the same 500 ms window the session speaks first.

## Deferred / out of scope
Any write (Phase 7: snapshot, PUT BACK, KEEP ON DEVICE). Android WebUSB and iOS transports
(recorded as a possible later spike; not here). Changing the front door's choreography.

## Open for the user
1. Whether the header device slot may show the firmware/page line permanently or only on hover.
2. Whether silent reconnect should auto-open on a returning visit (decided NO — one click).
3. Whether `FORGET THIS ZONA` belongs in v1.
