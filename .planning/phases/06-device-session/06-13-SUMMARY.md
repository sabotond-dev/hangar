---
phase: 06-device-session
plan: 13
subsystem: e2e
tags: [session-e2e, shipped-chrome, device-slot, device-details, client-router-walk, reload, degrade-order, data-hydrated, live-regions, one-voice, focus-return, webkit-phone, CONN-06, CONN-07, SAFE-01]

# Dependency graph
requires:
  - "e2e/fake-serial.ts (06-06) - the shim: grant(), busy(i), feed(), requests(), openCount(i), writes(); the only port any test talks to"
  - "e2e/session.e2e.ts at 9 (06-06, 06-07) - the probe tests, the capture read in Node, identifyWith, grantBeforeLoad, collectErrors"
  - "src/lib/ui/DeviceSlot.svelte and DeviceDetails.svelte (06-10, 06-11) - data-slot, data-hydrated, aria-expanded in four states, the S6 auto-open into the container"
  - "src/lib/ui/DeviceNote.svelte (06-09) - the note that is absent in S0a/S0b and present in the prerendered document"
  - "src/lib/ui/TryOnDevice.svelte (06-12) - connect-status with no aria-live; PickerExplainer as try-on-explainer"
  - "src/lib/ui/SessionAnnouncer.svelte, TuningRegion.svelte, BrowseToolbar.svelte - the three live regions (D-17)"
  - "src/lib/device/session-copy.ts (06-02) - CAPTION_*, CONNECT/CONNECTING/DISCONNECT/FORGET labels, identitySentence, liveConnected, LIVE_DETECTED"
  - "06-UI-SPEC.md (the nine slot states, Opening and closing, Accessibility Contract); 06-12-SUMMARY.md - PREV_FILES/PREV_TESTS 69/724, PREV_E2E 71, the five-name block, deferred items 4, 5, 7, 8, 9, 10"
provides:
  - "e2e/session.e2e.ts at 14: nine probe tests and five on the shipped chrome - the header shows the module (10), one connection survives a four-hop client-router walk and a reload lands the offer (11), a header-raised failure opens its recovery with focus in it and Escape returns it (12), the degrade header on both engines asserted in the plan's order (13, @webkit), one session transition announced once with the other two regions quiet (14)"
  - "identifyWith(page, index, mark) reading the probe's text or the header's data-slot; labelWords folding the identity label's non-breaking spaces; recordLiveRegions / liveTexts / utterances over the three regions"
  - "src/lib/ui/DeviceDetails.svelte `opener` prop and src/lib/ui/DeviceSlot.svelte bind:this - focus returns to the slot after an auto-opened S6 drawer closes (Rule 1 fix, observed red before)"
  - "PREV_E2E re-measured: 77 (= BASE_E2E 61 + 16, the number 06-14 asserts)"
affects:
  - "06-14 - the phase gate at BASE_E2E + 16 = 77, already observed here; SESSION-RUNBOOK; docs/TESTING.md re-measured; deferred item 8's owner by default"
  - "07 - retires the panel's promise literals; may rule on deferred item 10"
  - ".planning/STATE.md, .planning/ROADMAP.md - Phase 6 at 13/14"

tech-stack:
  added: []
  patterns:
    - "A shipped-chrome browser test waits on published state (data-slot, data-hydrated, data-ready, aria-busy) and reads prose only once that state is current; the prerendered document already ships a slot and a note, so a text or count assertion taken before a hydration-only marker can pass for reasons unrelated to the claim"
    - "A property that must survive navigation is proven by a client-router walk of the site's own links with a stamp on the document, never by goto; the same test then reloads and asserts the offer rather than the connection, so a leak across reloads cannot read as a feature"
    - "A disclosure that opens itself records the element to return focus to at open, and on a road through a disabled phase that element is the body: the opener is passed explicitly and used as the fallback"
    - "One voice is asserted with a MutationObserver per live region recording every text change, plus a page-wide count of [aria-live] elements carrying the sentence - the second is what turns a re-added aria-live into a red test"

