// The browse vocabulary: sixteen closed terms in two facets, and the rule that
// decides what a chip is.
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
//   these sixteen terms is evidence that the vocabulary is wrong, not that the
//   entry needs a new word.
//
// WHY THIS MODULE IMPORTS NOTHING - not a value, not even a type.
// The same discipline front-door.ts, listing.ts, sort.ts and filter.ts carry,
// for the same measured reason: a runtime import of $lib/catalog here would
// drag entries/ported.ts, the vendored compiler and @intechstudio/grid-protocol
// - a 131,101-byte chunk, measured in 04-RESEARCH's Bundle facts - onto the
// first paint of /browse/ (D-12). /browse/ is prerendered and the sixteen terms
// have to be in its HTML at first paint, so they cannot arrive behind a chunk.
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
  | "keys"
  | "mixing"
  | "sequencing"
  | "shortcuts"
  | "pointing"
  | "play"
  | "drums"
  | "clips";

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
 * Ten terms, in the toolbar's order - which is descending by how many entries
 * carry them, so the widest doors are nearest the left edge.
 */
export const FOR_TERMS: readonly ForTerm[] = Object.freeze([
  "modulation",
  "show",
  "keys",
  "mixing",
  "sequencing",
  "shortcuts",
  "pointing",
  "play",
  "drums",
  "clips",
]);

/**
 * Six terms, in the toolbar's order.
 *
 * `still` and `generative` are OPPOSITES on the motion axis - the axis a
 * visitor most wants to filter on ("show me the ones that move by themselves")
 * and the one no chip in the retired vocabulary expressed at all.
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
 * `FOR: drums, keys` shows every drum pad and every keyboard. `FOR: drums` plus
 * `FEELS: generative` shows the generative drum pads.
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
 *   1. A term that is itself one of the sixteen maps to ITSELF. Ten do. The
 *      word survives with a declared meaning, so the link still names something
 *      the site names.
 *   2. A retired term maps to a facet member only when TWO OR MORE entries
 *      carried it AND every one of those entries carries that member after the
 *      re-cut. Twelve do. Anything else maps to undefined.
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
    // Clause 1 - the ten that survive, mapping to themselves.
    clips: "clips",
    drums: "drums",
    expressive: "expressive",
    generative: "generative",
    mixing: "mixing",
    modulation: "modulation",
    playable: "playable",
    precise: "precise",
    readable: "readable",
    still: "still",

    // Clause 2 - twelve folds. `hypnotic` into `generative` is the one
    // 10-UI-SPEC 9.4 names out loud.
    accessible: "readable",
    ambient: "generative",
    blooming: "playable",
    calm: "generative",
    colour: "show",
    game: "play",
    harmonic: "keys",
    hypnotic: "generative",
    latching: "readable",
    macros: "still",
    rails: "mixing",
    sequencer: "sequencing",

    // Twenty-six of the twenty-seven singletons: they meant one card each, so
    // they go to the search field rather than to a chip. The twenty-seventh is
    // `clips`, which sat on gridlock alone and is above, because clause 1 outranks
    // clause 2 - a surviving word maps to itself whatever its old count was.
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
    // destination that would not lie to somebody. 10 + 12 + 26 + 7 = 55.
    gestural: undefined,
    grid: undefined,
    "hands-free": undefined,
    hotkeys: undefined,
    rippling: undefined,
    utility: undefined,
    "xy-control": undefined,
  });
