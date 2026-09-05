# Phase 7: Install Flow — Context

**Gathered:** 2026-09-05, unattended (overnight delegation #2). Sources: the user's kickoff decisions
(RAM audition first and flash store as a separate deliberate action; snapshot at connect with a
one-click restore; the snapshot durable across a closed tab; refuse nothing on a multi-module rig but
name the other modules; "installed" only on ACK; bounded retries; honest speed), Phase 2's proven
no-op cycle on a real ZONA (`fetchBoth` → `writeBack` Timer-then-Setup → `storeToFlash` → re-fetch,
every frame ACK'd, byte-identical after), Phase 5's tuner (the strings that would be written) and
Phase 6's session (the connection they are written through). [user] decisions are the user's;
[orchestrator] ones were taken without the user and are open to veto. **The first write to a real
ZONA is the user's click, at the hardware checkpoint — never the orchestrator's.**

## Phase boundary

Phase 7 makes `TRY ON DEVICE` write, adds `PUT BACK` and `KEEP ON DEVICE`, and makes every one of
those safe: a snapshot before any write, RAM before flash, ACK before "installed", named failures with
the way back always offered. It does not change what is written (Phases 5 and 8 own the strings) or
how the module is reached (Phase 6 owns the session).

## Decisions

### Safety rails
- **D-01 [user]** Nothing is written without an explicit click, and the connect surface says so out
  loud (SAFE-01 — Phase 6's header note already carries the sentence; Phase 7 keeps it true).
- **D-02 [user]** `TRY ON DEVICE` writes to RAM only and is the primary action; `KEEP ON DEVICE`
  stores to flash and is visibly secondary and separate — never equal-weight buttons (SAFE-02; the
  chosen panel already holds both, the second disabled with "after a try-on").
- **D-03 [user]** At connect — before any write control enables — HANGAR snapshots the touch
  element's Setup and Timer (Phase 2's `fetchBoth` on the module's reported active page); every
  write control stays disabled until that snapshot is present and non-empty (SAFE-03). `PUT BACK`
  restores it with one click at any time.
- **D-04 [user]** The snapshot persists in `localStorage` keyed by module identity so `PUT BACK`
  survives a closed tab (SAFE-04). **Research question:** Web Serial exposes VID/PID, not the USB
  serial, and the heartbeat carries no serial — the key needs a stable per-module identity readable
  over the wire (a Grid property, or the fetched strings' hash as a weaker fallback); the researcher
  decides and the UI copy says what "this ZONA" means.
- **D-05 [user]** `KEEP ON DEVICE` requires a confirmation naming what is replaced ("the Setup and
  Timer scripts on your ZONA's touch element") and stating it survives a power cycle (SAFE-05). On a
  rig with other Grid modules the confirmation names them (Phase 6's identity carries them) and
  states their current pages are stored too, because PAGESTORE is a global broadcast — and the
  action remains allowed (SAFE-06; supersedes Phase 2's refuse-on-rig, which was a skeleton rule).
- **D-06 [user]** "Installed" means an ACKNOWLEDGE frame arrived for each event write, never a
  resolved writer promise. A write that lands one event but not the other is detected, reported
  plainly, and recovered by retry or by `PUT BACK` (SAFE-07). Retries on timeout are bounded; a
  connection lost mid-write ends in a named failure state with `PUT BACK` still offered (SAFE-09).
- **D-07 [user]** Speed is stated honestly ("about a second") and a settled state is confirmed —
  no progress bar for a 200 ms operation (SAFE-08). Phase 2 measured EXECUTE ACKs at 15–22 ms.
- **D-08 [user]** On browsers without Web Serial the install controls are present but disabled with
  the reason inline, never hidden (DEGR-02 — Phase 4's disabled-with-reason pattern).

### The write itself
- **D-09 [orchestrator]** The wire order is Phase 2's proven one: Timer (event 6) first, then Setup
  (event 0), on the touch element (element 0) of the module's reported active page, each a
  CONFIG/EXECUTE awaited for its ACK; then `restorePageChange` (a successful CONFIG/EXECUTE clears
  `page_change_enabled`; only an inbound TYPE 255 heartbeat restores it). `PUT BACK` is the same
  sequence with the snapshot's strings. `KEEP ON DEVICE` is PAGESTORE/EXECUTE awaited for its ACK.
- **D-10 [orchestrator]** The strings come from Phase 5's tuner: for compiler-driven entries the
  compiled Setup/Timer of the current knob state after `padReady()`; for Lua entries the rendered
  canonical text. Both are asserted ≤ 908 before anything reaches the wire; an over-budget state
  already disables `TRY ON DEVICE` (TUNE-05). What is written is byte-for-byte what the meters
  measured — a spec pins it.
- **D-11 [orchestrator]** The session (Phase 6) gains a write-capable transport only inside the
  install actions; the never-writes invariant narrows to "zero writes without a click" and every
  write is attributable to one of three clicks (`TRY ON DEVICE`, `PUT BACK`, `KEEP ON DEVICE`),
  asserted against `FakeTransport`.
- **D-12 [orchestrator]** After `KEEP ON DEVICE` the module restarts its Lua VM (Phase 8 research):
  the settled state re-fetches both strings and shows them byte-identical to what was sent — the
  same re-fetch proof Phase 2 shipped — before saying "kept".

### Proof
- **D-13 [orchestrator]** Every path runs against `FakeTransport` and the Phase 2 hardware captures
  in Vitest: snapshot-before-write, the three clicks, partial ACK (one event lands), timeout with
  bounded retry, disconnect mid-write, the multi-module confirmation text, the localStorage key round
  trip, over-budget refusal before the wire. Playwright walks the states through the fake serial
  shim on `/dev/session/` (Phase 6) or a `/dev/install/` probe, in both projects.
- **D-14 [user, standing]** The hardware truths are the user's daytime checklist
  (`docs/INSTALL-RUNBOOK.md`, a `checkpoint:human-verify` in the final plan): the first RAM write to
  a real ZONA, `PUT BACK`, a power cycle bringing the original back, `KEEP ON DEVICE` surviving a
  power cycle, a fresh-tab `PUT BACK`. The orchestrator never performs a write.

### Placement (Phase 4 D-08 honoured)
- **D-15 [orchestrator]** `TRY ON DEVICE` and `KEEP ON DEVICE` stay where the chosen panel put them;
  `PUT BACK` appears beside `KEEP ON DEVICE` once a snapshot exists, secondary in weight; the install
  states (writing / settled / kept / partial / lost) render in the panel's honesty slot the way the
  connect states do, with the identity line unchanged. The flash confirmation is an inline block, not
  a modal, with `KEEP ON DEVICE` as its only affirmative and `NOT NOW` beside it. Whether a third
  colour earns itself for the flash warning is the UI spec's call (Phase 5's spec named it as the
  first candidate); the default is no.

### Added after research (2026-09-05) **[orchestrator]**
- **D-04 amended:** the durable-snapshot key is the module's factory serial, read over the wire with
  a fifth outbound instruction — `SERIALNUMBER/FETCH` → `SERIALNUMBER/REPORT` (`WORD0..WORD3`, the
  ESP32-S3 eFuse MAC, the same bytes as the USB `iSerialNumber` Chromium keys its grant on), **addressed
  to the ZONA's SX/SY, never broadcast** (a broadcast makes every module on the rig answer
  indistinguishably). It is unproven on hardware — no capture holds such a frame and grid-editor never
  sends one — so it is runbook row A. The content-hash fallback the draft floated is broken (the
  fetched strings change the instant `TRY ON DEVICE` writes); the real fallback when the serial is not
  answered is a **session-only snapshot with honest copy** ("this ZONA is remembered until this tab
  closes").
- **D-16:** `GridTransport` carries exactly one `onData` callback and Phase 6's session owns it after
  identification. The session gains an `onClass()` seam that fans decoded classes out to subscribers;
  the install actions subscribe through it. A second raw registration is forbidden (it would silently
  freeze the live page number and turn later writes into unexplained NACKs) and a spec asserts it.
- **D-17:** Phase 5's `buildTuner` never publishes the compiled strings (only meters, ladder, stamp).
  The tuner gains an `onconfig` emit inside `land()` carrying `{ setupLua, timerLua }` for the current
  state; the install actions write those strings VERBATIM, and a spec pins
  `written.length === cost().setup.used` for every preset (measured: with reserve 0/0 the compressed
  cost equals `setupLua.length`, both events, all nine).
- **D-18:** Two shipped rules are undone deliberately, each a named edit: `storeToFlash`'s
  `storeAllowed` throw (Phase 2's refuse-on-rig, superseded by SAFE-06 — `sequence.spec.ts` asserts the
  old rule and is rewritten, not deleted) and `TryOnDevice.svelte`'s two literals promising that HANGAR
  never writes (retired per the Phase 7 UI spec).
- **D-19:** Three timings are unknown until hardware and become runbook rows, each with a bounded
  mitigation the plan ships regardless: whether a real ZONA answers `SERIALNUMBER/FETCH`; how long the
  module's post-store page reload takes (the D-12 re-fetch waits for the first heartbeat after the
  PAGESTORE ACK before fetching, and retries once); and whether 0 ms pacing survives two back-to-back
  957-byte writes (the write path uses the desktop 10 ms pacing Phase 2 kept as a toggle, and the
  runbook measures 0 ms).

## Deferred / out of scope
Firefox-specific install copy beyond Phase 6's; Android WebUSB / iOS transports; writing to any
element but the touch element; page switching; anything the Grid Editor does beyond these three
clicks.

## Open for the user
1. Whether `KEEP ON DEVICE` may use a third colour for its warning.
2. Whether the durable-snapshot key should be shown to the user (which ZONA the site remembers).
3. Whether a power-cycle test row belongs in the daytime checklist (it does in this draft).
