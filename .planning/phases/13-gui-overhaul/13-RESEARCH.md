# Phase 13: GUI Overhaul — Research

**Researched:** 2026-09-10
**Domain:** application shell redesign; a region-to-Lua compiler; local persistence without accounts; device page targeting
**Confidence:** HIGH on the firmware and cost findings (measured in this tree, against the pinned protocol and `../grid-fw` source); HIGH on the tree inventory; MEDIUM on the PDF's exact type and spacing scale (measured off a raster render, not a source file); the questions list is where the LOW-confidence material has been moved on purpose.

---

## Lead finding — the one that changes the shape of the work

**The PDF's `Target: Page 1 ▾` dropdown cannot exist as drawn, and the reason is in the firmware, not in the protocol.**

`../grid-fw/common/src/c/grid_decode.c:1272` computes

```c
bool currentpage = page == grid_ui_state.page_activepage;
```

and refuses a CONFIG/EXECUTE write with a NACK unless it is true. The read side is the same:
`grid_ui.c:471` returns early on `ui->page_activepage != page`. And `PAGESTORE`, `PAGECLEAR` and
`PAGEDISCARD` carry **no page parameter at all** — each one reads
`grid_ui_page_get_activepage(&grid_ui_state)` and acts on that (`grid_decode.c:976`, `:1048`, `:904`).

So of the four things the spec's §9 wants a page selector to do — write, read back, store, reset —
**not one of them can address a page other than the active one.** HANGAR's own transport already knew
this: `targetOf()` in `src/lib/transport/sequence.ts:261` builds its `WriteTarget` from
`id.activePage`, the page the module *reported*, and `src/lib/protocol/write-guard.ts:37` names the
symptom in a comment — *"an empty string is exactly the shape a fetch of a non-active page produces."*

There is a way to make the control real, and it is not the one the mockup implies: HANGAR can send
`PAGEACTIVE/EXECUTE` and **move the hardware's active page**, then write. `grid_decode.c:307-330`
accepts it when `page_change_enabled` is set and no bulk is running. But that changes what the user's
ZONA is *playing* on their desk, in a phase whose first rule is that nothing surprising happens to
hardware people paid for — and HANGAR's connect-time snapshot is keyed by page
(`src/lib/device/snapshot.ts`, decision 2), so a page switch means PUT BACK has to know which page it
snapshotted. This is **Question 6**, and it is the single decision that most changes Phase 13's device
work.

Second-largest finding, measured rather than argued: **a generic four-element-type Sandbox compiler
does not fit in 908.** The naive shape costs **1,166** for the PDF's own four-element surface and
**1,067 with a single element on the surface** — 159 over budget before anything is placed. It becomes
tractable only by splitting: a generic runtime on the system element (**861**) and a per-surface data
table on the touch element (**366** for four elements, **811** for sixteen). That split needs a slot
the system element's Setup does not have, because Phase 12's library already occupies 884 of its 908.
Two candidate slots exist in firmware and both need a bench row. **Questions 3 and 4.**

---

<user_constraints>

## User Constraints (from `13-CONTEXT.md`)

### Locked decisions

**D-01 — The Bible, and the one standing override.** Two documents are the primary source for every
GUI decision: `bible/HANGAR-ZONA-GUI-design-specification.md` (design proposal, 9 September 2026,
version 1; twenty sections plus sources), `bible/HANGAR for ZONA.pdf` (five screens: intro, Playground
gallery, Sandbox with a selected Fader, My configs, the Arc workspace), and `bible/hangar-logo-w.svg`
(the wordmark, supplied by the user).

> *"Keep what's necessary, remove the unimportant and add everything else that hasn't been added."*
> New ideas are welcome; the documents are primary on basics. **Where a plan is not 100% sure, it asks
> rather than guesses** — that is the user's instruction, verbatim in spirit, and it outranks the
> project's usual "make the routine call yourself."

**The override: never use rounded corners for anything.** The spec's own §12 geometry — control radius
6px, light cells 2–3px, dialogs 10px — is overridden to **zero everywhere**. This ships as a **gate**:
a test that fails on any `border-radius` above 0 in shipped CSS, so it cannot regress by habit.

**D-02 — Phase 12 first; the overhaul is Phase 13.** Phase 12 (the touch framework) runs first because
it is what makes the configurations behave on the ZONA, and because the Sandbox's region compiler will
be built on its library.

**D-03 — Sandbox v1 builds, previews AND installs.** The spec's own mockup had no firmware execution
and its §17 first-release list does not mention transfer. The user chose the full loop anyway.
**This requires a region-to-Lua compiler that does not exist today** — the largest single piece of new
engineering in the overhaul — composing placed elements (Fader, Button, Knob, XY pad; the spec flags XY
pad as needing confirmation) with geometry and MIDI mapping into the system-element library plus a
touch-element configuration inside 908 per event.

**D-04 — Typography stays Grifter + Inter.** Grifter for headlines behind one swappable token, Inter
for text. **Grifter's OpenType name table declares PERSONAL USE**; that licence must be resolved before
the site goes public, and the token exists so the swap is one line.

**D-05 — The copy changes register — use the Bible's tone and vibe.** Sentence case, short, second
person. Names the action and its result together. Plain about state, never coy. Reassuring where the
stakes are real, in one clause. Uppercase only for short section labels and breadcrumbs — `PLAYGROUND /
CONFIGURATIONS`, `YOUR LIBRARY`, `SELECTED ELEMENT / FADER` — never for sentences, headlines or
instructions. Verbs on buttons, plainly: *Explore*, *Apply to ZONA*, *Save copy*, *Share snapshot*,
*Resume draft*, *New surface*, *Connect ZONA*.

Phase 10's register — `TRY ON DEVICE`, `KEEP ON DEVICE`, `PUT BACK`, `CLEAR`, `START EXPLORING`,
`Nothing is written without a click.` — and the measured-length honesty caps that governed them are
**superseded**. The *facts* survive: RAM versus flash, the snapshot, the firmware default, the promise
that nothing writes without a click. §16's table is the reference; where a state has no line there,
write one in the same register and flag it for the user.

Non-negotiables regardless of tone: real apostrophes (*you're*, *you've*), no exclamation marks, no
emoji, no uppercase paragraphs.

### Settled by earlier phases — do not re-open

| Spec §19 question | Settled by | Answer |
|---|---|---|
| Transport, permissions, browsers | Phase 6 | Web Serial, feature-detected; Chromium and Firefox 151+; never Web MIDI for configuration |
| Apply temporary vs persistent vs separate Store | Phase 7 | Two operations on real acknowledgements: RAM write, then a separate flash store; a restore path; a firmware-default path |
| Can the device be read back and compared | Phase 7 | Yes — the snapshot fetches both events and the store classifies the result |
| Faithful reproduction vs approximation | Phases 3, 8 | The preview runs the configuration's own Lua in a vendored, firmware-faithful simulator; the label says "simulation" where the touch model differs |

### Claude's discretion (the spec's own open list, assigned to this phase)

- Region coordinate system, granularity, overlap, element types — **§1 below**
- Local recovery format, import/export schema, migration — **§2 below**
- Whether writes can target an inactive page — **answered above: no. §3 below**

### Deferred / out of scope

- Accounts, cloud sync, community feed, ratings, analytics (spec §4, §17)
- Multi-selection and alignment tools; saved searches; live hardware editing (spec §17 "subsequent")
- The companion `HANGAR-ZONA-design-tokens.css` was not supplied; §12's table carries every value

</user_constraints>

---

## Project constraints (from `CLAUDE.md` and the standing rules)

- **No Claude or Anthropic attribution anywhere. No co-author trailer. No emojis anywhere.**
- **No agent connects to, writes to, or deploys to a device.** Anything hardware-verified is a bench row for the user.
- **`src/vendor/` is not touched** except by a declared manifest row; the simulator's phase walk never moves.
- **Never edit a sibling repository.** `../grid-fw` and `../grid-editor` are read-only reference.
- 908 characters per event, measured at the **RGB444 picker corner** with the pinned `GridScript.compressScript`.
- Both Phase 11 gates apply to any Lua this phase emits: `e>=5` needs `and e<9`; onset is `(e==4 or e>8)`.
- Phase 12's library and probe rules apply: hysteresis margin 3, expiry on both paths, single contact by default, nothing built on code 9.
- No new knob, and no knob value-count change on an existing entry, without the shape-character consequence stated.
- Free services only. Cloudflare Workers static assets is the host.
- GSD workflow: file changes go through a GSD command.

---

## Phase requirements

`.planning/ROADMAP.md` § Phase 13 records **`Requirements: TBD`**. No requirement IDs were supplied to
this research. The Requirement Coverage table states all 50 v1 requirements already map to exactly one
phase, and Phase 10 owns none — it *extends, amends or records-as-untouched*. **Phase 13 should do the
same**, and which rows it amends is a planning decision, not a research one. The rows this phase will
certainly touch by extension: `IDENT-01`, `IDENT-02`, `CAT-01..04`, `TUNE-01..07`, `SHARE-01..04`,
`SAFE-01..09`, `CONN-01..08`, `DEGR-01`, `DEGR-02`, `PREV-01..06`. **New** behaviour with no home —
the Sandbox, drafts, named copies, favorites, collections, import/export, the MIDI monitor — has no
requirement row anywhere in `REQUIREMENTS.md` today and needs one. **Question 15.**

---

## 1. The PDF, screen by screen

**How these numbers were taken.** The five pages were read as raster images at a **1500 px render
width**. Every pixel figure below is in that space. The centre surface on page 3 measures 571 × 571,
which sits just under the spec's *"practical maximum around 600px"* — so the render is at or very near
1:1 with a **~1500 px design viewport**, not the 1440 the spec's §7 table is written for. Where a
figure below matters to layout, it is given as measured and as a fraction of the viewport.

### Global shell (pages 2–5; page 1 is the exception)

| Region | Measured | Notes |
|---|---|---|
| Header band | y 0 → ~76, height **76** | Wordmark left, primary nav centre-left, connection control right |
| Wordmark | x 20 → 175, cap height ~22 | `HANGAR` with the two centre strokes as `//`; `FOR ZONA` beside it at ~11px, uppercase, tracked, secondary colour |
| Primary nav | `PLAYGROUND` x≈347, `SANDBOX` x≈521, `MY CONFIGS` x≈670 | ~15px, uppercase, ~0.05em tracking; **active item is the action colour with a 2px underline of the same colour**, ~2px below the baseline box |
| Connection control | x 1260 → 1478, height ~37 | `● ZONA connected` — a small filled dot then sentence-case text. On page 1 it reads `Connect ZONA ↗` |
| Context bar | y ~76 → ~135, height **59** | Three zones: breadcrumb left, status centre, destination + primary action right |
| Breadcrumb | x 31 | `SANDBOX / CUSTOM SURFACE`, `PLAYGROUND / CONFIGURATIONS`, `MY CONFIGS / YOUR LIBRARY`, `PLAYGROUND / ARC` — 11px uppercase tracked, secondary |
| Status (centre) | x ~460 | `● Draft saved locally · Changes not applied` (pages 3, 5); a plain sentence on 2 and 4 |
| Destination (right) | `Target` label then a `Page 1 ▾` select then `Apply to ZONA` | The select is ~104 wide; the action button ~194 × 33, filled in the action colour with near-black label |
| Secondary right slot | On pages 2 and 4 the destination zone is replaced by the sentence `Preview without hardware` | |
| Left rail | x 0 → **224** (15% of viewport) | 1px divider at its right edge |
| Right inspector | x **1044** → 1500, width **456** (30%) | 1px divider at its left edge |
| Centre | x 224 → 1044, width **820** | 24–34px padding; the surface is centred inside it |
| Footer | y ~1000 → 1050 | `HANGAR / by intech studio` left; `Help & shortcuts · Device actions` right; ~13px secondary |

**Conflict with the spec, and it is not small.** §7 says *"start with a 200px rail, a flexible center,
and a 300px inspector"* at 1440. The PDF is **224 / 456**. The inspector is **~50% wider than the spec
allows** and §13's whole responsive table is keyed to 300–340. The PDF wins on look (D-01), so the
inspector wants to be ~30% of the viewport rather than a fixed 300. **Question 9.**

### Page 1 — the intro

No primary nav, no context bar, no rail, no inspector. The header carries only the wordmark, the words
`Quick guide`, and an outlined `Connect ZONA ↗` button (x 1237 → 1450, height 44). Two columns:

**Left column** (x 72 → ~710):
1. Eyebrow `WELCOME TO YOUR CONFIGURATION STUDIO` at y 170 — 11px, uppercase, tracked ~0.14em, secondary.
2. Headline, two lines, y 190 → 320: **`Make ZONA`** in near-white and **`your own.`** in the action colour. Glyph height and the 65px baseline step put the size at **62–66px** with leading ≈0.95. This is the display face.
3. Two sub-lines at y 364 and 395, ~19px, secondary: *"Find a gesture you love."* / *"Build a surface that works the way you do."*
4. **Two stacked action cards**, x 72 → 710, heights 108 and 108, gap 12:
   - Card A, y 452 → 566 — a raised surface with a **3px action-colour rule down its left edge**. Eyebrow `START WITH AN IDEA` (11px uppercase), title **`Explore Playground`** (~24px), body *"Discover configurations. Try one. Make it yours."* (~13px secondary). At its right, a **48 × 48 filled action-colour square** carrying `↗`.
   - Card B, y 583 → 697 — no left rule, a 1px boundary instead. Eyebrow `START WITH A BLANK SURFACE`, title **`Build in Sandbox`**, body *"Arrange controls and choose what each gesture does."* Right affordance is a **48 × 48 outlined square** carrying `+`.
5. A quiet line at y 738: `Already have a configuration?` then a link `Import config ↗`.
6. A bulleted line at y 780: *"Start in browser preview. Connect ZONA when you're ready."*

**Right column** (x 806 → 1425): a panel, y 133 → 802, containing an 11px uppercase label
`TRY THE SURFACE` top-left and a small filled action-colour chip `BROWSER PREVIEW` top-right. Inside
it, a **live 9 × 9 matrix** (x 859 → 1370, y 212 → 725; cell pitch ≈ 57) rendering ARC — a deep blue
field with a warm three-cell arc and a teal band. Below the matrix: `ARC / MODULATION` at 11px
uppercase left, and *"Drag across the surface to preview"* at ~13px secondary right.

**Bottom strip**, above the footer, y 845 → 930: a 1px full-width rule, then three numbered items at
x 76 / 534 / 994 — `01 Explore` / *"Find a configuration or start from scratch."*, `02 Shape` /
*"Tune the behavior, color, and MIDI mapping."*, `03 Apply` / *"Send your configuration to ZONA."* The
numbers are 11px secondary; the words ~22px in the display face.

