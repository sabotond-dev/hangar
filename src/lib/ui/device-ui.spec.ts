// The structural gate over the device chrome: the header's connection control
// and its machine, the note, the details, the footer's Device actions, the
// destination zone and the confirmation - free of the compiler, no fourth
// colour, the 44px floor per control, one live region, every sentence the copy
// module's, and honest about what each control announces. Most are properties of
// the SOURCE (comment-stripped, so a header may name what its code may not);
// three render the real components with svelte/server. Four raw prose pins read
// the files unstripped: aria-live in TuningRegion, writeLock in DeviceDetails,
// the summary-versus-button sentence in DeviceSlot and ConnectionControl.
// Decided at 06-12 / 07-09 / 13-11 / 13.1-06; see .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import {
  CLEAR_LABEL,
  CLEAR_REASONS,
  type ClearReason,
  HONESTY_INCAPABLE,
  HONESTY_SNAPSHOTTING,
  KEEP_LABEL,
  KEEP_REASONS,
  NEEDS_ZONA,
  STILL_WRITING_LINE,
  clearLine,
  clearedCaption,
  clearingLabel,
  keepLineEnabled,
  keptCaption,
  keptMismatchBlock,
  nothingLandedBlock,
  partialBlock,
  restoredCaption,
  settledCaption,
  unconfirmedBlock,
} from "$lib/device/install-copy";
import {
  type ConfigStrings,
  type InstallPhase,
  install,
} from "$lib/device/install.svelte";
import {
  CAPTION_INSECURE,
  CAPTION_UNSUPPORTED,
  CONNECT_LABEL,
  type SessionPhase,
  slotStateOf,
} from "$lib/device/session-copy";
import { session } from "$lib/device/session.svelte";
import Clear from "./Clear.svelte";
import DestinationZone from "./DestinationZone.svelte";
import { PANEL_ID } from "./device-drawer.svelte";
import DeviceActions from "./DeviceActions.svelte";
import ConnectionControl from "./shell/ConnectionControl.svelte";
import ContextBar from "./shell/ContextBar.svelte";
import {
  UNCERTAIN_PHASES,
  UNCHARTED_PHASES,
  deviceClause,
} from "./shell/device-clause";
import { stripComments } from "../../test-support/source";

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
 * The install leaves: TWO since 13.1-06. Plan 07-09 added three - InstallState,
 * KeepConfirm and PutBack - and 13.1-06 deleted two of them with the column
 * and TryOnDevice (13.1-CONTEXT D-06, D-07); what renders the install store on
 * a visitor's screen now is the context bar's destination zone and the
 * confirmation it mounts in Store on ZONA's place. Listed, like the seven
 * above, so a rename is a visible omission; checked against the directory in
 * the zone test.
 */
