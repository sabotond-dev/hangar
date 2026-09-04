---
phase: 04-first-experience
plan: 08
subsystem: ui
tags:
  [
    choose,
    panel,
    connect,
    identify,
    degrade,
    web-serial,
    shallow-routing,
    tap-rule,
    D-05,
    D-08,
    D-09,
    D-11,
    D-13,
    D-22,
    D-23,
    DEGR-02,
    IDENT-01,
    W-15,
    W-16,
    W-19,
    W-20,
    W-23,
    SAFE-02,
  ]
requires:
  - "src/lib/device/try-on.ts (04-04) - TRY_ON_LABEL, capabilityOf, identifyOnly, TryOnState"
  - "src/lib/transport/transport.ts (04-04) - failureCopy(f, raw?, controlLabel), the label THIRD"
  - "src/lib/transport/web-serial.ts (02) - WebSerialTransport, closeOnHide, onClose, close"
  - "src/lib/protocol/constants.ts (02) - ZONA_USB, BAUD_RATE, READ_BUFFER_SIZE, IDENTIFY_WINDOW_MS"
  - "src/lib/ui/Coverflow.svelte (04-06, 04-07) - the row, its pointer routing and its slot ladder"
  - "src/lib/ui/NamePlate.svelte (04-07) - the onchoose prop declared there and given a body here"
  - "src/lib/coverflow/slots.ts (04-02) - slotOffset, reused for the ring distance"
provides:
  - "src/lib/ui/PadSpinner.svelte - IDENT-01's 9x9 motif as the loading state, one lime cell walking the perimeter as a CSS animation"
  - "src/lib/ui/KeepOnDevice.svelte - the secondary install control, a real disabled button with its reason inline"
  - "src/lib/ui/ChosenPanel.svelte - D-08's six regions with 152px reserved for Phase 5"
  - "src/lib/ui/TryOnDevice.svelte - the connect state machine, requestPort() first, an exported release()"
  - "src/lib/ui/Coverflow.svelte - choosing, un-choosing, the tap rule and the chosen recede"
  - "src/app.d.ts - App.PageState { chosen?: boolean }"
  - "e2e/first-experience.e2e.ts - now 8 tests: 04-07's six plus choosing and the degrade path"
affects:
  - "Phase 5 docks knobs and the two 908-character meters into ChosenPanel's reserved region; the 152px is what stops the panel resizing"
  - "Phase 5's idle prefetch of the Lua formatter belongs on the tune panel, NOT on TRY ON DEVICE - nothing in this component compiles"
  - "Phase 6 owns the full connection lifecycle: navigator.serial connect/disconnect listeners, silent reconnect from getPorts(), and forget()"
  - "Phase 7 gives KEEP ON DEVICE a body; its disabled state and its reason are this phase's"
  - "Plan 04-09's deep-link route renders the same FrontDoor, so choosing works there with no further wiring"
tech-stack:
  added: []
  patterns:
    - "A UI flag held in the history entry rather than in a component boolean, so the browser Back button and Escape are one gesture rather than two implementations of it"
    - "A component export called through bind:this as the parent's handle on a resource the child owns, with the child's own onDestroy as an idempotent backstop"
    - "$effect.pre used to reach a bound child on the ONE state change the parent does not initiate, because it runs before the DOM update that would unbind it"
    - "One gesture read twice - always as play, conditionally as a choose - separated by time and distance rather than by target, with BOTH halves asserted in a browser"
    - "A 32-keyframe CSS animation instead of a JavaScript walker, so the only thing in the phase that waits costs the main thread nothing"
key-files:
  created:
    - src/lib/ui/PadSpinner.svelte
    - src/lib/ui/KeepOnDevice.svelte
    - src/lib/ui/ChosenPanel.svelte
    - src/lib/ui/TryOnDevice.svelte
  modified:
    - src/lib/ui/Coverflow.svelte
    - src/app.d.ts
    - e2e/first-experience.e2e.ts
    - docs/TESTING.md
    - .planning/phases/04-first-experience/deferred-items.md
