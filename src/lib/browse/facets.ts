// The browse vocabulary: thirteen closed terms in two facets, and the rule
// that decides what a chip is.
//
// IT WAS SIXTEEN UNTIL PLAN 11-01 (D-01). The user's bench report removed nine
// configurations, which took `play`, `drums` and `clips` to exactly one entry
// each against the zero-singleton rule below. THE RULE WAS NOT WEAKENED. Two
// thin FOR terms were RETIRED - `drums` and `clips` - and their two surviving
// carriers were re-homed onto terms that describe how the cards actually feel
// (CONT-03): `ninepads` is nine drum pads under your fingers, so it is `play`;
// `stage` is nine scene buttons that send keystrokes to a streaming
// application, so it is `shortcuts`. Eight FOR terms remained and every one of
// them carried two or more.
//
// IT WAS FOURTEEN UNTIL PLAN 12-04, AND D-01 ANSWERED THE SAME ARITHMETIC THE
// SAME WAY. The second bench round removed LATTICE, FORGE and SHUTTLE, which
// took `keys` to exactly one entry (CHORUS) and `still` to five (FORGE carried
// it). NEITHER RULE WAS WEAKENED THIS TIME EITHER. `keys` was RETIRED and
// CHORUS re-homed onto `play` - nine drum pads, a snake, and nine chords under
// your fingers are all things you reach for a pad in order to PLAY - and LUMEN
// was re-homed onto `still`, which is the word the card's own quiet line
// already used. Seven FOR terms remain and every one of them carries two or
// more.
//
//   A THIRTEENTH REMOVAL MAY BREAK A FEELS RULE, AND WHICH ONE DEPENDS ENTIRELY
//   ON THE CARD. `still` is back at EXACTLY 6 by re-homing, which is the floor
//   `facets.spec.ts` asserts ("below six it is not a filter"), so removing any
//   one of JOYSTICK, FADERS, TRACKPAD, MORPH, STRIP or LUMEN goes red at once
//   (TRACKPAD carries the tpad preset's three tags since plan 12-10 folded the
//   preset into a hand-authored card; this line named TPAD until the 12-12
//   gate recounted every term from LISTING - still 6, precise 7).
//   `precise` is at 7 and has one to spare; the other four FEELS terms have
//   two or more to spare. On the FOR side `shortcuts` and `pointing` sit at
//   two, so removing either of their carriers retires a term the way `keys`
//   was retired here. This is written here, beside the zero-singleton note,
//   rather than in a planning document nobody greps - because this file's spec
//   is what goes red.
//
//   AND THE SENTENCE THIS REPLACES HAD ALREADY GONE UNTRUE. It read "`precise`
//   and `still` land at EXACTLY 6 after 11-01"; plan 11-15 added WHEELS with
//   `precise` on it and took that term to 7 without touching this line, because
//   nothing gates a sentence. Every count above is recounted from LISTING at
//   plan 12-04 rather than carried from the line before it.
//
// D-10, and it replaces a derivation. Until this module existed a chip was "a
// tag two or more entries happen to carry" (filter.ts's chipTags), computed
// over a vocabulary of fifty-five terms, twenty-seven of which sat on exactly
// one entry. Three quarters of a vocabulary matching a single card each is a
// list, not a filter.
//
//   THE RULE. A term earns a chip because it is a member of a declared facet.
//   EVERY FACET MEMBER IS ALWAYS A CHIP. The vocabulary is closed and lives
//   here; it is not derived from counts, so it does not drift as the catalog
//   grows, and no disclosure is needed. An entry that cannot be described with
//   these thirteen terms is evidence that the vocabulary is wrong, not that the
//   entry needs a new word.
//
// WHY THIS MODULE IMPORTS NOTHING - not a value, not even a type.
// The same discipline front-door.ts, listing.ts, sort.ts and filter.ts carry,
// for the same measured reason: a runtime import of $lib/catalog here would
// drag entries/ported.ts, the vendored compiler and @intechstudio/grid-protocol
// - a 131,101-byte chunk, measured in 04-RESEARCH's Bundle facts - onto the
// first paint of /playground/ (D-12). /playground/ is prerendered and the thirteen
// terms have to be in its HTML at first paint, so they cannot arrive behind a
// chunk.
//
// It goes one step further than its neighbours and declares NO import at all,
// including no `import type`. That is what forces every function below to take
// its data as an argument - the shape parseBrowseQuery already uses - rather
// than reaching for ListingEntry. facets.spec.ts scans this file's own source
// and fails on any specifier whatsoever.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Which of the two facets a term belongs to. */
export type FacetName = "for" | "feels";

