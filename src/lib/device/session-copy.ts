// Every word the device session says, in one place, before any component
// exists to render it.
//
// THIS MODULE IMPORTS NOTHING. Not "no heavy imports", not "no vendor imports":
// zero specifiers, `import type` included. The reason is Phase 4's chunk guard,
// which matches specifier TEXT (src/lib/config-shape.spec.ts test 13) rather
// than a resolved graph, so a module that a header component may name on the
// first paint of `/` has to be free of the compiler, the protocol and the
// transport entirely. src/lib/tune/copy.ts is the precedent and holds the same
// line for the same reason. Anything this module would otherwise have imported
// arrives as an argument instead - a firmware record, a page number, an already
// sorted list of module names, and the label of whichever control is on the
// screen.
//
// EVERY SENTENCE IS ONE LITERAL, NEVER A CONCATENATION. Prettier reflows text
// inside Svelte markup and Phase 2 lost a load-bearing sentence to exactly that
// (02-05-SUMMARY.md), which is why visitor-facing copy is a named constant here
// and the markup only interpolates it. A sentence assembled from two fragments
// is a formatter-dependent assertion, so the sentences below sit on one line
// each however long that line is, and session-copy.spec.ts holds several of
// them character for character against 06-UI-SPEC's Copywriting Contract.
// Nothing here may be paraphrased, reflowed, re-punctuated or "improved" - if a
// sentence is wrong, the contract is what changes first.
//
// WHY capabilityOf LIVES HERE RATHER THAN IN try-on.ts. The header note is a
// 152px reserved region that is absent entirely in `unsupported` and `insecure`
// (06-UI-SPEC, Y-23). If the capability could only be read after try-on.ts had
// been dynamically fetched, every visitor would paint the note and a visitor on
// a browser that cannot connect would lose it a tick later, moving the headline
// and the coverflow on the one browser that can least afford a surprise. In an
// import-free module the session decides the capability SYNCHRONOUSLY, in the
// first hydrated frame, so the note is either right from the prerendered markup
// or removed once and never again. try-on.ts re-exports it, so every caller it
// already had is unchanged.
//
// THE PUNCTUATION IS LOAD-BEARING. Real apostrophes (U+2019), a real ellipsis
// (U+2026), a real em dash (U+2014). No emoji, no exclamation marks, never
// "Error", never "loading", no browser engine named anywhere, and no string
// names a control that is not on the screen - which is why the recovery steps
// take the label of the surface rendering them.
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
 * The header's connect control, beside try-on.ts's TRY_ON_LABEL, so the two
 * surfaces' recovery steps each name their own button and neither can drift
 * from it (Y-13).
 */
export const CONNECT_LABEL = "CONNECT ZONA";
export const NO_ZONA_LABEL = "NO ZONA";
export const CONNECTING_LABEL = "CONNECTING…";
export const DISCONNECT_LABEL = "DISCONNECT ZONA";
export const FORGET_LABEL = "FORGET THIS ZONA";

export const CAPTION_DETECTED = "ZONA detected";
export const CAPTION_UNPLUGGED = "ZONA unplugged";
export const CAPTION_FAILED = "Did not connect";
export const CAPTION_UNSUPPORTED = "Not in this browser";
export const CAPTION_INSECURE = "Needs HTTPS";

/**
 * The visually-hidden description paired with the resting slot. The accessible
 * NAME is always CONNECT_LABEL - a control announces what it does, never what
 * it is not - and this is what `aria-describedby` points at (Y-03).
 */
export const HIDDEN_NAME_IDLE = "No ZONA is connected.";

// ---------------------------------------------------------------------------
// The sentences. One literal each, however long the line.

/** CONN-03's pre-click line. 130 characters, asserted. */
export const PICKER_EXPLAINER =
  "The browser opens its own list of ports — that prompt is the browser, not HANGAR, and nothing here sees a port until you pick one.";

/**
 * Unconditional, and it says "some browsers" because there is no behavioural
 * signal for the two-step prompt before it appears (Y-05). It lives beneath
 * `Nothing listed?` in `cancelled` and nowhere else, so the header note stays
 * at two paragraphs (Y-09).
 */
export const TWO_STEP =
  "Some browsers ask for permission before they show the list. If you were asked twice, the list appears after the second prompt.";

/** Added to the `cancelled` block only when the rejection was a NotAllowedError (Y-06). */
export const PERMISSION_DECLINED =
  "The permission prompt was declined, so the list never opened.";

