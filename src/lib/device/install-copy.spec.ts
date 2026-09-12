// The install flow's copy contract, made executable: six gates.
//
// THE CONTRACT CHANGED HANDS AT 13-18. Through Phase 12 it was 07-UI-SPEC's
// Copywriting Contract and 10-UI-SPEC's amendments, and test 2 read both from
// disk. Since 13-CONTEXT D-05 (the register is the Bible's) and D-23 (the
// batch approved as proposed, 2026-09-12) the documents that author every
// string in install-copy.ts are three, and test 2 reads all three from disk:
//
//  - the design specification (bible/HANGAR-ZONA-GUI-design-specification.md),
//    whose section 9 state table and section 16 copy table give the lines
//    taken verbatim;
//  - 13-18-BATCH.md, the table of every string neither document wrote, each
//    with the state it names, the fact it must carry and the proposal; and
//  - 13-CONTEXT.md's D-23, the user's one-word answer that made the proposals
//    the words.
//
// Every string the module can produce, with a builder's sample arguments
// folded back into the batch's placeholders, must appear in the specification
// or in the batch. A string that appears in neither was invented after the
// review and is red here by name.
//
// THE HONESTY CAPS ARE RETIRED BY NAME (test 3). HONESTY_CAP, PUT_BACK_CAP,
// KEEP_CAP and CLEAR_CAP were measured maximum lengths per string - lines x
// the 43 characters plan 10-01 measured as a Body line box's minimum
// occupancy in Phase 10's 372px install column - held here so a caption could
// not outgrow the cell reserved for it and so a cap was a promise about
// strings not yet written. D-05 changed the register (the Bible's lines are
// verbatim and several are longer than 86) and the layout the caps were
// measured against is being replaced by the Bible's proportional regions
// (13-11, 13-12, 13-20), so a cap measured against it caps nothing. Test 3
// now asserts the ABSENCE of the four, that the module's header retires them
// by name with the date, and every rule that travelled with them and did not
// retire: Z-08's one "about a second", A-48's three stems, the label rules,
// SAFE-01's WRITE_CLICKS, and the page numbering.
//
// Two habits from the house, both load-bearing here:
//
// - NON-VACUITY FIRST. Every scan proves it read something before it asserts
//   what it did not find (src/lib/ui/identity.spec.ts).
// - NEEDLES ASSEMBLED FROM FRAGMENTS, so this file's own source does not
//   contain the strings it forbids and cannot fail itself
//   (src/lib/protocol/forbidden-instructions.spec.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as copy from "./install-copy";
import {
  CLEAR_LABEL,
  CLEAR_REASONS,
  HONESTY_NO_SESSION,
  IDENTIFIED_CAPTION,
  KEEP_LABEL,
  KEEP_REASONS,
  LIVE_STILL_WRITING,
  PUT_BACK_LABEL,
  PUT_BACK_NEEDS_ZONA,
  TARGET_CLICK,
  TRY_ON_LABEL,
  WRITE_CLICKS,
  announceTitle,
  clearLine,
  clearedBody,
  clearedCaption,
  clearingLabel,
  confirmRig,
  honestyReady,
  keptCaption,
  keptMismatchBlock,
  liveCleared,
  liveKept,
  liveRestored,
  liveSettled,
  liveSnapshotSaved,
  lostBlock,
  moduleList,
  nothingLandedBlock,
  pageName,
  partialBlock,
  restoredUnconfirmedBlock,
  settledCaption,
  snapshotFailedBlock,
  unconfirmedBlock,
  type ClearReason,
  type FailedWords,
  type InstallBlock,
  type KeepReason,
  type LandedWords,
} from "./install-copy";
// The twin's other half, read from the module that renders it (13.1-02).
import { TARGET_LABEL } from "./page-target";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const installCopySource = () => read("./install-copy.ts");

/**
 * The three documents that author the words, read from disk: src/lib/device/
 * is three levels below the root. Each is checked for length and for a
 * heading before it is searched, because a containment check over a document
 * that failed to load is a gate that passes everything.
 */
const DOCUMENTS: readonly { path: string; heading: string; atLeast: number }[] =
  [
    {
      path: "../../../.planning/phases/13-gui-overhaul/bible/HANGAR-ZONA-GUI-design-specification.md",
      heading: "## 16. Copy examples",
      atLeast: 30_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-18-BATCH.md",
      heading: "## I. The device band",
      atLeast: 60_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-CONTEXT.md",
      heading: "## D-23 [user] The copy batch approved as proposed",
      atLeast: 20_000,
    },
  ];

const documents = () => DOCUMENTS.map(({ path }) => read(path));

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const strip = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/** Assembled, never written: the engine name that appears in no string and no comment. */
const ENGINE = ["Chrom", "ium"].join("");
/** Assembled: the three words that may never be a control label. */
const WIRE_WORDS = [
  ["fl", "ash"].join(""),
  ["bu", "rn"].join(""),
  ["inst", "all"].join(""),
];
/**
 * Assembled: Phase 10's register, which no string may carry any more - its
 * four uppercase labels and the verbs its prose paraphrased them with. A
 * sentence that says "try it on" when the button says `Apply to ZONA` is the
 * paraphrase D-05 forbids.
 */
