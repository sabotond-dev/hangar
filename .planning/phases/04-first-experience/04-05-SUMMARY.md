---
phase: 04-first-experience
plan: 05
subsystem: simulation
tags: [host, raf, intersection-observer, reduced-motion, touch, teardown, D-14, D-15, PREV-05, IDENT-02]
requires:
  - "src/lib/sim/schedule.ts - ticksFor, shouldPaint, intervalFor, isLowPower, REDUCED_MOTION_TICKS, unchanged"
  - "src/lib/sim/paint.ts - GRID_SIDE, createScratch, paintPad, unchanged"
  - "src/lib/sim/touch.ts - TouchSampler, unchanged"
  - "src/vendor/botor/pad-sim-host.ts - read as the reference design, cited by line, never imported"
provides:
  - "src/lib/sim/host.ts - SimHost, HostEngine, HostDeps; one shared requestAnimationFrame for the whole page"
  - "src/lib/sim/host.spec.ts - 10 tests, whole loop driven by a fake clock, canvas, engine, observer and media source, in node"
affects:
  - "Plan 04-06 constructs SimHost and owns the HostDeps it passes (or passes none and takes the browser defaults)"
  - "Plan 04-07's PadFrame.svelte maps client coordinates with mapAxis and calls touchDown/touchMove/touchEnd with LED coordinates"
  - "Phase 8 plan 08-03's SimEngine satisfies HostEngine structurally, with no change here and no import either way"
tech-stack:
  added: []
  patterns:
    - "Every browser capability the loop needs behind one injectable record with a real, individually guarded default, so a 100 Hz scheduler with a self-cancelling frame loop is assertable in the node Vitest project"
    - "A structural engine interface declared by the consumer rather than imported, so two independently planned engines satisfy one host with no shared file and no migration"
    - "A fake clock whose frames run only at timestamps a test chose, making tick counts and paint cadence exact rather than probabilistic"
    - "A TDD split that leaves the second task's subject genuinely absent from the first task's implementation, so its three tests are red for the right reason before they are green"
key-files:
  created:
    - src/lib/sim/host.ts
    - src/lib/sim/host.spec.ts
  modified: []
decisions:
  - "The loop asks for another frame only for pads that are STILL running after their ticks, not for every pad that ran. The vendored host sets its `any` flag on `running` and therefore always burns one extra no-op frame after an animation expires; the frame it expires on has already painted the true final state, and every event that could change that calls wake(), so the extra frame can do nothing. This is what makes test 5 assert an empty frame queue on the expiry frame itself"
  - "A pad registers with `inWindow: true` and `intersecting: false`. The window default is permissive because a component that forgets setInWindow should animate rather than silently freeze the row; the observer default is pessimistic because a real IntersectionObserver reports asynchronously and the immediate first paint already shows the picture"
  - "The default `raf` returns 0 when there is no animation clock, and wake() treats 0 as 'nothing here can animate' rather than latching a handle it could never cancel. A browser's requestAnimationFrame is specified to return a non-zero handle, so the sentinel is unambiguous"
  - "On a flip to reduced motion every entry is reset and run to the still frame, including the hero. The vendored host exempts its preview (it repaints it without resetting, and only when no contact is held); HANGAR has one engine per entry rather than a separate preview engine, and the plan specifies every entry, so the hero restarts too - recorded as an observation below, not silently diverged"
metrics:
  duration: 14 min
  tasks: 2
  files: 2
  completed: 2026-09-04
---

# Phase 4 Plan 05: SimHost Summary

One `requestAnimationFrame` now drives every pad on the page in whole 10 ms firmware ticks with the
100 ms catch-up clamp, paints the hero at 33 ms and the receding sides at 50 ms, pauses a pad that is
outside the coverflow window *or* outside the viewport, honours an operating-system motion preference
as a live subscription with the pointer carve-out intact, and cancels itself the moment nothing is
running — all of it asserted in node against a fake clock, because there is no browser Vitest project
to assert it in.

---

## Suite totals — observed

**Previous end state, from 04-04-SUMMARY:** quick **35 files / 517 passed | 1 todo**, sweep
**1 file / 9**, e2e **10**.

