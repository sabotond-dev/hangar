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
// AMENDMENT (plan 13-07, D-09, 2026-09-11): SEVEN TESTS, FROM EIGHT. The
// PDF's intro has one live surface where the ring was, so "no two quiet pads
// are adjacent on the ring" lost its subject and was deleted by name; the
// motion-derivation test and the restsBlack test survive, re-aimed at the
// hero as well as the list ("the hero must not be a dark pad" is the same
// rule with one member).
//
// AMENDMENT (plan 13-09, 2026-09-11): FIVE TESTS, FROM SEVEN. The coverflow
// left the tree with the workspace (PDF page 5), and the two opening-window
// tests - "no dark pad is in the opening window" and "the three largest pads
// at the opening all move" - lost their subject with it and were deleted by
// name, with the windowAt helper only they used. FRONT_DOOR is a MEMBERSHIP
// list now: the hero is derived from it and the workspace's rail reads it as
// the nearby set for a cold arrival; its order is the rail's order and
// nothing asserts a ring property of it.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// HANGAR's nine (plan 11-05). The byte-equal `quiet` assertion below holds the
// front door's row against the shelf HANGAR actually ships; the vendored shelf
// is held against that one, field by field, by ./presets.spec.ts.
import { presetById } from "./presets";
import {
  EXCLUDED_FROM_ROW,
  FRONT_DOOR,
  FRONT_DOOR_HERO,
  frontDoorIndex,
  heroOf,
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
      // THIS RULE IS LIVE, AND NOT FOR THE REASON IT WAS WRITTEN FOR. It was
      // written when "lua" entries had no simulator engine (plan 08-03 landed
      // one two phases ago), and it stayed load-bearing because it picked up
      // a second purpose in Phase 10: Coverflow.svelte calls createEngine for
      // every ring entry unconditionally, so a "lua" row dynamic-imports the
      // 271,581-byte Lua VM on the front page's first paint, and
      // e2e/tuning.e2e.ts asserts for "/" that a browsing visitor downloads
      // no WebAssembly at all. Plan 11-14 measured it (11-14-HANDOVER.md) by
      // planting SONAR at ring position 5: this assertion, the golden-frames
      // record and the vendored-shelf resolution all go red - and the last
      // two pass BY ID, so a hand-authored card keeping a preset's id would
      // sail past them while deriveMotion read the preset's frames. The
      // comment above this line said only the first, stale, reason from
      // Phase 8 until the 11-16 gate; the rule itself was never wrong.
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

    // `trackpad` since plan 12-10: the hand-authored TRACKPAD replaced the
    // tpad preset as the catalog's one trackpad card, and it is the one dark
    // card, so it is the one this line has always been about.
    expect(excludedIds, "trackpad is on the exclusion list").toContain(
      "trackpad",
    );

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

  it("the declared motion is what the golden frames record, for every member and for the hero", () => {
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

    // THE HERO (13-07): the one member the intro runs. Its declared motion is
    // the golden frames' derivation like every other member's, it is not
    // dark, and it is the first non-dark member in the list's own order -
    // derived, not chosen. The id is printed so the SUMMARY can quote it.
    const hero = FRONT_DOOR_HERO;
    console.log(`front-door hero: ${hero.id}, motion ${hero.motion}`);
    expect(
      GOLDEN.presets[hero.id],
      `${hero.id}: golden-frames.json records the hero`,
    ).toBeDefined();
    expect(hero.motion, "the hero's declared motion is the derived one").toBe(
      deriveMotion(hero.id),
    );
    expect(deriveMotion(hero.id), "the hero must not be a dark pad").not.toBe(
      "dark",
    );
    expect(hero, "the hero is the first non-dark member").toBe(
      heroOf(FRONT_DOOR),
    );
    expect(hero).toBe(FRONT_DOOR.find((row) => row.motion !== "dark"));
  });

  it("the excluded entry is excluded because it is dark, the catalog agrees, and the hero does not rest black", () => {
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

    // THE HERO (13-07): the same rule with one member, and held against the
    // catalog's own restsBlack rather than against this module's motion, so
    // the two readings are tied together on the one entry the intro shows.
    const hero = byId(FRONT_DOOR_HERO.id);
    expect(hero, "the hero is a catalog entry").toBeDefined();
    expect(hero?.restsBlack, "the hero does not rest black").toBe(false);
    expect(
      hero?.preview,
      "the hero is a padsim entry, so / fetches no WebAssembly",
    ).toBe("padsim");
  });

  // "no two quiet pads are adjacent on the ring" stood here until 13-07
  // deleted it by name (D-09, 2026-09-11), and "no dark pad is in the
  // opening window" and "the three largest pads at the opening all move"
  // stood here until 13-09 deleted them by name the same day: the ring the
  // coverflow rendered is gone, and the membership has no window.

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
