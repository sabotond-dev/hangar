// Favorites: the catalog entries a visitor starred, as an ordered list of entry
// ids. Not one of section 9's three objects - a mark on an entry, and the
// interface may say "Favorites" and nothing about saving. An id the catalog no
// longer carries is DROPPED ON READ AND THE DROP IS COUNTED (twelve entries
// left the catalog at 11-01 and 12-04; a silently shorter list is the coy state
// D-05 forbids), so readFavorites returns the count beside the list. The
// validator is an argument, never an import: the catalog is a heavy module and
// a store must load at a prerendered page's first paint. Reading never writes -
// the pruned list is what the next star or unstar stores. Order-stable: a new
// favorite goes at the end, an unstar removes in place, nothing sorts.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { probe, writeJson, type LocalStore } from "./local";
import { FAVORITES_KEY, SCHEMA_VERSION, isEnvelope } from "./schema";

/** The envelope under hangar.favorites.v1. */
type FavoritesEnvelope = { schema: 1; ids: string[] };

const isFavoritesEnvelope = (value: unknown): value is FavoritesEnvelope => {
  if (!isEnvelope(value)) return false;
  const ids = (value as { ids?: unknown }).ids;
  return Array.isArray(ids) && ids.every((id) => typeof id === "string");
};

/** True when the catalog still carries the id. Passed in; never imported. */
export type IsKnownEntry = (id: string) => boolean;

/** The list a screen shows, and how many ids were left out of it. */
export type Favorites = {
  readonly ids: readonly string[];
  /** Ids in the store that the validator rejected. Zero on a healthy store. */
  readonly dropped: number;
};

function load(store: LocalStore | undefined): string[] | undefined {
  const found = probe(store, FAVORITES_KEY, isFavoritesEnvelope);
  if (found.state === "refused") return undefined;
  return found.state === "present" ? found.value.ids : [];
}

/** Split a stored list into the ids the catalog still carries and the count it does not. */
function prune(ids: readonly string[], isKnown: IsKnownEntry): Favorites {
  const kept: string[] = [];
  let dropped = 0;
  for (const id of ids) {
    if (isKnown(id)) kept.push(id);
    else dropped += 1;
  }
  return { ids: kept, dropped };
}

/** The favorites the catalog still carries, in the visitor's order, with the drop count. */
export function readFavorites(
  store: LocalStore | undefined,
  isKnown: IsKnownEntry,
): Favorites {
  const ids = load(store);
  if (ids === undefined) return { ids: [], dropped: 0 };
  return prune(ids, isKnown);
}

/** True when the id is starred. Membership needs no validator: an unknown id is simply never asked about. */
export function isFavorite(store: LocalStore | undefined, id: string): boolean {
  return (load(store) ?? []).includes(id);
}

/**
 * Star or unstar one id. The list written back is pruned with the
 * validator, so the drops readFavorites counted are gone after the next
 * change. `true` when stored; `false` when the store refused.
 */
export function setFavorite(
  store: LocalStore | undefined,
  id: string,
  on: boolean,
  isKnown: IsKnownEntry,
): boolean {
  const current = load(store);
  if (current === undefined) return false;
  const kept = prune(current, isKnown).ids.filter((known) => known !== id);
  const ids = on ? [...kept, id] : kept;
  if (on && !isKnown(id)) return false;
  return writeJson(store, FAVORITES_KEY, { schema: SCHEMA_VERSION, ids });
}

/** Flip one id. The new state, or `undefined` when the store refused. */
export function toggleFavorite(
  store: LocalStore | undefined,
  id: string,
  isKnown: IsKnownEntry,
): boolean | undefined {
  const on = !isFavorite(store, id);
  return setFavorite(store, id, on, isKnown) ? on : undefined;
}
