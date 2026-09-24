// The Sandbox surfaces runtime.spec.ts and emit.spec.ts build, as plain objects for
// hash-wire.mjs --sandbox (Phase 13.2, plan 02). Copied from the two specs by hand: each spec has
// its own region() (runtime.spec's takes a controller, channel 1, colour 15,15,15; emit.spec's
// pins cc 102, channel 16, the picker corner) and the fixtures below keep to their spec's helper,
// so the strings the harness hashes are the strings the specs measure. A fixture added to either
// spec is added here by name; the fixture names are the record keys.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

// runtime.spec.ts:90-129 - region(name, kind, col, row, w, h, cc, extra) / surface(name, regions).
const rtRegion = (name, kind, col, row, w, h, cc, extra = {}) => ({
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
});
const surface = (name, regions) => ({
  id: name.toLowerCase(),
  name,
  regions,
});

const FILTER = rtRegion("Filter", "fader", 0, 0, 2, 6, 20);
const SPACE = rtRegion("Space", "xy", 3, 0, 3, 3, 21, { cc2: 22 });
const TURN = rtRegion("Turn", "knob", 3, 4, 3, 3, 23);
const GO = rtRegion("Go", "button", 7, 0, 2, 2, 30);
const CUT = rtRegion("Cut", "fader", 6, 2, 2, 4, 24);

// emit.spec.ts:83-152 - region(name, kind, col, row, w, h, extra); cc 102, channel 16, the corner.
const emRegion = (name, kind, col, row, w, h, extra = {}) => ({
  id: name.toLowerCase().replaceAll(" ", "-"),
  name,
  kind,
  col,
  row,
  w,
  h,
  cc: 102,
  channel: 16,
  colour: [15, 15, 15],
  ...extra,
});
const fadersAt = (count, w, h) =>
  Array.from({ length: count }, (_, i) =>
    emRegion(`Fader ${i + 1}`, "fader", i * w, 0, w, h, { cc: 100 + i }),
  );
const buttonsAt = (count, w, h, row) =>
  Array.from({ length: count }, (_, i) =>
    emRegion(`Button ${i + 1}`, "button", i * w, row, w, h, { cc: 110 + i }),
  );
const EMIT_PAGE3 = surface("Page 3", [
  emRegion("Filter", "fader", 0, 0, 2, 6),
  emRegion("Space", "xy", 3, 0, 3, 3, { cc2: 103 }),
  emRegion("Turn", "knob", 3, 4, 3, 3),
  emRegion("Go", "button", 7, 0, 2, 2),
]);
// emit.spec.ts test 7 (change 10A): page 3 with a 2 x 2 blank and a 1 x 1 blank - the paint-only kind.
const EMIT_PAGE3_BLANKS = surface("Page 3 and blanks", [
  ...EMIT_PAGE3.regions,
  emRegion("Wash", "blank", 7, 7, 2, 2, { cc: 0, channel: 1 }),
  emRegion("Dot", "blank", 0, 8, 1, 1, { cc: 0, channel: 1 }),
]);
// emit.spec.ts test 8 (change 10B): page 3 with every option on at its widest literal.
const EMIT_PAGE3_OPTIONS = surface("Page 3 options", [
  {
    ...EMIT_PAGE3.regions[0],
    min: 127,
    max: 100,
    mode: "relative",
    speed: "full",
    spring: true,
    springValue: 100,
  },
  {
    ...EMIT_PAGE3.regions[1],
    min: 127,
    max: 100,
    mode: "relative",
    speed: "full",
  },
  { ...EMIT_PAGE3.regions[2], min: 127, max: 100, mode: "relative-sign" },
  {
    ...EMIT_PAGE3.regions[3],
    min: 127,
    max: 100,
    latch: true,
    output: "note",
    group: 8,
  },
]);

