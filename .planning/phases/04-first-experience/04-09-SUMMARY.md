---
phase: 04-first-experience
plan: 09
subsystem: ui
tags:
  [
    routing,
    prerender,
    deep-link,
    entries,
    shallow-routing,
    replaceState,
    resolve,
    structural-guard,
    bundle-budget,
    phase-gate,
    CAT-01,
    PREV-01,
    PREV-05,
    D-12,
    D-21,
    W-16,
  ]
requires:
  - "src/lib/catalog/front-door.ts (04-02) - FRONT_DOOR, frontDoorIndex, EXCLUDED_FROM_ROW; the light module that imports nothing"
  - "src/lib/ui/FrontDoor.svelte (04-06, 04-07) - the one composition both routes render, with its initialId and splash props"
  - "src/lib/ui/Coverflow.svelte (04-06..04-08) - the row, its stepping, and page.state.chosen"
  - "src/lib/ui/FidelityLine.svelte (04-07) - the always-present fidelity claim"
  - "src/routes/+layout.ts (01) - prerender = true, trailingSlash = 'always'"
  - "scripts/check-counts.mjs (08-01) - baseline-plus-delta suite counting"
provides:
  - "src/routes/c/[id]/+page.ts - prerender, entries() over FRONT_DOOR, and a load that resolves an id to a row index"
  - "src/routes/c/[id]/+page.svelte - the same front door centred on one entry, splash={false}, with its own title and description"
  - "src/routes/+page.svelte - its own head block"
  - "src/lib/ui/Coverflow.svelte - syncAddress(): replaceState(resolve('/c/[id]', { id }), page.state) on every step"
  - "src/lib/ui/FidelityLine.svelte - a bounded unknown-address notice, UNKNOWN_NOTICE_MS = 4000"
  - "src/lib/config-shape.spec.ts - tests 13 and 14, the source guard and the artefact guard"
  - "e2e/first-experience.e2e.ts - now 11 tests"
  - "docs/TESTING.md - observed suite rows and a new front-door section"
affects:
  - "Phase 5's per-configuration OG images have a real <head> per entry to hang off; the tuned stamp rides in the hash (/c/<id>#<stamp>) on top of these routes"
  - "Phase 8's authoring waves get a page per new row entry for free - entries() is generated from FRONT_DOOR, so no build config changes when the row grows"
  - "Any future plan that statically imports the simulator from a route now has two red tests, one over the source and one over build/"
tech-stack:
  added: []
  patterns:
    - "entries() over a data module as the only build-facing change a dynamic prerendered route needs - vite.config.ts, wrangler.jsonc, worker/index.js and postbuild.mjs all stayed byte-identical"
    - "resolve() from $app/paths as the way to keep svelte/no-navigation-without-resolve satisfied without a single suppression comment"
    - "Carrying page.state through a shallow replaceState rather than resetting it, so a URL sync cannot destroy UI state held in the history entry"
    - "Two guards for one invariant - one over the source and one over the built artefact - each shown to catch what the other misses"
    - "A structural probe that fails when it can no longer find what it is looking for, so it cannot go blind and stay green"
key-files:
  created:
    - src/routes/c/[id]/+page.ts
    - src/routes/c/[id]/+page.svelte
  modified:
    - src/routes/+page.svelte
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/FidelityLine.svelte
    - src/lib/config-shape.spec.ts
    - e2e/first-experience.e2e.ts
    - docs/TESTING.md
    - .planning/phases/04-first-experience/deferred-items.md
key-decisions:
  - "The resolved pathname is left WITHOUT a trailing slash. resolve('/c/[id]', { id }) returns /c/aurora; Cloudflare's asset handler resolves that to /c/aurora/ on a reload (html_handling defaults to auto-trailing-slash), and concatenating a slash would produce a string the lint rule cannot type-check"
  - "syncAddress passes page.state, not {}. The plan's literal replaceState(url, {}) would clear the chosen flag and close the panel on the first arrow press, contradicting D-08/W-20"
  - "The unknown-address notice lives in FidelityLine with one setTimeout cleared in onDestroy, and the copy is authored at the route. The cross back is a CSS animation applied only after the timer has fired, so nothing else in the component ever fades"
  - "e2e/first-experience.e2e.ts imports FRONT_DOOR and EXCLUDED_FROM_ROW from src rather than restating eight ids, so a row that grows is covered without editing the test"
  - "The paint probe asserts > 0, per the plan's explicit instruction, and NOT the > 70 stall floor 04-VALIDATION.md's accepted deviation 3 describes. The two documents disagree; the observed numbers (139 to 216) are recorded so the floor is a one-line change if wanted"
