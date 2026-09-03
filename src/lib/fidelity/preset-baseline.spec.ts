import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  compile,
  cost,
  measure,
  padCompilerReady,
  presetById,
  PRESETS,
} from "../../vendor/botor/_pad";
import { PROTOCOL_PIN } from "../protocol-pin";

// ROADMAP criterion 3, and the D-11b half of the bump gate.
//
// The fixture this compares against was NOT produced here. It was captured by
// running BOTOR's own compiler in BOTOR's own tree at the pinned commit, by
// scripts/capture-preset-baseline.mjs. That is what makes this spec evidence
// rather than a tautology: if the vendored compiler and the fixture agree on
// all nine presets character for character, the port introduced nothing.
//
// This spec itself reads nothing outside the repository. The fixture is
// committed, so the gate is green on a machine that has never checked out the
// sibling repository - src/lib/format-parity.spec.ts stays the one deliberate
// sibling-dependent canary.
//
// A mismatch here is a STOP-and-report, never a fixture edit (D-08): the
// fixture is the original's behaviour, and the copy is what is on trial.

interface PresetBaseline {
  stamp: string;
  timerPeriodMs: number;
  setupLua: string;
  timerLua: string;
  setupRawLength: number;
  timerRawLength: number;
  setupCompressedLength: number;
  timerCompressedLength: number;
  costSetupUsed: number;
  costTimerUsed: number;
  declaredCost: { setup: number; timer: number };
}

interface Fixture {
  capturedAt: string;
  source: {
    repository: string;
    branch: string;
    commit: string;
    compiler: string;
    protocolPin: string;
  };
  note: string;
  presets: Record<string, PresetBaseline>;
}

const fixture = JSON.parse(
  readFileSync(new URL("./preset-baseline.json", import.meta.url), "utf8"),
) as Fixture;

// D-01. A literal, not read from the fixture under test.
const PINNED_BOTOR_SHA = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";

// presetById returns PadPreset | undefined and expect(...).toBeDefined() does
// not narrow it for the type checker, so every lookup goes through here.
function mustPreset(id: string) {
  const preset = presetById(id);
  if (!preset) throw new Error(`presetById("${id}") returned undefined`);
  return preset;
}

describe("nine shelf presets against BOTOR's own compiler (criterion 3)", () => {
  const ids = Object.keys(fixture.presets);

  beforeAll(async () => {
    // measure() and cost() THROW until the WASM formatter has resolved. That
    // throw is the FOUND-05 gate working as designed, not a test bug - they
    // never return a wrong number.
    await padCompilerReady();
  });

  it.each(ids)(
    "%s compiles to character-identical Setup and Timer Lua",
    (id) => {
      const built = compile(mustPreset(id).state);
      const f = fixture.presets[id];
      // Character-identical, not "equivalent". A single character of drift in
      // the emitted Lua is a compiler difference between HANGAR's copy and
      // BOTOR's original, which is the exact thing this phase exists to rule out.
      expect(built.setupLua, `${id} setup Lua`).toBe(f.setupLua);
      expect(built.timerLua, `${id} timer Lua`).toBe(f.timerLua);
      expect(built.stamp, `${id} stamp`).toBe(f.stamp);
      expect(built.timerPeriodMs, `${id} timer period`).toBe(f.timerPeriodMs);
    },
  );

  it.each(ids)(
    "%s raw and compressed lengths equal the recorded baseline",
    (id) => {
      const f = fixture.presets[id];
      const built = compile(mustPreset(id).state);
      const c = cost(built);
      expect(built.setupLua.length, `${id} setup raw`).toBe(f.setupRawLength);
      expect(built.timerLua.length, `${id} timer raw`).toBe(f.timerRawLength);
      // measure() is GridScript.compressScript(lua).length. cost().used is
      // max(compressed, raw) + reserved and raw wins for all nine presets today,
      // so the compressed pair is the only number that can see minifier drift.
      expect(measure(built.setupLua), `${id} setup compressed`).toBe(
        f.setupCompressedLength,
      );
      expect(measure(built.timerLua), `${id} timer compressed`).toBe(
        f.timerCompressedLength,
      );
      expect(c.setup.used, `${id} setup cost`).toBe(f.costSetupUsed);
      expect(c.timer.used, `${id} timer cost`).toBe(f.costTimerUsed);
    },
  );

  it("the fixture covers exactly the vendored catalog at the pinned protocol version", () => {
    expect([...PRESETS].map((p) => p.id).sort()).toEqual(ids.slice().sort());
    expect(ids).toHaveLength(9);
    expect(fixture.source.protocolPin).toBe(PROTOCOL_PIN);
    expect(fixture.source.commit).toBe(PINNED_BOTOR_SHA);
  });
});
