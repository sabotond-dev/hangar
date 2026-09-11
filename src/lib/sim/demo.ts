// The demonstration finger: what a card shows when its configuration paints
// nothing until it is touched.
//
// D-09 is the user's instruction that no pad thumbnail stays dark. The evidence
// that decides how it is met is src/lib/catalog/frames.json: three entries -
// ghost, morph and trackpad - record nonZeroBytes 0 at every one of the five
// sampled ticks, so there is no representative motion frame to fall back on.
// The choice was therefore "change what three pads do on somebody's hardware"
// or "supply a finger", and 10-UI-SPEC 9.3 rules:
//
// IT WAS FOUR UNTIL PLAN 11-01. ETCH was the fourth, and the bench asked for it
// to be removed, so its path went with it. GHOST and MORPH are untouched.
// TRACKPAD arrived at plan 12-10 in place of the tpad preset, which was the
// dark entry no finger could help; see DARK_BY_CONSTRUCTION below.
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
// nine columns and nine rows a visitor sees. The engine reads what the SENSOR
// reports (0..coordMax, 127 or 1023 depending on the state's resolution), so
// cellToCoord converts at queue time to the value the sensor reports for a
// fingertip dead-centre on the named cell: the knot for that cell in
// src/lib/catalog/calibration.ts, measured on the user's ZONA (Probe C,
// 2026-09-11), scaled x8 for a hi-res state. Authoring in cells is what makes a
// path readable and what makes it identical on a 127 pad and a 1023 one;
// converting to the knot is what puts a demo finger where the calibrated
// library's `G` draws it on the LED itself and not a third of a cell inward -
// and, on an entry that still reads `x*9//128`, exactly where the module would
// put a real finger on that cell, edge behaviour included.
//
// Until plan 12.1-05 this was the CENTRE of the cell's ninth of the axis,
// floor((cell + 0.5) * (max + 1) / 9): the inverse of touch.ts's old mapAxis,
// and a finger authored on cell 0 reached the calibrated library as raw 7,
// which `G` drew mostly on LED 1. calibration.ts is a runtime import here, and
// the one this file makes: it imports nothing itself (its own header, section
// 4), so it costs the first paint two arrays and two functions.
//
// WHY tpad WAS NOT HERE, AND WHY IT IS NOT ANYWHERE NOW. Until plan 12-10 the
// Trackpad preset was the one dark entry a finger could not help, because its
// configuration enabled no LED layer at all; DARK_BY_CONSTRUCTION below named
// it with the measurement. The user's answer at 12-06 - "selectable tuning
// options under Trackpad" - replaced that preset with the hand-authored
// TRACKPAD, whose edge flash is a real light, so the card now has a path here
// (TRACKPAD_PATH) and the exemption list is EMPTY. It stays declared, because
// scripts/gen-og.mjs and e2e/browse.e2e.ts read it, and because the next
// entry that genuinely cannot be lit goes there with its measurement.
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
 * A cell index to the value the sensor reports for a fingertip centred on it.
 *
 * The same forward map as touch.ts's mapAxis, evaluated at the integer LED
 * coordinate: calibration.ts's sensorAt(cell, axis) is the knot itself -
 * KX[cell] across, KY[cell] down - scaled x8 for a hi-res state (coordMax
 * 1023). The axis is required, not defaulted: the two tables differ by up to
 * 4 raw units, and a demo finger that read x's knot on y would sit measurably
 * off the LED row on every card. There is no second table and no centre
 * arithmetic here; a re-run of the probe that moves a knot moves every demo
 * finger with it.
 */
