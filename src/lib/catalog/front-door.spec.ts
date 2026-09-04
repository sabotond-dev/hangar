// The front-door row's agreement gate.
//
// front-door.ts restates each entry's `name` and `description` instead of
// reading them from $lib/catalog, because reading them would pull the vendored
// compiler and @intechstudio/grid-protocol (131,101 bytes, measured in
// 04-RESEARCH) into the front door's first chunk. This file is what keeps the
// two honest, exactly the way src/lib/protocol-pin.ts is held against the
// pinned package: the duplication is deliberate, and it is asserted.
//
// It also gates the one thing the product actually promises. PREV-01 says every
// visible pad is animating; four of the nine shelf presets do not animate and
// one writes no LEDs at all. So `motion` is never a declaration of intent - it
// is derived here from src/lib/fidelity/golden-frames.json and compared. A
// mis-declared pad is a red test rather than a dead-looking square on the front
// door.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { presetById } from "../../vendor/botor/_pad";
import {
  EXCLUDED_FROM_ROW,
  FRONT_DOOR,
  frontDoorIndex,
  type PreviewMotion,
} from "./front-door";
import { byId, CATALOG } from "./index";

const SOURCE_PATH = fileURLToPath(new URL("./front-door.ts", import.meta.url));
const GOLDEN_URL = new URL("../fidelity/golden-frames.json", import.meta.url);

interface GoldenRecord {
  tick: number;
  sha256: string;
  nonZeroBytes: number;
  animating: boolean;
}

interface GoldenFixture {
  note: string;
  ticks: number[];
  presets: Record<string, GoldenRecord[]>;
}

const GOLDEN: GoldenFixture = JSON.parse(readFileSync(GOLDEN_URL, "utf8"));

/**
 * The derivation table, implemented once. It is the whole reason `motion` is a
 * fact rather than an opinion:
 *
 *   any `animating` true                    -> "animated"
 *   otherwise, any `nonZeroBytes` above 0   -> "static"
 *   otherwise                               -> "dark"
 */
function deriveMotion(id: string): PreviewMotion {
  const records = GOLDEN.presets[id];
  if (!records || records.length === 0) {
    throw new Error(`golden-frames.json records no frames for: ${id}`);
  }
  if (records.some((record) => record.animating)) return "animated";
  if (records.some((record) => record.nonZeroBytes > 0)) return "static";
  return "dark";
}

/**
 * The opening window, computed with plain arithmetic rather than by importing
 * src/lib/coverflow/slots.ts, so this gate does not depend on the module the
 * sibling task writes. Signed ring offsets, left to right.
 */
function windowAt(centre: number, radius: number, count: number): number[] {
  const out: number[] = [];
  for (let offset = -radius; offset <= radius; offset += 1) {
    out.push((((centre + offset) % count) + count) % count);
  }
  return out;
}

// Deliberately backslash-free: inside a shell-quoted node -e a backslash is
// eaten and a pattern silently stops matching. The same expression is used by
// every structural scan in this phase.
const strip = (text: string): string =>
  text
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