// runtime.spec.ts (change 10B): the fixtures per feature - tests 8 to 14.
const WIDE = rtRegion("Wide", "fader", 0, 7, 4, 2, 25, {
  orientation: "horizontal",
});
const RADIO = [
  rtRegion("One", "button", 5, 7, 1, 1, 41, { group: 1, latch: true }),
  rtRegion("Two", "button", 6, 7, 1, 1, 42, { group: 1, latch: true }),
  rtRegion("Three", "button", 7, 7, 1, 1, 43, { group: 1 }),
];
// runtime.spec.ts (change 11): a two-finger 3 x 3 pad bottom-right and a five-finger 5 x 5 pad.
const DUO = rtRegion("Duo", "xy", 6, 3, 3, 3, 50, { cc2: 51, touches: 2 });
const FIVE = rtRegion("Five", "xy", 0, 0, 5, 5, 60, { cc2: 61, touches: 5 });
// emit.spec.ts test 9 (change 11): page 3 without the knob, the pad at three fingers.
const EMIT_PAGE3_TOUCHES = surface("Page 3 touches", [
  EMIT_PAGE3.regions[0],
  { ...EMIT_PAGE3.regions[1], touches: 3 },
  EMIT_PAGE3.regions[3],
]);

// runtime.spec.ts tests 17 to 19 (change 17): the types, RX and the colour input.
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
const COLOURS = {
  ...surface("Colours", [
    { ...FILTER, colour: [0, 0, 15] },
    SPACE,
    rtRegion("Glow", "blank", 7, 7, 2, 2, 0, { colour: [0, 15, 0] }),
  ]),
  colourInput: { channel: 16, cc: 100 },
};
// emit.spec.ts test 7 (change 17): page 3's four with Receive off, and the two blanks.
const EMIT_QUIET = EMIT_PAGE3.regions.map((r) => ({ ...r, receive: false }));

// runtime.spec.ts tests 21 and 22 (change 18): Latch - two faders side by side, a strum row, a
// held region, empty plate, page 3 and a multitouch pad, Off (`latchTouch: false`); emit.spec.ts
// test 10: the eight and the sixteen with every element Off.
const OFF = { latchTouch: false };
const LANE_A = rtRegion("Lane A", "fader", 0, 0, 2, 6, 80);
const LANE_B = rtRegion("Lane B", "fader", 2, 0, 2, 6, 81);
const allOff = (s, name) =>
  surface(
    name,
    s.regions.map((r) => ({ ...r, ...OFF })),
  );

// runtime.spec.ts test 23 (change 18b): faders one cell across the axis they do not read, beside
// the pad; the 1 x 6 relative at full with the spring; two 1 x 6 side by side Latch Off.
const THIN = rtRegion("Thin", "fader", 0, 0, 1, 6, 70);
// emit.spec.ts test 11 (change 18b): the cost.ts representative at 1 x 2 (cc 127, channel 16, the
// corner, min 127, max 100, relative at full, the spring at 100, a channel pressure, Receive off,
// Latch Off), four side by side.
const representative = (index, col) => ({
  id: `room-${index}`,
  name: `Room ${index}`,
  kind: "fader",
  col,
  row: 0,
  w: 1,
  h: 2,
  cc: 127,
  channel: 16,
  colour: [15, 15, 15],
  min: 127,
  max: 100,
  mode: "relative",
  speed: "full",
  spring: true,
  springValue: 100,
  output: "pressure",
  receive: false,
  latchTouch: false,
});

