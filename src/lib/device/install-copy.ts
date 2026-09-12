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
//    9) gives, taken VERBATIM - `Apply to ZONA`, `Store on ZONA`, `Reset active
//    device page`, `Applying to Page 2…`, `Storing on Page 2…`, `Applied to
//    Page 2. Store on ZONA to keep it after power-off.`, `Stored on ZONA ·
//    Page 2`, `ZONA connected`;
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
//  2. The snapshot - a copy of the page is taken before anything is written
//     and `Put back` restores it. snapshottingBody, identifiedBody,
//     restoredCaption, restoredBody, liveSnapshotSaved.
//  3. The firmware default - `Reset active device page` writes the module's
//     own default and the browser draft survives. clearLine, clearedCaption,
//     clearedBody, liveCleared.
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
/** HANGAR's own restore, as a verb (batch row I.3.2); the line beneath it names the page. */
export const PUT_BACK_LABEL = "Put back";
/** Section 9's progress shape, for the restore (I.3.3). */
export const puttingBackLabel = (page: number): string =>
  `Putting ${pageName(page)} back…`;
/** Section 9's own label for the flash write. */
export const KEEP_LABEL = "Store on ZONA";
/** The store confirmation's negative (I.4.19). */
export const NOT_NOW_LABEL = "Not now";
/** Section 9's own label for the firmware default; what it does is said in the line beneath it. */
export const CLEAR_LABEL = "Reset active device page";
/** Section 9's progress shape, for the reset (I.4.20). */
export const clearingLabel = (page: number): string =>
  `Resetting ${pageName(page)}…`;
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
 * Five since 13-12; the fifth a control that is a SELECT since 13.1-02.
 * REQUIREMENTS.md's SAFE-01 names this constant; a sixth write control is a
 * change here first.
 */
export const WRITE_CLICKS = [
  TRY_ON_LABEL,
  PUT_BACK_LABEL,
  KEEP_LABEL,
  CLEAR_LABEL,
  TARGET_CLICK,
] as const;

// ---------------------------------------------------------------------------
// The honesty slot: the one line under Apply to ZONA, by state (I.4.1-I.4.4).

/** No session yet: the click connects first. Z-08's "about a second", once of twice. */
export const HONESTY_NO_SESSION =
  "Connects to your ZONA and applies this to its active page. About a second.";
/** Ready: the first fact, RAM against flash, before the click. Z-08's second "about a second". */
export const honestyReady = (page: number): string =>
  `Applies this to ${pageName(page)} in about a second. It stays until power-off unless you store it.`;
/** While the snapshot is read: the second fact, said before it is needed. */
export const HONESTY_SNAPSHOTTING =
  "Reading what your ZONA holds first, so anything you apply can be put back.";
/** On a browser that cannot write (DEGR-02): the standing line would be a lie. */
export const HONESTY_INCAPABLE =
  "This browser can’t write to a ZONA. Everything else on this page works.";

// ---------------------------------------------------------------------------
// The install block, state by state.

/** While the snapshot is read (I.4.5). */
export const SNAPSHOTTING_CAPTION = "Reading your ZONA…";
/** The second and fifth facts: a copy of the page, five scripts, so it can be put back (I.4.6). */
export const snapshottingBody = (page: number): string =>
  `Taking a copy of what ${pageName(page)} holds — the touch element’s Setup and Timer and the page’s own init, timer and utility scripts — so it can be put back.`;

/** Section 9's own label for the ready state. */
export const IDENTIFIED_CAPTION = "ZONA connected";
/** The identity, the copy and the way back (I.4.7); names Put back, which is on the screen from here on. */
export function identifiedBody(fw: Firmware, page: number): string {
  return `Firmware ${fw.major}.${fw.minor}.${fw.patch}, on ${pageName(page)}. A copy of the page is saved here — its touch Setup and Timer and its own init, timer and utility scripts — so ${PUT_BACK_LABEL} can undo anything you apply.`;
}