decisions:
  - "The port is released through an exported release() on TryOnDevice called by the row, not through an onreleaseport callback: the un-choose path needs parent-to-child, and a callback points the wrong way"
  - "TryOnDevice's state variable is called `phase`, not `state`: a top-level variable named state makes svelte2tsx read every $state(...) rune call in the file as a store subscription, and svelte-check then reports eleven errors about a missing subscribe method"
  - "D-08 and D-09 contradict each other on stepping while chosen. Reconciled with STEP_AWAY_LIMIT = 1: one step re-fills the panel with the neighbour and leaves the connect state alone (W-20), a second step is `past` and closes it"
  - "not-zona and silent close the port before re-enabling the button, because both sets of approved steps tell the visitor to try again and a port this page is still holding would make that impossible"
  - "The panel's entrance animation lives in ChosenPanel rather than in the row, because the element only exists while it is chosen"
  - "The tap rule got its two browser assertions inside the existing choosing test rather than a ninth test, so the plan's `8 passed` criterion still holds literally"
metrics:
  duration: 32 min
  tasks: 3
  files: 9
  completed: 2026-09-04
---

# Phase 4 Plan 08: Choosing the Centre Pad, and the Device Behind It Summary

The front door now does the thing the brief is about: choose the centre pad and a panel appears with
`TRY ON DEVICE` in it — a control that really opens a port, really listens until the module names
itself, and has no reachable path to a write; and on a browser that cannot talk to hardware at all it
is still there, still disabled, naming Chrome, Edge and desktop Firefox 151 and no engine.

---

## Suite totals — observed

**Previous end state, from 04-07-SUMMARY:** quick **37 files / 532 passed | 1 todo**, sweep
**1 file / 9**, e2e **16**.

