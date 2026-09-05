---
phase: 06-device-session
plan: 08
subsystem: ui
tags: [pad-spinner, device-mark, failure-block, leaf-components, decorative, structural-prop, CONN-04, CONN-08]

# Dependency graph
requires:
  - "src/lib/ui/PadSpinner.svelte (04-06) — the 32-keyframe walk on an 11.111% cell, the steps(1) note, the reduced-motion three-cell block"
  - "src/lib/ui/TryOnDevice.svelte (04-08) — the title / detail / steps markup and its type and colour declarations, copied into FailureBlock"
  - "src/lib/ui/BudgetMessage.svelte (05-09) — the precedent for declaring a rendered shape structurally rather than importing it"
  - "src/lib/device/session-copy.ts (06-02) — SessionBlock { title?, detail, steps }, the shape FailureBlock's prop is assignable from"
  - "src/lib/assets/favicon.svg — the five-cell diagonal the connected shape reproduces"
  - "06-UI-SPEC.md § The 9x9 mark, § The failure states, § Modified (PadSpinner), Accessibility Contract (no heading in a disclosure)"
  - "e2e/fake-serial.ts (06-06, 06-07) — grant / pick / openFails, used only to drive the served build for measurement"
  - "06-07-SUMMARY.md — PREV_FILES / PREV_TESTS 68 / 715, PREV_E2E 71, the five-name block"
provides:
  - "src/lib/ui/PadSpinner.svelte: size = 32 and decorative = false, both defaulting to exactly what ships; --spinner-size in place of the two 32px declarations; nothing else changed"
  - "src/lib/ui/DeviceMark.svelte: the 24px 9x9 mark in four shapes - dark, detected, connecting, connected - aria-hidden, the walk delegated to <PadSpinner size={24} decorative />"
  - "src/lib/ui/FailureBlock.svelte: the one failure block, title / detail / <ol>, prop declared structurally with an optional title, no list when steps is empty, no heading, no control"
  - "The measured facts: the panel's spinner is 32 x 32 with all three attributes; all four marks are 24 x 24; the already-open row renders two <p> and no <ol>"
affects:
  - "06-09 — PickerExplainer and DeviceNote sit beside these; the reserved header note's arithmetic can assume a 24px mark"
  - "06-10 — DeviceSlot maps nine slot states onto DeviceMark's four shapes; DeviceDetails mounts FailureBlock with CONNECT_LABEL; device-ui.spec.ts gains the hex scan deferred item 6 asks for"
  - "06-12 — TryOnDevice mounts FailureBlock with TRY_ON_LABEL and drops its own title / detail / steps markup"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 8/14"

tech-stack:
  added: []
  patterns:
    - "A shipped component gains a size prop as ONE custom property, never a second animation: when keyframes are percentage translates on a fractional cell, the same @keyframes serve every size, and the proof is a computed --spinner-size of 32px on the panel and 24px in the header"
    - "A decorative instance drops its data-testid together with its role and label, because the two instances are on screen at once and a selector that matches both makes every existing assertion about the first ambiguous"
    - "A leaf declares the shape it renders with an OPTIONAL field where the source type has a required one, so two source shapes (FailureCopy and SessionBlock) flow into one component without a second component or an import"
    - "A temporary probe mount is authorised for measurement, hashed before it is added, restored from HEAD by git show, and proven gone by the same hash and git diff --quiet before the commit that would otherwise have carried it"

key-files:
  created:
    - "src/lib/ui/DeviceMark.svelte"
    - "src/lib/ui/FailureBlock.svelte"
    - ".planning/phases/06-device-session/06-08-SUMMARY.md"
  modified:
    - "src/lib/ui/PadSpinner.svelte"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "DeviceMark's five connected cells are placed by a style:transform directive over a DIAGONAL = [0..4] array rather than five static classes: the coordinates read as grid steps exactly as PadSpinner's keyframes do, and the measured cell offsets (0, 2.656, 5.313, 7.969, 10.625 px at 24px) are the favicon's diagonal from cell (0,0) to the centre"
  - "FailureBlock copies TryOnDevice's .title, .detail and .steps type and colour declarations verbatim but owns its own first-child margin (.detail is margin 0; .title + .detail is 8px): the treatment must not drift, the block's outer spacing belongs to the block"
  - "The served build was measured through a scratch static file server on 127.0.0.1:4174 (node:http over build/), never by invoking wrangler directly; the suite itself still ran through Playwright's own webServer, which is the established route"
  - "The second negative check is recorded as UNOBSERVABLE rather than passed off: identity.spec.ts reads src/app.css and the favicon only, so a hex in a component cannot turn it red; the guard belongs to 06-10's device-ui.spec.ts and deferred item 6 says exactly what to lift"

