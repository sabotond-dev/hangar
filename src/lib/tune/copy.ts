// Every sentence the tuning panel can say, once.
//
// THIS MODULE IMPORTS NOTHING, for the reason set out at the head of
// src/lib/tune/view.ts: Phase 4's chunk guard matches specifier TEXT, so a
// module a component may name has to be free of the compiler entirely. It also
// means the two event words arrive as already-capitalised strings rather than
// as a `MeterEvent` imported from view.ts - which is what the contract's
// {Setup|Timer} placeholder literally says anyway.
//
// WHY THE STRINGS LIVE IN CONSTS AND NOT IN MARKUP. Prettier reflows text
// inside Svelte markup, and Phase 2 lost a load-bearing sentence to exactly
// that. src/lib/ui/TryOnDevice.svelte established the house rule: visitor-facing
// copy is a named constant, and markup interpolates it.
//
// WHY THERE IS EXACTLY ONE COPY. Two copies of a sentence is how they drift.
// Every string below is transcribed verbatim from 05-UI-SPEC's Copywriting
// Contract and copy.spec.ts asserts each one character-for-character against
// that table. Nothing here may be paraphrased, reflowed, re-punctuated or
// "improved" - if a sentence is wrong, the contract is what changes first.
//
// THE PUNCTUATION IS LOAD-BEARING. Real apostrophes (U+2019), a real ellipsis
// (U+2026) and a real em dash (U+2014). No emoji, no exclamation marks, never
// the word "Error", never the word "loading", and no string names a control
// that is not on the screen.
//
// AND A FIFTH, ADDED BY PLAN 10-09 WITH A SCOPE ATTACHED: U+2212 MINUS SIGN,
// permitted in `forecastDelta`'s signed numeral and NOWHERE ELSE. copy.spec.ts
// asserts the scope as well as the character - it fails if the delta writes a
// hyphen-minus, and it fails if U+2212 appears in the code of any other file
// under src/. A permitted character with no scope is how a copy contract
// loosens one glyph at a time.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The two events, in the case the sentences print them.

/** One event, as the contract's {Setup|Timer} placeholder writes it. */
export type EventWord = "Setup" | "Timer";

/** What the primary control's reason can name. */
export type BudgetEvents = EventWord | "Setup and Timer";

// ---------------------------------------------------------------------------
// Captions and button labels.

/**
 * Phase 4's region caption, unchanged, and now its one home.
 * src/lib/ui/ChosenPanel.svelte still declares its own const; copy.spec.ts
 * holds the two equal until wave 9 replaces that const with this import.
 */
export const TUNING_CAPTION = "TUNING";
export const SETUP_CAPTION = "SETUP";
export const TIMER_CAPTION = "TIMER";

export const SURPRISE_ME = "SURPRISE ME";
export const RESET_ALL = "RESET ALL";
/**
 * Deliberately NOT `PUT IT BACK`: Phase 7 owns `PUT BACK` for restoring a
 * module's own configuration, and two near-identical labels on the same panel
 * would be a genuine hazard on hardware people paid for.
 */
export const TURN_IT_DOWN = "TURN IT DOWN";
export const COPY_LINK = "COPY LINK";
export const LINK_COPIED = "LINK COPIED";

/**
 * The lock toggle on a knob row, off and on (10-UI-SPEC 11.5, T1).
 *
 * A WORD RATHER THAN AN ICON, because X-22 ships no new SVG this phase, and
 * the word CHANGES rather than only the `aria-pressed` state so the lock's
 * state is in its accessible name. Four characters each, on purpose: the two
 * labels are the same width, so toggling one cannot reflow the row it ends.
 */
export const KNOB_HOLD = "HOLD";
export const KNOB_HELD = "HELD";

/**
 * The reason beside a disabled SURPRISE ME when every knob is held. 53
 * characters, and copy.spec.ts counts them.
 *
 * `surpriseIndices` already answers a fully-held roll by handing the previous
 * indices back - its documented exhaustion signal - so the control would
 * otherwise be a button that appears to do nothing, which is worse than a
 * disabled one.
 */
export const SURPRISE_ALL_HELD =
  "Every knob is held, so there is nothing left to roll.";

// ---------------------------------------------------------------------------
// The two meters.

/**
 * The first-measurement wait. NOT "loading": Phase 4 forbids that word and
 * requires every wait to name what it is waiting for. This one is a character
 * count being taken with the pinned minifier.
 */
export const MEASURING = "measuring…";

/** "702 / 908". Never "702 chars" - the caption and the / 908 already say it. */
export function meterNumerals(used: number): string {
  return `${used} / 908`;
}

/** "77%". Never "77.4%". */
export function meterPercent(pct: number): string {
  return `${pct}%`;
}

