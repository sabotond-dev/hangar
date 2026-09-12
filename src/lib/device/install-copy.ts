// Every word the install flow says, once, before any component exists to
// render it.
//
// THIS MODULE IMPORTS NOTHING. Zero specifiers, `import type` included, for the
// reason src/lib/device/session-copy.ts and src/lib/tune/copy.ts give: Phase 4's
// chunk guard matches specifier TEXT (src/lib/config-shape.spec.ts test 13)
// rather than a resolved graph, and the header's device disclosure - which
// paints on the first frame of `/` - names this module for its snapshot line.
// So it is free of the compiler, the protocol, the transport and the session
// entirely. Anything it would otherwise have imported arrives as an argument: a
// firmware record, a page number, the configuration's name, the already
// capitalised event words, the sorted list of other modules on the cable, and
// the label of whichever control is on the screen. The one type it shares with
// session-copy.ts - the block shape - is declared here again rather than
// imported, because a type import is still a specifier.
//
// EVERY SENTENCE IS ONE LITERAL, NEVER A CONCATENATION. Prettier reflows text
// inside Svelte markup and Phase 2 lost a load-bearing sentence to exactly that
// (02-05-SUMMARY.md), so visitor-facing copy is a named constant and the
// markup only interpolates it.
//
// THE REGISTER IS THE BIBLE'S (13-CONTEXT D-05), AND THE WORDS ARE THE USER'S
// (D-23). Every string here is one of three things, and install-copy.spec.ts
// test 2 checks which by reading the documents from disk:
//
//  - a line the design specification's section 16 or its state table (section
//    9) gives, taken VERBATIM - `Apply to ZONA`, `Store on ZONA`, `Applying to
//    Page 2…`, `Storing on Page 2…`, `Applied to Page 2. Store on ZONA to keep
//    it after power-off.`, `Stored on ZONA · Page 2`, `ZONA connected`;
//  - ONE WORD THE USER GAVE at the fourth bench (13.1-05, 13.1-CONTEXT D-04):
//    the header's `Clear`, in D-05's case, ledgered in 13.1-COPY-NEW.md;
//  - a line the specification never wrote, PROPOSED in 13-18-BATCH.md with the
//    state it names and the fact it must carry, and APPROVED as written by
//    D-23 - everything else in this file; or
//  - a sentence assembled from those, by a builder that takes a page, a name
//    or a label and interpolates it raw.
//
// The register, as rules: sentence case, short, second person; the action and
// its result in one line; plain about state, never coy; real apostrophes
// (U+2019), a real ellipsis (U+2026), a real em dash (U+2014); no exclamation
// marks; no emoji; no uppercase paragraphs; never "Error", never "loading"; no
// browser engine named anywhere; and NO CONTROL LABEL PARAPHRASED IN PROSE - a
// sentence that tells the visitor to click something names the control exactly
// as the control reads, which is why every step below interpolates the label
// constant rather than retyping it, and why the six disabled reasons say
// `Apply to ZONA` and never "try it on".
//
// THE FOUR FACTS PHASE 10'S WORDS CARRIED SURVIVE IN THESE (D-05), AND A FIFTH
// FROM PHASE 12.1. Traced old to new in 13-18-SUMMARY.md and 13-18-BATCH.md
// section C:
//
//  1. RAM against flash - `Apply to ZONA` writes memory and a power cycle
//     undoes it; `Store on ZONA` writes flash and survives one. honestyReady,
//     settledCaption, settledBody, keepLineEnabled, keptBody.
//  2. The snapshot - a copy of the page is taken before anything is written.
//     HONESTY_SNAPSHOTTING, SNAPSHOTTING_CAPTION, liveSnapshotSaved,
//     snapshotFailedBlock; and, for the probe alone since 13.1-06,
//     restoredCaption and liveRestored (the restore has no control on the
//     site - see the retirement below).
//  3. The firmware default - `Clear` (the header's control since 13.1-05)
//     writes the module's own default AND STORES IT (round 4c, 2026-09-12,
//     the user's word: "it should be like Store but with Clear!") and the
//     browser draft survives, and since 13.1-06 it is THE WAY BACK every
//     step names. clearLine, clearingLabel, clearedCaption, liveCleared,
//     stepOrClear, CONFIRM_WAY_BACK, FIRMWARE_DEFAULT_NAME.
//  4. Nothing is written without a click - session-copy.ts's SAFE_NOTE; here,
//     every write is a named click and every step names one.
//  5. A store carries the page's own scripts - five strings on the wire since
//     13-17 (the system timer, the page init, the utility script, the touch
//     Timer and the touch Setup, in that order). confirmReplaces,
//     snapshottingBody, identifiedBody and the four partial rows.
//
// PAGES ARE NUMBERED FROM ONE (D-23, batch row I.3.1). The module reports its
// active page as 0 to 3 on the wire (`page_activepage`, grid_ui.c); Grid
// Editor shows those as 1 to 4 (Pages.svelte, `{ title: 1, value: 0 }`), and
// under D-19 the Editor's numbering is the reference. Every builder here takes
// the WIRE number and formats it through pageName, so the offset is applied
// where the word "Page" is written and nowhere else. page-target.ts and
// session-copy.ts carry the same one-line function, because none of the three
// may import the others; page-target.spec.ts, session-copy.spec.ts and
// install-copy.spec.ts each pin wire 0 to `Page 1`.
//
// THE HONESTY CAPS ARE RETIRED BY NAME, 2026-09-12 (13-18, D-05). HONESTY_CAP
// (86), PUT_BACK_CAP (129), KEEP_CAP (86) and CLEAR_CAP (86) were measured
// maximum lengths per string - `lines x CH_PER_LINE`, with CH_PER_LINE the 43
// characters plan 10-01 measured as the minimum occupancy of one Body line box
// in the install column's 372px content column - so that a caption could not
// outgrow the cell Phase 10's layout reserved for it, and so that a cap was a
// promise about strings not yet written rather than a description of the ones
// that existed. install-copy.spec.ts test 3 held all four by name, and
// tune/copy.ts's tryOnBudgetReason was held to HONESTY_CAP from outside. What
// superseded them: D-05 changed the register (sentence case, second person,
// the Bible's own lines verbatim, several of them longer than 86), and the
// layout the caps were measured against no longer exists - the install column
// is being re-homed into the Bible's context bar and Device actions panel
// (13-11, 13-12, 13-20), whose regions are proportional (13-CONTEXT D-14 Q9,
// D-21) rather than pixel-reserved. A string's fit is now the Bible's geometry
// and a component's own sizing twin, not a number in this file. The four
// constants are gone rather than left at a value nothing checks; the OTHER
// rules those caps travelled with - the punctuation, the register, the
// no-paraphrase rule, Z-08's one "about a second", A-48's three stems -
// carry over and are asserted over every export in install-copy.spec.ts.
//
// THE REVIEW'S TWO LABELS ARE RETIRED BY NAME, 2026-09-12 (13.1-02,
// 13.1-CONTEXT D-05; ledgered in 13.1-COPY-NEW.md). SWITCH_PAGE_LABEL
// (`Switch page`) and KEEP_PAGE_LABEL (`Keep this page`) were the
// destination review's affirmative and negative (13-12; batch row I.3.8),
// the affirmative being the fifth entry of WRITE_CLICKS. The user struck the
// review at the fourth bench ("Page switch doesnt need a confirmation
// window. When you change page form the drop down just change the page and
// thats it."); DestinationReview.svelte is deleted with them, the Target
// select's change is the fifth write click (TARGET_CLICK below), and the
// way back from an unverified switch is the select itself - choosing the
// page the module reports is a cancel - so no negative is needed.
//
// SECTION 9'S RESET LABEL IS RETIRED BY NAME, 2026-09-12 (13.1-05,
// 13.1-CONTEXT D-04; ledgered in 13.1-COPY-NEW.md). CLEAR_LABEL read section
// 9's `Reset active device page` from 13-18 (D-23) to 13.1-05, on the quiet
// control at the foot of the workspace's install column. The user asked for
// the control by its own word at the fourth bench ("CLEAR button. we need a
// CLEAR button it should live all the time in the top right corner next to
// ZONA connected."), so the control moved into the header's connection zone
// beside `ZONA connected` and CLEAR_LABEL became `Clear` - the user's word
// in D-05's case, one that fits the PDF's 218 x 37 box where section 9's
// four words do not. The fact section 9's label carried - the firmware
// default, the browser draft untouched - is clearLine's, which is the
// control's accessible description and did not change. The label is not a
// stem the register forbids (A-48 scans `clears`, `empt` and `remove`;
// the word `Clear` is none of them) and the line beneath it still says
// what the click restores. Section 9's row stands in the Bible as text;
// install-copy.spec.ts asserts the old words are exported by nothing.
//
// PUT BACK'S STRINGS ARE RETIRED BY NAME, 2026-09-12 (13.1-06, 13.1-CONTEXT
// D-06 and D-07; ledgered in 13.1-COPY-NEW.md). The user removed the install
// column under the workspace's surface and Put back with it at the fourth
// bench ("we dont even need the Put back function that totally unnecessary
// if we have a clear button", and "remove" when asked), so the control is
// on no screen: PUT_BACK_LABEL (`Put back`, batch row I.3.2) and
// puttingBackLabel (`Putting Page 2 back…`, I.3.3) - the second and the
// progress label of Phase 10's four - are gone from the exports, and
// WRITE_CLICKS is FOUR. STEP_OR_PUT_BACK (`Or click Put back to restore
// what was there when you connected`, I.5.8), the step four blocks shared,
// is replaced by stepOrClear below, because a step must name a control that
// exists and the way back that exists is the header's Clear to the firmware
// default. Every other sentence that offered Put back as the way back is
// rewritten the same way and ledgered: CONFIRM_WAY_BACK (I.5.10),
// lostBlock's third step (I.5.12), KEEP_REASONS["after-partial"] (I.6.2),
// nothingLandedBlock("try")'s detail (I.5.5), and HONESTY_SNAPSHOTTING
// (I.4.3, which promised the copy could be put back). The snapshot itself
// is not retired - it is taken at connect before any write as before
// (SAFE-03), and the store's putBack() with the `restoring` and `restored`
// phases stays for the /dev/install/ probe's own button, so restoredCaption
// (`Page 2 put back`, I.4.13, reworded without the label) and
// RESTORED_UNCONFIRMED_TITLE (I.5.6) keep the machinery's own words: the
// bar's clause would read them from the probe alone. PUT_BACK_NEEDS_ZONA is
// NEEDS_ZONA - the same sentence, the header's Clear reason for no session
// (CLEAR_REASONS["no-session"] reads it). SNAPSHOT_FAILED_TITLE reads
// `Nothing copied yet` (was `Nothing to put back yet`, I.5.7): the fact is
// the copy, not the control. The consequence, plainly: after an Apply the
// way back to the module's own page is Grid Editor or a Clear to the
// firmware default; HANGAR no longer offers to put the module's own
// configuration back.
//
// THE INSTALL BLOCK'S SIX SUCCESS BODIES ARE RETIRED BY NAME, 2026-09-12
// (13.1-06, D-06; 13.1-PLAN-CHECK W-10; ledgered). InstallState.svelte was
// their one reader and is deleted with the column; the bar's device clause
// (device-clause.ts) carries every success caption already, so the facts
// they carried survive in the captions and in confirmReplaces, and nothing
// dead is left exported (D-12's rule): snapshottingBody (I.4.6),
// identifiedBody (I.4.7), settledBody (I.4.10), keptBody (I.4.11),
// restoredBody (I.4.14), KEPT_PROOF_LINE (I.4.15's proof line), clearedBody
// (I.4.17) and RESTORED_STORED_LINE (I.4.15, the line under the restore's
// body after a store). STILL_WRITING_LINE (I.4.9) is NOT retired: it is
// SAFE-08's visible half and DestinationZone.svelte renders it beneath the
// bar's row while the store's slow flag is set.
//
// THREE RULES A READER WOULD REVERSE, WRITTEN DOWN:
//
//  - THE SIX STORE ON ZONA REASONS ARE A CLOSED RECORD OVER A SIX-MEMBER
//    UNION, AND THE THREE RESET REASONS LIKEWISE. A seventh key in
//    KEEP_REASONS is a type error, not a lint finding. Every state row that
//    reads "present, disabled" without naming a reason uses `never-tried`.
//    13-18 reworded the members and kept the types (D-23; 13-18-PLAN.md).
//
//  - {Name} IS INTERPOLATED RAW AND NEVER RE-CASED. The catalog's names are
//    already the form the panel shows (Arc, Euclid since D-14 Q11b); a
//    toUpperCase() here would be a second opinion about a string somebody
//    else owns.
//
//  - FAILURE TITLES CARRY NO TERMINAL PUNCTUATION; announceTitle ADDS THE FULL
//    STOP. A title is a heading in the block and a sentence in the live
//    region, and the full stop belongs to the second job only. Success
//    utterances are sentences of their own and are never derived from a
//    title.
//
// SIX UNCERTAIN OUTCOMES, SIX TITLES, ON PURPOSE (D-23). Section 16 offers one
// sentence - "The device stopped responding. Your draft is safe; device state
// could not be verified." - for a write whose acknowledgement never came, a
// store that read back differently, a partial landing, nothing landing, a
// restore whose store did not confirm, and a snapshot that could not be
// taken. HANGAR measures which one happened and each has its own recovery, so
// each has its own title and its own steps; the user chose to keep them apart
// with the cost of collapsing them stated (13-18-BATCH.md section I.5).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The shapes.

