// The demonstration finger: what a card shows when its configuration paints
// nothing until it is touched.
//
// D-09 is the user's instruction that no pad thumbnail stays dark. The evidence
// that decides how it is met is src/lib/catalog/frames.json: four entries -
// tpad, ghost, morph and etch - record nonZeroBytes 0 at every one of the five
// sampled ticks, so there is no representative motion frame to fall back on.
// The choice was therefore "change what four pads do on somebody's hardware" or
// "supply a finger", and 10-UI-SPEC 9.3 rules:
//
//   Every card paints. A configuration that paints nothing until it is touched
//   is given a finger, not a light. HANGAR supplies the gesture; the firmware
//   supplies every lit pixel. MOTION IS NEVER FAKED.
//
// That is the whole design of this file. A DemoPath is a short array of
// { tick, pointer, event, x, y } samples. It is replayed into the EXISTING
// TouchSampler from ./touch, at the EXISTING rate - at most one sample per
// contact per 10 ms tick, MOVEs coalescing to newest, DOWN and UP always
// keeping their place - and looped over a fixed period. Nothing here calls
// engine.touchDown, engine.touchMove or engine.touchUp: the sampler decides the
// rate and the host delivers. If a driver ever reached an engine directly, the
// firmware-faithful guarantee Phase 4 signed off would be gone and this file
// would be an animation rather than a gesture.
//
// THERE IS NO TIMER HERE. driveDemo is a pure function of (path, tick) and the
// host calls it from inside its own tick loop, so a demo card is tick-locked to
// the same 100 Hz clock as every other pad and there is nothing left running
// after destroy().
//
// THE COORDINATE SPACE, STATED ONCE. Samples are authored in the pad's own CELL
// coordinates: integers 0 to 8 on both axes, x across and y down, exactly the
// nine columns and nine rows a visitor sees. The engine reads LED coordinates
// (0..coordMax, 127 or 1023 depending on the state's resolution), so cellToCoord
// converts at queue time to the CENTRE of the named cell. Authoring in cells is
// what makes a path readable and what makes it identical on a 127 pad and a
// 1023 one; converting at the centre is what keeps a sample off a cell boundary,
// where a rounding difference would land the finger one column over.
//
// WHY tpad IS NOT HERE, MEASURED RATHER THAN ASSUMED. See DARK_BY_CONSTRUCTION
// below: three of the four dark entries light up under a finger and one cannot,
// because its configuration enables no LED layer at all.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
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
 * One entry's demonstration gesture.
 *
 * `periodTicks` is the loop length in 10 ms firmware ticks, and it is longer
 * than the last sample's tick on purpose: the tail is where the configuration
 * gets to answer. GHOST's ghost retraces there, which is the entry's whole
 * point, and a path whose period ended at its last sample would cut it off.
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
 * The three methods a driver needs from ./touch's sampler.
 *
 * Declared as a Pick of the real class rather than as a fresh interface: the
 * point of this file is that a demo sample goes through the SAME queue as a
 * visitor's finger, and naming TouchSampler is what makes that checkable rather
 * than merely stated. It is an `import type`, so it is erased at build time and
 * this module still imports nothing at runtime.
 */
export type DemoSampler = Pick<TouchSampler, "down" | "move" | "end">;

/** The pad is nine cells across and nine down. */
export const DEMO_CELLS = 9;

/**
 * A cell index to the LED coordinate at that cell's centre.
 *
 * The inverse of touch.ts's mapAxis, which floors offset/extent*(max+1) into a
 * cell. Taking the centre - (cell + 0.5) rather than cell - is what keeps a
 * sample away from the boundary between two cells, where the two resolutions
 * would not agree on which column the finger is in.
 */
export function cellToCoord(cell: number, coordMax: number): number {
  const centre = Math.floor(((cell + 0.5) * (coordMax + 1)) / DEMO_CELLS);
  return Math.min(Math.max(centre, 0), coordMax);
}

/**
 * Queue whatever this path has to say on this tick, and nothing else.
 *
 * Pure: the same (path, tick) always queues the same samples, and the only
 * state it touches is the sampler it was handed. The caller owns the tick
 * counter and the modulo is taken here, so a host that simply counts up gets
 * the loop for free.
 *
 * Returns how many samples were queued, which is what lets a test assert the
 * driver is doing something rather than passing over an empty walk.
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
    const x = cellToCoord(sample.x, coordMax);
    const y = cellToCoord(sample.y, coordMax);
    if (sample.event === "down") sampler.down(sample.pointer, x, y);
    else if (sample.event === "move") sampler.move(sample.pointer, x, y);
    else sampler.end(sample.pointer);
    queued++;
  }
  return queued;
}

/**
 * A straight run of MOVE samples between two cells, one every `every` ticks.
 *
 * Authored as a helper rather than as sixty literal rows because the literals
 * would be unreadable and a typo in one of them would be invisible. The cells
 * are rounded, so a diagonal crosses real cells rather than fractional ones.
 */
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
 * GHOST: one drag that leaves a ghost, then a lift - and the ghost retraces on
 * its own, which is the entry's whole point.
 *
 * The lift at tick 76 is barely a third of the way into the period. Everything
 * after it is the configuration playing back what the finger did, with no
 * finger anywhere near the pad. MEASURED over a steady-state period: 14 cells
 * lit at every tick of the loop, minimum 14 and maximum 14, with the contact
 * released for five sixths of it.
 */
