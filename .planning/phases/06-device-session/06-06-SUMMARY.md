---
phase: 06-device-session
plan: 06
subsystem: testing
tags: [fake-serial, playwright, probe-route, capability, insecure-context, cancelled, webkit, CONN-01, CONN-02, CONN-05, DEGR-02]

# Dependency graph
requires:
  - "src/lib/device/session.svelte.ts (06-03, 06-04) — the finished machine: start(), connect(), disconnect(), forget(), failureFor(), the navigator-level listener pair that reads ev.target"
  - "src/lib/device/session-copy.ts (06-02) — CONNECT_LABEL, PERMISSION_DECLINED, firmwareText; the probe's and the tests' vocabulary"
  - "src/lib/transport/transport.ts (02-01, 06-01) — failureCopy, whose titles the tests hold instead of literals"
  - "src/lib/config-shape.spec.ts test 12 (06-05) — the discovery scan whose stated limit this plan closes"
  - "e2e/skeleton.e2e.ts (04-04) — the prototype delete that proves navigator.serial is a configurable accessor"
  - "06-RESEARCH.md § Code Examples 4 and 5 — the shim's reference implementation and the insecure-branch trick"
  - "06-05-SUMMARY.md — PREV_FILES / PREV_TESTS 68 / 715, PREV_E2E 61, the five-name block"
provides:
  - "e2e/fake-serial.ts — FAKE_SERIAL for context.addInitScript and the HangarSerial control surface on window.__hangarSerial: grant, pick, reject, throwOnRequest, busy, openFails, unplug, replug, feed, forgotten, writes"
  - "src/routes/dev/session/+page.svelte — the fifth unlinked probe: phase, identity line, failure title / detail / steps for CONNECT ZONA, permission-declined sentence, canForget, writes; three real buttons"
  - "e2e/session.e2e.ts — four browser gates: idle, unsupported (@webkit), insecure, cancelled plus declined"
  - "PREV_E2E re-measured at 66 by this plan"
affects:
  - "06-07 — drives the offer, the busy port, the unplug and the replug through the same shim and the same probe; feeds the committed capture through feed()"
  - "06-09 — the second call site of start(); the guard's comment names it"
  - "06-13 — re-measures PREV_E2E from 66"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 6/14"

tech-stack:
  added: []
  patterns:
    - "A browser capability with no automation hook is faked at the property that makes it detectable: navigator.serial is a configurable accessor on Navigator.prototype, so the slot the degrade tests delete is the slot the shim defines, on both engines"
    - "A fake event source that has no event path dispatches at both ends of the path it is standing in for, with an own `target` on the forwarded event - and the assertion that catches the missing bubble is written and observed red before it is trusted"
    - "A fixture that is modelled on a source reading says so in its header and names the hardware runbook row that closes the circle"
    - "A probe page renders the store's fields verbatim and no chrome, so a browser test can assert on states the shipped chrome compresses, and so the store is proven in a browser before any component exists to hide a bug in"
    - "A discovery scan's stated limit is closed by the plan that creates the thing it could not see: the mutation that was green in 06-05 is re-run and observed red"

key-files:
  created:
    - "e2e/fake-serial.ts"
    - "src/routes/dev/session/+page.svelte"
    - "e2e/session.e2e.ts"
    - ".planning/phases/06-device-session/06-06-SUMMARY.md"
  modified:
    - "src/lib/device/session.svelte.ts"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The forwarded event is a REAL Event with an own `target` accessor, not a Proxy: dispatchEvent brand-checks its argument and refuses a Proxy, and an own property on the instance shadows Event.prototype's getter for the life of the dispatch. Observed on both engines, and observed red with the own property removed"
  - "forget() on the fake marks the port and getPorts() filters it, rather than splicing it out of the list, so every index a test holds stays valid after a forget"
  - "The insecure test installs the shim AND shadows isSecureContext rather than relying on the engine's own navigator.serial: the branch needs serial present, and on the phone project or a future engine change the shim is what guarantees it; the precondition asserts both halves"
  - "The probe's permission-declined readout renders the PERMISSION_DECLINED sentence itself when set, not a boolean, so the test asserts the sentence the chrome will add rather than a flag the chrome will never show"
  - "The @webkit tag is written once, at the end of the title, as every tagged title in the tree is; the plan wrote it twice and one grep hit is what the project filter needs"
  - "#started already existed as an instance field with its guard (06-03); what this plan adds is the comment naming both call sites and the reason it is not module-scope"

