---
phase: 02-walking-skeleton
verified: 2026-09-03T23:11:38Z
status: passed
score: 10/10 must-haves verified
re_verification: false
human_verification: []
---

# Phase 2: Walking Skeleton Verification Report

**Phase Goal:** Prove that a bare browser page — no framework, no Grid Editor runtime — can complete
the whole write cycle against a real ZONA, using a write that changes nothing.

**Verified:** 2026-09-03T23:11:38Z
**Status:** passed
**Re-verification:** No — initial verification

**Method.** Goal-backward. The five ROADMAP Success Criteria were taken as the truths, and the five
plans' `must_haves` supplied the derived truths beneath them. Nothing was accepted on a SUMMARY's
word: the three committed hardware captures were re-parsed independently and **every quantitative
claim in `docs/SKELETON-RESULTS.md` was recomputed from them**. The suites were run in this session.

## Suites run in this session

| Command             | Result                                          | Expected                            |
| ------------------- | ----------------------------------------------- | ----------------------------------- |
| `npm run test:quick` | **26 files, 453 passed \| 1 todo (454)**, 7.5 s | 26 files, 453 passed \| 1 todo ✓    |
| `npm run check`      | **385 FILES 0 ERRORS 0 WARNINGS**               | clean ✓                             |
| `npm run lint`       | **prettier clean + eslint clean**               | clean ✓                             |
| `npm run test:e2e`   | **10 passed (17.9 s)**, both skeleton tests green | 10 passed ✓                       |
| Phase-2 surfaces only | 17 files, **115 passed**                       | —                                   |

The e2e run was permitted: `netstat` showed port 4173 free beforehand, and afterwards no listener and
no `workerd`/`wrangler` process remains (only kernel `TIME_WAIT` sockets). `git status --porcelain`
is empty — nothing in the tree was modified.

The single `todo` is `src/lib/fidelity/firmware-oracle.spec.ts:209`, Phase 3's documented
unobservable-through-the-public-surface case. Not this phase's.

## Goal Achievement

### Observable Truths

