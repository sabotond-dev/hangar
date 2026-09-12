// The page target: the one control on this site that moves the hardware, and
// the envelope that makes it acceptable (Phase 13, plan 13-12; 13-CONTEXT
// D-06, all six clauses; D-19; Bible section 9 "Destination review").
//
// THE FINDING THIS MODULE IS BUILT ON. ../grid-fw/common/src/c/grid_decode.c
// :1272 NACKs any config write that is not on the module's ACTIVE page,
// grid_ui.c:471 refuses a read the same way, and the store, the clear and
// the discard carry no page parameter at all (:976, :1048, :904). Nothing
// HANGAR sends can address a page other than the one the module is on. So
// the PDF's `Target: Page 1` select cannot be a parameter of a write; it is
// either a label or a control that moves the ZONA. The user chose the
// control, knowing the cost, and named the envelope. This module is that
// envelope, state by state:
//
//   reported    the page the module last REPORTED beside its heartbeat. The
//               only trustworthy value; every write is addressed to it
//   requested   the page the visitor asked for. Set by the review's open,
//               confirmed by its affirmative, and equal to `reported` at
//               rest - the target follows the module unless asked otherwise
//   switching   the affirmative was clicked: the restore heartbeat went out,
//               then the switch, and the module's own report is awaited
//   unverified  the window closed with no report carrying the requested
//               page. NOT switched. NOT failed. Unknown, and rendered as one
//
// THE SWITCH IS A CLICK. request() opens the review and sends nothing;
// confirm() is the affirmative and is the ONLY method here that puts a
// switch on the wire. Nothing else in this module or the install store calls
// it: not a navigation, not a selection, not a restore, not an install, not
// the module reporting a page of its own accord. install.e2e.ts counts the
// class at zero over a connect-and-browse cycle that opens the menu.
//
// THE HEARTBEAT GOES FIRST, AND IT IS NOT DEFENSIVE. grid_decode.c:1279 sets
// page_change_enabled = 0 on EVERY successful config write, and :717 says
// the only thing that sets it back is a HEARTBEAT TYPE 255. The install
// store already sends that after every RAM leg; this module sends it again
// immediately before the switch, so a switch attempted straight after a
// write - or after a heartbeat the queue dropped because a write was in
// flight - is not refused silently. page-target.spec.ts test 1 asserts the
// frame order off the wire, because this is the bug most likely to ship.
//
// THE ACK GATE IS THE MODULE'S OWN REPORT. Firmware answers the switch with
// nothing at all (grid_decode.c:302-357): no acknowledgement, no NACK, no
// report. What it does do is move the active page at the start of the load
// (grid_ui.c:1017) and say which page it is on beside every heartbeat
// (grid_transport.c:199-203). So `switching` ends ONLY when observeReport()
// hears the requested page. A report carrying some other page updates
// `reported` and changes nothing else. Apply is enabled by canApply() and
// by nothing else, and canApply() is ONE condition: at rest, and
// `reported === requested`.
//
// A TIMEOUT IS `unverified`, NEVER `switched`. The window is handed in by
// the caller (PAGE_SWITCH_WINDOW_MS, six module heartbeats) because this
// module imports nothing. When it closes with the switch still pending the
// status is `unverified`: Apply stays disabled and the rendered line says
// what is known - which page was asked for and which the module last
// reported. The ways out are a report carrying the requested page (the late
// confirmation), a reconnect (reset()), or the visitor's own click - cancel()
// takes the target back to the module's reported page, request() opens a
// new review. Never a retry counter, never a second timer.
//
// PAGES ARE ENUMERATED, NEVER ASSUMED. enumerate() asks the module with a
// PAGECOUNT fetch and offers exactly that many; a module answering 2 offers
// two. The number four appears nowhere in this file. A fetch that fails
// leaves the list empty, and an empty list offers only the reported page.
//
// WHAT THIS MODULE IS NOT. Not a runes store: it is a plain class with an
// onChange callback, so page-target.spec.ts drives it in node against a
// FakeTransport with no compiler in the loop, and install.svelte.ts mirrors
// its four fields into $state for the components. Not a writer of configs:
// the one writer is sequence.ts's writeAll and this plan did not move it.
// Not a snapshot: snapshot.ts has been keyed by module AND page since Phase
// 7 (its header's rule 2), so the per-page snapshot D-06 asks for already
// exists; what this plan adds is that PUT BACK NAMES the page in hand before
// it acts (install-copy.ts, putBackPageLine).
//
// ZERO STATIC SPECIFIERS, and the reason is the chunk guard. This module is
// reachable from the first paint of `/playground/{id}/` through the install
// store, so a static import of the protocol or transport barrel here would
// put the 131 KB protocol chunk on the front door. The two types below are
// erased; the protocol module is handed in by the caller, which already
// resolved it lazily. config-shape.spec.ts test 13 walks this file.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// Type-only references, erased at compile time; neither is a specifier.
type Protocol = typeof import("$lib/protocol");
type RequestQueue = import("$lib/transport").RequestQueue;

