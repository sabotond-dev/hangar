/**
 * IDENT-01 / IDENT-02 - what is left of the aesthetic source scans after the
 * CRT went (10-UI-SPEC §8.7, retired in part by 13-CONTEXT.md D-09).
 *
 * WHAT THIS FILE USED TO GATE. Eight scans over the CRT and glitch treatment
 * Phase 10 built: scan 1 held the CRT vocabulary inside an allowlist of four
 * files and every --crt property inside src/app.css; scan 2 held every layer
 * to pointer-events: none and its real elements aria-hidden; scan 3 held the
 * shell's subtree empty of words; scan 5 held every CRT selector off a canvas;
 * scan 6 held the noise tile free of any fill; scan 7 held the shell's five
 * geometry literals string-equal to Coverflow.svelte's .band. Each landed in
 * the same commit as the layer it gated (10-VALIDATION V-01).
 *
 * WHAT WENT, AND WHEN. On 2026-09-11 plan 13-04 deleted the CRT treatment -
 * Layer G on body::before, Layer S on the pad frames, Layers R and T inside
 * the front door's shell, the --crt property and the SCREEN switch - under
 * D-09, because the Bible's §3 asks for solid surfaces inside the working
 * application and the PDF's own intro is flat. Scans 1, 2, 3, 5, 6 and 7 were
 * deleted by name with it: each asserted a non-vacuity floor over a thing that
 * no longer exists, and a floor over nothing is a scheduled failure rather
 * than a gate. The deletion removed its own gate over the vocabulary, so
 * instrument.spec.ts scan 6 now holds that vocabulary absent from every
 * stylesheet and component on every run.
 *
 * WHAT THIS FILE GATES NOW - ONE SCAN, WITH A LIVE SUBJECT.
 *
 * Scan 4 survived 13-04 because its subject was Coverflow.svelte's own 3D
 * context and band rather than the CRT; on 2026-09-11 plan 13-09 deleted the
 * coverflow with the workspace (PDF page 5, 13-VALIDATION D-5) and deleted
 * the scan by name in the same commit - "scan 4: Coverflow.svelte's 3D
 * context stays ungrouped and its band keeps its clip and its mask" - with
 * the rightmost-compound and property-name helpers only it used.
 *
 * Scan 8 is the unlit cell (10-UI-SPEC A-58, A-59): the dot is still there,
 * the wash is the token rather than a colour, the fraction is capped, and the
 * pad that lights nothing is still declared dark. It is about the pad and not
 * about the texture, which is why it stays in place and the file survives.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// Scan 8's honesty half is imported rather than described. A CSS wash on an
// unlit cell must never be mistakable for a lit one, and the place that fact
// lives is DARK_BY_CONSTRUCTION - so the scan reads the module instead of
// quoting it, and a plan that ever "fixed" a dark card by deleting its entry
// turns this file red as well as the three that already hold it.
import { byId } from "../catalog";
import { DARK_BY_CONSTRUCTION, demoPathFor } from "../sim/demo";
import { stripComments } from "../../test-support/source";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

const PAD_FRAME = "src/lib/ui/PadFrame.svelte";

/** identity.spec.ts's normaliser: collapse whitespace, drop trailing zeros. */
const normalise = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/(\d)\.(\d*?)0+(?=\D|$)/g, (_m, whole: string, frac: string) =>
      frac.length > 0 ? `${whole}.${frac}` : whole,
    )
    .trim();

interface Declaration {
  /** The token left of the first colon, lower-cased. Never a body substring. */
  property: string;
  value: string;
}

interface Rule {
  selector: string;
  body: string;
  declarations: Declaration[];
}

