// Vendored from sabotond-dev/botor
//   path:   src/renderer/tests/pad-sim.test.js
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: two mechanical deltas (2 import specifiers) plus the
//   deliberate divergences enumerated, with a reason and a date, in
//   src/lib/fidelity/upstream-manifest.json. That file is the authority; this
//   line is not a second copy of it.
// Original copyright and licence (GNU GPL v3 or later) retained below.

import { describe, it, expect, beforeAll } from "vitest";
import {
  PadSim,
  hwToScreen,
  screenToHw,
  SINE_LOOKUP,
  weightsOf,
  shapeIntensity,
  glcStops,
} from "../pad-sim";
import {
  padCompilerReady,
  GRID,
  CELLS,
  defaultState,
  clonePadState,
  normalisePadState,
  scaleChannel,
  BRIGHTNESS_TABLE,
  DECAY_TABLE,
  nearestDecay,
  speedRate,
  compile,
  PRESETS,
  presetById,
  ledIndexToCell,
  soloPadState,
  DIAL_SENSE_TABLE,
  DIAL_ATAN_SCALE,
  DIAL_DEADZONE_R2,
  DIAL_HALF_TURN,
  DIAL_FINE_PER_TURN,
} from "../_pad";

beforeAll(async () => {
  await padCompilerReady();
});

// A state with every sheet off, so the raw engine vectors can poke layer
// fields directly without a compiled Setup in the way.
function blankState() {
  const s = defaultState();
  s.look.kind = "none";
  s.touch.kind = "none";
  s.sends.kind = "none";
  return s;
}

function presetState(id) {
  const p = presetById(id);
  expect(p).toBeDefined();
  return clonePadState(p.state);
}

// Frame bytes of one logical cell, as [r, g, b].
function cellRgb(sim, n) {
  const f = sim.frame;
  return [f[n * 3], f[n * 3 + 1], f[n * 3 + 2]];
}

function copyFrame(sim) {
  return Uint8Array.from(sim.frame);
}

// The firmware logical-to-hardware table, grid_module.c:445-458, read as
// lookup[x + y*9]. Hard-coded on purpose: this is the ground truth the
// geometry helpers are pinned against, not derived from them.
const FIRMWARE_TABLE = [
  8, 7, 6, 5, 4, 3, 2, 1, 0,
  9, 10, 11, 12, 13, 14, 15, 16, 17,
  26, 25, 24, 23, 22, 21, 20, 19, 18,
  27, 28, 29, 30, 31, 32, 33, 34, 35,
  44, 43, 42, 41, 40, 39, 38, 37, 36,
  45, 46, 47, 48, 49, 50, 51, 52, 53,
  62, 61, 60, 59, 58, 57, 56, 55, 54,
  63, 64, 65, 66, 67, 68, 69, 70, 71,
  80, 79, 78, 77, 76, 75, 74, 73, 72,
];

describe("serpentine geometry", () => {
  it("matches the firmware lookup table verbatim in both directions", () => {
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const hw = FIRMWARE_TABLE[x + y * GRID];
        expect(screenToHw(x, y)).toBe(hw);
        expect(hwToScreen(hw)).toEqual({ x, y });
      }
    }
  });

  it("is a bijection and self-inverse over all 81 LEDs", () => {
    const seen = new Set();
    for (let h = 0; h < CELLS; h++) {
      const { x, y } = hwToScreen(h);
      expect(screenToHw(x, y)).toBe(h);
      seen.add(x + y * GRID);
    }
    expect(seen.size).toBe(CELLS);
  });

  it("agrees with the corrected ledIndexToCell for every hardware index", () => {
    // Two mappings with opposite parity in one directory was the trap the
    // contract flagged; this pins them together so they cannot drift.
    for (let h = 0; h < CELLS; h++) {
      expect(ledIndexToCell(h)).toEqual(hwToScreen(h));
    }
  });
});

describe("engine vectors from grid_led.c", () => {
  // Hardware index 0 sits at screen (8, 0), logical cell 8.
  const CELL_OF_HW0 = 8;

  it("V1: reproduces the factory ramp table exactly", () => {
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, {
      min: [0, 0, 0],
      mid: [32, 32, 32],
      max: [64, 64, 64],
      sha: 0,
    });
    const expected = [
      [0, 0],
      [64, 8],
      [127, 15],
      [128, 15],
      [192, 23],
      [255, 31],
    ];
    for (const [pha, out] of expected) {
      sim.pokeLayer(0, 1, { pha });
      expect(cellRgb(sim, CELL_OF_HW0)).toEqual([out, out, out]);
    }
  });

  it("V2: one full layer caps at 126, which is 254/512 of 255", () => {
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, { max: [255, 255, 255], pha: 255, sha: 0 });
    expect(cellRgb(sim, CELL_OF_HW0)).toEqual([126, 126, 126]);
  });

  it("V3: layers add before the divide, two give 253 and three clamp at 255", () => {
    // ZONA_RECIPES 0.3 says 252 here; the formula and fin-01 both give
    // floor(2*255*254/512) = 253, so 253 is pinned.
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, { max: [255, 255, 255], pha: 255, sha: 0 });
    sim.pokeLayer(0, 2, { max: [255, 255, 255], pha: 255, sha: 0 });
    expect(cellRgb(sim, CELL_OF_HW0)).toEqual([253, 253, 253]);
    sim.pokeLayer(0, 0, { max: [255, 255, 255], pha: 255, sha: 0 });
    expect(cellRgb(sim, CELL_OF_HW0)).toEqual([255, 255, 255]);
  });

  it("V4: the weight closed form sums to 254 and meets at 127/128", () => {
    for (let p = 0; p < 256; p++) {
      const [wn, wd, wx] = weightsOf(p);
      expect(wn + wd + wx).toBe(254);
      expect(wn).toBeGreaterThanOrEqual(0);
      expect(wd).toBeGreaterThanOrEqual(0);
      expect(wx).toBeGreaterThanOrEqual(0);
    }
    expect(weightsOf(127)).toEqual([0, 254, 0]);
    expect(weightsOf(128)).toEqual([0, 254, 0]);
  });

  it("V5: the sine table spot values and the measured glc composite", () => {
    expect(SINE_LOOKUP).toHaveLength(256);
    expect(SINE_LOOKUP[0]).toBe(128);
    expect(SINE_LOOKUP[64]).toBe(255);
    expect(SINE_LOOKUP[128]).toBe(126);
    expect(SINE_LOOKUP[192]).toBe(0);
    expect(SINE_LOOKUP[255]).toBe(128);

    // glc(0, 90, 255) with forced-black min, shape 3: the measured table
    // from ZONA_RECIPES 0.3.
    const sim = new PadSim(blankState());
    const stops = glcStops(0, 90, 255, true);
    sim.pokeLayer(0, 1, { ...stops, sha: 3 });
    const expected = [
      [0, [0, 22, 63]],
      [64, [0, 44, 126]],
      [128, [0, 22, 62]],
      [192, [0, 0, 0]],
    ];
    for (const [pha, rgb] of expected) {
      sim.pokeLayer(0, 1, { pha });
      expect(cellRgb(sim, CELL_OF_HW0)).toEqual(rgb);
    }
  });

  it("V6: the tick advances phase before the freeze and lands dark", () => {
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, { pha: 255, fre: 250, timeout: 42, sha: 0 });
    sim.run(42);
    let L = sim.layer(0, 1);
    // (255 + 42*250) mod 256 = 3: exactly timeout increments of fre.
    expect(L.pha).toBe(3);
    expect(L.fre).toBe(0);
    expect(L.timeout).toBe(0);
    sim.run(1);
    L = sim.layer(0, 1);
    expect(L.pha).toBe(3);
  });

  it("V6b: every DECAY_TABLE row lands its fade in phase 1..7", () => {
    // The design invariant: (256 - rate) * ticks sits in 248..254 so the
    // fade always ends dark and the end-of-fade flash is unreachable.
    for (const row of DECAY_TABLE) {
      const sim = new PadSim(blankState());
      sim.pokeLayer(0, 1, {
        pha: 255,
        fre: row.rate,
        timeout: row.ticks,
        sha: 0,
      });
      sim.run(row.ticks);
      const L = sim.layer(0, 1);
      expect(L.fre).toBe(0);
      expect(L.pha).toBe((255 + row.rate * row.ticks) % 256);
      expect(L.pha).toBeGreaterThanOrEqual(1);
      expect(L.pha).toBeLessThanOrEqual(7);
    }
  });

  it("V7: uint8 narrowing wraps two's complement", () => {
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, { pha: 250, fre: 10, timeout: 5 });
    sim.run(1);
    expect(sim.layer(0, 1).pha).toBe(4);
    sim.pokeLayer(0, 1, { pha: -97 });
    expect(sim.layer(0, 1).pha).toBe(159);
  });

  it("V8: an unknown shape falls through to ramp up", () => {
    // sha >= 4 is not in the firmware switch, so intensity keeps the
    // initialiser value, which is the phase.
    for (const pha of [0, 63, 127, 200, 255]) {
      expect(shapeIntensity(7, pha)).toBe(shapeIntensity(0, pha));
    }
  });

  it("V9: glc derives min c/20, mid c/2, max c with truncation", () => {
    expect(glcStops(255, 90, 20, false)).toEqual({
      min: [12, 4, 1],
      mid: [127, 45, 10],
      max: [255, 90, 20],
    });
    expect(glcStops(255, 90, 20, true).min).toEqual([0, 0, 0]);
  });
});

