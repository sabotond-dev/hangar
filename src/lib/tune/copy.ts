// Every sentence the tuning panel can say, once. Imports nothing (Phase 4's chunk
// guard matches specifier text, so a component may name it freely; the two event
// words arrive as strings); copy.spec.ts holds every export character for
// character, every string in a const and never in markup, where prettier reflows.
// Exactly one copy of each sentence: Phase 10's SURPRISE_ME, RESET_ALL and
// COPY_LINK are gone because the Bible's lines for those controls live in
// inspector-copy.ts (RANDOMIZE, RESET_SETTINGS, SHARE_SNAPSHOT). The register is
// the Bible's (13-CONTEXT D-05; the words D-23's, 13-18-BATCH.md row F.11): sentence
// case, second person, "setting" never "knob", real apostrophe / ellipsis / em dash,
// no "Error" / "loading" / engine / paraphrased label; U+2212 in forecastDelta only.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// ---------------------------------------------------------------------------
// The retirement ledger: what this module used to export, by name and date.
//
// THE MEASURED CAPS ARE RETIRED BY NAME, 2026-09-12 (13-19, D-05), in the
// same move 13-18 made for install-copy.ts: HONESTY_CAP (86) held
// tryOnBudgetReason from outside (2 x CH_PER_LINE, the 43 of Phase 10's
// column); SURPRISE_ALL_HELD's 53, KNOB_HOLD / KNOB_HELD at 4 / 4,
// MIX_TWO 7, MIX_LINE 75, MIX_THIS / MIX_THAT 8 / 8 and forecastExpansion's 44
// were counts of sentences, not rules - the lock's width is Knob.svelte's and
// ColourPicker.svelte's .lock rule now. See
// .planning/phases/13-gui-overhaul/13-19-SUMMARY.md.
//
// THE MIX FAMILY IS GONE BY NAME, 2026-09-12 (13-19 closing the row 13-10
// opened; 13-CONTEXT D-12 cut the feature): MIX_TWO, MIX_LINE, MIX_THIS,
// MIX_THAT and their composer mixChildName, with copy.spec.ts's assertions.
//
// METERS_UNAVAILABLE IS RETIRED BY NAME, 2026-09-12 (13.1-07; 13.1-CONTEXT
// D-10): the workspace's meters are hidden and the line lost its one reader;
// the meter family stays exported for the Sandbox's BudgetMeter.svelte room line.

// ---------------------------------------------------------------------------
// The two events, in the case the sentences print them.

/** One event, as the two scripts are named - already capitalised. */
export type EventWord = "Setup" | "Timer";

/** What the primary control's reason can name. */
export type BudgetEvents = EventWord | "Setup and Timer";

// ---------------------------------------------------------------------------
// Captions and button labels.

/**
 * Phase 4's region caption, and its one home: TuningRegion.svelte imports it.
 * Uppercase because it is a one-word section label, which D-05 permits.
 */
export const TUNING_CAPTION = "TUNING";
export const SETUP_CAPTION = "SETUP";
export const TIMER_CAPTION = "TIMER";

/**
 * The back-off control under an over-budget message: a verb on a button, in
 * sentence case (D-05), the ladder line's own idiom ("turned down").
 */
export const TURN_IT_DOWN = "Turn it down";

/**
 * The share control for two seconds after the link is on the clipboard.
 * 13-18-BATCH.md row F.11, approved (D-23); the control at rest reads the
 * PDF's `Share snapshot` (inspector-copy.ts, SHARE_SNAPSHOT).
 */
export const LINK_COPIED = "Link copied";

/**
 * The lock toggle on a setting's row, off and on: section 7's own noun in
 * sentence case. A word rather than an icon, and the word changes, so the
 * lock's state is in its accessible name; the row does not reflow because the
 * button has a fixed inline-size (the ledger's 4 / 4 rule, now CSS).
 */
export const KNOB_HOLD = "Lock";
export const KNOB_HELD = "Locked";

/**
 * The reason beside a disabled Randomize when every setting it could change is
 * locked. Two facts: every randomizable setting is locked, and the MIDI
 * settings do not count because Randomize never touches them (section 7;
 * 13-10's scope rule). It names the STATE and never the control above it.
 */
export const SURPRISE_ALL_HELD =
  "Everything that can be randomized is locked. MIDI settings are never randomized.";

// ---------------------------------------------------------------------------
// The two meters. HANGAR's own honesty device: how many of 908 are used.

