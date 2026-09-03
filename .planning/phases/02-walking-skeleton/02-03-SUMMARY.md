---
phase: 02-walking-skeleton
plan: 03
subsystem: transport
tags:
  [web-serial, svelte-5, prerender, playwright, degrade-path, D-05, D-09, D-10, D-11, D-12]

# Dependency graph
requires:
  - phase: 02-walking-skeleton
    provides: "plan 01's pure protocol layer (descriptors, FrameScanner, decodeFrame, matchResponse, canWriteBack) and plan 02's transport layer (GridTransport, WebSerialTransport, CaptureRecorder, FakeTransport, RequestQueue, STEP_IDS)"
  - phase: 03-vendor-the-domain
    provides: "the /dev/fidelity/ route pattern - prerendered, unlinked, dynamic import inside onMount, e2e over wrangler dev"
provides:
  - "src/lib/transport/sequence.ts - the whole no-op cycle as functions with no DOM: absorbFrame, identify, fetchBoth, writeBack, storeToFlash, restorePageChange, runNoOpCycle, runBurstProbe"
  - "The restore rule made structural: runNoOpCycle sends HEARTBEAT TYPE 255 from a finally, proven to hold on the refusal path"
  - "D-10 as a three-condition rule: the active page moves only for a PAGENUMBER riding beside a HEARTBEAT in the same frame and carrying no EVENTTYPE or ACTIONLENGTH"
  - "/dev/skeleton/ - the prerendered unlinked operator page: eight controls, the degrade panel, three read-only lines, two A/B toggles, the falsifiable heartbeat definition on the page"
  - "e2e/skeleton.e2e.ts - the no-Web-Serial degrade path over the real static build, with its precondition asserted"
  - "Three structural guards proving the page's import graph is a subset of {svelte, $lib/protocol, $lib/transport}"