describe("the front-door row (src/lib/catalog/front-door.ts)", () => {
  it("every row entry is the catalog's own entry, and an engine exists for it", () => {
    // Asserted first so the loops below cannot be vacuously green.
    expect(
      FRONT_DOOR.length,
      "the row holds at least the eight decided entries",
    ).toBeGreaterThanOrEqual(8);
    expect(
      new Set(FRONT_DOOR.map((entry) => entry.id)).size,
      "row ids are unique",
    ).toBe(FRONT_DOOR.length);

    FRONT_DOOR.forEach((row, index) => {
      const entry = byId(row.id);
      expect(entry, `${row.id} resolves in CATALOG`).toBeDefined();
      expect(entry?.name, `${row.id}: name matches the catalog`).toBe(row.name);
      expect(
        entry?.description,
        `${row.id}: description matches the catalog`,
      ).toBe(row.description);
      // "lua" entries have no simulator engine until plan 08-03 lands one, so
      // they stay out of the row rather than rendering as a hole.
      expect(entry?.preview, `${row.id}: an engine exists for it`).toBe(
        "padsim",
      );
      expect(
        frontDoorIndex(row.id),
        `${row.id}: frontDoorIndex agrees with its position`,
      ).toBe(index);
    });

    expect(
      frontDoorIndex("no-such-configuration"),
      "an unknown id is -1, never 0",
    ).toBe(-1);
  });

  it("the row and the exclusions partition the catalog", () => {
    const rowIds = FRONT_DOOR.map((entry) => entry.id);
    const excludedIds = EXCLUDED_FROM_ROW.map((entry) => entry.id);
    const catalogIds = CATALOG.map((entry) => entry.id);

    // The assertion is the PARTITION, never a count. Both sides grow: a phase
    // that appends to CATALOG registers its new id in one of them, and a
    // literal size here would go red for a reason that is not a regression.
    // The numbers appear only in the message, derived from the data.
    expect(
      [...rowIds, ...excludedIds].sort(),
      `${rowIds.length} in the row plus ${excludedIds.length} excluded must ` +
        `be exactly the ${catalogIds.length} in CATALOG`,
    ).toEqual([...catalogIds].sort());

    const overlap = rowIds.filter((id) => excludedIds.includes(id));
    expect(overlap, "no id is both in the row and excluded from it").toEqual(
      [],
    );

    expect(excludedIds, "tpad is on the exclusion list").toContain("tpad");

    for (const excluded of EXCLUDED_FROM_ROW) {
      expect(
        excluded.why.trim().length,
        `${excluded.id} states why it is out of the row`,
      ).toBeGreaterThan(0);
      expect(
        excluded.why,
        `${excluded.id}: the reason is one line`,
      ).not.toContain("\n");
    }
  });

  it("the declared motion is what the golden frames record", () => {
    expect(FRONT_DOOR.length, "there is something to check").toBeGreaterThan(0);
    for (const row of FRONT_DOOR) {
      expect(
        GOLDEN.presets[row.id],
        `${row.id}: golden-frames.json records it`,
      ).toBeDefined();
      expect(
        row.motion,
        `${row.id}: declared motion disagrees with golden-frames.json`,
      ).toBe(deriveMotion(row.id));
    }
  });

  it("the excluded entry is excluded because it is dark, and the catalog agrees", () => {
    expect(
      deriveMotion("tpad"),
      "tpad writes no LEDs at any sampled tick",
    ).toBe("dark");

    const dark = Object.keys(GOLDEN.presets).filter(
      (id) => deriveMotion(id) === "dark",
    );
    expect(dark, "tpad is the only dark preset in the fixture").toEqual([
      "tpad",
    ]);

    // Two independently maintained declarations of the same property, held
    // together here: Phase 8's restsBlack and this phase's derived motion. If a
    // later entry rests black without being excluded from the row, one of the
    // two assertions below names it.
    const recorded = CATALOG.filter((entry) => GOLDEN.presets[entry.id]);
    expect(
      recorded.length,
      "the fixture covers some catalog ids",
    ).toBeGreaterThan(0);
    for (const entry of recorded) {
      expect(
        entry.restsBlack,
        `${entry.id}: restsBlack disagrees with the derived motion`,
      ).toBe(deriveMotion(entry.id) === "dark");
    }
    for (const row of FRONT_DOOR) {
      expect(
        byId(row.id)?.restsBlack,
        `${row.id}: a row entry may not rest black`,
      ).toBe(false);
    }
  });

  it("no dark pad is in the opening window", () => {
    const opening = windowAt(0, 3, FRONT_DOOR.length);
    expect(opening.length, "the opening window is seven slots wide").toBe(7);
    for (const index of opening) {
      expect(
        FRONT_DOOR[index].motion,
        `${FRONT_DOOR[index].id} is dark and would open as a black square`,
      ).not.toBe("dark");
    }
  });

  it("the three largest pads at the opening all move", () => {
    const centre = windowAt(0, 1, FRONT_DOOR.length);
    expect(centre.length, "the hero and its two neighbours").toBe(3);
    for (const index of centre) {
      expect(
        FRONT_DOOR[index].motion,
        `${FRONT_DOOR[index].id} sits at the opening and does not move`,
      ).toBe("animated");
    }
  });

  it("no two quiet pads are adjacent on the ring", () => {
    const count = FRONT_DOOR.length;
    let checked = 0;
    for (let i = 0; i < count; i += 1) {
      const here = FRONT_DOOR[i];
      const next = FRONT_DOOR[(i + 1) % count];
      const bothQuiet =
        here.motion !== "animated" && next.motion !== "animated";
      expect(
        bothQuiet,
        `${here.id} and ${next.id} are both quiet and sit side by side`,
      ).toBe(false);
      checked += 1;
    }
    expect(checked, "every adjacent pair on the ring, including the wrap").toBe(
      count,
    );
  });

  it("the module stays out of the compiler's chunk, and the quiet copy is the shelf's own", () => {
    const source = strip(readFileSync(SOURCE_PATH, "utf8"));
    // "lib/catalog" cannot catch a relative import from inside this very
    // directory, so the two local paths that would pull the compiler in are
    // named as well.
    const forbidden = [
      "vendor",
      "intechstudio",
      "lib/pad",
      "lib/catalog",
      "./index",
      "./entries",
    ];
    const importLines = source.match(/^[ ]*import[ ].*$/gm) ?? [];
    const specifiers = [...source.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (match) => match[1],
    );

    if (importLines.length === 0) {
      // Not a vacuous pass: no import declaration at all is the strongest form
      // of this rule, and it is asserted rather than assumed.
      expect(
        specifiers,
        "front-door.ts declares no imports, so it can carry no specifier",
      ).toEqual([]);
    } else {
      expect(
        specifiers.length,
        "every import declaration yielded a specifier the scan below sees",
      ).toBe(importLines.length);
    }

    for (const specifier of specifiers) {
      for (const bad of forbidden) {
        expect(
          specifier.includes(bad),
          `front-door.ts imports ${specifier}, which drags the compiler in`,
        ).toBe(false);
      }
    }

    const quiet = FRONT_DOOR.filter((row) => row.motion !== "animated");
    expect(quiet.length, "some pads are honestly still").toBeGreaterThan(0);
    for (const row of quiet) {
      expect(typeof row.quiet, `${row.id}: a quiet pad says so`).toBe("string");
      expect(
        row.quiet?.trim().length,
        `${row.id}: the line is not empty`,
      ).toBeGreaterThan(0);
      expect(row.quiet, `${row.id}: the line is one line`).not.toContain("\n");
    }

    for (const row of FRONT_DOOR) {
      const shelf = presetById(row.id)?.quiet;
      if (shelf === undefined) {
        expect(
          presetById(row.id),
          `${row.id}: resolves on the vendored shelf even with no quiet line`,
        ).toBeDefined();
      } else {
        expect(
          row.quiet,
          `${row.id}: the row rewrote the shelf's own quiet line`,
        ).toBe(shelf);
      }
    }
  });
});