requirements-completed: []
requirements-contributed: [CONN-04, CONN-08]

# Metrics
duration: 20min
completed: 2026-09-05
---

# Phase 6 Plan 08: PadSpinner's two props, DeviceMark, FailureBlock Summary

**Three leaves and no new behaviour. `PadSpinner` takes `size` and `decorative`, both defaulting to what shipped, and on the served build the panel's spinner still reports `data-testid="pad-spinner"`, `role="img"`, `aria-label="Connecting"` and a **32 x 32** box with `--spinner-size: 32px` while `TryOnDevice.svelte` and `CatalogCard.svelte` are unedited. `DeviceMark` renders the session's four shapes at **24 x 24** each, `aria-hidden` in all of them: dark lights nothing, detected lights cell (0,0), connecting is `<PadSpinner size={24} decorative />` carrying no testid, role or label with `--spinner-size: 24px` and the same walk animation, connected lights (0,0) (1,1) (2,2) (3,3) (4,4) - the favicon's diagonal. `FailureBlock` declares `{ title?, detail, steps }` structurally and in the `already-open` state rendered exactly `The port would not open` / `HANGAR is already connecting — one moment.` as two `<p>` with **0 `<ol>`, 0 headings, 0 controls**. The probe mount used for those two measurements was temporary: `src/routes/dev/session/+page.svelte` hashes `1a20cc91…` before and after and `git diff --quiet` on it exits 0. Two negatives observed and restored byte-identical (the spinner shrank to 24 x 24 under a default of 24; an unconditional `<ol>` put `<ol class="steps"></ol>` in the DOM for a state with no steps); the third - a hex in `DeviceMark` - left `identity.spec.ts` at 6 passed, because that spec never reads a component, and is deferred to 06-10's gate. Quick 68 / 715, sweep `3 13`, e2e 71 with webkit-phone at 9, svelte-check 527 files.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` as re-measured by **06-07**; this plan adds no e2e test and re-measured nothing.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13                |

### Observed totals: previous SUMMARY plus this plan's delta

06-07 left the tree at **68 files / 715 tests**. This plan adds **+0 files / +0 tests** - `device-ui.spec.ts` arrives in 06-10 - so quick stands at **68 / 715**, still `BASE_FILES + 2` and `BASE_TESTS + 24`. Sweep is unchanged at **`3 13`**. E2E is **71 + 0 = 71**, nine on webkit-phone, unchanged.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 715
  check-counts: observed 68 files, 715 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npx playwright test --workers 3 2>&1 | tee .tmp-e2e/06-08-suite-w3.log | node scripts/check-counts.mjs --playwright 71
  check-counts: observed 71 tests passed
  check-counts: matches the expected counts
  71 passed (1.5m)

npx playwright test --list                                       -> Total: 71 tests in 11 files
npx playwright test --project webkit-phone --list                -> Total: 9 tests in 3 files
npx playwright test e2e/session.e2e.ts --project chromium --list -> Total: 9 tests in 1 file

npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts
  Test Files  5 passed (5)      Tests  36 passed (36)
  config-shape.spec.ts 14 · identity.spec.ts 6 · tune-ui.spec.ts 5 · browse-ui.spec.ts 6 · glyph-field.spec.ts 5

npm run check 2>&1 | grep -Ei "error|warning"
  1788580577691 COMPLETED 527 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` moves from **525 to 527 files**: the two new components, nothing else. The e2e figure above is the **third** run of the suite tonight; the first two died under wrangler, not under a test - see Deviations 2. After every run: **no LISTENING socket on 4173 and no `workerd.exe` or `wrangler` process**; `test-results/` removed by hand four times (deferred item 5).

