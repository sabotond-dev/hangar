# 13-18 — the copy batch: every string with no line in the design documents

Built 2026-09-12 by plan 13-18, task 01. One document, one decision. Nothing in `src/` changed to
make it; task 02 changes `src/` after you answer.

## What this is, in plain words

The design specification (the Bible) and its five-screen PDF give HANGAR most of its words. Every
string that has a line there is taken verbatim — apostrophes, middots and capitalisation included —
and is **not** in this document. This document is the rest: every string HANGAR says that neither
document wrote a line for. Seventeen waves of Phase 13 each wrote the strings they needed in the new
register and put them in a ledger (`13-COPY-NEW.md`) instead of guessing; Phase 10's device copy is
still in the old register (`TRY ON DEVICE`, `PUT BACK`, `Nothing is written without a click.`) and
has never been rewritten. Both sets are here, in one table, so you decide the product's voice once.

**The numbers, counted rather than estimated.**

- The ledger holds **153 rows** across twelve tables, not the "about forty" the plan estimated. About
  a hundred of them are strings a wave already landed in the new register (a title, a field label,
  a refusal), and for those the proposal is mostly "keep". The forty-odd that need a real decision
  are the device band's, and they are grouped together in section I.
- The ledger also filed **70 questions** (66 numbered, four in prose). The ones that are about a
  string became rows; the ones that are about a shape or a behaviour are in section H with a
  proposed answer each.
- The Bible's copy table, §16, has **eleven rows**. The plan's earlier "about thirty-five" was §16
  plus everything legible on the PDF's five pages; it was never §16's own count.
- `install-copy.ts` has **61** exports today (the plan said 59; 13-12 added `Switch page` and
  `Keep this page`), `session-copy.ts` **47**.

