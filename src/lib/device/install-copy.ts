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
// EVERY SENTENCE IS ONE LITERAL, NEVER A CONCATENATION, and every literal is
// transcribed from 07-UI-SPEC's Copywriting Contract by copy and paste, one
// sentence per line however long the line. Prettier reflows text inside Svelte
// markup and Phase 2 lost a load-bearing sentence to exactly that
// (02-05-SUMMARY.md), so visitor-facing copy is a named constant and the
// markup only interpolates it. install-copy.spec.ts holds every literal longer
// than forty characters against the contract read from disk. Nothing here may
// be paraphrased, reflowed, re-punctuated or "improved" - if a sentence is
// wrong, the contract is what changes first.
//
// THREE RULES A READER WOULD REVERSE, WRITTEN DOWN:
//
//  - THE SIX KEEP ON DEVICE REASONS ARE A CLOSED RECORD OVER A SIX-MEMBER
//    UNION. The UI spec says the set is closed at six and an executor never
//    adds a seventh; here that is structural - a seventh key in KEEP_REASONS is
//    a type error, not a lint finding. Every state row that reads "present,
//    disabled" without naming a reason uses `never-tried`.
//
//  - {Name} IS INTERPOLATED RAW AND NEVER RE-CASED. The catalog's names are
//    already the form the panel shows (EUCLID, MORPH); a toUpperCase() here
//    would be a second opinion about a string somebody else owns.
//
//  - FAILURE TITLES CARRY NO TERMINAL PUNCTUATION; announceTitle ADDS THE FULL
//    STOP. A title is a heading in region 3 and a sentence in the live region,
//    and the full stop belongs to the second job only. Success utterances are
//    sentences of their own and are never derived from a title.
//
// THE PUNCTUATION IS LOAD-BEARING. Real apostrophes (U+2019), a real ellipsis
// (U+2026), a real em dash (U+2014). No emoji, no exclamation marks, never
// "Error", never "loading", no browser engine named anywhere, no control label
// that says what the wire does, and no string names a control that is not on
// the screen - which is why the lost block takes the label of the surface
// rendering it (Y-13).
//
// THE FOUR CAPS - THREE UNTIL PLAN 10-12 - ARE THE CONTRACT'S, NOT THIS
// MODULE'S TO MOVE.
//
// A cap is `lines x CH_PER_LINE`, where CH_PER_LINE is the capacity of one Body
// line box in the panel's 372px content column. Phases 6 and 7 used 43,
// measured in Quicksand. Plan 10-02 swapped the body face to Inter Variable, so
// plan 10-01 re-measured it in two engines over thirty-six full line boxes and
// got 43 again - the minimum occupancy of a full line box, which is what makes
// a cap a promise about strings not yet written rather than a description of
// the ones that exist (10-01-SUMMARY.md).
//
//   HONESTY_CAP   2 x 43 =  86   the honesty slot, 48px, two lines
//   PUT_BACK_CAP  3 x 43 = 129   the PUT BACK cell, 72px, three lines
//   KEEP_CAP      2 x 43 =  86   the KEEP ON DEVICE cell, 48px, two lines
//   CLEAR_CAP     2 x 43 =  86   the CLEAR cell, 48px, two lines
//
// PUT_BACK_CAP and KEEP_CAP land byte-for-byte on the numbers this module
// already shipped. HONESTY_CAP moves 129 to 86, which is 10-UI-SPEC 12.2's
// three-lines-to-two collapse arriving as arithmetic rather than as an edit.
//
// WHEN A LITERAL EXCEEDS ITS OWN CAP, THE LITERAL IS SHORTENED - NEVER THE CAP
// RAISED. A cap widened to admit its own string stops reserving anything, and
// the reservation is the entire reason the caps exist. HONESTY_READY was 104
// here and 90 in the approved contract, both over 86, and it is 85 below.
//
// CLEAR_CAP'S SECOND LINE IS HEADROOM RATHER THAN OCCUPANCY, AND THAT IS A
// DEPARTURE FROM THE FORMULA RATHER THAN AN OVERSIGHT (A-52). The sentence
// that stood here - "CLEAR_LINE is exactly 86, it fits with zero headroom, and
// one added character breaks it" - IS RETIRED BY NAME, dated 2026-09-08: D-21
// fixed the line at 41 characters, so it is no longer true of any string this
// module ships. What replaces it: the four candidates in the CLEAR cell are
// CLEAR_LINE at 41 and the three reasons at 43, 26 and 36, so 12's rule
// (ceil(longest / CH_PER_LINE) x 24) would give ONE line and 24px. DO NOT TAKE
// IT. A one-line cap of 43 would put a shipped string exactly on its own cap -
// the zero-headroom defect plan 10-01 flagged against the old CLEAR_LINE,
// reintroduced at a different number. Two lines is the smallest reservation
// that leaves the cap a promise about strings not yet written, which is the
// entire reason the caps exist, and the 48px cell is sized for two.
//
// The spec asserts every string against its cap by name (Z-18).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The shapes.

