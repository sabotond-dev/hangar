---
phase: 07-install-flow
plan: 07
subsystem: device
tags: [install-store, keep-on-device, PAGESTORE, re-fetch-proof, taxonomy, partial, pacing-escalation, slow-line, fake-timers, SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-06-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 73 / 762, sweep `3 13`, svelte-check 540; install.svelte.ts at three static specifiers; the tee, `connected: true` ports, the lockstep clock; AbortedError classified before the generation check; `steps` public; `#fail` announcing titles; InstallEnv.sleep deferred to this plan"
  - "07-CONTEXT.md D-05 / SAFE-06 (the confirmation names the rig), D-06 (installed only on ACK), D-07 (honest speed), D-12 (the re-fetch proof before `kept`), D-19 as amended (0 ms pacing escalating to 10 ms on a no-NACK timeout; three re-fetch rounds after the first heartbeat)"
  - "07-RESEARCH.md Pitfall 3 (pacing), Pitfall 6 (three rounds; the post-store reload timing is unknown), Pitfall 7 (never retry a NACK), Pitfall 8 (N acknowledgements on a rig), Anti-Patterns (classify by instanceof, never by message)"
  - "07-UI-SPEC.md I3 (three legs; `Still writing.` once at 2000 ms), I5, I6, I10, I11, I12, I13, Z-04 (PUT BACK stores after a keep, no confirmation), Z-09 (the arithmetic), Z-19"
  - "src/lib/transport/queue.ts (id per attempt; waiter armed before the write; RETRY_ATTEMPTS 3; backoff 120 * (attempt + 1)); fake.ts (`dropped()` returns at the FIRST due fault; `due()` counts only when reached; `delay` delays every match); sequence.ts fetchBoth 'refetch'; fixtures/synthetic.ts (flash, powerCycle, rigResponder, the NACK, configReportFrame); src/lib/protocol/constants.ts (executeMs 250, fetchMs 300, pagestoreMs 3000, DESKTOP_PRE_SEND_DELAY_MS 10); docs/SKELETON-RESULTS.md (PAGESTORE dropped with no NACK under bulk NVM)"
provides:
  - "src/lib/device/install.svelte.ts - all fourteen phases reachable: keepOnDevice and #storeLeg (one PAGESTORE/EXECUTE through the queue under the descriptor's pagestoreMs, then the D-12 proof: the ZONA's next heartbeat resolved from the onClass sink, then fetchBoth 'refetch' for at most REFETCH_ROUNDS 3 with retryBackoffMs between, kept on the first byte-identical pair; mismatch -> kept-mismatch; the queue's timeout -> unconfirmed; AbortedError -> lost); putBack's store leg after a keep this session (restored clears keptThisSession; restored-unconfirmed leaves it); openConfirm / dismissConfirm with the four exits (NOT NOW, Escape via dismissConfirm, a disarming knob move in observeConfig, a session drop in onConnection); keepReason(capable) as the seven-row table; putBackState() enabled only with `snapshot !== undefined`; #classify widened by instanceof to partial off the recorded write-timer step; #escalatePacing to DESKTOP_PRE_SEND_DELAY_MS with the queue rebuilt (pacingEscalated); #armSlow / #disarmSlow as a setTimeout(2000) speaking LIVE_STILL_WRITING once; the page-change re-snapshot from the sink (#pageCheck); InstallEnv.sleep; refetchRounds; lastSteps"
  - "src/lib/device/install.spec.ts 18 - ten new gates over the flash leg, the taxonomy and the bounds; the harness gains fakeSerial's listener pair with fire(), a tee that logs received classes and the clock at every write, connected({ others, wrap, sleep, settle }), reconnect(), throughStore(), triedOn(), dropAcks234() with the descending-order comment"
  - "src/lib/protocol/constants.ts - one clause on DESKTOP_PRE_SEND_DELAY_MS: since Phase 7 the install store reads it as the escalation target"
affects:
  - "07-08 widens the chunk-guard allow-list and builds the /dev/install/ probe, which shows pacingEscalated and walks the fourteen states; its shim answers with the real fake and must feed a heartbeat after every PAGESTORE acknowledgement (the store waits for one) and may answer a re-fetch with different strings for kept-mismatch"
  - "07-09 / 07-10 / 07-11 bind keepReason(capable), putBackState(), openConfirm / dismissConfirm / keepOnDevice, confirmOpen, slow, leg / action (RESTORED's caption during a put-back's store leg is `action === 'put-back' && leg === 'store'`), landed / failed, keptThisSession (PUT_BACK_LINE_AFTER_KEEP)"
  - "07-13's runbook rows: refetchRounds (how many rounds the proof took) and pacingEscalated (whether the escalation ever fired) are the two measurements this plan records and nothing renders"
  - ".planning/phases/07-install-flow/deferred-items.md - item 8 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 7/13"

tech-stack:
  added: []
  patterns:
    - "A proof waits for the device's own clock, not the host's: after an acknowledgement that starts a reload, the store resolves a promise from the class sink on the module's next heartbeat and only then reads back - a heartbeat waiter list, resolved by the sink, rejected by the connection's close with the queue's own AbortedError so one catch names both"
    - "A bounded proof that records its own cost: refetchRounds is written every round and rendered nowhere, so a runbook can replace a guess (three) with a measurement without a code change"
    - "One queue rebuilt inside a connection only by a named rule: abort the old, unsubscribe the sink, build the new with the changed option, re-subscribe - and the leg that triggered it still finishes its finally on the old queue, because sendImmediate works after abort by design"
    - "A harness that yields one macrotask before it first moves the clock: an action's own microtasks (the phase going to writing, the queue stamping sentAt) then run at the clock reading the caller took, and a pacing gap is measured where the frame leaves the transport rather than believed from an option"
    - "A fault list whose order is load-bearing is built by one helper with the reason beside it (dropAcks234), so three tests cannot drift into the ascending order that would silently land"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-07-SUMMARY.md"
  modified:
    - "src/lib/device/install.svelte.ts"
    - "src/lib/device/install.spec.ts"
    - "src/lib/protocol/constants.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The store leg's catch classifies AbortedError BEFORE the generation check, exactly as 07-06's #ramLeg does and against the plan's interfaces sketch, which repeated the ordering 07-06 had already found could never land `lost`; #storeLeg also sets #inFlight so 'closed' leaves the phase to that catch"
  - "The heartbeat the proof waits for is the ZONA's own, by the class's SX/SY against identity.zona - not any HEARTBEAT class - because on a rig a chained module's heartbeat would otherwise satisfy the wait before the ZONA had reloaded"
  - "putBack refuses when the module's reported page differs from snapshotPage: the page-change re-snapshot keeps them equal, and if it could not, a cross-page write of one page's original onto another is the one thing PUT BACK must never do (Pitfall 4); a refusal is the honest answer"
  - "A put-back's steps span both its legs (the RAM leg resets them, the store leg appends), and a keep resets them at the click, so `lastSteps` is always one action; the pacing rule and the partial classification read that one action"
  - "Test 9 asserts the re-fetch's sentAt is at or after the feed's clock reading, not strictly after: the send is the microtask right after the feed and shares its clock reading; the harness pauses 20 ms between the acknowledgement and the feed, so a store that did not wait sends strictly before it and the check still turns red (observed)"
  - "Test 12 does not assert the fake's flash after an unconfirmed put-back store: zonaResponder copies RAM into flash on every PAGESTORE/EXECUTE before the fault drops its acknowledgement, so the fake's flash holds exactly what HANGAR cannot know - which is I12's sentence"
  - "Tasks 1 and 2 landed in ONE commit (c4f7f54): both edit install.svelte.ts and task 1's interfaces block names task 2's members (#armSlow, #classify's table, the escalation); constants.ts's one clause rode with it. Task 3 is 2353aa0"
  - "storeToFlash's `id` stays unread and its lint directive stays (deferred item 2): the plan's store leg sends P.storePage() through the queue directly, as its sketch does, so this plan does not read `id`; the item's owner is the first plan that does"

requirements-completed: []
requirements-contributed: [SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09]

# Metrics
duration: 26min
completed: 2026-09-05
---

# Phase 7 Plan 07: The install store - KEEP ON DEVICE with the read-back proof, the taxonomy, the bounds Summary

**The install store is finished: every one of 07-UI-SPEC's fourteen phases is reachable, and the destructive one is a proof rather than a belief. `keepOnDevice()` sends one `PAGESTORE/EXECUTE` through the connection's one queue under the descriptor's 3000 ms, then waits for the ZONA's next heartbeat - resolved from the same `onClass` sink that feeds the queue, because the acknowledgement is sent by the callback that starts the module's page reload - and only then re-fetches both strings, for at most three rounds with `retryBackoffMs` between them, saying `kept` on the first byte-identical pair and `kept-mismatch` when the rounds run out. A store that never acknowledges is `unconfirmed` with `KEEP ON DEVICE` live again; a `PUT BACK` after a keep stores too and lands `restored` only when its own proof passes, `restored-unconfirmed` otherwise with `LIVE_RESTORED` unspoken. The RAM taxonomy is decided by `instanceof` on the queue's own classes and by the recorded `write-timer` step - `partial` names Timer and Setup, `nothing-landed` names the cause, `lost` names the unplug - and a timeout with no NACK anywhere in the action escalates the next queue's pre-send gap to the desktop's 10 ms and rebuilds it. The 2000 ms line is a `setTimeout` on the store that speaks once; the confirmation closes on a disarming knob move and on a session drop; a page change seen from the heartbeat re-snapshots for the new page. `install.spec.ts` 8 -> 18 in node against the tee over `FakeTransport`, with the heartbeats fed through `push`, faults listed in the order `fake.ts` needs, and the pacing gap measured at the transport. Seven negative checks: six observed red as planned, the seventh unobservable as a `#recomputeArmed` widening (a second guard, `lastWritten`, stands in front of it) and observed red as a direct assignment instead. Quick 73 / 762 -> 73 / 772, sweep `3 13`, svelte-check 540 / 0. No device was connected to, looked for or written to.**

## The five-name carry-forward block

Carried verbatim from 07-06, which carried it from 07-01's measurement on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                                              |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds **0** spec files. Tree: **73** (+ 4)                                                                                 |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 + 2, 07-02 + 5, 07-03 + 13, 07-04 + 4, 07-05 + 6, 07-06 + 8 (762); this plan adds **10** (`install.spec.ts`). Tree: **772** (+ 48) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                                                  |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no component, no build; the plan does not ask)  |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                                        |

`BASE_CHECK` (provenance only): **540 files, 0 errors, 0 warnings** after both commits (no file added; 540 unchanged from 07-06).

### Observed totals: previous SUMMARY plus this plan's delta

07-06 left the tree at **73 / 762**. This plan's delta is **+0 files / +10 tests**.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 73 772     # after 2353aa0
  check-counts: observed 73 files, 772 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run check 2>&1 | grep -Ei "error|warning"
  1788613309141 COMPLETED 540 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (eslint silent; exit 0)

npx vitest run --project server src/lib/device/install.spec.ts
  Tests  18 passed (18)
```

`format-parity.spec.ts` did not flake; nothing was re-run.

### Per-file counts after this plan

| File                               | Before | After  | Plan said |
| ---------------------------------- | ------ | ------ | --------- |
| `src/lib/device/install.spec.ts`   | 8      | **18** | 18        |
| `src/lib/device/session.spec.ts`   | 21     | **21** | unedited  |
| `src/lib/device/` (all seven specs) | 59    | **69** | -         |

## Tasks 1 and 2 - the flash leg, the proof, the taxonomy, the pacing rule, the slow line, the re-snapshot (commit `c4f7f54`)

`src/lib/device/install.svelte.ts`, 641 -> **1097 lines**. The header gains the explanations the plan asked to be said where a reader would otherwise undo them: why the re-fetch waits for a heartbeat first (the ACK is sent by the callback that starts the reload; `CONFIG/FETCH` has no bulk guard), why `kept-mismatch` exists at all (unreachable on healthy hardware; it exists so the failure is never silent), why `PUT BACK` after a keep stores too and gets no confirmation (Z-04's two sentences), why the taxonomy is by type and never by message (the vendored `TRANSIENT_WRITE` regex matches `AbortedError`'s "interrupted"), why the pre-send gap escalates only on a no-NACK timeout, and why the 2000 ms line is a `setTimeout` on the store. `constants.ts`'s `DESKTOP_PRE_SEND_DELAY_MS` comment changed by one clause, quoted below; nothing else in that file changed.

### The scans, quoted, on the comment-stripped source (47,686 raw bytes, 18,903 stripped)

```
from " specifiers: ["./install-copy","./snapshot","./session.svelte"]
.onData( occurrences: 0
.write( occurrences: 0
setInterval occurrences: 0
$derived occurrences: 0
navigator.userAgent occurrences: 0
instanceof occurrences: 4               (#ramLeg's catch; #storeLeg's catch; #classify's two)
instanceof inside #classify: 2
setTimeout occurrences: 3               (defaultSleep; #armSlow; the type of #slowTimer)
DESKTOP_PRE_SEND_DELAY_MS occurrences: 1 (the escalation, read from the awaited module)
REFETCH_ROUNDS occurrences: 2           (the constant and the loop bound)
regex literals: 0
kept-mismatch present: true
```

### `#storeLeg`'s wait and loop, quoted

```ts
      await q.request(P.storePage(), "store");
      if (gen !== this.#generation) return false;
      // The ACK is sent by the success callback that STARTS the page reload
      // (grid_decode.c:947-961). Wait for the module's next heartbeat, then
      // prove the bytes - see the header for why a fetch that races the
      // reload would call a good store failed.
      await this.#nextHeartbeat();
      if (gen !== this.#generation) return false;
      for (let round = 0; round < REFETCH_ROUNDS; round++) {
        const after = await T.fetchBoth(
          q,
          this.#session.identity ?? id,
          "refetch",
        );
        if (gen !== this.#generation) return false;
        this.refetchRounds = round + 1;
        if (
          after.setup.actionString === sent.setup &&
          after.timer.actionString === sent.timer
        ) {
          return "kept";
        }
        await this.#sleep(P.retryBackoffMs(round));
      }
      return "mismatch";
```

`REFETCH_ROUNDS = 3`. The catch: `AbortedError` -> `#fail("lost", "aborted", lostBlock(true, TRY_ON_LABEL).title)` and `false`, BEFORE the generation check (see deviation 1); a stale generation -> `false`; anything else - the queue's 3000 ms timeout, a store dropped under a bulk NVM operation with no NACK ever - -> `"unconfirmed"`. The finally disarms the slow line, clears `#inFlight`, releases `writeLock`.

### `keepReason`, quoted - one function, the seven rows in order

```ts
  keepReason(capable: boolean): KeepReason | undefined {
    if (!capable) return "incapable";
    const phase = this.phase;
    if (phase === "partial") return "after-partial";
    if (phase === "kept") return "already-kept";
    if (phase === "kept-mismatch") return "after-mismatch";
    if (phase === "settled" || phase === "unconfirmed") {
      return this.armed ? undefined : "knobs-moved";
    }
    return "never-tried";
  }
```

| Condition, first match wins | Reason |
|---|---|
| `!capable` | `incapable` |
| `phase === "partial"` | `after-partial` |
| `phase === "kept"` | `already-kept` |
| `phase === "kept-mismatch"` | `after-mismatch` |
| `settled` or `unconfirmed`, `armed` | undefined - live |
| `settled` or `unconfirmed`, not `armed` | `knobs-moved` |
| anything else | `never-tried` |

`openConfirm()` is refused unless `keepReason(capable)` is undefined, with `capable` read off the session's phase (`unsupported` / `insecure`). `putBackState()`: `snapshot !== undefined` -> `enabled` when the session is `connected`, else `needs-zona`; no snapshot and not connected with a remembered module -> `needs-zona`; otherwise `absent` - which covers a connected session in `snapshotting` and in `snapshot-failed` on a remembered module.

### `#classify`, quoted - `instanceof` twice, no regular expression, `partial` off the steps

```ts
  #classify(err: unknown, modules: HeavyModules, action: InstallAction): void {
    const { T } = modules;
    const after = action === "put-back" ? "put-back" : "try";
    if (err instanceof T.AbortedError) {
      this.#fail("lost", "aborted", lostBlock(false, TRY_ON_LABEL).title);
      return;
    }
    const cause: InstallCause = err instanceof T.NackError ? "nack" : "timeout";
    const timerLanded = this.steps.some(
      (s) => s.id === "write-timer" && s.outcome === "ok",
    );
    if (timerLanded) {
      this.landed = "Timer";
      this.failed = "Setup";
      this.#fail("partial", cause, partialBlock("Timer", "Setup").title);
    } else {
      this.#fail("nothing-landed", cause, nothingLandedBlock(after).title);
    }
    if (cause === "timeout") this.#escalatePacing(modules);
  }
```

### The escalation, quoted, and the amended `constants.ts` clause

```ts
  #escalatePacing(modules: HeavyModules): void {
    if (this.pacingEscalated) return;
    if (this.steps.some((s) => s.outcome === "nack")) return;
    this.#preSendDelayMs = modules.P.DESKTOP_PRE_SEND_DELAY_MS;
    this.pacingEscalated = true;
    this.#buildQueue(modules.T);
  }
```

`#buildQueue` aborts the old queue, unsubscribes its sink, builds the new one over `session.transport` with the current `#preSendDelayMs`, and subscribes `(cls) => { queue.deliver(cls); this.#onClassSeen(cls); }`. It is the same function `#attach` uses at `connected`.

```
 * would mislabel the arm. Since Phase 7 the install store also reads it as the
 * escalation target on a write timeout with no NACK (07-CONTEXT D-19); before
 * that, nothing in the shipped request path read it.
```

### The slow line, quoted - a `setTimeout`, zero `setInterval`

```ts
  #armSlow(): void {
    this.#disarmSlow();
    this.#slowTimer = setTimeout(() => {
      this.#slowTimer = undefined;
      this.slow = true;
      this.#session.announce(LIVE_STILL_WRITING);
    }, SLOW_LINE_MS);
  }
```

`SLOW_LINE_MS = 2000`; the comment beside it carries Z-09's arithmetic (roughly 90x the slowest `CONFIG/EXECUTE`, roughly 50x the slowest `PAGESTORE/ACKNOWLEDGE`, below the 3000 ms `pagestoreMs` on purpose). Armed at the start of both legs, disarmed in each finally. `setInterval occurrences: 0`.

### The two measurements for the runbook

- **`refetchRounds`** - a plain field, written every round of the proof (1 on a first-round match; 3 when the rounds run out), rendered nowhere. Runbook row E asks how many rounds a real ZONA needs after its reload.
- **`pacingEscalated`** - `$state(false)`, set once by a `write-*` timeout with no NACK, never reset inside a page load; the probe (07-08) shows it and the runbook asks whether it ever fired.

### The page-change re-snapshot

`#onClassSeen` runs beside `queue.deliver` in the sink: on a `HEARTBEAT` class whose SX/SY is the ZONA's, it resolves the heartbeat waiters and queues one microtask for `#pageCheck` (the session's fold publishes the identity AFTER its sinks have run for that frame). `#pageCheck` re-snapshots when the identity's `activePage` differs from `snapshotPage`, nothing is in flight and the phase is one of `WRITABLE_PHASES` - `ready`, `settled`, `restored`, `kept` and the failure states with a snapshot; never `writing`, never `snapshotting`.

## Task 3 - install.spec.ts: ten gates over flash, the taxonomy and the bounds (commit `2353aa0`)

`src/lib/device/install.spec.ts`, 783 -> **1681 lines**, 8 -> **18**, `server` project. Tests 1 to 8 are as 07-06 wrote them. The harness: `fakeSerial()` keeps the session's listener pair and returns `fire(type, port)`; the tee logs `received` (every delivered frame, decoded) and `writeAt` (the clock at every write); `connected()` takes `others` (a rig through `rigResponder`, their heartbeats in the initial frames), `wrap` (a responder wrapper), `sleep` (the store's) and `settle: false`, and returns `heartbeat()` (feeds the cable's heartbeats through `push`), `reconnect()` and `fire`; `begin()` starts an action and returns its wait, which yields one macrotask before the clock first moves; `throughStore()` runs an action, waits for the `store` step to read `ok` or the phase to leave `writing`, pauses 20 ms, feeds the heartbeats and records the clock; `dropAcks234(class)` builds the three descending `nth` drops with the short-circuit comment beside it.

9. *kept is said after the store acknowledgement, a heartbeat, and a matching re-fetch* - exactly one `PAGESTORE/EXECUTE`; steps `store ok`, `refetch-setup ok`, `refetch-timer ok`; both `refetch-*` steps' `sentAt` at or after the feed's clock reading; `kept`, `keptThisSession`, `refetchRounds` 1, `keepReason(true)` `already-kept`, `armed` false, the fake's flash equal to the pair, `writeLock` `[true, false]`, `liveKept("Aurora")` spoken exactly once.
10. *a read-back that never matches is kept-mismatch after three rounds* - a wrapper answering every Setup fetch after the store with `print(9)`: seven steps (the store, three pairs), the injected `sleep` called with `[120, 240, 360]`, `refetchRounds` 3, `kept-mismatch` / `mismatch`, `keptThisSession` false, `after-mismatch`, `putBackState()` `enabled`, the title spoken with a full stop.
11. *a store that never acknowledges is unconfirmed, and KEEP ON DEVICE stays live* - a `drop` on every `PAGESTORE/ACKNOWLEDGE`: no heartbeat was ever fed, the clock advanced at least `3 * 3000 + 120 + 240`, three `PAGESTORE/EXECUTE`, `store timeout attempts 3`, `unconfirmed` / `timeout`, `armed` true, `keepReason(true)` undefined, `slow` false, the title spoken, `openConfirm()` opens again.
12. *after a keep, PUT BACK stores too; when its store never confirms, it is restored-unconfirmed* - six frames after the keep: the RAM leg with the snapshot's strings and its restore, one `PAGESTORE/EXECUTE`, two `CONFIG/FETCH`; six steps across both legs; `restored`, `leg` `store`, `keptThisSession` false, the fake's RAM and flash both the original, `LIVE_RESTORED` once. Then a fresh rig with `dropAcks234("PAGESTORE")`: the keep takes acknowledgement 1, the put-back's three attempts lose 2, 3 and 4; `1 + 3` stores on the wire, `restored-unconfirmed` / `timeout`, `keptThisSession` still true, `putBackState()` `enabled`, RAM the original, `LIVE_RESTORED` never in the speech log, the title spoken instead.
13. *one landed script is partial, and it names the halves* - `dropAcks234("CONFIG")`: `write-timer ok`, `write-setup timeout attempts 3`, `restore-page-change sent` exactly once and after the failed step, four `CONFIG/EXECUTE`, `partial`, `Timer` / `Setup`, `timeout`, `after-partial`, `armed` false, `putBackState()` `enabled`, the fake's Timer the pair's; the same pair again lands `settled` on acknowledgements 5 and 6 with `landed` / `failed` cleared.
14. *none landed is nothing-landed - by refusal with one attempt, by timeout with three, and the timeout escalates the pacing* - a wrapper NACKing the Timer write: `write-timer nack attempts 1`, no `write-setup`, one restore, `nothing-landed` / `nack`, `pacingEscalated` false, RAM untouched. Then a `delay` of `executeMs + 50` on every `CONFIG/ACKNOWLEDGE`: `write-timer timeout attempts 3`, `nothing-landed` / `timeout`, `pacingEscalated` true; the first action's first frame had left within one clock step of its call; the NEXT action's first frame leaves at least `DESKTOP_PRE_SEND_DELAY_MS` after the call and after its step's `sentAt`, on the injected clock.
15. *an unplug mid-write is lost, the session keeps quiet, and a reconnect finds the record* - `disconnect` at `afterTxFrames` 4 (the first `CONFIG/EXECUTE`): `lost` / `aborted`, `write-timer aborted`, the session `unplugged-while-connected` with `writeLock` false and `unpluggedWhileWriting` true, `putBackState()` `needs-zona`, the lost title spoken and `Nothing was written` never in the log; then a replug through the navigator-level `connect` with a new port object, one click, `ready` with the record's entry byte-identical, `putBackState()` `enabled`, zero writes.
16. *on a rig the store is allowed, resolves once, and the confirmation names the others* - `rigResponder` over the ZONA, EN16 at `sx 1` (hwcfg 195) and BU16 at `sx 2` (hwcfg 131): the identity's `otherModules` `[[1, "EN16"], [2, "BU16"]]`; the confirmation opens; one `PAGESTORE/EXECUTE`, three `PAGESTORE/ACKNOWLEDGE` received, `store attempts 1 ok`, `kept`; `confirmRig(otherModules.map((m) => m.moduleType ?? "module"))` contains `Your EN16 and BU16 are on the same cable.`
17. *flash only what you have heard - the confirmation closes on a knob move and a session drop, and a page change re-snapshots* - open, a disarming knob move closes it (`knobs-moved`; `openConfirm()` refused), identical strings arm again, open, the navigator-level `disconnect` closes it and the store is `idle`, zero stores. A fresh rig: the module moves to page 3 and its heartbeat says so; `phases` after the first `ready` reads `["snapshotting", "ready"]`, `snapshotPage` 3, two page entries under the key, zero writes. A third rig with the record and `last` pre-seeded, the fetch answering empty and the serial report held 50 ms: `rememberedModule` true; in `snapshotting` `putBackState()` is `absent`; in `snapshot-failed` with `snapshot` undefined it is `absent` - never `enabled`.
18. *the slow line is a timer on the store, spoken once, and never an interval* - the STORE leg with `PAGESTORE/ACKNOWLEDGE` delayed 2500 ms: `slow` false at 1999 ms, true at 2000 ms with the phase still `writing`, `LIVE_STILL_WRITING` spoken by 2500, the acknowledgement in one attempt, a heartbeat, `kept`, `slow` false, `liveKept` spoken, `LIVE_STILL_WRITING` exactly once in the log; the comment-stripped source contains `SLOW_LINE_MS = 2000` and `setTimeout(` and no `setInterval`. The comment says why a RAM leg cannot host the test (the id is minted per attempt; three attempts end `nothing-landed` at roughly 1,110 ms).

### Seven negative checks, each applied to `install.svelte.ts`, run on the intended test, and restored byte-identical (`f7897946d43ee385...`)

| # | Mutation | Red on | What it said |
| - | -------- | ------ | ------------ |
| 1 | `await this.#nextHeartbeat();` removed | test 9 (1 failed) | `AssertionError: a heartbeat was fed while the store waited: expected undefined to be defined` - the store re-fetched on the acknowledgement and finished `kept` before the harness could feed one |
| 2 | `REFETCH_ROUNDS = 4` | test 10 (1 failed) | `expected [ [ 'store', 'ok' ], …(8) ] to deeply equal [ [ 'store', 'ok' ], …(6) ]` - a fourth `refetch-setup` / `refetch-timer` pair |
| 3 | `#ramLeg`'s catch retries `writeBoth` once on a `NackError` before classifying | test 14 (1 failed) | `expected [ [ 'write-timer', 'nack' ], …(2) ] to deeply equal [ [ 'write-timer', 'nack' ], …(1) ]` - a second `write-timer nack` step |
| 4 | **as planned:** `#recomputeArmed` widened to `partial` | test 13 **stayed green** (1 passed) | Unobservable: `armed` also requires `lastWritten` to equal the pair, and a try-on that lands `partial` never sets `lastWritten`. Recorded as deferred item 8 |
| 4b | **as observed:** `this.armed = true;` after `#fail("partial", …)` | test 13 (1 failed) | `AssertionError: never armed from partial: expected true to be false` - on `armed`; `keepReason` held at `after-partial` because the table's `partial` row precedes the armed row |
| 5 | the NACK guard removed from `#escalatePacing` and the call made unconditional | test 14 (1 failed) | `AssertionError: a NACK was seen: expected true to be false` - `pacingEscalated` after the refusal |
| 6 | `if (this.rememberedModule && this.snapshot === undefined) return "enabled";` inserted in `putBackState()` | test 17 (1 failed) | `AssertionError: while fetch-serial is pending: expected 'enabled' to be 'absent'` |
| 7 | `setTimeout` -> `setInterval` and `clearTimeout` -> `clearInterval` in the slow line | tests 8 and 18 (2 failed) | `install.svelte.ts reaches setInterval: expected true to be false` and `at 2000 ms: expected false to be true` - the harness fakes only `setTimeout`, so an interval ran on the real clock and never fired |

After every restore `sha256sum` read `f7897946d43ee385...` and `git diff --quiet src/lib/device/install.svelte.ts` was clean.

## Files created and modified

- `src/lib/device/install.svelte.ts` - modified; 641 -> 1097 lines
- `src/lib/device/install.spec.ts` - modified; 783 -> 1681 lines; 8 -> 18
- `src/lib/protocol/constants.ts` - modified; one comment clause (4 lines)
- `.planning/phases/07-install-flow/07-07-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - item 8 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 7/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 1 - Bug in the plan's sketch] `#storeLeg`'s catch classifies `AbortedError` before the generation check, and sets `#inFlight`**
- **Found during:** Task 1, transcribing the interfaces block's `#storeLeg`
- **Issue:** the sketch's catch opens with `if (gen !== this.#generation) return false;` and does not set `#inFlight`. 07-06 already found that `"closed"` bumps the generation before the queue's abort rejects the waiter, so that order can never land `lost`; and without `#inFlight` the `"closed"` branch would reset the phase to `idle` under the leg.
- **Fix:** the catch names `AbortedError` first (`lostBlock(true, …)` - the store leg's form), then applies the stale-generation return, then `"unconfirmed"`; `#inFlight` is set for the leg's duration.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `c4f7f54`. Exercised indirectly by test 15's RAM-leg path; the store-leg unplug itself is not a test in this plan.

**2. [Rule 2 - Missing guard] `putBack` refuses when the reported page differs from `snapshotPage`**
- **Found during:** Task 2, writing the page-change re-snapshot
- **Issue:** the re-snapshot is asynchronous and can fail (`snapshot-failed` keeps the old pair); in that window `putBack` would write page A's original to page B through `targetOf(id)` - the cross-page write Pitfall 4 exists to prevent.
- **Fix:** one guard, `if (id.activePage !== this.snapshotPage) return;`, with the comment. Every existing test has the two equal.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `c4f7f54`.

**3. [Rule 1 - The sketch] `P.storePage()`, not `T.storePage()`**
- **Found during:** Task 1
- **Issue:** the interfaces block writes `T.storePage()`; `storePage` is a `$lib/protocol` descriptor and the transport barrel does not re-export it.
- **Fix:** read from the awaited protocol module, like every other descriptor here.
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `c4f7f54`.

**4. [Rule 2 - Missing condition] the heartbeat the proof waits for is the ZONA's**
- **Found during:** Task 1, thinking about test 16's rig
- **Issue:** the plan says "the next `HEARTBEAT` class"; on a rig a chained module's heartbeat would satisfy the wait before the ZONA had reloaded.
- **Fix:** `#onClassSeen` matches the class's SX/SY against `identity.zona` (skipped only while no identity is published).
- **Files modified:** `src/lib/device/install.svelte.ts`. **Commit:** `c4f7f54`.

**5. [Rule 1 - Harness] one macrotask yield before the clock first moves**
- **Found during:** Task 3, the first run (5 failed)
- **Issue:** two artefacts of the lockstep clock, not of the store. `throughStore`'s first predicate check ran before `#storeLeg`'s first `await` had set `writing`, so `phase !== "writing"` was true at once and no heartbeat was ever fed (four `kept` tests hung); and `tick()` bumped `clock.t` before the yield that lets the queue's microtasks run, so `sentAt` read one step late and test 14's gap measured 5 ms while the frame had genuinely left 10 ms after the call (`writeAt 1655`, `callAt 1645`, `sentAt 1650` under instrumentation).
- **Fix:** `settle()` (one `setImmediate` turn) at the start of `begin()`'s wait, after `begin()` in `throughStore`, and in `tick()`.
- **Files modified:** `src/lib/device/install.spec.ts`. **Commit:** `2353aa0`.

**6. [Rule 1 - The spec's first draft] test 9's relation and test 12's flash assertion**
- **Found during:** Task 3, the second run (2 failed)
- **Issue:** with the wait honoured, the re-fetch is sent in the microtask right after the feed and shares its clock reading, so `sentAt > fedAt` read `40 > 40`; and `zonaResponder` copies RAM into flash on every `PAGESTORE/EXECUTE` before the fake drops the acknowledgement, so asserting the fake's flash still held HANGAR's pair after an unconfirmed put-back store was asserting the wrong model.
- **Fix:** `toBeGreaterThanOrEqual` with the comment (the 20 ms pause keeps negative check 1 red - observed); the flash assertion replaced by RAM equal to the original on both events, with the comment that what the fake's flash holds is exactly what HANGAR cannot know.
- **Files modified:** `src/lib/device/install.spec.ts`. **Commit:** `2353aa0`.

### Departures recorded, not deviations from the plan

1. **Tasks 1 and 2 are one commit** (`c4f7f54`), as 07-06's were: both edit only `install.svelte.ts` and task 1's interfaces block names task 2's members. Task 3 is `2353aa0`.
2. **Negative check 4 as planned was unobservable**, and is recorded as such (deferred item 8) with the literal variant observed red instead. Nothing was faked; the second guard is a property worth having.
3. **`storeToFlash`'s `id` and its lint directive are untouched** (deferred item 2): the store leg sends `P.storePage()` through the queue directly, as the sketch does, so this plan does not read `id`. The item's owner is the first plan that does.
4. **Steps span a put-back's two legs**: `#ramLeg` resets `steps`, `#storeLeg` appends, `keepOnDevice` resets at the click - an addition to the interfaces block, which did not say.
5. **`test 13` asserts `armed` false** beside the reason, so the literal negative check has a first red assertion that names what moved.

## Known stubs

None. `refetchRounds` and `pacingEscalated` are rendered by nothing by design - the plan says so ("recorded for the runbook, rendered nowhere"; "so the probe can show it") - and the probe that shows `pacingEscalated` is 07-08's. No component mounts the store; that is 07-10's, and 07-VALIDATION says no plan before it may.

## Requirements

**`requirements-contributed: [SAFE-05, SAFE-06, SAFE-07, SAFE-08, SAFE-09]`** - contributed, not completed; every Phase 7 criterion carries a *(hardware)* half and the confirmation's rendering is 07-09's. SAFE-05: the confirmation is a gate in the store (`openConfirm` refused unless live; `keepOnDevice` refused unless open) and the sentences are install-copy's. SAFE-06: the store is allowed on a rig, resolves on the first of N acknowledgements, and the identity's other modules feed `confirmRig` in `sx` order (test 16). SAFE-07: `partial` is detected from the acknowledgements and names the halves; both the retry and `PUT BACK` are offered (test 13). SAFE-08: `settled` and `kept` are confirmed states, the only in-flight signal is one line at 2000 ms (test 18). SAFE-09: three attempts and no more on a timeout (tests 11, 13, 14), never a retry of a refusal (test 14), a lost link ending in `lost` with `PUT BACK` `needs-zona` (test 15). `REQUIREMENTS.md` is not edited here, as no Phase 7 plan before 07-13 edits it.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 8** - negative check "set `armed` from `partial`" is unobservable as a `#recomputeArmed` widening because `lastWritten` is never set by a try-on that lands `partial`, and the reason row is shielded by `keepReason`'s table order; observed red as a direct assignment instead. No code; recorded so the check is not read as skipped.

Item 2 (the `storeToFlash` directive) stays open with its owner moved to the first plan that reads `id`; item 7 (the D-03 gate before the record) is unchanged and is exercised again by test 17's third rig.

## Next plan readiness

07-08 (the shim, the `/dev/install/` probe, the fourteen states walked) starts from: quick **73 / 772**, sweep `3 13`, svelte-check 540 / 0. Every member the interfaces block promised exists under the plan's spelling: `openConfirm`, `dismissConfirm`, `keepOnDevice`, `keepReason(capable)`, `putBackState()`, `lastSteps`, `refetchRounds`, `pacingEscalated`, `slow`, `confirmOpen`, `keptThisSession`, `landed`, `failed`, `InstallEnv.sleep`. Two things the probe's shim must do that the fake alone does not: feed a ZONA heartbeat after every `PAGESTORE` acknowledgement (the store waits for one before it re-fetches - a shim that never heartbeats would leave every keep in `writing`), and answer a re-fetch with different strings when it wants `kept-mismatch`.

The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it. No device was connected to, written to or looked for; every write in this plan's spec landed in `FakeTransport.writes` through the store's one queue, and each is attributable to `tryOnDevice`, `putBack` or `keepOnDevice`.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T13:15:00.000Z.

- FOUND: `src/lib/device/install.svelte.ts` (1097 lines; three `from "` specifiers; `.onData(` 0, `.write(` 0, `setInterval` 0, `$derived` 0; `instanceof` 2 inside `#classify`; sha256 `f7897946d43ee385...` after every negative-check restore)
- FOUND: `src/lib/device/install.spec.ts` (1681 lines; 18; contains `PAGESTORE`, 20 occurrences)
- FOUND: `src/lib/protocol/constants.ts` (one comment clause changed)
- FOUND: `.planning/phases/07-install-flow/07-07-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md` (item 8 appended; nine headings)
- FOUND: commit `c4f7f54` (tasks 1 and 2, the store and the constants clause)
- FOUND: commit `2353aa0` (task 3, the spec)
- PASS: quick 73 / 772 through check-counts; sweep 3 13; svelte-check 540 / 0; `npm run lint` exit 0; `install.spec.ts` 18
- PASS: seven negative checks - six red as planned, one unobservable as planned and red as a direct assignment - each followed by a restore to `f7897946d43ee385...` and a clean `git diff --quiet`
- engine name occurrences in the three source files, this SUMMARY and the two commit messages: 0
