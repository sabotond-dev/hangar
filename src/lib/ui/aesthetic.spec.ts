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
 * WHAT THIS FILE GATES NOW - TWO SCANS, BOTH WITH A LIVE SUBJECT.
 *
 * Scan 4 was here in Wave 0 because it was the only one of the seven that
 * could be true on a tree with no CRT, and it is the one that survives a tree
 * with no CRT for the same reason: its subject is Coverflow.svelte's own 3D
 * context, which stays ungrouped, and its band, which keeps its clip and its
 * mask. Nothing in it names the CRT. It stays until 13-09 deletes the
 * coverflow (13-VALIDATION D-5), and the plan that deletes the component
 * deletes this scan by name in the same commit.
 *
 * Scan 8 is the unlit cell (10-UI-SPEC A-58, A-59): the dot is still there,
 * the wash is the token rather than a colour, the fraction is capped, and the
 * pad that lights nothing is still declared dark. It is about the pad and not
 * about the texture, which is why it stays in place and the file survives.
 *
 * SCAN 4 ASSERTS BOTH DIRECTIONS, AND THE SECOND DIRECTION IS THE ONE THE
 * SPEC'S OWN FIRST PASS HAD BACKWARDS. `.band`'s `overflow: clip` and its edge
 * `mask-image` are not tolerated, they are REQUIRED: they are the clip and the
 * fade the row is built on, and a scan that only forbade would go green on a
 * tidy-up that deleted them.
 *
 * TWO IMPLEMENTATION RULES HERE ARE LOAD-BEARING, and `Coverflow.svelte:1013`
 * is why. That rule is
 * `.stage.measured .slot { transition: transform ..., opacity ..., filter ... }`.
 * Its selector CONTAINS the string `.stage` and its body CONTAINS the
 * substrings `filter` and `opacity`, yet it is entirely legal: its rightmost
 * compound is `.slot`, and the only property it declares is `transition`.
 * So this scan
 *
 *   1. matches a rule on the RIGHTMOST COMPOUND of its selector - `.stage`,
 *      `.stage.measured`, `.stage:hover` - and never on a selector that merely
 *      contains the string; and
 *   2. matches a declaration on its PROPERTY NAME, the token left of the first
 *      colon, and never on a body substring.
 *
 * A substring implementation of either half turns this gate red on a legal
 * rule, which is precisely what V-01 exists to prevent.
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
import { DARK_BY_CONSTRUCTION, demoPathFor } from "../sim/demo";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

const COVERFLOW = "src/lib/ui/Coverflow.svelte";
const PAD_FRAME = "src/lib/ui/PadFrame.svelte";

/**
 * identity.spec.ts's stripper, verbatim in behaviour: comments go before
 * anything is matched, so a comment can never pass or fail a check. Backslash
 * free, so any line of it can be quoted into a plan without an escape being
 * halved in transport.
 */
const strip = (t: string) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

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

/**
 * The rightmost compound of every selector in a group. `.stage.measured .slot`
 * yields `.slot`; `.band.chosen` yields `.band.chosen`.
 */
function rightmostCompounds(selector: string): string[] {
  return splitTop(selector, ",")
    .map((one) => one.trim())
    .filter(Boolean)
    .map((one) => {
      const parts = one.split(/[\s>+~]+/).filter(Boolean);
      return parts[parts.length - 1] ?? "";
    });
}

/** Does the rightmost compound carry this class, as a whole class name? */
function targets(rule: Rule, className: string): boolean {
  const pattern = new RegExp(`\\.${className}(?![\\w-])`);
  return rightmostCompounds(rule.selector).some((compound) =>
    pattern.test(compound),
  );
}

const source = read(COVERFLOW);
const stripped = strip(source);
const styleBlock = /<style>([^]*)<\/style>/.exec(stripped)?.[1] ?? "";
const template = stripped.replace(/<style>[^]*<\/style>/, "");
const rules = parseRules(styleBlock);
const declarationCount = rules.reduce(
  (total, rule) => total + rule.declarations.length,
  0,
);

/**
 * §8.2's grouping set, by property name. `opacity` and `contain` are checked
 * by value below, because `opacity: 1` and `contain: layout` are harmless and
 * only `opacity` below 1 and `contain: paint` group.
 *
 * `mask` and `-webkit-mask-image` are here as spellings of `mask-image`, not
 * as an additional prohibition: the same grouping behaviour arrives under any
 * of the three names.
 */
const FORBIDDEN_ON_STAGE = [
  "filter",
  "mix-blend-mode",
  "mask-image",
  "mask",
  "-webkit-mask-image",
];

/** A written-out colour: a hex, or any colour function. Never a var(). */
const COLOUR_LITERAL =
  /#[0-9a-fA-F]{3,8}|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/;

