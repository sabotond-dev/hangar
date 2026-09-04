// The browse search and the tag intersection, pinned against the shipped data.
//
// Three things here are contracts rather than implementation details, and each
// has its own test:
//
//   D-05  search is free text over name, description and tags, and there is NO
//         power syntax - a typed "$tag:drums" is four literal words, not a
//         query language (test 3).
//   W-04  active chips INTERSECT. Union was considered and rejected in the
//         approved spec: 32 of the 41 tags sit on exactly one entry, so a union
//         would make a second chip ADD one card, which reads as a bug (test 4).
//   D-15  the standing chip row is every tag carried by two or more entries -
//         DERIVED from the data, so it stays right as the catalog grows, and
//         asserted by name today, so a data change is visible (test 5).
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

/**
 * The nine standing chips as they stand on 2026-09-04, count first.
 * 05.1-UI-SPEC.md, The tag chips, quotes exactly this row.
 */
const NINE_CHIPS = [
  "playable",
  "generative",
  "gestural",
  "hypnotic",
  "ambient",
  "colour",
  "drums",
  "expressive",
  "readable",
] as const;

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
    expect(fold("café"), "decomposed").toBe("cafe");

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
    expect(LISTING.length, "the listing was actually read").toBe(16);

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
    // Nine pads' name, "drums" is one of its tags. EUCLID carries drums and not
    // nine, so an OR would return two.
    expect(ids(LISTING.filter((e) => matches(e, "drums"))), "one term").toEqual(
      ["ninepads", "euclid"],
    );
    expect(
      ids(LISTING.filter((e) => matches(e, "nine drums"))),
      "both terms required",
    ).toEqual(["ninepads"]);
    expect(
      ids(LISTING.filter((e) => matches(e, "  NINE   DrUmS  "))),
      "case and repeated spaces change nothing",
    ).toEqual(["ninepads"]);
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
    // two entries again.
    expect(ids(filterListing(LISTING, "drums", [])), "drums alone").toEqual([
      "ninepads",
      "euclid",
    ]);
  });

  it("combines active tags with AND, and an unknown tag returns nothing", () => {
    const generative = ids(filterListing(LISTING, "", ["generative"]));
    const gestural = ids(filterListing(LISTING, "", ["gestural"]));
    const both = ids(filterListing(LISTING, "", ["generative", "gestural"]));

    expect(generative, "generative is carried by three").toEqual([
      "starfield",
      "euclid",
      "ghost",
    ]);
    expect(gestural, "gestural is carried by three").toEqual([
      "dial",
      "arc",
      "ghost",
    ]);
    // The intersection is SMALLER than either. A union would be five - larger
    // than either - which is the mutation this assertion exists to catch.
    expect(both, "two chips intersect").toEqual(["ghost"]);
    expect(both.length).toBeLessThan(generative.length);
    expect(both.length).toBeLessThan(gestural.length);

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

    expect(known, "41 distinct tags across the sixteen").toHaveLength(41);
    expect(chips, "today's standing row, count descending then name").toEqual([
      ...NINE_CHIPS,
    ]);
    expect(chips.map(count), "and their counts").toEqual([
      4, 3, 3, 3, 2, 2, 2, 2, 2,
    ]);

    // The RULE, not the list: every chip is carried twice or more, and every
    // excluded tag exactly once. A catalog change moves the nine without
    // breaking this pair.
    for (const tag of chips) {
      expect(count(tag), `${tag} is a chip`).toBeGreaterThanOrEqual(2);
    }
    const excluded = known.filter((tag) => !chips.includes(tag));
    expect(excluded, "the 32 singletons stay searchable text").toHaveLength(32);
    for (const tag of excluded) {
      expect(count(tag), `${tag} is not a chip`).toBe(1);
    }
  });

  it("disables a chip that would return nothing, and disables none when nothing is active", () => {
    const chips = chipTags(LISTING);

    expect(
      disabledTags(LISTING, "", [], chips),
      "with nothing active and nothing typed, every chip is live",
    ).toEqual([]);

    // drums is carried by Nine pads and EUCLID only. Between them they carry
    // playable and generative; the other six chips would empty the grid.
    const withDrums = disabledTags(LISTING, "", ["drums"], chips);
    expect(withDrums, "the six that would return zero beside drums").toEqual([
      "gestural",
      "hypnotic",
      "ambient",
      "colour",
      "expressive",
      "readable",
    ]);
    expect(
      withDrums,
      "an active chip is never its own disabled chip",
    ).not.toContain("drums");
    expect(
      withDrums,
      "playable survives - Nine pads and EUCLID both carry it",
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
