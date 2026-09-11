/**
 * THE DEVICE DISCLOSURE'S ONE OPEN STATE, SHARED BY ITS TWO OPENERS (plan
 * 13-11; Bible section 5 D01, section 9 "Device actions", section 15).
 *
 * Until 13-11 the drawer had one opener and one owner: DeviceSlot.svelte held
 * `open` in a local and mounted DeviceDetails.svelte beneath itself, anchored
 * to the header's corner. The Bible re-homes the disclosure's content - the
 * identity, the multi-module line, the snapshot line, DISCONNECT ZONA, FORGET
 * THIS ZONA, and the connection recovery - into the footer as `Device
 * actions`, beside `Help & shortcuts`, on every shell page (PDF pages 2-5).
 * The header keeps its control and its rule - a button whenever a click acts,
 * a summary whenever it does not - and a summary has to expand SOMETHING. So
 * there is now ONE panel with TWO openers: the header's summary states and
 * the footer's label, in two subtrees that share no parent below the layout.
 * A local can no longer be the owner; this module is.
 *
 * WHAT IT HOLDS AND WHAT IT DOES NOT. `open` is the one fact. `opener` is the
 * element focus goes back to when the panel closes - the header's control on
 * the S6 road, where S3's `disabled` has blurred it and document.activeElement
 * is the body by the time the failure arrives (DeviceDetails.svelte, `opener`).
 * Nothing here reads the session, the install store or a phase: the closing
 * rules (a transition into a state with no disclosure, a panel taking the
 * prose) stay in DeviceSlot.svelte's effect, exactly where Phase 6 wrote
 * them, and write through `drawer.open`. Y-11's never-both rule is unchanged
 * by the move: there is still exactly ONE mount of DeviceDetails on the site
 * (DeviceActions.svelte's), so the six-step recovery can never be on the
 * screen twice.
 *
 * `PANEL_ID` is the id both openers name in aria-controls and the id the
 * footer's panel carries; the drawer's click-outside and focus-leaving close
 * paths use the same attribute to recognise an opener, so a click on either
 * opener is the toggle's business and never a close followed by a reopen.
 * One mount, so one static id is safe.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */

/** The footer panel's id; both openers carry it in aria-controls. */
export const PANEL_ID = "device-actions-panel";

/** The selector for an opener of the panel - either of the two. */
export const OPENER_SELECTOR = `[aria-controls="${PANEL_ID}"]`;

let open = $state(false);
let opener = $state.raw<HTMLElement | null>(null);

/** The one drawer: open or not, and where focus returns to. */
export const drawer = {
  get open(): boolean {
    return open;
  },
  set open(next: boolean) {
    open = next;
  },
  get opener(): HTMLElement | null {
    return opener;
  },
  set opener(next: HTMLElement | null) {
    opener = next;
  },
};