const GHOST_PATH: DemoPath = {
  id: "ghost",
  gesture: "one drag that leaves a ghost, then a lift",
  periodTicks: 600,
  samples: [
    { tick: 8, pointer: 1, event: "down", x: 1, y: 7 },
    ...drag(1, [1, 7], [4, 2], 8, 8, 4),
    ...drag(1, [4, 2], [7, 6], 40, 8, 4),
    { tick: 76, pointer: 1, event: "up", x: 7, y: 6 },
  ],
};

/**
 * MORPH: a slide between two corners and back.
 *
 * Four macros live in the four corners and each corner's brightness is its own
 * weight, so a corner-to-corner slide is the entry demonstrating exactly what
 * its description promises. The path ends back at the corner it started from,
 * with the contact released. MEASURED over a steady-state period: never below
 * 19 lit cells and never above 21, and the 19 stay lit after the lift - the
 * weights are a state, not an animation.
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
 * ETCH: a short stroke drawn, then a fast sweep that wipes it - and then a
 * second short stroke, which is both the picture the card rests on and the head
 * of the next loop.
 *
 * The third gesture is not decoration and it is not in 10-UI-SPEC 9.3's
 * one-line description of the gesture. It is there because the wipe works: a
 * path that ended on the sweep would leave the pad black, and a black pad at
 * the end of the path is a black OG image and a black reduced-motion still
 * frame - the exact outcome D-09 exists to remove. MEASURED: the pad peaks at
 * 15 lit cells while the strokes are on it, falls to 0 the tick the sweep
 * lands, and rests at 5 for the whole tail of the period.
 */
const ETCH_PATH: DemoPath = {
  id: "etch",
  gesture: "a short stroke drawn, then a fast sweep that wipes it",
  periodTicks: 420,
  samples: [
    { tick: 8, pointer: 1, event: "down", x: 2, y: 2 },
    ...drag(1, [2, 2], [6, 2], 8, 6, 4),
    ...drag(1, [6, 2], [6, 6], 32, 6, 4),
    { tick: 60, pointer: 1, event: "up", x: 6, y: 6 },
    // The sweep. Four cells of travel per tick is what "fast" means to a
    // configuration that measures a stroke's speed; the stroke above moved less
    // than one cell per tick.
    { tick: 160, pointer: 2, event: "down", x: 0, y: 4 },
    { tick: 161, pointer: 2, event: "move", x: 4, y: 4 },
    { tick: 162, pointer: 2, event: "move", x: 8, y: 4 },
    { tick: 163, pointer: 2, event: "up", x: 8, y: 4 },
    // The picture the card rests on. It starts 27 ticks after the sweep rather
    // than at the end of a long pause: the wiped pad IS black, and the shorter
    // that window the less of a 4.2 second loop a visitor can glance at and see
    // nothing. MEASURED over a steady-state period: 29 black ticks of 420,
    // 6.9 per cent. GHOST and MORPH are never black at any tick of theirs.
    { tick: 190, pointer: 3, event: "down", x: 3, y: 6 },
    ...drag(3, [3, 6], [5, 3], 190, 6, 4),
    { tick: 238, pointer: 3, event: "up", x: 5, y: 3 },
  ],
};

/**
 * Every authored path, keyed by catalog id.
 *
 * THREE, not four. See DARK_BY_CONSTRUCTION.
 */
export const DEMO_PATHS: Readonly<Record<string, DemoPath>> = {
  ghost: GHOST_PATH,
  morph: MORPH_PATH,
  etch: ETCH_PATH,
};

/**
 * The dark entries a finger cannot help, with the reason each one is here.
 *
 * 10-UI-SPEC 9.3 groups all four dark entries as configurations "that paint
 * nothing UNTIL THEY ARE TOUCHED". That is true of three of them and false of
 * Trackpad, and the difference is not a matter of authoring a better gesture:
 *
 *   MEASURED on 2026-09-08 against the shipped engine, over a one-finger drag,
 *   a two-finger scroll, a single tap, a two-finger tap and 2,000 idle ticks:
 *   tpad lights ZERO of 81 cells at every tick of every one of them.
 *
 * The reason is in the preset itself. src/vendor/botor/_pad.ts's tpad draft
 * sets look.kind = "none", touch.kind = "none" and enabled = { look: false,
 * touch: false, sends: true }: Trackpad is a pointer, it sends, and it has no
 * LED layer to light. src/lib/catalog/front-door.ts:62-63 has said so since the
 * front-door row was drawn - "It writes no LEDs at all, so it is a black square
 * ... until a look gives it lights."
 *
 * So the only way to put a picture on that card is to give the configuration a
 * look it does not have, which is 10-UI-SPEC 9.3's option (a), which that table
 * REJECTS by name: it changes what the pad does on somebody's hardware. Between
 * "every card paints" and "the firmware supplies every lit pixel", the ruling
 * itself says which is superior - motion is never faked - so this card stays
 * dark and says so in its own sentence rather than being lit by HANGAR.
 *
 * This list is not a convenience. It is what gates read: scripts/gen-og.mjs
 * exempts an entry from its non-dark gate ONLY if it is named here, so removing
 * a demo path from ghost, morph or etch turns that gate red instead of quietly
 * re-exempting the entry.
 */
export const DARK_BY_CONSTRUCTION: readonly { id: string; why: string }[] = [
  {
    id: "tpad",
    why: "The Trackpad draft enables no LED layer at all - look.kind and touch.kind are both none and both disabled - so no gesture can light a cell. Measured at 0 of 81 lit over a drag, a two-finger scroll, taps and 2,000 idle ticks.",
  },
];

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
