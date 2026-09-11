// THE SENSOR-TO-LED MAP, MEASURED ON THE USER'S ZONA - the one place the
// numbers live.
//
// The touch controller is not under the LEDs. Its reported range (0..127 per
// axis after the firmware's lerp, grid_ui_touch.c:113) runs out about a third
// of an LED pitch inside the outer LED centres and is compressed at both ends,
// so the naive divisor `v*9//128` that every Phase 12 entry used put a finger
// dead on row 2 / column 8 into the top-right corner (BENCH-2026-09-11.txt).
// Nobody had measured where the LEDs actually are in sensor units. Probe C
// did, on 2026-09-11, and this file is that measurement.
//
// ---------------------------------------------------------------------------
// 1. WHERE THE NUMBERS COME FROM, TRIPLE BY TRIPLE
// ---------------------------------------------------------------------------
//
// Probe C (docs/CALIBRATION-PROBE.md) lights one white LED at a time by
// ADDRESS, the user rests a fingertip dead-centre on it and lifts, and the pad
// sends the last sample before the lift as CC20 = x, CC21 = y, CC22 = target.
// Run 1 on the user's ZONA, 11:43:50 - 11:44:31, twenty-one lifts:
//
//   targets  1..9  cells 36..44 (row 4, left to right)
//            x = 1, 13, 29, 46, 64, 85, 100, 120, 126      -> KX[0..8]
//   target  10     cell  4 (row 0, column 4)   read (127, 68)  DISCARDED
//   targets 11..17 cells 13, 22, 31, 49, 58, 67, 76 (column 4, no centre)
//            y = 12, 26, 48, 83, 97, 115, 126               -> KY[1..3], KY[5..8]
//   target   5     cell 40 (the centre)        read (64, 68)  -> KY[4] = 68
//   targets 18..21 corners 0, 8, 72, 80
//            read (1, 0), (127, 0), (0, 127), (127, 126)     -> the check
//
// TARGET 10 IS DISCARDED. Its reading (127, 68) is x pinned at the right edge
// with y on row 4: not a row-0 reading at all, but a re-tap at target 9's
// position after a dropped lift (the probe advances on the lift; a lift the
// firmware never delivered leaves the target lit, and the next tap is where
// the finger already was). KY[0] therefore comes from corners 18 (1, 0) and
// 19 (127, 0), both y = 0. What a direct reading of target 10 could still move
// is KY[0] alone, bounded at about 0..5 by the corners and by the 12-unit
// low-side step in x; that shifts only the blend between rows 0 and 1, at the
// top row only, and it is audition row 24, not a blocker.
//
// THE MAP IS SEPARABLE. Each corner agrees with the product of the two axis
// tables within 1 unit: 18 reads (1, 0) against (KX[0], KY[0]) = (1, 0);
// 19 (127, 0) against (126, 0); 20 (0, 127) against (1, 126); 21 (127, 126)
// against (126, 126). So nine knots per axis are the whole map and the
// eighty-one-target pass was not taken (12.1-CONTEXT.md D-19). The tables are
// strictly increasing on both axes - the smallest step is 6 (KX[7] -> KX[8]) -
// so the Lua's floor division by a knot difference never sees zero.
//
// What the numbers say about the sensor: the high side of both axes runs out
// of range INSIDE the outer LED (LED 7 -> LED 8 is 6 units in x, 11 in y), the
// low side compresses less (12 and 14), and the middle is about 17 per LED.
// The user's "row 2 / column 8 lights the corner" follows exactly: x = 120
// under x*9//128 is column 8.
//
// ---------------------------------------------------------------------------
// 2. ONE PROTOTYPE UNIT
// ---------------------------------------------------------------------------
//
// This is a map of ONE module - the user's - held by one hand on one desk.
// Another ZONA may differ by a few units at the edges; nothing here claims
// otherwise, and the copy that says so to a visitor is Phase 13's to write.
// Hand, finger and whether the module was flat were not reported for run 1;
// row 24 asks again.
//
// ---------------------------------------------------------------------------
// 3. A SECOND PASS
// ---------------------------------------------------------------------------
//
// If a re-run of the probe (docs/CALIBRATION-PROBE.md, "Running it again")
// moves any knot by more than 2 units, the two arrays below are edited - and
// the provenance record beside them, which describes the arrays - and nothing
// else in the tree is edited by hand: the Lua literal, the preview's forward
// map and every test expectation are derived from the arrays, so they move
// with them, and `UPDATE_FRAMES=1` regenerates frames.json for the demo
// cards. One commit; no plan re-opened.
//
// ---------------------------------------------------------------------------
// 4. THE THREE DERIVED THINGS
// ---------------------------------------------------------------------------
//
// renderKnots() is the exact literal library.ts writes into 255/0. sensorAt()
// is the FORWARD map the preview needs (LED coordinate -> sensor value);
// calibratedAxis() is the INVERSE, and it is the Lua `U(v,k)` written in
// TypeScript with Math.floor for every `//` and the same clamp, so a test can
// compute the cell and the weights `G` will produce without a VM. The two are
// the same function: lua-smoke.spec.ts (plan 12.1-02) drives the Lua `U`
// against this twin for every v in 0..127 on both axes.
//
// THIS MODULE IMPORTS NOTHING, on the same rule as src/lib/device/snapshot.ts:
// library.ts, src/lib/sim/touch.ts and src/lib/sim/demo.ts all import it, and
// touch.ts runs on the first paint, so anything this file pulled in would be
// pulled onto the first paint of every page.
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
 * Where the tables came from. Every string here is the header's, kept beside
 * the arrays so a reader of the values sees the caveats without the header.
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