| #   | Truth (Success Criteria 1–5, then derived)                                                      | Status     | Evidence                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Bare page connects; picker offers only ZONA's USB identity, never a bootloader; module reported as a ZONA with its firmware version | ✓ VERIFIED | `constants.ts` `ZONA_USB = {0x303a, 0x8123}` is the sole `requestPort` filter; `0x8122` appears nowhere in the tree. All three captures record `usbVendorId 12346 / usbProductId 33059` (= 0x303a / 0x8123), `hwcfg 161`, `moduleType "ZONA"`, `revision "RevH"`, `firmware 1.5.5`, `heartbeatType 1`. `describe()` renders exactly that line. Hardware-confirmed by the user. |
| 2   | The page displays the touch element's existing Setup and Timer strings, fetched from the module   | ✓ VERIFIED | `fetchBoth()` issues one `CONFIG/FETCH` per event under pinned step ids; the page renders both `<pre>` blocks with character counts and `ACTIONLENGTH`. Captures: `fetch-setup`/`fetch-timer` `ok`, `results.setupBefore` 642 chars, `timerBefore` 22 chars (`--[[@cb]]print("tick")`). |
| 3   | Writes and the store are reported complete only on a matching ACKNOWLEDGE, never on a resolved local promise | ✓ VERIFIED | `RequestQueue.request()` resolves **only** from `deliver()` → `matchResponse() === "ok"`; the write promise merely emits bytes. `matchResponse` rejects `HEARTBEAT` first and correlates ACK/NACK on `LASTHEADER` (never a REPORT — offset 5 is `VERSIONMAJOR` there). `queue.spec.ts:100` asserts it by name. Captures: 12 `write-*` and 11 `store` steps, all `ok`, all `attempts: 1`, each with its own latency. |
| 4   | After the run the module is byte-for-byte unchanged; re-fetching returns the original strings     | ✓ VERIFIED | Arm B step order recomputed from the capture: `fetch-setup, fetch-timer → 5×(write-timer, write-setup, restore-page-change) → 10×store → refetch-setup, refetch-timer`. The re-fetch is **downstream of ten flash stores**. `results.byteIdentical: true` in both completed arms, and `setupBefore === setupAfter` / `timerBefore === timerAfter` verified as strings, not lengths. |
| 5   | The run records written answers to the open questions it exists to settle                        | ✓ VERIFIED | `docs/SKELETON-RESULTS.md` answers (a)–(f) under their own headings, each citing a committed capture. Gated structurally by `src/lib/skeleton-results.spec.ts` (7 tests: all six headings present, no TBD, every answer cites a fixture, every cited fixture exists on disk, both desktop and shipped numbers stated, the store-restart and TYPE-255 caveats present, and the `Shipped:` line equal to the shipped constants). |
| 6   | The phase cannot ship on synthetic evidence — a committed fixture declares `source: hardware` and a spec fails without one | ✓ VERIFIED | Gate re-derived under both documented mutations (see "Negative check re-run"). Three captures declare `"source": "hardware"`; the fallback still declares `"synthetic"`. |
| 7   | The shipped timeouts are the measured ones, and document and constant cannot drift apart          | ✓ VERIFIED | `TIMEOUTS = {fetchMs: 300, executeMs: 250, pagestoreMs: 3000}` and `PRE_SEND_DELAY_MS = 0` in `constants.ts`; `docs/SKELETON-RESULTS.md` carries the machine-readable `Shipped: fetchMs=300, executeMs=250, pagestoreMs=3000, preSendDelayMs=0`; `skeleton-results.spec.ts` parses it and asserts equality **both ways**, and asserts `constants.ts` cites the document back. |
| 8   | Nothing writes to the module without an explicit click                                            | ✓ VERIFIED | Every outbound path is an `onclick`: `connect`, `doFetch`, `doWriteBack`, `doStore`, `doRefetch`, `doRestore`, `doBurst`. `onMount` only imports the two surfaces, feature-detects, and reads `getPorts()` — no port is opened. `forbidden-instructions.spec.ts` proves **only `descriptors.ts` calls `encode_packet`**, and the four builders emit only `HEARTBEAT/EXECUTE`, `CONFIG/FETCH`, `CONFIG/EXECUTE`, `PAGESTORE/EXECUTE`. Corroborated on the wire: arm B holds **149 `tx` events against 149 request steps** — every outbound byte in the arm is accounted for by a request. See the qualification below. |
| 9   | The transport is exclusive-port aware and the multi-module refuse-store rule exists                | ✓ VERIFIED | `classifyOpenError` maps `NetworkError` to `port-busy` (or `unplugged` via the feature-detected `SerialPort.connected`), and `failureCopy("port-busy")` names Grid Editor and its tray icon with a six-step recovery — asserted in `transport.spec.ts`. `closeOnHide()` releases the port on `pagehide` so the Editor can have it back. Store refusal exists at three levels: `storeAllowed = otherModules.length === 0`, `storeToFlash()` throws, and the button is `disabled={... || !identity?.storeAllowed}` with the other modules named on screen (`skeleton-others`). `sequence.spec.ts:154` asserts it. |
| 10  | No page change, erase or clear instruction can be constructed anywhere in the shipped source (D-06) | ✓ VERIFIED | `forbidden-instructions.spec.ts` scans every non-spec `.ts` under `src/lib/protocol/` and `src/lib/transport/` for `NVMERASE`, `PAGECLEAR`, `PAGEDISCARD`; forbids `PAGEACTIVE` in `descriptors.ts` even in a comment; asserts `TYPE: 255` present and `TYPE: 254` absent. Needles are assembled from fragments so the spec's own source is clean. |

**Score: 10/10 truths verified.**

### Required Artifacts

`gsd-tools verify artifacts` across all five plans: **19/19 passed**, zero issues.