## Task 1 — PadSpinner gains size and decorative, and changes nothing (commit `f3824e7`)

Two props, exactly as the interfaces block gives them, and `--spinner-size` in place of the two `32px` declarations on `.spinner`. Every keyframe, both gradients, the `steps(1)` timing and the reduced-motion block are byte-for-byte what they were; the diff is the `<script>` block, five attribute lines and two declarations. The header now says why `decorative` drops the `data-testid` as well as the role and the label: throughout the connecting state the header's mark and the panel's spinner are on screen **at the same time**, and a selector that matched two elements would make every existing assertion about the panel's spinner ambiguous.

The three attributes are conditional on the prop (`decorative ? undefined : "pad-spinner"`), so a decorative instance has none of them in the DOM rather than an empty one; the size is `style:--spinner-size="{size}px"`.

### The default, measured on the served build

`/c/aurora/`, the panel opened with Enter on the coverflow, a granted ZONA picked through the shim with nothing fed, `TRY ON DEVICE` clicked - the panel sits in `identifying` for the 1500 ms window, status line `Listening for the module…`:

```
SPINNER {"count":1,"role":"img","ariaLabel":"Connecting","testid":"pad-spinner",
         "styleAttr":"--spinner-size: 32px;","width":32,"height":32,
         "inlineSize":"32px","blockSize":"32px","spinnerSize":"32px",
         "walkerAnimation":"svelte-lo82m8-walk","status":"Listening for the module…"}
```

**One element** matches `[data-testid="pad-spinner"]`, all three attributes present, computed `inline-size` and `block-size` **32px**, bounding box **32 x 32**, the walk animation running. `TryOnDevice.svelte` and `CatalogCard.svelte` are unedited (`git diff --quiet` on both exits 0 against HEAD).

### Negative check 1

`size = 32,` replaced by `size = 24,`, rebuilt, the same measurement:

```
SPINNER {"count":1,"role":"img","ariaLabel":"Connecting","testid":"pad-spinner",
         "styleAttr":"--spinner-size: 24px;","width":24,"height":24,
         "inlineSize":"24px","blockSize":"24px","spinnerSize":"24px", ...}
    restored byte-identical: src/lib/ui/PadSpinner.svelte -> true
```

The panel's spinner **shrank to 24 x 24** with the attributes untouched - which is the whole reason the default is the thing under guard. Restored.

## Task 2 — DeviceMark, four shapes and no new colour (commit `56517f8`)

The dot field is PadSpinner's first layer at 24px: the same `radial-gradient(circle at 50% 50%, var(--color-line-soft) 0 6%, transparent 6.5%)` at `11.111% 11.111%`. A lit cell is PadSpinner's `.walker` standing still: an 11.111% box with the accent gradient at 34% / 38%. The connecting shape is `<PadSpinner size={24} decorative />` and nothing else, so reduced motion inherits the three static cells rather than re-implementing them. `aria-hidden="true"` in every state, `data-testid="device-mark"`, and a `data-shape` attribute so 06-10's tests can read the shape without inferring it from lit cells.

### The four shapes, measured side by side on the probe

The probe page temporarily rendered all four in a row (the mount described under Task 3). Every mark measured **24 x 24** and `aria-hidden="true"`; cell boxes are 2.65625 px (24 / 9):

| `shape`      | lit | where                                                       | inside                                                                                                             |
| ------------ | --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `dark`       | 0   | —                                                           | the dot field only                                                                                                 |
| `detected`   | 1   | (col 0, row 0), `transform: none`                           | one static cell, top-left                                                                                          |
| `connecting` | —   | the walk                                                    | `.spinner` **24 x 24**, `data-testid` **null**, `role` **null**, `aria-label` **null**, `--spinner-size: 24px`, `animationName: svelte-lo82m8-walk` |
| `connected`  | 5   | (0,0) (1,1) (2,2) (3,3) (4,4) at 0 / 2.656 / 5.313 / 7.969 / 10.625 px | five static cells, the favicon's diagonal from the first cell to the centre                                 |