/** One event, as the touch element's two scripts are named - already capitalised. */
export type EventWord = "Setup" | "Timer";

/**
 * WHAT LANDED, AND WHAT DID NOT, AS THE PARTIAL BLOCK INTERPOLATES THEM.
 *
 * Two CLOSED unions rather than one open string, because the pairings encode a
 * fact about the writer: a RAM leg writes FIVE strings sequentially, aborting
 * on the first failure - the system timer (255/6), the page init (255/0), the
 * utility script (255/4), the touch Timer (0/6), the touch Setup (0/0) - so
 * exactly four partials exist, they are the four rows below, and "the Setup
 * landed but the page init did not" is not expressible here because the
 * writer cannot produce it. `landed` is sentence-initial and capitalised;
 * `failed` sits mid-sentence and is not. Reading a row left to right is
 * reading sequence.ts's SLOTS top to bottom.
 *
 * These are LITERALS, not built from SLOTS[].label (this module imports
 * nothing and authors no grammar); the store publishes the labels separately
 * as landedSlots / failedSlots. "The utility script" is HANGAR's word for
 * 255/4 (the firmware's is the utility button's event; a catalog entry lands
 * the module's own page-next there and a surface lands its runtime), kept by
 * D-23 (batch row I.5.4).
 *
 *   The system timer                                                  | the page init, the utility script, the Timer and the Setup
 *   The system timer and the page init                                | the utility script, the Timer and the Setup
 *   The system timer, the page init and the utility script            | the Timer and the Setup
 *   The system timer, the page init, the utility script and the Timer | the Setup
 */
