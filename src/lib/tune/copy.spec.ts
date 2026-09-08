// Every sentence this phase can say, asserted character-for-character against
// 05-UI-SPEC's Copywriting Contract.
//
// The table in that document IS the specification. These tests exist so that a
// string cannot be paraphrased, reflowed, re-punctuated or "improved" without
// a red run naming it - which is the only mechanism that keeps one copy of a
// sentence one copy.
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
  COPY_LINK,
  DESTRUCTIVE_CONFIRMATIONS,
  EMPTY_RACK,
  KNOB_HELD,
  KNOB_HOLD,
  LINK_COPIED,
  LINK_COPIED_ANNOUNCEMENT,
  MEASURING,
  METERS_UNAVAILABLE,
  MIX_LINE,
  MIX_THAT,
  MIX_THIS,
  MIX_TWO,
  mixChildName,
  RESET_ALL,
  SETUP_CAPTION,
  SURPRISE_ALL_HELD,
  SHARE_FALLBACK_FIELD_NAME,
  SHARE_FALLBACK_LINE,
  STAMP_RESTORED,
  SURPRISE_ME,
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

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

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

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const stripComments = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/**
 * A-15's forbidden vocabulary, each word with the reason it is forbidden, so a
 * red run explains itself rather than printing a banned list.
 *
 * `child` is on it as USER-FACING TEXT and is permitted as an identifier:
 * `mix.ts` and `MixTwo.svelte` both use it, and the scan that reads this list
 * reads rendered strings and never code.
 *
 * The match is by STEM, so `gene` already covers `genetic` and `genetics`, and
 * `mutate` covers `mutated`. Both nouns are listed anyway - `mutation` does not
 * begin with `mutate` - and a root that subsumes another costs nothing.
 *
 * NINE ROOTS RATHER THAN ONE ALTERNATION, because the failure message has to
 * say WHICH word was found and in what form: "the copy matches
 * /breed|parent|…/" is a rule restated, not a finding.
 */
const GENETICS: ReadonlyArray<readonly [string, string]> = [
  ["breed", "the mechanism, named where the result should be"],
  ["parent", "the two slots are two candidates, and the screen shows them"],
  ["mutate", "a knob was redrawn; that is a sentence anybody can read"],
  ["mutation", "the noun form of the same borrowed word"],
  ["dna", "there is no DNA here, there is an index vector"],
  ["gene", "the metaphor's root"],
  ["genetic", "the metaphor by its own name"],
  ["offspring", "four results, and they are on the screen"],
  ["child", "fine as an identifier, wrong on a button"],
];

/**
 * The compiler writes its ladder labels as whole sentences. This one has a
 * proper noun in its second word on purpose: a naive `toLowerCase()` would
 * flatten it and the lower-casing tests would go red, which is exactly what
 * they are for.
 */
const LADDER_LABEL = "Stop drawing the ZONA control on the pad";

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
  mixChildName: [["Speed 3", "Colour 214 255 78"]],
  lowerFirst: [LADDER_LABEL],
  ladderLine: [1, LADDER_LABEL],
  overBudgetKnob: ["Trail", "Setup", 33],
  overBudgetKnobBoth: ["Trail", 33, 12],
  overBudgetArrived: ["Timer", 33],
  overBudgetArrivedBoth: [33, 12],
  backOffKnob: ["Trail", "Setup", 702],
  backOffLadder: [LADDER_LABEL, "Setup", 702],
  tryOnBudgetReason: ["Setup and Timer"],
  stampOlder: ["EUCLID"],
  stampUnreadable: ["EUCLID"],
  liveOverBudget: ["Setup", 33, "Trail"],
  liveBackInside: ["Timer"],
  liveRandomised: [6, 702, 218],
  liveReset: [702, 218],
  liveResetOver: ["Setup", 33],
  liveResetOverBoth: [33, 12],
  ogAlt: ["EUCLID"],
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

