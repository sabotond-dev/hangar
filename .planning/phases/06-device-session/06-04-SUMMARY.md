---
phase: 06-device-session
plan: 04
subsystem: device
tags: [session, web-serial, replug, watchdog, forget, never-writes, fold, CONN-06, CONN-08, SAFE-01]

# Dependency graph
requires:
  - "src/lib/device/session.svelte.ts (06-03) — the machine up to identification, with #attachListeners as a named empty seat, #adopt, #teardown, #onTransportClosed and the injected now"
  - "src/lib/device/session.spec.ts (06-03) — fakePort, fakeSerial with listeners kept in a Map by type, opening(), waitFor()"
  - "src/lib/transport/ports.ts (06-03) — isZonaPort, the connect-event identity test, and portIsAttached"
  - "src/lib/transport/sequence.ts (02-02) — absorbFrame, identify, newIdentifyState, and the IdentifyState accumulator"
  - "src/lib/protocol/constants.ts:59 — MODULE_GONE_MS, unused since Phase 2"
  - "src/lib/device/try-on.spec.ts test 3 — the two-halves never-writes proof this reproduces"
  - "src/lib/tune/model.spec.ts — the fake-timers precedent"
  - "06-RESEARCH.md § The Replug Identity Trap, Pattern 7, Pattern 8, Pitfalls 3 and 4"
provides:
  - "The navigator-level connect and disconnect listener pair, attached in start() for the life of the page and never removed"
  - "Replug adoption: connect matched by getInfo() through isZonaPort, the arriving object REPLACING the stored one; disconnect matched by identity"
  - "The continuous fold: the session's own pump over a fresh FrameScanner and IdentifyState after identifyOnly, republishing only when a rendered field changes, otherModules sorted by sx then sy"
  - "The liveness watchdog: a self-rescheduling setTimeout on MODULE_GONE_MS, read from the already-awaited module, firing only on the missed disconnect and publishing no field"
  - "forget(): teardown, then port.forget(), then every reference dropped; feature-detected by the in test; lands in forgotten"
  - "absorbFrame(classes, state, at = now()) — an optional clock, every existing caller unchanged"
  - "session.spec.ts at fifteen gates, including both halves of the never-writes proof with setInterval as a ninth needle"
affects:
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 4/14"
  - "src/lib/ui/DeviceSlot.svelte and DeviceDetails.svelte (06-10) — render canForget, identity.activePage and identity.otherModules, all of which are now live rather than snapshots"

tech-stack:
  added: []
  patterns:
    - "A browser event pair whose two halves need DIFFERENT identity tests gets one comment per half saying which test and why: disconnect fires at the object held, connect fires at a new object, so one compares by identity and the other by getInfo()"
    - "A value needed after a lazy module has loaded is read from that module at the point it is in hand and stored on the instance, never through a new static specifier and never through a type alias (which is erased)"
    - "A published $state.raw snapshot is replaced only when a rendered field changes; the private accumulator keeps the fields nothing renders (lastSeen), and the watchdog reads the private copy"
    - "A test that must own one timer fakes that one timer only (toFake: [setTimeout, clearTimeout]) and polls through setImmediate, so promise chains, dynamic imports and Date keep running"
    - "expect.soft on both halves of a two-halves proof, so a planted violation is reported by both in one run rather than the first aborting the second"
    - "A negative-check runner that applies a mutation, runs the spec and restores the original bytes in a finally, then asserts the restore was byte-identical"

