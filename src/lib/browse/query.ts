// The browse address: `/browse/?sort=newest&q=ghost&tag=gestural&tag=generative`.
//
// Two pure functions and a default. The page that uses them arrives in wave 8;
// this is the half that can be tested in node, and D-16 is mostly a statement
// about these two directions, so it is written down here rather than inside a
// component where no Vitest project would ever collect it.
//
// THREE RULES THE PAGE DEPENDS ON. They are decisions, not implementation
// details, and a reader must not have to re-derive them from the framework's
// source a second time.
//
//  1. THIS MODULE IS NEVER GIVEN `page.url` ON THE SERVER. Kit's
//     `respond.js:433-434` calls `disable_search(url)` whenever it is
//     prerendering, and `utils/url.js:174-188` then defines `search` and
//     `searchParams` as properties that THROW
//     ("Cannot access url.searchParams on a page with prerendering enabled").
//     `/browse/` is prerendered, so the page reads the address only behind a
//     `browser` guard, at component-init scope, and hands the result here. This
//     module only ever sees a `URLSearchParams` somebody already had, which is
//     also why it takes one rather than a URL or a string.
//
//  2. THE ADDRESS IS WRITTEN, NEVER READ AGAIN. Kit's `client.js:2551-2581`
//     (`replaceState`) sets `page.state` and re-clones the page object, and
//     never touches `page.url`; the popstate shallow branch at
//     `client.js:2871-2905` DOES call `update_url`. So `page.url` is stale on
//     write and fresh on back - asymmetric, in two directions at once. A
//     `$derived` over it from `$app/state` would go stale the instant the first
//     chip is pressed and then silently correct itself on a Back press. Local
//     state is the source of truth; the address is a projection of it.
//
//  3. `replaceState`, NEVER `pushState`. Sixteen chip presses must not cost
//     sixteen Back presses. It is the same rule Phase 4's coverflow follows when
//     it steps the row, and it is the reason rule 2 has no shallow history entry
//     to disagree with. The page calls it from `$app/navigation`, composing
//     `resolve("/browse/?" + serialiseBrowseQuery(...))` - `resolve()` accepts a
//     pathname carrying a search string, so the call is lint-clean under
//     `svelte/no-navigation-without-resolve` with no suppression and no cast.
//
// IT IMPORTS ONE THING. No catalog, no `$app`, nothing under the vendor tree,
// nothing that reaches the compile surface: `/browse/` is a prerendered page
// whose whole job is to list sixteen names, and a runtime edge from here to
// `$lib/catalog/index` would drag the 131,101-byte protocol chunk onto its first
// paint (D-12). The tag vocabulary therefore arrives as an ARGUMENT.
// `query.spec.ts` scans this file with its comments removed and fails on a
// second specifier or on any of those names appearing in code. The names in
// this header are prose, deliberately, so that scan cannot pass vacuously.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { BROWSE_SORTS, DEFAULT_SORT, type BrowseSort } from "./sort";

/** Everything about a browse view that survives being sent to somebody else. */
export type BrowseQuery = {
  readonly sort: BrowseSort;
  readonly q: string;
  /** In activation order. Repeated once per tag in the address. */
  readonly tags: readonly string[];
};

/**
 * The state a plain `/browse/` opens in. Frozen: it is handed straight back as
 * the seed on the server and on any address with nothing in it, so a caller
 * that mutated it would move the default for every later reader.
 */
export const DEFAULT_QUERY: BrowseQuery = Object.freeze({
  sort: DEFAULT_SORT,
  q: "",
  tags: Object.freeze([]) as readonly string[],
});

/**
 * Read a browse view out of an address.
 *
 * `known` is the catalog's tag vocabulary, passed in so this module never
 * imports the listing. An unknown tag is DROPPED SILENTLY and renders no chip
 * (W-12): unlike a tuning stamp the visitor did not author it, there is nothing
 * for them to do about it, and the count line already tells the truth.
 *
 * Dropping is not cosmetic. `filterListing` deliberately does NOT drop an
 * unknown tag - it intersects to nothing - so a tag that survived parsing would
 * open the page on an empty grid. This function is the one place that rule
 * lives, which is why `filter.ts` needs no notion of a vocabulary at all.
 *
 * An unknown `sort` falls back to the default for the same reason: a link
 * carrying a sort nobody ships opens on the catalog rather than on an error.
 *
 * A repeated tag is one tag. The address is a projection of a SET of active
 * chips whose order happens to be meaningful; the same chip twice is still one
 * chip, and reproducing it would render a duplicate control.
 *
 * `q` is trimmed here and only here. The serialiser writes what it is given, so
 * the address a visitor is mid-keystroke in is written verbatim; the trim
 * belongs on the reading side because that is the side that feeds the search.
 * Everything else in the address - a campaign parameter, a page number from
 * some other site's idea of pagination - is ignored rather than rejected.
 */
export function parseBrowseQuery(
  params: URLSearchParams,
  known: readonly string[],
): BrowseQuery {
  const raw = params.get("sort");
  const sort =
    BROWSE_SORTS.find((candidate) => candidate === raw) ?? DEFAULT_SORT;
  const q = (params.get("q") ?? "").trim();

  const vocabulary = new Set(known);
  const tags: string[] = [];
  for (const tag of params.getAll("tag")) {
    if (!vocabulary.has(tag) || tags.includes(tag)) continue;
    tags.push(tag);
  }

  return { sort, q, tags };
}

/**
 * Write a browse view into an address, WITHOUT the leading `?`.
 *
 * The empty string for the default query, so a plain `/browse/` is the
 * canonical entry and clearing every filter returns to it rather than leaving
 * `?sort=featured&q=` behind. The caller writes `?` only when this is non-empty.
 *
 * The order is the one 05.1-UI-SPEC.md prints: `sort`, then `q`, then one `tag`
 * per active tag IN ACTIVATION ORDER. Activation order rather than a canonical
 * one because chips are individually removable - the address has to reproduce
 * the sequence the visitor built, or a shared link comes back rearranged.
 *
 * `URLSearchParams.toString()` does the encoding, which is the entire reason
 * this function does not build the string by hand: a query of `a&b=c#d` has to
 * survive being a query, and hand-rolled encoding is where that goes wrong.
 */
export function serialiseBrowseQuery(query: BrowseQuery): string {
  const params = new URLSearchParams();
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.q !== "") params.set("q", query.q);
  for (const tag of query.tags) params.append("tag", tag);
  return params.toString();
}
