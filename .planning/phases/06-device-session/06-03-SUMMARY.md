---
phase: 06-device-session
plan: 03
subsystem: device
tags: [session, runes, web-serial, light-seam, reconnect, chooser, identify, CONN-01, CONN-05, CONN-06, CONN-07]

# Dependency graph
requires:
  - "src/lib/device/session-copy.ts (06-02) — SessionPhase, FAILURE_COPY_STATES, capabilityOf and the three authored blocks, all import-free"
  - "src/lib/transport/transport.ts (02-01, 06-01) — OpenFailure, classifyOpenError and failureCopy, in a module with ZERO imports, which is what makes failureFor synchronous"
  - "src/lib/device/try-on.ts (04-08, 06-01) — identifyOnly and its injectable now/pollMs/sleep"
  - "src/lib/transport/fake.ts (02-05) — FakeTransport.fromCapture, instant mode"
  - "src/lib/transport/fixtures/zona-hardware-a-hb-on-pace-0.json (02-05) — the hardware capture, 119 rx chunks, fw 1.5.5, active page 3"
  - "06-01-SUMMARY.md — the runes-in-node spike that licenses a $state class tested from a plain .spec.ts"
  - "scripts/check-counts.mjs (08-01, D-17) — baseline plus delta, never a literal total"
provides:
  - "src/lib/protocol/usb.ts — ZONA_USB in a module with zero imports; constants.ts re-exports it, $lib/protocol's surface unchanged"
  - "src/lib/transport/ports.ts — isZonaPort (new, the connect-event identity test), grantedZonaPorts and portIsAttached moved; the barrel re-exports them, web-serial.ts does not"
  - "src/lib/device/session.svelte.ts — DeviceSession (exported) and the session singleton: phase, identity, failureKind, failureRaw, permissionDeclined, refusedModule, canForget; start/connect/disconnect/failureFor; exactly four static specifiers"
  - "src/lib/device/session.spec.ts — eight gates over the machine in node, with fakePort and fakeSerial helpers plan 06-04 extends"
affects:
  - "src/lib/transport/web-serial.ts — loses the two moved functions, keeps openZonaPort and WebSerialTransport"
  - "src/lib/transport/index.ts — gains export * from ./ports"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 3/14"

tech-stack:
  added: []
  patterns:
    - "A load-path module is split from its heavy sibling by moving definitions, never by copying them: one definition each, re-exported from the old home, so no caller changes and the chunk guard has one specifier to permit"
    - "A session's environment is an injected record with global defaults filled in AT CALL TIME (start(env), grantedZonaPorts(serial = navigator.serial)), so module scope touches no global, the prerenderer sees no navigator, and the whole machine runs in node against fakes"
    - "requestPort() is the first statement of the click handler and sits inside a try: a lost transient activation is thrown synchronously, not rejected, and a .catch() on the stored promise never sees it"
    - "A negative check with no shipped caller is made observable with a throwaway probe file rather than recorded as vacuous"

key-files:
  created:
    - "src/lib/protocol/usb.ts"
    - "src/lib/transport/ports.ts"
    - "src/lib/device/session.svelte.ts"
    - "src/lib/device/session.spec.ts"
    - ".planning/phases/06-device-session/06-03-SUMMARY.md"
  modified:
    - "src/lib/protocol/constants.ts"
    - "src/lib/transport/web-serial.ts"
    - "src/lib/transport/index.ts"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "grantedZonaPorts takes an optional serial surface, defaulting to navigator.serial at call time: the plan's #offerGranted calls it by name, but it read the global, and a session that reads the global cannot run in node. The default parameter keeps every zero-argument caller and keeps module scope free of navigator"
  - "The heavy chunk is fetched from ONE memoised loader with THREE specifiers ($lib/protocol, $lib/transport, $lib/device/try-on), not the plan's two: BAUD_RATE, READ_BUFFER_SIZE and IDENTIFY_WINDOW_MS live in $lib/protocol, which the barrel does not re-export. All three share the protocol chunk, and the loader is reached only from the open path, after the chooser"
  - "The session registers a net under the transport's onClose (#onTransportClosed): a transport that dies under a connected session flips it to unplugged-while-connected instead of staying published as connected. 06-04's navigator-level listener is the primary path and this is the backstop, exactly as TryOnDevice.svelte wired it"
  - "#teardown closes the transport, then closes the port only if port.readable is non-null: WebSerialTransport.close() already closes the port it wraps, an injected transport may not own the port at all, and a second close() on a closed port rejects. The fake port models readable as the spec does, so the not-zona test proves the close rather than a swallowed rejection"
  - "On the unplugged open failure the adopted port is dropped (and canForget cleared): the object is dead, so the next click goes back through the chooser rather than at a port that is gone. On port-busy it is kept, so a retry needs no chooser"
  - "The plan's task 1 negative check was vacuous as written: no shipped file reaches grantedZonaPorts or portIsAttached through the barrel. A throwaway probe importing both through $lib/transport made it observable (2 errors with the line deleted, 0 with it restored) and was deleted"

