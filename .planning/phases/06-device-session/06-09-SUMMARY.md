---
phase: 06-device-session
plan: 09
subsystem: ui
tags: [session, live-region, coalescer, hold, header-note, sizing-twin, picker-explainer, layout, prerender, CONN-03, SAFE-01]

# Dependency graph
requires:
  - "src/lib/device/session.svelte.ts (06-03, 06-04) — the finished machine; every transition site this plan makes speak"
  - "src/lib/device/session-copy.ts (06-02) — PICKER_EXPLAINER (130), SAFE_PROMISE (126), RECONNECT_OFFER, the three STATUS_* lines, the five LIVE_* sentences, slotStateOf"
  - "src/lib/ui/TryOnDevice.svelte (04-08) — the honesty slot's one-cell-grid sizing-twin pattern, reused verbatim"
  - "src/lib/ui/TuningRegion.svelte (05-10) and BrowseToolbar.svelte (05.1-07) — the two shipped live regions, their sr-only technique and their 500ms trailing setTimeout"
  - "src/lib/config-shape.spec.ts test 13 (06-05) — the five permitted specifiers and +layout.svelte inside the walk"
  - "src/routes/dev/session/+page.svelte and e2e/fake-serial.ts (06-06, 06-07) — the probe and the shim, used only to drive the served build for measurement"
  - "06-UI-SPEC.md § The header note, § The splash, § Motion, Accessibility Contract; 06-CONTEXT D-16, D-17"
  - "06-08-SUMMARY.md — PREV_FILES / PREV_TESTS 68 / 715, PREV_E2E 71, the five-name block, deferred items 5, 6 and 7"
provides:
  - "session.speech, #say and holdSpeech(): the one live region's voice, decided in the store - six #say sites, a 500ms trailing setTimeout, a hold that keeps and replaces, a fold that never speaks"
  - "src/lib/ui/PickerExplainer.svelte: CONN-03's pre-click line as one Body paragraph over PICKER_EXPLAINER, with a testid prop for its two mounts"
  - "src/lib/ui/DeviceNote.svelte: the inline header note, measured at 152px in S1, S2, S3, S4, S5 and S7 at 372px, absent with no reservation in S0a and S0b, panelOwnsProse over both lines the panel can also show"
  - "src/lib/ui/SessionAnnouncer.svelte: the one visually-hidden polite session live region, rendering session.speech and nothing else"
  - "src/routes/+layout.svelte: SessionAnnouncer before {@render children()}, session.start() from onMount"
  - "DeviceSession.start() throws where there is no window, so a module-scope or prerender-time start fails the build instead of prerendering every page as unsupported"
  - "The measured facts: the note's height, the per-route [aria-live] census before and after, the prerendered session-live with empty text"
affects:
  - "06-10 — DeviceSlot beside the note; device-ui.spec.ts's structural gate now has three more device components to cover (PickerExplainer, DeviceNote, SessionAnnouncer)"
  - "06-11 — FrontDoor mounts DeviceNote with covered and calls session.holdSpeech() while the splash covers the row; /browse/ mounts it beneath its header row"
  - "06-12 — TryOnDevice mounts PickerExplainer with its OWN testid and passes panelOwnsProse to the note; removes its connect-status aria-live"
  - "06-13 — re-measures PREV_E2E; owns deferred item 8 (first-experience's pre-hydration key press)"
  - ".planning/STATE.md, .planning/ROADMAP.md — Phase 6 at 9/14"

tech-stack:
  added: []
  patterns:
    - "A live region's WHEN lives in the store and its WHAT is one field: the component renders speech and holds no timer, no memory and no rule, so every edge case is a node test over a plain class field"
    - "Transitions are spoken from one line per KIND, not one per road: both roads to detected go through #offer, both roads to S5 through #publishUnplugged, all eight failure phases through #fail, so the plan's 'exactly six sites' is a grep over the source rather than a promise"
    - "A live region is emptied when an utterance is queued and written when the window closes, so a repeated sentence is still a DOM change; a test counts the non-empty writes and states why the empty ones are the mechanism"
    - "A reservation is a grid of sizing twins measured by the browser, never a pixel asserted in CSS: the spec's arithmetic (3 + 3 line boxes + 8px = 152) is checked against what the browser measured, and the browser is the authority"
    - "A negative check the runtime makes unobservable (Node 21+ has a navigator) is not recorded and left; the missing guard is added (Rule 2), the mutation is re-run red, and the guard's own assertion is folded into an existing test so the plan's count arithmetic holds"

