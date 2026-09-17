// THE WAVE 0 GATE (08-CONTEXT D-07, PREV-02).
//
// The nine ported presets are the one corpus where two independent producers
// exist. BOTOR's compiler emits Lua; the vendored PadSim re-implements in
// TypeScript what that Lua would do. Running the compiler's OWN emitted Setup
// through a real Lua 5.4 VM and getting back the same 243 layer records and the
// same rendered frames is a three-way agreement - compiler, transcription, and
// real Lua - and it is what makes PREV-02 ("the simulator consumes the exact
// compiler output; no hand-authored animation anywhere") literally true rather
// than true by coincidence.
//
// If this file is red, no configuration is authored against the Lua route. The
// documented fallback is route 1a - new PadState combinations, which the
// 4,860-state invariant sweep already maps - and the phase says so out loud
// rather than shipping a hand-drawn preview, which PREV-02 forbids outright.
//
// TWO HALVES, AND BOTH ARE NEEDED. Test 2 compares the Lua route against a live
// PadSim: two engines can drift together, and a mutual agreement would not
// notice. Test 3 compares the same hashes against the fixture Phase 3 recorded
// in src/lib/fidelity/golden-frames.json, which cannot drift at all. That is
// what makes this a pin rather than a handshake, and the second negative check
// in the plan exists to prove the two are really independent.
//
// compile() is called DIRECTLY, with no padReady() await. Phase 3 measured it:
// compile returns its setupLua and timerLua with the Lua formatter deliberately
// un-initialised - only cost/fits, which measure, need the WASM. This file
// measures nothing, so it needs no gate, and routing it through $lib/pad would
// add an await that proves nothing.
//
// Nothing here reads anything outside this repository. src/lib/format-parity.spec.ts
// is the one deliberate sibling-dependent canary in the tree and it is not this one.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CELLS,
  PRESETS,
  compile,
  type PadPreset,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import { CATALOG, type CatalogEntry } from "../catalog";
import { scaleLua, sitesFor } from "../catalog/brightness";
import { KX, KY } from "../catalog/calibration";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import { PRESETS as HANGAR_PRESETS } from "../catalog/presets";
import { createEngine, dimmed, type SimEngine } from "../sim/engine";
import { createLuaHost, type LuaHost } from "../sim/lua-host";
import { LuaPadSim, blankPadState, renderLua } from "../sim/lua-pad-sim";

/** Phase 3's sampled ticks, restated so this file reads on its own. */
const TICKS: readonly number[] = [0, 37, 101, 500, 1009];

/** Every field of one layer record. 81 cells x 3 layers x these = one preset. */
const LAYER_FIELDS = [
  "min",
  "mid",
  "max",
  "pha",
  "fre",
  "sha",
  "timeout",
] as const;

/** 9 presets x 81 cells x 3 layers. Asserted as a literal so a loop that */
/** silently compared nothing cannot pass. */
const EXPECTED_RECORDS = 2187;

/** The SimEngine surface, as a runtime list. A TypeScript interface does not */
/** exist at runtime, and Phase 4 types its card field against this shape. */
const ENGINE_MEMBERS = {
  tick: "function",
  run: "function",
  reset: "function",
  frame: "object",
  animating: "boolean",
  coordMax: "number",
  pendingTouches: "number",
  touchDown: "function",
  touchMove: "function",
  touchUp: "function",
  touchTap: "function",
} as const;

interface GoldenEntry {
  tick: number;
  sha256: string;
  nonZeroBytes: number;
  animating: boolean;
}

interface GoldenFixture {
  ticks: number[];
  presets: Record<string, GoldenEntry[]>;
}

// Phase 3's recorded tripwire, read from the repository and never regenerated
// here. golden-frames.spec.ts owns regeneration; this file only holds the Lua
// route against what is already committed.
const golden = JSON.parse(
  readFileSync(new URL("./golden-frames.json", import.meta.url), "utf8"),
) as GoldenFixture;

