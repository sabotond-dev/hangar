// The six geometry rules, in four tests; each covers its rule's edge cases
// internally and names the case in its message, so the count never moves.
//   1. Rule 1 (on the surface) with the offending FIELD named, and rule 5 (the
//      previous valid value survives an invalid edit - the same surface object).
//   2. Rule 2 (overlap is unrepresentable): two regions sharing one cell give
//      a conflict naming BOTH and no `map` at all.
//   3. Rule 4 (duplicate to a free area): reading order, and a full surface
//      that returns `no-space` with the region list byte-identical afterwards.
//   4. Rule 6 (edge adjacency warns and names both; a gap does not; a warning
//      never blocks) and the cap (the seventeenth region refused with the count).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  GEOMETRY_COPY,
  addRegion,
  adjacencyWarnings,
  applyEdit,
  buildCellMap,
  duplicate,
  freeWindow,
  overlapLine,
  validate,
} from "./geometry";
import {
  SURFACE_CELLS,
  SURFACE_ELEMENT_CAP,
  SURFACE_SIZE,
  cellIndex,
  fromDisplay,
  toDisplay,
  type Region,
  type Surface,
} from "./model";

/** A fader, vertical unless told otherwise. Names are fixture data, not copy. */
function region(
  name: string,
  col: number,
  row: number,
  w: number,
  h: number,
  extra: Partial<Region> = {},
): Region {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    kind: "fader",
    col,
    row,
    w,
    h,
    cc: 74,
    channel: 1,
    colour: [13, 15, 4],
    ...extra,
  };
}

function surface(regions: readonly Region[]): Surface {
  return { id: "s", name: "Custom surface", regions };
}

