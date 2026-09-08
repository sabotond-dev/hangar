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
 *   3. src/lib/ui/aesthetic.spec.ts:239's CRT_FILES - four names, and this one
 *      is CORRECT for its purpose, because that file's claim is "only these
 *      four" and an allowlist is exactly the right shape for it.
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
 * every moving or texturing CRT layer is SCOPED to .front-door, and no
 * instrument rule is AUTHORED inside FrontDoor.svelte or under a .front-door
 * selector. Svelte scopes a component's styles to that component, so
 * TryOnDevice.svelte's pill is authored outside the front door's stylesheet
 * even though its button paints inside the front door's box. The line then
 * lives in exactly one place, cannot be moved in one file and not the other,
 * and says something a scan can check - which is what scan 7 of the other file
 * exists to teach.
 *
 * LAYER G IS THE ONE DECLARED EXCEPTION AND D-16 GETS THAT HALF WRONG. D-16
 * reads "the ground and the roll bar are already the hero shell's". The roll
 * bar is: Layers R and T live in .crt-band inside FrontDoor.svelte and /browse/
 * has no .crt-band at all. The ground is NOT: Layer G is body::before in
 * src/app.css, on every route, and 10-04 measured /browse/ explicitly as "Layer
 * G alone". It stays on every route and is reclassified rather than scoped off -
 * a halftone whose density describes a page is D-15 reference B's own device
 * rather than a screen effect, and it is the only one of the four layers that
 * neither moves nor scans. The exception is asserted BY NAME below, with its
 * reason in the message, so it is a ruling rather than an oversight.
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
const AESTHETIC_SPEC = "src/lib/ui/aesthetic.spec.ts";
const FRONT_DOOR = "src/lib/ui/FrontDoor.svelte";
const PAD_FRAME = "src/lib/ui/PadFrame.svelte";

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

// ---------------------------------------------------------------------------
// THE REGISTER LINE, READ OUT OF THE OTHER FILE AS TEXT.
//
// CRT_FILES is aesthetic.spec.ts's and it is read from there rather than
// restated here, in the idiom 10-UI-SPEC 8.7 scan 7 already uses on
// Coverflow.svelte's five literals. Two copies of an allowlist is two things
// that can be edited apart, and the whole value of a line drawn in one place is
// that it cannot be moved in one file and not the other.

/** The array literal's members, as the identifiers the other file writes. */
function crtFileIdentifiers(source: string): string[] {
  const block = /const CRT_FILES:[^=]*=\s*[[]([^\]]*)[\]]/.exec(source)?.[1];
  if (block === undefined) return [];
  return block
    .split(",")
    .map((one) => one.trim())
    .filter((one) => one !== "");
}

/** `const NAME = "path";` in the other file, resolved to the path. */
function constantsOf(source: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const match of source.matchAll(
    /const ([A-Z][A-Z0-9_]*)\s*=\s*"([^"]+)"/g,
  )) {
    out.set(match[1], match[2]);
  }
  return out;
}

/**
 * The instrument register's vocabulary: the class names this register's rules
 * are applied by. Each is asserted FOUND before it is asserted CONFINED, so a
 * renamed shape cannot make the confinement pass on an empty search.
 *
 * `lattice` joins in plan 10-13.1 task 2, with the rule it names.
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
    "it is the file whose root class .front-door IS the register line, and Layers R and T are its own",
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
 * The one component that renders on EVERY route including the front door and is
 * exempt anyway, declared rather than omitted.
 *
 * ScreenToggle.svelte is the control that names the CRT vocabulary - it is on
 * aesthetic.spec.ts's CRT_FILES for exactly that reason - and it renders in the
 * footer of every route. A pill on it would put an instrument shape on a
 * front-door surface, on the one control whose subject is the front door's own
 * register. It carries a word row that would otherwise take the shape, so this
 * is a real exemption rather than a vacuous one.
 */
const EXEMPT: ReadonlyArray<readonly [string, string]> = [
  [
    "ScreenToggle.svelte",
    "it NAMES the CRT vocabulary and renders in the footer of every route including the front door, so an instrument shape on it would put the instrument register on a front-door surface - and it has a word row, so the exemption is doing work",
  ],
];

