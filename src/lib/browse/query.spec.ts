// The browse address, parsed and serialised.
//
// Five tests, one per behaviour the page in wave 8 depends on: the canonical
// empty address, a round trip over a table of states, the two fallbacks and the
// trim, the encoding and the tag order, and the import rule.
//
// Test 3 is the one with a mutation on the record: make parseBrowseQuery keep an
// unknown tag and it goes red naming the tag that survived. That matters more
// than it looks - an unknown tag that reaches filterListing intersects the grid
// to nothing (filter.ts deliberately does NOT drop it), so a stale link would
// open on an empty catalog instead of on the catalog.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LISTING } from "$lib/catalog/listing";
import { allTags } from "./filter";
import {
  DEFAULT_QUERY,
  parseBrowseQuery,
  serialiseBrowseQuery,
  type BrowseQuery,
} from "./query";

const SOURCE_PATH = fileURLToPath(new URL("./query.ts", import.meta.url));

/** Line and block comments removed, so a structural scan reads code only. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

/** The catalog's real tag vocabulary - the argument the page will pass. */
const KNOWN = allTags(LISTING);

const parse = (search: string): BrowseQuery =>
  parseBrowseQuery(new URLSearchParams(search), KNOWN);

/**
 * The five states the round trip is asserted over: sort only, query only, one
 * tag, three tags in a deliberate order that is NOT alphabetical, and all three
 * together with a space and a diacritic in the query.
 */
const STATES: readonly {
  readonly what: string;
  readonly query: BrowseQuery;
}[] = [
  { what: "sort only", query: { sort: "newest", q: "", tags: [] } },
  { what: "query only", query: { sort: "featured", q: "ghost", tags: [] } },
  { what: "one tag", query: { sort: "featured", q: "", tags: ["gestural"] } },
  {
    what: "three tags, in activation order",
    query: {
      sort: "featured",
      q: "",
      tags: ["hypnotic", "ambient", "gestural"],
    },
  },
  {
    what: "all three at once",
    query: {
      sort: "name",
      q: "café noir",
      tags: ["generative", "playable"],
    },
  },
];

