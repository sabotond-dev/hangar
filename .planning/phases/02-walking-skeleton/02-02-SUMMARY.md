---
phase: 02-walking-skeleton
plan: 02
subsystem: transport
tags:
  [web-serial, request-queue, fault-injection, capture, fixtures, vitest, SAFE-07, SAFE-09]

# Dependency graph
requires:
  - phase: 02-walking-skeleton
    provides: "plan 01's pure protocol layer - encodeRequest, FrameScanner, decodeFrame, matchResponse, TIMEOUTS/RETRY_ATTEMPTS/BAUD_RATE/READ_BUFFER_SIZE/ZONA_USB"
  - phase: 01-scaffold-licence-and-pin
    provides: "the grid-protocol pin, the Vitest server/sweep projects, and the prettier/eslint/svelte-check gates"
provides:
  - "src/lib/transport/ - 7 modules, 5 specs, one committed capture, 31 tests, no browser and no hardware"
  - "GridTransport - the one interface the queue, the recorder and both transports speak"
  - "classifyOpenError + failureCopy - five named open failures with CONN-04's recovery asserted in order"
  - "WebSerialTransport + openZonaPort - 2 Mbaud, a 4096-byte read buffer, owned close ordering, navigator.serial connect and disconnect listeners"
  - "CaptureRecorder - D-07's four event kinds and the pinned STEP_IDS vocabulary"
  - "fixtures/synthetic.ts - inbound frame builders, including the hand-spliced two-class heartbeat"
  - "fixtures/synthetic-zona.json - a 13-frame capture of genuine encoder bytes, marked source synthetic"
  - "FakeTransport - capture replay plus the five injected faults"
  - "RequestQueue - one outstanding request, deadlines from now(), bounded retry, NACK never retried, sendImmediate"
