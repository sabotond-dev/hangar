// Every sentence the tuning panel can say, once.
//
// THIS MODULE IMPORTS NOTHING, for the reason set out at the head of
// src/lib/tune/view.ts: Phase 4's chunk guard matches specifier TEXT, so a
// module a component may name has to be free of the compiler entirely. It also
// means the two event words arrive as already-capitalised strings rather than
// as a `MeterEvent` imported from view.ts.
//
// WHY THE STRINGS LIVE IN CONSTS AND NOT IN MARKUP. Prettier reflows text
// inside Svelte markup, and Phase 2 lost a load-bearing sentence to exactly
// that. Visitor-facing copy is a named constant, and markup interpolates it.
//
// WHY THERE IS EXACTLY ONE COPY. Two copies of a sentence is how they drift.
// Every string below has one home, and copy.spec.ts asserts each one
// character-for-character. Nothing here may be paraphrased, reflowed,
// re-punctuated or "improved" in a component. That is also why three of Phase
// 10's exports are GONE rather than rewritten: the Bible's own lines for the
// three controls they named - `Randomize`, `Reset settings` and `Share
// snapshot`, PDF page 5 and section 7 - were landed VERBATIM by plan 13-09 in
// src/lib/tune/inspector-copy.ts (RANDOMIZE, RESET_SETTINGS, SHARE_SNAPSHOT),
// and the components read them there. A second constant here with the same
// three words would be the second copy this paragraph exists to forbid.
//
// THE REGISTER IS THE BIBLE'S (13-CONTEXT D-05), AND THE WORDS ARE THE USER'S
// (D-23). Every string here is one of three things, and copy.spec.ts checks
// which by reading the documents from disk:
//
//  - a line the design specification or its PDF gives, taken VERBATIM - the
//    three above (in inspector-copy.ts), and `Lock` / `Locked` as section 7's
//    parameter locks read in sentence case;
//  - a line the specification never wrote, PROPOSED in 13-18-BATCH.md with the
//    state it names and the fact it must carry, and APPROVED as written by
//    D-23 - row F.11, `Link copied`; or
//  - a HANGAR mechanic the Bible never saw - the two meters, the forecast, the
//    fit ladder, the colour picker, the stamp landings, the live region -
//    written in the register with its FACT kept. The facts are the constraint
//    (13-19-PLAN.md's family table): how many of 908 characters are used and
//    what a choice would cost; that a feature was trimmed to stay in budget
//    AND WHICH (TUNE-04); the RGB444 lattice and its cheap steps; that a
//    setting is locked against Randomize; that a link made with an older
//    version lands on the base configuration and says so (SHARE-03); what
//    changed, once, in the live region (section 14).
//
// The register, as rules: sentence case, short, second person; the action and
// its result in one line; plain about state, never coy; real apostrophes
// (U+2019), a real ellipsis (U+2026), a real em dash (U+2014); no exclamation
// marks; no emoji; no uppercase paragraphs - the four one-word captions below
// are the short section labels D-05 permits; never "Error", never "loading";
// no browser engine named; and NO CONTROL LABEL PARAPHRASED IN PROSE - the one
// sentence here that names a control (STAMP_RESTORED) names `Reset settings`
// exactly as the control reads. The Bible's word for what a visitor turns is
// a SETTING (PDF page 5: `Reset settings`; section 7: parameters, fields).
// Phase 10's "knob" was the site's own word and it is gone from every string
// here; it survives as an identifier (knobLabel, KNOB_HOLD) because a screen
// reader never hears an identifier.
//
// AND A FIFTH PERMITTED CHARACTER, ADDED BY PLAN 10-09 WITH A SCOPE ATTACHED:
// U+2212 MINUS SIGN, permitted in `forecastDelta`'s signed numeral and NOWHERE
// ELSE. copy.spec.ts asserts the scope as well as the character - it fails if
// the delta writes a hyphen-minus, and it fails if U+2212 appears in the code
// of any other file under src/. A permitted character with no scope is how a
// copy contract loosens one glyph at a time.
//
// THE MEASURED CAPS ARE RETIRED BY NAME, 2026-09-12 (13-19, D-05), in the
// same move 13-18 made for install-copy.ts's four. Five numbers travelled with
// this module's strings and copy.spec.ts held every one of them:
//
//  - HONESTY_CAP (86): tryOnBudgetReason was the honesty slot's fifth
//    candidate, so its worst form (`Setup and Timer`) was held under
//    install-copy.ts's cap from outside - 2 x CH_PER_LINE, the 43 characters
//    plan 10-01 measured for one Body line box in Phase 10's 372px install
//    column. Plan 10-03 shortened the literal to 85 to fit it. 13-18 retired
//    the cap with the column it measured; the reason now reads in the
//    register and no number governs it.
//  - SURPRISE_ALL_HELD's 53 (10-UI-SPEC 13.4): a count of the sentence as
//    written, held in copy.spec.ts and tune-ui.spec.ts. The sentence is
//    rewritten (it said "every knob" where 13-10 scoped Randomize off the
//    MIDI settings, so the count had already stopped describing the state)
//    and no count replaces it.
//  - KNOB_HOLD / KNOB_HELD at 4 / 4: the two labels were the same width so
//    toggling one could not reflow the row it ends. `Lock` and `Locked` are
//    not, and the invariant is kept by GEOMETRY instead: Knob.svelte's and
//    ColourPicker.svelte's .lock rules give the button a fixed inline-size
//    that holds the longer word, so the column is the same width in either
//    state. The invariant moved from a letter count to a CSS rule, and the
//    rule is where it should always have been.
//  - MIX_TWO 7, MIX_LINE 75, MIX_THIS / MIX_THAT 8 / 8 (10-UI-SPEC 13.4):
//    gone with the family (D-12; below).
//  - forecastExpansion's 44 "at the placeholder": a count of a sentence that
//    did not change, and it goes with the others because a number in a copy
//    module is a description, not a rule.
//
// The picker's seven counts live in colour-picker.spec.ts beside the picker
// and are the one exception: those seven strings are unchanged (they were
// already in the register), so their spec is untouched and its numbers still
// describe them.
//
// THE MIX FAMILY IS GONE BY NAME, 2026-09-12 (13-19 closing the row 13-10
// opened; 13-CONTEXT D-12 cut the feature). Plan 10-11's four strings -
// MIX_TWO (the control's two-word uppercase label), MIX_LINE (`Takes half its
// settings from each, at random. Nothing is sent to your ZONA.`), MIX_THIS and
// MIX_THAT (the two candidates, `THIS ONE` and `THAT ONE`) - and their
// composer mixChildName(changes) were left standing by 13-10 (which deleted
// MixTwo.svelte, mix.ts and mix.spec.ts) so that plan's count term stayed
// honest. They are deleted here, with copy.spec.ts's seven assertions over
// them and A-15's genetics-vocabulary scan, which existed to keep the
// crossover metaphor off a control that no longer exists.
//
// METERS_UNAVAILABLE IS RETIRED BY NAME, 2026-09-12 (13.1-07; 13.1-CONTEXT
// D-10, D-12's rule; 13.1-PLAN-CHECK W-14). `The character counter couldn’t
// load, so the two budgets aren’t shown. Everything else here still works.`
// was the one Body line TuningRegion.svelte rendered in the meters' place
// when the formatter never resolved (D-08). The workspace's meters are hidden
// by the user's word (bench line 8) and that branch went with them, so the
// string lost its only reader. Nothing replaces it, and the state it named
// is not left silent by accident: an unmeasurable budget leaves the tuner's
// pair undefined, and the destination zone's Apply is a real `disabled` on
// `config === undefined`, so no visitor is left with an enabled write and no
// number. The meter family below (TUNING_CAPTION, SETUP_CAPTION,
// TIMER_CAPTION, meterNumerals, meterPercent, MEASURING, meterExpansion,
// emptyTimerExpansion, forecastDelta, forecastExpansion) stays exported: the
// Sandbox's BudgetMeter.svelte still reads the meter strings under its own
// room line, which D-10 keeps and the gate's bench row asks about, and the
// forecast pair keeps U+2212's one scope; whether the forecast strings retire
// with the ghost is the gate's (13.1-08) to decide by name.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

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
 * The back-off control under an over-budget message. A verb on a button, in
 * sentence case (D-05); the site's own idiom, which the ladder line shares
 * ("turned down"). Deliberately NOT `Put it back`: `Put back` is the device
 * band's own control for restoring a module's configuration, and two
 * near-identical labels on one page would be a hazard on hardware people
 * paid for.
 */
