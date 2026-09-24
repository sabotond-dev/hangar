import { describe, expect, it } from "vitest";
import {
  EventType,
  EventTypeToNumber,
  ModuleType,
} from "@intechstudio/grid-protocol";
import { PRESETS, presetById, quantiseColour } from "../../vendor/botor/_pad";
import {
  byFeatured,
  byId,
  byName,
  byNewest,
  build,
  CATALOG,
  EVENT_SETUP,
  EVENT_TIMER,
  KNOB_KINDS,
  previewFor,
  ZONA_MODULE_TYPE,
} from "./index";
import { declaredDivergence } from "./divergence";
import {
  LATTICE_SIZE,
  cellLiteral,
  cellOf,
  latticeSample,
  paletteLattice,
} from "./lattice";
import { outputProblems, roleOfKnob } from "../tune/midi";
import { isMidiDestination } from "../tune/surprise";
import { presetKnobs } from "../tune/knobs.preset";

// CONT-03's gate. Exactly ten tests, and every one of them loops over the
// entries INTERNALLY and names the offending entry in its message. That is
// deliberate: adding a configuration in a later wave must change zero test
// counts, so the numbers in 08-VALIDATION.md stay stable across waves 4 to 6
// and no plan has to restate a suite total. Parameterised tests would make the
// count move with the catalog, which is exactly the thing D-17 forbids.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const NEWLINE = String.fromCharCode(10);

/** The hand-authored colour knobs on the lattice (change 19, card by card): ORBIT's four. */
const LUA_LATTICE_KNOBS = 33;
const SLUG = /^[a-z][a-z0-9-]*$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TOKEN = /^@[A-Z][A-Z0-9_]*$/;

/**
 * The cards past TUNE-01's six by the user's word: ORBIT's fourteen (change 8, 2026-09-18) and
 * the three that took its clock idiom with Sync and Division at change 12 - STEPS eight, RADAR
 * POINTS and GHOST seven. Every other Lua entry keeps the cap.
 */
const SYNC_CARD_KNOBS: Readonly<Record<string, number>> = {
  orbit: 14,
  steps: 8,
  "radar-points": 7,
  ghost: 7,
};

const presetEntries = CATALOG.filter((e) => e.source.kind === "preset");
const luaEntries = CATALOG.filter((e) => e.source.kind === "lua");
const stateEntries = CATALOG.filter((e) => e.source.kind === "state");
const presetIds = PRESETS.map((p) => p.id);

/**
 * The one shelf preset that is NOT a catalog card, by name.
 *
 * Plan 12-10, under the user's answer "selectable tuning options under
 * Trackpad": the hand-authored TRACKPAD (`trackpad`) is the one trackpad card
 * and the `tpad` preset left the catalog. It did NOT leave the shelf -
 * presets.spec.ts still holds all nine against the vendored nine - so the
 * ported entries are the vendored ids minus exactly these, and a further
 * name here is a decision somebody has made in a plan. The second, `radar`,
 * is change 12b's (2026-09-18, BENCH-2026-09-16.txt section 12, the user's
 * answer "2"): the hand-authored entries/radar.ts took the preset's id so no
 * shared link dies, and the preset stays on the shelf for the suites that run
 * the compiled card. The third and fourth, `faders` and `ninepads`, are change 17C's
 * (2026-09-23): the hand-authored entries/faders.ts and entries/ninepads.ts took the ids for
 * the latch and their outputs.
 */
const SHELF_NOT_CARDED: readonly string[] = [
  "tpad",
  "radar",
  "faders",
  "ninepads",
];
const cardedPresetIds = presetIds.filter(
  (id) => !SHELF_NOT_CARDED.includes(id),
);

