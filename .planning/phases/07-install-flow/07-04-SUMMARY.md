---
phase: 07-install-flow
plan: 04
subsystem: device
tags: [session, onClass, onConnection, transport-view, announce, writeLock, unpluggedWhileWriting, SAFE_PROMISE, amendment, session-copy, SAFE-01, SAFE-09]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-03-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 71 / 744, sweep `3 13`, svelte-check 537"
  - "07-CONTEXT.md D-01 / SAFE-01 (the connect surface says nothing is written without a click, and Phase 7 keeps it true), D-04 amended (the session-only snapshot with honest copy), D-16 (one onData; the session owns it; a second raw registration is forbidden and a spec asserts it)"
  - "07-RESEARCH.md Pattern 2 (the session's seams, and it writes nothing), Pitfall 1 (a second transport.onData silently unhooks the fold)"
  - "07-UI-SPEC.md - The header device slot, and its disclosure (the four rows incl. the SAFE_PROMISE amendment row); I8 (the two forms of the unplugged sentence, Z-11); Z-13, Z-15, Z-17"
  - "src/lib/device/session.svelte.ts and session.spec.ts (06-03, 06-04, 06-09) - the fold pump, #teardown, #say and holdSpeech, the four static specifiers, test 15's needle list, the fakePort / fakeSerial / pushable helpers and the fake-timers recipe"
  - "src/lib/device/session-copy.ts and session-copy.spec.ts (06-02) - the import-free copy module, test 5's verbatim sentences, test 6's export walk with SAMPLES"
  - "src/lib/transport/transport.ts - GridTransport's one onData; src/lib/transport/fake.ts - FakeTransport.writes, the record the one write in this plan lands in"
provides:
  - "DeviceSession.transport: a WRITE VIEW over the open transport (isOpen read live; write, onClose and close BOUND, never called; onData throws naming onClass), or undefined"
  - "DeviceSession.onClass(cb): every decoded class from the fold's ONE pump, after absorbFrame, each sink inside its own try; per-connection, cleared with the fold; returns the unsubscribe"
  - "DeviceSession.onConnection(cb): 'connected' after the fold is registered and phase is connected; 'closed' once per teardown that had a transport (unplug, watchdog, disconnect(), forget(), the transport's own close net, AND the not-zona and silent paths with no 'connected' before it); for the life of the page; returns the unsubscribe"
  - "DeviceSession.announce(line): a public wrapper over #say and nothing more"
  - "DeviceSession.writeLock and unpluggedWhileWriting ($state booleans): the modifier is set from the lock at every transition into unplugged-while-connected and cleared with the failure; the session's own unplug utterance is suppressed under the lock"
  - "ConnectionEvent type exported beside SerialLike"
  - "session-copy.ts: UNPLUGGED_WHILE_WRITING (54), unpluggedWhileConnectedBlock(writing = false), WRITE_LOCK_REASON (41), SNAPSHOT_DURABLE_LINE (108), SNAPSHOT_SESSION_LINE (114, authored), REVOKE_EXPLANATION amended (143), SAFE_PROMISE amended BY NAME (88)"
  - "session.spec.ts 21 (tests 18-21 prove the four seams from node); session-copy.spec.ts 6 with test 5 rewritten and test 6 walking the writing form"
affects:
  - "07-06 (install.svelte.ts) borrows session.transport for its RequestQueue, subscribes through onClass and onConnection, speaks through announce, and sets / clears writeLock around every leg"
  - "07-07 (KEEP ON DEVICE) holds writeLock over the store leg too, so the header lock closes over it (Z-15)"
  - "07-11 (DeviceDetails / the header) reads writeLock for the two disabled controls with WRITE_LOCK_REASON beneath them, renders SNAPSHOT_DURABLE_LINE or SNAPSHOT_SESSION_LINE beneath the identity line, and the amended REVOKE_EXPLANATION; the header note renders the amended SAFE_PROMISE with no re-measure"
  - "e2e specs that assert the header note's SAFE-01 sentence character for character (if any) will need the new literal when they next run (07-08 / 07-12 / 07-13 roll PREV_E2E)"
  - ".planning/phases/07-install-flow/deferred-items.md - item 5 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 4/13"

