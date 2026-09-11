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
 * `lattice` joined in plan 10-13.1 task 2, in the same commit as the rule it
 * names - never afterwards, because a gate that arrives after the thing it
 * gates has already shipped is a comment (10-VALIDATION V-01).
 */
const INSTRUMENT_VOCABULARY: ReadonlyArray<readonly [string, string]> = [
  ["pill", "10-UI-SPEC 19.1b's control shape, one rule in src/app.css"],
  [
    "lattice",
    "10-UI-SPEC 19.1a's registration field, one rule in src/app.css, on exactly two surface roots",
  ],
];

/**
 * The lattice's two roots, and there are two rather than six because the panel
 * root covers the panels, the tuning region and the whole device flow at once.
 */
const LATTICE_ROOTS: ReadonlyArray<readonly [string, string]> = [
  ["src/routes/browse/+page.svelte", "browse"],
  ["src/lib/ui/ChosenPanel.svelte", "panel"],
];

/**
 * THE GROUND RULE'S THREE DECLARED EXCEPTIONS, AND THERE IS NO FOURTH.
 *
 * A-55 makes the lattice a ground: `.lattice > :where(*)` in src/app.css gives
 * every direct child of a root the ground colour, so the field paints in the
 * margins, the gaps and the gutters rather than under the words. A-56 names the
 * surfaces that opt out of it and the surfaces the rule cannot reach, with the
 * reason each one is here rather than as a list somebody maintains by memory.
 *
 * The third was found by a DOM WALK over the built site with a query matching
 * no entry - not by reading a template - and that is why it is written down.
 */
const GROUND_EXCEPTIONS: ReadonlyArray<
  readonly [string, string, string, string]
> = [
  [
    "src/routes/browse/+page.svelte",
    ".grid",
    "transparent",
    "the card wall is where the field earns its keep - it paints in the GUTTERS BETWEEN the cards, which is the 'around the pads' half of A-55. Grounding it would delete the lattice from most of the page, which is 10-13.1's silent no-op at a different address",
  ],
  [
    "src/lib/ui/CatalogCard.svelte",
    ".card",
    "var(--color-workspace)",
    "a card is four levels below a lattice root, so the ground rule cannot reach its description, its name plate or its metadata row. This declaration is the other half of the grid's exception: without it, leaving the grid transparent means the lattice paints over thirty-six descriptions instead of between thirty-six cards",
  ],
  [
    "src/lib/ui/BrowseGrid.svelte",
    ".empty",
    "var(--color-workspace)",
    "the empty state renders INSTEAD OF the card wall inside that same transparent grid, so the one screen where the page has nothing to show would be the one screen where the field lands on three lines of prose with nothing in front of it",
  ],
];

/**
 * HOW MANY HALFTONE PITCHES SHIP, AS A NAMED CONSTANT RATHER THAN A SILENCE.
 *
 * 19.1e proposed a SECOND density at 6px behind the header and footer bands and
 * declared its own fallback in 8.5's shape: measure /browse/ in chromium and
 * webkit-phone, and IF THE DELTA EXCEEDS 2 ms AT THE 95th PERCENTILE THE SECOND
 * DENSITY DOES NOT SHIP.
 *
 * It was measured on 2026-09-09 against a fresh build, wrangler dev serving
 * build/, the candidate layer injected at document-start via addInitScript (not
 * page.addStyleTag, which lands after load and makes the first-paint half
 * vacuous by construction), p95 of requestAnimationFrame deltas across a full
 * scroll down and back on /browse/ at thirty-six entries, median of three runs
 * per arm, with the arm PROVED per run by reading the computed
 * background-size back out of the page:
 *
 *   chromium      two pitches 16.70 / 16.70 / 16.70 -> median 16.70 ms
 *   chromium      one pitch   16.70 / 16.70 / 16.70 -> median 16.70 ms   delta 0.00
 *   webkit-phone  two pitches 94.00 / 97.00 / 94.00 -> median 94.00 ms
 *   webkit-phone  one pitch   81.00 / 83.00 / 82.00 -> median 82.00 ms   delta 12.00
 *
 * TWELVE MILLISECONDS AGAINST A DECLARED THRESHOLD OF TWO. The verdict is OVER
 * and the second density does NOT ship. So this constant is ONE, the halftone
 * stays at the single 3px pitch, and scan 4 asserts that - which makes the
 * fallback a state the tree can be checked against rather than a paragraph
 * nobody wrote. Chromium's 16.70 in every arm reproduces 10-04's own recorded
 * 16.70-16.80 exactly, which is the reason to trust the WebKit half.
 */
