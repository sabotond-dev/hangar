---
phase: 06-device-session
plan: 11
subsystem: ui
tags: [header, device-slot, header-note, two-row-phone-header, splash-hold, tab-order, data-hydrated, first-frame, CONN-01, CONN-08, DEGR-02]

# Dependency graph
requires:
  - "src/lib/ui/BrowseLink.svelte (05.1-09) - the header's first right-hand child and first tab stop, unedited here"
  - "src/lib/ui/DeviceSlot.svelte and DeviceDetails.svelte (06-10) - the nine-state slot, its data-hydrated marker, and the drawer it owns"
  - "src/lib/ui/DeviceNote.svelte (06-09) - the 152px reserved note, covered and panelOwnsProse"
  - "src/lib/device/session.svelte.ts (06-09) - holdSpeech() and its idempotent release"
  - "src/lib/ui/Splash.svelte (04-05) - ondissolve and onfinished, the second firing on every path the opening ends by"
  - "e2e/fake-serial.ts and src/lib/transport/fixtures/synthetic.ts (06-06, 06-01) - the shim and heartbeatFrame, used only to drive the served build for measurement"
  - "06-UI-SPEC.md (Where it sits, The collapse ladder, The header note, The splash, Interaction Contract); 06-10-SUMMARY.md - PREV_FILES/PREV_TESTS 69/723, the five-name block, deferred items 4, 5, 7, 8"
provides:
  - "src/lib/ui/FrontDoor.svelte: the header block - the row with its right-hand cluster (BrowseLink then DeviceSlot), the note beneath, the unconditional two-row layout below 640px, and the splash hold taken in onMount and released from Splash's onfinished and on destroy"
  - "src/routes/browse/+page.svelte: the device slot as the browse header's only right-hand slot and the note beneath the row, above the toolbar"
  - "src/lib/ui/DeviceSlot.svelte: DeviceDetails mounted inside .device-chrome, so the disclosure 06-10 built can open on a route"
  - "The measured facts: the header block's height constant per width across 1280/1024/900/640/320 in S1/S3/S4/S4rig, two rows at 320 in every state, the tail at 1280 and 1024 and gone at 900/640/320 with its line in the disclosure at all five, the note 152px on all three routes in S1/S2/S3, the unsupported removal once after data-hydrated and the settled caption, the slot and note absent from the first frame, and the announcement once after the splash on both the full and the skipped opening"
affects:
  - "06-12 - TryOnDevice consumes the session; the panel's PickerExplainer mount and panelOwnsProse now have a header note to be never-both with on a real route"
  - "06-13 - re-measures PREV_E2E; owns deferred item 8, which this plan observed at a second site (first-experience.e2e.ts:467)"
  - "06-14 - CONN-01 and CONN-08 close with the header on all three routes; the phase gate's build carries the slot and the note on every prerendered page"
  - ".planning/STATE.md, .planning/ROADMAP.md - Phase 6 at 11/14"

tech-stack:
  added: []
  patterns:
    - "A second header control joins the row as a CLUSTER beside the first, so the row keeps exactly two children and the shipped control is not edited: BrowseLink's element, label logic, treatment, testid and DOM position are byte-identical to 05.1-09"
    - "A layout that must not change with state is unconditional in CSS, never a wrap the content decides: below 640px the header is a two-row grid in every session state, and the negative that made the second row conditional on S4 moved the headline and the coverflow by 44px on connect"
    - "A hold on a live region is released from the event that ends the thing it waits for (Splash's onfinished, which fires on every path including the key skip) and on destroy, never from a fixed timer; the fixed-timer negative announced 1292ms late after a skipped opening and 1723ms late under reduced motion"
    - "A removal is measured as a subtraction of two real layouts: the prerendered document read with scripts blocked, then the hydrated unsupported document after data-hydrated and the settled caption; the pre-plan build is measured by writing the earlier commit's files into the tree with git show, building, and restoring from HEAD by sha256"
    - "A served build is measured through a scratch node:http server on 4174 with NODE_PATH pointing the scratchpad harness at the repository's node_modules; wrangler is never invoked by hand and the e2e suite runs only through Playwright's own webServer"

key-files:
  created:
    - ".planning/phases/06-device-session/06-11-SUMMARY.md"
  modified:
    - "src/lib/ui/FrontDoor.svelte"
    - "src/routes/browse/+page.svelte"
    - "src/lib/ui/DeviceSlot.svelte"
    - ".planning/phases/06-device-session/deferred-items.md"
    - ".planning/STATE.md"
    - ".planning/ROADMAP.md"

