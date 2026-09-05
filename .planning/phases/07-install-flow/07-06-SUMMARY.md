---
phase: 07-install-flow
plan: 06
subsystem: device
tags: [install-store, snapshot, RequestQueue, onClass, writeBoth, restorePageChange, generation, tee, fake-timers, SAFE-01, SAFE-03, SAFE-04, SAFE-07]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-05-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 72 / 754, sweep `3 13`, svelte-check 538; ConfigStrings | undefined as the config input, stringsOrRefuse as the decision shape"
  - "07-04-SUMMARY.md - the session's seams: the `transport` write view, onClass, onConnection (incl. a 'closed' with no 'connected' before it), announce, writeLock"
  - "07-03-SUMMARY.md - snapshot.ts (readSnapshot, persistIfAbsent -> written | kept | unavailable, rememberLast, lastModuleId, hasSnapshotFor) and install-copy.ts (every sentence, zero imports)"
  - "07-02-SUMMARY.md - writeBoth (Timer then Setup), targetOf, fetchModuleKey, restorePageChange, zonaResponder's currentpage refusal and empty-string fetch of a non-active page"
  - "07-01-SUMMARY.md - fetchSerialNumber, moduleKeyOf, the fetch-serial step id"
  - "07-CONTEXT.md D-03 (snapshot present and non-empty before any write control enables), D-04 amended (the serial key; a session-only snapshot when unanswered), D-06 (ACK-only), D-09 (the wire order and the restore), D-11 (every write attributable to a click), D-13, D-16, D-17"
  - "07-RESEARCH.md Pattern 3 (one writer), Pattern 4 (the record keyed twice, never overwritten), Pattern 6 (the machine), Code Examples 1 and 2, Pitfalls 2, 4, 5, 9 and 11, Anti-Patterns (classify by instanceof, never by message text)"
  - "07-UI-SPEC.md - I0..I13 as the store's phases; I9 cause 4 as `snapshot-failed`; the live-region table"
  - "src/lib/transport/queue.ts (request id per attempt, waiter armed before the write, RETRY_ATTEMPTS 3, backoff 120 * (attempt + 1)); fake.ts; sequence.ts; fixtures/synthetic.ts; src/lib/device/session.svelte.ts and session.spec.ts (fakePort, pushable, the runes-in-node recipe); src/lib/protocol/constants.ts (executeMs 250, fetchMs 300, pagestoreMs 3000)"
provides:
  - "src/lib/device/install.svelte.ts - InstallStore (exported class) and the `install` singleton: the fourteen phases; start(env) idempotent and synchronous, reading lastModuleId / hasSnapshotFor into rememberedModule; one RequestQueue per connection built at 'connected' over session.transport and fed from session.onClass, aborted / unsubscribed / dropped at 'closed' with every step guarded on existence; #snapshot in the gated order (fetch-serial degrading to session-only, fetchBoth on the reported page, canWriteBack, in memory, readSnapshot so an existing original wins, persistIfAbsent, rememberLast, then ready and LIVE_SNAPSHOT_SAVED); observeConfig and the armed recompute; tryOnDevice with one refusal guard (measuring, not-writable, no-session, over-budget at CONFIG_MAX read from the awaited protocol module) and the snapshot retry from snapshot-failed; putBack; retrySnapshot; #ramLeg (writeLock, writeBoth, the generation guard, #classify by instanceof, restorePageChange in a finally); steps, the last action's capture steps"
  - "src/lib/device/install.spec.ts 8 - the tee over FakeTransport, the lockstep clock, connected(), and eight gates: the snapshot in order before ready; an unanswered serial degrading; an empty fetch as snapshot-failed with nothing persisted and the retry; zero writes without a click and TRY ON DEVICE's exact three frames; PUT BACK's three frames and the RAM back to what it was; an existing record winning with its entry untouched; undefined and 909 characters never reaching the wire or the queue; the file's shape with test 15's needles over the session again"
