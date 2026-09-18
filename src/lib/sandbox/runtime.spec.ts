// The runtime's tests (13-15; change 10B added seven), most in a REAL Lua VM: every string in
// runtime.ts was run through `createLuaHost` before it was measured and before a figure was
// pinned. The host is opened as the module runs a landing: under five slots the TRIMMED system
// halves with the runtime parts they carry (`system`, `systemTimer` off the emit), under fewer
// the full library; the emitted Setup with two one-line stand-ins in front of it for what the
// host does not model and a module does - the touch element's own `tim` (probe 1, `self:tim()`)
// and the system element's `map` (probe 2, `ele[#ele]:map()`). The emitted strings go in verbatim.
//
// Every coordinate is an LED centre from calibration.ts's measured knots (`KX[c]`, `KY[r]`), so
// `N(x,y)` lands on the cell by construction; a picture is read off layer 2's phase per cell.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { PadSim, screenToHw } from "../../vendor/botor/pad-sim";
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
  knobCentre,
  regionRow,
  regionTail,
  type EmitOptions,
} from "./emit";
import { GEOMETRY_COPY, validate } from "./geometry";
import {
  TRIMMED_GLOBALS,
  TRIMMED_LIBRARY,
  TRIMMED_LIBRARY_TIMER,
  TRIM_FREED_NAMES,
  TRIM_FREES,
} from "./library-trim";
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
  flagsOf,
  knobRingRaw,
  scaleValue,
  springPosition,
  type Branch,
  type Region,
  type Surface,
} from "./model";
import {
  ARM,
  ENTRY,
  KNOB_STEP_CAP,
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

/** A 4 x 2 horizontal fader along the bottom. */
const WIDE = region("Wide", "fader", 0, 7, 4, 2, 25, {
  orientation: "horizontal",
});

/** Three 1 x 1 buttons in radio group 1 along row 7. */
const RADIO = [
  region("One", "button", 5, 7, 1, 1, 41, { group: 1, latch: true }),
  region("Two", "button", 6, 7, 1, 1, 42, { group: 1, latch: true }),
  region("Three", "button", 7, 7, 1, 1, 43, { group: 1 }),
];

/** The change 10B fixtures, by feature (test 14 runs every one of them). */
const SCALED = surface("Scaled", [
  { ...FILTER, min: 20, max: 80 },
  { ...WIDE, min: 100, max: 50 },
  { ...SPACE, min: 10, max: 20 },
  { ...TURN, min: 64, max: 127 },
  { ...GO, min: 5, max: 100 },
]);
const RELATIVE_HALF = surface("Relative half", [
  { ...FILTER, mode: "relative" },
  { ...SPACE, mode: "relative" },
]);
const RELATIVE_FULL = surface("Relative full", [
  { ...FILTER, mode: "relative", speed: "full" },
  { ...SPACE, mode: "relative", speed: "full" },
]);
const SPRING = surface("Spring", [
  { ...FILTER, spring: true },
  { ...CUT, spring: true, springValue: 100, mode: "relative" },
]);
const NOTES = surface("Notes", [
  { ...GO, output: "note", cc: 60 },
  { ...region("Hold", "button", 7, 3, 2, 2, 62), output: "note", latch: true },
  ...RADIO,
]);
const KNOBS = surface("Knobs", [
  { ...TURN, mode: "relative-twos" },
  { ...region("Turn 2", "knob", 0, 0, 3, 3, 26), mode: "relative-offset" },
  { ...region("Turn 3", "knob", 6, 0, 3, 3, 27), mode: "relative-sign" },
]);
const FIXTURES: readonly Surface[] = [
  PAGE3,
  surface("Two", [FILTER, CUT]),
  surface("Latch", [{ ...GO, latch: true }]),
  surface("Wide", [{ ...FILTER, orientation: "horizontal", w: 6, h: 2 }]),
  SCALED,
  RELATIVE_HALF,
  RELATIVE_FULL,
  SPRING,
  NOTES,
  KNOBS,
];

/** The LED centre of a cell, in raw units, from the measured knots. */
const at = (col: number, row: number): [number, number] => [KX[col], KY[row]];

/** The values sent on one controller (status 176), in order. */
const sent = (midi: readonly HostMidi[], cc: number): number[] =>
  midi.filter((m) => m.cmd === 176 && m.p1 === cc).map((m) => m.p2);

/** Every message on one data-1 (a controller or a note), as `status:value`, in order. */
const traffic = (midi: readonly HostMidi[], p1: number): string[] =>
  midi.filter((m) => m.p1 === p1).map((m) => `${m.cmd}:${m.p2}`);

/**
 * The two stand-ins (the header): the touch element's `tim`, which is the
 * host's compiled Timer wrapper, and the system element's `map` under three
 * or five slots, which is the emitted 255/4 body as a method of `ele[#ele]`.
 */
function standIns(mapmode: string | undefined): string {
  const tim = "self.tim=__hangar_timer ";
  return mapmode === undefined
    ? tim
    : `${tim}ele={{map=function(s)${mapmode} end}}`;
}

async function open(
  s: Surface,
  options: EmitOptions = { slots: 5 },
): Promise<{ host: LuaHost; sim: PadSim }> {
  const emitted = emitSurface(s, options);
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    system: emitted.system ?? TOUCH_LIBRARY,
    systemTimer: emitted.systemTimer ?? TOUCH_LIBRARY_TIMER,
    setup: standIns(emitted.mapmode) + emitted.setup,
    timer: emitted.timer,
  });
  host.tick();
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