/**
 * Facet 1 - what you would reach for it to do (D-03's niche and workflow).
 * Exactly one per entry, which is what makes the OR semantics below necessary
 * rather than merely conventional.
 */
export type ForTerm =
  | "modulation"
  | "show"
  | "mixing"
  | "sequencing"
  | "shortcuts"
  | "pointing"
  | "play";

/** Facet 2 - how it behaves under a finger and under an eye. Two per entry. */
export type FeelsTerm =
  | "readable"
  | "expressive"
  | "playable"
  | "generative"
  | "precise"
  | "still";

export type FacetTerm = ForTerm | FeelsTerm;

/**
 * Seven terms, in the toolbar's order - which is descending by how many entries
 * carry them, so the widest doors are nearest the left edge.
 *
 * Re-sorted by plan 11-01, because the removals changed the order as well as
 * the membership: at 27 entries it was modulation 7, show 5, mixing 3,
 * sequencing 3, shortcuts 3, keys 2, pointing 2, play 2 - which summed to 27,
 * one FOR slot per entry, with no singleton in it.
 *
 * RE-SORTED AGAIN BY PLAN 12-04, AND RECOUNTED FROM LISTING RATHER THAN
 * SUBTRACTED FROM THAT LINE - which had drifted, and this is why the rule is
 * to recount: plans 11-14 and 11-15 each added an entry, taking `sequencing`
 * to 4 and the catalog to 29, and neither re-sorted this array, so the row
 * shipped out of order by one pair for two waves and nothing was red. At 26
 * entries it is modulation 7, show 5, sequencing 4, mixing 3, play 3,
 * shortcuts 2, pointing 2 - which sums to 26, one FOR slot per entry, and has
 * no singleton in it. Ties keep the order they had. `keys` is gone; the header
 * says why.
 */
export const FOR_TERMS: readonly ForTerm[] = Object.freeze([
  "modulation",
  "show",
  "sequencing",
  "mixing",
  "play",
  "shortcuts",
  "pointing",
]);

/**
 * Six terms, in the toolbar's order. PLAN 11-01 MOVED NONE OF THEM, and that is
 * the half of D-01 worth writing down: the nine removals cost the FOR facet two
 * terms and cost the FEELS facet nothing. PLAN 12-04 MOVED NONE OF THEM EITHER,
 * and it cost something to keep it that way: FORGE took `still` to five, and
 * LUMEN was re-homed onto the term rather than the floor being lowered to fit.
 *
 * They did cost it headroom. `still` sits at exactly 6, which is the floor, and
 * `precise` at 7 - see the note at the top of this file.
 *
 * `still` and `generative` are OPPOSITES on the motion axis - the axis a
 * visitor most wants to filter on ("show me the ones that move by themselves")
 * and the one no chip in the retired vocabulary expressed at all.
 *
 * LUMEN IS THE CARD THAT AXIS WAS HARDEST ON, and the reading is recorded here
 * rather than left to the next person to re-derive. It has no Timer at all
 * (docs/HARDWARE-AUDITION.md lists it among the six Setup-only cards), so
 * nothing about it moves untouched, which is exactly what the axis asks. What
 * DOES move is one cursor cell under a finger and the colour it sends - and
 * that is true of every other carrier of `still` too: JOYSTICK, TPAD, MORPH
 * and STRIP are all controls whose whole purpose is to move under a hand. The
 * term has never meant "inert"; it means "it does not run on its own". LUMEN's
 * own quiet line in listing.ts already said the word - "The whole field stays
 * lit and still" - which is where it came from rather than from the
 * arithmetic.
 */