requirements-completed: []
requirements-contributed: [CONN-01, CONN-02, CONN-05, DEGR-02]

# Metrics
duration: 19min
completed: 2026-09-05
---

# Phase 6 Plan 06: The fake serial, the /dev/session/ probe, and the two capability messages Summary

**A ZONA that never existed can now be granted, picked, refused, unplugged and replugged from a Playwright test on both engines, and the session's two capability messages plus its cancelled state are proven in the browsers that produce them. `e2e/fake-serial.ts` redefines `navigator.serial` on the same prototype slot the degrade tests delete and dispatches `connect` / `disconnect` at BOTH the fake port and the fake serial object, with the forwarded event carrying an own `target` - the one detail that would otherwise let every navigator-level test pass against a page that fails in a real browser, so it was observed green on both engines and then observed RED with that property removed before the throwaway was deleted. `/dev/session/` is the fifth unlinked probe, a plain-text readout of every field the session publishes, and 06-05's `dev/session` mutation that was green because the directory did not exist is red today naming `+page.svelte`. Four browser tests, one tagged `@webkit`: e2e is 61 + 5 = 66, and the `insecure` branch rendered in a real browser for the first time in this project. Quick stays 68 / 715, sweep `3 13`.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. **`PREV_E2E` re-measured here.**

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **66 (measured by 06-06)** | `npm run test:e2e` on this tree at `2665f63`: `66 passed (1.2m)`. Rolls next at 06-07   |

### Observed totals: previous SUMMARY plus this plan's delta

06-05 left the tree at **68 files / 715 tests**. This plan adds **+0 files / +0 tests** to quick - it adds no unit test - so quick stands at **68 / 715**, still `BASE_FILES + 2` and `BASE_TESTS + 24`. Sweep is unchanged at **`3 13`**. E2E is **61 + 5 = 66**: four titles, one tagged, so four on chromium and one again on webkit-phone.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 715
  check-counts: observed 68 files, 715 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  counted 1296 combinations in 2.7s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npm run test:e2e 2>&1 | tee .tmp-e2e/06-06-suite.log | node scripts/check-counts.mjs --playwright 66
  check-counts: observed 66 tests passed
  check-counts: matches the expected counts
  66 passed (1.2m)

npx playwright test e2e/session.e2e.ts --project chromium       ->  4 passed (15.7s)
npx playwright test e2e/session.e2e.ts --project webkit-phone   ->  1 passed (14.1s)
npx playwright test --list                                      ->  Total: 66 tests in 11 files
npx playwright test --project webkit-phone --list               ->  Total: 9 tests in 3 files
npx vitest run --project server src/lib/config-shape.spec.ts    ->  14 passed (14)
npx vitest run --project server src/lib/device/session.spec.ts  ->  15 passed (15)

npm run check 2>&1 | grep -Ei "error|warning"
  1788578593553 COMPLETED 525 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` goes from 523 to **525 files**: the probe page and its generated `$types`. The two `e2e/` files are outside the tsconfig's include (it lists `src/` and `test/`) and are linted, not type-checked, exactly like every other file under `e2e/`. After the suite: **no listener on 4173 and no `workerd.exe` or `wrangler` process** - Playwright shut down its own webServer tree each time.

## Task 1 — `e2e/fake-serial.ts`, a scripted serial that bubbles like the real one (commit `6a1fd5a`)

290 lines, a fixture module. `npx playwright test --list` collects **no title from it**: `grep -c fake-serial` over the list is `0`, and the total was `61` before the test file existed - unchanged from `PREV_E2E`.

### The two load-bearing details

`Object.defineProperty(Navigator.prototype, "serial", { configurable: true, get: () => serial })` - the accessor slot `e2e/skeleton.e2e.ts` deletes. On the phone engine the slot does not exist and `defineProperty` creates it, which the self-check below confirmed.

The bubble, quoted from the committed file:

```ts
  /**
   * BOTH targets, port first, mirroring a real bubble. The second event is a
   * real Event (dispatchEvent brand-checks its argument, so a Proxy would be
   * refused) with an own `target` that shadows the prototype getter.
   */
  const fire = (type: "connect" | "disconnect", port: FakePort): void => {
    port.dispatchEvent(new Event(type, { bubbles: true }));
    const forwarded = new Event(type, { bubbles: true });
    Object.defineProperty(forwarded, "target", {
      configurable: true,
      get: () => port,
    });
    serial.dispatchEvent(forwarded);
  };