patterns-established:
  - "Pattern: a dynamic prerendered route generated from a data module (entries()), so catalog growth needs no build change"
  - "Pattern: shallow navigation that preserves the existing history state instead of replacing it"
  - "Pattern: a paired source/artefact structural guard, each perturbed to prove the other does not cover it"
requirements-completed: [CAT-01, PREV-01, PREV-05]
duration: 25min
completed: 2026-09-04
---

# Phase 4 Plan 09: One Address Per Configuration, and the Phase Gate Summary

**Every configuration in the front-door row is now a real prerendered `/c/<id>/` file with its own
title and description, generated from `FRONT_DOOR` by an `entries()` export; opening one lands with
that pad centred, live and with no splash; stepping keeps the address current through
`replaceState(resolve(…))` without filling the back stack; and two structural guards — one over the
source, one over `build/` — keep the 131,101-byte protocol chunk off the front door's first paint.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-04T04:10:42Z
- **Completed:** 2026-09-04T04:36:01Z
- **Tasks:** 3
- **Files modified:** 9 (2 created, 7 modified)

---

## Suite totals — observed

**Previous end state, from 04-08-SUMMARY:** quick **37 files / 532 passed | 1 todo**, sweep
**1 file / 9**, e2e **18**.

**Re-measured on this machine before this plan touched anything** (the tree is shared with Phase 8,
so the baseline is re-observed rather than trusted):

```
npm run test:quick
 Test Files  37 passed (37)
      Tests  532 passed | 1 todo (533)
```

It reproduced 04-08's recorded end state exactly.

### Totals observed AFTER this plan

```
npm run test:quick                                 ->  37 files, 534 passed | 1 todo (535)   (10.1 s)
npm run test:sweep                                 ->   1 file,    9 passed (9)              (35.6 s)
npm run test:unit -- --run                         ->  38 files, 543 passed | 1 todo (544)   (44.7 s)
npx playwright test                                ->  21 passed (1.6m)
npx playwright test e2e/first-experience.e2e.ts    ->  11 passed (52.4s)
npx vitest run --project server src/lib/config-shape.spec.ts -> 14 passed (14)
npm run check                                      -> 421 files, 0 ERRORS, 0 WARNINGS
npm run lint                                       -> exit 0
npm run build                                      -> exit 0
```

`test:quick` moved by exactly **+2**, which is this plan's whole node-side delta: two structural
tests in `src/lib/config-shape.spec.ts`. The three new tests in
`e2e/first-experience.e2e.ts` are Playwright's, so `BASE_E2E + 3` = 21.

Verified through `scripts/check-counts.mjs`:

