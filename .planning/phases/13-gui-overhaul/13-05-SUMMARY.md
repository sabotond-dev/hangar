---
phase: 13-gui-overhaul
plan: 05
subsystem: ui
tags:
  [
    shell,
    frame,
    header,
    nav,
    context-bar,
    footer,
    rail,
    inspector,
    layout-ts,
    fractions,
    d-14-q9,
    d-17,
    d-03,
    three-signal-selection,
    pointer-coarse,
    ssr-render,
    gplv3-footer,
    session-announcer,
    motion-control,
    wrangler,
  ]
requires:
  - phase: 13-gui-overhaul
    plan: 04
    provides: "PREV_FILES 86 / PREV_TESTS 886 (+1 todo) / e2e 84 titles, 100 runs / BASE_CHECK 585 / sweep 4 19 / catalog 26 / radius allowlist 13 rows, 28 declarations, observed on the clean tree at 07d910f; MotionControl.svelte parked in the layout's footer with a comment naming 13-05"
  - phase: 13-gui-overhaul
    plan: 03
    provides: "the eleven tokens; Wordmark.svelte (inline SVG at currentColor, default label HANGAR, ledgered); the eight .type-* roles at 36 / 30 / 17 in app.css with the sentence that layout.ts carries the same; identity.spec.ts test 6 fixture-proved and vacuous on the tree"
  - phase: 13-gui-overhaul
    plan: context
    provides: "D-01 (ask where not sure; never a corner), D-03 (three signals on a selected row), D-05 (the register), D-14 Q9 (the PDF's proportions win; section 13 re-derived as fractions), D-15 (six circles, none here), D-17 (36 / 30 / 17 measured, section 12 overridden)"
  - phase: 13-gui-overhaul
    plan: validation
    provides: "D-5: FrontDoor, Coverflow, Splash, NamePlate survive until 13-07 and 13-09, so the old routes still draw their own headers"
provides:
  - "ONE FRAME, SIX REGIONS, EIGHT NEW FILES under src/lib/ui/shell/: Header.svelte (wordmark + FOR ZONA, the nav, the connection slot RESERVED at 218 x 37 and empty for 13-11; two shapes by a variant prop because page 1 is the exception), Nav.svelte (three items at 15px / 0.05em; the current one is the action colour AND a 2px underline, both keyed to aria-current), ContextBar.svelte (three zones; the third is a destination or the PDF's Preview without hardware, never empty), Footer.svelte (HANGAR / by intech studio; Help & shortcuts as a closed disclosure with the motion control under it; Device actions a reserved slot absent until filled; the GPLv3 block's five lines byte for byte git's at 07d910f), Rail.svelte (all four PDF rail shapes; the selected row is D-03's three signals keyed to aria-current), Inspector.svelte (eyebrow, snippet headline, lede, 17px sections, pinned pair; the body is the one scroll container), layout.ts (every number once, with provenance), shell.svelte.ts (the bridge a route fills from an effect)"
  - "THE LAYOUT MOUNTS THE SHELL ONCE AROUND THE THREE LOAD-BEARING THINGS: the two onMount calls untouched (not in the diff), SessionAnnouncer left exactly where it was and first in the document, the GPLv3 block moved whole into the footer and held against git by test 4. Three shapes: app (pages 2-5), intro (page 1, 13-07's), and unfilled - the announcer, the page and the footer - for /, /c/[id] and /browse/ until 13-07 and 13-09 rewrite them"
  - "layout.ts: frameAt() re-derives section 13's table as fractions with the breakpoints kept; inspectorAt() clamps the PDF's 0.304 to 380-456 in the wide band and to the specification's own 268-300 in the compact band; padCount() pads to two and stops padding above 99; TYPE_SCALE exported with D-17's sentence; both section 13 inspector bands quoted against the right rows (300-340 at 1440 and above, 268-300 at 1024-1439); the 402px arithmetic as constants - and the finding that the plan's 380 floor does not hold it"
  - "shell.spec.ts, six tests rendered with svelte/server inside the vitest server project (a probe proved it works), plus source scans in the house style: regions and the announcer first; the nav's two signals; the bar's two shapes; the footer's block and pair; the fractions at four widths read from layout.ts with an absolute anchor and a recorded shortfall; the coarse-pointer floor keyed to (pointer: coarse) by the query's own text"
  - "COUNTS: 87 / 892 (+1 todo) = 86 + 1 / 886 + 6; e2e 84 titles / 100 runs unmoved; check 594 = 585 + 9; sweep 4 19; radius allowlist 13 rows / 28 declarations unchanged, no new row; identity test 6 no longer vacuous (1 selected-state fill, three-signal) with no widening"
affects:
  - "13-07: fills the shell with variant intro (the header's secondary slot is page 1's Quick guide; the connection slot is 13-11's); removes nothing yet"
  - "13-08: fills variant app for /playground/ - the first rail at every width; owns the words for the rail's collapse control (768-1023) and the drawer and bottom sheet (below 768), which this plan stacks rather than invents; swaps SECTIONS' /playground/ literal for resolve()"
  - "13-09: the inspector's schema renderer decides how the 2 x 2 numeric grid behaves below 454px of inspector (it does not fit at the plan's 380 floor nor at the 1440 breakpoint's 438; see the finding); removes the unfilled branch when the last old route fills the shell"
  - "13-10, 13-12: swap /sandbox/ and /my-configs/ literals for resolve(); 13-12 owns the page target in the destination zone"
  - "13-11: fills the header's connection slot (218 x 37, reserved) and the footer's deviceActions slot from slotStateOf and capabilityOf, keeping DeviceSlot.svelte's button-vs-summary rule"
  - "13-18: three questions in 13-COPY-NEW.md (the wordmark link's name; Device actions absent-until-filled; Help & shortcuts closed by default) and no string landed"
