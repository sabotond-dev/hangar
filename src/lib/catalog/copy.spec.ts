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
import { allTags, chipTags, fold } from "$lib/browse/filter";
import { CATALOG } from "./index";
import { FRONT_DOOR } from "./front-door";
import { LISTING, RESTS_DARK_NOTE } from "./listing";

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
 * THE VOCABULARY, MAINTAINED ON PURPOSE.
 *
 * Sorted, and asserted in BOTH directions by test 3: every tag in the catalog
 * is a member, and every member is carried by at least one entry, so a coined
 * tag and a retired tag are equally red. This is the whole mechanism against
 * "playble" shipping quietly beside "playable" - a typo is a tag nobody has
 * declared, and declaring one is a line in this array that a reviewer sees.
 *
 * Re-recorded by: 08-06 (forty-one across sixteen entries), then every entry
 * wave of phase 09.
 */
const KNOWN_TAGS = [
  "ambient",
  "automation",
  "blend",
  "blooming",
  "calm",
  "chords",
  "colour",
  "desktop",
  "drums",
  "endless",
  "expressive",
  "flowing",
  "generative",
  "gestural",
  "grid",
  "hands-free",
  "harmonic",
  "hypnotic",
  "instrument",
  "isomorphic",
  "latching",
  "looper",
  "macros",
  "mixing",
  "modulation",
  "multi-touch",
  "pitch-bend",
  "playable",
  "pointer",
  "polar",
  "polyrhythm",
  "precise",
  "radial",
  "rails",
  "readable",
  "rippling",
  "rotating",
  "sequencer",
  "sprung",
  "still",
  "utility",
  "xy-control",
] as const;

/**
 * Every string HANGAR authored, assembled BY SOURCE KIND.
 *
 * Names and descriptions come from hand-authored entries only; tags from the
 * same; every quiet line the browse listing and the front-door row carry; and
 * RESTS_DARK_NOTE itself, which is one sentence shared by every resting-black
 * card and is therefore the single most-read string in the catalog.
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
  corpus.push({
    entry: "listing.ts",
    field: "RESTS_DARK_NOTE",
    text: RESTS_DARK_NOTE,
  });
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
      // requires it (hands-free, multi-touch), so tags are exempt from THIS
      // rule and only this one.
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
          KNOWN_TAGS.includes(tag as (typeof KNOWN_TAGS)[number]),
          `${entry.id}: "${tag}" is not in KNOWN_TAGS. If it is a new word, add it there on purpose; if it is a typo, this is the message that caught it`,
        ).toBe(true);
        carried.add(tag);
      }
      // The two shipped conventions, as rules with the entry named: the shelf
      // gave its nine three tags each, and a hand-authored entry declares four.
      expect(
        entry.tags.length,
        `${entry.id}: a ${entry.source.kind} entry carries the wrong number of tags`,
      ).toBe(entry.source.kind === "preset" ? 3 : 4);
    }

    for (const tag of KNOWN_TAGS) {
      expect(
        carried.has(tag),
        `"${tag}" is declared in KNOWN_TAGS and carried by no entry; a retired tag is red too`,
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