key-files:
  created:
    - ".planning/phases/06-device-session/06-13-SUMMARY.md"
  modified:
    - "e2e/session.e2e.ts"
    - "src/lib/ui/DeviceDetails.svelte"
    - "src/lib/ui/DeviceSlot.svelte"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The plan's 'no source file is edited' rule yielded to its own acceptance criterion: test 12 requires Escape to return focus to the slot, the shipped drawer returned it to the body on the road through S3's `disabled`, and the fix (an `opener` prop with a body fallback) is a Rule 1 correction of a focus-orphaning defect the plan's test exists to catch - recorded as deviation 1"
  - "Test 11's way home runs through BACK TO BROWSE and the browse page's wordmark link: on /c/{id}/ the wordmark is Phase 4's non-focusable heading, not a link, and the plan's 'back to / through the wordmark link' is satisfied by the one wordmark on the site that is a link"
  - "Tests 12 and 14 run on /c/aurora/ rather than /: the plan fixes no route for them, a deep link has no splash to cover the header or hold the announcer, and the panel with its knobs is on that route; tests 10, 11 and 13 stay on /"
  - "Test 14 makes the tuning region speak with a rail step followed by RESET ALL, because a plain in-budget knob turn is silent by Phase 5's contract (only a command or a budget crossing announces); recorded as deviation 3 rather than asserted against a region that would never speak"
  - "The ordering negative is recorded as a false green in the shape 06-05's mutation 1 set: with the two waits deleted and the entry chunk held two seconds, the auto-waiting count-0 assertion began on a document reading hydrated null and one note, and passed 1870 ms later"

requirements-completed: []
requirements-contributed: [CONN-06, CONN-07, SAFE-01]

# Metrics
duration: 30min
completed: 2026-09-05
---

# Phase 6 Plan 13: The shipped chrome in two engines, and the connection that survives a walk Summary

**The same nine states, on the site a visitor actually opens. `e2e/session.e2e.ts` goes from 9 to **14**: five browser tests drive the REAL header through the fake serial on `/`, `/browse/` and `/c/aurora/`, waiting on the slot's `data-slot` and `data-hydrated` rather than on prose. The header offers `ZONA detected` over `CONNECT ZONA` with the port unopened, connects in **3 rx chunks** to `ZONA · fw 1.5.5 · page 3` with the accessible name `ZONA fw 1.5.5 page 3` (the label, never the caption, never a middle dot), and its drawer holds the identity sentence, `DISCONNECT ZONA` and `FORGET THIS ZONA`. One connection survived a **four-hop client-router walk** - `/` -> BROWSE ALL -> `/browse/` -> a card -> `/c/aurora/` -> BACK TO BROWSE -> `/browse/` -> the wordmark link -> `/` - with the same stamped document, S4 on every route, zero picker requests and one open; a **reload landed the session in `detected` (S2)**, never `connected`. A busy adopted port clicked from the header opened the drawer by itself with focus in the container and the six Grid Editor steps in order, the slot carried no `aria-expanded`, and Escape handed focus back to the slot - which needed a **Rule 1 fix**: the S6 road passes through S3's `disabled`, the browser blurs the slot, and `DeviceDetails` recorded the body as the element to return to (observed red, `Received: inactive`; green after an `opener` prop). On the engine that cannot install, the header was asserted **in the plan's order** on both projects - slot, `data-hydrated`, the settled `Not in this browser`, the disclosure naming Chrome, Edge and Firefox 151 with no button and no `Chromium`, `device-note` count **0** as a snapshot, the panel's same reason - and the ordering negative was observed as a **false green** (count-0 passed on a document reading `hydrated: null, noteCount: 1`). `session-live` said `ZONA connected. Firmware 1.5.5, active page 3.` exactly once while `tuning-live` stayed `""` and `browse-live` stayed absent; RESET ALL then moved `tuning-live` to `Knobs back to their defaults. Setup 250 of 908, Timer 55 of 908.` with `session-live` unchanged; the double-speak negative went red with carriers `["session-live", "connect-status"]`. E2E **77 = 71 + 6** (67 chromium, 10 webkit-phone) at `--workers 3`; `PREV_E2E` re-measured at **77**. Quick **69 / 724** (+0/+0), sweep `3 13`, svelte-check **533 files**, 0 errors, 0 warnings.**

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` is **re-measured by this plan**, as 06-VALIDATION.md schedules.

| Name         | Value                      | Measured                                                                                          |
| ------------ | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                            |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                            |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` - the literal it printed. Never re-derived                                   |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77**           |
| `PREV_E2E`   | **77 (measured by 06-13)** | `npx playwright test --workers 3` at `9420282`: `77 passed (1.1m)`, 67 chromium + 10 webkit-phone |