`padSpinnersOnPage: 0` - the decorative instance collides with no selector, which is the property Task 1's header promised. The header row's height cannot move with the state, because all four boxes are the same 24px.

### The comment-stripped specifier scan

House `stripComments` over the three files, then every `from "…"`, every `import(…)`, the hex matcher with its `{#each` lookahead, and the markers:

```
src/lib/ui/PadSpinner.svelte   {"specifiers":[],"dynamic":[],"hex":[],"svg":false,"canvas":false,"transport":false,"setInterval":false,"heading":false,"button":false,"colorOver":false}
src/lib/ui/DeviceMark.svelte   {"specifiers":["./PadSpinner.svelte"],"dynamic":[],"hex":[],"svg":false,"canvas":false,"transport":false,"setInterval":false,"heading":false,"button":false,"colorOver":false}
src/lib/ui/FailureBlock.svelte {"specifiers":[],"dynamic":[],"hex":[],"svg":false,"canvas":false,"transport":false,"setInterval":false,"heading":false,"button":false,"colorOver":false}
```

`DeviceMark`'s one specifier is the sibling spinner; `config-shape.spec.ts` test 13 walks `src/lib/ui/` whole and stayed at 14 with both new files in the walk.

### Negative check 2 — observed, and not red

`var(--color-accent) 0 34%,` in the lit cell's gradient replaced by `#d6ff4e 0 34%,` (grep confirms one hex in the file), then the plan's command:

```
npx vitest run --project server src/lib/ui/identity.spec.ts
  Test Files  1 passed (1)      Tests  6 passed (6)       exit 0
npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts
  Test Files  5 passed (5)      Tests  36 passed (36)     exit 0
    restored byte-identical: src/lib/ui/DeviceMark.svelte -> true
```

**Green.** `identity.spec.ts` reads exactly two files - `src/app.css` and `src/lib/assets/favicon.svg` - and its hex assertion is about the token ladder. No spec in the tree scans `src/lib/ui/*.svelte` for a hex literal: `browse-ui.spec.ts`'s hex rule walks the browse files alone, and `tune-ui.spec.ts` checks the seven Phase 5 components for `--color-over` only. The plan's expectation was wrong about where the guard lives; the component is right (the scan above shows no hex), but nothing enforces that today. Recorded as Deviation 1 and **deferred item 6**, owner 06-10's `device-ui.spec.ts`.

## Task 3 — FailureBlock, one block, two mounts, one wording (commit `d526fc4`)

`{ title?: string; detail: string; steps: readonly string[] }`, declared in the file. A `FailureCopy` (required title) and a `SessionBlock` (optional title, `string[]`) are both assignable to it, so the six `failureCopy` states, the three authored blocks and the S5 sentence all render through one component. `.title`, `.detail` and `.steps` carry `TryOnDevice.svelte`'s type and colour declarations verbatim (12px / 600 / 0.01em / `--color-ink`; 16px / 400 / 1.5 / `--color-ink`; the same at `--color-ink-quiet` with `list-style: decimal` and `padding-inline-start: 24px`). The one difference is the block's own first-child spacing: `.detail` is `margin: 0` and `.title + .detail` is 8px, where TryOnDevice's `.detail` carries `margin: 8px 0 0` because it sits under a 16px status region. The `<ol>` is inside `{#if block.steps.length > 0}`. There is no heading element and no control; the header says why (a disclosure is not a document section).

### The temporary probe mount

Nothing mounts `FailureBlock` or `DeviceMark` until 06-10 and 06-12, so `src/routes/dev/session/+page.svelte` carried, for the measurement only: two imports, a flex row of four `<DeviceMark shape=… />`, and `{#if failure}<FailureBlock block={failure} testid="probe-failure-block" />{/if}` fed from the probe's own `session.failureFor(CONNECT_LABEL)`. The file was hashed before the edit and restored from HEAD with `git show HEAD:src/routes/dev/session/+page.svelte > …` afterwards (never `git checkout` or `restore`):