**Re-measured on this machine before this plan touched anything** (Phase 8 shares the tree, so the
baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  35 passed (35)
      Tests  517 passed | 1 todo (518)
```

It reproduced 04-04's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick   ->  36 files, 527 passed | 1 todo (528)
npm run test:sweep   ->   1 file,    9 passed (9)
```

Exactly `BASE_FILES + 1` and `BASE_TESTS + 10`, all ten in the one new `host.spec.ts`. Verified
through `scripts/check-counts.mjs` at each task boundary:

| After task | Command | Result |
|---|---|---|
| 4-05-01 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 524` | exit 0 |
| 4-05-02 | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 36 527` | exit 0 |
| plan end | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9` | exit 0 |

**`npm run test:e2e` was not re-measured, and the 10 recorded by 04-04 stands unverified for this
plan.** This plan writes no Svelte, touches no route, no static asset and no build script, and
nothing in the tree imports `host.ts` yet (`grep -rn "sim/host" src --include=*.ts --include=*.svelte`
outside the spec returns nothing), so no built artifact changed. The plan's own `<verification>`
block asks for the four Vitest gates, `npm run check`, `npm run lint` and `git diff --quiet --
src/vendor`, and not for Playwright. **Plan 04-06 mounts this and must re-measure e2e itself.**

**Plan 04-06 should treat 36 / 527 (quick), 1 / 9 (sweep) and 10 (e2e, carried forward unverified)
as its baseline** — and should re-measure rather than trust them.

---

## `SimHost`'s exported surface, verbatim

Plan 04-06 constructs this. Nothing in the tree imports it yet.

```ts
/**
 * The engine shape the host accepts, declared structurally rather than imported.
 * The vendored PadSim satisfies it today and Phase 8's Lua engine satisfies it
 * later, which is what keeps this file free of any dependency on src/vendor.
 */
export interface HostEngine {
  tick(): void;
  run(n: number): void;
  reset(): void;
  /** 243 bytes, screen order, RGB. */
  readonly frame: Uint8Array;
  /** True while any layer is still counting down. */
  readonly animating: boolean;
  readonly coordMax: 127 | 1023;
  readonly pendingTouches: number;
  touchDown(id: number, x: number, y: number): void;
  touchMove(id: number, x: number, y: number): void;
  touchUp(id: number, x: number, y: number): void;
}

export interface HostDeps {
  now(): number;
  raf(cb: (now: number) => void): number;
  caf(handle: number): void;
  /** Observe visibility. Returns an unobserve function. */
  observe(el: unknown, cb: (intersecting: boolean) => void): () => void;
  /** Live reduced-motion source. Returns the current value and an unsubscribe. */
  reducedMotion(cb: (reduced: boolean) => void): {
    matches: boolean;
    stop: () => void;
  };
  lowPower: boolean;
}

export class SimHost {
  constructor(deps?: Partial<HostDeps>);
  register(id: string, canvas: HTMLCanvasElement, engine: HostEngine): void;
  unregister(id: string): void;
  setHero(id: string | undefined): void;
  setInWindow(id: string, inWindow: boolean): void;
  touchDown(pointerId: number, x: number, y: number): boolean;
  touchMove(pointerId: number, x: number, y: number): void;
  touchEnd(pointerId: number): void;
  destroy(): void;
}
```

Everything else — the per-entry `Map`, the `TouchSampler`, the frame handle, the accumulator, the
`reduced` flag and the `destroyed` flag — is private. **None of it may go into a Svelte rune**
(04-RESEARCH §Pitfall 3): `$state` deep-proxies, and a proxy trap inside a 100 Hz tick loop turns a
0.35 µs tick into something else entirely. Only scalars cross into a component.

### Notes plan 04-06 needs

- **`register` owns the backing store.** It sets `canvas.width = canvas.height = 9` itself, takes the
  2D context, creates the scratch `ImageData` and paints the first frame immediately, before the loop
  has ever run. A component must not set the size and must not paint (04-UI-SPEC W-07).
- **`register` on an id that already exists silently unregisters it first**, and re-registering the
  **same engine object** does not reset it. That is the no-restart-at-tick-0 rule (test 7).
- **A pad registers `inWindow: true`, `intersecting: false`.** The observer's first callback is what
  starts it, so a component that never calls `setInWindow` still animates; one that never gets an
  observer callback shows its first painted frame and does not tick.
- **`touchDown` takes LED coordinates, never client coordinates.** The component owns the canvas rect
  and maps with `mapAxis` from `./touch`. This is exactly why the host is testable in node: no DOM
  geometry crosses into it.
- **`touchDown` returns `false`** when the pointer is already tracked or all five slots are taken —
  the component's signal not to capture the pointer.
- **`setHero` clears the sampler on every hero change**, so contacts never leak onto a pad the visitor
  has stepped away from.
- **`unregister` and `destroy` both set `canvas.width = 0`.** A component that reuses a canvas after
  unregistering must re-`register` it, not repaint it.

---

## The default dependencies, and how each is guarded

`new SimHost()` with no argument is a working browser host. `{ ...defaultDeps(), ...deps }` means a
test may override one dependency and keep the rest.

| Dependency | Default | Guard |
|---|---|---|
| `now` | `performance.now()` | `typeof performance !== "undefined" && typeof performance.now === "function"`, falling back to `Date.now()` |
| `raf` | `requestAnimationFrame(cb)` | `typeof requestAnimationFrame === "function"`, else returns **0** |
| `caf` | `cancelAnimationFrame(handle)` | `typeof cancelAnimationFrame === "function"`, else no-op |
| `observe` | `new IntersectionObserver(…, { threshold: 0, rootMargin: "200px" })`, returning `() => io.disconnect()` | `typeof IntersectionObserver === "undefined"` reports `true` once and returns a no-op unobserve, so a missing capability never silently freezes the page — the vendored host's rule |
| `reducedMotion` | `window.matchMedia("(prefers-reduced-motion: reduce)")` with `addEventListener("change", handler)`; `stop` is `removeEventListener` | `typeof window === "undefined" \|\| typeof window.matchMedia !== "function"` returns `{ matches: false, stop: noop }` |
| `lowPower` | `isLowPower(navigator.hardwareConcurrency)` | `typeof navigator === "undefined"` passes `undefined`, which `isLowPower` defaults to eight cores |

**The subscription is live, not a one-shot read.** `host.ts:171` is
`query.addEventListener("change", handler);` and `host.ts:174` is
`stop: () => query.removeEventListener("change", handler),`. An operating-system toggle mid-session
therefore takes effect with no re-registration and no remount (IDENT-02), which is what test 8
asserts from both directions.

**The `raf` sentinel.** When there is no animation clock the default returns `0`, and `wake()` returns
without latching `rafId`. A browser's `requestAnimationFrame` is specified to return a non-zero
handle, so `0` is unambiguous; latching it would have left the host permanently unable to schedule.

---

## The two negative checks, observed red

### Task 4-05-01 — the `IntersectionObserver`-only rule

`running` was reduced from `entry.inWindow && entry.intersecting && this.active(entry)` to
`entry.intersecting && this.active(entry)` — the rule a straight port of the vendored host would
have. Test 6 went red naming the pad:

```
FAIL  |server| src/lib/sim/host.spec.ts > the simulator host (src/lib/sim/host.ts) > ticks a pad only when it is inside the coverflow window AND inside the viewport
AssertionError: hidden-behind kept ticking: the observer alone cannot pause a coverflow: expected 2 to be +0 // Object.is equality
```

This is 04-RESEARCH §Pitfall 4 exactly: in a coverflow the far pad is on screen, scaled to a third and
hidden behind three others, and the observer happily reports it intersecting. Reverted with
`git checkout --`; `git diff --quiet -- src/lib/sim/host.ts` exited 0 and the spec returned to 7
passed.

### Task 4-05-02 — the leaked media listener

`this.media.stop();` was deleted from `destroy()`. Test **10** went red naming the subscription (the
plan predicts test 9; the media assertion lives in test 10, "leaves nothing behind when it is
destroyed" — the numbering in the plan's negative-check paragraph slipped by one relative to its own
test list):

```
FAIL  |server| src/lib/sim/host.spec.ts > the simulator host (src/lib/sim/host.ts) > leaves nothing behind when it is destroyed
AssertionError: the media subscription was not stopped: expected +0 to be 1 // Object.is equality
```

Reverted with `git checkout --`; `git diff --quiet -- src/lib/sim/host.ts` exited 0 and the spec
returned to 10 passed.

---

## The import scan

Written to a scratch `.mjs` under the system temp directory and run with `node`, per the acceptance
criterion — never into the repository. It strips comments with the standing rule's backslash-free
expression, collects every `from` specifier under both quote characters, **fails if it collected
none**, and fails on any specifier naming the vendored tree, the upstream package or the compile
surface.

```js
import { readFileSync } from "node:fs";

const strip = (t) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const src = strip(readFileSync("src/lib/sim/host.ts", "utf8"));
const specs = [];
const re = /from\s*("([^"]*)"|'([^']*)')/g;
let m;
while ((m = re.exec(src)) !== null) specs.push(m[2] ?? m[3]);

