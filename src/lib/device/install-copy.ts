// Every word the install flow says, once, before any component exists to render
// it. Imports nothing at all, a type import included: Phase 4's chunk guard
// matches specifier text (config-shape.spec.ts test 13) and the header's device
// disclosure names this module on the first paint of `/`. install-copy.spec.ts
// pins that and holds every string against its documents: the Bible's section 9
// and 16 lines verbatim, `Clear` the user's word (13.1-05), the rest 13-18-BATCH's
// (D-23), ledgered in 13-COPY-NEW.md and 13.1-COPY-NEW.md. The register is D-05's:
// sentence case, second person, one literal per sentence, real apostrophe /
// ellipsis / em dash, never "Error" or "loading", no engine named, no control label
// paraphrased. Pages are numbered from one (pageName); WRITE_CLICKS is four.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The retirement ledger: what this module used to export, by name and date.
// Each entry keeps its heading and its names; the argument is in the SUMMARY
// it points at (13.2-CONTEXT D-05).
//
// THE HONESTY CAPS ARE RETIRED BY NAME, 2026-09-12 (13-18, D-05). HONESTY_CAP
// (86), PUT_BACK_CAP (129), KEEP_CAP (86) and CLEAR_CAP (86) were `lines x
// CH_PER_LINE`, with CH_PER_LINE the 43 characters of one Body line in Phase
// 10's 372px column. D-05 changed the register and the column is gone; the
// rules that travelled with the caps - the register, the punctuation, no
// paraphrase, Z-08, A-48 - still hold over every export (install-copy.spec.ts).
// See .planning/phases/13-gui-overhaul/13-18-SUMMARY.md.
//
// THE REVIEW'S TWO LABELS ARE RETIRED BY NAME, 2026-09-12 (13.1-02,
// 13.1-CONTEXT D-05; ledgered in 13.1-COPY-NEW.md): SWITCH_PAGE_LABEL and
// KEEP_PAGE_LABEL, the destination review's pair; the Target select's change
// became the fifth write click (TARGET_CLICK; four clicks since 13.1-06).
//
// SECTION 9'S RESET LABEL IS RETIRED BY NAME, 2026-09-12 (13.1-05,
// 13.1-CONTEXT D-04; ledgered): CLEAR_LABEL is `Clear`, the user's word; the
// fact section 9's label carried is clearLine's.
//
// PUT BACK'S STRINGS ARE RETIRED BY NAME, 2026-09-12 (13.1-06, 13.1-CONTEXT
// D-06 and D-07; ledgered): PUT_BACK_LABEL, puttingBackLabel, STEP_OR_PUT_BACK
// (stepOrClear replaces it) and PUT_BACK_NEEDS_ZONA (NEEDS_ZONA is the same
// sentence); WRITE_CLICKS is FOUR; every way-back sentence names Clear. The
// snapshot and the store's putBack() stay for the /dev/install/ probe;
// restoredCaption and RESTORED_UNCONFIRMED_TITLE are its words.
// See .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md.
//
// THE INSTALL BLOCK'S SIX SUCCESS BODIES ARE RETIRED BY NAME, 2026-09-12
// (13.1-06, D-06; ledgered): snapshottingBody, identifiedBody, settledBody,
// keptBody, restoredBody, clearedBody, KEPT_PROOF_LINE and RESTORED_STORED_LINE;
// STILL_WRITING_LINE is NOT retired (SAFE-08's visible half, the zone's); the
// bar's device clause (device-clause.ts) carries every success caption.

// ---------------------------------------------------------------------------
// The shapes.

/** One event, as the touch element's two scripts are named - already capitalised. */
export type EventWord = "Setup" | "Timer";

/**
 * What landed and what did not, as the partial block interpolates them. Two
 * CLOSED unions: a RAM leg writes five strings in order and aborts on the first
 * failure - the system timer (255/6), the page init (255/0), the utility script
 * (255/4), the touch Timer (0/6), the touch Setup (0/0) - so exactly four
 * partials exist and they are the four rows below, read left to right as
 * sequence.ts's SLOTS top to bottom. `landed` is sentence-initial and
 * capitalised; `failed` sits mid-sentence and is not. Literals, not built from
 * SLOTS[].label (this module imports nothing); "the utility script" is HANGAR's
 * word for 255/4 (D-23, batch row I.5.4).
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
 * shape as session-copy.ts's SessionBlock, declared here again because a type
 * import is still a specifier.
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
 * Wire 0 is `Page 1` (D-23, batch row I.3.1; Grid Editor's numbering under
 * D-19); the one place in this module the offset is applied. One of three
 * copies - none of the three copy modules may import another (install-copy.spec.ts,
 * the imports-nothing test); the three specs pin the three to the same answer.
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
 * Section 9's progress shape for the reset (I.4.20), naming the store leg too
 * since round 4c (2026-09-12) because the click runs both; ledgered in
 * 13.1-COPY-NEW.md.
 */
