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
};