decisions:
  - "The right-hand end of the front door's header is a cluster of two children (BrowseLink, then the slot in its own .slot cell) rather than a third row child, so the row stays space-between over exactly two children and Phase 5.1's control is untouched; below 640px the cluster dissolves with display: contents into a two-column grid so the wordmark and BROWSE ALL share row 1 and the slot alone takes row 2, DOM order unchanged"
  - "panelOwnsProse is ONE $derived over page.state.chosen === true in FrontDoor and feeds both the slot and the note; on /browse/ it is the literal false on both mounts and covered is left at its default there because that route has no splash and no covered value to pass"
  - "The splash hold is taken in FrontDoor's onMount only when the opening plays (a child's onMount runs before the layout's, so the hold precedes start()), and released from onSplashFinished and from onDestroy, so no path leaves the live region muted"
  - "DeviceDetails is mounted by DeviceSlot inside .device-chrome (a Rule 2 fix in this plan): 06-10 built the drawer and its position: relative parent but never rendered it, and this plan's own success criterion - multiModuleLine in the disclosure at three widths - is unreachable without the mount"
  - "The interrupted executor's three commits were treated as candidates and every task's verify block and measurement was re-run on this session's own builds; the numbers agreed except the first-frame 900ms opacity, which is 0 (the splash is still in hold at 900ms - the dissolve starts at 1140ms), so the rise evidence is taken at 1500ms and the discrepancy is recorded"

requirements-completed: []
requirements-contributed: [CONN-01, CONN-08, DEGR-02]

# Metrics
duration: 85min
completed: 2026-09-05
---

# Phase 6 Plan 11: The header cluster, the two-row phone layout, and the untouched opening Summary

**The slot and the note are on every route, in a header that cannot move, and the opening is exactly what Phase 4 shipped. `FrontDoor.svelte`'s header row keeps exactly two children - the wordmark and a right-hand cluster of `BrowseLink` (byte-identical to 05.1-09, `git diff cae767d HEAD` empty) then `DeviceSlot` - with `DeviceNote` beneath the row inside a header block, both device children fed by the one `covered` and the one `panelOwnsProse`; `/browse/` mounts the slot as its only right-hand slot and the note above the toolbar. Measured on the served build at 1280, 1024, 900, 640 and 320 in S1, S3, S4 and S4 with a rig: the header row is **44px at every width from 640 up and 88px at 320, identical across all four states at every width**, two rows at 320 in every state, the header block's widest right edge 296 at 320 (the 24px gutter), and the multi-module tail `· with EN16, BU16` **inline at 1280 and 1024, `display: none` at 900, 640 and 320**, with `Also on the cable: EN16, BU16.` in the disclosure at all five widths and the headline at 276 at every width from 640 up - **no jump across the 1024 boundary**. The note is **152 x 372 in S1, S2 and S3 on `/`, `/c/aurora/` and `/browse/`**, its right edge on the slot's (1248 at 1280), zero tab stops; the header block's bottom sits at 228 and the headline at 276 - the same **48px** the pre-plan build measured from the header row (76 to 124). In `unsupported` the note is removed **after** `data-hydrated="true"` and **then** the settled caption `Not in this browser`, the content moves up **152px exactly once** (the hydrated layout, 124/180, is the pre-plan layout to the pixel) and is unchanged a second later. On `/` with a granted ZONA the slot and the note are at **opacity 0 with `.covered` in the first painted frame**, still 0 at 900ms (the splash is in `hold`; the dissolve starts at 1140ms), **0.90 at 1500ms and 1 when the splash is gone, on exactly the wordmark's and `BROWSE ALL`'s value at every sample**; the live region is empty through the whole opening and says `ZONA detected. One click connects it.` **once**, 491ms after the splash on the full opening and 498ms after it on one skipped by a key. Tab order: `/` and `/c/aurora/` go `browse-link`, `device-slot`, `coverflow`; `/browse/` goes `header-wordmark` (Phase 5.1's real link), `device-slot`, `browse-search`. Three negatives observed on one mutated build and restored byte-identical. One Rule 2 fix (DeviceDetails was never mounted). Quick 69 / 723 (+0), sweep `3 13`, e2e 71 with webkit-phone 9 at `--workers 3` (run 2; run 1 hit deferred item 8 at a second site), svelte-check 533 files 0 errors.**

## Reconciliation: an interrupted executor, three candidate commits

A previous executor was interrupted by a session exit after committing `d510037`, `6a9e409` and `b8daa13` (all pushed) with no SUMMARY, no docs commit and STATE/ROADMAP not advanced. The three commits were treated as candidates: every task's `<verify>` block was run and every measurement re-taken on builds made in this session (a pre-plan build for the "before" numbers, the HEAD build, a mutated build, and the e2e suite's own build). The re-measured numbers agree with the commit messages in every case but one - the first-frame opacity at 900ms, which the interrupted executor recorded as 0.57 and which is **0** here on two runs (the splash is still in `hold` at 900ms); see task 3. No fix commit was needed: the three commits satisfy the three tasks' `<done>` criteria, and the one edit outside the plan's `files_modified` (`DeviceSlot.svelte`) is a correct Rule 2 fix recorded as deviation 1.

## The five-name carry-forward block

`BASE_*` measured by **06-01** on a clean tree at `746cfa2`, carried verbatim. `PREV_E2E` as re-measured by **06-07**. This plan adds no e2e test and changes no title; the full suite was run because the header is on every route, and it reports the same total.

