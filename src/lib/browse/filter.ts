// The browse search and the two facets: folding, matching, and the OR-within /
// AND-across predicate the chips combine by. The derived chip row left this
// file at 10-07 (G-09): the row is the facet members declared in ./facets.ts,
// so nothing is derived and nothing drifts; disabledTags() stayed, its
// predicate narrowed. Pure functions over data handed in as an argument, kept
// out of BrowseToolbar.svelte because this repository collects no
// .svelte.spec.ts. One `import type` and nothing else: a runtime import of
// $lib/catalog would drag the vendored compiler and @intechstudio/grid-protocol
// onto /playground/'s first paint (D-12); filter.spec.ts scans this file.
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

/** The active chips, one list per facet. Either may be empty. */
export type ActiveFacets = {
  readonly for: readonly string[];
  readonly feels: readonly string[];
};

/** Nothing pressed. Frozen, because it is handed out as a shared default. */
export const NO_FACETS: ActiveFacets = Object.freeze({
  for: Object.freeze([]) as readonly string[],
  feels: Object.freeze([]) as readonly string[],
});

/**
 * The search and the facet predicate in one pass. Always a new array. OR WITHIN
 * A FACET, AND ACROSS FACETS (05.1-UI-SPEC W-04 as amended by A-19): under the
 * closed vocabulary FOR gives every entry exactly one term, so a pure AND would
 * kill every second FOR chip. A term nobody carries contributes nothing to its
 * facet's OR; the query parser is what drops one it does not know. The
 * predicate RESTATES matchesFacets() (./facets.ts) rather than importing it -
 * this file may carry one specifier, an `import type` - and filter.spec.ts
 * runs both over every entry and selection and asserts they agree.
 */
export function filterListing(
  entries: readonly ListingEntry[],
  query: string,
  active: ActiveFacets,
): readonly ListingEntry[] {
  const anyOf = (entry: ListingEntry, terms: readonly string[]) =>
    terms.length === 0 || terms.some((term) => entry.tags.includes(term));
  return entries.filter(
    (entry) =>
      anyOf(entry, active.for) &&
      anyOf(entry, active.feels) &&
      matches(entry, query),
  );
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
 * The candidates in one facet's row that would return zero, so the toolbar can
 * render them as real disabled checkboxes (05.1-UI-SPEC W-04) with no adjacent
 * reason line. The question (narrowed at 10-07 for OR-within / AND-across):
 * "would this term, ALONE in its own facet, return zero given the OTHER facet's
 * active set and the query" - which is why the caller says which row it asks
 * about. Rare under a closed vocabulary (`FEELS: playable, generative` leaves
 * three FOR terms on zero), but a rule that fires rarely is the one a visitor
 * has no other way of learning. An active chip is reported disabled only if it
 * genuinely returns nothing; a chip a query alone empties is still reported.
 */
export function disabledTags(
  entries: readonly ListingEntry[],
  query: string,
  active: ActiveFacets,
  facet: "for" | "feels",
  candidates: readonly string[],
): readonly string[] {
  return candidates.filter((term) => {
    const wanted: ActiveFacets =
      facet === "for"
        ? { for: [term], feels: active.feels }
        : { for: active.for, feels: [term] };
    return filterListing(entries, query, wanted).length === 0;
  });
}