const INSTALL_LEAVES: readonly string[] = [
  "DestinationZone.svelte",
  "KeepConfirm.svelte",
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

const raw = (rel: string) => readFileSync(repo(rel), "utf8");
const code = (rel: string) => stripComments(raw(rel));
const componentPath = (name: string) => `${UI_DIR}/${name}`;
/** The workspace route, where the chosen panel's column and the Escape rules live since 13-09. */
const WORKSPACE = "src/routes/playground/[id]/+page.svelte";
/** The layout, which mounts the header's Clear since 13.1-05. */
const LAYOUT = "src/routes/+layout.svelte";
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

  it("exactly one session live region on the site, and the destination zone is not it", () => {
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
    // THE SUBJECT SINCE 13.1-06 is the context bar's destination zone: it is
    // what renders the install store's failure blocks and its still-writing
    // line now that TryOnDevice.svelte and InstallState.svelte are deleted
    // (13.1-CONTEXT D-06), so it is the surface that would be tempted to
    // announce a second time.
    const LIVE = ["aria", "live"].join("-");
    const PANEL = `${UI_DIR}/DestinationZone.svelte`;
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
    expect(files, "the destination zone is inside the walk").toContain(PANEL);

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
      "DestinationZone.svelte carries an aria-live - the zone is announcing the session a second time",
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

  it("the destination zone: one component for both routes - Target, Store described by the honesty line or its confirmation in the same place, the reason, the refusal, the switching or unverified line, a failure's block; no Apply, no Put back; a group that is not a dialog", () => {
    // Plan 13.1-06; 13.1-CONTEXT D-06 and D-07 (bench line 6: "the second
    // row in the page (so under the logo) the right side should look like
    // this: Target PAGE 1 on ZONA selector, Apply to ZONA button, Store on
    // ZONA button"; "we dont even need the Put back function"). Absorbs what
    // the two deleted column tests held that still has a subject. APPLY LEFT
    // ON 2026-09-16 (BENCH-2026-09-16.txt section 1: "we dont need the apply
    // to ZONA, only Store stays"): the zone is Target and Store, the honesty
    // line is Store's description, the refusal disables Store.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(INSTALL_LEAVES.length, "two leaves were listed").toBe(2);
    expect(
      INSTALL_LEAVES.filter((name) => !present.has(name)),
      "a listed install leaf is not on disk",
    ).toEqual([]);
    // THE FOUR ARE GONE, not left mounted nowhere (D-12's precedent).
    for (const gone of [
      "TryOnDevice.svelte",
      "InstallState.svelte",
      "KeepOnDevice.svelte",
      "PutBack.svelte",
    ]) {
      expect(present.has(gone), `${gone} is still on disk`).toBe(false);
    }

    // THE SOURCE. The test ids; no Apply; no put-back; no dialog; Store
    // described; the failure block; the 44px floor on every control's own
    // class; every border-radius zero; the honesty line derived, not retyped.
    const zone = code(componentPath("DestinationZone.svelte"));
    expect(zone.length, "the zone's code was read").toBeGreaterThan(3000);
    for (const id of [
      "destination",
      "destination-page",
      "store-on-zona",
      "store-confirm",
      "store-on-zona-line",
      "store-refusal",
      "destination-line",
      "store-honesty",
      "still-writing",
    ]) {
      expect(
        occurrences(zone, `data-testid="${id}"`),
        `the zone carries ${id} once`,
      ).toBe(id === "destination-line" ? 2 : 1);
    }
    expect(zone).toContain('testid="install-failure"');
    const APPLY_ID = ["apply", "-to-zona"].join("");
    for (const gone of [
      `data-testid="${APPLY_ID}"`,
      'data-testid="apply-honesty"',
      'data-testid="apply-refusal"',
      "install.tryOnDevice(",
      "destination-apply",
    ]) {
      expect(occurrences(zone, gone), `the zone still carries ${gone}`).toBe(0);
    }
    const PUT_BACK_ID = ["put", "-back"].join("");
    expect(
      occurrences(zone, `data-testid="${PUT_BACK_ID}"`),
      "the zone carries a Put back control",
    ).toBe(0);
    expect(occurrences(zone, "<PutBack"), "the zone mounts PutBack").toBe(0);
    expect(
      occurrences(zone, "install.putBack("),
      "the zone calls the restore",
    ).toBe(0);
    const DIALOG = ["role=", '"dia', 'log"'].join("");
    const MODAL = ["aria-", "modal"].join("");
    const LABEL = ["aria-", "label="].join("");
    const INTERVAL = ["set", "Interval"].join("");
    for (const needle of [DIALOG, MODAL, LABEL, INTERVAL]) {
      expect(occurrences(zone, needle), `the zone carries ${needle}`).toBe(0);
    }
    expect(zone, "Store is described").toMatch(
      /data-testid="store-on-zona"[^>]*aria-describedby=\{storeDescribedBy\}/,
    );
    expect(zone).toContain("<FailureBlock block={failure}");
    expect(zone).toContain("install.openConfirm()");
    expect(zone).toContain("install.switchPage(value)");
    expect(zone).toContain(
      "<KeepConfirm {config} {name} onclose={closeConfirm} />",
    );
    for (const constant of [
      "HONESTY_INCAPABLE",
      "HONESTY_SNAPSHOTTING",
      "NEEDS_ZONA",
      "keepLineEnabled(page)",
      "STILL_WRITING_LINE",
    ]) {
      expect(zone, `the zone reads ${constant}`).toContain(constant);
    }
    // And the confirmation's affirmative hands the same config and name to
    // the store's one write: no second write path.
    const confirm = code(componentPath("KeepConfirm.svelte"));
    expect(confirm).toContain("install.keepOnDevice(config, name)");
    const rules = rulesOf(zone);
    for (const cls of ["destination-select", "destination-store"]) {
      const body = rules
        .filter((r) => r.selector.trim() === `.${cls}`)
        .map((r) => r.body)
        .join(" ");
      expect(body, `.${cls} has a rule`).not.toBe("");
      expect(body, `.${cls} declares the 44px floor`).toContain(
        "min-block-size: 44px",
      );
      expect(body, `.${cls} is square`).toContain("border-radius: 0");
    }
    const radii = [...zone.matchAll(/border-radius:[ ]*([^;]+);/g)].map((m) =>
      m[1].trim(),
    );
    expect(radii.length, "the zone declares radii").toBeGreaterThan(0);
    expect(
      radii.filter((r) => r !== "0"),
      "a radius above zero",
    ).toEqual([]);
    // Every specifier is a permitted path, the framework, or a sibling.
    const specifiers = [...zone.matchAll(/from[ ]*["']([^"']+)["']/g)].map(
      (m) => m[1],
    );
    expect(specifiers.length, "static imports were collected").toBeGreaterThan(
      3,
    );
    const sibling = (specifier: string) =>
      specifier.startsWith("./") &&
      specifier.endsWith(".svelte") &&
      present.has(specifier.slice(2));
    expect(
      specifiers.filter(
        (specifier) =>
          !PERMITTED_SPECIFIERS.includes(specifier) &&
          specifier !== "svelte" &&
          !sibling(specifier),
      ),
      "the zone names a specifier that is neither a permitted path, the framework, nor a sibling component",
    ).toEqual([]);

    // BOTH ROUTES MOUNT THE ONE ZONE, once each, and mount none of the four.
    const SANDBOX = "src/routes/sandbox/[draftId]/+page.svelte";
    for (const [file, source] of [
      ["the workspace route", code(WORKSPACE)],
      ["the Sandbox route", code(SANDBOX)],
    ] as const) {
      expect(
        occurrences(source, "<DestinationZone"),
        `${file} mounts the zone once`,
      ).toBe(1);
      for (const tag of [
        "<TryOnDevice",
        "<PutBack",
        "<KeepOnDevice",
        "<InstallState",
        "<KeepConfirm",
      ]) {
        expect(occurrences(source, tag), `${file} mounts ${tag}`).toBe(0);
      }
      expect(
        occurrences(source, `data-testid="${PUT_BACK_ID}"`),
        `${file} draws a Put back`,
      ).toBe(0);
      expect(
        occurrences(source, "install.tryOnDevice("),
        `${file} calls the probe's TRY`,
      ).toBe(0);
    }
    const workspace = code(WORKSPACE);
    for (const gone of [
      'data-testid="chosen-panel"',
      'data-testid="next-caption"',
      "install-row",
      "panelRoot",
    ]) {
      expect(
        occurrences(workspace, gone),
        `the column is still here: ${gone}`,
      ).toBe(0);
    }
    expect(
      workspace,
      "the tuner's pair still reaches the store (TryOnDevice's effect, kept in the route)",
    ).toContain("install.observeConfig(pair)");
    const actions = code(`${UI_DIR}/sandbox/SurfaceActions.svelte`);
    expect(
      occurrences(actions, "destination"),
      "SurfaceActions still carries a destination half",
    ).toBe(0);
    expect(occurrences(actions, "zone"), "the zone prop is gone").toBe(0);
    // NOTHING UNDER src/lib/ui/ OR THE ROUTES DRAWS A PUT BACK CONTROL OR
    // CALLS THE PROBE'S TRY. The probe under src/routes/dev/ keeps its own
    // buttons for the machinery.
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(repo(dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          if (rel !== "src/routes/dev") walk(rel, out);
        } else if (entry.name.endsWith(".svelte")) out.push(rel);
      }
      return out;
    };
    const drawn = walk(UI_DIR).concat(walk("src/routes"));
    expect(drawn.length, "the walk read components").toBeGreaterThan(30);
    expect(
      drawn.filter(
        (file) => occurrences(code(file), `data-testid="${PUT_BACK_ID}"`) > 0,
      ),
      "a component or route outside the probe draws a Put back control",
    ).toEqual([]);
    expect(
      drawn.filter((file) => occurrences(code(file), "install.putBack(") > 0),
      "a component or route outside the probe calls the restore",
    ).toEqual([]);
    expect(
      drawn.filter(
        (file) => occurrences(code(file), "install.tryOnDevice(") > 0,
      ),
      "a component or route outside the probe calls the RAM audition (2026-09-16)",
    ).toEqual([]);
    expect(
      drawn.filter(
        (file) => occurrences(code(file), `data-testid="${APPLY_ID}"`) > 0,
      ),
      "a component or route outside the probe draws an Apply control",
    ).toEqual([]);
    const probe = code("src/routes/dev/install/+page.svelte");
    expect(
      occurrences(probe, "install.putBack("),
      "the probe keeps its restore button",
    ).toBe(1);
    expect(
      occurrences(probe, "install.tryOnDevice("),
      "the probe keeps its TRY button",
    ).toBe(1);
    expect(
      occurrences(probe, "install.keepOnDevice(pair(), NAME)"),
      "the probe's Keep hands the store the pair and the name",
    ).toBe(1);
    const storeSource = code("src/lib/device/install.svelte.ts");
    expect(
      occurrences(storeSource, "async putBack()"),
      "the store keeps putBack()",
    ).toBe(1);
    expect(
      occurrences(storeSource, "async tryOnDevice("),
      "the store keeps tryOnDevice() for the probe",
    ).toBe(1);

    // RENDERED, over the real singletons, under a hand-set mirror. Every
    // field written is put back to what it was.
    const snapshot: ConfigStrings = {
      systemTimer: "",
      system: "",
      systemUtility: "",
      setup: "",
      timer: "",
    };
    const PAGE = 1;
    const props = { name: "Arc", config: snapshot };
    const decode = (t: string) =>
      t.replace(/&#39;|&#x27;/g, "'").replace(/&#8217;/g, "’");
    const spanText = (body: string, testid: string) => {
      const m = new RegExp(`data-testid="${testid}"[^>]*>([^]*?)</span>`).exec(
        body,
      );
      return m ? decode(m[1].replace(/<[^>]+>/g, "").trim()) : undefined;
    };
    const storeTag = (body: string) =>
      /<button[^>]*data-testid="store-on-zona"[^>]*>/.exec(body)?.[0];
    const before = {
      session: session.phase,
      identity: session.identity,
      phase: install.phase,
      action: install.action,
      name: install.name,
      snapshot: install.snapshot,
      snapshotPage: install.snapshotPage,
      applyReady: install.applyReady,
      armed: install.armed,
      slow: install.slow,
      confirmOpen: install.confirmOpen,
    };
    try {
      session.phase = "connected";
      install.snapshotPage = PAGE;
      install.snapshot = snapshot;
      install.applyReady = true;
      install.armed = true;
      install.action = undefined;
      install.name = undefined;
      install.confirmOpen = false;
      install.slow = false;

      // READY: the honesty line is Store's description; no Apply; no failure
      // block; no still-writing line. The singleton has no queue in node, so
      // keepReason reads no-session and Store is a real disabled with that
      // sentence on its line - the live form is install.spec.ts's, on a rig.
      install.phase = "ready";
      const ready = render(DestinationZone, { props }).body;
      expect(ready).not.toContain(`data-testid="${APPLY_ID}"`);
      expect(ready).toContain('data-testid="store-on-zona"');
      expect(ready).toContain('data-testid="destination-page"');
      expect(ready).not.toContain(`data-testid="${PUT_BACK_ID}"`);
      expect(spanText(ready, "store-honesty"), "ready: the honesty line").toBe(
        keepLineEnabled(PAGE),
      );
      const readyTag = storeTag(ready);
      expect(readyTag, "Store renders").toBeDefined();
      const honestyId = /id="([^"]+)" data-testid="store-honesty"/.exec(
        ready,
      )?.[1];
      expect(honestyId, "the honesty span has an id").toBeDefined();
      const lineId = /id="([^"]+)" data-testid="store-on-zona-line"/.exec(
        ready,
      )?.[1];
      expect(lineId, "the reason line has an id").toBeDefined();
      expect(
        readyTag,
        "Store is described by the honesty line and the reason line",
      ).toContain(`aria-describedby="${honestyId} ${lineId}"`);
      expect(ready).toContain(KEEP_LABEL);
      expect(readyTag).toContain(" disabled");
      expect(decode(ready)).toContain(KEEP_REASONS["no-session"]);
      expect(ready).not.toContain('data-testid="install-failure"');
      expect(ready).not.toContain('data-testid="still-writing"');
      expect(ready).not.toContain(DIALOG);

      // OVER BUDGET: Store is a real disabled, described by the honesty line,
      // the reason line AND the refusal, and the refusal is on the screen.
      const refused = render(DestinationZone, {
        props: { ...props, refusal: "Setup is 910 of 908, 2 over." },
      }).body;
      const refusedTag = storeTag(refused);
      expect(refusedTag).toContain(" disabled");
      expect(refusedTag).toMatch(
        /aria-describedby="[^"]+-honesty [^"]+-store-line [^"]+-refusal"/,
      );
      expect(refused).toContain('data-testid="store-refusal"');
      expect(refused).toContain("Setup is 910 of 908, 2 over.");

      // THE HONESTY LINE'S OTHER FORMS: no session, snapshotting, incapable.
      session.phase = "idle";
      install.phase = "idle";
      expect(
        spanText(render(DestinationZone, { props }).body, "store-honesty"),
        "no session",
      ).toBe(NEEDS_ZONA);
      session.phase = "connected";
      install.phase = "snapshotting";
      expect(
        spanText(render(DestinationZone, { props }).body, "store-honesty"),
        "snapshotting",
      ).toBe(HONESTY_SNAPSHOTTING);
      session.phase = "unsupported";
      install.phase = "idle";
      expect(
        spanText(render(DestinationZone, { props }).body, "store-honesty"),
        "incapable",
      ).toBe(HONESTY_INCAPABLE);
      session.phase = "connected";

      // NOTHING LANDED (W-12): the block under install-failure with its
      // title and its two steps; after a Store the steps name Store on ZONA
      // and the cable (the store form, 2026-09-16); the way back to the
      // firmware default is the header's Clear, which the other three failure
      // blocks' second step names since 13.1-06 (install-copy.spec.ts holds
      // every step against the write clicks - the words are that module's
      // contract, not this one's).
      install.phase = "nothing-landed";
      install.action = "keep";
      const landed = render(DestinationZone, { props }).body;
      expect(landed).toContain('data-testid="install-failure"');
      const block = nothingLandedBlock("store", PAGE);
      expect(decode(landed)).toContain(block.title);
      expect(decode(landed)).toContain(block.detail);
      for (const step of block.steps) expect(decode(landed)).toContain(step);
      expect(block.steps[0]).toContain(KEEP_LABEL);
      expect(
        (landed.match(/<li>/g) ?? []).length,
        "two steps, as a real list",
      ).toBe(2);
      expect(decode(landed)).not.toContain(["Put", " back"].join(""));
      // The header's Clear keeps the form it had.
      install.action = "clear";
      expect(decode(render(DestinationZone, { props }).body)).toContain(
        nothingLandedBlock("put-back", PAGE).detail,
      );
      // And a failure whose way back is the firmware default names Clear.
      install.phase = "kept-mismatch";
      const mismatch = decode(render(DestinationZone, { props }).body);
      expect(mismatch).toContain(keptMismatchBlock(PAGE).steps[1]);

      // STILL WRITING (W-11, SAFE-08's visible half): the line beneath the
      // row while the store's flag is set, and not otherwise.
      install.phase = "writing";
      install.action = "keep";
      install.slow = true;
      const slow = render(DestinationZone, { props }).body;
      expect(slow).toContain('data-testid="still-writing"');
      expect(decode(slow)).toContain(STILL_WRITING_LINE);
      install.slow = false;
      expect(render(DestinationZone, { props }).body).not.toContain(
        'data-testid="still-writing"',
      );

      // THE CONFIRMATION IN STORE'S PLACE: never both on the screen.
      install.phase = "ready";
      install.confirmOpen = true;
      const confirming = render(DestinationZone, { props }).body;
      expect(confirming).toContain('data-testid="store-confirm"');
      expect(confirming).not.toContain('data-testid="store-on-zona"');
      expect(confirming).toContain('role="group"');
      expect(confirming).not.toContain(DIALOG);
      install.confirmOpen = false;
    } finally {
      session.phase = before.session;
      session.identity = before.identity;
      install.phase = before.phase;
      install.action = before.action;
      install.name = before.name;
      install.snapshot = before.snapshot;
      install.snapshotPage = before.snapshotPage;
      install.applyReady = before.applyReady;
      install.armed = before.armed;
      install.slow = before.slow;
      install.confirmOpen = before.confirmOpen;
    }
  });

  it("every install sentence on screen comes from the copy modules", () => {
    // Plan 07-09; re-aimed by 13.1-06 at the two leaves that remain. Three
    // tells of a retyped install sentence - the three phrases nearly every
    // one of them carries - must appear in neither leaf's code. They may
    // appear in a header comment (the strip removes it) and they DO appear
    // in install-copy.ts, which is what makes the tells real rather than
    // arbitrary. The zone's markup authors no sentence: every line it shows
    // is a builder's or a constant's.
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
    expect(read, "the two leaves' code was read").toBeGreaterThan(3000);
    expect(
      retyped,
      "an install leaf retypes a sentence in its markup instead of importing it from install-copy",
    ).toEqual([]);
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

  it("the header's Clear: a 44px box in the connection zone, one click and no confirmation (A-45 kept by the user's word, 13.1 D-04), the reason as the caption when disabled, clearLine as the description when live, the busy label through its one leg, nothing animates", () => {
    // Plan 13.1-05, replacing plan 10-13's column test ("the CLEAR cell is
    // the measured arithmetic...") and absorbing the A-45 clause of the
    // deleted "CLEAR and KEEP ON DEVICE are shapeless alike..." - the column's
    // pair is gone, and what is worth holding is the header control the user
    // asked for: "CLEAR button. we need a CLEAR button it should live all the
    // time in the top right corner next to ZONA connected."
    //
    // RENDERED, over the real singletons. svelte/server's render() draws the
    // component with the install store and the session in a state set by
    // hand; the three reasons are reached through the store's own
    // clearReason() (install.spec.ts holds the rule), and the live state
    // through a stub on the instance, because canApply() needs a page target
    // only a session can make. Every field written is put back.
    const source = code(componentPath("Clear.svelte"));
    const button = (body: string) =>
      /<button[^>]*data-testid="clear"[^>]*>/.exec(body)?.[0] ?? "";
    const text = (body: string, testid: string) => {
      const m = new RegExp(`data-testid="${testid}"[^>]*>([^]*?)</span>`).exec(
        body,
      );
      return m ? m[1].replace(/<[^>]+>/g, "").trim() : undefined;
    };
    const decode = (t: string | undefined) =>
      t?.replace(/&#39;|&#x27;/g, "'").replace(/&#8217;|’/g, "’");
    const snapshot: ConfigStrings = {
      systemTimer: "",
      system: "",
      systemUtility: "",
      setup: "",
      timer: "",
    };
    const PAGE = 1;
    const before = {
      session: session.phase,
      phase: install.phase,
      action: install.action,
      snapshot: install.snapshot,
      snapshotPage: install.snapshotPage,
      applyReady: install.applyReady,
    };
    const seen: Record<string, string> = {};
    try {
      install.snapshotPage = PAGE;

      // THE THREE REASONS, through the store's own rule, in the record's
      // order: the caption is the reason, the description is the reason, the
      // button is disabled with a real attribute, and the label is the
      // user's word.
      const drive: Record<ClearReason, () => void> = {
        "no-snapshot": () => {
          session.phase = "connected";
          install.phase = "ready";
          install.snapshot = undefined;
          install.applyReady = true;
        },
        "no-session": () => {
          session.phase = "idle";
          install.phase = "idle";
          install.snapshot = snapshot;
          install.applyReady = false;
        },
        incapable: () => {
          session.phase = "unsupported";
          install.phase = "idle";
          install.snapshot = undefined;
          install.applyReady = false;
        },
      };
      for (const [key, reason] of Object.entries(CLEAR_REASONS) as [
        ClearReason,
        string,
      ][]) {
        drive[key]();
        install.action = undefined;
        const body = render(Clear).body;
        const tag = button(body);
        expect(tag, `${key}: the button renders`).not.toBe("");
        expect(tag, `${key}: disabled, a real attribute`).toContain("disabled");
        expect(tag, `${key}: not busy`).not.toContain("aria-busy");
        expect(tag, `${key}: described by the line`).toContain(
          'aria-describedby="clear-line"',
        );
        expect(text(body, "clear-label"), `${key}: the label`).toBe(
          CLEAR_LABEL,
        );
        expect(
          decode(text(body, "clear-caption")),
          `${key}: the caption is the reason`,
        ).toBe(reason);
        expect(
          decode(text(body, "clear-line")),
          `${key}: the description is the reason`,
        ).toBe(reason);
        expect(
          body,
          `${key}: the caption is hidden from the accessible name`,
        ).toMatch(/data-testid="clear-caption"[^>]*aria-hidden="true"/);
        expect(
          occurrences(body, 'data-testid="clear"'),
          `${key}: one control`,
        ).toBe(1);
        seen[key] = reason;
      }
      expect(Object.keys(seen).sort(), "all three reasons were driven").toEqual(
        ["incapable", "no-session", "no-snapshot"],
      );

      // LIVE: the store says no reason, the target is at rest, the session is
      // connected. The caption is EMPTY (the two-line box keeps its shape),
      // the description is clearLine with the page as the visitor reads it,
      // the button is enabled, and the label is the user's word.
      session.phase = "connected";
      install.phase = "ready";
      install.snapshot = snapshot;
      install.applyReady = true;
      install.action = undefined;
      Object.defineProperty(install, "clearReason", {
        value: () => undefined,
        configurable: true,
        writable: true,
      });
      try {
        const live = render(Clear).body;
        const tag = button(live);
        expect(tag, "live: the button renders").not.toBe("");
        expect(tag, "live: enabled").not.toContain("disabled");
        expect(text(live, "clear-label"), "live: the label").toBe(CLEAR_LABEL);
        expect(text(live, "clear-caption"), "live: no caption").toBe("");
        expect(
          decode(text(live, "clear-line")),
          "live: the description is clearLine, the page numbered from one",
        ).toBe(clearLine(PAGE));
        expect(clearLine(PAGE)).toContain("Page 2");

        // PENDING (13-12): the page target not at rest - disabled, no fourth
        // reason invented, the description still clearLine.
        install.applyReady = false;
        const pending = render(Clear).body;
        expect(button(pending), "pending: disabled").toContain("disabled");
        expect(text(pending, "clear-caption"), "pending: no caption").toBe("");
        expect(decode(text(pending, "clear-line"))).toBe(clearLine(PAGE));
      } finally {
        Reflect.deleteProperty(install, "clearReason");
      }
      expect(
        typeof install.clearReason,
        "the stub is gone and the prototype's rule is back",
      ).toBe("function");

      // BUSY, through its one leg: `writing` under the `clear` action swaps
      // the label for clearingLabel(page) and sets aria-busy; the caption is
      // empty (the last non-writing reason is held by an effect the server
      // does not run) and the control is disabled.
      session.phase = "connected";
      install.phase = "writing";
      install.action = "clear";
      install.snapshot = snapshot;
      install.applyReady = true;
      const busy = render(Clear).body;
      expect(button(busy), "busy: aria-busy").toContain('aria-busy="true"');
      expect(button(busy), "busy: disabled").toContain("disabled");
      expect(text(busy, "clear-label"), "busy: the progress label").toBe(
        clearingLabel(PAGE),
      );
      // And a write under ANOTHER action is not busy here, only disabled.
      install.action = "try";
      const other = render(Clear).body;
      expect(button(other), "another action: not busy").not.toContain(
        "aria-busy",
      );
      expect(button(other), "another action: disabled").toContain("disabled");
    } finally {
      session.phase = before.session;
      install.phase = before.phase;
      install.action = before.action;
      install.snapshot = before.snapshot;
      install.snapshotPage = before.snapshotPage;
      install.applyReady = before.applyReady;
    }

    // THE CLICK SENDS, AND IT OPENS NOTHING (A-45, kept by the user's word;
    // batch row I.6.5 declined by 13.1-CONTEXT D-04). One call, straight to
    // the store's sequencer; no confirmation is opened, none exists to open,
    // and the button is a button - not a checkbox, not a summary.
    expect(source, "the click hands the clear to the install store").toContain(
      "install.clearToDefault(",
    );
    expect(
      occurrences(source, "openConfirm"),
      "Clear opens a confirmation",
    ).toBe(0);
    expect(source, "the control is a button").toContain('type="button"');
    expect(occurrences(source, 'type="checkbox"')).toBe(0);
    expect(occurrences(source, "<summary")).toBe(0);
    const components = readdirSync(repo(UI_DIR))
      .map(String)
      .filter((name) => name.endsWith(".svelte"));
    expect(components.length, "the walk found the components").toBeGreaterThan(
      20,
    );
    expect(
      components.includes("ClearConfirm.svelte"),
      "ClearConfirm.svelte is on disk - A-45 retired the confirmation before it shipped, the user asked for a button, and Store on ZONA's is the site's only confirmation",
    ).toBe(false);
    const CONFIRM_TESTID = ["clear", "-confirm"].join("");
    const REMOVES_CAPTION = ["REMO", "VES"].join("");
    const EMPTIES = ["This empties the ", "Setup and Timer"].join("");
    const traces: string[] = [];
    for (const name of components) {
      const component = code(componentPath(name));
      for (const needle of [CONFIRM_TESTID, REMOVES_CAPTION, EMPTIES]) {
        if (component.includes(needle)) traces.push(`${name} -> ${needle}`);
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
      "a trace of the retired CLEAR confirmation is in the tree - A-45 removed it before it shipped, and this is how it would arrive by copy-paste",
    ).toEqual([]);

    // THE STRINGS ARE THE RECORD'S, NEVER RETYPED: the reasons are read from
    // CLEAR_REASONS by key, the description from clearLine, the busy label
    // from clearingLabel.
    expect(source).toContain("CLEAR_REASONS[shown]");
    expect(source).toContain("clearLine(page)");
    expect(source).toContain("clearingLabel(page)");
    for (const opening of [
      "Needs a copy of",
      "Needs your ZONA",
      "This browser can",
    ]) {
      expect(
        occurrences(source, opening),
        `Clear retypes a reason ("${opening}...") instead of reading the record`,
      ).toBe(0);
    }
    expect(source, "the disabled attribute is real").toContain("{disabled}");
    expect(occurrences(source, "{#if"), "DEGR-02: never hidden, no gate").toBe(
      0,
    );

    // THE BOX (DeviceSlot.svelte's, 13-11): 44px on both axes, the boundary
    // token as the border, no radius, no transition, no animation. The
    // hover moves the boundary to the action colour and nothing else moves.
    const control = rulesOf(source)
      .filter((r) => r.selector.includes(".control"))
      .map((r) => r.body)
      .join(" ");
    expect(control, "the box floor, block").toContain("min-block-size: 44px");
    expect(control, "the box floor, inline").toContain("min-inline-size: 44px");
    expect(control, "the boundary token").toContain(
      "border: 1px solid var(--color-boundary)",
    );
    expect(occurrences(source, "border-radius"), "no corner (D-01)").toBe(0);
    expect(
      occurrences(source, "transition"),
      "nothing transitions (Z-09)",
    ).toBe(0);
    expect(occurrences(source, "animation"), "nothing animates (Z-09)").toBe(0);
    expect(source, "the hover is the action colour on the boundary").toContain(
      "border-color: var(--color-action)",
    );
    expect(source, "the caption carries its testid").toContain(
      'data-testid="clear-caption"',
    );
    expect(source, "the line carries its testid").toContain(
      'data-testid="clear-line"',
    );
    expect(source, "the caption shows where the zone has room").toContain(
      "@container (min-width:",
    );
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
    const layout = code(LAYOUT);
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

    // Every phase renders, in one of two places since 13.1-06 (13.1-CONTEXT
    // D-06): the seven failure-shaped phases by a case of their own in the
    // destination zone's phase-to-builder mapping - the block with its
    // steps under the bar's row - and the six success phases by the bar's
    // device clause alone (their bodies retired with InstallState.svelte;
    // the captions carry the facts). `idle` has neither (nothing to say);
    // `writing` holds the last non-writing phase's block under aria-busy, as
    // InstallState held it. Nothing is unaccounted for and nothing is a
    // fall-through onto a neighbour's shape.
    const zone = code(componentPath("DestinationZone.svelte"));
    const cased = phases.filter((p) => zone.includes(`case "${p}":`));
    const FAILURE_SHAPED = [
      "unconfirmed",
      "kept-mismatch",
      "partial",
      "nothing-landed",
      "restored-unconfirmed",
      "lost",
      "snapshot-failed",
    ];
    expect(
      [...cased].sort(),
      "the seven failure-shaped phases each have a case of their own in the zone's mapping - a name missing here is a phase collapsed into a neighbour, a name added is a success phase that grew a body it should not have",
    ).toEqual([...FAILURE_SHAPED].sort());
    expect(zone).toContain("writing ? heldPhase : install.phase");
    expect(zone).toContain('aria-busy={writing ? "true" : undefined}');
    expect(zone).toContain('testid="install-failure"');
    const clauseFor = (p: InstallPhase) => deviceClause(p, 1);
    for (const p of phases) {
      if (p === "idle" || p === "writing") continue;
      const hasBody = cased.includes(p);
      expect(
        hasBody || clauseFor(p) !== undefined,
        `${p}: neither a body in the zone nor a clause in the bar`,
      ).toBe(true);
    }

    // THE FOUR THE SPEC HAS NO ROW FOR, PRESENT BY NAME. These are the safety
    // rail; a re-skin that folded one into a neighbour goes red here naming
    // it. Two are failure-shaped and keep a body in the zone; two are the
    // restore's and the reset's success and are the bar's clause, read off
    // the copy module's own caption for each.
    for (const phase of ["restored-unconfirmed", "snapshot-failed"]) {
      expect(
        cased,
        `${phase}: a phase the spec has no row for was collapsed into a neighbour`,
      ).toContain(phase);
    }
    expect(clauseFor("restored"), "restored: the bar's clause").toBe(
      restoredCaption(1),
    );
    expect(clauseFor("cleared"), "cleared: the bar's clause").toBe(
      clearedCaption(1),
    );
    expect([...UNCHARTED_PHASES].sort()).toEqual([
      "cleared",
      "restored",
      "restored-unconfirmed",
      "snapshot-failed",
    ]);

    // THE FOUR UNCERTAIN PHASES: four cases calling four DIFFERENT builders,
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
      const at = zone.indexOf(`case "${phase}":`);
      const next = zone.indexOf("case ", at + 1);
      const branch = zone.slice(at, next < 0 ? undefined : next);
      return /return ([a-zA-Z]+)\(/.exec(branch)?.[1];
    };
    const builders = uncertain.map(builderOf);
    expect(
      builders,
      "each uncertain phase renders through its own block builder in the zone",
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
      nothingLandedBlock("store", 0).title,
    ];
    expect(
      new Set(titles).size,
      "four distinct titles - two uncertain outcomes read as one sentence",
    ).toBe(4);
    const missing = uncertain.filter((p, i) => builders[i] === undefined);
    expect(missing, "an uncertain phase lost its body").toEqual([]);

    // THE BAR'S DEVICE CLAUSE: every phase but idle has one, the same words as
    // the block under the bar's row, and the four uncertain clauses differ.
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
    const zone = code(componentPath("DestinationZone.svelte"));
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

    // THE CHANGE IS THE WHOLE GESTURE. The ONE destination zone (13.1-06:
    // DestinationZone.svelte, mounted by both routes) calls the store's one
    // method from the select's change handler and never reaches for
    // requestPage on its own: the request and the send are one call, with
    // no state a route could hold a review in between. Neither route nor
    // the share control carries a select handler of its own any more.
    expect(zone, "the zone switches on change").toContain(
      "install.switchPage(value)",
    );
    expect(
      occurrences(zone, "install.requestPage("),
      "the zone opens a request of its own",
    ).toBe(0);
    expect(
      occurrences(zone, 'install.pageStatus === "requested"'),
      "the zone renders the requested state",
    ).toBe(0);
    expect(zone).toContain("onTargetChange");
    for (const [file, source] of [
      ["the workspace route", route],
      ["SurfaceActions.svelte", actions],
    ] as const) {
      expect(
        occurrences(source, "onTargetChange"),
        `${file} carries a select handler of its own beside the zone's`,
      ).toBe(0);
      expect(
        occurrences(source, "install.requestPage("),
        `${file} opens a request of its own`,
      ).toBe(0);
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
      ["DestinationZone.svelte", zone],
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
