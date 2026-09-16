// The install flow's copy contract, made executable: six gates over install-copy.ts.
//
// Test 2 reads the five documents that author every string from disk - the Bible
// (sections 9 and 16), 13-18-BATCH.md, 13-CONTEXT.md's D-23, 13.1-COPY-NEW.md and
// BENCH-2026-09-16.txt (Apply to ZONA gone, every Store clearing first; the
// store confirmation gone; the unconfirmed store gone) - and holds every
// export and every builder's sample
// against them; a string in none of them is red by name. The same file holds the
// retirements by name and date: section 9's reset label (13.1-05, D-04), Put
// back's strings and the six success bodies (13.1-06, D-06 / D-07), the review's
// two labels (13.1-02), the honesty caps (13-18; test 3 asserts their absence
// and every rule that stayed), Apply to ZONA's strings, the confirmation's
// and the unconfirmed store's (2026-09-16).
// Non-vacuity first (identity.spec.ts); needles assembled from fragments so this
// file cannot fail itself (forbidden-instructions.spec.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as copy from "./install-copy";
import {
  CLEAR_LABEL,
  CLEAR_REASONS,
  HONESTY_SNAPSHOTTING,
  IDENTIFIED_CAPTION,
  KEEP_LABEL,
  KEEP_REASONS,
  LIVE_STILL_WRITING,
  NEEDS_ZONA,
  STILL_WRITING_LINE,
  TARGET_CLICK,
  WRITE_CLICKS,
  announceTitle,
  clearLine,
  clearedCaption,
  clearingLabel,
  keptCaption,
  keptMismatchBlock,
  liveCleared,
  liveKept,
  liveRestored,
  liveSettled,
  liveSnapshotSaved,
  lostBlock,
  nothingLandedBlock,
  pageName,
  partialBlock,
  restoredCaption,
  restoredUnconfirmedBlock,
  settledCaption,
  snapshotFailedBlock,
  stepOrClear,
  type ClearReason,
  type FailedWords,
  type InstallBlock,
  type KeepReason,
  type LandedWords,
} from "./install-copy";
// The twin's other half, read from the module that renders it (13.1-02).
import { TARGET_LABEL } from "./page-target";
import { stripComments } from "../../test-support/source";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const installCopySource = () => read("./install-copy.ts");