tech-stack:
  added: []
  patterns:
    - "A layout that renders named slots is filled by the route through a $state.raw bridge module (shell.svelte.ts): a route calls fillShell() from an effect and gets the cleanup back; snippets are values and cross the boundary as props"
    - "Component specs may render with svelte/server's render() in the vitest server project when the rule is about what a route GETS; source scans stay for CSS rules, comments blanked first"
    - "Every layout number is a custom property set from one module; the stylesheet reads variables and writes no figure; media-query breakpoints are the one CSS-forced literal and are pinned to the module by test"
    - "A test that trusts its single source needs one absolute anchor - here D-14 Q9's own arithmetic - or a lying module passes every relative check"
key-files:
  created:
    - src/lib/ui/shell/layout.ts
    - src/lib/ui/shell/shell.svelte.ts
    - src/lib/ui/shell/Header.svelte
    - src/lib/ui/shell/Nav.svelte
    - src/lib/ui/shell/ContextBar.svelte
    - src/lib/ui/shell/Footer.svelte
    - src/lib/ui/shell/Rail.svelte
    - src/lib/ui/shell/Inspector.svelte
    - src/lib/ui/shell.spec.ts
  modified:
    - src/routes/+layout.svelte
    - src/lib/config-shape.spec.ts
    - src/lib/ui/tune-ui.spec.ts
    - .planning/phases/13-gui-overhaul/13-COPY-NEW.md
key-decisions:
  - "The shell renders its chrome only when a route has filled it: /, /c/[id] and /browse/ still draw their own headers (13-VALIDATION D-5), so an unconditional header would have doubled the wordmark on the live site; the unfilled branch is named and 13-09 removes it"
  - "A route fills the layout's slots through shell.svelte.ts - an eighth file the plan did not list, because SvelteKit gives a layout no other way to take a page's snippets"
  - "SessionAnnouncer was left, not moved, with the shell put around it; the two onMount calls are not in the diff; the GPLv3 block moved whole and is held against git at 07d910f"
  - "Help & shortcuts is a closed disclosure with the motion control under it; Device actions is absent until 13-11 fills it rather than shown dead - both recorded as questions"
  - "The nav's three hrefs are literals typed ResolvedPathname because none of the routes exists yet; each landing plan swaps its own for resolve()"
  - "Test 5 gained an absolute anchor after its first negative check passed green: a layout.ts fixed at 300 satisfied every relative check because the test trusts the module; the anchor is D-14 Q9's own arithmetic"
  - "The plan's 380 floor does not hold the 402px grid it cites: with the PDF's 26px insets the grid needs 454, which the fraction reaches only from about 1494px; recorded in layout.ts and asserted as a known shortfall, not fixed - a question for the user"
  - "The stacked and narrow bands stack the regions rather than invent a collapse control, a drawer and a bottom sheet whose labels the Bible does not give; 13-08 asks for the words"
  - "gsd-tools state commands not run; STATE.md edited by script against a copy with every touched line asserted"
patterns-established:
  - "shell.svelte.ts fill/clear: fillShell(fill) returns the cleanup and clears only if the fill is still the caller's own"
  - "Selected rows keyed to aria-current carry all three signals in CSS on the same attribute, so the accessibility tree and the paint cannot disagree"
requirements-completed: [IDENT-01, CONN-01, DEGR-02]
duration: 55min
completed: 2026-09-11
---

# Phase 13 Plan 05: The Frame Every Screen Fills Summary

**One frame with six regions mounted once in the layout and filled by the route through a bridge
module, every number in `layout.ts` with its raster provenance, the three load-bearing things checked
and left where they were, six tests rendered with `svelte/server` - and the finding that the plan's own
inspector floor cannot hold the grid it cites as its reason.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-09-11T03:47Z (the SSR probe at 05:47:38 local)
- **Completed:** 2026-09-11T04:42Z
- **Tasks:** 2 of 2
- **Files:** 9 created, 4 modified (13 in the two task commits; STATE.md and this file in the third)

## Commits

| Hash      | Message                                                                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `4ddb7f9` | `feat(13-05): the header, the nav, the context bar and the footer - the shell mounted once, around the three load-bearing things` (11 files, +1469 / -46)                |
| `245c363` | `feat(13-05): the rail, the inspector, and the frame as fractions - six regions, one module of numbers, and the grid that does not fit at the plan's own floor` (5 files, +1096 / -41) |

## The baseline, carried from 13-04, and this plan's term written out

Observed on the clean tree at `07d910f` before the first edit: **86 files / 886 tests (+1 todo) / 84
e2e titles / 100 runs / check 585 / catalog 26 / sweep `4 19` / radius allowlist 13 rows, 28
declarations**. The plan's carried `886` matches the tree for the first time in the phase - and only
because 13-04's `-8` cancelled 13-01's `-1` offset against the plan's `-9`; said once, here.