/** Split on a character only where parentheses are balanced. */
function splitTop(text: string, separator: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === separator && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function declarationsOf(block: string): Declaration[] {
  const out: Declaration[] = [];
  for (const piece of splitTop(block, ";")) {
    const text = piece.trim();
    if (text === "") continue;
    const colon = text.indexOf(":");
    if (colon < 0) continue;
    out.push({
      property: normalise(text.slice(0, colon)).toLowerCase(),
      value: normalise(text.slice(colon + 1)),
    });
  }
  return out;
}

/**
 * Parse a stylesheet into rules, descending into conditional group rules so
 * the `prefers-reduced-motion` block's `.stage` rules are held to exactly the
 * same test as the top-level ones.
 */
function parseRules(css: string, into: Rule[] = []): Rule[] {
  let i = 0;
  let prelude = "";
  while (i < css.length) {
    if (css[i] !== "{") {
      prelude += css[i];
      i += 1;
      continue;
    }
    let depth = 1;
    let j = i + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth += 1;
      else if (css[j] === "}") depth -= 1;
      j += 1;
    }
    const block = css.slice(i + 1, j - 1);
    const selector = normalise(prelude);
    if (selector.startsWith("@") && block.includes("{")) {
      parseRules(block, into);
    } else {
      into.push({
        selector,
        body: normalise(block),
        declarations: declarationsOf(block),
      });
    }
    prelude = "";
    i = j;
  }
  return into;
}

/** A written-out colour: a hex, or any colour function. Never a var(). */
const COLOUR_LITERAL =
  /#[0-9a-fA-F]{3,8}|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/;

