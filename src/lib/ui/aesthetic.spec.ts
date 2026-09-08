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
 * ---------------------------------------------------------------------------
 * AMENDED BY PLAN 10-04. Scans 1, 2, 5 and 6 land in task 1 with Layers G and
 * S; scans 3 and 7 land in task 2 with the `.crt-band` shell and Layers R and
 * T. Each is in the same commit as the layer it gates, never afterwards.
 *
 * SCAN 1 CARRIES A HALF THE SPEC DID NOT ASK FOR, AND IT IS THE HALF THAT
 * CLOSES A MEASURED HOLE. 10-UI-SPEC 8.7 states scan 1 as "the four layer
 * selectors appear only in an explicit allowlist of files". An allowlist of
 * SELECTORS cannot catch plan 10-02's negative check 4, which moved
 * `--crt-scanline` from src/app.css into PadFrame.svelte's <style> and left
 * BOTH gates green - PadFrame.svelte is on the allowlist, so the selector half
 * is satisfied by the very move that hides the colour. So scan 1 also holds
 * 10-UI-SPEC 7.1's placement rule: every `--crt` custom property is declared in
 * src/app.css, the one file identity.spec.ts reads, with `--crt-noise` as the
 * single named exception asserted from both sides; and no CRT rule outside that
 * file writes a colour literal at all, `mask-image` excepted because a colour
 * in a mask is opacity rather than paint. Re-run with `--crt-scanline` moved
 * into PadFrame.svelte: identity.spec.ts 7 passed, scan 1 red, naming the file.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

const COVERFLOW = "src/lib/ui/Coverflow.svelte";
const APP_CSS = "src/app.css";
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

// ---------------------------------------------------------------------------
// SCANS 1, 2, 5 and 6 - the CRT layers themselves (10-UI-SPEC 8.7).
//
// THE ALLOWLIST IS THE POINT OF SCAN 1, so it is written out here once and read
// by four scans rather than restated in each. A file that is not on this list
// may not name a single word of the CRT vocabulary below, which is what makes
// "the off switch is one attribute, not a hunt" a property of the source
// instead of a promise.
const CRT_FILES: readonly string[] = [APP_CSS, PAD_FRAME];

/**
 * The vocabulary. Every string here belongs to the CRT and to nothing else on
 * this site, and each is asserted to be FOUND at least once inside the
 * allowlist - so a layer that is renamed away goes red rather than making the
 * walk pass on an empty search.
 *
 * `--crt` is a prefix and covers `--crt-scanline` and `--crt-noise` with it.
 */
const CRT_VOCABULARY: ReadonlyArray<readonly [string, string]> = [
  ["--crt", "the gate property and the two texture values derived from it"],
  ["data-screen", "the one attribute on <html> that is the whole off switch"],
  ["body::before", "Layer G, the page ground"],
  [".pad::after", "Layer S, scanlines and noise on pad frames"],
];

/**
 * Everything under src/, minus the specs. A GATE HAS TO QUOTE THE NAMES IT
 * PINS, so including `*.spec.ts` would forbid the mechanism - the same
 * reasoning install-copy.spec.ts's Z-08 walk records for its own exclusion.
 * Nothing else is excluded: src/vendor/ is walked like any other directory,
 * because a CRT selector appearing in the ported simulator would be a real
 * finding rather than noise.
 */
function walkSource(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(REPO_ROOT + dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      walkSource(path, out);
    } else if (
      /[.](?:ts|js|svelte|css)$/.test(entry.name) &&
      !/[.](?:spec|test)[.](?:ts|js)$/.test(entry.name)
    ) {
      out.push(path);
    }
  }
  return out;
}

interface Parsed {
  file: string;
  /** Comments stripped. A comment can never pass or fail a check. */
  stripped: string;
  /** Markup only, for a .svelte file; empty for a stylesheet. */
  template: string;
  /** The <style> block, or the whole file for a stylesheet. */
  css: string;
  rules: Rule[];
}

function parseFile(file: string): Parsed {
  const stripped = strip(read(file));
  const isStylesheet = file.endsWith(".css");
  const css = isStylesheet
    ? stripped
    : (/<style>([^]*)<\/style>/.exec(stripped)?.[1] ?? "");
  return {
    file,
    stripped,
    template: isStylesheet ? "" : stripped.replace(/<style>[^]*<\/style>/, ""),
    css,
    rules: parseRules(css),
  };
}

