# Phase 13 — the copy ledger

Created 2026-09-11 by plan 13-01. **Every user-facing string this phase invents lands here**, and
13-18 puts the whole ledger to the user in one batch (its `checkpoint:decision`) rather than nineteen
plans guessing nineteen times. This document is append-only for plans 13-02 to 13-17; 13-18 empties it
into the three copy modules and records each answer beside its row.

## The register (D-05), in full

The Bible's copy — the PDF's five screens and §16's eleven rows — is the reference for tone and vibe.
Every string written for HANGAR from this phase on follows it:

- **Sentence case, short, second person.** _Make ZONA your own._ _Find a gesture you love. Build a
  surface that works the way you do._ _Pick up where you left off._
- **Names the action and its result together.** _Applied to Page 2. Store on ZONA to keep it after
  power-off._ _Discover configurations. Try one. Make it yours._
- **Plain about state, never coy.** _Preview only. Connect ZONA when you're ready._ _Changes not
  applied._ _Stored on ZONA · Page 2._ _The device stopped responding. Your draft is safe; device state
  could not be verified._
- **Reassuring where the stakes are real, in one clause.** _Reset Page 2 to its firmware default? Your
  browser draft will remain available._
- **Uppercase only for short section labels and breadcrumbs** — `PLAYGROUND / CONFIGURATIONS`,
  `YOUR LIBRARY`, `SELECTED ELEMENT / FADER` — never for sentences, headlines or instructions.
  Headlines are large, sentence-case and warm; the eyebrow above them is the small uppercase line.
- **Verbs on buttons, plainly:** _Explore_, _Apply to ZONA_, _Save copy_, _Share snapshot_, _Resume
  draft_, _New surface_, _Connect ZONA_.
- **Non-negotiables that carry over regardless of tone:** real apostrophes (_you're_, _you've_), never
  a straight-quote contraction; no exclamation marks; no emoji; no uppercase paragraphs. The three copy
  specs' other rules — no "Error", no browser engine named, no control label paraphrased in prose —
  carry over too.

The **facts** Phase 10's strings carried survive in the new words: RAM versus flash, the snapshot, the
firmware default, the promise that nothing writes without a click. Phase 10's measured-length honesty
caps are superseded and retired by name at 13-18.

## The rule every later plan follows

1. A string with a §16 row or a PDF line is **taken verbatim** and is **not** ledgered.
2. A string HANGAR must invent is **written in the register above, landed in its module so the screen
   is never blank, and ledgered here** — one row per symbol, with the state it names and the fact it
   must carry, so the user can judge the proposal against what it has to say.
3. A plan that is **not sure** what a state should say (D-01: ask rather than guess) still lands a
   string so nothing is blank, and writes its question in the row's last column.
4. 13-08 adds the seven `FOR` display labels and the chip-versus-rail naming of one facet. 13-18
   collects everything.

## The ledger

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `RESTORED_CAPTION` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | PUT BACK completed: the snapshot is back on the device, acknowledged | which page was restored (D-06: snapshots are per page) and that it is the module's own earlier config, not a HANGAR default | _(not proposed here; 13-18's batch)_ | none — §16 has no restore line |
| `SAFE_NOTE`'s successor | `src/lib/device/session-copy.ts` | seeded by 13-01 for 13-18 | the connect screen, before any write is possible | the promise that nothing is written without a click (SAFE-01) — the fact survives, Phase 10's wording does not | _(not proposed here)_ | none — §16 has "Preview only. Connect ZONA when you're ready." for the disconnected state, which is a different fact |
| `UNCONFIRMED_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | the ACK for a write never arrived inside the retry bound | the draft is safe; the device state is unverified, not failed; PUT BACK is offered | _(not proposed here)_ | §16 offers one row for all six uncertain outcomes: "The device stopped responding. Your draft is safe; device state could not be verified." — this phase refuses to collapse six measured outcomes into one sentence |
| `KEPT_MISMATCH_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | the store was acknowledged but the re-fetch read back something else | flash holds something other than what was sent; RAM may still be right; what to do next | _(not proposed here)_ | the same one §16 row — see above |
| `PARTIAL_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | one event landed and the other did not | which of Setup and Timer landed; the module is half-written; retry or PUT BACK | _(not proposed here)_ | the same one §16 row |
| `NOTHING_LANDED_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | neither event landed | the device is as it was; nothing to put back | _(not proposed here)_ | the same one §16 row |
| `RESTORED_UNCONFIRMED_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | PUT BACK was sent and its ACK never arrived | the snapshot is still held; the device may or may not be restored; do not assume either | _(not proposed here)_ | the same one §16 row |
| `SNAPSHOT_FAILED_TITLE` | `src/lib/device/install-copy.ts` | seeded by 13-01 for 13-18 | the pre-write snapshot could not be taken | nothing was written; no install is offered until a snapshot exists, because PUT BACK would have nothing to restore | _(not proposed here)_ | the same one §16 row |
| the open-failure `default` branch, beside `port-busy` (CONN-04) | `src/lib/transport/transport.ts:150` (`port-busy`) and `:190` (`default`) | filed by 13-02 for 13-18 | a port this browser opened once is refused on a second open because **another HANGAR tab** still holds it — observed on the user's desk during the slot probe (`PROBE-RESULTS-2026-09-10.md`, first section): session phase `unknown`, *"The port would not open"*, while the install store read `ready` with a landed snapshot | nothing was written and the store's refusal was right; **another tab of this site may be holding the ZONA**, and the way back is to close it, re-plug, reload and connect once — `port-busy` today names Grid Editor and its tray icon and never a second HANGAR tab | the probe's own sentence, offered for the batch: _Another tab may be holding your ZONA._ | none — §16 has no line for a port held by another tab |
| the wordmark's accessible name (`label` prop of `Wordmark.svelte`) | `src/lib/ui/Wordmark.svelte` (default of the `label` prop) | landed by 13-03 for 13-18 | the header mark, read by a screen reader — the mark is the supplied logo as paths, not text, so it has no name of its own | that the mark says HANGAR, the site's name; the mark is `HANGAR` alone and `FOR ZONA` is text beside it (§3: _"Use HANGAR / for ZONA in the shell"_), so the name is the word the mark spells and nothing more | _HANGAR_ | §3 names the pair; the PDF's header draws the mark and `FOR ZONA` as two things. Uppercase because it is the brand as written and a short label, which D-05 permits |
| `MOTION_LABEL` | `src/lib/sim/motion.svelte.ts` (rendered by `src/lib/ui/MotionControl.svelte`) | landed by 13-04 for 13-18 | the motion control's label - a checkbox in the footer, under Help & shortcuts once 13-05 builds it; checked means the ambient previews hold one frame | that it stops the previews' own motion (Bible §14: "stop ambient preview loops", "keep motion generated by instrument output controllable"; §6: "animate only the selected or explicitly previewed card"); the SCREEN switch's one surviving purpose (D-09) | _Keep previews still_ | none - §14 states the rule, §16 has no line for the control |
| `MOTION_EXPLANATION` | `src/lib/sim/motion.svelte.ts` (rendered by `MotionControl.svelte`, `aria-describedby` of the box) | landed by 13-04 for 13-18 | the one-line explanation under the label, in every state including the disabled one | three facts: the cards hold one frame; a pad still answers a finger (host.ts's carve-out, §14's "controllable"); the OS reduced-motion setting always wins (the control is additive, never subtractive - when the OS asks for less motion the box is shown checked and disabled) | _Cards hold one frame instead of animating. A pad still answers your finger, and your system’s reduced-motion setting always wins._ | none |
| `resumeLine(name, edited)` - the resume card's supporting line | `src/lib/ui/intro/card.ts` (rendered by `src/lib/ui/intro/Intro.svelte` as the first card's body) | landed by 13-07 for 13-18 | the intro for a returning visitor with a draft: the first card is `Resume draft` and this line says which draft and how old (D-14 Q2) | the object is a DRAFT (section 9's word, never "Saved"), its name, and when it was last edited, in words | _Draft · {name} · Last edited {edited}_ - the age in words: _just now_, _a minute ago_, _12 minutes ago_, _an hour ago_, _5 hours ago_, _a day ago_, _3 days ago_; an unreadable moment reads _earlier_ | the PDF's page-4 status line `Draft · Modulation · Last edited 12 minutes ago` is the shape; the middle term is the draft's own name here rather than a category, because a draft is named and the category is the source entry's |
| `RESUME_EYEBROW` - the resume card's eyebrow | `src/lib/ui/intro/card.ts` (rendered by `Intro.svelte` above `Resume draft`) | landed by 13-07 for 13-18 | the same card, the short uppercase label where the first-visit card reads `START WITH AN IDEA` | that this card continues something rather than starting it | _PICK UP WHERE YOU LEFT OFF_ | the words are the Bible's own sentence (D-05 quotes _Pick up where you left off._); only the case is HANGAR's, so the label sits beside the PDF's `START WITH A BLANK SURFACE` as a peer. If a different label is wanted, one constant |
| `heroDescription(name)` - the hero surface's accessible description | `src/lib/ui/intro/card.ts` (rendered by `src/lib/ui/intro/HeroSurface.svelte` as the surface's `aria-describedby`) | landed by 13-07 for 13-18 | the live 9 x 9 surface on the intro, read by a screen reader after the canvas's own name (_{name}, live pad simulation_, PadCanvas.svelte) | three facts, plainly (D-05): it is a simulation running here, a finger plays it, and nothing reaches a ZONA - the PDF's chip says `BROWSER PREVIEW` and its caption says _Drag across the surface to preview_, and this is those two lines for someone who cannot see the chip | _A live simulation of {name} running in your browser. Drag across it to play it; nothing is sent to a ZONA._ | none - the PDF's two visible lines are kept verbatim beside it; section 16 has no accessibility line |

**A count the plan got wrong, recorded rather than reconciled:** 13-01-PLAN.md seeds "seven" and
names **eight** symbols — `RESTORED_CAPTION`, `SAFE_NOTE`'s successor, and the six titles §16's single
"Unknown transfer result" row would collapse. All eight are seeded; the six are the ones §16 offers one
line for, and the two others have no §16 line at all.

## Questions for the user, recorded rather than answered (D-01)

None from 13-01: this plan authored no string a visitor can read. Its test failure messages, its
`app.css` comment and its docs paragraph are contributor-facing and are written in the register anyway.

**From 13-02, one question for 13-18 rather than an answer:** the probe's second open landed in the
`default` branch (title _The port would not open_), not in `port-busy` (CONN-04's block, which names
Grid Editor). So either the browser reports a port held by another tab of the same site with a
different error than a port held by another program, or the classifier missed it. **Which raw message
the browser gave was not recorded.** 13-18 decides whether `port-busy`'s detail gains a second culprit
(_a second HANGAR tab_) beside Grid Editor, or the `default` branch gains the sentence above, or both —
and whether that needs the raw message reproduced first. This plan authored no string a visitor can
read; the row above proposes the probe's own words and lands nothing.

**From 13-03, one string landed and two questions recorded (D-01: ask rather than guess).** The
wordmark's accessible name is landed as _HANGAR_ (the row above) so the mark is never nameless.
Question one, for 13-05 and 13-18: when the shell wraps the mark in a link to `/`, does the link's name
stay _HANGAR_ alone, or does it read the visible pair — _HANGAR for ZONA_ — since a screen reader will
otherwise announce the mark and then the separate `FOR ZONA` text as two things? The Bible has no line.
Question two, for the user rather than 13-18, because it is a mark and not a string: the favicon is
still Phase 4's 9x9 pad outline in the retired `#d6ff4e` with two `rx` corners in its SVG; 13-03 kept it
and its test unchanged as the plan asked (the wordmark is 8:1 and cannot be an icon), but the favicon
now carries an accent the site no longer uses (D-16) and a corner the site never draws (D-01). Whether
it is redrawn — in `#dcff71`, square — is asked here rather than decided.