export type LandedWords =
  | "The system timer"
  | "The system timer and the page init"
  | "The system timer, the page init and the utility script"
  | "The system timer, the page init, the utility script and the Timer";
export type FailedWords =
  | "the page init, the utility script, the Timer and the Setup"
  | "the utility script, the Timer and the Setup"
  | "the Timer and the Setup"
  | "the Setup";

/**
 * A failure-shaped block: a title, a detail, the steps in order. The same
 * shape as session-copy.ts's SessionBlock, declared here rather than imported
 * because a type import is still a specifier (see the header).
 */
export interface InstallBlock {
  title: string;
  detail: string;
  steps: string[];
}

/** A firmware record, as the identity carries it. */
export interface Firmware {
  major: number;
  minor: number;
  patch: number;
}

// ---------------------------------------------------------------------------
// The page's name.

/**
 * The page as the visitor reads it, from the page as the module reports it:
 * wire 0 is `Page 1` (D-23, batch row I.3.1; the Editor's numbering under
 * D-19). The one place in this module the offset is applied. Duplicated by
 * name in page-target.ts and session-copy.ts, which may not import it; the
 * three specs pin the three to the same answer.
 */
export const pageName = (page: number): string => `Page ${page + 1}`;

// ---------------------------------------------------------------------------
// The labels. Verbs, plainly, in sentence case (D-05); never the wire's words.