tech-stack:
  added: []
  patterns:
    - "A transport handed out of a session is a VIEW that binds the methods it lends and throws on the one it must keep: the owner of a single-callback stream refuses a second registration with an error naming the seam to use instead, and a spec asserts the throw"
    - "One pump, two consumers, in a fixed order: the identity absorbs every frame first and the subscribers are fanned out second, each inside its own try, so a bad subscriber can neither reorder nor stop the fold"
    - "A two-form sentence for one event is a defaulted boolean on the builder, a modifier field beside the phase (never a new phase), and a guard on the utterance - and the spec walks the other form as an extra sample rather than trusting the default"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-04-SUMMARY.md"
  modified:
    - "src/lib/device/session.svelte.ts"
    - "src/lib/device/session.spec.ts"
    - "src/lib/device/session-copy.ts"
    - "src/lib/device/session-copy.spec.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "SAFE_PROMISE is amended BY NAME (07-UI-SPEC header changes table, the amendment row; D-01): `HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click.` - 88 characters measured by script, present tense, names no control. It is shorter than the 126 it replaces, so the header note's 152px reservation (06-UI-SPEC, measured on the longer string) holds with no re-measure"
  - "SNAPSHOT_SESSION_LINE lives in session-copy.ts beside SNAPSHOT_DURABLE_LINE, as the plan's files_modified and interfaces table place it, and NOT in install-copy.ts as the orchestrator's brief suggested: it is a header-disclosure string rendered by DeviceDetails (which reads session-copy, not install-copy), and install-copy.spec.ts test 2 matches every literal over 40 characters against 07-UI-SPEC, which does not carry this authored sentence - placing it there would have made test 2 red by construction. Recorded as deferred item 5 for the contract's owner"
  - "#unplugged publishes the phase BEFORE it releases the transport, so on the hardware-driven roads (the unplug event, the watchdog, the transport's own close net) 'closed' reaches onConnection subscribers after phase already reads unplugged-while-connected; on disconnect() and forget() it arrives as the transport is released, before their final idle / forgotten, because both still await the port - the member's comment says exactly that rather than the plan's blanket 'after phase has been assigned'"
  - "The two callback Sets carry `eslint-disable-next-line svelte/prefer-svelte-reactivity` with a reason, the form BrowseGrid.svelte and Coverflow.svelte already use: they are non-reactive by design (written in a 4 Hz callback, rendered by nothing) and SvelteSet would be a fifth static specifier"
  - "The class-sink Set is cleared with the fold (on #teardown and in #onTransportClosed), so an onClass subscription is a property of one connection; the connection-sink Set is never cleared, so onConnection is a for-the-life-of-the-page seam. Test 20 proves the second; test 18 the first within a connection"
  - "The widening of unpluggedWhileConnectedBlock and UNPLUGGED_WHILE_WRITING landed in Task 1's commit rather than Task 2's, because the session's new call site could not type-check without them (Rule 3); the other four string changes stayed in Task 2"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-09]

# Metrics
duration: 22min
completed: 2026-09-05
---

# Phase 7 Plan 04: The session's seams, and nothing else about the session Summary

**The session can now lend its writer and share its frames without ever giving up the one callback that keeps it honest. `session.transport` is a write view whose `onData` throws naming `onClass`; `onClass()` fans every decoded class out of the fold's one pump after the identity has absorbed it, each sink in its own try; `onConnection()` reports `"connected"` after the fold is registered and `"closed"` once per teardown, including a `"closed"` with no `"connected"` before it on the not-zona path; `announce()` is `#say` made public; and `writeLock` with `unpluggedWhileWriting` is how the header will lock its two controls under a write and how the session knows to say nothing on an unplug when Phase 6's `Nothing was written` would be false. The file keeps exactly four static specifiers and test 15's scan stays green unedited (`.write(` 0, `write.bind(` 1, eight needles 0). `session-copy.ts` gains the header's four Phase 7 strings and two amendments, one of them named: `SAFE_PROMISE` retires *"and this release cannot write at all"* to the present tense at 88 characters, shorter than the 126 it replaces, so the header note's 152px reservation holds unchanged. `session.spec.ts` 17 -> 21, `session-copy.spec.ts` 6 with test 5 rewritten; eight negative checks red and restored byte-identical. Quick 71 / 744 -> 71 / 748, sweep `3 13`, svelte-check 537 / 0.**

## The five-name carry-forward block

Carried verbatim from 07-03, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                              |
| ------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **71** (+ 2, unchanged from 07-03)                                          |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13 (744); this plan adds **4** (session.spec.ts 17 -> 21). Tree: **748** (+ 24)      |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                   |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no component, no build)          |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                        |

`BASE_CHECK` (provenance only): **537 files, 0 errors, 0 warnings**, `npm run check`, after every task (no file added, so the count did not move).

