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
// CopyLink.svelte each say "--color-error-ink appears nowhere in this file", and
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
// The inspector (13-09): the widget rule and its boundary, the copy the
// inspector renders, layout.ts's D-21 numbers, and a real tuner for the
// per-field reset - the model.spec.ts harness in brief. The compile surface
// is a spec's to import statically; test 1 holds the COMPONENTS to the
// await form.
import {
  INSPECTOR_HEADLINE,
  MIDI_MONITOR,
  MONITOR_COLUMNS,
  MONITOR_STATUS,
  fieldResetName,
  monitorCount,
} from "../tune/inspector-copy";
import { buildTuner } from "../tune/model";
import { padReady } from "../pad";
// The monitor's arithmetic (13-10): a pure module the component paints, so
// the coalescing window, the ring cap and the absent-on-preset rule are
// driven here with a scripted clock and no browser. The engines come through
// the compile surface, which a spec may import statically.
import { byId } from "../catalog";
import { createEngine } from "../sim/engine";
import type { HostMidi } from "../sim/lua-host";
import {
  COALESCE_WINDOW_MS,
  MONITOR_CAP,
  MonitorLog,
  describeChannel,
  describeMessage,
  describeTime,
  midiLogOf,
} from "../sim/monitor";
import {
  KNOB_KIND_NAMES,
  SCALE_WORDS,
  SEGMENTED_MAX,
  WORD_ROW_MAX,
  widgetFor,
  type KnobView,
  type TuneView,
} from "../tune/view";
import {
  GRID_FITS_INSPECTOR,
  NUMERIC_FIELD_W,
  NUMERIC_GRID_REFLOW,
  NUMERIC_GRID_W,
} from "./shell/layout";

/** Seven and twelve integers, for the totality walk over every kind. */
const SEVEN_INTEGERS = Array.from({ length: 7 }, (_, i) => String(i));
const TWELVE = Array.from({ length: 12 }, (_, i) => String(i * 10));

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const UI_DIR = "src/lib/ui";

/**
 * The ten tuning components. A literal list is unavoidable - the directory
 * also holds Phase 4's components, which these rules do not all bind - so its
 * length is asserted and every name is checked against the directory listing.
 * A rename, a deletion or an ELEVENTH component added without being listed
 * is then a visible omission rather than a silent gap.
 *
 * The eighth is plan 10-10's ColourPicker.svelte, the ninth is 10-11's
 * MixTwo.svelte and the tenth is 13-09's Swatch.svelte (the popover the
 * picker lives in), and adding each here is not bookkeeping: a component
 * omitted from a hand-declared list passes every walk in this file silently,
 * which would have left them outside the compiler guard, the scroll
 * prohibition, the 44px floor and the accent census at once.
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
  "Swatch.svelte",
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

/**
 * Every non-spec file under src/lib/ui/, in a stable order, SUBDIRECTORIES
 * INCLUDED: the rule this feeds is the directory's, and since 13-05 the
 * directory has a shell/ beneath it. A flat listing read "shell" as a file
 * and threw EISDIR on 2026-09-11; the walk is what the rule always meant.
 */