// runtime.spec.ts test 24 (change 21A): extra messages and a Note on a continuous output - page 3's
// pad with a Touch note (C3 at 100), the same From Y, the pad Latch Off beside an Off button, a
// Touches-2 pad with the note, a fader with a Value CC, a button with a Touch CC, a pad with three
// extras; a C major ribbon beside a Gate fader, the ribbon with a spring and relative, a pad's X a
// minor pentatonic ribbon, a chromatic knob ribbon, the two faders Latch Off.
const TOUCH_NOTE = { trigger: "touch", type: "note", channel: 1, number: 48 };
const GATE_PAD = rtRegion("Gate pad", "xy", 3, 0, 3, 3, 21, {
  cc2: 22,
  extras: [TOUCH_NOTE],
});
const RIBBON = rtRegion("Ribbon", "fader", 0, 0, 2, 6, 100, {
  output: "note",
  min: 60,
  max: 72,
  scale: "major",
});
const GATE = rtRegion("Gate", "fader", 2, 0, 2, 6, 60, {
  output: "note",
  noteMode: "gate",
});
// emit.spec.ts test 12 (change 21A): page 3 with a Touch note on its pad (channel 16, 102), every
// Receive off, and then the fader a C major ribbon beside it.
const EMIT_TOUCH_NOTE = {
  trigger: "touch",
  type: "note",
  channel: 16,
  number: 102,
};
const EMIT_PAGE3_TOUCH = EMIT_PAGE3.regions.map((r) =>
  r.kind === "xy" ? { ...r, extras: [EMIT_TOUCH_NOTE] } : r,
);