```
probe sha256 before  1a20cc9139d9f8aa1388c56d4c8fd26c0ec55390b6b653391d09a94ef198ed11
probe sha256 after   1a20cc9139d9f8aa1388c56d4c8fd26c0ec55390b6b653391d09a94ef198ed11
git diff --quiet -- src/routes/dev/session/+page.svelte   -> exit 0 (unchanged against HEAD)
git diff --stat  (before the task commits)                -> src/lib/ui/PadSpinner.svelte | 50 +++++---   and no probe line
grep -c "FailureBlock\|DeviceMark\|probe-marks" src/routes/dev/session/+page.svelte -> 0
```

The mount is in none of the three commits, and the file is not in this plan's `key-files`.

### The already-open state, rendered

A ZONA granted before load (`detected`), `openFails(0, "InvalidStateError", "Failed to execute 'open' on 'SerialPort': The port is already open.")`, one click on `CONNECT ZONA`. The session lands in `unknown` and `failureFor` returns the already-connecting row - a title, a sentence, `steps: []`:

```
BLOCK { "text":  "The port would not open HANGAR is already connecting — one moment.",
        "html":  "<p class=\"title svelte-qssxvf\">The port would not open</p><!----> <p class=\"detail svelte-qssxvf\">HANGAR is already connecting — one moment.</p> <!---->",
        "ol": 0, "li": 0, "p": 2, "headings": 0, "controls": 0,
        "titleText": "The port would not open",
        "detailText": "HANGAR is already connecting — one moment." }
```

**Two paragraphs, no list element at all, no heading, no tab stop.** The `<!---->` after the detail is Svelte's anchor for the `{#if}` that rendered nothing. `writes()` was 0 throughout.

### Negative check 3

The `{#if block.steps.length > 0}` / `{/if}` removed so the `<ol>` renders unconditionally, rebuilt (in the same mutated build as negative 1), the same state:

```
BLOCK { "html": "<p class=\"title …\">The port would not open</p><!----> <p class=\"detail …\">HANGAR is already connecting — one moment.</p> <ol class=\"steps svelte-qssxvf\"></ol>",
        "ol": 1, "li": 0, ... }
    restored byte-identical: src/lib/ui/FailureBlock.svelte -> true
```

**An empty `<ol class="steps"></ol>` in the DOM** for a state with nothing to list - an empty list a screen reader announces as "list, 0 items". Restored.

## Deviations from Plan

### 1. [Process] Negative check 2 cannot go red on the test the plan names

**Found during:** task 2. **Issue:** the plan says a hex hard-coded into `DeviceMark.svelte` should turn `identity.spec.ts` red "on the hex scan". `identity.spec.ts` scans `src/app.css` and the favicon only, and no shipped spec scans `src/lib/ui/*.svelte` for a hex literal. With the hex in place the spec stayed at 6 passed and the whole ui selection at 36. **Resolution:** the mutation was applied, observed green, and restored byte-identical; the component itself is hex-free (the specifier scan above); no test was added because the plan adds none and `device-ui.spec.ts` is 06-10's. **Deferred item 6** records the exact rule to lift from `browse-ui.spec.ts` and asks 06-10 to re-run this mutation red.

### 2. [Process] `wrangler dev` died twice under Playwright's default eight workers

**Found during:** the final e2e gate. Run 1 (`npm run test:e2e`): 2 passed, 69 failed, `X [ERROR]` from the WebServer seven seconds after start; run 2, same command: 29 passed, 42 failed, the error at +25 s. Both wrangler logs (`wrangler-2026-09-05_04-04-35_749.log`, `wrangler-2026-09-05_04-07-08_123.log`) carry the same cause - `Error in ProxyController: Error inside ProxyWorker … Network connection lost.` - and every failure after it is `ERR_CONNECTION_REFUSED` or a page that lost its server mid-test; not one failure names a spinner, a mark or a block, and the tests that render the changed `PadSpinner` (the session probe, the front door, the skeleton) passed before the crash in both runs. The 06-07 runs three hours earlier left 5-7 KB wrangler logs with no error. **Resolution:** run 3 at `--workers 3`: **71 passed (1.5m)**, zero `X [ERROR]` in the log, no listener or `workerd` left behind. Recorded as **deferred item 7** for whoever next edits `playwright.config.ts`; nothing in this plan's files touches the worker, a route or the build shape.

