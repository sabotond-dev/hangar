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
import { KNOB_HOLD, SURPRISE_ALL_HELD } from "../tune/copy";
// MIX TWO left the tree at 13-10 (13-CONTEXT D-12): MixTwo.svelte, mix.ts and
// mix.spec.ts deleted, the two titles this file held for it deleted by name,
// copy.ts's MIX_TWO / MIX_THIS / MIX_THAT / MIX_LINE family left standing for
// 13-19, which owns that module and its spec's count.
// The randomiser's scope (13-10, section 7): the predicate the inspector's
// MIDI partition and the roll share.
import { isMidiDestination } from "../tune/surprise";
import { UNDO_RANDOMIZE } from "../tune/inspector-copy";
// The swatch's inline colour block (13.1-04, D-08): the toggle's two words
// are the copy module's, and the closed shape is RENDERED with svelte/server
// (shell.spec.ts proved it at 13-05, device-ui.spec.ts draws the slot with
// it) so "two toggles and no picker" is read off markup rather than off a
// scan of the template.
import { EDIT_COLOR, POPOVER_CLOSE } from "../tune/inspector-copy";
import { render } from "svelte/server";
import Swatch from "./Swatch.svelte";
// The MIDI output's typed fields (13.1-07, 13.1-CONTEXT D-09): the field is
// RENDERED with svelte/server for its shape, and the mapping it makes is
// view.ts's pure door, driven here with Arc's own list.
import MidiField from "./MidiField.svelte";
import {
  CC_NUMBER_LABEL,
  CHANNEL_LABEL,
  LUA_CHANNEL_CUE,
  TYPE_A_NUMBER,
  midiFieldLabel,
  offeredLine,
} from "../tune/inspector-copy";
import { ARC } from "../catalog/entries/arc";
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
  RANDOMIZE,
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
  integerRun,
  typedIndex,
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
 * A rename, a deletion or an ELEVENTH component added without being listed is
 * then a visible omission rather than a silent gap.
 *
 * The eighth is plan 10-10's ColourPicker.svelte and the ninth is 13-09's
 * Swatch.svelte (the rows and, since 13.1-04, the inline block the picker
 * lives in - a popover from 13-09 to 13.1-04); 10-11's MixTwo.svelte was
 * the ninth from 10-11 to 13-10, when D-12 cut it and its row left with the
 * file. The tenth is 13.1-07's MidiField.svelte, the typed field over a
 * MIDI knob's closed list (13.1-CONTEXT D-09). BudgetMeter.svelte STAYS on
 * the list although the workspace no longer mounts it (D-10 hid the fourth
 * group): the Sandbox route mounts it twice under its own room line, which
 * D-10 keeps and the gate's bench row asks about. Adding each here is not
 * bookkeeping: a component omitted from a hand-declared list passes every
 * walk in this file silently, which would have left them outside the
 * compiler guard, the scroll prohibition, the 44px floor and the accent
 * census at once.
 *
 * 13-10's MidiMonitor.svelte is NOT on this list, and that is a ruling: it
 * is section 10's diagnostics bar in the centre column, not a tuning
 * control, and the monitor's own title below holds its floor, its scroll
 * rule and its silence. device-ui.spec.ts's DEVICE_COMPONENTS is the six
 * device components and browse-ui.spec.ts's browseFiles() is the six browse
 * ones.
 */
