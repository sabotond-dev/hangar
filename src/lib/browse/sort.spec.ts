// The three browse orders, gated against the catalog's own three.
//
// src/lib/browse/sort.ts RESTATES src/lib/catalog/index.ts's nameAsc, because
// nameAsc is module-private there and the browse page may not import
// $lib/catalog at runtime (D-12: entries/ported.ts reaches the vendored
// compiler, a 131,101-byte chunk, and a page whose job is to list the catalog's
// names must not drag it onto first paint).
//
// A restatement with no gate is a divergence waiting to happen, so tests 2, 3
// and 4 run the shipped byFeatured(), byNewest() and byName() and compare id
// sequences element for element. If somebody changes either side, one of them
// goes red naming the sort.
//
// Test 5 is D-10 as amended in mechanical form: no localeCompare, no Intl,
// anywhere in the module. 05.1-RESEARCH.md's Standard Stack row and its
// Don't Hand-Roll row both recommend Intl.Collator and are both superseded;
// 05.1-UI-SPEC.md W-08 agrees with this file and is not.
//
// DERIVED, OR RECORDED. The rule that decides every number in this file, the
// same one filter.spec.ts states:
//
//   A number that is ARITHMETIC OVER THE SHIPPED DATA is derived. A number that
//   is A REVIEW OF THE SHIPPED DATA stays a literal, in one named block, so
//   that changing it is a decision somebody made rather than a test somebody
//   silenced.
//
// So every length is LISTING.length, the featured/plain boundary is counted off
// the data, the NEWEST order is asserted as date blocks rather than as two
// fixed sizes, and the NAME order is a property against a comparator written
// out below plus two reviewable witness pairs.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { byFeatured, byName, byNewest } from "$lib/catalog";
import { LISTING, type ListingEntry } from "$lib/catalog/listing";
import {
  BROWSE_SORTS,
  DEFAULT_SORT,
  featuredOrder,
  nameOrder,
  newestOrder,
  orderFor,
  sortListing,
} from "./sort";

const SOURCE_PATH = fileURLToPath(new URL("./sort.ts", import.meta.url));

/** Line and block comments removed, so a structural scan reads code only. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

const ids = (entries: readonly { id: string }[]) => entries.map((e) => e.id);

/**
 * Recorded on purpose; see filter.spec.ts's RECORDED.
 *
 * 10-06 (D-10) MOVED NO NUMBER HERE, and that is worth writing down rather than
 * leaving as an absence. The re-cut of fifty-five tags to sixteen changed every
 * entry's `tags` array and nothing else about the listing: the count is still
 * 36, the Featured boundary is still 15, and ordering has never read a tag.
 * The tag figures the re-cut moved live in filter.spec.ts's block, which is the
 * one place that holds them. This file's `tags: []` fixture below is a stub for
 * a synthetic entry and names no term, so it survived the re-cut untouched.
 *
 * The NEWEST retirement (D-11) is 10-07's and moves this file's test count.
 */
const RECORDED = { entries: 36, featured: 15 } as const;

/**
 * Two deterministic permutations of the listing, not a random shuffle: a sort
 * that disagreed with itself once in fifty runs would be a flake rather than a
 * finding. Reversal and an odds-then-evens interleave move every entry.
 */
const REVERSED: readonly ListingEntry[] = [...LISTING].reverse();
const INTERLEAVED: readonly ListingEntry[] = [
  ...LISTING.filter((_, i) => i % 2 === 1),
  ...LISTING.filter((_, i) => i % 2 === 0),
];

/** The listing's own order, captured once, so an in-place sort anywhere is red. */
const CATALOG_ORDER = ids(LISTING);

