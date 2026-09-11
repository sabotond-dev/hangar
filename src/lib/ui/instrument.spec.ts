/**
 * IDENT-01 / IDENT-02 / SAFE-02 / CAT-03 - the INSTRUMENT register, held from
 * the side aesthetic.spec.ts does not hold (10-UI-SPEC 19.1g, D-15, D-16).
 *
 * WHY THIS IS A SECOND FILE AND NOT FIVE MORE SCANS IN aesthetic.spec.ts.
 * Its walk is DERIVED FROM THE DIRECTORY, and the three lists it sits beside
 * are not. Every gate over a set of components in this repository is a
 * hand-declared array today, and each one lets an omitted file through in
 * silence:
 *
 *   1. src/lib/ui/device-ui.spec.ts:88's DEVICE_COMPONENTS - SEVEN names since
 *      plan 10-13 added Clear.svelte. The 44px both-axes walk iterates it, and
 *      10-13 proved the hole by experiment: removing Clear.svelte from the list
 *      turned ONLY the length assertion red, and the walk went green having
 *      read nothing about the component it no longer covered.
 *   2. src/lib/ui/browse-ui.spec.ts:60's browseFiles() - a hand list of six
 *      component paths plus the route and the src/lib/browse/*.ts directory. A
 *      new browse component omitted from it escapes every browse gate.
 *   3. src/lib/ui/aesthetic.spec.ts's CRT_FILES - four names, CORRECT for its
 *      purpose because that file's claim was "only these four" - retired with
 *      the CRT by 13-04 (D-09).
 *
 * INSTRUMENT_FILES below is every src/lib/ui/*.svelte MINUS a short declared
 * front-door-only list, asserted against readdirSync with a length and with a
 * totality check - so a component added in a later phase is walked on the day
 * it appears rather than on the day somebody remembers it. That difference is
 * the whole reason 19.1g asked for a second file. It is what covers
 * ChosenPanel.svelte, TryOnDevice.svelte, CopyLink.svelte, Knob.svelte,
 * TagChip.svelte and BrowseToolbar.svelte, none of which appears in
 * DEVICE_COMPONENTS and four of which appeared in no both-axes walk at all
 * before this file existed.
 *
 * THE REGISTER LINE IS A LINE OF AUTHORSHIP, NOT OF DOM CONTAINMENT, AND THAT
 * IS A CORRECTION TO 19.1g RATHER THAN A CONVENIENCE. 19.1g states the line as
 * "the front-door register is everything inside .front-door; the instrument
 * register is everything that is not". As a statement about the rendered tree
 * that is false against what already ships, and provably so: src/routes/+page.svelte
 * and src/routes/c/[id]/+page.svelte both mount FrontDoor.svelte, whose root IS
 * .front-door, and FrontDoor.svelte mounts Coverflow.svelte, which mounts
 * ChosenPanel.svelte, TryOnDevice.svelte, CopyLink.svelte and
 * TuningRegion.svelte. So the panels, the tuning region and the whole device
 * flow - every surface D-16 moves INTO the instrument register - are DOM
 * descendants of .front-door and always have been.
 *
 * What is implementable, and what is asserted here, is the authorship reading:
 * no instrument rule is AUTHORED inside FrontDoor.svelte or under a
 * .front-door selector. Svelte scopes a component's styles to that component,
 * so TryOnDevice.svelte's pill is authored outside the front door's stylesheet
 * even though its button paints inside the front door's box. The line then
 * lives in exactly one place, cannot be moved in one file and not the other,
 * and says something a scan can check.
 *
 * THE OTHER SIDE OF THE LINE, AND THE GROUND, WENT AT 13-04 (13-CONTEXT.md
 * D-09, 2026-09-11). Until then scan 1 also held every moving or texturing CRT
 * layer to .front-door with Layer G as the one declared exception on every
 * route, scan 3 held the registration lattice's composition and its two roots,
 * scan 4 held the halftone at the one pitch the measurement licensed, and scan
 * 6 held the :where() ground rule with its three exceptions. The Bible's §3
 * asks for solid surfaces inside the working application, so the CRT, the
 * halftone and the lattice were deleted and scans 3 and 4 with them, by name;
 * scan 1 kept its instrument side, scan 2 lost the radius half of its subject
 * (13-03 had already removed the pill's corners under D-10) and scan 6 was
 * re-aimed at the ground rule that survives - the ground is solid, and the
 * retired vocabulary stays retired.
 *
 * Every scan strips comments first. These files name in prose the very things
 * they are forbidden to declare - src/app.css's own header explains why the
 * noise tile is not in it, and this file's header names both registers - so a
 * scan over raw source would go red on correct code and the natural fix would
 * be deleting the documentation. The stripper, the rule parser, the
 * rightmost-compound discipline and the non-vacuity habit are
 * aesthetic.spec.ts's, copied rather than reinvented, and every regular
 * expression here is backslash-free in the same house style.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

const UI_DIR = "src/lib/ui";
const APP_CSS = "src/app.css";
const FRONT_DOOR = "src/lib/ui/FrontDoor.svelte";

/** aesthetic.spec.ts's stripper, verbatim in behaviour and backslash-free. */
const strip = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const code = (file: string) => strip(read(file));

interface Rule {
  selector: string;
  body: string;
}

/** The <style> block of a component, or the whole file for a stylesheet. */
function styleOf(file: string, source: string): string {
  if (file.endsWith(".css")) return source;
  return /<style>([^]*)<\/style>/.exec(source)?.[1] ?? "";
}

/**
 * A stylesheet split into rules, innermost braces first so a media block's
 * contents are read as rules rather than as one body. browse-ui.spec.ts's
 * rulesOf, widened to take a stylesheet rather than a component.
 */
