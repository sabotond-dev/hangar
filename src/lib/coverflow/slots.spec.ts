// The coverflow geometry, pinned.
//
// Every number the row's CSS applies comes out of slotFor(), so this file is
// where the approved ladder lives as data and where the wrap, the mirror
// symmetry and the breakpoint ladder are asserted. It runs in the node Vitest
// project with no DOM, which is the whole reason the arithmetic was separated
// from the component that applies it: this repository collects no
// .svelte.spec.ts in any project, so a geometry test written beside a component
// would be green and vacuous.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  MAX_SLOT,
  radiusForWidth,
  slotFor,
  slotOffset,
  step,
  visibleWindow,
} from "./slots";

/**
 * The approved ladder, from 04-UI-SPEC "Coverflow geometry", written once.
 * A ladder change is a one-line edit here and is still fully asserted below.
 */
const LADDER = [
  { x: 0, z: 0, rotate: 0, scale: 1, opacity: 1, brightness: 1 },
  { x: 0.78, z: -160, rotate: 20, scale: 0.8, opacity: 0.8, brightness: 0.85 },
  { x: 1.28, z: -320, rotate: 26, scale: 0.62, opacity: 0.5, brightness: 0.7 },
  {
    x: 1.66,
    z: -480,
    rotate: 30,
    scale: 0.48,
    opacity: 0.24,
    brightness: 0.55,
  },
] as const;

/** An arbitrary hero side length in px; X is a multiple of it. */
const HERO = 400;

