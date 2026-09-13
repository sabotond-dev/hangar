// Every word the device session says, in one place, before any component exists
// to render it. Imports nothing at all, a type import included: Phase 4's chunk
// guard matches specifier text (config-shape.spec.ts test 13) and the header
// names this module on the first paint of `/`. session-copy.spec.ts pins that and
// holds every string against the Bible (section 9 and 16 lines verbatim),
// 13-18-BATCH.md section I.2 (D-23) and 13.1-COPY-NEW.md. One literal per
// sentence, on one line, in D-05's register: sentence case, second person, real
// apostrophe / ellipsis / em dash, never "Error" or "loading", a browser named for
// a settings path but never its engine, no control paraphrased or named off the
// screen. Pages count from one (pageName); capabilityOf is here to be synchronous.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The taxonomy.

/**
 * Every position the session can be in. Seventeen members; the NINE named
 * states of 06-UI-SPEC are the subset listed in NAMED_STATES below.
 *
 * `already-open` is deliberately NOT a member. It is an `OpenFailure` key that
 * plan 06-03 maps onto `unknown`, exactly as the UI spec folds it into the
 * `unknown` row: one sentence, no steps, and no tenth slot state.
 */
export type SessionPhase =
  | "starting"
  | "unsupported"
  | "insecure"
  | "idle"
  | "detected"
  | "choosing"
  | "opening"
  | "identifying"
  | "connected"
  | "unplugged-while-connected"
  | "cancelled"
  | "port-busy"
  | "not-zona"
  | "silent"
  | "unplugged-at-open"
  | "unknown"
  | "forgotten";

/** The nine slot states of 06-UI-SPEC, and no tenth. */
export type SlotState =
  | "S0a"
  | "S0b"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7";

/**
 * The slot state a phase renders as, and nothing else: DeviceSlot.svelte is a
 * dumb renderer over this table, so the table is testable in node rather than
 * only in a browser.
 *
 * `starting` is S1, and that is a ruling rather than a leftover. It is the
 * value the session is initialised to and therefore the slot state of every
 * PRERENDERED page. S1 is the not-connected resting state - dark mark, no
 * caption, `NO ZONA` - so a static document ships the resting slot and the
 * header note, and hydration either leaves both where they are (a capable
 * browser: `starting` becomes `idle`, nothing moves) or removes the note once,
 * in the first hydrated frame, and never again (`unsupported` / `insecure`,
 * which render no note at all).
 *
 * There is NO `default` branch on purpose. A phase added later is then a type
 * error here rather than a silent fall-through onto somebody else's shape.
 */
export function slotStateOf(phase: SessionPhase): SlotState {
  switch (phase) {
    case "unsupported":
      return "S0a";
    case "insecure":
      return "S0b";
    case "starting":
    case "idle":
      return "S1";
    case "detected":
      return "S2";
    case "choosing":
    case "opening":
    case "identifying":
      return "S3";
    case "connected":
      return "S4";
    case "unplugged-while-connected":
      return "S5";
    case "cancelled":
    case "port-busy":
    case "not-zona":
    case "silent":
    case "unplugged-at-open":
    case "unknown":
      return "S6";
    case "forgotten":
      return "S7";
  }
}

/**
 * The six of the nine named states that render `failureCopy()` VERBATIM, with
 * the control label of the surface rendering the block. These are exactly the
 * six branches failureCopy has, and `unplugged-at-open` reaches it through the
 * transport's existing `unplugged` key.
 */
export const FAILURE_COPY_STATES = [
  "unsupported",
  "insecure",
  "cancelled",
  "port-busy",
  "unplugged-at-open",
  "unknown",
] as const;

/** The three of the nine whose words HANGAR authors, here, rather than the transport. */
export const AUTHORED_STATES = [
  "not-zona",
  "silent",
  "unplugged-while-connected",
] as const;

/** Nine, closed, countable by a test. Six plus three (06-UI-SPEC, Y-21). */
export const NAMED_STATES = [
  ...FAILURE_COPY_STATES,
  ...AUTHORED_STATES,
] as const;

// ---------------------------------------------------------------------------
// The labels and captions of the header slot (06-UI-SPEC, The nine slot states).

