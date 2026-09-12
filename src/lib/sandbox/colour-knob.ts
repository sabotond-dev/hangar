// A region's colour as the one KnobView shape Swatch.svelte and
// ColourPicker.svelte already render (plan 13-16; 13-09 built the swatch and
// this plan reuses it UNCHANGED - the picker is the most expensive
// correctness in the tree and is not re-written for a second caller).
//
// A colour knob on the Playground is 4,096 options over the RGB444 lattice
// with the knob's index a lattice position (view.ts: `colourPosition`). A
// region stores its colour as three RGB444 LEVELS (schema.ts). This module
// is the door between the two: `colourKnobView` builds the KnobView whose
// index is the region's colour as a position, and `levelsOf` turns the
// position the picker reports back into the three levels the region
// stores. The 4,096 value views are built once and shared, for the reason
// src/lib/tune/model.ts gives for its own cache - `swatchName`'s HSL
// arithmetic 4,096 times per keystroke is the wrong price for a swatch.
//
// This module imports src/lib/tune/view.ts, which imports nothing (its
// header), and never the compiler.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  COLOUR_LATTICE_SIZE,
  colourLevels,
  colourPosition,
  colourChannel,
  positionText,
  swatchName,
  swatchOf,
  type KnobValueView,
  type KnobView,
} from "../tune/view";

/** The one id the region's colour knob carries; the picker reports it back. */
export const COLOUR_KNOB_ID = "colour";

let latticeViews: readonly KnobValueView[] | undefined;

/** "r,g,b" at a lattice position, the literal form the view helpers read. */
function literalAt(position: number): string {
  return colourLevels(position).map(colourChannel).join(",");
}

/** The 4,096 resolved colour views, built once. */
export function latticeValues(): readonly KnobValueView[] {
  latticeViews ??= Object.freeze(
    Array.from({ length: COLOUR_LATTICE_SIZE }, (_, at) => {
      const literal = literalAt(at);
      const name = swatchName(literal, at, COLOUR_LATTICE_SIZE);
      return {
        label: name ?? positionText(at, COLOUR_LATTICE_SIZE),
        swatch: swatchOf(literal),
        name,
      };
    }),
  );
  return latticeViews;
}

/** The region's colour as the swatch's knob, at its position on the lattice. */
export function colourKnobView(
  colour: readonly [number, number, number],
  defaultColour: readonly [number, number, number],
  label: string,
): KnobView {
  return {
    id: COLOUR_KNOB_ID,
    label,
    kind: "colour",
    widget: "colour",
    values: latticeValues(),
    index: colourPosition(colour),
    default: colourPosition(defaultColour),
  };
}

/** A lattice position, as the picker reports it, back to the three stored levels. */
export function levelsOf(position: number): readonly [number, number, number] {
  return colourLevels(position);
}
