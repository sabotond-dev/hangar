import { describe, expect, it } from "vitest";
import {
  EventType,
  EventTypeToNumber,
  ModuleType,
} from "@intechstudio/grid-protocol";
import { PRESETS, presetById } from "../../vendor/botor/_pad";
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

// CONT-03's gate. Exactly ten tests, and every one of them loops over the
// entries INTERNALLY and names the offending entry in its message. That is
// deliberate: adding a configuration in a later wave must change zero test
// counts, so the numbers in 08-VALIDATION.md stay stable across waves 4 to 6
// and no plan has to restate a suite total. Parameterised tests would make the
// count move with the catalog, which is exactly the thing D-17 forbids.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const NEWLINE = String.fromCharCode(10);
const SLUG = /^[a-z][a-z0-9-]*$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TOKEN = /^@[A-Z][A-Z0-9_]*$/;

const presetEntries = CATALOG.filter((e) => e.source.kind === "preset");
const luaEntries = CATALOG.filter((e) => e.source.kind === "lua");
const stateEntries = CATALOG.filter((e) => e.source.kind === "state");
const presetIds = PRESETS.map((p) => p.id);

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

  it("reads ported names and descriptions off the vendored shelf", () => {
    expect(presetEntries.length, "there are ported entries").toBeGreaterThan(0);
    for (const entry of presetEntries) {
      if (entry.source.kind !== "preset") throw new Error("unreachable");
      const preset = presetById(entry.source.presetId);
      expect(
        preset,
        `${entry.id}: presetId "${entry.source.presetId}" is on the shelf`,
      ).toBeDefined();
      expect(entry.name, `${entry.id}: name matches the preset`).toBe(
        preset?.name,
      );
      expect(
        entry.description,
        `${entry.id}: description matches the preset sentence`,
      ).toBe(preset?.sentence);
    }
  });

  it("carries all nine shelf presets, each exactly once", () => {
    expect(PRESETS.length, "the vendored shelf").toBe(9);
    const carried = presetEntries.map((e) =>
      e.source.kind === "preset" ? e.source.presetId : "",
    );
    expect(carried.slice().sort(), "the ported preset ids").toEqual(
      presetIds.slice().sort(),
    );
  });

  it("never extends the vendored shelf (D-09)", () => {
    expect(PRESETS.length, "the vendored PRESETS array is still nine").toBe(9);
    for (const entry of CATALOG) {
      if (entry.source.kind === "preset") continue;
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
    // vendored shelf's own length, which is not counted from CATALOG.
    expect(presetEntries.length, "ported entries").toBe(PRESETS.length);
    expect(
      CATALOG.length,
      "every entry is a preset, a state or a lua entry",
    ).toBe(presetEntries.length + luaEntries.length + stateEntries.length);

    for (const entry of presetEntries) {
      expect(
        entry.knobs.length,
        `${entry.id}: Phase 5 owns compiler-driven knobs, not this catalog`,
      ).toBe(0);
    }

    for (const entry of luaEntries) {
      expect(
        entry.knobs.length,
        `${entry.id}: a Lua entry carries three to six knobs`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        entry.knobs.length,
        `${entry.id}: a Lua entry carries three to six knobs`,
      ).toBeLessThanOrEqual(6);
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
