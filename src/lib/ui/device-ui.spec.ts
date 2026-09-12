// The structural gate over the seven components Phase 6 adds to src/lib/ui/.
//
// These rules keep the device chrome free of the compiler, free of a fourth
// colour, reachable by thumb, quiet in exactly one live region, monospaced only
// on its numerals, and honest about what each control announces. Every one is a
// property of the SOURCE rather than of a rendered tree, so all seven run in a
// second and none needs a browser. The e2e and the served-build measurements
// prove the behaviour; this proves the shape, on every commit rather than on
// every release. Six are over the seven device components; the seventh (plan
// 06-12) walks every component and route on the site, because the rule it
// holds - three live regions, and the chosen panel is not one - is a
// site-wide count rather than a property of one file.
//
// PHASE 7 (plan 07-09) ADDS TWO over the three install leaves - PutBack,
// KeepConfirm and InstallState: the eighth holds them light (no specifier
// outside the chunk guard's permitted paths), reachable (the 44px floor on
// every control), steady (the PUT BACK cell's three sizing twins and its 72px
// floor) and honest about what the confirmation is (a group, never a dialog);
// the ninth holds that every install sentence on their screens comes from the
// copy module rather than being retyped in markup. Plan 07-10 adds the tenth,
// over the four components it mounts the leaves into: the honesty slot holds
// five twins and no literal promising the site never writes, KEEP ON DEVICE is
// the borderless tier with all six reasons in its 48px cell, the install row
// is one column with PUT BACK first, and the coverflow's Escape handler asks
// the install store two questions before it un-chooses. Plan 07-11 adds the
// eleventh, over the header's three: the disclosure locks both of its controls
// under the session's writeLock on every leg and says where the copy of the
// module's own configuration is kept, the slot never reads a busy word or
// shows an install state, and the announcer is untouched - one live region,
// nothing from the install store, and no logic gained.
//
// PLAN 13-11 ADDS THREE, and two of them RENDER rather than scan: the device
// band was re-skinned and re-homed (the header's control into the shell, the
// disclosure into the footer as Device actions, the install phase into the
// context bar as one clause) and what has to survive that is behaviour -
// nine slot states from seventeen phases, three capability answers, a button
// exactly when a click acts, one mount of the disclosure with two openers,
// fifteen phases each accounted for, the four the spec has no row for present
// by name, and the four uncertain phases kept as four bodies and four
// clauses. svelte/server render() runs in this project (shell.spec.ts, 13-05),
// so the fourteenth walks the real session store through every phase and the
// fifteenth renders the bar with two props, one, and none. All thirteen above
// were run green BEFORE the three were added, and none was edited.
//
// EVERY SCAN STRIPS COMMENTS FIRST, and that is load-bearing rather than tidy.
// These components name in prose the very tokens, specifiers and attributes they
// are forbidden to use - DeviceSlot's header says "no width read, no matchMedia",
// DeviceDetails' says "no role=dialog", DeviceMark's names the accent - so a scan
// over raw source would go red on correct code, and the natural fix (deleting the
// paragraph) would delete the documentation that makes the rule survivable. So
// the comments stay and the scanner learns to read code.
//
// The stripper, the specifier matcher, the rule splitter and the non-vacuity
// habit are src/lib/ui/tune-ui.spec.ts's and src/lib/config-shape.spec.ts's,
// copied rather than reinvented, and every regular expression here is
// backslash-free in the same house style.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import {
  clearedCaption,
  keptCaption,
  keptMismatchBlock,
  nothingLandedBlock,
  partialBlock,
  settledCaption,
  unconfirmedBlock,
} from "$lib/device/install-copy";
import { type InstallPhase, install } from "$lib/device/install.svelte";
import {
  CAPTION_INSECURE,
  CAPTION_UNSUPPORTED,
  CONNECT_LABEL,
  type SessionPhase,
  slotStateOf,
} from "$lib/device/session-copy";
import { session } from "$lib/device/session.svelte";
import { PANEL_ID } from "./device-drawer.svelte";
import DeviceActions from "./DeviceActions.svelte";
import ConnectionControl from "./shell/ConnectionControl.svelte";
import ContextBar from "./shell/ContextBar.svelte";
import {
  UNCERTAIN_PHASES,
  UNCHARTED_PHASES,
  deviceClause,
} from "./shell/device-clause";

const repo = (rel: string) =>
  fileURLToPath(new URL(`../../../${rel}`, import.meta.url));

const UI_DIR = "src/lib/ui";

/**
 * The device components, SEVEN since plan 10-13. A literal list is unavoidable -
 * the directory also holds Phases 4 and 5's components, which these rules do
 * not all bind - so its length is asserted and every name is checked against
 * the directory listing in test 1. A rename, a deletion or an eighth device
 * component added without being listed is then a visible omission rather than a
 * silent gap that lets the tests pass while covering fewer files.
 *
 * Phase 6 added seven. `PickerExplainer.svelte` is the one that went: R-02
 * retires PICKER_EXPLAINER outright, and a component whose whole content was
 * that one sentence has no reason left to exist. The count moving is the
 * amendment being visible rather than silent.
 *
 * `Clear.svelte` is plan 10-13's one new file and takes the count back to
 * seven. Listing it is not bookkeeping: test 3's 44px walk DERIVES its list
 * from the presence of a control inside these files, so an unlisted control
 * component is one the walk never reads, and the walk would go green having
 * proved nothing about it.
 */
const DEVICE_COMPONENTS: readonly string[] = [
  "Clear.svelte",
  "DeviceDetails.svelte",
  "DeviceMark.svelte",
  "DeviceNote.svelte",
  "DeviceSlot.svelte",
  "FailureBlock.svelte",
  "SessionAnnouncer.svelte",
];

/**
 * The components whose whole content is Body sentences (prose under a
 * control). THREE since R-02 took PickerExplainer.svelte with its sentence.
 */
const SENTENCE_COMPONENTS: readonly string[] = [
  "DeviceNote.svelte",
  "FailureBlock.svelte",
  "SessionAnnouncer.svelte",
];

/**
 * The three leaves plan 07-09 adds for the install flow. Listed, like the seven
 * above, so a rename is a visible omission; checked against the directory in
 * test 8.
 */
const INSTALL_LEAVES: readonly string[] = [
  "InstallState.svelte",
  "KeepConfirm.svelte",
  "PutBack.svelte",
];

/**
 * COMPILER_MARKERS and the PERMITTED specifiers are config-shape.spec.ts's,
 * verbatim: a specifier matching a marker is an offender unless it is one of the
 * exact paths allow-listed there - plan 06-05's five, and since plan 07-08 the
 * install store's three (the store, its import-free copy module and the
 * snapshot record), all of which are free of the protocol package and each of
 * which that file's walk reads rather than trusts.
 */
const COMPILER_MARKERS = [
  "vendor",
  "intechstudio",
  "lib/pad",
  "lib/transport",
  "lib/protocol",
  "lib/device",
];
const PERMITTED_SPECIFIERS = [
  "$lib/device/session.svelte",
  "$lib/device/session-copy",
  "$lib/protocol/usb",
  "$lib/transport/ports",
  "$lib/transport/transport",
  "$lib/device/install.svelte",
  "$lib/device/install-copy",
  "$lib/device/snapshot",
  // 13-12: the page target, zero imports, permitted in config-shape.spec.ts.
  "$lib/device/page-target",
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
/** The workspace route, where the chosen panel's column and the Escape rules live since 13-09. */
const WORKSPACE = "src/routes/playground/[id]/+page.svelte";
const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1;

/**
 * A style block split into rules. Crude on purpose: a real CSS parser would be a
 * dependency, and every selector in these seven files is a plain class, element
 * or media selector. Media blocks nest, so the split tolerates a rule body that
 * is itself a block by matching innermost braces first.
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

/**
 * Every class named on an interactive element in a component's markup, minus
 * the shared shapes src/app.css owns.
 *
 * THE EXCLUSION IS NOT A LOOPHOLE AND IT IS NAMED HERE ONCE. `pill` is
 * 10-UI-SPEC 19.1b's control shape and it is declared in src/app.css, not in
 * any component, so demanding that a component declare a 44px floor for it
 * would demand something that cannot be true. It is the same exclusion
 * browse-ui.spec.ts already carries for `sr-only`, for the same reason: the
 * class is not a box this file's components own. What survives the exclusion is
 * the load-bearing half - each control's OWN class still declares its own
 * floor, so taking the pill away tomorrow leaves every control reachable by
 * thumb. src/lib/ui/instrument.spec.ts scan 2 holds the other half, over a walk
 * derived from the directory rather than from a list.
 */
const SHARED_SHAPES = ["pill"];

function interactiveClassesOf(source: string): string[] {
  const out: string[] = [];
  for (const match of source.matchAll(/<(button|input|summary)[^>]*/g)) {
    for (const attr of match[0].matchAll(/class[ ]*=[ ]*"([^"]*)"/g)) {
      for (const name of attr[1].split(/[ ]+/))
        if (name && !SHARED_SHAPES.includes(name)) out.push(name);
    }
  }
  return out;
}

const hasControl = (source: string) =>
  source.includes("<button") ||
  source.includes("<input") ||
  source.includes("<summary");

/**
 * Test 7's count, as a function test 11 can call after the header's edit: the
 * live regions across every component and route on the site, comment-stripped,
 * with the needle assembled from fragments so this file never carries it whole.
 * Test 7 keeps its own inline walk and its carrier assertions; this returns the
 * total alone.
 */
function liveRegionTotal(): number {
  const LIVE = ["aria", "live"].join("-");
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...walk(rel));
      else if (entry.name.endsWith(".svelte")) out.push(rel);
    }
    return out;
  };
  let total = 0;
  for (const file of [...walk(UI_DIR), ...walk("src/routes")]) {
    total += occurrences(code(file), LIVE);
  }
  return total;
}

