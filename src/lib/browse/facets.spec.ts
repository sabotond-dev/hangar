// The closed vocabulary, held against the shipped catalog in both directions.
//
// Four tests, and three of them are the reason the vocabulary can be closed at
// all:
//
//   1  the sixteen are sixteen, distinct, and split cleanly into two facets
//   2  every entry carries EXACTLY THREE - one FOR and two FEELS - and every
//      facet member is carried by somebody, so a retired term is red too
//   3  both health rules, with the whole histogram in the failure message
//   4  facets.ts imports nothing, and the legacy ?tag= table is bounded
//
// WHY TESTS 2 AND 3 READ LISTING RATHER THAN A TABLE. A vocabulary declared in
// one file and assigned in twenty-nine others is only closed if something holds
// the two against each other. Restating the assignment here would make this
// file agree with itself; reading LISTING makes it agree with the shipped data.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LISTING } from "$lib/catalog/listing";
import {
  FACETS,
  FEELS_TERMS,
  FOR_TERMS,
  LEGACY_TAG_MAP,
  RETIRED_VOCABULARY,
  facetOf,
  matchesFacets,
} from "./facets";

const SOURCE_PATH = fileURLToPath(new URL("./facets.ts", import.meta.url));

/** Line and block comments removed, so a structural scan reads code only. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

const ALL_TERMS = [...FOR_TERMS, ...FEELS_TERMS];

/** How many listed entries carry a term. */
const count = (term: string) =>
  LISTING.filter((entry) => entry.tags.includes(term)).length;

/**
 * Both facets, term by term, with their counts - printed into a failure message
 * so a red health rule shows the SHAPE of the vocabulary rather than the one
 * number that tripped. A histogram tells a reader whether one term is starving
 * or the whole facet is; a single count never does.
 */
const histogram = () =>
  FACETS.map(
    (facet) =>
      `${facet.caption}: ` +
      facet.terms.map((term) => `${term} ${count(term)}`).join(", "),
  ).join(" | ");

