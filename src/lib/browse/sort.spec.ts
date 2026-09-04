// The three browse orders, gated against the catalog's own three.
//
// src/lib/browse/sort.ts RESTATES src/lib/catalog/index.ts's nameAsc, because
// nameAsc is module-private there and the browse page may not import
// $lib/catalog at runtime (D-12: entries/ported.ts reaches the vendored
// compiler, a 131,101-byte chunk, and a page whose job is to list sixteen names
// must not drag it onto first paint).
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
    expect(LISTING.length, "the listing was actually read").toBe(16);
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
      ).toHaveLength(16);
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
    expect(compared, "pairs were actually compared").toBe(3 * 16 * 15);
  });

  it("FEATURED puts the featured first and then sorts by name, exactly as the catalog does", () => {
    const shipped = ids(byFeatured());
    const ours = ids(sortListing(LISTING, "featured"));

    expect(shipped, "the shipped comparator returned all sixteen").toHaveLength(
      16,
    );
    expect(ours, "the browse comparator returned all sixteen").toHaveLength(16);
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
    expect(
      sorted.filter((e) => e.featured),
      "eight are featured",
    ).toHaveLength(8);

    // Within each block, name ascending - and NOT addedAt: only two distinct
    // dates exist, so a date tie-break inside the featured group would be a
    // coin toss dressed as an order (UI-SPEC, The sort control).
    const names = sorted.map((e) => e.name);
    expect(names.slice(0, 8), "the featured block is in name order").toEqual(
      [...names.slice(0, 8)].sort(nameOrderOnNames),
    );
    expect(names.slice(8), "the plain block is in name order").toEqual(
      [...names.slice(8)].sort(nameOrderOnNames),
    );
  });

  it("NEWEST puts the seven newest before the nine older, and agrees with the catalog", () => {
    const shipped = ids(byNewest());
    const sorted = sortListing(LISTING, "newest");

    expect(shipped, "the shipped comparator returned all sixteen").toHaveLength(
      16,
    );
    expect(
      ids(sorted),
      "NEWEST disagrees with the catalog's byNewest()",
    ).toEqual(shipped);

    const dates = sorted.map((e) => e.addedAt);
    expect(dates.slice(0, 7), "the seven newest come first").toEqual(
      Array.from({ length: 7 }, () => "2026-09-04"),
    );
    expect(dates.slice(7), "the nine older follow").toEqual(
      Array.from({ length: 9 }, () => "2026-09-02"),
    );
  });

  it("NAME agrees with the catalog's own name order", () => {
    const shipped = ids(byName());
    const sorted = sortListing(LISTING, "name");

    expect(shipped, "the shipped comparator returned all sixteen").toHaveLength(
      16,
    );
    expect(ids(sorted), "NAME disagrees with the catalog's byName()").toEqual(
      shipped,
    );

    // The rendered sequence, written out, so the code-point consequence is a
    // reviewable fact rather than something discovered on screen. ARC precedes
    // Aurora because R (82) is below u (117); SONAR precedes Starfield for the
    // same reason. On these sixteen names an English collation agrees entry for
    // entry, because no two names differ only in case.
    expect(sorted.map((e) => e.name)).toEqual([
      "ARC",
      "Aurora",
      "CHORUS",
      "Dial",
      "EUCLID",
      "Four faders",
      "GHOST",
      "Joystick",
      "LATTICE",
      "MORPH",
      "Nine pads",
      "Pinwheel",
      "Radar",
      "SONAR",
      "Starfield",
      "Trackpad",
    ]);
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
