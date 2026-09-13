// The structural gate over the gallery: the components, the route, and the
// pure modules underneath them.
//
// NINE SINCE PLAN 13-08 (six before it). These are the promises the Bible's
// page 2 and the earlier specifications make about colour, semantics and
// honesty, as gates rather than as sentences in a document. Most are
// properties of the SOURCE and run in well under a second; tests 8 and 9
// render the card with svelte/server, which the vitest server project can do
// (13-05 proved it), because "one accessible link name" is a property of the
// rendered tree and not of a regex. The e2e suite proves the behaviour; this
// proves the shape, on every commit.
//
// WHAT 13-08 DID TO THE SIX. Four survive with their subjects re-aimed at the
// new chrome (1, 2, 4, 5); test 3 - "the browse screen uses the lime ladder
// and nothing else" - is REWRITTEN against 13-03's eleven tokens, its name
// changed and its count not; test 6 survives as written. Three are new: the
// rail derived from FOR_TERMS with the count printed and exactly one facet
// row on the page (7); the card's one category, one tag, one sentence and
// one accessible link name (8); the favorite star's round trip through the
// store with the dropped-id case counted (9).
//
// EVERY SCAN STRIPS COMMENTS FIRST, and that is load-bearing rather than tidy.
// BrowseToolbar.svelte's header contains the sentence "No like count, no view
// count, no trending, no most, no rank" - correctly, because explaining why a
// word is absent is exactly what makes the absence survivable - and
// BrowseGrid.svelte's header names the three roles it refuses and the three
// pointer handlers it does not install. A scan over raw source would go red on
// correct code, and the natural fix for that would be deleting the paragraphs
// that make the rules legible.
//
// TEST 1'S NEEDLES ARE ASSEMBLED FROM FRAGMENTS so this file does not contain
// the words it forbids. The idiom is
// src/lib/transport/forbidden-instructions.spec.ts's, and the reason is the
// same: a future rule scanning the repository for a forbidden word must not have
// to carry an exclusion for the file that forbids it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { FOR_TERMS } from "$lib/browse/facets";
import { FOR_LABELS } from "$lib/browse/labels";
import { madeForRows, railSections } from "$lib/browse/rail";
import { LISTING, listingById, type ListingEntry } from "$lib/catalog/listing";
import { readFavorites, toggleFavorite } from "$lib/store/favorites";
import CatalogCard from "./CatalogCard.svelte";
import { stripComments } from "../../test-support/source";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const CARD = "src/lib/ui/CatalogCard.svelte";
const GRID = "src/lib/ui/BrowseGrid.svelte";
const TOOLBAR = "src/lib/ui/BrowseToolbar.svelte";
const CHIP = "src/lib/ui/TagChip.svelte";
/** One captioned facet row, in either of its two modes. */
const FACET = "src/lib/ui/FacetRow.svelte";
/** The workspace header's one right-hand slot, until 13-09. */
const LINK = "src/lib/ui/BrowseLink.svelte";
const PAGE = "src/routes/playground/+page.svelte";
const BROWSE_DIR = "src/lib/browse";
/** 13-03's palette, the one file identity.spec.ts reads the eleven from. */
const APP_CSS = "src/app.css";

/**
 * Everything the gallery is made of. Components that may not exist are
 * SKIPPED rather than asserted, and the floor below is what stops that skip
 * from hollowing the whole file out.
 */
const FLOOR = 4;

const browseFiles = (): string[] => [
  ...[CARD, GRID, TOOLBAR, CHIP, FACET, LINK].filter((rel) =>
    existsSync(repo(rel)),
  ),
  PAGE,
  ...readdirSync(repo(BROWSE_DIR))
    .map(String)
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".spec.ts"))
    .sort()
    .map((name) => `${BROWSE_DIR}/${name}`),
];

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));

/**
 * A style block split into rules. Crude on purpose, and copied from
 * tune-ui.spec.ts: every selector in these files is a plain class, element or
 * descendant selector on one line.
 */
function rulesOf(source: string): { selector: string; body: string }[] {
  const start = source.indexOf("<style>");
  if (start < 0) return [];
  const out: { selector: string; body: string }[] = [];
  for (const match of source.slice(start).matchAll(/([^{}]+)[{]([^{}]*)[}]/g)) {
    out.push({ selector: match[1].trim(), body: match[2] });
  }
  return out;
}

