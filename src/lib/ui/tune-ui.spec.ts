// The structural gate over the seven components Phase 5 added to src/lib/ui/.
//
// These are the rules that keep the tuning UI light, scroll-free, reachable by
// thumb and correctly coloured. Every one of them is a property of the SOURCE
// rather than of a rendered tree, so all five run in a second and none of them
// needs a browser. The e2e suite proves the behaviour; this proves the shape,
// and it proves it on every commit rather than on every release.
//
// EVERY SCAN STRIPS COMMENTS FIRST, and that is load-bearing rather than tidy.
// Four of these components explain in prose exactly which token, specifier or
// declaration they are forbidden to use - Knob.svelte, StampNotice.svelte and
// CopyLink.svelte each say "--color-over appears nowhere in this file", and
// TuningRegion.svelte names both the compile surface and setInterval in its
// header. A scan over raw source would go red on correct code, and the natural
// fix for that - deleting the paragraph - would delete the documentation that
// makes the rule survivable. So the comments stay and the scanner learns to
// read code. Test 5 is the deliberate exception: what it checks IS a comment.
//
// The stripper, the specifier matcher and the non-vacuity habit are
// src/lib/config-shape.spec.ts's, copied rather than reinvented, and every
// regular expression here is backslash-free in the same house style.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// The copy module imports NOTHING (its own header says why), so naming it here
// costs this file no chunk and lets the source scans below check a component
// against the sentence it is supposed to be rendering rather than a copy of it.
import { KNOB_HOLD } from "../tune/copy";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const UI_DIR = "src/lib/ui";

/**
 * The seven components this phase added. A literal list is unavoidable - the
 * directory also holds Phase 4's components, which these rules do not all bind
 * - so its length is asserted and every name is checked against the directory
 * listing. A rename, a deletion or an eighth component added without being
 * listed is then a visible omission rather than a silent gap.
 */
const TUNING_COMPONENTS: readonly string[] = [
  "BudgetMessage.svelte",
  "BudgetMeter.svelte",
  "CopyLink.svelte",
  "Knob.svelte",
  "KnobRack.svelte",
  "StampNotice.svelte",
  "TuningRegion.svelte",
];

/** Comments removed before a structural match: line, block and markup. */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));

const componentPath = (name: string) => `${UI_DIR}/${name}`;

/** Every non-spec file under src/lib/ui/, in a stable order. */
const uiFiles = (): string[] =>
  readdirSync(repo(UI_DIR))
    .map(String)
    .filter((name) => !name.endsWith(".spec.ts"))
    .sort()
    .map(componentPath);

const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1;

/**
 * A style block split into rules. Crude on purpose: a real CSS parser would be
 * a dependency, and every selector in these seven files is a plain class or
 * element selector on one line.
 */
function rulesOf(source: string): { selector: string; body: string }[] {
  const start = source.indexOf("<style>");
  if (start < 0) return [];
  const styles = source.slice(start);
  const out: { selector: string; body: string }[] = [];
  for (const match of styles.matchAll(/([^{}]+)[{]([^{}]*)[}]/g)) {
    out.push({ selector: match[1].trim(), body: match[2] });
  }
  return out;
}

/** Every class named on a `<button` element in a component's markup. */
function buttonClassesOf(source: string): string[] {
  const out: string[] = [];
  for (const match of source.matchAll(/<button[^>]*/g)) {
    for (const attr of match[0].matchAll(/class[ ]*=[ ]*"([^"]*)"/g)) {
      for (const name of attr[1].split(/[ ]+/)) if (name) out.push(name);
    }
  }
  return out;
}