/**
 * Wire 0 is `Page 1` (D-23, batch row I.3.1). One of three copies - none of
 * the three copy modules may import another; the three specs pin the three
 * to the same answer.
 */
export const pageName = (page: number): string => `Page ${page + 1}`;

/**
 * The header's connect control - the PDF's page-1 control, verbatim - beside
 * try-on.ts's TRY_ON_LABEL, so the two surfaces' recovery steps each name
 * their own button and neither can drift from it (Y-13). It reads the same at
 * rest and hovered (batch row I.2.1): NO_ZONA_LABEL, Phase 10's resting form,
 * is retired - a control announces what it does, never what it is not.
 */
export const CONNECT_LABEL = "Connect ZONA";
export const CONNECTING_LABEL = "Connecting…";
/**
 * S4's label: the PDF's own words for the header's box on pages 2-5,
 * verbatim (section 9's Ready row). The identity - firmware, page, the other
 * modules on the cable - moved out of the header and into Device actions
 * with 13-18 (13-11 named the move; D-23 took it), where identitySentence
 * and multiModuleLine already render it; the box's hidden description
 * (identityDescription) still carries the page for a screen reader.
 */
export const CONNECTED_LABEL = "ZONA connected";
/**
 * The label of the three summary states with no device - S0a, S0b and S5 -
 * where a click opens the reason rather than connecting: section 9's own
 * visible label for the No connection row, verbatim. A control that cannot
 * connect must not read `Connect ZONA` (device-ui.spec.ts holds it); Phase
 * 10's `NO ZONA` said what the control was not, and D-05 retired that.
 */
export const PREVIEW_ONLY_LABEL = "Preview only";
export const DISCONNECT_LABEL = "Disconnect ZONA";
export const FORGET_LABEL = "Forget this ZONA";

export const CAPTION_DETECTED = "ZONA detected";
/** Section 9's own label for the Disconnected row, verbatim: S5's caption. */
export const CAPTION_UNPLUGGED = "Disconnected · draft retained";
/**
 * S6 as a whole (I.2.7). Section 9's `Device access blocked` is for a denied
 * permission, which is not a phase HANGAR has - a blocked chooser lands in
 * `cancelled` or `unknown` - so it is not used here.
 */
export const CAPTION_FAILED = "Did not connect";
/**
 * Two captions for two facts with two remedies (I.2.5). Section 9's one line -
 * `Device connection unavailable here` - collapses them; the caption is the
 * reason in short and the click opens the reason in full.
 */
export const CAPTION_UNSUPPORTED = "Not in this browser";
export const CAPTION_INSECURE = "Needs HTTPS";

/**
 * The visually-hidden description paired with the resting slot: section 16's
 * own Disconnected line, verbatim (I.2.2). The accessible NAME is always
 * CONNECT_LABEL - a control announces what it does, never what it is not -
 * and this is what `aria-describedby` points at (Y-03).
 */
export const HIDDEN_NAME_IDLE = "Preview only. Connect ZONA when you’re ready.";

// ---------------------------------------------------------------------------
// The sentences. One literal each, however long the line.

// PICKER_EXPLAINER WAS HERE, AND ITS ABSENCE IS AN AMENDMENT RATHER THAN A GAP:
// CONN-03's pre-click line is RETIRED by plan 10-03 (10-UI-SPEC.md, R-02) - the
// browser's chooser explains itself, and SAFE_NOTE carries the intent in every
// state. PickerExplainer.svelte went with it; nothing under src/ names either.

/**
 * The two-step prompt (I.2.8): desktop Firefox 151+ shows a site-permission
 * prompt before the port picker, and it looks like an add-on being installed.
 * The sentence names the browser - CONN-02 permits Chrome, Edge and Firefox
 * by name and forbids the engine - and says what the prompt is not. There is
 * no behavioural signal for it before it appears (Y-05), so the line is
 * unconditional; it lives beneath `Nothing listed?` in `cancelled` and
 * nowhere else (Y-09).
 */
export const TWO_STEP =
  "Firefox asks first whether this site may use serial ports. Allow it and the list appears; nothing is being installed.";

