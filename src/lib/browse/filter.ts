// The browse search and the tag chips: folding, matching, intersection, and the
// standing chip row derived from the catalog rather than declared beside it.
//
// Pure functions over data handed in as an argument, for the same reason
// sort.ts and src/lib/coverflow/slots.ts are: this repository collects no
// .svelte.spec.ts in any Vitest project, so matching logic written inside
// BrowseToolbar.svelte would be untested and would look tested.
//
// One `import type` and nothing else. A runtime import of $lib/catalog here
// would drag entries/ported.ts, the vendored compiler and
// @intechstudio/grid-protocol (131,101 bytes, measured in 04-RESEARCH) onto the
// first paint of /browse/ (D-12). filter.spec.ts scans this file.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { ListingEntry } from "$lib/catalog/listing";

/**
 * Case AND diacritic folding, locale-independent.
 *
 * NFD splits a composed letter into its base and its combining mark, the
 * Diacritic property strips the mark, and what is left is comparable: a visitor
 * who types "pinwheel" finds Pinwheel and a visitor who types an accent finds
 * the unaccented word. One line, Unicode-correct, with no a-to-z table to
 * maintain and forget to extend.
 *
 * `.toLowerCase()` and NEVER `.toLocaleLowerCase()`. Under a Turkish locale the
 * latter folds "I" to a dotless i, so a visitor typing "DIAL" would stop
 * finding Dial - matching must not depend on who is looking. (This sentence is
 * the only place the locale-aware name appears; filter.spec.ts strips the
 * comments and asserts it is absent from the code.)
 */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** The folded terms of a query. An empty or whitespace-only query has none. */