| Artifact                                            | Levels 1–4                                    | Status     |
| --------------------------------------------------- | --------------------------------------------- | ---------- |
| `src/lib/protocol/descriptors.ts`                   | exists, substantive, sole `encode_packet` caller, exercised by 10 specs | ✓ VERIFIED |
| `src/lib/protocol/framing.ts`                       | `class FrameScanner`, EOT+LF scan, cursor, 8 KB ceiling; replays real chunk boundaries | ✓ VERIFIED |
| `src/lib/protocol/decode.ts`                        | truthiness guard before `decode_packet_classes` | ✓ VERIFIED |
| `src/lib/protocol/match.ts`                         | `ok \| nack \| no`, HEARTBEAT first, LASTHEADER on ACK/NACK only | ✓ VERIFIED |
| `src/lib/protocol/write-guard.ts`                   | D-09: undefined / empty / ≥`CONFIG_MAX` / non-printable, each named | ✓ VERIFIED |
| `src/lib/protocol/constants.ts`, `index.ts`         | package values read not restated; barrel imported by page and transport | ✓ VERIFIED |
| `src/lib/transport/transport.ts`                    | `classifyOpenError` + the six-state CONN-04 copy | ✓ VERIFIED |
| `src/lib/transport/web-serial.ts`                   | 2 Mbaud, 4096-byte buffer, `navigator.serial` **connect and disconnect** listeners (the gap the research flagged in `grid-editor`), `writable.locked` check, `releaseLock` in `finally`, `closeOnHide` | ✓ VERIFIED |
| `src/lib/transport/queue.ts`                        | one outstanding, `performance.now` deadlines, bounded 3 attempts, abort on disconnect, `sendImmediate` that survives `abort()` | ✓ VERIFIED |
| `src/lib/transport/fake.ts`                         | replays a capture, five injected faults; **re-pointed at `zona-hardware.json`** in wave 5 | ✓ VERIFIED |
| `src/lib/transport/sequence.ts`                     | the whole cycle as testable functions; restore in a `finally` | ✓ VERIFIED |
| `src/routes/dev/skeleton/+page.svelte`              | 663 lines, seven controls + degrade panel + two A/B toggles; prerendered to `build/dev/skeleton/index.html`; linked from nowhere | ✓ VERIFIED |
| `e2e/skeleton.e2e.ts`                               | 2 tests, both green in this session | ✓ VERIFIED |
| `src/lib/transport/fixtures/synthetic-zona.json`    | `source: "synthetic"`, genuine `encode_packet` bytes | ✓ VERIFIED |
| `src/lib/transport/fixtures/zona-hardware*.json`    | three arms, `source: "hardware"`, 3,746 / 911 / 230 events | ✓ VERIFIED |
| `src/lib/transport/fixtures/fixtures.spec.ts`       | the provenance gate; 4 tests | ✓ VERIFIED |
| `docs/SKELETON-RUNBOOK.md`                          | 142 lines; every row names an on-screen control; predicts the `CDC TX dropped` line | ✓ VERIFIED |
| `docs/SKELETON-RESULTS.md`                          | 338 lines; six answers, all cited | ✓ VERIFIED |
| `src/lib/skeleton-results.spec.ts`                  | the structural gate; 7 tests | ✓ VERIFIED |

### Key Link Verification

`gsd-tools verify key-links` across all five plans: **13/13 verified.** Independently re-checked by
reading the call sites; the three that matter most:

| From                       | To                         | Via                                                            | Status  |
| -------------------------- | -------------------------- | -------------------------------------------------------------- | ------- |
| `queue.ts`                 | `match.ts`                 | every inbound class offered to the waiter through `matchResponse`; nothing else can resolve a request | ✓ WIRED |
| `+page.svelte`             | `sequence.ts` / `protocol` | dynamic `await import` inside `onMount`, so `requestPort()` is the first statement in the click handler with nothing awaited before it | ✓ WIRED |
| `skeleton-results.spec.ts` | `constants.ts` + the doc   | the `Shipped:` line parsed and asserted equal to `TIMEOUTS` and `PRE_SEND_DELAY_MS` | ✓ WIRED |

### Data-Flow Trace (Level 4)

The one place a walking skeleton can be hollow is a page that renders plausible strings that never
came off a module. Traced end to end:

| Rendered value              | Source variable         | Populated by                                             | Real data? | Status     |
| --------------------------- | ----------------------- | -------------------------------------------------------- | ---------- | ---------- |
| Fetched Setup / Timer `<pre>` | `before`               | `T.fetchBoth(queue, identity)` → `q.request(fetchConfig(...))` → resolves on a decoded `CONFIG/REPORT` `ACTIONSTRING` | ✓ 642 / 22 chars in three captures | ✓ FLOWING |
| `Byte-identical: {…}`       | `byteIdentical`         | string comparison of `before` vs a second live `fetchBoth(..., "refetch")` — not a flag the page sets | ✓ `true` in both completed arms | ✓ FLOWING |
| Status / identity line      | `identity`              | `absorbFrame()` folding real inbound `HEARTBEAT` classes; `activePage` starts `undefined`, never 0 | ✓ page 3 on hardware | ✓ FLOWING |
| `Steps` list                | `steps`                 | `RequestQueue.onStep`, emitted at settle time with measured `latencyMs` | ✓ 200 steps recorded | ✓ FLOWING |
| `previously granted ports`  | `grantedPorts`          | `navigator.serial.getPorts()` on mount, read-only | ✓ reported 1 after a browser restart | ✓ FLOWING |