requirements-completed: []
requirements-contributed: [CONN-01, CONN-05, CONN-06, CONN-07]

# Metrics
duration: 24min
completed: 2026-09-05
---

# Phase 6 Plan 03: The light seam, and the session up to identification Summary

**One object now owns the port, the identity, the phase and the failure, and every state a visitor can reach before identification has a name: `DeviceSession` in `src/lib/device/session.svelte.ts`, with exactly four static specifiers (`./session-copy`, `$lib/protocol/usb`, `$lib/transport/ports`, `$lib/transport/transport`), none of which reaches `@intechstudio/grid-protocol`, so the capability, the granted-port offer and every failure sentence cost a browse-only visitor nothing and `failureFor()` is synchronous for all nine named states. The seam that makes that possible is two pure moves — `ZONA_USB` into an import-free `usb.ts`, `grantedZonaPorts` and `portIsAttached` into `ports.ts` beside a new `isZonaPort` — re-exported from their old homes so no caller changed. `requestPort()` is the first statement of `connect()` and sits inside a `try`, `start()` decides the capability in the calling frame and never opens a port, `#busy` makes two controls one chooser, and eight node tests drive the whole machine through a fake serial and a fake port, including the three no browser can produce on demand: the double click, the synchronously thrown activation failure, and the rig with no ZONA on it.**

## The five-name carry-forward block

Measured by **06-01** on a clean tree at `746cfa2`. Carried forward verbatim, unchanged by this plan.

| Name         | Value                      | Measured                                                                             |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------ |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                 |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                 |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                        |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **61 (measured by 06-01)** | the same run. Rolls at 06-06, 06-07 and 06-13                                          |

**`PREV_E2E` does not move here.** This plan adds no route and no component; the session singleton
exists but nothing renders it yet, so no browser-reachable behaviour changed and `test:e2e` was not
run.

### Observed totals: previous SUMMARY plus this plan's delta

06-02 left the tree at **67 files / 700 tests**. This plan's delta is **+1 file / +8 tests**, so quick
stands at **68 / 708**, which is `BASE_FILES + 2` and `BASE_TESTS + 17` — 06-01's three, 06-02's six
and this plan's eight.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 67 700     # re-measured BEFORE any edit
  check-counts: observed 67 files, 700 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 67 700     # after task 1: a pure move moves no count
  check-counts: observed 67 files, 700 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 708     # after task 3, on the committed text
  check-counts: observed 68 files, 708 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npx vitest run --project server src/lib/device/ src/lib/transport/
  Test Files  10 passed (10)
       Tests  68 passed (68)

