// The structural gate over the browse screen: the four components, the route,
// and the six pure modules underneath them.
//
// These are the promises 05.1-UI-SPEC.md makes about colour, contrast,
// semantics and honesty, as gates rather than as sentences in a document. Every
// one of them is a property of the SOURCE rather than of a rendered tree, so all
// six run in well under a second and none of them needs a browser. The e2e suite
// proves the behaviour; this proves the shape, and it proves it on every commit.
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
// The stripper, the specifier habit and the non-vacuity discipline are
// src/lib/config-shape.spec.ts's and src/lib/ui/tune-ui.spec.ts's, copied rather
// than reinvented.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const CARD = "src/lib/ui/CatalogCard.svelte";
const GRID = "src/lib/ui/BrowseGrid.svelte";
const TOOLBAR = "src/lib/ui/BrowseToolbar.svelte";
const CHIP = "src/lib/ui/TagChip.svelte";
/** One captioned facet row, in either of its two modes. It arrives in 10-07. */
const FACET = "src/lib/ui/FacetRow.svelte";
/** The header's one right-hand slot. It arrives in plan 05.1-09. */
const LINK = "src/lib/ui/BrowseLink.svelte";
const PAGE = "src/routes/browse/+page.svelte";
const BROWSE_DIR = "src/lib/browse";

/**
 * Everything the browse screen is made of.
 *
 * BrowseLink.svelte did not exist when this file was written and is SKIPPED
 * rather than asserted, so this file landed in wave 8 and covered wave 9's
 * component the day it appeared with no edit. FacetRow.svelte joined the same
 * way in 10-07. The floor below is what stops that skip from hollowing the
 * whole file out: every test asserts the walk found at least four files before
 * it asserts anything about them.
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

/** Comments removed before a structural match: line, block and markup. */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));

/**
 * A style block split into rules. Crude on purpose, and copied from
 * tune-ui.spec.ts: a real CSS parser would be a dependency, and every selector
 * in these files is a plain class, element or descendant selector on one line.
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

/**
 * How many `{#if}` and `{#each}` blocks are open at a point in the markup.
 *
 * Zero means the markup there is rendered unconditionally, which is a thing test
 * 6 has to assert rather than assume.
 */
function blockDepth(source: string, needle: string): number {
  const before = source.slice(0, source.indexOf(needle));
  const count = (token: string) => before.split(token).length - 1;
  return count("{#if") - count("{/if}") + (count("{#each") - count("{/each}"));
}