function sha(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

/**
 * The Lua route for one preset: the compiler's own emitted Setup (and Timer,
 * where the preset has one) running in a real VM over a blank, fully
 * "user"-owned PadSim. The sim is returned alongside the host because the host
 * deliberately does not expose it - the parity comparison needs layer() and
 * frame off the same object the VM has been writing into.
 *
 * An empty timerLua means the preset stores no Timer ACTION, which is not the
 * same as a Timer that does nothing: firmware's gtt is a no-op until the Timer
 * event holds at least one stored action, and LuaHost draws that distinction on
 * undefined versus "".
 */
async function luaRoute(
  preset: PadPreset,
  library?: { system: string; systemTimer: string },
): Promise<{ host: LuaHost; sim: PadSim }> {
  const built = compile(preset.state);
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    // The touch library in front of the compiled Setup (12.1-08b, test 6):
    // a HANGAR preset's state carries touchLibrary, so its emitted handler
    // calls N, K and G and needs the two strings the module holds. Tests 1
    // to 5 run the vendored shelf, which carries no such field, with none.
    ...(library ?? {}),
    setup: built.setupLua,
    timer: built.timerLua.trim() === "" ? undefined : built.timerLua,
  });
  return { host, sim };
}

type Sample = {
  tick: number;
  /** sha256 of the Lua route's 243-byte frame. */
  lua: string;
  /** sha256 of a live PadSim's, from the same preset state. */
  pad: string;
  /** True when the Lua route lit no byte at all at this tick. */
  luaDark: boolean;
};

// A FRESH PAIR OF ENGINES PER SAMPLE - run(n) is cumulative on both sides, so a
// shared instance would make every result order-dependent. The memo holds the
// RESULTS, never an engine: tests 2, 3 and 4 ask the same 45 questions, and
// building 135 VMs to answer 45 questions three times would triple the wall
// time of the phase's load-bearing gate for nothing.
const sampled = new Map<string, Sample[]>();

async function samplesFor(preset: PadPreset): Promise<Sample[]> {
  const memo = sampled.get(preset.id);
  if (memo !== undefined) return memo;
  const out: Sample[] = [];
  for (const tick of TICKS) {
    const expected = new PadSim(preset.state);
    expected.run(tick);
    const { host, sim } = await luaRoute(preset);
    host.run(tick);
    const frame = sim.frame;
    out.push({
      tick,
      lua: sha(frame),
      pad: sha(expected.frame),
      luaDark: frame.every((byte) => byte === 0),
    });
    host.close();
  }
  sampled.set(preset.id, out);
  return out;
}

/** A hand-authored entry, so the Lua branch of createEngine is really taken. */
const LUA_FIXTURE: CatalogEntry = {
  id: "parity-fixture",
  name: "PARITY FIXTURE",
  description: "A two-cell Lua entry that exists only inside this spec.",
  tags: ["fixture"],
  featured: false,
  addedAt: "2026-09-04",
  source: {
    kind: "lua",
    setup:
      "local a = glag(0, 0) glc(a, 1, @RED, 0, 0, 0) glp(a, 1, 255) " +
      "glt(a, 1, 60000) gtt(0, 20)",
    timer: "--[[@cb]]gtt(0, 20) self.n = (self.n or 0) + 1",
  },
  preview: "lua",
  knobs: [
    {
      id: "red",
      label: "Red",
      kind: "colour",
      token: "@RED",
      values: ["120", "240"],
      default: 0,
    },
  ],
  defaults: { red: 1 },
  restsBlack: false,
};