export const FEELS_TERMS: readonly FeelsTerm[] = Object.freeze([
  "readable",
  "expressive",
  "playable",
  "generative",
  "precise",
  "still",
]);

/** A facet: its name, the caption above its row, and its members. */
export type Facet = {
  readonly name: FacetName;
  /** Micro role, uppercase, and already so - never uppercased at render time. */
  readonly caption: string;
  readonly terms: readonly FacetTerm[];
};

/** The two, in the order their rows sit above the grid. */
export const FACETS: readonly Facet[] = Object.freeze([
  Object.freeze({ name: "for", caption: "FOR", terms: FOR_TERMS }),
  Object.freeze({ name: "feels", caption: "FEELS", terms: FEELS_TERMS }),
]);

/** Which facet a term belongs to, or undefined for a word neither declares. */
export function facetOf(term: string): FacetName | undefined {
  if ((FOR_TERMS as readonly string[]).includes(term)) return "for";
  if ((FEELS_TERMS as readonly string[]).includes(term)) return "feels";
  return undefined;
}

/** The active chips, one list per facet. Either may be empty. */
export type FacetSelection = {
  readonly for: readonly string[];
  readonly feels: readonly string[];
};

/**
 * OR WITHIN A FACET, AND ACROSS FACETS. This is a named amendment to
 * 05.1-UI-SPEC's "Combining is AND".
 *
 * `FOR: play, shortcuts` shows every instrument pad and every macro pad. The
 * example read `play, keys` until plan 12-04 retired `keys`, and a doc comment
 * naming a term the module no longer declares is the kind of thing no test
 * catches.
 * `FOR: play` plus `FEELS: generative` shows the generative ones.
 *
 * The OR half is REQUIRED rather than conventional, and the reason is in the
 * data: `FOR` gives every entry EXACTLY ONE term, so under a pure AND any
 * second `FOR` chip would return zero entries and immediately disable itself. A
 * facet where the second click is always dead is not a facet.
 *
 * The entry is taken structurally rather than as a ListingEntry, because this
 * module imports nothing (see the header). Anything with tags can be asked.
 */
export function matchesFacets(
  entry: { readonly tags: readonly string[] },
  active: FacetSelection,
): boolean {
  const anyOf = (terms: readonly string[]) =>
    terms.length === 0 || terms.some((term) => entry.tags.includes(term));
  return anyOf(active.for) && anyOf(active.feels);
}

/**
 * The retired vocabulary: the fifty-five terms the catalog carried before this
 * re-cut, sorted.
 *
 * HISTORY, AND IT NEVER GROWS. Nothing may be added here - a word that is not
 * on this list was never a shipped tag, so no shared link can name it. It
 * exists to bound the map below, and facets.spec.ts asserts that every key of
 * LEGACY_TAG_MAP is one of these.
 */
export const RETIRED_VOCABULARY: readonly string[] = Object.freeze([
  "accessible",
  "ambient",
  "automation",
  "blend",
  "blooming",
  "calm",
  "chords",
  "clips",
  "colour",
  "desktop",
  "drawing",
  "drums",
  "endless",
  "expressive",
  "flowing",
  "game",
  "generative",
  "gestural",
  "grid",
  "hands-free",
  "harmonic",
  "hotkeys",
  "hypnotic",
  "in-key",
  "instrument",
  "isomorphic",
  "latching",
  "launcher",
  "lighting",
  "looper",
  "macros",
  "mixing",
  "modulation",
  "multi-touch",
  "photo",
  "pitch-bend",
  "playable",
  "pointer",
  "polar",
  "polyrhythm",
  "precise",
  "radial",
  "rails",
  "readable",
  "rippling",
  "rotating",
  "sequencer",
  "sound-design",
  "sprung",
  "still",
  "streaming",
  "utility",
  "video",
  "wavetable",
  "xy-control",
]);