```

The research's reference used a `Proxy` over the Event for the second dispatch. That cannot work: `EventTarget.dispatchEvent` brand-checks its argument and a Proxy is not an Event. An own accessor on a real Event instance shadows `Event.prototype.target` for the whole dispatch, which the self-check proved on both engines.

### The control surface

Every row of the plan's table, on `window.__hangarSerial` with a `HangarSerial` interface and a `declare global` augmentation so a test types it without `any`. Two shapes worth naming: `requestPort()` is **not** `async`, so `throwOnRequest` leaves it with a synchronous throw - the lost-activation shape the session's `try` around the call exists for - while `pick` and `reject` return a settled promise; and `forget()` marks the port and `getPorts()` filters it rather than splicing the list, so every index a test holds stays valid after a forget. `open()` on an already-open fake throws the browser's own `InvalidStateError` wording; `unplug()` ends the readable stream so a pending `read()` resolves done, which is how `WebSerialTransport`'s read loop exits. `feed()` takes a `number[]` the test reads in Node from the committed capture; nothing is inlined.

### The header states the circularity

Quoted: *"It is MODELLED ON A SOURCE READING of the browser (06-RESEARCH.md, The Replug Identity Trap), so it can only show that HANGAR is consistent with that reading. The replug behaviour in particular - `replug()` mints a NEW port object and fires `connect` at it, never at the object the session already holds - is Chromium's as read from serial_service.cc and serial.cc, and this shim reproducing it is not evidence that the browser does it. That circle is closed by a human with a module on the desk: docs/SESSION-RUNBOOK.md row B, the unplug-and-replug row, written by plan 06-14."* The same limit is stated for the busy port and the cancelled chooser, and the two things the shim proves completely - zero writes, and the two capability branches - are named beside them.

### The bubble self-check, verbatim

A throwaway `e2e/zz-bubble-selfcheck.e2e.ts`, one title tagged `@webkit`, installing the shim on `/`. From `page.evaluate`: `"serial" in navigator`; `Array.isArray(await navigator.serial.getPorts())`; a `connect` listener added to `navigator.serial`; `replug()` fired; then `getPorts()` asked for the list so the minted object could be compared by identity with what the listener saw.

```
Running 2 tests using 2 workers
[webkit-phone] › e2e\zz-bubble-selfcheck.e2e.ts:5:1 › bubble self-check @webkit
BUBBLE SELF-CHECK {"hasSerial":true,"isArray":true,"seen":1,"type":"connect","listLength":1,"targetIsPort":true,"targetIsSerial":false,"targetIsNull":false}
[chromium] › e2e\zz-bubble-selfcheck.e2e.ts:5:1 › bubble self-check @webkit
BUBBLE SELF-CHECK {"hasSerial":true,"isArray":true,"seen":1,"type":"connect","listLength":1,"targetIsPort":true,"targetIsSerial":false,"targetIsNull":false}
  2 passed (21.4s)
```

**All four assertions held on both engines, and `ev.target` was the port.** Then the negative the plan implies, because an assertion nobody has watched fail is a hope: the three-line `Object.defineProperty(forwarded, "target", …)` block was removed by the runner and the throwaway re-run on chromium:

```
BUBBLE SELF-CHECK {"hasSerial":true,"isArray":true,"seen":1,"type":"connect","listLength":1,"targetIsPort":false,"targetIsSerial":true,"targetIsNull":false}
  1) [chromium] › e2e\zz-bubble-selfcheck.e2e.ts:5:1 › bubble self-check @webkit
    Error: target is the serial object
    Expected: false
    Received: true
  1 failed
    restored byte-identical: true
