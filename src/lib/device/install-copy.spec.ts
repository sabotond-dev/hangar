// The install flow's copy contract, made executable: six gates.
//
// 07-UI-SPEC.md's Copywriting Contract IS the specification, and 10-UI-SPEC.md
// amends three of its sentences (R-05, R-06, R-09), so test 2 reads BOTH from
// disk rather than transcribing either a second time: every literal longer than
// forty characters must appear in one of those two documents verbatim, with a
// builder's sample arguments folded back into the contract's placeholders. The
// one exception is a row in AMENDED_BY_MEASUREMENT, which is asserted from both
// sides rather than excused. Test 3 holds the FOUR caps the panel's
// reservations rest on - three until plan 10-12 - by name and as arithmetic
// over the measured CH_PER_LINE, so a reservation cannot silently grow (Z-18);
// it holds Z-08, the site's one "about a second", to exactly two occurrences;
// and it holds A-52's declared headroom and the three stems no string beside
// CLEAR may say. Tests 4 to 6 are the mechanical rules, the closed sets and
// the formatters.
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
  CLEARED_BODY,
  CLEARED_CAPTION,
  CLEARING_LABEL,
  CLEAR_CAP,
  CLEAR_LABEL,
  CLEAR_LINE,
  CLEAR_REASONS,
  HONESTY_CAP,
  HONESTY_INCAPABLE,
  HONESTY_NO_SESSION,
  HONESTY_READY,
  HONESTY_SNAPSHOTTING,
  KEEP_CAP,
  KEEP_LABEL,
  KEEP_LINE_ENABLED,
  KEEP_REASONS,
  LIVE_CLEARED,
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  PUT_BACK_CAP,
  PUT_BACK_LABEL,
  PUT_BACK_LINE,
  PUT_BACK_LINE_AFTER_KEEP,
  PUT_BACK_NEEDS_ZONA,
  TRY_ON_LABEL,
  WRITE_CLICKS,
  announceTitle,
  confirmRig,
  keptMismatchBlock,
  liveKept,
  liveSettled,
  lostBlock,
  moduleList,
  nothingLandedBlock,
  partialBlock,
  restoredUnconfirmedBlock,
  snapshotFailedBlock,
  unconfirmedBlock,
  type ClearReason,
  type InstallBlock,
  type KeepReason,
} from "./install-copy";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const installCopySource = () => read("./install-copy.ts");

/**
 * The approved contracts, read from disk: src/lib/device/ is three levels below
 * the root. TWO documents since plan 10-03, because that plan rewrote three of
 * this module's sentences and the rows holding their new forms are in the Phase
 * 10 contract, not the Phase 7 one. Test 2 asks whether a literal appears in
 * EITHER, and asserts that both were read and that both are approved - a
 * containment check over a document that failed to load is a gate that passes
 * everything.
 */
const UI_SPECS: readonly { path: string; heading: string }[] = [
  {
    path: "../../../.planning/phases/07-install-flow/07-UI-SPEC.md",
    heading: "## Copywriting Contract",
  },
  {
    path: "../../../.planning/phases/10-redesign/10-UI-SPEC.md",
    heading: "## 13. Copywriting Contract",
  },
];

const uiSpecs = () => UI_SPECS.map(({ path }) => read(path));

/**
 * THE ONE LITERAL THE CONTRACTS DO NOT CARRY, AND WHY, BY NAME.
 *
 * 10-UI-SPEC 13.3 authors HONESTY_READY at 90 characters. It cannot ship at 90:
 * plan 10-01 measured CH_PER_LINE at 43 rather than the provisional 46 the
 * contract's arithmetic assumed, which takes HONESTY_CAP to 2 x 43 = 86, and
 * the standing rule is that the literal shortens and the cap never rises - a
 * cap widened to admit its own string stops reserving anything.
 *
 * So this row is an amendment, not an exemption, and it is asserted as one:
 * test 2 requires the CONTRACT's form to be present in a contract (so the row
 * being amended is real and still says what it says), requires it to be OVER
 * the cap (so the amendment is necessary rather than convenient), and requires
 * the SHIPPED form to be under it. Deleting the row makes test 2 red on the
 * shipped string; faking it makes test 2 red on the contract's.
 */