/**
 * The first-measurement wait. NOT "loading": every wait names what it is
 * waiting for, and this one is a character count being taken with the pinned
 * minifier. The Sandbox's copy.ts carries the same word for the same meter.
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
// The forecast (TUNE-02). What a choice would cost, before it is made.

/**
 * U+2212 MINUS SIGN, named rather than pasted: the fifth permitted typographic
 * character, drawn at the plus sign's width so a column of deltas does not
 * jitter as the sign flips. Permitted in forecastDelta and nowhere else -
 * copy.spec.ts asserts both halves over the whole of src/.
 */
const MINUS = "−";

/**
 * The signed cost of a choice, in characters: `+6`, a U+2212 and a 3, `0`.
 *
 * Zero is bare rather than a signed zero of either sign: a choice that costs
 * nothing has no direction to point in.
 */
export function forecastDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${MINUS}${Math.abs(delta)}`;
}

/**
 * The forecast's accessible twin: `Choosing this would put Setup at {n} of
 * 908.` Real text in the DOM, wired to the option by aria-describedby, because
 * a signed delta beside a pointer is pointer-only information.
 */
export function forecastExpansion(event: EventWord, used: number): string {
  return `Choosing this would put ${event} at ${used} of 908.`;
}

// ---------------------------------------------------------------------------
// The colour picker (plan 10-10). Seven strings, unchanged: they were already
// in the register, and colour-picker.spec.ts counts them beside the picker.

/** The picker's caption. A one-word section label, uppercase by D-05. */
export const COLOUR_CAPTION = "COLOUR";

/**
 * The knob selector's group label: the question, not the control - the caption
 * above has just said "colour".
 */
export const COLOUR_WHICH = "Which colour";

/**
 * Each rail's visually-hidden label. "16 steps", not "0 to 255": the state
 * holds sixteen values per channel.
 */
export const COLOUR_RED_RAIL = "Red, 16 steps";
export const COLOUR_GREEN_RAIL = "Green, 16 steps";
export const COLOUR_BLUE_RAIL = "Blue, 16 steps";

/**
 * Three exported constants and a private map, not one exported record:
 * copy.spec.ts's mechanical-rules walk reads exports that are strings or
 * functions and skips a record in silence.
 */
const COLOUR_RAIL_NAMES = {
  r: COLOUR_RED_RAIL,
  g: COLOUR_GREEN_RAIL,
  b: COLOUR_BLUE_RAIL,
} as const;

/**
 * The prefixed form, composed and never written down: `Mute red, 16 steps`.
 * The setting's own label leads and the channel word drops to lower case behind
 * it (ladderLine's "lower-case only the first character" rule).
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
 * The cheap-step ticks' hidden expansion: what the 2px mark under six detents
 * MEANS, not where it is.
 */
export const COLOUR_CHEAP_STEPS = "Marked steps cost the fewest characters.";

/**
 * The unaffordable detents' hidden expansion: the accessible twin of a
 * shortened rail, not a message (the meter beside it is the cause).
 */
export const COLOUR_UNAFFORDABLE =
  "The colours left out would not fit inside 908 characters.";

// ---------------------------------------------------------------------------
// The rack.

/** A configuration with no settings at all: the meters still measure it. */
export const EMPTY_RACK =
  "This configuration has no settings to change. Its two budgets below are still live.";

// ---------------------------------------------------------------------------
// The fit ladder (TUNE-04). The fact: a feature was trimmed to stay inside the
// budget, and WHICH - the compiler's own label for the step, never reworded.

/**
 * Lower-case the first character of a label and NOTHING else: the compiler's
 * ladder labels are whole sentences with proper nouns, never rewritten.
 */
export function lowerFirst(label: string): string {
  return label.length === 0 ? label : label[0].toLowerCase() + label.slice(1);
}

/**
 * The fit-ladder line, in its one-step and several-step forms. The label is
 * the WHICH: a line that said something was turned down without naming it
 * would keep half of TUNE-04's fact.
 */
export function ladderLine(steps: number, label: string): string {
  return steps === 1
    ? `One thing was turned down to stay inside 908 characters: ${lowerFirst(label)}.`
    : `${steps} things were turned down to stay inside 908 characters, starting with ${lowerFirst(label)}.`;
}

// ---------------------------------------------------------------------------
// Over budget. Four sentences, because "a setting did it" and "it arrived like
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

/** The quiet line under Turn it down when a setting caused the overrun. */
export function backOffKnob(
  knobLabel: string,
  event: EventWord,
  at: number,
): string {
  return `Puts ${knobLabel} back where it was, and ${event} at ${at} of 908.`;
}

/**
 * The quiet line under Turn it down when the fit ladder's first step is what
 * the click will apply. The compiler's label OPENS this sentence, so it keeps
 * its own capital where the two ladder lines lower-case it.
 */
export function backOffLadder(
  label: string,
  event: EventWord,
  at: number,
): string {
  return `${label}. Puts ${event} at ${at} of 908.`;
}

/**
 * The reason beside a disabled Apply to ZONA: the budget, then the way back;
 * the register's own verb ("apply") stands for the control. No cap governs it
 * (the ledger's HONESTY_CAP).
 */
export function tryOnBudgetReason(events: BudgetEvents): string {
  return `Over the 908-character budget on ${events}. Turn something down to apply it.`;
}

// ---------------------------------------------------------------------------
// Sharing.

// SHARE_QUIET_LINE WAS HERE, AND ITS ABSENCE IS AN AMENDMENT RATHER THAN A GAP:
// retired outright by plan 10-03 (10-UI-SPEC.md, R-07) because `Share snapshot`
// names itself. SHARE_FALLBACK_LINE stays: it says what to do when the copy failed.

/** Names keys, never controls: the button beside it stays `Share snapshot`. */
export const SHARE_FALLBACK_LINE =
  "Your browser wouldn’t let the page copy for you. The link is selected below — press Ctrl+C, or Cmd+C on a Mac.";

/** The fallback field's accessible name: the control's own noun. */
export const SHARE_FALLBACK_FIELD_NAME = "Snapshot link";

// ---------------------------------------------------------------------------
// The three stamp landings. SHARE-03's fact: a link made with an older version
// lands on the base configuration AND SAYS SO; the other two are what they
// are - restored, and unreadable.

/**
 * The link landed. Names `Reset settings` exactly as the control reads
 * (inspector-copy.ts, RESET_SETTINGS; copy.spec.ts holds the two equal).
 */
export const STAMP_RESTORED =
  "These settings came with the link. Reset settings returns the configuration to its defaults.";

/**
 * The format letter is known but its version is behind the current one. Split
 * from the neutral sentence because asserting "older version" about a corrupted
 * stamp would be a small lie.
 */
export function stampOlder(name: string): string {
  return `This link was made with an older version of HANGAR. Its settings couldn’t be read, so this is ${name} at its defaults.`;
}

/** Undecodable, or a payload that does not match the entry's setting count. */
export function stampUnreadable(name: string): string {
  return `That link’s settings couldn’t be read, so this is ${name} at its defaults.`;
}

// ---------------------------------------------------------------------------
// The live region (section 14). One utterance per event, never two, and
// never a frame.

/**
 * Crossing into over budget. The culprit clause is dropped when no setting
 * moved - a landed stamp or an already-over default cannot name one, and
 * inventing a culprit would be a lie.
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

/** After Randomize: how many settings moved, and where the two budgets stand. */
export function liveRandomised(
  knobs: number,
  setup: number,
  timer: number,
): string {
  return `${knobs} settings randomized. Setup ${setup} of 908, Timer ${timer} of 908.`;
}

export function liveReset(setup: number, timer: number): string {
  return `Settings back to their defaults. Setup ${setup} of 908, Timer ${timer} of 908.`;
}

/**
 * Reset settings can land on defaults that are ALREADY over budget, so the
 * command and the crossing happen on the same tick. The live region is
 * aria-atomic and emits at most one string per event, so these two exist
 * rather than a reset string followed by a transition string.
 */
export function liveResetOver(event: EventWord, by: number): string {
  return `Settings back to their defaults. ${event} is ${by} characters over the 908-character budget.`;
}

export function liveResetOverBoth(setupBy: number, timerBy: number): string {
  return `Settings back to their defaults. Both events are over the 908-character budget: Setup by ${setupBy} characters, Timer by ${timerBy}.`;
}

export const LINK_COPIED_ANNOUNCEMENT = "Link copied to the clipboard.";

// ---------------------------------------------------------------------------
// The OG image. The name is interpolated raw and never re-cased: the catalog's
// names are the form the page shows (Arc, Euclid - D-14 Q11b).

export function ogAlt(name: string): string {
  return `The ${name} configuration running on a ZONA’s 9 by 9 pad.`;
}

// ---------------------------------------------------------------------------
// The contract's last row, as a value rather than as prose.

/**
 * There are none, and the empty list is the assertion: nothing on the tuning
 * panel writes to a module or destroys anything recoverable. The one
 * confirmation before a write to flash is install-copy.ts's.
 */
export const DESTRUCTIVE_CONFIRMATIONS: readonly string[] = [];
