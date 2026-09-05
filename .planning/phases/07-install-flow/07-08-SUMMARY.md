---
phase: 07-install-flow
plan: 08
subsystem: testing
tags: [fake-serial, fake-zona, exposeFunction, probe-route, phase-trace, install-e2e, fourteen-states, SAFE-01, SAFE-03, SAFE-07, SAFE-09]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-07-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 73 / 772, sweep `3 13`, svelte-check 540; the store's public surface (phase, steps, lastSteps, refetchRounds, pacingEscalated, keepReason(), putBackState(), openConfirm / dismissConfirm, tryOnDevice / putBack / keepOnDevice, retrySnapshot, observeConfig, start()); the heartbeat the proof waits for is the ZONA's by SX/SY; every keep needs a ZONA heartbeat after the PAGESTORE acknowledgement or it stays in writing"
  - "07-CONTEXT.md D-03 (the snapshot at connect, before any write control enables), D-13 (every path against the fake, in both Playwright projects), D-19; 07-UI-SPEC.md § The install state machine (I0 to I13) and § The one session live region; 07-VALIDATION.md rows 07-08-01 to 03 and the ~19 s note on test 6"
  - "06-06-SUMMARY.md and 06-07-SUMMARY.md - the shim (real Event with an own target accessor, requests(), openCount(i), replug(), identifyWith feeding the capture, grantBeforeLoad), the @webkit tag convention; 06-05-SUMMARY.md - config-shape test 12's discovery scan and test 13's permitted-module walk; 06-13-SUMMARY.md - the session e2e house style"
  - "src/lib/transport/fixtures/synthetic.ts (zonaResponder, rigResponder, configNackFrame, configReportFrame, heartbeatFrame, ZonaState with flash); src/lib/protocol (decodeFrame, TERMINATOR, ZONA_HWCFG, EVENT_SETUP, EVENT_TIMER, encodeRequest, fetchConfig); src/lib/transport/queue.ts (the waiter armed before the write; a thrown write is aborted, not AbortedError); src/lib/device/install.svelte.ts and session.svelte.ts"
provides:
  - "e2e/fake-serial.ts - the fake port's write() hands every chunk to window.__hangarZona as hex when a test exposed one, AWAITS the reply and pushes each returned frame into its own readable stream; unplugAfterWrites(i, n) (the nth write resolves, the port unplugs on the next macrotask), beat(i, hex), writesOf(); the header paragraph saying why the hook lives here and the answer does not"
  - "e2e/fake-zona.ts - installZona(page, state, script) over the REAL zonaResponder / rigResponder through page.exposeFunction: the terminator stripped, decodeFrame, the request id read off the wire as FakeTransport reads it, seen(class, instr) by class, heartbeatHex(), script(next) read from a Node-side closure on every call; five faults - dropAck (DropAck | DropAck[], a PER-CLASS counter that advances on dropped ACKs too), delayAckMs (stalls the page's write()), nackFirstWrite, mismatchRefetch, rig"
  - "src/routes/dev/install/+page.svelte - the sixth unlinked probe: session-phase, install-phase, install-trace (every phase since load, joined by ` > `), action / leg / cause, snapshot (kind and two lengths), module, armed / confirm / slow / pacing, keep-reason (or `live`), put-back (putBackState()), speech, steps (id outcome attempts per line, re-read on phase and write-lock changes); two textareas as the pair; nine plain buttons, install-connect with nothing awaited in front"
  - "src/routes/+layout.svelte - install.start() after session.start() in the one onMount"
  - "src/lib/config-shape.spec.ts - PERMITTED_SPECIFIERS + $lib/device/install.svelte, $lib/device/install-copy, $lib/device/snapshot with the Phase 7 amendment; the walk's visited-module guard 4 -> 7 (observed 8 of 8); still 14"
  - "e2e/install.e2e.ts - six untagged browser tests visiting all fourteen install states through the probe's trace, every one ending with the wire counted by class; test 6 under test.slow()"
  - "e2e/session.e2e.ts - the seven cable tests given the answering module (answering(page), state from the capture's identity) and SAFE-01 asserted by class through onlyReads(page, zona, connects); test 14 reading the coalesced snapshot sentence after connect and checking one voice on the current sentence; still 14 titles, still 16 runs"
  - "PREV_E2E re-measured at 83 by this plan (77 + 6): 73 chromium + 10 webkit-phone"