key-files:
  created:
    - "src/lib/ui/PickerExplainer.svelte"
    - "src/lib/ui/DeviceNote.svelte"
    - "src/lib/ui/SessionAnnouncer.svelte"
    - ".planning/phases/06-device-session/06-09-SUMMARY.md"
  modified:
    - "src/lib/device/session.svelte.ts"
    - "src/lib/device/session.spec.ts"
    - "src/routes/+layout.svelte"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "#say is called from exactly six sites by construction: #offer (detected, both roads), #openAdopted (connected), disconnect() (only when a transport was live - a disconnect that disconnected nothing is not a transition), #publishUnplugged (both roads to S5), forget(), and #fail (every failure phase, by its title, with CONNECT_LABEL because titles never interpolate a label)"
  - "#say empties `speech` when it queues a line and #flushSpeech writes it when the window closes, so the same sentence twice in a row (a chooser closed twice) is a DOM change each time; the tests count non-empty writes and the header says why"
  - "holdSpeech() is a boolean, not a counter: a second hold does not stack and a second release is a no-op; a held utterance is REPLACED by a later one, and the release re-queues the trailing window rather than speaking at once"
  - "The note is one grid of two rows 8px apart - the first cell holding every first-line candidate at grid-area 1 / 1, the second the SAFE-01 sentence - because the spec's 152px is 3 + 3 line boxes + 8px, which a single one-cell grid could not produce; the browser measured exactly 152"
  - "aria-hidden on a twin is present-or-absent (`true | undefined`), never `\"false\"` on the visible one"
  - "DeviceSession.start() throws, naming navigator.serial, when called bare (no `serial` in env) with no window: the plan's module-scope negative was UNOBSERVABLE as written because Node 21+ ships a navigator without serial and the prerenderer decided `unsupported` for every page with the build green; with the guard the same mutation fails the build (Rule 2, commit 3471627)"
  - "Task 3's precondition grep named the wrong file: `browse-live` is in BrowseToolbar.svelte:415, which src/routes/browse/+page.svelte mounts; the route and its region both ship, so the per-route count covers all three routes and the task proceeded rather than stopping"

requirements-completed: []
requirements-contributed: [CONN-03, SAFE-01]

# Metrics
duration: 45min
completed: 2026-09-05
---

# Phase 6 Plan 09: PickerExplainer, the reserved header note, and the one session live region Summary

**The three quiet surfaces exist and two of them were measured on a served build. The store speaks: `speech` is a `$state("")`, `#say` is called from exactly six lines of `session.svelte.ts` (477 detected, 524 unplugged, 657 connected, 856 every failure by title, 911 disconnected, 940 forgotten) and from nowhere else, a 500ms trailing `setTimeout` makes three transitions in one window one utterance - the last one - and a fold that changes the active page republishes the identity and says nothing; `holdSpeech()` keeps the pending line, replaces it with a later one, and speaks once on release. `PickerExplainer` is one paragraph over the 130-character line. `DeviceNote` is a two-row grid of sizing twins that the browser measured at **152px in S1, S2, S3, S4, S5 and S7** at 372px wide - the spec's 3 + 3 line boxes + 8px arithmetic exactly - flush with its container's right edge, with zero notes and zero reserved height in `unsupported` and `insecure`; with a panel owning the prose, neither the pre-click line (S1) nor the status line (S3) is visible in the note and its height is still 152. `SessionAnnouncer` renders `session.speech` and nothing else, mounted once in the layout before the page: every prerendered document carries exactly one `session-live` with empty text, and the hydrated `[aria-live]` census went `/` 1 → 2, `/c/aurora/` 1 → 2, `/browse/` 2 → 3. Five negatives observed red and restored byte-identical; a sixth - `session.start()` at module scope failing the build - was UNOBSERVABLE as planned because Node 24 has a `navigator` without `serial` and the build stayed green while prerendering every page as `unsupported`, so `start()` now throws where there is no window (Rule 2) and the same mutation fails the build naming `navigator.serial`. Quick 68 / 717 (+2), sweep `3 13`, e2e 71 with webkit-phone 9 at `--workers 3`, svelte-check 530 files.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` as re-measured by **06-07**; this plan adds no e2e test and moves nothing there.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` — the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13                |

### Observed totals: previous SUMMARY plus this plan's delta

06-08 left the tree at **68 files / 715 tests**. This plan adds **+0 files / +2 tests** - `session.spec.ts` 15 → 17 - so quick stands at **68 / 717**, `BASE_FILES + 2` and `BASE_TESTS + 26`. Sweep is unchanged at **`3 13`**. E2E is **71 + 0 = 71**, nine on webkit-phone, unchanged.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 68 717
  check-counts: observed 68 files, 717 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  counted 1296 combinations in 2.6s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npx playwright test --workers 3 2>&1 | tee .tmp-e2e/06-09-suite-w3.log | node scripts/check-counts.mjs --playwright 71
  check-counts: observed 71 tests passed
  check-counts: matches the expected counts
  71 passed (1.4m)                                                  9 results on [webkit-phone]