npm run check 2>&1 | grep -Ei "0 errors"
  1788575019431 COMPLETED 523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` moves 519 → **523 files** (usb.ts, ports.ts, session.svelte.ts, session.spec.ts), 0
errors. Provenance only, asserted nowhere.

## Task 1 — the light seam (commit `7b96dd0`)

Two new files, two pure moves, one new function. Both headers name the measured chunk the split is
buying — **131,101 bytes** — and the reason: a site-wide session names the USB filter, the granted-port
offer and the attached check on the load path of every route, from a header component that renders on
the first paint of `/`, and a browse-only visitor must not download a compiler to learn that nothing
is plugged in.

### The scans, quoted

```
file: src/lib/protocol/usb.ts
raw length: 1347; stripped length: 97
from " specifiers (0): []
import( occurrences: 0
bare "import " occurrences: 0

file: src/lib/transport/ports.ts
raw length: 2494; stripped length: 561
from " specifiers (1): ["$lib/protocol/usb"]
import( occurrences: 0
bare "import " occurrences: 1
```

`usb.ts` has **zero** imports. `ports.ts` imports **exactly one** module, and that module imports
nothing.

### The re-exports

- `constants.ts` deletes its own declaration and re-exports: `export { ZONA_USB } from "./usb";` with a
  three-line comment saying the literal moved so a header component can name it without pulling the
  pinned package in. `$lib/protocol`'s public surface is unchanged.
- `web-serial.ts` loses `grantedZonaPorts` and `portIsAttached` (lines 41-60 before the move) and
  **does not re-export them**; a comment at its import block names `./ports` as their home and says
  why there is exactly one path to each.
- `transport/index.ts` gains `export * from "./ports";` between `./fake` and `./queue`, so
  `$lib/transport`'s surface is byte-identical to a consumer.

`isZonaPort` is the one new function: `getInfo()` compared against both `ZONA_USB` fields. Its doc
comment records the reason it is a function and not an inline comparison — a replugged port is a
**new object**, so identity is by USB identity and never by `===` — and `grantedZonaPorts` now filters
through it rather than through its own inline copy of the same comparison.

### Every previous call site, unchanged in the diff

`git diff --stat` for the task: `constants.ts | 10 +-`, `index.ts | 1 +`, `web-serial.ts | 24 +-`,
plus the two new files. Nothing else moved. The call sites of the three names, all reached through
`$lib/protocol` or `$lib/transport` as before:

| Name | Call site | Resolves through |
| --- | --- | --- |
| `ZONA_USB` | `src/lib/protocol/constants.spec.ts:12, :55, :58` | `$lib/protocol` (re-export) |
| `ZONA_USB` | `src/lib/transport/fixtures/synthetic.spec.ts:12, :219-220` | `$lib/protocol` (re-export) |
| `ZONA_USB` | `src/lib/transport/web-serial.ts:16, :36` | `$lib/protocol` (re-export) |
| `ZONA_USB` | `src/lib/ui/TryOnDevice.svelte:327` | `P!.ZONA_USB`, dynamic `$lib/protocol` |
| `ZONA_USB` | `src/routes/dev/skeleton/+page.svelte:136, :261-262` | `P!.ZONA_USB` / `protocol.ZONA_USB`, dynamic `$lib/protocol` |
| `grantedZonaPorts`, `portIsAttached` | **none outside `web-serial.ts` itself** | — |

The last row is the honest finding under the negative check below: **no shipped file reaches the two
moved functions through the barrel.** Their only consumers before this plan were each other, inside
`web-serial.ts`; their first real consumer is the session in task 2.

### The negative check, observed in both directions

With `export * from "./ports";` deleted from `transport/index.ts`, `svelte-check` reports nothing at
`TryOnDevice.svelte` or the skeleton page — neither names the two functions. So the check was made
observable with a throwaway probe, `src/lib/transport/probe-06-03.ts`, importing both names through
`$lib/transport`:

```
1788574283405 ERROR "src\lib\transport\probe-06-03.ts" 2:10 "Module '"$lib/transport"' has no exported member 'grantedZonaPorts'."
1788574283406 ERROR "src\lib\transport\probe-06-03.ts" 2:28 "Module '"$lib/transport"' has no exported member 'portIsAttached'."
1788574283406 COMPLETED 522 FILES 2 ERRORS 0 WARNINGS 1 FILES_WITH_PROBLEMS
```

With the line restored and the probe still present:

```
1788574297992 COMPLETED 522 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

Probe deleted; `ls` confirms it absent; it appears in no commit.

## Task 2 — `session.svelte.ts` (commit `57e9c2d`)

553 lines. The header carries the four decisions the plan required in prose: why the reactive fields
are scalars and `$state.raw` only; why there are exactly four static specifiers and what each costs;
why `requestPort()` is the first statement and inside a `try`; why `start()` never opens a port. And
the two sentences on the exported class beside the exported singleton, with every private field an
instance field.

### The four specifiers, and nothing else — the comment-stripped scan

```
file: src/lib/device/session.svelte.ts
raw length: 22402; stripped length: 8845
from " specifiers (4): ["./session-copy","$lib/protocol/usb","$lib/transport/ports","$lib/transport/transport"]
import( occurrences: 7
bare "import " occurrences: 4
setInterval occurrences: 0
.write( occurrences: 0
"await import(" occurrences: 3
"requestPort(" occurrences: 2
"Chromium" occurrences: 0
"userAgent" occurrences: 0
```

The seven `import(` are four erased type aliases (`typeof import("$lib/protocol")`,
`typeof import("$lib/transport")`, `typeof import("$lib/device/try-on")`,
`import("$lib/transport").Identity`) and the three real ones below. The two `requestPort(` are the
`SerialLike` interface and the one call in `connect()`. `setInterval` and `.write(` appear **nowhere**;
no user-agent read exists; no engine is named.

### The dynamic import site

There is **one** memoised loader, module-scope on purpose (ES modules are singletons whatever instance
asks, and the promise carries no session state), with **three** specifiers:

```ts
async function loadHeavy(): Promise<HeavyModules> {
  const P = await import("$lib/protocol");
  const T = await import("$lib/transport");
  const D = await import("$lib/device/try-on");
  return { P, T, D };
}
const heavyModules = (): Promise<HeavyModules> => (heavy ??= loadHeavy());
```

It is awaited from **two** places, both inside the open path and both strictly after `requestPort()`
in their code path: `openWithWebSerial` (the default `openTransport`: `BAUD_RATE`, `READ_BUFFER_SIZE`,
`WebSerialTransport`) and `#openAdopted` (`IDENTIFY_WINDOW_MS`, `identifyOnly`). `#openAdopted` is
reached from `connect()`'s adopted-port branch and from `#afterPick`, which awaits the chooser first.
Nothing about a failure awaits it: `#refuse` classifies through the static `classifyOpenError`.

### `start()` is synchronous, and its capability branch sets `phase` before any await

The first eight lines of the method:

```ts
  start(env: Partial<SessionEnv> = {}): void {
    if (this.#started) return;
    this.#started = true;

    const capability = capabilityOf({
      hasSerial:
        env.hasSerial ??
        (typeof navigator !== "undefined" && "serial" in navigator),
```

The branch that follows assigns `failureKind` and `phase` and returns — no listeners, no `getPorts`,
nothing fetched, "not even for the copy, which failureCopy already has statically" is written beside
it. The method returns `void`; the only asynchronous thing it starts is `void this.#offerGranted()`,
which filters `grantedZonaPorts(serial)` by `portIsAttached(p) !== false` (the `!== false` is
commented: Chrome 89-129 has no `connected`, and `undefined` must mean keep it) and either adopts the
first and sets `detected` or sets `idle`. `#attachListeners()` is called between the two, as one named
private method with an empty body and a comment naming 06-04.

### `failureFor` awaits nothing

```ts
  failureFor(label: string): SessionBlock | null {
    const phase = this.phase;
    if (isFailureCopyPhase(phase)) {
      return failureCopy(
        this.failureKind ?? KEY_OF[phase],
        this.failureRaw,
        label,
      );
    }
    switch (phase) {
      case "not-zona":
        return notZonaBlock(this.refusedModule, label);
      case "silent":
        return silentBlock(this.#windowSeconds, label);
      case "unplugged-while-connected":
        return unpluggedWhileConnectedBlock();
      default:
        return null;
    }
  }
```

Six phases through `failureCopy` (with `KEY_OF` supplying the default key for a phase entered without
a classified error — the two capability states always), three through the authored blocks, anything
else `null`. `#windowSeconds` is read from the awaited module's `IDENTIFY_WINDOW_MS` on the open path,
which is the only path from which `silent` can be reached, so the sentence and the wait it describes
come from one constant and never through a fifth specifier.

### The failure map, as written

`#refuse(err, port?)` has one branch before the classifier — a `DOMException` named `NotAllowedError`
is `cancelled` with `permissionDeclined = true` (Y-06) — and then maps `classifyOpenError`'s key:
`cancelled` → `cancelled`; `port-busy` → `port-busy`; `unplugged` → `unplugged-at-open`, **dropping the
adopted port and clearing `canForget`** because the object is dead and the next click must go back
through the chooser; `already-open` and `unknown` → `unknown`, the key kept so the block reads the
already-connecting sentence. `failureRaw` carries the message on every row.

### `connect()`, `#busy`, and the two paths

`if (this.#busy) return;` is the first line; `#busy` is set before either path and cleared in
`#openAdopted`'s `finally`, in `connect()`'s own `catch`, and in `#afterPick`'s `catch` — every exit.
The adopted-port branch (`this.#port && !this.#transport`) takes no chooser (D-06). Otherwise
`requestPort({ filters: [ZONA_USB] })` is the first statement, inside a `try` whose comment says why
a `.catch()` would not do. `identified` becomes `connected`; `not-zona` and `silent` set their phases
and then `await this.#teardown()`, because both recovery lists say try again.

## Task 3 — `session.spec.ts` (commit `9084634`)

```
npx vitest run --project server src/lib/device/session.spec.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

The header states both required things: why the file is `session.spec.ts` and never
`session.svelte.spec.ts` (the `server` project's exclude would collect the latter by nothing, and the
file count moving by one in the count gate is what proves this one was collected), and why every test
constructs its own `new DeviceSession()` rather than importing the singleton.

### The spec's own imports, quoted

```
27:import { readFileSync } from "node:fs";
28:import { describe, expect, it } from "vitest";
29:import { IDENTIFY_WINDOW_MS, TERMINATOR, ZONA_HWCFG } from "$lib/protocol";
30:import { ZONA_USB } from "$lib/protocol/usb";
31:import type { Capture } from "$lib/transport";
32:import { FakeTransport } from "$lib/transport";
33:import { heartbeatFrame } from "../transport/fixtures/synthetic";
34:import { CONNECT_LABEL, NAMED_STATES } from "./session-copy";
35:import { DeviceSession, type SerialLike } from "./session.svelte";
36:import { TRY_ON_LABEL } from "./try-on";
```

`DeviceSession` and `SerialLike` are the only names taken from `./session.svelte`; the `session`
singleton is not imported. The comment-stripped scan of the spec for `{ session`, `session }` and
`session,` finds **0** of each.

### The fakes

`fakePort()` records `open`, `close` and `forget`, takes a `connected` that is absent by default
(Chrome 89-129) or settable, a `getInfo()` of the caller's choosing (default `ZONA_USB`), an
`openThrows` `DOMException`, and a `hasForget` switch; its `readable` is non-null while open and null
once closed, as the real port's is. `fakeSerial()` records `requestPort` and `getPorts`, resolves,
rejects **or throws** on cue through `pick`, returns a `granted` list, and keeps its listeners in a
`Map<string, Set<listener>>` so plan 06-04 can fire events at them. `opening(transport)` is a
transport factory in the shape of the real one — `await port.open(...)`, then return the fake — so
the failure rows that come from `open()` and the close after a refusal are both exercised.

### The eight gates

1. **decides the capability in the calling frame, with nothing attached and nothing asked** — no
   `await` between `start()` and the assertions; `unsupported` and `insecure` each render their block
   (`This browser cannot talk to hardware`, `This page needs HTTPS` with `Click TRY ON DEVICE again`);
   `getPorts` 0, `requestPort` 0, listeners 0 on both.
2. **offers a granted, attached ZONA and never opens it** — twice: a port with **no** `connected`
   property (the `!== false` proof) and one with `connected: true`; both `detected`, both `open === 0`,
   `canForget` true, `getPorts` 1, `requestPort` 0, `failureFor` null.
3. **reads an empty list as not plugged in, never as no grant** — `idle`, `failureFor` null, and `idle`
   is not in `NAMED_STATES`; plus a granted port with `connected: false` is also `idle`, unopened.
4. **two controls, one chooser** — a `requestPort` that never resolves; `connect(); connect();`
   synchronously records **1**; then the chooser is rejected, `cancelled` lands, and a third
   `connect()` records 2, proving the guard released.
5. **catches a THROWN activation failure at the call site and names it** — `requestPort` throws a
   `SecurityError` synchronously; `expect(() => s.connect()).not.toThrow()`; `unknown`;
   `failureKind === "unknown"`; `failureRaw` is the message; the block's detail contains it; a second
   `connect()` runs, so `#busy` was released on the way out.
6. **maps every failure onto its phase, one row each** — `NotFoundError` → `cancelled`,
   `permissionDeclined` false, title `You closed the chooser`; `NotAllowedError` → `cancelled`,
   `permissionDeclined` **true**; `NetworkError` from `open()` with `connected === false` →
   `unplugged-at-open`, `failureKind === "unplugged"`, title `The ZONA is not there any more`;
   `NetworkError` with `connected: true` **and** with no `connected` property → `port-busy`, step 1
   names Grid Editor; `InvalidStateError` → `unknown`, `failureKind === "already-open"`, detail
   `HANGAR is already connecting — one moment.`, `steps` `[]`.
7. **identifies the module from a real hardware capture, and writes nothing** —
   `FakeTransport.fromCapture(zona-hardware-a-hb-on-pace-0.json)`; `connected`;
   `identity.zona.moduleType === "ZONA"`, `hwcfg === ZONA_HWCFG`, firmware equals the fixture's
   `identity.firmware`, active page equals the fixture's `identity.activePage`; `otherModules` `[]`;
   `transport.writes` empty; port opened once and **not** closed.
8. **refuses a rig with no ZONA by naming the module on the cable, and closes the port** — EN16 at
   `sx 1` type 0, BU16 at `sx 2` type 0, PO16 at `sx 0` type 1; `not-zona`, `refusedModule === "PO16"`;
   `failureFor(CONNECT_LABEL)` has the title, names PO16 and not EN16, and carries Y-14's amended
   steps `["Plug in a ZONA", "Click CONNECT ZONA again"]`; `failureFor(TRY_ON_LABEL)` names the
   panel's button; the fake port's `close` was called **once**; the transport is closed; zero writes.

### What the fixture holds, read from it rather than typed

`zona-hardware-a-hb-on-pace-0.json`'s `identity` block, as captured on 2026-09-03 against a ZONA RevH
(`hwcfg 161`, `usbVendorId 12346`, `usbProductId 33059`):

| Field | Value |
| --- | --- |
| `moduleType` | `ZONA` |
| `firmware` | `{ major: 1, minor: 5, patch: 5 }` |
| `activePage` | **3** — the hardware run recorded active page 3, exactly as the plan said |
| `heartbeatType` | 1 |
| `otherModules` | `[]` |
| rx chunks | 119 |

Test 7 asserts the session's identity against the fixture's own block **and** asserts the fixture's
block against these literals, so a reader of the spec knows what the capture contains without
opening a 119-chunk JSON.

### The four negative checks, every one observed red and restored

**1. Remove the `#busy` guard** (`if (this.#busy) return;` deleted). Test 4:

```
FAIL ... > two controls, one chooser: a second connect() while one is in flight is a no-op
AssertionError: the header and the panel both fired, and the chooser opened twice: expected 2 to be 1
      Tests  1 failed | 7 passed (8)
```

**2. Replace the `try` around `requestPort` with a bare `.catch()` on the stored promise.** Test 5:

```
FAIL ... > catches a THROWN activation failure at the call site and names it
AssertionError: the throw escaped connect(): expected [Function] to not throw an error but 'SecurityError: Must be handling a use…' was thrown
      Tests  1 failed | 7 passed (8)
```

**3. Map `unplugged` onto `unplugged-while-connected`.** Test 6:

```
FAIL ... > maps every failure onto its phase, one row each
AssertionError: expected 'unplugged-while-connected' to be 'unplugged-at-open'
      Tests  1 failed | 7 passed (8)
```

**4. Drop the close on `not-zona`** (`await this.#teardown()` removed). Test 8:

```
FAIL ... > refuses a rig with no ZONA by naming the module on the cable, and closes the port
AssertionError: the port was left open after the refusal: expected +0 to be 1
      Tests  1 failed | 7 passed (8)
```

Each restored before the next; after the fourth restore `git diff --quiet -- session.svelte.ts` reports
the file **byte-identical** to commit `57e9c2d`, and the spec is 8 passed again.

## Deviations from Plan

### 1. [Rule 3 - Blocking] `grantedZonaPorts` takes an optional serial surface

**Found during:** task 2, writing `#offerGranted`.

**Issue:** the plan's `#offerGranted` "filters `grantedZonaPorts()`", but that function reads
`navigator.serial.getPorts()` — the global. The plan's own test 2 hands the session a fake `getPorts`
through `SessionEnv.serial`, and a session that ignored it in favour of the global could not run in
node at all, which is truth 4 of the plan's must-haves.

**Fix:** `grantedZonaPorts(serial: { getPorts(): Promise<SerialPort[]> } = navigator.serial)`. The
default is evaluated **at call time**, so importing `ports.ts` still touches no global and the
prerenderer never sees a `navigator`; every zero-argument caller (there are none in the tree, but the
signature is the barrel's) is unchanged. The session passes `this.#serial`. Task 1's "moved verbatim"
criterion held at task 1's commit; this is a task 2 amendment within the plan's `files_modified`.

**Files modified:** `src/lib/transport/ports.ts`. **Commit:** `57e9c2d`.

### 2. [Rule 2 - Missing critical functionality] A net under the transport's `onClose`

**Found during:** task 2, at the point `#openAdopted` stores the transport.

**Issue:** the plan builds the machine "up to and including identification" and leaves the
navigator-level `disconnect` listener to 06-04. Between the two plans, a transport that dies under a
`connected` session — a read error, or `WebSerialTransport`'s own port-level disconnect — would leave
`#transport` set and `connected` published for a dead port.

**Fix:** `transport.onClose(() => this.#onTransportClosed(transport))`: if the closing transport is
still the session's, clear it, clear the identity, and flip `connected` to
`unplugged-while-connected`. A teardown the session itself started clears `#transport` first, so the
net ignores it. The comment names 06-04's listener as the primary path and this as the backstop, the
same shape `TryOnDevice.svelte` shipped in Phase 4.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `57e9c2d`.

### 3. [Rule 1 - Bug] `readonly` on `SerialLike.requestPort`'s filters made `navigator.serial` unassignable

**Found during:** task 2, first `svelte-check`.

**Issue:** the plan's interface types `filters` as `readonly {...}[]`. `Serial.requestPort` takes
`SerialPortFilter[]`, and a method whose parameter is the wider readonly array is not assignable in
`start()`'s `env.serial ?? navigator.serial`:
`The type 'readonly {...}[]' is 'readonly' and cannot be assigned to the mutable type 'SerialPortFilter[]'`.

**Fix:** the `readonly` is dropped. `[ZONA_USB]` is a fresh mutable array and readonly properties
assign to mutable ones, so nothing else changes. 522 files 0 errors after.

**Files modified:** `src/lib/device/session.svelte.ts`. **Commit:** `57e9c2d`.

### 4. [Rule 1 - Bug] A dead assignment in the spec failed `no-useless-assignment`

**Found during:** task 3, first `npm run lint` with the spec present.

**Issue:** test 4 ended with `reject = undefined;` after its last use — a leftover from tidying the
deferred promise. ESLint 9's recommended set reports it.

**Fix:** the line is deleted; nothing else in the test changed. Lint exit 0, 8 passed, 68 / 708.

**Files modified:** `src/lib/device/session.spec.ts`. **Commit:** `9084634`.

### 5. [Scope] The dynamic import loads three modules, not two

The plan names "the two import sites" — `$lib/transport`'s `WebSerialTransport` and
`$lib/device/try-on`'s `identifyOnly`. The open path also needs `BAUD_RATE`, `READ_BUFFER_SIZE` and
`IDENTIFY_WINDOW_MS`, all of which live in `$lib/protocol` and none of which the transport barrel
re-exports. So the memoised loader awaits **three** specifiers; all three share the protocol chunk,
which the first await fetches, and the loader is reached from two places, both after the chooser.
Recorded in the file's own comment and above.

### 6. [Scope] `#started` is an instance field now

The plan describes `#started` as "06-06's guard" and asks the header to name it as an instance field.
It is declared and used: a second `start()` on one instance returns at once, because a second call
would attach 06-04's listeners twice. Trivial, and 06-06 finds it in place.

### 7. [Process] Task 1's negative check needed a probe to be observable

Described under task 1. The plan expected `svelte-check` to name the missing export at
`TryOnDevice.svelte`'s or the skeleton page's call site; neither file names `grantedZonaPorts` or
`portIsAttached`, and no shipped file does. A throwaway probe made the check observable in both
directions (2 errors, then 0) and was deleted; it is in no commit.

### 8. [Process] Formatting was scoped to authored files after the first tree-wide run

The plan's `npm run format` ran once after task 1 and reported **every file unchanged**. During the
same window a parallel Phase 7 workflow was editing
`.planning/phases/07-install-flow/07-UI-SPEC.md` in the working tree (it appeared modified in
`git status`, with content changes far larger than a formatter's, and later disappeared again when
that workflow committed). To avoid touching a file another workflow owns, every later formatting pass
was `npx prettier --write <authored file>`, and `npm run lint` (which runs `prettier --check .` over
the whole tree) was still run and passed at every gate. Every commit used `git commit --only -- <paths>`
with only this plan's files; nothing outside `files_modified` was staged.

## Requirements

**`requirements-contributed: [CONN-01, CONN-05, CONN-06, CONN-07]`** — contributed, **not completed**.
No component renders the session yet:

- **CONN-01** gains the one capability read, synchronous and in the calling frame, with the block for
  both incapable states in hand without a fetch. The control that reads it is plan 06-10.
- **CONN-05** gains `cancelled` as its own phase with `permissionDeclined` as its one modifier. The
  disclosures beneath it are plan 06-08.
- **CONN-06** gains the silent reconnect offer: `getPorts()`, the attached filter, `detected`, and the
  adopted-port `connect()` path with no chooser. The header that shows the offer is plan 06-10; the
  browser proof is 06-06.
- **CONN-07** gains the filter-and-verify sequence end to end: `ZONA_USB` on the chooser, `identifyOnly`
  after the open, `not-zona` naming the module on the cable, and the port closed afterwards.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61** in all fourteen SUMMARYs.
- `PREV_FILES` / `PREV_TESTS` for plan 06-04 are **68 / 708** — this plan's closing numbers.
- **The private vocabulary 06-04 fills in**, already named: `#attachListeners()` (empty, called from
  `start()` between the capability and the offer), `#adopt(port)` (sets `#port` and `canForget` from
  `"forget" in port`), `#teardown()` (closes the transport, then the port if `readable` is non-null,
  and **never clears `#port`**, so `forget()` can still revoke it), `#onTransportClosed` (the net; the
  navigator-level listener is the primary path), `#now`, `#port`, `#transport`, `#busy`, `#started`.
  `disconnect()` already returns to `idle`.
- **`MODULE_GONE_MS` is not stored yet.** `#openAdopted` awaits the module and reads
  `IDENTIFY_WINDOW_MS` from it into `#windowSeconds`; 06-04 stores what the watchdog needs the same
  way, from the same awaited module, and never through a fifth specifier.
- `isZonaPort` is exported from `$lib/transport/ports` and is not yet imported by the session — it is
  the `connect`-event identity test 06-04's handler needs, and importing it adds no specifier.
- `SerialLike` carries `addEventListener` / `removeEventListener`, and the spec's `fakeSerial` keeps
  its listeners in a `Map` keyed by type, so 06-04's tests fire events with
  `listeners.get("disconnect")?.forEach((l) => l({ target: port } as unknown as Event))`.
- The spec's `fakePort` already records `forget`, takes `hasForget: false` for a Chrome 89-102 port,
  and has `setConnected()`, so 06-04's `forget()`-ordering and watchdog tests need no new fixture.
- `grantedZonaPorts(serial?)` — pass the injected surface; the zero-argument form is the browser's.

## Self-Check: PASSED

Files claimed created, verified present:

- `src/lib/protocol/usb.ts` — FOUND
- `src/lib/transport/ports.ts` — FOUND
- `src/lib/device/session.svelte.ts` — FOUND (553 lines)
- `src/lib/device/session.spec.ts` — FOUND
- `.planning/phases/06-device-session/06-03-SUMMARY.md` — FOUND

Files claimed deleted, verified absent:

- `src/lib/transport/probe-06-03.ts` — ABSENT

Commits claimed, verified in `git log`:

- `7b96dd0` refactor(06-03): the light seam - usb.ts and ports.ts, re-exported from their old homes — FOUND
- `57e9c2d` feat(06-03): session.svelte.ts - capability, the offer, the chooser, identification — FOUND
- `9084634` test(06-03): session.spec.ts - eight gates over the machine, driven by a fake serial and a fake port in node — FOUND
