---
phase: 07-install-flow
plan: 02
subsystem: transport
tags: [writer, writeBoth, writeBack, fetchModuleKey, storeToFlash, storeAllowed, zonaResponder, rigResponder, flash, powerCycle, currentpage, SAFE-03, SAFE-06, SAFE-07]

# Dependency graph
requires:
  - ".planning/phases/07-install-flow/07-01-SUMMARY.md - the five-name block (BASE_FILES 69, BASE_TESTS 724, BASE_SWEEP `3 13`, BASE_E2E 77 frozen, PREV_E2E 77), the tree at quick 69 / 726, fetchSerialNumber(sx, sy) and moduleKeyOf in descriptors.ts, fetch-serial second in STEP_IDS"
  - "07-CONTEXT.md D-05/SAFE-06 (the store allowed on a rig), D-09 (Timer then Setup), D-18 (two shipped rules undone by name; this plan does the first), D-04 amended (the serial fetched by address)"
  - "07-RESEARCH.md Pattern 3 (one writer), Pitfall 7 (a NACK is never retried), Pitfall 8 (N acknowledgements to one store), the Anti-Pattern on trusting Identity.storeAllowed, the Code Example on extending zonaResponder"
  - "src/lib/transport/queue.ts - settle nulls the waiter so a rig's extra acknowledgements are delivered to nobody; NackError is never retried; attempts is configurable"
  - "src/lib/transport/fake.ts - the live responder mode, request id read off the wire"
provides:
  - "writeBoth(q, target, strings): the ONE writer - Timer (6) then Setup (0), sequential, each under its own step id, the strings on the wire verbatim; EventStrings, WriteTarget, targetOf(id)"
  - "writeBack(q, id, f) as a two-line adapter over writeBoth with no sendConfig of its own; runNoOpCycle and the skeleton page call it unchanged"
  - "fetchModuleKey(q, id): fetchSerialNumber addressed to the ZONA's own SX/SY under fetch-serial, keyed by moduleKeyOf; a silent module rejects on the fetch timeout"
  - "storeToFlash(q, id) without the storeAllowed throw (D-18, edit one of two); Identity.storeAllowed retained, informational, comment amended in the type and in identify()"
  - "zonaResponder answering by firmware's acceptance rule (CONFIG IS_ME; PAGESTORE and SERIALNUMBER IS_ME | IS_GLOBAL), refusing a cross-page CONFIG/EXECUTE with a NACK echoing the id (grid_decode.c:1272), copying RAM into flash on PAGESTORE and reloading it (grid_decode.c:955-961), answering an addressed SERIALNUMBER/FETCH"
  - "serialNumberReportFrame(words) built WITHOUT the address rewrite (SX -127, SY -127, firmware's global position); powerCycle(state); rigResponder(states) as a plain fan-out; pagestoreAckFrame with an optional source address"
  - "sequence.spec.ts 11 with test 3 rewritten to SAFE-06's rule; synthetic.spec.ts 6"
affects:
  - "07-06 (install.svelte.ts) calls writeBoth for TRY ON DEVICE and PUT BACK, fetchModuleKey at connect, and degrades to a session-only snapshot on its timeout"
  - "07-07 (KEEP ON DEVICE) calls storeToFlash on a rig without a throw and builds its confirmation from otherModules; should delete the eslint directive on storeToFlash's id the moment it reads it (deferred item 2)"
  - "07-08 (the shim answers with the real fake) inherits a zonaResponder that refuses, keeps flash and answers for its serial, and a rigResponder for the multi-module state"
  - ".planning/phases/07-install-flow/deferred-items.md - items 2 and 3 appended; .planning/STATE.md, .planning/ROADMAP.md - Phase 7 at 2/13"