### 3. [Process] The served build was measured without invoking wrangler directly

The standing rules forbid running `wrangler` by hand and the plan asks for measurements "on a served build". The build (`npm run build`, with the temporary mount) was served by a 40-line `node:http` static server over `build/` on **127.0.0.1:4174** from the scratchpad, driven by a scratch Playwright spec that imports `FAKE_SERIAL` from `e2e/fake-serial.ts` by absolute path. Port 4173 was never used for it and the server was killed by PID afterwards. The e2e suite itself still ran through Playwright's own `webServer` (`npm run preview`), as every plan before it did.

### 4. [Process] Negatives 1 and 3 shared one mutated build

Both need a rebuild and a browser, and neither can mask the other (one is a 24px box on `/c/aurora/`, the other an empty `<ol>` on `/dev/session/`), so one build carried both mutations and the spec read both. Each restore is reported separately above.

### 5. [Process] `test-results/` again, and a stale scratchpad spec

Removed by hand four times (after the first measurement run, after the three suite runs). Deferred item 5 stands. The first measurement run also collected a stale `pwprobe/probe.e2e.ts` left in the scratchpad by an earlier session; it passed, proved nothing, and every later run named `measure.e2e.ts` explicitly. Scratchpad only; nothing in the tree.

No Rule 1-4 deviation: no bug, no missing functionality, no blocker, no architectural question.

## Requirements

**`requirements-contributed: [CONN-04, CONN-08]`** - contributed, not completed, on the phase's convention. `FailureBlock` is the one shape CONN-04's recovery will wear and `DeviceMark`'s diagonal is CONN-08's connected shape, but neither is mounted in shipped chrome until 06-10 and 06-12, and the measurements here were taken on a temporary probe mount that no longer exists. None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. Every prop is fed by its mount; the components render nothing hard-coded and hold no placeholder text. `DeviceMark` and `FailureBlock` have **no shipped mount yet** by design (06-10, 06-12), which is a sequencing fact of the plan rather than a stub.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61**; **`PREV_E2E` is 71, measured by 06-07** and unchanged here.
- `PREV_FILES` / `PREV_TESTS` for plan 06-09 are **68 / 715**. svelte-check is at **527 files**.
- `<PadSpinner size={n} decorative />` is the only sanctioned way to put the walk anywhere but the panel; `DeviceMark shape="connecting"` already does it.
- `DeviceMark` exposes `data-shape` beside `data-testid="device-mark"`; `FailureBlock` takes `testid` so two mounts stay distinguishable in one test tree.
- **06-10's `device-ui.spec.ts` must carry a comment-stripped hex scan over the device components** (deferred item 6) and re-run the `#d6ff4e` mutation red; it does not exist anywhere today.
- If the full suite dies at the WebServer with `Network connection lost.`, run it at `--workers 3` before believing anything (deferred item 7).

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/ui/PadSpinner.svelte` - FOUND (modified)
- `src/lib/ui/DeviceMark.svelte` - FOUND (created)
- `src/lib/ui/FailureBlock.svelte` - FOUND (created)
- `.planning/phases/06-device-session/06-08-SUMMARY.md` - FOUND

Files claimed unchanged, verified:

- `src/routes/dev/session/+page.svelte` - sha256 `1a20cc91…` before and after; `git diff --quiet` exit 0
- `src/lib/ui/TryOnDevice.svelte`, `src/lib/ui/CatalogCard.svelte`, `src/app.css` - unchanged against HEAD

Files claimed absent:

- `test-results/` - ABSENT

Commits claimed, verified in `git log`:

- `f3824e7` feat(06-08): PadSpinner gains size and decorative, and changes nothing - FOUND
- `56517f8` feat(06-08): DeviceMark - four shapes at 24px and no new colour - FOUND
- `d526fc4` feat(06-08): FailureBlock - one block, two mounts, one wording - FOUND