### Observed totals: previous SUMMARY plus this plan's delta

06-12 left the tree at **69 files / 724 tests**. This plan adds **+0 files / +0 tests** to quick - it writes browser tests only - so quick stands at **69 / 724**, `BASE_FILES + 3` and `BASE_TESTS + 33`. Sweep is unchanged at **`3 13`**. E2E is **71 + 6 = 77**: four untagged titles plus one tagged, which runs on both projects, so `+4 + 2`. The arithmetic the plan asked for: four plus two, `PREV_E2E + 6`. `BASE_E2E + 16 = 77` is the same number, observed here before 06-14 asserts it.

```
npx playwright test e2e/session.e2e.ts --project chromium
  14 passed (40.1s)                               task 2, before the focus fix: 13 passed, 1 failed (test 12 at :1043)
  1 passed (13.2s)                                test 12 alone, after the fix

npx playwright test e2e/session.e2e.ts --project webkit-phone
  2 passed (15.8s)                                06-06's title and this plan's, both from this file

npx playwright test --project webkit-phone --list | grep session.e2e
  [webkit-phone] › session.e2e.ts:499:3 › ... › a browser with no Web Serial names the browsers that do @webkit
  [webkit-phone] › session.e2e.ts:1064:3 › ... › @webkit the header names the browsers that can install and offers nothing to press @webkit

npx playwright test --workers 3 2>&1 | tee .tmp-e2e/06-13-suite-w3.log | node scripts/check-counts.mjs --playwright 77
  check-counts: observed 77 tests passed
  check-counts: matches the expected counts
  77 passed (1.1m)                                10 results on [webkit-phone], 67 on [chromium]; no ProxyController, no Network connection lost

npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 724
  check-counts: observed 69 files, 724 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo
  counted 1296 combinations in 2.6s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npx vitest run --project server src/lib/ui/device-ui.spec.ts src/lib/config-shape.spec.ts
  Test Files  2 passed (2)   Tests  21 passed (21)      (the structural gates over the two edited components)

npm run check 2>&1 | grep -Ei "error|warning"
  1788599832440 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

svelte-check stays at **533 files**: no file was added or removed. The full suite was run once, at `--workers 3` (deferred item 7), and passed first time; neither of deferred item 8's sites fired.

## Task 1 - the header on screen, and the connection that survives a walk (commit `5291671`)

### Test 10, the header shows the module

On `/` with a port granted before load: `data-hydrated="true"`, then **S2** - caption `ZONA detected`, label `CONNECT ZONA`, `openCount(0) === 0`, no `aria-expanded` (a button that acts). The accessible name is `CONNECT ZONA` exactly and does not match `/detected/`. The click: **S3**, label `CONNECTING…`, `aria-busy="true"`, disabled. The capture: **3 of 119 rx chunks** (the same count the probe needed in 06-07 and 06-12), **S4**, the label's words `ZONA · fw 1.5.5 · page 3`, the accessible name matching `^ZONA\s+fw\s+1[.]5[.]5\s+page\s+3$` and not `/·/`, `aria-expanded="false"`. A click on the summary: `aria-expanded="true"`, `device-details` with `data-slot="S4"`, containing `Firmware 1.5.5, active page 3.` and buttons named `DISCONNECT ZONA` and `FORGET THIS ZONA`. `requests 0`, `openCount(0) 1`, `writes 0`, no console errors.

One harness fact, found on the first run and recorded rather than hidden: the label's spaces are `&nbsp;` entities (06-10, deviation 1), so `innerText` carries U+00A0 and `toContain("fw 1.5.5")` was red against `ZONA · fw 1.5.5 · page 3`. `labelWords()` folds every whitespace run to one plain space before any substring match; the accessible-name regex uses `\s+`, which already matches U+00A0.

### Test 11, the walk - quoted

```ts
await page.getByTestId("browse-link").click();          // / -> /browse/  (BROWSE ALL, an anchor)
await expect(page.getByTestId("browse-grid")).toBeVisible();
await stillConnected(/^\/browse\/$/);