const RETIRED_LABELS = [
  ["TRY ON ", "DEVICE"].join(""),
  ["KEEP ON ", "DEVICE"].join(""),
  ["PUT ", "BACK"].join(""),
  ["NOT ", "NOW"].join(""),
];
/** Assembled, matched without case: the verbs Phase 10's prose paraphrased its labels with. */
const RETIRED_VERBS = [
  ["try", "-on"].join(""),
  ["try it ", "on"].join(""),
  ["keep it ", "again"].join(""),
  ["power ", "cycle"].join(""),
];
/** Assembled: the four retired caps, by name, which the module must not export and must retire in words. */
const RETIRED_CAPS = ["HONESTY", "PUT_BACK", "KEEP", "CLEAR"].map(
  (stem) => `${stem}_CAP`,
);
/** Assembled: the destination review's two labels (13-12), retired by 13.1-02 under D-05 - not exported, named in the header. */
const RETIRED_REVIEW_LABELS = ["SWITCH_PAGE", "KEEP_PAGE"].map(
  (stem) => `${stem}_LABEL`,
);

const FW = { major: 1, minor: 5, patch: 5 };
/** The catalog's title-case name (D-14 Q11b), as the batch's samples read. */
const NAME = "Arc";
/** The wire page every sample is built on: 1, which the visitor reads as Page 2 - the batch's own sample. */
const PAGE = 1;
/** The header's connect control - the OTHER surface, so no step can be a literal that matches the panel. */
const HEADER_LABEL = "Connect ZONA";

/**
 * One sample input per exported function, so every builder's OUTPUT goes
 * through the rules rather than only the constants. A function with no entry
 * here fails test 4 by name, so a sentence added later cannot quietly escape.
 */
const SAMPLES: Readonly<Record<string, readonly unknown[]>> = {
  pageName: [PAGE],
  writingLabel: [PAGE],
  keepingLabel: [PAGE],
  puttingBackLabel: [PAGE],
  clearingLabel: [PAGE],
  honestyReady: [PAGE],
  snapshottingBody: [PAGE],
  identifiedBody: [FW, PAGE],
  settledCaption: [PAGE],
  settledBody: [NAME, PAGE],
  restoredCaption: [PAGE],
  restoredBody: [PAGE],
  keptCaption: [PAGE],
  keptBody: [NAME, PAGE],
  clearedCaption: [PAGE],
  clearedBody: [PAGE],
  keptMismatchBlock: [PAGE],
  unconfirmedBlock: [NAME, PAGE],
  restoredUnconfirmedBlock: [PAGE],
  nothingLandedBlock: ["try", PAGE],
  partialBlock: [
    "The system timer, the page init, the utility script and the Timer",
    "the Setup",
    PAGE,
  ],
  lostBlock: [false, HEADER_LABEL, PAGE],
  snapshotFailedBlock: [PAGE],
  confirmCaption: [PAGE],
  confirmReplaces: [PAGE],
  moduleList: [["EN16", "BU16", "PO16"]],
  confirmRig: [["EN16"]],
  keepLineEnabled: [PAGE],
  clearLine: [PAGE],
  liveSnapshotSaved: [PAGE],
  liveSettled: [PAGE],
  liveRestored: [PAGE],
  liveKept: [PAGE],
  liveCleared: [PAGE],
  announceTitle: ["Nothing reached your ZONA"],
};

/**
 * The OTHER branch of every two-form builder, so test 2 matches both forms of
 * each against the documents and not only the sampled one.
 */
const OTHER_BRANCHES: readonly [string, unknown][] = [
  ["nothingLandedBlock(put-back)", nothingLandedBlock("put-back", PAGE)],
  ["lostBlock(store leg)", lostBlock(true, TRY_ON_LABEL, PAGE)],
  ["confirmRig(several)", confirmRig(["EN16", "PBF4"])],
  [
    "partialBlock(utility only)",
    partialBlock(
      "The system timer, the page init and the utility script",
      "the Timer and the Setup",
      PAGE,
    ),
  ],
  [
    "partialBlock(page init only)",
    partialBlock(
      "The system timer and the page init",
      "the utility script, the Timer and the Setup",
      PAGE,
    ),
  ],
  [
    "partialBlock(system timer only)",
    partialBlock(
      "The system timer",
      "the page init, the utility script, the Timer and the Setup",
      PAGE,
    ),
  ],
];

/**
 * The sample values folded back into the batch's placeholders, in order. The
 * batch writes `{landed}` / `{failed}` for the partial's two lists and
 * `{label}` for the interpolated control; its page, name, firmware and module
 * samples are the ones above, so those fold to themselves.
 */
const PLACEHOLDERS: readonly [string, string][] = [
  [
    "The system timer, the page init, the utility script and the Timer reached your ZONA and the Setup",
    "{landed} reached your ZONA and {failed}",
  ],
  [
    "The system timer, the page init and the utility script reached your ZONA and the Timer and the Setup",
    "{landed} reached your ZONA and {failed}",
  ],
  [
    "The system timer and the page init reached your ZONA and the utility script, the Timer and the Setup",
    "{landed} reached your ZONA and {failed}",
  ],
  [
    "The system timer reached your ZONA and the page init, the utility script, the Timer and the Setup",
    "{landed} reached your ZONA and {failed}",
  ],
  [`Click ${HEADER_LABEL} again`, "Click {label} again"],
  [`Click ${TRY_ON_LABEL} again`, "Click {label} again"],
];

const templated = (text: string) =>
  PLACEHOLDERS.reduce((t, [from, to]) => t.split(from).join(to), text);

