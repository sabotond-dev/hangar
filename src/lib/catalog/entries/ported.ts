// The nine ported shelf presets as catalog entries (D-09).
//
// `name` and `description` are READ from the vendored shelf through
// presetById, never restated here, so a BOTOR re-sync that renames a card shows
// up in the catalog instead of silently disagreeing with it. What HANGAR owns
// is the table below: the feel-based tags, the Featured flag, the addedAt date
// and the resting-black fact.
//
// The vendored PRESETS array stays the nine and is never extended (D-09). New
// configurations land in this module's siblings, not in src/vendor/.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { presetById } from "../../../vendor/botor/_pad";
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
// restsBlack is a recorded fact, not a preference: frames.spec.ts test 5
// asserts it in both directions against frames.json. tpad is the only ported
// entry that rests black - it writes no LEDs at all, which
// golden-frames.spec.ts's own note already records.
const PORTED_META = [
  {
    id: "aurora",
    tags: ["ambient", "flowing", "colour"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "pinwheel",
    tags: ["rotating", "multi-touch", "colour"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "starfield",
    tags: ["ambient", "generative", "calm"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "radar",
    tags: ["rippling", "xy-control", "hypnotic"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "joystick",
    tags: ["expressive", "pitch-bend", "sprung"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "ninepads",
    tags: ["drums", "playable", "grid"],
    featured: true,
    restsBlack: false,
  },
  {
    id: "faders",
    tags: ["mixing", "readable", "rails"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "dial",
    tags: ["endless", "gestural", "precise"],
    featured: false,
    restsBlack: false,
  },
  {
    id: "tpad",
    tags: ["desktop", "pointer", "utility"],
    featured: false,
    restsBlack: true,
  },
] as const;

export const PORTED: readonly CatalogEntry[] = PORTED_META.map((meta) => {
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
});