**Every proposal keeps the fact its old string carried.** The four facts that must survive whatever
the words become — RAM against flash, the snapshot, the firmware default, and that nothing is
written without a click — are traced old-to-new in section C, with a fifth 12.1 added (a store
carries the page's own scripts, five in all). Edit the words freely; the facts are the constraint.

**Six transfer lines, on purpose.** §16 offers one sentence — *"The device stopped responding. Your
draft is safe; device state could not be verified."* — for six different things that can go wrong
with a write. HANGAR measures which one happened and each has a different recovery (a write whose
acknowledgement never came is not a flash store that read back differently, which is not a snapshot
that could not be taken). Section I.5 proposes six sentences. If you would rather have the one, say
`collapse-six` and the six become §16's line with the recovery steps kept beneath it.

**How to answer.** Reply `approve` to take every proposal as written. Or reply with edits by row
number or symbol (`I.5.3: …` or `PARTIAL_TITLE: …`); anything you do not mention is approved as
proposed. Say separately whether the six transfer lines stay six or become one. Section J's
questions have a proposed answer each; silence approves the proposal.

## A. The register, restated as the rules every proposal below was checked against

Sentence case, short, second person. The action and its result in one line. Plain about state,
never coy. Reassuring in one clause where the stakes are real. Uppercase only for short section
labels, eyebrows and breadcrumbs — never a sentence. Verbs on buttons. Real apostrophes (*you’re*,
*can’t*), a real ellipsis, a real em dash. No exclamation marks. No emoji. No bare "Error". No
browser engine named (Chrome, Edge and desktop Firefox 151+ by name; never "Chromium"). No control
label paraphrased in prose — a body sentence names the button exactly as the button reads.

Column headings in every table below: **#** · **Symbol** · **Module** · **The state it names** ·
**The fact it must carry** · **Shipped today (verbatim)** · **Proposed** · **Why there is no Bible
line**. "Shipped today" is Phase 10's string where one exists and the wave's own line where Phase 13
landed it; where they differ from Phase 10's the predecessor is named.

## B. Taken verbatim and therefore not in the batch — listed once so you can see the boundary

From §16: *Preview only. Connect ZONA when you’re ready.* · *Changes not applied* · *Apply to ZONA* ·
*Replace the configuration on ZONA · Page 2?* · *Applied to Page 2. Store on ZONA to keep it after
power-off.* · *Stored on ZONA · Page 2* · *The device stopped responding. Your draft is safe; device
state could not be verified.* (kept for the `collapse-six` option) · *This region overlaps Filter.
Choose another area or resize it.* · *No configurations found. Try a different search or clear your
filters.* · *Arc — my variation saved to My configs.* · *Reset Page 2 to its firmware default? Your
browser draft will remain available.*

From §9's state table: *Connect ZONA* · *ZONA connected* · *Applying to Page N…* · *Storing on Page
N…* · *Store on ZONA* · *Disconnected · draft retained* · *Reset active device page* · *Device access
blocked* (see I.2.7 for where it lands) · *Device connection unavailable here* (see I.2.5).

From the PDF's five pages: every headline, eyebrow, card, button, breadcrumb, column head, status
line and helper the pages draw — the waves' SUMMARYs list each one. In particular the device band
takes *Connect ZONA* (page 1), *ZONA connected* (pages 2–5), *Target*, *Page 1*, *Apply to ZONA*,
*Draft saved locally · Changes not applied*, *Preview without hardware*, *Help & shortcuts · Device
actions*, and the intro's *Start in browser preview. Connect ZONA when you’re ready.*

Where a proposal below says "§16 verbatim" or "PDF verbatim", taking it moves that row out of the
batch and into this list.

## C. The four facts, traced old to new (and the fifth from Phase 12.1)

| Fact | Phase 10 said | The Bible says | The new string |
|---|---|---|---|
| RAM against flash | `TRY ON DEVICE` / `KEEP ON DEVICE`; `HONESTY_READY` *"Writes this into your ZONA’s memory in about a second. A power cycle puts yours back."*; `settledBody` *"…lives in memory only — a power cycle brings your own configuration back."* | *Apply to ZONA* / *Store on ZONA* (§9); *Applied to Page 2. Store on ZONA to keep it after power-off.* (§16) | labels and the settled caption verbatim; the honesty line and the settled body are I.4.2 and I.4.10 |
| the snapshot | `PUT BACK`; `SNAPSHOTTING_BODY`; `identifiedBody`; `RESTORED_BODY`; the two snapshot lines in session-copy | **no line** | I.3.2–I.3.4 (the label, its progress form, the two page-naming lines), I.4.5–I.4.7, I.4.13–I.4.15, I.2.15–I.2.16 |
| the firmware default | `CLEAR`; `CLEAR_LINE` *"Reset the current page to factory default"*; `CLEARED_CAPTION` `FACTORY DEFAULT` | *Reset active device page* (§9); *Reset Page 2 to its firmware default? Your browser draft will remain available.* (§16) | label and confirmation verbatim; the result caption and body are I.4.16–I.4.17, the line under the control I.6.3 |
| nothing without a click | `SAFE_NOTE` *"Nothing is written without a click."* | **no line** | I.2.9 |
| the fifth: a store carries the page's own scripts, five in all (12.1-08, 13-17) | `CONFIRM_REPLACES` *"…and the page’s own init, timer and utility scripts…"*; the four partial rows naming five in write order | **no line** | I.5.9, I.5.4 |

## D. The intro (PDF page 1)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| D.1 | the wordmark's accessible name (`label` prop) | `src/lib/ui/Wordmark.svelte` | the logo, which is paths not text, read by a screen reader | the mark spells HANGAR and nothing more | `HANGAR` | keep `HANGAR` (uppercase because it is the brand as written, a short label) | §3 names the pair; the mark itself has no name in either document |
| D.2 | the wordmark link's name (13-03 Q1, 13-05 Q1) | `src/lib/ui/shell/*` | the header link to `/` wrapping the mark and the text `FOR ZONA` | what a screen reader hears for one link | no aria-label; the plain pair is read: *HANGAR*, then *FOR ZONA* | keep the plain pair; invent no phrase. A screen reader reads the link's contents in order, which is the PDF's own two pieces | the PDF draws two things; neither document names the link |
| D.3 | `resumeLine(name, edited)` | `src/lib/ui/intro/card.ts` | a returning visitor's first card, `Resume draft` | it is a DRAFT, its name, its age in words | `Draft · {name} · Last edited {edited}` (age: *just now*, *a minute ago*, *12 minutes ago*, *an hour ago*, *5 hours ago*, *a day ago*, *3 days ago*, *earlier*) | keep | the PDF's page-4 line is the shape; the middle term is the draft's own name here |
| D.4 | `RESUME_EYEBROW` (13-07 Q4) | `src/lib/ui/intro/card.ts` | the eyebrow above `Resume draft`, where the first-visit card reads `START WITH AN IDEA` | this card continues rather than starts | `PICK UP WHERE YOU LEFT OFF` (a Bible headline in uppercase, which D-05 forbids for sentences) | **`CONTINUE EDITING`** — the PDF's page-4 eyebrow above its own resume card, verbatim. Taking it removes the row from the batch and answers 13-07's question | it is a PDF line after all; 13-07 reached for the headline before the page-4 eyebrow |
| D.5 | `heroDescription(name)` | `src/lib/ui/intro/card.ts` | the live 9 × 9 on the intro, for a screen reader | a simulation here; a finger plays it; nothing reaches a ZONA | `A live simulation of {name} running in your browser. Drag across it to play it; nothing is sent to a ZONA.` | keep | the PDF's two visible lines are kept beside it; §14 has no accessibility line for it |

## E. The gallery (PDF page 2)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| E.1 | `FOR_LABELS.modulation` | `src/lib/browse/labels.ts` | the MADE FOR rail row and the `Use` chip | the facet's name in sentence case | `Modulation` | keep | the PDF reads `Modulation` on rail and chip — this one is PDF-backed and leaves the batch |
| E.2 | `FOR_LABELS.show` | same | the row and chip for `show` | as above | `Visuals` | keep `Visuals`, and render `VISUALS · ATMOSPHERIC` on the card line rather than the PDF's singular `VISUAL` — one word in all three places through one record | the PDF uses three forms of one word |
| E.3 | `FOR_LABELS.sequencing` | same | the row and chip for `sequencing` | as above | `Sequencing` | keep | no PDF row |
| E.4 | `FOR_LABELS.mixing` | same | | | `Mixing` | keep | no PDF row |
| E.5 | `FOR_LABELS.play` | same | the row and chip for `play` (nine pads, a snake, nine chords) | the term is a verb: you reach for a pad in order to play | `Playing` | keep `Playing`. The PDF's `Notes & chords` names CHORUS's carrier only and would misname NINEPADS and SNAKE | the PDF's nearest word is not the term's |
| E.6 | `FOR_LABELS.shortcuts` | same | | | `Shortcuts` | keep | no PDF row |
| E.7 | `FOR_LABELS.pointing` | same | | | `Pointing` | keep | the PDF's `Expression` names no FOR term |
| E.8 | the chip-versus-rail question (13-08 Q1) | `labels.ts` | one facet, two places — may a chip carry a shorter label than its rail row, as the PDF's `Notes` against `Notes & chords`? | whether `FOR_LABELS` becomes `{ rail, chip }` | one record, one label per term | **no**: one label per term. None of the seven is long enough to need a short form, and one record keeps the two places from ever disagreeing | the PDF's short form belongs to a facet HANGAR does not have |
| E.9 | the star's ON name | `src/lib/ui/CatalogCard.svelte` | the favorite button when starred | pressing REMOVES the mark; the entry's name; "favorites" never "saved" | `Remove {name} from your favorites` | keep | the PDF draws the star and names nothing |
| E.10 | the star's OFF name | same | the same button, outlined | pressing ADDS the mark | `Add {name} to your favorites` | keep | none |
| E.11 | `CLEAR` / `CLEAR_NAME` | `src/lib/ui/BrowseToolbar.svelte` | the search field's clear control | clears the FIELD and returns focus | `Clear` / `Clear the search` (Phase 5: `CLEAR`) | keep | none |
| E.12 | `CLEAR_FILTERS` | same | the control beneath the chip row while something narrows the grid | clears query, chips and library view; never the sort | `Clear filters` (Phase 5: `CLEAR FILTERS`) | keep | §16's empty line says *clear your filters*; the button is its verb |
| E.13 | `TITLE` | `src/routes/playground/+page.svelte` | the document title | section and site | `Playground — HANGAR` | keep | none |
| E.14 | the count line (13-08 Q3) | `BrowseToolbar.svelte` | the count right of the chips | the actual matching count (§6) | `{n} of {total} configurations.` always | the PDF's `36 configurations` while nothing narrows the grid; `{n} of {total} configurations` once something does — one `{#if}` and a re-pinned test | the PDF draws the unfiltered form only |
| E.15 | the empty library view (13-08 Q5) | `src/routes/playground/+page.svelte` | `Favorites` with nothing starred; `Recently used` before any open | true, not the search-miss line | §16's *No configurations found. Try a different search or clear your filters.* | two lines of their own: `Nothing starred yet. Star a configuration and it will be kept here.` / `Nothing opened yet. Configurations you open are kept here.` | §16's line is for a search miss; these are not misses |
| E.16 | the favorites drop count (13-06 Q1) | `src/routes/playground/+page.svelte` | starred ids the catalog no longer carries | how many, if said at all | a number, no sentence; the shorter list is shown | **no sentence**: show the shorter list. An entry that left the catalog is not something a visitor can act on | none |

## F. The workspace (PDF page 5)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| F.1 | `INSPECTOR_HEADLINE` (13-09 Q1) | `src/lib/tune/inspector-copy.ts` | the inspector's two-line headline on every entry | where the gesture is shaped | `Shape the` / `movement.` — ARC's line above all twenty-seven | keep one constant now; a per-entry headline is an optional field on the entry, handed to 13-19 with the twenty-seven names (that plan owns catalog copy). If you want it, say so and 13-19 writes twenty-seven | the PDF gives ARC's only |
| F.2 | `fieldResetName(label)` | same | the per-field reset's accessible name; visible word `Reset` | which field | `Reset {label}` | keep | §7 asks for the control, names it not |
| F.3 | `FIELD_CHANGED` | same | the changed-field marker's hidden sentence | not the value the card ships with | `Changed from the default` | keep | §7's "subtle marker" has no words |
| F.4 | `UNKNOWN_NOTICE` | `src/routes/playground/[id]/+page.svelte` | an address nobody has heard of | nothing is here; the rail is the way on | `Never heard of that one. Pick a configuration from the list.` | `There’s no configuration at this address. Pick one from the list.` — the shipped line is a shade coy for D-05 | none |
| F.5 | `SAVED_COPY` | same | the two Save copy buttons for 2 s after a write | a NAMED COPY was written | `Saved copy` | keep | the PDF draws the button at rest |
| F.6 | `copyName(name)` | same, and `src/lib/sandbox/copy.ts` | a saved copy's name before rename | a copy, not the entry | `{name} copy` | keep | none |
| F.7 | the mode switch's group name | same (`aria-label`) | the `Configure` / `Play` radiogroup | one choice | `Mode` | keep | the PDF draws no caption |
| F.8 | `POPOVER_CLOSE` | `inspector-copy.ts` | the colour popover's visible close | closes and returns focus to `Edit color` | `Close` | keep | the PDF draws no popover |
| F.9 | `Active color` (13-09 Q2) | `Swatch.svelte` through the knob's label | the swatch row's label | which parameter it colours | the knob's own label (`Colour`, `Swirl colour`, `Heart colour`) | keep the knob's own label; §7 says use real parameter names and six entries carry two or three colours. The PDF's `Active color` is one entry's one colour | the PDF's word fits one case |
| F.10 | the hex beside the swatch (13-09 Q3) | `Swatch.svelte` | the colour's readable value | exact (every channel is a multiple of 17) | the hex, `#DCFF71` | keep the hex; the accessible value stays the three integers | the PDF draws the hex |
| F.11 | `LINK COPIED` after `Share snapshot` (13-09 Q5) | `src/lib/tune/copy.ts` — 13-19's | the share control for 2 s after the link is copied | the link is on the clipboard | `LINK COPIED` (Phase 5) | `Link copied` — recorded here, landed by 13-19 | the PDF draws the button at rest |
| F.12 | `MONITOR_COLUMNS` | `inspector-copy.ts` | the expanded log's six heads | §10's six nouns, in order | `Time` · `Direction` · `Source` · `Channel` · `Message` · `Value` | keep | §10 names them; heads are labels |
| F.13 | `MONITOR_DIRECTION` | same | every row's direction cell | everything is outbound | `out` | keep | §10 names the column only |
| F.14 | `MONITOR_SOURCE` | same | every row's source cell | from the browser preview, never a ZONA | `Browser preview` | keep | the PDF's own phrase |
| F.15 | `MONITOR_PAUSE` / `MONITOR_RESUME` | same | the one control that freezes the log | pausing stops new rows | `Pause` / `Resume` | keep | §10's verbs |
| F.16 | `MONITOR_CLEAR` | same | empties the visible log | the VIEW only | `Clear` | keep | §10's verb |
| F.17 | `monitorCount(n)` | same | a row standing for a run of alike messages | how many it folded | `x{n}` | `×{n}` with the real multiplication sign the PDF uses in `2 × 6 units` | §10 gives no form |
| F.18 | `MONITOR_EMPTY` | same | the log with no row | nothing sent yet; what to do | `Nothing sent yet. Play the surface and what it sends shows here.` | keep | none |
| F.19 | `MONITOR_PAUSED` | same | the log while paused | not shown, not replayed | `Paused. What the surface sends now is not shown until you resume.` | keep | none |

## G. The Sandbox (PDF page 3)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| G.1 | `TITLE` | `src/lib/sandbox/copy.ts` | the tab | site and section | `Sandbox — HANGAR` | keep | none |
| G.2 | `OPENING_LINE` | same | `/sandbox/` deciding which surface to open | something is happening | `Opening your surface…` | keep | none |
| G.3 | `STATUS_LINE` | same | the bar's centre before any draft | the section's promise | `Build a surface. Every element is yours to shape.` | keep | page 3 draws the draft line instead |
| G.4 | `EMPTY_SECOND_LINE` | same | an empty surface, under §8's instruction | the starter and the click path | `Start with a fader, or click any cell to begin an area.` | keep | none |
| G.5 | `STARTER_ACTION` | same | the one visible starter | verb and element | `Add a fader` | keep | none |
| G.6 | `TEMPLATE_ACTION` | same | the quiet alternative | it is a template | `Use the fader and button template` | keep | none |
| G.7 | `TEMPLATE_FADER_NAME`, `TEMPLATE_BUTTON_NAME` | same | the template's two elements | names, not ordinals | `Filter`, `Hold` | keep | page 3's own two — PDF-backed |
| G.8 | `defaultName(kind, n)` | same | a new element | kind and a never-repeating ordinal | `Fader 1`, `Button 2` | keep | none |
| G.9 | `paletteAddName(kind)` | same | the palette row's accessible name | the verb | `Add a Fader` | keep | none |
| G.10 | `PLAY_LOCKS_PALETTE` | same | Play: structure locked | where touches go; the way back | `In Play, touches go to the surface. Switch to Edit to add elements.` | keep | none |
| G.11 | `PLAY_LOCKS_FIELDS` | same | the same in the inspector | | `In Play, touches go to the surface. Switch to Edit to change this element.` | keep | none |
| G.12 | `MODE_LINE_EDIT` / `MODE_LINE_PLAY` (13-16 Q3) | same | the persistent mode label under the switch | what the mode does with touch | `Edit: select and arrange elements. Touch goes nowhere.` / `Play: touch the surface as you would the pad.` | keep both; §8 asks for a persistent mode label and what touch does in each mode is the fact worth a line | §8 gives no words |
| G.13 | `DRAFT_UNSAVED` | same | the store refused; the draft lives in the tab | not stored, where it lives | `Your browser refused to store this draft. It lives in this tab only.` | keep | none |
| G.14 | `SURFACE_NAME` | same | the headline field's accessible name | what the field is | `Surface name` | keep | none |
| G.15 | `RENAME_SURFACE`, `renameSurfaceName(name)` | same | the quiet control beside the headline | the verb and the name | `Rename`; `Rename My performance` | keep | none |
| G.16 | `PLATE_NAME` | same | the plate as one tab stop | the PDF's word | `Surface` | keep | page 3's `SURFACE` |
| G.17 | `placeInstruction(kind)` | same | element armed, waiting for a cell | what the next click does | `Click a cell to place the Fader.` | keep | none |
| G.18 | `AREA_START` | same | area's first corner placed | | `Click the far corner of the area.` | keep | none |
| G.19 | `selectedLine`, `NOTHING_SELECTED`, `cellLine` | same | the plate's status at rest | selection and the keyboard's cell, one-based | `Filter, Fader, selected. Column 3, Row 1.` / `Nothing selected. Column 1, Row 1.` | keep | none |
| G.20 | `listRowName(name, kind)` | same | a list row's accessible name | both | `Filter, Fader` | keep | none |
| G.21 | `LIST_EMPTY` | same | `ON THIS SURFACE` with no rows | empty, not missing | `Nothing on this surface yet.` | keep | none |
| G.22 | `NO_SELECTION_EYEBROW`, `_HEADLINE`, `_LEDE` | same | the inspector with nothing selected | it waits; two ways to select | `NO ELEMENT SELECTED`; `Pick an element`; `Select an element on the surface or in the list to shape it.` | keep | none |
| G.23 | `ORIENTATION_VERTICAL`, `_HORIZONTAL` | same | a fader's axis | the two words | `Vertical`, `Horizontal` | keep | §8 names the field only |
| G.24 | `LATCH`, `LATCH_HELPER` | same | a button's latch flag | what latched and unlatched send | `Latch`; `Latched, a press toggles between on and off. Unlatched, it sends on while held.` | keep | none |
| G.25 | `CC_NUMBER_Y` | same | an XY pad's second controller | which axis | `CC number (Y)` beside `CC number (X)` | keep | page 3 has one `CC number` |
| G.26 | `COLOUR_LABEL` | same | the swatch row's label | the word | `Color` | keep `Color` (American spelling, as the PDF spells `Edit color`) | page 3 draws the swatch unlabelled |
| G.27 | `WHOLE_NUMBER` | same | a numeric field given a word | the way, never "invalid" | `Type a whole number.` | keep | none |
| G.28 | `CC_RANGE` | same | a controller out of range | the range | `A controller number is 0 to 127.` | keep | none |
| G.29 | `CHANNEL_RANGE` | same | a channel out of range | one-based | `A channel is 1 to 16.` | keep | none |
| G.30 | `DUPLICATE_NO_SPACE` | same | rule 4: no free window | the fact and two ways | `There’s no free area this size. Make it smaller, or clear some room, and duplicate again.` | keep | none |
| G.31 | `DUPLICATE_AT_CAP` | same | the cap reached by Duplicate | count and the way | `This surface holds 16 elements, the most a page can carry. Remove one to duplicate another.` | `This surface holds 16 elements, the most a page holds. Remove one to duplicate another.` — the same clause as G.36 and H.20 so the cap is said one way everywhere | none |
| G.32 | `roomLine(used, roomFor)` | same | the meter with room | N of 908, about M more | `451 of 908 · room for about 11 more` | keep | none (13-RESEARCH Q8) |
| G.33 | `ROOM_NONE` | same | zero room | nothing more fits | `882 of 908 · no room for another` | keep | none |
| G.34 | `overLine(word, used, over)` (13-16 Q2) | same | a Setup or Timer over 908 under two slots | which string, by how much, the way | `Timer is 1013 of 908, 105 over. Two events can’t hold this mix of element kinds; remove one kind to fit.` | keep the text; the branch is unreachable from the route since 13-17 flipped `SLOTS` to 3, so the "kinds" question is moot for a visitor. Whether the branch is deleted is 13-19/13-20's | none |
| G.35 | `MEASURING` | same | before the first measurement | the meter's word | `measuring…` | keep | 05-UI-SPEC's word |
| G.36 | `GEOMETRY_COPY.cap(cap)` | `src/lib/sandbox/geometry.ts` | the seventeenth region | the count, that it is a page's most, the way | `This surface holds 16 elements, the most a page can carry. Remove one to add another.` | `This surface holds 16 elements, the most a page holds. Remove one to add another.` — see G.31 and H.20 | none |
| G.37 | `GEOMETRY_COPY.offSurface(field)` | same | a region past the 9 × 9; the previous value stays | which field; 9 × 9; never "invalid" | `This region doesn’t fit on the surface. A smaller width keeps it inside the 9 × 9.` (subject per field: column / row / width / height) | keep; I.6 is aligned to it | §16 has the overlap line only |
| G.38 | `GEOMETRY_COPY.adjacency(a, b)` (13-14 Q1) | same | two regions share an edge — a warning | both names; a press on the seam is a coin flip; no instruction | `Filter and Space touch with no gap between them. A press on the shared edge could land on either.` | keep, **without** an instruction: the surface is valid as drawn and the register names an action only where there is one | none |
| G.39 | `GEOMETRY_COPY.tooSmall(knob)` (13-15 Q1) | same | a Knob under 3 × 3 | the minimum and WHY | `A knob needs at least 3 × 3 cells. Its centre can’t read a turn, so the finger needs a ring of cells around it.` | keep the reason. A smaller knob is not a knob, so there is no way to offer; the why is what stops the line reading as arbitrary | none |
| G.40 | `GEOMETRY_COPY.tooSmall(fader, vertical)` | same | a one-row vertical fader | its axis | `A vertical fader needs at least 2 rows.` | keep | none |
| G.41 | `GEOMETRY_COPY.tooSmall(fader, horizontal)` | same | a one-column horizontal fader | | `A horizontal fader needs at least 2 columns.` | keep | none |
| G.42 | `GEOMETRY_COPY.tooSmall(xy)` | same | an XY pad one cell on an axis | both axes | `An XY pad needs at least 2 × 2 cells.` | keep | none |
| G.43 | `overElementLine(word, used, over)` (13-17 Q4) | `copy.ts` | a string over 908 under three slots | which string, by how much, the way | `Setup is 921 of 908, 13 over. Remove the last element to fit.` | keep "the last element": names are never emitted and colours are already measured at their dearest, so an element is the only cause, and the last one added is the one the visitor just placed | none; TUNE-05's rule |
| G.44 | `EXPORT_SURFACE` | `copy.ts` | the share control beside Save copy | a surface leaves as a file | `Export as a file` | keep | §11's export; 13-13's row action is `Export` |
| G.45 | `NO_LINK_EXPLANATION` | `copy.ts` | why there is no link | not a variation of a catalog entry; the way | `A surface isn’t a variation of a catalog entry, so there’s no link to share; export it as a file and import it on My configs.` | keep | none |
| G.46 | `exportedLine(fileName)` | `copy.ts` | the export succeeded | the file's name | `Exported as my-performance.hangar.json.` | keep | none |
| G.47 | `savedLine(name)` | `copy.ts` | Save copy's outcome | name and where | `My performance copy saved to My configs.` | keep | §16's *Arc — my variation saved to My configs.* is the shape |
| G.48 | `SAVE_REFUSED` | `copy.ts` | the store refused a copy | the fact | `Your browser refused to store the copy.` | keep | none |

## H. My configs (PDF page 4)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| H.1 | `TITLE` | `src/routes/my-configs/+page.svelte` | the document title | section and site | `My configs — HANGAR` | keep | none |
| H.2 | `SORT_NAME` | same | the sort's second option | an alphabetical order | `Name` | keep | the PDF draws `Last edited` only |
| H.3 | `EMPTY_LIBRARY` | same | nothing in either store | where a configuration comes from | `Nothing saved yet. Save a copy from the Playground or build a surface in the Sandbox, and it will be kept here.` | keep | the PDF draws a full table |
| H.4 | `EMPTY_DRAFTS` | same | Drafts with no draft | what a draft is | `No drafts. A draft is kept here while you’re still working on it.` | keep | none |
| H.5 | `importRefused(file, reason)` | same | an import that did not pass | which file, why | `Couldn’t import {file}. {reason}` | keep | §11 asks for it, gives no line |
| H.6 | `importedLine(name, reason?)` | same | an import that passed, or landed on the base | the name; for `older`, the reason | `Imported {name}.` / `Imported {name}. {reason}` | keep | none |
| H.7 | `deletedLine(name)` + `UNDO` | same | a record deleted, held for the session | the name; one click puts it back | `Deleted {name}.` / `Undo` | keep | §11's "undo where practical" |
| H.8 | `restoredLine(name)` | same | the Undo done | the name is back | `{name} is back.` | keep | none |
| H.9 | `STORE_REFUSED` | same | a write the store refused | not kept, and why | `Your browser refused to store the change.` | keep | none |
| H.10 | `IMPORT_REASONS.notJson` | `src/lib/store/transfer.ts` | step 1: not JSON | not an export | `This file isn’t JSON, so it can’t be a HANGAR export.` | keep | none |
| H.11 | `IMPORT_REASONS.notHangar` | same | `app` is not `hangar` | somebody else's file | `This file wasn’t exported by HANGAR.` | keep | none |
| H.12 | `IMPORT_REASONS.schemaUnknown(schema)` | same | a newer format | newer than this build; which this reads | `This file was made by a newer HANGAR (format {schema}). This version reads format 1.` | keep | none |
| H.13 | `IMPORT_REASONS.schemaOlder(schema)` | same | an older readable format | lands on the base | `This file was made by an earlier HANGAR (format {schema}). It opens on the base configuration.` | keep | SHARE-03's `older` |
| H.14 | `IMPORT_REASONS.kindUnknown` | same | neither playground nor sandbox | | `This file doesn’t hold a configuration or a surface.` | keep | none |
| H.15 | `IMPORT_REASONS.recordMalformed` | same | the record is not whole | | `The configuration inside this file is incomplete.` | keep | none |
| H.16 | `IMPORT_REASONS.entryGone(source)` | same | the source entry left the catalog | which, and that it is gone | `The Playground configuration this file was made from, {source}, isn’t in the Playground any more.` | keep | none |
| H.17 | `IMPORT_REASONS.knobCount(name, filed, now)` | same | a different number of knobs | both counts; lands on the base | `This file sets {filed} knobs and {name} now has {now}. It opens on the base configuration.` | keep | SHARE-03's `older` |
| H.18 | `IMPORT_REASONS.rackChanged(name, knob)` | same | a knob renamed or resized | which; lands on the base | `The {knob} knob of {name} has changed since this file was made. It opens on the base configuration.` | keep | SHARE-03's `older` |
| H.19 | `IMPORT_REASONS.knobRange(knob, index, count)` | same | an index past its list (hand-edited file) | which knob, how many, which asked | `{knob} has {count} positions and this file asks for position {index + 1}.` | keep | none |
| H.20 | `IMPORT_REASONS.tooMany(count)` | same | more regions than the cap | count and cap | `This surface has {count} elements. A surface holds at most 16.` | `This surface has {count} elements, and a page holds at most 16.` — the same clause as the Sandbox's G.36 | none; the Sandbox twin is G.36 |
| H.21 | `IMPORT_REASONS.offSurface(region)` | same | a region outside 9 × 9 | which region | `{region} lies outside the 9 × 9 surface.` | `{region} doesn’t fit on the 9 × 9 surface.` — the Sandbox's verb (G.37) | none; the Sandbox twin is G.37 |
| H.22 | `IMPORT_REASONS.overlap(a, b)` | same | two regions share a cell | both names | `{a} overlaps {b}.` | keep — §16's second clause (*Choose another area or resize it.*) is dropped because the import has nothing on screen to resize | §16's line, first clause only |
| H.23 | `RENAME` / `EXPORT` / `DELETE` and their names | `src/lib/ui/library/LibraryTable.svelte` | the three quiet row actions | §11's three, each with the record | `Rename` / `Export` / `Delete`; `Rename {name}`, `Export {name} as a file`, `Delete {name}` | keep | the PDF's row draws `Open` only |
| H.24 | `HEAD_ACTIONS` | same | the fifth column's hidden head | what it holds | `Actions` | keep | none |
| H.25 | `typeLabel("playground")`'s fallback | `src/lib/ui/library/words.ts` | a record whose entry left the catalog | the kind | `Playground` | keep | the PDF shows categories |
| H.26 | `editedInWords`'s `earlier` | same | an unreadable date | never `Invalid Date` | `earlier` | keep | none |
| H.27 | `countLine(1)` | same | one record | the singular | `1 saved configuration` | keep | the PDF draws the plural |
| H.28 | `COLLECTION_NAME` | `src/routes/my-configs/+page.svelte` | the new-collection field | what goes in it | `Collection name` | keep | none |
| H.29 | `CREATE` / `CANCEL` | same | the form's two buttons | verbs | `Create` / `Cancel` | keep | none |
| H.30 | `RENAME_COLLECTION`, `renameCollectionName(name)` | same | the selected collection's rename | which | `Rename`; `Rename {name}` | keep | none |
| H.31 | `DELETE_COLLECTION`, `deleteCollectionName(name)` | same | the collection's one destructive control | the COLLECTION, not its members | `Delete collection`; `Delete the collection {name}` | keep | §11's "undo where practical" |
| H.32 | `emptyCollection(name)` | same | a collection with no members | which; where to file from | `Nothing in {name} yet. Add a configuration from All saved.` | keep | none |
| H.33 | `ADD_TO_COLLECTION`, `fileName(name)` | `LibraryTable.svelte` | the per-row select's placeholder | the action and the record | `Add to collection`; `Add {name} to a collection` | keep | none |
| H.34 | `REMOVE`, `removeName(name, collection)` | same | the per-row action inside a collection | leaves THIS collection only | `Remove`; `Remove {name} from {collection}` | keep | none |

## I. The device band — the header's control, Device actions, the context bar's clauses, the install blocks

This is where Phase 10's register lives and where the decisions are. The section is in the order a
visitor meets it: the shell's footer (I.1), connecting (I.2), the page target and PUT BACK (I.3),
the states a write passes through (I.4), the six uncertain outcomes and the lost cable (I.5), the
controls' lines and reasons (I.6), the live-region utterances (I.7).

### I.1 The shell's footer

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.1.1 | `MOTION_LABEL` | `src/lib/sim/motion.svelte.ts` | the motion checkbox under `Help & shortcuts` | it stops the previews' own motion | `Keep previews still` | keep | §14 states the rule, names no control |
| I.1.2 | `MOTION_EXPLANATION` | same | the line under it, every state | cards hold a frame; a pad still answers a finger; the OS setting wins | `Cards hold one frame instead of animating. A pad still answers your finger, and your system’s reduced-motion setting always wins.` | keep | none |
| I.1.3 | a third, disabled-state string (13-04 Q) | same | the box shown checked and disabled because the OS asks for less motion | why it is disabled | none; the explanation's last clause does the work | **no third string** — the last clause already says it | none |
| I.1.4 | `Device actions` before 13-11 (13-05 Q2) | `src/lib/ui/shell/*` | the footer's second label | — | shipped by 13-11; moot | closed: the label exists and opens the panel | PDF-backed |
| I.1.5 | `Help & shortcuts` as a closed disclosure (13-05 Q3) | same | the motion control one click away | reachable, not always visible | a disclosure, closed by default | keep closed; the PDF's footer is one quiet line | §14 asks that it exist |

### I.2 Connecting — the header's control and the Device actions panel (`session-copy.ts`)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.2.1 | `NO_ZONA_LABEL` | `src/lib/device/session-copy.ts` | S1, the control at rest | no ZONA; a click connects | `NO ZONA` (hovered: `CONNECT ZONA`) | the control reads **`Connect ZONA`** at rest and hovered — the PDF's page-1 control, verbatim — and `NO_ZONA_LABEL` retires. Taking it moves the row out of the batch | the PDF draws the resting control as the verb |
| I.2.2 | `HIDDEN_NAME_IDLE` | same | S1's accessible sentence | no ZONA is connected; preview still works | `No ZONA is connected.` | **§16 verbatim**: `Preview only. Connect ZONA when you’re ready.` — the Disconnected row is exactly this state. Taking it moves the row out of the batch | §16 has it; Phase 10 predates §16 |
| I.2.3 | `CONNECTING_LABEL` | same | S3, the control while choosing, opening, identifying | in progress | `CONNECTING…` | `Connecting…` | §9 has no in-progress connect label |
| I.2.4 | `DISCONNECT_LABEL` | same | the panel's disconnect | closes the port; writes nothing | `DISCONNECT ZONA` | `Disconnect ZONA` | none |
| I.2.5 | `CAPTION_UNSUPPORTED` / `CAPTION_INSECURE` (13-11's S0a / S0b) | same | the control's caption in a browser without Web Serial / on a non-HTTPS page | two different facts, each with its own way out | `Not in this browser` / `Needs HTTPS` | keep both, sentence case as they are. §9's one line — *Device connection unavailable here* — collapses two facts with two remedies; the caption is the reason in short and the click opens the reason in full (I.8.1, I.8.2). If you prefer §9's one line as the caption, say so and the two facts move into the opened reason | §9 gives one line for two states |
| I.2.6 | `CAPTION_DETECTED` | same | S2: a permitted ZONA is plugged in, not yet opened | detected; one click connects | `ZONA detected` | keep | none |
| I.2.7 | `CAPTION_FAILED` | same | S6: any failed open — chooser closed, port busy, not a ZONA, silent, unplugged at open, unknown | did not connect; nothing was written | `Did not connect` | keep for S6 as a whole. §9's *Device access blocked* is for a denied permission, which is not a phase HANGAR has (a blocked chooser lands in `cancelled` or `unknown`); it becomes the title of I.8.7 instead | §9's line names one cause of six |
| I.2.8 | `TWO_STEP` (the Firefox two-step) | same | a site-permission prompt before the picker (desktop Firefox 151+) | it is the browser's own prompt, not an add-on being installed; the list follows | `Some browsers ask for permission before they show the list. If you were asked twice, the list appears after the second prompt.` | `Firefox asks first whether this site may use serial ports. Allow it and the list appears; nothing is being installed.` — names the browser (CONN-02 permits Chrome, Edge, Firefox by name; never the engine) | none |
| I.2.9 | `SAFE_NOTE` — **the fourth fact** | same | the connect panel's promise, before any write is possible | **nothing is written without a click** | `Nothing is written without a click.` | `Nothing is written to your ZONA without a click. Browsing and previewing never touch it.` | none — §16's Disconnected line is a different fact |
| I.2.10 | `PERMISSION_DECLINED` | same | the permission prompt declined | the list never opened; ask again | `The permission prompt was declined, so the list never opened.` | `You declined the permission prompt, so the list never opened. Connect again when you’re ready and allow it.` | none |
| I.2.11 | `RECONNECT_OFFER` / `LIVE_DETECTED` | same | S2's sentence | detected; one click | `ZONA detected. One click connects it.` | keep | none |
| I.2.12 | `REPLUG_OFFER` | same | after an unplug: what happens on re-plug | the offer returns; the permission stands | `Plug it back in and this offers to connect again — the permission you already gave is still there.` | `Plug it back in and you’ll be offered the connection again; the permission you gave still stands.` | none |
| I.2.13 | `FORGET_LABEL` | same | the panel's revoke control (`forget()`) | the site loses access | `FORGET THIS ZONA` | `Forget this ZONA` | none |
| I.2.14 | `REVOKE_EXPLANATION` | same | the line under it | the site loses access; the module is untouched; the copy stays; permission can be given again | `Removes this site’s permission to see your ZONA. The copy of your own Setup and Timer stays, and you can give permission again from the picker.` | `This site forgets your ZONA and can no longer see it. Nothing on the module changes, the copy of its own page stays here, and you can allow the site again from the browser’s list.` | none |
| I.2.15 | `SNAPSHOT_DURABLE_LINE` — **the second fact** | same | the panel's snapshot line, snapshot in browser storage | a copy of the page is kept; it can be put back even in a new tab | `A copy of your ZONA’s own Setup and Timer is saved in this browser, so it can be put back even in a new tab.` | `A copy of the page your ZONA was on when you connected is kept in this browser, so it can be put back even from a new tab.` — "the page" because since 12.1 and 13-17 the copy holds five scripts, not two, and since D-06 it is per page | none |
| I.2.16 | `SNAPSHOT_SESSION_LINE` | same | the same, snapshot in session storage only | held until the tab closes | `A copy of your ZONA’s own Setup and Timer is held until this tab closes, so it can be put back while you are here.` | `A copy of the page your ZONA was on when you connected is held until this tab closes, so it can be put back while you’re here.` | none |
| I.2.17 | `WRITE_LOCK_REASON` | same | disconnect and forget disabled during a write | not while writing | `Not while HANGAR is writing to your ZONA.` | keep | none |
| I.2.18 | `UNPLUGGED_WHILE_CONNECTED` / `LIVE_UNPLUGGED` | same | S5's sentence | unplugged; nothing written | `The ZONA was unplugged. Nothing was written.` | `Your ZONA was unplugged. Nothing was written.` The caption above it is §9's *Disconnected · draft retained*, verbatim | the caption has a line; the sentence does not |
| I.2.19 | `UNPLUGGED_WHILE_WRITING` | same | S5 during a write | unplugged mid-write | `The ZONA was unplugged while HANGAR was writing to it.` | `Your ZONA was unplugged while HANGAR was writing to it.` | none |
| I.2.20 | `STATUS_CHOOSING` / `STATUS_OPENING` / `STATUS_IDENTIFYING` | same | S3's three sub-states | what is happening | `Pick the ZONA in the browser’s list.` / `Opening the port…` / `Listening for the module…` | keep all three | none |
| I.2.21 | `NOTHING_LISTED` + `NOTHING_LISTED_STEPS` | same | the chooser came up empty | cable, hub, no driver | `Nothing listed?` + the three steps as shipped (charge-only cable; straight into the computer; no driver needed) | keep | none |
| I.2.22 | `CHOOSER_NEVER_APPEARED` + `_BODY` | same | the chooser never opened | the site may be blocked; where to look | `The chooser never appeared?` + `Your browser may be blocking serial ports for this site. Check the site’s permissions — in Chrome, chrome://settings/content/serialPorts — and try again.` | keep (naming Chrome is permitted) | none |
| I.2.23 | `identitySentence(fw, page)` | same | the panel's identity line | firmware and page | `Firmware 1.5.5, active page 2.` | `Firmware 1.5.5, on Page 3.` — the page number per I.3.1 | §9 asks for identity, gives no line |
| I.2.24 | `identityDescription(fw, page)` | same | the header control's description in S4 | identity, and what a click opens | `Firmware 1.5.5, active page 2. Opens device details.` | `Firmware 1.5.5, on Page 3. Opens Device actions.` — the panel has been `Device actions` since 13-11 and the shipped string still says "device details" | none |
| I.2.25 | `multiModuleLine(others)` | same | other Grid modules on the cable | which | `Also on the cable: EN16, PBF4.` | keep | none |
| I.2.26 | `liveConnected(fw, page)` | same | S4's live-region sentence | connected; identity | `ZONA connected. Firmware 1.5.5, active page 2.` | `ZONA connected. Firmware 1.5.5, on Page 3.` | §9's label plus the identity |
| I.2.27 | `LIVE_DISCONNECTED` | same | after a deliberate disconnect | | `ZONA disconnected.` | keep | none |
| I.2.28 | `LIVE_FORGOTTEN` | same | after forget | no permission | `This site no longer has permission to see your ZONA.` | keep | none |
| I.2.29 | `notZonaBlock` | same | the module is not a ZONA | what it is; nothing sent | title `That module is not a ZONA`; `It reported itself as {type}. HANGAR only speaks to a ZONA, so nothing was sent.`; steps `Plug in a ZONA` / `Click {label} again` | keep | none |
| I.2.30 | `silentBlock` | same | nothing answered on the port | the port belongs to something else | title `Nothing answered on that port`; `The port opened, but no Grid module reported itself within {n} seconds. That usually means the port belongs to something else on your machine.`; steps `Unplug the ZONA and plug it back in` / `Click {label} again and pick a different port` | keep, with `Unplug your ZONA and plug it back in` | none |
| I.2.31 | the header's control in S0a / S0b (13-11 Q2) | `ConnectionControl.svelte` | present and enabled, the click opening the reason | the reason must be reachable | enabled summary whose caption is the reason in short | keep enabled: a disabled control could not open its own explanation | §9 has no rule on it |

### I.3 The page target and PUT BACK (`page-target.ts`, `install-copy.ts`)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.3.1 | **page numbering** — `pageName(page)` and the identity line (13-12 Q1) | `src/lib/device/page-target.ts`, `session-copy.ts` | every place a page is named: the Target select, the review, the switching and unverified lines, PUT BACK's line, the header, the bar | which number a visitor sees for the page the module reports as 0 | `Page 0` … `Page 3` — the wire value | **1 to 4** — `Page 1` for wire 0, as Grid Editor shows it (`Pages.svelte`, `{ title: 1, value: 0 }`) and as the PDF's `Page 1` and §16's `Page 2` read. Under D-19 the Editor's numbering is the reference. One display offset in `pageName` plus the identity sentence; the wire is untouched. The alternative is 0 to 3 as the module reports, which no other Intech surface shows | both documents write `Page 1` / `Page 2` without saying which base; the Editor settles it |
| I.3.2 | `PUT_BACK_LABEL` — **the second fact's control** | `install-copy.ts` | the restore control | what comes back (the module's own page) and from where (the copy taken at connect) — the label carries the verb; the line beneath (I.3.4) carries the page | `PUT BACK` | `Put back` — HANGAR's established word (D-19 names PUT BACK as a feature), now a plain verb. The alternative `Restore Page 2` puts the page in the label and drops the line | none — §16 has no restore line |
| I.3.3 | `PUTTING_BACK_LABEL` | same | the control while restoring | in progress | `PUTTING BACK…` | `Putting Page 2 back…` — §9's progress shape (*Applying to Page N…*) | none |
| I.3.4 | `putBackPageLine(page)` / `putBackPageLineAfterKeep(page)` | `page-target.ts` | the line under Put back while a snapshot is held; after a store | the page; back to what it was playing at connect; after a store, stored too | `Puts Page 2 back to what it was playing when you connected.` / `Puts Page 2 back to what it was playing when you connected, and stores it so it stays.` | keep (the number per I.3.1). `PUT_BACK_LINE` and `PUT_BACK_LINE_AFTER_KEEP`, the page-less Phase 10 twins, retire | none |
| I.3.5 | `PUT_BACK_NEEDS_ZONA` (also `CLEAR_REASONS["no-session"]`) | `install-copy.ts` | Put back present, no session | needs the module | `Needs your ZONA connected.` | keep | none |
| I.3.6 | `unverifiedLine(requested, lastReported)` | `page-target.ts` | the switch sent; the report did not come | both pages; nothing applied; unknown, not failed | `Your ZONA hasn’t confirmed Page 3. It last reported Page 1, and nothing was applied.` / `Your ZONA hasn’t confirmed Page 3. Nothing was applied.` | keep | §16's uncertain line is the register; the state is a switch, not a transfer |
| I.3.7 | `switchingLine(to)` | same | the switch in progress | | `Switching to Page 3…` | keep | §9's shape for a third action |
| I.3.8 | `SWITCH_PAGE_LABEL` / `KEEP_PAGE_LABEL` | `install-copy.ts` | the review's affirmative and negative | the click that moves the page; the one that does not | `Switch page` / `Keep this page` | keep — already in the register; the other nine labels now follow them (I.4, I.6) | none |
| I.3.9 | `DISCARD_LABEL` (conditional on bench row I) | `page-target.ts` | the firmware-native revert (PAGEDISCARD) | RAM goes back to what is stored | `Revert to what’s stored` | keep; ships only if the bench confirms the class | §9's D03 names the action |
| I.3.10 | `Page 2 · on ZONA` | the workspace's destination snippet | the reported page's option in the select | which page the module is ON | `Page 2 · on ZONA` | keep (number per I.3.1) | the PDF's `Page 1` with §16's middot |
| I.3.11 | the review's detail line | `DestinationReview.svelte` | the review's third line | identity, page, configuration name (§9) | `ZONA · fw 1.5.5 · Arc will be applied to Page 3` | keep (number per I.3.1) | §9 names the facts, gives no line |
| I.3.12 | the port held by another HANGAR tab (13-02) | `src/lib/transport/transport.ts` `port-busy` | a second tab of this site holds the port | nothing was written; another tab may hold it; close it, re-plug, reload, connect once | `port-busy` names Grid Editor only; the probe's second open landed in `default` (*The port would not open*) | `port-busy`'s detail gains a second culprit: `Grid Editor is the usual reason, and another HANGAR tab can be holding it too. Only one program can hold a serial port at a time…`, with a step `Close any other HANGAR tab` first in the list. The `default` branch keeps the raw message, which is what a bug report needs. **Whether the second open lands in `port-busy` needs the raw message reproduced first** — the probe did not record it — so task 02 lands the words and the classifier's branch stays as it is until the bench says which message the browser gives | none |

### I.4 The states a write passes through (`install-copy.ts`)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.4.1 | `HONESTY_NO_SESSION` | `install-copy.ts` | the line under Apply to ZONA with no session | connects and writes; about a second | `Connects to your ZONA and writes this into its memory. About a second.` | `Connects to your ZONA and applies this to its active page. About a second.` | none |
| I.4.2 | `HONESTY_READY` — **the first fact** | same | the line under Apply to ZONA, ready | RAM: it stays until power-off unless stored | `Writes this into your ZONA’s memory in about a second. A power cycle puts yours back.` | `Applies this to Page 2 in about a second. It stays until power-off unless you store it.` | §16's line is for AFTER the apply; this is before |
| I.4.3 | `HONESTY_SNAPSHOTTING` | same | the line while the snapshot is read | reading first, so it can be put back | `Reading what is on your ZONA now, so nothing you do here is one-way.` | `Reading what your ZONA holds first, so anything you apply can be put back.` | none |
| I.4.4 | `HONESTY_INCAPABLE` | same | the line in a browser that cannot write | cannot write; everything else works | `This browser cannot write to a ZONA. Everything else on this page works.` | `This browser can’t write to a ZONA. Everything else on this page works.` | none |
| I.4.5 | `SNAPSHOTTING_CAPTION` | same | the block's caption while reading | in progress | `READING ZONA` | `Reading your ZONA…` | §9 has no reading state |
| I.4.6 | `SNAPSHOTTING_BODY` — **the second and fifth facts** (13-17: still names three) | same | the block's body while reading | a copy of the page: the touch element's Setup and Timer and the page's own init, timer and utility scripts — five | `Taking a copy of the Setup and Timer scripts already on your ZONA’s touch element, and the page’s own init script.` | `Taking a copy of what Page 2 holds — the touch element’s Setup and Timer and the page’s own init, timer and utility scripts — so it can be put back.` | none |
| I.4.7 | `identifiedBody(fw, page)` (13-17: still names three) | same | the block's body once identified, under §9's *ZONA connected* caption (`IDENTIFIED_CAPTION` retires to it) | identity; the copy is saved, five scripts; Put back can undo | `Firmware 1.5.5, active page 2. Its own Setup and Timer are saved here, and the page’s own init script, so PUT BACK can undo anything you try.` | `Firmware 1.5.5, on Page 2. A copy of the page is saved here — its touch Setup and Timer and its own init, timer and utility scripts — so Put back can undo anything you apply.` | none |
| I.4.8 | `WRITING_LABEL` / `KEEPING_LABEL` | same | the control while applying / storing | in progress | `WRITING…` / `KEEPING…` | **§9 verbatim**: `Applying to Page 2…` / `Storing on Page 2…` — leaves the batch if taken | §9 has both |
| I.4.9 | `STILL_WRITING_LINE` / `LIVE_STILL_WRITING` | same | a write past its usual time | still writing; slower than usual | `Still writing. Your ZONA is taking longer than it usually does.` / `Still writing.` | `Still writing. Your ZONA is taking longer than usual.` / keep `Still writing.` | none |
| I.4.10 | `settledBody(name)` under §16's caption (`SETTLED_CAPTION` `PLAYING NOW` retires to *Applied to Page 2. Store on ZONA to keep it after power-off.*) | same | the block's body after a RAM apply | in memory only; changing page on the module clears it | `{name} is running on your ZONA now. It lives in memory only — a power cycle brings your own configuration back. Changing page on your ZONA clears it; try it on again if that happens.` | `Arc is running on Page 2 in memory only. Changing page on your ZONA clears it; apply it again if that happens.` — the power-off half is the caption's now | §16's caption carries RAM-vs-flash; the page-change clause has no line |
| I.4.11 | `keptBody(name)` under §16's *Stored on ZONA · Page 2* (`KEPT_CAPTION` `KEPT` retires to it) | same | the body after a confirmed store | stored; survives power-off | `{name} is stored on your ZONA and will still be there after a power cycle.` | `Arc is stored on Page 2 and will still be there after power-off.` | the caption has a line; the body does not |
| I.4.12 | `KEPT_PROOF_LINE` | same | the second line after a store | the pad restarts once | `The pad restarts once as it loads the stored version.` | keep | none |
| I.4.13 | `RESTORED_CAPTION` — **the second fact, landed** | same | the restore acknowledged; the bar's clause and the block's caption | which page; the module's own earlier configuration, not a HANGAR default | `RESTORED` | `Put back · Page 2` — §16's clause shape (*Stored on ZONA · Page 2*) | none — §16 has no restore line |
| I.4.14 | `RESTORED_BODY` | same | the block's body after a restore | exactly what it held at connect; its own, not a default | `Your own Setup and Timer are back on your ZONA’s touch element, exactly as they were when you connected.` | `Page 2 holds exactly what it held when you connected — your own configuration, not a HANGAR default.` | none |
| I.4.15 | `RESTORED_STORED_LINE` | same | the second line after a restore that also stored | stored too | `They are stored too, so they stay after a power cycle.` | `It’s stored too, so it stays after power-off.` | none |
| I.4.16 | `CLEARED_CAPTION` — **the third fact's result** | same | the reset acknowledged; the bar's clause and the block's caption | the firmware default is back, on which page | `FACTORY DEFAULT` | `Page 2 reset to its firmware default` — §16's confirmation's own words for the state it confirmed | §16 has the question, not the result |
| I.4.17 | `CLEARED_BODY` | same | the block's body after a reset | the firmware default; Put back restores; the browser draft survives | `Your ZONA is running the firmware’s own default configuration. PUT BACK restores what was there when you connected.` | `Page 2 is running the firmware’s own default. Put back restores what was there when you connected, and your browser draft is untouched.` | §16's confirmation promises the draft; the result has no line |
| I.4.18 | `CONFIRM_CAPTION` | same | the store confirmation's title | the stakes: this is the permanent one | `PERMANENT` | `Store this on ZONA · Page 2?` — the shape of §16's *Replace the configuration on ZONA · Page 2?*, which 13-12 uses for the apply review | §16's review title is the apply's; the store's has none |
| I.4.19 | `NOT_NOW_LABEL` | same | the store confirmation's negative | nothing sent | `NOT NOW` | `Not now` | none |
| I.4.20 | `CLEARING_LABEL` | same | the reset control while resetting | in progress | `CLEARING…` | `Resetting Page 2…` — §9's progress shape | none |

### I.5 The six uncertain outcomes, and the lost cable — six on purpose

§16's one line is *The device stopped responding. Your draft is safe; device state could not be
verified.* HANGAR measures which of six things happened, and each recovery is different. The
`collapse-six` option makes every title below that sentence and keeps the steps; the detail lines
then have to carry the distinction the title no longer does, which is why the plan calls the
collapse a loss rather than a simplification.

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.5.1 | `UNCONFIRMED_TITLE` + `unconfirmedBlock(name)` | `install-copy.ts` | the store's acknowledgement never came inside the retry bound | still running in memory; whether it survives power-off is unknown; store again or put back | title `Your ZONA did not confirm the store`; detail `{name} is still running on your ZONA, in memory. No confirmation of the store came back, so HANGAR cannot say whether it will be there after a power cycle.`; steps `Click KEEP ON DEVICE to send the store again` / `Or click PUT BACK to restore what was there when you connected` | title `Your ZONA didn’t confirm the store`; detail `Arc is still running on Page 2 in memory. No confirmation of the store came back, so HANGAR can’t say whether it survives power-off.`; steps `Click Store on ZONA to send the store again` / I.5.8 | §16's one line for six |
| I.5.2 | `KEPT_MISMATCH_TITLE` + `keptMismatchBlock()` | same | the store was acknowledged and the read-back differs | flash holds something other than what was sent; not called stored | title `Stored, but the read-back does not match`; detail `Your ZONA acknowledged the store, but reading the two scripts back gave something different. HANGAR will not call that kept.`; steps `Click TRY ON DEVICE, then KEEP ON DEVICE again` / I.5.8 | title `Stored, but what read back doesn’t match`; detail `Your ZONA acknowledged the store, but reading Page 2 back gave something different. HANGAR won’t call that stored.`; steps `Click Apply to ZONA, then Store on ZONA again` / I.5.8 | the same |
| I.5.3 | `PARTIAL_TITLE` + `partialBlock(landed, failed)` | same | some of the five strings landed, in write order | WHICH landed; half-written; send all five again or put back | title `Only one of the two scripts landed` — **stale: it says two while the detail names five**; detail `{landed} reached your ZONA and {failed} did not. What is on the module now is part of this configuration and part of your own.`; steps `Click TRY ON DEVICE to send all five again` / I.5.8 | title `Only part of this reached your ZONA`; detail `{landed} reached your ZONA and {failed} didn’t. Page 2 now holds part of this configuration and part of your own.`; steps `Click Apply to ZONA to send all five again` / I.5.8 | the same; the fifth fact rides on I.5.4 |
| I.5.4 | `LandedWords` / `FailedWords` (four rows each) and "the utility script" (13-17 Q2) | same | the four partial prefixes over five slots | every row names the five in write order | `The system timer` / `the page init, the utility script, the Timer and the Setup` · `The system timer and the page init` / `the utility script, the Timer and the Setup` · `The system timer, the page init and the utility script` / `the Timer and the Setup` · `The system timer, the page init, the utility script and the Timer` / `the Setup` | keep all four pairs, and keep **`the utility script`** as the slot's word: the confirmation (I.5.9) spells it out as *the page’s own init, timer and utility scripts*, and *the utility button’s script* would name a button a visitor may never have pressed | none |
| I.5.5 | `NOTHING_LANDED_TITLE` + `nothingLandedBlock("try" \| "put-back")` | same | none of the five landed | the module is as it was; nothing to put back | title `Nothing reached your ZONA`; try: `Neither script got through. Nothing on the module changed, so your own Setup and Timer are still running and there is nothing to put back.` + `Click TRY ON DEVICE to send both again` / `If it happens twice, check the cable is seated at both ends`; put-back: `Neither script got through. Nothing on the module changed, so what was playing is still playing.` + `Click PUT BACK to send both again` / the cable line | title keep; try: `Nothing got through. Page 2 is unchanged, so your own configuration is still playing and there’s nothing to put back.` + `Click Apply to ZONA to send it again` / cable line keep; put-back: `Nothing got through. Page 2 is unchanged, so what was playing is still playing.` + `Click Put back to send it again` / cable line keep — "Neither" and "both" were two-string words | the same |
| I.5.6 | `RESTORED_UNCONFIRMED_TITLE` + `restoredUnconfirmedBlock()` | same | the restore's store did not confirm | own configuration in memory; after power-off the earlier store may return | title `Put back for now, not after a power cycle`; detail `Your own Setup and Timer are running on your ZONA now, in memory. The store did not confirm, so after a power cycle the version kept earlier may come back instead.`; step `Click PUT BACK again` | title `Put back in memory, not yet stored`; detail `Your own configuration is running on Page 2 again, in memory. The store didn’t confirm, so after power-off the version stored earlier may come back instead.`; step `Click Put back again` | the same |
| I.5.7 | `SNAPSHOT_FAILED_TITLE` + `snapshotFailedBlock()` | same | the pre-write snapshot could not be taken | nothing written; no write until a copy exists, because Put back would have nothing | title `Nothing to put back yet`; detail `HANGAR could not read the Setup and Timer already on your ZONA, and it will not write over something it has not copied.`; step `Click TRY ON DEVICE to try reading it again` | title keep; detail `HANGAR couldn’t read what Page 2 holds, and it won’t write over something it hasn’t copied. Nothing was written.`; step `Click Apply to ZONA to read it again` | the same |
| I.5.8 | `STEP_OR_PUT_BACK` | same | the second step under four of the six | the way back | `Or click PUT BACK to restore what was there when you connected` | `Or click Put back to restore what was there when you connected` | none |
| I.5.9 | `CONFIRM_REPLACES` — **the fifth fact** | same | the store confirmation's first line | five scripts replaced; survives power-off | `This replaces the Setup and Timer scripts on your ZONA’s touch element and the page’s own init, timer and utility scripts, and it survives a power cycle.` | `This replaces what Page 2 holds on your ZONA — its touch element’s Setup and Timer and the page’s own init, timer and utility scripts — and it stays after power-off.` | the 07 contract row, amended twice; no Bible line |
| I.5.10 | `CONFIRM_WAY_BACK` | same | the confirmation's second line | Put back still works | `PUT BACK still restores what was there when you connected.` | `Put back still restores what was there when you connected.` | none |
| I.5.11 | `confirmRig(others)` — the multi-module line (SAFE-06) | same | other modules on the cable when storing | their current pages are stored too; the store reaches every module | `Your EN16 is on the same cable. Its current page is stored too, because the store reaches every module at once.` / `Your EN16 and PBF4 are on the same cable. Their current pages are stored too, because the store reaches every module at once.` | keep both | none |
| I.5.12 | `LOST_TITLE` + `lostBlock(storeLeg, label)` | same | unplugged mid-write; the bar's clause takes §9's *Disconnected · draft retained* verbatim | store leg: sent, unconfirmed, power-off unknown; RAM leg: some may have landed, nothing stored | title `The ZONA was unplugged mid-write`; store: `The store was sent and no confirmation came back before the ZONA was unplugged. HANGAR cannot say what a power cycle brings back.`; RAM: `Some of this configuration may have reached the module and some may not. Nothing was stored, so a power cycle brings your own configuration back.`; steps `Plug the ZONA back in` / `Click {label} again` / `Then click PUT BACK to restore what was there when you connected` | title `Your ZONA was unplugged mid-write` (the block's; the bar reads §9); store: `The store was sent and nothing came back before your ZONA was unplugged. HANGAR can’t say what power-off brings back.`; RAM: `Some of this may have reached Page 2 and some may not. Nothing was stored, so power-off brings your own configuration back.`; steps `Plug your ZONA back in` / `Click {label} again` / `Then click Put back to restore what was there when you connected` | §9 has the clause; the block's lines have none |

### I.6 The controls' lines and their disabled reasons (the closed unions `KeepReason` and `ClearReason` keep their types; only the words change)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.6.1 | `KEEP_LINE_ENABLED` | `install-copy.ts` | the line under Store on ZONA, enabled | flash; survives power-off | `Stores this configuration in your ZONA’s own memory, so it survives a power cycle.` | `Stores this on Page 2 so it stays after power-off.` | §16's caption says it after; the control's line has none |
| I.6.2 | `KEEP_REASONS` — six | same | why Store on ZONA is disabled | each names its reason | `never-tried`: `Available after a try-on.` · `knobs-moved`: `Try it on again first — the knobs moved since the last try-on.` · `after-partial`: `Not after a half-written try-on. Send it again, or put your own back.` · `already-kept`: `Kept on your ZONA. Turn a knob and try it on again to keep a new one.` · `after-mismatch`: `Try it on again first, then keep it again.` · `incapable`: `This browser cannot write to a ZONA.` | `never-tried`: `Apply to ZONA first, then store it.` · `knobs-moved`: `The knobs moved since it was applied. Apply to ZONA again first.` · `after-partial`: `Not after a partial apply. Apply to ZONA again, or put your own back.` · `already-kept`: `Already stored on ZONA. Turn a knob and apply it again to store a new one.` · `after-mismatch`: `Apply to ZONA again first, then store it again.` · `incapable`: `This browser can’t write to a ZONA.` | §7 asks that a disabled control name its reason; no lines |
| I.6.3 | `CLEAR_LINE` — the user's own sentence (D-21, A-49) | same | the line under Reset active device page | the firmware default; the browser draft stays | `Reset the current page to factory default` | `Returns Page 2 to its firmware default. Your browser draft stays as it is.` — §16's confirmation words for the same fact. Say if D-21's sentence should stand instead | §16 has the confirmation; the control's line has none |
| I.6.4 | `CLEAR_REASONS["no-snapshot"]` | same | reset disabled with no snapshot | needs a copy first | `Needs a copy of what is on your ZONA first.` | keep | none |
| I.6.5 | the reset's confirmation (13-11 Q1) | `Clear.svelte` / Device actions | whether Reset active device page confirms | §9 says it lives under Device actions with a confirmation naming the page; A-45 shipped it with one click and `device-ui.spec.ts` test 13 holds that KEEP's is the site's only confirmation | one click, no confirmation, in the install column | **the Bible's**: §16's *Reset Page 2 to its firmware default? Your browser draft will remain available.* as the confirmation, the control under Device actions, and A-45 retired by name in test 13's header. Three writes, three gates, each different: the apply's review (§9), the store's confirmation (SAFE-05), the reset's (§16). If you prefer A-45's one click, the Bible's row is amended instead | it is the Bible's rule against a shipped one |

### I.7 The live-region utterances (`install-copy.ts`)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.7.1 | `LIVE_SNAPSHOT_SAVED` | `install-copy.ts` | the snapshot landed | a copy is saved; nothing written | `Your ZONA’s own Setup and Timer are saved. Nothing has been written.` | `A copy of Page 2 is saved. Nothing has been written.` | none |
| I.7.2 | `liveSettled(name)` | same | a RAM apply landed | RAM | `{name} is running on your ZONA. A power cycle brings your own configuration back.` | **§16 verbatim**: `Applied to Page 2. Store on ZONA to keep it after power-off.` — leaves the batch if taken | §16 has it |
| I.7.3 | `LIVE_RESTORED` | same | a restore landed | back to what it was | `Your own configuration is back on your ZONA.` | `Page 2 is back to what it was when you connected.` | none |
| I.7.4 | `liveKept(name)` | same | a store landed | flash | `{name} is stored on your ZONA and survives a power cycle.` | **§16 verbatim**: `Stored on ZONA · Page 2.` — leaves the batch if taken | §16 has it |
| I.7.5 | `LIVE_CLEARED` | same | a reset landed | the firmware default | `The page is reset to factory default.` | `Page 2 is reset to its firmware default.` | none |

### I.8 The open failures (`transport.ts` — outside the two modules 13-18 rewrites; the answers are recorded for whichever plan next touches the file, so they are not asked twice)

| # | Symbol | Module | The state it names | The fact it must carry | Shipped today (verbatim) | Proposed | Why there is no Bible line |
|---|---|---|---|---|---|---|---|
| I.8.1 | `no-web-serial` | `src/lib/transport/transport.ts` | S0a's opened reason | which browsers can install; everything else works | title `This browser cannot talk to hardware`; detail `Chrome, Edge, or desktop Firefox 151 and newer can install to a ZONA. Safari and every browser on iOS never can, and Chrome on Android only reaches Bluetooth serial ports, not a ZONA on a cable. Everything else on this site works here: the catalog, the simulator and the tuning knobs all run without any hardware.`; step `Open this page in Chrome, Edge, or desktop Firefox 151+` | title `This browser can’t talk to hardware`; detail and step keep (browsers by name, never the engine — CONN-02) | §9's *Device connection unavailable here* is the caption's alternative (I.2.5); the reason has no line |
| I.8.2 | `insecure-context` | same | S0b's opened reason | HTTPS; a file from disk is not secure | title `This page needs HTTPS`; detail `Talking to hardware is only allowed over HTTPS. Opening a built file from disk is not a secure context either, which is why the {label} button does nothing there.`; steps `Open this site over HTTPS, or run it on localhost` / `Click {label} again` | keep, with `isn’t a secure context` | none |
| I.8.3 | `cancelled` | same | the chooser closed | nothing opened, nothing sent | title `You closed the chooser`; detail `No port was picked, so nothing was opened and nothing was sent.`; step `Click {label} again and pick the ZONA` | keep, with `pick your ZONA` | none |
| I.8.4 | `port-busy` | same | another program holds the port | Grid Editor; one holder at a time; the tray icon | as shipped (see I.3.12 for the text) | I.3.12's amendment; otherwise keep | none |
| I.8.5 | `unplugged` | same | gone by the time the port opened | cable or hub | title `The ZONA is not there any more`; detail `The module was picked but was gone by the time the port opened. A loose or charge-only USB cable does this, and so does a hub that cannot power the module.`; steps as shipped | title `Your ZONA isn’t there any more`; detail with `can’t power the module`; steps keep | none |
| I.8.6 | `already-open` | same | a second open while one is in progress | one moment | title `The port would not open`; detail `HANGAR is already connecting — one moment.` | title `The port wouldn’t open`; detail keep | none |
| I.8.7 | `default` | same | any other refusal | the raw message, for a bug report | title `The port would not open`; detail `The browser reported: {raw}`; steps `Unplug the ZONA, plug it back in, and click {label} again` / `If it keeps happening, copy the message above into a bug report` | title `The port wouldn’t open`; detail keep; steps with `your ZONA`. §9's *Device access blocked* is NOT used here: the raw message is more honest than a guessed cause | none |

## J. The questions that are not strings, with a proposed answer each

Silence approves the proposal. Each is one line so the whole list is a two-minute read.

| # | From | The question | Proposed answer |
|---|---|---|---|
| J.1 | 13-03 Q2 | The favicon is still Phase 4's pad outline in the retired `#d6ff4e` with rounded corners. Redraw it square in `#dcff71`? | **Yes**, square, `#dcff71` — a mark that carries a colour the site no longer uses and a corner the site never draws is a leftover, not a decision. One SVG; 13-20's or a quick task |
| J.2 | 13-06 Q2 | `Recently used` keeps twelve, shows six (the PDF's `06`). Show the kept count? | **Keep the PDF's six** shown; twelve kept so the seventh open does not forget the first |
| J.3 | 13-06 Q3 | The motion key stores a bare word (`animated` / `still`), not a JSON body. Change it for uniformity? | **No** — nothing depends on it |
| J.4 | 13-06 Q4 | Starring writes the pruned favorites list (dropped ids removed on the next star). Keep the dropped ids until told? | **Prune** — with E.16 saying no sentence is shown, there is nothing to tell |
| J.5 | 13-07 Q1 | The hero is Aurora, not the PDF's ARC, because ARC's Lua VM would land on the first paint of `/`. Want ARC regardless? | **Aurora** — the front page's first paint outweighs matching the mockup's example entry |
| J.6 | 13-07 Q2 | `Quick guide` points at the page's own three-step strip. A separate guide page? | **The strip** — it is the guide the PDF draws |
| J.7 | 13-07 Q3 | `Import config` on the intro points at My configs, where the PDF keeps import. Open a file picker directly instead? | **My configs** — one import control, one owner (13-13's) |
| J.8 | 13-08 Q4 | `Favorites` and `Recently used` on the gallery are a library view, not in the address. Make them destinations? | **A view** — a shared `?show=favorites` would show somebody else a different set |
| J.9 | 13-08 Q6 | `Recently used` reads `00` until the workspace records an open (13-09 wired `touchRecent`). | **Closed** — wired |
| J.10 | 13-08 Q7 | `?feels=` and legacy `?tag=` still narrow the grid with no chip to show it (the FEELS row is gone, D-11). Retire the parameters? | **Retire `?feels=`**; keep the `?tag=` mapping for old links. A codec change in `query.ts` with its own spec — 13-19 or 13-20 |
| J.11 | 13-08 Q8 | The roving card exposes two Tab stops (its link and its star). Accept? | **Accept** — the alternative makes the star unreachable from the keyboard. Retitle the e2e |
| J.12 | 13-09 Q4 | The context bar's status is empty on the workspace until the draft store and the device fill it. | **Closed** by 13-11 and 13-13; the Playground draft half is J.19 |
| J.13 | 13-09 Q6, 13-11 Q4, 13-12 Q6 | The install column (Apply, Put back, Store, Reset, the blocks) still renders under the surface for one wave, doubling `Apply to ZONA`. Which plan moves it? | **13-18 task 02 removes the duplicate `Apply to ZONA` from the column** while rewriting the words; the column's remaining controls move under Device actions (I.6.5) in 13-20, with the blocks in the bar's status zone |
| J.14 | 13-11 Q3 | The header's control is 44px tall, the PDF's 37. | **44** — §14's target and the site's own rule win by 7px |
| J.15 | 13-11 Q5 | The header's summary and the footer's label both open `Device actions` beneath the footer; a header click scrolls it into view. Open in place instead? | **Keep one panel** in the footer — the PDF puts the pair there |
| J.16 | 13-11 Q6 | The status dot's three tones (action colour for confirmed, full ink for uncertain and failed, quiet for idle and busy) against the PDF's one grey dot. | **Three tones** — §9's "never one generic indicator" |
| J.17 | 13-12 Q2 | `unverified` has a third way out: the visitor's own `Keep this page`. Keep the click, or clear the line on the module's next report of any page? | **Keep the click** — a live module that silently refused a switch must not leave Apply disabled with no way back but the cable |
| J.18 | 13-12 Q3, D-19 | §9's skip clause for the destination review is declined. Strike the review, keep it, or a setting later? | **Keep it** — it is the one gate between a web page and the ZONA changing what it plays; a setting can come when somebody asks for it |
| J.19 | 13-13 Q5, Q6 | No plan writes a Playground draft on a knob turn or reads one on arrival; `Open` and `Resume draft` reach the workspace through the stamp, so the workspace does not know it is a draft. Which plan owns the wiring? | **13-20** (the closing plan) writes the draft on a knob turn and reads `?draft=` on arrival; until then the Drafts count is honestly Sandbox-only |
| J.20 | 13-12 Q4 | The destination review is not modal and does not trap focus, as every confirmation on this site. Make the one that moves hardware a real dialog? | **Keep the site's rule** — focus moves in on open and returns on close, which is what a trap is for; a modal would break the tree's no-floating-layer rule |
| J.21 | 13-12 Q5 | The review opens inside the context bar and the bar grows; the surface moves down. Anchor it as a popover? | **In the bar** — no floating layer |
| J.22 | 13-12 Q7 | If bench row I confirms the discard, where does `Revert to what’s stored` go? | **Under Device actions beside Reset** — §9's D03 row puts it there |
| J.23 | 13-13 Q1 | `Favorites` / `Recently used` on My configs link to the gallery but land on `All configs`. Add a one-shot session handoff so the row lands on the view it names? | **Yes**, a sessionStorage key the gallery reads once — the browse-return record already works that way |
| J.24 | 13-13 Q2 | Thumbnails of preset-backed variations render the base configuration (the page does not compile). Compile per row? | **Accept for now**; compile per row in 13-20 if the build budget allows |
| J.25 | 13-13 Q3 | A Sandbox record's thumbnail is unlit until the surface engine exists. A static paint of the regions' colours meanwhile? | **Yes**, a static paint — an unlit thumbnail reads as broken |
| J.26 | 13-13 Q4 | A `restored` Playground import opens the workspace at once; §11 says "show incompatibilities before opening". Never navigate? | **Keep** — a clean import has nothing to show before opening; the `older` case already stays |
| J.27 | 13-13 Q7 | Add `Type` to the sort? | **No** — the TYPE column is visible and two sort options are enough |
| J.28 | 13-13 Q8 | The rename field commits on blur; `Delete` on the same row commits the rename first. Commit on Enter only? | **Blur** — losing a rename to a mis-click is worse than committing one |
| J.29 | 13-13 Q9 | Deleting a record removes it from every collection and Undo restores the memberships. | **Accept** — Undo means exactly as it was |
| J.30 | 13-13 Q10 | Two collections may share a name. Refuse duplicates? | **Refuse at Create and Rename** with H.28's field showing `A collection called {name} already exists.` (one more string, in the register) |
| J.31 | 13-13 Q11 | One undo slot for the last deletion, record or collection. A stack? | **One slot** — the PDF draws no history and a second delete is a second decision |
| J.32 | 13-13 Q12 | `Add to collection` is a native select with a placeholder option. A checklist in the collection head instead? | **The select** — one control per row, no popover |
| J.33 | 13-14 Q2 | The `Surface` shape carries no `schema` of its own; the record's envelope does. Add the second field? | **No** — one place |
| J.34 | 13-15 Q2 | Refuse the two coarse Knob placements (a ring on column 9 or rows 8–9) with a line of their own, or leave it to the bench row and the meter? | **The bench row first** (runbook row L); write the line only if the bench says the placement is dead |
| J.35 | 13-15 Q3 | A knob's starting value is 0 and nothing sets it. A `Starts at` field? | **Not in v1** |
| J.36 | 13-16 Q1 | Two clicks on empty cells make a Fader (or a Button for one cell); §8's "then choose a compatible element" is the inspector's `Type` select. A kind chooser at the region instead? | **The inspector's `Type`** — one place to change a kind |
| J.37 | 13-16 Q4 | A recolour is one Undo entry until the next edit, even across two popover visits. Seal on close? | **Accept** — a colour is one decision however many times the popover opens |
| J.38 | 13-16 Q5 | A rename of the surface is not in the history. Should it be? | **No** — the name is not a structural edit (§8's scope) |
| J.39 | 13-16 Q6 | An empty surface is not a draft until its first element. Right? | **Right** — a surface only looked at should leave nothing behind |
| J.40 | 13-17 Q1 | A catalog entry now writes page-next into 255/4, so a module whose owner had a utility script of their own runs page-next under a catalog configuration until Put back, and a store after it stores the default. Substitute the snapshot's own utility instead? | **Substitute the snapshot's own utility** for a landing's empty string — one line in `#pageUtility`, no branch on a kind, and the module's button keeps doing what its owner made it do under a catalog entry. A surface still writes its runtime there (D-19) |
| J.41 | 13-17 Q3 | Store on ZONA and Put back sit in the Sandbox's destination zone beside Apply to ZONA (wider than page 3 draws). Move the pair under Device actions? | **Keep them in the zone** — a write control belongs where the write is decided; Device actions is for the device, not the configuration |
| J.42 | 13-17 Q5 | A saved copy opens onto a fresh surface, so the copy stays a copy. Edit the copy in place instead? | **Fresh surface** — §11: a copy is a snapshot |
| J.43 | 13-12 Q1 (with I.3.1) | Any other place a page number shows | one constant; the e2e titles re-pinned |

## K. Things in the ledger that disagree with a Bible line or a shipped string, named

1. **`PARTIAL_TITLE` reads `Only one of the two scripts landed`** while the detail under it names five
   strings. The title has been stale since 12-03 made the count three; 12.1 and 13-17 moved the detail
   and the step and not the title. I.5.3 fixes it.
2. **`identityDescription` says `Opens device details`**; the panel has been `Device actions` since
   13-11. I.2.24 fixes it — a control label paraphrased in prose, which the register forbids.
3. **`RESUME_EYEBROW` is a Bible headline in uppercase** (`PICK UP WHERE YOU LEFT OFF`), which D-05
   forbids for sentences — and the PDF has an eyebrow for exactly this card, `CONTINUE EDITING`,
   which 13-07 did not reach for. D.4.
4. **§16's one uncertain-outcome line against HANGAR's six** — the plan's deliberate departure,
   section I.5, with the `collapse-six` option.
5. **§9's `Reset active device page` with a confirmation against A-45's one-click `CLEAR`** and
   `device-ui.spec.ts` test 13's "the only confirmation on the site". I.6.5 proposes the Bible's.
6. **§9's one `Device connection unavailable here` against HANGAR's two captions** (`Not in this
   browser` / `Needs HTTPS`). I.2.5 keeps two and says why.
7. **§9's `Device access blocked` maps to no HANGAR phase** — there is no "denied" state; a blocked
   chooser lands in `cancelled` or `unknown`. I.2.7 and I.8.7 leave it unused rather than misapplied.
8. **The page numbers**: the tree shows the wire's `Page 0`–`Page 3`; the PDF, §16 and Grid Editor all
   read from 1. I.3.1.
9. **The snapshot lines in `session-copy.ts` still say "Setup and Timer"** where the copy has held five
   scripts since 13-17 and is per page since D-06. I.2.15–I.2.16, I.4.6–I.4.7, I.7.1.
10. **`FOR_LABELS.show`**: the PDF spells one facet three ways (`Visuals`, `Visuals`, `VISUAL`). E.2
    picks one.
11. **The intro's connect line** — the PDF's page 1 reads *Start in browser preview. Connect ZONA
    when you’re ready.*; §16's Disconnected row reads *Preview only. Connect ZONA when you’re ready.*
    Two lines for one state, both the Bible's: the intro keeps the PDF's, the device band takes §16's.
    Not a batch row — noted so nobody "fixes" one to match the other.
12. **The plan calls the closed union `DisabledReason`**; the tree's names are `KeepReason` and
    `ClearReason`. Same mechanism, kept as typed; I.6.2 and I.6.4 reword the members only.
13. **`overLine` (two slots, "remove one kind")** is unreachable from the route since 13-17 flipped
    `SLOTS` to 3; it is kept for the bare `slots: 2` call its spec pins. G.34.