**D-10 is the load-bearing one and it held on hardware.** `IdentifyState.activePage` starts
`undefined` and only moves on a three-condition rule (a `PAGENUMBER`, **and** a `HEARTBEAT` in the
same decoded frame, **and** no `EVENTTYPE`/`ACTIONLENGTH`). The module was on **page 3**, and the run
holds **124 `CONFIG/REPORT` classes that also carry a page number** — every one of them correctly
excluded. A page hardcoding 0 would have fetched an empty string and reported a successful no-op
having proved nothing.

### Behavioral Spot-Checks

Every number below was recomputed from the committed captures in this session and compared against
`docs/SKELETON-RESULTS.md`. This is the check that distinguishes a written-up run from a real one.

| Claim in the results document                                     | Recomputed                                              | Status |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| 200 steps across three captures, `attempts: 1` on all             | 200 steps, all `ok`/`sent`, all `attempts: 1`            | ✓ PASS |
| 1,550 of 1,550 frames decoded                                     | 1,241 + 249 + 60 = 1,550 frames, 1,550 `ok`              | ✓ PASS |
| 1,086 `HEARTBEAT/EXECUTE`, exactly one `PAGEACTIVE` each, all page 3 | 1,086 / 1,086 / `{3}`; other arms 214 and 39, page 3    | ✓ PASS |
| Heartbeats `t` 163841.8 → 435320.4, 271.5 s, 4.00/s, gaps 132.3–367.7 ms | identical to one decimal                          | ✓ PASS |
| Host really silent in arm B: 149 `tx` events vs 149 request steps  | 149 and 149                                             | ✓ PASS |
| Five `restore-page-change` at `t` 272436.8 / 273522.0 / 274173.6 / 275332.9 / 278211.0 | identical                          | ✓ PASS |
| Five `DEBUGTEXT` `tick`, ten `nvm store success`, five `LEDPREVIEW/REPORT` | 5 / 10 / 5                                     | ✓ PASS |
| 124 `CONFIG/REPORT` classes carrying their own page numbers        | 124                                                     | ✓ PASS |
| `CONFIG/FETCH` n=124, 12.9 / 14.0 / 16.4 / 19.0 ms                 | identical                                               | ✓ PASS |
| `CONFIG/EXECUTE` 14.8–21.6 over 12; `PAGESTORE` 13.6–38.7 over 11  | identical                                               | ✓ PASS |
| Pace-0 burst 20 steps, 2.8 / 3.1 / 3.4, span 65.7 ms (`t` 28652.5→28718.2) | identical                                       | ✓ PASS |
| Arm B last 20, span 305.3 ms (`t` 418882.4→419187.7); all 120: 13.1 / 14.0 / 16.4 | identical                                | ✓ PASS |
| Every BRC header `SX 0, SY 0`; `otherModules: []` in all three     | one address only across 1,550 frames                    | ✓ PASS |
| `results.byteIdentical` true, strings equal not merely lengths     | `setupBefore === setupAfter`, `timerBefore === timerAfter` in both completed arms | ✓ PASS |
| Setup 642 characters vs the package default 641                    | 642                                                     | ✓ PASS |
| Store is behind its own click and the re-fetch is after it         | arm B: 10 `store` steps precede `refetch-*`             | ✓ PASS |
| Write order is Timer then Setup, every cycle                       | `write-timer` before `write-setup` in all six cycles    | ✓ PASS |

One figure of nineteen did not reproduce exactly — see Anti-Patterns, and it is cosmetic.

#### Negative check re-run (the fixture gate)

The gate's own predicate was re-derived against mutated copies of the fixture set, in memory, with
nothing written to the tree:

- `"source"` flipped to `"synthetic"` in **all three** hardware arms → the set of captures declaring
  `hardware` is **empty** → `fixtures.spec.ts` test 1's `expect(...).not.toHaveLength(0)` **fails**.
- The three arms **deleted** → both the `source` filter and the filename-selected `HARDWARE` list are
  empty → tests **1 through 4 all fail** (2–4 each open with `expect(HARDWARE.length).toBeGreaterThan(0)`).

The gate is real in both directions. It also refuses a capture that merely *claims* provenance:
schema, `> 20` events and the exact protocol pin `1.20260825.1135` are asserted on every arm that
declares `hardware`, and the synthetic fallback is asserted to still declare `synthetic`. Selecting
tests 2–4 by **filename** rather than by `source` is a deliberate, documented choice so the mutation
produces one meaningful red instead of four.

### Requirements Coverage

