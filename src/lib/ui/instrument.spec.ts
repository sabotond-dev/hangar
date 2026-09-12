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
 * and src/routes/playground/[id]/+page.svelte both mount FrontDoor.svelte, whose root IS
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
 * Front-door-only components: NONE since 13-09. FrontDoor.svelte (the file
 * whose root class .front-door was the register line) and Coverflow.svelte
 * (the ceremonial shelf phase 10 promised not to touch) were the two rows
 * until 13-09 deleted both with the workspace; Splash.svelte was a third
 * until 13-07 deleted it with the glyph field (D-09); ScreenToggle.svelte
 * was exempt until 13-04 deleted it with the CRT. The walk is a subtraction
 * from the directory, so a deleted file needs no row - and with no row left
 * every component on disk is walked. The list and the totality check stay,
 * so a later plan that needs to declare a file out does it here, by name and
 * with a reason, rather than by editing the walk.
 */
const FRONT_DOOR_ONLY: ReadonlyArray<readonly [string, string]> = [];

/**
 * The excluded set is the front-door-only list and nothing else - empty
 * since 13-09.
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
 * FIVE SINCE PLAN 13-18, SIX SINCE 13-08, SEVEN BEFORE IT, AND THE NUMBER IS
 * THE RULE (A-44).
 * 5.2 said "six, and the list is asserted" and was written before 10-10
 * shipped; 19.1c then called the metadata block the sixth, which
 * double-counted the picker's RGB triple. A-44 settled it at seven and
 * required the seventh's argument to be made OUT LOUD - CatalogCard.svelte's
 * metadata block, machine text whose columns must hold. 13-08 rewrote the
 * card to the Bible's page 2, which has no such block, so the seventh use
 * left with it and the list was six across five files. 13-18 (D-23) moved
 * the header's identity - the firmware and page numerals - into Device
 * actions, where identitySentence is a sentence, so DeviceSlot's use left
 * with it and the list is five across four files.
 *
 * The list is what is asserted, not the count alone: a use somewhere else
 * would keep the count right and still be a defect.
 */
const MONO_USES: ReadonlyArray<readonly [string, string, string]> = [
  ["BudgetMeter.svelte", "Phase 5", "the two numeric columns"],
  ["CopyLink.svelte", "Phase 5", "the link field"],
  [
    "Knob.svelte",
    "Phase 5 and 11.3",
    "the integer readout, and the forecast delta",
  ],
  ["ColourPicker.svelte", "10-10", "the RGB triple - the sixth"],
];

/** Five uses across four files: Knob.svelte carries two of them. */
const MONO_COUNT = 5;

const PILLED: ReadonlyArray<readonly [string, string, string]> = [
  // TWO ROWS LEFT AT 13.1-06 with the install column (13.1-CONTEXT D-06,
  // D-07): TryOnDevice.svelte's "primary" (Primary - the pill's radius on
  // its own accent fill) and PutBack.svelte's "control" (Secondary) went
  // with their files - deleted by name, the user's "remove that" and
  // "remove". The bar's Apply to ZONA and Store on ZONA are
  // DestinationZone.svelte's own rectangles (13-12's shape, no pill), so the
  // derived walk finds two pilled controls fewer and this list says so.
  [
    "KeepConfirm.svelte",
    "secondary",
    "Secondary - the confirmation's affirmative",
  ],
  ["CopyLink.svelte", "control", "Secondary"],
  ["BudgetMessage.svelte", "back-off", "Secondary - TURN IT DOWN"],
  // MixTwo.svelte's row ("mix-two", Secondary) left with the file at 13-10
  // (13-CONTEXT D-12): the derived walk finds one pilled control fewer and
  // the hand list says so in the same commit.
  [
    "Knob.svelte",
    "option",
    "word row - the WORD widget only; the swatch row is not a word",
  ],
  ["ColourPicker.svelte", "option", "word row - the knob selector"],
  // ONE ROW JOINED AT 13-12 AND LEFT AT 13.1-02: the destination review's
  // affirmative wore the pill as KeepConfirm's does. The user struck the
  // review at the fourth bench (13.1-CONTEXT D-05) and
  // DestinationReview.svelte was deleted with it, so the row goes with the
  // file - the walk finds one pilled control fewer and this list says so.
  // THREE ROWS LEFT AT 13-08 with the gallery's re-skin to the Bible's page
  // 2: BrowseToolbar.svelte's SORT word row became a <select>, its Clear
  // filters an outlined rectangle authored in its own rule, and
  // TagChip.svelte draws the PDF's chip rectangle itself. The pill is the
  // instrument register's shape; the gallery is no longer on it.
];

