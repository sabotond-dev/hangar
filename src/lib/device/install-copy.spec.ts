// The install flow's copy contract, made executable: six gates.
//
// 07-UI-SPEC.md's Copywriting Contract IS the specification, and test 2 reads
// it from disk rather than transcribing it a second time: every literal longer
// than forty characters must appear in that document verbatim, with a builder's
// sample arguments folded back into the contract's placeholders. Test 3 holds
// the three caps the panel's reservations rest on, by name, so a reservation
// cannot silently grow (Z-18). Tests 4 to 6 are the mechanical rules, the closed
// sets and the formatters.
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
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as copy from "./install-copy";
import {
  HONESTY_CAP,
  HONESTY_INCAPABLE,
  HONESTY_NO_SESSION,
  HONESTY_READY,
  HONESTY_SNAPSHOTTING,
  KEEP_CAP,
  KEEP_LINE_ENABLED,
  KEEP_REASONS,
  LIVE_RESTORED,
  LIVE_SNAPSHOT_SAVED,
  LIVE_STILL_WRITING,
  PUT_BACK_CAP,
  PUT_BACK_LINE,
  PUT_BACK_LINE_AFTER_KEEP,
  PUT_BACK_NEEDS_ZONA,
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
  type InstallBlock,
  type KeepReason,
} from "./install-copy";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const installCopySource = () => read("./install-copy.ts");

/** The approved contract, read from disk: src/lib/device/ is three levels below the root. */
const uiSpec = () =>
  read("../../../.planning/phases/07-install-flow/07-UI-SPEC.md");

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
    const spec = uiSpec();
    expect(spec.length, "the contract was actually read").toBeGreaterThan(
      50_000,
    );
    expect(spec, "the document read is the approved contract").toContain(
      "## Copywriting Contract",
    );
    expect(spec, "the contract is the approved revision").toContain(
      "status: approved",
    );

    const long = everyString().filter(({ text }) => chars(text) > 40);
    expect(
      long.length,
      "enough long literals were found to be checking anything",
    ).toBeGreaterThanOrEqual(40);

    const misses = long
      .filter(({ text }) => !spec.includes(templated(text)))
      .map(({ name, text }) => `${name}: ${templated(text)}`);
    expect(misses, "literals the contract does not contain").toEqual([]);

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

  it("the three caps hold, by name", () => {
    // The caps are the contract's: 72px reserves three lines at 43 characters
    // for the honesty slot and the PUT BACK cell, 48px reserves two for the
    // KEEP ON DEVICE cell. They are literals here, not this module's to move.
    expect(HONESTY_CAP, "the honesty slot's cap").toBe(129);
    expect(PUT_BACK_CAP, "the PUT BACK cell's cap").toBe(129);
    expect(KEEP_CAP, "the KEEP ON DEVICE cell's cap").toBe(86);

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
    // The contract's own figures, measured rather than trusted.
    expect(chars(HONESTY_NO_SESSION), "the longest new honesty string").toBe(
      106,
    );

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
    // does. Seven labels, so the loop is not empty.
    const labels = (Object.entries(copy) as [string, unknown][]).filter(
      (entry): entry is [string, string] =>
        entry[0].endsWith("_LABEL") && typeof entry[1] === "string",
    );
    expect(labels.length, "the seven control labels").toBe(7);
    for (const [name, label] of labels) {
      expect(label, `${name} is not uppercase`).toBe(label.toUpperCase());
      for (const word of WIRE_WORDS) {
        expect(label.toLowerCase().includes(word), `${name} says ${word}`).toBe(
          false,
        );
      }
    }

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

  it("the closed sets: six reasons, twelve utterances, and titles that end without a full stop", () => {
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

    // Four success utterances, the 2000 ms line, and seven announced titles:
    // twelve distinct strings, the whole of what the live region can say.
    const utterances = [
      LIVE_SNAPSHOT_SAVED,
      liveSettled(NAME),
      LIVE_RESTORED,
      liveKept(NAME),
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