tech-stack:
  added: []
  patterns:
    - "One writer for three clicks: a behaviour that must not drift between callers is one function taking the caller's data, and every earlier caller becomes an adapter over it - the test for the adapter asserts that what was fetched is what goes back, and the test for the writer asserts order, bytes and refusal"
    - "A shipped rule is undone by name: the throw is removed, the field stays with an amended comment, and the test that asserted the old rule is rewritten to assert the new one while keeping every assertion that is still true"
    - "A scripted device answers what the firmware accepts, by address, so a rig fixture is a plain fan-out over single-module responders and a broadcast is answered N times while an addressed request is answered once"
    - "An optional field on a fixture state is allocated lazily at the first moment it can differ from what it defaults to, so every existing literal keeps satisfying the type and no spec is edited to add a field"

key-files:
  created:
    - ".planning/phases/07-install-flow/07-02-SUMMARY.md"
  modified:
    - "src/lib/transport/sequence.ts"
    - "src/lib/transport/sequence.spec.ts"
    - "src/lib/transport/fixtures/synthetic.ts"
    - "src/lib/transport/fixtures/synthetic.spec.ts"
    - ".planning/phases/07-install-flow/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "zonaResponder answers by address (CONFIG IS_ME; PAGESTORE and SERIALNUMBER IS_ME | IS_GLOBAL). The plan enumerated three branches and one refusal; the addressing rule was added because rigResponder's stated contract - each answers what it accepts - is false without it (three modules answering every CONFIG would model three ZONAs sharing one RAM). Every unedited consumer addresses 0,0 to a state at 0,0, verified by grep before the edit, and all stayed green. Recorded as a Rule 2 deviation"
  - "flash is allocated as a copy of RAM at the first write, not only at the first store or power cycle, so a module that was written to but never stored comes back from a power cycle with the factory string - the semantics PUT BACK and runbook row D rest on. Test 5 asserts flash still holds the original after the first write"
  - "pagestoreAckFrame takes an optional source address (default 0,0 unchanged) so a rig's three acknowledgements decode from SX 0, 1, 2; test 5 asserts the three addresses beside the three LASTHEADERs. The plan's assertion (three frames, one LASTHEADER) is a subset of what shipped"
  - "storeToFlash keeps id as a parameter per the plan and carries an eslint-disable-next-line for no-unused-vars, because the removed throw was its only reader; the first plan that reads id in that function deletes the directive (deferred item 2)"
  - "Test 3's identity sees one chained module (its first two assertions are kept verbatim) while its rig responder has three states, so the count of acknowledgements to one store is unmistakably more than one; the identity is passed into rig() through a new optional second parameter"
  - "Test 11's timeout half uses a second RequestQueue built with { preSendDelayMs: 0, attempts: 1 } and no fake timers, exactly as the plan says, so the rejection costs one TIMEOUTS.fetchMs (300 ms) of real time; the whole file runs in about 0.8 s"

requirements-completed: []
requirements-contributed: [SAFE-03, SAFE-06, SAFE-07]

# Metrics
duration: 18min
completed: 2026-09-05
---

# Phase 7 Plan 02: One writer for three clicks, the storeAllowed throw undone by name, the fake ZONA that refuses Summary

**`writeBoth(q, target, strings)` is now the only function in HANGAR that puts a `CONFIG/EXECUTE` on the wire - Timer (6) first, then Setup (0), sequential, one acknowledgement at a time, the strings verbatim - and Phase 2's `writeBack` is a two-line adapter over it, so `TRY ON DEVICE`, `PUT BACK` and the skeleton's write-back are literally one hardware-proven code path. The first of D-18's two named undoings is done: `storeToFlash` no longer throws on `Identity.storeAllowed`, the field stays as an informational one with its comment saying so, and `sequence.spec.ts` test 3 is rewritten rather than deleted - it still asserts `storeAllowed === false` on a rig and now asserts the store RESOLVES there, one `PAGESTORE/EXECUTE` on the wire, three acknowledgements arriving and one request settling. The scripted ZONA grew the three things every failure in this phase needs: firmware's `currentpage` NACK, a flash beside its RAM with a `powerCycle` that brings it back, and an answer to an addressed `SERIALNUMBER/FETCH` from the global position `-127,-127` - plus `rigResponder`, so one broadcast is answered N times. `sequence.spec.ts` 11, `synthetic.spec.ts` 6, six negative checks red and restored, quick 69 / 731.**

## The five-name carry-forward block

