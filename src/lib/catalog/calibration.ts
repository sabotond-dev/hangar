// THE SENSOR-TO-LED MAP, MEASURED ON THE USER'S ZONA - the one place the
// numbers live. The touch controller is not under the LEDs: its 0..127 range
// runs out inside the outer LED centres and is compressed at both ends, so the
// naive `v*9//128` put a finger on row 2 / column 8 into the corner. Probe C
// (docs/CALIBRATION-PROBE.md, run 1, 2026-09-11) measured nine knots per axis;
// the map is separable (each corner agrees with the product of the two tables
// within 1 unit) and this is a map of ONE prototype unit. A re-run edits KX, KY
// and CALIBRATION_PROVENANCE only: the Lua literal (renderKnots), the forward
// map (sensorAt) and the inverse (calibratedAxis, the TS twin of the Lua `U`)
// derive from the arrays. Imports nothing - touch.ts pulls it onto the first paint.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Nine knots: the raw 0..127 x the sensor reports with a finger centred on LED n of a row. */
export const KX: readonly number[] = [1, 13, 29, 46, 64, 85, 100, 120, 126];

/** Nine knots: the raw 0..127 y the sensor reports with a finger centred on LED n of a column. */
export const KY: readonly number[] = [0, 12, 26, 48, 68, 83, 97, 115, 126];

/** The tables above are a measurement, not the research's hypothesis. */
export const MEASURED = true as const;

/** One LED pitch in the calibrated coordinate `U` returns: LED n sits at n * 64. */
export const LED_STEP = 64;

/** The full calibrated span: LED 8 at 8 * LED_STEP. */
export const AXIS_SPAN = 8 * LED_STEP;

/** The sensor's range as the Lua sees it at the default coordinate scale. */
const SENSOR_MAX = 127;

/** The number of knots per axis. */
const KNOTS = 9;

/**
 * Where the tables came from, kept beside the arrays so a reader of the values
 * sees the caveats (the discarded target, the corners, the unreported hand).
 *
 * `corners` are the four corner readings AS READ, in target order 18, 19, 20,
 * 21 (cells 0, 8, 72, 80), and they are readings rather than knots: the test
 * checks them against the product of the two tables and never the other way.
 */
export const CALIBRATION_PROVENANCE = {
  date: "2026-09-11",
  source: "BENCH-2026-09-11.txt, Probe C run 1, 11:43:50-11:44:31",
  runs: 1,
  discarded:
    "target 10 (cell 4): (127, 68) is x pinned at the right edge with y on row 4 - a re-tap after a dropped lift at target 9",
  ky0: "corners 18 (1,0) and 19 (127,0), both y = 0",
  corners: [
    [1, 0],
    [127, 0],
    [0, 127],
    [127, 126],
  ],
  handAndFlatness: "not reported",
} as const;

/** The table for an axis. */
export function knotsOf(axis: "x" | "y"): readonly number[] {
  return axis === "x" ? KX : KY;
}

/**
 * `KX={1,13,...}KY={0,12,...}` - the exact literal library.ts renders into
 * 255/0. No spaces: every one would be a character on the wire.
 */
export function renderKnots(): string {
  return `KX={${KX.join(",")}}KY={${KY.join(",")}}`;
}

/**
 * The FORWARD map: LED coordinate u (0..8, LED n at u = n, fractional between)
 * -> raw sensor value (integer, floored), piecewise-linear over the knots,
 * saturating at the outer knots below 0 and above 8 as the sensor does.
 *
 * `max` scales for hi-res: 127 -> as is; 1023 -> x8, which is the firmware's
 * own `txma(1023)` identity (grid_ui_touch.c:113 lerps the 10-bit value into
 * 0..max+1, so max 1023 reports the raw value and max 127 reports raw // 8).
 */
export function sensorAt(u: number, axis: "x" | "y", max = SENSOR_MAX): number {
  const k = knotsOf(axis);
  const last = KNOTS - 1;
  let raw: number;
  if (u <= 0) {
    raw = k[0];
  } else if (u >= last) {
    raw = k[last];
  } else {
    const n = Math.floor(u);
    const f = u - n;
    raw = Math.floor(k[n] + (k[n + 1] - k[n]) * f);
  }
  raw = Math.min(Math.max(raw, 0), SENSOR_MAX);
  return Math.floor((raw * (max + 1)) / (SENSOR_MAX + 1));
}

/**
 * The TS twin of the Lua `U(v, k)`:
 *
 *   function U(v,k)v=glim(v,k[1],k[9])for i=1,8 do if v<k[i+1]then
 *   return i*64-64+(v-k[i])*64//(k[i+1]-k[i])end end return 512 end
 *
 * raw 0..127 -> 0..512 (LED n at n * 64), the SAME integer arithmetic as the
 * Lua including the floor division and the clamp to the outer knots (`glim`),
 * so the cell and the weights `G` produces for a sample can be computed here.
 * The Lua's `i` is 1-based, so its `i*64-64` is this `n * 64`.
 */
export function calibratedAxis(v: number, axis: "x" | "y"): number {
  const k = knotsOf(axis);
  const last = KNOTS - 1;
  const c = Math.min(Math.max(Math.trunc(v), k[0]), k[last]);
  for (let n = 0; n < last; n++) {
    if (c < k[n + 1]) {
      return (
        n * LED_STEP + Math.floor(((c - k[n]) * LED_STEP) / (k[n + 1] - k[n]))
      );
    }
  }
  return AXIS_SPAN;
}