### Observed totals: previous SUMMARY plus this plan's delta

07-03 left the tree at **71 / 744**; re-measured here **before the first edit** and equal. This plan's delta is **+0 files / +4 tests**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 71 744     # before any edit, at df981e8
  check-counts: observed 71 files, 744 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 71 748     # after b5166ba
  check-counts: observed 71 files, 748 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788607798024 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)
```

`format-parity.spec.ts` did not flake; nothing was re-run.

### Per-file counts after this plan

| File                                 | Before | After  | Plan said |
| ------------------------------------ | ------ | ------ | --------- |
| `src/lib/device/session.spec.ts`     | 17     | **21** | 21        |
| `src/lib/device/session-copy.spec.ts`| 6      | **6**  | 6 (test 5 rewritten) |
| `src/lib/device/` (all five specs)   | 43     | **47** | -         |

## Task 1 - the six members, and the fold that fans out (commit `fbae7f1`)

`src/lib/device/session.svelte.ts`: six members added, all scalars, `$state` booleans, a `Set` of callbacks or bound methods. The header gained the paragraph the plan asked for, WHY THE INSTALL STORE IS A SEPARATE FILE AND WHAT IT BORROWS, naming the six members and saying the view's `onData` throws on purpose; the NEVER WRITES paragraph now says the file *hands out* a writer behind a getter and still never calls it, because the view is built by binding rather than by calling; and the #say paragraph counts six session sites plus the public `announce()` wrapper.

The fold pump (`#startFold`) is still the ONE `onData` registration the session ever makes. After `absorbFrame` it now runs `for (const cls of decoded.classes) for (const sink of this.#classSinks) try { sink(cls) } catch {}` - identity first, then the subscribers, the order the skeleton page and the desktop's message stream use - and `identify(fold)` is computed after the loop whatever a sink did. `#classSinks` is cleared in `#teardown` and `#onTransportClosed`. `"connected"` fires at the end of the identified branch after `phase = "connected"` and the spoken line; `"closed"` fires from `#teardown` once when it had a transport to release (synchronously, before the first await) and from `#onTransportClosed` after its own `#publishUnplugged`, guarded by the identity check that already made those two paths exclusive. `#unplugged` now publishes the phase before it releases the transport. `#publishUnplugged` sets `unpluggedWhileWriting = this.writeLock` and speaks `LIVE_UNPLUGGED` only under `!this.writeLock`; `#clearFailure` clears the modifier; `failureFor` renders `unpluggedWhileConnectedBlock(this.unpluggedWhileWriting)`.

### The scan, quoted, on the comment-stripped source (52,110 raw bytes, 16,772 stripped)

```
from " specifiers: 4 ["./session-copy","$lib/protocol/usb","$lib/transport/ports","$lib/transport/transport"]
.write( occurrences: 0
write.bind( occurrences: 1
RequestQueue 0  hostHeartbeat 0  sendConfig 0  storePage 0  fetchConfig 0  storeToFlash 0  writeBack 0  setInterval 0
for (const sink of occurrences: 2          (the class fan-out and the connection fan-out)
unpluggedWhileConnectedBlock(this occurrences: 1
engine name in raw: 2                       (Phase 6's header, lines 10 and 943; unchanged from HEAD)
```

`npx vitest run --project server src/lib/device/session.spec.ts` with the spec **unedited**: **17 passed**, test 15's two halves included.

## Task 2 - the header's six string changes, and the assertions that change with them (commit `5a26cdf`)

`src/lib/device/session-copy.ts`, still zero import specifiers (test 1). The six changes, each one literal, each measured by a scratch script that imported the module under Node 24's native type stripping and counted code points - never by eye:

| Export | Change | Measured | Note |
| --- | --- | --- | --- |
| `SAFE_PROMISE` | **amended by name** | **88** | was 126; the plan's count confirmed. Present tense, names no control. **The header note's 152px reservation holds unchanged: the string shrank, so it fills no more of the sizing twin's 3 + 3 line boxes than the string the reservation was measured on.** |
| `REVOKE_EXPLANATION` | amended (Z-13) | **143** | was 105 |
| `UNPLUGGED_WHILE_WRITING` | new (I8, Z-11) | **54** | landed with Task 1 (Rule 3, below) |
| `unpluggedWhileConnectedBlock(writing = false)` | widened | - | `detail` is the writing form when `writing`, Phase 4's sentence otherwise; `steps` stay `[]` |
| `WRITE_LOCK_REASON` | new (Z-15) | **41** | |
| `SNAPSHOT_DURABLE_LINE` | new (D-04, SAFE-04) | **108** | <= 129 |
| `SNAPSHOT_SESSION_LINE` | new, **authored** (D-04 amended) | **114** | <= 129; names no control; real apostrophe (U+2019); the one string in the phase the UI checker has not seen |