const AMENDED_BY_MEASUREMENT: readonly {
  name: string;
  contract: string;
  cap: number;
}[] = [
  {
    name: "HONESTY_READY",
    contract:
      "Writes this into your ZONA’s memory in about a second. A power cycle brings your own back.",
    cap: 86,
  },
];

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const strip = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/** Counted by script, never by eye: code points, not UTF-16 units. */
const chars = (text: string) => [...text].length;

/** Assembled, never written: the engine name that appears in no string and no comment. */
const ENGINE = ["Chrom", "ium"].join("");
/** Assembled: the three words that may never be a control label. */
const WIRE_WORDS = [
  ["fl", "ash"].join(""),
  ["bu", "rn"].join(""),
  ["inst", "all"].join(""),
];

const FW = { major: 1, minor: 5, patch: 5 };
const NAME = "EUCLID";
/** The header disclosure's label - the OTHER surface, so no step can be a literal that matches the panel. */
const HEADER_LABEL = "CONNECT ZONA";

/**
 * One sample input per exported function, so every builder's OUTPUT goes
 * through the rules rather than only the constants. A function with no entry
 * here fails test 4 by name, so a sentence added later cannot quietly escape.
 */
const SAMPLES: Readonly<Record<string, readonly unknown[]>> = {
  identifiedBody: [FW, 3],
  settledBody: [NAME],
  keptBody: [NAME],
  keptMismatchBlock: [],
  unconfirmedBlock: [NAME],
  restoredUnconfirmedBlock: [],
  nothingLandedBlock: ["try"],
  partialBlock: ["Timer", "Setup"],
  lostBlock: [false, HEADER_LABEL],
  snapshotFailedBlock: [],
  moduleList: [["EN16", "BU16", "PO16"]],
  confirmRig: [["EN16"]],
  liveSettled: [NAME],
  liveKept: [NAME],
  announceTitle: ["Nothing reached your ZONA"],
};

/**
 * The OTHER branch of every two-form builder, so test 2 matches both forms of
 * each against the contract and not only the sampled one.
 */
const OTHER_BRANCHES: readonly [string, unknown][] = [
  ["nothingLandedBlock(put-back)", nothingLandedBlock("put-back")],
  ["lostBlock(store leg)", lostBlock(true, "TRY ON DEVICE")],
  ["confirmRig(several)", confirmRig(["EN16", "BU16"])],
  ["partialBlock(Setup, Timer)", partialBlock("Setup", "Timer")],
];

/**
 * The sample values folded back into the contract's placeholders, in order.
 * `{Name}`, `{Timer}` / `{Setup}`, `{label}`, `{EN16}` / `{EN16 and BU16}` and
 * the firmware line are the only interpolations the contract has.
 */
const PLACEHOLDERS: readonly [string, string][] = [
  [
    "Firmware 1.5.5, active page 3.",
    "Firmware {major}.{minor}.{patch}, active page {n}.",
  ],
  [NAME, "{Name}"],
  [
    "Timer reached your ZONA and Setup did not",
    "{Timer} reached your ZONA and {Setup} did not",
  ],
  [
    "Setup reached your ZONA and Timer did not",
    "{Timer} reached your ZONA and {Setup} did not",
  ],
  [`Click ${HEADER_LABEL} again`, "Click {label} again"],
  ["Your EN16 and BU16 are on", "Your {EN16 and BU16} are on"],
  ["Your EN16 is on", "Your {EN16} is on"],
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
  ["keptMismatchBlock", keptMismatchBlock()],
  ["unconfirmedBlock", unconfirmedBlock(NAME)],
  ["restoredUnconfirmedBlock", restoredUnconfirmedBlock()],
  ["nothingLandedBlock", nothingLandedBlock("try")],
  ["partialBlock", partialBlock("Timer", "Setup")],
  ["lostBlock", lostBlock(false, HEADER_LABEL)],
  ["snapshotFailedBlock", snapshotFailedBlock()],
];

