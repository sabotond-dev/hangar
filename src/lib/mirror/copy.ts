// The live mirror's words (change 20, docs/MIRROR.md section 6), in one module, as every surface's
// copy is: the toggle, the plate's status line, the line that says what the mirror cannot show,
// and the two monitors' labels while they read the ZONA instead of the simulator. Imports nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The toggle beside the mode switch. The same words on and off: aria-pressed carries the state. */
export const MIRROR_LABEL = "Mirror ZONA";

/** The toggle's description: what a click does, and that it writes nothing to the configuration. */
export const MIRROR_HELPER =
  "Show what your ZONA is lighting and the MIDI it sends. Read-only: nothing is stored or changed.";

/**
 * The plate's status line while mirroring, where the finger's coordinates are while simulating.
 * `page` is the module's own, zero-based as the wire carries it; the line counts from one.
 */
export function mirrorStatus(
  page: number | undefined,
  lit: boolean,
  silent: boolean,
): string {
  const head =
    page === undefined ? "Mirroring ZONA" : `Mirroring ZONA · page ${page + 1}`;
  if (lit) return head;
  return silent
    ? `${head} · no lights reported`
    : `${head} · waiting for its lights`;
}

/** What the protocol cannot give, said on the plate (docs/MIRROR.md section 2). */
export const MIRROR_CANNOT =
  "These are your ZONA's own lights and MIDI. It does not report where your fingers are.";

/** The Playground monitor's source column and status while mirroring. */
export const MIRROR_MONITOR_SOURCE = "ZONA";
export const MIRROR_MONITOR_STATUS = "From your ZONA · read-only";
export const MIRROR_MONITOR_EMPTY =
  "Nothing sent yet. Play your ZONA and what it sends shows here.";

/** The Sandbox's Play monitor while mirroring. */
export const MIRROR_PLAY_MONITOR = "MIDI from ZONA";
export const MIRROR_PLAY_MONITOR_HELPER =
  "The last twelve messages your ZONA sent, newest first.";
