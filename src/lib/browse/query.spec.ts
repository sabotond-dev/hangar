// The browse address, parsed and serialised.
//
// Five tests, one per behaviour the page depends on: the canonical empty
// address, a round trip over a table of states, the fallbacks and the trim -
// which is where G-10's legacy migration lives - the encoding and the term
// order, and the import rule.
//
// Test 3 is the one with a mutation on the record. Make parseBrowseQuery keep an
// unknown `?for=` and it goes red naming the term that survived; make it DROP an
// unmapped `?tag=` and it goes red naming `looper`. Those two pull in opposite
// directions and both are deliberate:
//
//   - an unknown `?for=` reaching filterListing intersects the grid to nothing
//     (filter.ts deliberately does NOT drop it), so a link carrying a word this
//     site never shipped would open on an empty catalog instead of on one;
//   - an unmapped `?tag=` is a word this site really DID ship, on one card, and
//     dropping it would break exactly the links most likely to exist. It lands
//     in the search field instead - `?tag=looper` as `?q=looper` - which is
//     where the singletons were always reachable anyway.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FEELS_TERMS, FOR_TERMS, LEGACY_TAG_MAP } from "./facets";
import {
  DEFAULT_QUERY,
  parseBrowseQuery,
  serialiseBrowseQuery,
  type BrowseQuery,
  type BrowseVocabulary,
} from "./query";

const SOURCE_PATH = fileURLToPath(new URL("./query.ts", import.meta.url));

/** Line and block comments removed, so a structural scan reads code only. */
const strip = (source: string) =>
  source.replace(/^[ ]*[/][/].*$/gm, "").replace(/[/][*][^]*?[*][/]/g, "");

/**
 * The declared vocabulary and the legacy table - the argument the page passes.
 *
 * It is the SHIPPED facets rather than a fixture, so a term that left the
 * vocabulary takes every sample below with it rather than leaving this file
 * asserting a parser against words the site no longer has.
 */
const VOCABULARY: BrowseVocabulary = {
  for: FOR_TERMS,
  feels: FEELS_TERMS,
  legacy: LEGACY_TAG_MAP,
};

const parse = (search: string): BrowseQuery =>
  parseBrowseQuery(new URLSearchParams(search), VOCABULARY);

/**
 * The five states the round trip is asserted over: sort only, query only, one
 * `FOR` term, three terms across both facets in a deliberate order that is NOT
 * alphabetical, and all of it together with a space and a diacritic in the
 * query.
 *
 * THE SAMPLE TERMS MOVED IN 10-06 AND THE PARAMETERS MOVED IN 10-07. They were
 * `gestural`, `hypnotic` and `ambient` under a single `?tag=`; D-10 retired all
 * three words and A-20 split the parameter in two. They are now drawn from the
 * closed thirteen and sorted into the facet each belongs to, which is what
 * `?for=` and `?feels=` mean. NO TITLE HERE MOVED AT PLAN 12-04: it retired the
 * FOR term `keys`, which was minted at the 10-06 re-cut and was therefore never
 * a shipped `?tag=`, so LEGACY_TAG_MAP gained no row and every `?tag=` title
 * below asks exactly what it asked before.
 */
const STATES: readonly {
  readonly what: string;
  readonly query: BrowseQuery;
}[] = [
  { what: "sort only", query: { sort: "name", q: "", for: [], feels: [] } },
  {
    what: "query only",
    query: { sort: "featured", q: "ghost", for: [], feels: [] },
  },
  {
    what: "one FOR term",
    query: { sort: "featured", q: "", for: ["modulation"], feels: [] },
  },
  {
    what: "three terms across both facets, in activation order",
    query: {
      sort: "featured",
      q: "",
      for: ["modulation"],
      feels: ["precise", "readable"],
    },
  },
  {
    what: "all of it at once",
    query: {
      sort: "name",
      q: "café noir",
      for: ["play"],
      feels: ["generative", "playable"],
    },
  },
];