describe("the animating flag", () => {
  it("is true for a running look, false for a static instrument", () => {
    // Aurora's layer 2 wave holds timeout 65535 with rate 2 on every LED.
    expect(new PadSim(presetState("aurora")).animating).toBe(true);
    // Ninepads paints its checkerboard with static phases and no
    // countdown, so the panel can stop ticking it after the first frame.
    expect(new PadSim(presetState("ninepads")).animating).toBe(false);
  });

  it("rises on a comet touch and settles once the trail expires", () => {
    const s = blankState();
    s.touch.kind = "comet";
    const sim = new PadSim(s);
    expect(sim.animating).toBe(false);
    sim.touchDown(0, 64, 64);
    sim.tick();
    expect(sim.animating).toBe(true);
    // The paint tick already spent one of the trail's ticks, so the full
    // decay count from here is strictly enough.
    sim.run(nearestDecay(sim.state.touch.trailMs).ticks);
    expect(sim.animating).toBe(false);
  });

  it("stays false when fre is zero even while a timeout counts", () => {
    const sim = new PadSim(blankState());
    sim.pokeLayer(0, 1, { pha: 100, fre: 0, timeout: 50 });
    expect(sim.animating).toBe(false);
  });
});

describe("aurora, the default state", () => {
  it("arms the diagonal wave exactly as the compiler emits it", () => {
    const sim = new PadSim(defaultState());
    const c = sim.state.look.colour;
    for (let n = 0; n < CELLS; n++) {
      const L = sim.layer(screenToHw(n % GRID, Math.floor(n / GRID)), 2);
      const seed = (((n % GRID) + Math.floor(n / GRID)) * 15) % 256;
      expect(L.pha).toBe(seed);
      expect(L.fre).toBe(2);
      expect(L.sha).toBe(3);
      expect(L.timeout).toBe(65535);
      expect(L.max).toEqual([c.r, c.g, c.b]);
      expect(L.mid).toEqual([
        Math.floor(c.r / 2),
        Math.floor(c.g / 2),
        Math.floor(c.b / 2),
      ]);
      expect(L.min).toEqual([0, 0, 0]);
    }
  });

  it("advances phase by rate per tick and repeats every 128 ticks", () => {
    const sim = new PadSim(defaultState());
    sim.run(10);
    const L = sim.layer(screenToHw(0, 0), 2);
    expect(L.pha).toBe(20);
    expect(L.timeout).toBe(65525);
    const before = copyFrame(sim);
    sim.run(128);
    expect(copyFrame(sim)).toEqual(before);
  });

  it("pops the touch before the LED tick: the comet cell shows one advance", () => {
    const sim = new PadSim(defaultState());
    sim.touchDown(0, 63, 63);
    sim.run(1);
    // Cell under (63, 63) is logical 40, hardware 40. The handler wrote
    // pha 252, rate 250, timeout 42, and the SAME tick's led pass then
    // applied one increment: (252 + 250) mod 256 = 246, timeout 41.
    const L = sim.layer(screenToHw(4, 4), 1);
    expect(L.pha).toBe(246);
    expect(L.fre).toBe(250);
    expect(L.sha).toBe(0);
    expect(L.timeout).toBe(41);
    sim.run(41);
    const after = sim.layer(screenToHw(4, 4), 1);
    expect(after.pha).toBe(0);
    expect(after.fre).toBe(0);
    expect(after.timeout).toBe(0);
  });

  it("comet writes on UP too, exactly as compiled", () => {
    const sim = new PadSim(defaultState());
    sim.touchUp(0, 63, 63);
    sim.run(1);
    expect(sim.layer(screenToHw(4, 4), 1).timeout).toBe(41);
  });

  it("an expired comet cell renders at most a couple of counts", () => {
    const s = defaultState();
    s.look.kind = "none";
    const sim = new PadSim(s);
    sim.touchDown(0, 63, 63);
    sim.run(50);
    const rgb = cellRgb(sim, 40);
    for (const ch of rgb) expect(ch).toBeLessThanOrEqual(2);
  });

  it("the slow keeper re-arms the look layer at tick 30000 and not layer 1", () => {
    const sim = new PadSim(defaultState());
    sim.run(30000);
    // The keeper fired inside tick 30000, before that tick's LED pass:
    // 65535 refreshed, then one decrement.
    expect(sim.layer(0, 2).timeout).toBe(65534);
    // Layer 1 is the comet's and must keep expiring, so the keeper does
    // not touch it: aurora's plan animates layer 2 only.
    expect(sim.layer(0, 1).timeout).toBe(0);
  });
});

describe("look kinds", () => {
  it("starfield keys the shimmer to the hardware index", () => {
    const sim = new PadSim(presetState("starfield"));
    for (let h = 0; h < CELLS; h++) {
      const L = sim.layer(h, 2);
      expect(L.pha).toBe((h * 97) % 256);
      expect(L.fre).toBe(1 + (h % 3));
    }
    // Screen check through the serpentine: the top-left cell is hardware
    // 8, so its phase is 8 and its rate is 3.
    const topLeft = sim.layer(screenToHw(0, 0), 2);
    expect(topLeft.pha).toBe(8);
    expect(topLeft.fre).toBe(3);
  });

  it("pinwheel evaluates the swirl expression with Lua floor and mod", () => {
    const sim = new PadSim(presetState("pinwheel"));
    const phaseOf = (n) =>
      sim.layer(screenToHw(n % GRID, Math.floor(n / GRID)), 2).pha;
    // Centre cell: atan2(0, 0) is 0, phase 0.
    expect(phaseOf(40)).toBe(0);
    // Top-left, n = 0: floor(atan2(-4, -4) * 41) = -97, Lua mod 256 = 159.
    expect(phaseOf(0)).toBe(159);
    // Top-right, n = 8: floor(atan2(-4, 4) * 41) = -33, mod 256 = 223.
    expect(phaseOf(8)).toBe(223);
  });

  it("radar arms the ripple with fixed 45 and rings-from-centre rate", () => {
    const sim = new PadSim(presetState("radar"));
    const phaseOf = (n) =>
      sim.layer(screenToHw(n % GRID, Math.floor(n / GRID)), 2).pha;
    expect(phaseOf(40)).toBe(0);
    // Corner: floor(sqrt(32) * 45) = 254.
    expect(phaseOf(0)).toBe(254);
    // Rings from centre run the rate backwards: 256 - base for speed 2.
    expect(sim.layer(0, 2).fre).toBe(256 - 2);
  });

  it("a hard edge forces the mid stop black on layer 2", () => {
    const s = defaultState();
    s.look.edge = "hard";
    const sim = new PadSim(s);
    const L = sim.layer(0, 2);
    expect(L.mid).toEqual([0, 0, 0]);
    const c = sim.state.look.colour;
    expect(L.max).toEqual([c.r, c.g, c.b]);
  });

  it("look layers freeze at tick 65535 when the user owns the timer", () => {
    const s = defaultState();
    s.owned = { timer: "user" };
    const sim = new PadSim(s);
    sim.run(65535);
    expect(sim.layer(0, 2).timeout).toBe(0);
    expect(sim.layer(0, 2).fre).toBe(0);
    const frozen = copyFrame(sim);
    sim.run(64);
    // Frozen where it landed, not black: the phases stay lit.
    expect(copyFrame(sim)).toEqual(frozen);
    expect(frozen.some((v) => v > 0)).toBe(true);
  });

  it("the editor timer keeps the look alive past tick 65535", () => {
    const sim = new PadSim(defaultState());
    sim.run(65600);
    const before = copyFrame(sim);
    sim.run(64);
    expect(copyFrame(sim)).not.toEqual(before);
  });
});