await page.getByTestId(`card-name-${ENTRY}`).click();   // /browse/ -> /c/aurora/  (the card's anchor)
await expect(page.getByTestId("front-door")).toBeVisible();
await stillConnected(new RegExp(`^/c/${ENTRY}/?$`));

await page.getByTestId("browse-link").click();          // /c/aurora/ -> /browse/  (BACK TO BROWSE, a button)
await stillConnected(/^\/browse\/$/);

await page.getByTestId("header-wordmark").click();      // /browse/ -> /  (the wordmark link)
await stillConnected(/^\/$/);
```

No `goto` between the four hops - the file's only `goto`s in the new tests are the initial loads. `stillConnected` asserts on each route: the pathname, `data-slot="S4"`, the label carrying `fw 1.5.5` and `page 3`, `window.__hangarWalk === "the document that connected"` (a stamp set after the connect; a fresh document has none), `requests() === 0` and `openCount(0) === 1`. `writes()` was read once at the end of the walk: **0**.

The plan's "back to `/` through the wordmark link": on `/c/{id}/` the wordmark is Phase 4's `<h1><span>` - the page's only heading, deliberately not focusable and not a link - so the way home is BACK TO BROWSE (Phase 5.1's remembered return, a button) to `/browse/` and then that page's wordmark, which Phase 5.1 made a real anchor to `/`. Four hops rather than three, all client-router, and the walk covers the same three routes.

### The reload, and what the phase was after it

```ts
await page.reload();
await expect(control).toHaveAttribute("data-hydrated", "true");
await expect(control).toHaveAttribute("data-slot", "S2");       // detected - the OFFER
await expect(slotCaption(page)).toHaveText(CAPTION_DETECTED);
expect(await page.evaluate(() => window.__hangarWalk)).toBeUndefined();
expect(await openCount(page, 0)).toBe(0);
```

**After the reload the session was `detected` (S2)** - the port went with the old document, the grant did not, and `getPorts()` found it without a click and without opening it. The stamp was gone (a fresh document) and the fresh shim's open count was 0. The test passed on the first run with the whitespace fix, and this is the assertion that keeps a connection leaked across reloads from reading as a feature.

## Task 2 - the recovery, the engine that cannot install, and the one voice (commit `9420282`)

### Test 12, the recovery - and the defect it found

On `/c/aurora/` (no splash) with a granted port and `busy(0)` planted on the **adopted** port 0 - because with a granted, attached port `connect()` takes the no-chooser path and reopens that object (06-12's harness note) - one click on the header: **S6**, caption `Did not connect`, label `CONNECT ZONA`, and `device-details` with `data-slot="S6"` rendered **with no second click**. `document.activeElement` was the container itself (`{ inside: true, active: "device-details" }`). The block carried CONN-04's title and detail and **six `li` in order**, the last `Click CONNECT ZONA again`; the browser's `Failed to open serial port.` was nowhere on the page. The slot carried **no `aria-expanded`** in S6, before and after. Escape: the drawer gone, `data-slot` still S6, `aria-expanded` still absent, and the slot **focused**. `requests 0`, `openCount(0) 1`, `writes 0`.

The last of those was red on the first run:

```
Error: expect(locator).toBeFocused() failed
  Locator:  getByTestId('device-slot')
  Expected: focused
  Received: inactive
  > 1043 |     await expect(control).toBeFocused();
