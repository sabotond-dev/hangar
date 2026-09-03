// Vendored from sabotond-dev/botor
//   path:   src/renderer/tests/pad.test.js
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: import paths only (1 specifier).
// Original copyright and licence (GNU GPL v3 or later) retained below.

import { describe, it, expect, beforeAll } from "vitest";
import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import {
  // readiness
  padCompilerReady,
  // geometry
  cellIndex,
  ledIndexToCell,
  zoneOf,
  cellZone,
  touchXofColumn,
  CALIB_IDENTITY,
  isIdentityCalib,
  GRID,
  CELLS,
  // state
  defaultState,
  clonePadState,
  DEFAULT_PAD_STATE,
  SPEED_TABLE,
  DECAY_TABLE,
  nearestDecay,
  speedRate,
  snapWavelength,
  WAVELENGTH_MIN,
  WAVELENGTH_MAX,
  WAVELENGTH_EXCLUDED,
  quantiseColour,
  planLayers,
  // compile
  compile,
  detectSeams,
  padActionToLua,
  SEAM_TOUCH,
  SEAM_TIMER,
  KEEPER_PERIOD_SLOW,
  KEEPER_PERIOD_FAST,
  SETUP_EVENT,
  TIMER_EVENT,
  // stamp
  encodeStamp,
  decodeStamp,
  padActionRole,
  isPadManagedAction,
  STAMP_PREFIX,
  STAMP_ALPHABET,
  STAMP_FORMAT_STATE,
  STAMP_FORMAT_STATE_V2,
  STAMP_FORMAT_STATE_V3,
  STAMP_FORMAT_STATE_V4,
  zoneNotes,
  springRestCell,
  // brightness
  BRIGHTNESS_TABLE,
  scaleChannel,
  padLightsAnything,
  groundPadState,
  // streams and solo
  normalisePadState,
  maxCcBase,
  streamsOf,
  soloPadState,
  DIAL_SENSE_TABLE,
  // cost
  measure,
  cost,
  fits,
  ledger,
  ghostCost,
  EVENT_BUDGET,
  // validate
  validate,
  findTraps,
  PadCompileError,
  PadPartialWriteError,
  // read back and write
  readPad,
  scanForeignSlots,
  writePad,
  // solve
  fit,
  // presets
  PRESETS,
  presetById,
} from "../_pad";

beforeAll(async () => {
  // GridScript.checkSyntax answers false, and compressScript throws,
  // until the Lua formatter WASM has resolved. Same gate as
  // string-operations.test.js.
  await initLuaFormatter();
  await padCompilerReady();
});

// ---------------------------------------------------------------------------
// Enumeration. Traps, fractional safety and colour ordering are properties of
// EVERY reachable configuration, not of a handful of presets, so they run over
// a full cross product. compile() is pure string building, so this is cheap;
// anything that calls the minifier uses sampleStates() instead.

const LOOK_KINDS = [
  "none",
  "breathe",
  "shimmer",
  "scan",
  "wave",
  "swirl",
  "ripple",
  "drift",
  "showpiece",
];

const TOUCH_KINDS = [
  "none",
  "comet",
  "perFinger",
  "bloom",
  "glow",
  "disturb",
];

const SENDS_VARIANTS = [
  ["sends off", (d) => (d.sends.kind = "none")],
  ["xy", (d) => (d.sends.kind = "xy")],
  [
    "xy fine",
    (d) => {
      d.sends.kind = "xy";
      d.sends.hiRes = true;
    },
  ],
  [
    "3x3",
    (d) => {
      d.sends.kind = "zones";
      d.sends.grid = "3x3";
    },
  ],
  [
    "3x3 drawn",
    (d) => {
      d.sends.kind = "zones";
      d.sends.grid = "3x3";
      d.sends.showGrid = true;
    },
  ],
  [
    "4x4 drawn fine",
    (d) => {
      d.sends.kind = "zones";
      d.sends.grid = "4x4";
      d.sends.showGrid = true;
      d.sends.hiRes = true;
    },
  ],
  [
    "9x9",
    (d) => {
      d.sends.kind = "zones";
      d.sends.grid = "9x9";
      d.sends.fingers = "each";
    },
  ],
  [
    "4 faders rails",
    (d) => {
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "rails";
      d.sends.showGrid = true;
    },
  ],
  [
    "4 faders blocks",
    (d) => {
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.layout = "blocks";
      d.sends.showGrid = true;
    },
  ],
  [
    "3 faders rails",
    (d) => {
      d.sends.kind = "faders";
      d.sends.faders = 3;
      d.sends.layout = "rails";
      d.sends.showGrid = true;
    },
  ],
  [
    "4 faders unlit",
    (d) => {
      d.sends.kind = "faders";
      d.sends.faders = 4;
      d.sends.showGrid = false;
    },
  ],
  ["trackpad", (d) => (d.sends.kind = "trackpad")],
  [
    "xy left-right only",
    (d) => {
      d.sends.kind = "xy";
      d.sends.axes = "x";
    },
  ],
  [
    "xy up-down only",
    (d) => {
      d.sends.kind = "xy";
      d.sends.axes = "y";
    },
  ],
  ["dial", (d) => (d.sends.kind = "dial")],
  [
    "dial absolute with distance",
    (d) => {
      d.sends.kind = "dial";
      d.sends.dialMode = "absolute";
      d.sends.dialRadius = true;
    },
  ],
  [
    "xy sprung to zero",
    (d) => {
      d.sends.kind = "xy";
      d.sends.spring = true;
      d.sends.springTo = "zero";
    },
  ],
  [
    "joystick bend sprung",
    (d) => {
      d.sends.kind = "xy";
      d.sends.spring = true;
      d.sends.bend = "x";
      d.sends.fingers = "first";
    },
  ],
  [
    "3x3 major latch drawn",
    (d) => {
      d.sends.kind = "zones";
      d.sends.scale = "major";
      d.sends.toggle = true;
      d.sends.showGrid = true;
    },
  ],
  [
    "4x4 pentatonic",
    (d) => {
      d.sends.kind = "zones";
      d.sends.grid = "4x4";
      d.sends.scale = "pentatonic";
    },
  ],
];

function withState(...mutations) {
  const s = defaultState();
  for (const m of mutations) m(s);
  return s;
}

/** The full cross product. 9 x 6 x 20 = 1080 configurations. */
function everyState() {
  const out = [];
  for (const look of LOOK_KINDS) {
    for (const touch of TOUCH_KINDS) {
      for (const [sendsLabel, sends] of SENDS_VARIANTS) {
        out.push({
          label: `look=${look} touch=${touch} sends=${sendsLabel}`,
          state: withState(
            (d) => (d.look.kind = look),
            (d) => (d.touch.kind = touch),
            sends,
          ),
        });
      }
    }
  }
  return out;
}

/** The knobs that do not change the kind, swept over one representative base. */
function modifierStates() {
  const out = [];
  const base = (extra) =>
    withState(
      (d) => {
        d.look.kind = "wave";
        d.touch.kind = "comet";
        d.sends.kind = "zones";
        d.sends.grid = "4x4";
      },
      extra,
    );
  for (const phase of ["press", "held", "release"]) {
    for (const fingers of ["first", "any", "each"]) {
      out.push({
        label: `phase=${phase} fingers=${fingers}`,
        state: base((d) => {
          d.sends.phase = phase;
          d.sends.fingers = fingers;
        }),
      });
    }
  }
  for (const invertX of [false, true]) {
    for (const invertY of [false, true]) {
      out.push({
        label: `invertX=${invertX} invertY=${invertY}`,
        state: base((d) => {
          d.sends.invertX = invertX;
          d.sends.invertY = invertY;
        }),
      });
    }
  }
  for (const look of LOOK_KINDS) {
    for (const edge of ["soft", "hard"]) {
      for (const reverse of [false, true]) {
        out.push({
          label: `look=${look} edge=${edge} reverse=${reverse}`,
          state: withState((d) => {
            d.look.kind = look;
            d.look.edge = edge;
            d.look.reverse = reverse;
            d.look.speed = reverse ? 8 : 1;
          }),
        });
      }
    }
  }
  for (const brush of [1, 2]) {
    for (const touch of TOUCH_KINDS) {
      out.push({
        label: `touch=${touch} brush=${brush}`,
        state: withState((d) => {
          d.touch.kind = touch;
          d.touch.brush = brush;
          d.touch.trailMs = brush === 1 ? 210 : 2540;
        }),
      });
    }
  }
  for (const axis of ["x", "y", "diagonal", "antidiagonal"]) {
    out.push({
      label: `axis=${axis}`,
      state: withState((d) => {
        d.look.kind = "scan";
        d.look.axis = axis;
      }),
    });
  }
  for (const arms of [1, 2, 3]) {
    for (const spiral of [false, true]) {
      out.push({
        label: `swirl arms=${arms} spiral=${spiral}`,
        state: withState((d) => {
          d.look.kind = "swirl";
          d.look.arms = arms;
          d.look.spiral = spiral;
        }),
      });
    }
  }
  for (const ringsFrom of ["centre", "edge"]) {
    out.push({
      label: `ripple from=${ringsFrom}`,
      state: withState((d) => {
        d.look.kind = "ripple";
        d.look.ringsFrom = ringsFrom;
      }),
    });
  }
  for (const owned of [
    { touchHandler: "user" },
    { timer: "user" },
    { layer1: "user" },
    { layer2: "user" },
  ]) {
    out.push({
      label: `owned=${Object.keys(owned)[0]}`,
      state: withState((d) => (d.owned = owned)),
    });
  }
  return out;
}

/** Everything the compiler can produce, for the pure property tests. */
function allStates() {
  return [
    ...everyState(),
    ...modifierStates(),
    ...PRESETS.map((p) => ({ label: `preset ${p.id}`, state: p.state })),
  ];
}

/** A smaller spread, for anything that pays for the minifier. */
function sampleStates() {
  const out = PRESETS.map((p) => ({ label: `preset ${p.id}`, state: p.state }));
  for (const look of LOOK_KINDS) {
    out.push({
      label: `look=${look}`,
      state: withState((d) => (d.look.kind = look)),
    });
  }
  for (const touch of TOUCH_KINDS) {
    out.push({
      label: `touch=${touch}`,
      state: withState((d) => {
        d.look.kind = "wave";
        d.touch.kind = touch;
      }),
    });
  }
  for (const [label, sends] of SENDS_VARIANTS) {
    out.push({
      label: `sends=${label}`,
      state: withState(sends),
    });
    out.push({
      label: `sends=${label} over a look`,
      state: withState((d) => {
        d.look.kind = "swirl";
        d.touch.kind = "comet";
      }, sends),
    });
  }
  return out;
}

/** Both generated bodies of one state, as raw Lua with no markers. */
function bodiesOf(state, user) {
  const built = compile(state, user);
  return [...built.setup, ...built.timer]
    .map((a) => a.script)
    .filter((s) => s.trim() !== "");
}

// ---------------------------------------------------------------------------
// A Lua call scanner written here rather than imported, so that a compiler
// that agrees with its own scanner still has to satisfy this one.

function luaCalls(body) {
  const out = [];
  const re = /[A-Za-z_][A-Za-z0-9_.:]*(?=\()/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const open = m.index + m[0].length;
    let depth = 0;
    let quote;
    let i = open;
    let start = open + 1;
    const args = [];
    for (; i < body.length; i++) {
      const ch = body[i];
      if (typeof quote !== "undefined") {
        if (ch === quote && body[i - 1] !== "\\") quote = undefined;
        continue;
      }
      if (ch === "'" || ch === '"') {
        quote = ch;
        continue;
      }
      if (ch === "(" || ch === "{" || ch === "[") depth++;
      else if (ch === ")" || ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) break;
      } else if (ch === "," && depth === 1) {
        args.push(body.slice(start, i));
        start = i + 1;
      }
    }
    if (depth !== 0) continue;
    if (i > start) args.push(body.slice(start, i));
    out.push({
      name: m[0].replace(/^.*[.:]/, ""),
      args: args.map((a) => a.trim()),
      index: m.index,
    });
  }
  return out;
}

const LED_CALLS = [
  "glc",
  "gln",
  "gld",
  "glx",
  "glp",
  "glpfs",
  "glt",
  "glf",
  "gls",
  "glag",
];
const OUT_CALLS = ["gms", "gmms", "gmbs", "gks"];
const GUARDED_CALLS = [...LED_CALLS, ...OUT_CALLS];
// Calls that set motion on a layer. glt is a timeout, not motion, so the
// Timer keeper's bare glt loop is not a colourless write.
const PHASE_CALLS = ["glp", "glpfs", "glf", "gls"];
const COLOUR_CALLS = ["glc", "gln", "gld", "glx"];

/** A division that is not integer division. */
function hasBareDivision(text) {
  return text.split("//").join("").includes("/");
}