describe("touch kinds", () => {
  it("perFinger derives the contact hue and ignores ended samples", () => {
    const sim = new PadSim(presetState("pinwheel"));
    sim.touchDown(2, 63, 63);
    sim.run(1);
    const L = sim.layer(screenToHw(4, 4), 1);
    // glc(a,1,255-i*60,i*60,128,1) for contact 2: (135, 120, 128).
    expect(L.max).toEqual([135, 120, 128]);
    expect(L.mid).toEqual([67, 60, 64]);
    expect(L.min).toEqual([0, 0, 0]);
    expect(L.fre).toBe(250);

    // An UP with no prior paint leaves the layer untouched: the LIVE
    // gate (e ~= 3 and e < 5) blocks ended samples.
    const sim2 = new PadSim(presetState("pinwheel"));
    sim2.touchUp(0, 63, 63);
    sim2.run(1);
    expect(sim2.layer(screenToHw(4, 4), 1).pha).toBe(0);
    expect(sim2.layer(screenToHw(4, 4), 1).max).toEqual([0, 0, 0]);
  });

  it("bloom fires on DOWN only and freezes mid-bright at the default trail", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.touch.kind = "bloom";
    const sim = new PadSim(s);
    sim.touchDown(0, 63, 63);
    sim.run(1);
    const centreHw = screenToHw(4, 4);
    let L = sim.layer(centreHw, 1);
    // Centre starts at 255; one led pass applied +4: (255+4) mod 256 = 3.
    expect(L.pha).toBe(3);
    expect(L.fre).toBe(4);
    // ticks = clamp(round(420 / 10), 16, 200) = 42.
    expect(L.timeout).toBe(41);
    sim.run(41);
    L = sim.layer(centreHw, 1);
    expect(L.timeout).toBe(0);
    expect(L.fre).toBe(0);
    // The honest hardware behaviour: (255 + 4*42) mod 256 = 167, the
    // centre freezes mid-bright, not dark. The preview must show it.
    expect(L.pha).toBe(167);
    // A neighbour one cell out started at 255 - 22 = 233: lands on 145.
    expect(sim.layer(screenToHw(3, 4), 1).pha).toBe((233 + 4 * 42) % 256);

    // MOVE does not re-trigger the burst.
    sim.touchMove(0, 63, 70);
    sim.run(1);
    expect(sim.layer(centreHw, 1).timeout).toBe(0);
  });

  it("glow tracks one cell and forgets it on UP", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.touch.kind = "glow";
    const sim = new PadSim(s);
    sim.touchDown(0, 63, 63);
    sim.run(1);
    const a = screenToHw(4, 4);
    expect(sim.layer(a, 1).pha).toBe(255);
    // 100*9//128 = 7: the finger slides to column 7 of row 4.
    sim.touchMove(0, 100, 63);
    sim.run(1);
    const b = screenToHw(7, 4);
    expect(sim.layer(a, 1).pha).toBe(0);
    expect(sim.layer(b, 1).pha).toBe(255);
    sim.touchUp(0, 100, 63);
    sim.run(1);
    expect(sim.layer(b, 1).pha).toBe(0);
  });

  it("disturb writes a clipped 3x3 patch into the look's layer", () => {
    const s = defaultState();
    s.touch.kind = "disturb";
    const sim = new PadSim(s);
    sim.touchDown(0, 0, 0);
    sim.run(1);
    // Corner touch: only the 4 in-grid cells of the 3x3 get phase 255,
    // which one led pass advances to (255 + 2) mod 256 = 1.
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      expect(sim.layer(screenToHw(x, y), 2).pha).toBe(1);
    }
    // The undisturbed neighbour keeps the wave phase: (2*15 + 2) = 32.
    expect(sim.layer(screenToHw(2, 0), 2).pha).toBe(32);
  });

  it("brush 2 paints the clamped 2x2 footprint", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.touch.brush = 2;
    const sim = new PadSim(s);
    // Bottom-right corner: u and v clamp to 7, so the footprint is the
    // 2x2 at (7..8, 7..8) and never wraps to the next row.
    sim.touchDown(0, 127, 127);
    sim.run(1);
    let painted = 0;
    for (let n = 0; n < CELLS; n++) {
      const L = sim.layer(screenToHw(n % GRID, Math.floor(n / GRID)), 1);
      if (L.timeout > 0) painted += 1;
    }
    expect(painted).toBe(4);
    for (const [x, y] of [
      [7, 7],
      [8, 7],
      [7, 8],
      [8, 8],
    ]) {
      expect(sim.layer(screenToHw(x, y), 1).timeout).toBe(41);
    }
  });
});

describe("sends: whole-pad XY", () => {
  it("radar sends CC pairs from the first finger only", () => {
    const log = [];
    const sim = new PadSim(presetState("radar"), {
      onMidi: (m) => log.push(m),
    });
    sim.touchDown(0, 63, 63);
    sim.run(1);
    expect(log).toEqual([
      { ch: 0, cmd: 176, p1: 16, p2: 63, mode: 0 },
      { ch: 0, cmd: 176, p1: 17, p2: 63, mode: 0 },
    ]);
    // A second contact while the first holds sends nothing.
    sim.touchDown(1, 100, 100);
    sim.run(1);
    expect(log).toHaveLength(2);
    // The first finger's UP releases the claim; phase "held" means the
    // UP itself sends no CC, then a fresh DOWN from the other contact
    // claims and sends.
    sim.touchUp(0, 63, 63);
    sim.run(1);
    expect(log).toHaveLength(2);
    sim.touchDown(1, 90, 90);
    sim.run(1);
    expect(log).toHaveLength(4);
    expect(log[2]).toEqual({ ch: 0, cmd: 176, p1: 16, p2: 90, mode: 0 });
  });

  it("hiRes widens the axis range and scales to 14 bits", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.touch.kind = "none";
    s.sends.kind = "xy";
    s.sends.hiRes = true;
    const log = [];
    const sim = new PadSim(s, { onMidi: (m) => log.push(m) });
    expect(sim.coordMax).toBe(1023);
    sim.touchDown(0, 1023, 0);
    sim.run(1);
    // 1023*16383//1023 = 16383 exactly at the top endpoint, mode 1.
    expect(log[0]).toEqual({ ch: 0, cmd: 176, p1: 16, p2: 16383, mode: 1 });
    expect(log[1]).toEqual({ ch: 0, cmd: 176, p1: 17, p2: 0, mode: 1 });
  });

  it("keeps the 0..127 range for ordinary states", () => {
    expect(new PadSim(defaultState()).coordMax).toBe(127);
  });
});

describe("sends: note zones", () => {
  it("draws the checkerboard at the exact dim ratio", () => {
    const sim = new PadSim(presetState("ninepads"));
    const light = sim.state.sends.gridColour;
    const dim = (v) => Math.floor((v * 2) / 5);
    // One layer at phase 255 renders floor(c * 254 / 512).
    const lit = (v) => Math.floor((v * 254) / 512);
    expect(cellRgb(sim, 0)).toEqual([lit(light.r), lit(light.g), lit(light.b)]);
    // Cell (3, 0) sits in zone column 1: the dim square.
    expect(cellRgb(sim, 3)).toEqual([
      lit(dim(light.r)),
      lit(dim(light.g)),
      lit(dim(light.b)),
    ]);
  });

  it("plays legato across zones and moves the held highlight", () => {
    const log = [];
    const sim = new PadSim(presetState("ninepads"), {
      onMidi: (m) => log.push(m),
    });
    sim.touchDown(0, 63, 63);
    sim.run(1);
    // (63*3)//128 = 1 on both axes: zone 4, note 36 + 4.
    expect(log).toEqual([{ ch: 0, cmd: 144, p1: 40, p2: 100, mode: 0 }]);
    expect(sim.layer(screenToHw(4, 4), 2).pha).toBe(255);
    sim.touchMove(0, 100, 63);
    sim.run(1);
    // (100*3)//128 = 2: zone 5. Note-off before note-on, in one sample.
    expect(log.slice(1)).toEqual([
      { ch: 0, cmd: 128, p1: 40, p2: 0, mode: 0 },
      { ch: 0, cmd: 144, p1: 41, p2: 100, mode: 0 },
    ]);
    expect(sim.layer(screenToHw(4, 4), 2).pha).toBe(0);
    expect(sim.layer(screenToHw(7, 4), 2).pha).toBe(255);
  });

  it("releases the note and highlight on UP and stays quiet after", () => {
    const log = [];
    const sim = new PadSim(presetState("ninepads"), {
      onMidi: (m) => log.push(m),
    });
    sim.touchDown(0, 63, 63);
    sim.run(1);
    sim.touchUp(0, 63, 63);
    sim.run(1);
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: 40, p2: 0, mode: 0 });
    expect(sim.layer(screenToHw(4, 4), 2).pha).toBe(0);
    // The UP cleared the freshness slot, so the watchdog has nothing to
    // expire and no spurious note-off follows.
    sim.run(300);
    expect(log).toHaveLength(2);
  });

  it("the watchdog expires a silent contact but leaves the highlight lit", () => {
    const log = [];
    const sim = new PadSim(presetState("ninepads"), {
      onMidi: (m) => log.push(m),
    });
    sim.touchDown(0, 63, 63);
    sim.run(1);
    expect(log).toHaveLength(1);
    // A motionless finger enqueues nothing (change gate), so the
    // watchdog counter climbs. It fires every 2 ticks and expires the
    // contact once the counter passes 100: about two seconds.
    sim.run(250);
    expect(log).toHaveLength(2);
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: 40, p2: 0, mode: 0 });
    // The honest bug reproduction: stale expiry does NOT repaint layer
    // 2, so the zone stays lit while the note is off.
    expect(sim.layer(screenToHw(4, 4), 2).pha).toBe(255);
    // And it expires exactly once.
    sim.run(300);
    expect(log).toHaveLength(2);
  });

  it("snake order mirrors the odd zone rows", () => {
    const s = presetState("ninepads");
    s.sends.order = "snake";
    const log = [];
    const sim = new PadSim(s, { onMidi: (m) => log.push(m) });
    // zx 0, zy 1: snake mirrors row 1, z = 1*3 + 2 - 0 = 5.
    sim.touchDown(0, 10, 63);
    sim.run(1);
    expect(log[0].p1).toBe(36 + 5);
  });
});

