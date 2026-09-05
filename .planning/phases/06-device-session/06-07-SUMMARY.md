---
phase: 06-device-session
plan: 07
subsystem: testing
tags: [fake-serial, playwright, probe-route, silent-reconnect, port-busy, unplug, replug, forget, never-writes, capture, CONN-04, CONN-06, SAFE-01]

# Dependency graph
requires:
  - "e2e/fake-serial.ts (06-06) — the scripted serial on Navigator.prototype, the both-target bubble with an own target, grant / pick / busy / unplug / replug / feed / forgotten / writes"
  - "src/routes/dev/session/+page.svelte (06-06) — the probe's testids: session-phase, session-identity, session-failure-title / -detail / -steps, session-can-forget, session-writes; the three buttons"
  - "src/lib/device/session.svelte.ts (06-03, 06-04) — the offer that never opens, the adopted-port path with no chooser, the connect handler matching by getInfo() and adopting the NEW object, forget() closing before it revokes"
  - "src/lib/transport/transport.ts (02-01) — failureCopy('port-busy'): the Grid Editor title and detail, the six steps; classifyOpenError's NetworkError branch"
  - "src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json (02-04) — 119 rx chunks from a ZONA RevH on firmware 1.5.5, active page 3, read in Node and fed into the fake port"
  - "06-RESEARCH.md § The Replug Identity Trap — why the assertion is about a different object"
  - "06-04-SUMMARY.md — the node-level replug test and its negative, which this plan repeats in a browser"
  - "06-06-SUMMARY.md — PREV_FILES / PREV_TESTS 68 / 715, PREV_E2E 66, the five-name block"
provides:
  - "e2e/fake-serial.ts: requests() and openCount(i) — the two numbers that make 'one click, no picker' and 'the offer never opens the port' falsifiable"
  - "e2e/session.e2e.ts: nine browser gates — 06-06's four plus the five the cable drives: the offer, the busy port, the unplug, the replug, a whole visit that writes nothing"
  - "identifyWith(page, index): the capture fed one chunk at a time until the session reads connected, returning the count; connectGranted(page): the road every cable test starts on"
  - "The fact that identification needs 3 of the capture's 119 rx chunks"
  - "PREV_E2E re-measured at 71 by this plan"
affects:
  - "06-13 — re-measures PREV_E2E from 71; the shipped chrome's tests can reuse identifyWith and the shim's two new counters"
  - "06-14 — SESSION-RUNBOOK row B (unplug and replug) is what closes the circle this plan's replug test states it cannot"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 7/14"

tech-stack:
  added: []
  patterns:
    - "A hardware capture is fed into a fake port ONE CHUNK AT A TIME, in recorded order, until the state under test is reached, and the count is recorded as a fact about the capture; replaying the whole file would hide how little of it the behaviour needs"
    - "A replug is asserted by a PAIR of open counts, not by a phase: the dead object's count unchanged and the new object's at one is the only observation that says which port the click opened"
    - "A counter that a passing test rests on is made to report a non-zero number once, deliberately, by planting the violation it counts, before the zero is trusted; the number it reported is quoted"
    - "A pre-load fixture state is an init script added AFTER the shim's, so the browser's own load-time call (getPorts) finds it with no test code in the page yet"

key-files:
  created:
    - ".planning/phases/06-device-session/06-07-SUMMARY.md"
  modified:
    - "e2e/fake-serial.ts"
    - "e2e/session.e2e.ts"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The busy-port test grants AFTER load and goes through the chooser, so requests() is 1 and the plan's pick(0) has a job: a port granted before load takes the adopted path with no requestPort() at all, and pick(0) would be dead code the test could not tell from a live one"
  - "identifyWith polls the page for one heartbeat period after every chunk rather than feeding the whole capture and waiting once, so the recorded count is the first chunk that COMPLETED identification and not whichever chunk the poll happened to notice"
  - "The whole-visit test reads writes() exactly once, at the end, with a message on the assertion, so the planted-write negative quotes the journey's total rather than the first intermediate zero that broke"
  - "The replug negative's second symptom - the click asking for a picker - is not reached in a browser: Playwright stops the test at the phase assertion, so that half rests on 06-04 test 10's node negative (requestPort 1), stated here rather than assumed"