/** The four states. `reported` is rest: the target is the page the module says it is on. */
export type TargetStatus =
  | "reported"
  | "requested"
  | "switching"
  | "unverified";

/** What the install store mirrors and the components render. Replaced whole on every change. */
export interface PageTargetView {
  readonly reported: number | undefined;
  readonly requested: number | undefined;
  readonly status: TargetStatus;
  /** The pages the module enumerated, in order; empty until enumerate() has answered. */
  readonly pages: readonly number[];
}

export interface PageTargetEnv {
  /** PAGE_SWITCH_WINDOW_MS, handed in because this module imports nothing. */
  windowMs: number;
  /** Fired after every change with the whole view. The install store's mirror. */
  onChange?: (view: PageTargetView) => void;
}

/** Where the switch and the count fetch are addressed: the ZONA's own SX/SY. */
export interface ModuleAddress {
  sx: number;
  sy: number;
}

export class PageTarget {
  reported: number | undefined = undefined;
  requested: number | undefined = undefined;
  status: TargetStatus = "reported";
  pages: readonly number[] = [];

  readonly #windowMs: number;
  readonly #onChange: ((view: PageTargetView) => void) | undefined;
  /** The one timer: armed by confirm(), cleared by the report, the cancel and the reset. Never an interval. */
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(env: PageTargetEnv) {
    this.#windowMs = env.windowMs;
    this.#onChange = env.onChange;
  }

  /** The whole state as one value, for the mirror and the tests. */
  view(): PageTargetView {
    return {
      reported: this.reported,
      requested: this.requested,
      status: this.status,
      pages: this.pages,
    };
  }

  /**
   * THE ONE CONDITION APPLY IS ENABLED ON. At rest, with the module's own
   * report agreeing with the target. False through `requested` (a review is
   * open), `switching` (the report is awaited) and `unverified` (it never
   * came), and false before the module has reported at all. The install
   * store's write paths all read this and none restates it.
   */
  canApply(): boolean {
    return (
      this.status === "reported" &&
      this.reported !== undefined &&
      this.requested === this.reported
    );
  }

  // --- what the module says ---------------------------------------------------

  /**
   * The module reported a page beside its heartbeat. Called by the install
   * store from its class sink for the ZONA's heartbeats only, and by nothing
   * else - a CONFIG/REPORT also carries a PAGENUMBER and must never land here.
   *
   *   reported     the target follows the module: `requested` moves with it,
   *                so a page the visitor changed on the hardware itself is
   *                the new target with no review, because nothing moved
   *   requested    the review is open; the "from" page it names updates
   *   switching    the requested page ends the wait; any other page only
   *                updates `reported` and the wait continues
   *   unverified   the requested page is the late confirmation; any other
   *                page updates `reported` and the state stays unverified,
   *                because the switch is still unconfirmed and the line
   *                should keep saying so until the visitor decides
   */
  observeReport(page: number): void {
    const before = this.view();
    this.reported = page;
    if (this.status === "reported") {
      this.requested = page;
    } else if (this.status === "switching" || this.status === "unverified") {
      if (page === this.requested) {
        this.#disarm();
        this.status = "reported";
      }
    } else if (this.status === "requested" && page === this.requested) {
      // The visitor asked for the page the module then moved to on its own
      // (its utility button, say): there is nothing left to switch.
      this.status = "reported";
    }
    this.#changed(before);
  }