The provisional figures I had typed into four of the source comments before measuring (147, 55, 42, 113) were wrong and were corrected to the measured ones (143, 54, 41, 108) before the commit; the SAFE_PROMISE and SNAPSHOT_SESSION_LINE figures matched first time.

`src/lib/device/session-copy.spec.ts` test 5 **rewritten, not deleted**: `SAFE_PROMISE.length` asserted 126 -> **88** and its literal replaced; `REVOKE_EXPLANATION` gains a length assertion (143) and its literal is replaced; the four new strings are asserted verbatim with their lengths and the two snapshot lines additionally `<= 129`; `unpluggedWhileConnectedBlock(true).detail` is `UNPLUGGED_WHILE_WRITING`, `(false)` and `()` are Phase 4's sentence, and the writing form's steps are `[]`. A `MORE_SAMPLES` record walks `unpluggedWhileConnectedBlock(true)` in test 6 beside the primary sample. Tests 2 (seventeen phases) and 3 (nine named states) are untouched: no phase was added.

### Test 6's export walk, before and after

| | exports | strings walked |
| --- | --- | --- |
| Phase 6's module (`df981e8`) | 44 | **67** |
| After this plan, primary samples only | 48 | **71** (+4 = the four new string exports) |
| After this plan, with the writing-form sample | 48 | **72** (+1 = `unpluggedWhileConnectedBlock(true).detail`) |

### Four negative checks, each observed red on the intended test and restored byte-identical (`2c4a6ed8…`)

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | Phase 6's old `REVOKE_EXPLANATION` put back | test 5 (1 failed, 5 passed) | `AssertionError: the revoke line, measured: expected 105 to be 143` |
| 2 | Phase 6's old `SAFE_PROMISE` put back | test 5 (1 failed, 5 passed) | `AssertionError: SAFE-01, amended and measured: expected 126 to be 88` (the sentence assertion sits behind it) |
| 3 | `unpluggedWhileConnectedBlock(true)` collapsed to Phase 4's sentence | test 5 (1 failed, 5 passed) | `AssertionError: expected 'The ZONA was unplugged. Nothing was w…' to be 'The ZONA was unplugged while HANGAR w…'` |
| 4 | an ASCII apostrophe in `SNAPSHOT_DURABLE_LINE` | test 6 AND test 5 (2 failed, 4 passed) | `AssertionError: SNAPSHOT_DURABLE_LINE has a typewriter quote: expected true to be false`; test 5's literal went red on the same character |

## Task 3 - four gates over the seams, in node (commit `b5166ba`)

`src/lib/device/session.spec.ts` 17 -> **21**. The diff is four hunks: the header's count word and a sentence naming the four new gates (and test 21 added to the fake-timers list), the imports (`UNPLUGGED_WHILE_CONNECTED`, `UNPLUGGED_WHILE_WRITING`, `type ConnectionEvent`), and the additions after test 17. **Test 15 is byte-identical to HEAD** (checked with `diff` over its region) and green.

18. *onClass fans every decoded class out, and the identity keeps folding beside it* - a heartbeat naming page +2 reaches the subscriber as `HEARTBEAT/EXECUTE` **and** `PAGEACTIVE/REPORT` and folds into `identity.activePage` from the same frame; after unsubscribe the count stops and the identity does not; a throwing sink first in the Set neither stops the fold nor starves the sink after it.
19. *the transport view writes, and refuses a raw onData* - `undefined` before connect; the view is not the fake; `onData` throws `/onClass/` and writes nothing; **one explicit `write(Uint8Array.from([0]))` reaches `FakeTransport.writes` (length 1) - the one write in this file, stated in the test's comment; test 15's cycle is unedited at zero**; `isOpen` and `close()` reach the fake live; `undefined` again after `disconnect()`.
20. *onConnection reports connected and closed, in order, once each* - subscribed before `connect()`: `[]` at detected, `["connected"]` after identification, `["connected","closed"]` in the same turn as the unplug (after the phase moved), a second `"connected"` after the replug, one more `"closed"` from `forget()` and not two, nothing from a `disconnect()` with nothing open; a second subscriber unsubscribed after the first `"closed"` stays at two; and a not-zona session reports `["closed"]` with no `"connected"` before it.
21. *writeLock keeps the session quiet on an unplug, and announce speaks through the one region* - with fake timers: `announce("x")` is silent at 499 ms and spoken at 500; under `writeLock = true` the unplug is S5, `unpluggedWhileWriting` true, both surfaces' `detail` the writing form, and the utterance list does not grow and never contains `Nothing was written`; the modifier clears with the next offer; a fresh session with the lock off speaks `LIVE_UNPLUGGED` and renders Phase 4's form.

