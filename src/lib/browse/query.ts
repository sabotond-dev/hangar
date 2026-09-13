// The browse address: `/playground/?sort=name&q=ghost&for=drums&feels=generative`,
// two pure functions and a default (D-16). Three rules the page depends on: (1)
// this module is never given `page.url` on the server - Kit throws on
// `searchParams` while prerendering, so the page reads the address behind a
// `browser` guard and hands a URLSearchParams here; (2) the address is WRITTEN,
// never read again - `page.url` is stale on write and fresh on Back, so local
// state is the truth and the address its projection; (3) `replaceState`, never
// `pushState` (sixteen chips must not cost sixteen Back presses). Imports one
// thing (./sort): no catalog, no `$app/navigation`, no `$app/state`, nothing
// under vendor - the facet vocabulary and the legacy `?tag=` table are an argument.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { BROWSE_SORTS, DEFAULT_SORT, type BrowseSort } from "./sort";

/** Everything about a browse view that survives being sent to somebody else. */
export type BrowseQuery = {
  readonly sort: BrowseSort;
  readonly q: string;
  /** Active `FOR` chips, in activation order. One `for` each in the address. */
  readonly for: readonly string[];
  /** Active `FEELS` chips, in activation order. One `feels` each. */
  readonly feels: readonly string[];
};

/**
 * The closed vocabulary and the legacy table, handed in rather than imported.
 *
 * `legacy` is a table over every tag the site ever shipped: a value is the facet
 * term the old word became, or `undefined` for a word that shipped and has no
 * honest home now. A key that is ABSENT is a word that was never a tag at all,
 * which is a different thing and is treated differently below. The declaration
 * lives beside the facets; this module only reads it.
 */
export type BrowseVocabulary = {
  readonly for: readonly string[];
  readonly feels: readonly string[];
  readonly legacy: Readonly<Record<string, string | undefined>>;
};

/**
 * The state a plain `/playground/` opens in. Frozen: it is handed straight back as
 * the seed on the server and on any address with nothing in it, so a caller
 * that mutated it would move the default for every later reader.
 */
export const DEFAULT_QUERY: BrowseQuery = Object.freeze({
  sort: DEFAULT_SORT,
  q: "",
  for: Object.freeze([]) as readonly string[],
  feels: Object.freeze([]) as readonly string[],
});

/**
 * Read a browse view out of an address. `vocabulary` is the closed thirteen and
 * the legacy table, passed in so this module never imports the facets.
 *
 * An unknown `?for=` or `?feels=` is DROPPED SILENTLY and renders no chip
 * (W-12: the visitor did not author it, and filterListing would intersect an
 * unknown term to an empty grid). The legacy `?tag=` is read for one release
 * (G-10) and its value decides its own fate: MAPPED - the old word has a facet
 * term and becomes that chip; SHIPPED, UNMAPPED - a key of the legacy table with
 * no term becomes the SEARCH QUERY (`?tag=looper` lands as `?q=looper`: a
 * singleton tag meant this one card, which the search field does better);
 * NEVER A TAG - not a key at all, dropped. An explicit `?q=` always wins; two
 * unmapped tags join with one space in address order. Never an error, never a
 * 404: a stale link lands on a working catalog. An unknown `sort` falls back to
 * the default. A repeated term is one term. The walk is over the address in
 * order, not three getAll() passes, so a mapped legacy value and an explicit
 * `?feels=` interleave as the address carries them. `q` is trimmed here and
 * only here (the serialiser writes what it is given). Everything else in the
 * address is ignored rather than rejected.
 */
export function parseBrowseQuery(
  params: URLSearchParams,
  vocabulary: BrowseVocabulary,
): BrowseQuery {
  const raw = params.get("sort");
  const sort =
    BROWSE_SORTS.find((candidate) => candidate === raw) ?? DEFAULT_SORT;
  const typed = (params.get("q") ?? "").trim();

  const forTerms: string[] = [];
  const feelsTerms: string[] = [];
  const strays: string[] = [];

  const activate = (term: string): void => {
    if (vocabulary.for.includes(term)) {
      if (!forTerms.includes(term)) forTerms.push(term);
      return;
    }
    if (vocabulary.feels.includes(term) && !feelsTerms.includes(term)) {
      feelsTerms.push(term);
    }
  };

  for (const [key, value] of params) {
    if (key === "for" && vocabulary.for.includes(value)) activate(value);
    else if (key === "feels" && vocabulary.feels.includes(value)) {
      activate(value);
    } else if (key === "tag" && value in vocabulary.legacy) {
      const mapped = vocabulary.legacy[value];
      if (mapped === undefined) strays.push(value);
      else activate(mapped);
    }
  }

  const q = typed !== "" ? typed : strays.join(" ");
  return { sort, q, for: forTerms, feels: feelsTerms };
}

/**
 * Write a browse view into an address, WITHOUT the leading `?`.
 *
 * The empty string for the default query, so a plain `/playground/` is the
 * canonical entry and clearing every filter returns to it rather than leaving
 * `?sort=featured&q=` behind. The caller writes `?` only when this is non-empty.
 *
 * The order is 05.1-UI-SPEC.md's, with G-10's two parameters in place of its
 * one: `sort`, then `q`, then one `for` per active `FOR` chip and one `feels`
 * per active `FEELS` chip, each IN ACTIVATION ORDER. Activation order rather
 * than a canonical one because chips are individually removable - the address
 * has to reproduce the sequence the visitor built, or a shared link comes back
 * rearranged.
 *
 * IT NEVER WRITES `tag` AGAIN. The legacy parameter is READ-ONLY for its one
 * release: an address a visitor builds is always the new shape, so the old one
 * can only ever arrive from outside and can be retired by deleting a branch
 * rather than by waiting for the last chip press to stop producing it.
 *
 * `URLSearchParams.toString()` does the encoding, which is the entire reason
 * this function does not build the string by hand: a query of `a&b=c#d` has to
 * survive being a query, and hand-rolled encoding is where that goes wrong.
 */
export function serialiseBrowseQuery(query: BrowseQuery): string {
  const params = new URLSearchParams();
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.q !== "") params.set("q", query.q);
  for (const term of query.for) params.append("for", term);
  for (const term of query.feels) params.append("feels", term);
  return params.toString();
}