/** Fixture name -> surface. The runtime.spec surfaces first, then emit.spec's. */
export const SANDBOX_FIXTURES = {
  // runtime.spec.ts
  "runtime/page3": surface("Page 3", [FILTER, SPACE, TURN, GO]),
  "runtime/two": surface("Two", [FILTER, CUT]),
  "runtime/latch": surface("Latch", [{ ...GO, latch: true }]),
  "runtime/wide": surface("Wide", [
    { ...FILTER, orientation: "horizontal", w: 6, h: 2 },
  ]),
  "runtime/one": surface("One", [FILTER]),
  "runtime/scaled": surface("Scaled", [
    { ...FILTER, min: 20, max: 80 },
    { ...WIDE, min: 100, max: 50 },
    { ...SPACE, min: 10, max: 20 },
    { ...TURN, min: 64, max: 127 },
    { ...GO, min: 5, max: 100 },
  ]),
  "runtime/relative-half": surface("Relative half", [
    { ...FILTER, mode: "relative" },
    { ...SPACE, mode: "relative" },
  ]),
  "runtime/relative-full": surface("Relative full", [
    { ...FILTER, mode: "relative", speed: "full" },
    { ...SPACE, mode: "relative", speed: "full" },
  ]),
  "runtime/spring": surface("Spring", [
    { ...FILTER, spring: true },
    { ...CUT, spring: true, springValue: 100, mode: "relative" },
  ]),
  "runtime/notes": surface("Notes", [
    { ...GO, output: "note", cc: 60 },
    {
      ...rtRegion("Hold", "button", 7, 3, 2, 2, 62),
      output: "note",
      latch: true,
    },
    ...RADIO,
  ]),
  "runtime/knobs": surface("Knobs", [
    { ...TURN, mode: "relative-twos" },
    { ...rtRegion("Turn 2", "knob", 0, 0, 3, 3, 26), mode: "relative-offset" },
    { ...rtRegion("Turn 3", "knob", 6, 0, 3, 3, 27), mode: "relative-sign" },
  ]),
  // runtime.spec.ts (change 11): the multitouch fixtures - tests 15 and 16.
  "runtime/multitouch": surface("Multitouch", [DUO, FILTER, GO]),
  "runtime/five-fingers": surface("Five fingers", [FIVE]),
  "runtime/multitouch-relative": surface("Multitouch relative", [
    { ...DUO, mode: "relative" },
  ]),
  "runtime/two-pads": surface("Two pads", [SPACE, DUO]),
  "runtime/page3-multitouch": surface("Page 3 multitouch", [
    FILTER,
    { ...SPACE, cc: 50, cc2: 51, touches: 2 },
    TURN,
    GO,
  ]),
  // runtime.spec.ts (change 17): the types, RX and the colour input - tests 17 to 19.
  "runtime/types": TYPES,
  "runtime/receive-types": surface("Receive types", [
    { ...FILTER, output: "pitchbend", channel: 5 },
    { ...SPACE, output: "pressure", channel: 16, outputY: "cc", channelY: 9 },
  ]),
  "runtime/deaf": surface("Deaf", [
    { ...FILTER, receive: false },
    { ...TURN, mode: "relative-twos" },
    DUO,
  ]),
  "runtime/colours": COLOURS,
  "runtime/colours-dim": { ...COLOURS, brightness: 128 },
  // runtime.spec.ts (change 18): Latch - tests 21 and 22.
  "runtime/lanes": surface("Lanes", [LANE_A, LANE_B]),
  "runtime/lanes-off": surface("Lanes off", [
    { ...LANE_A, ...OFF },
    { ...LANE_B, ...OFF },
  ]),
  "runtime/strum": surface(
    "Strum",
    [0, 1, 2, 4].map((col, k) =>
      rtRegion(`Strum ${k + 1}`, "button", col, 8, 1, 1, 90 + k, OFF),
    ),
  ),
  "runtime/wait": surface("Wait", [
    rtRegion("Leave", "button", 0, 8, 1, 1, 90, OFF),
    rtRegion("Keep", "button", 1, 8, 1, 1, 91),
    rtRegion("Past", "button", 2, 8, 1, 1, 92, OFF),
  ]),
  "runtime/roam": surface("Roam", [
    { ...LANE_A, ...OFF },
    rtRegion("Spring", "fader", 5, 0, 2, 6, 82, { spring: true, ...OFF }),
    rtRegion("Far", "button", 3, 6, 1, 1, 90, OFF),
  ]),
  "runtime/page3-off": allOff(
    surface("Page 3", [FILTER, SPACE, TURN, GO]),
    "Page 3 off",
  ),
  "runtime/multitouch-off": surface("Multitouch off", [
    { ...DUO, ...OFF },
    rtRegion("Beside", "button", 5, 4, 1, 1, 95, OFF),
  ]),
  // runtime.spec.ts (change 18b): the one-cell faders - test 23.
  "runtime/one-cell": surface("One cell", [
    THIN,
    rtRegion("Stub", "fader", 2, 0, 1, 2, 71),
    rtRegion("Flat", "fader", 0, 8, 6, 1, 72, { orientation: "horizontal" }),
    rtRegion("Nub", "fader", 7, 8, 2, 1, 73, { orientation: "horizontal" }),
    SPACE,
  ]),
  "runtime/thin-spring": surface("Thin spring", [
    {
      ...THIN,
      mode: "relative",
      speed: "full",
      spring: true,
      springValue: 100,
    },
  ]),
  "runtime/thin-off": surface("Thin off", [
    { ...THIN, ...OFF },
    rtRegion("Thin 2", "fader", 1, 0, 1, 6, 74, OFF),
  ]),
  // runtime.spec.ts (change 21A): extra messages and continuous Notes - test 24.
  "runtime/touched": surface("Touched", [FILTER, GATE_PAD, TURN, GO]),
  "runtime/from-y": surface("From Y", [
    { ...GATE_PAD, extras: [{ ...TOUCH_NOTE, velocity: "y" }] },
  ]),
  "runtime/off-pad": surface("Off pad", [
    { ...GATE_PAD, ...OFF },
    rtRegion("Beside", "button", 7, 0, 1, 1, 95, OFF),
  ]),
  "runtime/duo-gate": surface("Duo gate", [{ ...DUO, extras: [TOUCH_NOTE] }]),
  "runtime/value-fader": surface("Value fader", [
    {
      ...FILTER,
      extras: [{ trigger: "value", type: "cc", channel: 2, number: 74 }],
    },
  ]),
  "runtime/cc-touch": surface("CC touch", [
    {
      ...GO,
      extras: [{ trigger: "touch", type: "cc", channel: 1, number: 64 }],
    },
  ]),
  "runtime/three-extras": surface("Three extras", [
    {
      ...SPACE,
      extras: [
        TOUCH_NOTE,
        { trigger: "touch", type: "cc", channel: 3, number: 64 },
        { trigger: "value", type: "cc", channel: 2, number: 74, source: "y" },
      ],
    },
  ]),
  "runtime/ribbon-gate": surface("Ribbon and gate", [RIBBON, GATE]),
  "runtime/ribbon-spring": surface("Ribbon spring", [
    { ...RIBBON, spring: true, springValue: 66 },
  ]),
  "runtime/ribbon-relative": surface("Ribbon relative", [
    { ...RIBBON, mode: "relative", speed: "full" },
  ]),
  "runtime/pad-notes": surface("Pad notes", [
    { ...SPACE, output: "note", min: 48, max: 72, scale: "minor-pentatonic" },
  ]),
  "runtime/knob-note": surface("Knob note", [
    { ...TURN, output: "note", min: 60, max: 84 },
  ]),
  "runtime/ribbons-off": surface("Ribbons off", [
    { ...RIBBON, ...OFF },
    { ...GATE, ...OFF },
  ]),
  // emit.spec.ts
  "emit/page3": EMIT_PAGE3,
  "emit/one": surface("One", [EMIT_PAGE3.regions[0]]),
  "emit/eight": surface("Eight", [
    ...fadersAt(4, 2, 6),
    ...buttonsAt(4, 2, 1, 7),
  ]),
  "emit/twelve": surface("Twelve", [
    ...fadersAt(8, 1, 6),
    ...buttonsAt(4, 2, 2, 7),
  ]),
  "emit/sixteen": surface("Sixteen", [
    ...fadersAt(8, 1, 6),
    ...buttonsAt(8, 1, 2, 7),
  ]),
  "emit/four-faders": surface("Four faders", fadersAt(4, 2, 6)),
  "emit/page3-blanks": EMIT_PAGE3_BLANKS,
  "emit/page3-options": EMIT_PAGE3_OPTIONS,
  "emit/page3-touches": EMIT_PAGE3_TOUCHES,
  "emit/page3-quiet-blanks": surface("Page 3 and blanks", [
    ...EMIT_QUIET,
    emRegion("Wash", "blank", 7, 7, 2, 2, { cc: 0, channel: 1 }),
    emRegion("Dot", "blank", 0, 8, 1, 1, { cc: 0, channel: 1 }),
  ]),
  // emit.spec.ts test 10 (change 18): every element Off.
  "emit/eight-off": allOff(
    surface("Eight", [...fadersAt(4, 2, 6), ...buttonsAt(4, 2, 1, 7)]),
    "Eight off",
  ),
  "emit/sixteen-off": allOff(
    surface("Sixteen", [...fadersAt(8, 1, 6), ...buttonsAt(8, 1, 2, 7)]),
    "Sixteen off",
  ),
  // emit.spec.ts test 11 (change 18b): run in the VM - the twelve Off, the sixteen at typed
  // literals, and the cap floor's representative four times at 1 x 2.
  "emit/twelve-off": allOff(
    surface("Twelve", [...fadersAt(8, 1, 6), ...buttonsAt(4, 2, 2, 7)]),
    "Twelve off",
  ),
  "emit/sixteen-typed": surface(
    "Sixteen typed",
    [...fadersAt(8, 1, 6), ...buttonsAt(8, 1, 2, 7)].map((r, i) => ({
      ...r,
      cc: i + 1,
      channel: 1,
    })),
  ),
  "emit/floor": surface(
    "Floor",
    [0, 1, 2, 3].map((col) => representative(col + 1, col)),
  ),
  // emit.spec.ts test 12 (change 21A): page 3 with a Touch note on its pad; every Receive off; and
  // the fader a C major ribbon beside it.
  "emit/page3-touch": surface("Page 3", EMIT_PAGE3_TOUCH),
  "emit/page3-touch-quiet": surface(
    "Page 3",
    EMIT_PAGE3_TOUCH.map((r) => ({ ...r, receive: false })),
  ),
  "emit/page3-touch-ribbon": surface(
    "Page 3",
    EMIT_PAGE3_TOUCH.map((r) =>
      r.kind === "fader"
        ? { ...r, receive: false, output: "note", scale: "major" }
        : { ...r, receive: false },
    ),
  ),
};