affects:
  - "07-07 adds to install.svelte.ts: keepOnDevice and the store legs, the partial classification from `steps`, the slow line (#armSlow / #disarmSlow), the pre-send escalation, the bounds, and `sleep` in InstallEnv beside its re-fetch rounds; install.spec.ts 8 -> 18, reusing connected(), tee(), until(), drive() and the faults the tee keeps"
  - "07-08 widens the chunk-guard allow-list before the layout names the store; 07-09 observes the walk go red on `$lib/transport/sequence` in install.svelte.ts"
  - "07-10 binds TryOnDevice's config to install.observeConfig / install.tryOnDevice and retires the never-writes literals; 07-11 reads writeLock and rememberedModule"
  - ".planning/phases/07-install-flow/deferred-items.md - item 7 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 6/13"

tech-stack:
  added: []
  patterns:
    - "A second runes store beside a first, borrowing named seams (a bound write view, a class fan-out, a connection event, a voice, a lock) and never a private: the first store's structural never-writes gate stays green unedited, and the second's own gate counts its static specifiers"
    - "One queue per connection, keyed to a generation bumped on every 'connected' and 'closed': an action captures the generation at its start; a stale result is discarded; an AbortedError is classified whatever the generation says, because the event that bumped it is the event that rejected the waiter"
    - "A fake with no rx injection is teed rather than replaced: the tee delegates four methods, keeps the one callback, forwards the fake's data into it and exposes push() into the same callback - so scripted replies, pushed frames and the fake's faults all survive"
    - "A queue's deadline clock is injected and stepped in lockstep with fake timers: advance the clock, then the timers, in small steps, yielding a macrotask between - so a 300 ms deadline fires as a timeout rather than re-arming for ever, and a 1.3 s retry ladder runs in tens of milliseconds"
    - "A negative check whose first red assertion names a symptom (a phase that moved) rather than the failure (a write) is tightened until the write count is the first assertion, so the failure reads as what it is"

key-files:
  created:
    - "src/lib/device/install.svelte.ts"
    - "src/lib/device/install.spec.ts"
    - ".planning/phases/07-install-flow/07-06-SUMMARY.md"
  modified:
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "An AbortedError is classified as `lost` BEFORE the generation check in #ramLeg's catch, not after it as the plan's interfaces sketch had it: the 'closed' that bumps the generation is the same event whose abort() rejects the waiter, so a catch that returned on a stale generation first could never land `lost` and the phase would be left at `writing`. The 'closed' branch leaves the phase alone while #inFlight is true, exactly so this catch can name it"
  - "The `sleep` member of InstallEnv is deferred to 07-07 rather than declared unread: ESLint's recommended `no-unused-private-class-members` flags a private field that is written and never read, and the first thing in this file that sleeps is 07-07's re-fetch rounds. A comment in InstallEnv says so; the store takes `now`, which the queue reads"
  - "`steps` is a plain public array (not a rune), replaced with a fresh array at the start of every action and pushed to from the queue's onStep: the spec reads it for the step-id order and for 'the queue was not touched' (same array identity after three refusals), and 07-07 reads it for a landed Timer. Declared as an addition to the interfaces block, which named the onStep and not the field"
  - "The record's timestamp is `new Date().toISOString()` under a named `svelte/prefer-svelte-reactivity` disable with its reason, the form the session and two components already carry: it is read once and handed over as a string, and SvelteDate would be a fourth static specifier"
  - "snapshot-failed, lost and nothing-landed each announce their title through announceTitle() (the UI spec's rule for every failure); 07-07's partial and the store legs join the same #fail helper"
  - "Tasks 1 and 2 landed in ONE commit (341829e): both edit only install.svelte.ts and task 1's interfaces block names task 2's methods, so the file was written in one pass and committed once with both tasks' acceptance criteria met; task 3 is its own commit (6323912)"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-03, SAFE-04, SAFE-07]

# Metrics
duration: 33min
completed: 2026-09-05
---