const crtSources = new Map<string, Parsed>(
  CRT_FILES.map((file) => [file, parseFile(file)]),
);

/**
 * The four layers, each named by the rightmost compound of the rule that
 * declares it - the same discipline scan 4 uses, and for the same reason.
 * Layers R and T join in plan 10-04 task 2, with the shell that carries them.
 */
interface Layer {
  /** G, S, R or T. */
  id: string;
  what: string;
  file: string;
  /** The rightmost compound of the rule that declares the layer. */
  compound: string;
  /**
   * The element whose markup must carry aria-hidden="true". Pseudo-elements
   * have no accessibility node at all, so only a real element is named here.
   */
  ariaHiddenOn?: string;
}

const LAYERS: Layer[] = [
  {
    id: "G",
    what: "the page ground - halftone and vignette, behind all content",
    file: APP_CSS,
    compound: "body::before",
  },
  {
    id: "S",
    what: "scanlines and noise, on pad frames and nothing else",
    file: PAD_FRAME,
    compound: ".pad::after",
  },
];

/** Every rule in a file whose rightmost compound is exactly this string. */
function rulesFor(parsed: Parsed, compound: string): Rule[] {
  return parsed.rules.filter((rule) =>
    rightmostCompounds(rule.selector).some((one) => one === compound),
  );
}

/**
 * A rule belongs to the CRT if its selector names the vocabulary, or if it
 * declares or reads a `--crt` property. Matched on PROPERTY NAMES and on the
 * selector, never on a body substring - scan 4's discipline, for scan 4's
 * reason.
 */
function isCrtRule(rule: Rule): boolean {
  if (CRT_VOCABULARY.some(([token]) => rule.selector.includes(token))) {
    return true;
  }
  return rule.declarations.some(
    (declaration) =>
      declaration.property.startsWith("--crt") ||
      declaration.value.includes("var(--crt"),
  );
}

/** A written-out colour: a hex, or any colour function. Never a var(). */
const COLOUR_LITERAL =
  /#[0-9a-fA-F]{3,8}|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/;

/**
 * THE ONE CRT CUSTOM PROPERTY THAT MAY NOT LIVE IN src/app.css, named with its
 * reason and asserted from BOTH sides below - the shape 10-03's
 * AMENDED_BY_MEASUREMENT row established. It carries no colour at all, and
 * scan 6 is what holds it to that.
 */
const NOISE_TOKEN = "--crt-noise";

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