/**
 * The QUIET tier, and the two channels that make it quiet, asserted rather than
 * remembered (10-UI-SPEC 10.3 as amended by A-46, A-41).
 *
 * Pilling any of these would give it a border and flatten it into Secondary,
 * which is the exact SAFE-02 regression the ladder exists to prevent. Since
 * A-46 retired the Bare tier the rule protected SIX controls rather than one,
 * CLEAR among them. CLEAR LEFT THE TIER AT 13.1-05 (13.1-CONTEXT D-04): the
 * user asked for it in the header beside `ZONA connected`, so Clear.svelte
 * now draws the connection control's bordered box (DeviceSlot.svelte's 1px
 * boundary, 16px of inline padding, the header's row) and is no longer
 * shapeless - the row goes with the move, and the list says so in the same
 * commit. It wears no pill either way: the derived walk below still reads
 * the file, and device-ui.spec.ts holds its box.
 */
const QUIET: ReadonlyArray<readonly [string, string, string]> = [
  // KEEP ON DEVICE (KeepOnDevice.svelte -> .control) and DISCONNECT ZONA
  // (TryOnDevice.svelte -> .disconnect) LEFT THE TIER AT 13.1-06 with their
  // files: the install column under the workspace's surface is gone
  // (13.1-CONTEXT D-06), Store on ZONA is the bar's bordered control
  // (DestinationZone.svelte) and Disconnect ZONA is Device actions' quiet
  // control (DeviceDetails.svelte, 13-11). The list says so in the same
  // commit; NOT NOW is the tier's install member now.
  ["KeepConfirm.svelte", "quiet-control", "NOT NOW"],
  ["Knob.svelte", "lock", "HOLD / HELD"],
  ["BrowseToolbar.svelte", "clear", "the search field's own CLEAR"],
];

/**
 * The one control inside an instrument FILE that is a front-door control, named
 * so the omission is a ruling.
 *
 * FacetRow.svelte straddles the register line, which is the sharpest single
 * demonstration that the line is a class rather than a file list: on /playground/ it
 * renders TagChip.svelte, which is pilled, and on / it renders its own .link
 * members, which are not, because that row paints on the front door and nowhere
 * else.
 */
const STRADDLES: readonly [string, string, string] = [
  "FacetRow.svelte",
  "link",
  "the FOR row's link mode rendered on the front door until 13-09 deleted FrontDoor.svelte, and no route mounts it since; its members stay in the front-door register all the same, and since 13-08 the checkbox mode's chips draw the Bible's rectangle themselves rather than wearing the pill, so neither member may wear it",
];

