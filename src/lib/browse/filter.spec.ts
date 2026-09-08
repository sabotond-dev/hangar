// The browse search and the tag intersection, pinned against the shipped data.
//
// Three things here are contracts rather than implementation details, and each
// has its own test:
//
//   D-05  search is free text over name, description and tags, and there is NO
//         power syntax - a typed "$tag:drums" is four literal words, not a
//         query language (test 3).
//   W-04  active chips INTERSECT. Union was considered and rejected in the
//         approved spec: most tags sat on exactly one entry, so a union would
//         make a second chip ADD one card, which reads as a bug (test 4).
//         AMENDED BY 10-06 (D-10), and the amendment is 10-07's to wire: within
//         a facet chips are OR, across facets they are AND - see
//         matchesFacets() in ./facets.ts and the reason written above it. What
//         filterListing() does is unchanged in this plan and asserted here
//         unchanged; the two predicates coexist until 10-07 retires one.
//   D-15  the standing chip row is every tag carried by two or more entries -
//         DERIVED from the data (test 5). RETIRED BY 10-06 (G-09), and
//         replaced by name: CHIPS ARE THE FACET MEMBERS. The vocabulary is
//         closed at sixteen in ./facets.ts and is not derived from counts, so
//         the row cannot drift as the catalog grows and no entry can move it by
//         arriving. chipTags() still computes the old row and this test still
//         pins it, because the toolbar still calls it; both go in 10-07.
//
// DERIVED, OR RECORDED. The rule that decides every number in this file:
//
//   A number that is ARITHMETIC OVER THE SHIPPED DATA is derived. A number that
//   is A REVIEW OF THE SHIPPED DATA stays a literal, in one named block, so
//   that changing it is a decision somebody made rather than a test somebody
//   silenced.
//
// So the id lists, the per-tag expectations and the disabled row are computed
// from LISTING with the same predicate the module is being asked about, and the
// census - how many entries, how many tags, how many singletons, and which
// chips stand - lives in RECORDED and nowhere else.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LISTING } from "$lib/catalog/listing";
import { FEELS_TERMS, FOR_TERMS } from "./facets";
import {
  allTags,
  chipTags,
  disabledTags,
  filterListing,
  fold,
  matches,
} from "./filter";

const SOURCE_PATH = fileURLToPath(new URL("./filter.ts", import.meta.url));

/** Line and block comments removed, so a structural scan reads code only. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

const ids = (entries: readonly { id: string }[]) => entries.map((e) => e.id);
const byId = (id: string) => {
  const entry = LISTING.find((e) => e.id === id);
  if (entry === undefined) throw new Error(`no listing entry ${id}`);
  return entry;
};

/** The ids carrying a tag, in listing order - the tag predicate, restated. */
const carrying = (tag: string) =>
  LISTING.filter((e) => e.tags.includes(tag)).map((e) => e.id);

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
 * TODAY'S TAG CENSUS, RECORDED ON PURPOSE.
 *
 * Derived facts - a chip is a tag two or more entries carry, count descending
 * then name ascending (filter.ts) - are asserted as rules below and need no
 * maintenance. These four are a REVIEW: they say what the vocabulary currently
 * looks like, so a wave that changes it sees the row it moved and decides
 * whether it likes it. A wave updates this block; it never deletes an assertion
 * against it.
 *
 * 10-06 (D-10), 2026-09-08: THE DERIVATION IS RETIRED AND REPLACED BY NAME.
 *
 *   was  "chips are the tags carried by two or more entries"
 *   is   "chips are the facet members"                              (G-09)
 *
 * The vocabulary is CLOSED at sixteen and DECLARED in ./facets.ts - ten `FOR`
 * terms and six `FEELS`, exactly three on every entry - so it is no longer
 * derived from counts, does not drift as the catalog grows, and no entry can
 * move the row by arriving. The `chips` and `chipCounts` arrays below therefore
 * stop being a census of what happened and become a restatement of a declared
 * list, which is why they retire in 10-07 with the toolbar that calls
 * chipTags(). They are re-recorded here rather than deleted so that this
 * commit's data change is visible in one diff.
 *
 * `singletons` IS ZERO, AND IT IS ASSERTED RATHER THAN OMITTED. It was 27 of
 * 55 - three quarters of the vocabulary matching a single card each, which is
 * what D-10 was raised about. Zero is the whole point of a closed vocabulary,
 * and an omitted zero is how a closed vocabulary quietly reopens: a wave that
 * coined one word would move `tags` and nothing would say the row had grown a
 * term that matches one card.
 *
 * Re-recorded by: 08-06 (sixteen entries), then 09-03 (nineteen), then 09-04
 * (twenty-two), then 09-05 (twenty-five), then 09-06 (twenty-eight), then 09-07
 * (thirty-one), then 09-08 (thirty-four), then 09-09 (thirty-six) - which was
 * the last entry wave of phase 09 and the finished OPEN vocabulary - then
 * 10-06, which re-cut all thirty-six entries from 55 terms to 16.
 *
 * This block has a reader outside the repository's source: 05.1-UI-SPEC.md,
 * "The tag chips", quoted the row and its counts verbatim. 10-06 amends that
 * document by name rather than restating the new row there.
 */