affects:
  - "07-09 plants the allow-list mutations in a component under src/lib/ui/ once one exists; the three permitted paths and the raised walk guard are this plan's"
  - "07-11 owns the snapshot line and the header lock; deferred item 9 (the connected sentence swallowed by the snapshot line at connect) is its subject or 07-13's runbook's"
  - "07-12 adds four untagged and one tagged title to install.e2e.ts (+6 to the suite) and reads the probe's testids - the PUT BACK click is install-put-back-click (deferred item 10); its tests 7, 9 and 10 use zona.script()"
  - "07-13 asserts BASE_E2E + 12 = 89 and re-measures PREV_E2E from 83"
  - ".planning/phases/07-install-flow/deferred-items.md - items 9 and 10 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 8/13, by hand"

tech-stack:
  added: []
  patterns:
    - "One fake, two sides: the page-side shim never models a module; it hands each written chunk to a Node function exposed with page.exposeFunction and feeds back whatever frames return, so the module that answers a browser is the same responder the unit suite trusts and the request id is read off the real wire"
    - "A fault list whose counter is per class and advances on dropped entries too, so its entries may be listed in any order - the opposite of a per-fault hits map that short-circuits at the first due fault, and the difference is written where the two meet"
    - "A probe with a trace: a plain array pushed from an effect on the phase and rendered joined, so a transient state a locator cannot catch is still an assertable string"
    - "Heartbeats paced by the test: push one, poll a readout for one heartbeat period, push again, bounded, and report the readout's final value on giving up - a heartbeat that arrives before a waiter exists harms nothing, which is what makes the pump safe"
    - "A shim's unplug lets the write resolve and fires the disconnect on the next macrotask, so the queue sees its own AbortedError from the session's closed rather than a thrown write it would classify as a timeout"

key-files:
  created:
    - "e2e/fake-zona.ts"
    - "src/routes/dev/install/+page.svelte"
    - "e2e/install.e2e.ts"
    - ".planning/phases/07-install-flow/07-08-SUMMARY.md"
  modified:
    - "e2e/fake-serial.ts"
    - "src/routes/+layout.svelte"
    - "src/lib/config-shape.spec.ts"
    - "e2e/session.e2e.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The shim's nth-write unplug resolves the write and fires the disconnect on a setTimeout(0): the queue's request path settles a THROWN write as `aborted` with a plain Error, which #classify would read as a timeout; `lost` needs the queue's own AbortedError, which only the session's closed produces"
  - "The write that caused the unplug is recorded in writesOf() and never handed to the responder: the cable came out as the bytes left, so seen(CONFIG, EXECUTE) stays 0 at lost and the recorded chunk decodes as the Timer write"
  - "mismatchRefetch defines a re-fetch as a CONFIG/FETCH of Setup after the first PAGESTORE/EXECUTE seen, so the snapshot's fetches stay honest and only the proof lies"
  - "The probe's PUT BACK button is install-put-back-click; the plan's table gave the readout and the button one testid and Playwright's strict locator resolved to two elements (deferred item 10)"
  - "session.e2e.ts's cable tests were given the answering module rather than left to time out: a real ZONA answers a fetch, and an unanswered snapshot retries into `Nothing to put back yet.` in the live region 2.6 s after connect, which broke test 14 for the wrong module"
  - "Test 14 asserts the region reads LIVE_SNAPSHOT_SAVED after connect and not the connected sentence, and checks one voice on the current sentence: the coalescer keeps the last line queued inside its 500 ms window, which is the announcer's contract; whether that is the right thing to hear at connect is deferred item 9, not a test's to decide"
  - "install-steps renders the LAST action's steps, as the plan's table says; test 2 therefore reads one restore-page-change line after the try and one after the put-back rather than two in one readout"

requirements-completed: []
requirements-contributed: [SAFE-01, SAFE-03, SAFE-07, SAFE-09]

# Metrics
duration: 45min
completed: 2026-09-05
---

# Phase 7 Plan 08: The shim answers with the real fake, the /dev/install/ probe, the fourteen states walked Summary