requirements-completed: []
requirements-contributed: [CONN-04, CONN-06, SAFE-01]

# Metrics
duration: 18min
completed: 2026-09-05
---

# Phase 6 Plan 07: The offer, the busy port, the unplug, the replug, and a visit that writes nothing Summary

**The five things a cable does are now browser tests with no cable. A ZONA granted before load is offered on load without being opened (`openCount(0)` is 0 at `detected`) and one click connects it with the capture's own firmware and page on the readout and `requests()` at 0 - no picker at any point. A port held by another program lands in `port-busy` with the Grid Editor title, the six steps in order from the tray icon to `Click CONNECT ZONA again`, and the browser's own `Failed to open serial port.` nowhere on the page. `unplug(0)` moves a live session to `unplugged-while-connected` in the same turn with no click and no navigation. `replug()` mints a NEW port and the session takes the offer on THAT object: `openCount(0)` stays at 1, `openCount(1)` goes 0 to 1, `requests()` still 0. And a whole visit - offer, connect, identify, unplug, replug, connect, identify, revoke - ends `forgotten`, unlisted by `getPorts()`, with `writes()` at 0. Identification ran on real captured bytes and needed **3 of the capture's 119 rx chunks**. Both negatives were observed red in a browser and restored byte-identical: a write planted in `#openAdopted` made `writes()` report **2** and the whole-visit test red; the connect handler comparing object identity left the replug test at `unplugged-while-connected` where `detected` was expected. Five untagged titles: e2e is 66 + 5 = 71, webkit-phone stays at 9. Quick stays 68 / 715, sweep `3 13`.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. **`PREV_E2E` re-measured here.**

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` on this tree at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13   |

### Observed totals: previous SUMMARY plus this plan's delta

06-06 left the tree at **68 files / 715 tests**. This plan adds **+0 files / +0 tests** to quick - it adds no unit test - so quick stands at **68 / 715**, still `BASE_FILES + 2` and `BASE_TESTS + 24`. Sweep is unchanged at **`3 13`**. E2E is **66 + 5 = 71**: five titles, none tagged, so five on chromium and nothing new on webkit-phone.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 715
  check-counts: observed 68 files, 715 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  counted 1296 combinations in 2.7s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npm run test:e2e 2>&1 | tee .tmp-e2e/06-07-suite.log | node scripts/check-counts.mjs --playwright 71
  check-counts: observed 71 tests passed
  check-counts: matches the expected counts
  71 passed (1.2m)

npx playwright test e2e/session.e2e.ts --project chromium       ->  9 passed (26.6s)
npx playwright test --list                                      ->  Total: 71 tests in 11 files
npx playwright test --project webkit-phone --list               ->  Total: 9 tests in 3 files
npx playwright test e2e/session.e2e.ts --project chromium --list -> Total: 9 tests in 1 file

npm run check 2>&1 | grep -Ei "error|warning"
  1788579877595 COMPLETED 525 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` stays at **525 files**: no file under `src/` changed. After every Playwright run: **no LISTENING socket on 4173 and no `workerd.exe` or `wrangler` process** - Playwright shut down its own webServer tree each time. `test-results/` was removed by hand after each run (deferred item 5).

## Task 1 — the offer, the busy port, and the immediate unplug (commit `21a0c2f`)

### The shim's two new numbers

`requests()` counts every `requestPort()` call, incremented before the scripted outcome is decided so a synchronous throw counts as a call. `openCount(i)` counts every `open()` on port `i` the same way, a refused open included: the busy test's port reports 1, which is the open that was attempted and refused. Both are on `window.__hangarSerial` with the `HangarSerial` interface, so a test types them without `any`.