```

The cause, from the components as shipped: the click moves the slot into S3, where it is `disabled`; a browser blurs a disabled focused button, so `document.activeElement` is the body by the time S6 arrives; `DeviceDetails`'s open effect recorded that body as `previouslyFocused`, and Escape focused the body. Focus was orphaned - exactly what the spec's "Focus never orphaned" row and this plan's own acceptance criterion forbid. 06-10 measured the drawer on the probe with a `probe-open` toggle that never passed through S3, so it could not have seen this. **Fix (Rule 1, deviation 1):** `DeviceDetails` takes an `opener?: HTMLElement | null` and records `active && active !== document.body ? active : (opener ?? active)`; `DeviceSlot` binds its button (`bind:this={control}`) and passes `opener={control}`. Nothing else in either file moved. The two structural gates over the seven components (`device-ui.spec.ts` 7, `config-shape.spec.ts` 14) stayed green; test 12 went green (`1 passed (13.2s)`), and the red run above is this fix's negative, observed on the served build before the change. Hashes: `DeviceDetails.svelte` `72441791…` -> `47fc88df…`, `DeviceSlot.svelte` `ab7e1f38…` -> `24293796…`.

### Test 13, the header on the engine that cannot install - the order, quoted

```ts
// 1
await expect(control).toBeAttached();
await expect(control).toBeVisible();
// 2
await expect(control).toHaveAttribute("data-hydrated", "true");
// 3
await expect(slotCaption(page)).toHaveText(CAPTION_UNSUPPORTED);     // "Not in this browser"
await expect(control).toHaveAttribute("data-slot", "S0a");
// 4  (after waitForFrontDoor: a click during the splash is its skip gesture)
await control.click();
await expect(drawer).toContainText(UNSUPPORTED.title); ... "Chrome", "Edge", "Firefox 151"; body has no "Chromium"
await expect(drawer.getByRole("button")).toHaveCount(0);
// 5
expect(await page.getByTestId("device-note").count()).toBe(0);      // a SNAPSHOT, taken only now
// 6
await expect(status).toContainText(UNSUPPORTED.detail); ... the same three names; try-on-device disabled
```

`data-hydrated="true"` and then the settled caption come **before** the count-0 and the panel's reason, and the count is a snapshot rather than an auto-waiting assertion, so it can only pass because the document it was taken from had already decided the capability. The slot in S0a is a summary: enabled, `aria-expanded="false"` then `"true"`, its drawer holding the failure block and **no button at all** - the recovery on this engine is another browser, so there is nothing to press - and the label is not `CONNECT ZONA`.

**The header, on both engines** (the test's own dump, plus `.tmp-e2e/06-13-degrade-header-{chromium,webkit-phone}.png`):

| Project | Viewport | Slot top / h | Headline top | `device-note` | Caption / label |
|---|---|---|---|---|---|
| chromium | 1280x720 | 32 / **44** | **124** | **0** | `Not in this browser` / `NO ZONA` |
| webkit-phone | 393x659 | 68 / **44** | **160** | **0** | `Not in this browser` / `NO ZONA` |

On the desktop the headline sits at 124 - the hydrated, note-free layout 06-11 measured to the pixel (the prerendered layout with the note has it at 276). On the phone the header is the two-row layout: `HANGAR` and `BROWSE ALL` on the first row, the slot alone and right-aligned on the second (top 68 = 24px padding + the 44px first row), the caption `Not in this browser` in quiet ink over `NO ZONA` in the dim rung, the mark's dark shape beside them, and the headline directly beneath the header block with no reserved note between - the picture is the site's black, the acid-lime wordmark and link, the pad row running underneath. Both dumps read `noteCount: 0`. No engine is named anywhere on the page.

### The ordering negative - observed as a FALSE GREEN, and then as the real green

Mutation A, applied to `e2e/session.e2e.ts` only (a scratch script; nothing outside the file touched): the three waits deleted (`data-hydrated`, the caption's `toHaveText`, `data-slot="S0a"`), a `page.route` holding `**/_app/immutable/entry/start.*.js` for **2000 ms**, and `await expect(page.getByTestId("device-note")).toHaveCount(0)` moved to immediately after the goto and the precondition, with a snapshot of the document taken as it began:

```
MUTATION A: when the count-0 assertion began the document read {"hydrated":null,"noteCount":1,"caption":""}; the assertion passed 1870ms later
  ok 1 [chromium] › ... @webkit the header names the browsers that can install and offers nothing to press @webkit (4.6s)
  1 passed (17.7s)
