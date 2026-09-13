// The browse search and the two facets, pinned against the shipped data.
//
// Three things here are contracts rather than implementation details, and each
// has its own test:
//
//   D-05  search is free text over name, description and tags, and there is NO
//         power syntax - a typed "$tag:play" is four literal words, not a
//         query language (test 3).
//   W-04  active chips INTERSECT. Union was considered and rejected in the
//         approved spec: most tags sat on exactly one entry, so a union would
//         make a second chip ADD one card, which reads as a bug. RETIRED AND
//         REPLACED BY NAME IN 10-07 (A-19): within a facet chips are OR, across
//         facets they are AND (test 4). The old rule was right about the data it
//         was written against and wrong about the closed sixteen, where `FOR`
//         gives every entry exactly one term - so a second `FOR` chip under a
//         pure AND would return zero and disable itself for ever.
//   D-15  the standing chip row is every tag carried by two or more entries -
//         DERIVED from the data. RETIRED BY 10-06 (G-09) and DELETED IN 10-07
//         with chipTags() itself: CHIPS ARE THE FACET MEMBERS. Test 5 now holds
//         the declared row against the data instead of a derivation against a
//         declaration, which is the shape a closed vocabulary wants.
//
// DERIVED, OR RECORDED. The rule that decides every number in this file:
//
//   A number that is ARITHMETIC OVER THE SHIPPED DATA is derived. A number that
//   is A REVIEW OF THE SHIPPED DATA stays a literal, in one named block, so
//   that changing it is a decision somebody made rather than a test somebody
//   silenced.
//
// So the id lists, the per-term expectations and the disabled row are computed
// from LISTING with the same predicate the module is being asked about, and the
// census - how many entries, how many terms, how many singletons and how many
// entries carry each - lives in RECORDED and nowhere else.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LISTING } from "$lib/catalog/listing";
import { FEELS_TERMS, FOR_TERMS, matchesFacets } from "./facets";
import {
  allTags,
  disabledTags,
  filterListing,
  fold,
  matches,
  NO_FACETS,
  type ActiveFacets,
} from "./filter";
import { stripComments } from "../../test-support/source";

const SOURCE_PATH = fileURLToPath(new URL("./filter.ts", import.meta.url));

const ids = (entries: readonly { id: string }[]) => entries.map((e) => e.id);
const byId = (id: string) => {
  const entry = LISTING.find((e) => e.id === id);
  if (entry === undefined) throw new Error(`no listing entry ${id}`);
  return entry;
};

/** The ids carrying a term, in listing order - the predicate, restated. */
const carrying = (tag: string) =>
  LISTING.filter((e) => e.tags.includes(tag)).map((e) => e.id);

/** A selection, spelled out, so a test never has to name an empty facet. */
const active = (
  forTerms: readonly string[] = [],
  feelsTerms: readonly string[] = [],
): ActiveFacets => ({ for: forTerms, feels: feelsTerms });

/**
 * THE GATE OVER THE RESTATEMENT. filterListing() restates matchesFacets()
 * rather than importing it, because filter.ts may carry exactly one specifier
 * and it is an `import type` (test 1). A restatement with no gate is a
 * divergence waiting to happen, so every selection this file tests is run
 * through BOTH and asserted to agree entry by entry.
 */
const agreesWithFacets = (selection: ActiveFacets, query = "") => {
  const fromFilter = ids(filterListing(LISTING, query, selection));
  const fromFacets = LISTING.filter(
    (e) => matchesFacets(e, selection) && matches(e, query),
  ).map((e) => e.id);
  expect(
    fromFilter,
    `filterListing and matchesFacets disagree on for=[${selection.for}] feels=[${selection.feels}] q="${query}"`,
  ).toEqual(fromFacets);
  return fromFilter;
};

/**
 * The search predicate written out HERE rather than imported, so that agreeing
 * with it is evidence rather than a tautology: every folded term must appear
 * somewhere in the folded name, description and tags.
 */
const search = (query: string) =>
  LISTING.filter((e) => {
    const hay = fold([e.name, e.description, ...e.tags].join(" "));
    return fold(query)
      .split(" ")
      .filter((term) => term !== "")
      .every((term) => hay.includes(term));
  }).map((e) => e.id);