### The capture, fed one chunk at a time

Read in Node at module scope, filtered exactly as `FakeTransport.fromCapture` filters - `dir === "rx" && kind === "chunk"` - and mapped through `Buffer.from(hex, "hex")` to `number[]`. The firmware and the page the readout is asserted against come from the same file's `identity` block through `firmwareText`, never from a literal in the test.

`identifyWith(page, index)` pushes one chunk, then polls `session-phase` in the page for up to 250 ms (one heartbeat period, 10 ms steps), and returns the count at the first chunk after which the phase reads `connected`. It throws if the whole capture goes in without identification. **Identification needed 3 of 119 rx chunks**, printed by test 5 on both runs:

```
identification needed 3 of 119 rx chunks
```

That is a fact about the capture worth keeping: chunk 0 carries the module's `DEBUGTEXT` frame, and chunks 1 and 2 complete the first `HEARTBEAT` frame with its piggybacked `PAGEACTIVE` report - the ZONA heartbeat type 1 with HWCFG 161 and the active page together, which is all `identify()` needs. The remaining 116 chunks are the same heartbeat four times a second plus the skeleton run's own traffic.

### The three tests

**5. a granted ZONA is offered on load and one click connects it with no picker** - `grantBeforeLoad(page)` adds an init script after the shim's, so `getPorts()` finds the port when `start()` asks. Precondition `{ hasSerial: true, listed: 1 }`. Then `detected` with **`openCount(0) === 0`** - the offer opened nothing (D-06) - identity `none`, `canForget` true. Click, capture, `connected`; the identity line contains `ZONA`, `fw 1.5.5`, `page 3` (from the capture's identity block) and `others none`; title `none`. **`requests() === 0`** and `openCount(0) === 1`. Zero writes, `session-writes` reads `0`, no console errors.

**6. a port held by another program names Grid Editor and gives the recovery in order** - `idle` first (nothing granted at load), then in one `evaluate`: `grant()`, `busy(i)`, `pick(i)`. Click: `port-busy`, title and detail equal to `failureCopy("port-busy", undefined, CONNECT_LABEL)`'s, the detail names Grid Editor, and the `<li>` list `toHaveText` against the six steps as an ordered array - the tray-icon quit first, `Click CONNECT ZONA again` sixth. `body` text does **not** contain `Failed to open serial port.` - the shim raised it, `failureRaw` holds it, only the `unknown` row would render it. `requests() === 1`, `openCount(0) === 1`. Zero writes.

**7. unplugging changes the page immediately, with no click** - `connectGranted(page)` (detected, click, capture, connected), then `unplug(0)` and the assertions with nothing in between: `unplugged-while-connected`, identity `none`, title `none`, steps `none`, the detail containing `Nothing was written`, `canForget` still true (the dead port stays adopted so the revoke control can act on it). `requests() === 0`, zero writes.

The path the unplug takes in a real transport is worth recording: the fake fires at the port first, so `WebSerialTransport`'s port-level `disconnect` handler runs before the session's serial-level one, closes the transport and calls `onClose`, and `#onTransportClosed` is what publishes S5; the session's own `#onSerialDisconnect` then finds no transport and the phase already set, and returns. Both paths land in the same state, which is what the net under the listener exists for.

## Task 2 — the replug, and a whole visit that writes nothing (commit `8562b18`)

### The replug, proven by a pair of numbers

**8. replugging offers the connection back, and the offer opens the new port** - live session, `unplug(0)`, S5, `openCount(0)` recorded as **1**. `replug()` returns **1** (the new index); `detected` again with `openCount(1)` at **0** and no failure. Click, the capture into port **1**, `connected` with `fw 1.5.5` on the readout, `requests()` still **0**. Then the pair: **`openCount(0)` is still 1 and `openCount(1)` is 1**. A session that reused its stored reference would show `openCount(0)` at 2 and `openCount(1)` at 0 - or a picker.