```

**It passed.** The document it was asserted against had no hydration marker, one rendered note and an empty caption - it had not read the capability - and the assertion went green anyway, 1870 ms later, because `toHaveCount` auto-waits and hydration eventually removed the note. That is the pass "for the wrong reason" the interfaces block describes: it would have passed just as happily on a page that painted a 152px region and then took it away. Recorded plainly, as the plan asked, in the shape of 06-05's mutation 1.

Mutation B, the same 2000 ms hold with every wait intact: `1 passed (16.7s)`, the dump reading `noteCount: 0, caption: "Not in this browser"` - the pass after the marker and the caption, which is the only version that means anything. The file was restored from a byte copy taken before mutation A: sha256 `7e070422…` before, after, and as committed at `9420282`.

### Test 14, the one voice - both region texts at both moments

On `/c/aurora/` with a granted port, `session-live` read `ZONA detected. One click connects it.` on load (a deep link holds nothing). Panel opened from the keyboard after `data-ready="true"`, meters settled, then a `MutationObserver` on each of the three regions.

| Moment | `session-live` | `tuning-live` | `browse-live` |
|---|---|---|---|
| before | `ZONA detected. One click connects it.` | `""` | absent (`null`) - the toolbar is not on this route |
| **after connect** (+800 ms) | **`ZONA connected. Firmware 1.5.5, active page 3.`** | `""` | absent |
| **after the knobs** (+800 ms) | `ZONA connected. Firmware 1.5.5, active page 3.` (unchanged, record unchanged) | **`Knobs back to their defaults. Setup 250 of 908, Timer 55 of 908.`** | absent |

After the connect the session region's record, empties dropped, was exactly `[connectedSentence]` - one utterance (the store empties the region when a line is queued and writes it once when the 500 ms window closes, so the raw record is `""` then the sentence). The tuning record was `[]`, the browse record `[]`. Exactly one `[aria-live]` element on the page carried `Firmware 1.5.5, active page 3.`: `["session-live"]`. Then the first rail one step right, `recomputed`, RESET ALL, `recomputed`: the tuning region spoke, the session region's text and record did not change. `requests 0`, `writes 0`, slot S4.

### The double-speak negative, observed and restored

`aria-live="polite"` re-added to `TryOnDevice.svelte`'s `connect-status` (line 290), rebuilt through the harness, test 14 alone:

```
Error: expect(received).toEqual(expected) // deep equality
  Array [
    "session-live",
+   "connect-status",
  ]