/** Section 9's own label for the RAM write. */
export const TRY_ON_LABEL = "Apply to ZONA";
/** Section 9's progress label for the RAM write. */
export const writingLabel = (page: number): string =>
  `Applying to ${pageName(page)}…`;
/** Section 9's progress label for the flash write. */
export const keepingLabel = (page: number): string =>
  `Storing on ${pageName(page)}…`;
/** Section 9's own label for the flash write. */
export const KEEP_LABEL = "Store on ZONA";
/** The store confirmation's negative (I.4.19). */
export const NOT_NOW_LABEL = "Not now";
/** The user's own word for the firmware default (13.1-05, D-04), in D-05's case; what it does is said in clearLine, the control's description. */
export const CLEAR_LABEL = "Clear";
/**
 * Section 9's progress shape, for the reset (I.4.20) - and since round 4c
 * (2026-09-12) it names the store leg too, because the click runs both:
 * the five defaults into memory, then the same store Store on ZONA runs.
 * Batch I.4.20's `Resetting Page 2…` is superseded; ledgered in
 * 13.1-COPY-NEW.md.
 */
export const clearingLabel = (page: number): string =>
  `Resetting and storing ${pageName(page)}…`;
/**
 * THE FIFTH WRITE CLICK IS THE TARGET SELECT'S CHANGE (13.1-02; 13.1-CONTEXT
 * D-05). `Target` is page-target.ts's TARGET_LABEL - the PDF's word for the
 * select - carried here a second time as TARGET_CLICK because neither module
 * may import the other (the pageName precedent, three modules, three specs),
 * and install-copy.spec.ts pins the twin equal to TARGET_LABEL. Not a visible
 * string of this module's own: the select renders TARGET_LABEL, and this
 * constant names the control in WRITE_CLICKS so SAFE-01's count reads the
 * one click that moves the module's active page - a change on a select,
 * which is the user's gesture and a click for SAFE-01's purpose.
 */