const TUNING_COMPONENTS: readonly string[] = [
  "BudgetMessage.svelte",
  "BudgetMeter.svelte",
  "ColourPicker.svelte",
  "CopyLink.svelte",
  "Knob.svelte",
  "KnobRack.svelte",
  "MidiField.svelte",
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
    // THE SWATCH'S INLINE COLOUR BLOCK (13.1-04, 13.1-CONTEXT D-08; bench
    // line 7: "Edit color should not be pop up window in the left upper corne
    // but instead open down seamlessly to edit color."). From 13-09 to
    // 13.1-04 this was a <dialog> opened with showModal() - the platform's
    // trap, top layer and Escape, plus a backdrop click and a focus return
    // written here. All of that is gone: the toggle opens a block in the
    // inspector's own flow under its row, the rows below move down, nothing
    // floats, and focus neither traps nor returns (the toggle never leaves
    // the DOM). Escape inside the block closes it and places focus on the
    // row's toggle only because the focused element is about to leave the
    // DOM. The behaviour is pressed in e2e/tuning.e2e.ts; the shape is here.
    const swatch = code(componentPath("Swatch.svelte"));
    for (const needle of [
      "<dialog",
      "showModal",
      "::backdrop",
      "position: absolute",
      "position: fixed",
      "z-index",
      "focusTrap",
      "inert",
      "aria-modal",
    ]) {
      expect(
        swatch,
        `Swatch.svelte contains "${needle}" - the colour block is inline in the inspector's flow (D-08), never a dialog, never floated, never a trap`,
      ).not.toContain(needle);
    }
    // The toggle: aria-expanded on the row's own knob, aria-controls to the
    // block's id, and the copy module's two words - Edit color closed, Close
    // open - never a transcription.
    expect(
      swatch,
      "the toggle does not carry aria-expanded for its own knob",
    ).toContain("aria-expanded={openFor === knob.id}");
    expect(swatch, "the toggle does not name the block it controls").toContain(
      'aria-controls="{uid}-{knob.id}-editor"',
    );
    expect(
      swatch,
      "the toggle's text is not EDIT_COLOR closed and POPOVER_CLOSE open",
    ).toContain("{openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}");
    expect(swatch, "the toggle's words are transcribed").not.toContain(
      `"${EDIT_COLOR}"`,
    );
    expect(swatch).not.toContain(`"${POPOVER_CLOSE}"`);
    // The block: a group labelled by the row's own label id (section 7 -
    // actual parameter names, nothing invented), rendered only while open on
    // that knob, the picker inside it keyed on the knob and mounted once.
    expect(swatch, "the block is not role=group").toContain('role="group"');
    expect(swatch, "the block is not labelled by the row's label").toContain(
      'aria-labelledby="{uid}-{knob.id}-label"',
    );
    expect(
      swatch,
      "the block is not conditional on the row's knob being the open one",
    ).toContain("{#if openFor === knob.id}");
    expect(
      occurrences(swatch, "<ColourPicker"),
      "the picker is mounted more than once, or not at all",
    ).toBe(1);
    const block = swatch.slice(
      swatch.indexOf("{#if openFor === knob.id}"),
      swatch.indexOf("{/if}", swatch.indexOf("{#if openFor === knob.id}")),
    );
    expect(block, "the picker is not inside the open row's block").toContain(
      "<ColourPicker",
    );
    expect(block, "the picker is not keyed on the knob").toContain(
      "{#key knob.id}",
    );
    expect(block, "the picker is not handed the row's knob").toContain(
      "selectedId={knob.id}",
    );
    expect(block).toContain('data-testid="colour-editor"');
    // Escape: the handler names the toggle and focuses it after the close -
    // the one deliberate focus move, and the only one (no trap, no return).
    const escape = swatch.slice(
      swatch.indexOf("function onEditorKeydown"),
      swatch.indexOf("</script>"),
    );
    expect(escape, "Escape is not the key the block closes on").toContain(
      'event.key !== "Escape"',
    );
    expect(
      escape,
      "Escape does not put focus on the row's toggle after the block leaves the DOM",
    ).toContain("toggle?.focus()");
    expect(
      occurrences(swatch, ".focus()"),
      "Swatch.svelte moves focus more than the once Escape needs",
    ).toBe(1);
    // The one control keeps Phase 4's floor on both axes; the .close rule
    // left with the dialog. No corner is declared at all (D-01).
    const edit = rulesOf(swatch).find((r) => r.selector.trim() === ".edit");
    expect(edit, "Swatch.svelte no longer has a .edit rule").toBeDefined();
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        edit?.body,
        `.edit does not declare ${axis} - Phase 4's touch floor is both axes per control`,
      ).toContain(axis);
    }
    expect(
      rulesOf(swatch).find((r) => r.selector.trim() === ".close"),
      "a .close rule survives the dialog it belonged to",
    ).toBeUndefined();
    expect(
      occurrences(swatch, "border-radius"),
      "Swatch.svelte declares a corner",
    ).toBe(0);
    const editor = rulesOf(swatch).find((r) => r.selector.trim() === ".editor");
    expect(editor, "Swatch.svelte has no .editor rule").toBeDefined();
    for (const forbidden of ["position", "box-shadow", "z-index"]) {
      expect(
        editor?.body,
        `.editor declares ${forbidden} - the block is in the flow, never floated`,
      ).not.toContain(forbidden);
    }
    // RENDERED, not scanned: two colour knobs give two toggles, both closed,
    // and no picker in the markup - the block exists only while open.
    const colourKnob = (id: string, label: string): KnobView => ({
      id,
      label,
      kind: "colour",
      widget: "rail",
      values: [{ label: "0,85,255", swatch: "rgb(0 85 255)" }],
      index: 0,
      default: 0,
    });
    const closedBody = render(Swatch, {
      props: {
        entry: { id: "aurora", name: "Aurora" },
        knobs: [
          colourKnob("colour", "Colour"),
          colourKnob("colour2", "Second colour"),
        ],
        held: new Set<string>(),
        onchange: () => undefined,
        onreset: () => undefined,
        onhold: () => undefined,
      },
    }).body;
    expect(
      occurrences(closedBody, 'data-testid="edit-color"'),
      "two colour knobs did not render two toggles",
    ).toBe(2);
    expect(occurrences(closedBody, 'aria-expanded="false"')).toBe(2);
    expect(occurrences(closedBody, `>${EDIT_COLOR}<`)).toBe(2);
    expect(closedBody).not.toContain(POPOVER_CLOSE);
    expect(
      occurrences(closedBody, 'data-testid="colour-editor"'),
      "a closed swatch rendered a colour block",
    ).toBe(0);
    expect(closedBody).not.toContain("colour-rail-r");
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
    // Since 13-10 the exhaustion is over the ROLLABLE knobs (section 7's
    // scope: a MIDI destination is out of every roll, held or not), so the
    // derivation reads the rollable list, which is the rack minus the
    // predicate the MIDI partition uses.
    expect(
      region,
      "allHeld is not derived from the rack's rollable knobs, so the disabled state is not the one the toggles produce",
    ).toContain("rollableKnobs.every((knob) => heldKnobs.has(knob.id))");
    expect(
      region,
      "the rollable list is not the rack minus the MIDI predicate",
    ).toContain("knobViews.filter((knob) => !isMidiDestination(knob))");

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

    // THE 53-CHARACTER COUNT IS RETIRED (13-19, D-05): copy.ts's header
    // retires it by name with the other measured caps, and copy.spec.ts holds
    // the sentence character-for-character. What stays is the rule the count
    // travelled with: the reason names the STATE, never the control directly
    // above it - asserted against the label the region actually renders.
    expect(
      SURPRISE_ALL_HELD,
      "the reason names the control instead of the state, repeating the label directly above it",
    ).not.toContain(RANDOMIZE);
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
      // THE TYPED MIDI FIELD (13.1-07) SPENDS NONE: its box is the boundary
      // token, its refused state the error ink, its reset quiet ink, and the
      // focus ring is app.css's (entry 4) - nothing in the file names accent.
      "MidiField.svelte": 0,
      // MixTwo.svelte stood here at 0 from 10-11 to 13-10 (Secondary tier,
      // an outline and never a fill) and left with the file under D-12; the
      // total did not move because it never spent any.
      "StampNotice.svelte": 0,
      // THE NINTH (13-09), ONE DECLARATION, MOVED AT 13.1-04: 13-09 spent it
      // on the popover's Close button's hover border; with the dialog gone
      // (D-08) it is the toggle's OPEN state - `.edit[aria-expanded="true"]`
      // in the action colour, so the row whose block is open reads as the
      // selected one, entry 8's family. The swatch square is the stored
      // RGB444 value, never a token; the closed toggle and the hex are quiet
      // ink. Still one, and the rule that carries it is asserted below.
      "Swatch.svelte": 1,
      "TuningRegion.svelte": 1,
    });
    expect(
      total,
      "the accent declaration count across the ten tuning components is no longer twenty-two",
    ).toBe(22);
    // Swatch.svelte's one is the open toggle's, by rule, so a move to any
    // other selector in that file is named rather than absorbed by the count.
    const openToggle = rulesOf(code(componentPath("Swatch.svelte"))).find(
      (rule) => rule.selector.trim() === '.edit[aria-expanded="true"]',
    );
    expect(
      openToggle?.body,
      "Swatch.svelte's one accent declaration is not the open toggle's colour",
    ).toContain("--color-action");

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
    //
    // WIDENED BY ONE AT 13-16, ON THE BIBLE'S OWN ROW. Section 12 names the
    // ink "Error text - Validation and transfer errors", and the Sandbox's
    // region inspector (src/lib/ui/sandbox/RegionInspector.svelte) is the
    // first validation UI in the tree: a numeric field whose keystroke the
    // model refused shows the typed text with its message in this ink and
    // its boundary in this ink, until the edit is corrected (section 8). It
    // is the same fact the meter states about a budget - a number the
    // surface cannot take - and X-01's rule (never a button, never a border
    // elsewhere, never a knob) holds: the ink is on a refused field's
    // boundary and its sentence, and on nothing a visitor clicks.
    //
    // WIDENED BY ONE MORE AT 13-17, ON THE SAME ROW. The Sandbox's actions
    // (src/lib/ui/sandbox/SurfaceActions.svelte) render the landing's
    // over-budget refusal beneath Apply to ZONA - which string is over 908
    // and by how much, the sentence the disabled Apply is described by
    // (TUNE-05 on a producer it had never seen). That is section 12's
    // "transfer error" half of the same row: a transfer refused before it
    // starts, in this ink, on a sentence and never on the button.
    //
    // WIDENED BY ONE MORE AT 13.1-07, ON 13-16's ROW. The workspace's MIDI
    // output is two typed fields (MidiField.svelte, 13.1-CONTEXT D-09), and
    // a typed value the knob does not offer is refused the Sandbox field's
    // way: the typed text kept, its boundary and its message in this ink,
    // until a keystroke validates. The same validation fact on the same
    // shape, and still never on a button.

    const TOKEN = "--color-error-ink";
    const SURFACE = "--color-error-surface";
    const files = uiFiles().filter((file) => file.endsWith(".svelte"));
    const carriers = files.filter((file) => code(file).includes(TOKEN));
    const surfaces = files.filter((file) => code(file).includes(SURFACE));

    expect(files.length, "the ui directory was walked").toBeGreaterThan(7);
    expect(
      carriers.sort(),
      "the error ink is scoped to the meter, the message, the destination zone's over-budget refusal (DestinationZone.svelte since 13.1-06, SurfaceActions.svelte's destination half before it) and the Sandbox's refused field, and appears nowhere else under src/lib/ui/ - the walk excludes *.spec.ts, where identity.spec.ts legitimately names the token",
    ).toEqual([
      `${UI_DIR}/BudgetMessage.svelte`,
      `${UI_DIR}/BudgetMeter.svelte`,
      `${UI_DIR}/DestinationZone.svelte`,
      `${UI_DIR}/MidiField.svelte`,
      `${UI_DIR}/sandbox/RegionInspector.svelte`,
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
    expect(monitorCount(12)).toBe("×12");
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
    expect(monitorCount(log.visible[0].count)).toBe("×2");
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
    // Since 13-10 the partition is surprise.ts's ONE predicate rather than a
    // list of four ids in this file, so the section and Randomize's scope
    // cannot drift apart; the four ids the list carried resolve true through
    // it, with the labels the catalog gives them.
    expect(
      regionCode,
      "the MIDI output partition is not surprise.ts's predicate",
    ).toContain("isMidiDestination(knob)");
    expect(regionCode).not.toContain("MIDI_IDS");
    for (const [id, label] of [
      ["cc", "CC number"],
      ["ccBase", "CC base"],
      ["channel", "Channel"],
      ["send", "Send"],
    ]) {
      expect(
        isMidiDestination({ id, label }),
        `the MIDI output partition no longer admits ${id}`,
      ).toBe(true);
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

    // THE MIDI SECTION IS THE ONE PARTITION THE RACK DOES NOT RENDER (13.1-07,
    // 13.1-CONTEXT D-09): its snippet renders one MidiField per MIDI knob and
    // no KnobRack, while Behavior and Appearance still render the rack. The
    // widget rule is untouched - widgetFor still resolves a five- or
    // sixteen-integer knob to a rail - and Knob.svelte is not edited; the
    // region simply hands the partition to the field instead of the rack.
    const region = code(componentPath("TuningRegion.svelte"));
    const snippet = (name: string) =>
      region.slice(
        region.indexOf(`{#snippet ${name}()}`),
        region.indexOf("{/snippet}", region.indexOf(`{#snippet ${name}()}`)),
      );
    const midi = snippet("midi");
    expect(midi.length, "the midi snippet was found").toBeGreaterThan(50);
    expect(midi, "the MIDI section hands its knobs to the rack").not.toContain(
      "<KnobRack",
    );
    expect(midi).toContain("{#each midiKnobs as knob (knob.id)}");
    expect(midi).toContain(
      "<MidiField {knob} onchange={changeKnob} onreset={resetKnob} />",
    );
    expect(midi, "the field grid lost its D-21 test id").toContain(
      'data-testid="midi-grid"',
    );
    expect(midi, "the grid's columns are not the region's answer").toContain(
      "style:--columns={gridColumns}",
    );
    for (const name of ["behavior", "appearance"]) {
      expect(
        snippet(name),
        `the ${name} section no longer renders the rack`,
      ).toContain("<KnobRack");
    }
  });

  it("MIDI output is two typed fields over the knobs' closed lists: the literal shown, a typed value mapped to its index or refused with the offered values, the cue on a Lua channel", () => {
    // 13.1-07, 13.1-CONTEXT D-09 (bench line 7, screenshot 2: "replace MIDI
    // channel selector with MIDI output selector with input fields, exactly
    // as on the attached screenshot"). THREE HALVES. The door: view.ts's
    // typedIndex maps a typed whole number to the knob's index or to nothing,
    // never to a nearest option. The field: rendered with svelte/server for
    // its shape - the PDF's label, a text input with a numeric keyboard, the
    // knob's own literal, the cue on a Lua channel and not on a preset's. The
    // wiring: the source routes every keystroke through the door and then
    // through onchange(knob.id, index), the same call a rail makes, and a
    // refused keystroke through aria-invalid with the message under it.
    const cc = ARC.knobs.find((knob) => knob.id === "cc");
    const channel = ARC.knobs.find((knob) => knob.id === "channel");
    expect(cc, "Arc has a cc knob").toBeDefined();
    expect(channel, "Arc has a channel knob").toBeDefined();
    const ccLiterals = cc!.values;
    expect(ccLiterals, "Arc's cc list is the one D-09 ledgers").toEqual([
      "1",
      "16",
      "20",
      "74",
      "102",
    ]);
    const channelLiterals = channel!.values;
    expect(channelLiterals[0], "a Lua channel is zero-based (X-08)").toBe("0");
    expect(channelLiterals).toHaveLength(16);

    // ---- THE DOOR. A typed literal to an index; not offered to nothing;
    // never snapped to the nearest option; leading zeros and spaces are the
    // same number; a word is nothing.
    // The plan wrote "the index of 20 is 1"; in Arc's list it is 2 (1, 16, 20).
    expect(typedIndex(ccLiterals, "20"), "20 is index 2").toBe(2);
    expect(typedIndex(ccLiterals, "1")).toBe(0);
    expect(typedIndex(ccLiterals, "102")).toBe(4);
    expect(typedIndex(ccLiterals, " 74 ")).toBe(3);
    expect(typedIndex(ccLiterals, "074")).toBe(3);
    expect(
      typedIndex(ccLiterals, "99"),
      "99 is not offered and must not snap to 102",
    ).toBeUndefined();
    expect(typedIndex(ccLiterals, "7a")).toBeUndefined();
    expect(typedIndex(ccLiterals, "")).toBeUndefined();
    expect(typedIndex(channelLiterals, "0"), "the firmware's 0").toBe(0);
    expect(typedIndex(channelLiterals, "15")).toBe(15);
    expect(typedIndex(channelLiterals, "16")).toBeUndefined();
    // The run: a Lua channel starts at 0, a preset's at 1, Arc's cc is no run.
    expect(integerRun(channelLiterals)).toEqual({ min: 0, max: 15 });
    expect(
      integerRun(Array.from({ length: 16 }, (_, i) => String(i + 1))),
    ).toEqual({ min: 1, max: 16 });
    expect(integerRun(ccLiterals)).toBeUndefined();
    expect(integerRun([])).toBeUndefined();

    // ---- THE WORDS, D-09's ledgered forms from ONE builder. The controller
    // sentence names the offered values; the channel sentence names the run's
    // bounds in the knob's own base, so a Lua entry reads 0 to 15 and a preset
    // 1 to 16 - which is why G.29's "A channel is 1 to 16." is not reused.
    expect(offeredLine("cc", ccLiterals)).toBe(
      "A controller number here is one of 1, 16, 20, 74 or 102.",
    );
    expect(offeredLine("ccBase", ["16", "24", "32"])).toBe(
      "A controller number here is one of 16, 24 or 32.",
    );
    expect(offeredLine("channel", channelLiterals)).toBe(
      "A channel here is 0 to 15.",
    );
    expect(
      offeredLine(
        "channel",
        Array.from({ length: 16 }, (_, i) => String(i + 1)),
      ),
    ).toBe("A channel here is 1 to 16.");
    expect(TYPE_A_NUMBER).toBe("Type a whole number.");
    expect(LUA_CHANNEL_CUE).toBe(
      "The firmware counts channels from 0; your DAW’s channel 1 is 0 here.",
    );
    expect(LUA_CHANNEL_CUE, "a real apostrophe (D-05)").not.toContain("'");
    // The labels: the PDF's two for cc and channel, the knob's own otherwise
    // (13.1-CONTEXT question 6, shipped this way).
    expect(CC_NUMBER_LABEL).toBe("CC number");
    expect(CHANNEL_LABEL).toBe("Channel");
    expect(midiFieldLabel({ id: "cc", label: "Mod controller" })).toBe(
      "CC number",
    );
    expect(midiFieldLabel({ id: "channel", label: "MIDI channel" })).toBe(
      "Channel",
    );
    expect(midiFieldLabel({ id: "ccBase", label: "CC base" })).toBe("CC base");
    expect(midiFieldLabel({ id: "send", label: "Send" })).toBe("Send");

    // ---- THE FIELD, RENDERED. Arc's cc at index 3 shows 74 under CC number;
    // a Lua channel at 0 shows 0 with the cue in its description and under
    // it; a preset's channel shows 1 with no cue.
    const field = (
      id: string,
      label: string,
      literals: readonly string[],
      index: number,
    ): KnobView => ({
      id,
      label,
      kind: "amount",
      widget: "rail",
      skin: "dots",
      values: literals.map((literal) => ({ label: literal })),
      literals,
      index,
      default: index,
      readout: literals[index],
    });
    const renderField = (knob: KnobView) =>
      render(MidiField, {
        props: { knob, onchange: () => undefined, onreset: () => undefined },
      }).body;
    const ccBody = renderField(field("cc", "CC number", ccLiterals, 3));
    expect(ccBody).toContain('data-testid="midi-field-cc"');
    expect(ccBody, "the field is a text input").toContain('type="text"');
    expect(ccBody, "with a numeric keyboard").toContain('inputmode="numeric"');
    expect(ccBody).toContain('autocomplete="off"');
    expect(ccBody, "the value is the knob's own literal").toMatch(/value="74"/);
    expect(ccBody).toContain(" CC number</label>");
    expect(ccBody, "no cue on a controller field").not.toContain(
      LUA_CHANNEL_CUE,
    );
    expect(ccBody, "nothing refused on arrival").not.toContain(
      'aria-invalid="true"',
    );
    expect(ccBody, "the reset is disabled at the default").toMatch(
      /data-testid="midi-field-cc-reset"[^>]*disabled/,
    );
    expect(ccBody).toContain('aria-label="Reset CC number"');
    const luaBody = renderField(
      field("channel", "MIDI channel", channelLiterals, 0),
    );
    expect(luaBody, "a Lua channel shows the firmware's 0 (X-08)").toMatch(
      /value="0"/,
    );
    expect(luaBody).toContain(" Channel</label>");
    expect(luaBody, "the cue is under a Lua channel").toContain(
      LUA_CHANNEL_CUE,
    );
    expect(luaBody).toContain('data-testid="midi-field-channel-cue"');
    expect(luaBody, "the cue is not in the field's aria-describedby").toMatch(
      /aria-describedby="[^"]*-cue"/,
    );
    const presetBody = renderField(
      field(
        "channel",
        "Channel",
        Array.from({ length: 16 }, (_, i) => String(i + 1)),
        0,
      ),
    );
    expect(presetBody, "a preset's channel shows the DAW's 1").toMatch(
      /value="1"/,
    );
    expect(presetBody, "a preset's channel carries no cue").not.toContain(
      LUA_CHANNEL_CUE,
    );
    expect(presetBody).not.toContain("aria-describedby");
    // A moved field: the marker and a live reset.
    const moved = field("cc", "CC number", ccLiterals, 1);
    moved.default = 3;
    const movedBody = renderField(moved);
    expect(movedBody).toContain('data-testid="midi-field-cc-changed"');
    expect(movedBody).not.toMatch(
      /data-testid="midi-field-cc-reset"[^>]*disabled/,
    );
    expect(movedBody).toContain('data-changed="true"');

    // ---- THE WIRING, off the source. Every keystroke goes through the door
    // and then through onchange(knob.id, index); a refused one keeps the text
    // and names the reason; the last good value is the knob's readout.
    const source = code(componentPath("MidiField.svelte"));
    expect(source).toContain("typedIndex(literals, text)");
    expect(source).toContain("onchange(knob.id, index)");
    expect(source, "the refusal is not the offered line").toContain(
      "problem = offeredLine(knob.id, literals)",
    );
    expect(source).toContain("problem = TYPE_A_NUMBER");
    expect(source).toContain("aria-invalid={problem !== undefined}");
    expect(source, "the field shows the refused text or the readout").toContain(
      'refused ?? knob.readout ?? ""',
    );
    expect(source, "the label is not inspector-copy's rule").toContain(
      "midiFieldLabel(knob)",
    );
    expect(source, "the changed test is section 7's one comparison").toContain(
      "knob.index !== knob.default",
    );
    expect(source).toContain("aria-label={fieldResetName(label)}");
    expect(source, "no free numeric: never type=number").not.toContain(
      'type="number"',
    );
    // 44px on both controls, both axes on the reset; no corner (D-01).
    const input = rulesOf(source).find((r) => r.selector.trim() === ".input");
    expect(input?.body).toContain("min-block-size: 44px");
    const reset = rulesOf(source).find((r) => r.selector.trim() === ".reset");
    expect(reset?.body).toContain("min-inline-size: 44px");
    expect(reset?.body).toContain("min-block-size: 44px");
    for (const rule of rulesOf(source)) {
      for (const match of rule.body.matchAll(
        /border-radius[ ]*:[ ]*([^;]+)/g,
      )) {
        expect(match[1].trim(), `${rule.selector} declares a corner`).toBe("0");
      }
    }
    // Never a font the instrument register reserves, never accent.
    expect(source).not.toContain("--font-mono");
    expect(source).not.toContain("--color-action");
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

  it("Undo randomize restores the prior indices in one click and is disabled before any roll, and a roll leaves every MIDI destination where it stood", async () => {
    // TWO HALVES (13-10, Bible section 7). The source half: the control is a
    // real button whose disabled state IS the presence of the ONE stored
    // vector, the vector is component state and not a stack, a hand move
    // clears it, and the header says what this is not - general undo, which
    // is 13-16's. The behaviour half: a real tuner on an entry with two MIDI
    // knobs, rolled with the tuner's own rng; the MIDI knobs read back
    // unmoved, something else moved, and restore() puts every index back.
    const region = code(componentPath("TuningRegion.svelte"));
    const regionRaw = raw(componentPath("TuningRegion.svelte"));
    expect(region, "no Undo randomize control").toContain(
      'data-testid="undo-randomize"',
    );
    expect(
      region,
      "the button's disabled state is not the stored vector's absence",
    ).toContain("disabled={undo === undefined || rolling}");
    expect(
      region,
      "the label is not section 7's own words, imported",
    ).toContain("{UNDO_RANDOMIZE}");
    expect(UNDO_RANDOMIZE).toBe("Undo randomize");
    expect(region).not.toContain('"Undo randomize"');
    // ONE value: a vector or undefined, never an array of them.
    expect(region).toContain(
      "let undo: IndexVector | undefined = $state(undefined)",
    );
    expect(
      /undo[ ]*=[ ]*[[]/.test(region) || region.includes("undo.push("),
      "undo has become a stack",
    ).toBe(false);
    expect(
      region,
      "the vector the roll replaced is not what the tuner's surprise() resolves to",
    ).toContain("previous = await current.surprise(heldKnobs)");
    expect(region).toContain(
      "if (mounted && previous !== undefined) undo = previous;",
    );
    // The click: hand the vector to restore() and forget it.
    const undoFn = region.slice(
      region.indexOf("function undoRandomize"),
      region.indexOf("}", region.indexOf("tuner.restore(vector)")),
    );
    expect(undoFn, "undoRandomize was found").toContain("undo = undefined;");
    expect(undoFn).toContain("tuner.restore(vector)");
    // A hand move after the roll clears it: the vector would restore more
    // than the roll.
    for (const fn of [
      "function changeKnob",
      "function resetKnob",
      "function resetAll",
    ]) {
      const body = region.slice(
        region.indexOf(fn),
        region.indexOf("}", region.indexOf(fn)),
      );
      expect(body, `${fn} does not clear the stored vector`).toContain(
        "undo = undefined;",
      );
    }
    // What it is not, in the header: general undo is the Sandbox's (13-16).
    expect(regionRaw).toContain("NOT GENERAL UNDO");
    expect(regionRaw).toContain("13-16");
    expect(regionRaw).toContain("Not a history, not a stack, not a tree");

    // The behaviour, on a real tuner. dial carries `send` and `channel`
    // beside three rollable knobs.
    await padReady();
    const views: TuneView[] = [];
    const tuner = await buildTuner({
      entryId: "dial",
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
      const before = views.at(-1) as TuneView;
      const midi = before.knobs.filter((k) => isMidiDestination(k));
      expect(
        midi.map((k) => k.id).sort(),
        "dial's MIDI destinations are send and channel",
      ).toEqual(["channel", "send"]);
      // Move a MIDI knob by hand first, so "unmoved" is not "at default".
      const channel = midi.find((k) => k.id === "channel") as KnobView;
      tuner.set(channel.id, (channel.default + 3) % channel.values.length);
      await settle();
      const armed = views.at(-1) as TuneView;
      const indexOf = (view: TuneView, id: string) =>
        (view.knobs.find((k) => k.id === id) as KnobView).index;
      const snapshot = Object.fromEntries(
        armed.knobs.map((k) => [k.id, k.index]),
      );

      const previous = await tuner.surprise();
      await settle();
      expect(
        previous,
        "surprise() did not resolve to the vector it replaced",
      ).toEqual(snapshot);
      const rolled = views.at(-1) as TuneView;
      for (const k of midi) {
        expect(
          indexOf(rolled, k.id),
          `${k.id} moved on a roll - section 7 preserves the MIDI destination and channel`,
        ).toBe(snapshot[k.id]);
      }
      const movedIds = rolled.knobs
        .filter((k) => indexOf(rolled, k.id) !== snapshot[k.id])
        .map((k) => k.id);
      expect(
        movedIds.length,
        "the roll moved nothing - the exhaustion signal on a domain measured never to exhaust",
      ).toBeGreaterThan(0);
      for (const id of movedIds)
        expect(midi.map((k) => k.id)).not.toContain(id);

      // One click back: every index where it stood before the roll.
      tuner.restore(previous as Readonly<Record<string, number>>);
      await settle();
      const restored = views.at(-1) as TuneView;
      for (const k of restored.knobs) {
        expect(k.index, `${k.id} was not restored`).toBe(snapshot[k.id]);
      }
      expect(
        indexOf(restored, "channel"),
        "the hand-moved channel came back to its moved index, not its default",
      ).toBe((channel.default + 3) % channel.values.length);
    } finally {
      tuner.destroy();
    }
  });
});