```

**Red, for exactly the reason the header describes**: without the own property the forwarded event reports the serial object, and a session listener reading `ev.target` would call `getInfo()` on the wrong thing. Restored; the throwaway was deleted; `--list` returned to `Total: 61 tests in 10 files`.

## Task 2 — `/dev/session/`, the readout the real chrome will compress (commit `bba89c3`)

### The probe

`src/routes/dev/session/+page.svelte`: prerendered through the layout's `prerender = true` and `trailingSlash: "always"`, linked from nowhere, plain `<dl>` markup, two static specifiers (`$lib/device/session.svelte` and `$lib/device/session-copy`, both on test 13's permitted list) and `svelte`. The testids, as the interfaces block lists them: `session-phase` (verbatim), `session-identity` (`ZONA <type> fw <M.m.p> page <n> others <a, b>` or `none`), `session-failure-title` / `-detail` / `-steps` from `session.failureFor(CONNECT_LABEL)` or `none`, `session-can-forget`, `session-writes` (the shim's counter when present, else `0`, re-read whenever the session publishes a phase or an identity), plus `session-permission-declined` (see deviation 2). Three buttons: `session-connect` calls `session.connect()` as its only statement, `session-disconnect` and `session-forget` call the other two. `onMount(() => session.start())`.

The header describes its four siblings in prose - *the walking skeleton's, the fidelity one, the catalog one and the tuning one* - and records both observations of the probe-route scan (06-05's green, this plan's red).

```
npm run build && ls -la build/dev/session/index.html
  -rw-r--r-- 1 sabot 197609 7969 Sep  5 05:21 build/dev/session/index.html