export const TARGET_CLICK = "Target";

/**
 * THE NUMBER OF WRITE CLICKS, AS A CONSTANT RATHER THAN AS A WORD IN PROSE.
 * Five since 13-12, the fifth a control that is a SELECT since 13.1-02;
 * FOUR since 13.1-06 - Put back removed by the user's word (D-07).
 * REQUIREMENTS.md's SAFE-01 names this constant; a fifth write control is a
 * change here first.
 */
export const WRITE_CLICKS = [
  TRY_ON_LABEL,
  KEEP_LABEL,
  CLEAR_LABEL,
  TARGET_CLICK,
] as const;

// ---------------------------------------------------------------------------
// The honesty line: Apply to ZONA's accessible description, by state
// (I.4.1-I.4.4; the slot under the column's primary until 13.1-06).

/** No session yet: the click connects first. Z-08's "about a second", once of twice. */
export const HONESTY_NO_SESSION =
  "Connects to your ZONA and applies this to its active page. About a second.";
/** Ready: the first fact, RAM against flash, before the click. Z-08's second "about a second". */
export const honestyReady = (page: number): string =>
  `Applies this to ${pageName(page)} in about a second. It stays until power-off unless you store it.`;
/** While the snapshot is read: the second fact, said before it is needed (I.4.3, reworded at 13.1-06 - the copy is a safety feature, not a control). */
export const HONESTY_SNAPSHOTTING = "Reading what your ZONA holds first.";
/** On a browser that cannot write (DEGR-02): the standing line would be a lie. */
export const HONESTY_INCAPABLE =
  "This browser can’t write to a ZONA. Everything else on this page works.";

// ---------------------------------------------------------------------------
// The install phases' captions - the bar's device clause (device-clause.ts)
// since 13-11, and since 13.1-06 the ONLY rendering of the six success
// phases: their bodies retired with InstallState.svelte (the header's
// retirement paragraph). The captions are section 9's and section 16's where
// those have a line, HANGAR's where they do not.

/** While the snapshot is read (I.4.5). */
export const SNAPSHOTTING_CAPTION = "Reading your ZONA…";

/** Section 9's own label for the ready state. */
export const IDENTIFIED_CAPTION = "ZONA connected";

/** The one escape hatch of `writing`, at 2000 ms (Z-09; SAFE-08's visible half). Rendered by DestinationZone.svelte beneath the bar's row while the store's slow flag is set. */
export const STILL_WRITING_LINE =
  "Still writing. Your ZONA is taking longer than usual.";

/** Section 16's own line for a RAM apply: the first fact, after the click. */
export const settledCaption = (page: number): string =>
  `Applied to ${pageName(page)}. Store on ZONA to keep it after power-off.`;

/**
 * The restore landed (I.4.13): section 16's clause shape, with HANGAR's
 * verb - the register's own, not a control's, since PUT_BACK_LABEL retired
 * at 13.1-06. The bar reads it from the /dev/install/ probe alone: the
 * store's putBack() has no control on the site (D-07).
 */
export const restoredCaption = (page: number): string =>
  `${pageName(page)} put back`;

/** Section 16's own line for a confirmed store. Renders only after the acknowledgement AND the re-fetch proof (D-12). */
export const keptCaption = (page: number): string =>
  `Stored on ZONA · ${pageName(page)}`;