describe("the browse screen's structural rules", () => {
  it("no popularity metric is shown or faked anywhere on the browse screen", () => {
    // CAT-02 and 05.1-CONTEXT D-02 both require it, and 05.1-UI-SPEC.md's
    // Copywriting Contract enforces it by name: no popularity word appears
    // anywhere, and no bare number beside a tag that could be read as one. W-04's
    // disabled-chip rule exists partly so no such number ever needs to be
    // printed - a chip that would empty the grid is a real disabled checkbox
    // instead of a chip wearing a count.
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

    // The detector's own gate. A stripper or a matcher that had quietly stopped
    // working would report a clean screen for a screen full of rankings, so it
    // is shown a source that DOES carry each word and must find every one.
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
    // presence of a control rather than written down - tune-ui.spec.ts test 3's
    // technique - so a file that grows its first button later cannot slip past a
    // hard-coded array nobody remembered to update. An anchor counts: a card's
    // whole target is the card, and the page's wordmark is a real link.
    const CONTROL = /<(button|input|a)[\s>]/;
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

    // Non-vacuity in both directions: the derivation found controls, AND it
    // discriminated rather than classing everything it was handed as one.
    expect(
      withControls.length,
      "files rendering a button, an input or a link were found",
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
    // whose members are one short word wide. A file-level substring check is
    // enough to catch a component that forgot the floor entirely; it is not
    // enough to catch one control among several losing it, and a facet row's
    // members read `keys`, `play` and `still`. This is the derivation
    // device-ui.spec.ts:278-306 uses, and it names the class it found short.
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
      // `sr-only` is excluded, and it is the one exclusion: it is the
      // visually-hidden class, the deliberate OPPOSITE of a box. TagChip and
      // the sort row both hide the real control and draw the 44px box and
      // Phase 4's focus ring on the <label> around it - the relocation
      // Knob.svelte makes - so demanding a floor on the hidden element would
      // demand the one thing that would undo the relocation.
      const classes = new Set(
        [...source.matchAll(/<(a|button|input|label)[^>]*/g)]
          .flatMap((tag) =>
            [...tag[0].matchAll(/class[ ]*=[ ]*"([^"]*)"/g)].flatMap((attr) =>
              attr[1].split(/[ ]+/).filter((word) => word.length > 0),
            ),
          )
          .filter((cls) => cls !== "sr-only"),
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

  it("the browse screen uses the lime ladder and nothing else", () => {
    // X-01 scopes the ninth token to the over-budget state of a 908-character
    // meter. No meter exists on a browse screen, so --color-over appears nowhere
    // here, and identity.spec.ts stays at 6 tests and is untouched.
    //
    // The hex rule is the second half: every colour on this screen comes from a
    // token, so a literal is either a tenth colour or a token spelled out by
    // hand, and both are the same regression. The lookahead is not decoration -
    // without it `{#each` reads as the hex #eac, and three shipped components
    // would be permanently red for a Svelte block opener.
    const TOKEN = "--color-over";
    const HEX = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g;

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
    for (const file of files) {
      const source = code(file);
      read += source.length;
      if (source.includes(TOKEN)) offenders.push(`${file} -> ${TOKEN}`);
      for (const match of source.matchAll(HEX)) {
        offenders.push(`${file} -> ${match[0]}`);
      }
    }

    expect(read, "the browse files' code was actually read").toBeGreaterThan(
      2000,
    );
    expect(
      offenders,
      "the browse screen names the alarm red or a raw colour - every colour here comes from one of the nine tokens, and the ninth belongs to a meter that does not exist on this page",
    ).toEqual([]);
  });

  it("the search field is at the iOS zoom floor", () => {
    // 16px is not a taste. iOS Safari zooms the viewport when a text input
    // smaller than 16px takes focus, and a browse screen whose search field
    // zooms the page on the first keystroke is a browse screen a phone visitor
    // fights. It is the second and last text input on the site; 05-UI-SPEC made
    // the same declaration for the copy fallback field.
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
    // wall of sixteen destinations does neither. Both roles REPLACE the link
    // role, and with it a screen reader's links list - which is how a non-sighted
    // visitor surveys a page of sixteen - plus middle-click and open-in-new-tab.
    // Phase 4 was right to make the coverflow a listbox; this is the opposite
    // component and it wants the opposite semantics.
    const REFUSED = ["listbox", "option", "grid", "gridcell"].map(
      (name) => `role="${name}"`,
    );
    const KEPT = ['role="list"', 'role="radiogroup"', 'role="group"'];

    const files = browseFiles();
    expect(files.length, "browse files were walked").toBeGreaterThanOrEqual(
      FLOOR,
    );

    const sources = files.map(code);
    const joined = sources.join("\n");

    // Non-vacuity: the matcher can see the roles these components DO carry, so
    // an empty offender list below is a fact rather than a broken scan.
    expect(
      KEPT.filter((role) => joined.includes(role)),
      "none of the roles the browse screen legitimately carries was found - this scan is blind",
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

    // AND EVERY GROUP THIS SCREEN DECLARES CARRIES A NAME. A role="group" with
    // no accessible name is a container a screen reader announces as "group"
    // and nothing else, which is worse than no role at all: it adds a boundary
    // and withholds the word that would make the boundary mean something. The
    // toolbar renders two facet rows on one page, so the ids must also DIFFER -
    // an aria-labelledby pointing at the other facet's caption would announce
    // FEELS's members as FOR's.
    if (existsSync(repo(FACET))) {
      const facet = code(FACET);
      const group = openTagOf(facet, 'role="group"');
      expect(
        group,
        'a facet row declares role="group" without an aria-labelledby, so a screen reader announces a boundary and never says which facet it is',
      ).toContain("aria-labelledby");
      expect(
        group,
        "the facet row's group is not labelled by an id derived from the facet's own name, so the two rows on /browse/ would share one caption",
      ).toContain("aria-labelledby={captionId}");
      expect(
        facet,
        "the facet row's caption element no longer carries the id its group points at",
      ).toContain("id={captionId}");
      expect(
        facet.includes("facet-${name}-caption"),
        "the caption id is no longer derived from the facet's name - one page renders both rows and two elements may not share an id",
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
    // the live region row. Three elements doing three jobs:
    //
    //   1. the VISIBLE line, which updates instantly and is aria-hidden
    //   2. the always-present hidden EXPANSION, which is what a visitor landing
    //      on a shared, already-filtered address reads - a link like
    //      /browse/?q=ghost fires no change event, so the live region has
    //      nothing to say on arrival and this sentence is the only thing telling
    //      them they are looking at one of sixteen
    //   3. the LIVE REGION, which speaks once per settled change
    //
    // The expansion is the half of this test that is easy to leave out and the
    // half a visitor is most likely to need, so it is asserted structurally:
    // it exists, it is at block depth zero (never inside an {#if}), it carries
    // neither aria-live nor aria-hidden, and its words are pinned.
    //
    // SCOPED TO src/ ON PURPOSE. Every hydrated SvelteKit page carries a SECOND
    // aria-live element that is not ours: Kit's own #svelte-announcer, rendered
    // by @sveltejs/kit/src/core/sync/write_root.js:177. It is generated, it is
    // not in this repository's sources, and it is invisible to a source scan -
    // which is why "exactly one" is a safe claim HERE and would be a false one
    // in a browser. Any DOM-level assertion of the same rule must exclude that
    // element by id rather than count elements.
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
    // THE THREE ELEMENTS ARE ASSERTED BEFORE THE GLOBAL COUNT, and the order is
    // deliberate: Vitest aborts a test at its first failed assertion, so putting
    // the count first would answer every one of this test's mutations with the
    // same sentence. Element first, then the count, means the message names what
    // actually moved.
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
      "the count expansion has become a live region - it would then speak on every settled change alongside the real one, which is two voices saying the same number",
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
      "the browse screen carries something other than exactly one aria-live region in exactly one file - two regions interrupt each other, and none leaves a filter change silent",
    ).toBe(`1 in ${TOOLBAR}`);
  });
});