affects: [02-04 hardware run, 02-05 results, 06 device session, 07 install flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The page owns the frame pump: onData -> recorder.rxChunk -> FrameScanner -> decodeFrame -> recorder.rxFrame -> absorbFrame -> queue.deliver, identity before the queue"
    - "The queue writes through a recording GridTransport wrapper, so every outbound frame is on the record before it reaches the port"
    - "Types cross the D-05 import boundary as `import(\"$lib/transport\").X` type expressions, so a page can be strictly typed without a module-scope import"
    - "Page copy whose numbers are grep-asserted lives in a script constant, not in markup, because a formatter reflows markup text and splits a value from its unit"

key-files:
  created:
    - src/lib/transport/sequence.ts
    - src/lib/transport/sequence.spec.ts
    - src/routes/dev/skeleton/+page.svelte
    - e2e/skeleton.e2e.ts
  modified:
    - src/lib/transport/index.ts
    - src/lib/protocol/constants.ts
    - src/lib/config-shape.spec.ts

key-decisions:
  - "fetchBoth gained a third parameter, stage: fetch | refetch, because STEP_IDS pins refetch-setup and refetch-timer and a two-argument fetchBoth could never emit them"
  - "The page drives the cycle from its own buttons rather than calling runNoOpCycle, so its Write back button carries the same mandatory restorePageChange in its own finally"
  - "The 300 ms keeper heartbeat is recorded as tx bytes but not as a capture step, so the eight transactions the results document is written from are not buried under two hundred beats"
  - "PROTOCOL_PIN is re-exported from src/lib/protocol/constants.ts so the capture can record the pin without the page importing a third module name"
  - "The degrade e2e asserts the panel is visible BEFORE counting the connect control, because a count taken against an unhydrated document would be zero for the wrong reason"

patterns-established:
  - "TDD per task: spec committed red, implementation committed green, then a prescribed mutation observed red and restored with git checkout against an already-staged file"
  - "A structural guard that walks a directory asserts it actually read something, so the guard cannot pass on an empty walk"

requirements-completed: [FOUND-01]

# Metrics
duration: 21 min
completed: 2026-09-03
---

# Phase 2 Plan 3: The Skeleton Page and Its Sequence Summary

**The whole no-op cycle as nine offline tests against a scripted ZONA - identity from one heartbeat, Timer before Setup, and the type 255 heartbeat as the last frame on the wire on the refusal path as well as the success path - plus the prerendered `/dev/skeleton/` operator page that drives it and a green, hardware-free e2e for the branch a large share of visitors will hit.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-03T21:31:00Z
- **Completed:** 2026-09-03T21:52:00Z
- **Tasks:** 3 (4 commits)
- **Files created:** 4, modified: 3

## Accomplishments

- **The restore rule is now structure in three independent places.** `runNoOpCycle` sends the closing
  `HEARTBEAT TYPE 255` from a `finally`; the page's Write back button holds the same rule in its own
  `finally`; and the standing `skeleton-restore` button is gated on nothing but the port being open, so
  it still works after a rejected write and after the queue has aborted. Test 7 watches the failure
  path specifically, and the deleted-`finally` mutation was observed turning it red.
- **D-10 became a rule a wrong frame cannot satisfy.** The active page moves only when three conditions
  hold at once: the class carries a `PAGENUMBER`, a `HEARTBEAT` rode in the *same* decoded frame, and
  the class carries neither `EVENTTYPE` nor `ACTIONLENGTH`. Test 9 feeds a `CONFIG/REPORT` naming page
  5 to a run identified on page 2 and asserts the page does not move - without that rule every single
  fetch would silently retarget the run.
- **Nothing in the spec is addressed to page 0.** The whole suite runs on active page 2, and the
  scripted responder answers a fetch of any other page with an empty string (firmware's own behaviour),
  so a regression that reached for a constant would be caught by D-09's guard rather than passing
  quietly.
- **The page's "bare" claim is a test, not a comment.** `config-shape.spec.ts` collects every module
  specifier in `+page.svelte` - both `from "..."` and `import("...")`, including the nine
  `import("$lib/transport").X` type expressions - and asserts the set is a subset of three names.
  Reading raw source, not comment-stripped source, so a token hidden in a comment fails too.
- **The degrade path is green with no hardware attached**, over `build/` served by `worker/index.js`
  under `wrangler dev`, with its precondition (`"serial" in navigator === false`) asserted and the
  console filtered to `type === "error"` so the package's module-scope `console.log` cannot make it
  permanently red.
- **The capture the hardware run will export is wired end to end**: the recorder is constructed once
  with `{ source: "hardware" }`, the queue writes through a recording transport so every outbound frame
  is on the record, refused frames are recorded with their reason, and the run block carries both A/B
  toggles, the pin, the timeouts and the retry bound.

## Task Commits

1. **Task 2-03-01: The no-op sequence, with the restore heartbeat in a finally** - `8b8e579` (test),
   `7407cfd` (feat)
2. **Task 2-03-02: The /dev/skeleton/ page** - `8e3e503` (feat)
3. **Task 2-03-03: The degrade e2e and the bare-import guard** - `474972a` (test)

## Files Created/Modified

| File | What it holds |
|---|---|
| `src/lib/transport/sequence.ts` | `ModuleSeen`, `Identity`, `IdentifyState`, `CycleResult`, `FetchedPair`, `BurstResult`, `newIdentifyState`, `identifyTimedOut`, `absorbFrame`, `identify`, `fetchBoth`, `writeBack`, `storeToFlash`, `restorePageChange`, `runNoOpCycle`, `runBurstProbe` |
| `src/lib/transport/sequence.spec.ts` | 9 tests, all through `FakeTransport` + `zonaResponder` |
| `src/routes/dev/skeleton/+page.svelte` | The prerendered operator page: 8 controls, the degrade panel, `skeleton-status` / `skeleton-ports` / `skeleton-others`, both toggles, the frame pump, the export |
| `e2e/skeleton.e2e.ts` | 2 tests: the degrade branch and the served-as-a-real-file check |
| `src/lib/transport/index.ts` | barrel 5 -> 6 re-exports |
| `src/lib/protocol/constants.ts` | re-exports `PROTOCOL_PIN` |
| `src/lib/config-shape.spec.ts` | 9 -> 12 tests |

## The frame pump, as the page wires it

The pump lives outside `RequestQueue` (plan 02's carry-forward: `GridTransport` has a single `onData`,
so a queue that registered it would own the only tap on the byte stream and D-07's recorder could never
see chunks or refused frames). `queue.spec.ts`'s six-line `pump()` was the reference; the page's
version adds the recorder and identity:

```
transport.onData(chunk):
  recorder.rxChunk(chunk)
  for frame in scanner.push(chunk):
    decoded = decodeFrame(frame)
    recorder.rxFrame(frame, decoded)          # refused frames too, with their reason
    if !decoded.ok: note the reason; continue
    absorbFrame(decoded.classes, state)       # identity FIRST (message-stream.store.ts:406)
    for cls in decoded.classes: queue.deliver(cls)
transport.onClose(reason): portOpen = false; stopKeeper(); queue.abort(reason)
```

Outbound bytes are recorded by a thin `GridTransport` wrapper the queue writes through, so `tx` events
exist for every frame including the ones a retry produced.

## Negative Checks (observed red, then restored)

Both mutations were applied to files already committed, and restored with `git checkout --`;
`git status --short` confirmed a clean tree afterwards in each case.

1. **Task 1 - the flagship: delete the `finally` from `runNoOpCycle`.** Replaced the `try/finally` with
   a straight-line body that sends the restore heartbeat only after a successful re-fetch.
   Red, verbatim:

   ```
    FAIL  |server| src/lib/transport/sequence.spec.ts > the no-op cycle > the restore heartbeat is still sent when a write is refused
   AssertionError: expected 'CONFIG' to be 'HEARTBEAT' // Object.is equality

   Expected: "HEARTBEAT"
   Received: "CONFIG"

    ❯ src/lib/transport/sequence.spec.ts:235:32
   ```

   Run: `Tests  1 failed | 8 passed (9)`. The last frame on the wire was the Timer `CONFIG/EXECUTE`
   that had just been refused - which is precisely the state that would leave the user's module unable
   to change page until it is power-cycled.

2. **Task 3 - render the connect button unconditionally.** Split the degrade/connect conditional so the
   connect control renders beside the degrade panel instead of instead of it.
   Red:

   ```
   Error: the connect control is absent, not merely disabled

   expect(received).toBe(expected) // Object.is equality

   Expected: 0
   Received: 1

     at C:\Users\sabot\Documents\Claude\hangar\e2e\skeleton.e2e.ts:49:7
   ```

   Run: `1 failed ... 1 passed`. The degrade panel stayed visible throughout, so the count assertion is
   the only thing that caught it - which is what it is for.

## Verification

| Check | Result |
|---|---|
| `sequence.spec.ts` | `Tests 9 passed (9)` |
| `config-shape.spec.ts` | `Tests 12 passed (12)` |
| `npm run test:quick` | `Test Files 24 passed (24)`, `Tests 442 passed \| 1 todo (443)` - 430 + 9 + 3 |
| `npm run test:sweep` | `Tests 9 passed (9)` - unchanged |
| `npm run check` | `383 FILES 0 ERRORS 0 WARNINGS` |
| `npm run lint` | exit 0 |
| `npm run build` + `test -f build/dev/skeleton/index.html` | both exit 0 |
| `grep -c "skeleton-status" build/dev/skeleton/index.html` | 1 - the page really was prerendered |
| `npx playwright test` | `10 passed`; `grep -c "10 passed" .tmp-e2e/skeleton.log` = 1, `grep -c "failed"` = 0 |
| `grep -c "finally" sequence.ts` | 1 |
| `grep -c "restorePageChange" sequence.ts` | 3 (definition, the call in the `finally`, and the `finally`'s own comment naming it) |
| `grep -cE "TYPE:\s*254" sequence.ts` | 0 |
| `grep -cE "Promise\.all" sequence.ts` | 0 |
| `grep -cE "activePage\s*=\s*0\|page:\s*0\b" sequence.ts` | 0 |
| `grep -c "src/vendor" / "_pad" sequence.ts` | 0 / 1 |
| first `EVENT_` inside `writeBack` | `EVENT_TIMER` (line 11 of the sed range) |
| `grep -c "export \*" src/lib/transport/index.ts` | 6 |
| eleven `skeleton-*` testids in the page | status, connect, fetch, write, store, refetch, restore, export, burst, degrade, others = 1 each; `skeleton-ports` = 1 |
| `grep -c "$lib/pad" / "src/vendor" / "Chromium"` in the page | 0 / 0 / 0 |
| `grep -c "await import"` in the page | 2 |
| `grep -cE "^\s*import .*\$lib/(protocol\|transport)"` in the page | 0 |
| `grep -c "getPorts" / "failureCopy" / "requestPort"` in the page | 1 / 2 / 3 |
| `grep -c "setInterval"` in the page | 0 |
| `grep -ci "keep this tab in front" / "power-cycled"` | 1 / 1 |
| `grep -c "1000 ms" / "500 ms" / "3000 ms" / "3 per second"` | 1 / 1 / 1 / 1 |
| `grep -c 'source: "hardware"'` in the page | 1 |
| `grep -ci "failed"` in `e2e/skeleton.e2e.ts` and in the page | 0 / 0 |
| `grep -c "test-results"` in the e2e | 0; `.tmp-e2e` in `.gitignore` = 1 |
| both `page.goto` calls | `"/dev/skeleton/"`, with the trailing slash |
| stale-wrangler preflight | run before every build and every e2e run: **nothing was ever listening on 4173**; nothing left afterwards (`netstat` clean, no `workerd`) |
| tree state | clean |

## Decisions Made

- **`fetchBoth` takes a `stage` parameter.** `STEP_IDS` pins `refetch-setup` and `refetch-timer`, and
  plan 05's gate reads those ids to tell the before-fetch from the after-fetch. The plan's
  two-argument signature could never emit them, so the third parameter defaults to `"fetch"` and the
  cycle passes `"refetch"` for the second pass.
- **The page drives the cycle from its own buttons, not from `runNoOpCycle`.** The control table
  specifies separate Fetch, Write back, Re-fetch and Store clicks (D-11: nothing is written without a
  click), so `runNoOpCycle` is the tested composition rather than the page's entry point - which means
  the page's Write back button has to carry the restore rule itself. It does, in its own `finally`,
  with a comment pointing at the same firmware lines.
- **The keeper heartbeat is ambient traffic, not a step.** Its bytes are recorded as `tx` events like
  everything else, but a 60 second run at 300 ms would put two hundred `restore-page-change` steps in
  the capture and bury the eight transactions `docs/SKELETON-RESULTS.md` is written from. The page
  suppresses the step emission for the keeper only, via a flag that is set for the duration of the
  `sendImmediate` call; the deliberate restore, from the button or from the write path, is recorded
  normally.
- **`PROTOCOL_PIN` is re-exported from `src/lib/protocol/constants.ts`.** `CaptureRun.protocolPin` is
  required and D-05 caps the page at two import names. The literal still lives only in
  `src/lib/protocol-pin.ts`, where `protocol-pin.spec.ts` holds it against `package.json` and the
  lockfile; the re-export is the surface, not a second copy.
- **The falsifiable definition is a script constant.** Written in markup, Prettier reflowed it and
  split `1000` from `ms` across a line break, which broke the plan's own acceptance grep and, more
  importantly, would have made the page's most load-bearing sentence formatter-dependent. As a string
  it is verbatim, on one line, and cannot be reflowed.
- **Types cross the import boundary as type expressions.** `import("$lib/transport").Identity` is a
  type position only - it emits no runtime import, so the page keeps `svelte`, `$lib/protocol` and
  `$lib/transport` as its whole graph while still being strictly typed. `svelte-check` reports 0
  errors on the page.
- **The degrade e2e waits for the panel before counting the connect control.** The page decides
  availability in `onMount`, so before hydration *neither* control exists and a bare count would be
  zero for the wrong reason. Asserting the panel visible first is what makes the count mean "absent"
  rather than "not there yet" - and the negative check confirms the count still catches a connect
  button that should not be there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `fetchBoth` needed a stage parameter to emit the pinned re-fetch step ids**

- **Found during:** Task 1
- **Issue:** The plan's signature is `fetchBoth(q, id)`, but the same function performs both the
  before-fetch and the after-fetch inside `runNoOpCycle`, and `STEP_IDS` pins four distinct ids
  (`fetch-setup`, `fetch-timer`, `refetch-setup`, `refetch-timer`). With two arguments the re-fetch
  could only report under the fetch ids, and plan 05's gate - which the plan says must be writable
  now - could not tell the two passes apart.
- **Fix:** Added `stage: "fetch" | "refetch" = "fetch"` as a third parameter. Every existing call site
  and the plan's own test 4 are unchanged.
- **Files modified:** `src/lib/transport/sequence.ts`
- **Verification:** `Tests 9 passed (9)`; test 4 asserts the emitted ids are exactly
  `["fetch-setup", "fetch-timer"]`.
- **Committed in:** `7407cfd`

**2. [Rule 3 - Blocking] The capture's `protocolPin` had no browser-reachable source**

- **Found during:** Task 2
- **Issue:** `CaptureRun.protocolPin` is a required field and the pin literal lives in
  `src/lib/protocol-pin.ts`, which the page may not import (D-05 caps it at `svelte`,
  `$lib/protocol`, `$lib/transport`, and `config-shape.spec.ts` test 10 asserts exactly that).
  Restating the pin in the page would create a second copy that a bump would silently leave stale.
- **Fix:** `src/lib/protocol/constants.ts` re-exports `PROTOCOL_PIN` from the existing module, so the
  page reaches it through an allowed surface and the literal stays in one place under
  `protocol-pin.spec.ts`'s three assertions.
- **Files modified:** `src/lib/protocol/constants.ts`
- **Verification:** `protocol-pin.spec.ts` unchanged and green; `npm run test:quick` 442 passed.
- **Committed in:** `8e3e503`

**3. [Rule 2 - Missing Critical] The page's Write back button needed its own restore `finally`**

- **Found during:** Task 2
- **Issue:** The plan puts the restore heartbeat in `runNoOpCycle`'s `finally`, but the page's control
  table drives the cycle from separate clicks and never calls `runNoOpCycle`. As specified, a real
  hardware write from the page would have left `page_change_enabled = 0` on the user's module unless
  they remembered to press Restore - exactly the state the phase's core rule exists to prevent.
- **Fix:** `doWriteBack` wraps `writeBack` in a `try/finally` that calls `restorePageChange`, with a
  comment naming the same firmware lines. The standing `skeleton-restore` button remains gated on
  nothing but the port being open.
- **Files modified:** `src/routes/dev/skeleton/+page.svelte`
- **Verification:** read back in the file; the same property is proven mechanically for the shared
  function by `sequence.spec.ts` test 7 and its negative check.
- **Committed in:** `8e3e503`

**4. [Rule 1 - Bug] The degrade e2e's assertion order could have passed for the wrong reason**

- **Found during:** Task 3
- **Issue:** The plan orders the assertions precondition -> connect count -> degrade visible.
  `getByTestId(...).count()` takes a snapshot and does not auto-wait, and the page decides
  availability in `onMount`, so a count taken before hydration returns 0 whether or not the connect
  control would eventually render - the precise "passes for the wrong reason" failure the plan's own
  precondition assertion exists to avoid.
- **Fix:** `await expect(degrade).toBeVisible()` runs before the count, so hydration is proven first.
  Everything the plan specifies is still asserted, and the prescribed negative check (render the
  connect button unconditionally) was observed going red on the count assertion, which confirms the
  reordering did not weaken it.
- **Files modified:** `e2e/skeleton.e2e.ts`
- **Verification:** `10 passed`, and the mutation run above.
- **Committed in:** `474972a`

**5. [Rule 1 - Bug] The falsifiable definition was reflowed by Prettier and lost `1000 ms`**

- **Found during:** Task 2
- **Issue:** Written as markup, the sentence formatted to `... within 1000\n      ms; ...`, so
  `grep -c "1000 ms"` printed 0. The acceptance criterion caught it, but the real problem is that the
  page's most load-bearing sentence would then be formatter-dependent.
- **Fix:** Moved the definition into a `HEARTBEAT_REQUIRED` script constant, verbatim from the plan's
  `<interfaces>` block, and rendered it as `{HEARTBEAT_REQUIRED}`. Prettier does not reflow string
  contents.
- **Files modified:** `src/routes/dev/skeleton/+page.svelte`
- **Verification:** `grep -c` prints 1 for each of `1000 ms`, `500 ms`, `3000 ms`, `3 per second`
  after `prettier --write`.
- **Committed in:** `8e3e503`

### Small additions inside the plan's intent

- **`newIdentifyState()` and `identifyTimedOut()`** are exported beside the declared `IdentifyState`.
  The plan describes both behaviours in prose ("`firstSeenAt` ... for `IDENTIFY_WINDOW_MS`", "the page
  refuses with a message if that has not happened inside `IDENTIFY_WINDOW_MS`") without naming the
  functions; making them functions keeps the window rule in the tested module instead of in the page.
- **`FetchedPair` and `BurstResult`** are named interfaces rather than inline object types, so the page
  can annotate its state without restating the shapes.
- **The word `failed` was removed from the page source** (one comment) so no assertion diff can ever
  echo it into the e2e log the gate greps.
- **`config-shape.spec.ts` test 12 asserts it actually read some routes**, so the guard cannot pass on
  an empty directory walk.

---

**Total deviations:** 5 auto-fixed (2 bug, 2 blocking, 1 missing critical) + 4 small additions
**Impact on plan:** No file, test count or acceptance criterion changed. Every count is exactly as
planned - `sequence.spec` 9, `config-shape` 12, quick 24 files / 442 passed | 1 todo, e2e 10 passed.
Three of the five fixes exist because the page drives the cycle by hand rather than through
`runNoOpCycle`, which is what the plan's own control table specifies.

## Issues Encountered

- `decode_packet_frame`'s failure logging is `console.log` and cannot be suppressed, so the Playwright
  console assertion had to be filtered to `type === "error"` exactly as plans 01 and 02 predicted. It
  is, and the run is clean.
- Prettier reflowing markup text broke a numeric acceptance grep (deviation 5). Worth remembering for
  any future page copy whose exact wording is asserted: put it in a string.
- `link` (the `WebSerialTransport` reference) was assigned and never read, which ESLint rejects. The
  transport stays alive through the `closeOnHide` teardown closure and the recording wrapper, so the
  variable was removed rather than suppressed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 04 (the hardware run) has everything it needs.** `/dev/skeleton/` is a real prerendered file,
  reachable at `/dev/skeleton/` (with the trailing slash) on `npm run preview` over `localhost`, and on
  the Basic-Auth preview URL once **the user** deploys - the executor never deploys.
- **The run to perform, in the order the page supports it:** set the two toggles before connecting
  (they are locked once the port is open, so an arm cannot change mid-run), Connect, wait for the
  status line to name the module and its active page, Fetch, Write back (RAM), Re-fetch, Store to
  flash, Run burst probe, Export JSON. Then flip the toggles and do it again for the other arm.
- **FOUND-01 stays `Pending`.** Nothing here has touched hardware. Plan 05 marks it after the run and
  after `docs/SKELETON-RESULTS.md` exists.
- **What is still entirely untested by machine:** everything inside `WebSerialTransport` (the read
  loop, the close ordering, the two `navigator.serial` listeners), the picker itself, and every latency
  number the page will print. That is the point of the checkpoint.
- **One thing to watch during the run:** the identify window is 1500 ms. If the status line reports that
  no heartbeat carrying an active page arrived, the module is either not the one on the USB cable or is
  on firmware older than the piggybacked page report - it is not a HANGAR bug, and the page says so.

## Self-Check: PASSED

All 4 created files verified present on disk; all 4 task commits verified in `git log`.

---

*Phase: 02-walking-skeleton*
*Completed: 2026-09-03*
