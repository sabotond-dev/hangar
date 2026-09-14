// The demonstration finger: what a card shows when its configuration paints nothing until it is
// touched (D-09; 10-UI-SPEC 9.3: a configuration that paints nothing until touched is given a finger,
// not a light - HANGAR supplies the gesture, the firmware every lit pixel, MOTION IS NEVER FAKED).
// A DemoPath is a short array of { tick, pointer, event, x, y } samples replayed into the EXISTING
// TouchSampler at the existing rate (one sample per contact per 10 ms tick, MOVEs coalescing) and
// looped over a fixed period; nothing here calls an engine's touch methods, and there is no timer -
// driveDemo is a pure function of (path, tick) the host calls from its own tick loop. Samples are
// authored in CELL coordinates (integers 0 to 8); cellToCoord converts to the sensor value for a
// fingertip centred on the cell, the knot in calibration.ts (Probe C, 2026-09-11), scaled x8 for a
// hi-res state. Three paths since 12-10 (GHOST, MORPH, TRACKPAD); DARK_BY_CONSTRUCTION is empty and stays declared for gen-og.mjs.
// Decided at 10-06 / 11-01 / 12-10 / 12.1-05; see .planning/phases/12.1-gradient-touch/12.1-05-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { sensorAt } from "../catalog/calibration";
import type { TouchSampler } from "./touch";

/** The three firmware contact events a path may name. */
export type DemoEvent = "down" | "move" | "up";

/**
 * One authored sample. `tick` is the offset into the path's period, `pointer`
 * is the demo's own pointer id (it becomes a contact SLOT inside the sampler,
 * never an engine id), and x and y are CELL coordinates, integers 0 to 8.
 */
export interface DemoSample {
  readonly tick: number;
  readonly pointer: number;
  readonly event: DemoEvent;
  readonly x: number;
  readonly y: number;
}

/**
 * One entry's demonstration gesture. `periodTicks` is longer than the last sample's tick on purpose:
 * the tail is where the configuration gets to answer (GHOST's ghost retraces there).
 */
export interface DemoPath {
  /** The catalog id this path was authored against. */
  readonly id: string;
  /** What the gesture is, in the words 10-UI-SPEC 9.3 uses for it. */
  readonly gesture: string;
  readonly periodTicks: number;
  readonly samples: readonly DemoSample[];
}

/**
 * The three methods a driver needs from ./touch's sampler, as a Pick of the real class so a demo
 * sample checkably goes through the SAME queue as a finger; an `import type`, erased at build.
 */
export type DemoSampler = Pick<TouchSampler, "down" | "move" | "end">;

/** The pad is nine cells across and nine down. */
export const DEMO_CELLS = 9;

/**
 * A cell index to the value the sensor reports for a fingertip centred on it: calibration.ts's
 * sensorAt(cell, axis), the knot itself, scaled x8 for coordMax 1023. The axis is required: the two
 * tables differ by up to 4 raw units. A re-run of the probe that moves a knot moves every demo finger.
 */
export function cellToCoord(
  cell: number,
  coordMax: number,
  axis: "x" | "y",
): number {
  return sensorAt(cell, axis, coordMax);
}

/**
 * Queue whatever this path has to say on this tick, and nothing else. Pure: the caller owns the tick
 * counter and the modulo is taken here. Returns how many samples were queued.
 */
export function driveDemo(
  path: DemoPath,
  tick: number,
  sampler: DemoSampler,
  coordMax: number,
): number {
  const at = ((tick % path.periodTicks) + path.periodTicks) % path.periodTicks;
  let queued = 0;
  for (const sample of path.samples) {
    if (sample.tick !== at) continue;
    const x = cellToCoord(sample.x, coordMax, "x");
    const y = cellToCoord(sample.y, coordMax, "y");
    if (sample.event === "down") sampler.down(sample.pointer, x, y);
    else if (sample.event === "move") sampler.move(sample.pointer, x, y);
    else sampler.end(sample.pointer);
    queued++;
  }
  return queued;
}

/** A straight run of MOVE samples between two cells, one every `every` ticks; the cells are rounded. */
function drag(
  pointer: number,
  from: readonly [number, number],
  to: readonly [number, number],
  startTick: number,
  steps: number,
  every: number,
): DemoSample[] {
  const out: DemoSample[] = [];
  for (let i = 1; i <= steps; i++) {
    const f = i / steps;
    out.push({
      tick: startTick + i * every,
      pointer,
      event: "move",
      x: Math.round(from[0] + (to[0] - from[0]) * f),
      y: Math.round(from[1] + (to[1] - from[1]) * f),
    });
  }
  return out;
}

