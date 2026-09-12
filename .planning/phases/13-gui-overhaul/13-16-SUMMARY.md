---
phase: 13-gui-overhaul
plan: 16
subsystem: ui, sandbox, store
tags: [sandbox, pdf-page-3, plate, palette, element-list, inspector, undo-redo, coalescing, edit-play, no-drag, wcag-2.2, keyboard-route, numeric-route, static-overlay, svg-circle, draft, static-host, fallback-404, two-slots, meter, preview, prev-04, build-01, build-02, build-06, build-07, build-08, keep-01]

# Dependency graph
requires:
  - phase: 13-gui-overhaul
    plan: 15
    provides: "measureSurface / costOf returning mapmode beside setup and timer with fits over all three; the two-slot ceiling in kinds (the PDF's page 3 and any XY pad beside a Knob refused on two slots until 13-17); tooSmall per kind with the Knob's 3 x 3; the dearest sixteen at 882 so the cap is sixteen; a Lua string that runs in a VM"
  - phase: 13-gui-overhaul
    plan: 14
    provides: "model.ts re-exporting 13-13's shapes; toDisplay / fromDisplay; buildCellMap, validate, applyEdit returning the surface handed in on a refusal, addRegion, freeWindow, duplicate that never deletes, adjacencyWarnings; GEOMETRY_COPY and overlapLine; a fader's orientation"
  - phase: 13-gui-overhaul
    plan: 13
    provides: "/sandbox/ in the crawler's 404 ignore to remove; New surface and a sandbox record's Open pointing at SECTIONS[1].href; drafts.ts's record shape for a sandbox draft; no route writing a Playground draft"
  - phase: 13-gui-overhaul
    plan: 09
    provides: "Swatch.svelte and ColourPicker.svelte reused unchanged; NUMERIC_GRID_REFLOW = 454 in layout.ts (D-21); copyName"
  - phase: 13-gui-overhaul
    plan: 10
    provides: "BudgetMeter.svelte on the error tokens; Undo randomize as one stored vector, whose header this plan's history points at"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "Rail.svelte with a right-hand type label; Inspector.svelte's three-row panel; layout.ts as the one place for numbers"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "drafts.ts (writeDraft / readDraft / draftIdFor) and local.ts's probe for a refusing store"
provides:
  - "src/lib/sandbox/editor.ts: the Sandbox's model - one surface, one selection, one mode, one pending placement, the focus cell, the field states and the history; clickCell as the one creation and selection call (element first after choose(), area first from two clicks, a held cell selects), moveFocus / mark as the keyboard route, editNumber refusing through geometry.ts with the previous valid surface kept and the typed text beside its message, Play locking every structural method with selection and history untouched, Follow hardware selection deliberately absent and said in section 3"
  - "src/lib/sandbox/history.ts: undo and redo over structural edits, coalesced by key and recency with the boundary stated (focus leaves, Enter, another key, undo, redo), and the header pointing at 13-10's Undo randomize as the thing it is not - TuningRegion.svelte's header points back"
  - "src/lib/sandbox/copy.ts (every word), draft.ts (the surface as a draft under sandbox:{id}, a refusing store degrading to an unsaved session), colour-knob.ts (the region's colour as the one KnobView Swatch.svelte renders), preview.ts (a LuaPadSim over the emitted strings under the pinned library, two slots only)"
  - "src/lib/ui/sandbox/SurfaceEditor.svelte: the 571 plate as one SVG - sixteen static guide lines, regions as tinted rects with 1px boundaries and 11px uppercase names, the Knob as an SVG <circle>, the selection as an action-colour outline plus eight square <rect> handles, the proposed bounds before commit, the focus cell, role=application with arrows / Enter / Escape / Delete, onclick from pointerdown so a click is a whole step and a drag only an accelerator, the finger routed to the route in Play"
  - "Palette.svelte (ADD AN ELEMENT, aria-pressed on the armed kind, disabled with GEOMETRY_COPY.cap at sixteen and with PLAY_LOCKS_PALETTE in Play, both by aria-describedby), ElementList.svelte (ON THIS SURFACE as buttons with name left and type right, aria-current with D-03's three signals, arrows / Home / End / Delete), RegionInspector.svelte (page 3's right column in Inspector.svelte: Element name and Type as the new lead snippet, the 2 x 2 grid reflowing at NUMERIC_GRID_REFLOW, MIDI output, Behavior on a button, Appearance through Swatch, the pinned pair; every field read-only with a reason in Play; the refused field in the error ink)"
  - "src/routes/sandbox/ (+page.ts prerendered, +page.svelte resuming the newest sandbox draft or minting a surface id, ?new forcing one) and src/routes/sandbox/[draftId]/ (+page.ts with prerender false, ssr false and the static-host answer written down; +page.svelte with the frame, the mode switch and its persistent line, Undo / Redo / Save copy, the plate, the empty state, the meters and the room line, SLOTS = 2 until 13-17 with the two-slot refusal rendered, the draft written debounced, the preview built on entering Play)"
  - "Rail.svelte's children snippet and Inspector.svelte's lead snippet (both optional); layout.ts's SANDBOX_PLATE / PITCH / HANDLE / LABEL_SIZE; shell.svelte.ts's SANDBOX as resolve('/sandbox/'); vite.config.ts with no crawler excuse left; My configs' New surface at /sandbox/?new and a sandbox draft's Open at its own surface; radius.e2e.ts sweeping /sandbox/; tune-ui.spec's error-ink census widened by one on section 12's own row"
  - "src/lib/ui/sandbox-ui.spec.ts: six tests; e2e/sandbox.e2e.ts: two chromium titles; six negative checks red on their tests and restored by hash"
  - "COUNTS: 93 / 952 (+1 todo) at 5021d24 -> 94 / 958 (+1 todo) on the term +1 / +6 (sandbox-ui.spec 6), first run whole at --maxWorkers=2; e2e 80 / 96 -> 82 / 98 on +2 / +2 (both chromium, untagged), 98 runs green across the chunks and the reruns; check 636 -> 655 / 0 / 0; sweep 4 19 unmoved; radius allowlist 0 rows (29 declarations in 67 files, 23 exempt, the six circles at D-15's lines); lint clean; build green"
