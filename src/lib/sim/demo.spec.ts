// The demonstration finger's two gates, both about the boundary: a path that opens a contact and
// never closes it leaves a finger down on that card forever (the firmware's own dropped-release bug,
// reproduced on purpose); and a driver that reached engine.touchDown directly would bypass the
// sampler and the rate contract, so the replay runs through a REAL TouchSampler and the rate is
// asserted on the delivered calls, not the authored ones.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { byId } from "../catalog";
import { KX, KY } from "../catalog/calibration";
import {
  cellToCoord,
  DARK_BY_CONSTRUCTION,
  DEMO_CELLS,
  DEMO_PATHS,
  demoPathFor,
  driveDemo,
  isDarkByConstruction,
} from "./demo";
import { TouchSampler } from "./touch";
import { stripComments } from "../../test-support/source";

const SOURCE_PATH = fileURLToPath(new URL("./demo.ts", import.meta.url));

type Delivered = { slot: number; event: string; x: number; y: number };

/** An engine-shaped recorder: what the sampler actually handed the firmware. */
function recorder() {
  const calls: Delivered[] = [];
  return {
    calls,
    touchDown: (slot: number, x: number, y: number) =>
      void calls.push({ slot, event: "down", x, y }),
    touchMove: (slot: number, x: number, y: number) =>
      void calls.push({ slot, event: "move", x, y }),
    touchUp: (slot: number, x: number, y: number) =>
      void calls.push({ slot, event: "up", x, y }),
  };
}