describe("the Lua route reproduces the vendored simulator (Wave 0 gate)", () => {
  it("reproduces all 2187 layer records for all nine presets", async () => {
    expect(PRESETS.length, "the vendored shelf is the nine presets").toBe(9);
    expect(LAYER_FIELDS, "one layer record is seven fields").toHaveLength(7);

    let compared = 0;
    for (const preset of PRESETS) {
      const expected = new PadSim(preset.state);
      const { host, sim } = await luaRoute(preset);
      expect(
        host.errors,
        `${preset.id}: the compiler's own Setup raised inside the VM`,
      ).toEqual([]);
      for (let hw = 0; hw < CELLS; hw++) {
        for (const layer of [0, 1, 2] as const) {
          const actualRecord = sim.layer(hw, layer);
          const expectedRecord = expected.layer(hw, layer);
          for (const field of LAYER_FIELDS) {
            expect(
              actualRecord[field],
              `${preset.id}: layer(${hw}, ${layer}).${field}`,
            ).toEqual(expectedRecord[field]);
          }
          compared += 1;
        }
      }
      host.close();
    }

    // A loop that silently compared nothing would otherwise pass green.
    expect(compared, "layer records compared (9 presets x 243)").toBe(
      EXPECTED_RECORDS,
    );
    expect(EXPECTED_RECORDS, "9 x 81 x 3").toBe(2187);
  });

  it("renders the same frames as a live PadSim at all five sampled ticks", async () => {
    expect(TICKS, "the Phase 3 tick set").toEqual([0, 37, 101, 500, 1009]);
    for (const preset of PRESETS) {
      for (const sample of await samplesFor(preset)) {
        expect(
          sample.lua,
          `${preset.id} at tick ${sample.tick}: the Lua route's frame hash ` +
            `differs from the vendored simulator's`,
        ).toBe(sample.pad);
      }
    }
  });

  it("renders the frames Phase 3 recorded in golden-frames.json", async () => {
    // The half that makes this a PIN rather than a mutual agreement. Two
    // engines can drift together; a recorded hash cannot drift at all.
    expect(golden.ticks, "the fixture's tick set").toEqual([...TICKS]);
    expect(
      Object.keys(golden.presets).length,
      "the fixture covers the nine presets",
    ).toBe(9);

    for (const preset of PRESETS) {
      const recorded = golden.presets[preset.id];
      expect(recorded, `${preset.id}: recorded in the fixture`).toHaveLength(
        TICKS.length,
      );
      const samples = await samplesFor(preset);
      for (const entry of recorded) {
        const sample = samples.find((s) => s.tick === entry.tick);
        expect(
          sample,
          `${preset.id}: sampled at tick ${entry.tick}`,
        ).toBeDefined();
        expect(
          sample?.lua,
          `${preset.id} at tick ${entry.tick}: the Lua route's frame hash ` +
            `differs from the hash Phase 3 recorded`,
        ).toBe(entry.sha256);
      }
    }
  });

  it("is not a vacuous comparison", async () => {
    // 1. The sim the Lua route wraps contributes NOTHING before Setup runs. If
    // it did, a parity pass could be the simulator quietly answering its own
    // question (08-02-SUMMARY, notes for this plan).
    const bare = new PadSim(blankPadState());
    expect(bare.animating, "a blank user-owned sim animates nothing").toBe(
      false,
    );
    expect(
      bare.frame.every((byte) => byte === 0),
      "a blank user-owned sim lights nothing",
    ).toBe(true);
    bare.run(200);
    expect(
      bare.frame.every((byte) => byte === 0),
      "and still lights nothing after 200 ticks with no Lua at all",
    ).toBe(true);

    // 2. At least one preset's picture actually MOVES between two sampled
    // ticks, so the hash equality above is comparing something.
    const moving: string[] = [];
    const dark: string[] = [];
    for (const preset of PRESETS) {
      const samples = await samplesFor(preset);
      const first = samples[0];
      const second = samples[1];
      if (first.lua !== second.lua) moving.push(preset.id);
      if (samples.every((sample) => sample.luaDark)) dark.push(preset.id);
    }
    expect(
      moving.length,
      "no preset's frame changed between tick 0 and tick 37 - the frame " +
        "comparison is comparing a still picture with itself",
    ).toBeGreaterThan(0);

    // 3. tpad writes no LEDs by design, so its frame is all zeros at every tick
    // and its agreement with the vendored simulator is VACUOUS.
    // golden-frames.spec.ts's own note records the same fact. It stays in the
    // nine - exempting it would be exempting a real configuration - but it is
    // named here so a green nine cannot hide it, and the assertion is that it is
    // the ONLY one, which is what would go red if the Lua route ever stopped
    // writing LEDs at all.
    expect(
      dark,
      "exactly one preset renders black at every sampled tick, and it is tpad",
    ).toEqual(["tpad"]);
  });

  it("draws a finger the same way on both engines for the eight HANGAR presets: the compiler's Lua beside the library against a live PadSim, 243 records after every sample", async () => {
    // PLAN 12.1-08b (12.1-CONTEXT D-26 item 2, D-27 "mirror"). HANGAR's nine
    // states carry touchLibrary, so the vendored compiler emits calls into
    // the touch library - K for the comets and PINWHEEL, G for JOYSTICK's
    // glow, N for NINE PADS' zones and FOUR FADERS' rails - and the vendored
    // simulator's touch handler was edited to mirror the same measured map.
    // Tests 1 to 5 never touch the pad, so they cannot see either edit. This
    // is the proof the mirror is right: the compiler's own Lua running in a
    // real VM beside the library's two strings, against a live PadSim of the
    // same state, the same samples driven into both, and all 243 layer
    // records plus the frame hash compared after EVERY sample - a finger
    // dead on each of the nine diagonal LED centres and the four corner
    // LEDs, a second contact, a move to the midpoint between LED 4 and 5, a
    // lift, a hardware fast tap on the bench case LED (7,1), and fifty ticks
    // of the decays walking. Without this the preview's truth is an
    // assertion.
    const eight = HANGAR_PRESETS.filter((p) => p.id !== "tpad");
    expect(
      eight.map((p) => p.id),
      "the eight carded presets",
    ).toEqual([
      "aurora",
      "pinwheel",
      "starfield",
      "radar",
      "joystick",
      "ninepads",
      "faders",
      "dial",
    ]);
    for (const preset of eight) {
      expect(
        preset.state.touchLibrary,
        `${preset.id}: the state does not carry the library's knots`,
      ).toEqual({ kx: [...KX], ky: [...KY] });
    }
    type Step = {
      label: string;
      drive: (engine: PadSim | LuaHost) => void;
    };
    const midX = Math.floor((KX[4] + KX[5]) / 2);
    const steps: Step[] = [];
    for (let c = 0; c < 9; c += 1) {
      steps.push({
        label: `down on LED (${c},${c})`,
        drive: (e) => e.touchDown(0, KX[c], KY[c]),
      });
    }
    for (const [c, r] of [
      [0, 8],
      [8, 0],
      [0, 0],
      [8, 8],
    ]) {
      steps.push({
        label: `down on the corner LED (${c},${r})`,
        drive: (e) => e.touchDown(0, KX[c], KY[r]),
      });
    }
    steps.push({
      label: "a second contact down on LED (2,6)",
      drive: (e) => e.touchDown(1, KX[2], KY[6]),
    });
    steps.push({
      label: "the first contact moves to the midpoint between LED 4 and 5",
      drive: (e) => e.touchMove(0, midX, KY[4]),
    });
    steps.push({
      label: "the second contact lifts",
      drive: (e) => e.touchUp(1, KX[2], KY[6]),
    });
    steps.push({
      label: "the first contact lifts",
      drive: (e) => e.touchUp(0, midX, KY[4]),
    });
    steps.push({
      label: "a fast tap on the bench case, LED (7,1)",
      drive: (e) => e.touchTap(0, KX[7], KY[1]),
    });
    steps.push({ label: "fifty ticks of decay", drive: (e) => e.run(49) });
    const SAMPLES = steps.length;
    expect(SAMPLES, "nineteen samples per preset").toBe(19);

    let compared = 0;
    let litSamples = 0;
    const rows: string[] = [];
    for (const preset of eight) {
      const expected = new PadSim(preset.state);
      const { host, sim } = await luaRoute(preset, {
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
      });
      try {
        expect(
          host.errors,
          `${preset.id}: the Setup raised beside the library`,
        ).toEqual([]);
        let lit = 0;
        for (const step of steps) {
          step.drive(expected);
          step.drive(host);
          expected.run(1);
          host.run(1);
          expect(
            host.errors,
            `${preset.id} after "${step.label}": the handler raised: ${host.errors.join(" | ")}`,
          ).toEqual([]);
          let litNow = 0;
          for (let hw = 0; hw < CELLS; hw++) {
            for (const layer of [0, 1, 2] as const) {
              const actualRecord = sim.layer(hw, layer);
              const expectedRecord = expected.layer(hw, layer);
              for (const field of LAYER_FIELDS) {
                expect(
                  actualRecord[field],
                  `${preset.id} after "${step.label}": layer(${hw}, ${layer}).${field} - the Lua beside the library and the simulator's mirror disagree`,
                ).toEqual(expectedRecord[field]);
              }
              if (layer === 1 && expectedRecord.pha !== 0) litNow += 1;
              compared += 1;
            }
          }
          expect(
            sha(sim.frame),
            `${preset.id} after "${step.label}": the frame hashes differ`,
          ).toBe(sha(expected.frame));
          if (litNow > 0) lit += 1;
        }
        // NON-VACUITY: a card whose touch writes layer 1 must have lit it
        // at some sample, or the loop compared a dark pad with itself.
        if (preset.state.touch.kind !== "none") {
          expect(
            lit,
            `${preset.id}: no sample lit layer 1, so the finger was never drawn`,
          ).toBeGreaterThan(0);
        }
        litSamples += lit;
        rows.push(
          `  ${preset.id.padEnd(10)} ${SAMPLES} samples, ${lit} with layer 1 lit, ${SAMPLES * CELLS * 3} records equal`,
        );
      } finally {
        host.close();
      }
    }
    expect(
      compared,
      "layer records compared (8 presets x 19 samples x 243)",
    ).toBe(8 * 19 * 243);
    expect(8 * 19 * 243, "the literal").toBe(36936);
    expect(litSamples, "some sample lit layer 1").toBeGreaterThan(0);

    // THE HI-RES CASE, ONCE, ON THE TEXT: a state that is both widened and
    // library-bearing hands the library the sensor's range. No HANGAR preset
    // is hi-res, so this is compile-only.
    const ninepads = eight.find((p) => p.id === "ninepads") as PadPreset;
    const wide = {
      ...ninepads.state,
      sends: { ...ninepads.state.sends, hiRes: true },
    };
    expect(compile(wide).setupLua, "hi-res zones read N(x//8,y//8)").toContain(
      "local n=N(x//8,y//8)",
    );
    expect(
      compile(ninepads.state).setupLua,
      "the shipped grid reads N(x,y)",
    ).toContain("local n=N(x,y)");
    const bare = { ...ninepads.state };
    delete (bare as { touchLibrary?: unknown }).touchLibrary;
    expect(
      compile(bare).setupLua,
      "without the field the naive zone map is back",
    ).toContain("local z=x*4//128+y*4//128*4");
    process.stdout.write(
      "\nTHE EIGHT PRESETS UNDER A FINGER, LUA BESIDE THE LIBRARY AGAINST THE MIRROR (plan 12.1-08b):\n" +
        rows.join("\n") +
        `\n  ${compared} layer records equal\n`,
    );
  }, 120000);

  it("dims a preset the same way on both sides at brightness 128: the compiler's Lua with its colours scaled at landing, run in the VM beside the library, against the dimmed PadSim the workspace previews - every frame byte within two units, the brightest about half - for the eight presets at rest and under a finger", async () => {
    // CHANGE 5 (2026-09-17): the wire scales the colour literals the compiler emits
    // (catalog/brightness.ts); the preview scales the rendered frame (engine.ts's
    // dimmed). The firmware's mix is linear in the colours, so the two agree to the
    // rounding - proved here on the real Lua, not asserted.
    const eight = HANGAR_PRESETS.filter((p) => p.id !== "tpad");
    let worst = 0;
    let bytes = 0;
    const rows: string[] = [];
    for (const preset of eight) {
      const built = compile(preset.state);
      const setup = scaleLua(built.setupLua, 128, sitesFor());
      const timer = scaleLua(built.timerLua, 128, sitesFor());
      expect(setup, `${preset.id}: 128 moved no byte of the Setup`).not.toBe(
        built.setupLua,
      );
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer: timer.trim() === "" ? undefined : timer,
      });
      const preview = dimmed(new PadSim(preset.state), 128);
      const full = new PadSim(preset.state);
      try {
        expect(host.errors, `${preset.id}: the scaled Setup raised`).toEqual(
          [],
        );
        const steps: {
          label: string;
          drive: (e: SimEngine | LuaHost) => void;
        }[] = [
          { label: "tick 37", drive: (e) => e.run(37) },
          { label: "tick 101", drive: (e) => e.run(64) },
          {
            label: "a finger on LED (4,4)",
            drive: (e) => e.touchDown(0, KX[4], KY[4]),
          },
          { label: "ten ticks held", drive: (e) => e.run(10) },
          {
            label: "the finger lifts",
            drive: (e) => e.touchUp(0, KX[4], KY[4]),
          },
          { label: "tick 500", drive: (e) => e.run(388) },
        ];
        let brightest = 0;
        let brightestFull = 0;
        for (const step of steps) {
          step.drive(host);
          step.drive(preview);
          step.drive(full);
          host.run(1);
          preview.run(1);
          full.run(1);
          expect(
            host.errors,
            `${preset.id} after "${step.label}": raised`,
          ).toEqual([]);
          const wire = sim.frame;
          const shown = preview.frame;
          for (let i = 0; i < CELLS * 3; i += 1) {
            const d = Math.abs(wire[i] - shown[i]);
            if (d > worst) worst = d;
            bytes += 1;
            expect(
              d,
              `${preset.id} after "${step.label}": byte ${i} wire ${wire[i]} preview ${shown[i]}`,
            ).toBeLessThanOrEqual(2);
            if (wire[i] > brightest) brightest = wire[i];
          }
          const f = Math.max(...full.frame);
          if (f > brightestFull) brightestFull = f;
        }
        expect(brightestFull, `${preset.id}: lit something`).toBeGreaterThan(
          100,
        );
        expect(
          Math.abs(brightest - Math.floor(brightestFull / 2)),
          `${preset.id}: the brightest byte on the wire at 128 is about half of 255's`,
        ).toBeLessThanOrEqual(3);
        rows.push(
          `  ${preset.id.padEnd(10)} brightest ${brightestFull} -> ${brightest}`,
        );
      } finally {
        host.close();
      }
    }
    expect(bytes).toBe(8 * 6 * CELLS * 3);
    process.stdout.write(
      "\nTHE EIGHT PRESETS AT BRIGHTNESS 128, WIRE AGAINST PREVIEW (change 5): worst byte difference " +
        String(worst) +
        " over " +
        String(bytes) +
        " bytes\n" +
        rows.join("\n") +
        "\n",
    );
  }, 120000);

  it("gives both engines one interchangeable SimEngine surface", async () => {
    const names = Object.keys(ENGINE_MEMBERS);
    expect(names, "the SimEngine surface is eleven members").toHaveLength(11);

    // A ported entry comes back as the vendored simulator itself.
    const ported = CATALOG.find((entry) => entry.preview === "padsim");
    expect(ported, "the catalog has a padsim entry").toBeDefined();
    const padsim: SimEngine = await createEngine(ported as CatalogEntry);
    expect(
      padsim,
      "createEngine returns a PadSim for a padsim entry",
    ).toBeInstanceOf(PadSim);

    // A hand-authored entry comes back as the Lua wrapper, through the dynamic
    // import that keeps the VM out of every other consumer's chunk.
    const lua = await createEngine(LUA_FIXTURE);
    expect(
      lua,
      "createEngine returns a LuaPadSim for a lua entry",
    ).toBeInstanceOf(LuaPadSim);

    for (const [name, kind] of Object.entries(ENGINE_MEMBERS)) {
      for (const [label, engine] of [
        ["PadSim", padsim],
        ["LuaPadSim", lua],
      ] as const) {
        expect(
          typeof (engine as unknown as Record<string, unknown>)[name],
          `${label}.${name} is a ${kind}`,
        ).toBe(kind);
      }
    }

    // The knob is literal token substitution (D-12), and entry.defaults wins
    // over the knob's own default - index 1, so "240" and never "120".
    const rendered = renderLua(LUA_FIXTURE);
    expect(rendered.setup, "the selected knob value is substituted").toContain(
      "240",
    );
    expect(rendered.setup, "the token itself is gone").not.toContain("@RED");

    // reset() is a SimEngine member, and on the Lua side it is a real firmware
    // page-load: the LED engine is zeroed, every global Setup created is
    // removed, self is rebuilt empty and Setup re-runs in the VM that is
    // already loaded. Same picture, same tick count, nothing raised.
    lua.run(50);
    const before = sha(lua.frame);
    lua.reset();
    lua.run(50);
    expect(sha(lua.frame), "reset() returns the Lua route to Setup").toBe(
      before,
    );
    expect(
      (lua as LuaPadSim).errors,
      "reset() re-ran Setup without raising",
    ).toEqual([]);
    (lua as LuaPadSim).close();
  });
});