/** One event, as the contract's {Setup|Timer} placeholder writes it - already capitalised. */
export type EventWord = "Setup" | "Timer";

/**
 * A failure-shaped block for region 3: a title, a detail, the steps in order.
 * The same shape as session-copy.ts's SessionBlock, declared here rather than
 * imported (see the header); the title is required here because every one of
 * the seven install failures has one.
 */
export interface InstallBlock {
  title: string;
  detail: string;
  steps: string[];
}

// ---------------------------------------------------------------------------
// The four caps (07-UI-SPEC, Copywriting Contract, last rule; 10-UI-SPEC 12.2,
// re-derived at the measured CH_PER_LINE). Three until plan 10-12.

/** Every honesty-slot string: TWO lines at 43 characters, 48px reserved. Was 129 at three lines. */
export const HONESTY_CAP = 86;
/** Every PUT BACK line: three lines at 43 characters, 72px reserved. */
export const PUT_BACK_CAP = 129;
/** The KEEP ON DEVICE enabled line and all six reasons: two lines at 43, 48px. */
export const KEEP_CAP = 86;
/** The CLEAR line and all three reasons: two lines at 43, 48px - the second declared headroom (A-52, see the header). */
export const CLEAR_CAP = 86;

// ---------------------------------------------------------------------------
// The labels. Uppercase, wide-tracked, never the wire's words.

/** Phase 4's, unchanged. */
export const TRY_ON_LABEL = "TRY ON DEVICE";
export const WRITING_LABEL = "WRITING…";
export const KEEPING_LABEL = "KEEPING…";
export const PUT_BACK_LABEL = "PUT BACK";
export const PUTTING_BACK_LABEL = "PUTTING BACK…";
/** Phase 4's, unchanged. */
export const KEEP_LABEL = "KEEP ON DEVICE";
export const NOT_NOW_LABEL = "NOT NOW";
/** Plan 10-12's fourth click. The Editor's own word, kept (D-21); what it does is said in the line beneath it. */
export const CLEAR_LABEL = "CLEAR";
export const CLEARING_LABEL = "CLEARING…";

/**
 * THE NUMBER OF WRITE CLICKS, AS A CONSTANT RATHER THAN AS A WORD IN PROSE.
 *
 * It has now changed once - three to four, plan 10-12 - and it will change
 * again. A sentence saying "one of three clicks" rots silently in a
 * requirements table; a constant of length four, asserted equal to the four
 * control labels, moves with the labels or turns a gate red. Every write this
 * site can perform is attributable to one of these (SAFE-01).
 */
export const WRITE_CLICKS = [
  "TRY ON DEVICE",
  "PUT BACK",
  "KEEP ON DEVICE",
  "CLEAR",
] as const;

// ---------------------------------------------------------------------------
// The honesty slot. Four strings here; the fifth is Phase 5's
// tryOnBudgetReason, which stays in $lib/tune/copy. "about a second" appears
// in the first two and nowhere else on the site (Z-08), and install-copy.spec
// asserts that occurrence count rather than trusting this comment.

/**
 * RETIRED AT 106 AND REWRITTEN AT 70, plan 10-03 (10-UI-SPEC 13.3, R-05). The
 * two facts a visitor needs before the first click are what it connects to and
 * what it writes; "and only in memory" said the third thing twice, because the
 * ready form beneath it already names the power cycle.
 */