describe("the tuning panel's copy (src/lib/tune/copy.ts)", () => {
  it("uppercases every button label and caption, and keeps captions to one word", () => {
    // The rule is "button labels, and captions of at most two words". TURN IT
    // DOWN is three words and it is a BUTTON LABEL, which the rule permits, so
    // the two lists are asserted separately rather than by a word count that
    // would forbid it.
    const buttonLabels = [
      SURPRISE_ME,
      RESET_ALL,
      TURN_IT_DOWN,
      COPY_LINK,
      LINK_COPIED,
      KNOB_HOLD,
      KNOB_HELD,
      MIX_TWO,
    ];
    const captions = [
      TUNING_CAPTION,
      SETUP_CAPTION,
      TIMER_CAPTION,
      COLOUR_CAPTION,
      MIX_THIS,
      MIX_THAT,
    ];

    expect(SURPRISE_ME).toBe("SURPRISE ME");
    expect(RESET_ALL).toBe("RESET ALL");
    expect(TURN_IT_DOWN).toBe("TURN IT DOWN");
    expect(COPY_LINK).toBe("COPY LINK");
    expect(LINK_COPIED).toBe("LINK COPIED");

    // T1's toggle. The two labels are the SAME LENGTH on purpose - toggling a
    // lock must not reflow the row it sits at the end of - and the state is in
    // the word rather than only in aria-pressed, which is what makes it part
    // of the accessible name (10-UI-SPEC 15).
    expect(KNOB_HOLD).toBe("HOLD");
    expect(KNOB_HELD).toBe("HELD");
    expect([...KNOB_HOLD].length, "the lock's off label is 4").toBe(4);
    expect([...KNOB_HELD].length, "the lock's on label is 4").toBe(4);
    expect(
      KNOB_HOLD,
      "the two labels are the same word, so the state of the lock is not in its accessible name",
    ).not.toBe(KNOB_HELD);
    expect(TUNING_CAPTION).toBe("TUNING");
    expect(SETUP_CAPTION).toBe("SETUP");
    expect(TIMER_CAPTION).toBe("TIMER");
    expect(COLOUR_CAPTION).toBe("COLOUR");

    // -----------------------------------------------------------------------
    // THE PICKER'S SEVEN STRINGS, CHARACTER FOR CHARACTER (10-UI-SPEC §11.2,
    // plan 10-10). They ride inside this test rather than becoming an eighth
    // because what they are is a caption plus six sentences, and this file's
    // job is to hold each of them to the contract's own words. Their COUNTS
    // are asserted in colour-picker.spec.ts, beside the picker they belong to.
    expect(COLOUR_WHICH).toBe("Which colour");
    expect(COLOUR_RED_RAIL).toBe("Red, 16 steps");
    expect(COLOUR_GREEN_RAIL).toBe("Green, 16 steps");
    expect(COLOUR_BLUE_RAIL).toBe("Blue, 16 steps");
    expect(COLOUR_CHEAP_STEPS).toBe("Marked steps cost the fewest characters.");
    expect(COLOUR_UNAFFORDABLE).toBe(
      "The colours left out would not fit inside 908 characters.",
    );

    // The prefixed rail name is COMPOSED and never written down: seventeen
    // entries carry more than one colour knob, so the alternative is
    // fifty-one sentences that drift from the catalog. Composed the same way
    // `ladderLine` lower-cases the compiler's own label - first character
    // only, so a proper noun in a knob's label survives.
    expect(colourRailName("r")).toBe(COLOUR_RED_RAIL);
    expect(colourRailName("r", "Mute")).toBe("Mute red, 16 steps");
    expect(colourRailName("g", "Rail")).toBe("Rail green, 16 steps");
    expect(
      colourRailName("b", "Level"),
      "the prefixed form is a literal rather than a composition",
    ).toBe("Level blue, 16 steps");

    // -----------------------------------------------------------------------
    // MIX TWO'S FOUR STRINGS, CHARACTER FOR CHARACTER AND THEN COUNTED
    // (10-UI-SPEC §11.6 and §13.4, plan 10-11). They ride inside this test for
    // the same reason the picker's seven do: what they are is a label, two
    // slot captions and one sentence, and this file's job is to hold each of
    // them to the contract's own words. The counts are asserted HERE rather
    // than in mix.spec.ts, because §13.4 gives the numbers and this is the
    // file that holds §13.4.
    expect(MIX_TWO).toBe("MIX TWO");
    expect(MIX_LINE).toBe(
      "Takes half its settings from each, at random. Nothing is sent to your ZONA.",
    );
    expect(MIX_THIS).toBe("THIS ONE");
    expect(MIX_THAT).toBe("THAT ONE");

    expect([...MIX_TWO].length, "the mix label is no longer 7").toBe(7);
    expect([...MIX_LINE].length, "the mix line is no longer 75").toBe(75);
    expect(
      [...MIX_THIS].length,
      "the first candidate's label is no longer 8",
    ).toBe(8);
    expect(
      [...MIX_THAT].length,
      "the second candidate's label is no longer 8",
    ).toBe(8);
    // The two slot labels are the SAME WIDTH on purpose - they head two slots
    // side by side, and two labels of different lengths would move the second
    // as the first one changed.
    expect(
      [...MIX_THIS].length,
      "the two candidate labels are no longer the same length, so the second slot moves with the first",
    ).toBe([...MIX_THAT].length);

    // The line says what the control does AND what it does not do, and the
    // second half is the load-bearing one: four new configurations appearing
    // beside TRY ON DEVICE is exactly where a visitor would wonder.
    expect(
      MIX_LINE,
      "the mix line no longer says that nothing is sent to the module",
    ).toContain("Nothing is sent to your ZONA.");

    // The child's accessible name is COMPOSED from what would change, never
    // written down: four buttons called "Option 1" are four indistinguishable
    // buttons, and the changes are the only thing that tells them apart.
    expect(mixChildName(["Speed 3"])).toBe("Take this: Speed 3.");
    expect(mixChildName(["Speed 3", "Colour 214 255 78"])).toBe(
      "Take this: Speed 3, Colour 214 255 78.",
    );
    // Every knob held is a real case, not defensive padding: nothing is
    // crossed and nothing is redrawn, so a name claiming a change would lie.
    expect(mixChildName([])).toBe("Take this: the same settings as now.");

    for (const label of [...buttonLabels, ...captions]) {
      expect(label, label).toBe(label.toUpperCase());
    }
    for (const caption of captions) {
      expect(caption.split(" ").length, caption).toBeLessThanOrEqual(2);
    }
    // Stated rather than implied: the three-word string is on the label list.
    expect(buttonLabels).toContain(TURN_IT_DOWN);
    expect(TURN_IT_DOWN.split(" ")).toHaveLength(3);

    // TUNING is Phase 4's caption and this is now its one home. It was held
    // against ChosenPanel.svelte's local const while that component still
    // transcribed it; wave 10 moved the caption into the tuning region, which
    // IMPORTS it from here. So the drift this line guarded against is no longer
    // possible by construction, and what it checks is that the move really was
    // to an import and not to a second transcription.
    const region = stripComments(source("../ui/TuningRegion.svelte"));
    expect(region, "the region was read").not.toBe("");
    expect(
      region,
      "TuningRegion.svelte no longer imports the TUNING caption from this module",
    ).toContain("TUNING_CAPTION");
    expect(
      region,
      "TuningRegion.svelte transcribes the TUNING caption instead of importing it, which is the drift this assertion exists to prevent",
    ).not.toContain(`"${TUNING_CAPTION}"`);
  });

  it("obeys the copy rules mechanically, over every string and every builder's output", () => {
    const strings = everyString();
    expect(
      strings.length,
      "the module was actually read - too few strings to be checking anything",
    ).toBeGreaterThanOrEqual(25);

    // Non-vacuity for A-15's scan below, in both halves: the vocabulary is the
    // nine words the plan names, and the word split it matches against really
    // splits. A scan whose tokeniser returned one long string would find no
    // forbidden word for the happiest of reasons.
    expect(GENETICS.length, "the forbidden vocabulary is nine words").toBe(9);
    expect(
      "Take this: Speed 3."
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(Boolean),
      "the word split the metaphor scan depends on no longer splits",
    ).toEqual(["take", "this", "speed"]);

    for (const { name, text } of strings) {
      expect(text, `${name} is empty`).not.toBe("");
      expect(text, `${name} carries an emoji`).not.toMatch(
        /\p{Extended_Pictographic}/u,
      );
      expect(text, `${name} carries an exclamation mark`).not.toContain("!");
      expect(text, `${name} carries a straight apostrophe`).not.toContain("'");
      expect(text, `${name} carries a three-dot ellipsis`).not.toContain("...");
      expect(text, `${name} says Error`).not.toMatch(/error/i);
      expect(text, `${name} says loading`).not.toMatch(/loading/i);
      // THE FIFTH PERMITTED CHARACTER, WITH ITS SCOPE ASSERTED BESIDE IT.
      // U+2212 is permitted in forecastDelta's signed numeral and in no other
      // string this module can produce. A permitted character with no scope is
      // how a copy contract loosens one glyph at a time, so the scope is a
      // condition on the name rather than an exemption from the loop.
      if (name !== "forecastDelta") {
        expect(
          text,
          `${name} carries U+2212, which is permitted in the forecast delta and nowhere else`,
        ).not.toContain(MINUS);
      }
      // -----------------------------------------------------------------
      // A-15: NO GENETICS METAPHOR REACHES THE INTERFACE (plan 10-11).
      // MIX TWO is crossover, and the vocabulary that comes with crossover
      // would arrive free and would be wrong - it names a mechanism where
      // the house style names a result. Two candidates, four results, one
      // button. The scan is over EVERY string this module can produce
      // rather than over MIX TWO's four, because a metaphor that leaked
      // would leak into a sentence next door just as easily.
      //
      // `child` is here as USER-FACING TEXT and is fine as an identifier -
      // mix.ts and MixTwo.svelte both use it - which is exactly why this
      // scan reads rendered strings and never code. `mixChildName`'s output
      // is in this walk, so the component's composed accessible name is
      // covered here as well as in tune-ui.spec.ts's text-node scan.
      // BY STEM, NOT BY WHOLE WORD, AND THE DIFFERENCE WAS MEASURED RATHER
      // THAN REASONED. The first spelling of this scan asked whether the word
      // list CONTAINED the root; the plan's negative check then put `Breeds`
      // in the mix line and this scan stayed GREEN, because "breeds" is not
      // "breed". A metaphor arrives inflected far more often than bare, so a
      // word is an offender when it BEGINS with a forbidden root, and the
      // found form is in the message beside the root it came from.
      const words = text
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(Boolean);
      for (const [word, why] of GENETICS) {
        const found = words.filter((each) => each.startsWith(word));
        expect(
          found,
          `${name} says "${found.join('", "')}" - ${why}. A-15: no genetics metaphor reaches the interface. Two candidates, four results, one button`,
        ).toEqual([]);
      }
    }
  });

  it("writes the meter strings exactly as the contract does", () => {
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
    expect(METERS_UNAVAILABLE).toBe(
      "The character counter could not load, so the two budgets are not shown. Everything else on this page still works.",
    );

    // -----------------------------------------------------------------------
    // THE FORECAST, and it rides inside the meter test because it IS a meter
    // string: the delta is what the bar would read and the expansion says so
    // in words. This file stays at six tests (10-VALIDATION's per-file table).

    expect(forecastDelta(6)).toBe("+6");
    expect(forecastDelta(3)).toBe("+3");
    expect(forecastDelta(0), "a zero delta is bare, never signed").toBe("0");

    // THE FIFTH PERMITTED CHARACTER, ASSERTED IN BOTH DIRECTIONS AND ASSERTED
    // FIRST. U+2212 is what a signed numeral takes on a site that already
    // ships U+2019, U+2026, U+2014 and U+00B7; U+002D HYPHEN-MINUS is a
    // word-joining dash and would be the inconsistency this whole contract
    // exists to prevent. These come BEFORE the equalities below because a
    // wrong sign fails both, and a failure that names the two codepoints is
    // worth more than one that prints two glyphs a reader has to tell apart.
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
    // Comments are excluded on purpose: nothing in a comment is shipped, and
    // the paragraph beside MINUS has to be able to spell out what it is.
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

    // The hidden expansion, at the placeholder's own length. 44 characters,
    // counted rather than asserted by eye, and identical for either event
    // word because Setup and Timer are both five.
    expect(forecastExpansion("Setup", 714)).toBe(
      "Choosing this would put Setup at 714 of 908.",
    );
    expect(forecastExpansion("Timer", 218)).toBe(
      "Choosing this would put Timer at 218 of 908.",
    );
    expect(
      [..."Choosing this would put Setup at {n} of 908."].length,
      "the forecast expansion is no longer 44 characters at its placeholder",
    ).toBe(44);
  });

  it("lower-cases only the first character of the compiler's own label", () => {
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
  });

  it("writes the four over-budget sentences, both back-off explanations and the primary control's reason", () => {
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
    // capital - the contract's placeholder is {Label}, not {label}.
    expect(backOffLadder(LADDER_LABEL, "Setup", 702)).toBe(
      "Stop drawing the ZONA control on the pad. Puts Setup at 702 of 908.",
    );

    // SHORTENED BY NAME, plan 10-03. This is the honesty slot's fifth
    // candidate, so it is capped by install-copy.ts's HONESTY_CAP, which the
    // measured CH_PER_LINE moved from 129 to 86 (2 x 43). The worst form -
    // `Setup and Timer` - was 90, four over. The literal shortens and the cap
    // does not move: a cap widened to admit its own string reserves nothing.
    expect(tryOnBudgetReason("Setup")).toBe(
      "Over the 908-character budget on Setup. Turn something down and it returns.",
    );
    expect(tryOnBudgetReason("Timer")).toBe(
      "Over the 908-character budget on Timer. Turn something down and it returns.",
    );
    expect(tryOnBudgetReason("Setup and Timer")).toBe(
      "Over the 908-character budget on Setup and Timer. Turn something down and it returns.",
    );
    // The worst form, under the cap, measured here rather than assumed - this
    // module cannot import install-copy.ts (both are import-free by contract),
    // so the number is written out with its arithmetic.
    expect(
      [...tryOnBudgetReason("Setup and Timer")].length,
      "the worst budget reason is over HONESTY_CAP - 2 x 43 = 86",
    ).toBeLessThanOrEqual(86);

    // The other disabled control's reason, and the only one this region
    // renders. 53 characters, counted rather than asserted by eye, because
    // 10-UI-SPEC 13.4 gives the number and this is the file that holds it.
    expect(SURPRISE_ALL_HELD).toBe(
      "Every knob is held, so there is nothing left to roll.",
    );
    expect(
      [...SURPRISE_ALL_HELD].length,
      "the fully-held reason is no longer 53 characters",
    ).toBe(53);
    // It names the state, never the control: a reason that said "SURPRISE ME"
    // would repeat the label directly above it.
    expect(SURPRISE_ALL_HELD).not.toContain(SURPRISE_ME);
  });

  it("writes the stamp landings, the share lines and every live-region string, and imports nothing", () => {
    expect(STAMP_RESTORED).toBe(
      "These knobs came with the link. RESET ALL puts the configuration back to its defaults.",
    );
    expect(stampOlder("EUCLID")).toBe(
      "This link was made with an older version of HANGAR. Its knob settings could not be read, so this is EUCLID at its defaults.",
    );
    expect(stampUnreadable("EUCLID")).toBe(
      "That link’s knob settings could not be read, so this is EUCLID at its defaults.",
    );

    expect(EMPTY_RACK).toBe(
      "This configuration has nothing to turn. Its two budgets are still live below.",
    );
    // SHARE_QUIET_LINE was asserted here. R-07 retires it outright, with no
    // replacement, because COPY LINK names itself. Its absence is asserted
    // rather than merely uncommented: the export walk below is over the
    // module's own keys, so a re-added constant would otherwise be invisible
    // here and would ship a second sentence beneath a labelled button.
    expect(
      Object.keys(copy),
      "SHARE_QUIET_LINE came back - it is retired by R-07 and COPY LINK names itself",
    ).not.toContain("SHARE_QUIET_LINE");
    expect(SHARE_FALLBACK_LINE).toBe(
      "Your browser would not let the page copy for you. The link is selected below — press Ctrl+C, or Cmd+C on a Mac.",
    );
    expect(SHARE_FALLBACK_FIELD_NAME).toBe("Shareable link");

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
      "6 knobs randomised. Setup 702 of 908, Timer 218 of 908.",
    );
    expect(liveReset(702, 218)).toBe(
      "Knobs back to their defaults. Setup 702 of 908, Timer 218 of 908.",
    );
    // RESET ALL can land on defaults that are already over budget, so the
    // command and the crossing are ONE utterance, never two.
    expect(liveResetOver("Setup", 33)).toBe(
      "Knobs back to their defaults. Setup is 33 characters over the 908-character budget.",
    );
    expect(liveResetOverBoth(33, 12)).toBe(
      "Knobs back to their defaults. Both events are over the 908-character budget: Setup by 33 characters, Timer by 12.",
    );
    expect(LINK_COPIED_ANNOUNCEMENT).toBe("Link copied to the clipboard.");
    expect(ogAlt("EUCLID")).toBe(
      "The EUCLID configuration running on a ZONA’s 9 by 9 pad.",
    );

    // The contract's last row: this phase writes nothing to any module and
    // destroys nothing recoverable, so there is no confirmation copy at all.
    expect(DESTRUCTIVE_CONFIRMATIONS).toEqual([]);

    const code = stripComments(source("./copy.ts"));
    expect(code, "the file was actually read").toContain(
      "export const SURPRISE_ME",
    );
    expect(code).not.toContain('from "');
    expect(code).not.toContain("from '");
    expect(code).not.toContain("import(");
    expect(code).not.toContain("require(");
  });
});