function isClosedToInteger(text) {
  return (
    text.includes("//") || /math\.(tointeger|floor|ceil)\(/.test(text)
  );
}

// ---------------------------------------------------------------------------

describe("hardware-verified constants", () => {
  it("keeps the budget at 908 characters per event", () => {
    // grid.getProperty("CONFIG_LENGTH") is 909, so 908 are usable, markers
    // included, and there are two events.
    expect(EVENT_BUDGET).toBe(908);
  });

  it("keeps the two ZONA event numbers", () => {
    // grid.get_element_events("touch") is exactly setup (0) and timer (6).
    // There is no phantom touch event 9.
    expect(SETUP_EVENT).toBe(0);
    expect(TIMER_EVENT).toBe(6);
    expect(GRID).toBe(9);
    expect(CELLS).toBe(81);
  });

  it("keeps the measured seam lengths", () => {
    // Measured with the real GridScript.compressScript: touch hook 31,
    // timer hook 23. Both are zero when Your code is empty.
    expect(SEAM_TOUCH.length).toBe(31);
    expect(SEAM_TIMER.length).toBe(23);
  });

  it("keeps the two keeper periods", () => {
    // 3e5 is three characters shorter than 300000 and is an integral float,
    // so it converts cleanly through lua_tointeger.
    expect(KEEPER_PERIOD_SLOW).toBe(300000);
    expect(KEEPER_PERIOD_FAST).toBe(20);
  });
});

describe("orientation", () => {
  it("puts logical (0,0) at the top left and runs plain row-major", () => {
    // Settled on hardware: +x runs right, +y runs DOWN, and
    // led_address_get(0, x + y*9) is row-major because firmware does the
    // serpentine lookup itself. No axis flip is needed anywhere.
    expect(cellIndex(0, 0)).toBe(0);
    expect(cellIndex(8, 0)).toBe(8);
    expect(cellIndex(0, 1)).toBe(9);
    expect(cellIndex(8, 8)).toBe(80);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        expect(cellIndex(x, y)).toBe(x + y * GRID);
      }
    }
  });

  it("defaults calibration to identity", () => {
    // The "unmeasured" arm is gone: orientation was measured, not deferred.
    expect(isIdentityCalib(CALIB_IDENTITY)).toBe(true);
    expect(isIdentityCalib(DEFAULT_PAD_STATE.calib)).toBe(true);
    for (const p of PRESETS) expect(isIdentityCalib(p.state.calib)).toBe(true);
  });

  it("un-serpentines the hardware LED store index", () => {
    // The firmware lookup table (grid_module.c:445-458) mirrors the EVEN
    // rows: hardware 8 is logical (0,0) and hardware 0 is (8,0), and
    // ZONA.svelte:88-100 agrees (row % 2 === 0). These rows are pinned to
    // that table; an odd-row mirror would flip every simulator preview.
    expect(ledIndexToCell(8)).toEqual({ x: 0, y: 0 });
    expect(ledIndexToCell(0)).toEqual({ x: 8, y: 0 });
    expect(ledIndexToCell(9)).toEqual({ x: 0, y: 1 });
    expect(ledIndexToCell(17)).toEqual({ x: 8, y: 1 });
    expect(ledIndexToCell(18)).toEqual({ x: 8, y: 2 });
    // and it is a bijection over the 81 cells
    const seen = new Set();
    for (let i = 0; i < CELLS; i++) {
      const { x, y } = ledIndexToCell(i);
      seen.add(x + y * GRID);
    }
    expect(seen.size).toBe(CELLS);
  });

  it("never flips a touch axis unless the user asked for it", () => {
    // The compiler owns no rotation compensation, so an inversion in a
    // generated body can only come from sends.invertX / invertY. Fader
    // level bars are excluded: their 127-y is "up is more", which is a
    // meaning, not a coordinate flip.
    const failures = [];
    for (const { label, state } of allStates()) {
      if (state.sends.invertX || state.sends.invertY) continue;
      if (state.sends.kind === "faders" || state.sends.kind === "trackpad") {
        continue;
      }
      for (const body of bodiesOf(state)) {
        for (const flip of [
          /127\s*-\s*x\b/,
          /127\s*-\s*y\b/,
          /1023\s*-\s*x\b/,
          /1023\s*-\s*y\b/,
          /\b8\s*-\s*x\b/,
          /\b8\s*-\s*y\b/,
          /\b80\s*-\s*a\b/,
        ]) {
          if (flip.test(body)) failures.push(`${label}: ${flip}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("reads a touched cell row-major and rescales it for fine resolution", () => {
    // The recipe form is x*9//128 + y*9//128*9: plain row-major, integer
    // division throughout, no flip. Fine resolution rewrites the divisor
    // across the whole element rather than adding a branch.
    const coarse = compile(
      withState((d) => {
        d.look.kind = "none";
        d.touch.kind = "comet";
        d.touch.brush = 1;
      }),
    ).setup[0].script;
    expect(coarse).toContain("x*9//128");
    expect(coarse).toContain("y*9//128");
    expect(coarse).not.toContain("//1024");

    const fine = compile(
      withState((d) => {
        d.look.kind = "none";
        d.touch.kind = "comet";
        d.touch.brush = 1;
        d.sends.kind = "xy";
        d.sends.hiRes = true;
      }),
    ).setup[0].script;
    expect(fine).toContain("x*9//1024");
    expect(fine).toContain("y*9//1024");
    expect(fine).not.toContain("x*9//128");
  });

  it("changes the compiled body when an axis is inverted", () => {
    const plain = compile(withState((d) => (d.sends.kind = "xy")));
    const flipped = compile(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.invertX = true;
      }),
    );
    expect(flipped.setupLua).not.toBe(plain.setupLua);
  });
});

describe("zone geometry", () => {
  // Every zone and fader claim in the recipe book holds under one
  // convention and no other: LED column c's centre sits at touch
  // x = c * 127 / 8, so the touch endpoints land on the CENTRES of the
  // outermost lights rather than on the pad's physical edges.
  const exactCentre = (c) => (c * 127) / (GRID - 1);

  it("agrees with the touch mapping at every LED centre", () => {
    for (const div of [3, 4]) {
      for (let c = 0; c < GRID; c++) {
        const fromTouch = Math.floor((exactCentre(c) * div) / 128);
        // Row 0, so cellZone returns the column group alone.
        expect(cellZone(c, div), `div=${div} column=${c}`).toBe(fromTouch);
      }
    }
  });

  it("matches the recipes' published column maps", () => {
    // c//3 gives 3, 3, 3 and c*4//9 gives 3, 2, 2, 2, which is the
    // sentence the 4x4 tile has to print: "Columns are 3, 2, 2, 2 lights
    // wide. Where your finger crosses a boundary is exact; the light grid
    // cannot be."
    const columns = (div) =>
      Array.from({ length: GRID }, (_, c) => cellZone(c, div));
    expect(columns(3)).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2]);
    expect(columns(4)).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3]);
    const widths = (div) => {
      const w = new Array(div).fill(0);
      for (const g of columns(div)) w[g]++;
      return w;
    };
    expect(widths(3)).toEqual([3, 3, 3]);
    expect(widths(4)).toEqual([3, 2, 2, 2]);
  });

  it("keeps zoneOf row-major and consistent at both resolutions", () => {
    for (const div of [3, 4, 9]) {
      for (let y = 0; y < 128; y += 7) {
        for (let x = 0; x < 128; x += 7) {
          const z = zoneOf(x, y, div);
          expect(z).toBe(
            Math.floor((x * div) / 128) + Math.floor((y * div) / 128) * div,
          );
          expect(z).toBeGreaterThanOrEqual(0);
          expect(z).toBeLessThan(div * div);
          // Fine resolution is the same split on a 1024 scale.
          expect(zoneOf(x * 8, y * 8, div, true)).toBe(z);
        }
      }
    }
  });

  it("lands the W#W#W#W#W rails on the four-fader touch boundaries", () => {
    // Touch boundaries between four faders sit at x = 32, 64, 96. The
    // rails are the even LED columns, the level bars the odd ones.
    const errors = [32, 64, 96].map((x) => {
      const column = (x * (GRID - 1)) / 127;
      const rail = Math.round(column / 2) * 2;
      return Math.abs(column - rail);
    });
    for (const e of errors) expect(e).toBeLessThan(0.05);
    // The spec and the recipe both say "within a fiftieth of a light".
    // Measured, the worst is 0.047, about a twenty-first. The claim is
    // optimistic by a factor of two; the layout choice is still right.
    expect(Math.max(...errors)).toBeGreaterThan(0.02);
    // Rails on even columns means each of the four lanes owns one odd column.
    const lanes = new Set();
    for (let c = 1; c < GRID; c += 2) lanes.add(Math.floor(c / 2));
    expect(lanes.size).toBe(4);
  });

  it("fills a fader bar to exactly nine rows at full value", () => {
    // (v+1)*9//128 lands both endpoints exactly, which the naive
    // v*9//127 does not.
    const rows = (v) => Math.floor(((v + 1) * 9) / 128);
    expect(rows(0)).toBe(0);
    expect(rows(127)).toBe(9);
    let previous = 0;
    for (let v = 0; v <= 127; v++) {
      expect(rows(v)).toBeGreaterThanOrEqual(previous);
      expect(rows(v)).toBeLessThanOrEqual(9);
      previous = rows(v);
    }
  });

  it("maps every touch column into the pad's own coordinate space", () => {
    expect(touchXofColumn(0)).toBe(0);
    expect(touchXofColumn(8)).toBe(127);
    expect(touchXofColumn(0, true)).toBe(0);
    expect(touchXofColumn(8, true)).toBe(1023);
  });
});

describe("the three traps are unbuildable", () => {
  it("never emits e == 5 anywhere", () => {
    // 9 DOWNUP is a fast tap that arrives as one message with no separate
    // UP, so a handler keyed on 5 leaks a stuck note. The end-of-contact
    // test is e == 3 or e >= 5, always.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        if (/\be\s*==\s*5\b/.test(body)) failures.push(`${label}: e==5`);
        if (/\be\s*==\s*3\b/.test(body) && !/\be\s*>=\s*5\b/.test(body)) {
          failures.push(`${label}: e==3 with no e>=5`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("emits the four phases as event nibbles on a stateless send", () => {
    const body = (phase) =>
      compile(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.phase = phase;
        }),
      ).setup[0].script;
    expect(body("press")).toContain("e==4");
    expect(body("held")).toContain("e==1 or e==4");
    expect(body("release")).toContain("e==3 or e>=5");
    for (const phase of ["press", "held", "release"]) {
      expect(body(phase)).not.toMatch(/\be\s*==\s*5\b/);
    }
  });

  it("latches a zone send on the zone, not on the event nibble", () => {
    // DOUBT, and worth raising. Spec 3.3 puts "Send on" in the Sends form
    // for every kind, but a zone send ignores it: the recipe tracks the
    // zone per contact and fires note-on and note-off from the change,
    // which is what makes a slide retrigger. So the phase knob is
    // decorative on zones and faders. The invariant that matters is that
    // every note-on has a paired note-off on the end-of-contact test.
    const bodies = ["press", "held", "release"].map(
      (phase) =>
        compile(
          withState((d) => {
            d.sends.kind = "zones";
            d.sends.grid = "3x3";
            d.sends.phase = phase;
          }),
        ).setup[0].script,
    );
    for (const body of bodies) {
      expect(body).toContain("e==3 or e>=5");
      expect(body).not.toMatch(/\be\s*==\s*5\b/);
      // note-on 144 and note-off 128 are always both present
      expect(body).toContain("gms(0,144,");
      expect(body).toContain("gms(0,128,");
    }
    expect(new Set(bodies).size).toBe(1);
  });

  it("never gates on the contact id", () => {
    // Firmware does no contact-slot remapping, so the survivor of a
    // two-finger touch keeps id 1 and any i > 0 gate freezes the pointer
    // the moment finger zero lifts first.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        if (/if\s*i\s*>\s*0\s*then/.test(body)) {
          failures.push(`${label}: i>0 gate`);
        }
      }
    }
    // NOTE: the recipe book's C1 build ships
    // "if i>0 or e==3 or e>=5 then return end", which the compound test
    // above deliberately allows, because the spec's rule is about the bare
    // gate. If "First finger" is ever found to freeze on hardware, this
    // test is the place to tighten.
    expect(failures).toEqual([]);
  });

  it("closes every division that reaches a light or an output", () => {
    // Lua 5.5 with LUA_FLOORN2I = F2Ieq turns a fractional argument to a
    // firmware call into 0, silently, on hardware only. Every divisor in a
    // guarded call has to be integer division or explicitly floored.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        for (const call of luaCalls(body)) {
          if (!GUARDED_CALLS.includes(call.name)) continue;
          for (const arg of call.args) {
            if (!hasBareDivision(arg)) continue;
            if (isClosedToInteger(arg)) continue;
            failures.push(`${label}: ${call.name}(... ${arg} ...)`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("keeps every generated body free of bare division outside the trackpad", () => {
    // Stronger than the argument rule and true of every recipe except C10,
    // which divides into a local and floors it two statements later.
    const failures = [];
    for (const { label, state } of allStates()) {
      if (state.sends.kind === "trackpad") continue;
      for (const body of bodiesOf(state)) {
        if (hasBareDivision(body)) failures.push(`${label}: bare /`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("closes every square root before it reaches a light", () => {
    // math.sqrt always returns a float, so the ripple's radius has to be
    // floored before glpfs sees it.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        if (!body.includes("math.sqrt(")) continue;
        for (const call of luaCalls(body)) {
          if (!GUARDED_CALLS.includes(call.name)) continue;
          for (const arg of call.args) {
            if (!arg.includes("math.sqrt(")) continue;
            if (isClosedToInteger(arg)) continue;
            failures.push(`${label}: ${call.name}(... ${arg} ...)`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("never asks firmware for automatic phase", () => {
    // glp(n, layer, -1) returns silently on a ZONA for any index above 1.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        for (const call of luaCalls(body)) {
          if (call.name !== "glp") continue;
          if ((call.args[2] ?? "").trim() === "-1") {
            failures.push(`${label}: glp auto phase`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("finds each trap in a hand-written sample", () => {
    // A green trap sweep has to mean the scanner works, not that it never
    // fires, so every pattern is proved against a positive case.
    const code = (hits) => hits.map((h) => h.code);
    expect(
      code(findTraps("self.touch_cb=function(s,i,e,x,y)if e==5 then return end end")),
    ).toContain("trap-end-of-contact");
    expect(
      code(findTraps("self.touch_cb=function(s,i,e,x,y)if i>0 then return end end")),
    ).toContain("trap-contact-gate");
    expect(code(findTraps("glp(glag(0,n),1,x/14)"))).toContain(
      "trap-float-division",
    );
    expect(code(findTraps("glp(glag(0,n),1,-1)"))).toContain(
      "trap-auto-phase",
    );
    expect(code(findTraps("for a=0,80 do glpfs(a,2,0,2,3)glt(a,2,65535)end"))).toContain(
      "trap-unlit-layer",
    );
    // and it stays quiet on correct Lua
    expect(
      findTraps("for a=0,80 do glc(a,2,0,90,255,1)glpfs(a,2,a*9//128,2,3)end"),
    ).toEqual([]);
  });

  it("finds no trap in any generated body", () => {
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        for (const hit of findTraps(body)) {
          failures.push(`${label}: ${hit.code} at ${hit.index}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("light that actually lights", () => {
  it("never sets motion on a layer that was given no colour", () => {
    // A layer with no colour stops renders pure black, so a body that
    // sets phase without ever setting colour is a silent no-op: a
    // perfectly correct script that shows nothing.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        const calls = luaCalls(body);
        for (const layer of ["1", "2"]) {
          const at = (names) =>
            calls
              .filter((c) => names.includes(c.name) && c.args[1] === layer)
              .map((c) => c.index);
          const phase = at(PHASE_CALLS);
          if (phase.length === 0) continue;
          const colour = at(COLOUR_CALLS);
          if (colour.length === 0) {
            failures.push(`${label}: layer ${layer} moves with no colour`);
            continue;
          }
          if (Math.min(...colour) > Math.min(...phase)) {
            failures.push(`${label}: layer ${layer} coloured after it moves`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("sets min, mid and max from one colour call", () => {
    // glc(a, L, r, g, b, 1) is 29 characters cheaper per loop than
    // gln/gld/glx, and the trailing 1 forces the min stop to black.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        for (const call of luaCalls(body)) {
          if (call.name !== "glc") continue;
          if (call.args.length !== 6 || call.args[5] !== "1") {
            failures.push(`${label}: glc(${call.args.join(",")})`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("reaches for separate colour stops only where the ratio cannot hold", () => {
    // Drift's stops are not on the c/20, c/2, c ratio, and a hard edge
    // forces the mid stop black to get a narrow bright peak. Nothing else
    // is allowed to spend the 29.
    const failures = [];
    for (const { label, state } of allStates()) {
      const allowed = state.look.kind === "drift" || state.look.edge === "hard";
      if (allowed) continue;
      for (const body of bodiesOf(state)) {
        for (const call of luaCalls(body)) {
          if (["gln", "gld", "glx"].includes(call.name)) {
            failures.push(`${label}: ${call.name}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("drives both layers for the two-layer showpiece", () => {
    // One layer caps at 49.6 percent brightness, weights 254 over a
    // divisor of 512, so full colour needs both layers together.
    const plan = planLayers(withState((d) => (d.look.kind = "showpiece")));
    expect(plan.layer1).toBe("look");
    expect(plan.layer2).toBe("look");
    const body = compile(
      withState((d) => (d.look.kind = "showpiece")),
    ).setup[0].script;
    const layers = luaCalls(body)
      .filter((c) => c.name === "glc")
      .map((c) => c.args[1]);
    expect(layers).toContain("1");
    expect(layers).toContain("2");
  });

  it("keeps Look on layer 2 and Touch on layer 1", () => {
    // Two documented exceptions. "Bend the background" paints the Look's
    // own layer, which is why it has no colour of its own and needs a
    // background to bend. And an opaque graphic takes both layers, which
    // is the only way past the 49.6 percent single-layer cap: the
    // showpiece and any drawn Sends control both do it.
    const failures = [];
    for (const { label, state } of allStates()) {
      const plan = planLayers(state);
      const twoLayer =
        state.look.kind === "showpiece" || state.sends.showGrid === true;
      if (plan.touch && state.touch.kind !== "disturb") {
        if (plan.layer1 !== "touch") {
          failures.push(`${label}: touch is on ${plan.layer1}`);
        }
      }
      if (plan.touch && state.touch.kind === "disturb" && plan.layer2 !== "look") {
        failures.push(`${label}: disturb has no background to bend`);
      }
      if (plan.look && plan.layer1 !== "look" && plan.layer2 !== "look") {
        failures.push(`${label}: look owns no layer`);
      }
      if (
        plan.layer1 !== "none" &&
        plan.layer1 === plan.layer2 &&
        !twoLayer
      ) {
        failures.push(`${label}: ${plan.layer1} owns both layers`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("says so when the showpiece takes the layer Touch wanted", () => {
    // Unavailability is stated before the click, never after.
    const plan = planLayers(
      withState((d) => {
        d.look.kind = "showpiece";
        d.touch.kind = "comet";
      }),
    );
    expect(plan.touch).toBe(false);
    expect(plan.notes.length).toBeGreaterThan(0);
    expect(plan.notes.some((n) => n.sheet === "touch")).toBe(true);
    for (const note of plan.notes) expect(note.reason.length).toBeGreaterThan(0);
  });

  it("says so when a drawn control takes the layers a Look wanted", () => {
    // Spec 2.1 says Sends uses no layer. That is false for every visible
    // Sends kind: the zone checkerboard and the fader rails both claim
    // LEDs, so a drawn control and a Look cannot both run. The compiler
    // resolves it once, with a reason attached.
    const plan = planLayers(
      withState((d) => {
        d.look.kind = "wave";
        d.touch.kind = "comet";
        d.sends.kind = "faders";
        d.sends.showGrid = true;
      }),
    );
    expect(plan.sends).toBe(true);
    expect(plan.notes.length).toBeGreaterThan(0);
    expect(plan.look && plan.layer2 === "look").toBe(false);
  });
});

describe("nothing costs what it does not have to", () => {
  it("emits no comment except the marker", () => {
    // Comments are not stripped by the minifier and cost their full length
    // plus one, so a generated body carries none.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const body of bodiesOf(state)) {
        if (body.includes("--")) failures.push(`${label}: comment`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("writes the marker exactly as the editor would", () => {
    const built = compile(defaultState());
    expect(padActionToLua(built.setup[0])).toBe(
      `--[[@cb#${STAMP_PREFIX}${built.stamp}]] ${built.setup[0].script}`,
    );
    expect(built.setupLua).toBe(
      built.setup.map(padActionToLua).join(""),
    );
    expect(built.timerLua).toBe(built.timer.map(padActionToLua).join(""));
  });

  it("emits its bodies in the minifier's own normal form", () => {
    // If the emitted body is already a fixed point of compressScript, the
    // measured cost equals the stored cost and the only difference between
    // the wire length and the editor's counter is the one space the
    // minifier strips after each ]].
    for (const preset of PRESETS) {
      const built = compile(preset.state);
      for (const [lua, actions] of [
        [built.setupLua, built.setup],
        [built.timerLua, built.timer],
      ]) {
        if (lua === "") continue;
        const compressed = GridScript.compressScript(lua);
        expect(compressed.length, preset.id).toBe(lua.length - actions.length);
        expect(GridScript.compressScript(compressed), preset.id).toBe(
          compressed,
        );
      }
    }
  });
});

describe("the budget", () => {
  it("fits every preset inside 908 on both events", () => {
    for (const preset of PRESETS) {
      const c = cost(compile(preset.state));
      expect(c.setup.used, `${preset.id} setup`).toBeLessThanOrEqual(908);
      expect(c.timer.used, `${preset.id} timer`).toBeLessThanOrEqual(908);
      expect(c.fits, preset.id).toBe(true);
      expect(fits(compile(preset.state)), preset.id).toBe(true);
    }
  });

  it("holds every preset to its declared cost", () => {
    // Byte-exact, not "less than". Fourteen published capacity numbers go
    // stale the moment a shared codegen helper changes, and this assertion
    // is the only device-free way to catch it.
    for (const preset of PRESETS) {
      const c = cost(compile(preset.state));
      expect(c.setup.used, `${preset.id} setup`).toBe(preset.cost.setup);
      expect(c.timer.used, `${preset.id} timer`).toBe(preset.cost.timer);
    }
  });

  it("measures against the real shortifier", () => {
    for (const preset of PRESETS) {
      const built = compile(preset.state);
      expect(measure(built.setupLua), preset.id).toBe(
        GridScript.compressScript(built.setupLua).length,
      );
    }
  });

  it("budgets on the uncompressed length, which is the binding one", () => {
    // The device rejects on the compressed length of the event's toLua(),
    // but GridEvent.insert() budgets on the uncompressed one, which runs
    // exactly one character per action higher. A configuration the ledger
    // called legal and the editor refused would be the worst lie this
    // compiler can tell, so the stricter figure wins.
    for (const preset of PRESETS) {
      const built = compile(preset.state);
      const c = cost(compile(preset.state));
      expect(c.setup.used, preset.id).toBeGreaterThanOrEqual(
        built.setupLua.length,
      );
      expect(c.setup.free, preset.id).toBe(908 - c.setup.used);
    }
  });

  it("fits every kind combination we can reach", () => {
    const failures = [];
    for (const { label, state } of sampleStates()) {
      const c = cost(compile(state));
      if (!c.fits) {
        failures.push(
          `${label}: setup ${c.setup.used}, timer ${c.timer.used}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it("keeps the Timer event far from its own ceiling", () => {
    // Measured across the whole model, the worst Timer body is the fast
    // keeper plus the contact watchdog plus the seam. The Shelf's capacity
    // dots are therefore always reading the Setup budget in practice.
    let worst = 0;
    for (const { state } of sampleStates()) {
      worst = Math.max(worst, cost(compile(state)).timer.used);
    }
    expect(worst).toBeLessThan(400);
  });

  it("reports the tighter event as the free slot count", () => {
    for (const { state } of sampleStates()) {
      const c = cost(compile(state));
      expect(c.slotsFree).toBe(Math.min(c.setup.free, c.timer.free));
    }
  });

  it("counts characters reserved by foreign actions", () => {
    const built = compile(defaultState());
    const bare = cost(built);
    const shared = cost(built, { setup: 200, timer: 0 });
    expect(shared.setup.used).toBe(bare.setup.used + 200);
    expect(shared.setup.free).toBe(bare.setup.free - 200);
    expect(cost(built, { setup: 900, timer: 0 }).fits).toBe(false);
  });
});

describe("the settings stamp", () => {
  it("uses an alphabet the shortifier leaves alone", () => {
    // Alphanumerics survive compressScript untouched. Anything outside
    // them is a risk: + and / tokenise as operators and ] would close the
    // comment the marker lives in.
    const base32 = new RegExp(`^[${STAMP_ALPHABET}]+$`);
    for (const { label, state } of allStates()) {
      const stamp = encodeStamp(state);
      expect(stamp.length, label).toBeGreaterThan(0);
      expect(/^[0-9A-Za-z]+$/.test(stamp), `${label}: ${stamp}`).toBe(true);
      // A field dump is packed five bits at a time; only a shelf-card
      // reference carries the card's own id.
      if (typeof state.preset === "undefined") {
        expect(base32.test(stamp), `${label}: ${stamp}`).toBe(true);
      }
    }
  });

  it("survives the marker regex the runtime parses with", () => {
    // GridAction.parse is not importable headlessly, so the marker is run
    // through the same regex runtime.ts:409 uses and the same #name split.
    for (const { label, state } of sampleStates()) {
      const built = compile(state);
      const compressed = GridScript.compressScript(built.setupLua);
      expect(compressed, label).toContain(
        `--[[@cb#${STAMP_PREFIX}${built.stamp}]]`,
      );
      const matches = [
        ...compressed.matchAll(/--\[\[@(.*?)\]\]\s*(.*?)(?=(--\[\[@|$))/gs),
      ];
      expect(matches.length, label).toBe(built.setup.length);
      const [short, name] = matches[0][1].split(/#(.*)/);
      expect(short, label).toBe("cb");
      expect(name, label).toBe(`${STAMP_PREFIX}${built.stamp}`);
    }
  });

  it("restores a state exactly through the stamp", () => {
    // The stamp is the state of record. What has to survive is not the
    // object's identity but everything observable: the same stamp and the
    // same two bodies, byte for byte.
    const failures = [];
    for (const { label, state } of allStates()) {
      const built = compile(state);
      const back = decodeStamp(built.stamp);
      if (typeof back === "undefined") {
        failures.push(`${label}: would not decode`);
        continue;
      }
      const again = compile(back);
      if (again.stamp !== built.stamp) failures.push(`${label}: stamp drifts`);
      if (again.setupLua !== built.setupLua) failures.push(`${label}: setup`);
      if (again.timerLua !== built.timerLua) failures.push(`${label}: timer`);
    }
    expect(failures).toEqual([]);
  });

  it("carries every field the chosen kinds read, at the edges of their domains", () => {
    const loaded = withState((d) => {
      d.look.kind = "ripple";
      // Multiples of 17 survive the RGB444 packing untouched, which is
      // what the picked-versus-as-it-lands swatch pair already warns about.
      d.look.colour = { r: 255, g: 0, b: 17 };
      d.look.colourB = { r: 0, g: 255, b: 238 };
      d.look.speed = 8;
      d.look.reverse = true;
      d.look.edge = "hard";
      d.look.ringsFrom = "edge";
      d.touch.kind = "perFinger";
      d.touch.colour = { r: 17, g: 34, b: 51 };
      d.touch.trailMs = 2540;
      d.touch.brush = 2;
      d.sends.kind = "zones";
      d.sends.grid = "4x4";
      // The edge of the domain: the highest base whose sixteenth zone
      // still lands on note 127. A flat 127 here would emit illegal
      // bytes past zone 0, so normalise clamps it away.
      d.sends.baseNote = 112;
      d.sends.order = "snake";
      d.sends.channel = 16;
      d.sends.velocity = 127;
      d.sends.phase = "release";
      d.sends.fingers = "each";
      d.sends.invertX = true;
      d.sends.invertY = true;
      d.sends.hiRes = true;
      d.sends.showGrid = true;
    });
    const back = decodeStamp(encodeStamp(loaded));
    expect(back).toBeDefined();
    expect(back.version).toBe(1);
    expect(back.look.kind).toBe("ripple");
    expect(back.look.colour).toEqual({ r: 255, g: 0, b: 17 });
    expect(back.look.speed).toBe(8);
    expect(back.look.reverse).toBe(true);
    expect(back.look.edge).toBe("hard");
    expect(back.look.ringsFrom).toBe("edge");
    expect(back.touch.kind).toBe("perFinger");
    expect(back.touch.trailMs).toBe(2540);
    expect(back.touch.brush).toBe(2);
    expect(back.sends.kind).toBe("zones");
    expect(back.sends.grid).toBe("4x4");
    expect(back.sends.baseNote).toBe(112);
    expect(back.sends.channel).toBe(16);
    expect(back.sends.velocity).toBe(127);
    // Only the fields the chosen kinds read are written, so a note send
    // carries no CC base. That is the same kind-driven variable shape the
    // widget editor uses, and it is what keeps a typical stamp near
    // twelve characters instead of thirty-four.
    const ccCarrier = decodeStamp(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "faders";
          d.sends.faders = 3;
          d.sends.ccBase = 100;
          d.sends.channel = 16;
        }),
      ),
    );
    expect(ccCarrier.sends.ccBase).toBe(100);
    expect(ccCarrier.sends.channel).toBe(16);
    // Send on is only stamped where it changes anything, which is a
    // stateless send. A zone send latches on the zone and normalises the
    // knob away, which is the same divergence the trap suite records.
    const stateless = decodeStamp(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.phase = "release";
        }),
      ),
    );
    expect(stateless.sends.phase).toBe("release");
    expect(back.sends.fingers).toBe("each");
    expect(back.sends.invertX).toBe(true);
    expect(back.sends.invertY).toBe(true);
    expect(back.sends.hiRes).toBe(true);
    expect(back.sends.showGrid).toBe(true);

    const floor = withState((d) => {
      d.look.kind = "breathe";
      d.look.colour = { r: 0, g: 0, b: 0 };
      d.look.speed = 1;
      d.touch.kind = "none";
      d.touch.trailMs = 210;
      d.touch.brush = 1;
      d.sends.kind = "none";
      d.sends.baseNote = 0;
      d.sends.channel = 1;
      d.sends.ccBase = 0;
      d.sends.velocity = 1;
      d.enabled = { look: true, touch: false, sends: false };
    });
    const low = decodeStamp(encodeStamp(floor));
    expect(low.look.speed).toBe(1);
    expect(low.look.colour).toEqual({ r: 0, g: 0, b: 0 });
    expect(low.enabled.touch).toBe(false);
    expect(low.enabled.sends).toBe(false);
  });

  it("refuses a payload it cannot read rather than guessing", () => {
    // Spec 6.4: a stamp that does not decode is treated as no stamp, which
    // routes to the honest hand-written path instead of an overwrite.
    for (const bad of ["", "!", "z", "zzz", "A1B2", "----", " ", "a"]) {
      expect(decodeStamp(bad), JSON.stringify(bad)).toBeUndefined();
    }
  });

  it("keeps every fader's controller number inside the MIDI range", () => {
    for (const faders of [3, 4]) {
      for (const ccBase of [0, 40, 100, 120, 124]) {
        const body = compile(
          withState((d) => {
            d.look.kind = "none";
            d.enabled.look = false;
            d.touch.kind = "none";
            d.enabled.touch = false;
            d.sends.kind = "faders";
            d.sends.faders = faders;
            d.sends.ccBase = ccBase;
          }),
        ).setup[0].script;
        const emitted = body.match(/gms\(0,176,([0-9]*)\+?f,/);
        const base = emitted === null ? 0 : Number(emitted[1] || 0);
        expect(base + faders - 1, `${faders} faders from ${ccBase}`)
          .toBeLessThanOrEqual(127);
      }
    }
  });

  // ccBase is clamped against the highest controller the state actually
  // reaches, not a flat 126. A flat clamp emitted controller 128 on three
  // faders and 129 on four, neither of which is a legal CC.
  it("clamps the top of the CC range to the fader count", () => {
    for (const faders of [3, 4]) {
      const body = compile(
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "faders";
          d.sends.faders = faders;
          d.sends.ccBase = 127;
        }),
      ).setup[0].script;
      const emitted = body.match(/gms\(0,176,([0-9]*)\+?f,/);
      const base = emitted === null ? 0 : Number(emitted[1] || 0);
      expect(base + faders - 1, `${faders} faders`).toBeLessThanOrEqual(127);
    }
  });

  // In hiRes the xy kind sends each axis as a 14-bit pair at n and n+32, so
  // it reaches ccBase+33, not ccBase+1. The clamp has to account for that or
  // the coarse pair is legal while the fine pair runs off the end.
  it("leaves room for the 14-bit pair when xy is high resolution", () => {
    for (const hiRes of [false, true]) {
      const body = compile(
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "xy";
          d.sends.hiRes = hiRes;
          d.sends.ccBase = 127;
        }),
      ).setup[0].script;
      const used = [...body.matchAll(/gms\([0-9]+,176,([0-9]+)/g)].map((m) =>
        Number(m[1]),
      );
      expect(used.length, `hiRes ${hiRes}`).toBeGreaterThan(0);
      const highest = Math.max(...used) + (hiRes ? 32 : 0);
      expect(highest, `hiRes ${hiRes} highest controller`).toBeLessThanOrEqual(
        127,
      );
    }
  });

  it("keeps a shelf card's stamp short", () => {
    // A card that has not been adjusted stamps a reference to itself, not
    // a field dump. That is what lets the trackpad recipe fit its own
    // budget with room left over.
    for (const preset of PRESETS) {
      const built = compile(preset.state);
      expect(built.stamp.length, preset.id).toBeLessThanOrEqual(12);
      expect(decodeStamp(built.stamp), preset.id).toBeDefined();
    }
    // An adjusted card falls back to the full dump and costs more.
    const adjusted = clonePadState(PRESETS[0].state);
    delete adjusted.preset;
    expect(encodeStamp(adjusted).length).toBeGreaterThan(
      encodeStamp(PRESETS[0].state).length,
    );
  });

  it("prices the marker at one character per payload character", () => {
    // Measured: a #z. prefix and a 16-character payload costs 19 over a
    // bare --[[@cb]], which is the ledger's "Settings stamp 19".
    const bare = "--[[@cb]]".length;
    const named = `--[[@cb#${STAMP_PREFIX}${"a".repeat(16)}]]`.length;
    expect(named - bare).toBe(19);
  });

  it("names our actions and only ours", () => {
    const stamp = compile(defaultState()).stamp;
    expect(padActionRole("cb", `${STAMP_PREFIX}${stamp}`)).toBe("managed");
    expect(padActionRole("cb", `${STAMP_PREFIX}t`)).toBe("timer");
    expect(padActionRole("cb", `${STAMP_PREFIX}u`)).toBe("user");
    expect(padActionRole("cb", undefined)).toBeUndefined();
    expect(padActionRole("cb", "something")).toBeUndefined();
    expect(padActionRole("gms", `${STAMP_PREFIX}${stamp}`)).toBeUndefined();
    expect(isPadManagedAction("cb", `${STAMP_PREFIX}u`)).toBe(true);
    expect(isPadManagedAction("cb", "swl")).toBe(false);
  });
});

describe("the Timer event", () => {
  it("re-arms before it does anything else", () => {
    // The handler runs inside a pcall, so anything that throws after the
    // re-arm would stop the pad forever.
    const failures = [];
    for (const { label, state } of allStates()) {
      for (const action of compile(state).timer) {
        if (action.script.trim() === "") continue;
        if (!action.script.startsWith("gtt(")) {
          failures.push(`${label}: ${action.script.slice(0, 24)}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("keeps a continuous look alive for 41 characters", () => {
    // Measured with the real GridScript.compressScript. This is the whole
    // reason the keeper went into the Timer event instead of self.tim,
    // which costs 76 characters of Setup's own budget.
    const built = compile(
      withState((d) => {
        d.look.kind = "wave";
        d.touch.kind = "comet";
        d.sends.kind = "none";
      }),
    );
    expect(built.timerPeriodMs).toBe(KEEPER_PERIOD_SLOW);
    expect(built.timer).toHaveLength(1);
    const body = built.timer[0].script;
    expect(body.startsWith("gtt(0,3e5)")).toBe(true);
    expect(body).toContain("65535");
    expect(body).toContain("glt(");
    expect(body.length).toBe(41);
    // 13 marker characters, one space, 41 of body.
    expect(built.timerLua.length).toBe(55);
  });

  it("goes to a 20 ms tick only when something else needs the slot", () => {
    // Two Timer bodies, not one. The spec quotes 41 for the keeper and
    // separately sketches a 20 ms counter form without reconciling them.
    expect(compile(presetById("aurora").state).timerPeriodMs).toBe(
      KEEPER_PERIOD_SLOW,
    );
    expect(compile(presetById("ninepads").state).timerPeriodMs).toBe(
      KEEPER_PERIOD_FAST,
    );
    expect(compile(presetById("tpad").state).timerPeriodMs).toBe(
      KEEPER_PERIOD_FAST,
    );
  });

  it("keeps both layers alive for the showpiece", () => {
    const body = compile(
      withState((d) => (d.look.kind = "showpiece")),
    ).timer[0].script;
    const layers = luaCalls(body)
      .filter((c) => c.name === "glt")
      .map((c) => c.args[1]);
    expect(layers).toContain("1");
    expect(layers).toContain("2");
  });

  it("stops generating a Timer body when the user took the slot", () => {
    // Spec 6.3: detach is per slot, never total.
    const mine = compile(withState((d) => (d.look.kind = "wave")));
    const theirs = compile(
      withState((d) => {
        d.look.kind = "wave";
        d.owned = { timer: "user" };
      }),
    );
    expect(theirs.timerLua).not.toBe(mine.timerLua);
    const handler = compile(
      withState((d) => {
        d.touch.kind = "comet";
        d.owned = { touchHandler: "user" };
      }),
    ).setup[0].script;
    expect(handler).not.toContain("touch_cb");
  });
});

describe("the named seams", () => {
  it("emits nothing at all when Your code is empty", () => {
    // An empty --[[@cb#z.u]] action costs 13 characters of the tightest
    // budget in the product and buys nothing.
    const failures = [];
    for (const { label, state } of allStates()) {
      const built = compile(state, { script: "" });
      if (built.setup.length !== 1) failures.push(`${label}: extra action`);
      for (const body of bodiesOf(state, { script: "   " })) {
        if (body.includes("s.uh")) failures.push(`${label}: touch seam`);
        if (body.includes("s.ut")) failures.push(`${label}: timer seam`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("emits only the hook the user's code actually fills", () => {
    const touchOnly = compile(defaultState(), {
      script: "self.uh=function(s,i,e,x,y)s.u1=x end",
    });
    expect(touchOnly.seams).toEqual({ touch: true, timer: false });
    expect(touchOnly.setup[0].script).toContain(SEAM_TOUCH);
    expect(touchOnly.timer[0].script).not.toContain(SEAM_TIMER);

    const both = compile(defaultState(), {
      script: "self.uh=function(s,i,e,x,y)end self.ut=function(s)end",
    });
    expect(both.seams).toEqual({ touch: true, timer: true });
    expect(both.setup[0].script).toContain(SEAM_TOUCH);
    expect(both.timer[0].script).toContain(SEAM_TIMER);
    // The timer hook runs last, after the re-arm and the keeper, so a slow
    // user tick never delays the re-arm.
    expect(both.timer[0].script.endsWith(SEAM_TIMER)).toBe(true);
    // The touch hook runs last inside the handler, so the user's code sees
    // the final state of everything the pad did with that sample.
    const setupBody = both.setup[0].script;
    const seamAt = setupBody.indexOf(SEAM_TOUCH);
    const painted = luaCalls(setupBody)
      .filter((c) => [...LED_CALLS, ...OUT_CALLS].includes(c.name))
      .map((c) => c.index);
    expect(Math.max(...painted)).toBeLessThan(seamAt);
  });

  it("copies Your code through byte for byte and never parses it", () => {
    const script = "self.uh=function(s,i,e,x,y)  s.u1 = x/3  end -- mine";
    const built = compile(defaultState(), { script });
    const user = built.setup.find(
      (a) => a.name === `${STAMP_PREFIX}u`,
    );
    expect(user).toBeDefined();
    expect(user.script).toBe(script);
    expect(built.setupLua).toContain(script);
    // and a second compile of the same input is identical
    expect(compile(built.state, { script }).setupLua).toBe(built.setupLua);
  });

  it("lets the caller override the detected seams", () => {
    expect(detectSeams("self.uh=function() end")).toEqual({
      touch: true,
      timer: false,
    });
    expect(detectSeams("self.ut=function() end")).toEqual({
      touch: false,
      timer: true,
    });
    expect(detectSeams("print('hello')")).toEqual({
      touch: false,
      timer: false,
    });
    const forced = compile(defaultState(), {
      script: "s.u1=1",
      seams: { touch: true, timer: true },
    });
    expect(forced.setup[0].script).toContain(SEAM_TOUCH);
    expect(forced.timer[0].script).toContain(SEAM_TIMER);
  });

  it("charges Your code to the budget", () => {
    const bare = cost(compile(defaultState()));
    const script = `self.uh=function(s,i,e,x,y)s.u1=${"1+".repeat(30)}1 end`;
    const withCode = cost(compile(defaultState(), { script }));
    expect(withCode.setup.used).toBeGreaterThan(bare.setup.used + script.length);
  });
});

describe("validation", () => {
  it("passes every generated body through the real syntax check", () => {
    // checkSyntax is a bare Lua parse and knows nothing about Grid
    // functions, so it is the last gate rather than the only one. It is
    // still the gate that decides whether sendToGrid quietly does nothing.
    const failures = [];
    for (const { label, state } of sampleStates()) {
      for (const body of bodiesOf(state)) {
        if (!GridScript.checkSyntax(body)) failures.push(label);
      }
    }
    expect(failures).toEqual([]);
  });

  it("reports no error for any preset", () => {
    for (const preset of PRESETS) {
      const errors = validate(compile(preset.state)).filter(
        (d) => d.severity === "error",
      );
      expect(errors, preset.id).toEqual([]);
    }
  });

  it("reports an over-budget event in characters, not in shorts", () => {
    const built = compile(defaultState());
    const errors = validate(built, { setup: 900, timer: 0 }).filter(
      (d) => d.severity === "error",
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("over-budget");
    expect(errors[0].event).toBe("setup");
    // Never "script too long", never a raw short code.
    expect(errors[0].message).not.toContain("script");
    expect(errors[0].message).toMatch(/characters/);
  });

  it("explains every suppression instead of silently dropping a sheet", () => {
    const built = compile(
      withState((d) => {
        d.look.kind = "showpiece";
        d.touch.kind = "bloom";
      }),
    );
    const warnings = validate(built).filter((d) => d.severity === "warning");
    expect(warnings.some((w) => w.code === "suppressed")).toBe(true);
    for (const w of warnings) expect(w.message.length).toBeGreaterThan(0);
  });
});

describe("the write", () => {
  function fakeAdapter(withStore = true) {
    const calls = [];
    const writer = (tag) => ({
      replace: async (actions) => {
        calls.push({ call: `${tag}.replace`, actions });
      },
      send: async () => {
        calls.push({ call: `${tag}.send` });
      },
    });
    const adapter = { setup: writer("setup"), timer: writer("timer") };
    if (withStore) {
      adapter.storePage = async () => {
        calls.push({ call: "storePage" });
      };
    }
    return { adapter, calls };
  }

  it("writes the Timer event first, always", async () => {
    // Storing Setup alone leaves the left mouse button held down after the
    // first tap, because Setup runs immediately in the live VM and nothing
    // exists yet to release it. It also satisfies gtt's precondition,
    // which is a no-op until the Timer event holds a stored action.
    const { adapter, calls } = fakeAdapter();
    const built = compile(presetById("aurora").state);
    await writePad(adapter, built);
    expect(calls.map((c) => c.call)).toEqual([
      "timer.replace",
      "timer.send",
      "setup.replace",
      "setup.send",
      "storePage",
    ]);
    expect(calls[0].actions).toBe(built.timer);
    expect(calls[2].actions).toBe(built.setup);
  });

  // Observed on real hardware: writing a config while the module ran a 20 ms
  // keeper timer failed with "Waiting for response was interrupted", and the
  // pad kept its old Setup beside the new Timer. A retry succeeded.
  it("retries a transient serial failure and recovers", async () => {
    const { adapter, calls } = fakeAdapter(false);
    let failures = 2;
    const realSend = adapter.setup.send;
    adapter.setup.send = async () => {
      if (failures-- > 0) throw new Error("Waiting for response was interrupted");
      return realSend();
    };
    await writePad(adapter, compile(defaultState()));
    expect(calls.filter((c) => c.call === "setup.send")).toHaveLength(1);
  });

  it("retries a plain-object rejection carrying transient text", async () => {
    // GridEvent.sendToGrid() rejects with { value, text, type }, not an
    // Error. The retry ladder has to read .text, or the exact failure it
    // was built for — "Waiting for response was interrupted" — is
    // classified as non-transient and given up on at attempt 1.
    const { adapter, calls } = fakeAdapter(false);
    let failures = 1;
    const realSend = adapter.setup.send;
    adapter.setup.send = async () => {
      if (failures-- > 0) {
        throw {
          value: false,
          text: "Waiting for response was interrupted",
          type: "SEND_EVENT_TO_GRID",
        };
      }
      return realSend();
    };
    await writePad(adapter, compile(defaultState()));
    expect(calls.filter((c) => c.call === "setup.send")).toHaveLength(1);
  });

  it("reports a partial write when Setup will not land", async () => {
    const { adapter } = fakeAdapter(false);
    adapter.setup.send = async () => {
      throw new Error("Waiting for response was interrupted");
    };
    const thrown = await writePad(adapter, compile(defaultState())).catch((e) => e);
    expect(thrown).toBeInstanceOf(PadPartialWriteError);
    // The caller has to know which half landed, because the pad is now running
    // a mixed configuration and only a retry fixes it.
    expect(thrown.wrote).toEqual(["timer"]);
    expect(thrown.failed).toBe("setup");
    expect(thrown.message).toMatch(/mixed configuration/i);
  });

  it("does not retry a failure that is not transient", async () => {
    const { adapter, calls } = fakeAdapter(false);
    adapter.timer.send = async () => {
      throw new Error("element invalid after replace");
    };
    await writePad(adapter, compile(defaultState())).catch(() => {});
    // One attempt only: retrying a malformed action would never converge.
    expect(calls.filter((c) => c.call === "timer.replace")).toHaveLength(1);
  });

  it("auditions through the same path minus the store", async () => {
    const { adapter, calls } = fakeAdapter(false);
    await writePad(adapter, compile(defaultState()));
    expect(calls.map((c) => c.call)).toEqual([
      "timer.replace",
      "timer.send",
      "setup.replace",
      "setup.send",
    ]);
  });

  it("refuses to write anything when validation fails", async () => {
    // GridEvent.sendToGrid() answers { value: true } when the event has
    // invalid actions, so a broken script reports success and leaves the
    // pad dead. The gate has to be before either write, not after.
    const { adapter, calls } = fakeAdapter();
    const built = compile(defaultState());
    await expect(
      writePad(adapter, built, { setup: 900, timer: 0 }),
    ).rejects.toBeInstanceOf(PadCompileError);
    expect(calls).toEqual([]);
  });

  it("carries the diagnostics on the error it throws", async () => {
    const { adapter } = fakeAdapter();
    let thrown;
    try {
      await writePad(adapter, compile(defaultState()), {
        setup: 900,
        timer: 0,
      });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(PadCompileError);
    expect(thrown.diagnostics.length).toBeGreaterThan(0);
    expect(thrown.diagnostics.every((d) => d.severity === "error")).toBe(true);
  });
});

describe("the fit solver", () => {
  // The budget is forced by reserving characters for foreign actions
  // rather than by hunting for a state that overflows on its own, so the
  // ladder is exercised deterministically and the test does not go stale
  // when a recipe gets shorter.
  const crowded = () =>
    withState((d) => {
      d.look.kind = "swirl";
      d.touch.kind = "bloom";
      d.sends.kind = "zones";
      d.sends.grid = "4x4";
      d.sends.showGrid = true;
      d.sends.hiRes = true;
      d.sends.fingers = "each";
    });
  const RESERVED = { setup: 480, timer: 0 };
  const LADDER = ["showGrid", "hiRes", "lookDown", "touchDown", "touchOff", "lookOff"];

  it("proposes and never applies", () => {
    const before = crowded();
    const snapshot = JSON.stringify(before);
    fit(before, { reserved: RESERVED });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it("reports the state as it stands when it already fits", () => {
    const plan = fit(presetById("aurora").state);
    expect(plan.fits).toBe(true);
    expect(plan.steps).toEqual([]);
    expect(plan.resolved).toBeUndefined();
    expect(plan.setup.limit).toBe(908);
    expect(plan.timer.limit).toBe(908);
  });

  it("sheds in the specified order and ends inside the budget", () => {
    const state = crowded();
    expect(cost(compile(state), RESERVED).fits).toBe(false);

    const plan = fit(state, { reserved: RESERVED });
    expect(plan.fits).toBe(true);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.resolved).toBeDefined();
    expect(cost(compile(plan.resolved), RESERVED).fits).toBe(true);

    // Least visible loss first: decoration before behaviour, Sends never
    // sheds past fine resolution, and Your code is never touched.
    const ranks = plan.steps.map((s) => LADDER.indexOf(s.id));
    expect(ranks.every((r) => r >= 0)).toBe(true);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
  });

  it("prints a sentence a user can refuse, and a real saving", () => {
    const state = crowded();
    const plan = fit(state, { reserved: RESERVED });
    let current = state;
    for (const step of plan.steps) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.label).not.toMatch(/showGrid|hiRes|glc|glp|layer/);
      expect(step.from.length).toBeGreaterThan(0);
      expect(step.to.length).toBeGreaterThan(0);
      const before = cost(compile(current), RESERVED);
      const next = step.apply(current);
      const after = cost(compile(next), RESERVED);
      expect(step.saves.setup, step.id).toBe(
        before.setup.used - after.setup.used,
      );
      expect(step.saves.timer, step.id).toBe(
        before.timer.used - after.timer.used,
      );
      current = next;
    }
  });

  it("never proposes degrading the control the hand is on", () => {
    for (const pinned of ["look", "touch", "sends"]) {
      const plan = fit(crowded(), { reserved: RESERVED, pinned });
      expect(
        plan.steps.some((s) => s.feature === pinned),
        pinned,
      ).toBe(false);
    }
  });

  it("says why when no ladder exists rather than degrading Sends", () => {
    // A fader bank quietly becoming three faders is the silent lie the
    // product exists to prevent, so the solver refuses and names the
    // blockage instead.
    const plan = fit(
      withState((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
        d.sends.kind = "faders";
        d.sends.showGrid = false;
      }),
      { reserved: { setup: 880, timer: 0 } },
    );
    expect(plan.fits).toBe(false);
    expect(plan.blocked).toBeDefined();
    expect(plan.resolved).toBeUndefined();
  });
});

describe("reading a pad back", () => {
  const asInput = (built, user) => ({
    setup: built.setup.map((a) => ({ ...a })),
    timer: built.timer.map((a) => ({ ...a })),
    ...(typeof user === "undefined" ? {} : {}),
  });

  it("restores our own configuration exactly", () => {
    for (const preset of PRESETS) {
      const built = compile(preset.state);
      const read = readPad(asInput(built));
      expect(read.state, preset.id).toBeDefined();
      expect(compile(read.state).setupLua, preset.id).toBe(built.setupLua);
      expect(read.foreign, preset.id).toEqual([]);
      expect(read.claims, preset.id).toEqual([]);
      expect(read.user, preset.id).toBe("");
    }
  });

  it("hands Your code back untouched", () => {
    const script = "self.uh=function(s,i,e,x,y)s.u1=x end";
    const built = compile(defaultState(), { script });
    const read = readPad(asInput(built));
    expect(read.user).toBe(script);
    expect(read.state).toBeDefined();
  });

  it("does not guess when there is no stamp", () => {
    // The factory default falls in this bucket, deliberately: the rail's
    // first card reads "On your pad now (hand written)" and nothing is
    // written until the user chooses to replace it.
    const read = readPad({
      setup: [{ short: "cb", script: "self.touch_cb=function(s,i,e,x,y)end" }],
      timer: [],
    });
    expect(read.state).toBeUndefined();
    expect(read.foreign).toHaveLength(1);
  });

  it("treats a stamp it cannot read as no stamp, never as a corrupt one", () => {
    const read = readPad({
      setup: [{ short: "cb", name: `${STAMP_PREFIX}zzzz`, script: "local a=1" }],
      timer: [],
    });
    expect(read.state).toBeUndefined();
    expect(read.foreign).toHaveLength(1);
  });

  it("names the danger when a foreign block claims a slot we own", () => {
    // On a ZONA Setup event a foreign block's self.touch_cb assignment is
    // silently overwritten by the generated one that runs after it. No
    // error, no toast, no marker: the pad simply does something other than
    // what two of its blocks say.
    const claims = scanForeignSlots(
      [
        { short: "cb", script: "self.touch_cb=function(s,i,e,x,y)end" },
        { short: "cb", script: "self.tim=function(s)end" },
        { short: "cb", script: "glc(0,2,255,0,0,1)" },
      ],
      "setup",
    );
    const slots = claims.map((c) => c.slot);
    expect(slots).toContain("touchHandler");
    expect(slots).toContain("timer");
    expect(slots).toContain("layer2");
    for (const claim of claims) {
      expect(claim.event).toBe("setup");
      expect(claim.message.length).toBeGreaterThan(0);
      // Plain words, never a short code and never a mechanism.
      expect(claim.message).not.toMatch(/touch_cb|self\.tim|glc|layer 2/);
    }
    // One warning per slot is enough.
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("never accuses its own actions", () => {
    const built = compile(presetById("aurora").state);
    expect(scanForeignSlots(built.setup, "setup")).toEqual([]);
    expect(scanForeignSlots(built.timer, "timer")).toEqual([]);
  });
});

describe("the ledger", () => {
  it("names every row in plain words and prices it differentially", () => {
    const state = withState((d) => {
      d.look.kind = "wave";
      d.touch.kind = "comet";
      d.sends.kind = "zones";
      d.sends.grid = "3x3";
    });
    const rows = ledger(state);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.label.length).toBeGreaterThan(0);
      expect(["setup", "timer"]).toContain(row.event);
      expect(typeof row.chars).toBe("number");
      // Never a short code, never "layer", never "phase".
      expect(row.label).not.toMatch(/glc|glp|glpfs|layer|phase|rate|shape/i);
    }
    // The stamp is a generated row rather than a hidden tax: hiding it
    // would make the arithmetic look wrong.
    const stamp = rows.find((r) => r.id === "stamp");
    expect(stamp).toBeDefined();
    expect(stamp.generated).toBe(true);
    expect(stamp.chars).toBe(
      1 + STAMP_PREFIX.length + compile(state).stamp.length,
    );
    // The keeper is generated the moment anything animates, and it is
    // never offered as a checkbox: a pad that freezes after eleven minutes
    // must not be shippable.
    const keeper = rows.find((r) => r.id === "keeper");
    expect(keeper).toBeDefined();
    expect(keeper.event).toBe("timer");
    expect(keeper.generated).toBe(true);
  });

  it("charges each sheet what turning it off would actually free", () => {
    const state = withState((d) => {
      d.look.kind = "wave";
      d.touch.kind = "comet";
    });
    const rows = ledger(state);
    const base = cost(compile(state)).setup.used;
    for (const id of ["look", "touch"]) {
      const row = rows.find((r) => r.id === id);
      if (typeof row === "undefined") continue;
      const off = clonePadState(state);
      off[id].kind = "none";
      delete off.preset;
      expect(row.chars, id).toBe(base - cost(compile(off)).setup.used);
    }
  });

  it("prices a candidate change before it is committed", () => {
    // The ghost segment: the price lands before the choice does.
    const state = withState((d) => (d.look.kind = "breathe"));
    const before = cost(compile(state)).setup.used;
    const ghost = ghostCost(state, (d) => (d.look.kind = "ripple"));
    expect(ghost.setup.used).toBeGreaterThan(before);
    // and it did not commit anything
    expect(state.look.kind).toBe("breathe");
  });
});

describe("the domain tables", () => {
  it("keeps every decay pair landing dark", () => {
    // Phase starts at 255 and firmware applies `ticks` decrements of
    // 256 - rate, so the cell lands on 255 - step*ticks. Every product
    // here is in 248..254, which puts the one-frame end-of-fade flash out
    // of reach.
    for (const row of DECAY_TABLE) {
      const product = (256 - row.rate) * row.ticks;
      expect(product, `${row.ms} ms`).toBeGreaterThanOrEqual(248);
      expect(product, `${row.ms} ms`).toBeLessThanOrEqual(254);
      expect(row.rate).toBeGreaterThan(0);
      expect(row.rate).toBeLessThanOrEqual(255);
    }
    // and it is ordered, so a trail slider reads monotonically
    for (let i = 1; i < DECAY_TABLE.length; i++) {
      expect(DECAY_TABLE[i].ms).toBeGreaterThan(DECAY_TABLE[i - 1].ms);
    }
  });

  it("snaps a trail length onto a real pair", () => {
    for (const row of DECAY_TABLE) expect(nearestDecay(row.ms)).toEqual(row);
    expect(DECAY_TABLE).toContainEqual(nearestDecay(0));
    expect(DECAY_TABLE).toContainEqual(nearestDecay(99999));
    expect(nearestDecay(415).ms).toBe(420);
  });

  it("snaps speed to a rate, because nothing exists between 1 and 2", () => {
    expect(SPEED_TABLE).toHaveLength(8);
    for (const row of SPEED_TABLE) {
      expect(Number.isInteger(row.rate)).toBe(true);
      expect(row.rate).toBeGreaterThanOrEqual(1);
      expect(row.seconds).toBeCloseTo(2.56 / row.rate, 2);
      expect(speedRate(row.step, false)).toBe(row.rate);
      // Direction is a sign flip on the rate, never a second pattern.
      expect(speedRate(row.step, true)).toBe(256 - row.rate);
    }
    // Detents are strictly faster as the step rises.
    for (let i = 1; i < SPEED_TABLE.length; i++) {
      expect(SPEED_TABLE[i].rate).toBeGreaterThan(SPEED_TABLE[i - 1].rate);
    }
    // Out-of-range steps clamp rather than throw.
    expect(speedRate(0, false)).toBe(SPEED_TABLE[0].rate);
    expect(speedRate(99, false)).toBe(SPEED_TABLE[7].rate);
  });

  it("keeps a wave from degenerating into a scan", () => {
    // A wavelength within a row stride of 256/9 = 28.4 aligns the wave
    // with the grid, so the user would get Scan while the card said Wave.
    for (let w = WAVELENGTH_MIN; w <= WAVELENGTH_MAX; w++) {
      const snapped = snapWavelength(w);
      expect(WAVELENGTH_EXCLUDED, `${w}`).not.toContain(snapped);
      expect(snapped).toBeGreaterThanOrEqual(WAVELENGTH_MIN);
      expect(snapped).toBeLessThanOrEqual(WAVELENGTH_MAX);
    }
    expect(snapWavelength(0)).toBe(WAVELENGTH_MIN);
    expect(snapWavelength(1000)).toBe(WAVELENGTH_MAX);
  });

  it("quantises colour to the fidelity the stamp carries", () => {
    // RGB444. Quantising in the state rather than in the encoder is what
    // makes the stamp round trip a real identity.
    for (const v of [0, 17, 34, 255]) {
      expect(quantiseColour({ r: v, g: v, b: v })).toEqual({
        r: v,
        g: v,
        b: v,
      });
    }
    const q = quantiseColour({ r: 20, g: 206, b: 150 });
    for (const channel of [q.r, q.g, q.b]) {
      expect(channel % 17).toBe(0);
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
    expect(quantiseColour({ r: -5, g: 999, b: 128 }).r).toBe(0);
    expect(quantiseColour({ r: -5, g: 999, b: 128 }).g).toBe(255);
  });

  it("defaults to the stateless option everywhere", () => {
    // On this hardware the cheap option is also the correct one, so
    // defaulting to it is not a compromise.
    const d = defaultState();
    expect(d.touch.kind).toBe("comet");
    expect(d.sends.hiRes).toBe(false);
    expect(d.sends.showGrid).toBe(false);
    expect(d.version).toBe(1);
    expect(d).toEqual(clonePadState(DEFAULT_PAD_STATE));
    // and it is a copy, not the shared constant
    d.look.speed = 7;
    expect(DEFAULT_PAD_STATE.look.speed).not.toBe(7);
  });

  it("keeps every preset self-consistent", () => {
    const ids = new Set();
    for (const preset of PRESETS) {
      expect(ids.has(preset.id), preset.id).toBe(false);
      ids.add(preset.id);
      expect(presetById(preset.id)).toBe(preset);
      expect(preset.state.preset).toBe(preset.id);
      // At most four knobs plus the colour row, for every preset, always.
      expect(preset.knobs.length, preset.id).toBeLessThanOrEqual(4);
      // One outcome sentence, written for a musician.
      expect(preset.sentence.length, preset.id).toBeGreaterThan(0);
      expect(preset.sentence, preset.id).not.toMatch(
        /layer|phase|rate|shape|contact id|Setup/,
      );
      expect(["looks", "instruments", "computer"]).toContain(preset.category);
    }
    expect(presetById("nothing-like-this")).toBeUndefined();
    // The trackpad uses the whole pad, so nothing composes alongside it.
    expect(presetById("tpad").exclusive).toBe(true);
    expect(presetById("tpad").quiet).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// The stamp across versions. The fixture strings below were captured from
// the codec BEFORE the v2 format landed; they are the only proof an old
// pad still opens. Never regenerate them from the current code: that
// would make the test a tautology.

// ---------------------------------------------------------------------------
// Brightness: one detent per card, applied at compile time to every
// emitted channel literal through the scaleChannel funnel.

describe("brightness", () => {
  it("keeps the table's shape: five detents, plain words, 15 floor", () => {
    expect(BRIGHTNESS_TABLE.map((r) => r.step)).toEqual([1, 2, 3, 4, 5]);
    expect(BRIGHTNESS_TABLE.map((r) => r.pct)).toEqual([15, 30, 50, 75, 100]);
    expect(BRIGHTNESS_TABLE.map((r) => r.word)).toEqual([
      "Dim",
      "Low",
      "Half",
      "Bright",
      "Full",
    ]);
    expect(DEFAULT_PAD_STATE.brightness).toBe(5);
  });

  it("scales channels by hand-checked vectors and is the identity at 100", () => {
    expect(scaleChannel(255, 15)).toBe(38);
    expect(scaleChannel(90, 15)).toBe(13);
    expect(scaleChannel(17, 15)).toBe(2);
    expect(scaleChannel(60, 50)).toBe(30);
    for (const v of [0, 1, 17, 60, 85, 128, 200, 254, 255]) {
      expect(scaleChannel(v, 100)).toBe(v);
    }
    // No RGB444-quantised nonzero channel collapses to 0 at the floor.
    for (let q = 17; q <= 255; q += 17) {
      expect(scaleChannel(q, 15), `channel ${q}`).toBeGreaterThan(0);
    }
  });

  it("keeps every scaled coefficient expression inside 0..255 at every detent", () => {
    // The arithmetic colour forms keep their shape under scaling, so the
    // worst case of each must be enumerated: a negative literal reaching
    // lua_tointeger would wreck the channel silently.
    for (const { pct } of BRIGHTNESS_TABLE) {
      const sc = (v) => scaleChannel(v, pct);
      const checks = [];
      for (let f = 0; f <= 3; f++) {
        // Blocks palette: f*80, 255-f*60, 200-f*60.
        checks.push(f * sc(80), sc(255) - f * sc(60), sc(200) - f * sc(60));
        // Rails, four faders: f*85, 255-f*20, 255-f*85.
        checks.push(f * sc(85), sc(255) - f * sc(20), sc(255) - f * sc(85));
      }
      for (let f = 0; f <= 2; f++) {
        // Rails, three faders: f*127, 255-f*30, 255-f*127.
        checks.push(f * sc(127), sc(255) - f * sc(30), sc(255) - f * sc(127));
      }
      for (let i = 0; i <= 4; i++) {
        // Per-finger: 255-i*60, i*60, 128.
        checks.push(sc(255) - i * sc(60), i * sc(60), sc(128));
      }
      for (const v of checks) {
        expect(v, `pct=${pct}`).toBeGreaterThanOrEqual(0);
        expect(v, `pct=${pct}`).toBeLessThanOrEqual(255);
      }
    }
  });

  it("clamps the detent and resets it when nothing lights", () => {
    const at = (b) =>
      normalisePadState(withState((d) => (d.brightness = b))).brightness;
    expect(at(0)).toBe(1);
    expect(at(9)).toBe(5);
    expect(at(3.4)).toBe(3);
    // A card that lights nothing cannot carry an invisible dim: the reset
    // mirrors the codec, so the stamp stays format "a".
    const dark = withState((d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "none";
      d.enabled.touch = false;
      d.sends.kind = "xy";
      d.brightness = 2;
    });
    expect(normalisePadState(dark).brightness).toBe(5);
    expect(encodeStamp(dark)[0]).toBe(STAMP_FORMAT_STATE);
  });

  it("survives the clone like every other field", () => {
    const s = withState((d) => (d.brightness = 2));
    expect(clonePadState(s).brightness).toBe(2);
  });

  it("hides the knob on exactly the trackpad among shipped presets", () => {
    for (const p of PRESETS) {
      expect(padLightsAnything(groundPadState(p.state)), p.id).toBe(
        p.id !== "tpad",
      );
    }
    // The accepted edge: pre-grounding, a disturb over no look claims to
    // light; grounding drops the sheet and the claim with it, which is
    // why the panel asks about the grounded state.
    const edge = withState((d) => {
      d.look.kind = "none";
      d.enabled.look = false;
      d.touch.kind = "disturb";
    });
    expect(padLightsAnything(normalisePadState(edge))).toBe(true);
    expect(padLightsAnything(groundPadState(edge))).toBe(false);
  });

  it("compiles byte-identically at Full to a state that was never dimmed", () => {
    const restored = normalisePadState(withState((d) => (d.brightness = 1)));
    restored.brightness = 5;
    const once = compile(defaultState());
    const twice = compile(restored);
    expect(twice.setupLua).toBe(once.setupLua);
    expect(twice.timerLua).toBe(once.timerLua);
  });

  it("scales the emitted literals at Dim, spot-checked by hand", () => {
    const dim = withState((d) => (d.brightness = 1));
    const lua = compile(dim).setupLua;
    // Look colour (0, 90, 255) quantises to (0, 85, 255): 0, 12, 38.
    expect(lua).toContain("glc(a,2,0,12,38,1)");
    // Comet colour (255, 170, 40) quantises to (255, 170, 34): 38, 25, 5.
    expect(lua).toContain("glc(a,1,38,25,5,1)");
    // Phases, rates and timeouts never scale.
    expect(lua).toContain("glt(a,2,65535)");
    expect(lua).toContain("glt(a,1,42)");
  });

  it("never scales at the default: the ledger prices the same rows", () => {
    const explicit = withState((d) => (d.brightness = 5));
    expect(ledger(explicit)).toEqual(ledger(defaultState()));
  });

  it("prices the dimmed stamp one character over the full one", () => {
    // +3 payload bits on the 60-bit default dump: 13 chars instead of 12.
    const full = encodeStamp(defaultState());
    const dim = encodeStamp(withState((d) => (d.brightness = 1)));
    expect(dim.length).toBe(full.length + 1);
  });
});

describe("the stamp across versions", () => {
  const V1_FIXTURES = [
    ["default", "at05u91pv8j00", () => defaultState()],
    [
      "xy hiRes with calib",
      "at05u91pv8j10555g",
      () =>
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.hiRes = true;
          d.sends.ccBase = 20;
          d.calib = { rot: 1, flipX: true, flipY: false };
        }),
    ],
    [
      "zones drawn with colours",
      "a4080lg68ikfo10",
      () =>
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "zones";
          d.sends.grid = "4x4";
          d.sends.showGrid = true;
          d.sends.gridColour = { r: 34, g: 170, b: 51 };
          d.sends.heldColour = { r: 255, g: 0, b: 17 };
          d.sends.baseNote = 48;
        }),
    ],
    [
      "three faders",
      "a40c0la00",
      () =>
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "faders";
          d.sends.faders = 3;
          d.sends.layout = "rails";
          d.sends.ccBase = 40;
        }),
    ],
    [
      "trackpad tuned",
      "as0hovvo0",
      () =>
        withState((d) => {
          d.sends.kind = "trackpad";
          d.sends.trackpad = {
            scrollInvert: false,
            scrollUnits: 384,
            pointerCap: 16,
            pointerHoldOff: 8,
            tapTolerance: 300,
            tapTicks: 90,
            clickTicks: 8,
          };
        }),
    ],
    [
      "owned slots",
      "at05u91pv8j01a",
      () =>
        withState((d) => {
          d.owned = { timer: "user", layer2: "user" };
        }),
    ],
  ];

  it("still writes yesterday's stamps, bit for bit", () => {
    // A state that does not need v2 must keep producing the exact v1
    // payload, so an OLDER build can still read what this one writes.
    for (const [label, frozen, build] of V1_FIXTURES) {
      expect(encodeStamp(build()), label).toBe(frozen);
    }
  });

  it("still decodes yesterday's stamps to the same states, forever", () => {
    for (const [label, frozen, build] of V1_FIXTURES) {
      const back = decodeStamp(frozen);
      expect(back, label).toBeDefined();
      expect(JSON.stringify(normalisePadState(back)), label).toBe(
        JSON.stringify(normalisePadState(build())),
      );
    }
  });

  it("writes the new format only when the state needs it", () => {
    const xyBoth = withState((d) => (d.sends.kind = "xy"));
    expect(encodeStamp(xyBoth)[0]).toBe(STAMP_FORMAT_STATE);
    const xyX = withState((d) => {
      d.sends.kind = "xy";
      d.sends.axes = "x";
    });
    expect(encodeStamp(xyX)[0]).toBe(STAMP_FORMAT_STATE_V2);
    const dial = withState((d) => (d.sends.kind = "dial"));
    expect(encodeStamp(dial)[0]).toBe(STAMP_FORMAT_STATE_V2);
  });

  it("declines a v1 payload that claims the dial, as corruption", () => {
    // The dial branch has the same bit shape in both formats, so grafting
    // a dial payload onto the v1 format character parses cleanly right up
    // to the kind check, which must reject index 5 under v1.
    const dial = encodeStamp(withState((d) => (d.sends.kind = "dial")));
    expect(dial[0]).toBe(STAMP_FORMAT_STATE_V2);
    expect(decodeStamp(STAMP_FORMAT_STATE + dial.slice(1))).toBeUndefined();
  });

  it("declines a truncated v2 payload rather than half-reading it", () => {
    const dial = encodeStamp(
      withState((d) => {
        d.sends.kind = "dial";
        d.sends.dialRadius = true;
      }),
    );
    expect(decodeStamp(dial.slice(0, -1))).toBeUndefined();
    expect(decodeStamp(dial.slice(0, -2))).toBeUndefined();
  });

  it("carries the axes and dial fields at the edges of their domains", () => {
    const axes = decodeStamp(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.axes = "y";
          d.sends.ccBase = 126;
          d.sends.channel = 16;
        }),
      ),
    );
    expect(axes.sends.axes).toBe("y");
    // The clamp deliberately ignores axes: 126 survives, 127 would not.
    expect(axes.sends.ccBase).toBe(126);

    const dial = decodeStamp(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "dial";
          d.sends.ccBase = 127;
          d.sends.channel = 16;
          d.sends.dialMode = "absolute";
          d.sends.dialSense = 8;
        }),
      ),
    );
    expect(dial.sends.kind).toBe("dial");
    expect(dial.sends.ccBase).toBe(127);
    expect(dial.sends.channel).toBe(16);
    expect(dial.sends.dialMode).toBe("absolute");
    expect(dial.sends.dialSense).toBe(8);
    expect(dial.sends.dialRadius).toBe(false);
    // Normalise pinned these before the stamp, so the round trip is exact.
    expect(dial.sends.fingers).toBe("first");
    expect(dial.sends.hiRes).toBe(false);

    const radius = normalisePadState(
      withState((d) => {
        d.sends.kind = "dial";
        d.sends.ccBase = 127;
        d.sends.dialRadius = true;
      }),
    );
    // The radius stream lives at ccBase + 1, so the clamp drops to 126.
    expect(maxCcBase(radius)).toBe(126);
    expect(radius.sends.ccBase).toBe(126);
    const back = decodeStamp(encodeStamp(radius));
    expect(back.sends.dialRadius).toBe(true);
    expect(back.sends.ccBase).toBe(126);
  });

  // Frozen v3 fixtures: captured once from the codec at implementation
  // time and never regenerated, the same bargain as V1_FIXTURES above.
  const V3_FIXTURES = [
    [
      "default at Dim",
      "ct05u91pv8j004",
      () => withState((d) => (d.brightness = 1)),
    ],
    [
      "dial at Half",
      "ct05u91pv8j500g80c",
      () =>
        withState((d) => {
          d.sends.kind = "dial";
          d.brightness = 3;
        }),
    ],
    [
      "zones drawn at Bright",
      "c4080lg68ikfo10g",
      () =>
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "zones";
          d.sends.grid = "4x4";
          d.sends.showGrid = true;
          d.sends.gridColour = { r: 34, g: 170, b: 51 };
          d.sends.heldColour = { r: 255, g: 0, b: 17 };
          d.sends.baseNote = 48;
          d.brightness = 4;
        }),
    ],
  ];

  it("writes and reads the v3 stamps, bit for bit", () => {
    for (const [label, frozen, build] of V3_FIXTURES) {
      expect(encodeStamp(build()), label).toBe(frozen);
      const back = decodeStamp(frozen);
      expect(back, label).toBeDefined();
      expect(JSON.stringify(normalisePadState(back)), label).toBe(
        JSON.stringify(normalisePadState(build())),
      );
    }
  });

  it("writes format c only when brightness is not Full", () => {
    expect(encodeStamp(withState((d) => (d.brightness = 1)))[0]).toBe(
      STAMP_FORMAT_STATE_V3,
    );
    expect(encodeStamp(withState((d) => (d.brightness = 5)))[0]).toBe(
      STAMP_FORMAT_STATE,
    );
    // v2-needing states keep "b" at Full and move to "c" only when
    // dimmed, carrying the v2 fields inside "c".
    expect(
      encodeStamp(withState((d) => (d.sends.kind = "dial")))[0],
    ).toBe(STAMP_FORMAT_STATE_V2);
    const dialDim = withState((d) => {
      d.sends.kind = "dial";
      d.brightness = 2;
    });
    expect(encodeStamp(dialDim)[0]).toBe(STAMP_FORMAT_STATE_V3);
    const back = decodeStamp(encodeStamp(dialDim));
    expect(back.sends.kind).toBe("dial");
    expect(back.brightness).toBe(2);
    // xy-both under "c" carries the axes bits and round-trips them.
    const xyDim = withState((d) => {
      d.sends.kind = "xy";
      d.brightness = 4;
    });
    const xyBack = decodeStamp(encodeStamp(xyDim));
    expect(xyBack.sends.axes).toBe("both");
    expect(xyBack.brightness).toBe(4);
  });

  it("decodes every older format to Full brightness", () => {
    expect(decodeStamp("at05u91pv8j00").brightness).toBe(5);
    const dialB = encodeStamp(withState((d) => (d.sends.kind = "dial")));
    expect(dialB[0]).toBe(STAMP_FORMAT_STATE_V2);
    expect(decodeStamp(dialB).brightness).toBe(5);
    expect(decodeStamp("paurora").brightness).toBe(5);
  });

  it("declines a c payload grafted onto an older format character", () => {
    const dim = encodeStamp(withState((d) => (d.brightness = 1)));
    expect(dim[0]).toBe(STAMP_FORMAT_STATE_V3);
    // Re-labelled "a": the brightness tail becomes unread nonzero bits
    // and finished() declines the whole payload.
    expect(decodeStamp(STAMP_FORMAT_STATE + dim.slice(1))).toBeUndefined();
    // A "b" payload re-labelled "c" starves the brightness read: the
    // tail reads padding zeros, and 0 is outside the 1..4 domain.
    const dialB = encodeStamp(withState((d) => (d.sends.kind = "dial")));
    expect(
      decodeStamp(STAMP_FORMAT_STATE_V3 + dialB.slice(1)),
    ).toBeUndefined();
  });

  // Frozen v4 fixtures: captured once from the codec at implementation
  // time and never regenerated, the same bargain as the older fixtures.
  const V4_FIXTURES = [
    [
      "joystick tuned at Half",
      "dc4vc10h50q0c",
      () =>
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "glow";
          d.touch.colour = { r: 255, g: 187, b: 0 };
          d.sends.kind = "xy";
          d.sends.fingers = "first";
          d.sends.spring = true;
          d.sends.bend = "x";
          d.sends.springTo = "zero";
          d.sends.invertY = true;
          d.sends.ccBase = 20;
          d.brightness = 3;
        }),
    ],
    [
      "zones major latch drawn at Full",
      "d4080hg68ikfo1c0k",
      () =>
        withState((d) => {
          d.look.kind = "none";
          d.enabled.look = false;
          d.touch.kind = "none";
          d.enabled.touch = false;
          d.sends.kind = "zones";
          d.sends.showGrid = true;
          d.sends.gridColour = { r: 34, g: 170, b: 51 };
          d.sends.heldColour = { r: 255, g: 0, b: 17 };
          d.sends.baseNote = 48;
          d.sends.scale = "major";
          d.sends.toggle = true;
        }),
    ],
    [
      "xy sprung fine at Full",
      "dt05u91pv8j10544g0k",
      () =>
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.spring = true;
          d.sends.hiRes = true;
        }),
    ],
  ];

  it("writes and reads the v4 stamps, bit for bit", () => {
    for (const [label, frozen, build] of V4_FIXTURES) {
      expect(encodeStamp(build()), label).toBe(frozen);
      const back = decodeStamp(frozen);
      expect(back, label).toBeDefined();
      expect(JSON.stringify(normalisePadState(back)), label).toBe(
        JSON.stringify(normalisePadState(build())),
      );
    }
  });

  it("writes format d only when a joystick or scale field is in play", () => {
    expect(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.spring = true;
        }),
      )[0],
    ).toBe(STAMP_FORMAT_STATE_V4);
    expect(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.bend = "y";
        }),
      )[0],
    ).toBe(STAMP_FORMAT_STATE_V4);
    expect(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "zones";
          d.sends.scale = "minor";
        }),
      )[0],
    ).toBe(STAMP_FORMAT_STATE_V4);
    expect(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "zones";
          d.sends.toggle = true;
        }),
      )[0],
    ).toBe(STAMP_FORMAT_STATE_V4);
    // A 9x9 scale resolves to chromatic in normalise, so no "d" is
    // needed and yesterday's format keeps flowing.
    expect(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "zones";
          d.sends.grid = "9x9";
          d.sends.scale = "major";
          d.sends.fingers = "each";
        }),
      )[0],
    ).toBe(STAMP_FORMAT_STATE);
    // Unlike "c", the "d" tail is always present, so Full brightness
    // round-trips through it rather than being implied by the format.
    const back = decodeStamp(
      encodeStamp(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.spring = true;
        }),
      ),
    );
    expect(back.brightness).toBe(5);
    expect(back.sends.spring).toBe(true);
    expect(back.sends.springTo).toBe("centre");
  });

  it("decodes every older format to the new joystick and scale defaults", () => {
    const v1 = decodeStamp("at05u91pv8j00");
    expect(v1.sends.spring).toBe(false);
    expect(v1.sends.bend).toBe("none");
    expect(v1.sends.scale).toBe("chromatic");
    expect(v1.sends.toggle).toBe(false);
  });

  it("declines a d payload grafted onto an older format character", () => {
    const d4 = encodeStamp(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.spring = true;
      }),
    );
    expect(d4[0]).toBe(STAMP_FORMAT_STATE_V4);
    // Re-labelled older: the appended blocks and the tail become unread
    // bits, at least five of them, so finished() declines the payload.
    expect(decodeStamp(STAMP_FORMAT_STATE + d4.slice(1))).toBeUndefined();
    expect(decodeStamp(STAMP_FORMAT_STATE_V2 + d4.slice(1))).toBeUndefined();
    // A "b" payload re-labelled "d" starves the brightness tail into
    // padding zeros, and 0 is outside the 1..5 domain.
    const dialB = encodeStamp(withState((d) => (d.sends.kind = "dial")));
    expect(
      decodeStamp(STAMP_FORMAT_STATE_V4 + dialB.slice(1)),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The axes knob.

describe("the axes knob", () => {
  const xy = (axes) =>
    withState((d) => {
      d.sends.kind = "xy";
      d.sends.axes = axes;
    });

  it("emits only the chosen axis and never renumbers a stream", () => {
    const both = compile(xy("both")).setupLua;
    expect(both).toContain("176,16,");
    expect(both).toContain("176,17,");
    const xOnly = compile(xy("x")).setupLua;
    expect(xOnly).toContain("176,16,");
    expect(xOnly).not.toContain("176,17,");
    // Up-down keeps ccBase + 1 even when it is the only stream, so a
    // mapping made in "both" survives the switch.
    const yOnly = compile(xy("y")).setupLua;
    expect(yOnly).toContain("176,17,");
    expect(yOnly).not.toContain("176,16,");
  });

  it("keeps the hiRes pair on the surviving axis", () => {
    const s = xy("y");
    s.sends.hiRes = true;
    const lua = compile(s).setupLua;
    expect(lua).toContain("176,17,");
    expect(lua).not.toContain("176,16,");
    // The axis unlock stays unconditional: both raw axes still feed the
    // LED paint and the cell expression.
    expect(lua).toContain("self:txma(1023)self:tyma(1023)");
  });

  it("refunds real budget when one axis is off", () => {
    const both = cost(compile(xy("both"))).setup.used;
    const one = cost(compile(xy("x"))).setup.used;
    expect(one).toBeLessThan(both);
  });

  it("keeps the ccBase clamp exactly as both-axes", () => {
    for (const axes of ["both", "x", "y"]) {
      const s = normalisePadState(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.axes = axes;
          d.sends.ccBase = 127;
        }),
      );
      expect(s.sends.ccBase, axes).toBe(126);
      expect(maxCcBase(s), axes).toBe(126);
    }
  });
});

// ---------------------------------------------------------------------------
// Streams and solo: the Map section's single source, and the audition-only
// variant that can never be stored as the user's configuration.

describe("streams and solo", () => {
  const dialState = (mut) =>
    withState((d) => {
      d.sends.kind = "dial";
    }, mut ?? (() => {}));

  it("lists every stream in plain words with the real numbers", () => {
    const xy = streamsOf(withState((d) => (d.sends.kind = "xy")));
    expect(xy).toEqual([
      {
        id: "xy.x",
        label: "Left and right",
        message: "CC 16 on channel 1",
        soloable: true,
      },
      {
        id: "xy.y",
        label: "Up and down",
        message: "CC 17 on channel 1",
        soloable: true,
      },
    ]);

    const hi = streamsOf(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.hiRes = true;
      }),
    );
    expect(hi[0].message).toBe(
      "CC 16, with its fine pair CC 48, on channel 1",
    );
    expect(hi[1].message).toBe(
      "CC 17, with its fine pair CC 49, on channel 1",
    );

    const faders = streamsOf(presetById("faders").state);
    expect(faders.map((s) => s.id)).toEqual([
      "fader.0",
      "fader.1",
      "fader.2",
      "fader.3",
    ]);
    expect(faders.map((s) => s.label)).toEqual([
      "Fader 1",
      "Fader 2",
      "Fader 3",
      "Fader 4",
    ]);
    expect(faders.map((s) => s.message)).toEqual([
      "CC 16 on channel 1",
      "CC 17 on channel 1",
      "CC 18 on channel 1",
      "CC 19 on channel 1",
    ]);
    expect(faders.every((s) => s.soloable)).toBe(true);

    const dial = streamsOf(dialState((d) => (d.sends.dialRadius = true)));
    expect(dial.map((s) => s.id)).toEqual(["dial.turn", "dial.radius"]);
    expect(dial[0].label).toBe("Turn");
    expect(dial[0].message).toBe("CC 16 on channel 1, sent as turn amounts");
    expect(dial[1].label).toBe("Distance from centre");
    expect(dial[1].message).toBe("CC 17 on channel 1");
    expect(dial.every((s) => s.soloable)).toBe(true);
  });

  it("lists unsoloable streams with a why instead of hiding them", () => {
    const zones = streamsOf(presetById("ninepads").state);
    expect(zones).toHaveLength(1);
    expect(zones[0].id).toBe("zones");
    expect(zones[0].label).toBe("Pads");
    expect(zones[0].message).toBe("Notes 36 to 44 on channel 1");
    expect(zones[0].soloable).toBe(false);
    expect(zones[0].why).toBeDefined();

    const single = streamsOf(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.axes = "y";
      }),
    );
    expect(single).toHaveLength(1);
    expect(single[0].id).toBe("xy.y");
    expect(single[0].soloable).toBe(false);
    expect(single[0].why).toBeDefined();

    const lone = streamsOf(dialState());
    expect(lone).toHaveLength(1);
    expect(lone[0].soloable).toBe(false);
    expect(lone[0].why).toBeDefined();
  });

  it("yields nothing for trackpad, none and suppressed sends", () => {
    expect(streamsOf(presetById("tpad").state)).toEqual([]);
    expect(streamsOf(defaultState())).toEqual([]);
    // The user's code owns the touch handler, so the plan drops sends and
    // the grounded state has no streams: no Map section renders.
    const owned = withState((d) => {
      d.sends.kind = "xy";
      d.owned = { touchHandler: "user" };
    });
    expect(streamsOf(owned)).toEqual([]);
    const disabled = withState((d) => {
      d.sends.kind = "xy";
      d.enabled.sends = false;
    });
    expect(streamsOf(disabled)).toEqual([]);
  });

  it("solo compiles a variant under the real card's stamp", () => {
    const base = withState((d) => (d.sends.kind = "xy"));
    const solo = soloPadState(base, "xy.y");
    const builtBase = compile(base);
    const builtSolo = compile(solo);
    expect(builtSolo.stamp).toBe(builtBase.stamp);
    expect(builtSolo.setupLua).toContain("176,17,");
    expect(builtSolo.setupLua).not.toContain("176,16,");

    const hiBase = withState((d) => {
      d.sends.kind = "xy";
      d.sends.hiRes = true;
    });
    const hiSolo = compile(soloPadState(hiBase, "xy.y")).setupLua;
    expect(hiSolo).toContain("176,17,");
    expect(hiSolo).not.toContain("176,16,");

    const dialBase = dialState((d) => (d.sends.dialRadius = true));
    const turnOnly = compile(soloPadState(dialBase, "dial.turn")).setupLua;
    expect(turnOnly).toContain("176,16,");
    expect(turnOnly).not.toContain("176,17,");
    const radiusOnly = compile(soloPadState(dialBase, "dial.radius")).setupLua;
    expect(radiusOnly).toContain("176,17,");
    expect(radiusOnly).not.toContain("176,16,");
    // The residual update survives a radius solo, so ending it bursts
    // nothing.
    expect(radiusOnly).toContain("if n~=0 then s.d=s.d-n*64 end");
  });

  it("keeps the LED picture live outside a fader solo's guard", () => {
    const solo = soloPadState(presetById("faders").state, "fader.2");
    const lua = compile(solo).setupLua;
    // The guard wraps the gms and ONLY the gms; the level-bar loop stays
    // outside it, so mapping keeps full visual feedback.
    expect(lua).toContain("if f==2 then s:gms(0,176,16+f,v,0)end");
    expect(lua).toContain("for n=0,80 do");
  });

  it("throws on an unsoloable stream and deletes a stale solo", () => {
    expect(() => soloPadState(presetById("ninepads").state, "zones")).toThrow();
    expect(() => soloPadState(dialState(), "dial.turn")).toThrow();
    expect(() => soloPadState(dialState(), "dial.radius")).toThrow();
    expect(() =>
      soloPadState(
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.axes = "x";
        }),
        "xy.x",
      ),
    ).toThrow();

    // A leftover solo from another kind is deleted, never honoured.
    const stale = presetById("ninepads").state;
    const carrying = clonePadState(stale);
    carrying.soloStream = "xy.x";
    expect(normalisePadState(carrying).soloStream).toBeUndefined();
    const radiusOff = dialState();
    radiusOff.soloStream = "dial.radius";
    expect(normalisePadState(radiusOff).soloStream).toBeUndefined();
    // A valid solo survives normalise: the emitter is its only consumer.
    const valid = soloPadState(
      withState((d) => (d.sends.kind = "xy")),
      "xy.x",
    );
    expect(normalisePadState(valid).soloStream).toBe("xy.x");
  });

  it("never reaches the ledger, the fit solver or the stamp", () => {
    const base = presetById("faders").state;
    const solo = soloPadState(base, "fader.1");
    expect(encodeStamp(solo)).toBe(encodeStamp(base));
    expect(JSON.stringify(ledger(solo))).toBe(JSON.stringify(ledger(base)));
    const fitSolo = fit(solo);
    const fitBase = fit(base);
    expect(fitSolo.setup.used).toBe(fitBase.setup.used);
    expect(fitSolo.timer.used).toBe(fitBase.timer.used);
  });

  it("readPad of a solo-written pair returns the base card", () => {
    const base = withState((d) => (d.sends.kind = "xy"));
    const built = compile(soloPadState(base, "xy.x"));
    const read = readPad({
      setup: built.setup.map((a) => ({
        short: a.short,
        name: a.name,
        script: a.script,
      })),
      timer: built.timer.map((a) => ({
        short: a.short,
        name: a.name,
        script: a.script,
      })),
    });
    expect(read.state).toBeDefined();
    expect(read.state.soloStream).toBeUndefined();
    expect(encodeStamp(read.state)).toBe(compile(base).stamp);
  });
});

// ---------------------------------------------------------------------------
// The dial's compiled shape, from the compiler's side. The sim-facing
// vectors live in pad-sim.test.js; these pin the state model.

describe("the dial state model", () => {
  it("forces one finger, standard resolution and a legal detent", () => {
    const s = normalisePadState(
      withState((d) => {
        d.sends.kind = "dial";
        d.sends.fingers = "each";
        d.sends.hiRes = true;
        d.sends.dialSense = 99;
      }),
    );
    expect(s.sends.fingers).toBe("first");
    expect(s.sends.hiRes).toBe(false);
    expect(s.sends.dialSense).toBe(8);
    expect(DIAL_SENSE_TABLE).toHaveLength(8);
  });

  it("resets the dial knobs when the kind moves away, like every kind", () => {
    const away = normalisePadState(
      withState((d) => {
        d.sends.kind = "zones";
        d.sends.dialMode = "absolute";
        d.sends.dialSense = 8;
        d.sends.dialRadius = true;
        d.sends.axes = "x";
      }),
    );
    expect(away.sends.dialMode).toBe("relative");
    expect(away.sends.dialSense).toBe(5);
    expect(away.sends.dialRadius).toBe(false);
    expect(away.sends.axes).toBe("both");
  });

  it("inits the accumulator, and the level only in absolute mode", () => {
    const rel = compile(withState((d) => (d.sends.kind = "dial"))).setupLua;
    expect(rel).toContain("self.d=0");
    expect(rel).not.toContain("self.v=64");
    const abs = compile(
      withState((d) => {
        d.sends.kind = "dial";
        d.sends.dialMode = "absolute";
      }),
    ).setupLua;
    expect(abs).toContain("self.d=0");
    expect(abs).toContain("self.v=64");
  });

  it("proposes dropping the radius stream on the fit ladder", () => {
    // Not reachable as an overflow today (every dial pairing fits), so
    // the rung is asserted directly: it applies to a radius dial and its
    // change lands where the label says.
    const s = withState((d) => {
      d.sends.kind = "dial";
      d.sends.dialRadius = true;
    });
    const plan = fit(s);
    expect(plan.fits).toBe(true);
    const withoutRadius = cost(compile(withState((d) => (d.sends.kind = "dial"))));
    const withRadius = cost(compile(s));
    expect(withRadius.setup.used).toBeGreaterThan(withoutRadius.setup.used);
  });
});

// ---------------------------------------------------------------------------
// The joystick: spring-back and the bend lane.

describe("the joystick", () => {
  const sprung = (...more) =>
    withState(
      (d) => {
        d.sends.kind = "xy";
        d.sends.fingers = "first";
        d.sends.spring = true;
      },
      ...more,
    );

  it("adds one conditional in the end path, with exact rest literals", () => {
    const lua = compile(sprung()).setupLua;
    expect(lua).toContain(
      "if e==3 or e>=5 then s:gms(0,176,16,64,0)s:gms(0,176,17,64,0)",
    );
  });

  it("falls to zero when asked, and a bend axis still centres", () => {
    const lua = compile(
      sprung((d) => {
        d.sends.springTo = "zero";
        d.sends.bend = "x";
      }),
    ).setupLua;
    expect(lua).toContain(
      "if e==3 or e>=5 then s:gms(0,224,0,64,0)s:gms(0,176,17,0,0)",
    );
  });

  it("rests at bit-exact 8192 in fine resolution", () => {
    const lua = compile(sprung((d) => (d.sends.hiRes = true))).setupLua;
    expect(lua).toContain("s:gms(0,176,16,8192,1)s:gms(0,176,17,8192,1)");
  });

  it("holds by default: no rest sends without the spring", () => {
    const lua = compile(withState((d) => (d.sends.kind = "xy"))).setupLua;
    expect(lua).not.toContain("e==3 or e>=5 then s:gms");
  });

  it("rides the bend lane on the MSB at standard resolution", () => {
    const lua = compile(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.bend = "x";
      }),
    ).setupLua;
    expect(lua).toContain("s:gms(0,224,0,x,0)");
    // The other axis keeps its CC and its NUMBER: a bend axis skips its
    // controller rather than renumbering the neighbour.
    expect(lua).toContain("s:gms(0,176,17,y,0)");
    expect(lua).not.toContain("s:gms(0,176,16");
  });

  it("splits the fine-resolution bend itself: gms has no pair mode for it", () => {
    const lua = compile(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.bend = "y";
        d.sends.hiRes = true;
      }),
    ).setupLua;
    expect(lua).toContain("local b=y*16383//1023");
    expect(lua).toContain("s:gms(0,224,b%128,b//128,0)");
    expect(lua).toContain("s:gms(0,176,16,x*16383//1023,1)");
  });

  it("parks the glow dot on the home cell, lit from power-on", () => {
    const lua = compile(
      sprung((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "glow";
      }),
    ).setupLua;
    expect(lua).toContain("self.l=40 glp(glag(0,40),1,255)");
    expect(lua).toContain("s.l=40 glp(glag(0,40),1,255)end");
  });

  it("fires one decaying comet pulse at home instead, on the comet", () => {
    // The default touch is the comet; the pulse borrows its decay pair.
    const lua = compile(sprung()).setupLua;
    expect(lua).toContain("local a=glag(0,40)glpfs(a,1,255,250,0)glt(a,1,42)");
  });

  it("moves the home cell where the rests really are", () => {
    // Zero-rest on both CC axes, y inverted: value zero sits at the left
    // column and the bottom row, so home is the bottom-left cell.
    const s = normalisePadState(
      sprung((d) => {
        d.sends.springTo = "zero";
        d.sends.invertY = true;
      }),
    );
    expect(springRestCell(s)).toBe(0 + 8 * 9);
  });

  it("springs silently when nothing can show it", () => {
    const lua = compile(
      sprung((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
      }),
    ).setupLua;
    expect(lua).toContain("s:gms(0,176,16,64,0)");
    expect(lua).not.toContain("glag");
  });

  it("keeps the pulse off the kinds whose picture cannot carry it", () => {
    const lua = compile(
      sprung((d) => {
        d.touch.kind = "perFinger";
      }),
    ).setupLua;
    expect(lua).not.toContain("glag(0,40)");
  });

  it("tells the DAW the truth about the bend lane", () => {
    const streams = streamsOf(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.bend = "x";
      }),
    );
    expect(streams[0].message).toBe("Pitch bend on channel 1");
    expect(streams[1].message).toBe("CC 17 on channel 1");
  });

  it("keeps a solo to exactly one stream, spring and bend included", () => {
    const s = sprung((d) => (d.sends.bend = "x"));
    const soloY = compile(soloPadState(s, "xy.y")).setupLua;
    expect(soloY).not.toContain("s:gms(0,224");
    expect(soloY).toContain("s:gms(0,176,17,64,0)");
    const soloX = compile(soloPadState(s, "xy.x")).setupLua;
    expect(soloX).toContain("s:gms(0,224,0,64,0)");
    expect(soloX).not.toContain("s:gms(0,176");
  });

  it("resets what the kind cannot read", () => {
    const zones = normalisePadState(
      withState((d) => {
        d.sends.kind = "zones";
        d.sends.spring = true;
        d.sends.bend = "x";
      }),
    );
    expect(zones.sends.spring).toBe(false);
    expect(zones.sends.bend).toBe("none");
    // springTo is read only while spring is on.
    const hold = normalisePadState(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.springTo = "zero";
      }),
    );
    expect(hold.sends.springTo).toBe("centre");
  });

  it("prices the spring as its own ledger row", () => {
    const rows = ledger(sprung());
    const row = rows.find((r) => r.id === "spring");
    expect(row).toBeDefined();
    expect(row.chars).toBeGreaterThan(0);
    expect(row.event).toBe("setup");
  });
});

// ---------------------------------------------------------------------------
// Scales and the latch on the note zones.

describe("scales and the latch", () => {
  const nine = (...more) =>
    withState(
      (d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
        d.sends.kind = "zones";
        d.sends.showGrid = true;
        d.sends.fingers = "each";
      },
      ...more,
    );

  it("bakes the major table with the base note inside", () => {
    const lua = compile(nine((d) => (d.sends.scale = "major"))).setupLua;
    expect(lua).toContain("self.m={36,38,40,41,43,45,47,48,50}");
    expect(lua).toContain("s:gms(0,144,s.m[z+1],100,0)");
    expect(lua).toContain("s:gms(0,128,s.m[o+1],0,0)");
  });

  it("bakes minor and pentatonic from their own degree tables", () => {
    expect(
      compile(nine((d) => (d.sends.scale = "minor"))).setupLua,
    ).toContain("self.m={36,38,39,41,43,44,46,48,50}");
    expect(
      compile(nine((d) => (d.sends.scale = "pentatonic"))).setupLua,
    ).toContain("self.m={36,38,40,43,45,48,50,52,55}");
  });

  it("walks two octaves on the 4x4 grid", () => {
    const s = normalisePadState(
      nine((d) => {
        d.sends.grid = "4x4";
        d.sends.scale = "major";
      }),
    );
    const notes = zoneNotes(s);
    expect(notes).toHaveLength(16);
    expect(notes[0]).toBe(36);
    expect(notes[7]).toBe(48);
    expect(notes[15]).toBe(38 + 24);
  });

  it("clamps the BASE, not the entries, so no two zones share a note", () => {
    // A per-entry 127 clamp would bake duplicate 127s, and then one
    // zone's note-off silences another zone that is still latched and
    // still lit. The base clamp makes the top zone land exactly on 127
    // and keeps the table strictly ascending.
    const s = normalisePadState(
      nine((d) => {
        d.sends.scale = "major";
        d.sends.baseNote = 120;
      }),
    );
    expect(s.sends.baseNote).toBe(113);
    const notes = zoneNotes(s);
    expect(notes[notes.length - 1]).toBe(127);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBeGreaterThan(notes[i - 1]);
    }
    expect(compile(s).setupLua).toContain(
      "self.m={113,115,117,118,120,122,124,125,127}",
    );
    // The chromatic card clamps the same way: sixteen pads from base 119
    // would walk to note 134, so the base pulls down to 112.
    const chrom = normalisePadState(
      nine((d) => {
        d.sends.grid = "4x4";
        d.sends.baseNote = 119;
      }),
    );
    expect(chrom.sends.baseNote).toBe(112);
  });

  it("keeps the 9x9 grid chromatic by construction", () => {
    const s = normalisePadState(
      nine((d) => {
        d.sends.grid = "9x9";
        d.sends.scale = "major";
      }),
    );
    expect(s.sends.scale).toBe("chromatic");
    expect(zoneNotes(s)).toBeUndefined();
  });

  it("keeps the watchdog on the scaled momentary card, table included", () => {
    const r = compile(nine((d) => (d.sends.scale = "major")));
    expect(r.timerPeriodMs).toBe(20);
    expect(r.timerLua).toContain("s:gms(0,128,s.m[s.n[i]+1],0,0)");
  });

  it("latches on press, fast DOWNUP taps included", () => {
    const lua = compile(nine((d) => (d.sends.toggle = true))).setupLua;
    expect(lua).toContain("self.g={}");
    expect(lua).toContain("if e==4 or e==9 then");
    expect(lua).toContain("local w=not s.g[z]s.g[z]=w");
    expect(lua).toContain(
      "if w then s:gms(0,144,36+z,100,0)else s:gms(0,128,36+z,0,0)end",
    );
  });

  it("keeps the latched picture lit and drops the watchdog", () => {
    const r = compile(nine((d) => (d.sends.toggle = true)));
    expect(r.setupLua).toContain("glp(glag(0,m),2,w and 255 or 0)");
    expect(r.timerPeriodMs).toBe(300000);
    expect(r.setupLua).not.toContain("self.p={}");
    expect(r.timerLua).not.toContain("s.p");
  });

  it("composes the latch with a scale", () => {
    const lua = compile(
      nine((d) => {
        d.sends.toggle = true;
        d.sends.scale = "pentatonic";
      }),
    ).setupLua;
    expect(lua).toContain("self.m={36,38,40,43,45,48,50,52,55}");
    expect(lua).toContain(
      "if w then s:gms(0,144,s.m[z+1],100,0)else s:gms(0,128,s.m[z+1],0,0)end",
    );
  });

  it("tells the Map section the real note range", () => {
    const streams = streamsOf(nine((d) => (d.sends.scale = "major")));
    expect(streams[0].message).toBe("Notes 36 to 50 on channel 1");
  });

  it("prices the scale and the latch as their own ledger rows", () => {
    const rows = ledger(
      nine((d) => {
        d.sends.scale = "major";
        d.sends.toggle = true;
      }),
    );
    const scale = rows.find((r) => r.id === "scale");
    expect(scale).toBeDefined();
    expect(scale.chars).toBeGreaterThan(0);
    // The latch row exists even though it can price NEGATIVE: dropping
    // the per-contact tracking and the watchdog can outweigh the latch
    // table, and a row that says "this saves bytes" is still the truth.
    expect(rows.find((r) => r.id === "latch")).toBeDefined();
  });

  it("leaves the chromatic momentary card byte-identical", () => {
    const lua = compile(nine()).setupLua;
    expect(lua).not.toContain("self.m=");
    expect(lua).toContain("36+z");
  });
});

// ---------------------------------------------------------------------------
// Format grafts: one corrupted character must never load a different card.

describe("format grafts and corrupted payloads", () => {
  const FORMATS = [
    STAMP_FORMAT_STATE,
    STAMP_FORMAT_STATE_V2,
    STAMP_FORMAT_STATE_V3,
    STAMP_FORMAT_STATE_V4,
  ];

  it("no one-character format graft can ever load a DIFFERENT card", () => {
    // The strongest statement the codec can make: relabel every stamp of
    // every reachable state to every other format character, and the
    // decode either declines or lands on the very same normalised state
    // (the identical-layout leniency the a-to-b pair has always had).
    // What it must never do is return a different card: that is how a
    // single corrupted character silently rewrites a configuration. The
    // extra states below carry the calib, owned and brightness variants
    // whose misaligned reads produced exactly that before the v4 blocks
    // grew their reserved bits.
    const extras = [
      [
        "xy sprung owned rot1 dim",
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.spring = true;
          d.owned = { timer: "user" };
          d.calib = { rot: 1, flipX: true, flipY: false };
          d.brightness = 3;
        }),
      ],
      [
        "latch rot1",
        withState((d) => {
          d.sends.kind = "zones";
          d.sends.toggle = true;
          d.calib = { rot: 1, flipX: false, flipY: true };
        }),
      ],
      [
        "latch rot3 owned",
        withState((d) => {
          d.sends.kind = "zones";
          d.sends.toggle = true;
          d.calib = { rot: 3, flipX: false, flipY: false };
          d.owned = { layer1: "user" };
        }),
      ],
      [
        "c with owned timer",
        withState((d) => {
          d.brightness = 3;
          d.owned = { timer: "user" };
        }),
      ],
      [
        "bend rot2 dim",
        withState((d) => {
          d.sends.kind = "xy";
          d.sends.bend = "x";
          d.calib = { rot: 2, flipX: false, flipY: false };
          d.brightness = 3;
        }),
      ],
    ];
    // KNOWN PRE-EXISTING LEAK, outside this guarantee: a "b" xy payload
    // with an axes lock relabelled "a" misaligns by only two bits and
    // can decode to a different card. That hole shipped with format "b"
    // itself and closing it means either a checksum format or declining
    // stamps real modules already carry, so it is a design decision, not
    // a test fix. This sweep pins the property the NEW format must hold:
    // no graft involving "d" ever loads a different card.
    const bad = [];
    const sweep = [
      ...allStates(),
      ...extras.map(([label, state]) => ({ label, state })),
    ];
    for (const { label, state } of sweep) {
      const stamp = encodeStamp(state);
      const truth = JSON.stringify(normalisePadState(decodeStamp(stamp)));
      for (const format of FORMATS) {
        if (format === stamp[0]) continue;
        if (format !== STAMP_FORMAT_STATE_V4 && stamp[0] !== STAMP_FORMAT_STATE_V4) {
          continue;
        }
        const grafted = decodeStamp(format + stamp.slice(1));
        if (typeof grafted === "undefined") continue;
        if (JSON.stringify(normalisePadState(grafted)) !== truth) {
          bad.push(`${label}: ${stamp[0]}->${format} loads a different card`);
        }
      }
    }
    expect(bad, bad.slice(0, 6).join("; ")).toHaveLength(0);
  });

  it("declines a d payload that needs no v4 field, as corruption", () => {
    // "d" exists only because a joystick or scale field is in play, the
    // same way "c" exists only because brightness is not Full. A dial
    // payload relabelled "d" reads cleanly right up to this rule.
    const dialB = encodeStamp(withState((d) => (d.sends.kind = "dial")));
    expect(dialB[0]).toBe(STAMP_FORMAT_STATE_V2);
    expect(
      decodeStamp(STAMP_FORMAT_STATE_V4 + dialB.slice(1)),
    ).toBeUndefined();
  });

  it("declines a payload whose bend bits read 11", () => {
    // Locate the bend field structurally: the only bit that differs
    // between bend none (00) and bend y (10) is the field's high bit, so
    // the XOR of the two payloads marks it and no position is hardcoded
    // against future layout drift.
    const bits = (payload) => {
      const out = [];
      for (const ch of payload) {
        const v = STAMP_ALPHABET.indexOf(ch);
        for (let i = 4; i >= 0; i--) out.push((v >> i) & 1);
      }
      return out;
    };
    const chars = (b) => {
      let out = "";
      for (let i = 0; i < b.length; i += 5) {
        let v = 0;
        for (let j = 0; j < 5; j++) v = (v << 1) | (b[i + j] ?? 0);
        out += STAMP_ALPHABET[v];
      }
      return out;
    };
    const none = encodeStamp(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.spring = true;
      }),
    );
    const bendY = encodeStamp(
      withState((d) => {
        d.sends.kind = "xy";
        d.sends.spring = true;
        d.sends.bend = "y";
      }),
    );
    expect(none[0]).toBe(STAMP_FORMAT_STATE_V4);
    expect(bendY.length).toBe(none.length);
    const a = bits(none.slice(1));
    const b = bits(bendY.slice(1));
    const diff = [];
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff.push(i);
    expect(diff).toHaveLength(1);
    const corrupted = [...b];
    corrupted[diff[0]] = 1;
    corrupted[diff[0] + 1] = 1;
    expect(
      decodeStamp(STAMP_FORMAT_STATE_V4 + chars(corrupted)),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Fast taps and the first-finger claim.

describe("fast taps and the first-finger claim", () => {
  it("claims on the DOWNUP tap, and the park sits outside the gate", () => {
    const lua = compile(
      withState((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "glow";
        d.sends.kind = "xy";
        d.sends.fingers = "first";
        d.sends.spring = true;
      }),
    ).setupLua;
    expect(lua).toContain("if(e==4 or e==9)and not s.f then s.f=i end");
    // The park block sits AFTER the gate's closing end: any contact's
    // lift restores the home cell the unwrapped glow paint douses, fast
    // taps and two-finger survivors included. The MIDI rests stay inside.
    expect(lua).toContain(
      "if e==3 or e>=5 then s.f=nil end end if e==3 or e>=5 then s.l=40 glp(glag(0,40),1,255)end",
    );
  });

  it("lets a first-finger latch card take fast taps", () => {
    const lua = compile(
      withState((d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
        d.sends.kind = "zones";
        d.sends.toggle = true;
        d.sends.fingers = "first";
      }),
    ).setupLua;
    expect(lua).toContain("if(e==4 or e==9)and not s.f then s.f=i end");
    expect(lua).toContain("if e==4 or e==9 then");
  });
});

// ---------------------------------------------------------------------------
// The sixteen dots: the 4x4 picture.

describe("the sixteen dots", () => {
  const four = (...more) =>
    withState(
      (d) => {
        d.look.kind = "none";
        d.enabled.look = false;
        d.touch.kind = "none";
        d.enabled.touch = false;
        d.sends.kind = "zones";
        d.sends.grid = "4x4";
        d.sends.showGrid = true;
        d.sends.fingers = "each";
      },
      ...more,
    );

  it("draws sixteen dots at the odd intersections, gutters dark", () => {
    const lua = compile(four()).setupLua;
    expect(lua).toContain(
      "if n%9%2==1 and n//9%2==1 then glp(a,1,255)else glp(a,1,0)end",
    );
    expect(lua).not.toContain("(zx+zy)%2");
  });

  it("repaints one LED per pad change instead of sweeping all 81", () => {
    const lua = compile(four()).setupLua;
    expect(lua).toContain("if o then glp(glag(0,o%4*2+o//4*18+10),2,0)end");
    expect(lua).toContain("if z then glp(glag(0,z%4*2+z//4*18+10),2,255)end");
    expect(lua).not.toContain("for m=0,80");
  });

  it("keeps the latch dot lit through the same single write", () => {
    const lua = compile(four((d) => (d.sends.toggle = true))).setupLua;
    expect(lua).toContain("glp(glag(0,z%4*2+z//4*18+10),2,w and 255 or 0)");
  });

  it("inverts the order mapping into the dot address", () => {
    expect(
      compile(four((d) => (d.sends.order = "columns"))).setupLua,
    ).toContain("z//4*2+z%4*18+10");
    expect(compile(four((d) => (d.sends.order = "snake"))).setupLua).toContain(
      "(z//4%2==1 and 3-z%4 or z%4)*2+z//4*18+10",
    );
  });

  it("leaves the 3x3 checkerboard exactly as it was", () => {
    const lua = compile(four((d) => (d.sends.grid = "3x3"))).setupLua;
    expect(lua).toContain("(zx+zy)%2==0");
    expect(lua).toContain("for m=0,80");
  });
});
