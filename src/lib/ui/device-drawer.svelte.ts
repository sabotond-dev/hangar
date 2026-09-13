/**
 * THE DEVICE DISCLOSURE'S ONE OPEN STATE, SHARED BY ITS TWO OPENERS (Bible
 * section 5 D01, section 9 "Device actions", section 15). Since 13-11 the
 * disclosure's content lives in the footer as `Device actions` on every shell
 * page, and the header keeps its control - a button whenever a click acts, a
 * summary whenever it does not - so ONE panel has TWO openers in two subtrees
 * that share no parent below the layout, and this module owns `open` instead
 * of a local. `opener` is the element focus returns to when the panel closes.
 * Nothing here reads the session, the store or a phase: the closing rules stay
 * in DeviceSlot.svelte's effect and write through `drawer.open`. One mount of
 * DeviceDetails (DeviceActions.svelte's); `PANEL_ID` is the one static id both openers name.
 * Decided at 13-11; see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md
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
