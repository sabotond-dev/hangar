// The runtime's tests (13-15; change 10B added seven, change 11 two, change 18 two, change 18b one, change 21A one), most in a REAL Lua VM: every string in
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
import {
  EVENT_BUDGET,
  atPickerCorner,
  canonical,
  measureSurface,
} from "./cost";
import {
  MARKER,
  RECEIVE_NONE,
  RECEIVE_ON,
  capitalCalls,
  capitalDefinitions,
  emitSurface,
  geometryOf,
  knobCentre,
  regionRow,
  regionTail,
  renderRegionTable,
  type EmitOptions,
} from "./emit";
import { GEOMETRY_COPY, validate } from "./geometry";
import {
  TRIMMED_GLOBALS,
  TRIMMED_HEAD,
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
  channelWord,
  fingerController,
  flagsOf,
  HAND_OVER_BIT,
  handsOver,
  hasHandOver,
  hasMultitouch,
  latchTouchOf,
  knobRingRaw,
  pitchOf,
  receivesOf,
  scaleValue,
  seventhOf,
  springPosition,
  touchesOf,
  typeOf,
  type Branch,
  type Region,
  type Surface,
} from "./model";
import {
  ARM,
  ENTRY,
  HAND_OVER_TEXT,
  KNOB_STEP_CAP,
  MULTITOUCH_TEXT,
  AXIS,
  POSITION,
  RECEIVE_ENTRY,
  RUNTIME_CALLS,
  RUNTIME_NAMES,
  RELEASE,
  BRANCH_TEXT,
  SLOT_COLUMNS,
  STATE,
  TAIL_DEFAULTS_LUA,
  colourPart,
  joinLua,
  packRuntime,
  entryText,
  runtimeParts,
  withTouchEntry,
  type ExtrasOptions,
  slotColumn,
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

/**
 * The change 11 fixtures (tests 15 and 16; tests 6, 7 and 14 run them beside the ten above): a
 * two-finger 3 x 3 pad bottom-right, a five-finger 5 x 5 pad, the pair in relative, a one-finger
 * pad beside a two-finger one, and page 3 with its pad at two fingers. Controllers are chosen so
 * no finger's pair meets another region's: Duo 50..53, Five 60..69.
 */
const DUO = region("Duo", "xy", 6, 3, 3, 3, 50, { cc2: 51, touches: 2 });
const FIVE = region("Five", "xy", 0, 0, 5, 5, 60, { cc2: 61, touches: 5 });
const MULTI = surface("Multitouch", [DUO, FILTER, GO]);
const FIVE_PAD = surface("Five fingers", [FIVE]);
const MULTI_RELATIVE = surface("Multitouch relative", [
  { ...DUO, mode: "relative" },
]);
const TWO_PADS = surface("Two pads", [SPACE, DUO]);
const PAGE3_MULTI = surface("Page 3 multitouch", [
  FILTER,
  { ...SPACE, cc: 50, cc2: 51, touches: 2 },
  TURN,
  GO,
]);
const MULTITOUCH_FIXTURES: readonly Surface[] = [
  MULTI,
  FIVE_PAD,
  MULTI_RELATIVE,
  TWO_PADS,
  PAGE3_MULTI,
];

/**
 * The change 18 fixtures (tests 21 and 22; tests 6, 7 and 14 run them beside the rest): two
 * vertical faders side by side (two wide, as change 18 had to: `A` divided by the width less one
 * until change 18b - test 23 runs the one-cell ones), at the default and with Latch Off; a strum row of four
 * one-cell buttons Off with an empty cell before the last; an Off button, an On button and an Off
 * button in a row; an Off fader, an Off spring fader and an Off button across empty plate; page 3
 * with every element Off; and a Touches-2 pad Off beside an Off button. Controllers 80..95 meet
 * no other region's.
 */
const OFF = { latchTouch: false } as const;
const LANE_A = region("Lane A", "fader", 0, 0, 2, 6, 80);
const LANE_B = region("Lane B", "fader", 2, 0, 2, 6, 81);
const LANES = surface("Lanes", [LANE_A, LANE_B]);
const LANES_OFF = surface("Lanes off", [
  { ...LANE_A, ...OFF },
  { ...LANE_B, ...OFF },
]);
const STRUM = surface(
  "Strum",
  [0, 1, 2, 4].map((col, k) =>
    region(`Strum ${k + 1}`, "button", col, 8, 1, 1, 90 + k, OFF),
  ),
);
const WAIT = surface("Wait", [
  region("Leave", "button", 0, 8, 1, 1, 90, OFF),
  region("Keep", "button", 1, 8, 1, 1, 91),
  region("Past", "button", 2, 8, 1, 1, 92, OFF),
]);
const ROAM = surface("Roam", [
  { ...LANE_A, ...OFF },
  region("Spring", "fader", 5, 0, 2, 6, 82, { spring: true, ...OFF }),
  region("Far", "button", 3, 6, 1, 1, 90, OFF),
]);
const PAGE3_OFF = surface(
  "Page 3 off",
  PAGE3.regions.map((r) => ({ ...r, ...OFF })),
);
const MULTI_OFF = surface("Multitouch off", [
  { ...DUO, ...OFF },
  region("Beside", "button", 5, 4, 1, 1, 95, OFF),
]);
const LATCH_FIXTURES: readonly Surface[] = [
  LANES,
  LANES_OFF,
  STRUM,
  WAIT,
  ROAM,
  PAGE3_OFF,
  MULTI_OFF,
];

/**
 * The change 18b fixtures (test 23; tests 6, 7 and 14 run them beside the rest): faders one cell
 * across the axis they do not read - a 1 x 6 and a 1 x 2 vertical, a 6 x 1 and a 2 x 1 horizontal,
 * every one a size the editor allows - beside a 3 x 3 pad; the 1 x 6 relative at full with the
 * spring at 100; and two 1 x 6 side by side Latch Off (emit.spec.ts's twelve and sixteen are 1 x 6
 * faders in a row). Controllers 70..74 meet no other region's.
 */
const THIN = region("Thin", "fader", 0, 0, 1, 6, 70);
const STUB = region("Stub", "fader", 2, 0, 1, 2, 71);
const FLAT = region("Flat", "fader", 0, 8, 6, 1, 72, {
  orientation: "horizontal",
});
const NUB = region("Nub", "fader", 7, 8, 2, 1, 73, {
  orientation: "horizontal",
});
const ONE_CELL = surface("One cell", [THIN, STUB, FLAT, NUB, SPACE]);
const THIN_SPRING = surface("Thin spring", [
  { ...THIN, mode: "relative", speed: "full", spring: true, springValue: 100 },
]);
const THIN_OFF = surface("Thin off", [
  { ...THIN, ...OFF },
  region("Thin 2", "fader", 1, 0, 1, 6, 74, OFF),
]);
const ONE_CELL_FIXTURES: readonly Surface[] = [ONE_CELL, THIN_SPRING, THIN_OFF];

/**
 * The change 21A fixtures (test 24; tests 6 and 14 run them beside the rest): page 3's pad with a
 * Touch note (C3 at 100, channel 1) - Andrew Huang's case - and the same at velocity From Y; the
 * pad Latch Off beside an Off button, for the hand-over both ways; a Touches-2 pad with the note
 * (the gate); a fader with a Value CC 74 on channel 2; a button with a Touch CC 64; a pad with
 * three extras. Then the continuous Notes: a C major ribbon 60..72 beside a Gate fader on note
 * 60; the ribbon with a spring and relative; a pad whose X is a minor pentatonic ribbon 48..72
 * and whose Y is a controller; a chromatic knob 60..84; the two faders Latch Off. Notes 48..84
 * and controllers 64 and 74 meet no other region's messages but where a test says so.
 */
const TOUCH_NOTE = {
  trigger: "touch",
  type: "note",
  channel: 1,
  number: 48,
} as const;
const GATE_PAD = region("Gate pad", "xy", 3, 0, 3, 3, 21, {
  cc2: 22,
  extras: [TOUCH_NOTE],
});
const TOUCHED = surface("Touched", [FILTER, GATE_PAD, TURN, GO]);
const FROM_Y = surface("From Y", [
  { ...GATE_PAD, extras: [{ ...TOUCH_NOTE, velocity: "y" }] },
]);
const OFF_PAD = surface("Off pad", [
  { ...GATE_PAD, ...OFF },
  region("Beside", "button", 7, 0, 1, 1, 95, OFF),
]);
const DUO_GATE = surface("Duo gate", [{ ...DUO, extras: [TOUCH_NOTE] }]);
const VALUE_FADER = surface("Value fader", [
  {
    ...FILTER,
    extras: [{ trigger: "value", type: "cc", channel: 2, number: 74 }],
  },
]);
const CC_TOUCH = surface("CC touch", [
  { ...GO, extras: [{ trigger: "touch", type: "cc", channel: 1, number: 64 }] },
]);
const THREE_EXTRAS = surface("Three extras", [
  {
    ...SPACE,
    extras: [
      TOUCH_NOTE,
      { trigger: "touch", type: "cc", channel: 3, number: 64 },
      { trigger: "value", type: "cc", channel: 2, number: 74, source: "y" },
    ],
  },
]);
const RIBBON = region("Ribbon", "fader", 0, 0, 2, 6, 100, {
  output: "note",
  min: 60,
  max: 72,
  scale: "major",
});
const GATE = region("Gate", "fader", 2, 0, 2, 6, 60, {
  output: "note",
  noteMode: "gate",
});
const RIBBON_GATE = surface("Ribbon and gate", [RIBBON, GATE]);
const RIBBON_SPRING = surface("Ribbon spring", [
  { ...RIBBON, spring: true, springValue: 66 },
]);
const RIBBON_RELATIVE = surface("Ribbon relative", [
  { ...RIBBON, mode: "relative", speed: "full" },
]);
const PAD_NOTES = surface("Pad notes", [
  {
    ...SPACE,
    output: "note",
    min: 48,
    max: 72,
    scale: "minor-pentatonic",
  },
]);
const KNOB_NOTE = surface("Knob note", [
  { ...TURN, output: "note", min: 60, max: 84 },
]);
const RIBBONS_OFF = surface("Ribbons off", [
  { ...RIBBON, ...OFF },
  { ...GATE, ...OFF },
]);
const EXTRA_FIXTURES: readonly Surface[] = [
  TOUCHED,
  FROM_Y,
  OFF_PAD,
  DUO_GATE,
  VALUE_FADER,
  CC_TOUCH,
  THREE_EXTRAS,
  RIBBON_GATE,
  RIBBON_SPRING,
  RIBBON_RELATIVE,
  PAD_NOTES,
  KNOB_NOTE,
  RIBBONS_OFF,
];

/**
 * A surface with one element per kind named (change 17): the ceiling in kinds under five slots is
 * measured through the emitter, because every element receives by default - the receive half is
 * packed beside the branches - and the Setup is the packer's last slot. A multitouch pad stands
 * in for the XY pad under `multitouch`.
 */
function kindSurface(branches: readonly Branch[], multitouch = false): Surface {
  const by: Record<Branch, Region> = {
    "fader-v": FILTER,
    "fader-h": WIDE,
    button: GO,
    xy: multitouch ? DUO : SPACE,
    knob: TURN,
  };
  return surface(
    branches.join(" "),
    branches.map((b) => by[b]),
  );
}

/** The Timer runs this many ticks after a landing before a test sends MIDI in (change 17): its every run assigns the receive callback, and one parked in 255/4 is defined after the first. */
const RECEIVE_SETTLE = 12;

/** True for a text carrying either entry - the single-touch `O` or the multitouch variant's. */
const hasEntry = (text: string): boolean =>
  [
    ENTRY,
    MULTITOUCH_TEXT.entry,
    HAND_OVER_TEXT.entry,
    HAND_OVER_TEXT.entryMultitouch,
  ].some(
    (entry) => text.includes(entry) || text.includes(withTouchEntry(entry)),
  );

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
    for (const s of [
      ...FIXTURES,
      ...MULTITOUCH_FIXTURES,
      ...LATCH_FIXTURES,
      ...ONE_CELL_FIXTURES,
      ...EXTRA_FIXTURES,
    ]) {
      for (const slots of [2, 3, 5] as const) {
        const e = emitSurface(s, { slots });
        texts.push({ name: `${s.name} Timer (${slots})`, text: e.timer });
        if (e.mapmode !== undefined)
          texts.push({ name: `${s.name} 255/4 (${slots})`, text: e.mapmode });
        if (e.system !== undefined)
          texts.push({ name: `${s.name} 255/0`, text: e.system });
        if (e.systemTimer !== undefined)
          texts.push({ name: `${s.name} 255/6`, text: e.systemTimer });
        // Change 17: the Setup is the packer's last slot under five.
        if (e.runtime.placement.some((p) => p.slot === "setup"))
          texts.push({ name: `${s.name} Setup (${slots})`, text: e.setup });
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
    const withEntry = texts.filter(({ text }) => hasEntry(text)).length;
    expect(withEntry, "no text carried the entry").toBeGreaterThan(0);
    expect(started, "one onset per entry").toBe(withEntry);
    expect(
      texts.filter(({ text }) => text.includes(MULTITOUCH_TEXT.entry)).length,
      "the multitouch fixtures carry the variant's entry",
    ).toBe(MULTITOUCH_FIXTURES.length * 3);
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
      expect(n, `${name}: the live test`).toBe(hasEntry(text) ? 1 : 0);
    }
    // THE NAMES. The runtime defines S F I R O Q D K: the five it always
    // had, and three the trim frees (library-trim.ts) - never a name the
    // TRIMMED library still defines - and since change 17 E (as R), A, Y and
    // Z, four more the trim frees; S and F are the trimmed head's now (or the
    // Setup's under fewer slots). It calls N U X, every one a trimmed global;
    // `G` no more (the pictures are its own).
    // Every runtime - the single-touch and the multitouch variant (change 11), each with and
    // without the hand-over entry (change 18), each with and without change 21A's extras and
    // Notes (every piece on) - holds to it; `W` is defined only with them.
    const everyExtra: ExtrasOptions = {
      touch: true,
      gate: true,
      axis: true,
      extras: true,
      notes: true,
      value: true,
    };
    for (const [multitouch, handOver, extras] of [
      [false, false, undefined],
      [true, false, undefined],
      [false, true, undefined],
      [true, true, undefined],
      [false, false, everyExtra],
      [true, false, everyExtra],
      [false, true, everyExtra],
      [true, true, everyExtra],
    ] as const) {
      const whole = joinLua([
        STATE,
        ...runtimeParts(
          BRANCHES,
          multitouch,
          {
            rows: true,
            colour: { channel: 15, first: 100, brightness: 128 },
          },
          handOver,
          extras,
        ).map((p) => p.lua),
        sweepCall(20),
      ]);
      const defined = capitalDefinitions(whole);
      expect(defined).toEqual(
        [...RUNTIME_NAMES]
          .filter((n) => extras !== undefined || n !== "W")
          .sort(),
      );
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
      expect(
        ["Q", "D", "K", "E", "A", "Y", "Z"].every((n) =>
          TRIM_FREED_NAMES.includes(n),
        ),
      ).toBe(true);
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
      // region it landed in; the runtime's own Q is the painter, and since
      // change 21A its own W the Touch gate - called only where it is defined.
      expect(whole.includes(F("W", "("))).toBe(extras !== undefined);
      expect(TRIM_FREED_NAMES).toContain("W");
    }
  });

  it("7. the measured cost: canonical under compressScript, the parts, and the ceiling in kinds under two slots, three and five - every combination fits five", async () => {
    const lines: string[] = [];
    // Every packed text is a fixed point of the minifier on the first round.
    for (const s of [
      ...FIXTURES,
      ...MULTITOUCH_FIXTURES,
      ...LATCH_FIXTURES,
      ...ONE_CELL_FIXTURES,
      ...EXTRA_FIXTURES,
    ]) {
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
    // The receive half (change 17): the callback, and the colour input beside it.
    const withReceive = await canonical(
      joinLua([
        STATE,
        ...runtimeParts(BRANCHES, false, { rows: true }).map((p) => p.lua),
      ]),
    );
    lines.push(
      `the receive half: ${withReceive.cost - five.cost} with every branch (Y alone), the colour input's Z ${colourPart(255).length}`,
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
      // Five slots through a surface with one element per kind, every one receiving (change 17).
      const m5 = await measureSurface(atPickerCorner(kindSurface(branches)), {
        slots: 5,
      });
      const fiveCosts = [
        m5.systemTimer?.used ?? 0,
        m5.system?.used ?? 0,
        m5.mapmode?.used ?? 0,
        m5.timer.used,
        m5.setup.used,
      ];
      if (!m5.fits) overFive.push(`${name} ${fiveCosts.join("+")}`);
      expect(
        m5.emitted.runtime.fits,
        `${name}: the packer's word on five`,
      ).toBe(m5.fits);
      const total = fiveCosts.reduce((a, b) => a + b, 0);
      if (total > fiveWorst.used)
        fiveWorst = {
          name,
          used: total,
          free: 5 * EVENT_BUDGET - total,
        };
    }
    lines.push(
      `two slots, fits (Timer of ${EVENT_BUDGET}): ${fitsTwo.join(", ") || "none"}`,
    );
    lines.push(`two slots, over: ${overTwo.join(", ")}`);
    lines.push(`three slots, fits: ${fitsThree.join(", ") || "none"}`);
    lines.push(`three slots, over: ${overThree.join(", ") || "none"}`);
    lines.push(
      `five slots (one element per kind, every one receiving, the Setup the last slot), over: ${overFive.length === 0 ? "none - every combination fits" : overFive.join(", ")}; the dearest ${fiveWorst.name} at ${fiveWorst.used} of ${5 * EVENT_BUDGET} across the five strings`,
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
    expect(withReceive.cost - five.cost).toBe(PINNED.receive);
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
    // The note output rides in the channel word since change 17 (code -2), not the flag word.
    expect(flagsOf({ ...GO, output: "note" })).toBe(0);
    expect(flagsOf({ ...GO, output: "note", latch: true })).toBe(1);
    expect(channelWord({ ...GO, output: "note" })).toBe(-32);
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

  it("14. the trimmed library (answer 12; change 17): 255/0 keeps its own head of the two tables it reads, the map, U X N and the call, 255/6 the marker alone, both canonical and sliced from library.ts's parts; every fixture runs on them under five slots with a press, a move and a lift on each region and no error", async () => {
    // Change 17: the head is the trim's own (T and C, what X reads, and the runtime's contact
    // tables S and F, fresh on every landing) and E is the runtime's.
    expect(TRIMMED_LIBRARY.startsWith(`${TRIMMED_HEAD}KX={`)).toBe(true);
    expect(TRIMMED_HEAD).toBe("--[[@cb]]T={}C=0 S={}F={}");
    expect(TRIMMED_LIBRARY.endsWith(" self:tim()")).toBe(true);
    expect(TRIMMED_LIBRARY_TIMER).toBe(MARKER);
    expect(TOUCH_LIBRARY).toContain(
      TRIMMED_LIBRARY.slice(TRIMMED_HEAD.length, 200),
    );
    for (const fn of ["U", "X", "N"])
      expect(TRIMMED_LIBRARY).toContain(`function ${fn}(`);
    for (const fn of ["E", "W", "Q", "V", "G", "Z", "Y", "K", "A", "D"])
      expect(TRIMMED_LIBRARY + TRIMMED_LIBRARY_TIMER).not.toContain(
        `function ${fn}(`,
      );
    expect(TRIMMED_GLOBALS).toEqual([
      "C",
      "F",
      "KX",
      "KY",
      "N",
      "S",
      "T",
      "U",
      "X",
    ]);
    expect((await canonical(TRIMMED_LIBRARY)).rounds).toBe(0);
    expect(TRIM_FREES).toEqual({
      setup: TOUCH_LIBRARY.length - TRIMMED_LIBRARY.length,
      timer: TOUCH_LIBRARY_TIMER.length - MARKER.length,
    });
    // 842 -> 460 at change 10B; -> 363 at change 17 (the head's H P B L out and S F in, 8 less;
    // E, 88 and its join; the head's space before the map).
    expect(TRIM_FREES).toEqual({ setup: 479, timer: 864 });
    expect([TOUCH_LIBRARY.length, TRIMMED_LIBRARY.length]).toEqual([842, 363]);
    console.log(
      `the trim: 255/0 ${TOUCH_LIBRARY.length} -> ${TRIMMED_LIBRARY.length} (${TRIM_FREES.setup} freed), 255/6 ${TOUCH_LIBRARY_TIMER.length} -> ${TRIMMED_LIBRARY_TIMER.length} (${TRIM_FREES.timer} freed)`,
    );
    // Every fixture, under five slots, on the trimmed halves: the emitted
    // 255/0 and 255/6 open with the trimmed text, and a gesture on every
    // region raises nothing - the change 11, 18 and 18b fixtures too.
    for (const s of [
      ...FIXTURES,
      ...MULTITOUCH_FIXTURES,
      ...LATCH_FIXTURES,
      ...ONE_CELL_FIXTURES,
      ...EXTRA_FIXTURES,
    ]) {
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

  it("15. multitouch (change 11, answers 1a and 2a): two fingers on a Touches-2 pad send on both pairs with independent positions; a new finger takes the lowest free slot and a finger past the count is ignored; the crosshair is the union and a lifted finger's cross goes; Relative per finger; a one-finger pad beside it behaves as today; five fingers on five pairs", async () => {
    // The fixtures carry the variant, page 3 and the ten of 10B do not; the
    // seventh column carries the count (a one-finger pad's is its cc2).
    expect(hasMultitouch(MULTI.regions)).toBe(true);
    expect(hasMultitouch(PAGE3.regions)).toBe(false);
    expect(emitSurface(MULTI, { slots: 5 }).multitouch).toBe(true);
    expect(emitSurface(PAGE3, { slots: 5 }).multitouch).toBe(false);
    expect(seventhOf(DUO)).toBe(51 + 128);
    expect(seventhOf(FIVE)).toBe(61 + 4 * 128);
    expect(seventhOf(SPACE)).toBe(22);
    expect(touchesOf(SPACE)).toBe(1);
    expect(fingerController(50, 2)).toBe(52);
    expect([1, 2, 3, 4, 5].map((n) => fingerController(60, n))).toEqual([
      60, 62, 64, 66, 68,
    ]);
    expect(SLOT_COLUMNS).toEqual({ base: 17, perOffset: 3, cell: 5 });
    expect([1, 2, 5].map((n) => slotColumn(n, 0))).toEqual([17, 23, 41]);
    expect(slotColumn(1, SLOT_COLUMNS.cell)).toBe(22);
    // TWO FINGERS. Duo's box is columns 6..8, rows 3..5: its bottom-left LED
    // (6,5) reads 0,0 and its top-right (8,3) 127,127. Finger 0 holds slot 1
    // (50, 51), finger 1 slot 2 (52, 53); a move of one moves the other's
    // pair not at all.
    {
      const { host, sim } = await open(MULTI);
      try {
        const pair = (cc: number) => [
          sent(host.midi, cc),
          sent(host.midi, cc + 1),
        ];
        step(host, "down", 0, at(6, 5));
        expect(pair(50)).toEqual([[0], [0]]);
        step(host, "down", 1, at(8, 3));
        expect(pair(52)).toEqual([[127], [127]]);
        expect(pair(50), "finger 1's onset moved finger 0 not at all").toEqual([
          [0],
          [0],
        ]);
        step(host, "move", 0, at(7, 5));
        expect(pair(50)).toEqual([[0, 63], [0]]);
        expect(pair(52)).toEqual([[127], [127]]);
        // THE UNION: finger 0's cell (1,2) and finger 1's (2,0) - row 2,
        // column 1, row 0, column 2 - eight of the nine cells; (0,1) dark.
        expect(lit(sim, DUO)).toEqual([
          "0,0",
          "1,0",
          "2,0",
          "1,1",
          "2,1",
          "0,2",
          "1,2",
          "2,2",
        ]);
        // A THIRD FINGER on a two-finger pad is ignored: no pair 54, nothing
        // on the held pairs, the picture as it was, and its lift is silent.
        step(host, "down", 2, at(7, 4));
        step(host, "move", 2, at(6, 3));
        expect(pair(54)).toEqual([[], []]);
        expect(pair(50)).toEqual([[0, 63], [0]]);
        expect(pair(52)).toEqual([[127], [127]]);
        expect(lit(sim, DUO).length).toBe(8);
        step(host, "up", 2, at(6, 3));
        expect(host.midi.length).toBe(5);
        // A LIFTED FINGER's cross goes, the other's stays: finger 0 up leaves
        // row 0 and column 2 - finger 1's.
        step(host, "up", 0, at(7, 5));
        expect(lit(sim, DUO)).toEqual(["0,0", "1,0", "2,0", "2,1", "2,2"]);
        expect(host.midi.length, "a lift sends nothing").toBe(5);
        // THE LOWEST FREE SLOT: a new finger (id 3) is finger 1 again - it
        // sends on 50 and 51 (on change: x back to 0, y up to 127), not 54.
        step(host, "down", 3, at(6, 3));
        expect(pair(50)).toEqual([
          [0, 63, 0],
          [0, 127],
        ]);
        expect(pair(54)).toEqual([[], []]);
        expect(lit(sim, DUO), "both crosses again").toEqual([
          "0,0",
          "1,0",
          "2,0",
          "0,1",
          "2,1",
          "0,2",
          "2,2",
        ]);
        step(host, "move", 1, at(8, 4));
        expect(pair(52), "finger 1 still on its own pair").toEqual([
          [127],
          [127, 63],
        ]);
        step(host, "up", 1, at(8, 4));
        step(host, "up", 3, at(6, 3));
        expect(lit(sim, DUO), "cleared once every finger is up").toEqual([]);
        // The fader and the button beside the pad are what they were.
        step(host, "down", 0, at(0, 0));
        expect(sent(host.midi, FILTER.cc)).toEqual([127]);
        expect(lit(sim, FILTER).length).toBe(12);
        step(host, "up", 0, at(0, 0));
        step(host, "down", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        expect(sent(host.midi, GO.cc)).toEqual([127, 0]);
        host.run(30);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // FIVE FINGERS on five pairs 60..69, a sixth ignored; the middle finger
    // lifted, the next finger takes ITS slot (the lowest free), not a sixth.
    {
      const { host, sim } = await open(FIVE_PAD);
      try {
        const cells: [number, number][] = [
          [0, 4],
          [1, 3],
          [2, 2],
          [3, 1],
          [4, 0],
        ];
        cells.forEach(([c, r], i) => step(host, "down", i, at(c, r)));
        for (let n = 1; n <= 5; n += 1) {
          const cc = fingerController(FIVE.cc, n);
          expect(sent(host.midi, cc), `finger ${n} x`).toEqual([
            [0, 31, 63, 95, 127][n - 1],
          ]);
          expect(sent(host.midi, cc + 1), `finger ${n} y`).toEqual([
            [0, 31, 63, 95, 127][n - 1],
          ]);
        }
        expect(lit(sim, FIVE).length, "five crosses cover the pad").toBe(25);
        step(host, "down", 5, at(2, 4));
        expect(sent(host.midi, 70)).toEqual([]);
        expect(host.midi.length, "the sixth finger sent nothing").toBe(10);
        step(host, "up", 5, at(2, 4));
        // The middle finger up: only its own cell goes dark - every other
        // cell of row 2 and column 2 lies under another finger's line.
        step(host, "up", 2, at(2, 2));
        expect(lit(sim, FIVE).length, "the middle cross gone").toBe(24);
        expect(phase(sim, 2, 2)).toBe(0);
        step(host, "down", 6, at(2, 4));
        expect(sent(host.midi, 64), "slot 3's x again: 63, on change").toEqual([
          63,
        ]);
        expect(sent(host.midi, 65), "slot 3's y: 0 after 63").toEqual([63, 0]);
        expect(lit(sim, FIVE).length).toBe(25);
        for (const i of [0, 1, 3, 4, 6]) step(host, "up", i, at(0, 0));
        expect(lit(sim, FIVE)).toEqual([]);
        host.run(30);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // RELATIVE PER FINGER (half): a touch sends nothing; finger 0's move
    // right one cell is +64 raw -> 31 on its x, its y reported once at 0;
    // finger 1 holds its own pair - nothing until it moves, then its own y.
    {
      const { host } = await open(MULTI_RELATIVE);
      try {
        step(host, "down", 0, at(6, 5));
        step(host, "down", 1, at(8, 3));
        expect(host.midi.length, "two touches send nothing").toBe(0);
        step(host, "move", 0, at(7, 5));
        expect(sent(host.midi, 50)).toEqual([31]);
        expect(sent(host.midi, 51)).toEqual([0]);
        expect(sent(host.midi, 52)).toEqual([]);
        expect(sent(host.midi, 53)).toEqual([]);
        step(host, "move", 1, at(8, 4)); // down a cell: -32, clamped at 0
        expect(sent(host.midi, 52)).toEqual([0]);
        expect(sent(host.midi, 53)).toEqual([0]);
        step(host, "move", 1, at(8, 3)); // back up: +64 positions -> 32
        expect(sent(host.midi, 53)).toEqual([0, 32]);
        expect(sent(host.midi, 50), "finger 0 untouched by finger 1").toEqual([
          31,
        ]);
        // Held per finger between touches: finger 0 lifts, a new finger in
        // slot 1 continues from 31 on the x.
        step(host, "up", 0, at(7, 5));
        step(host, "down", 2, at(6, 3));
        step(host, "move", 2, at(7, 3));
        expect(sent(host.midi, 50), "continued from 31: +63").toEqual([31, 63]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // A ONE-FINGER PAD beside a two-finger one behaves as today (test 4's
    // sequence, the same values) and a second finger on it takes over (test
    // 2's rule: the first is expired and its later move sends nothing).
    {
      const { host } = await open(TWO_PADS);
      try {
        const both = () => [
          sent(host.midi, SPACE.cc),
          sent(host.midi, SPACE.cc2 ?? -1),
        ];
        step(host, "down", 0, at(3, 2));
        step(host, "move", 0, at(4, 2));
        step(host, "move", 0, at(4, 1));
        step(host, "move", 0, at(5, 0));
        expect(both()).toEqual([
          [0, 63, 127],
          [0, 63, 127],
        ]);
        step(host, "down", 1, at(3, 2));
        expect(both()).toEqual([
          [0, 63, 127, 0],
          [0, 63, 127, 0],
        ]);
        step(host, "move", 0, at(4, 1));
        expect(both(), "the expired finger sends nothing").toEqual([
          [0, 63, 127, 0],
          [0, 63, 127, 0],
        ]);
        step(host, "up", 1, at(3, 2));
        step(host, "up", 0, at(4, 1));
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("16. the multitouch variant, measured (change 11): three texts swapped, canonical; the entry inside 255/0's room; every kind combination beside a multitouch pad fits five slots but the one with every kind, which is over on the Timer and refused; a one-finger pad emits byte-identical strings", async () => {
    const lines: string[] = [];
    // THE TEXTS: fixed points, and their lengths against the single-touch three.
    const single = {
      release: RELEASE.length,
      entry: ENTRY.length,
      xy: BRANCH_TEXT.xy.length,
    };
    const measured: Record<string, number> = {};
    for (const [name, text] of Object.entries(MULTITOUCH_TEXT)) {
      const c = await canonical(text);
      expect(c.rounds, `${name} is not canonical: ${c.text}`).toBe(0);
      measured[name] = c.cost;
    }
    lines.push(
      `the variant's texts: R ${single.release} -> ${measured.release}, O ${single.entry} -> ${measured.entry} (the tail defaults are the Setup paint's, +${TAIL_DEFAULTS_LUA.length + 1} there once), I[4] ${single.xy} -> ${measured.xy}`,
    );
    expect(measured).toEqual(PINNED_MULTITOUCH.texts);
    // Every other part is the same text; the variant's parts are the
    // single-touch parts with those three swapped, the XY branch always among them.
    const plain = runtimeParts(BRANCHES);
    const multi = runtimeParts(BRANCHES, true);
    expect(multi.map((p) => p.name)).toEqual(plain.map((p) => p.name));
    multi.forEach((part, i) => {
      const twin = plain[i];
      if (["R", "O", "I[4]"].includes(part.name)) {
        expect(part.lua).not.toBe(twin.lua);
      } else expect(part.lua, part.name).toBe(twin.lua);
    });
    expect(runtimeParts(["fader-v"], true).map((p) => p.name)).toEqual([
      "R",
      "O",
      "Q",
      "D",
      "A",
      "V",
      "I[1]",
      "I[4]",
    ]);
    const five = await canonical(joinLua([STATE, ...multi.map((p) => p.lua)]));
    lines.push(`the multitouch runtime alone with every branch: ${five.cost}`);
    expect(five.cost).toBe(PINNED_MULTITOUCH.five);
    // THE CEILING IN KINDS beside a multitouch pad, on five slots: the pad
    // with every subset of the other kinds through the packer, fits / over.
    const others: Branch[] = ["fader-v", "fader-h", "button", "knob"];
    const fits: string[] = [];
    const over: string[] = [];
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
    for (let mask = 0; mask < 1 << others.length; mask += 1) {
      const branches = BRANCHES.filter(
        (b) => b === "xy" || others.some((o, i) => o === b && mask & (1 << i)),
      );
      // Through a surface (change 17): the pad, and every other kind receiving.
      const m = await measureSurface(
        atPickerCorner(kindSurface(branches, true)),
        { slots: 5 },
      );
      const costs = [
        m.systemTimer?.used,
        m.system?.used,
        m.mapmode?.used,
        m.timer.used,
        m.setup.used,
      ];
      expect(
        m.emitted.runtime.fits,
        `${label(branches)}: the packer's word`,
      ).toBe(m.fits);
      (m.fits ? fits : over).push(`${label(branches)} ${costs.join("+")}`);
    }
    lines.push(`five slots with a multitouch pad, fits: ${fits.join(", ")}`);
    lines.push(`five slots with a multitouch pad, over: ${over.join(", ")}`);
    expect(fits.map((f) => f.split(" ")[0])).toEqual(PINNED_MULTITOUCH.fits);
    expect(over.map((f) => f.split(" ")[0])).toEqual(PINNED_MULTITOUCH.over);
    // PAGE 3 with its pad at two fingers: the one surface shape that does not
    // fit - the four large parts cannot share the four slots - and the
    // measured cost model says so (the store's refusal reads it).
    const p5 = await measureSurface(PAGE3_MULTI, { slots: 5 });
    const plainPage3 = await measureSurface(PAGE3, { slots: 5 });
    lines.push(
      `page 3 with a two-finger pad: 255/6 ${p5.systemTimer?.used} + 255/0 ${p5.system?.used} + 255/4 ${p5.mapmode?.used} + Timer ${p5.timer.used} (over by ${-p5.timer.free}), Setup ${plainPage3.setup.used} -> ${p5.setup.used}; placement ${p5.emitted.runtime.placement.map((p) => `${p.name}:${p.slot}`).join(" ")}`,
    );
    expect(p5.fits).toBe(false);
    expect([
      p5.systemTimer?.used,
      p5.system?.used,
      p5.mapmode?.used,
      p5.timer.used,
      p5.setup.used,
    ]).toEqual(PINNED_MULTITOUCH.page3Five);
    console.log(lines.join(String.fromCharCode(10)));
    // Neither paint carries the tail defaults since change 17 (the Timer's): the data halves differ by the pad's row alone.
    expect(p5.emitted.parts.paint).toBe(plainPage3.emitted.parts.paint);
    // The same four elements without the knob, or without the button, fit.
    for (const s of [
      surface("No knob", [FILTER, DUO, GO]),
      surface("No button", [FILTER, DUO, TURN]),
      surface("No fader", [DUO, TURN, GO]),
    ]) {
      const m = await measureSurface(s, { slots: 5 });
      expect(m.fits, s.name).toBe(true);
      lines.push(
        `${s.name}: 255/6 ${m.systemTimer?.used} + 255/0 ${m.system?.used} + 255/4 ${m.mapmode?.used} + Timer ${m.timer.used}, fits`,
      );
    }
    // The Setup's price for the variant: the seventh column's count on the pad's row - never a
    // forced tail - and, since change 17, the channel word's receive bit (a one-finger pad
    // receives, a multitouch pad does not); the tail defaults and the receive assignment are the Timer's.
    const dup = (touches: number) =>
      emitSurface(surface("d", [{ ...DUO, touches }]), { slots: 5 });
    expect(dup(1).setup).toBe(
      emitSurface(surface("d", [{ ...DUO, touches: undefined }]), { slots: 5 })
        .setup,
    );
    expect(dup(1).parts.paint).not.toContain(TAIL_DEFAULTS_LUA);
    expect(dup(2).parts.paint).not.toContain(TAIL_DEFAULTS_LUA);
    expect(dup(1).timer).toContain(RECEIVE_ON);
    expect(dup(2).timer).toContain(RECEIVE_NONE);
    expect(regionRow({ ...DUO, touches: 1 })[6]).toBe(51);
    expect(regionRow({ ...DUO, touches: 2 })[6]).toBe(51 + 128);
    expect(regionRow({ ...DUO, touches: 5 })[6]).toBe(51 + 512);
    expect(regionTail({ ...DUO, touches: 5 }), "no tail forced").toEqual([]);
    expect(dup(2).setup.length - dup(1).setup.length).toBe(
      PINNED_MULTITOUCH.setupPriceOnePad,
    );
    // BYTE-IDENTICAL: a one-finger pad, the field present or absent, emits
    // exactly the strings it did; page 3 is the single-touch runtime.
    const one = emitSurface(
      { ...PAGE3, regions: PAGE3.regions.map((r) => ({ ...r, touches: 1 })) },
      { slots: 5 },
    );
    const was = emitSurface(PAGE3, { slots: 5 });
    for (const key of [
      "setup",
      "timer",
      "mapmode",
      "system",
      "systemTimer",
    ] as const)
      expect(one[key], key).toBe(was[key]);
    expect(was.timer + was.system).not.toContain(MULTITOUCH_TEXT.entry);
    console.log(
      [
        "The multitouch variant, measured (change 11, 2026-09-18):",
        ...lines,
      ].join("\n"),
    );
  }, 180000);

  it("17. the types on the wire (change 17, answer 2): the channel word carries the type and Receive; a controller, a channel pressure (the value, then 0) and a pitch bend (0, then the value - 64 is the centre 8192) on the fader, the knob and each XY axis on its own channel; a button's note on and off; a relative knob a controller whatever its type", async () => {
    // The row: the channel word is the bare wire channel for a controller that receives (the
    // column before change 17), plus 16 times the type's code, plus 128 when it does not receive.
    expect(channelWord(FILTER)).toBe(0);
    expect(channelWord({ ...FILTER, output: "pitchbend", channel: 5 })).toBe(
      52,
    );
    expect(channelWord({ ...FILTER, output: "pressure", channel: 16 })).toBe(
      47,
    );
    expect(channelWord({ ...GO, output: "note", channel: 3 })).toBe(-30);
    expect(channelWord({ ...FILTER, receive: false })).toBe(128);
    expect(channelWord({ ...GO, output: "note", receive: false })).toBe(96);
    // A relative knob keeps no position (never receives) and sends relative controller steps.
    expect(channelWord({ ...TURN, mode: "relative-twos" })).toBe(128);
    expect(
      channelWord({ ...TURN, mode: "relative-twos", output: "pitchbend" }),
    ).toBe(128);
    expect(
      typeOf({ ...TURN, mode: "relative-twos", output: "pitchbend" }),
    ).toBe("cc");
    // A pad with more than one touch does not receive either.
    expect(receivesOf(DUO)).toBe(false);
    expect(receivesOf(SPACE)).toBe(true);
    // A pitch bend's controller column is its first byte, 0; the Y axis on a word of its own is
    // the fifteenth column, forcing the tail - absent when it is the X axis's.
    expect(regionRow({ ...FILTER, output: "pitchbend" })[5]).toBe(0);
    expect(regionTail({ ...SPACE, outputY: "pressure", channelY: 9 })).toEqual([
      0, 127, 0, 40,
    ]);
    expect(regionTail({ ...SPACE, channelY: 1 })).toEqual([]);
    expect(regionTail(SPACE)).toEqual([]);
    expect(regionRow({ ...SPACE, outputY: "pitchbend" })[6]).toBe(0);

    const TYPES = surface("Types", [
      { ...FILTER, output: "pitchbend", channel: 5 },
      {
        ...SPACE,
        output: "pressure",
        channel: 16,
        outputY: "pitchbend",
        channelY: 9,
      },
      { ...TURN, output: "pressure", channel: 2 },
      { ...GO, output: "note", cc: 60, channel: 3 },
      { ...WIDE, cc: 25 },
    ]);
    const { host } = await open(TYPES);
    const wire = (from: number): string[] =>
      host.midi.slice(from).map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);
    try {
      // The fader at its LED in row 1, 101 (test 1): a pitch bend on channel 5 - 0, then 101.
      step(host, "down", 0, at(1, 1));
      step(host, "up", 0, at(1, 1));
      expect(wire(0)).toEqual(["4:224:0:101"]);
      // The pad at (4,1), 63 on both axes: X a channel pressure on 16 (the value first), Y a
      // pitch bend on 9.
      let from = host.midi.length;
      step(host, "down", 0, at(4, 1));
      step(host, "up", 0, at(4, 1));
      expect(wire(from)).toEqual(["15:208:63:0", "8:224:0:63"]);
      // The button, a note on 3: note-on at the max, note-off (128, 0) on the lift.
      from = host.midi.length;
      step(host, "down", 0, at(7, 0));
      step(host, "up", 0, at(7, 0));
      expect(wire(from)).toEqual(["2:144:60:127", "2:128:60:0"]);
      // The knob, a channel pressure on 2: every value sent the pressure's way.
      from = host.midi.length;
      step(host, "down", 0, ringPoint(TURN, 90));
      turn(host, TURN, 90, 250);
      step(host, "up", 0, ringPoint(TURN, 250));
      const knob = host.midi.slice(from);
      expect(knob.length).toBeGreaterThan(5);
      expect(
        knob.every((m) => m.ch === 1 && m.cmd === 208 && m.p2 === 0),
        wire(from).join(" "),
      ).toBe(true);
      // The controller beside them, unchanged: the horizontal fader's right LED is 127.
      from = host.midi.length;
      step(host, "down", 0, at(3, 7));
      expect(wire(from)).toEqual(["0:176:25:127"]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // A relative knob with a pitch bend stored sends its relative controller steps all the same.
    {
      const { host: h2 } = await open(
        surface("Relative type", [
          { ...TURN, mode: "relative-twos", output: "pitchbend" },
        ]),
      );
      try {
        step(h2, "down", 0, ringPoint(TURN, 90));
        turn(h2, TURN, 90, 130);
        expect(h2.midi.length).toBeGreaterThan(0);
        expect(h2.midi.every((m) => m.cmd === 176 && m.p1 === TURN.cc)).toBe(
          true,
        );
        expect(h2.errors, h2.errors.join(" | ")).toEqual([]);
      } finally {
        h2.close();
      }
    }
  });

  it("18. MIDI RX (change 17, answers 1i and 1ii): a host message on an element's type, channel and number sets its value and redraws its picture - the fader's bar, the button's light, the XY pad's crosshair at the received pair, the knob's arc - and is never echoed; a neighbour's traffic, another channel, another number, Receive off and a relative knob are ignored; a note-off folds into 0; the next touch continues from the received value", async () => {
    const REPORT = 13;
    const { host, sim } = await open(PAGE3);
    try {
      // The Timer assigns the callback on its every run (a callback parked in 255/4 on the second).
      host.run(RECEIVE_SETTLE);
      expect(
        host.midiIn(REPORT, 0, 176, 99, 64),
        "the Timer assigns the callback",
      ).toBe(true);
      // The fader: 101 is position 101, the bar four rows of six (as a finger at the LED in row 1).
      host.midiIn(REPORT, 0, 176, FILTER.cc, 101);
      host.tick();
      expect(lit(sim, FILTER).length).toBe(8);
      expect(phase(sim, 0, 1)).toBe(0);
      expect(phase(sim, 0, 2)).toBe(255);
      // Nothing echoed - and the received value is the last one sent: a press at the LED in row 1
      // sends nothing, a move to the top sends 127.
      expect(host.midi).toEqual([]);
      step(host, "down", 0, at(1, 1));
      expect(sent(host.midi, FILTER.cc)).toEqual([]);
      step(host, "move", 0, at(1, 0));
      expect(sent(host.midi, FILTER.cc)).toEqual([127]);
      step(host, "up", 0, at(1, 0));
      // Ignored: a neighbour's EXECUTE (14), another channel, another number.
      host.midiIn(14, 0, 176, FILTER.cc, 0);
      host.midiIn(REPORT, 1, 176, FILTER.cc, 0);
      host.midiIn(REPORT, 0, 176, FILTER.cc + 50, 0);
      host.tick();
      expect(lit(sim, FILTER).length, "the bar at the top, untouched").toBe(12);
      // The XY pad: X 127 then Y 0 - the crosshair through the bottom-right cell.
      host.midiIn(REPORT, 0, 176, SPACE.cc, 127);
      host.midiIn(REPORT, 0, 176, SPACE.cc2 ?? -1, 0);
      host.tick();
      expect(lit(sim, SPACE)).toEqual(["2,0", "2,1", "0,2", "1,2", "2,2"]);
      // The knob, absolute: 127 lights the whole arc (seven cells), 0 the low cell alone.
      host.midiIn(REPORT, 0, 176, TURN.cc, 127);
      host.tick();
      expect(lit(sim, TURN).length).toBe(7);
      host.midiIn(REPORT, 0, 176, TURN.cc, 0);
      host.tick();
      expect(lit(sim, TURN)).toEqual(["0,2"]);
      // The button (a controller, momentary): 127 lights it, 0 puts it out.
      host.midiIn(REPORT, 0, 176, GO.cc, 127);
      host.tick();
      expect(lit(sim, GO).length).toBe(4);
      host.midiIn(REPORT, 0, 176, GO.cc, 0);
      host.tick();
      expect(lit(sim, GO)).toEqual([]);
      expect(host.midi, "nothing echoed").toEqual(
        host.midi.filter((m) => m.p1 === FILTER.cc),
      );
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // A note button: a note-on lights it, a note-off (status 128, any velocity) folds into 0.
    {
      const { host, sim } = await open(NOTES);
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(REPORT, 0, 144, 60, 100);
        host.tick();
        expect(lit(sim, GO).length).toBe(4);
        host.midiIn(REPORT, 0, 128, 60, 64);
        host.tick();
        expect(lit(sim, GO)).toEqual([]);
        host.midiIn(REPORT, 0, 144, 60, 90);
        host.midiIn(REPORT, 0, 144, 60, 0);
        host.tick();
        expect(lit(sim, GO), "a note-on at 0 is off").toEqual([]);
        // A program change on the same channel and number is no note.
        host.midiIn(REPORT, 0, 192, 60, 0);
        host.tick();
        expect(lit(sim, GO)).toEqual([]);
        expect(host.midi).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Min and max: the received value maps back to a position - 50 of 20..80 is position 63,
    // three rows of six.
    {
      const { host, sim } = await open(SCALED);
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(REPORT, 0, 176, FILTER.cc, 50);
        host.tick();
        expect(lit(sim, FILTER).length).toBe(6);
        expect(host.midi).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Relative: the next touch continues from the received value (test 9's gesture sends 13 and
    // 38 from 0; from 100 it sends 113, then 127, clamped).
    {
      const { host } = await open(RELATIVE_HALF);
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(REPORT, 0, 176, FILTER.cc, 100);
        step(host, "down", 0, at(0, 3));
        step(host, "move", 0, at(0, 2));
        step(host, "move", 0, at(0, 0));
        expect(sent(host.midi, FILTER.cc)).toEqual([113, 127]);
      } finally {
        host.close();
      }
    }
    // A pitch bend receives on its status and ignores the number; a channel pressure reads its
    // first byte; a Y axis on its own channel.
    {
      const { host, sim } = await open(
        surface("Receive types", [
          { ...FILTER, output: "pitchbend", channel: 5 },
          {
            ...SPACE,
            output: "pressure",
            channel: 16,
            outputY: "cc",
            channelY: 9,
          },
        ]),
      );
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(REPORT, 4, 224, 0, 127);
        host.tick();
        expect(lit(sim, FILTER).length).toBe(12);
        host.midiIn(REPORT, 15, 208, 0, 0);
        host.midiIn(REPORT, 8, 176, SPACE.cc2 ?? -1, 127);
        host.tick();
        expect(lit(sim, SPACE)).toEqual(["0,0", "1,0", "2,0", "0,1", "0,2"]);
        expect(host.midi).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Receive off, a relative knob and a multitouch pad: nothing moves; with nothing receiving
    // the Setup says so and no callback is installed.
    {
      const s = surface("Deaf", [
        { ...FILTER, receive: false },
        { ...TURN, mode: "relative-twos" },
        DUO,
      ]);
      expect(emitSurface(s, { slots: 5 }).timer).toContain(RECEIVE_NONE);
      const { host, sim } = await open(s);
      try {
        host.run(RECEIVE_SETTLE);
        expect(host.midiIn(REPORT, 0, 176, FILTER.cc, 127)).toBe(false);
        host.tick();
        expect(lit(sim, FILTER)).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  });

  it("19. the colour input (change 17, answer 1iii): a controller on its channel numbered from its first recolours that element on layers 1 and 2 - 0 its own colour, 1..126 the hue wheel, 127 white - a blank too; dimmed by the surface's brightness; one past the surface and another channel do nothing", async () => {
    const REPORT = 13;
    const BLANK = region("Glow", "blank", 7, 7, 2, 2, 0, {
      colour: [0, 15, 0],
    });
    const s: Surface = {
      ...surface("Colours", [{ ...FILTER, colour: [0, 0, 15] }, SPACE, BLANK]),
      colourInput: { channel: 16, cc: 100 },
    };
    const colourAt = (sim: PadSim, col: number, row: number, layer: 1 | 2) =>
      sim.layer(screenToHw(col, row), layer).max.join(",");
    const { host, sim } = await open(s);
    try {
      host.run(RECEIVE_SETTLE);
      expect(colourAt(sim, 0, 0, 1)).toBe("0,0,255");
      // 1: the wheel's first hue, red; on both layers of every cell of element 1.
      host.midiIn(REPORT, 15, 176, 100, 1);
      host.tick();
      expect(colourAt(sim, 0, 0, 1)).toBe("255,0,0");
      expect(colourAt(sim, 1, 5, 2)).toBe("255,0,0");
      expect(colourAt(sim, 3, 0, 1), "element 2 untouched").toBe("255,255,255");
      // A third of the way round: 43 is green's sector.
      host.midiIn(REPORT, 15, 176, 100, 43);
      host.tick();
      expect(colourAt(sim, 0, 0, 1)).toBe("0,255,0");
      // 127 white, 0 the element's own colour back.
      host.midiIn(REPORT, 15, 176, 100, 127);
      host.tick();
      expect(colourAt(sim, 0, 0, 1)).toBe("255,255,255");
      host.midiIn(REPORT, 15, 176, 100, 0);
      host.tick();
      expect(colourAt(sim, 0, 0, 1)).toBe("0,0,255");
      // The blank, element 3: its cells are its index negated in M, and they recolour too.
      host.midiIn(REPORT, 15, 176, 102, 85);
      host.tick();
      expect(colourAt(sim, 8, 8, 1)).toBe("0,0,255");
      // One past the surface, another channel: nothing, and no error.
      host.midiIn(REPORT, 15, 176, 103, 1);
      host.midiIn(REPORT, 14, 176, 100, 1);
      host.tick();
      expect(colourAt(sim, 0, 0, 1)).toBe("0,0,255");
      expect(host.midi).toEqual([]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // At brightness 128 a received colour is dimmed as the paint's are.
    {
      const { host, sim } = await open({ ...s, brightness: 128 });
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(REPORT, 15, 176, 100, 127);
        host.tick();
        expect(colourAt(sim, 0, 0, 1)).toBe("128,128,128");
      } finally {
        host.close();
      }
    }
    // The text: the call's literals in Y, the hue wheel in Z, both canonical.
    const e = emitSurface(s, { slots: 5 });
    const y = e.runtime.parts.find((p) => p.name === RECEIVE_ENTRY)?.lua ?? "";
    expect(y).toContain("if t==176 and v[1]==15 then Z(n-99,w)end");
    expect((await canonical(colourPart(255))).rounds).toBe(0);
    expect((await canonical(colourPart(128))).rounds).toBe(0);
    expect(e.runtime.parts.map((p) => p.name)).toContain("Z");
    expect(
      emitSurface(
        { ...s, colourInput: undefined },
        { slots: 5 },
      ).runtime.parts.map((p) => p.name),
    ).not.toContain("Z");
  });

  it("20. an older draft (change 17): no type, per-axis or Receive field - its rows' channel columns are the bare wire channel as before, it sends exactly what it sent (tests 1 to 16 on the same fixtures), and RX is on: the Timer gains the receive assignment and the runtime the callback", () => {
    for (const s of [...FIXTURES, ...MULTITOUCH_FIXTURES]) {
      for (const r of s.regions) {
        if (r.kind === "blank") continue;
        const receiving = receivesOf(r);
        expect(regionRow(r)[7], `${s.name} ${r.name}`).toBe(
          r.channel -
            1 +
            (r.kind === "button" && r.output === "note" ? -32 : 0) +
            (receiving ? 0 : 128),
        );
      }
      const e = emitSurface(s, { slots: 5 });
      const anyReceives = s.regions.some(receivesOf);
      expect(e.timer, s.name).toContain(
        anyReceives ? RECEIVE_ON : RECEIVE_NONE,
      );
      expect(
        e.runtime.parts.some((p) => p.name === RECEIVE_ENTRY),
        s.name,
      ).toBe(anyReceives);
    }
  });

  it("21. Latch (change 18): On, a finger slid from one fader onto the next still drives the first alone; Off, it hands over - the first keeps its bar where the finger left it and the second jumps to the finger - a strummed button row presses each in turn with its off on the way out and passes an empty cell, a finger onto empty plate is released and keeps nothing, a sliding finger waits on a held region and takes it once the holder lifts, and an On element it reaches keeps it", async () => {
    /** A point one raw unit right of another - the same cell, a new sample (the host drops a sample identical to the contact's last, as the firmware does). */
    const nudge = ([x, y]: readonly [number, number]): [number, number] => [
      x + 1,
      y,
    ];
    /** Every controller message on 80..99 in the order sent, as `cc:value`. */
    const order = (midi: readonly HostMidi[]): string[] =>
      midi
        .filter((m) => m.cmd === 176 && m.p1 >= 80 && m.p1 < 100)
        .map((m) => `${m.p1}:${m.p2}`);
    // (1) ON, THE DEFAULT - today's rule, pinned: the finger lands on Lane A at its LED in row 4
    //     and slides up and across into Lane B's cells; Lane A follows it to row 1, Lane B hears nothing.
    {
      const { host, sim } = await open(LANES);
      try {
        step(host, "down", 0, at(1, 4));
        step(host, "move", 0, at(1, 3));
        step(host, "move", 0, at(2, 2));
        step(host, "move", 0, at(2, 1));
        expect(sent(host.midi, LANE_A.cc), "Lane A keeps the finger").toEqual([
          25, 50, 76, 101,
        ]);
        expect(sent(host.midi, LANE_B.cc), "Lane B hears nothing").toEqual([]);
        expect(lit(sim, LANE_B)).toEqual([]);
        step(host, "up", 0, at(2, 1));
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (2) OFF: the same slide hands over at the first sample in Lane B's cells - Lane A stops at
    //     the value it had (50) and keeps its bar there, Lane B presses at the finger (76, then 101).
    {
      const { host, sim } = await open(LANES_OFF);
      try {
        step(host, "down", 0, at(1, 4));
        step(host, "move", 0, at(1, 3));
        step(host, "move", 0, at(2, 2));
        step(host, "move", 0, at(2, 1));
        expect(order(host.midi)).toEqual(["80:25", "80:50", "81:76", "81:101"]);
        expect(
          lit(sim, LANE_A),
          "Lane A's bar where the finger left it: rows 4 and 5",
        ).toEqual(["0,4", "1,4", "0,5", "1,5"]);
        expect(lit(sim, LANE_B).length, "Lane B's bar: rows 2 to 5").toBe(8);
        // Back into Lane A: it hands over again - Lane B keeps its bar, Lane A jumps to row 2.
        step(host, "move", 0, at(1, 2));
        expect(order(host.midi).slice(4)).toEqual(["80:76"]);
        expect(lit(sim, LANE_B).length).toBe(8);
        step(host, "up", 0, at(1, 2));
        expect(
          order(host.midi).slice(5),
          "a fader's lift sends nothing",
        ).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (3) A STRUM: four momentary buttons Off, an empty cell before the last; one finger across
    //     them presses each in turn and sends its off as it leaves - the empty cell releases the
    //     third and the fourth still takes the finger - and the lift is the last one's off.
    {
      const { host, sim } = await open(STRUM);
      try {
        step(host, "down", 0, at(0, 8));
        for (const col of [1, 2, 3, 4]) step(host, "move", 0, at(col, 8));
        expect(order(host.midi)).toEqual([
          "90:127",
          "90:0",
          "91:127",
          "91:0",
          "92:127",
          "92:0",
          "93:127",
        ]);
        expect(phase(sim, 4, 8), "the fourth lit").toBe(255);
        expect(phase(sim, 0, 8), "the first dark").toBe(0);
        step(host, "up", 0, at(4, 8));
        expect(order(host.midi).slice(7)).toEqual(["93:0"]);
        expect(phase(sim, 4, 8)).toBe(0);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // The same row at the default: the first button keeps the finger until the lift.
    {
      const { host } = await open(
        surface(
          "Strum on",
          STRUM.regions.map((r) => ({ ...r, latchTouch: undefined })),
        ),
      );
      try {
        step(host, "down", 0, at(0, 8));
        for (const col of [1, 2, 3, 4]) step(host, "move", 0, at(col, 8));
        step(host, "up", 0, at(4, 8));
        expect(order(host.midi)).toEqual(["90:127", "90:0"]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (4) ONTO EMPTY PLATE: an Off fader's finger that leaves for empty cells is released (its bar
    //     kept, nothing sent) and keeps nothing while it crosses them; it takes the next Off element
    //     it reaches. An Off spring fader left for empty plate springs back as on a lift. A finger
    //     that LANDED on empty plate takes nothing, whatever it crosses (the rule before change 18).
    {
      const { host, sim } = await open(ROAM);
      try {
        step(host, "down", 0, at(0, 4));
        step(host, "move", 0, at(4, 4));
        step(host, "move", 0, at(4, 1));
        expect(order(host.midi)).toEqual(["80:25"]);
        expect(lit(sim, ROAM.regions[0]).length, "the bar kept").toBe(2);
        step(host, "move", 0, at(3, 6));
        expect(order(host.midi)).toEqual(["80:25", "90:127"]);
        step(host, "up", 0, at(3, 6));
        expect(order(host.midi)).toEqual(["80:25", "90:127", "90:0"]);
        // The spring fader: pressed at row 1, left for empty plate - its spring value (64) is sent.
        step(host, "down", 1, at(5, 1));
        step(host, "move", 1, at(7, 1));
        expect(sent(host.midi, 82)).toEqual([101, 64]);
        step(host, "up", 1, at(7, 1));
        // Landed on empty: slides across the button and the fader and sends nothing.
        const before = host.midi.length;
        step(host, "down", 2, at(4, 6));
        step(host, "move", 2, at(3, 6));
        step(host, "move", 2, at(0, 2));
        step(host, "up", 2, at(0, 2));
        expect(host.midi.length, "a finger that landed on empty").toBe(before);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (5) A HELD REGION WAITS: finger 1 holds Keep (On); finger 0 slides from Leave (Off) onto
    //     it - Leave's off goes, Keep is not pressed again, and the finger waits on nothing while
    //     finger 1 holds it; finger 1 lifts, and finger 0's next sample takes Keep. Keep is On, so
    //     it keeps finger 0 on the slide on into Past, which hears nothing.
    {
      const { host } = await open(WAIT);
      try {
        step(host, "down", 1, at(1, 8));
        step(host, "down", 0, at(0, 8));
        step(host, "move", 0, at(1, 8));
        step(host, "move", 0, nudge(at(1, 8)));
        expect(order(host.midi)).toEqual(["91:127", "90:127", "90:0"]);
        step(host, "up", 1, at(1, 8));
        expect(order(host.midi).slice(3)).toEqual(["91:0"]);
        step(host, "move", 0, at(1, 8));
        expect(order(host.midi).slice(4), "taken once free").toEqual([
          "91:127",
        ]);
        step(host, "move", 0, at(2, 8));
        step(host, "move", 0, at(3, 8));
        expect(
          order(host.midi).slice(5),
          "Keep is On: Past hears nothing",
        ).toEqual([]);
        step(host, "up", 0, at(3, 8));
        expect(order(host.midi).slice(5)).toEqual(["91:0"]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (6) A MULTITOUCH PAD Off beside an Off button: a finger on the pad holds it, so a finger
    //     slid in from the button waits even with the second slot free; alone, it takes slot 1
    //     (the pad's own pair); slid back out onto the button its cross goes and the button presses.
    {
      const { host, sim } = await open(MULTI_OFF);
      try {
        step(host, "down", 0, at(8, 5));
        step(host, "down", 1, at(5, 4));
        step(host, "move", 1, at(7, 4));
        expect(sent(host.midi, 95)).toEqual([127, 0]);
        expect(sent(host.midi, 52), "no second pair: the finger waits").toEqual(
          [],
        );
        const padBefore = sent(host.midi, DUO.cc).length;
        step(host, "up", 0, at(8, 5));
        step(host, "move", 1, nudge(at(7, 4)));
        expect(sent(host.midi, DUO.cc).length, "slot 1 taken").toBe(
          padBefore + 1,
        );
        expect(lit(sim, DUO)).toEqual(["1,0", "0,1", "1,1", "2,1", "1,2"]);
        step(host, "move", 1, at(5, 4));
        expect(lit(sim, DUO), "the cross gone with the finger").toEqual([]);
        expect(sent(host.midi, 95)).toEqual([127, 0, 127]);
        step(host, "up", 1, at(5, 4));
        expect(sent(host.midi, 95)).toEqual([127, 0, 127, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (7) RX is untouched by the mark: page 3 with every element Off receives as page 3 does.
    {
      const { host, sim } = await open(PAGE3_OFF);
      try {
        host.run(RECEIVE_SETTLE);
        host.midiIn(13, 0, 176, FILTER.cc, 101);
        host.tick();
        expect(lit(sim, FILTER).length).toBe(8);
        expect(host.midi).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  });

  it("22. Latch, measured (change 18): the hand-over entry and `Y`'s rows are texts swapped in - canonical, the two parts that differ - only when an element is Off; every fixture at On (the field absent or true) emits byte-identical strings; page 3 before and after on five slots; the ceiling in kinds with every element Off, beside a one-finger pad and beside a multitouch pad", async () => {
    const lines: string[] = [];
    // THE TEXTS: fixed points, and their price over the entries they replace.
    const measured: Record<string, number> = {};
    for (const [name, text] of Object.entries(HAND_OVER_TEXT)) {
      const c = await canonical(text);
      expect(c.rounds, `${name} is not canonical: ${c.text}`).toBe(0);
      measured[name] = c.cost;
    }
    lines.push(
      `the hand-over entry: O ${ENTRY.length} -> ${measured.entry} (+${measured.entry - ENTRY.length}); under multitouch ${MULTITOUCH_TEXT.entry.length} -> ${measured.entryMultitouch} (+${measured.entryMultitouch - MULTITOUCH_TEXT.entry.length})`,
    );
    expect(measured).toEqual(PINNED_LATCH.texts);
    expect(entryText(false, false)).toBe(ENTRY);
    expect(entryText(true, false)).toBe(MULTITOUCH_TEXT.entry);
    // The parts: the same names and texts but `O` and `Y` (single-touch and multitouch alike).
    for (const multitouch of [false, true]) {
      const plain = runtimeParts(BRANCHES, multitouch, { rows: true });
      const off = runtimeParts(BRANCHES, multitouch, { rows: true }, true);
      expect(off.map((p) => p.name)).toEqual(plain.map((p) => p.name));
      off.forEach((part, i) => {
        if (part.name === "O" || part.name === RECEIVE_ENTRY)
          expect(part.lua).not.toBe(plain[i].lua);
        else expect(part.lua, part.name).toBe(plain[i].lua);
      });
    }
    // BYTE-IDENTICAL AT ON: every earlier fixture with Latch absent or On (`true`) on every
    // region emits exactly the strings it did, under every slot count - the row carries no mark
    // and the entry is the one it was.
    for (const s of [...FIXTURES, ...MULTITOUCH_FIXTURES, LANES]) {
      expect(hasHandOver(s.regions), s.name).toBe(false);
      const on: Surface = {
        ...s,
        regions: s.regions.map((r) => ({ ...r, latchTouch: true })),
      };
      for (const slots of [2, 3, 5] as const) {
        const was = emitSurface(s, { slots });
        const now = emitSurface(on, { slots });
        for (const key of [
          "setup",
          "timer",
          "mapmode",
          "system",
          "systemTimer",
        ] as const)
          expect(now[key], `${s.name} ${key} (${slots})`).toBe(was[key]);
        expect(was.handOver).toBe(false);
      }
    }
    // A blank takes no touch: Latch Off on one is read On - no mark, no variant.
    const blankOff = surface("Blank off", [
      FILTER,
      region("Wash", "blank", 7, 7, 2, 2, 0, { latchTouch: false }),
    ]);
    expect(latchTouchOf(blankOff.regions[1])).toBe(true);
    expect(emitSurface(blankOff, { slots: 5 }).setup).toBe(
      emitSurface(
        surface("Blank off", [
          FILTER,
          { ...blankOff.regions[1], latchTouch: undefined },
        ]),
        {
          slots: 5,
        },
      ).setup,
    );
    // One element Off swaps the entry in; the bit rides that element's channel word alone.
    const oneOff = emitSurface(
      surface("One off", [FILTER, { ...GO, latchTouch: false }]),
      { slots: 5 },
    );
    expect(oneOff.handOver).toBe(true);
    expect(oneOff.parts.regionTable).toBe(
      renderRegionTable([FILTER, { ...GO, latchTouch: false }]),
    );
    expect(regionRow({ ...GO, latchTouch: false })[7]).toBe(
      regionRow(GO)[7] + HAND_OVER_BIT,
    );
    expect(regionRow({ ...FILTER, latchTouch: true })).toEqual(
      regionRow(FILTER),
    );
    expect(
      [
        oneOff.setup,
        oneOff.timer,
        oneOff.mapmode,
        oneOff.system,
        oneOff.systemTimer,
      ].join(" "),
    ).toContain(HAND_OVER_TEXT.entry);
    expect(handsOver({ ...GO, latchTouch: false })).toBe(true);
    // PAGE 3 on five slots, every element receiving: at On, one element Off, and all four Off.
    const five = async (s: Surface) => {
      const m = await measureSurface(atPickerCorner(s), { slots: 5 });
      return {
        costs: [
          m.systemTimer?.used,
          m.system?.used,
          m.mapmode?.used,
          m.timer.used,
          m.setup.used,
        ],
        fits: m.fits,
        placement: m.emitted.runtime.placement
          .map((p) => `${p.name}:${p.slot}`)
          .join(" "),
      };
    };
    const page3 = await five(PAGE3);
    const page3Off = await five(PAGE3_OFF);
    lines.push(
      `page 3, five slots (255/6, 255/0, 255/4, Timer, Setup): at On ${page3.costs.join(" / ")} (${page3.fits ? "fits" : "over"}); every element Off ${page3Off.costs.join(" / ")} (${page3Off.fits ? "fits" : "over"}; ${page3Off.placement})`,
    );
    const single: string[] = [];
    for (const r of PAGE3.regions) {
      const m = await five(
        surface(
          `Page 3, ${r.name} off`,
          PAGE3.regions.map((q) => (q === r ? { ...q, ...OFF } : q)),
        ),
      );
      single.push(`${r.name} ${m.costs.join("/")} ${m.fits ? "fits" : "over"}`);
    }
    lines.push(`page 3 with one element Off: ${single.join("; ")}`);
    // Page 3 with Receive off everywhere and every element Off: the receive half's room.
    const quiet = await five(
      surface(
        "Page 3 quiet off",
        PAGE3_OFF.regions.map((r) => ({ ...r, receive: false })),
      ),
    );
    lines.push(
      `page 3, every element Off and Receive off: ${quiet.costs.join(" / ")} (${quiet.fits ? "fits" : "over"})`,
    );
    expect(page3.costs).toEqual(PINNED.page3Five);
    expect(page3Off.costs).toEqual(PINNED_LATCH.page3Off);
    expect(page3Off.fits).toBe(PINNED_LATCH.page3OffFits);
    expect(single).toEqual(PINNED_LATCH.page3Single);
    expect(quiet.fits).toBe(true);
    // THE CEILING IN KINDS, every element Off and receiving, on five slots: every combination,
    // then every combination beside a multitouch pad (the two variants together).
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
    const offSurface = (s: Surface): Surface => ({
      ...s,
      regions: s.regions.map((r) => ({ ...r, ...OFF })),
    });
    const over: string[] = [];
    for (let mask = 1; mask < 1 << BRANCHES.length; mask += 1) {
      const branches = BRANCHES.filter((_, i) => mask & (1 << i));
      const m = await measureSurface(
        atPickerCorner(offSurface(kindSurface(branches))),
        { slots: 5 },
      );
      expect(
        m.emitted.runtime.fits,
        `${label(branches)}: the packer's word`,
      ).toBe(m.fits);
      if (!m.fits) over.push(label(branches));
    }
    const others: Branch[] = ["fader-v", "fader-h", "button", "knob"];
    const overMulti: string[] = [];
    for (let mask = 0; mask < 1 << others.length; mask += 1) {
      const branches = BRANCHES.filter(
        (b) => b === "xy" || others.some((o, i) => o === b && mask & (1 << i)),
      );
      const m = await measureSurface(
        atPickerCorner(offSurface(kindSurface(branches, true))),
        { slots: 5 },
      );
      if (!m.fits) overMulti.push(label(branches));
    }
    lines.push(
      `five slots, every element Off and receiving, over: ${over.join(", ") || "none"}; beside a multitouch pad, over: ${overMulti.join(", ") || "none"}`,
    );
    expect(over).toEqual(PINNED_LATCH.over);
    expect(overMulti).toEqual(PINNED_LATCH.overMulti);
    console.log(
      ["Latch, measured (change 18, 2026-09-23):", ...lines].join("\n"),
    );
  }, 240000);

  it("23. the one-cell fader (change 18b): a fader one cell across the axis it does not read - 1 x 6, 1 x 2, 6 x 1, 2 x 1, each a size the editor allows - reads and sends as a wider one, relative with its spring and Latch Off too; `A` reads each axis through `V`, whose divisor is clamped to one cell, every position on every box two cells and up the same number as before in the VM, measured against three other forms; an XY pad one cell wide is refused by the editor; and the entry never lands in the touch Timer beside a receive callback", async () => {
    // THE EDITOR ALLOWS THEM: every one-cell fader validates; an XY pad one cell wide or tall does
    // not (the pad reads both axes, so its minimum is 2 x 2).
    for (const r of [THIN, STUB, FLAT, NUB])
      expect(validate(r, surface("Empty", [])).ok, r.name).toBe(true);
    for (const pad of [
      { ...SPACE, w: 1 },
      { ...SPACE, h: 1 },
    ]) {
      const refused = validate(pad, surface("Empty", []));
      expect(refused.ok, `${pad.w} x ${pad.h} pad`).toBe(false);
      if (!refused.ok)
        expect(refused.problem.message).toBe(
          GEOMETRY_COPY.tooSmall(pad, { w: 2, h: 2 }),
        );
    }
    // (1) EVERY ONE-CELL FADER SENDS, under five slots (the landing) and three: the 1 x 6 as
    //     Filter does in test 3 (127 at its top LED, 0 at its bottom, 76 at row 2), a wobble across
    //     the axis it does not read sends nothing; the 1 x 2 127 and 0; the 6 x 1 0 at its left LED,
    //     127 at its right, 50 at column 2; the 2 x 1 0 and 127; the pad beside them as test 4's.
    for (const slots of [5, 3] as const) {
      const { host, sim } = await open(ONE_CELL, { slots });
      try {
        step(host, "down", 0, at(0, 0));
        step(host, "move", 0, at(0, 5));
        step(host, "move", 0, at(0, 2));
        step(host, "move", 0, [KX[0] + 1, KY[2]]);
        step(host, "move", 0, [KX[0] - 1, KY[2]]);
        expect(sent(host.midi, THIN.cc), `${slots}: 1 x 6`).toEqual([
          127, 0, 76,
        ]);
        expect(lit(sim, THIN), "the bar from the bottom to row 3").toEqual([
          "0,3",
          "0,4",
          "0,5",
        ]);
        step(host, "up", 0, at(0, 2));
        step(host, "down", 1, at(2, 0));
        step(host, "move", 1, at(2, 1));
        step(host, "up", 1, at(2, 1));
        expect(sent(host.midi, STUB.cc), `${slots}: 1 x 2`).toEqual([127, 0]);
        step(host, "down", 2, at(0, 8));
        step(host, "move", 2, at(5, 8));
        step(host, "move", 2, at(2, 8));
        step(host, "move", 2, [KX[2], KY[8] - 1]);
        expect(sent(host.midi, FLAT.cc), `${slots}: 6 x 1`).toEqual([
          0, 127, 50,
        ]);
        expect(lit(sim, FLAT), "the bar from the left to column 1").toEqual([
          "0,0",
          "1,0",
        ]);
        step(host, "up", 2, at(2, 8));
        step(host, "down", 3, at(7, 8));
        step(host, "move", 3, at(8, 8));
        step(host, "up", 3, at(8, 8));
        expect(sent(host.midi, NUB.cc), `${slots}: 2 x 1`).toEqual([0, 127]);
        step(host, "down", 4, at(3, 2));
        step(host, "move", 4, at(5, 0));
        expect([
          sent(host.midi, SPACE.cc),
          sent(host.midi, SPACE.cc2 ?? -1),
        ]).toEqual([
          [0, 127],
          [0, 127],
        ]);
        step(host, "up", 4, at(5, 0));
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (2) RELATIVE AT FULL WITH THE SPRING AT 100: the touch anchors and sends nothing, a slide
    //     from the bottom LED to the top adds the whole travel to the spring position (clamped:
    //     127), the lift springs back to 100.
    {
      const { host } = await open(THIN_SPRING);
      try {
        step(host, "down", 0, at(0, 5));
        expect(sent(host.midi, THIN.cc), "the touch anchors").toEqual([]);
        step(host, "move", 0, at(0, 0));
        step(host, "up", 0, at(0, 0));
        expect(sent(host.midi, THIN.cc)).toEqual([127, 100]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (3) LATCH OFF, TWO 1 x 6 SIDE BY SIDE: a finger slid from Thin into Thin 2 hands over as
    //     test 21's lanes do - Thin stops at 50, Thin 2 jumps to the finger (76, 101).
    {
      const { host } = await open(THIN_OFF);
      try {
        step(host, "down", 0, at(0, 4));
        step(host, "move", 0, at(0, 3));
        step(host, "move", 0, at(1, 2));
        step(host, "move", 0, at(1, 1));
        step(host, "up", 0, at(1, 1));
        expect(
          host.midi.filter((m) => m.cmd === 176).map((m) => `${m.p1}:${m.p2}`),
        ).toEqual(["70:25", "70:50", "74:76", "74:101"]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (4) THE GUARD CHANGES NO NUMBER: `A` before change 18b (both divisors bare, as `A0`) and `A`
    //     now with `V`, run side by side in the VM over every box two cells and up on each axis
    //     (the offset 0..7, the length 2..9 - offset) and every raw coordinate -4..131 - the count
    //     of positions that differ, sent as a controller, is 0; the count compared, 1 when it is
    //     the figure below. Floor division twice is floor division once by the product (a, b > 0).
    const before =
      "function A0(r,x,y)return " +
      "glim((U(x,KX)-r[1]*64)*127//((r[3]-1)*64),0,127)," +
      "glim(((r[2]+r[4]-1)*64-U(y,KY))*127//((r[4]-1)*64),0,127)end";
    {
      const probe =
        `${before} ${AXIS} ${POSITION} local d,n=0,0 ` +
        "for o=0,7 do for l=2,9-o do local r={o,o,l,l}" +
        "for v=-4,131 do local a,b=A(r,v,v)local c,e=A0(r,v,v)" +
        "n=n+1 if a~=c or b~=e then d=d+1 end end end end " +
        `self:gms(0,176,1,d)self:gms(0,176,2,n==${POSITION_PROBE_COUNT} and 1 or 0)`;
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: probe,
        timer: MARKER,
      });
      try {
        host.tick();
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        expect(sent(host.midi, 1), "positions that differ").toEqual([0]);
        expect(sent(host.midi, 2), "positions compared").toEqual([1]);
      } finally {
        host.close();
      }
    }
    // (5) THE PRICE, canonical under the pinned minifier: `A` and `V` against change 17's `A`, and
    //     against the other honest forms - the clamp written into both of `A`'s formulas (one
    //     part), `A` handed the kind so it computes only the axis read, and a per-axis
    //     `len>1 and ... or 0`. `V` is a name the trim freed and no library text the runtime runs
    //     calls (the full library's `V` clears a block for `E` and `G`; `E` is the runtime's own
    //     since change 17, `G` is never called). The bare divisor on a one-cell axis is what raised
    //     before (the VM's own words).
    const H0 = "glim((U(x,KX)-r[1]*64)*127//((r[3]-1)*64),0,127)";
    const V0 = "glim(((r[2]+r[4]-1)*64-U(y,KY))*127//((r[4]-1)*64),0,127)";
    // The shipped two are fixed points of the minifier; a measured alternative is costed as
    // the minifier leaves it.
    for (const text of [POSITION, AXIS]) {
      const c = await canonical(text);
      expect(c.rounds, c.text).toBe(0);
    }
    const cost = async (text: string): Promise<number> =>
      (await canonical(text)).cost;
    const forms = {
      before: await cost(before.replace("A0", "A")),
      shipped:
        (await cost(POSITION)) +
        (await cost(AXIS)) -
        PINNED_ONE_CELL.positionBefore,
      inline:
        (await cost(
          "function A(r,x,y)return " +
            "glim((U(x,KX)-r[1]*64)*127//glim(r[3]-1,1,9)//64,0,127)," +
            "glim(((r[2]+r[4]-1)*64-U(y,KY))*127//glim(r[4]-1,1,9)//64,0,127)end",
        )) - PINNED_ONE_CELL.positionBefore,
      kind:
        (await cost(
          `function A(r,x,y)local k=r[5]return k~=1 and ${H0},k~=2 and ${V0} end`,
        )) - PINNED_ONE_CELL.positionBefore,
      perAxis:
        (await cost(
          `function A(r,x,y)return r[3]>1 and ${H0} or 0,r[4]>1 and ${V0} or 0 end`,
        )) - PINNED_ONE_CELL.positionBefore,
    };
    expect([POSITION.length, AXIS.length]).toEqual(PINNED_ONE_CELL.parts);
    expect(forms).toEqual(PINNED_ONE_CELL.forms);
    expect(RUNTIME_NAMES).toContain("V");
    expect(TRIM_FREED_NAMES).toContain("V");
    await expect(
      createLuaHost({
        sim: new PadSim(blankPadState()),
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: "local r={0,0,1,6}local a=(0-r[1]*64)*127//((r[3]-1)*64)",
        timer: MARKER,
      }),
      "the bare divisor on a one-cell axis",
    ).rejects.toThrow("attempt to divide by zero");
    // (6) THE ENTRY NEVER LANDS IN THE TOUCH TIMER WHILE A RECEIVE CALLBACK IS PACKED: `V` moved
    //     page 3's placement, and first fit put `O` in the Timer - which re-runs its body every
    //     period, so each run made a new `O` and `Y`'s `s.touch_cb~=O` ignored every host message
    //     (test 18 caught it). Every fixture that fits, under three and five slots, with a receive
    //     half: `O` in another slot; the multitouch and hand-over entries alike.
    let pinned = 0;
    for (const s of [
      ...FIXTURES,
      ...MULTITOUCH_FIXTURES,
      ...LATCH_FIXTURES,
      ...ONE_CELL_FIXTURES,
    ]) {
      for (const slots of [3, 5] as const) {
        const e = emitSurface(s, { slots });
        if (e.receive === undefined || !e.runtime.fits) continue;
        const slot = e.runtime.placement.find((p) => p.name === "O")?.slot;
        expect(slot, `${s.name} (${slots})`).not.toBe("timer");
        pinned += 1;
      }
    }
    expect(pinned).toBe(PINNED_ONE_CELL.entryPinned);
    console.log(
      `The one-cell fader (change 18b, 2026-09-23): A ${forms.before} -> A ${POSITION.length} + V ${AXIS.length} (+${forms.shipped}); the clamp inline in A +${forms.inline}, A handed the kind +${forms.kind}, len>1 per axis +${forms.perAxis}; ${POSITION_PROBE_COUNT} positions compared before/after in the VM, 0 differ`,
    );
  }, 120000);

  it("24. extra messages and a Note on a continuous output (change 21A): a pad's Touch note goes on at the landing after its X and Y, off at the lift, its velocity fixed or From Y; every release path sends the off exactly once - a lift, the sweep, a 9, the same id pressed again, another finger, a hand-over's departure and its arrival; a multitouch pad's note is a gate for the pad; a Value CC follows a fader on its own channel; a Touch CC is 127 then 0; three extras on one element; an element without extras sends as before; a Pitch ribbon plays its scale, the old note's off before the new one's on, never two held, and a Gate plays its note at the landing's value", async () => {
    /** One note's messages, in order, as `status:velocity`. */
    const note = (midi: readonly HostMidi[], n: number): string[] =>
      midi
        .filter((m) => (m.cmd === 144 || m.cmd === 128) && m.p1 === n)
        .map((m) => `${m.cmd}:${m.p2}`);
    /** Every note message in order, as `status:note:velocity`. */
    const notes = (midi: readonly HostMidi[]): string[] =>
      midi
        .filter((m) => m.cmd === 144 || m.cmd === 128)
        .map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
    /** No hang, no echo: per note, on and off alternate from an on and end on an off; and never more than `most` notes sound at once. */
    const balanced = (midi: readonly HostMidi[], most = 1): void => {
      const sounding = new Set<string>();
      for (const m of midi) {
        if (m.cmd !== 144 && m.cmd !== 128) continue;
        const key = `${m.ch}:${m.p1}`;
        if (m.cmd === 144) {
          expect(sounding.has(key), `a second on for ${key}`).toBe(false);
          sounding.add(key);
          expect(sounding.size, "notes held at once").toBeLessThanOrEqual(most);
        } else {
          expect(sounding.has(key), `an off with no on for ${key}`).toBe(true);
          sounding.delete(key);
        }
      }
      expect([...sounding], "a note left hanging").toEqual([]);
    };
    const report: string[] = [];

    // THE MODEL AND THE ROW. The Touch note rides the pad's row as `m`; the Pitch's code is -3,
    // a Note never receives; nothing in the row's numeric columns moves for an extra.
    expect(regionRow(GATE_PAD)).toEqual(regionRow(SPACE));
    expect(renderRegionTable([GATE_PAD])).toBe(
      `J={{${regionRow(SPACE).join(",")},m={{-32,48,100}}}}`,
    );
    expect(channelWord(RIBBON)).toBe(0 - 48 + 128);
    expect(channelWord(GATE)).toBe(0 - 32 + 128);
    expect(receivesOf(RIBBON) || receivesOf(GATE)).toBe(false);
    expect(
      regionRow(RIBBON)[5],
      "a Pitch's number column is its velocity",
    ).toBe(100);
    expect(renderRegionTable([RIBBON])).toContain(",[24]={0,2,4,5,7,9,11}}");
    expect(
      [60, 61, 62, 63, 64, 65, 66, 71, 72].map((v) => pitchOf(RIBBON, "x", v)),
    ).toEqual([60, 60, 62, 62, 64, 65, 65, 71, 72]);

    // (1) THE PAD'S TOUCH NOTE, FIXED: the landing sends X and Y and then the note at 100; a move
    //     sends X and Y alone; the lift the note-off. Andrew Huang's case.
    {
      const { host } = await open(TOUCHED);
      try {
        step(host, "down", 0, at(4, 1));
        step(host, "move", 0, at(5, 0));
        step(host, "up", 0, at(5, 0));
        const order = host.midi
          .filter((m) => m.p1 === 21 || m.p1 === 22 || m.p1 === 48)
          .map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  pad, fixed:         ${order.join(" ")}`);
        expect(order).toEqual([
          "176:21:63",
          "176:22:63",
          "144:48:100",
          "176:21:127",
          "176:22:127",
          "128:48:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (2) FROM Y: the landing's Y position 0..127 mapped 1..127 - the top row 127, the middle 63,
    //     the bottom 1 (never 0, a note-off).
    {
      const { host } = await open(FROM_Y);
      try {
        for (const row of [0, 1, 2]) {
          step(host, "down", 0, at(4, row));
          step(host, "up", 0, at(4, row));
        }
        report.push(`  pad, from Y:        ${note(host.midi, 48).join(" ")}`);
        expect(note(host.midi, 48)).toEqual([
          "144:127",
          "128:0",
          "144:63",
          "128:0",
          "144:1",
          "128:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (3) EVERY RELEASE PATH, the off exactly once: a lift; the sweep (a lost lift, twenty Timer
    //     calls); a 9 (a tap: on and off in one sample); the same id pressed again with no lift
    //     (off, then on again, then the lift's off); another finger landing on the pad (the first's
    //     off, the second's on, the second's lift off).
    type Point = readonly [number, number];
    const paths: [
      string,
      (host: LuaHost, a: Point, b: Point) => void,
      string[],
    ][] = [
      [
        "lift",
        (host, a) => {
          step(host, "down", 0, a);
          step(host, "up", 0, a);
        },
        ["144:100", "128:0"],
      ],
      [
        "sweep",
        (host, a) => {
          step(host, "down", 0, a);
          host.run(230);
        },
        ["144:100", "128:0"],
      ],
      [
        "code 9",
        (host, a) => {
          host.touchTap(0, ...a);
          host.tick();
        },
        ["144:100", "128:0"],
      ],
      [
        "same id",
        (host, a, b) => {
          step(host, "down", 0, a);
          step(host, "down", 0, b);
          step(host, "up", 0, b);
        },
        ["144:100", "128:0", "144:100", "128:0"],
      ],
      [
        "another finger",
        (host, a, b) => {
          step(host, "down", 0, a);
          step(host, "down", 1, b);
          step(host, "up", 1, b);
          step(host, "up", 0, b);
        },
        ["144:100", "128:0", "144:100", "128:0"],
      ],
    ];
    for (const [name, gesture, expected] of paths) {
      const { host } = await open(TOUCHED);
      try {
        gesture(host, at(4, 1), at(5, 2));
        report.push(
          `  ${`${name}:`.padEnd(20)}${note(host.midi, 48).join(" ")}`,
        );
        expect(note(host.midi, 48), name).toEqual(expected);
        balanced(host.midi);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (4) THE HAND-OVER, both ways (Latch Off): a finger slid off the pad onto the Off button
    //     beside it - the pad's note-off, the button's on; lifted there, the button's off. A finger
    //     that lands on the button and slides onto the pad - the button's off, the pad's X, Y and
    //     note on; lifted there, the note-off.
    {
      const { host } = await open(OFF_PAD);
      try {
        step(host, "down", 0, at(5, 0));
        step(host, "move", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        const away = host.midi
          .filter((m) => m.p1 === 48 || m.p1 === 95)
          .map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  hand-over away:     ${away.join(" ")}`);
        expect(away).toEqual([
          "144:48:100",
          "128:48:0",
          "176:95:127",
          "176:95:0",
        ]);
        const before = host.midi.length;
        step(host, "down", 1, at(7, 0));
        step(host, "move", 1, at(4, 1));
        step(host, "up", 1, at(4, 1));
        const onto = host.midi
          .slice(before)
          .map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  hand-over onto:     ${onto.join(" ")}`);
        expect(onto).toEqual([
          "176:95:127",
          "176:95:0",
          "176:21:63",
          "176:22:63",
          "144:48:100",
          "128:48:0",
        ]);
        balanced(host.midi);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (5) A MULTITOUCH PAD'S NOTE IS A GATE FOR THE PAD (decided): on at the first finger down,
    //     off at the last finger up - a second finger, and the first one's lift under it, send no
    //     note; each finger's pair as change 11's.
    {
      const { host } = await open(DUO_GATE);
      try {
        step(host, "down", 0, at(6, 5));
        step(host, "down", 1, at(8, 3));
        expect(note(host.midi, 48)).toEqual(["144:100"]);
        step(host, "up", 0, at(6, 5));
        expect(note(host.midi, 48), "the first finger's lift").toEqual([
          "144:100",
        ]);
        step(host, "up", 1, at(8, 3));
        expect(note(host.midi, 48), "the last finger's lift").toEqual([
          "144:100",
          "128:0",
        ]);
        expect(sent(host.midi, 50)).toEqual([0]);
        expect(sent(host.midi, 52)).toEqual([127]);
        // A lost last finger: the sweep's expiry is the gate's off.
        step(host, "down", 2, at(7, 4));
        host.run(230);
        report.push(`  multitouch gate:    ${note(host.midi, 48).join(" ")}`);
        expect(note(host.midi, 48)).toEqual([
          "144:100",
          "128:0",
          "144:100",
          "128:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (6) A VALUE CC FOLLOWS THE FADER on its own channel and number: every value the fader sends,
    //     74 on channel 2 sends too, in the same order, and nothing the fader does not.
    {
      const { host } = await open(VALUE_FADER);
      try {
        step(host, "down", 0, at(1, 5));
        for (const row of [4, 3, 2, 1, 0]) step(host, "move", 0, at(1, row));
        step(host, "up", 0, at(1, 0));
        const own = host.midi.filter((m) => m.p1 === 20 && m.ch === 0);
        const extra = host.midi.filter((m) => m.p1 === 74 && m.ch === 1);
        report.push(
          `  value CC:           ${own.map((m) => m.p2).join(",")} / ${extra.map((m) => m.p2).join(",")}`,
        );
        expect(extra.map((m) => m.p2)).toEqual(own.map((m) => m.p2));
        expect(own.map((m) => m.p2)).toEqual([0, 25, 50, 76, 101, 127]);
        expect(extra.every((m) => m.cmd === 176)).toBe(true);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (7) A TOUCH CC is a gate on its controller: 127 on the landing, 0 on the lift - under the
    //     button's own press and its off.
    {
      const { host } = await open(CC_TOUCH);
      try {
        step(host, "down", 0, at(7, 0));
        step(host, "up", 0, at(7, 0));
        const order = host.midi.map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  touch CC:           ${order.join(" ")}`);
        expect(order).toEqual([
          "176:30:127",
          "176:64:127",
          "176:64:0",
          "176:30:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (8) THREE EXTRAS ON ONE PAD: the Touch note and the Touch CC 64 on channel 3 at the landing,
    //     the Value CC 74 on channel 2 following Y; both offs at the lift.
    {
      const { host } = await open(THREE_EXTRAS);
      try {
        step(host, "down", 0, at(4, 1));
        step(host, "move", 0, at(4, 0));
        step(host, "up", 0, at(4, 0));
        const order = host.midi.map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  three extras:       ${order.join(" ")}`);
        expect(order).toEqual([
          "0:176:21:63",
          "0:176:22:63",
          "1:176:74:63",
          "0:144:48:100",
          "2:176:64:127",
          "0:176:22:127",
          "1:176:74:127",
          "0:128:48:0",
          "2:176:64:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (9) AN ELEMENT WITHOUT EXTRAS SENDS AS BEFORE: the same gestures on page 3 and on page 3 with
    //     the pad's Touch note - every message but the note's the same, in the same order.
    {
      const script = (host: LuaHost) => {
        step(host, "down", 0, at(1, 4));
        step(host, "move", 0, at(1, 1));
        step(host, "up", 0, at(1, 1));
        step(host, "down", 1, at(7, 0));
        step(host, "up", 1, at(7, 0));
        step(host, "down", 2, at(4, 1));
        step(host, "move", 2, at(3, 2));
        step(host, "up", 2, at(3, 2));
      };
      const run = async (s: Surface) => {
        const { host } = await open(s);
        try {
          script(host);
          step(host, "down", 0, ringPoint(TURN, 90));
          turn(host, TURN, 90, 170);
          step(host, "up", 0, ringPoint(TURN, 170));
          expect(host.errors, host.errors.join(" | ")).toEqual([]);
          return host.midi
            .filter((m) => m.p1 !== 48)
            .map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        } finally {
          host.close();
        }
      };
      const plain = await run(PAGE3);
      expect(plain.length).toBeGreaterThan(8);
      expect(await run(TOUCHED)).toEqual(plain);
    }
    // (10) A PITCH RIBBON: C major from 60 to 72 - a slide from the bottom LED to the top plays 60,
    //      62, 64, 67, 69, 72, each the old note's off before the new note's on, never two held,
    //      at the fixed 100; the lift the last off. A GATE FADER: note 60 at the landing's value as
    //      its velocity (row 2: 76), a move sends nothing, the lift its off; landed at the bottom
    //      (value 0) the velocity is 1, never a note-off.
    {
      const { host } = await open(RIBBON_GATE);
      try {
        step(host, "down", 0, at(1, 5));
        for (const row of [4, 3, 2, 1, 0]) step(host, "move", 0, at(1, row));
        step(host, "up", 0, at(1, 0));
        report.push(`  ribbon, C major:    ${notes(host.midi).join(" ")}`);
        expect(notes(host.midi)).toEqual([
          "144:60:100",
          "128:60:0",
          "144:62:100",
          "128:62:0",
          "144:64:100",
          "128:64:0",
          "144:67:100",
          "128:67:0",
          "144:69:100",
          "128:69:0",
          "144:72:100",
          "128:72:0",
        ]);
        balanced(host.midi);
        const before = host.midi.length;
        step(host, "down", 1, at(3, 2));
        step(host, "move", 1, at(3, 0));
        step(host, "up", 1, at(3, 0));
        step(host, "down", 1, at(3, 5));
        step(host, "up", 1, at(3, 5));
        const gate = notes(host.midi.slice(before));
        report.push(`  gate:               ${gate.join(" ")}`);
        expect(gate).toEqual(["144:60:76", "128:60:0", "144:60:1", "128:60:0"]);
        expect(
          host.midi.filter((m) => m.cmd === 176),
          "a Note sends no controller",
        ).toEqual([]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (11) EVERY RELEASE PATH ON BOTH MODES: a lift, the sweep, a 9, the same id again, another
    //      finger - exactly one off per on, never two notes from one ribbon.
    for (const [name, gesture] of paths) {
      for (const [col, what] of [
        [1, "ribbon"],
        [3, "gate"],
      ] as const) {
        const { host } = await open(RIBBON_GATE);
        try {
          // The same gestures on this fader's column: rows 1 and 2.
          gesture(host, at(col, 1), at(col, 2));
          const played = notes(host.midi);
          report.push(`  ${`${what}, ${name}:`.padEnd(20)}${played.join(" ")}`);
          expect(played.length, `${what}, ${name}`).toBeGreaterThan(0);
          balanced(host.midi);
          expect(host.errors, host.errors.join(" | ")).toEqual([]);
        } finally {
          host.close();
        }
      }
    }
    // (12) THE HAND-OVER ON NOTES: the ribbon Off slid onto the Gate fader Off - the ribbon's off,
    //      the gate's on at the value there; and back - the gate's off, the ribbon's note there.
    {
      const { host } = await open(RIBBONS_OFF);
      try {
        step(host, "down", 0, at(1, 3));
        step(host, "move", 0, at(2, 3));
        step(host, "move", 0, at(1, 2));
        step(host, "up", 0, at(1, 2));
        report.push(`  notes hand-over:    ${notes(host.midi).join(" ")}`);
        expect(notes(host.midi)).toEqual([
          "144:64:100",
          "128:64:0",
          "144:60:50",
          "128:60:0",
          "144:67:100",
          "128:67:0",
        ]);
        balanced(host.midi);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // (13) THE SPRING, RELATIVE, A PAD AND A KNOB. A spring ribbon's lift sends the off and its
    //      return plays nothing. A relative ribbon plays its held note at the landing (the Min, 60,
    //      first) and re-notes as the finger moves. A pad's X ribbon (minor pentatonic from 48)
    //      plays 58 for the chromatic 59 between two of its notes, and its Y controller sends as a
    //      controller. A knob's ribbon plays its note at the landing and re-notes as it turns.
    {
      const { host } = await open(RIBBON_SPRING);
      try {
        step(host, "down", 0, at(1, 1));
        step(host, "up", 0, at(1, 1));
        host.run(3);
        expect(notes(host.midi)).toEqual(["144:69:100", "128:69:0"]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host } = await open(RIBBON_RELATIVE);
      try {
        step(host, "down", 0, at(1, 4));
        step(host, "move", 0, at(1, 3));
        step(host, "up", 0, at(1, 3));
        report.push(`  relative ribbon:    ${notes(host.midi).join(" ")}`);
        expect(notes(host.midi)).toEqual([
          "144:60:100",
          "128:60:0",
          "144:62:100",
          "128:62:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host } = await open(PAD_NOTES);
      try {
        step(host, "down", 0, at(4, 1));
        step(host, "move", 0, at(5, 1));
        step(host, "up", 0, at(5, 1));
        const order = host.midi.map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
        report.push(`  pad X ribbon:       ${order.join(" ")}`);
        expect(order).toEqual([
          "176:22:59",
          "144:58:100",
          "128:58:0",
          "144:72:100",
          "128:72:0",
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host } = await open(KNOB_NOTE);
      try {
        step(host, "down", 0, ringPoint(TURN, 90));
        turn(host, TURN, 90, 250);
        step(host, "up", 0, ringPoint(TURN, 250));
        const played = notes(host.midi);
        report.push(`  knob ribbon:        ${played.join(" ")}`);
        expect(played[0]).toBe("144:60:100");
        expect(played.length).toBeGreaterThan(4);
        // A step that lands on the note already sounding re-notes nothing: no note plays twice running.
        for (let k = 2; k < played.length; k += 2)
          expect(played[k], "a re-note onto the same note").not.toBe(
            played[k - 2],
          );
        balanced(host.midi);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    process.stdout.write(
      "\nTHE SANDBOX RUNTIME, change 21A - extras and continuous Notes, every release path:\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);
});

/** The positions test 23's probe compares: 36 boxes an axis-pair (offset o, length 2..9-o), 136 coordinates each. */
const POSITION_PROBE_COUNT = 36 * 136;

/** The figures test 23 pins, this tree, 2026-09-23 (change 18b). */
const PINNED_ONE_CELL = {
  /** `A` as change 17 wrote it: both divisors bare. */
  positionBefore: 133,
  /** `A` and `V`, shipped. */
  parts: [83, 61] as [number, number],
  /** Over change 17's `A`, canonical: the shipped pair, and the three forms measured beside it. */
  forms: { before: 133, shipped: 11, inline: 14, kind: 31, perAxis: 33 },
  /** The fixture landings (three and five slots) that fit with a receive half - every one with `O` out of the Timer. */
  entryPinned: 19,
};

/** The figures test 22 pins, this tree, 2026-09-23 (change 18). */
const PINNED_LATCH = {
  /** The hand-over entry: 126 over `O` (273) and over the multitouch `O` (392) alike. */
  texts: { entry: 399, entryMultitouch: 518 },
  /** Page 3 receiving with every element Off: over - 81 characters were free across the five slots at On (69 since change 18b's `V`), and the entry wants 126, `Y`'s rows 6 and the words (three since change 18b: the knob reads On). The Timer carries what fits nowhere (first fit's fallback). */
  page3Off: [852, 908, 858, 1088, 903] as (number | undefined)[],
  page3OffFits: false,
  /** One element Off is the same entry, the same `Y` and one word: over whichever it is - but the knob, which since change 18b reads On whatever it carries, so page 3 with it "Off" is page 3 (`PINNED.page3Five`). */
  page3Single: [
    "Filter 852/908/858/1088/899 over",
    "Space 852/908/858/1088/899 over",
    "Turn 893/908/905/897/868 fits",
    "Go 852/908/858/1088/899 over",
  ],
  /** Every element Off and receiving: the three combinations carrying a fader, the button, the pad and the knob - the three change 11 put over beside a multitouch pad. */
  over: ["vbxk", "hbxk", "vhbxk"],
  /** Beside a multitouch pad, every element Off: one more than at On (`vhxk`). */
  overMulti: ["vhxk", "vbxk", "hbxk", "vhbxk"],
};

/** The figures test 16 pins, this tree, 2026-09-18 (change 11). */
const PINNED_MULTITOUCH = {
  texts: { release: 243, entry: 392, xy: 509 },
  five: 3022,
  /** Every subset of the other kinds beside the pad but the three that carry a fader, the button AND the knob. */
  fits: [
    "x",
    "vx",
    "hx",
    "vhx",
    "bx",
    "vbx",
    "hbx",
    "vhbx",
    "xk",
    "vxk",
    "hxk",
    "vhxk",
    "bxk",
  ],
  over: ["vbxk", "hbxk", "vhbxk"],
  /** 255/6, 255/0, 255/4, the Timer (over by 180 since change 18b's `V`; 170 before), the Setup (change 17: the receive half, the Setup the fifth slot). */
  page3Five: [863, 880, 852, 1088, 893] as (number | undefined)[],
  /** Change 17: the tail defaults and the receive assignment are the Timer's, so the price is one digit on the pad's seventh column and two on its channel word (a multitouch pad does not receive: 128). */
  setupPriceOnePad: 3,
};

/** The figures pinned by test 7, this tree (change 10B; 10C - `R` 22 shorter; change 17, 2026-09-23 - the types, the receive half, `A`, `E=R`, the Setup the fifth slot; change 18b, 2026-09-23 - `V`, the one-cell guard, 12 more wherever `A` is: 11 and a separator). */
const PINNED = {
  /** `Y` beside every branch. */
  receive: 540,
  five: 2920,
  four: 2317,
  knobShare: 603,
  /** Two slots: the receive half packed with the runtime (the fader receives). */
  oneFaderTwoSlots: 2019,
  page3Two: 3572,
  page3Three: [2695, 893] as [number, number | undefined],
  /** 255/6, 255/0, 255/4, the Timer, the Setup (change 17: the Setup carried `Q`, `A` and `K`; change 18b: `Q`, `D` and `A`, `V` the Timer's, 69 free across the five where there were 81). */
  page3Five: [893, 908, 905, 897, 868] as (number | undefined)[],
  /** Two slots carry no kind at all since change 10B; three (the runtime alone, no receive half) one kind alone since change 17. */
  fitsTwo: [] as string[],
  fitsThree: ["v", "h", "vh", "b", "x", "k"],
};
