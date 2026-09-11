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

**A count the plan got wrong, recorded rather than reconciled:** 13-01-PLAN.md seeds "seven" and
names **eight** symbols — `RESTORED_CAPTION`, `SAFE_NOTE`'s successor, and the six titles §16's single
"Unknown transfer result" row would collapse. All eight are seeded; the six are the ones §16 offers one
line for, and the two others have no §16 line at all.

## Questions for the user, recorded rather than answered (D-01)

None from 13-01: this plan authored no string a visitor can read. Its test failure messages, its
`app.css` comment and its docs paragraph are contributor-facing and are written in the register anyway.