describe("the device UI's structural rules", () => {
  it("the seven are listed and on disk, and none reaches the compiler", () => {
    // The list is checked against the directory here, once, because every test
    // below reads through it.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(
      DEVICE_COMPONENTS.length,
      "seven components were listed - six between R-02 retiring PickerExplainer.svelte and plan 10-13 adding Clear.svelte",
    ).toBe(7);
    expect(
      DEVICE_COMPONENTS.filter((name) => !present.has(name)),
      "a listed device component is not on disk - it was renamed or deleted, and every test in this file has silently stopped covering it",
    ).toEqual([]);

    // No specifier that matches a compiler marker may be anything but one of the
    // five permitted, protocol-free paths. config-shape.spec.ts test 13 matches
    // specifier TEXT, so it would let a `from "$lib/protocol"` barrel through as
    // long as it is on a front-door page; here every device component is held to
    // the exact five directly.
    const specifiers: { file: string; specifier: string }[] = [];
    let permittedFound = 0;
    for (const name of DEVICE_COMPONENTS) {
      const file = componentPath(name);
      for (const match of code(file).matchAll(/from[ ]*["']([^"']+)["']/g)) {
        specifiers.push({ file, specifier: match[1] });
        if (PERMITTED_SPECIFIERS.includes(match[1])) permittedFound += 1;
      }
    }

    // Both non-vacuity guards: an empty walk and a walk that named no device
    // path would each make the offender check below pass without proving
    // anything - the second because then there is nothing for the allow-list to
    // allow and the marker match is untested.
    expect(specifiers.length, "static imports were collected").toBeGreaterThan(
      0,
    );
    expect(
      permittedFound,
      "the device components name at least one permitted device path - if this is zero the marker rule below is vacuous",
    ).toBeGreaterThan(0);

    const offenders = specifiers.filter(
      ({ specifier }) =>
        COMPILER_MARKERS.some((marker) => specifier.includes(marker)) &&
        !PERMITTED_SPECIFIERS.includes(specifier),
    );
    expect(
      offenders.map((o) => `${o.file} -> ${o.specifier}`),
      "a device component imports the compiler, the protocol or the transport at module scope through a specifier that is not one of the five permitted paths",
    ).toEqual([]);
  });

  it("no device component names a new colour", () => {
    // Every colour on this chrome comes from one of the nine tokens, so a hex
    // literal is either a tenth colour or a token spelled by hand, and both are
    // the same regression. --color-error-ink is the alarm red, which belongs to a
    // budget meter that does not exist here (06-08 deferred item 6: no shipped
    // spec scanned these files for a hex until now). The lookahead is not
    // decoration - without it `{#each` reads as the hex #eac.
    const TOKEN = "--color-error-ink";
    const HEX = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])/g;

    expect(
      HEX.test("background: #D6FF4E;"),
      "the hex matcher no longer recognises a hex",
    ).toBe(true);
    HEX.lastIndex = 0;

    const offenders: string[] = [];
    let read = 0;
    for (const name of DEVICE_COMPONENTS) {
      const source = code(componentPath(name));
      read += source.length;
      if (source.includes(TOKEN))
        offenders.push(`${componentPath(name)} -> ${TOKEN}`);
      for (const match of source.matchAll(HEX)) {
        offenders.push(`${componentPath(name)} -> ${match[0]}`);
      }
    }

    expect(read, "the seven components' code was read").toBeGreaterThan(2000);
    expect(
      offenders,
      "a device component names the alarm red or a raw colour - every colour here comes from one of the nine tokens",
    ).toEqual([]);
  });

  it("every component that renders a control declares the 44px floor on both axes", () => {
    // Phase 4's touch floor, per control rather than per page. The list is
    // DERIVED from the presence of a control, and the check is by SELECTOR
    // against the classes actually applied to a button, input or summary, so
    // dropping the floor from one control among several in a file goes red even
    // though the file still carries 44px elsewhere.
    const withControls: string[] = [];
    const withoutControls: string[] = [];
    const missing: string[] = [];

    for (const name of DEVICE_COMPONENTS) {
      const source = code(componentPath(name));
      if (!hasControl(source)) {
        withoutControls.push(componentPath(name));
        continue;
      }
      withControls.push(componentPath(name));
      const classes = new Set(interactiveClassesOf(source));
      const rules = rulesOf(source);
      for (const cls of classes) {
        const body = rules
          .filter((r) => r.selector.includes(`.${cls}`))
          .map((r) => r.body)
          .join(" ");
        const block = body.includes("min-block-size: 44px");
        const inline = body.includes("min-inline-size: 44px");
        if (!block || !inline)
          missing.push(`${componentPath(name)} -> .${cls}`);
      }
    }

    // Non-vacuity in both directions: the derivation found controls, AND it
    // discriminated rather than classing every component as interactive.
    expect(
      withControls.length,
      "components rendering a button, input or summary were found",
    ).toBeGreaterThanOrEqual(2);
    expect(
      withoutControls.length,
      "the derivation discriminates - if every component were classed as interactive the rule would be untested",
    ).toBeGreaterThan(0);
    expect(
      missing,
      "an interactive control's own class does not declare min-block-size: 44px and min-inline-size: 44px - Phase 4's touch floor is per control",
    ).toEqual([]);
  });

  it("there is exactly one live region among the seven, and it is the announcer's", () => {
    // 06-UI-SPEC: exactly one SESSION live region site-wide, and it is
    // SessionAnnouncer's. The note changes with the session but must NOT be a
    // live region, or every transition is announced twice.
    let total = 0;
    const carriers: string[] = [];
    for (const name of DEVICE_COMPONENTS) {
      const count = occurrences(code(componentPath(name)), "aria-live");
      total += count;
      if (count > 0) carriers.push(componentPath(name));
    }

    expect(total, "exactly one aria-live across the seven").toBe(1);
    expect(carriers, "and it is the announcer's").toEqual([
      componentPath("SessionAnnouncer.svelte"),
    ]);

    const announcer = code(componentPath("SessionAnnouncer.svelte"));
    expect(
      announcer,
      'the session live region is aria-live="polite"',
    ).toContain('aria-live="polite"');
    expect(
      announcer,
      'the session live region is aria-atomic="true"',
    ).toContain('aria-atomic="true"');
  });

  it("monospace is scoped to the numerals and never reaches a sentence", () => {
    // Y-18: only numerals may be monospaced; prose never is. Through 13-17
    // the one carrier was DeviceSlot's firmware and page run; 13-18 (D-23)
    // moved the identity out of the header into Device actions, where
    // identitySentence is a sentence, so NO device component carries the
    // mono stack now - and none may gain it for a word.
    const MONO = "--font-mono";
    const carriers = DEVICE_COMPONENTS.filter((name) =>
      code(componentPath(name)).includes(MONO),
    );
    expect(
      carriers,
      "--font-mono is declared in a device component - the numeral run left the header with the identity (13-18)",
    ).toEqual([]);
    for (const name of DEVICE_COMPONENTS) {
      const monoSelectors = rulesOf(code(componentPath(name)))
        .filter((r) => r.body.includes(MONO))
        .map((r) => r.selector);
      expect(monoSelectors, `${name} monospaces a selector`).toEqual([]);
    }

    // The prose components declare no font-family at all, so nothing can slip a
    // second stack onto a sentence.
    const withFamily = SENTENCE_COMPONENTS.filter((name) =>
      code(componentPath(name)).includes("font-family"),
    );
    expect(
      withFamily,
      "a sentence-only component declares font-family - prose takes the inherited sans stack and nothing else",
    ).toEqual([]);
  });

  it("the ARIA contract: caption hidden, describedby everywhere, four expanders, a hidden mark, no dialog, one hydration marker", () => {
    const slot = code(componentPath("DeviceSlot.svelte"));
    const mark = code(componentPath("DeviceMark.svelte"));

    // The caption line is aria-hidden and the accessible name is the label
    // alone, reached through aria-describedby, which the slot carries in every
    // state (the attribute is unconditional on the one button).
    expect(slot, "the caption line is aria-hidden").toMatch(
      /data-testid="device-slot-caption"[^>]*aria-hidden="true"/,
    );
    expect(slot, "the slot carries aria-describedby in every state").toContain(
      "aria-describedby={descId}",
    );

    // S1's hidden name is HIDDEN_NAME_IDLE, read from session-copy and never
    // retyped in the markup.
    expect(slot, "the slot names HIDDEN_NAME_IDLE").toContain(
      "HIDDEN_NAME_IDLE",
    );
    expect(
      slot,
      "the hidden-name sentence is retyped in DeviceSlot instead of imported",
    ).not.toContain("Preview only. Connect ZONA");

    // aria-expanded derives from a list of exactly four states.
    const expands = /const EXPANDS[^=]*=\s*\[([^\]]*)\]/.exec(slot);
    expect(expands, "the EXPANDS list is declared").not.toBeNull();
    const expandStates = [
      ...(expands as RegExpExecArray)[1].matchAll(/"[^"]+"/g),
    ];
    expect(
      expandStates.length,
      "aria-expanded is derived from exactly four states (S0a, S0b, S4, S5)",
    ).toBe(4);

    // The mark is decoration in every branch.
    expect(mark, "the device mark is aria-hidden").toContain(
      'aria-hidden="true"',
    );

    // A disclosure is not a dialog.
    for (const name of DEVICE_COMPONENTS) {
      expect(
        code(componentPath(name)),
        `${name} declares role="dialog" - a disclosure is not a dialog`,
      ).not.toContain('role="dialog"');
    }

    // data-hydrated is the hydration marker plans 06-11 and 06-13 wait on. It
    // appears in DeviceSlot and in no other of the seven, its value is an
    // expression (never a static "true" a prerendered document could carry),
    // and its only assignment is inside onMount.
    const hydratedCarriers = DEVICE_COMPONENTS.filter((name) =>
      code(componentPath(name)).includes("data-hydrated"),
    );
    expect(
      hydratedCarriers,
      "data-hydrated appears only in DeviceSlot",
    ).toEqual(["DeviceSlot.svelte"]);
    expect(
      slot,
      'data-hydrated is a static "true" on the markup - a prerendered document could then satisfy the wait it exists to defeat',
    ).not.toContain('data-hydrated="true"');
    expect(
      occurrences(slot, "hydrated = true"),
      "hydrated is assigned exactly once",
    ).toBe(1);
    const onMountBlock = /onMount\(\(\)\s*=>\s*\{([^]*?)\}\);/.exec(slot);
    expect(onMountBlock, "an onMount block is declared").not.toBeNull();
    expect(
      (onMountBlock as RegExpExecArray)[1],
      "the hydration marker is assigned outside onMount",
    ).toContain("hydrated = true");
  });

  it("exactly one session live region on the site, and the panel is not it", () => {
    // 06-UI-SPEC Y-16 and D-17: THREE live regions on the whole site, with
    // disjoint triggers - the session's (SessionAnnouncer.svelte, mounted once
    // in the layout), Phase 5's tuning region (TuningRegion.svelte) and Phase
    // 5.1's browse region, which is the browse page's and lives in
    // BrowseToolbar.svelte. The chosen panel's connect-status is NOT a fourth:
    // Phase 4 gave it aria-live="polite", and plan 06-12 removed it, because
    // the session's announcer already speaks every transition and two regions
    // announcing one transition is double-speak. It is the only aria-live this
    // phase removes anywhere.
    //
    // THE COMMENT STRIP IS THE DIFFERENCE BETWEEN THREE AND FOUR, not tidiness.
    // src/lib/ui/TuningRegion.svelte's header - the paragraph beginning "ONE
    // LIVE REGION, AND IT CANNOT CHATTER" - contains a literal
    // aria-live="polite" aria-atomic="true" in prose, describing the element
    // below it. A raw scan counts that sentence and reports a fourth region,
    // and the natural "fix" would be to edit a correct comment out of a shipped
    // file. So the scan strips comments first, and the last assertion pins that
    // the raw count of that file is higher than its stripped count, so nobody
    // deletes the strip as redundant. (SessionAnnouncer.svelte's and
    // BrowseToolbar.svelte's headers name the attribute in prose as well.)
    //
    // The needle is assembled from fragments so this file's own text never
    // matches it, should the walk ever widen to specs.
    const LIVE = ["aria", "live"].join("-");
    const PANEL = `${UI_DIR}/TryOnDevice.svelte`;
    const EXPECTED_CARRIERS = [
      `${UI_DIR}/BrowseToolbar.svelte`,
      `${UI_DIR}/SessionAnnouncer.svelte`,
      `${UI_DIR}/TuningRegion.svelte`,
    ];

    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) out.push(...walk(rel));
        else if (entry.name.endsWith(".svelte")) out.push(rel);
      }
      return out;
    };
    const files = [...walk(UI_DIR), ...walk("src/routes")];

    // Non-vacuity, both ways: the walk found the site's components AND the
    // panel is among them, so its zero below is a scanned zero.
    expect(
      files.length,
      "the walk over src/lib/ui and src/routes found the site's components",
    ).toBeGreaterThan(20);
    expect(files, "the chosen panel is inside the walk").toContain(PANEL);

    const counts = new Map(
      files.map((file) => [file, occurrences(code(file), LIVE)] as const),
    );
    const carriers = [...counts.entries()]
      .filter(([, count]) => count > 0)
      .map(([file]) => file)
      .sort();
    let total = 0;
    for (const count of counts.values()) total += count;

    expect(
      carriers,
      "the live regions are exactly the announcer's, the tuning region's and the browse toolbar's",
    ).toEqual(EXPECTED_CARRIERS);
    for (const file of EXPECTED_CARRIERS) {
      expect(counts.get(file), `${file} carries exactly one`).toBe(1);
    }
    expect(
      counts.get(PANEL),
      "TryOnDevice.svelte carries an aria-live - the panel is announcing the session a second time",
    ).toBe(0);
    expect(total, "three live regions on the whole site, no more").toBe(3);

    // The strip is load-bearing: TuningRegion's header names the attribute in
    // prose, so the raw file counts higher than its code does.
    const tuning = `${UI_DIR}/TuningRegion.svelte`;
    expect(
      occurrences(raw(tuning), LIVE),
      "TuningRegion.svelte's header no longer names aria-live in prose - the comment strip in this test has nothing to strip and its reason should be re-examined",
    ).toBeGreaterThan(occurrences(code(tuning), LIVE));
  });

  it("the three install leaves: no compiler specifier, the 44px floor, the twin cells, and a group that is not a dialog", () => {
    // Plan 07-09. The three are listed and on disk, like the seven above.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(INSTALL_LEAVES.length, "three leaves were listed").toBe(3);
    expect(
      INSTALL_LEAVES.filter((name) => !present.has(name)),
      "a listed install leaf is not on disk - renamed or deleted, and this test has silently stopped covering it",
    ).toEqual([]);

    // LIGHT. Every static specifier is one of the chunk guard's permitted
    // paths, the framework itself, or a sibling component under src/lib/ui/
    // by relative path (FailureBlock, for the seven failure-shaped blocks).
    // config-shape.spec.ts test 13 walks the same files; this holds the exact
    // list directly, so a `$lib/tune/copy` or a `$lib/catalog/front-door` -
    // both light, both permitted on OTHER panels - is still an offender here,
    // because a leaf that renders the install store's state needs neither.
    const specifiers: { file: string; specifier: string }[] = [];
    for (const name of INSTALL_LEAVES) {
      const file = componentPath(name);
      for (const match of code(file).matchAll(/from[ ]*["']([^"']+)["']/g)) {
        specifiers.push({ file, specifier: match[1] });
      }
    }
    expect(specifiers.length, "static imports were collected").toBeGreaterThan(
      3,
    );
    const sibling = (specifier: string) =>
      specifier.startsWith("./") &&
      specifier.endsWith(".svelte") &&
      present.has(specifier.slice(2));
    const offenders = specifiers.filter(
      ({ specifier }) =>
        !PERMITTED_SPECIFIERS.includes(specifier) &&
        specifier !== "svelte" &&
        !sibling(specifier),
    );
    expect(
      offenders.map((o) => `${o.file} -> ${o.specifier}`),
      "an install leaf names a specifier that is neither a permitted path, the framework, nor a sibling component",
    ).toEqual([]);
    expect(
      specifiers.filter(({ specifier }) =>
        COMPILER_MARKERS.some((marker) => specifier.includes(marker)),
      ).length,
      "the leaves name at least one marker-matching permitted path - if this is zero the exact-list rule above is vacuous",
    ).toBeGreaterThan(0);

    // REACHABLE. Every class on a <button declares the 44px floor, per
    // control, the way test 3 holds the seven - and EVERY min-block-size a
    // control's class declares is 44px, not merely one of them, so a second
    // declaration that lowers the floor after the first is red too (observed
    // green under a presence-only check, plan 07-09). InstallState renders no
    // control at all - a state block is not a tab stop - which is the
    // discrimination that keeps this rule non-vacuous.
    const withControls: string[] = [];
    const withoutControls: string[] = [];
    const missing: string[] = [];
    for (const name of INSTALL_LEAVES) {
      const source = code(componentPath(name));
      if (!source.includes("<button")) {
        withoutControls.push(name);
        continue;
      }
      withControls.push(name);
      const rules = rulesOf(source);
      for (const cls of new Set(interactiveClassesOf(source))) {
        const body = rules
          .filter((r) => r.selector.includes(`.${cls}`))
          .map((r) => r.body)
          .join(" ");
        const floors = [...body.matchAll(/min-block-size:[ ]*([0-9]+px)/g)].map(
          (m) => m[1],
        );
        if (floors.length === 0 || floors.some((px) => px !== "44px"))
          missing.push(`${name} -> .${cls} [${floors.join(", ")}]`);
      }
    }
    expect(withControls, "PutBack and KeepConfirm render a button").toEqual([
      "KeepConfirm.svelte",
      "PutBack.svelte",
    ]);
    expect(withoutControls, "InstallState renders no control").toEqual([
      "InstallState.svelte",
    ]);
    expect(
      missing,
      "a control's own class does not declare min-block-size: 44px, or declares another floor beside it - the interactive floor is per control",
    ).toEqual([]);

    // STEADY. PutBack renders all three of its lines - as sizing twins, the
    // inactive ones hidden - in a cell with the 72px floor (Z-18). Since
    // 13-18 the three are the needs-zona line and page-target's two
    // page-naming forms; Phase 10's page-less pair retired (D-23).
    const putBack = code(componentPath("PutBack.svelte"));
    for (const line of [
      "PUT_BACK_NEEDS_ZONA",
      "putBackPageLine(page)",
      "putBackPageLineAfterKeep(page)",
    ]) {
      expect(
        occurrences(putBack, `{${line}}`),
        `PutBack renders ${line} in its cell`,
      ).toBe(1);
    }
    for (const retired of ["PUT_BACK_LINE}", "PUT_BACK_LINE_AFTER_KEEP"]) {
      expect(
        occurrences(putBack, retired),
        `PutBack still renders the retired ${retired}`,
      ).toBe(0);
    }
    expect(putBack, "the inactive twins are visibility: hidden").toContain(
      "visibility: hidden",
    );
    expect(
      putBack,
      "the Put back cell no longer reserves 72px - three Body lines, the floor Phase 10 measured and 13-18 kept when the caps retired. The line changes after a store, so a cell that grows moves a destructive control under a hand already reaching for it (Z-18)",
    ).toContain("min-block-size: 72px");
    expect(putBack, "the twins are aria-hidden").toContain("aria-hidden=");

    // A GROUP, NOT A DIALOG. The needles it must not carry are assembled from
    // fragments so this file never contains them whole.
    const confirm = code(componentPath("KeepConfirm.svelte"));
    for (const needle of [
      'role="group"',
      'tabindex="-1"',
      "aria-labelledby",
      "aria-describedby",
    ]) {
      expect(confirm, `KeepConfirm carries ${needle}`).toContain(needle);
    }
    const DIALOG = ["role=", '"dia', 'log"'].join("");
    const MODAL = ["aria-", "modal"].join("");
    const INERT = ["in", "ert"].join("");
    const LABEL = ["aria-", "label="].join("");
    for (const needle of [DIALOG, MODAL, INERT, LABEL]) {
      expect(
        occurrences(confirm, needle),
        `KeepConfirm carries ${needle} - the confirmation is an inline group, never a dialog, never modal, never inert, and its accessible names are its visible labels`,
      ).toBe(0);
    }
    // The strip is load-bearing here too: the header says in prose what the
    // markup must not carry.
    expect(
      occurrences(raw(componentPath("KeepConfirm.svelte")), DIALOG),
      "KeepConfirm's header no longer names the dialog role in prose - the strip has nothing to strip and its reason should be re-examined",
    ).toBeGreaterThan(0);
    for (const name of [...INSTALL_LEAVES, ...DEVICE_COMPONENTS]) {
      expect(
        occurrences(code(componentPath(name)), LABEL),
        `${name} carries an aria-label - accessible names are the visible labels`,
      ).toBe(0);
    }

    // NO INTERVAL. The 2000 ms line is a setTimeout on the store (Z-09).
    const INTERVAL = ["set", "Interval"].join("");
    for (const name of INSTALL_LEAVES) {
      expect(
        occurrences(code(componentPath(name)), INTERVAL),
        `${name} reaches ${INTERVAL}`,
      ).toBe(0);
    }
  });

  it("every install sentence on screen comes from the copy modules", () => {
    // Plan 07-09. Three tells of a retyped install sentence - the three
    // phrases nearly every one of them carries - must appear in none of the
    // three leaves' code. They may appear in a header comment (the strip
    // removes it) and they DO appear in install-copy.ts, which is what makes
    // the tells real rather than arbitrary.
    const TELLS = [
      ["your ", "ZONA"].join(""),
      ["Setup and ", "Timer"].join(""),
      ["power", "-off"].join(""),
    ];
    const copyModule = stripComments(
      readFileSync(repo("src/lib/device/install-copy.ts"), "utf8"),
    );
    for (const tell of TELLS) {
      expect(
        occurrences(copyModule, tell),
        `install-copy.ts carries "${tell}" - if it does not, this tell no longer identifies a retyped sentence`,
      ).toBeGreaterThan(0);
    }

    let read = 0;
    const retyped: string[] = [];
    for (const name of INSTALL_LEAVES) {
      const source = code(componentPath(name));
      read += source.length;
      for (const tell of TELLS) {
        if (source.includes(tell)) retyped.push(`${name} -> "${tell}"`);
      }
      expect(source, `${name} imports from the install copy module`).toContain(
        'from "$lib/device/install-copy"',
      );
    }
    expect(read, "the three leaves' code was read").toBeGreaterThan(3000);
    expect(
      retyped,
      "an install leaf retypes a sentence in its markup instead of importing it from install-copy",
    ).toEqual([]);
  });

  it("the reserved cells are the measured arithmetic, the honesty slot holds five twins and no never-writes literal, SAFE_NOTE is not a twin, KEEP ON DEVICE is borderless, and the install row is a column", () => {
    // Plan 07-10. Four components, four shapes, all on comment-stripped code -
    // TryOnDevice's header names the retired sentences in prose, and this
    // test would be red on correct code without the strip.

    // FIVE TWINS, AND NEITHER PROMISE. The slot's strings are each rendered
    // as a `class:twin` line, so counting that marker counts the twins; the
    // two Phase 4 literals plan 07-10 retired are matched by fragment
    // needles, assembled so this file never carries them whole.
    const tryOn = code(componentPath("TryOnDevice.svelte"));
    expect(
      occurrences(tryOn, "class:twin="),
      "the honesty slot renders exactly five sizing twins (Z-06)",
    ).toBe(5);
    const NEVER_WRITES = ["never ", "writes"].join("");
    const NEXT_RELEASE = ["next ", "release"].join("");
    for (const needle of [NEVER_WRITES, NEXT_RELEASE]) {
      expect(
        occurrences(tryOn, needle),
        `TryOnDevice's code still carries "${needle}" - a Phase 4 promise that the site never writes, beside a control that does`,
      ).toBe(0);
    }
    expect(
      occurrences(raw(componentPath("TryOnDevice.svelte")), NEVER_WRITES),
      "TryOnDevice's header no longer names the retired sentence in prose - the strip has nothing to strip here and its reason should be re-examined",
    ).toBeGreaterThan(0);
    expect(
      tryOn,
      "the honesty slot no longer reserves 48px - ceil(85 / 43) x 24 = 48, where 85 is the longest of its five candidates after R-05, R-06 and tryOnBudgetReason's shortening, and 43 is the CH_PER_LINE plan 10-01 measured in Inter. It was 72px for three lines at HONESTY_CAP 129; the cap is 2 x 43 = 86 now",
    ).toContain("min-block-size: 48px");

    // SAFE_NOTE IS NOT A SIZING TWIN, ASSERTED RATHER THAN INTENDED (R-03,
    // 10-UI-SPEC 10.1). It is rendered exactly once, unconditionally, with no
    // grid-area placing it in a reserved cell and no hidden sibling holding
    // height for it. If it ever became a twin it would acquire an alternate
    // form, and a safety statement with two forms is a safety statement that
    // can be swapped out.
    expect(
      occurrences(tryOn, "{SAFE_NOTE}"),
      "SAFE_NOTE is rendered other than exactly once beneath the primary - it is unconditional and never swapped",
    ).toBe(1);
    expect(
      occurrences(tryOn, "SAFE_NOTE"),
      "SAFE_NOTE is named more than twice in TryOnDevice's code - the import and the one render, and nothing else",
    ).toBe(2);
    const safeNoteRule = rulesOf(tryOn).filter((r) =>
      r.selector.includes(".safe-note"),
    );
    expect(
      safeNoteRule.length,
      "SAFE_NOTE's own rule was found, so the two assertions below are not vacuous",
    ).toBe(1);
    expect(
      safeNoteRule[0].body.includes("grid-area"),
      "SAFE_NOTE declares grid-area - it has been put into a reserved cell, which is what 10-UI-SPEC 10.1 forbids by name",
    ).toBe(false);
    // The element that renders it, read as its own opening tag: no class:twin,
    // no aria-hidden, no {#if} between the primary and it.
    const safeNoteTag = tryOn
      .slice(0, tryOn.indexOf("{SAFE_NOTE}"))
      .split("<")
      .pop();
    expect(
      safeNoteTag,
      "the element rendering SAFE_NOTE was found, so the assertions below are not vacuous",
    ).toContain("safe-note");
    for (const marker of ["class:twin", "aria-hidden", "{#if"]) {
      expect(
        safeNoteTag?.includes(marker),
        `SAFE_NOTE's element carries ${marker} - it is unconditional, never swapped and never a twin (10-UI-SPEC 10.1)`,
      ).toBe(false);
    }
    expect(tryOn, "the click hands the pair to the install store").toContain(
      "install.tryOnDevice(",
    );
    expect(tryOn, "region 3 renders the install blocks").toContain(
      "<InstallState",
    );

    // BORDERLESS, 48px, SIX REASONS FROM THE RECORD. The Quiet tier has no
    // border and no inline padding; the cell reserves two Body lines; and the
    // reasons are iterated from install-copy's closed record rather than
    // retyped - the record is named inside an each block, and none of the six
    // sentences' opening words appears in the code.
    const keep = code(componentPath("KeepOnDevice.svelte"));
    const keepControl = rulesOf(keep)
      .filter((r) => r.selector.includes(".control"))
      .map((r) => r.body)
      .join(" ");
    expect(
      /border:[ ]*(0|none)[;]/.test(keepControl),
      "KEEP ON DEVICE declares no border (the Quiet tier, Z-02)",
    ).toBe(true);
    expect(keepControl, "and no inline padding").toContain("padding-inline: 0");
    expect(
      keep,
      "the Store on ZONA cell no longer reserves 48px - two Body lines, the floor Phase 10 measured and 13-18 kept when the caps retired. This line changes when a knob moves (Z-18)",
    ).toContain("min-block-size: 48px");

    // THE HEADER NOTE, 152px TO 24px - the largest single reduction in the
    // phase, and the one cell whose collapse is what R-02 and R-03 bought.
    // Phase 6 reserved two cells, 3 + 3 line boxes plus 8px, for
    // PICKER_EXPLAINER (130) over SAFE_PROMISE (88). Both are retired; the
    // longest candidate left is RECONNECT_OFFER at 37, which is one line box.
    const note = code(componentPath("DeviceNote.svelte"));
    expect(
      note,
      "the header note's cell no longer reserves 24px - ceil(37 / 43) x 24 = 24, where 37 is RECONNECT_OFFER, the longest of its four candidates after R-02 and R-03, and 43 is the CH_PER_LINE plan 10-01 measured in Inter. It was 152px for two cells of three lines each",
    ).toContain("min-block-size: 24px");
    for (const gone of ["152px", "72px", "48px"]) {
      expect(
        note.includes(`min-block-size: ${gone}`),
        `the header note still reserves ${gone} somewhere - the collapse to one 24px cell is the whole of what R-02 and R-03 bought`,
      ).toBe(false);
    }
    expect(
      occurrences(note, "{SAFE_NOTE}"),
      "the header note renders SAFE_NOTE other than exactly once - it is unconditional wherever the note renders",
    ).toBe(1);
    expect(
      /[{]#each[^}]*KEEP_REASONS|KEEP_REASONS[)][^;]*;[^]*[{]#each[ ]+REASONS/.test(
        keep,
      ),
      "the six reasons are iterated from KEEP_REASONS rather than listed",
    ).toBe(true);
    for (const opening of [
      "Apply to ZONA first",
      "The knobs moved",
      "Not after a",
      "Already stored on",
      "This browser can",
    ]) {
      expect(
        occurrences(keep, opening),
        `KeepOnDevice retypes a reason ("${opening}...") instead of iterating the record`,
      ).toBe(0);
    }
    expect(keep, "the enabled line is rendered once").toContain(
      "{keepLineEnabled(page)}",
    );
    expect(keep, "the cell carries its testid").toContain(
      'data-testid="keep-on-device-line"',
    );

    // ONE COLUMN, PUT BACK FIRST. The row's rule declares the column, and the
    // panel mounts PutBack before KeepOnDevice in DOM order. SINCE 13-09 THE
    // PANEL IS THE WORKSPACE ROUTE'S OWN MARKUP: ChosenPanel.svelte dissolved
    // into src/routes/playground/[id]/+page.svelte with the coverflow, and the
    // column, its caption, its one hairline and its order moved there whole.
    const panel = code(WORKSPACE);
    const row = rulesOf(panel)
      .filter((r) => r.selector.includes(".install-row"))
      .map((r) => r.body)
      .join(" ");
    expect(row, "the install row is a column (Z-03)").toContain(
      "flex-direction: column",
    );
    expect(row, "and no longer a space-between row").not.toContain(
      "space-between",
    );
    const putBackAt = panel.indexOf("<PutBack");
    const keepAt = panel.indexOf("<KeepOnDevice");
    const confirmAt = panel.indexOf("<KeepConfirm");
    expect(putBackAt, "the panel mounts PutBack").toBeGreaterThan(-1);
    expect(keepAt, "the panel mounts KeepOnDevice").toBeGreaterThan(-1);
    expect(confirmAt, "the panel mounts KeepConfirm").toBeGreaterThan(-1);
    expect(
      putBackAt < keepAt && putBackAt < confirmAt,
      "PUT BACK is the first cell of the column",
    ).toBe(true);

    // PLAN 10-13, D-04: THE SEQUENCE IS A CAPTION, AN ORDER AND AN ENABLEMENT.
    // The caption is one Micro word under the hairline the panel already had;
    // CLEAR joins the column after KEEP ON DEVICE and before the share
    // snippet; and NO SECOND HAIRLINE arrives with it - A-46 retired that with
    // the Bare tier it was separating, so the file declares exactly one
    // border-block-start, the .rule's.
    const clearAt = panel.indexOf("<Clear ");
    expect(clearAt, "the panel mounts Clear").toBeGreaterThan(-1);
    expect(
      keepAt < clearAt && confirmAt < clearAt,
      "the column is PUT BACK, KEEP ON DEVICE (or its confirmation), CLEAR - CLEAR sits after the control it is quietest beside",
    ).toBe(true);
    // THE SHARE CONTROL LEFT THE COLUMN AT 13-09: it is the inspector's
    // pinned pair (PDF page 5's Share snapshot), rendered by the route's
    // actions snippet and never inside the install row - it was never an
    // install control, and the Bible puts it where the tuner's actions are.
    const column = panel.slice(
      panel.indexOf('class="install-row"'),
      panel.indexOf("</section>", panel.indexOf('class="install-row"')),
    );
    expect(column, "the install row was found").toContain("<Clear ");
    expect(
      column,
      "the share control is back inside the install column",
    ).not.toContain("<CopyLink");
    const actions = panel.slice(
      panel.indexOf("{#snippet actions()}"),
      panel.indexOf("{/snippet}", panel.indexOf("{#snippet actions()}")),
    );
    expect(
      actions,
      "the inspector's pinned pair no longer carries the share control",
    ).toContain("<CopyLink");
    expect(panel, "the panel carries the NEXT caption").toContain(
      'data-testid="next-caption"',
    );
    expect(
      occurrences(panel, "border-block-start"),
      "the workspace declares a border-block-start other than the one hairline Phase 7 gave region 6 - A-46 retired the second hairline with the Bare tier, and D-04's sequence is carried by a caption, an order and an enablement rather than by a rule",
    ).toBe(1);
    // Region 4's 152px reservation went with the chosen panel (13-09): the
    // tuning region is the shell's inspector now, which scrolls its own body
    // beside the surface rather than beneath the primary control, so nothing
    // above it can move and there is nothing to reserve.
    expect(
      panel,
      "the workspace still reserves the chosen panel's 152px - the inspector scrolls its own body and reserves nothing",
    ).not.toContain("min-block-size: 152px");

    // SAFE-02 SURVIVES D-04: THE TWO WEIGHTS ARE NOT EQUALISED. This is the
    // regression D-04 makes attractive - "one natural sequence" read as "three
    // equal buttons in a row" - and with CLEAR now in Quiet beside KEEP ON
    // DEVICE there is one more control that would be dragged up with it. So
    // the accent fill is asserted site-wide over every interactive class in
    // src/lib/ui: exactly one component wears it, and it is the primary.
    const ACCENT_FILL = "background: var(--color-action)";
    const filled: string[] = [];
    let interactiveRulesRead = 0;
    for (const name of readdirSync(repo(UI_DIR))
      .map(String)
      .filter((file) => file.endsWith(".svelte"))) {
      const source = code(componentPath(name));
      const rules = rulesOf(source);
      for (const cls of new Set(interactiveClassesOf(source))) {
        // Matched by inclusion rather than by equality, as every other walk in
        // this file does: the first rule of a style block carries the `<style>`
        // tag in its selector capture, so an equality test silently reads no
        // rule at all - which is how this assertion first went green while
        // finding nothing.
        const selfRules = rules.filter((r) => r.selector.includes(`.${cls}`));
        interactiveRulesRead += selfRules.length;
        if (selfRules.some((r) => r.body.includes(ACCENT_FILL)))
          filled.push(`${name} -> .${cls}`);
      }
    }
    expect(
      interactiveRulesRead,
      "interactive classes' own rules were read across src/lib/ui, so the accent count below is not vacuous",
    ).toBeGreaterThan(10);
    expect(
      filled,
      "a control other than TRY ON DEVICE wears the accent fill - SAFE-02's content is that the two install controls are never equal-weight, and D-04's sequence is not allowed to buy itself with the primary's weight",
    ).toEqual(["TryOnDevice.svelte -> .primary"]);
    const clearControl = rulesOf(code(componentPath("Clear.svelte")))
      .filter((r) => r.selector.includes(".control"))
      .map((r) => r.body)
      .join(" ");
    for (const [name, body] of [
      ["KEEP ON DEVICE", keepControl],
      ["CLEAR", clearControl],
    ] as const) {
      expect(
        body,
        `${name} is no longer fit-content - the primary is the full-width control and the Quiet tier is not`,
      ).toContain("inline-size: fit-content");
      expect(
        body,
        `${name} no longer declares a transparent background - only the primary is filled`,
      ).toContain("background: transparent");
    }
    expect(
      occurrences(tryOn, '"cleared"'),
      "TRY ON DEVICE names the `cleared` phase - the primary's disabled set is `writing`, `snapshotting` and a missing config, and plan 10-13 adds no phase to it",
    ).toBe(0);

    // DEGR-02, AS ONE ASSERTION OVER BOTH BEHAVIOURS. PUT BACK renders NOTHING
    // when its state is `absent` (Z-12): it offers to restore a specific
    // module's own configuration and on a browser that never had one there is
    // nothing for it to name. CLEAR is the opposite ruling and it is
    // deliberate: it does something meaningful on any module, so there is a
    // real capability to teach, and it renders present-and-disabled with its
    // reason inline. The difference is visible here as one file gating its
    // whole body on putBackState and the other gating nothing.
    const clearSource = code(componentPath("Clear.svelte"));
    expect(
      code(componentPath("PutBack.svelte")),
      "PUT BACK no longer gates its whole render on putBackState - Z-12 makes it ABSENT rather than disabled when there is no configuration for it to name",
    ).toContain('{#if state !== "absent"}');
    expect(
      occurrences(clearSource, "{#if"),
      "CLEAR has gained a conditional render - DEGR-02 makes it PRESENT AND DISABLED on a browser that cannot write, with its reason inline, which is the opposite of PUT BACK's ruling and is the difference this assertion exists to hold",
    ).toBe(0);
    expect(
      clearSource,
      "CLEAR carries a real disabled attribute rather than aria-disabled alone",
    ).toContain("{disabled}");

    // I14's BLOCK, AND THE CONTROL ITS BODY NAMES. The caption and the body are
    // install-copy's, never retyped; the store-side half of the naming rule -
    // that PUT BACK is enabled in `cleared` - is asserted in install.spec.ts,
    // where the phase table lives.
    const state = code(componentPath("InstallState.svelte"));
    expect(state, "region 3 renders the reset caption").toContain(
      "{clearedCaption(page)}",
    );
    expect(state, "and its body").toContain("{clearedBody(page)}");
    expect(
      state,
      "the cleared branch was not added to the phase chain",
    ).toContain('shown === "cleared"');
    expect(
      state,
      "the nothing-landed form is still selected by action === \"put-back\" - a clear would then fall through to the TRY form by omission, whose detail says the visitor's own scripts are still running. The selector mirrors the store's own #classify (A-28): try is the exception, everything else takes the put-back form",
    ).toContain('install.action === "try" ? "try" : "put-back"');

    // ESCAPE'S TWO RULES, IN ORDER, ON THE HANDLER ALONE. Since 13-09 the
    // handler is the workspace route's (Coverflow.svelte left the tree with
    // the un-choose it guarded): while the store is writing Escape does
    // nothing, and while the confirmation is open it closes the block. There
    // is no panel to un-choose any more, so the handler ends there and pushes
    // no history entry.
    const workspace = code(WORKSPACE);
    const keyTest = 'event.key !== "Escape"';
    const from = workspace.indexOf(keyTest);
    expect(from, "the Escape handler was found").toBeGreaterThan(-1);
    const to = workspace.indexOf("dismissConfirm()", from);
    expect(to, "the handler still closes the confirmation").toBeGreaterThan(
      from,
    );
    const handler = workspace.slice(from, to);
    const writingAt = handler.indexOf('install.phase === "writing"');
    const confirmGuardAt = handler.indexOf("install.confirmOpen");
    expect(
      writingAt,
      "Escape is ignored while the store is writing (Z-10)",
    ).toBeGreaterThan(-1);
    expect(
      confirmGuardAt,
      "Escape closes the confirmation only after the writing guard (Z-10)",
    ).toBeGreaterThan(writingAt);
    expect(
      occurrences(handler, "pushState"),
      "the Escape handler pushes no history entry",
    ).toBe(0);
    expect(
      occurrences(workspace, "pushState("),
      "the workspace pushes history - there is no chosen state to push since 13-09",
    ).toBe(0);
  });

  it("the header locks under a write, says where the copy is, and the announcer is untouched", () => {
    // Plan 07-11. Three components, three shapes, all on comment-stripped code
    // - DeviceDetails' header names the lock in prose, so this test would be
    // red on correct code without the strip.

    // THE LOCK, ON BOTH CONTROLS, ON EVERY LEG. DISCONNECT ZONA and FORGET
    // THIS ZONA each carry a real `disabled` bound to the session's writeLock
    // - two occurrences, no more and no fewer - and the file reads the store's
    // leg nowhere: a lock that discriminated by leg released over the store
    // leg, which is the negative check plan 07-11 observed on a served build
    // and the hazard Z-15 names. Both name the reason line as their
    // description, and the line carries the id they name.
    const details = code(componentPath("DeviceDetails.svelte"));
    expect(
      occurrences(details, "disabled={session.writeLock}"),
      "both header controls are disabled under the session's write lock (Z-15)",
    ).toBe(2);
    const LEG = ["install", ".leg"].join("");
    expect(
      occurrences(details, LEG),
      "the header lock reads the store's leg - the lock is the session's flag and covers every leg, the store leg explicitly",
    ).toBe(0);
    expect(
      occurrences(
        details,
        "aria-describedby={session.writeLock ? lockId : undefined}",
      ),
      "both locked controls name the reason line",
    ).toBe(2);
    expect(details, "the reason line carries the id they name").toContain(
      "id={lockId}",
    );

    // THE REASON AND THE TWO FORMS come from session-copy and are never
    // retyped: the lock's reason once, the snapshot line picking its form from
    // the store and rendered only with a snapshot in hand, the amended forget
    // explanation by name.
    expect(
      occurrences(details, "{WRITE_LOCK_REASON}"),
      "the lock's reason is rendered once",
    ).toBe(1);
    expect(
      details,
      "the snapshot line picks its form from the store",
    ).toContain(
      "install.snapshotDurable ? SNAPSHOT_DURABLE_LINE : SNAPSHOT_SESSION_LINE",
    );
    expect(
      details,
      "the snapshot line renders only with a snapshot in hand",
    ).toContain("install.snapshot !== undefined");
    expect(details, "the forget explanation is the copy module's").toContain(
      "{REVOKE_EXPLANATION}",
    );
    for (const opening of [
      "Not while HANGAR",
      "A copy of your",
      "Removes this site",
    ]) {
      expect(
        occurrences(details, opening),
        `DeviceDetails retypes a header sentence ("${opening}...") instead of importing it`,
      ).toBe(0);
    }
    expect(
      details,
      "the header reads the install store through the permitted specifier",
    ).toContain('from "$lib/device/install.svelte"');
    // The strip is load-bearing: the header names the lock in prose.
    expect(
      occurrences(raw(componentPath("DeviceDetails.svelte")), "writeLock"),
      "DeviceDetails' header no longer names the lock in prose - the strip has nothing to strip here and its reason should be re-examined",
    ).toBeGreaterThan(occurrences(details, "writeLock"));

    // THE SLOT NEVER READS A BUSY WORD AND NEVER SHOWS AN INSTALL STATE
    // (Z-15): Phase 6 sizes it on four label strings, and a RAM write lasts
    // two frames. The needles are assembled from fragments so this file never
    // carries them whole.
    const slot = code(componentPath("DeviceSlot.svelte"));
    const WRITING = ["writ", "ing"].join("");
    const SHOUTED = ["WRIT", "ING"].join("");
    const INSTALL = ["inst", "all"].join("");
    expect(slot.length, "the slot's code was read").toBeGreaterThan(2000);
    for (const needle of [WRITING, SHOUTED, INSTALL]) {
      expect(
        occurrences(slot, needle),
        `DeviceSlot carries "${needle}" - the slot shows no install state and never reads a busy word`,
      ).toBe(0);
    }

    // THE ANNOUNCER IS UNTOUCHED: exactly one live region, nothing from the
    // install store (the twelve install utterances reach it through
    // session.announce), and under 40 lines once its header is stripped - it
    // has no logic to gain.
    const announcer = code(componentPath("SessionAnnouncer.svelte"));
    const LIVE = ["aria", "live"].join("-");
    expect(
      occurrences(announcer, LIVE),
      "the announcer carries exactly one live region",
    ).toBe(1);
    expect(
      occurrences(announcer, "$lib/device/install"),
      "the announcer imports nothing from the install store",
    ).toBe(0);
    expect(
      announcer.split("\n").length,
      "the announcer's code is under 40 lines",
    ).toBeLessThan(40);

    // TEST 7's COUNT, AGAIN, after the header's edit: three live regions on
    // the whole site, no more.
    expect(
      liveRegionTotal(),
      "three live regions on the whole site after the header's edit",
    ).toBe(3);
  });

  it("the CLEAR cell is the measured arithmetic with its second line declared headroom, its four twins come from the closed record, and nothing about a clear animates", () => {
    // Plan 10-13. The same shape as the PUT BACK cell at test 8 and the KEEP
    // cell at test 10: the reservation is asserted on the source with its
    // arithmetic in the message, so a later reader who changes the number has
    // to read why it is the number it is.
    const clear = code(componentPath("Clear.svelte"));

    // 48px, AND THE FORMULA'S OWN ANSWER IS SMALLER (A-52). CH_PER_LINE is 43,
    // measured in Inter Variable by plan 10-01; the four candidates are
    // CLEAR_LINE at 41 and the three reasons at 43, 26 and 36, so
    // ceil(43 / 43) x 24 = 24. It is refused: one line would put a shipped
    // string exactly on a 43-character cap, which is the zero-headroom defect
    // plan 10-01 flagged against the old 86-character CLEAR_LINE reintroduced
    // at a different number. install-copy.spec.ts asserts the departure on the
    // constants; this asserts it in pixels.
    expect(
      clear,
      "the reset cell no longer reserves 48px - two Body lines, the headroom Phase 10 declared (A-52) and 13-18 kept when the caps retired; clearLine is two clauses and takes both",
    ).toContain("min-block-size: 48px");
    expect(
      clear.includes("min-block-size: 24px"),
      "the CLEAR cell has been 'corrected' to the formula's 24px - that is the zero-headroom defect A-52 exists to refuse",
    ).toBe(false);

    // FOUR CANDIDATES, TWO MARKERS, FROM THE CLOSED RECORD. The enabled line
    // plus the three reasons, every one rendered at grid-area 1 / 1 with the
    // inactive ones hidden. The marker count is TWO rather than four and that
    // is not a shortfall: the three reasons come from an {#each} over
    // install-copy's closed record rather than being listed, exactly as
    // KeepOnDevice renders its six, so a fourth reason is a type error there
    // and never a silent omission here. TryOnDevice's five are literal and its
    // count is five; this one cannot be counted that way and says so.
    expect(
      occurrences(clear, "class:twin="),
      "the CLEAR cell renders its enabled line and its iterated reasons as sizing twins - two markers, one literal and one inside the {#each} (Z-18)",
    ).toBe(2);
    expect(clear, "the inactive twins are visibility: hidden").toContain(
      "visibility: hidden",
    );
    expect(clear, "the twins are aria-hidden").toContain("aria-hidden=");
    expect(clear, "the enabled line is rendered once").toContain(
      "{clearLine(page)}",
    );
    expect(
      /CLEAR_REASONS[)][^;]*;[^]*[{]#each[ ]+REASONS/.test(clear),
      "the three reasons are iterated from CLEAR_REASONS rather than listed",
    ).toBe(true);
    for (const opening of [
      "Needs a copy of",
      "Needs your ZONA",
      "This browser can",
    ]) {
      expect(
        occurrences(clear, opening),
        `Clear retypes a reason ("${opening}...") instead of iterating the record`,
      ).toBe(0);
    }
    expect(clear, "the control carries its testid").toContain(
      'data-testid="clear"',
    );
    expect(clear, "the cell carries its testid").toContain(
      'data-testid="clear-line"',
    );

    // THE CLICK SENDS, AND IT OPENS NOTHING (A-45). One call, straight to the
    // store's sequencer; no confirmation is opened and none exists to open.
    expect(clear, "the click hands the clear to the install store").toContain(
      "install.clearToDefault(",
    );
    expect(
      occurrences(clear, "openConfirm"),
      "Clear opens a confirmation - CLEAR sends on the click (D-19, A-45), and KEEP ON DEVICE's is the site's only confirmation",
    ).toBe(0);

    // BUSY IS INSTANT (Z-09). The busy label arrives with aria-busy and
    // NOTHING in this file animates: no animation at all, and the one
    // transition is the hover colour on the enabled control, so the drop to
    // the dim rung under a write is instant.
    expect(clear, "the busy label is install-copy's clearingLabel").toContain(
      "clearingLabel(page)",
    );
    expect(clear, "the busy state carries aria-busy").toContain("aria-busy=");
    expect(
      occurrences(clear, "animation"),
      "Clear.svelte animates something - a 40 ms state under a 160 ms animation renders as a smear (Z-09)",
    ).toBe(0);
    const transitions = rulesOf(clear).filter((r) =>
      r.body.includes("transition:"),
    );
    expect(
      transitions.length,
      "Clear.svelte declares a transition somewhere, so the selector assertion below is not vacuous",
    ).toBeGreaterThan(0);
    expect(
      transitions
        .map((r) => r.selector)
        .filter((selector) => !selector.includes(":not(:disabled)")),
      "a transition is declared on a selector that is not the enabled control - disabling for a write must be instant",
    ).toEqual([]);
  });

  it("CLEAR and KEEP ON DEVICE are shapeless alike, the retired Bare tier left no trace, and the confirmation that was cut is absent", () => {
    // Plan 10-13, replacing the tracking-uniqueness test the earlier revision
    // of this plan carried. A-46 retired the Bare tier before it shipped, so
    // there is no longer anything that makes CLEAR unlike everything else;
    // what is worth holding is the opposite claim, and it is the stronger one.
    // A-41 forbids pilling the Quiet tier, and that prohibition now protects
    // TWO controls rather than one.
    const QUIET = ["KeepOnDevice.svelte", "Clear.svelte"];
    const offenders: string[] = [];
    let bodiesRead = 0;
    let trackingFound = 0;

    for (const name of QUIET) {
      const source = code(componentPath(name));
      const body = rulesOf(source)
        .filter((r) => r.selector.includes(".control"))
        .map((r) => r.body)
        .join(" ");
      bodiesRead += body.length;

      if (!/border:[ ]*(0|none)[;]/.test(body))
        offenders.push(`${name} -> the control declares a border`);
      if (!body.includes("padding-inline: 0"))
        offenders.push(`${name} -> the control declares inline padding`);
      if (body.includes("border-radius"))
        offenders.push(`${name} -> border-radius`);

      // Every declaration in the control's own rules, read one at a time so a
      // background or a tracking value is judged rather than merely found.
      for (const declaration of body.split(";")) {
        const at = declaration.indexOf(":");
        if (at < 0) continue;
        const property = declaration.slice(0, at).trim();
        const value = declaration.slice(at + 1).trim();
        if (property === "background" || property === "background-color") {
          if (value !== "transparent" && value !== "none")
            offenders.push(`${name} -> ${property}: ${value}`);
        }
        // 0.01em since 13-18: the labels are sentence case (D-05, D-23), so
        // the tracking is the sentence-case control's, not Micro's 0.18em.
        if (property === "letter-spacing") {
          trackingFound += 1;
          if (value !== "0.01em")
            offenders.push(`${name} -> letter-spacing: ${value}`);
        }
      }
    }

    // Non-vacuity in both directions: the rules were found, and a tracking
    // declaration was actually judged rather than absent.
    expect(
      bodiesRead,
      "both Quiet controls' own rules were found",
    ).toBeGreaterThan(400);
    expect(
      trackingFound,
      "neither Quiet control declares letter-spacing - the tracking rule above is vacuous",
    ).toBe(2);
    expect(
      offenders,
      "a Quiet-tier control has gained a border, a background, a radius, inline padding or a tracking other than the sentence-case control's 0.01em - A-41 forbids pilling Quiet and A-46 put the reset in it beside Store on ZONA",
    ).toEqual([]);

    // THE BARE TIER LEFT NO TRACE. A-24 gave CLEAR a fifth tier distinguished
    // by a wider tracking; A-46 retired it before it shipped. The needle is
    // assembled from fragments so this file's own text is not a hit, and the
    // scan is the whole of src/lib/ui rather than the two controls, because
    // the way it would arrive now is a copy-paste from the old plan.
    const BARE_TRACKING = ["0.2", "8em"].join("");
    const CONFIRM_TESTID = ["clear", "-confirm"].join("");
    const REMOVES_CAPTION = ["REMO", "VES"].join("");
    const EMPTIES = ["This empties the ", "Setup and Timer"].join("");
    const components = readdirSync(repo(UI_DIR))
      .map(String)
      .filter((name) => name.endsWith(".svelte"));
    expect(
      components.length,
      "the src/lib/ui walk found the site's components",
    ).toBeGreaterThan(20);
    expect(
      components.includes("ClearConfirm.svelte"),
      "ClearConfirm.svelte is on disk - A-45 retired the confirmation before it shipped, because CLEAR writes RAM only, PUT BACK directly above it undoes it and a power cycle undoes it, so KEEP ON DEVICE's is the site's only confirmation",
    ).toBe(false);

    const traces: string[] = [];
    for (const name of components) {
      const source = code(componentPath(name));
      for (const needle of [
        BARE_TRACKING,
        CONFIRM_TESTID,
        REMOVES_CAPTION,
        EMPTIES,
      ]) {
        if (source.includes(needle)) traces.push(`${name} -> ${needle}`);
      }
    }
    const copyModule = stripComments(
      readFileSync(repo("src/lib/device/install-copy.ts"), "utf8"),
    );
    for (const needle of [REMOVES_CAPTION, EMPTIES]) {
      if (copyModule.includes(needle))
        traces.push(`install-copy.ts -> ${needle}`);
    }
    expect(
      traces,
      "a trace of the retired Bare tier or of the retired CLEAR confirmation is in the tree - A-45 and A-46 removed both before they shipped, and this is how they would arrive by copy-paste from the plan that designed them",
    ).toEqual([]);
  });

  it("the connection control renders nine slot states from seventeen phases and three capability answers, is present with its reason where it cannot connect, is a button exactly when a click acts, and names one panel", () => {
    // Plan 13-11, task 1. RENDERED, not scanned: svelte/server's render()
    // works in this project (shell.spec.ts proved it at 13-05), so the
    // control is drawn over the real session store in every one of its
    // seventeen phases and the markup is read. The store's `phase` is a public
    // rune; it is written here and put back to `starting` at the end.
    const PHASES: readonly SessionPhase[] = [
      "starting",
      "unsupported",
      "insecure",
      "idle",
      "detected",
      "choosing",
      "opening",
      "identifying",
      "connected",
      "unplugged-while-connected",
      "cancelled",
      "port-busy",
      "not-zona",
      "silent",
      "unplugged-at-open",
      "unknown",
      "forgotten",
    ];
    // Non-vacuity: the list is the union. session-copy declares seventeen
    // members and the source is read to prove the list did not drift.
    const union = /export type SessionPhase =([^;]+);/.exec(
      code("src/lib/device/session-copy.ts"),
    );
    expect(union, "SessionPhase is declared").not.toBeNull();
    const declared = [...(union as RegExpExecArray)[1].matchAll(/"([^"]+)"/g)]
      .map((m) => m[1])
      .sort();
    expect([...PHASES].sort(), "the walk covers every session phase").toEqual(
      declared,
    );

    const button = (body: string) =>
      /<button[^>]*data-testid="device-slot"[^>]*>/.exec(body)?.[0] ?? "";
    const attr = (tag: string, name: string) =>
      new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
    const text = (body: string, testid: string) => {
      const m = new RegExp(`data-testid="${testid}"[^>]*>([^]*?)</span>`).exec(
        body,
      );
      return m ? m[1].replace(/<[^>]+>/g, "").trim() : undefined;
    };

    const seenSlots = new Set<string>();
    const seenCapabilities = new Set<string>();
    const before = session.phase;
    try {
      for (const phase of PHASES) {
        session.phase = phase;
        const body = render(ConnectionControl).body;
        const host = /<div[^>]*data-testid="connection-control"[^>]*>/.exec(
          body,
        )?.[0];
        expect(host, `${phase}: the host renders`).toBeDefined();
        const tag = button(body);
        expect(
          tag.length,
          `${phase}: the control is PRESENT - DEGR-02 forbids hiding it on a browser that cannot install, and CONN-01 puts one control in the header in every state`,
        ).toBeGreaterThan(0);

        const slot = attr(tag, "data-slot");
        expect(slot, `${phase}: data-slot`).toBe(slotStateOf(phase));
        expect(attr(host as string, "data-slot")).toBe(slot);
        seenSlots.add(slot as string);

        // capabilityOf()'s answer is the phase the session set from it.
        const capability = attr(host as string, "data-capability");
        expect(capability, `${phase}: data-capability`).toBe(
          phase === "unsupported" || phase === "insecure" ? phase : "ok",
        );
        seenCapabilities.add(capability as string);

        // THE BUTTON-VERSUS-SUMMARY RULE: aria-expanded in exactly the four
        // states where a click cannot act, a real `disabled` in exactly the
        // busy state, and neither anywhere else.
        const expands = tag.includes("aria-expanded=");
        const summary = ["S0a", "S0b", "S4", "S5"].includes(slot as string);
        expect(
          expands,
          `${phase} (${slot}): aria-expanded ${summary ? "missing from a summary state - the control acts on a click here and does not, so it must expand" : "present on an acting state - a control that both acts and expands lies about one of its two jobs"}`,
        ).toBe(summary);
        expect(
          tag.includes(" disabled"),
          `${phase} (${slot}): disabled exactly in S3`,
        ).toBe(slot === "S3");
        if (summary) {
          expect(
            attr(tag, "aria-controls"),
            `${phase}: a summary names the one panel`,
          ).toBe(PANEL_ID);
        } else {
          expect(
            tag.includes("aria-controls="),
            `${phase}: no panel named`,
          ).toBe(false);
        }

        // CONN-02 AND DEGR-02 ON THE TWO CAPABILITY STATES: present, enabled
        // (the reason is behind it), the caption is that browser's own line -
        // two different lines - and no connect is offered.
        if (slot === "S0a" || slot === "S0b") {
          expect(text(body, "device-slot-caption")).toBe(
            slot === "S0a" ? CAPTION_UNSUPPORTED : CAPTION_INSECURE,
          );
          expect(text(body, "device-slot-label")).not.toBe(CONNECT_LABEL);
          expect(text(body, "device-slot-label")).toBe("Preview only");
          expect(body).not.toContain("Chromium");
        }
      }
    } finally {
      session.phase = before;
    }
    expect([...seenSlots].sort(), "nine slot states and no tenth").toEqual([
      "S0a",
      "S0b",
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
    ]);
    expect([...seenCapabilities].sort(), "three capability answers").toEqual([
      "insecure",
      "ok",
      "unsupported",
    ]);
    expect(CAPTION_UNSUPPORTED).not.toBe(CAPTION_INSECURE);

    // THE RULE IS WRITTEN DOWN WHERE THE MACHINE IS AND WHERE THE HOST IS,
    // and the host reads the same table.
    const control = code("src/lib/ui/shell/ConnectionControl.svelte");
    expect(control, "the host reads slotStateOf").toContain("slotStateOf(");
    expect(control, "the host mounts the machine").toContain("<DeviceSlot");
    for (const file of [
      "src/lib/ui/DeviceSlot.svelte",
      "src/lib/ui/shell/ConnectionControl.svelte",
    ]) {
      expect(
        raw(file).toLowerCase(),
        `${file} states the button-versus-summary rule in prose`,
      ).toMatch(/summary[^.]*whenever it does not/);
    }

    // THE LAYOUT MOUNTS THE CONTROL ONCE, FOR EVERY ROUTE; no route hands one
    // in any more (13-09's provisional snippet is gone), and the shell's fill
    // no longer carries the two device slots.
    const layout = code("src/routes/+layout.svelte");
    expect(occurrences(layout, "<ConnectionControl")).toBe(1);
    expect(occurrences(layout, "<DeviceActions")).toBe(1);
    expect(occurrences(code(WORKSPACE), "DeviceSlot")).toBe(0);
    const fill = code("src/lib/ui/shell/shell.svelte.ts");
    expect(fill).not.toContain("connection?:");
    expect(fill).not.toContain("deviceActions?:");
  });

  it("fifteen phases are each accounted for, the four the spec has no row for are present by name, the four uncertain phases keep four distinct bodies and four distinct clauses, and the bar takes the draft and the device as two props", () => {
    // Plan 13-11, task 2 - THE ANTI-COLLAPSE TEST. The union is read from the
    // store's source so the fifteen cannot drift from the fourteen or the
    // sixteen without this test noticing.
    const union = /export type InstallPhase =([^;]+);/.exec(
      code("src/lib/device/install.svelte.ts"),
    );
    expect(union, "InstallPhase is declared").not.toBeNull();
    const phases = [
      ...(union as RegExpExecArray)[1].matchAll(/"([^"]+)"/g),
    ].map((m) => m[1] as InstallPhase);
    expect(phases.length, "fifteen phases (fourteen until plan 10-12)").toBe(
      15,
    );

    // Every phase renders: thirteen by a branch of their own, `idle` by the
    // gate that renders nothing (the panel renders the session's blocks
    // then), `writing` by holding the last block under aria-busy. Nothing is
    // unaccounted for and nothing is a fall-through onto a neighbour's shape.
    const state = code(componentPath("InstallState.svelte"));
    const branched = phases.filter((p) => state.includes(`shown === "${p}"`));
    expect(
      phases.filter((p) => !branched.includes(p)).sort(),
      "a phase lost its own branch - the two without one are idle (renders nothing) and writing (holds the last block); any other name here is a phase collapsed into a neighbour",
    ).toEqual(["idle", "writing"]);
    expect(branched.length, "thirteen phases have a branch").toBe(13);
    expect(state).toContain('shown !== "idle"');
    expect(state).toContain("writing ? held : install.phase");
    expect(state).toContain('aria-busy={writing ? "true" : undefined}');

    // THE FOUR THE SPEC HAS NO ROW FOR, PRESENT BY NAME. These are the safety
    // rail; a re-skin that folded one into a neighbour goes red here naming it.
    for (const phase of [
      "restored",
      "restored-unconfirmed",
      "cleared",
      "snapshot-failed",
    ]) {
      expect(
        branched,
        `${phase}: a phase the spec has no row for was collapsed into a neighbour`,
      ).toContain(phase);
    }
    expect([...UNCHARTED_PHASES].sort()).toEqual([
      "cleared",
      "restored",
      "restored-unconfirmed",
      "snapshot-failed",
    ]);

    // THE FOUR UNCERTAIN PHASES: four branches calling four DIFFERENT builders,
    // whose titles are pairwise distinct. Section 16 offers one sentence for
    // all of them; HANGAR measured four outcomes and keeps four bodies.
    const uncertain = [
      "unconfirmed",
      "kept-mismatch",
      "partial",
      "nothing-landed",
    ];
    expect([...UNCERTAIN_PHASES].sort()).toEqual([...uncertain].sort());
    const builderOf = (phase: string): string | undefined => {
      const at = state.indexOf(`shown === "${phase}"`);
      const next = state.indexOf("{:else if", at + 1);
      const branch = state.slice(at, next < 0 ? undefined : next);
      return /block=\{([a-zA-Z]+)\(/.exec(branch)?.[1];
    };
    const builders = uncertain.map(builderOf);
    expect(
      builders,
      "each uncertain phase renders through its own block builder",
    ).toEqual([
      "unconfirmedBlock",
      "keptMismatchBlock",
      "partialBlock",
      "nothingLandedBlock",
    ]);
    const titles = [
      unconfirmedBlock("x", 0).title,
      keptMismatchBlock(0).title,
      partialBlock(
        "The system timer and the page init",
        "the utility script, the Timer and the Setup",
        0,
      ).title,
      nothingLandedBlock("try", 0).title,
    ];
    expect(
      new Set(titles).size,
      "four distinct titles - two uncertain outcomes read as one sentence",
    ).toBe(4);
    const missing = uncertain.filter((p, i) => builders[i] === undefined);
    expect(missing, "an uncertain phase lost its body").toEqual([]);

    // THE BAR'S DEVICE CLAUSE: every phase but idle has one, the same words as
    // the block under the surface, and the four uncertain clauses differ.
    const clauses = new Map(
      phases.map((p) => [p, deviceClause(p, 1)] as const),
    );
    expect(clauses.get("idle")).toBeUndefined();
    for (const p of phases) {
      if (p === "idle") continue;
      expect(clauses.get(p), `${p}: a clause`).toBeTruthy();
    }
    expect(
      new Set(uncertain.map((p) => clauses.get(p as InstallPhase))).size,
      "the four uncertain clauses are pairwise distinct",
    ).toBe(4);
    expect(clauses.get("settled")).toBe(settledCaption(1));
    expect(clauses.get("kept")).toBe(keptCaption(1));
    expect(clauses.get("cleared")).toBe(clearedCaption(1));
    // The page rides through the bar (13-18): wire 1 reads as Page 2 in
    // every confirmed clause, and the titles name no page.
    expect(clauses.get("kept")).toBe("Stored on ZONA · Page 2");
    expect(deviceClause("kept", 3)).toBe("Stored on ZONA · Page 4");
    expect(clauses.get("partial")).not.toMatch(/Page d/);

    // TWO PROPS, NOT ONE. ContextBar declares `draft` and `device` separately
    // and the layout passes both from the fill's two fields; rendered with
    // both, the dot, the two clauses and the middle dot appear; with the
    // device alone, one clause and no middle dot; with neither, the sentence.
    const bar = code("src/lib/ui/shell/ContextBar.svelte");
    expect(bar).toContain("draft?: string | Snippet;");
    expect(bar).toContain("device?: InstallPhase;");
    const layout = code("src/routes/+layout.svelte");
    expect(layout).toContain("draft={fill.draft}");
    expect(layout).toContain("device={fill.device}");
    const both = render(ContextBar, {
      props: {
        breadcrumb: ["PLAYGROUND", "ARC"],
        draft: "a draft clause",
        device: "settled",
      },
    }).body;
    expect(both).toContain('data-testid="status-dotted"');
    expect(both).toContain('data-testid="status-draft"');
    expect(both).toContain('data-testid="status-device"');
    expect(both).toContain(settledCaption(0));
    expect(both).toContain(" · ");
    expect(both).toContain('data-tone="live"');
    const deviceOnly = render(ContextBar, {
      props: { breadcrumb: ["PLAYGROUND", "ARC"], device: "partial" },
    }).body;
    expect(deviceOnly).toContain('data-testid="status-device"');
    expect(deviceOnly).not.toContain('data-testid="status-draft"');
    expect(deviceOnly).not.toContain(" · ");
    expect(deviceOnly).toContain('data-tone="uncertain"');
    expect(deviceOnly).toContain(
      partialBlock(
        "The system timer and the page init",
        "the utility script, the Timer and the Setup",
        0,
      ).title,
    );
    const neither = render(ContextBar, {
      props: {
        breadcrumb: ["PLAYGROUND", "CONFIGURATIONS"],
        status: "A sentence.",
      },
    }).body;
    expect(neither).not.toContain('data-testid="status-dotted"');
    expect(neither).toContain("A sentence.");
    const idle = render(ContextBar, {
      props: { breadcrumb: ["PLAYGROUND", "ARC"], device: "idle" },
    }).body;
    expect(idle, "idle has no clause and draws no dot").not.toContain(
      'data-testid="status-dotted"',
    );
    // The workspace hands the device's phase and no pre-joined line.
    const workspace = code(WORKSPACE);
    expect(workspace).toContain("device: install.phase");
    expect(workspace).not.toContain("draft:");
  });

  it("Device actions in the footer: one mount of the disclosure, two openers naming one panel, the five states and FORGET's gate unchanged, focus returned to the opener, and nothing modal", () => {
    // Plan 13-11. The disclosure moved from the header's corner to the
    // footer; what this holds is that it moved WHOLE and ONCE.
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) out.push(...walk(rel));
        else if (entry.name.endsWith(".svelte")) out.push(rel);
      }
      return out;
    };
    const mounts = [...walk(UI_DIR), ...walk("src/routes")].filter((file) =>
      code(file).includes("<DeviceDetails"),
    );
    expect(
      mounts,
      "DeviceDetails is mounted exactly once on the site, by Device actions (Y-11: the recovery is never on the screen twice)",
    ).toEqual([`${UI_DIR}/DeviceActions.svelte`]);

    // Two openers, one panel id, from one module.
    const slot = code(componentPath("DeviceSlot.svelte"));
    const actions = code(componentPath("DeviceActions.svelte"));
    expect(slot).toContain("aria-controls={isSummary ? PANEL_ID : undefined}");
    expect(actions).toContain("aria-controls={PANEL_ID}");
    expect(actions).toContain("id={PANEL_ID}");
    expect(slot).toContain('from "./device-drawer.svelte"');
    expect(actions).toContain('from "./device-drawer.svelte"');
    expect(
      occurrences(slot, "let open = $state"),
      "the slot no longer owns open",
    ).toBe(0);

    // The five states, the lock, the snapshot line and FORGET's gate, unchanged.
    const details = code(componentPath("DeviceDetails.svelte"));
    for (const s of ["S0a", "S0b", "S4", "S5", "S6"]) {
      expect(details, `the ${s} branch survives`).toContain(`slot === "${s}"`);
    }
    expect(occurrences(details, "{FORGET_LABEL}"), "FORGET in S4 and S5").toBe(
      2,
    );
    expect(
      details.indexOf("{REVOKE_EXPLANATION}") <
        details.indexOf("{FORGET_LABEL}"),
      "FORGET's explanation precedes the control - its gate is the explanation one disclosure away",
    ).toBe(true);
    expect(details).toContain("session.canForget");
    expect(details).toContain('data-testid="details-disconnect"');
    expect(details).toContain('data-testid="details-forget"');

    // Focus returns to the opener on Escape; both close paths know an opener.
    expect(details).toContain("previouslyFocused?.focus()");
    expect(
      occurrences(details, "if (isOpener(target)) return;") +
        occurrences(details, "isOpener(next)"),
      "the click-outside and focus-leaving paths both recognise an opener",
    ).toBe(2);
    expect(details).toContain("OPENER_SELECTOR");
    expect(
      details,
      "the drawer no longer floats from the header's corner",
    ).not.toContain("position: absolute");

    // Nothing modal, anywhere in the re-homed chrome. Needles assembled so
    // this file never carries them whole.
    const DIALOG = ["role=", '"dia', 'log"'].join("");
    const MODAL = ["aria-", "modal"].join("");
    const INERT = ["in", "ert"].join("");
    const LABEL = ["aria-", "label="].join("");
    for (const file of [
      componentPath("DeviceActions.svelte"),
      componentPath("DeviceDetails.svelte"),
      "src/lib/ui/shell/ConnectionControl.svelte",
    ]) {
      for (const needle of [DIALOG, MODAL, INERT, LABEL]) {
        expect(
          occurrences(code(file), needle),
          `${file} carries ${needle}`,
        ).toBe(0);
      }
    }

    // Rendered closed: the label, its state, the panel it names, and no
    // details inside; the label declares the 44px floor on both axes.
    const body = render(DeviceActions).body;
    const label = /<button[^>]*data-testid="device-actions"[^>]*>/.exec(
      body,
    )?.[0];
    expect(label, "the footer's label renders").toBeDefined();
    expect(label).toContain('aria-expanded="false"');
    expect(label).toContain(`aria-controls="${PANEL_ID}"`);
    expect(body).toContain(`id="${PANEL_ID}"`);
    expect(body).not.toContain('data-testid="device-details"');
    const labelRule = rulesOf(actions)
      .filter((r) => r.selector.includes(".label"))
      .map((r) => r.body)
      .join(" ");
    expect(labelRule).toContain("min-block-size: 44px");
    expect(labelRule).toContain("min-inline-size: 44px");

    // The allowlist's last two rows are cleared: no corner in either file.
    expect(occurrences(details, "border-radius")).toBe(0);
    expect(
      occurrences(code(componentPath("KeepConfirm.svelte")), "border-radius"),
    ).toBe(0);
  });

  it("no destination review: a change on the Target select is the whole switch, nothing under src/lib/ui/ mounts a review, and the store's one caller of the target's confirm() is confirmPage", () => {
    // Plan 13.1-02; 13.1-CONTEXT D-05 (bench line 5: "Page switch doesnt
    // need a confirmation window. When you change page form the drop down
    // just change the page and thats it."), which struck 13-CONTEXT D-06's
    // second clause. This is 13-12's review test INVERTED: it held that the
    // review appeared on first use and on every change and could not be
    // skipped; it now holds that the review does not exist, that the select's
    // change is the whole gesture, and that the wire's envelope - the one
    // caller of confirm(), the target's own guard, the heartbeat-first order
    // page-target.spec.ts asserts off the frames - did not move with it.
    const route = code("src/routes/playground/[id]/+page.svelte");
    const actions = code(`${UI_DIR}/sandbox/SurfaceActions.svelte`);
    const store = code("src/lib/device/install.svelte.ts");
    const target = code("src/lib/device/page-target.ts");

    // THE COMPONENT IS GONE, not left mounted nowhere (D-12's precedent).
    expect(
      existsSync(repo(`${UI_DIR}/DestinationReview.svelte`)),
      "DestinationReview.svelte is still on disk",
    ).toBe(false);

    // NOTHING MOUNTS A REVIEW. Every component under src/lib/ui/ and the two
    // routes that own a destination zone are read - non-vacuity first - and
    // none carries the review's tag, its testid or its two retired words.
    const svelteFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
        if (entry.isDirectory()) walk(`${dir}/${entry.name}`);
        else if (entry.name.endsWith(".svelte"))
          svelteFiles.push(`${dir}/${entry.name}`);
      }
    };
    walk(UI_DIR);
    expect(
      svelteFiles.length,
      "the walk over src/lib/ui/ read components",
    ).toBeGreaterThan(20);
    const scanned = [
      ...svelteFiles,
      "src/routes/playground/[id]/+page.svelte",
      "src/routes/sandbox/+page.svelte",
    ];
    const REVIEW_TAG = ["<Destination", "Review"].join("");
    const REVIEW_ID = ["destination", "-review"].join("");
    const REVIEW_LINE = ["switch", "ReviewLine"].join("");
    const REVIEW_TITLE = ["replace", "ReviewTitle"].join("");
    for (const file of scanned) {
      const source = code(file);
      for (const needle of [REVIEW_TAG, REVIEW_ID, REVIEW_LINE, REVIEW_TITLE]) {
        expect(
          occurrences(source, needle),
          `${file} carries the review: ${needle}`,
        ).toBe(0);
      }
    }
    for (const needle of [REVIEW_LINE, REVIEW_TITLE]) {
      expect(
        occurrences(target, needle),
        `page-target.ts still exports ${needle}`,
      ).toBe(0);
    }

    // THE CHANGE IS THE WHOLE GESTURE. Both destination zones call the
    // store's one method from the select's change handler, and neither
    // reaches for requestPage on its own: the request and the send are one
    // call, with no state a route could hold a review in between.
    for (const [file, source] of [
      ["the workspace route", route],
      ["SurfaceActions.svelte", actions],
    ] as const) {
      expect(source, `${file} switches on change`).toContain(
        "install.switchPage(value)",
      );
      expect(
        occurrences(source, "install.requestPage("),
        `${file} opens a request of its own`,
      ).toBe(0);
      expect(
        occurrences(source, 'install.pageStatus === "requested"'),
        `${file} renders the requested state`,
      ).toBe(0);
      expect(source).toContain("onTargetChange");
    }

    // THE ENVELOPE DID NOT MOVE. The store's switchPage is requestPage then
    // confirmPage; confirmPage is still the ONLY caller of the target's
    // confirm(); the target still refuses a send that no request opened; and
    // switchPage's return is the wire's fact - switching, or cancelled.
    expect(store).toContain("async switchPage(page: number): Promise<boolean>");
    expect(store).toContain("if (!this.requestPage(page)) return false;");
    expect(store).toContain("await this.confirmPage();");
    expect(store).toContain('if (this.pageStatus !== "switching") {');
    expect(
      occurrences(store, "target.confirm("),
      "confirmPage is the only caller of the target's confirm()",
    ).toBe(1);
    expect(store).toContain("const opened = target.request(page);");
    expect(target).toContain('if (this.status !== "requested") return;');

    // NOTHING TO REMEMBER, STILL. 13-12 forbade a "don't ask again" on the
    // path because nothing configured a skip; with no review there is nothing
    // to skip, and the needles stay at zero so a memory of a destination
    // cannot arrive under another name. Assembled so this file never carries
    // them whole.
    const DONT_ASK = ["don", "’t ask"].join("");
    const DONT_ASK_ASCII = ["don", "'t ask"].join("");
    const SKIP = ["skip", "Review"].join("");
    const REMEMBER = ["remember", "Destination"].join("");
    for (const [file, source] of [
      ["the workspace route", route],
      ["SurfaceActions.svelte", actions],
      ["install.svelte.ts", store],
      ["page-target.ts", target],
    ] as const) {
      for (const needle of [DONT_ASK, DONT_ASK_ASCII, SKIP, REMEMBER]) {
        expect(
          occurrences(stripComments(source), needle),
          `${file} carries a skip: ${needle}`,
        ).toBe(0);
      }
    }

    // THE DECISION IS RECORDED where the words were, not merely absent: the
    // store's header names the bench and the arrow-key fact for the gate's
    // bench row, and both copy modules retire their review strings by name.
    expect(raw("src/lib/device/install.svelte.ts")).toContain(
      "13.1-CONTEXT D-05",
    );
    expect(raw("src/lib/device/install.svelte.ts")).toContain(
      "THE KEYBOARD FACT, NAMED",
    );
    const targetRaw = raw("src/lib/device/page-target.ts");
    expect(targetRaw).toContain("RETIRED BY NAME,");
    expect(targetRaw).toContain("2026-09-12 (13.1-02, 13.1-CONTEXT D-05");
    expect(raw("src/lib/device/install-copy.ts")).toContain(
      "THE REVIEW'S TWO LABELS ARE RETIRED BY NAME, 2026-09-12",
    );
  });
});