**Every install state the site can be in has been visited by a real browser against the bytes that would be deployed, with a ZONA that does not exist. Phase 6's shim gained one hook - the fake port's `write()` hands each chunk to `window.__hangarZona` as hex when a test has exposed one, awaits the reply and pushes every returned frame into its own readable stream - and the Node side of that hook is the node suite's own `zonaResponder`, so the request id an acknowledgement echoes is read off the real wire and a state the browser reaches is a state `install.spec.ts` can reach; five faults are scripted on top of it and none inside it, with a per-class acknowledgement counter that advances on dropped entries too. The sixth unlinked probe, `/dev/install/`, renders the store's fields as plain text plus a trace of every phase since load, so a 40 ms `writing` is on the record; the root layout starts the install store beside the session, and the chunk guard's allow-list gained the store's three specifiers with the walk observed reading 8 of 8. `install.e2e.ts` walks I0 to I13 in six untagged tests, every one ending with the wire counted by class - zero `CONFIG/EXECUTE` and zero `PAGESTORE/EXECUTE` over a connect-and-snapshot journey, exactly the clicked number everywhere else - and test 6 runs its two legs of three `pagestoreMs` timeouts under `test.slow()` in 22.2 s. The planned layout line landed on seven Phase 6 tests the plan did not list: the snapshot at connect sends three reads, so `session.e2e.ts`'s cable tests were given the same answering module and now assert SAFE-01 the way Phase 7 states it, by class. Quick 73 / 772 (unchanged), sweep `3 13`, e2e 83 = 77 + 6 (73 chromium + 10 webkit-phone) at `--workers 3`, svelte-check 542 / 0. Two negative checks observed red and restored byte-identical. No device was connected to, looked for or written to; the only ZONA in this plan is a function in Node.**

## The five-name carry-forward block

Carried verbatim from 07-07, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. `PREV_E2E` is re-measured here, as the plan says this plan does.

| Name         | Value                      | Note                                                                                                                                 |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **73** (+ 4)                                                                                    |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6, 07-06 + 8, 07-07 + 10 (772); this plan adds **0**. Tree: **772** (+ 48)           |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                     |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**                                                                                    |
| `PREV_E2E`   | **83 (re-measured here)**  | **77 + 6**: six untagged titles in `e2e/install.e2e.ts`, chromium alone. `--list`: 83 in 12 files; chromium 73; webkit-phone 10 (unchanged) |

`BASE_CHECK` (provenance only): **542 files, 0 errors, 0 warnings** after every commit (540 + the probe page and its generated route type; nothing else added).

### Observed totals: previous SUMMARY plus this plan's delta

07-07 left the tree at **73 / 772**, sweep `3 13`, e2e **77**, svelte-check 540. This plan's delta is **+0 files / +0 tests / +6 e2e / +2 checked files**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 772       # after 31397ee and again after 6f9d2e4
  check-counts: observed 73 files, 772 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788615842015 COMPLETED 542 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)

npx playwright test --list 2>&1 | tail -1
  Total: 83 tests in 12 files            (--project chromium: 73 in 12 files; --project webkit-phone: 10 in 3 files)

npx playwright test e2e/install.e2e.ts --project chromium
  6 passed (53.0s)                       (first green run, after the testid fix; test 5 then re-drafted - see deviation 4)

npm run test:e2e -- --workers 3 2>&1 | node scripts/check-counts.mjs --playwright 83      # third full run, the one that counts
  check-counts: observed 83 tests passed
  check-counts: matches the expected counts
  83 passed (1.4m)                       73 chromium (6 of them install.e2e.ts) + 10 webkit-phone
