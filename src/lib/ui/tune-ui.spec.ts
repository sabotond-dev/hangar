// The structural gate over the nine components the tuning UI is made of.
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
import {
  KNOB_HOLD,
  MIX_LINE,
  MIX_THAT,
  MIX_THIS,
  MIX_TWO,
  SURPRISE_ALL_HELD,
} from "../tune/copy";
// mix.ts imports a type and surprise.ts, and surprise.ts imports a type. Naming
// it here costs this file nothing and lets the canvas budget be counted against
// the constant the component actually loops over rather than against a 4.
import { MIX_CHILDREN } from "../tune/mix";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const UI_DIR = "src/lib/ui";

/**
 * The nine tuning components. A literal list is unavoidable - the directory
 * also holds Phase 4's components, which these rules do not all bind - so its
 * length is asserted and every name is checked against the directory listing.
 * A rename, a deletion or a TENTH component added without being listed is then
 * a visible omission rather than a silent gap.
 *
 * The eighth is plan 10-10's ColourPicker.svelte and the ninth is 10-11's
 * MixTwo.svelte, and adding each here is not bookkeeping: a component omitted
 * from a hand-declared list passes every walk in this file silently, which
 * would have left them outside the compiler guard, the scroll prohibition, the
 * 44px floor and the accent census at once.
 *
 * THIS IS THE HAND-DECLARED WALK MixTwo.svelte BELONGS TO, AND IT BELONGS TO
 * NO OTHER. device-ui.spec.ts's DEVICE_COMPONENTS is the six device components
 * and browse-ui.spec.ts's browseFiles() is the six browse ones; MIX TWO is a
 * tuning control and is neither.
 */