/** Walk a value into named strings: arrays by index, blocks by key. */
const walk = (
  name: string,
  value: unknown,
  out: { name: string; text: string }[],
) => {
  if (typeof value === "string") {
    out.push({ name, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => walk(`${name}[${i}]`, item, out));
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      walk(`${name}.${key}`, item, out);
    }
  }
};

/**
 * Every string the module can produce, named, by WALKING ITS OWN EXPORTS - so
 * a string added later is covered on the day it is added.
 */
const everyString = () => {
  const out: { name: string; text: string }[] = [];
  for (const [name, value] of Object.entries(copy)) {
    if (typeof value === "function") {
      const args = SAMPLES[name];
      expect(args, `no sample input is declared for ${name}`).toBeDefined();
      const build = value as (...a: readonly unknown[]) => unknown;
      walk(name, build(...args), out);
    } else {
      walk(name, value, out);
    }
  }
  for (const [name, value] of OTHER_BRANCHES) walk(name, value, out);
  return out;
};

/** The seven failure builders at their samples, named. */
const failureBlocks = (): readonly [string, InstallBlock][] => [
  ["keptMismatchBlock", keptMismatchBlock(PAGE)],
  ["unconfirmedBlock", unconfirmedBlock(NAME, PAGE)],
  ["restoredUnconfirmedBlock", restoredUnconfirmedBlock(PAGE)],
  ["nothingLandedBlock", nothingLandedBlock("try", PAGE)],
  [
    "partialBlock",
    partialBlock(
      "The system timer, the page init, the utility script and the Timer",
      "the Setup",
      PAGE,
    ),
  ],
  ["lostBlock", lostBlock(false, HEADER_LABEL, PAGE)],
  ["snapshotFailedBlock", snapshotFailedBlock(PAGE)],
];

/**
 * THE FIVE NAMES IN WRITE ORDER (12.1-08; 13-17). Each reachable partial, as
 * the ONE writer produces it: the landed prefix of sequence.ts's SLOTS on the
 * left, the rest on the right. Read left to right, every row names the five
 * slots in the order they go on the wire - 255/6, 255/0, 255/4, 0/6, 0/0 -
 * and no row skips one. Held as literals here, not read off SLOTS, because
 * this module may import nothing (test 1) and the pairings are what the
 * closed unions encode.
 */
const SLOT_NAMES_IN_WRITE_ORDER = [
  "system timer",
  "page init",
  "utility script",
  "Timer",
  "Setup",
] as const;
const PARTIALS_IN_WRITE_ORDER: readonly [LandedWords, FailedWords][] = [
  [
    "The system timer",
    "the page init, the utility script, the Timer and the Setup",
  ],
  [
    "The system timer and the page init",
    "the utility script, the Timer and the Setup",
  ],
  [
    "The system timer, the page init and the utility script",
    "the Timer and the Setup",
  ],
  [
    "The system timer, the page init, the utility script and the Timer",
    "the Setup",
  ],
];

