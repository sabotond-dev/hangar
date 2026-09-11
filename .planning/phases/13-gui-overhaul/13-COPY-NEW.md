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