describe("IDENT-01 the CRT layers (10-UI-SPEC 8.7)", () => {
  it("scan 1: the CRT vocabulary appears only inside its allowlist of files", () => {
    const files = walkSource("src");

    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      files.length,
      `the walk over src/ found ${files.length} source files`,
    ).toBeGreaterThan(50);
    for (const file of CRT_FILES) {
      expect(
        files.includes(file),
        `the walk reached ${file}, which is on the allowlist`,
      ).toBe(true);
    }

    /** file -> the vocabulary it names, comments stripped. */
    const named = new Map<string, string[]>();
    for (const file of files) {
      const stripped = strip(read(file));
      const hits = CRT_VOCABULARY.filter(([token]) =>
        stripped.includes(token),
      ).map(([token]) => token);
      if (hits.length > 0) named.set(file, hits);
    }

    // The floor: every word of the vocabulary is really in the tree, so a
    // renamed layer cannot make this walk pass on an empty search.
    for (const [token, what] of CRT_VOCABULARY) {
      const where = [...named.entries()]
        .filter(([, hits]) => hits.includes(token))
        .map(([file]) => file);
      expect(
        where,
        `"${token}" is ${what}, and no file in src/ names it - a renamed layer ` +
          "leaves this scan checking nothing, which is why the floor is here",
      ).not.toEqual([]);
    }

    // ---- (a) The vocabulary lives inside the allowlist. ----
    for (const [file, hits] of named) {
      expect(
        CRT_FILES.includes(file),
        `${file} names the CRT vocabulary ${JSON.stringify(hits)} and is NOT on the ` +
          `allowlist [${CRT_FILES.join(", ")}]. The CRT is a property of a pad frame, ` +
          "the coverflow band's own box or the page ground, and of nothing else " +
          "(10-UI-SPEC 8.3). Either move the rule into an allowlisted file, or add " +
          "this file to CRT_FILES and say in the same commit why a fifth surface " +
          "may carry the treatment.",
      ).toBe(true);
    }

    // ---- (b) EVERY --crt PROPERTY IS DECLARED IN src/app.css, AND THIS HALF
    // IS THE ONE THAT CLOSES 10-02's SILENT-GREEN HOLE. That plan moved
    // --crt-scanline out of app.css and into PadFrame.svelte's <style> and
    // watched BOTH gates stay green, because identity.spec.ts reads one file
    // and nothing then read the other. A colour that lives where the colour
    // gate cannot see it is not gated at all, whatever the allowlist says
    // about selectors. 10-UI-SPEC 7.1 is the placement rule; this is its
    // assertion.
    const declaredIn = new Map<string, string[]>();
    for (const parsed of crtSources.values()) {
      for (const rule of parsed.rules) {
        for (const declaration of rule.declarations) {
          if (!declaration.property.startsWith("--crt")) continue;
          const where = declaredIn.get(declaration.property) ?? [];
          where.push(parsed.file);
          declaredIn.set(declaration.property, where);
        }
      }
    }
    expect(
      [...declaredIn.keys()].sort(),
      "the CRT declares custom properties to place",
    ).not.toEqual([]);

    for (const [property, where] of declaredIn) {
      if (property === NOISE_TOKEN) continue;
      for (const file of where) {
        expect(
          file,
          `"${property}" is declared in ${file}. Every CRT custom property is declared ` +
            "in src/app.css and read from there, because identity.spec.ts reads THAT " +
            "FILE AND NOTHING ELSE: a colour authored inside a component <style> is " +
            "invisible to every colour gate this site has, which plan 10-02 observed " +
            "directly (its negative check 4 left identity.spec.ts green on exactly " +
            "this move). The rule is 10-UI-SPEC 7.1's, and this is where it is held.",
        ).toBe(APP_CSS);
      }
    }

    // The one exception, asserted from BOTH sides so it cannot be widened by
    // deleting a line: --crt-noise IS in PadFrame.svelte and is NOT in app.css.
    expect(
      declaredIn.get(NOISE_TOKEN),
      `${NOISE_TOKEN} is declared in ${PAD_FRAME} and only there. It is the one CRT ` +
        "property that may not live in src/app.css: a percent-encoded hue inside a " +
        "data-URI reads as no hex at all to identity.spec.ts, so declaring it there " +
        "would put the one colour the gate cannot see in the one file the gate reads.",
    ).toEqual([PAD_FRAME]);

    // ---- (c) No CRT rule outside src/app.css writes a colour. ----
    // The named exception is `mask-image`, and the reason is that a colour in a
    // mask is not paint - it is opacity. Scan 7 additionally pins that gradient
    // byte-equal to Coverflow.svelte's, so it cannot drift into a hue.
    const outside: Array<{ file: string; selector: string; text: string }> = [];
    for (const parsed of crtSources.values()) {
      if (parsed.file === APP_CSS) continue;
      for (const rule of parsed.rules) {
        if (!isCrtRule(rule)) continue;
        outside.push({
          file: parsed.file,
          selector: rule.selector,
          text: rule.body,
        });
      }
    }
    expect(
      outside.length,
      `the walk found ${outside.length} CRT rules outside src/app.css to check`,
    ).toBeGreaterThan(0);

    for (const parsed of crtSources.values()) {
      if (parsed.file === APP_CSS) continue;
      for (const rule of parsed.rules) {
        if (!isCrtRule(rule)) continue;
        for (const declaration of rule.declarations) {
          if (declaration.property.endsWith("mask-image")) continue;
          expect(
            COLOUR_LITERAL.test(declaration.value),
            `${parsed.file} writes a colour into "${declaration.property}: ${declaration.value}" ` +
              `on "${rule.selector}". A CRT rule outside src/app.css reads its colour ` +
              "through var(), never writes one: identity.spec.ts reads app.css alone, so " +
              "a literal here is a hue no gate on this site can see. The one exception is " +
              "mask-image, where a colour is opacity rather than paint.",
          ).toBe(false);
        }
      }
    }
  });

  it("scan 2: every CRT layer declares pointer-events: none, and the real elements are aria-hidden", () => {
    // ---- Non-vacuity. ----
    expect(
      LAYERS.length,
      `the layer table holds ${LAYERS.length} layers`,
    ).toBeGreaterThan(0);

    for (const layer of LAYERS) {
      const parsed = crtSources.get(layer.file) as Parsed;
      const rules = rulesFor(parsed, layer.compound);
      expect(
        rules.map((rule) => rule.selector),
        `Layer ${layer.id} (${layer.what}) is declared in ${layer.file} on a rule whose ` +
          `rightmost compound is "${layer.compound}"`,
      ).not.toEqual([]);

      const declarations = rules.flatMap((rule) => rule.declarations);
      const pointerEvents = declarations.find(
        (declaration) => declaration.property === "pointer-events",
      );
      expect(
        pointerEvents?.value,
        `Layer ${layer.id} (${layer.file}, "${layer.compound}") does not declare ` +
          "pointer-events: none. Every CRT layer is decoration over a page people " +
          "click on, and a layer that swallows a pointer is worse than no layer.",
      ).toBe("none");

      if (layer.ariaHiddenOn !== undefined) {
        const element = new RegExp(
          `<[a-z]+[^>]*class="[^"]*\b${layer.ariaHiddenOn}\b[^"]*"[^>]*>`,
        ).exec(parsed.template)?.[0];
        expect(
          element,
          `Layer ${layer.id} renders an element carrying class "${layer.ariaHiddenOn}" in ${layer.file}`,
        ).toBeDefined();
        expect(
          (element as string).includes('aria-hidden="true"'),
          `Layer ${layer.id}'s element (class "${layer.ariaHiddenOn}", ${layer.file}) is not ` +
            'aria-hidden="true". It carries no information; announcing it puts a ' +
            "decorative box into somebody's reading order.",
        ).toBe(true);
      }
    }
  });

  it("scan 5: no CRT selector names a canvas", () => {
    const crtRules: Array<{ file: string; selector: string }> = [];
    for (const parsed of crtSources.values()) {
      for (const rule of parsed.rules) {
        const inSelector = CRT_VOCABULARY.some(([token]) =>
          rule.selector.includes(token),
        );
        const inBody = rule.declarations.some(
          (declaration) =>
            declaration.property.startsWith("--crt") ||
            declaration.value.includes("var(--crt"),
        );
        if (inSelector || inBody) {
          crtRules.push({ file: parsed.file, selector: rule.selector });
        }
      }
    }

    // ---- Non-vacuity. ----
    expect(
      crtRules.length,
      `the walk found ${crtRules.length} CRT rules across ${CRT_FILES.length} files`,
    ).toBeGreaterThan(0);

    for (const { file, selector } of crtRules) {
      expect(
        /\bcanvas\b/i.test(selector),
        `${file} declares a CRT rule on "${selector}", which names a canvas. ` +
          "paint.ts:17-35 makes any CSS that adds or tints colour over a pad face a " +
          "FIDELITY violation rather than a style choice: the product's central claim " +
          "is that those pixels are the firmware's own.",
      ).toBe(false);
    }
  });

  it("scan 6: the noise tile declares no fill - only the filter's own output colours it", () => {
    const tiles: Array<{ file: string; uri: string }> = [];
    for (const parsed of crtSources.values()) {
      for (const match of parsed.css.matchAll(
        /url\(\s*"(data:image\/svg\+xml,[^"]*)"\s*\)/g,
      )) {
        tiles.push({ file: parsed.file, uri: match[1] });
      }
    }

    // ---- Non-vacuity: the tile exists, is declared once, and is the tile. ----
    expect(
      tiles.map((tile) => tile.file),
      "exactly one SVG data-URI is declared across the allowlisted files - the noise tile",
    ).toEqual([PAD_FRAME]);
    const { uri } = tiles[0];
    expect(
      uri.includes("feTurbulence"),
      "the tile is an feTurbulence tile, not some other SVG",
    ).toBe(true);
    expect(
      uri.includes("filter="),
      "the tile applies its filter to a shape, so the filter's output is what is painted",
    ).toBe(true);

    // ---- The claim: nothing in it declares a colour. ----
    for (const spelling of ["fill=", "fill%3D", "fill:", "fill%3A"]) {
      expect(
        uri.includes(spelling),
        `the noise tile in ${PAD_FRAME} declares "${spelling}". A colour written inside ` +
          "a data-URI is invisible to identity.spec.ts - its hex walk matches a literal " +
          "'#' and a percent-encoded one is not one - so the tile is the one place on " +
          "this site a fourth hue could enter unseen. The filter's own output is the " +
          "only thing that may colour a pixel of it.",
      ).toBe(false);
    }
  });
});
