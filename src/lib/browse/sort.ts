// The two orders a visitor can put the catalog in: Featured and Name. Newest
// was the third and D-11 removed it (`addedAt` held three distinct values over
// thirty-six entries, one covering twenty - a block in name order, not a
// ranking); a MOTION order was rejected as redundant with the FEELS facet.
// Pure arithmetic over data handed in as an argument, kept out of
// BrowseToolbar.svelte because this repository collects no .svelte.spec.ts and
// a comparator inside a component would look tested. Imports one type and
// nothing else: a runtime import of $lib/catalog would put the vendored compiler
// and @intechstudio/grid-protocol on /playground/'s first paint (D-12);
// sort.spec.ts scans this file for a second specifier.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { ListingEntry } from "$lib/catalog/listing";

/** The two, in the toolbar's order: FEATURED, NAME. */
export type BrowseSort = "featured" | "name";

export const BROWSE_SORTS: readonly BrowseSort[] = Object.freeze([
  "featured",
  "name",
]);

/** 05.1-UI-SPEC.md, The sort control: the default is FEATURED. */
export const DEFAULT_SORT: BrowseSort = "featured";

/**
 * Name ascending, by code point. NEVER a locale-aware comparison - no
 * localeCompare, no Intl.Collator (D-10 as amended: the order a page renders
 * must not depend on the runner's or the visitor's locale; the two names appear
 * in this sentence only, and sort.spec.ts scans the code to keep it that way).
 * A RESTATEMENT of src/lib/catalog/index.ts's module-private comparator, gated
 * in sort.spec.ts against byFeatured() and byName() element for element - do
 * not reconcile the two by exporting from index.ts. The id tie-break is what
 * makes both orders total: ids are unique, so the last lines cannot tie.
 */
const byNameThenId = (a: ListingEntry, b: ListingEntry): number => {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
};

/**
 * D-10 as amended: featured first, then name. Agrees with catalog byFeatured().
 *
 * `addedAt` is deliberately NOT a tie-break inside the featured group, and
 * since D-11 it is not on a ListingEntry at all: three distinct dates over
 * thirty-six entries with twenty of them sharing one, so a date tie-break here
 * would have been a coin toss dressed as an order.
 */
export const featuredOrder = (a: ListingEntry, b: ListingEntry): number =>
  Number(b.featured) - Number(a.featured) || byNameThenId(a, b);

/** Name ascending. Agrees with byName(). */
export const nameOrder = byNameThenId;

/** The comparator for a sort. Exhaustive over BrowseSort. */
export function orderFor(
  sort: BrowseSort,
): (a: ListingEntry, b: ListingEntry) => number {
  if (sort === "featured") return featuredOrder;
  return nameOrder;
}

/**
 * Always a NEW array. LISTING is frozen and is never reordered in place, so two
 * callers sorting differently cannot see each other's order - and neither can a
 * component that happens to hold the same array.
 */
export function sortListing(
  entries: readonly ListingEntry[],
  sort: BrowseSort,
): readonly ListingEntry[] {
  return [...entries].sort(orderFor(sort));
}