function rulesOf(css: string): Rule[] {
  return [...css.matchAll(/([^{}]+)[{]([^{}]*)[}]/g)].map((match) => ({
    selector: match[1].trim().replace(/\s+/g, " "),
    body: match[2],
  }));
}

/** The token left of the first colon, for every declaration in a body. */
function declarationsOf(body: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const piece of body.split(";")) {
    const text = piece.trim();
    const colon = text.indexOf(":");
    if (colon < 0) continue;
    out.push([
      text.slice(0, colon).trim().toLowerCase(),
      text
        .slice(colon + 1)
        .trim()
        .replace(/\s+/g, " "),
    ]);
  }
  return out;
}

/** The markup half of a component: everything outside its <style> block. */
const templateOf = (source: string) =>
  source.replace(/<style>[^]*<\/style>/, "");

/**
 * Every opening tag in a piece of markup, brace-aware.
 *
 * A REGULAR EXPRESSION OVER [^<>]* WOULD NOT DO, AND THE FILE THAT PROVES IT IS
 * Knob.svelte: its option label carries
 * onpointerenter={(event) => forecastEnter(event, at)}, and the fat arrow's
 * greater-than sign ends the match three attributes early - which would have
 * hidden the class:pill directive that follows it. So the scan tracks brace
 * depth and quotes and stops at the first > outside both.
 */
function openingTags(template: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < template.length; i += 1) {
    if (template[i] !== "<") continue;
    if (!/[a-zA-Z]/.test(template[i + 1] ?? "")) continue;
    let depth = 0;
    let quote = "";
    let j = i + 1;
    for (; j < template.length; j += 1) {
      const ch = template[j];
      if (quote !== "") {
        if (ch === quote) quote = "";
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
      else if (ch === ">" && depth === 0) break;
    }
    out.push(template.slice(i, j + 1));
    i = j;
  }
  return out;
}

/**
 * Every class a tag applies, from both spellings Svelte offers: the literal
 * tokens of a class attribute, and the names of class: directives. A directive
 * is conditional - Knob.svelte's pill is on its word row and not on its swatch
 * row - and this walk counts it as APPLIED, because a shape that reaches a
 * control under any condition is a shape that has to hold the 44px floor.
 */
function classesOf(tag: string): string[] {
  return [...staticClassesOf(tag), ...directiveClassesOf(tag)];
}

/**
 * The UNCONDITIONAL classes of a tag - the literal tokens of its class
 * attribute. This is the element's identity, and it is kept apart from the
 * directives on purpose: `class:selected`, `class:active` and `class:confirmed`
 * are STATES, so folding them into the name would give one control as many
 * names as it has states and would make the hand list below a list of states
 * rather than of controls.
 */
function staticClassesOf(tag: string): string[] {
  const out: string[] = [];
  for (const attr of tag.matchAll(/class[ ]*=[ ]*"([^"]*)"/g)) {
    for (const token of attr[1].split(/[ ]+/)) {
      if (token !== "" && !token.includes("{")) out.push(token);
    }
  }
  return out;
}

/** The names of a tag's class: directives, conditional or not. */
function directiveClassesOf(tag: string): string[] {
  return [...tag.matchAll(/class:([A-Za-z][A-Za-z0-9-]*)/g)].map(
    (match) => match[1],
  );
}

/**
 * The BASE rule for a class in a component: the one whose selector is exactly
 * that class and nothing else.
 *
 * STATE RULES AND DESCENDANT RULES ARE DELIBERATELY NOT FOLDED IN, and the
 * reason is that the pill's floor is a claim about a control AT REST.
 * .chip.active's tint and .options.swatches .option's zero padding are both
 * conditional on something, and folding them in would let a condition that
 * cannot hold on a pilled element - the swatch row never wears the pill -
 * decide whether the word row clears its curve.
 */
function baseRule(rules: Rule[], cls: string): Rule | undefined {
  return rules.find((rule) => rule.selector === `.${cls}`);
}

/**
 * The instrument register's vocabulary: the class names this register's rules
 * are applied by. Each is asserted FOUND before it is asserted CONFINED, so a
 * renamed shape cannot make the confinement pass on an empty search.
 *
 * `lattice` joined in plan 10-13.1 task 2 and left at 13-04 with the field it
 * named (D-09); the list is one word until 13-05's shell adds a shape.
 */
const INSTRUMENT_VOCABULARY: ReadonlyArray<readonly [string, string]> = [
  ["pill", "10-UI-SPEC 19.1b's control shape, one rule in src/app.css"],
];

/**
 * Front-door-only components, and the two are not the same kind of thing, so
 * they are listed with their reasons rather than as one array of names.
 *
 * FrontDoor.svelte OWNS the register line - it is the file whose root class the
 * line is drawn at - and Splash.svelte is the arrival ceremony, which exists on
 * no other route. Coverflow.svelte is the ceremonial shelf and this phase
 * promises in writing not to touch it, so it is excluded from a walk that would
 * have to be able to demand an edit to it.
 */
const FRONT_DOOR_ONLY: ReadonlyArray<readonly [string, string]> = [
  [
    "FrontDoor.svelte",
    "it is the file whose root class .front-door IS the register line; it carried the CRT shell until 13-04 deleted it",
  ],
  [
    "Splash.svelte",
    "the arrival ceremony, mounted by FrontDoor.svelte and by nothing else on the site",
  ],
  [
    "Coverflow.svelte",
    "the ceremonial shelf, and phase 10 promises in writing that it is byte-untouched - a walk that could demand an edit to it would be a walk that could break that promise",
  ],
];