| Requirement | Source plans   | Description                                                                 | Status      | Evidence |
| ----------- | -------------- | --------------------------------------------------------------------------- | ----------- | -------- |
| FOUND-01    | 02-01 … 02-05  | A bare browser page connects to a ZONA over Web Serial, fetches the touch element's existing Setup and Timer configs, writes the identical strings back, and stores — every step acknowledged by the module, the whole run a provable no-op on the hardware | ✓ SATISFIED | Truths 1–5 above, evidenced by three committed hardware captures and confirmed on real hardware by the project owner (ZONA RevH, fw 1.5.5, Chrome 152, 2026-09-03). Marked `[x]` in REQUIREMENTS.md and `Complete` in the coverage table — **honestly earned**. |

**Orphan check:** `REQUIREMENTS.md` maps exactly one requirement to Phase 2 (`FOUND-01 | Phase 2 |
Complete`), and all five plans declare `requirements: [FOUND-01]`. No orphaned requirements.

Mechanisms for later requirements were built and tested here but correctly left `Pending` and owned by
their own phases: SAFE-07 (ACK-only completion), SAFE-09 (bounded retry), CONN-01 (capability
detection), CONN-04 (port-conflict copy), CONN-07 (USB filter). None were prematurely ticked.

### Anti-Patterns Found

Zero `TODO` / `FIXME` / `XXX` / `HACK` / `PLACEHOLDER` / "coming soon" / "not yet implemented" across
every file this phase touched. The three `=> {}` / `return []` hits are legitimate (a swallowed
`reader.cancel()`, a fire-and-forget `close()` on `pagehide`, and a synthetic-generator branch).

| File / doc                  | Item                                                                                                        | Severity | Impact |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------ |
| `docs/SKELETON-RESULTS.md`  | The "two clocks" paragraph quotes arm B's last probe as `13.4 / 13.9 / 16.3` per step. Recomputed with the code's own p50 convention (`Math.floor(n/2)`, upper median) that set is `13.4 / 14.2 / 16.3`; 13.9 is the lower median. Every other figure in the document, including the whole of table (b) and table (c), reproduces exactly. | ℹ️ Info | None. It is one illustrative sentence about clock skew, not a shipped constant. `PRE_SEND_DELAY_MS` and all three timeouts are gated against the document by test. |
| `.planning/…/02-VALIDATION.md` | Frontmatter still `status: planned`; every row of the Per-Task Verification Map still reads `⬜ pending`, although all 13 predicted counts (including `26 files / 453 passed \| 1 todo`) match reality exactly. | ℹ️ Info | Bookkeeping only. The map's own rule — "if a per-file count differs, update it here" — was never triggered, because nothing differed. |
| `.planning/ROADMAP.md:25`   | The Phase 2 progress row is `- [ ]` with no `(completed …)` stamp, while all five of its plans are `[x]` and FOUND-01 reads `Complete`. | ℹ️ Info | Expected: the orchestrator ticks the row after verification. Noted so it is not forgotten. |
| `src/lib/transport/fixtures/*.json` | Each arm holds one firmware `DEBUGTEXT` reading `CDC TX dropped: <n>` (588 / 70 / 89), arriving **before the first heartbeat and long before the first request**. Not mentioned in `SKELETON-RESULTS.md`. | ℹ️ Info | None, and not an omission: `docs/SKELETON-RUNBOOK.md` predicts the line by name and explains it ("the module reporting what it had queued while nothing was listening; it is not a fault and not a frame of yours going missing"). It contradicts no claim — every one of the 1,550 frames after it decoded. |

### One qualification on "nothing writes without a click"

Recorded because it is the phase's own safety invariant and the distinction should be on the record
rather than discovered in Phase 7.

With the `send the host heartbeat while connected` toggle on (its default), the **connect** click
starts a 300 ms keeper that sends `HEARTBEAT/EXECUTE TYPE 255` for as long as the port is open — an
outbound frame not preceded by its own click. It is not a config write, and it cannot become one:
`forbidden-instructions.spec.ts` proves `descriptors.ts` is the only module that encodes a packet and
that the four builders emit nothing but `HEARTBEAT`, `CONFIG` and `PAGESTORE`; `TYPE 254` (which would
*disable* page changing) is asserted absent. TYPE 255 is the frame that **restores** the module's
ability to change page after a config write, which is the one thing that must not depend on the user
remembering to click. Arm B — the arm with the keeper off — proves the strict form of the invariant on
the wire: **149 outbound events, 149 request steps, no unsolicited traffic at all** beyond the five
mandatory restores that each follow a write the user clicked for.

