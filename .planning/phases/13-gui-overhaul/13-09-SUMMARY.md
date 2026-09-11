---
phase: 13-gui-overhaul
plan: 09
subsystem: ui
tags:
  [
    workspace,
    pdf-page-5,
    inspector,
    schema-driven,
    widget-for,
    select,
    segmented,
    per-field-reset,
    changed-marker,
    swatch,
    popover,
    dialog,
    colour-picker,
    d-21,
    reflow,
    resize-observer,
    coverflow-deleted,
    front-door-deleted,
    chosen-panel-deleted,
    name-plate-deleted,
    shell-bridge,
    reactivity-defect,
    prev-04,
    radius-allowlist,
    e2e-re-aim,
    wrangler,
    counts,
    negative-check,
    copy-ledger,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 08
    provides: "PREV_FILES 88 / PREV_TESTS 904 (+1 todo) / 78 e2e titles / 94 runs / check 612 / sweep 4 19 / catalog 26 = 8 + 18 / allowlist 10 rows, 23 declarations observed at 2f109a8; /playground/[id] exists and src/routes/c/[id]/ does not (D-20); FOR_LABELS; Header and Nav wrap below 768; twelve titles in browse.e2e.ts; touchRecent assigned to this plan; the five-chunk harness in the scratchpad"
  - phase: 13-gui-overhaul
    plan: 05
    provides: "the shell: Inspector.svelte's eyebrow / headline snippet / lede / sections / actions, Rail.svelte's sections / selected / lead / note / action, layout.ts's numbers, and the finding that the 380 floor cannot hold the 2 x 2 grid (454 needed)"
  - phase: 13-gui-overhaul
    plan: 06
    provides: "library.ts's saveCopy (a named copy, never over its source), recent.ts's touchRecent, drafts.ts"
  - phase: 13-gui-overhaul
    plan: 07
    provides: "FrontDoor without its splash; the hero is Aurora; the two opening-window tests and the ring order left for this plan; PREV-04's first half"
  - phase: 13-gui-overhaul
    plan: 04
    provides: "motionDeps() injected at Coverflow.svelte:681 (gone with the file); aesthetic.spec.ts scan 4 kept for this plan to delete by name"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01, D-03, D-05, D-08, D-10, D-14 Q5 / Q11c, D-15 (six circles by file and line), D-20 (move-clean), D-21 (reflow - the user's answer for this plan)"
  - phase: 12-touch-framework
    plan: 05
    provides: "INTEGER_WORD_ROW_MAX and the shape of tune-ui.spec.ts as 12-05 left it (read only)"
provides:
  - "THE WORKSPACE IS PDF PAGE 5 AT /playground/[id]/ ON THE SHELL: a rail of nearby configurations (the browse-return set, else the front-door membership, this entry always in it), the centre with EXPLORE / {FOR label}, the name, the Configure / Play switch, the sentence, the surface at the PDF's square with the ZONA line and the live X / Y readout, 13-10's monitor slot named and empty, the fidelity line, and Phase 7's install column under the surface until 13-11; the inspector handed to the shell as a snippet and gated on the stamp landing; touchRecent on open; Save copy / Save a copy through library.ts; Share snapshot as the existing stamp"
  - "THE SCHEMA-DRIVEN INSPECTOR: TuningRegion.svelte renders Inspector.svelte with CONFIGURATION, one constant two-line headline, the PDF's lede, and Behavior / Appearance / MIDI output partitioned from widgetFor's twelve kinds (MIDI by id: cc, ccBase, channel, send), a section omitted when empty, no Advanced section with section 7's boundary quoted in the header, Randomize / Reset settings under Behavior, the two meters under TUNING, one live region, and the dynamic await import of $lib/tune/model kept"
  - "THE 4/5 BOUNDARY AS A RENDERING CHANGE: KnobWidget gains select; SEGMENTED_MAX = 4 beside WORD_ROW_MAX = 8; a worded knob is a row of segmented radios up to four options and a real <select> from five to eight; no knob's options moved; SEVEN knobs cross the line, listed below by entry and id"
  - "THE MARKER AND THE PER-FIELD RESET: view.index !== view.default shows a 6px ink square with a hidden sentence and enables a Reset named for the field, present on every row and disabled at the default; Reset settings (RESET_ALL) survives beside it; proved on a real tuner with the other fields read back unmoved"
  - "D-21 AS BUILT: the inspector keeps its 380 floor; the MIDI grid is two columns when the inspector is at least layout.ts's NUMERIC_GRID_REFLOW (454) wide and one below, answered by a ResizeObserver on the grid's own box (box + 2 x INSPECTOR_INSET), the number written once in layout.ts and in no component - asserted by tune-ui.spec.ts test 7"
  - "THE PICKER MOVED, NOT REWRITTEN: Swatch.svelte draws the PDF's swatch rows (34 x 34, the exact hex, Edit color) and one <dialog> opened with showModal() holding ColourPicker.svelte; the picker's diffstat is +18 / -8 with no arithmetic line touched; its three circles stay round at :840 / :867 / :882 and Knob's three at :730 / :785 / :807 (D-15 amended with both); layer A six, layer C 60 measured square in both engines"
  - "THE COVERFLOW OUT OF THE TREE: FrontDoor.svelte, Coverflow.svelte, ChosenPanel.svelte, NamePlate.svelte, src/lib/coverflow/slots.ts and slots.spec.ts deleted with git rm, every title that pinned them quoted below; PadSpinner.svelte KEPT with three live consumers (the research's 'deletable' named as a defect); NamePlate deleted (its one consumer was the coverflow)"
  - "THE SHELL BRIDGE MADE REACTIVE (a 13-05 defect this plan's e2e found): shell was $state.raw({ fill }) and a property write on a raw-state object is not tracked, so no route's snippets ever reached the frame on a served build - the gallery's rail and the intro's Quick guide were absent too; the fill is now a raw-state variable behind shell.fill's getter and setter, and every slot renders"
  - "COUNTS: 88 / 899 (+1 todo) measured green on the tree before 12.1-02 landed = 89 / 910 (the tree after 12.1-01) - 1 / - 11; the plan's -1 / -6 is -1 / -11 on the tree (slots.spec -8, aesthetic scan 4 -1, front-door -2, tune-ui +2), stated in parts; e2e 78 / 94 in and out, five chunks on fresh detached servers, every red rerun alone and named; check 610; sweep 4 19; allowlist 10 rows / 23 -> 4 rows / 7"
affects:
  - "13-10 (the monitor bar's row is data-testid=monitor-slot under the surface; Randomize's scope rule and Undo; MixTwo's row and the census; the context bar's status zone on the workspace is empty until the draft sentence exists; tune-ui.spec.ts is at 11 with Swatch the tenth component)"
  - "13-11 (the shell's connection slot is filled PROVISIONALLY with DeviceSlot from the workspace route with panelOwnsProse false - replace it; the install column under the surface is Phase 7's and moves to the context bar; the session walk's gallery hops)"
  - "13-12 / 13-13 (Save copy writes copy:{id}:{moment} records named '{name} copy' through library.ts - rename is 13-13's; the rail's Save a copy is the same call)"
  - "13-16 (the Sandbox's Edit / Play switch is the second switch; nothing is locked on a catalog entry - that is the Sandbox's rule)"
  - "13-18 (eight rows and six questions ledgered; the inspector headline per entry is question 1)"
  - "13-19 (copy.ts untouched: SURPRISE ME / RESET ALL / COPY LINK / LINK COPIED survive there; the inspector's words live in inspector-copy.ts; HOLD / HELD unchanged; the TUNING caption still imported by the region as copy.spec.ts requires)"
  - "13-20 (the counts; PREV-04's second half reached here and not ticked; the shell bridge finding; the e2e transient under three workers and its cure)"
  - "12.1-05 and 12.1-08 (Coverflow.svelte:520 no longer exists - the mapAxis call the plans name lives in src/routes/playground/[id]/+page.svelte's ledPoint(); HeroSurface.svelte:137 is untouched)"
tech-stack:
  added: []
  patterns:
    - "A shell slot is filled through a raw-state VARIABLE behind a getter, never a property on a raw-state object: mutation of a raw object is invisible to a $derived, and only a served build with a browser assertion on the slot can tell"
    - "A section-partitioned inspector is rendered from one schema through one widget rule; a section with no field is omitted rather than rendered empty, and the tier the spec proposes but the schema lacks is a decision in the header, not a disclosure"
    - "A layout number a container query cannot read (D-21's 454) is answered by a ResizeObserver reading the module's constant, so the number stays written once"
    - "A picker inside a <dialog> opened with showModal(): the platform owns the trap and Escape; the backdrop click and the focus return are the two lines written, both asserted"
    - "An e2e gesture that depends on a section arriving with the tuner's first view waits for a knob ROW, not for a rack: the rack renders its empty line before the view lands"
key-files:
  created:
    - src/lib/ui/Swatch.svelte
    - src/lib/tune/inspector-copy.ts
    - .planning/phases/13-gui-overhaul/13-09-SUMMARY.md
  modified:
    - src/routes/playground/[id]/+page.svelte (rewritten as the workspace)
    - src/routes/playground/[id]/+page.ts
    - src/lib/ui/TuningRegion.svelte (rewritten as the inspector)
    - src/lib/ui/Knob.svelte
    - src/lib/ui/KnobRack.svelte
    - src/lib/ui/ColourPicker.svelte
    - src/lib/ui/CopyLink.svelte
    - src/lib/ui/BrowseLink.svelte
    - src/lib/ui/shell/layout.ts
    - src/lib/ui/shell/shell.svelte.ts
    - src/routes/+layout.svelte
    - src/lib/tune/view.ts
    - src/lib/tune/view.spec.ts
    - src/lib/tune/knobs.lua.spec.ts
    - src/lib/tune/colour-picker.spec.ts
    - src/lib/catalog/front-door.ts
    - src/lib/catalog/front-door.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - src/lib/ui/aesthetic.spec.ts
    - src/lib/ui/instrument.spec.ts
    - src/lib/ui/device-ui.spec.ts
    - src/lib/ui/radius-allowlist.ts
    - src/app.d.ts
    - e2e/tuning.e2e.ts
    - e2e/tuning-webkit.e2e.ts
    - e2e/session.e2e.ts
    - e2e/install.e2e.ts
    - e2e/radius.e2e.ts
    - e2e/browse.e2e.ts
    - e2e/first-experience.e2e.ts
    - .planning/phases/13-gui-overhaul/13-CONTEXT.md (D-15 amended with the six lines)
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
    - .planning/STATE.md
  deleted:
    - src/lib/ui/FrontDoor.svelte
    - src/lib/ui/Coverflow.svelte
    - src/lib/ui/ChosenPanel.svelte
    - src/lib/ui/NamePlate.svelte
    - src/lib/coverflow/slots.ts
    - src/lib/coverflow/slots.spec.ts
key-decisions:
  - "D-21 built as the user answered: the floor stays at 380, the grid reflows at 454, the number lives in layout.ts as NUMERIC_GRID_REFLOW and reaches the component through a ResizeObserver, never a literal"
  - "The words/select boundary is a rendering change: SEGMENTED_MAX = 4 added, WORD_ROW_MAX = 8 kept by name for the two specs that read it; seven knobs change widget, no knob changes values"
  - "The inspector's headline is one constant for every entry; per-entry headlines are 13-18's question; the lede is the PDF's sentence and the entry's quiet line renders under the surface (D-14 Q11c)"
  - "There is no Advanced section, and the reason - section 7's own 'use actual parameter names' boundary - is quoted in TuningRegion.svelte's header and asserted absent by tune-ui.spec.ts test 7"
  - "The picker lives in a <dialog> opened with showModal(), named by the knob's own label; the hex is shown and the three integers are announced (question 3)"
  - "Configure is the default mode; Play routes the pointer to the preview and locks nothing (PREV-04's second half, reached and not ticked)"
  - "The shipped DeviceSlot fills the shell's connection slot provisionally with panelOwnsProse false, because the panel is always on the page; 13-11 replaces it"
  - "PadSpinner stays (three consumers); NamePlate goes (one, the coverflow); the research's 'both deletable' is a defect on PadSpinner"
  - "The unfilled shell branch stays for the seven /dev/ instruments; the plan's 'removes the unfilled branch' is not supported by the tree"
  - "The shell bridge's reactivity defect (13-05) is fixed inline under Rule 1 and named for 13-20"
  - "The four e2e titles whose subject left were renamed rather than kept false; every count is in and out at 78 / 94"
  - "gsd-tools state commands not run; STATE.md by script against a copy with every touched line asserted"
patterns-established:
  - "inspector-copy.ts: a zero-import copy module beside copy.ts for the words 13-19 does not own yet"
  - "Swatch.svelte: the dialog pattern (showModal, backdrop test, focus return, aria-labelledby the schema label)"
requirements-completed: [CAT-01, CAT-03, TUNE-01, TUNE-02, TUNE-06, PREV-01]
duration: 82min
completed: 2026-09-11
---

# Phase 13 Plan 09: The Workspace, the Schema-Driven Inspector, the Picker in a Popover and the Coverflow out of the Tree Summary

**PDF page 5 at `/playground/<id>/` on the shell, its inspector rendered from the schema that already
existed through `widgetFor`'s twelve kinds with the 4/5 words-to-select boundary stated as a rendering
change and the seven knobs it moves listed; a changed field shows a marker and resets on its own,
proved on a real tuner; D-21 built as the user answered it with the number written once; the RGB444
picker moved into a `<dialog>` with its arithmetic unedited (diffstat +18 / -8) and all six circles
round and measured square; the coverflow, the front door, the chosen panel, the name plate and the
slot geometry deleted with every pinning title quoted - and one finding the plan did not predict: the
shell's bridge had never been reactive, so no route's rail or inspector had ever rendered on a served
build until this plan's e2e asked for one.**

## Performance

- **Duration:** 82 min (12:12Z to 13:34Z), no interruption
- **Started:** 2026-09-11T12:12Z (the first read after 13-08's docs commit `2f109a8` at 12:10Z)
- **Completed:** 2026-09-11
- **Tasks:** 2 of 2
- **Files:** task 1: 23 paths (+2,504 / -1,076; `inspector-copy.ts` created); task 2: 26 paths
  (+664 / -2,760; `Swatch.svelte` created, six deleted); plus `STATE.md` and this file in the docs commit

## Commits

| Task | Commit    | Message (first line)                                                                                                                                                                       |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01   | `2b8173e` | `feat(13-09): the workspace at /playground/[id]/ and the schema-driven inspector - PDF page 5 on the shell, the 4/5 boundary, the marker and the per-field reset, D-21's reflow`            |
| 02   | `68fdc0c` | `feat(13-09): the picker into a swatch popover with its six circles kept, the coverflow out of the tree with every title named, and the shell bridge made reactive`                        |

**Seven commits that are not this plan's landed on the tree during it**, all the other agent's
Phase 12.1: `db19abb` and `21f5410` (12.1-01, the calibration map and its four-test gate, between my
two tasks) and `a46f38c` / `76657ac` and three `docs(12.1)` commits (12.1-02, the library on two
slots, during my e2e runs). None touches a file this plan touches. Their in-flight work is on the tree
now - `src/lib/sim/lua-smoke.spec.ts` and `src/lib/catalog/library.ts` modified and uncommitted,
changing under my final quick run (29 -> 32 `it(` between the run and the count) - and is excluded from
every `--only` list here. `.planning/ROADMAP.md` differs from `2f109a8` only through their commits.

## The baseline, carried from 13-08, and this plan's term written out

Observed on the clean tree at `2f109a8` before the first edit: **88 files / 904 tests (+1 todo) / 78
e2e titles / 94 runs / check 612 / catalog 26 = 8 + 18 / sweep `4 19` / radius allowlist 10 rows, 23
declarations / six `50%` circles**. The plan carries `PREV_TESTS 900` - **stale by +4, stated once**.
`slots.spec.ts` measured **eight `it(` and zero `it.todo`** before deletion, as the plan says.

| Count            | Carried (13-08) | Observed at `2f109a8` | This plan                                                                                                                                                                                                                   | Observed                                                                                                                                                                                                                       |
| ---------------- | --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| unit files       | 88              | **88**                | **-1** (`slots.spec.ts` deleted with `src/lib/coverflow/`; `inspector-copy.ts` and `Swatch.svelte` are modules)                                                                                                             | **88** = 89 - 1 (12.1-01's `calibration.spec.ts` landed +1 between my tasks)                                                                                                                                                   |
| unit tests       | 900 (plan) / 904 (tree) | **904** (+1 todo) | **-11** = `+2` (`tune-ui.spec.ts` 9 -> 11) `-8` (`slots.spec.ts`) `-1` (`aesthetic.spec.ts` scan 4) `-2` (`front-door.spec.ts` 7 -> 5). **The plan's `-6` omits the two deletions 13-04 and 13-07 assigned to this plan by name**; `view.spec.ts`, `knobs.lua.spec.ts`, `colour-picker.spec.ts`, `instrument.spec.ts` and `device-ui.spec.ts` re-aimed at their counts | **899** (+1 todo, `firmware-oracle.spec.ts:209`, unmoved) = 910 - 11, `check-counts.mjs 88 899` matches on the task-2 tree before 12.1-02 landed; **874 / 87 files** afterwards with 12.1-02's `+2` (`library.spec.ts`) `+2` (`lua-host.spec.ts`) and their in-flight `lua-smoke.spec.ts` left out of the run |
| e2e titles       | 78              | **78**                | **+0 / +0** - no title added, none deleted; **four renamed** because their subject left (named below)                                                                                                                       | **78** (`grep -c "test("` summed; the pair is pasted below)                                                                                                                                                                    |
| e2e runs         | 94              | **94**                | **+0** (16 `@webkit` titles before and after)                                                                                                                                                                               | **94** in five chunks on fresh detached servers (21 + 20 + 16 + 17 + 20), every red rerun alone and named below                                                                                                                 |
| check            | 612             | **612**               | **-4** (six files deleted, two created); 12.1's `+2` on top                                                                                                                                                                 | **610**, 0 errors, 0 warnings                                                                                                                                                                                                  |
| sweep            | `4 19`          | `4 19`                | unchanged                                                                                                                                                                                                                   | `4 19`, twice                                                                                                                                                                                                                  |
| catalog / OG     | 26 = 8 + 18     | 26                    | untouched - no entry file edited (`git diff --stat 2f109a8..68fdc0c -- src/lib/catalog/entries/` is empty)                                                                                                                  | 26 OG images, 27 directories under `build/playground/` (26 entries and the gallery's index)                                                                                                                                    |
| radius allowlist | 10 rows / 23    | 10 / 23               | **-6 rows / -16 declarations**: TuningRegion 1, Knob 5, CopyLink 1 (task 1); ColourPicker 6, ChosenPanel 2 (deleted), NamePlate 1 (deleted) (task 2)                                                                        | **4 rows / 7** (BudgetMeter 3, MixTwo 2, DeviceDetails 1, KeepConfirm 1); layer A **six circles**; layer C **60 circles measured square** in chromium and in webkit-phone                                                       |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 88 899`: **matches** on the task-2 tree
(`quick-task2b.log`, layer B on the fresh build). `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`:
matches, twice. `npm run check`: 610 files, 0 / 0. `npm run lint`: prettier reports one file,
`src/lib/catalog/library.ts` - the other agent's uncommitted edit, not this plan's; eslint clean.
`npm run build`: 26 pages under `build/playground/`, `build/playground/aurora/index.html` carries the
breadcrumb `PLAYGROUND / AURORA`.

## Task 01: the workspace and the schema-driven inspector

### The route, region by region (PDF page 5, read from the root's `HANGAR for ZONA.pdf`)

The plan's `bible/` directory does not exist on this tree; the PDF, the specification and the logo are
the user's three untracked root files (13-CONTEXT D-01 names `bible/`). Read from the root.

| Region     | Built                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| rail       | `CONFIGURATIONS`; the lead is `BrowseLink` re-skinned to the PDF's `← All configs` in both of its states (`data-way="all"` the link, `"back"` the button that restores the recorded view); one numbered row per nearby entry through `Rail.svelte`'s `index`, this entry `aria-current`; pinned `☆ Save a copy` writing through `library.ts`                                                                 |
| nearby     | **the browse-return set if there is one, else the front-door membership** - the record's query is parsed with the gallery's own `parseBrowseQuery` / `filterListing` / `sortListing`, so a visitor who filtered the gallery to six sees those six in the order they saw them; this entry is prepended when the set lacks it (an off-row page shows itself plus the eight)                                        |
| centre     | eyebrow `EXPLORE / {FOR_LABELS[tags[0]]}`; the name as declared (`.type-page-title`, `data-testid="workspace-name"`); the two-segment switch (a radiogroup of two real radios, `Configure` active by default); `typographic(description)` as the sentence; the surface (`PadFrame` + `PadCanvas`, `hero`, capped at `SURFACE_MAX`); `ZONA · 9 × 9 LIGHT MATRIX` left and `X {x} / Y {y}` right in tabular numerals |
| below      | the entry's `quiet` line when it has one (D-14 Q11c); **`data-testid="monitor-slot"`, empty, 13-10's by name**; the fidelity line; Phase 7's install column (`chosen-panel`, TRY ON DEVICE with its honesty line and connect-state region, the hairline, `NEXT`, PUT BACK / KEEP ON DEVICE or its confirmation / CLEAR) under the surface **until 13-11 moves Apply to ZONA into the context bar**            |
| inspector  | `TuningRegion.svelte` through the shell's `inspector` snippet, keyed on the id, **gated on the stamp landing** (`arrived`) so a stamped link's knobs are decoded before the tuner builds                                                                                                                                                                                                                      |
| header     | the shell's connection slot filled **provisionally** with the shipped `DeviceSlot` from the route, `panelOwnsProse={false}` - the panel is always on the page, so a drawer that could never open would be a control that does nothing; 13-11 replaces it                                                                                                                                                       |
| head data  | `+page.ts` declares `{ shell: { variant: "app", section: "playground", breadcrumb: ["PLAYGROUND", NAME] } }` so the prerendered document carries the frame; the status zone is left to 13-10 / 13-11 (question 4)                                                                                                                                                                                             |

The record's end of life (`beforeNavigate` with its two exceptions), the OG head block, `touchRecent`
on open (13-06's assignment: `Recently used` stops reading `00`), and the port released on leaving
(`tryOn?.release()` in `onDestroy`) are all in the route. `page.state.chosen` has no writer any more and
`app.d.ts` no longer declares it.

### The inspector, and the partition from the schema

`TuningRegion.svelte` renders `Inspector.svelte`: eyebrow `CONFIGURATION`, the headline snippet
`Shape the / movement.` (**one constant, `INSPECTOR_HEADLINE`, ledgered; per-entry headlines are
13-18's question 1**), the lede `Tune the gesture, then try it on your surface.`, then:

| Section       | Content                                                                                                                                                                                         | Omitted when                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `Behavior`    | the stamp notice, a `KnobRack` of every knob that is neither a colour nor a MIDI id, then `⤬ Randomize` (`surprise-me`) and `Reset settings` (`reset-all`), the all-held reason line              | never (the empty line otherwise) |
| `Appearance`  | a `KnobRack` of the colour knobs - which renders the one `Swatch` block (task 2; the inline picker at task 1's commit)                                                                           | no colour knob                  |
| `MIDI output` | a `KnobRack` in `layout="grid"` of the knobs whose id is `cc`, `ccBase`, `channel` or `send`, then `Map this CC to a parameter in your instrument or DAW.`                                       | no MIDI id                      |
| (children)    | a divider, the `TUNING` caption (still imported from `copy.ts`, as `copy.spec.ts` requires), the two meters, `BudgetMessage`, the one live region                                                 | -                               |

**By id, not by kind**, because `send` is a `note` kind by the compiler's vocabulary and `channel` is
`amount` on the preset route and `mode` on the Lua route. **There is no Advanced section**; the
header quotes section 7's boundary (*"Use actual parameter names, limits, units, defaults, and
dependencies from the configuration schema"*) and test 7 asserts the word absent from the code.

The chosen panel's height reservation - `194 / 246 + 48r + 66w + 196p - 4`, the measured 257px wrap,
the 162 / 214 constants - **is retired with its subject**: the inspector's body is the one scroll
container of a panel whose primary action lives in the context bar, so nothing above the rack can move
when it grows. `KnobRack.svelte`'s header says so.

### D-21, as built

`layout.ts` gained `NUMERIC_GRID_REFLOW = GRID_FITS_INSPECTOR` (454) with D-21's sentence. The region
observes the MIDI grid's own box with a `ResizeObserver` and sets `gridColumns = box + 2 x
INSPECTOR_INSET >= NUMERIC_GRID_REFLOW ? 2 : 1`; `KnobRack.svelte`'s `.rack.grid` reads
`repeat(var(--columns), minmax(0, 1fr))` with the PDF's 22px gutter. **No component writes 454, 402
or 190px** - test 7 scans both files for the literals and finds none, and asserts the two imports by
name. A container query could not have done it (it cannot read a custom property), which is why the
observer exists; SSR renders one column and the observer answers on mount.

### The 4/5 boundary, and the seven knobs it moves

`view.ts`: `KnobWidget` gains `"select"`; `SEGMENTED_MAX = 4` beside `WORD_ROW_MAX = 8` (**the
existing name kept**, as the plan requires - it is the select's ceiling now, the row's is the new
one). `widgetFor`: a worded knob with 1..4 options is `words`, 5..8 is `select`, otherwise `rail`; the
two-integer rule is untouched. **A rendering change: no knob's option list moved and no stamp
changed.** Measured over `stampKnobs` of every catalog entry (a scratch spec, deleted), the knobs that
change widget are exactly:

| Entry          | Knob id | Label           | Kind    | Options | Before  | After    |
| -------------- | ------- | --------------- | ------- | ------- | ------- | -------- |
| `euclid`       | `note`  | Base note       | `note`  | 7       | `words` | `select` |
| `chorus`       | `key`   | Key             | `note`  | 8       | `words` | `select` |
| `chorus`       | `scale` | Scale           | `scale` | 6       | `words` | `select` |
| `sonar`        | `rings` | Ring scale      | `scale` | 5       | `words` | `select` |
| `sonar`        | `root`  | Root note       | `note`  | 5       | `words` | `select` |
| `radar-points` | `scale` | Compass scale   | `scale` | 5       | `words` | `select` |
| `radar-points` | `root`  | Root note       | `note`  | 5       | `words` | `select` |

Every other worded knob has four options or fewer (`ninepads` notes / scale, `steps` note, `stage`
key, `snake` note, `quadrant` note, `pomodoro` note, `cull` key, `joystick` bend / spring, `dial`
mode, `aurora` direction) and stays a row.

### `Knob.svelte`: the inventory, the marker and the reset

The select branch is a real `<select>` with a `<label for>`, the toolbar's chevron drawn by the
wrapper, 44px tall, `appearance: none` and `border-radius: 0`. The changed-field marker is a 6px
square in `--color-ink` at the label's start (the label reserves the space, so a change never shifts
the word) with the hidden sentence `Changed from the default`; the per-field `Reset` is a 44px button
on every row, `disabled={!changed}`, `aria-label` `Reset {label}`, calling the row's one `onreset`.
Both names ledgered. The five non-circle radii went (`:635` track 2px, `:701` held bar 1px, `:761`
swatch option 6px, `:858` swatch 2px, `:911` lock 6px - **five, not the plan's seven**: the allowlist
row said five and named them; the planner's count included the comment at `:25` and the `inherit`);
the retired accent's literal tint at the old `:792` (`rgb(214 255 78 / 0.08)`) is `--color-raised`.
**Nothing in Knob became a square**; the three circles moved to `:730` / `:785` / `:807`.

### The two new tests and the two rewritten

`tune-ui.spec.ts` 9 -> 11: **test 7 rewritten** (*"the region's arithmetic is present, and both
constants are"* now holds D-21: the reservation relics absent, the two layout.ts imports by name, the
observer, no literal, the three section titles, the four MIDI ids, no Advanced, the headline constant,
the dynamic import); **test 5 kept** (*"the accent census moves with the picker and the reserved list
does not"*: the census is 22 across ten files since Swatch's one declaration joined - see task 2); two
new: *"every one of the twelve knob kinds resolves to a widget the row renders, and the boundary is
four words to a row and a select from five"* (the branches read off `Knob.svelte`'s own markup; the
boundary driven at 4, 5, 8 and 9 real scale words and at 4 / 5 notes) and *"a changed field shows its
marker and its own reset restores only that field, with the others proved unmoved"* (the source half,
and a real `buildTuner` on aurora: two knobs moved, one reset, the other read back at its moved index,
every other knob at its previous index). `Swatch.svelte` is the tenth component (the walk asserts ten).

### Negative checks, task 1 (restored from scratch copies, sha256 equal either side)

| Plant                                                              | Expected                                                | Observed                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. `TuningRegion.svelte` imports `buildTuner` statically           | the chunk list changes; "maybe no test catches it"      | **Three gates red**: tune-ui test 1 (*the compile surface is named 3 time(s) but only 2 … inside an await import*), config-shape test 13 (a light page statically imports a module that reaches the protocol) and test 14 (`build/playground/aurora/index.html` reaches `C1rLf53t.js`). The workspace node then imported a 57,464 B chunk carrying the model. **The boundary is protected by three gates, not by an observation alone** |
| B. `SEGMENTED_MAX = 8`                                             | the new widget test red                                 | red: *the row holds four: expected 8 to be 4* (`view.ts` `a7b34717` = `a7b34717`)                                                                                                                                                                                                                                                              |
| C. `model.ts`'s `reset(knobId)` resets every knob                  | the new reset test red                                  | red: *the OTHER field moved - a per-field reset touched a field it was not named for: expected +0 to be 1* (`model.ts` `a9f576fb` = `a9f576fb`)                                                                                                                                                                                                 |

### The chunk list, and the boundary proved by it

On the final build (`build-final.log`), the workspace node is `nodes/11.Bo514D7e.js` (28,192 B) and
its static imports are `5JDgllpJ` 3,387 · `BMXvs9Ld` 1,826 · `BYppv7tm` 1,278 · `BdxD4bOt` 7,714 ·
`CAGKJiBR` 16,377 · `CMZ19wt7` 294 · `ChrNFDvq` 52,503 · `CpSLOAuJ` 42,966 (the inspector's UI
chunk: TuningRegion, Knob, Swatch, the copy) · `CyT7JedF` 31,847 · `Dw84fXyQ` 676 · `DyyMVkns` 3,886 ·
`KLTJGPN5` 30,050 - **none of them carrying the model's strings or the protocol's**. The model is
`chunks/CqyTLwvv.js` (6,948 B, *"no catalog entry with the id"*), reached from the UI chunk only as
``await import(`./CqyTLwvv.js`)`` and pulling the compiler (`-yLfhZxI.js` 42,733 B) and the protocol
(`C1rLf53t.js` **131,101 B**, *"Lua formatter not initialized"*) behind it; the Lua VM is
`6KSbMwrZ.js` 108,699 B, also dynamic. The gallery node imports none of them statically either.

## Task 02: the picker into a popover, the coverflow out

### `Swatch.svelte`, and the `<dialog>`

One row per colour knob: the knob's own label (**not the PDF's `Active color` - question 2**), a
34 x 34 square in the stored colour, the exact hex (`#0055FF` for aurora: exact because every channel
is a multiple of 17; the picker's `aria-valuetext` stays the three integers - question 3), and
`Edit color` right-aligned. One `<dialog>` for all the rows, **opened with `showModal()`**: the platform
gives the focus trap (everything outside is inert), the top layer and Escape through `cancel`, so none
is re-implemented; the two things it does not give are written - the backdrop click closes (the
backdrop is the dialog element itself, so `event.target === dialog` is the test) and **focus returns
to the `Edit color` that opened it on every close**. The dialog is named by the knob's label through
`aria-labelledby`; a visible `Close` (ledgered) stands beside Escape and the backdrop for a touch
visitor. The picker inside is re-keyed on the knob the row opened it on and reads `selectedId` once at
init. **Gated, not claimed**: tune-ui test 3 asserts `<dialog`, `showModal()`, `aria-labelledby`, the
backdrop test, `trigger?.focus()` inside `onClosed` and the `onclose` wiring, plus both 44px axes on
`.edit` and `.close` and the 34 x 34 square; `e2e/tuning.e2e.ts`'s colour turn presses Escape and
reads the focus back on `Edit color` in the browser.

### `ColourPicker.svelte`: moved, not rewritten - the diffstat

```
git diff --stat 2b8173e..68fdc0c -- src/lib/ui/ColourPicker.svelte
 src/lib/ui/ColourPicker.svelte | 26 ++++++++++++++++++--------
 1 file changed, 18 insertions(+), 8 deletions(-)
```

The 18 insertions are the header paragraph (8 lines), the `selectedId` prop with its doc (9) and the
`untrack` import (1); the 8 deletions are the six radius lines (`:654` lock 6px, `:688` result 2px,
`:749` focus ring 2px, `:787` detent 2px, `:839` track 2px, `:878` held bar 1px -> `0`), the old
import line and the old `chosen` initialiser. `git diff` filtered to code lines shows exactly two
changed: `import { onDestroy } from "svelte"` and `let chosen = $state<string | undefined>(undefined)`.
**No line of the lattice, the rails, the cheap-step marks or the budget arithmetic moved.**

### The six circles, measured

| Circle                          | Source line (13-01 -> now) | Box (source) | Layer C                                                                                                          |
| ------------------------------- | -------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| ColourPicker `.tick`            | `:829` -> `:840`           | 2 x 2        | `picker:tick` measured square on `/playground/aurora/` in both engines                                           |
| ColourPicker `.thumb`           | `:857` -> `:867`           | 12 x 12      | `picker:thumb` measured square; the WebKit probe read the red rail's thumb at `{x: 21, y: 155, w: 12, h: 12}` |
| ColourPicker `.home`            | `:872` -> `:882`           | 2 x 2        | `picker:home` measured square                                                                                    |
| Knob `.dot`                     | `:598` -> `:730`           | 8 x 8        | `knob:dot` measured square on both workspaces                                                                    |
| Knob `.thumb`                   | `:653` -> `:785`           | 12 x 12      | `knob:thumb` measured square on `/playground/arc/` (its 16-value channel is the track)                           |
| Knob `.home`                    | `:674` -> `:807`           | 2 x 2        | `knob:home` measured square                                                                                      |

Layer A: *six circles (D-15)* at exactly the six pairs, `CIRCLES` and D-15 amended with the same
numbers on the same day. Layer C (`radius.e2e.ts`, `@webkit`, both engines): *60 circles measured
square* - aurora 47 (`knob:dot, knob:home, picker:home, picker:thumb, picker:tick`), arc 13
(`knob:dot, knob:home, knob:thumb`); the popover is opened on the workspace so the picker's three are on
screen when measured.

### Every deleted file, with the titles that pinned it

| File                                | Consumers at `2f109a8`                          | Titles that pinned it, quoted, and their fate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ui/FrontDoor.svelte`       | `/playground/[id]/+page.svelte` (rewritten)     | `instrument.spec.ts` *"scan 1: the register line holds from the instrument side - the pill is authored once, in src/app.css, and never inside FrontDoor.svelte or under .front-door"* - **re-aimed** (title now ends *"and never under a .front-door selector"*; the FrontDoor-authors-none clause deleted); *"scan 5 …"* - its *FrontDoor.svelte no longer mounts a FacetRow* clause deleted; the two `FRONT_DOOR_ONLY` rows retired (the list is empty and the totality check stays). `first-experience.e2e.ts`'s survivors re-aimed (below). `session.e2e.ts`'s `waitForFrontDoor` waits for the workspace |
| `src/lib/ui/Coverflow.svelte`       | `FrontDoor`                                     | `aesthetic.spec.ts` *"scan 4: Coverflow.svelte's 3D context stays ungrouped and its band keeps its clip and its mask"* - **deleted by name** with `rightmostCompounds`, `targets`, `FORBIDDEN_ON_STAGE` and the module-level parse only it used; scan 8 survives and the file with it. `device-ui.spec.ts`'s Escape slice re-aimed at the route's handler (writing guard, then the confirmation, no `pushState`). **`Coverflow.svelte:520` is gone - 12.1-05 and 12.1-08 name it**: the `mapAxis` call lives in the route's `ledPoint()`; `HeroSurface.svelte:137` is untouched |
| `src/lib/ui/ChosenPanel.svelte`     | `Coverflow`                                     | `tune-ui.spec.ts` test 7's `min-block-size: 152px` clause - rewritten; `device-ui.spec.ts` *"the reserved cells are the measured arithmetic … and the install row is a column"* - **re-aimed at the route** (the column, `PUT BACK` first, the caption, the one hairline; the share control asserted OUT of the column and IN the inspector's `actions` snippet; the 152px asserted absent). `tune/copy.ts`'s `ChosenPanel` mention (`:49`) is **left standing until 13-19** |
| `src/lib/ui/NamePlate.svelte`       | `Coverflow` only (`Knob.svelte:185` was a comment, reworded) | no unit title; `e2e/tuning.e2e.ts` and `tuning-webkit.e2e.ts`'s `nameplate-name` reads -> `workspace-name`; `first-experience`'s `nameplate-prev` / `-next` reads -> the rail                                                                                                                                                                                                                                                                                                                              |
| `src/lib/coverflow/slots.ts`        | `Coverflow`, `front-door.ts`'s ring order       | `front-door.spec.ts` *"no dark pad is in the opening window"* and *"the three largest pads at the opening all move"* - **deleted by name** (13-07 assigned them here) with `windowAt`; the ring order's prose in `front-door.ts` retired to history (the order is the rail's now) |
| `src/lib/coverflow/slots.spec.ts`   | -                                               | **eight, zero `it.todo`**, each read from the file before deletion and matching the planner's list at `d78e087`: *"step wraps in both directions, and a delta larger than the ring still lands in range"*, *"slotOffset is the signed shortest distance, and an even ring's antipode is positive"*, *"the ladder mirrors: +k and -k agree in size and oppose in position and turn"*, *"the ladder matches the approved spec and falls monotonically with the offset"*, *"left slots rotate positive on Y and right slots negative"*, *"beyond the last slot nothing is mounted"*, *"the visible radius follows the viewport breakpoints"*, *"visibleWindow returns distinct in-range indices centred on the given index"* |

`grep -rn "Coverflow\|FrontDoor\|ChosenPanel\|NamePlate" src/` after: comments only (`BrowseGrid`,
`PadCanvas`, `PadFrame`, `TryOnDevice`, `MixTwo`, `HeroSurface`, `return.ts`, `session.svelte.ts`,
`url.ts`, `copy.ts`, `config-shape.spec.ts`, `intro.spec.ts`, `instrument.spec.ts`'s header prose,
`browse/*.ts` sentences naming `slots.ts` as a precedent) - no import, no mount, no path.

### `NamePlate` and `PadSpinner`, decided from the tree

**`NamePlate.svelte` deleted**: `grep` found one consumer, `Coverflow.svelte:69 / :878`; `Knob.svelte:185`
named it in a comment about `MediaQuery` (reworded to name `host.ts`). **`PadSpinner.svelte` kept**:
three live consumers - `CatalogCard.svelte:85 / :174`, `DeviceMark.svelte:41 / :66`,
`TryOnDevice.svelte:128 / :347`. **The research (`13-RESEARCH.md` §2, "Delete (7)") listed
`PadSpinner.svelte` as deletable ("the new shell's loading is a quiet state, not a walking cell") - a
defect: the card, the device mark and the primary control all mount it, and no plan retires them.**

### The shell bridge was never reactive - a 13-05 defect, found by this plan's e2e and fixed (Rule 1)

On the first e2e chunk two browse titles could not find `browse-link` and `tuning-region` on a
workspace they had just opened. A probe on the served build showed the frame drawn (header, context
bar, footer, the rail COLUMN) with **no rail, no inspector, no connection control** - and the same
probe showed **`shell-rail 0` on `/playground/` and no Quick guide on `/`**: 13-08's rail and 13-07's
secondary link had never rendered on a served build either. Cause: `shell.svelte.ts` declared
`export const shell = $state.raw({ fill })` and `fillShell` wrote `shell.fill = fill`. **A property write
on a raw-state object is not tracked** - only reassigning the variable is - so the layout's
`$derived(shell.fill ?? declared())` never re-read it, and the prerendered DATA fill (variant, section,
breadcrumb, status) drew the frame around the absent snippets, which is why every earlier e2e title
stayed green: none asserted a slot on a served page. The fix is one module: the fill is a module-level
`$state.raw` VARIABLE read and written through `shell.fill`'s getter and setter, so every caller and
`shell.spec.ts` keep their shape and the cleanup's `===` guard holds. After the rebuild the probe read
every slot at 1 on the workspace, `shell-rail 1` on the gallery and the intro's secondary at 1.
`shell.spec.ts` (6), `intro.spec.ts` (4) and `browse-ui.spec.ts` (9) green; the whole e2e suite is the
behavioural proof. Named for 13-20, and for 13-07 / 13-08's records: their slots work now, not then.

### Negative checks, task 2 (restored from scratch copies, sha256 equal either side)

| Plant                                                    | The plan expected                                                        | Observed                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D. `ColourPicker.svelte`'s `.thumb` at `border-radius: 0` | layer C's square arm still green; "the gate does not catch it"           | **Layer A red**: *a D-15 circle is no longer at its named line … if it was squared, D-15 says nothing in Knob.svelte or ColourPicker.svelte becomes a square*. The gate DOES catch a squared circle - not through layer C's square arm (a zero-radius square is not a circle, as the plan says) but through layer A's set-equality on the six named lines. The plan's sentence is not what the tree does (`e421206a` = `e421206a`) |
| E. `Swatch.svelte`'s `trigger?.focus()` deleted           | the accessibility assertion red if one exists, else write one            | red: tune-ui test 3, *focus does not return to the link that opened the popover when it closes (section 14)* - the assertion was written in this plan (`8453bc30` = `8453bc30`)                                                                                                        |

## The e2e suite, and the harness

`grep -c "test("` over `e2e/*.e2e.ts`, before (`git show 2f109a8:`) and after, pasted:

```
before: artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
after:  artifacts 3, browse-webkit 4, browse 12, catalog 2, fidelity 2, first-experience 5, install 14,
        radius 1, session 14, skeleton 2, smoke 4, tuning-webkit 5, tuning 10  = 78
@webkit titles: 16 before, 16 after
```

**Four titles renamed because their subject left the tree** (no count moved): `tuning-webkit`
*"choosing opens the panel and the rack never scrolls sideways @webkit"* -> *"the workspace opens with
its panel and the rack never scrolls sideways @webkit"*; `browse` *"un-choosing a hand-authored
configuration leaves its pad running"* -> *"a hand-authored configuration's pad runs on arrival and
keeps running once the tuner has published"* (the un-choose is gone; what is left to prove is the
handover at `onpreview`); `first-experience` *"reduced motion stills the pads and makes stepping
instant"* -> *"reduced motion stills the intro's hero and the workspace's surface"*, and *"… an off-row
page is a row of one"* -> *"… an off-row page is a workspace of its own with the rail as its way on"*.
Every other re-aim is a body: `coverflow` / `front-door` -> `workspace`, the Enter presses dropped
(nothing is chosen), `nameplate-name` -> `workspace-name`, `chosen-panel` kept as the install block's
id, the header lock reached with one click (install test 7: the drawer opens beside the panel now, where
deferred item 19 needed a Back), `RESET_ALL` / `SURPRISE_ME` / `COPY_LINK` label assertions ->
`RESET_SETTINGS` / `RANDOMIZE` / `SHARE_SNAPSHOT`, `BACK TO BROWSE` / `BROWSE ALL` -> `← All configs`
with `data-way`, the stacking mechanism exercised at 260px (the inspector's body is 268px at 320, above
Knob's 220px query; both widths still measured with nothing scrolling sideways), and the unknown-address
line's new text.

Run in 13-08's five chunks, each on a fresh detached wrangler (`run-chunk.sh` + `start-wrangler.ps1`
from the shared scratchpad), each chunk to a file and through `check-counts.mjs --playwright`; **no
wrangler death in any of the twelve starts** (zero `ProxyController` lines every time):

| Chunk                                                                        | Runs | Result                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| browse + browse-webkit                                                       | 21   | 19 / 21 - the two reds that found the bridge defect (above); fixed; **21 / 21**                                                                                                                                                                                                                                                                                                          |
| tuning + tuning-webkit                                                       | 20   | **20 / 20**; run again on the final build after a `.first()` on the probe page's rack locator: **20 / 20**                                                                                                                                                                                                                                                                              |
| session                                                                      | 16   | 15 / 16 - *"a session transition is announced once, and the other two regions stay quiet"*: a bare `getByTestId("knob-rack")` against two racks (strict mode) - a site this plan's re-aim missed; `.first()`; rerun alone **1 / 1**                                                                                                                                                       |
| install                                                                      | 17   | **17 / 17**                                                                                                                                                                                                                                                                                                                                                                              |
| first-experience + smoke + skeleton + fidelity + catalog + artifacts + radius | 20   | 18 / 20 - `artifacts` *"the static build is complete"*: HEAD moved under the build to `76657ac` (the other agent), rebuilt and rerun alone **3 / 3**; `radius` on `webkit-phone`: the popover's `Edit color` counted 0 at "first rack visible" because the Behavior rack renders its empty line before the tuner's first view lands - the gesture now waits for a knob ROW; rerun in both engines **2 / 2** |

The plan's known transients (`webkit-phone` tail, `session.e2e.ts:701`, `tuning-webkit.e2e.ts:497`,
the 375px overflow, the quick-suite install / config-shape timeouts) did not appear. **The harness was
never piped through `grep` or `head`; nothing was committed while a suite ran; `npm run build` failed
`EPERM` exactly once, while a probe's wrangler held `build/`, and was rerun after the kill.**

## Strings, and the ledger

Every visible string on the workspace that the PDF draws is verbatim and not ledgered:
`CONFIGURATIONS`, `← All configs`, `Save a copy`, `EXPLORE`, `Configure`, `Play`, `ZONA · 9 × 9 LIGHT
MATRIX`, the `X … / Y …` form, `CONFIGURATION`, *Tune the gesture, then try it on your surface.*,
`Behavior`, `Appearance`, `MIDI output`, `Randomize`, `Reset settings`, `Edit color`, `Save copy`,
`Share snapshot`, *Map this CC to a parameter in your instrument or DAW.*, and the breadcrumb
`PLAYGROUND / ARC`. They live in `src/lib/tune/inspector-copy.ts` (zero imports) because `copy.ts` is
13-19's and `copy.spec.ts` holds it character for character. **Eight rows landed in
`13-COPY-NEW.md`** ("From 13-09"): `INSPECTOR_HEADLINE` (*Shape the* / *movement.*, one constant),
`fieldResetName` (*Reset {label}*), `FIELD_CHANGED` (*Changed from the default*), `UNKNOWN_NOTICE`
(*Never heard of that one. Pick a configuration from the list.*), `SAVED_COPY` (*Saved copy*, library.ts's
own permitted word), `copyName` (*{name} copy*), the mode switch's group name (*Mode*) and
`POPOVER_CLOSE` (*Close*). **Six questions** follow: per-entry headlines; `Active color` against the
schema's label; the hex beside the swatch; the workspace's status zone; `LINK COPIED` after
`Share snapshot`; the install column under the surface until 13-11.

## PREV-04

**PREV-04's second half is reached here and is not ticked.** The workspace's `Configure` / `▷ Play`
switch routes the pointer to the preview as mouse-as-finger through `SimHost`'s tick-locked delivery in
Play (`ledPoint` through `mapAxis`, the intro's hero pattern) and leaves the surface a picture in
Configure; nothing is locked, because a catalog entry has no structure to lock (13-16's Sandbox rule).
13-07 reached the first half on the intro; 13-20 decides the tick. `REQUIREMENTS.md` untouched;
**CAT-04 stays `[ ]`**.

## Deviations from the plan

### 1. [Rule 1 - bug] The shell bridge made reactive (`shell.svelte.ts`, outside the plan's list)

See "The shell bridge was never reactive". Without it the workspace's rail, inspector and connection
control never render on a served build - nor did the gallery's rail or the intro's Quick guide.

### 2. [Rule 3 - blocking] The route's connection slot filled provisionally with `DeviceSlot`

The plan leaves the connection control to 13-11 as a named slot; six session titles and every install
title read `device-slot` on the workspace. The shipped control is handed into the slot from the route
with `panelOwnsProse={false}` and 13-11 replaces it (question 6 records the column beneath it too).

### 3. [Rule 3 - blocking] Ten specs and seven e2e files outside or beyond the plan's list

`view.spec.ts` and `knobs.lua.spec.ts` (the fifth widget), `colour-picker.spec.ts` (Swatch),
`front-door.spec.ts` (the two titles 13-07 assigned here), `aesthetic.spec.ts` (scan 4, 13-04's
assignment), `device-ui.spec.ts` (the panel and the Escape slice moved to the route), `shell.svelte.ts`
and `+layout.svelte` (comments: the unfilled branch stays), `app.d.ts` (the dead page state), and
`session`, `install`, `browse`, `first-experience`, `radius` beside the two tuning files the plan names.

### 4. [Plan vs tree] The term is `-1 / -11`, not `-1 / -6`

The plan's arithmetic omits `aesthetic.spec.ts` scan 4 (`-1`, assigned to this plan by 13-04 and by the
spec's own header) and `front-door.spec.ts`'s two window tests (`-2`, assigned by 13-07 and by the
file's own comment). `slots.spec.ts` measured eight, as the plan says.

### 5. [Plan vs tree] `Knob.svelte`'s non-circle radii are five, not seven

The allowlist row said five and named them; the planner's seven counted the comment at `:25` and the
`inherit` at `:569`, as the row's own note already recorded.

### 6. [Plan vs tree] The unfilled shell branch stays

The plan says 13-09 removes it; the seven `/dev/` instruments fill nothing and render through it. Kept,
and both comments say why.

### 7. [Design, stated] Four e2e titles renamed; `KnobRack` gains `layout` / `columns` / `empty`; `CopyLink` gains `label`; `BrowseLink` gains `data-way`

Each a consequence of the plan's own asks (the inspector's grid, the PDF's `Share snapshot`, the PDF's
one rail label) rather than a new feature.

### 8. [Process] The e2e gesture for the popover, corrected twice

A first hardening (retry the click) was wrong in kind - a second click on an open modal would land on
its backdrop and close it - and was replaced by the honest wait for a knob row. Recorded so nobody
re-adds the retry.

### 9. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run. The script asserted `status:
executing`, `completed_phases 11`, `percent 100`, `total_phases 14`, `total_plans 160`, the Phase 12
plan line, the Phase 12.1 line and 13-08's retained status unchanged; moved `completed_plans` 145 -> 146;
added the P09 metrics row, the `[Phase 13]: 13-09:` decisions, a dated clause on the Phase 13
`Concurrent` line, and the new `Status:` with 12.1-01's retained. Phase 12 (gate landed, bench pending),
Phase 12.1 (2 of 9 by the other agent's commits) and Phase 13 (9 of 20) are all recorded.

## What the plan asserts that the tree does not support

1. **`PREV_TESTS 900`** - the tree was 904; stated once above.
2. **The term `-1 / -6`** - `-1 / -11`; deviation 4.
3. **"`Knob.svelte`'s seven non-circle declarations"** - five; deviation 5.
4. **"there may be no test that catches [a flattened dynamic import] … the boundary is protected by a build observation, not by a gate"** - three gates go red (tune-ui test 1, config-shape tests 13 and 14); negative check A.
5. **"zero one of the three circles - expect layer C's square arm still green … the gate does not catch it"** - layer A catches it by the set-equality on D-15's six lines; negative check D. The plan's sentence about layer C is true and moot.
6. **"13-09 removes the unfilled branch"** - kept for `/dev/`; deviation 6.
7. **`src/routes/c/[id]/+page.svelte` in `files_modified`** - stale; the route is at `playground/[id]` since 13-08, as the brief said.
8. **`bible/HANGAR for ZONA.pdf`** - no `bible/` on the tree; the PDF is a root untracked file.
9. **"e2e +0 / +0 … without a title moving"** - counts +0 / +0; four titles renamed because their words were false with their subject gone.
10. **"the plan's file list omits `inspector-copy.ts`, `Swatch.svelte` (named only in the artifacts), `radius.spec.ts` as the file that clears rows"** - the rows live in `radius-allowlist.ts`, as 13-08 already noted.
11. **"`13-08-SUMMARY.md` says `PadSpinner` has three consumers"** - confirmed on the tree; the research's "deletable" is the defect, not the summary.

## Questions for the user, recorded rather than answered (D-01)

The six in `13-COPY-NEW.md` under "From 13-09" (listed under "Strings, and the ledger"). And two
here: **should the workspace's rail list the return set or always the membership** (the return set is
what section 6's preserved-context rule asks for, and it is what shipped; a visitor who filtered to one
entry sees a rail of one plus this entry); and **should the install column stay under the surface until
13-11, or be hidden until Apply to ZONA exists** (present-and-working was chosen, because hiding it
would take TRY ON DEVICE off the only page that has it).

## Known Stubs

- `data-testid="monitor-slot"` under the surface renders nothing until 13-10 fills it - named in the route, not a blank by accident.
- The context bar's status zone on the workspace is empty until 13-10 / 13-11 hand it the draft and device sentences; the destination zone reads the PDF's *Preview without hardware* until 13-11.
- The colour picker's result pad is not registered (`onresult` unsupplied), as it was not on the coverflow: the route's host holds the tuned engine under the entry's id and a second registration of the same engine would tick it twice; deferred-items item 5 stands.

## Notes for the next plans

- **13-10:** the monitor slot's id; `surprise-me` / `reset-all` test ids kept under the PDF's labels; MixTwo's row and the census (Swatch is the tenth component at 1 accent declaration, the total 22).
- **13-11:** replace the provisional `DeviceSlot` in the route's `connection` snippet; move the install column; the session walk's gallery hops.
- **13-13:** the saved copies are `copy:{id}:{moment}` records named `{name} copy`.
- **13-18:** eight rows, six questions.
- **13-19:** `SURPRISE ME`, `RESET ALL`, `COPY LINK`, `LINK COPIED`, `HOLD` / `HELD` untouched in `copy.ts`; the region still imports `TUNING_CAPTION`.
- **13-20:** the counts above; the bridge finding (13-05, 13-07 and 13-08's slots first rendered live today); the e2e gesture rule (wait for a knob row); PREV-04.
- **12.1-05 / 12.1-08:** `Coverflow.svelte` is gone; the `mapAxis` call the plans name at `:520` is `ledPoint()` in `src/routes/playground/[id]/+page.svelte`.
- **The harness:** unchanged from 13-08; the scratchpad is shared - name your logs (`1309-*` here).

## Self-Check: PASSED

- `src/lib/ui/Swatch.svelte`, `src/lib/tune/inspector-copy.ts`, `src/routes/playground/[id]/+page.svelte`, `src/routes/playground/[id]/+page.ts`, `src/lib/ui/TuningRegion.svelte`: FOUND. `src/lib/ui/FrontDoor.svelte`, `Coverflow.svelte`, `ChosenPanel.svelte`, `NamePlate.svelte`, `src/lib/coverflow/`: ABSENT, as required. `src/lib/ui/PadSpinner.svelte`: FOUND, as required.
- Commits `2b8173e` and `68fdc0c`: FOUND in `git log`.
- `git diff --stat 2f109a8..68fdc0c -- src/vendor/ src/lib/catalog/entries/ src/lib/tune/copy.ts .planning/REQUIREMENTS.md src/lib/fidelity/firmware-oracle.spec.ts`: empty. `.planning/ROADMAP.md`, `.planning/phases/12-touch-framework/`, `.planning/phases/12.1-gradient-touch/`: untouched by this plan.
- No device, no deploy, no push. The three untracked root files and the other agent's two in-flight files are not this plan's.
