// The one display transform, held against the three sentences that need it.
//
// Tests 1 and 2 carry GHOST's and MORPH's sentences as LITERALS rather than
// reading them from the catalog, and that is deliberate: plan 05.1-05 corrects
// both at source, and a test that read them would quietly stop covering the
// transform on the day that lands.
//
// Test 3 is the opposite on purpose. Radar's sentence comes from
// src/vendor/botor/_pad.ts, which is vendored copy that may never be edited
// (Phase 3 D-04, held by src/lib/fidelity/vendored-diff.spec.ts), so it will
// never be corrected at source - which makes it the case that must go on
// proving the transform fires against SHIPPED data. It is read through
// byId("radar") for exactly that reason.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { byId } from "$lib/catalog";
import { typographic } from "./typographic";

/** U+2019 RIGHT SINGLE QUOTATION MARK, named rather than pasted. */
const CURLY = "’";

/**
 * The sentence GHOST carried UNTIL PLAN 11-11 re-authored the entry, with its
 * ASCII apostrophe. A literal, not a read - see the file header.
 *
 * THE ENTRY NO LONGER CARRIES IT. The redesign moved the description to name
 * the erase key, and the apostrophe went out with the clause it sat in. This
 * test is unweakened by that and the literal is why: the claim here is about
 * the TRANSFORM, and a sample sentence that has stopped being shipped copy is
 * still a sentence the transform has to get right. A version that read the
 * catalog would have gone silently vacuous on the day the entry changed, which
 * is the outcome the file header says these two literals exist to prevent. The
 * constant keeps its name because renaming it would say the sentence moved
 * rather than that the entry did.
 */
const GHOST_TODAY =
  "Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger's.";

/** MORPH's description as entries/morph.ts holds it today. Also a literal. */
const MORPH_TODAY =
  "Four macros in the corners; slide between them and each corner's brightness is its own weight.";

/** Everything except the apostrophes, so "otherwise byte-identical" is checkable. */
const withoutApostrophes = (s: string) =>
  s.split(CURLY).join("").split("'").join("");

describe("the display apostrophe (src/lib/browse/typographic.ts)", () => {
  it("curls Ghost's finger's, and changes nothing else in the sentence", () => {
    const out = typographic(GHOST_TODAY);

    expect(out, "the whole sentence, with one character changed").toBe(
      "Drag once and a ghost retraces your path forever, still sending, in a colour that is not your finger" +
        CURLY +
        "s.",
    );
    expect(out, "the straight apostrophe is gone").not.toContain("'");
    expect(
      [...out].filter((c) => c === CURLY),
      "exactly one was added",
    ).toHaveLength(1);
    expect(withoutApostrophes(out), "every other byte is untouched").toBe(
      withoutApostrophes(GHOST_TODAY),
    );
    expect(out.length, "and the length is unchanged").toBe(GHOST_TODAY.length);
  });

  it("curls Morph's corner's, and changes nothing else in the sentence", () => {
    const out = typographic(MORPH_TODAY);

    expect(out, "the whole sentence, with one character changed").toBe(
      "Four macros in the corners; slide between them and each corner" +
        CURLY +
        "s brightness is its own weight.",
    );
    expect(out, "the straight apostrophe is gone").not.toContain("'");
    expect(
      [...out].filter((c) => c === CURLY),
      "exactly one was added",
    ).toHaveLength(1);
    expect(withoutApostrophes(out), "every other byte is untouched").toBe(
      withoutApostrophes(MORPH_TODAY),
    );
  });

  it("curls Radar's vendored sentence, which is read from the shipped catalog", () => {
    const radar = byId("radar");
    if (radar === undefined) throw new Error("the catalog has no radar entry");

    // The source of truth, unedited. If this ever stops containing a straight
    // apostrophe, somebody has edited vendored copy and this test is the alarm.
    expect(
      radar.description,
      "the vendored sentence still carries its ASCII apostrophe",
    ).toContain("finger's");
    expect(radar.description, "and is not curled at source").not.toContain(
      CURLY,
    );

    const out = typographic(radar.description);
    expect(out, "the card shows a typographic apostrophe").toContain(
      "finger" + CURLY + "s",
    );
    expect(out, "and no straight one").not.toContain("'");
    expect(withoutApostrophes(out), "every other byte is untouched").toBe(
      withoutApostrophes(radar.description),
    );
  });

  it("leaves everything else exactly as it was", () => {
    const untouched = [
      // Already curly: the transform is not applied twice.
      "It" + CURLY + "s already correct.",
      // A word-edge apostrophe. Both of these are authored deliberately and a
      // broader transform would start editing copy.
      "the pads' rails",
      "'tis the season",
      "rock 'n' roll",
      // Nothing to do at all.
      "A band of light crosses the pad.",
      "",
      // The marks this function is explicitly NOT responsible for: quotes,
      // ellipses and dashes are already authored correctly.
      'He said "hello" and left.',
      "and so on...",
      "wait - no",
      // Digits are not letters, so a foot mark stays a foot mark.
      "6'2 tall",
    ];

    for (const text of untouched) {
      expect(typographic(text), `unchanged: ${JSON.stringify(text)}`).toBe(
        text,
      );
    }

    // Non-vacuity, and the overlap case: two apostrophes in one word, both
    // between letters, both curled - a naive non-overlapping replace would miss
    // the second.
    expect(
      typographic("a'b'c"),
      "consecutive letter-adjacent apostrophes",
    ).toBe("a" + CURLY + "b" + CURLY + "c");
    // Accented letters are letters too.
    expect(typographic("l'été"), "not only ASCII letters count").toBe(
      "l" + CURLY + "été",
    );
  });
});