/**
 * The reset landed AND was stored: section 16's confirmation words for the
 * state it confirmed (I.4.16), with the store said since round 4c
 * (2026-09-12) - the bar's caption after a clear is spoken only after the
 * PAGESTORE acknowledgement and the re-fetch proof, as keptCaption's is
 * (D-12). Ledgered in 13.1-COPY-NEW.md.
 */
export const clearedCaption = (page: number): string =>
  `${pageName(page)} reset to its firmware default and stored`;

// ---------------------------------------------------------------------------
// The six uncertain outcomes and the lost cable: six titles, on purpose
// (D-23; section I.5 of the batch). Titles end in a letter; announceTitle
// adds the full stop.

const KEPT_MISMATCH_TITLE = "Stored, but what read back doesn’t match";
const UNCONFIRMED_TITLE = "Your ZONA didn’t confirm the store";
const RESTORED_UNCONFIRMED_TITLE = "Put back in memory, not yet stored";
const NOTHING_LANDED_TITLE = "Nothing reached your ZONA";
const PARTIAL_TITLE = "Only part of this reached your ZONA";
const LOST_TITLE = "Your ZONA was unplugged mid-write";
/** I.5.7's title, reworded at 13.1-06: the fact is the copy, not the retired control. */
const SNAPSHOT_FAILED_TITLE = "Nothing copied yet";

/**
 * The step three blocks share (I.5.8, rewritten at 13.1-06 under D-07): the
 * way back that exists is the header's Clear to the firmware default. It
 * names the control as the control reads and the page as the visitor reads
 * it. Exported so the zone's test and the ledger can read it by name.
 */
export const stepOrClear = (page: number): string =>
  `Or click ${CLEAR_LABEL} to return ${pageName(page)} to its firmware default`;

/** The store was acknowledged and the read-back differs (I.5.2). */
export function keptMismatchBlock(page: number): InstallBlock {
  return {
    title: KEPT_MISMATCH_TITLE,
    detail: `Your ZONA acknowledged the store, but reading ${pageName(page)} back gave something different. HANGAR won’t call that stored.`,
    steps: [
      `Click ${TRY_ON_LABEL}, then ${KEEP_LABEL} again`,
      stepOrClear(page),
    ],
  };
}

/** The store's acknowledgement never came inside the retry bound (I.5.1). */
export function unconfirmedBlock(name: string, page: number): InstallBlock {
  return {
    title: UNCONFIRMED_TITLE,
    detail: `${name} is still running on ${pageName(page)} in memory. No confirmation of the store came back, so HANGAR can’t say whether it survives power-off.`,
    steps: [`Click ${KEEP_LABEL} to send the store again`, stepOrClear(page)],
  };
}

/**
 * The restore's store leg did not confirm (I.5.6). REACHABLE FROM THE
 * /dev/install/ PROBE ONLY since 13.1-06: the restore has no control on the
 * site (D-07), so the step names the probe's action in the probe's words
 * rather than a click on a control that does not exist.
 */
export function restoredUnconfirmedBlock(page: number): InstallBlock {
  return {
    title: RESTORED_UNCONFIRMED_TITLE,
    detail: `Your own configuration is running on ${pageName(page)} again, in memory. The store didn’t confirm, so after power-off the version stored earlier may come back instead.`,
    steps: ["Send the restore again"],
  };
}

/**
 * None of the five landed, in its two forms (I.5.5): after an apply the
 * module's own configuration is still playing (the "nothing to put back"
 * clause went at 13.1-06 with the control); after a restore, what was
 * playing is still playing. A NACK is the signature of a silent discard
 * (docs/SKELETON-RESULTS.md). THE RESTORE FORM IS REACHABLE FROM THE
 * /dev/install/ PROBE ONLY since 13.1-06 (D-07), so its step names the
 * probe's action in the probe's words.
 */
export function nothingLandedBlock(
  after: "try" | "put-back",
  page: number,
): InstallBlock {
  const cable = "If it happens twice, check the cable is seated at both ends";
  return after === "try"
    ? {
        title: NOTHING_LANDED_TITLE,
        detail: `Nothing got through. ${pageName(page)} is unchanged, so your own configuration is still playing.`,
        steps: [`Click ${TRY_ON_LABEL} to send it again`, cable],
      }
    : {
        title: NOTHING_LANDED_TITLE,
        detail: `Nothing got through. ${pageName(page)} is unchanged, so what was playing is still playing.`,
        steps: ["Send the restore again", cable],
      };
}