describe("the tuning UI's structural rules", () => {
  it("no tuning component names the compiler", () => {
    // The list is checked against the directory here, once, because every test
    // below reads through it: a renamed or deleted component would otherwise
    // make all five pass while covering six files, or five.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(TUNING_COMPONENTS.length, "seven components were listed").toBe(7);
    expect(
      TUNING_COMPONENTS.filter((name) => !present.has(name)),
      "a listed tuning component is not on disk - it was renamed or deleted, and every test in this file has silently stopped covering it",
    ).toEqual([]);

    // D-18. src/lib/tune/model.ts imports the vendored compiler, which imports
    // @intechstudio/grid-protocol at module scope - a 131,101-byte chunk on the
    // critical path of a page whose whole job is to paint in under two seconds.
    //
    // TWO HALVES, AND THE SECOND IS THE ONE config-shape.spec.ts CANNOT DO. Its
    // test 13 matches the specifier TEXT against `vendor`, `intechstudio` and
    // `lib/pad`, so a static `from "$lib/tune/model"` sails straight through it
    // while pulling the whole chunk in transitively. Observed, not assumed: the
    // static import was added, test 13 stayed green, and this test is what goes
    // red for it. So the module names below are held to `await import(...)`.
    const LAZY = ["$lib/tune/model", "$lib/share/stamp", "$lib/pad"];
    const MARKERS = ["vendor", "intechstudio", "lib/pad"];

    const specifiers: { file: string; specifier: string }[] = [];
    let lazyNamed = 0;
    let lazyAwaited = 0;

    for (const name of TUNING_COMPONENTS) {
      const file = componentPath(name);
      const source = code(file);
      for (const match of source.matchAll(/from[ ]*["']([^"']+)["']/g)) {
        specifiers.push({ file, specifier: match[1] });
      }
      for (const module of LAZY) {
        lazyNamed += occurrences(source, module);
        lazyAwaited += occurrences(source, `await import("${module}")`);
      }
    }

    // Both non-vacuity guards: an empty walk and an empty match set would each
    // make the assertions below pass without having read anything.
    expect(specifiers.length, "static imports were collected").toBeGreaterThan(
      0,
    );
    expect(
      lazyNamed,
      "the compile-surface modules were found at all - if this is zero the second assertion below proves nothing",
    ).toBeGreaterThan(0);

    const offenders = specifiers.filter(({ specifier }) =>
      MARKERS.some((marker) => specifier.includes(marker)),
    );
    expect(
      offenders.map((o) => `${o.file} -> ${o.specifier}`),
      "a tuning component imports the compiler at module scope",
    ).toEqual([]);
    expect(
      lazyAwaited,
      `the compile surface is named ${lazyNamed} time(s) but only ${lazyAwaited} of those are inside an await import(...) - a static reference to it puts the protocol chunk on the front door's first paint`,
    ).toBe(lazyNamed);
  });

  it("nothing in the tuning UI scrolls horizontally", () => {
    // D-11: wrap, never scroll. A scrollbar under a visitor's thumb is the
    // failure the rule names, and it is one declaration away at every width.
    //
    // The shorthand is forbidden alongside the axis property, because
    // `overflow: auto` sets the inline axis just as surely as `overflow-x`
    // does - a test that only reads the axis property would let the loophole
    // through while reporting the rule as covered.
    const AXIS = "overflow-x";
    const SHORTHAND = /overflow[ ]*:[ ]*(auto|scroll)/;

    const offenders: string[] = [];
    let declarations = 0;
    for (const name of TUNING_COMPONENTS) {
      const file = componentPath(name);
      const source = code(file);
      declarations += occurrences(source, ":");
      if (source.includes(AXIS)) offenders.push(`${file} -> ${AXIS}`);
      const short = SHORTHAND.exec(source);
      if (short) offenders.push(`${file} -> ${short[0]}`);
    }

    expect(
      declarations,
      "the seven components' code was actually read",
    ).toBeGreaterThan(100);
    expect(
      offenders,
      "a tuning component can scroll horizontally, which D-11 forbids at every width and in every state",
    ).toEqual([]);
  });

  it("every component that renders a control declares the 44px floor", () => {
    // Phase 4's accessibility contract. The LIST IS DERIVED from the presence
    // of a control rather than written down, so a component that grows its
    // first button later cannot slip past a hard-coded array that nobody
    // remembered to update.
    const withControls: string[] = [];
    const withoutControls: string[] = [];
    const missingFloor: string[] = [];

    for (const name of TUNING_COMPONENTS) {
      const file = componentPath(name);
      const source = code(file);
      const controls = source.includes("<button") || source.includes("<input");
      if (!controls) {
        withoutControls.push(file);
        continue;
      }
      withControls.push(file);
      if (!source.includes("44px")) missingFloor.push(file);
    }

    // Non-vacuity in both directions: the derivation found controls, AND it
    // discriminated rather than returning every file it was handed.
    expect(
      withControls.length,
      "components rendering a button or an input were found",
    ).toBeGreaterThanOrEqual(4);
    expect(
      withoutControls.length,
      "the derivation discriminates - if every component were classed as having a control, the rule would be untested rather than universally satisfied",
    ).toBeGreaterThan(0);
    expect(
      missingFloor,
      "a component renders an interactive control and never declares 44px - Phase 4's touch floor is per-control, not per-page",
    ).toEqual([]);

    // -----------------------------------------------------------------------
    // T1's lock, which is the newest control in this file's scope (10-UI-SPEC
    // 11.5). It rides inside this test rather than becoming a sixth, because
    // what it asserts IS this test's rule - a control and its 44px floor -
    // applied to the one control the floor is easiest to miss on: a four-
    // character word at 12px is nowhere near 44px wide by itself.
    const knob = code(componentPath("Knob.svelte"));

    expect(
      knob,
      "the lock is not a real <button aria-pressed> - a div with a role, or a checkbox, would put the state somewhere the accessible NAME is not",
    ).toContain("aria-pressed={held}");

    // BOTH axes, named separately, because `min-block-size` alone passes the
    // `includes("44px")` walk above while leaving a 30px-wide target.
    const lockRule = rulesOf(knob).find(
      (rule) => rule.selector.trim() === ".lock",
    );
    expect(lockRule, "Knob.svelte no longer has a .lock rule").toBeDefined();
    expect(
      lockRule?.body,
      "the lock does not declare its 44px INLINE floor",
    ).toContain("min-inline-size: 44px");
    expect(
      lockRule?.body,
      "the lock does not declare its 44px BLOCK floor",
    ).toContain("min-block-size: 44px");

    // The label is the copy module's, never transcribed - and it CHANGES, so
    // the state is in the accessible name and not only in aria-pressed.
    expect(knob, "the lock transcribes its labels").not.toContain(
      `"${KNOB_HOLD}"`,
    );
    expect(knob).toContain("KNOB_HOLD");
    expect(knob).toContain("KNOB_HELD");
    expect(
      knob,
      "the lock's label does not change with its state, so HELD is invisible to a screen reader that reads names rather than pressed states",
    ).toContain("held ? KNOB_HELD : KNOB_HOLD");

    // THE SECOND CHANNEL, AND THE COLOUR IT IS NOT. The held marker is a
    // --color-line bar; the free one is the --color-line-soft dot it always
    // was. Neither is accent - 10-UI-SPEC 7.2's reserved list stays at eight,
    // and the census that holds the whole rack to it is the test below.
    const barRules = rulesOf(knob).filter((rule) =>
      rule.selector.includes(".home.bar"),
    );
    expect(
      barRules.length,
      "the held marker has no rules of its own, so HOLD and HELD look identical",
    ).toBeGreaterThan(0);
    expect(
      barRules.map((rule) => rule.selector).join(" | "),
      "the held marker paints in accent - that is a ninth entry on the reserved list, and the whole point of the two-channel design is that it is not taken",
    ).not.toContain("--color-accent");
    for (const rule of barRules) {
      expect(
        rule.body,
        `${rule.selector} paints the held marker in accent`,
      ).not.toContain("--color-accent");
    }
    expect(
      barRules.map((rule) => rule.body).join(""),
      "the held marker is not --color-line, so it is either invisible or on a token it has no claim to",
    ).toContain("var(--color-line)");
    expect(
      rulesOf(knob).find((rule) => rule.selector.trim() === ".home")?.body,
      "the FREE marker stopped being the soft dot, so the two states no longer differ by weight",
    ).toContain("var(--color-line-soft)");
  });

  it("the alarm red lives in exactly two components and on no button", () => {
    // X-01 scopes the ninth token to THREE USES: the offending meter's bar fill
    // and its 2px outline, that meter's numerals and percentage, and the 2px
    // left rule on the over-budget message. THIS TEST COUNTS COMPONENTS, NOT
    // USES - the first two uses live in BudgetMeter.svelte and the third in
    // BudgetMessage.svelte, so two here and three in the UI spec are the same
    // fact counted differently, and neither number contradicts the other.
    const TOKEN = "--color-over";
    const files = uiFiles().filter((file) => file.endsWith(".svelte"));
    const carriers = files.filter((file) => code(file).includes(TOKEN));

    expect(files.length, "the ui directory was walked").toBeGreaterThan(7);
    expect(
      carriers.sort(),
      "the alarm red is scoped to the meter and the message, and appears nowhere else under src/lib/ui/ - the walk excludes *.spec.ts, where identity.spec.ts legitimately names the token",
    ).toEqual([
      `${UI_DIR}/BudgetMessage.svelte`,
      `${UI_DIR}/BudgetMeter.svelte`,
    ]);

    // And in neither is it a button's fill or a button's border. The check is
    // by SELECTOR against the classes actually applied to a <button> in that
    // component's own markup, so it holds whatever property is used.
    const offenders: string[] = [];
    let buttonClasses = 0;
    for (const file of carriers) {
      const source = code(file);
      const buttons = new Set(buttonClassesOf(source));
      buttonClasses += buttons.size;
      for (const rule of rulesOf(source)) {
        if (!rule.body.includes(TOKEN)) continue;
        for (const cls of rule.selector.matchAll(/[.]([a-zA-Z0-9_-]+)/g)) {
          if (buttons.has(cls[1]))
            offenders.push(`${file} -> ${rule.selector}`);
        }
      }
    }

    expect(
      buttonClasses,
      "a button was found in one of the two carriers - TURN IT DOWN - so this scan has something to discriminate against",
    ).toBeGreaterThan(0);
    expect(
      offenders,
      "the alarm red is applied to a button, which reads as 'dangerous' when the truth is 'not yet'",
    ).toEqual([]);
  });

  it("the region's arithmetic is present, and both constants are", () => {
    // THE ONE TEST THAT READS COMMENTS ON PURPOSE. Two of the four numbers
    // below are prose - a height a component reserves is only auditable if the
    // derivation is beside it - and the other two are the declarations that
    // have to agree with them.
    const region = componentPath("TuningRegion.svelte");
    const rack = componentPath("KnobRack.svelte");
    const tryOn = componentPath("TryOnDevice.svelte");

    const regionRaw = raw(region);
    const regionCode = code(region);

    expect(regionRaw.length, "TuningRegion.svelte was read").toBeGreaterThan(
      1000,
    );
    expect(raw(rack).length, "KnobRack.svelte was read").toBeGreaterThan(1000);

    // BOTH constants, because a region carrying only the one-line form
    // under-reserves by 52px at exactly the two widths DEGR-01 exists for.
    expect(
      regionRaw,
      "the one-line height constant 194 + 48r + 66w - 4 is not written down - the region's height is no longer auditable",
    ).toContain("194 + 48r + 66w - 4");
    expect(
      regionRaw,
      "the WRAPPED height constant 246 + 48r + 66w - 4 is missing - a region reserving only the one-line form is 52px short at 320px and at 375px, where the actions row wraps",
    ).toContain("246 + 48r + 66w - 4");

    // The two constants, less ChosenPanel's 32px of region padding, as the
    // shipped declarations. Comments that no longer match the CSS are worse
    // than no comments.
    expect(
      regionCode,
      "the one-line reservation 194 - 32 = 162px is not in the style block",
    ).toContain("calc(162px");
    expect(
      regionCode,
      "the wrapped reservation 246 - 32 = 214px is not in the style block",
    ).toContain("calc(214px");

    // MEASURED, not derived: SURPRISE ME and RESET ALL need exactly 257px of
    // region content box, so the row holds one line at 257 and wraps at 256.
    // Both comments carry the number and the container query switches on it.
    expect(
      regionCode,
      "the container query no longer switches at the MEASURED wrap width of 257px - the two reservations are being chosen at the wrong width",
    ).toContain("width < 257px");
    expect(
      regionRaw,
      "TuningRegion.svelte no longer records the measured 257px wrap width",
    ).toContain("257px");
    expect(
      raw(rack),
      "KnobRack.svelte still carries the derivation without the measurement that replaced it",
    ).toContain("257px");

    // The two fixed heights either side of the seam.
    expect(
      regionCode,
      "the meters block is not exactly 56px - (14 + 4 + 8) x 2 + 4, and the one half of Phase 4's 152px that survived contact with six controls",
    ).toContain("block-size: 56px");
    expect(
      code(tryOn),
      "the honesty slot no longer reserves 48px, so swapping its sentence changes its line count and shoves the whole region down at the instant a knob crosses 908. ceil(85 / 43) x 24 = 48, where 85 is the longest of its five candidates after plan 10-03 and 43 is the CH_PER_LINE plan 10-01 measured in Inter - it was 72px for three lines",
    ).toContain("min-block-size: 48px");
  });
});