describe("the browse facets (src/lib/browse/facets.ts)", () => {
  it("declares a closed vocabulary of sixteen in two facets", () => {
    expect(FOR_TERMS, "FOR is ten terms").toHaveLength(10);
    expect(FEELS_TERMS, "FEELS is six terms").toHaveLength(6);
    expect(ALL_TERMS, "sixteen in all").toHaveLength(16);
    expect(
      new Set(ALL_TERMS).size,
      "no term is repeated, and no term is in both facets",
    ).toBe(16);

    for (const term of ALL_TERMS) {
      // A chip's label is the term uppercased at render time, and a chip's URL
      // value is the term as written. A capital or a space here would make one
      // of those two wrong without making either obviously wrong.
      expect(term, `"${term}" is lower case`).toBe(term.toLowerCase());
      expect(term.includes(" "), `"${term}" has no space in it`).toBe(false);
      expect(term.length, `"${term}" is not empty`).toBeGreaterThan(0);
    }

    // FACETS is the two of them and nothing else, in the toolbar's order, and
    // its members ARE the two arrays rather than copies of them.
    expect(
      FACETS.map((f) => f.name),
      "FOR first, FEELS second",
    ).toEqual(["for", "feels"]);
    expect(
      FACETS.map((f) => f.caption),
      "the two captions",
    ).toEqual(["FOR", "FEELS"]);
    expect(FACETS[0].terms, "the FOR row").toBe(FOR_TERMS);
    expect(FACETS[1].terms, "the FEELS row").toBe(FEELS_TERMS);

    for (const term of FOR_TERMS) expect(facetOf(term)).toBe("for");
    for (const term of FEELS_TERMS) expect(facetOf(term)).toBe("feels");
    expect(facetOf("hypnotic"), "a retired term belongs to no facet").toBe(
      undefined,
    );
    expect(facetOf(""), "and neither does nothing").toBe(undefined);
  });

  it("gives every entry exactly three terms, one FOR and two FEELS, and leaves no term unused", () => {
    // Non-vacuity first: an empty listing would satisfy every loop below.
    expect(LISTING.length, "the listing was actually read").toBeGreaterThan(30);

    for (const entry of LISTING) {
      const forTerms = entry.tags.filter((tag) => facetOf(tag) === "for");
      const feelsTerms = entry.tags.filter((tag) => facetOf(tag) === "feels");
      const strangers = entry.tags.filter((tag) => facetOf(tag) === undefined);

      expect(
        strangers,
        `${entry.id} carries ${strangers.join(", ")}, which no facet declares`,
      ).toEqual([]);
      expect(
        forTerms,
        `${entry.id} carries ${forTerms.length} FOR terms (${forTerms.join(", ")}); exactly one is the rule`,
      ).toHaveLength(1);
      expect(
        feelsTerms,
        `${entry.id} carries ${feelsTerms.length} FEELS terms (${feelsTerms.join(", ")}); exactly two is the rule`,
      ).toHaveLength(2);
      expect(
        new Set(feelsTerms).size,
        `${entry.id} carries the same FEELS term twice`,
      ).toBe(2);
      expect(
        entry.tags,
        `${entry.id} carries three tags and no more`,
      ).toHaveLength(3);
    }

    // THE OTHER DIRECTION, and it is the half that makes a RETIRED term red:
    // a word nobody carries is a chip that returns an empty grid, which is a
    // worse failure than a missing chip because it looks like it works.
    for (const term of ALL_TERMS) {
      expect(
        count(term),
        `"${term}" is declared in a facet and carried by no entry. ${histogram()}`,
      ).toBeGreaterThan(0);
    }

    // And the predicate the toolbar will use agrees with the data: OR within a
    // facet, AND across. Derived from LISTING with the question restated, so
    // agreeing is evidence rather than a tautology.
    const drumsOrKeys = LISTING.filter((e) =>
      matchesFacets(e, { for: ["drums", "keys"], feels: [] }),
    ).map((e) => e.id);
    expect(
      drumsOrKeys,
      "two FOR chips are a UNION - under AND this would be empty, because every entry has exactly one FOR term",
    ).toEqual(
      LISTING.filter(
        (e) => e.tags.includes("drums") || e.tags.includes("keys"),
      ).map((e) => e.id),
    );
    expect(drumsOrKeys.length, "and the union is not empty").toBeGreaterThan(2);

    const across = LISTING.filter((e) =>
      matchesFacets(e, { for: ["drums"], feels: ["generative"] }),
    ).map((e) => e.id);
    expect(across, "across facets it is an intersection").toEqual(
      LISTING.filter(
        (e) => e.tags.includes("drums") && e.tags.includes("generative"),
      ).map((e) => e.id),
    );
    expect(
      LISTING.filter((e) => matchesFacets(e, { for: [], feels: [] })).length,
      "nothing active is not a filter",
    ).toBe(LISTING.length);
  });

  it("keeps both health rules: no FOR term below two, no FEELS term outside six to eighteen", () => {
    expect(LISTING.length, "the listing was actually read").toBeGreaterThan(30);

    // A term matching ONE card is a thing the search field does better, and it
    // is the failure mode the retired vocabulary had twenty-seven of.
    for (const term of FOR_TERMS) {
      expect(
        count(term),
        `FOR "${term}" lands on ${count(term)} entries; a term matching one card is a thing search does better. ${histogram()}`,
      ).toBeGreaterThanOrEqual(2);
    }

    // Below six it is not a filter; above eighteen - half the catalog - it is
    // not a distinction.
    for (const term of FEELS_TERMS) {
      expect(
        count(term),
        `FEELS "${term}" lands on ${count(term)} entries; below six it is not a filter. ${histogram()}`,
      ).toBeGreaterThanOrEqual(6);
      expect(
        count(term),
        `FEELS "${term}" lands on ${count(term)} entries; above eighteen it is not a distinction. ${histogram()}`,
      ).toBeLessThanOrEqual(18);
    }

    // The slot sums, which are what make "exactly three per entry" arithmetic
    // rather than a per-entry loop that could be right thirty-six times and
    // wrong about the whole.
    const forSlots = FOR_TERMS.reduce((n, term) => n + count(term), 0);
    const feelsSlots = FEELS_TERMS.reduce((n, term) => n + count(term), 0);
    expect(forSlots, `one FOR slot per entry. ${histogram()}`).toBe(
      LISTING.length,
    );
    expect(feelsSlots, `two FEELS slots per entry. ${histogram()}`).toBe(
      LISTING.length * 2,
    );

    // ZERO SINGLETONS, ASSERTED RATHER THAN IMPLIED. It is the whole point of a
    // closed vocabulary and it is the one number D-10 was raised about.
    const singletons = ALL_TERMS.filter((term) => count(term) === 1);
    expect(
      singletons,
      `no term matches exactly one entry. ${histogram()}`,
    ).toEqual([]);
  });

  it("imports nothing at all, and bounds the legacy ?tag= table", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = strip(source);
    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(1000);

    // front-door.spec.ts's idiom, one notch tighter: no import declaration at
    // all, not even an erased one. That is what forces matchesFacets to take
    // its entry structurally instead of reaching for ListingEntry - and it is
    // what keeps the sixteen terms in /browse/'s prerendered HTML at first
    // paint instead of behind the 131,101-byte compiler chunk (D-12).
    const importLines = stripped.match(/^[ ]*import[ ].*$/gm) ?? [];
    expect(
      importLines,
      "facets.ts declares no import, erased or otherwise",
    ).toEqual([]);
    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    expect(specifiers, "and so it can carry no specifier either").toEqual([]);

    // The retired vocabulary is history: fifty-five terms, sorted, unique.
    expect(RETIRED_VOCABULARY, "the pre-re-cut vocabulary").toHaveLength(55);
    expect(new Set(RETIRED_VOCABULARY).size, "each once").toBe(55);
    expect(
      [...RETIRED_VOCABULARY].sort(),
      "kept sorted so a reader can find a word",
    ).toEqual([...RETIRED_VOCABULARY]);

    // Every key is one of the fifty-five, and every one of the fifty-five is a
    // key - so an inbound ?tag= that named a real shipped tag always resolves,
    // to a chip or explicitly to nothing.
    const keys = Object.keys(LEGACY_TAG_MAP);
    for (const key of keys) {
      expect(
        RETIRED_VOCABULARY.includes(key),
        `"${key}" is a key of LEGACY_TAG_MAP but was never a shipped tag`,
      ).toBe(true);
    }
    for (const retired of RETIRED_VOCABULARY) {
      expect(
        Object.prototype.hasOwnProperty.call(LEGACY_TAG_MAP, retired),
        `"${retired}" shipped as a tag and LEGACY_TAG_MAP does not mention it`,
      ).toBe(true);
    }
    expect(keys.length, "the table covers the vocabulary exactly").toBe(55);

    // Every value is a facet member or an explicit undefined. Nothing else.
    let mapped = 0;
    for (const [key, value] of Object.entries(LEGACY_TAG_MAP)) {
      if (value === undefined) continue;
      expect(
        facetOf(value),
        `"${key}" maps to "${value}", which no facet declares`,
      ).not.toBe(undefined);
      mapped += 1;
    }
    // Neither empty nor total, so the table says something either way.
    expect(mapped, "some legacy tags have an honest home").toBeGreaterThan(0);
    expect(
      mapped,
      "and some do not - a table that mapped all fifty-five would be inventing homes",
    ).toBeLessThan(55);

    // A surviving term maps to itself. Clause 1, asserted rather than trusted.
    for (const term of ALL_TERMS) {
      if (!RETIRED_VOCABULARY.includes(term)) continue;
      expect(
        LEGACY_TAG_MAP[term],
        `"${term}" survives the re-cut, so ?tag=${term} must land on itself`,
      ).toBe(term);
    }
  });
});