/**
 * SAFE-07's named case (I.5.3): WHICH of the five landed, in write order, from
 * the two closed unions. The fifth fact rides on the pairings.
 */
export function partialBlock(
  landed: LandedWords,
  failed: FailedWords,
  page: number,
): InstallBlock {
  return {
    title: PARTIAL_TITLE,
    detail: `${landed} reached your ZONA and ${failed} didn’t. ${pageName(page)} now holds part of this configuration and part of your own.`,
    steps: [`Click ${TRY_ON_LABEL} to send all five again`, stepOrClear(page)],
  };
}

/**
 * Unplugged mid-write, in its two forms (I.5.12). "Nothing was stored" is said
 * only where it is true (Z-11): on the RAM leg. The block takes the label of
 * the surface rendering it (Y-13), so the step names a control on the screen.
 */
export function lostBlock(
  storeLeg: boolean,
  label: string,
  page: number,
): InstallBlock {
  return {
    title: LOST_TITLE,
    detail: storeLeg
      ? "The store was sent and nothing came back before your ZONA was unplugged. HANGAR can’t say what power-off brings back."
      : `Some of this may have reached ${pageName(page)} and some may not. Nothing was stored, so power-off brings your own configuration back.`,
    steps: [
      "Plug your ZONA back in",
      `Click ${label} again`,
      `Then click ${CLEAR_LABEL} if you want the firmware default back`,
    ],
  };
}

/** The snapshot could not be taken (I.5.7): nothing written, no write until a copy exists. */
export function snapshotFailedBlock(page: number): InstallBlock {
  return {
    title: SNAPSHOT_FAILED_TITLE,
    detail: `HANGAR couldn’t read what ${pageName(page)} holds, and it won’t write over something it hasn’t copied. Nothing was written.`,
    steps: [`Click ${TRY_ON_LABEL} to read it again`],
  };
}

// ---------------------------------------------------------------------------
// The store confirmation (SAFE-05, SAFE-06).

/** The confirmation's title, in section 16's review shape (I.4.18). */
export const confirmCaption = (page: number): string =>
  `Store this on ZONA · ${pageName(page)}?`;
/**
 * The one string on the site allowed to name the touch element, because
 * SAFE-05 requires exactly that; and the fifth fact - a store carries the
 * page's own init, timer and utility scripts too (12.1-08, 13-17; I.5.9).
 */
export const confirmReplaces = (page: number): string =>
  `This replaces what ${pageName(page)} holds on your ZONA — its touch element’s Setup and Timer and the page’s own init, timer and utility scripts — and it stays after power-off.`;
/** The way back beside the confirmation (I.5.10, rewritten at 13.1-06 under D-07): the header's Clear, the one that exists. */
export const CONFIRM_WAY_BACK = `${CLEAR_LABEL} still returns the page to its firmware default.`;

/**
 * The other modules on the cable, as a sentence would list them: `EN16`,
 * `EN16 and BU16`, `EN16, BU16 and PO16`. No Oxford comma.
 */
export function moduleList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * SAFE-06 in full (I.5.11): the other modules named, their pages being stored
 * stated as a fact about the protocol, and nothing when there are none.
 */
export function confirmRig(others: readonly string[]): string | undefined {
  if (others.length === 0) return undefined;
  return others.length === 1
    ? `Your ${moduleList(others)} is on the same cable. Its current page is stored too, because the store reaches every module at once.`
    : `Your ${moduleList(others)} are on the same cable. Their current pages are stored too, because the store reaches every module at once.`;
}

// ---------------------------------------------------------------------------
// The no-session sentence (I.3.4). Put back's line with no session until
// 13.1-06 (its lines WITH a session, page-target.ts's putBackPageLine pair,
// retired with the control); the header's Clear reason for no session since,
// through CLEAR_REASONS below. Written once, referenced.

/** No open session: the control is present and visibly waiting (SAFE-09's shape, on Clear). */
export const NEEDS_ZONA = "Needs your ZONA connected.";

// ---------------------------------------------------------------------------
// The Store on ZONA control: the enabled line and the six closed reasons.

/** The first fact, flash side, before the click (I.6.1). */
export const keepLineEnabled = (page: number): string =>
  `Stores this on ${pageName(page)} so it stays after power-off.`;