if (specs.length === 0) {
  console.error("collected no import specifiers - the matcher is broken");
  process.exit(1);
}

const forbidden = ["vendor", "intechstudio", "$lib/pad", "lib/pad", "pad-sim", "_pad"];
const bad = specs.filter((s) => forbidden.some((f) => s.includes(f)));
console.log("specifiers:", JSON.stringify(specs));
if (bad.length > 0) {
  console.error("forbidden import specifiers: " + JSON.stringify(bad));
  process.exit(1);
}
console.log("ok - " + specs.length + " specifiers, none forbidden");
```

```
specifiers: ["./paint","./schedule","./touch"]
ok - 3 specifiers, none forbidden
EXIT: 0
```

---

## Verification

| Check | Result |
|---|---|
| `npx vitest run --project server src/lib/sim/host.spec.ts` (task 1) | **7 passed (7)** |
| `npx vitest run --project server src/lib/sim/host.spec.ts` (task 2) | **10 passed (10)** |
| `npx vitest run --project server` over `schedule`, `paint`, `touch`, `host` | 4 files, **30 passed** |
| Import scan (comment-stripped, both quote characters, fails on zero) | exit 0 — `./paint`, `./schedule`, `./touch` |
| `grep -q "rootMargin" src/lib/sim/host.ts` / `grep -q "200px"` | exit 0 / exit 0 |
| No `setInterval`, comment-stripped | exit 0 |
| `grep -q "REDUCED_MOTION_TICKS" src/lib/sim/host.ts` | exit 0 |
| No hard-coded `run(64)`, comment-stripped | exit 0 |
| `reducedMotion` present in the raw source; the default attaches `addEventListener` (line 171) and detaches it in `stop` (line 174) | exit 0 |
| `grep -q "width = 0" src/lib/sim/host.ts` | exit 0 |
| `test ! -f src/lib/sim/engine.ts` | exit 0 — this plan did not create it and Phase 8 has not landed it yet |
| Negative check 1 (observer-only rule) red on test 6, then `git diff --quiet` | observed, exit 0 |
| Negative check 2 (leaked media listener) red on test 10, then `git diff --quiet` | observed, exit 0 |
| `npm run test:quick` through the helper at 36 / 524, then 36 / 527 | exit 0 |
| `npm run test:sweep` through the helper at 1 / 9 | exit 0 |
| `npm run check` | 405 files, **0 ERRORS**, 0 warnings |
| `npm run lint` | exit 0 |
| `git diff --quiet -- src/vendor` | exit 0 |
| Working tree clean after every commit | confirmed |
| No scratch file left in the repository | confirmed (all four scripts under the system temp directory) |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The plan's `any` rule contradicted its own test 5**

- **Found during:** Task 4-05-01, writing the frame callback.
- **Issue:** The plan's `<action>` says "Set `any` when anything ran" — the vendored host's rule
  (`pad-sim-host.ts:479`). Its `<behavior>` and its test 5 say that when every engine reports
  `animating` false, "one final paint happens on that frame and the host **stops requesting frames**",
  with test 5 asserting "the raf queue is empty afterwards". Those cannot both hold: setting `any` on
  `running` means the expiry frame requests one more frame, so the queue is not empty after it. The
  vendored host really does burn that extra no-op frame.
- **Fix:** `any` is set from `still` — the state **after** the ticks — rather than from `running`. The
  frame an animation expires on has already painted the true final state (the `|| !still` paint), and
  every event that could restart anything calls `wake()`, so a further frame is provably incapable of
  doing work. The comment in `onFrame` says exactly that. This is a strict improvement over the
  reference design and it is what makes test 5 assertable as written.
- **Files modified:** `src/lib/sim/host.ts`
- **Commit:** `f21f34a`

**2. [Rule 2 - Missing critical functionality] A canvas with no 2D context would have thrown**

- **Found during:** Task 4-05-01, `register`.
- **Issue:** `canvas.getContext("2d")` returns `null` — for a canvas already transferred to an
  offscreen context, or in a browser that refused the context. `createScratch(null)` throws inside
  `register`, which would take down the mount of the whole row for one bad canvas.
- **Fix:** `ctx` and `scratch` are `… | undefined` on the entry, `register` uses `?? undefined`, and
  `paint()` returns early when either is missing. The pad still registers, still ticks and still
  participates in the loop; it just does not paint. A row with one unpaintable canvas is a degraded
  row, not a broken page.
- **Files modified:** `src/lib/sim/host.ts`
- **Commit:** `f21f34a`

**3. [Rule 3 - Blocking] The default `raf` could latch a handle it could never cancel**

- **Found during:** Task 4-05-01, writing `defaultDeps`.
- **Issue:** The plan requires every dependency to have a real default "guarded so the module can be
  imported in a node test without any of them existing". The obvious guard — return `0` when
  `requestAnimationFrame` is absent — silently breaks `wake()`, which stores the handle and then
  refuses every future wake because `rafId !== undefined`. The host would be permanently deaf in any
  environment that gained an animation clock later.
- **Fix:** `wake()` treats a `0` handle as "there is no animation clock here" and returns without
  latching. A browser's `requestAnimationFrame` is specified to return a non-zero handle, so the
  sentinel cannot collide with a real one; the reason is in a comment above `defaultDeps`.
- **Files modified:** `src/lib/sim/host.ts`
- **Commit:** `f21f34a`

### Observations, not deviations

- **The plan's task-2 negative check names test 9; the assertion is in test 10.** The plan's own test
  list puts "destroy leaves nothing behind" at 10 and "a finger moves the hero" at 9, and its
  negative-check paragraph then says "confirm test 9 goes red naming the media subscription". Test 10
  is the one that went red, for exactly the reason the plan describes. The check was run as specified;
  only the number in the prose was off by one.
- **`any` is the only place HANGAR's loop differs from the vendored one.** Everything else — the
  clamp, the carry, the decoupled paint cadence, the `|| !still` expiry paint, the `else if
  (wasRunning)` settle paint, the `lastNow = undefined` on cancel — is carried over exactly, with the
  vendored file cited by line.
- **A flip to reduced motion resets the hero too.** The vendored host exempts its preview: it never
  calls `reset()`/`run(64)` on it, and repaints it only when no contact is held
  (`pad-sim-host.ts:530-534`). HANGAR has one engine per entry rather than a separate preview engine,
  and the plan specifies "for every entry", so a finger held at the instant the operating-system
  preference flips will see that pad restart at tick 0 and jump to the still frame. That is a
  one-frame oddity during a preference toggle, it is what the plan asks for, and test 8 pins it. If it
  ever reads badly on screen, the fix is one guard in `onReducedChange` and one more test.
- **`src/lib/sim/` is still not covered by `forbidden-instructions.spec.ts`'s `SCANNED_DIRS`**
  (`["src/lib/protocol", "src/lib/transport"]`), as 04-03 and 04-04 both recorded. Nothing in this
  plan changes that, and nothing in `host.ts` encodes a packet or writes to a device — it cannot, it
  imports three pure modules and nothing else. Still worth one line in a later plan.
- **The comment-stripping scans ran as `node -e` one-liners** (with `$` escaped once for the shell)
  and the import scan and the three edit scripts ran from `.mjs` files under the system temp
  directory. Nothing was left in the repository.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.
- **A heredoc lost a multi-line template literal once.** The script that inserted the
  `REDUCED_MOTION_TICKS` import into `host.ts` was rewritten to a single-line specifier after the
  Bash transport mangled the multi-line form; the file content is unaffected.

---

## The TDD split, and why task 2's tests were genuinely red

The plan splits one class across two tasks: task 1 is the loop, task 2 is reduced motion, the finger
and teardown. The first implementation drafted for task 1 was the complete class. It was **trimmed
back** to task 1's scope before committing, deliberately, so that tests 8, 9 and 10 would fail for the
right reason rather than pass on arrival:

```
Tests  3 failed | 7 passed (10)
  AssertionError: a restarted deterministically: expected +0 to be 1
  TypeError: h.host.touchDown is not a function       (test 9)
  TypeError: h.host.touchDown is not a function       (test 10)