describe("sends: faders", () => {
  it("draws the rails frame at 252 and the level bars from the exact law", () => {
    const log = [];
    const sim = new PadSim(presetState("faders"), {
      onMidi: (m) => log.push(m),
    });
    // A non-rail cell drives both layers white at phase 255. The divide
    // happens after the layer sum, so floor(2*255*254/512) = 253, not
    // the 126 + 126 = 252 a per-layer rounding would suggest; this is
    // the same arithmetic the V3 vector pins.
    expect(cellRgb(sim, 0)).toEqual([253, 253, 253]);
    // A rail cell starts at phase 0 with a forced-black min: dark.
    expect(cellRgb(sim, 1)).toEqual([0, 0, 0]);

    // Drag fader 2 to the top: x 70 gives f = 70*4//128 = 2, y 0 gives
    // v = 127, l = (127+1)*9//128 = 9, all nine bar cells lit on BOTH
    // layers of rail column f*2+1 = 5.
    sim.touchDown(0, 70, 0);
    sim.run(1);
    expect(log[0]).toEqual({ ch: 0, cmd: 176, p1: 18, p2: 127, mode: 0 });
    for (let row = 0; row < GRID; row++) {
      expect(sim.layer(screenToHw(5, row), 1).pha).toBe(255);
      expect(sim.layer(screenToHw(5, row), 2).pha).toBe(255);
    }

    // Mid drag: y 64 gives v = 63, l = 64*9//128 = 4: rows 5..8 lit,
    // row 4 dark.
    sim.touchMove(0, 70, 64);
    sim.run(1);
    expect(log[1].p2).toBe(63);
    expect(sim.layer(screenToHw(5, 5), 1).pha).toBe(255);
    expect(sim.layer(screenToHw(5, 4), 1).pha).toBe(0);

    // Bottom: y 127 gives v = 0, l = 0: the bar empties completely,
    // which the naive v*9//127 law would not manage.
    sim.touchMove(0, 70, 127);
    sim.run(1);
    expect(log[2].p2).toBe(0);
    for (let row = 0; row < GRID; row++) {
      expect(sim.layer(screenToHw(5, row), 1).pha).toBe(0);
    }
  });

  it("blocks layout paints the whole column group on layer 1", () => {
    const s = presetState("faders");
    s.sends.layout = "blocks";
    const sim = new PadSim(s);
    // Fader 0 owns columns 0..2 (n%9*4//9 == 0). Top the fader up.
    sim.touchDown(0, 0, 0);
    sim.run(1);
    for (const x of [0, 1, 2]) {
      expect(sim.layer(screenToHw(x, 8), 1).pha).toBe(255);
    }
    // Column 3 belongs to fader 1 and stays down.
    expect(sim.layer(screenToHw(3, 8), 1).pha).toBe(0);
    // The dim track on layer 2 is untouched by the drag.
    expect(sim.layer(screenToHw(0, 8), 2).pha).toBe(255);
  });
});

describe("sends: the dial", () => {
  // A bare dial: no look, no touch, so the vectors read only MIDI. The
  // maths values below are hand-computed from the shared constants
  // (fine units = floor(atan2(v, u) * 652), doubled coordinates), not
  // derived by running the engine, so a drifting engine fails loudly.
  function dialState(mut) {
    const s = blankState();
    s.sends.kind = "dial";
    if (mut) mut(s);
    return s;
  }

  function rig(mut) {
    const log = [];
    const sim = new PadSim(dialState(mut), { onMidi: (m) => log.push(m) });
    return { log, sim };
  }

  // Feed one sample per tick so the FIFO never drops anything.
  function feed(sim, points, { id = 0, lift = false } = {}) {
    points.forEach(([x, y], i) => {
      if (i === 0) sim.touchDown(id, x, y);
      else sim.touchMove(id, x, y);
      sim.run(1);
    });
    if (lift) {
      const [x, y] = points[points.length - 1];
      sim.touchUp(id, x, y);
      sim.run(1);
    }
  }

  // A 16-step circle of touch radius 50 around the pad centre, closed
  // exactly on its start point so the telescoping deltas sum to one full
  // turn and the residual returns to zero.
  function circlePoints(clockwise) {
    const pts = [];
    for (let j = 0; j < 16; j++) {
      const t = ((clockwise ? 1 : -1) * 2 * Math.PI * j) / 16;
      pts.push([
        Math.round(63.5 + 50 * Math.cos(t)),
        Math.round(63.5 + 50 * Math.sin(t)),
      ]);
    }
    pts.push(pts[0]);
    return pts;
  }

  it("one exact full turn emits exactly 4096/K ticks, both directions", () => {
    // K = 64 at the default detent 5: 64 ticks per turn.
    const cw = rig();
    feed(cw.sim, circlePoints(true));
    expect(cw.log.every((m) => m.cmd === 176 && m.p1 === 16 && m.mode === 0))
      .toBe(true);
    expect(cw.log.reduce((sum, m) => sum + (m.p2 - 64), 0)).toBe(64);
    // Increasing atan angle with screen y down is clockwise on the pad,
    // and clockwise raises: every emission sits above 64.
    expect(cw.log.every((m) => m.p2 > 64)).toBe(true);

    const ccw = rig();
    feed(ccw.sim, circlePoints(false));
    expect(ccw.log.reduce((sum, m) => sum + (m.p2 - 64), 0)).toBe(-64);
    expect(ccw.log.every((m) => m.p2 < 64)).toBe(true);
  });

  it("scales with the sensitivity detent through the shared table", () => {
    // Detent 3: K = 128, 32 ticks per turn. Detent 7: K = 32, 128 ticks.
    expect(DIAL_SENSE_TABLE[2]).toBe(128);
    expect(DIAL_SENSE_TABLE[6]).toBe(32);
    const slow = rig((d) => (d.sends.dialSense = 3));
    feed(slow.sim, circlePoints(true));
    expect(slow.log.reduce((sum, m) => sum + (m.p2 - 64), 0)).toBe(32);
    const fast = rig((d) => (d.sends.dialSense = 7));
    feed(fast.sim, circlePoints(true));
    expect(fast.log.reduce((sum, m) => sum + (m.p2 - 64), 0)).toBe(128);
  });

  it("crosses the atan seam without a half-turn burst", () => {
    // (13, 66) is angle 2016 fine units, (13, 61) is -2017: the raw
    // delta -4033 corrects to +63, one small forward tick, then the walk
    // back emits its mirror. Hand-computed, see the header note.
    const { log, sim } = rig();
    feed(sim, [
      [13, 66],
      [13, 61],
      [13, 66],
    ]);
    expect(log.map((m) => m.p2)).toEqual([65, 63]);
  });

  it("ignores the deadzone and re-baselines on the way out", () => {
    const { log, sim } = rig();
    // All inside u*u + v*v <= 1444: nothing at all.
    feed(sim, [
      [63, 63],
      [64, 64],
      [66, 60],
    ]);
    expect(log).toHaveLength(0);
    // First sample outside is a baseline, not a delta: still nothing.
    sim.touchMove(0, 100, 63);
    sim.run(1);
    expect(log).toHaveLength(0);
    // The next real movement emits from the new baseline: angle -9 to
    // 114 fine units is two ticks at K = 64.
    sim.touchMove(0, 100, 70);
    sim.run(1);
    expect(log.map((m) => m.p2)).toEqual([66]);
  });

  it("dives through the centre without a jump", () => {
    const { log, sim } = rig();
    // Straight drag through the middle: the angle flips by half a turn,
    // exactly the seam correction's ambiguity, but the deadzone cleared
    // the previous angle so the far side re-baselines silently.
    feed(sim, [
      [100, 63],
      [64, 64],
      [27, 63],
    ]);
    expect(log).toHaveLength(0);
  });

  it("resets on touch-down so a new touch never inherits a jump", () => {
    const { log, sim } = rig();
    feed(sim, [
      [114, 64],
      [64, 114],
    ], { lift: true });
    // One quarter turn in one move: 1011 fine units, 16 ticks.
    expect(log.map((m) => m.p2)).toEqual([80]);
    // Re-touch on the OPPOSITE side of the pad: no emission until real
    // movement, and the first movement reflects only itself.
    sim.touchDown(0, 13, 64);
    sim.run(1);
    expect(log).toHaveLength(1);
    sim.touchMove(0, 13, 70);
    sim.run(1);
    expect(log).toHaveLength(2);
    expect(Math.abs(log[1].p2 - 64)).toBeLessThanOrEqual(2);
  });

  it("clamps a violent flick at 127 and never wraps", () => {
    // Detent 8, K = 16: a near-half-turn single sample is 126 raw ticks,
    // clamped to the 127 ceiling. 64 stays unreachable.
    const { log, sim } = rig((d) => (d.sends.dialSense = 8));
    feed(sim, [
      [114, 64],
      [13, 65],
    ]);
    expect(log.map((m) => m.p2)).toEqual([127]);
  });

  it("stays silent under micro-jitter and never emits 64", () => {
    const { log, sim } = rig();
    feed(sim, [
      [123, 63],
      [123, 64],
      [123, 63],
      [123, 64],
      [123, 63],
    ]);
    expect(log).toHaveLength(0);
  });

  it("absolute mode: accumulates from 64, survives lifts, pins at the stops", () => {
    const quarter = [
      [114, 64],
      [110, 83],
      [99, 99],
      [83, 110],
      [64, 114],
    ];
    const { log, sim } = rig((d) => (d.sends.dialMode = "absolute"));
    feed(sim, quarter, { lift: true });
    // A quarter turn from the initial 64 lands on exactly 80.
    expect(log[log.length - 1].p2).toBe(80);
    for (let i = 1; i < log.length; i++) {
      expect(log[i].p2).toBeGreaterThan(log[i - 1].p2);
    }
    // Lift continuity: the level survives the lift and the residual
    // carries, so the same quarter turn again ends on exactly 96.
    feed(sim, quarter, { lift: true });
    expect(log[log.length - 1].p2).toBe(96);

    // Turn far past the top: the value pins at 127 exactly once and the
    // change gate keeps the pinned knob silent, like a knob on its stop.
    feed(sim, circlePoints(true));
    feed(sim, circlePoints(true));
    expect(log.filter((m) => m.p2 === 127)).toHaveLength(1);
    const pinned = log.length;
    feed(sim, circlePoints(true));
    expect(log).toHaveLength(pinned);
    // Turning back emits immediately.
    feed(sim, circlePoints(false));
    expect(log.length).toBeGreaterThan(pinned);
    expect(log[pinned].p2).toBeLessThan(127);
  });

  it("the radius stream is off by default and monotone when on", () => {
    const off = rig();
    feed(off.sim, circlePoints(true));
    expect(new Set(off.log.map((m) => m.p1))).toEqual(new Set([16]));

    // An outward drag on one radial: rising distance values on ccBase+1,
    // 39 just outside the deadzone, exactly 127 at the edge midpoint,
    // and no turn CC because the angle barely moves.
    const on = rig((d) => (d.sends.dialRadius = true));
    feed(on.sim, [
      [83, 63],
      [100, 63],
      [127, 63],
    ]);
    expect(on.log.every((m) => m.p1 === 17)).toBe(true);
    expect(on.log.map((m) => m.p2)).toEqual([39, 73, 127]);
  });

  it("first finger only: a second contact never steals the dial", () => {
    const { log, sim } = rig();
    sim.touchDown(0, 114, 64);
    sim.run(1);
    // A second finger lands elsewhere mid-hold: ignored entirely.
    sim.touchDown(1, 20, 20);
    sim.run(1);
    sim.touchMove(0, 64, 114);
    sim.run(1);
    expect(log.map((m) => m.p2)).toEqual([80]);
    sim.touchMove(1, 30, 30);
    sim.run(1);
    expect(log).toHaveLength(1);
    // The claimant lifts; the RESTING second finger does not inherit the
    // claim. Only a fresh press does, and it starts jump-free.
    sim.touchUp(0, 64, 114);
    sim.run(1);
    sim.touchMove(1, 40, 40);
    sim.run(1);
    expect(log).toHaveLength(1);
    sim.touchDown(1, 114, 64);
    sim.run(1);
    expect(log).toHaveLength(1);
  });

  it("relative mode never emits 64 anywhere", () => {
    const { log, sim } = rig();
    feed(sim, circlePoints(true), { lift: true });
    feed(sim, circlePoints(false), { lift: true });
    expect(log.some((m) => m.p2 === 64)).toBe(false);
    expect(log.every((m) => m.p2 >= 1 && m.p2 <= 127)).toBe(true);
  });
});