| Count                | Carried (13-04) | This plan                                                          | Observed                                                                   |
| -------------------- | --------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| unit files           | **86**          | **+1** (`shell.spec.ts`)                                           | **87**                                                                     |
| unit tests           | **886**         | **+6** (shell tests 1-6)                                           | **892** (+1 todo, `firmware-oracle.spec.ts:209`, unchanged)                |
| e2e titles           | **84**          | **+0**                                                             | **84** (`grep -c "test("` summed over `e2e/`)                              |
| e2e runs             | **100**         | **+0**                                                             | **100** (84 chromium + 16 webkit-phone)                                    |
| check                | **585**         | **+9** (six components, `layout.ts`, `shell.svelte.ts`, the spec) | **594**, 0 errors, 0 warnings                                              |
| sweep                | `4 19`          | unchanged                                                          | `4 19` (`check-counts.mjs 4 19` matches)                                   |
| radius allowlist     | 13 rows / 28    | **+0 rows** - eight new files, none needed one                     | 13 rows / 28; layer B: 36 declarations in 7 built stylesheets, 6 of them 50%, tolerated 10px, 1px, 2px, 6px |
| identity test 6      | 0 fills, vacuous | the Rail is its first real subject                                | **1 selected-state fill in `--color-raised`, all three-signal**; 56 files scanned; **no widening needed** |
| catalog              | 26              | not touched                                                        | not re-measured                                                            |

`npm run test:quick 2>&1 | node scripts/check-counts.mjs 87 892`: **892 passed, 1 todo, matches**
(the run with the fresh build; the runs before the build showed layer B red on a stale build, as it
should). `npm run test:sweep 2>&1 | node scripts/check-counts.mjs 4 19`: matches. `npm run check`: 594
files, 0 errors, 0 warnings. `prettier --check` and `eslint` on every touched file: clean.

## The measured figures as landed, beside the research's

| Region             | 13-RESEARCH section 1 (raster, 1500px)          | `layout.ts`                                                             | Moved? |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| Header band        | 76 tall                                         | `HEADER_H = 76`                                                          | no     |
| Context bar        | 59 tall                                         | `CONTEXT_H = 59`                                                         | no     |
| Left rail          | 0 to 224 (about 15%)                            | `RAIL_W = 224` fixed at 1440 and above; `RAIL_FR = 224/1500` recorded, not used for layout; `RAIL_COMPACT_W = 200` (section 7) at 1024-1439 | the plan's interfaces block writes `RAIL_FR` as if used; its table says "224 fixed" - the table was followed and the fraction kept as provenance |
| Centre             | 224 to 1044, 820                                | the remainder: `frameAt(1500).centre === 820`, asserted                  | no     |
| Right inspector    | 1044 to 1500, 456, about 30%                    | `INSPECTOR_FR = 456/1500 = 0.304`, clamped `380-456` (wide), `268-300` (compact) | no - but see the finding below |
| Footer             | about 50                                        | `FOOTER_H = 50`                                                          | no     |
| Connection control | x 1260 to 1478, height about 37                 | `CONNECTION_SLOT = { inline: 218, block: 37 }`                           | no     |
| Primary nav        | about 15px, 0.05em, 2px underline about 2px below | `NAV = { size: 15, tracking: 0.05, underline: 2, underlineGap: 2 }`    | no     |
| Breadcrumb         | 11px uppercase tracked                          | `BREADCRUMB_SIZE = 11`, `.type-micro`'s 0.12em                           | no     |
| Rail row           | 40 (page 2); 47-50 pitch (pages 3, 5)           | `RAIL_ROW_H = 40` beneath the site's 44px floor: `max(var(--rail-row-h), 44px)` | the floor wins by 4px; pages 3 and 5 pitch is their 17px labels' |
| Surface maximum    | section 7's "around 600"                        | `SURFACE_MAX = 600`; `CENTRE_PAD = 24`                                   | no     |
| Coarse target      | section 12 and 14's 44                          | `COARSE_TARGET = 44`                                                     | no     |
| Numeric grid       | two 190 fields + 22 gutter = 402                | `NUMERIC_FIELD_W`, `NUMERIC_GUTTER`, `NUMERIC_GRID_W = 402`, `INSPECTOR_INSET = 26`, `GRID_FITS_INSPECTOR = 454` | the last two are new: the finding |

All MEDIUM confidence, plus or minus 10%, and the header says so.

## Section 13's table, re-derived, with both inspector bands on the right rows

Read from `bible/HANGAR-ZONA-GUI-design-specification.md:362-363` before writing: **300-340px at 1440
and above; 268-300px at 1024-1439.** An earlier draft of the plan labelled 300-340 as "the spec's own
figure" on the 1024-1439 row - **that is the specification's figure for the row above it, a planner
defect**, corrected in the plan's interfaces block and quoted correctly in `layout.ts`'s header.

