/**
 * THE CONTEXT BAR'S DEVICE CLAUSE: one line per install phase (Bible section
 * 9 "Device state", sections 15 and 16). The bar's status zone reads
 * `● {draft} · {device}`; the device half is the install store's phase as ONE
 * clause, every clause install-copy.ts's own caption, busy label or failure
 * title, so the bar and the install block cannot word a state differently.
 * Fourteen phases against the spec's twelve rows (fifteen until 2026-09-16,
 * when the store's `unconfirmed` left by the user's word): the session's
 * three rows are the header's control, "Draft differs" is the draft clause,
 * "Transfer uncertain" is THREE clauses (device-ui.spec.ts asserts them
 * pairwise distinct), and four phases the spec has no row for - restored,
 * restored-unconfirmed, cleared, snapshot-failed - are the safety rail.
 * Decided at 13-11; see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import type { InstallPhase } from "$lib/device/install.svelte";
import {
  IDENTIFIED_CAPTION,
  SNAPSHOTTING_CAPTION,
  clearedCaption,
  keepingLabel,
  keptCaption,
  keptMismatchBlock,
  lostBlock,
  nothingLandedBlock,
  partialBlock,
  restoredCaption,
  restoredUnconfirmedBlock,
  settledCaption,
  snapshotFailedBlock,
} from "$lib/device/install-copy";

/**
 * How the bar's dot reads a phase: `live` for a state the module confirmed
 * (the action colour), `busy` for a leg in flight, `uncertain` for the six
 * titles that end without a proof (full ink, never the alarm red -
 * Z-01: the red means one thing on this page), `none` for idle.
 */
export type DeviceTone = "none" | "busy" | "live" | "uncertain";

/** The three phases the spec's one "Transfer uncertain" row maps onto (four until 2026-09-16). Kept as a list so a test can walk it. */
export const UNCERTAIN_PHASES: readonly InstallPhase[] = [
  "kept-mismatch",
  "partial",
  "nothing-landed",
];

/** The four phases the spec has no row for. Kept as a list so a test can name them. */
export const UNCHARTED_PHASES: readonly InstallPhase[] = [
  "restored",
  "restored-unconfirmed",
  "cleared",
  "snapshot-failed",
];

/**
 * The device clause for a phase, or undefined for `idle`, which has none.
 * `page` is the page the clause names, as the module reports it (the copy
 * adds one, D-23): the snapshot's page, which the route reads off the store.
 * The six titles never name a page, so a representative 0 gives a title;
 * the confirmed captions do, so they take the real one.
 */
export function deviceClause(
  phase: InstallPhase,
  page: number,
): string | undefined {
  switch (phase) {
    case "idle":
      return undefined;
    case "snapshotting":
      return SNAPSHOTTING_CAPTION;
    case "ready":
      return IDENTIFIED_CAPTION;
    case "writing":
      return keepingLabel(page);
    case "settled":
      return settledCaption(page);
    case "restored":
      return restoredCaption(page);
    case "kept":
      return keptCaption(page);
    case "cleared":
      return clearedCaption(page);
    case "kept-mismatch":
      return keptMismatchBlock(0).title;
    case "partial":
      return partialBlock(
        "The system timer and the page init",
        "the utility script, the Timer and the Setup",
        0,
      ).title;
    case "nothing-landed":
      return nothingLandedBlock("store", 0).title;
    case "restored-unconfirmed":
      return restoredUnconfirmedBlock(0).title;
    case "lost":
      return lostBlock(false, "", 0).title;
    case "snapshot-failed":
      return snapshotFailedBlock(0).title;
  }
}

/** The dot's tone for a phase. */
export function deviceTone(phase: InstallPhase): DeviceTone {
  switch (phase) {
    case "idle":
      return "none";
    case "snapshotting":
    case "writing":
      return "busy";
    case "ready":
    case "settled":
    case "restored":
    case "kept":
    case "cleared":
      return "live";
    case "kept-mismatch":
    case "partial":
    case "nothing-landed":
    case "restored-unconfirmed":
    case "lost":
    case "snapshot-failed":
      return "uncertain";
  }
}
