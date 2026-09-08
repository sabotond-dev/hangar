/**
 * IDENT-01 / IDENT-02 — the CRT and glitch treatment, asserted as source
 * structure rather than promised in a comment (10-UI-SPEC §8.7).
 *
 * THIS FILE HOLDS ONE SCAN TODAY AND SEVEN AFTER 10-04, AND THAT IS
 * DELIBERATE. §17 asks for all seven in Wave 0. Six of them scan for
 * `.crt-band`, `body::before`, the pad frame's `::after` and the noise tile,
 * none of which exists on a Wave 0 tree, and each carries a non-vacuity floor -
 * so six would be red on arrival, which is a scheduled failure rather than a
 * gate. 09-VALIDATION already named that failure mode: an assertion that
 * cannot be true yet is not a gate.
 *
 * Scan 4 is here in Wave 0 because it is the only one of the seven that can be
 * true on a tree with no CRT, and it is the one that protects the file this
 * phase promises not to touch. Scans 1, 2, 3, 5, 6 and 7 land in 10-04, in the
 * same commit as the layer each one gates - never afterwards, because a gate
 * that arrives after the thing it gates has already shipped is a comment.
 * (10-VALIDATION amendment V-01.)
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
 * A substring implementation of either half turns this phase's one Wave 0 gate
 * red on arrival, which is precisely what V-01 exists to prevent.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

const COVERFLOW = "src/lib/ui/Coverflow.svelte";

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