/** Added to the `cancelled` block only when the rejection was a NotAllowedError (Y-06). Second person, and the way back (I.2.10). */
export const PERMISSION_DECLINED =
  "You declined the permission prompt, so the list never opened. Connect again when you’re ready and allow it.";

/**
 * SAFE-01's guarantee - the fourth fact - on the control that would do the
 * writing (10-UI-SPEC.md R-03; batch row I.2.9): the promise and what it covers.
 * It replaced SAFE_PROMISE, the header note's paragraph, and renders beneath
 * the primary and beneath the header's device slot in EVERY state -
 * unconditional, never swapped, never a sizing twin (device-ui.spec.ts holds
 * the shape). REQUIREMENTS.md's SAFE-01 closure record names it.
 */
export const SAFE_NOTE =
  "Nothing is written to your ZONA without a click. Browsing and previewing never touch it.";

/**
 * The header note in S2: an offer, never an automatic open (D-06). Amended by
 * name in plan 10-03 (R-08): the "nothing is sent until you do" clause moved to
 * SAFE_NOTE, which carries it in every state.
 */
export const RECONNECT_OFFER = "ZONA detected. One click connects it.";

/** The second half of S5 (I.2.12): replugging returns the session to S2, and never opens the port itself. */
export const REPLUG_OFFER =
  "Plug it back in and you’ll be offered the connection again; the permission you gave still stands.";

/**
 * The quiet line beneath FORGET_LABEL, which is what buys it a click with no
 * dialog (Y-15). Revoking a permission never deletes somebody's only copy of
 * their own configuration (07-UI-SPEC, Z-13), the module is untouched, and the
 * sentence says both (I.2.14). "Its own page" rather than "Setup and Timer":
 * the copy has held five scripts since 13-17 and is per page since D-06.
 */
export const REVOKE_EXPLANATION =
  "This site forgets your ZONA and can no longer see it. Nothing on the module changes, the copy of its own page stays here, and you can allow the site again from the browser’s list.";

// ---------------------------------------------------------------------------
// The header's Phase 7 strings (07-UI-SPEC, The header device slot, and its
// disclosure). The header never shows an install state; these four are the
// whole of what changes in it: a lock reason, and the snapshot line in its two
// forms. None names a control, because the panel may be closed when they are
// read.

/**
 * Beneath DISCONNECT_LABEL and FORGET_LABEL while the session's writeLock is
 * on (Z-15): both controls are disabled on every leg of a write, RAM and
 * store, and this is the reason inline. 41 characters, asserted.
 */
export const WRITE_LOCK_REASON = "Not while HANGAR is writing to your ZONA.";

/**
 * The S4 disclosure's snapshot line when the copy is in localStorage (D-04,
 * SAFE-04) - THE SECOND FACT, the snapshot, in the panel (I.2.15). "The page"
 * because the copy holds five scripts since 13-17 and is per page since D-06.
 * Reworded at 13.1-06 (13.1-CONTEXT D-07; ledgered in 13.1-COPY-NEW.md):
 * "so it can be put back even from a new tab" promised a control the user
 * removed; the copy is still kept, and the line says so and no more.
 */
export const SNAPSHOT_DURABLE_LINE =
  "A copy of the page your ZONA was on when you connected is kept in this browser, and kept on record even from a new tab.";

/**
 * The same line when the module's serial went unanswered and the copy is
 * session-only (07-CONTEXT D-04 amended; I.2.16); the tab-only twin,
 * reworded the same way at 13.1-06.
 */
export const SNAPSHOT_SESSION_LINE =
  "A copy of the page your ZONA was on when you connected is held until this tab closes, and kept on record while you’re here.";

/** S5 with nothing in flight (I.2.18); the caption above it is section 9's. */
export const UNPLUGGED_WHILE_CONNECTED =
  "Your ZONA was unplugged. Nothing was written.";

/**
 * The second form of the same event, for an unplug that landed under a write
 * (07-UI-SPEC, I8, Z-11; I.2.19): the first form says "Nothing was written",
 * which is false the moment a write was in flight, and one false utterance is
 * worse than two.
 */
export const UNPLUGGED_WHILE_WRITING =
  "Your ZONA was unplugged while HANGAR was writing to it.";