/**
 * `?tag=` is accepted for one release, and maps here.
 *
 * EVERY ONE OF THE FIFTY-FIVE IS A KEY, and thirty-three of them are keys whose
 * value is `undefined` WRITTEN OUT. That is deliberate and it is not the same
 * as a missing key: `"looper" in LEGACY_TAG_MAP` is true and
 * `LEGACY_TAG_MAP.looper` is undefined, so a reader can tell "a tag this site
 * really shipped, with no honest home in the new vocabulary" apart from "a word
 * that was never a tag at all". 10-07 needs exactly that distinction.
 *
 * THE RULE THAT DECIDED EVERY ROW, in two clauses:
 *
 *   1. A term that is itself one of the thirteen maps to ITSELF. Eight do. The
 *      word survives with a declared meaning, so the link still names something
 *      the site names.
 *   2. A retired term maps to a facet member only when TWO OR MORE entries
 *      carried it AND every one of those entries carries that member after the
 *      re-cut. Fourteen do. Anything else maps to undefined.
 *
 * PLAN 11-01 MOVED TWO ROWS FROM CLAUSE 1 TO CLAUSE 2, and nothing else in this
 * table. `drums` and `clips` stopped being facet members under D-01, so they
 * stopped qualifying for clause 1 and fell to clause 2 - which they satisfy,
 * because each had two carriers when it shipped as a chip. The counts went
 * 10 + 12 to 8 + 14; the total is still 55 and RETIRED_VOCABULARY did not grow,
 * because both words were already on it.
 *
 * PLAN 12-04 MOVED NO ROW BETWEEN CLAUSES AND ADDED NONE. `harmonic` was a
 * clause-2 fold before its destination was retired and is one after it was
 * re-targeted, so the split is still 8 + 14 and the total is still 55. What
 * moved is a single VALUE - see the row itself. AND NO `keys` ROW WAS ADDED,
 * for three reasons that each settle it alone: `keys` is not one of the
 * fifty-five (it was minted at the 10-06 re-cut as `harmonic`'s destination and
 * was therefore never a shipped `?tag=`); the header above forbids the list
 * growing at all; and query.ts consults this table only for `?tag=`, so a row
 * here could not migrate a `?for=keys` link even if one existed. The fate of
 * those links is recorded in REQUIREMENTS.md under CAT-01 instead, which is
 * where a decided cost belongs.
 *
 * Clause 2's first half is why no singleton is mapped. A tag that sat on
 * exactly one entry MEANT THAT CARD - it is what somebody shares when they mean
 * "look at this one" - so sending `?tag=looper` to a nine-entry `modulation`
 * chip would show them a grid they never saw. 10-UI-SPEC 9.4 rules on where an
 * unmapped value goes instead, and it is NOT dropped: it becomes the search
 * query, `?tag=looper` landing as `?q=looper`. That destination is 10-07's;
 * this module only declares the table.
 *
 * Clause 2's second half is arithmetic rather than taste - a destination no
 * carrier carries would be a link that lies - but it is arithmetic that can
 * only be done ONCE, against the listing as it stood before the re-cut. The
 * retired tags are gone from the data now, so no test can recompute who carried
 * `hypnotic`. That is exactly why RETIRED_VOCABULARY is written down above and
 * why 10-06-SUMMARY.md records the derivation's output. What facets.spec.ts can
 * still check, and does, is that this table's keys are the fifty-five and its
 * values are facet members or undefined.
 *
 * Which of the permitted candidates a row took IS taste, and it is the only
 * taste in the table.
 */