describe("the browse query string (src/lib/browse/query.ts)", () => {
  it("serialises the default query to nothing at all, so /browse/ is the canonical address", () => {
    expect(DEFAULT_QUERY, "the default is FEATURED, no query, no tags").toEqual(
      {
        sort: "featured",
        q: "",
        tags: [],
      },
    );
    expect(
      serialiseBrowseQuery(DEFAULT_QUERY),
      "the default query must serialise to the empty string",
    ).toBe("");

    // The same address written three other ways is still the default state, so
    // a bare /browse/, a stray ?, and an explicitly-default link all agree.
    for (const search of ["", "?", "sort=featured", "?sort=featured&q="]) {
      expect(parse(search), `"${search}" is the default state`).toEqual(
        DEFAULT_QUERY,
      );
    }

    // And the default is reachable BACK from any state: clearing every filter
    // returns the canonical empty address rather than ?sort=featured&q=.
    expect(
      serialiseBrowseQuery({ sort: "featured", q: "", tags: [] }),
      "a cleared toolbar writes the canonical address",
    ).toBe("");
  });

  it("round-trips every state through the address unchanged", () => {
    for (const { what, query } of STATES) {
      const search = serialiseBrowseQuery(query);
      expect(search, `${what}: a non-default state writes an address`).not.toBe(
        "",
      );
      expect(parse(search), `${what}: did not survive the round trip`).toEqual(
        query,
      );
      // Twice, because a serialiser that consumed its input would pass once.
      expect(
        serialiseBrowseQuery(parse(search)),
        `${what}: the address is not a fixed point`,
      ).toBe(search);
    }

    // FEATURED is omitted; the other two are written. This is the omission rule
    // from 05.1-UI-SPEC.md's URL-visible state table, asserted directly.
    expect(
      serialiseBrowseQuery({ sort: "featured", q: "ghost", tags: [] }),
      "the default sort is omitted",
    ).toBe("q=ghost");
    expect(
      serialiseBrowseQuery({ sort: "newest", q: "", tags: [] }),
      "a non-default sort is written",
    ).toBe("sort=newest");
    expect(
      serialiseBrowseQuery({ sort: "name", q: "", tags: [] }),
      "the third sort is written too",
    ).toBe("sort=name");
  });

  it("falls back on an unknown sort, DROPS an unknown tag, and trims the query", () => {
    expect(
      parse("sort=popular").sort,
      "a sort nobody ships must open on the catalog, not on an error",
    ).toBe("featured");
    expect(parse("sort=").sort, "an empty sort is the default").toBe(
      "featured",
    );
    expect(parse("sort=NEWEST").sort, "the sort values are lower case").toBe(
      "featured",
    );

    // W-12: an unknown tag is dropped SILENTLY and renders no chip. The visitor
    // did not author it, there is nothing for them to do, and the count line
    // already tells the truth. Dropping is not cosmetic: filterListing
    // intersects an unknown tag to nothing, so keeping it would open the page on
    // an empty grid.
    expect(
      parse("tag=nonesuch").tags,
      "an unknown tag survived into the browse state",
    ).toEqual([]);
    expect(
      parse("tag=gestural&tag=nonesuch&tag=hypnotic").tags,
      "the unknown tag was dropped but took a known one with it",
    ).toEqual(["gestural", "hypnotic"]);
    expect(
      parse("tag=nonesuch&tag=gestural").tags,
      "an unknown tag in FIRST position must not shift the rest",
    ).toEqual(["gestural"]);

    // A repeat is the same tag pressed twice; the set is what the grid filters
    // by, so the second one is not a second chip.
    expect(
      parse("tag=gestural&tag=gestural").tags,
      "a repeated tag was activated twice",
    ).toEqual(["gestural"]);

    expect(parse("q=++ghost++").q, "the query is trimmed on parse").toBe(
      "ghost",
    );
    expect(parse("q=%20%20ghost%20%20").q, "percent-encoded spaces too").toBe(
      "ghost",
    );
    expect(parse("q=nine+drums").q, "an inner space is NOT trimmed").toBe(
      "nine drums",
    );
    expect(parse("q=+++").q, "a whitespace-only query is empty").toBe("");

    // Everything else in the address is somebody else's business and is ignored
    // rather than rejected: a link with a campaign parameter still opens.
    expect(
      parse("sort=name&utm_source=discord&page=3"),
      "an unrelated parameter changed the browse state",
    ).toEqual({ sort: "name", q: "", tags: [] });
  });

  it("encodes a space and a diacritic, and repeats tag once per active tag in activation order", () => {
    expect(
      serialiseBrowseQuery({ sort: "featured", q: "café noir", tags: [] }),
      "the query is percent- and plus-encoded by URLSearchParams",
    ).toBe("q=caf%C3%A9+noir");
    expect(
      serialiseBrowseQuery({ sort: "featured", q: "a&b=c#d", tags: [] }),
      "a query that is itself query syntax must not escape its own field",
    ).toBe("q=a%26b%3Dc%23d");

    // Activation order, not alphabetical order and not the chip row's order.
    // The chips are removable individually, so the address has to reproduce the
    // sequence the visitor built rather than a canonical one.
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "",
        tags: ["hypnotic", "ambient", "gestural"],
      }),
      "tag repeats once per active tag, in activation order",
    ).toBe("tag=hypnotic&tag=ambient&tag=gestural");
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "",
        tags: ["gestural", "ambient", "hypnotic"],
      }),
      "a different activation order is a different address",
    ).toBe("tag=gestural&tag=ambient&tag=hypnotic");

    // The whole address, in the order the UI spec writes it: sort, q, then tags.
    expect(
      serialiseBrowseQuery({
        sort: "newest",
        q: "ghost",
        tags: ["gestural", "generative"],
      }),
      "the address is not the one 05.1-UI-SPEC.md prints",
    ).toBe("sort=newest&q=ghost&tag=gestural&tag=generative");

    // And the parser reads that sequence back as the sequence, so a link
    // somebody sends restores the chips in the order they were pressed.
    expect(
      parse("tag=hypnotic&tag=ambient&tag=gestural").tags,
      "the parser sorted or reversed the tags",
    ).toEqual(["hypnotic", "ambient", "gestural"]);
  });

  it("imports nothing but ./sort, and names no catalog, no $app and no vendor in code", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = strip(source);

    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(1000);
    expect(
      stripped,
      "the stripper ate the code as well as the comments",
    ).toContain("export function serialiseBrowseQuery");

    // The non-vacuity half: the module must NAME the things it refuses, in
    // prose, so the scan below is proven to be reading a source that mentions
    // them rather than one that never could. (05.1-02's sort.ts deviation.)
    for (const name of ["$app/navigation", "$app/state", "catalog", "vendor"]) {
      expect(
        source,
        `query.ts must explain ${name} in a comment, or the scan is vacuous`,
      ).toContain(name);
    }

    for (const name of [
      "$app",
      "catalog",
      "vendor",
      "$lib/pad",
      "intechstudio",
    ]) {
      expect(stripped, `query.ts names ${name} in CODE`).not.toContain(name);
    }

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    expect(specifiers, "query.ts imports exactly one thing").toEqual([
      "./sort",
    ]);
  });
});