/** The opening tag of the element carrying `needle`, attributes and all. */
function openTagOf(source: string, needle: string): string {
  const at = source.indexOf(needle);
  if (at < 0) return "";
  return source.slice(source.lastIndexOf("<", at), source.indexOf(">", at) + 1);
}

/** The text between that element's tags, expressions and all. */
function textOf(source: string, needle: string): string {
  const at = source.indexOf(needle);
  if (at < 0) return "";
  const open = source.indexOf(">", at);
  return source.slice(open + 1, source.indexOf("</", open));
}

/**
 * A template's WORDS, with every `{expression}` removed and whitespace
 * collapsed, so a sentence can be pinned verbatim without pinning the names of
 * the runes that fill it in.
 */
const words = (template: string) =>
  template
    .replace(/[{][^{}]*[}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** How many `{#if}` and `{#each}` blocks are open at a point in the markup. */
function blockDepth(source: string, needle: string): number {
  const before = source.slice(0, source.indexOf(needle));
  const count = (token: string) => before.split(token).length - 1;
  return count("{#if") - count("{/if}") + (count("{#each") - count("{/each}"));
}

/** A store over a Map, the shape 13-06's specs use. */
function mapStore(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

/** A fixture entry whose three tags are distinguishable words. */
const FIXTURE: ListingEntry = {
  id: "fixture",
  name: "FIXTURE",
  description: "One sentence, and only one, about this configuration.",
  motion: "animated",
  tags: ["modulation", "readable", "precise"],
  featured: false,
  restsBlack: false,
  preview: "padsim",
};

/** Render the card with the props the grid gives it. */
const renderCard = (favorite: boolean, entry: ListingEntry = FIXTURE) =>
  render(CatalogCard, {
    props: {
      entry,
      tabbable: true,
      favorite,
      onready: () => {},
      onfocus: () => {},
      onfavorite: () => {},
    },
  }).body;

describe("the gallery's structural rules", () => {
  it("no popularity metric is shown or faked anywhere on the gallery", () => {
    // CAT-02 and 05.1-CONTEXT D-02 both require it: no popularity word appears
    // anywhere, and no bare number beside a tag that could be read as one. The
    // sort became a <select> at 13-08 and its two options are still Featured
    // and Name - a curation flag and the alphabet, nothing counted.
    //
    // ASSEMBLED FROM FRAGMENTS, so this file does not contain the words it
    // forbids and a future rule could scan it with no exclusion.
    const FORBIDDEN = [
      ["pop", "ular"],
      ["tren", "ding"],
      ["mo", "st"],
      ["be", "st"],
      ["lik", "es"],
      ["vie", "ws"],
      ["down", "loads"],
      ["rat", "ing"],
    ].map((parts) => parts.join(""));

    const hits = (source: string) =>
      FORBIDDEN.filter((needle) => source.toLowerCase().includes(needle));

    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );

    // The detector's own gate: shown a source that DOES carry each word, it
    // must find every one.
    expect(
      hits(FORBIDDEN.join(" ")),
      "the detector no longer recognises its own needles",
    ).toEqual(FORBIDDEN);

    const offenders: string[] = [];
    for (const file of files) {
      for (const needle of hits(code(file))) {
        offenders.push(`${file} -> ${needle}`);
      }
    }
    expect(
      offenders,
      "a browse file names a popularity metric in code or in rendered copy - CAT-02 and D-02 forbid it, and a catalog that ranks itself is a catalog that tells visitors what to like",
    ).toEqual([]);
  });

  it("every browse control declares the 44px floor", () => {
    // Phase 4's accessibility contract, and the LIST IS DERIVED from the
    // presence of a control rather than written down, so a file that grows its
    // first button later cannot slip past a hard-coded array. An anchor
    // counts: a card's whole target is the card. A select counts since 13-08:
    // the sort is one.
    const CONTROL = /<(button|input|select|a)[\s>]/;
    const withControls: string[] = [];
    const withoutControls: string[] = [];
    const missingFloor: string[] = [];

    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );

    for (const file of files) {
      const source = code(file);
      if (!CONTROL.test(source)) {
        withoutControls.push(file);
        continue;
      }
      withControls.push(file);
      if (!source.includes("min-block-size: 44px")) missingFloor.push(file);
    }

    expect(
      withControls.length,
      "files rendering a button, an input, a select or a link were found",
    ).toBeGreaterThanOrEqual(3);
    expect(
      withoutControls.length,
      "the derivation discriminates - if every file were classed as carrying a control the rule would be untested rather than universally satisfied",
    ).toBeGreaterThan(0);
    expect(
      missingFloor,
      "a browse file renders an interactive control and never declares min-block-size: 44px - Phase 4's touch floor is per control, not per page",
    ).toEqual([]);

    // AND THE SAME FLOOR ON THE INLINE AXIS, BY SELECTOR, for the two files
    // whose members are one short word wide: a chip reading `play` is under
    // the finger on both axes. `sr-only` is the visually-hidden checkbox,
    // the deliberate opposite of a box, and is the one exclusion.
    const NARROW = [FACET, CHIP].filter((rel) => existsSync(repo(rel)));
    expect(
      NARROW.length,
      "the both-axes walk found the components whose members are one word wide",
    ).toBeGreaterThan(0);
    const flat: string[] = [];
    let examined = 0;
    for (const file of NARROW) {
      const source = code(file);
      const rules = rulesOf(source);
      const NOT_A_BOX = ["sr-only"];
      const classes = new Set(
        [...source.matchAll(/<(a|button|input|label)[^>]*/g)]
          .flatMap((tag) =>
            [...tag[0].matchAll(/class[ ]*=[ ]*"([^"]*)"/g)].flatMap((attr) =>
              attr[1].split(/[ ]+/).filter((word) => word.length > 0),
            ),
          )
          .filter((cls) => !NOT_A_BOX.includes(cls)),
      );
      for (const cls of classes) {
        const body = rules
          .filter((rule) => rule.selector.includes(`.${cls}`))
          .map((rule) => rule.body)
          .join(" ");
        examined += 1;
        const block = body.includes("min-block-size: 44px");
        const inline = body.includes("min-inline-size: 44px");
        if (!block || !inline) flat.push(`${file} -> .${cls}`);
      }
    }
    expect(
      examined,
      "the both-axes walk found no interactive class at all - it has stopped looking",
    ).toBeGreaterThan(0);
    expect(
      flat,
      "a facet member declares the 44px floor on one axis only - a chip reading four characters is under the finger on both, and Phase 4's contract is about the box rather than about the line",
    ).toEqual([]);
  });

  it("the gallery uses the eleven tokens and nothing else", () => {
    // REWRITTEN AT 13-08 against 13-03's palette (it read "the lime ladder and
    // nothing else" until then; the ladder is gone). Three halves. Every
    // var(--color-*) a browse file names is one of the eleven src/app.css
    // declares - the eleven are READ from the file, never listed here, so the
    // day identity.spec.ts admits a twelfth this test follows it. No raw
    // colour: a hex literal or an rgb() is either a twelfth colour or a token
    // spelled out by hand, and both are the same regression (Phase 5's lime
    // tint on the active chip was exactly that until 13-08 removed it). And
    // the error ink appears nowhere: it is scoped to a 908-character meter,
    // and no meter exists on this screen.
    const tokens = [
      ...new Set(
        [...raw(APP_CSS).matchAll(/^\s*(--color-[a-z-]+)\s*:/gm)].map(
          (m) => m[1],
        ),
      ),
    ];
    expect(tokens.length, "src/app.css declares the eleven").toBe(11);
    expect(tokens).toContain("--color-error-ink");

    const HEX = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g;
    const RGB = /\brgba?\(/g;
    const USED = /var\((--color-[a-z-]+)\)/g;

    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );
    expect(
      HEX.test("background: #D6FF4E;"),
      "the hex matcher no longer recognises a hex",
    ).toBe(true);
    HEX.lastIndex = 0;

    const offenders: string[] = [];
    let read = 0;
    let named = 0;
    for (const file of files) {
      const source = code(file);
      read += source.length;
      for (const match of source.matchAll(USED)) {
        named += 1;
        if (!tokens.includes(match[1])) {
          offenders.push(`${file} -> ${match[1]} is not one of the eleven`);
        }
        if (match[1] === "--color-error-ink") {
          offenders.push(`${file} -> the error ink, which belongs to a meter`);
        }
      }
      for (const match of source.matchAll(HEX)) {
        offenders.push(`${file} -> ${match[0]}`);
      }
      for (const match of source.matchAll(RGB)) {
        offenders.push(`${file} -> ${match[0]}`);
      }
    }

    expect(read, "the browse files' code was actually read").toBeGreaterThan(
      2000,
    );
    expect(
      named,
      "the browse files name tokens at all - a scan that found none is blind",
    ).toBeGreaterThan(20);
    expect(
      offenders,
      "the gallery names a colour that is not one of 13-03's eleven tokens, a raw hex or rgb(), or the error ink that belongs to a meter this page does not have",
    ).toEqual([]);
  });

  it("the search field is at the iOS zoom floor", () => {
    // 16px is not a taste. iOS Safari zooms the viewport when a text input
    // smaller than 16px takes focus, and a gallery whose search field zooms
    // the page on the first keystroke is one a phone visitor fights.
    const source = code(TOOLBAR);
    expect(source.length, "the toolbar was read").toBeGreaterThan(1000);

    const fieldRules = rulesOf(source).filter((rule) =>
      rule.selector.includes("input"),
    );
    expect(
      fieldRules.length,
      "no rule in the toolbar's style block targets an input - this test has stopped looking at the search field",
    ).toBeGreaterThan(0);
    expect(
      fieldRules.some((rule) => rule.body.includes("font-size: 16px")),
      "the search input no longer declares font-size: 16px - anything smaller makes iOS Safari zoom the viewport the moment the field takes focus, and a quieter 12px is exactly the edit this message exists to refuse",
    ).toBe(true);
  });

  it("the grid is a list of links, not a listbox and not a grid", () => {
    // W-07. A listbox SELECTS a centred value and a grid NAVIGATES a table; a
    // wall of destinations does neither. Both roles REPLACE the link role, and
    // with it a screen reader's links list, middle-click and open-in-new-tab.
    // The sort left the radiogroup for a <select> at 13-08, so the roles the
    // screen legitimately carries are the list and the facet's group.
    const REFUSED = ["listbox", "option", "grid", "gridcell"].map(
      (name) => `role="${name}"`,
    );
    const KEPT = ['role="list"', 'role="group"'];

    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );

    const sources = files.map(code);
    const joined = sources.join("\n");

    expect(
      KEPT.filter((role) => joined.includes(role)),
      "none of the roles the gallery legitimately carries was found - this scan is blind",
    ).toEqual(KEPT);

    const offenders: string[] = [];
    files.forEach((file, index) => {
      for (const role of REFUSED) {
        if (sources[index].includes(role)) offenders.push(`${file} -> ${role}`);
      }
    });
    expect(
      offenders,
      "a browse file declares a role that replaces the link role - the shareability of a card rests on it being a real anchor",
    ).toEqual([]);

    // AND THE GROUP THIS SCREEN DECLARES CARRIES A NAME, derived from the
    // facet's own name so a second row could never share it.
    if (existsSync(repo(FACET))) {
      const facet = code(FACET);
      const group = openTagOf(facet, 'role="group"');
      expect(
        group,
        'a facet row declares role="group" without an aria-labelledby, so a screen reader announces a boundary and never says which facet it is',
      ).toContain("aria-labelledby");
      expect(
        group,
        "the facet row's group is not labelled by an id derived from the facet's own name",
      ).toContain("aria-labelledby={captionId}");
      expect(
        facet,
        "the facet row's caption element no longer carries the id its group points at",
      ).toContain("id={captionId}");
      expect(
        facet.includes("facet-${name}-caption"),
        "the caption id is no longer derived from the facet's name",
      ).toBe(true);
    }

    // Exactly one anchor per card, and the pad is not part of its name.
    const card = code(CARD);
    expect(
      [...card.matchAll(/<a[\s>]/g)].length,
      "a card carries something other than exactly one anchor - two would give a screen reader two entries in its links list for one destination",
    ).toBe(1);
    expect(
      openTagOf(card, 'class="pad-wrap"'),
      'the card\'s pad wrapper no longer carries aria-hidden="true", so PadCanvas\'s own role="img" name is announced beside the card\'s name and every card reads twice',
    ).toContain('aria-hidden="true"');
  });

  it("the count is said three ways, and only one of them is a live region", () => {
    // 05.1-UI-SPEC.md's Accessibility Contract, "Count, spoken two ways", plus
    // the live region row. Three elements doing three jobs: the VISIBLE line,
    // instant and aria-hidden; the always-present hidden EXPANSION, which is
    // what a visitor landing on a shared, already-filtered address reads; the
    // LIVE REGION, which speaks once per settled change.
    //
    // SCOPED TO src/ ON PURPOSE. Every hydrated SvelteKit page carries a SECOND
    // aria-live element that is not ours (Kit's #svelte-announcer), invisible
    // to a source scan - which is why "exactly one" is a safe claim HERE and
    // would be a false one in a browser.
    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );

    const carriers: string[] = [];
    let regions = 0;
    for (const file of files) {
      const found = code(file).split("aria-live").length - 1;
      regions += found;
      if (found > 0) carriers.push(file);
    }
    const toolbar = code(TOOLBAR);

    // 1. The visible line: seen, and hidden from the accessibility tree.
    const visible = openTagOf(toolbar, 'data-testid="browse-count"');
    expect(
      visible,
      'the visible count line is no longer aria-hidden="true", so the count is announced twice',
    ).toContain('aria-hidden="true"');
    expect(
      words(textOf(toolbar, 'data-testid="browse-count"')),
      "the visible count line no longer reads {n} of {total} configurations.",
    ).toBe(words("{n} of {total} configurations."));

    // 2. The expansion: always there, never a region, never hidden.
    const expansionId = 'data-testid="browse-count-expansion"';
    expect(
      toolbar.includes(expansionId),
      "the hidden count expansion is gone - a visitor arriving on a shared, already-filtered address is now told nothing about how much of the catalog they are looking at",
    ).toBe(true);
    expect(
      blockDepth(toolbar, expansionId),
      "the count expansion sits inside an {#if} or an {#each} - it must be rendered unconditionally, because the case it exists for is the one where nothing has changed",
    ).toBe(0);
    const expansion = openTagOf(toolbar, expansionId);
    expect(
      expansion.includes("aria-live"),
      "the count expansion has become a live region - two voices saying the same number",
    ).toBe(false);
    expect(
      expansion.includes("aria-hidden"),
      "the count expansion is aria-hidden, which removes the only sentence that tells an arriving visitor what they are looking at",
    ).toBe(false);
    expect(
      words(textOf(toolbar, expansionId)),
      "the count expansion no longer reads Showing {n} of {total} configurations.",
    ).toBe(words("Showing {n} of {total} configurations."));

    // 3. The live region, and the fact that it is the only one.
    const region = openTagOf(toolbar, 'data-testid="browse-live"');
    expect(
      region,
      "the live region is not polite - an assertive one interrupts a screen reader mid-word for a count",
    ).toContain('aria-live="polite"');
    expect(
      region,
      'the live region is not aria-atomic="true", so a screen reader may read only the changed words rather than the whole sentence',
    ).toContain('aria-atomic="true"');
    expect(
      `${regions} in ${carriers.join(", ")}`,
      "the gallery carries something other than exactly one aria-live region in exactly one file",
    ).toBe(`1 in ${TOOLBAR}`);
  });

  it("the MADE FOR rows equal FOR_TERMS member for member, in order, through FOR_LABELS - the count printed, never typed - and there is exactly one facet row on the page", () => {
    // 13-CONTEXT D-11 chose HANGAR's own FOR terms for the rail, "honest to
    // the catalog", and named eight; plan 12-04 then retired `keys`
    // (13-VALIDATION D-4). The decision's reason is satisfied only by
    // DERIVING the rows from the vocabulary and asserting the count as
    // observed - so this test compares member for member and prints what it
    // found, and asserts neither seven nor eight.
    const rows = madeForRows();
    expect(
      rows.map((row) => row.term),
      "the MADE FOR rows are FOR_TERMS, member for member, in the vocabulary's own order",
    ).toEqual([...FOR_TERMS]);
    expect(
      rows.map((row) => row.label),
      "every MADE FOR row is labelled through FOR_LABELS - the same record the chip row reads, so a chip and its rail row cannot carry two unrelated strings",
    ).toEqual(FOR_TERMS.map((term) => FOR_LABELS[term]));
    for (const row of rows) {
      expect(row.count, `${row.id} carries no count: the PDF shows none`).toBe(
        undefined,
      );
      expect(
        row.label,
        `${row.id}'s label is not an upper-cased identifier (D-05)`,
      ).not.toBe(row.term.toUpperCase());
    }
    expect(
      Object.keys(FOR_LABELS).sort(),
      "FOR_LABELS is keyed by exactly the vocabulary",
    ).toEqual([...FOR_TERMS].sort());

    // The whole rail: the three library rows with counts, a second section
    // that IS the derived rows.
    const sections = railSections({ all: 26, favorites: 8, recent: 6 });
    expect(sections.map((s) => s.title)).toEqual(["YOUR LIBRARY", "MADE FOR"]);
    expect(sections[0].rows.map((r) => [r.label, r.count])).toEqual([
      ["All configs", 26],
      ["Favorites", 8],
      ["Recently used", 6],
    ]);
    expect(sections[1].rows).toEqual(rows);

    // THE PAGE RENDERS THE DERIVATION AND TYPES NO LITERAL. A source scan of
    // the route and the rail module: railSections is called, and no array
    // literal in either names a FOR term as a string - the vocabulary is
    // named once, in facets.ts.
    const page = code(PAGE);
    expect(
      page.includes("railSections("),
      "the page no longer derives its rail through railSections()",
    ).toBe(true);
    const railModule = code("src/lib/browse/rail.ts");
    expect(
      railModule.includes("FOR_TERMS.map("),
      "rail.ts no longer maps FOR_TERMS - the rows are typed somewhere",
    ).toBe(true);
    for (const source of [page, railModule]) {
      for (const term of FOR_TERMS) {
        expect(
          new RegExp(`["'\`]${term}["'\`]`).test(source),
          `the FOR term "${term}" is written as a literal in the page or the rail module - the rail is DERIVED, never typed`,
        ).toBe(false);
      }
    }

    // EXACTLY ONE FACET ROW ON THE PAGE (D-11: the FEELS row is gone; the
    // PDF has no Character filter). The toolbar mounts FacetRow once, for the
    // FOR facet, through FOR_TERMS and FOR_LABELS; nothing mounts FEELS_TERMS
    // or FACETS as a row.
    const toolbar = code(TOOLBAR);
    expect(
      [...toolbar.matchAll(/<FacetRow\b/g)].length,
      "the toolbar renders something other than exactly one facet row - the FEELS row was dropped by D-11 and its terms live on the card",
    ).toBe(1);
    expect(
      toolbar.includes("terms={FOR_TERMS}"),
      "the row is the FOR facet",
    ).toBe(true);
    expect(
      toolbar.includes("labels={FOR_LABELS}"),
      "the chip row reads FOR_LABELS - the same record as the rail",
    ).toBe(true);
    expect(
      [...toolbar.matchAll(/\bFEELS_TERMS\b|\bFACETS\b/g)].length,
      "the toolbar names the FEELS vocabulary or the FACETS pair - a second row is one {#each} away",
    ).toBe(0);
    expect(
      [...page.matchAll(/<FacetRow\b/g)].length,
      "the page mounts a facet row of its own beside the toolbar's",
    ).toBe(0);

    console.log(
      `13-08 MADE FOR: ${rows.length} rows derived from FOR_TERMS (${rows.map((r) => `${r.term} -> ${r.label}`).join(", ")}); D-11 said eight, 12-04 retired keys`,
    );
  });

  it("a card shows one category and one tag from tags[0] and tags[1], tags[2] nowhere, one sentence from description, and exactly one accessible link name", () => {
    const body = renderCard(false);

    // ONE CATEGORY, THROUGH FOR_LABELS; ONE TAG, THE FIRST FEELS TERM AS
    // ITSELF; THE THIRD TAG NOWHERE. The fixture's three are distinguishable
    // words, so an absent one is an absent one.
    expect(body, "the category is tags[0] through FOR_LABELS").toContain(
      `>${FOR_LABELS.modulation}<`,
    );
    expect(body, "the tag is tags[1]").toContain(">readable<");
    expect(
      body,
      "tags[2] is not shown - a decision, not an omission",
    ).not.toContain("precise");
    expect(
      body,
      "the third tag's upper-cased form is not shown either",
    ).not.toContain("PRECISE");

    // ONE SENTENCE, FROM description, ONCE.
    expect(
      body.split(FIXTURE.description).length - 1,
      "the description appears exactly once",
    ).toBe(1);

    // EXACTLY ONE LINK, WITH EXACTLY ONE ACCESSIBLE NAME - the entry's name.
    // The Explore box is aria-hidden; the star is a button whose name is not
    // the entry's name alone; nothing else in the card is an anchor.
    const anchors = [...body.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
    expect(anchors, "exactly one anchor in the rendered card").toHaveLength(1);
    expect(anchors[0]).toContain(`aria-label="${FIXTURE.name}"`);
    expect(anchors[0]).toContain('href="/playground/fixture"');
    expect(anchors[0]).toContain('aria-describedby="card-description-fixture"');

    const explore = /<span class="explore[^"]*"[^>]*>/.exec(body)?.[0] ?? "";
    expect(explore, "the Explore box is rendered").not.toBe("");
    expect(
      explore,
      "the Explore box is not aria-hidden - a screen reader would hear a second control for the one destination",
    ).toContain('aria-hidden="true"');
    expect(body).toContain("Explore");

    // THE BOX AS PDF PAGE 2 DRAWS IT (13.1-01, D-02; bench line 2: "not the
    // proper grey color, not grifter, and the arrow is on the second row").
    // Measured off the page: the fill is --color-panel to the byte, the
    // hairline --color-divider to the byte, the word in the display face;
    // and the arrow is on the word's row because the box is one flex row
    // that never wraps (13-08's display: grid put the text node and the
    // span in two rows). The declarations are read off the rule itself.
    const exploreRule =
      rulesOf(code(CARD)).find((rule) => rule.selector === ".explore")?.body ??
      "";
    expect(exploreRule, "the .explore rule exists").not.toBe("");
    for (const decl of [
      "display: inline-flex",
      "align-items: center",
      "white-space: nowrap",
      "background: var(--color-panel)",
      "border: 1px solid var(--color-divider)",
      "font-family: var(--font-display)",
      "font-weight: 700",
      "min-block-size: 44px",
    ]) {
      expect(exploreRule, `.explore declares ${decl}`).toContain(decl);
    }
    expect(
      exploreRule,
      "no grid on the box - that was the second row",
    ).not.toContain("display: grid");
    expect(exploreRule, "the sans face is gone from the box").not.toContain(
      "var(--font-sans)",
    );
    // No radius above zero anywhere in the file (the star's explicit 0 is
    // the one occurrence, and it is a zero - radius.spec.ts's exempt case).
    for (const m of code(CARD).matchAll(/border-radius:\s*([^;]+);/g)) {
      expect(m[1].trim(), `a radius in CatalogCard.svelte: ${m[0]}`).toBe("0");
    }

    // The whole card is the link: the overlay is declared on the anchor.
    const card = code(CARD);
    expect(
      card.includes(".name::after") && card.includes("inset: 0"),
      "the anchor's overlay is gone - the whole card is no longer the link",
    ).toBe(true);
    // And nothing inside the card is a second anchor even under the
    // unavailable branch: the source has one <a and its name is the label.
    expect([...card.matchAll(/<a[\s>]/g)].length).toBe(1);
    expect(openTagOf(card, 'class="name"')).toContain("aria-label={label}");

    // The names a screen reader could hear on the card: one link name (the
    // entry's), one button name (the star's), and no other - PadCanvas's own
    // "{name}, live pad simulation" sits inside the aria-hidden wrapper test 5
    // holds, so it is discounted here by its suffix and not by position.
    const labels = [...body.matchAll(/aria-label="([^"]*)"/g)]
      .map((m) => m[1])
      .filter((name) => !name.endsWith(", live pad simulation"));
    expect(labels, "one link name and one star name, nothing else").toEqual([
      FIXTURE.name,
      `Add ${FIXTURE.name} to your favorites`,
    ]);
  });

  it("the favorite star round-trips through the store, reflects a preset state on mount, and an id the catalog no longer carries is dropped with the drop counted", () => {
    // THE STORE, AGAINST THE LIVE CATALOG's VALIDATOR. The thirteen ids
    // Phases 11 and 12 removed (nine from 11-01, three from 12-04, tpad from
    // 12-10) are real drop cases; seeded beside one live id, the read returns
    // the one and counts the thirteen.
    const known = (id: string) => listingById(id) !== undefined;
    const removed = [
      "hold",
      "keys",
      "learn",
      "switch",
      "etch",
      "gridlock",
      "life",
      "slam",
      "table",
      "lattice",
      "forge",
      "shuttle",
      "tpad",
    ];
    for (const id of removed) {
      expect(known(id), `${id} is really gone from the catalog`).toBe(false);
    }
    const live = LISTING[0].id;
    const store = mapStore();
    store.setItem(
      "hangar.favorites.v1",
      JSON.stringify({ schema: 1, ids: [live, ...removed] }),
    );
    const read = readFavorites(store, known);
    expect(read.ids, "the live id survives the read").toEqual([live]);
    expect(read.dropped, "the removed ids are dropped and counted").toBe(
      removed.length,
    );
    console.log(
      `13-08 favorites: ${read.dropped} of ${removed.length + 1} seeded ids dropped against the live catalog of ${LISTING.length}`,
    );

    // THE ROUND TRIP: star, read, unstar, read - through the page's own calls.
    const fresh = mapStore();
    expect(readFavorites(fresh, known).ids).toEqual([]);
    expect(toggleFavorite(fresh, live, known), "starred").toBe(true);
    expect(readFavorites(fresh, known).ids).toEqual([live]);
    expect(toggleFavorite(fresh, live, known), "unstarred").toBe(false);
    expect(readFavorites(fresh, known).ids).toEqual([]);
    expect(
      toggleFavorite(fresh, "tpad", known),
      "an id the catalog no longer carries cannot be starred",
    ).toBe(undefined);

    // THE PAGE WIRES THE STORE WITH THE CATALOG's VALIDATOR, reading in
    // onMount and never at module scope.
    const page = code(PAGE);
    expect(page.includes("readFavorites(local(), known)")).toBe(true);
    expect(page.includes("toggleFavorite(local(), id, known)")).toBe(true);
    expect(page.includes("listingById(id) !== undefined")).toBe(true);
    const mountAt = page.indexOf("onMount(() => {");
    const mountBody = page.slice(mountAt, page.indexOf("});", mountAt));
    expect(mountAt, "the page has an onMount").toBeGreaterThan(0);
    expect(
      mountBody.includes("readLibrary();"),
      "the store is read inside onMount, not at module scope",
    ).toBe(true);
    expect(
      page
        .slice(0, page.indexOf("function readLibrary"))
        .includes("readLibrary();"),
      "nothing before the function's own definition calls it at init",
    ).toBe(false);

    // THE STAR REFLECTS A PRESET STATE ON MOUNT, with its two names.
    const off = renderCard(false);
    const on = renderCard(true);
    expect(off).toContain('data-favorite="false"');
    expect(off).toContain(`aria-label="Add ${FIXTURE.name} to your favorites"`);
    expect(off).toContain(">☆<");
    expect(on).toContain('data-favorite="true"');
    expect(on).toContain(
      `aria-label="Remove ${FIXTURE.name} from your favorites"`,
    );
    expect(on).toContain(">★<");
    // It is a button, it is not inside the anchor, and it roves with the card.
    const star = openTagOf(code(CARD), 'class="star"');
    expect(star.startsWith("<button")).toBe(true);
    expect(star).toContain('type="button"');
    expect(star).toContain("tabindex={tabbable ? 0 : -1}");
    const source = code(CARD);
    expect(
      source.indexOf('class="star"') > source.indexOf("</a"),
      "the star is a sibling after the anchor, never its child",
    ).toBe(true);
  });
});