describe("solo means solo, measured at the wire", () => {
  // The strongest possible statement: drive the engine on the compiled
  // solo variant and assert the set of controllers that actually left
  // the pad is exactly the soloed stream's numbers.
  function emitted(state, drive) {
    const log = [];
    const sim = new PadSim(state, { onMidi: (m) => log.push(m) });
    drive(sim);
    return { log, sim };
  }

  const drag = (sim) => {
    sim.touchDown(0, 10, 10);
    sim.run(1);
    sim.touchMove(0, 60, 90);
    sim.run(1);
    sim.touchMove(0, 110, 40);
    sim.run(1);
  };

  it("xy: each axis solos to its own controller", () => {
    const base = blankState();
    base.sends.kind = "xy";
    const x = emitted(soloPadState(base, "xy.x"), drag);
    expect(x.log.length).toBeGreaterThan(0);
    expect(new Set(x.log.map((m) => m.p1))).toEqual(new Set([16]));
    const y = emitted(soloPadState(base, "xy.y"), drag);
    expect(new Set(y.log.map((m) => m.p1))).toEqual(new Set([17]));

    // The axes knob itself, without solo: same machinery, same numbers.
    const xOnly = clonePadState(base);
    xOnly.sends.axes = "x";
    const knob = emitted(xOnly, drag);
    expect(new Set(knob.log.map((m) => m.p1))).toEqual(new Set([16]));
  });

  it("xy hiRes: the 14-bit pair solos as one stream", () => {
    const base = blankState();
    base.sends.kind = "xy";
    base.sends.hiRes = true;
    const { log } = emitted(soloPadState(base, "xy.x"), (sim) => {
      sim.touchDown(0, 500, 700);
      sim.run(1);
      sim.touchMove(0, 800, 200);
      sim.run(1);
    });
    expect(log.length).toBeGreaterThan(0);
    expect(new Set(log.map((m) => m.p1))).toEqual(new Set([16]));
    expect(log.every((m) => m.mode === 1)).toBe(true);
  });

  it("faders: the solo guards the MIDI and leaves every level bar live", () => {
    const solo = soloPadState(presetById("faders").state, "fader.2");
    const { log, sim } = emitted(solo, (s) => {
      // Fader 0 to the top, then fader 2 to the top.
      s.touchDown(0, 10, 0);
      s.run(1);
      s.touchUp(0, 10, 0);
      s.run(1);
      s.touchDown(0, 70, 0);
      s.run(1);
    });
    expect(new Set(log.map((m) => m.p1))).toEqual(new Set([18]));
    // Fader 0's rail (column 1) still filled to the top: the LED picture
    // stayed live while its CC was muted.
    expect(sim.layer(screenToHw(1, 0), 1).pha).toBe(255);
  });

  it("dial: turn and distance solo to their own controllers", () => {
    const base = blankState();
    base.sends.kind = "dial";
    base.sends.dialRadius = true;
    const spin = (sim) => {
      sim.touchDown(0, 114, 64);
      sim.run(1);
      sim.touchMove(0, 64, 114);
      sim.run(1);
      sim.touchMove(0, 13, 64);
      sim.run(1);
    };
    const turn = emitted(soloPadState(base, "dial.turn"), spin);
    expect(turn.log.length).toBeGreaterThan(0);
    expect(new Set(turn.log.map((m) => m.p1))).toEqual(new Set([16]));
    const dist = emitted(soloPadState(base, "dial.radius"), spin);
    expect(dist.log.length).toBeGreaterThan(0);
    expect(new Set(dist.log.map((m) => m.p1))).toEqual(new Set([17]));
  });
});

describe("touch delivery", () => {
  it("change-gates identical samples and caps the FIFO at ten", () => {
    const sim = new PadSim(defaultState());
    sim.touchDown(0, 10, 10);
    expect(sim.pendingTouches).toBe(1);
    sim.touchMove(0, 20, 10);
    sim.touchMove(0, 20, 10);
    expect(sim.pendingTouches).toBe(2);

    const sim2 = new PadSim(defaultState());
    sim2.touchDown(0, 0, 0);
    for (let k = 1; k <= 11; k++) sim2.touchMove(0, k, 0);
    expect(sim2.pendingTouches).toBe(10);
    sim2.run(1);
    expect(sim2.pendingTouches).toBe(9);
  });

  it("a dropped sample leaves the gate open for the next change", () => {
    // Deliberate deviation from the hardware bug: on the real pad the
    // delta gate advances before the writability check, so a dropped UP
    // sticks a contact forever. The sim only advances the gate on a
    // successful enqueue.
    const sim = new PadSim(defaultState());
    for (let k = 0; k <= 10; k++) sim.touchMove(0, k, 0);
    expect(sim.pendingTouches).toBe(10);
    sim.run(1);
    // The dropped sample (x 10) can be regenerated now that there is room.
    sim.touchMove(0, 10, 0);
    expect(sim.pendingTouches).toBe(10);
  });
});