```

`format-parity.spec.ts` did not flake; nothing under vitest was re-run. The full e2e suite ran three times, and the SUMMARY says why below (the first: seven session tests red on the layout line; the second: 82 passed and one inherited flake; the third: 83).

### Per-file counts after this plan

| File                             | Before | After  | Plan said           |
| -------------------------------- | ------ | ------ | ------------------- |
| `src/lib/config-shape.spec.ts`   | 14     | **14** | 14                  |
| `e2e/install.e2e.ts`             | -      | **6**  | 6 titles, untagged  |
| `e2e/session.e2e.ts`             | 14     | **14** | unedited (see dev. 5) |
| e2e total (both projects)        | 77     | **83** | `PREV_E2E + 6`      |

## Task 1 - the shim answers, and the answer is the real fake (commit `80bc146`)

`e2e/fake-serial.ts`, 308 -> **389 lines**. The write sink became `async`: it counts the chunk, records its hex in `writeLog`, honours `unplugAt`, and otherwise reads `window.__hangarZona` lazily, awaits it and feeds every returned frame through the port's own `feed()`. `toHex` / `fromHex` live inside the init function (it is serialised and may close over nothing). `unplugPort(port)` is the one unplug, shared by `unplug(i)` and the nth-write path. The header gained the paragraph "SINCE PHASE 7 (plan 07-08) THE SHIM CAN ANSWER, AND THE ANSWER IS NOT HERE"; the `Window` declaration gained `__hangarZona?: (hex: string) => Promise<string[]>`.

`e2e/fake-zona.ts`, **274 lines**, new. The header says the three things the plan asked for: the same responder the node suite uses (a browser can only reach a state the unit tests can reach); still modelled on a source reading of firmware, closed by `docs/INSTALL-RUNBOOK.md` rows A, B and E (07-13); and the two fakes' disagreement about attempt duration - `delayAckMs` stalls the page's `write()` because the sink awaits the reply, `FakeTransport`'s `delay` stalls only the reply, and the queue arms its waiter before the write either way so an attempt still times out at `executeMs` 250 in both. A fourth paragraph states the drop counter: per class, advancing on dropped acknowledgements too, the opposite of `fake.ts`'s per-fault `hits` map that returns at the first due fault (07-07 tests 12 and 13 list descending for that reason), so entries here may be listed in any order.

### The exposed function, in order

strip the terminator -> `decodeFrame` -> `requestId = Number(classes[0].brc_parameters.ID ?? 0)` -> for each class: count `seen`, then `replyTo` (the NACK-first fault before the responder; the `stored` flag on a `PAGESTORE/EXECUTE`; the responder for the CURRENT script - `rigResponder([state, ...rig])` or `zonaResponder(state)`; the mismatch replacement on a Setup fetch after a store; every `ACKNOWLEDGE` numbered per class and dropped when a `DropAck` names its number) -> hold the batch by `delayAckMs` if it carries an acknowledgement of that class -> each reply as hex with the terminator appended. A heartbeat returns `[]`.

### The self-check, verbatim, then deleted

A throwaway `e2e/roundtrip-selfcheck.e2e.ts` on `/dev/session/` with the shim, the responder and a granted port. **Its first run showed the plan's self-check could not prove what it named**: three beats took the session to `connected`, but `seen(CONFIG, FETCH)` read 0 with `writes: 0` - the session never writes, and nothing had started the install store yet (that is task 2's layout line), so the Node half never ran. The test was redesigned to push one real `CONFIG/FETCH` - `encodeRequest(fetchConfig(0, 0, 2, 0))`, the store's own descriptor through the store's own encoder - through the fake port's writable from the page, with `__hangarZona` wrapped in-page to observe the replies. Second run:

```
phase after 3 beats: connected; phases read after each beat: opening, opening, identifying
after one raw CONFIG/FETCH from the page: {"replies":1,"replyBytes":[66],"replyTail":["0a"],"writes":1}; Node seen CONFIG/FETCH 1, SERIALNUMBER/FETCH 0, CONFIG/EXECUTE 0, HEARTBEAT/EXECUTE 0
  ok 1 [chromium] › e2e\roundtrip-selfcheck.e2e.ts:9:1 › round trip self-check (1.1s)
  1 passed (15.3s)