/** The one escape hatch of `writing`, at 2000 ms (Z-09). */
export const STILL_WRITING_LINE =
  "Still writing. Your ZONA is taking longer than usual.";

/** Section 16's own line for a RAM apply: the first fact, after the click. */
export const settledCaption = (page: number): string =>
  `Applied to ${pageName(page)}. Store on ZONA to keep it after power-off.`;
/** The clause section 16 has no line for: changing page on the module clears memory (I.4.10). */
export function settledBody(name: string, page: number): string {
  return `${name} is running on ${pageName(page)} in memory only. Changing page on your ZONA clears it; apply it again if that happens.`;
}

/** The restore landed: section 16's clause shape, with HANGAR's verb (I.4.13). */
export const restoredCaption = (page: number): string =>
  `${PUT_BACK_LABEL} · ${pageName(page)}`;
/** The module's own earlier configuration is back, not a HANGAR default (I.4.14). */
export const restoredBody = (page: number): string =>
  `${pageName(page)} holds exactly what it held when you connected — your own configuration, not a HANGAR default.`;
/** After a restore that also stored (Z-04): the line beneath the body. */
export const RESTORED_STORED_LINE =
  "It’s stored too, so it stays after power-off.";

/** Section 16's own line for a confirmed store. Renders only after the acknowledgement AND the re-fetch proof (D-12). */
export const keptCaption = (page: number): string =>
  `Stored on ZONA · ${pageName(page)}`;
/** The first fact, flash side (I.4.11). */
export function keptBody(name: string, page: number): string {
  return `${name} is stored on ${pageName(page)} and will still be there after power-off.`;
}
/** The restart is not filler: the pad visibly blinks out as the module reloads the stored page. */
export const KEPT_PROOF_LINE =
  "The pad restarts once as it loads the stored version.";

/** The reset landed: section 16's confirmation words for the state it confirmed (I.4.16). */
export const clearedCaption = (page: number): string =>
  `${pageName(page)} reset to its firmware default`;
/** The third fact's result: the default runs, Put back restores, the browser draft is untouched (I.4.17). */
export const clearedBody = (page: number): string =>
  `${pageName(page)} is running the firmware’s own default. ${PUT_BACK_LABEL} restores what was there when you connected, and your browser draft is untouched.`;

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
const SNAPSHOT_FAILED_TITLE = "Nothing to put back yet";

/** The step four blocks share (I.5.8). */
const STEP_OR_PUT_BACK = `Or click ${PUT_BACK_LABEL} to restore what was there when you connected`;

/** The store was acknowledged and the read-back differs (I.5.2). */
export function keptMismatchBlock(page: number): InstallBlock {
  return {
    title: KEPT_MISMATCH_TITLE,
    detail: `Your ZONA acknowledged the store, but reading ${pageName(page)} back gave something different. HANGAR won’t call that stored.`,
    steps: [
      `Click ${TRY_ON_LABEL}, then ${KEEP_LABEL} again`,
      STEP_OR_PUT_BACK,
    ],
  };
}

/** The store's acknowledgement never came inside the retry bound (I.5.1). */
export function unconfirmedBlock(name: string, page: number): InstallBlock {
  return {
    title: UNCONFIRMED_TITLE,
    detail: `${name} is still running on ${pageName(page)} in memory. No confirmation of the store came back, so HANGAR can’t say whether it survives power-off.`,
    steps: [`Click ${KEEP_LABEL} to send the store again`, STEP_OR_PUT_BACK],
  };
}

/** The restore's store leg did not confirm (I.5.6). */
export function restoredUnconfirmedBlock(page: number): InstallBlock {
  return {
    title: RESTORED_UNCONFIRMED_TITLE,
    detail: `Your own configuration is running on ${pageName(page)} again, in memory. The store didn’t confirm, so after power-off the version stored earlier may come back instead.`,
    steps: [`Click ${PUT_BACK_LABEL} again`],
  };
}

