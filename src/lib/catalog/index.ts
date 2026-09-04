// The catalog: the single home for every HANGAR configuration, ported or
// hand-authored (D-09).
//
// One import path for a consumer - the entries, the lookup, the three sorts,
// the types and build() all come from here:
//
//   import { CATALOG, byId, build, type CatalogEntry } from "$lib/catalog";
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { EUCLID } from "./entries/euclid";
import { PORTED } from "./entries/ported";
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

// Hand-authored Lua entries are appended here as they are authored (waves 4-6).
export const CATALOG: readonly CatalogEntry[] = Object.freeze([
  ...PORTED,
  EUCLID,
]);

export { EUCLID } from "./entries/euclid";

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