export const TURN_IT_DOWN = "Turn it down";

/**
 * The share control for two seconds after the link is on the clipboard.
 * 13-18-BATCH.md row F.11, approved (D-23); the control at rest reads the
 * PDF's `Share snapshot` (inspector-copy.ts, SHARE_SNAPSHOT).
 */
export const LINK_COPIED = "Link copied";

/**
 * The lock toggle on a setting's row, off and on. Section 7 permits parameter
 * locks "only when the configuration has enough randomizable parameters to
 * justify them"; they exist and they are justified, and the words are section
 * 7's own noun in sentence case.
 *
 * A WORD RATHER THAN AN ICON, and the word CHANGES rather than only the
 * `aria-pressed` state, so the lock's state is in its accessible name. The
 * two words are different widths; the row does not reflow because the button
 * has a fixed inline-size (see the header's retirement of the 4 / 4 rule).
 */
export const KNOB_HOLD = "Lock";
export const KNOB_HELD = "Locked";

/**
 * The reason beside a disabled Randomize when every setting it could change is
 * locked. Two facts: every randomizable setting is locked, and the MIDI
 * settings do not count because Randomize never touches them (section 7:
 * "Preserve MIDI destination, channel, routing, and device target"; plan
 * 13-10's scope rule). It names the STATE and never the control directly
 * above it.
 *
 * `surpriseIndices` already answers a fully-locked roll by handing the
 * previous indices back - its documented exhaustion signal - so the control
 * would otherwise be a button that appears to do nothing, which is worse than
 * a disabled one.
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
 * in exactly one place in the whole of `src/`.
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
 * 908.`
 *
 * It exists because the signed delta is a NUMBER BESIDE A POINTER, and a
 * number beside a pointer is pointer-only information. This sentence is real
 * text in the DOM, wired to the option by aria-describedby, so the forecast
 * reaches a visitor who arrives at the option with a keyboard.
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
 * The knob selector's group label.
 *
 * It names the QUESTION rather than the control, because the options beside it
 * are already the settings' own labels and "Which colour knob" would repeat
 * the word the caption above it has just said.
 */
