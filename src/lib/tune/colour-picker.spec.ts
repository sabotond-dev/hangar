// The colour picker's gate: six tests, and every one of them is a property of
// the SOURCE or of pure arithmetic, so none of them needs a browser.
//
// It lives under src/lib/tune/ rather than beside the component because three
// of the six have to import the vendored compiler - `colourAt`, `colourIndexOf`
// and `COLOUR_LATTICE_SIZE` are the real lattice, and the picker's own copy of
// that arithmetic is only trustworthy if something holds the two together. A
// spec may import the compiler freely; a spec is never bundled.
//
// EVERY SOURCE SCAN STRIPS COMMENTS FIRST, and that is load-bearing rather than
// tidy: ColourPicker.svelte's header names all six forbidden shapes out loud, so
// a scan over raw source would go red on correct code and the natural fix would
// be deleting the documentation that makes the rule survivable. The stripper and
// the non-vacuity habit are src/lib/config-shape.spec.ts's, copied rather than
// reinvented, and every regular expression here is backslash-free in the same
// house style.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog";
import { stampKnobs } from "../share/stamp";
import {
  COLOUR_BLUE_RAIL,
  COLOUR_CAPTION,
  COLOUR_CHEAP_STEPS,
  COLOUR_GREEN_RAIL,
  COLOUR_RED_RAIL,
  COLOUR_UNAFFORDABLE,
  COLOUR_WHICH,
  colourRailName,
} from "./copy";
// The real lattice. Restated in view.ts because a file src/lib/ui/ may name
// cannot import the compiler; held against the real thing here.
import {
  COLOUR_LATTICE_SIZE as VENDORED_LATTICE_SIZE,
  colourAt,
  colourIndexOf,
} from "./knobs.preset";
import {
  COLOUR_CHANNELS,
  COLOUR_LATTICE_SIZE,
  COLOUR_RAIL_STEP,
  COLOUR_RAIL_STEPS,
  colourChannel,
  colourCheapLevel,
  colourLevels,
  colourLiteralLength,
  colourPosition,
  colourRail,
  colourRailMax,
  colourValueText,
  isColourLattice,
  widgetFor,
} from "./view";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const PICKER = "src/lib/ui/ColourPicker.svelte";
const KNOB = "src/lib/ui/Knob.svelte";
const RACK = "src/lib/ui/KnobRack.svelte";
const SWATCH = "src/lib/ui/Swatch.svelte";

/** The house comment stripper: line, block and markup. */
const stripComments = (source: string) =>
  source
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));

const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1;

/** A style block split into rules. tune-ui.spec.ts's, copied not reinvented. */
function rulesOf(source: string): { selector: string; body: string }[] {
  const start = source.indexOf("<style>");
  if (start < 0) return [];
  const out: { selector: string; body: string }[] = [];
  for (const match of source.slice(start).matchAll(/([^{}]+)[{]([^{}]*)[}]/g)) {
    out.push({ selector: match[1].trim(), body: match[2] });
  }
  return out;
}

const ruleFor = (source: string, selector: string) =>
  rulesOf(source).find((rule) => rule.selector.trim() === selector);

/** Every colour knob an entry declares, in rack order, on either route. */
const colourKnobsOf = (entryId: string) => {
  const entry = CATALOG.find((each) => each.id === entryId);
  if (!entry) throw new Error(`no catalog entry: ${entryId}`);
  return stampKnobs(entry).filter(
    (knob) => widgetFor(knob.kind, knob.options) === "colour",
  );
};