  /** A reconnect, or the link closing: nothing is known and nothing is pending. */
  reset(): void {
    const before = this.view();
    this.#disarm();
    this.reported = undefined;
    this.requested = undefined;
    this.status = "reported";
    this.pages = [];
    this.#changed(before);
  }

  // --- the enumeration ----------------------------------------------------------

  /**
   * Ask the module how many pages it has and offer exactly that many, numbered
   * from zero as the module numbers them. The count is READ from the REPORT;
   * a fetch that fails or answers nonsense leaves the list empty, and the
   * caller degrades to offering the reported page alone. Never throws.
   */
  async enumerate(
    q: RequestQueue,
    P: Protocol,
    address: ModuleAddress,
  ): Promise<number> {
    const before = this.view();
    let count = 0;
    try {
      const cls = await q.request(
        P.fetchPageCount(address.sx, address.sy),
        "fetch-page-count",
      );
      const n = Number(cls.class_parameters.PAGENUMBER);
      if (Number.isInteger(n) && n > 0) count = n;
    } catch {
      count = 0;
    }
    this.pages = Array.from({ length: count }, (_, i) => i);
    this.#changed(before);
    return count;
  }

  // --- the review and the switch --------------------------------------------------

  /**
   * The visitor chose a destination: OPEN THE REVIEW, SEND NOTHING. Refused -
   * returns false - while a switch is pending, before the module has
   * reported, and for the page the module is already on (nothing to switch
   * to). Allowed from `unverified`: a new request is one of the visitor's
   * ways out of it.
   */
  request(page: number): boolean {
    if (this.status === "switching") return false;
    if (this.reported === undefined) return false;
    if (page === this.reported) {
      // Asking for the page the module is on is a cancel, whatever state the
      // target was in.
      this.cancel();
      return false;
    }
    const before = this.view();
    this.requested = page;
    this.status = "requested";
    this.#changed(before);
    return true;
  }

  /**
   * The review's negative, or the visitor taking an unverified target back to
   * what the module reports. The target is the module's page again. Nothing
   * is sent. A no-op while a switch is in flight - the wire cannot be
   * unsent; the report or the window decides.
   */
  cancel(): void {
    if (this.status === "switching") return;
    const before = this.view();
    this.#disarm();
    this.requested = this.reported;
    this.status = "reported";
    this.#changed(before);
  }

  /**
   * THE AFFIRMATIVE. The only method that puts a switch on the wire, and it
   * sends TWO frames in ONE order: the restore heartbeat, then the switch.
   * Both are fire-and-forget (the switch has no reply to wait for), both go
   * through the queue's sendImmediate so the one-outstanding-request rule
   * holds, and the window is armed after the second has left. Refused unless
   * a review is open. A send that throws - the link died under the click -
   * lands `unverified`: the frame may or may not have left, which is exactly
   * what the word means, and the close that follows resets everything.
   */
  async confirm(
    q: RequestQueue,
    P: Protocol,
    address: ModuleAddress,
  ): Promise<void> {
    if (this.status !== "requested") return;
    const page = this.requested;
    if (page === undefined) return;
    const before = this.view();
    this.status = "switching";
    this.#changed(before);
    try {
      // FIRST: give the module its page changes back (grid_decode.c:717).
      await q.sendImmediate(P.hostHeartbeat(), "restore-page-change");
      // SECOND: the switch. Answered by nothing; the report confirms it.
      await q.sendImmediate(
        P.pageActive(address.sx, address.sy, page),
        "switch-page",
      );
    } catch {
      this.#unverified();
      return;
    }
    if (this.status !== "switching") return;
    this.#disarm();
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      this.#unverified();
    }, this.#windowMs);
  }

  // --- the machinery ---------------------------------------------------------------

  /** The window closed, or the send failed, with the switch still pending. */
  #unverified(): void {
    if (this.status !== "switching") return;
    const before = this.view();
    this.status = "unverified";
    this.#changed(before);
  }

  #disarm(): void {
    if (this.#timer !== undefined) clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /** Publish when anything moved. Compared field by field so a report of the same page is silent. */
  #changed(before: PageTargetView): void {
    const now = this.view();
    if (
      before.reported === now.reported &&
      before.requested === now.requested &&
      before.status === now.status &&
      before.pages === now.pages
    ) {
      return;
    }
    this.#onChange?.(now);
  }
}