```

Absent from task 1's commit and added by task 2's: `stillFrame()` and both its call sites, the public
`touchDown` / `touchMove` / `touchEnd`, `sampler.clear()` in `setHero` and in `destroy`,
`media.stop()` in `destroy`, and `canvas.width = 0` in `unregister` and `destroy`. Present from task 1
because the plan's task-1 action specifies them: the `touchActive` term in the running rule and the
per-tick `sampler.deliver()` before `tick()`.

Four commits, in TDD order: `ecc03c6` (RED, 7 tests), `f21f34a` (GREEN, the loop), `315de19` (RED, 3
more tests), `6286166` (GREEN, the rest).

---

## Notes for later plans

- **Baseline for 04-06: quick 36 / 527 (plus the one pre-existing todo), sweep 1 / 9, e2e 10 carried
  forward unverified.** Re-measure before applying a delta, and re-measure e2e in particular — this
  plan did not.
- **`HostEngine` is structural.** Phase 8 plan 08-03's `SimEngine` satisfies it with **no change
  here**, and neither file needs to import the other. `src/lib/sim/engine.ts` was not created by this
  plan and did not exist when it ran.
- **Deliver once per TICK, before `tick()`** — `host.ts` does, and `onFrame` carries the reason with
  the vendored citation. Any refactor that hoists `sampler.deliver()` out of the tick loop to once per
  frame silently restores the pointer-rate dependence the sampler exists to remove, and only test 9
  catches it (three MOVEs before one tick must produce exactly one sample).
- **The engine-facing touch id is the contact SLOT, not the pointer id.** Test 9 asserts
  `["down", 0, 3, 4]` for pointer id 7. `TouchSampler.deliver` is what enforces it; the host never
  touches an engine's touch methods directly.
- **`setInWindow` is the coverflow's half of the gate and nothing else sets it.** Plan 04-06 must call
  it on every step, for every entry whose `|slotOffset|` crossed the radius — otherwise every pad ever
  registered keeps ticking, because `inWindow` defaults to `true`. `visibleWindow` and `slotOffset` in
  `src/lib/coverflow/slots.ts` are what compute it.
- **The host paints; the component must not.** Nothing outside `host.ts` may call `paintPad`, set a
  pad canvas's width, or hold a reference to a `frame`.

## Known Stubs

None. Every method on `SimHost` does the whole of what its name says, and the ten tests exercise the
loop, the gate, the clamp, both paint cadences, the still frame, the live toggle, the pointer
carve-out and the teardown against a fake clock rather than against a promise.

The one deliberate *absence* is the rendering: this plan writes no Svelte, by design (the plan's own
objective says so), and plan 04-06 mounts it. That is a sequencing boundary, not a stub.

## Requirements

`requirements: [PREV-05, IDENT-02]` in the plan frontmatter is phase-level attribution. **Neither is
complete after this plan, and neither is marked** in `.planning/REQUIREMENTS.md`.

- **PREV-05** (offscreen cards pause, reduced motion falls back to a still frame, the render path
  stays in budget) now has all of its behaviour — the observer with its 200 px wake margin, the window
  gate, the two paint cadences, the low-power ladder and the self-cancelling loop — and none of it is
  on screen. Nothing mounts a canvas until plan 04-06. The budget half is measurable only against a
  real row.
- **IDENT-02** (motion-forward, `prefers-reduced-motion` honoured live) has the JS half: the live
  `matchMedia` subscription and the still frame at tick 64. The CSS half — the 200 ms splash
  crossfade, instant stepping, the hover overrides — belongs to plans 04-06 and 04-07.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

Both claimed source files and this SUMMARY exist on disk, and all four claimed commits (`ecc03c6`,
`f21f34a`, `315de19`, `6286166`) are in the history.