const uiFiles = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (!entry.name.endsWith(".spec.ts")) out.push(rel);
    }
  };
  walk(UI_DIR);
  return out.sort();
};

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
    expect(TUNING_COMPONENTS.length, "ten components were listed").toBe(10);
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
      "the ten components' code was actually read",
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
    // --color-boundary bar; the free one is the --color-divider dot it always
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
    ).not.toContain("--color-action");
    for (const rule of barRules) {
      expect(
        rule.body,
        `${rule.selector} paints the held marker in accent`,
      ).not.toContain("--color-action");
    }
    expect(
      barRules.map((rule) => rule.body).join(""),
      "the held marker is not --color-boundary, so it is either invisible or on a token it has no claim to",
    ).toContain("var(--color-boundary)");
    expect(
      rulesOf(knob).find((rule) => rule.selector.trim() === ".home")?.body,
      "the FREE marker stopped being the soft dot, so the two states no longer differ by weight",
    ).toContain("var(--color-divider)");

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
    ).not.toContain("--color-action");
    expect(
      deltaRule?.body,
      "the delta paints in the alarm red, which would be X-01's fourth use",
    ).not.toContain("--color-error-ink");
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

    // -----------------------------------------------------------------------
    // THE SWATCH'S POPOVER (13-09, Bible section 7 and 14). It rides here
    // because what it must do is what this test is about - a control, its
    // floor, and the platform behaviour the control relies on. A <dialog>
    // opened with showModal(): the platform traps focus and handles Escape,
    // so neither is re-implemented; the two things it does not do are
    // asserted as code - the backdrop click closes, and focus returns to the
    // link that opened it on close, whichever way it closed. The behaviour is
    // pressed in e2e/tuning.e2e.ts (Escape, then the link is focused).
    const swatch = code(componentPath("Swatch.svelte"));
    expect(swatch, "the popover is not a <dialog>").toContain("<dialog");
    expect(
      swatch,
      "the popover is not opened with showModal(), so nothing traps focus and the background is not inert",
    ).toContain("showModal()");
    expect(
      swatch,
      "the popover has no accessible name - it must be labelled by the knob's own label",
    ).toContain("aria-labelledby={titleId}");
    expect(
      swatch,
      "a click on the backdrop does not close the popover",
    ).toContain("if (event.target === dialog) close();");
    const closed = swatch.slice(
      swatch.indexOf("function onClosed"),
      swatch.indexOf("}", swatch.indexOf("function onClosed")),
    );
    expect(
      closed,
      "focus does not return to the link that opened the popover when it closes (section 14)",
    ).toContain("trigger?.focus()");
    expect(swatch, "onclose is not wired to the focus return").toContain(
      "onclose={onClosed}",
    );
    for (const selector of [".edit", ".close"]) {
      const rule = rulesOf(swatch).find((r) => r.selector.trim() === selector);
      expect(
        rule,
        `Swatch.svelte no longer has a ${selector} rule`,
      ).toBeDefined();
      for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
        expect(
          rule?.body,
          `${selector} does not declare ${axis} - Phase 4's touch floor is both axes per control`,
        ).toContain(axis);
      }
    }
    // The square is the PDF's 34 x 34 and square-cornered (D-01).
    const square = rulesOf(swatch).find((r) => r.selector.trim() === ".square");
    expect(square?.body).toContain("inline-size: 34px");
    expect(square?.body).toContain("block-size: 34px");
    expect(square?.body).not.toContain("border-radius");
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
      census[name] = occurrences(code(componentPath(name)), "--color-action");
    }
    const total = Object.values(census).reduce((sum, n) => sum + n, 0);

    // Per file, so a move is named rather than merely counted.
    expect(
      census,
      `the accent census moved. The reserved list is these eight and nothing else: ${RESERVED.join("; ")}. A held knob's marker is --color-boundary, the forecast delta is --color-ink and the ghost fill is --color-divider - none of them is entitled to the ninth`,
    ).toEqual({
      "BudgetMessage.svelte": 2,
      "BudgetMeter.svelte": 1,
      "ColourPicker.svelte": 7,
      "CopyLink.svelte": 1,
      "Knob.svelte": 9,
      "KnobRack.svelte": 0,
      // A NINTH COMPONENT THAT MOVES THE CENSUS BY ZERO (plan 10-11). MIX TWO
      // is Secondary tier, so its pill is an OUTLINE and never a fill; its
      // results are bordered in --color-divider; and its focus ring is
      // app.css's :focus-visible, which belongs to every control on the site
      // and is declared in no component. There was nothing here to spend
      // accent on that would not have been a ninth entry.
      "MixTwo.svelte": 0,
      "StampNotice.svelte": 0,
      // THE TENTH (13-09), ONE DECLARATION: the popover's Close button takes
      // the action colour on its border on hover - entry 4's family, the
      // focus and hover treatment every control on the site shares - and the
      // swatch square is the stored RGB444 value, never a token. The Edit
      // color link and the hex are quiet ink.
      "Swatch.svelte": 1,
      "TuningRegion.svelte": 1,
    });
    expect(
      total,
      "the accent declaration count across the ten tuning components is no longer twenty-two",
    ).toBe(22);

    // Non-vacuity: the walk really read files with accent in them.
    expect(
      Object.values(census).filter((n) => n > 0).length,
      "the census found accent in fewer files than the seven that carry it",
    ).toBe(7);

    // AND THE PICKER SPENT NONE OF IT ON THE THINGS THAT WOULD HAVE BEEN A
    // NINTH ENTRY. The cheap-step tick is --color-boundary, the unaffordable
    // detent is --color-workspace behind a --color-divider hairline, and the
    // default marker is the soft dot it always was. Named individually,
    // because the total above would absorb a swap between two of them.
    const picker = code(componentPath("ColourPicker.svelte"));
    for (const selector of [".tick", ".detent.unaffordable", ".home"]) {
      expect(
        rulesOf(picker).find((rule) => rule.selector.trim() === selector)?.body,
        `${selector} paints in accent, which is a ninth entry on the reserved list`,
      ).not.toContain("--color-action");
    }
  });

  it("the error ink and its surface live in the two meter components inside the inspector, and on no button", () => {
    // X-01 scopes the alarm token to THREE USES: the offending meter's bar fill
    // and its 2px outline, that meter's numerals and percentage, and the 2px
    // left rule on the over-budget message. THIS TEST COUNTS COMPONENTS, NOT
    // USES - the first two uses live in BudgetMeter.svelte and the third in
    // BudgetMessage.svelte, so two here and three in the UI spec are the same
    // fact counted differently, and neither number contradicts the other.
    //
    // RE-AIMED AT 13-10. 13-03 renamed --color-over to --color-error-ink and
    // left this title pointing at the new name with its old subject; the
    // subject now is the Bible's error PAIR (section 12: error ink on error
    // surface) and where it lives - in the two meter components, which since
    // 13-09 render inside the inspector, after its last section. The surface
    // token shipped at 13-03 with no consumer; its consumer is the over-budget
    // message block and nothing else under src/lib/ui/.
    const TOKEN = "--color-error-ink";
    const SURFACE = "--color-error-surface";
    const files = uiFiles().filter((file) => file.endsWith(".svelte"));
    const carriers = files.filter((file) => code(file).includes(TOKEN));
    const surfaces = files.filter((file) => code(file).includes(SURFACE));

    expect(files.length, "the ui directory was walked").toBeGreaterThan(7);
    expect(
      carriers.sort(),
      "the error ink is scoped to the meter and the message, and appears nowhere else under src/lib/ui/ - the walk excludes *.spec.ts, where identity.spec.ts legitimately names the token",
    ).toEqual([
      `${UI_DIR}/BudgetMessage.svelte`,
      `${UI_DIR}/BudgetMeter.svelte`,
    ]);
    expect(
      surfaces,
      "the error surface has a consumer other than the over-budget message block, or has lost that one - section 12 gives it to error message backgrounds and 13-03 shipped it for exactly this block",
    ).toEqual([`${UI_DIR}/BudgetMessage.svelte`]);
    const overBlock = rulesOf(code(componentPath("BudgetMessage.svelte"))).find(
      (rule) => rule.selector.trim() === ".block.over",
    );
    expect(
      overBlock,
      "BudgetMessage.svelte has no .block.over rule",
    ).toBeDefined();
    expect(
      overBlock?.body,
      "the over-budget block is not the error pair: the rule in the ink on the surface",
    ).toContain(`var(${SURFACE})`);
    expect(overBlock?.body).toContain(`var(${TOKEN})`);
    expect(
      overBlock?.body,
      "the over-budget block grew a radius - D-01",
    ).not.toContain("border-radius");

    // WHERE THEY LIVE: both meters and the message render inside the
    // inspector, as the children the shell's Inspector draws after its last
    // section - which is MIDI output on every entry that addresses the wire.
    // The two meters and the message are the honesty device the Bible never
    // drew, and this is the assertion that they survived the redesign.
    const region = code(componentPath("TuningRegion.svelte"));
    const inspector = region.slice(
      region.indexOf("<Inspector"),
      region.indexOf("</Inspector>"),
    );
    expect(inspector.length, "the Inspector block was found").toBeGreaterThan(
      100,
    );
    expect(
      occurrences(inspector, "<BudgetMeter"),
      "the two 908 meters no longer render inside the inspector",
    ).toBe(2);
    expect(
      occurrences(inspector, "<BudgetMessage"),
      "the ladder message no longer renders inside the inspector beside the meters",
    ).toBe(1);
    expect(
      inspector.indexOf("<BudgetMeter"),
      "the meters render before the sections rather than after them - they are children, drawn under the last section",
    ).toBeGreaterThan(inspector.indexOf("sections={["));
    // And the numbers are TUNE-03's own words: `{used} / 908`, a percentage,
    // tabular numerals so the column never jitters while a knob turns.
    const meterSource = code(componentPath("BudgetMeter.svelte"));
    expect(meterSource).toContain("meterNumerals(view.used)");
    expect(meterSource).toContain("meterPercent(view.pct)");
    expect(
      rulesOf(meterSource).find((rule) => rule.selector.includes(".numerals"))
        ?.body,
      "the meter's numerals are not tabular",
    ).toContain("tabular-nums");
    for (const selector of [".track", ".fill", ".ghost"]) {
      expect(
        rulesOf(meterSource).find((rule) => rule.selector.trim() === selector)
          ?.body,
        `${selector} still carries a radius - 13-10 squared the meter (D-01) and cleared its allowlist row`,
      ).not.toContain("border-radius");
    }

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
    // fourth --color-error-ink use. The carrier list above already says the token
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
      "the ghost is not --color-divider, so it is either invisible or on a token it has no claim to",
    ).toContain("var(--color-divider)");
    expect(
      ghost?.body,
      "the ghost paints in the alarm red - that is X-01's fourth use, and an unaffordable option is disabled and cannot be hovered anyway",
    ).not.toContain("--color-error-ink");
    expect(
      ghost?.body,
      "the ghost spends accent, which would be a ninth entry on the reserved list",
    ).not.toContain("--color-action");
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

  it("the MIDI monitor renders the host's existing log coalesced with an xN count, caps at 200, is absent on a preset entry, and announces nothing", async () => {
    // FOUR HALVES (13-10, Bible section 10 and 14, D-14 Q4b). The shape half
    // is source: the component is a real disclosure over a real table, has no
    // live region, no interval and no animation-frame loop of its own, and is
    // mounted by the workspace behind `preview === "lua"` and nowhere else.
    // The arithmetic half drives src/lib/sim/monitor.ts with a scripted
    // clock. The absent half asks two REAL engines for their log. The words
    // half holds the PDF's two strings verbatim and section 10's six heads.
    const MONITOR = "MidiMonitor.svelte";
    const monitor = code(componentPath(MONITOR));
    const rawMonitor = raw(componentPath(MONITOR));
    expect(rawMonitor.length, "MidiMonitor.svelte was read").toBeGreaterThan(
      1000,
    );

    // ---- NOT A LIVE REGION, and no clock of its own kind. Section 14: "do
    // not announce every MIDI event or animation frame." Phase 4: never
    // setInterval; SimHost owns the page's one rAF.
    for (const forbidden of [
      "aria-live",
      'role="log"',
      'role="status"',
      "setInterval",
      "requestAnimationFrame",
      "Math.random",
      "overflow-x",
    ]) {
      expect(
        monitor,
        `MidiMonitor.svelte carries "${forbidden}" - the monitor announces nothing, polls on a setTimeout chain and never scrolls sideways`,
      ).not.toContain(forbidden);
    }
    expect(
      /overflow[ ]*:[ ]*(auto|scroll)/.exec(monitor),
      "the overflow shorthand would set the inline axis too (D-11)",
    ).toBeNull();
    expect(monitor, "the sampler is not a self-rescheduling timeout").toContain(
      "timer = setTimeout(sample, SAMPLE_MS)",
    );
    expect(
      monitor,
      "the sampler is not stopped on destroy, so a closed workspace keeps polling",
    ).toContain("onDestroy(stop)");
    expect(monitor, "no radius (D-01)").not.toContain("border-radius");

    // ---- A REAL DISCLOSURE OVER A REAL TABLE, collapsed by default.
    expect(monitor).toContain("let open = $state(false)");
    expect(monitor).toContain("aria-expanded={open}");
    expect(monitor).toContain("aria-controls={panelId}");
    expect(monitor, "the log is not a table").toContain("<table");
    expect(monitor, "the heads are not column heads").toContain(
      '<th scope="col">',
    );
    expect(
      monitor,
      "the six heads are not the copy module's, in section 10's order",
    ).toContain("{#each MONITOR_COLUMNS as head (head)}");
    expect(MONITOR_COLUMNS, "section 10's six columns, in its order").toEqual([
      "Time",
      "Direction",
      "Source",
      "Channel",
      "Message",
      "Value",
    ]);
    // Pause and Clear (section 10), each a real button on both 44px axes.
    for (const id of ["monitor-toggle", "monitor-pause", "monitor-clear"]) {
      expect(monitor, `no ${id} control`).toContain(`data-testid="${id}"`);
    }
    const controlRule = rulesOf(monitor).find(
      (rule) => rule.selector.trim() === ".control",
    );
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        controlRule?.body,
        `.control does not declare ${axis} - Phase 4's floor is both axes per control`,
      ).toContain(axis);
    }
    expect(
      rulesOf(monitor).find((rule) => rule.selector.trim() === ".bar")?.body,
      "the bar is under 44px tall",
    ).toContain("min-block-size: 44px");

    // ---- THE WORDS. The PDF's two, verbatim and imported; section 10's
    // heads; the count form.
    expect(MIDI_MONITOR).toBe("MIDI monitor");
    expect(MONITOR_STATUS).toBe("Browser preview · No MIDI output");
    for (const [name, text] of [
      ["MIDI_MONITOR", MIDI_MONITOR],
      ["MONITOR_STATUS", MONITOR_STATUS],
    ] as const) {
      expect(monitor, `MidiMonitor.svelte imports ${name}`).toContain(name);
      expect(
        monitor,
        `MidiMonitor.svelte transcribes ${name} instead of importing it`,
      ).not.toContain(`"${text}"`);
    }
    expect(monitorCount(1)).toBe("");
    expect(monitorCount(12)).toBe("x12");
    expect(monitor).toContain("monitorCount(row.count)");

    // ---- ABSENT ON PRESET ENTRIES, NOT PRESENT AND EMPTY. The route mounts
    // the bar behind the one guard, and the header names the divergence it
    // declined (D-14 Q4b: no log added to src/vendor/).
    const route = code("src/routes/playground/[id]/+page.svelte");
    expect(
      route,
      'the workspace does not mount the monitor behind preview === "lua"',
    ).toMatch(
      /[{]#if listed[.]preview === "lua"[}][ \n]*<MidiMonitor source=[{][(][)] => midiLogOf[(]engine[)][}] [/]>[ \n]*[{][/]if[}]/,
    );
    expect(
      occurrences(route, "<MidiMonitor"),
      "the monitor is mounted more than once, or somewhere outside the guard",
    ).toBe(1);
    expect(rawMonitor).toContain("D-14 Q4b");
    expect(rawMonitor).toContain("src/vendor/");
    expect(rawMonitor, "the header does not name the host's log").toContain(
      "midiLog",
    );

    // ---- THE ARITHMETIC, with a scripted clock. Two alike messages 10 ms
    // apart are one row with x2; the window's edge opens a new row; two
    // controllers alternating fold into two rows, not two hundred; five
    // hundred distinct messages leave exactly the cap, newest first.
    const cc = (p1: number, p2: number, ch = 0): HostMidi => ({
      ch,
      cmd: 176,
      p1,
      p2,
      mode: 0,
    });
    const log = new MonitorLog();
    const stream: HostMidi[] = [cc(74, 10)];
    expect(log.ingest(stream, 0), "the first message changed nothing").toBe(
      true,
    );
    stream.push(cc(74, 11));
    log.ingest(stream, 10);
    expect(log.size, "two alike messages 10 ms apart made two rows").toBe(1);
    expect(log.visible[0].count).toBe(2);
    expect(
      log.visible[0].p2,
      "a coalesced row does not show the latest value",
    ).toBe(11);
    expect(monitorCount(log.visible[0].count)).toBe("x2");
    expect(
      log.ingest(stream, 20),
      "an unchanged source reported a change",
    ).toBe(false);
    stream.push(cc(74, 12));
    log.ingest(stream, COALESCE_WINDOW_MS + 1);
    expect(
      log.size,
      "a message past the window folded into a row it does not belong to",
    ).toBe(2);
    expect(log.visible[0].p2, "newest is not first").toBe(12);
    // X and Y alternating, forty times inside one window: two rows.
    const xy = new MonitorLog();
    const pairs: HostMidi[] = [];
    for (let i = 0; i < 40; i++) pairs.push(cc(i % 2 === 0 ? 1 : 2, i));
    xy.ingest(pairs, 0);
    expect(
      xy.size,
      "alternating controllers did not fold into their own rows",
    ).toBe(2);
    expect(xy.visible.map((row) => row.count)).toEqual([20, 20]);
    // The ring. Five hundred distinct messages, each its own row: the cap,
    // and the survivors are the LAST two hundred.
    const ring = new MonitorLog();
    const flood: HostMidi[] = [];
    for (let i = 0; i < 500; i++) {
      flood.push(cc(i % 128, i % 128, Math.floor(i / 128)));
      ring.ingest(flood, i * (COALESCE_WINDOW_MS + 1));
    }
    expect(ring.size, "the ring did not cap").toBe(MONITOR_CAP);
    expect(MONITOR_CAP).toBe(200);
    expect(ring.visible[0].p1, "the newest row is not first").toBe(499 % 128);
    expect(
      ring.visible[MONITOR_CAP - 1].p1,
      "the oldest survivor is not the three-hundredth message",
    ).toBe(300 % 128);
    // Clear empties the view and not the source; what arrives next shows.
    ring.clear();
    expect(ring.size).toBe(0);
    flood.push(cc(5, 5, 9));
    ring.ingest(flood, 999_999);
    expect(ring.size).toBe(1);
    expect(ring.visible[0].ch).toBe(9);
    // A restarted host (a SHORTER array) is read from its start again.
    const restarted = new MonitorLog();
    restarted.ingest([cc(1, 1), cc(2, 2), cc(3, 3)], 0);
    restarted.ingest([cc(4, 4)], 1000);
    expect(
      restarted.size,
      "a host restart's fresh log was not read from the start",
    ).toBe(4);
    // The columns' words.
    expect(describeMessage(176, 74)).toBe("CC 74");
    expect(describeMessage(144, 60)).toBe("Note on 60");
    expect(describeMessage(128, 60)).toBe("Note off 60");
    expect(describeChannel(0), "the wire's 0 is the DAW's 1").toBe("1");
    expect(describeChannel(15)).toBe("16");
    expect(describeTime(61_005)).toBe("1:01.005");
    expect(describeTime(0)).toBe("0:00.000");

    // ---- TWO REAL ENGINES. The preset route keeps no log - undefined, never
    // an empty array, because "absent" and "nothing sent yet" are two facts
    // and the bar exists for the second only. The Lua route keeps one, and
    // ARC's timer fills it without a finger.
    const aurora = byId("aurora");
    const arc = byId("arc");
    expect(aurora?.preview, "aurora is the preset witness").toBe("padsim");
    expect(arc?.preview, "arc is the Lua witness").toBe("lua");
    const preset = await createEngine(aurora!);
    expect(
      midiLogOf(preset),
      "a vendored PadSim reports a MIDI log - D-14 Q4b's premise is gone, and the bar's absence on preset entries no longer follows",
    ).toBeUndefined();
    expect(midiLogOf(undefined)).toBeUndefined();
    expect(midiLogOf({})).toBeUndefined();
    const lua = await createEngine(arc!);
    try {
      const before = midiLogOf(lua);
      expect(before, "the Lua engine exposes no MIDI log").toBeDefined();
      lua.run(200);
      const after = midiLogOf(lua) as readonly HostMidi[];
      expect(
        after.length,
        "two seconds of ARC's timer sent nothing - the log the monitor renders is empty at the source",
      ).toBeGreaterThan(0);
      expect(describeMessage(after[0].cmd, after[0].p1)).toMatch(/^CC [0-9]+$/);
      const live = new MonitorLog();
      live.ingest(after, 0);
      expect(
        live.size,
        "the host's log did not render to a row",
      ).toBeGreaterThan(0);
    } finally {
      (lua as unknown as { close?: () => void }).close?.();
    }
  });

  it("the region's arithmetic is present, and both constants are", () => {
    // SINCE 13-09 THE REGION IS THE INSPECTOR AND ITS ARITHMETIC IS D-21's.
    // From 05-10 to 13-08 this test held the two height constants (194 / 246
    // + 48r + 66w + 196p - 4) and the measured 257px wrap that let
    // ChosenPanel.svelte reserve the tuning region's height before a knob had
    // turned. The inspector's body is the one scroll container of a panel
    // whose primary action lives in the context bar (Bible section 7), so
    // that reservation has no subject and the region carries none of it.
    // What it carries instead is D-21's one number - the width at which the
    // 2 x 2 numeric grid is two columns - and the rule that the number is
    // layout.ts's and written in no component. "Both constants" are now the
    // two layout.ts reads the decision rests on: the reflow width and the
    // inset that turns a body width into an inspector width.
    const region = componentPath("TuningRegion.svelte");
    const rack = componentPath("KnobRack.svelte");
    const regionRaw = raw(region);
    const regionCode = code(region);
    const rackCode = code(rack);

    expect(regionRaw.length, "TuningRegion.svelte was read").toBeGreaterThan(
      1000,
    );
    expect(raw(rack).length, "KnobRack.svelte was read").toBeGreaterThan(1000);

    // ---- THE OLD RESERVATION IS GONE, BOTH HALVES. A region that still
    // reserved a height would be sizing itself for a panel that no longer
    // exists, and a rack that still billed its rows would be a number nobody
    // re-derives.
    for (const relic of ["calc(162px", "calc(214px", "width < 257px", "196p"]) {
      expect(
        regionCode + rackCode,
        `the chosen panel's reservation is still written down as "${relic}" - the inspector scrolls its own body and reserves nothing`,
      ).not.toContain(relic);
    }

    // ---- D-21: THE NUMBER IS READ FROM layout.ts AND WRITTEN NOWHERE ELSE.
    // Both constants imported by name, from the shell's one module.
    const layoutImport =
      /import[ ]*[{]([^}]*)[}][ ]*from[ ]*["'][.][/]shell[/]layout["']/.exec(
        regionCode,
      );
    expect(
      layoutImport,
      "TuningRegion.svelte no longer imports from ./shell/layout - D-21's number has to come from there",
    ).not.toBeNull();
    const imported = (layoutImport as RegExpExecArray)[1];
    for (const name of ["NUMERIC_GRID_REFLOW", "INSPECTOR_INSET"]) {
      expect(
        imported,
        `TuningRegion.svelte does not import ${name} from layout.ts (D-21: the breakpoint is written once, beside the other numbers)`,
      ).toContain(name);
    }
    expect(
      NUMERIC_GRID_REFLOW,
      "layout.ts's reflow width is no longer the width that holds the 402px grid with its insets",
    ).toBe(GRID_FITS_INSPECTOR);
    // The rule that reads them, in one function, both names present.
    const columnsFor = regionCode.slice(
      regionCode.indexOf("function columnsFor"),
      regionCode.indexOf("}", regionCode.indexOf("function columnsFor")),
    );
    expect(columnsFor, "columnsFor was found").toContain("INSPECTOR_INSET");
    expect(columnsFor).toContain("NUMERIC_GRID_REFLOW");
    // And the observer that answers it, because a container query cannot
    // read a custom property.
    expect(
      regionCode,
      "the grid's columns are not answered by a ResizeObserver on its own box",
    ).toContain("new ResizeObserver(");
    // NO LITERAL. Neither file writes the reflow width, the grid width or a
    // field width as a number; the rack's grid rule reads --columns.
    for (const literal of [
      String(NUMERIC_GRID_REFLOW),
      String(NUMERIC_GRID_W),
      `${NUMERIC_FIELD_W}px`,
    ]) {
      expect(
        regionCode + rackCode,
        `a component writes "${literal}" as a literal - D-21 says the number lives in layout.ts and not in a component`,
      ).not.toContain(literal);
    }
    const gridRule = rulesOf(rackCode).find(
      (rule) => rule.selector.trim() === ".rack.grid",
    );
    expect(
      gridRule,
      "KnobRack.svelte no longer has a .rack.grid rule",
    ).toBeDefined();
    expect(
      gridRule?.body,
      "the grid's column count is not read from the --columns the region sets",
    ).toContain("repeat(var(--columns");
    expect(rackCode, "the rack sets --columns from its prop").toContain(
      "style:--columns={columns}",
    );

    // ---- THE SECTIONS ARE THE SCHEMA'S PARTITION AND THERE IS NO ADVANCED
    // SECTION. Three titles from the copy module, the MIDI ids the partition
    // keys on, and the section 7 boundary quoted where the next person reads
    // it - in the header, which is why this half reads the raw file.
    for (const title of [
      "SECTION_BEHAVIOR",
      "SECTION_APPEARANCE",
      "SECTION_MIDI",
    ]) {
      expect(regionCode, `the inspector does not render ${title}`).toContain(
        `title: ${title}`,
      );
    }
    for (const id of ['"cc"', '"ccBase"', '"channel"', '"send"']) {
      expect(
        regionCode,
        `the MIDI output partition no longer names ${id}`,
      ).toContain(id);
    }
    expect(
      /advanced/i.test(regionCode),
      "TuningRegion.svelte renders something called Advanced - section 7's tier is a decision written down, not an empty disclosure",
    ).toBe(false);
    expect(
      regionRaw,
      "the header no longer quotes section 7's boundary, so the next person will add the empty Advanced disclosure",
    ).toContain("Use actual parameter names");
    expect(regionRaw).toContain("THERE IS NO ADVANCED SECTION");

    // ---- THE HEADLINE IS ONE CONSTANT, NOT PER ENTRY.
    expect(regionCode, "the headline is not the register's constant").toContain(
      "INSPECTOR_HEADLINE",
    );
    expect(
      INSPECTOR_HEADLINE.length,
      "the headline is two lines, the PDF's",
    ).toBe(2);
    expect(
      regionCode.includes("headline={") || regionCode.includes("{headline}"),
      "the headline is not handed to Inspector.svelte as a snippet",
    ).toBe(true);

    // ---- THE DYNAMIC IMPORT BOUNDARY IS STILL THE ONE TEST 1 HOLDS. Stated
    // here once more because it is what makes the inspector's chunk the
    // gallery's chunk plus nothing: the compiler arrives inside onMount.
    expect(regionCode).toContain('await import("$lib/tune/model")');
    expect(regionCode, "the tuner is built statically").not.toMatch(
      /from[ ]*["']\$lib\/tune\/model["']/,
    );
  });

  it("every one of the twelve knob kinds resolves to a widget the row renders, and the boundary is four words to a row and a select from five", () => {
    // THE RULE IS TOTAL AND THE ROW RENDERS EVERYTHING IT CAN RETURN. The
    // widget vocabulary is read off Knob.svelte's own branches rather than
    // typed: every `view.widget === "..."` the markup tests, plus the
    // radiogroup that is its else branch, plus the picker block KnobRack
    // .svelte takes out of the row list. A widget widgetFor could return that
    // no branch renders would be a knob that fails to render, which the rule
    // promises cannot happen.
    const knob = code(componentPath("Knob.svelte"));
    const rack = code(componentPath("KnobRack.svelte"));
    const branches = new Set(
      [...knob.matchAll(/view[.]widget === "([a-z]+)"/g)].map((m) => m[1]),
    );
    expect(
      [...branches].sort(),
      "Knob.svelte's widget branches are not the rail, the select and the swatch",
    ).toEqual(["rail", "select", "swatch"]);
    expect(knob, "the else branch is no longer a radiogroup").toContain(
      'role="radiogroup"',
    );
    expect(rack, "the rack no longer takes the colour knobs out").toContain(
      'row.widget === "colour"',
    );
    const renderable = new Set([...branches, "words", "colour"]);

    let seen = 0;
    for (const kind of KNOB_KIND_NAMES) {
      for (const values of [["1"], ["1", "2", "3"], SEVEN_INTEGERS, TWELVE]) {
        const widget = widgetFor(kind, values);
        expect(
          renderable.has(widget),
          `${kind} at ${values.length} options resolved to "${widget}", which no branch renders`,
        ).toBe(true);
      }
      seen += 1;
    }
    expect(seen, "the loop ran over all twelve kinds").toBe(12);

    // THE 4/5 BOUNDARY (13-09, section 7, PDF page 5's select). A worded knob
    // with four options is the row of segmented radios; with five it is the
    // select; with nine it is a rail, because nine words do not fit a closed
    // enumeration either. Driven with real scale words, because a scale
    // whose set is not in the table would rail for a different reason and
    // pass this test for the wrong one.
    const scales = Object.keys(SCALE_WORDS);
    expect(scales.length, "the scale table has enough words").toBeGreaterThan(
      9,
    );
    expect(SEGMENTED_MAX, "the row holds four").toBe(4);
    expect(WORD_ROW_MAX, "the select holds eight").toBe(8);
    expect(widgetFor("scale", scales.slice(0, 4))).toBe("words");
    expect(
      widgetFor("scale", scales.slice(0, 5)),
      "five worded options must be a select, not a row (the boundary moved to 4/5 at 13-09)",
    ).toBe("select");
    expect(widgetFor("scale", scales.slice(0, 8))).toBe("select");
    expect(widgetFor("scale", scales.slice(0, 9))).toBe("rail");
    // The same boundary through a note knob, whose words are computed rather
    // than tabled.
    const notes = (n: number) =>
      Array.from({ length: n }, (_, i) => String(60 + i));
    expect(widgetFor("note", notes(4))).toBe("words");
    expect(widgetFor("note", notes(5))).toBe("select");
    // And a value-count change is NOT what moved: the select renders the
    // same values in the same order, one <option> per value.
    expect(knob, "the select does not render one option per value").toContain(
      "{#each view.values as value, at (at)}",
    );
    expect(knob).toContain("<option value={at} selected={at === view.index}>");
  });

  it("a changed field shows its marker and its own reset restores only that field, with the others proved unmoved", async () => {
    // TWO HALVES. The row's half is source: `changed` is the one comparison
    // section 7 asks for, the marker and the reset both key on it, and the
    // reset is named for the field. The model's half is behaviour: a real
    // tuner, two knobs moved, one reset, the other read back unmoved - the
    // claim "restores only that field" is measured rather than asserted.
    const knob = code(componentPath("Knob.svelte"));
    expect(
      knob,
      "the changed test is not the one comparison section 7 asks for",
    ).toContain("view.index !== view.default");
    expect(knob, "the marker is not keyed on changed").toMatch(
      /[{]#if changed[}]\s*<span class="changed"/,
    );
    expect(knob, "the marker carries no accessible sentence").toContain(
      "{FIELD_CHANGED}",
    );
    expect(knob, "the reset is not disabled at the default").toContain(
      "disabled={!changed}",
    );
    expect(knob, "the reset is not named for its field").toContain(
      "aria-label={fieldResetName(view.label)}",
    );
    expect(knob, "the reset does not call the row's one reset").toContain(
      'data-testid="knob-{view.id}-reset"\n    disabled={!changed}\n    aria-label={fieldResetName(view.label)}\n    onclick={onreset}',
    );
    expect(fieldResetName("Speed")).toBe("Reset Speed");
    // The region hands the row's reset to the tuner by id, and nothing else.
    const region = code(componentPath("TuningRegion.svelte"));
    expect(region).toContain("onreset={resetKnob}");
    expect(region).toMatch(
      /function resetKnob[(]id: string[)][^}]*tuner[?][.]reset[(]id[)]/,
    );

    // The behaviour, on a real tuner (the model.spec.ts harness, in brief).
    await padReady();
    const views: TuneView[] = [];
    const tuner = await buildTuner({
      entryId: "aurora",
      onview: (view) => void views.push(view),
      onpreview: () => undefined,
      onladder: () => undefined,
      onover: () => undefined,
    });
    try {
      const settle = async () => {
        for (let index = 0; index < 64; index++) await Promise.resolve();
      };
      await settle();
      const first = views.at(-1) as TuneView;
      const [a, b] = first.knobs.filter((k) => k.widget !== "colour");
      expect(a && b, "aurora has two non-colour knobs to move").toBeTruthy();
      const moveTo = (k: KnobView) => (k.default + 1) % k.values.length;
      tuner.set(a.id, moveTo(a));
      tuner.set(b.id, moveTo(b));
      await settle();
      const moved = views.at(-1) as TuneView;
      const at = (view: TuneView, id: string) =>
        view.knobs.find((k) => k.id === id) as KnobView;
      expect(at(moved, a.id).index).not.toBe(a.default);
      expect(at(moved, b.id).index).not.toBe(b.default);
      // Both changed, as the row would show them.
      expect(at(moved, a.id).index !== at(moved, a.id).default).toBe(true);

      tuner.reset(a.id);
      await settle();
      const after = views.at(-1) as TuneView;
      expect(at(after, a.id).index, "the reset field is at its default").toBe(
        a.default,
      );
      expect(
        at(after, b.id).index,
        "the OTHER field moved - a per-field reset touched a field it was not named for",
      ).toBe(moveTo(b));
      for (const k of after.knobs) {
        if (k.id === a.id || k.id === b.id) continue;
        expect(k.index, `${k.id} moved`).toBe(at(moved, k.id).index);
      }
    } finally {
      tuner.destroy();
    }
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
    //
    // THE FOUR SHAPE DECLARATIONS MOVED TO src/app.css IN 10-13.1 AND THIS
    // ASSERTION MOVED WITH THEM, WHICH IS THE POINT RATHER THAN A CONCESSION.
    // This file authored the pill first, in 10-11, and by wave 14 eleven
    // controls across nine files wanted the same three declarations - eleven
    // places for one shape to drift. So the shape is now one rule, `.pill`,
    // read HERE out of src/app.css and asserted to be exactly what §19.1b
    // specifies, and MIX TWO is asserted to WEAR it. A component that keeps the
    // class and loses the rule, or keeps the rule and loses the class, is red
    // on one of the two halves below.
    const rules = rulesOf(mix);
    const shared = rulesOf(
      "<style>" + stripComments(raw("src/app.css")) + "</style>",
    ).find((rule) => rule.selector.trim() === ".pill");
    expect(
      shared,
      "src/app.css no longer declares a .pill rule - §19.1b's shape is the one place the site says what a control looks like",
    ).toBeDefined();
    for (const declaration of [
      "border: 1px solid var(--color-boundary)",
      "background: transparent",
      "padding-inline: 24px",
      "min-inline-size: 44px",
      "min-block-size: 44px",
    ]) {
      expect(
        shared?.body,
        `src/app.css's .pill does not declare "${declaration}" - §19.1b's pill, since 13-03 a RECTANGLE under D-10 (no radius), is a 1px boundary outline with a transparent fill and 24px of inline padding, and §10.3 puts MIX TWO in Secondary`,
      ).toContain(declaration);
    }
    expect(
      buttonClassesOf(mix).includes("pill"),
      "MIX TWO does not carry the pill class, so §19.1b's Secondary shape reaches it through nothing - the rule in src/app.css is applied BY CLASS and a control that does not name it is unshaped",
    ).toBe(true);
    const mixTwoRule = rules.find(
      (rule) => rule.selector.trim() === ".mix-two",
    );
    expect(
      mixTwoRule,
      "MixTwo.svelte no longer has a .mix-two rule",
    ).toBeDefined();
    // The floor stays THIS CONTROL'S, declared here rather than inherited from
    // the shape: it is Phase 4's per-control touch contract, and it would still
    // have to hold if the pill were taken away.
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        mixTwoRule?.body,
        `MIX TWO does not declare ${axis} on its own rule - the pill guarantees it too, but Phase 4's floor is per control and survives the shape`,
      ).toContain(axis);
    }
    // A-41's LIMIT, ASSERTED BY ABSENCE. The pill reaches Primary and
    // Secondary and nothing else; pilling a Quiet control flattens it into
    // Secondary, which is the SAFE-02 regression the tier ladder exists to
    // prevent. Nothing in this file is rounded to 999px any more, and no second
    // control in it wears the class.
    expect(
      rules
        .filter((rule) => rule.body.includes("border-radius: 999px"))
        .map((rule) => rule.selector.trim()),
      "MixTwo.svelte re-declares the pill radius locally - §19.1b's shape is one rule in src/app.css and a second copy is the drift the move exists to stop",
    ).toEqual([]);
    expect(
      buttonClassesOf(mix).filter((cls) => cls === "pill").length,
      "more than one button in MixTwo.svelte wears the pill - A-41 puts it on Primary and Secondary only, and the four MIX TWO results are neither",
    ).toBe(1);

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
    // pointer. --color-error-ink is X-01's three uses, all of them a meter or a
    // message.
    expect(
      mix,
      "MixTwo.svelte spends a --font-mono use. A-44 reserves the seventh for §19.1c's metadata block, and this component displays no number that changes as a pointer moves",
    ).not.toContain("--font-mono");
    expect(
      mix,
      "MixTwo.svelte reaches for the alarm red. X-01 scopes it to three uses and all three belong to a meter or a message",
    ).not.toContain("--color-error-ink");
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