/**
 * None of the five landed, in its two forms (I.5.5): after an apply the
 * module's own configuration is still playing and there is nothing to put
 * back; after a restore, what was playing is still playing. A NACK is the
 * signature of a silent discard (docs/SKELETON-RESULTS.md).
 */
export function nothingLandedBlock(
  after: "try" | "put-back",
  page: number,
): InstallBlock {
  const cable = "If it happens twice, check the cable is seated at both ends";
  return after === "try"
    ? {
        title: NOTHING_LANDED_TITLE,
        detail: `Nothing got through. ${pageName(page)} is unchanged, so your own configuration is still playing and there’s nothing to put back.`,
        steps: [`Click ${TRY_ON_LABEL} to send it again`, cable],
      }
    : {
        title: NOTHING_LANDED_TITLE,
        detail: `Nothing got through. ${pageName(page)} is unchanged, so what was playing is still playing.`,
        steps: [`Click ${PUT_BACK_LABEL} to send it again`, cable],
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
    steps: [`Click ${TRY_ON_LABEL} to send all five again`, STEP_OR_PUT_BACK],
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
      `Then click ${PUT_BACK_LABEL} to restore what was there when you connected`,
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
/** Names Put back, which is on the screen beside the confirmation (I.5.10). */
export const CONFIRM_WAY_BACK = `${PUT_BACK_LABEL} still restores what was there when you connected.`;

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
// The Put back control's line with no session. Its lines WITH a session name
// the page and live in page-target.ts (putBackPageLine, 13-12); Phase 10's
// page-less twins retired with 13-18 (I.3.4).

/** No open session, snapshot durable: present and visibly waiting (SAFE-09). */
export const PUT_BACK_NEEDS_ZONA = "Needs your ZONA connected.";

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
  "after-partial": `Not after a partial apply. ${TRY_ON_LABEL} again, or put your own back.`,
  "already-kept":
    "Already stored on ZONA. Turn a knob and apply it again to store a new one.",
  "after-mismatch": `${TRY_ON_LABEL} again first, then store it again.`,
  incapable: "This browser can’t write to a ZONA.",
};

// ---------------------------------------------------------------------------
// The Reset active device page control: one line, and the three reasons it
// can be disabled for.

/**
 * The third fact, before the click (I.6.3): section 16's confirmation words
 * for the same fact. It says RESET TO ITS FIRMWARE DEFAULT and never clears,
 * empties or removes (A-48): the control restores the firmware's own
 * configuration, and a word implying emptiness would be the same class of
 * lie as the never-writes sentence Phase 7 retired. D-21's sentence (`Reset
 * the current page to factory default`) is superseded by D-23.
 */
export const clearLine = (page: number): string =>
  `Returns ${pageName(page)} to its firmware default. Your browser draft stays as it is.`;

/** The three reasons, closed like KeepReason. */
export type ClearReason = "no-snapshot" | "no-session" | "incapable";

/** Two of the three are REFERENCES, so a rewrite of the shared sentence moves this table with it. */
export const CLEAR_REASONS: Readonly<Record<ClearReason, string>> = {
  "no-snapshot": "Needs a copy of what is on your ZONA first.",
  "no-session": PUT_BACK_NEEDS_ZONA,
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
/** The restore landed, spoken (I.7.3). */
export const liveRestored = (page: number): string =>
  `${pageName(page)} is back to what it was when you connected.`;
/** Section 16's own line, spoken as a sentence (I.7.4). */
export const liveKept = (page: number): string => `${keptCaption(page)}.`;
/** The reset landed, spoken (I.7.5). */
export const liveCleared = (page: number): string =>
  `${pageName(page)} is reset to its firmware default.`;
/** The 2000 ms line, spoken once. */
export const LIVE_STILL_WRITING = "Still writing.";

/** A failure title as the live region speaks it: the title, then the full stop. */
export function announceTitle(title: string): string {
  return `${title}.`;
}
