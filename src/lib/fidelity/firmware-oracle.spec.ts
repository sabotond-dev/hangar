import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  glcStops,
  hwToScreen,
  PadSim,
  screenToHw,
  shapeIntensity,
  SINE_LOOKUP,
  weightsOf,
} from "../../vendor/botor/pad-sim";
import { CELLS, defaultState, GRID } from "../../vendor/botor/_pad";
import * as ORACLE from "./firmware-oracle";

// ROADMAP criterion 4, PREV-06, D-05.
//
// The expectation side of every assertion below comes from
// ./firmware-oracle.ts, which was written by a separate agent that read only
// the grid-fw clone at dc7d301e and was structurally forbidden from opening
// pad-sim.ts, _pad.ts, the ported BOTOR tests, 03-RESEARCH.md, 03-CONTEXT.md
// or any prior transcription. BOTOR's own tests already carry grid-fw
// citations, but they were written by the author of the simulator, so a
// misreading of the C would have been transcribed identically into both and
// the suite would be green and wrong. Two independent readings of the same
// firmware cannot agree by accident.
//
// D-08, and it is absolute. On a mismatch here:
//   - firmware-oracle.ts is NOT edited, not one digit;
//   - nothing under src/vendor/ is patched;
//   - the assertion is not weakened, skipped or narrowed.
// The test stays red and named, and the report carries the firmware
// file:line citation, the oracle value and the simulator value side by side.
// A fidelity bug is a BOTOR bug: fixed upstream, pushed, re-synced (D-03).
//
// Every comparison is exhaustive over its domain. A sampled comparison would
// let a single wrong cell through, and a single wrong cell is the whole
// reason this file exists.
//
// The simulator needs no Lua formatter - PadSim takes a PadState, never Lua -
// so this spec deliberately has no beforeAll gate.

/**
 * The oracle declares which way its 81-entry table maps. Honour the
 * declaration; do NOT try both directions until one passes. Fitting the
 * oracle to the simulator is precisely the failure mode this plan exists to
 * prevent.
 *
 * The ZONA table happens to be self-inverse (LED_LOOKUP[LED_LOOKUP[i]] === i
 * for all 81 entries, because odd rows are ascending runs and even rows
 * descending), which the oracle author flagged in the file: the two readings
 * produce identical numbers here, so agreement on the data is not by itself
 * confirmation of the direction. The direction is taken from the oracle's
 * declaration, which it derived from grid_led.c:171-183 plus
 * grid_lua_api.c:1301-1336, not from the data.
 */
const logicalToHw: number[] = (() => {
  const table = ORACLE.LED_LOOKUP;
  if (ORACLE.LED_LOOKUP_DIRECTION === "logical index -> hardware index") {
    return [...table];
  }
  const inverse = new Array<number>(table.length).fill(-1);
  table.forEach((logical, hardware) => {
    inverse[logical] = hardware;
  });
  return inverse;
})();

const frameHash = (bytes: Uint8Array): string =>
  createHash("sha256").update(Buffer.from(bytes)).digest("hex");