affects: [13-17 (SLOTS = 2 in the route and preview.ts's refusal of slots 3 - both flip when 255/4 is written and PUT BACK exists; the Sandbox lands five strings; Apply to ZONA goes in the bar's destination zone the route leaves empty; a saved sandbox copy's Open still lands on /sandbox/), 13-18 (forty-two ledger rows and six questions under From 13-16; the mode lines and the over line are the ones most likely to be rewritten), 13-20 (the Phase 13 offset +1 / +6, e2e +2 / +2, check +19; PREV-04's third reach is Play here - the intro's hero, the workspace's Play and the Sandbox's Play; BUILD-01 / 02 / 06 / 07 / 08 and KEEP-01 evidenced here and ticked nowhere; the allowlist at 0 rows with 23 exempt declarations)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A screen's interactions are a pure model with one immutable state value the components render and one method per edit, driven in node by the spec with no browser and no pointer event; the components are rendered with svelte/server against that state and scanned for the rules that are properties of the text"
    - "A dynamic route on the static host declares prerender = false and ssr = false and writes down the fallback path it takes (404.html boots the client, the client matches the route, load runs in the browser), rather than leaving the crawler to fail the build or the host to discover it"
    - "A refused keystroke is state beside the model, never in it: the field shows the typed text and its message while the surface keeps the last valid value, and every surface the model ever emits validates whole"
    - "A history coalesces by key and recency with a named boundary, and a stack that exists for one object says which other control is not it"
    - "A component prop named `state` is a store subscription in a Svelte template ($state reads as a store of the variable); the prop is `view`"

key-files:
  created:
    - src/lib/sandbox/editor.ts
    - src/lib/sandbox/history.ts
    - src/lib/sandbox/copy.ts
    - src/lib/sandbox/draft.ts
    - src/lib/sandbox/colour-knob.ts
    - src/lib/sandbox/preview.ts
    - src/lib/ui/sandbox/SurfaceEditor.svelte
    - src/lib/ui/sandbox/Palette.svelte
    - src/lib/ui/sandbox/ElementList.svelte
    - src/lib/ui/sandbox/RegionInspector.svelte
    - src/routes/sandbox/+page.ts
    - src/routes/sandbox/+page.svelte
    - src/routes/sandbox/[draftId]/+page.ts
    - src/routes/sandbox/[draftId]/+page.svelte
    - src/lib/ui/sandbox-ui.spec.ts
    - e2e/sandbox.e2e.ts
  modified:
    - src/lib/ui/shell/Rail.svelte
    - src/lib/ui/shell/Inspector.svelte
    - src/lib/ui/shell/layout.ts
    - src/lib/ui/shell/shell.svelte.ts
    - src/lib/ui/TuningRegion.svelte
    - src/lib/ui/tune-ui.spec.ts
    - src/routes/my-configs/+page.svelte
    - vite.config.ts
    - e2e/radius.e2e.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md

key-decisions:
  - "The interactions are a pure model (editor.ts) rendered by four components, because the vitest project is node-only and the plan's tests must dispatch no pointer-move: a model with no method a move could reach is the honest proof, and the components are rendered against it with svelte/server"
  - "/sandbox/[draftId]/ is prerender false and ssr false: the ids are minted in the visitor's browser, a prerenderable route the crawler never reaches fails the build (handleUnseenRoutes defaults to fail), adapter-static's fallback 404.html boots the client for it, and Cloudflare's not_found_handling 404-page serves that document with status 404 - the path /playground/<unknown>/ already takes; the e2e asserts the 404 and the page"
  - "The param carries the SURFACE's id (the draft's source) and draft.ts spells the store key; a surface id nobody has stored opens an empty surface under it, which is how /sandbox/ creates one"
  - "Area first makes a Fader (vertical when taller than wide, horizontal otherwise) and a one-cell box a Button - compatible by construction with model.ts's minimums - and the inspector's Type select is section 8's 'then choose'; question 1 asks whether a chooser at the region is wanted instead"
  - "Every creation fires from pointerdown so Playwright's click is one whole step; pointerup on another cell is the same call for that cell, so a drag is exactly two clicks; pointermove only records the hover cell for the proposed bounds"
  - "The field texts travel in the state (texts), not through a method prop: a method call on a non-reactive object is invisible to a template and the inputs never re-rendered when the selection moved - found by the e2e's first run, fixed before the commit"
  - "The Knob's circle is an SVG <circle>; the eight handles are SVG <rect>s; the plate's file declares no radius above zero and the allowlist stays at 0 rows"
  - "SLOTS = 2 in the route and preview.ts refuses slots 3: the meter renders the two-slot refusal (which string, by how much, and 'remove one kind') rather than hiding it; 13-17 flips both when 255/4 is written"
  - "Play builds a real Lua engine over the surface's own emitted strings under the pinned library (preview.ts) and delivers the finger through the page's SimHost with mapAxis - the third reach of PREV-04, not ticked"
  - "The first draft write waits for the first edit, so opening an empty surface leaves no Draft row in My configs (question 6)"
  - "Rail.svelte gained a children snippet and Inspector.svelte a lead snippet, both optional and additive, because page 3's palette needs a disabled-with-reason row and its Element name sits above the first section; no existing caller changed"
  - "tune-ui.spec's error-ink census admits RegionInspector.svelte on section 12's own row ('Error text - Validation and transfer errors'): the refused field is the tree's first validation UI, and X-01's rule (never a button, never a knob) holds"
  - "Two commits for the code, not one per task: the route mounts all four components and the editor owns the history, so task 01's plate without task 02's inspector would not run; the ledger is the second commit and a title-count fix the third"

patterns-established:
  - "src/lib/ui/sandbox/ is the fourth component directory under src/lib/ui/ (after intro/, shell/, library/); every tree-walking gate covers it automatically"
  - "A component prop is never named `state`"

requirements-completed: []
requirements-touched: [BUILD-01, BUILD-02, BUILD-06, BUILD-07, BUILD-08, PREV-04, KEEP-01]

# Metrics
duration: about 70 min of execution (01:01Z-02:10Z: the baseline run, the model and the history, four components, two routes, the spec, the e2e, three builds, six negative checks, the quick suite, the sweep, five e2e chunks and their reruns) plus this document and STATE.md
completed: 2026-09-12
---

# Phase 13 Plan 16: The Sandbox's Interface - Page 3, Built So a Mouse Is Optional Summary

**A surface can be built with clicks and typed numbers alone, its every structural edit undone and
redone, and its draft saved as it is edited - and the proof is a model the tests drive with no
pointer-move in it.** `editor.ts` holds the surface, the selection, the mode, the pending placement,
the focus cell, the field states and the history; `clickCell` is the one creation and selection call
(element first after the palette arms a kind; area first from two clicks on empty cells; a held cell
selects), arrows and Enter are the same call from the keyboard, and `editNumber` is the third route
- refusing through geometry.ts with the previous valid surface kept and the typed text beside its
message, so no invalid surface ever exists anywhere. The plate is one SVG: sixteen static guide
lines, regions as tinted rects with 1px boundaries and 11px uppercase names, the Knob as an SVG
`<circle>`, the selection as an action-colour outline plus eight square handles. The element list is
a real alternative to the plate; Play locks structure with named reasons and keeps the selection and
the history in both directions, and routes the finger to a real Lua engine running the surface's own
emitted strings. The meter says *"N of 908 · room for about M more"* from cost.ts and, on the two
slots the module holds until 13-17, renders the refusal for the surfaces that need three. The
`[draftId]` route is `prerender = false`, served by the fallback with status 404, and the e2e asserts
it. Term **`+1 / +6`** on 93 / 952: **94 / 958 (+1 todo)**, green whole on the first run; e2e **82 / 98**
on `+2 / +2`. **No device was touched.**

## The baseline, observed at start and at close

HEAD `5021d24` (13-15's summary). Observed before an edit was made, at `--maxWorkers=2`: **93 files /
952 tests (+1 todo)** (one transient red on the first run, `queue.spec.ts` "the deadline decides"
under load, 951 + 1 = 952; the brief's 93 / 952 is what was asserted against); e2e 80 titles by
`grep -c "test("`; check 636 / 0 / 0; sweep `4 19`; allowlist 0 rows. The plan's `92 / 926` and
`93 932` literals are stale, as the brief says.

| Count | Start (observed) | Close | Delta |
| --- | --- | --- | --- |
| quick suite | **93 / 952** (+1 todo) at `5021d24` | **94 / 958** (+1 todo), `check-counts 94 958` matches, green whole on the first run at `--maxWorkers=2` with no transient | **`+1 / +6`**: `sandbox-ui.spec` 6 |
| check | 636 / 0 / 0 | **655** / 0 / 0 | +19 files (six modules, four components, four route files, the spec, and the generated route types) |
| lint | clean | clean (prettier and eslint over the tree) | - |
| e2e | 80 titles / 96 runs | **82 / 98** - `grep -c "test("` 82 after the title-count fix (a regex's `.test(` had read as a third title); 98 runs green across the chunks and the reruns (below) | **`+2 / +2`**, both chromium, untagged |
| sweep | `4 19` | `4 19` RUN once at close, 19 green | 0 |
| radius allowlist | 0 rows; 18 declarations in 60 files, 12 exempt, 6 circles | **0 rows**; 29 declarations in 67 files, **23 exempt** (eleven `border-radius: 0` on this plan's controls, for layer C), 6 circles at D-15's lines; layer B 31 in 15 built stylesheets, 6 at 50% | 0 rows |
| build | `c305657`'s | green three times on this plan's tree, the last on `445c185` | `build/sandbox/index.html` emitted; no file for `[draftId]`, by design |
| vendor, oracle, library, lua-host, ROADMAP | - | `git diff --quiet` holds on all five | untouched |

## Commits

| Hash | Message |
| --- | --- |
| `8fdb7b5` | `feat(13-16): the Sandbox's interface - the plate with a static lattice and eight square handles, both creation paths by clicks alone, a keyboard route across the plate, the element list as a full alternative, Edit and Play preserving selection and history, the inspector whose refused keystroke never reaches the model, undo over every structural edit with keystrokes coalesced, the meter honest about two slots, the draft saved as it is edited, and a live preview in Play` |
| `7cc1d94` | `docs(13-16): the Sandbox's ledger - forty-two rows of HANGAR's own words in D-05's register, the PDF's and the Bible's listed as verbatim and not ledgered, and six questions for the user` |
| `445c185` | `fix(13-16): the surface address as one named pattern in e2e/sandbox.e2e.ts, so the file counts its two titles by grep and not a regex's .test() as a third` |

`git commit --only <paths> -F <message-file>`, pathspec before the flag; the sixteen new files
`git add`ed first. No push, no attribution, no trailer.

## The four creation routes, as tested

| Route | How | Where proved |
| --- | --- | --- |
| **Element first, click only** | `choose("knob")` arms the kind; `clickCell(2, 3)` places the 3 x 3 default with its top-left at the cell (pulled onto the surface if the default would run off the edge); the placed region is selected and the placement clears | spec test 2 (`placed`, the region's box, `selectedId`); e2e title 1 (palette `Fader` then one click at cell (1,1): `2 × 6 units`, `Column 2`, `Row 2`, eight handles, the list row raised) |
| **Area first, click only** | with nothing armed, `clickCell(7, 0)` on an empty cell is `started`; `clickCell(8, 5)` is `placed` with the box between them - a vertical Fader 2 x 6; the far corner first gives the same box (a horizontal 4 x 2 from (0,8) and (3,7)); a one-cell box is a Button | spec test 2; e2e title 1 (two clicks at (5,1) and (7,4): `3 × 4 units`, `Column 6`, `Row 2`, the proposed rect visible between them) |
| **The keyboard route across the plate** | `setFocus`, `moveFocus(3, 0)`, `moveFocus(1, 0)`, `mark()` places the armed Button at (4,0); `mark()` on an empty cell starts an area and `moveFocus(1, 1)` + `mark()` ends it; the focus clamps at the edges; the plate's handler wires ArrowLeft / Right / Up / Down, Enter, Escape, Delete; the proposed bounds draw from the focus cell | spec test 2 (behaviour and the source's seven `case` labels; the proposed rect rendered from the focus cell) |
| **The numeric route** | `editNumber("col", "4")` moves the region to col 3 through the door; `"w", "3"` resizes; every keystroke validated; `Column`, `Row`, `Width`, `Height` in the inspector's 2 x 2 grid | spec tests 5 and 6; e2e title 1 (`Width` typed `3` then `12` then `2`) |

**No pointer-move, proved two ways** (spec test 2): `Object.getOwnPropertyNames(SandboxEditor.prototype)`
carries no name matching `pointer|drag|hover`; and the plate's `onpointermove` handler, sliced from
the source, contains no `onclick(` call - it assigns `hover = cellOf(event)` and nothing else. The
click path is asserted to fire from `onpointerdown`. Negative check N1 (a move required before a
click places) turns test 2 red on `expected 'refused' to be 'placed'`.

**The element list is a complete alternative** (spec test 3): three regions placed; for each id
`editor.select(id)` - what a row's Enter or click does and nothing else - then the list renders one
`aria-current="true"` row on that id with `{name}, {kind}` as its name, the plate renders one
selection group with eight handles and the outline `<rect>` at the region's own `x` / `y`, and the
inspector's headline, eyebrow (`SELECTED ELEMENT / KNOB`) and units chip re-target. Three selections
add zero history entries. The rows are `<button>`s; ArrowDown / ArrowUp / Home / End walk them and
Delete deletes. Negative check N2 (the row's `onclick` removed) turns test 3 red.

## The `[draftId]` route on the static host, answered

`src/routes/sandbox/[draftId]/+page.ts`:

- **`prerender = false`, overriding the layout's `true`.** The surface ids are minted in the
  visitor's browser and live in the visitor's store, so there is no `entries()` to export (contrast
  `/playground/[id]/`, whose ids are the catalog's and are prerendered one file each). A route marked
  prerenderable that the crawler never reaches fails `vite build` - Kit's `handleUnseenRoutes`
  defaults to `"fail"` (`node_modules/@sveltejs/kit/src/core/postbuild/prerender.js:177`, read) - so
  the honest declaration is not prerenderable, and the build emits no file for it
  (`build/sandbox/` holds `index.html` only).
- **The fallback is `404.html`** (`vite.config.ts`: `adapter({ fallback: "404.html" })`), and
  Cloudflare's static assets serve it with **status 404** for any path no file matches
  (`wrangler.jsonc`: `not_found_handling: "404-page"`). That document boots the SvelteKit client, the
  client router matches `/sandbox/[draftId]/` and runs `load` in the browser. It is the path an
  unknown `/playground/<id>/` already takes (`e2e/first-experience.e2e.ts:461` asserts the 404 and
  the page). `e2e/sandbox.e2e.ts` asserts the same for a surface's address: `request.get(url)` is
  404 and the page is real.
- **`ssr = false`**: there is no server to render it and the load reads nothing a server could; the
  fallback document carries the layout's frame and the page fills the rest with its effect.
- The param carries the SURFACE's id (the draft's `source`); `draft.ts` spells the store key
  `sandbox:{id}`. An id nobody has stored opens an empty surface under it - which is how `/sandbox/`
  creates one: it mints an id (`mintSurfaceId`, the moment in base 36 plus entropy) and goes there
  with `replaceState`, or resumes the newest sandbox draft; `?new` forces a fresh one (My configs'
  `New surface`).
- Chromium logs the document's own 404 as a resource error; the e2e's console census excuses exactly
  that one line by its location (the surface's address) and asserts the status directly instead.

## The history's coalescing boundary

`history.ts` section 2, stated in the header and driven in spec test 6: an edit may carry a
**coalesce key** - `field:{regionId}:{field}` for a numeric field (and for the name and the colour) -
and while the most recent entry is OPEN under the same key, a new edit under that key REPLACES its
`after` instead of pushing; the entry keeps the `before` from the first keystroke and the `after`
from the last. The boundary that closes the entry, `seal()`, is reached when **focus leaves the field
or the value commits (Enter)** - the inspector's blur and Enter call `commitField()` - when **any
edit under a different key or with no key lands**, and when **undo or redo runs**. `setMode` seals
too, so a keystroke after a Play round trip is a new entry. By key and by recency, never by time.
Test 6: `h` typed `1` then `7` is one entry whose `before` has h 2 and whose `after` has h 7 and no
entry anywhere carries h 1; the `History` class alone coalesces under one key, splits on another,
splits after `seal()`, and does not merge into an entry undo has sealed. Negative check N5 (the
merge disabled) reads `resize (two keystrokes, one entry) is one entry: expected 4 to be 3`.

**Undo covers everything structural** (test 6): place, move, resize, rename, recolour, duplicate and
**delete**, each one entry (`entries.map(kind)` asserted as the seven), undone all the way down to
the empty surface with every step landing on the snapshot before it, redone all the way up, and the
deletion undone once more re-selecting the region it restores. A new edit after an undo drops the
future. The depth is the same after a mode round trip. Negative check N6 (the delete's `record`
removed) reads `delete is one entry: expected 6 to be 7`. **This is not `Undo randomize`**: the
header's section 3 names 13-10's one stored vector and says why neither is a half of the other, and
`TuningRegion.svelte`'s paragraph now names `src/lib/sandbox/history.ts` back (the spec asserts both
directions; tune-ui.spec's own title stays green).

Selection is never an entry; the SURFACE's rename is not an entry either (question 5).

## Validation preserves, and the model is never transiently invalid

Spec test 5: a 2 x 6 fader at (0,0); `editNumber("w", "12")` returns false, the model holds 2,
`fields.w` is `{ text: "12", message: GEOMETRY_COPY.offSurface("w") }`, `fieldText("w")` and the
state's `texts.w` are `"12"` while `texts.h` is the model's `"6"`; the inspector renders the field
with `value="12"` and `aria-invalid="true"` and the message under it. A second refused keystroke
(`""`) keeps a message (`Type a whole number.`); `commitField()` does not silence it; `"3"` validates,
moves the model and clears it. Every rule refuses with its own sentence and the same preservation:
`h` below a vertical fader's two rows (13-15's line), a controller past 127, a word, a channel of 0,
a column of 0 through the door (`Column 1` is col 0), and an overlap with §16's line verbatim naming
the other region (`This region overlaps Fader 1. Choose another area or resize it.`). Then the part
the plan underlines: every surface the editor EMITTED over the whole test (more than ten) validates
whole - the cell map builds and every region validates against the others - and none carries a
refused value; every history entry's `before` and `after` validate too. Negative check N4 (the raw
patch written into the surface and emitted before validation) turns the emitted-surfaces loop red
(`expected false to be true` on `wholeSurfaceValid`).

## The cap as shipped, and the two-slot refusal as rendered

**Sixteen is the ceiling** (schema.ts's `SURFACE_ELEMENT_CAP`, D-14 Q4; 13-15 closed 13-14's finding -
the dearest sixteen fit at 882 - so the cap at the dearest literals is sixteen, not fifteen). Spec
test 6 places sixteen one-cell buttons by two clicks each; `atCap` is true; `choose()` returns false;
the palette renders four `disabled` rows each with `aria-describedby` on the one reason paragraph
carrying `GEOMETRY_COPY.cap(16)` - *This surface holds 16 elements, the most a page can carry.
Remove one to add another.*; `duplicate()` returns `{ ok: false, reason: "cap" }` and the inspector
says `DUPLICATE_AT_CAP`. In Play the same four rows are disabled with `PLAY_LOCKS_PALETTE` (test 4).

**The meter** (the route, after the inspector's last section): 13-10's two `BudgetMeter`s for the
Setup and the Timer from `costOf(surface, { slots: SLOTS })` measured under the pinned minifier at
the picker corner, reached through `await import("$lib/sandbox/cost")` after the plate has painted,
debounced 120 ms, stale results dropped by generation; beneath them the sentence *"N of 908 · room
for about M more"* with N the larger of the two strings and M `roomFor`, or *"N of 908 · no room for
another"* at zero, or - when `fits` is false - `overLine`: *"Timer is 1013 of 908, 105 over. Two
events can’t hold this mix of element kinds; remove one kind to fit."* in the error ink. **`SLOTS` is
2** in the route with the comment naming 13-17: HANGAR does not write 255/4 yet, so the Sandbox emits
against the two slots the module holds today, and on two slots a Knob beside an XY pad and the PDF's
own page 3 do not fit (13-15's measured ceiling) - the meter renders that, it does not hide it.
`preview.ts` refuses `slots: 3` for the same reason (the preview would run a string the module does
not hold). The e2e asserts the room line lands on a two-fader surface.

## The Knob's primitive, the handles, the allowlist

The Knob's circle on the plate is an **SVG `<circle>`** (`SurfaceEditor.svelte`, with a radial
pointer `<line>` at 12 o'clock) - a true circle by construction, not a box with a radius. D-15's
exemption is for `border-radius: 50%` on square boxes in two CSS files; a circle element is not a
border-radius at all, so the plate's file declares no radius above zero and needs no allowlist row.
The eight selection handles are SVG `<rect>`s, 8 x 8 (`SANDBOX_HANDLE`), at the corners and edge
midpoints of the selected region, filled in the action colour with a workspace-coloured hairline;
the outline is a 1px action-colour `<rect>` (`vector-effect: non-scaling-stroke`, so every stroke is
1px at any plate size). **The allowlist: 0 rows** - 29 declarations in 67 files, 23 exempt (this
plan's eleven `border-radius: 0` on inputs, selects, the checkbox and the buttons, so layer C's
user-agent sweep finds them square), the six circles at D-15's lines, unchanged. Layer B on the
fresh build: 31 declarations in 15 built stylesheets, 6 at 50%. Layer C now sweeps `/sandbox/` too
(`radius.e2e.ts`: a knob placed by the palette and one click, the popover opened), green in both
engines in chunk 5.

## The static lattice, the mode switch, Play

The lattice is sixteen `<line>`s in one `<g class="guides">` written by the template and retained
by the compositor - never a frame loop, never 81 stroked rects (test 1 asserts the sixteen lines and
that the component names neither `requestAnimationFrame` nor `strokeRect`). The class is `guides`
(the PDF's "light guides"): `.lattice` is 13-04's retired texture vocabulary and instrument.spec.ts's
scan 6 said so on the first run.

**Edit / Play** (test 4, both directions; e2e title 2): a radiogroup of two real radios in labels
with the persistent mode line under it (`MODE_LINE_EDIT` / `MODE_LINE_PLAY`). In Play: the palette's
four rows `disabled` with the reason; no handles and no selection group on the plate; every numeric
field `readonly` with `aria-describedby` on `PLAY_LOCKS_FIELDS`; Duplicate / Delete element and Undo
/ Redo disabled; `editNumber`, `remove`, `undo`, `choose` return false; the selected id and the
history depth unchanged. Back in Edit: the same region selected, the same depth, eight handles, the
palette enabled; an edit lands on top of the same history. Then the other direction with the other
region. Negative check N3 (`setMode` clearing the selection) turns test 4 red.

**Play routes the finger to the preview** - PREV-04's third reach after the intro's hero (13-07) and
the workspace (13-09), not ticked, 13-20 decides. Entering Play awaits `preview.ts`'s
`createSurfaceEngine(surface)`: `emitSurface` under two slots, `createLuaHost` over `TOUCH_LIBRARY`
and `TOUCH_LIBRARY_TIMER` with the one stand-in runtime.spec.ts uses (`self.tim=__hangar_timer ` in
front of the Setup, because the touch element's `tim` is the stored Timer on the module), wrapped in
`LuaPadSim`; the route registers it with its one `SimHost` under a `PadCanvas` rendered beneath the
SVG (`preview` snippet), sets it hero, and the plate's wrapper hands every pointer sample to the
host through `mapAxis` - tick-locked as the workspace's. Leaving Play unregisters it. The e2e waits
for the canvas at 9 x 9, presses the button's cell and releases, and asserts no element was placed
and no console error. **So 13-13's question is answered: a sandbox picture CAN light through the
strings 13-15 made** - `preview.ts` is the engine; My configs' sandbox thumbnail is not wired to it
here (the table registers engines by listed catalog entry; a record-keyed registration through
`preview.ts` is about fifteen lines in the route and is left, named under Known Stubs).

## The draft, and whether the wiring serves the Playground

Every change with a moved surface schedules a write 250 ms later: `saveSurfaceDraft(local(),
surface, now)` → `writeDraft` under `sandbox:{surface.id}` with the record shape 13-13 defined
(`surfaceRecord`); the context bar's `draft` clause reads `Draft saved locally` (drafts.ts's own
word) once a write lands and **`DRAFT_UNSAVED`** - *Your browser refused to store this draft. It
lives in this tab only.* - when the store refuses, the session going on unsaved with no dialog. The
first write waits for the first edit (question 6). On return `readSurfaceDraft` loads it without an
entry; `/sandbox/` resumes the newest; My configs lists it as `Draft` with `Open` at its own address
(e2e title 1 walks all of it: reload, `/sandbox/`, My configs, `Open`). The route also passes
`device: install.phase` so the bar carries both clauses, as 13-11 shaped it, and no destination -
Apply to ZONA is 13-17's.

**The same wiring would serve a Playground draft.** `drafts.ts` is already kind-generic
(`playground:{entry}` beside `sandbox:{surface}`); what the workspace lacks is a caller that writes
its knob vector through `writeDraft` on change and reads it back on open - the shape of
`saveSurfaceDraft` / `readSurfaceDraft` with a `PlaygroundRecord` in place of a `SandboxRecord`, one
function each way and a debounce. `draft.ts`'s header says so; 13-13's question 5 (who wires it)
stands and this plan does not answer it for the Playground.

## "Follow hardware selection" is deliberately absent

Section 8 offers it as optional and defaults to keeping the inspector stable. **ZONA has one touch
element** (element 0; the system element is 255), so there is no hardware selection to follow: the
module never reports "the user touched element 3" because there is no element 3, and the option
would be a control that can never change anything. Said in code in `editor.ts` section 3,
`SurfaceEditor.svelte`'s header ("this is where a reader would look for it") and
`RegionInspector.svelte`'s header; nothing in the Sandbox listens to the device.

## Every ledgered string

Forty-two rows under "From 13-16" in `13-COPY-NEW.md`, each with the state, the fact, the string and
the Bible line: `TITLE`, `OPENING_LINE`, `STATUS_LINE`, `EMPTY_SECOND_LINE`, `STARTER_ACTION`,
`TEMPLATE_ACTION`, `TEMPLATE_FADER_NAME` / `TEMPLATE_BUTTON_NAME` (the PDF's `Filter` and `Hold`),
`defaultName`, `paletteAddName`, `PLAY_LOCKS_PALETTE`, `PLAY_LOCKS_FIELDS`, `MODE_LINE_EDIT`,
`MODE_LINE_PLAY`, `DRAFT_UNSAVED`, `SURFACE_NAME`, `RENAME_SURFACE` / `renameSurfaceName`,
`PLATE_NAME`, `placeInstruction`, `AREA_START`, `selectedLine` / `NOTHING_SELECTED` / `cellLine`,
`listRowName`, `LIST_EMPTY`, `NO_SELECTION_EYEBROW` / `_HEADLINE` / `_LEDE`, `ORIENTATION_VERTICAL` /
`_HORIZONTAL`, `LATCH` / `LATCH_HELPER`, `CC_NUMBER_Y`, `COLOUR_LABEL`, `WHOLE_NUMBER`, `CC_RANGE`,
`CHANNEL_RANGE`, `DUPLICATE_NO_SPACE`, `DUPLICATE_AT_CAP`, `roomLine`, `ROOM_NONE`, `overLine`,
`MEASURING`, `savedLine`, `SAVE_REFUSED`, `copyName`. The PDF's page 3, §8's instruction and section
names, §16's overlap line and drafts.ts's `Draft saved locally` are listed there as verbatim and not
ledgered. Six questions follow (below).

## The six negative checks

Every one from a scratch copy of the shipped file (`1316-neg.mjs`), the replacement asserted to
match exactly once, the spec run, the file restored by copy-back with sha256 compared either side -
identical each time. No `git checkout`, `git restore`, `git stash` or `git clean` was run.

| # | Check | Red on |
| --- | --- | --- |
| N1 | a pointer-move required before `clickCell` places | test 2 first: `expected 'refused' to be 'placed'` (tests 3-6 red behind it, every one placing) |
| N2 | the element list display-only (the row's `onclick` removed) | test 3: the source no longer contains `onclick={() => onselect(region.id)}` |
| N3 | the selection cleared on a mode switch | test 4: the inspector renders no selected fields in Play (`field-col ... readonly` not found); test 6 behind it |
| N4 | the raw value written into the surface and emitted before validation | test 5: `wholeSurfaceValid` false on an emitted surface - the no-intermediate-invalid-state loop |
| N5 | each keystroke its own entry (the merge disabled) | test 6: `resize (two keystrokes, one entry) is one entry: expected 4 to be 3` |
| N6 | delete skipped in the history | test 6: `delete is one entry: expected 6 to be 7` |

## The full chunked e2e result

Five chunks on fresh detached servers (`e2e-chunks-1208.sh`, `sandbox.e2e.ts` added to chunk 4), on
the build of the committed tree `445c185`, at 0.09-0.79 GB free memory:

| Chunk | Files | Result |
| --- | --- | --- |
| 1 | install, session | 31 + 3: `[chromium] install.e2e.ts:838` (writes 8 for 7) and `:1372` (CONFIG/EXECUTE 5 for 4) - the gate's own "writes retried under three workers"; `[webkit-phone] install.e2e.ts:1902` CLEAR (the brief's transient). **All three green alone at `--workers 1`**: `:838` and `:1372` in the first rerun; `:1902` chromium in the second rerun and webkit in a third, `--project=webkit-phone` |
| 2 | browse, browse-webkit | first run 5 + 16: **wrangler died mid-chunk** (the empty `ERROR` block, `ERR_CONNECTION_REFUSED`), not the suite; **rerun whole 19 + 2**: `[chromium] browse.e2e.ts:248` and `[chromium] browse-webkit.e2e.ts:293` (`browse-grid` not visible in 5 s on the cold server) - **both green alone at `--workers 1`** |
| 3 | tuning, tuning-webkit | **20 passed** (1.2 m) |
| 4 | catalog, fidelity, first-experience, library, **sandbox** | first run 5 + 7: **wrangler died mid-chunk** (`ERR_CONNECTION_REFUSED`, `ERR_NETWORK_CHANGED`); **rerun whole 12 passed** (34.5 s) including both sandbox titles |
| 5 | artifacts, radius, skeleton, smoke | **11 passed** (26.1 s) - radius layer C over `/sandbox/` in both engines |

34 + 21 + 20 + 12 + 11 = **98 runs, 82 titles**, every red rerun alone or as its chunk and green.
Before the chunks, `sandbox.e2e.ts` ran green alone three times on its own server (22.1 s) after
two red first runs that found real defects (below).

## Deviations from the plan

**1. [Design, inside the plan's words] `src/lib/sandbox/editor.ts`, `copy.ts`, `draft.ts`,
`colour-knob.ts` and `preview.ts` - five modules the plan's file list does not name.** The vitest
project is node-only, and the plan's tests must dispatch no pointer-move and drive a keyboard route:
the only honest way is a pure model the components render and the spec drives (13-09's
`tune/model.ts` + `TuningRegion` shape). `copy.ts` is the import-free word module the ledger points
at; `draft.ts` the store wiring; `colour-knob.ts` the door that lets 13-09's Swatch be reused
unchanged; `preview.ts` the engine Play needs. Commit `8fdb7b5`.

**2. [Rule 3 - Blocking] `Rail.svelte` gains `children` and `Inspector.svelte` gains `lead`.** The
palette's `+` must be disabled with a reason and the list needs its own keyboard model - neither is a
`RailRow`; and page 3 draws `Element name` above the first section, which the inspector's body
could not place. Both snippets optional and additive; every existing caller unchanged; shell.spec's
five renders green.

**3. [Rule 1 - Bug, in this plan's own draft] the inspector's fields never re-rendered on a
selection change.** `value={fieldText(field)}` read a method on a non-reactive object, invisible to
the template; the e2e's first run read `Column 2` on the second region. The texts now travel in the
state (`EditorState.texts`) and the prop is gone. Fixed before the commit; the spec asserts
`state().texts.w`.

**4. [Rule 1 - Bug, in this plan's own draft] a prop named `state`.** `$state<...>()` in a component
whose prop is `state` is parsed as a store subscription of the prop; svelte-check said so. The prop
is `view` (patterns-established).

**5. [Rule 3 - Blocking] `.lattice` is retired vocabulary.** instrument.spec.ts scan 6 fails any rule
naming `.lattice` (13-04, D-09); the plate's group is `.guides`, the PDF's "light guides".

**6. [Design, stated] tune-ui.spec's error-ink census widened by one** to admit
`RegionInspector.svelte`, on section 12's own row ("Error text - Validation and transfer errors"):
the refused field's boundary and message are the tree's first validation UI; X-01's rule holds (never
a button, never a knob). The route's over line also uses the ink (routes are outside that walk).

**7. [Rule 2 - Missing critical functionality] the mode switch's labels carry test ids
(`segment-edit` / `segment-play`).** The radios are `sr-only`; Playwright's `check()` on one was
intercepted by the plate's SVG. The label is the click target.

**8. [Scope, additive] `e2e/radius.e2e.ts` sweeps `/sandbox/`** (a knob placed, the popover opened),
so D-01's layer C covers the plate, the fields, the selects and the checkbox in both engines. The
title count is unchanged.

**9. [Scope, additive] `src/routes/my-configs/+page.svelte`**: `New surface` goes to `/sandbox/?new`
(the front door would otherwise RESUME the newest draft, which is not what the button says) and a
sandbox DRAFT's `Open` goes to its own surface; a saved sandbox copy's `Open` still lands on
`/sandbox/` until 13-17 gives a copy a way back onto a surface.

**10. [Process] two code commits, not one per task, plus a fix.** The route mounts all four
components and the editor owns the history, so task 01's plate without task 02's inspector would not
run; `8fdb7b5` is both tasks' code, `7cc1d94` the ledger, `445c185` the title-count fix (a regex's
`.test(` had made `grep -c "test("` read 83).

**11. [Scope] BUILD-01 / 02 / 06 / 07 / 08, PREV-04 and KEEP-01 are evidenced and not ticked** -
every plan of this phase has left REQUIREMENTS.md to the gate; `requirements mark-complete` was not
run for the reason `gsd-tools state` was not. CAT-04 stays `[ ]`.

**12. [Process] `gsd-tools state` commands not run.** STATE.md by script against a copy with every
touched line asserted and `status`, `completed_phases 11`, `percent 100`, `total_plans 160`,
`completed_plans 152` unchanged; Phase 13 to 16 of 20 beside Phase 12 and Phase 12.1 (both gate
landed, bench pending).

## Anything the plan asserts that the tree does not support

- The plan's `PREV_FILES 92 / PREV_TESTS 926` and `check-counts 93 932`: the tree stood at 93 / 952;
  `94 958` was asserted.
- The plan's "two routes, four components, one history module": true, plus the five modules of
  deviation 1 - a plan that names only `history.ts` under `src/lib/sandbox/` leaves the model,
  the words, the draft wiring, the colour door and the preview engine with no file.
- The plan's "the meter says which string is over and by how much" (13-15's hand-off): `overLine`
  names the string and the excess; under two slots `mapmode` is undefined and never over.
- The plan's "If 13-14 found a cost above 908 before sixteen, the cap is that number": 13-15 closed
  that finding (882), so the cap is sixteen and no lower number was needed.
- The plan's "`src/lib/ui/radius.spec.ts` in the file list": not edited - the allowlist was already
  empty and no row was needed; the spec prints 0 rows (above).
- The plan's `13-VALIDATION.md` row "two chromium titles (place/select/edit, Edit↔Play)": as
  shipped, both untagged.
- The brief's "the plan's `92 / 926`, `93 932` literals are stale": confirmed.
- 13-13's "a sandbox record is unlit until 13-15": the engine exists now (`preview.ts`); the table is
  not wired to it here (Known Stubs).
- The plan's test 3 wording "select every region from the list with the keyboard alone": in node the
  keyboard cannot be pressed; the spec drives what Enter on a row calls (`editor.select(id)`) and
  asserts the rows are `<button>`s with the arrow handler in the source; the e2e presses Enter on a
  focused row.

## Known Stubs

- **My configs' sandbox thumbnail is still unlit** (13-13's stub): `preview.ts` now builds an engine
  from a surface, but `LibraryTable`'s registration is keyed on a listed catalog entry and the route
  does not build one for a sandbox record. About fifteen lines in `/my-configs/+page.svelte`; left
  for 13-17 (which touches the record's Open) or 13-20 to place, and named here rather than
  half-wired.
- **The preview runs two slots only** (`preview.ts` refuses `slots: 3`), as the module does until
  13-17; not a placeholder, a refusal with its reason.
- **The context bar's destination zone is empty on the Sandbox** (the bar renders "Preview without
  hardware"): Apply to ZONA for a surface is 13-17's.

## Questions for the user

Six, in `13-COPY-NEW.md` under "From 13-16": (1) the area-first kind - a Fader or a Button by the box,
or a chooser at the region; (2) the over line naming "kinds"; (3) the two mode lines, or one word
each; (4) a recolour coalescing until the next edit rather than per popover; (5) the surface's
rename outside the history; (6) the first draft write waiting for the first edit.

## For 13-17, 13-18, 13-20

- **13-17**: `SLOTS` in `src/routes/sandbox/[draftId]/+page.svelte` and `preview.ts`'s refusal of
  `slots: 3` both flip when 255/4 is written and PUT BACK exists; the route hands the bar no
  `destination` - Apply to ZONA goes there; `saveCopy` writes a sandbox copy whose `Open` lands on
  `/sandbox/` (give a copy a way back onto a surface); `emitSurface` is reached from the route only
  through `cost.ts` and `preview.ts`, both by `await import()`.
- **13-18**: forty-two rows and six questions under "From 13-16"; the mode lines and the over line
  are the two most likely rewrites.
- **13-20**: the Phase 13 offset's term from this plan is `+1 / +6`, e2e `+2 / +2`, check +19
  (636 -> 655); PREV-04's three reaches are the intro's hero (13-07), the workspace's Play (13-09)
  and the Sandbox's Play (here, `preview.ts`, delivered through the host's `touchDown` /
  `touchMove` / `touchEnd`); the allowlist at 0 rows with 23 exempt declarations; `deferred-items.md`
  carries the unlit sandbox thumbnail.

## The runbook and the bench

No device was connected to, written to or deployed to by this plan. Nothing was installed. CAT-04
stays `[ ]`. `.planning/ROADMAP.md`, `12-touch-framework/`, `12.1-gradient-touch/`, `src/vendor/`
untouched; `library.ts` and `lua-host.ts` read, never edited; `firmware-oracle.spec.ts` green and
unedited; no `git checkout`, `git restore`, `git stash` or `git clean` was run; every restore was a
copy back with the hash compared. The three untracked root files are the user's.

## Self-Check: PASSED

- `src/lib/ui/sandbox/SurfaceEditor.svelte` (contains `<circle`, `surface-handle`, `class="guides"`, 650+ lines) - FOUND
- `src/lib/sandbox/history.ts` (contains `COALESCING BOUNDARY`, `Undo randomize`) - FOUND
- `src/lib/ui/sandbox/RegionInspector.svelte` -> `src/lib/sandbox/editor.ts` -> `geometry.ts` via `applyEdit` / `validate` - FOUND
- `src/routes/sandbox/[draftId]/+page.svelte` -> `src/lib/sandbox/draft.ts` -> `src/lib/store/drafts.ts` via `saveSurfaceDraft` / `writeDraft` - FOUND
- `src/routes/sandbox/[draftId]/+page.ts` contains `prerender = false` - FOUND
- `.planning/phases/13-gui-overhaul/13-COPY-NEW.md` contains `## From 13-16` - FOUND
- commits `8fdb7b5`, `7cc1d94`, `445c185` - FOUND in `git log`
- `+1 / +6` observed as 94 / 958 (+1 todo); e2e 82 / 98; sweep 4 19; check 655 / 0 / 0; allowlist 0 rows