key-files:
  created:
    - ".planning/phases/06-device-session/06-04-SUMMARY.md"
  modified:
    - "src/lib/device/session.svelte.ts"
    - "src/lib/device/session.spec.ts"
    - "src/lib/transport/sequence.ts"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The watchdog reads its lastSeen from a private instance field the fold updates, not from the published identity: the republish rule deliberately lets the snapshot's lastSeen go out of date, so a watchdog reading the snapshot would never fire. The private copy is initialised to now() when connected is reached, so the fold and the watchdog agree about time on the injected clock"
  - "The watchdog landed in task 1 with the fold rather than in task 2 as planned: the fold writes #lastSeen and stores #goneMs, and ESLint's no-unused-private-class-members fails a commit in which nothing reads them, while task 1's acceptance requires lint to exit 0. Task 2 kept forget() and the spec"
  - "Silence alone is not a state. A module silent past MODULE_GONE_MS on a port the OS still reports attached, or on a port that cannot say (Chrome 89-129, no connected property), leaves the session connected; test 12 (c) asserts both, and dropping the portIsAttached half was observed tearing a silent-but-attached session down"
  - "A disconnect that arrives while the session holds a dead port in a FAILURE state keeps the phase and drops only the reference: a visitor reading the port-busy list is told to unplug at step 2, and the six steps vanishing at that moment would be the copy contradicting itself. Only a detected port that leaves returns to idle, as the plan says"
  - "The connect handler also ignores an arrival while #busy: an open is in flight or the chooser is about to decide, and replacing #port under #openAdopted would desync the port it opened from the port it holds"
  - "#openAdopted checks that it still holds the transport identifyOnly listened on before publishing its outcome: an unplug or a disconnect() during identification would otherwise be overwritten by a silent or a connected that is about a transport the session no longer has"
  - "No lint rule bans setInterval anywhere in the tree, so the never-writes source scan carries it as a ninth needle; the negative check went red on the scan, not on lint"

requirements-completed: []
requirements-contributed: [CONN-06, CONN-08, SAFE-01]

# Metrics
duration: 24min
completed: 2026-09-05
---

# Phase 6 Plan 04: The listener pair, the replug adoption, the watchdog, forget(), zero writes Summary

**The session now survives everything a cable can do to it. `connect` and `disconnect` are on `navigator.serial`, not the port, and the pair is asymmetric on purpose: `disconnect` compares object identity because the browser fires it at the object the session holds, while `connect` identifies the arrival by `getInfo()` through `isZonaPort` and ADOPTS it, because after a replug Chromium mints a fresh token and the event fires at a different `SerialPort`. After `identifyOnly` the session registers its own pump over a fresh scanner and accumulator, so the page number on screen is the page the module is on and a rig's other modules fill in as they announce themselves, sorted by `sx` then `sy`, with the snapshot replaced only when a rendered field changed. `MODULE_GONE_MS` — unused since Phase 2 — is read from the module `#openAdopted` already awaited and drives a self-rescheduling `setTimeout` that fires on exactly one condition, the missed disconnect: silent past three heartbeats AND the OS reporting the port detached; silence alone leaves the session `connected`, deliberately, and test 12 says so. `forget()` closes before it revokes. And zero writes is now a test twice over: a full visit against recording transports, and a comment-stripped scan of the file's own source, both halves observed red on a planted write in one run.**

## The five-name carry-forward block

Measured by **06-01** on a clean tree at `746cfa2`. Carried forward verbatim, unchanged by this plan.

| Name         | Value                      | Measured                                                                             |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                 |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                 |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                        |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **61 (measured by 06-01)** | the same run. Rolls at 06-06, 06-07 and 06-13                                          |

**`PREV_E2E` does not move here.** No route and no component changed; nothing renders the session yet, so `test:e2e` was not run.

### Observed totals: previous SUMMARY plus this plan's delta

06-03 left the tree at **68 files / 708 tests**. This plan's delta is **+0 files / +7 tests**, so quick stands at **68 / 715**, which is `BASE_FILES + 2` and `BASE_TESTS + 24`.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 715
  check-counts: observed 68 files, 715 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npx vitest run --project server src/lib/device/ src/lib/transport/
  Test Files  10 passed (10)
       Tests  75 passed (75)

npx vitest run --project server src/lib/transport/sequence.spec.ts src/lib/device/session.spec.ts   # after task 1, spec unedited
  Test Files  2 passed (2)
       Tests  17 passed (17)

npx vitest run --project server src/lib/device/session.spec.ts   # after task 2
  Test Files  1 passed (1)
       Tests  15 passed (15)