/** The three S3 status lines, Phase 4's, verbatim. */
export const STATUS_CHOOSING = "Pick the ZONA in the browser’s list.";
export const STATUS_OPENING = "Opening the port…";
export const STATUS_IDENTIFYING = "Listening for the module…";

/**
 * The empty-picker branch. `requestPort()` rejects with NotFoundError both when
 * the visitor closes the chooser and when it had nothing to list, and the API
 * does not tell them apart - so this hangs off `cancelled` as a disclosure the
 * visitor opens only if it applies to them (D-12). A question mark is not an
 * exclamation mark; the copy rules ban the second.
 */
export const NOTHING_LISTED = "Nothing listed?";
export const NOTHING_LISTED_STEPS = [
  "Try a different USB cable. A charge-only cable fits the socket and carries no data, and it is the most common reason a list comes up empty.",
  "Plug the ZONA straight into the computer rather than through a hub or a dock.",
  "A ZONA needs no driver. If every cable and every port gives an empty list, the module is not showing up to the computer at all, which is a hardware question rather than a browser one.",
];

/**
 * The third cause of the same rejection: ports blocked for this site.
 *
 * This body is the ONE recorded exception to the Copywriting Contract's "never
 * a browser name outside UNSUPPORTED_DETAIL" rule, and session-copy.spec.ts
 * test 6 names it as such. A settings path is worthless without the browser it
 * belongs to, and the sentence stays a suggestion ("may be blocking") rather
 * than a claim about which browser the visitor has.
 */
export const CHOOSER_NEVER_APPEARED = "The chooser never appeared?";
export const CHOOSER_NEVER_APPEARED_BODY =
  "Your browser may be blocking serial ports for this site. Check the site’s permissions — in Chrome, chrome://settings/content/serialPorts — and try again.";

// ---------------------------------------------------------------------------
// The three authored blocks.
//
// Each takes the label of the control on the surface that is rendering it, so
// no step ever names a button the visitor cannot see. The other six named
// states render failureCopy() from the transport instead.

export interface SessionBlock {
  title?: string;
  detail: string;
  steps: string[];
}

const NOT_ZONA_TITLE = "That module is not a ZONA";

/** Phase 4's body, verbatim, including its fallback for a module that named no type. */
const notZonaBody = (moduleType: string | undefined): string =>
  `It reported itself as ${moduleType ?? "an unknown module"}. HANGAR only speaks to a ZONA, so nothing was sent.`;

const SILENT_TITLE = "Nothing answered on that port";

/** Phase 4's body, verbatim. `seconds` is the identify window the session used. */
const silentBody = (seconds: number): string =>
  `The port opened, but no Grid module reported itself within ${seconds} seconds. That usually means the port belongs to something else on your machine.`;

/**
 * Phase 4's title and body, with 06-UI-SPEC Y-14's AMENDED steps.
 *
 * Phase 4's step 1 was `Disconnect`, which named a control that is not on the
 * screen once the session has closed the port - the thing Phase 4's own copy
 * rule forbids. It becomes `Plug in a ZONA`, and step 2 takes the interpolated
 * label.
 */
export function notZonaBlock(
  moduleType: string | undefined,
  label: string,
): SessionBlock {
  return {
    title: NOT_ZONA_TITLE,
    detail: notZonaBody(moduleType),
    steps: ["Plug in a ZONA", `Click ${label} again`],
  };
}

/**
 * Phase 4's title and body, with 06-UI-SPEC Y-14's AMENDED step 2.
 *
 * Phase 4 hard-coded `TRY ON DEVICE` into the step, so the header's copy would
 * have named the panel's button. The label is interpolated for the same reason
 * `not-zona`'s is.
 */
export function silentBlock(seconds: number, label: string): SessionBlock {
  return {
    title: SILENT_TITLE,
    detail: silentBody(seconds),
    steps: [
      "Unplug your ZONA and plug it back in",
      `Click ${label} again and pick a different port`,
    ],
  };
}