### Four negative checks, each observed red on the intended test and restored byte-identical (`911c0df8…`)

| # | Mutation in `session.svelte.ts` | Red on | What it said |
| - | ------------------------------- | ------ | ------------ |
| 1 | `onClass` also registers `this.#transport?.onData(() => undefined)` - the install-side sink registered raw | test 18 (1 failed, 20 passed) | `AssertionError: the heartbeat class: expected [] to include 'HEARTBEAT/EXECUTE'` - the raw registration took the stream; the identity stopped moving and the sink saw nothing |
| 2 | the view passes `onData` through (`onData: t.onData.bind(t)`) | test 19 (1 failed, 20 passed) | `AssertionError: expected [Function] to throw an error` |
| 3 | `"closed"` fired from `disconnect()` unconditionally | test 20 (1 failed, 20 passed) | `AssertionError: expected [ 'connected', 'closed', …(3) ] to deeply equal [ 'connected', 'closed', …(2) ]` - five events, not four |
| 4 | the `!this.writeLock` guard dropped | test 21 (1 failed, 20 passed) | `AssertionError: the session spoke under the lock: expected [ …(3) ] to deeply equal [ …(2) ]` - the false sentence was spoken |

## Files created and modified

- `src/lib/device/session.svelte.ts` - modified; `transport` (getter), `onClass`, `onConnection`, `announce`, `writeLock`, `unpluggedWhileWriting`, `#classSinks`, `#connectionSinks`, `#connection`, the `DecodedClass` type alias, the exported `ConnectionEvent` type; `#startFold`, `#publishUnplugged`, `#unplugged`, `#onTransportClosed`, `#teardown`, `#clearFailure`, `failureFor` and the identified branch edited; three header paragraphs
- `src/lib/device/session.spec.ts` - modified; 17 -> 21
- `src/lib/device/session-copy.ts` - modified; six string changes, one section comment
- `src/lib/device/session-copy.spec.ts` - modified; imports, `MORE_SAMPLES`, test 5 rewritten
- `.planning/phases/07-install-flow/07-04-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - item 5 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 4/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 3 - Blocking] `unpluggedWhileConnectedBlock`'s widening and `UNPLUGGED_WHILE_WRITING` pulled forward into Task 1's commit**
- **Found during:** Task 1, before the first `npm run check`
- **Issue:** the plan's Task 1 edits only `session.svelte.ts`, but its key link requires `failureFor` to call `unpluggedWhileConnectedBlock(this.unpluggedWhileWriting)`, and Phase 6's builder took no parameter; Task 1's acceptance criterion `npm run check … 0 errors` could not pass with the call in place.
- **Fix:** the defaulted `writing` parameter and the constant it selects (two of Task 2's six changes) landed in `fbae7f1` with the session; the other four stayed in Task 2 (`5a26cdf`). The widening is defaulted, so Phase 6's call site and `SAMPLES` entry kept working and `session-copy.spec.ts` stayed at 6 in between.
- **Files modified:** `src/lib/device/session-copy.ts`. **Commit:** `fbae7f1`.

**2. [Rule 3 - Blocking] Two `svelte/prefer-svelte-reactivity` lint errors on the two callback Sets**
- **Found during:** Task 1, `npm run lint` (2 errors at the `new Set` fields)
- **Issue:** eslint's Svelte plugin flags a built-in `Set` in a `.svelte.ts` file and asks for `SvelteSet`, which would be a fifth static specifier (`svelte/reactivity`) - forbidden by the plan.
- **Fix:** `// eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive by design; see the comment above` on each, the form `BrowseGrid.svelte` and `Coverflow.svelte` already use, with the field comments saying why (written in a 4 Hz callback, rendered by nothing, and the specifier rule).
- **Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `fbae7f1`. `npm run lint` after: exit 0.

### Departures recorded, not deviations from the plan