affects:
  [02-03 skeleton page, 02-04 hardware run, 02-05 results, 06 device session, 07 install flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The frame pump lives OUTSIDE the queue: transport.onData -> FrameScanner -> decodeFrame -> queue.deliver, and transport.onClose -> queue.abort. The page owns the wiring; the queue owns the waiting."
    - "A generated fixture regenerates at MODULE scope and throws, so a normal run reports zero skipped tests"
    - "Fault injection is matched against the decoded RESPONSE classes, not the request, so a fault names the frame it removes"
    - "The request id is read back off the wire in tests (decode the recorded write, take brc_parameters.ID) rather than handed to the fake"

key-files:
  created:
    - src/lib/transport/transport.ts
    - src/lib/transport/transport.spec.ts
    - src/lib/transport/web-serial.ts
    - src/lib/transport/capture.ts
    - src/lib/transport/capture.spec.ts
    - src/lib/transport/fake.ts
    - src/lib/transport/fake.spec.ts
    - src/lib/transport/fixtures/synthetic.ts
    - src/lib/transport/fixtures/synthetic.spec.ts
    - src/lib/transport/fixtures/synthetic-zona.json
    - src/lib/transport/queue.ts
    - src/lib/transport/queue.spec.ts
    - src/lib/transport/index.ts
    - scripts/make-synthetic-capture.mjs
  modified: []

key-decisions:
  - "A NACK's rejection message is deliberately kept OUT of the vendored transient-write pattern; the plan's test 8 asked for the opposite and it contradicts the plan's own must-have that a NACK is never retried"
  - "The frame pump is external to RequestQueue, as the plan's own doc comment implies (deliver is 'called by the frame pump'), so the queue never registers transport.onData and the page keeps the recorder in the loop"
  - "fixtures/synthetic.spec.ts regenerates at module scope and throws, with no guard test, deliberately diverging from golden-frames.spec.ts so the phase's aggregate counts stay exact"
  - "CaptureOptions gained a capturedAt override so fixture regeneration is byte-idempotent"
  - "FakeTransport emits live responses SYNCHRONOUSLY inside write(); every timing assertion is then driven by an explicit delay fault rather than by scheduler luck"

patterns-established:
  - "TDD per task: spec committed red, implementation committed green, then a prescribed mutation observed red and restored with git checkout against an already-staged file"

requirements-completed: [FOUND-01]

# Metrics
duration: 22 min
completed: 2026-09-03
---

# Phase 2 Plan 2: The Transport Layer Summary

**Five named ways a port can fail to open with CONN-04's recovery asserted in order, a real Web Serial transport that owns its close ordering, a D-07 recorder whose schema is also the fake's input, a committed 13-frame capture of genuine encoder bytes marked `"synthetic"`, and a request queue in which "acknowledged" means a frame arrived and matched, a dropped ACK costs exactly three writes, and a disconnect ends the wait at once - 31 node tests, no browser, no port.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-03T21:03:30Z
- **Completed:** 2026-09-03T21:25:41Z
- **Tasks:** 3 (6 commits: test -> feat per task)
- **Files created:** 14

## Accomplishments

- `classifyOpenError` tells an unplug from a held port using the same `NetworkError` plus the port's own `connected` flag, and `failureCopy("port-busy").steps` is asserted **position by position** - quit, unplug, wait, replug, reload, connect - so CONN-04's order is a test, not a paragraph. No copy anywhere names a browser engine; the spec greps `transport.ts` for it as well as walking all six states.
- `WebSerialTransport` opens at `BAUD_RATE` with `bufferSize: READ_BUFFER_SIZE`, keeps a `readerDone` promise so `close()` is cancel -> await -> release **once** -> close (the desktop double-releases and swallows the throw), and attaches `connect` **and** `disconnect` to `navigator.serial` as well as to the port - the gap STACK Decision 3 names. It carries a header saying plainly that it has no unit test and why.
- The hand-spliced two-class heartbeat works: `encode_packet` emits one class block, so the page report is cut STX-through-ETX out of a second encode, inserted before the first message's EOT, `LEN` rewritten at `Number(offset)`/`Number(length)` and the checksum recomputed. Measured: a 44-byte heartbeat plus an 8-byte class block gives a 52-byte frame with `LEN 50`, and `decodeFrame` returns **exactly two classes**.
- The committed capture is a full A-arm: 8 heartbeats at 250 ms, both fetches, both write-backs in Timer-then-Setup order, the store, and a closing `HEARTBEAT/EXECUTE TYPE 255` step with `outcome: "sent"`. 13 rx chunks, 13 frame events, every one `ok`, 26 KB, Prettier-clean, `"source": "synthetic"`, and the word `hardware` appears zero times in it.
- `FakeTransport` replays only `rx`/`chunk` events and answers live writes through `zonaResponder`, reading the request id **off the wire** from the outbound frame's own BRC header - so "the acknowledgement echoes the request id" is a round trip, not an arrangement. A write really does land: a re-fetch after a write returns what was written.
- `RequestQueue` holds all five invariants with none of the desktop's machinery. A promise chain replaces the module-global waiter and its `sleep(1)` poll; deadlines re-check `now()` on fire and re-arm for the remainder; retry is bounded at `RETRY_ATTEMPTS` and the test asserts the **absence of a fourth write** after another full backoff period; a NACK rejects after one write; a heartbeat carrying the page report is offered to a pending waiter and rejected by both classes; a disconnect rejects in under a second against a 5 second deadline, with a `process.on("unhandledRejection")` listener installed for the duration of the test asserting nothing leaked.
- `sendImmediate` jumps the queue, is droppable rather than queueable while a write is in flight, and still runs after `abort()` - which is what makes the restore heartbeat sendable after any error.

## Task Commits

1. **Task 2-02-01: interface, open-failure taxonomy, Web Serial transport** - `7f3283d` (test), `cafda85` (feat)
2. **Task 2-02-02: capture recorder, synthetic fixture, fake transport** - `4cb31a4` (test), `d364496` (feat)
3. **Task 2-02-03: RequestQueue and the barrel** - `2bf4196` (test), `1f0bcbb` (feat)

## Files Created

| File | What it holds |
|---|---|
| `src/lib/transport/transport.ts` | `GridTransport`, `webSerialAvailable`, `classifyOpenError`, `failureCopy` |
| `src/lib/transport/web-serial.ts` | `WebSerialTransport`, `openZonaPort`, `grantedZonaPorts`, `portIsAttached`, `closeOnHide` |
| `src/lib/transport/capture.ts` | `CAPTURE_SCHEMA`, `CaptureEvent`, `STEP_IDS`, `CaptureStep`, `CaptureRecorder` |
| `src/lib/transport/fake.ts` | `Fault`, `FakeTransport` (replay + live + five faults) |
| `src/lib/transport/fixtures/synthetic.ts` | `heartbeatFrame`, `configReportFrame`, `configAckFrame`, `configNackFrame`, `pagestoreAckFrame`, `zonaResponder` |
| `src/lib/transport/fixtures/synthetic-zona.json` | The committed 13-frame capture |
| `src/lib/transport/queue.ts` | `RequestQueue`, `NackError`, `AbortedError` |
| `src/lib/transport/index.ts` | The barrel (5 re-exports) |
| `scripts/make-synthetic-capture.mjs` | The regeneration wrapper |
| 5 `*.spec.ts` | 6 / 6 / 8 / 3 / 8 = 31 tests |

## The heartbeat splice, in detail

`grid.encode_packet` returns `{ id, serial }` with **one** class block and no terminator. A USB-attached
module's heartbeat carries two (`grid_transport.c:199-203`), so `heartbeatFrame({ type: 1, ... })`:

1. Encodes the heartbeat and the page-report descriptor separately.
2. Takes the heartbeat message without its checksum, `serial.slice(0, -2)`.
3. Cuts the page report's block from its `STX` through its `ETX` inclusive and inserts it immediately
   before the heartbeat's `EOT`.
4. Rewrites `SX`/`SY` to `sx + 127`, `sy + 127` - because `encode_packet` forces the source address to
   zero on the wire and the decoder subtracts 127, so without this an "inbound" frame decodes as
   `SX -127` and every `fetchConfig` filter (`SX: 0, SY: 0`) misses.
5. Rewrites `LEN` at `Number(getProperty("BRC").LEN.offset)` width `Number(...length)` - both are
   **strings** on the pinned package; uncoerced, `offset + length` is `"24"` and the write loop runs 22
   characters across the header. The value is `message.length`, because `decode_packet_frame` requires
   `array.length - 2 === LEN`.
6. XORs every byte and appends the two lowercase hex characters.

Measured on the pinned package: heartbeat serial 44 bytes, page-report class block 8 bytes, spliced
frame 52 bytes, `LEN 50`, `decodeFrame` -> `ok: true` with `["HEARTBEAT", "PAGEACTIVE"]`. The `ok: true`
assertion is the load-bearing one: a wrong `LEN` or a stale checksum makes the decoder return
`undefined` rather than a wrong answer, so it is the only thing that catches either.

## Negative Checks (observed red, then restored)

Every mutation was applied to a file already `git add`ed, and restored with `git checkout --`;
`git diff --quiet` confirmed a byte-exact tree afterwards in each case.

1. **Task 1 - the recovery order.** Swapped `"Plug the ZONA back in"` and `"Reload this page"` in
   `failureCopy("port-busy").steps`.
   Red: `src/lib/transport/transport.spec.ts > open failure taxonomy (CONN-02, CONN-04, CONN-05) > the recovery steps are exactly quit, unplug, wait, replug, reload, connect`
   - `AssertionError: step 4 is the "Plug" step: expected 'Reload this page' to contain 'Plug'` at
   `transport.spec.ts:65:63`. Run: `Tests 1 failed | 5 passed (6)`.

2. **Task 2 check 1 - a dropped rx chunk.** Removed one `dir: "rx", kind: "chunk"` event from the
   committed JSON. Observed: **rx chunks 13 -> 12; recorded frame events still 13.**
   Red: `fixtures/synthetic.spec.ts > the committed synthetic capture > every recorded chunk replays into a frame that decodes`
   - `AssertionError: every recorded frame is reproduced from the chunks: expected [ ...(12) ] to have a length of 13 but got 12`
   at `synthetic.spec.ts:299:7`. Run: `Tests 1 failed | 2 passed (3)`.

3. **Task 2 check 2 - the closing step.** Removed the `restore-page-change` step from the committed
   JSON. Observed: steps before `identify, fetch-setup, fetch-timer, write-timer, write-setup, store,
   restore-page-change`; after `identify, fetch-setup, fetch-timer, write-timer, write-setup, store`.
   Red: `fixtures/synthetic.spec.ts > the committed synthetic capture > the capture's closing step is the restore heartbeat`
   - `AssertionError: every run ends by re-enabling page changes: expected 'store' to be 'restore-page-change'`
   at `synthetic.spec.ts:340:67`. Run: `Tests 1 failed | 2 passed (3)`. This is the same assertion plan
   05's `fixtures.spec.ts` will make against the real capture, so it has now been watched failing.

4. **Task 3 - the retry bound.** Changed `opts.attempts ?? RETRY_ATTEMPTS` to
   `opts.attempts ?? RETRY_ATTEMPTS + 1`.
   Red: `queue.spec.ts > request queue > a dropped acknowledgement produces exactly three writes and then a named failure`
   - `AssertionError: exactly three attempts: expected [ ...(4) ] to have a length of 3 but got 4` at
   `queue.spec.ts:194:56`. **Write counts: 3 expected, 4 observed.** Run: `Tests 1 failed | 7 passed (8)`.

## Verification

| Check | Result |
|---|---|
| `transport.spec.ts` | `Tests 6 passed (6)` |
| `capture.spec.ts` | `Tests 6 passed (6)` |
| `fake.spec.ts` | `Tests 8 passed (8)` |
| `fixtures/synthetic.spec.ts` | `Tests 3 passed (3)`, zero skipped |
| `queue.spec.ts` | `Tests 8 passed (8)` |
| `npm run test:quick` | `Test Files 23 passed (23)`, `Tests 430 passed \| 1 todo (431)` - 399 + 31 |
| `npm run test:sweep` | `Tests 9 passed (9)` - unchanged |
| `npm run check` | `379 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `forbidden-instructions.spec.ts` | `Tests 5 passed (5)` after each task |
| `prettier --check synthetic-zona.json` | clean |
| `grep -c "Chromium" transport.ts` | 0 |
| `grep -c "Grid Editor" transport.ts` | 3 |
| `grep -cE "bufferSize:\s*READ_BUFFER_SIZE" web-serial.ts` | 1 |
| `grep -cE "baudRate:\s*BAUD_RATE" web-serial.ts` | 1 |
| `grep -c 'navigator.serial.addEventListener' web-serial.ts` | 2 (`"connect"` 2, `"disconnect"` 4) |
| `grep -c "isSecureContext" transport.ts` | 3 |
| `grep -ciE "userAgent\|navigator\.platform"` transport.ts / web-serial.ts | 0 / 0 |
| `grep -c "hardware" synthetic-zona.json` | 0 |
| rx chunk count in the fixture | 13 (> 10) |
| `grep -c "skipIf" fixtures/synthetic.spec.ts` | 0 |
| `grep -lr "encode_packet" src/lib/transport --include=*.ts \| grep -v spec` | `src/lib/transport/fixtures/synthetic.ts` (1 file) |
| `grep -cE "while\s*\(.*\)\s*\{?\s*await" queue.ts` | 0 |
| `grep -c "performance.now" / "RETRY_ATTEMPTS" / "sendImmediate"` queue.ts | 1 / 3 / 2 |
| `grep -c "src/vendor" / "_pad"` queue.ts | 0 / 0 |
| `grep -c "export \*" index.ts` | 5 |
| tree state | clean |

## Decisions Made

- **The frame pump is outside `RequestQueue`.** The plan's own doc comment for `deliver` says "called by
  the frame pump", so the queue never registers `transport.onData`. The page (plan 03) wires
  `onData -> FrameScanner -> decodeFrame -> queue.deliver` and `onClose -> queue.abort`, which is what
  keeps the `CaptureRecorder` in the loop for every chunk and every frame - `D-07` requires recording
  frames the queue never sees, including refused ones. `queue.spec.ts` builds that exact pump in six
  lines, so plan 03 has a working reference rather than a description.
- **`FakeTransport` responds synchronously inside `write()`.** Every timing-sensitive assertion is then
  driven by an explicit `delay` fault rather than by microtask ordering. It also makes the disconnect
  test genuine: the close callback fires *during* the write, before the queue reaches its `await`,
  which is exactly the race a real unplug creates - and it is why `arm()` attaches a no-op `catch` to
  the waiter's promise the moment it is created.
- **`CaptureOptions` gained `capturedAt`.** Without it the recorder stamps `new Date().toISOString()`
  and two consecutive regenerations of the fixture differ by one line, which makes reviewing the diff
  of the other 32 events pointless. The page still passes nothing and gets a real timestamp.
- **`zonaResponder` honours `activePage`.** A fetch of a non-active page returns an empty
  `ACTIONSTRING`, which is the documented firmware behaviour (`grid_ui.c:464-501`) and exactly the shape
  plan 01's `canWriteBack` refuses on. Nothing exercises it yet; it is there so plan 03 cannot
  accidentally prove D-09 against a fake that never produces the failure D-09 exists for.
- **The BRC field helpers read `getProperty("BRC")` and `Number()` both members.** No offset or width is
  restated in HANGAR source, consistent with plan 01's rule and the same spec that enforces it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's queue test 8 contradicted the plan's own NACK invariant**

- **Found during:** Task 3
- **Issue:** The plan specifies test 8 as "assert [`TRANSIENT_WRITE`] matches the timeout, the abort and
  the NACK messages", and specifies the NACK message as
  `${class_name} was refused by the module (negative acknowledgement)`. That string matches none of
  `interrupted|timeout|timed out|busy|no response`, so the test as written fails against the message as
  written. More importantly, making it match would be wrong: `TRANSIENT_WRITE` is the predicate Phase 7's
  `withRetry` uses to decide what to retry, and firmware NACKs a `CONFIG/EXECUTE` only for deterministic
  reasons - an `ACTIONLENGTH` that does not land on the ETX, a page that is not active, an element that
  does not exist (`grid_decode.c:1260-1313`). A busy store is *dropped silently* and shows up as a
  timeout, not a NACK. Classifying a refusal as transient would make Phase 7 retry a mistake, directly
  contradicting this plan's own must-have "a negative acknowledgement rejects immediately and is never
  retried".
- **Fix:** Kept the regex restated verbatim with its provenance comment, kept the three messages exactly
  as the plan specifies them, and asserted that the timeout and the abort **match** while the NACK
  **deliberately does not**, with the firmware citation in the test. Renamed the test to "every
  rejection carries the wording Phase 7's retry policy reads", which is what it now proves. Still
  exactly 8 tests.
- **Files modified:** `src/lib/transport/queue.spec.ts`
- **Verification:** `Tests 8 passed (8)`; the test also asserts all three rejections are real `Error`
  instances.
- **Committed in:** `2bf4196` / `1f0bcbb`

**2. [Rule 3 - Blocking] `CaptureRecorder` needed a `capturedAt` override for idempotent regeneration**

- **Found during:** Task 2
- **Issue:** The plan's constructor is `(run, { source, now? })` and the schema requires a `capturedAt`.
  Stamping `new Date().toISOString()` makes every regeneration of `synthetic-zona.json` differ, so
  "review the diff" - the whole point of the throw-after-regenerate pattern - becomes noise.
- **Fix:** Added an optional `capturedAt` to `CaptureOptions`, used only by the fixture generator. The
  page passes `{ source: "hardware" }` and gets a real timestamp.
- **Files modified:** `src/lib/transport/capture.ts`
- **Verification:** two consecutive regenerations produce a byte-identical file.
- **Committed in:** `d364496`

**3. [Rule 3 - Blocking] `capture.spec.ts` and `queue.spec.ts` needed narrowing helpers for svelte-check**

- **Found during:** Tasks 2 and 3
- **Issue:** `expect(event.kind).toBe("frame")` does not narrow a discriminated union for the type
  checker (7 errors), and `promise.catch((e: Error) => e)` widens to `Error | DecodedClass` (4 errors).
  Vitest does not type-check, so both specs were green while `npm run check` was red.
- **Fix:** `frameEvent()` in `capture.spec.ts` throws if the event is not a frame - an assertion in its
  own right, not a cast. `rejectionOf()` + `messageOf()` in `queue.spec.ts` keep the rejection reason
  `unknown`, so `expect(err).toBeInstanceOf(Error)` still means something.
- **Files modified:** `src/lib/transport/capture.spec.ts`, `src/lib/transport/queue.spec.ts`
- **Verification:** `379 FILES 0 ERRORS 0 WARNINGS`; test counts unchanged at 6 and 8.
- **Committed in:** `d364496` / `1f0bcbb`

### Deliberate Deviations

**4. [Deliberate] `fixtures/synthetic.spec.ts` regenerates at module scope and throws, with no guard test**

The plan prescribes this and it is worth restating so nobody "fixes" it back.
`src/lib/fidelity/golden-frames.spec.ts` regenerates at module scope **and** carries a guard test
(`it("refuses to run in regeneration mode")`) that fails when `UPDATE_GOLDEN` is set. That guard is a
real test in the totals. `synthetic.spec.ts` deliberately omits it and throws from module scope
instead, because a guarded variant would need a `skipIf` to stay honest and a `skipped` count would
shift **every** aggregate total stated in plans 02 through 05 and in `02-VALIDATION.md`, all of which
are written with no skip allowance. The safety property is preserved exactly: setting `UPDATE_SYNTHETIC`
rewrites the fixture, normalises it with Prettier, and then fails the run, so a regeneration can never
be reported as a pass. `scripts/make-synthetic-capture.mjs` translates that expected exit code 1 into a
readable instruction, and refuses (exit 1) if the fixture was *not* rewritten - so a genuine failure is
still a failure.

**5. [Deliberate] Test 2 of `queue.spec.ts` observes the "one outstanding request" window with a delay fault**

The research table describes this test as "none; enqueue two requests at once". With no fault and a
synchronous fake, the first request settles inside a microtask and there is no window in which to
observe the second write being held - the assertion would be a race. A 40 ms `delay` on the
`CONFIG/REPORT` creates a deterministic window: at 20 ms exactly one write has happened, and both have
after both promises settle. The invariant asserted is unchanged.

**6. [Note, not a deviation] The `npm run check` criterion's exact text**

Three acceptance criteria say `npm run check 2>&1 | grep -E "0 errors"` matches. `svelte-check` on this
project prints `COMPLETED 379 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` - uppercase - so the
criterion matches only case-insensitively. The substantive property (zero errors, zero warnings) was
verified after every task and is recorded above. Plan 01's summary records the same output format, so
this is a wording carry-over rather than a new discrepancy.

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking) + 3 recorded-deliberate
**Impact on plan:** No file, module, count or acceptance criterion changed. Every per-spec count
(6 / 6 / 8 / 3 / 8 = 31) and the aggregate (23 files, 430 passed | 1 todo) is exactly as planned. The
one behavioural change is that a NACK is not advertised to Phase 7 as retryable, which is what the
plan's own invariants require.

## Issues Encountered

- `decode_packet_frame`'s failure logging is `console.log` and cannot be suppressed, so `fake.spec.ts`
  (the corrupt-checksum test) and `synthetic.spec.ts` print `Checksum mismatch` / `Frame error` noise
  for their deliberately broken inputs. Expected, and already flagged in plan 01: plan 03's Playwright
  console assertion must filter to `type === "error"`.
- `spawnSync(cmd, argvArray, { shell: true })` emits Node's `DEP0190` warning on every run. The
  regeneration wrapper passes one command string instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 can import everything through `$lib/transport` and needs to supply exactly two wires: the
  frame pump (`onData -> FrameScanner -> decodeFrame -> queue.deliver`, recording chunks and frames into
  the `CaptureRecorder` on the way) and `onClose -> queue.abort`. `queue.spec.ts`'s `pump()` helper is
  the reference implementation.
- The plan-03 page must call `openZonaPort()` as the **first** statement in its click handler and load
  `$lib/protocol` and `$lib/transport` in `onMount`, because transient activation expires rather than
  being consumed.
- `STEP_IDS` is pinned, so plan 05's `fixtures.spec.ts` can be written now: the assertions it needs -
  every `steps[].id` is a member, the last is `restore-page-change` with `outcome: "sent"` - are already
  green against the synthetic capture and have both been watched failing.
- **FOUND-01 stays `Pending`.** Nothing here has touched hardware; plan 05 marks it after the run.
- `web-serial.ts` is the one file in this plan with no test coverage at all, by construction. Everything
  it does that a machine can check offline (the failure taxonomy, the copy) is in `transport.ts`; the
  rest - the read loop, the close ordering, the two `navigator.serial` listeners - is first exercised by
  a human with a ZONA in plan 04.

## Self-Check: PASSED

All 14 created files verified present on disk; all 6 task commits verified in `git log`.

---

*Phase: 02-walking-skeleton*
*Completed: 2026-09-03*