describe("IDENT-01 the unlit cell (10-UI-SPEC 19.1a as amended, A-58, A-59)", () => {
  it("scan 8: the unlit cell is drawn as a cell, in the token, and the pad that lights nothing is still dark", () => {
    const rules = parseRules(stripComments(read(PAD_FRAME)));
    const dots = rules.filter((rule) => rule.selector === ".dots");

    // ---- NON-VACUITY, BEFORE ANY CLAIM ABOUT WHAT WAS FOUND. ----
    expect(
      dots.map((rule) => rule.selector),
      `${PAD_FRAME} declares no .dots rule at all - Layer 1 was renamed away, and every assertion below it would be checking nothing`,
    ).not.toEqual([]);
    const declared = new Map(
      dots.flatMap((rule) =>
        rule.declarations.map(
          (one) => [one.property, one.value] as [string, string],
        ),
      ),
    );

    // ---- THE DOT IS STILL THERE. The wash is an ADDITION to Layer 1, not a
    // replacement for it: a face with a wash and no dots would be 81 flat
    // squares, and the dot is what says "a lamp lives here".
    expect(
      declared.get("background-image"),
      "the unlit cell's DOT is gone. A-58 adds a wash BESIDE the dot field, it does not replace it - a wash alone paints 81 flat squares and loses the mark that says a lamp lives in each of them",
    ).toContain("var(--color-divider)");

    // ---- THE WASH, AND IT IS THE TOKEN RATHER THAN A COLOUR. ----
    const wash = declared.get("background-color");
    expect(
      wash,
      `${PAD_FRAME}'s .dots declares no background-color. Without it the cell STRUCTURE on an all-unlit face is invisible: Layer 3's gutter grid is painted in --color-workspace, and a black grid divides nothing when the cells behind it are also black. Measured: Trackpad's card rendered as one rectangle beside eight cards that read as pads`,
    ).toBeDefined();
    const value = wash ?? "";
    expect(
      COLOUR_LITERAL.test(value),
      `the unlit cell's wash is written as a COLOUR rather than as a token: "${value}". 10-UI-SPEC 7.1 puts every colour in src/app.css because identity.spec.ts reads that file and nothing else - and 10-04 proved that even inside that file a percent-encoded hue passes all seven of its assertions, so a literal in a component <style> is a colour NO gate on this site can see. Derive it from the token instead`,
    ).toBe(false);
    expect(
      value,
      `the unlit cell's wash does not name --color-divider: "${value}". It is the same token the dot in the same cell is painted with, at a fraction of it, which is what makes "the same strength every other card's unlit cells have" a fact about one value rather than a comparison somebody has to remember to make`,
    ).toContain("var(--color-divider)");

    // ---- NO TENTH TOKEN. The value names exactly one custom property. ----
    const named = [...value.matchAll(/var\((--[a-z-]+)/g)].map(
      (match) => match[1],
    );
    expect(
      named,
      `the unlit cell's wash names ${named.join(", ")}. It may name exactly one custom property and it must be --color-divider: identity.spec.ts goes red on a TENTH --color-* token, and a wash that reached for a new one would have cost the ladder its ninth rung for a decoration`,
    ).toEqual(["--color-divider"]);

    // ---- THE CAP, AND IT IS THE CONSTRAINT RATHER THAN A PREFERENCE. The dot
    // is the token at its full 0.2. A wash at or above that would make the one
    // card that can never light the BRIGHTEST unlit face on the site, which is
    // the precise thing the ruling forbids.
    const percentage = /([0-9]+(?:\.[0-9]+)?)%/.exec(value);
    expect(
      percentage,
      `the unlit cell's wash carries no percentage to read: "${value}". A-58 fixes it as a FRACTION of --color-divider so the cap below is a number a scan can check, rather than an intention`,
    ).not.toBeNull();
    const share = Number((percentage as RegExpExecArray)[1]);
    expect(
      share,
      `the unlit cell's wash is ${share}% of --color-divider. A-58 caps it at 50: the dot in the same cell is that token at FULL strength, and a wash at or above half would stop the dot being the brightest mark in an unlit cell. "The cell structure at the same strength the other cards' unlit cells have" is the constraint the ruling set, and out-shining them fails it in the other direction`,
    ).toBeLessThanOrEqual(50);
    expect(
      share,
      "the unlit cell's wash is zero or negative, which is the black square this amendment exists to stop",
    ).toBeGreaterThan(0);

    // ---- NOTHING NEW MOVES. Phase 4 snaps every animation to a static frame
    // under prefers-reduced-motion (src/lib/sim/host.ts, a normal entry at
    // tick 64); a moving wash would be uninvited motion on every card.
    for (const property of ["animation", "transition", "transform", "filter"]) {
      expect(
        declared.has(property),
        `.dots declares "${property}". Layer 1 is painted once by the browser and stays painted - the reduced-motion contract stills every pad, and 04-UI-SPEC's Color rule puts no filter, no blur and no shadow anywhere near a pad face`,
      ).toBe(false);
    }

    // ---- AND IT IS STILL AN ABSENCE OF LIGHT RATHER THAN A LIGHT. This
    // block used to read tpad out of DARK_BY_CONSTRUCTION and assert it was
    // still declared dark and still given no gesture, because A-58 changes
    // how an UNLIT cell is PAINTED and nothing else, and the two ways that
    // entry could have stopped being dark were both wrong: the configuration
    // altered (10-UI-SPEC 9.3 rejects it by name) or a gate retired to make a
    // card look better.
    //
    // PLAN 12-10 TOOK THE THIRD WAY, WHICH demo.ts NAMED AS THE ONLY HONEST
    // ONE: the ENTRY left. The user's answer at 12-06 ("selectable tuning
    // options under Trackpad") replaced the tpad preset with the hand-authored
    // TRACKPAD, whose flash is a Lua look and not a paint rule, and whose
    // gesture is a real demonstration path. So what this block holds now is
    // that the exemption left WITH the card and not instead of it: tpad is in
    // no catalog, no listing and no exemption list, and no card is exempt
    // from lighting under A-58's rule without being named here with a reason.
    expect(
      byId("tpad"),
      "tpad is back in the catalog. If it is, it is dark by construction again and needs its DARK_BY_CONSTRUCTION row with the 0 of 81 measurement back too",
    ).toBeUndefined();
    expect(
      DARK_BY_CONSTRUCTION.find((entry) => entry.id === "tpad"),
      "tpad is named in DARK_BY_CONSTRUCTION but is not a catalog card - a stale exemption reads like coverage",
    ).toBeUndefined();
    expect(
      demoPathFor("tpad"),
      "tpad has a demonstration gesture and is not a catalog card",
    ).toBeUndefined();
    for (const excused of DARK_BY_CONSTRUCTION) {
      expect(
        excused.why,
        `${excused.id}: an entry exempt from lighting must carry the measurement that says no gesture can light it`,
      ).toMatch(/[0-9]+ of 81/);
    }
  });
});