export const HONESTY_NO_SESSION =
  "Connects to your ZONA and writes this into its memory. About a second.";

/**
 * RETIRED AT 104 AND REWRITTEN AT 85, plan 10-03 (10-UI-SPEC 13.3, R-06).
 *
 * The approved contract's form is 90: `Writes this into your ZONA’s memory in
 * about a second. A power cycle brings your own back.` It does not ship,
 * because 90 is over HONESTY_CAP - 2 x 43 = 86 at the CH_PER_LINE plan 10-01
 * measured - and the rule is to shorten the literal rather than raise the cap.
 * Two words move: "brings" becomes "puts" and "your own" becomes "yours". Both
 * facts survive whole and so does the two-line reservation.
 * install-copy.spec.ts records the amendment by name.
 */
export const HONESTY_READY =
  "Writes this into your ZONA’s memory in about a second. A power cycle puts yours back.";

/** Deliberately names no control: PUT BACK is not on the screen yet (I1). */
export const HONESTY_SNAPSHOTTING =
  "Reading what is on your ZONA now, so nothing you do here is one-way.";

/** Precedence 1 in I9: on a browser that cannot write, the standing line would be a lie (Z-06). */
export const HONESTY_INCAPABLE =
  "This browser cannot write to a ZONA. Everything else on this page works.";

// ---------------------------------------------------------------------------
// Region 3, the success-shaped blocks: a caption over a body.

export const SNAPSHOTTING_CAPTION = "READING ZONA";
export const SNAPSHOTTING_BODY =
  "Taking a copy of the Setup and Timer scripts already on your ZONA’s touch element.";

/** Phase 4's caption, unchanged. */
export const IDENTIFIED_CAPTION = "ZONA IDENTIFIED";

/** Phase 4's identified body, AMENDED (Z-07): PUT BACK is on the screen in I2, so naming it is the point. */
export function identifiedBody(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `Firmware ${fw.major}.${fw.minor}.${fw.patch}, active page ${page}. Its own Setup and Timer are saved here, so PUT BACK can undo anything you try.`;
}

/**
 * The one escape hatch of `writing`, at 2000 ms, and it is arithmetic rather
 * than theatre: no bar, no percentage, no attempt counter (Z-09).
 */
export const STILL_WRITING_LINE =
  "Still writing. Your ZONA is taking longer than it usually does.";

export const SETTLED_CAPTION = "PLAYING NOW";

/** The third sentence is FEATURES B7, the page-change warning, in the one state where it is true. */
export function settledBody(name: string): string {
  return `${name} is running on your ZONA now. It lives in memory only — a power cycle brings your own configuration back. Changing page on your ZONA clears it; try it on again if that happens.`;
}

export const RESTORED_CAPTION = "RESTORED";
export const RESTORED_BODY =
  "Your own Setup and Timer are back on your ZONA’s touch element, exactly as they were when you connected.";

/** Renders only after the PAGESTORE acknowledgement AND the re-fetch proof (D-12): it is a claim about a power cycle. */
export const RESTORED_STORED_LINE =
  "They are stored too, so they stay after a power cycle.";

export const KEPT_CAPTION = "KEPT";

export function keptBody(name: string): string {
  return `${name} is stored on your ZONA and will still be there after a power cycle.`;
}

/**
 * The restart is not filler: the pad visibly blinks out as the module restarts
 * its Lua VM, and a visitor who was not told would read that as a fault.
 *
 * RETIRED AT 124 AND REWRITTEN AT 53, plan 10-03 (10-UI-SPEC 13.3, R-09). The
 * first sentence was `HANGAR read both scripts back and they match, character
 * for character.` - a boast about a check the site would not have called KEPT
 * without. The caption above it already says KEPT, and the failure form of
 * exactly that check has its own block (keptMismatchBlock), so the read-back is
 * described where it can still go wrong and nowhere else.
 */
export const KEPT_PROOF_LINE =
  "The pad restarts once as it loads the stored version.";

/**
 * I14, the fifteenth state (A-50). THE CAPTION NAMES THE STATE, NOT THE
 * BUTTON, exactly as PLAYING NOW names the state TRY ON DEVICE leaves behind -
 * and it is two words, so 5.2's uppercase rule needs no exception.
 */
