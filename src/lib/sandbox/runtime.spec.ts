// The runtime's seven tests (13-15), the first five in a REAL Lua VM: every string in runtime.ts
// was run through `createLuaHost` before it was measured and before a figure was pinned. The host
// is opened as lua-smoke.spec.ts opens it for a hand-authored entry (`system: TOUCH_LIBRARY`,
// `systemTimer: TOUCH_LIBRARY_TIMER`, the emitted Setup, the emitted Timer), with two one-line
// stand-ins in front of the Setup for what the host does not model and a module does: the touch
// element's own `tim` (probe 1, `self:tim()`) and the system element's `map` (probe 2,
// `ele[#ele]:map()` under three slots). The emitted strings go in verbatim.
//
// SEVEN TESTS, AND THE COUNT NEVER MOVES. Every coordinate is an LED centre from calibration.ts's
// measured knots (`KX[c]`, `KY[r]`), so `N(x,y)` lands on the cell by construction.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { PadSim } from "../../vendor/botor/pad-sim";
import { KX, KY, sensorAt } from "../catalog/calibration";
import {
  LIBRARY_CONVENTIONS,
  LIBRARY_GLOBALS,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
} from "../catalog/library";
import {
  AND,
  EQ,
  F,
  GT,
  OR,
  V,
  branchOf as branchTextOf,
  endedEscapes,
  isEndedOpener,
  isOnsetChain,
  scan,
  startedAdmits,
} from "../catalog/touch-guard";
import { padReady } from "../pad/ready";
import { createLuaHost, type HostMidi, type LuaHost } from "../sim/lua-host";
import { blankPadState } from "../sim/lua-pad-sim";
import { EVENT_BUDGET, canonical, measureSurface } from "./cost";
import {
  MARKER,
  capitalCalls,
  capitalDefinitions,
  emitSurface,
  geometryOf,
  regionRow,
  type EmitOptions,
} from "./emit";
import { GEOMETRY_COPY, validate } from "./geometry";
import {
  BRANCHES,
  CELL_RAW,
  JITTER_DIAGONAL_RAW,
  JITTER_RAW,
  KNOB_DEAD_ZONE_RAW,
  KNOB_DEAD_ZONE_SQUARED,
  KNOB_MINIMUM_CELLS,
  KNOB_STEPS_PER_TURN,
  KNOB_STEP_DEG,
  branchesUsed,
  knobRingRaw,
  type Branch,
  type Region,
  type Surface,
} from "./model";
import {
  ARM,
  BRANCH_TEXT,
  ENTRY,
  RELEASE,
  RUNTIME_CALLS,
  RUNTIME_NAMES,
  STATE,
  joinLua,
  packRuntime,
  runtimeParts,
  sweepCall,
} from "./runtime";

// ---------------------------------------------------------------------------
// The fixtures. Names are fixture data, not copy. Channel 1 (wire 0) so a
// MIDI record reads as the region's controller and its value.

function region(
  name: string,
  kind: Region["kind"],
  col: number,
  row: number,
  w: number,
  h: number,
  cc: number,
  extra: Partial<Region> = {},
): Region {
  return {
    id: name.toLowerCase(),
    name,
    kind,
    col,
    row,
    w,
    h,
    cc,
    channel: 1,
    colour: [15, 15, 15],
    ...extra,
  };
}

const surface = (name: string, regions: readonly Region[]): Surface => ({
  id: name.toLowerCase(),
  name,
  regions,
});

/** The PDF's page 3: a 2 x 6 Fader, a 3 x 3 XY pad, a 3 x 3 Knob and a 2 x 2 Button. */
const FILTER = region("Filter", "fader", 0, 0, 2, 6, 20);
const SPACE = region("Space", "xy", 3, 0, 3, 3, 21, { cc2: 22 });
const TURN = region("Turn", "knob", 3, 4, 3, 3, 23);
const GO = region("Go", "button", 7, 0, 2, 2, 30);
const PAGE3 = surface("Page 3", [FILTER, SPACE, TURN, GO]);

/** A fader that does not touch the pad's edge: rows 2..5. */
const CUT = region("Cut", "fader", 6, 2, 2, 4, 24);

/** The LED centre of a cell, in raw units, from the measured knots. */
const at = (col: number, row: number): [number, number] => [KX[col], KY[row]];

/** The values sent on one controller, in order. */
const sent = (midi: readonly HostMidi[], cc: number): number[] =>
  midi.filter((m) => m.cmd === 176 && m.p1 === cc).map((m) => m.p2);

