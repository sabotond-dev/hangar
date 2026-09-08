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
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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

/** Every class named on an interactive element in a component's markup. */
function interactiveClassesOf(source: string): string[] {
  const out: string[] = [];
  for (const match of source.matchAll(/<(button|input|summary)[^>]*/g)) {
    for (const attr of match[0].matchAll(/class[ ]*=[ ]*"([^"]*)"/g)) {
      for (const name of attr[1].split(/[ ]+/)) if (name) out.push(name);
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
    // the same regression. --color-over is the alarm red, which belongs to a
    // budget meter that does not exist here (06-08 deferred item 6: no shipped
    // spec scanned these files for a hex until now). The lookahead is not
    // decoration - without it `{#each` reads as the hex #eac.
    const TOKEN = "--color-over";
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
    // Y-18: only the firmware and page numerals are monospaced; prose is never
    // monospaced. --font-mono appears in exactly one of the seven, and there
    // only on the .mono numeral run.
    const MONO = "--font-mono";
    const carriers = DEVICE_COMPONENTS.filter((name) =>
      code(componentPath(name)).includes(MONO),
    );
    expect(
      carriers,
      "--font-mono is declared in exactly one device component",
    ).toEqual(["DeviceSlot.svelte"]);

    const slot = code(componentPath("DeviceSlot.svelte"));
    const monoSelectors = rulesOf(slot)
      .filter((r) => r.body.includes(MONO))
      .map((r) => r.selector);
    expect(
      monoSelectors.length,
      "the mono-bearing rule was found",
    ).toBeGreaterThan(0);
    expect(
      monoSelectors,
      "--font-mono is declared on a selector other than .mono - it has reached a word rather than a numeral",
    ).toEqual(monoSelectors.map(() => ".mono"));

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
    ).not.toContain("No ZONA is connected.");

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
    // inactive ones hidden - in a cell with the 72px floor (Z-18).
    const putBack = code(componentPath("PutBack.svelte"));
    for (const line of [
      "PUT_BACK_LINE",
      "PUT_BACK_LINE_AFTER_KEEP",
      "PUT_BACK_NEEDS_ZONA",
    ]) {
      expect(
        occurrences(putBack, `{${line}}`),
        `PutBack renders ${line} in its cell`,
      ).toBe(1);
    }
    expect(putBack, "the inactive twins are visibility: hidden").toContain(
      "visibility: hidden",
    );
    expect(
      putBack,
      "the PUT BACK cell no longer reserves 72px - ceil(101 / 43) x 24 = 72, where 101 is PUT_BACK_LINE_AFTER_KEEP and 43 is the CH_PER_LINE plan 10-01 measured in Inter. The line changes after a keep, so a cell that grows moves a destructive control under a hand already reaching for it (Z-18)",
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
      ["power ", "cycle"].join(""),
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
      "the KEEP cell no longer reserves 48px - ceil(82 / 43) x 24 = 48, where 82 is KEEP_LINE_ENABLED, the longest of its seven, and 43 is the CH_PER_LINE plan 10-01 measured in Inter. This line changes when a knob moves (Z-18)",
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
      "Available after",
      "Try it on again",
      "Not after a",
      "Kept on your",
      "This browser cannot",
    ]) {
      expect(
        occurrences(keep, opening),
        `KeepOnDevice retypes a reason ("${opening}...") instead of iterating the record`,
      ).toBe(0);
    }
    expect(keep, "the enabled line is rendered once").toContain(
      "{KEEP_LINE_ENABLED}",
    );
    expect(keep, "the cell carries its testid").toContain(
      'data-testid="keep-on-device-line"',
    );

    // ONE COLUMN, PUT BACK FIRST. The row's rule declares the column, and the
    // panel mounts PutBack before KeepOnDevice in DOM order.
    const panel = code(componentPath("ChosenPanel.svelte"));
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

    // ESCAPE'S TWO RULES, IN ORDER, ON THE HANDLER ALONE. The handler is
    // sliced from its key test to the next un-choose, because the file's
    // first pushState is choose()'s and comes BEFORE the handler - a
    // whole-file "confirmOpen before pushState" would be red on correct code.
    const coverflow = code(componentPath("Coverflow.svelte"));
    const keyTest = 'event.key !== "Escape"';
    const from = coverflow.indexOf(keyTest);
    expect(from, "the Escape handler was found").toBeGreaterThan(-1);
    const to = coverflow.indexOf("unchoose()", from);
    expect(to, "the handler still un-chooses").toBeGreaterThan(from);
    const handler = coverflow.slice(from, to);
    const writingAt = handler.indexOf('install.phase === "writing"');
    const confirmGuardAt = handler.indexOf("install.confirmOpen");
    expect(
      writingAt,
      "Escape is ignored while the store is writing (Z-10)",
    ).toBeGreaterThan(-1);
    expect(
      confirmGuardAt,
      "Escape closes the confirmation before it un-chooses (Z-10)",
    ).toBeGreaterThan(writingAt);
    expect(
      occurrences(handler, "pushState"),
      "the Escape handler pushes no history entry",
    ).toBe(0);
    // Non-vacuity for the slice: the file DOES push state, before the handler,
    // which is why the whole-file ordering check would be wrong.
    expect(
      coverflow.indexOf("pushState("),
      "choose()'s pushState precedes the Escape handler - if it does not, the slice above is no longer load-bearing",
    ).toBeLessThan(from);
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
      "the CLEAR cell no longer reserves 48px - the longest of its four candidates is 43 and the formula gives 24px, but the second line is HEADROOM rather than occupancy (A-52), so CLEAR_CAP stays 86 and this cell stays two Body lines",
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
      "{CLEAR_LINE}",
    );
    expect(
      /CLEAR_REASONS[)][^;]*;[^]*[{]#each[ ]+REASONS/.test(clear),
      "the three reasons are iterated from CLEAR_REASONS rather than listed",
    ).toBe(true);
    for (const opening of [
      "Needs a copy of",
      "Needs your ZONA",
      "This browser cannot",
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
    expect(clear, "the busy label is install-copy's CLEARING_LABEL").toContain(
      "CLEARING_LABEL",
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
        if (property === "letter-spacing") {
          trackingFound += 1;
          if (value !== "0.18em")
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
      "a Quiet-tier control has gained a border, a background, a radius, inline padding or a tracking other than Micro's 0.18em - A-41 forbids pilling Quiet and A-46 put CLEAR in it beside KEEP ON DEVICE",
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
});