No config write and no flash store happens without an explicit click, on either arm. The page states
this to the operator ("Nothing is written without a click. Connect is one click, write back is a
second, store to flash is a third."), and `Store to flash` is additionally gated on
`writesAcknowledged` — it cannot be reached before a write has been acknowledged.

### Caveats correctly recorded rather than hidden

These are not gaps. They are places where the phase declined to claim more than it measured, and each
is written into the document that the phase that inherits it will read.

1. **"Provable no-op" is a claim about the stored bytes, not the running script.** A successful
   `PAGESTORE` reloads the page from flash and restarts the Lua VM. The wire corroborates it — five
   `DEBUGTEXT` `tick` lines, one per write-back, the factory Timer's own `print` firing on restart.
   With the factory config (dim, static) the restart is invisible; the runbook says explicitly that
   criterion 4's "behaves as it did before" is proven by the re-fetched strings, not by eye. Phase 7's
   `KEEP ON DEVICE` has to be designed knowing this.
2. **Runbook row 0 — the port-conflict message (D-04 / CONN-04) — was not exercised.** The operator
   had no Grid Editor running and chose not to start one. Stated as neither a pass nor a failure. It
   is not one of FOUND-01's five criteria; Phase 6 owns the failure vocabulary. The copy itself is
   unit-tested (`transport.spec.ts`), just never against a real conflict.
3. **D-12's other-module path was never seen against real traffic.** All 1,550 frames carried
   `SX 0, SY 0`. The refuse-store rule is proven only against `FakeTransport`. Section (e) says so in
   those words: "it is evidence that it never had to."
4. **No failure path has ever been seen from real hardware.** No timeout, no negative acknowledgement,
   no refused frame, no unplug mid-write. `FakeTransport`'s five injected faults are the only evidence
   any of them work.
5. **0 ms pacing was never tested against back-to-back 690–957 byte `CONFIG/EXECUTE` frames.** The
   burst probe is 49 bytes outbound, so it never pressured the module's 2,048-byte receive ring — the
   exact mechanism the deleted 10 ms sleep would have defended. `PRE_SEND_DELAY_MS` therefore stays a
   named constant, and section (b) names restoring it as Phase 7's first experiment if a config write
   ever times out with no NACK.
6. **Chrome 152 only, one module, one cable, one host.** Firefox 151+, the deployed HTTPS origin's
   port grant, and every non-Chromium path remain untested.

### Human Verification Required

None outstanding. Criteria 1–4 are Web Serial behaviours with no CDP domain and no fake-device hook,
and they were performed by the project owner on a real ZONA RevH (firmware 1.5.5, Chrome 152,
2026-09-03). That run is not taken on trust here: it left three committed captures, and every
quantitative claim derived from them was independently recomputed in this session and matched.

### Gaps Summary

**None blocking the goal.**

The phase set out to prove that a bare page can complete the whole write cycle against a real ZONA
with a write that changes nothing, and it did — with the receipts committed. What raises this above a
green suite is that the evidence is falsifiable in three directions at once: the provenance gate fails
without a hardware capture (re-derived here under both mutations), the shipped timeouts are bound by
test to the document that measured them (so a constant and a prose number cannot drift apart
unnoticed), and the results document's own numbers reproduce from the raw captures to the decimal.

The strongest signal is D-10. The module sat on **page 3**, and the run recorded 124 `CONFIG/REPORT`
frames that also carry page numbers. A skeleton that had assumed page 0 — or that had used a looser
rule for reading the active page — would have fetched an empty string, written nothing back, and
reported a successful no-op. The design decision that prevented that was made before the hardware run
and vindicated by it.

The document is also unusually honest about what it did *not* establish: the store restarts the
module's script, row 0 was never run, the multi-module path never met real traffic, no failure path has
ever been seen from hardware, and 0 ms pacing was never tested at the payload size that would actually
stress it. Each of those is written down with the phase that owns it, which is worth more to Phase 6
and Phase 7 than a cleaner-looking result would have been.

Four informational items are recorded above: one 0.3 ms median-convention mismatch in an illustrative
sentence, a stale Status column in `02-VALIDATION.md`, the un-ticked ROADMAP progress row for Phase 2
(which verification is the step that closes), and an undocumented-but-runbook-predicted `CDC TX
dropped` line in each capture. None affects a shipped value, a test, or a claim.

---

_Verified: 2026-09-03T23:11:38Z_
_Verifier: Claude (gsd-verifier)_