describe("the Sandbox's geometry rules (BUILD-01, BUILD-02)", () => {
  it("1. refuses every off-surface shape with the field named, and the previous valid value survives", () => {
    // The PDF's own Filter is a 2 x 6 at (0, 0); at row 4 it runs off the
    // bottom (4 + 6 = 10). The column of a 9 x 1 at column 1 runs off the
    // right (1 + 9 = 10). A zero width is not a region.
    const cases: { region: Region; field: string }[] = [
      { region: region("Filter", 0, 4, 2, 6), field: "h" },
      { region: region("Strip", 1, 0, 9, 1), field: "w" },
      { region: region("Nothing", 0, 0, 0, 1), field: "w" },
      { region: region("Flat", 0, 0, 1, 0), field: "h" },
      { region: region("Left", -1, 0, 1, 1), field: "col" },
      { region: region("Above", 0, -1, 1, 1), field: "row" },
      { region: region("Beyond", 9, 0, 1, 1), field: "col" },
      { region: region("Below", 0, 9, 1, 1), field: "row" },
    ];
    for (const { region: r, field } of cases) {
      const verdict = validate(r, surface([]));
      expect(verdict.ok, `${r.name} should be refused`).toBe(false);
      if (verdict.ok) continue;
      expect(verdict.problem.rule, r.name).toBe("off-surface");
      expect(verdict.problem.field, `${r.name}: the field named`).toBe(field);
      expect(verdict.problem.message, r.name).toBe(
        GEOMETRY_COPY.offSurface(field as "col" | "row" | "w" | "h"),
      );
    }
    // The four corners and the whole surface are on it. The corners are
    // buttons: since 13-15 a one-row vertical fader is refused by rule 3
    // (its LED span is zero - model.ts section 4a), which is not this rule.
    for (const r of [
      region("TL", 0, 0, 1, 1, { kind: "button" }),
      region("TR", 8, 0, 1, 1, { kind: "button" }),
      region("BL", 0, 8, 1, 1, { kind: "button" }),
      region("BR", 8, 8, 1, 1, { kind: "button" }),
      region("All", 0, 0, 9, 9),
    ]) {
      expect(validate(r, surface([])).ok, `${r.name} is on the surface`).toBe(
        true,
      );
    }

    // Rule 5. An edit that would push Filter off the bottom returns the SAME
    // surface object with the previous valid height still in it, beside the
    // problem the component shows inline.
    const before = surface([region("Filter", 0, 0, 2, 6)]);
    const edited = applyEdit(before, "filter", { row: 4 });
    expect(edited.ok).toBe(false);
    expect(edited.surface, "the previous valid surface, not a copy").toBe(
      before,
    );
    expect(before.regions[0].row, "the previous valid value").toBe(0);
    if (!edited.ok) {
      expect(edited.problem.field).toBe("h");
    }
    // A valid edit lands, and the original is not mutated.
    const moved = applyEdit(before, "filter", { row: 3 });
    expect(moved.ok).toBe(true);
    expect(moved.surface.regions[0].row).toBe(3);
    expect(before.regions[0].row).toBe(0);

    // The named door, both ways, at both ends of the surface: the PDF's
    // "Column 1, Row 1" is the model's (0, 0).
    expect([toDisplay(0), toDisplay(SURFACE_SIZE - 1)]).toEqual([1, 9]);
    expect([fromDisplay(1), fromDisplay(9)]).toEqual([0, 8]);
    for (let n = 0; n < SURFACE_SIZE; n += 1) {
      expect(fromDisplay(toDisplay(n))).toBe(n);
    }
  });

  it("2. makes overlap unrepresentable: one cell shared is a conflict naming both, and no map is returned", () => {
    // Filter 2 x 6 at (0, 0); Space 3 x 3 at (1, 5) shares cell (1, 5).
    const filter = region("Filter", 0, 0, 2, 6);
    const space = region("Space", 1, 5, 3, 3, { kind: "xy", cc2: 75 });
    const built = buildCellMap([filter, space]);
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.kind).toBe("overlap");
    if (built.kind !== "overlap") return;
    expect([built.a, built.b], "both names, first writer first").toEqual([
      "Filter",
      "Space",
    ]);
    expect(built.cell).toBe(cellIndex(1, 5));
    // NEVER HALF-BUILT: the failed result carries no map at all. A negative
    // check that returns the array on conflict fails here on the key, before
    // any cell is read.
    expect("map" in built, "a conflict result has no map").toBe(false);

    // validate says it in the Bible's words, naming the other region.
    const verdict = validate(space, surface([filter]));
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.problem.rule).toBe("overlap");
      expect(verdict.problem.message).toBe(overlapLine("Filter"));
      expect(verdict.problem.message).toBe(
        "This region overlaps Filter. Choose another area or resize it.",
      );
    }

    // The same two with Space moved one cell right build, and every cell
    // holds exactly one index: Filter's twelve are 1, Space's nine are 2, the
    // other sixty are 0.
    const apart = buildCellMap([filter, { ...space, col: 2 }]);
    expect(apart.ok).toBe(true);
    if (!apart.ok) return;
    expect(apart.map.length).toBe(SURFACE_CELLS);
    const tally = [0, 0, 0];
    for (const v of apart.map) tally[v] += 1;
    expect(tally).toEqual([SURFACE_CELLS - 12 - 9, 12, 9]);
    expect(apart.map[cellIndex(1, 5)]).toBe(1);
    expect(apart.map[cellIndex(2, 5)]).toBe(2);

    // Editing a region so that it lands on another is refused and the
    // surface survives (rule 5 again, through rule 2).
    const both = surface([filter, { ...space, col: 2 }]);
    const pushed = applyEdit(both, "space", { col: 1 });
    expect(pushed.ok).toBe(false);
    expect(pushed.surface).toBe(both);
  });

  it("3. duplicates into the first free window in reading order, and a full surface deletes nothing", () => {
    const filter = region("Filter", 0, 0, 2, 6);
    const built = buildCellMap([filter]);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    // Reading order: rows first, then columns - the first 2 x 6 window with
    // Filter at (0, 0) is at (2, 0), not under it.
    expect(freeWindow(2, 6, built.map)).toEqual({ col: 2, row: 0 });
    expect(
      freeWindow(9, 1, built.map),
      "a full-width strip below Filter",
    ).toEqual({ col: 0, row: 6 });
    expect(
      freeWindow(9, 4, built.map),
      "nothing 9 x 4 is free",
    ).toBeUndefined();

    const copied = duplicate(surface([filter]), "filter", (s) => `${s.id}-2`);
    expect(copied.ok).toBe(true);
    if (!copied.ok) return;
    expect(copied.region).toMatchObject({
      id: "filter-2",
      name: "Filter copy",
      col: 2,
      row: 0,
      w: 2,
      h: 6,
      cc: 74,
      channel: 1,
    });
    expect(copied.surface.regions.length).toBe(2);
    expect(copied.surface.regions[0]).toBe(filter);

    // A surface with no room for another 2 x 6: four faders fill the top
    // six rows' eight columns, a 1 x 3 sits in the ninth. The list is
    // BYTE-IDENTICAL after the failed duplicate.
    const full = surface([
      region("A", 0, 0, 2, 6),
      region("B", 2, 0, 2, 6),
      region("C", 4, 0, 2, 6),
      region("D", 6, 0, 2, 6),
      region("E", 8, 0, 1, 3),
    ]);
    const bytes = JSON.stringify(full.regions);
    const refused = duplicate(full, "a", (s) => `${s.id}-2`);
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.reason).toBe("no-space");
    expect(refused.surface, "the surface handed in, untouched").toBe(full);
    expect(JSON.stringify(full.regions)).toBe(bytes);
    expect(full.regions.length).toBe(5);
    // And the 1 x 3 still finds room below itself, in the ninth column.
    const small = duplicate(full, "e", (s) => `${s.id}-2`);
    expect(small.ok).toBe(true);
    if (small.ok) expect(small.region).toMatchObject({ col: 8, row: 3 });
  });

  it("4. warns at a shared edge naming both, not at one cell of gap, and a warning never blocks; the cap refuses the seventeenth", () => {
    const filter = region("Filter", 0, 0, 2, 6);
    const touching = region("Space", 2, 2, 3, 3, { kind: "xy", cc2: 75 });
    const gapped = { ...touching, col: 3 };
    const below = region("Go", 0, 6, 2, 1, { kind: "button" });
    const diagonal = region("Corner", 2, 6, 1, 1, { kind: "button" });

    const warnings = adjacencyWarnings([filter, touching, below, diagonal]);
    expect(warnings.map((w) => [w.a, w.b])).toEqual([
      ["Filter", "Space"],
      ["Filter", "Go"],
      ["Go", "Corner"],
    ]);
    expect(warnings[0].message).toBe(
      GEOMETRY_COPY.adjacency("Filter", "Space"),
    );
    // A corner-to-corner touch is not a shared edge: Space (2..4, 2..4) and
    // Corner (2, 6) do not appear together; nor do Space and Go.
    expect(adjacencyWarnings([filter, gapped])).toEqual([]);
    expect(adjacencyWarnings([touching, diagonal])).toEqual([]);

    // A WARNING NEVER BLOCKS: the touching pair validates, adds, and edits.
    const warned = surface([filter, touching]);
    expect(validate(touching, warned).ok).toBe(true);
    expect(addRegion(surface([filter]), touching).ok).toBe(true);
    expect(buildCellMap(warned.regions).ok).toBe(true);
    expect(adjacencyWarnings(warned.regions).length).toBe(1);

    // The cap: sixteen 1 x 1 buttons on the top two rows fit; the
    // seventeenth is refused with the count, and the surface survives.
    const sixteen = Array.from({ length: SURFACE_ELEMENT_CAP }, (_, i) =>
      region(`B${i}`, i % 8, Math.floor(i / 8), 1, 1, { kind: "button" }),
    );
    let s = surface([]);
    for (const b of sixteen) {
      const added = addRegion(s, b);
      expect(added.ok, b.name).toBe(true);
      s = added.surface;
    }
    expect(s.regions.length).toBe(SURFACE_ELEMENT_CAP);
    const seventeenth = addRegion(
      s,
      region("B16", 0, 2, 1, 1, { kind: "button" }),
    );
    expect(seventeenth.ok).toBe(false);
    if (!seventeenth.ok) {
      expect(seventeenth.problem.rule).toBe("cap");
      expect(seventeenth.problem.message).toBe(
        GEOMETRY_COPY.cap(SURFACE_ELEMENT_CAP),
      );
      expect(seventeenth.surface).toBe(s);
    }
    // Duplicate at the cap is refused for the same reason and deletes nothing.
    const bytes = JSON.stringify(s.regions);
    const dup = duplicate(s, "b0", (r) => `${r.id}-2`);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.reason).toBe("cap");
    expect(JSON.stringify(s.regions)).toBe(bytes);

    // Rule 3 through the parameter: a 2 x 2 Knob is refused under the
    // derived default (13-15, model.ts section 4b) and admitted under a
    // caller's own minimum, so the rule stayed a parameter. Since 13-15 a
    // fader needs two cells along the axis it reads and an XY pad 2 x 2
    // (section 4a): a one-row vertical fader and a one-column horizontal
    // one are refused with the axis named; a 2 x 1 horizontal one is not.
    const knob = region("Turn", 4, 4, 2, 2, { kind: "knob" });
    const refused = validate(knob, surface([]));
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.problem.rule).toBe("too-small");
    expect(
      validate(knob, surface([]), { minimums: { knob: { w: 2, h: 2 } } }).ok,
    ).toBe(true);
    expect(validate({ ...knob, w: 3, h: 3 }, surface([])).ok).toBe(true);
    const flat = validate(region("Flat", 0, 0, 3, 1), surface([]));
    expect(flat.ok).toBe(false);
    if (!flat.ok) {
      expect(flat.problem.rule).toBe("too-small");
      expect(flat.problem.field).toBe("h");
      expect(flat.problem.message).toContain("rows");
    }
    const thin = validate(
      region("Thin", 0, 0, 1, 3, { orientation: "horizontal" }),
      surface([]),
    );
    expect(thin.ok).toBe(false);
    if (!thin.ok) expect(thin.problem.field).toBe("w");
    expect(
      validate(
        region("Wide", 0, 0, 2, 1, { orientation: "horizontal" }),
        surface([]),
      ).ok,
    ).toBe(true);
    expect(
      validate(region("Pad", 0, 0, 1, 2, { kind: "xy" }), surface([])).ok,
    ).toBe(false);
  });
});