```

Write out (the chunk reached the shim: `writes 1`), decoded in Node (`seen CONFIG/FETCH 1`), answered (one 66-byte `CONFIG/REPORT` ending `0a`), and the reply-in / decode-in-the-page half proven by the same beats that identified the module. The file was deleted; `npx playwright test --list` read `Total: 77 tests in 11 files` with zero titles matching `fake-zona` or `roundtrip`, and `$lib/protocol` inside `synthetic.ts` resolved under Playwright's loader with no error (the protocol package's own `HEARTBEAT_INTERVAL 250000 250` line appeared, as the plan said it would).

## Task 2 - /dev/install/, the layout line, the allow-list (commit `31397ee`; the testid fix rode with `6f9d2e4`)

`src/routes/dev/install/+page.svelte`, **264 lines**. The header's four things: linked from nowhere (the five siblings described, never spelled); no production chrome, and a trace; both singletons started from its own `onMount`, idempotently; nothing awaited in front of `connect()`. The trace is a plain array pushed from `$effect(() => { phases.push(install.phase); trace = phases.join(" > "); })` - the effect writes a value it does not read. `install-steps` is re-read from `install.lastSteps` on `install.phase`, `session.phase` and `session.writeLock`, because the lock is released in each leg's `finally` after the restore heartbeat's step is recorded. `keepReason`, `putBack` and the snapshot line are `$derived` over the store's runes and the session's phase.

`src/routes/+layout.svelte`: `install.start();` after `session.start();` with the D-03 comment; the chunk-guard sentence in the docblock now names both stores.

`src/lib/config-shape.spec.ts`: the Phase 7 amendment block, three new permitted paths with their comment, the walk's silent-guard raised from 4 to 7 with its comment. **Observed with the guard raised to 9**: `AssertionError: the walk read 8 permitted module(s) - it has gone silent: expected 8 to be greater than or equal to 9` - the walk read all eight, and the guard was restored to 7. The test count stays 14; the mutations that prove the widening bites are 07-09's, once a component under `src/lib/ui/` exists to plant them in.

```
npm run build                        -> build/dev/install/index.html exists (.svelte-kit/output/server/entries/pages/dev/install/_page.svelte.js 3.79 kB)
npx vitest run --project server src/lib/config-shape.spec.ts   -> Tests  14 passed (14)
scan of the probe's source for each sibling path: catalog 0, fidelity 0, session 0, skeleton 0, tune 0
files under src/routes mentioning the probe's own path outside its directory: (none)
```

## Task 3 - install.e2e.ts, the fourteen states walked (commit `6f9d2e4`)

`e2e/install.e2e.ts`, **721 lines**, six untagged titles in one describe. Helpers: `openProbe` (expose, grant before load, goto, assert the offer and `idle`), `beatUntil` (push one heartbeat, poll a readout for one heartbeat period, repeat, bounded at 80, naming the readout's final value on giving up), `connectAndSnapshot`, `tryOn(lands)`, `keep(lands)`, `stepLines`, `probePair` (the textareas read, never restated), `onlyReads`-style class counts inline. Every fresh page gets its own module (`moduleState(nth)` differs in WORD0) so no page reads another's durable record.

### The fourteen states, tabulated against the six tests

| State                  | Test(s) that visit it                                        | How it is asserted                                                                 |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `idle`                 | 1, 2, 3, 4, 5, 6                                             | `install-phase` before connect; the trace begins `idle`                             |
| `snapshotting`         | 1 (twice on the second page), 5 (again after the replug)     | the trace: `idle > snapshotting > ready`; `snapshot-failed > snapshotting > ready`; `lost > snapshotting > ready` |
| `ready`                | 1, 2, 3, 4, 5, 6                                             | `install-phase` after connect; the trace                                            |
| `writing`              | 2, 3, 4, 5, 6                                                | the trace: `> writing > settled`, `> writing > kept`, `> writing > partial`, …       |
| `settled`              | 2, 3, 6                                                      | `install-phase`; `armed` true; `keep-reason` live; the settled sentence spoken       |
| `restored`             | 2                                                            | the trace `> settled > writing > restored`; LIVE_RESTORED spoken; RAM the original  |
| `kept`                 | 3, 6 (second page)                                           | the trace `> settled > writing > kept`; `already-kept`; flash equals the pair        |
| `partial`              | 4                                                            | acknowledgements 2, 3, 4 dropped; `after-partial`; `write-setup timeout 3`; pacing true |
| `lost`                 | 5                                                            | `unplugAfterWrites(0, 4)`; `aborted`; `needs-zona`; the lost title spoken            |
| `snapshot-failed`      | 1 (second page)                                              | a fetch answering empty; `put-back` absent; RETRY reaches `ready`                    |
| `kept-mismatch`        | 3 (second page)                                              | `mismatchRefetch`; `after-mismatch`; three `refetch-setup` lines                     |
| `unconfirmed`          | 6                                                            | PAGESTORE acknowledgements 1, 2, 3 dropped; `keep-reason` live; `store timeout 3`    |
| `restored-unconfirmed` | 6 (second page)                                              | after a kept, `script()` drops 2, 3, 4; put-back's RAM leg then `store timeout 3`    |
| `nothing-landed`       | 4 (second and third pages)                                   | `nackFirstWrite` -> `nack`, one attempt, pacing false; drops 1, 2, 3 -> `timeout`, pacing true |

All fourteen covered; no state is reached by one test only through another's precondition.

### What each test counted on the wire

| Test | `CONFIG/EXECUTE` | `PAGESTORE/EXECUTE` | Other classes asserted                                                        |
| ---- | ---------------- | ------------------- | ----------------------------------------------------------------------------- |
| 1    | 0 (both pages)   | 0                   | `SERIALNUMBER/FETCH` 1, `CONFIG/FETCH` 2, `HEARTBEAT/EXECUTE` 0; `writesOf().length` 3; second page `CONFIG/FETCH` 4 |
| 2    | 2 then 4         | 0                   | `HEARTBEAT/EXECUTE` 1 then 2; RAM the pair then the original; flash untouched  |
| 3    | 2 (both pages)   | 1 (both pages)      | `CONFIG/FETCH` 4 (kept) and 8 (mismatch: the snapshot's two plus three rounds) |
| 4    | 4, 1, 3          | 0                   | RAM holds the pair on both events at `partial` (the acknowledgements were dropped, not the writes) |
| 5    | 0                | 0                   | `SERIALNUMBER/FETCH` 2, `CONFIG/FETCH` 4 after the replug; the nth chunk decodes as `CONFIG/EXECUTE` EVENTTYPE 6 |
| 6    | 2, then 4        | 3, then 1 + 3       | `store timeout 3` once per leg; RAM the original at the end                    |

### Test 6's wall time, recorded

`test.slow()` on its first line. Observed **21,937 ms** (first leg 11,267, second 10,670) on the first green run, **22,434** on the second full run, **22,215 ms** (11,525 / 10,690) on the third; each leg is three `pagestoreMs` (3000) attempts with `retryBackoffMs` 120 and 240 between them plus a RAM leg and a connect. Under the tripled budget (90 s) with room to spare; against the default 30 s it would not be.

### Console records kept from the runs

```
identification needed 2 heartbeat(s)                         (test 1; the first beat lands while the port is opening)
steps at lost: write-timer aborted 1 | restore-page-change sent 1
writes recorded at lost: 5 (unplug at 4)                    (the restore heartbeat reached the sink before the session closed the port)
```

### The two negative checks, observed and restored

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `<!-- the probe at /dev/install/ -->` appended to `src/routes/+page.svelte` | `config-shape.spec.ts` test 12 (1 failed, 13 passed) | `AssertionError: expected [ '+page.svelte mentions dev/install' ] to deeply equal []` |
| 2 | `current.mismatchRefetch &&` -> `false &&` in `e2e/fake-zona.ts` (the handling removed) | `install.e2e.ts` test 3 (1 failed) | `Error: install-phase never read kept-mismatch after 80 heartbeats; it reads kept` |

Both restored from a byte copy: `+page.svelte` at `72a9c22fb5ad1e4b…` before and after with `git diff --quiet` clean; `fake-zona.ts` at `f525bde6fc1bb681…` before and after, clean. (Check 2 was run twice: the first run's message named only the missing state, so `beatUntil` was given the readout's final value and the check re-run to record `it reads kept`.)

### The tag arithmetic

All six titles untagged. `--list`: **83 in 12 files**; `--project chromium` **73** (67 + 6); `--project webkit-phone` **10** (unchanged); `install.e2e.ts` titles **6**; titles containing `failed` **0**. Full run: **83 passed** = 73 chromium + 10 webkit-phone at `--workers 3`. `PREV_E2E` = 77 + 6 = **83**.

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - The plan's self-check could not prove the Node half] the round trip proven with one raw `CONFIG/FETCH` from the page**
- **Found during:** Task 1, the self-check's first run (`writes: 0; seen CONFIG/FETCH 0` with the session at `connected`)
- **Issue:** the plan's self-check on `/dev/session/` asserts `connected` and calls that the round trip; but the session never writes and nothing started the install store before task 2, so the write-out / decode-in-Node half never ran.
- **Fix:** the throwaway pushed one real encoded fetch through the fake port's writable from `page.evaluate`, wrapped `__hangarZona` in-page to see the replies, and asserted `seen 1`, one reply ending `0a`, `writes 1`. Recorded verbatim above; deleted.
- **Files modified:** none kept. **Commit:** `80bc146` (message records the result).

**2. [Rule 1 - Plan defect] the probe's PUT BACK button is `install-put-back-click`**
- **Found during:** Task 3, the first run (all six failed: `strict mode violation: getByTestId('install-put-back') resolved to 2 elements`)
- **Issue:** the interfaces block gives the readout of `putBackState()` and the PUT BACK button the same testid.
- **Fix:** the readout keeps `install-put-back` (07-12 reads it); the button is `install-put-back-click`, with the comment. Deferred item 10 records it for 07-12.
- **Files modified:** `src/routes/dev/install/+page.svelte`, `e2e/install.e2e.ts`. **Commit:** `6f9d2e4`.

**3. [Rule 1 - Blocking, planned change on unlisted tests] `session.e2e.ts`'s seven cable tests given the answering module and SAFE-01 by class**
- **Found during:** Task 3, the first full run (7 failed, all `session.e2e.ts`: `writes()` 1 or 2 where 0 was asserted; test 14's region `""` after the knobs)
- **Issue:** the layout's `install.start()` - the plan's own line - makes every connect take the snapshot: one `SERIALNUMBER/FETCH` and two `CONFIG/FETCH`. Phase 6's cable tests asserted zero CHUNKS, and with no responder on those pages the fetches retried into `snapshot-failed`, whose title the store spoke into the one live region ~2.6 s after connect. The plan lists `session.e2e.ts` nowhere; no later plan edits it (07-11, 07-12 and 07-13 read it).
- **Fix:** `answering(page)` exposes the same responder with a state from the capture's identity (sx 0, sy 0, page 3); `onlyReads(page, zona, connects)` asserts zero `CONFIG/EXECUTE`, `PAGESTORE/EXECUTE` and `HEARTBEAT/EXECUTE`, `connects` serial fetches, `2 * connects` config fetches and `3 * connects` chunks; the probe's `session-writes` readout (re-read only when the session publishes, so it lags the fetches) is asserted to be a number no larger than the shim's; test 14 asserts `LIVE_SNAPSHOT_SAVED` as the region's text after connect with one utterance recorded, and one voice on the CURRENT sentence. Two header paragraphs updated. 14 titles, 16 runs, unchanged.
- **Files modified:** `e2e/session.e2e.ts`. **Commit:** `6f9d2e4`. Observed `14 passed (37.5s)` alone, then in the full runs.

**4. [Rule 1 - The spec's first draft] test 5 accepts the restore heartbeat's `sent` step after `lost`**
- **Found during:** Task 3, the second install run (`expected ["write-timer aborted 1"], received + "restore-page-change sent 1"`)
- **Issue:** the RAM leg's `finally` sends the restore heartbeat on every path; whether its step is recorded depends on whether the session's teardown has closed the port when the `finally` runs - two handlers of one disconnect event.
- **Fix:** `lostLines[0]` is `write-timer aborted 1`; the rest is either empty or exactly `["restore-page-change sent 1"]`; no `write-setup`; the record seen is printed (`steps at lost: … | restore-page-change sent 1` on every run so far).
- **Files modified:** `e2e/install.e2e.ts`. **Commit:** `6f9d2e4`.

**5. [Rule 1 - The plan's test 2 wording] one `restore-page-change` line per readout**
- **Found during:** Task 3, drafting
- **Issue:** the plan's test 2 says `install-steps` shows two `restore-page-change` lines with `sent` after the put-back, but the same plan's table says the readout is the LAST action's steps, and 07-07 fixed `lastSteps` at one action.
- **Fix:** the readout is as the table says; test 2 reads one restore line after the try and one after the put-back - two observed, in two readings.
- **Files modified:** `e2e/install.e2e.ts`. **Commit:** `6f9d2e4`.

### Departures recorded, not deviations from the plan

1. **The config-shape walk's silent-guard rose from 4 to 7**, as the plan's "at least seven" asked; observed 8.
2. **Test 4's first part also asserts `install-pacing` true**: a `partial` by timeout with no NACK escalates, by the store's own rule; the plan is silent there.
3. **Test 3 also exercises NOT NOW** (`install-keep-no`) before the keep; zero stores after it.
4. **The full suite ran three times.** Run 1: 76 passed, 7 failed (deviation 3). Run 2: 82 passed, 1 failed - `first-experience.e2e.ts:467`, the `ArrowLeft` at line 535 pressed while the call log shows `data-ready="false"`, which is Phase 6's deferred item 8 (owner 07-11), inherited by 07-01; it passed alone (`1 passed (16.5s)`). Run 3: 83 passed. The rule's one re-run was used on the suite, not on a vitest file.
5. **Test 5's `seen(CONFIG, EXECUTE)` is 0 at `lost`**: the shim records the causing write and never hands it to the responder (decision 2 above); the plan did not say which model to pick.
6. **A fourth commit, `8e749a0`, rewords one header sentence** in `install.e2e.ts` that had named a Playwright project by its engine; a comment-only change, formatted and linted, no browser rerun needed. The three task commits are `80bc146`, `31397ee` and `6f9d2e4`.

## Known stubs

None. The probe renders the store's fields verbatim and no component; `install-steps` reads `install.lastSteps` on phase and lock changes rather than continuously, by design and with the comment.

## Requirements

**`requirements-contributed: [SAFE-01, SAFE-03, SAFE-07, SAFE-09]`** - contributed, not completed; every Phase 7 criterion carries a *(hardware)* half and 07-13 closes them. SAFE-01: a class count on a real page - zero `CONFIG/EXECUTE` and `PAGESTORE/EXECUTE` over a connect-and-snapshot journey (install test 1) and over Phase 6's whole visitor journeys (session tests 5 to 11 and 14 through `onlyReads`), every write elsewhere equal to the clicked number. SAFE-03: the snapshot before any control enables, durable, with the record winning after a replug (tests 1 and 5). SAFE-07: `partial` named from the acknowledgements with both the retry and PUT BACK offered (test 4). SAFE-09: three attempts and no more (tests 4 and 6), a refusal never retried (test 4), a lost link ending `lost` with PUT BACK `needs-zona` (test 5). `REQUIREMENTS.md` is not edited here, as no Phase 7 plan before 07-13 edits it.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 9** - after a connect on a module that answers, the session's connected sentence is queued and never rendered: the store's `LIVE_SNAPSHOT_SAVED` lands inside the same 500 ms window and the coalescer keeps the last line. Observed in session test 14. Owner 07-11 or 07-13's runbook. No code here.
- **Item 10** - the plan's testid table names the readout and the button `install-put-back`; the button is `install-put-back-click`. Fixed here; recorded for 07-12.

Item 8 (Phase 6's, the pre-hydration key press at `first-experience.e2e.ts:535`) fired once in this plan's second full run and is unchanged; its owner is still 07-11.

## Next plan readiness

07-09 (the allow-list mutations observed, then `PutBack`, `KeepConfirm` and `InstallState`) starts from: quick **73 / 772**, sweep `3 13`, e2e **83** (`PREV_E2E`), svelte-check 542 / 0. The three permitted paths and the raised walk guard are in place for its mutations; the probe's testids are as the plan's table says except the PUT BACK click. 07-12's `zona.script()` exists and is read on every call; its `delayAckMs` and `rig` faults exist and are untested by any browser test yet (07-12's). The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every byte a page wrote in this plan landed in the shim, and the Node side counted each by class.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T14:10:00Z.

- FOUND: `e2e/fake-zona.ts` (274 lines; contains `exposeFunction` 3 times and `fixtures/synthetic` once; imports `../src/lib/protocol`)
- FOUND: `e2e/fake-serial.ts` (389 lines; `__hangarZona` twice - the declaration and the read in `write()`)
- FOUND: `src/routes/dev/install/+page.svelte` (264 lines; `install-trace` once; names no sibling probe path)
- FOUND: `src/routes/+layout.svelte` (`install.start` once, in the `onMount` after `session.start()`)
- FOUND: `src/lib/config-shape.spec.ts` (three new permitted paths; 14 passed; the walk read 8 of 8)
- FOUND: `e2e/install.e2e.ts` (721 lines; `install-trace` once; six titles; `test.slow()` once; no title contains `failed`)
- FOUND: `e2e/session.e2e.ts` (14 titles, unchanged count; `answering()` and `onlyReads()`)
- FOUND: `.planning/phases/07-install-flow/07-08-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (items 9 and 10 appended; eleven headings)
- FOUND: commits `80bc146` (task 1), `31397ee` (task 2), `6f9d2e4` (task 3 and the testid fix), `8e749a0` (the header sentence)
- PASS: quick 73 / 772 through check-counts; sweep 3 13; svelte-check 542 / 0; `npm run lint` exit 0; `--list` 83 in 12 files; full suite 83 passed at `--workers 3` (73 + 10); no listener left on 4173; `test-results/` removed after every run
- PASS: two negative checks red as planned, each restored to its pre-mutation hash with `git diff --quiet` clean
- engine names in the two new e2e sources and the probe: 0 (the one occurrence in `fake-serial.ts` pre-dates this plan); attribution lines in the four commit messages: 0
