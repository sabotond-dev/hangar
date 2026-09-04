// The firmware's clock, as pure arithmetic.
//
// HANGAR runs one requestAnimationFrame loop for the whole page and steps every
// engine from it in whole 10 ms ticks. All of the arithmetic that decides how
// many ticks a frame owes, and whether a pad repaints on this frame, lives here
// rather than inside the host, so it can be asserted in the node Vitest project
// with no browser and no canvas.
//
// The semantics are the vendored host's - src/vendor/botor/pad-sim-host.ts,
// which HANGAR reads and never imports. Each constant below carries the reason
// its origin recorded, cited by line. schedule.spec.ts reads that file and
// fails if these values ever drift from it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * One firmware tick is 10 ms - the pad runs at 100 Hz and the accumulator turns
 * wall-clock frame gaps into whole ticks of it.
 * src/vendor/botor/pad-sim-host.ts:28
 */
export const TICK_MS = 10;

/**
 * The anti-fast-forward rule. rAF stops in a backgrounded window, and on return
 * the animation must resume near where it paused instead of replaying minutes
 * of ticks in one frame. Phase continuity across a background period is not a
 * promise anyone made - the physical pad kept animating and the page did not.
 * src/vendor/botor/pad-sim-host.ts:29
 */
export const MAX_CATCHUP_MS = 100;

/**
 * Ticking is pointer arithmetic; painting is the expensive half, so the two
 * cadences are decoupled: engines step at logical 100 Hz, canvases repaint at
 * most this often. The vendored host has one global 33 ms
 * (src/vendor/botor/pad-sim-host.ts:34); HANGAR splits it per slot, because six
 * receding side layers at 20 fps halve the compositor work for motion nobody is
 * looking straight at (04-CONTEXT D-15).
 */
export const HERO_INTERVAL_MS = 33;
export const SIDE_INTERVAL_MS = 50;

/** The low-power ladder: same pads, half the paint rate. See isLowPower. */
export const LOW_POWER_HERO_MS = 50;
export const LOW_POWER_SIDE_MS = 100;

/**
 * Reduced motion shows one representative frame instead of a loop. Tick 64 puts
 * a sine look near its peak, so the still frame shows colour and pattern rather
 * than a black square.
 * src/vendor/botor/pad-sim-host.ts:39, and 04-UI-SPEC "Motion Contract".
 */
export const REDUCED_MOTION_TICKS = 64;

/**
 * Whole ticks owed for a frame gap, and the millisecond remainder to carry.
 *
 * The carry is the point: dropping it would lose up to 9 ms of animation every
 * frame, which at 60 fps is more than half of real time.
 */
export function ticksFor(
  pendingMs: number,
  dtMs: number,
): { ticks: number; carryMs: number } {
  const acc = pendingMs + Math.min(dtMs, MAX_CATCHUP_MS);
  const ticks = Math.floor(acc / TICK_MS);
  return { ticks, carryMs: acc - ticks * TICK_MS };
}

/** True when this pad is due a repaint. Paint is decoupled from tick. */
export function shouldPaint(
  now: number,
  lastPaint: number,
  intervalMs: number,
): boolean {
  return now - lastPaint >= intervalMs;
}

/** The paint interval for one slot: the hero repaints faster than the sides. */
export function intervalFor(isHero: boolean, lowPower: boolean): number {
  if (lowPower) return isHero ? LOW_POWER_HERO_MS : LOW_POWER_SIDE_MS;
  return isHero ? HERO_INTERVAL_MS : SIDE_INTERVAL_MS;
}

/**
 * Four cores or fewer is the low-power ladder.
 *
 * The core count comes from the host, which reads it from
 * `navigator.hardwareConcurrency` - Baseline since March 2022, but documented
 * as a hint that may be capped by the browser or absent entirely. So an absent
 * value defaults to eight rather than to zero: a wrong `true` would halve the
 * frame rate on a capable machine for nothing, while a wrong `false` costs a
 * weak machine only the paint cadence it would have had anyway.
 */
export function isLowPower(cores: number | undefined): boolean {
  return (cores ?? 8) <= 4;
}
