// The gate on src/lib/catalog/calibration.ts: the measured map, its
// provenance, the literal that goes on the wire, the forward map the preview
// reads, and the TS twin of the Lua `U`.
//
// EVERY EXPECTATION IS COMPUTED FROM KX AND KY. The one literal a test may
// hold is the rendered Lua string, because that is what library.ts puts on
// the wire and a test that derived it from the same function it checks would
// check nothing. Everything else - the midpoints, the corners, the hi-res
// scale, the half-pitch at a knot midpoint - is arithmetic on the tables, so
// a second probe pass that moves a knot moves the expectations with it and
// reddens only what the plan says a re-run may not change: the count of knots,
// their order, their range, and the literal (which a moved knot MUST change).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  AXIS_SPAN,
  CALIBRATION_PROVENANCE,
  KX,
  KY,
  LED_STEP,
  MEASURED,
  calibratedAxis,
  renderKnots,
  sensorAt,
} from "./calibration";

const AXES = ["x", "y"] as const;
const TABLES = { x: KX, y: KY } as const;
const SENSOR_MAX = 127;
const HI_RES_MAX = 1023;

/** The corner a corner reading is checked against, in target order 18..21. */
const CORNER_KNOTS: readonly (readonly [number, number])[] = [
  [KX[0], KY[0]],
  [KX[8], KY[0]],
  [KX[0], KY[8]],
  [KX[8], KY[8]],
];

/** The research's separability rule is 3; the planner read the corners within 1; the gate holds 2. */
const CORNER_TOLERANCE = 2;