# Phase 7 Plan 06: The install store - the snapshot, the two RAM clicks, and the way back Summary

**A second runes store now stands on the session's seams and does every write of this site: `install.svelte.ts` carries exactly three static specifiers (`./install-copy`, `./snapshot`, `./session.svelte`), builds one `RequestQueue` per connection over `session.transport` fed from `session.onClass`, and at `connected` takes the module's original in the gated order - `fetch-serial` (a timeout degrades to a session-only copy, never a throw), `fetchBoth` on the module's reported page, `canWriteBack` (D-03: an empty string is refused), the pair held in memory first, then `readSnapshot` so an existing original wins, then `persistIfAbsent` and `rememberLast` - and only then publishes `ready` and speaks `LIVE_SNAPSHOT_SAVED`. `TRY ON DEVICE` and `PUT BACK` go through one `#ramLeg`: `writeLock` set, `writeBoth` Timer then Setup verbatim, a generation guard, `#classify` by `instanceof` on the queue's own error classes, and `restorePageChange` in a `finally` on every path. `install.spec.ts` holds eight gates in node against a tee over `FakeTransport` with a clock stepped in lockstep with fake timers: zero `CONFIG/EXECUTE` across connect and the snapshot, exactly two after the click (`EVENTTYPE` 6 then 0, the strings character for character) followed by exactly one `HEARTBEAT TYPE 255`, the same for `PUT BACK` with the snapshot's strings, an unanswered serial waited out over three bounded attempts, an existing record winning with its `takenAt` untouched, and `undefined` and a 909-character string never reaching the wire or the queue. Five negative checks observed red and restored byte-identical, one after the test was tightened so the failure reads as a write. Quick 72 / 754 -> 73 / 762, sweep `3 13`, svelte-check 540 / 0. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried verbatim from 07-05, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                                              |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **1** spec file (`install.spec.ts`). Tree: **73** (+ 4)                                                              |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6 (754); this plan adds **8** (`install.spec.ts`). Tree: **762** (+ 38)          |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                  |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no component, no build; the plan does not ask)  |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                                        |

`BASE_CHECK` (provenance only): **540 files, 0 errors, 0 warnings** after Task 3 (539 after the store alone; the two new files are the two added).

### Observed totals: previous SUMMARY plus this plan's delta

07-05 left the tree at **72 / 754**. This plan's delta is **+1 file / +8 tests**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 762     # after 6323912
  check-counts: observed 73 files, 762 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788611230178 COMPLETED 540 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)

npx vitest run --project server src/lib/device/session.spec.ts
  Tests  21 passed (21)                                            (the session is unchanged by this plan)
```

`format-parity.spec.ts` did not flake; nothing was re-run.

### Per-file counts after this plan

| File                               | Before | After  | Plan said |
| ---------------------------------- | ------ | ------ | --------- |
| `src/lib/device/install.spec.ts`   | -      | **8**  | 8         |
| `src/lib/device/session.spec.ts`   | 21     | **21** | 21 (unedited) |
| `src/lib/device/` (all seven specs) | 51    | **59** | -         |

## Tasks 1 and 2 - the store's shape, the snapshot at connect, the two RAM clicks (commit `341829e`)

`src/lib/device/install.svelte.ts`, **641 lines**. The header says, in prose, each of the eight things the plan asked for: why a separate file (test 15's eight needles), why exactly three static specifiers and what each costs (two zero-import, one the session's four light ones), why the queue is fed from `onClass` and never `onData` (D-16, Pitfall 1), why one queue per connection (Pitfall 2), why memory before storage (Pitfall 9), why an existing record wins (the record is the original, not the latest), why no `$derived` (06-01's spike), and that the class is exported beside the singleton for the session's reason. It also names the one consequence of the gated order the plan asked to be named and not fixed (the D-03 gate sits before the record is consulted; deferred item 7).

The lifecycle: `start(env)` is idempotent and synchronous, reads `lastModuleId` / `hasSnapshotFor` into `rememberedModule`, and subscribes `onConnection`. `"connected"` bumps `#generation` and runs `#attach`, which awaits the (already resolved) heavy modules, builds **one** `RequestQueue` over `session.transport` with `preSendDelayMs` (`PRE_SEND_DELAY_MS` on first use, an instance field so 07-07 can escalate it), the injected `now` and an `onStep` pushing into `steps`, subscribes `session.onClass((cls) => queue.deliver(cls))`, and runs `#snapshot`. `"closed"` bumps the generation, then `abort`, unsubscribe and drop **each guarded on existence** (the not-zona path fires it with nothing to close), clears `confirmOpen`, and returns to `idle` only when no leg is in flight - `snapshot`, `moduleId` and `rememberedModule` stay.

