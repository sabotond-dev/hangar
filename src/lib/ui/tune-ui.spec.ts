// The structural gate over the components the tuning UI is made of: light
// (the compiler only through await import()), scroll-free, reachable by thumb,
// correctly coloured, with one live region. Properties of the SOURCE, so the
// suite runs in a second with no browser; the e2e suite proves the behaviour.
// Every scan strips comments first - a header may name the token, specifier or
// declaration its code refuses - except where what is checked IS the header:
// the wording pins on TuningRegion.svelte and MidiMonitor.svelte read the raw
// file. The stripper and the non-vacuity habit are config-shape.spec.ts's.
// Decided at 05-08 / 13-09 / 13-10; see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CHANNEL_VALUES,
  CONTINUOUS_STATUSES,
  RECEIVE_VALUES,
  numberValues,
  outputProblems,
  resolveOutputs,
  roleOfKnob,
  typeValues,
} from "../tune/midi";
import { MIDI_TYPE_WORDS, RECEIVE_WORDS, wordFor } from "../tune/view";
import {
  OUTPUT_ROLE_LABELS,
  PER_OUTPUT,
  SAME_CHANNEL,
} from "../tune/inspector-copy";
// The copy module imports NOTHING (its own header says why), so naming it here
// costs this file no chunk and lets the source scans below check a component
// against the sentence it is supposed to be rendering rather than a copy of it.
import { KNOB_HELD, KNOB_HOLD, SURPRISE_ALL_HELD } from "../tune/copy";
// MIX TWO left the tree at 13-10 (13-CONTEXT D-12): MixTwo.svelte, mix.ts and
// mix.spec.ts deleted, the two titles this file held for it deleted by name,
// copy.ts's MIX_TWO / MIX_THIS / MIX_THAT / MIX_LINE family left standing for
// 13-19, which owns that module and its spec's count.
// The randomiser's scope (13-10, section 7): the predicate the inspector's
// MIDI partition and the roll share.
import { isControllerNumber, isMidiDestination } from "../tune/surprise";
import { UNDO_RANDOMIZE } from "../tune/inspector-copy";
// The swatch's inline colour block (13.1-04, D-08): the toggle's two words
// are the copy module's, and the closed shape is RENDERED with svelte/server
// (shell.spec.ts proved it at 13-05, device-ui.spec.ts draws the slot with
// it) so "two toggles and no picker" is read off markup rather than off a
// scan of the template.
import { EDIT_COLOR, POPOVER_CLOSE } from "../tune/inspector-copy";
import { render } from "svelte/server";
import Swatch from "./Swatch.svelte";
// Change 16's rows: the knob row and the stepper, rendered for their shape;
// the sections rule the region draws them in.
import Knob from "./Knob.svelte";
import {
  SECTION_FEEL,
  SECTION_LOOK,
  SECTION_MIDI,
  SECTION_SOUND,
  SECTION_SYNC,
  SNAP_HINT,
  STEP_DOWN,
  STEP_UP,
} from "../tune/inspector-copy";
import { SECTION_ORDER, groupBySection, sectionOf } from "../tune/sections";
// The MIDI output's typed fields (13.1-07, 13.1-CONTEXT D-09): the field is
// RENDERED with svelte/server for its shape, and the mapping it makes is
// view.ts's pure door, driven here with Arc's own list.
import MidiField from "./MidiField.svelte";
import BrightnessField from "./BrightnessField.svelte";
import { CATALOG } from "../catalog";
import { stampKnobs } from "../share/stamp";
import { parseBrightness } from "../catalog/brightness";
import { BRIGHTNESS_LABEL, BRIGHTNESS_RANGE } from "../tune/inspector-copy";
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
// inspector renders, and a real tuner for the
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
  NOTE_SELECT_MAX,
  SCALE_WORDS,
  SEGMENTED_MAX,
  integerRun,
  typedIndex,
  widgetFor,
  type KnobView,
  type TuneView,
} from "../tune/view";
import { stripComments } from "../../test-support/source";

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
 * MIDI knob's closed list (13.1-CONTEXT D-09). The eleventh is change 16's
 * Stepper.svelte, the typed field with its two step boxes that Knob.svelte's
 * numeric rows and MidiField.svelte share. BudgetMeter.svelte STAYS on
 * the list although nothing mounts it any more (D-10 hid the workspace's
 * fourth group; change 10A, 2026-09-18, hid the Sandbox's two under its
 * room line): it is in the tree until its by-name deletion is decided. Adding each here is not
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
  "BrightnessField.svelte",
  "BudgetMessage.svelte",
  "BudgetMeter.svelte",
  "ColourPicker.svelte",
  "CopyLink.svelte",
  "Knob.svelte",
  "KnobRack.svelte",
  "MidiField.svelte",
  "StampNotice.svelte",
  "Stepper.svelte",
  "Swatch.svelte",
  "TuningRegion.svelte",
];

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
    expect(TUNING_COMPONENTS.length, "twelve components were listed").toBe(12);
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
    // THE LOCK (10-UI-SPEC 11.5; change 16's icon box): a real <button
    // aria-pressed> whose accessible name changes Lock -> Locked, 44px on
    // BOTH axes named separately, because `min-block-size` alone passes the
    // `includes("44px")` walk above while leaving a 30px-wide target.
    const knob = code(componentPath("Knob.svelte"));
    expect(
      knob,
      "the lock is not a real <button aria-pressed> - a div with a role, or a checkbox, would put the state somewhere the accessible NAME is not",
    ).toContain("aria-pressed={held}");
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
    expect(knob, "the lock transcribes its labels").not.toContain(
      `"${KNOB_HOLD}"`,
    );
    expect(knob).toContain("KNOB_HOLD");
    expect(knob).toContain("KNOB_HELD");
    expect(
      knob,
      "the lock's label does not change with its state, so HELD is invisible to a screen reader that reads names rather than pressed states",
    ).toContain("aria-label={held ? KNOB_HELD : KNOB_HOLD}");
    // The glyph is straight lines, no path, no arc; the shackle's last line
    // seats when held, which is the second channel beside the word.
    expect(knob).not.toContain("<path");
    expect(knob).toContain("y2={held ? 10 : 7}");

    // THE STEPPER'S THREE CONTROLS (change 16): the two boxes 44 on both
    // axes, the field 44 tall, and the boxes out of the tab order so the
    // field is the row's one stop.
    const stepper = code(componentPath("Stepper.svelte"));
    const box = rulesOf(stepper).find((r) => r.selector.trim() === ".box");
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        box?.body,
        `Stepper.svelte's .box does not declare ${axis}`,
      ).toContain(axis);
    }
    expect(
      rulesOf(stepper).find((r) => r.selector.trim() === ".field")?.body,
    ).toContain("min-block-size: 44px");
    expect(
      occurrences(stepper, 'tabindex="-1"'),
      "the two step boxes are tab stops - the field is the one stop, the arrows step it",
    ).toBe(2);
    expect(stepper, "the field is not a spinbutton").toContain(
      'role="spinbutton"',
    );
    expect(stepper).toContain("aria-valuenow={rank}");
    expect(stepper).toContain("aria-valuetext={valueText}");
    for (const key of [
      '"ArrowUp"',
      '"ArrowDown"',
      '"Home"',
      '"End"',
      '"Enter"',
    ]) {
      expect(stepper, `the field does not read ${key}`).toContain(key);
    }
    expect(
      stepper,
      "Delete or Backspace is read on a text field - those are its editing keys",
    ).not.toMatch(/"Delete"|"Backspace"/);

    // THE PICKER'S SELECTOR OPTION, both axes (plan 10-10's contract table).
    // The picker's head lock left at change 16: the swatch row carries it.
    const picker = rulesOf(code(componentPath("ColourPicker.svelte")));
    const option = picker.find((r) => r.selector.trim() === ".option");
    expect(
      option,
      "ColourPicker.svelte no longer has an .option rule",
    ).toBeDefined();
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(option?.body, `.option does not declare ${axis}`).toContain(axis);
    }
    expect(
      picker.find((r) => r.selector.trim() === ".lock"),
      "the picker draws a lock of its own again - two locks on one knob",
    ).toBeUndefined();

    // THE CHANGED MARKER (section 7; change 16): a 2px rule down the row's
    // start in the action colour, on every row component, with the hidden
    // sentence beside the label. The same rule in four files, by name.
    for (const name of [
      "Knob.svelte",
      "MidiField.svelte",
      "Swatch.svelte",
      "BrightnessField.svelte",
    ]) {
      const source = code(componentPath(name));
      const marker = rulesOf(source).find(
        (rule) => rule.selector.trim() === ".row.changed::before",
      );
      expect(marker, `${name} has no .row.changed::before rule`).toBeDefined();
      expect(marker?.body, `${name}'s marker is not 2px wide`).toContain(
        "inline-size: 2px",
      );
      expect(
        marker?.body,
        `${name}'s marker is not the action colour`,
      ).toContain("var(--color-action)");
      expect(source, `${name} lost the hidden sentence`).toContain(
        "{FIELD_CHANGED}",
      );
    }

    // -----------------------------------------------------------------------
    // THE SWATCH'S INLINE COLOUR BLOCK (13.1-04, 13.1-CONTEXT D-08): the chip
    // opens a block in the inspector's own flow under its row; nothing
    // floats, nothing traps. Escape inside the block closes it and places
    // focus on the row's chip only because the focused element is about to
    // leave the DOM. The behaviour is pressed in e2e/tuning.e2e.ts.
    const swatch = code(componentPath("Swatch.svelte"));
    for (const needle of [
      "<dialog",
      "showModal",
      "::backdrop",
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
    expect(
      swatch,
      "the chip does not carry aria-expanded for its own knob",
    ).toContain("aria-expanded={openFor === knob.id}");
    expect(swatch, "the chip does not name the block it controls").toContain(
      'aria-controls="{uid}-{knob.id}-editor"',
    );
    expect(
      swatch,
      "the chip's hidden verb is not EDIT_COLOR closed and POPOVER_CLOSE open",
    ).toContain("{openFor === knob.id ? POPOVER_CLOSE : EDIT_COLOR}");
    expect(swatch, "the chip's words are transcribed").not.toContain(
      `"${EDIT_COLOR}"`,
    );
    expect(swatch).not.toContain(`"${POPOVER_CLOSE}"`);
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
    const escape = swatch.slice(
      swatch.indexOf("function onEditorKeydown"),
      swatch.indexOf("</script>"),
    );
    expect(escape, "Escape is not the key the block closes on").toContain(
      'event.key !== "Escape"',
    );
    expect(
      escape,
      "Escape does not put focus on the row's chip after the block leaves the DOM",
    ).toContain("chip?.focus()");
    expect(
      occurrences(swatch, ".focus()"),
      "Swatch.svelte moves focus more than the once Escape needs",
    ).toBe(1);
    // The chip keeps Phase 4's floor on both axes; no corner above zero (D-01).
    const chip = rulesOf(swatch).find((r) => r.selector.trim() === ".chip");
    expect(chip, "Swatch.svelte no longer has a .chip rule").toBeDefined();
    for (const axis of ["min-inline-size: 44px", "min-block-size: 44px"]) {
      expect(
        chip?.body,
        `.chip does not declare ${axis} - Phase 4's touch floor is both axes per control`,
      ).toContain(axis);
    }
    expect(swatch, "Swatch.svelte declares a corner").not.toMatch(
      /border-radius:[ ]*[1-9]/,
    );
    const editor = rulesOf(swatch).find((r) => r.selector.trim() === ".editor");
    expect(editor, "Swatch.svelte has no .editor rule").toBeDefined();
    for (const forbidden of ["position", "box-shadow", "z-index"]) {
      expect(
        editor?.body,
        `.editor declares ${forbidden} - the block is in the flow, never floated`,
      ).not.toContain(forbidden);
    }
    // RENDERED, not scanned: two colour knobs give two chips, both closed,
    // each reading its colour, and no picker in the markup.
    const colourKnob = (id: string, label: string): KnobView => ({
      id,
      label,
      kind: "colour",
      widget: "colour",
      values: [
        {
          label: "Azure, 1 of 2",
          swatch: "rgb(0 85 255)",
          name: "Azure, 1 of 2",
        },
        { label: "Red, 2 of 2", swatch: "rgb(255 0 0)", name: "Red, 2 of 2" },
      ],
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
      "two colour knobs did not render two chips",
    ).toBe(2);
    expect(occurrences(closedBody, 'aria-expanded="false"')).toBe(2);
    expect(occurrences(closedBody, `>${EDIT_COLOR}<`)).toBe(2);
    expect(closedBody).not.toContain(POPOVER_CLOSE);
    expect(closedBody, "a palette chip reads its hue word").toContain(
      ">Azure<",
    );
    expect(closedBody, "the chip paints the stored value").toContain(
      "background-color: rgb(0 85 255)",
    );
    expect(
      occurrences(closedBody, 'data-testid="colour-editor"'),
      "a closed swatch rendered a colour block",
    ).toBe(0);
    expect(closedBody).not.toContain("colour-rail-r");
    expect(
      occurrences(closedBody, 'aria-pressed="false"'),
      "each row carries its lock",
    ).toBe(2);
    // The square is the chip's inner height, 42 x 42 inside its hairline (change 16b: a 44 square at the chip's left edge), and square-cornered (D-01); the chip fills its column at 44.
    const square = rulesOf(swatch).find((r) => r.selector.trim() === ".square");
    expect(square?.body).toContain("inline-size: 42px");
    expect(square?.body).toContain("block-size: 42px");
    expect(square?.body).not.toContain("border-radius");
    expect(chip?.body, "the chip does not fill its column").toContain(
      "inline-size: 100%",
    );
    expect(chip?.body, "the chip is not 44px tall").toContain(
      "block-size: 44px",
    );
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
    // A COUNT, NOT AN INSPECTION. Every wave that adds a control to these
    // files is a chance to reach for a colour that is already spoken for.
    // CHANGE 16 spent the colour on one thing it had not before, BY THE
    // USER'S WORD: the changed-from-default marker is a 2px action rule down
    // the row's start (the brief's item 7), in four files; it reads as entry
    // 8's family - the row whose value is the visitor's, not the card's. The
    // stepper's ladder marks the rung the field is at in the same colour
    // (entry 8 exactly). The forecast delta and the held bar left with the
    // rail. The list is still eight.
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
      `the accent census moved. The reserved list is these eight and nothing else: ${RESERVED.join("; ")}. A held knob is its seated shackle and full ink, a refused field is the error ink - none of them is entitled to the ninth`,
    ).toEqual({
      // The changed marker's rule (change 16).
      "BrightnessField.svelte": 1,
      "BudgetMessage.svelte": 2,
      "BudgetMeter.svelte": 1,
      "ColourPicker.svelte": 7,
      "CopyLink.svelte": 1,
      // The changed marker, the chosen segment's edge and word, the focus
      // ring on an option, the palette swatch's hover edge and selected outline.
      "Knob.svelte": 6,
      "KnobRack.svelte": 0,
      // The changed marker (change 16); the box is the boundary token, the
      // refused state the error ink, the reset quiet ink.
      "MidiField.svelte": 1,
      "StampNotice.svelte": 0,
      // The ladder's tick at the rung the field is at (entry 8).
      "Stepper.svelte": 1,
      // The changed marker, and the open row's chip edge (entry 8's family).
      "Swatch.svelte": 2,
      "TuningRegion.svelte": 1,
    });
    expect(
      total,
      "the accent declaration count across the twelve tuning components is no longer twenty-three",
    ).toBe(23);
    // Swatch.svelte's chip edge is the open chip's, by rule, so a move to
    // any other selector in that file is named rather than absorbed.
    const openChip = rulesOf(code(componentPath("Swatch.svelte"))).find(
      (rule) => rule.selector.trim() === ".chip.open",
    );
    expect(
      openChip?.body,
      "Swatch.svelte's chip accent is not the open chip's edge",
    ).toContain("--color-action");

    // Non-vacuity: the walk really read files with accent in them.
    expect(
      Object.values(census).filter((n) => n > 0).length,
      "the census found accent in fewer files than the ten that carry it",
    ).toBe(10);

    // AND THE PICKER SPENT NONE OF IT ON THE THINGS THAT WOULD HAVE BEEN A
    // NINTH ENTRY. The cheap-step tick is --color-boundary, the unaffordable
    // detent is --color-workspace behind a --color-divider hairline, and the
    // default marker is the soft dot it always was.
    const picker = code(componentPath("ColourPicker.svelte"));
    for (const selector of [".tick", ".detent.unaffordable", ".home"]) {
      expect(
        rulesOf(picker).find((rule) => rule.selector.trim() === selector)?.body,
        `${selector} paints in accent, which is a ninth entry on the reserved list`,
      ).not.toContain("--color-action");
    }
    // The lock's held state is not the accent either (its shackle and ink).
    for (const name of ["Knob.svelte", "Swatch.svelte"]) {
      const held = rulesOf(code(componentPath(name))).filter((rule) =>
        rule.selector.includes('.lock[aria-pressed="true"]'),
      );
      for (const rule of held) {
        expect(
          rule.body,
          `${name}: ${rule.selector} spends accent`,
        ).not.toContain("--color-action");
      }
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
    //
    // WIDENED BY ONE MORE ON 2026-09-17 (change 5), ON THE SAME ROW. The
    // brightness field (BrightnessField.svelte) refuses a typed value outside
    // 1..255 or one that is not a whole number exactly as MidiField.svelte
    // does: the text kept, its boundary and its message in this ink, on both
    // routes. Never on a button.
    //
    // AND THE METERS LEFT THE INSPECTOR AT 13.1-07 (13.1-CONTEXT D-10, the
    // user's word: "TUNING, so code limit visualiztation should be removed,
    // lets not show that"). BudgetMeter.svelte still carries the ink - the
    // Sandbox route mounted it twice under its own room line until change
    // 10A (below) - but the workspace's inspector renders no meter, no TUNING
    // caption and no forecast ghost; TUNE-05's line, BudgetMessage.svelte,
    // is what renders after the last section, alone.
    const TOKEN = "--color-error-ink";
    const SURFACE = "--color-error-surface";
    const files = uiFiles().filter((file) => file.endsWith(".svelte"));
    const carriers = files.filter((file) => code(file).includes(TOKEN));
    const surfaces = files.filter((file) => code(file).includes(SURFACE));

    expect(files.length, "the ui directory was walked").toBeGreaterThan(7);
    expect(
      carriers.sort(),
      "the error ink is scoped to the meter, the message, the destination zone's over-budget refusal (DestinationZone.svelte since 13.1-06, SurfaceActions.svelte's destination half before it), the Sandbox's refused field, the brightness field and the stepper's refused boundary (change 16), and appears nowhere else under src/lib/ui/ - the walk excludes *.spec.ts, where identity.spec.ts legitimately names the token",
    ).toEqual([
      `${UI_DIR}/BrightnessField.svelte`,
      `${UI_DIR}/BudgetMessage.svelte`,
      `${UI_DIR}/BudgetMeter.svelte`,
      `${UI_DIR}/DestinationZone.svelte`,
      `${UI_DIR}/MidiField.svelte`,
      // Change 16: the stepper's field carries the refused boundary for the
      // MIDI field (the same rule, on the shape they share); its message
      // stays MidiField's. Never on a box.
      `${UI_DIR}/Stepper.svelte`,
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

    // WHERE THEY LIVE SINCE 13.1-07: the message alone renders inside the
    // inspector, as the child the shell's Inspector draws after its last
    // section - which is MIDI output on every entry that addresses the wire.
    // The meters are hidden by the user's word (D-10): no <BudgetMeter, no
    // TUNING caption, no forecast, no ghost in the region; the two numbers
    // ride on the region's root as data attributes for the e2e suite, and
    // the region still wires the over-budget refusal upward (onbudget) and
    // still measures (cost() through the tuner). TUNE-05's four clauses are
    // BudgetMessage's line and the zone's disabled Apply, unchanged.
    const region = code(componentPath("TuningRegion.svelte"));
    const inspector = region.slice(
      region.indexOf("<Inspector"),
      region.indexOf("</Inspector>"),
    );
    expect(inspector.length, "the Inspector block was found").toBeGreaterThan(
      100,
    );
    expect(
      occurrences(region, "<BudgetMeter"),
      "a 908 meter renders in the workspace's inspector again - hidden by the user's word (13.1-07, D-10)",
    ).toBe(0);
    for (const relic of [
      "TUNING_CAPTION",
      "METERS_UNAVAILABLE",
      "forecast",
      "ghost",
      "tuning-meters",
    ]) {
      expect(
        region,
        `TuningRegion.svelte still carries "${relic}" - the fourth group is hidden (13.1-07, D-10)`,
      ).not.toContain(relic);
    }
    expect(
      occurrences(inspector, "<BudgetMessage"),
      "the ladder message no longer renders inside the inspector",
    ).toBe(1);
    expect(
      inspector.indexOf("<BudgetMessage"),
      "the message renders before the sections rather than after them - it is a child, drawn under the last section",
    ).toBeGreaterThan(inspector.indexOf("sections={["));
    // The numbers survive as attributes on the root, machine-readable and
    // never painted, so settled() and recomputed() in the e2e suite keep
    // their anchors; the refusal still reaches the zone through onbudget.
    for (const attribute of [
      "data-setup={view?.setup.used}",
      "data-timer={view?.timer.used}",
      "data-busy={busy}",
    ]) {
      expect(
        region,
        `the region's root does not carry ${attribute} - the suite reads the numbers there since the meters went (13.1-07)`,
      ).toContain(attribute);
    }
    expect(region).toContain("onbudget?.(next?.reason)");
    expect(region).toContain("<BudgetMessage {ladder} {over} />");
    // AND THE SANDBOX'S TWO MOUNTS WENT ON 2026-09-18 (change 10A, the
    // user's word: "hide the character count and limit from the user
    // entirely for now"): the Sandbox route mounts no meter and paints no
    // number about the budget - the cap's refusal and Store's are worded
    // without one. BudgetMeter.svelte stays in the tree UNMOUNTED for the
    // "for now" - its by-name deletion (D-12) is the bench's question, not
    // this change's - so it still carries the ink and its numerals below.
    const sandboxRoute = code("src/routes/sandbox/[draftId]/+page.svelte");
    expect(
      occurrences(sandboxRoute, "<BudgetMeter"),
      "the Sandbox mounts a meter again - hidden by the user's word (change 10A)",
    ).toBe(0);
    expect(
      sandboxRoute,
      "a number about the budget is painted on the Sandbox (change 10A)",
    ).not.toContain("908");
    // And the numbers are TUNE-03's own words where they are still painted:
    // `{used} / 908`, a percentage, tabular numerals so the column never
    // jitters while a knob turns.
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

  it("the five sections are sections.ts's rule over every card's knobs, in one fixed order, and the region draws only the ones that hold a knob", () => {
    // CHANGE 16 (2026-09-21). From 13-09 to change 16 the inspector was PDF
    // page 5's three groups - Behavior, Appearance, MIDI output - and D-21's
    // 2 x 2 numeric grid with a ResizeObserver reading layout.ts's reflow
    // width. The user's word regrouped the rows by what they change, one row
    // per knob, so the observer, the grid and the two layout.ts reads are
    // gone from the region: the numbers stay in layout.ts for the shell.
    const region = componentPath("TuningRegion.svelte");
    const regionRaw = raw(region);
    const regionCode = code(region);
    expect(regionRaw.length, "TuningRegion.svelte was read").toBeGreaterThan(
      1000,
    );
    for (const relic of [
      "ResizeObserver",
      "NUMERIC_GRID_REFLOW",
      "INSPECTOR_INSET",
      "gridColumns",
      "SECTION_BEHAVIOR",
      "SECTION_APPEARANCE",
      "isMidiDestination(knob) &&",
    ]) {
      expect(regionCode, `the region still carries ${relic}`).not.toContain(
        relic,
      );
    }

    // ---- THE RULE, TOTAL AND FIXED. Every knob on every card lands in one
    // of the five; the order is the constant's; the MIDI section is
    // surprise.ts's predicate, so it is exactly what Randomize preserves.
    expect(SECTION_ORDER).toEqual(["look", "feel", "sound", "midi", "sync"]);
    let counted = 0;
    const seen = new Set<string>();
    for (const entry of CATALOG) {
      for (const knob of stampKnobs(entry)) {
        const section = sectionOf(knob);
        expect(SECTION_ORDER, `${entry.id}.${knob.id} -> ${section}`).toContain(
          section,
        );
        expect(
          section === "midi",
          `${entry.id}.${knob.id}: the MIDI section is not surprise.ts's predicate`,
        ).toBe(isMidiDestination(knob));
        if (knob.kind === "colour")
          expect(section, `${entry.id}.${knob.id} is a colour`).toBe("look");
        seen.add(section);
        counted += 1;
      }
    }
    expect(counted, "every card's knobs were walked").toBeGreaterThan(100);
    expect([...seen].sort(), "every section is used by some card").toEqual([
      "feel",
      "look",
      "midi",
      "sound",
      "sync",
    ]);
    // The witnesses, one per section and the edges of the word rule.
    const at = (entryId: string, knobId: string) => {
      const knob = stampKnobs(byId(entryId)!).find((k) => k.id === knobId);
      expect(knob, `${entryId} declares ${knobId}`).toBeDefined();
      return sectionOf(knob!);
    };
    expect(at("aurora", "speed")).toBe("feel");
    expect(at("aurora", "colour")).toBe("look");
    expect(at("orbit", "sync")).toBe("sync");
    expect(at("orbit", "division")).toBe("sync");
    expect(at("ghost", "division"), "Clocks a point").toBe("sync");
    expect(at("orbit", "tempo"), "a tempo is a speed").toBe("feel");
    expect(at("orbit", "note1"), "Ring 1 MIDI note is the wire").toBe("midi");
    expect(at("dial", "send"), "Send is the wire").toBe("midi");
    expect(at("chorus", "key")).toBe("sound");
    expect(at("chorus", "velocity")).toBe("sound");
    expect(at("chorus", "inversion")).toBe("sound");
    expect(at("stage", "modifier")).toBe("sound");
    expect(at("ninepads", "grid"), "Pads").toBe("feel");
    // Change 17B: the alarm note is the Alarm output's Number ("Alarm MIDI note"), on the wire.
    expect(at("pomodoro", "note"), "Alarm MIDI note").toBe("midi");
    const grouped = groupBySection(stampKnobs(byId("orbit")!));
    expect(grouped.midi.map((k) => k.id)).toEqual([
      "note1",
      "note2",
      "note3",
      "note4",
      "channel",
      // Change 17B: the four rings' Type, Channel and Receive (the panel draws them by output).
      "type1",
      "receive1",
      "type2",
      "channel2",
      "receive2",
      "type3",
      "channel3",
      "receive3",
      "type4",
      "channel4",
      "receive4",
    ]);
    expect(grouped.sync.map((k) => k.id)).toEqual(["sync", "division"]);
    expect(grouped.look.length).toBe(4);

    // ---- THE REGION DRAWS THEM: five snippets, the five titles from the
    // copy module, Look unconditional, the rest gated on their group; the
    // MIDI snippet renders one MidiField per knob and no rack; the actions
    // row after the last section as the inspector's child; the stamp
    // notice as its lead.
    for (const name of ["look", "feel", "sound", "midi", "sync", "lead"]) {
      expect(regionCode, `no ${name} snippet`).toContain(
        `{#snippet ${name}()}`,
      );
    }
    for (const title of [
      "SECTION_LOOK",
      "SECTION_FEEL",
      "SECTION_SOUND",
      "SECTION_MIDI",
      "SECTION_SYNC",
    ]) {
      expect(regionCode, `the inspector does not render ${title}`).toContain(
        `title: ${title}`,
      );
    }
    expect(SECTION_LOOK).toBe("Look");
    expect(SECTION_FEEL).toBe("Feel");
    expect(SECTION_SOUND).toBe("Sound");
    expect(SECTION_MIDI).toBe("MIDI");
    expect(SECTION_SYNC).toBe("Sync");
    expect(regionCode).toContain(
      "const grouped = $derived(groupBySection(knobViews))",
    );
    expect(regionCode, "Look is gated").toContain(
      'if (name === "look") out.push({ title: SECTION_LOOK, content: look });',
    );
    expect(regionCode).toContain("grouped.midi.length > 0");
    const snippet = (name: string) =>
      regionCode.slice(
        regionCode.indexOf(`{#snippet ${name}()}`),
        regionCode.indexOf(
          "{/snippet}",
          regionCode.indexOf(`{#snippet ${name}()}`),
        ),
      );
    const midi = snippet("midi");
    expect(midi, "the MIDI section hands its knobs to the rack").not.toContain(
      "<KnobRack",
    );
    // Change 17: the outputs' blocks, then the MIDI knobs no output names.
    expect(midi).toContain("{#each outputViews as out (out.id)}");
    expect(midi).toContain("{#each blockRows(out) as knob (knob.id)}");
    expect(midi).toContain("{#each looseMidi as knob (knob.id)}");
    expect(midi).toContain(
      "<MidiField {knob} onchange={changeKnob} onreset={resetKnob} />",
    );
    expect(midi, "the MIDI rows lost their test id").toContain(
      'data-testid="midi-grid"',
    );
    expect(
      midi,
      "section 16's helper is not read by a screen reader",
    ).toContain('<p class="sr-only">{MIDI_HELPER}</p>');
    for (const name of ["look", "feel", "sound", "sync"]) {
      expect(snippet(name), `the ${name} section renders no rack`).toContain(
        "<KnobRack",
      );
    }
    expect(snippet("look"), "the brightness field is not under Look").toContain(
      "<BrightnessField",
    );
    expect(
      snippet("sync"),
      "the preview's hold line is not under Sync",
    ).toContain("{PREVIEW_INTERNAL_CLOCK}");
    expect(snippet("lead")).toContain("<StampNotice");
    const inspector = regionCode.slice(
      regionCode.indexOf("<Inspector"),
      regionCode.indexOf("</Inspector>"),
    );
    expect(
      inspector.indexOf('data-testid="surprise-me"'),
      "Randomize is not the inspector's child after the sections",
    ).toBeGreaterThan(inspector.indexOf("{sections}"));
    expect(regionCode).toContain("{lead}");
    // The MIDI partition is surprise.ts's predicate, still: the roll's scope.
    expect(
      regionCode,
      "the rollable list is not the rack minus the MIDI predicate",
    ).toContain("knobViews.filter((knob) => !isMidiDestination(knob))");
    expect(
      /advanced/i.test(regionCode),
      "TuningRegion.svelte renders something called Advanced - section 7's tier is a decision written down, not an empty disclosure",
    ).toBe(false);
    expect(
      regionRaw,
      "the header no longer quotes section 7's boundary, so the next person will add the empty Advanced disclosure",
    ).toContain("Use actual parameter names");
    expect(regionRaw).toContain("THERE IS NO ADVANCED SECTION");
    // The headline is one constant, handed as a snippet; the compiler
    // arrives inside onMount (test 1's boundary, restated).
    expect(regionCode).toContain("INSPECTOR_HEADLINE");
    expect(INSPECTOR_HEADLINE.length, "two lines, the PDF's").toBe(2);
    expect(regionCode).toContain('await import("$lib/tune/model")');
    expect(regionCode, "the tuner is built statically").not.toMatch(
      /from[ ]*["']\$lib\/tune\/model["']/,
    );
  });

  it("every one of the twelve knob kinds resolves to a widget the row renders, and the boundary is four words to a row, a select from five, a stepper past two integers", () => {
    // THE RULE IS TOTAL AND THE ROW RENDERS EVERYTHING IT CAN RETURN. The
    // widget vocabulary is read off Knob.svelte's own branches rather than
    // typed: every `view.widget === "..."` the markup tests, plus the
    // radiogroup that is its else branch, plus the colour block KnobRack
    // .svelte takes out of the row list.
    const knob = code(componentPath("Knob.svelte"));
    const rack = code(componentPath("KnobRack.svelte"));
    const branches = new Set(
      [...knob.matchAll(/view[.]widget === "([a-z]+)"/g)].map((m) => m[1]),
    );
    expect(
      [...branches].sort(),
      "Knob.svelte's widget branches are not the select, the stepper and the swatch",
    ).toEqual(["select", "stepper", "swatch"]);
    expect(knob, "the else branch is no longer a radiogroup").toContain(
      'role="radiogroup"',
    );
    expect(rack, "the rack no longer takes the colour knobs out").toContain(
      'row.widget === "colour"',
    );
    expect(knob, "no rail survives: a range input is a slider").not.toContain(
      'type="range"',
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

    // THE 4/5 BOUNDARY (13-09, section 7): four worded options are the
    // segmented row, five and above the select - and the select has no
    // ceiling since change 16 (CHORUS's twelve roots read as one). Driven
    // with real scale words, because a scale whose set is not in the table
    // would read as its semitones instead.
    const scales = Object.keys(SCALE_WORDS);
    expect(scales.length, "the scale table has enough words").toBeGreaterThan(
      9,
    );
    expect(SEGMENTED_MAX, "the row holds four").toBe(4);
    expect(widgetFor("scale", scales.slice(0, 4))).toBe("words");
    expect(
      widgetFor("scale", scales.slice(0, 5)),
      "five worded options must be a select, not a row (the boundary moved to 4/5 at 13-09)",
    ).toBe("select");
    expect(widgetFor("scale", scales.slice(0, 8))).toBe("select");
    expect(widgetFor("scale", scales.slice(0, 9))).toBe("select");
    const notes = (n: number) =>
      Array.from({ length: n }, (_, i) => String(48 + i));
    expect(widgetFor("note", notes(4))).toBe("words");
    expect(widgetFor("note", notes(5))).toBe("select");
    expect(widgetFor("note", notes(12)), "CHORUS's twelve roots").toBe(
      "select",
    );
    expect(
      widgetFor("note", notes(NOTE_SELECT_MAX + 1)),
      "a long note ladder is typed",
    ).toBe("stepper");
    // Integers: two are words, three a stepper (12-05, change 16).
    expect(widgetFor("count", ["9", "16"])).toBe("words");
    expect(widgetFor("count", ["41", "82", "123"])).toBe("stepper");
    expect(widgetFor("amount", SEVEN_INTEGERS)).toBe("stepper");
    // The select renders the same values in the same order, one <option> each.
    expect(knob, "the select does not render one option per value").toContain(
      "{#each view.values as value, at (at)}",
    );
    expect(knob).toContain("<option value={at} selected={at === view.index}");

    // THE WHOLE SHELF, THROUGH THE RESOLVER THE PANEL USES (the effective
    // kind, as model.ts reads it: a Send is a controller number whatever
    // kind the preset declared): every widget a branch renders, and the
    // split docs/TUNING-REVIEW.md records.
    const split: Record<string, number> = {};
    for (const entry of CATALOG) {
      for (const k of stampKnobs(entry)) {
        const kind =
          k.kind === "note" && isControllerNumber(k) ? "amount" : k.kind;
        // Change 17: a knob in a MIDI output's block is worded by its role (model.ts reads it so).
        const widget = widgetFor(
          kind,
          k.options,
          k.id,
          roleOfKnob(entry).get(k.id),
        );
        expect(renderable.has(widget), `${entry.id}.${k.id}`).toBe(true);
        split[widget] = (split[widget] ?? 0) + 1;
      }
    }
    expect(
      split,
      "the shelf's widget split moved: 196 knobs on 27 cards (docs/TUNING-REVIEW.md; change 17 added ARC's Type, a select, and Receive, a words row; change 17B each card's outputs, CHORUS's Type a words row; CONSOLE the Faders Type a select, Receive a words row; GHOST two axis blocks, each Type a select; LUMEN the Hue and Depth blocks; MORPH four corner blocks; ORBIT four ring blocks; POMODORO the Transport and Alarm blocks; QUADRANT four quadrant blocks)",
    ).toEqual({ colour: 39, words: 55, select: 20, stepper: 82 });
  });

  it("MIDI is one typed stepper row per MIDI knob over its closed list: the literal shown, a typed value mapped to its index or refused with the offered values, the cue on a Lua channel", () => {
    // 13.1-07, 13.1-CONTEXT D-09; change 16's row. THREE HALVES. The door:
    // view.ts's typedIndex maps a typed whole number to the knob's index or to
    // nothing, never to a nearest option - a MIDI destination is validated,
    // not snapped. The field: rendered with svelte/server for its shape - the
    // PDF's label, Stepper.svelte's spinbutton with a numeric keyboard, the
    // knob's own literal, the two step boxes, the cue on a Lua channel (read
    // by a screen reader, and the label's title) and not on a preset's. The
    // wiring: every keystroke through the door and then onchange(knob.id,
    // index), a refused one through aria-invalid with the message under it.
    const cc = ARC.knobs.find((knob) => knob.id === "cc");
    const channel = ARC.knobs.find((knob) => knob.id === "channel");
    expect(cc, "Arc has a cc knob").toBeDefined();
    expect(channel, "Arc has a channel knob").toBeDefined();
    // Arc's CC is 0..127 since change 17 (its five old rungs first); D-09's ledgered list of
    // five is the fixture the door is read against, as a literal.
    expect(cc!.values.slice(0, 5)).toEqual(["1", "16", "20", "74", "102"]);
    expect(cc!.values).toHaveLength(128);
    const ccLiterals = ["1", "16", "20", "74", "102"];
    const channelLiterals = channel!.values;
    expect(channelLiterals[0], "a Lua channel is zero-based (X-08)").toBe("0");
    expect(channelLiterals).toHaveLength(16);

    // ---- THE DOOR. A typed literal to an index; not offered to nothing;
    // never snapped to the nearest option; leading zeros and spaces are the
    // same number; a word is nothing.
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
    expect(integerRun(channelLiterals)).toEqual({ min: 0, max: 15 });
    expect(
      integerRun(Array.from({ length: 16 }, (_, i) => String(i + 1))),
    ).toEqual({ min: 1, max: 16 });
    expect(integerRun(ccLiterals)).toBeUndefined();
    expect(integerRun([])).toBeUndefined();

    // ---- THE WORDS, D-09's ledgered forms from ONE builder.
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
      widget: "stepper",
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
    expect(ccBody, "a spinbutton").toContain('role="spinbutton"');
    expect(ccBody, "with a numeric keyboard").toContain('inputmode="numeric"');
    expect(ccBody).toContain('autocomplete="off"');
    expect(ccBody, "the value is the knob's own literal").toMatch(/value="74"/);
    expect(ccBody, "the rank is the fourth of five").toContain(
      'aria-valuenow="3"',
    );
    expect(ccBody).toContain('data-testid="midi-field-cc-input"');
    expect(ccBody, "the two step boxes").toContain(
      'data-testid="midi-field-cc-down"',
    );
    expect(ccBody).toContain('data-testid="midi-field-cc-up"');
    expect(ccBody).toContain(">CC number</label>");
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
    expect(ccBody, "a MIDI field carries no lock").not.toContain(
      "aria-pressed",
    );
    const luaBody = renderField(
      field("channel", "MIDI channel", channelLiterals, 0),
    );
    expect(luaBody, "a Lua channel shows the firmware's 0 (X-08)").toMatch(
      /value="0"/,
    );
    expect(luaBody).toContain(">Channel</label>");
    expect(luaBody, "the cue is under a Lua channel").toContain(
      LUA_CHANNEL_CUE,
    );
    expect(luaBody).toContain('data-testid="midi-field-channel-cue"');
    expect(luaBody, "the cue is not in the field's aria-describedby").toMatch(
      /aria-describedby="[^"]*-cue"/,
    );
    expect(luaBody, "the cue is not the label's title").toMatch(
      /title="The firmware counts channels from 0/,
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
    // and names the reason; the last good value is the knob's readout; the
    // boxes walk the rungs in value order.
    const source = code(componentPath("MidiField.svelte"));
    expect(source).toContain("typedIndex(literals, text)");
    expect(source).toContain("onchange(knob.id, index)");
    expect(source, "the refusal is not the offered line").toContain(
      "problem = offeredLine(offeredAs, literals)",
    );
    expect(source).toContain("problem = TYPE_A_NUMBER");
    expect(source).toContain("invalid={problem !== undefined}");
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
    expect(source, "the boxes do not walk the rungs in value order").toContain(
      "valueOrder(literals)",
    );
    expect(source, "a MIDI field snaps - it validates").not.toContain(
      "nearestRung",
    );
    expect(source, "no free numeric: never type=number").not.toContain(
      'type="number"',
    );
    // 44px on the reset, both axes; every corner declared is 0 (D-01); never
    // a font the instrument register reserves, never accent on a control.
    const reset = rulesOf(source).find((r) => r.selector.trim() === ".box");
    expect(reset?.body).toContain("min-inline-size: 44px");
    expect(reset?.body).toContain("min-block-size: 44px");
    for (const file of ["MidiField.svelte", "Stepper.svelte"]) {
      for (const rule of rulesOf(code(componentPath(file)))) {
        for (const match of rule.body.matchAll(
          /border-radius[ ]*:[ ]*([^;]+)/g,
        )) {
          expect(
            match[1].trim(),
            `${file} ${rule.selector} declares a corner`,
          ).toBe("0");
        }
      }
    }
    expect(source).not.toContain("--font-mono");
    const stepper = code(componentPath("Stepper.svelte"));
    expect(
      rulesOf(stepper).find((r) => r.selector.trim() === ".input")?.body,
      "the typed value is not in the mono face",
    ).toContain("var(--font-mono)");
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
    expect(knob, "the marker is not keyed on changed").toContain(
      '<div class="row" class:changed class:bare={!caption}>',
    );
    expect(knob, "the marker carries no accessible sentence").toMatch(
      /[{]#if changed[}]\s*<span class="sr-only" data-testid="knob-[{]view[.]id[}]-changed"/,
    );
    expect(knob, "the reset is not disabled at the default").toContain(
      "disabled={!changed}",
    );
    expect(knob, "the reset is not named for its field").toContain(
      "aria-label={fieldResetName(view.label)}",
    );
    expect(knob, "the reset does not call the row's one reset").toMatch(
      /data-testid="knob-[{]view[.]id[}]-reset"\s+disabled=[{]!changed[}]\s+aria-label=[{]fieldResetName[(]view[.]label[)][}]\s+title=[{]FIELD_RESET[}]\s+onclick=[{]onreset[}]/,
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

  it("the rows, rendered (change 16): a stepper shows the rung with its unit and its rank on the ladder, a segmented row is real radios in joined boxes, a select lists every rung, a swatch chip reads its channels, and every row stacks under 380px of its own container", () => {
    // svelte/server renders each skin from a KnobView the panel would build;
    // the behaviour a browser owns (the arrows, a typed value snapping, the
    // chip opening the block) is pressed in e2e/tuning.e2e.ts.
    const renderKnob = (view: KnobView, held = false) =>
      render(Knob, {
        props: {
          view,
          held,
          onchange: () => undefined,
          onreset: () => undefined,
          onhold: () => undefined,
        },
      }).body;

    // A STEPPER over SNAKE's descending ladder, at 220 ms: the field reads
    // 220 with the unit beside it, the rank is 2 of 0..3 on the VALUE
    // order (110 160 220 300), both boxes live, four ticks with the third
    // marked, the reset live and the marker on because 220 is not 160.
    const snake: KnobView = {
      id: "speed",
      label: "Step time",
      unit: "ms",
      kind: "speed",
      widget: "stepper",
      values: ["300", "220", "160", "110"].map((label) => ({ label })),
      literals: ["300", "220", "160", "110"],
      readout: "220",
      index: 1,
      default: 2,
    };
    const stepper = renderKnob(snake);
    expect(stepper).toContain('data-testid="knob-speed"');
    expect(stepper).toContain('data-index="1"');
    expect(stepper).toContain('data-widget="stepper"');
    expect(stepper).toContain('data-changed="true"');
    expect(stepper, "the label is the display label, unit split off").toContain(
      ">Step time</label>",
    );
    expect(stepper).toMatch(/value="220"/);
    expect(stepper, "the unit beside the value").toContain(">ms</span>");
    expect(stepper, "the rank is on the value order").toContain(
      'aria-valuenow="2"',
    );
    expect(stepper).toContain('aria-valuemax="3"');
    expect(stepper).toContain('aria-valuetext="220 ms"');
    expect(stepper, "the snap rule describes the field").toContain(SNAP_HINT);
    expect(stepper.match(/class="tick[^"]*"/g)?.length, "four ticks").toBe(4);
    expect(
      stepper.match(/class="tick[^"]* at"/g)?.length,
      "one tick is the rung the field is at",
    ).toBe(1);
    expect(stepper).toContain(`aria-label="${STEP_DOWN}"`);
    expect(stepper).toContain(`aria-label="${STEP_UP}"`);
    expect(stepper).not.toMatch(/data-testid="knob-speed-down"[^>]*disabled/);
    expect(stepper).not.toMatch(/data-testid="knob-speed-reset"[^>]*disabled/);
    expect(stepper).toContain('data-testid="knob-speed-changed"');
    expect(stepper, "the lock is on the row").toContain(
      'data-testid="knob-speed-hold"',
    );
    expect(stepper).toContain(`aria-label="${KNOB_HOLD}"`);
    // At the foot of the ladder the down box is disabled; held reads Locked.
    const foot = renderKnob({ ...snake, index: 3, default: 3 }, true);
    expect(foot).toMatch(/data-testid="knob-speed-down"[^>]*disabled/);
    expect(foot).not.toMatch(/data-testid="knob-speed-up"[^>]*disabled/);
    expect(foot).toMatch(/data-testid="knob-speed-reset"[^>]*disabled/);
    expect(foot).toContain('data-changed="false"');
    expect(foot).toContain('aria-pressed="true"');
    expect(foot).toContain(`aria-label="${KNOB_HELD}"`);
    // A long ladder draws no ticks, only the mark.
    const long = renderKnob({
      ...snake,
      id: "n",
      unit: undefined,
      values: Array.from({ length: 128 }, (_, i) => ({ label: String(i) })),
      literals: Array.from({ length: 128 }, (_, i) => String(i)),
      readout: "36",
      index: 36,
      default: 36,
    });
    expect(long.match(/class="tick[^"]*"/g)?.length).toBe(1);

    // A SEGMENTED ROW: real radios in labels under a radiogroup, one checked,
    // the selected label marked, no select, no spinbutton.
    const words = renderKnob({
      id: "direction",
      label: "Direction",
      kind: "direction",
      widget: "words",
      values: [{ label: "Rising" }, { label: "Falling" }],
      index: 1,
      default: 0,
    });
    expect(words).toContain('role="radiogroup"');
    expect(occurrences(words, 'type="radio"')).toBe(2);
    expect(occurrences(words, "checked")).toBe(1);
    expect(words).toMatch(/class="option[^"]*selected[^"]*"[^>]*>[^]*Falling/);
    expect(words).not.toContain("<select");
    expect(words).not.toContain('role="spinbutton"');
    expect(words, "the default is described once on the group").toContain(
      "Default is Rising.",
    );

    // A SELECT: one option per rung, the rung selected, the house arrow drawn
    // by the wrapper rather than the engine.
    const select = renderKnob({
      id: "key",
      label: "Key",
      kind: "note",
      widget: "select",
      values: Array.from({ length: 12 }, (_, i) => ({
        label: `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][i]}3`,
      })),
      index: 4,
      default: 0,
    });
    expect(occurrences(select, "<option")).toBe(12);
    expect(select).toMatch(/<option value="4" selected[^>]*>E3</);
    expect(select).toContain('<label class="label type-micro');
    const knobRules = rulesOf(code(componentPath("Knob.svelte")));
    expect(
      knobRules.find((r) => r.selector.trim() === ".select")?.body,
    ).toContain("appearance: none");
    expect(
      knobRules.find((r) => r.selector.trim() === ".select-wrap::after")?.body,
      "the arrow is not two straight edges",
    ).toContain("border-inline-end: 1px solid");

    // THE SEGMENTED CONTROL'S SHAPE: joined boxes (a shared edge collapsed),
    // the chosen one on the action colour by edge and word, never a fill.
    const optionRule = knobRules.find((r) => r.selector.trim() === ".option");
    expect(optionRule?.body).toContain("margin-inline-start: -1px");
    expect(optionRule?.body).toContain(
      "border: 1px solid var(--color-boundary)",
    );
    expect(
      knobRules.find((r) => r.selector.trim() === ".option.selected")?.body,
    ).toContain("border-color: var(--color-action)");
    expect(
      knobRules.find((r) => r.selector.trim() === ".option.selected")?.body,
      "the chosen segment is a fill",
    ).not.toContain("background");

    // EVERY ROW COMPONENT IS ON ONE GRID (change 16b) - label | control |
    // reset | lock, the label column --tune-label-w, the control column the
    // rest, the two box columns fixed 44 and always present - AND STACKS UNDER
    // 380px OF ITS OWN CONTAINER: the root is the container, the row queries
    // it, so the rack, the picker and the Sandbox need none; stacked, the
    // control still fills its column and the boxes keep their two columns.
    // The label takes the micro face on every row.
    const GRID =
      "grid-template-columns: var(--tune-label-w, 96px) minmax(0, 1fr) 44px 44px;";
    const STACKED = "grid-template-columns: minmax(0, 1fr) 44px 44px;";
    for (const name of [
      "Knob.svelte",
      "MidiField.svelte",
      "Swatch.svelte",
      "BrightnessField.svelte",
    ]) {
      const source = code(componentPath(name));
      const rules = rulesOf(source);
      const row = rules.find((r) => r.selector.trim() === ".row");
      expect(row?.body, `${name}'s row is not the four-column grid`).toContain(
        GRID,
      );
      expect(row?.body, `${name}'s columns are not 8px apart`).toContain(
        "column-gap: 8px;",
      );
      expect(row?.body, `${name}'s row is not 44px`).toContain(
        "min-block-size: 44px;",
      );
      const control = rules.find((r) => r.selector.trim() === ".control");
      expect(
        control?.body,
        `${name}'s control does not fill its column`,
      ).toContain("inline-size: 100%;");
      expect(control?.body, `${name}'s control is under 44px`).toContain(
        "min-block-size: 44px;",
      );
      expect(source, `${name} is not its row's container`).toContain(
        "container-type: inline-size",
      );
      expect(source, `${name} does not stack under 380px`).toContain(
        "@container (width < 380px)",
      );
      expect(
        source.slice(source.indexOf("@container (width < 380px)")),
        `${name}'s stacked row does not keep the two box columns`,
      ).toContain(STACKED);
      expect(source, `${name}'s label is not the micro face`).toContain(
        'class="label type-micro"',
      );
      expect(
        source,
        `${name} keeps a helper sentence inside the row`,
      ).not.toContain('class="helper type-helper"\n');
    }
    // The rack draws the hairline between rows and nothing else.
    const rack = code(componentPath("KnobRack.svelte"));
    expect(rack).toContain(".rack > :global(* + *)");
    expect(rack).not.toContain("layout");
    expect(rack).not.toContain("stacked");
  });

  it("Brightness is one typed field under Look on every card: 1..255 with the last good value kept, out of range refused as 'Brightness is 1 to 255.', the marker and a per-field reset, never a knob and never rolled, Reset settings putting it back", async () => {
    // Change 5 (2026-09-17). The field: rendered with svelte/server for its
    // shape - the label, a text input with a numeric keyboard, the value,
    // the reset named for the field and disabled at 255, the marker off 255,
    // read-only under Play. The door: parseBrightness. The wiring: the
    // region mounts it under Look unconditionally (a card with no colour
    // knob has the section for the field alone), routes a value to
    // tuner.setBrightness and the reset to 255, and counts it in Reset
    // settings' disabled state. The scope: no entry has a knob called
    // brightness, so surprise.ts cannot reach it.
    const renderField = (value: number, readonly = false) =>
      render(BrightnessField, {
        props: {
          value,
          readonly,
          onchange: () => undefined,
          onreset: () => undefined,
        },
      }).body;
    const full = renderField(255);
    expect(full).toContain('data-testid="brightness-field"');
    expect(full, "a text input").toContain('type="text"');
    expect(full, "with a numeric keyboard").toContain('inputmode="numeric"');
    expect(full).toMatch(/value="255"/);
    expect(full).toContain(`>${BRIGHTNESS_LABEL}</label>`);
    expect(full, "nothing refused on arrival").not.toContain(
      'aria-invalid="true"',
    );
    expect(full, "the reset is disabled at 255").toMatch(
      /data-testid="brightness-field-reset"[^>]*disabled/,
    );
    expect(full).toContain(`aria-label="${fieldResetName(BRIGHTNESS_LABEL)}"`);
    expect(full).not.toContain('data-testid="brightness-field-changed"');
    expect(full).toContain('data-changed="false"');
    const half = renderField(128);
    expect(half).toMatch(/value="128"/);
    expect(half, "the marker off 255").toContain(
      'data-testid="brightness-field-changed"',
    );
    expect(half).toContain('data-changed="true"');
    expect(half).not.toMatch(
      /data-testid="brightness-field-reset"[^>]*disabled/,
    );
    const locked = renderField(128, true);
    expect(locked, "read-only under Play").toMatch(/<input[^>]*readonly/);
    expect(locked).toMatch(/data-testid="brightness-field-reset"[^>]*disabled/);

    // The door and the two refusals.
    expect(parseBrightness("128")).toEqual({ ok: true, value: 128 });
    expect(parseBrightness("300")).toEqual({ ok: false, reason: "range" });
    expect(parseBrightness("x")).toEqual({ ok: false, reason: "number" });
    expect(BRIGHTNESS_RANGE).toBe("Brightness is 1 to 255.");
    const field = code(componentPath("BrightnessField.svelte"));
    expect(field).toContain("parseBrightness(text)");
    expect(field).toMatch(
      /parsed[.]reason === "number" [?] TYPE_A_NUMBER : BRIGHTNESS_RANGE/,
    );
    expect(field, "a good value reaches the owner").toContain(
      "onchange(parsed.value)",
    );
    expect(field, "a refused one keeps the text").toContain("refused = text");
    expect(field, "the floor").toContain("min-block-size: 44px");
    expect(field, "no corner (D-01)").not.toMatch(/border-radius:[ ]*[1-9]/);

    // The wiring in the region.
    const region = code(componentPath("TuningRegion.svelte"));
    expect(region).toContain("<BrightnessField");
    expect(region, "Look is unconditional").toContain(
      'if (name === "look") out.push({ title: SECTION_LOOK, content: look });',
    );
    expect(region).toMatch(
      /function changeBrightness[(]value: number[)][^}]*tuner[?][.]setBrightness[(]value[)]/,
    );
    expect(region).toMatch(
      /function resetBrightness[(][)][^}]*tuner[?][.]setBrightness[(]255[)]/,
    );
    expect(region, "Reset settings counts it").toContain(
      "brightnessNow === 255",
    );
    expect(region, "the owner is told").toContain(
      "onbrightness?.(next.brightness)",
    );

    // NOT A KNOB ANYWHERE, ON EITHER ROUTE, SINCE 2026-09-17 (BENCH-2026-09-16.txt
    // section 5b, the user's word: "one"). A preset carried the vendored compiler's
    // own five-detent knob under Behavior until then; it is retired, the state field
    // is pinned at Full by `baseStateFor`, and this field is every configuration's
    // one brightness. The assertion is over EVERY catalog entry's rack, Lua and
    // preset alike, through the same resolver the panel uses.
    for (const entry of CATALOG) {
      expect(
        entry.knobs.some(
          (k) => k.id === "brightness" || k.token === "@BRIGHTNESS",
        ),
        `${entry.id} declares brightness as a Lua knob`,
      ).toBe(false);
      expect(
        stampKnobs(entry).map((k) => k.id),
        `${entry.id}'s rack still carries a brightness knob`,
      ).not.toContain("brightness");
    }
    // The behaviour, on a real tuner: the view carries it, a move changes
    // it, a roll leaves it, Reset settings restores it.
    await padReady();
    const views: TuneView[] = [];
    const tuner = await buildTuner({
      entryId: "aurora",
      brightness: 200,
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
      expect((views.at(-1) as TuneView).brightness, "opened at 200").toBe(200);
      expect(
        tuner.knobs.map((k) => k.id),
        "aurora's rack still carries the retired knob",
      ).not.toContain("brightness");
      tuner.setBrightness(64);
      await settle();
      expect((views.at(-1) as TuneView).brightness).toBe(64);
      await tuner.surprise();
      await settle();
      expect((views.at(-1) as TuneView).brightness, "a roll left it").toBe(64);
      tuner.resetAll();
      await settle();
      expect((views.at(-1) as TuneView).brightness, "Reset settings").toBe(255);
    } finally {
      tuner.destroy();
    }
  });

  it("the MIDI outputs (change 17): an entry declares each output - its name, continuous or trigger, the knobs its Type, Channel, Number and Receive are - and the view carries the blocks and each knob's role; Type and Receive are worded by the role; the region draws Same channel for all, a block per output under its name, the number row gone under a pitch bend or a channel pressure; ARC's LFO is the first", async () => {
    // THE LADDERS every card declares an output with (tune/midi.ts).
    expect(CONTINUOUS_STATUSES).toEqual(["176", "224", "208"]);
    expect(
      typeValues({
        id: "t",
        name: "T",
        kind: "trigger",
        tokens: { type: "@T", channel: "@C" },
      }),
    ).toEqual(["144", "176"]);
    expect(
      typeValues({
        id: "t",
        name: "T",
        kind: "trigger",
        once: true,
        tokens: { type: "@T", channel: "@C" },
      }),
    ).toEqual(["144", "176", "192"]);
    expect(CHANNEL_VALUES).toEqual(
      Array.from({ length: 16 }, (_, i) => String(i)),
    );
    expect(numberValues()).toHaveLength(128);
    expect(numberValues(["74", "1"]).slice(0, 3)).toEqual(["74", "1", "0"]);
    expect(new Set(numberValues(["74", "1"])).size).toBe(128);
    expect(RECEIVE_VALUES).toEqual(["0", "13"]);
    // ARC's one output, resolved; its declaration holds, and a broken one is named.
    expect(resolveOutputs(ARC)).toEqual([
      {
        id: "lfo",
        name: "LFO",
        kind: "continuous",
        knobs: {
          type: "midiType",
          channel: "channel",
          number: "cc",
          receive: "midiReceive",
        },
      },
    ]);
    expect(outputProblems(ARC)).toEqual([]);
    const broken = {
      ...ARC,
      outputs: [
        {
          id: "lfo",
          name: "LFO",
          kind: "trigger" as const,
          tokens: { type: "@TYPE", channel: "@NOPE" },
        },
      ],
    };
    expect(outputProblems(broken)).toEqual([
      "arc output lfo: the Type's literals are not its types",
      "arc output lfo: channel names no knob (@NOPE)",
    ]);
    // THE WORDS by role, whatever the id: the Type three words (segmented), Receive two.
    expect(wordFor("mode", "224", "midiType", "type")).toBe("Pitch bend");
    expect(wordFor("mode", "13", "anything", "receive")).toBe("On");
    expect(wordFor("mode", "224", "midiType")).toBeUndefined();
    expect(widgetFor("mode", CONTINUOUS_STATUSES, "midiType", "type")).toBe(
      "select",
    );
    expect(widgetFor("mode", ["144", "176"], "biteType", "type")).toBe("words");
    expect(widgetFor("mode", RECEIVE_VALUES, "midiReceive", "receive")).toBe(
      "words",
    );
    expect(MIDI_TYPE_WORDS["208"]).toBe("Channel pressure");
    expect(RECEIVE_WORDS).toEqual({ "0": "Off", "13": "On" });
    expect(OUTPUT_ROLE_LABELS).toEqual({
      type: "Type",
      channel: "Channel",
      number: "Number",
      receive: "Receive",
    });
    expect(
      midiFieldLabel({ id: "channel", label: "MIDI channel", role: "channel" }),
    ).toBe("Channel");
    expect(
      midiFieldLabel({ id: "cc", label: "CC number", role: "number" }),
    ).toBe("Number");
    // A Type row renders as the rack's segmented control; an output's Channel takes the Lua cue.
    const typeRow = render(Knob, {
      props: {
        view: {
          id: "midiType",
          label: "Type",
          kind: "mode",
          widget: "words",
          values: ["CC", "Pitch bend", "Channel pressure"].map((label) => ({
            label,
          })),
          index: 1,
          default: 0,
          role: "type",
          output: "lfo",
        },
        lock: false,
        held: false,
        onchange: () => undefined,
        onreset: () => undefined,
        onhold: () => undefined,
      },
    }).body;
    expect(typeRow).toContain('role="radiogroup"');
    expect(typeRow).toContain("Pitch bend");
    const channelRow = render(MidiField, {
      props: {
        knob: {
          id: "ring1Channel",
          label: "Ring 1 MIDI channel",
          kind: "amount",
          widget: "stepper",
          values: CHANNEL_VALUES.map((label) => ({ label })),
          literals: CHANNEL_VALUES,
          readout: "0",
          index: 0,
          default: 0,
          role: "channel",
          output: "ring1",
        },
        onchange: () => undefined,
      },
    }).body;
    expect(channelRow, "an output's Channel carries the Lua cue").toContain(
      LUA_CHANNEL_CUE,
    );
    expect(channelRow).toContain(">Channel<");

    // THE VIEW, on a real tuner: ARC's knobs carry their roles, the view its one output.
    await padReady();
    const views: TuneView[] = [];
    const tuner = await buildTuner({
      entryId: "arc",
      onview: (view) => void views.push(view),
      onpreview: () => undefined,
      onladder: () => undefined,
      onover: () => undefined,
    });
    try {
      for (let i = 0; i < 64; i++) await Promise.resolve();
      const view = views.at(-1) as TuneView;
      expect(view.outputs.map((o) => o.id)).toEqual(["lfo"]);
      const byKnob = (id: string) => view.knobs.find((k) => k.id === id);
      expect(byKnob("midiType")).toMatchObject({
        role: "type",
        output: "lfo",
        widget: "select",
      });
      expect(byKnob("midiType")?.values.map((v) => v.label)).toEqual([
        "CC",
        "Pitch bend",
        "Channel pressure",
      ]);
      expect(byKnob("midiReceive")).toMatchObject({
        role: "receive",
        widget: "words",
        index: 1,
      });
      expect(byKnob("cc")).toMatchObject({ role: "number", widget: "stepper" });
      expect(byKnob("channel")).toMatchObject({ role: "channel" });
      // Change 17B: a card's channel READS 1..16 (the readout, the rows, the typed field's
      // literals); the knob's own literals, and so the wire, stay 0..15.
      expect(byKnob("channel")?.readout).toBe("1");
      expect(byKnob("channel")?.literals).toEqual(
        Array.from({ length: 16 }, (_, i) => String(i + 1)),
      );
      expect(byKnob("channel")?.values.map((v) => v.label)[15]).toBe("16");
      expect(ARC.knobs.find((k) => k.id === "channel")?.values[0]).toBe("0");
      expect(byKnob("shape")?.role).toBeUndefined();
      expect(
        groupBySection(view.knobs)
          .midi.map((k) => k.id)
          .sort(),
      ).toEqual(["cc", "channel", "midiReceive", "midiType"]);
    } finally {
      tuner.destroy();
    }

    // THE REGION: the blocks, Same channel for all, the number gone under 224 and 208.
    const region = code("src/lib/ui/TuningRegion.svelte");
    for (const needle of [
      "{#each outputViews as out (out.id)}",
      'data-testid="midi-output"',
      "data-output={out.id}",
      "{out.name}",
      "view={sameChannelView}",
      'status === "224" || status === "208"',
      'label: OUTPUT_ROLE_LABELS[knob.role ?? "type"]',
    ])
      expect(region, needle).toContain(needle);
    expect(SAME_CHANNEL).toBe("Same channel for all");
    expect(PER_OUTPUT).toBe("Per output");
  }, 60000);
});