### Page 2 — the Playground gallery

**Left rail** (0 → 224, 24px inset):
- `YOUR LIBRARY` (11px uppercase, y 150), then three rows, each 40 tall, name left and a **zero-padded two-digit count right** in secondary: `All configs 36`, `Favorites 08`, `Recently used 06`. The active row (`All configs`) has a **raised fill plus a 3px action-colour left rule**, and its label is the action colour.
- A 1px divider, then `MADE FOR` (11px uppercase, y 379) and **four** rows at 41 pitch: `Modulation`, `Notes & chords`, `Visuals`, `Expression` — plain, no counts, ~15px.
- Pinned to the bottom: two quiet lines *"Start with a configuration. / Make it feel like you."* then an outlined full-rail button **`+ Build your own`** (height 38).

**Centre** (224 → 1500 — page 2 has no inspector):
- Eyebrow `THE CONFIGURATION PLAYGROUND` at y 152.
- Headline **`Find your next gesture.`** at y 192, ~36px, near-white, display face.
- Sub *"Playable ideas for your surface. Open one, try it, make it yours."* ~17px secondary.
- A search row: label `SEARCH CONFIGURATIONS` (11px uppercase) over a field x 259 → 1142, height 38, 1px boundary, placeholder *"Search names, gestures, and tags…"*. To its right, `SORT BY` over a select x 1168 → 1466, height 38, value `Featured`.
- A filter row: the word `Use` at x 259 (~14px secondary), then four chips — `All` (active: action-colour 1px outline and action-colour label), then `Modulation`, `Notes`, `Visuals` (1px neutral boundary). Chip height 30. At the row's right end, right-aligned: `36 configurations`.
- **Three cards** across, x 259 → 1466, card width 390, gutter 24, starting y 414:
  1. A **square** matrix preview, 390 × 390 (the render shows them dark).
  2. Name at ~24px near-white, and a **favorite star at the card's right edge** — filled in the action colour when favorited, outlined when not.
  3. A single 11px uppercase line, terms separated by a middot: `MODULATION · FLOWING`, `VISUAL · ATMOSPHERIC`, `NOTES · EXPRESSIVE`.
  4. One sentence, ~14px secondary.
  5. A **full-card-width outlined button** `Explore ↗`, height 38.

### Page 3 — the Sandbox with a Fader selected

**Left rail:**
- `ADD AN ELEMENT` (11px uppercase), then four rows at 47 pitch, each name left (~17px) and a `+` right: `Fader`, `Button`, `Knob`, `XY pad`.
- Divider, then `ON THIS SURFACE` and four rows at 50 pitch, each carrying a name left and its **type right in secondary**: `Filter / Fader`, `Space / XY pad`, `Hold / Button`, `Texture / Knob`. The selected row (`Filter`) has the raised fill and the 3px action-colour left rule.
- Pinned bottom: an outlined `+ New surface`.

**Centre** (224 → 1044):
- Eyebrow `SANDBOX / MY PERFORMANCE`, headline **`My performance`** (~34px), and to the right a **two-segment mode switch**: `Edit` (active — action-colour outline and label) and `▷ Play` (neutral). Each ~78 × 33.
- Sub *"Compose your controls. Select an element to shape its behavior."*
- A row: `⌃ Undo` and `⌃ Redo` (two small outlined buttons, ~76 × 33) left; **`Save copy`** (outlined, ~148 × 33) right.
- **The surface**: an outer plate x 351 → 922, y 347 → 918 (571 square) holding a 9 × 9 lattice at pitch ≈ 63.4. Four regions drawn as filled tinted rectangles with a 1px boundary and a name label in 11px uppercase at their top-left:
  - `FILTER` — the selected one: an **action-colour 1px outline plus eight small filled square handles** at corners and edge midpoints. Inside it a vertical track and a thick action-colour bar rising from the bottom, with the value `74` in a monospaced-looking face at the bottom.
  - `SPACE` — teal fill, a crosshair (one horizontal and one vertical hairline) and a filled dot at their intersection; bottom-left readout `X 0.62  Y 0.47` in the same numeric face.
  - `HOLD` — a dim green fill, the name centred, and a small `OFF` chip beneath it.
  - `TEXTURE` — an olive fill, the name centred beneath a **circular outline with a single radial pointer at 12 o'clock**.
- Below the plate: `ZONA · CONTINUOUS TOUCH SURFACE` (11px uppercase) left, `4 elements` right.

**Right inspector** (1044 → 1500, 26px inset):
- Eyebrow `SELECTED ELEMENT / FADER`, headline **`Filter`** (~34px), and at the far right a small filled raised chip reading **`2 × 6 units`**.
- `Element name` (13px label) over a field, full inspector width, height 38, value `Filter`.
- Section title **`Position & size`** (~17px, near-white, semibold). Below it a **2 × 2 grid of numeric fields**, gutter 22: `Column` = 1, `Row` = 1, `Width` = 2, `Height` = 6. Each field 190 × 38.
- A helper line: *"Snap to light guides. Touch remains continuous."* (13px secondary).
- Section **`MIDI output`**: two fields side by side, `CC number` = 74 and `Channel` = 1.
- Section **`Appearance`**: a **34 × 34 filled swatch** in the action colour, the hex `#DCFF71` beside it, and a right-aligned link `Edit color`.
- A 1px divider, then two equal outlined buttons side by side: `Duplicate` and `Delete element`.

**Note the coordinates are one-based.** Column 1, Row 1 is the top-left cell. HANGAR's grid is
zero-based everywhere (`glag(0, n)`, `n = row*9 + col`). That translation is a real interface and needs
a named door, the way `knobPosition` and `colourPosition` already are.

### Page 4 — My configs

**Left rail:**
- `YOUR LIBRARY`, then four rows with two-digit counts: `All saved 12` (active), `Drafts 03`, `Favorites 08`, `Recently used 06`.
- Divider, then **`COLLECTIONS`** and three rows: `Live set`, `Studio experiments`, `+ New collection`.

**Centre** (224 → 1500):
- Eyebrow `YOUR PERSONAL CONFIGURATION LIBRARY`, headline **`Pick up where you left off.`** (~36px), sub *"Saved variations and custom surfaces. Every idea has a place."*
- Top-right, two buttons: outlined `Import config` (148 × 40) and **filled action-colour `New surface`** (162 × 40).
- A **resume banner**, x 259 → 1466, y 305 → 452, with a 3px action-colour left rule: a 96 × 96 matrix thumbnail, then `CONTINUE EDITING` (11px uppercase), the title `Arc — slow bloom` (~28px), and the meta line `Draft · Modulation · Last edited 12 minutes ago`. At its right a **filled action-colour `Resume draft`** button (178 × 38).
- A second search row: `SEARCH MY CONFIGURATIONS` over a field, and `SORT BY` over a select whose value is `Last edited`. Then `12 saved configurations`.
- **A table**, not cards. Column heads at 11px uppercase secondary, above a 1px rule:
  `CONFIGURATION` (x 359) · `TYPE` (x 841) · `LAST EDITED` (x 1050) · `STATUS` (x 1281). Rows are 78 tall, separated by 1px rules:
  - a 56 × 56 matrix thumbnail; the name (~19px) over a 13px secondary line `ZONA · Personal configuration`;
  - the type as sentence case — `Custom surface`, `Modulation`, `Visual`, `Notes & chords`;
  - the timestamp in words — `Today, 10:42`, `Yesterday`, `8 Sep 2026`;
  - a **status chip** — `Saved` in neutral, `Draft` in the action colour — then a small outlined `Open ↗`.

### Page 5 — the Arc workspace

Same shell as page 3, including `Target Page 1 ▾` and the filled `Apply to ZONA`.

**Left rail:** `CONFIGURATIONS`, a `← All configs` link, then six numbered rows at 47 pitch —
`Arc 01`, `Aurora 02`, `Chorus 03`, `Pulse 04`, `Orbit 05`, `Drift 06` — the active one raised with the
3px left rule. Pinned bottom: an outlined `☆ Save a copy`.

**Centre:** eyebrow `EXPLORE / MODULATION`; headline **`Arc`** (~40px); a two-segment switch
`Configure` / `▷ Play`; sub *"Draw a modulation shape. The movement continues after you let go."*
The matrix is x 375 → 890, y 313 → 838 (**515 square**, pitch ≈ 57) with a visible 1px lattice.
Below it: `ZONA · 9 × 9 LIGHT MATRIX` left and `X 512 / Y 512` right. Then, at the bottom of the
centre column, a **collapsed monitor**: a full-width bar, y 934 → 972, carrying `˅ MIDI monitor` left
and `Browser preview · No MIDI output ˅` right.

**Right inspector:** eyebrow `CONFIGURATION`, then a **two-line headline** *"Shape the / movement."*
(~30px) — the inspector carries a headline of its own, not just a section title. Sub *"Tune the
gesture, then try it on your surface."*
- Section `Behavior`: a labelled slider `Movement rate` with the value `48%` right-aligned on the same line, then the track (action-colour fill to the thumb, neutral after). Below it `On release` as a **select** whose value is `Continue movement`. Then two outlined buttons side by side: `⤬ Randomize` and `Reset settings`.
- Section `Appearance`: `Active color` label, a 34 × 34 action-colour swatch, hex `#DCFF71`, right-aligned `Edit color`.
- Section `MIDI output`: `CC number` = 74 and `Channel` = 1 side by side, then the helper *"Map this CC to a parameter in your instrument or DAW."*
- Bottom: two equal outlined buttons — `Save copy` and `Share snapshot`.

### Where the PDF and the spec disagree, and who wins

| Subject | Spec | PDF | Ruling |
|---|---|---|---|
| Inspector width | 300 at 1440 (§7, §13) | **456 at ~1500** | PDF on look (D-01). §13's table needs re-deriving as percentages. **Q9** |
| "Made for" taxonomy | Modulation, Notes, Visual (§6) | **four**: Modulation, Notes & chords, Visuals, **Expression** | Neither matches HANGAR's eight FOR terms. **Q11** |
| Character/Feels facet | Flowing, Rhythmic, Expressive, Atmospheric (§6) | present only inside the card's `MODULATION · FLOWING` line — **no Character filter row** | PDF: one filter facet in the UI, the second term is card metadata only. **Q11** |
| Collections | absent from §11 | **`COLLECTIONS`: Live set, Studio experiments, + New collection** | New feature the spec never specifies. **Q12** |
| My configs layout | "Each item shows a preview, title, kind, timestamp/status" (§11) | a **table**, not a card grid | PDF. Table it is |
| Radii | 6 / 2–3 / 10px (§12) | rounded throughout | **Both overridden to 0 by D-01** |
| Page target | *"If the protocol can only write the active page, show that as read-only"* (§9) | an editable `Page 1 ▾` **select** | **Firmware wins. Q6** |
| Intro screen | "textured imagery on an optional introduction screen" (§3) | flat, solid, no texture; a **live surface** instead | PDF. The CRT/lattice has no home even here. **Q13** |
| MIDI monitor | "optional collapsed monitor" (§10) | a collapsed bar at the bottom of the workspace centre | Agree |

### The wordmark asset

`hangar-logo-w.svg` — 3,173 bytes, **6 paths, every one `fill="#ffffff"`**, no `<defs>`, no `<style>`,
no `<text>`. `viewBox="0 0 810 809.999993"`, `width="1080" height="1080"`, `preserveAspectRatio`
present. **The ink occupies x 54.5 → 753.1 and y 361.4 → 448.1** — a 698.6 × 86.7 wordmark
(**8.06 : 1**) sitting vertically centred in a square canvas that is 78% empty.

Consequences the planner must handle:
1. **Re-crop the viewBox** to `54.5 361.4 698.6 86.7` (or wrap it). Rendered as supplied at the header's 22px cap height it would need a 205px-tall box.
2. **It is white, not `currentColor`.** The PDF's header wordmark is white and the site's action colour is the acid lime; if the mark must ever be the lime (the favicon rule, a focus state, the footer), either the fill becomes `currentColor` or it is filtered. Rewriting the fill is a one-token edit and is the honest option. **Q14.**
3. The `width`/`height` attributes at 1080 will win over CSS in some contexts; strip them.
4. The current `Splash.svelte` and `FrontDoor.svelte` render a **wide-tracked text wordmark in Grifter**, not this asset. The asset replaces it — which also decouples the wordmark from the unresolved Grifter licence.

---

## 2. What exists today — keep, re-skin, delete

**Counted from the tree at `d78e087`.** 39 `.svelte` components in `src/lib/ui/`, 13 route files,
83,719 lines of non-vendored `.ts`/`.svelte`/`.css`.

### Routes

| Path | Today | Phase 13 |
|---|---|---|
| `src/routes/+layout.svelte` | Starts the session and the install store on mount; the GPLv3 footer; `<SessionAnnouncer />`; `<ScreenToggle />` | **Keep the two `onMount` calls and the GPLv3 footer verbatim** — both are load-bearing (the footer is licence compliance). The shell (header, nav, context bar, footer chrome) moves in here. `ScreenToggle` is deleted with the CRT (see below), which removes a footer control |
| `src/routes/+page.svelte` | `<FrontDoor splash />` plus the OG head block | **Rewritten** as the intro (PDF page 1). Keep the OG head block's shape |
| `src/routes/browse/+page.svelte` | 659 lines: the wall, the toolbar, the return store, sessionStorage guard | **Logic keeps, chrome rewritten.** Becomes `/playground` |
| `src/routes/c/[id]/+page.svelte` + `.ts` | The deep-link entry: front door, chosen panel, tuning region, device controls | **Split.** Becomes `/playground/[id]` (the workspace, PDF page 5). The front-door composition leaves it |
| `src/routes/dev/*` (7 pages) | Skeleton, session, install, tune, catalog, fidelity, type probes | **Keep all seven untouched.** They are the only bench instruments; `/dev/install/` is how Phase 12's probes were installed. Re-skinning them buys nothing |
| **new** `/sandbox`, `/sandbox/[draftId]` | — | New |
| **new** `/my-configs` | — | New |
| `/share/:snapshotId` (spec §4) | — | **Do not add.** HANGAR's share is already `/c/<id>#z.<stamp>` with three landings and a full test suite. A second share route is a second codec. **Q7** |

### `src/lib/ui/` — 39 components

**Delete (7):**

| Component | Lines/bytes | Why |
|---|---|---|
| `Coverflow.svelte` | 1,048 | The spec: *"Avoid permanent animated card galleries."* The coverflow **is** one, and it is the biggest component in the tree |
| `Splash.svelte` | 382 | The intro is a solid, flat, typographic screen with a live surface. No glyph field, no dissolve |
| `glyph-field.ts` + `.spec.ts` | 195 + 5 tests | Only consumer is `Splash` |
| `ScreenToggle.svelte` | ~250 | The CRT's off switch. With the CRT gone there is nothing to switch. Its `localStorage` guard pattern is worth **copying** into the drafts store |
| `FrontDoor.svelte` | 730 | Composes wordmark + headline + coverflow + splash. Nothing in the new intro is this composition |
| `NamePlate.svelte` | ~200 | Coverflow's per-pad plate |
| `PadSpinner.svelte` | ~190 | The loading motif; the new shell's loading is a quiet state, not a walking cell |