describe("the demonstration finger (src/lib/sim/demo.ts)", () => {
  it("closes every contact it opens, and reaches the firmware one sample per contact per tick", () => {
    const paths = Object.entries(DEMO_PATHS);
    expect(paths.length, "there are paths to walk").toBeGreaterThan(0);

    // The two lists answer the same question - what does a dark entry show -
    // and an id in both would mean the two answers disagree about one card.
    //
    // THE EXCEPTION LIST IS EMPTY SINCE PLAN 12-10, AND THE NON-VACUITY GUARD
    // MOVED WITH ITS MEMBER. It used to assert the list was non-empty, because
    // its one member - the tpad preset, the dark card no finger could help -
    // was the thing the loop below was written to check. That card left the
    // catalog when the hand-authored TRACKPAD replaced it (a real edge flash
    // and a path in DEMO_PATHS), and demo.ts says removing the entry is the
    // one way a row may leave. So what is asserted now is that the list is
    // empty FOR THAT REASON - tpad is in no catalog and has no path - and
    // that every card whose picture needs a finger has one: the paths are
    // three, and the loop below still runs over whatever the list holds the
    // day an entry that genuinely cannot be lit arrives.
    expect(
      DARK_BY_CONSTRUCTION.length,
      "the exception list is empty because its one member, the tpad preset, left the catalog at plan 12-10; a new member needs its measurement",
    ).toBe(0);
    expect(byId("tpad"), "tpad is not a catalog card").toBeUndefined();
    expect(demoPathFor("tpad"), "tpad has no path either").toBeUndefined();
    expect(
      Object.keys(DEMO_PATHS).sort(),
      "the three demonstration cards: ghost, morph and trackpad",
    ).toEqual(["ghost", "morph", "trackpad"]);
    for (const dark of DARK_BY_CONSTRUCTION) {
      expect(
        demoPathFor(dark.id),
        `${dark.id} is dark by construction AND declares a demo path`,
      ).toBeUndefined();
      expect(
        dark.why.length,
        `${dark.id} states why a finger cannot help it`,
      ).toBeGreaterThan(40);
      expect(isDarkByConstruction(dark.id), `${dark.id} looks itself up`).toBe(
        true,
      );
    }
    expect(
      isDarkByConstruction("no-such-configuration"),
      "an unknown id is not dark by construction",
    ).toBe(false);

    for (const [id, path] of paths) {
      expect(
        path.id,
        `${id}: the path names the entry it was keyed under`,
      ).toBe(id);
      expect(
        path.samples.length,
        `${id}: the path says something`,
      ).toBeGreaterThan(2);
      expect(
        path.gesture.trim().length,
        `${id}: the path says what the gesture is`,
      ).toBeGreaterThan(0);

      // AUTHORING RULES, asserted on the samples themselves.
      const seen = new Map<number, string>();
      const opened: number[] = [];
      const closed: number[] = [];
      const perTick = new Map<string, number>();
      let lastTick = -1;
      for (const sample of path.samples) {
        const where = `${id} tick ${sample.tick} pointer ${sample.pointer}`;
        expect(
          Number.isInteger(sample.tick) && sample.tick >= 0,
          `${where}: a tick is a whole number of 10 ms ticks`,
        ).toBe(true);
        expect(
          sample.tick,
          `${where}: a sample outside the period would never be queued`,
        ).toBeLessThan(path.periodTicks);
        expect(
          sample.tick,
          `${where}: samples are authored in tick order, so the file reads as the gesture`,
        ).toBeGreaterThanOrEqual(lastTick);
        lastTick = sample.tick;

        for (const [axis, value] of [
          ["x", sample.x],
          ["y", sample.y],
        ] as const) {
          expect(
            Number.isInteger(value) && value >= 0 && value < DEMO_CELLS,
            `${where}: ${axis} is ${value}, outside the pad's nine cells`,
          ).toBe(true);
        }

        // Two samples for one pointer on one tick would COALESCE inside the
        // sampler and one of them would be silently lost.
        const key = `${sample.tick}/${sample.pointer}`;
        perTick.set(key, (perTick.get(key) ?? 0) + 1);
        expect(
          perTick.get(key),
          `${where}: two samples for one contact on one tick; the sampler would keep only the newest`,
        ).toBe(1);

        const state = seen.get(sample.pointer);
        if (sample.event === "down") {
          expect(
            state,
            `${where}: this contact is already down`,
          ).toBeUndefined();
          opened.push(sample.pointer);
        } else {
          expect(
            state,
            `${where}: a ${sample.event} before the contact was opened`,
          ).toBe("open");
        }
        seen.set(sample.pointer, sample.event === "up" ? "closed" : "open");
        if (sample.event === "up") {
          closed.push(sample.pointer);
          seen.delete(sample.pointer);
        }
      }

      expect(opened.length, `${id}: the path opens a contact`).toBeGreaterThan(
        0,
      );
      expect(
        [...closed].sort(),
        `${id}: every contact the path opens is closed by it - a path that lifted nothing would stick a finger on this card forever`,
      ).toEqual([...opened].sort());
      expect(
        [...seen.keys()],
        `${id}: these contacts are still down when the path ends`,
      ).toEqual([]);

      // THE REPLAY. A real sampler, a real period, and the rate asserted on
      // what the firmware was handed rather than on what was authored.
      const sampler = new TouchSampler();
      const engine = recorder();
      let queued = 0;
      for (let tick = 0; tick < path.periodTicks; tick++) {
        queued += driveDemo(path, tick, sampler, 127);
        const before = engine.calls.length;
        sampler.deliver(engine);
        const thisTick = engine.calls.slice(before);
        const slots = thisTick.map((call) => call.slot);
        expect(
          new Set(slots).size,
          `${id} tick ${tick}: a contact received two samples in one tick`,
        ).toBe(slots.length);
      }
      expect(queued, `${id}: the whole path was queued over one period`).toBe(
        path.samples.length,
      );

      const downs = engine.calls.filter((call) => call.event === "down").length;
      const ups = engine.calls.filter((call) => call.event === "up").length;
      expect(downs, `${id}: every DOWN reached the firmware`).toBe(
        opened.length,
      );
      expect(
        ups,
        `${id}: every UP reached the firmware, inside one period`,
      ).toBe(downs);
      expect(
        engine.calls.every(
          (call) =>
            call.x >= 0 && call.x <= 127 && call.y >= 0 && call.y <= 127,
        ),
        `${id}: every delivered coordinate is inside the LED range`,
      ).toBe(true);
    }

    // The cell-to-coordinate conversion is the knot the sensor reports for a
    // fingertip on that cell, read off calibration.ts's tables and never
    // written as a literal, at both resolutions, on both axes and at both ends.
    for (let cell = 0; cell < DEMO_CELLS; cell++) {
      expect(cellToCoord(cell, 127, "x"), `cell ${cell} across`).toBe(KX[cell]);
      expect(cellToCoord(cell, 127, "y"), `cell ${cell} down`).toBe(KY[cell]);
    }
    expect(cellToCoord(0, 127, "x"), "cell 0 across is the first knot").toBe(
      KX[0],
    );
    expect(cellToCoord(8, 127, "y"), "cell 8 down is the last knot").toBe(
      KY[8],
    );
    expect(cellToCoord(0, 1023, "x"), "cell 0 at hiRes is the knot x8").toBe(
      KX[0] * 8,
    );
    expect(cellToCoord(8, 1023, "y"), "cell 8 at hiRes is the knot x8").toBe(
      KY[8] * 8,
    );
    expect(
      cellToCoord(5, 127, "x"),
      "the two axes read different tables where the tables differ",
    ).not.toBe(cellToCoord(5, 127, "y"));
  });

  it("imports nothing that reaches the compile surface", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");
    const stripped = stripComments(source);

    // Three guards against a vacuous pass: a walk that read the wrong file, a
    // scan that collected nothing, and a stripper that ate the whole source.
    expect(
      source.length,
      "the scan read a real module, not an empty file",
    ).toBeGreaterThan(2000);
    expect(
      stripped,
      "the one permitted import declaration was seen by the scan",
    ).toContain("import type");
    expect(
      stripped,
      "the sampler this file replays through is named in it",
    ).toContain("TouchSampler");

    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
    const erased = [
      ...stripped.matchAll(/import[ ]+type[^;]*?from[ ]+["']([^"']+)["']/g),
    ].map((match) => match[1]);

    expect(
      specifiers.length,
      "specifiers were actually collected",
    ).toBeGreaterThan(0);
    // An import that is not `import type` - or an `export ... from`, which is
    // not erased either - collects into `specifiers` and not into `erased`.
    // demo.ts is imported by CatalogCard.svelte, which renders on a page whose
    // whole job is to list names, so a runtime import here would put whatever
    // it names on that page's first paint.
    //
    // ONE runtime import is admitted since plan 12.1-05, by name: the
    // calibration tables, which cellToCoord reads so a demo finger lands on the
    // knot the sensor reports. It is admissible for exactly one reason, which
    // the third assertion below checks rather than trusts: calibration.ts
    // imports nothing (its header, section 4, states the rule for this file's
    // sake), so what reaches the first paint is two arrays and two functions
    // and never the compiler. A second runtime specifier, or a calibration.ts
    // that grows an import, is red here.
    const ADMITTED_RUNTIME = "../catalog/calibration";
    const runtime = specifiers.filter((s) => !erased.includes(s));
    expect(
      runtime,
      "the only runtime specifier in demo.ts is the calibration tables",
    ).toEqual([ADMITTED_RUNTIME]);
    expect(
      specifiers.filter((s) => s !== ADMITTED_RUNTIME),
      "every other specifier in demo.ts sits on an import type line",
    ).toEqual(erased);
    const calibrationSource = stripComments(
      readFileSync(
        fileURLToPath(new URL(ADMITTED_RUNTIME + ".ts", import.meta.url)),
        "utf8",
      ),
    );
    expect(
      calibrationSource.length,
      "the calibration module was read, not an empty file",
    ).toBeGreaterThan(1000);
    expect(
      [...calibrationSource.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
        (match) => match[1],
      ),
      "calibration.ts imports nothing, which is what makes it admissible here",
    ).toEqual([]);

    const forbidden = [
      "vendor",
      "intechstudio",
      "pad-sim",
      "wasmoon",
      "lua",
      "./engine",
      "$lib/catalog",
    ];
    for (const specifier of specifiers) {
      for (const bad of forbidden) {
        expect(
          specifier.includes(bad),
          `demo.ts imports ${specifier}, which drags the compiler in`,
        ).toBe(false);
      }
    }

    // A timer would take the demo off the firmware's clock and leave something
    // running after destroy(). The whole design is a pure function of a tick.
    for (const banned of [
      "setInterval",
      "setTimeout",
      "requestAnimationFrame",
    ]) {
      expect(stripped.includes(banned), `demo.ts calls ${banned}`).toBe(false);
    }
  });
});
