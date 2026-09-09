// The front-door row: which configurations the visitor meets, in what order,
// and what each of them does with no finger on it.
//
// WHY THIS FILE RESTATES `name` AND `description` INSTEAD OF READING THEM.
// The obvious implementation is `byId(id).name`. It is wrong here.
// src/lib/catalog/entries/ported.ts reads those strings off the vendored shelf
// through `presetById`, which is a VALUE import from src/vendor/botor/_pad.ts,
// which imports @intechstudio/grid-protocol at module scope - a 131,101-byte
// chunk (measured in 04-RESEARCH, Bundle facts). The front door's prerendered
// HTML needs every entry's name and description at first paint, so the module
// that carries them has to be reachable without dragging the Lua compiler and
// its WASM formatter along behind it.
//
// So the duplication is deliberate, and it is GATED: front-door.spec.ts looks
// every id up with `byId` and asserts `name` and `description` are strictly
// equal to the catalog's. This is the same shape as src/lib/protocol-pin.ts and
// Phase 8's ZONA_MODULE_TYPE - a literal held against another source by a spec,
// rather than an import that costs a chunk.
//
// Consequently this module imports NOTHING. Not src/vendor, not
// @intechstudio/grid-protocol, not $lib/pad, and not ./index. The spec's last
// test scans this file's own source and fails on any of them.
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
    id: "tpad",
    why: "It writes no LEDs at all, so it is a black square. It stays in the catalog; the front door is not where it belongs until a look gives it lights.",
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
    id: "lattice",
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
    id: "shuttle",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "cull",
    why: "The front door is a curated row; new configurations join it deliberately, not by arriving in the catalog.",
  },
  {
    id: "forge",
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
];

/**
 * The row, in ring order. Index 0 is the opening centre and the ring wraps, so
 * index 7 is the first step LEFT from the opening.
 *
 * | index | id        | motion   | why it sits here                                    |
 * |-------|-----------|----------|-----------------------------------------------------|
 * | 0     | aurora    | animated | featured, and the opening centre                     |
 * | 1     | pinwheel  | animated | featured, first step right                           |
 * | 2     | ninepads  | static   | featured, and the first quiet pad sits two steps out |
 * | 3     | starfield | animated |                                                      |
 * | 4     | joystick  | static   |                                                      |
 * | 5     | radar     | animated |                                                      |
 * | 6     | faders    | static   |                                                      |
 * | 7     | dial      | animated | first step LEFT, so the wrap neighbour moves         |
 *
 * WHAT THIS ORDER ACHIEVES, AND WHAT IT DELIBERATELY DOES NOT.
 * D-20 asks for an opening window that is motion-only. With eight entries and a
 * radius of three the window is seven of the eight, so a motion-only window is
 * arithmetically impossible while three of the eight are honestly still - and
 * faking their motion is forbidden. What this order achieves instead, and what
 * the spec asserts, is the strongest property that IS reachable:
 *
 *   - no dark pad is in the opening window (tpad is excluded from the row);
 *   - the three largest pads at the opening - offsets -1, 0 and +1, which are
 *     dial, aurora and pinwheel - all move;
 *   - the three quiet pads land on 2, 4 and 6, so no two of them are ever side
 *     by side on the ring, including across the wrap.
 *
 * The weaker property is deliberate, not sloppy. A visitor never sees two dead
 * squares together, and the pads nearest the eye are always in motion.
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
      "Nine drum pads drawn on the lights, each one a note, with the one you are holding lit up.",
    motion: "static",
    // Authored here: the shelf preset carries no quiet line of its own.
    quiet:
      "This one is an instrument rather than a light show. The nine zones stay lit and wait for a finger.",
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
      "Left-right is pitch bend and snaps back straight. Up-down is a mod amount that falls to zero on lift.",
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