| After task | Command                                                          | Result             |
| ---------- | ---------------------------------------------------------------- | ------------------ |
| 4-09-01    | `npx playwright test e2e/first-experience.e2e.ts` (regression)    | `8 passed (34.8s)` |
| 4-09-02    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 534` | exit 0             |
| 4-09-03    | `npm run test:quick 2>&1 \| node scripts/check-counts.mjs 37 534` | exit 0             |
| plan gate  | `npm run test:sweep 2>&1 \| node scripts/check-counts.mjs 1 9`    | exit 0             |
| plan gate  | `npx playwright test`                                             | `21 passed (1.6m)` |

**This is the phase's last plan.** The end state for whoever comes next: quick **37 / 534 | 1 todo**,
sweep **1 / 9**, unit (both projects) **38 / 543 | 1 todo**, e2e **21**, check **421 files, 0
errors**.

---

## The routes that now exist

Eight configuration pages, one per row entry, each a real HTML file with its own `<title>` and
`<meta name="description">`:

```
build/c/aurora/index.html      <title>Aurora — HANGAR</title>
build/c/pinwheel/index.html    <title>Pinwheel — HANGAR</title>
build/c/ninepads/index.html    <title>Nine pads — HANGAR</title>
build/c/starfield/index.html   <title>Starfield — HANGAR</title>
build/c/joystick/index.html    <title>Joystick — HANGAR</title>
build/c/radar/index.html       <title>Radar — HANGAR</title>
build/c/faders/index.html      <title>Four faders — HANGAR</title>
build/c/dial/index.html        <title>Dial — HANGAR</title>
```

`build/c/tpad` does **not** exist, by design (D-20): `entries()` maps `FRONT_DOOR`, and `tpad` is in
`EXCLUDED_FROM_ROW`. `test ! -d build/c/tpad` exits 0, and the browser now pins it too — test 10
asserts `/c/tpad/` returns a real 404 over HTTP.

Each page really is centred on its own entry in the **prerendered** markup, before any JavaScript
runs:

```
build/c/radar/index.html:aria-activedescendant="slot-radar"
build/c/dial/index.html:aria-activedescendant="slot-dial"
build/index.html:aria-activedescendant="slot-aurora"
```

and `data-testid="splash"` appears once in `build/index.html` and **zero** times in
`build/c/aurora/index.html`.

**No build configuration changed.** `git diff --quiet -- vite.config.ts wrangler.jsonc worker/index.js scripts/postbuild.mjs`
exits 0. The `entries()` export is the entire build-facing delta, which is exactly what D-12 promised
and what makes a growing catalog free: a Phase 8 entry appended to `FRONT_DOOR` gets its own page
with no change here at all.

---

## The four things the plan asked to be recorded

### 1. Did the resolved deep-link pathname need a trailing slash?

**No, and nothing was concatenated.** The call ships exactly as the plan's `<interfaces>` block wrote
it:

```ts
replaceState(resolve("/c/[id]", { id: heroId() }), page.state);
```

`resolve` (`node_modules/@sveltejs/kit/src/runtime/app/paths/client.js:54`) returns
`base + pathname_prefix + resolve_route(...)` — for this route, `/c/aurora`, with no trailing slash,
while `+layout.ts` declares `trailingSlash: "always"`. That mismatch is harmless in both directions:

- **While the page is open** it is a shallow history update. No navigation happens, no asset is
  fetched, and nothing matches the path against the manifest.
- **On a reload** Cloudflare's asset handler resolves `/c/aurora` to `/c/aurora/` itself —
  `html_handling` defaults to `auto-trailing-slash`, and `wrangler.jsonc` does not override it.

The alternative the plan warned about — building `resolve(...) + "/"` — would produce a plain `string`
rather than kit's branded `ResolvedPathname`, and `svelte/no-navigation-without-resolve` would then
demand a suppression comment for a line that currently needs none. Letting the host do the redirect
is the cheaper trade, and it is what the plan preferred.

**No `eslint-disable` for the navigation rule exists anywhere in `Coverflow.svelte`.** The only two
suppressions in the file are 04-06's, both `svelte/prefer-svelte-reactivity`:

```
eslint-disable lines present: ["// eslint-disable-next-line svelte/prefer-svelte-reactivity",
                               "// eslint-disable-next-line svelte/prefer-svelte-reactivity"]
ok - no navigation rule is suppressed anywhere in src/lib/ui/Coverflow.svelte
```

### 2. The static-import matcher in test 13, and what test 14 prints when it goes blind

**Test 13's matcher**, verbatim, applied to comment-stripped source:

```ts
for (const match of source.matchAll(/from\s*["']([^"']+)["']/g)) {
  specifiers.push({ file, specifier: match[1] });
}
```

anchored to the `from` form and nothing else, then

```ts
const offenders = specifiers.filter(({ specifier }) =>
  COMPILER_MARKERS.some((marker) => specifier.includes(marker)),
);
```

with `COMPILER_MARKERS = ["vendor", "intechstudio", "lib/pad"]`. The anchoring is the point:
`Coverflow.svelte` reaches the simulator through `import("../../vendor/botor/pad-sim")` inside
`onMount`, and that dynamic import is the rule being **obeyed**. A matcher that saw any occurrence of
the specifier would forbid the correct implementation. The comment in the test states the measured
reason: `_pad.ts` imports `@intechstudio/grid-protocol` at module scope, the chunk is 131,101 bytes,
and a static import would put it on the critical path of a page whose whole job is to paint in under
two seconds.

Two anti-vacuity assertions guard the guard: `files.length > 3` (the walk was not empty) and
`specifiers.length > 0` (the matcher collected something).

**Test 14's blind-probe message**, observed red by temporarily changing `PROTOCOL_SYMBOL` to a
symbol no chunk contains:

```
AssertionError: no chunk contains GRID_PARAMETER_ELEMENT_NOT_A_SYMBOL — this guard can no longer
see the protocol package and is not proving anything: expected 0 to be greater than 0
 ❯ src/lib/config-shape.spec.ts:253:7