/**
 * The five documents that author the words, read from disk: src/lib/device/
 * is three levels below the root. Each is checked for length and for a
 * heading before it is searched, because a containment check over a document
 * that failed to load is a gate that passes everything. The fourth is Phase
 * 13.1's ledger (13.1-CONTEXT D-12): every string this phase writes is in
 * D-05's register and in that file, for the gate's batch. The fifth is the
 * record of 2026-09-16's changes outside the GSD cycle: change 1 (Apply to
 * ZONA gone, every Store clearing first) ledgers its strings there; change 2
 * (the store confirmation gone) retired strings and wrote none.
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
    {
      path: "../../../.planning/phases/13.1-bench-corrections-four/13.1-COPY-NEW.md",
      heading: "### Retired and rewritten by 13.1-06 (D-06, D-07)",
      atLeast: 10_000,
    },
    {
      path: "../../../BENCH-2026-09-16.txt",
      heading:
        "## 1. Apply to ZONA goes; Store stays; every Store clears first",
      atLeast: 3_000,
    },
  ];

const documents = () => DOCUMENTS.map(({ path }) => read(path));

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
/** Assembled: section 9's reset label, retired by 13.1-05 under D-04 - the value of no export, named in the header. */
const RETIRED_RESET_LABEL = ["Reset active", "device page"].join(" ");
/** Assembled: Put back's three names, retired by 13.1-06 under D-07 - not exported, named in the header. */
const RETIRED_PUT_BACK = [
  ["PUT_BACK", "_LABEL"].join(""),
  ["putting", "BackLabel"].join(""),
  ["STEP_OR", "_PUT_BACK"].join(""),
  ["PUT_BACK", "_NEEDS_ZONA"].join(""),
];
/** Assembled: the install block's success bodies, InstallState.svelte's alone, retired with it by 13.1-06 (W-10). */
const RETIRED_BODIES = [
  ["snapshotting", "Body"].join(""),
  ["identified", "Body"].join(""),
  ["settled", "Body"].join(""),
  ["kept", "Body"].join(""),
  ["restored", "Body"].join(""),
  ["cleared", "Body"].join(""),
  ["KEPT_PROOF", "_LINE"].join(""),
  ["RESTORED_STORED", "_LINE"].join(""),
];
/** Assembled: the retired control's verb, which no visitor-facing string may carry (the probe's two excepted by name). */
const PUT_BACK_WORD = ["put", " back"].join("");
/** Assembled: Apply to ZONA's four names, retired 2026-09-16 by the user's word - not exported, named in the header. */
const RETIRED_APPLY = [
  ["TRY_ON", "_LABEL"].join(""),
  ["writing", "Label"].join(""),
  ["HONESTY_", "NO_SESSION"].join(""),
  ["honesty", "Ready"].join(""),
];
/** Assembled: the unconfirmed store's three names, retired 2026-09-16 (change 3) by the user's word - not exported, named in the header. */
const RETIRED_UNCONFIRMED = [
  ["UNCONFIRMED", "_TITLE"].join(""),
  ["unconfirmed", "Block"].join(""),
  ["FIRMWARE_DEFAULT", "_NAME"].join(""),
];
/** Assembled: the store confirmation's six names, retired 2026-09-16 (change 2) by the user's word - not exported, named in the header. */
const RETIRED_CONFIRMATION = [
  ["NOT_NOW", "_LABEL"].join(""),
  ["confirm", "Caption"].join(""),
  ["confirm", "Replaces"].join(""),
  ["CONFIRM_", "WAY_BACK"].join(""),
  ["confirm", "Rig"].join(""),
  ["module", "List"].join(""),
];

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
  keepingLabel: [PAGE],
  clearingLabel: [PAGE],
  settledCaption: [PAGE],
  restoredCaption: [PAGE],
  keptCaption: [PAGE],
  clearedCaption: [PAGE],
  stepOrClear: [PAGE],
  keptMismatchBlock: [PAGE],
  restoredUnconfirmedBlock: [PAGE],
  nothingLandedBlock: ["store", PAGE],
  partialBlock: [
    "The system timer, the page init, the utility script and the Timer",
    "the Setup",
    PAGE,
  ],
  lostBlock: [false, HEADER_LABEL, PAGE],
  snapshotFailedBlock: [PAGE],
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
  ["lostBlock(store leg)", lostBlock(true, KEEP_LABEL, PAGE)],
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
  [`Click ${KEEP_LABEL} again`, "Click {label} again"],
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

