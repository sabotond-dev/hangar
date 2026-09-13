// The ported shelf presets as catalog entries (D-09): EIGHT of the nine since 12-10.
//
// `name` and `description` are READ from the shelf (../presets.ts, HANGAR's own declaration of
// the nine since 11-05) through presetById, never restated here; what HANGAR owns is the table
// below - the feel-based tags, the Featured flag, the addedAt date and the resting-black fact.
// The ninth, `tpad`, left this table when the hand-authored entries/trackpad.ts took its place
// (the compiler strips every look from a trackpad state); the preset stays on the shelf as the
// compiler's over-budget fixture, reached through `portedEntry("tpad")`. The shelf is never
// extended: a card can leave this table but nothing joins it. ../presets.spec.ts diffs all nine
// against the vendored nine and fails on any difference not declared with a reason.
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
// Each row is EXACTLY THREE terms - one FOR then two FEELS - from the closed thirteen in
// src/lib/browse/facets.ts (D-10); three is the rule for every entry in the catalog. Nothing
// here may coin a word.
//
// restsBlack is a recorded fact: frames.spec.ts test 5 asserts it in both directions against
// frames.json. No ported entry rests black since 12-10 (tpad was the one that did).
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
    // Empty on purpose: a PadState card's knobs are TUNE-01's, read off the vendored preset;
    // catalog.spec.ts test 7 requires an empty array on a preset entry.
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