/**
 * The excluded set is the front-door-only list and nothing else. ScreenToggle
 * .svelte was declared exempt here - it named the CRT vocabulary and rendered
 * in every footer - until 13-04 deleted it with the CRT (D-09).
 */
const excluded = new Set(FRONT_DOOR_ONLY.map(([name]) => name));

/** Every .svelte file under src/lib/ui/, from the directory, sorted. */
const uiComponents = (): string[] =>
  readdirSync(REPO_ROOT + UI_DIR)
    .map(String)
    .filter((name) => name.endsWith(".svelte"))
    .sort();

/** THE DERIVED WALK. Not a list; a subtraction from the directory. */
const instrumentFiles = (): string[] =>
  uiComponents().filter((name) => !excluded.has(name));

/**
 * The controls that WEAR the pill, by file and by the class the rule that
 * shapes them is written on. This is a hand list, and it is checked AGAINST the
 * derived walk in both directions below rather than iterated by it - which is
 * the correction 10-13 earned: a hand list that a walk iterates is the walk's
 * real scope, and the walk then passes having read nothing.
 */
/**
 * EVERY --font-mono USE ON THE SITE, BY FILE AND BY THE RULE THAT DECLARES IT.
 *
 * SEVEN, NOT SIX, AND THE NUMBER IS THE RULE (A-44). 5.2 said "six, and the
 * list is asserted" and was written before 10-10 shipped; 19.1c then called the
 * metadata block the sixth, which double-counted the picker's RGB triple. A-44
 * settles it at seven and requires the seventh's argument to be made OUT LOUD
 * rather than inherited, which CatalogCard.svelte's own comment does: the fifth
 * and the sixth qualify on W-03's "a number that changes as a pointer moves",
 * and the seventh qualifies on the other half - machine text whose columns must
 * hold - because it is static and never jitters at all.
 *
 * The list is what is asserted, not the count alone: a seventh use somewhere
 * else would keep the count right and still be a defect.
 */
const MONO_USES: ReadonlyArray<readonly [string, string, string]> = [
  ["BudgetMeter.svelte", "Phase 5", "the two numeric columns"],
  ["CopyLink.svelte", "Phase 5", "the link field"],
  ["DeviceSlot.svelte", "Phase 5", "the firmware numerals"],
  [
    "Knob.svelte",
    "Phase 5 and 11.3",
    "the integer readout, and the forecast delta",
  ],
  ["ColourPicker.svelte", "10-10", "the RGB triple - the sixth"],
  ["CatalogCard.svelte", "10-13.1, 19.1c", "the metadata block - the seventh"],
];

/** Seven uses across six files: Knob.svelte carries two of them. */
const MONO_COUNT = 7;

const PILLED: ReadonlyArray<readonly [string, string, string]> = [
  [
    "TryOnDevice.svelte",
    "primary",
    "Primary - the pill's radius on its own accent fill",
  ],
  ["PutBack.svelte", "control", "Secondary"],
  [
    "KeepConfirm.svelte",
    "secondary",
    "Secondary - the confirmation's affirmative",
  ],
  ["CopyLink.svelte", "control", "Secondary"],
  ["BudgetMessage.svelte", "back-off", "Secondary - TURN IT DOWN"],
  ["MixTwo.svelte", "mix-two", "Secondary"],
  [
    "BrowseToolbar.svelte",
    "clear-filters",
    "Secondary - a browse control, named here because 10.3's row is the device panel's five",
  ],
  [
    "Knob.svelte",
    "option",
    "word row - the WORD widget only; the swatch row is not a word",
  ],
  ["ColourPicker.svelte", "option", "word row - the knob selector"],
  ["BrowseToolbar.svelte", "option", "word row - SORT"],
  ["TagChip.svelte", "chip", "word row - the facet chips"],
];

/**
 * The QUIET tier, and the two channels that make it quiet, asserted rather than
 * remembered (10-UI-SPEC 10.3 as amended by A-46, A-41).
 *
 * Pilling any of these would give it a border and flatten it into Secondary,
 * which is the exact SAFE-02 regression the ladder exists to prevent. Since
 * A-46 retired the Bare tier the rule protects SIX controls rather than one,
 * and CLEAR is among them - so the claim this scan holds is strictly stronger
 * than the one it was written against.
 */
const QUIET: ReadonlyArray<readonly [string, string, string]> = [
  ["KeepOnDevice.svelte", "control", "KEEP ON DEVICE"],
  ["Clear.svelte", "control", "CLEAR - Quiet since A-46 retired the Bare tier"],
  ["KeepConfirm.svelte", "quiet-control", "NOT NOW"],
  ["TryOnDevice.svelte", "disconnect", "DISCONNECT ZONA"],
  ["Knob.svelte", "lock", "HOLD / HELD"],
  ["BrowseToolbar.svelte", "clear", "the search field's own CLEAR"],
];

/**
 * The one control inside an instrument FILE that is a front-door control, named
 * so the omission is a ruling.
 *
 * FacetRow.svelte straddles the register line, which is the sharpest single
 * demonstration that the line is a class rather than a file list: on /browse/ it
 * renders TagChip.svelte, which is pilled, and on / it renders its own .link
 * members, which are not, because that row paints on the front door and nowhere
 * else.
 */
const STRADDLES: readonly [string, string, string] = [
  "FacetRow.svelte",
  "link",
  "the FOR row's link mode renders on the front door and on no other route (FrontDoor.svelte mounts it with an href), so its members stay in the front-door register while the same component's checkbox mode renders pilled chips on /browse/",
];