Carried verbatim from 07-01, which measured it on the clean tree Phase 6 closed at `145f85d`. Nothing in it is re-derived here.

| Name         | Value                      | Note                                                                                                       |
| ------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **69**                     | This plan adds no spec file. Tree: **69** (+ 0)                                                             |
| `BASE_TESTS` | **724** (+ 1 todo = 725)   | 07-01 added 2 (726); this plan adds **5** (test 3 rewritten in place, tests 10-11, synthetic 4-6). Tree: **731** (+ 7) |
| `BASE_SWEEP` | **`3 13`**                 | Unchanged; observed `3 13` again                                                                            |
| `BASE_E2E`   | **77 (measured by 07-01)** | **Frozen.** 07-13 asserts `BASE_E2E + 12` = **89**. Not run by this plan (no route, no build)               |
| `PREV_E2E`   | **77 (measured by 07-01)** | Unchanged; rolls at 07-08, 07-12 and 07-13                                                                 |

`BASE_CHECK` (provenance only): **533 files, 0 errors, 0 warnings**, `npm run check`, after every task.

### Per-file counts after this plan

| File                                              | Before | After  | Plan said |
| ------------------------------------------------- | ------ | ------ | --------- |
| `src/lib/transport/sequence.spec.ts`              | 9      | **11** | 11        |
| `src/lib/transport/fixtures/synthetic.spec.ts`    | 3      | **6**  | 6         |
| `src/lib/protocol/forbidden-instructions.spec.ts` | 5      | **5**  | 5         |
| `src/lib/transport/` + `src/lib/device/` + forbidden | -   | **11 files / 85 tests**, no other spec edited | green |

## Task 1 - writeBoth, fetchModuleKey, and the throw that goes

`0bbea6b` - `feat(07-02): writeBoth, the one writer for three clicks, and the store throw undone by name`

`src/lib/transport/sequence.ts`:

- The header's D-11 sentence now names `writeBoth` as the one writer and the three callers (`TRY ON DEVICE`, `PUT BACK`, the skeleton's write-back).
- `EventStrings`, `WriteTarget`, `targetOf(id)`, `writeBoth(q, target, s)` exactly as the interfaces block gives them, with the `_pad.ts:3908-3913` reason for Timer-first (gtt is a no-op until the Timer event holds a stored action, and Setup runs immediately) and the ONE WRITER FOR THREE CLICKS paragraph.
- `writeBack` is the adapter. Quoted as committed - **it contains no `sendConfig`**:

```ts
export async function writeBack(
  q: RequestQueue,
  id: Identity,
  f: FetchedPair,
): Promise<void> {
  await writeBoth(q, targetOf(id), {
    setup: f.setup.actionString ?? "",
    timer: f.timer.actionString ?? "",
  });
}
```

- `fetchModuleKey(q, id)`: `fetchSerialNumber(id.zona.sx, id.zona.sy)` under `"fetch-serial"`, then `moduleKeyOf(cls)`. Imports `fetchSerialNumber` and `moduleKeyOf` from `$lib/protocol` (the barrel already exported both; 07-01 did not touch `index.ts` and neither did this plan).
- `storeToFlash` quoted as committed - **it contains no `throw`**:

```ts
export async function storeToFlash(
  q: RequestQueue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- provenance and symmetry; see the comment above
  id: Identity,
): Promise<void> {
  await q.request(storePage(), "store");
}
```

  Its comment is the interfaces block's paragraph: the store is a global broadcast, every module stores its own active page and answers with its own acknowledgement echoing the same `LASTHEADER`, the queue resolves on the first and the rest go to nobody (`queue.ts` `settle` nulls the waiter), SAFE-06 makes that a confirmation sentence and not a refusal, Phase 2's D-12 threw here and is undone by name (D-18), and `id` stays for provenance and symmetry and is currently unread. The eslint directive exists because the removed throw was `id`'s only reader; deferred item 2 names who deletes it.
- `Identity.storeAllowed` still exists. The two lines, as committed (`sequence.ts:51-52`):