npx playwright test --list                                       -> Total: 71 tests in 11 files
npx playwright test --project webkit-phone --list                -> Total: 9 tests in 3 files
npx playwright test e2e/session.e2e.ts --project chromium --list -> Total: 9 tests in 1 file

npx vitest run --project server src/lib/device/ src/lib/ui/ src/lib/config-shape.spec.ts
  Test Files  8 passed (8)      Tests  66 passed (66)
  session.spec.ts 17 · config-shape.spec.ts 14 · identity.spec.ts 6

npm run check 2>&1 | grep -Ei "error|warning"
  1788583474169 COMPLETED 530 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` moves from **527 to 530 files**: the three new components. The e2e figure is the **third** run tonight: run 1 (`npm run test:e2e`, eight workers) was **70 passed, 1 failed** - `first-experience.e2e.ts:156` "a still configuration really is still", a pre-hydration key-press race that re-ran green (11 passed on the file) and is deferred item 8; run 2 (eight workers) was **27 passed, 44 failed**, every failure after the twenty-eighth result a 500 or `ERR_CONNECTION_REFUSED`, the wrangler log carrying `Error in ProxyController: Error inside ProxyWorker … Network connection lost.` - deferred item 7's harness death, not a test; run 3 at `--workers 3` was 71 with a clean wrangler log. After every run: **no LISTENING socket on 4173 or 4174 and no `workerd.exe` or `wrangler` process**; `test-results/` removed by hand three times (deferred item 5).

## Task 1 — the store learns to speak, once, on a trailing timer (commit `0a2582e`)

### The surface

`speech = $state("")`, written only by `#flushSpeech`. `#say(line)` stores the line as `#pending`, empties `speech`, and (re)starts one `setTimeout` of `SPEECH_WINDOW_MS = 500`; `#flushSpeech` clears the timer, returns at once if `#held`, otherwise moves `#pending` into `speech`. `holdSpeech()` sets a boolean and returns an idempotent release that clears it and re-queues the window if a line is pending. No interval anywhere: the comment-stripped needle in test 15 (`set` + `Interval`) is green, and the one raw `grep setInterval` hit in `src/lib/device/` is 06-04's pre-existing watchdog comment ("never setInterval").

### The six sites, by line (at `3471627`)

| Line | Site                | Sentence                                                              |
| ---- | ------------------- | --------------------------------------------------------------------- |
| 477  | `#offer`            | `LIVE_DETECTED` - both roads: the granted port at start(), the cable  |
| 524  | `#publishUnplugged` | `LIVE_UNPLUGGED` - both roads: the event or the watchdog, and the transport's close net |
| 657  | `#openAdopted`      | `liveConnected(fw, page)` from the identity as identified, once       |
| 856  | `#fail`             | the failure's title - all eight failure phases land here              |
| 911  | `disconnect()`      | `LIVE_DISCONNECTED`, only when a transport was live                   |
| 940  | `forget()`          | `LIVE_FORGOTTEN`                                                      |

`this.#say(` occurs **6** times in the comment-stripped source. The roads were folded rather than the sites duplicated: `#onSerialConnect` and `#offerGranted` both call `#offer`; `#unplugged` and `#onTransportClosed` both call `#publishUnplugged`; `#refuse`'s five phase assignments and `#openAdopted`'s two refusals all go through `#fail(phase)`, whose title comes from `failureFor(CONNECT_LABEL)` - titles never interpolate a label, so the surface does not matter. `#publish` (the fold), `#armWatchdog` and `#onSerialDisconnect`'s detected-to-idle branch call nothing.

### Tests 16 and 17

`recordSpeech(s)` replaces the plain `speech` field on one instance with an accessor and logs every NON-EMPTY write; the header explains that the empty write is the mechanism and why it is filtered.

**16. three transitions in one window are one utterance, the last one, and a fold is none** - fake `setTimeout`/`clearTimeout` only; detected, connected (a pushable transport with one heartbeat), unplugged, with no timer tick between them: `speech` is `""` and the log empty; at 499ms still empty; at 500ms exactly `[LIVE_UNPLUGGED]`; 2000ms more, still one. Then a replug and a reconnect coalesce to `[LIVE_UNPLUGGED, liveConnected(FIRMWARE, ACTIVE_PAGE)]`. Then a heartbeat that changes the active page (asserted: `identity.activePage` moved to `ACTIVE_PAGE + 2`) and one that changes only `lastSeen`, 2000ms of timer: the log and `speech` unchanged. Then `disconnect()` of the live session: a third entry, `LIVE_DISCONNECTED`, on the same window. Zero writes on both transports.

