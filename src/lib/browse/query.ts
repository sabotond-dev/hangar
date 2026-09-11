// The browse address: `/playground/?sort=name&q=ghost&for=drums&feels=generative`.
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
//     `/playground/` is prerendered, so the page reads the address only behind a
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
//     `resolve("/playground/?" + serialiseBrowseQuery(...))` - `resolve()` accepts a
//     pathname carrying a search string, so the call is lint-clean under
//     `svelte/no-navigation-without-resolve` with no suppression and no cast.
//
// FOUR, SINCE G-10: the legacy `?tag=` parameter is read for one release and
// an unmapped value lands in `q` rather than on the floor. The paragraph at
// parseBrowseQuery says which way each case goes and why it is not the same
// ruling W-12 makes for the two new parameters.
//
// IT IMPORTS ONE THING. No catalog, no `$app`, nothing under the vendor tree,
// nothing that reaches the compile surface: `/playground/` is a prerendered page
// whose whole job is to list sixteen names, and a runtime edge from here to
// `$lib/catalog/index` would drag the 131,101-byte protocol chunk onto its first
// paint (D-12). The facet vocabulary AND the legacy table therefore arrive as
// an ARGUMENT - one object, so adding the legacy half cost no specifier.
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
 * Read a browse view out of an address.
 *
 * `vocabulary` is the closed thirteen and the legacy table, passed in so this
 * module never imports the facets. (Sixteen at 10-06, fourteen after 11-01,
 * thirteen after 12-04 retired `keys` - this module never counts them.)
 *
 * W-12, AND ITS G-10 AMENDMENT. The original paragraph stands for the two new
 * parameters and is quoted here rather than rewritten from memory:
 *
 *   "An unknown tag is DROPPED SILENTLY and renders no chip. Unlike a tuning
 *   stamp the visitor did not author it, there is nothing for them to do about
 *   it, and the count line already tells the truth. Dropping is not cosmetic:
 *   filterListing deliberately does NOT drop an unknown term - it intersects to
 *   nothing - so a term that survived parsing would open the page on an empty
 *   grid."
 *
 * That is still exactly right for an unknown `?for=` or `?feels=`: those are
 * words nobody ever shipped, so no link can honestly carry one. It is WRONG for
 * the legacy `?tag=`, and that is what G-10 amends. The site really did ship
 * fifty-five tags, twenty-seven of them on exactly one entry, and a singleton
 * tag is what somebody sends when they mean THIS ONE CARD. Dropping those would
 * break precisely the links most likely to exist.
 *
 * So `?tag=` is read for one release, and the value decides its own fate:
 *
 *   MAPPED    - the old word has a facet term. It becomes that chip.
 *   SHIPPED,
 *   UNMAPPED  - the word is a key of the legacy table with no term. It becomes
 *               the SEARCH QUERY, which is where the singletons always lived
 *               anyway: they are searchable text on the card, and 05.1 already
 *               argued that a tag filtering the shelf down to one card is a
 *               thing the search field does better. `?tag=looper` lands as
 *               `?q=looper`, and the visitor gets a control they can see and
 *               clear - the job the outsider chip used to do.
 *   NEVER A
 *   TAG       - the word is not a key at all. Dropped, under W-12 unamended:
 *               no link this site ever produced can name it, so it is somebody
 *               else's parameter value rather than a stale address of ours.
 *
 * THE PRECEDENCE, WHICH THE SPEC LEFT OPEN. An explicit `?q=` always wins: a
 * value the visitor typed outranks one inferred from a retired word. An unmapped
 * tag becomes `q` only when `q` is empty. Two unmapped tags join with a single
 * space, in ADDRESS order, because the address is the only order that exists on
 * the reading side. It is never an error, never a 404 and never a message: a
 * stale shared link should land on a working catalog, not on an apology.
 *
 * An unknown `sort` falls back to the default for the same reason: a link
 * carrying a sort nobody ships - `?sort=newest`, for one release the commonest
 * of them - opens on the catalog rather than on an error.
 *
 * A repeated term is one term. The address is a projection of a SET of active
 * chips whose order happens to be meaningful; the same chip twice is still one
 * chip, and reproducing it would render a duplicate control.
 *
 * THE WALK IS OVER THE ADDRESS IN ORDER, not three getAll() passes, so a mapped
 * legacy value and an explicit `?feels=` interleave in the sequence the address
 * actually carries rather than in the order this function happens to look.
 *
 * `q` is trimmed here and only here. The serialiser writes what it is given, so
 * the address a visitor is mid-keystroke in is written verbatim; the trim
 * belongs on the reading side because that is the side that feeds the search.
 * Everything else in the address - a campaign parameter, a page number from
 * some other site's idea of pagination - is ignored rather than rejected.
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