describe("compiler-to-sim pinning", () => {
  it("aurora: the sim uses the exact stops, rate and wavelength the Lua carries", () => {
    const result = compile(defaultState());
    const sim = new PadSim(defaultState());

    const stops = result.setupLua.match(/glc\(a,2,(\d+),(\d+),(\d+),1\)/);
    expect(stops).not.toBeNull();
    const L = sim.layer(0, 2);
    expect(L.max).toEqual([+stops[1], +stops[2], +stops[3]]);

    const pfs = result.setupLua.match(
      /glpfs\(a,2,\(n%9\+n\/\/9\)\*(\d+),(\d+),3\)/,
    );
    expect(pfs).not.toBeNull();
    const w = +pfs[1];
    const rate = +pfs[2];
    expect(rate).toBe(speedRate(sim.state.look.speed, sim.state.look.reverse));
    expect(sim.layer(0, 2).fre).toBe(rate);
    // The wavelength is the phase stride between horizontal neighbours.
    const p0 = sim.layer(screenToHw(0, 0), 2).pha;
    const p1 = sim.layer(screenToHw(1, 0), 2).pha;
    expect((p1 - p0 + 256) % 256).toBe(w);

    expect(result.setupLua).toContain("glt(a,2,65535)");
    expect(result.setupLua).toContain("gtt(0,3e5)");
  });

  it("aurora: the decay pair in the Lua matches the table and the sim", () => {
    const result = compile(defaultState());
    const pfs = result.setupLua.match(/glpfs\([a-z],1,252,(\d+),0\)/);
    const glt = result.setupLua.match(/glt\([a-z],1,(\d+)\)/);
    expect(pfs).not.toBeNull();
    expect(glt).not.toBeNull();
    const row = nearestDecay(defaultState().touch.trailMs);
    expect(+pfs[1]).toBe(row.rate);
    expect(+glt[1]).toBe(row.ticks);

    const sim = new PadSim(defaultState());
    sim.touchDown(0, 63, 63);
    sim.run(1);
    const L = sim.layer(screenToHw(4, 4), 1);
    expect(L.fre).toBe(row.rate);
    expect(L.timeout).toBe(row.ticks - 1);
  });

  it("aurora: the keeper refreshes exactly the layers the plan animates", () => {
    const result = compile(defaultState());
    expect(result.timerLua).toContain("glt(a,2,65535)");
    // Layer 1 carries the comet fades; refreshing it would make every
    // trail immortal, so its absence from the keeper is load-bearing.
    expect(result.timerLua).not.toContain("glt(a,1,65535)");
  });

  it("bloom: the tick count and front constant come from the same formula", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.touch.kind = "bloom";
    const result = compile(s);
    expect(result.setupLua).toContain("*22//1");
    const glt = result.setupLua.match(/glt\(a,1,(\d+)\)/);
    expect(glt).not.toBeNull();
    expect(+glt[1]).toBe(42);
    const sim = new PadSim(s);
    sim.touchDown(0, 63, 63);
    sim.run(1);
    expect(sim.layer(screenToHw(4, 4), 1).timeout).toBe(+glt[1] - 1);
  });

  it("faders: the bar law and rail predicate are the ones the sim runs", () => {
    const result = compile(presetState("faders"));
    expect(result.setupLua).toContain("local l=(v+1)*9//128");
    expect(result.setupLua).toContain("n%9==f*2+1");
  });

  it("ninepads: the checkerboard literals match the state and the dim ratio", () => {
    const result = compile(presetState("ninepads"));
    const m = result.setupLua.match(
      /glc\(a,1,(\d+),(\d+),(\d+),1\)else glc\(a,1,(\d+),(\d+),(\d+),1\)/,
    );
    expect(m).not.toBeNull();
    const sim = new PadSim(presetState("ninepads"));
    const light = sim.state.sends.gridColour;
    expect([+m[1], +m[2], +m[3]]).toEqual([light.r, light.g, light.b]);
    expect([+m[4], +m[5], +m[6]]).toEqual([
      Math.floor((light.r * 2) / 5),
      Math.floor((light.g * 2) / 5),
      Math.floor((light.b * 2) / 5),
    ]);
  });

  it("zones: the watchdog thresholds and fast period are in the Lua", () => {
    const result = compile(presetState("ninepads"));
    expect(result.setupLua).toContain("gtt(0,20)");
    expect(result.timerLua).toContain("gtt(0,20)");
    expect(result.timerLua).toContain("t>100");
    // Hidden zones under a look keep the keeper behind the fire counter.
    const s = presetState("ninepads");
    s.sends.showGrid = false;
    s.look.kind = "wave";
    s.enabled.look = true;
    const withLook = compile(s);
    expect(withLook.timerLua).toContain("s.c>15000");
    expect(withLook.timerLua).toContain("glt(a,2,65535)");
  });

  it("pins the expression strings the sim evaluates in JS", () => {
    const pinwheel = compile(presetState("pinwheel"));
    expect(pinwheel.setupLua).toContain(
      "math.atan(n//9-4,n%9-4)*41//1%256",
    );
    expect(pinwheel.setupLua).toContain("glc(a,1,255-i*60,i*60,128,1)");
    const radar = compile(presetState("radar"));
    expect(radar.setupLua).toContain("math.sqrt(u*u+v*v)*45//1");
    const starfield = compile(presetState("starfield"));
    expect(starfield.setupLua).toContain("glpfs(a,2,a*97%256,1+a%3,3)");
  });

  it("scan, drift, showpiece, spiral swirl and edge ripple stay pinned too", () => {
    // The look kinds no shelf card carries by default are still reachable
    // states, so their emissions get the same string pin plus a sim spot
    // value each; without this the sim could drift on exactly the kinds
    // the preset sweep never exercises.
    const scan = defaultState();
    scan.look.kind = "scan";
    expect(compile(scan).setupLua).toContain("glpfs(a,2,n%9*15,2,3)");
    const scanSim = new PadSim(scan);
    expect(scanSim.layer(screenToHw(3, 0), 2).pha).toBe(45);

    const drift = defaultState();
    drift.look.kind = "drift";
    const driftLua = compile(drift).setupLua;
    // Both ramps in the emitted lo +/- |d|*x//8 form, endpoints exact.
    expect(driftLua).toContain("gld(a,2,255*x//8,85-17*x//8,255-255*x//8)");
    expect(driftLua).toContain("glx(a,2,255-255*x//8,68+17*x//8,255*x//8)");
    expect(driftLua).toContain("glpfs(a,2,(x+n//9)*15,2,3)");
    const driftSim = new PadSim(drift);
    // Column 4 of the mid ramp: 0+127, 85-8, 255-127.
    expect(driftSim.layer(screenToHw(4, 0), 2).mid).toEqual([127, 77, 128]);
    expect(driftSim.layer(screenToHw(4, 0), 2).pha).toBe(60);

    const show = defaultState();
    show.look.kind = "showpiece";
    const showLua = compile(show).setupLua;
    expect(showLua).toContain("glpfs(a,2,(n%9+n//9)*15,2,3)");
    // The counter-rotation runs at 256 - rate on layer 1 in colour B.
    expect(showLua).toContain(
      "glpfs(a,1,math.atan(n//9-4,n%9-4)*41//1%256,254,3)",
    );
    const showSim = new PadSim(show);
    expect(showSim.layer(screenToHw(0, 0), 1).pha).toBe(159);
    expect(showSim.layer(screenToHw(0, 0), 1).fre).toBe(254);

    const spiral = defaultState();
    spiral.look.kind = "swirl";
    spiral.look.arms = 2;
    spiral.look.spiral = true;
    expect(compile(spiral).setupLua).toContain(
      "glpfs(a,2,math.atan(n//9-4,n%9-4)*82//1+n%9*8%256,2,3)",
    );
    const spiralSim = new PadSim(spiral);
    // floor(atan2(-4,-4)*82) = -194, +0, wrapped u8: 62. Top-right adds
    // 8*8 = 64 to -65 and wraps to 255.
    expect(spiralSim.layer(screenToHw(0, 0), 2).pha).toBe(62);
    expect(spiralSim.layer(screenToHw(8, 0), 2).pha).toBe(255);

    const rippleEdge = defaultState();
    rippleEdge.look.kind = "ripple";
    rippleEdge.look.ringsFrom = "edge";
    // Rings from the edge keep the base rate; centre negates it, which
    // the radar test pins from the other side.
    expect(compile(rippleEdge).setupLua).toContain(
      "glpfs(a,2,math.sqrt(u*u+v*v)*45//1,2,3)",
    );
    expect(new PadSim(rippleEdge).layer(0, 2).fre).toBe(2);
  });

  it("hard edge emits the mid-black override exactly when the sim applies it", () => {
    const soft = compile(defaultState());
    expect(soft.setupLua).not.toContain("gld(a,2,0,0,0)");
    const s = defaultState();
    s.look.edge = "hard";
    const hard = compile(s);
    expect(hard.setupLua).toContain("gld(a,2,0,0,0)");
  });

  it("dial: the emitted constants are the ones the sim imports", () => {
    // Built FROM the shared constants, so a table change breaks the pin
    // rather than silently drifting the sim away from the hardware.
    const s = blankState();
    s.sends.kind = "dial";
    const lua = compile(s).setupLua;
    expect(lua).toContain(`math.atan(v,u)*${DIAL_ATAN_SCALE}//1`);
    expect(lua).toContain(
      `if d>${DIAL_HALF_TURN} then d=d-${DIAL_FINE_PER_TURN} elseif d<-${DIAL_HALF_TURN} then d=d+${DIAL_FINE_PER_TURN} end`,
    );
    expect(lua).toContain(`u*u+v*v>${DIAL_DEADZONE_R2}`);
    // The default detent's divisor and its exact half as the bias.
    const K = DIAL_SENSE_TABLE[s.sends.dialSense - 1];
    expect(lua).toContain(`local n=(s.d+${K / 2})//${K}`);
    expect(lua).toContain(`s.d=s.d-n*${K}`);
    expect(lua).toContain("glim(64+n,1,127)");
    // The dial's own wrap clears the previous angle beside the claim.
    expect(lua).toContain("s.f=nil s.a=nil");
    // And the deadzone clears it too, the centre-crossing re-baseline.
    expect(lua).toContain("else s.a=nil end");
    // No LED write anywhere in the sends body: the handler's only LED
    // calls belong to the touch sheet, which blankState turned off.
    expect(lua).not.toContain("glp(");

    // A different detent bakes its own literals.
    const fast = blankState();
    fast.sends.kind = "dial";
    fast.sends.dialSense = 8;
    const K8 = DIAL_SENSE_TABLE[7];
    expect(compile(fast).setupLua).toContain(`local n=(s.d+${K8 / 2})//${K8}`);
  });

  it("dial: radius and absolute emit their pinned forms only when asked", () => {
    const rel = blankState();
    rel.sends.kind = "dial";
    expect(compile(rel).setupLua).not.toContain("math.sqrt");
    expect(compile(rel).setupLua).not.toContain("s.v");

    const radius = blankState();
    radius.sends.kind = "dial";
    radius.sends.dialRadius = true;
    const radiusLua = compile(radius).setupLua;
    expect(radiusLua).toContain("local q=u*u+v*v");
    expect(radiusLua).toContain(`q>${DIAL_DEADZONE_R2}`);
    expect(radiusLua).toContain("glim(math.sqrt(q)//1,0,127)");
    expect(radiusLua).toContain("if r~=s.r then s.r=r");

    const abs = blankState();
    abs.sends.kind = "dial";
    abs.sends.dialMode = "absolute";
    const absLua = compile(abs).setupLua;
    expect(absLua).toContain("glim(s.v+n,0,127)");
    expect(absLua).toContain("if w~=s.v then s.v=w");
    expect(absLua).toContain("self.v=64");
  });
});

// ---------------------------------------------------------------------------
// Brightness parity: the sim imports scaleChannel from _pad and applies it
// where it chooses colours; these pins parse the literal channel arguments
// out of the compiled Lua and hold the sim's armed stops to those exact
// numbers, so the compiler and the sim cannot drift apart on any funnel
// site. The firmware model (glcStops, weightsOf, the render sum) stays
// untouched by brightness, which the identity test at the end confirms.