describe("vendored simulator against the independently derived firmware oracle (PREV-06)", () => {
  it("agrees on all 81 LED lookup cells in the direction the oracle declares", () => {
    expect(ORACLE.LED_LOOKUP, "oracle LED table size").toHaveLength(81);
    expect(CELLS, "vendored cell count").toBe(81);
    expect(
      logicalToHw.filter((hw) => hw < 0),
      `LED_LOOKUP is not a permutation under ${ORACLE.LED_LOOKUP_DIRECTION}`,
    ).toHaveLength(0);

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const logical = y * GRID + x;
        const hw = logicalToHw[logical];
        expect(
          screenToHw(x, y),
          `LED cell (x=${x}, y=${y}), logical index ${logical}: ` +
            `oracle grid_module.c:445-458 says hardware ${hw}`,
        ).toBe(hw);
        expect(
          hwToScreen(hw),
          `LED cell hardware ${hw} maps back to logical index ${logical}`,
        ).toEqual({ x, y });
      }
    }

    for (let hw = 0; hw < 81; hw++) {
      const screen = hwToScreen(hw);
      expect(
        screenToHw(screen.x, screen.y),
        `LED round trip through hardware index ${hw}`,
      ).toBe(hw);
    }
  });

  it("agrees on all 256 sine lookup entries", () => {
    expect(ORACLE.SINE_LOOKUP, "oracle sine table size").toHaveLength(256);
    expect(SINE_LOOKUP).toHaveLength(ORACLE.SINE_LOOKUP.length);
    expect([...SINE_LOOKUP]).toEqual([...ORACLE.SINE_LOOKUP]);
    for (let p = 0; p < 256; p++) {
      expect(
        SINE_LOOKUP[p],
        `sine entry ${p}: oracle grid_led.c:86-94 says ${ORACLE.SINE_LOOKUP[p]}`,
      ).toBe(ORACLE.SINE_LOOKUP[p]);
    }
  });

  it("agrees on the weight triple for all 256 phases", () => {
    expect(ORACLE.MIN_WEIGHT, "oracle min_lookup size").toHaveLength(256);
    expect(ORACLE.MID_WEIGHT, "oracle mid_lookup size").toHaveLength(256);
    expect(ORACLE.MAX_WEIGHT, "oracle max_lookup size").toHaveLength(256);

    for (let p = 0; p < 256; p++) {
      const expected = [
        ORACLE.MIN_WEIGHT[p],
        ORACLE.MID_WEIGHT[p],
        ORACLE.MAX_WEIGHT[p],
      ];
      expect(
        weightsOf(p),
        `weight triple at phase ${p}: oracle grid_led.c:46-84 says ` +
          `[${expected.join(", ")}]`,
      ).toEqual(expected);
    }
  });

  it("agrees that the weight triple sums to one constant across every phase", () => {
    // The constant comes from the ORACLE's own tables at phase 0. A literal
    // here would be a third transcription and the weakest link in the chain.
    const constant =
      ORACLE.MIN_WEIGHT[0] + ORACLE.MID_WEIGHT[0] + ORACLE.MAX_WEIGHT[0];

    for (let p = 0; p < 256; p++) {
      expect(
        ORACLE.MIN_WEIGHT[p] + ORACLE.MID_WEIGHT[p] + ORACLE.MAX_WEIGHT[p],
        `oracle weights at phase ${p} do not sum to the phase-0 constant ` +
          `${constant}`,
      ).toBe(constant);
      const [min, mid, max] = weightsOf(p);
      expect(
        min + mid + max,
        `simulator weights at phase ${p} do not sum to ${constant}`,
      ).toBe(constant);
    }
  });

  it("agrees on the colour stop derivation, including the forced-black branch", () => {
    // Every value 0..255 on each channel independently plus the greyscale
    // diagonal, each with forceMinBlack false and true: 4 * 256 * 2 = 2048
    // comparisons.
    const channels: [string, (v: number) => [number, number, number]][] = [
      ["red only", (v) => [v, 0, 0]],
      ["green only", (v) => [0, v, 0]],
      ["blue only", (v) => [0, 0, v]],
      ["greyscale", (v) => [v, v, v]],
    ];

    for (const [label, make] of channels) {
      for (let v = 0; v < 256; v++) {
        const [r, g, b] = make(v);
        for (const forceMinBlack of [false, true]) {
          const expected = ORACLE.layerStops(r, g, b, forceMinBlack);
          expect(
            glcStops(r, g, b, forceMinBlack),
            `colour stops for ${label} v=${v} ` +
              `(r=${r}, g=${g}, b=${b}, forceMinBlack=${forceMinBlack}): ` +
              `oracle grid_led.c:298-303 and grid_lua_api.c:1062-1102 say ` +
              `min=[${expected.min.join(",")}] mid=[${expected.mid.join(",")}] ` +
              `max=[${expected.max.join(",")}]`,
          ).toEqual(expected);
        }
      }
    }
  });

  it("agrees on shape-to-intensity for every shape and phase, including an unknown shape", () => {
    // Shapes 0..3 are the four cases of the C switch. Shape 4 is outside it:
    // grid_led.c has no default label and pre-seeds intensity with phase, so
    // an unknown shape must behave as the identity ramp rather than throw.
    for (let sha = 0; sha <= 4; sha++) {
      for (let pha = 0; pha < 256; pha++) {
        const expected = ORACLE.shapeIntensity(sha, pha);
        expect(
          shapeIntensity(sha, pha),
          `shape ${sha} at phase ${pha}: oracle grid_led.c:408-463 says ` +
            `${expected}`,
        ).toBe(expected);
      }
    }
  });

  // D-06(c) has two halves. The weight tables are pinned above; the scaling
  // constant is NOT, and neither is the layer count. Checked against the
  // vendored export list before writing this: pad-sim.ts exports screenToHw,
  // hwToScreen, SINE_LOOKUP, weightsOf, shapeIntensity, glcStops and the
  // PadSim class - and nothing else. The layer count is a module-private
  // const, the divisor is inline in a private render method, and layerAt/glc
  // are private. There is no way to compare either against the oracle without
  // reaching into private state, and the rule is: do not reach.
  it.todo(
    "agrees on the layer scaling divisor and the layer count - unobservable through pad-sim.ts's public surface; see 03-VALIDATION.md, Manual-Only",
  );

  it("agrees on the tick order at layer expiry", () => {
    // A decaying touch trail, driven entirely through the vendored public
    // API. The look keeper re-arms its layers with timeout 65535 on every
    // Timer fire, so a card with Look enabled never settles; disabling Look
    // and Sends leaves the comet's one-shot layer as the only thing ticking,
    // and it expires on its own.
    const state = defaultState();
    state.enabled.look = false;
    state.enabled.sends = false;
    state.enabled.touch = true;

    const sim = new PadSim(state);
    sim.touchDown(0, 64, 64);

    const MAX_TICKS = 2000;
    const TAIL = 100;
    // hashes[k] and animating[k] describe the frame after exactly k ticks.
    const hashes: string[] = [frameHash(sim.frame)];
    const animating: boolean[] = [sim.animating];
    let expiry = -1;

    for (let k = 1; k <= MAX_TICKS; k++) {
      sim.tick();
      hashes.push(frameHash(sim.frame));
      animating.push(sim.animating);
      if (expiry === -1 && animating[k - 1] && !animating[k]) expiry = k;
      if (expiry !== -1 && k >= expiry + TAIL) break;
    }

    // If this ever fails, the fallback is the weaker observable form named in
    // 03-VALIDATION.md's Manual-Only table - never a reach into private state
    // and never a dropped test.
    expect(
      expiry,
      "no animating true-to-false transition within 2000 ticks; " +
        "see 03-VALIDATION.md, Manual-Only, freeze-on-expiry",
    ).toBeGreaterThan(0);
    expect(sim.tickCount, "ticks driven").toBeGreaterThanOrEqual(expiry + TAIL);

    // The offset is load-bearing only if the two candidate frames differ.
    expect(
      hashes[expiry],
      `the expiry tick ${expiry} did not change the picture, so the tick ` +
        "order would be unobservable here",
    ).not.toBe(hashes[expiry - 1]);

    // ORACLE.TICK_ORDER.phaseAdvanceOffsetAtExpiry selects WHICH captured
    // frame is the expected frozen one: 1 means pha += fre ran before the
    // timeout == 1 test, so the expiry tick itself produced the frozen
    // picture; 0 means the timeout was checked first and the frozen picture
    // is the previous tick's. Flipping the constant flips the expectation.
    const offset = ORACLE.TICK_ORDER.phaseAdvanceOffsetAtExpiry;
    const frozen = hashes[expiry + 1];
    expect(
      frozen,
      `frozen picture after expiry at tick ${expiry}: oracle ` +
        `grid_led.c:191-211 gives phaseAdvanceOffsetAtExpiry=${offset}, ` +
        `so the expected frozen frame is the one at tick ${expiry - 1 + offset}`,
    ).toBe(hashes[expiry - 1 + offset]);

    for (const ahead of [1, 10, TAIL]) {
      expect(
        hashes[expiry + ahead],
        `the frame moved again ${ahead} ticks after expiry at ${expiry}`,
      ).toBe(frozen);
      expect(
        animating[expiry + ahead],
        `animating went true again ${ahead} ticks after expiry at ${expiry}`,
      ).toBe(false);
    }

    // rateZeroedOnExpiry is observable exactly as "the picture never moves
    // again on its own": if fre were left intact the phase would keep
    // advancing while any timeout remained.
    const movedAfterExpiry = hashes
      .slice(expiry + 1)
      .some((hash) => hash !== frozen);
    expect(
      movedAfterExpiry,
      `oracle grid_led.c:191-211 says rateZeroedOnExpiry=` +
        `${ORACLE.TICK_ORDER.rateZeroedOnExpiry}, so the picture ` +
        `${ORACLE.TICK_ORDER.rateZeroedOnExpiry ? "must not" : "must"} ` +
        "keep moving after expiry",
    ).toBe(!ORACLE.TICK_ORDER.rateZeroedOnExpiry);
  });
});
