// Every sentence this phase can say, asserted character-for-character against
// 05-UI-SPEC's Copywriting Contract.
//
// The table in that document IS the specification. These tests exist so that a
// string cannot be paraphrased, reflowed, re-punctuated or "improved" without
// a red run naming it - which is the only mechanism that keeps one copy of a
// sentence one copy.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as copy from "./copy";
import {
  COPY_LINK,
  DESTRUCTIVE_CONFIRMATIONS,
  EMPTY_RACK,
  LINK_COPIED,
  LINK_COPIED_ANNOUNCEMENT,
  MEASURING,
  METERS_UNAVAILABLE,
  RESET_ALL,
  SETUP_CAPTION,
  SHARE_FALLBACK_FIELD_NAME,
  SHARE_FALLBACK_LINE,
  SHARE_QUIET_LINE,
  STAMP_RESTORED,
  SURPRISE_ME,
  TIMER_CAPTION,
  TUNING_CAPTION,
  TURN_IT_DOWN,
  backOffKnob,
  backOffLadder,
  emptyTimerExpansion,
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

/** The house comment stripper (src/lib/config-shape.spec.ts), backslash-free. */
const stripComments = (text: string) =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

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
    ];
    const captions = [TUNING_CAPTION, SETUP_CAPTION, TIMER_CAPTION];

    expect(SURPRISE_ME).toBe("SURPRISE ME");
    expect(RESET_ALL).toBe("RESET ALL");
    expect(TURN_IT_DOWN).toBe("TURN IT DOWN");
    expect(COPY_LINK).toBe("COPY LINK");
    expect(LINK_COPIED).toBe("LINK COPIED");
    expect(TUNING_CAPTION).toBe("TUNING");
    expect(SETUP_CAPTION).toBe("SETUP");
    expect(TIMER_CAPTION).toBe("TIMER");

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

    expect(tryOnBudgetReason("Setup")).toBe(
      "Over the 908-character budget on Setup. Turn something down and this comes back.",
    );
    expect(tryOnBudgetReason("Timer")).toBe(
      "Over the 908-character budget on Timer. Turn something down and this comes back.",
    );
    expect(tryOnBudgetReason("Setup and Timer")).toBe(
      "Over the 908-character budget on Setup and Timer. Turn something down and this comes back.",
    );
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
    expect(SHARE_QUIET_LINE).toBe(
      "Copies this configuration, knobs and all, as a link anyone can open.",
    );
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