/** The visually-hidden expansion paired with the aria-hidden numerals. */
export function meterExpansion(
  event: EventWord,
  used: number,
  pct: number,
): string {
  return `${event} uses ${used} of 908 characters, ${pct} per cent.`;
}

/**
 * MORPH ships an empty Timer. `0 / 908` is a true measurement, not a dead
 * meter, and the expansion says what it means in words.
 */
export function emptyTimerExpansion(): string {
  return "Timer uses 0 of 908 characters. This configuration has no timer.";
}

// ---------------------------------------------------------------------------
// The forecast (TUNE-02, T2). What a choice would cost, before it is made.

/**
 * U+2212 MINUS SIGN, named rather than pasted, and THE FIFTH PERMITTED
 * TYPOGRAPHIC CHARACTER on the site.
 *
 * This module already ships U+2019, U+2026, U+2014 and U+00B7. A hyphen-minus
 * in a signed numeral beside them is precisely the inconsistency the copy
 * contract exists to prevent - and it is also the wrong glyph: U+002D is a
 * word-joining dash, drawn short and high, while U+2212 is drawn at the same
 * width and height as the plus sign it alternates with, which is what stops a
 * column of deltas jittering as the sign flips.
 *
 * PERMITTED IN THE FORECAST DELTA AND NOWHERE ELSE. `copy.spec.ts` asserts
 * both halves: that `forecastDelta` writes it, and that the character appears
 * in exactly one place in the whole of `src/`. A permitted character with no
 * scope is how a copy contract loosens.
 */
const MINUS = "−";

/**
 * The signed cost of a choice, in characters: `+6`, a U+2212 and a 3, `0`.
 *
 * Zero is bare rather than a signed zero of either sign: a knob that costs
 * nothing has no direction to point in.
 */