describe("the install flow's copy contract (07-UI-SPEC)", () => {
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

  it("holds every long sentence of the contract character for character", () => {
    const specs = uiSpecs();
    specs.forEach((spec, i) => {
      expect(
        spec.length,
        `${UI_SPECS[i].path} was actually read`,
      ).toBeGreaterThan(50_000);
      expect(
        spec,
        `${UI_SPECS[i].path} is not the document it claims to be`,
      ).toContain(UI_SPECS[i].heading);
      expect(spec, `${UI_SPECS[i].path} is not approved`).toContain(
        "status: approved",
      );
    });
    const inAContract = (text: string) => specs.some((s) => s.includes(text));

    const long = everyString().filter(({ text }) => chars(text) > 40);
    expect(
      long.length,
      "enough long literals were found to be checking anything",
    ).toBeGreaterThanOrEqual(40);

    // The measured amendments, asserted from both sides before their names are
    // excused below: the contract's form is really in a contract and is really
    // over the cap, so the shortening is necessary rather than convenient.
    for (const { name, contract, cap } of AMENDED_BY_MEASUREMENT) {
      expect(
        inAContract(contract),
        `${name}'s CONTRACT form is in neither approved contract - the amendment names a row that does not exist`,
      ).toBe(true);
      expect(
        chars(contract),
        `${name}'s contract form is not over its cap, so there was nothing to amend - delete the row`,
      ).toBeGreaterThan(cap);
    }
    const amended = new Set(AMENDED_BY_MEASUREMENT.map((a) => a.name));

    const misses = long
      .filter(
        ({ name, text }) => !amended.has(name) && !inAContract(templated(text)),
      )
      .map(({ name, text }) => `${name}: ${templated(text)}`);
    expect(misses, "literals neither contract contains").toEqual([]);

    // The four two-form builders' other branches were walked too, so both
    // forms of each are held - not only the sampled one.
    expect(long.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "nothingLandedBlock(put-back).detail",
        "lostBlock(store leg).detail",
        "confirmRig(several)",
        "partialBlock(Setup, Timer).detail",
      ]),
    );
  });

  it("the four caps hold, by name", () => {
    // The caps are the contract's, re-derived by plan 10-03 at the CH_PER_LINE
    // plan 10-01 measured in Inter Variable over thirty-six full line boxes in
    // two engines: 43, the minimum occupancy of a FULL line box, which is what
    // makes a cap a promise about strings not yet written.
    //
    //   HONESTY_CAP  2 x 43 =  86   48px, two lines. WAS 129 at three.
    //   PUT_BACK_CAP 3 x 43 = 129   72px, three lines. Unchanged.
    //   KEEP_CAP     2 x 43 =  86   48px, two lines. Unchanged.
    //   CLEAR_CAP    2 x 43 =  86   48px, two lines. NEW in 10-12.
    //
    // Two of the first three land byte-for-byte on the numbers Phase 7
    // shipped, which is 10-UI-SPEC 12.2's table surviving the measurement
    // intact; what moved is copy, not layout.
    //
    // CLEAR_CAP'S SECOND LINE IS HEADROOM RATHER THAN OCCUPANCY (A-52), and
    // that is asserted below rather than left to the comment: the longest
    // string the cell can hold is 43, so 12's formula would give one line, and
    // taking it would put a shipped string exactly on its own cap - the
    // zero-headroom defect 10-01 flagged against the old CLEAR_LINE at 86,
    // reintroduced at a different number.
    //
    // They are literals here, not this module's to move.
    const CH_PER_LINE = 43;
    expect(HONESTY_CAP, "the honesty slot's cap - 2 x 43").toBe(
      2 * CH_PER_LINE,
    );
    expect(PUT_BACK_CAP, "the PUT BACK cell's cap - 3 x 43").toBe(
      3 * CH_PER_LINE,
    );
    expect(KEEP_CAP, "the KEEP ON DEVICE cell's cap - 2 x 43").toBe(
      2 * CH_PER_LINE,
    );
    expect(CLEAR_CAP, "the CLEAR cell's cap - 2 x 43").toBe(2 * CH_PER_LINE);
    expect(HONESTY_CAP, "the honesty slot's cap, as a number").toBe(86);
    expect(PUT_BACK_CAP, "the PUT BACK cell's cap, as a number").toBe(129);
    expect(KEEP_CAP, "the KEEP ON DEVICE cell's cap, as a number").toBe(86);
    expect(CLEAR_CAP, "the CLEAR cell's cap, as a number").toBe(86);

    const honesty: readonly [string, string][] = [
      ["HONESTY_NO_SESSION", HONESTY_NO_SESSION],
      ["HONESTY_READY", HONESTY_READY],
      ["HONESTY_SNAPSHOTTING", HONESTY_SNAPSHOTTING],
      ["HONESTY_INCAPABLE", HONESTY_INCAPABLE],
    ];
    for (const [name, text] of honesty) {
      expect(
        chars(text),
        `${name} is over the honesty cap`,
      ).toBeLessThanOrEqual(HONESTY_CAP);
    }
    // The contract's own figures, measured rather than trusted. R-05 and R-06
    // rewrite the first two: 106 becomes 70, and 104 becomes 85 through the
    // measured amendment AMENDED_BY_MEASUREMENT records.
    expect(chars(HONESTY_NO_SESSION), "R-05, rewritten at 70").toBe(70);
    expect(chars(HONESTY_READY), "R-06, shortened to fit its own cap").toBe(85);
    expect(chars(HONESTY_SNAPSHOTTING), "68, per the contract").toBe(68);
    expect(chars(HONESTY_INCAPABLE), "72, per the contract").toBe(72);

    // Z-08, ASSERTED RATHER THAN COMMENTED. "about a second" is the site's one
    // promise about how long a write takes, and it belongs to the two honesty
    // strings a visitor reads BEFORE clicking. R-05 and R-06 both rewrite those
    // strings, so the invariant is checked over the module's source after the
    // rewrite rather than assumed to have survived it. Case-insensitive
    // deliberately: the no-session form opens a sentence with it and the ready
    // form carries it mid-sentence, and Z-08 is about the phrase, not the
    // capital.
    const source = strip(installCopySource());
    const occurrences = source.toLowerCase().split("about a second").length - 1;
    expect(
      occurrences,
      "Z-08: 'about a second' appears somewhere other than the first two honesty strings, or has been lost from one of them",
    ).toBe(2);
    expect(
      HONESTY_NO_SESSION.toLowerCase().includes("about a second"),
      "Z-08: the no-session honesty string lost 'about a second'",
    ).toBe(true);
    expect(
      HONESTY_READY.toLowerCase().includes("about a second"),
      "Z-08: the ready honesty string lost 'about a second'",
    ).toBe(true);

    // And the other half of Z-08 - "nowhere else on the site" - over the whole
    // of src/ rather than over this module only, because a second promise about
    // how long a write takes would most naturally be written somewhere else.
    //
    // .spec.ts files are excluded and that is not a loophole: a copy gate has
    // to quote the sentence it pins, so a scan that included them would forbid
    // its own mechanism. Everything a visitor can reach is in scope.
    //
    // src/routes/dev/type/+page.svelte is an EXPECTED row, not an offender. It
    // is the unlinked type probe plan 10-01 measured CH_PER_LINE on, and its
    // copy of the sentence is a measurement sample: the contract's 90-character
    // form, which is what those line-box occupancies were taken against.
    // Rewriting it would falsify the record of what was measured.
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

    const putBack: readonly [string, string][] = [
      ["PUT_BACK_LINE", PUT_BACK_LINE],
      ["PUT_BACK_LINE_AFTER_KEEP", PUT_BACK_LINE_AFTER_KEEP],
      ["PUT_BACK_NEEDS_ZONA", PUT_BACK_NEEDS_ZONA],
    ];
    for (const [name, text] of putBack) {
      expect(
        chars(text),
        `${name} is over the PUT BACK cap`,
      ).toBeLessThanOrEqual(PUT_BACK_CAP);
    }
    expect(chars(PUT_BACK_LINE), "71, per the contract").toBe(71);
    expect(chars(PUT_BACK_LINE_AFTER_KEEP), "101, per the contract").toBe(101);
    expect(chars(PUT_BACK_NEEDS_ZONA), "26, per the contract").toBe(26);

    expect(
      chars(KEEP_LINE_ENABLED),
      "KEEP_LINE_ENABLED is over the KEEP cap",
    ).toBeLessThanOrEqual(KEEP_CAP);
    for (const [reason, text] of Object.entries(KEEP_REASONS)) {
      expect(
        chars(text),
        `KEEP_REASONS.${reason} is over the KEEP cap`,
      ).toBeLessThanOrEqual(KEEP_CAP);
    }
    expect(chars(KEEP_REASONS["after-mismatch"]), "42, per the contract").toBe(
      42,
    );
    expect(chars(LIVE_STILL_WRITING), "14, per the contract").toBe(14);

    // The CLEAR cell (10-UI-SPEC 13.3, A-49 and A-52). Four candidates share
    // the one 48px cell, so every one of them is held against the cap.
    const clearCell: readonly [string, string][] = [
      ["CLEAR_LINE", CLEAR_LINE],
      ...(Object.entries(CLEAR_REASONS) as [string, string][]),
    ];
    for (const [name, text] of clearCell) {
      expect(chars(text), `${name} is over the CLEAR cap`).toBeLessThanOrEqual(
        CLEAR_CAP,
      );
    }
    // THE THREE STEMS, over every string in and around the CLEAR control, and
    // BEFORE the arithmetic below: A-48 is the rule, the character counts are
    // the reservation, and a rewrite that says "empties" should be told which
    // rule it broke rather than which number it moved.
    //
    // The control restores the firmware's own configuration, so nothing beside
    // its label may imply emptiness - that would be the same class of lie as
    // the never-writes sentence this phase already retired. The label itself
    // is the Editor's own word and is exempt by name.
    const STEMS = [
      ["clear", "s"].join(""),
      ["empt", "y"].join("").slice(0, 4),
      ["remov", "e"].join(""),
    ];
    const clearStrings: readonly [string, string][] = [
      ["CLEARING_LABEL", CLEARING_LABEL],
      ...clearCell,
      ["CLEARED_CAPTION", CLEARED_CAPTION],
      ["CLEARED_BODY", CLEARED_BODY],
      ["LIVE_CLEARED", LIVE_CLEARED],
    ];
    expect(clearStrings.length, "the scan has strings to scan").toBe(8);
    for (const [name, text] of clearStrings) {
      for (const stem of STEMS) {
        expect(
          text.toLowerCase().includes(stem),
          `${name} says "${stem}" of a control that RESTORES the firmware's own configuration (A-48)`,
        ).toBe(false);
      }
    }

    expect(chars(CLEAR_LABEL), "5, per the contract").toBe(5);
    expect(chars(CLEARING_LABEL), "9, per the contract").toBe(9);
    expect(chars(CLEAR_LINE), "41 - D-21, verbatim").toBe(41);
    expect(chars(CLEAR_REASONS["no-snapshot"]), "43, per the contract").toBe(
      43,
    );
    expect(chars(CLEAR_REASONS["no-session"]), "26, reused").toBe(26);
    expect(chars(CLEAR_REASONS.incapable), "36, reused").toBe(36);
    expect(chars(CLEARED_CAPTION), "15, per the contract").toBe(15);
    expect(chars(CLEARED_BODY), "115, per the contract").toBe(115);
    expect(chars(LIVE_CLEARED), "37, per the contract").toBe(37);

    // A-52 ASSERTED RATHER THAN COMMENTED: the longest string in the cell is
    // 43, so the formula's own answer is ONE line, and the cap is deliberately
    // two. If a later string reaches the second line this stops being
    // headroom and the reservation has to be re-argued, not quietly grown.
    const longest = Math.max(...clearCell.map(([, text]) => chars(text)));
    expect(longest, "the longest candidate in the CLEAR cell").toBe(43);
    expect(
      Math.ceil(longest / CH_PER_LINE) * CH_PER_LINE,
      "12's formula would give one line; A-52 declines it, and the departure is the point",
    ).toBeLessThan(CLEAR_CAP);
  });

  it("obeys the copy rules mechanically, over every export and every builder's sample", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the export walk found the module's strings",
    ).toBeGreaterThan(60);

    const APOSTROPHE = String.fromCharCode(39);
    const emoji = /\p{Extended_Pictographic}/u;

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
    }

    // The real punctuation is present, so the rules above are not vacuously
    // satisfied by a module that simply has no punctuation.
    const all = strings.map((s) => s.text).join(" ");
    expect(all.includes(String.fromCharCode(0x2019)), "a real apostrophe").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2014)), "a real em dash").toBe(
      true,
    );

    // The label rules: every _LABEL is uppercase and none says what the wire
    // does. NINE labels since plan 10-12 - seven, plus CLEAR and CLEARING… -
    // so the loop is not empty.
    const labels = (Object.entries(copy) as [string, unknown][]).filter(
      (entry): entry is [string, string] =>
        entry[0].endsWith("_LABEL") && typeof entry[1] === "string",
    );
    expect(labels.length, "the nine control labels").toBe(9);
    for (const [name, label] of labels) {
      expect(label, `${name} is not uppercase`).toBe(label.toUpperCase());
      for (const word of WIRE_WORDS) {
        expect(label.toLowerCase().includes(word), `${name} says ${word}`).toBe(
          false,
        );
      }
    }

    // SAFE-01's number, as a constant rather than as a word in prose. The
    // equality is the whole point: it is what stops WRITE_CLICKS and the
    // labels drifting apart, and it is why REQUIREMENTS.md now names the
    // constant instead of spelling the number.
    // The equality FIRST, so a WRITE_CLICKS that has drifted names the label
    // it lost rather than failing on an arithmetic.
    expect([...WRITE_CLICKS], "a write click is not a control label").toEqual([
      TRY_ON_LABEL,
      PUT_BACK_LABEL,
      KEEP_LABEL,
      CLEAR_LABEL,
    ]);
    expect(WRITE_CLICKS.length, "four write clicks").toBe(4);
    expect(new Set(WRITE_CLICKS).size, "four distinct").toBe(4);

    // NO STRING NAMES A CONTROL THAT IS NOT ON THE SCREEN, and `cleared` is
    // the one state this phase could have broken that rule in. CLEARED_BODY
    // names PUT BACK and nothing else among the four write clicks - the
    // machine's half of the pairing, that PUT BACK is ENABLED in `cleared`,
    // is asserted in install.spec.ts's phase table, where the store lives and
    // where a copy literal has no business being (the boundary plan 10-12
    // drew). Between the two files the claim is whole.
    expect(
      WRITE_CLICKS.filter((label) => CLEARED_BODY.includes(label)),
      "the FACTORY DEFAULT body names a control other than PUT BACK, or names none at all - it is the one block whose body points at a control, and the control it points at has to be present and live in that phase",
    ).toEqual([PUT_BACK_LABEL]);

    // Z-08: the speed claim is made once, before the click. The phrase lives in
    // the two standing honesty lines and nowhere else - not in settled, not in
    // kept, not in a live utterance.
    const speed = strings
      .filter(({ text }) => /about a second/i.test(text))
      .map(({ name }) => name);
    expect(speed, "about a second appears only in the honesty slot").toEqual([
      "HONESTY_NO_SESSION",
      "HONESTY_READY",
    ]);

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
    expect(KEEP_REASONS["never-tried"]).toBe("Available after a try-on.");

    // CLEAR's three, closed the same way, and TWO OF THEM ARE REFERENCES
    // RATHER THAN RETYPED SENTENCES - asserted by identity, so a rewrite of
    // PUT BACK's or KEEP ON DEVICE's string moves this table with it and no
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
    expect(CLEAR_REASONS["no-session"], "PUT BACK's, reused").toBe(
      PUT_BACK_NEEDS_ZONA,
    );
    expect(CLEAR_REASONS.incapable, "KEEP ON DEVICE's, reused").toBe(
      KEEP_REASONS.incapable,
    );
    const retyped = strip(installCopySource()).split(PUT_BACK_NEEDS_ZONA);
    expect(
      retyped.length - 1,
      "the no-session sentence is written twice - reference it, do not retype it",
    ).toBe(1);

    // Seven failure titles, each ending in a letter, each announced with the
    // full stop added and nothing else.
    const blocks = failureBlocks();
    expect(blocks.length, "the seven failure builders").toBe(7);
    const titles: string[] = [];
    for (const [name, block] of blocks) {
      expect(block.title, `${name} has no title`).not.toBe("");
      expect(
        /[A-Za-z]$/.test(block.title),
        `${name}'s title does not end in a letter: ${block.title}`,
      ).toBe(true);
      expect(announceTitle(block.title)).toBe(`${block.title}.`);
      expect(block.detail, `${name} has no detail`).not.toBe("");
      expect(block.steps.length, `${name} has no steps`).toBeGreaterThan(0);
      titles.push(block.title);
    }
    expect(new Set(titles).size, "seven distinct titles").toBe(7);

    // FIVE success utterances since plan 10-12, the 2000 ms line, and seven
    // announced titles: thirteen distinct strings, the whole of what the live
    // region can say. The thirteenth is `cleared`'s, and the seven failure
    // titles did not move - a clear that fails reuses three of them (A-28).
    const utterances = [
      LIVE_SNAPSHOT_SAVED,
      liveSettled(NAME),
      LIVE_RESTORED,
      liveKept(NAME),
      LIVE_CLEARED,
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
      LIVE_SNAPSHOT_SAVED.endsWith("Nothing has been written."),
      "the snapshot utterance ends on the sentence the phase rests on",
    ).toBe(true);
    expect(announceTitle("Nothing reached your ZONA")).toBe(
      "Nothing reached your ZONA.",
    );
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

    expect(nothingLandedBlock("try").steps[0]).toBe(
      "Click TRY ON DEVICE to send both again",
    );
    expect(nothingLandedBlock("put-back").steps[0]).toBe(
      "Click PUT BACK to send both again",
    );
    expect(nothingLandedBlock("try").detail).not.toBe(
      nothingLandedBlock("put-back").detail,
    );

    expect(lostBlock(false, HEADER_LABEL).steps[1]).toBe(
      "Click CONNECT ZONA again",
    );
    expect(lostBlock(false, "TRY ON DEVICE").steps[1]).toBe(
      "Click TRY ON DEVICE again",
    );
    expect(
      lostBlock(true, "TRY ON DEVICE").detail.startsWith("The store was sent"),
    ).toBe(true);
    expect(
      lostBlock(false, "TRY ON DEVICE").detail.includes("Nothing was stored"),
      "Z-11: said only where it is true",
    ).toBe(true);
    expect(
      lostBlock(true, "TRY ON DEVICE").detail.includes("Nothing was stored"),
      "Z-11: not said on a store leg",
    ).toBe(false);

    expect(
      partialBlock("Timer", "Setup").detail.startsWith(
        "Timer reached your ZONA and Setup did not",
      ),
    ).toBe(true);
    expect(
      partialBlock("Setup", "Timer").detail.startsWith(
        "Setup reached your ZONA and Timer did not",
      ),
    ).toBe(true);

    // Every step that names a control names one that is on the screen in its
    // state: the three install controls, or the interpolated label. Uppercase
    // runs of two or more words are control names; ZONA and HANGAR are single
    // words and are not.
    const allowed = new Set([
      "TRY ON DEVICE",
      "PUT BACK",
      "KEEP ON DEVICE",
      HEADER_LABEL,
    ]);
    const control = /[A-Z]{2,}(?: [A-Z]{2,})+/g;
    let named = 0;
    for (const [name, block] of [
      ...failureBlocks(),
      ["nothingLandedBlock(put-back)", nothingLandedBlock("put-back")] as [
        string,
        InstallBlock,
      ],
      ["lostBlock(store leg)", lostBlock(true, HEADER_LABEL)] as [
        string,
        InstallBlock,
      ],
    ]) {
      for (const step of block.steps) {
        for (const match of step.match(control) ?? []) {
          named += 1;
          expect(
            allowed.has(match),
            `${name} step names ${match}, which is not on the screen`,
          ).toBe(true);
        }
      }
    }
    expect(named, "the steps do name controls").toBeGreaterThanOrEqual(12);
  });
});