| Width      | Rail                         | Centre                     | Inspector                                                                                                        | `frameAt()`                                    |
| ---------- | ---------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| >= 1440    | 224 fixed                    | flexible, surface <= 600   | about 30%, clamped **380-456** - above the specification's own **300-340** for this row (§13:362), by D-14 Q9    | 1500: 224 / 820 / 456; 1440: 224 / 778 / 438   |
| 1024-1439  | 200 (§7)                     | flexible                   | **268-300, the specification's own figure for THIS row** (§13:363); the fraction is above 300 at every width in the band (0.304 x 1024 = 311), so the clamp resolves to **300 throughout** - the band is effectively fixed at the top figure and 268 would bind only below 881px, outside the band. Stated, not hidden | 1200: 200 / 700 / 300 |
| 768-1023   | collapsible                  | usable square surface      | below the surface                                                                                                 | 900: `"collapsible"` / 900 / `"below"`         |
| < 768      | drawer                       | focused surface            | bottom sheet or a separate Properties view                                                                        | 600: `"drawer"` / 600 / `"sheet"`; surface 552 |

**What the frame does at the two lower bands, plainly:** it stacks - the rail column above the
centre, the inspector column below it (section 13's own "below the surface") - and the page flows.
The rail's collapse control, the drawer and the bottom sheet are controls with labels the Bible does
not give; inventing them here would have been three ledgered strings for controls no route renders
yet. `frameAt()` reports the table's words; the plan that first renders a rail at those widths (13-08)
asks for them. Recorded as a question below.

**The two non-width rules.** Pointer capability sizes targets: one `@media (pointer: coarse)` rule in
the layout raises every control inside the shell to `COARSE_TARGET` on both axes, checkboxes and
radios excluded (their label row is the target, as `MotionControl.svelte` declares), and test 6
asserts the query's own text is `(pointer: coarse)` and names no width. **Orientation is untested:**
a unit test has no viewport to rotate. The e2e suite's existing viewport work (`webkit-phone` at the
iPhone 15 viewport) is where it would go if it is ever gated; no third layer was invented.

## `layout.ts`'s header, quoted

> THE TYPE SCALE IS THE PDF's MEASURED 36 / 30 / 17 (page title / panel title / group title), taken
> off the PDF at 1440. Section 12's WRITTEN 28-32 / 20 / 14 is OVERRIDDEN BY MEASUREMENT per D-17 -
> overridden, not reconciled: the two are about 20% apart and nothing was averaged. D-14 Q9 had
> settled only the inspector width on the PDF's authority; the planner extended that to the type scale
> and, per D-01, asked rather than assumed, and the user chose the PDF's. 13-03 declares the sizes as
> the .type-\* roles in src/app.css; this header is the single place the decision and its provenance
> are stated, and TYPE_SCALE below is the one export both identity.spec.ts and shell.spec.ts may read.

> SECTION 13's TWO INSPECTOR BANDS, QUOTED AGAINST THE RIGHT ROWS
> (bible/HANGAR-ZONA-GUI-design-specification.md:362-363): 300-340px at 1440 and above; 268-300px at
> 1024-1439. At 1440 and above the PDF's fraction wins (about 30%, clamped 380-456) - above the
> specification's own 300-340 for that row, by D-14 Q9. At 1024-1439 the specification's own 268-300
> IS the band used [...]

The header also carries: the raster provenance at a 1500px render and the plus-or-minus 10%; the
402px arithmetic D-14 Q9 rests on; the rule that no component writes any of these numbers itself; and
the two section 13 rules that are not widths. `TYPE_SCALE = { pageTitle: 36, panelTitle: 30,
groupTitle: 17 }` is exported. **`identity.spec.ts` test 7 still reads its sizes from `app.css` and
was not re-pointed** - its count stays at 11 and its subject is the stylesheet; `layout.ts` is the
second place the same three numbers are written, by design, and the plan's "one source" for the type
scale is the sentence, not the digits.

## The three load-bearing things, each stated

`git diff 07d910f..4ddb7f9 -- src/routes/+layout.svelte | grep -c "onMount\|SessionAnnouncer\|LICENSE"`
reads **5**, each hit explained:

| Hit                                                                  | Kind                       | What happened                                                                                                                                                                |
| -------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onMount` - zero hits                                                | -                          | **Untouched.** The two calls, `session.start()` and `install.start()`, and their comment are not in the diff at all. Left, in the layout's script, where they were.          |
| `import SessionAnnouncer from ...`                                   | context line, unchanged    | **Left.**                                                                                                                                                                    |
| `cross-region scheduler. See SessionAnnouncer.svelte.`               | context line, unchanged    | **Left.** The comment gained a paragraph beneath it saying the shell was put around the line.                                                                                |
| `<SessionAnnouncer />`                                               | context line, unchanged    | **Left, first in the document on every route.** The shell's header follows it; the layout's comment declared the order load-bearing, so the shell was put around it, not the announcer inside the shell. Test 1 asserts the announcer precedes every region in all three shapes; `session.e2e.ts`'s live-region reads are green in runs 3 and 4. |
| `- a SvelteKit route. LICENSE, THIRD-PARTY.md ...` (comment)         | removed                    | **Moved** - the explanation now lives in `Footer.svelte`'s header, longer.                                                                                                   |
| `- <a href="/LICENSE" rel="external">GPLv3</a>`                      | removed                    | **Moved whole into `Footer.svelte`**, with the other four lines. The five-line block was read out of git (`git show 07d910f:src/routes/+layout.svelte`, lines 60-64; sha256 `4862b752...` of the block) and pasted at the same indentation; test 4 holds `Footer.svelte`'s source to contain the five lines verbatim AND holds the test's literal against `git show` when git can answer. `smoke.e2e.ts` still reads `commit-sha` and derives the archive URL: green. |

**The motion control** (13-04's parked block): moved as a unit into `Footer.svelte`, under `Help &
shortcuts` - a `<button aria-expanded aria-controls>` disclosure, closed by default, whose panel
renders `<MotionControl />` unchanged (same component, same two ledgered strings, same additive rule).
The layout's parking comment was replaced by one that says where it went; `browse.e2e.ts`'s
reduced-motion title reads the box with `toBeChecked` / `toBeDisabled`, which do not require
visibility, and is green in runs 3 and 4. Whether the control should be one click away rather than on
the footer's face is recorded as a question.

## The connection slot

**The connection control is a reserved empty slot owned by 13-11.** `Header.svelte` renders
`<div class="connection" data-testid="shell-connection">` at the PDF's 218 x 37 (`CONNECTION_SLOT`)
and renders nothing inside it unless a `connection` snippet is handed over; the comment names 13-11 and
`DeviceSlot.svelte`'s button-vs-summary rule the control keeps. The footer's `Device actions` is the
same arrangement (`deviceActions` snippet), absent until filled. Nothing was built.

## Task 1: the header, the nav, the context bar and the footer

**Rendered, not only scanned.** A probe (`_probe.spec.ts`, deleted) showed `svelte/server`'s `render()`
works inside the vitest `server` project, so the structural halves of the six tests render the real
components with real props - including the whole layout with a raw-snippet page - and read the markup;
the CSS halves scan source with comments blanked, in the house style.

| Component           | Renders                                                                                                                                                                                       | Explicitly not                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Header.svelte`     | `<header>`: a link to `/` wrapping `<Wordmark />` and the text `FOR ZONA` (`.type-micro`, quiet); `<Nav>` in the app shape, the `secondary` snippet in the intro shape; the connection slot | the control (13-11); Quick guide's target (13-07)                       |
| `Nav.svelte`        | `<nav>` with three `<a>` from `SECTIONS`; `aria-current="page"` on the current one; CSS on `[aria-current]`: `color: var(--color-action)` and `border-block-end: var(--nav-underline) solid var(--color-action)` | a router - `section` is a prop                                          |
| `ContextBar.svelte` | `<section aria-labelledby={breadcrumb}>` - a region landmark named by its own breadcrumb, no invented label; three `data-zone`s; the third renders the `destination` snippet or the sentence | the install state machine (13-11), the page target (13-12)              |
| `Footer.svelte`     | `HANGAR / by intech studio`; `Help & shortcuts` disclosure (+ `·` + `Device actions` only when filled); the panel with `<MotionControl />`; a flex break; the five verbatim GPLv3 lines      | a place to lose licence compliance                                      |

One structural choice worth its own line: `ContextBar` first carried `role="region"`, and
`identity.spec.ts` test 5's classifier reads any element with a `role=` attribute as a control - which
would have made the bar's divider border a "divider on a control". A `<section aria-labelledby>` is the
same landmark without the attribute. Caught before the first run, by reading the classifier.

**The nav's hrefs.** `SECTIONS` in `shell.svelte.ts` carries `/playground/`, `/sandbox/`,
`/my-configs/` as literals typed `ResolvedPathname` - assignable because kit's `ResolvedPathname` admits
a base prefix - rather than `resolve()` calls, because none of the three routes exists and `resolve()`
is typed against the routes on disk. `svelte/no-navigation-without-resolve` accepts a value whose type
is `ResolvedPathname` (as `BrowseLink.svelte` records), so no suppression. Each landing plan swaps its
own literal.

**Three negative checks, restored from scratch copies, sha256 equal either side** (`Nav.svelte`
`65f1743d...`, `ContextBar.svelte` `9397fdcd...`, `Footer.svelte` `2cc25d70...`):

| # | Plant                                                                  | Red                                                                                                                                |
| - | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| A | the `border-block-end ... var(--color-action)` line removed from `.item[aria-current]` | test 2: `signal two: the current item carries a solid underline in the action colour (border-block-end): expected undefined to be defined` |
| B | the fallback `<span class="preview-only">` removed from the third zone | test 3: `the third zone carries the PDF's sentence when there is no destination: expected '' to be 'Preview without hardware'`   |
| C | `/LICENSE` changed to `/LICENCE` in the footer's first link            | test 4: `Footer.svelte carries the five lines verbatim: expected ... to contain '  <a href="/LICENSE" rel="external">G...'`      |

`device-ui.spec.ts` **unchanged at 13**, green beside the four.

## Task 2: the rail, the inspector, and the frame as fractions

**`Rail.svelte`** takes `sections: { title, rows }[]`, `selected`, `onselect`, and `lead` / `note` /
`action` snippets. A row is a link (`href`, typed `ResolvedPathname`, `aria-current="page"`) or a
button (`aria-current="true"`, reports its id), with at most one right-hand thing: `count` or `index`
through `padCount()`, or `meta` (the type, or the `+`). One `[aria-current]` selector carries the
raised fill and the 3px action left rule; `[aria-current] .label` carries the action colour - D-03's
three signals keyed to one attribute. `identity.spec.ts` test 6's scan, vacuous since 13-03, now prints
**"1 selected-state fills in --color-raised, all three-signal"** - the Rail is its first real subject
and **the test needed no widening**: its marker regex already matched `[aria-current]` and its family
rule already found the label's colour on the descendant selector.