/**
 * GHOST: a drag that leaves a ghost, the red corner that takes it back, and a second drag that
 * replaces it (rewritten with the entry in 11-11). Ticks 8-76 a drag with the comet following;
 * 76-240 the ghost retraces with no finger and the erase key pulses bottom-right; 240-244 a press on
 * that corner, then 56 ticks of black (the reset worked); 300-352 a second drag that REPLACES the
 * first; 352-600 the second ghost, where the period ends - never on the reset, because gen-og.mjs
 * captures a demo entry at the END of its path and fails a dark frame. The corner is (8, 8) in cells,
 * the outer knots KX[8] = KY[8] = 126, which the entry reads through the library's `N` (12.1-08a) as LED (8,8).
 */
const GHOST_PATH: DemoPath = {
  id: "ghost",
  gesture: "a drag, the red corner that takes it back, and a second drag",
  periodTicks: 600,
  samples: [
    { tick: 8, pointer: 1, event: "down", x: 1, y: 7 },
    ...drag(1, [1, 7], [4, 2], 8, 8, 4),
    ...drag(1, [4, 2], [7, 6], 40, 8, 4),
    { tick: 76, pointer: 1, event: "up", x: 7, y: 6 },
    { tick: 240, pointer: 1, event: "down", x: 8, y: 8 },
    { tick: 244, pointer: 1, event: "up", x: 8, y: 8 },
    { tick: 300, pointer: 1, event: "down", x: 7, y: 1 },
    ...drag(1, [7, 1], [2, 4], 300, 6, 4),
    ...drag(1, [2, 4], [6, 7], 324, 6, 4),
    { tick: 352, pointer: 1, event: "up", x: 6, y: 7 },
  ],
};

/**
 * MORPH: a slide between two corners and back, the contact released where it started. Four macros
 * in the four corners, each corner's brightness its own weight. Measured over a steady-state period:
 * 19 to 21 lit cells, the 19 staying lit after the lift - the weights are a state, not an animation.
 */
const MORPH_PATH: DemoPath = {
  id: "morph",
  gesture: "a slide between two corners and back",
  periodTicks: 360,
  samples: [
    { tick: 8, pointer: 1, event: "down", x: 0, y: 0 },
    ...drag(1, [0, 0], [8, 8], 8, 12, 4),
    ...drag(1, [8, 8], [0, 0], 80, 12, 4),
    { tick: 136, pointer: 1, event: "up", x: 0, y: 0 },
  ],
};

/**
 * TRACKPAD: a drag around the pad - right, up, left, down - and a fifth run right ending at tick 158,
 * seventeen ticks before the period, so the edge flash (42 ticks of decay) is still lit in the frame
 * gen-og.mjs captures at the period's end; the lift at 164 carries more than 120 units, so no click.
 * Measured against the recipe after a first draft shipped a black picture: the segments are
 * contiguous, six ticks apart, because the recipe forgets a held contact after 25 silent Timer calls
 * (`s.q>25`) and re-registers the next sample as a NEW contact with a four-call hold-off; and every
 * sample moves one whole cell (114 units on the ten-bit axes), because a half-cell step lands on the
 * same cell twice and the host's change gate drops the repeat.
 */
const TRACKPAD_PATH: DemoPath = {
  id: "trackpad",
  gesture: "a drag right, up, left and down around the pad, then right again",
  periodTicks: 176,
  samples: [
    { tick: 8, pointer: 1, event: "down", x: 1, y: 4 },
    ...drag(1, [1, 4], [7, 4], 8, 6, 6),
    ...drag(1, [7, 4], [7, 1], 44, 3, 6),
    ...drag(1, [7, 1], [2, 1], 62, 5, 6),
    ...drag(1, [2, 1], [2, 7], 92, 6, 6),
    ...drag(1, [2, 7], [7, 7], 128, 5, 6),
    { tick: 164, pointer: 1, event: "up", x: 7, y: 7 },
  ],
};

/** Every authored path, keyed by catalog id: three since 12-10 (TRACKPAD joined GHOST and MORPH; ETCH left at 11-01). */
export const DEMO_PATHS: Readonly<Record<string, DemoPath>> = {
  ghost: GHOST_PATH,
  morph: MORPH_PATH,
  trackpad: TRACKPAD_PATH,
};

/**
 * The dark entries a finger cannot help, with the reason each is here. EMPTY since 12-10: the tpad
 * preset (measured 2026-09-08: zero of 81 cells lit at every tick of every gesture, because its draft
 * enables no LED layer) left the catalog for the hand-authored TRACKPAD, whose edge flash is a real
 * light. Still declared because gates read it: scripts/gen-og.mjs exempts an entry from its non-dark
 * gate ONLY if named here, so removing a demo path turns that gate red instead of re-exempting the entry.
 */
export const DARK_BY_CONSTRUCTION: readonly { id: string; why: string }[] = [];

/** The path for an entry, or undefined. The one lookup a component needs. */
export function demoPathFor(id: string): DemoPath | undefined {
  return Object.prototype.hasOwnProperty.call(DEMO_PATHS, id)
    ? DEMO_PATHS[id]
    : undefined;
}

/** True when this entry is dark because its configuration writes no LED. */
export function isDarkByConstruction(id: string): boolean {
  return DARK_BY_CONSTRUCTION.some((entry) => entry.id === id);
}