describe("src/lib/catalog/calibration.ts (12.1-01, the measured map)", () => {
  it("holds nine strictly increasing knots per axis inside 0..127, measured once, with the discarded target and the corner source of KY[0] named", () => {
    for (const axis of AXES) {
      const k = TABLES[axis];
      expect(k.length, `${axis}: nine knots`).toBe(9);
      for (const v of k) {
        expect(Number.isInteger(v), `${axis}: ${v} is an integer`).toBe(true);
        expect(v, `${axis}: ${v} in 0..127`).toBeGreaterThanOrEqual(0);
        expect(v, `${axis}: ${v} in 0..127`).toBeLessThanOrEqual(SENSOR_MAX);
      }
      for (let n = 0; n < k.length - 1; n++) {
        expect(
          k[n + 1] - k[n],
          `${axis}: knots must be strictly increasing (K[${n}] = ${k[n]}, K[${n + 1}] = ${k[n + 1]}); U divides by the difference`,
        ).toBeGreaterThan(0);
      }
    }

    expect(MEASURED, "the tables are a measurement, not a hypothesis").toBe(
      true,
    );
    expect(CALIBRATION_PROVENANCE.runs, "one run of Probe C").toBe(1);
    expect(CALIBRATION_PROVENANCE.date).toBe("2026-09-11");
    expect(CALIBRATION_PROVENANCE.source).toContain("Probe C run 1");
    expect(
      CALIBRATION_PROVENANCE.discarded,
      "the discarded target is named",
    ).toMatch(/^target 10 \(cell 4\)/);
    expect(
      CALIBRATION_PROVENANCE.ky0,
      "KY[0]'s source is the two top corners",
    ).toMatch(/corners 18 .* and 19/);

    // The separability check as data: every corner reading against the
    // product of the two axis tables. A corner further off than the tolerance
    // means the map is not a product of two one-dimensional maps and nine
    // knots per axis would not be the whole map.
    expect(CALIBRATION_PROVENANCE.corners.length, "four corners").toBe(4);
    CALIBRATION_PROVENANCE.corners.forEach(([x, y], i) => {
      const [kx, ky] = CORNER_KNOTS[i];
      expect(
        Math.abs(x - kx),
        `corner ${18 + i}: x ${x} against KX ${kx}`,
      ).toBeLessThanOrEqual(CORNER_TOLERANCE);
      expect(
        Math.abs(y - ky),
        `corner ${18 + i}: y ${y} against KY ${ky}`,
      ).toBeLessThanOrEqual(CORNER_TOLERANCE);
    });
    expect(CALIBRATION_PROVENANCE.corners[0][1], "corner 18 reads y = 0").toBe(
      0,
    );
    expect(CALIBRATION_PROVENANCE.corners[1][1], "corner 19 reads y = 0").toBe(
      0,
    );
  });

  it("renders the one literal library.ts puts on the wire, with no space in it", () => {
    const literal = renderKnots();
    expect(literal).toBe(
      "KX={1,13,29,46,64,85,100,120,126}KY={0,12,26,48,68,83,97,115,126}",
    );
    expect(literal).not.toContain(" ");
    // And the literal is the tables and nothing else: parse it back.
    const parsed = /^KX=\{([0-9,]+)\}KY=\{([0-9,]+)\}$/.exec(literal);
    expect(parsed, "the literal parses as two brace lists").not.toBeNull();
    expect(parsed![1].split(",").map(Number)).toEqual([...KX]);
    expect(parsed![2].split(",").map(Number)).toEqual([...KY]);
  });

  it("maps LED coordinates forward to the sensor: knots at the LEDs, floored midpoints between, saturation outside, x8 at hi-res, monotone throughout", () => {
    for (const axis of AXES) {
      const k = TABLES[axis];
      for (let n = 0; n < k.length; n++) {
        expect(sensorAt(n, axis), `${axis}: LED ${n} reads K[${n}]`).toBe(k[n]);
      }
      for (let n = 0; n < k.length - 1; n++) {
        expect(
          sensorAt(n + 0.5, axis),
          `${axis}: between LED ${n} and ${n + 1}`,
        ).toBe(Math.floor((k[n] + k[n + 1]) / 2));
      }
      expect(sensorAt(-1, axis), `${axis}: below LED 0 saturates`).toBe(k[0]);
      expect(sensorAt(9, axis), `${axis}: above LED 8 saturates`).toBe(k[8]);
      expect(sensorAt(-0.25, axis)).toBe(k[0]);
      expect(sensorAt(8.25, axis)).toBe(k[8]);

      let previous = -1;
      for (let i = -100; i <= 1000; i++) {
        const u = i / 100;
        const v = sensorAt(u, axis);
        expect(
          Number.isInteger(v),
          `${axis}: sensorAt(${u}) is an integer`,
        ).toBe(true);
        expect(
          v,
          `${axis}: sensorAt(${u}) inside 0..127`,
        ).toBeGreaterThanOrEqual(0);
        expect(v, `${axis}: sensorAt(${u}) inside 0..127`).toBeLessThanOrEqual(
          SENSOR_MAX,
        );
        expect(v, `${axis}: monotone at u = ${u}`).toBeGreaterThanOrEqual(
          previous,
        );
        previous = v;
      }
    }

    // Hi-res is the firmware's own txma(1023) identity: the raw value times 8.
    expect(sensorAt(4, "x", HI_RES_MAX)).toBe(KX[4] * 8);
    expect(sensorAt(4, "x", HI_RES_MAX)).toBe(64 * 8);
    for (const axis of AXES) {
      for (let n = 0; n < 9; n++) {
        expect(sensorAt(n, axis, HI_RES_MAX)).toBe(TABLES[axis][n] * 8);
      }
    }
  });

  it("is the Lua U in TypeScript: knots to n*64, 0 to 0, 127 to 512, integer and monotone over 0..127, the half-pitch at a knot midpoint", () => {
    for (const axis of AXES) {
      const k = TABLES[axis];
      for (let n = 0; n < k.length; n++) {
        expect(
          calibratedAxis(k[n], axis),
          `${axis}: U(K[${n}]) = ${n} * 64`,
        ).toBe(n * LED_STEP);
      }
      expect(calibratedAxis(0, axis), `${axis}: U(0)`).toBe(0);
      expect(calibratedAxis(SENSOR_MAX, axis), `${axis}: U(127)`).toBe(
        AXIS_SPAN,
      );

      let previous = -1;
      for (let v = 0; v <= SENSOR_MAX; v++) {
        const u = calibratedAxis(v, axis);
        expect(Number.isInteger(u), `${axis}: U(${v}) is an integer`).toBe(
          true,
        );
        expect(u, `${axis}: U(${v}) in 0..512`).toBeGreaterThanOrEqual(0);
        expect(u, `${axis}: U(${v}) in 0..512`).toBeLessThanOrEqual(AXIS_SPAN);
        expect(u, `${axis}: monotone at v = ${v}`).toBeGreaterThanOrEqual(
          previous,
        );
        previous = u;
      }

      // The midpoint between two knots lands at the half-pitch. The sensor
      // reports integers, so the midpoint of an ODD knot difference d is a
      // half-unit that the floor drops, and the floor division then loses up
      // to 32/d of a step on top: the deviation from n*64+32 is exactly
      // 1 + floor(32/d) = ceil(32/d) for odd d and 0 for even d. Asserted as
      // that bound, computed from the table, so a moved knot moves it.
      for (let n = 0; n < k.length - 1; n++) {
        const d = k[n + 1] - k[n];
        const mid = Math.floor((k[n] + k[n + 1]) / 2);
        expect(
          Math.abs(calibratedAxis(mid, axis) - (n * LED_STEP + LED_STEP / 2)),
          `${axis}: U(${mid}) between LED ${n} and ${n + 1} (pitch ${d})`,
        ).toBeLessThanOrEqual(Math.ceil(32 / d));
      }
      // Above the last knot the clamp holds: nothing past K[8] moves U.
      expect(calibratedAxis(k[8], axis)).toBe(calibratedAxis(SENSOR_MAX, axis));
      // Below the first knot the clamp holds too.
      expect(calibratedAxis(k[0], axis)).toBe(calibratedAxis(0, axis));
    }

    // Forward and inverse are mutual inverses at every LED on both axes.
    for (const axis of AXES) {
      for (let n = 0; n < 9; n++) {
        expect(calibratedAxis(sensorAt(n, axis), axis)).toBe(n * LED_STEP);
      }
    }
  });
});