const excluded = new Set([
  ...FRONT_DOOR_ONLY.map(([name]) => name),
  ...EXEMPT.map(([name]) => name),
]);

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
  it("scan 1: the register line holds from both sides, with Layer G as the one declared exception", () => {
    const aesthetic = read(AESTHETIC_SPEC);
    const identifiers = crtFileIdentifiers(aesthetic);
    const constants = constantsOf(aesthetic);
    const crtFiles = identifiers.map(
      (name) => constants.get(name) ?? `UNRESOLVED:${name}`,
    );

    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      identifiers,
      "CRT_FILES could not be read out of aesthetic.spec.ts as text - the register line has to live in ONE place, and a second copy of the allowlist here would be a second thing to edit",
    ).not.toEqual([]);
    expect(
      crtFiles.filter((file) => file.startsWith("UNRESOLVED:")),
      "a CRT_FILES member does not resolve to a path constant in aesthetic.spec.ts",
    ).toEqual([]);
    expect(
      crtFiles,
      "the CRT allowlist is the four files 10-UI-SPEC 8.3 names",
    ).toEqual([
      APP_CSS,
      PAD_FRAME,
      FRONT_DOOR,
      "src/lib/ui/ScreenToggle.svelte",
    ]);

    // ---- SIDE A: every MOVING or TEXTURING CRT layer resolves under
    // .front-door. Layer S by selector, Layers R and T by the file they are
    // authored in, whose root class IS the line.
    const padFrame = code(PAD_FRAME);
    const layerS = rulesOf(styleOf(PAD_FRAME, padFrame)).filter((rule) =>
      rule.selector.includes(".pad::after"),
    );
    expect(
      layerS.map((rule) => rule.selector),
      "PadFrame.svelte declares no .pad::after rule at all - Layer S was renamed and this scan is checking nothing",
    ).not.toEqual([]);
    for (const rule of layerS) {
      expect(
        rule.selector.includes("front-door"),
        `Layer S is declared on "${rule.selector}", which does not name .front-door. PadFrame.svelte renders on / AND on /browse/, and /browse/ mounts up to thirty-six of them; wave 4 measured the unscoped version at 61 ms p95 on webkit-phone against a 2 ms threshold and scoped it for that reason, and D-16 then gave the same selector a second, independent reason. Two reasons hold one line, so a faster engine cannot argue it back.`,
      ).toBe(true);
    }

    const frontDoor = code(FRONT_DOOR);
    expect(
      openingTags(templateOf(frontDoor)).some((tag) =>
        classesOf(tag).includes("front-door"),
      ),
      "FrontDoor.svelte no longer applies the class .front-door to anything - the register line is drawn at that class, and Layer S's own selector depends on it",
    ).toBe(true);
    for (const compound of [".crt-band", ".crt-roll"]) {
      expect(
        frontDoor.includes(compound),
        `${compound} is no longer declared in FrontDoor.svelte - Layers R and T are the roll bar and the tear, and they live inside the file whose root is the register line`,
      ).toBe(true);
    }

    // ---- LAYER G, THE ONE DECLARED EXCEPTION, ASSERTED BY NAME AND WITH ITS
    // REASON IN THE MESSAGE rather than in a comment somebody may not read.
    const appCss = code(APP_CSS);
    const layerG = rulesOf(appCss).filter(
      (rule) => rule.selector === "body::before",
    );
    expect(
      layerG.map((rule) => rule.selector),
      "src/app.css no longer declares body::before - Layer G is the page ground and the exception below is about a rule that has to exist",
    ).not.toEqual([]);
    expect(
      layerG.every((rule) => !rule.selector.includes("front-door")),
      "Layer G has been scoped to .front-door. IT IS THE ONE DECLARED EXCEPTION AND IT STAYS ON EVERY ROUTE (10-UI-SPEC 19.1g). D-16 says the ground is already the hero shell's and D-16 IS WRONG about that half: Layer G is body::before in src/app.css, on every route, and 10-04 measured /browse/ explicitly as Layer G alone. It is reclassified rather than scoped off, because a halftone whose density describes a page is D-15 reference B's own image-making device rather than a screen effect, and it is the only one of the four layers that neither moves nor scans.",
    ).toBe(true);

    // ---- SIDE B: no instrument rule is AUTHORED inside FrontDoor.svelte or
    // under a .front-door selector, anywhere in src/.
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
      const carriers = files.filter((file) =>
        rulesOf(styleOf(file, code(file))).some(
          (rule) => rule.selector === `.${word}`,
        ),
      );
      expect(
        carriers,
        `no file in src/ declares a .${word} rule. It is ${what}, and a vocabulary word that is not in the tree leaves the confinement below checking nothing`,
      ).toEqual([APP_CSS]);
    }

    // (a) FrontDoor.svelte authors none of it, and names none of it.
    for (const [word] of INSTRUMENT_VOCABULARY) {
      expect(
        frontDoor.includes(word),
        `FrontDoor.svelte names "${word}". The instrument register's rules are authored OUTSIDE the front door's own file: the front door keeps Layers G, S, R and T exactly as wave 4 built them, the SCREEN toggle and all three switches (D-16, A-37), and an instrument shape declared here would move the line in one file and not in the other.`,
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
      "an instrument rule is scoped under .front-door. The register line is a CLASS and it is drawn once: the front door keeps its screen character, and the instrument register is authored outside it (D-16, A-37, 10-UI-SPEC 19.1g).",
    ).toEqual([]);
  });

  it("scan 2: the pill is Primary's radius and Secondary's outline, it reaches no Quiet control, and every pill resolves both 44px axes", () => {
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
      "a declared front-door-only or exempt component is not on disk - it was renamed, and this walk has silently widened",
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
      ["border-radius", "999px"],
      ["border", "1px solid var(--color-line)"],
      ["background", "transparent"],
      ["padding-inline", "24px"],
      ["min-block-size", "44px"],
      ["min-inline-size", "44px"],
    ] as const) {
      expect(
        shared.get(property),
        `src/app.css's .pill declares ${property} as ${JSON.stringify(shared.get(property))} rather than ${value}. 19.1b: a degenerate 999px radius resolves to half the block size and cannot drift; at the 44px floor that is a 22px cap per end, so 24px of inline padding clears the curve by 2px and a one-character label still sits on the flat.`,
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
      "a pilled control resolves less than 24px of inline padding. At the 44px block floor a 999px radius is a 22px cap at each end, so anything under 24px puts the first glyph ON the curve (19.1b).",
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

    // ---- THE TWO EXEMPTIONS, ASSERTED BY NAME RATHER THAN LEFT AS OMISSIONS.
    for (const [name, why] of EXEMPT) {
      expect(
        excluded.has(name),
        `${name} is no longer declared exempt, and the reason it was is: ${why}`,
      ).toBe(true);
      const source = code(`${UI_DIR}/${name}`);
      expect(
        openingTags(templateOf(source)).some((tag) =>
          classesOf(tag).includes("pill"),
        ),
        `${name} wears the pill, and it is exempt: ${why}`,
      ).toBe(false);
      // The exemption is doing work rather than being free: this component
      // really does render the word row the shape would otherwise reach.
      expect(
        source.includes('class="option"'),
        `${name}'s word row is gone, so its exemption no longer excuses anything and should be retired rather than kept`,
      ).toBe(true);
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
});
