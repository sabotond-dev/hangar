// Every sentence the tuning panel can say, held character for character against
// the documents that author it: the Bible (section 7) and its PDF, 13-18-BATCH.md
// row F.11, and the register (13-CONTEXT D-05) for everything HANGAR wrote - so a
// string cannot be paraphrased, reflowed or "improved" without a red run naming
// it. The measured caps are retired by name (test 5): the five numbers this file
// held (HONESTY_CAP 86, SURPRISE_ALL_HELD 53, the lock's 4 / 4, the mix family's
// 7 / 75 / 8 / 8, the forecast's 44) are asserted absent as assertions and present,
// by name with their number, in copy.ts's retirement ledger. The rules that stayed
// are asserted where they always were: the U+2212 scope, the lock's state in its
// accessible name, the reason naming the state and never the control.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as copy from "./copy";
import {
  COLOUR_BLUE_RAIL,
  COLOUR_CAPTION,
  COLOUR_CHEAP_STEPS,
  COLOUR_GREEN_RAIL,
  COLOUR_RED_RAIL,
  COLOUR_UNAFFORDABLE,
  COLOUR_WHICH,
  colourRailName,
  DESTRUCTIVE_CONFIRMATIONS,
  EMPTY_RACK,
  KNOB_HELD,
  KNOB_HOLD,
  LINK_COPIED,
  LINK_COPIED_ANNOUNCEMENT,
  MEASURING,
  SETUP_CAPTION,
  SURPRISE_ALL_HELD,
  SHARE_FALLBACK_FIELD_NAME,
  SHARE_FALLBACK_LINE,
  STAMP_RESTORED,
  TIMER_CAPTION,
  TUNING_CAPTION,
  TURN_IT_DOWN,
  backOffKnob,
  backOffLadder,
  emptyTimerExpansion,
  forecastDelta,
  forecastExpansion,
  ladderLine,
  liveBackInside,
  liveOverBudget,
  liveRandomised,
  liveReset,
  liveResetOver,
  liveResetOverBoth,
  lowerFirst,
  meterExpansion,
  meterNumerals,
  meterPercent,
  ogAlt,
  overBudgetArrived,
  overBudgetArrivedBoth,
  overBudgetKnob,
  overBudgetKnobBoth,
  stampOlder,
  stampUnreadable,
  tryOnBudgetReason,
} from "./copy";
import { RANDOMIZE, RESET_SETTINGS, SHARE_SNAPSHOT } from "./inspector-copy";
import { stripComments } from "../../test-support/source";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

const copySource = () => read("./copy.ts");

/**
 * The documents that author the words, read from disk: src/lib/tune/ is
 * three levels below the root. Each is checked for length and for a heading
 * before it is searched, because a containment check over a document that
 * failed to load is a gate that passes everything.
 */
const DOCUMENTS: readonly { path: string; heading: string; atLeast: number }[] =
  [
    {
      path: "../../../.planning/phases/13-gui-overhaul/bible/HANGAR-ZONA-GUI-design-specification.md",
      heading: "### Randomization",
      atLeast: 30_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-18-BATCH.md",
      heading: "## F. The workspace",
      atLeast: 60_000,
    },
    {
      path: "../../../.planning/phases/13-gui-overhaul/13-CONTEXT.md",
      heading: "## D-23 [user] The copy batch approved as proposed",
      atLeast: 20_000,
    },
  ];

const documents = () => DOCUMENTS.map(({ path }) => read(path));

/**
 * U+2212 MINUS SIGN and U+002D HYPHEN-MINUS, both named by escape rather than
 * pasted.
 *
 * The escapes are load-bearing: this file asserts that the U+2212 GLYPH occurs
 * exactly once in the whole of src/, and a pasted one here would be the second
 * occurrence and would make the assertion assert nothing.
 */
const MINUS = "\u2212";
const HYPHEN = "-";