**Keep the logic, rewrite the skin (14):**

| Component | What survives | What changes |
|---|---|---|
| `PadFrame.svelte` / `PadCanvas.svelte` | The four-layer recipe, the unlit-cell-at-alpha-0 rule, the black gutter grid, the canvas sizing | **The CRT scanline layer and the dot-field/lattice ground go** (§3: *"solid surfaces rather than background photography inside the working application"*). Corners to 0. This is what makes `aesthetic.spec.ts` scans 1, 2, 3, 5, 6, 7 stop having a subject |
| `CatalogCard.svelte` | Live pad, name, sentence, tags, featured mark | New card: square preview, name **+ favorite star**, **one** category + **one** tag (today: three tags), sentence, `Explore ↗` full-width button. 10px and 6px radii → 0 |
| `BrowseGrid.svelte` | 16 live pads behind one clock, one tab stop, `IntersectionObserver` gating | Grid becomes 3 columns at 1440 (§13). The wall itself is correct engineering and stays |
| `BrowseToolbar.svelte` | The search landmark, the sort radiogroup, the live region, the clear control, the count | Two facet rows become **one** `Use` chip row; the sort becomes a `<select>` (PDF); the count moves right-aligned; the whole thing moves under a headline instead of over a wall |
| `FacetRow.svelte` | The radiogroup mechanics, arrow-key selection, 44px targets | Chips lose their pill radius. One row, not two |
| `TuningRegion.svelte` | 957 lines. **The dynamic `await import("$lib/tune/model")` boundary is structural and must not be flattened** | Becomes the right inspector. Bands become the spec's sections. The meters move (see below) |
| `KnobRack.svelte` | The row/stacked decision | Becomes a schema-driven field list |
| `Knob.svelte` | 952 lines: rails, dots, word rows, HOLD, keyboard model | Splits into the spec's control inventory — see §4 below |
| `ColourPicker.svelte` | 942 lines. **The RGB444 lattice, the three 16-step rails, the cheap-step marks and the picker-corner budget arithmetic are the most expensive correctness in the tree** | Becomes `Swatch + popover` (§7). The popover contains today's picker essentially unchanged. Five radii (6, 2, 2, 50%, 1px) → 0, and `border-radius: 50%` on the thumb is a real visual decision, not a token swap. **Q10** |
| `BudgetMeter.svelte` / `BudgetMessage.svelte` | The four states, the over-budget red, the forecast | The spec has no budget meter anywhere. It is HANGAR's honesty and it must survive. Where? **Q8** |
| `MixTwo.svelte` | `mix.ts`'s index-vector crossover, property-tested | The spec has no equivalent. Keep or defer. **Q8** |
| `DeviceSlot.svelte` / `DeviceMark.svelte` | Nine slot states; button-vs-summary rule | Becomes the header's connection control (`● ZONA connected`) |
| `DeviceDetails.svelte` | Five disclosure states; FORGET; the snapshot line | Becomes `Device actions` in the footer, or a header popover. **Q8** |
| `InstallState.svelte` | 13 blocks, caption + body + steps | Becomes the context bar's status zone plus dialogs D02–D06 |

**Keep as-is (rename only):** `SessionAnnouncer.svelte` (the one live region, and document order is
load-bearing), `FidelityLine.svelte`, `StampNotice.svelte`, `FailureBlock.svelte`, `CopyLink.svelte`,
`TagChip.svelte`, `BrowseLink.svelte`, `ChosenPanel.svelte` → dissolves into the workspace,
`TryOnDevice` / `PutBack` / `KeepOnDevice` / `KeepConfirm` / `Clear` → become `Apply to ZONA` /
`Store on ZONA` / `Restore` / `Reset page` under D-05's copy, with **every phase, ACK gate and
confirmation path unchanged**.

### Logic that survives regardless of skin

| Module | Exports the new shell consumes | How |
|---|---|---|
| `src/lib/tune/model.ts` (954) | `Tuner`, `LadderView`, `OverBudgetView`, `ForecastView`, `ConfigStrings`, `COMPILE_DEBOUNCE_MS = 120`, `needsLadder` | The inspector calls the same `Tuner`. `landLua` / the preset landing publish the pair the install store writes |
| `src/lib/tune/view.ts` (740) | `KnobView`, `KnobWidget = "colour" \| "swatch" \| "words" \| "rail"`, `RailSkin`, `widgetFor`, `railSkin`, `knobPosition`, `WORD_ROW_MAX = 8`, `DOT_RAIL_MAX` | **This is already the schema-driven inspector.** §4 below maps it onto the spec's control inventory |
| `src/lib/tune/knobs.preset.ts` / `knobs.lua.ts` | `KnobDescriptor { id, label, kind, options, default }`, `luaKnobs()`, `STAMP_OPTION_CEILING = 32` | Both routes already arrive in one shape. The Sandbox is a **third** producer of `KnobDescriptor`s |
| `src/lib/tune/state.ts`, `mix.ts`, `surprise.ts`, `idle.ts`, `ladder.ts` | `applyKnob`, `readKnob`, `resetAll`, `baseStateFor`, `surpriseIndices`, `SURPRISE_ROLL_LIMIT = 12`, `SURPRISE_BUDGET_MS = 400` | `surpriseIndices` is **Randomize** with a different label; `SURPRISE_ROLL_LIMIT` already bounds it |
| `src/lib/device/install.svelte.ts` (1,215) | `InstallPhase` (15 members), `InstallAction`, `InstallLeg`, `InstallCause`, `install.start()` | §3 below maps its 15 phases onto the spec's 12 states |
| `src/lib/device/session.svelte.ts` (1,235) | `SessionPhase`, `SlotState`, `slotStateOf`, `capabilityOf` | The header's connection control |
| `src/lib/device/snapshot.ts` | `SNAPSHOT_KEY = "hangar.snapshot.v1"`, `persistIfAbsent` | **The migration precedent**: the version is in the key name so a `.v2` sits beside it and neither misreads the other. Copy this for drafts |
| `src/lib/transport/sequence.ts` | `writeBoth`, `writeBack`, `storeToFlash`, `fetchBoth`, `restorePageChange`, `targetOf`, `WriteTarget { sx, sy, page }` | Unchanged. The Sandbox's install goes through **the same one writer** |
| `src/lib/share/stamp.ts` (516) | `HANGAR_FORMAT_LETTERS = ["w","x","y","z"]`, `encodeFor`, `decodeFor`, `Landing` (`restored` / `older` / `unreadable` / `none`), `parseHash` | **`y` and `z` are unclaimed and reserved.** A Sandbox stamp is a new format letter, not a new codec |
| `src/lib/catalog/*` | `CatalogEntry { id, name, description, tags[3], featured, addedAt, source, preview, knobs, defaults, restsBlack }`, `listing.ts`'s `quiet` lines, `FRONT_DOOR`, `frames.json` | 27 entries after Phase 12 |
| `src/lib/browse/*` | `FOR_TERMS` (8), `FEELS_TERMS` (6), `FACETS`, `facetOf`, `parseBrowseQuery`, `sort`, `filter`, `BROWSE_RETURN_KEY = "hangar:browse-return"` (sessionStorage) | `readBrowseReturn` is already §6's *"return to the previous scroll position, filters, and search"* |
| `src/lib/sim/*` | `SimHost`, `createEngine`, `LuaPadSimHost` with **`midiLog: HostMidi[]`** and a sysex log, `ready.ts`'s lazy wasmoon, `touch.ts`, `schedule.ts` (`RENDER_INTERVAL_MS`, the catch-up clamp, reduced-motion snap to tick 64) | The monitor is a render of `midiLog` — see §5 |

---

## 3. The five hard problems

### 3.1 The Sandbox's region-to-Lua compiler (D-03)

#### The budget, measured

Every figure below was produced in this tree with `@intechstudio/grid-protocol@1.20260825.1135`,
`await initLuaFormatter()`, and `cost = max(compressScript(s).length, s.length)` — the same function
the entries are gated against. Scratch scripts were deleted; nothing was committed.

| String | Cost | Slot | Verdict |
|---|---:|---|---|
| Phase 12's library sketch, verbatim from `12-07-PLAN.md` | **884** | system Setup (908) | fits, 24 free (the plan measured 885 under its own pin) |
| The four-branch dispatcher + table + map, **one** element on the surface | **1,067** | touch Setup | **159 over** |
| Same, the PDF's actual four elements | **1,166** | touch Setup | **258 over** |
| Same, eight elements | **1,298** | touch Setup | **390 over** |
| **Dead-branch eliminated**: four *vertical faders only* | **697** | touch Setup | **fits, 211 free** |
| Dead-branch eliminated: two vertical faders only | **647** | touch Setup | fits |
| **Split**: the generic runtime `Z` alone | **861** | needs its own 908 | — |
| **Split**: touch Setup = table + map + `Y()` + `self.touch_cb=…Z(…)`, 4 elements | **366** | touch Setup | fits, 542 free |
| Same, 8 elements | **498** | | |
| Same, 12 elements | **652** | | |
| Same, **16 elements** | **811** | touch Setup | fits, 97 free |
| The Timer, `--[[@cb]]X(self,20)` | **19** | touch Timer (908) | 889 free |
| The cell→region map `M={…81 numbers}` alone | 165 | | |
| A four-row region table `G={…}` alone | 141 | | |

**Read those numbers as three facts.**

1. **The naive compiler is dead.** A generic dispatcher that can serve every element type costs more than a whole event before a single region is placed. Any plan that assumes "emit a block per element" is planning something that cannot be installed.
2. **Dead-branch elimination is worth ~470 characters.** Emitting only the branches the surface actually uses takes the four-fader case from 1,166 to 697. That is the cheapest big win and it is available with no firmware questions at all. **A fader-and-button-only Sandbox v1 fits in the touch Setup today.**
3. **The split is what makes the PDF's own surface possible.** Runtime on the system element, data on the touch element: 861 + 366, both inside 908, with room to sixteen elements. But the system Setup already holds 884 of Phase 12's library.

#### Where the second system slot is, and why it needs the bench

Read from `../grid-fw/common/src/c/grid_ui_system.c:17-33` and confirmed against the pinned package:

```
SYSTEM  => setup/ini(0)  |  mapmode/map(4)  |  timer/tim(6)
TOUCH   => setup/ini(0)  |  timer/tim(6)
```

`grid_module_zona_ui_init` (`grid_module.c:455`) gives ZONA **exactly two elements**: index 0 touch,
index 1 system. So **five 908-character actionstrings exist on a ZONA page, not two** — a total
addressable budget of **4,540 characters**, of which Phase 12 spends 884 + 19.

The mechanism that makes the extra slots reachable is in `grid_ui.c:373`:

```c
sprintf(dest, "ele[%d].%s = function (self) %s\"%s\"; ", index, function_name, fn_push, function_name);
```

Every event body is registered as **a named method on a global `ele[N]` table**. And the firmware's own
default scripts already call one from another — `grid_ui_system.h:25` and `grid_ui_touch.h:61` both
contain `"self:" GRID_LUA_FNC_A_INIT_short "()"`. So:

- `self:tim()` from the **touch Setup** should execute the touch Timer's body once, immediately — unlocking **889 free characters** in a slot that already exists and that HANGAR already writes.
- `ele[1]:map()` from either Setup should execute the **system mapmode** body — another 908, and ZONA has no mapmode button so nothing else ever fires it.

**Neither is verified.** No agent may touch hardware. Both are cheap bench rows (`self:tim()` is 11
characters; a probe that defines a global in the Timer and prints it from Setup settles it in one
install). **Q3.**

#### The design, if the slot exists

```
system Setup   (908)  Phase 12's library, 884
system mapmode (908)  Z — the generic Sandbox runtime, 861   [needs Q3]
touch  Setup   (908)  ele[1]:map()  +  G (region table)  +  M (cell→region map)
                      +  Y()  +  self.touch_cb = function(s,i,e,x,y) Z(s,i,e,x,y) end
touch  Timer   (908)  X(self, n)  — Phase 12's expiry sweep, 19
```

`Z` in full, as measured:

- Refuses non-live codes with the blessed spelling `e~=1 and e~=4 and e<9`, and hands them to `E(s,i)` so the contact expires and its release runs.
- Computes the cell as `y*9//128*9 + x*9//128` and reads the region straight out of `M` — **no search loop**, because the compiler precomputed the 81-entry map. `M` costs 165 characters and replaces a loop that costs more than that at four elements and much more at sixteen.
- **A contact keeps the region it landed in** (`S[i]`), for the whole gesture, until a lift or an expiry. This is better than hysteresis and cheaper: you do not want a finger dragged off the end of a fader to start driving the XY pad beside it. Phase 12's `Q` and `W` are therefore **not** on the Sandbox's hot path; they stay for the hand-authored entries.
- Calls `F(i, n, 2)` — Phase 12's finger light, on layer 2, above the region's own paint on layer 1. The probe's finding 5 ("finger lights its cell") applies to a Sandbox surface for exactly the same reason.
- Defines `R` — Phase 12's release convention — so a Button's note-off / CC-0 fires on **every** expiry path, including the lost lift the probe measured four times out of five (Q6.5).

#### What each element type compiles to

| Element | Region row | Behaviour | Cost note |
|---|---|---|---|
| **Fader, vertical** | `{x0,x1,y0,y1,1,cc,0,ch,r,g,b}` | value = `127-(y-y0)*127//(y1-y0)`, sent on change. The compiler **precomputes `y0`/`y1` in raw 0..127 units** rather than deriving from cells at runtime | The cheapest type; 697 for four with no other branches |
| **Fader, horizontal** | same, type 2 | value from x. Shares the fader branch via one `t==2 and … or …` | +~30 over vertical alone |
| **Button** | type 3 | on onset send 127; `R` sends 0 on lift **or expiry**. Latch mode is a second flag, not a second branch | ~+60 |
| **XY pad** | type 4, two CCs | per-axis send-on-change scaled to the region, which is Phase 12's `A` with the region's bounds instead of the pad's | ~+130 |
| **Knob** | type 5 | **undefined.** See below | — |

**The Knob has no meaning on a touch surface and the spec does not give it one.** The PDF draws a
circle with a pointer at 12 o'clock, which reads as rotary. Three readings, with costs:

- **(a) A knob is a vertical fader with a round graphic.** Free — it *is* the fader branch. Honest, universally understood, and what every touchscreen plugin does. The circular drawing on the LED matrix would be a lie about the gesture.
- **(b) A real rotary gesture, angle around the region centre.** `math` is open in the firmware VM (`grid_lua.c:523` includes `LUA_MATHLIBNAME`), so `math.atan(dy,dx)` is available — but it returns a float, it needs a wrap-around accumulator so 359°→1° is `+2` and not `-357`, and it costs an estimated 150–200 characters plus a per-contact previous-angle table. On a 3×3 region that is nine cells of travel for a full turn, which is a poor rotary.
- **(c) Drop Knob from v1.** Three types, dead-branch elimination gets easier, and the rail comes back when a gesture is decided.

**Q1** — and it is the first question, because it decides whether the palette in the PDF's left rail is
four rows or three.

#### Overlap, snapping, off-surface — checked against the 9 × 9 and the probe

- **Snapping.** §8: *"A displayed 9 × 9 layout grid is a snapping aid, not a statement that touch is limited to 81 discrete positions."* The tree agrees with this exactly: the raw stream is 0..127 per axis (Probe A Q5 reached 0/1 and 126/127, so the pad reaches its edges), and the cell is `v*9//128`. **Regions snap to cells; values come from raw.** The PDF's own helper line already says it: *"Snap to light guides. Touch remains continuous."*
- **Off-surface.** Trivially enforced in the editor: `col + width <= 9`, `row + height <= 9`, one-based in the UI, zero-based in the model.
- **Overlap.** §8 says default to preventing it. With a **cell→region map** overlap is not merely discouraged, it is **unrepresentable** — `M[n]` holds one region index. That is the right v1: the data structure enforces the rule. Layered hit-testing (§8's conditional) would need `M` to hold a list, and its cost is the reason not to.
- **The boundary.** Probe A Q2 measured the cell boundary as **one unit wide** — a still finger at x=71/72 flips cells. For a *region* boundary this matters much less than for a sequencer cell, because `S[i]` pins the region for the gesture's whole life. It matters at **onset**: a press exactly on the seam between Filter and Space is a coin flip. Phase 12's `Q` with margin 3 would fix it, at the cost of the hysteresis needing a prior cell it does not have on the first sample. The honest mitigation is in the editor, not the runtime: **the Sandbox should warn when two regions are edge-adjacent with no gap**, the way the spec's §8 wants conflicts explained at the affected region.
- **Duplicate to a free area, never silently delete** (§8): with `M` this is a search for a `w × h` window of zeros. Cheap and exact.
- **`R` and the lost lift.** Probe A Q6.5 — four of five lifts lost — means a Sandbox Button *will* hang its note-off unless `R` and `X` are wired from day one. This is not a polish item; it is the difference between a toy and something you put in front of a musician.

#### The verdict on D-03

Sandbox v1 **can** build, preview and install. The route is:
**dead-branch elimination + the runtime/data split**, with a **fader-and-button-only** fallback that
needs no firmware question at all and fits in the touch Setup as it stands today.

### 3.2 Persistence — drafts, named copies, favorites, import/export, share

**No accounts** (§4). Everything is local.

#### `localStorage` or IndexedDB

**`localStorage`, with a documented ceiling.** Reasons, in order:

1. **The precedent is already load-bearing and already correct.** `src/lib/device/snapshot.ts` imports *nothing* — zero specifiers, `import type` included — takes the store as an argument, reads the property inside its own `try` (a browser configured to refuse storage throws on the *access*, not only on use — 07-RESEARCH Pitfall 9), and **degrades every failure to "absent"**. `ScreenToggle.svelte:81` and `browse/return.ts` use the same shape. A drafts store should be a fourth instance of a pattern that has already survived prerendering, quota and a hostile browser.
2. **Size.** A Sandbox draft is a region list. The PDF's four-element surface serialises to well under 1 KB of JSON. A Playground draft is `{ entryId, knobIndices[] }` — under 100 bytes. Even 200 drafts with 96 × 96 PNG thumbnails would need IndexedDB; **without thumbnails, `localStorage`'s ~5 MB holds thousands.** Thumbnails should be *rendered live* from the simulator (the tree already renders 16 live pads on `/browse/`), not stored.
3. **Synchronicity.** `localStorage` is synchronous, which means a draft can be read during a component's `onMount` with no loading state and no flash. IndexedDB's async open would put a spinner in front of the resume banner.

**Where IndexedDB becomes right:** if the plan ever stores rendered thumbnails, imported files, or a
capture log. Recommend recording that as the documented escape hatch, not as v1.

#### The schema, and its migration

Follow `SNAPSHOT_KEY = "hangar.snapshot.v1"` exactly: **the version is in the key name, so a `.v2` sits
beside the `.v1` and neither misreads the other.** That is a stronger guarantee than a version field
inside the JSON, because an unknown-shaped record cannot be misparsed by a reader that never looks at
it. Proposed keys:

```
hangar.drafts.v1      { [draftId]: Draft }        recoverable working state
hangar.library.v1     { [copyId]: SavedCopy }     named copies
hangar.favorites.v1   string[]                     entry ids
hangar.recent.v1      { id, at }[]                 capped, see below
hangar.collections.v1 { [id]: {name, members[]} }  only if Q12 says yes
hangar.intro.v1       { seen: true, at }           the returning-user flag
```

Every record carries `{ kind: "playground" | "sandbox", schema: 1, name, createdAt, editedAt, … }`
inside as well, because **an exported file has no key name to carry its version**. So: version in the
key for local storage, version in the body for export. Both.

#### Share, and the existing stamp

`src/lib/share/stamp.ts` is 516 lines with a 592-line spec and a 469-line sweep, and it does exactly
what §11 asks for: *"Share an immutable snapshot… opening the link creates an editable copy…
subsequent source edits do not silently alter the shared result."* The stamp is in the **hash**, so it
never reaches a server; there is nothing to invalidate.

But it is bound to a **catalog entry**: the payload is a vector of base-32 knob **indices** validated
against that entry's own knob declaration, plus a shape character that produces the `older` landing.
**A Sandbox surface has no entry.** So:

- **Playground share: unchanged.** `/c/<id>#z.<format><payload>`, the three landings, `STAMP_RESTORED` / `stampOlder` / `stampUnreadable` re-worded under D-05 and nothing else.
- **Sandbox share: a new format letter.** `y` and `z` are reserved by the codec's own header and are collision-proof against BOTOR's letters. A surface payload is a region list, which is *variable-length* — unlike every existing format. The honest options: (i) a fixed 16-region envelope with a present bit each, at roughly 8 bytes per region ≈ 26 base-32 characters per region, i.e. **a ~420-character hash for a full surface**; (ii) base-32 of a compact byte encoding with a length prefix; (iii) **do not put a surface in a URL at all** — Sandbox share is "export a file", and only Playground configs get links. **Q7.**

#### Export and import

**A normal page can absolutely download a file.** `URL.createObjectURL(new Blob([json], {type:"application/json"}))` on an `<a download>` works on every browser HANGAR supports, needs no permission and no user gesture beyond the click. (The restriction the prompt asks about belongs to sandboxed iframes, not to HANGAR's own origin. `adapter-static` output on Cloudflare Workers sets no `sandbox` attribute anywhere.) Import is `<input type="file" accept="application/json">` plus `File.text()` — no File System Access API, which is Chromium-only and would break the degrade story.

§11 requires import validation *before* opening: check `schema`, check `kind`, check every region is
in bounds and non-overlapping, check every knob index is inside its knob's option list, and **show the
incompatibility rather than opening**. The `Landing` union (`restored` / `older` / `unreadable`) is the
exact vocabulary and should be reused, not reinvented.

#### "Recently used" without accounts

`hangar.recent.v1` — an array of `{ id, at }` pushed on **open**, deduped by id, capped. The PDF shows
`Recently used 06`, so a cap of 12 with 6 shown is honest. Note that the PDF's counts (36 / 08 / 06)
are illustrative; HANGAR has **27** entries after Phase 12.

### 3.3 Device targeting and the state machine (§9)

#### What the protocol and the firmware actually permit

Read from `node_modules/@intechstudio/grid-protocol/dist/index.js` and `../grid-fw` (read-only):

| Class | Code | Page field | Firmware behaviour |
|---|---|---|---|
| `CONFIG` | `0x060` | `PAGENUMBER` at offset 11, length 2 | **EXECUTE: NACK unless `page == page_activepage`** (`grid_decode.c:1272`). Also sets `page_change_enabled = 0` on every successful write (`:1279`) |
| `CONFIG` FETCH | `0x060` | same | `grid_ui_event_recall_configuration` returns early on `page_activepage != page` (`grid_ui.c:471`); the firmware then NACKs **and sends the REPORT anyway with `ACTIONLENGTH 0`** — which is why `write-guard.ts` treats an empty string as "the shape a non-active-page fetch produces" |
| `PAGEACTIVE` | `0x030` | `PAGENUMBER` at 5 | **EXECUTE changes the module's active page**, but only if `page_change_enabled` and no bulk in progress (`:319`, `:325`). REPORT is the module telling the host which page it is on |
| `PAGECOUNT` | `0x031` | `PAGENUMBER` at 5 | FETCH only; the module reports `grid_ui_state.page_count`, which `grid_ui.c:77` initialises to **4** |
| `PAGESTORE` | `0x061` | **no page field** | Always `grid_ui_page_get_activepage()` (`:976`) |
| `PAGECLEAR` | `0x064` | **no page field** | Always the active page (`:1048`) |
| `PAGEDISCARD` | `0x063` | **no page field** | Always the active page (`:904`) — reloads the page from NVM, i.e. discards the RAM edit |
| `HEARTBEAT` TYPE 255 | | | The **only** thing that restores `page_change_enabled` (`:717`). HANGAR already sends it (`restorePageChange`, `sequence.ts:374`) |

So: **four pages exist, and exactly one of them is addressable at a time.** The `Page 1 ▾` control is
either read-only, or it is a control that moves the hardware.

`PAGEDISCARD` is a finding in its own right: it is a **RAM-only undo** that reloads the stored page,
and HANGAR has no descriptor for it today (`descriptors.ts` exports `hostHeartbeat`, `fetchConfig`,
`sendConfig`, `storePage`, `fetchSerialNumber` and nothing else). It is a much cleaner "revert the
device preview" than re-writing the snapshot, and §9's D03 row asks for exactly that: *"Revert device
preview if supported."* **Q6b.**

#### The spec's twelve states against HANGAR's fifteen phases

`install.svelte.ts:212` — `InstallPhase`: `idle`, `snapshotting`, `ready`, `writing`, `settled`,
`restored`, `kept`, `cleared`, `partial`, `lost`, `snapshot-failed`, `kept-mismatch`, `unconfirmed`,
`restored-unconfirmed`, `nothing-landed`. Plus `session-copy.ts`'s `SessionPhase` / `SlotState`.

| Spec §9 state | HANGAR today | Verdict |
|---|---|---|
| No connection | `SlotState` S1 + `capabilityOf() = "ok"` | exists, **re-label only** |
| Permission needed / denied | `PERMISSION_DECLINED`, `TWO_STEP` | exists |
| Unsupported environment | `capabilityOf() = "unsupported" \| "insecure"`, `CAPTION_UNSUPPORTED`, `CAPTION_INSECURE` | exists — and is more precise than the spec's one row |
| Ready | `install.phase = "ready"` after `snapshotting` | exists |
| Draft differs | *the tuner's dirty flag, not an install phase* | **exists but lives elsewhere.** The context bar's `Changes not applied` reads the tuner, not the store |
| Applying | `writing` (+ the "still writing" over-time line) | exists |
| Applied temporarily | `settled` | exists → `On device · not stored` |
| Storing | `writing` with `leg = "store"` | exists |
| Stored | `kept` | exists → `Stored on ZONA · Page N` |
| Transfer uncertain | **four** distinct phases: `unconfirmed`, `kept-mismatch`, `partial`, `nothing-landed` | HANGAR is **finer than the spec**. Do not collapse them |
| Disconnected | `lost` + `UNPLUGGED_WHILE_CONNECTED` / `UNPLUGGED_WHILE_WRITING` | exists |
| — | `restored`, `restored-unconfirmed`, `cleared`, `snapshot-failed` | **four states the spec has no row for.** They are the safety rail. They stay |

**Nothing in the spec requires weakening a Phase 7 rule, and nothing here proposes it.** The rules
carry over verbatim: nothing writes without a click; RAM before flash; snapshot before write; ACK
before "done". What changes is the **words** (D-05) and **where the state is rendered** — the context
bar's status zone instead of a stacked block.

One genuine gap: §9's *"First use and destination changes require an explicit review"* and D02 "Apply
review" — HANGAR has `KeepConfirm` for the flash store but **no review dialog for the RAM write**,
because until now the destination was never a choice. If Q6 makes the page selectable, the review
becomes mandatory.

### 3.4 The schema-driven inspector (§7)

**HANGAR already has the validated schema the spec asks production to build.** `src/lib/tune/view.ts`
is it, and the mapping is close to one-to-one.

Twelve knob kinds (`src/lib/catalog/types.ts:105`, checked exhaustive against the vendored compiler's
own union by a type-level assertion at `:123`):
`colour`, `speed`, `direction`, `size`, `count`, `note`, `feel`, `amount`, `mode`, `bend`, `spring`, `scale`.

The widget rule (`view.ts:358`) is **total** — every kind and value set resolves:

```
colour                                    -> "colour"
direction|mode|bend|spring|scale|note     -> "words" if <= 8 options AND every option has a word,
                                             else "rail"
everything else                           -> "rail"           (skin: dots <= 8, track from 9)
```

| Spec §7 control | HANGAR today | Gap |
|---|---|---|
| **Segmented buttons** for 2–3 alternatives | `words` widget with n ≤ 3 — already a `role="radiogroup"` of real radios in labels | **none.** Rename the skin |
| **Select / combobox** for larger enumerations | `words` with 4..8 renders as a row, not a select | The PDF uses a `<select>` for `On release`. A words-row of 4 is the same information with better affordance. **Recommend: keep the row up to 4, use a select from 5.** Low risk |
| **Slider plus editable value** for continuous | `rail` with `skin: "track"` (n ≥ 9), and `KnobView.readout` already carries the right-aligned integer when every value is an integer | **The value is not editable.** The PDF shows `48%` as a read-only right-aligned figure, so this may be a non-gap. **Q5** |
| **Numeric stepper/input** for exact MIDI values | **absent.** Every knob is an index into a closed option list | **This is the one real gap, and it is architectural.** See below |
| **Swatch opens a colour popover, exact value remains available** | `ColourPicker` is inline, full RGB444 lattice, three 16-step rails, cheap-step marks | Becomes swatch + popover. The PDF shows the swatch, the hex `#DCFF71` and `Edit color`. **Q10** |
| **Changed fields gain a subtle marker and a per-field reset** | `RESET_ALL` exists; per-knob reset does not; `KNOB_HOLD` / `KNOB_HELD` exist | Per-field marker + reset is new, and cheap: `view.index !== view.default` |
| **Disabled fields include a concise reason** | `install-copy.ts`'s `DisabledReason` union already forbids "present, disabled" without a named reason | **already stronger than the spec** |

#### The stepper, the option ceiling, and the 908 forecast

Every knob on both routes is **an index into a list of literal strings** — that is what makes the stamp
five bits per knob (`STAMP_OPTION_CEILING = 32`) and what makes the budget forecast possible at all:
Phase 10's forecast walks a knob's option list, renders each literal, and measures the cost, so the
meter can say *"this knob costs +14 at its longest"* before you turn it.

A free-typed numeric stepper breaks all three:

- **The stamp.** A 0..127 CC number needs 7 bits, not 5. A stamp format that carries a raw integer is a new format letter and a new validator.
- **The forecast.** A `@CC` token whose value can be `0` or `127` differs by two characters. Bounded and cheap — but only because the domain is small and known. A free integer with an unbounded string length is not forecastable by enumeration.
- **The reachability sweep.** `reachability.sweep.spec.ts` (561 lines) walks the corners of every entry's knob space. A knob with 128 positions multiplies that space.

**The resolution, and it is available today.** The PDF's editable numerics are all in the **Sandbox**
(`Column`, `Row`, `Width`, `Height`, `CC number`, `Channel`), where a region row is a *data table*, not
a token substitution. Digits in a Lua table are exactly as forecastable as anything else: the compiler
knows every number's width. So:

- **Sandbox: real numeric steppers**, with the compiler costing the emitted table exactly.
- **Playground: keep the closed option lists.** The one place the PDF shows an editable numeric in the workspace is `CC number` = 74 on page 5, which today is a 4-option `amount` knob on STRIP. Widening it to a stepper is a **knob value-count change on an existing entry** and the standing rule requires the shape-character consequence to be stated. **Q5.**

#### "Advanced properties, only if supported"

§7's table proposes Curve, Smoothing, Phase, Clock sync, Voicing, Inversion, Velocity response,
External trigger. **HANGAR's entries declare none of these**, and the spec's own boundary says *"Use
actual parameter names, limits, units, defaults, and dependencies from the configuration schema. Do not
expose numerical concepts such as 'Arms' without a clear meaning."*

`src/lib/catalog/entries/` declares 3–5 knobs per entry drawn from twelve kinds. There is no advanced
tier, and inventing one would mean new tokens in the Lua, which costs budget on entries that are
already at 857–875 of 908 at the picker corner. **Recommendation: there is no Advanced section in v1.**
Say so explicitly rather than shipping an empty disclosure. Note that §7's own `Arms` warning is
pointed at PINWHEEL's `arms` knob, which Phase 12 plan 12-05 is already re-rendering as a rail.

### 3.5 Layout, tokens, typography, responsive, accessibility

#### Tokens: the Bible's eleven versus HANGAR's nine

`src/app.css`'s `@theme` block is **nine tokens**: `--color-ground` (true black), a three-rung text
ladder of **acid lime at alphas** (`--color-ink` 0.72, `--color-ink-quiet` 0.55, `--color-ink-dim`
0.5), two structure alphas, `--color-accent` `#d6ff4e`, `--color-glow`, and `--color-over` `#ff3b30`.
`identity.spec.ts` gates it hard: **a tenth `--color-*` is red, a fourth hue anywhere in the file is
red, a text token below AA is red.**

The Bible's §12 is **eleven tokens** and a different idea: warm graphite *surfaces* in a four-step
ladder, **near-white text**, and the lime reserved for action and selection only.

**This is the largest single visual change in the phase, larger than the layout.** HANGAR renders every
sentence in lime; the Bible renders every sentence in `#F0F1E9` and lets lime mean one thing. The PDF
confirms it on all five pages. `identity.spec.ts` is not amended by this — it is **rewritten**, and its
"three hues" rule becomes something like "these eleven values and no twelfth".

#### Contrast, computed (WCAG 2.x relative luminance, sRGB)

| Foreground | on `#101210` workspace | on `#191C18` panel | on `#22261F` raised | on `#35211D` error |
|---|---:|---:|---:|---:|
| Primary text `#F0F1E9` | **16.54** | **15.13** | **13.53** | 13.32 |
| Secondary text `#ACB3A2` | **8.71** | **7.97** | **7.12** | 7.01 |
| Action `#DCFF71` | **16.65** | **15.23** | **13.62** | 13.40 |
| Error text `#FFC4AD` | 12.32 | 11.27 | 10.07 | **9.92** |
| Control boundary `#758168` | **4.57** | **4.18** | **3.73** | 3.68 |
| Divider `#383E32` | **1.71** | **1.56** | **1.39** | 1.37 |

| Pair | Ratio | Rule | Verdict |
|---|---:|---|---|
| `#19200D` on `#DCFF71` (action label) | **14.82** | 4.5:1 | pass |
| `#758168` control boundary on every surface | 3.73 – 4.57 | 3:1 non-text | **pass on all three** |
| `#383E32` divider on every surface | **1.37 – 1.71** | 3:1 | **fails — flagged** |
| `#22261F` raised on `#191C18` panel | **1.12** | — | a selected row is invisible by fill alone |
| `#191C18` panel on `#101210` workspace | **1.09** | — | a panel is invisible by fill alone |

**Two things to say honestly.**

1. **The divider fails 3:1 and that is probably fine, but only if it stays decorative.** §12 calls it *"Decorative separation"* and WCAG 1.4.11 exempts purely decorative elements. But the PDF uses 1px rules for table row separators, panel edges, and the boundary of the whole inspector — and §3 asks to *"Replace strong borders around every subcontrol with restrained section dividers."* The rule the planner should ship: **anything that bounds a control or communicates a boundary uses `#758168`; `#383E32` is used only where removing it would change nothing but taste.** That should be a gate, because it is exactly the sort of rule that erodes.
2. **Selection cannot be a fill.** Raised-on-panel is 1.12:1 and panel-on-workspace is 1.09:1. §14 already says *"Pair selection color with outlines, labels, and selected state semantics"* and *"Never make selection depend only on color"* — and **the PDF already solves it**: every selected rail row carries a **3px action-colour left rule** (16.65:1 against the workspace) *plus* the raised fill *plus* an action-coloured label. Three signals. Keep all three; do not let the rule be dropped as decoration.

#### Typography — Grifter at the PDF's sizes

D-04 keeps Grifter + Inter. The PDF's headline face is a wide, geometric, low-contrast grotesk with a
distinctive `A` and a `G` whose spur is nearly absent — **it is not Grifter**, and it is not Inter
either. Two honest observations:

- **At 62–66px (page 1's headline) Grifter reads heavier and narrower than the PDF's face.** Grifter is a bold-only static face at weight 700 in this tree (`app.css`'s `@font-face` declares `font-weight: 700` and one src). The PDF's headline reads around 500–600. `Make ZONA your own.` in Grifter Bold at 64px will be a noticeably denser block than the PDF shows. Not wrong — different.
- **At 34px (`Filter`, `My performance`) and 36px (`Find your next gesture.`) the difference is smaller** and Grifter holds up well; those are the sizes Phase 10 already ships headings at.
- **Grifter should not carry sentence-case body-adjacent text.** Today it carries "the wordmark, the one heading and every micro label" (`app.css` §5.1). Under the Bible the micro labels are 11px uppercase tracked — Grifter is good at that. Keep the split.

**The wordmark stops being type.** `hangar-logo-w.svg` replaces the tracked-text wordmark, which
removes Grifter from the one place its licence would be most visible. The licence question does not go
away (headlines and micro labels remain), but the swap token in `app.css` is still two lines.

The scale, reconciled with §12:

| Role | §12 | PDF (measured) | Recommend |
|---|---|---|---|
| Page title | 28–32 | **62–66** (intro), 36–40 (workspace) | Two tiers: a **display** tier at 60 for the intro only, and a **page title** at 36 |
| Panel title | 20 | 34 (`Filter`), 30 (`Shape the movement.`) | 30 |
| Group title | 14 | 17 (`Position & size`) | 17 |
| Base | 14 / 1.45 | 14–15 body, 13 helper | 14 / 1.45; 13 helper |
| Metadata | 12 | 13 | 13 |
| Micro | 11 only for short uppercase | 11 uppercase, tracking ~0.12–0.14em | 11, tracking 0.12em |
| Editable touch fields | 16 | 15 in a 38px box | 16 at coarse pointer per §12 |

Tabular numerals for `74`, `X 512 / Y 512`, `X 0.62 Y 0.47`, `48%`, the `36`/`08`/`06` counts, and the
budget meter. `--font-mono` already exists.

#### Zero radius, and the gate

43 `border-radius` declarations across `app.css` and **15 components**: `BrowseToolbar` (6px),
`BudgetMeter` (three 2px), `CatalogCard` (6px, 10px, 6px), `ChosenPanel` (two 10px), `ColourPicker`
(6px, five 2px, **three 50%**, 1px), `CopyLink`, `DeviceDetails`, `FacetRow`, `KeepConfirm`, `Knob`,
`MixTwo`, `NamePlate`, `PadFrame`, `ScreenToggle`, `TuningRegion`. Plus `app.css:292`
(`border-radius: inherit`) and `app.css:421` (`border-radius: 999px` — the pill, whose header calls it
"degenerate" on purpose).

The three `border-radius: 50%` in `ColourPicker` are **circles, not rounded rectangles** — the rail
thumb and the two lattice markers. Zeroing them makes squares. That is a real design consequence of
D-01 and it should be surfaced rather than absorbed. **Q10.**

**Design the gate as three layers, because one is not enough:**

| Layer | Where | Catches | Cost |
|---|---|---|---|
| **A. Source scan** (node, `test:quick`) | reads every `src/**/*.svelte` and `src/**/*.css`, fails on any `border-radius` whose value is not `0`/`0px`/`inherit`-from-zero, **and on any Tailwind `rounded*` utility in a class string** | authored regressions; the fast one | 1 test |
| **B. Built-CSS scan** (node, run after `npm run build`, or a Playwright test in the `chromium` project like `artifacts.e2e.ts` already does) | reads `build/_app/immutable/assets/*.css` | anything Tailwind emits that the source scan cannot see, and any radius arriving from a dependency | 1 test |
| **C. Computed-style sweep** (Playwright, **and it must be `@webkit`-tagged too**) | `getComputedStyle(el).borderRadius` over every element on every route | **the UA stylesheet** — `input[type=search]`, `<button>`, `<select>` and `<meter>` carry non-zero radii by default in WebKit and in some Chromium builds, and no source scan can ever see them | 1–2 titles, 2 runs |

Layer C is the one that satisfies D-01's literal wording ("shipped CSS"), and it is also the one that
will actually find something: HANGAR's toolbar uses a real `<input type="search">` and the PDF's sort
control is a real `<select>`.

#### Responsive

§13's table is keyed to a 300px inspector; the PDF is 456 at ~1500. Re-derive as fractions and keep
§13's *breakpoints*:

| Width | Rail | Centre | Inspector |
|---|---|---|---|
| ≥ 1440 | 224 fixed | flexible, surface ≤ 600 | **~30%, clamped 380–456** |
| 1024–1439 | 200 | flexible | 300–340 (§13's figure, which fits here) |
| 768–1023 | collapsible | preserve a usable square surface | below the surface, or a drawer |
| < 768 | drawer | focused surface + visible mode switch | bottom sheet or a separate Properties view |

§13's two non-width rules are the ones easiest to lose and must be written into the plan: **use pointer
capability, not viewport, to size touch targets** (`@media (pointer: coarse)` → 44px, per §12), and
**support orientation changes without resetting work**.

#### Reduced motion, against Phase 4's contract

`src/lib/sim/host.ts:267` reads `matchMedia("(prefers-reduced-motion: reduce)")` and, per `:733-739`,
**a normal entry snaps to tick 64** rather than tick 0, because tick 0 is a pad two-thirds unlit. That
contract is correct and §6/§14 ask for exactly it: *"Show a static, meaningful frame at rest"*, *"stop
ambient preview loops"*. **Keep it verbatim.**

Two additions the spec asks for that the tree does not have:

- §6: *"Animate only the selected or explicitly previewed card."* Today `/browse/` animates every visible card. That is a **behaviour change**, not a token change, and it will make the gallery calmer and cheaper. `IntersectionObserver` gating and the shared rAF stay; the predicate narrows.
- §6: *"Provide a visible preview action on touch devices."* New control.
- §14: *"Keep motion generated by instrument output controllable."* The `SCREEN` toggle is being deleted with the CRT. Its **purpose** — a visible, non-OS motion switch — is asked for by the spec. Something must inherit it, probably in `Help & shortcuts`. **Q13.**

#### Accessibility carry-overs the plan must not lose

`SessionAnnouncer` is *the* live region and **document order is load-bearing** — the layout comment
says so explicitly. The browse toolbar owns the page's only other live region. `DeviceSlot`'s
button-vs-summary rule (a plain button whenever a click does something, a summary whenever it does not)
is a genuinely good pattern the new header should keep. §14's *"give the canvas a named region and
accessible property controls… add a spatial keyboard model and an element list so the surface is not
the sole means of selection"* — the PDF's `ON THIS SURFACE` rail **is** that element list, and it is not
optional.

---

## 4. The copy map

**Three modules, 162 exported symbols, essentially all of them user-facing strings or string
functions.** Counted by `grep -cE "^export (const|function) "`:

| Module | Lines | Exports | What it holds |
|---|---:|---:|---|
| `src/lib/device/install-copy.ts` | 545 | **59** | Four button labels + their in-flight forms, six success captions with bodies, seven failure blocks with titles and step lists, the KEEP confirmation, the CLEAR explanation, the `DisabledReason` union |
| `src/lib/tune/copy.ts` | 532 | **56** | Captions, `SURPRISE ME`, `RESET ALL`, `HOLD`/`HELD`, `COPY LINK`/`LINK COPIED`, the meter numerals and expansions, eleven colour-picker strings, `MIX TWO` and its four, the ladder and over-budget families, the three stamp landings, eight live-region announcements, `ogAlt` |
| `src/lib/device/session-copy.ts` | 554 | **47** | Five connection labels, five captions, the two-step Firefox explanation, `SAFE_NOTE`, the reconnect/replug offers, `REVOKE_EXPLANATION`, three status lines, two troubleshooting blocks, `firmwareText`, `identitySentence`, five live-region lines, `capabilityOf` |
| **Total** | **1,631** | **162** | |

Plus `src/lib/catalog/listing.ts`'s **27 `quiet` lines** and 27 `description` sentences in
`src/lib/catalog/entries/`, and `src/lib/browse/typographic.ts`.

Each of the three has a spec that gates it — `install-copy.spec.ts` (6 tests, 844 lines),
`tune/copy.spec.ts` (6), `session-copy.spec.ts` (6), `catalog/copy.spec.ts` (5), plus
`browse/typographic.spec.ts` (4). **The honesty caps** those specs assert — measured maximum lengths
per string, so a caption cannot outgrow its box — are superseded by D-05, and that is stated in
`13-CONTEXT.md`. The *rules* the specs also assert — real apostrophes, no exclamation marks, no emoji,
no uppercase paragraphs, no "Error", no browser engine named, no control label paraphrased in prose —
all carry over and should be re-asserted against the new strings.

### Where each string lands

| Today (Phase 10 register) | Spec §16 / PDF line | Status |
|---|---|---|
| `TRY ON DEVICE` | **`Apply to ZONA`** | §16 row 3 |
| `KEEP ON DEVICE` | **`Store on ZONA`** | §9 "Applied temporarily" main action |
| `PUT BACK` | — | **needs a new line.** Suggest *"Restore what was on ZONA"* |
| `CLEAR` | **`Reset active device page`** (§9) | §9 |
| `WRITING…` | **`Applying to Page N…`** | §9 |
| `KEEPING…` | **`Storing on Page N…`** | §9 |
| `SETTLED_CAPTION = "PLAYING NOW"` | **`Applied to Page 2. Store on ZONA to keep it after power-off.`** | §16 |
| `KEPT_CAPTION = "KEPT"` | **`Stored on ZONA · Page 2`** | §16 |
| `RESTORED_CAPTION = "RESTORED"` | — | **new line needed** |
| `CLEARED_CAPTION = "FACTORY DEFAULT"` | **`Reset Page 2 to its firmware default? Your browser draft will remain available.`** (the confirmation) | §16; the *result* line is new |
| `LOST_TITLE = "The ZONA was unplugged mid-write"` | **`The device stopped responding. Your draft is safe; device state could not be verified.`** | §16 |
| `UNCONFIRMED_TITLE`, `KEPT_MISMATCH_TITLE`, `PARTIAL_TITLE`, `NOTHING_LANDED_TITLE`, `RESTORED_UNCONFIRMED_TITLE`, `SNAPSHOT_FAILED_TITLE` | §16 has **one** row (`Unknown transfer result`) for all six | **six new lines needed in the same register.** Do not collapse six measured outcomes into one sentence |
| `SAFE_NOTE = "Nothing is written without a click."` | — | **the promise survives; the wording is Phase 10's.** New line needed |
| `CONNECT ZONA` | **`Connect ZONA`** | PDF page 1 header — sentence case |
| `NO ZONA` / `CAPTION_UNSUPPORTED` | **`Device connection unavailable here`** / **`Preview only. Connect ZONA when you're ready.`** | §9, §16 |
| `SURPRISE ME` | **`Randomize`** | §7. Plus **`Undo randomize`**, which is new |
| `RESET ALL` | **`Reset settings`** (PDF page 5) — and §9 distinguishes it from `Reset active device page` | PDF |
| `COPY LINK` | **`Share snapshot`** | PDF page 5 |
| `MIX TWO`, `THIS ONE`, `THAT ONE`, `TURN IT DOWN`, `HOLD`/`HELD`, `MEASURING…`, the meter families, the ladder families | — | **no §16 row and no PDF equivalent for any of them.** These are HANGAR-only mechanics |
| `START EXPLORING` | **`Explore Playground`** / **`Explore ↗`** | PDF pages 1, 2 |
| — | **`Build in Sandbox`**, `New surface`, `Save copy`, `Resume draft`, `Import config`, `Duplicate`, `Delete element`, `Open ↗`, `Edit color`, `Add an element`, `Follow hardware selection` | **new** |

**The count the planner inherits:** roughly **162 exported strings to re-write or re-home**, of which
**~35 have a §16 or PDF line**, **~40 need a new line in the same register and a user flag**, and the
rest (the meters, the ladder, the picker, MIX TWO, the identity sentences) are HANGAR mechanics the
Bible never saw. **Q8** covers what happens to those.

---

## 5. The MIDI monitor (§10)

**Most of it already exists.** `src/lib/sim/lua-host.ts:295` keeps `private readonly midiLog:
HostMidi[]`, appended at `:697` by the bridged `__hangar_gms`, plus a separate sysex log for `gmss`.
The bridge is deliberate: `gms` is absent as a bare global so `gms(...)` still raises, and every
`self:gms(ch, cmd, p1, p2, mode)` is recorded typed. §10's columns — timestamp, direction, source,
channel, message, value — are a render of that array plus a clock, with `direction` constant (`out`)
and `source` constant (`Browser preview`) in v1.

**Three honest limits:**

1. **The nine compiler-driven (preset) entries produce nothing.** `src/vendor/botor/pad-sim.ts` has no MIDI log at all — grep finds no `midi` in it — and `src/lib/sim/engine.ts` exposes none. So a `padsim` card's monitor would be empty while a `lua` card's is full. Either the monitor is **only** offered on Lua entries, or the vendored sim gains a log — which touches `src/vendor/` and needs a manifest row. **Q4b.**
2. **Rate.** Probe A Q1 measured a *still* finger emitting a message per 10 ms sample. §10 says *"Aggregate or limit high-rate messages to keep the UI responsive."* Recommend: coalesce by `(channel, cmd, p1)` inside a 100 ms window, show a `×N` count, and cap the visible log at ~200 rows with a ring. The PDF's monitor is **collapsed by default** and reads `Browser preview · No MIDI output`, so the cost at rest is one bar.
3. **`No MIDI output` is the truth and should stay the truth.** §10 keeps Browser preview, MIDI output and Hardware application distinct, and §19's Web MIDI row was closed by Phase 6: HANGAR never uses Web MIDI for configuration. Whether the *monitor* may one day route to a Web MIDI destination is a different question and out of scope. The PDF's phrasing already draws the line.

---

## 6. Randomize, undo, and parameter locks

- **`Randomize`** is `surpriseIndices()` (`src/lib/tune/surprise.ts`) re-labelled. It already respects a `SURPRISE_ROLL_LIMIT = 12` and a `SURPRISE_BUDGET_MS = 400`, which is exactly §7's *"allow parameter locks only when the configuration has enough randomizable parameters to justify them"* solved from the other end.
- **§7's scope rule — "Preserve MIDI destination, channel, routing, and device target"** — is a **behaviour change**. Today `surpriseIndices` rolls every unheld knob, and several entries carry a `@CH` channel knob (16 options) and a `@CC` controller knob. Under the spec those must be excluded from the default roll. That is a small change to one function and a real change to what the button does. Recommend doing it: rolling somebody's MIDI channel is exactly the surprise nobody wants.
- **`Undo randomize`** is new. The cheapest correct form: `surpriseIndices` returns the previous index vector, and the button restores it. One value, one click, no history stack. Note this is *not* general undo — §17's Sandbox undo/redo is separate and belongs to the Sandbox's own draft history.
- **Parameter locks** already ship as `KNOB_HOLD = "HOLD"` / `KNOB_HELD = "HELD"` with `SURPRISE_ALL_HELD` for the degenerate case. §7 permits them "only when justified"; they exist and are justified. Keep, re-label to match D-05 (`Lock` / `Locked` reads better in sentence case than `HOLD`/`HELD` in caps).

---

## 7. The catalog in the gallery

| Field | HANGAR today | The PDF's card | Gap |
|---|---|---|---|
| Preview | live pad, four layers, `restsBlack` declared per entry | a **square** matrix preview | Square is the PDF's; today's cards are square already |
| Name | `name` — **all caps** (`ARC`, `LUMEN`, `EUCLID`) | **`Arc`**, `Aurora`, `Chorus` — title case | **Every entry's `name` is uppercase.** D-05 forbids uppercase except for short labels. This is 27 renames and it changes `ogAlt`, the OG images, `frames.json` keys? (no — keys are ids) and every test that asserts a name. **Q11b** |
| Category | `tags[0]` is a FOR term from a closed eight | **one** category, from a rail of **four** | mapping needed |
| Tag | `tags[1]` and `tags[2]` are FEELS terms from a closed six | **one** descriptive tag | **HANGAR shows two, the PDF shows one.** Pick `tags[1]` or show both. **Q11** |
| Sentence | `listing.ts`'s `quiet` line (a rest-state explanation) **and** `entry.description` (the gesture) | **one** sentence describing gesture and result | The PDF's sentence is `description`, not `quiet`. `quiet` has a different job — `listing.spec.ts` *requires* one for every entry whose motion is not self-evident — and it should stay, as helper text or a tooltip. **Q11c** |
| Favorite | **does not exist** | a star, filled when favorited | new |
| Action | the card **is** the link | a full-width `Explore ↗` button | The PDF's card has a distinct action; the whole card being a link is stronger for keyboard users. Recommend: card is the link **and** the button is inside it as the visible affordance — which is what `BrowseLink.svelte` already navigates around |
| Featured | `featured: boolean`, rendered as a mark | `SORT BY: Featured` is a sort, not a mark | keep the field, drop the mark |
| Count | 27 after Phase 12 | `36 configurations` | illustrative |

### The taxonomy mapping, proposed — and it is Q11

HANGAR: **FOR** = `modulation`, `show`, `mixing`, `sequencing`, `shortcuts`, `keys`, `pointing`, `play`
(8, every one carrying ≥2 entries, **zero singletons by rule**).
**FEELS** = `readable`, `expressive`, `playable`, `generative`, `precise`, `still` (6, and `precise`
and `still` sit at **exactly the floor of 6** that `facets.spec.ts` asserts).

Spec §6: **Use** = Modulation, Notes, Visual. **Character** = Flowing, Rhythmic, Expressive, Atmospheric.
PDF rail: **Made for** = Modulation, Notes & chords, Visuals, Expression. PDF chips: All, Modulation,
Notes, Visuals.

Proposed mapping — **a lossy 8→4, and the loss is the point of the question**:

| PDF category | HANGAR FOR terms | Entries |
|---|---|---|
| **Modulation** | `modulation`, `pointing` | the largest group |
| **Notes & chords** | `keys`, `play` | |
| **Visuals** | `show` | |
| **Expression** | `mixing`, `sequencing`, `shortcuts` | **this bucket is dishonest.** A shortcut launcher is not "expression" |

The fourth bucket is where the mapping breaks. Three readings, all costed in Q11.

`Character`/`Feels`: the PDF has **no Character filter row** — the second term appears only in the
card's `MODULATION · FLOWING` line. HANGAR's six FEELS terms map onto §6's four with the same lossiness
(`readable` and `precise` have no §6 equivalent; `Rhythmic` has no HANGAR equivalent). Since the PDF
does not filter on it, **the cheapest honest answer is: keep HANGAR's six as card metadata, drop the
FEELS filter row, and let the `Use` chips be the only facet.** That also matches §3's *"Avoid…
low-contrast disabled-looking filter chips"* by having fewer of them.

**But the spec's own escape hatch says the schema decides:** *"These are proposed content categories.
The real configuration schema should determine whether multiple categories and tags are allowed."*
HANGAR's schema **does** allow one FOR and two FEELS, it has no singletons, and its histogram floors
are asserted. Under the spec's own rule, **HANGAR's taxonomy wins on content and the PDF wins on
presentation.** That is the recommendation, and it is Q11.

---

## 8. The intro screen and the returning user

§4: *"A marketing introduction should never interrupt returning users; open their last workspace or
Playground."*

**What decides "returning": a local flag, `hangar.intro.v1`, holding `{ seen: true, at }`, written on
the first successful mount of `/`.** Read it with the exact `snapshot.ts` guard shape (property access
inside a `try`, every failure degrades to "absent"), which means a storage-refusing browser sees the
intro every time — the safe direction.

**Do not put the decision in a redirect.** Three reasons, all measured in this tree:

1. `+layout.ts` sets `prerender = true`. The intro is a prerendered HTML file; a server-side decision is impossible and a client-side redirect on mount produces a visible flash of the intro before the jump.
2. `/` is the OG target. A Discord unfurl of `hangar.<host>/` must resolve to a real page with a real `<head>`, which a redirect breaks.
3. The intro carries a **live surface** (PDF page 1, right column). That is the site's single best first impression and throwing it away on a `seen` flag is a poor trade.

**Recommended instead:** `/` stays the intro, always. The flag changes what the intro *offers* — a
returning visitor's Card A becomes **`Resume draft`** pointing at the most recent
`hangar.recent.v1` / `hangar.drafts.v1` entry, exactly like the PDF page 4 resume banner, while a first
visitor's Card A is `Explore Playground`. §4 is satisfied ("never interrupt") without a redirect,
without a flash, and without losing the OG page. **Q2.**

---

## 9. Test-baseline impact

**The baseline Phase 12 will leave**, read from `12-VALIDATION.md` lines 44 and 187:

```
quick   85 files / 888 tests (+1 todo)     [84/869 carried from 11-16, + 1 file + 19 tests]
sweep   4 19  (a member list, asserted unchanged in every plan)
e2e     87 source titles / 106 runs        [86/105, +1/+1 from plan 12-01]
check   582 (svelte-check; provenance only)
catalog 27
```

The counting rule the project uses is **carried name plus delta, never a literal total**, enforced by
`scripts/check-counts.mjs`. Phase 13 must keep that discipline; it will be moving counts *down* for the
first time in the project's history, which the script should be checked against.

### Per-file forecast

| Spec | Tests | Fate | Why |
|---|---:|---|---|
| `src/lib/ui/aesthetic.spec.ts` (1,145 lines) | 8 | **7 deleted, 1 rewritten** | Scans 1, 2, 3, 5, 6, 7 are entirely about the CRT vocabulary, its allowlist, `pointer-events: none`, and the noise tile. The CRT is deleted. Scan 4 is `Coverflow`'s 3D context — deleted with the component. **Scan 8 (the unlit cell is a cell) survives** and belongs with `PadFrame` |
| `src/lib/ui/identity.spec.ts` | 7 | **rewritten in place, ~9–11 tests** | The nine-token ladder becomes eleven; "the only third hue is the over-budget alarm" becomes "these eleven and no twelfth"; the AA assertion re-runs against the new pairs; the favicon and `--font-display` tests survive **unchanged** |
| `src/lib/ui/instrument.spec.ts` (1,398 lines) | 6 | **~4 survive, 2 rewritten** | Whatever asserts the coverflow's geometry goes; the pad recipe survives |
| `src/lib/ui/device-ui.spec.ts` (1,427 lines) | 13 | **all 13 survive, strings updated** | These assert *state coverage* — every phase renders a block, every disabled control names a reason. That is behaviour, not skin |
| `src/lib/ui/tune-ui.spec.ts` (1,113 lines) | 9 | **~7 survive** | Same reason; the two that assert rack layout are re-aimed at the inspector |
| `src/lib/ui/browse-ui.spec.ts` | 6 | **~4 survive** | The facet-row tests shrink with the second facet row |
| `src/lib/ui/font-assets.spec.ts` | 5 | **survive** | The `@font-face` / asset pipeline does not move |
| `src/lib/ui/glyph-field.spec.ts` | 5 | **deleted** | Its subject is deleted |
| `src/lib/browse/typographic.spec.ts` | 4 | **survive** | |
| `src/lib/{catalog,tune,device}/*copy*.spec.ts` | 5 + 6 + 6 + 6 = 23 | **rewritten, count roughly held** | The honesty caps go; the register rules (apostrophes, no exclamation, no emoji, no uppercase paragraph) stay and get re-asserted against ~162 new strings |
| **New** | | **+ ~28–36** | no-radius gate (3), the Sandbox compiler (8–12: geometry, overlap, off-surface, budget at the corner, the four element types, `R` wiring), the drafts store (5–7: absent, corrupt, quota, version-beside-version, no-storage browser), import validation (4), favorites/recent (3), the token contrast sweep (2) |

**Net forecast: files 85 → roughly 84–88; tests 888 → roughly 890–930.** The honest statement for the
planner is that **this is the first phase in the project that deletes tests in bulk (~20)**, and the
count gate must be given explicit permission to go down, per plan, with the deleted titles named.

### e2e

| File | Titles | Fate |
|---|---:|---|
| `aesthetic.e2e.ts` | 5, **all `@webkit`** | **all 5 deleted.** Every one is about the CRT: reduced-motion on the two moving layers, the SCREEN switch, the SCREEN choice surviving navigation, the roll bar on four cores, the lattice ground. Deleting them removes **10 runs** (5 titles × 2 projects) |
| `first-experience.e2e.ts` | 11 | **~6 survive**, the splash/coverflow ones go |
| `browse.e2e.ts` / `browse-webkit.e2e.ts` | 11 + 4 | **most survive**, re-aimed at `/playground` |
| `tuning.e2e.ts` / `tuning-webkit.e2e.ts` | 10 + 5 | **survive**, re-aimed at the inspector |
| `install.e2e.ts` / `session.e2e.ts` | 13 + 14 | **survive unchanged in behaviour**, labels updated. These are the safety proofs and must not be weakened |
| `catalog`, `fidelity`, `skeleton`, `smoke`, `artifacts` | 2+2+2+4+3 | **survive** |
| **New** | | the no-radius computed-style sweep (1–2, `@webkit`-tagged), the Sandbox place/select/edit/install path (3–4), the drafts round-trip (2), import validation (1) |

**Net e2e forecast: 87 → roughly 84–90 titles; 106 → roughly 100–110 runs.** The `@webkit` project's
grep is `/@webkit/`, so deleting the five `aesthetic.e2e.ts` titles removes 5 of the 19 tagged titles.

---

## 10. Questions for the user

**This is the phase's most important output (D-01).** Each carries the readings and what each costs.
Nothing below should be answered by a plan.

---

**Q1 — What is a Knob on a flat 9 × 9 touch surface?**
The PDF's palette lists `Knob` and draws a circle with a pointer at 12 o'clock. The spec never says
what gesture drives it.
- **(a) A knob is a vertical drag with a round graphic.** Cost: **zero** — it reuses the fader branch exactly. Every touchscreen plugin does this. Risk: the circular drawing on the LED matrix implies rotation and the pad will not rotate.
- **(b) A real rotary gesture** — angle around the region's centre, with a wrap-safe accumulator. `math.atan` is available (the firmware opens `LUA_MATHLIBNAME`). Cost: **an estimated +150–200 characters** in the runtime plus a per-contact previous-angle table, and on a 3×3 region a full turn is nine cells of travel — a poor rotary. Needs a bench row.
- **(c) Drop Knob from v1.** Cost: the PDF's palette shows three rows instead of four, and the PDF's own example surface loses `Texture`. Buys the simplest v1 and the most headroom.
**Recommendation: (a).** It is free, honest, and reversible.

---

**Q2 — Does `/` stay the intro for everyone?**
§4 says the introduction *"should never interrupt returning users."*
- **(a) `/` is always the intro; a `hangar.intro.v1` flag changes Card A to `Resume draft`.** Cost: one flag, no redirect, no flash, OG page preserved, the live surface always seen. **Recommended.**
- **(b) `/` redirects returning visitors to `/playground`.** Cost: the site is prerendered, so the redirect runs on mount and **flashes the intro first**; and `/` is the OG target for every Discord unfurl.
- **(c) No flag at all.** Cost: `never interrupt` is unsatisfied, but nobody is actually interrupted — the intro is one click from anywhere.

---

**Q3 — May a plan spend bench time proving the extra Lua slots?**
ZONA has **five** 908-character actionstrings per page (system setup / mapmode / timer, touch setup /
timer), not two. The firmware registers every event body as a callable method (`ele[N].name =
function(self)…`) and its own default scripts already call one from another. So `self:tim()` (11
characters) and `ele[1]:map()` (13) may each unlock 908 more.
- **(a) Yes — one probe, installed through `/dev/install/`, that defines a global in the Timer and prints it from Setup.** Cost: one bench row, ten minutes. Payoff: **the split architecture, and with it the PDF's own four-element surface.**
- **(b) No — assume two slots only.** Cost: Sandbox v1 is **faders and buttons only** (measured: four faders = 697 of 908, fits) and XY pad and Knob are deferred. The PDF's example surface cannot be built.
**Recommendation: (a), taken early**, because it decides the Sandbox's scope.

---

**Q4 — How many elements may a Sandbox surface hold?**
Measured, in the split architecture: 4 elements = 366 of 908, 8 = 498, 12 = 652, **16 = 811 (97 free)**.
Without the split, three fader-and-button elements is roughly the ceiling.
- **(a) Cap at 8.** Comfortable margin, covers every realistic performance layout.
- **(b) Cap at 16**, with a live budget meter — HANGAR already has one and it is the site's best honesty device.
- **(c) No cap; refuse the install when the emitted string exceeds 908.** Cost: a visitor can build something that will not install, and finds out at the end.
**Recommendation: (b)** — the meter already exists, and *"you have room for four more"* is a better interface than a cap.

**Q4b — Does the MIDI monitor appear on the nine compiler-driven entries?** The vendored `pad-sim.ts`
has no MIDI log; only the Lua host does. **(a)** Monitor on Lua entries only, with the bar absent
elsewhere. **(b)** Add a log to `src/vendor/botor/pad-sim.ts` — a declared manifest row and a vendored
divergence (there are 22 today). **Recommendation: (a) for v1.**

---

**Q5 — Do any Playground knobs become free-typed numeric fields?**
The PDF page 5 shows `CC number` = 74 and `Channel` = 1 as editable text fields. Today every Playground
knob is an index into a closed option list, and that is what makes the five-bit stamp, the budget
forecast and the reachability sweep possible.
- **(a) No — Playground keeps closed lists; only the Sandbox has real steppers.** Cost: the workspace's CC field is a rail or a select rather than a text box. **Recommended.**
- **(b) Yes for `@CC` and `@CH` only.** Cost: a **knob value-count change on existing entries** (the standing rule requires the shape-character consequence stated); a new stamp format letter with wider fields; the forecast can still enumerate 0..127 but the sweep's corner space grows.
- **(c) Yes everywhere.** Cost: the stamp, the forecast and the sweep all need redesigning. Not recommended.

---

**Q6 — What does the `Target: Page 1 ▾` control do?**
Firmware: a write, a read, a store, a clear and a discard **all act on the active page only**, and
nothing but the module's own report says which that is.
- **(a) Read-only.** It displays the reported active page, and the copy says *"Switch pages on your ZONA to apply somewhere else."* Cost: zero engineering, and it is what §9 itself prescribes for this case. The PDF's dropdown becomes a label.
- **(b) It moves the hardware.** HANGAR sends the restore heartbeat, then `PAGEACTIVE/EXECUTE`, waits for the module's own report to confirm, then writes. Cost: **the ZONA on the user's desk changes what it is playing when a web page's dropdown moves** — a new class of side effect in a project whose first safety rule is that nothing writes without a click. It also needs a per-page snapshot policy (the store is already keyed by page, so this works, but PUT BACK's meaning becomes "restore the page I snapshotted", which may not be the page you are on). Needs a new descriptor and a bench row.
- **(c) Both**, behind an explicit confirmation naming the page: *"Switch your ZONA to Page 3? It will stop playing Page 1."*
**Recommendation: (a) for v1, (c) as the next step.** (b) alone is not acceptable.

**Q6b — Should `PAGEDISCARD` become HANGAR's "revert device preview"?** It reloads the active page from
NVM, i.e. undoes a RAM write without needing the snapshot. §9's D03 asks for exactly this. Cost: one
new descriptor, one new install action, one bench row. Benefit: a cleaner, firmware-native undo than
re-writing the snapshot. **Recommendation: research it in the plan, ship it if the bench confirms.**

---

**Q7 — How is a Sandbox surface shared?**
The existing stamp is `/c/<id>#z.<format><payload>`, five bits per knob, bound to a catalog entry, with
three landings and 1,000+ lines of tests. A surface has no entry and a variable-length payload.
- **(a) A new format letter (`y`), fixed 16-region envelope.** Cost: roughly **420 characters of hash** for a full surface — long but legal, and it inherits the whole `restored`/`older`/`unreadable` machinery. Needs a route that is not `/c/<id>`.
- **(b) No link for surfaces — export a file instead.** Cost: no Discord unfurl for a surface. Free otherwise.
- **(c) Both**, file first.
**Recommendation: (b) for v1.** A 420-character URL is not a share, and the file path is required by §11 anyway (*"Offer export/import when cloud links are unavailable"*).

---

**Q8 — What happens to the five HANGAR mechanics the Bible never saw?**
`MIX TWO` (genetic crossover of two knob vectors, property-tested), the **908 budget meters** and their
forecast, the **ladder** (the "turn it down" back-off), the **RGB444 colour picker's cheap-step marks**,
and the **device disclosure** (firmware version, serial, multi-module line, FORGET).
- **(a) All five survive, re-homed:** meters and ladder in the inspector under the MIDI section; MIX TWO behind a `Compare` or `Blend` control; the picker inside the swatch popover; the disclosure under `Device actions` in the footer.
- **(b) Some are cut.** MIX TWO is the obvious candidate — it has no analogue in any comparable tool.
- **(c) The meters move to a diagnostics view.** Cost: the site's best honesty device becomes invisible, and *"you have 33 characters left"* is exactly what makes a visitor trust the install.
**Recommendation: (a), except MIX TWO, which is the user's call.**

---

**Q9 — Is the inspector 300px (the spec) or ~30% (the PDF)?**
Measured at the PDF's own render: rail **224**, centre **820**, inspector **456**, total 1500. §7 says
200 / flexible / 300 at 1440.
- **(a) The PDF wins; re-derive §13's whole responsive table as fractions.** Cost: §13's four rows get new numbers. **Recommended** — D-01 says the PDF is primary on look.
- **(b) The spec wins; the PDF's inspector is a mockup artefact.** Cost: the inspector's 2 × 2 numeric grid (two 190px fields plus a 22px gutter = 402) does not fit in 300 and becomes a single column.

---

**Q10 — The three circles in the colour picker.**
D-01 zeroes every radius. `ColourPicker.svelte` has three `border-radius: 50%` — the rail thumb and two
lattice markers. Those are **circles**, not rounded rectangles.
- **(a) Zero means zero: they become squares.** Consistent, and a square thumb on a square-cornered rail reads deliberately.
- **(b) Circles are exempt** because "no rounded corners" is about corners, not about round shapes; the gate allows `50%` and `border-radius: 999px` and forbids everything else.
- **(c) Replace them with a different shape entirely** — a 2px tick, a diamond.
**Recommendation: (a).** The gate is simpler and the override was stated without exceptions. But this is a look decision and it is the user's.

**Q10b — Does the pill go?** `app.css:421` has `border-radius: 999px`, the shared pill shape used by
chips and word rows. Under (a) it becomes a rectangle. That changes the look of every chip on
`/browse/`. Confirm.

---

**Q11 — The taxonomy: eight FOR terms, four PDF categories, three spec categories.**
HANGAR: `modulation`, `show`, `mixing`, `sequencing`, `shortcuts`, `keys`, `pointing`, `play` — a
closed vocabulary with **no singletons**, gated by `facets.spec.ts`, where `precise` and `still` sit at
exactly the asserted floor of six.
- **(a) Keep HANGAR's eight as the rail; the PDF's four are a mockup.** Cost: the rail is 8 rows instead of 4. The spec's own escape hatch permits it (*"The real configuration schema should determine…"*). **Recommended.**
- **(b) Collapse 8 → 4 as proposed above.** Cost: `mixing` + `sequencing` + `shortcuts` all land in **Expression**, which is dishonest — a shortcut launcher is not expression. Every entry's `tags[0]` is re-derived, which moves the histogram and may break the no-singleton rule.
- **(c) A middle path: 8 rail rows, but only 4 chips in the `Use` filter row above the grid** (`All`, `Modulation`, `Notes`, `Visuals`), each mapping to a set of FOR terms.
**Sub-question: does the FEELS filter row survive?** The PDF has **no Character filter** — the second
term appears only as card metadata. Dropping the row is the cheaper, calmer answer and §3 asks for
fewer chips.

**Q11b — Do the 27 entry names become title case?** They are all uppercase today (`ARC`, `LUMEN`); D-05
forbids uppercase outside short labels; the PDF shows `Arc`, `Aurora`, `Chorus`. Cost: 27 renames plus
every test, OG alt text and fixture that asserts a name. **Recommendation: yes** — it is the most
visible single application of D-05.

**Q11c — Where does the `quiet` line go?** Every entry has both a `description` (the gesture) and a
`quiet` line (what it looks like at rest), and `listing.spec.ts` requires the latter for every entry
whose motion is not self-evident. The PDF's card has room for one sentence. **(a)** `description` on
the card, `quiet` as helper text in the workspace. **(b)** `quiet` as a tooltip. **(c)** Merge. The
spec has no opinion.

---

**Q12 — Are Collections real?**
The PDF page 4 shows `COLLECTIONS: Live set / Studio experiments / + New collection`. **§11 never
mentions collections** — it lists Recoverable drafts, Named copies, Favorites. Cost of shipping them:
another storage key, a membership model, a create/rename/delete flow, an empty state, and their
interaction with export. Cost of not shipping them: the PDF's rail is three rows shorter.
**Recommendation: defer to v2**, and say so on the record, because it is the one feature in the PDF
with no specification behind it at all.

---

**Q13 — What happens to the CRT, the lattice, and the SCREEN switch?**
§3 is explicit: *"Use solid surfaces rather than background photography inside the working
application"* and *"Use textured imagery on an optional introduction screen; use crisp geometry while
editing."* But the PDF's intro (page 1) is **flat and solid too**, with a live surface where the
texture would be.
- **(a) Delete all of it** — the CRT layers, the halftone grain, the lattice ground, the glyph field, `Splash`, `ScreenToggle`, and 5 e2e titles + 7 unit tests with them. Cost: **~2,000 lines and Phase 10's signature look**, and the SCREEN switch's *purpose* (a visible non-OS motion control, which §14 asks for) needs a new home in `Help & shortcuts`.
- **(b) Keep the texture on the intro only**, per §3's literal words, and delete it everywhere else. Cost: keeps `glyph-field.ts` and part of `aesthetic.spec.ts` alive for one screen that the PDF draws flat.
**Recommendation: (a)**, with the motion control re-homed. But this deletes work the user paid for in Phase 10 and it should be their call.

---

**Q14 — May the wordmark's fill become `currentColor`?**
`hangar-logo-w.svg` is 6 paths, all `fill="#ffffff"`, in a square viewBox that is 78% empty (ink is
698.6 × 86.7 inside 810 × 810).
- **(a) Re-crop the viewBox and change six fills to `currentColor`.** Cost: the supplied file is edited. Benefit: one asset serves the header (near-white), a focus state (action colour) and print.
- **(b) Ship it verbatim, wrap it, and filter it when a colour is needed.** Cost: `filter` is a blunt instrument and a wrapper is still an edit to the geometry.
- **(c) Ship verbatim, always white.** Cost: fine for the header, and nothing else can use it.
**Recommendation: (a), with the original kept unmodified in `bible/`** so the supplied asset is never lost.

---

**Q15 — Does Phase 13 own requirement rows, or amend them like Phase 10?**
`ROADMAP.md` records `Requirements: TBD`. All 50 v1 requirements already map to exactly one phase.
The Sandbox, drafts, named copies, favorites, import/export and the MIDI monitor are **new behaviour
with no requirement anywhere**.
- **(a) Phase 13 amends existing rows (Phase 10's pattern) and adds a new `BUILD-*` family for the Sandbox and a `KEEP-*` family for persistence.** Cost: the "all 50 map to exactly one phase" sentence gains a second sentence. **Recommended.**
- **(b) Everything is an amendment.** Cost: `REQUIREMENTS.md` claims the Sandbox was always covered, which is false.

---

## 11. Environment availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| `@intechstudio/grid-protocol` | the compiler's cost function, the wire | ✓ | **1.20260825.1135** (exact pin, no caret) | — |
| `wasmoon` | running compiled Lua in node to prove semantics | ✓ | 1.16.0 (exact pin) | — |
| `../grid-fw` | firmware ground truth for pages, elements, events | ✓ | working tree, **read-only** | — |
| `../grid-editor` | the ported simulator's upstream | ✓ | read-only | — |
| Node | build and test | ✓ | v24.14.0 (`engines: >=24`) | — |
| Vitest / Playwright / svelte-check / wrangler | gates | ✓ | 4.1.x / 1.60+ / 4.6+ / 4.128 | — |
| **A real ZONA** | Q3's slot probe, Q6's page switch, the Sandbox install, the Knob gesture | **✗ to every agent** | — | **none.** Bench rows only |
| A licensed Grifter | going public | **✗** | PERSONAL USE in the name table | the swap token in `app.css` (two lines) |

**Blocking with no fallback:** nothing an agent can do. **The hardware rows are the phase's only true
blockers** and every one of them is a question above.

---

## 12. Validation architecture

`.planning/config.json` has `workflow.nyquist_validation: true`.

### Test framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.x (two projects: `server`, `sweep`) + Playwright 1.60+ (two projects: `chromium`, `webkit-phone` grepping `/@webkit/`) |
| Config | `vite.config.ts` (workspace projects), `playwright.config.ts` |
| Quick run | `npm run test:quick` — `vitest run --project server` |
| Sweep | `npm run test:sweep` — `vitest run --project sweep` (member list `4 19`, asserted unchanged) |
| Types | `npm run check` — `svelte-check` |
| E2E | `npm run test:e2e` — **requires `npm run build` by hand first**; `artifacts.e2e.ts` reads `build/` and `HEAD`, so **do not commit while the suite runs** |
| Count gate | `… 2>&1 \| node scripts/check-counts.mjs <files> <tests>` — carried name plus delta, never a literal |

### Behaviour → test map

| Behaviour | Type | Command | Exists? |
|---|---|---|---|
| No `border-radius` above 0 in source | unit | `vitest run --project server -t "radius"` | ❌ new |
| No radius in built CSS | build | node scan of `build/_app/immutable/assets/*.css` | ❌ new |
| No radius in **computed** style, incl. UA defaults | e2e | `playwright test -g "@webkit.*radius"` | ❌ new |
| The eleven tokens, and no twelfth | unit | `identity.spec.ts` | ⚠ rewrite |
| Every token pair clears 4.5:1 / 3:1 | unit | `identity.spec.ts` | ⚠ extend |
| A compiled surface fits 908 at the picker corner | unit (real minifier) | `sandbox/compile.spec.ts` | ❌ new |
| A region cannot leave the 9 × 9 or overlap another | unit | `sandbox/geometry.spec.ts` | ❌ new |
| A Button's note-off fires on expiry, not only on lift | unit (**real VM**, wasmoon) | `sandbox/runtime.spec.ts` | ❌ new |
| A draft round-trips through a storage that throws | unit | `drafts.spec.ts` | ❌ new |
| An import with a wrong schema is refused, not opened | unit | `import.spec.ts` | ❌ new |
| Every install phase renders a block; every disabled control names a reason | unit | `device-ui.spec.ts` | ✅ keep |
| Nothing writes without a click | e2e | `install.e2e.ts` | ✅ keep |
| The no-Web-Serial degrade path | e2e | `session.e2e.ts` | ✅ keep |
| Reduced motion snaps to a static frame | unit + e2e | `host.spec.ts`; `aesthetic.e2e.ts` | ⚠ e2e host moves (that file is deleted) |
| Every user-facing string obeys the register | unit | the three `*copy*.spec.ts` | ⚠ rewrite |

### Sampling rate

- **Per task commit:** `npm run test:quick`
- **Per wave merge:** `npm run test:quick && npm run test:sweep && npm run check`
- **Phase gate:** all of the above, plus `npm run build` then `npm run test:e2e` **twice**, plus the counts stated as carried-plus-delta with **every deleted title named**.

### Wave 0 gaps

- [ ] `scripts/check-counts.mjs` must be checked against a **negative** delta — no phase has ever reduced the count.
- [ ] A decision on where the reduced-motion e2e assertion lives once `aesthetic.e2e.ts` is deleted.
- [ ] No new framework install is needed.

---

## 13. Recommended wave order

The ordering constraint that matters: **most of this phase does not depend on Phase 12 at all.** Phase
12 touches `src/lib/catalog/`, `src/lib/sim/lua-host.ts`, `src/lib/tune/model.ts` and the entry files.
It does not touch `app.css`, `src/lib/ui/`, the routes, or the copy modules. So the shell can be built
in parallel with Phase 12's later waves, and only the Sandbox's compiler truly waits.

| Wave | Work | Waits for Phase 12? | Why here |
|---|---|---|---|
| **0** | **Ask.** Put Q1–Q15 to the user; record the answers as `13-CONTEXT.md` amendments | **no** | D-01. Q1, Q3, Q6, Q11 and Q13 each change what later waves build |
| **1** | Tokens, type, the wordmark asset, the no-radius gate (all three layers) | **no** | Nothing else can be skinned until the eleven tokens exist and the gate is watching. The gate lands **before** the first component, so no new radius is ever authored |
| **2** | The shell: `+layout.svelte` header, nav, context bar, footer; the rail and inspector primitives; the responsive frame | **no** | Everything after this fills regions |
| **3** | The intro (`/`) and the returning-user flag. **Deletes** `Splash`, `Coverflow`, `FrontDoor`, `NamePlate`, `glyph-field`, `PadSpinner`, `ScreenToggle`, the CRT layers, and 7 unit + 5 e2e titles | **no** | The single largest deletion; doing it early stops later waves maintaining dead code |
| **4** | `/playground` — the gallery, rail, search, chips, sort, cards, favorites, recent, the browse-return | **no** (uses `listing.ts`, which Phase 12 edits — **soft** conflict on entry files only) | |
| **5** | `/playground/[id]` — the workspace: schema-driven inspector, the control inventory, Randomize + Undo, the collapsed monitor, `Save copy`, `Share snapshot` | **no** | Reuses the whole `tune/` layer unchanged |
| **6** | The device band: connection control, context-bar status, the twelve-state labelling, the target-page decision from Q6, the review dialogs. **No Phase 7 rule weakens** | **no** | |
| **7** | Persistence: drafts, named copies, favorites, `/my-configs`, export/import with validation | **no** | |
| **8** | **The Sandbox runtime** — the compiler, the region model, the budget cost function, the `R`/`X` wiring, proved in wasmoon | **YES — hard** | It is built on Phase 12's library and its probe constants. This is the wave that cannot start early |
| **9** | The Sandbox editor — palette, placement, selection, geometry validation, overlap conflicts, undo/redo, Edit/Play | after 8 | |
| **10** | The Sandbox install — through the **same one writer**, the same snapshot, the same ACK gates | after 8, 6 | |
| **11** | Copy: all ~162 strings re-written under D-05, the register specs rewritten, every string with no §16 line flagged | **no**, but **last** | Copy written before the screens exist gets written twice |
| **12** | The gate: counts as carried-plus-delta with every deleted title named; contrast sweep; the three radius layers green; the bench rows for the user (Q3's slot probe, Q6's page switch, the Sandbox install on real hardware, the Knob gesture) | — | |

**Waves 1–7 and 11 can all run before Phase 12 closes.** Waves 8–10 cannot. If schedule pressure
arrives, the honest cut is **Sandbox v1 = faders and buttons only** (measured to fit in the touch Setup
as the tree stands today, with no firmware question and no bench row), with XY pad and Knob deferred
behind Q3's answer.

---

## Sources

### Primary (HIGH confidence)

- `../grid-fw/common/src/c/grid_decode.c` — `:1272` the active-page write guard, `:1279` `page_change_enabled = 0`, `:307-330` PAGEACTIVE, `:377` PAGECOUNT, `:717` the heartbeat restore, `:904`/`:976`/`:1048` the three page ops with no page parameter
- `../grid-fw/common/src/c/grid_ui.c` — `:77` `page_count = 4`, `:79` `page_change_enabled = 1`, `:373` the `ele[N].name = function(self)` registration, `:464-501` `grid_ui_event_recall_configuration`
- `../grid-fw/common/src/c/grid_ui_system.c:17-33` — the system element's three events; `grid_ui_touch.c:85-97` — the touch element's two; `grid_module.c:455` — ZONA's two elements
- `../grid-fw/common/src/c/grid_lua.c:513-527` — the opened Lua libraries (`math` is open, `coroutine` and `utf8` are not)
- `../grid-fw/common/src/c/grid_ui_system.h:25`, `grid_ui_touch.h:61` — the firmware's own `self:ini()` calls
- `node_modules/@intechstudio/grid-protocol@1.20260825.1135` — `GRID_CLASS_CONFIG_PAGENUMBER_offset 11`, the PAGE* class codes, `grid.get_element_events` for all eight element types, `GridScript.compressScript` under `initLuaFormatter()`
- **Measured in this tree, 2026-09-10**: every cost figure in §3.1, produced with the pinned `compressScript` and `checkSyntax`. Scratch scripts deleted; nothing committed
- **Computed in this tree**: every contrast ratio in §3.5, WCAG 2.x relative luminance over §12's eleven tokens
- `bible/HANGAR for ZONA.pdf`, five pages — read at a 1500px render; every measurement in §1 is in that space
- `bible/hangar-logo-w.svg` — 6 paths, `#ffffff`, ink 698.6 × 86.7 in an 810 × 810 viewBox, parsed
- `.planning/phases/12-touch-framework/PROBE-RESULTS-2026-09-10.md` — the touch ground truth
- `.planning/phases/12-touch-framework/12-07-PLAN.md` — the library sketch and its contracts
- `.planning/phases/12-touch-framework/12-VALIDATION.md:44,187` — the projected close
- The HANGAR tree at `d78e087` — every file and line cited inline

### Secondary (MEDIUM confidence)

- `bible/HANGAR-ZONA-GUI-design-specification.md` — authoritative on intent, explicitly *"a design handoff, not a claim that the proposed features are… supported by ZONA firmware"*. Several of its §19 rows are answered above by firmware source that contradicts its §9 mockup
- The PDF's type sizes — derived from glyph heights and baseline steps in a raster render, not from a source file. Treat as ±10%

### Unverified — needs the bench (LOW, and deliberately left there)

- `self:tim()` and `ele[1]:map()` executing an event body from another event's script. The mechanism is in the firmware and the firmware's own defaults use it; **that it works for a *host-written* script has not been observed** (Q3)
- `PAGEACTIVE/EXECUTE` from HANGAR actually moving a ZONA's page (Q6)
- Any Sandbox surface behaving as compiled on real hardware
- Whether a rotary gesture on a 3 × 3 region is usable at all (Q1)

---

## Metadata

**Confidence breakdown**

| Area | Level | Reason |
|---|---|---|
| The page-targeting finding | **HIGH** | Read from firmware source, three independent call sites, and corroborated by a comment already in HANGAR's own `write-guard.ts` |
| The Sandbox cost figures | **HIGH** | Measured with the pinned minifier in this tree, not estimated |
| The five-slot budget | **HIGH** on the slots existing (firmware source + the package's own event list); **LOW** on them being *reachable from a host-written script* |
| The tree inventory | **HIGH** | Counted and read |
| The contrast table | **HIGH** | Computed |
| The PDF's layout figures | **MEDIUM** | Measured off a raster at an inferred viewport |
| The PDF's type scale | **MEDIUM** | Derived from glyph metrics |
| Grifter's behaviour at 64px | **LOW** | Judged from the render, not set |
| The test-count forecast | **MEDIUM** | Per-file reasoning against real titles; the plan will move it |

**Research date:** 2026-09-10
**Valid until:** the firmware findings are stable for as long as the pin holds; the PDF and spec are
frozen documents; **the tree inventory expires when Phase 12 lands** — re-read `12-*-SUMMARY.md` for
the actual close before planning waves 4, 8 and 12.
