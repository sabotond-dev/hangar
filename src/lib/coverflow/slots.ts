// The coverflow's geometry: one pure function of the signed ring distance.
//
// Nothing here touches the DOM, reads a viewport or imports anything. That is
// deliberate and it is asserted: this repository collects no .svelte.spec.ts in
// any Vitest project, so geometry written inside a component would be untested
// and would look tested. Keeping the arithmetic here means the wrap, the mirror
// symmetry and the breakpoint ladder are pinned by tests that run in node, and
// the component is left with nothing but the job of applying the numbers.
//
// The ladder below is 04-UI-SPEC "Coverflow geometry", approved. It is not
// re-derived here and it is not tuned here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The last mounted slot on each side. Beyond it there is no DOM at all. */
export const MAX_SLOT = 3;

/** X in multiples of the hero pad's CSS side length; index is |offset|. */
export const SLOT_X = [0, 0.78, 1.28, 1.66] as const;
/** Depth in px. Negative recedes from the viewer. */
export const SLOT_Z = [0, -160, -320, -480] as const;
/** The turn magnitude in degrees; slotFor applies the sign. */
export const SLOT_ROTATE = [0, 20, 26, 30] as const;
export const SLOT_SCALE = [1, 0.8, 0.62, 0.48] as const;
export const SLOT_OPACITY = [1, 0.8, 0.5, 0.24] as const;
export const SLOT_BRIGHTNESS = [1, 0.85, 0.7, 0.55] as const;

/** Everything the CSS needs for one slot, and nothing it does not. */
export type Slot = {
  offset: number;
  translateX: number;
  translateZ: number;
  rotateY: number;
  scale: number;
  opacity: number;
  brightness: number;
  zIndex: number;
  hero: boolean;
  mounted: boolean;
};

/**
 * Move `delta` places around a ring of `count`, wrapping both ways.
 *
 * The double-modulo idiom is what makes a negative delta wrap instead of
 * returning a negative index: a wheel gesture or a held arrow key delivers
 * deltas far outside the ring, and every one of them has to land in range.
 */
export function step(centre: number, delta: number, count: number): number {
  return (((centre + delta) % count) + count) % count;
}

/**
 * The signed shortest distance from `centre` to `index` on the ring: 0 at the
 * centre, +1 one step right, -1 one step left.
 *
 * On an EVEN ring the entry directly opposite the centre is equidistant either
 * way. It resolves to the POSITIVE value, deliberately and always, so a row of
 * eight never flickers between two equally correct answers as the centre moves.
 */
export function slotOffset(
  index: number,
  centre: number,
  count: number,
): number {
  const raw = (((index - centre) % count) + count) % count;
  return raw > count / 2 ? raw - count : raw;
}

/**
 * Slots per side by viewport width, from 04-UI-SPEC. This is the thing that
 * keeps the mounted canvas count bounded no matter how large the catalog grows:
 * 7 pads on a desktop, 5 on a tablet, 3 on a phone.
 */
export function radiusForWidth(px: number): 1 | 2 | 3 {
  if (px >= 1024) return 3;
  if (px >= 640) return 2;
  return 1;
}

/**
 * The indices to mount, in visual order from left to right.
 *
 * When the catalog is shorter than the window the span is capped at `count`, so
 * a four-entry catalog on a wide screen mounts four distinct pads rather than
 * the same pad twice with two different engines running against it.
 */
export function visibleWindow(
  centre: number,
  radius: number,
  count: number,
): number[] {
  if (count <= 0) return [];
  const span = Math.min(2 * radius + 1, count);
  const first = -Math.floor((span - 1) / 2);
  const out: number[] = [];
  for (let i = 0; i < span; i += 1) {
    out.push(step(centre, first + i, count));
  }
  return out;
}

/**
 * Every number the slot's CSS applies, from the signed ring distance and the
 * hero pad's side length in px.
 *
 * `rotateY` is signed AGAINST the offset: left slots rotate POSITIVE on Y and
 * right slots NEGATIVE, so both turn their inner edge toward the viewer. That
 * inversion is the whole reason the row reads as one receding row rather than
 * as two fans, and it is the first thing to check if the built page looks wrong.
 *
 * `zIndex` is `100 - |offset|` per the UI spec. Inside a `preserve-3d` context
 * the browser also sorts by 3D depth, so this is belt-and-braces; because it
 * agrees with the depth order it cannot fight it. If the built page ever shows a
 * side pad in front of the hero, the fix is to drop `zIndex` and let
 * `translateZ` sort - never to invent a new ladder.
 *
 * An out-of-range offset still returns a well-formed object, clamped to the last
 * rung, with `mounted: false`. A caller that asks for slot 9 gets an answer it
 * can render nothing from, not a crash on a property of undefined.
 */
export function slotFor(offset: number, heroPx: number): Slot {
  const distance = Math.abs(offset);
  const k = Math.min(distance, MAX_SLOT);
  const sign = Math.sign(offset);
  return {
    offset,
    // The explicit zero branch avoids negative zero on the hero, which is a
    // different value from 0 to Object.is and therefore to a strict assertion.
    translateX: sign === 0 ? 0 : sign * heroPx * SLOT_X[k],
    translateZ: SLOT_Z[k],
    rotateY: sign === 0 ? 0 : -sign * SLOT_ROTATE[k],
    scale: SLOT_SCALE[k],
    opacity: SLOT_OPACITY[k],
    brightness: SLOT_BRIGHTNESS[k],
    zIndex: 100 - distance,
    hero: offset === 0,
    mounted: distance <= MAX_SLOT,
  };
}