describe("IDENT-01 aesthetic source scans (10-UI-SPEC §8.7)", () => {
  it("scan 4: Coverflow.svelte's 3D context stays ungrouped and its band keeps its clip and its mask", () => {
    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      rules.length,
      `the <style> block parsed into ${rules.length} rules`,
    ).toBeGreaterThan(10);
    expect(
      declarationCount,
      `those rules carry ${declarationCount} declarations`,
    ).toBeGreaterThan(25);
    for (const className of ["band", "stage", "slot"]) {
      expect(
        rules.some((rule) => rule.selector.includes(`.${className}`)),
        `the parse found rules mentioning .${className} in ${COVERFLOW}`,
      ).toBe(true);
    }

    const stageRules = rules.filter((rule) => targets(rule, "stage"));
    const bandRules = rules.filter((rule) => targets(rule, "band"));
    // Without these two the loops below would be vacuously green on a file
    // whose selectors had all been renamed.
    expect(
      stageRules.map((rule) => rule.selector),
      "at least one rule's rightmost compound is .stage, so the ABSENT half has something to check",
    ).not.toEqual([]);
    expect(
      bandRules.map((rule) => rule.selector),
      "at least one rule's rightmost compound is .band, so the PRESENT half has something to check",
    ).not.toEqual([]);

    // ---- ABSENT: no grouping property on the 3D context itself. ----
    // A grouping property on .stage forces transform-style: flat on its
    // descendants, which collapses the coverflow ladder into a row of equal
    // squares. This direction is ADDED-something-forbidden.
    for (const rule of stageRules) {
      for (const declaration of rule.declarations) {
        expect(
          FORBIDDEN_ON_STAGE.includes(declaration.property),
          `SOMETHING WAS ADDED: ${COVERFLOW} declares "${declaration.property}" on "${rule.selector}", ` +
            "whose rightmost compound is the 3D context. It is a grouping property and it flattens " +
            "every slot inside the ladder (04-CONTEXT D-16, 10-UI-SPEC §8.2). No CRT layer goes here.",
        ).toBe(false);

        if (declaration.property === "opacity") {
          const value = Number.parseFloat(declaration.value);
          expect(
            Number.isFinite(value) && value < 1,
            `SOMETHING WAS ADDED: ${COVERFLOW} declares "opacity: ${declaration.value}" on ` +
              `"${rule.selector}". An opacity below 1 groups, and grouping flattens the ladder.`,
          ).toBe(false);
        }

        if (declaration.property === "contain") {
          expect(
            declaration.value.includes("paint"),
            `SOMETHING WAS ADDED: ${COVERFLOW} declares "contain: ${declaration.value}" on ` +
              `"${rule.selector}". contain: paint groups, and grouping flattens the ladder.`,
          ).toBe(false);
        }
      }
    }

    // ---- PRESENT: the band still clips and still fades at its edges. ----
    // This direction is DELETED-something-load-bearing, and it is the one the
    // spec's own first pass had backwards.
    const bandDeclarations = bandRules.flatMap((rule) => rule.declarations);
    const overflow = bandDeclarations.find(
      (declaration) => declaration.property === "overflow",
    );
    expect(
      overflow?.value,
      `SOMETHING WAS DELETED: ${COVERFLOW}'s .band no longer declares "overflow: clip". ` +
        "It is the clip the row is built on, and it is on .band rather than on .stage precisely " +
        "so it does not group the 3D context.",
    ).toBe("clip");
    expect(
      bandDeclarations.some(
        (declaration) => declaration.property === "mask-image",
      ),
      `SOMETHING WAS DELETED: ${COVERFLOW}'s .band no longer declares "mask-image". ` +
        "It is the four-stop edge fade the row is built on; a tidy-up that removed it would " +
        "leave a forbid-only scan green.",
    ).toBe(true);

    // ---- PRESENT: the slot's recede, which lives in the markup. ----
    // These are inline style attributes at Coverflow.svelte:841-846, not
    // <style> rules, so the template text is what is scanned. A slot is a leaf
    // of the 3D tree - it has no 3D children to flatten - and the recede
    // depends on both of them.
    expect(
      template.includes("filter: brightness("),
      `SOMETHING WAS DELETED: ${COVERFLOW}'s slot no longer carries an inline ` +
        '"filter: brightness(" - the one filter permitted anywhere near a pad, and half of the recede.',
    ).toBe(true);
    expect(
      /opacity:\s*\{/.test(template),
      `SOMETHING WAS DELETED: ${COVERFLOW}'s slot no longer carries an inline "opacity:" - ` +
        "the other half of the recede.",
    ).toBe(true);
  });
});

describe("IDENT-01 the unlit cell (10-UI-SPEC 19.1a as amended, A-58, A-59)", () => {
  it("scan 8: the unlit cell is drawn as a cell, in the token, and the pad that lights nothing is still dark", () => {
    const rules = parseRules(strip(read(PAD_FRAME)));
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

    // ---- AND IT IS STILL AN ABSENCE OF LIGHT RATHER THAN A LIGHT. Read from
    // the module, not quoted: the entry this amendment was written for is
    // still declared dark, and it is still given no gesture to light it.
    const dark = DARK_BY_CONSTRUCTION.find((entry) => entry.id === "tpad");
    expect(
      dark,
      "tpad is no longer in DARK_BY_CONSTRUCTION. A-58 changes how an UNLIT cell is PAINTED and nothing else; if the entry has stopped being declared dark then either the configuration was altered - which 10-UI-SPEC 9.3 rejects by name, because it changes what the pad does on somebody's hardware - or a gate was retired to make a card look better",
    ).toBeDefined();
    expect(
      (dark as { why: string }).why,
      "tpad's DARK_BY_CONSTRUCTION reason no longer carries the measurement. It is 0 of 81 lit over a drag, a two-finger scroll, taps and 2,000 idle ticks, and that number is the whole reason the card's own sentence is allowed to say what it says",
    ).toContain("0 of 81");
    expect(
      demoPathFor("tpad"),
      "tpad has been given a demonstration gesture. It has no LED layer to light - look.kind and touch.kind are both none and both disabled - so a path there would be a gesture that demonstrates nothing, and the honest card is the one that says so in its own words",
    ).toBeUndefined();
  });
});