### The whole visit

**9. a whole visit writes nothing and can revoke its own permission** - grant, load, connect, identify (3 chunks), `unplug(0)`, `replug()`, connect, identify, `canForget` true, click `session-forget`. `forgotten`; identity `none`; `canForget` false; `{ forgotten: true, listed: 0 }` from `forgotten(1)` and `getPorts()`; `requests() === 0` across the whole visit; and **`writes() === 0`**, read once at the end with the message `chunks written across the whole visit`, plus `session-writes` reading `0`. No console errors.

### Negative check 1 — the never-writes counter can go red

`void transport.write(new Uint8Array([0]));` planted after `this.#transport = transport;` in `#openAdopted`, by the scratchpad runner (`mutate-cmd.mjs`, which restores in a `finally` and reports byte-identity), running test 9 alone:

```
=== NEGATIVE 1: a write planted in #openAdopted - test 5 must go red with a non-zero writes(): src/lib/device/session.svelte.ts
    replace "this.#transport = transport;"
    with    "this.#transport = transport; void transport.write(new Uint8Array([0]))"
  x  1 [chromium] › e2e\session.e2e.ts:523:3 › the session with a granted ZONA on the cable › a whole visit writes nothing and can revoke its own permission (1.9s)
    Error: chunks written across the whole visit
    expect(received).toBe(expected) // Object.is equality
    Expected: 0
    Received: 2
  1 failed
    exit code: 1
    restored byte-identical: true
```

**`writes()` reported 2** - one planted write per open, and the visit opens twice (the granted port, then the replugged one) - **and test 9 was red.** Restored; the full chromium run of the file is 9 passed and the counter is 0 again. This is a different counter from 06-04's node-side one (which counts on `FakeTransport`), which is why 06-04 observing its own halves red did not cover this one.

### Negative check 2 — the replug identity comparison, in a browser

`if (!port || !isZonaPort(port)) return;` in `#onSerialConnect` replaced by `if (ev.target !== this.#port) return;` - the same mutation 06-04 applied to the node test - running test 8 alone:

```
=== NEGATIVE 2: the connect handler compares object identity - test 4 must go red: src/lib/device/session.svelte.ts
    replace "if (!port || !isZonaPort(port)) return;"
    with    "if (ev.target !== this.#port) return;"
  x  1 [chromium] › e2e\session.e2e.ts:480:3 › the session with a granted ZONA on the cable › replugging offers the connection back, and the offer opens the new port (6.2s)
    Error: expect(locator).toHaveText(expected) failed
    Expected: "detected"
    Received: "unplugged-while-connected"
           - unexpected value "unplugged-while-connected"
  1 failed
    exit code: 1
    restored byte-identical: true
```

**Red, for exactly the symptom a visitor would report as "it just stops working after you unplug it"**: the replugged port arrives as a new object, the comparison against the dead one never matches, the offer never returns, and the page sits on the unplugged sentence for the five seconds the assertion waited. The plan's second symptom - the next click asking for a picker - is not reached here, because Playwright stops the test at the first failed locator assertion; that half is 06-04 test 10's node negative (`requestPort` 1). Restored; 9 passed.

## Deviations from Plan

### 1. [Process] The busy-port test grants after load, not before

**Found during:** task 1, writing test 6. **Issue:** the plan's sequence `grant()`, `busy(0)`, `pick(0)` only does what it says if the click goes through the chooser; a port granted before load is adopted by the offer and the click takes the adopted path with no `requestPort()`, leaving `pick(0)` as dead code the test could not distinguish from live code. **Resolution:** the page loads to `idle` (asserted as the precondition), the three calls run in one `evaluate`, and the test asserts `requests() === 1` so the path taken is stated. **Files:** `e2e/session.e2e.ts`. **Commit:** `21a0c2f`.

