import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PadSim } from "../../vendor/botor/pad-sim";
// THE VENDORED SHELF, DELIBERATELY (plan 11-05). HANGAR declares its own nine
// in src/lib/catalog/presets.ts; this fixture's hashes were sampled from a
// PadSim built over the VENDORED states, so this is the port's tripwire and not
// the catalog's. Pointing it at HANGAR's nine would compare HANGAR against
// HANGAR. src/lib/catalog/frames.json is the catalog-side counterpart and
// carries a row per catalog entry.
import { PRESETS, presetById } from "../../vendor/botor/_pad";

// D-07. This is a regression tripwire, not an oracle. These hashes come from
// the simulator itself, so they prove only that a change to a shared helper
// altered a named preset's appearance. Firmware fidelity is pinned by
// firmware-oracle.spec.ts, which compares the simulator against constants
// re-derived from grid-fw by an author who never saw it.
//
// Ticks are [0, 37, 101, 500, 1009], not [0, 64, 128, 500]: measured, the
// frames at tick 0 and tick 128 hash identically for aurora, pinwheel, radar
// and dial, because the phase byte is 8-bit and those presets land on a
// 128-tick cycle. One of the four samples would have carried no information.
//
// nonZeroBytes sits beside each hash on purpose: it turns "the picture went
// black" into a readable failure instead of an opaque hash mismatch.
//
// Regeneration:
//   UPDATE_GOLDEN=1 npx vitest run --project server src/lib/fidelity/golden-frames.spec.ts
// rewrites the fixture, runs prettier --write over it, and then FAILS, so a
// regeneration can never be mistaken for a passing run and can never happen
// silently in a normal invocation.

const FIXTURE_URL = new URL("./golden-frames.json", import.meta.url);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);
const REPO_ROOT = fileURLToPath(new URL("../../../", FIXTURE_URL));
const FIXTURE_REL = "src/lib/fidelity/golden-frames.json";

const TICKS: readonly number[] = [0, 37, 101, 500, 1009];

const NOTE =
  "Regression tripwire, not an oracle. These hashes come from the simulator " +
  "itself, so they prove only that a change to a shared helper altered a " +
  "named preset's appearance. Firmware fidelity is pinned by " +
  "firmware-oracle.spec.ts. Four presets are static at every tick by design " +
  "- joystick, ninepads, faders and tpad - and tpad's frame is all zeros " +
  "because it writes no LEDs, so nonZeroBytes 0 is correct there and only " +
  "there.";

interface GoldenEntry {
  tick: number;
  sha256: string;
  nonZeroBytes: number;
  animating: boolean;
}

interface GoldenFixture {
  note: string;
  ticks: number[];
  presets: Record<string, GoldenEntry[]>;
}

// presetById returns PadPreset | undefined and expect(...).toBeDefined() does
// not narrow it for the type checker, so every lookup goes through here.
function mustPreset(id: string) {
  const preset = presetById(id);
  if (!preset) throw new Error(`presetById("${id}") returned undefined`);
  return preset;
}

// A FRESH PadSim per sample. run(n) is cumulative, so a shared instance would
// make the fixture order-dependent.
function sample(id: string, tick: number): GoldenEntry {
  const sim = new PadSim(mustPreset(id).state);
  sim.run(tick);
  const bytes = sim.frame;
  return {
    tick,
    sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
    nonZeroBytes: bytes.reduce((n, b) => n + (b !== 0 ? 1 : 0), 0),
    animating: sim.animating,
  };
}

function regenerate(): void {
  const presets: Record<string, GoldenEntry[]> = {};
  for (const preset of PRESETS) {
    presets[preset.id] = TICKS.map((tick) => sample(preset.id, tick));
  }
  const fixture: GoldenFixture = { note: NOTE, ticks: [...TICKS], presets };
  writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  // JSON.stringify puts the primitive `ticks` array on five lines and Prettier
  // collapses it onto one. src/lib/fidelity/ is not in .prettierignore, so
  // without this normalising pass `npm run lint` fails on a file no human
  // wrote. The pass is idempotent, which is what keeps regeneration itself
  // idempotent.
  execSync(`npx prettier --write ${FIXTURE_REL}`, {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
}

if ((process.env.UPDATE_GOLDEN ?? "") !== "") regenerate();

const fixture = JSON.parse(readFileSync(FIXTURE_URL, "utf8")) as GoldenFixture;

const ids = Object.keys(fixture.presets);

describe("golden frames (D-07 regression tripwire)", () => {
  it("refuses to run in regeneration mode", () => {
    expect(
      process.env.UPDATE_GOLDEN ?? "",
      "UPDATE_GOLDEN rewrote the fixture; this run proves nothing and fails " +
        "by design. Re-run without it to check the regenerated frames.",
    ).toBe("");
  });

  it("covers nine presets at five ticks and labels the static ones", () => {
    expect(ids.slice().sort(), "fixture covers the vendored catalog").toEqual(
      [...PRESETS].map((p) => p.id).sort(),
    );
    expect(ids, "preset count").toHaveLength(9);
    expect(fixture.ticks, "recorded ticks").toEqual([...TICKS]);
    expect(fixture.note, "the tripwire label").toContain("not an oracle");
    expect(fixture.note, "the all-zero tpad label").toContain("tpad");

    for (const id of ids) {
      const entries = fixture.presets[id];
      expect(entries, `${id} sample count`).toHaveLength(5);
      expect(
        entries.map((e) => e.tick),
        `${id} ticks`,
      ).toEqual([...TICKS]);
      for (const entry of entries) {
        expect(entry.sha256, `${id} tick ${entry.tick} hash`).toMatch(
          /^[0-9a-f]{64}$/,
        );
        expect(
          typeof entry.nonZeroBytes,
          `${id} tick ${entry.tick} nonZeroBytes`,
        ).toBe("number");
        expect(
          typeof entry.animating,
          `${id} tick ${entry.tick} animating`,
        ).toBe("boolean");
      }
    }

    // Measured, and recorded rather than assumed: these four are static at
    // every tick, and tpad writes no LEDs at all.
    for (const id of ["joystick", "ninepads", "faders", "tpad"]) {
      expect(
        fixture.presets[id].some((e) => e.animating),
        `${id} is recorded as a static preset`,
      ).toBe(false);
    }
  });

  it.each(ids)("%s frames are unchanged at every recorded tick", (id) => {
    for (const expected of fixture.presets[id]) {
      const actual = sample(id, expected.tick);
      expect(
        actual.nonZeroBytes,
        `${id} at tick ${expected.tick}: lit byte count moved from ` +
          `${expected.nonZeroBytes} to ${actual.nonZeroBytes}`,
      ).toBe(expected.nonZeroBytes);
      expect(
        actual.animating,
        `${id} at tick ${expected.tick}: animating moved from ` +
          `${expected.animating} to ${actual.animating}`,
      ).toBe(expected.animating);
      expect(
        actual.sha256,
        `${id} at tick ${expected.tick}: frame hash changed`,
      ).toBe(expected.sha256);
    }
  });
});