const DENSITIES = 1;

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

  it("scan 3: the lattice is monochrome, gradient-built, data-URI-free, on two roots, and nowhere near the 3D context", () => {
    const appCss = code(APP_CSS);
    const rules = rulesOf(appCss);
    const lattice = rules.filter((rule) => rule.selector.includes(".lattice"));

    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      lattice.map((rule) => rule.selector),
      "src/app.css declares no .lattice rule at all - 19.1a's registration field was renamed away and every assertion below it is checking nothing",
    ).not.toEqual([]);
    const painted = lattice.find((rule) =>
      rule.selector.includes(".lattice::before"),
    );
    expect(
      painted,
      "the lattice is not a ::before on the surface root (19.1a). A background on the root itself would sit under the element's own border rather than behind its content, and a real element would be one more node in every panel",
    ).toBeDefined();
    const declared = new Map(declarationsOf(painted?.body ?? ""));
    expect(
      declared.size,
      `the lattice rule carries ${declared.size} declarations`,
    ).toBeGreaterThan(6);

    // ---- NO DATA-URI AND NO SVG, AND THE MESSAGE CARRIES THE MEASUREMENT so
    // the next reader learns WHY rather than only THAT.
    const forbidden = "data:";
    for (const [property, value] of declared) {
      expect(
        value.includes(forbidden) || value.includes("svg"),
        `the lattice declares "${property}" as a data-URI or an SVG. IT MAY NOT, AND THE REASON WAS OBSERVED RATHER THAN ASSUMED: plan 10-04 declared the CRT noise tile in src/app.css and ran identity.spec.ts - SEVEN PASSED - then wrote a pure red into the same tile as a percent-encoded fill and ran it again - SEVEN PASSED AGAIN. That file's hex walk matches a literal number sign and a percent-encoded one is not one, so a colour smuggled into a data-URI in the one file the colour gate reads is invisible to every colour gate this site has. Gradients referencing a token are visible to all of them.`,
      ).toBe(false);
    }

    // ---- MONOCHROME. Every colour is a var(), the accent is absent, and the
    // one hex is the mask's - where a colour is opacity rather than paint.
    expect(
      declared.get("background-image")?.includes("var(--color-action)"),
      "the lattice paints in the accent. 10-UI-SPEC 7.2's reserved list is EIGHT entries and a decorative field is none of them - a ninth use is exactly what --color-divider was declared decorative-only to avoid",
    ).toBe(false);
    for (const token of ["var(--color-divider)", "var(--color-boundary)"]) {
      expect(
        declared.get("background-image"),
        `the lattice no longer paints with ${token} - the field is the soft token at 0.2 and the one distinguished cross is --color-boundary at 0.4, which is A-40's first channel`,
      ).toContain(token);
    }
    expect(
      declared.get("background-image"),
      "the lattice is not built from gradients - 19.1a's composition is two repeating-linear-gradients forming a 1px grid, and a tile would be the data-URI forbidden above",
    ).toContain("repeating-linear-gradient(");
    expect(
      declared.get("mask-image"),
      "the lattice has no mask, so its grid paints as full RULES rather than as a field of plus marks (19.1a). A union of the two band sets would do the same; the pair has to INTERSECT",
    ).toContain("repeating-linear-gradient(");
    expect(
      declared.get("mask-composite"),
      "the mask pair does not INTERSECT. Composited with add they are a union, and a union keeps every rule at full length - which is the picture the lattice is not",
    ).toContain("intersect");

    // A-40's SECOND, NON-COLOUR CHANNEL for the distinguished cross: it appears
    // once. A field that differed only in alpha would be one channel.
    expect(
      declared.get("background-repeat"),
      "the distinguished cross is not no-repeat, so it is a field rather than a mark - A-40 requires TWO channels and the second is that there is exactly one of it, at one declared position",
    ).toContain("no-repeat");

    // ---- NOTHING NEW MOVES. The reduced-motion contract has nothing to turn
    // off here, which is why this wave adds no line to that block.
    for (const property of ["animation", "transition", "transform"]) {
      expect(
        declared.has(property),
        `the lattice declares "${property}". Phase 4 snaps every animation to a static representative frame under prefers-reduced-motion and Playwright asserts exactly two layers stop; a moving lattice would be a third, and this one is static so the existing assertions are re-run UNCHANGED`,
      ).toBe(false);
    }
    expect(
      declared.get("pointer-events"),
      "the lattice does not declare pointer-events: none - it sits over the whole surface, and a decoration that eats a click on a card is a decoration that broke the page",
    ).toBe("none");

    // ---- THE ONE DECLARATION THAT MAKES IT VISIBLE, ASSERTED BY NAME BECAUSE
    // ITS ABSENCE WAS A SILENT NO-OP. The rule shipped once as `position:
    // relative` alone and painted NOTHING, with every source scan green: two
    // screenshots of /browse/, one as authored and one with the pseudo-element
    // display:none, came back BYTE-IDENTICAL. Without a stacking context on the
    // root, a negative-z-index pseudo-element belongs to the ROOT context and
    // paints at Appendix E step 2, while body's own opaque background is an
    // in-flow block background at step 3 - black, straight over the top.
    const root = lattice.find((rule) => rule.selector === ".lattice");
    expect(
      root,
      "src/app.css no longer declares a bare .lattice rule - the surface root has to carry the stacking context, and the pseudo-element alone cannot make one for itself",
    ).toBeDefined();
    const rootDeclared = new Map(declarationsOf(root?.body ?? ""));
    expect(
      rootDeclared.get("position"),
      "the lattice root does not declare position: relative, so its absolutely-positioned ::before resolves against some ancestor instead of against the surface",
    ).toBe("relative");
    expect(
      rootDeclared.get("isolation"),
      "the lattice root does not declare isolation: isolate, AND ITS ABSENCE IS INVISIBLE TO EVERY OTHER ASSERTION IN THIS FILE. Measured on 2026-09-09: with position:relative alone the lattice painted nothing at all and two screenshots of /browse/ - one as authored, one with the pseudo-element hidden - were byte-identical. The stacking context is what puts the -1 child immediately behind this element's own content instead of behind body's opaque background.",
    ).toBe("isolate");

    // ---- EXACTLY TWO ROOTS, and the vocabulary reaches no CRT file.
    const wearing: string[] = [];
    const walkAll = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(REPO_ROOT + dir, {
        withFileTypes: true,
      })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walkAll(path, out);
        else if (entry.name.endsWith(".svelte")) out.push(path);
      }
      return out;
    };
    for (const file of walkAll("src")) {
      for (const tag of openingTags(templateOf(code(file)))) {
        if (classesOf(tag).includes("lattice")) wearing.push(file);
      }
    }
    expect(
      wearing.sort(),
      "the lattice is on a surface other than its two declared roots, or has fallen off one of them. 19.1a: exactly two - /browse/'s page root and ChosenPanel.svelte's root, the second of which covers the panels, the tuning region and the device flow together",
    ).toEqual(
      LATTICE_ROOTS.map(([file]) => file)
        .slice()
        .sort(),
    );

    // ---- 8.2, PROVED BY READING Coverflow.svelte RATHER THAN BY DESCRIBING
    // IT. The panel root is inside .panel, which that file renders as a
    // TOP-LEVEL SIBLING of .band and outside the 3D context .stage
    // establishes - so a mask on a descendant of it flattens nothing. The file
    // is READ here and is never edited: this phase promises it byte-untouched.
    const coverflow = code("src/lib/ui/Coverflow.svelte");
    const panelAt = coverflow.indexOf('<div class="panel">');
    const stageAt = coverflow.indexOf('class="stage');
    expect(
      panelAt,
      "Coverflow.svelte no longer renders a .panel wrapper, so the position this scan depends on cannot be read at all",
    ).toBeGreaterThan(-1);
    expect(
      stageAt,
      "Coverflow.svelte no longer renders a .stage, so the 3D context this scan is measuring the panel against does not exist",
    ).toBeGreaterThan(-1);
    // The wrapper's subtree, counted by div depth: the panel is a sibling of
    // the band if the stage closes before the panel opens.
    const before = coverflow.slice(0, panelAt);
    const opens = before.split("<div").length - 1;
    const closes = before.split("</div>").length - 1;
    expect(
      opens - closes,
      "Coverflow.svelte's .panel wrapper is NESTED inside an open <div> rather than sitting at the top level of the component. 8.2 forbids a grouping property ON .stage or BETWEEN .stage and a .slot, and a mask on a descendant of the 3D context would flatten the coverflow's ladder into a row of equal squares - the lattice's legality here rests entirely on this position",
    ).toBe(0);
    expect(
      before.includes('class="stage'),
      "the .stage does not appear before the .panel wrapper in Coverflow.svelte - the two may have been reordered, and the sibling claim above no longer says what it used to",
    ).toBe(true);
  });

  it("scan 4: the halftone declares exactly the pitches the measurement licensed, in one file", () => {
    const appCss = code(APP_CSS);
    const layerG = rulesOf(appCss).find(
      (rule) => rule.selector === "body::before",
    );
    expect(
      layerG,
      "src/app.css no longer declares body::before - Layer G is the halftone, and its pitch count is what this scan is about",
    ).toBeDefined();
    const declared = new Map(declarationsOf(layerG?.body ?? ""));

    // The pitches are the SQUARE background-size entries: a halftone dot cell.
    // The vignette's own `100% 100%` is not a pitch and is excluded by shape
    // rather than by position, so re-ordering the list cannot change the count.
    const sizes = (declared.get("background-size") ?? "")
      .split(",")
      .map((one) => one.trim());
    const pitches = sizes.filter((one) => /^([0-9]+)px \1px$/.test(one));
    expect(
      sizes.length,
      `Layer G declares ${sizes.length} background-size entries`,
    ).toBeGreaterThan(1);
    expect(
      pitches,
      `the halftone declares ${pitches.length} pitches and the measurement licensed ${DENSITIES}. 19.1e proposed a SECOND density at 6px and declared its own fallback in 8.5's shape - over 2 ms at p95 and it does not ship. It was measured on 2026-09-09: chromium 16.70 ms in BOTH arms, delta 0.00; webkit-phone 94.00 ms with two pitches against 82.00 ms with one, delta 12.00 ms - six times the threshold. The verdict was OVER, so the halftone stays at ONE pitch and this number is the state that says so rather than a silence where a decision should be.`,
    ).toHaveLength(DENSITIES);

    // AND IT IS DECLARED IN THIS FILE AND NOWHERE ELSE (7.1's placement rule).
    // A pitch authored inside a component's <style> would carry a colour the
    // colour gate cannot see, which is the hole scan 1 of the other file exists
    // to close.
    const elsewhere: string[] = [];
    const walkAll = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(REPO_ROOT + dir, {
        withFileTypes: true,
      })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walkAll(path, out);
        else if (
          /[.](?:svelte|css)$/.test(entry.name) &&
          !/[.](?:spec|test)[.]/.test(entry.name)
        )
          out.push(path);
      }
      return out;
    };
    for (const file of walkAll("src")) {
      if (file === APP_CSS) continue;
      for (const rule of rulesOf(styleOf(file, code(file)))) {
        if (rule.selector.includes("body::before"))
          elsewhere.push(`${file} -> ${rule.selector}`);
      }
    }
    expect(
      elsewhere,
      "Layer G is declared outside src/app.css. 10-UI-SPEC 7.1's placement rule: identity.spec.ts reads THAT FILE AND NOTHING ELSE, so a halftone authored in a component carries an alpha no colour gate on this site can see",
    ).toEqual([]);
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

  it("scan 6: the lattice is a ground - one rule at :where() specificity, declared above .pill, with three named exceptions", () => {
    const appCss = code(APP_CSS);
    const rules = rulesOf(appCss);

    // ---- NON-VACUITY, BEFORE ANY CLAIM. The roots and the field have to exist
    // for a rule about what covers them to mean anything at all.
    expect(
      rules.some((rule) => rule.selector === ".lattice::before"),
      "src/app.css declares no .lattice::before - the field this scan is about is gone, and everything below it would be checking nothing",
    ).toBe(true);

    const ground = rules.filter(
      (rule) =>
        rule.selector.startsWith(".lattice >") ||
        rule.selector.startsWith(".lattice>"),
    );
    expect(
      ground.map((rule) => rule.selector),
      "src/app.css declares no rule on a lattice root's CHILDREN. A-55: the lattice is a ground, and a ground is visible where nothing is standing on it. Without this rule the field paints under every glyph on both roots - measured on the built site at 1280x900 before it existed: 418 text-bearing elements under a lattice root with no opaque ancestor, TWO crossings inside the HANGAR wordmark's box and THIRTEEN inside the browse headline's",
    ).toHaveLength(1);

    const rule = ground[0];
    const declared = new Map(declarationsOf(rule.body));

    // ---- ONE DECLARATION, AND IT IS A TOKEN. A ground rule that also set a
    // border, a radius or a filter would be a second design decision wearing
    // this one's justification.
    expect(
      [...declared.keys()],
      `the ground rule declares ${[...declared.keys()].join(", ")}. It is one declaration - the ground colour - and nothing else: anything further is a second design decision riding on A-55's argument`,
    ).toEqual(["background-color"]);
    expect(
      declared.get("background-color"),
      "the ground rule paints something other than var(--color-workspace). It must be the ground token and not a literal: identity.spec.ts reads THIS FILE for colours, and 10-04 proved twice that a colour it cannot parse is a colour no gate on this site has",
    ).toBe("var(--color-workspace)");

    // ---- `:where()` IS LOAD-BEARING AND ITS ABSENCE IS INVISIBLE TO EVERY
    // OTHER ASSERTION HERE. It zeroes the compound, so the selector weighs
    // 0,1,0 - the same as a bare class - which is what lets a Svelte-scoped
    // rule (.foo.svelte-<hash>, 0,2,0) keep a component's own background
    // without being listed anywhere. This is a DEFAULT, not an override.
    expect(
      rule.selector.includes(":where("),
      `the ground rule is declared as "${rule.selector}" rather than with :where(). AT 0,2,0 IT STOPS BEING A DEFAULT AND BECOMES AN OVERRIDE: it beats .pill's transparent fill and every unscoped component default, so a control that happens to be a direct child of a lattice root silently gains an opaque box. A-55's whole shape is that a component with an opinion about its own background wins WITHOUT being enumerated, which is what makes the fix cost no node and no list`,
    ).toBe(true);

    // ---- SOURCE ORDER, ASSERTED BECAUSE SPECIFICITY CANNOT SEPARATE THEM.
    // .pill is also 0,1,0. At equal specificity the LATER rule wins, so the
    // ground has to be declared FIRST or it takes the fill off a pill. This is
    // the failure mode a rule sitting beside the thing it describes walks into,
    // and it is the reason the block is not next to the lattice's own comment.
    const groundAt = appCss.indexOf(rule.selector);
    const pillAt = appCss.indexOf(".pill {");
    expect(pillAt, "src/app.css no longer declares .pill").toBeGreaterThan(-1);
    expect(
      groundAt,
      "the ground rule is declared AFTER .pill in src/app.css. Both weigh 0,1,0, so specificity cannot separate them and source order decides: declared second, the ground wins the tie and puts an opaque box behind a control that had declared a transparent one. Move it back above .pill - the comment there says why it is not beside the lattice it belongs to",
    ).toBeLessThan(pillAt);

    // ---- THE GROUND RULE LIVES IN src/app.css AND NOWHERE ELSE, so the colour
    // gate that reads one file reads this one too (7.1's placement rule).
    for (const [file] of LATTICE_ROOTS) {
      expect(
        styleOf(file, code(file)).includes(".lattice >"),
        `${file} authors a ground rule of its own. It belongs in src/app.css: identity.spec.ts reads that file and nothing else, so a colour written into a component <style> is invisible to every colour gate this site has`,
      ).toBe(false);
    }

    // ---- THE THREE EXCEPTIONS, EACH READ OUT OF THE FILE THAT CARRIES IT.
    for (const [file, selector, value, why] of GROUND_EXCEPTIONS) {
      const source = code(file);
      const owned = rulesOf(styleOf(file, source)).filter(
        (candidate) => candidate.selector === selector,
      );
      expect(
        owned,
        `${file} no longer declares a ${selector} rule at all, so A-56's exception cannot be read: ${why}`,
      ).not.toEqual([]);
      const values = owned.flatMap((candidate) =>
        declarationsOf(candidate.body).filter(
          ([property]) => property === "background-color",
        ),
      );
      expect(
        values.map(([, found]) => found),
        `${file}'s ${selector} does not declare background-color: ${value}. It is one of A-56's THREE exceptions and it is written out rather than left to an initial value, because an omitted declaration is not a rule and the ground would reach it. The reason it is an exception: ${why}`,
      ).toContain(value);
    }

    // ---- AND THERE IS NO FOURTH, asserted as a length so an exception added
    // in a hurry has to be argued for here before it can ship.
    expect(
      GROUND_EXCEPTIONS.length,
      "A-56 declares THREE exceptions to the ground rule. A fourth that is not in this list is a surface nobody reasoned about, and the third only exists because a DOM walk over the built site found it - reading templates would not have",
    ).toBe(3);
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