function termsOf(query: string): readonly string[] {
  return fold(query)
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/** Everything an entry can be found by, folded once: name, description, tags. */
function haystack(entry: ListingEntry): string {
  return fold([entry.name, entry.description, ...entry.tags].join(" "));
}

/**
 * D-05: free text over name, description and tags, every term required.
 *
 * There is NO power syntax. A typed "$tag:drums" is searched exactly as written
 * and finds nothing, which is the honest answer; silently reinterpreting it as
 * the drums chip would be a query language nobody documented. The feature
 * research and D-05 both refuse one.
 *
 * Multi-term is AND rather than OR because a second word is how a person
 * narrows: "nine drums" should mean Nine pads, not Nine pads plus every other
 * drum entry.
 */
export function matches(entry: ListingEntry, query: string): boolean {
  const terms = termsOf(query);
  if (terms.length === 0) return true;
  const hay = haystack(entry);
  return terms.every((term) => hay.includes(term));
}

/**
 * The search and the tag intersection in one pass. Always a new array.
 *
 * ACTIVE TAGS COMBINE WITH AND (05.1-UI-SPEC.md W-04). Union was considered and
 * rejected in the approved spec: at the time, 32 of the 41 tags sat on exactly
 * one entry, so a union would make a second chip ADD one card to the grid,
 * which reads as a bug rather than as a filter. An unknown tag is not dropped
 * here - it simply intersects to nothing, and the query parser is what drops
 * one it does not know (see allTags).
 *
 * AMENDED BY 10-06 (D-10), AND THE AMENDMENT IS 10-07'S TO WIRE. The vocabulary
 * is now sixteen closed terms in two facets, and the rule becomes: OR within a
 * facet, AND across facets. That is required rather than conventional - `FOR`
 * gives every entry exactly one term, so under a pure AND the second `FOR` chip
 * would always return zero and disable itself. The replacement predicate is
 * matchesFacets() in ./facets.ts and it is already written and tested; this
 * function is unchanged and still the one the toolbar calls, until 10-07.
 */
export function filterListing(
  entries: readonly ListingEntry[],
  query: string,
  tags: readonly string[],
): readonly ListingEntry[] {
  return entries.filter(
    (entry) =>
      tags.every((tag) => entry.tags.includes(tag)) && matches(entry, query),
  );
}

/** How many listed entries carry a tag. */
function countOf(entries: readonly ListingEntry[], tag: string): number {
  return entries.filter((entry) => entry.tags.includes(tag)).length;
}

/** Name ascending, by code point - the same comparison the NAME sort uses. */
function nameAsc(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Every tag any listed entry carries, once each, name ascending. */
export function allTags(entries: readonly ListingEntry[]): readonly string[] {
  const seen = new Set<string>();
  for (const entry of entries) for (const tag of entry.tags) seen.add(tag);
  return [...seen].sort(nameAsc);
}

/**
 * DEPRECATED BY 10-06 (D-10, G-09), AND DELETED BY 10-07 WITH THE TOOLBAR THAT
 * CALLS IT. Do not add a caller.
 *
 * The rule it implements is retired and replaced by name: "chips are the tags
 * carried by two or more entries" becomes "CHIPS ARE THE FACET MEMBERS". The
 * vocabulary is closed at sixteen in ./facets.ts and is not derived from
 * counts, so the row cannot drift as the catalog grows and no entry can move it
 * by arriving. On today's data the two agree exactly - filter.spec.ts test 5
 * asserts the derived row and the declared facets are the same sixteen words,
 * which is the evidence that 10-07's deletion is a replacement rather than a
 * change. The OUTSIDER CHIP in BrowseToolbar.svelte goes at the same time and
 * for the same reason: no active facet member can fall outside a standing row
 * that IS the facet. disabledTags() below is NOT deprecated and stays.
 *
 * D-15: the standing chip row is every tag carried by TWO OR MORE entries,
 * count descending then name ascending.
 *
 * DERIVED, never declared. Most of the vocabulary sits on exactly one entry and
 * stays reachable through the search field, which does that job better than a
 * chip that filters the whole catalog down to one card. Deriving the row means
 * it stays right as the catalog grows, and filter.spec.ts's RECORDED block
 * asserts today's row by name so a data change is visible rather than silent.
 * The census itself lives THERE and is deliberately not restated here: a count
 * in a comment is the thing that teaches the next reader the wrong number.
 */
export function chipTags(entries: readonly ListingEntry[]): readonly string[] {
  return allTags(entries)
    .filter((tag) => countOf(entries, tag) >= 2)
    .sort((a, b) => countOf(entries, b) - countOf(entries, a) || nameAsc(a, b));
}

/**
 * The candidates that would return zero given the active set and the query, so
 * the toolbar can render them as real disabled checkboxes (UI-SPEC W-04) with
 * no adjacent reason line - the cause is the active chips two centimetres away.
 *
 * An already-active candidate is tested against the CURRENT set rather than
 * against itself twice, so an active chip is never reported as its own
 * disabled chip.
 *
 * There is no special case for "nothing active": with an empty active set and
 * an empty query every chip has at least two entries by construction, so the
 * empty result falls out of the derivation instead of being asserted on top of
 * it. When a query alone empties a chip the chip is still reported, and that is
 * deliberate - a click that cannot change the grid should not look live.
 *
 * 10-06 (D-10) LEAVES THIS FUNCTION ALONE, on purpose and by name. It is pure,
 * it is pinned in node, and it is what turns a chip that would empty the grid
 * into a real `disabled` checkbox without printing a number beside the word -
 * so it survives the closed vocabulary intact. What changes is only how OFTEN
 * it fires: under OR-within / AND-across a chip is disabled only when it would
 * return zero given the OTHER facet's active set, which makes it rare rather
 * than common. That narrowing arrives with the predicate in 10-07; here the
 * behaviour is unchanged and asserted unchanged against the new sixteen.
 */
export function disabledTags(
  entries: readonly ListingEntry[],
  query: string,
  active: readonly string[],
  candidates: readonly string[],
): readonly string[] {
  return candidates.filter((tag) => {
    const wanted = active.includes(tag) ? active : [...active, tag];
    return filterListing(entries, query, wanted).length === 0;
  });
}