describe("the browse query string (src/lib/browse/query.ts)", () => {
  it("serialises the default query to nothing at all, so /playground/ is the canonical address", () => {
    expect(
      DEFAULT_QUERY,
      "the default is FEATURED, no query, no chips",
    ).toEqual({
      sort: "featured",
      q: "",
      for: [],
      feels: [],
    });
    expect(
      serialiseBrowseQuery(DEFAULT_QUERY),
      "the default query must serialise to the empty string",
    ).toBe("");

    // The same address written three other ways is still the default state, so
    // a bare /playground/, a stray ?, and an explicitly-default link all agree.
    for (const search of ["", "?", "sort=featured", "?sort=featured&q="]) {
      expect(parse(search), `"${search}" is the default state`).toEqual(
        DEFAULT_QUERY,
      );
    }

    // And the default is reachable BACK from any state: clearing every filter
    // returns the canonical empty address rather than ?sort=featured&q=.
    expect(
      serialiseBrowseQuery({ sort: "featured", q: "", for: [], feels: [] }),
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

    // FEATURED is omitted; the surviving non-default sort is written. This is
    // the omission rule from 05.1-UI-SPEC.md's URL-visible state table, as
    // amended by D-11 - there is no third sort to write any more.
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "ghost",
        for: [],
        feels: [],
      }),
      "the default sort is omitted",
    ).toBe("q=ghost");
    expect(
      serialiseBrowseQuery({ sort: "name", q: "", for: [], feels: [] }),
      "a non-default sort is written",
    ).toBe("sort=name");
  });

  it("falls back on a retired sort, migrates a legacy tag, and trims the query", () => {
    expect(
      parse("sort=popular").sort,
      "a sort nobody ships must open on the catalog, not on an error",
    ).toBe("featured");
    expect(parse("sort=").sort, "an empty sort is the default").toBe(
      "featured",
    );
    expect(parse("sort=NAME").sort, "the sort values are lower case").toBe(
      "featured",
    );

    // D-11's own fallback, asserted rather than assumed. ?sort=newest is the
    // one retired value that really is out there on links people sent, and it
    // has to open on the catalog SILENTLY - no message, no error, no empty
    // grid. The rule needed no code change; what it needed was a test.
    expect(
      parse("sort=newest").sort,
      "a link carrying the retired Newest sort must open on FEATURED",
    ).toBe("featured");
    expect(
      parse("sort=newest&feels=playable"),
      "and it takes the rest of the address with it, unharmed",
    ).toEqual({
      sort: "featured",
      q: "",
      for: [],
      feels: ["playable"],
    });

    // W-12 UNAMENDED, for the two NEW parameters: a term nobody declares is
    // dropped silently and renders no chip. The visitor did not author it,
    // there is nothing for them to do, and the count line already tells the
    // truth. Dropping is not cosmetic - filterListing gives an unknown term an
    // empty OR, so keeping it would open the page on an empty grid.
    expect(
      parse("for=nonesuch").for,
      "an unknown FOR term survived into the browse state",
    ).toEqual([]);
    expect(
      parse("for=modulation&for=nonesuch&for=play").for,
      "the unknown term was dropped but took a known one with it",
    ).toEqual(["modulation", "play"]);
    expect(
      parse("for=nonesuch&for=modulation").for,
      "an unknown term in FIRST position must not shift the rest",
    ).toEqual(["modulation"]);
    expect(
      parse("feels=playable&for=playable"),
      "a term is only accepted in ITS OWN facet's parameter",
    ).toEqual({ sort: "featured", q: "", for: [], feels: ["playable"] });

    // A repeat is the same chip pressed twice; the set is what the grid filters
    // by, so the second one is not a second chip.
    expect(
      parse("feels=precise&feels=precise").feels,
      "a repeated term was activated twice",
    ).toEqual(["precise"]);

    // G-10, THE MIGRATION, AND THE FOUR WAYS AN INBOUND ?tag= CAN GO.
    //
    // MAPPED: the old word has a facet term and becomes that chip. `drums`
    // mapped to ITSELF under clause 1 until plan 11-01 retired it (D-01); it
    // now folds to `play` under clause 2, because `ninepads` - one of its two
    // carriers - was re-homed there and the other, `slam`, was deleted. THIS
    // ASSERTION IS THE D-01 LINK MIGRATION'S ONLY TEST: an address somebody
    // shared while `drums` was a chip still lands on a live grid.
    expect(parse("tag=drums"), "a mapped legacy tag becomes its chip").toEqual({
      sort: "featured",
      q: "",
      for: ["play"],
      feels: [],
    });
    // And the second half of the same D-01 fold, so both retired terms are
    // covered rather than one standing in for the pair.
    expect(
      parse("tag=clips").for,
      "the other retired FOR term lands on the term its surviving carrier took",
    ).toEqual(["shortcuts"]);
    // A FOLD, which is the same rule reaching a different word: `sequencer`
    // retired into the `sequencing` facet term.
    expect(
      parse("tag=sequencer").for,
      "a folded legacy tag becomes the term it folded into",
    ).toEqual(["sequencing"]);
    // A mapped tag lands in whichever facet owns it, not always the first.
    expect(
      parse("tag=hypnotic"),
      "hypnotic folds into a FEELS term, not a FOR one",
    ).toEqual({ sort: "featured", q: "", for: [], feels: ["generative"] });

    // SHIPPED BUT UNMAPPED: it becomes the SEARCH QUERY rather than being
    // dropped. `looper` sat on exactly one entry, which is what somebody means
    // when they share it, and 10-UI-SPEC 9.4's own worked example is this line.
    expect(parse("tag=looper"), "?tag=looper must land as ?q=looper").toEqual({
      sort: "featured",
      q: "looper",
      for: [],
      feels: [],
    });

    // AN EXPLICIT ?q= ALWAYS WINS, which is the precedence the spec left open.
    // A value the visitor typed outranks one inferred from a retired word.
    expect(
      parse("tag=looper&q=aurora"),
      "an explicit query must not be overwritten by a retired tag",
    ).toEqual({ sort: "featured", q: "aurora", for: [], feels: [] });
    expect(
      parse("q=aurora&tag=looper").q,
      "and the precedence does not depend on which came first in the address",
    ).toBe("aurora");

    // TWO UNMAPPED TAGS join with a single space, in ADDRESS order - the only
    // order that exists on the reading side.
    expect(
      parse("tag=looper&tag=arpeggio").q,
      "two unmapped tags join in address order",
    ).toBe("looper");
    expect(
      parse("tag=looper&tag=lighting").q,
      "two shipped-but-unmapped tags join with one space, in address order",
    ).toBe("looper lighting");
    expect(
      parse("tag=lighting&tag=looper").q,
      "and the reverse address is the reverse query",
    ).toBe("lighting looper");

    // MIXED: one maps, one does not, and each goes where it belongs.
    expect(parse("tag=drums&tag=looper"), "a chip and a query at once").toEqual(
      {
        sort: "featured",
        q: "looper",
        for: ["play"],
        feels: [],
      },
    );

    // NEVER A TAG AT ALL: `arpeggio` is not a key of the legacy table, so no
    // link this site produced can name it. W-12 unamended - it is dropped, and
    // it does NOT become a query. That is the distinction 10-06 built the
    // explicit-undefined table for: `"looper" in LEGACY_TAG_MAP` is true and
    // `"arpeggio" in LEGACY_TAG_MAP` is false.
    expect(
      "looper" in LEGACY_TAG_MAP,
      "looper is a key the site really shipped",
    ).toBe(true);
    expect(
      LEGACY_TAG_MAP.looper,
      "and its value is undefined, written out",
    ).toBeUndefined();
    expect(
      "arpeggio" in LEGACY_TAG_MAP,
      "arpeggio was never a tag on this site",
    ).toBe(false);
    expect(
      parse("tag=arpeggio"),
      "a word that was never a tag is dropped",
    ).toEqual(DEFAULT_QUERY);

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
    expect(
      parse("q=+++&tag=looper").q,
      "a whitespace-only query is EMPTY, so the retired tag still lands",
    ).toBe("looper");

    // Everything else in the address is somebody else's business and is ignored
    // rather than rejected: a link with a campaign parameter still opens.
    expect(
      parse("sort=name&utm_source=discord&page=3"),
      "an unrelated parameter changed the browse state",
    ).toEqual({ sort: "name", q: "", for: [], feels: [] });
  });

  it("encodes a space and a diacritic, and repeats each parameter once per active chip in activation order", () => {
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "café noir",
        for: [],
        feels: [],
      }),
      "the query is percent- and plus-encoded by URLSearchParams",
    ).toBe("q=caf%C3%A9+noir");
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "a&b=c#d",
        for: [],
        feels: [],
      }),
      "a query that is itself query syntax must not escape its own field",
    ).toBe("q=a%26b%3Dc%23d");

    // Activation order, not alphabetical order and not the chip row's order.
    // The chips are removable individually, so the address has to reproduce the
    // sequence the visitor built rather than a canonical one.
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "",
        for: [],
        feels: ["precise", "readable", "generative"],
      }),
      "feels repeats once per active chip, in activation order",
    ).toBe("feels=precise&feels=readable&feels=generative");
    expect(
      serialiseBrowseQuery({
        sort: "featured",
        q: "",
        for: [],
        feels: ["generative", "readable", "precise"],
      }),
      "a different activation order is a different address",
    ).toBe("feels=generative&feels=readable&feels=precise");

    // The whole address, in the order the UI spec writes it as amended by G-10:
    // sort, q, then every FOR, then every FEELS.
    expect(
      serialiseBrowseQuery({
        sort: "name",
        q: "ghost",
        for: ["modulation", "play"],
        feels: ["generative"],
      }),
      "the address is not the one 10-UI-SPEC 9.4 prints",
    ).toBe("sort=name&q=ghost&for=modulation&for=play&feels=generative");

    // AND `tag` IS NEVER WRITTEN AGAIN. The legacy parameter is read-only for
    // its one release, so an address a visitor builds is always the new shape -
    // asserted over every state rather than on one, because a serialiser that
    // wrote it in a branch nobody sampled would ship.
    for (const { what, query } of STATES) {
      expect(
        serialiseBrowseQuery(query),
        `${what}: the serialiser wrote the retired tag parameter`,
      ).not.toContain("tag=");
    }
    expect(
      serialiseBrowseQuery(parse("tag=drums&tag=looper")),
      "a legacy address is REWRITTEN into the new shape, never echoed",
    ).toBe("q=looper&for=play");

    // And the parser reads that sequence back as the sequence, so a link
    // somebody sends restores the chips in the order they were pressed.
    expect(
      parse("feels=precise&feels=readable&feels=generative").feels,
      "the parser sorted or reversed the terms",
    ).toEqual(["precise", "readable", "generative"]);
    // Across the two parameters, the walk is over the ADDRESS in order, so an
    // interleaved address restores each facet's own sequence.
    expect(
      parse("feels=precise&for=play&feels=readable"),
      "an interleaved address keeps each facet's activation order",
    ).toEqual({
      sort: "featured",
      q: "",
      for: ["play"],
      feels: ["precise", "readable"],
    });
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

    // STILL EXACTLY ONE, AFTER G-10. The legacy table could have been imported
    // from ./facets here; it is passed in instead, as one object beside the two
    // facet lists, so the migration cost this module no specifier at all.
    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    expect(specifiers, "query.ts imports exactly one thing").toEqual([
      "./sort",
    ]);
  });
});
