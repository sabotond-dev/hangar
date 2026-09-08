// CONT-03's copy gate: every string a visitor reads on a card, COUNTED.
//
// WHY A SECOND COPY SPEC EXISTS BESIDE catalog.spec.ts.
// That file asserts SHAPE - a description is non-empty, one line, at most a
// hundred and ten characters, and every tag is a lower-case slug. This one
// asserts TYPOGRAPHY and VOCABULARY, which is a different kind of claim: what
// punctuation the house writes, which words the tag vocabulary already knows,
// and which two search terms the shipped suites lean on. Twenty new
// descriptions and eighty new tags is exactly the volume at which reading them
// stops being checking them, so every rule below is a loop with the entry, the
// field and the offending character named in its message.
//
// It also mirrors ONE e2e assertion into the quick run on purpose. The
// description-uniqueness rule lives in e2e/browse.e2e.ts:258-263, against the
// rendered page. The reason to say it here as well is arithmetic: a collision
// found in a thirty-second quick run costs a minute, and the same collision
// found in a hundred-and-twelve-second Playwright run costs an evening.
//
// WHY THE APOSTROPHE RULE IS BY SOURCE KIND AND NEVER BY A NAME LIST.
// A preset entry's name and description are read off the vendored shelf and are
// asserted byte-equal to it (catalog.spec.ts:113-119), and one of those shelf
// sentences carries a straight apostrophe. src/lib/browse/typographic.ts turns
// an ASCII apostrophe BETWEEN TWO LETTERS into U+2019 at render time, so that
// sentence is correct in the data and correct on the screen, and "fixing" it in
// the catalog would break the shelf equality and the vendored-diff gate behind
// it. So the corpus below takes name and description only from entries whose
// source.kind is NOT "preset". The exemption is a property of where the bytes
// came from; no id is ever written down as an exception.
//
// The quiet lines are held WHOLE, and that is deliberate rather than an
// oversight. Two of the four in the row come from the shelf and two are
// HANGAR's own (front-door.ts:147, 164, 181, 190 say which is which), and all
// four satisfy every rule below as authored. If a vendored quiet line ever did
// not, the answer would be an exemption recorded here in the same source-kind
// terms - never an edit to the vendored bytes.
//
// Set COPY_CENSUS=1 to print test 5's table.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { FEELS_TERMS, FOR_TERMS } from "$lib/browse/facets";
import { allTags, chipTags, fold } from "$lib/browse/filter";
import { CATALOG } from "./index";
import { FRONT_DOOR } from "./front-door";
import { LISTING } from "./listing";

const NEWLINE = String.fromCharCode(10);
const APOSTROPHE = String.fromCharCode(39);
const RIGHT_SINGLE_QUOTE = "’";
const EM_DASH = "—";
const ELLIPSIS = "…";
const DESCRIPTION_CAP = 110;

/** A letter, a straight apostrophe, a letter - what typographic.ts curls. */
const STRAIGHT_BETWEEN_LETTERS = /[A-Za-z]'[A-Za-z]/;
const EMOJI = /\p{Extended_Pictographic}/u;
const SLUG = /^[a-z][a-z0-9-]*$/;

/** One string the house authored, with enough context to name it in a failure. */
type Copy = {
  readonly entry: string;
  readonly field: string;
  readonly text: string;
};

/**
 * THE VOCABULARY, IMPORTED RATHER THAN MAINTAINED - and that is the change
 * D-10 made here.
 *
 * It was a fifty-five-line array in this file, hand-kept, with the comment
 * "declaring one is a line in this array that a reviewer sees". That was the
 * right shape while the vocabulary was open and a new entry could coin a word.
 * It is not the right shape now: the vocabulary is CLOSED at sixteen and
 * DECLARED in src/lib/browse/facets.ts, so the line a reviewer sees moved
 * there, where the two facets and the health rules are. Restating the sixteen
 * here would be a second source for one list, which is the thing this
 * repository refuses everywhere else.
 *
 * THE BOTH-DIRECTIONS LOOP IN TEST 3 STAYS, and it is not a duplicate of
 * facets.spec.ts test 2. That one holds facets.ts against LISTING, the browse
 * PROJECTION. This one holds it against CATALOG, the source those records are
 * projected FROM - and it is the direction that catches "playble" shipping
 * quietly beside "playable", because a typo is a tag no facet declares.
 *
 * Re-recorded by: 08-06 (forty-one across sixteen entries), then every entry
 * wave of phase 09 (fifty-five across thirty-six), then 10-06, which re-cut
 * the fifty-five to sixteen and moved the declaration out of this file.
 */
