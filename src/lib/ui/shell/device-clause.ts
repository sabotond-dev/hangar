/**
 * THE CONTEXT BAR'S DEVICE CLAUSE: one line per install phase, Phase 10's
 * words (plan 13-11; Bible section 9 "Device state", section 15 "Draft/device
 * status", section 16).
 *
 * The bar's status zone reads `● {draft} · {device}` on PDF pages 3 and 5.
 * The device half is the install store's phase, rendered as ONE clause: the
 * spec's twelve visible labels sit against HANGAR's FIFTEEN phases, and this
 * table is where the two meet, row by row. It is a labelling exercise over
 * strings that already exist - every clause below is install-copy.ts's own
 * caption, busy label or failure title, so the bar and the install block
 * under the surface cannot word a state differently. 13-18 rewrites the words
 * (section 16's "Applied to Page 2. Store on ZONA to keep it after power-off",
 * "Stored on ZONA · Page 2", and the six lines the uncertain phases still
 * need); this module will then read the new constants and its shape will not
 * move.
 *
 * FIFTEEN PHASES, TWELVE SPEC ROWS, FOUR ROWS THE SPEC NEVER HAD. The table:
 *
 *   spec row              phase(s)                       clause
 *   No connection         (the session's, not a phase)   - the header's control
 *   Permission needed /   (the session's, not a phase)   - the header's control
 *   denied
 *   Unsupported env.      (the session's capability)     - the header's control
 *   Ready                 ready                          IDENTIFIED_CAPTION
 *   Draft differs         (the tuner's dirty flag)       - the DRAFT clause, 13-13
 *   Applying              writing                        WRITING_LABEL
 *   Applied temporarily   settled                        SETTLED_CAPTION
 *   Storing               writing, leg = store           WRITING_LABEL (the leg
 *                                                        is not read here)
 *   Stored                kept                           KEPT_CAPTION
 *   Transfer uncertain    FOUR phases, FOUR clauses:     the four titles
 *                         unconfirmed, kept-mismatch,
 *                         partial, nothing-landed
 *   Disconnected          lost                           lostBlock's title
 *   -                     snapshotting                   SNAPSHOTTING_CAPTION
 *   -                     restored                       RESTORED_CAPTION
 *   -                     restored-unconfirmed           its title
 *   -                     cleared                        CLEARED_CAPTION
 *   -                     snapshot-failed                its title
 *   -                     idle                           no clause
 *
 * THE FOUR UNCERTAIN PHASES ARE FOUR CLAUSES AND NOT ONE. Section 16 offers a
 * single line for "Unknown transfer result"; HANGAR measured four different
 * outcomes (the store unconfirmed with the RAM landed; the store acknowledged
 * but the read-back different; some of the three strings landed and some not;
 * nothing landed) and tells them apart, and four outcomes told apart is
 * strictly more honest than one sentence. device-ui.spec.ts test 15 asserts
 * the four clauses are pairwise distinct so the collapse cannot land quietly.
 *
 * THE FOUR ROWS THE SPEC HAS NO LINE FOR ARE THE SAFETY RAIL. `restored` and
 * `restored-unconfirmed` are PUT BACK's two outcomes, `cleared` is the
 * firmware default playing, `snapshot-failed` is the refusal to write over
 * something not yet copied. They are named here rather than folded into a
 * neighbour: after a clear neither "playing now" nor "restored" is true, and
 * the second is unsafe (install.svelte.ts, `InstallPhase`).
 *
 * WHY THE TITLES COME THROUGH THE BLOCK BUILDERS. install-copy.ts keeps the
 * seven failure titles module-private and exports the builders that carry
 * them; a title never depends on a builder's arguments (12-03 kept PARTIAL's
 * title fixed when the detail changed), so a representative argument gives
 * the title. That keeps this plan out of the copy module, which is 13-18's.
 *
 * Zero imports beyond the copy module and the phase type; the chunk guard's
 * permitted paths (config-shape.spec.ts test 13).
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import type { InstallPhase } from "$lib/device/install.svelte";
import {
  CLEARED_CAPTION,
  IDENTIFIED_CAPTION,
  KEPT_CAPTION,
  RESTORED_CAPTION,
  SETTLED_CAPTION,
  SNAPSHOTTING_CAPTION,
  WRITING_LABEL,
  keptMismatchBlock,
  lostBlock,
  nothingLandedBlock,
  partialBlock,
  restoredUnconfirmedBlock,
  snapshotFailedBlock,
  unconfirmedBlock,
} from "$lib/device/install-copy";

/**
 * How the bar's dot reads a phase: `live` for a state the module confirmed
 * (the action colour), `busy` for a leg in flight, `uncertain` for the six
 * titles that end without a confirmation (full ink, never the alarm red -
 * KeepConfirm.svelte says why the red means one thing on this page), `none`
 * for idle.
 */
export type DeviceTone = "none" | "busy" | "live" | "uncertain";

/** The four phases the spec's one "Transfer uncertain" row maps onto. Kept as a list so a test can walk it. */
export const UNCERTAIN_PHASES: readonly InstallPhase[] = [
  "unconfirmed",
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

/** The device clause for a phase, or undefined for `idle`, which has none. */
export function deviceClause(phase: InstallPhase): string | undefined {
  switch (phase) {
    case "idle":
      return undefined;
    case "snapshotting":
      return SNAPSHOTTING_CAPTION;
    case "ready":
      return IDENTIFIED_CAPTION;
    case "writing":
      return WRITING_LABEL;
    case "settled":
      return SETTLED_CAPTION;
    case "restored":
      return RESTORED_CAPTION;
    case "kept":
      return KEPT_CAPTION;
    case "cleared":
      return CLEARED_CAPTION;
    case "unconfirmed":
      return unconfirmedBlock("").title;
    case "kept-mismatch":
      return keptMismatchBlock().title;
    case "partial":
      return partialBlock(
        "The system timer and the page init",
        "the Timer and the Setup",
      ).title;
    case "nothing-landed":
      return nothingLandedBlock("try").title;
    case "restored-unconfirmed":
      return restoredUnconfirmedBlock().title;
    case "lost":
      return lostBlock(false, "").title;
    case "snapshot-failed":
      return snapshotFailedBlock().title;
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
    case "unconfirmed":
    case "kept-mismatch":
    case "partial":
    case "nothing-landed":
    case "restored-unconfirmed":
    case "lost":
    case "snapshot-failed":
      return "uncertain";
  }
}