export const CLEARED_CAPTION = "FACTORY DEFAULT";

/**
 * The body names PUT BACK, which is enabled in `cleared` by construction (a
 * snapshot is a term of CLEAR's own enablement rule), so the
 * no-string-names-an-absent-control rule holds. And it says what the module is
 * DOING rather than what was taken away: after a clear the pad runs a
 * proximity-weighted touch highlight the firmware itself ships (A-48), so
 * "empty" would be false as well as unkind.
 */
export const CLEARED_BODY =
  "Your ZONA is running the firmware’s own default configuration. PUT BACK restores what was there when you connected.";

// ---------------------------------------------------------------------------
// Region 3, the seven failure-shaped blocks. Titles end without punctuation;
// announceTitle() adds the full stop for the live region.

const KEPT_MISMATCH_TITLE = "Stored, but the read-back does not match";
const UNCONFIRMED_TITLE = "Your ZONA did not confirm the store";
const RESTORED_UNCONFIRMED_TITLE = "Put back for now, not after a power cycle";
const NOTHING_LANDED_TITLE = "Nothing reached your ZONA";
const PARTIAL_TITLE = "Only one of the two scripts landed";
const LOST_TITLE = "The ZONA was unplugged mid-write";
const SNAPSHOT_FAILED_TITLE = "Nothing to put back yet";

/** The step three blocks share. */
const STEP_OR_PUT_BACK =
  "Or click PUT BACK to restore what was there when you connected";

/** I10. Both named controls are on the screen: TRY ON DEVICE live, KEEP ON DEVICE present and disabled (Z-21). */
export function keptMismatchBlock(): InstallBlock {
  return {
    title: KEPT_MISMATCH_TITLE,
    detail:
      "Your ZONA acknowledged the store, but reading the two scripts back gave something different. HANGAR will not call that kept.",
    steps: ["Click TRY ON DEVICE, then KEEP ON DEVICE again", STEP_OR_PUT_BACK],
  };
}

/** I11. Memory still holds what the visitor heard, so KEEP ON DEVICE is live and step 1 may name it. */
export function unconfirmedBlock(name: string): InstallBlock {
  return {
    title: UNCONFIRMED_TITLE,
    detail: `${name} is still running on your ZONA, in memory. No confirmation of the store came back, so HANGAR cannot say whether it will be there after a power cycle.`,
    steps: ["Click KEEP ON DEVICE to send the store again", STEP_OR_PUT_BACK],
  };
}

/** I12. I11's sibling on the PUT BACK side; the sentence that is true here is the opposite of I11's. */
export function restoredUnconfirmedBlock(): InstallBlock {
  return {
    title: RESTORED_UNCONFIRMED_TITLE,
    detail:
      "Your own Setup and Timer are running on your ZONA now, in memory. The store did not confirm, so after a power cycle the version kept earlier may come back instead.",
    steps: ["Click PUT BACK again"],
  };
}

/**
 * I13, in its two forms. After TRY ON DEVICE the owner's own scripts are still
 * running and there is nothing to put back; after PUT BACK what was playing is
 * still playing. The second step names the cable, because a timeout with no
 * NACK is the signature of a silent discard (docs/SKELETON-RESULTS.md).
 */
export function nothingLandedBlock(after: "try" | "put-back"): InstallBlock {
  const cable = "If it happens twice, check the cable is seated at both ends";
  return after === "try"
    ? {
        title: NOTHING_LANDED_TITLE,
        detail:
          "Neither script got through. Nothing on the module changed, so your own Setup and Timer are still running and there is nothing to put back.",
        steps: ["Click TRY ON DEVICE to send both again", cable],
      }
    : {
        title: NOTHING_LANDED_TITLE,
        detail:
          "Neither script got through. Nothing on the module changed, so what was playing is still playing.",
        steps: ["Click PUT BACK to send both again", cable],
      };
}

/**
 * I7, SAFE-07's named case. The two words arrive already capitalised, as
 * $lib/tune/copy established, so this module imports nothing for them.
 */