**`Inspector.svelte`** takes `eyebrow`, a `headline` snippet (page 5's is two lines), `aside` (page 3's
chip), `lede`, `sections: { title, content }[]` rendered under `h3.type-group-title`, `children`, and
`actions`. Three grid rows: head / `minmax(0, 1fr)` body / actions, and **`.body` is the only rule in
the file declaring `overflow-y: auto`** - test 6 asserts the list of scrollers is exactly `[".body"]`.
The frame gives the column a bounded height (`100dvh` less the three fixed bands) so there is something
to scroll inside; the primary action is in the context bar above the frame and never inside the scroll.

**The frame** is in `+layout.svelte`: `grid-template-columns: var(--rail-w) minmax(0, 1fr)
var(--inspector-w)` with `--inspector-w: clamp(var(--inspector-min), calc(var(--inspector-fr) * 100vw),
var(--inspector-max))`, every variable set by a `style:` directive from `layout.ts`; the compact band
swaps the rail and clamp variables; the stacked and narrow bands collapse the columns to one. **The
stylesheet writes none of the numbers**; test 5 scans every shell file's style block for the layout's
figures as `px` literals and finds none. The three breakpoints are literals in the media queries
(`1439.98px`, `1023.98px`, `767.98px`, the site's form) because a media query cannot read a custom
property; test 5 pins each plus 0.02 to `BREAKPOINTS`.

**The count formatter above 99:** `padCount(100)` is `"100"`, `padCount(120)` is `"120"` - it stops
padding rather than truncating; `padCount(-1)` and `padCount(NaN)` are `"00"` (a caller's bug rendered
as zero rather than as `NaN`). Asserted in test 5; the rail renders page 5's `index: 1` as `01`,
asserted in test 6.

**Negative checks, restored from scratch copies, sha256 equal either side** (`+layout.svelte`
`d621c5de...`, `layout.ts` `4f898e3f...` then `594d4d0b...` after the anchor, `Rail.svelte`
`3ec111c3...`):

| #  | Plant                                                                              | Result                                                                                                                                                                                         |
| -- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A  | the coarse rule's query changed to `(max-width: 767.98px)`                         | test 6 red: `the query's own text: expected '(max-width: 767.98px)' to be '(pointer: coarse)'`                                                                                                 |
| B  | `INSPECTOR_MIN` and `INSPECTOR_MAX` set to 300 **in `layout.ts`**                  | **GREEN on the first try** - the test trusted the module. The anchor was added (below). Re-run: red, `the inspector at the PDF's width holds the 402px numeric grid with its insets (D-14 Q9): 300 >= 454` |
| B2 | the frame's `--inspector-w` written as a fixed `300px` **in the layout's stylesheet** | test 5 red: `a shell stylesheet writes one of layout.ts's numbers as a px literal instead of reading the variable: "src/routes/+layout.svelte writes 300px"`                                  |
| C  | `inline-size: 224px` written into `Rail.svelte`'s `.row`                            | test 5 red: `"src/lib/ui/shell/Rail.svelte writes 224px"`                                                                                                                                      |
| C2 | `style:--rail-w="224px"` in the layout's template - the same number as a bare directive value that happens to match | **GREEN, as the plan said it would be.** A matching literal resolves to the matching value and the resolved-value comparison cannot tell it from the import. The `px`-literal scan covers style blocks only; a directive value that matches is the hole, and it is stated in the spec's header rather than claimed closed |

## The finding: the plan's floor does not hold the grid it cites

Plant B passing green forced an absolute anchor, and the obvious one - "the wide band's minimum holds
the 402px grid" - **failed on the clean tree: `380 >= 402` is false.** The plan's own reason for D-14
Q9 is that the 2 x 2 numeric grid (two 190px fields plus a 22px gutter, 402px) does not fit in 300. With
the PDF's 26px insets it needs **454**; the PDF's 456 holds it with 2px to spare. The plan then clamps
the inspector to **380-456**, and 380 - 52 = 328 does not hold it either. Nor does the fraction at the
1440 breakpoint: 0.304 x 1440 = 438, less 52 = 386. **The two-column grid fits only from about 1494px of
viewport.** Three ways out, none an executor's call (D-01): raise the floor to 454 (the wide inspector
becomes all but fixed at 456, and the centre at 1440 is 760, which still holds a 600 surface); let the
schema renderer (13-09) reflow the grid to one column below 454; or narrow the fields (at 380, two
fields of about 153). Recorded in `layout.ts`'s header as `INSPECTOR_INSET` and `GRID_FITS_INSPECTOR`;
test 5 asserts the arithmetic D-14 Q9 actually rested on (`inspectorAt(1500) >= 454`) and asserts the
shortfall as a known one (`INSPECTOR_MIN < 454`, `inspectorAt(1440) < 454`) - the way identity test 4
asserts the divider's known failure - so the day the floor rises or the grid reflows, the assertion
that moves is named. **The floor was not changed.**

## The e2e suite, after each task