```

With the real symbol the probe finds exactly one carrier, and it is the chunk 04-RESEARCH measured:

```
C1rLf53t.js 131101 bytes
index.html references any: false
c/aurora references any: false
```

### 3. The recorded two-second paint count, and the viewport

**Test 11 counts pad frames by patching `CanvasRenderingContext2D.prototype.putImageData` in an init
script.** `src/lib/sim/paint.ts` ends in exactly one `ctx.putImageData` per pad per paint and
`paint.spec.ts` pins that, so the counter counts painted pad frames and nothing else.

Observed at the default **1280x720** viewport, on this machine, on 2026-09-04, across four runs:

| Run                                     | Paints in two seconds |
| --------------------------------------- | --------------------- |
| file alone, 1 worker                    | **215**               |
| file alone, 1 worker                    | **212**               |
| whole suite, 5 Playwright workers       | **139**               |
| whole suite, 5 Playwright workers (gate)| **216**               |

The test asserts only `> 0`, and logs the number into the run output and into `testInfo.annotations`.
The spread — 139 to 216, a 1.55x range on one machine in one afternoon, purely on how busy it was —
is the whole argument for not gating it. See deviation 6 for the disagreement between the plan and
04-VALIDATION.md on this point; the numbers above make the stall floor a one-line change if the user
wants it.

### 4. The one-line human check for the user with a ZONA, carried forward from 04-08-SUMMARY

> Open the front door, choose a pad, click `TRY ON DEVICE`, pick the module in the browser's chooser,
> and confirm the identified block names the firmware version and the active page — and that the
> module's own configuration is untouched afterwards (open Grid Editor and look, or simply watch that
> the pad on the desk never changes what it is doing).

Unchanged by this plan, and still the only thing in Phase 4 a machine cannot do. Web Serial has no
CDP domain and no fake-device hook. What is already proven offline is the part that matters most:
`src/lib/device/try-on.spec.ts` test 3 asserts **zero writes** across a full open, identify and close
cycle against a transport that records every byte, and separately asserts the component source
contains no `.write(` at all.

Two further properties deserve a human eye and are deliberately not assertions, carried forward from
04-06 and 04-07: whether the coverflow's depth reads as depth on a real screen, and whether the
splash's dissolve lands the wordmark cleanly on the header.

---

## The negative checks, observed red

### Test 13 red, test 14 green, from one perturbation

`src/lib/ui/FidelityLine.svelte` was `git add`ed (it was already committed by task 1), then given one
static vendored import:

```ts
import { PRESETS } from "../../vendor/botor/_pad";
```

`npx vitest run --project server src/lib/config-shape.spec.ts`, **with no rebuild**:

```
FAIL  |server| src/lib/config-shape.spec.ts > build configuration shape >
      the front door never reaches the compiler at module scope
AssertionError: a front-door file imports the compiler at module scope:
      expected [ Array(1) ] to deeply equal []

- []
+ [
+   "src/lib/ui/FidelityLine.svelte -> ../../vendor/botor/_pad",
+ ]

 Tests  1 failed | 13 passed (14)
```

**Test 14 stayed green throughout**, because it reads `build/`, which was never rebuilt. That is the
answer to "why two tests rather than one", stated as an observation rather than as an argument: the
source guard fires the moment the import is written, before any build exists to look at; the artefact
guard fires on a bundle that ships the chunk regardless of how it got there. Neither subsumes the
other.

Reverted with `git checkout --`; `git diff --quiet -- src/lib/ui/FidelityLine.svelte` exits 0,
`grep -c PRESETS src/lib/ui/FidelityLine.svelte` prints `0`, and the file re-ran at `14 passed (14)`.

### The blind probe, observed red

`PROTOCOL_SYMBOL` temporarily changed to `GRID_PARAMETER_ELEMENT_NOT_A_SYMBOL`, spec `git add`ed
first, message quoted in section 2 above, then `git checkout --` and `14 passed (14)` again.

---

## Verification

| Check                                                                                        | Result                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------- |
| Task 1 — eight `build/c/<id>/index.html`, each with a title                                  | `8 prerendered configuration pages`   |
| Task 1 — `test ! -d build/c/tpad`                                                            | exit 0                                |
| Task 1 — titles are per configuration and carry the site name                                | `Aurora — HANGAR \| Radar — HANGAR`   |
| Task 1 — `grep -q FRONT_DOOR src/routes/c/[id]/+page.ts`; `grep -c aurora` on the same file  | exit 0; `0`                           |
| Task 1 — stepping replaces through kit's import, never the patched global                    | exit 0 (after deviation 1)            |
| Task 1 — no navigation-rule suppression anywhere in `Coverflow.svelte`                       | exit 0 (corrected matcher, deviation 2) |
| Task 1 — `git diff --quiet -- vite.config.ts wrangler.jsonc worker/index.js scripts/postbuild.mjs` | exit 0                          |
| Task 1 — regression run of the existing front-door e2e file                                  | `8 passed (34.8s)`                    |
| Task 2 — `npx vitest run --project server src/lib/config-shape.spec.ts`                      | **14 passed (14)**                    |
| Task 2 — negative check: test 13 red naming the file, test 14 green                          | observed, quoted above                |
| Task 2 — negative check: the blind-probe message                                             | observed, quoted above                |
| Task 3 — `npx playwright test e2e/first-experience.e2e.ts`                                   | **11 passed (52.4s)**                 |
| Task 3 — `npx playwright test` (whole suite)                                                 | **21 passed (1.6m)**, `grep -ci failed` → 0 |
| Task 3 — no Playwright test title contains the word                                          | confirmed                             |
| Gate — `npm run check`                                                                       | 421 files, **0 ERRORS, 0 WARNINGS**   |
| Gate — `npm run lint`                                                                        | exit 0                                |
| Gate — `npm run test:quick` through the helper at 37 / 534                                   | exit 0                                |
| Gate — `npm run test:sweep` through the helper at 1 / 9                                      | exit 0                                |
| Gate — `npm run build`                                                                       | exit 0                                |
| `git diff --quiet -- src/vendor`                                                             | exit 0                                |
| `npx vitest run --project server src/lib/fidelity/vendored-diff.spec.ts`                     | `14 passed`, no failures              |
| `docs/TESTING.md` names `first-experience.e2e.ts` and `front door`                           | exit 0 / exit 0                       |
| Port 4173 free before every Playwright run and after the last; no `wrangler` or `workerd`     | confirmed                             |
| Working tree clean after every commit; no scratch file left in the repository                 | confirmed                             |

---

## Task Commits

1. **Task 4-09-01: One address per configuration** — `fcd00c1` (feat)
2. **Task 4-09-02: The two guards that keep the compiler off the front door** — `e02db52` (test)
3. **Task 4-09-03: The deep-link proof, the recorded frame budget, and the phase gate** — `7da6f8f` (test)
4. **Correction after the gate re-measured the paint count** — `68d447f` (docs)

---

## Files Created/Modified

- `src/routes/c/[id]/+page.ts` — `prerender`, `entries()` over `FRONT_DOOR`, and a `load` returning
  `{ id, index }` with `-1` for an address nobody has heard of.
- `src/routes/c/[id]/+page.svelte` — the same `FrontDoor`, `splash={false}`, with its own
  `<svelte:head>`; passes the unknown-address notice down when `index === -1`.
- `src/routes/+page.svelte` — its own head block; still just `<FrontDoor splash />` beneath it.
- `src/lib/ui/FrontDoor.svelte` — a `notice?: string` prop, forwarded to `Coverflow`.
- `src/lib/ui/Coverflow.svelte` — `syncAddress()` on every step, `notice` forwarded to the fidelity
  line.
- `src/lib/ui/FidelityLine.svelte` — `notice?: string`, `UNKNOWN_NOTICE_MS = 4000`, one `setTimeout`
  cleared in `onDestroy`, and a cross-back animation that is disabled under
  `prefers-reduced-motion`.
- `src/lib/config-shape.spec.ts` — 12 tests → 14.
- `e2e/first-experience.e2e.ts` — 8 tests → 11.
- `docs/TESTING.md` — observed suite rows, a new "The front door's test surface" section, and the
  paint count as an observation.
- `.planning/phases/04-first-experience/deferred-items.md` — the stale `test:unit` row is closed.

---

## Decisions Made

- **The pathname carries no trailing slash and nothing is concatenated.** Section 1 above.
- **`syncAddress` passes `page.state`, not `{}`.** The plan's literal second argument would have
  cleared the chosen flag and closed the panel on the first arrow press. See deviation 3.
- **`replaceState`, never `pushState`, for stepping.** Nine steps must not need nine Back presses
  (W-16). Choosing still pushes, exactly as 04-08 wrote it, and is untouched.
- **The unknown-address copy is authored at the route, the timing at the component.** The visitor
  string sits in the route's `const` block with the rest of its copy; `UNKNOWN_NOTICE_MS` sits beside
  the `setTimeout` that uses it, which is what the spec asked for ("keep it in one named constant so
  it is easy to change").
- **The e2e file imports the row instead of restating it.** `src/lib/catalog/front-door.ts` imports
  nothing at all — that is the whole reason it exists as a separate module — so pulling `FRONT_DOOR`
  and `EXCLUDED_FROM_ROW` into a Playwright file costs nothing and means a row that grows in Phase 8
  is covered here without anyone editing a list of eight ids.
- **No inline `app.html` splash-suppression script was added.** 04-RESEARCH §Architecture Pattern 5
  proposed one for the hash design D-12 replaced. With a real route there is nothing to suppress:
  `/c/[id]/+page.svelte` simply never renders a splash, and `build/c/aurora/index.html` contains zero
  occurrences of `data-testid="splash"`.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The stepping criterion's raw-source probe went red on a correct comment**

- **Found during:** Task 4-09-01, running the acceptance probes.
- **Issue:** the criterion reads the **raw** source and fails if it contains `history.replaceState`.
  The comment above `syncAddress()` correctly explained that the same-named method on the `history`
  global must not be used — and naming it made the probe report
  `the patched global was used instead of the kit import`. Correct code, red check.
- **Fix:** the comment was reworded to say the same thing without spelling the forbidden token
  ("Kit's import rather than the same-named method on the `history` global"). This keeps the
  criterion literal and strict rather than weakening it with a comment strip.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Verification:** the probe now prints `stepping replaces through the kit import` and exits 0.
- **Committed in:** `fcd00c1`

**2. [Rule 1 - Bug] The lint-suppression half of the same criterion cannot match correct code**

- **Found during:** Task 4-09-01.
- **Issue:** the criterion is `s.includes("eslint-disable") && s.includes("no-navigation-without-resolve")`
  over the whole file. `Coverflow.svelte` legitimately carries two unrelated
  `eslint-disable-next-line svelte/prefer-svelte-reactivity` lines (04-06's) **and** a comment naming
  `no-navigation-without-resolve` to explain why no suppression is needed. Both substrings are
  present in a file with no suppression of that rule at all. This is the same defect plan 04-08
  recorded as its deviation 2, in the same criterion shape.
- **Fix:** corrected to the same-line form — a suppression is one line that both disables and names
  the rule — written to a scratch `.mjs` under the system temp directory, never into the repository.
  It also prints every `eslint-disable` line it found so the result is auditable rather than a bare
  exit code.
- **Files modified:** none (a check, not source).
- **Verification:** output quoted in section 1 above; exit 0.
- **Committed in:** n/a (verification tooling, kept out of the repository)

**3. [Rule 2 - Missing critical] `replaceState(url, {})` would have closed the chosen panel**

- **Found during:** Task 4-09-01, wiring `syncAddress()`.
- **Issue:** the plan's `<interfaces>` writes `replaceState(resolve('/c/[id]', { id }), {})`. Since
  plan 04-08 the chosen flag lives **in the history entry** (`page.state.chosen`), and `stepBy()`
  runs `syncAddress()` before `afterStep()`. Passing `{}` would therefore clear `chosen` on the first
  arrow press, closing the panel — which directly contradicts D-08 and W-20 ("one step re-fills the
  panel with the neighbour and leaves the connect state alone") and would have made
  `STEP_AWAY_LIMIT` dead code.
- **Fix:** `replaceState(resolve("/c/[id]", { id: heroId() }), page.state)`, with the reasoning in the
  function's doc comment. `page.state` is the current `App.PageState`, so an unchosen page still
  replaces with an empty state and the behaviour the plan wrote is preserved where it applies.
- **Files modified:** `src/lib/ui/Coverflow.svelte`
- **Verification:** e2e test 6 (choosing, Escape and Back) stayed green through the regression run
  and the gate; `replaceState` does not change the history stack depth, so `history.back()` in
  `unchoose()` still works.
- **Committed in:** `fcd00c1`

**4. [Rule 2 - Missing critical] The unknown-address truth had no gate**

- **Found during:** Task 4-09-03.
- **Issue:** `must_haves.truths` includes "An address nobody has heard of lands on the shelf with a
  line saying so, rather than on a dead end", and the plan's own test list checked only that
  `/c/tpad/` returns 404 over HTTP. Nothing proved that the fallback page hydrates, that the client
  router matches `/c/[id]`, or that the notice actually renders — the three things that turn a 404
  into a shelf.
- **Fix:** three assertions added **inside** test 10, so the plan's `11 passed` count still holds
  literally: `page.goto("/c/tpad/")`, the coverflow visible and centred on the row's first entry, and
  `fidelity-notice` reading `Never heard of that one. Here is the shelf instead.` character for
  character.
- **Files modified:** `e2e/first-experience.e2e.ts`
- **Verification:** all three green in the gate run. They are also what proved the whole fallback path
  works end to end, which nothing else in the suite touches.
- **Committed in:** `7da6f8f`

**5. [Rule 1 - Bug] The deliberate 404 makes an empty-console assertion impossible in test 10**

- **Found during:** Task 4-09-03, first run of the file at 11 tests.
- **Issue:** navigating to a 404 on purpose makes the browser log exactly one error-level message.
  The house `expect(consoleErrors).toEqual([])` therefore went red on a test that had already passed
  every assertion it existed to make.
- **Fix:** the exception is narrow and asserted from **both** sides — everything not mentioning the
  status code must be empty, and the total must be exactly one — so the test still fails on any
  console error it did not cause. Every other test in the file keeps the unconditional empty-console
  assertion.
- **Files modified:** `e2e/first-experience.e2e.ts`
- **Verification:** `11 passed`, then `21 passed` in the gate.
- **Committed in:** `7da6f8f`

### Recorded, not fixed

**6. The plan and 04-VALIDATION.md disagree about test 11's assertion.**

The plan's task 4-09-03 says, twice and explicitly: *"Assert only that it is greater than zero and
that the run produced no console errors. This is a recorded measurement, not a budget gate."*
`04-VALIDATION.md`'s accepted deviation 3 says instead: *"the paints counted over two seconds on the
built site must exceed **70**"* — a stall floor at 25% of the `7 × 2 × 20 = 280` the specified
cadences imply.

**The plan was followed**, because the plan is the authoritative document for execution and its
wording is a ceiling on strictness ("assert only"), not a floor. The observation is recorded here and
in `docs/TESTING.md` so the disagreement is visible and cheap to settle: every run observed
(139, 212, 215, 216) clears 70 by a wide margin, so adding

```ts
expect(painted, "the shared loop has not stalled").toBeGreaterThan(70);
```

to test 11 would satisfy 04-VALIDATION.md without changing anything else. It is a one-line change and
it is left to the user, because the two documents genuinely say different things and this executor
should not silently pick the stricter one.

**7. Task 4-09-02 is marked `tdd="true"`, and was executed as guard-then-perturb rather than
RED-then-GREEN.**

Both tests are structural guards over code that was already correct when they were written, so a
literal RED-first commit would have required first breaking `FidelityLine.svelte` (or the build) to
make a test fail, then committing that broken state. The falsifiability the TDD flow exists to
provide was obtained instead by the plan's own negative-check protocol: each guard was **observed
red** under a perturbation and green after the revert, with both messages quoted above. No separate
`test:`/`feat:` commit pair exists for this task; one `test:` commit does.

---

**Total deviations:** 5 auto-fixed (2 bugs in acceptance criteria, 1 bug in a test's console
assertion, 2 missing-critical), 2 recorded without change.
**Impact on plan:** no scope creep. Deviations 1 and 2 corrected acceptance checks that could not
match correct code; deviation 3 prevented a regression against 04-08's shipped behaviour; deviations
4 and 5 closed a `must_haves` truth that the plan's test list left ungated. Test and file counts are
exactly what the plan specified: `config-shape.spec.ts` 14, `first-experience.e2e.ts` 11.

---

## Issues Encountered

**Playwright's worker count changes what the paint probe measures.** A single-file run uses one
worker; the whole suite uses five, and the first whole-suite run recorded 139 paints where an
isolated run recorded 212–215. The second whole-suite run then recorded 216. `docs/TESTING.md` was
corrected after the gate (commit `68d447f`) to state the observed range across four runs rather than
the tidier but wrong story that contention costs a fixed 35%. This is exactly why the number is
recorded and not gated.

Nothing else. No blocker, no architectural question, no `Rule 4` moment.

---

## Deferred item closed

`.planning/phases/04-first-experience/deferred-items.md` carried, from plan 04-08:

> `docs/TESTING.md`'s `npm run test:unit -- --run` row still reads **27 files, 462 passed + 1 todo**,
> which cannot be right when `test:quick` alone is 37 / 532. […] One `npm run test:unit -- --run` in
> a later plan fixes it.

Run and observed here: **38 files, 543 passed | 1 todo (544); 49 s wall (44.7 s)**. The row is
corrected, and the item is marked closed in `deferred-items.md`.

Two items remain open there, both untouched by this plan: the GSD `state update-progress` defect, and
`src/lib/ui/` and `src/lib/device/` still being outside `forbidden-instructions.spec.ts`'s
`SCANNED_DIRS`.

---

## Known Stubs

None. Every component and route this plan touched is wired to real data: `entries()` reads the real
row, `load` resolves against the real index, the head metadata comes from the real catalog strings,
and the notice renders real copy on a real fallback path proven in a browser.

`ChosenPanel.svelte`'s 152px reserved region and `KEEP ON DEVICE`'s disabled state are 04-08's
deliberate Phase 5 and Phase 7 seams, documented there, and are not stubs introduced here.

---

## Next Phase Readiness

**Phase 4 is complete.** Every plan has landed and the full suite is green against the production
static build served by the real Basic Auth Worker: check, lint, quick, sweep, build, end-to-end.

What Phase 5 inherits:

- **A real `<head>` per configuration.** This is the thing D-12 chose routes over a fragment for, and
  it is the precondition for Phase 5's success criterion 5 (per-config OG images for link unfurls). A
  per-preset OG image can now be prerendered at build time by running `PadSim` in Node and encoding a
  PNG, keyed off the same `FRONT_DOOR` list `entries()` uses.
- **The hash is free.** Stepping and choosing both use the pathname and the history state; nothing in
  Phase 4 writes to `location.hash`. Phase 5's tuned stamp can ride there (`/c/<id>#<stamp>`) with no
  contention.
- **A 152px reserved region in `ChosenPanel`** for the knobs and the two 908-character meters (D-08).
- **Two guards that will fail loudly** if Phase 5's tuning UI statically imports the compiler.
  Phase 5 genuinely needs `GridScript.compressScript` for the cost meters, so it must arrive the way
  `TryOnDevice` arrives — dynamically, inside a handler, with the formatter prefetched on idle or on
  hover. Test 13 will name the offending file the moment it does not.

One blocker for the user, unchanged and not this phase's to clear: the single hardware check in
section 4 above.

---

_Phase: 04-first-experience_
_Completed: 2026-09-04_

## Self-Check: PASSED

All eleven created or modified files exist on disk, and all four task commits
(`fcd00c1`, `e02db52`, `7da6f8f`, `68d447f`) are present in the repository history.
