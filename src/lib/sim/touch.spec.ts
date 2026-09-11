// The finger, pinned against an exact call sequence.
//
// Every assertion below is on the sequence of calls that reached the engine,
// not on a count, because the properties that matter here are ordering ones:
// one sample per contact per tick, MOVEs coalesced to the newest, DOWN and UP
// keeping their place, and exactly one UP per lift. A count would pass on a
// sampler that delivered the right number of the wrong things.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { KX, KY } from "../catalog/calibration";
import { MAX_CONTACTS, TouchSampler, mapAxis, type TouchTarget } from "./touch";

type Call = [string, number, number, number];

/** Stands in for PadSim: records what a finger actually delivered. */
function recorder(): { calls: Call[]; target: TouchTarget } {
  const calls: Call[] = [];
  const target: TouchTarget = {
    touchDown: (id, x, y) => {
      calls.push(["down", id, x, y]);
    },
    touchMove: (id, x, y) => {
      calls.push(["move", id, x, y]);
    },
    touchUp: (id, x, y) => {
      calls.push(["up", id, x, y]);
    },
  };
  return { calls, target };
}

describe("the tick-locked finger (src/lib/sim/touch.ts)", () => {
  it("maps the centre of the n-th ninth of the canvas to the knot the sensor reports for LED n", () => {
    // The forward map is calibration.ts's, so every expectation here is READ
    // off its tables rather than written as a literal: a re-run of the probe
    // that moves a knot moves this test with it, and nothing is hand-edited.
    // A canvas 90 px wide puts LED n's centre at (n + 0.5) / 9 * 90.
    const extent = 90;
    const centre = (n: number): number => ((n + 0.5) / 9) * extent;
    for (let n = 0; n < 9; n++) {
      expect(mapAxis(centre(n), extent, 127), `LED ${n} on x`).toBe(KX[n]);
    }
    // The sensor saturates at the outer knots: nothing the pointer does past
    // LED 0 or LED 8 reads below KX[0] or above KX[8], as on the module.
    expect(mapAxis(0, extent, 127), "the left edge").toBe(KX[0]);
    expect(mapAxis(89.9, extent, 127), "just short of the right edge").toBe(
      KX[8],
    );
    expect(mapAxis(90, extent, 127), "exactly the far edge").toBe(KX[8]);
    expect(mapAxis(-5, extent, 127), "a pointer dragged off the left").toBe(
      KX[0],
    );
    // A hiRes state (coordMax 1023) reports the raw value x8, the firmware's
    // own txma(1023) identity, so the knot scales and nothing else moves.
    for (const n of [0, 4, 8]) {
      expect(mapAxis(centre(n), extent, 1023), `LED ${n} on x, hiRes`).toBe(
        KX[n] * 8,
      );
    }
    // Between two LEDs the map is linear over the knot pair, floored, which is
    // what puts a finger between LED 3 and LED 4 at the sensor's midpoint and
    // not at the canvas's.
    expect(
      mapAxis(((3.5 + 0.5) / 9) * extent, extent, 127),
      "halfway between LED 3 and LED 4",
    ).toBe(Math.floor(KX[3] + (KX[4] - KX[3]) * 0.5));
  });

  it("reads the y table on the y axis, and the two axes differ where the tables do", () => {
    const extent = 90;
    const centre = (n: number): number => ((n + 0.5) / 9) * extent;
    for (let n = 0; n < 9; n++) {
      expect(mapAxis(centre(n), extent, 127, "y"), `LED ${n} on y`).toBe(KY[n]);
    }
    expect(mapAxis(-5, extent, 127, "y"), "off the top").toBe(KY[0]);
    expect(mapAxis(90, extent, 127, "y"), "exactly the bottom edge").toBe(
      KY[8],
    );
    expect(mapAxis(centre(4), extent, 1023, "y"), "LED 4 on y, hiRes").toBe(
      KY[4] * 8,
    );
    // The two tables are not the same table, and the default is x. Asserted at
    // an n where the knots differ, so a mapAxis that read one table for both
    // axes - or defaulted to y - is red here rather than green by coincidence.
    const differing = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
      (n) => KX[n] !== KY[n],
    );
    expect(differing, "the tables differ somewhere").not.toHaveLength(0);
    expect(differing, "including at LED 5").toContain(5);
    for (const n of differing) {
      expect(
        mapAxis(centre(n), extent, 127, "x"),
        `LED ${n}: x and y read different knots`,
      ).not.toBe(mapAxis(centre(n), extent, 127, "y"));
      expect(
        mapAxis(centre(n), extent, 127),
        `LED ${n}: the default axis is x`,
      ).toBe(mapAxis(centre(n), extent, 127, "x"));
    }
  });

  it("returns 0 rather than NaN for a zero-width element", () => {
    // A canvas measured while it is display:none reports 0, and a NaN
    // coordinate would reach the engine and poison a whole zone.
    expect(mapAxis(37, 0, 127), "zero extent").toBe(0);
    expect(mapAxis(37, -1, 127), "a negative extent is not a division").toBe(0);
  });

  it("coalesces MOVEs to the newest and keeps DOWN and UP in their place", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    expect(s.down(7, 10, 10), "a free slot").toBe(true);
    s.move(7, 20, 20);
    s.move(7, 30, 30);
    s.end(7);
    s.deliver(target);
    s.deliver(target);
    s.deliver(target);
    s.deliver(target);
    expect(calls, "two MOVEs became one, carrying the newest").toEqual([
      ["down", 0, 10, 10],
      ["move", 0, 30, 30],
      ["up", 0, 30, 30],
    ]);
  });

  it("delivers at most one sample per contact per call", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    s.down(1, 1, 1);
    s.down(2, 2, 2);
    s.move(1, 11, 11);
    s.move(2, 22, 22);
    s.deliver(target);
    expect(calls, "one sample each, DOWN first").toEqual([
      ["down", 0, 1, 1],
      ["down", 1, 2, 2],
    ]);
    s.deliver(target);
    expect(calls.slice(2), "then the MOVEs, on the next tick").toEqual([
      ["move", 0, 11, 11],
      ["move", 1, 22, 22],
    ]);
  });

  it("tracks five contacts, ignores a sixth, and frees a slot on the UP's delivery", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    for (let p = 0; p < MAX_CONTACTS; p++) {
      expect(s.down(p, p, p), "pointer " + p).toBe(true);
    }
    expect(s.down(99, 0, 0), "a sixth pointer is ignored, as on hardware").toBe(
      false,
    );
    expect(s.size, "five live contacts").toBe(MAX_CONTACTS);
    s.deliver(target);
    expect(
      calls.map((c) => c[1]),
      "the five slots are 0..4",
    ).toEqual([0, 1, 2, 3, 4]);
    s.end(2);
    expect(
      s.down(99, 0, 0),
      "the slot is still held until the UP is delivered",
    ).toBe(false);
    s.deliver(target);
    expect(s.size, "the lifted contact is gone").toBe(MAX_CONTACTS - 1);
    expect(s.down(99, 5, 5), "and its slot is free now").toBe(true);
    const fresh = calls.length;
    s.deliver(target);
    expect(calls.slice(fresh), "the new pointer reuses slot 2").toEqual([
      ["down", 2, 5, 5],
    ]);
  });

  it("produces exactly one UP however many times a lift is reported", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    s.down(3, 4, 5);
    s.deliver(target);
    // pointerup, pointercancel and lostpointercapture all funnel into end();
    // a leaked or doubled contact would stick a zone note exactly the way the
    // firmware bug does.
    s.end(3);
    s.end(3);
    s.end(3);
    s.deliver(target);
    s.deliver(target);
    expect(calls, "one down, one up, nothing else").toEqual([
      ["down", 0, 4, 5],
      ["up", 0, 4, 5],
    ]);
  });

  it("drops every contact and frees every slot on clear", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    s.down(1, 1, 1);
    s.down(2, 2, 2);
    s.clear();
    expect(s.size, "nothing is held").toBe(0);
    s.deliver(target);
    expect(calls, "and nothing undelivered leaks out afterwards").toEqual([]);
    expect(s.down(1, 3, 3), "every slot is free again").toBe(true);
  });

  it("is tick-locked: three MOVEs between ticks cost one delivery each tick", () => {
    const { calls, target } = recorder();
    const s = new TouchSampler();
    s.down(1, 0, 0);
    s.move(1, 5, 5);
    s.move(1, 6, 6);
    s.move(1, 7, 7);
    s.deliver(target);
    expect(calls, "one tick, one sample - the firmware's pop budget").toEqual([
      ["down", 0, 0, 0],
    ]);
    s.deliver(target);
    expect(calls[1], "the coalesced MOVE carries the LAST position").toEqual([
      "move",
      0,
      7,
      7,
    ]);
    expect(calls, "and there is no third sample waiting").toHaveLength(2);
  });
});
