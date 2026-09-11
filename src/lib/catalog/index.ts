// The catalog: the single home for every HANGAR configuration, ported or
// hand-authored (D-09).
//
// One import path for a consumer - the entries, the lookup, the three sorts,
// the types and build() all come from here:
//
//   import { CATALOG, byId, build, type CatalogEntry } from "$lib/catalog";
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { ARC } from "./entries/arc";
import { CHORUS } from "./entries/chorus";
import { CONSOLE } from "./entries/console";
import { CULL } from "./entries/cull";
import { EUCLID } from "./entries/euclid";
import { GHOST } from "./entries/ghost";
import { LUMEN } from "./entries/lumen";
import { MORPH } from "./entries/morph";
import { POMODORO } from "./entries/pomodoro";
import { PORTED } from "./entries/ported";
import { QUADRANT } from "./entries/quadrant";
import { RADAR_POINTS } from "./entries/radar-points";
import { SNAKE } from "./entries/snake";
import { SONAR } from "./entries/sonar";
import { STAGE } from "./entries/stage";
import { STRIP } from "./entries/strip";
import { STEPS } from "./entries/steps";
import { TRACKPAD } from "./entries/trackpad";
import { WHEELS } from "./entries/wheels";
import type { CatalogEntry } from "./types";

export {
  build,
  previewFor,
  KNOB_KINDS,
  ZONA_MODULE_TYPE,
  EVENT_SETUP,
  EVENT_TIMER,
} from "./types";
export type {
  CatalogEntry,
  CatalogSource,
  LuaKnob,
  PadConfigObject,
} from "./types";

// Hand-authored Lua entries are appended here as they are authored: Phase 8's
// seven first, then Phase 9's twenty in the order their waves land.
//
// PORTED is EIGHT of the nine shelf presets since plan 12-10: the `tpad`
// preset left the catalog when TRACKPAD, the last entry below, replaced it
// as the one trackpad card under the user's answer "selectable tuning
// options under Trackpad". The preset itself stays on the shelf in
// ./presets.ts as the compiler's over-budget fixture; see entries/ported.ts.
export const CATALOG: readonly CatalogEntry[] = Object.freeze([
  ...PORTED,
  EUCLID,
  CHORUS,
  ARC,
  GHOST,
  MORPH,
  SONAR,
  STEPS,
  CONSOLE,
  STRIP,
  LUMEN,
  STAGE,
  CULL,
  SNAKE,
  QUADRANT,
  POMODORO,
  WHEELS,
  RADAR_POINTS,
  TRACKPAD,
]);

export { EUCLID } from "./entries/euclid";
export { CHORUS } from "./entries/chorus";
export { ARC } from "./entries/arc";
export { GHOST } from "./entries/ghost";
export { MORPH } from "./entries/morph";
export { SONAR } from "./entries/sonar";
export { STEPS } from "./entries/steps";
export { CONSOLE } from "./entries/console";
export { STRIP } from "./entries/strip";
export { LUMEN } from "./entries/lumen";
export { STAGE } from "./entries/stage";
export { CULL } from "./entries/cull";
export { SNAKE } from "./entries/snake";
export { QUADRANT } from "./entries/quadrant";
export { POMODORO } from "./entries/pomodoro";
export { WHEELS } from "./entries/wheels";
export { RADAR_POINTS } from "./entries/radar-points";
export { TRACKPAD } from "./entries/trackpad";
export { portedEntry } from "./entries/ported";

/** The one lookup. Returns undefined for an id no entry claims. */
export function byId(id: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}

// A plain comparison, never localeCompare: the order a page renders must not
// depend on the runner's or the visitor's locale.
function nameAsc(a: CatalogEntry, b: CatalogEntry): number {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
}

// Every sort returns a NEW array. CATALOG is frozen and is never reordered in
// place, so two callers sorting differently cannot see each other's order.

/** Featured first, then by name. */
export function byFeatured(): readonly CatalogEntry[] {
  return [...CATALOG].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || nameAsc(a, b),
  );
}

/** Newest addedAt first, ties broken by name. */
export function byNewest(): readonly CatalogEntry[] {
  return [...CATALOG].sort((a, b) => {
    if (a.addedAt < b.addedAt) return 1;
    if (a.addedAt > b.addedAt) return -1;
    return nameAsc(a, b);
  });
}

/** Name ascending. */
export function byName(): readonly CatalogEntry[] {
  return [...CATALOG].sort(nameAsc);
}