describe("brightness parity, compiler to sim", () => {
  const dimmed = (b, ...ms) => {
    const s = defaultState();
    for (const m of ms) m(s);
    s.brightness = b;
    return normalisePadState(s);
  };

  it("shares the funnel: scaleChannel vectors and the table words", () => {
    expect(scaleChannel(255, 15)).toBe(38);
    expect(scaleChannel(17, 15)).toBe(2);
    expect(scaleChannel(60, 50)).toBe(30);
    expect(BRIGHTNESS_TABLE[0].word).toBe("Dim");
    expect(BRIGHTNESS_TABLE[4].pct).toBe(100);
  });

  it("wave and comet: armed stops equal the emitted literals at Dim and Half", () => {
    for (const b of [1, 3]) {
      const s = dimmed(b);
      const lua = compile(s).setupLua;
      const look = lua.match(/glc\(a,2,(\d+),(\d+),(\d+),1\)/);
      const touch = lua.match(/glc\(a,1,(\d+),(\d+),(\d+),1\)/);
      expect(look, `b=${b}`).not.toBeNull();
      expect(touch, `b=${b}`).not.toBeNull();
      const sim = new PadSim(s);
      expect(sim.layer(0, 2).max, `b=${b}`).toEqual([
        +look[1],
        +look[2],
        +look[3],
      ]);
      expect(sim.layer(0, 1).max, `b=${b}`).toEqual([
        +touch[1],
        +touch[2],
        +touch[3],
      ]);
      // Phases, rates and timeouts never scale.
      expect(lua).toContain("glt(a,2,65535)");
    }
  });

  it("perFinger: the scaled coefficients parsed from the Lua drive the paint", () => {
    for (const b of [1, 3]) {
      const s = dimmed(b, (d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "perFinger";
      });
      const lua = compile(s).setupLua;
      const m = lua.match(/glc\([a-z],1,(\d+)-i\*(\d+),i\*(\d+),(\d+),1\)/);
      expect(m, `b=${b}`).not.toBeNull();
      expect(+m[2]).toBe(+m[3]);
      const sim = new PadSim(s);
      sim.touchDown(2, 63, 63);
      sim.run(1);
      const L = sim.layer(screenToHw(4, 4), 1);
      expect(L.max, `b=${b}`).toEqual([
        +m[1] - 2 * +m[2],
        2 * +m[3],
        +m[4],
      ]);
    }
  });

  it("zones: checkerboard, dark square and held colour match at Dim and Half", () => {
    for (const b of [1, 3]) {
      const s = dimmed(b, (d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
        d.sends.kind = "zones";
        d.sends.grid = "3x3";
        d.sends.showGrid = true;
      });
      const lua = compile(s).setupLua;
      const board = lua.match(
        /glc\(a,1,(\d+),(\d+),(\d+),1\)else glc\(a,1,(\d+),(\d+),(\d+),1\)/,
      );
      const held = lua.match(/glc\(a,2,(\d+),(\d+),(\d+),1\)/);
      expect(board, `b=${b}`).not.toBeNull();
      expect(held, `b=${b}`).not.toBeNull();
      const sim = new PadSim(s);
      // (0,0) sits in an even zone sum, a light square; (3,0) is dark.
      expect(sim.layer(screenToHw(0, 0), 1).max, `b=${b}`).toEqual([
        +board[1],
        +board[2],
        +board[3],
      ]);
      expect(sim.layer(screenToHw(3, 0), 1).max, `b=${b}`).toEqual([
        +board[4],
        +board[5],
        +board[6],
      ]);
      expect(sim.layer(screenToHw(0, 0), 2).max, `b=${b}`).toEqual([
        +held[1],
        +held[2],
        +held[3],
      ]);
    }
  });

  it("rails: fader coefficients and whites match at Dim", () => {
    const s = dimmed(1, (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "rails";
      d.sends.showGrid = true;
    });
    const lua = compile(s).setupLua;
    const rail = lua.match(/glc\(a,1,f\*(\d+),(\d+)-f\*(\d+),(\d+)-f\*(\d+),1\)/);
    const white = lua.match(/else glc\(a,1,(\d+),(\d+),(\d+),1\)/);
    expect(rail).not.toBeNull();
    expect(white).not.toBeNull();
    const sim = new PadSim(s);
    // Column 3 is the rail cell of fader 1 (3 % 2 == 1, f = 1).
    expect(sim.layer(screenToHw(3, 0), 1).max).toEqual([
      1 * +rail[1],
      +rail[2] - 1 * +rail[3],
      +rail[4] - 1 * +rail[5],
    ]);
    // Column 0 is a white cell, on both layers.
    expect(sim.layer(screenToHw(0, 0), 1).max).toEqual([
      +white[1],
      +white[2],
      +white[3],
    ]);
    expect(sim.layer(screenToHw(0, 0), 2).max).toEqual([
      +white[1],
      +white[2],
      +white[3],
    ]);
  });

  it("blocks: palette and dim track match at Half", () => {
    const s = dimmed(3, (d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "blocks";
      d.sends.showGrid = true;
    });
    const lua = compile(s).setupLua;
    const pal = lua.match(/glc\(a,1,f\*(\d+),(\d+)-f\*(\d+),(\d+)-f\*(\d+),1\)/);
    const track = lua.match(/glc\(a,2,(\d+),(\d+),(\d+),1\)/);
    expect(pal).not.toBeNull();
    expect(track).not.toBeNull();
    const sim = new PadSim(s);
    // Column 4 is fader 1 (4*4//9 = 1).
    expect(sim.layer(screenToHw(4, 0), 1).max).toEqual([
      1 * +pal[1],
      +pal[2] - 1 * +pal[3],
      +pal[4] - 1 * +pal[5],
    ]);
    expect(sim.layer(screenToHw(4, 0), 2).max).toEqual([
      +track[1],
      +track[2],
      +track[3],
    ]);
  });

  it("drift: scaled endpoints land exactly on the end columns, Lua pinned", () => {
    const s = dimmed(1, (d) => {
      d.look.kind = "drift";
      d.touch.kind = "none";
      d.enabled.touch = false;
    });
    const lua = compile(s).setupLua;
    // Default colours (0,90,255) and (255,60,0) quantise to (0,85,255)
    // and (255,68,0); at Dim they scale to (0,12,38) and (38,10,0), and
    // rampChannel runs on the scaled endpoints.
    expect(lua).toContain("gld(a,2,38*x//8,12-2*x//8,38-38*x//8)");
    expect(lua).toContain("glx(a,2,38-38*x//8,10+2*x//8,38*x//8)");
    const sim = new PadSim(s);
    expect(sim.layer(screenToHw(0, 0), 2).mid).toEqual([0, 12, 38]);
    expect(sim.layer(screenToHw(0, 0), 2).max).toEqual([38, 10, 0]);
    expect(sim.layer(screenToHw(8, 0), 2).mid).toEqual([38, 10, 0]);
    expect(sim.layer(screenToHw(8, 0), 2).max).toEqual([0, 12, 38]);
  });

  it("a dimmed-then-restored state renders the never-dimmed frame", () => {
    const restored = dimmed(1);
    restored.brightness = 5;
    const once = new PadSim(defaultState());
    const twice = new PadSim(restored);
    once.run(30);
    twice.run(30);
    expect([...twice.frame]).toEqual([...once.frame]);
  });
});

describe("the preset sweep", () => {
  it("every shelf card simulates clean for 200 ticks", () => {
    for (const p of PRESETS) {
      const sim = new PadSim(p.state);
      sim.run(200);
      const frame = sim.frame;
      expect(frame).toHaveLength(243);
      const anyLit = frame.some((v) => v > 0);
      if (p.id === "tpad") {
        // The trackpad writes no LEDs: the frame stays black and the
        // panel keeps static art for that one card.
        expect(anyLit).toBe(false);
      } else {
        expect(anyLit).toBe(true);
      }
    }
  });

  it("setState rebuilds from scratch like a page load", () => {
    const sim = new PadSim(defaultState());
    sim.touchDown(0, 63, 63);
    sim.run(100);
    sim.setState(presetState("ninepads"));
    expect(sim.tickCount).toBe(0);
    expect(sim.pendingTouches).toBe(0);
    // The comet residue is gone: layer 1 belongs to the checkerboard now.
    expect(sim.layer(screenToHw(4, 4), 1).pha).toBe(255);
  });
});