### 2. [Process] The replug negative's picker symptom is stated, not observed

The plan says the click "asks for a picker" under the mutation. Playwright aborts a test at its first failed `expect(locator)`, which is the phase assertion, so the click never runs. Recorded above with the half that does cover it (06-04's node negative) rather than claimed.

### 3. [Process] The runner's `--grep` is written without spaces

`mutate-cmd.mjs` hands its command to `spawnSync` with `shell: true`, which concatenates rather than quotes arguments (Node's DEP0190 warning, printed on both runs). `--grep=visit` and `--grep=replugging` select tests 9 and 8 with no space to lose. Scratchpad only; nothing committed.

### 4. [Process] A Phase 7 commit landed mid-run

`048eb35` (*docs(07): plan revision 2 …*) landed sixteen seconds after task 2's commit, and the checker's working-tree edits under `.planning/phases/07-install-flow/` were visible in `git status` between the two. Nothing there was read, staged or formatted here; every commit used `--only -- <paths>`.

### 5. [Process] `test-results/` again

Removed by hand three times - after task 1's green run (`.last-run.json`), after the two red negatives (an `error-context.md` directory each), and after the full suite. Deferred item 5 stands; nothing new to add to it.

### 6. [Rule 1 - Bug] STATE.md's per-plan table was missing 06-06's row

**Found during:** the STATE.md update. **Issue:** the table's last row was `Phase 06 P05`; 06-06 updated the velocity block, the by-phase row and the trend but never appended its own per-plan row, so the block's own "recomputed from the per-plan table below" sentence pointed at a table one row short. **Fix:** `Phase 06 P06 | 19 min | 3 tasks | 4 files` added from 06-06-SUMMARY.md's frontmatter and key-files, beside this plan's row. **Files:** `.planning/STATE.md`.

No deferred item was added: nothing out of scope was found.

## Requirements

**`requirements-contributed: [CONN-04, CONN-06, SAFE-01]`** - contributed, not completed, on the phase's convention. CONN-04's recovery copy and CONN-06's four hardware states are proven in a browser on a probe, and SAFE-01 is a zero over a whole visit against a counter that was made to read 2 first; no shipped chrome renders any of it until 06-10 and 06-11, and the shim's own header says the replug behaviour is a source reading until SESSION-RUNBOOK row B (06-14) closes the circle. None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. Every assertion reads a live session field or a shim counter; the capture is the committed hardware file, never an inlined heartbeat.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs; **`PREV_E2E` is 71, measured by 06-07**.
- `PREV_FILES` / `PREV_TESTS` for plan 06-08 are **68 / 715**.
- `e2e/fake-serial.ts`: `requests()` and `openCount(i)` beside the rest. `e2e/session.e2e.ts`: `identifyWith(page, index)` feeds the capture until `connected` and returns the chunk count (3); `connectGranted(page)` is detected, click, capture, connected; `grantBeforeLoad(page)` is a `page.addInitScript` added after the context's shim. A test that needs a connected session in the shipped chrome (06-13) can lift all three.
- The unplug lands in S5 through the transport's `onClose` net before the session's own listener sees the event; both paths are exercised by test 7.
- Every Playwright run creates `test-results/` (deferred item 5); remove it before the tree is called clean.

## Self-Check: PASSED

Files claimed, verified present:

- `e2e/fake-serial.ts` - FOUND (modified)
- `e2e/session.e2e.ts` - FOUND (modified)
- `.planning/phases/06-device-session/06-07-SUMMARY.md` - FOUND

Files claimed absent:

- `test-results/` - ABSENT

Commits claimed, verified in `git log`:

- `21a0c2f` test(06-07): the offer, the busy port and the immediate unplug, in a browser - FOUND
- `8562b18` test(06-07): the replug, and a whole visit that writes nothing - FOUND