/**
 * The six reasons Store on ZONA can be disabled for, and no seventh. Every
 * state row that reads "present, disabled" without naming one means
 * `never-tried`.
 */
export type KeepReason =
  | "never-tried"
  | "knobs-moved"
  | "after-partial"
  | "already-kept"
  | "after-mismatch"
  | "incapable";

/** Closed over KeepReason: a seventh key is a type error (Z-05, Z-21). Each names the control it points at verbatim (I.6.2). */
export const KEEP_REASONS: Readonly<Record<KeepReason, string>> = {
  "never-tried": `${TRY_ON_LABEL} first, then store it.`,
  "knobs-moved": `The knobs moved since it was applied. ${TRY_ON_LABEL} again first.`,
  "after-partial": `Not after a partial apply. ${TRY_ON_LABEL} again, or click ${CLEAR_LABEL}.`,
  "already-kept":
    "Already stored on ZONA. Turn a knob and apply it again to store a new one.",
  "after-mismatch": `${TRY_ON_LABEL} again first, then store it again.`,
  incapable: "This browser can’t write to a ZONA.",
};

// ---------------------------------------------------------------------------
// The Clear control (the header's, since 13.1-05): one line, and the three
// reasons it can be disabled for.

/**
 * The third fact, before the click (I.6.3): section 16's confirmation words
 * for the same fact. It says RESET TO ITS FIRMWARE DEFAULT and never clears,
 * empties or removes (A-48): the control restores the firmware's own
 * configuration, and a word implying emptiness would be the same class of
 * lie as the never-writes sentence Phase 7 retired. D-21's sentence (`Reset
 * the current page to factory default`) is superseded by D-23. Since round
 * 4c (2026-09-12) it says the store too - the first fact, flash side, in
 * keepLineEnabled's own words (`so it stays after power-off`) - because a
 * description that stopped at the default would be silent about the one
 * thing the click now makes permanent. Ledgered in 13.1-COPY-NEW.md.
 */
export const clearLine = (page: number): string =>
  `Returns ${pageName(page)} to its firmware default and stores it, so it stays after power-off. Your browser draft stays as it is.`;

/**
 * What a clear leaves running in memory when its store never acknowledged
 * (round 4c, 2026-09-12): the name unconfirmedBlock reads for that one row,
 * where Store on ZONA's row reads the configuration's own name. The store
 * sets it as `name` so the zone's block says what is true - the firmware
 * default is what runs - rather than the route's entry. Ledgered in
 * 13.1-COPY-NEW.md.
 */
export const FIRMWARE_DEFAULT_NAME = "The firmware default";

/** The three reasons, closed like KeepReason. */
export type ClearReason = "no-snapshot" | "no-session" | "incapable";

/** Two of the three are REFERENCES, so a rewrite of the shared sentence moves this table with it. */
export const CLEAR_REASONS: Readonly<Record<ClearReason, string>> = {
  "no-snapshot": "Needs a copy of what is on your ZONA first.",
  "no-session": NEEDS_ZONA,
  incapable: KEEP_REASONS.incapable,
};

// ---------------------------------------------------------------------------
// The live region: five success utterances, the 2000 ms line, and every
// failure title with its full stop (I.7).

/** The snapshot landed: the second fact, spoken (I.7.1). Ends on the sentence the phase rests on. */
export const liveSnapshotSaved = (page: number): string =>
  `A copy of ${pageName(page)} is saved. Nothing has been written.`;
/** Section 16's own line, spoken (I.7.2). */
export const liveSettled = (page: number): string => settledCaption(page);
/** The restore landed, spoken (I.7.3) - from the /dev/install/ probe alone since 13.1-06. */
export const liveRestored = (page: number): string =>
  `${pageName(page)} is back to what it was when you connected.`;
/** Section 16's own line, spoken as a sentence (I.7.4). */
export const liveKept = (page: number): string => `${keptCaption(page)}.`;
/** The reset landed and was stored, spoken (I.7.5; the store since round 4c, 2026-09-12). */
export const liveCleared = (page: number): string =>
  `${pageName(page)} is reset to its firmware default and stored.`;
/** The 2000 ms line, spoken once. */
export const LIVE_STILL_WRITING = "Still writing.";

/** A failure title as the live region speaks it: the title, then the full stop. */
export function announceTitle(title: string): string {
  return `${title}.`;
}