const RECORDED = {
  entries: 36,
  tags: 16,
  singletons: 0,
  chips: [
    "readable",
    "expressive",
    "generative",
    "playable",
    "modulation",
    "precise",
    "still",
    "show",
    "keys",
    "mixing",
    "play",
    "pointing",
    "sequencing",
    "shortcuts",
    "clips",
    "drums",
  ] as const,
  chipCounts: [16, 14, 13, 13, 9, 8, 8, 5, 3, 3, 3, 3, 3, 3, 2, 2] as const,
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
    const stripped = strip(source);
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
    // "nine drums". D-10 gives "drums" to the two entries that are drum pads,
    // Nine pads and SLAM - and BOTH of them say "Nine" in their first word, so
    // the second term stopped narrowing anything: 2 of 2. "playable" is carried
    // by thirteen entries and four of them say "nine", which is 4 of 13 and a
    // real narrowing again.
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
    // D-05 and the feature research both refuse a query language. "$tag:drums"
    // is searched as written, and nothing in the catalog contains it, so the
    // honest answer is zero results and the empty state - not a silent
    // reinterpretation as the drums chip.
    expect(
      ids(LISTING.filter((e) => matches(e, "$tag:drums"))),
      "$tag:drums is a literal and matches nothing",
    ).toEqual([]);
    expect(
      ids(filterListing(LISTING, "$tag:drums", [])),
      "filterListing agrees",
    ).toEqual([]);

    // Proof that it is the literal, not the word: dropping the prefix finds the
    // entries again - derived, so a new drum configuration joins the list
    // instead of reddening it.
    expect(search("drums").length, "drums alone finds entries").toBeGreaterThan(
      1,
    );
    expect(ids(filterListing(LISTING, "drums", [])), "drums alone").toEqual(
      search("drums"),
    );
  });

  it("combines active tags with AND, and an unknown tag returns nothing", () => {
    // "playable" replaces "gestural", which D-10 retired: its six carriers
    // scattered across the new vocabulary, so LEGACY_TAG_MAP sends it nowhere.
    const generative = ids(filterListing(LISTING, "", ["generative"]));
    const playable = ids(filterListing(LISTING, "", ["playable"]));
    const both = ids(filterListing(LISTING, "", ["generative", "playable"]));

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

    // The intersection is never LARGER than either. A union would be their sum
    // less the overlap - larger than either - which is the mutation this
    // assertion exists to catch. It is <=, not <, because a growing catalog may
    // legitimately empty one particular pair; the property that keeps the rule
    // observed on real data is the one below it.
    expect(both, "two chips intersect").toEqual(
      carrying("generative").filter((id) => carrying("playable").includes(id)),
    );
    expect(both.length).toBeLessThanOrEqual(
      Math.min(generative.length, playable.length),
    );

    const chips = chipTags(LISTING);
    const intersecting = chips.flatMap((a, i) =>
      chips
        .slice(i + 1)
        .filter((b) => filterListing(LISTING, "", [a, b]).length > 0)
        .map((b) => `${a}+${b}`),
    );
    expect(
      intersecting.length,
      "some pair of standing chips still intersects on the shipped data",
    ).toBeGreaterThan(0);

    expect(
      ids(filterListing(LISTING, "", ["nosuchtag"])),
      "a tag nobody carries shows nothing, never everything",
    ).toEqual([]);
    expect(
      ids(filterListing(LISTING, "", ["drums", "nosuchtag"])),
      "and it empties an otherwise non-empty set",
    ).toEqual([]);

    expect(
      ids(filterListing(LISTING, "", [])),
      "no tags and no query is the whole catalog, in listing order",
    ).toEqual(ids(LISTING));
    expect(
      ids(filterListing(LISTING, "ghost", [])),
      "no tags is everything the query allows",
    ).toEqual(["ghost"]);
    expect(
      ids(filterListing(LISTING, "ghost", ["generative"])),
      "query and tags are ANDed too",
    ).toEqual(["ghost"]);
    expect(
      ids(filterListing(LISTING, "ghost", ["drums"])),
      "and they can disagree",
    ).toEqual([]);

    // filterListing never hands back the caller's array.
    const input = [...LISTING];
    expect(filterListing(input, "", [])).not.toBe(input);
  });

  it("stands sixteen chips, and every one of them is a facet member", () => {
    const chips = chipTags(LISTING);
    const known = allTags(LISTING);
    const count = (tag: string) =>
      LISTING.filter((e) => e.tags.includes(tag)).length;

    expect(known, "the recorded distinct-tag census").toHaveLength(
      RECORDED.tags,
    );
    expect(chips, "today's standing row, count descending then name").toEqual([
      ...RECORDED.chips,
    ]);
    expect(chips.map(count), "and their counts").toEqual([
      ...RECORDED.chipCounts,
    ]);

    // The RULE, not the list: every chip is carried twice or more, and every
    // excluded tag exactly once. Under the closed vocabulary both halves are
    // still true and the second is now EMPTY, which is the point rather than a
    // gap: chipTags()'s two-or-more filter excludes nothing, because no term
    // matches one entry any more. The loop below runs zero times and the
    // LENGTH assertion above it is what carries the claim - RECORDED.singletons
    // is 0 and is asserted rather than omitted.
    for (const tag of chips) {
      expect(count(tag), `${tag} is a chip`).toBeGreaterThanOrEqual(2);
    }
    const excluded = known.filter((tag) => !chips.includes(tag));
    expect(
      excluded,
      "no tag is left out of the row: the vocabulary is closed and every member is a chip",
    ).toHaveLength(RECORDED.singletons);
    for (const tag of excluded) {
      expect(count(tag), `${tag} is not a chip`).toBe(1);
    }
    // The other half of "every facet member is always a chip", said as a set
    // rather than as a count: the derived row and the declared vocabulary are
    // the same sixteen words. When 10-07 deletes chipTags() this is the
    // assertion that will have proved the replacement was equivalent on the
    // shipped data before it was made.
    expect(
      [...chips].sort(),
      "the derived row and the declared facets are the same set",
    ).toEqual([...FOR_TERMS, ...FEELS_TERMS].sort());
    // And the two recorded counts are a PARTITION of the vocabulary rather than
    // two numbers that happen to sit near each other: a tag is a chip or a
    // singleton, never both and never neither.
    expect(
      chips.length + excluded.length,
      "the chips and the singletons account for every known tag",
    ).toBe(known.length);
  });

  it("disables a chip that would return nothing, and disables none when nothing is active", () => {
    const chips = chipTags(LISTING);

    expect(
      disabledTags(LISTING, "", [], chips),
      "with nothing active and nothing typed, every chip is live",
    ).toEqual([]);

    // The chips that would empty the grid beside drums, DERIVED with the same
    // question the module answers, in the order the module returns them.
    const withDrums = disabledTags(LISTING, "", ["drums"], chips);
    const shouldDisable = chips.filter(
      (tag) =>
        filterListing(LISTING, "", tag === "drums" ? ["drums"] : ["drums", tag])
          .length === 0,
    );
    expect(withDrums, "the chips that would return zero beside drums").toEqual(
      shouldDisable,
    );
    // Neither empty nor everything, so the test still says something.
    expect(
      shouldDisable.length,
      "some chip is disabled beside drums",
    ).toBeGreaterThan(0);
    expect(
      shouldDisable.length,
      "and not every chip is disabled beside drums",
    ).toBeLessThan(chips.length);
    expect(
      withDrums,
      "an active chip is never its own disabled chip",
    ).not.toContain("drums");
    expect(
      withDrums,
      "playable survives - the drum entries carry it too",
    ).not.toContain("playable");

    // Every reported chip really is empty, and every unreported one really is
    // not: the guard against a list that is right by luck.
    for (const tag of chips) {
      const wanted = tag === "drums" ? ["drums"] : ["drums", tag];
      const size = filterListing(LISTING, "", wanted).length;
      if (withDrums.includes(tag)) {
        expect(size, `${tag} was reported disabled`).toBe(0);
      } else {
        expect(size, `${tag} was reported live`).toBeGreaterThan(0);
      }
    }
  });
});