describe("the joystick and the latch, at the wire", () => {
  function driven(state, drive) {
    const log = [];
    const sim = new PadSim(state, { onMidi: (m) => log.push(m) });
    drive(sim);
    return { log, sim };
  }

  it("joystick: live bend on the MSB, mod inverted, exact rests on lift", () => {
    const { log } = driven(presetState("joystick"), (sim) => {
      sim.touchDown(0, 100, 30);
      sim.run(1);
      sim.touchUp(0, 100, 30);
      sim.run(1);
    });
    // Live: left-right is bend with MSB = x, up-down is CC 17 at 127 - y.
    expect(log[0]).toEqual({ ch: 0, cmd: 224, p1: 0, p2: 100, mode: 0 });
    expect(log[1]).toEqual({ ch: 0, cmd: 176, p1: 17, p2: 97, mode: 0 });
    // Lift: bit-exact rests, wherever the finger left.
    expect(log[log.length - 2]).toEqual({
      ch: 0,
      cmd: 224,
      p1: 0,
      p2: 64,
      mode: 0,
    });
    expect(log[log.length - 1]).toEqual({
      ch: 0,
      cmd: 176,
      p1: 17,
      p2: 0,
      mode: 0,
    });
  });

  it("joystick: the home cell is lit from power-on and the dot parks there", () => {
    const sim = new PadSim(presetState("joystick"));
    // springRestCell: bend x centres, mod-zero with invertY rests at the
    // bottom, so home is the bottom-centre cell (4, 8).
    const home = screenToHw(4, 8);
    expect(sim.layer(home, 1).pha).toBe(255);
    sim.touchDown(0, 20, 20);
    sim.run(1);
    expect(sim.layer(home, 1).pha).toBe(0);
    const finger = screenToHw(Math.floor((20 * 9) / 128), Math.floor((20 * 9) / 128));
    expect(sim.layer(finger, 1).pha).toBe(255);
    sim.touchUp(0, 20, 20);
    sim.run(1);
    expect(sim.layer(finger, 1).pha).toBe(0);
    expect(sim.layer(home, 1).pha).toBe(255);
  });

  it("radar with the spring: one decaying pulse at centre, as compiled", () => {
    const s = presetState("radar");
    s.sends.spring = true;
    delete s.preset;
    const norm = normalisePadState(s);
    // Anti-drift: the rate and tick pair come out of the compiled Lua,
    // not out of a table both sides could misread the same way.
    const m = compile(norm).setupLua.match(
      /local a=glag\(0,40\)glpfs\(a,1,252,(\d+),0\)glt\(a,1,(\d+)\)/,
    );
    expect(m).not.toBeNull();
    const sim = new PadSim(norm);
    sim.touchDown(0, 64, 64);
    sim.run(1);
    sim.touchUp(0, 64, 64);
    sim.run(1);
    const L = sim.layer(screenToHw(4, 4), 1);
    // One tick has already run: the phase advanced once by the rate and
    // the timeout burned one tick.
    expect(L.fre).toBe(Number(m[1]));
    expect(L.pha).toBe((252 + Number(m[1])) & 255);
    expect(L.timeout).toBe(Number(m[2]) - 1);
  });

  it("nine pads latch: press toggles, lift does nothing, nothing expires", () => {
    const s = presetState("ninepads");
    s.sends.toggle = true;
    delete s.preset;
    const { log, sim } = driven(normalisePadState(s), (sim) => {
      sim.touchDown(0, 20, 20);
      sim.run(1);
    });
    expect(log).toEqual([{ ch: 0, cmd: 144, p1: 36, p2: 100, mode: 0 }]);
    const cell = screenToHw(1, 1);
    expect(sim.layer(cell, 2).pha).toBe(255);
    sim.touchUp(0, 20, 20);
    sim.run(1);
    expect(log).toHaveLength(1);
    // Four seconds of ticks: the momentary card's watchdog would have
    // sent the note-off long ago. The latch must not.
    sim.run(400);
    expect(log).toHaveLength(1);
    expect(sim.layer(cell, 2).pha).toBe(255);
    sim.touchDown(1, 20, 20);
    sim.run(1);
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: 36, p2: 0, mode: 0 });
    expect(sim.layer(cell, 2).pha).toBe(0);
  });

  it("nine pads major: the wire plays the same table the Lua bakes", () => {
    const s = presetState("ninepads");
    s.sends.scale = "major";
    delete s.preset;
    const norm = normalisePadState(s);
    const m = compile(norm).setupLua.match(/self\.m=\{([0-9,]+)\}/);
    expect(m).not.toBeNull();
    const table = m[1].split(",").map(Number);
    expect(table).toEqual([36, 38, 40, 41, 43, 45, 47, 48, 50]);
    const { log } = driven(norm, (sim) => {
      sim.touchDown(0, 10, 10);
      sim.run(1);
      sim.touchMove(0, 60, 10);
      sim.run(1);
    });
    // Slide from zone 0 to zone 1: legato straight through the table.
    expect(log[0]).toEqual({ ch: 0, cmd: 144, p1: table[0], p2: 100, mode: 0 });
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: table[0], p2: 0, mode: 0 });
    expect(log[2]).toEqual({ ch: 0, cmd: 144, p1: table[1], p2: 100, mode: 0 });
  });

  it("fine-resolution bend splits exactly like the emitted Lua", () => {
    const s = defaultState();
    s.look.kind = "none";
    s.enabled.look = false;
    s.touch.kind = "none";
    s.enabled.touch = false;
    s.sends.kind = "xy";
    s.sends.bend = "x";
    s.sends.axes = "x";
    s.sends.hiRes = true;
    const { log, sim } = driven(normalisePadState(s), () => {});
    expect(sim.coordMax).toBe(1023);
    sim.touchDown(0, 1000, 100);
    sim.run(1);
    const b = Math.floor((1000 * 16383) / 1023);
    expect(log[0]).toEqual({
      ch: 0,
      cmd: 224,
      p1: b % 128,
      p2: Math.floor(b / 128),
      mode: 0,
    });
  });
});

describe("fast taps, dots and scaled wires", () => {
  it("joystick: a fast tap cannot leave the home cell dark", () => {
    const sim = new PadSim(presetState("joystick"));
    const home = screenToHw(4, 8);
    expect(sim.layer(home, 1).pha).toBe(255);
    sim.touchTap(0, 60, 60);
    sim.run(2);
    expect(sim.layer(home, 1).pha).toBe(255);
  });

  it("joystick: the two-finger survivor re-parks on its own lift", () => {
    const sim = new PadSim(presetState("joystick"));
    const home = screenToHw(4, 8);
    sim.touchDown(0, 30, 30);
    sim.run(1);
    sim.touchDown(1, 90, 90);
    sim.run(1);
    sim.touchUp(0, 30, 30);
    sim.run(1);
    // The survivor's glow paint douses the freshly parked dot...
    sim.touchMove(1, 80, 80);
    sim.run(1);
    expect(sim.layer(home, 1).pha).toBe(0);
    // ...and its own lift restores it, because the park block sits
    // outside the first-finger gate.
    sim.touchUp(1, 80, 80);
    sim.run(1);
    expect(sim.layer(home, 1).pha).toBe(255);
  });

  it("latch: a fast tap latches on a first-finger card", () => {
    const s = presetState("ninepads");
    s.sends.toggle = true;
    s.sends.fingers = "first";
    delete s.preset;
    const log = [];
    const sim = new PadSim(normalisePadState(s), {
      onMidi: (m) => log.push(m),
    });
    sim.touchTap(0, 20, 20);
    sim.run(1);
    expect(log).toEqual([{ ch: 0, cmd: 144, p1: 36, p2: 100, mode: 0 }]);
  });

  it("latch plus scale: the latched wire plays the baked table", () => {
    const s = presetState("ninepads");
    s.sends.toggle = true;
    s.sends.scale = "pentatonic";
    delete s.preset;
    const norm = normalisePadState(s);
    const table = compile(norm)
      .setupLua.match(/self\.m=\{([0-9,]+)\}/)[1]
      .split(",")
      .map(Number);
    const log = [];
    const sim = new PadSim(norm, { onMidi: (m) => log.push(m) });
    sim.touchDown(0, 60, 60);
    sim.run(1);
    sim.touchUp(0, 60, 60);
    sim.run(1);
    expect(log).toEqual([
      { ch: 0, cmd: 144, p1: table[4], p2: 100, mode: 0 },
    ]);
    sim.touchDown(1, 60, 60);
    sim.run(1);
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: table[4], p2: 0, mode: 0 });
  });

  it("watchdog plus scale: the stale note-off plays the table too", () => {
    const s = presetState("ninepads");
    s.sends.scale = "major";
    delete s.preset;
    const norm = normalisePadState(s);
    const table = compile(norm)
      .setupLua.match(/self\.m=\{([0-9,]+)\}/)[1]
      .split(",")
      .map(Number);
    const log = [];
    const sim = new PadSim(norm, { onMidi: (m) => log.push(m) });
    sim.touchDown(0, 60, 60);
    sim.run(1);
    expect(log[0].p1).toBe(table[4]);
    // A motionless finger emits nothing; two seconds of watchdog fires
    // expire the contact, and the note-off must land on the same table
    // pitch the note-on used.
    sim.run(250);
    expect(log[1]).toEqual({ ch: 0, cmd: 128, p1: table[4], p2: 0, mode: 0 });
  });

  it("the 4x4 card draws dots and moves the held dot one write at a time", () => {
    const s = presetState("ninepads");
    s.sends.grid = "4x4";
    delete s.preset;
    const sim = new PadSim(normalisePadState(s));
    expect(sim.layer(screenToHw(1, 1), 1).pha).toBe(255);
    expect(sim.layer(screenToHw(0, 0), 1).pha).toBe(0);
    expect(sim.layer(screenToHw(8, 8), 1).pha).toBe(0);
    sim.touchDown(0, 10, 10);
    sim.run(1);
    expect(sim.layer(screenToHw(1, 1), 2).pha).toBe(255);
    sim.touchMove(0, 40, 10);
    sim.run(1);
    expect(sim.layer(screenToHw(1, 1), 2).pha).toBe(0);
    expect(sim.layer(screenToHw(3, 1), 2).pha).toBe(255);
  });

  it("the 4x4 latch dot stays lit until the next press", () => {
    const s = presetState("ninepads");
    s.sends.grid = "4x4";
    s.sends.toggle = true;
    delete s.preset;
    const sim = new PadSim(normalisePadState(s));
    sim.touchTap(0, 10, 10);
    sim.run(1);
    expect(sim.layer(screenToHw(1, 1), 2).pha).toBe(255);
    sim.run(300);
    expect(sim.layer(screenToHw(1, 1), 2).pha).toBe(255);
    sim.touchTap(1, 10, 10);
    sim.run(1);
    expect(sim.layer(screenToHw(1, 1), 2).pha).toBe(0);
  });
});
