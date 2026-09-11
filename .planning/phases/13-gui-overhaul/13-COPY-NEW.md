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