**Every full run was piped to a file and read through `check-counts.mjs --playwright 100`; nothing
through `grep` or `head`. Playwright's `webServer` (`npm run preview` = build + `wrangler dev`)
spawned wrangler in runs 1 and 2; runs 3 and 4 reused a wrangler started by hand on the same build.**

| Run | After  | Server                    | Result                                                                                                                                                                                                   |
| --- | ------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | task 1 | Playwright-spawned        | **30 passed, 70 failed** - the server died ~28 s in (`ERR_CONNECTION_REFUSED` from title 30 on; the one earlier red is the test that was mid-navigation when it died). Wrangler's log: `X [ERROR]` with an empty message from `ProxyController2.emitErrorEvent` via miniflare's `#handleLoopbackCustomFetchService`; process exited |
| 2   | task 1 | Playwright-spawned        | **15 passed, 85 failed** - the same death, earlier; the same empty `ProxyController` error in its log                                                                                                    |
| 3   | task 1 | hand-started `wrangler dev` | **99 passed, 1 failed**: `install.e2e.ts:560` (13 `CONFIG FETCH` frames for 12 - one extra read-back round). Rerun alone `--repeat-each 2`: **2 of 2**. Zero refused connections; 4,900+ requests served |
| 4   | task 2 | hand-started `wrangler dev` (fresh build at `4ddb7f9`) | **98 passed, 2 failed**: `install.e2e.ts:1289` (4 `CONFIG EXECUTE` for 3) and `session.e2e.ts:897` (5 config reads for 6 inside 30 s). Rerun alone, one worker, `--repeat-each 2`: **4 of 4**. Zero refused connections |

**The harness finding, named for the next executor.** wrangler 4.128.0 spawned by Playwright's
`webServer` died within 30 seconds on both attempts today; the same binary started by hand on the same
build served two full suites. Its banner in the hand-started log reads *"Wrangler detected this dev
session is running in an AI agent"* and offers explorer routes - whether that mode, or piped stdio, or
neither is the cause is not known; the error it logs is empty. 13-04 saw the tail form of the same
death on one run of three. `playwright.config.ts` is not edited in this phase (13-VALIDATION), and
`reuseExistingServer` is already true, so the workaround costs nothing: start `npx wrangler dev --port
4173 --ip 127.0.0.1` first, then run the suite. Two more earned warnings: a killed wrangler leaves
`workerd.exe` children and a parent node holding `build/`, and `npm run build` fails `EPERM` until they
are gone (`taskkill //T` on the parent, then the `workerd` PIDs); and a `&`-backgrounded wrangler holds
a Bash call open to its timeout - start it as its own background task.

**The three count races** (13 for 12, 4 for 3, 5 for 6) are all in the fake ZONA's frame counts under
three workers and all pass alone; none names the header or the footer. **The `webkit-phone` tail
transient** did not appear in runs 3 and 4. **Radius layer C** (`radius.e2e.ts`, `@webkit`) ran in both
projects in runs 3 and 4 and is green; the WebKit browser is installed.

## Strings, and the register

**No string landed; nothing ledgered as a proposal.** Every visible string is the PDF's verbatim -
`PLAYGROUND` / `SANDBOX` / `MY CONFIGS`, `FOR ZONA`, the breadcrumb forms, _Preview without hardware_,
`HANGAR / by intech studio`, `Help & shortcuts`, `Device actions` - and no aria-label was invented: the
context bar, the rail and the inspector are named by their own text through `aria-labelledby`, and the
wordmark link's name is the plain pair. `13-COPY-NEW.md` gained a "From 13-05" paragraph with three
questions (below). D-15's six circles: none here; the shell has no `border-radius` at all.

## Deviations from the plan

### 1. [Rule 3 - blocking] `config-shape.spec.ts` and `tune-ui.spec.ts` listed `src/lib/ui/` flat

Both read every directory entry as a file; the new `shell/` directory threw `EISDIR` in test 13's
front-door walk and in tune-ui's Math.random walk. Both rules are stated as the directory's ("the whole
of src/lib/ui/ is walked ... because the rule is the directory's"), so each listing was made recursive
rather than taught to skip the subdirectory - which also puts the eight shell files under the chunk
guard as roots. Committed in `4ddb7f9`.

### 2. [Rule 2 - missing mechanism] `shell.svelte.ts`, an eighth file

The plan's seven files include no way for a route to fill a layout's slots, and SvelteKit gives a
layout only `children`. The bridge is a `$state.raw` module with `fillShell()` returning its cleanup.
The plan's "seven new files" is therefore eight (nine with the spec).

### 3. [Rule 3 - ordering] `layout.ts` created in task 1

`Header.svelte` and `ContextBar.svelte` needed `HEADER_H`, `CONTEXT_H` and `CONNECTION_SLOT` and the
rule is that no component writes a number itself, so the module was written first; task 2 added the
inset and `GRID_FITS_INSPECTOR`.

### 4. [Design, the conditional the orchestrator permitted] The unfilled shape

The plan mounts `variant="app"` everywhere and `variant="intro"` on `/`. The three live routes still
draw their own header, wordmark and device slot (13-VALIDATION D-5), so an unconditional shell header
would have doubled the wordmark on every live page. No e2e title went red for it - none uses a
landmark or a wordmark role - the choice was made on sight, before the first run. The shell renders its
chrome when a route has filled it; both variants exist and are tested; the unfilled branch is named in
the layout and `shell.svelte.ts` as 13-09's to remove.

### 5. [Rule 2 - a test without an anchor] Test 5's absolute anchor, and the finding it surfaced

See "The finding" above. Plant B in the module passed green; the anchor was added; the honest anchor
failed on the clean tree; the shortfall is recorded and asserted, not fixed.

### 6. [Rule 1] Two mechanical fixes

`Rail.svelte`'s `href` typed `ResolvedPathname` (the navigation lint rule accepts the type, as
`BrowseLink.svelte` records); one word in the layout's script comment, because svelte2tsx read a literal
`<style>` inside a script comment as markup and reported the script "left open" while the compiler,
prettier and vitest were all content.

