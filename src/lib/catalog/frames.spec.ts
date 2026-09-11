import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createEngine } from "../sim/engine";
import { stateDiverges } from "./divergence";
import { CATALOG, type CatalogEntry } from "./index";

// Every catalog entry carries a recorded frame set at the five Phase 3 ticks.
// An entry added in a later wave without one turns test 1 red instead of being
// silently skipped, which is the whole reason the fixture is keyed by catalog
// entry id rather than by preset id.
//
// This is the same kind of tripwire as src/lib/fidelity/golden-frames.spec.ts
// and it is deliberately NOT an oracle: the hashes come from the simulator
// itself. What it adds over the Phase 3 fixture is test 4, which cross-checks
// the ported entries against that fixture and so proves a catalog entry's
// presetId really resolves to the state Phase 3 pinned rather than to a
// lookalike.
//
// Regeneration:
//   UPDATE_FRAMES=1 npx vitest run --project server src/lib/catalog/frames.spec.ts
// rewrites the fixture, runs prettier --write over it, and then FAILS by
// design, so a regeneration can never be mistaken for a passing run.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const FIXTURE_URL = new URL("./frames.json", import.meta.url);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);
const REPO_ROOT = fileURLToPath(new URL("../../../", FIXTURE_URL));
const FIXTURE_REL = "src/lib/catalog/frames.json";
const GOLDEN_URL = new URL("../fidelity/golden-frames.json", import.meta.url);

const TICKS: readonly number[] = [0, 37, 101, 500, 1009];

const NOTE =
  "One golden frame record per catalog entry per sampled tick. A regression " +
  "tripwire, not an oracle: the hashes come from the simulator itself, so " +
  "they prove only that something changed a named configuration's " +
  "appearance. Firmware fidelity is pinned by " +
  "src/lib/fidelity/firmware-oracle.spec.ts, and the ported entries are " +
  "cross-checked against src/lib/fidelity/golden-frames.json. nonZeroBytes " +
  "sits beside each hash so that an entry going black is a readable failure " +
  "rather than an opaque hash mismatch, and it is what proves or disproves " +
  "each entry's declared restsBlack.";

interface FrameRecord {
  tick: number;
  sha256: string;
  nonZeroBytes: number;
  animating: boolean;
}

interface FramesFixture {
  note: string;
  ticks: number[];
  entries: Record<string, FrameRecord[]>;
}

interface GoldenFixture {
  ticks: number[];
  presets: Record<string, FrameRecord[]>;
}

/**
 * The minimum surface a frame sampler needs. engineFor returns a full
 * SimEngine; everything downstream only ever asks for these three members.
 */
type FrameSource = {
  run(n: number): void;
  readonly frame: Uint8Array;
  readonly animating: boolean;
};

async function engineFor(entry: CatalogEntry): Promise<FrameSource> {
  // The seam plan 08-01 left behind. createEngine picks PadSim for a
  // preview "padsim" entry and the Lua route for a "lua" one, so this fixture
  // records a hand-authored entry through the engine the row actually plays it
  // with rather than through a second, parallel implementation of the choice.
  return await createEngine(entry);
}

// A FRESH engine per sample. run(n) is cumulative, so a shared instance would
// make the fixture order-dependent.
async function sample(entry: CatalogEntry, tick: number): Promise<FrameRecord> {
  const engine = await engineFor(entry);
  engine.run(tick);
  const bytes = engine.frame;
  return {
    tick,
    sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
    nonZeroBytes: bytes.reduce((n, b) => n + (b !== 0 ? 1 : 0), 0),
    animating: engine.animating,
  };
}