> 1249 |     expect(carriers).toEqual(["session-live"]);
```

Two regions carrying the identity sentence at the same moment - the double-speak D-17 exists to prevent, seen once in a browser. Restored with `git show HEAD:src/lib/ui/TryOnDevice.svelte > …`: sha256 `e3379183…` before and after, `git diff --quiet` exit 0.

## Deviations from Plan

### 1. [Rule 1 - Bug] Focus returned to the body after an auto-opened S6 drawer closed

**Found during:** task 2, test 12's first run. **Issue:** the plan's acceptance criterion requires Escape to return focus to the slot; on the shipped chrome the click's S3 phase disables the slot, the browser blurs it, and `DeviceDetails` recorded the body as the element to return to, so Escape orphaned focus (spec: "Focus never orphaned"). **Fix:** `DeviceDetails` takes `opener` and falls back to it when the active element at open is the body; `DeviceSlot` binds its button and passes it. **Files:** `src/lib/ui/DeviceDetails.svelte`, `src/lib/ui/DeviceSlot.svelte`. **Commit:** `9420282`. This overrides the plan's "no source file is edited by this plan": the rule assumed the behaviour held, the acceptance criterion requires it, and the alternative was a green test asserting less than the criterion or a red suite. Observed red before, green after; the structural gates stayed green.

### 2. [Process] The walk home is four hops through BACK TO BROWSE and the browse wordmark

**Found during:** task 1. **Issue:** the plan's third hop is "back to `/` through the wordmark link", but on `/c/{id}/` the wordmark is Phase 4's non-focusable heading. **Resolution:** BACK TO BROWSE (a client-router button) to `/browse/`, then that page's wordmark anchor to `/`. Same three routes, one more hop, no `goto`. Recorded, no source changed.

### 3. [Process] The tuning region is made to speak with RESET ALL

**Found during:** task 2, reading `TuningRegion.svelte` before writing test 14. **Issue:** a plain in-budget knob turn announces nothing by Phase 5's contract (`flushVoice` speaks only on a command or a budget crossing). **Resolution:** test 14 turns the first rail one step, waits for the recompile, then clicks RESET ALL - a knob movement that speaks - and asserts on that. The comment in the test says why.

### 4. [Process] Tests 12 and 14 run on `/c/aurora/`

The plan names `/` for tests 10, 11 and 13 and no route for 12 and 14. A deep link has no splash to cover the header, eat a key or hold the announcer, and the panel's knobs are on it. Recorded.

### 5. [Process] The identity label's spaces are non-breaking

Test 10's first run was red on `toContain("fw 1.5.5")` against `ZONA · fw 1.5.5 · page 3` because the label's spaces are `&nbsp;` (06-10). `labelWords()` folds whitespace. A harness fact, not a product one.

### 6. [Process] The degrade test writes a screenshot per project into `.tmp-e2e/`

Test 13 records the header the plan asked for as a text dump (`console.log`) and a screenshot at `.tmp-e2e/06-13-degrade-header-{project}.png`; the directory is gitignored and is where this repository keeps e2e artefacts.

## Deferred items - read, not fixed

**Item 8** (the two pre-hydration key-press sites in `first-experience.e2e.ts`): the plan does not name that file and its rules forbid editing anything but `session.e2e.ts`, so the sites are left as they are and the reading is recorded in `deferred-items.md`. Neither fired in the one full-suite run here. The five new tests apply the item's own fix on their side: every band press follows `data-ready="true"`, every slot click follows `data-hydrated="true"` and, on `/`, the splash's removal. **Item 10** (the panel's button enabled in S5) was not driven: no new test unplugs a connected module. **Item 5**: `test-results/.last-run.json` is written after a green run too; removed by hand after each of the eight runs.

## Requirements

**`requirements-contributed: [CONN-06, CONN-07, SAFE-01]`** - contributed, not completed, on the phase's convention (06-14 closes CONN-01..08 with their qualifiers; SAFE-01 is Phase 7's). CONN-06: the connection survives navigation and the reload lands the offer, in a browser, on the shipped header. CONN-07: the verified identity - firmware and active page from the capture - is on the shipped header and in its drawer. SAFE-01: `writes() === 0` at the end of every one of the five tests, over a walk of three routes.

## Known Stubs

None. Every assertion reads shipped components driven by real session state through the shim; the `opener` prop is wired from the slot's real button.

## What the next plan inherits

- The five-name block above, verbatim, all five. `BASE_E2E` is **61**; `PREV_E2E` is **77**, measured here at `9420282`. **06-14's gate `BASE_E2E + 16 = 77` is already the observed number.**
- `PREV_FILES` / `PREV_TESTS` for plan 06-14 are **69 / 724**. svelte-check is at **533 files**.
- `e2e/session.e2e.ts` holds **14**; two titles carry `@webkit` (06-06's and this plan's), so the file adds 16 to the suite. Run the full suite at `--workers 3` (deferred item 7); remove `test-results/` by hand (item 5).
- `DeviceDetails` props: `open`, `panelOwnsProse`, `onclose`, `opener`. `DeviceSlot` passes its bound button as `opener`.
- Deferred item 8 stays open with its owner now 06-14 or whoever edits `first-experience.e2e.ts` first; item 10 unchanged.
- For the runbook: the header on the engine that cannot install is described and pictured above; the reload behaviour (`detected`, one click) is the browser-side half of runbook row A.

## Self-Check: PASSED

Files claimed, verified present:

- `e2e/session.e2e.ts` - FOUND, sha256 `7e070422…`, 14 titles, identical to HEAD
- `src/lib/ui/DeviceDetails.svelte` - FOUND, sha256 `47fc88df…`, identical to HEAD
- `src/lib/ui/DeviceSlot.svelte` - FOUND, sha256 `24293796…`, identical to HEAD
- `.planning/phases/06-device-session/06-13-SUMMARY.md` - FOUND
- `.tmp-e2e/06-13-degrade-header-chromium.png`, `.tmp-e2e/06-13-degrade-header-webkit-phone.png`, `.tmp-e2e/06-13-suite-w3.log` - FOUND (gitignored artefacts)

Files claimed restored, verified:

- `src/lib/ui/TryOnDevice.svelte` - sha256 `e3379183…`, identical to HEAD after the double-speak negative
- `e2e/session.e2e.ts` - sha256 `7e070422…` before and after both ordering mutations

Files claimed absent:

- `test-results/`, `.tmp-e2e/probe/` - ABSENT; no listener on 4173 or 4174; no `workerd` or `wrangler` process

Commits claimed, verified in `git log`:

- `5291671` test(06-13): the header on screen, and the connection that survives a walk - FOUND
- `9420282` test(06-13): the recovery, the engine that cannot install, and the one voice - FOUND