describe("catalog metadata and shape (CONT-02, CONT-03)", () => {
  it("carries complete metadata on every entry", () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      expect(entry.name, `${entry.id}: name is non-empty`).not.toBe("");
      expect(
        entry.description.length,
        `${entry.id}: description is non-empty`,
      ).toBeGreaterThan(0);
      expect(
        entry.description.includes(NEWLINE),
        `${entry.id}: description is one line`,
      ).toBe(false);
      expect(
        entry.description.length,
        `${entry.id}: description fits a card`,
      ).toBeLessThanOrEqual(110);
      expect(
        entry.tags.length,
        `${entry.id}: has at least one tag`,
      ).toBeGreaterThan(0);
      for (const tag of entry.tags) {
        expect(tag, `${entry.id}: tag "${tag}" is a lower-case slug`).toMatch(
          SLUG,
        );
      }
      expect(typeof entry.featured, `${entry.id}: featured`).toBe("boolean");
      expect(typeof entry.restsBlack, `${entry.id}: restsBlack`).toBe(
        "boolean",
      );
      expect(entry.addedAt, `${entry.id}: addedAt is YYYY-MM-DD`).toMatch(
        ISO_DATE,
      );
      expect(
        Number.isNaN(Date.parse(entry.addedAt)),
        `${entry.id}: addedAt parses to a real date`,
      ).toBe(false);
    }
  });

  it("gives every entry a unique url slug", () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const entry of CATALOG) {
      expect(entry.id, `id "${entry.id}" is a url slug`).toMatch(SLUG);
      expect(seen.has(entry.id), `id "${entry.id}" is duplicated`).toBe(false);
      seen.add(entry.id);
      expect(byId(entry.id), `byId("${entry.id}") round-trips`).toBe(entry);
    }
    expect(seen.size, "distinct ids").toBe(CATALOG.length);
    expect(byId("no-such-entry"), "an unknown id").toBeUndefined();
  });

  it("stores a preview engine that is derived, never chosen", () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      expect(
        entry.preview,
        `${entry.id}: preview must be previewFor(source)`,
      ).toBe(previewFor(entry.source));
    }
  });

  // KEPT ON THE VENDORED SHELF ON PURPOSE (plan 11-05). entries/ported.ts now
  // reads $lib/catalog/presets, so this is no longer a restatement of the
  // module under test - it is a genuine comparison between HANGAR's nine and
  // BOTOR's, and it only became one when that import moved. Before 11-05 both
  // sides of these two assertions were literally the same object.
  //
  // PLAN 11-06 SPENT THREE ROWS OF THE DIVERGENCE RECORD AGAINST THIS TEST, AND
  // THE TEST STILL COMPARES FIRST. AURORA's, PINWHEEL's and STARFIELD's
  // sentences each gained a clause naming what the card now sends, so three of
  // the nine descriptions no longer equal BOTOR's. The allowance is NOT a skip
  // list: the comparison is made for all nine, and only a mismatch consults
  // src/lib/catalog/divergence.ts - so a card whose sentence drifts without a
  // row is still red, and a row whose card came back into agreement is caught
  // by presets.spec.ts test 2 rather than left standing here.
  it("agrees with the vendored shelf on every ported name and description", () => {
    expect(presetEntries.length, "there are ported entries").toBeGreaterThan(0);
    let compared = 0;
    let allowed = 0;
    for (const entry of presetEntries) {
      if (entry.source.kind !== "preset") throw new Error("unreachable");
      const id = entry.source.presetId;
      const preset = presetById(id);
      expect(
        preset,
        `${entry.id}: presetId "${id}" is on the shelf`,
      ).toBeDefined();

      for (const [path, mine, theirs] of [
        ["name", entry.name, preset?.name],
        ["sentence", entry.description, preset?.sentence],
      ] as const) {
        compared += 1;
        if (mine === theirs) continue;
        const row = declaredDivergence(id, path);
        expect(
          row,
          `${entry.id} at ${path}: HANGAR says ${JSON.stringify(mine)} where ` +
            `the vendored shelf says ${JSON.stringify(theirs)}, and NOBODY ` +
            `DECLARED IT. HANGAR owns the nine values since plan 11-05, so ` +
            `this is allowed - but it has to be written down in ` +
            `src/lib/catalog/divergence.ts with this exact path, both values, ` +
            `a reason, a plan id and a date, or reverted.`,
        ).toBeDefined();
        expect(
          row?.hangar,
          `${entry.id} at ${path}: the row's \`hangar\` value is stale`,
        ).toBe(mine);
        expect(
          row?.vendored,
          `${entry.id} at ${path}: the row's \`vendored\` value is stale`,
        ).toBe(theirs);
        allowed += 1;
      }
    }
    // Both counted, so an allowance list that quietly grew to cover everything
    // cannot pass as a comparison. Eighteen strings, three of them declared.
    expect(compared, "two strings per ported entry were compared").toBe(
      presetEntries.length * 2,
    );
    expect(
      allowed,
      "the strings HANGAR deliberately diverges on; every other one matched " +
        "the vendored shelf exactly",
    ).toBeLessThan(compared);
  });

  it("carries the carded shelf presets, each exactly once, and names the others (five of nine since change 17C)", () => {
    expect(PRESETS.length, "the vendored shelf").toBe(9);
    for (const id of SHELF_NOT_CARDED) {
      expect(presetIds, `${id} is a real shelf preset`).toContain(id);
      // tpad is no card at all; radar is a Lua card under the preset's id.
      expect(
        byId(id)?.source.kind,
        `${id} is not a PRESET catalog card`,
      ).not.toBe("preset");
    }
    expect(cardedPresetIds.length, "five carded").toBe(5);
    const carried = presetEntries.map((e) =>
      e.source.kind === "preset" ? e.source.presetId : "",
    );
    expect(carried.slice().sort(), "the ported preset ids").toEqual(
      cardedPresetIds.slice().sort(),
    );
  });

  it("never extends the vendored shelf (D-09)", () => {
    expect(PRESETS.length, "the vendored PRESETS array is still nine").toBe(9);
    for (const entry of CATALOG) {
      if (entry.source.kind === "preset") continue;
      // A hand-authored entry may hold a shelf id ONLY when the shelf card is
      // declared not carded above (radar, change 12b: the rebuild keeps the
      // address); any other collision is the shelf being extended.
      if (SHELF_NOT_CARDED.includes(entry.id)) continue;
      expect(
        presetIds.includes(entry.id),
        `${entry.id}: a non-preset entry must not take a shelf preset's id`,
      ).toBe(false);
    }
    // A catalog that lost every entry must not be able to satisfy the loop
    // above vacuously.
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
  });

  it("holds knobs only on hand-authored Lua entries (D-12, TUNE-01)", () => {
    // The loop cannot be vacuous: the preset entries are anchored to the
    // vendored shelf's own length, which is not counted from CATALOG - less
    // the one shelf preset named above as not a card.
    expect(presetEntries.length, "ported entries").toBe(
      PRESETS.length - SHELF_NOT_CARDED.length,
    );
    expect(
      CATALOG.length,
      "every entry is a preset, a state or a lua entry",
    ).toBe(presetEntries.length + luaEntries.length + stateEntries.length);

    for (const entry of presetEntries) {
      // Phase 5 owns a compiler-driven card's own knobs (knobs.preset.ts), not this catalog. What
      // a WRAPPED preset carries since change 17C is its MIDI outputs' knobs and nothing else:
      // every knob is named by an output, the declaration holds, every knob names the wire, and
      // every superseded id is a real shelf knob of the card.
      const roles = roleOfKnob(entry);
      expect(
        entry.knobs.filter((k) => !roles.has(k.id)).map((k) => k.id),
        `${entry.id}: Phase 5 owns compiler-driven knobs, not this catalog`,
      ).toEqual([]);
      expect(outputProblems(entry), `${entry.id}: its MIDI outputs`).toEqual(
        [],
      );
      for (const knob of entry.knobs) {
        expect(
          isMidiDestination(knob),
          `${entry.id}/${knob.id}: an output's knob names the wire`,
        ).toBe(true);
        expect(knob.token, `${entry.id}/${knob.id}: token shape`).toMatch(
          TOKEN,
        );
      }
      const shelf = presetKnobs(entry.id).map((k) => k.id);
      for (const id of entry.supersedes ?? []) {
        expect(shelf, `${entry.id}: supersedes a knob it never had`).toContain(
          id,
        );
      }
      expect(
        entry.knobs.length === 0 || (entry.outputs ?? []).length > 0,
        `${entry.id}: knobs without an output`,
      ).toBe(true);
    }

    for (const entry of luaEntries) {
      // Change 17 (BENCH-2026-09-16.txt section 17, "every card gets the full set"): an output's
      // Type, Channel, Number and Receive knobs are its MIDI block's and do not count here.
      const roles = roleOfKnob(entry);
      const counted = entry.knobs.filter((k) => !roles.has(k.id)).length;
      expect(outputProblems(entry), `${entry.id}: its MIDI outputs`).toEqual(
        [],
      );
      // The floor counts every knob (change 17B): LUMEN's two MIDI knobs became two output blocks,
      // leaving it two knobs outside them - still twelve a visitor can turn. The cap counts the
      // knobs outside the outputs.
      expect(
        entry.knobs.length,
        `${entry.id}: a Lua entry carries three to six knobs`,
      ).toBeGreaterThanOrEqual(3);
      // TUNE-01's six is lifted for the sync cards by the user's word (change 8, 2026-09-18,
      // BENCH-2026-09-16.txt section 8 answer 2: ORBIT's fourth ring, a colour and a note per
      // ring, Sync and Division; change 12: STEPS, RADAR POINTS and GHOST take Sync and Division);
      // the next gate amends the rule. Every other card keeps the cap.
      expect(
        counted,
        `${entry.id}: a Lua entry carries three to six knobs`,
      ).toBeLessThanOrEqual(SYNC_CARD_KNOBS[entry.id] ?? 6);
      // Every knob an output names is a MIDI destination by its words, so the section and the
      // roll's scope rule (surprise.ts) read it as the wire.
      for (const id of roles.keys()) {
        const knob = entry.knobs.find((k) => k.id === id);
        expect(
          knob !== undefined && isMidiDestination(knob),
          `${entry.id}/${id}: an output's knob names the wire`,
        ).toBe(true);
      }
      const tokens: string[] = [];
      for (const knob of entry.knobs) {
        expect(
          KNOB_KINDS.includes(knob.kind),
          `${entry.id}/${knob.id}: kind "${knob.kind}" is in the shared vocabulary`,
        ).toBe(true);
        expect(knob.token, `${entry.id}/${knob.id}: token shape`).toMatch(
          TOKEN,
        );
        for (const other of tokens) {
          expect(
            knob.token.startsWith(other) || other.startsWith(knob.token),
            `${entry.id}: token "${knob.token}" collides with "${other}"`,
          ).toBe(false);
        }
        tokens.push(knob.token);
        expect(
          knob.values.length,
          `${entry.id}/${knob.id}: at least two values`,
        ).toBeGreaterThanOrEqual(2);
        expect(
          Number.isInteger(knob.default),
          `${entry.id}/${knob.id}: default is an integer index`,
        ).toBe(true);
        expect(
          knob.default >= 0 && knob.default < knob.values.length,
          `${entry.id}/${knob.id}: default ${knob.default} indexes values`,
        ).toBe(true);
      }
    }
  });

  it("puts every hand-authored colour knob on the RGB444 lattice, its own colours first (change 19)", () => {
    // THE CELL RULE is the vendored quantiseColour's, restated in lattice.ts because the catalog may
    // not import the compiler: held here on every channel value.
    for (let v = 0; v <= 255; v += 1) {
      expect(cellOf(`${v},0,0`), `red ${v}`).toBe(
        (quantiseColour({ r: v, g: 0, b: 0 }).r / 17) << 8,
      );
      expect(cellOf(`0,0,${v}`), `blue ${v}`).toBe(
        quantiseColour({ r: 0, g: 0, b: v }).b / 17,
      );
    }
    expect(cellOf("0,200,255"), "0,200,255 stands in 0,204,255's cell").toBe(
      cellOf("0,204,255"),
    );
    expect(cellLiteral(4095)).toBe("255,255,255");
    expect(cellOf("256,0,0"), "not a colour").toBeUndefined();
    expect(() => paletteLattice(["0,200,255", "0,204,255"])).toThrow();

    let lattices = 0;
    for (const entry of CATALOG) {
      if (entry.source.kind !== "lua") continue;
      for (const knob of entry.knobs) {
        if (knob.kind !== "colour" || knob.palette === undefined) continue;
        lattices += 1;
        const where = `${entry.id}/${knob.id}`;
        // The palette first, in its old order, so every index a saved copy names still names it.
        expect(knob.values.slice(0, knob.palette.length), where).toEqual([
          ...knob.palette,
        ]);
        expect(knob.values, `${where}: built by paletteLattice`).toBe(
          paletteLattice(knob.palette),
        );
        // One rung per RGB444 cell, all 4,096 of them.
        expect(knob.values.length, where).toBe(LATTICE_SIZE);
        const cells = new Set(knob.values.map((literal) => cellOf(literal)));
        expect(cells.size, `${where}: one rung per cell`).toBe(LATTICE_SIZE);
        // The default is one of the card's own colours, so its literal - and the wire - is as before.
        expect(
          knob.default,
          `${where}: the default is an old rung`,
        ).toBeLessThan(knob.palette.length);
        // Off the palette every rung is the cell's own literal.
        for (let at = knob.palette.length; at < knob.values.length; at += 1) {
          if (knob.values[at] !== cellLiteral(cellOf(knob.values[at]) ?? -1)) {
            throw new Error(`${where}: rung ${at} is not its cell's literal`);
          }
        }
        // The sweeps' sample: the palette, the corner and the 27 cells.
        const sample = latticeSample(knob);
        expect(sample.slice(0, knob.palette.length), where).toEqual(
          knob.palette.map((_, at) => at),
        );
        expect(
          sample.map((at) => knob.values[at]),
          where,
        ).toContain("255,255,255");
      }
    }
    expect(lattices, "the hand-authored lattice colour knobs").toBe(
      LUA_LATTICE_KNOBS,
    );
  });

  it("keeps defaults in step with knobs", () => {
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const entry of CATALOG) {
      expect(
        Object.keys(entry.defaults).slice().sort(),
        `${entry.id}: defaults key set`,
      ).toEqual(
        entry.knobs
          .map((k) => k.id)
          .slice()
          .sort(),
      );
      for (const knob of entry.knobs) {
        expect(
          entry.defaults[knob.id],
          `${entry.id}/${knob.id}: defaults index disagrees with the knob`,
        ).toBe(knob.default);
      }
    }
  });

  it("restates the pinned package's constants correctly", () => {
    // types.ts must not import the pinned package - see its module comment - so
    // the three literals are asserted here, in the spec, where the import costs
    // a shipped chunk nothing.
    expect(ZONA_MODULE_TYPE, "the ZONA module type").toBe(ModuleType.ZONA);
    expect(EVENT_SETUP, "the SETUP event number").toBe(
      EventTypeToNumber(EventType.SETUP),
    );
    expect(EVENT_SETUP, "the SETUP event number, measured at the pin").toBe(0);
    expect(EVENT_TIMER, "the TIMER event number").toBe(
      EventTypeToNumber(EventType.TIMER),
    );
    expect(EVENT_TIMER, "the TIMER event number, measured at the pin").toBe(6);
  });

  it("builds the Profile-Cloud object and sorts without mutating", () => {
    const entry = CATALOG[0];
    expect(
      build(
        entry,
        { setup: "a", timer: "b" },
        { major: 1, minor: 0, patch: 0 },
      ),
      "the built configuration object",
    ).toEqual({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      configType: "preset",
      type: "ZONA",
      version: { major: 1, minor: 0, patch: 0 },
      configs: [
        {
          controlElementNumber: 0,
          events: [
            { event: 0, config: "a" },
            { event: 6, config: "b" },
          ],
        },
      ],
    });

    for (const [label, sorted] of [
      ["byFeatured", byFeatured()],
      ["byNewest", byNewest()],
      ["byName", byName()],
    ] as const) {
      expect(sorted.length, `${label} keeps every entry`).toBe(CATALOG.length);
      expect(sorted, `${label} returns a new array`).not.toBe(CATALOG);
    }
    expect(
      byFeatured()[0].featured,
      "byFeatured puts a featured entry first",
    ).toBe(true);
  });
});
