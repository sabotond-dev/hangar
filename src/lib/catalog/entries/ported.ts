// The ported shelf presets as catalog entries (D-09): EIGHT of the nine since
// plan 12-10.
//
// `name` and `description` are READ from the shelf through presetById, never
// restated here. What HANGAR owns is the table below: the feel-based tags, the
// Featured flag, the addedAt date and the resting-black fact.
//
// WHY EIGHT, AND WHERE THE NINTH WENT. The user's answer at plan 12-06's
// checkpoint - "selectable tuning options under Trackpad" - folds the bench's
// edge-flash ask into ONE trackpad card whose look is a tune option. The
// vendored `tpad` preset cannot carry a look (the compiler strips every look
// from a trackpad state, and the preset sits at 907 of 908 at its worst), so
// the card is the hand-authored entries/trackpad.ts, under the id `trackpad`,
// and the `tpad` row left this table. THE PRESET DID NOT LEAVE THE SHELF:
// ../presets.ts still declares all nine, ../presets.spec.ts still diffs all
// nine against the vendored nine, and `tpad` stays the compiler's over-budget
// fixture - the one card whose knob band straddles 908 - for
// src/lib/tune/ladder.spec.ts, /dev/tune/ and e2e/tuning.e2e.ts, which reach it
// through `portedEntry("tpad")` below rather than through the catalog.
//
// WHICH SHELF, AND WHY THE ANSWER CHANGED (plan 11-05). Until 11-05 this read
// src/vendor/botor/_pad.ts, and the read-through was the guarantee: a BOTOR
// re-sync that renamed a card showed up in the catalog instead of silently
// disagreeing with it. HANGAR now DECLARES the nine, in ../presets.ts, because
// while the definitions lived upstream no bench correction to a preset could be
// made here at all. So the read-through no longer holds anything against BOTOR,
// and saying otherwise here would be the exact silence it was written to
// prevent.
//
// WHAT REPLACES IT, in one line: ../presets.spec.ts diffs all nine against the
// vendored ones across `id`, `name`, `sentence`, `category`, `knobs`,
// `exclusive`, `quiet` and the whole of `state`, and fails on any difference
// not written down with a reason. That is strictly more than the two strings
// this line used to hold. The cost is that an intended divergence must now be
// DECLARED; an undeclared one is a red test rather than a quiet disagreement.
// ../catalog.spec.ts still compares these names and sentences to the VENDORED
// shelf as a second, independent guard - and that comparison became real on the
// day this import moved, because before it the two sides were one object.
//
// The shelf stays the nine and is never extended (D-09). New configurations
// land in this module's siblings, not in ../presets.ts and not in src/vendor/.
// A shelf card can LEAVE this table - `tpad` did - but nothing joins it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { presetById } from "../presets";
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";

/**
 * The date Phase 3 landed the vendored shelf. All nine ported entries share it,
 * so it is one constant rather than nine copies of a string.
 */
const PORTED_ADDED_AT = "2026-09-02";

// Tags are feel-based (CONT-03): how the card feels to use, never which
// compiler kind produced it. A look.kind or sends.kind string must never appear
// here.
//
// D-10 re-cut all nine. Each row is EXACTLY THREE terms - one FOR then two
// FEELS - drawn from the closed vocabulary in src/lib/browse/facets.ts, which
// was sixteen at 10-06, fourteen after 11-01 and is THIRTEEN after 12-04. The
// nine used to carry three terms each while the twenty-seven hand-authored
// entries carried four; that split is gone, and three is now the rule for every
// entry in the catalog. Nothing here may coin a word: a preset that cannot be
// described with the thirteen is evidence the vocabulary is wrong.
//
// restsBlack is a recorded fact, not a preference: frames.spec.ts test 5
// asserts it in both directions against frames.json. No ported entry rests
// black since 12-10: tpad was the one that did - it writes no LEDs at all,
// which golden-frames.spec.ts's own note still records of the VENDORED preset
// - and it is no longer a catalog entry.
const PORTED_META = [
  {
    id: "aurora",
    tags: ["show", "generative", "expressive"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "pinwheel",
    tags: ["show", "generative", "expressive"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "starfield",
    tags: ["show", "generative", "readable"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "radar",
    tags: ["modulation", "generative", "expressive"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "joystick",
    tags: ["modulation", "expressive", "still"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "ninepads",
    tags: ["play", "playable", "readable"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "faders",
    tags: ["mixing", "readable", "still"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "dial",
    tags: ["modulation", "precise", "expressive"],
    featured: false,
    restsBlack: false,
  },
] as const;

type PortedMeta = {
  readonly id: string;
  readonly tags: readonly string[];
  readonly featured: boolean;
  readonly restsBlack: boolean;
};

/**
 * The browse metadata of the one shelf card that is NOT in the catalog.
 *
 * `tpad` carried these three tags and the resting-black fact while it was a
 * card; they are kept so that `portedEntry("tpad")` builds the same shape the
 * catalog used to hold, and so the over-budget probe tunes the card as it was
 * published. Nothing reads them for a listing, because nothing lists it.
 */
const SHELF_ONLY_META: readonly PortedMeta[] = [
  {
    id: "tpad",
    tags: ["pointing", "precise", "still"],
    featured: false,
    restsBlack: true,
  },
];

function entryFromMeta(meta: PortedMeta): CatalogEntry {
  // A typo in an id must be a startup failure, not a silently short catalog.
  const preset = presetById(meta.id);
  if (!preset) {
    throw new Error(`ported entry names no shelf preset: ${meta.id}`);
  }
  const source: CatalogSource = { kind: "preset", presetId: meta.id };
  return {
    id: meta.id,
    name: preset.name,
    description: preset.sentence,
    tags: meta.tags,
    featured: meta.featured,
    addedAt: PORTED_ADDED_AT,
    source,
    preview: previewFor(source),
    // Empty on purpose. The compiler-driven knob vocabulary for a PadState card
    // is TUNE-01, which belongs to Phase 5 and reads PadPreset.knobs off the
    // vendored preset. Phase 8 owns knobs only for hand-authored Lua entries
    // (D-12), and catalog.spec.ts test 7 encodes exactly that rule: an empty
    // knobs array is correct on a preset entry and a failure on a Lua one.
    knobs: [],
    defaults: {},
    restsBlack: meta.restsBlack,
  };
}

export const PORTED: readonly CatalogEntry[] = PORTED_META.map(entryFromMeta);

/**
 * A shelf preset as the catalog entry it is - or was.
 *
 * For the eight in PORTED this returns the same object the catalog holds. For
 * `tpad` it builds the entry the catalog held until plan 12-10, from the same
 * table shape, so the tuner can mount the shelf's over-budget fixture without
 * the card being listed, routed or pictured. Undefined for an id that is on
 * no shelf: src/lib/tune/model.ts falls back to this after `byId` and must
 * still throw for an unknown id.
 */
export function portedEntry(id: string): CatalogEntry | undefined {
  const listed = PORTED.find((entry) => entry.id === id);
  if (listed) return listed;
  const meta = SHELF_ONLY_META.find((row) => row.id === id);
  return meta ? entryFromMeta(meta) : undefined;
}