/**
 * The two stand-ins (the header): the touch element's `tim`, which is the
 * host's compiled Timer wrapper, and the system element's `map` under three
 * slots, which is the emitted 255/4 body as a method of `ele[#ele]`.
 */
function standIns(mapmode: string | undefined): string {
  const tim = "self.tim=__hangar_timer ";
  return mapmode === undefined
    ? tim
    : `${tim}ele={{map=function(s)${mapmode} end}}`;
}

async function open(
  s: Surface,
  options: EmitOptions = { slots: 3 },
): Promise<{ host: LuaHost; sim: PadSim }> {
  const emitted = emitSurface(s, options);
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
    setup: standIns(emitted.mapmode) + emitted.setup,
    timer: emitted.timer,
  });
  return { host, sim };
}

/** A press, a move or a lift followed by one tick, so the sample is dispatched. */
function step(
  host: LuaHost,
  what: "down" | "move" | "up",
  id: number,
  [x, y]: readonly [number, number],
): void {
  if (what === "down") host.touchDown(id, x, y);
  else if (what === "move") host.touchMove(id, x, y);
  else host.touchUp(id, x, y);
  host.tick();
}

describe("the Sandbox runtime, run in a VM, then measured, then pinned (BUILD-01, BUILD-03, BUILD-04, CONT-02, PREV-02)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("1. a contact keeps the region it landed in: dragged off the fader's edge into the XY pad, the fader still receives and the pad receives nothing until a lift", async () => {
    const { host } = await open(PAGE3);
    try {
      // Press inside Filter at LED (1,1); the value is read on U: LED row 1
      // is 64 of a 320 span from the bottom LED at 320.
      step(host, "down", 0, at(1, 1));
      expect(sent(host.midi, FILTER.cc)).toEqual([101]);
      // Drag into Space's cells - (3,2) is the XY pad's by the map - and on:
      // Filter keeps receiving, Space receives nothing.
      step(host, "move", 0, at(3, 2));
      step(host, "move", 0, at(4, 0));
      expect(sent(host.midi, FILTER.cc), "the fader kept the contact").toEqual([
        101, 76, 127,
      ]);
      expect(
        sent(host.midi, SPACE.cc),
        "the XY pad got a value it should not",
      ).toEqual([]);
      expect(sent(host.midi, SPACE.cc2 ?? -1)).toEqual([]);
      step(host, "up", 0, at(4, 0));
      // Now a press INSIDE Space responds: both axes on the first sample.
      step(host, "down", 0, at(4, 1));
      expect(sent(host.midi, SPACE.cc)).toEqual([63]);
      expect(sent(host.midi, SPACE.cc2 ?? -1)).toEqual([63]);
      expect(sent(host.midi, FILTER.cc), "the fader is done").toEqual([
        101, 76, 127,
      ]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("2. a Button's note-off fires on every release path, the same-id re-press first: a re-press, an end code, another contact on the same region, and the Timer sweep", async () => {
    const report: string[] = [];
    // (1) SAME ID, NO LIFT - driven first because firmware assigns the lowest
    //     free contact id, so after a lost lift the next press is normally
    //     the same id (library.ts section 7). The onset expires the same id
    //     through E and R before it pins the region again: 0 then 127.
    {
      const { host } = await open(PAGE3);
      try {
        step(host, "down", 0, at(7, 0));
        expect(
          sent(host.midi, GO.cc),
          "a fresh press sends one 127 and no 0 before it: R is idempotent",
        ).toEqual([127]);
        step(host, "down", 0, at(8, 1));
        report.push(
          `  same id, no lift:   ${JSON.stringify(sent(host.midi, GO.cc))}`,
        );
        expect(sent(host.midi, GO.cc), "the note-off on the re-press").toEqual([
          127, 0, 127,
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (2) AN END CODE.
    {
      const { host } = await open(PAGE3);
      try {
        step(host, "down", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        report.push(
          `  end code:           ${JSON.stringify(sent(host.midi, GO.cc))}`,
        );
        expect(sent(host.midi, GO.cc)).toEqual([127, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (3) ANOTHER CONTACT ON THE REGION THE GHOST HOLDS: the onset scan over
    //     S finds contact 0 on Go and releases it before contact 1 presses.
    {
      const { host } = await open(PAGE3);
      try {
        step(host, "down", 0, at(7, 0));
        step(host, "down", 1, at(8, 1));
        report.push(
          `  cross contact:      ${JSON.stringify(sent(host.midi, GO.cc))}`,
        );
        expect(sent(host.midi, GO.cc)).toEqual([127, 0, 127]);
        step(host, "up", 1, at(8, 1));
        expect(sent(host.midi, GO.cc), "contact 1's own lift").toEqual([
          127, 0, 127, 0,
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (4) THE TIMER SWEEP: the Timer runs every 100 ms (`gtt(0,100)`, armed
    //     by the Setup's own `self:tim()`) and X(self,20) expires a contact
    //     twenty calls after its last sample - two seconds, CHORUS's window.
    {
      const { host } = await open(PAGE3);
      try {
        expect(host.timerArmed, "the Setup's self:tim() armed the Timer").toBe(
          true,
        );
        step(host, "down", 0, at(7, 0));
        host.run(190);
        expect(sent(host.midi, GO.cc), "released inside the window").toEqual([
          127,
        ]);
        host.run(40);
        report.push(
          `  timer sweep:        ${JSON.stringify(sent(host.midi, GO.cc))} inside 230 ticks`,
        );
        expect(sent(host.midi, GO.cc), "the lost lift's note-off").toEqual([
          127, 0,
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // A LATCHING button toggles on each press and its R sends nothing.
    {
      const { host } = await open(surface("Latch", [{ ...GO, latch: true }]), {
        slots: 2,
      });
      try {
        step(host, "down", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        step(host, "down", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        report.push(
          `  latching:           ${JSON.stringify(sent(host.midi, GO.cc))}`,
        );
        expect(sent(host.midi, GO.cc)).toEqual([127, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    process.stdout.write(
      "\nTHE SANDBOX RUNTIME, four release paths on a Button (plan 13-15):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  it("3. a vertical fader reads 127 at its top LED and 0 at its bottom LED on the precomputed calibrated bounds, sends on change only, and clamps beyond its end LEDs", async () => {
    // The row's geometry is the BOTTOM LED's U and the LED span (emit.ts
    // section 2): Filter's rows 0..5 give 320 and 320; Cut's rows 2..5 give
    // 320 and 192. Neither is the raw span 13-14 carried.
    expect(geometryOf(FILTER)).toEqual([0, 0, 320, 320]);
    expect(geometryOf(CUT)).toEqual([0, 0, 320, 192]);
    expect(regionRow(FILTER).slice(0, 5)).toEqual([0, 0, 320, 320, 1]);
    const { host } = await open(surface("Two", [FILTER, CUT]), { slots: 2 });
    try {
      // Filter: the top LED, the bottom LED, a middle one.
      step(host, "down", 0, at(0, 0));
      step(host, "move", 0, at(0, 5));
      step(host, "move", 0, at(0, 2));
      expect(sent(host.midi, FILTER.cc)).toEqual([127, 0, 76]);
      // A still finger: the same sample never reaches the VM (the firmware's
      // change gate), and a wobble on the axis the fader does not read sends
      // nothing either.
      step(host, "move", 0, at(0, 2));
      step(host, "move", 0, [KX[0] + 1, KY[2]]);
      step(host, "move", 0, [KX[0], KY[2]]);
      expect(sent(host.midi, FILTER.cc), "a still finger sends").toEqual([
        127, 0, 76,
      ]);
      // Beyond the bottom LED (between rows 5 and 6): clamped to 0.
      step(host, "move", 0, [KX[0], KY[5] + 6]);
      expect(sent(host.midi, FILTER.cc)).toEqual([127, 0, 76, 0]);
      step(host, "up", 0, [KX[0], KY[5] + 6]);
      // Cut, away from the edge: 127 at LED row 2 and 0 at LED row 5 EXACTLY -
      // the raw span would have given 115 and 11 (13-15-SUMMARY.md).
      step(host, "down", 0, at(6, 2));
      step(host, "move", 0, at(6, 5));
      step(host, "move", 0, at(6, 3));
      expect(sent(host.midi, CUT.cc)).toEqual([127, 0, 84]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("4. the XY pad sends one CC per moved axis, scaled to the region's bounds", async () => {
    expect(geometryOf(SPACE)).toEqual([192, 128, 128, 128]);
    const { host } = await open(PAGE3);
    try {
      const both = () => [
        sent(host.midi, SPACE.cc),
        sent(host.midi, SPACE.cc2 ?? -1),
      ];
      step(host, "down", 0, at(3, 2)); // the bottom-left LED: 0, 0 on both
      expect(both()).toEqual([[0], [0]]);
      step(host, "move", 0, at(4, 2)); // x only
      expect(both(), "one CC for one moved axis").toEqual([[0, 63], [0]]);
      step(host, "move", 0, at(4, 1)); // y only
      expect(both()).toEqual([
        [0, 63],
        [0, 63],
      ]);
      step(host, "move", 0, at(5, 0)); // both
      expect(both()).toEqual([
        [0, 63, 127],
        [0, 63, 127],
      ]);
      // One raw unit past the right LED: clamped to the same 127, no send.
      step(host, "move", 0, [KX[5] + 1, KY[0]]);
      expect(both()).toEqual([
        [0, 63, 127],
        [0, 63, 127],
      ]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("5. the Knob is a real rotary: a clockwise turn accumulates through the wrap with no negative step, counter-clockwise decrements, both ends clamp, the dead zone changes nothing, and a 2 x 2 is refused with the derived reason", async () => {
    // Turn's centre is LED (4,5) through the forward map - raw (64, 83) -
    // and its ring's LED centres are 18, 21, 15 and 14 raw units out.
    const [cx, cy] = geometryOf(TURN);
    expect([cx, cy]).toEqual([
      Math.round(sensorAt(4, "x")),
      Math.round(sensorAt(5, "y")),
    ]);
    expect(
      regionRow(TURN).length,
      "a knob row carries its value and remainder",
    ).toBe(13);
    const radius = 16;
    const point = (deg: number): [number, number] => [
      Math.round(cx + radius * Math.cos((deg * Math.PI) / 180)),
      Math.round(cy + radius * Math.sin((deg * Math.PI) / 180)),
    ];
    const { host } = await open(PAGE3);
    try {
      // One clockwise turn from 6 o'clock, THROUGH the atan discontinuity at
      // 180 degrees a quarter turn in, in 4-degree samples: the value climbs
      // 1..45 with every step +1 and never a step back.
      const START = 90;
      step(host, "down", 0, point(START));
      for (let d = START + 4; d <= START + 360; d += 4)
        step(host, "move", 0, point(d));
      const cw = sent(host.midi, TURN.cc);
      // The wrap first: without it the step across 180 degrees is about
      // -357, which the clamp turns into a fall from 11 to 0 - the negative
      // step is named here. (A turn that starts ON the discontinuity hides
      // it: the value is still 0 when the wrap hits, and 0 to 0 sends
      // nothing - the negative check found that and moved the start.)
      const steps = cw.map((v, i) => v - (i === 0 ? 0 : cw[i - 1]));
      expect(
        Math.min(...steps),
        `a negative step through the wrap: ${JSON.stringify(cw)}`,
      ).toBeGreaterThanOrEqual(1);
      expect(cw.length, "a full turn is 45 steps").toBe(KNOB_STEPS_PER_TURN);
      expect(cw, "monotone, +1 a step, through the wrap").toEqual(
        Array.from({ length: KNOB_STEPS_PER_TURN }, (_, i) => i + 1),
      );
      // Counter-clockwise, back down through the same wrap.
      for (let d = START + 356; d >= START; d -= 4)
        step(host, "move", 0, point(d));
      const ccw = sent(host.midi, TURN.cc).slice(cw.length);
      expect(ccw, "counter-clockwise decrements").toEqual(
        Array.from({ length: KNOB_STEPS_PER_TURN }, (_, i) => 44 - i),
      );
      expect(ccw[ccw.length - 1]).toBe(0);
      // The top clamp: three more clockwise turns reach 127 and stop there;
      // the value is sent once at 127 and never again.
      for (let d = START + 4; d <= START + 3 * 360; d += 4)
        step(host, "move", 0, point(d));
      const all = sent(host.midi, TURN.cc);
      expect(Math.max(...all)).toBe(127);
      expect(all.filter((v) => v === 127).length, "sent once at the top").toBe(
        1,
      );
      expect(all[all.length - 1]).toBe(127);
      // The bottom clamp, from 127 down: four turns reach 0 and stop.
      for (let d = START + 3 * 360; d >= START - 360; d -= 4)
        step(host, "move", 0, point(d));
      const down = sent(host.midi, TURN.cc);
      expect(down[down.length - 1]).toBe(0);
      expect(
        down.filter((v) => v === 0).length,
        "sent once at the bottom, twice in the run",
      ).toBe(2);
      step(host, "up", 0, point(START - 360));
      // THE DEAD ZONE: a finger inside rho0 of the centre changes nothing -
      // a press, a wobble and a half circle at radius 8 send nothing.
      const before = sent(host.midi, TURN.cc).length;
      const inner = (deg: number): [number, number] => [
        Math.round(cx + 8 * Math.cos((deg * Math.PI) / 180)),
        Math.round(cy + 8 * Math.sin((deg * Math.PI) / 180)),
      ];
      expect(8 * 8, "radius 8 is inside the dead zone").toBeLessThan(
        KNOB_DEAD_ZONE_SQUARED,
      );
      step(host, "down", 0, [cx, cy]);
      step(host, "move", 0, [cx + 1, cy]);
      step(host, "move", 0, [cx + 1, cy + 1]);
      for (let d = 0; d <= 180; d += 10) step(host, "move", 0, inner(d));
      expect(sent(host.midi, TURN.cc).length, "the dead zone sent").toBe(
        before,
      );
      // And leaving it on the far side is a fresh start, not a half-turn jump:
      // from the centre out to 9 o'clock at radius 16, then two 8-degree
      // steps clockwise. The previous ANGLE was forgotten in the dead zone,
      // so the first step out sends nothing; the region's sub-step REMAINDER
      // is kept (it is the knob's, not the contact's - the VM showed it
      // sitting anywhere in (-8, 0] after the clamped descent, disagreement
      // 2 in 13-15-SUMMARY.md), so sixteen degrees give one step or two,
      // never a jump.
      step(host, "move", 0, point(180));
      expect(
        sent(host.midi, TURN.cc).length,
        "leaving the dead zone jumped",
      ).toBe(before);
      step(host, "move", 0, point(188));
      step(host, "move", 0, point(196));
      const out = sent(host.midi, TURN.cc).slice(before);
      expect(
        out.length,
        "sixteen degrees out of the dead zone: one step or two",
      ).toBeGreaterThanOrEqual(1);
      expect(out.length).toBeLessThanOrEqual(2);
      expect(out, "no jump on the way out").toEqual(
        out.length === 1 ? [1] : [1, 2],
      );
      step(host, "up", 0, point(196));
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // The model refuses a 2 x 2 Knob with the derived reason, and admits 3 x 3.
    const small = validate({ ...TURN, w: 2, h: 2 }, surface("Empty", []));
    expect(small.ok, "a 2 x 2 Knob was admitted").toBe(false);
    if (!small.ok) {
      expect(small.problem.rule).toBe("too-small");
      expect(small.problem.message).toBe(
        GEOMETRY_COPY.tooSmall({ ...TURN, w: 2, h: 2 }, { w: 3, h: 3 }),
      );
      expect(small.problem.message, "the reason is the centre").toContain(
        "centre",
      );
    }
    expect(validate(TURN, surface("Empty", [])).ok).toBe(true);
    expect(KNOB_MINIMUM_CELLS).toBe(3);
    // The derivation, printed with every figure labelled (model.ts 4b).
    const ring3 = knobRingRaw(3);
    expect(ring3).toBeGreaterThanOrEqual(KNOB_DEAD_ZONE_RAW + JITTER_RAW);
    expect(knobRingRaw(2)).toBeLessThan(KNOB_DEAD_ZONE_RAW + JITTER_RAW);
    const placements: string[] = [];
    for (let c = 0; c <= 6; c += 1) {
      const centre = sensorAt(c + 1, "x");
      placements.push(
        `x ${c}..${c + 2}: ${Math.min(centre - KX[c], KX[c + 2] - centre)}`,
      );
    }
    for (let r = 0; r <= 6; r += 1) {
      const centre = sensorAt(r + 1, "y");
      placements.push(
        `y ${r}..${r + 2}: ${Math.min(centre - KY[r], KY[r + 2] - centre)}`,
      );
    }
    console.log(
      [
        "The Knob's arithmetic (resolution unless marked):",
        `  jitter per sample ${JITTER_RAW} raw unit on one axis (Probe A Q1); diagonal ${JITTER_DIAGONAL_RAW.toFixed(3)}`,
        `  step ${KNOB_STEP_DEG} degrees, ${KNOB_STEPS_PER_TURN} steps a turn, ${(128 / KNOB_STEPS_PER_TURN).toFixed(2)} turns 0..127`,
        `  dead zone radius ${KNOB_DEAD_ZONE_RAW.toFixed(2)} raw units = ${(KNOB_DEAD_ZONE_RAW / CELL_RAW).toFixed(2)} cells; the runtime's literal ${KNOB_DEAD_ZONE_SQUARED} = ceil(rho0^2)`,
        `  ring of a 3 x 3 at ${ring3.toFixed(1)} raw (${((3 - 1) / 2).toFixed(1)} cells), a 2 x 2 at ${knobRingRaw(2).toFixed(1)}, a 4 x 4 at ${knobRingRaw(4).toFixed(1)}`,
        `  the inequality (w-1)/2*${CELL_RAW.toFixed(2)} >= ${KNOB_DEAD_ZONE_RAW.toFixed(2)} + ${JITTER_RAW} gives w >= ${(1 + (2 * (KNOB_DEAD_ZONE_RAW + JITTER_RAW)) / CELL_RAW).toFixed(2)}, so ${KNOB_MINIMUM_CELLS}`,
        `  LED feedback, not resolution: a 3 x 3 ring is 8 lights, 4 x 4 is 12, one turn walks them all`,
        `  the nearest ring LED of every 3 x 3 placement under the MEASURED map, raw units from the centre:`,
        `    ${placements.join("; ")}`,
      ].join("\n"),
    );
  }, 60000);

  it("6. passes both class gates over every emitted runtime text with the gates' own needles, defines only its own names and calls only the library's", () => {
    const texts: { name: string; text: string }[] = [];
    const surfaces = [
      PAGE3,
      surface("Two", [FILTER, CUT]),
      surface("Latch", [{ ...GO, latch: true }]),
      surface("Wide", [{ ...FILTER, orientation: "horizontal", w: 6, h: 2 }]),
    ];
    for (const s of surfaces) {
      for (const slots of [2, 3] as const) {
        const e = emitSurface(s, { slots });
        texts.push({ name: `${s.name} Timer (${slots})`, text: e.timer });
        if (e.mapmode !== undefined)
          texts.push({ name: `${s.name} 255/4`, text: e.mapmode });
      }
    }
    let started = 0;
    const problems: string[] = [];
    for (const { name, text } of texts) {
      for (const chain of scan(text)) {
        chain.members.forEach((member, i) => {
          if (!isEndedOpener(member)) return;
          if (endedEscapes(chain, i)) return;
          problems.push(
            `${name}: an ended opener that admits 9: ${branchTextOf(text, chain)}`,
          );
        });
        if (!isOnsetChain(chain)) continue;
        started += 1;
        if (startedAdmits(chain)) continue;
        problems.push(
          F(
            '"this contact started" is written `',
            V,
            EQ,
            "4 ",
            OR,
            " ",
            V,
            GT,
            "8`; ",
          ) + `${name} writes \`${branchTextOf(text, chain)}\``,
        );
      }
      // The class-A gate (decay-idiom.spec.ts) reads `glpfs` pairs and is
      // blind to `D(` and `K(` (12.1-09); the runtime writes none of the
      // three - its finger is G's live block, cleared through E - so the
      // gate's silence is a fact, asserted with its needle.
      expect(text, `${name}: a decay appeared`).not.toContain(F("glp", "fs("));
      expect(text, `${name}: a decay appeared`).not.toContain(F("D", "("));
      expect(text, `${name}: a stamp appeared`).not.toContain(F("K", "("));
      expect(
        GridScript.checkSyntax(text),
        `${name}: the pinned checker refuses it`,
      ).toBe(true);
    }
    expect(problems.join("\n\n")).toBe("");
    // NON-VACUITY: every text that carries O carries exactly one onset chain.
    const withEntry = texts.filter(({ text }) => text.includes(ENTRY)).length;
    expect(withEntry, "no text carried the entry").toBeGreaterThan(0);
    expect(started, "one onset per entry").toBe(withEntry);
    // The blessed live test appears once per entry and nowhere else.
    const live = F(
      V,
      "~",
      "=1 ",
      AND,
      " ",
      V,
      "~",
      "=4 ",
      AND,
      " ",
      V,
      "<",
      "9",
    );
    for (const { name, text } of texts) {
      const n = text.split(live).length - 1;
      expect(n, `${name}: the live test`).toBe(text.includes(ENTRY) ? 1 : 0);
    }
    // The names: the runtime defines S F I R O and nothing the library owns;
    // it calls E G N U X and nothing the library does not export.
    const exported = new Set([...LIBRARY_GLOBALS, ...LIBRARY_CONVENTIONS]);
    const whole = joinLua([
      STATE,
      ...runtimeParts(BRANCHES).map((p) => p.lua),
      sweepCall(20),
    ]);
    const defined = capitalDefinitions(whole);
    expect(defined).toEqual([...RUNTIME_NAMES].sort());
    for (const d of defined) {
      expect(
        LIBRARY_GLOBALS.includes(d),
        `the runtime defines ${d}, which the library owns`,
      ).toBe(false);
    }
    // `R` is the one name it defines that the library calls; it is a
    // convention, not a global the library exports.
    expect(LIBRARY_CONVENTIONS).toEqual(["R"]);
    const called = capitalCalls(whole).filter(
      (c) => !RUNTIME_NAMES.includes(c),
    );
    expect(called).toEqual([...RUNTIME_CALLS].sort());
    for (const c of called) {
      expect(
        exported.has(c),
        `the runtime calls ${c}, which the library does not export`,
      ).toBe(true);
    }
    // Q and W are not on the hot path: a contact keeps the region it landed in.
    expect(whole).not.toContain(F("Q", "("));
    expect(whole).not.toContain(F("W", "("));
  });

  it("7. the measured cost: canonical under compressScript, beside the research's 861 and D-08's 150-200, with the ceiling in kinds under two slots and three", async () => {
    const lines: string[] = [];
    // Every packed text is a fixed point of the minifier on the first round.
    for (const s of [PAGE3, surface("Two", [FILTER, CUT])]) {
      for (const slots of [2, 3] as const) {
        const e = emitSurface(s, { slots });
        for (const [name, text] of [
          ["Timer", e.timer],
          ["255/4", e.mapmode ?? ""],
        ] as const) {
          if (text === "") continue;
          const c = await canonical(text);
          expect(
            c.rounds,
            `${s.name} ${name} (${slots}) is not canonical`,
          ).toBe(0);
          expect(c.text).toBe(text);
        }
      }
    }
    // The runtime alone, every branch, beside the research's 861 (four
    // branches, no Knob, never run) and 13-02's re-sketch (1,042 with the
    // rotary, 738 without - unrun).
    const five = await canonical(
      joinLua([STATE, ...runtimeParts(BRANCHES).map((p) => p.lua)]),
    );
    const four = await canonical(
      joinLua([
        STATE,
        ...runtimeParts(BRANCHES.filter((b) => b !== "knob")).map((p) => p.lua),
      ]),
    );
    const knobShare = five.cost - four.cost;
    lines.push(
      `the runtime alone: ${five.cost} with every branch, ${four.cost} without the Knob ` +
        `(the research's 861 for four branches, ${four.cost - 861 >= 0 ? "+" : ""}${four.cost - 861}; ` +
        `13-02's re-sketch 1,042 / 738)`,
    );
    lines.push(
      `the rotary's share: ${knobShare} (D-08's estimate 150-200: ` +
        `${knobShare > 200 ? `${knobShare - 200} above the top` : knobShare < 150 ? `${150 - knobShare} below the bottom` : "inside"}; ` +
        `13-02's re-sketch 304)`,
    );
    // The parts.
    const partCosts: string[] = [];
    for (const part of [
      { name: "head", lua: STATE },
      { name: "R", lua: RELEASE },
      { name: "O", lua: ENTRY },
      ...BRANCHES.map((b) => ({ name: b, lua: BRANCH_TEXT[b] })),
    ]) {
      partCosts.push(`${part.name} ${part.lua.length}`);
    }
    lines.push(
      `the parts: marker ${MARKER.length}, arm ${ARM.length}, ${partCosts.join(", ")}, sweep ${sweepCall(20).length}`,
    );
    // THE CEILING IN KINDS. Every combination of branches on two slots and on
    // three, measured through the packer; fits / over recorded.
    const combos: Branch[][] = [];
    for (let mask = 1; mask < 1 << BRANCHES.length; mask += 1) {
      combos.push(BRANCHES.filter((_, i) => mask & (1 << i)));
    }
    const fitsTwo: string[] = [];
    const overTwo: string[] = [];
    const overThree: string[] = [];
    let twoWorst = { name: "", used: 0 };
    let threeWorst = { name: "", used: 0 };
    for (const branches of combos) {
      const label = branches
        .map(
          (b) =>
            ({
              "fader-v": "v",
              "fader-h": "h",
              button: "b",
              xy: "x",
              knob: "k",
            })[b],
        )
        .join("");
      const two = packRuntime(branches, { slots: 2 });
      const twoCost = (await canonical(two.timer)).cost;
      (twoCost <= EVENT_BUDGET ? fitsTwo : overTwo).push(`${label} ${twoCost}`);
      if (twoCost > twoWorst.used) twoWorst = { name: label, used: twoCost };
      const three = packRuntime(branches, { slots: 3 });
      const timer = (await canonical(three.timer)).cost;
      const mapmode = (await canonical(three.mapmode ?? "")).cost;
      expect(three.mapmode, `${label}: three slots emit 255/4`).toBeDefined();
      const total = timer + mapmode;
      if (timer > EVENT_BUDGET || mapmode > EVENT_BUDGET)
        overThree.push(`${label} ${timer}+${mapmode}`);
      if (total > threeWorst.used) threeWorst = { name: label, used: total };
    }
    lines.push(
      `two slots, fits (Timer of ${EVENT_BUDGET}): ${fitsTwo.join(", ")}`,
    );
    lines.push(`two slots, over: ${overTwo.join(", ")}`);
    lines.push(
      `three slots, over: ${overThree.length === 0 ? "none - every combination fits" : overThree.join(", ")}`,
    );
    // The PDF's own page 3 under both, with the free characters beside the
    // sweep and the arm.
    const p2 = await measureSurface(PAGE3, { slots: 2 });
    const p3 = await measureSurface(PAGE3, { slots: 3 });
    lines.push(
      `the PDF's page 3 (v x b k): two slots Timer ${p2.timer.used} (${p2.fits ? "fits" : `over by ${-p2.timer.free}`}); ` +
        `three slots Timer ${p3.timer.used} (${p3.timer.free} free beside gtt(0,100) and X(self,20)) + 255/4 ${p3.mapmode?.used} (${p3.mapmode?.free} free), ` +
        `${p3.fits ? "fits" : "over"}; placement ${p3.emitted.runtime?.placement.map((p) => `${p.name}:${p.slot}`).join(" ")}`,
    );
    const smallest = await measureSurface(surface("One", [FILTER]), {
      slots: 2,
    });
    lines.push(
      `one vertical fader, two slots: Timer ${smallest.timer.used}, ${smallest.timer.free} free`,
    );
    console.log(["The runtime, measured (plan 13-15):", ...lines].join("\n"));

    // PINNED, this tree, 2026-09-12. A minifier bump or an edit that moves one
    // moves the assertion, which is the point.
    expect(five.cost).toBe(1340);
    expect(four.cost).toBe(1042);
    expect(knobShare).toBe(298);
    expect(smallest.timer.used).toBe(593);
    expect([p3.timer.used, p3.mapmode?.used]).toEqual([574, 706]);
    expect(p2.timer.used).toBe(1248);
    expect(p3.fits, "the PDF's page 3 fits on three slots").toBe(true);
    expect(
      p2.fits,
      "the PDF's page 3 does not fit on two slots (13-02 said the same)",
    ).toBe(false);
    expect(overThree, "three slots carry every combination").toEqual([]);
    expect(twoWorst.name).toBe("vhbxk");
    expect(threeWorst.used).toBeLessThanOrEqual(2 * EVENT_BUDGET);
    // The two-slot ceiling, stated: a Knob with one fader orientation or with
    // buttons; faders with buttons, or one orientation with the XY pad; the
    // XY pad with buttons. Nothing wider.
    const fitLabels = fitsTwo.map((f) => f.split(" ")[0]);
    for (const label of [
      "v",
      "h",
      "b",
      "x",
      "k",
      "vh",
      "vb",
      "hb",
      "vx",
      "hx",
      "bx",
      "vk",
      "hk",
      "bk",
      "vhb",
    ]) {
      expect(fitLabels, `${label} fits on two slots`).toContain(label);
    }
    for (const label of [
      "xk",
      "vhx",
      "vbx",
      "hbx",
      "vhk",
      "vbk",
      "vhbx",
      "vhbxk",
    ]) {
      expect(fitLabels, `${label} does not fit on two slots`).not.toContain(
        label,
      );
    }
    expect(branchesUsed(PAGE3.regions)).toEqual([
      "fader-v",
      "button",
      "xy",
      "knob",
    ]);
  }, 120000);
});