| Name         | Value                      | Measured                                                                                |
| ------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `BASE_FILES` | **66**                     | `npm run test:quick` on the clean tree                                                  |
| `BASE_TESTS` | **691** (+ 1 todo = 692)   | `npm run test:quick` on the clean tree                                                  |
| `BASE_SWEEP` | **`3 13`**                 | `npm run test:sweep` - the literal it printed. Never re-derived                         |
| `BASE_E2E`   | **61 (measured by 06-01)** | `npm run build && npm run test:e2e`. **Frozen.** 06-14 asserts `BASE_E2E + 16` = **77** |
| `PREV_E2E`   | **71 (measured by 06-07)** | `npm run test:e2e` at `8562b18`: `71 passed (1.2m)`. Rolls next at 06-13                |

### Observed totals: previous SUMMARY plus this plan's delta

06-10 left the tree at **69 files / 723 tests**. This plan adds **+0 files / +0 tests**, so quick stands at **69 / 723**, `BASE_FILES + 3` and `BASE_TESTS + 32`. Sweep is unchanged at **`3 13`**. E2E is **71 + 0 = 71**, nine on webkit-phone, observed (not carried) because the header is on every route.

```
npm run test:quick 2>&1 | node scripts/check-counts.mjs 69 723
  check-counts: observed 69 files, 723 tests passed, 1 todo (todo is reported, never asserted)
  check-counts: matches the expected counts

npm run test:sweep 2>&1 | node scripts/check-counts.mjs 3 13
  check-counts: observed 3 files, 13 tests passed, 0 todo (todo is reported, never asserted)
  check-counts: matches the expected counts
  counted 1296 combinations in 2.8s; worst 906 of 908 at none/none/trackpad/hi=false/grid=false; over budget 0

npx playwright test --workers 3 2>&1 | tee .tmp-e2e/06-11-suite-w3-run2.log | node scripts/check-counts.mjs --playwright 71
  check-counts: observed 71 tests passed
  check-counts: matches the expected counts
  71 passed (1.3m)                                 9 results on [webkit-phone], 62 on [chromium]

npx vitest run --project server src/lib/ui/ src/lib/config-shape.spec.ts      (build/ present, from the e2e run)
  Test Files  6 passed (6)   Tests  42 passed (42)
  identity.spec.ts 6 · tune-ui.spec.ts 5 · device-ui.spec.ts 6 · config-shape.spec.ts 14 (+ browse-ui, catalog-card)

npm run check 2>&1 | grep -Ei "error|warning"
  1788595809961 COMPLETED 533 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

npm run lint
  All matched files use Prettier code style!   (exit 0)
```