/**
 * TODAY'S VOCABULARY CENSUS, RECORDED ON PURPOSE.
 *
 * Derived facts - what a term selects, what two of them select together - are
 * asserted as rules below and need no maintenance. These are a REVIEW: they say
 * what the vocabulary currently looks like, so a wave that changes it sees what
 * it moved and decides whether it likes it. A wave updates this block; it never
 * deletes an assertion against it.
 *
 * 10-06 (D-10) RETIRED THE DERIVATION AND 10-07 (G-09) DELETED IT.
 *
 *   was  "chips are the tags carried by two or more entries"
 *   is   "chips are the facet members"
 *
 * So `chips` and `chipCounts` are gone from this block with chipTags() itself.
 * They were a census of a derivation's output; there is no derivation left, and
 * restating FOR_TERMS and FEELS_TERMS here would be a second declaration of the
 * row rather than a review of the data. What replaces them is `counts` - how
 * many entries carry each of the sixteen - which is a fact ABOUT THE DATA and
 * is exactly what a wave that lands an entry needs to look at.
 *
 * `singletons` IS ZERO, AND IT IS ASSERTED RATHER THAN OMITTED. It was 27 of
 * 55 - three quarters of the vocabulary matching a single card each, which is
 * what D-10 was raised about. Zero is the whole point of a closed vocabulary,
 * and an omitted zero is how a closed vocabulary quietly reopens.
 *
 * Re-recorded by: 08-06 (sixteen entries), then 09-03 (nineteen), then 09-04
 * (twenty-two), then 09-05 (twenty-five), then 09-06 (twenty-eight), then 09-07
 * (thirty-one), then 09-08 (thirty-four), then 09-09 (thirty-six) - which was
 * the last entry wave of phase 09 and the finished OPEN vocabulary - then
 * 10-06, which re-cut all thirty-six entries from 55 terms to 16, then 10-07,
 * which deleted the derivation the old shape of this block described, then
 * 11-01, THE FIRST WAVE THAT EVER SHRANK IT.
 *
 * 11-01 (D-01) removed nine configurations on the user's bench report and
 * retired two FOR terms rather than weaken `singletons: 0`. `entries` 36 to 27,
 * `tags` 16 to 14, and every count below re-observed. `drums` and `clips` are
 * gone as keys; `play` and `shortcuts` each gained the one carrier that was
 * re-homed onto it. `singletons` IS STILL ZERO, which is the whole point of the
 * decision.
 *
 * THIS FILE IS NOT IN 11-01-PLAN.md'S BLAST-RADIUS TABLE. It was found by
 * running the suite, and the omission is reported in 11-01-SUMMARY.md rather
 * than quietly absorbed. 11-15 found it the same way, and 11-15-PLAN.md does
 * not name it either.
 *
 * 11-15 (the wheels) is the first wave since 11-01 to move these numbers and
 * the first ever to move them UPWARDS BY ONE ENTRY. `entries` 27 to 28,
 * `modulation` 7 to 8 - a pitch and mod wheel pair is the modulation section of
 * a keyboard - `expressive` 11 to 12 and `precise` 6 to 7. THE `precise` MOVE
 * LIFTS THAT TERM OFF THE FLOOR facets.spec.ts asserts, which is a consequence
 * of a tag chosen for being true and never a reason it was chosen: `still` is
 * the tag that would have left the floor alone and it is simply not true of a
 * card whose whole gesture is something moving after the finger has gone.
 * `singletons` is still zero.
 *
 * 11-14 (RADAR POINTS) moves it upwards by one entry again, under the
 * user's answer `new-entry` - the RADAR preset stays and a hand-authored
 * radar lands beside it. `entries` 28 to 29, `sequencing` 3 to 4, `generative`
 * 12 to 13 and `playable` 8 to 9: the same three tags as SONAR, chosen because
 * they are true of this card for the same reasons, and NOT re-chosen to spread
 * the histogram, which D-03 forbids. No term touches the floor of 6 and
 * `singletons` is still zero. Found the same way as the two above - by running
 * the suite - and 11-14-PLAN.md does not name this file either.
 *
 * 12-04 IS THE FIRST WAVE TO MOVE THESE NUMBERS DOWNWARDS SINCE 11-01, and the
 * first ever to move the vocabulary and the listing in the same direction. The
 * second bench round removed LATTICE, FORGE and SHUTTLE: `entries` 29 to 26,
 * `tags` 14 to 13, and every count below re-observed. `keys` is gone as a term
 * - it fell to CHORUS alone and was RETIRED rather than the zero-singleton rule
 * being weakened - CHORUS is on `play`, which makes `play` three, and LUMEN
 * moved from `expressive` to `still` so that `still` stays at its floor of six
 * after FORGE left. `singletons` IS STILL ZERO, twice over now. This file IS in
 * 12-04-PLAN.md's blast-radius table, which is the first time it has been.
 *
 * This block has a reader outside the repository's source: 05.1-UI-SPEC.md,
 * "The tag chips", quoted the row and its counts verbatim. 10-06 amended that
 * document by name rather than restating the new row there, and 12-04 does the
 * same: 05.1-UI-SPEC.md is amended by name and the row is not restated in it.
 */