describe("the install flow's copy contract (the Bible, the batch, D-23)", () => {
  it("imports nothing at all, so any first-paint component may name it", () => {
    const raw = installCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);

    const source = strip(raw);
    expect(
      source.length,
      "the stripped source is still the module and not only its comments",
    ).toBeGreaterThan(4000);
    expect(source, "the stripper ate the code").toContain(
      "export const HONESTY_NO_SESSION",
    );

    expect(source.includes('from "'), "install-copy.ts imports").toBe(false);
    expect(source.includes("from '"), "install-copy.ts imports").toBe(false);
    expect(
      source.includes("import("),
      "install-copy.ts imports dynamically",
    ).toBe(false);
    expect(source.includes("import "), "install-copy.ts imports").toBe(false);
    expect(source.includes("require("), "install-copy.ts requires").toBe(false);
  });

  it("holds every string against the documents that authored it: the Bible verbatim, the batch as approved", () => {
    const docs = documents();
    docs.forEach((doc, i) => {
      expect(
        doc.length,
        `${DOCUMENTS[i].path} was actually read`,
      ).toBeGreaterThan(DOCUMENTS[i].atLeast);
      expect(
        doc,
        `${DOCUMENTS[i].path} is not the document it claims to be`,
      ).toContain(DOCUMENTS[i].heading);
    });
    const [bible, batch, context] = docs;
    // D-23 is the answer, and it is the one word the plan asked for.
    const d23 = context.slice(context.indexOf(DOCUMENTS[2].heading));
    expect(d23, "D-23 records the answer").toContain('> *"approve"*');
    expect(d23, "D-23 keeps the six transfer lines six").toContain(
      "six transfer\nlines stay six",
    );

    // THE SIX SECTION-16 LINES THIS MODULE TAKES VERBATIM, and section 9's
    // labels: each is in the Bible character for character, and the module
    // produces it character for character. The Bible writes curly quotes
    // around its rows; the string inside them is what is matched.
    const verbatim: readonly [string, string][] = [
      [
        "settledCaption",
        "Applied to Page 2. Store on ZONA to keep it after power-off.",
      ],
      ["keptCaption", "Stored on ZONA · Page 2"],
      ["TRY_ON_LABEL", "Apply to ZONA"],
      ["KEEP_LABEL", "Store on ZONA"],
      ["CLEAR_LABEL", "Reset active device page"],
      ["IDENTIFIED_CAPTION", "ZONA connected"],
      ["writingLabel", "Applying to Page 2…"],
      ["keepingLabel", "Storing on Page 2…"],
    ];
    const produced = new Map(
      everyString().map(({ name, text }) => [name, text]),
    );
    for (const [name, line] of verbatim) {
      expect(produced.get(name), `${name} is the Bible's line, verbatim`).toBe(
        line,
      );
    }
    // And the Bible really gives each: section 9 writes the progress labels
    // and the stored row with `N`, section 16 writes its rows with `2`.
    for (const line of [
      "Applied to Page 2. Store on ZONA to keep it after power-off.",
      "Stored on ZONA · Page 2",
      "Stored on ZONA · Page N",
      "Applying to Page N…",
      "Storing on Page N…",
      "| Ready | ZONA connected | Apply to ZONA |",
      "| Applied temporarily | On device · not stored | Store on ZONA |",
      "**Reset active device page** lives under Device actions",
    ]) {
      expect(bible, `the Bible gives ${line}`).toContain(line);
    }

    // EVERY OTHER STRING IS IN THE BATCH, as proposed and as approved. The
    // formatter moduleList is grammar, not copy, and is excused by name; the
    // page name is a two-word form the batch writes in every row.
    const excused = new Set(["moduleList", "pageName", "announceTitle"]);
    const strings = everyString().filter(
      ({ name }) => !excused.has(name.split(/[.[(]/)[0]),
    );
    expect(
      strings.length,
      "enough strings were found to be checking anything",
    ).toBeGreaterThan(70);
    const misses = strings
      .filter(
        ({ text }) => !batch.includes(templated(text)) && !bible.includes(text),
      )
      .map(({ name, text }) => `${name}: ${templated(text)}`);
    expect(misses, "strings neither the Bible nor the batch carries").toEqual(
      [],
    );

    // The two-form builders' other branches were walked too, so both forms
    // of each are held - not only the sampled one.
    expect(strings.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "nothingLandedBlock(put-back).detail",
        "lostBlock(store leg).detail",
        "confirmRig(several)",
        "partialBlock(utility only).detail",
        "partialBlock(page init only).detail",
        "partialBlock(system timer only).detail",
      ]),
    );

    // THE FIVE NAMES IN WRITE ORDER (12.1-08; 13-17): every reachable partial
    // names all five slots, each landed name before each failed one, and the
    // five in the order the writer puts them on the wire. A row that skips a
    // slot or names one out of order is red here by that slot's name. Matched
    // case-sensitively on purpose: the three system names are lower-case
    // phrases and the two touch names are the capitalised event words, so
    // "system timer" cannot stand in for "Timer" or vice versa.
    for (const [landed, failed] of PARTIALS_IN_WRITE_ORDER) {
      const sentence = `${landed} reached your ZONA and ${failed} didn’t`;
      expect(
        partialBlock(landed, failed, PAGE).detail.startsWith(sentence),
      ).toBe(true);
      let cursor = -1;
      for (const slot of SLOT_NAMES_IN_WRITE_ORDER) {
        const at = sentence.indexOf(slot, cursor + 1);
        expect(
          at,
          `${sentence}: ${slot} is missing or out of write order`,
        ).toBeGreaterThan(cursor);
        cursor = at;
      }
      const landedNames = SLOT_NAMES_IN_WRITE_ORDER.filter((slot) =>
        landed.includes(slot),
      );
      const failedNames = SLOT_NAMES_IN_WRITE_ORDER.filter((slot) =>
        failed.includes(slot),
      );
      expect(
        [...landedNames, ...failedNames],
        `${sentence}: the landed prefix and the rest do not partition the five`,
      ).toEqual([...SLOT_NAMES_IN_WRITE_ORDER]);
      expect(partialBlock(landed, failed, PAGE).steps[0]).toBe(
        `Click ${TRY_ON_LABEL} to send all five again`,
      );
    }
    // THE FIFTH FACT, in the confirmation and the two snapshot bodies: a
    // store carries the page's own three scripts beside the touch pair.
    for (const name of [
      "confirmReplaces",
      "snapshottingBody",
      "identifiedBody",
    ]) {
      expect(
        produced.get(name),
        `${name} names the page's three scripts`,
      ).toContain("init, timer and utility scripts");
      expect(produced.get(name), `${name} names the touch pair`).toContain(
        "Setup and Timer",
      );
    }
  });

  it("the honesty caps are retired by name, and every rule that travelled with them and stayed still holds", () => {
    // THE FOUR CAPS ARE GONE, NOT LEFT AT A VALUE NOTHING CHECKS. Each name is
    // absent from the exports and present in the header's retirement, which
    // has to say what they were, what superseded them and when.
    const exported = new Set(Object.keys(copy));
    const raw = installCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    for (const cap of RETIRED_CAPS) {
      expect(exported.has(cap), `${cap} is still exported`).toBe(false);
      expect(raw.includes(cap), `${cap} is retired without being named`).toBe(
        true,
      );
    }
    expect(raw).toContain("THE HONESTY CAPS ARE RETIRED BY NAME, 2026-09-12");
    expect(raw).toContain("CH_PER_LINE the 43");
    expect(raw).toContain("D-05 changed the register");
    for (const value of ["86", "129"]) {
      expect(raw, `the retirement records the number ${value}`).toContain(
        value,
      );
    }

    // PAGES ARE NUMBERED FROM ONE (D-23, batch row I.3.1): wire 0 is Page 1,
    // and the offset lives in pageName alone - every builder that names a
    // page goes through it, so the sample wire page reads as Page 2 in each.
    expect(pageName(0)).toBe("Page 1");
    expect(pageName(3)).toBe("Page 4");
    expect(settledCaption(0)).toContain("Page 1");
    expect(keptCaption(PAGE)).toBe("Stored on ZONA · Page 2");
    const source = strip(raw);
    const offsets = source.split("page + 1").length - 1;
    expect(offsets, "the offset is applied in exactly one place").toBe(1);
    const numbered = everyString().filter(({ text }) => /Page \d/.test(text));
    expect(numbered.length, "the page-naming strings").toBeGreaterThan(20);
    for (const { name, text } of numbered) {
      expect(
        text,
        `${name} names the wire page rather than the visitor's`,
      ).not.toMatch(/Page (?:0|1|3)\b/);
    }

    // Z-08, ASSERTED RATHER THAN COMMENTED. "about a second" is the site's one
    // promise about how long a write takes, and it belongs to the two honesty
    // strings a visitor reads BEFORE clicking - and nowhere else. Over the
    // module first, then over the whole of src/, because a second promise
    // would most naturally be written somewhere else. .spec.ts files are
    // excluded and that is not a loophole: a copy gate has to quote the
    // sentence it pins. src/routes/dev/type/+page.svelte is an EXPECTED row,
    // not an offender: it is the unlinked type probe plan 10-01 measured
    // CH_PER_LINE on, and its copy of the sentence is a measurement sample.
    const occurrences = source.toLowerCase().split("about a second").length - 1;
    expect(occurrences, "Z-08: 'about a second' twice in the module").toBe(2);
    expect(HONESTY_NO_SESSION.toLowerCase()).toContain("about a second");
    expect(honestyReady(PAGE).toLowerCase()).toContain("about a second");
    const speed = everyString()
      .filter(({ text }) => /about a second/i.test(text))
      .map(({ name }) => name);
    expect(speed, "about a second appears only in the honesty slot").toEqual([
      "HONESTY_NO_SESSION",
      "honestyReady",
    ]);
    const SRC = fileURLToPath(new URL("../..", import.meta.url));
    const counted: Record<string, number> = {};
    for (const entry of readdirSync(SRC, { recursive: true })) {
      const rel = String(entry).split("\\").join("/");
      if (!/[.](ts|svelte)$/.test(rel) || rel.endsWith(".spec.ts")) continue;
      const body = strip(readFileSync(`${SRC}${rel}`, "utf8")).toLowerCase();
      const n = body.split("about a second").length - 1;
      if (n > 0) counted[rel] = n;
    }
    expect(
      Object.keys(counted).length,
      "the walk read nothing - it is not finding the honesty strings it is meant to be counting",
    ).toBeGreaterThan(0);
    expect(
      counted,
      "Z-08: 'about a second' is somewhere it does not belong, or has left somewhere it does",
    ).toEqual({
      "lib/device/install-copy.ts": 2,
      "routes/dev/type/+page.svelte": 1,
    });

    // THE THREE STEMS (A-48), over every string in and around the reset
    // control. The control restores the firmware's own configuration, so
    // nothing beside its label may imply emptiness - that would be the same
    // class of lie as the never-writes sentence Phase 7 retired.
    const STEMS = [
      ["clear", "s"].join(""),
      ["empt", "y"].join("").slice(0, 4),
      ["remov", "e"].join(""),
    ];
    const clearStrings: readonly [string, string][] = [
      ["CLEAR_LABEL", CLEAR_LABEL],
      ["clearingLabel", clearingLabel(PAGE)],
      ["clearLine", clearLine(PAGE)],
      ...(Object.entries(CLEAR_REASONS) as [string, string][]),
      ["clearedCaption", clearedCaption(PAGE)],
      ["clearedBody", clearedBody(PAGE)],
      ["liveCleared", liveCleared(PAGE)],
    ];
    expect(clearStrings.length, "the scan has strings to scan").toBe(9);
    for (const [name, text] of clearStrings) {
      for (const stem of STEMS) {
        expect(
          text.toLowerCase().includes(stem),
          `${name} says "${stem}" of a control that RESTORES the firmware's own configuration (A-48)`,
        ).toBe(false);
      }
    }
    // And the reset's own strings say what the control does: the firmware
    // default, by name, in the line, the caption, the body and the utterance.
    for (const [name, text] of clearStrings
      .slice(2, 3)
      .concat(clearStrings.slice(6))) {
      expect(text, `${name} names the firmware default`).toMatch(
        /firmware(’s own)? default/,
      );
    }

    // THE LABEL RULES. Every label - the constants ending in _LABEL and the
    // four progress builders - is sentence case (D-05: never a shouted
    // control), and none says what the wire does.
    const labels: [string, string][] = [
      ...(Object.entries(copy) as [string, unknown][]).filter(
        (entry): entry is [string, string] =>
          entry[0].endsWith("_LABEL") && typeof entry[1] === "string",
      ),
      ...(Object.entries(copy) as [string, unknown][])
        .filter(
          (entry): entry is [string, (page: number) => string] =>
            entry[0].endsWith("Label") && typeof entry[1] === "function",
        )
        .map(([name, build]) => [name, build(PAGE)] as [string, string]),
    ];
    expect(labels.length, "five constants and four progress labels").toBe(9);
    for (const [name, label] of labels) {
      expect(label, `${name} shouts`).not.toBe(label.toUpperCase());
      expect(label[0], `${name} is sentence case`).toBe(label[0].toUpperCase());
      for (const word of WIRE_WORDS) {
        expect(label.toLowerCase().includes(word), `${name} says ${word}`).toBe(
          false,
        );
      }
    }

    // SAFE-01's number, as a constant rather than as a word in prose. The
    // equality FIRST, so a WRITE_CLICKS that has drifted names the label it
    // lost rather than failing on an arithmetic. THE FIFTH IS THE TARGET
    // SELECT'S CHANGE (13.1-02, D-05): TARGET_CLICK is page-target.ts's
    // TARGET_LABEL carried twice because neither module imports the other -
    // the twin is pinned by reading the other module, as the three pageName
    // twins are - and the review's two labels are gone from the exports and
    // retired in the header by name, with the date and the decision.
    expect([...WRITE_CLICKS], "a write click is not a control label").toEqual([
      TRY_ON_LABEL,
      PUT_BACK_LABEL,
      KEEP_LABEL,
      CLEAR_LABEL,
      TARGET_CLICK,
    ]);
    expect(WRITE_CLICKS.length, "five write clicks").toBe(5);
    expect(new Set(WRITE_CLICKS).size, "five distinct").toBe(5);
    expect(TARGET_CLICK).toBe("Target");
    expect(TARGET_CLICK, "the twin of page-target.ts's TARGET_LABEL").toBe(
      TARGET_LABEL,
    );
    for (const retired of RETIRED_REVIEW_LABELS) {
      expect(
        Object.keys(copy).includes(retired),
        `${retired} is still exported`,
      ).toBe(false);
      expect(
        installCopySource().includes(retired),
        `${retired} is retired without being named`,
      ).toBe(true);
    }
    expect(installCopySource()).toContain(
      "THE REVIEW'S TWO LABELS ARE RETIRED BY NAME, 2026-09-12",
    );

    // NO STRING NAMES A CONTROL THAT IS NOT ON THE SCREEN. The reset's body
    // names Put back and nothing else among the write clicks - the machine's
    // half, that Put back is ENABLED in `cleared`, is asserted in
    // install.spec.ts's phase table.
    expect(
      WRITE_CLICKS.filter((label) => clearedBody(PAGE).includes(label)),
      "the reset body names a control other than Put back, or none at all",
    ).toEqual([PUT_BACK_LABEL]);
  });

  it("obeys the register mechanically, over every export and every builder's sample: the punctuation, the case, the engine, the paraphrase", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the export walk found the module's strings",
    ).toBeGreaterThan(70);

    const APOSTROPHE = String.fromCharCode(39);
    const emoji = /\p{Extended_Pictographic}/u;
    /** Uppercase runs of two or more letters: only the two names may shout inside a sentence; the module-type samples (EN16, PBF4) are the rig's names. */
    const ACRONYMS = new Set(["ZONA", "HANGAR", "EN", "BU", "PO", "PBF"]);

    for (const { name, text } of strings) {
      expect(text, `${name} is empty`).not.toBe("");
      expect(emoji.test(text), `${name} has an emoji`).toBe(false);
      expect(text.includes("!"), `${name} shouts`).toBe(false);
      expect(text.includes(APOSTROPHE), `${name} has a typewriter quote`).toBe(
        false,
      );
      expect(text.includes("..."), `${name} has three full stops`).toBe(false);
      expect(text.includes(" -- "), `${name} has a hyphen for a dash`).toBe(
        false,
      );
      expect(text, `${name} says Error`).not.toMatch(/error/i);
      expect(text, `${name} says loading`).not.toMatch(/loading/i);
      expect(text.includes(ENGINE), `${name} names an engine`).toBe(false);
      // NO UPPERCASE PARAGRAPHS (D-05): a run of capitals is a name, never a
      // shouted word, and the module has exactly two names.
      for (const run of text.match(/[A-Z]{2,}/g) ?? []) {
        expect(ACRONYMS.has(run), `${name} shouts "${run}"`).toBe(true);
      }
      // NO RETIRED REGISTER: Phase 10's labels and the verbs that paraphrased
      // them are gone from every string, prose included.
      for (const word of RETIRED_LABELS) {
        expect(
          text.includes(word),
          `${name} carries Phase 10's "${word}"`,
        ).toBe(false);
      }
      for (const word of RETIRED_VERBS) {
        expect(
          text.toLowerCase().includes(word),
          `${name} paraphrases a control with "${word}"`,
        ).toBe(false);
      }
    }

    // THE REAL PUNCTUATION IS PRESENT - a POSITIVE test since D-05, because the
    // Bible writes `you’re` and the register is contractions with real
    // apostrophes, not the absence of typewriter ones. At least eight
    // contractions across the module, a real ellipsis and a real em dash.
    const all = strings.map((s) => s.text).join(" ");
    const contractions = all.match(/[a-z]’(?:t|s|ll|re|ve)\b/g) ?? [];
    expect(
      contractions.length,
      "real apostrophes in real contractions",
    ).toBeGreaterThanOrEqual(8);
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2014)), "a real em dash").toBe(
      true,
    );

    // NO CONTROL LABEL PARAPHRASED IN PROSE, as the narrower thing that can be
    // asserted: every sentence that tells the visitor to click something
    // names a control exactly as the control reads - one of the five write
    // clicks, or the label the surface handed in. A step that said "press the
    // apply button" would be red here by its own words.
    const allowed = new Set<string>([
      ...WRITE_CLICKS,
      HEADER_LABEL,
      TRY_ON_LABEL,
    ]);
    const click = /[Cc]lick /g;
    let named = 0;
    for (const { name, text } of strings) {
      for (const match of text.matchAll(click)) {
        named += 1;
        const rest = text.slice((match.index ?? 0) + match[0].length);
        expect(
          [...allowed].some((label) => rest.startsWith(label)),
          `${name} tells the visitor to click "${rest.split(/[,.]/)[0]}", which is not a control as it reads`,
        ).toBe(true);
      }
    }
    expect(named, "the steps do name controls").toBeGreaterThanOrEqual(12);
    // And every write click that prose names appears with its own case: a
    // label never appears re-cased inside a sentence. `Put back` is excused:
    // it was chosen BECAUSE it is the register's own verb ("can be put back",
    // "nothing to put back"), and the verb in prose is not the control.
    for (const { name, text } of strings) {
      for (const label of WRITE_CLICKS) {
        if (label === PUT_BACK_LABEL) continue;
        if (text.toLowerCase().includes(label.toLowerCase())) {
          expect(text, `${name} re-cases ${label}`).toContain(label);
        }
      }
    }

    // And the engine appears nowhere in the file at all, comments included.
    const raw = installCopySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    expect(raw.includes(ENGINE), "install-copy.ts names an engine").toBe(false);
  });

  it("the closed sets: six reasons, three more, thirteen utterances, and titles that end without a full stop", () => {
    const reasons: readonly KeepReason[] = [
      "never-tried",
      "knobs-moved",
      "after-partial",
      "already-kept",
      "after-mismatch",
      "incapable",
    ];
    expect(Object.keys(KEEP_REASONS).sort(), "exactly six reasons").toEqual(
      [...reasons].sort(),
    );
    expect(new Set(Object.values(KEEP_REASONS)).size, "six distinct").toBe(6);
    expect(KEEP_REASONS["never-tried"]).toBe(
      `${TRY_ON_LABEL} first, then store it.`,
    );
    // Every reason that points at the apply names it as the button reads.
    for (const reason of [
      "never-tried",
      "knobs-moved",
      "after-partial",
      "after-mismatch",
    ] as const) {
      expect(KEEP_REASONS[reason], `${reason} names the apply`).toContain(
        TRY_ON_LABEL,
      );
    }

    // The reset's three, closed the same way, and TWO OF THEM ARE REFERENCES
    // RATHER THAN RETYPED SENTENCES - asserted by identity, so a rewrite of
    // Put back's or Store on ZONA's string moves this table with it and no
    // second copy of a shipped sentence can drift.
    const clearReasons: readonly ClearReason[] = [
      "no-snapshot",
      "no-session",
      "incapable",
    ];
    expect(Object.keys(CLEAR_REASONS).sort(), "exactly three reasons").toEqual(
      [...clearReasons].sort(),
    );
    expect(new Set(Object.values(CLEAR_REASONS)).size, "three distinct").toBe(
      3,
    );
    expect(CLEAR_REASONS["no-session"], "Put back's, reused").toBe(
      PUT_BACK_NEEDS_ZONA,
    );
    expect(CLEAR_REASONS.incapable, "Store on ZONA's, reused").toBe(
      KEEP_REASONS.incapable,
    );
    const retyped = strip(installCopySource()).split(PUT_BACK_NEEDS_ZONA);
    expect(
      retyped.length - 1,
      "the no-session sentence is written twice - reference it, do not retype it",
    ).toBe(1);

    // Seven failure titles, each ending in a letter, each announced with the
    // full stop added and nothing else. SIX OF THEM ARE THE UNCERTAIN
    // OUTCOMES SECTION 16 OFFERS ONE LINE FOR, kept six by D-23; the seventh
    // is the lost cable. None names a page: a title is the same whatever
    // page it happened on, and the bar reads it with a representative page.
    const blocks = failureBlocks();
    expect(blocks.length, "the seven failure builders").toBe(7);
    const titles: string[] = [];
    for (const [name, block] of blocks) {
      expect(block.title, `${name} has no title`).not.toBe("");
      expect(
        /[A-Za-z]$/.test(block.title),
        `${name}'s title does not end in a letter: ${block.title}`,
      ).toBe(true);
      expect(block.title, `${name}'s title names a page`).not.toMatch(
        /Page \d/,
      );
      expect(announceTitle(block.title)).toBe(`${block.title}.`);
      expect(block.detail, `${name} has no detail`).not.toBe("");
      expect(block.steps.length, `${name} has no steps`).toBeGreaterThan(0);
      titles.push(block.title);
    }
    expect(new Set(titles).size, "seven distinct titles").toBe(7);
    expect(
      titles.includes(
        "The device stopped responding. Your draft is safe; device state could not be verified",
      ),
      "section 16's one line for six outcomes is not a title - D-23 kept the six",
    ).toBe(false);

    // FIVE success utterances, the 2000 ms line, and seven announced titles:
    // thirteen distinct strings, the whole of what the live region can say.
    // Two of the five are section 16's own lines spoken as sentences.
    const utterances = [
      liveSnapshotSaved(PAGE),
      liveSettled(PAGE),
      liveRestored(PAGE),
      liveKept(PAGE),
      liveCleared(PAGE),
      LIVE_STILL_WRITING,
      ...titles.map(announceTitle),
    ];
    expect(utterances.length).toBe(13);
    expect(new Set(utterances).size, "thirteen distinct utterances").toBe(13);
    for (const utterance of utterances) {
      expect(utterance.endsWith("."), `${utterance} is not a sentence`).toBe(
        true,
      );
    }
    expect(
      liveSnapshotSaved(PAGE).endsWith("Nothing has been written."),
      "the snapshot utterance ends on the sentence the phase rests on",
    ).toBe(true);
    expect(liveSettled(PAGE), "the settled utterance is the caption").toBe(
      settledCaption(PAGE),
    );
    expect(
      liveKept(PAGE),
      "the stored utterance is the caption, as a sentence",
    ).toBe(`${keptCaption(PAGE)}.`);
    expect(announceTitle("Nothing reached your ZONA")).toBe(
      "Nothing reached your ZONA.",
    );
    expect(IDENTIFIED_CAPTION).toBe("ZONA connected");
  });

  it("the formatters: moduleList, confirmRig, nothingLandedBlock and lostBlock", () => {
    expect(moduleList(["EN16"])).toBe("EN16");
    expect(moduleList(["EN16", "BU16"])).toBe("EN16 and BU16");
    expect(moduleList(["EN16", "BU16", "PO16"])).toBe("EN16, BU16 and PO16");
    expect(moduleList(["EN16", "BU16", "PO16", "PBF4"])).toBe(
      "EN16, BU16, PO16 and PBF4",
    );
    for (const list of [
      moduleList(["EN16", "BU16"]),
      moduleList(["EN16", "BU16", "PO16"]),
      moduleList(["EN16", "BU16", "PO16", "PBF4"]),
    ]) {
      expect(list.includes(", and"), `${list} has an Oxford comma`).toBe(false);
      expect(list.includes(" and "), `${list} is a bare comma list`).toBe(true);
    }

    const one = confirmRig(["EN16"]);
    const two = confirmRig(["EN16", "BU16"]);
    expect(one).toContain("Your EN16 is on the same cable");
    expect(two).toContain("Your EN16 and BU16 are on the same cable");
    expect(one?.endsWith("at once.")).toBe(true);
    expect(two?.endsWith("at once.")).toBe(true);
    expect(confirmRig([]), "no other module, no fourth row").toBeUndefined();

    expect(nothingLandedBlock("try", PAGE).steps[0]).toBe(
      `Click ${TRY_ON_LABEL} to send it again`,
    );
    expect(nothingLandedBlock("put-back", PAGE).steps[0]).toBe(
      `Click ${PUT_BACK_LABEL} to send it again`,
    );
    expect(nothingLandedBlock("try", PAGE).detail).not.toBe(
      nothingLandedBlock("put-back", PAGE).detail,
    );
    expect(nothingLandedBlock("try", 2).detail).toContain("Page 3");

    expect(lostBlock(false, HEADER_LABEL, PAGE).steps[1]).toBe(
      `Click ${HEADER_LABEL} again`,
    );
    expect(lostBlock(false, TRY_ON_LABEL, PAGE).steps[1]).toBe(
      `Click ${TRY_ON_LABEL} again`,
    );
    expect(
      lostBlock(true, TRY_ON_LABEL, PAGE).detail.startsWith(
        "The store was sent",
      ),
    ).toBe(true);
    expect(
      lostBlock(false, TRY_ON_LABEL, PAGE).detail.includes(
        "Nothing was stored",
      ),
      "Z-11: said only where it is true",
    ).toBe(true);
    expect(
      lostBlock(true, TRY_ON_LABEL, PAGE).detail.includes("Nothing was stored"),
      "Z-11: not said on a store leg",
    ).toBe(false);

    // The four partials the ONE writer can produce, and no fifth: the unions
    // are closed, so a pairing the writer cannot reach is a type error here
    // rather than a sentence somebody has to notice. Each names the system
    // timer first, because it is written first (12.1-08), and the utility
    // script third (13-17).
    for (const [landed, failed] of PARTIALS_IN_WRITE_ORDER) {
      expect(
        partialBlock(landed, failed, PAGE).detail.startsWith(
          `${landed} reached your ZONA and ${failed} didn’t`,
        ),
      ).toBe(true);
    }

    // Every step that names a control names one that is on the screen in its
    // state: the write clicks, or the interpolated label.
    const allowed = new Set<string>([...WRITE_CLICKS, HEADER_LABEL]);
    let named = 0;
    for (const [name, block] of [
      ...failureBlocks(),
      [
        "nothingLandedBlock(put-back)",
        nothingLandedBlock("put-back", PAGE),
      ] as [string, InstallBlock],
      ["lostBlock(store leg)", lostBlock(true, HEADER_LABEL, PAGE)] as [
        string,
        InstallBlock,
      ],
    ]) {
      for (const step of block.steps) {
        const found = [...allowed].filter((label) => step.includes(label));
        if (/[Cc]lick /.test(step)) {
          named += found.length;
          expect(
            found.length,
            `${name} step "${step}" clicks a control that is not on the screen`,
          ).toBeGreaterThan(0);
        }
      }
    }
    expect(named, "the steps do name controls").toBeGreaterThanOrEqual(12);
  });
});