describe("IDENT-01 the instrument register (10-UI-SPEC 19.1g)", () => {
  it("scan 1: the register line holds from the instrument side - the pill is authored once, in src/app.css, and never under a .front-door selector", () => {
    // ---- THE FRONT DOOR ITSELF WENT AT 13-09. FrontDoor.svelte, whose root
    // class .front-door was the register line, left the tree with the
    // coverflow when /playground/{id}/ became the workspace; the CRT side of
    // the line went at 13-04 (D-09). What is left to hold is the instrument
    // side: the pill is authored once, in src/app.css, and no instrument rule
    // is scoped under a .front-door selector anywhere in src/ - which is the
    // spelling that would put the register on a hero shell without any file
    // owning it.
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

    // And nowhere in src/ is an instrument rule scoped under .front-door -
    // the spelling that would put the register on a hero shell.
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

    // ---- QUIET IS UNTOUCHED, and A-46 made the claim bigger rather than
    // smaller: the Bare tier is retired and the no-pill rule protects the
    // five controls listed (CLEAR sat among them until 13.1-05 re-homed it
    // into the header's bordered box - see QUIET).
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
      `${straddler} is not in the derived walk, and it must be: it renders the gallery's chips on /playground/`,
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

  it("scan 5: the index form is retired with the Bible, mono is a list of five, and no row gained a rule", () => {
    // ---- A-42's INDEX FORM IS RETIRED (plan 13-08, 13-CONTEXT D-01/D-05).
    // 19.1f put a two-digit index and an em dash beside each facet caption on
    // the gallery (`01 — FOR`). The Bible's page 2 draws one `Use` row with
    // no ordinal, and the FEELS row is gone (D-11), so the form has no
    // subject left. This scan used to hold the form's shape; it now holds
    // the form ABSENT everywhere the old rule said it might appear, and the
    // caption declarations unchanged in the file that owns them.
    const facet = code("src/lib/ui/FacetRow.svelte");
    const facetTemplate = templateOf(facet);
    const facetRules = rulesOf(styleOf("src/lib/ui/FacetRow.svelte", facet));

    // ---- Non-vacuity, before a single claim about what was found. ----
    expect(
      facetRules.length,
      `FacetRow.svelte parsed into ${facetRules.length} rules`,
    ).toBeGreaterThan(4);
    expect(
      facetRules.some((rule) => rule.selector === ".caption"),
      "FacetRow.svelte has no .caption rule - the row was renamed away and this scan is checking nothing",
    ).toBe(true);
    for (const cls of ["index", "dash"]) {
      expect(
        facetRules.some((rule) => rule.selector === `.${cls}`),
        `FacetRow.svelte still declares a .${cls} rule - the index form was retired at 13-08 with the Bible's page 2, which has no ordinal beside its Use row`,
      ).toBe(false);
    }
    expect(
      /<span class="index"|class="dash"/.test(facetTemplate),
      "FacetRow.svelte still renders the index or the dash",
    ).toBe(false);
    expect(
      facet.includes("index?: string"),
      "FacetRow.svelte still takes an index prop",
    ).toBe(false);
    const toolbar = code("src/lib/ui/BrowseToolbar.svelte");
    expect(
      /index=/.test(toolbar),
      "BrowseToolbar.svelte still hands its facet row an index",
    ).toBe(false);

    // THE CAPTION LITERALS ARE UNCHANGED AT THEIR SOURCE. FACETS in
    // src/lib/browse/facets.ts still declares the two captions the front door
    // reads, byte for byte, with no furniture folded into either.
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
          `the facet caption ${JSON.stringify(caption)} carries ${what} - furniture folded into a pinned string`,
        ).toBe(false);
      }
    }
    const captionText = textBetween(facetTemplate, '<span class="caption"');
    expect(
      captionText,
      "FacetRow.svelte's caption element could not be read - the markup moved and the assertions below prove nothing",
    ).not.toBe("");
    expect(
      /[0-9—-]/.test(captionText),
      "the caption element carries a digit or a dash - the retired furniture came back inside the group's accessible name",
    ).toBe(false);

    // ---- THE FRONT DOOR'S LINK ROW WENT WITH THE FRONT DOOR (13-09); the
    // device components are what is left to hold free of the index form.
    // KeepOnDevice, PutBack and TryOnDevice left the list with their files
    // at 13.1-06 (the install column, 13.1-CONTEXT D-06); the bar's
    // destination zone took their place as the device flow's surface.
    const numbered: string[] = [];
    for (const name of [
      "Clear.svelte",
      "DestinationZone.svelte",
      "KeepConfirm.svelte",
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

    // ---- --font-mono IS A LIST OF FIVE, AND THE LIST IS THE ASSERTION.
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
      `${declarations} rules across src/lib/ui/ declare var(--font-mono) and A-44 settles the count at ${MONO_COUNT} since 13-18 moved the header's numerals into Device actions (six after 13-08, seven before it). The LIST below is what holds it - a use somewhere else keeps the count right and is still a defect.`,
    ).toBe(MONO_COUNT);
    expect(
      carriers.sort(),
      "a component declares --font-mono and is not on 19.1c's list, or has fallen off it. Y-18: only the firmware and the page numerals are monospaced, and prose never is.",
    ).toEqual(
      MONO_USES.map(([file]) => file)
        .slice()
        .sort(),
    );

    // The card's metadata block is GONE with the Bible (13-08): no .meta
    // rule, no mono use, no separator - the PDF's card carries one category,
    // one tag, one sentence and Explore, and CatalogCard.svelte says so.
    const card = code("src/lib/ui/CatalogCard.svelte");
    expect(
      rulesOf(styleOf("src/lib/ui/CatalogCard.svelte", card)).find(
        (rule) => rule.selector === ".meta",
      ),
      "CatalogCard.svelte still declares a .meta rule - 19.1c's metadata block was retired by 13-08 with the Bible's page 2",
    ).toBeUndefined();
    expect(
      /<span class="plus">/.test(templateOf(card)),
      "the metadata separator is still rendered on the card",
    ).toBe(false);

    // ---- 19.1d went with the block: no .plus and no .field rule remains.
    expect(
      rulesOf(styleOf("src/lib/ui/CatalogCard.svelte", card)).filter(
        (r) => r.selector === ".plus" || r.selector === ".field",
      ),
      "the metadata block's field rules are still declared on the card",
    ).toEqual([]);

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
      ["data-screen", "the SCREEN switch's attribute on <html>"],
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