describe("the coverflow slot geometry (src/lib/coverflow/slots.ts)", () => {
  it("step wraps in both directions, and a delta larger than the ring still lands in range", () => {
    expect(step(0, -1, 8), "stepping left off the start wraps to the end").toBe(
      7,
    );
    expect(step(7, 1, 8), "stepping right off the end wraps to the start").toBe(
      0,
    );
    expect(step(3, 1, 8), "an ordinary step right").toBe(4);
    expect(step(3, -1, 8), "an ordinary step left").toBe(2);
    expect(step(0, 0, 8), "no step is no movement").toBe(0);

    // A wheel gesture or a held arrow key can deliver a delta far larger than
    // the ring; the double-modulo idiom must still land in range.
    for (const delta of [8, 9, -8, -9, 25, -25, 1000, -1000]) {
      const landed = step(3, delta, 8);
      expect(landed, `delta ${delta} lands in range`).toBeGreaterThanOrEqual(0);
      expect(landed, `delta ${delta} lands in range`).toBeLessThan(8);
      expect(landed, `delta ${delta} agrees with the modulo`).toBe(
        (((3 + delta) % 8) + 8) % 8,
      );
    }
  });

  it("slotOffset is the signed shortest distance, and an even ring's antipode is positive", () => {
    expect(slotOffset(0, 0, 8), "the centre is offset 0").toBe(0);
    expect(slotOffset(1, 0, 8), "one step right is +1").toBe(1);
    expect(slotOffset(7, 0, 8), "one step left is -1").toBe(-1);
    expect(slotOffset(6, 0, 8), "two steps left is -2").toBe(-2);
    expect(slotOffset(2, 0, 8), "two steps right is +2").toBe(2);

    // Deterministic by decision, not by accident: on an even ring the entry
    // exactly opposite the centre is equidistant either way, and it resolves to
    // the POSITIVE value so the row never flickers between two equal answers.
    expect(
      slotOffset(4, 0, 8),
      "the antipode of an even ring is positive",
    ).toBe(4);

    // The centre moving does not change the arithmetic.
    expect(slotOffset(0, 7, 8), "wrapping forward from the last index").toBe(1);
    expect(slotOffset(6, 7, 8), "wrapping backward from the last index").toBe(
      -1,
    );

    // An odd ring has a true shortest distance in both directions.
    expect(slotOffset(4, 0, 7), "an odd ring resolves -3, not +4").toBe(-3);
    expect(slotOffset(3, 0, 7), "an odd ring's far right is +3").toBe(3);
  });

  it("the ladder mirrors: +k and -k agree in size and oppose in position and turn", () => {
    for (let k = 1; k <= MAX_SLOT; k += 1) {
      const right = slotFor(k, HERO);
      const left = slotFor(-k, HERO);

      expect(left.scale, `slot ${k}: scale mirrors`).toBe(right.scale);
      expect(left.opacity, `slot ${k}: opacity mirrors`).toBe(right.opacity);
      expect(left.brightness, `slot ${k}: brightness mirrors`).toBe(
        right.brightness,
      );
      expect(left.translateZ, `slot ${k}: depth mirrors`).toBe(
        right.translateZ,
      );
      expect(left.zIndex, `slot ${k}: stacking mirrors`).toBe(right.zIndex);

      expect(left.translateX, `slot ${k}: X is mirrored`).toBeCloseTo(
        -right.translateX,
        10,
      );
      expect(left.rotateY, `slot ${k}: the turn is negated`).toBe(
        -right.rotateY,
      );

      expect(left.hero, `slot ${k} is not the hero`).toBe(false);
      expect(right.hero, `slot ${k} is not the hero`).toBe(false);
    }
    expect(slotFor(0, HERO).hero, "offset 0 is the hero").toBe(true);
  });

  it("the ladder matches the approved spec and falls monotonically with the offset", () => {
    LADDER.forEach((rung, k) => {
      const slot = slotFor(k, HERO);
      expect(slot.translateX, `slot ${k}: X`).toBeCloseTo(HERO * rung.x, 10);
      expect(slot.translateZ, `slot ${k}: Z`).toBe(rung.z);
      expect(Math.abs(slot.rotateY), `slot ${k}: rotateY magnitude`).toBe(
        rung.rotate,
      );
      expect(slot.scale, `slot ${k}: scale`).toBe(rung.scale);
      expect(slot.opacity, `slot ${k}: opacity`).toBe(rung.opacity);
      expect(slot.brightness, `slot ${k}: brightness`).toBe(rung.brightness);
      expect(slot.zIndex, `slot ${k}: z-index is 100 - |offset|`).toBe(100 - k);
    });

    for (let k = 1; k <= MAX_SLOT; k += 1) {
      const near = slotFor(k - 1, HERO);
      const far = slotFor(k, HERO);
      expect(far.scale, `slot ${k}: scale falls`).toBeLessThan(near.scale);
      expect(far.opacity, `slot ${k}: opacity falls`).toBeLessThan(
        near.opacity,
      );
      expect(far.brightness, `slot ${k}: brightness falls`).toBeLessThan(
        near.brightness,
      );
      expect(far.translateZ, `slot ${k}: depth recedes`).toBeLessThan(
        near.translateZ,
      );
      expect(
        Math.abs(far.translateX),
        `slot ${k}: it moves further out`,
      ).toBeGreaterThan(Math.abs(near.translateX));
    }
  });

  it("left slots rotate positive on Y and right slots negative", () => {
    // The sign is inverted against the offset on purpose: both sides turn their
    // inner edge toward the viewer, which is what makes the row read as a row
    // rather than as two fans.
    expect(slotFor(0, HERO).rotateY, "the hero faces the viewer square").toBe(
      0,
    );
    for (let k = 1; k <= MAX_SLOT; k += 1) {
      expect(slotFor(-k, HERO).rotateY, `left slot ${k} turns positive`).toBe(
        LADDER[k].rotate,
      );
      expect(slotFor(k, HERO).rotateY, `right slot ${k} turns negative`).toBe(
        -LADDER[k].rotate,
      );
    }
  });

  it("beyond the last slot nothing is mounted", () => {
    for (let k = 0; k <= MAX_SLOT; k += 1) {
      expect(slotFor(k, HERO).mounted, `slot ${k} is mounted`).toBe(true);
      expect(slotFor(-k, HERO).mounted, `slot -${k} is mounted`).toBe(true);
    }
    for (const offset of [MAX_SLOT + 1, -(MAX_SLOT + 1), 12, -12]) {
      const slot = slotFor(offset, HERO);
      expect(slot.mounted, `offset ${offset} is not mounted`).toBe(false);
      // Still a well-formed object rather than undefined: a caller that asks
      // for an out-of-range slot gets the clamped ladder and a false flag, not
      // a crash on a property of undefined.
      expect(
        Number.isFinite(slot.scale),
        `offset ${offset} still reports a usable ladder`,
      ).toBe(true);
      expect(slot.scale, `offset ${offset} clamps to the last rung`).toBe(
        LADDER[MAX_SLOT].scale,
      );
    }
  });

  it("the visible radius follows the viewport breakpoints", () => {
    const ladder: [number, 1 | 2 | 3][] = [
      [1280, 3],
      [1024, 3],
      [1023, 2],
      [640, 2],
      [639, 1],
      [320, 1],
    ];
    for (const [px, radius] of ladder) {
      expect(radiusForWidth(px), `${px}px shows ${radius} per side`).toBe(
        radius,
      );
    }
    // 2r + 1 canvases, which is what keeps the mounted count bounded.
    for (const [px, radius] of ladder) {
      expect(
        visibleWindow(0, radiusForWidth(px), 9).length,
        `${px}px mounts ${2 * radius + 1} pads`,
      ).toBe(2 * radius + 1);
    }
  });

  it("visibleWindow returns distinct in-range indices centred on the given index", () => {
    const opening = visibleWindow(0, 3, 8);
    expect(opening, "seven slots, left to right, wrapping").toEqual([
      5, 6, 7, 0, 1, 2, 3,
    ]);
    expect(new Set(opening).size, "no index appears twice").toBe(
      opening.length,
    );

    const offCentre = visibleWindow(6, 2, 8);
    expect(offCentre, "the window follows the centre").toEqual([4, 5, 6, 7, 0]);
    expect(offCentre[2], "the centre sits in the middle").toBe(6);

    for (const centre of [0, 3, 7]) {
      for (const radius of [1, 2, 3]) {
        const w = visibleWindow(centre, radius, 8);
        expect(w.length, `centre ${centre}, radius ${radius}: 2r+1 wide`).toBe(
          2 * radius + 1,
        );
        expect(
          new Set(w).size,
          `centre ${centre}, radius ${radius}: all distinct`,
        ).toBe(w.length);
        expect(
          w.every((index) => index >= 0 && index < 8),
          `centre ${centre}, radius ${radius}: all in range`,
        ).toBe(true);
        expect(w[radius], `centre ${centre}, radius ${radius}: centred`).toBe(
          centre,
        );
      }
    }

    // A short catalog on a wide screen must not mount the same pad twice.
    const short = visibleWindow(0, 3, 4);
    expect(short.length, "the window is capped at the catalog size").toBe(4);
    expect(new Set(short).size, "and it is still four distinct pads").toBe(4);
    expect(short, "the centre is still in it").toContain(0);
  });
});