1. **`SNAPSHOT_SESSION_LINE` is in `session-copy.ts`, not `install-copy.ts`.** The orchestrator's brief said that if this plan authored the sentence it should go in `install-copy.ts` and be held by `install-copy.spec.ts` test 2. The plan's `files_modified`, its interfaces table and its acceptance criteria all place it in `session-copy.ts` beside `SNAPSHOT_DURABLE_LINE`, and there are two reasons the plan is right: it is a header-disclosure string rendered by DeviceDetails, which reads `session-copy` and not `install-copy`; and `install-copy.spec.ts` test 2 matches every literal over 40 characters against `07-UI-SPEC.md`, which contracts the slot and not this sentence, so the string would have gone red there by construction (07-03's SUMMARY said as much: "test 2 will hold it against the contract the day it is added *if the contract carries it*"). It is held to the same cap (<= 129) and the same typography rules in `session-copy.spec.ts` tests 5 and 6 instead. Deferred item 5 asks the contract's owner to add the row; when it exists, moving the literal is a one-line change and either spec can hold it.
2. **`onConnection`'s timing comment is more precise than the plan's.** The plan's interfaces block says `"closed"` is "fired synchronously at the transition, after `phase` has been assigned"; it is fired from `#teardown` as the plan's action text requires, which on `disconnect()` and `forget()` runs *before* those two assign their final phase (both await the port first). Rather than reorder Phase 6's two visitor-driven paths, `#unplugged` was reordered so the three hardware-driven roads do satisfy the sentence, and the member's comment states both halves. Test 20 asserts the phase on the unplug road only. 07-06's subscriber needs the event, not the phase.

Two notes, neither a deviation: `ConnectionEvent` is exported as a named type (additive to the inline union in the interfaces block), and the class-sink Set is cleared in `#onTransportClosed` as well as `#teardown`, since both end the fold.

## Known stubs

None. `writeLock` is a real field nothing sets yet - that is 07-06's job and the plan says so; it is a seam, not a stub. No UI was written.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-09]`** - contributed, not completed. SAFE-01: the connect surface's sentence is true again in the present tense, and "zero writes without a click" is now a property the session can *enforce* (a second raw stream registration is refused) rather than only promise; the never-writes proof over the whole visit is unedited and green; but nothing writes yet. SAFE-09: the lost-mid-write state has its true sentence and the modifier that selects it, but no install store produces the state yet (07-06 / 07-07). `REQUIREMENTS.md` is not edited here.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 5** - `SNAPSHOT_SESSION_LINE` (114 characters) is authored, lives in `session-copy.ts`, and is the one string in the phase the UI checker has not seen; `07-UI-SPEC.md`'s Copywriting Contract has a row for the durable line and none for the session-only one. Owner: the contract's owner, to add the row (and, if preferred, relocate the literal to `install-copy.ts` once test 2 can hold it); no code until then.

## Next plan readiness

07-05 (the tuner's `onconfig` channel) starts from: quick **71 / 748**, sweep `3 13`, svelte-check 537 / 0. It touches nothing this plan touched. 07-06 imports `session` and reads `session.transport`, `session.onClass`, `session.onConnection`, `session.announce`, `session.writeLock` and `session.identity`; every name exists under the plan's spelling, `ConnectionEvent` is exported for its handler's signature, and the `"closed"`-with-no-`"connected"` case is proven so its branch can be written against it. 07-11 reads `WRITE_LOCK_REASON`, `SNAPSHOT_DURABLE_LINE`, `SNAPSHOT_SESSION_LINE`, the amended `REVOKE_EXPLANATION` and `session.writeLock`; the header note renders the amended `SAFE_PROMISE` with no layout change.

The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; the one write in this plan's spec went to a `FakeTransport`, through the view, by an explicit call.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T11:44:00.000Z.

- FOUND: `src/lib/device/session.svelte.ts` (contains `onClass`, 6 occurrences)
- FOUND: `src/lib/device/session.spec.ts` (contains `onClass`, 6 occurrences)
- FOUND: `src/lib/device/session-copy.ts` (contains `WRITE_LOCK_REASON`)
- FOUND: `src/lib/device/session-copy.spec.ts`
- FOUND: `.planning/phases/07-install-flow/07-04-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md`
- FOUND: commit `fbae7f1`
- FOUND: commit `5a26cdf`
- FOUND: commit `b5166ba`
- PASS: quick 71 / 748 through check-counts; sweep 3 13; svelte-check 537 / 0; lint exit 0
- engine name occurrences in this SUMMARY: 0
