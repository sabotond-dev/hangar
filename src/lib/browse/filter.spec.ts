// The browse search and the tag intersection, pinned against the shipped data.
//
// Three things here are contracts rather than implementation details, and each
// has its own test:
//
//   D-05  search is free text over name, description and tags, and there is NO
//         power syntax - a typed "$tag:drums" is four literal words, not a
//         query language (test 3).
//   W-04  active chips INTERSECT. Union was considered and rejected in the
//         approved spec: most tags sit on exactly one entry - RECORDED below
//         counts how many - so a union would make a second chip ADD one card,
//         which reads as a bug (test 4).
//   D-15  the standing chip row is every tag carried by two or more entries -
//         DERIVED from the data, so it stays right as the catalog grows, and
//         recorded by name today, so a data change is visible (test 5).
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
 * then name ascending (filter.ts:121-125) - are asserted as rules below and
 * need no maintenance. These four are a REVIEW: they say what the vocabulary
 * currently looks like, so a wave that adds configurations sees the row it
 * moved and decides whether it likes it. A wave updates this block; it never
 * deletes an assertion against it.
 *
 * Re-recorded by: 08-06 (sixteen entries), then 09-03 (nineteen), then 09-04
 * (twenty-two), and every later entry wave of phase 09.
 *
 * This block has a reader outside the repository's source: 05.1-UI-SPEC.md,
 * "The tag chips", quotes the row and its counts verbatim. A wave that moves
 * the row updates that document in the same commit - 09-03 is the first, and it
 * carries the instruction.
 */
const RECORDED = {
  entries: 22,
  tags: 47,
  singletons: 31,
  chips: [
    "playable",
    "drums",
    "expressive",
    "gestural",
    "generative",
    "hypnotic",
    "readable",
    "xy-control",
    "ambient",
    "blooming",
    "colour",
    "grid",
    "hands-free",
    "harmonic",
    "rippling",
    "sequencer",
  ] as const,
  chipCounts: [8, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2] as const,
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
    expect(
      matches(byId("euclid"), "polyrhythm"),
      "a term in the tags only",
    ).toBe(true);
    expect(
      matches(byId("aurora"), "polyrhythm"),
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
    // Nine pads' name, "drums" is one of its tags. The expectation is DERIVED
    // from the search predicate restated at the top of this file, and the
    // property that catches an OR is asserted beside it: the second term must
    // narrow the result without emptying it.
    const oneTerm = search("drums");
    const twoTerms = search("nine drums");
    expect(
      oneTerm.length,
      "drums alone is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(twoTerms.length, "nine drums still finds one").toBeGreaterThan(0);
    expect(
      twoTerms.length,
      "the second term narrows rather than widens",
    ).toBeLessThan(oneTerm.length);

    expect(ids(LISTING.filter((e) => matches(e, "drums"))), "one term").toEqual(
      oneTerm,
    );
    expect(
      ids(LISTING.filter((e) => matches(e, "nine drums"))),
      "both terms required",
    ).toEqual(twoTerms);
    expect(
      ids(LISTING.filter((e) => matches(e, "  NINE   DrUmS  "))),
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
    const generative = ids(filterListing(LISTING, "", ["generative"]));
    const gestural = ids(filterListing(LISTING, "", ["gestural"]));
    const both = ids(filterListing(LISTING, "", ["generative", "gestural"]));

    // Each chip returns exactly the entries carrying it - derived, with a floor
    // beside it so a predicate that returned everything could not pass.
    expect(
      carrying("generative").length,
      "generative is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(generative, "the generative chip").toEqual(carrying("generative"));
    expect(
      carrying("gestural").length,
      "gestural is carried by more than one entry",
    ).toBeGreaterThan(1);
    expect(gestural, "the gestural chip").toEqual(carrying("gestural"));

    // The intersection is never LARGER than either. A union would be their sum
    // less the overlap - larger than either - which is the mutation this
    // assertion exists to catch. It is <=, not <, because a growing catalog may
    // legitimately empty one particular pair; the property that keeps the rule
    // observed on real data is the one below it.
    expect(both, "two chips intersect").toEqual(
      carrying("generative").filter((id) => carrying("gestural").includes(id)),
    );
    expect(both.length).toBeLessThanOrEqual(
      Math.min(generative.length, gestural.length),
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

  it("stands nine chips, derived from the data and not declared", () => {
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
    // excluded tag exactly once. A catalog change moves the nine without
    // breaking this pair.
    for (const tag of chips) {
      expect(count(tag), `${tag} is a chip`).toBeGreaterThanOrEqual(2);
    }
    const excluded = known.filter((tag) => !chips.includes(tag));
    expect(
      excluded,
      "the recorded singletons stay searchable text",
    ).toHaveLength(RECORDED.singletons);
    for (const tag of excluded) {
      expect(count(tag), `${tag} is not a chip`).toBe(1);
    }
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