### The scans, quoted, on the comment-stripped source (27,070 raw bytes, 11,087 stripped)

```
from " specifiers: 3 ["./install-copy","./snapshot","./session.svelte"]
.onData( occurrences: 0
.write( occurrences: 0
setInterval occurrences: 0
$derived occurrences: 0
await import("$lib/transport") occurrences: 1
persistIfAbsent occurrences: 2          (the import and the one call)
session.onClass occurrences: 1
instanceof occurrences: 3               (#ramLeg's AbortedError branch; #classify's two)
regex literals: 0
string literals over 30 chars: 0        (every sentence comes from install-copy)
```

### `#ramLeg`'s `finally`, quoted

```ts
    } finally {
      // MANDATORY on every path. See sequence.ts restorePageChange: a
      // successful CONFIG/EXECUTE clears page_change_enabled and only this
      // sets it back. On a dead link the send throws and is swallowed here.
      await T.restorePageChange(q).catch(() => undefined);
      this.#inFlight = false;
      this.#session.writeLock = false;
    }
```

### `#classify`, quoted - `instanceof` on the awaited transport module's classes, no regular expression

```ts
  #classify(err: unknown, T: Transport, action: InstallAction): void {
    const after = action === "put-back" ? "put-back" : "try";
    if (err instanceof T.AbortedError) {
      this.#fail("lost", "aborted", lostBlock(false, TRY_ON_LABEL).title);
      return;
    }
    if (err instanceof T.NackError) {
      this.#fail("nothing-landed", "nack", nothingLandedBlock(after).title);
      return;
    }
    this.#fail("nothing-landed", "timeout", nothingLandedBlock(after).title);
  }
```

07-07 widens it to `partial` by reading `steps` for a landed Timer, and to the store legs; the comment above it says so.

### The refusal guard, one reason per line

`#tryRefusal(config, configMax)` returns the first of `measuring` (config undefined), `not-writable` (phase outside the nine writable phases), `no-session` (no queue, or the session not `connected`), `over-budget` (either string `>= CONFIG_MAX`, read from the awaited protocol module - `sendConfig` refuses at the same constant from the other side). `tryOnDevice` from `snapshot-failed` runs `retrySnapshot()` first and proceeds only if that landed `ready`; a refusal returns before the queue is touched.

## Task 3 - install.spec.ts: eight gates, in node, with no browser (commit `6323912`)

`src/lib/device/install.spec.ts`, **783 lines**, **8**, `server` project. The header says why the name is `install.spec.ts`, that every test constructs its own `new DeviceSession()` and `new InstallStore(session)` and never imports either singleton, that no agent writes to a device, and describes the tee, the attached ports and the clock.

**The imports, quoted** (no singleton among them):