**Re-measured on this machine before this plan touched anything** (Phase 8 shares the tree, so the
baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  37 passed (37)
      Tests  532 passed | 1 todo (533)
```

It reproduced 04-07's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick                                 ->  37 files, 532 passed | 1 todo (533)
npm run test:sweep                                 ->   1 file,    9 passed (9)
npx playwright test                                ->  18 passed (53.5s)
npx playwright test e2e/first-experience.e2e.ts    ->   8 passed (33.4s)
npm run check                                      -> 418 files, 0 ERRORS, 0 WARNINGS
```

`test:quick` is **unchanged**, and that is correct rather than a miss: this plan adds four Svelte
components and no Vitest spec, because the repository collects no `.svelte.spec.ts` in any project —
a component test here would be collected by nothing and report green. Everything this plan adds that
a machine can check offline is checked by the structural probes below and by the two new browser
tests. `BASE_E2E + 2`.

Verified through `scripts/check-counts.mjs` at each task boundary:

| After task | Command                                                          | Result              |
| ---------- | ---------------------------------------------------------------- | ------------------- |
| 4-08-01    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 532` | exit 0              |
| 4-08-02    | `npx vitest run --project server src/lib/device/try-on.spec.ts`   | `6 passed (6)`      |
| 4-08-03    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 532` | exit 0              |
| plan end   | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9`    | exit 0              |
| plan end   | `npx playwright test e2e/first-experience.e2e.ts`                 | `8 passed (33.4s)`  |
| plan end   | `npx playwright test`                                             | `18 passed (53.5s)` |

**Plan 04-09 should treat 37 / 532 (quick), 1 / 9 (sweep) and 18 (e2e) as its baseline** — and should
re-measure rather than trust them.

---

## The four questions the plan asked to be answered

### 1. The mechanism for releasing the port on un-choose

**An exported `release()` on `TryOnDevice`, called by the row through `bind:this`** — not an
`onreleaseport` callback. The plan offered either; only one of them points the right way. The
un-choose path needs the parent to tell the child to let go, and a callback prop is the child telling
the parent something. Its shape:

```ts
export async function release(): Promise<void> {
  await closePort();
  failure = capable ? null : failure;
  identity = null;
  moduleType = undefined;
  if (capable) phase = "idle";
}
```

It is idempotent (`closePort()` clears the transport reference before awaiting the close, so a second
call finds nothing to do) and safe when nothing was ever opened. On an unsupported or insecure
browser it deliberately leaves the failure copy alone — there is nothing to reset to.

**Every path that reaches it:**

| Path                            | How it gets there                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `Escape`, from anywhere         | window `keydown` listener → `unchoose()` → `tryOn?.release()`                       |
| A click on any dimmed side pad  | `onClick`, `chosen && offset !== 0` → `unchoose()`                                  |
| Stepping past the chosen entry  | `afterStep()` → `unchoose()`                                                        |
| The **browser Back button**     | `$effect.pre` watching `chosen` go false → `tryOn?.release()`                       |
| Navigating away, or a reload    | `TryOnDevice`'s own `onDestroy` → `closePort()`                                     |
| The page being hidden           | `WebSerialTransport.closeOnHide()`, attached the moment the transport is built      |

The Back button is the one un-choose the row does not initiate, so it cannot go through `unchoose()`.
`$effect.pre` is what makes it reachable: it runs **before** the DOM update, which is the only moment
the bound child still exists to be asked. `onDestroy` is the backstop under all of it, and because
`release()` is idempotent nothing is lost by the overlap.

### 2. The exact `page.state` shape

`{ chosen: true }`, declared once in `src/app.d.ts`:

```ts
interface PageState {
  chosen?: boolean;
}
```

pushed as `pushState("", { chosen: true })` and read back as
`const chosen = $derived(page.state.chosen === true);`. The empty first argument is exactly what
`svelte/no-navigation-without-resolve` permits for shallow navigation — **no lint suppression was
added, and the two `eslint-disable` lines in `Coverflow.svelte` are 04-06's, both for
`svelte/prefer-svelte-reactivity`** (see deviation 2).

Un-choosing is `history.back()` when this page session pushed the entry, and `replaceState("", {})`
otherwise. The second branch is not defensive padding: a **reload while chosen** restores `page.state`
out of the history entry, so the flag can be true in a session that never pushed it, and
`history.back()` from there would leave the site rather than close a panel.

### 3. Did the 250 ms / 6 px tap rule need adjusting?

**No — and unlike the plan's phrasing suggests, it was not judged by hand in a browser. It was
proven in one, in both directions, and the numbers ship unchanged from W-15.**

```ts
  const TAP_MAX_MS = 250;
  const TAP_MAX_PX = 6;
```

A hand-held impression of "did that feel right" is not something this SUMMARY can honestly record —
there was no interactive session. What there is instead is stronger: two assertions inside the
choosing test, both shown red under perturbation (below). A press held for 350 ms plays the pad and
does **not** choose; a press with no measurable delay or movement does both. The touch is delivered
to the simulator either way, which is what keeps the pad an instrument.

If the numbers ever do need tuning, the two constants are the whole lever and the two assertions will
say immediately whether the tuning broke the other half.

### 4. The one-line human check for the user, with a real ZONA on the desk

> Open the front door, choose a pad, click `TRY ON DEVICE`, pick the module in the browser's chooser,
> and confirm the identified block names the firmware version and the active page — and that the
> module's own configuration is untouched afterwards (open Grid Editor and look, or simply watch that
> the pad on the desk never changes what it is doing).

Nothing in the browser can stand in for this: Web Serial has no CDP domain and no fake-device hook.
What **is** already proven offline is the part that matters most — `src/lib/device/try-on.spec.ts`
test 3 asserts zero writes across a full open, identify and close cycle against a transport that
records every byte, and separately asserts that the source contains no `.write(` at all.

---

## The import scan

Written to a scratch `.mjs` under the system temp directory and run with `node`, per the acceptance
criterion — never into the repository. It strips comments with the standing rule's backslash-free
expression, collects only **static** specifiers (the `from` form, anchored per line), fails if it
collected none, fails on any naming `$lib/transport`, `$lib/protocol` or `$lib/device`, and then
separately asserts that the three surfaces really are awaited inside `onMount`.

```js
import { readFileSync } from "node:fs";

const strip = (t) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const file = "src/lib/ui/TryOnDevice.svelte";
const src = strip(readFileSync(file, "utf8"));

const specs = [];
const re = /^[^\n]*\bfrom\s*("([^"]*)"|'([^']*)')/gm;
let m;
while ((m = re.exec(src)) !== null) specs.push(m[2] ?? m[3]);

if (specs.length === 0) {
  console.error("collected no static specifiers - the matcher is broken");
  process.exit(1);
}

const forbidden = ["$lib/transport", "$lib/protocol", "$lib/device"];
const bad = specs.filter((s) => forbidden.some((f) => s.includes(f)));
console.log("static specifiers:", JSON.stringify(specs));
if (bad.length > 0) {
  console.error("forbidden static specifiers: " + JSON.stringify(bad));
  process.exit(1);
}

const dynamic = [...src.matchAll(/import[(]\s*("([^"]*)"|'([^']*)')/g)].map(
  (d) => d[2] ?? d[3],
);
const unique = [...new Set(dynamic)];
console.log("dynamic specifiers:", JSON.stringify(unique));
for (const needed of forbidden) {
  if (!unique.some((u) => u.includes(needed))) {
    console.error("not loaded dynamically: " + needed);
    process.exit(1);
  }
}
console.log("ok - " + specs.length + " static, none touching a port");

// The dynamic list above also matches the type-only `typeof import("...")`
// references at the top of the file, so on its own it would pass on types
// alone. This is the check that the three surfaces really arrive at runtime.
if (!/onMount\([^]*await Promise\.all\(\[[^]*import\(/.test(src)) {
  console.error("the three surfaces are not awaited inside onMount");
  process.exit(1);
}
console.log("ok - awaited inside onMount");
```

Output:

```
static specifiers: ["svelte","$lib/catalog/front-door","./PadSpinner.svelte"]
dynamic specifiers: ["$lib/protocol","$lib/transport","$lib/device/try-on"]
ok - 3 static, none touching a port
ok - awaited inside onMount
```

The last check is not decoration. The file names all three modules in **type** position
(`typeof import("$lib/protocol")` and friends), and those match the dynamic pattern too — so the
dynamic half of this scan would have passed on a file that imported nothing at runtime at all.

---

## The negative checks, observed red

The plan asks for no perturbation, but the tap rule is a `must_haves` truth ("a tap can both play the
pad and choose it without the two colliding") that nothing in the plan's own test list would have
caught. Both halves were therefore added to the choosing test and both were shown red, one at a time,
from a pristine copy of `Coverflow.svelte` kept under the system temp directory.

**Perturbation A — `TAP_MAX_MS = 5000`.** The 350 ms press now also chooses, so the negative half
fires:

```
    Expected: 0
    Received: 1

      255 |       await page.getByTestId("chosen-panel").count(),
      256 |       "a press longer than the tap window plays the pad and does not choose",
    > 257 |     ).toBe(0);
```

**Perturbation B — `TAP_MAX_MS = 1`.** No press is ever short enough, so the positive half fires:

```
      - a quick tap on the hero both plays it and chooses it with timeout 5000ms
      - waiting for getByTestId('chosen-panel')

      263 |       page.getByTestId("chosen-panel"),
      264 |       "a quick tap on the hero both plays it and chooses it",
    > 265 |     ).toBeVisible();
```

Restored from the pristine copy; `git diff --quiet -- src/lib/ui/Coverflow.svelte` exited 0 afterwards
and both constants read `250` and `6` again. The full suite and the file were then re-run from the
restored source, which is where the `18 passed` and `8 passed` above come from.

---

## Verification

| Check                                                                                     | Result                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------ |
| Task 1 — no inert meter in the reserved region, and it names 908                          | exit 0                                     |
| Task 1 — `KEEP ON DEVICE` really `disabled`, approved reason, no bare `aria-disabled`      | exit 0 / exit 0                            |
| Task 1 — the spinner says no forbidden word and uses no timer (comment-stripped)          | exit 0                                     |
| Task 1 — the reserved region holds `152px`                                                | exit 0                                     |
| Task 2 — nothing is awaited before `requestPort`                                          | exit 0 (enclosing `function tryOnDevice(`) |
| Task 2 — none of `RequestQueue`, `hostHeartbeat`, `sendConfig`, `storePage`, `padReady`, `initLuaFormatter`, `.write(` (line, block **and** markup comments stripped) | exit 0 |
| Task 2 — every port-touching import is dynamic, at least one static collected             | exit 0 (script and output above)           |
| Task 2 — five approved strings present character for character                            | exit 0 (after deviation 1)                 |
| Task 2 — `DISCONNECT ZONA` present                                                        | exit 0                                     |
| Task 2 — no engine named in the raw source                                                | exit 0                                     |
| Task 2 — `npx vitest run --project server src/lib/device/try-on.spec.ts`                  | **6 passed (6)**                           |
| Task 3 — `pushState` used, no suppression of `no-navigation-without-resolve`              | exit 0 (corrected matcher, deviation 2)    |
| Task 3 — neither `data-testid="chosen-panel"` nor `TRY ON DEVICE` in `build/index.html`   | exit 0                                     |
| Task 3 — the un-choose path calls `release()`                                             | exit 0                                     |
| Task 3 — `TAP_MAX_MS = 250` and `TAP_MAX_PX = 6` are named constants                      | exit 0                                     |
| `npx playwright test e2e/first-experience.e2e.ts`                                         | **8 passed (33.4s)**, `grep -ci failed` → 0 |
| `npx playwright test`                                                                     | **18 passed (53.5s)**, `grep -ci failed` → 0 |
| `npm run check`                                                                           | 418 files, **0 ERRORS, 0 WARNINGS**        |
| `npm run lint`                                                                            | exit 0                                     |
| `npm run build`                                                                           | exit 0                                     |
| `npm run test:quick` through the helper at 37 / 532, three times                          | exit 0                                     |
| `npm run test:sweep` through the helper at 1 / 9                                          | exit 0                                     |
| `git diff --quiet -- src/vendor`                                                          | exit 0                                     |
| Port 4173 free before every Playwright run and after the last; no `wrangler` or `workerd`  | confirmed (0 processes, no listener)       |
| Working tree clean after every commit; no scratch file left in the repository              | confirmed                                  |

---

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The honesty line, written the house way, could not satisfy its own criterion**

- **Found during:** Task 4-08-02, running the copy probe.
- **Issue:** The plan's standing rule says visitor-facing strings live in a `const` block, and the
  house style wraps long ones as `"…" + "…"` to stay inside Prettier's width. The copy criterion reads
  the **raw source** for the whole sentence, so a correctly-written, correctly-formatted honesty line
  reported `missing approved copy: Connects to your ZONA and identifies it. …`.
- **Fix:** the sentence is one literal on one long line, with a comment beside it saying why it may
  not be split. Prettier does not break string literals, so `npm run lint` stays green; the rendered
  text is unchanged either way, and now the source and the screen agree with the probe.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`
- **Commit:** `138ce56`

**2. [Rule 1 - Bug] The lint-suppression criterion cannot match correct code**

- **Found during:** Task 4-08-03.
- **Issue:** The criterion fails when the file contains `eslint-disable` **and** the string
  `no-navigation-without-resolve` anywhere. `Coverflow.svelte` already carried two
  `// eslint-disable-next-line svelte/prefer-svelte-reactivity` lines from plan 04-06, and the same
  task's action text **requires** a comment naming `svelte/no-navigation-without-resolve` to record
  why no suppression is needed. The plan therefore mandates the exact pair of strings its own
  criterion rejects. This is the same class of matcher defect as 04-07 deviation 5.
- **Fix:** the matcher was corrected to what it plainly means — a disable **directive** naming that
  rule — and the correction is recorded rather than silently substituted:
  `/eslint-disable[a-z-]*[^\n]*no-navigation-without-resolve/`. Exits 0. Cross-checked by hand:
  `grep -n "eslint-disable"` prints the two `svelte/prefer-svelte-reactivity` lines and nothing else,
  and `grep -n "no-navigation-without-resolve"` prints one line, inside the explanatory comment.
- **Files modified:** none
- **Commit:** n/a — verification only

**3. [Rule 3 - Blocking] A variable named `state` breaks every `$state` rune in the file**

- **Found during:** Task 4-08-02, the first `npm run check`.
- **Issue:** the plan's own sketch names the state-machine variable `state`. Declaring it at the top
  level makes svelte2tsx read every subsequent `$state(...)` **rune call** in the file as a store
  auto-subscription on that variable; `svelte-check` reported eleven errors of the form
  `Cannot use 'state' as a store. 'state' needs to be an object with a subscribe method on it.`
- **Fix:** renamed to `phase`, with the reason written beside the declaration so nobody renames it
  back. Only the code identifiers moved; the prose in the comments still says "state machine",
  because that is what it is.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`
- **Commit:** `138ce56`

**4. [Rule 1 - Bug] Two `$derived` reads were typed `never`**

- **Found during:** Task 4-08-02.
- **Issue:** `P`, `T` and `D` are declared `$state(undefined)` and filled inside an async callback
  further down the file. At the `$derived` lines TypeScript has only ever seen them assigned
  `undefined`, so it narrows them to `undefined` there and the other arm of `D?.TRY_ON_LABEL` and
  `P ? P.IDENTIFY_WINDOW_MS : 0` becomes `never`. Two errors. Everything **inside** functions was
  fine — a function body does not inherit the outer narrowing — so this bit only at component scope.
- **Fix:** both reads go through a small typed helper (`labelOf(d: Device | undefined)`,
  `secondsOf(p: Protocol | undefined)`). A parameter is not narrowed by the caller's control flow, so
  the declared union survives, and the reason is written above them. Not a cast: nothing is asserted
  that the compiler cannot see.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`
- **Commit:** `138ce56`

**5. [Rule 2 - Missing critical functionality] `not-zona` and `silent` left the port held open**

- **Found during:** Task 4-08-02, reading the approved copy against the state table.
- **Issue:** the states table puts the button back to "enabled again" in both, and both sets of
  approved steps end with an instruction to try again — `Plug in a ZONA and try again`,
  `Click TRY ON DEVICE again and pick a different port`. A page that is still holding the port makes
  both of those fail, and the failure would read as a bug in the module rather than in HANGAR.
  `identifyOnly` deliberately never closes what it did not open (W-20), so the close has nowhere else
  to live.
- **Fix:** `await closePort()` on both outcomes, with the reason beside it. `identified` keeps the
  port — that is W-20 — and offers `DISCONNECT ZONA` to give it back.
- **Files modified:** `src/lib/ui/TryOnDevice.svelte`
- **Commit:** `138ce56`

**6. [Rule 2 - Missing critical functionality] The tap rule had no proof**

- **Found during:** Task 4-08-03, after the first green run.
- **Issue:** "a tap can both play the pad and choose it without the two colliding" is one of the
  plan's five `must_haves` truths, and none of the eight tests touched it. The plan's acceptance
  criterion pins the file at `8 passed`, so a ninth test was not available.
- **Fix:** both halves added **inside** the existing choosing test, so the count is untouched: a
  350 ms press must not choose, an instant press must. Both shown red under perturbation (above),
  which is what makes them worth having — the positive half alone would pass on an implementation
  where every press chooses, which is precisely the collision the rule exists to prevent.
- **Files modified:** `e2e/first-experience.e2e.ts`
- **Commit:** `433caff`

**7. [Rule 3 - Blocking] D-08 and D-09 contradict each other on stepping while chosen**

- **Found during:** Task 4-08-03.
- **Issue:** D-08 (and W-20, and the plan's own `<interfaces>`, twice) says stepping while chosen
  re-fills the panel and leaves the connect state alone. D-09 (and the plan's `must_haves`) says
  stepping past the chosen entry un-chooses. Both are stated as requirements and they cannot both
  hold for the same step.
- **Fix:** `STEP_AWAY_LIMIT = 1`, computed with the existing, tested `slotOffset` rather than a second
  modulo: one step is a look at the neighbour and re-fills the panel; a second step is "past" and
  closes it. The reconciliation and the fact that it *is* one are written into the constant's comment.
  **This is a judgement call on a genuine contradiction in the contract and is the one thing in this
  plan a reader might want to overturn** — the lever is that single constant.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Commit:** `9e21283`

### Observations, not deviations

- **`test:quick` did not move, by design.** Four components and no spec: this repository collects no
  `.svelte.spec.ts` in any Vitest project, so a component test would be collected by nothing and
  report green — the trap `docs/TESTING.md` calls green-and-vacuous. The offline gates for this plan
  are the structural probes and the two browser tests.
- **`TryOnDevice` uses `grid.onClose` for `unplugged-after`, not a `navigator.serial` listener.**
  UI-SPEC keys the state on the `navigator.serial` `disconnect` event; the plan's own code sketch uses
  `onClose`, and `WebSerialTransport` already attaches both a port-level and a `navigator.serial`-level
  disconnect listener and funnels them into `closeCb`. Using the transport's own callback is the same
  event with one fewer listener to remove. The `connect` half — noticing a ZONA plugged in while
  browsing — is Phase 6's, per STACK.
- **The panel's `aria-live="polite"` region contains the `DISCONNECT ZONA` button.** A screen reader
  therefore announces the control's existence along with the identified block, which is what a visitor
  needs to hear at that moment.
- **The identified body is one sentence, not a mono-set version number.** W-03 says `--font-mono` is
  *used only for* numerals that must not jitter; it does not require them to be wrapped. Splitting the
  sentence into three spans to set two numbers in mono would fragment a string the copy contract
  states whole, and the firmware version and page number do not change while they are on screen.
- **The button is disabled with no reason for a sub-second window after choosing**, while the three
  device modules are fetched. The honesty line is on screen throughout, so the control is never
  unexplained; there is simply no *disablement* reason during the fetch. Making that window visible
  would mean the word the copy contract forbids, or a spinner on a control nobody has clicked.
- **`ChosenPanel` owns the entrance animation** (16 px and a fade over 260 ms, or opacity alone over
  120 ms under reduced motion) because the element only exists while it is chosen. The row owns the
  recede: side slots at `× 0.55` opacity and `× 0.8` brightness, band `translateY(-24px)` over 260 ms,
  and under reduced motion the recede stays while the movement goes.
- **The hero is untouched while chosen**, deliberately: `dimOpacity`/`dimBrightness` both take the
  `hero` flag and return their input unchanged for it.
- **`page.goBack()` works on a shallow `pushState` entry** in Playwright 1.62.1 against this build; it
  returns no response object for a same-document navigation but the assertion after it is stable
  across five runs.
- **Four Playwright runs of the file and three of the full suite**, two of which were the perturbation
  runs. Port 4173 was confirmed empty before each and after the last, and no `workerd` or `wrangler`
  process remains.
- **Two scratch `.mjs` patch scripts and the pristine `Coverflow.svelte` copy live under the system
  temp directory**, never in the repository. A quoted bash heredoc carrying one of them died with
  `unexpected EOF while looking for matching '` — the same transport failure 04-04 and 04-07 both
  recorded — and was written with the editor instead.
- **`npm run check` through a pipe prints `0 ERRORS` in capitals.** Every check here used `grep -Ei`.

---

## Notes for later plans

- **Baseline for 04-09: quick 37 / 532 (plus the one pre-existing todo), sweep 1 / 9, e2e 18.**
  Re-measure before applying a delta.
- **Phase 5 docks into `ChosenPanel`'s reserved region, and the 152 px is the contract.** It is
  96 px of knob rack plus 56 px of meters. Replacing the caption and the one sentence with real
  controls must not change that number, or the panel resizes under a visitor mid-read.
- **Do not add the Lua formatter's idle prefetch to `TRY ON DEVICE`.** It belongs on the tune panel,
  where the first character cost is asked for. Anything awaited in this handler ahead of the chooser
  call burns the transient activation and the picker rejects with what reads as a permissions bug.
- **`release()` is the row's handle on the port and it is exported from `TryOnDevice`.** Any refactor
  that moves the panel out of `Coverflow.svelte` has to carry the `bind:this` and the `$effect.pre`
  with it, or the Back button starts leaving the port open.
- **`STEP_AWAY_LIMIT` is where D-08 and D-09 were reconciled.** If the user wants stepping while
  chosen to behave differently, that constant and its comment are the entire change.
- **Never name a top-level variable `state` in a `.svelte` file.** It turns every `$state(...)` rune
  call in the same file into a store subscription as far as `svelte-check` is concerned.
- **A `$derived` that reads a `$state(undefined)` filled later needs a typed helper**, not a cast:
  TypeScript narrows the variable to `undefined` at component scope and the other arm becomes `never`.
- **`src/lib/ui/` and `src/lib/device/` are still outside `forbidden-instructions.spec.ts`'s
  `SCANNED_DIRS`.** Logged in `deferred-items.md`; widening it to `src/lib` closes both gaps at once.

## Known Stubs

**None that block this plan's goal, and one deliberate reservation.**

`KEEP ON DEVICE` is a real, present, permanently `disabled` button with its reason on screen, and the
tuning region is a caption and one sentence with 152 px reserved behind it. Neither is a stub: both are
the contract's own specification of what Phase 4 ships (SAFE-02, W-19), both say plainly what arrives
later, and W-19 exists precisely because the alternative — an inert `— / 908` meter — reads as broken.
Phase 7 gives the first a body and Phase 5 fills the second.

Nothing else stubs. `TRY ON DEVICE` really opens a port, `identifyOnly` really folds real decoded
frames, the failure copy is Phase 2's own function with the label interpolated, the spinner really
walks, and choosing really pushes a history entry the Back button really pops.

## Requirements

`requirements: [IDENT-01, DEGR-02]` in the plan frontmatter is phase-level attribution. **Neither is
marked** in `.planning/REQUIREMENTS.md` by this plan.

- **IDENT-01** asks the 9×9 outline to be the logo, the pad frame **and the loading state**. The
  loading state now exists — `PadSpinner`, one lime cell walking the perimeter, three static cells
  under reduced motion — which was the last of the three still missing after 04-07. Whether IDENT-01
  is complete is the phase's verification call, not a plan's.
- **DEGR-02** requires install controls to be present but disabled with the reason inline on browsers
  that cannot install, never hidden. Its Phase 4 half is now delivered **and proven in a browser**:
  test 8 deletes `serial` off `Navigator.prototype`, asserts its own precondition, and then asserts
  that `try-on-device` exists and is disabled, that the reason names Chrome, Edge and Firefox 151,
  that the page never says Chromium, and that `keep-on-device` is present and disabled too. The
  traceability row still reads "Phase 7 (browser-capability half delivered in Phase 4)", and the
  Phase 7 half — the real install control — does not exist yet.

`.planning/REQUIREMENTS.md` is therefore unchanged by this plan.

## Self-Check: PASSED

All ten claimed source, test and documentation files exist on disk, and all four claimed commits
(`272e01e`, `138ce56`, `9e21283`, `433caff`) are in the history. No scratch file was left in the
repository.
