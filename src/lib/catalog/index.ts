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
import { EUCLID } from "./entries/euclid";
import { GHOST } from "./entries/ghost";
import { GRIDLOCK } from "./entries/gridlock";
import { HOLD } from "./entries/hold";
import { KEYS } from "./entries/keys";
import { LEARN } from "./entries/learn";
import { LATTICE } from "./entries/lattice";
import { LUMEN } from "./entries/lumen";
import { MORPH } from "./entries/morph";
import { PORTED } from "./entries/ported";
import { SHUTTLE } from "./entries/shuttle";
import { SLAM } from "./entries/slam";
import { SONAR } from "./entries/sonar";
import { STAGE } from "./entries/stage";
import { STRIP } from "./entries/strip";
import { STEPS } from "./entries/steps";
import { TABLE } from "./entries/table";
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
export const CATALOG: readonly CatalogEntry[] = Object.freeze([
  ...PORTED,
  EUCLID,
  CHORUS,
  ARC,
  GHOST,
  LATTICE,
  MORPH,
  SONAR,
  HOLD,
  STEPS,
  SLAM,
  KEYS,
  GRIDLOCK,
  TABLE,
  CONSOLE,
  STRIP,
  LEARN,
  LUMEN,
  STAGE,
  SHUTTLE,
]);

export { EUCLID } from "./entries/euclid";
export { CHORUS } from "./entries/chorus";
export { ARC } from "./entries/arc";
export { GHOST } from "./entries/ghost";
export { LATTICE } from "./entries/lattice";
export { MORPH } from "./entries/morph";
export { SONAR } from "./entries/sonar";
export { HOLD } from "./entries/hold";
export { STEPS } from "./entries/steps";
export { SLAM } from "./entries/slam";
export { KEYS } from "./entries/keys";
export { GRIDLOCK } from "./entries/gridlock";
export { TABLE } from "./entries/table";
export { CONSOLE } from "./entries/console";
export { STRIP } from "./entries/strip";
export { LEARN } from "./entries/learn";
export { LUMEN } from "./entries/lumen";
export { STAGE } from "./entries/stage";
export { SHUTTLE } from "./entries/shuttle";

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
