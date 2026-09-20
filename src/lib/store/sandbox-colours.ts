// The Sandbox's recent colours (change 13C, BENCH-2026-09-16.txt section 13, suggestion 13): the
// last eight colours the viewer applied through the swatch, newest first, so the inspector's strip
// can hand one back with a click. One envelope under SANDBOX_COLOURS_KEY (schema.ts's
// RecentColours), read whole and validated whole - a corrupt or foreign envelope reads as empty
// and is replaced by the next write. The store is an ARGUMENT and every function is a no-op on
// undefined (local.ts's three rules). `rememberColour` is the one rule: the colour moves to the
// front, once, and the list keeps at most the cap.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readJson, writeJson, type LocalStore } from "./local";
import {
  NO_COLOURS,
  RECENT_COLOURS_CAP,
  SANDBOX_COLOURS_KEY,
  SCHEMA_VERSION,
  isRecentColours,
  type RecentColours,
} from "./schema";

export { NO_COLOURS, RECENT_COLOURS_CAP };

type Levels = readonly [number, number, number];

const same = (a: Levels, b: Levels): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * The list with a colour applied: the colour first, an earlier copy of it removed, the oldest
 * dropped past the cap. The same object back when the colour is already first.
 */
export function rememberColour(
  recent: RecentColours,
  colour: Levels,
): RecentColours {
  const first = recent.colours[0];
  if (first !== undefined && same(first, colour)) return recent;
  const rest = recent.colours.filter((c) => !same(c, colour));
  const newest: Levels = [colour[0], colour[1], colour[2]];
  return {
    schema: SCHEMA_VERSION,
    colours: [newest, ...rest].slice(0, RECENT_COLOURS_CAP),
  };
}

/** The stored colours, or the empty envelope for an absent, corrupt or refusing store. */
export function readRecentColours(
  store: LocalStore | undefined,
): RecentColours {
  return readJson(store, SANDBOX_COLOURS_KEY, isRecentColours) ?? NO_COLOURS;
}

/** Write the envelope whole. `false` when the store refused. */
export function writeRecentColours(
  store: LocalStore | undefined,
  recent: RecentColours,
): boolean {
  return writeJson(store, SANDBOX_COLOURS_KEY, recent);
}