/** Every file under src/, minus the vendored tree, in a stable order. */
function everySourceFile(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      // src/vendor/ is BOTOR's, may never be edited (D-04), and is not
      // HANGAR's copy - so it is not this contract's to police.
      if (entry.name === "vendor") continue;
      everySourceFile(path, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

/** Assembled, never written: the engine name that appears in no string and no comment. */
const ENGINE = ["Chrom", "ium"].join("");

/**
 * Assembled: Phase 10's register, which no string may carry any more - its
 * uppercase labels, in the order the panel showed them - and the mix family's
 * three, which no file under src/ may carry in code at all.
 */
const RETIRED_LABELS = [
  ["SURPRISE ", "ME"].join(""),
  ["RESET ", "ALL"].join(""),
  ["COPY ", "LINK"].join(""),
  ["LINK ", "COPIED"].join(""),
  ["TURN IT ", "DOWN"].join(""),
  ["TRY ON ", "DEVICE"].join(""),
];
const MIX_STRINGS = [
  ["MIX ", "TWO"].join(""),
  ["THIS ", "ONE"].join(""),
  ["THAT ", "ONE"].join(""),
];
/** The mix family's five exports, by name, which the module must not export. */
const MIX_EXPORTS = [
  "MIX_TWO",
  "MIX_LINE",
  "MIX_THIS",
  "MIX_THAT",
  "mixChildName",
];
/** The three Phase 10 exports whose Bible lines live in inspector-copy.ts. */
const MOVED_EXPORTS = ["SURPRISE_ME", "RESET_ALL", "COPY_LINK"];
/**
 * Assembled, matched without case as a WORD: the site's own noun for what a
 * visitor turns, which the register replaces with the Bible's "setting"
 * (PDF page 5: Reset settings). Fine as an identifier; wrong in a sentence.
 */
const RETIRED_NOUN = new RegExp(["kno", "bs?"].join("") + "\\b", "i");

/**
 * The compiler writes its ladder labels as whole sentences. This one has a
 * proper noun in its second word on purpose: a naive `toLowerCase()` would
 * flatten it and the lower-casing tests would go red, which is exactly what
 * they are for.
 */
const LADDER_LABEL = "Stop drawing the ZONA control on the pad";

/** The catalog's sentence-case name (D-14 Q11b), as the samples read. */
const NAME = "Euclid";

/**
 * One sample input per builder, so test 2 can put every builder's OUTPUT
 * through the copy rules rather than only the constants.
 *
 * A builder with no entry here fails test 2 by name, so a sentence added later
 * cannot quietly escape the rules.
 */
const SAMPLES: Readonly<Record<string, readonly unknown[]>> = {
  meterNumerals: [702],
  meterPercent: [77],
  meterExpansion: ["Setup", 702, 77],
  emptyTimerExpansion: [],
  forecastDelta: [-3],
  forecastExpansion: ["Setup", 714],
  colourRailName: ["r", "Mute"],
  lowerFirst: [LADDER_LABEL],
  ladderLine: [1, LADDER_LABEL],
  overBudgetKnob: ["Trail", "Setup", 33],
  overBudgetKnobBoth: ["Trail", 33, 12],
  overBudgetArrived: ["Timer", 33],
  overBudgetArrivedBoth: [33, 12],
  backOffKnob: ["Trail", "Setup", 702],
  backOffLadder: [LADDER_LABEL, "Setup", 702],
  tryOnBudgetReason: ["Setup and Timer"],
  stampOlder: [NAME],
  stampUnreadable: [NAME],
  liveOverBudget: ["Setup", 33, "Trail"],
  liveBackInside: ["Timer"],
  liveRandomised: [6, 702, 218],
  liveReset: [702, 218],
  liveResetOver: ["Setup", 33],
  liveResetOverBoth: [33, 12],
  ogAlt: [NAME],
};

/** Every string the module can produce, named, for the mechanical rules. */
const everyString = () => {
  const out: { name: string; text: string }[] = [];
  for (const [name, value] of Object.entries(copy)) {
    if (typeof value === "string") {
      out.push({ name, text: value });
    } else if (typeof value === "function") {
      const args = SAMPLES[name];
      expect(args, `no sample input is declared for ${name}`).toBeDefined();
      const build = value as (...a: readonly unknown[]) => string;
      out.push({ name, text: build(...args) });
    }
  }
  return out;
};

/** Sentence case: an initial capital and no run of two or more capitals after it. */
const sentenceCase = (text: string) =>
  /^[A-Z]/.test(text) && !/[A-Z]{2,}/.test(text);

describe("the tuning panel's copy (src/lib/tune/copy.ts)", () => {
  it("the labels and captions: the Bible's lines where 13-09 put them, the batch's as approved, the retired ones gone, and the captions the short labels D-05 permits", () => {
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
    const d23 = context.slice(context.indexOf(DOCUMENTS[2].heading));
    expect(d23, "D-23 records the answer").toContain('> *"approve"*');

    // THE THREE CONTROLS THE BIBLE NAMES are inspector-copy.ts's since 13-09,
    // verbatim from PDF page 5 and section 7, and this module does NOT carry
    // a second copy of any of them. Section 7 is read for the one of the
    // three it writes in prose.
    const randomization = bible.slice(bible.indexOf("### Randomization"));
    expect(randomization, "section 7 labels the control").toContain(
      `Label it **${RANDOMIZE}**`,
    );
    expect(randomization, "section 7 permits parameter locks").toContain(
      "allow parameter locks only when",
    );
    expect(RANDOMIZE).toBe("Randomize");
    expect(RESET_SETTINGS).toBe("Reset settings");
    expect(SHARE_SNAPSHOT).toBe("Share snapshot");
    const exported = new Set(Object.keys(copy));
    for (const name of MOVED_EXPORTS) {
      expect(
        exported.has(name),
        `${name} is exported again - its Bible line is inspector-copy.ts's, and a second copy is the drift the header forbids`,
      ).toBe(false);
    }

    // THE BATCH'S ONE ROW FOR THIS MODULE, F.11, approved by D-23: the
    // proposal column carries the string in backticks, and the module carries
    // it character for character.
    const f11 = batch.split("\n").find((line) => line.startsWith("| F.11 |"));
    expect(f11, "batch row F.11 is in the document").toBeDefined();
    expect(f11, "F.11 proposes the share control's confirmed label").toContain(
      `\`${LINK_COPIED}\``,
    );
    expect(f11, "F.11 hands the row to this module").toContain(
      "src/lib/tune/copy.ts",
    );
    expect(LINK_COPIED).toBe("Link copied");

    // THE LOCK: section 7's noun in sentence case, off and on. The state is
    // in the WORD, so it is in the accessible name and not only in
    // aria-pressed (10-UI-SPEC 15, kept). No width rule: the header's
    // retirement moved that invariant into the two .lock rules.
    expect(KNOB_HOLD).toBe("Lock");
    expect(KNOB_HELD).toBe("Locked");
    expect(
      KNOB_HOLD,
      "the two labels are the same word, so the state of the lock is not in its accessible name",
    ).not.toBe(KNOB_HELD);

    // The back-off control: a verb on a button, sentence case, and never the
    // device band's `Put back` wearing another case.
    expect(TURN_IT_DOWN).toBe("Turn it down");
    expect(TURN_IT_DOWN.toLowerCase()).not.toContain("put");

    // EVERY BUTTON LABEL IS SENTENCE CASE (D-05): an initial capital, no
    // shouted word after it. The four captions are the short section labels
    // D-05 permits in uppercase, and they are one word each.
    for (const label of [TURN_IT_DOWN, LINK_COPIED, KNOB_HOLD, KNOB_HELD]) {
      expect(sentenceCase(label), `${label} is not sentence case`).toBe(true);
    }
    const captions = [
      TUNING_CAPTION,
      SETUP_CAPTION,
      TIMER_CAPTION,
      COLOUR_CAPTION,
    ];
    expect(TUNING_CAPTION).toBe("TUNING");
    expect(SETUP_CAPTION).toBe("SETUP");
    expect(TIMER_CAPTION).toBe("TIMER");
    expect(COLOUR_CAPTION).toBe("COLOUR");
    for (const caption of captions) {
      expect(caption, caption).toBe(caption.toUpperCase());
      expect(
        caption.split(" "),
        `${caption} is more than one word`,
      ).toHaveLength(1);
    }

    // THE PICKER'S SEVEN STRINGS, CHARACTER FOR CHARACTER (plan 10-10). They
    // were already in the register and did not move; their COUNTS are
    // colour-picker.spec.ts's, beside the picker they belong to.
    expect(COLOUR_WHICH).toBe("Which colour");
    expect(COLOUR_RED_RAIL).toBe("Red, 16 steps");
    expect(COLOUR_GREEN_RAIL).toBe("Green, 16 steps");
    expect(COLOUR_BLUE_RAIL).toBe("Blue, 16 steps");
    expect(COLOUR_CHEAP_STEPS).toBe("Marked steps cost the fewest characters.");
    expect(COLOUR_UNAFFORDABLE).toBe(
      "The colours left out would not fit inside 908 characters.",
    );
    // The prefixed rail name is COMPOSED and never written down, the same way
    // `ladderLine` lower-cases the compiler's own label - first character
    // only, so a proper noun in a label survives.
    expect(colourRailName("r")).toBe(COLOUR_RED_RAIL);
    expect(colourRailName("r", "Mute")).toBe("Mute red, 16 steps");
    expect(colourRailName("g", "Rail")).toBe("Rail green, 16 steps");
    expect(
      colourRailName("b", "Level"),
      "the prefixed form is a literal rather than a composition",
    ).toBe("Level blue, 16 steps");

    // THE MIX FAMILY IS GONE BY NAME (D-12; 13-10 left it, 13-19 closes it):
    // the five exports are absent, the header retires them by identifier,
    // and none of the three uppercase strings appears in the CODE of any
    // file under src/ - so a component cannot have kept a transcription.
    const raw = copySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    for (const name of MIX_EXPORTS) {
      expect(exported.has(name), `${name} is still exported`).toBe(false);
      expect(raw.includes(name), `${name} is deleted without being named`).toBe(
        true,
      );
    }
    expect(raw).toContain("THE MIX FAMILY IS GONE BY NAME, 2026-09-12");
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const carriers: string[] = [];
    for (const file of everySourceFile(root)) {
      if (!/[.](ts|svelte|css|js|json|html)$/.test(file)) continue;
      const code = stripComments(readFileSync(file, "utf8"));
      for (const text of MIX_STRINGS) {
        if (code.includes(`"${text}"`)) carriers.push(`${file}: ${text}`);
      }
    }
    expect(
      carriers.map((each) => each.split(root).join("src")),
      "a mix string is still in the code of src/",
    ).toEqual([]);

    // TUNING is Phase 4's caption. From 13-09 to 13.1-06 the region imported
    // it as the fourth group's heading; since 13.1-07 the group is hidden by
    // the user's word (13.1-CONTEXT D-10: "TUNING, so code limit
    // visualiztation should be removed, lets not show that") and the region
    // neither imports nor transcribes it - the caption stays here, exported,
    // as the meter family's word (the header says why the family stays).
    const region = stripComments(read("../ui/TuningRegion.svelte"));
    expect(region, "the region was read").not.toBe("");
    expect(
      region,
      "TuningRegion.svelte imports the TUNING caption again - the fourth group is hidden by the user's word (13.1-07, D-10)",
    ).not.toContain("TUNING_CAPTION");
    expect(
      region,
      "TuningRegion.svelte transcribes the TUNING caption, which is the drift this assertion exists to prevent",
    ).not.toContain(`"${TUNING_CAPTION}"`);
  });

  it("obeys the register mechanically, over every string and every builder's output: the punctuation, the case, the engine, the retired words", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the module was actually read - too few strings to be checking anything",
    ).toBeGreaterThanOrEqual(25);

    const APOSTROPHE = String.fromCharCode(39);
    /** Uppercase runs of two or more letters inside a sentence: names and one initialism only. */
    const ACRONYMS = new Set(["ZONA", "HANGAR", "MIDI"]);
    const CAPTIONS = new Set([
      "TUNING_CAPTION",
      "SETUP_CAPTION",
      "TIMER_CAPTION",
      "COLOUR_CAPTION",
    ]);

    for (const { name, text } of strings) {
      expect(text, `${name} is empty`).not.toBe("");
      expect(text, `${name} carries an emoji`).not.toMatch(
        /\p{Extended_Pictographic}/u,
      );
      expect(text, `${name} carries an exclamation mark`).not.toContain("!");
      expect(text, `${name} carries a straight apostrophe`).not.toContain(
        APOSTROPHE,
      );
      expect(text, `${name} carries a three-dot ellipsis`).not.toContain("...");
      expect(text, `${name} has a hyphen for a dash`).not.toContain(" -- ");
      expect(text, `${name} says Error`).not.toMatch(/error/i);
      expect(text, `${name} says loading`).not.toMatch(/loading/i);
      expect(text.includes(ENGINE), `${name} names an engine`).toBe(false);
      // THE FIFTH PERMITTED CHARACTER, WITH ITS SCOPE ASSERTED BESIDE IT.
      // U+2212 is permitted in forecastDelta's signed numeral and in no other
      // string this module can produce.
      if (name !== "forecastDelta") {
        expect(
          text,
          `${name} carries U+2212, which is permitted in the forecast delta and nowhere else`,
        ).not.toContain(MINUS);
      }
      // NO UPPERCASE PARAGRAPHS (D-05): outside the four one-word captions, a
      // run of capitals is a name or MIDI, never a shouted word.
      if (!CAPTIONS.has(name)) {
        for (const run of text.match(/[A-Z]{2,}/g) ?? []) {
          expect(ACRONYMS.has(run), `${name} shouts "${run}"`).toBe(true);
        }
      }
      // NO RETIRED REGISTER: Phase 10's uppercase labels are gone from every
      // string, prose included, and so is its noun for a setting.
      for (const word of RETIRED_LABELS) {
        expect(
          text.includes(word),
          `${name} carries Phase 10's "${word}"`,
        ).toBe(false);
      }
      expect(
        RETIRED_NOUN.test(text),
        `${name} says "knob" where the Bible says setting`,
      ).toBe(false);
    }

    // THE REAL PUNCTUATION IS PRESENT - a POSITIVE test since D-05, because
    // the register is contractions with real apostrophes, not the absence of
    // typewriter ones. At least four across the module, a real ellipsis and a
    // real em dash.
    const all = strings.map((s) => s.text).join(" ");
    const contractions = all.match(/[a-zA-Z]’(?:t|s|ll|re|ve)\b/g) ?? [];
    expect(
      contractions.length,
      "real apostrophes in real contractions",
    ).toBeGreaterThanOrEqual(4);
    expect(all.includes(String.fromCharCode(0x2026)), "a real ellipsis").toBe(
      true,
    );
    expect(all.includes(String.fromCharCode(0x2014)), "a real em dash").toBe(
      true,
    );

    // NO CONTROL LABEL PARAPHRASED IN PROSE: the one string that names a
    // control names it exactly as the control reads, and no string re-cases
    // any of the panel's three Bible labels. Matched as a WHOLE word: the
    // register's own verb ("randomized", "apply") is not the control.
    for (const { name, text } of strings) {
      for (const label of [RANDOMIZE, RESET_SETTINGS, SHARE_SNAPSHOT]) {
        const asWord = new RegExp(`\\b${label}\\b`, "i");
        if (asWord.test(text)) {
          expect(text, `${name} re-cases ${label}`).toContain(label);
        }
      }
    }
    expect(STAMP_RESTORED).toContain(RESET_SETTINGS);

    // And the engine appears nowhere in the file at all, comments included.
    expect(copySource().includes(ENGINE), "copy.ts names an engine").toBe(
      false,
    );
  });

  it("writes the meter strings and the forecast, with the fifth character in its one place", () => {
    expect(meterNumerals(702)).toBe("702 / 908");
    expect(meterNumerals(941)).toBe("941 / 908");
    expect(meterPercent(77)).toBe("77%");
    expect(meterPercent(104)).toBe("104%");
    expect(MEASURING).toBe("measuring…");
    expect(meterExpansion("Setup", 702, 77)).toBe(
      "Setup uses 702 of 908 characters, 77 per cent.",
    );
    expect(meterExpansion("Timer", 218, 24)).toBe(
      "Timer uses 218 of 908 characters, 24 per cent.",
    );
    expect(emptyTimerExpansion()).toBe(
      "Timer uses 0 of 908 characters. This configuration has no timer.",
    );
    // METERS_UNAVAILABLE IS RETIRED BY NAME (13.1-07, D-10, W-14): the Body
    // line that replaced the meters when the formatter never resolved lost
    // its one reader when the workspace's meters were hidden. Not exported,
    // and the header says why the state it named is not left silent.
    expect(
      Object.keys(copy).includes("METERS_UNAVAILABLE"),
      "METERS_UNAVAILABLE is exported again - it was retired by name at 13.1-07 with the workspace's meters (D-10), and its header paragraph says what carries the state it named",
    ).toBe(false);
    expect(
      copySource(),
      "copy.ts's header no longer retires METERS_UNAVAILABLE by name",
    ).toContain("METERS_UNAVAILABLE IS RETIRED BY NAME");

    // THE FORECAST rides inside the meter test because it IS a meter string:
    // the delta is what the bar would read and the expansion says so in
    // words.
    expect(forecastDelta(6)).toBe("+6");
    expect(forecastDelta(3)).toBe("+3");
    expect(forecastDelta(0), "a zero delta is bare, never signed").toBe("0");

    // THE FIFTH PERMITTED CHARACTER, ASSERTED IN BOTH DIRECTIONS AND ASSERTED
    // FIRST, because a wrong sign fails both and a failure that names the two
    // codepoints is worth more than one that prints two glyphs a reader has
    // to tell apart.
    expect(
      forecastDelta(-3),
      "the delta writes U+002D HYPHEN-MINUS instead of U+2212 MINUS SIGN",
    ).not.toContain(HYPHEN);
    expect(
      forecastDelta(-3),
      "the delta does not carry U+2212 MINUS SIGN at all",
    ).toContain(MINUS);
    expect(
      forecastDelta(6),
      "a positive delta reaches for U+2212 as well, which is not a sign at all",
    ).not.toContain(MINUS);
    expect(forecastDelta(-3)).toBe(`${MINUS}3`);
    expect(forecastDelta(-12)).toBe(`${MINUS}12`);

    // AND THE SCOPE, WHICH IS THE OTHER HALF OF PERMITTING A CHARACTER.
    // Exactly one occurrence of the glyph in the CODE of the whole of src/,
    // comments stripped - so the permission cannot spread one paste at a time.
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const carriers: string[] = [];
    let scanned = 0;
    for (const file of everySourceFile(root)) {
      if (!/[.](ts|svelte|css|js|json|html)$/.test(file)) continue;
      scanned++;
      const count = stripComments(readFileSync(file, "utf8")).split(
        MINUS,
      ).length;
      if (count > 1) carriers.push(`${file} x${count - 1}`);
    }
    expect(scanned, "src/ was actually walked").toBeGreaterThan(100);
    expect(
      carriers.map((each) => each.split(root).join("src")),
      "U+2212 is permitted in the forecast delta and nowhere else, and it has appeared somewhere else",
    ).toEqual(["src/lib/tune/copy.ts x1"]);

    // The hidden expansion, identical in shape for either event word. Its
    // length is not asserted any more (test 5).
    expect(forecastExpansion("Setup", 714)).toBe(
      "Choosing this would put Setup at 714 of 908.",
    );
    expect(forecastExpansion("Timer", 218)).toBe(
      "Choosing this would put Timer at 218 of 908.",
    );
  });

  it("the fit ladder keeps TUNE-04's fact - something was turned down, and WHICH - and lower-cases only the label's first character", () => {
    expect(lowerFirst(LADDER_LABEL)).toBe(
      "stop drawing the ZONA control on the pad",
    );
    expect(lowerFirst(LADDER_LABEL)).not.toBe(LADDER_LABEL.toLowerCase());
    expect(lowerFirst("")).toBe("");

    expect(ladderLine(1, LADDER_LABEL)).toBe(
      "One thing was turned down to stay inside 908 characters: stop drawing the ZONA control on the pad.",
    );
    expect(ladderLine(3, LADDER_LABEL)).toBe(
      "3 things were turned down to stay inside 908 characters, starting with stop drawing the ZONA control on the pad.",
    );

    // THE FACT, ASSERTED AS A FACT AND NOT AS A STRING (TUNE-04): whatever
    // the words, every form of the line names the budget it stayed inside,
    // says that something was turned down, and carries the compiler's own
    // label for WHICH - lower-cased at its first character and otherwise
    // untouched - and the several-step form carries the count. A line that
    // dropped the label would keep half the fact and go red here by name.
    const labels = [
      LADDER_LABEL,
      "Drop the heart's second colour",
      "Shorten the trail",
    ];
    for (const label of labels) {
      for (const steps of [1, 2, 3, 7]) {
        const line = ladderLine(steps, label);
        expect(line, `ladderLine(${steps}) names the budget`).toContain("908");
        expect(line, `ladderLine(${steps}) says what happened`).toMatch(
          /turned down/,
        );
        expect(
          line,
          `ladderLine(${steps}) does not say WHICH feature was trimmed`,
        ).toContain(lowerFirst(label));
        if (label === LADDER_LABEL) {
          expect(
            line,
            `ladderLine(${steps}) flattens the proper noun in the compiler's label`,
          ).not.toContain(LADDER_LABEL.toLowerCase());
        }
        if (steps > 1) {
          expect(line, `ladderLine(${steps}) drops the count`).toContain(
            String(steps),
          );
        }
      }
    }
  });

  it("writes the four over-budget sentences, both back-off lines and the primary control's reason, and the measured caps are retired by name", () => {
    expect(overBudgetKnob("Trail", "Setup", 33)).toBe(
      "Trail pushed Setup 33 characters over 908.",
    );
    expect(overBudgetKnobBoth("Trail", 33, 12)).toBe(
      "Trail pushed both events over 908: Setup by 33 characters, Timer by 12.",
    );
    expect(overBudgetArrived("Timer", 33)).toBe(
      "This configuration starts 33 characters over 908 on Timer.",
    );
    expect(overBudgetArrivedBoth(33, 12)).toBe(
      "This configuration starts over 908 on both events: Setup by 33 characters, Timer by 12.",
    );

    expect(backOffKnob("Trail", "Setup", 702)).toBe(
      "Puts Trail back where it was, and Setup at 702 of 908.",
    );
    // The ladder label OPENS this sentence, so it keeps the compiler's own
    // capital where the two ladder lines lower-case it.
    expect(backOffLadder(LADDER_LABEL, "Setup", 702)).toBe(
      "Stop drawing the ZONA control on the pad. Puts Setup at 702 of 908.",
    );

    // The reason beside a disabled Apply to ZONA: the budget, the event, and
    // the way back. The three forms move together because the interpolation
    // sits inside one sentence.
    expect(tryOnBudgetReason("Setup")).toBe(
      "Over the 908-character budget on Setup. Turn something down to apply it.",
    );
    expect(tryOnBudgetReason("Timer")).toBe(
      "Over the 908-character budget on Timer. Turn something down to apply it.",
    );
    expect(tryOnBudgetReason("Setup and Timer")).toBe(
      "Over the 908-character budget on Setup and Timer. Turn something down to apply it.",
    );

    // The other disabled control's reason. It names the STATE and never the
    // control directly above it, and it carries both facts 13-10's scope
    // rule gave it: everything Randomize could change is locked, and the
    // MIDI settings are outside its reach.
    expect(SURPRISE_ALL_HELD).toBe(
      "Everything that can be randomized is locked. MIDI settings are never randomized.",
    );
    expect(SURPRISE_ALL_HELD).not.toContain(RANDOMIZE);
    expect(SURPRISE_ALL_HELD).toContain("MIDI");
    expect(SURPRISE_ALL_HELD.toLowerCase()).toContain(KNOB_HELD.toLowerCase());

    // THE MEASURED CAPS ARE RETIRED BY NAME, NOT LEFT AT A VALUE NOTHING
    // CHECKS. Each is present, with its number, in copy.ts's retirement
    // paragraph, which has to say what it measured and what superseded it;
    // and the one that lived in another module is named as that module's.
    const raw = copySource();
    expect(raw.length, "the source was actually read").toBeGreaterThan(4000);
    expect(raw).toContain("THE MEASURED CAPS ARE RETIRED BY NAME, 2026-09-12");
    expect(raw).toContain("HONESTY_CAP (86)");
    expect(raw).toContain("CH_PER_LINE, the 43");
    expect(raw).toContain("SURPRISE_ALL_HELD's 53");
    expect(raw).toContain("KNOB_HOLD / KNOB_HELD at 4 / 4");
    expect(raw).toContain("MIX_TWO 7, MIX_LINE 75, MIX_THIS / MIX_THAT 8 / 8");
    expect(raw).toContain("forecastExpansion's 44");
    expect(raw).toContain("D-05");
    // And the invariant the 4 / 4 rule carried is where the header says it
    // went: a fixed inline-size on both .lock rules, wider than the 44px
    // floor, so toggling the word cannot move the column.
    for (const component of ["Knob.svelte", "ColourPicker.svelte"]) {
      const styles = read(`../ui/${component}`);
      const lock = styles.slice(styles.indexOf("\n  .lock {"));
      const body = lock.slice(0, lock.indexOf("}"));
      expect(body, `${component}'s .lock rule was found`).toContain(
        "min-inline-size: 44px",
      );
      const fixed = /inline-size: (\d+)px;/.exec(
        body.replace("min-inline-size: 44px", ""),
      );
      expect(
        fixed,
        `${component}'s .lock declares no fixed inline-size`,
      ).not.toBeNull();
      expect(
        Number(fixed?.[1]),
        `${component}'s .lock is narrower than its 44px floor`,
      ).toBeGreaterThan(44);
    }
  });

  it("writes the stamp landings with SHARE-03's fact, the share lines and every live-region string, and imports nothing", () => {
    expect(STAMP_RESTORED).toBe(
      "These settings came with the link. Reset settings returns the configuration to its defaults.",
    );
    expect(stampOlder(NAME)).toBe(
      "This link was made with an older version of HANGAR. Its settings couldn’t be read, so this is Euclid at its defaults.",
    );
    expect(stampUnreadable(NAME)).toBe(
      "That link’s settings couldn’t be read, so this is Euclid at its defaults.",
    );
    // SHARE-03's FACT, as a fact: the older landing says it was an older
    // version and names the configuration it landed on; the unreadable one
    // names the configuration and does NOT claim an older version, because
    // saying so of a corrupted stamp would be a small lie.
    expect(stampOlder(NAME)).toMatch(/older version/);
    expect(stampOlder(NAME)).toContain(NAME);
    expect(stampUnreadable(NAME)).not.toMatch(/older/);
    expect(stampUnreadable(NAME)).toContain(NAME);
    // The name is interpolated raw: a re-cased name would be a second
    // opinion about a string the catalog owns (D-14 Q11b).
    expect(stampOlder("Radar points")).toContain("Radar points");

    expect(EMPTY_RACK).toBe(
      "This configuration has no settings to change. Its two budgets below are still live.",
    );
    // SHARE_QUIET_LINE was asserted here. R-07 retires it outright, with no
    // replacement, because the share control names itself. Its absence is
    // asserted rather than merely uncommented: a re-added constant would
    // otherwise ship a second sentence beneath a labelled button.
    expect(
      Object.keys(copy),
      "SHARE_QUIET_LINE came back - it is retired by R-07 and the share control names itself",
    ).not.toContain("SHARE_QUIET_LINE");
    expect(SHARE_FALLBACK_LINE).toBe(
      "Your browser wouldn’t let the page copy for you. The link is selected below — press Ctrl+C, or Cmd+C on a Mac.",
    );
    expect(SHARE_FALLBACK_FIELD_NAME).toBe("Snapshot link");

    expect(liveOverBudget("Setup", 33, "Trail")).toBe(
      "Setup is now 33 characters over the 908-character budget. Trail pushed it over.",
    );
    expect(liveOverBudget("Setup", 33)).toBe(
      "Setup is now 33 characters over the 908-character budget.",
    );
    expect(liveBackInside("Timer")).toBe(
      "Timer is back inside the 908-character budget.",
    );
    expect(liveRandomised(6, 702, 218)).toBe(
      "6 settings randomized. Setup 702 of 908, Timer 218 of 908.",
    );
    expect(liveReset(702, 218)).toBe(
      "Settings back to their defaults. Setup 702 of 908, Timer 218 of 908.",
    );
    // Reset settings can land on defaults that are already over budget, so
    // the command and the crossing are ONE utterance, never two.
    expect(liveResetOver("Setup", 33)).toBe(
      "Settings back to their defaults. Setup is 33 characters over the 908-character budget.",
    );
    expect(liveResetOverBoth(33, 12)).toBe(
      "Settings back to their defaults. Both events are over the 908-character budget: Setup by 33 characters, Timer by 12.",
    );
    expect(LINK_COPIED_ANNOUNCEMENT).toBe("Link copied to the clipboard.");
    expect(ogAlt(NAME)).toBe(
      "The Euclid configuration running on a ZONA’s 9 by 9 pad.",
    );

    // The contract's last row: this panel writes nothing to any module and
    // destroys nothing recoverable, so there is no confirmation copy at all.
    expect(DESTRUCTIVE_CONFIRMATIONS).toEqual([]);

    const code = stripComments(copySource());
    expect(code, "the file was actually read").toContain(
      "export const TURN_IT_DOWN",
    );
    expect(code).not.toContain('from "');
    expect(code).not.toContain("from '");
    expect(code).not.toContain("import(");
    expect(code).not.toContain("require(");
  });
});