```ts
   */
  storeAllowed: boolean;
```

  with the doc comment above them reading: *Informational since Phase 7. Phase 2's D-12 refused a page store on this field; SAFE-06 (07-CONTEXT D-05) allows the store on a rig and names the other modules in a confirmation instead. Nothing refuses on this field any more - it is still here because the captures and fixtures.spec.ts shape it.* `identify()`'s comment (`:188-189`) says the same: *Its presence no longer disables anything - `storeAllowed` is informational since Phase 7.* The computation `storeAllowed: otherModules.length === 0` is unchanged.

**The two call sites outside `sequence.ts`, neither edited** (`grep -rn "storeToFlash\|writeBack\b" src` excluding specs and `sequence.ts` itself):

- `src/routes/dev/skeleton/+page.svelte:372` - `await T!.writeBack(queue!, identity!, before!);`
- `src/routes/dev/skeleton/+page.svelte:405` - `await T!.storeToFlash(queue!, identity!);`

Inside `sequence.ts`, `runNoOpCycle` still calls `writeBack(q, id, before)` unchanged. The skeleton page also greys its store button on the field (`:579`, `disabled={!writesAcknowledged || !identity?.storeAllowed}`); the field exists, so it keeps working exactly as Phase 2 built it, and this plan edited no route (deferred item 3 records that the page renders the superseded rule).

**Verified:** `npm run check` 533 / 0 errors / 0 warnings; `npm run lint` exit 0 with eslint printing nothing (so the disable directive is consumed, not stray); `sequence.spec.ts` 9 passed against the new writer before its own rewrite.

## Task 2 - the scripted ZONA learns flash, refusal, its serial, and company

`28b5222` - `feat(07-02): the scripted ZONA learns flash, refusal, its serial, and company`

`src/lib/transport/fixtures/synthetic.ts`:

- The header's two facts become **three**: the SERIALNUMBER report is the one inbound frame built WITHOUT the address rewrite, because firmware builds it with `grid_msg_init_brc(..., GRID_PARAMETER_GLOBAL_POSITION, ...)` (`grid_decode.c:839-869`) and a real report arrives from `SX -127, SY -127` - the wire fact that forces the FETCH to be addressed.
- `ZonaState` gains `flash?: Record<number, string>` and `serial?: readonly [number, number, number, number]`, both optional. `flash` is allocated by `flashOf(state)` (`state.flash ??= { ...state.configs }`) the first time RAM and flash can diverge - the first write, the first store or the first power cycle - so **no existing `zonaState()` literal changed** in `fake.spec.ts`, `queue.spec.ts` or `sequence.spec.ts`.
- `serialNumberReportFrame(words)`: `seal(message(encodeOne({...})))`, no `inbound()`, four words in a 62-byte class block.
- `powerCycle(state)`: `state.configs = { ...flashOf(state) }`.
- `zonaResponder` answers by address: `isMe` compares the outbound `DX/DY` to the state's `sx/sy`, `isGlobal` to `-127,-127`. CONFIG/FETCH and CONFIG/EXECUTE require `me`; PAGESTORE and SERIALNUMBER accept `me || global`. Then the three branches: a CONFIG/EXECUTE with `PAGENUMBER !== state.activePage` returns `configNackFrame({sx, sy, lastheader: requestId})` and writes nothing; PAGESTORE copies `configs` into `flash` and `flash` back into `configs` (a no-op on the bytes, the shape D-12's re-fetch proof depends on), then ACKs from its own address; SERIALNUMBER/FETCH returns `serialNumberReportFrame(state.serial)` when `state.serial` is set, else nothing. A fetch of a non-active page still answers an empty string.
- `rigResponder(states)`: `states.map(zonaResponder)` and `flatMap` over the answers, in bus order.
- `pagestoreAckFrame` takes optional `sx`, `sy` (default 0, 0 - the fixture generator's call is unchanged and `synthetic-zona.json` was not regenerated).

`synthetic.ts` still calls `encode_packet` only through `encodeOne` and still constructs no page-change EXECUTE; `forbidden-instructions.spec.ts` **5 passed** unedited.

`src/lib/transport/fixtures/synthetic.spec.ts` **3 -> 6**, a second `describe("the scripted ZONA")` with an `ask(answer, req)` helper that encodes a request, strips the terminator and decodes it the way `FakeTransport.write` does, then decodes every reply:

4. *"a config write to a page that is not active is refused with a NACK echoing the id"* - `sendConfig(0, 0, ACTIVE_PAGE + 1, EVENT_SETUP, NEW)` returns exactly one frame decoding to `CONFIG/NACKNOWLEDGE` with `LASTHEADER === id`, `state.configs[EVENT_SETUP]` unchanged; the same write to `ACTIVE_PAGE` returns `CONFIG/ACKNOWLEDGE` with the id and RAM holds `NEW`.
5. *"a store copies RAM into flash, and a power cycle brings flash back"* - after the first write `flash` still holds the original (the lazy allocation happened before the mutation); `storePage()` answers `PAGESTORE/ACKNOWLEDGE` echoing the id and `flash` holds the stored string for both events; a second write without a store, then `powerCycle`, and RAM is the stored string again. Then the rig: `rigResponder` over states at `sx 0, 1, 2` answers one `storePage()` with **three** `PAGESTORE/ACKNOWLEDGE` frames, every `LASTHEADER` equal to the one id, decoding from `SX 0, 1, 2`, and every module's `flash` equal to its `configs`.
6. *"a serial-number fetch is answered only when it is addressed"* - a state with `serial [0x12345678, 0x9abcdef0, 0, 0]` answers `fetchSerialNumber(0, 0)` with one `SERIALNUMBER/REPORT` whose four words decode back (`>>> 0`), whose `SX, SY` are `-127, -127`, and which keys to `123456789abcdef00000000000000000`; `fetchSerialNumber(1, 0)` to the same state answers nothing; a state without `serial` answers nothing; on a rig of three with three serials a **broadcast** `fetchSerialNumber(-127, -127)` produces three reports whose address set is exactly `{"-127,-127"}` - indistinguishable - while `fetchSerialNumber(1, 0)` produces exactly one whose `WORD0` is module 1's. That last pair is the argument for `fetchSerialNumber(sx, sy)`, written down as a measurement.

**Verified:** `synthetic.spec.ts` **6 passed**; `npx vitest run --project server src/lib/transport/ src/lib/device/ src/lib/protocol/forbidden-instructions.spec.ts` **11 files / 85 tests** green with no other spec edited; `npm run check` 533 / 0; `npm run lint` exit 0.

## Task 3 - sequence.spec.ts: the rule that changed, rewritten, and two on the writer

`58e31f1` - `test(07-02): sequence.spec.ts - the rule that changed, rewritten, and two on the writer`

`src/lib/transport/sequence.spec.ts` **9 -> 11**. Helpers: `zonaState(over)` takes `Partial<ZonaState>` overrides; `rig(responder?, id = identified())` takes an identity; `configWrites(transport)` filters the CONFIG/EXECUTE frames.

**Test 3, rewritten, not deleted.** Its title: *"a second module is named, and the store is a broadcast that stays allowed"*. Verbatim as committed:

```ts
  it("a second module is named, and the store is a broadcast that stays allowed", async () => {
    const state = newIdentifyState(0);
    absorb(state, zonaHeartbeat());
    // A chained module: type 0, its own SX, and one class in its frame.
    absorb(state, zonaHeartbeat({ sx: 1, type: 0 }));

    const id = identify(state);
    expect(id?.otherModules).toHaveLength(1);
    expect(id?.otherModules[0].sx).toBe(1);
    // Informational since Phase 7 (07-CONTEXT D-18): SAFE-06 supersedes Phase
    // 2's D-12. The field still reports the rig - the identity line and the
    // flash confirmation read it - but nothing refuses on it any more.
    expect(id?.storeAllowed).toBe(false);
    if (!id) throw new Error("the scripted heartbeats did not identify a ZONA");

    // SAFE-06: the store on a rig is ALLOWED. It is a global broadcast, every
    // module on the bus stores its own active page and answers with its own
    // acknowledgement echoing the same LASTHEADER, and the queue settles on
    // the first (07-RESEARCH Pitfall 8). Three modules answer; one request
    // resolves; that is the behaviour the confirmation sentence describes.
    const { transport, queue, steps } = rig(
      rigResponder([zonaState(), zonaState({ sx: 1 }), zonaState({ sx: 2 })]),
      id,
    );
    await expect(storeToFlash(queue, id)).resolves.toBeUndefined();
    expect(
      flat(transport).filter(
        (c) => c.class_name === "PAGESTORE" && c.class_instr === "EXECUTE",
      ),
      "one store on the wire",
    ).toHaveLength(1);
    expect(steps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["store", "ok", 1],
    ]);
  });
```

The first two assertions and `expect(id?.storeAllowed).toBe(false)` are kept; the comment changed; the store on the rig resolves, one `PAGESTORE/EXECUTE` is on the wire, one `store` step with `outcome: "ok"` and `attempts: 1`.

10. *"writeBoth sends two strings Timer first, verbatim, and writeBack is its adapter"* - `writeBoth(queue, targetOf(id), { setup: "--[[@cb]]print(9)", timer: "--[[@cb]]print(8)" })` puts two `CONFIG/EXECUTE` frames on the wire with `EVENTTYPE` 6 then 0, each `ACTIONSTRING` equal to the string handed in character for character, each `ACTIONLENGTH` equal to its length, both on `PAGENUMBER === ACTIVE_PAGE`. Then on a fresh rig `fetchBoth` followed by `writeBack` produces frames whose `EVENTTYPE`s are `[6, 0]` and whose strings are `[TIMER_CONFIG, SETUP_CONFIG]`.
11. *"a write to a page the module is not on is refused, and the refusal is not retried"* - a target `{ ...targetOf(id), page: ACTIVE_PAGE + 1 }` makes `writeBoth` reject with `NackError`; the step list is exactly `[["write-timer", "nack", 1]]`; exactly one `CONFIG/EXECUTE` was written (the Setup never attempted). Then `fetchModuleKey` against a rig whose state has `serial [0x12345678, 0x9abcdef0, 0, 0]` resolves to a string matching `/^[0-9a-f]{32}$/` under one `fetch-serial` step; and against a state without a serial, on `new RequestQueue(transport, { preSendDelayMs: 0, attempts: 1, onStep })` with no fake timers, it rejects with `/Timed out/` after one `TIMEOUTS.fetchMs` (300 ms of real time) and the step list is `[["fetch-serial", "timeout", 1]]`.

**Verified:** `sequence.spec.ts` **11 passed** (about 0.8 s including the 300 ms deadline); `npm run lint` exit 0; `npm run check` 533 / 0 errors.

## The six negative checks, each observed red on the intended test and restored byte-identical

A scratch runner applied each mutation as an exact single-occurrence string replacement (it exits without writing if the anchor is not found exactly once), ran the one spec, restored the original bytes, and compared SHA-256 before and after. All six restores were byte-identical (`sequence.ts` `03ec436b…` both times; `synthetic.ts` `3ae98300…` all four times) and `git diff HEAD` on both files was empty afterwards.

| # | Mutation | Spec | Red on | What it said |
| - | -------- | ---- | ------ | ------------ |
| 1 | `storeToFlash`'s `storeAllowed` throw restored | `sequence.spec.ts` | test 3 (1 failed, 10 passed) | `AssertionError: promise rejected "Error: Another module is on the bus and a…" instead of resolving` - red on the resolve, by name |
| 2 | the two `q.request` calls in `writeBoth` swapped (Setup first) | `sequence.spec.ts` | test 10 (and 5 and 11; 3 failed, 8 passed) | test 10: `AssertionError: expected +0 to be 6` on `EVENTTYPE`; test 5 the same; test 11: `expected [ [ 'write-setup', 'nack', 1 ] ] to deeply equal [ [ 'write-timer', 'nack', 1 ] ]` - the writer is pinned three ways |
| 3 | the responder ACKs a wrong-page write (`page !== state.activePage` -> `page !== page` in `synthetic.ts`) | `sequence.spec.ts` | test 11 (1 failed, 10 passed) | `AssertionError: promise resolved "undefined" instead of rejecting` - red on the outcome |
| 4 | the `currentpage` branch removed (same mutation as 3) | `synthetic.spec.ts` | test 4 (1 failed, 5 passed) | `AssertionError: expected 'ACKNOWLEDGE' to be 'NACKNOWLEDGE'` - the write is accepted |
| 5 | PAGESTORE skips the flash copy (`state.flash = { ...state.configs }` removed) | `synthetic.spec.ts` | test 5 (1 failed, 5 passed) | `AssertionError: expected '--[[@cb]]print(1)' to be '--[[@cb]]print(7)'` - the power cycle brings back the wrong string |
| 6 | the address rewrite applied to the serial report (`message(encodeOne(...))` -> `inbound(..., { sx: 0, sy: 0 })`) | `synthetic.spec.ts` | test 6 (1 failed, 5 passed) | `AssertionError: expected +0 to be -127` - `SX` becomes `0` |

Nothing was unobservable as planned. Mutation 2 also took down the pre-existing test 5 ("the write-back sends Timer before Setup") because `writeBack` now goes through `writeBoth` - which is the point of the adapter.

## Closing verification

Run in this order on the tree after `58e31f1`, one command at a time:

- `npm run check 2>&1 | grep -Ei "error|warning"` -> `533 FILES 0 ERRORS 0 WARNINGS`
- `npm run lint` -> exit 0 (prettier clean, eslint silent)
- `npx vitest run --project server src/lib/transport/ src/lib/device/ src/lib/protocol/forbidden-instructions.spec.ts` -> 11 files / 85 tests (after Task 2; Task 3 adds 2 to `sequence.spec.ts`)
- `npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 731` -> `observed 69 files, 731 tests passed, 1 todo ... matches the expected counts` (`BASE_FILES` + 0; 726 + 5 = `BASE_TESTS` + 7)
- `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13` -> `matches the expected counts`

`format-parity.spec.ts` did not flake; nothing was re-run. No e2e run (the plan names none; no route or build was touched). No `test-results/` appeared. No device was connected to, written to, or looked for; every write in this plan landed in `FakeTransport.writes`.

## Files created and modified

- `src/lib/transport/sequence.ts` - header, imports, `Identity.storeAllowed`'s comment, `identify()`'s comment, `EventStrings`, `WriteTarget`, `targetOf`, `writeBoth`, `writeBack` as adapter, `fetchModuleKey`, `storeToFlash` without the throw
- `src/lib/transport/fixtures/synthetic.ts` - header fact 3, `pagestoreAckFrame` optional address, `serialNumberReportFrame`, `ZonaState` widened, `flashOf`, `powerCycle`, `isMe`/`isGlobal`, `zonaResponder` by address with the three branches, `rigResponder`
- `src/lib/transport/fixtures/synthetic.spec.ts` - 3 -> 6; imports widened; `ask` helper; the second describe
- `src/lib/transport/sequence.spec.ts` - 9 -> 11; imports widened; `zonaState(over)`, `rig(responder, id)`, `configWrites`; test 3 rewritten; tests 10 and 11
- `.planning/phases/07-install-flow/07-02-SUMMARY.md` - this file
- `.planning/phases/07-install-flow/deferred-items.md` - items 2 and 3 appended (never overwritten)
- `.planning/STATE.md`, `.planning/ROADMAP.md` - Phase 7 at 2/13, by hand

## Deviations from plan

### Auto-fixed

**1. [Rule 2 - Missing critical functionality] `zonaResponder` answers by address**
- **Found during:** Task 2, designing `rigResponder`
- **Issue:** The plan's `rigResponder` contract is "each answers what it accepts; a broadcast is answered by all". The shipped `zonaResponder` answered every CONFIG regardless of `DX/DY`, so a fan-out over three states would have answered one addressed CONFIG/EXECUTE three times and written all three RAMs - three ZONAs sharing one RAM, not three modules on one cable - and a rig write test in 07-06 onward would have measured the wrong thing.
- **Fix:** `isMe` / `isGlobal` on the outbound `DX/DY` (probed first: the pinned package decodes an addressed frame as `DX 0, DY 0` and a broadcast as `-127, -127`); CONFIG requires `me`, PAGESTORE and SERIALNUMBER accept `me || global`, matching `grid_decode.c`'s acceptance per class as 07-RESEARCH records it.
- **Safety:** every existing consumer (`fake.spec.ts`, `queue.spec.ts`, `sequence.spec.ts`) was grepped before the edit; all address `0,0` to a state at `sx 0, sy 0`. All stayed green unedited.
- **Files:** `src/lib/transport/fixtures/synthetic.ts`. **Commit:** `28b5222`.

Nothing else under Rules 1 to 4. Three notes, none a deviation:

1. `pagestoreAckFrame` gained an optional source address (default unchanged) so test 5 can assert three acknowledgements from three addresses beside the three identical `LASTHEADER`s. Additive; the fixture generator's call and the committed capture are untouched.
2. `flash` is fixed at the first **write**, not only at the first store, so a never-stored module survives a power cycle with its factory string - the semantics `PUT BACK` exists for. The plan said "allocated on first use"; this is the first use at which it matters, and test 5 asserts it.
3. `storeToFlash`'s unread `id` needed an eslint directive, since removing the throw removed its only reader. Deferred item 2 names the plan that deletes it.

## Known stubs

None. No UI, no data source, no placeholder text; every function added has a test that drives it.

## Requirements

**`requirements-contributed: [SAFE-03, SAFE-06, SAFE-07]`** - contributed, not completed. SAFE-03 has its one restore path (`PUT BACK` will be `writeBoth` with the snapshot's strings) but no snapshot exists yet; SAFE-06 has the store allowed on a rig and the acknowledgement count measured, but no confirmation copy names the other modules yet; SAFE-07 has the refusal modelled where a test reaches it and the queue's one-attempt NACK pinned, but no install state reports "partial" yet. All three close in the plan that owns them. `REQUIREMENTS.md` is not edited here.

## Deferred items

Appended to `.planning/phases/07-install-flow/deferred-items.md`:

- **Item 2** - the eslint directive on `storeToFlash`'s `id`; owner 07-07 or the first plan that reads `id` there.
- **Item 3** - `/dev/skeleton/+page.svelte:579` greys its store button on the superseded rule; recorded, no owner, not a Phase 7 requirement.

## Next plan readiness

07-03 (`snapshot.ts` and `install-copy.ts`, each importing nothing) starts from: quick **69 / 731**, sweep `3 13`, `sequence.spec.ts` **11**, `synthetic.spec.ts` **6**, `forbidden-instructions.spec.ts` **5**. 07-06 imports `writeBoth`, `targetOf`, `fetchModuleKey` and `restorePageChange` from `$lib/transport/sequence` and `rigResponder`, `powerCycle` and `serialNumberReportFrame` from the fixtures; every one exists and is pinned. The Phase 6 hardware checkpoint (SESSION-RUNBOOK rows A to F) is still unanswered; this plan did not need it.

---
*Phase: 07-install-flow*
*Completed: 2026-09-05*

## Self-Check: PASSED

Checked after writing, at 2026-09-05T10:49:27Z.

- FOUND: `src/lib/transport/sequence.ts`
- FOUND: `src/lib/transport/sequence.spec.ts`
- FOUND: `src/lib/transport/fixtures/synthetic.ts`
- FOUND: `src/lib/transport/fixtures/synthetic.spec.ts`
- FOUND: `.planning/phases/07-install-flow/07-02-SUMMARY.md`
- FOUND: `.planning/phases/07-install-flow/deferred-items.md`
- FOUND: commit `0bbea6b`
- FOUND: commit `28b5222`
- FOUND: commit `58e31f1`
- PASS: sequence.ts exports writeBoth
- PASS: writeBack contains no sendConfig
- PASS: storeToFlash contains no throw
- PASS: Identity.storeAllowed still exists
- PASS: synthetic.ts names flash and configNackFrame
- PASS: encode_packet is called from exactly two shipped modules, descriptors.ts and synthetic.ts
- PASS: no attribution in any of the six files
- PASS: prettier clean on the four planning files