npm run check 2>&1 | grep -Ei "0 errors"
  1788576424820 COMPLETED 523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` stays at **523 files**: no file was added. `src/lib/device/` plus `src/lib/transport/` moves 68 → **75** tests, the seven here.

## Task 1 — the listener pair, the replug adoption, the fold, and the watchdog (commit `6a709b1`)

`session.svelte.ts` 553 → 782 lines at this commit; `sequence.ts` +6 / −2.

### The listener pair, and the asymmetry in a comment

`#attachListeners()` attaches both handlers to the injected serial surface and never removes them. The header gained a paragraph, *THE REPLUG IDENTITY TRAP, WHICH SHAPES BOTH LISTENERS*, with the three Chromium citations (`serial_service.cc:317-325` returning `nullopt` from `GetPersistentIdentifier` for every non-Bluetooth port; `ToBlinkType` passing the enumerator's fresh token through; `serial.cc:441-452` caching `SerialPort` objects by that token), and the sentence that the permission is keyed by VID, PID and the per-chip serial number in `SerialChooserContext` — never by the token — which is why `getPorts()` returns the replugged module at once and the replug offer needs no picker.

**The `connect` handler contains no `===` against the stored port**, quoted from the committed file:

```ts
  #onSerialConnect = (ev: Event): void => {
    const port = ev.target as SerialPort | null;
    if (!port || !isZonaPort(port)) return;
    if (this.#transport || this.#busy) return;
    this.#adopt(port);
    this.#clearFailure();
    this.phase = "detected";
  };
```

`#adopt` REPLACES `#port` (its comment: "the old object is dead the moment the module left; keeping it produces a NetworkError at the next open, at best"). The `disconnect` handler's first line is `if (ev.target !== this.#port) return;` with the comment that this comparison IS safe and why. Three outcomes follow: a live session → `#unplugged()` (teardown, identity null, `unplugged-while-connected`, in the same turn); a `detected` port → `idle`, with the reference dropped; any other phase holding a dead port keeps its phase and drops only the reference (see deviation 3).

### The continuous fold

`#startFold(transport)` runs after `identified`: a fresh `modules.P.FrameScanner()`, a fresh `modules.T.newIdentifyState(this.#now())`, and one `transport.onData` registration that owns the stream from then on. Each chunk is scanned, decoded (a failed decode is skipped, as `identifyOnly` skips it), folded with `absorbFrame(classes, fold, this.#now())`, and `identify(fold)` is republished through `#publish`. The pump refuses to fold if `this.#transport !== transport || this.#fold !== fold`, so a callback a closed transport still holds can never fold into a later connection.

**The republish rule, field by field**, quoted:

```ts
function renderedFieldsChanged(
  current: Identity,
  next: Identity,
  nextOthers: ModuleSeen[],
): boolean {
  if (current.activePage !== next.activePage) return true;
  const a = current.zona.firmware;
  const b = next.zona.firmware;
  if (a.major !== b.major || a.minor !== b.minor || a.patch !== b.patch) {
    return true;
  }
  if (current.otherModules.length !== nextOthers.length) return true;
  return current.otherModules.some(
    (m, i) => moduleKey(m) !== moduleKey(nextOthers[i]),
  );
}
```

`moduleKey` is `${sx},${sy}:${hwcfg}:${moduleType ?? ""}`. `#publish` sorts `otherModules` by `sx` then `sy` before comparing, and the initial publish from `identifyOnly`'s outcome goes through the same path, so the first snapshot is sorted too.

### `absorbFrame` gains an optional clock

```ts
export function absorbFrame(
  classes: DecodedClass[],
  state: IdentifyState,
  at: number = now(),
): void {
  const seenAt = at;
```

with a three-line reason in its doc comment. `sequence.spec.ts` is untouched and green (9 passed); `identifyOnly` in `try-on.ts` is untouched and keeps the default.

### The watchdog