// ---------------------------------------------------------------------------
// The words. Landed here so no screen is blank, ledgered in 13-COPY-NEW.md
// for 13-18's batch (D-05's register: sentence case, second person, plain
// about state, names the action and its result together). Two of them are
// the Bible's own and are not ledgered: section 16's review shape and D-06's
// switch sentence, both verbatim.

/**
 * How a page is named to a visitor: FROM ONE (13-CONTEXT D-23, batch row
 * I.3.1). The module reports its active page from zero on the wire
 * (`page_activepage`, grid_ui.c:76); Grid Editor shows the same values from
 * one (Pages.svelte, `{ title: 1, value: 0 }`), and under D-19 the Editor's
 * numbering is the reference - the PDF's `Page 1` and section 16's `Page 2`
 * read the same way. The offset is applied here, where the word is written,
 * and the wire is untouched: every number this module holds, sends and
 * compares is still the module's own. install-copy.ts and session-copy.ts
 * carry the same one-line function, because none of the three may import the
 * others; the three specs pin wire 0 to `Page 1`.
 */
export const pageName = (page: number): string => `Page ${page + 1}`;

/**
 * THE DESTINATION REVIEW'S SENTENCE - 13-CONTEXT D-06, verbatim: the review
 * names BOTH pages, the one being written and the one being left.
 */
export const switchReviewLine = (to: number, from: number): string =>
  `Switch your ZONA to ${pageName(to)}? It will stop playing ${pageName(from)}.`;

/** Bible section 16's "Target review" row, verbatim, as the review's title. */
export const replaceReviewTitle = (page: number): string =>
  `Replace the configuration on ZONA · ${pageName(page)}?`;

// The review's affirmative and negative - `Switch page`, `Keep this page` -
// live in install-copy.ts as SWITCH_PAGE_LABEL and KEEP_PAGE_LABEL, because
// the affirmative is the fifth entry of WRITE_CLICKS and that module imports
// nothing; they are not repeated here.

/** The destination zone while the report is awaited (section 9's "Applying to Page N…" shape). */
export const switchingLine = (to: number): string =>
  `Switching to ${pageName(to)}…`;

/**
 * THE UNVERIFIED LINE (HANGAR's; ledgered). Plain about state, never coy: what
 * was asked for, what the module last said, and that nothing was applied.
 * `lastReported` is undefined only if the module never reported at all,
 * which cannot happen after a connect - but the sentence still has to read.
 */
export const unverifiedLine = (
  requested: number,
  lastReported: number | undefined,
): string =>
  lastReported === undefined
    ? `Your ZONA hasn’t confirmed ${pageName(requested)}. Nothing was applied.`
    : `Your ZONA hasn’t confirmed ${pageName(requested)}. It last reported ${pageName(lastReported)}, and nothing was applied.`;

/**
 * PUT BACK NAMES ITS PAGE BEFORE IT ACTS (D-06's fourth clause; HANGAR's
 * line, ledgered). The line under the control while a snapshot is in hand,
 * in place of Phase 10's page-less line - the same fact, with the page named, because a
 * visitor who switched pages after a try-on must not be surprised by which
 * page comes back. The snapshot in hand is the ACTIVE page's since the store
 * re-snapshots on a page change, and the line says which that is rather
 * than assuming the visitor knows. Two forms, as the Phase 10 pair has two:
 * the second after a store this session, when the put-back stores too. The
 * page-less Phase 10 pair retired with 13-18 (D-23, the batch's Put back row); these
 * two are the control's only lines with a session.
 */
export const putBackPageLine = (page: number): string =>
  `Puts ${pageName(page)} back to what it was playing when you connected.`;

export const putBackPageLineAfterKeep = (page: number): string =>
  `Puts ${pageName(page)} back to what it was playing when you connected, and stores it so it stays.`;

/** The select's label, the PDF's word. */
export const TARGET_LABEL = "Target";

/** The bar's action, PDF pages 3 and 5, verbatim. */
export const APPLY_LABEL = "Apply to ZONA";

/**
 * The firmware-native revert's label (HANGAR's; ledgered; ships on the
 * /dev/install/ probe only until the bench confirms the discard). Names the
 * action and its result: RAM goes back to what flash holds.
 */
export const DISCARD_LABEL = "Revert to what’s stored";
