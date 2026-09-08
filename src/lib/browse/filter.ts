// The browse search and the two facets: folding, matching, and the OR-within /
// AND-across predicate the chips combine by.
//
// THE DERIVED CHIP ROW LEFT THIS FILE IN 10-07 (G-09). chipTags() computed
// "every tag two or more entries carry, count descending"; the row is now the
// facet members declared in ./facets.ts, so there is nothing to derive and
// nothing that can drift as the catalog grows. filter.spec.ts asserted the two
// were the same sixteen words on the shipped data before the deletion, which is
// what made it a replacement rather than a change. disabledTags() below did NOT
// go with it; its predicate narrowed instead.
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
 * The search and the facet predicate in one pass. Always a new array.
 *
 * OR WITHIN A FACET, AND ACROSS FACETS. This is 05.1-UI-SPEC.md W-04's
 * "active tags combine with AND" as amended by A-19, and the paragraph W-04
 * gave for AND is kept here rather than deleted, because it was RIGHT about the
 * data it was written against: at the time 32 of the 41 tags sat on exactly one
 * entry, so a union would have made a second chip ADD one card to the grid,
 * which reads as a bug rather than as a filter. D-10 re-cut the vocabulary and
 * the argument inverted with it. Under the closed sixteen `FOR` gives every
 * entry EXACTLY ONE term, so under a pure AND any second `FOR` chip would
 * return zero and immediately disable itself - and a facet whose second click
 * is always dead is not a facet.
 *
 * A TERM NOBODY CARRIES IS NOT DROPPED HERE - it simply contributes nothing to
 * its facet's OR, and if it is the only term in that facet the facet returns
 * nothing. The query parser is what drops one it does not know.
 *
 * THE PREDICATE IS A RESTATEMENT OF matchesFacets() IN ./facets.ts, NOT AN
 * IMPORT, and the reason is the same one sort.ts gives for restating nameAsc:
 * this file is scanned by filter.spec.ts and may carry exactly one specifier,
 * an `import type`. Restating three lines is cheaper than widening a scan that
 * exists to keep the browse page's first paint free of the 131,101-byte
 * compiler chunk. A restatement with no gate is a divergence waiting to happen,
 * so filter.spec.ts runs this function and matchesFacets() over every entry and
 * every selection it tests and asserts they agree entry by entry.
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
 * reason line - the cause is the active chips two centimetres away.
 *
 * THE PREDICATE NARROWED IN 10-07 AND THE FUNCTION SURVIVED. It used to ask
 * "would adding this tag to the active set empty the grid". Under OR-within /
 * AND-across that question is wrong twice over: adding a term to its OWN facet
 * can only ever WIDEN the result, so a chip beside an active sibling would
 * never disable, and a chip in the other facet has to be judged against that
 * other facet alone. The question is now "would this term, ALONE in its own
 * facet, return zero given the OTHER facet's active set and the query" - which
 * is why the caller says which row it is asking about instead of the function
 * guessing from the term.
 *
 * That makes it RARE rather than common, which is the honest consequence of a
 * closed vocabulary: with nothing active every chip is live by construction,
 * and it takes a real cross-facet emptiness - `FEELS: playable, generative`
 * leaves `FOR: mixing`, `shortcuts` and `pointing` on zero entries - to fire.
 * Rare is not never, and a rule that fires rarely is exactly the one a visitor
 * has no other way of learning.
 *
 * An already-active candidate is judged by the same question as any other, so
 * an active chip is reported disabled only if it genuinely returns nothing -
 * never merely because it is already on.
 *
 * When a QUERY alone empties a chip the chip is still reported, and that is
 * deliberate - a click that cannot change the grid should not look live.
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