describe("the colour picker (10-UI-SPEC §11.2, TUNE-01, TUNE-05)", () => {
  it("every detent is a stored, reachable RGB444 colour, and the picker's arithmetic IS the lattice knob's", () => {
    // -----------------------------------------------------------------------
    // 1. THE TIE. view.ts restates the lattice because D-18 forbids a file
    // src/lib/ui/ may name from importing the compiler - by specifier text, so
    // even a type-only import fails. That restatement is only worth anything
    // if something holds it against `quantiseColour`'s real arithmetic, and
    // this is that something: all 4,096 positions, both directions.
    expect(
      COLOUR_LATTICE_SIZE,
      "view.ts's lattice size has drifted from knobs.preset.ts's",
    ).toBe(VENDORED_LATTICE_SIZE);
    expect(COLOUR_LATTICE_SIZE).toBe(4096);
    expect(COLOUR_RAIL_STEPS ** 3).toBe(COLOUR_LATTICE_SIZE);

    let walked = 0;
    for (let position = 0; position < COLOUR_LATTICE_SIZE; position += 1) {
      const vendored = colourAt(position);
      const levels = colourLevels(position);
      expect(
        [
          colourChannel(levels[0]),
          colourChannel(levels[1]),
          colourChannel(levels[2]),
        ],
        `position ${position}: the picker's channels are not the lattice knob's`,
      ).toEqual([vendored.r, vendored.g, vendored.b]);
      expect(
        colourPosition(levels),
        `position ${position}: levels do not compose back to the position`,
      ).toBe(position);
      expect(
        colourIndexOf(vendored),
        `position ${position}: the vendored round trip disagrees`,
      ).toBe(position);
      walked += 1;
    }
    expect(walked, "the whole lattice was walked").toBe(4096);

    // -----------------------------------------------------------------------
    // 2. THE FILLS. Every detent of every rail, sampled across the space: a
    // multiple of 17 on all three channels, inside 0..255, and equal to the
    // colour `colourAt` gives that composed position. This is what "a flat
    // fill of an exact stored RGB444 value" means, checked rather than
    // asserted in prose.
    const SAMPLES = [0, 95, 1638, 2730, 4095, 273, 3822];
    let detents = 0;
    for (const at of SAMPLES) {
      for (let axis = 0; axis < 3; axis += 1) {
        const rail = colourRail(axis as 0 | 1 | 2, at);
        expect(rail, `axis ${axis} at ${at}`).toHaveLength(COLOUR_RAIL_STEPS);
        for (const detent of rail) {
          const truth = colourAt(detent.position);
          expect(
            [...detent.rgb],
            `axis ${axis}, level ${detent.level} at ${at}: the detent is not the colour that index produces`,
          ).toEqual([truth.r, truth.g, truth.b]);
          for (const channel of detent.rgb) {
            expect(
              channel % COLOUR_RAIL_STEP,
              `a detent channel (${channel}) is not a multiple of 17, so it is a colour the state cannot hold`,
            ).toBe(0);
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(255);
          }
          detents += 1;
        }
        // The other two rails are held where they stand - which is what makes
        // a rail repaint when either of them moves.
        const held = colourLevels(at);
        for (const detent of rail) {
          const levels = colourLevels(detent.position);
          for (let other = 0; other < 3; other += 1) {
            if (other === axis) continue;
            expect(
              levels[other],
              `axis ${axis}: the detent moved a channel it does not own`,
            ).toBe(held[other]);
          }
        }
      }
    }
    expect(detents, "every sampled rail's sixteen detents were checked").toBe(
      SAMPLES.length * 3 * COLOUR_RAIL_STEPS,
    );

    // -----------------------------------------------------------------------
    // 3. THE COMPONENT SPENDS NO ARITHMETIC OF ITS OWN. Every fill goes
    // through the lattice; a local `Math.round(v / 17) * 17` or a hand-typed
    // table would drift from the state model on the day _pad.ts moves the
    // step, silently and on a shared link.
    const picker = code(PICKER);
    expect(picker.length, "ColourPicker.svelte was read").toBeGreaterThan(2000);
    expect(picker, "the picker does not use the lattice at all").toContain(
      "colourRail",
    );
    expect(
      picker,
      "the picker rounds a channel itself instead of going through the lattice",
    ).not.toContain("17");
    expect(
      picker,
      "the picker composes a position by hand instead of through colourPosition",
    ).toContain("colourPosition");
  });

  it("the fence: none of A-09's six forbidden shapes appears, and rgb() is carved out to the detents", () => {
    const source = code(PICKER);

    // NON-VACUITY FIRST, in three ways: the file was found, it declares
    // something, and it really does contain the one construct the carve-out
    // below is about. Without the third, "every rgb() is on a detent line"
    // passes on a file with no fills at all.
    expect(source.length, "ColourPicker.svelte was read").toBeGreaterThan(2000);
    expect(
      occurrences(source, ":"),
      "the picker declares fewer than twenty things - the scan has nothing to discriminate against",
    ).toBeGreaterThan(20);
    expect(
      occurrences(source, "rgb("),
      "the picker paints no rgb() at all, so the carve-out below proves nothing",
    ).toBeGreaterThan(0);

    const NAMED =
      "A-09: an HSV field, a hue ring, a saturation/value square, a continuous slider, a CSS gradient on a rail and <input type=color> are each forbidden BY NAME, for the same reason - every one of them authors colour in CSS and every one of them implies a resolution the state does not have";

    // 1. No gradient of any kind, including the repeating forms.
    const gradients = [
      "linear-gradient",
      "radial-gradient",
      "conic-gradient",
      "repeating-linear-gradient",
      "repeating-radial-gradient",
      "repeating-conic-gradient",
    ].filter((name) => source.includes(name));
    expect(gradients, `the picker declares a gradient. ${NAMED}`).toEqual([]);

    // 2. No colour input.
    expect(source, `the picker uses a colour input. ${NAMED}`).not.toContain(
      'type="color"',
    );

    // 3. No filter of any kind, in the style block or out of it.
    expect(
      /filter[ ]*:/.test(source),
      `the picker declares a filter. ${NAMED}`,
    ).toBe(false);
    expect(source).not.toContain("backdrop-filter");

    // 4. No colour function but the plain three-channel one.
    const spaces = ["hsl(", "hsla(", "hwb(", "lab(", "lch(", "oklab(", "oklch("]
      .concat(["color("])
      .filter((fn) => source.includes(fn));
    expect(
      spaces,
      `the picker names a colour space that is not the one the firmware stores. ${NAMED}`,
    ).toEqual([]);

    // 5. The NAME check, and it is secondary to the four above it: those four
    // are what the rule actually forbids, and this catches a shape that
    // smuggled itself in under a different declaration.
    //
    // OVER NAMES, NOT OVER THE WHOLE FILE, and that is a correction rather
    // than a convenience: a substring scan for `ring` matches the word
    // `string` in every TypeScript annotation in the component, so the check
    // would have been red on correct code from its first run. What A-09 talks
    // about is "an element whose class or testid suggests a hue ring", so the
    // haystack is the class names, the testids and the CSS selectors.
    const declaredNames: string[] = [];
    for (const match of source.matchAll(/class(:|[ ]*=[ ]*")([^"= />]+)/g)) {
      declaredNames.push(match[2]);
    }
    for (const match of source.matchAll(/data-testid[ ]*=[ ]*"([^"]*)"/g)) {
      declaredNames.push(match[1]);
    }
    for (const rule of rulesOf(source)) declaredNames.push(rule.selector);
    const haystack = declaredNames.join(" ").toLowerCase();
    expect(
      declaredNames.length,
      "no class, testid or selector was collected, so the name check below reads an empty string",
    ).toBeGreaterThan(20);
    expect(
      haystack,
      "the name collector no longer finds the picker's own detent class",
    ).toContain("detent");
    const names = ["hue", "wheel", "ring", "saturation", "value-square"].filter(
      (word) => haystack.includes(word),
    );
    expect(
      names,
      `the picker names a hue ring, an SV square or an HSV field. This is a SECONDARY check - the four assertions above it are the rule; this one catches a shape that arrived under another declaration. ${NAMED}`,
    ).toEqual([]);

    // 6. THE ONE CARVE-OUT. rgb() is permitted, and only where A-09 permits
    // it: a detent fill or the result. Expressed as a property of the LINE, so
    // a fill that wandered into the chrome is named with its line.
    const strays = source
      .split("\n")
      .filter((line) => line.includes("rgb("))
      .filter((line) => !/detent|result/i.test(line));
    expect(
      strays,
      "an rgb() in the picker is not on a detent or result line - A-09's exemption covers the picker's detents and its result pad, and nothing else",
    ).toEqual([]);

    // And the ninth token is not here either: a knob is never red, and an
    // unaffordable colour is absent rather than alarming.
    expect(
      source,
      "the picker names the alarm red, which would be X-01's fourth use",
    ).not.toContain("--color-error-ink");
  });

  it("the cheap-step ticks are derived from the literal, and share the default marker's shape", () => {
    // THE RULE, STATED: a step is marked when its channel literal is one or
    // two digits, plus 255 - the top of the rail, marked because a visitor
    // reaching for full brightness should not have to learn that it is the
    // expensive end. Derived from the literal length rather than listed, so a
    // step rule change moves the marks with it.
    const derived: number[] = [];
    for (let level = 0; level < COLOUR_RAIL_STEPS; level += 1) {
      const value = colourChannel(level);
      if (String(value).length <= 2 || value === 255) derived.push(value);
    }
    expect(
      derived,
      "the derivation itself is wrong - these are the one- and two-digit channel values plus 255",
    ).toEqual([0, 17, 34, 51, 68, 85, 255]);

    const marked: number[] = [];
    for (let level = 0; level < COLOUR_RAIL_STEPS; level += 1) {
      if (colourCheapLevel(level)) marked.push(colourChannel(level));
    }
    expect(
      marked,
      "the shipped tick set is not the derived one, so the marks are a hand list rather than a rule",
    ).toEqual(derived);
    expect(
      marked.length,
      "seven of the sixteen steps are marked - fewer would say nothing, more would say everything",
    ).toBe(7);

    // The literal-length arithmetic the rule and the guard both rest on: the
    // whole lattice is worth SIX characters, five at `0,0,0` and eleven at
    // `102,102,102`.
    expect(colourLiteralLength(0), "0,0,0 is five characters").toBe(5);
    expect(
      colourLiteralLength(colourPosition([6, 6, 6])),
      "102,102,102 is eleven characters",
    ).toBe(11);
    let dearest = 0;
    for (let at = 0; at < COLOUR_LATTICE_SIZE; at += 1) {
      dearest = Math.max(dearest, colourLiteralLength(at));
    }
    expect(
      dearest - colourLiteralLength(0),
      "the lattice is no longer worth six characters, which moves both the tick rule and the guard",
    ).toBe(6);

    // THE SHAPE IS SHARED, NOT RE-DECLARED. The tick is the 2px round mark
    // Knob.svelte already draws for a default position, one rung up the ink
    // ladder - so it is a mark a visitor has already learnt.
    const tick = ruleFor(code(PICKER), ".tick");
    const home = ruleFor(code(KNOB), ".home");
    expect(
      tick,
      "ColourPicker.svelte no longer has a .tick rule",
    ).toBeDefined();
    expect(home, "Knob.svelte no longer has a .home rule").toBeDefined();
    const geometry = (body: string) =>
      body
        .split(";")
        .map((line) => line.trim())
        .filter((line) => /inline-size|block-size|border-radius/.test(line))
        .sort();
    expect(
      geometry(tick?.body ?? ""),
      "the tick is not the same 2px round mark as the default marker, so it is a second shape a visitor has to learn",
    ).toEqual(geometry(home?.body ?? ""));
    expect(
      tick?.body,
      "the tick is not --color-boundary, so it is either invisible or on a token it has no claim to",
    ).toContain("var(--color-boundary)");
    expect(
      tick?.body,
      "the tick spends accent - the reserved list stays at eight and a tick is information, not a selection",
    ).not.toContain("--color-action");
  });

  it("the unaffordable guard fires on a synthetic near-wall entry and is measured at zero on the shelf", () => {
    // -----------------------------------------------------------------------
    // THE PROOF, on a synthetic budget rather than on a real card, because no
    // colour-bearing card is anywhere near the wall (see the measurement
    // below). The synthetic is `tpad`'s own measured worst state given a
    // colour knob: SETUP AT 907 OF 908, one character free. That is not an
    // invented number - 10-08 measured `tpad` at exactly 907, and the only
    // reason the guard has never fired on the shelf is that `tpad` has no
    // colour knob to fire on.
    //
    // At `0,0,0` the current literal is five characters. One rail's whole
    // spread is TWO characters - one digit to three - so with one free the
    // two-digit steps still fit and every three-digit step is out. (The whole
    // LATTICE is worth six because three rails move independently; a single
    // rail is worth two, and conflating the two numbers is the easiest
    // mistake to make here.)
    const CURRENT = colourPosition([0, 0, 0]);
    const NEAR_WALL = { free: 1, copies: 1 };
    const rail = colourRail(0, CURRENT, NEAR_WALL);

    const excluded = rail.filter((detent) => !detent.affordable);
    expect(
      excluded.map((detent) => detent.level),
      "the guard does not fire one character from the wall - a rail that cannot exclude anything is not a guard",
    ).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(
      excluded.length,
      "ten of the sixteen steps are the three-digit ones, and those are exactly the ones a single character cannot buy",
    ).toBe(10);
    for (const detent of excluded) {
      expect(
        colourLiteralLength(detent.position) - colourLiteralLength(CURRENT),
        `level ${detent.level} was excluded but fits`,
      ).toBeGreaterThan(NEAR_WALL.free);
    }
    for (const detent of rail.filter((d) => d.affordable)) {
      expect(
        colourLiteralLength(detent.position) - colourLiteralLength(CURRENT),
        `level ${detent.level} was offered but does not fit`,
      ).toBeLessThanOrEqual(NEAR_WALL.free);
    }

    // ABSENT AS A COLOUR, PRESENT AS A POSITION. The rail still draws sixteen
    // detents; the CONTROL's own max stops below the excluded ones, which is
    // what makes the exclusion real rather than decorative and what makes the
    // platform announce it. The exclusion is always a suffix, and that is
    // arithmetic rather than luck: a channel's digit count is monotonic in its
    // level, so there is never a hole.
    expect(
      rail,
      "the rail lost detents instead of disabling them",
    ).toHaveLength(COLOUR_RAIL_STEPS);
    expect(
      colourRailMax(rail),
      "the rail's max does not stop below the excluded steps, so the exclusion is paint only",
    ).toBe(5);
    expect(
      colourRailMax(colourRail(0, CURRENT)),
      "an unmeasured budget excludes something - the picker must offer the whole lattice until a number says otherwise",
    ).toBe(COLOUR_RAIL_STEPS - 1);

    // The paint, and the absence of an adjacent reason line. X-17's precedent
    // and 05.1's disabled chip: the meter two centimetres away is the cause,
    // and a sentence beside the rail would be a third place saying 908.
    const picker = code(PICKER);
    const rule = ruleFor(picker, ".detent.unaffordable");
    expect(
      rule,
      "ColourPicker.svelte no longer has a .detent.unaffordable rule, so an excluded colour looks like an available one",
    ).toBeDefined();
    expect(
      rule?.body,
      "an excluded detent is not painted in --color-workspace",
    ).toContain("var(--color-workspace)");
    expect(
      rule?.body,
      "an excluded detent has no 1px --color-divider hairline, so it reads as a hole rather than as a position",
    ).toMatch(/1px var[(]--color-divider[)]/);
    expect(
      picker,
      "the exclusion is announced only in the paint - it needs the visually-hidden sentence, which is what makes it audible",
    ).toContain("COLOUR_UNAFFORDABLE");
    expect(
      picker,
      "the picker transcribes the exclusion sentence instead of importing it",
    ).not.toContain(`"${COLOUR_UNAFFORDABLE}"`);
    // No ADJACENT reason line: the sentence is sr-only and it is wired by
    // aria-describedby, never rendered as visible prose beside the rail.
    // Every RENDER of the sentence - an interpolation, not the import - has to
    // be inside a visually-hidden element.
    const visibleReason = picker
      .split("\n")
      .filter((line) => line.includes("{COLOUR_UNAFFORDABLE}"))
      .filter((line) => !line.includes("sr-only"));
    expect(
      picker,
      "the sentence is never rendered at all, so the scan below has nothing to discriminate against",
    ).toContain("{COLOUR_UNAFFORDABLE}");
    expect(
      visibleReason,
      "the exclusion has an adjacent visible reason line. X-17's precedent: the meter two centimetres away is the cause, and a third sentence saying 908 is noise",
    ).toEqual([]);

    // -----------------------------------------------------------------------
    // THE MEASUREMENT, on the real shelf: the guard NEVER FIRES. This is the
    // honest sentence - not "a colour picker where some colours are greyed out
    // because they cost too many characters" but "a colour picker that CAN say
    // that, and that today never has to". The machinery ships because it makes
    // the claim checkable, because the Lua route's hand-authored templates have
    // far less headroom, and because the catalog grows.
    //
    // 10-08's reachability sweep measured the numbers this rests on: the
    // dearest colour-bearing preset is `ninepads` at 640 of 908, leaving 268
    // free, and ZERO of Pass B's 24,576 colour states crosses the wall. The
    // whole lattice is worth six characters per copy, and `ninepads` is the one
    // card that emits its colour twice - so the worst demand any colour can
    // make of any card on the shelf is TWELVE characters against 268.
    const NINEPADS_WORST = 640;
    const NINEPADS_FREE = 908 - NINEPADS_WORST;
    const WORST_COPIES = 2;
    expect(NINEPADS_FREE, "10-08 measured 268 characters free").toBe(268);

    let checked = 0;
    let unaffordable = 0;
    for (const entry of CATALOG) {
      for (const knob of colourKnobsOf(entry.id)) {
        if (!isColourLattice(knob.options)) continue;
        const budget = { free: NINEPADS_FREE, copies: WORST_COPIES };
        for (let axis = 0; axis < 3; axis += 1) {
          for (const detent of colourRail(
            axis as 0 | 1 | 2,
            knob.default,
            budget,
          )) {
            if (!detent.affordable) unaffordable += 1;
            checked += 1;
          }
        }
      }
    }
    expect(
      checked,
      "no lattice colour knob was found on the shelf, so the count of zero below means nothing",
    ).toBe(6 * 3 * COLOUR_RAIL_STEPS);
    expect(
      unaffordable,
      `the guard now FIRES on the shelf. 10-08 measured ninepads at ${NINEPADS_WORST} of 908 - ${NINEPADS_FREE} free - against a lattice worth six characters per copy and at most ${WORST_COPIES} copies, so twelve against ${NINEPADS_FREE}. If this is no longer zero, either the minifier got worse or a card got dearer, and docs/PIN-POLICY.md item 4 is the document that says so`,
    ).toBe(0);
  });

  it("the selector is rendered only when an entry has more than one colour knob, and the shelf splits 12 / 6 / 3 / 5", () => {
    // RECOUNTED FROM THE CATALOG, never from a literal list, because the split
    // is a fact about the shipped tree and a list is a copy of it that rots.
    const split = { none: 0, two: 0, three: 0, noPicker: 0 };
    const three: string[] = [];
    for (const entry of CATALOG) {
      const colours = colourKnobsOf(entry.id).length;
      if (colours === 0) split.noPicker += 1;
      else if (colours === 1) split.none += 1;
      else if (colours === 2) split.two += 1;
      else {
        split.three += 1;
        three.push(entry.id);
      }
    }
    // RE-RECORDED BY PLAN 11-01, which removed nine hand-authored entries: the
    // split was 14 / 14 / 3 / 5 over thirty-six. Seven of the nine declared two
    // colour knobs and two declared one, so `two` fell by seven and `none` by
    // two, and `three` and `noPicker` did not move at all - console, forge and
    // strip all survived, and so did both entries with no colour knob.
    //
    // THIS FILE IS NOT IN 11-01-PLAN.md'S BLAST-RADIUS TABLE. Found by running
    // the suite; reported in 11-01-SUMMARY.md rather than quietly absorbed. It
    // is not in 11-15-PLAN.md's either, and it was found the same way.
    //
    // RE-RECORDED BY PLAN 11-15, which added WHEELS - a pitch wheel, a mod
    // wheel and the divider between them, so THREE colour knobs. `three` 3 to
    // 4 and the catalog 27 to 28; nothing else moved. WHEELS is therefore one
    // of the four worst cases the six-canvas colour-rail budget is measured
    // against, and it is the first entry to join that list since it was
    // written.
    //
    // RE-RECORDED BY PLAN 11-14, which added RADAR POINTS under the user's
    // answer `new-entry` - SONAR's rack reused openly, so ONE colour knob, the
    // ping colour. `none` 12 to 13 and the catalog 28 to 29; nothing else
    // moved. Not in 11-14-PLAN.md's file list either; found the same way.
    //
    // RE-RECORDED BY PLAN 12-04, THE FIRST WAVE TO MOVE THREE OF THE FOUR
    // BUCKETS AT ONCE, and the first to shrink `three`. The bench removed
    // LATTICE (one colour knob), SHUTTLE (two) and FORGE (three), so `none`
    // 13 to 12, `two` 7 to 6, `three` 4 to 3 and `noPicker` unmoved at 5; the
    // catalog 29 to 26. FORGE leaving takes one of the four worst cases the
    // six-canvas colour-rail budget is measured against out of the catalog.
    //
    // RE-RECORDED BY PLAN 12-10, which moved one entry between two buckets
    // without moving the denominator: the `tpad` preset (no colour knob) left
    // the catalog and the hand-authored TRACKPAD (one colour knob, the edge
    // flash's) replaced it as the card, so `noPicker` 5 to 4 and `none` 12 to
    // 13; `two` and `three` unmoved, the catalog still 26.
    expect(
      split,
      "the colour-knob split moved. 13 entries render no selector (one colour knob), 6 render two options, 3 render three, and 4 have no picker at all",
    ).toEqual({ none: 13, two: 6, three: 3, noPicker: 4 });
    expect(
      three.sort(),
      "the three-colour entries are console, strip and wheels - the worst case the six-canvas budget is measured against",
    ).toEqual(["console", "strip", "wheels"]);
    expect(
      CATALOG.length,
      "the catalog is no longer 26 entries, so the split above is a different denominator",
    ).toBe(split.none + split.two + split.three + split.noPicker);

    // THE PRESENCE RULE, IN BOTH DIRECTIONS, as a property of the source: the
    // selector exists only above one knob, and the caption carries the knob's
    // own label when it does not.
    const picker = code(PICKER);
    expect(
      picker,
      "the selector is not gated on the knob count, so a single-colour entry renders a radiogroup of one",
    ).toContain("knobs.length > 1");
    expect(
      picker,
      "the selector is not gated by `manyKnobs`, so the rule above is declared and not used",
    ).toMatch(/[{]#if manyKnobs[}]/);
    expect(
      picker,
      "a single-colour entry gets no label at all where the selector would have been",
    ).toContain("knob-label");
    expect(
      picker,
      "the selector's group label is missing, so a radiogroup ships unnamed",
    ).toContain("COLOUR_WHICH");

    // -----------------------------------------------------------------------
    // THE SEVEN STRINGS, COUNTED BY SCRIPT rather than by eye. copy.spec.ts
    // holds them character-for-character; these are the numbers the UI spec
    // gives them.
    const counts = {
      COLOUR_CAPTION: [...COLOUR_CAPTION].length,
      COLOUR_WHICH: [...COLOUR_WHICH].length,
      COLOUR_RED_RAIL: [...COLOUR_RED_RAIL].length,
      COLOUR_GREEN_RAIL: [...COLOUR_GREEN_RAIL].length,
      COLOUR_BLUE_RAIL: [...COLOUR_BLUE_RAIL].length,
      COLOUR_CHEAP_STEPS: [...COLOUR_CHEAP_STEPS].length,
      COLOUR_UNAFFORDABLE: [...COLOUR_UNAFFORDABLE].length,
    };
    expect(counts, "a picker string is no longer its stated length").toEqual({
      COLOUR_CAPTION: 6,
      COLOUR_WHICH: 12,
      COLOUR_RED_RAIL: 13,
      COLOUR_GREEN_RAIL: 15,
      COLOUR_BLUE_RAIL: 14,
      COLOUR_CHEAP_STEPS: 40,
      COLOUR_UNAFFORDABLE: 57,
    });

    // THE PREFIXED FORM IS COMPOSED, NOT A LITERAL. Seventeen entries carry
    // more than one colour knob and seventeen different labels; writing the
    // prefixed names down would be fifty-one sentences that drift from the
    // catalog.
    expect(colourRailName("r"), "the bare form is not the constant").toBe(
      COLOUR_RED_RAIL,
    );
    expect(
      colourRailName("r", "Mute"),
      "the prefixed rail name is not composed from the knob's own label",
    ).toBe("Mute red, 16 steps");
    expect(colourRailName("g", "Rail")).toBe("Rail green, 16 steps");
    expect(colourRailName("b", "Level")).toBe("Level blue, 16 steps");
    expect(
      picker,
      "the picker writes a prefixed rail name itself instead of calling the one composer",
    ).toContain("colourRailName(");
    expect(picker).not.toContain(`"${COLOUR_RED_RAIL}"`);
  });

  it("the picker contributes exactly one canvas, so the worst entry shows six rather than eight", () => {
    const picker = code(PICKER);
    const rack = code(RACK);

    // ONE PICKER PER PANEL, NOT ONE PER KNOB (10-UI-SPEC §11.2). The rack
    // takes the colour knobs OUT of its row list and renders one block in the
    // place of the first of them.
    expect(
      rack,
      "the rack does not gather the colour knobs, so it is still drawing one row each",
    ).toContain('knobs.filter((k) => k.widget === "colour")');
    // Since 13-09 the rack renders the SWATCH block once, and the swatch block
    // renders the picker once, inside its popover (Bible section 7).
    expect(
      occurrences(rack, "<Swatch"),
      "the rack renders more than one swatch block",
    ).toBe(1);
    expect(
      occurrences(code(SWATCH), "<ColourPicker"),
      "the swatch block renders more than one picker",
    ).toBe(1);
    expect(
      rack,
      "the picker is not gated to the first colour knob's slot, so a three-colour entry renders three of them",
    ).toContain("row.id === pickerAt");

    // AND THE PICKER CONTRIBUTES EXACTLY ONE CANVAS. The pad is the entry: a
    // three-colour configuration has one appearance, not three.
    expect(
      occurrences(picker, "<PadCanvas"),
      "the picker declares more than one result pad - one per colour knob is what one-picker-per-panel exists to prevent",
    ).toBe(1);

    // THE BUDGET, RECORDED FOR 10-11 TO BUILD ON. `console`, `strip` and
    // `forge` each declare three colour knobs, and each shows: the hero, the
    // picker's one result, and four more only while MIX TWO's children are
    // showing. SIX at most, not eight, and that difference is exactly what one
    // picker per panel bought.
    const HERO = 1;
    const PICKER_RESULT = 1;
    const MIX_TWO_CHILDREN = 4;
    const worst = colourKnobsOf("console").length;
    expect(worst, "console no longer declares three colour knobs").toBe(3);
    expect(
      HERO + PICKER_RESULT + MIX_TWO_CHILDREN,
      "the six-canvas budget moved",
    ).toBe(6);
    expect(
      HERO + worst + MIX_TWO_CHILDREN,
      "one picker per KNOB would be eight, which is what this rule exists to avoid",
    ).toBe(8);

    // The pad is registered by whoever owns the page's SimHost, gated by the
    // same IntersectionObserver as every other pad, and it is rendered only
    // when a driver has asked for it - an unregistered canvas paints nothing,
    // and an empty box claiming to show the truth about a colour is worse than
    // no box.
    expect(
      picker,
      "the result pad does not hand its element upward, so nothing can register it",
    ).toContain("onready={onresult}");
    expect(
      picker,
      "the result pad renders unconditionally, so a page with no SimHost shows an empty box",
    ).toMatch(/[{]#if onresult[}]/);
    expect(
      picker,
      "the result pad shares the hero's registration id, which would unregister the hero",
    ).toContain("-colour-result");

    // -----------------------------------------------------------------------
    // THE ANNOUNCEMENT, riding here because it is the other half of "what the
    // picker says about the colour it is showing": THREE STORED INTEGERS,
    // NEVER A HEX. A hex is a number the state does not hold, written in a
    // base the firmware never sees, and it implies 24 bits of resolution the
    // pad cannot reach.
    // THE SHAPE IS ASSERTED BEFORE THE VALUES, and the ordering was chosen by
    // running the negative check rather than by taste. With the announcement
    // rewritten as a hex, the equalities below fire first and report
    // `expected '#666666' to be '102, 102, 102'` - two strings a reader has to
    // diff by eye, with no sentence saying which rule broke. The scan runs
    // first so a red run NAMES the rule, and the equalities then pin the
    // arithmetic. (10-09's check 4 taught this on U+2212 and it is the same
    // lesson: a message that does not say what broke is worse than the value.)
    for (const at of [0, 95, 1638, 4095]) {
      expect(
        colourValueText(at),
        `position ${at} is announced as a hex, which is a base the firmware never sees and a resolution the state does not have - the announcement is the three STORED INTEGERS`,
      ).not.toContain("#");
      expect(
        colourValueText(at),
        `position ${at} is not announced as three integers`,
      ).toMatch(/^[0-9]{1,3}, [0-9]{1,3}, [0-9]{1,3}$/);
    }
    expect(
      colourValueText(colourPosition([6, 6, 6])),
      "the announcement is no longer the three stored integers of the colour at that position",
    ).toBe("102, 102, 102");
    expect(
      colourValueText(0),
      "the announcement is no longer the three stored integers of the colour at that position",
    ).toBe("0, 0, 0");
    expect(
      colourValueText(COLOUR_LATTICE_SIZE - 1),
      "the announcement is no longer the three stored integers of the colour at that position",
    ).toBe("255, 255, 255");
    expect(
      picker,
      "a rail does not announce the composed value, so moving one says nothing about the colour",
    ).toContain("aria-valuetext={valueText}");
    expect(
      picker,
      "the picker builds its own value text instead of using the one arithmetic",
    ).toContain("colourValueText(");
    expect(
      COLOUR_CHANNELS,
      "the three rails are no longer red, green and blue in that order",
    ).toEqual(["r", "g", "b"]);
  });
});
