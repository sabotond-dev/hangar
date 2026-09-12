// The page target: the one control on this site that moves the hardware, and
// the envelope that makes it acceptable (Phase 13, plan 13-12; 13-CONTEXT
// D-06 clauses 1 and 3 to 6; D-19; Bible section 9). Clause 2 - section 9's
// destination review - was struck by the user at the fourth bench
// (13.1-CONTEXT D-05, 2026-09-12): the select's change is the switch.
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
//   requested   the page the visitor asked for. Set by request(), sent by
//               confirm() one microtask later, and equal to `reported` at
//               rest - the target follows the module unless asked otherwise
//   switching   the change was sent: the restore heartbeat went out, then
//               the switch, and the module's own report is awaited
//   unverified  the window closed with no report carrying the requested
//               page. NOT switched. NOT failed. Unknown, and rendered as one
//
// THE SWITCH IS A CLICK, AND THE CLICK IS THE SELECT'S CHANGE. request()
// sets the target and sends nothing; confirm() sends, and is the ONLY method
// here that puts a switch on the wire. The install store's switchPage()
// calls the two back to back from the Target select's change handler - no
// review between them, by the user's word (13.1-CONTEXT D-05: "When you
// change page form the drop down just change the page and thats it."), and
// confirmPage() there is still the one caller of confirm(). Nothing else in
// this module or the install store calls it: not a navigation, not a
// selection, not a restore, not an install, not the module reporting a page
// of its own accord. Opening the menu sends nothing; install.e2e.ts counts
// the class at zero over a connect-and-browse cycle that opens the menu.
// Choosing the page the module reports is a cancel (request() below), which
// is the way back from `unverified` now that there is no negative button.
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
// confirmation), a reconnect (reset()), or the visitor's own change - cancel()
// takes the target back to the module's reported page, request() sets a new
// one. Never a retry counter, never a second timer.
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
// exists; the snapshot is per page, and since 13.1-06 the restore that
// writes it back is the /dev/install/ probe's alone (13.1-CONTEXT D-07) -
// the lines that named the page under the Put back control retired with it
// (the words paragraph below).
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
   * report agreeing with the target. False through `requested` (a change is
   * on its way to the wire), `switching` (the report is awaited) and
   * `unverified` (it never came), and false before the module has reported
   * at all. The install store's write paths all read this and none restates
   * it.
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
   *                the new target with nothing sent, because nothing moved
   *   requested    a change is on its way to the wire; `reported` updates
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

  // --- the request and the switch --------------------------------------------------

  /**
   * The visitor chose a destination: SET THE TARGET, SEND NOTHING. Refused -
   * returns false - while a switch is pending, before the module has
   * reported, and for the page the module is already on (nothing to switch
   * to). Allowed from `unverified`: a new request is one of the visitor's
   * ways out of it, and choosing the reported page is the other.
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
   * A refused change, or the visitor taking an unverified target back to
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
   * THE SEND. The only method that puts a switch on the wire, and it sends
   * TWO frames in ONE order: the restore heartbeat, then the switch. Both
   * are fire-and-forget (the switch has no reply to wait for), both go
   * through the queue's sendImmediate so the one-outstanding-request rule
   * holds, and the window is armed after the second has left. Refused unless
   * a request is open. A send that throws - the link died under the change -
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
// about state, names the action and its result together). RETIRED BY NAME,
// 2026-09-12 (13.1-02, 13.1-CONTEXT D-05, ledgered in 13.1-COPY-NEW.md):
// switchReviewLine (13-CONTEXT D-06's sentence, "Switch your ZONA to Page 3?
// It will stop playing Page 1.") and replaceReviewTitle (section 16's
// "Target review" row) - the two lines the destination review rendered.
// The user struck the review; nothing renders them, so they are gone rather
// than left exported for no reader.

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

/*
 * PUT BACK'S TWO PAGE LINES ARE RETIRED BY NAME, 2026-09-12 (13.1-06,
 * 13.1-CONTEXT D-07; ledgered in 13.1-COPY-NEW.md). putBackPageLine (`Puts
 * Page 2 back to what it was playing when you connected.`) and
 * putBackPageLineAfterKeep (`Puts Page 2 back to what it was playing when
 * you connected, and stores it so it stays.`) were the line under the Put
 * back control while a snapshot was in hand - D-06's fourth clause, the page
 * named before the click so a visitor who switched pages after an apply was
 * not surprised by which page came back. The user removed the control at
 * the fourth bench ("we dont even need the Put back function"; "remove"), so
 * the lines have no reader: PutBack.svelte is deleted and the restore is
 * the /dev/install/ probe's, whose readout names the page from the store.
 * The snapshot is still per page and still re-taken on a page change.
 */

/**
 * The select's label, the PDF's word. install-copy.ts carries the same
 * string as TARGET_CLICK - the fifth write click is this select's change -
 * because neither module may import the other (the pageName precedent), and
 * install-copy.spec.ts pins the twin equal to this.
 */
export const TARGET_LABEL = "Target";

/** The bar's action, PDF pages 3 and 5, verbatim. */
export const APPLY_LABEL = "Apply to ZONA";

/**
 * The firmware-native revert's label (HANGAR's; ledgered; ships on the
 * /dev/install/ probe only until the bench confirms the discard). Names the
 * action and its result: RAM goes back to what flash holds.
 */
export const DISCARD_LABEL = "Revert to what’s stored";