```

### `start()` is idempotent - the guard existed, the comment is new

The guard (`if (this.#started) return; this.#started = true;`) and the instance field were written by 06-03 (its inherits list names `#started`). What this plan adds is the comment the plan asks for, quoted:

```ts
  /**
   * start() runs once per instance; a second call is a no-op rather than a
   * second listener pair. TWO CALL SITES: the session probe page starts the
   * singleton from its own onMount (plan 06-06), and the root layout starts
   * it for the whole site (plan 06-09) - so on the probe route both run, and
   * whichever is second must attach nothing.
   *
   * An INSTANCE field, not a module-scope flag, on purpose: every node test
   * constructs its own DeviceSession, and a module-scope flag would be shared
   * across instances, so the second test in session.spec.ts would find
   * start() already spent and would silently assert against a session that
   * never attached a listener.
   */
  #started = false;
```

`session.spec.ts` with the guard in place - fifteen tests, every one constructing its own instance and calling `start()`, several files' worth of second and third calls in one file:

```
npx vitest run --project server src/lib/device/session.spec.ts
 Test Files  1 passed (1)
      Tests  15 passed (15)
```

### The 06-05 mutation, re-run: green then, red now

06-05 planted `dev/session` inside `src/routes/+page.svelte`'s header comment and observed **14 passed** - the directory did not exist, so a discovery-based scan had nothing to discover. The same insertion, by the same runner, on this tree:

```
=== NEGATIVE: dev/session named in the front door: src/routes/+page.svelte
    insert after "<!--": " dev/session planted by 06-06 task 2, restored immediately"
     × every probe route under /dev/ is linked from nowhere 8ms
 FAIL  |server| src/lib/config-shape.spec.ts > build configuration shape > every probe route under /dev/ is linked from nowhere
AssertionError: expected [ '+page.svelte mentions dev/session' ] to deeply equal []
+   "+page.svelte mentions dev/session",
      Tests  1 failed | 13 passed (14)
    restored byte-identical: true
```

**Red, naming the file and the route.** The limit 06-05 recorded is closed: the fifth probe is protected from the day it exists. Restored; **14 passed**.

## Task 3 — four browser gates: unsupported, insecure, idle, cancelled (commit `2665f63`)

`e2e/session.e2e.ts`, all against `/dev/session/`, every test asserting its own precondition first and collecting console errors in the house pattern. The titles hold `failureCopy(...)` from `../src/lib/transport/transport` with `CONNECT_LABEL`, never a literal.

1. **a granted-free browser rests at NO ZONA and writes nothing** - shim, nothing granted. Precondition `"serial" in navigator` is `true`. `session-phase` reads `idle`; title, detail, steps and identity all read `none`; `writes()` is 0 and `session-writes` reads `0`.
2. **a browser with no Web Serial names the browsers that do @webkit** - no shim; `delete Navigator.prototype.serial`. Precondition `false`. `unsupported`; the title and detail are `failureCopy("no-web-serial")`'s; the detail names Chrome, Edge and Firefox 151; the body contains no `Chromium`. On webkit-phone the delete is a no-op on a slot that never existed, and the branch renders on the engine that can never install.
3. **an insecure context is a different message from an unsupported browser** - shim installed and `Object.defineProperty(window, "isSecureContext", { configurable: true, value: false })`. Precondition `{ hasSerial: true, secure: false }` - the combination no shipping browser produces on its own. `insecure`; the title is `failureCopy("insecure-context")`'s, differs from test 2's, and contains `HTTPS`. **This is the first time the `insecure` branch has rendered in a real browser in this project**: `navigator.serial` is `[SecureContext]` in every engine that ships it, so until this test the sentence had only ever been produced by a node test over `capabilityOf`.
4. **a cancelled chooser is its own state, and a declined permission adds one sentence** - `reject()` with the default `NotFoundError`, click `session-connect`: `cancelled`, title `You closed the chooser` (asserted equal to `failureCopy("cancelled").title` and to the literal), exactly one `<li>` reading `Click CONNECT ZONA again and pick the ZONA`, permission-declined reads `none`. Then `reject("NotAllowedError", …)`, click again: still `cancelled`, same title, and `session-permission-declined` reads `PERMISSION_DECLINED` verbatim. `writes()` is 0 at the end.

No console errors in any of the four, on either project.

### The arithmetic, and the tag negative in both places

Four titles, one tagged: `PREV_E2E + 5` = **66**, observed by `--list` (`Total: 66 tests in 11 files`) and by the run (`66 passed`). `--project webkit-phone --list` shows **9** (was 8), one of them from this file. With the `@webkit` removed from test 2's title by the runner:

```
=== NEGATIVE: @webkit tag removed - suite total
Total: 65 tests in 11 files
    restored byte-identical: true
=== NEGATIVE: @webkit tag removed - webkit-phone
Total: 8 tests in 2 files
    restored byte-identical: true
```

**Both drop by one.** Restored; 66 and 9.

## Deviations from Plan

### 1. [Rule 1 - Bug] The research's `Proxy` event cannot be dispatched

**Found during:** task 1, writing `fire()`. **Issue:** 06-RESEARCH Code Example 4 forwards `new Proxy(new Event(type), …)` to the serial object; `dispatchEvent` brand-checks its argument and refuses a Proxy. **Fix:** a real `Event` with an own `target` accessor, which the self-check proved on both engines and proved load-bearing by mutation. **Files:** `e2e/fake-serial.ts`. **Commit:** `6a1fd5a`.

### 2. [Rule 2 - Missing critical functionality] The probe renders the declined sentence, not a flag

**Found during:** task 3, writing test 4. **Issue:** the plan's test asserts "the declined sentence is present", but the interfaces table lists no readout for `permissionDeclined`, and a boolean would let the test pass while the chrome rendered nothing. **Fix:** `session-permission-declined` renders `PERMISSION_DECLINED` when the flag is set and `none` otherwise; the test asserts the sentence verbatim from `session-copy`. **Files:** `src/routes/dev/session/+page.svelte`, `e2e/session.e2e.ts`. **Commit:** `2665f63`.

### 3. [Scope] `#started` already existed; only its comment is new

06-03 wrote the instance field and the guard, and 06-04's inherits list names it. Adding a second guard would have been a no-op; the plan's actual gap - a comment naming both call sites and the instance-field reason - is what was written (quoted above). **Files:** `src/lib/device/session.svelte.ts`. **Commit:** `bba89c3`.

### 4. [Process] The tag is written once

The plan writes test 2's title with `@webkit` at both ends. Every tagged title in the tree ends with the tag once, `playwright.config.ts`'s `grep: /@webkit/` needs one hit, and the count arithmetic is the same either way. The title ends with the tag once.

### 5. [Process] The insecure test installs the shim as well

The plan says "leave `navigator.serial` in place". The chromium project over `http://127.0.0.1` does have the real accessor, but the test also asserts `writes()`, which only the shim provides, and the shim IS `navigator.serial` left in place on any engine. The precondition asserts both halves - serial present, context insecure - so nothing about the branch is assumed.

### 6. [Process] A runner for non-vitest negatives, and one `test-results/` directory

06-05's `mutate.mjs` runs one vitest spec. This plan's negatives run Playwright commands, so `scratchpad/mutate-cmd.mjs` takes an arbitrary command after `--`, replaces one unique occurrence, restores in a `finally` and reports byte-identity; it was used for the bubble negative and both halves of the tag negative. The bubble negative's failing run wrote Playwright's default `test-results/` (gitignored), which the standing rules say must not be where results go, and the green full suite left a `.last-run.json` in the same directory; both were removed by hand and the observation is deferred item 5.

### 7. [Process] A Phase 7 commit landed mid-run

`2a72bc7` (*docs(07): plan revision 1 …*) landed between this plan's task 2 and task 3 commits. Nothing under `.planning/phases/07-install-flow/` was read, staged or formatted here; every commit used `--only -- <paths>`.

## Requirements

**`requirements-contributed: [CONN-01, CONN-02, CONN-05, DEGR-02]`** - contributed, not completed, on the phase's convention. The two capability messages, the cancelled state and the present-but-disabled promise are proven in the browsers that produce them, on a probe; no shipped chrome renders them until 06-10 and 06-11, and DEGR-02 is Phase 7's requirement. None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. The probe renders live session fields; `session-writes` reads `0` when no shim is installed because there is genuinely nothing counting, and the test that asserts it installs the shim.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs; **`PREV_E2E` is 66, measured by 06-06**.
- `PREV_FILES` / `PREV_TESTS` for plan 06-07 are **68 / 715**.
- `e2e/fake-serial.ts`: `import { FAKE_SERIAL } from "./fake-serial"` and `context.addInitScript(FAKE_SERIAL)` before the first `goto`; the `HangarSerial` type is on `window` through a `declare global`. `grant()` returns an index; `replug()` mints a NEW object and returns its index; `feed(i, bytes)` takes a `number[]` - read the rx chunks of `src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json` in Node and push them, never inline them; `busy(i)` makes `open()` throw `NetworkError`; `unplug(i)` fires `disconnect` and ends the stream; `forgotten(i)` and `writes()` are the two things to assert.
- `/dev/session/`: the testids above, plus `session-permission-declined`. Buttons `session-connect`, `session-disconnect`, `session-forget`. The identity line reads `ZONA <type> fw <M.m.p> page <n> others <a, b>` with `others none` for a single module.
- `scratchpad/mutate-cmd.mjs <file> <search> <replacement> <label> -- <cmd…>` for a negative over any command; `mutate.mjs` is still the one for a vitest spec.
- Every Playwright run creates `test-results/` by default - `.last-run.json` on green, artefacts on red (deferred item 5); remove it before the tree is called clean.

## Self-Check: PASSED

Files claimed, verified present:

- `e2e/fake-serial.ts` - FOUND
- `src/routes/dev/session/+page.svelte` - FOUND
- `e2e/session.e2e.ts` - FOUND
- `src/lib/device/session.svelte.ts` - FOUND (modified)
- `.planning/phases/06-device-session/06-06-SUMMARY.md` - FOUND

Files claimed deleted, verified absent:

- `e2e/zz-bubble-selfcheck.e2e.ts` - ABSENT
- `test-results/` - ABSENT

Commits claimed, verified in `git log`:

- `6a1fd5a` test(06-06): e2e/fake-serial.ts - a scripted serial that bubbles like the real one - FOUND
- `bba89c3` feat(06-06): /dev/session/ - the readout the real chrome will compress - FOUND
- `2665f63` test(06-06): four browser gates - unsupported, insecure, idle, cancelled - FOUND
