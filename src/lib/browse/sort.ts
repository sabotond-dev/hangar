// The three orders a visitor can put the catalog in: Featured, Newest, Name.
//
// Pure arithmetic over data handed in as an argument. It lives here rather than
// inside BrowseToolbar.svelte for the reason src/lib/coverflow/slots.ts gives:
// this repository collects no .svelte.spec.ts in any Vitest project, so a
// comparator written inside a component is untested and LOOKS tested.
//
// It imports one type and nothing else. A runtime `import { byName } from
// "$lib/catalog"` here would put entries/ported.ts - and through it the
// vendored compiler and @intechstudio/grid-protocol, 131,101 bytes measured in
// 04-RESEARCH - on the first paint of a page whose entire job is to list
// sixteen names (D-12). sort.spec.ts scans this file and fails on a second
// specifier or on one that is not `import type`.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { ListingEntry } from "$lib/catalog/listing";

/** The three, in the toolbar's order: FEATURED, NEWEST, NAME. */
export type BrowseSort = "featured" | "newest" | "name";

export const BROWSE_SORTS: readonly BrowseSort[] = Object.freeze([
  "featured",
  "newest",
  "name",
]);

/** 05.1-UI-SPEC.md, The sort control: the default is FEATURED. */
export const DEFAULT_SORT: BrowseSort = "featured";

/**
 * Name ascending, by code point.
 *
 * NEVER a locale-aware comparison - no localeCompare, no Intl.Collator, and
 * sort.spec.ts scans this file with its comments removed to keep it that way.
 * (The two names appear in this sentence and nowhere else in the module; the
 * scan reads code only, and asserts the prose survives, so a stripper that ate
 * the whole source cannot pass vacuously.)
 *
 * This is D-10 as amended, and the reason is
 * already written into src/lib/catalog/index.ts beside the function this one
 * restates: the order a page renders must not depend on the runner's or the
 * visitor's locale. 05.1-UI-SPEC.md W-08 AGREES and names this comparator by
 * name. What is superseded is 05.1-RESEARCH.md - its Standard Stack row and its
 * "Don't Hand-Roll" row both recommend a case-folding collator, and both were
 * overtaken by the D-10 amendment. Anybody reading the research and reaching
 * for one should stop here.
 *
 * index.ts's own comparator is module-private, so this is a RESTATEMENT rather
 * than an import, gated in sort.spec.ts against the byFeatured(), byNewest()
 * and byName() id sequences element for element. Do not reconcile the two by
 * exporting from - or editing - index.ts.
 *
 * THE ID TIE-BREAK IS WHAT MAKES ALL THREE ORDERS TOTAL. Two entries sharing a
 * name would otherwise compare 0 and Array.prototype.sort's stability, not this
 * function, would be deciding the page. Ids are unique by construction, so the
 * last three lines cannot themselves tie.
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
 * `addedAt` is deliberately NOT a tie-break inside the featured group. Only two
 * distinct dates exist across the sixteen, so a date tie-break there would be a
 * coin toss dressed as an order.
 */
export const featuredOrder = (a: ListingEntry, b: ListingEntry): number =>
  Number(b.featured) - Number(a.featured) || byNameThenId(a, b);

/** D-10 as amended: addedAt descending, then name. Agrees with byNewest(). */
export const newestOrder = (a: ListingEntry, b: ListingEntry): number => {
  if (a.addedAt < b.addedAt) return 1;
  if (a.addedAt > b.addedAt) return -1;
  return byNameThenId(a, b);
};

/** Name ascending. Agrees with byName(). */
export const nameOrder = byNameThenId;

/** The comparator for a sort. Exhaustive over BrowseSort. */
export function orderFor(
  sort: BrowseSort,
): (a: ListingEntry, b: ListingEntry) => number {
  if (sort === "featured") return featuredOrder;
  if (sort === "newest") return newestOrder;
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