describe("IDENT-01 the instrument register (10-UI-SPEC 19.1g)", () => {
  it("scan 1: the register line holds from the instrument side - the pill is authored once, in src/app.css, and never inside FrontDoor.svelte or under .front-door", () => {
    const frontDoor = code(FRONT_DOOR);
    expect(
      openingTags(templateOf(frontDoor)).some((tag) =>
        classesOf(tag).includes("front-door"),
      ),
      "FrontDoor.svelte no longer applies the class .front-door to anything - the register line is drawn at that class",
    ).toBe(true);

    // ---- THE OTHER SIDE OF THE LINE WENT WITH THE CRT (13-04, D-09). Until
    // then this scan also held Layer S to a .front-door selector, Layers R and
    // T to this file, and Layer G as the one declared exception on every
    // route. There is no CRT layer left to scope, so the line is held from the
    // instrument side alone: no instrument rule is AUTHORED inside
    // FrontDoor.svelte or under a .front-door selector, anywhere in src/.
    //
    // The floor first: every word of the vocabulary is really in the tree, so a
    // renamed shape cannot leave this half checking an empty search.
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(REPO_ROOT + dir, {
        withFileTypes: true,
      })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path, out);
        else if (
          /[.](?:svelte|css)$/.test(entry.name) &&
          !/[.](?:spec|test)[.]/.test(entry.name)
        )
          out.push(path);
      }
      return out;
    };
    const files = walk("src");
    expect(
      files.length,
      `the walk over src/ found ${files.length} stylesheets and components`,
    ).toBeGreaterThan(30);

    for (const [word, what] of INSTRUMENT_VOCABULARY) {
      // PRESENCE by substring rather than by exact selector, so a rule that has
      // been SCOPED - `.front-door .lattice` - still counts as present here and
      // fails on the scoping check below with the message that names the
      // register line, rather than failing here on a floor that would report a
      // missing rule that is not missing at all.
      const carriers = files.filter((file) =>
        rulesOf(styleOf(file, code(file))).some((rule) =>
          rule.selector.includes(`.${word}`),
        ),
      );
      expect(
        carriers,
        `no file in src/ declares a .${word} rule, or a file other than src/app.css does. It is ${what}: a vocabulary word that is not in the tree leaves the confinement below checking nothing, and one declared in a component <style> carries a colour identity.spec.ts cannot see`,
      ).toEqual([APP_CSS]);
    }

    // (a) FrontDoor.svelte authors none of it, and names none of it.
    for (const [word] of INSTRUMENT_VOCABULARY) {
      expect(
        frontDoor.includes(word),
        `FrontDoor.svelte names "${word}". The instrument register's rules are authored OUTSIDE the front door's own file (D-16, A-37), and an instrument shape declared here would move the line in one file and not in the other.`,
      ).toBe(false);
    }

    // (b) And nowhere in src/ is an instrument rule scoped under .front-door -
    // which is the spelling that would put the register on the hero shell
    // without ever editing FrontDoor.svelte.
    const scoped: string[] = [];
    for (const file of files) {
      for (const rule of rulesOf(styleOf(file, code(file)))) {
        if (!rule.selector.includes("front-door")) continue;
        for (const [word] of INSTRUMENT_VOCABULARY) {
          if (rule.selector.includes(word) || rule.body.includes(word))
            scoped.push(`${file} -> ${rule.selector}`);
        }
      }
    }
    expect(
      scoped,
      "an instrument rule is scoped under .front-door. The register line is a CLASS and it is drawn once, and the instrument register is authored outside it (D-16, A-37, 10-UI-SPEC 19.1g).",
    ).toEqual([]);
  });

  it("scan 2: the pill is Primary's fill and Secondary's outline, it reaches no Quiet control, and every pill resolves both 44px axes", () => {
    const present = uiComponents();
    const walked = instrumentFiles();

    // ---- Non-vacuity and TOTALITY. Every component on disk is either walked
    // or declared out, so a file added in a later phase cannot be quietly
    // outside both.
    expect(
      present.length,
      `readdirSync found ${present.length} components under ${UI_DIR}`,
    ).toBeGreaterThan(20);
    expect(
      present.filter((name) => !walked.includes(name) && !excluded.has(name)),
      "a component is neither walked nor declared out - the partition below is what makes this walk derived rather than declared",
    ).toEqual([]);
    expect(
      [...excluded].filter((name) => !present.includes(name)),
      "a declared front-door-only component is not on disk - it was renamed, and this walk has silently widened",
    ).toEqual([]);
    expect(
      walked.length,
      `${walked.length} instrument components were walked - ${present.length} on disk minus the ${excluded.size} declared out`,
    ).toBe(present.length - excluded.size);

    // ---- THE SHARED SHAPE, read once from the file identity.spec.ts reads.
    const pill = rulesOf(code(APP_CSS)).find(
      (rule) => rule.selector === ".pill",
    );
    expect(
      pill,
      "src/app.css no longer declares .pill - 10-UI-SPEC 19.1b's shape is ONE rule applied by class, and eleven controls in nine files each authoring the same three declarations is what it replaced",
    ).toBeDefined();
    const shared = new Map(declarationsOf(pill?.body ?? ""));
    for (const [property, value] of [
      ["border", "1px solid var(--color-boundary)"],
      ["background", "transparent"],
      ["padding-inline", "24px"],
      ["min-block-size", "44px"],
      ["min-inline-size", "44px"],
    ] as const) {
      expect(
        shared.get(property),
        `src/app.css's .pill declares ${property} as ${JSON.stringify(shared.get(property))} rather than ${value}. 19.1b as amended by 13-03 under D-10: the shape is a rectangle with no radius (the 999px went on 2026-09-11 and radius.spec.ts holds the file at zero), a 1px boundary-token border, a transparent fill, 24px of inline padding and the 44px floor on both axes.`,
      ).toBe(value);
    }

    // ---- THE DERIVED WALK. Every element in every walked component that wears
    // the pill, found by reading the directory rather than by iterating a list.
    const worn: string[] = [];
    const flat: string[] = [];
    const shallow: string[] = [];
    const flattened: string[] = [];
    const quiet = new Map(
      QUIET.map(([name, cls, what]) => [`${name} -> ${cls}`, what]),
    );
    let elements = 0;
    for (const name of walked) {
      const file = `${UI_DIR}/${name}`;
      const source = code(file);
      const rules = rulesOf(styleOf(file, source));
      for (const tag of openingTags(templateOf(source))) {
        const classes = classesOf(tag);
        elements += 1;
        if (!classes.includes("pill")) continue;
        const own = staticClassesOf(tag).filter((cls) => cls !== "pill");
        worn.push(`${name} -> ${own.join(".")}`);
        for (const cls of own) {
          const what = quiet.get(`${name} -> ${cls}`);
          if (what !== undefined)
            flattened.push(`${name} -> .${cls} (${what})`);
        }

        // EFFECTIVE, not declared: the shared rule first, then this
        // component's own base rules, which outrank it on specificity because
        // Svelte scopes them with a second class.
        const effective = new Map(shared);
        for (const cls of own) {
          for (const [property, value] of declarationsOf(
            baseRule(rules, cls)?.body ?? "",
          )) {
            effective.set(property, value);
          }
        }
        for (const axis of ["min-block-size", "min-inline-size"]) {
          if (effective.get(axis) !== "44px")
            flat.push(
              `${name} -> .${own.join(".")} -> ${axis} is ${effective.get(axis)}`,
            );
        }
        const padding = Number.parseInt(
          effective.get("padding-inline") ?? "0",
          10,
        );
        if (!(padding >= 24))
          shallow.push(
            `${name} -> .${own.join(".")} -> padding-inline is ${effective.get("padding-inline")}`,
          );
      }
    }

    expect(
      elements,
      `the walk read ${elements} opening tags across ${walked.length} components`,
    ).toBeGreaterThan(100);
    expect(
      worn.length,
      "the derived walk found no pilled element at all - it has stopped looking, and every assertion below it is vacuous",
    ).toBeGreaterThanOrEqual(PILLED.length);

    // ---- THE TIER VIOLATION IS ASSERTED FIRST, BEFORE ANY MEASUREMENT, AND
    // THE ORDER IS THE POINT. A Quiet control that gains the pill also gains
    // 24px of inline padding it never declared, so a measurement check placed
    // above this one would go red first and would report a padding defect - a
    // true sentence about the wrong thing. 10-10's negative check 5 taught the
    // rule: a red run has to name the RULE, not the symptom.
    expect(
      flattened,
      "a QUIET control wears the pill (10-UI-SPEC 10.3, A-41, A-46). It would gain a border and flatten into Secondary, which is the SAFE-02 regression the ladder exists to prevent - and after A-46 retired the Bare tier the rule protects CLEAR as well as KEEP ON DEVICE, so it flattens two controls rather than one. A-47 counts three channels between CLEAR and KEEP ON DEVICE - the words, the enablement set, and the ceremony inverted - and NONE of them is the shape: at rest the two already look the same, and a pill on one of them would make that the only difference and it would be the wrong one. Where D-15's universal pill and this ladder collide, the ladder wins, because SAFE-02 is a requirement and a control shape is a style.",
    ).toEqual([]);

    expect(
      flat,
      "a pilled control does not RESOLVE min-block-size: 44px and min-inline-size: 44px. Phase 4's touch floor is both axes per control; the shared rule declares them and a component's own base rule can only ever lower them.",
    ).toEqual([]);
    expect(
      shallow,
      "a pilled control resolves less than 24px of inline padding. The 24px was chosen to clear the 22px cap of a radius 13-03 removed under D-10; it stays because every control wearing the class was measured against it (19.1b as amended).",
    ).toEqual([]);

    // ---- The hand list is checked AGAINST the derived walk in BOTH
    // directions, and it is never iterated by it. 10-13 proved by experiment
    // that a hand list a walk iterates IS the walk's scope: removing a name
    // turned only the length assertion red while the walk went green having
    // read nothing.
    expect(
      new Set(worn).size,
      "two elements in one component wear the pill under the same class - the walk cannot then tell them apart",
    ).toBe(worn.length);
    expect(
      [...worn].sort(),
      "the pilled controls found by reading the directory are not the ones 19.1b declares. A control that gained the shape without being declared, or lost it without being removed, is the same defect in two directions.",
    ).toEqual(
      PILLED.map(([file, cls]) => `${file} -> ${cls}`)
        .slice()
        .sort(),
    );

    // ---- QUIET IS UNTOUCHED, and A-46 makes the claim bigger rather than
    // smaller: the Bare tier is retired, CLEAR sits in Quiet, and the no-pill
    // rule now protects six controls instead of one.
    for (const [name, cls, what] of QUIET) {
      const file = `${UI_DIR}/${name}`;
      const source = code(file);
      const rule = baseRule(rulesOf(styleOf(file, source)), cls);
      expect(
        rule,
        `${name} no longer has a .${cls} rule - ${what} was renamed, and this scan has stopped covering it`,
      ).toBeDefined();
      const own = new Map(declarationsOf(rule?.body ?? ""));
      expect(
        own.get("border"),
        `${what} (${name} -> .${cls}) does not declare "border: 0". The Quiet tier is borderless and shapeless (10-UI-SPEC 10.3), and a border here would flatten it into Secondary - which is the SAFE-02 regression the ladder exists to prevent.`,
      ).toBe("0");
      expect(
        own.get("background"),
        `${what} (${name} -> .${cls}) does not declare "background: transparent". Quiet has no fill: the accent fill is Primary's and there is one Primary control per panel.`,
      ).toBe("transparent");
      void what;
    }

    const [straddler, member, whyStraddles] = STRADDLES;
    const straddleSource = code(`${UI_DIR}/${straddler}`);
    expect(
      instrumentFiles().includes(straddler),
      `${straddler} is not in the derived walk, and it must be: it renders pilled chips on /browse/`,
    ).toBe(true);
    for (const tag of openingTags(templateOf(straddleSource))) {
      const classes = classesOf(tag);
      if (!classes.includes(member)) continue;
      expect(
        classes.includes("pill"),
        `${straddler}'s .${member} wears the pill, and it may not: ${whyStraddles}. This is the sharpest demonstration on the site that the register line is a CLASS rather than a file list - one component, two registers.`,
      ).toBe(false);
    }
  });

  it("scan 5: the index form is furniture beside untouched strings, mono is a list of seven, and no row gained a rule", () => {
    const facet = code("src/lib/ui/FacetRow.svelte");
    const facetTemplate = templateOf(facet);
    const facetRules = rulesOf(styleOf("src/lib/ui/FacetRow.svelte", facet));

    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      facetRules.length,
      `FacetRow.svelte parsed into ${facetRules.length} rules`,
    ).toBeGreaterThan(4);
    for (const cls of ["index", "dash", "caption"]) {
      expect(
        facetRules.some((rule) => rule.selector === `.${cls}`),
        `FacetRow.svelte has no .${cls} rule - the index form was renamed away and this scan is checking nothing`,
      ).toBe(true);
    }

    // ---- THE INDEX AND THE DASH ARE SIBLINGS, NEVER INSIDE THE STRING.
    // `01 - FOR` written as one literal is a copy RETIREMENT, and 3.1's audit
    // is closed at ten by A-30's rule: furniture beside a pinned string costs
    // no amendment, a rewritten literal costs a named one with its spec
    // rewritten. That is the whole reason A-42 exists.
    const EM_DASH = String.fromCharCode(8212);

    // THE CAPTION LITERALS ARE READ AT THEIR SOURCE, WHICH IS NOT THIS
    // COMPONENT. FacetRow.svelte renders {caption}; the strings themselves are
    // src/lib/browse/facets.ts's, one declaration shared with the front door's
    // row, and that is where `01 - FOR` as one literal would be written. A scan
    // that only read the markup would find an expression and report nothing.
    const captions = [
      ...code("src/lib/browse/facets.ts").matchAll(/caption:\s*"([^"]*)"/g),
    ].map((match) => match[1]);
    expect(
      captions,
      "no facet caption literal could be read out of src/lib/browse/facets.ts - the declaration moved, and the assertions below would pass on an empty list",
    ).toHaveLength(2);
    for (const caption of captions) {
      for (const [what, needle] of [
        ["a digit", /[0-9]/],
        ["a U+2014 EM DASH", /—/],
        ["a U+002D HYPHEN-MINUS", /-/],
      ] as const) {
        expect(
          needle.test(caption),
          `the facet caption ${JSON.stringify(caption)} carries ${what}. 19.1f's form is THREE ELEMENTS - a two-digit index, a real em dash in its own element, and THE CAPTION BYTE FOR BYTE UNCHANGED. Folding the index into the string is a copy RETIREMENT: 3.1's audit is closed at ten by A-30's rule, so a rewritten literal costs a named amendment with its spec rewritten, where furniture beside a pinned string costs nothing. That is the whole reason A-42 exists. It would also put the furniture inside the group's accessible name, so a screen reader would read the register mark before the facet.`,
        ).toBe(false);
      }
    }

    const captionText = textBetween(facetTemplate, '<span class="caption"');
    expect(
      captionText,
      "FacetRow.svelte's caption element could not be read - the markup moved and the assertions below prove nothing",
    ).not.toBe("");
    for (const [what, needle] of [
      ["a digit", /[0-9]/],
      ["a U+2014 EM DASH", /—/],
      ["a U+002D HYPHEN-MINUS", /-/],
    ] as const) {
      expect(
        needle.test(captionText),
        `the caption element carries ${what}. 19.1f's form is THREE ELEMENTS - a two-digit index, a real em dash in its own element, and the caption byte-unchanged. Folding any of them into the string retires a pinned literal, and it also puts them inside the group's accessible name, so a screen reader would say the furniture before the facet.`,
      ).toBe(false);
    }
    expect(
      facetTemplate.includes(`>${EM_DASH}<`),
      "the em dash is not a real U+2014 alone in its own element - a hyphen standing in for a dash is 13.0's own prohibition, and a dash inside another element is not a sibling",
    ).toBe(true);

    // The index is TWO DIGITS and it is formatted where it is known, not here.
    expect(
      facet.includes("index?: string"),
      "FacetRow.svelte's index is not an already-formatted string - a number prop would put the padding in this component, where the ordinal is not known",
    ).toBe(true);
    const toolbar = code("src/lib/ui/BrowseToolbar.svelte");
    const indexed = /index=[{]String\(at [+] 1\)[.]padStart\(2, "0"\)[}]/.test(
      toolbar,
    );
    expect(
      indexed,
      "BrowseToolbar.svelte no longer hands its facet rows a two-digit index derived from their position",
    ).toBe(true);
    for (const value of ["01", "02"]) {
      expect(
        value,
        `the index ${value} is not two digits - 19.1f's form is a TWO-DIGIT index`,
      ).toMatch(/^[0-9]{2}$/);
    }

    // ---- ON /browse/'s TWO FACET ROWS AND ON NOTHING ELSE (A-42).
    // The front door mounts the same component in link mode with NO index, and
    // no device component renders the form at all: 10.2 and A-23 forbid step
    // numerals in the device flow, and on the chosen panel the regions ARE the
    // sequence, so an index there would read as the instruction A-23 rules out.
    const frontDoor = code(FRONT_DOOR);
    expect(
      frontDoor.includes("<FacetRow"),
      "FrontDoor.svelte no longer mounts a FacetRow, so the half of A-42 that says the form is on /browse/ and nowhere else has nothing to discriminate against",
    ).toBe(true);
    expect(
      /index=/.test(frontDoor),
      "FrontDoor.svelte hands its FOR row an index. A-42 puts the form on /browse/'s two facet rows and on nothing else, and the front door's row is a set of destinations on a ceremonial page rather than a filter on a working one.",
    ).toBe(false);
    const numbered: string[] = [];
    for (const name of [
      "Clear.svelte",
      "KeepOnDevice.svelte",
      "PutBack.svelte",
      "KeepConfirm.svelte",
      "TryOnDevice.svelte",
      "ChosenPanel.svelte",
      "DeviceSlot.svelte",
      "DeviceNote.svelte",
    ]) {
      const source = code(`${UI_DIR}/${name}`);
      if (/<span class="index"/.test(source) || /class="dash"/.test(source))
        numbered.push(name);
    }
    expect(
      numbered,
      "a device component renders the index form. 10.2 and A-23 forbid step numerals in the device flow: on the chosen panel the regions ARE the device sequence, so numbering them would read as an instruction rather than as a register mark.",
    ).toEqual([]);

    // ---- --font-mono IS A LIST OF SEVEN, AND THE LIST IS THE ASSERTION.
    const carriers: string[] = [];
    let declarations = 0;
    for (const name of uiComponents()) {
      const source = code(`${UI_DIR}/${name}`);
      const uses = rulesOf(styleOf(`${UI_DIR}/${name}`, source)).filter(
        (rule) => rule.body.includes("var(--font-mono)"),
      );
      declarations += uses.length;
      if (uses.length > 0) carriers.push(name);
    }
    expect(
      declarations,
      `${declarations} rules across src/lib/ui/ declare var(--font-mono) and A-44 settles the count at ${MONO_COUNT}. 5.2's "six, and the list is asserted" was written before 10-10 spent the sixth on the picker's RGB triple; 19.1c then called the metadata block the sixth as well, which double-counted it. Seven is the number and the LIST below is what holds it - a seventh use somewhere else keeps the count right and is still a defect.`,
    ).toBe(MONO_COUNT);
    expect(
      carriers.sort(),
      "a component declares --font-mono and is not on 19.1c's list, or has fallen off it. Y-18: only the firmware and the page numerals are monospaced, and prose never is.",
    ).toEqual(
      MONO_USES.map(([file]) => file)
        .slice()
        .sort(),
    );

    // The seventh's own rule, by the properties 19.1c specifies.
    const card = code("src/lib/ui/CatalogCard.svelte");
    const meta = rulesOf(styleOf("src/lib/ui/CatalogCard.svelte", card)).find(
      (rule) => rule.selector === ".meta",
    );
    expect(
      meta,
      "CatalogCard.svelte no longer has a .meta rule - 19.1c's metadata block was renamed and the seventh mono use is somewhere this scan is not looking",
    ).toBeDefined();
    const metaDeclared = new Map(declarationsOf(meta?.body ?? ""));
    for (const [property, value] of [
      ["font-family", "var(--font-mono)"],
      ["font-variant-numeric", "tabular-nums"],
      ["color", "var(--color-ink-quiet)"],
    ] as const) {
      expect(
        metaDeclared.get(property),
        `the metadata block declares ${property} as ${JSON.stringify(metaDeclared.get(property))} rather than ${value} (19.1c)`,
      ).toBe(value);
    }
    // U+002B WITH ONE SPACE EITHER SIDE, and the spaces are the gap rather than
    // characters in a string - a separator element with a flex gap either side.
    expect(
      /<span class="plus">[+]<\/span>/.test(templateOf(card)),
      "the metadata separator is not a bare U+002B in its own element (19.1c). Inside a field it would be part of the text; as a sibling with a gap either side it is the one space the amendment asks for, on both sides, at every wrap.",
    ).toBe(true);
    expect(
      metaDeclared.get("gap"),
      "the metadata block's gap is not 0 8px, so the plus does not carry one space either side (19.1c)",
    ).toBe("0 8px");

    // ---- 19.1d: NO DIVIDER, NO BORDER, NO ZEBRA, NO NEW --color-boundary USE was
    // added to make a row read. Column alignment carries it.
    for (const rule of [
      meta,
      ...rulesOf(styleOf("src/lib/ui/CatalogCard.svelte", card)).filter(
        (r) => r.selector === ".plus" || r.selector === ".field",
      ),
    ]) {
      for (const [property] of declarationsOf(rule?.body ?? "")) {
        expect(
          property.startsWith("border"),
          `the metadata block declares "${property}". 19.1d: column alignment carries the row, and no divider, border, zebra or new --color-boundary use is added to make one read. The two hairlines in region 6 stay because they were already structural and A-23 depends on the second one; this block adds none.`,
        ).toBe(false);
      }
    }

    // ---- THE CARD GRID IS NOT REPLACED, AND THE REFUSAL IS ASSERTED.
    // Reference C's dense tabular listing is a layout this plan explicitly does
    // not adopt: the grid is what carries thirty-six live pad canvases, and the
    // pads are the product.
    const gridRules = rulesOf(
      styleOf(
        "src/lib/ui/BrowseGrid.svelte",
        code("src/lib/ui/BrowseGrid.svelte"),
      ),
    );
    expect(
      gridRules.some((rule) => rule.body.includes("grid-template-columns")),
      "BrowseGrid.svelte no longer lays its cards out on a grid. 19.1d: where reference C's dense tabular listing collides with the shipped grid, THE GRID WINS - it is what carries thirty-six live pad canvases, and the pads are the product. Tabular alignment applies INSIDE a card's metadata block, never as a replacement for the wall.",
    ).toBe(true);
  });

  it("scan 6: the ground is solid - html and body paint the workspace token, nothing is painted over them, and the retired texture vocabulary names no rule and no component", () => {
    const appCss = code(APP_CSS);
    const rules = rulesOf(appCss);

    // ---- NON-VACUITY, BEFORE ANY CLAIM. The ground rules have to exist for a
    // rule about what covers them to mean anything at all.
    const html = rules.filter((rule) => rule.selector === "html");
    const body = rules.filter((rule) => rule.selector === "body");
    expect(
      html.map((rule) => rule.selector),
      "src/app.css declares no html rule - the ground this scan is about is not declared, and everything below it would be checking nothing",
    ).not.toEqual([]);
    expect(
      body.map((rule) => rule.selector),
      "src/app.css declares no body rule - the ground this scan is about is not declared, and everything below it would be checking nothing",
    ).not.toEqual([]);

    // ---- THE GROUND IS THE WORKSPACE TOKEN, ON BOTH ROOTS, AND IT IS THE
    // TOKEN RATHER THAN A COLOUR: identity.spec.ts reads this file for colours,
    // and a literal here would be a hue that gate cannot see.
    for (const [name, group] of [
      ["html", html],
      ["body", body],
    ] as const) {
      const declared = new Map(
        group.flatMap((rule) => declarationsOf(rule.body)),
      );
      expect(
        declared.get("background"),
        `${name} paints ${JSON.stringify(declared.get("background"))} rather than var(--color-workspace). §3: solid surfaces inside the working application - the ground is the workspace token and nothing else (13-04, D-09)`,
      ).toBe("var(--color-workspace)");
    }

    // ---- NOTHING IS PAINTED OVER THE GROUND. The halftone lived on
    // body::before; a background-image on either root or on a pseudo-element
    // of either is a texture by another name.
    for (const rule of rules) {
      if (!/^(html|body)(::?[a-z-]+)?$/.test(rule.selector)) continue;
      expect(
        declarationsOf(rule.body).some(
          ([property]) => property === "background-image",
        ),
        `src/app.css declares a background-image on "${rule.selector}". The ground is solid (§3, D-09): a texture on a root or on its pseudo-element is the halftone coming back under another name`,
      ).toBe(false);
    }

    // ---- THE RETIRED VOCABULARY NAMES NO RULE AND NO COMPONENT. 13-04
    // deleted the CRT (--crt, data-screen, crt-band, crt-roll, crt-tear), the
    // halftone (body::before) and the lattice (.lattice) on 2026-09-11. The
    // deletion removed aesthetic.spec.ts's own gate over that vocabulary, so
    // this is where its absence is held on every run rather than once, by
    // grep, in a SUMMARY. Comments are stripped first: a file may still SAY
    // what went, it may not DECLARE it.
    const RETIRED: ReadonlyArray<readonly [string, string]> = [
      ["body::before", "Layer G, the halftone and vignette on the page ground"],
      [
        ".lattice",
        "the registration lattice, its ::before and its ground rule",
      ],
      ["--crt", "the CRT's gate property and its two colours"],
      ["crt-band", "the CRT shell inside the front door"],
      ["crt-roll", "Layer R, the roll bar"],
      ["crt-tear", "Layer T's keyframes"],
    ];
    for (const rule of rules) {
      for (const [token, what] of RETIRED) {
        expect(
          rule.selector.includes(token) || rule.body.includes(token),
          `src/app.css declares "${rule.selector}", which names "${token}" - ${what}. D-09 removed it on 2026-09-11 and §3 asks for solid surfaces; it does not come back under this or any other name`,
        ).toBe(false);
      }
    }
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(REPO_ROOT + dir, {
        withFileTypes: true,
      })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(path, out);
        else if (
          /[.](?:svelte|css)$/.test(entry.name) &&
          !/[.](?:spec|test)[.]/.test(entry.name)
        )
          out.push(path);
      }
      return out;
    };
    const files = walk("src");
    expect(
      files.length,
      `the walk over src/ found ${files.length} stylesheets and components`,
    ).toBeGreaterThan(30);
    const carriers: string[] = [];
    for (const file of files) {
      const source = code(file);
      for (const [token] of RETIRED) {
        if (source.includes(token)) carriers.push(`${file} -> ${token}`);
      }
    }
    expect(
      carriers,
      "a stylesheet or a component names the retired texture vocabulary outside a comment. The CRT, the halftone and the lattice were deleted by 13-04 under D-09; a class, a selector or an attribute from that treatment is the texture coming back, and the file above is where",
    ).toEqual([]);
  });
});

/** The text of the element whose opening tag starts with this needle. */
function textBetween(template: string, needle: string): string {
  const at = template.indexOf(needle);
  if (at < 0) return "";
  const open = template.indexOf(">", at);
  const close = template.indexOf("</", open);
  if (open < 0 || close < 0) return "";
  return template.slice(open + 1, close);
}