describe("the browse sort orders (src/lib/browse/sort.ts)", () => {
  it("the three orders are stable and total over the catalog", () => {
    // The one floor in this file, and it is the non-vacuity guard: everything
    // below counts off LISTING, so a listing that had quietly emptied would
    // make the rest pass on nothing.
    expect(
      LISTING.length,
      "the listing was actually read",
    ).toBeGreaterThanOrEqual(RECORDED.entries);
    expect(BROWSE_SORTS, "the three sorts, in the toolbar's order").toEqual([
      "featured",
      "newest",
      "name",
    ]);
    expect(DEFAULT_SORT, "UI-SPEC: the default sort is FEATURED").toBe(
      "featured",
    );

    for (const sort of BROWSE_SORTS) {
      const fromReversed = ids(sortListing(REVERSED, sort));
      const fromInterleaved = ids(sortListing(INTERLEAVED, sort));
      expect(
        fromReversed,
        `${sort}: two different shuffles render in the same sequence`,
      ).toEqual(fromInterleaved);
      expect(
        ids(sortListing(LISTING, sort)),
        `${sort}: catalog order sorts to the same sequence as a shuffle`,
      ).toEqual(fromReversed);
      expect(
        fromReversed,
        `${sort}: nothing was lost or duplicated`,
      ).toHaveLength(LISTING.length);
    }

    // Totality: no two DISTINCT entries may compare 0, or Array.sort's
    // stability - not the comparator - would be deciding the page.
    let compared = 0;
    for (const sort of BROWSE_SORTS) {
      const order = orderFor(sort);
      for (const a of LISTING) {
        for (const b of LISTING) {
          if (a.id === b.id) continue;
          compared += 1;
          expect(
            order(a, b),
            `${sort}: ${a.id} and ${b.id} compare equal, so the order is not total`,
          ).not.toBe(0);
        }
      }
    }
    expect(compared, "pairs were actually compared").toBe(
      BROWSE_SORTS.length * LISTING.length * (LISTING.length - 1),
    );
  });

  it("FEATURED puts the featured first and then sorts by name, exactly as the catalog does", () => {
    const shipped = ids(byFeatured());
    const ours = ids(sortListing(LISTING, "featured"));

    expect(shipped, "the shipped comparator returned every entry").toHaveLength(
      LISTING.length,
    );
    expect(ours, "the browse comparator returned every entry").toHaveLength(
      LISTING.length,
    );
    expect(ours, "FEATURED disagrees with the catalog's byFeatured()").toEqual(
      shipped,
    );

    const sorted = sortListing(LISTING, "featured");
    const lastFeatured = sorted.findLastIndex((e) => e.featured);
    const firstPlain = sorted.findIndex((e) => !e.featured);
    expect(
      lastFeatured,
      "the featured block ends where the plain block begins",
    ).toBe(firstPlain - 1);
    // The RULE and the REVIEW, side by side: the equality is the test, and the
    // recorded number is what a wave that flags a ninth entry has to change on
    // purpose.
    expect(
      sorted.filter((e) => e.featured).length,
      "the sorted page carries every featured entry the catalog declares",
    ).toBe(LISTING.filter((e) => e.featured).length);
    expect(
      sorted.filter((e) => e.featured),
      "the recorded featured count",
    ).toHaveLength(RECORDED.featured);

    // Within each block, name ascending - and NOT addedAt: whole blocks of
    // entries share one date, so a date tie-break inside the featured group
    // would be a coin toss dressed as an order (UI-SPEC, The sort control).
    //
    // The boundary is COUNTED, never written down: it is the same quantity the
    // lastFeatured / firstPlain pair above already pins, so it belongs on the
    // derived side of this file's rule.
    const names = sorted.map((e) => e.name);
    const f = LISTING.filter((e) => e.featured).length;
    expect(names.slice(0, f), "the featured block is in name order").toEqual(
      [...names.slice(0, f)].sort(nameOrderOnNames),
    );
    expect(names.slice(f), "the plain block is in name order").toEqual(
      [...names.slice(f)].sort(nameOrderOnNames),
    );
  });

  it("NEWEST orders the dates newest first, name ascending inside each block, and agrees with the catalog", () => {
    const shipped = ids(byNewest());
    const sorted = sortListing(LISTING, "newest");

    expect(shipped, "the shipped comparator returned every entry").toHaveLength(
      LISTING.length,
    );
    expect(
      ids(sorted),
      "NEWEST disagrees with the catalog's byNewest()",
    ).toEqual(shipped);

    // STRUCTURE, not sizes. This used to read "the seven newest come first" and
    // "the nine older follow", which is a claim about two block sizes rather
    // than about the order: a phase that adds configurations adds a third date,
    // and an assertion shaped that way goes red for a reason that is not a
    // fault. What NEWEST actually promises is that the dates run newest first,
    // that each date's entries are contiguous, and that inside a date the
    // catalog's name tie-break decides.
    const dates = sorted.map((e) => e.addedAt);
    const distinct = [...new Set(dates)];
    expect(
      distinct.length,
      "there is more than one date to order",
    ).toBeGreaterThan(1);
    expect(distinct, "the blocks run newest first").toEqual(
      [...distinct].sort().reverse(),
    );
    expect(dates, "the sequence is exactly its blocks, concatenated").toEqual(
      distinct.flatMap((d) =>
        LISTING.filter((e) => e.addedAt === d).map(() => d),
      ),
    );
    for (const d of distinct) {
      const block = sorted.filter((e) => e.addedAt === d).map((e) => e.name);
      expect(block, `${d}: the block is in name order`).toEqual(
        [...block].sort(nameOrderOnNames),
      );
    }
  });

  it("NAME agrees with the catalog's own name order", () => {
    const shipped = ids(byName());
    const sorted = sortListing(LISTING, "name");

    expect(shipped, "the shipped comparator returned every entry").toHaveLength(
      LISTING.length,
    );
    expect(ids(sorted), "NAME disagrees with the catalog's byName()").toEqual(
      shipped,
    );

    // The PROPERTY, against a comparator written out here rather than imported
    // from the module under test - that is what stops it being a tautology. It
    // replaces a sixteen-name sequence written out in full, which would have
    // become thirty-six names and been rewritten once per entry wave.
    const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
    expect(sorted.map((e) => e.name)).toEqual(
      [...LISTING].map((e) => e.name).sort(byCodePoint),
    );

    // And the reviewable half, by position rather than by a full list, so the
    // code-point consequence stays a fact somebody can read at any catalog
    // size: ARC precedes Aurora because R (82) is below u (117), and SONAR
    // precedes Starfield for the same reason. An English collation would put
    // both pairs the other way round.
    const seq = sorted.map((e) => e.name);
    const before = (a: string, b: string) =>
      expect(seq.indexOf(a), `${a} precedes ${b} by code point`).toBeLessThan(
        seq.indexOf(b),
      );
    before("ARC", "Aurora");
    before("SONAR", "Starfield");
  });

  it("the name comparison is by code point, not by locale", () => {
    const synthetic: readonly ListingEntry[] = [
      makeEntry("apple", "apple"),
      makeEntry("zebra", "Zebra"),
    ];
    expect(
      sortListing(synthetic, "name").map((e) => e.name),
      "a code-point comparison puts Zebra first; a case-folding collator would not",
    ).toEqual(["Zebra", "apple"]);
    // The underlying fact, asserted rather than asserted-about: every uppercase
    // Latin letter sits below every lowercase one.
    expect("Z".codePointAt(0)).toBeLessThan("a".codePointAt(0) as number);

    // And the mechanical half of D-10 as amended: the module may not name a
    // locale-aware comparison at all. Without this the rule is a comment that
    // somebody deletes while "fixing" the file to match 05.1-RESEARCH.md.
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = strip(source);
    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(1000);
    expect(
      source,
      "the prose reason survives in the source, comments included",
    ).toContain("localeCompare");
    expect(
      stripped,
      "the one permitted import declaration was seen by the scan",
    ).toContain("import type");
    expect(stripped, "sort.ts names localeCompare in CODE").not.toContain(
      "localeCompare",
    );
    expect(stripped, "sort.ts names Intl in CODE").not.toContain("Intl");

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    const erased = [
      ...stripped.matchAll(/import[ ]+type[^;]*?from[ ]+["']([^"']+)["']/g),
    ].map((match) => match[1]);
    expect(specifiers, "sort.ts imports exactly one thing").toEqual([
      "$lib/catalog/listing",
    ]);
    expect(
      specifiers,
      "every specifier in sort.ts sits on an import type line",
    ).toEqual(erased);
  });

  it("sorting never reorders its input in place", () => {
    const input = [...LISTING];
    const before = ids(input);

    for (const sort of BROWSE_SORTS) {
      const out = sortListing(input, sort);
      expect(out, `${sort}: a new array, never the caller's`).not.toBe(input);
      expect(ids(input), `${sort}: the caller's array was reordered`).toEqual(
        before,
      );
    }

    // LISTING is frozen and exported; two callers sorting differently must not
    // be able to see each other's order.
    for (const sort of BROWSE_SORTS) sortListing(LISTING, sort);
    expect(ids(LISTING), "LISTING is still in catalog order").toEqual(
      CATALOG_ORDER,
    );

    // The bare comparators are the same three the sorter applies.
    expect(orderFor("featured")).toBe(featuredOrder);
    expect(orderFor("newest")).toBe(newestOrder);
    expect(orderFor("name")).toBe(nameOrder);
  });
});

/** The comparator under test, applied to bare names, for the block assertions. */
function nameOrderOnNames(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** A minimal ListingEntry; only id and name matter to the name order. */
function makeEntry(id: string, name: string): ListingEntry {
  return {
    id,
    name,
    description: "",
    motion: "dark",
    tags: [],
    featured: false,
    addedAt: "2026-01-01",
    restsBlack: true,
    preview: "padsim",
  };
}
