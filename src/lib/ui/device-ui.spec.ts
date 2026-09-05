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
// copy module rather than being retyped in markup.
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
 * The seven components this phase adds. A literal list is unavoidable - the
 * directory also holds Phases 4 and 5's components, which these rules do not all
 * bind - so its length is asserted and every name is checked against the
 * directory listing in test 1. A rename, a deletion or an eighth device
 * component added without being listed is then a visible omission rather than a
 * silent gap that lets six tests pass while covering six files.
 */
const DEVICE_COMPONENTS: readonly string[] = [
  "DeviceDetails.svelte",
  "DeviceMark.svelte",
  "DeviceNote.svelte",
  "DeviceSlot.svelte",
  "FailureBlock.svelte",
  "PickerExplainer.svelte",
  "SessionAnnouncer.svelte",
];

/** The three components whose whole content is Body sentences (prose under a control). */
const SENTENCE_COMPONENTS: readonly string[] = [
  "DeviceNote.svelte",
  "FailureBlock.svelte",
  "PickerExplainer.svelte",
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

describe("the device UI's structural rules", () => {
  it("the seven are listed and on disk, and none reaches the compiler", () => {
    // The list is checked against the directory here, once, because every test
    // below reads through it.
    const present = new Set(
      readdirSync(repo(UI_DIR))
        .map(String)
        .filter((name) => name.endsWith(".svelte")),
    );
    expect(DEVICE_COMPONENTS.length, "seven components were listed").toBe(7);
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
    expect(putBack, "the cell reserves the 72px floor").toContain(
      "min-block-size: 72px",
    );
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
});