const KNOWN_TAGS: readonly string[] = [...FOR_TERMS, ...FEELS_TERMS];

/**
 * Every string HANGAR authored, assembled BY SOURCE KIND.
 *
 * Names and descriptions come from hand-authored entries only; tags from the
 * same; and every quiet line the browse listing and the front-door row carry.
 *
 * R-10 RETIRED THE ONE STANDALONE PUSH THIS WALK USED TO MAKE. It added
 * RESTS_DARK_NOTE, the sentence four resting-black cards shared, and that export
 * is gone: D-09 gives three of those four a demonstration touch, so the sentence
 * describes something the visitor cannot see. Its replacement, DEMO_TOUCH_NOTE,
 * needs no push of its own - the three entries that carry it carry it in their
 * own quiet fields, and the loop above already collects those. The old push was
 * a fourth copy of a string the corpus already held three times.
 */
function hangarCopy(): readonly Copy[] {
  const corpus: Copy[] = [];
  for (const entry of CATALOG) {
    if (entry.source.kind === "preset") continue;
    corpus.push({ entry: entry.id, field: "name", text: entry.name });
    corpus.push({
      entry: entry.id,
      field: "description",
      text: entry.description,
    });
    for (const tag of entry.tags) {
      corpus.push({ entry: entry.id, field: `tag ${tag}`, text: tag });
    }
  }
  for (const listed of LISTING) {
    if (typeof listed.quiet === "string") {
      corpus.push({ entry: listed.id, field: "quiet", text: listed.quiet });
    }
  }
  for (const row of FRONT_DOOR) {
    if (typeof row.quiet === "string") {
      corpus.push({
        entry: row.id,
        field: "front-door quiet",
        text: row.quiet,
      });
    }
  }
  return corpus;
}

/** Name, description and tags, folded once - what the search field sees. */
const searchable = (entry: {
  name: string;
  description: string;
  tags: readonly string[];
}) => fold([entry.name, entry.description, ...entry.tags].join(" "));