Landed here rather than in task 2 — deviation 1 explains why. `MODULE_GONE_MS` is read from `modules.P` beside `IDENTIFY_WINDOW_MS` and stored in `#goneMs`, with the plan's reason written next to the field: the constant's module imports the protocol package at module scope, a static specifier would put 131,101 bytes on the first paint of `/`, a `typeof import` alias is erased and this is a value, and the watchdog is only armed once `connected` is reached, strictly after that module resolved. Quoted:

```ts
  #armWatchdog(): void {
    this.#disarm();
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      if (!this.#transport) return;
      const port = this.#port;
      const gone = this.#now() - this.#lastSeen > this.#goneMs;
      if (gone && port && portIsAttached(port) === false) {
        this.#unplugged();
        return;
      }
      this.#armWatchdog();
    }, this.#goneMs);
  }
```

`#lastSeen` is a private field the fold updates from `identity.zona.lastSeen` and that `#openAdopted` initialises to `this.#now()` when `connected` is reached (decision 1: the published snapshot's `lastSeen` is deliberately allowed to go out of date, so the watchdog must not read it). `#disarm()` runs at the top of `#teardown()` and inside `#onTransportClosed`, so every exit path clears the timer. The comment above the method carries the plan's paragraph verbatim in substance — one case, the missed disconnect; both halves load-bearing; `undefined` is not `false`; no field of its own; silence alone is not a state — and the sentence that a timer chain is what a hidden tab throttles gracefully while an interval is what the motion contract bans.

## Task 2 — `forget()` and the seven remaining gates (commit `d72d46b`)

`session.svelte.ts` 782 → 847 lines; `session.spec.ts` 589 → 1,098 lines.

### `forget()`, quoted

```ts
  async forget(): Promise<void> {
    const port = this.#port;
    if (!port || !("forget" in port)) return;
    await this.#teardown();
    await port.forget();
    this.#port = undefined;
    this.identity = null;
    this.#clearFailure();
    this.canForget = false;
    this.phase = "forgotten";
  }
```

The doc comment says the WICG steps have no close step, that `@types` declares `forget()` non-optional so the `in` test is the only real guard, and that `forgotten` is S7. `canForget` was already set from `"forget" in port` at adoption (06-03) and is what decides whether the control renders.

### The seven gates, in the plan's order

9. **an unplug of a live session is immediate, and a detected port that leaves returns to idle** — `connected` from the hardware capture; `disconnect` fired at the held port with no `await` before the asserts: `unplugged-while-connected`, `identity` null, the S5 sentence from `failureFor`, `canForget` still true, zero writes, then the port closed once and the transport closed. A `disconnect` for a foreign port leaves a `detected` session `detected`. A `detected` port unplugged before it was opened → `idle`, `failureFor` null, `canForget` false, `open` 0, and the next click asks the chooser (`requestPort` 1) rather than reopening the dead object.
10. **the replug adopts the new port object, and one click reconnects with no chooser** — unplug, then `connect` fired with a DIFFERENT `fakePort` (asserted `not.toBe` the first); `detected`, `failureFor` null, the replugged port not opened by the event; `connect()` → `connected`, the replugged port opened once, the dead one still at one open, `requestPort` **0**, two transports made and both at zero writes.
11. **ignores an arriving port that is not a ZONA, and any arrival while a transport is live** — the bootloader identity (`0x8122`) arriving on an `idle` session moves nothing and a click still asks the chooser; a second ZONA arriving on a `connected` session moves nothing and the published identity is the same reference; the second port's `disconnect` is not ours; the ORIGINAL port's `disconnect` still lands in S5, which proves the reference was not replaced.
12. **the watchdog fires only on the missed disconnect, and silence alone is not a state** — below.
13. **the identity keeps folding** — after `connected` on page 2: a heartbeat naming page 4 publishes page 4 as a new snapshot; `chained(2, BU16)` then `chained(1, EN16)` come back as `[[1, 0, "EN16"], [2, 0, "BU16"]]` with `storeAllowed` false; a further heartbeat and a further EN16 beat that change only `lastSeen` leave the SAME object published (`toBe`).
14. **forget() closes first, then revokes** — `port.order` equals `["open", "close", "forget"]` and `indexOf("close") < indexOf("forget")`; the transport is closed; `forgotten`; `identity` null; `canForget` false; `failureFor` null; zero writes. On a port with `hasForget: false`: `canForget` false, `forget()` moves nothing, `close` 0, `forget` 0.
15. **writes nothing across a whole visit, and cannot** — offer, connect, identify, unplug, replug, connect, forget against fresh `FakeTransport.fromCapture` per open (two made, asserted); every transport's `writes` at length 0 through `expect.soft`; then the comment-stripped source of `session.svelte.ts` (asserted longer than 1,000 characters) contains none of nine needles, each assembled with `[a, b].join("")`: `.write(`, `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `fetchConfig`, `storeToFlash`, `writeBack`, and `setInterval`.

### The watchdog's three measured outcomes under fake timers

`vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })` — the one timer the watchdog uses and nothing else, so `setImmediate` (which `waitFor` now yields through), `Date` and promise chains keep running. The clock is the injected `now` from `movableClock()`; `performance.now()` is never faked or read.

| Case | Set-up | Advance | Observed |
| --- | --- | --- | --- |
| (a) missed disconnect | silent since connect, clock at `MODULE_GONE_MS + 1`, `connected` set `false` | `MODULE_GONE_MS + 1` | `unplugged-while-connected`, identity null, zero writes, port closed once |
| (b) heartbeating | a `zonaHeartbeat()` pushed every 250 ms of clock for six beats, `connected` set `false` each beat | 6 × 250 = 1,500 ms | still `connected` — the heartbeat half is load-bearing on its own |
| (c) silent, attached | silent, clock at `4 × MODULE_GONE_MS`, `connected: true`; and again with NO `connected` property | `2 × MODULE_GONE_MS + 1` | still `connected` on both; identity intact; `close` 0 |

(c) is the assertion that stops a later reader introducing a staleness flag: **silence alone is not a state.** Nothing in `src/lib/device/` contains the word (scan below).

### The negative checks, every one observed red and restored byte-identical

Each was applied by a scratchpad runner that reads the file, asserts the needle occurs exactly once, writes the mutation, runs the spec, restores the original bytes in a `finally`, and prints whether the restored file equals the original. All six printed `restored byte-identical: true`.

**1. The replug identity comparison** — `if (!port || !isZonaPort(port)) return;` replaced by `if (ev.target !== this.#port) return;` in the `connect` handler. Test 10, verbatim:

```
FAIL ... > the replug adopts the new port object, and one click reconnects with no chooser
AssertionError: one click away again: expected 'unplugged-while-connected' to be 'detected' // Object.is equality
      Tests  2 failed | 13 passed (15)
```

(the second failure is test 15's replug leg, which never reached `forget`.) Restored: 15 passed.

**2. `setInterval` in the watchdog** — `setTimeout(` → `setInterval(`. No lint rule exists (deferred-items item 3), so the source scan is the catch:

```
FAIL ... > writes nothing across a whole visit, and cannot
AssertionError: session.svelte.ts reaches setInterval: expected true to be false
```

(test 12 (a) also went red, because an interval the callback treats as a one-shot never fires the unplug path.)

**3. `forget()` before `#teardown()`** — the two awaits swapped. Test 14:

```
FAIL ... > forget() closes first, then revokes; without forget() it is a no-op and the control never renders
AssertionError: expected [ 'open', 'forget', 'close' ] to deeply equal [ 'open', 'close', 'forget' ]
```

**4. Republish on every fold** — the `renderedFieldsChanged` guard line deleted. Test 13:

```
FAIL ... > the identity keeps folding: a live page number, a sorted rig, and no republish on lastSeen alone
AssertionError: lastSeen alone replaced the snapshot: expected { Object (zona, activePage, ...) } to be { Object (zona, activePage, ...) } // Object.is equality
      Tests  1 failed | 14 passed (15)
```

**5. A planted write** — `void transport.write(new Uint8Array());` inserted after `this.#transport = transport;` in `#openAdopted`. Nine tests failed, and **both halves of test 15 were reported in the same run**, which is what `expect.soft` was for:

```
FAIL ... > writes nothing across a whole visit, and cannot
AssertionError: the session wrote to the module: expected [ Uint8Array[] ] to have a length of +0 but got 1
    1072|         .soft((t as FakeTransport).writes, "the session wrote to the m…
FAIL ... > writes nothing across a whole visit, and cannot
AssertionError: session.svelte.ts reaches .write(: expected true to be false // Object.is equality
    1094|         .soft(source.includes(needle), `session.svelte.ts reaches ${ne…
      Tests  9 failed | 6 passed (15)
```

The plan asked for the two halves to be observed red separately because a Vitest assertion aborts its test at the first failure; with both halves soft, one run shows both, which is the stronger observation. Tests 7, 8, 9, 10, 11, 12, 13 and 14 each went red on their own `writes` assertion too.

**6. The `portIsAttached(...) === false` half dropped** (06-VALIDATION's row for test 12) — `if (gone && port && portIsAttached(port) === false)` → `if (gone && port)`:

```
FAIL ... > the watchdog fires only on the missed disconnect, and silence alone is not a state
AssertionError: silence alone tore the session down: expected 'unplugged-while-connected' to be 'connected' // Object.is equality
      Tests  1 failed | 14 passed (15)
```

### The scans, quoted

Comment-stripped, over the committed `session.svelte.ts`:

```
file: src/lib/device/session.svelte.ts
raw length: 35669; stripped length: 12915
from " specifiers (4): ["./session-copy","$lib/protocol/usb","$lib/transport/ports","$lib/transport/transport"]
import( occurrences: 9
"await import(" occurrences: 3
bare "import " occurrences: 4
"setInterval" occurrences: 0
".write(" occurrences: 0
"MODULE_GONE_MS" occurrences: 1
"isZonaPort" occurrences: 2
"addEventListener" occurrences: 3
"userAgent" occurrences: 0
"Chromium" occurrences: 0
"stale" occurrences: 0
```

**Exactly four static specifiers, the same four as 06-03; this plan added none.** The nine `import(` are six erased type aliases (the three `typeof import(...)` plus `Identity`, `IdentifyState` and `ModuleSeen` from `$lib/transport`) and the same three `await import(...)` in the memoised loader. `isZonaPort` is the import and its one call. `addEventListener` is the `SerialLike` interface and the two attachments.

Comment-stripped, over every `.ts` in `src/lib/device/`:

```
  session-copy.spec.ts: setInterval 0, stale 0
  session-copy.ts: setInterval 0, stale 0
  session.spec.ts: setInterval 0, stale 0
  session.svelte.ts: setInterval 0, stale 0
  try-on.spec.ts: setInterval 0, stale 0
  try-on.ts: setInterval 0, stale 0
```

No interval anywhere; no staleness field anywhere. The session publishes no tenth state.

### The spec's changed helpers

- `fakePort` records `order: ("open" | "close" | "forget")[]` beside the counts.
- `waitFor` yields through `setImmediate` instead of `setTimeout(…, 2)`, so it keeps polling while test 12 has `setTimeout` faked. Its comment says so and says no interval appears in the file.
- `pushable(initial)` is a `GridTransport` the TEST feeds: `initial` is delivered synchronously on the first `onData` registration (as `FakeTransport`'s instant replay is, so `identifyOnly` resolves on its first poll), and `push(frame)` delivers to whichever callback registered LAST — the fold's.
- `openingEach(make, made)` serves a fresh transport per open and collects them, because a replug opens a second one and a closed `FakeTransport` has already consumed its replay.
- `connectGranted(port, openTransport, now)` is the road every 06-04 gate starts on: granted, `detected`, one click, `connected`, asserted.
- `movableClock()`, `strip()` (copied from `try-on.spec.ts`), `sessionSource()`, `fire(serial, type, port)`, `notZonaPort()`, `zonaHeartbeat(page)`.
- Test 7 now ends with `await s.disconnect()` and asserts `idle` and one close: a connected session owns a watchdog timer, and no instance outlives its test.

## Deviations from Plan

### 1. [Rule 3 - Blocking] The watchdog landed in task 1, not task 2

**Found during:** task 1's first `npm run lint`.

**Issue:** the fold writes `#lastSeen` and `#openAdopted` stores `#goneMs`, and with the watchdog still unwritten nothing read either. ESLint's `no-unused-private-class-members` reports both (and `#scanner`, which the fold did not need — the pump guards on `#fold`'s identity — and which was removed). Task 1's acceptance requires lint to exit 0.

**Fix:** `#armWatchdog` / `#disarm` and the `#timer` field were written in task 1 beside the fold that feeds them. Task 2 kept `forget()` and the spec. Every task 2 acceptance criterion about the watchdog is met by the committed text of task 1.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `6a709b1`.

### 2. [Rule 1 - Bug] The watchdog reads a private `#lastSeen`, not `identity.zona.lastSeen`

**Found during:** task 1, writing the fold's republish rule.

**Issue:** the plan's interface block reads `this.identity?.zona.lastSeen` in the watchdog and, four paragraphs later, forbids republishing the identity on `lastSeen` alone. Both cannot hold: a snapshot that is deliberately not replaced on a heartbeat carries the `lastSeen` of the last RENDERED change, so a watchdog reading it would fire on a module that is heartbeating happily on an unchanged page (the exact opposite of case (b)). There is a second, smaller mismatch: `identifyOnly` stamps `lastSeen` with `performance.now()`, not the injected clock.

**Fix:** `#lastSeen` is a private instance field, initialised to `this.#now()` when `connected` is reached and updated by the fold from every `identify()` result (whose `lastSeen` is now on the injected clock through `absorbFrame`'s `at`). The field's comment says why it is not read off the snapshot.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `6a709b1`.

### 3. [Rule 2 - Missing critical functionality] A dead port in a failure state keeps its phase

**Found during:** task 1, writing the `disconnect` handler's non-live branch.

**Issue:** the plan's handler is `this.phase = wasLive ? "unplugged-while-connected" : "idle"`. `port-busy` keeps its port adopted (06-03), and its recovery list is six steps whose second is *Unplug the ZONA*. With the plan's line, the moment the visitor does step 2 the whole list vanishes and the slot reads `NO ZONA`. `not-zona` and `silent` (*Plug in a ZONA*, *Unplug the ZONA and plug it back in*) have the same shape.

**Fix:** three outcomes instead of two. Live → `unplugged-while-connected` (as planned). `detected` → `idle` with the reference dropped (as planned, and test 9 asserts it). Any other phase → the phase is kept and only `#port` and `canForget` are dropped, so the visitor keeps reading, the next click goes through the chooser rather than at a dead object, and the replug's `connect` event adopts and moves to `detected` from there. A `disconnect` arriving after `#onTransportClosed` already flipped to S5 is ignored outright, so the net and the listener cannot disagree whichever fires first.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `6a709b1`.

### 4. [Rule 2 - Missing critical functionality] Two guards around an in-flight open

**Found during:** task 1, tracing `#openAdopted` against the new events.

**Issue:** (a) a `connect` event during `#openAdopted` — between the chooser closing and the transport being stored — would replace `#port` under a method that already captured the old one. (b) An unplug or a `disconnect()` during `identifying` tears the transport down, but `identifyOnly` keeps polling to its window and then returns `silent`, and the plan's code would publish that over the state the listener already set.

**Fix:** the `connect` handler also returns while `#busy`; `#openAdopted` returns after `identifyOnly` if `this.#transport !== transport`. Both commented.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `6a709b1`.

### 5. [Rule 2 - Missing critical functionality] `setInterval` is a needle in the source scan

**Found during:** task 2, before the negative checks.

**Issue:** the plan's negative check says "watch the lint rule or the source scan catch it". There is no ESLint rule against `setInterval` in `eslint.config.js`, and the plan's eight needles do not include it, so an interval would have been caught by nothing.

**Fix:** a ninth needle, assembled from fragments like the others. The negative check went red on it (above). Logged as deferred-items item 3 for a possible `no-restricted-globals` rule.

**Files modified:** `src/lib/device/session.spec.ts`. **Commit:** `d72d46b`.

### 6. [Rule 3 - Blocking] `waitFor` yields through `setImmediate`

**Found during:** task 2, designing test 12.

**Issue:** `waitFor` polled through `setTimeout(resolve, 2)`. Under `vi.useFakeTimers()` that promise never resolves, and every 06-04 gate reaches `connected` through `waitFor` before it can fire anything.

**Fix:** the yield is `setImmediate`, and test 12 fakes only `setTimeout` and `clearTimeout` (`toFake`), so `setImmediate`, `Date` and dynamic imports keep running. The header comment records both halves of that choice.

**Files modified:** `src/lib/device/session.spec.ts`. **Commit:** `d72d46b`.

### 7. [Scope] `expect.soft` on both halves of test 15

The plan asks for the two halves to be observed red separately because a hard assertion aborts the test. Both halves are `expect.soft`, so the planted write was reported by both in ONE run, and the summary quotes both lines. This is stronger than what was asked, not weaker.

### 8. [Scope] Test 7 gained a `disconnect()`

A `connected` session now arms a real 750 ms timer chain; a test that leaves one connected leaks a timer past its own end. Test 7 (06-03's hardware-capture gate) ends with `await s.disconnect()` and two more assertions. Every 06-04 gate that ends `connected` does the same.

### 9. [Process] Formatting scoped to authored files; Phase 7 never staged

As in 06-03: every formatting pass was `npx prettier --write` on the files this plan authored, `npm run lint` ran tree-wide at every gate and passed, and every commit used `git commit -m … --only -- <paths>`. Seven `07-*-PLAN.md` files appeared untracked under `.planning/phases/07-install-flow/` during the run and were not staged, formatted or read.

## Requirements

**`requirements-contributed: [CONN-06, CONN-08, SAFE-01]`** — contributed, not completed, on 06-03's convention; nothing renders the session yet and the hardware rows are the runbook's.

- **CONN-06** gains its unplug/replug half: the immediate S5 on `disconnect`, the replug adopting a NEW object on `connect`, and one click reconnecting with `requestPort` at zero. The browser proof is 06-07; the hardware proof is runbook row B.
- **CONN-08** gains a page number that is true rather than a snapshot, and D-08's rig tail that fills in late and comes back sorted. The header that renders both is 06-10.
- **SAFE-01** gains its first test: zero bytes across a whole visit, and a file that cannot write. Phase 7 owns the requirement.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs.
- `PREV_FILES` / `PREV_TESTS` for plan 06-05 are **68 / 715**.
- The session's public surface is complete for the phase: `phase`, `identity`, `failureKind`, `failureRaw`, `permissionDeclined`, `refusedModule`, `canForget`; `start(env)`, `connect()`, `disconnect()`, `forget()`, `failureFor(label)`. `identity.activePage` and `identity.otherModules` are live; `otherModules` arrives sorted, so `moduleTail` and `multiModuleLine` sort nothing.
- `SessionEnv.now` is the one clock for `identifyOnly`, the fold and the watchdog; a test that needs the watchdog fakes `setTimeout` alone and drives `now` by hand.
- The spec's helpers for a browser-shaped fake: `fire()`, `pushable()`, `openingEach()`, `connectGranted()`, `fakePort().order`.
- The four-specifier scan is unchanged and is what 06-05's chunk guard enforces.

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/device/session.svelte.ts` — FOUND (847 lines)
- `src/lib/device/session.spec.ts` — FOUND (1,098 lines)
- `src/lib/transport/sequence.ts` — FOUND
- `.planning/phases/06-device-session/06-04-SUMMARY.md` — FOUND

Commits claimed, verified in `git log`:

- `6a709b1` feat(06-04): the listener pair on navigator.serial, the replug adoption, the continuous fold and the liveness watchdog — FOUND
- `d72d46b` feat(06-04): forget() in the only safe order, and the session spec from eight gates to fifteen — FOUND