export const COLOUR_WHICH = "Which colour";

/**
 * Each rail's visually-hidden label.
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
 * A picker on an entry with more than one colour setting has to say WHICH one
 * a rail belongs to, and the entries that need it carry different labels - so
 * writing the prefixed strings out would be a table of sentences that drifts
 * from the catalog. The setting's own label leads and the channel word drops
 * to lower case behind it, which is the same "lower-case only the first
 * character of the compiler's own label" rule `ladderLine` already uses.
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
 * The cheap-step ticks' hidden expansion.
 *
 * The ticks are a 2px mark under six of the sixteen detents, which is
 * information no assistive technology can reach. It says what the mark MEANS
 * rather than where the marks are, because the rail already announces its own
 * position and a list of six numbers would be a second copy of the arithmetic.
 */
export const COLOUR_CHEAP_STEPS = "Marked steps cost the fewest characters.";

/**
 * The unaffordable detents' hidden expansion.
 *
 * NO ADJACENT REASON LINE. The meter two centimetres away is the cause, and a
 * sentence beside the rail would be a third place saying the same 908. This is
 * the accessible twin of a shortened rail, not a message.
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
 * the click will apply.
 *
 * The compiler's label OPENS this sentence rather than sitting inside one, so
 * it keeps its own capital, where the two ladder lines lower-case it. That is
 * the whole of the rule "lower-cased at the first character WHERE THEY SIT
 * INSIDE ANOTHER SENTENCE".
 */
export function backOffLadder(
  label: string,
  event: EventWord,
  at: number,
): string {
  return `${label}. Puts ${event} at ${at} of 908.`;
}

/**
 * The reason beside a disabled Apply to ZONA. It names the budget and does not
 * repeat the setting's sentence: they are two different jobs. The way back is
 * in the second sentence, and the register's own verb ("apply") stands for the
 * control without re-casing its label into prose.
 *
 * No cap governs it any more (the header's retirement of HONESTY_CAP); the
 * three forms move together because the interpolation is inside one sentence.
 */
export function tryOnBudgetReason(events: BudgetEvents): string {
  return `Over the 908-character budget on ${events}. Turn something down to apply it.`;
}

// ---------------------------------------------------------------------------
// Sharing.

// SHARE_QUIET_LINE WAS HERE, AND ITS ABSENCE IS AN AMENDMENT RATHER THAN A GAP.
//
// `Copies this configuration, knobs and all, as a link anyone can open.` is
// RETIRED OUTRIGHT by plan 10-03 (10-UI-SPEC.md, R-07), with no replacement.
// A string goes only when the control beside it already says the same thing,
// and `Share snapshot` names itself: a labelled button whose whole job is in
// its two words does not need a sentence explaining that it shares a link.
// Nothing that names a risk, a consequence, a way back or a next step was
// retired with it - SHARE_FALLBACK_LINE below stays whole, because it is the
// one that tells a visitor what to do when the copy did not happen.

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
 * There are none, and the empty list is the assertion.
 *
 * Nothing on the tuning panel writes to a module or destroys anything
 * recoverable: Reset settings and Turn it down both act immediately, with no
 * dialog, and Undo randomize is one click away. The one confirmation on the
 * site that precedes a write to flash (Store on ZONA) is install-copy.ts's.
 */
export const DESTRUCTIVE_CONFIRMATIONS: readonly string[] = [];