const RECORDED = {
  entries: 26,
  tags: 13,
  singletons: 0,
  /** Keyed by term, in FOR order then FEELS order - the toolbar's own order. */
  counts: {
    modulation: 7,
    show: 5,
    sequencing: 4,
    mixing: 3,
    play: 3,
    shortcuts: 2,
    pointing: 2,
    readable: 9,
    expressive: 10,
    playable: 8,
    generative: 12,
    precise: 7,
    still: 6,
  } as Readonly<Record<string, number>>,
} as const;

describe("the browse filter (src/lib/browse/filter.ts)", () => {
  it("folds case and diacritics, and does it locale-independently", () => {
    expect(
      fold("PÍNWHEEL "),
      "upper case, an accent and a trailing space",
    ).toBe("pinwheel");
    expect(fold(fold("PÍNWHEEL ")), "folding is idempotent").toBe("pinwheel");

    // A composed U+00E9 and a decomposed e + U+0301 are different bytes and the
    // same word. NFD-then-strip is what makes them fold to one.
    expect(fold("café"), "composed").toBe("cafe");
    expect(fold("café"), "decomposed").toBe("cafe");

    // The mechanical half: matching must not depend on the visitor's locale.
    // .toLocaleLowerCase() under a Turkish locale folds I to a dotless i, so a
    // search for "DIAL" would stop finding Dial. The module says .toLowerCase()
    // in prose; this asserts it in code.
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = stripComments(source);
    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(1000);
    expect(
      source,
      "the prose reason survives in the source, comments included",
    ).toContain("toLocaleLowerCase");
    expect(stripped, "filter.ts names toLocaleLowerCase in CODE").not.toContain(
      "toLocaleLowerCase",
    );
    expect(stripped, "filter.ts names Intl in CODE").not.toContain("Intl");

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    const erased = [
      ...stripped.matchAll(/import[ ]+type[^;]*?from[ ]+["']([^"']+)["']/g),
    ].map((match) => match[1]);
    expect(specifiers, "filter.ts imports exactly one thing").toEqual([
      "$lib/catalog/listing",
    ]);
    expect(
      specifiers,
      "every specifier in filter.ts sits on an import type line",
    ).toEqual(erased);
  });

  it("searches the name, the description and the tags, and requires every term", () => {
    // A FLOOR, not an equality: this assertion's job is non-vacuity - that the
    // listing was actually read - and the catalog's size is RECORDED once, in
    // the census above, rather than restated in every test that touches it.
    expect(
      LISTING.length,
      "the listing was actually read",
    ).toBeGreaterThanOrEqual(RECORDED.entries);

    // One term from each of the three fields, each found on exactly one entry.
    expect(matches(byId("pinwheel"), "pinwheel"), "a term in the name").toBe(
      true,
    );
    expect(
      matches(byId("aurora"), "glowing"),
      "a term in the description only",
    ).toBe(true);
    // "sequencing" is one of EUCLID's three tags and appears in neither its
    // name nor its description, which is what makes it a tags-only term. It
    // replaces "polyrhythm", which was one of the twenty-seven singletons D-10
    // retired - and a search that could only be anchored on a singleton is
    // itself a symptom of the vocabulary this plan re-cut.
    expect(
      matches(byId("euclid"), "sequencing"),
      "a term in the tags only",
    ).toBe(true);
    expect(
      matches(byId("aurora"), "sequencing"),
      "and a term nothing on this entry carries",
    ).toBe(false);

    // An empty query - and a whitespace-only one - is not a filter.
    for (const entry of LISTING) {
      expect(matches(entry, ""), `${entry.id}: an empty query matches`).toBe(
        true,
      );
      expect(matches(entry, "   "), `${entry.id}: spaces are not a term`).toBe(
        true,
      );
    }

    // Two terms are AND, and they may come from different fields: "nine" is in
    // Nine pads' name, "playable" is one of its tags. The expectation is DERIVED
    // from the search predicate restated at the top of this file, and the
    // property that catches an OR is asserted beside it: the second term must
    // narrow the result without emptying it.
    //
    // THE PAIR MOVED IN 10-06 AND THE REASON IS THE POINT. It was "drums" and
    // "nine drums". D-10 gave "drums" to the two entries that were drum pads,
    // Nine pads and SLAM - and BOTH of them say "Nine" in their first word, so
    // the second term stopped narrowing anything: 2 of 2. "playable" was
    // carried by thirteen entries and four of them say "nine", which is 4 of 13
    // and a real narrowing again. AT 27 ENTRIES (plan 11-01) "playable" is
    // carried by eight, which is still a narrowing and still derived - the
    // numbers in this paragraph are the ones observed when it was written and
    // the assertions below are computed, so neither has to be edited again.
    const oneTerm = search("playable");
    const twoTerms = search("nine playable");
    expect(
      oneTerm.length,
      "playable alone is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(twoTerms.length, "nine playable still finds some").toBeGreaterThan(
      0,
    );
    expect(
      twoTerms.length,
      "the second term narrows rather than widens",
    ).toBeLessThan(oneTerm.length);

    expect(
      ids(LISTING.filter((e) => matches(e, "playable"))),
      "one term",
    ).toEqual(oneTerm);
    expect(
      ids(LISTING.filter((e) => matches(e, "nine playable"))),
      "both terms required",
    ).toEqual(twoTerms);
    expect(
      ids(LISTING.filter((e) => matches(e, "  NINE   PlAyAbLe  "))),
      "case and repeated spaces change nothing",
    ).toEqual(twoTerms);
  });

  it("has no power syntax: a typed $tag: is four literal characters", () => {
    // D-05 and the feature research both refuse a query language. "$tag:play"
    // is searched as written, and nothing in the catalog contains it, so the
    // honest answer is zero results and the empty state - not a silent
    // reinterpretation as the play chip.
    //
    // The sample was "$tag:drums" until plan 11-01 retired `drums` under D-01.
    // `play` is a live FOR term and `ninepads` is the card that moved onto it,
    // so the pair below still asks the question this test was written for: a
    // real chip name, prefixed, must find nothing.
    expect(
      ids(LISTING.filter((e) => matches(e, "$tag:play"))),
      "$tag:play is a literal and matches nothing",
    ).toEqual([]);
    expect(
      ids(filterListing(LISTING, "$tag:play", NO_FACETS)),
      "filterListing agrees",
    ).toEqual([]);

    // Proof that it is the literal, not the word: dropping the prefix finds the
    // entries again - derived, so a new instrument configuration joins the list
    // instead of reddening it.
    expect(search("play").length, "play alone finds entries").toBeGreaterThan(
      1,
    );
    expect(
      ids(filterListing(LISTING, "play", NO_FACETS)),
      "play alone",
    ).toEqual(search("play"));
  });

  it("ORs within a facet and ANDs across them, and an unknown term returns nothing", () => {
    // A-19, AND IT IS AN INVERSION RATHER THAN AN EXTENSION. W-04 said two
    // chips INTERSECT and this test asserted `both.length <= min(either)`.
    // Under the closed sixteen the two chips it used - `playable` and
    // `generative` - are both FEELS terms, so pressing both is a UNION and
    // every one of those assertions inverts. The old direction is kept as the
    // cross-facet half below, where it is still true.
    const generative = agreesWithFacets(active([], ["generative"]));
    const playable = agreesWithFacets(active([], ["playable"]));

    // Each chip returns exactly the entries carrying it - derived, with a floor
    // beside it so a predicate that returned everything could not pass.
    expect(
      carrying("generative").length,
      "generative is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(generative, "the generative chip").toEqual(carrying("generative"));
    expect(
      carrying("playable").length,
      "playable is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(playable, "the playable chip").toEqual(carrying("playable"));

    // OR WITHIN A FACET. The union is LARGER than either chip alone, which is
    // the mutation this assertion exists to catch in the opposite direction
    // from the one it used to catch: an intersection would be smaller than
    // either. It is > rather than >=, and it is non-vacuous on the shipped
    // data because the two chips do not have the same carriers.
    const union = agreesWithFacets(active([], ["playable", "generative"]));
    expect(union, "two chips in one facet are a union").toEqual(
      ids(
        LISTING.filter(
          (e) =>
            carrying("playable").includes(e.id) ||
            carrying("generative").includes(e.id),
        ),
      ),
    );
    expect(
      union.length,
      "the union is larger than either chip alone",
    ).toBeGreaterThan(playable.length);
    expect(union.length, "and it is not simply the whole shelf").toBeLessThan(
      LISTING.length,
    );

    // AND ACROSS FACETS. A FOR chip on top of the two FEELS chips is an
    // INTERSECTION of the two facets' answers, which is the half of the rule a
    // union-only test would never see. `modulation` is chosen because it is
    // one of the FOR terms that is NOT emptied by those two FEELS chips - three
    // of them are, which is what the disabled row below is about.
    const across = agreesWithFacets(
      active(["modulation"], ["playable", "generative"]),
    );
    expect(across, "FOR x FEELS is an intersection").toEqual(
      union.filter((id) => carrying("modulation").includes(id)),
    );
    expect(
      across.length,
      "the cross-facet press narrows the union rather than widening it",
    ).toBeLessThan(union.length);
    expect(
      across.length,
      "and it does not empty the grid, or the AND half would be vacuous",
    ).toBeGreaterThan(0);

    // TWO FOR CHIPS ARE A UNION TOO, which is the case that makes the OR rule
    // REQUIRED rather than conventional: every entry carries exactly one FOR
    // term, so under a pure AND this would be empty for every pair on the
    // shelf and the second click in that row would be dead for ever.
    // The pair was drums / keys until plan 11-01 retired `drums` (D-01).
    const twoFor = agreesWithFacets(active(["play", "keys"]));
    expect(twoFor.length, "two FOR chips under AND would be zero").toBe(
      carrying("play").length + carrying("keys").length,
    );
    expect(
      twoFor.length,
      "and the union is not empty, or the union half would be vacuous",
    ).toBeGreaterThan(0);
    expect(
      LISTING.filter((e) => e.tags.includes("play") && e.tags.includes("keys")),
      "no entry carries two FOR terms, which is why AND-within is impossible",
    ).toEqual([]);

    expect(
      ids(filterListing(LISTING, "", active(["nosuchterm"]))),
      "a term nobody carries shows nothing, never everything",
    ).toEqual([]);
    expect(
      ids(filterListing(LISTING, "", active(["play", "nosuchterm"]))),
      "but inside a facet it is an OR, so it cannot empty a live set",
    ).toEqual(carrying("play"));

    expect(
      ids(filterListing(LISTING, "", NO_FACETS)),
      "no chips and no query is the whole catalog, in listing order",
    ).toEqual(ids(LISTING));
    expect(
      ids(filterListing(LISTING, "ghost", NO_FACETS)),
      "no chips is everything the query allows",
    ).toEqual(["ghost"]);
    expect(
      agreesWithFacets(active([], ["generative"]), "ghost"),
      "query and chips are ANDed too",
    ).toEqual(["ghost"]);
    expect(
      agreesWithFacets(active(["play"]), "ghost"),
      "and they can disagree",
    ).toEqual([]);

    // filterListing never hands back the caller's array.
    const input = [...LISTING];
    expect(filterListing(input, "", NO_FACETS)).not.toBe(input);
  });

  it("stands thirteen chips, and every one of them is carried by two or more entries", () => {
    const row = [...FOR_TERMS, ...FEELS_TERMS];
    const known = allTags(LISTING);
    const count = (tag: string) =>
      LISTING.filter((e) => e.tags.includes(tag)).length;

    expect(known, "the recorded distinct-term census").toHaveLength(
      RECORDED.tags,
    );
    expect(
      row,
      "the standing row IS the two facets, in their order",
    ).toHaveLength(RECORDED.tags);

    // THE ROW AND THE DATA ARE THE SAME THIRTEEN WORDS, in both directions. This
    // is what chipTags() used to compute and what its deletion replaced: on the
    // shipped data the retired derivation and the declared vocabulary agreed
    // exactly, which is why the swap was a replacement rather than a change.
    expect(
      [...row].sort(),
      "the declared row and the words the catalog carries are the same set",
    ).toEqual([...known].sort());

    // The counts, recorded. A wave that lands an entry moves one of these and
    // has to say so.
    expect(
      Object.keys(RECORDED.counts),
      "the recorded counts cover the row, in the row's own order",
    ).toEqual(row);
    for (const term of row) {
      expect(count(term), `${term}: the recorded carrier count`).toBe(
        RECORDED.counts[term],
      );
    }

    // THE RULE, not the list. Every member is carried by two or more entries -
    // health rule 1 seen from the filter's side - and NO term matches exactly
    // one card, which is the thing D-10 was raised about and the thing a closed
    // vocabulary is for. RECORDED.singletons is 0 and is asserted rather than
    // omitted: an omitted zero is how a closed vocabulary quietly reopens.
    for (const term of row) {
      expect(count(term), `${term} is a chip`).toBeGreaterThanOrEqual(2);
    }
    const singletons = known.filter((tag) => count(tag) === 1);
    expect(
      singletons,
      "a term matching exactly one card is a thing search does better",
    ).toHaveLength(RECORDED.singletons);
    const strangers = known.filter(
      (tag) => !(row as readonly string[]).includes(tag),
    );
    expect(
      strangers,
      "no tag is left out of the row: the vocabulary is closed and every member is a chip",
    ).toEqual([]);
  });

  it("disables a chip that would return nothing given the OTHER facet, and disables none when nothing is active", () => {
    expect(
      disabledTags(LISTING, "", NO_FACETS, "for", FOR_TERMS),
      "with nothing active and nothing typed, every FOR chip is live",
    ).toEqual([]);
    expect(
      disabledTags(LISTING, "", NO_FACETS, "feels", FEELS_TERMS),
      "with nothing active and nothing typed, every FEELS chip is live",
    ).toEqual([]);

    // THE NARROWED PREDICATE, AND THE HALF THAT NOW NEVER FIRES. Adding a term
    // to its OWN facet can only widen the result, so a chip beside an active
    // sibling is never disabled by it - asserted, because the old predicate
    // would have disabled most of the row here.
    const feelsActive = active([], ["playable", "generative"]);
    expect(
      disabledTags(LISTING, "", feelsActive, "feels", FEELS_TERMS),
      "a chip in the SAME facet as an active one can only widen, so none is dead",
    ).toEqual([]);

    // AND THE HALF THAT DOES. Judged against the other facet's active set, the
    // FOR terms no `playable` or `generative` entry carries are real disabled
    // checkboxes. DERIVED with the same question the module answers, in the
    // order the module returns them.
    const blocked = disabledTags(LISTING, "", feelsActive, "for", FOR_TERMS);
    const shouldBlock = FOR_TERMS.filter(
      (term) =>
        filterListing(LISTING, "", {
          for: [term],
          feels: feelsActive.feels,
        }).length === 0,
    );
    expect(
      blocked,
      "the FOR chips that would return zero beside playable and generative",
    ).toEqual(shouldBlock);
    // Neither empty nor everything, so the test still says something. This is
    // what "rare rather than common" looks like on the shipped data.
    expect(
      blocked.length,
      "some FOR chip is dead beside those two FEELS chips - if none is, the narrowing has made this rule vacuous rather than rare",
    ).toBeGreaterThan(0);
    expect(blocked.length, "and not every FOR chip is dead").toBeLessThan(
      FOR_TERMS.length,
    );

    // Every reported chip really is empty, and every unreported one really is
    // not: the guard against a list that is right by luck.
    for (const term of FOR_TERMS) {
      const size = filterListing(LISTING, "", {
        for: [term],
        feels: feelsActive.feels,
      }).length;
      if (blocked.includes(term)) {
        expect(size, `${term} was reported disabled`).toBe(0);
      } else {
        expect(size, `${term} was reported live`).toBeGreaterThan(0);
      }
    }

    // AN ACTIVE CHIP IS JUDGED BY THE SAME QUESTION AS ANY OTHER, so it is
    // never reported disabled merely for being on.
    const forActive = active(["play"], []);
    expect(
      disabledTags(LISTING, "", forActive, "for", FOR_TERMS),
      "an active chip is never its own disabled chip",
    ).not.toContain("play");
    expect(
      disabledTags(LISTING, "", forActive, "feels", FEELS_TERMS),
      "playable survives - the play entries carry it too",
    ).not.toContain("playable");

    // A QUERY ALONE CAN EMPTY A CHIP, and the chip is still reported: a click
    // that cannot change the grid should not look live.
    const byQuery = disabledTags(LISTING, "ghost", NO_FACETS, "for", FOR_TERMS);
    expect(
      byQuery.length,
      "a query narrow enough to leave one card kills most of the row",
    ).toBeGreaterThan(0);
    expect(byQuery, "and never the one it leaves standing").not.toContain(
      "modulation",
    );
  });
});
