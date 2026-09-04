// The clock, pinned - including to the file it was taken from.
//
// Six of the seven tests below are ordinary arithmetic. The seventh is the one
// that matters over time: it reads the vendored host's source and asserts that
// HANGAR's constants still equal the ones it re-implements. This is the same
// idea as src/lib/protocol-pin.spec.ts - a re-implementation that quietly
// diverges from the thing it re-implements is the failure mode, and a test that
// reads the origin is the only thing that catches it. A comment saying "keep
// these in sync" catches nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  HERO_INTERVAL_MS,
  LOW_POWER_HERO_MS,
  LOW_POWER_SIDE_MS,
  MAX_CATCHUP_MS,
  REDUCED_MOTION_TICKS,
  SIDE_INTERVAL_MS,
  TICK_MS,
  intervalFor,
  isLowPower,
  shouldPaint,
  ticksFor,
} from "./schedule";

/** The file HANGAR's clock was taken from. Never imported, only read. */
const VENDORED_HOST = "../../vendor/botor/pad-sim-host.ts";

describe("the simulation clock (src/lib/sim/schedule.ts)", () => {
  it("turns a frame gap into whole ticks and carries the remainder", () => {
    const { ticks, carryMs } = ticksFor(0, 25);
    expect(ticks, "25 ms is two whole 10 ms ticks").toBe(2);
    expect(carryMs, "the odd 5 ms is carried, not spent").toBe(5);
  });

  it("spends a carried remainder on the next frame", () => {
    const { ticks, carryMs } = ticksFor(5, 25);
    expect(ticks, "5 carried plus 25 is three whole ticks").toBe(3);
    expect(carryMs, "and nothing is left over").toBe(0);
  });

  it("clamps the gap before dividing, so a restored tab cannot fast-forward", () => {
    const { ticks } = ticksFor(0, 5000);
    // Five seconds in a backgrounded tab is 500 ticks of animation the
    // visitor did not watch. The clamp is the anti-fast-forward rule:
    // pad-sim-host.ts:21-27.
    expect(ticks, "a five second gap is clamped to 100 ms of ticks").toBe(10);
    expect(ticksFor(0, 5000).carryMs, "and nothing accumulates").toBe(0);
  });

  it("paints at exactly the interval and not one millisecond before it", () => {
    expect(shouldPaint(133, 100, HERO_INTERVAL_MS), "exactly 33 ms on").toBe(
      true,
    );
    expect(shouldPaint(132, 100, HERO_INTERVAL_MS), "32 ms is short").toBe(
      false,
    );
    expect(shouldPaint(150, 100, SIDE_INTERVAL_MS), "50 ms on for a side").toBe(
      true,
    );
  });

  it("gives the hero the faster paint cadence, and halves both on a low-power machine", () => {
    expect(intervalFor(true, false), "hero").toBe(33);
    expect(intervalFor(false, false), "side").toBe(50);
    expect(intervalFor(true, true), "hero, low power").toBe(LOW_POWER_HERO_MS);
    expect(intervalFor(false, true), "side, low power").toBe(LOW_POWER_SIDE_MS);
  });

  it("defaults an absent core count to eight rather than to zero", () => {
    // A wrong `true` halves the frame rate on a capable machine for nothing,
    // so the default is generous rather than pessimistic.
    expect(isLowPower(undefined), "absent is not low power").toBe(false);
    expect(isLowPower(8), "eight cores").toBe(false);
    expect(isLowPower(5), "five cores").toBe(false);
    expect(isLowPower(4), "four cores").toBe(true);
    expect(isLowPower(2), "two cores").toBe(true);
  });

  it("carries exactly the vendored host's constants", () => {
    const source = readFileSync(
      new URL(VENDORED_HOST, import.meta.url),
      "utf8",
    );
    const vendored = (name: string): number => {
      const found = new RegExp("const " + name + " = ([0-9]+);").exec(source);
      // Assert the match, so a renamed or reshaped constant upstream fails
      // loudly here instead of silently matching nothing and passing.
      expect(
        found,
        name + " is no longer declared in " + VENDORED_HOST,
      ).not.toBe(null);
      return Number((found as RegExpExecArray)[1]);
    };
    expect(TICK_MS, "the firmware runs at 100 Hz").toBe(vendored("TICK_MS"));
    expect(MAX_CATCHUP_MS, "the anti-fast-forward clamp").toBe(
      vendored("MAX_CATCHUP_MS"),
    );
    expect(REDUCED_MOTION_TICKS, "the representative still frame").toBe(
      vendored("REDUCED_MOTION_TICKS"),
    );
  });
});