/** Layer 2's phase on a cell - the runtime's picture. */
const phase = (sim: PadSim, col: number, row: number): number =>
  sim.layer(screenToHw(col, row), 2).pha;

/** The cells of a region lit on layer 2, as `x,y` offsets in its box, reading order. */
function lit(sim: PadSim, r: Region): string[] {
  const out: string[] = [];
  for (let y = 0; y < r.h; y += 1) {
    for (let x = 0; x < r.w; x += 1) {
      if (phase(sim, r.col + x, r.row + y) > 0) out.push(`${x},${y}`);
    }
  }
  return out;
}

/** A point on a knob's ring at an angle (screen degrees, y down), radius 16 raw units. */
function ringPoint(knob: Region, deg: number): [number, number] {
  const [cx, cy] = knobCentre(knob);
  return [
    Math.round(cx + 16 * Math.cos((deg * Math.PI) / 180)),
    Math.round(cy + 16 * Math.sin((deg * Math.PI) / 180)),
  ];
}

/** One clockwise turn from `from` in 4-degree samples through `to`, the finger already down. */
function turn(host: LuaHost, knob: Region, from: number, to: number): void {
  const dir = to > from ? 4 : -4;
  for (let d = from + dir; dir > 0 ? d <= to : d >= to; d += dir)
    step(host, "move", 0, ringPoint(knob, d));
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
    // A TOGGLE (the schema's `latch`) turns on one press and off on the next; its R sends nothing.
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
          `  toggle:             ${JSON.stringify(sent(host.midi, GO.cc))}`,
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

  it("3. a vertical fader reads 127 at its top LED and 0 at its bottom LED from its box on the calibrated axis, sends on change only, and clamps beyond its end LEDs", async () => {
    // The row's geometry is the BOX in cells since change 10B (emit.ts); the
    // runtime derives the bottom LED's U and the LED span from it, so the
    // values are 13-15's to the number.
    expect(geometryOf(FILTER)).toEqual([0, 0, 2, 6]);
    expect(geometryOf(CUT)).toEqual([6, 2, 2, 4]);
    expect(regionRow(FILTER).slice(0, 5)).toEqual([0, 0, 2, 6, 1]);
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
    expect(geometryOf(SPACE)).toEqual([3, 0, 3, 3]);
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
    // carried in its row (columns 15 and 16, emit.ts `knobCentre`); its
    // ring's LED centres are 18, 21, 15 and 14 raw units out.
    const [cx, cy] = knobCentre(TURN);
    expect([cx, cy]).toEqual([
      Math.round(sensorAt(4, "x")),
      Math.round(sensorAt(5, "y")),
    ]);
    expect(
      regionRow(TURN).length,
      "a knob row carries its tail and its centre",
    ).toBe(16);
    expect(regionRow(TURN).slice(11)).toEqual([0, 127, 0, cx, cy]);
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
      // step is named here.
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
      // is kept (it is the knob's, not the contact's), so sixteen degrees
      // give one step or two, never a jump.
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

  it("6. passes both class gates over every emitted runtime text with the gates' own needles, defines only its own names - the trim's freed ones among them - and calls only the trimmed library's", () => {
    const texts: { name: string; text: string }[] = [];
    for (const s of FIXTURES) {
      for (const slots of [2, 3, 5] as const) {
        const e = emitSurface(s, { slots });
        texts.push({ name: `${s.name} Timer (${slots})`, text: e.timer });
        if (e.mapmode !== undefined)
          texts.push({ name: `${s.name} 255/4 (${slots})`, text: e.mapmode });
        if (e.system !== undefined)
          texts.push({ name: `${s.name} 255/0`, text: e.system });
        if (e.systemTimer !== undefined)
          texts.push({ name: `${s.name} 255/6`, text: e.systemTimer });
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
      // blind to `D(` and `K(` (12.1-09); the runtime's `D` is its scaled
      // send and its `K` a button's off - neither a decay nor a stamp - and
      // it writes no `glpfs`. Asserted with the gate's needle so its silence
      // on the decay is a fact.
      expect(text, `${name}: a decay appeared`).not.toContain(F("glp", "fs("));
      expect(
        GridScript.checkSyntax(text),
        `${name}: the pinned checker refuses it`,
      ).toBe(true);
    }
    expect(problems.join("\n\n")).toBe("");
    // NON-VACUITY: every text that carries O carries exactly one onset chain
    // (the trimmed 255/0 carries the library's `Q` no more, so a five-slot
    // text with O has one).
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
    // THE NAMES. The runtime defines S F I R O Q D K: the five it always
    // had, and three the trim frees (library-trim.ts) - never a name the
    // TRIMMED library still defines. It calls E N U X, every one a trimmed
    // global; `G` no more (the pictures are its own).
    const whole = joinLua([
      STATE,
      ...runtimeParts(BRANCHES).map((p) => p.lua),
      sweepCall(20),
    ]);
    const defined = capitalDefinitions(whole);
    expect(defined).toEqual([...RUNTIME_NAMES].sort());
    for (const d of defined) {
      expect(
        TRIMMED_GLOBALS.includes(d),
        `the runtime defines ${d}, which the trimmed library still owns`,
      ).toBe(false);
      if (LIBRARY_GLOBALS.includes(d)) {
        expect(
          TRIM_FREED_NAMES.includes(d),
          `the runtime defines ${d}, a library name the trim did not free`,
        ).toBe(true);
      }
    }
    expect(["Q", "D", "K"].every((n) => TRIM_FREED_NAMES.includes(n))).toBe(
      true,
    );
    // `R` is the one name it defines that the library calls; it is a
    // convention, not a global the library exports.
    expect(LIBRARY_CONVENTIONS).toEqual(["R"]);
    const called = capitalCalls(whole).filter(
      (c) => !RUNTIME_NAMES.includes(c),
    );
    expect(called).toEqual([...RUNTIME_CALLS].sort());
    for (const c of called) {
      expect(
        TRIMMED_GLOBALS.includes(c),
        `the runtime calls ${c}, which the trimmed library does not define`,
      ).toBe(true);
    }
    expect(whole).not.toContain(F("G", "("));
    // The library's W and Q are not on the hot path: a contact keeps the
    // region it landed in; the runtime's own Q is the painter.
    expect(whole).not.toContain(F("W", "("));
  });

  it("7. the measured cost: canonical under compressScript, the parts, and the ceiling in kinds under two slots, three and five - every combination fits five", async () => {
    const lines: string[] = [];
    // Every packed text is a fixed point of the minifier on the first round.
    for (const s of FIXTURES) {
      for (const slots of [2, 3, 5] as const) {
        const e = emitSurface(s, { slots });
        for (const [name, text] of [
          ["Timer", e.timer],
          ["255/4", e.mapmode ?? ""],
          ["255/0", e.system ?? ""],
          ["255/6", e.systemTimer ?? ""],
        ] as const) {
          if (text === "") continue;
          const c = await canonical(text);
          expect(
            c.rounds,
            `${s.name} ${name} (${slots}) is not canonical: ${c.text}`,
          ).toBe(0);
          expect(c.text).toBe(text);
        }
      }
    }
    // The runtime alone, every branch, and without the Knob.
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
      `the runtime alone: ${five.cost} with every branch, ${four.cost} without the Knob; the rotary's share ${knobShare} (13-15's 1,340 / 1,042 / 298 before change 10B)`,
    );
    // The parts.
    const partCosts = runtimeParts(BRANCHES).map(
      (p) => `${p.name} ${p.lua.length}`,
    );
    lines.push(
      `the parts: marker ${MARKER.length}, arm ${ARM.length}, head ${STATE.length}, ${partCosts.join(", ")}, sweep ${sweepCall(20).length}`,
    );
    // THE CEILING IN KINDS. Every combination of branches on two slots, on
    // three and on five, measured through the packer; fits / over recorded.
    const combos: Branch[][] = [];
    for (let mask = 1; mask < 1 << BRANCHES.length; mask += 1) {
      combos.push(BRANCHES.filter((_, i) => mask & (1 << i)));
    }
    const label = (branches: readonly Branch[]) =>
      branches
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
    const fitsTwo: string[] = [];
    const overTwo: string[] = [];
    const fitsThree: string[] = [];
    const overThree: string[] = [];
    const overFive: string[] = [];
    let fiveWorst = { name: "", used: 0, free: 0 };
    const slotTexts = (
      packed: ReturnType<typeof packRuntime>,
    ): [string, string][] => {
      const pairs: [string, string | undefined][] = [
        ["255/6", packed.systemTimer],
        ["255/0", packed.system],
        ["255/4", packed.mapmode],
        ["Timer", packed.timer],
      ];
      return pairs.filter(
        (pair): pair is [string, string] => pair[1] !== undefined,
      );
    };
    for (const branches of combos) {
      const name = label(branches);
      const two = packRuntime(branches, { slots: 2 });
      const twoCost = (await canonical(two.timer)).cost;
      (twoCost <= EVENT_BUDGET ? fitsTwo : overTwo).push(`${name} ${twoCost}`);
      const three = packRuntime(branches, { slots: 3 });
      const threeCosts = await Promise.all(
        slotTexts(three).map(async ([, t]) => (await canonical(t)).cost),
      );
      (threeCosts.every((c) => c <= EVENT_BUDGET) ? fitsThree : overThree).push(
        `${name} ${threeCosts.join("+")}`,
      );
      expect(three.fits, `${name}: the packer's word on three`).toBe(
        threeCosts.every((c) => c <= EVENT_BUDGET),
      );
      const fivePack = packRuntime(branches, { slots: 5 });
      const fiveCosts = await Promise.all(
        slotTexts(fivePack).map(async ([, t]) => (await canonical(t)).cost),
      );
      if (!fiveCosts.every((c) => c <= EVENT_BUDGET))
        overFive.push(`${name} ${fiveCosts.join("+")}`);
      expect(fivePack.fits, `${name}: the packer's word on five`).toBe(
        fiveCosts.every((c) => c <= EVENT_BUDGET),
      );
      const total = fiveCosts.reduce((a, b) => a + b, 0);
      if (total > fiveWorst.used)
        fiveWorst = {
          name,
          used: total,
          free: 4 * EVENT_BUDGET - total,
        };
    }
    lines.push(
      `two slots, fits (Timer of ${EVENT_BUDGET}): ${fitsTwo.join(", ") || "none"}`,
    );
    lines.push(`two slots, over: ${overTwo.join(", ")}`);
    lines.push(`three slots, fits: ${fitsThree.join(", ") || "none"}`);
    lines.push(`three slots, over: ${overThree.join(", ") || "none"}`);
    lines.push(
      `five slots, over: ${overFive.length === 0 ? "none - every combination fits" : overFive.join(", ")}; the dearest ${fiveWorst.name} at ${fiveWorst.used} of ${4 * EVENT_BUDGET} across the four runtime slots`,
    );
    // The PDF's own page 3 under the three, with the free characters per slot.
    const p2 = await measureSurface(PAGE3, { slots: 2 });
    const p3 = await measureSurface(PAGE3, { slots: 3 });
    const p5 = await measureSurface(PAGE3, { slots: 5 });
    lines.push(
      `the PDF's page 3 (v x b k): two slots Timer ${p2.timer.used} (${p2.fits ? "fits" : `over by ${-p2.timer.free}`}); ` +
        `three slots Timer ${p3.timer.used} + 255/4 ${p3.mapmode?.used} (${p3.fits ? "fits" : "over"}); ` +
        `five slots 255/6 ${p5.systemTimer?.used} (${p5.systemTimer?.free} free) + 255/0 ${p5.system?.used} (${p5.system?.free} free) + 255/4 ${p5.mapmode?.used} (${p5.mapmode?.free} free) + Timer ${p5.timer.used} (${p5.timer.free} free), Setup ${p5.setup.used}, ` +
        `${p5.fits ? "fits" : "over"}; placement ${p5.emitted.runtime.placement.map((p) => `${p.name}:${p.slot}`).join(" ")}`,
    );
    const smallest = await measureSurface(surface("One", [FILTER]), {
      slots: 2,
    });
    lines.push(
      `one vertical fader, two slots: Timer ${smallest.timer.used}, ${smallest.timer.free} free`,
    );
    console.log(
      ["The runtime, measured (change 10B, 2026-09-18):", ...lines].join("\n"),
    );

    // PINNED, this tree, 2026-09-18. A minifier bump or an edit that moves one
    // moves the assertion, which is the point.
    expect(five.cost).toBe(PINNED.five);
    expect(four.cost).toBe(PINNED.four);
    expect(knobShare).toBe(PINNED.knobShare);
    expect(smallest.timer.used).toBe(PINNED.oneFaderTwoSlots);
    expect(p2.timer.used).toBe(PINNED.page3Two);
    expect([p3.timer.used, p3.mapmode?.used]).toEqual(PINNED.page3Three);
    expect([
      p5.systemTimer?.used,
      p5.system?.used,
      p5.mapmode?.used,
      p5.timer.used,
      p5.setup.used,
    ]).toEqual(PINNED.page3Five);
    expect(p5.fits, "the PDF's page 3 fits on five slots").toBe(true);
    expect(p3.fits, "the PDF's page 3 no longer fits on three slots").toBe(
      false,
    );
    expect(p2.fits, "the PDF's page 3 does not fit on two slots").toBe(false);
    expect(overFive, "five slots carry every combination").toEqual([]);
    expect(fitsTwo.map((f) => f.split(" ")[0])).toEqual(PINNED.fitsTwo);
    expect(fitsThree.map((f) => f.split(" ")[0])).toEqual(PINNED.fitsThree);
    expect(branchesUsed(PAGE3.regions)).toEqual([
      "fader-v",
      "button",
      "xy",
      "knob",
    ]);
  }, 180000);

  it("8. min and max (answer 6a): every sending kind scales its value into min..max, a min above the max inverts the direction, the XY pad's one pair serves both axes, a button's min is its off value and its max its on value", async () => {
    // The scale's twin agrees with the Lua's floor division on both signs.
    expect(scaleValue({ ...FILTER, min: 20, max: 80 }, 101)).toBe(67);
    expect(scaleValue({ ...WIDE, min: 100, max: 50 }, 101)).toBe(60);
    expect(regionTail({ ...FILTER, min: 20, max: 80 })).toEqual([20, 80]);
    expect(regionTail({ ...WIDE, min: 100, max: 50 })).toEqual([100, 50]);
    const { host } = await open(SCALED);
    try {
      // The vertical fader 20..80: the top LED 80, the bottom 20, row 1 67.
      step(host, "down", 0, at(0, 0));
      step(host, "move", 0, at(0, 5));
      step(host, "move", 0, at(0, 1));
      expect(sent(host.midi, FILTER.cc)).toEqual([80, 20, 67]);
      step(host, "up", 0, at(0, 1));
      // The horizontal fader 100 down to 50: the LEFT LED is 100, the right 50.
      step(host, "down", 0, at(0, 7));
      step(host, "move", 0, at(3, 7));
      step(host, "move", 0, at(1, 7));
      expect(sent(host.midi, WIDE.cc), "inverted").toEqual([100, 50, 83]);
      step(host, "up", 0, at(1, 7));
      // The XY pad 10..20 on both axes.
      step(host, "down", 0, at(3, 2));
      step(host, "move", 0, at(5, 0));
      expect(sent(host.midi, SPACE.cc)).toEqual([10, 20]);
      expect(sent(host.midi, SPACE.cc2 ?? -1)).toEqual([10, 20]);
      step(host, "up", 0, at(5, 0));
      // The knob 64..127: the position climbs a step a detent, the value
      // moves every other step - sent on change of the VALUE, so 45 detents
      // give 22 messages, 64 first, 86 last.
      step(host, "down", 0, ringPoint(TURN, 90));
      turn(host, TURN, 90, 450);
      const knob = sent(host.midi, TURN.cc);
      expect(knob[0]).toBe(64);
      expect(knob[knob.length - 1]).toBe(scaleValue(SCALED.regions[3], 45));
      expect(knob.length).toBe(new Set(knob).size);
      step(host, "up", 0, ringPoint(TURN, 450));
      // The button 5..100: on is the max, off the min.
      step(host, "down", 0, at(7, 0));
      step(host, "up", 0, at(7, 0));
      expect(sent(host.midi, GO.cc)).toEqual([100, 5]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("9. relative (answer 7c): a touch changes nothing until the finger moves, the value then follows the displacement - 64 steps over the region's travel at half, 127 at full - held per region between touches and clamped; the XY pad the same per axis", async () => {
    // HALF. Filter's rows are 127, 101, 76, 50, 25, 0 along its travel.
    {
      const { host } = await open(RELATIVE_HALF);
      try {
        step(host, "down", 0, at(0, 3));
        expect(sent(host.midi, FILTER.cc), "a touch alone sends").toEqual([]);
        step(host, "move", 0, at(0, 2)); // +26 -> 13
        step(host, "move", 0, at(0, 0)); // +51 -> 38
        expect(sent(host.midi, FILTER.cc)).toEqual([13, 38]);
        step(host, "up", 0, at(0, 0));
        // Held: the next touch lands anywhere and continues from 38.
        step(host, "down", 0, at(0, 5));
        expect(sent(host.midi, FILTER.cc)).toEqual([13, 38]);
        step(host, "move", 0, at(0, 4)); // +25 -> 51
        expect(sent(host.midi, FILTER.cc)).toEqual([13, 38, 51]);
        // Down past the start: clamped at 0, sent once.
        step(host, "move", 0, at(0, 5));
        step(host, "move", 0, at(0, 5));
        step(host, "up", 0, at(0, 5));
        step(host, "down", 0, at(0, 0));
        step(host, "move", 0, at(0, 5));
        step(host, "up", 0, at(0, 5));
        step(host, "down", 0, at(0, 0));
        step(host, "move", 0, at(0, 5));
        const values = sent(host.midi, FILTER.cc);
        expect(values[values.length - 1]).toBe(0);
        expect(values.filter((v) => v === 0).length).toBe(1);
        step(host, "up", 0, at(0, 5));
        // The XY pad, per axis: a touch sends nothing; one cell right is 64
        // of 127 along a 3-wide pad -> 32 steps; one cell up the same on y.
        step(host, "down", 0, at(3, 2));
        expect(sent(host.midi, SPACE.cc)).toEqual([]);
        step(host, "move", 0, at(4, 2));
        expect(sent(host.midi, SPACE.cc)).toEqual([31]);
        // The other axis reports its held value once on the first move
        // (nothing had been sent on it), then only when it moves.
        expect(sent(host.midi, SPACE.cc2 ?? -1)).toEqual([0]);
        step(host, "move", 0, at(4, 1));
        expect(sent(host.midi, SPACE.cc2 ?? -1)).toEqual([0, 31]);
        step(host, "move", 0, at(3, 1));
        expect(sent(host.midi, SPACE.cc), "x back to 0").toEqual([31, 0]);
        expect(sent(host.midi, SPACE.cc2 ?? -1), "y still").toEqual([0, 31]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // FULL: the same two moves give 26 and 77.
    {
      const { host } = await open(RELATIVE_FULL);
      try {
        step(host, "down", 0, at(0, 3));
        step(host, "move", 0, at(0, 2));
        step(host, "move", 0, at(0, 0));
        expect(sent(host.midi, FILTER.cc)).toEqual([26, 77]);
        step(host, "up", 0, at(0, 0));
        step(host, "down", 0, at(3, 2));
        step(host, "move", 0, at(4, 2));
        expect(sent(host.midi, SPACE.cc)).toEqual([63]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    expect(flagsOf({ ...FILTER, mode: "relative" })).toBe(1);
    expect(flagsOf({ ...FILTER, mode: "relative", speed: "full" })).toBe(3);
    expect(flagsOf({ ...SPACE, mode: "relative", speed: "full" })).toBe(3);
  });

  it("10. spring (answer 8): on release the fader sends and shows the spring value, clamped into min..max; with relative the next touch starts from it", async () => {
    expect(regionTail({ ...FILTER, spring: true })).toEqual([0, 127, 4, 64]);
    expect(springPosition({ ...FILTER, spring: true, min: 20, max: 80 })).toBe(
      springPosition({
        ...FILTER,
        spring: true,
        springValue: 64,
        min: 20,
        max: 80,
      }),
    );
    expect(
      scaleValue(
        { ...FILTER, min: 20, max: 80 },
        springPosition({
          ...FILTER,
          spring: true,
          springValue: 64,
          min: 20,
          max: 80,
        }),
      ),
      "the spring position lands the typed value exactly",
    ).toBe(64);
    expect(
      scaleValue(
        { ...FILTER, min: 20, max: 40 },
        springPosition({
          ...FILTER,
          spring: true,
          springValue: 100,
          min: 20,
          max: 40,
        }),
      ),
      "clamped into min..max",
    ).toBe(40);
    const { host, sim } = await open(SPRING);
    try {
      // Absolute with the spring at 64: the touch sends the finger, the
      // release the spring; the bar shows the spring value after the lift.
      step(host, "down", 0, at(0, 0));
      expect(sent(host.midi, FILTER.cc)).toEqual([127]);
      expect(lit(sim, FILTER).length, "the bar at the top").toBe(12);
      step(host, "up", 0, at(0, 0));
      expect(sent(host.midi, FILTER.cc)).toEqual([127, 64]);
      expect(
        lit(sim, FILTER),
        "the bar at the spring value: three rows",
      ).toEqual(["0,3", "1,3", "0,4", "1,4", "0,5", "1,5"]);
      // Relative with the spring at 100 (Cut, rows 2..5: 127, 84, 42, 0): the
      // first touch starts from 100 - one cell up is +42 at half = 21 -> 121;
      // the release springs back to 100; the next touch starts from 100 again.
      step(host, "down", 0, at(6, 4));
      expect(sent(host.midi, CUT.cc)).toEqual([]);
      step(host, "move", 0, at(6, 3));
      expect(sent(host.midi, CUT.cc)).toEqual([121]);
      step(host, "up", 0, at(6, 3));
      expect(sent(host.midi, CUT.cc)).toEqual([121, 100]);
      step(host, "down", 0, at(6, 4));
      step(host, "move", 0, at(6, 3));
      expect(sent(host.midi, CUT.cc)).toEqual([121, 100, 121]);
      step(host, "up", 0, at(6, 3));
      expect(sent(host.midi, CUT.cc)).toEqual([121, 100, 121, 100]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("11. the button (answers 9b, 10): a note output sends note-on at the max and a note-off (status 128) on release or on the second press under Toggle; a radio group is exclusive across three buttons, each member's off sent as it goes dark", async () => {
    expect(flagsOf({ ...GO, output: "note" })).toBe(2);
    expect(flagsOf({ ...GO, output: "note", latch: true })).toBe(3);
    expect(regionRow(RADIO[0])[6], "the group is the seventh column").toBe(1);
    const { host, sim } = await open(NOTES);
    try {
      // Momentary note: 144 on the press, 128 on the release, C4 = 60.
      step(host, "down", 0, at(7, 0));
      step(host, "up", 0, at(7, 0));
      expect(traffic(host.midi, 60)).toEqual(["144:127", "128:0"]);
      // Toggle note: on at the first press, nothing on the release, off at the second press.
      step(host, "down", 0, at(7, 3));
      step(host, "up", 0, at(7, 3));
      expect(traffic(host.midi, 62)).toEqual(["144:127"]);
      expect(lit(sim, NOTES.regions[1]).length, "a toggle stays lit").toBe(4);
      step(host, "down", 0, at(7, 3));
      step(host, "up", 0, at(7, 3));
      expect(traffic(host.midi, 62)).toEqual(["144:127", "128:0"]);
      expect(lit(sim, NOTES.regions[1])).toEqual([]);
      // The radio group: One on; Two on turns One off first; Three (momentary)
      // on turns Two off; Three's release turns Three off; One again on.
      step(host, "down", 0, at(5, 7));
      step(host, "up", 0, at(5, 7));
      expect(traffic(host.midi, 41)).toEqual(["176:127"]);
      expect(lit(sim, RADIO[0])).toEqual(["0,0"]);
      step(host, "down", 0, at(6, 7));
      step(host, "up", 0, at(6, 7));
      expect(traffic(host.midi, 41)).toEqual(["176:127", "176:0"]);
      expect(traffic(host.midi, 42)).toEqual(["176:127"]);
      expect(lit(sim, RADIO[0])).toEqual([]);
      expect(lit(sim, RADIO[1])).toEqual(["0,0"]);
      // The order: One's off before Two's on.
      const order = host.midi.filter((m) => m.p1 === 41 || m.p1 === 42);
      expect(order.map((m) => `${m.p1}:${m.p2}`)).toEqual([
        "41:127",
        "41:0",
        "42:127",
      ]);
      step(host, "down", 0, at(7, 7));
      expect(traffic(host.midi, 42)).toEqual(["176:127", "176:0"]);
      expect(traffic(host.midi, 43)).toEqual(["176:127"]);
      step(host, "up", 0, at(7, 7));
      expect(traffic(host.midi, 43), "a momentary member releases").toEqual([
        "176:127",
        "176:0",
      ]);
      expect(lit(sim, RADIO[2])).toEqual([]);
      step(host, "down", 0, at(5, 7));
      step(host, "up", 0, at(5, 7));
      expect(traffic(host.midi, 41)).toEqual(["176:127", "176:0", "176:127"]);
      // A second press on an on toggle in a group turns it off.
      step(host, "down", 0, at(5, 7));
      step(host, "up", 0, at(5, 7));
      expect(traffic(host.midi, 41)).toEqual([
        "176:127",
        "176:0",
        "176:127",
        "176:0",
      ]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });

  it("12. the knob's relative modes (answer 11d): two's complement 1..63 up / 127..65 down, binary offset 65..127 / 63..1, sign magnitude 1..63 / 65..127 - the detents crossed in one sample, capped at 63; min and max do not apply", async () => {
    expect(flagsOf({ ...TURN, mode: "relative-twos" })).toBe(1);
    expect(flagsOf({ ...TURN, mode: "relative-offset" })).toBe(2);
    expect(flagsOf({ ...TURN, mode: "relative-sign" })).toBe(3);
    const { host } = await open(KNOBS);
    try {
      // Per mode: the one-detent encodings either way, then the detents
      // crossed in ONE sample (a 24-degree jump: three, or two beside a
      // remainder the earlier samples left) in one message.
      const modes: [Region, number, number, number[], number[]][] = [
        [KNOBS.regions[0], 1, 127, [2, 3], [126, 125]],
        [KNOBS.regions[1], 65, 63, [66, 67], [62, 61]],
        [KNOBS.regions[2], 1, 65, [2, 3], [66, 67]],
      ];
      for (const [knob, up, down, upMany, downMany] of modes) {
        step(host, "down", 0, ringPoint(knob, 90));
        turn(host, knob, 90, 170); // 80 degrees in 4-degree samples: ten detents, give or take the rounding of a ring point
        const ups = sent(host.midi, knob.cc);
        expect(ups.length, `${knob.name} up`).toBeGreaterThanOrEqual(9);
        expect(ups.length).toBeLessThanOrEqual(11);
        expect(new Set(ups), `${knob.name}: one step a detent, up`).toEqual(
          new Set([up]),
        );
        turn(host, knob, 170, 90);
        const downs = sent(host.midi, knob.cc).slice(ups.length);
        expect(downs.length).toBeGreaterThanOrEqual(9);
        expect(downs.length).toBeLessThanOrEqual(11);
        expect(new Set(downs), `${knob.name}: one step a detent, down`).toEqual(
          new Set([down]),
        );
        const before = sent(host.midi, knob.cc).length;
        step(host, "move", 0, ringPoint(knob, 114));
        step(host, "move", 0, ringPoint(knob, 90));
        const jumps = sent(host.midi, knob.cc).slice(before);
        expect(jumps.length, `${knob.name}: one message a jump`).toBe(2);
        expect(upMany, `${knob.name} jump up ${jumps[0]}`).toContain(jumps[0]);
        expect(downMany, `${knob.name} jump down ${jumps[1]}`).toContain(
          jumps[1],
        );
        step(host, "up", 0, ringPoint(knob, 90));
      }
      // The most detents one sample can carry: the wrap bounds a sample at
      // 180 degrees, 22 steps, inside every encoding's 63.
      expect(KNOB_STEP_CAP).toBe(22);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    const { host: scaled } = await open(
      surface("Scaled knob", [
        { ...TURN, mode: "relative-twos", min: 100, max: 110 },
      ]),
    );
    try {
      step(scaled, "down", 0, ringPoint(TURN, 90));
      turn(scaled, TURN, 90, 122);
      const steps = sent(scaled.midi, TURN.cc);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(new Set(steps), "the encoding, not the span").toEqual(
        new Set([1]),
      );
      expect(scaled.errors).toEqual([]);
    } finally {
      scaled.close();
    }
  });

  it("13. the pictures (answer 5): a fader's bar from its low end to the value, a button's whole region while on, the XY pad's crosshair through the finger, the knob's arc under absolute and a sector round the finger under relative - layer 2 in the region's colour, cleared on release except where a value is held - every fader's bar, a toggle - the rest colour on layer 1 untouched", async () => {
    const { host, sim } = await open(PAGE3);
    try {
      // At rest nothing on layer 2; layer 1 carries the rest phase on a region's cell.
      expect(lit(sim, FILTER)).toEqual([]);
      expect(sim.layer(screenToHw(0, 0), 1).pha).toBe(48);
      // The fader: the top LED lights the whole bar; row 3 (position 50)
      // lights two rows from the bottom; the release KEEPS the bar where the finger left it
      // (change 10C: a fader holds its position; only a spring fader moves on the lift).
      step(host, "down", 0, at(0, 0));
      expect(lit(sim, FILTER).length).toBe(12);
      step(host, "move", 0, at(0, 3));
      expect(lit(sim, FILTER)).toEqual(["0,4", "1,4", "0,5", "1,5"]);
      expect(phase(sim, 0, 5)).toBe(255);
      step(host, "up", 0, at(0, 3));
      expect(lit(sim, FILTER), "the bar stays after the lift").toEqual([
        "0,4",
        "1,4",
        "0,5",
        "1,5",
      ]);
      expect(sim.layer(screenToHw(0, 0), 1).pha, "layer 1 untouched").toBe(48);
      // The button: the whole region while held, dark on release.
      step(host, "down", 0, at(7, 0));
      expect(lit(sim, GO).length).toBe(4);
      step(host, "up", 0, at(7, 0));
      expect(lit(sim, GO)).toEqual([]);
      // The XY pad: the row and the column through the finger's cell (4,1)
      // - five cells of nine - moving with it, cleared on release.
      step(host, "down", 0, at(4, 1));
      expect(lit(sim, SPACE)).toEqual(["1,0", "0,1", "1,1", "2,1", "1,2"]);
      step(host, "move", 0, at(3, 2));
      expect(lit(sim, SPACE)).toEqual(["0,0", "0,1", "0,2", "1,2", "2,2"]);
      step(host, "up", 0, at(3, 2));
      expect(lit(sim, SPACE)).toEqual([]);
      // The knob, absolute: at position 0 only the low cell (7:30, bottom
      // left, the cell at 135 degrees); a half turn on (22 or 23 detents,
      // 46 or 48 of the 270-degree sweep) reaches the left-middle cell at
      // 180 degrees; the centre never lights; the release clears.
      step(host, "down", 0, ringPoint(TURN, 90));
      expect(lit(sim, TURN)).toEqual(["0,2"]);
      turn(host, TURN, 90, 270);
      expect([22, 23]).toContain(sent(host.midi, TURN.cc).length);
      expect(lit(sim, TURN)).toEqual(["0,1", "0,2"]);
      turn(host, TURN, 270, 450);
      expect(sent(host.midi, TURN.cc).length).toBe(45);
      expect(lit(sim, TURN), "45 of 127: the arc past the top-left").toEqual([
        "0,0",
        "0,1",
        "0,2",
      ]);
      expect(phase(sim, 4, 5), "the centre stays dark").toBe(0);
      step(host, "up", 0, ringPoint(TURN, 450));
      expect(lit(sim, TURN)).toEqual([]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // The held pictures: a relative fader keeps its bar after the lift, a toggle stays lit
    // (test 11), and the relative knob's sector follows the finger.
    const held = surface("Held", [
      { ...FILTER, mode: "relative" },
      { ...TURN, mode: "relative-twos" },
    ]);
    const { host: h2, sim: s2 } = await open(held);
    try {
      step(h2, "down", 0, at(0, 3));
      step(h2, "move", 0, at(0, 0)); // +77 at half -> 38
      step(h2, "up", 0, at(0, 0));
      expect(sent(h2.midi, FILTER.cc)).toEqual([38]);
      expect(
        lit(s2, FILTER),
        "the bar shows the held value, not the finger",
      ).toEqual(["0,4", "1,4", "0,5", "1,5"]);
      // The sector: a finger at 6 o'clock lights the three bottom cells.
      step(h2, "down", 0, ringPoint(TURN, 90));
      expect(lit(s2, TURN)).toEqual(["0,2", "1,2", "2,2"]);
      turn(h2, TURN, 90, 200);
      expect(lit(s2, TURN), "past 9 o'clock: the two upper-left cells").toEqual(
        ["0,0", "0,1"],
      );
      step(h2, "up", 0, ringPoint(TURN, 200));
      expect(lit(s2, TURN)).toEqual([]);
      expect(h2.errors, h2.errors.join(" | ")).toEqual([]);
    } finally {
      h2.close();
    }
  });

  it("14. the trimmed library (answer 12): 255/0 keeps the head, the map, U E X N and the call, 255/6 the marker alone, both canonical and sliced from library.ts's parts; every fixture runs on them under five slots with a press, a move and a lift on each region and no error", async () => {
    expect(
      TRIMMED_LIBRARY.startsWith("--[[@cb]]H={}T={}C=0 P={}B={}L=0 KX={"),
    ).toBe(true);
    expect(TRIMMED_LIBRARY.endsWith(" self:tim()")).toBe(true);
    expect(TRIMMED_LIBRARY_TIMER).toBe(MARKER);
    expect(TOUCH_LIBRARY).toContain(TRIMMED_LIBRARY.slice(0, 200));
    for (const fn of ["U", "E", "X", "N"])
      expect(TRIMMED_LIBRARY).toContain(`function ${fn}(`);
    for (const fn of ["W", "Q", "V", "G", "Z", "Y", "K", "A", "D"])
      expect(TRIMMED_LIBRARY + TRIMMED_LIBRARY_TIMER).not.toContain(
        `function ${fn}(`,
      );
    expect(TRIMMED_GLOBALS).toEqual([
      "B",
      "C",
      "E",
      "H",
      "KX",
      "KY",
      "L",
      "N",
      "P",
      "T",
      "U",
      "X",
    ]);
    expect((await canonical(TRIMMED_LIBRARY)).rounds).toBe(0);
    expect(TRIM_FREES).toEqual({
      setup: TOUCH_LIBRARY.length - TRIMMED_LIBRARY.length,
      timer: TOUCH_LIBRARY_TIMER.length - MARKER.length,
    });
    expect(TRIM_FREES).toEqual({ setup: 382, timer: 864 });
    expect([TOUCH_LIBRARY.length, TRIMMED_LIBRARY.length]).toEqual([842, 460]);
    console.log(
      `the trim: 255/0 ${TOUCH_LIBRARY.length} -> ${TRIMMED_LIBRARY.length} (${TRIM_FREES.setup} freed), 255/6 ${TOUCH_LIBRARY_TIMER.length} -> ${TRIMMED_LIBRARY_TIMER.length} (${TRIM_FREES.timer} freed)`,
    );
    // Every fixture, under five slots, on the trimmed halves: the emitted
    // 255/0 and 255/6 open with the trimmed text, and a gesture on every
    // region raises nothing.
    for (const s of FIXTURES) {
      const e = emitSurface(s, { slots: 5 });
      expect(e.system?.startsWith(TRIMMED_LIBRARY), s.name).toBe(true);
      expect(e.systemTimer?.startsWith(TRIMMED_LIBRARY_TIMER), s.name).toBe(
        true,
      );
      const { host } = await open(s);
      try {
        for (const r of s.regions) {
          step(host, "down", 0, at(r.col, r.row));
          step(host, "move", 0, at(r.col + r.w - 1, r.row + r.h - 1));
          step(host, "up", 0, at(r.col + r.w - 1, r.row + r.h - 1));
        }
        host.run(30);
        expect(host.errors, `${s.name}: ${host.errors.join(" | ")}`).toEqual(
          [],
        );
        expect(host.midi.length, `${s.name} sent nothing`).toBeGreaterThan(0);
      } finally {
        host.close();
      }
    }
  }, 120000);
});

/** The figures pinned by test 7, this tree, 2026-09-18 (change 10B; re-pinned at 10C - `R` 22 shorter). */
const PINNED = {
  five: 2795,
  four: 2208,
  knobShare: 587,
  oneFaderTwoSlots: 1321,
  page3Two: 2825,
  page3Three: [2010, 847] as [number, number | undefined],
  page3Five: [847, 908, 834, 783, 489] as (number | undefined)[],
  /** Two slots carry no kind at all since change 10B; three carry one kind alone, or a fader with a button, or a button with an XY pad (10C). */
  fitsTwo: [] as string[],
  fitsThree: ["v", "h", "vh", "b", "vb", "hb", "vhb", "x", "bx", "k"],
};
