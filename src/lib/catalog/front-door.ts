// The front door: the configurations good enough to open the site with
// (FRONT_DOOR, a MEMBERSHIP list since 13-07 - the coverflow ring is gone), the
// one of them the intro runs as its hero (FRONT_DOOR_HERO, through
// ui/intro/HeroSurface.svelte), and what each does with no finger on it. The
// order below is what the workspace's rail lists on a cold arrival; nothing
// asserts a ring property of it. `name` and `description` are RESTATED, not
// read through byId: ported.ts reaches the vendored shelf and the protocol
// package at module scope, and the prerendered HTML needs the strings at first
// paint. The duplication is gated - front-door.spec.ts asserts strict equality
// with the catalog's. Imports NOTHING: not src/vendor, not $lib/pad, not ./index.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * What a pad does when nobody is touching it.
 *
 * Never guessed and never aspirational. `front-door.spec.ts` derives this for
 * every entry from src/lib/fidelity/golden-frames.json - "animated" when any
 * sampled tick reports `animating`, "static" when it does not but some tick
 * lights at least one byte, "dark" when it lights none - and compares. Faking
 * motion here would be faking the one thing the product claims.
 */
export type PreviewMotion = "animated" | "static" | "dark";

export type FrontDoorEntry = {
  /** Catalog id. Asserted to resolve through byId. */
  id: string;
  /** Verbatim from the catalog entry; the spec asserts equality. */
  name: string;
  description: string;
  /** What the pad does with no finger on it. Gated against golden-frames.json. */
  motion: PreviewMotion;
  /** Shown under the name plate when the pad is not animated. One line, no newline. */
  quiet?: string;
};

/**
 * Catalog entries deliberately kept out of the front-door row, with the reason.
 * Everything else in CATALOG is in the row - the spec asserts the partition, so
 * a silently dropped entry is red.
 *
 * THIS LIST GROWS, and it grows by whichever phase lands the entry: a plan that
 * appends to CATALOG registers its new id here with its own reason, until an
 * engine exists for it and the row is widened deliberately. Nothing in this
 * module or its spec may therefore depend on the LENGTH of this list or of
 * CATALOG - only on the partition between them, which is what the spec asserts.
 */
export const EXCLUDED_FROM_ROW: readonly { id: string; why: string }[] = [
  {
    // This slot was `tpad` until plan 12-10: "it writes no LEDs at all, so it
    // is a black square". The hand-authored TRACKPAD replaced it as the card
    // and inherits the exclusion for the reason every Lua entry carries.
    id: "trackpad",
    why: "Hand-authored Lua rather than a ported preset, and the ring is presets only: front-door.spec.ts requires preview === 'padsim' for every row entry, and a 'lua' row would pull the 271 KB Lua VM onto the front page's first paint. It replaced the tpad preset as the trackpad card under plan 12-10; the front door is a curated row and it joins it deliberately or not at all.",
  },
  {
    id: "euclid",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "chorus",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "arc",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "ghost",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "morph",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "sonar",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "steps",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "console",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "strip",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "lumen",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "stage",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "cull",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "snake",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "quadrant",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "pomodoro",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "wheels",
    why: "Hand-authored Lua rather than a ported preset, and the ring is presets only: front-door.spec.ts requires preview === 'padsim' for every row entry, and a 'lua' row would pull the 271 KB Lua VM onto the front page's first paint. Beyond that, the front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "radar-points",
    why: "The hand-authored radar the user asked for, built as a second card under plan 11-14's answer new-entry so the RADAR preset at ring position 5 stays exactly as it is. It cannot take that position or an eighth-plus-one: front-door.spec.ts requires preview === 'padsim' of every row entry, and 11-14-HANDOVER.md measured that the rule is live for a reason its own comment does not give - Coverflow.svelte builds an engine for every ring entry, so a 'lua' row would put the 271 KB Lua VM on the front page's first paint, which e2e/tuning.e2e.ts forbids in words. Beyond that, the front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    // TRACKPAD's recipe with a comet trail (2026-09-17, BENCH-2026-09-16.txt
    // section 4): out of the row for TRACKPAD's reason.
    id: "trackpad-comet",
    why: "Hand-authored Lua rather than a ported preset, and the ring is presets only: front-door.spec.ts requires preview === 'padsim' for every row entry, and a 'lua' row would pull the 271 KB Lua VM onto the front page's first paint. It rests black until a finger lands, like the Trackpad whose recipe it carries; the front door is a curated row and it joins it deliberately or not at all.",
  },
];