/**
 * SAFE-01, said out loud on the connect surface. 88 characters, asserted.
 *
 * AMENDED BY NAME in plan 07-04 (07-UI-SPEC, the header changes table, the
 * amendment row). Phase 6's sentence ended "and this release cannot write at
 * all", which is false the moment TRY ON DEVICE writes - so it is retired to
 * the present tense here, and session-copy.spec.ts test 5 holds the new
 * sentence and its length in place of the old ones. Shorter than the 126 it
 * replaces, so the header note's 152px reservation, measured on the longer
 * string, holds with no re-measure.
 */
export const SAFE_PROMISE =
  "HANGAR never writes to your ZONA on its own. Nothing reaches the module without a click.";

/** The header note in S2: an offer, never an automatic open (D-06). */
export const RECONNECT_OFFER =
  "ZONA detected on this computer. One click connects it, and nothing is sent until you do.";

/** The second half of S5: replugging returns the session to S2, and never opens the port itself. */
export const REPLUG_OFFER =
  "Plug it back in and this offers to connect again — the permission you already gave is still there.";

/**
 * The quiet line beneath FORGET_LABEL, which is what buys it a click with no
 * dialog (Y-15). Amended in plan 07-04 (07-UI-SPEC, Z-13): revoking a
 * permission never deletes somebody's only copy of their own configuration,
 * and the sentence now says so. 143 characters, asserted.
 */
export const REVOKE_EXPLANATION =
  "Removes this site’s permission to see your ZONA. The copy of your own Setup and Timer stays, and you can give permission again from the picker.";

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
 * SAFE-04). 108 characters, asserted, under the 129-character honesty cap
 * install-copy.ts exports.
 */
export const SNAPSHOT_DURABLE_LINE =
  "A copy of your ZONA’s own Setup and Timer is saved in this browser, so it can be put back even in a new tab.";

/**
 * The same line when the module's serial went unanswered and the copy is
 * session-only (07-CONTEXT D-04 amended). AUTHORED in plan 07-04 rather than
 * transcribed: 07-UI-SPEC contracts the slot and not this sentence. Held to
 * the same rules and the same cap as its sibling. 114 characters, asserted.
 */
export const SNAPSHOT_SESSION_LINE =
  "A copy of your ZONA’s own Setup and Timer is held until this tab closes, so it can be put back while you are here.";

/** Phase 4's sentence, verbatim, lifted out of TryOnDevice.svelte's UNPLUGGED_AFTER. Kept for the case where nothing was in flight. */
export const UNPLUGGED_WHILE_CONNECTED =
  "The ZONA was unplugged. Nothing was written.";

/**
 * The second form of the same event, for an unplug that landed under a write
 * (07-UI-SPEC, I8, Z-11): Phase 4's sentence says "Nothing was written", which
 * is false the moment a write was in flight, and one false utterance is worse
 * than two. 54 characters, asserted.
 */
export const UNPLUGGED_WHILE_WRITING =
  "The ZONA was unplugged while HANGAR was writing to it.";

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
      "Unplug the ZONA and plug it back in",
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

/** The disclosure's identity line: "Firmware 1.5.5, active page 3." */
export function identitySentence(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `Firmware ${firmwareText(fw)}, active page ${page}.`;
}

/** The connected slot's hidden description, which also says what a click does. */
export function identityDescription(
  fw: { major: number; minor: number; patch: number },
  page: number,
): string {
  return `${identitySentence(fw, page)} Opens device details.`;
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

export const LIVE_DETECTED = "ZONA detected. One click connects it.";

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
 *
 * Absence beats insecurity: with no `navigator.serial` at all there is nothing
 * for HTTPS to secure, and "this browser cannot talk to hardware" names a fix
 * the visitor can act on while "this page needs HTTPS" does not.
 *
 * `insecure` is deliberately reachable here even though the browsers that ship
 * Web Serial can barely produce it - `navigator.serial` is [SecureContext]
 * there, so an insecure page has no serial property and lands in `unsupported`
 * instead. UI-SPEC Screen 4 specifies two states keyed on two conditions, and a
 * pure function over an explicit record is what makes both branches reachable
 * from a test rather than only from a browser nobody has.
 */
export function capabilityOf(env: {
  hasSerial: boolean;
  secure: boolean;
}): Capability {
  if (!env.hasSerial) return "unsupported";
  if (!env.secure) return "insecure";
  return "ok";
}