### 7. [Rule 2] The nav's three hrefs as typed literals

None of `/playground/`, `/sandbox/`, `/my-configs/` exists, so `resolve()` will not type them; the
literals are typed `ResolvedPathname` and each landing plan swaps its own.

### 8. [Design, questions recorded] `Device actions` absent until filled; `Help & shortcuts` closed

A footer label that does nothing is the coy state D-05 forbids; the label appears with its middle dot
when 13-11 hands the snippet over. The disclosure is closed by default so the footer stays the PDF's
one quiet line. Both are questions in the ledger.

### 9. [Design, question recorded] The lower bands stack

No collapse control, drawer or bottom sheet was invented; their labels are the Bible's to give or
13-08's to ask for.

### 10. [Process] `gsd-tools state` commands not run; STATE.md by script against a copy

`advance-plan`, `update-progress`, `roadmap update-plan-progress`, `requirements mark-complete`,
`record-metric`, `add-decision` and `record-session` were not run (13-01 to 13-04's reasons). STATE.md
was edited by a script that asserts every line it touches, with `status`, `completed_phases 11`,
`completed_plans 139` and `percent 100` asserted unchanged and Phase 13 recorded alongside Phase 12.
Observed and not corrected: the Performance Metrics table has rows for Phase 13 P01-P03 and none for
P04; P05's row was added after P03.

## What the plan asserts that the tree does not support

1. **"~30%, clamped 380-456" and "the 2 x 2 numeric grid ... 402px, which does not fit in 300."** The
   floor does not hold the grid either; see the finding. The clamp stands; the arithmetic is recorded
   against it.
2. **"Seven new files."** Eight, plus the spec.
3. **"Set the inspector to a fixed 300 - expect test 5 red at 1500."** True for a component plant
   (caught by the literal scan); false for a module plant until the anchor existed. Now true for both.
4. **The interfaces block's `RAIL_FR = 224 / 1500`** beside the table's "224 fixed": the table was
   followed; the fraction is exported as provenance and not used for layout.
5. **"the layout's own comment declares [the announcer's] document order load-bearing"** - true, and it
   was left; but the plan's "if moving the announcer into Footer.svelte would change its document
   order" describes a move nobody proposed.
6. **The `(pointer: coarse)` rule "raising every target to 44px"** - the shell's own controls are 44px at
   every pointer already (the site's per-control floor); the coarse rule's real subject is what a route
   renders in a slot, and test 6 walks the rendered markup so that is what it covers.

## Questions for the user, recorded rather than answered (D-01)

1. **The inspector floor.** Raise the wide floor to 454 so the 2 x 2 grid always fits (the inspector is
   then all but fixed at 456 and the centre at 1440 is 760, still a 600 surface), or let 13-09 reflow
   the grid to one column below 454, or narrow the fields? The clamp is one line either way; the
   schema renderer is not.
2. **The wordmark link's accessible name** - 13-03's question stands; the shell uses the plain pair.
3. **`Device actions`** absent until 13-11 fills it, or shown with a destination or a sentence today?
4. **`Help & shortcuts`** closed by default with the motion control under it, or open, or the checkbox
   on the footer's face as 13-04 left it?
5. **The lower bands' controls** - the rail's collapse at 768-1023 and the drawer and bottom sheet
   below 768 need labels; the Bible gives none. For 13-08.
6. **The e2e harness** - should `playwright.config.ts` stop spawning wrangler (start it outside, reuse
   it), given two deaths in two runs today? The file is not this phase's to edit.

## Known Stubs

- `Header.svelte`'s connection slot and `Footer.svelte`'s `Device actions` render nothing until 13-11
  hands a snippet over - reserved by the plan, named in both files, not a defect.
- `Header.svelte`'s intro `secondary` slot (page 1's Quick guide) renders nothing until 13-07.
- No route fills the shell yet; the unfilled branch is what every live page renders. 13-07 and 13-08
  are the first fillers.

## Self-Check: PASSED

- Files: `src/lib/ui/shell/layout.ts`, `shell.svelte.ts`, `Header.svelte`, `Nav.svelte`,
  `ContextBar.svelte`, `Footer.svelte`, `Rail.svelte`, `Inspector.svelte`, `src/lib/ui/shell.spec.ts`
  on disk; `src/routes/+layout.svelte`, `src/lib/config-shape.spec.ts`, `src/lib/ui/tune-ui.spec.ts`,
  `13-COPY-NEW.md` modified.
- Commits `4ddb7f9` and `245c363` in `git log`.
- Counts: 87 / 892 (+1 todo); e2e 84 / 100; check 594; sweep 4 19; allowlist 13 / 28.