export function partialBlock(
  landed: EventWord,
  failed: EventWord,
): InstallBlock {
  return {
    title: PARTIAL_TITLE,
    detail: `${landed} reached your ZONA and ${failed} did not. What is on the module now is half this configuration and half your own.`,
    steps: ["Click TRY ON DEVICE to send both again", STEP_OR_PUT_BACK],
  };
}

/**
 * I8. "Nothing was stored" is said only where it is true (Z-11): when the leg
 * in flight was a store leg, the detail says instead that HANGAR cannot say what
 * a power cycle brings back. `label` is the control on the surface rendering
 * the block - TRY ON DEVICE in the panel, CONNECT ZONA in the header disclosure
 * - the only place this module takes a control name as an argument.
 */
export function lostBlock(storeLeg: boolean, label: string): InstallBlock {
  return {
    title: LOST_TITLE,
    detail: storeLeg
      ? "The store was sent and no confirmation came back before the ZONA was unplugged. HANGAR cannot say what a power cycle brings back."
      : "Some of this configuration may have reached the module and some may not. Nothing was stored, so a power cycle brings your own configuration back.",
    steps: [
      "Plug the ZONA back in",
      `Click ${label} again`,
      "Then click PUT BACK to restore what was there when you connected",
    ],
  };
}

/** I9 cause 4. The click retries the snapshot first and writes only if that lands. */
export function snapshotFailedBlock(): InstallBlock {
  return {
    title: SNAPSHOT_FAILED_TITLE,
    detail:
      "HANGAR could not read the Setup and Timer already on your ZONA, and it will not write over something it has not copied.",
    steps: ["Click TRY ON DEVICE to try reading it again"],
  };
}

// ---------------------------------------------------------------------------
// The inline confirmation - the only confirmation on the site (SAFE-05).

/** Micro, uppercase, at full ink: the site's one caption at full strength. */
export const CONFIRM_CAPTION = "PERMANENT";

/** The one string on the site allowed to name the touch element, because SAFE-05 requires exactly that. */
export const CONFIRM_REPLACES =
  "This replaces the Setup and Timer scripts on your ZONA’s touch element, and it survives a power cycle.";

/** Names PUT BACK, which is in the cell directly above. */
export const CONFIRM_WAY_BACK =
  "PUT BACK still restores what was there when you connected.";

/**
 * The other modules on the cable, as a sentence would list them: `EN16`,
 * `EN16 and BU16`, `EN16, BU16 and PO16`. Never an Oxford comma, never a bare
 * comma list. `names` arrives already sorted by the session (by sx, then sy)
 * and already carrying its own words for a module that named no type.
 */
export function moduleList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * SAFE-06 in full: the other modules named, their pages being stored stated
 * because PAGESTORE is a global broadcast, and the action still allowed. The
 * singular sentence for one module, the plural for several; `undefined` for
 * none, so the block renders no fourth row rather than an empty one.
 */
export function confirmRig(others: readonly string[]): string | undefined {
  if (others.length === 0) return undefined;
  return others.length === 1
    ? `Your ${moduleList(others)} is on the same cable. Its current page is stored too, because the store reaches every module at once.`
    : `Your ${moduleList(others)} are on the same cable. Their current pages are stored too, because the store reaches every module at once.`;
}

// ---------------------------------------------------------------------------
// The PUT BACK cell's three lines (07-UI-SPEC, PUT BACK). The cell reserves
// 72px in every state, so the destructive control beneath it never moves.

export const PUT_BACK_LINE =
  "Restores the Setup and Timer that were on your ZONA when you connected.";

/** After a kept this session: PUT BACK follows its RAM leg with a store (Z-04), and says so before the click. */
export const PUT_BACK_LINE_AFTER_KEEP =
  "Restores the Setup and Timer that were on your ZONA when you connected, and stores them so they stay.";

/** No open session, snapshot durable: present and visibly waiting (SAFE-09). */
export const PUT_BACK_NEEDS_ZONA = "Needs your ZONA connected.";

// ---------------------------------------------------------------------------
// The KEEP ON DEVICE cell: the enabled line and the six closed reasons.

export const KEEP_LINE_ENABLED =
  "Stores this configuration in your ZONA’s own memory, so it survives a power cycle.";