**17. holds every announcement until released, replaces a held one, and speaks once on release** - `holdSpeech()` BEFORE `start()` (the front door's order); detected, 2000ms: silent. `connect()` to `connected` while held, 2000ms: still silent. `release()`: nothing at once; 500ms later exactly `[liveConnected(…)]` - the connected sentence and never `LIVE_DETECTED`. A second `release()` and 2000ms: unchanged. A fresh hold and release with no transition: unchanged.

### The three negatives, each red on the intended assertion and restored byte-identical

```
=== NEGATIVE 1: #say from the fold's republish path - test 16 must go red
    replace "this.identity = { ...next, otherModules: others };"
    with    "this.identity = { ...next, otherModules: others }; this.#say(LIVE_DETECTED);"
AssertionError: a heartbeat spoke: expected [ …(3) ] to deeply equal [ …(2) ]
      Tests  1 failed | 16 passed (17)        restored byte-identical: true

=== NEGATIVE 2: speak immediately instead of on the trailing timer - test 16 must go red
    replace 'this.speech = "";'  with  'this.speech = line; return;'
AssertionError: spoken before the trailing window closed: expected 'The ZONA was unplugged. Nothing was w…' to be ''
AssertionError: spoken while held: expected 'ZONA detected. One click connects it.' to be ''
      Tests  2 failed | 15 passed (17)        restored byte-identical: true

=== NEGATIVE 3: drop the hold check - test 17 must go red
    replace "if (this.#held) return;"  with  ""
AssertionError: spoken while held: expected 'ZONA detected. One click connects it.' to be ''
      Tests  1 failed | 16 passed (17)        restored byte-identical: true
```

Negative 2 also took test 17 red, because speaking at once ignores the hold as well; test 16's coalescing half is the assertion named in its message. `npx vitest run --project server src/lib/device/session.spec.ts` after each: **17 passed**.

## Task 2 — PickerExplainer and DeviceNote, the reserved region, measured (commit `c3465af`)

### The imports, quoted

```svelte
<!-- PickerExplainer.svelte -->
import { PICKER_EXPLAINER } from "$lib/device/session-copy";

<!-- DeviceNote.svelte -->
import { session } from "$lib/device/session.svelte";
import { RECONNECT_OFFER, SAFE_PROMISE, STATUS_CHOOSING, STATUS_IDENTIFYING, STATUS_OPENING, slotStateOf } from "$lib/device/session-copy";
import PickerExplainer from "./PickerExplainer.svelte";
```

Neither file retypes a sentence; the comment-stripped scan of both: specifiers as above only, `hex: []`, no `aria-live`, no `setInterval`, no `--color-over`, no heading, no control. `config-shape.spec.ts` test 13 walks `src/lib/ui/` whole and stayed at 14 with both files in it; `tune-ui.spec.ts`'s `--color-over` sweep over every component stayed green.

### The shape

`DeviceNote` reads `slotStateOf(session.phase)`. Outside S0a/S0b it renders a `display: grid` of two rows with `row-gap: 8px` at `inline-size: min(372px, 100%)`, `margin-inline-start: auto`, `text-align: start`. The first row is a one-cell grid (`.cell > .line { grid-area: 1 / 1 }`) holding five candidates - the `PickerExplainer` (in a wrapper `div.line`, so its own interface stays `{ testid }`), `RECONNECT_OFFER`, and the three status lines; the second row is `SAFE_PROMISE`. Every non-current candidate is `.twin` (`visibility: hidden; opacity: 0`) with `aria-hidden="true"`; the visible one carries no `aria-hidden` attribute at all. `data-slot` and `data-line` (`explainer | offer | choosing | opening | identifying | none`) sit on the region so a test reads the current line without inferring it from visibility. `panelOwnsProse` turns the S1/S7 explainer and the S3 status line into twins. `.covered` is the wordmark's declaration verbatim (`opacity: 0; transition: none`), with the rise on `var(--arrive-ms, 700ms)` and the reduced-motion fallback 200ms. Line changes: `opacity 160ms ease-out`, the twin's `visibility` flipping after its fade; `transition: none` under reduced motion.

### The measurement, on the served build

The served build (`npm run build` with the temporary mount described below) was served by the scratch `node:http` static server over `build/` on **127.0.0.1:4174** - never `wrangler` by hand, as 06-08 did - and driven by a scratch Playwright spec importing `FAKE_SERIAL` from `e2e/fake-serial.ts` by absolute path, at the Desktop Chrome 1280x720 viewport, on `/dev/session/`. Two notes were mounted side by side: **A** (`<DeviceNote />`) and **B** (`<DeviceNote panelOwnsProse />`), B beside a stand-in for the panel's prose that renders `PickerExplainer` in S1/S7 and the session's status line in S3 - what 06-12's panel will render. A marker paragraph sat under each.

| State            | driven by                              | A height | A `data-line` | A visible text                 | B height | B `data-line` | B visible text |
| ---------------- | -------------------------------------- | -------- | ------------- | ------------------------------ | -------- | ------------- | -------------- |
| S1 `idle`        | shim, nothing granted                  | **152**  | `explainer`   | PICKER_EXPLAINER, SAFE_PROMISE | **152**  | `none`        | SAFE_PROMISE   |
| S2 `detected`    | `replug()`                             | **152**  | `offer`       | RECONNECT_OFFER, SAFE_PROMISE  | **152**  | `offer`       | RECONNECT_OFFER, SAFE_PROMISE |
| S3 `identifying` | click, nothing fed (1500ms window)     | **152**  | `identifying` | STATUS_IDENTIFYING             | **152**  | `none`        | (nothing)      |
| S4 `connected`   | the capture fed until connected        | **152**  | `none`        | (nothing)                      | **152**  | `none`        | (nothing)      |
| S5 `unplugged`   | `unplug(0)`                            | **152**  | `none`        | (nothing)                      | **152**  | `none`        | (nothing)      |
| S7 `forgotten`   | the forget button                      | **152**  | `explainer`   | PICKER_EXPLAINER, SAFE_PROMISE | **152**  | `none`        | SAFE_PROMISE   |

In every row: width **372**, the note's right edge at its container's right edge (600 = 600), the first cell **72** and the SAFE cell **72** high, `ariaLive: 0`, `tabStops: 0`. **The three heights the plan asks for - S1, S2, S3 - are identical, and so are the other three: 152 in all six.** 06-UI-SPEC's arithmetic says 152 at the 372px column; the browser says 152. The spec's figure was arithmetic and the browser agreed with it to the pixel. The marker beneath note A sat exactly **152px below the note's top in every state** (`GAP A [152,152,152,152,152,152]`); its absolute position moved between S2 and S3 only because the probe's own `<dl>` readout above the notes changes height with the failure block, which is the probe's business and not the note's.

**Absent in both capability states, with no reserved space:**

```
ABSENT unsupported {"notes":0,"wrapAHeight":0,"wrapBNoteHeight":0}      (Navigator.prototype.serial deleted; "serial" in navigator === false)
ABSENT insecure    {"hasSerial":true,"secure":false,"notes":0,"wrapAHeight":0}
```

The prerendered `build/dev/session/index.html` carried both notes at `data-slot="S1"` - `starting` renders as S1 - so the static file ships the note and hydration removed it once on those two browsers.

**The never-both rule, four observations (the panel side is a stand-in, since 06-12's panel does not exist yet):** in S1 note B's `data-line` is `none`, its visible text is the SAFE-01 sentence alone, its height 152, and the pre-click sentence is visible exactly **once** in B plus the stand-in (the stand-in's); in S3 note B's `data-line` is `none`, nothing in it is visible, its height 152, and `Listening for the module…` is visible exactly **once** (the stand-in's). `writes()` was 0 at the end of the run.

### The two negatives, one mutated build, both observed and restored

Both mutations were applied to `DeviceNote.svelte` by a scratch script (`apply-neg.mjs`: original saved, both replacements applied, restore reported by sha256), one build carried both, and the same spec read both - they cannot mask each other (one is a height, the other a count on note B in S3).

**1. Drop the sizing twins** - `.twin { opacity: 0; visibility: hidden; …` replaced by `.twin { display: none; …`, so only the current string takes up room:

```
HEIGHTS A [152,128,24,0,0,152]     (was [152,152,152,152,152,152])
GAP A     [152,128,24,0,0,152]     the marker under the note moved UP by 24px into S2, by 128px into S3, by 152px in S4 and S5
HEIGHTS B [80,128,24,0,0,80]       note B in S1 collapsed to the SAFE sentence plus the gap
```

The content below the note **moved by 128px between S1 and S3** and by 152px into S4 - the coverflow's jump, on the probe.

**2. Ignore `panelOwnsProse` for the S3 line only** - `if (panelOwnsProse) return "none";` removed from the S3 branch:

```
NOTE S3-identifying  b: {"line":"identifying","visible":["Listening for the module…"], ...}   panelVisible: ["Listening for the module…"]
NEVER-BOTH status-in-S3: note B + panel visible count = 2 (panel alone: 1)      (was 1)
NEVER-BOTH explainer-in-S1: note B + panel visible count = 1                    (unchanged: the S1 line was left honest)
```

The sentence **`Listening for the module…` was on screen twice** - once in the note, once in the panel stand-in - which is the double-reading Y-11 exists to prevent. (The first pass at this observation used a visibility filter that `display: none` does not trip; it was corrected to require a client rect and the mutated build was run again - deviation 6.)

```
restored byte-identical: true
restored sha256 55d9e1603ada6fd65d27d3731e9c11b6dc68008cd1dc4fb94ab09ce96c5544d8   (== the sha256 before the mutation)
```

### The temporary probe mount, proven gone

`src/routes/dev/session/+page.svelte` carried, for the measurement only, two imports, two consts, the two notes, the stand-in and two markers. Hashed before and restored from HEAD with `git show HEAD:… > …` (never `git checkout` or `restore`):

```
probe sha256 before  1a20cc9139d9f8aa1388c56d4c8fd26c0ec55390b6b653391d09a94ef198ed11
probe sha256 after   1a20cc9139d9f8aa1388c56d4c8fd26c0ec55390b6b653391d09a94ef198ed11
git diff --quiet -- src/routes/dev/session/+page.svelte   -> exit 0
```

The mount is in none of this plan's commits, and the probe page is not in `key-files`.

## Task 3 — one live region, mounted once, and the session started once (commit `17887b4`, and `3471627`)

### The precondition, quoted

```
$ ls src/routes/browse/+page.svelte
src/routes/browse/+page.svelte
$ grep -n "browse-live" src/routes/browse/+page.svelte
(no output)
$ grep -n "browse-live" src/lib/ui/BrowseToolbar.svelte
415:    data-testid="browse-live"
$ grep -c "BrowseToolbar" src/routes/browse/+page.svelte
2
```

The route exists and carries the region - through the toolbar component it mounts, which is where Phase 5.1 put it (`browse-ui.spec.ts` asserts `1 in BrowseToolbar.svelte`). The plan's grep named the page rather than the toolbar. The value the stop protects - that the per-route count covers every route a visitor can reach - holds, so the task proceeded (deviation 2).

### The announcer and the layout

`SessionAnnouncer.svelte` is the interfaces block's six lines, `sr-only`, `data-testid="session-live"`, `aria-live="polite" aria-atomic="true"`, rendering `{session.speech}`; its header says plainly that there is no cross-region scheduler and none is built - document order plus the store's timer is the whole mechanism. `+layout.svelte` mounts it before `{@render children()}` and calls `session.start()` from `onMount`, with the reason in a comment. The layout's comment-stripped static specifiers are `svelte`, `$lib/assets/favicon.svg`, `$lib/device/session.svelte`, `$lib/ui/SessionAnnouncer.svelte`; the first of the two new ones is the permitted path and the second carries no marker, and **`config-shape.spec.ts` reports 14 passed** with the layout inside the walk.

### The per-route census, before and after

Counted in a hydrated Chromium page on the served build (before: the `2441046` build, source-identical to `b3a87c1`; after: the `17887b4` build), `document.querySelectorAll("[aria-live]")`, elements named:

| Route         | before | elements before                    | after | elements after                                        | `session-live` |
| ------------- | ------ | ---------------------------------- | ----- | ----------------------------------------------------- | -------------- |
| `/`           | **1**  | `#svelte-announcer`                | **2** | `session-live`, `#svelte-announcer`                   | 1              |
| `/c/aurora/`  | **1**  | `#svelte-announcer`                | **2** | `session-live`, `#svelte-announcer`                   | 1              |
| `/browse/`    | **2**  | `browse-live`, `#svelte-announcer` | **3** | `session-live`, `browse-live`, `#svelte-announcer`    | 1              |

Plus one on every route, exactly one `session-live` on each, and it is the first `[aria-live]` in document order on all three. Kit's `#svelte-announcer` is the extra element every hydrated page carries and is not ours. The tuning region is not in these counts because no panel was open.

### The prerendered HTML

```
build/index.html            count 1  class="sr-only" data-testid="session-live" aria-live="polite" aria-atomic="true" | text=""
build/c/aurora/index.html   count 1  ... | text=""
build/browse/index.html     count 1  ... | text=""
build/dev/session/index.html count 1 ... | text=""
```

Nothing is announced from a static file. `npm run build` succeeded (`postbuild: 17887b4… - LICENSE, THIRD-PARTY.md and licenses/ copied into build/`).

### The negative, as planned - and not observable as planned

`onMount(() => {` in the layout replaced by `((run: () => void) => run())(() => {`, so `session.start()` runs in the instance script the prerenderer executes:

```
    build exit code: 0
    | postbuild: 17887b47e734589bad5a1a26cada0ac5042b81c6 - LICENSE, THIRD-PARTY.md and licenses/ copied into build/ ...
    prerendered probe: phase="unsupported" device-note=0 session-live=1
    restored byte-identical: true
```

**The build was green.** `node --version` is v24.14.0 and `typeof navigator` in Node is `object` - Node 21 and later ship a global `navigator` (without `serial`) - so `start()`'s `typeof navigator !== "undefined" && "serial" in navigator` read `false`, `capabilityOf` returned `unsupported`, and every prerendered page shipped the S0a slot state with no header note and the build none the wiser. The plan's expected failure "naming `navigator`" cannot happen on this Node. That is a missing guard, not a fact to record and leave (Rule 2, deviation 1): `start()` now throws when called bare (no `serial` in `env`) with no `window`, before `#started` is set, and test 1 asserts it (`expect(() => bare.start()).toThrow(/navigator/)`, phase still `starting`). The same mutation, with the guard (commit `3471627`):

```
    build exit code: 1
    | Error: DeviceSession.start() ran where there is no window - at module scope, or in the prerenderer - so navigator.serial can never be read here. Call it from onMount.
    | Error: 500 /
    |     at handleHttpError (.../vite.config.ts...)
    |     at .../@sveltejs/kit/src/core/postbuild/prerender.js:80:25
    restored byte-identical: true
```

**Red, naming `navigator.serial`, and restored.** `session.spec.ts` stays at **17** (the assertion joined test 1 rather than becoming an eighteenth); `npm run build` on the restored tree succeeded and is the build the e2e suite ran against.

## Deviations from Plan

### 1. [Rule 2 - Missing critical functionality] `start()` refuses to run where there is no window

**Found during:** task 3's negative check. **Issue:** the plan expects a module-scope `session.start()` to fail `npm run build` naming `navigator`. On Node 24 the prerenderer has a `navigator` object without `serial`, so the bare call silently decided `unsupported` and the build passed with every page prerendered in S0a - no note, the capability slot, nothing failing. **Fix:** `start()` throws `DeviceSession.start() ran where there is no window - … navigator.serial can never be read here. Call it from onMount.` when `env.serial === undefined && typeof window === "undefined"`, before `#started` is set; tests pass an explicit environment and never reach it; test 1 gained the bare-call assertion. The mutation was re-run and observed red. **Files:** `src/lib/device/session.svelte.ts`, `src/lib/device/session.spec.ts`. **Commit:** `3471627`.

### 2. [Process] The precondition grep named the page; the region is in the toolbar the page mounts

`grep -n "browse-live" src/routes/browse/+page.svelte` prints nothing because Phase 5.1 put the region in `BrowseToolbar.svelte:415`, which `+page.svelte` mounts. The route ships and its region ships, which is what the stop exists to guarantee, so the task proceeded and the per-route table above has all three rows. Quoted in full under task 3.

### 3. [Process] The never-both rule's panel side is a stand-in

The plan measures "with a panel open on `/c/aurora/`"; the note is not mounted on any route until 06-11 and the panel does not render the session's prose until 06-12. The panel side was a probe stand-in fed from the same session (the explainer in S1/S7, the status line in S3), and the plan's own parenthesis - "what is asserted here is that the note yields and does not shrink" - is what was asserted. All four observations are in the table.

### 4. [Process] One e2e flake, and it is a pre-hydration race in a front-door test

Run 1's single failure was `first-experience.e2e.ts:156` "a still configuration really is still": two `ArrowRight` presses moved the band one step, and the band read `data-ready="false"` for the first four polls. The test asserts attributes the prerendered document already satisfies and then presses keys with no hydration marker and without the file's own `waitForFrontDoor()`, whose comment describes this race against the splash's window-level `keydown` skip (`Splash.svelte:209`). The file re-ran **11 passed**; the `--workers 3` suite passed it. This plan widens that window slightly and by design - the layout now carries the session's chunk (6,987 bytes) before hydration on every route, the permitted import 06-05 allow-listed - so it is recorded as **deferred item 8** for 06-13 rather than glossed as noise. `e2e/first-experience.e2e.ts` is not in this plan's files and was not edited.

### 5. [Process] `wrangler dev` died once more under eight workers

Run 2: 28 `ok` results in order, then 500s and 30 `ERR_CONNECTION_REFUSED`; the wrangler log (`wrangler-2026-09-05_04-52-52_598.log`) carries `Error in ProxyController: Error inside ProxyWorker … Network connection lost.` after a mid-run worker reload. Deferred item 7 stands; run 3 at `--workers 3` was 71 with a clean log.

### 6. [Process] The first measurement filter did not see `display: none`

The scratch spec's "visible text" filter checked computed `visibility` and `opacity`, which the first negative's `display: none` leaves untouched, so the mutated build's never-both count listed every twin as visible. The filter was corrected to require a client rect, the mutated build was rebuilt and run again, and the good build was re-measured with the same filter; only the corrected numbers are reported above. The N1 heights were unaffected either way.

### 7. [Process] The served build was measured without invoking wrangler directly

As 06-08: a scratch `node:http` static server over `build/` on 127.0.0.1:4174, killed by PID afterwards (`taskkill`), with the e2e suite itself run through Playwright's own `webServer`.

### 8. [Process] `test-results/` again, and the scratch runners

Removed by hand three times. The runners were `mutate-cmd.mjs` (06-06's) for the three vitest negatives, `apply-neg.mjs` for the two-mutation build, `neg-layout.mjs` for the layout's, and `live-count.e2e.ts` / `measure.e2e.ts` for the census and the note; all scratchpad, nothing in the tree.

## Requirements

**`requirements-contributed: [CONN-03, SAFE-01]`** - contributed, not completed, on the phase's convention. The pre-click explanation and the SAFE-01 sentence are components with a measured reservation and the live region speaks from the layout, but `DeviceNote` has no shipped mount until 06-11 and `PickerExplainer`'s panel mount is 06-12's; SAFE-01 is Phase 7's requirement. None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. `SessionAnnouncer` renders a live field; `DeviceNote` renders live session state and session-copy's strings; `PickerExplainer` renders one constant. `DeviceNote` and `PickerExplainer` have **no shipped mount yet** by design (06-11, 06-12), a sequencing fact rather than a stub.

## What the next plan inherits

- The five-name block above, **verbatim, all five**. `BASE_E2E` is **61**; **`PREV_E2E` is 71, measured by 06-07** and unchanged here.
- `PREV_FILES` / `PREV_TESTS` for plan 06-10 are **68 / 717**. svelte-check is at **530 files**.
- `session.speech` is the region's text; `session.holdSpeech()` returns the release. 06-11's FrontDoor should hold at init (before the layout's `onMount` starts the session - the hold is a boolean the store honours whenever `start()` runs) and release from the splash's `onfinished`; a `detected` found during the opening is then spoken once, 500ms after the splash clears.
- `DeviceNote` props: `covered`, `panelOwnsProse`. Testids `device-note`, `device-note-line` (the first cell), `device-note-safe`; `data-slot` and `data-line` on the region. It is `min(372px, 100%)` wide with `margin-inline-start: auto`; the mounting row decides whose right edge it is flush with. Its arrive transition reads `--arrive-ms` from the front door when present.
- `PickerExplainer`'s default testid is `picker-explainer`, and the note's twin is ALWAYS in the DOM (hidden). **06-12's panel mount must pass its own `testid`**, or a selector for the panel's copy will match two elements.
- `disconnect()` speaks only when a transport was live; `#fail` speaks every failure by title; nothing else in the store speaks. A new transition needs a new `#say` site and the count in the header moves from six.
- `start()` throws where there is no window. No component may call it at init or in a `$derived`; `onMount` only.
- Every device component may still name statically only the five permitted paths; the three new ones name `$lib/device/session.svelte`, `$lib/device/session-copy` and each other.
- Run the full e2e at `--workers 3` (deferred item 7); if `first-experience.e2e.ts:156` fails alone, it is deferred item 8.

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/ui/PickerExplainer.svelte` - FOUND (created)
- `src/lib/ui/DeviceNote.svelte` - FOUND (created)
- `src/lib/ui/SessionAnnouncer.svelte` - FOUND (created)
- `src/lib/device/session.svelte.ts`, `src/lib/device/session.spec.ts`, `src/routes/+layout.svelte` - FOUND (modified)
- `.planning/phases/06-device-session/06-09-SUMMARY.md` - FOUND

Files claimed unchanged, verified:

- `src/routes/dev/session/+page.svelte` - sha256 `1a20cc91…` before and after; `git diff --quiet` exit 0
- `src/lib/ui/TryOnDevice.svelte`, `src/lib/ui/TuningRegion.svelte`, `src/lib/ui/BrowseToolbar.svelte`, `src/app.css`, `e2e/first-experience.e2e.ts`, `playwright.config.ts` - unchanged against `b3a87c1`

Files claimed absent:

- `test-results/` - ABSENT

Commits claimed, verified in `git log`:

- `0a2582e` feat(06-09): the store learns to speak, once, on a trailing timer - FOUND
- `c3465af` feat(06-09): PickerExplainer and DeviceNote - the reserved region, measured - FOUND
- `17887b4` feat(06-09): one live region, mounted once, and the session started once - FOUND
- `3471627` fix(06-09): start() refuses to run where there is no window - FOUND