export function cellToCoord(
  cell: number,
  coordMax: number,
  axis: "x" | "y",
): number {
  return sensorAt(cell, axis, coordMax);
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
    const x = cellToCoord(sample.x, coordMax, "x");
    const y = cellToCoord(sample.y, coordMax, "y");
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
 * GHOST: a drag that leaves a ghost, the red corner that takes it back, and a
 * second drag that replaces it.
 *
 * REWRITTEN WITH THE ENTRY IN PLAN 11-11. The card this path was authored
 * against had no visible reset - its erase was a second finger - so the old
 * path was one drag and a lift and nothing else. The redesign's whole answer to
 * "resetting is not reliable" is a lit key on the pad, and a demonstration that
 * never presses it demonstrates the half of the card the bench did not
 * complain about.
 *
 * The three beats, and each one is a claim the entry makes:
 *
 *   ticks   8 -  76  a drag, recorded, with the comet following the finger
 *   ticks  76 - 240  the ghost retraces it with no finger on the pad, and the
 *                    erase key pulses in the bottom-right corner
 *   ticks 240 - 244  a press on that corner. The pad goes black, and STAYS
 *                    black for 56 ticks - the beat that shows the reset worked
 *   ticks 300 - 352  a second, different drag, which REPLACES the first rather
 *                    than being appended to it
 *   ticks 352 - 600  the second ghost, looping, which is where the period ends
 *
 * THE PERIOD DOES NOT END ON THE RESET, AND THAT IS NOT AN AESTHETIC CHOICE.
 * scripts/gen-og.mjs captures an entry with a demo path at the END of the path,
 * not at OG_TICK, and its gate 2 fails an entirely dark frame for any entry not
 * named in DARK_BY_CONSTRUCTION. A path that erased the pad last would ship a
 * black social preview and turn that gate red. Ending on the second ghost shows
 * the reset AND leaves the card on a lit, moving frame.
 *
 * The corner is (8, 8) in cell coordinates, which cellToCoord puts at the
 * outer knots, KX[8] = 126 and KY[8] = 126 on a 127 axis, which the entry
 * reads as 126*9//128 = 8 on both axes - screen cell 80. Derived from the
 * entry's own arithmetic rather than assumed. (Before plan 12.1-05 the same
 * corner was 120 and 120*9//128 was also 8.)
 *
 * GHOST STILL READS `x*9//128` - it is not one of the entries re-fitted on the
 * calibrated library - so since 12.1-05 its demo shows what the module shows a
 * real finger on those cells: the knots for cells 1 and 6 fall in columns 0
 * and 7 under the naive divisor, so the drawn trace sits a column out at both
 * ends. That is the sensor's behaviour, not a demo bug, and it is the honest
 * picture the forward map exists to give; whether GHOST joins the calibrated
 * entries is a catalog decision for a later plan, not this file's.
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
 * TRACKPAD: a drag around the pad, so every edge gets its turn, ending with a
 * rightward run and a lift.
 *
 * The card's edge flash is painted from the entry's Timer for the dominant
 * axis of the finger's net motion, centred on the finger's other coordinate,
 * and it decays to black in 42 ticks (the fade knob's default). So the path
 * is four runs - right, up, left, down - and a fifth run right that ends at
 * tick 158, seventeen ticks before the period. scripts/gen-og.mjs captures
 * the frame at the END of the period, and that far after the last paint the
 * right column is still around phase 160 of 252: a lit edge in the picture,
 * not a black square. The lift at tick 164 carries far more than 120 units
 * of travel, so it is a drag's end and not a tap: no click is sent.
 *
 * TWO THINGS ABOUT THIS PATH WERE MEASURED AGAINST THE RECIPE, NOT ASSUMED,
 * because the first draft of it shipped a black picture:
 *
 *   1. THE SEGMENTS ARE CONTIGUOUS - six ticks apart, never more. The recipe
 *      forgets a held contact after 25 Timer calls of silence (250 ms, its
 *      `s.q>25` idle reset) and re-registers the next sample as a NEW contact
 *      with a fresh four-call hold-off, which swallows the next three moves.
 *      A path that paused 48 ticks between runs therefore had its short runs
 *      swallowed whole: the trace showed the first, third and fourth runs
 *      lighting and the second and fifth not. That is the recipe's behaviour
 *      on hardware too - a finger that rests a quarter of a second and moves
 *      again loses its first three samples - and it is not this file's to
 *      change.
 *   2. ONE WHOLE CELL PER SAMPLE. `drag` rounds to integer cells, so a
 *      half-cell step lands on the same cell twice and the host's change gate
 *      drops the repeat; a run with three distinct moves sent nothing under
 *      the hold-off. A whole cell is 114 units on the ten-bit axes, inside the
 *      pointer's +-63 clamp only after clamping, and far above the entry's
 *      dead band of one unit.
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

/**
 * Every authored path, keyed by catalog id.
 *
 * THREE since plan 12-10: TRACKPAD joined GHOST and MORPH when the
 * hand-authored card replaced the tpad preset. It was two from plan 11-01,
 * which removed ETCH, until then.
 */
export const DEMO_PATHS: Readonly<Record<string, DemoPath>> = {
  ghost: GHOST_PATH,
  morph: MORPH_PATH,
  trackpad: TRACKPAD_PATH,
};

/**
 * The dark entries a finger cannot help, with the reason each one is here.
 *
 * EMPTY SINCE PLAN 12-10, AND STILL DECLARED. 10-UI-SPEC 9.3 groups the dark
 * entries as configurations "that paint nothing UNTIL THEY ARE TOUCHED". That
 * was true of three of them and false of the Trackpad preset, and the
 * difference was not a matter of authoring a better gesture:
 *
 *   MEASURED on 2026-09-08 against the shipped engine, over a one-finger drag,
 *   a two-finger scroll, a single tap, a two-finger tap and 2,000 idle ticks:
 *   tpad lit ZERO of 81 cells at every tick of every one of them.
 *
 * The reason was in the preset itself: src/vendor/botor/_pad.ts's tpad draft
 * sets look.kind = "none", touch.kind = "none" and enabled = { look: false,
 * touch: false, sends: true } - a pointer that sends and has no LED layer to
 * light. The only way to put a picture on THAT card was to give the
 * configuration a look it did not have, which is 10-UI-SPEC 9.3's option (a),
 * which that table REJECTS by name because it changes what the pad does on
 * somebody's hardware; so the card stayed dark and said so in its own words.
 *
 * Plan 12-10 did not take option (a). Under the user's answer at 12-06 the
 * preset LEFT THE CATALOG (it stays on the shelf, unlisted, as the compiler's
 * over-budget fixture) and the hand-authored TRACKPAD replaced it, carrying
 * the recipe's every gesture plus an edge flash that is a real Lua look and a
 * tune option. That card lights under a finger, so it has TRACKPAD_PATH above
 * and no row here. Removing the ENTRY is the one way a row may leave this list
 * without turning scripts/gen-og.mjs's non-dark gate red - the same way plan
 * 11-01's ETCH left DEMO_PATHS - and it is the way this row left.
 *
 * This list is not a convenience. It is what gates read: scripts/gen-og.mjs
 * exempts an entry from its non-dark gate ONLY if it is named here, so removing
 * a demo path from ghost, morph or trackpad turns that gate red instead of
 * quietly re-exempting the entry. The next entry that genuinely cannot be lit
 * goes here with its measurement, as tpad's row carried "0 of 81".
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