export const clearingLabel = (page: number): string =>
  `Resetting and storing ${pageName(page)}…`;
/**
 * The Target select's change is a write click (13.1-02; 13.1-CONTEXT D-05).
 * `Target` is page-target.ts's TARGET_LABEL, carried a second time because
 * neither module may import the other; install-copy.spec.ts pins the twin
 * equal. Not a visible string of this module's own: it names the control in
 * WRITE_CLICKS so SAFE-01's count reads the one click that moves the page.
 */
export const TARGET_CLICK = "Target";

/**
 * The number of write clicks, as a constant rather than as a word in prose.
 * FOUR since 13.1-06 (Put back removed, D-07); REQUIREMENTS.md's SAFE-01 names
 * this constant, so a fifth write control is a change here first.
 */
export const WRITE_CLICKS = [
  TRY_ON_LABEL,
  KEEP_LABEL,
  CLEAR_LABEL,
  TARGET_CLICK,
] as const;

// ---------------------------------------------------------------------------
// The honesty line: Apply to ZONA's accessible description, by state (I.4.1-I.4.4).

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
// The install phases' captions: the bar's device clause (device-clause.ts)
// renders them, and since 13.1-06 it is the only rendering of the six success
// phases (the bodies are retired, the ledger above). Section 9's and 16's lines
// where those have one, HANGAR's where they do not.

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
 * The restore landed (I.4.13), in the register's own verb: read from the
 * /dev/install/ probe alone, since the store's putBack() has no control on the
 * site (D-07).
 */
export const restoredCaption = (page: number): string =>
  `${pageName(page)} put back`;

/** Section 16's own line for a confirmed store. Renders only after the acknowledgement AND the re-fetch proof (D-12). */
export const keptCaption = (page: number): string =>
  `Stored on ZONA · ${pageName(page)}`;

/**
 * The reset landed AND was stored (I.4.16; the store said since round 4c,
 * 2026-09-12): spoken only after the PAGESTORE acknowledgement and the re-fetch
 * proof, as keptCaption's is (D-12). Ledgered in 13.1-COPY-NEW.md.
 */
export const clearedCaption = (page: number): string =>
  `${pageName(page)} reset to its firmware default and stored`;

// ---------------------------------------------------------------------------
// The six uncertain outcomes and the lost cable: six titles, on purpose (D-23;
// section I.5 of the batch - each has its own recovery, so each has its own
// title and steps). Titles end in a letter; announceTitle adds the full stop.
// `name` is interpolated raw and never re-cased: the catalog's names are the
// form the panel shows.

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
 * way back that exists is the header's Clear. Exported so the zone's test and
 * the ledger can read it by name.
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
 * The restore's store leg did not confirm (I.5.6). Reachable from the
 * /dev/install/ probe only since 13.1-06 (D-07), so the step names the probe's
 * action in the probe's words.
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
 * module's own configuration is still playing; after a restore, what was
 * playing is still playing. A NACK is the signature of a silent discard
 * (docs/SKELETON-RESULTS.md). The restore form is the /dev/install/ probe's
 * alone since 13.1-06 (D-07), so its step names the probe's action.
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
// The no-session sentence (I.3.4): the header's Clear reason for no session,
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
 * The third fact, before the click (I.6.3): it says RESET TO ITS FIRMWARE
 * DEFAULT and never clears, empties or removes (A-48), and since round 4c
 * (2026-09-12) it says the store too, in keepLineEnabled's own words.
 * Ledgered in 13.1-COPY-NEW.md.
 */
export const clearLine = (page: number): string =>
  `Returns ${pageName(page)} to its firmware default and stores it, so it stays after power-off. Your browser draft stays as it is.`;

/**
 * What a clear leaves running in memory when its store never acknowledged
 * (round 4c, 2026-09-12): the store sets it as `name`, so unconfirmedBlock's
 * one row says the firmware default is what runs rather than the route's
 * entry. Ledgered in 13.1-COPY-NEW.md.
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
