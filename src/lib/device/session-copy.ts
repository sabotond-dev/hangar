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
// each however long that line is, and session-copy.spec.ts holds every one of
// them against the documents that authored it.
//
// THE REGISTER IS THE BIBLE'S (13-CONTEXT D-05) AND THE WORDS ARE THE USER'S
// (D-23, 2026-09-12). A string here is either a line the design specification
// gives - section 9's `Connect ZONA`, `Disconnected · draft retained`, section
// 16's `Preview only. Connect ZONA when you’re ready.` - taken verbatim, or a
// line the specification never wrote, proposed in 13-18-BATCH.md (section I.2)
// with the state it names and the fact it must carry, and approved as written.
// Phase 10's register (`NO ZONA`, `CONNECT ZONA`, `FORGET THIS ZONA`) and the
// measured-length caps that governed its lines are superseded and retired by
// name in install-copy.ts's header; the facts survive - above all SAFE-01's,
// that nothing is written without a click, which SAFE_NOTE still carries.
//
// PAGES ARE NUMBERED FROM ONE (D-23, batch row I.3.1): the module reports 0 to
// 3 and the visitor reads 1 to 4, as Grid Editor shows them. pageName below is
// the one place this module applies the offset; install-copy.ts and
// page-target.ts carry the same line because none of the three may import the
// others, and the three specs pin them to the same answer.
//
// WHY capabilityOf LIVES HERE RATHER THAN IN try-on.ts. The header note is a
// reserved region - 152px through Phases 6 and 7, one 24px cell plus the fixed
// SAFE_NOTE line since plan 10-03 collapsed it - that is absent entirely in
// `unsupported` and `insecure` (06-UI-SPEC, Y-23). If the capability could only
// be read after try-on.ts had
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
// "Error", never "loading", no browser engine named anywhere (a browser may be
// named - Chrome for a settings path, Firefox for its own permission prompt -
// the engine never), no control label paraphrased in prose, and no string
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
 * The page as the visitor reads it, from the page as the module reports it:
 * wire 0 is `Page 1` (D-23, batch row I.3.1). See the header.
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

// PICKER_EXPLAINER WAS HERE, AND ITS ABSENCE IS AN AMENDMENT RATHER THAN A GAP.
//
// CONN-03's pre-click line - 130 characters, asserted at session-copy.spec.ts
// test 5 and rendered by PickerExplainer.svelte in two mounts - is RETIRED by
// plan 10-03 (10-UI-SPEC.md, the amendment register, R-02). The audit rule the
// register closes D-08 with:
//
//   A string is retired only when the control beside it, or the pixels beside
//   it, already say the same thing. A string that names a risk, a consequence,
//   a way back or a next step is never retired, however long it is.
//
// The browser's own port chooser explains itself the instant it appears, and a
// paragraph predicting it is the definition of unnecessary text. CONN-03 is not
// dropped: its intent - that the visitor knows nothing is seen or sent until
// they choose - is carried by SAFE_NOTE below, which is on the screen in EVERY
// state rather than only in the three resting ones, plus the chooser itself.
// PickerExplainer.svelte went with the string; nothing under src/ names either.

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
 * SAFE-01's guarantee - THE FOURTH FACT - ON THE CONTROL that would do the
 * writing (10-UI-SPEC.md §10.1, R-03; plan 10-03, form 1), in D-05's register
 * since 13-18 (batch row I.2.9): two clauses, the promise and what it covers.
 * Phase 10's form was `Nothing is written without a click.` in 35 characters;
 * the fact is the same and non-negotiable whatever the words.
 *
 * IT REPLACES SAFE_PROMISE, WHICH WAS 88 CHARACTERS OF PROSE. Phase 6 put the
 * promise in the header note and Phase 7 amended it there; both times it sat
 * in a paragraph, in three of the nine slot states, and it was absent from the
 * panel where the click actually happens. This is the same guarantee in more
 * places: beneath the primary on the chosen panel and beneath the header's
 * device slot, in EVERY state - writing, every failure, and cannot-write
 * included. REQUIREMENTS.md's SAFE-01 closure record names it.
 *
 * ITS CONTRACT, and every clause of it is asserted somewhere:
 *
 *  - UNCONDITIONAL. It renders whenever its surface renders. There is no state
 *    in which the site is silent about this.
 *  - NEVER SWAPPED. Nothing else is ever shown in its place, so it has no
 *    alternate form to drift from.
 *  - NEVER A SIZING TWIN. It is not a candidate in a reserved cell: no
 *    `grid-area: 1 / 1`, no hidden sibling holding height for it. Its line is
 *    fixed, so it costs one 14px line box permanently and nothing variable.
 *    device-ui.spec.ts holds that shape over TryOnDevice.svelte.
 *  - --color-ink, at 9.26:1. A safety statement is not quiet; the honesty
 *    slot beneath it is.
 *  - 12px Micro (title), so it reads as the button's second line rather than
 *    as prose, and 8px beneath the primary, above the honesty slot.
 */
export const SAFE_NOTE =
  "Nothing is written to your ZONA without a click. Browsing and previewing never touch it.";

/**
 * The header note in S2: an offer, never an automatic open (D-06).
 *
 * AMENDED BY NAME in plan 10-03 (10-UI-SPEC.md, R-08): 88 characters become
 * 37. The clause that went is "and nothing is sent until you do", and it is a
 * promise MOVED rather than a promise dropped - SAFE_NOTE now carries it in
 * every state instead of this one sentence carrying it in S2 alone. Saying
 * that here, because a reader diffing the two forms would otherwise read the
 * shorter one as the site having quietly stopped promising something.
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
 */
export const SNAPSHOT_DURABLE_LINE =
  "A copy of the page your ZONA was on when you connected is kept in this browser, so it can be put back even from a new tab.";

/**
 * The same line when the module's serial went unanswered and the copy is
 * session-only (07-CONTEXT D-04 amended; I.2.16).
 */
export const SNAPSHOT_SESSION_LINE =
  "A copy of the page your ZONA was on when you connected is held until this tab closes, so it can be put back while you’re here.";

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
 * Since plan 10-03 this is RECONNECT_OFFER itself rather than a second copy of
 * it: R-08 shortened the note's offer to exactly the sentence the announcer
 * was already speaking, and two identical literals in one module is one copy
 * too many (src/lib/ui/fidelity-line.ts's rule). The value is unchanged and
 * the export keeps its own name, so every caller reads the same as before -
 * what is gone is the possibility of the shown line and the spoken line
 * drifting apart.
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