/**
 * The six reasons KEEP ON DEVICE can be disabled for, and no seventh. Every
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

/** Closed over KeepReason: a seventh key is a type error (Z-05, Z-21). */
export const KEEP_REASONS: Readonly<Record<KeepReason, string>> = {
  "never-tried": "Available after a try-on.",
  "knobs-moved":
    "Try it on again first — the knobs moved since the last try-on.",
  "after-partial":
    "Not after a half-written try-on. Send it again, or put your own back.",
  "already-kept":
    "Kept on your ZONA. Turn a knob and try it on again to keep a new one.",
  "after-mismatch": "Try it on again first, then keep it again.",
  incapable: "This browser cannot write to a ZONA.",
};

// ---------------------------------------------------------------------------
// The CLEAR cell: one line, and the three reasons it can be disabled for.

/**
 * The user's own sentence, verbatim (D-21, A-49), at 41 against a cap of 86.
 *
 * IT SAYS RESET TO FACTORY DEFAULT AND NEVER CLEARS, EMPTIES OR REMOVES. A
 * control labelled CLEAR that restores the firmware's own configuration must
 * not imply emptiness - that would be the same class of lie as the
 * never-writes sentence this phase already retired (A-48). The spec asserts
 * the three stems' absence over every string in this cell rather than trusting
 * this comment.
 *
 * On the way back, which the old line carried and this one does not: 3.1's
 * rule is that a string naming a risk, a consequence or a way back is never
 * retired, and it is satisfied by the action no longer having a consequence
 * that needs one. PUT BACK sits directly above CLEAR, enabled, with its own
 * line naming what it restores. THE COST IS RECORDED RATHER THAN HIDDEN: a
 * visitor is not told that a power cycle brings their STORED configuration
 * back rather than the factory default. That fact is now held by
 * install.spec.ts's by-class assertion and by runbook row C, not by copy.
 */
export const CLEAR_LINE = "Reset the current page to factory default";

/**
 * The three reasons CLEAR can be disabled for, and no fourth. Closed over the
 * union exactly as KEEP_REASONS is: a fourth key is a type error.
 */
export type ClearReason = "no-snapshot" | "no-session" | "incapable";

/**
 * TWO OF THE THREE ARE PHASE 7 STRINGS REFERENCED RATHER THAN RETYPED, which
 * is the point of a closed record here: `no-session` is PUT BACK's own
 * sentence and `incapable` is KEEP ON DEVICE's own reason, so a rewrite of
 * either moves this table with it and no second copy of a shipped sentence can
 * drift. Only `no-snapshot` is new, and it is SAFE-03 said out loud.
 */
export const CLEAR_REASONS: Readonly<Record<ClearReason, string>> = {
  "no-snapshot": "Needs a copy of what is on your ZONA first.",
  "no-session": PUT_BACK_NEEDS_ZONA,
  incapable: KEEP_REASONS.incapable,
};

// ---------------------------------------------------------------------------
// The live region. Five success sentences, the 2000 ms line, and the rule for
// failures: the title, verbatim, plus a full stop because it is spoken.

/** I1 to I2. Ends with the sentence the whole phase rests on. */
export const LIVE_SNAPSHOT_SAVED =
  "Your ZONA’s own Setup and Timer are saved. Nothing has been written.";

export function liveSettled(name: string): string {
  return `${name} is running on your ZONA. A power cycle brings your own configuration back.`;
}

export const LIVE_RESTORED = "Your own configuration is back on your ZONA.";

/** Spoken once, after the re-fetch proof - not once for the ACK and again for the verification. */
export function liveKept(name: string): string {
  return `${name} is stored on your ZONA and survives a power cycle.`;
}

/**
 * The thirteenth utterance (A-50). It says what the module is now doing, not
 * what the click was called, and it never says the page was emptied.
 */
export const LIVE_CLEARED = "The page is reset to factory default.";

/** The only utterance that is not a transition: once, polite, at 2000 ms. */
export const LIVE_STILL_WRITING = "Still writing.";

/** A failure announces its title and nothing else; the terminal period is added because it is spoken. */
export function announceTitle(title: string): string {
  return `${title}.`;
}