async function regenerate(): Promise<void> {
  const entries: Record<string, FrameRecord[]> = {};
  for (const entry of CATALOG) {
    const records: FrameRecord[] = [];
    for (const tick of TICKS) records.push(await sample(entry, tick));
    entries[entry.id] = records;
  }
  const fixture: FramesFixture = { note: NOTE, ticks: [...TICKS], entries };
  writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, 2) + "\n", "utf8");
  // JSON.stringify puts the primitive `ticks` array on five lines and Prettier
  // collapses it onto one. src/lib/catalog/ is not in .prettierignore, so
  // without this normalising pass `npm run lint` fails on a file no human
  // wrote. The pass is idempotent, which is what keeps regeneration itself
  // idempotent - two consecutive regenerations are byte-identical.
  execSync(`npx prettier --write ${FIXTURE_REL}`, {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
}

if ((process.env.UPDATE_FRAMES ?? "") !== "") await regenerate();

const fixture = JSON.parse(readFileSync(FIXTURE_URL, "utf8")) as FramesFixture;
const golden = JSON.parse(readFileSync(GOLDEN_URL, "utf8")) as GoldenFixture;

describe("catalog golden frames", () => {
  it("covers every catalog entry, and only catalog entries", () => {
    expect(
      process.env.UPDATE_FRAMES ?? "",
      "UPDATE_FRAMES rewrote the fixture; this run proves nothing and fails " +
        "by design. Re-run without it to check the regenerated frames.",
    ).toBe("");

    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    const recorded = Object.keys(fixture.entries).slice().sort();
    expect(recorded, "every catalog entry has a frame record").toEqual(
      CATALOG.map((e) => e.id)
        .slice()
        .sort(),
    );
    expect(fixture.note, "the tripwire label").toContain("not an oracle");
  });

  it("gives every entry an engine", async () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      const engine = await engineFor(entry);
      expect(
        typeof engine.run,
        `${entry.id}: preview "${entry.preview}" has a frame source`,
      ).toBe("function");
    }
    expect(fixture.ticks, "the recorded ticks").toEqual([...TICKS]);
    for (const entry of CATALOG) {
      const records = fixture.entries[entry.id];
      expect(records, `${entry.id}: sample count`).toHaveLength(TICKS.length);
      expect(
        records.map((r) => r.tick),
        `${entry.id}: sampled ticks, in order`,
      ).toEqual([...TICKS]);
    }
  });

  it("still hashes to the recorded frames at every tick", async () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      for (const expected of fixture.entries[entry.id]) {
        const actual = await sample(entry, expected.tick);
        expect(
          actual.nonZeroBytes,
          `${entry.id} at tick ${expected.tick}: lit byte count moved from ` +
            `${expected.nonZeroBytes} to ${actual.nonZeroBytes}`,
        ).toBe(expected.nonZeroBytes);
        expect(
          actual.animating,
          `${entry.id} at tick ${expected.tick}: animating moved from ` +
            `${expected.animating} to ${actual.animating}`,
        ).toBe(expected.animating);
        expect(
          actual.sha256,
          `${entry.id} at tick ${expected.tick}: frame hash changed`,
        ).toBe(expected.sha256);
      }
    }
  });

  it("agrees with the Phase 3 tripwire on every ported entry", () => {
    // This is what proves a catalog entry's presetId resolves to the state
    // Phase 3 pinned in golden-frames.json, rather than to a lookalike.
    //
    // AND IT IS THE ONE CROSS-CHECK PLAN 11-05 PUT ON A COLLISION COURSE WITH
    // ITSELF. golden-frames.json's hashes were sampled from a PadSim over the
    // VENDORED states and golden-frames.spec.ts deliberately still reads
    // src/vendor/; this fixture is sampled over HANGAR's own nine, which
    // src/lib/catalog/presets.ts has owned since 11-05. While the two shelves
    // were byte-identical the cross-check was exact. The moment HANGAR changes
    // a preset's STATE on purpose - which is the whole point of 11-05 - the two
    // fixtures stop describing the same configuration, and an exact comparison
    // would report a catalog decision as a port regression. That is the same
    // wrong diagnosis 11-05's negative check 1b recorded against
    // preset-baseline.spec.ts, arrived at from the other side.
    //
    // THE ALLOWANCE IS NOT A SKIP LIST, and the difference is measurable here
    // rather than rhetorical: AURORA, PINWHEEL and STARFIELD all carry declared
    // `state.*` rows from this same plan, and all three still hash IDENTICALLY
    // to Phase 3, because an xy stream claims no LED layer. A gate that skipped
    // every card with a declared row would have stopped comparing thirty of the
    // forty-five samples to buy the one it needed. So the comparison is made
    // for all nine at all five ticks, and only a DISAGREEMENT consults
    // src/lib/catalog/divergence.ts. `compared` and `excused` are both counted,
    // so a record that grew to excuse everything cannot pass as a cross-check.
    const ported = CATALOG.filter((e) => e.source.kind === "preset");
    // Eight since plan 12-10: the `tpad` preset left the catalog when the
    // hand-authored TRACKPAD replaced it as the card. The golden fixture still
    // records nine, because golden-frames.spec.ts regenerates from the
    // VENDORED shelf; the ninth row is simply not cross-checked here.
    expect(ported.length, "there are ported entries to cross-check").toBe(8);
    expect(golden.ticks, "the two fixtures sample the same ticks").toEqual([
      ...TICKS,
    ]);
    let compared = 0;
    let excused = 0;
    for (const entry of ported) {
      if (entry.source.kind !== "preset") throw new Error("unreachable");
      const presetId = entry.source.presetId;
      const theirs = golden.presets[presetId];
      expect(
        theirs,
        `${entry.id}: golden-frames.json has no record for "${presetId}"`,
      ).toBeDefined();
      const ours = fixture.entries[entry.id];
      for (let i = 0; i < TICKS.length; i += 1) {
        compared += 1;
        const agrees =
          ours[i].sha256 === theirs[i].sha256 &&
          ours[i].nonZeroBytes === theirs[i].nonZeroBytes;
        if (agrees) continue;
        expect(
          stateDiverges(presetId),
          `${entry.id} at tick ${TICKS[i]}: disagrees with golden-frames.json ` +
            `(${ours[i].nonZeroBytes} lit bytes here against ` +
            `${theirs[i].nonZeroBytes} there), and HANGAR declares NO state ` +
            `divergence for "${presetId}". This is a real disagreement between ` +
            `the catalog and the Phase 3 tripwire, not a bench correction: ` +
            `either the presetId resolves to a lookalike, or a state change ` +
            `landed without a row in src/lib/catalog/divergence.ts.`,
        ).toBe(true);
        excused += 1;
      }
    }
    // Forty-five samples, and only the ones that actually moved are excused.
    expect(compared, "every ported entry was sampled at every tick").toBe(
      ported.length * TICKS.length,
    );
    expect(
      excused,
      "the samples HANGAR deliberately diverges on; if this ever reaches the " +
        "whole set the cross-check has stopped checking anything",
    ).toBeLessThan(compared);
  });

  it("proves every entry's declared restsBlack, in both directions", () => {
    // golden-frames.spec.ts handled darkness with a hard-coded tpad exemption,
    // which it could because it only ever had nine presets. A growing catalog
    // cannot carry a literal list. A configuration whose only light is a touch
    // response has nothing to show a sampler that never touches, and that is a
    // legitimate design - MORPH and GHOST arrive in later waves and are exactly
    // this. So the fact belongs on the entry, where a reviewer reads it, and
    // the fixture is what keeps it honest: a card that went black by accident
    // is red because it did not declare it, and a card that declared it and
    // then lit up is red too.
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      const allTicksBlack = fixture.entries[entry.id].every(
        (r) => r.nonZeroBytes === 0,
      );
      expect(
        allTicksBlack,
        `${entry.id}: declared restsBlack ${entry.restsBlack}, but the ` +
          `recorded frames say ${allTicksBlack}`,
      ).toBe(entry.restsBlack);
    }

    // And the fixture is not frozen. Without these two, a catalog in which
    // every entry declared darkness would satisfy the loop above trivially.
    const someEntryMoves = CATALOG.some((entry) => {
      const hashes = fixture.entries[entry.id].map((r) => r.sha256);
      return hashes.some((h) => h !== hashes[0]);
    });
    expect(
      someEntryMoves,
      "at least one entry's frame differs between two sampled ticks",
    ).toBe(true);
    expect(
      CATALOG.some((entry) => !entry.restsBlack),
      "at least one entry is lit at rest",
    ).toBe(true);
  });
});