/**
 * The membership list, in the order the workspace's rail lists it (13-09) and
 * the order the coverflow once rang it. The intro's hero is derived by heroOf()
 * below - the first member that is not dark - so today it is index 0 by
 * consequence, not by decree. The order once placed the three quiet pads on 2,
 * 4 and 6 so no two sat side by side on the ring (Phase 4 D-20); the ring is
 * gone and none of that is asserted, but nothing in the Bible says what a
 * rail's order should be, so the order is kept rather than re-derived.
 */
export const FRONT_DOOR: readonly FrontDoorEntry[] = [
  {
    id: "aurora",
    name: "Aurora",
    description:
      "A band of light crosses the pad, your finger leaves a glowing tail, and the pad sends your position.",
    motion: "animated",
  },
  {
    id: "pinwheel",
    name: "Pinwheel",
    description:
      "Light turns around the centre, each finger paints in its own colour, and the pad sends your position.",
    motion: "animated",
  },
  {
    id: "ninepads",
    name: "Nine pads",
    description:
      "Sixteen drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    motion: "static",
    // Authored here: the shelf preset carries no quiet line of its own.
    quiet:
      "This one is an instrument rather than a light show. The sixteen zones stay lit and wait for a finger.",
  },
  {
    id: "starfield",
    name: "Starfield",
    description:
      "Every light breathes at its own pace, so the pad never repeats itself, and it sends your position.",
    motion: "animated",
  },
  {
    id: "joystick",
    name: "Joystick",
    description:
      "Push the pad like a synth stick: left-right bends pitch, and letting go snaps everything home.",
    motion: "static",
    // Byte-equal to PadPreset.quiet on the vendored shelf; the spec asserts it.
    quiet:
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that returns to the middle on lift.",
  },
  {
    id: "radar",
    name: "Radar",
    description:
      "Rings roll out from the centre, and the pad sends your finger's position to your computer.",
    motion: "animated",
  },
  {
    id: "faders",
    name: "Four faders",
    description:
      "Four faders side by side, each with a white rail and a coloured level you can see across the room.",
    motion: "static",
    // Authored here: the shelf preset carries no quiet line of its own.
    quiet: "Four rails, lit and still. They move when you move them.",
  },
  {
    id: "dial",
    name: "Dial",
    description:
      "Circle your finger and the pad becomes an endless knob, sending how far you turned.",
    motion: "animated",
    // Dial animates and still carries the shelf's quiet line, because that line
    // is a usage hint rather than a motion caveat. Keeping it is correct, and
    // the spec asserts it byte-for-byte against the preset.
    quiet:
      "Clockwise raises, counter-clockwise lowers. The middle of the pad stays quiet.",
  },
];

/** Index in the row, or -1. Used by the deep-link route to centre an entry. */
export function frontDoorIndex(id: string): number {
  return FRONT_DOOR.findIndex((entry) => entry.id === id);
}

/**
 * THE HERO (plan 13-07, 13-CONTEXT.md D-09 and D-14 Q2, 2026-09-11). The
 * intro at / renders ONE live surface, and this is the entry it runs.
 *
 * DERIVED, NOT DECLARED. The hero is the first member of FRONT_DOOR, in the
 * list's own order, whose motion is not "dark" - the same rule the ring's
 * opening window carried ("no dark pad opens as a black square"), reduced to
 * one member. `restsBlack` lives on the catalog entry and this module may not
 * import the catalog; front-door.spec.ts holds `restsBlack` equal to
 * `motion === "dark"` for every recorded entry and holds the hero against the
 * golden frames directly, so the two readings cannot disagree.
 *
 * If every member rested black there would be no hero, and the throw below is
 * deliberate: the plan stops on it rather than opening the site on a black
 * square. It cannot throw on today's list (aurora is animated) and the spec
 * proves the derivation on a row that would.
 */
export function heroOf(row: readonly FrontDoorEntry[]): FrontDoorEntry {
  const hero = row.find((entry) => entry.motion !== "dark");
  if (hero === undefined) {
    throw new Error(
      "every front-door member rests black: there is no hero to open with",
    );
  }
  return hero;
}

export const FRONT_DOOR_HERO: FrontDoorEntry = heroOf(FRONT_DOOR);
