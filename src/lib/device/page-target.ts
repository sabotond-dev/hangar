// The page target: the one control on this site that moves the hardware, and its
// envelope (13-12; Bible section 9). grid_decode.c:1272 NACKs any config write
// that is not on the module's ACTIVE page, so the PDF's `Target` select cannot be
// a parameter of a write; it is a control that moves the ZONA. Four states:
// reported (the page beside the module's heartbeat, the only trustworthy value),
// requested (asked for; sent by confirm()), switching (the restore heartbeat then
// the switch sent, the module's own report awaited), unverified (the window closed
// with no report - not switched, not failed). request() sends nothing; confirm()
// is the ONLY sender, called by the install store from the Target select's change
// (13.1-02: no review). Zero static specifiers: protocol and queue are handed in.
// Decided at 13-12 (13-CONTEXT D-06); see .planning/phases/13-gui-overhaul/13-12-SUMMARY.md
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
// The words: D-05's register, ledgered in 13-COPY-NEW.md. RETIRED BY NAME,
// 2026-09-12 (13.1-02, 13.1-CONTEXT D-05): switchReviewLine and
// replaceReviewTitle, the destination review's two lines.

/**
 * Wire 0 is `Page 1` (13-CONTEXT D-23, batch row I.3.1; Grid Editor's numbering
 * under D-19). The offset is applied where the word is written; every number
 * this module holds, sends and compares is the module's own. One of three
 * copies - none of the three copy modules may import another; the three specs
 * pin wire 0 to `Page 1`.
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
 * 13.1-CONTEXT D-07; ledgered in 13.1-COPY-NEW.md): putBackPageLine and
 * putBackPageLineAfterKeep, the lines under the Put back control.
 */

/**
 * The select's label, the PDF's word. install-copy.ts carries the same string
 * as TARGET_CLICK because neither module may import the other;
 * install-copy.spec.ts pins the twin equal to this.
 */
export const TARGET_LABEL = "Target";

/** The bar's action, PDF pages 3 and 5, verbatim. */
export const APPLY_LABEL = "Apply to ZONA";

/** The firmware-native revert's label: ledgered I.3.9; ships on the /dev/install/ probe until bench row I. */
export const DISCARD_LABEL = "Revert to what’s stored";
