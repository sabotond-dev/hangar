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
  it("scales an offset by max + 1, so every ninth of the pad lands on one column", () => {
    // The emitted cell expression is x*9//128, so a 128-wide domain puts each
    // ninth of the canvas on exactly one LED column, edges included.
    expect(mapAxis(0, 90, 127), "the left edge").toBe(0);
    expect(mapAxis(89.9, 90, 127), "just short of the right edge").toBe(127);
    expect(mapAxis(45, 90, 127), "the middle").toBe(64);
    expect(mapAxis(90, 90, 127), "exactly the far edge is clamped in").toBe(
      127,
    );
    expect(mapAxis(-5, 90, 127), "a pointer dragged off the left").toBe(0);
    expect(mapAxis(45, 90, 1023), "hiRes states scale the same way").toBe(512);
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