/** U+XXXX, so a failure names the character rather than showing it. */
const codePoint = (ch: string) =>
  "U+" + (ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");

const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1;

describe("catalog copy, counted rather than read (CONT-03)", () => {
  it("gives every configuration one line of its own", () => {
    const described = [
      ...CATALOG.map((e) => ({ id: e.id, text: e.description })),
      ...LISTING.map((e) => ({ id: e.id, text: e.description })),
    ];
    expect(described.length, "there are descriptions to read").toBeGreaterThan(
      0,
    );

    let longest = { id: "", length: 0 };
    for (const { id, text } of described) {
      expect(text.length, `${id}: the description is empty`).toBeGreaterThan(0);
      expect(text.includes(NEWLINE), `${id}: the description is one line`).toBe(
        false,
      );
      expect(
        text.length,
        `${id}: the description is ${text.length} characters, over the ${DESCRIPTION_CAP} a card fits`,
      ).toBeLessThanOrEqual(DESCRIPTION_CAP);
      if (text.length > longest.length) longest = { id, length: text.length };
    }

    // NO TWO CONFIGURATIONS SHARE A SENTENCE, case-folded, in both collections.
    // A near-miss is invisible in a pass, so the longest description is named
    // in the message whether or not anything failed.
    for (const collection of [CATALOG, LISTING]) {
      const seen = new Map<string, string>();
      for (const entry of collection) {
        const key = fold(entry.description);
        const owner = seen.get(key);
        expect(
          typeof owner,
          `${entry.id} and ${owner ?? ""} share one description; the longest in the catalog is ${longest.id} at ${longest.length} of ${DESCRIPTION_CAP} characters`,
        ).toBe("undefined");
        seen.set(key, entry.id);
      }
      expect(
        seen.size,
        `distinct descriptions; the longest is ${longest.id} at ${longest.length} of ${DESCRIPTION_CAP} characters`,
      ).toBe(collection.length);
    }
  });

  it("writes the punctuation the house writes, over every string it authored", () => {
    const corpus = hangarCopy();
    expect(
      corpus.length,
      "the corpus walk found HANGAR-authored strings",
    ).toBeGreaterThan(20);

    for (const { entry, field, text } of corpus) {
      const at = `${entry}: ${field}`;
      expect(text.length, `${at} is empty`).toBeGreaterThan(0);

      // install-copy.ts:44-46's rule, project-wide: the copy never shouts.
      expect(
        text.includes("!"),
        `${at} shouts - ${codePoint("!")} in "${text}"`,
      ).toBe(false);

      const emoji = EMOJI.exec(text);
      expect(
        emoji === null,
        `${at} carries an emoji - ${emoji === null ? "" : codePoint(emoji[0])} in "${text}"`,
      ).toBe(true);

      // U+2019 is what HANGAR writes, in the SOURCE, as GHOST's and MORPH's
      // descriptions already do (listing.ts:251, 276). typographic.ts curls a
      // straight one at render time for the vendored sentence it cannot edit;
      // that is a display transform, not a licence to author one.
      expect(
        STRAIGHT_BETWEEN_LETTERS.test(text),
        `${at} has a typewriter apostrophe (${codePoint(APOSTROPHE)}) between two letters; write ${codePoint(RIGHT_SINGLE_QUOTE)} - "${text}"`,
      ).toBe(false);

      if (field.startsWith("tag ")) continue;

      // A hyphen is not a dash. A tag may carry one because the slug grammar
      // permits it, so tags are exempt from THIS rule and only this one.
      //
      // The exemption is VACUOUS TODAY and kept deliberately. It was written
      // for `hands-free` and `multi-touch`; D-10 retired both, and not one of
      // the sixteen facet terms contains a hyphen. Deleting the exemption would
      // work right now and would silently forbid a hyphenated term the day the
      // vocabulary gains one - which the slug grammar in `SLUG` still allows.
      // A rule that is currently unexercised is not the same as a wrong rule.
      expect(
        text.includes(" - "),
        `${at} uses a spaced hyphen where a dash (${codePoint(EM_DASH)}) or a semicolon belongs - "${text}"`,
      ).toBe(false);
      expect(
        text.includes("--"),
        `${at} uses a double hyphen where a dash (${codePoint(EM_DASH)}) belongs - "${text}"`,
      ).toBe(false);

      // An ellipsis means "this is still happening", never "there is more", and
      // a description is never clamped (CatalogCard.svelte:40-44), so there is
      // nothing for it to stand in for.
      expect(
        text.includes("..."),
        `${at} has three full stops where ${codePoint(ELLIPSIS)} belongs, if anything does - "${text}"`,
      ).toBe(false);
      if (field === "description") {
        expect(
          text.includes(ELLIPSIS),
          `${at} trails off; a description says the whole thing - "${text}"`,
        ).toBe(false);
      }
    }
  });

  it("coins no tag nobody declared, and carries every tag it declares", () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);

    const carried = new Set<string>();
    for (const entry of CATALOG) {
      for (const tag of entry.tags) {
        expect(tag, `${entry.id}: tag "${tag}" is a lower-case slug`).toMatch(
          SLUG,
        );
        expect(
          KNOWN_TAGS.includes(tag),
          `${entry.id}: "${tag}" is in no facet. The vocabulary is CLOSED at sixteen: if this is a new word, the answer is that the vocabulary is wrong rather than that the entry needs one, and if it is a typo, this is the message that caught it`,
        ).toBe(true);
        carried.add(tag);
      }
      // ONE RULE NOW, NOT TWO. The shelf's nine used to carry three terms each
      // and a hand-authored entry four, which is the split CONT-03's "four feel
      // tags" described; D-10 amends it to EXACTLY THREE everywhere - one FOR
      // and two FEELS. Which of the three is which is facets.spec.ts's test 2;
      // this one only counts, so a preset and a Lua entry are the same claim.
      expect(
        entry.tags.length,
        `${entry.id}: a ${entry.source.kind} entry carries ${entry.tags.length} tags; three is the rule for every entry since D-10`,
      ).toBe(3);
    }

    for (const tag of KNOWN_TAGS) {
      expect(
        carried.has(tag),
        `"${tag}" is declared in a facet and carried by no entry in the CATALOG; a retired tag is red too`,
      ).toBe(true);
    }
    expect(
      KNOWN_TAGS.length,
      "KNOWN_TAGS and the catalog's vocabulary are the same set",
    ).toBe(carried.size);
  });

  it("protects the two search anchors the shipped suites depend on", () => {
    // BOTH are load-bearing and both are one careless word away from breaking.
    //
    //   e2e/browse.e2e.ts:719-734 needs ?q=aurora to leave EXACTLY ONE card,
    //   and uses that single padsim card to prove a browse load that fetches
    //   zero WebAssembly. A second entry whose copy happens to contain the word
    //   would make that test fail with a count mismatch and tell nobody why.
    //
    //   src/lib/browse/filter.spec.ts needs a query for ghost to return exactly
    //   ["ghost"], three times over, in the tag-and-query intersection test.
    //
    // Asserted here, in the thirty-second run, so the word is protected before
    // a Playwright run finds it.
    for (const [word, id] of [
      ["aurora", "aurora"],
      ["ghost", "ghost"],
    ] as const) {
      const matched = LISTING.filter((entry) =>
        searchable(entry).includes(word),
      );
      expect(
        matched.map((e) => e.id),
        `"${word}" must be carried by exactly one entry's searchable text`,
      ).toEqual([id]);
    }

    // And the inverse anchor: e2e/browse.e2e.ts:337-349 types a word and
    // asserts the grid NARROWS without emptying, so this one must stay plural.
    const drums = LISTING.filter((entry) =>
      searchable(entry).includes("drums"),
    );
    expect(
      drums.length,
      "a typed drums must narrow the catalog without emptying it",
    ).toBeGreaterThan(1);
  });

  it("computes the census the copy rules are counted over", () => {
    const corpus = hangarCopy();
    const descriptions = CATALOG.map((e) => ({
      id: e.id,
      length: e.description.length,
    }));
    const longest = descriptions.reduce((a, b) =>
      b.length > a.length ? b : a,
    );
    const characters = corpus.reduce((n, c) => n + c.text.length, 0);
    const curled = corpus.reduce(
      (n, c) => n + occurrences(c.text, RIGHT_SINGLE_QUOTE),
      0,
    );
    const dashes = corpus.reduce((n, c) => n + occurrences(c.text, EM_DASH), 0);
    const known = allTags(LISTING);
    const chips = chipTags(LISTING);

    const table = [
      `entries                    ${CATALOG.length}`,
      `hand-authored entries      ${CATALOG.filter((e) => e.source.kind !== "preset").length}`,
      `strings in the corpus      ${corpus.length}`,
      `distinct strings           ${new Set(corpus.map((c) => c.text)).size}`,
      `characters                 ${characters}`,
      `longest description        ${longest.id} at ${longest.length} of ${DESCRIPTION_CAP}`,
      `${RIGHT_SINGLE_QUOTE} (${codePoint(RIGHT_SINGLE_QUOTE)}) occurrences   ${curled}`,
      `${EM_DASH} (${codePoint(EM_DASH)}) occurrences   ${dashes}`,
      `distinct tags              ${known.length}`,
      `standing chips             ${chips.length}`,
      `singletons                 ${known.length - chips.length}`,
    ];
    if ((process.env.COPY_CENSUS ?? "") !== "") {
      for (const line of table) console.log(line);
    }

    // The point of this test is the table; the point of these three is that the
    // table was computed over real data rather than printed off an empty walk.
    expect(corpus.length, "the census read a corpus").toBeGreaterThan(20);
    expect(
      curled,
      `no ${codePoint(RIGHT_SINGLE_QUOTE)} occurs anywhere in the corpus, so the apostrophe rule above is green by absence rather than by observance`,
    ).toBeGreaterThan(0);
    expect(
      longest.length,
      `${longest.id} is the longest description at ${longest.length}`,
    ).toBeLessThanOrEqual(DESCRIPTION_CAP);
  });
});
