// A hand-authored card's colour knob on the RGB444 lattice (change 19, BENCH-2026-09-16.txt
// section 19): the four or five colours its author wrote FIRST, in their old order - so every
// index a saved copy, a test or a default names still names its old literal, byte for byte - then
// every other colour of the 4,096, in lattice order. One rung per RGB444 cell: an old colour
// that is not a multiple of 17 (`0,200,255`) STANDS IN its cell instead of `0,204,255`, so the
// stamp's three-character colour field (one cell) still names exactly one rung. `palette` on the
// knob is those first colours, and the picker draws them as its quick-pick row. The cell rule is
// the vendored `quantiseColour`'s (each channel to the nearest multiple of 17), restated because
// the catalog may not import the compiler; catalog.spec.ts holds it against the vendored one.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Sixteen steps a channel, 255 / 15 apart. */
export const LATTICE_STEP = 17;
/** 16 x 16 x 16: every colour the pad's RGB444 state and the stamp's colour field can hold. */
export const LATTICE_SIZE = 4096;

const INTEGER = /^[0-9]+$/;

/** A literal's three channels, or undefined when it is not `r,g,b` inside 0..255. */
function channelsOf(literal: string): [number, number, number] | undefined {
  const parts = literal.split(",");
  if (parts.length !== 3 || !parts.every((part) => INTEGER.test(part))) {
    return undefined;
  }
  const [r, g, b] = parts.map(Number);
  return r <= 255 && g <= 255 && b <= 255 ? [r, g, b] : undefined;
}

/** The RGB444 cell (red high, blue low) a literal lands in, or undefined when it is not a colour. */
export function cellOf(literal: string): number | undefined {
  const rgb = channelsOf(literal);
  if (rgb === undefined) return undefined;
  const [r, g, b] = rgb.map((v) => Math.round(v / LATTICE_STEP));
  return (r << 8) | (g << 4) | b;
}

/** A cell's own literal: every channel a multiple of 17. */
export function cellLiteral(cell: number): string {
  return [(cell >> 8) & 15, (cell >> 4) & 15, cell & 15]
    .map((level) => level * LATTICE_STEP)
    .join(",");
}

/** The 4,096 lattice literals in cell order, built once and shared. */
const LATTICE: readonly string[] = Object.freeze(
  Array.from({ length: LATTICE_SIZE }, (_, cell) => cellLiteral(cell)),
);

const built = new Map<string, readonly string[]>();

/**
 * A colour knob's rungs: `palette` first in its own order, then every cell no palette colour
 * occupies. Memoised by the palette, so the four ORBIT rings share one list. Throws on a palette
 * entry that is not a colour or on two that share a cell - one of them could never be restored.
 */
export function paletteLattice(palette: readonly string[]): readonly string[] {
  const key = palette.join("|");
  const known = built.get(key);
  if (known !== undefined) return known;
  const taken = new Set<number>();
  for (const literal of palette) {
    const cell = cellOf(literal);
    if (cell === undefined) throw new Error(`${literal} is not a colour`);
    if (taken.has(cell)) throw new Error(`${literal} shares a cell`);
    taken.add(cell);
  }
  const rungs = Object.freeze([
    ...palette,
    ...LATTICE.filter((_, cell) => !taken.has(cell)),
  ]);
  built.set(key, rungs);
  return rungs;
}

/** A lattice colour knob's two fields from its old colours: `...onLattice([...])` in an entry. */
export function onLattice(palette: readonly string[]): {
  values: readonly string[];
  palette: readonly string[];
} {
  return { values: paletteLattice(palette), palette };
}

/** True for a colour knob that carries a whole lattice (the presets' own, or a card's palette-first one). */
export function isLatticeKnob(knob: {
  kind: string;
  values: readonly string[];
}): boolean {
  return knob.kind === "colour" && knob.values.length === LATTICE_SIZE;
}

const indexByCell = new WeakMap<readonly string[], Int16Array>();

/** Cell -> the rung standing in it, for a list with one rung per cell. Cached per list. */
export function rungByCell(values: readonly string[]): Int16Array {
  const known = indexByCell.get(values);
  if (known !== undefined) return known;
  const out = new Int16Array(LATTICE_SIZE).fill(-1);
  values.forEach((literal, at) => {
    const cell = cellOf(literal);
    if (cell !== undefined && out[cell] < 0) out[cell] = at;
  });
  indexByCell.set(values, out);
  return out;
}

/** Each sample channel: one, two and three digits - the sweep's length-complete sample (D-06). */
export const LATTICE_SAMPLE_CHANNELS: readonly number[] = [0, 17, 255];

/**
 * The rungs a sweep visits on a lattice knob instead of all 4,096: every palette rung, then the
 * rung standing in each of the 27 cells whose channels are 0, 17 or 255 (every literal length
 * from `0,0,0` to the corner `255,255,255`). Ascending, no repeats.
 */
export function latticeSample(knob: {
  values: readonly string[];
  palette?: readonly string[];
}): readonly number[] {
  const byCell = rungByCell(knob.values);
  const out = new Set<number>(
    Array.from({ length: knob.palette?.length ?? 0 }, (_, at) => at),
  );
  for (const r of LATTICE_SAMPLE_CHANNELS) {
    for (const g of LATTICE_SAMPLE_CHANNELS) {
      for (const b of LATTICE_SAMPLE_CHANNELS) {
        const at = byCell[cellOf(`${r},${g},${b}`) as number];
        if (at >= 0) out.add(at);
      }
    }
  }
  return [...out].sort((a, b) => a - b);
}