export const LEGACY_TAG_MAP: Readonly<Record<string, FacetTerm | undefined>> =
  Object.freeze({
    // Clause 1 - the eight that survive, mapping to themselves.
    expressive: "expressive",
    generative: "generative",
    mixing: "mixing",
    modulation: "modulation",
    playable: "playable",
    precise: "precise",
    readable: "readable",
    still: "still",

    // Clause 2 - fourteen folds. `hypnotic` into `generative` is the one
    // 10-UI-SPEC 9.4 names out loud.
    accessible: "readable",
    ambient: "generative",
    blooming: "playable",
    calm: "generative",
    // THE TWO PLAN 11-01 ADDED, AND THE FACT NEITHER ROW RECOVERS FROM THE
    // DATA: each of these tags had exactly two carriers, and ONE OF EACH PAIR
    // WAS DELETED RATHER THAN RE-HOMED. `clips` was carried by `stage` and
    // `gridlock`; `gridlock` is gone and `stage` is now `shortcuts`. `drums`
    // was carried by `ninepads` and `slam`; `slam` is gone and `ninepads` is
    // now `play`. So each destination is where EVERY SURVIVING carrier went,
    // which is what clause 2 asks - but a future reader counting carriers in
    // today's listing would find one apiece and wrongly read these as singleton
    // folds. They are not, and this comment is the only place that says so.
    clips: "shortcuts",
    drums: "play",
    colour: "show",
    game: "play",
    // THE ROW PLAN 12-04 RE-TARGETED, AND THE FACT IT CANNOT RECOVER FROM THE
    // DATA. `harmonic` had exactly two carriers when it shipped as a chip -
    // CHORUS and the entry called KEYS - and 09-04-SUMMARY.md:597 is the only
    // surviving record of that ("Two tags crossed the two-carrier threshold -
    // `harmonic` (CHORUS plus KEYS)"). THE KEYS ENTRY was deleted by plan
    // 11-01 rather than re-homed, so CHORUS is the only surviving carrier.
    // 10-06 folded `harmonic` into the FOR term `keys`; plan 12-04 retired that
    // TERM as well and sent CHORUS to `play`. So this row has been folded
    // TWICE, at two different re-cuts, and the two things sharing the word are
    // unrelated - the deleted ENTRY was named KEYS and the retired TERM was
    // `keys`. Somebody counting carriers in today's listing would find one and
    // read this as a singleton fold. It is not, and this comment is the only
    // place that says so.
    harmonic: "play",
    hypnotic: "generative",
    latching: "readable",
    macros: "still",
    rails: "mixing",
    sequencer: "sequencing",

    // Twenty-six of the twenty-seven singletons of the FIFTY-FIVE-term
    // vocabulary: they meant one card each, so they go to the search field
    // rather than to a chip. The twenty-seventh is `clips`, which sat on
    // gridlock alone back then, and it is above.
    //
    // `clips` IS THEREFORE THE ONE ROW WITH TWO HISTORIES, and both are true of
    // different vocabularies. In the fifty-five it was a singleton on gridlock;
    // 10-06 promoted it to a facet member and `stage` took it too, so as a CHIP
    // it shipped with two carriers - which is the count clause 2 asks about,
    // because a shared `?tag=clips` link could only have been made while it was
    // a chip. Plan 11-01 retired it and it maps to `shortcuts`.
    automation: undefined,
    blend: undefined,
    chords: undefined,
    desktop: undefined,
    drawing: undefined,
    endless: undefined,
    flowing: undefined,
    "in-key": undefined,
    instrument: undefined,
    isomorphic: undefined,
    launcher: undefined,
    lighting: undefined,
    looper: undefined,
    "multi-touch": undefined,
    photo: undefined,
    "pitch-bend": undefined,
    pointer: undefined,
    polar: undefined,
    polyrhythm: undefined,
    radial: undefined,
    rotating: undefined,
    "sound-design": undefined,
    sprung: undefined,
    streaming: undefined,
    video: undefined,
    wavetable: undefined,

    // Seven that two or more entries carried and that no single facet member
    // covers: their carriers scattered across the new vocabulary, so there is no
    // destination that would not lie to somebody. 8 + 14 + 26 + 7 = 55.
    gestural: undefined,
    grid: undefined,
    "hands-free": undefined,
    hotkeys: undefined,
    rippling: undefined,
    utility: undefined,
    "xy-control": undefined,
  });