`svelte-check` stays at **533 files**: no file was added. Run 1 of the e2e suite (`.tmp-e2e/06-11-suite-w3.log`) was **70 passed, 1 failed** - `first-experience.e2e.ts:467` "an off-row page is a row of one", whose `ArrowLeft` at line 535 landed on a band reading `data-ready="false"` for the first two polls (deferred item 8's race at a second site, deviation 6); run 2 was 71 with no failure. Neither wrangler log carries `ProxyController` or `Network connection lost.`. After every run: no LISTENING socket on 4173 or 4174, no `workerd` or `wrangler` process; `test-results/` removed by hand (deferred item 5).

## Task 1 - the precondition, then the right-hand cluster (commit `d510037`)

### The precondition, quoted

```
$ ls src/lib/ui/BrowseLink.svelte
src/lib/ui/BrowseLink.svelte
$ grep -n "browse-link" src/lib/ui/BrowseLink.svelte
177:      class="browse-link"
180:      data-testid="browse-link">{BROWSE_ALL}</a
189:      class="browse-link"
192:      data-testid="browse-link"
208:  .browse-link {
240:  .browse-link:hover {
250:  .browse-link.covered {
$ grep -n "BrowseLink" src/lib/ui/FrontDoor.svelte
80:  import BrowseLink from "./BrowseLink.svelte";
172:        <BrowseLink {covered} />
```

All three passed; the plan proceeded.

### BrowseLink, unedited

`git diff --stat cae767d HEAD -- src/lib/ui/BrowseLink.svelte` prints nothing (exit 0); the last commit to touch the file is `827f402` (05.1-09). Its unchanged lines, as they stand:

```svelte
    <a
      class="browse-link"
      class:covered
      href={resolve("/browse/")}
      data-testid="browse-link">{BROWSE_ALL}</a
    >
  {:else}
    <button
      class="browse-link"
      class:covered
      type="button"
      data-testid="browse-link"
      onclick={toRecorded}>{BACK_TO_BROWSE}</button
    >
```

In `FrontDoor.svelte` it is still `<BrowseLink {covered} />`, the first child of the cluster and the first right-hand child in the DOM.

### The cluster and the two rows, as shipped

```svelte
<div class="cluster">
  <BrowseLink {covered} />
  <div class="slot">
    <DeviceSlot {covered} {panelOwnsProse} />
  </div>
</div>
```

```css
.cluster { display: flex; align-items: center; gap: 24px; }
@media (max-width: 639px) {
  .header { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-auto-rows: minmax(44px, auto); align-items: center; }
  .cluster { display: contents; }
  .wordmark { grid-area: 1 / 1; }
  .slot { grid-area: 2 / 1 / 3 / 3; justify-self: end; }
}
```

`panelOwnsProse` is `$derived(page.state.chosen === true)` - the same source `Coverflow.svelte` reads for its own `chosen` - and feeds both device children.

### The header across five widths and four states, on the served build

The HEAD build served by the scratch static server on 127.0.0.1:4174, driven by the shim at `/`. `h` is the header row's height, `rows` is 2 when the slot's top is at or below `BROWSE ALL`'s bottom, `slot right` is the slot's right edge, `headline` the headline's top. S4rig is S4 with EN16 (hwcfg 195) and BU16 (hwcfg 131) heartbeats fed with the trailing LF terminator and the ZONA's heartbeat re-fed (06-10's finding).

| Width | State | h | rows | slot w | slot right | headline top | tail `display` | label |
|---|---|---|---|---|---|---|---|---|
| 1280 | S1 | **44** | 1 | 151 | 1248 | 276 | - | NO ZONA / CONNECT ZONA |
| 1280 | S3 | **44** | 1 | 140 | 1248 | 276 | - | CONNECTING… |
| 1280 | S4 | **44** | 1 | 176 | 1248 | 276 | - | ZONA · fw 1.5.5 · page 3 |
| 1280 | S4rig | **44** | 1 | 275 | 1248 | 276 | **inline** | ZONA · fw 1.5.5 · page 3 · with EN16, BU16 |
| 1024 | S1 | **44** | 1 | 151 | 992 | 276 | - | |
| 1024 | S3 | **44** | 1 | 140 | 992 | 276 | - | |
| 1024 | S4 | **44** | 1 | 176 | 992 | 276 | - | |
| 1024 | S4rig | **44** | 1 | 275 | 992 | 276 | **inline** | … · with EN16, BU16 |
| 900 | S1 | **44** | 1 | 151 | 868 | 276 | - | |
| 900 | S3 | **44** | 1 | 140 | 868 | 276 | - | |
| 900 | S4 | **44** | 1 | 176 | 868 | 276 | - | |
| 900 | S4rig | **44** | 1 | 176 | 868 | 276 | **none** | (tail in the DOM, hidden) |
| 640 | S1 | **44** | 1 | 151 | 608 | 276 | - | |
| 640 | S3 | **44** | 1 | 140 | 608 | 276 | - | |
| 640 | S4 | **44** | 1 | 176 | 608 | 276 | - | |
| 640 | S4rig | **44** | 1 | 176 | 608 | 276 | **none** | |
| 320 | S1 | **88** | **2** | 151 | 296 | 360 | - | |
| 320 | S3 | **88** | **2** | 140 | 296 | 360 | - | |
| 320 | S4 | **88** | **2** | 176 | 296 | 360 | - | |
| 320 | S4rig | **88** | **2** | 176 | 296 | 360 | **none** | |

**Constant per width in every state**: 44 at 1280, 1024, 900 and 640; 88 at 320. The slot's box is 44 in all twenty cells. **The 1024 boundary**: the tail is inline at 1024 (the rule is `max-width: 1023.98px`) and gone at 900, and the header is 44 with the headline at 276 on both sides - **no jump was measured across it**, in either direction. The tail is present at 1280, absent at 900 and 320 (and 640); `multiModuleLine` - `Also on the cable: EN16, BU16.` - was read inside the opened `device-details` at **all five widths** (`drawerHasMulti: true` in every S4rig cell). The header's height is the same number at 1280 and 900 (44 and 44), and removing the tail shortened the slot from 275 to 176 and moved nothing else: same slot right edge, same headline top.

### The 320px picture: two rows always, and the scrollbar question

At 320 the header block's widest descendant right edge is **296** and its narrowest left edge **24** in S1, S3 and S4 - the header sits inside the 24px gutter in every state, and the slot's right edge is 296 in all four. 06-UI-SPEC's 358-against-272 estimate is not contradicted: one row would need `HANGAR` + 24 + `BROWSE ALL` + 24 + the slot (140 to 275) and the negative below measured a one-row header's slot right edge at **357** in S2 at 320.

`document.documentElement.scrollWidth` is **326 against a 320 client width, in every state, and `scrollTo(100, 0)` lands at `scrollX` 6** - the page is horizontally scrollable by 6px at 320. That is **not the header**: it is identical on the pre-plan build (`cae767d`'s files, 326 at 320 on `/`, 320 on `/browse/`), it is absent on `/browse/` after this plan too (scrollWidth 320), and the elements past the viewport edge are the coverflow's pads (`pad-pinwheel` 252..436, `pad-dial` -116..68) under `.band { overflow: clip; overflow-clip-margin: 6px; }` - Phase 4's full-bleed row with its 6px clip margin. Pre-existing and out of this plan's scope: recorded as **deferred item 9**, not fixed here.

### Negative 1: the second row conditional on the session state, observed and restored

Mutation (one build with negatives 2 and 3, `apply-neg-0611.mjs`): `class:two-rows={slotStateOf(session.phase) === "S4"}` on `.header`, every phone rule scoped to `.header.two-rows`. Loaded `/` at 320 with a granted ZONA, connected through the shim:

```
S2 (one row)  headerH 44   headlineTop 316   coverflowTop 372   slotRight 357   scrollWidth 357
S3 (one row)  headerH 44   headlineTop 316   coverflowTop 372   slotRight 320   scrollWidth 346
S4 (two rows) headerH 88   headlineTop 360   coverflowTop 416   slotRight 290
headlineJump 44   coverflowJump 44   headerGrew 44
```

The headline and the coverflow **jumped 44px at the moment the module connected**, and the one-row header had already pushed the slot 37px past the viewport in S2. Restored: `FrontDoor.svelte` sha256 `c84936ab…` before the mutation and after `git show HEAD:… > …`; `git diff --quiet` exit 0.

## Task 2 - the note in the header block, and the browse header (commit `6a9e409`)

### The two mount lines, quoted

```svelte
<!-- src/lib/ui/FrontDoor.svelte -->
<DeviceNote {covered} {panelOwnsProse} />

<!-- src/routes/browse/+page.svelte -->
<DeviceSlot panelOwnsProse={false} />
<DeviceNote panelOwnsProse={false} />
```

`panelOwnsProse` - the prop whose omission type-checks and silently disables the never-both rule - is explicit on all four device mounts. On `/browse/` `covered` is left at its default `false` (deviation 4): the route has no splash and no `covered` value, and the interfaces block says nothing on it is covered.

### The margin, quoted: its value does not change, only what it is measured from

```css
.header-block,
.headline {
  padding-inline: 32px;
}
/* Body role, quiet by colour rather than by size. */
.headline {
  margin: 48px 0 0;
  ...
}
```

Before this plan the rule read `.header, .headline { padding-inline: 32px; }` and the headline's `margin: 48px 0 0` was measured from the row; the margin is the same declaration and is now measured from the block, which holds the row and the note.

### Before and after, on served builds

The "before" build is `cae767d`'s `FrontDoor.svelte`, `browse/+page.svelte` and `DeviceSlot.svelte` written into the tree with `git show`, built, measured, and restored from HEAD by sha256 (all four hashes equal to `head.sha`, `git diff --quiet` exit 0). Desktop Chrome 1280x720, S1.

| Route | Build | header (row or block) bottom | headline top | gap | coverflow / toolbar top |
|---|---|---|---|---|---|
| `/` | before (`cae767d`) | row 76 | 124 | **48** | coverflow 180 |
| `/` | after (HEAD) | block 228 (row 32..76, note 76..228) | 276 | **48** | coverflow 332 |
| `/browse/` | before | row 76 | 124 | **48** | toolbar 180 |
| `/browse/` | after | block 228 | 276 | **48** | toolbar 332 |

At 320 the before-build gap is also 48 on both routes (68 to 116). The distance from the header block to the headline is unchanged; everything beneath moved down by the note's 152px on a capable browser, which is the cost 06-UI-SPEC open question 7 names.

### The note's height across S1, S2 and S3, on all three routes

| Route | State | notes | h | w | note right | slot right | block bottom | headline top | `data-line` | tab stops |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | S1 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | explainer | 0 |
| `/` | S2 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | offer | 0 |
| `/` | S3 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | identifying | 0 |
| `/c/aurora/` | S1 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | explainer | 0 |
| `/c/aurora/` | S2 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | offer | 0 |
| `/c/aurora/` | S3 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | identifying | 0 |
| `/browse/` | S1 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | explainer | 0 |
| `/browse/` | S2 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | offer | 0 |
| `/browse/` | S3 | 1 | **152** | 372 | 1248 | 1248 | 228 | 276 | identifying | 0 |

152 in all nine cells, the note's right edge on the slot's right edge in all nine, no tab stop added. (S3 was reached by clicking the S2 slot with nothing fed; the shim resolves the chooser at once, so the line read is `identifying`.)

### The unsupported removal: after `data-hydrated`, then the caption, then the count

The assertion order, quoted from the scratch spec:

```ts
// THE ORDER IS THE MEASUREMENT (plan 06-11 task 2):
// 1. the hydration marker a prerendered document cannot carry;
const slot = page.locator('[data-testid="device-slot"][data-hydrated="true"]');
await expect(slot).toHaveCount(1, { timeout: 20_000 });
// 2. the settled caption - the capability decision landed;
await expect(page.getByTestId("device-slot-caption")).toHaveText("Not in this browser");
// 3. only now does the count mean what the plan says it means.
const noteCount = await page.getByTestId("device-note").count();
expect(noteCount).toBe(0);
```

`navigator.serial` deleted from `Navigator.prototype` in an init script (`"serial" in navigator` asserted false first). The pre-hydration layout is the same document read with JavaScript disabled:

| Route | prerendered (scripts blocked): notes / note h / headline / below | hydrated unsupported: notes / caption / headline / below | shift | one second later |
|---|---|---|---|---|
| `/` | 1 / 152 / 276 / 332 | **0** / Not in this browser / 124 / 180 | **152** | 124 / 180, unchanged |
| `/c/aurora/` | 1 / 152 / 276 / 332 | **0** / Not in this browser / 124 / 180 | **152** | unchanged |
| `/browse/` | 1 / 152 / 276 / 332 | **0** / Not in this browser / 124 / 180 | **152** | unchanged |

The prerendered documents carry the slot with `data-slot="S1"` and **no** `data-hydrated`, and the note at 152. Hydration removed the note once, the content above moved up by exactly the note's height, and a second reading a second later is identical - and 124 / 180 is the pre-plan build's own layout to the pixel, so a visitor on a browser that cannot connect sees the page Phase 5.1 shipped.

### `data-hydrated` against `build/index.html`, as 06-10 asked

```
build/index.html            device-slot=1  data-hydrated=0  device-note=1  browse-link=1
build/browse/index.html     device-slot=1  data-hydrated=0  device-note=1  browse-link=0
build/c/aurora/index.html   device-slot=1  data-hydrated=0  device-note=1  browse-link=1
build/browse/index.html still holds every catalog name: names 16, missing []
```

The slot is in the real header on all three prerendered pages and none carries the marker; `config-shape.spec.ts` reports **14 passed** against this build (test 14 walking the four pages' static import graphs).

### Negative 2: the note rendered in `unsupported`, observed and restored

Mutation: `const rendered = $derived(true);` in `DeviceNote.svelte`. `/browse/` with `navigator.serial` deleted, after `data-hydrated` and the caption `Not in this browser`:

```
noteCount 1   noteH 152   data-slot S0a   headlineTop 276 (good build: 124)   toolbarTop 332 (good build: 180)
```

A browser that can never connect paid **152px of header** for a region with nothing to say. Restored: `DeviceNote.svelte` sha256 `55d9e160…` before and after; `git diff --quiet` exit 0.

## Task 3 - the opening, the tab order, and the phone (commit `b8daa13`)

### The hold, as shipped

```ts
onMount(() => {
  if (opening) releaseSpeech = session.holdSpeech();
});
onDestroy(() => { releaseHold(); });
function onSplashFinished(): void { opening = false; releaseHold(); }
...
<Splash ondissolve={() => (covered = false)} onfinished={onSplashFinished} />
```

`releaseHold` is idempotent (`releaseSpeech?.(); releaseSpeech = undefined`). `Splash.toDissolve()` is the one path to `onfinished` and it is reached by the hold timer and by the `pointerdown` / `keydown` / `wheel` skip alike, so the release runs on every way the opening ends; `onDestroy` covers a navigation during the opening.

### The first frame, with a granted ZONA in the shim

`/` at 1280, `FAKE_SERIAL` plus `grant()` before load, the document read as soon as `[data-testid="front-door"]` is attached. Screenshots taken: **`t3-good-frame-0ms.png`** (splash `in`), **`t3-good-frame-900ms.png`** (splash `hold`) and **`t3-good-frame-1500ms.png`** (dissolve) in the scratchpad - not in the tree. Computed opacities:

| ms after the front door attached | splash phase | wordmark | BROWSE ALL | slot | note | `.covered` on slot / note |
|---|---|---|---|---|---|---|
| **0** | in | 0 | 0 | **0** | **0** | true / true |
| 303 | hold | 0 | 0 | 0 | 0 | true / true |
| 604 | hold | 0 | 0 | 0 | 0 | true / true |
| **904** | hold | 0 | 0 | **0** | **0** | true / true |
| 1204 | dissolve | 0.318 | 0.318 | 0.318 | 0.318 | false / false |
| **1505** | dissolve | 0.902 | 0.902 | **0.902** | **0.902** | false / false |
| 1805 | dissolve | 0.9998 | 0.9998 | 0.9998 | 0.9998 | false / false |
| 2103 | (gone) | 1 | 1 | 1 | 1 | false / false |

**Absent from the first painted frame, and rising on exactly the wordmark's value at every sample.** The plan's 900ms point falls inside the splash's `hold` (240 + 900 = 1140ms before the dissolve), so the "present" evidence is the 1500ms frame; the interrupted executor's 0.57 at 900ms was not reproduced on two runs (deviation 2). Under reduced motion (`reducedMotion: "reduce"` on the context **and** `page.emulateMedia`, `matchMedia` confirmed `true`): opacity 0 at 0ms (splash already in `hold`, 0 + 400), **0.953 at 500ms** (the 200ms crossfade from 400ms), 1 when the splash is gone.

### The tab order, walked from the document on the served build

First four `Tab` presses after `document.activeElement.blur()`, `data-testid` of the focused element:

| Route | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| `/` | `browse-link` | `device-slot` | `coverflow` | `nameplate-prev` |
| `/c/aurora/` | `browse-link` | `device-slot` | `coverflow` | `nameplate-prev` |
| `/browse/` | `header-wordmark` | `device-slot` | `browse-search` | `browse-sort` |

On `/` and `/c/{id}/` the slot is second, after `BROWSE ALL` and before the listbox, and everything after is Phase 4's order. On `/browse/` the first stop is the wordmark, which Phase 5.1 made a real link to the front door (`<h1 class="wordmark"><a href=…>`); the device slot is the header's only right-hand control and the next stop, then the search field - the plan's "first Tab lands on the device slot" did not account for the link (deviation 3). At 320 the DOM is unchanged, so the order is the same with the slot on the second row.

### The announcement, once, after the opening

A body-wide `MutationObserver` installed before any page script logs every transition of `session-live`'s text into a non-empty value.

| Opening | mid-opening: splash / speech / slot | splash gone at | writes | first write | after the splash by |
|---|---|---|---|---|---|
| full (1840ms) | 1 / `""` / S2 | 1956ms | **1** - `ZONA detected. One click connects it.` | 2447ms | **491ms** |
| skipped (`Space` at ~300ms, phase `hold` to `dissolve`) | during: `""` | 1157ms | **1** - the same sentence | 1655ms | **498ms** |

The slot was already in S2 during the opening (the granted port was found at `start()`), the live region stayed empty until the splash had gone, and the sentence was written once, one trailing window later, on both openings.

### Negative 3: the hold released on a fixed timer, observed and restored

Mutation: `setTimeout(releaseHold, 1840)` in `onMount`, the `releaseHold()` in `onSplashFinished` removed (the plan's "naive release on the 1840ms timer"). Three openings on the mutated build:

| Opening | splash gone at | first write | late by | good build |
|---|---|---|---|---|
| full | 1953 | 2441 | 488 | 491 |
| **skipped by a key at ~300ms** | 1136 | 2428 | **1292** | 498 |
| **reduced motion (600ms opening)** | 745 | 2468 | **1723** | - |

With the timer at the full opening's length the announcement is not over the opening and not lost - it is **decoupled from it**: a visitor who skipped waits 1.3s in silence and a reduced-motion visitor 1.7s, where the shipped release speaks ~490ms after whichever way the opening ended. (A constant shorter than the full opening would have spoken over it; the plan's "over the opening or not at all" names the two other faces of the same defect, and the literal 1840 shows the third.) Restored with negatives 1 and 2: `FrontDoor.svelte` sha256 `c84936ab…`, `DeviceNote.svelte` `55d9e160…`, `git diff --quiet` exit 0.

## Deviations from Plan

### 1. [Rule 2 - Missing critical functionality] DeviceSlot mounts DeviceDetails

**Found during:** the interrupted executor's task 1 (commit `d510037`), confirmed here. **Issue:** 06-10 built `DeviceDetails` and the `position: relative` `.device-chrome` wrapper and its SUMMARY says the slot "owns the drawer's `open` and renders `DeviceDetails`", but at `cae767d` `DeviceSlot.svelte` neither imported nor rendered it: the disclosure - the S0a/S0b capability block, the S4 identity with `DISCONNECT ZONA` and `FORGET THIS ZONA`, the S5 replug offer, the S6 recovery - could not open on any route, and this plan's own acceptance criterion (`multiModuleLine` in the disclosure at three widths) is unreachable without it. **Fix:** `import DeviceDetails` and `<DeviceDetails {open} {panelOwnsProse} onclose={() => (open = false)} />` inside `.device-chrome`, two lines. `device-ui.spec.ts` stays at 6 passed and `config-shape.spec.ts` at 14 (both files name only permitted specifiers). **Files:** `src/lib/ui/DeviceSlot.svelte` (not in the plan's `files_modified`). **Commit:** `d510037`.

### 2. [Process] The 900ms first-frame point is inside the splash's hold

The plan asks for evidence at 0ms and 900ms with the slot "present at 900ms". Measured from the moment the front door is attached, the splash is in `hold` until 1140ms (240 + 900), so the slot and the note are at 0 at 900ms on the shipped build - correctly - and the rise is 0.32 at 1200, 0.90 at 1500 and 1 at 2100. The evidence is therefore three frames (0, 900, 1500) and a seven-sample series. The interrupted executor's commit message recorded 0.57 at 900ms; it was not reproduced on two runs here, and the series above is what this session observed.

### 3. [Process] On `/browse/` the first tab stop is Phase 5.1's wordmark link, not the slot

The plan and 06-UI-SPEC's tab-order line put the device slot first on `/browse/`. Phase 5.1 made that route's wordmark a real anchor to the front door (05.1-08), and it precedes the header row's right-hand end in the DOM; restructuring that header is outside this plan (the standing rule is that Phase 5.1's header is not restructured). The measured order is `header-wordmark`, `device-slot`, `browse-search`, `browse-sort`: the slot is the first right-hand control and the first stop after the wordmark, and nothing in Phase 5.1's order moved. Recorded, not changed.

### 4. [Process] `covered` is not passed on `/browse/`

The plan's "both props on both surfaces" is written against `FrontDoor.svelte`, which has a `covered` value; `/browse/` has no splash and no such value, so its two mounts pass `panelOwnsProse={false}` explicitly - the prop whose silent default would disable the never-both rule - and leave `covered` at its default `false`, which is the value the interfaces block prescribes for that route. Passing `covered={false}` would state the default and nothing else.

### 5. [Process] A 6px horizontal overflow at 320 pre-exists this plan

`scrollWidth` 326 against 320 and `scrollX` 6 after `scrollTo(100, 0)` on `/` at 320 in every state - and on the pre-plan build too (326), while `/browse/` reads 320 before and after. The overflowing boxes are the coverflow's pads under `overflow: clip; overflow-clip-margin: 6px` (Phase 4's full-bleed row), the header block's widest right edge is 296. Out of scope per the scope boundary; **deferred item 9**, owner unassigned (Phase 4's `Coverflow.svelte`).

### 6. [Process] One e2e failure on run 1: deferred item 8's race at a second site

`first-experience.e2e.ts:467` ("an off-row page is a row of one") pressed `ArrowLeft` on `/c/aurora/` at line 535 while the band read `data-ready="false"` (two polls in the call log), after assertions the prerendered document already satisfies and with no `data-ready` wait. This is the pre-hydration key-press race deferred item 8 records for line 156, at a second test in the same file, and the item predicted the window would widen when 06-11 mounted the slot and the note on the deep-link route. The file is not in this plan's `files_modified` and 06-13 owns the fix; run 2 at `--workers 3` was 71 passed. Deferred item 8 is extended with this site.

### 7. [Process] The interrupted executor's commits were verified, not trusted

Every `<verify>` block and every measurement was re-run on builds made in this session; the interrupted executor's scratch result files were used only as a template for the harness. Its `t1-header.e2e.ts` was reused as-is for the ladder; the before-build, the note, the opening and the negative specs were written here. The "before" build was produced by writing `cae767d`'s three files into the tree with `git show` (never `checkout`) and restoring from HEAD with hashes compared to `head.sha`.

### 8. [Process] The served build was measured without invoking wrangler

As 06-08 to 06-10: `npm run build`, a scratch `node:http` static server over `build/` on 127.0.0.1:4174 (killed by PID afterwards), scratch Playwright specs importing `FAKE_SERIAL` by absolute path, with `NODE_PATH` set to the repository's `node_modules` because the scratchpad has none above it. The e2e suite ran only through Playwright's own `webServer`. `test-results/` removed by hand after both runs (deferred item 5).

## Requirements

**`requirements-contributed: [CONN-01, CONN-08, DEGR-02]`** - contributed, not completed, on the phase's convention (06-14 closes CONN-01..08 with their qualifiers; DEGR-02 is Phase 7's). CONN-01's one control is now in the header on all three routes, enabled from the capability alone; CONN-08's identity is visible while connected on all three, live, with the rig tail above 1024 and in the disclosure everywhere; DEGR-02's header half - the capability states present, not hidden, with the note absent so a browse-only visitor pays nothing - is obeyed and measured. None is marked complete in REQUIREMENTS.md.