/**
 * S5, and it is not a failure block: one sentence, no title, no steps.
 *
 * `unplugged-while-connected` is the `navigator.serial` disconnect of a session
 * that was already live. Nothing was being opened and the visitor did nothing
 * wrong, so there is no recovery list to work through - the replug offer is the
 * way out, and it sits beside this rather than inside it (Y-21).
 *
 * `writing` selects the second form (plan 07-04): the session passes its
 * unpluggedWhileWriting modifier, so the disclosure says the true thing about
 * a write that was in flight and Phase 4's sentence otherwise. Defaulted, so
 * every caller and sample from Phase 6 keeps working unchanged.
 */
export function unpluggedWhileConnectedBlock(writing = false): SessionBlock {
  return {
    detail: writing ? UNPLUGGED_WHILE_WRITING : UNPLUGGED_WHILE_CONNECTED,
    steps: [],
  };
}

// ---------------------------------------------------------------------------
// The identity, in pieces.
//
// The firmware version and the page number are monospaced numeric runs inside
// an otherwise-Quicksand line (Y-18), so this module returns the parts and the
// component does the markup.

/** "1.5.5" - the three numbers, joined, and nothing about how they are set. */
export function firmwareText(fw: {
  major: number;
  minor: number;
  patch: number;
}): string {
  return `${fw.major}.${fw.minor}.${fw.patch}`;
}

/**
 * The header slot's multi-module tail, "with EN16, BU16", or undefined.
 *
 * UNDEFINED rather than "" for an empty list, and the tail carries no separator
 * of its own: DeviceSlot renders the ` · ` in front of it only when there is a
 * tail, so a single-module connection - the common case - gets no stray middle
 * dot in the header.
 *
 * `others` arrives already sorted by the session (by sx, then sy) and already
 * carrying its own words for a module that named no type. This module sorts
 * nothing and looks nothing up.
 */
export function moduleTail(others: string[]): string | undefined {
  if (others.length === 0) return undefined;
  return `with ${others.join(", ")}`;
}

/** The disclosure's identity line (I.2.23): "Firmware 1.5.5, on Page 3." - the page as the visitor reads it. */
export function identitySentence(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `Firmware ${firmwareText(fw)}, on ${pageName(page)}.`;
}

/**
 * The connected slot's hidden description, which also says what a click
 * does (I.2.24) - and names the panel it opens as the panel is labelled,
 * `Device actions` (13-11), because a control label is never paraphrased.
 */
export function identityDescription(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `${identitySentence(fw, page)} Opens Device actions.`;
}

/**
 * The disclosure's multi-module line, "Also on the cable: EN16, BU16.", or
 * undefined for an empty list - in which case DeviceDetails renders no line at
 * all rather than an empty one.
 */
export function multiModuleLine(others: string[]): string | undefined {
  if (others.length === 0) return undefined;
  return `Also on the cable: ${others.join(", ")}.`;
}

// ---------------------------------------------------------------------------
// The live region.
//
// Five sentences, because a failure announces its own title and nothing else -
// so there is no sixth string here.

/**
 * RECONNECT_OFFER itself since plan 10-03 (R-08), not a second copy: two
 * identical literals in one module is one copy too many, and the shown line
 * and the spoken line cannot drift apart.
 */
export const LIVE_DETECTED = RECONNECT_OFFER;

export function liveConnected(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `ZONA connected. ${identitySentence(fw, page)}`;
}

export const LIVE_DISCONNECTED = "ZONA disconnected.";
export const LIVE_UNPLUGGED = UNPLUGGED_WHILE_CONNECTED;
export const LIVE_FORGOTTEN =
  "This site no longer has permission to see your ZONA.";

// ---------------------------------------------------------------------------
// The capability.

export type Capability = "unsupported" | "insecure" | "ok";

/**
 * A capability test over an explicit environment record, never a browser test.
 * Absence beats insecurity: with no `navigator.serial` there is nothing for
 * HTTPS to secure, and "not in this browser" names a fix the visitor can act
 * on. `insecure` is reachable here even though a shipping browser can barely
 * produce it, so both of Screen 4's states are reachable from a test.
 */
export function capabilityOf(env: {
  hasSerial: boolean;
  secure: boolean;
}): Capability {
  if (!env.hasSerial) return "unsupported";
  if (!env.secure) return "insecure";
  return "ok";
}
