// The ported shelf presets as catalog entries (D-09): FIVE of the nine since change 17C.
//
// `name` and `description` are READ from the shelf (../presets.ts, HANGAR's own declaration of
// the nine since 11-05) through presetById, never restated here; what HANGAR owns is the table
// below - the feel-based tags, the Featured flag, the addedAt date and the resting-black fact.
// `tpad` left this table at 12-10 when the hand-authored entries/trackpad.ts took its place, and
// `radar` at change 12b (2026-09-18) when entries/radar.ts rebuilt it by hand for the clock
// idiom, and `faders` and `ninepads` at change 17C (2026-09-23) when entries/faders.ts and
// entries/ninepads.ts rebuilt them by hand for the latch; the four presets stay on the shelf,
// reached through `portedEntry(id)`. The shelf is never extended: a card can leave this table
// but nothing joins it. ../presets.spec.ts diffs all nine against the vendored nine and fails on
// any difference not declared with a reason.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { presetById } from "../presets";
import { previewFor, type CatalogEntry, type CatalogSource } from "../types";
import { PRESET_MIDI } from "./ported-midi";

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
    id: "joystick",
    tags: ["modulation", "expressive", "still"],
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
 * The browse metadata of the shelf cards that are NOT in the catalog.
 *
 * `tpad` carried these three tags and the resting-black fact while it was a
 * card; they are kept so that `portedEntry("tpad")` builds the same shape the
 * catalog used to hold, and so the over-budget probe tunes the card as it was
 * published. `radar` likewise since change 12b (2026-09-18): the hand-authored
 * entries/radar.ts holds the id in the catalog, and `portedEntry("radar")`
 * still builds the preset card for the suites that run the compiled preset;
 * `faders` and `ninepads` likewise since change 17C (entries/faders.ts,
 * entries/ninepads.ts). Nothing reads these
 * rows for a listing, because nothing lists them.
 */
const SHELF_ONLY_META: readonly PortedMeta[] = [
  {
    id: "tpad",
    tags: ["pointing", "precise", "still"],
    featured: false,
    restsBlack: true,
  },
  {
    id: "radar",
    tags: ["modulation", "generative", "expressive"],
    featured: false,
    restsBlack: false,
  },
  // Change 17C (2026-09-23): the hand-authored entries/faders.ts holds the id since FOUR FADERS
  // took the latch and per-fader outputs; the preset stays on the shelf for the suites.
  {
    id: "faders",
    tags: ["mixing", "readable", "still"],
    featured: false,
    restsBlack: false,
  },
  // Change 17C likewise: entries/ninepads.ts holds the id since NINE PADS took the latch.
  {
    id: "ninepads",
    tags: ["play", "playable", "readable"],
    featured: true,
    restsBlack: false,
  },
];

function entryFromMeta(meta: PortedMeta): CatalogEntry {
  // A typo in an id must be a startup failure, not a silently short catalog.
  const preset = presetById(meta.id);
  if (!preset) {
    throw new Error(`ported entry names no shelf preset: ${meta.id}`);
  }
  const source: CatalogSource = { kind: "preset", presetId: meta.id };
  // Change 17C: a wrapped card's MIDI outputs (ported-midi.ts) - their knobs are ordinary token
  // knobs on the entry, and the shelf knobs they take over leave the compiler's rack.
  const midi = PRESET_MIDI[meta.id];
  const knobs = midi?.knobs ?? [];
  return {
    id: meta.id,
    name: preset.name,
    description: preset.sentence,
    tags: meta.tags,
    featured: meta.featured,
    addedAt: PORTED_ADDED_AT,
    source,
    preview: previewFor(source),
    // A PadState card's own knobs are TUNE-01's, read off the vendored preset (knobs.preset.ts);
    // what the entry carries is its MIDI outputs' knobs alone (change 17C) - catalog.spec.ts
    // holds a preset entry's knobs to exactly the knobs its outputs name.
    knobs,
    defaults: Object.fromEntries(knobs.map((knob) => [knob.id, knob.default])),
    ...(midi === undefined
      ? {}
      : { outputs: midi.outputs, supersedes: midi.supersedes }),
    restsBlack: meta.restsBlack,
  };
}

export const PORTED: readonly CatalogEntry[] = PORTED_META.map(entryFromMeta);

/**
 * A shelf preset as the catalog entry it is - or was.
 *
 * For the ones in PORTED this returns the same object the catalog holds. For
 * `tpad`, `radar`, `faders` and `ninepads` it builds the entry the catalog held (until plan
 * 12-10, change 12b and change 17C), from the same table shape, so the tuner can mount the shelf's
 * over-budget fixture and the suites can run the compiled preset without the
 * card being listed, routed or pictured. `byId` is asked FIRST wherever an id
 * may be both: `byId("radar")` is the hand-authored card. Undefined for an id
 * that is on no shelf: src/lib/tune/model.ts falls back to this after `byId`
 * and must still throw for an unknown id.
 */
export function portedEntry(id: string): CatalogEntry | undefined {
  const listed = PORTED.find((entry) => entry.id === id);
  if (listed) return listed;
  const meta = SHELF_ONLY_META.find((row) => row.id === id);
  return meta ? entryFromMeta(meta) : undefined;
}