export function forecastDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${MINUS}${Math.abs(delta)}`;
}

/**
 * The forecast's accessible twin: 44 characters at the placeholder's own
 * length, `Choosing this would put Setup at {n} of 908.`
 *
 * It exists because the signed delta is a NUMBER BESIDE A POINTER, and a
 * number beside a pointer is pointer-only information. This sentence is real
 * text in the DOM, wired to the option by aria-describedby, so the forecast
 * reaches a visitor who arrives at the option with a keyboard.
 */
export function forecastExpansion(event: EventWord, used: number): string {
  return `Choosing this would put ${event} at ${used} of 908.`;
}

/** The formatter never resolved, so there is nothing honest to show. */
export const METERS_UNAVAILABLE =
  "The character counter could not load, so the two budgets are not shown. Everything else on this page still works.";

// ---------------------------------------------------------------------------
// The colour picker (10-UI-SPEC §11.2, plan 10-10). Seven strings, all counted.

/** The picker's caption. 6, Micro, --color-ink-quiet. */
export const COLOUR_CAPTION = "COLOUR";

/**
 * The knob selector's group label. 12.
 *
 * It names the QUESTION rather than the control, because the options beside it
 * are already the knobs' own labels and "Which colour knob" would repeat the
 * word the caption above it has just said.
 */
export const COLOUR_WHICH = "Which colour";

/**
 * Each rail's visually-hidden label. 13 / 15 / 14.
 *
 * "16 steps" rather than "0 to 255", and the difference is the whole argument
 * of the picker: the state holds sixteen values per channel and offering 256
 * would be a resolution it does not have.
 */
export const COLOUR_RED_RAIL = "Red, 16 steps";
export const COLOUR_GREEN_RAIL = "Green, 16 steps";
export const COLOUR_BLUE_RAIL = "Blue, 16 steps";

/**
 * Three exported constants and a private map, rather than one exported record.
 *
 * `copy.spec.ts`'s mechanical-rules walk iterates this module's exports and
 * only looks at the ones that are STRINGS or FUNCTIONS - a record of strings
 * is skipped in silence, which is how three sentences would escape every rule
 * in the contract at once. Three constants are three rows in that walk.
 */
const COLOUR_RAIL_NAMES = {
  r: COLOUR_RED_RAIL,
  g: COLOUR_GREEN_RAIL,
  b: COLOUR_BLUE_RAIL,
} as const;

/**
 * The prefixed form, COMPOSED and never written down: `Mute red, 16 steps`.
 *
 * A picker on an entry with more than one colour knob has to say WHICH knob a
 * rail belongs to, and the seventeen entries that need it carry seventeen
 * different knob labels - so writing the prefixed strings out would be a table
 * of fifty-one sentences that drifts from the catalog. The knob's own label
 * leads and the channel word drops to lower case behind it, which is the same
 * "lower-case only the first character of the compiler's own label" rule
 * `ladderLine` already uses.
 */
export function colourRailName(
  channel: keyof typeof COLOUR_RAIL_NAMES,
  knobLabel?: string,
): string {
  const base = COLOUR_RAIL_NAMES[channel];
  if (!knobLabel) return base;
  return `${knobLabel} ${base[0].toLowerCase()}${base.slice(1)}`;
}

/**
 * The cheap-step ticks' hidden expansion. 40.
 *
 * The ticks are a 2px mark under six of the sixteen detents, which is
 * information no assistive technology can reach. It says what the mark MEANS
 * rather than where the marks are, because the rail already announces its own
 * position and a list of six numbers would be a second copy of the arithmetic.
 */
export const COLOUR_CHEAP_STEPS = "Marked steps cost the fewest characters.";

/**
 * The unaffordable detents' hidden expansion. 57.
 *
 * NO ADJACENT REASON LINE - X-17's precedent, and 05.1's disabled chip. The
 * meter two centimetres away is the cause, and a sentence beside the rail
 * would be a third place saying the same 908. This is the accessible twin of a
 * shortened rail, not a message.
 *
 * MEASURED NEVER TO APPEAR on today's shelf: the dearest colour-bearing preset
 * is `ninepads` at 640 of 908 and the whole lattice is worth six characters.
 */
export const COLOUR_UNAFFORDABLE =
  "The colours left out would not fit inside 908 characters.";

// ---------------------------------------------------------------------------
// The rack.

export const EMPTY_RACK =
  "This configuration has nothing to turn. Its two budgets are still live below.";

// ---------------------------------------------------------------------------
// The fit ladder.

/**
 * Lower-case the first character of a label and NOTHING else.
 *
 * The compiler writes its ladder labels as whole sentences ("Stop drawing the
 * control on the pad"), and they are never rewritten - two copies of the same
 * explanation would drift. When one sits inside another sentence it needs a
 * small first letter; a `toLowerCase()` would flatten every proper noun in it.
 */
export function lowerFirst(label: string): string {
  return label.length === 0 ? label : label[0].toLowerCase() + label.slice(1);
}

/** The fit-ladder line, in its one-step and several-step forms. */
export function ladderLine(steps: number, label: string): string {
  return steps === 1
    ? `One thing was turned down to stay inside 908 characters: ${lowerFirst(label)}.`
    : `${steps} things were turned down to stay inside 908 characters, starting with ${lowerFirst(label)}.`;
}

// ---------------------------------------------------------------------------
// Over budget. Four sentences, because "a knob did it" and "it arrived like
// this" are different facts, and one event over is not two.

export function overBudgetKnob(
  knobLabel: string,
  event: EventWord,
  by: number,
): string {
  return `${knobLabel} pushed ${event} ${by} characters over 908.`;
}

export function overBudgetKnobBoth(
  knobLabel: string,
  setupBy: number,
  timerBy: number,
): string {
  return `${knobLabel} pushed both events over 908: Setup by ${setupBy} characters, Timer by ${timerBy}.`;
}

export function overBudgetArrived(event: EventWord, by: number): string {
  return `This configuration starts ${by} characters over 908 on ${event}.`;
}

export function overBudgetArrivedBoth(
  setupBy: number,
  timerBy: number,
): string {
  return `This configuration starts over 908 on both events: Setup by ${setupBy} characters, Timer by ${timerBy}.`;
}

/** The quiet line under TURN IT DOWN when a knob caused the overrun. */
export function backOffKnob(
  knobLabel: string,
  event: EventWord,
  at: number,
): string {
  return `Puts ${knobLabel} back where it was, and ${event} at ${at} of 908.`;
}

/**
 * The quiet line under TURN IT DOWN when the fit ladder's first step is what
 * the click will apply.
 *
 * The compiler's label OPENS this sentence rather than sitting inside one, so
 * it keeps its own capital: the contract's placeholder is `{Label}`, where the
 * two ladder lines use `{label}`. That is the whole of the rule "lower-cased at
 * the first character WHERE THEY SIT INSIDE ANOTHER SENTENCE".
 */
export function backOffLadder(
  label: string,
  event: EventWord,
  at: number,
): string {
  return `${label}. Puts ${event} at ${at} of 908.`;
}

/**
 * The reason beside a disabled TRY ON DEVICE. It names the budget and does not
 * repeat the knob sentence: they are two different jobs.
 *
 * SHORTENED BY NAME, plan 10-03. This is the fifth candidate in the honesty
 * slot, so it is held to install-copy.ts's HONESTY_CAP even though it lives
 * here, and its worst form - `Setup and Timer`, the longest of the three
 * BudgetEvents - was 90 against a cap that the measured CH_PER_LINE moved to
 * 86 (10-01-SUMMARY.md). The literal shortens, never the cap: a cap widened to
 * admit its own string stops reserving anything. `and this comes back` becomes
 * `and it returns`, which takes the worst form to 85. The shortening is in the
 * sentence around ${events} rather than in the interpolation, so all three
 * forms move together and the shortest is still the shortest.
 */
export function tryOnBudgetReason(events: BudgetEvents): string {
  return `Over the 908-character budget on ${events}. Turn something down and it returns.`;
}

// ---------------------------------------------------------------------------
// Sharing.

// SHARE_QUIET_LINE WAS HERE, AND ITS ABSENCE IS AN AMENDMENT RATHER THAN A GAP.
//
// `Copies this configuration, knobs and all, as a link anyone can open.` is
// RETIRED OUTRIGHT by plan 10-03 (10-UI-SPEC.md, R-07), with no replacement.
// The audit rule the register closes D-08 with is that a string goes only when
// the control beside it already says the same thing, and COPY LINK names
// itself: a labelled button whose whole job is in its two words does not need a
// sentence explaining that it copies a link. Nothing that names a risk, a
// consequence, a way back or a next step was retired with it - SHARE_FALLBACK_
// LINE below stays whole, because it is the one that tells a visitor what to do
// when the copy did not happen.

/** Names keys, never controls: the button beside it stays COPY LINK. */
export const SHARE_FALLBACK_LINE =
  "Your browser would not let the page copy for you. The link is selected below — press Ctrl+C, or Cmd+C on a Mac.";

export const SHARE_FALLBACK_FIELD_NAME = "Shareable link";

// ---------------------------------------------------------------------------
// The three stamp landings.

export const STAMP_RESTORED =
  "These knobs came with the link. RESET ALL puts the configuration back to its defaults.";

/**
 * The format letter is known but its version is behind the current one. Split
 * from the neutral sentence because asserting "older version" about a corrupted
 * stamp would be a small lie.
 */
export function stampOlder(name: string): string {
  return `This link was made with an older version of HANGAR. Its knob settings could not be read, so this is ${name} at its defaults.`;
}

/** Undecodable, or a payload that does not match the entry's knob count. */
export function stampUnreadable(name: string): string {
  return `That link’s knob settings could not be read, so this is ${name} at its defaults.`;
}

// ---------------------------------------------------------------------------
// The live region. One utterance per event, never two.

/**
 * Crossing into over budget. The knob clause is dropped when no knob moved -
 * a landed stamp or an already-over default cannot name one, and inventing a
 * culprit would be a lie.
 */
export function liveOverBudget(
  event: EventWord,
  by: number,
  knobLabel?: string,
): string {
  const line = `${event} is now ${by} characters over the 908-character budget.`;
  return knobLabel ? `${line} ${knobLabel} pushed it over.` : line;
}

export function liveBackInside(event: EventWord): string {
  return `${event} is back inside the 908-character budget.`;
}

export function liveRandomised(
  knobs: number,
  setup: number,
  timer: number,
): string {
  return `${knobs} knobs randomised. Setup ${setup} of 908, Timer ${timer} of 908.`;
}

export function liveReset(setup: number, timer: number): string {
  return `Knobs back to their defaults. Setup ${setup} of 908, Timer ${timer} of 908.`;
}

/**
 * RESET ALL can land on defaults that are ALREADY over budget, so the command
 * and the crossing happen on the same tick. The live region is aria-atomic and
 * emits at most one string per event, so these two exist rather than a reset
 * string followed by a transition string.
 */
export function liveResetOver(event: EventWord, by: number): string {
  return `Knobs back to their defaults. ${event} is ${by} characters over the 908-character budget.`;
}

export function liveResetOverBoth(setupBy: number, timerBy: number): string {
  return `Knobs back to their defaults. Both events are over the 908-character budget: Setup by ${setupBy} characters, Timer by ${timerBy}.`;
}

export const LINK_COPIED_ANNOUNCEMENT = "Link copied to the clipboard.";

// ---------------------------------------------------------------------------
// The OG image.

export function ogAlt(name: string): string {
  return `The ${name} configuration running on a ZONA’s 9 by 9 pad.`;
}

// ---------------------------------------------------------------------------
// The contract's last row, as a value rather than as prose.

/**
 * There are none, and the empty list is the assertion.
 *
 * This phase writes nothing to any module and destroys nothing recoverable.
 * RESET ALL and TURN IT DOWN both act immediately, with no dialog. The only
 * destructive control on the site (KEEP ON DEVICE) is still disabled, and its
 * copy belongs to Phase 7.
 */
export const DESTRUCTIVE_CONFIRMATIONS: readonly string[] = [];