const TUNING_COMPONENTS: readonly string[] = [
  "BudgetMessage.svelte",
  "BudgetMeter.svelte",
  "ColourPicker.svelte",
  "CopyLink.svelte",
  "Knob.svelte",
  "KnobRack.svelte",
  "MixTwo.svelte",
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
 * a dependency, and every selector in these nine files is a plain class or
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
    // make every test below pass while covering seven files, or six.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(TUNING_COMPONENTS.length, "nine components were listed").toBe(9);
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
      "the nine components' code was actually read",
    ).toBeGreaterThan(100);
    expect(
      offenders,
      "a tuning component can scroll horizontally, which D-11 forbids at every width and in every state",
    ).toEqual([]);

    // -----------------------------------------------------------------------
    // AND THE OTHER WAY A RACK LEARNS TO SCROLL SIDEWAYS: NOT A DECLARATION,
    // BUT SIX PIXELS OF PAINT PAST AN EDGE. The scan above reads declarations
    // and would have stayed green through a measured breach - `knob-rack`
    // reporting scrollWidth 251 against clientWidth 245 at the 393px phone
    // viewport, red in e2e/tuning-webkit.e2e.ts:279, which is what actually
    // happened. The picker's 12px thumb is centred on its value, so at the top
    // detent `calc(100% - 6px)` puts its right edge 6px past the rail, and
    // aurora SHIPS at 0,85,255 - the blue rail stands at 15 on arrival.
    // Knob.svelte has the identical rule and is safe because its `.row` grid
    // keeps a lock column to the thumb's right; a rail in the picker is the
    // last thing in the block, so the block reserves the radius itself.
    //
    // It rides inside this test because it IS this test's rule, measured
    // rather than declared, and a unit gate says so in two seconds where the
    // e2e suite needs a build and a server.
    const railsRule = rulesOf(code(componentPath("ColourPicker.svelte"))).find(
      (rule) => rule.selector.trim() === ".rails",
    );
    expect(
      railsRule,
      "ColourPicker.svelte no longer has a .rails rule",
    ).toBeDefined();
    expect(
      railsRule?.body,
      "the rails do not reserve the thumb's 6px radius, so at the top detent the thumb paints past the rack and knob-rack scrolls sideways - measured at scrollWidth 251 against clientWidth 245 on a 393px phone",
    ).toContain("padding-inline: 6px");
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

    // -----------------------------------------------------------------------
    // THE PICKER'S TWO SMALL CONTROLS, BOTH AXES NAMED SEPARATELY (plan 10-10's
    // contract table, and 10-UI-SPEC 19.1b's pill floor). The walk above is
    // `includes("44px")` per FILE, so ColourPicker.svelte passes it on the
    // strength of its 44px head row alone while a selector option or its lock
    // sits at 30px. Both are word-width controls at 12px - a three-character
    // knob label is nowhere near 44px wide - so the inline floor is the
    // load-bearing half here, exactly as it is on Knob.svelte's lock.
    //
    // Neither hand-declared walk in this repository covers this file:
    // device-ui.spec.ts's DEVICE_COMPONENTS is the six device components and
    // browse-ui.spec.ts's browseFiles() is the six browse ones. 10-UI-SPEC
    // 19.1g's directory-derived walk arrives at 10-13.1; until it does, this
    // is the assertion.
    const picker = rulesOf(code(componentPath("ColourPicker.svelte")));
    for (const selector of [".option", ".lock"]) {
      const rule = picker.find((r) => r.selector.trim() === selector);
      expect(
        rule,
        `ColourPicker.svelte no longer has a ${selector} rule`,
      ).toBeDefined();
      for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
        expect(
          rule?.body,
          `${selector} does not declare ${axis} - Phase 4's touch floor is both axes per control, and a file-level 44px walk cannot see this`,
        ).toContain(axis);
      }
    }

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

    // -----------------------------------------------------------------------
    // T2's forecast delta, which rides here for the same reason the lock does:
    // it is a thing this component paints on a control, and what it must not
    // do is change the control's size or its colour vocabulary.
    const deltaRule = rulesOf(knob).find(
      (rule) => rule.selector.trim() === ".delta",
    );
    expect(deltaRule, "Knob.svelte no longer has a .delta rule").toBeDefined();

    // THE FIFTH --font-mono USE ON THE SITE. Phase 5 confined the stack to
    // four; W-03's reason for introducing it is a number that changes as a
    // pointer moves and must not jitter horizontally, which is exactly this.
    expect(
      deltaRule?.body,
      "the delta is not monospaced, so +9 and +10 shift the option under the pointer",
    ).toContain("var(--font-mono)");
    expect(
      deltaRule?.body,
      "the delta is not tabular, which is the other half of not jittering",
    ).toContain("tabular-nums");
    expect(
      deltaRule?.body,
      "the delta paints in accent - a forecast is information, not a selection, and the reserved list stays at eight",
    ).not.toContain("--color-accent");
    expect(
      deltaRule?.body,
      "the delta paints in the alarm red, which would be X-01's fourth use",
    ).not.toContain("--color-over");
    // ABSOLUTE, so it costs no layout: a delta that took part in the flex row
    // would widen its option and reflow the rack under the pointer.
    expect(
      deltaRule?.body,
      "the delta is in flow, so hovering an option reflows the rack",
    ).toContain("position: absolute");

    // NEVER ON TOUCH, gated twice and both gates asserted. The per-event one
    // is what actually stops the work; the media query is what stops the paint
    // on a device that has no hover at all.
    expect(
      knob,
      "the forecast has no pointerType guard, so a tap puts a compile in front of the gesture",
    ).toContain('pointerType === "touch"');
    expect(
      knob,
      "the CSS half of the hover gate is gone: @media (hover: hover)",
    ).toContain("@media (hover: hover)");
    expect(
      knob,
      "the keyboard half is gone - :focus-visible is how a visitor with no pointer reaches an option",
    ).toContain(":focus-visible");

    // The delta's TEXT is the copy module's, arriving as a prop. This
    // component builds no sentence and no sign, which is what keeps U+2212 in
    // one place (copy.spec.ts asserts the other end of that).
    expect(knob).toContain("forecastLabel");
    expect(
      knob,
      "Knob.svelte builds the signed delta itself instead of rendering the one copy.ts wrote",
    ).not.toContain("forecastDelta(");
  });

  it("SURPRISE ME is a real disabled button when every knob is held, and its reason is 53 characters", () => {
    // THE BEHAVIOUR SHIPPED IN 10-09-01; THIS IS THE ASSERTION.
    // `surpriseIndices` answers a fully-held roll by handing the previous
    // indices back - its documented exhaustion signal - so a SURPRISE ME left
    // enabled would be a button that appears to do nothing, which is worse
    // than a disabled one. DEGR-02 then requires a reason, and this control
    // needs one where RESET ALL does not: RESET ALL is disabled by a state the
    // rack shows directly, and this one by a state spread across every row.
    const region = code(componentPath("TuningRegion.svelte"));

    expect(
      region,
      "SURPRISE ME is not disabled on full exhaustion, so it is a button that appears to do nothing",
    ).toContain("disabled={rolling || allHeld}");
    expect(
      region,
      "allHeld is not derived from the rack, so the disabled state is not the one the toggles produce",
    ).toContain("knobViews.every((knob) => heldKnobs.has(knob.id))");

    // The reason is imported, never transcribed, and it is wired to the
    // control rather than merely printed near it.
    expect(
      region,
      "the region transcribes the reason instead of importing it, which is how one sentence becomes two",
    ).not.toContain(`"${SURPRISE_ALL_HELD}"`);
    expect(region).toContain("SURPRISE_ALL_HELD");
    expect(
      region,
      "the reason is not wired to the disabled control by aria-describedby, so it is visual-only",
    ).toContain("aria-describedby={allHeld ? heldReasonId : undefined}");

    // 53, counted rather than asserted by eye. copy.spec.ts holds the sentence
    // character-for-character; this holds the number the UI spec gives it.
    expect(
      [...SURPRISE_ALL_HELD].length,
      "the fully-held reason is no longer 53 characters",
    ).toBe(53);
    expect(
      SURPRISE_ALL_HELD,
      "the reason names the control instead of the state, repeating the label directly above it",
    ).not.toContain("SURPRISE ME");
  });

  it("the accent census moves with the picker and the reserved list does not", () => {
    // THE RESERVED LIST IS EIGHT AND THIS IS WHAT HOLDS IT THERE (10-UI-SPEC
    // 7.2). Every entry is named in the failure message below, because a
    // census that fails with a bare number tells the next author the count
    // moved and nothing about which of the eight they were entitled to.
    //
    // A COUNT, NOT AN INSPECTION. Three waves of this phase add controls to
    // these files - a lock, a forecast delta, a ghost fill, and now a picker
    // with three rails and a knob selector - and each one is a chance to reach
    // for a colour that is already spoken for. None of them took a NINTH, and
    // this is the assertion that says so rather than the comment.
    //
    // THE CENSUS MOVES; THE LIST DOES NOT, AND THAT DISTINCTION IS THE WHOLE
    // POINT (plan 10-10). Fourteen becomes twenty-one because ColourPicker
    // .svelte joins the eight files this test reads, and every one of its seven
    // declarations is one of the eight entries already on the list: three are
    // the focus ring (entry 4) on the rail, the selector option and nothing
    // else, and four are the selected value of a knob (entry 8) - the track
    // fill, the thumb, the selected detent's outline and the selected pill.
    // A wave that legitimately spends a ninth has to move the census AND the
    // list together.
    const RESERVED = [
      "the splash wordmark and its punched rectangles",
      "the name plate's triangles",
      "TRY ON DEVICE's enabled fill",
      "the focus ring",
      "the header wordmark",
      "the loading motif's one walking cell",
      "the two budget meters' fill while in budget",
      "the selected value of a knob",
    ];
    expect(RESERVED, "the reserved list is eight entries").toHaveLength(8);

    const census: Record<string, number> = {};
    for (const name of TUNING_COMPONENTS) {
      census[name] = occurrences(code(componentPath(name)), "--color-accent");
    }
    const total = Object.values(census).reduce((sum, n) => sum + n, 0);

    // Per file, so a move is named rather than merely counted.
    expect(
      census,
      `the accent census moved. The reserved list is these eight and nothing else: ${RESERVED.join("; ")}. A held knob's marker is --color-line, the forecast delta is --color-ink and the ghost fill is --color-line-soft - none of them is entitled to the ninth`,
    ).toEqual({
      "BudgetMessage.svelte": 2,
      "BudgetMeter.svelte": 1,
      "ColourPicker.svelte": 7,
      "CopyLink.svelte": 1,
      "Knob.svelte": 9,
      "KnobRack.svelte": 0,
      // A NINTH COMPONENT THAT MOVES THE CENSUS BY ZERO (plan 10-11). MIX TWO
      // is Secondary tier, so its pill is an OUTLINE and never a fill; its
      // results are bordered in --color-line-soft; and its focus ring is
      // app.css's :focus-visible, which belongs to every control on the site
      // and is declared in no component. There was nothing here to spend
      // accent on that would not have been a ninth entry.
      "MixTwo.svelte": 0,
      "StampNotice.svelte": 0,
      "TuningRegion.svelte": 1,
    });
    expect(
      total,
      "the accent declaration count across the nine tuning components is no longer twenty-one",
    ).toBe(21);

    // Non-vacuity: the walk really read files with accent in them.
    expect(
      Object.values(census).filter((n) => n > 0).length,
      "the census found accent in fewer files than the six that carry it",
    ).toBe(6);

    // AND THE PICKER SPENT NONE OF IT ON THE THINGS THAT WOULD HAVE BEEN A
    // NINTH ENTRY. The cheap-step tick is --color-line, the unaffordable
    // detent is --color-ground behind a --color-line-soft hairline, and the
    // default marker is the soft dot it always was. Named individually,
    // because the total above would absorb a swap between two of them.
    const picker = code(componentPath("ColourPicker.svelte"));
    for (const selector of [".tick", ".detent.unaffordable", ".home"]) {
      expect(
        rulesOf(picker).find((rule) => rule.selector.trim() === selector)?.body,
        `${selector} paints in accent, which is a ninth entry on the reserved list`,
      ).not.toContain("--color-accent");
    }
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

    // -----------------------------------------------------------------------
    // T2's ghost fill, asserted HERE because the thing it must not do is add a
    // fourth --color-over use. The carrier list above already says the token
    // did not spread; these say the new thing inside one of the carriers did
    // not take it either, and that it does not animate.
    const meter = code(componentPath("BudgetMeter.svelte"));
    const ghost = rulesOf(meter).find(
      (rule) => rule.selector.trim() === ".ghost",
    );
    expect(
      ghost,
      "BudgetMeter.svelte no longer has a .ghost rule",
    ).toBeDefined();
    expect(
      ghost?.body,
      "the ghost is not --color-line-soft, so it is either invisible or on a token it has no claim to",
    ).toContain("var(--color-line-soft)");
    expect(
      ghost?.body,
      "the ghost paints in the alarm red - that is X-01's fourth use, and an unaffordable option is disabled and cannot be hovered anyway",
    ).not.toContain("--color-over");
    expect(
      ghost?.body,
      "the ghost spends accent, which would be a ninth entry on the reserved list",
    ).not.toContain("--color-accent");
    // 10-UI-SPEC 14 lists the ghost at 0 ms DELIBERATELY: it tracks a pointer,
    // and a fill that eased in would arrive after the pointer had moved on and
    // would read as the real value rather than as a forecast.
    expect(
      ghost?.body,
      "the ghost animates - a ghost that eases in lags the pointer and reads as the real value",
    ).toContain("transition: none");
    // And the accent fill drops its own 120 ms for exactly as long as a ghost
    // is on screen, because then it is tracking a pointer too.
    expect(
      rulesOf(meter).find(
        (rule) => rule.selector.trim() === ".fill.forecasting",
      )?.body,
      "the fill keeps its landing transition while a forecast is showing, so it eases under the pointer",
    ).toContain("transition: none");
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
      "the one-line height constant 194 + 48r + 66w + 196p - 4 is not written down - the region's height is no longer auditable",
    ).toContain("194 + 48r + 66w + 196p - 4");
    expect(
      regionRaw,
      "the WRAPPED height constant 246 + 48r + 66w + 196p - 4 is missing - a region reserving only the one-line form is 52px short at 320px and at 375px, where the actions row wraps",
    ).toContain("246 + 48r + 66w + 196p - 4");

    // THE PICKER'S TERM, AND WHY IT IS `p` RATHER THAN A THIRD KNOB COUNT
    // (plan 10-10). The colour knobs are billed at ZERO and one 196px block is
    // billed once, because 10-UI-SPEC §11.2 renders one picker per panel
    // however many colour knobs an entry declares. Billing them one each would
    // over-reserve by 48px on `console`, `strip` and `forge` - the three
    // entries the rule exists for - and would contradict it in the arithmetic
    // while obeying it in the markup.
    expect(
      regionCode,
      "the picker's 196px is not a constant, so the reservation and the block can drift apart",
    ).toContain("PICKER_PX = 196");
    expect(
      regionCode,
      "the rack height still bills every colour knob as a row, so a three-colour entry reserves three pickers",
    ).toContain("colours > 0 ? PICKER_PX : 0");
    // A FLOOR, AND THE WORD `min` IS THE ASSERTION. 192 = 44 head + 8 gap +
    // 140 rails, and it is exact on the fourteen entries with one colour knob.
    // On the seventeen with two or three the head carries a word row whose
    // options are 44px on both axes, and three of those plus the caption plus
    // the lock do not fit a 172px rack at a 320px viewport - measured on
    // `console`: head 92px, selector 140px, content 240px inside a box
    // declared at 192. A fixed height paints that over the next rack row; a
    // floor grows instead. `min-block-size: 192px` also CONTAINS the string
    // "block-size: 192px", which is exactly why this asserts the prefix: an
    // assertion that passes either way would not have noticed the change.
    expect(
      code(componentPath("ColourPicker.svelte")),
      "the picker's block is not the 192px the region reserves 196 for - 44 head + 8 gap + 140 rails, plus the rack's own 4px - or it is fixed rather than a floor, which overlaps the next rack row when a selector wraps",
    ).toContain("min-block-size: 192px");
    expect(
      raw(rack),
      "KnobRack.svelte no longer carries the picker's term in the derivation it owns",
    ).toContain("196p");

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

    // AND THE TWO NUMBERS T2 IS FORBIDDEN TO MOVE. The ghost lives inside the
    // existing 8px bar and the delta is absolutely positioned inside an option
    // it does not resize, so neither the meters block nor Phase 4's region
    // floor changes by a pixel. Both are asserted rather than assumed, because
    // "it lives inside the existing box" is exactly the claim a later tidy-up
    // breaks without noticing.
    expect(
      code(componentPath("ChosenPanel.svelte")),
      "ChosenPanel's 152px region floor moved, so the forecast grew the region after all",
    ).toContain("min-block-size: 152px");
  });

  it("MIX TWO offers four real results, changes nothing until one is clicked, and arrives on opacity alone", () => {
    const mix = code(componentPath("MixTwo.svelte"));
    const rawMix = raw(componentPath("MixTwo.svelte"));
    expect(rawMix.length, "MixTwo.svelte was read").toBeGreaterThan(1000);

    // ---- FOUR REAL BUTTONS IN A GROUP, EACH NAMED FOR WHAT IT WOULD CHANGE
    // (10-UI-SPEC §15). The results are pictures of 81 lights and carry no
    // text of their own, so the accessible name IS what a screen reader gets:
    // four buttons called "Option 1" would be four indistinguishable buttons.
    expect(mix, "the block has no test id").toContain('data-testid="mix-two"');
    expect(
      mix,
      "the results are not indexed test ids, so no test can reach the second one",
    ).toContain('data-testid="mix-child-{at}"');
    expect(
      mix,
      "a result is not a real <button> - a div with a click handler is not reachable by keyboard and is not a control",
    ).toMatch(/<button[^>]*class="child"/);
    expect(
      mix,
      "the results are not in a role=group, which §15 requires so the four are announced as one set",
    ).toContain('role="group"');
    // Labelled BY THE CONTROL THAT PRODUCED IT. §13.4 gives this component
    // four strings; a group label would be a fifth saying what the button
    // above it already says.
    expect(
      mix,
      "the group is unlabelled, or labelled by a fifth string rather than by MIX TWO itself",
    ).toContain("aria-labelledby={mixId}");
    expect(
      mix,
      "a result's accessible name is not composed from what would change",
    ).toContain("aria-label={nameOf(result)}");
    expect(
      mix,
      "nameOf writes its own sentence instead of calling the one composer in copy.ts",
    ).toContain("mixChildName(");

    // ---- THE COPY IS IMPORTED, NEVER TRANSCRIBED. This is what closes A-15's
    // loop: every word this component renders comes from copy.ts, and
    // copy.spec.ts scans every string copy.ts can produce for the genetics
    // vocabulary by stem. A transcribed literal here would escape that scan.
    for (const [name, text] of [
      ["MIX_TWO", MIX_TWO],
      ["MIX_LINE", MIX_LINE],
      ["MIX_THIS", MIX_THIS],
      ["MIX_THAT", MIX_THAT],
    ] as const) {
      expect(mix, `MixTwo.svelte imports ${name}`).toContain(name);
      expect(
        mix,
        `MixTwo.svelte transcribes ${name} instead of importing it, which puts a rendered string outside copy.spec.ts's metaphor scan`,
      ).not.toContain(`"${text}"`);
    }

    // ---- AND THE SECOND HALF OF A-15, MEASURED ON THIS FILE'S OWN TEXT.
    // Everything between tags, with expressions and the style block removed:
    // whatever is left is literal text the component renders, and it must be
    // empty of the metaphor. `child` is an identifier and `mix-child-0` is a
    // test id - both are code, and neither is text.
    const template = rawMix
      .replace(/<script[^]*?<[/]script>/g, "")
      .replace(/<style>[^]*?<[/]style>/g, "")
      .replace(/<!--[^]*?-->/g, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/[{][^}]*[}]/g, " ")
      .toLowerCase();
    for (const word of [
      "breed",
      "parent",
      "mutat",
      "dna",
      "gene",
      "offspring",
      "child",
    ]) {
      expect(
        template.split(/[^a-z]+/).filter((each) => each.startsWith(word)),
        `MixTwo.svelte renders the word "${word}" as text. A-15: no genetics metaphor reaches the interface - two candidates, four results, one button`,
      ).toEqual([]);
    }

    // ---- NON-DESTRUCTIVE, ASSERTED AS A COUNT RATHER THAN AS A CLAIM. The
    // configuration on the screen survives until a result is clicked, so
    // `ontake` has exactly ONE call site and it is inside `take`. Rolling
    // again and clearing the results change nothing, which is why there is no
    // undo here and nothing to restore.
    expect(
      occurrences(mix, "ontake("),
      "ontake is called from more than one place, so something other than a click on a result changes the configuration",
    ).toBe(1);
    expect(
      mix,
      "the take does not move the previous state into THAT ONE, so the next mix has no second candidate",
    ).toContain("previous = { ...mine }");
    expect(
      mix.slice(mix.indexOf("function roll"), mix.indexOf("function take")),
      "roll() reaches ontake - MIX TWO would then change the configuration by being pressed, and the current state would not survive the mix",
    ).not.toContain("ontake");

    // ---- RANDOMNESS INJECTED. The whole of src/lib/ui/ is walked rather than
    // this one file, because the rule is the directory's: a component that
    // reached for Math.random would make its own behaviour untestable.
    const random = uiFiles().filter((file) =>
      code(file).includes("Math.random"),
    );
    expect(
      random,
      "a component under src/lib/ui/ calls Math.random - randomness is injected, exactly as surpriseIndices and mixIndices both require",
    ).toEqual([]);
    expect(
      mix,
      "the rng is not a prop, so the component owns its own randomness",
    ).toContain("rng: () => number");

    // ---- THE PASTED LINK IS DECODED BY THE MACHINERY THAT ALREADY EXISTS.
    // One lazy import of $lib/share/stamp (test 1 holds the await form), the
    // two functions Phase 5 wrote, and no second format table anywhere.
    expect(
      mix,
      "the pasted link is not decoded by the existing stamp machinery",
    ).toContain("decodeFor(source, payload)");
    expect(mix, "parseHash is not what reads the fragment").toContain(
      "parseHash(",
    );
    expect(
      mix,
      "MixTwo.svelte carries its own format letters, which is a second decoder by another name",
    ).not.toContain("HANGAR_FORMAT");
    expect(
      mix,
      "a stamp this entry's knobs cannot reproduce is refused with a NEW message instead of the landing vocabulary",
    ).toContain("stampUnreadable(entry.name)");

    // ---- SECONDARY TIER, PILL OUTLINE, AND A-41's LIMIT (§10.3, §19.1b).
    // Bordered, never filled: a filled pill is Primary's, and there is one
    // Primary control per panel and it is TRY ON DEVICE.
    const rules = rulesOf(mix);
    const pill = rules.find((rule) => rule.selector.trim() === ".mix-two");
    expect(pill, "MixTwo.svelte no longer has a .mix-two rule").toBeDefined();
    for (const declaration of [
      "border-radius: 999px",
      "border: 1px solid var(--color-line)",
      "background: transparent",
      "padding-inline: 24px",
      "min-inline-size: 44px",
      "min-block-size: 44px",
    ]) {
      expect(
        pill?.body,
        `MIX TWO does not declare "${declaration}" - §19.1b's pill is a fully-rounded 1px outline with a transparent fill and 24px of inline padding, and §10.3 puts MIX TWO in Secondary`,
      ).toContain(declaration);
    }
    // A-41's LIMIT, ASSERTED BY ABSENCE. The pill reaches Primary and
    // Secondary and nothing else; pilling a Quiet control flattens it into
    // Secondary, which is the SAFE-02 regression the tier ladder exists to
    // prevent. Nothing else in this file is rounded to 999px.
    expect(
      rules
        .filter((rule) => rule.body.includes("border-radius: 999px"))
        .map((rule) => rule.selector.trim()),
      "something other than the Secondary control is pilled in MixTwo.svelte - A-41 puts the pill on Primary and Secondary only",
    ).toEqual([".mix-two"]);

    // Both 44px axes on a result, named separately: the file-level
    // includes("44px") walk in the test above passes on the pill alone.
    const child = rules.find((rule) => rule.selector.trim() === ".child");
    expect(child, "MixTwo.svelte no longer has a .child rule").toBeDefined();
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        child?.body,
        `a result does not declare ${axis} - Phase 4's touch floor is both axes per control`,
      ).toContain(axis);
    }

    // ---- THE ARRIVAL: 160 ms, ease-out, OPACITY ONLY (§14). A transform here
    // would be the tear by another name, on a Product surface that renders its
    // own words - which is exactly what §8.4 retired the reroll firing for.
    expect(
      child?.body,
      "the results do not arrive on the 160 ms ease-out §14 gives them",
    ).toContain("animation: mix-arrive 160ms ease-out");
    const arrival = rawMix.slice(rawMix.indexOf("@keyframes mix-arrive"));
    const frames = arrival.slice(0, arrival.indexOf("@media"));
    expect(frames, "the arrival keyframes were found").toContain("opacity: 0");
    for (const forbidden of ["transform", "translate", "scale", "clip-path"]) {
      expect(
        frames,
        `the arrival declares "${forbidden}". §14 gives MIX TWO's results opacity and nothing else, and §8.4 retired the reroll firing by name: a clip-path or a translate on the tune panel would move and clip its own text`,
      ).not.toContain(forbidden);
      expect(
        child?.body,
        `the .child rule declares "${forbidden}", which puts the motion back beside the rule that forbids it`,
      ).not.toContain(forbidden);
    }
    expect(
      mix,
      "the reduced-motion override is gone, so a visitor who asked for less motion still gets the fade",
    ).toContain("@media (prefers-reduced-motion: reduce)");

    // ---- AND THE TWO TOKENS THIS FILE MAY NOT SPEND. A-44 makes the
    // --font-mono list SEVEN with six spent, and the seventh is reserved for
    // §19.1c's metadata block; nothing here is a number that moves under a
    // pointer. --color-over is X-01's three uses, all of them a meter or a
    // message.
    expect(
      mix,
      "MixTwo.svelte spends a --font-mono use. A-44 reserves the seventh for §19.1c's metadata block, and this component displays no number that changes as a pointer moves",
    ).not.toContain("--font-mono");
    expect(
      mix,
      "MixTwo.svelte reaches for the alarm red. X-01 scopes it to three uses and all three belong to a meter or a message",
    ).not.toContain("--color-over");
  });

  it("MIX TWO's four results are the last four canvases in the budget: six on the worst entry, not eight", () => {
    const mix = code(componentPath("MixTwo.svelte"));
    const picker = code(componentPath("ColourPicker.svelte"));

    // RECONCILED AGAINST 10-10's RECORDED NUMBER RATHER THAN RECOUNTED. That
    // plan asserted the picker declares exactly ONE PadCanvas however many
    // colour knobs an entry carries (colour-picker.spec.ts test 6, "the picker
    // contributes exactly one canvas, so the worst entry shows six rather than
    // eight"), and recorded the budget for this plan to build on. Re-reading
    // the picker here is what makes the reconciliation real: if it grew a
    // second pad, six would be seven and this test says so.
    expect(
      occurrences(picker, "<PadCanvas"),
      "the picker declares more than one result pad, so 10-10's recorded budget no longer holds and six is not six",
    ).toBe(1);

    // The mix declares ONE PadCanvas inside a loop over the four results, so
    // the instance count is MIX_CHILDREN and the constant is what is counted -
    // a hard-coded 4 here would agree with a component that had stopped
    // looping over four.
    expect(
      occurrences(mix, "<PadCanvas"),
      "the results do not render one pad each from one declaration",
    ).toBe(1);
    expect(
      mix,
      "the results are not a loop over what mixIndices returned",
    ).toContain("{#each results as result, at (at)}");
    expect(MIX_CHILDREN, "MIX TWO no longer produces four results").toBe(4);

    const HERO = 1;
    const PICKER_RESULT = 1;
    const worstColourKnobs = 3;
    expect(
      HERO + PICKER_RESULT + MIX_CHILDREN,
      "the six-canvas budget moved. §11.6 costs MIX TWO at four beside the hero and the picker's ONE result - the parents are text on purpose, because two more canvases would be eight and THIS ONE is already running as the hero six centimetres up the same panel",
    ).toBe(6);
    expect(
      HERO + worstColourKnobs + MIX_CHILDREN,
      "one picker per KNOB would be eight on console, forge and strip, which is what §11.2's one-picker-per-panel rule bought",
    ).toBe(8);

    // EVERY ONE IS IntersectionObserver-GATED, and that is a property of the
    // host rather than of this component: a canvas is painted only once
    // `SimHost.register` has adopted it, and the host gates every registered
    // canvas on one observer. So the assertion has two halves - the results
    // hand their elements up, and the thing they are handed to is the gate.
    expect(
      mix,
      "a result pad does not hand its element upward, so nothing can register it and nothing can gate it",
    ).toContain("onready={onchild}");
    expect(
      code("src/lib/sim/host.ts"),
      "the host no longer gates registered canvases on an IntersectionObserver, so 'every one is gated' is no longer true of anything",
    ).toContain("new IntersectionObserver(");

    // Rendered only when a consumer supplies the hop - the picker's own rule,
    // for the picker's own reason. An unregistered canvas has no backing store
    // and paints nothing, and four empty boxes claiming to show four
    // configurations would be worse than none.
    expect(
      mix,
      "the results render their pads unconditionally, so a page with no SimHost shows four empty boxes",
    ).toMatch(/[{]#if onchild[}]/);
    expect(
      picker,
      "the picker stopped gating its result pad on a supplied consumer, so the two components no longer answer the missing hop the same way",
    ).toMatch(/[{]#if onresult[}]/);

    // FOUR DISTINCT IDS, AND NONE OF THEM THE HERO'S. register() unregisters
    // whatever holds the id first, so a result sharing the hero's id would
    // blank the hero - the failure 10-10 avoided with `-colour-result`.
    expect(
      mix,
      "the result pads do not carry their own registration ids, so they collide with each other or with the hero",
    ).toContain("`${entry.id}-mix-${at}`");
  });
});