## Known Stubs

None. Both mounts render live session state through components that read the store; `panelOwnsProse` is a live `$derived` on `/` and `/c/{id}/` and a literal `false` on `/browse/` because that route has no panel.

## What the next plan inherits

- The five-name block above, verbatim, all five. `BASE_E2E` is **61**; `PREV_E2E` is **71**, measured by 06-07, observed again here at 71 and unchanged.
- `PREV_FILES` / `PREV_TESTS` for plan 06-12 are **69 / 723**. svelte-check is at **533 files**.
- The header is on every route: `/` and `/c/{id}/` through `FrontDoor.svelte` (`BrowseLink`, then `DeviceSlot`, then `DeviceNote` beneath, all from one `covered` and one `panelOwnsProse = $derived(page.state.chosen === true)`); `/browse/` with the slot as its only right-hand control and the note above the toolbar, `panelOwnsProse={false}`.
- 06-12's panel must render its `PickerExplainer` with its own testid and hand `panelOwnsProse` the same `chosen` truth: the header note on `/c/{id}/` already yields its S1 explainer and S3 status line when `page.state.chosen === true`, so the never-both rule can now be observed on a real route rather than a probe stand-in.
- Header heights to hold: **44** from 640 up, **88** at 320, in every session state; the note **152** at the 372px column; the headline **48** below the header block. The 6px `scrollWidth` excess at 320 is the coverflow's (deferred item 9), not the header's.
- Run the full e2e at `--workers 3` (deferred item 7); `first-experience.e2e.ts` now has two known pre-hydration key-press sites (lines 156 and 535, deferred item 8, owner 06-13).

## Self-Check: PASSED

Files claimed, verified present:

- `src/lib/ui/FrontDoor.svelte`, `src/routes/browse/+page.svelte`, `src/lib/ui/DeviceSlot.svelte` - FOUND (modified; sha256 equal to `head.sha` after every restore)
- `.planning/phases/06-device-session/06-11-SUMMARY.md` - FOUND

Files claimed unchanged, verified:

- `src/lib/ui/BrowseLink.svelte` - `git diff --stat cae767d HEAD` empty
- `src/lib/ui/DeviceNote.svelte`, `src/lib/ui/DeviceDetails.svelte`, `src/routes/+layout.svelte`, `src/app.css`, `e2e/first-experience.e2e.ts`, `playwright.config.ts` - unchanged since `cae767d`

Files claimed absent:

- `test-results/` - ABSENT

Commits claimed, verified in `git log`:

- `d510037` feat(06-11): the right-hand cluster and the two-row phone header - FOUND
- `6a9e409` feat(06-11): the header note on every route, and the browse header slot - FOUND
- `b8daa13` feat(06-11): the splash hold, so the session waits its turn - FOUND
