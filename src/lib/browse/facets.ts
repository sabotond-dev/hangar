// The browse vocabulary: thirteen closed terms in two facets - FOR (seven, one
// per entry) and FEELS (six, two per entry) - and the rule that decides what a
// chip is: a term earns a chip because it is a member of a declared facet, never
// because of a count (D-10). No term sits on a single entry; the FEELS floor is
// six (facets.spec.ts). The vocabulary was sixteen before 11-01 and fourteen
// before 12-04; each bench round retired the thin FOR terms and re-homed their
// carriers rather than weakening either rule. RETIRED_VOCABULARY (55) and
// LEGACY_TAG_MAP carry the `?tag=` migration and never grow. Imports nothing -
// not even a type - so the terms are in /playground/'s prerendered HTML at first
// paint and no catalog chunk rides along; every function takes its data as an argument.
// Decided at 11-01 and 12-04 (D-01); see .planning/phases/12-touch-framework/12-04-SUMMARY.md
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
 * Seven terms, in the toolbar's order - descending by how many entries carry
 * them, so the widest doors are nearest the left edge; ties keep their order.
 * Recounted from LISTING at every re-cut, never subtracted from the line before
 * (at 27 entries: modulation 7, show 5, sequencing 4, mixing 3, play 3,
 * shortcuts 2, pointing 3 - TRACKPAD COMET took `pointing` to three on
 * 2026-09-17 and the row was left as it stood). `keys` was retired at 12-04.
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
 * Six terms, in the toolbar's order; neither re-cut moved one. `still` sits at
 * 7 (the floor is six; exactly 6 until 2026-09-17) and `precise` at 8. `still`
 * and `generative` are opposites on the motion axis; `still` means "it does not
 * run on its own", not "inert" - a cursor under a finger still qualifies
 * (LUMEN, JOYSTICK, STRIP).
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
 * OR WITHIN A FACET, AND ACROSS FACETS (a named amendment to 05.1-UI-SPEC's
 * "Combining is AND"): `FOR: play, shortcuts` shows both; `FOR: play` plus
 * `FEELS: generative` shows the generative ones. OR within FOR is required,
 * not conventional - every entry carries exactly one FOR term, so under AND a
 * second FOR chip would always return nothing. The entry is taken structurally
 * because this module imports nothing.
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
 * The retired vocabulary: the fifty-five terms the catalog carried before the
 * 10-06 re-cut, sorted. History, and it never grows: a word not on this list
 * was never a shipped tag, so no shared link can name it. It bounds the map
 * below (facets.spec.ts asserts every key of LEGACY_TAG_MAP is one of these).
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
 * `?tag=` is accepted for one release, and maps here. Every one of the
 * fifty-five is a key; thirty-three map to `undefined` WRITTEN OUT, so "a tag
 * this site shipped with no home in the new vocabulary" reads apart from "never
 * a tag" (`"looper" in LEGACY_TAG_MAP` is true; query.ts sends it to `?q=`).
 * Two clauses decided every row: (1) a term that is itself one of the thirteen
 * maps to itself (eight); (2) a retired term maps to a facet member only when
 * two or more entries carried it AND every one carries that member after the
 * re-cut (fourteen); anything else is undefined - a singleton tag MEANT THAT
 * CARD, and sending it to a chip would show a grid nobody shared. The
 * derivation was done once against the pre-re-cut listing (10-06-SUMMARY.md)
 * and cannot be recomputed; which permitted candidate a row took is the only
 * taste in the table. No `keys` row: never a shipped `?tag=`, and the list never grows.
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