/** The six failure builders at their samples, named (seven until 2026-09-16, change 3). */
const failureBlocks = (): readonly [string, InstallBlock][] => [
  ["keptMismatchBlock", keptMismatchBlock(PAGE)],
  ["restoredUnconfirmedBlock", restoredUnconfirmedBlock(PAGE)],
  ["nothingLandedBlock", nothingLandedBlock("store", PAGE)],
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

    const source = stripComments(raw);
    expect(
      source.length,
      "the stripped source is still the module and not only its comments",
    ).toBeGreaterThan(4000);
    expect(source, "the stripper ate the code").toContain(
      "export const HONESTY_SNAPSHOTTING",
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
    const [bible, batch, context, ledger, record] = docs;
    // D-23 is the answer, and it is the one word the plan asked for.
    const d23 = context.slice(context.indexOf(DOCUMENTS[2].heading));
    expect(d23, "D-23 records the answer").toContain('> *"approve"*');
    expect(d23, "D-23 keeps the six transfer lines six").toContain(
      "six transfer\nlines stay six",
    );

    // THE SECTION-16 LINES THIS MODULE TAKES VERBATIM (Apply's two left on
    // 2026-09-16), and section 9's labels: each is in the Bible character for
    // character, and the module produces it character for character. The
    // Bible writes curly quotes around its rows; the string inside them is
    // what is matched.
    const verbatim: readonly [string, string][] = [
      [
        "settledCaption",
        "Applied to Page 2. Store on ZONA to keep it after power-off.",
      ],
      ["keptCaption", "Stored on ZONA · Page 2"],
      ["KEEP_LABEL", "Store on ZONA"],
      ["IDENTIFIED_CAPTION", "ZONA connected"],
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
    // THE RESET'S LABEL IS THE USER'S WORD (13.1-05, D-04): `Clear`, in
    // D-05's case, and section 9's four words are the value of no export -
    // retired by name in the module's header with the date and the
    // decision. Section 9's row still stands in the Bible (held below with
    // the other rows the Bible really gives), and the fact it carried is
    // clearLine's, which names the firmware default and the draft.
    expect(CLEAR_LABEL, "the user's word, sentence case").toBe("Clear");
    expect(
      Object.entries(copy).filter(([, v]) => v === RETIRED_RESET_LABEL),
      "section 9's reset label is still exported under some name",
    ).toEqual([]);
    expect(installCopySource()).toContain(
      "SECTION 9'S RESET LABEL IS RETIRED BY NAME, 2026-09-12",
    );
    expect(clearLine(PAGE), "the fact moved to the line").toMatch(
      /firmware default/,
    );
    expect(clearLine(PAGE), "and the draft").toMatch(/draft stays/);

    // And the Bible really gives each: section 9 writes the progress labels
    // and the stored row with `N`, section 16 writes its rows with `2` -
    // and its reset row, whose label HANGAR no longer renders (above).
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

    // EVERY OTHER STRING IS IN THE BATCH, as proposed and as approved - or,
    // since 13.1-06, in Phase 13.1's ledger, where every string this phase
    // rewrote under D-07 is written verbatim with the batch row it
    // supersedes. The page name is a two-word form the batch writes in every
    // row; announceTitle adds a full stop and nothing else.
    const excused = new Set(["pageName", "announceTitle"]);
    const strings = everyString().filter(
      ({ name }) => !excused.has(name.split(/[.[(]/)[0]),
    );
    expect(
      strings.length,
      "enough strings were found to be checking anything",
    ).toBeGreaterThan(70);
    const misses = strings
      .filter(
        ({ text }) =>
          !batch.includes(templated(text)) &&
          !bible.includes(text) &&
          !ledger.includes(text) &&
          !record.includes(text),
      )
      .map(({ name, text }) => `${name}: ${templated(text)}`);
    expect(
      misses,
      "strings neither the Bible, the batch, the 13.1 ledger nor the 2026-09-16 record carries",
    ).toEqual([]);
    // And the ledger is not a blanket: the strings it carries are exactly
    // the ones 13.1-06 rewrote, each with its old form struck beside it -
    // and, since the round-4c quick task (2026-09-12, Clear stores the
    // defaults), the four Clear strings that say the store, each in the same
    // shape (the name the unconfirmed row read left with it, 2026-09-16).
    const ledgered = strings.filter(
      ({ text }) =>
        !batch.includes(templated(text)) &&
        !bible.includes(text) &&
        ledger.includes(text),
    );
    expect(
      ledgered.map(({ name }) => name).sort(),
      "the strings only the 13.1 ledger carries are the D-07 rewrites, the round-4c Clear strings, and no other",
    ).toEqual(
      [
        "HONESTY_SNAPSHOTTING",
        "clearLine",
        "clearingLabel",
        "clearedCaption",
        "liveCleared",
        "restoredCaption",
        "stepOrClear",
        "keptMismatchBlock.steps[1]",
        "restoredUnconfirmedBlock.steps[0]",
        "nothingLandedBlock(put-back).steps[0]",
        "partialBlock.steps[1]",
        "partialBlock(utility only).steps[1]",
        "partialBlock(page init only).steps[1]",
        "partialBlock(system timer only).steps[1]",
        "lostBlock.steps[2]",
        "lostBlock(store leg).steps[2]",
        "snapshotFailedBlock.title",
      ].sort(),
    );
    expect(ledger).toContain(
      "~~`Or click Put back to restore what was there when you connected`~~",
    );
    // Nor is the record: the strings only BENCH-2026-09-16.txt carries are
    // change 1's - Store's description, its already-kept reason, the store
    // form of the nothing-landed block and the three steps that named Apply -
    // and change 3's one rewrite, the kept-mismatch detail that no longer says
    // the store was acknowledged, each with its old form struck (the
    // confirmation's sentence left with change 2).
    const recorded = strings.filter(
      ({ text }) =>
        !batch.includes(templated(text)) &&
        !bible.includes(text) &&
        !ledger.includes(text),
    );
    expect(
      recorded.map(({ name }) => name).sort(),
      "the strings only the 2026-09-16 record carries are change 1's and change 3's one, and no other",
    ).toEqual(
      [
        "keepLineEnabled",
        "KEEP_REASONS.already-kept",
        "keptMismatchBlock.detail",
        "nothingLandedBlock.detail",
        "nothingLandedBlock.steps[0]",
        "partialBlock.steps[0]",
        "partialBlock(utility only).steps[0]",
        "partialBlock(page init only).steps[0]",
        "partialBlock(system timer only).steps[0]",
        "snapshotFailedBlock.steps[0]",
      ].sort(),
    );
    expect(record).toContain(
      "~~`Click Apply to ZONA to send all five again`~~",
    );
    expect(installCopySource()).toContain(
      "APPLY TO ZONA'S STRINGS ARE RETIRED BY NAME, 2026-09-16",
    );
    for (const retired of RETIRED_APPLY) {
      expect(
        Object.keys(copy).includes(retired),
        `${retired} is still exported`,
      ).toBe(false);
      expect(
        installCopySource().includes(retired),
        `${retired} is retired without being named`,
      ).toBe(true);
    }
    // THE STORE CONFIRMATION IS GONE BY THE USER'S WORD (2026-09-16, change
    // 2: "it just stores it with one click"). Its six names are exported by
    // nothing and retired in the header by name with the date; the record's
    // second section carries the word; KEEP_LABEL stays (it is Store's own),
    // and Store's description still says the whole click.
    expect(installCopySource()).toContain(
      "THE STORE CONFIRMATION'S STRINGS ARE RETIRED BY NAME, 2026-09-16",
    );
    expect(record).toContain(
      "## 2. Store on ZONA stores on one click - no confirmation",
    );
    for (const retired of RETIRED_CONFIRMATION) {
      expect(
        Object.keys(copy).includes(retired),
        `${retired} is still exported`,
      ).toBe(false);
      expect(
        installCopySource().includes(retired),
        `${retired} is retired without being named`,
      ).toBe(true);
    }
    expect(KEEP_LABEL).toBe("Store on ZONA");
    for (const fact of ["firmware default", "stores it", "power-off"]) {
      expect(
        copy.keepLineEnabled(PAGE),
        `Store's description says ${fact}`,
      ).toContain(fact);
    }
    // THE UNCONFIRMED STORE IS GONE BY THE USER'S WORD (2026-09-16, change
    // 3: "remove this, this is not a true bug report, it works fine"). Its
    // three names are exported by nothing and retired in the header by name
    // with the date; the record's third section carries the word; the
    // kept-mismatch detail no longer claims an acknowledgement the leg does
    // not wait for, and its old form is struck in the record.
    expect(installCopySource()).toContain(
      "THE UNCONFIRMED STORE'S STRINGS ARE RETIRED BY NAME, 2026-09-16",
    );
    expect(record).toContain(
      '## 3. The "Your ZONA didn\'t confirm the store" block goes',
    );
    for (const retired of RETIRED_UNCONFIRMED) {
      expect(
        Object.keys(copy).includes(retired),
        `${retired} is still exported`,
      ).toBe(false);
      expect(
        installCopySource().includes(retired),
        `${retired} is retired without being named`,
      ).toBe(true);
    }
    expect(keptMismatchBlock(PAGE).detail).toBe(
      "Reading Page 2 back after the store gave something different. HANGAR won’t call that stored.",
    );
    expect(keptMismatchBlock(PAGE).detail).not.toContain("acknowledged");
    expect(record).toContain(
      "~~`Your ZONA acknowledged the store, but reading Page 2 back gave something different. HANGAR won’t call that stored.`~~",
    );

    // The two-form builders' other branches were walked too, so both forms
    // of each are held - not only the sampled one.
    expect(strings.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "nothingLandedBlock(put-back).detail",
        "lostBlock(store leg).detail",
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
        `Click ${KEEP_LABEL} to send all five again`,
      );
    }
    // THE FIFTH FACT - a store carries the page's own three scripts beside
    // the touch pair - was the confirmation's sentence and left with it
    // (2026-09-16, change 2); the partial block's five names in write order,
    // above, are where the five slots are still named on screen.
    expect(
      [...produced.values()].some((text) =>
        text.includes("init, timer and utility scripts"),
      ),
      "a string still names the page's three scripts - the confirmation's sentence is back under another name",
    ).toBe(false);

    // PUT BACK IS GONE BY THE USER'S WORD (13.1-06, D-07). The three names
    // and the eight bodies are exported by nothing and retired in the header
    // by name with the date; STILL_WRITING_LINE is exported (its home is the
    // zone, W-11); no export or builder sample says the retired control's
    // verb except the two phase captions the probe still reaches; and every
    // sentence that offered a way back names the header's Clear.
    for (const retired of [...RETIRED_PUT_BACK, ...RETIRED_BODIES]) {
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
      "PUT BACK'S STRINGS ARE RETIRED BY NAME, 2026-09-12",
    );
    expect(installCopySource()).toContain(
      "THE INSTALL BLOCK'S SIX SUCCESS BODIES ARE RETIRED BY NAME, 2026-09-12",
    );
    expect(STILL_WRITING_LINE, "the still-writing line keeps its screen").toBe(
      "Still writing. Your ZONA is taking longer than usual.",
    );
    const probes = new Set([
      "restoredCaption",
      "restoredUnconfirmedBlock.title",
    ]);
    const saysPutBack = everyString()
      .filter(({ text }) => text.toLowerCase().includes(PUT_BACK_WORD))
      .map(({ name }) => name);
    expect(
      saysPutBack.sort(),
      "a visitor-facing string names the retired control's verb - only the probe's two phase captions may",
    ).toEqual([...probes].sort());
    expect(restoredCaption(PAGE)).toBe("Page 2 put back");
    expect(HONESTY_SNAPSHOTTING).toBe("Reading what your ZONA holds first.");
    expect(stepOrClear(PAGE)).toBe(
      `Or click ${CLEAR_LABEL} to return Page 2 to its firmware default`,
    );
    for (const [name, step] of [
      ["keptMismatchBlock", keptMismatchBlock(PAGE).steps[1]],
      [
        "partialBlock",
        partialBlock(
          "The system timer, the page init, the utility script and the Timer",
          "the Setup",
          PAGE,
        ).steps[1],
      ],
    ] as const) {
      expect(step, `${name}'s way back is the shared step`).toBe(
        stepOrClear(PAGE),
      );
    }
    expect(lostBlock(false, HEADER_LABEL, PAGE).steps[2]).toBe(
      `Then click ${CLEAR_LABEL} if you want the firmware default back`,
    );
    expect(KEEP_REASONS["already-kept"]).toBe(
      "Already stored on ZONA. Change something to store it again.",
    );
    expect(snapshotFailedBlock(PAGE).title).toBe("Nothing copied yet");
    // The two probe-only steps name the probe's action, not a click on a
    // control that does not exist.
    expect(restoredUnconfirmedBlock(PAGE).steps).toEqual([
      "Send the restore again",
    ]);
    expect(nothingLandedBlock("put-back", PAGE).steps[0]).toBe(
      "Send the restore again",
    );
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
    const source = stripComments(raw);
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

    // Z-08, ASSERTED RATHER THAN COMMENTED. "about a second" was the site's one
    // promise about how long a write takes, and it belonged to the two honesty
    // strings of the RAM write a visitor read BEFORE clicking. The RAM write
    // left on 2026-09-16 and the promise with it: a store waits for the
    // module's own proof, and no string promises a time. Over the module
    // first, then over the whole of src/, because a promise would most
    // naturally be written somewhere else. .spec.ts files are excluded and
    // that is not a loophole: a copy gate has to quote the sentence it pins.
    // src/routes/dev/type/+page.svelte is an EXPECTED row, not an offender:
    // it is the unlinked type probe plan 10-01 measured CH_PER_LINE on, and
    // its copy of the sentence is a measurement sample.
    const occurrences = source.toLowerCase().split("about a second").length - 1;
    expect(occurrences, "Z-08: 'about a second' nowhere in the module").toBe(0);
    const speed = everyString()
      .filter(({ text }) => /about a second/i.test(text))
      .map(({ name }) => name);
    expect(speed, "no string promises a time").toEqual([]);
    const SRC = fileURLToPath(new URL("../..", import.meta.url));
    const counted: Record<string, number> = {};
    for (const entry of readdirSync(SRC, { recursive: true })) {
      const rel = String(entry).split("\\").join("/");
      if (!/[.](ts|svelte)$/.test(rel) || rel.endsWith(".spec.ts")) continue;
      const body = stripComments(
        readFileSync(`${SRC}${rel}`, "utf8"),
      ).toLowerCase();
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
      ["liveCleared", liveCleared(PAGE)],
      // 13.1-06: the sentences that name Clear as the way back (the
      // confirmation's CONFIRM_WAY_BACK left with it, 2026-09-16 change 2).
      ["stepOrClear", stepOrClear(PAGE)],
      ["lostBlock.steps[2]", lostBlock(false, HEADER_LABEL, PAGE).steps[2]],
    ];
    expect(clearStrings.length, "the scan has strings to scan").toBe(10);
    for (const [name, text] of clearStrings) {
      for (const stem of STEMS) {
        expect(
          text.toLowerCase().includes(stem),
          `${name} says "${stem}" of a control that RESTORES the firmware's own configuration (A-48)`,
        ).toBe(false);
      }
    }
    // And the reset's own strings say what the control does: the firmware
    // default, by name, in the line, the caption, the utterance and the three
    // way-back sentences.
    for (const [name, text] of clearStrings
      .slice(2, 3)
      .concat(clearStrings.slice(6, 10))) {
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
    // FOUR since 2026-09-16 change 2: NOT_NOW_LABEL left with the confirmation.
    expect(labels.length, "two constants and two progress labels").toBe(4);
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
    // FOUR SINCE 13.1-06: Put back removed by the user's word (D-07). THREE
    // SINCE 2026-09-16: Apply to ZONA removed by the user's word
    // (BENCH-2026-09-16.txt section 1).
    expect([...WRITE_CLICKS], "a write click is not a control label").toEqual([
      KEEP_LABEL,
      CLEAR_LABEL,
      TARGET_CLICK,
    ]);
    expect(WRITE_CLICKS.length, "three write clicks").toBe(3);
    expect(new Set(WRITE_CLICKS).size, "three distinct").toBe(3);
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

    // NO STRING NAMES A CONTROL THAT IS NOT ON THE SCREEN (13.1-06): the
    // way back every step offers is the header's Clear and nothing retired -
    // held in test 2's D-07 block by value, and here by the write clicks.
    expect(
      WRITE_CLICKS.filter((label) => stepOrClear(PAGE).includes(label)),
      "the shared way-back step names a control other than Clear",
    ).toEqual([CLEAR_LABEL]);
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
    // contractions across the module and a real ellipsis; the one em dash
    // was the confirmation's sentence and left with it (2026-09-16 change
    // 2), so the dash rule is the negative alone: no typewriter double hyphen.
    const all = strings.map((s) => s.text).join(" ");
    const contractions = all.match(/[a-z]’(?:t|s|ll|re|ve)\b/g) ?? [];
    expect(
      contractions.length,
      "real apostrophes in real contractions",
    ).toBeGreaterThanOrEqual(8);
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes("--"), "a typewriter dash").toBe(false);

    // NO CONTROL LABEL PARAPHRASED IN PROSE, as the narrower thing that can be
    // asserted: every sentence that tells the visitor to click something
    // names a control exactly as the control reads - one of the three write
    // clicks, or the label the surface handed in. A step that said "press the
    // store button" would be red here by its own words.
    const allowed = new Set<string>([...WRITE_CLICKS, HEADER_LABEL]);
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
    // Ten since 2026-09-16 (change 3): the unconfirmed block's two named steps left with it.
    expect(named, "the steps do name controls").toBeGreaterThanOrEqual(10);
    // And every write click that prose names appears with its own case: a
    // label never appears re-cased inside a sentence. Since 13.1-06 NOTHING
    // is excused: `Put back` (excused as the register's own verb) is retired
    // with its control, and `Clear`'s excuse (settledBody's "clears it", the
    // wire's verb) went with settledBody - every "clear" left in the module
    // is the control, named as the control reads.
    for (const { name, text } of strings) {
      for (const label of WRITE_CLICKS) {
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

  it("the closed sets: three reasons, three more, twelve utterances, and titles that end without a full stop", () => {
    // THREE SINCE 2026-09-16 (six until Apply to ZONA left): no apply exists
    // to be first, stale, partial or mismatched against, so those four rows
    // are retired by name and the store is the retry from every failure.
    const reasons: readonly KeepReason[] = [
      "no-session",
      "already-kept",
      "incapable",
    ];
    expect(Object.keys(KEEP_REASONS).sort(), "exactly three reasons").toEqual(
      [...reasons].sort(),
    );
    expect(new Set(Object.values(KEEP_REASONS)).size, "three distinct").toBe(3);
    expect(KEEP_REASONS["no-session"], "the no-session sentence, reused").toBe(
      NEEDS_ZONA,
    );
    // No reason names a control: the one that points anywhere says what to do
    // in the register's own words.
    for (const reason of reasons) {
      for (const label of WRITE_CLICKS) {
        expect(
          KEEP_REASONS[reason].includes(label),
          `${reason} names ${label}`,
        ).toBe(false);
      }
    }
    expect(KEEP_REASONS["already-kept"]).toContain("Change something");

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
    expect(CLEAR_REASONS["no-session"], "the no-session sentence, reused").toBe(
      NEEDS_ZONA,
    );
    expect(CLEAR_REASONS.incapable, "Store on ZONA's, reused").toBe(
      KEEP_REASONS.incapable,
    );
    const retyped = stripComments(installCopySource()).split(NEEDS_ZONA);
    expect(
      retyped.length - 1,
      "the no-session sentence is written twice - reference it, do not retype it",
    ).toBe(1);

    // Six failure titles, each ending in a letter, each announced with the
    // full stop added and nothing else. FIVE OF THEM ARE THE UNCERTAIN
    // OUTCOMES SECTION 16 OFFERS ONE LINE FOR - kept six by D-23, one retired
    // by the user's word on 2026-09-16 (change 3, the unconfirmed store); the
    // sixth is the lost cable. None names a page: a title is the same whatever
    // page it happened on, and the bar reads it with a representative page.
    const blocks = failureBlocks();
    expect(blocks.length, "the six failure builders").toBe(6);
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
    expect(new Set(titles).size, "six distinct titles").toBe(6);
    expect(
      titles.includes(
        "The device stopped responding. Your draft is safe; device state could not be verified",
      ),
      "section 16's one line for six outcomes is not a title - D-23 kept the six",
    ).toBe(false);

    // FIVE success utterances, the 2000 ms line, and six announced titles:
    // twelve distinct strings, the whole of what the live region can say.
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
    expect(utterances.length).toBe(12);
    expect(new Set(utterances).size, "twelve distinct utterances").toBe(12);
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

  it("the formatters: nothingLandedBlock and lostBlock", () => {
    // moduleList and confirmRig left with the confirmation (2026-09-16,
    // change 2); test 2 holds their names retired.
    expect(nothingLandedBlock("store", PAGE).steps[0]).toBe(
      `Click ${KEEP_LABEL} to send it again`,
    );
    expect(
      nothingLandedBlock("put-back", PAGE).steps[0],
      "the probe's form names the probe's action (13.1-06)",
    ).toBe("Send the restore again");
    expect(nothingLandedBlock("store", PAGE).detail).not.toBe(
      nothingLandedBlock("put-back", PAGE).detail,
    );
    expect(nothingLandedBlock("store", 2).detail).toContain("Page 3");

    expect(lostBlock(false, HEADER_LABEL, PAGE).steps[1]).toBe(
      `Click ${HEADER_LABEL} again`,
    );
    expect(lostBlock(false, KEEP_LABEL, PAGE).steps[1]).toBe(
      `Click ${KEEP_LABEL} again`,
    );
    expect(
      lostBlock(true, KEEP_LABEL, PAGE).detail.startsWith("The store was sent"),
    ).toBe(true);
    expect(
      lostBlock(false, KEEP_LABEL, PAGE).detail.includes("Nothing was stored"),
      "Z-11: said only where it is true",
    ).toBe(true);
    expect(
      lostBlock(true, KEEP_LABEL, PAGE).detail.includes("Nothing was stored"),
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
    // Ten since 2026-09-16 (change 3): the unconfirmed block's two named steps left with it.
    expect(named, "the steps do name controls").toBeGreaterThanOrEqual(10);
  });
});