**From 13-04, two strings landed and one question recorded (D-01: ask rather than guess).** The
motion control - the SCREEN switch's re-homed purpose - lands its label and its explanation as the
two rows above, so the footer is never blank. The question, for 13-18 and the user: when the
operating system already asks for less motion the control is shown **checked and disabled** with the
same explanation, whose last clause (_your system's reduced-motion setting always wins_) is what makes
the disabled state plain rather than coy. The alternative is a third, state-specific string (_Your
system asks for less motion, so previews are already still._) that swaps in for the disabled state.
The Bible has no line for either; 13-04 chose two strings and the rule stated once, and asks whether
the third is wanted. The storage key is `hangar.motion.v1` with the values `animated` and `still`;
13-06 folds it into the store module.

**From 13-05, no string landed and three questions recorded (D-01: ask rather than guess).** The
shell's every visible string is the PDF's verbatim and is not ledgered: `PLAYGROUND` / `SANDBOX` /
`MY CONFIGS`, `FOR ZONA`, the breadcrumb forms, _Preview without hardware_, `HANGAR / by intech
studio`, `Help & shortcuts`, `Device actions`. No aria-label was invented: the context bar is a section
named by its own breadcrumb, the rail and the inspector are named by their first title and their
headline, and the wordmark link's name is the plain pair the two pieces spell (_HANGAR_ from the
mark's ledgered label, then the text `FOR ZONA`). The questions, for 13-18 and the user:

1. **The wordmark link's accessible name** - 13-03's question one stands. The shell uses the plain
   pair (a screen reader hears _HANGAR_, then _FOR ZONA_, as the two things the PDF draws) and sets
   no aria-label; if the pair should read as one phrase, 13-18 decides the phrase.
2. **`Device actions` is absent until 13-11 fills its slot**, not shown dead. A footer label that does
   nothing is the coy state D-05 forbids, so the pair reads `Help & shortcuts` alone until the control
   exists and gains its middle dot and its second label with it. If the user would rather see the
   PDF's full line from today, the label needs a destination or a sentence, and that sentence is
   invented - so it is asked here rather than written.
3. **`Help & shortcuts` is a disclosure, closed by default, and the motion control is under it** - one
   click away rather than on the footer's face as 13-04 left it. The PDF's footer is one quiet line;
   §14 asks that the motion control exist and be reachable, not that it be always visible. If the
   user wants the checkbox on the face of the footer on every page, the disclosure opens by default
   or goes; either is one line. The control itself is unchanged and its two strings stay 13-04's rows.

**From 13-06, no string landed and four questions recorded (D-01: ask rather than guess).** The
stores are data: `src/lib/store/` invents no string a visitor can read, no name default was needed
(a record's `name` is required and the caller supplies it), and the words each store may be shown
under are the Bible's own - `Draft`, `Draft saved locally`, `Resume draft`, `Save copy`, `Saved` on
a copy only, `Favorites`, `Recently used`. The questions, for 13-08, 13-13 and the user:

1. **The favorites drop count has a number and no sentence.** `readFavorites` returns how many
   starred ids the catalog no longer carries (twelve entries have been removed across Phases 11
   and 12, so this is a real case). Whether the gallery says _Two favorites are no longer in the
   catalog._ or simply shows the shorter list is 13-08's call; the sentence, if wanted, is invented
   and has no Bible line, so it is asked here and not written.
2. **Twelve kept, six shown.** The PDF's rail shows `Recently used 06`; the store keeps twelve so
   the seventh open does not forget the first. If the rail should show the kept count rather than
   the PDF's six, `RECENT_SHOWN` is one number.
3. **The motion key's stored shape is 13-04's bare word** (`animated` / `still`), not the plan's
   `{ ambient: boolean }` sketch, because the behaviour was not allowed to move. If a JSON body is
   wanted for uniformity it is a `.v2` beside the `.v1` and a re-run of the tagged reduced-motion
   title; nothing else in the ledger depends on it.
4. **Starring writes the pruned list.** A read never writes, but the next star or unstar persists
   the favorites minus the dropped ids. If the dropped ids should be kept until the visitor is
   told, the prune moves out of `setFavorite`; it is one line either way.

**From 13-07, three strings landed and four questions recorded (D-01: ask rather than guess).**
Every visible string on the intro is the PDF's page 1 verbatim and is not ledgered: the eyebrow, the
two headline lines, the two sub-lines, both cards' eyebrows, titles and bodies, `Already have a
configuration?` and `Import config`, the bulleted line, `TRY THE SURFACE`, `BROWSER PREVIEW`, `Drag
across the surface to preview`, the three steps and their sentences, and `Quick guide` in the header.
The three rows above are what HANGAR had to write: the resume card's line and eyebrow, and the hero's
accessible description. The questions, for 13-18 and the user:

1. **The hero is Aurora, not the PDF's ARC.** The plan derives the hero from `FRONT_DOOR` (the first
   member that is not dark, in list order), and that resolves to `aurora`. ARC is a hand-authored Lua
   entry and is excluded from `FRONT_DOOR` by name; making it the hero would put the 271 KB Lua VM on
   the first paint of `/`, which `e2e/tuning.e2e.ts` forbids in words. So the panel's caption reads
   `AURORA / SHOW` (the hero's name and its FOR term) where the PDF reads `ARC / MODULATION`. If ARC
   is wanted on the intro regardless, that is a decision about the front page's first paint, not a
   string, and it is asked here rather than taken.
2. **`Quick guide` points at the page's own three-step strip** (`#quick-guide`), because the strip is
   the guide the PDF draws and no other destination exists. If a separate guide page is wanted, the
   link is one attribute.
3. **`Import config` points at My configs** (`/my-configs/`, 13-12's route), where the PDF's page 4
   keeps import. If import should open a file picker from the intro directly, 13-13's import owns the
   control and this link becomes a button.
4. **The resume card's eyebrow is a case change of a Bible sentence.** D-05 permits uppercase for short
   section labels; whether `PICK UP WHERE YOU LEFT OFF` is a label or a sentence in uppercase is a
   judgement, and it is asked. The alternative that invents nothing is to keep `START WITH AN IDEA`
   above `Resume draft`, which reads oddly; the alternative that invents a word is a new label.

## From 13-08: the gallery's rows, and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-08 (PDF page 2 at `/playground/`). Every visible string on the gallery
that the PDF draws is taken verbatim and is **not** ledgered: `THE CONFIGURATION PLAYGROUND`, _Find
your next gesture._, _Playable ideas for your surface. Open one, try it, make it yours._, `SEARCH
CONFIGURATIONS`, _Search names, gestures, and tags…_ (the placeholder), `SORT BY`, `Featured`, `Use`,
`All`, `Explore`, `YOUR LIBRARY`, `All configs`, `Favorites`, `Recently used`, `MADE FOR`, _Start
with a configuration._ / _Make it feel like you._, `+ Build your own`, `PLAYGROUND / CONFIGURATIONS`
and _Browse. Preview. Make it yours._ in the context bar, and §16's _No configurations found. Try a
different search or clear your filters._ for the empty result. The rows below are what HANGAR had to
write, and the seven display labels the plan asked for.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `FOR_LABELS.modulation` | `src/lib/browse/labels.ts` (read by `rail.ts`, `BrowseToolbar.svelte` through `FacetRow.svelte`, and `CatalogCard.svelte`'s category line) | landed by 13-08 for 13-18 | the MADE FOR rail row and the `Use` chip for the FOR term `modulation` | the facet's display name in D-05's sentence case; today's tree renders the identifier upper-cased, which D-05 retires | _Modulation_ | the PDF's rail and chip row both read `Modulation` |
| `FOR_LABELS.show` | same | landed by 13-08 for 13-18 | the row and chip for `show` | as above | _Visuals_ | the PDF reads `Visuals` on the rail and in the chip row; the card line reads `VISUAL` (singular) - three forms of one word in the PDF, so the batch decides which |
| `FOR_LABELS.sequencing` | same | landed by 13-08 for 13-18 | the row and chip for `sequencing` | as above | _Sequencing_ | none - no PDF row names it |
| `FOR_LABELS.mixing` | same | landed by 13-08 for 13-18 | the row and chip for `mixing` | as above | _Mixing_ | none |
| `FOR_LABELS.play` | same | landed by 13-08 for 13-18 | the row and chip for `play` | as above; the term is a verb (_you reach for a pad in order to PLAY_, facets.ts) and its carriers are nine drum pads, a snake and nine chords | _Playing_ | the PDF's nearest row is `Notes & chords` (rail) and `Notes` (chip), which names CHORUS's carrier and not NINEPADS's or SNAKE's - so the PDF's word is not the term's |
| `FOR_LABELS.shortcuts` | same | landed by 13-08 for 13-18 | the row and chip for `shortcuts` | as above | _Shortcuts_ | none |
| `FOR_LABELS.pointing` | same | landed by 13-08 for 13-18 | the row and chip for `pointing` | as above | _Pointing_ | none; the PDF's `Expression` names no FOR term |
| the star's ON name (`starName` in `CatalogCard.svelte`) | `src/lib/ui/CatalogCard.svelte` | landed by 13-08 for 13-18 | the favorite button when the entry is starred (the star filled in the action colour) | that pressing it REMOVES the mark; the entry's name so the button is not one of twenty-six identical buttons; "favorites" is the PDF's rail word and never "saved" | _Remove {name} from your favorites_ | none - the PDF draws the star and names nothing |
| the star's OFF name | same | landed by 13-08 for 13-18 | the same button, outlined | that pressing it ADDS the mark | _Add {name} to your favorites_ | none |
| `CLEAR` and `CLEAR_NAME` | `src/lib/ui/BrowseToolbar.svelte` | landed by 13-08 for 13-18 | the search field's own clear control, visible while the field holds text | that it clears the FIELD and hands focus back to it (its accessible name says what it clears once a screen reader has moved past the label) | _Clear_ (visible), _Clear the search_ (accessible name) | none - Phase 5's `CLEAR` in the retired register |
| `CLEAR_FILTERS` | same | landed by 13-08 for 13-18 | the control beneath the chip row, present only while something narrows the grid | that it clears the query, every chip and the rail's library view, and never the sort (a view preference) | _Clear filters_ | §16's empty line says _clear your filters_; the button is the verb form of it. Phase 5's `CLEAR FILTERS` in the retired register |
| `TITLE` | `src/routes/playground/+page.svelte` | landed by 13-08 for 13-18 | the document title and og:title of the gallery | the section's name and the site's | _Playground — HANGAR_ | none; the intro's is `HANGAR` and the workspace's is `{name} — HANGAR` |

**From 13-08, twelve strings landed and eight questions recorded (D-01: ask rather than guess).**

1. **The chip-versus-rail naming of one facet.** The PDF's rail reads `Notes & chords` where its chip
   row reads `Notes` - one facet, two lengths. HANGAR's rail and chip row read ONE record
   (`FOR_LABELS`), so today no facet can carry a shorter chip label. If the batch wants the PDF's
   shape, the record grows a second field per term (`{ rail, chip }`) and the rule "the two must not
   disagree" becomes "the two derive from one record with two fields". One table either way.
2. **The seven labels are proposals** (the table above). `show` is the awkward one: the PDF uses
   `Visuals` on the rail and in the chips and `VISUAL` on the card line, and HANGAR renders one word in
   all three places through the record.
3. **The count line reads `{n} of {total} configurations.`** where the PDF draws `36 configurations`.
   The fuller line is what browse-ui.spec test 6 and section 6's "the actual matching count" ask
   for, and the PDF's form is only right while nothing is filtered. If the shorter form is wanted when
   unfiltered, it is one `{#if}` and a re-pinned test.
4. **`Favorites` and `Recently used` are a LIBRARY VIEW, not in the address.** Pressing either narrows
   the grid to the store's ids; the address carries the sort, the query and the chips as before, and
   the view resets to `All configs` on arrival, because a shared `?show=favorites` would show
   somebody else a different set. If the rows should be destinations (a page of their own, as page 4's
   `My configs` is) rather than filters, that is 13-13's shape and this page's two rows become links.
5. **An empty library view shows §16's line** - _No configurations found. Try a different search or
   clear your filters._ - which is true and slightly off for a visitor who has starred nothing yet.
   A line of its own (_You haven't starred anything yet._) would be invented, so it is asked, not
   written. The same holds for `Recently used` before the workspace records an open.
6. **`Recently used` reads `00` until 13-09.** `touchRecent` is the workspace's call on open
   (13-06's note assigned it to 13-08, but the workspace page is untouched by this plan under the
   move-clean instruction); the rail counts what the store holds, honestly zero.
7. **A FEELS term can still arrive in the address and filter without a chip.** `?feels=generative`
   (A-20's parameter) and a mapped legacy `?tag=` still narrow the grid, the count line says the
   truth and `Clear filters` clears it - but the FEELS row is gone (D-11), so no chip shows the
   filter. Retiring the parameter is a codec change in `query.ts` with its own spec; asked here.
8. **The roving card exposes two Tab stops - its link and its star.** Every other card exposes none,
   so Tab crosses the wall in two presses instead of one. The alternative that keeps one stop makes
   the star unreachable from the keyboard, which is worse; a third (a key on the card that toggles
   the star) invents a keyboard model. Recorded because e2e/browse.e2e.ts's title still says "one
   tab stop" and its assertion now counts two elements on one card.

## From 13-09: the workspace's and the inspector's rows, and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-09 (PDF page 5 at `/playground/<id>/`). Every visible string on the
workspace that the PDF draws is taken verbatim and is **not** ledgered: `CONFIGURATIONS`,
`← All configs`, `Save a copy`, `EXPLORE` (the eyebrow's first word; the FOR label follows the
slash through 13-08's `FOR_LABELS`), `Configure`, `Play`, `ZONA · 9 × 9 LIGHT MATRIX`, the
`X … / Y …` readout form, `CONFIGURATION`, _Tune the gesture, then try it on your surface._,
`Behavior`, `Appearance`, `MIDI output`, `Randomize`, `Reset settings`, `Edit color`, `Save copy`,
`Share snapshot`, _Map this CC to a parameter in your instrument or DAW._, and the breadcrumb
`PLAYGROUND / ARC` (the entry's name upper-cased, a short label under D-05). They live in
`src/lib/tune/inspector-copy.ts`, a zero-import module beside `copy.ts`, because `copy.spec.ts`
holds `copy.ts` character for character and 13-19 owns it. The rows below are what HANGAR had to
write.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `INSPECTOR_HEADLINE` | `src/lib/tune/inspector-copy.ts` (read by `TuningRegion.svelte`) | landed by 13-09 for 13-18 | the inspector's two-line headline, on every entry's workspace | that the panel is where the gesture is shaped; ONE constant for twenty-seven entries, because the PDF gives one line for ARC and inventing twenty-six more is not this plan's to do (D-01) | _Shape the_ / _movement._ | PDF page 5, verbatim - for ARC. The question is whether it is per entry (see question 1) |
| `fieldResetName(label)` | same (read by `Knob.svelte`) | landed by 13-09 for 13-18 | the per-field reset's accessible name (section 7); the visible word is `Reset` | which field it restores, so a screen reader hears one of six rather than six alike | _Reset {label}_ | none - section 7 asks for the control and gives it no name |
| `FIELD_CHANGED` | same (read by `Knob.svelte`) | landed by 13-09 for 13-18 | the changed-field marker's hidden sentence, beside a field off its default | that the value is not the one the card ships with | _Changed from the default_ | none - section 7 asks for "a subtle marker" and gives it no words |
| `UNKNOWN_NOTICE` | `src/routes/playground/[id]/+page.svelte` | landed by 13-09 for 13-18 | an address nobody has heard of, on the workspace | that nothing is here and the rail is the way on; Phase 4's line named "the shelf", which 13-09 deleted | _Never heard of that one. Pick a configuration from the list._ | none |
| `SAVED_COPY` | same | landed by 13-09 for 13-18 | the two Save copy buttons for 2 s after a copy was written | that a NAMED COPY was written to the library (library.ts permits _Saved copy_ on a copy and forbids _Saved_ on a draft or the device) | _Saved copy_ | none - the PDF draws the button at rest only |
| `copyName(name)` | same | landed by 13-09 for 13-18 | the name a saved copy is given, before 13-13's rename | that it is a copy of this entry and not the entry | _{name} copy_ | none |
| the mode switch's group name | same (`aria-label` on the radiogroup) | landed by 13-09 for 13-18 | the `Configure` / `Play` radiogroup, which the PDF draws with no caption | that the two segments are one choice | _Mode_ | none |
| `POPOVER_CLOSE` | `src/lib/tune/inspector-copy.ts` (read by `Swatch.svelte`) | landed by 13-09 for 13-18 | the colour popover's visible close button, beside Escape and the backdrop click | that it closes the popover and hands focus back to `Edit color`; a modal with no visible way out fails a touch visitor | _Close_ | none - the PDF draws no popover |

**From 13-09, eight rows landed and six questions recorded (D-01: ask rather than guess).**

1. **Per-entry inspector headlines.** The PDF's _Shape the / movement._ is ARC's; HANGAR renders it
   above every entry. If the batch wants a headline per entry, that is twenty-seven lines of copy in
   the entries (or a table beside them) and a schema field; one constant is what ships until then.
2. **`Active color` against the schema's own label.** The PDF labels the swatch row `Active color`;
   HANGAR renders the colour knob's own label (`Colour`, `Swirl colour`, `Heart colour` …) because
   section 7 says to use actual parameter names and six entries carry two or three colour knobs.
   The PDF's word is not shown anywhere.
3. **The hex beside the swatch.** The PDF draws `#DCFF71`. The picker's accessible value stays the
   three stored integers (view.ts: a hex implies a 24-bit resolution the pad cannot reach); the
   visible hex is exact because every channel is a multiple of 17. Show it, or show `r, g, b`?
4. **The context bar's status on the workspace.** The PDF's _Draft saved locally · Changes not
   applied_ reports the draft store (13-10 / 13-13) and the device (13-11); the zone is empty on the
   workspace until they fill it, and the destination zone reads _Preview without hardware_.
5. **`LINK COPIED` after `Share snapshot`.** The share control wears the PDF's label at rest and
   Phase 5's `LINK COPIED` when confirmed, because `copy.ts` is 13-19's. What does a confirmed
   snapshot say - _Link copied_, _Snapshot copied_?
6. **The install column under the surface.** TRY ON DEVICE, PUT BACK, KEEP ON DEVICE and CLEAR are
   rendered beneath the surface in Phase 7's column until 13-11 moves Apply to ZONA into the context
   bar; the PDF draws none of them there. Recorded so nobody reads the column as a design.

## From 13-10: the monitor's rows, the randomiser's, and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-10 (the workspace's second half). Taken verbatim and **not** ledgered:
`MIDI monitor` and `Browser preview · No MIDI output` (PDF page 5's collapsed bar, both strings as
drawn), `Randomize` and `Reset settings` (PDF page 5, already landed by 13-09), and `Undo randomize`
(Bible section 7's own words: _"Provide **Undo randomize**"_). The two 908 meters keep every string
they had - `SETUP`, `TIMER`, `{used} / 908`, `{pct}%`, `measuring…`, the ladder family and
`TURN IT DOWN` - because the re-home changed where they render and what colour their over state is,
not a word; a string that survives unchanged is not ledgered, and `tune/copy.ts` is 13-19's. The
rows below are what HANGAR had to write. They live in `src/lib/tune/inspector-copy.ts`.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `MONITOR_COLUMNS` | `src/lib/tune/inspector-copy.ts` (read by `MidiMonitor.svelte`) | landed by 13-10 for 13-18 | the six column heads of the expanded log | section 10's six nouns in section 10's order, as table heads a screen reader announces per cell | _Time_ · _Direction_ · _Source_ · _Channel_ · _Message_ · _Value_ | section 10 names the six ("timestamp, direction, source, channel, message, and value"); the heads are those words capitalised, with _Time_ for _timestamp_ because a head is a label |
| `MONITOR_DIRECTION` | same | landed by 13-10 for 13-18 | every row's direction cell | that every message is outbound from the simulation; HANGAR has no MIDI input to route (lua-host.ts records `rx_mode` and routes nothing) | _out_ | none - section 10 names the column and no value |
| `MONITOR_SOURCE` | same | landed by 13-10 for 13-18 | every row's source cell | that the message came from the browser preview and not from a ZONA or a port - the same fact the bar's status states | _Browser preview_ | the PDF's own phrase, from the bar's status line |
| `MONITOR_PAUSE` / `MONITOR_RESUME` | same | landed by 13-10 for 13-18 | the one control that freezes and unfreezes the log; the label swaps with the state, so the accessible name carries it | that pausing stops new rows and that what arrives meanwhile is not shown (the paused line below says so) | _Pause_ / _Resume_ | section 10: "users can pause and clear the log" - the verbs are the Bible's, the labels are the verbs |
| `MONITOR_CLEAR` | same | landed by 13-10 for 13-18 | the control that empties the visible log; disabled when it is already empty | that it clears the VIEW and nothing else - the simulation is untouched | _Clear_ | section 10's verb |
| `monitorCount(n)` | same | landed by 13-10 for 13-18 | the count beside a value on a row that stands for a run of alike messages inside the 100 ms window | how many messages the row folded; empty on a lone message so a lone row carries no `x1` | _x{n}_ | none - section 10 says "aggregate or limit high-rate messages" and gives no form |
| `MONITOR_EMPTY` | same | landed by 13-10 for 13-18 | the expanded log with no row in it | that nothing has been sent since the monitor opened, and what to do to see something | _Nothing sent yet. Play the surface and what it sends shows here._ | none |
| `MONITOR_PAUSED` | same | landed by 13-10 for 13-18 | the expanded log while paused | that what the surface sends now is not shown and will not be replayed on resume - the honest statement of the pause semantics shipped | _Paused. What the surface sends now is not shown until you resume._ | none |

## From 13-11: the device band's rows - none - and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-11 (the device band re-skinned and re-homed). **This plan changed no
string and wrote none.** Every word the header's control, the footer's `Device actions` panel, the
context bar's device clause and the install blocks render is Phase 6's, Phase 7's or Phase 10's,
verbatim from `session-copy.ts` and `install-copy.ts`: `NO ZONA`, `CONNECT ZONA`, `CONNECTING…`,
`ZONA · fw {fw} · page {n}`, `Not in this browser`, `Needs HTTPS`, `ZONA detected`, `ZONA unplugged`,
`Did not connect`, `DISCONNECT ZONA`, `FORGET THIS ZONA`, the revoke explanation, the lock's reason,
the two snapshot lines, `READING ZONA`, `ZONA IDENTIFIED`, `WRITING…`, `PLAYING NOW`, `RESTORED`,
`KEPT`, `FACTORY DEFAULT` and the seven failure titles. The screenshots in 13-11-SUMMARY.md show
Phase 10's words in the Bible's places; they are not the final copy. Taken verbatim from the PDF and
**not** ledgered, as 13-05 did for `Help & shortcuts` and `Preview without hardware`: `Device actions`
(the footer's second label, PDF pages 2-5) and `Page {n}` (the context bar's destination label while a
ZONA is connected, the PDF's `Page 1` as the module reports it; 13-12 turns it into the Target select).

The rows 13-18 has to write for this band, so the batch sees them in one place - **none landed**:

| State | Where it renders since 13-11 | Today's words (Phase 10) | Bible line? |
| --- | --- | --- | --- |
| S1 not connected, at rest / hovered | the header's control | `NO ZONA` / `CONNECT ZONA` | PDF page 1: _Connect ZONA_ |
| S4 connected | the header's control | `ZONA · fw 1.5.5 · page 3` | PDF pages 2-5: _ZONA connected_ (the identity moves to Device actions) |
| S0a / S0b | the header's control's caption | `Not in this browser` / `Needs HTTPS` | section 9: _Device connection unavailable here_ - ONE line for two facts; HANGAR keeps two |
| S2 detected | the caption | `ZONA detected` | none |
| S6 failed | the caption | `Did not connect` | section 9: _Device access blocked_ (for the denied cause only) |
| ready | the bar's device clause | `ZONA IDENTIFIED` | section 9: _ZONA connected_ |
| writing | the bar's device clause | `WRITING…` | section 9: _Applying to Page N…_ / _Storing on Page N…_ (the leg is not read by the bar) |
| settled | the bar's device clause; the block | `PLAYING NOW` | section 16: _Applied to Page 2. Store on ZONA to keep it after power-off._ |
| kept | the bar's device clause; the block | `KEPT` | section 16: _Stored on ZONA · Page 2_ |
| unconfirmed / kept-mismatch / partial / nothing-landed | the bar's device clause; four blocks | four titles (see 13-11-SUMMARY.md) | section 16 offers ONE line; **four are needed and they stay four** |
| restored / restored-unconfirmed / cleared / snapshot-failed | the bar's device clause; four blocks | `RESTORED`, `Put back for now, not after a power cycle`, `FACTORY DEFAULT`, `Nothing to put back yet` | **none - the spec has no row**; write four in the register |
| lost | the bar's device clause; the block | `The ZONA was unplugged mid-write` | section 9: _Disconnected · draft retained_ |
| the draft clause | the bar's first clause | **not wired** (13-13) | section 16: _Draft saved locally_, _Changes not applied_ |

Questions for the user, from 13-11 (D-01):

1. **Reset active device page under Device actions.** Section 9 puts it there with a confirmation
   naming the page (section 16: _Reset Page 2 to its firmware default? Your browser draft will
   remain available._). Phase 10's A-45 shipped the same write as `CLEAR`, in the install column,
   WITHOUT a confirmation, and `device-ui.spec.ts` test 13 holds that KEEP ON DEVICE's is the site's
   only confirmation. 13-11 built no second control: the sentence is 13-18's, the page it names is
   13-12's target, and two gates on one write on one page is an incoherence, not a design. Which
   rule stands - the Bible's D06 confirmation (then A-45 is retired by name and the reset moves into
   Device actions when 13-12 moves the column), or A-45's one click (then the Bible's row is amended)?
2. **The header's control in S0a / S0b.** The plan asked for it "present and disabled with a reason".
   It ships present and ENABLED: a summary whose caption is the reason in short and whose one click
   opens the reason in full (CONN-02's two messages), exactly as Phase 6 built it and as
   `session.e2e.ts` asserts ("present, enabled, aria-expanded"). A disabled summary could not open
   the reason. Keep this, or make the control inert and put the full reason somewhere always visible?
3. **The header's box is 44px tall, the PDF's 37.** Section 14's 44px target and the site's rule on
   every control (`device-ui.spec.ts` test 3) win by 7px. Accept, or draw the border on a 37px inner
   box inside a 44px hit area?
4. **The install column stays under the surface until 13-12.** 13-09's question, decided here from
   the PDF: page 5 has no column because its `Apply to ZONA` is in the context bar, and until 13-12
   builds that control hiding the column would take the only write control off the only page that has
   one. For one wave a state caption reads twice on the workspace (the bar's clause and the block).
5. **Two openers, one panel, in the footer.** The header's summary and the footer's label open the
   same `Device actions` panel beneath the footer's line; a header click on a full-height page scrolls
   the panel into view. The alternative - a floating drawer under the header as Phase 6 had it, with
   the footer's label opening it up there - was not chosen because the PDF puts the pair in the
   footer and `Help & shortcuts` already opens there. Say if the header's click should open in place.
6. **The status zone's dot colour by device tone**: the action colour for a confirmed state, full ink
   for the six uncertain and failure titles, quiet for idle and busy. The PDF draws one grey dot
   before _Draft saved locally_; the tone rule is HANGAR's reading of section 9's "never one generic
   indicator". Keep the three tones, or the PDF's one?

## From 13-13: My configs, export and import - the rows, and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-13 (PDF page 4 at `/my-configs/`; export and import through
`src/lib/store/transfer.ts`). Every visible string the PDF draws is taken verbatim and is **not**
ledgered: `YOUR PERSONAL CONFIGURATION LIBRARY`, _Pick up where you left off._, _Saved variations and
custom surfaces. Every idea has a place._, `Import config`, `New surface`, `CONTINUE EDITING`,
`Resume draft`, `Draft · {type} · Last edited {edited}`, `SEARCH MY CONFIGURATIONS`, _Search saved
configurations…_ (the placeholder), `SORT BY`, `Last edited`, _{n} saved configurations_,
`CONFIGURATION` / `TYPE` / `LAST EDITED` / `STATUS`, `ZONA · Personal configuration`, `Custom
surface`, `Today, 10:42` / `Yesterday` / `8 Sep 2026`, `Saved`, `Draft`, `Open`, `YOUR LIBRARY`,
`All saved`, `Drafts`, `Favorites`, `Recently used`, `MY CONFIGS / YOUR LIBRARY` and _Your
configurations, ready for the next session._ in the context bar; section 16's _No configurations
found. Try a different search or clear your filters._ is reused verbatim for the search miss. The
rows below are what HANGAR had to write.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `TITLE` | `src/routes/my-configs/+page.svelte` | landed by 13-13 for 13-18 | the document title of My configs | the section's name and the site's, as the other two pages do it | _My configs — HANGAR_ | none |
| `SORT_NAME` | same | landed by 13-13 for 13-18 | the sort select's second option | an alphabetical order beside the PDF's `Last edited`; a select with one option is not a select | _Name_ | the PDF draws `Last edited` only |
| `EMPTY_LIBRARY` | same | landed by 13-13 for 13-18 | the table with nothing in either record store | where a configuration comes from (a saved copy from the Playground, a surface from the Sandbox) and that this page keeps it | _Nothing saved yet. Save a copy from the Playground or build a surface in the Sandbox, and it will be kept here._ | none - the PDF draws a full table |
| `EMPTY_DRAFTS` | same | landed by 13-13 for 13-18 | the Drafts view with no draft | what a draft is (section 9: editable working state kept locally) | _No drafts. A draft is kept here while you're still working on it._ | none |
| `importRefused(file, reason)` | same | landed by 13-13 for 13-18 | an import that did not pass the six steps (`unreadable`) | which file, and the specific reason from `IMPORT_REASONS` | _Couldn't import {file}. {reason}_ | section 11 asks for the incompatibility shown before opening; no line |
| `importedLine(name, reason?)` | same | landed by 13-13 for 13-18 | an import that passed (`restored`, which then opens) or landed on the base configuration (`older`, which stays) | the record's name; for `older`, the reason and that it opens on the base | _Imported {name}._ / _Imported {name}. {reason}_ | none |
| `deletedLine(name)` + `UNDO` | same | landed by 13-13 for 13-18 | a record deleted, held for the session (D-22 fork B) | the name, and that one click puts it back | _Deleted {name}._ / _Undo_ | section 11: "deletion with undo where practical"; no words |
| `restoredLine(name)` | same | landed by 13-13 for 13-18 | the Undo done | the name is back | _{name} is back._ | none |
| `STORE_REFUSED` | same | landed by 13-13 for 13-18 | a write the browser store refused (private window, quota) | the change was not kept and why, plainly | _Your browser refused to store the change._ | none |
| `IMPORT_REASONS.notJson` | `src/lib/store/transfer.ts` | landed by 13-13 for 13-18 | step 1: the text does not parse | not JSON, so not an export | _This file isn't JSON, so it can't be a HANGAR export._ | none |
| `IMPORT_REASONS.notHangar` | same | landed by 13-13 for 13-18 | step 1: `app` is not `hangar` | the file is somebody else's | _This file wasn't exported by HANGAR._ | none |
| `IMPORT_REASONS.schemaUnknown(schema)` | same | landed by 13-13 for 13-18 | step 1: a `schema` this build does not read | the file is newer than this build, and which format this build reads | _This file was made by a newer HANGAR (format {schema}). This version reads format 1._ | none |
| `IMPORT_REASONS.schemaOlder(schema)` | same | landed by 13-13 for 13-18 | step 2: an older readable `schema` (no such version exists today; the door for the first `.v2`) | the file is older and lands on the base configuration | _This file was made by an earlier HANGAR (format {schema}). It opens on the base configuration._ | SHARE-03's own words for the stamp's `older` |
| `IMPORT_REASONS.kindUnknown` | same | landed by 13-13 for 13-18 | step 3: `kind` is neither playground nor sandbox | the file holds neither of the two things this build stores | _This file doesn't hold a configuration or a surface._ | none |
| `IMPORT_REASONS.recordMalformed` | same | landed by 13-13 for 13-18 | step 3: the record fails `isStoredRecord`, disagrees with the envelope's kind, or a playground file has no rack | the record is not whole | _The configuration inside this file is incomplete._ | none |
| `IMPORT_REASONS.entryGone(source)` | same | landed by 13-13 for 13-18 | step 4: the source entry is no longer in the catalog | which entry, and that it is gone from the Playground | _The Playground configuration this file was made from, {source}, isn't in the Playground any more._ | none |
| `IMPORT_REASONS.knobCount(name, filed, now)` | same | landed by 13-13 for 13-18 | step 4: the file's rack has a different number of knobs (`older`) | how many the file set, how many the entry has now, and that it opens on the base | _This file sets {filed} knobs and {name} now has {now}. It opens on the base configuration._ | SHARE-03's `older` |
| `IMPORT_REASONS.rackChanged(name, knob)` | same | landed by 13-13 for 13-18 | step 4: a knob was renamed or resized since the export (`older`) | which knob, and that it opens on the base | _The {knob} knob of {name} has changed since this file was made. It opens on the base configuration._ | SHARE-03's `older` |
| `IMPORT_REASONS.knobRange(knob, index, count)` | same | landed by 13-13 for 13-18 | step 4: the rack agrees and an index is still past its list - a file edited by hand (`unreadable`) | which knob, how many positions it has, which position was asked for | _{knob} has {count} positions and this file asks for position {index + 1}._ | none |
| `IMPORT_REASONS.tooMany(count)` | same | landed by 13-13 for 13-18 | step 5: more regions than the cap | the count and the cap (D-14 Q4: sixteen) | _This surface has {count} elements. A surface holds at most 16._ | none - 13-14 ledgers the Sandbox's own cap message; the two should be one sentence at 13-18 |
| `IMPORT_REASONS.offSurface(region)` | same | landed by 13-13 for 13-18 | step 5: a region outside the 9 x 9 | which region | _{region} lies outside the 9 × 9 surface._ | none - 13-14 ledgers the Sandbox's off-surface message; the two should be one sentence at 13-18 |
| `IMPORT_REASONS.overlap(a, b)` | same | landed by 13-13 for 13-18 | step 5: two regions sharing a cell | both names | _{a} overlaps {b}._ | section 16: _This region overlaps Filter. Choose another area or resize it._ - the import has no region on screen to resize, so the second clause is dropped |
| `RENAME` / `EXPORT` / `DELETE` and their accessible names | `src/lib/ui/library/LibraryTable.svelte` | landed by 13-13 for 13-18 | the three quiet row actions beyond the PDF's `Open` | section 11's named copies, export and deletion, each named with the record | _Rename_ / _Export_ / _Delete_; _Rename {name}_, _Export {name} as a file_, _Delete {name}_ | the PDF's row draws `Open` only; section 11 requires the three |
| `HEAD_ACTIONS` | same | landed by 13-13 for 13-18 | the fifth column's screen-reader-only head | what the column holds | _Actions_ | none |
| `typeLabel("playground")`'s fallback | `src/lib/ui/library/words.ts` | landed by 13-13 for 13-18 | the TYPE column for a Playground record whose entry has left the catalog | the kind, plainly, when no category can be derived | _Playground_ | the PDF shows categories only |
| `editedInWords`'s `earlier` | same | landed by 13-13 for 13-18 | an unreadable `editedAt` | the same word `relativeTime` uses, never `Invalid Date` | _earlier_ | none |
| `countLine(1)` | same | landed by 13-13 for 13-18 | one record | the PDF's line in the singular | _1 saved configuration_ | the PDF draws the plural only |

Questions for the user, from 13-13 (D-01):

1. **Favorites and Recently used on page 4 are links to the gallery, not filters over this table.**
   Both lists are catalog entries and this table is personal configurations, so a filter would show
   a count the table cannot match. But the gallery cannot arrive WITH the view selected (13-08 keeps
   the library view out of the address), so the row lands on All configs and asks for one more
   click. Accept, or add a session handoff (a sessionStorage key the gallery reads once on arrival,
   the way the browse-return record works) so the row lands on the view it names?
2. **Thumbnails of preset-backed variations render the base configuration.** A hand-authored (Lua)
   entry's engine takes the record's knob indices and shows the variation as saved; a preset entry's
   knobs move a PadState through the compiler, and this page does not compile. Accept, or compile per
   row (the workspace's tuner, once per thumbnail)?
3. **A sandbox record's thumbnail is unlit** until 13-15's surface engine exists (the frame and the
   dot field are drawn; no engine is registered). Named as a known stub; say if a static paint of
   the regions' colours should stand in until then.
4. **A `restored` Playground import opens the workspace at once**; an `older` import stays on My
   configs with its explanation and a row at the base; a sandbox import stays (its route is 13-16's).
   Section 11 says "before opening"; if the import should never navigate, one branch.
5. **The Playground workspace writes no draft and reads none.** The drafts store, the resume banner
   and the `Draft` chip are wired here and read whatever is in the store; 13-16 writes Sandbox
   drafts; no plan in the phase writes a Playground draft on a knob turn or reads one on arrival (the
   workspace reads the stamp hash and nothing else, 13-09). Until a plan does, the banner and the
   Drafts count are honest and empty for the Playground. Which plan owns that wiring?
6. **`Open` and `Resume draft` reach the workspace through the stamp** (`/playground/{source}/#z.…`
   encoded from the record's indices), because that is the one way the workspace takes a knob
   vector today. A draft therefore resumes at its positions but the workspace does not know it is a
   draft. Fine for one wave, or should the workspace read `?draft=` / the store?
7. **Two extra sort options were not added** (`Name` was, `Type` was not). Say if the sort should
   carry `Type` too.
8. **The rename field commits on blur.** Clicking `Delete` on the same row while renaming commits the
   rename first. Accept, or commit on Enter only?

### 13-13, task 3: the collections' rows (D-22 "many session bare no")

The PDF's two strings are verbatim and not ledgered: `COLLECTIONS` (the section title) and `+ New
collection` (the last row, and the whole empty state - fork C). `Live set` and `Studio experiments`
are the mockup's DATA, not strings; nothing is pre-named (fork C). The rows below are HANGAR's.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `COLLECTION_NAME` | `src/routes/my-configs/+page.svelte` | landed by 13-13 for 13-18 | the `+ New collection` form's one field | what goes in it | _Collection name_ | none |
| `CREATE` / `CANCEL` | same | landed by 13-13 for 13-18 | the form's two buttons | verbs, plainly (D-05) | _Create_ / _Cancel_ | none |
| `RENAME_COLLECTION` and `renameCollectionName(name)` | same | landed by 13-13 for 13-18 | the selected collection's inline rename | which collection | _Rename_; accessible name _Rename {name}_ | none |
| `DELETE_COLLECTION` and `deleteCollectionName(name)` | same | landed by 13-13 for 13-18 | the selected collection's one destructive control; undoable for the session (fork B) | that it is the COLLECTION being deleted and not its members, by name | _Delete collection_; accessible name _Delete the collection {name}_ | section 11: "deletion with undo where practical" |
| `emptyCollection(name)` | same | landed by 13-13 for 13-18 | a selected collection with no members | which collection, and where to file something from | _Nothing in {name} yet. Add a configuration from All saved._ | none |
| `deletedLine(name)` / `restoredLine(name)` reused | same | landed by 13-13 for 13-18 | a collection deleted and undone: the same two lines the records use | one register for one action | _Deleted {name}._ / _{name} is back._ | none |
| `ADD_TO_COLLECTION` and `fileName(name)` | `src/lib/ui/library/LibraryTable.svelte` | landed by 13-13 for 13-18 | the per-row select's placeholder option; offered only when a collection exists that the record is not yet in (fork A: it may be in others) | the action, and the record | _Add to collection_; accessible name _Add {name} to a collection_ | none |
| `REMOVE` and `removeName(name, collection)` | same | landed by 13-13 for 13-18 | the per-row action inside a collection's view | that the record leaves THIS collection and nothing else - the record stays saved | _Remove_; accessible name _Remove {name} from {collection}_ | none |

Questions for the user, from 13-13 task 3 (D-01):

9. **Delete a record deletes it from every collection (fork A's reconciliation) and the undo puts
   the memberships back too.** The undo vector carries `memberOf`; a record restored by Undo is
   filed exactly as it was. Accept, or should Undo restore the record unfiled?
10. **Two collections may share a name** (ids are distinct; the PDF's rows are names). Accept, or
    refuse a duplicate name at Create and Rename?
11. **The record undo and the collection undo share one slot** - the last deletion, whichever it
    was. A second delete replaces the first's vector. Accept, or a stack for the session?
12. **`Add to collection` is a native select with a placeholder option** rather than a menu, so it
    is one control per row and needs no popover. The PDF's row has no such control. Accept the
    shape, or ask for a checklist in the collection head instead?

## From 13-12: the page target's rows, and the questions D-01 sends to the batch

Added 2026-09-11 by plan 13-12 (the destination zone: the `Target` select, `Apply to ZONA`, the
destination review, the switching and unverified lines; PUT BACK's page-naming line; the probe's
discard). **Taken verbatim and not ledgered:** `Target` and `Apply to ZONA` (PDF pages 3 and 5), the
PDF's `Page 1` shape for a page's name, section 16's _Replace the configuration on ZONA · Page 2?_ as
the review's title (with the requested page), and 13-CONTEXT D-06's own sentence _Switch your ZONA to
Page 3? It will stop playing Page 1._ as the review's line (with the two pages the store holds). The
rows below are what HANGAR had to write, all in D-05's register, all landed so no state is blank.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `unverifiedLine(requested, lastReported)` | `src/lib/device/page-target.ts` (rendered by the workspace route's destination snippet) | landed by 13-12 for 13-18 | the page target's `unverified` state: the switch was sent and the module's report carrying the requested page did not arrive inside six heartbeats | plain about state, never coy (D-05): which page was asked for, which the module last reported, and that nothing was applied - NOT switched, NOT failed, unknown; Apply stays disabled until a report or a reconnect, or the visitor's own `Keep this page` | _Your ZONA hasn’t confirmed Page 3. It last reported Page 1, and nothing was applied._ (and, if the module never reported at all, _Your ZONA hasn’t confirmed Page 3. Nothing was applied._) | section 16's _The device stopped responding. Your draft is safe; device state could not be verified._ is the register; the state is a different one (a switch, not a transfer) and names both pages |
| `switchingLine(to)` | `src/lib/device/page-target.ts` (the destination snippet) | landed by 13-12 for 13-18 | the page target's `switching` state: the heartbeat and the switch have left, the report is awaited | the action in progress, in section 9's own shape for a transfer in progress | _Switching to Page 3…_ | section 9's _Applying to Page N…_ / _Storing on Page N…_ shape, for a third action the spec's table has no row for |
| `putBackPageLine(page)` and `putBackPageLineAfterKeep(page)` | `src/lib/device/page-target.ts` (rendered by `src/lib/ui/PutBack.svelte` as two more sizing twins) | landed by 13-12 for 13-18 | the line under PUT BACK while a snapshot is in hand - D-06's fourth clause: PUT BACK names the page it will restore BEFORE it acts | the page the snapshot holds (the active page, since the store re-snapshots on a page change) and the same facts Phase 10's two page-less lines carried: back to what it was playing when you connected; after a keep, stored too | _Puts Page 2 back to what it was playing when you connected._ / _Puts Page 2 back to what it was playing when you connected, and stores it so it stays._ | none - section 16 has no restore line (13-01 seeded `RESTORED_CAPTION` for the same gap) |
| `SWITCH_PAGE_LABEL` | `src/lib/device/install-copy.ts` (the fifth entry of `WRITE_CLICKS`; rendered by `src/lib/ui/DestinationReview.svelte`) | landed by 13-12 for 13-18 | the destination review's affirmative - the one click that moves the module's active page, a write for SAFE-01's purpose | a verb, plainly (D-05); in D-05's register rather than Phase 10's uppercase because the review sits in the Bible's bar beside `Apply to ZONA` - `install-copy.spec.ts` exempts it from the uppercase rule BY NAME with this reason; 13-18 decides whether the other nine follow | _Switch page_ | none |
| `KEEP_PAGE_LABEL` | `src/lib/device/install-copy.ts` (rendered by `DestinationReview.svelte`) | landed by 13-12 for 13-18 | the review's negative: the target is the module's page again; nothing is sent | that it undoes the request and keeps what the module is on; exempted from the uppercase rule as the affirmative is | _Keep this page_ | none |
| `DISCARD_LABEL` | `src/lib/device/page-target.ts` (rendered by NO public control; the probe `/dev/install/` carries its own dev label until runbook row I) | landed by 13-12 for 13-18, **conditional on the bench** | the firmware-native revert (PAGEDISCARD): reload the active page from flash, no snapshot needed - section 9's D03 row, _Revert device preview if supported_ | the action and its result together (D-05): RAM goes back to what is stored; a public control ships only if runbook row I confirms the module honours the class | _Revert to what’s stored_ | section 9's D03 names the action; section 16 has no line |
| `· on ZONA` (the select's marker on the reported page's option) | the workspace route's destination snippet | landed by 13-12 for 13-18 | the option of the `Target` select that is the page the module reports | which of the listed pages the module is ON, so the list is never four equal choices | _Page 2 · on ZONA_ | the PDF's `Page 1` with section 16's middle dot (as in _Stored on ZONA · Page 2_) |
| the review's detail line | `DestinationReview.svelte` | landed by 13-12 for 13-18 | the review's third line, under D-06's sentence | section 9's "device identity, page, configuration name": the ZONA and its firmware, and which configuration will be applied to the destination | _ZONA · fw 1.5.5 · Arc will be applied to Page 3_ | section 9 names the four facts; no line |

Questions for the user, from 13-12 (D-01):

1. **Page numbers as the module reports them, or one-based?** The select, the review, the switching
   and unverified lines and PUT BACK's line all say `Page 2` for the page the module reports as 2 -
   the header's control (`ZONA · fw 1.5.5 · page 2`) and 13-11's destination label already did, and
   the firmware's own `page_activepage` starts at 0 (`grid_ui.c:76`). So a four-page module offers
   `Page 0` to `Page 3`. **Grid Editor shows 1 to 4 over the same wire values** - its page selector
   is four options `{ title: 1, value: 0 }` to `{ title: 4, value: 3 }`
   (`../grid-editor/src/renderer/main/panels/configuration/components/Pages.svelte:9-14`, read, not
   edited) - so under D-19 the Editor's numbering is the reference and HANGAR's raw numbers are a
   HANGAR-invented difference, but the header's control (Phase 6) and 13-11's label already show
   the raw number and a change here alone would make the bar and the header disagree by one. Not
   decided here (D-01): **should HANGAR show 1 to 4 everywhere (a display offset in one place, the
   wire unchanged), or 0 to 3 as the module reports?** One constant (`pageName`) plus the header's
   identity line changes it everywhere.
2. **`unverified` has a third way out - the visitor's own click.** 13-12-PLAN.md says the only way
   out of `unverified` is a report or a reconnect. The module heartbeats four times a second, so on
   a live link "no report" means the module went quiet; if it comes back reporting the OLD page, the
   line stays (the switch is still unconfirmed and the line says so) until the visitor chooses
   `Keep this page` (the target snaps to the module's page) or asks again. Without that a live
   module that silently refused a switch would leave Apply disabled with no way back but the cable.
   **Keep the click as a way out, or make the line clear itself on the module's next report of ANY
   page?**
3. **Section 9's skip clause is declined**, with the reason in `DestinationReview.svelte`'s header
   (nothing configures "safe and clearly configured", and the review is the one gate between a web
   page and the ZONA changing what it plays). D-19 flags the review as the one place the Bible is
   stricter than the Editor and says the user can strike it in one word. **Strike, keep, or a
   setting later?**
4. **The review is not modal and does not trap focus.** The plan assumed 13-11's shared focus-trap
   helper; there is none, and KeepConfirm's header and `device-ui.spec.ts` test 8 rule every
   confirmation on this site never modal. The review moves focus in on open and the route returns
   it to the select on close. **Accept the tree's rule for this control too, or should the ONE
   confirmation that moves hardware be a real dialog (role, aria-modal, trap)?**
5. **The review opens INSIDE the context bar, under the select, and the bar grows to hold it** (no
   floating layer, no position: absolute - the tree's rule for the re-homed chrome). The surface
   below moves down by the review's height while it is open. **Accept, or anchor it as a popover?**
6. **`Apply to ZONA` in the bar duplicates `TRY ON DEVICE` under the surface for one wave.** Both
   are `install.tryOnDevice()` and both disable on the same store condition. PUT BACK, KEEP ON
   DEVICE, CLEAR and the install blocks have no home in the PDF's page 5, and 13-11's question 1
   (Reset under Device actions) is still open, so the column stays and the primary reads twice.
   **Which plan moves or removes the column - 13-18 with the words, or 13-20?**
7. **The discard ships as a descriptor and a probe-only action, not as a control.** D-06 says
   "shipped if the bench confirms it"; the research supports it from source. **If row I confirms
   it, where does the control go - under Device actions beside Reset (section 9's D03 row), or
   beside PUT BACK?**

## From 13-14: the Sandbox's geometry strings

Landed in `src/lib/sandbox/geometry.ts` as `GEOMETRY_COPY` and `overlapLine`. The overlap line is
§16's row **verbatim** (_This region overlaps Filter. Choose another area or resize it._, with the
other region's name in Filter's place) and is **not** ledgered. The three below are HANGAR's, in
D-05's register. 13-13's `IMPORT_REASONS.offSurface` / `tooMany` carry the same two facts on the
import side; 13-13's SUMMARY asks that each pair become one sentence at 13-18, and these rows are
the Sandbox-side half of that pair.

| Symbol | Module | Plan | The state it names | The fact it must carry | Proposed string | Bible line? |
| --- | --- | --- | --- | --- | --- | --- |
| `GEOMETRY_COPY.offSurface(field)` | `src/lib/sandbox/geometry.ts` (rendered inline at the inspector's Geometry field by 13-16) | landed by 13-14 for 13-18 | rule 1: a column, row, width or height that puts the region past the 9 × 9; the previous valid value stays on screen (rule 5) | which of the four fields to change, and that the surface is 9 × 9 - never "invalid" | _This region doesn’t fit on the surface. A smaller width keeps it inside the 9 × 9._ (the second sentence's subject is the field: _A smaller column_ / _row_ / _width_ / _height_) | none - §16 has the overlap line only; 13-13's import-side twin is _{region} lies outside the 9 × 9 surface._ |
| `GEOMETRY_COPY.adjacency(a, b)` | same (a warning at both regions, 13-16) | landed by 13-14 for 13-18 | rule 6: two regions share an edge with no cell between them - a WARNING, never a block | both names; that a press on the seam is a coin flip (Probe A Q2's one-unit boundary; a contact keeps the region it landed in, so the flip happens once, at the press); no instruction, because the surface is valid as drawn | _Filter and Space touch with no gap between them. A press on the shared edge could land on either._ | none |
| `GEOMETRY_COPY.cap(cap)` | same (the palette and Duplicate at the cap, 13-16) | landed by 13-14 for 13-18 | the seventeenth region (D-14 Q4: sixteen with the live budget meter) | the count and that it is a page's most, and the way forward | _This surface holds 16 elements, the most a page can carry. Remove one to add another._ | none - 13-13's import-side twin is _This surface has {count} elements. A surface holds at most 16._ |
| `GEOMETRY_COPY.tooSmall(kind, w, h)` - **PLACEHOLDER, 13-15's to replace** | same | landed by 13-14 as a placeholder; **13-15 derives the Knob's minimum from the dead-zone arithmetic and ledgers the refusal that names it** | rule 3: a region smaller than its kind's minimum (today only the Knob, 3 × 3 provisional) | the kind and the minimum; 13-15's row will carry WHY (the centre dead zone) | _A knob needs at least 3 × 3 cells._ | none |

Questions for the user, from 13-14 (D-01):

1. **The adjacency warning has no instruction.** The surface is valid as drawn, so the line states
   the fact and stops. Should it suggest the gap (_Leave a cell between them._) even though the
   Bible's register names the action only where there is one to take?
2. **The `Surface` shape carries no `schema` of its own** - the record that carries it does (13-13's
   envelope rule; `schema.ts`'s header says why). 13-14-PLAN.md's interfaces block drew `schema: 1`
   on the Surface. Keep the tree's one-place rule, or add the second field?