```
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_SETUP, EVENT_TIMER, RETRY_ATTEMPTS, TERMINATOR, TIMEOUTS, ZONA_HWCFG, type DecodedClass, decodeFrame, moduleKeyOf, retryBackoffMs } from "$lib/protocol";
import { ZONA_USB } from "$lib/protocol/usb";
import { FakeTransport, type Fault, type GridTransport } from "$lib/transport";
import { heartbeatFrame, serialNumberReportFrame, zonaResponder, type ZonaState } from "../transport/fixtures/synthetic";
import { LIVE_RESTORED, LIVE_SNAPSHOT_SAVED, announceTitle, liveSettled, snapshotFailedBlock } from "./install-copy";
import { type ConfigStrings, type InstallPhase, InstallStore } from "./install.svelte";
import { DeviceSession, type SerialLike } from "./session.svelte";
import { SNAPSHOT_KEY, type SnapshotStore, persistIfAbsent } from "./snapshot";
```

**The harness.** `tee(fake, initial)` implements `GridTransport` over a `FakeTransport` with `zonaResponder(state)`: `isOpen`, `write`, `onClose`, `close` delegated; `onData(cb)` keeps `cb`, registers one forwarder on the fake, and delivers the initial heartbeat on the first registration (as `pushable()` does) so `identifyOnly` resolves; `push(frame)` calls the same `cb`. Every `fakePort()` is `connected: true`. `setTimeout` / `clearTimeout` are faked in every test; the store's `now` is `() => clock.t`, and `until()` / `after()` advance `clock.t` and the fake timers together in 5 ms steps with a `setImmediate` yield between, so the queue's deadline rule (`elapsed < timeoutMs` re-arms) sees a real timeout and the dynamic imports make progress. `drive(promise)` runs a store action to completion the same way. `record(target, key)` replaces a runes field with a logging accessor (06-01's plain-own-property fact), used for the store's `phase` and the session's `writeLock`. `connected(opts)` returns `fake`, `push`, `state`, `storage`, `session`, `store`, `phases` and `writesOf(className, instr)`.

1. *the snapshot is taken at connect, in order, before ready* - `phases` has `snapshotting` before `ready`; **the step ids observed: `["fetch-serial", "fetch-setup", "fetch-timer"]`**, all `ok`; `snapshot` equals the module's strings; `moduleId` is 32 hex characters and equals `moduleKeyOf` of the fixture's serial report (a word above 2^31 included); the record holds one module, one page, the strings, and `last`; `rememberedModule` and `snapshotDurable` true; `speech` after the window is `LIVE_SNAPSHOT_SAVED`; `CONFIG/EXECUTE` 0, `PAGESTORE/EXECUTE` 0; `writeLock` false.
2. *a serial that is not answered degrades to a session-only snapshot* - `steps[0]` is `fetch-serial` / `timeout` / `attempts 3`; the virtual clock advanced at least `3 * 300 + 120 + 240` ms; `ready` all the same; `snapshot` defined; `snapshotDurable` false; `moduleId` undefined; the storage map empty; zero config writes.
3. *an empty fetched string is snapshot-failed, and everything stays disabled* - the module's RAM on page 3 while its heartbeat reports page 2: `snapshot-failed`, `snapshot` undefined, **nothing persisted**, zero writes, `speech` the block's title with a full stop; `tryOnDevice(PAIR, "x")` writes nothing and re-reads the module (three fetch steps again); `state.activePage = 2` then `retrySnapshot()` lands `ready` with the key published and one record.
4. *nothing is written without a click, and TRY ON DEVICE writes exactly two, Timer first, verbatim* - two `observeConfig` calls leave `CONFIG/EXECUTE` at 0; after the click the last three frames are `CONFIG/EXECUTE EVENTTYPE 6` with the pair's timer, `CONFIG/EXECUTE EVENTTYPE 0` with the pair's setup, `HEARTBEAT/EXECUTE TYPE 255`; `steps` is `write-timer ok`, `write-setup ok`, `restore-page-change sent`; `settled`, `lastWritten` the pair, `armed` true, `name` Aurora, the fake's RAM equal to the pair, `writeLock` logged `[true, false]`, `speech` `liveSettled("Aurora")`; a knob move onto different strings disarms and onto identical strings re-arms, with no write.
5. *PUT BACK writes the snapshot's strings the same way and lands restored* - after a click, `putBack()` produces the same three-frame shape with the **snapshot's** strings, `CONFIG/EXECUTE` 4 in total and `HEARTBEAT` 2, `restored`, `armed` false, `lastWritten` undefined, `speech` `LIVE_RESTORED`, the fake's RAM back to what it held at connect.
6. *an existing record wins and is never overwritten* - a pre-seeded entry with different strings and `takenAt` `2026-09-01T09:00:00.000Z`: `snapshot` equals the record's strings and not the module's; the page entry is deep-equal before and after (takenAt included) and again after `putBack()`, which writes the record's strings.
7. *over budget, and measuring, never reach the wire* - `tryOnDevice(undefined, "x")`, a 909-character Setup, a 909-character Timer: the write count is asserted first after each, unchanged; `ready`; `steps` is the **same array** the snapshot left (the queue was not touched); `lastWritten` undefined, `armed` false, `writeLock` false.
8. *the file's shape* - comment-stripped, fragment-assembled needles, a non-vacuity guard (`class InstallStore`): the three specifiers by name, `.onData(` / `.write(` / `setInterval` / `$derived` / `navigator.userAgent` all absent, `await import("$lib/transport")`, `session.onClass(` and `persistIfAbsent(` present; then test 15's nine needles over `session.svelte.ts`, all absent.

### Five negative checks, each observed red on the intended test and restored byte-identical (`e706c84fcf3d43d4…`)

| # | Mutation in `install.svelte.ts` | Red on | What it said |
| - | ------------------------------- | ------ | ------------ |
| 1 | `persistIfAbsent` of the fetched pair placed BEFORE the `canWriteBack` gate | test 3 (1 failed, 7 passed) | `AssertionError: a record for an empty snapshot: expected 1 to be +0` |
| 2 | `this.snapshot = fetched ?? record` - the fresh fetch over the record | test 6 (1 failed, 7 passed) | `AssertionError: the record's strings, not the module's: expected { setup: '--[[@cb]]print(1)', …(1) } to deeply equal { setup: '--[[@cb]]print(7)', …(1) }` |
| 3 | the two writes swapped in `#ramLeg` (two `q.request(P.sendConfig(...))` calls, Setup first) | test 4, then 5 and 6 (3 failed, 5 passed) | test 4's diff: `- "event": 6 / + "event": 0` on the first frame, `- "event": 0 / + "event": 6` on the second - red on `EVENTTYPE`, as the plan said |
| 4 | the `finally`'s `await T.restorePageChange(q)` removed | test 4, then 5 and 6 (3 failed, 5 passed) | test 4: `AssertionError: expected +0 to be 1` on the heartbeat count - no restore went out; the last-frame shape fails behind it |
| 5 | `tryOnDevice` proceeding on `undefined` (the `measuring` line removed, the pair defaulted to two empty strings) | test 7 (1 failed, 7 passed) | first run: `AssertionError: expected 'settled' to be 'ready'` - `settled` is reachable only through two acknowledged writes, so this WAS a write, but the message named a phase; test 7 was tightened so the write count is asserted first, and the re-run said `AssertionError: undefined reached the transport: expected 6 to be 3` - **observed as a write**, three frames past the snapshot's three |

After every restore `sha256sum` read `e706c84fcf3d43d4…` and `git diff --quiet src/lib/device/install.svelte.ts` was clean.

## Files created and modified

- `src/lib/device/install.svelte.ts` - created; 641 lines; `InstallStore`, `install`, `InstallPhase`, `InstallAction`, `InstallLeg`, `InstallCause`, `ConfigStrings`, `InstallEnv`
- `src/lib/device/install.spec.ts` - created; 783 lines; 8
- `.planning/phases/07-install-flow/07-06-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - item 7 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 6/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug in the plan's sketch] `AbortedError` is classified before the generation check**
- **Found during:** Task 2, writing `#ramLeg`'s catch against the session's `"closed"` ordering
- **Issue:** the interfaces block has `if (gen !== this.#generation) return false;` as the first line of the catch and says the `"closed"` branch leaves a leg in flight to "the action's catch [which] classifies the `AbortedError` as `lost`". The `"closed"` handler bumps the generation and then calls `queue.abort()`, whose rejection reaches the catch one microtask later - so the generation is always stale by the time an `AbortedError` arrives, the sketch's catch would return without classifying, and the phase would stay `writing` for ever.
- **Fix:** the catch classifies `AbortedError` first, whatever the generation says (the event that bumped it is the event that rejected the waiter), and applies the stale-generation return only to other errors. `"closed"` leaves the phase alone while `#inFlight` is true so the catch can name it.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `341829e`. Not exercised by a test in this plan (no test disconnects mid-write; that is 07-07's `lost` gate).

**2. [Rule 3 - Blocking] `svelte/prefer-svelte-reactivity` on the record's timestamp**
- **Found during:** Task 1, `npm run lint` (1 error at `new Date().toISOString()`)
- **Issue:** the Svelte lint plugin flags a built-in `Date` in a `.svelte.ts` file and asks for `SvelteDate`, which would be a fourth static specifier.
- **Fix:** the value is bound to a local with `// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a timestamp read once; see the comment above`, the form the session's two Sets and `BrowseGrid.svelte` / `Coverflow.svelte` already carry, and a comment saying it is read once and never held.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `341829e`. `npm run lint` after: exit 0.

**3. [Rule 3 - Blocking] `InstallEnv.sleep` deferred to 07-07**
- **Found during:** Task 1, reading ESLint's recommended set before writing `#sleep`
- **Issue:** the interfaces block declares `sleep?` in `InstallEnv` for "retry backoff and re-fetch rounds". The queue's backoff sleeps through its own module-scope timer, and nothing in this plan's store sleeps; a `#sleep` field written and never read is a `no-unused-private-class-members` error (ESLint recommended, on since v9).
- **Fix:** `InstallEnv` carries `storage` and `now`; a comment in it says 07-07 adds `sleep` beside the re-fetch rounds, the first thing in the file that waits.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `341829e`.

**4. [Rule 1 - The spec's first draft] test 7 tightened so a write reads as a write**
- **Found during:** Task 3, negative check 5
- **Issue:** with `tryOnDevice` proceeding on `undefined`, test 7's first red assertion was `expected 'settled' to be 'ready'` - true, and only reachable through two acknowledged writes, but the plan wants the failure **observed as a write**.
- **Fix:** the write count (`fake.writes.length`) is asserted immediately after each of the three refusals, before the phase. Re-run under the same mutation: `undefined reached the transport: expected 6 to be 3`.
- **Files modified:** `src/lib/device/install.spec.ts`. **Commit:** `6323912`.

**5. [Rule 2 - Missing assertion] test 3 asserts the storage is empty after `snapshot-failed`**
- **Found during:** Task 3, before negative check 1
- **Issue:** the plan's negative check 1 says test 3 goes red when the record is persisted before the guard, but the plan's test 3 text asserts nothing about storage.
- **Fix:** test 3 asserts `storage.map.size === 0` and `snapshotDurable === false` after the failure, and `size === 1` with `moduleId` published after the retry. Negative check 1 was observed red on exactly that assertion.
- **Files modified:** `src/lib/device/install.spec.ts`. **Commit:** `6323912`.

### Departures recorded, not deviations from the plan

1. **Tasks 1 and 2 are one commit.** Both edit only `install.svelte.ts`, and task 1's interfaces block names task 2's methods (`tryOnDevice`, `putBack`, `retrySnapshot`) as "named methods for task 02". The file was written in one pass with both tasks' acceptance criteria checked (the scans and svelte-check for task 1; the `finally`, the `instanceof` classifier, the no-regex and no-long-literal scans for task 2) and committed once as `341829e`. Task 3 is `6323912`.
2. **`steps` is a public plain field**, an addition to the interfaces block (which named the `onStep` and not what it fed). The spec reads it for the step-id order and for array identity after refusals; 07-07 reads it for a landed Timer.
3. **The three failure phases this plan can land announce their titles** through `announceTitle()` (the UI spec's live-region rule), from one `#fail` helper; test 3 asserts the `snapshot-failed` utterance. 07-07's `partial` and store-leg failures join the same helper.
4. **`rememberedModule` is also set from the snapshot** (`= snapshotDurable` once a key is persisted), so a tab that connected does not need a reload to learn that the browser remembers the module. Test 1 asserts it true after connect; the plan's `start()` reading is unchanged.

## Known stubs

None. `slow`, `keptThisSession`, `confirmOpen`, `landed`, `failed` and the `kept` / `kept-mismatch` / `unconfirmed` / `restored-unconfirmed` / `partial` phases are declared and unreached by design - they are 07-07's, and the plan says so ("Plan 07-07 adds flash, the failure taxonomy and the bounds to this same file"). No component mounts the store; that is 07-10's, and 07-VALIDATION says no plan between this one and 07-10 may.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-03, SAFE-04, SAFE-07]`** - contributed, not completed; every Phase 7 criterion carries a *(hardware)* half. SAFE-01: zero writes across connect, snapshot and every knob move is a property a node test holds, and every write in the tree is attributable to `tryOnDevice` or `putBack`. SAFE-03: the snapshot is taken in the gated order before `ready`, and an empty fetch keeps everything disabled. SAFE-04: the record is written under the module's own key, never overwritten, and an existing one wins over a fresh fetch. SAFE-07: `settled` is reached only after both `CONFIG/ACKNOWLEDGE` and the sent restore. `REQUIREMENTS.md` is not edited here.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 7** - the D-03 gate sits before the durable record is consulted, so a remembered module whose RAM reads empty on the snapshotted page lands `snapshot-failed` and is not offered its own record for `PUT BACK`. Owner: 07-13, and the Z-16 / D-03 question 07-VALIDATION leaves open; the reorder is a few lines in `#snapshot` and a test-3 inversion, once the user has ruled.

## Next plan readiness

07-07 (`KEEP ON DEVICE`, the taxonomy, the bounds) starts from: quick **73 / 762**, sweep `3 13`, svelte-check 540 / 0. It edits `install.svelte.ts` (the store legs, `partial` from `steps`, `#armSlow` / `#disarmSlow`, the pre-send escalation through `#preSendDelayMs`, `sleep` in `InstallEnv`) and grows `install.spec.ts` 8 -> 18 on the same `connected()`, `tee()` (whose fake keeps its `faults`), `until()`, `drive()` and `record()`. Every name the interfaces block promised exists under the plan's spelling except `sleep`, which 07-07 adds with its first reader.

The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every write in this plan's spec landed in `FakeTransport.writes` through the store's one queue, and each is attributable to one of the two clicks the spec makes.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T12:42:00.000Z.

- FOUND: `src/lib/device/install.svelte.ts` (641 lines; three `from "` specifiers; `.onData(` 0, `.write(` 0, `setInterval` 0, `$derived` 0)
- FOUND: `src/lib/device/install.spec.ts` (783 lines; 8; contains `fetch-serial`, 4 occurrences)
- FOUND: `.planning/phases/07-install-flow/07-06-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (item 7 appended; eight headings)
- FOUND: commit `341829e` (tasks 1 and 2, the store)
- FOUND: commit `6323912` (task 3, the spec)
- PASS: quick 73 / 762 through check-counts; sweep 3 13; svelte-check 540 / 0; `npm run lint` exit 0; `session.spec.ts` 21
- PASS: the store restored to `e706c84fcf3d43d4…` after each of the five negative checks; `git diff --quiet` clean against `341829e`
- engine name occurrences in the two source files, this SUMMARY and the two commit messages: 0
