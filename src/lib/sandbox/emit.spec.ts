// The emitter's five tests (13-14 task 02): five costs at the picker corner, the dead-branch
// pair, the map, both class gates, and the library's names. FIVE TESTS, AND THE COUNT NEVER
// MOVES; each loops over its surfaces and names the surface in its message.
//
// EVERY FIGURE HERE IS MEASURED IN THIS TREE under the pinned `GridScript.compressScript` after
// `padReady()`, `max(compressed, raw)`, canonical, at the RGB444 picker corner (every region at
// `255,255,255`) - lua-entries.sweep.spec.ts test 1's rule through cost.ts; a minifier bump or an
// emitter edit that moves one moves the assertion. The research's figures are printed beside the
// tree's (13-14-SUMMARY.md names every difference). The five surfaces, controllers at three
// digits and channel 16: 1 element (the PDF's Filter), 4 (page 3), 8, 12 and 16 (faders + buttons).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { PadSim } from "../../vendor/botor/pad-sim";
import { KX, KY } from "../catalog/calibration";
import {
  LIBRARY_CONVENTIONS,
  LIBRARY_GLOBALS,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
} from "../catalog/library";
import { createLuaHost } from "../sim/lua-host";
import { blankPadState } from "../sim/lua-pad-sim";
import {
  AND,
  EQ,
  F,
  GE,
  GT,
  LT,
  OR,
  V,
  branchOf as branchTextOf,
  endedEscapes,
  isEndedOpener,
  isOnsetChain,
  scan,
  startedAdmits,
} from "../catalog/touch-guard";
import { scaleChannel } from "../catalog/brightness";
import { padReady } from "../pad/ready";
import {
  EVENT_BUDGET,
  atPickerCorner,
  canonical,
  costOf,
  measureSurface,
} from "./cost";
import {
  MARKER,
  OWN_NAMES_INLINE,
  OWN_NAMES_SPLIT,
  PULL_IN_MAPMODE,
  PULL_IN_TIMER,
  RUNTIME_ENTRY,
  blankIndices,
  blankRow,
  capitalCalls,
  capitalDefinitions,
  emitSurface,
  regionRow,
  renderCellMap,
  renderRegionTable,
} from "./emit";
import { buildCellMap } from "./geometry";
import { landSurface } from "./land";
import { packRuntime } from "./runtime";
import {
  BRANCHES,
  PICKER_CORNER,
  SURFACE_CELLS,
  cellIndex,
  type Branch,
  colourByte,
  withBrightness,
  type Region,
  type Surface,
} from "./model";

// ---------------------------------------------------------------------------
// The fixtures. Names are fixture data, not copy.

function region(
  name: string,
  kind: Region["kind"],
  col: number,
  row: number,
  w: number,
  h: number,
  extra: Partial<Region> = {},
): Region {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    kind,
    col,
    row,
    w,
    h,
    cc: 102,
    channel: 16,
    colour: PICKER_CORNER,
    ...extra,
  };
}

const surface = (name: string, regions: readonly Region[]): Surface => ({
  id: name.toLowerCase(),
  name,
  regions,
});

/** The PDF's page 3, as drawn: a 2 x 6 Fader, an XY pad, a Button and a Knob. */
const PAGE3 = surface("Page 3", [
  region("Filter", "fader", 0, 0, 2, 6),
  region("Space", "xy", 3, 0, 3, 3, { cc2: 103 }),
  region("Turn", "knob", 3, 4, 3, 3),
  region("Go", "button", 7, 0, 2, 2),
]);

const ONE = surface("One", [PAGE3.regions[0]]);

const fadersAt = (count: number, w: number, h: number): Region[] =>
  Array.from({ length: count }, (_, i) =>
    region(`Fader ${i + 1}`, "fader", i * w, 0, w, h, { cc: 100 + i }),
  );

const buttonsAt = (
  count: number,
  w: number,
  h: number,
  row: number,
): Region[] =>
  Array.from({ length: count }, (_, i) =>
    region(`Button ${i + 1}`, "button", i * w, row, w, h, { cc: 110 + i }),
  );

const EIGHT = surface("Eight", [
  ...fadersAt(4, 2, 6),
  ...buttonsAt(4, 2, 1, 7),
]);
const TWELVE = surface("Twelve", [
  ...fadersAt(8, 1, 6),
  ...buttonsAt(4, 2, 2, 7),
]);
const SIXTEEN = surface("Sixteen", [
  ...fadersAt(8, 1, 6),
  ...buttonsAt(8, 1, 2, 7),
]);

/** Four vertical faders, the research's dead-branch surface. */
const FOUR_FADERS = surface("Four faders", fadersAt(4, 2, 6));

const FIVE: readonly { surface: Surface; count: number; research?: number }[] =
  [
    { surface: ONE, count: 1 },
    { surface: PAGE3, count: 4, research: 366 },
    { surface: EIGHT, count: 8, research: 498 },
    { surface: TWELVE, count: 12, research: 652 },
    { surface: SIXTEEN, count: 16, research: 811 },
  ];

/**
 * The figures this tree measured (see the header). Two-slot pull-in; the
 * three-slot figure is +15. 13-14 pinned 343 / 457 / 608 / 764 / 922 with the
 * raw spans; 13-15's per-kind geometry moved every one (a fader's calibrated
 * span costs a digit or two more, a button's four zeros cost several less).
 */
const PINNED: Record<number, number> = {
  1: 345,
  4: 460,
  8: 588,
  12: 748,
  16: 882,
};

describe("the Sandbox emitter (BUILD-01, BUILD-02, BUILD-03, CONT-02)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("1. costs one, four, eight, twelve and sixteen elements at the picker corner: all five under 908, the dearest sixteen's finding closed", async () => {
    const lines: string[] = [];
    const over: { name: string; two: number; three: number }[] = [];
    for (const { surface: s, count, research } of FIVE) {
      expect(s.regions.length, s.name).toBe(count);
      const two = await costOf(s, { slots: 2 });
      const three = await costOf(s, { slots: 3 });
      // Canonical on the first round: the emitter writes the fixed point.
      const first = await canonical(two.emitted.setup);
      expect(
        first.rounds,
        `${s.name}: the emitted Setup is not canonical`,
      ).toBe(0);
      expect(first.text).toBe(two.emitted.setup);
      over.push({ name: s.name, two: two.setup.used, three: three.setup.used });
      expect(
        three.setup.used - two.setup.used,
        "the third pull-in's price",
      ).toBe(PULL_IN_MAPMODE.length);
      // The Timer is the runtime packed for the surface's own branches
      // beside the sweep (13-15; until then it was the sweep alone at 19),
      // canonical, and it is measured in runtime.spec.ts test 7.
      expect(two.emitted.timer, `${s.name}: the Timer`).toBe(
        packRuntime(two.emitted.branches, { slots: 2 }).timer,
      );
      expect(two.timer.used).toBe(two.emitted.timer.length);
      // The colour corner is the dearest: the surface's own colours never
      // cost more than the corner.
      const own = await measureSurface(
        { ...s, regions: s.regions.map((r) => ({ ...r, colour: [0, 0, 0] })) },
        { slots: 2 },
      );
      expect(own.setup.used).toBeLessThanOrEqual(two.setup.used);
      lines.push(
        `${String(count).padStart(2)} elements: ${two.setup.used} of ${EVENT_BUDGET} ` +
          `(${two.setup.free} free) at two slots, ${three.setup.used} at three; ` +
          `room for ${two.roomFor} more (${two.roomLimit})` +
          (research === undefined
            ? ""
            : `; the research's ${research} (${two.setup.used - research >= 0 ? "+" : ""}${two.setup.used - research})`),
      );
      if (PINNED[count] > 0) {
        expect(two.setup.used, `${s.name}: the pinned figure moved`).toBe(
          PINNED[count],
        );
      }
    }
    // The same sixteen with the literals a visitor most likely types: one-
    // and two-digit controllers on channel 1, still at the colour corner.
    const typed: Surface = {
      ...SIXTEEN,
      regions: SIXTEEN.regions.map((r, i) => ({ ...r, cc: i + 1, channel: 1 })),
    };
    const plain = await costOf(typed, { slots: 2 });
    const plainThree = await costOf(typed, { slots: 3 });
    lines.push(
      `16 elements at cc 1..16 on channel 1: ${plain.setup.used} at two slots, ` +
        `${plainThree.setup.used} at three`,
    );
    console.log(
      ["The five costs, measured at the picker corner:", ...lines].join("\n"),
    );
    for (const { name, two, three } of over) {
      expect(
        two,
        `${name}: ${two} of ${EVENT_BUDGET} at two slots`,
      ).toBeLessThanOrEqual(EVENT_BUDGET);
      expect(
        three,
        `${name}: ${three} of ${EVENT_BUDGET} at three slots`,
      ).toBeLessThanOrEqual(EVENT_BUDGET);
    }
    // The dearest sixteen measure 882 at two slots and 897 at three, both
    // inside 908; the cap at the dearest literals is SIXTEEN at two slots.
    // At three, `roomFor`'s floor from twelve says fifteen: its
    // representative is a 1 x 6 fader at cc 127, dearer in M than the 1 x 2
    // buttons the sixteen carry, and the fourth one tips 908 by the second
    // pull-in's fifteen characters - the meter errs on the floor. 13-14
    // measured 922 before the geometry numbers moved into the kind's frame;
    // 13-15-SUMMARY.md closes the finding with the arithmetic.
    const sixteen = over.find((o) => o.name === SIXTEEN.name);
    expect(sixteen?.two, "the dearest sixteen").toBe(882);
    expect(sixteen?.three).toBe(897);
    const twelve = await costOf(TWELVE, { slots: 2 });
    expect(
      [12 + twelve.roomFor, twelve.roomLimit],
      "the cap at the dearest literals, two slots",
    ).toEqual([16, "cap"]);
    const twelveThree = await costOf(TWELVE, { slots: 3 });
    expect(
      [12 + twelveThree.roomFor, twelveThree.roomLimit],
      "the cap at the dearest literals, three slots (the floor)",
    ).toEqual([15, "budget"]);
    expect(
      plain.setup.used,
      "sixteen at typed literals fit",
    ).toBeLessThanOrEqual(EVENT_BUDGET);
    expect(plainThree.setup.used).toBeLessThanOrEqual(EVENT_BUDGET);
    // The parts the research measured alone: `M` at 165 and a four-row
    // table at 141.
    const four = emitSurface(PAGE3);
    const mAlone = await canonical(four.parts.cellMap);
    const jAlone = await canonical(four.parts.regionTable);
    // Pinned: M 169 (the research's 165, +4 for `[0]=`), J at four rows at
    // the corner 155 (the research's 141; 13-14's 152 carried raw spans, and
    // a knob row now carries its value and remainder), the paint 101.
    expect([mAlone.cost, jAlone.cost, four.parts.paint.length]).toEqual([
      169, 155, 101,
    ]);
    console.log(
      `M alone ${mAlone.cost} (the research's 165); J at four rows ${jAlone.cost} ` +
        `(the research's 141); the paint ${four.parts.paint.length}; ` +
        `the pull-in ${PULL_IN_TIMER.length} / ${PULL_IN_TIMER.length + PULL_IN_MAPMODE.length}; ` +
        `the callback ${four.parts.callback.length}; the marker ${MARKER.length}`,
    );
  });

  it("2. proves dead-branch elimination by a measured pair: four faders with and without the other three branches", async () => {
    const lean = await measureSurface(atPickerCorner(FOUR_FADERS), {
      runtime: "inline",
    });
    const fourBranches = BRANCHES.filter((b) => b !== "knob") as Branch[];
    const fat = await measureSurface(atPickerCorner(FOUR_FADERS), {
      runtime: "inline",
      branches: fourBranches,
    });
    expect(lean.emitted.branches).toEqual(["fader-v"]);
    expect(fat.emitted.branches).toEqual(fourBranches);
    const saving = fat.setup.used - lean.setup.used;
    console.log(
      `Dead branches: four vertical faders inline at ${lean.setup.used} with the fader branch alone, ` +
        `${fat.setup.used} with all four branches - a saving of ${saving} ` +
        `(the research's pair 697 / 1,166, a saving of 469). ` +
        `The split's data half for the same surface: ${(await measureSurface(atPickerCorner(FOUR_FADERS))).setup.used}.`,
    );
    // The saving is the text of the three branches that were not emitted:
    // real, and large. A negative check that emits all four for a
    // fader-only surface collapses it to 0 and fails here by name.
    expect(
      saving,
      "eliminating three dead branches saves nothing",
    ).toBeGreaterThan(200);
    // Pinned, this tree, 2026-09-12: 805 / 1,333, a saving of 528 (the
    // research's 697 / 1,166 / 469; 13-14's 806 / 1,341 / 535 with the raw
    // spans, before the inline branches read the calibrated axis); the
    // split's data half for the same four faders 456 (13-14's 452). The
    // inline four faders FIT (103 free), which is the contingency the plan
    // retains; the split is chosen because the inline form has no Knob and
    // no room for one.
    expect([lean.setup.used, fat.setup.used, saving]).toEqual([805, 1333, 528]);
    expect((await measureSurface(atPickerCorner(FOUR_FADERS))).setup.used).toBe(
      456,
    );
    expect(lean.setup.used).toBeLessThanOrEqual(EVENT_BUDGET);
    for (const text of [lean.emitted.setup, fat.emitted.setup]) {
      expect(GridScript.checkSyntax(text)).toBe(true);
      expect((await canonical(text)).rounds).toBe(0);
    }
    // A Knob has no inline branch: the rotary is 13-15's.
    expect(() => emitSurface(PAGE3, { runtime: "inline" })).toThrow(/Knob/);
  });

  it("3. renders M with exactly 81 entries, each 0 or a valid row index, equal to geometry.ts's map cell for cell", () => {
    for (const { surface: s } of FIVE) {
      const emitted = emitSurface(s);
      const built = buildCellMap(s.regions);
      expect(built.ok).toBe(true);
      if (!built.ok) return;
      const numbers = emitted.parts.cellMap
        .replace(/^M=\{\[0\]=/, "")
        .replace(/\}$/, "")
        .split(",")
        .map((n) => Number.parseInt(n, 10));
      expect(numbers.length, s.name).toBe(SURFACE_CELLS);
      expect(numbers, `${s.name}: M is geometry.ts's map`).toEqual([
        ...built.map,
      ]);
      expect(emitted.map).toBe(
        built.map.length === 81 ? emitted.map : built.map,
      );
      for (const n of numbers) {
        expect(
          Number.isInteger(n) && n >= 0 && n <= s.regions.length,
          `${s.name}: ${n}`,
        ).toBe(true);
      }
      // Every region's cells carry its index and nothing else does.
      s.regions.forEach((r, index) => {
        const cells = new Set<number>();
        for (let row = r.row; row < r.row + r.h; row += 1) {
          for (let col = r.col; col < r.col + r.w; col += 1)
            cells.add(cellIndex(col, row));
        }
        numbers.forEach((n, cell) => {
          expect(n === index + 1, `${s.name}: ${r.name} at cell ${cell}`).toBe(
            cells.has(cell),
          );
        });
      });
      // One row per region, eleven numbers each, at their exact width.
      expect(emitted.parts.regionTable).toBe(renderRegionTable(s.regions));
      expect(emitted.parts.cellMap).toBe(renderCellMap(built.map));
      for (const r of s.regions) {
        const row = regionRow(r);
        // Eleven columns, and a knob's value and remainder make thirteen.
        expect(row.length).toBe(r.kind === "knob" ? 13 : 11);
        expect(emitted.parts.regionTable).toContain(`{${row.join(",")}}`);
        expect(row[7], "the wire channel").toBe(r.channel - 1);
        expect(row.slice(8, 11), "the corner's bytes").toEqual([255, 255, 255]);
      }
    }
    // The geometry is precomputed in the kind's frame (13-15, emit.ts
    // section 2): a vertical fader reads nothing on x, its bottom LED (row
    // 5) sits at 320 on the calibrated axis and its LED span is 320.
    const filter = regionRow(PAGE3.regions[0]);
    expect(filter.slice(0, 4)).toEqual([0, 0, 320, 320]);
    expect(filter[4], "a vertical fader is type 1").toBe(1);
    expect(
      regionRow({ ...PAGE3.regions[0], orientation: "horizontal" })[4],
    ).toBe(2);
    expect(
      regionRow(PAGE3.regions[1]).slice(4, 7),
      "an XY pad carries its second CC",
    ).toEqual([4, 102, 103]);
    expect(
      regionRow({ ...PAGE3.regions[3], latch: true }).slice(4, 7),
      "a latching button's flag",
    ).toEqual([3, 102, 1]);
    // An overlapping surface has no map and cannot be emitted.
    expect(() =>
      emitSurface(
        surface("Bad", [PAGE3.regions[0], { ...PAGE3.regions[1], col: 1 }]),
      ),
    ).toThrow(/overlaps/);
  });

  it("4. passes both class gates over the emitted text with the gates' own needles, and emits no decay", () => {
    const texts: { name: string; text: string }[] = [];
    for (const { surface: s } of FIVE) {
      const split = emitSurface(s);
      texts.push({ name: `${s.name} split Setup`, text: split.setup });
      texts.push({ name: `${s.name} split Timer`, text: split.timer });
    }
    const fourBranches = BRANCHES.filter((b) => b !== "knob") as Branch[];
    texts.push({
      name: "four faders inline (all four branches)",
      text: emitSurface(FOUR_FADERS, {
        runtime: "inline",
        branches: fourBranches,
      }).setup,
    });
    texts.push({
      name: "eight inline (its own branches)",
      text: emitSurface(EIGHT, { runtime: "inline" }).setup,
    });

    let ended = 0;
    let started = 0;
    const problems: string[] = [];
    for (const { name, text } of texts) {
      for (const chain of scan(text)) {
        chain.members.forEach((member, i) => {
          if (!isEndedOpener(member)) return;
          ended += 1;
          if (endedEscapes(chain, i)) return;
          problems.push(
            F(
              '"this contact ended" is written `',
              V,
              EQ,
              "3 ",
              OR,
              " ",
              V,
              GE,
              "5 ",
              AND,
              " ",
              V,
              LT,
              "9`; ",
            ) + `${name} writes \`${branchTextOf(text, chain)}\``,
          );
        });
        if (!isOnsetChain(chain)) continue;
        started += 1;
        if (startedAdmits(chain)) continue;
        problems.push(
          F(
            '"this contact started" is written `',
            V,
            EQ,
            "4 ",
            OR,
            " ",
            V,
            GT,
            "8`; ",
          ) + `${name} writes \`${branchTextOf(text, chain)}\``,
        );
      }
      // The class-A gate (decay-idiom.spec.ts) reads `glpfs` pairs; this
      // emitter writes none, on purpose - a region's paint is a colour and
      // a resting phase, and every decay is the runtime's (13-15) or the
      // library's `D`. Asserted so the gate's silence is a fact and not a
      // blind spot: 12.1-09 records that the gate is blind to `D(` and `K(`.
      expect(text, `${name}: a decay appeared`).not.toContain(F("glp", "fs("));
      expect(text, `${name}: a decay appeared`).not.toContain(F("D", "("));
      expect(text, `${name}: a stamp appeared`).not.toContain(F("K", "("));
    }
    expect(problems.join("\n\n")).toBe("");
    // NON-VACUITY: the split data half carries no event-code test at all
    // (the runtime's are in the Timer, runtime.spec.ts test 6 reads them
    // with the same needles), so the ended count comes from the inline
    // texts - and there is exactly one live test and one onset per inline
    // callback, plus the closing `e>8`.
    expect(ended, "the scan found no 'contact ended' opener to check").toBe(0);
    // One onset per inline callback and one per split Timer, which carries
    // the runtime's entry since 13-15: five split surfaces and two inline.
    expect(started, "the scan found 'contact started' guards").toBe(7);
    const inline = texts[texts.length - 1].text;
    const live = F(
      V,
      "~",
      "=1 ",
      AND,
      " ",
      V,
      "~",
      "=4 ",
      AND,
      " ",
      V,
      LT,
      "9",
    );
    expect(inline.split(live).length - 1, "one live test").toBe(1);
    expect(
      inline.split(F(V, EQ, "4 ", OR, " ", V, GT, "8")).length - 1,
      "one onset",
    ).toBe(1);
    // Expiry on both paths: the end code hands the contact to E, and the
    // Timer's sweep X does the same for a lost lift; R is defined so both
    // release through it.
    expect(inline).toContain("then E(s,i)return end");
    expect(inline).toMatch(/^--\[\[@cb\]\]J=/);
    expect(inline).toContain("R=function(s,i)");
    expect(emitSurface(EIGHT, { runtime: "inline" }).timer).toBe(
      MARKER + "X(self,20)",
    );
    // Nothing built on code 9 staying live: after its onset a 9 is ended in
    // the same pass.
    expect(inline).toContain(F("if ", V, GT, "8 then E(s,i)end end"));
  });

  it("5. passes checkSyntax on every surface, defines no library name, and calls only names the library exports", () => {
    // THE LIBRARY'S EXPORT LIST, AS 12.1-08b-SUMMARY.md RECORDS IT: twenty-one
    // names - U W E Q X N and the eight state names in 255/0, V G Z Y K A D in
    // 255/6. Asserted against `LIBRARY_GLOBALS` as exported, so the test
    // reads the tree AND the document and says which moved.
    const summary = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "G",
      "H",
      "K",
      "KX",
      "KY",
      "L",
      "N",
      "P",
      "Q",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
    expect(
      [...LIBRARY_GLOBALS],
      "library.ts's exported names differ from 12.1-08b-SUMMARY.md's twenty-one",
    ).toEqual(summary);
    expect([...LIBRARY_CONVENTIONS]).toEqual(["R"]);
    const exported = new Set([...LIBRARY_GLOBALS, ...LIBRARY_CONVENTIONS]);

    const cases: {
      name: string;
      text: string;
      own: readonly string[];
      calls: string[];
    }[] = [];
    for (const { surface: s } of FIVE) {
      const split = emitSurface(s, { slots: 3 });
      cases.push({
        name: `${s.name} split`,
        text: split.setup,
        own: OWN_NAMES_SPLIT,
        calls: [],
      });
    }
    for (const s of [FOUR_FADERS, EIGHT]) {
      const inline = emitSurface(s, { runtime: "inline" });
      cases.push({
        name: `${s.name} inline`,
        text: inline.setup,
        own: OWN_NAMES_INLINE,
        // `U` since 13-15: the inline branches read the calibrated axis.
        calls: ["E", "N", "U"],
      });
      cases.push({
        name: `${s.name} inline Timer`,
        text: inline.timer,
        own: [],
        calls: ["X"],
      });
    }
    for (const { name, text, own, calls } of cases) {
      expect(
        GridScript.checkSyntax(text),
        `${name}: the pinned checker refuses the text`,
      ).toBe(true);
      const defined = capitalDefinitions(text);
      // Nothing this emitter defines is a library name: `G`, `Y`, `Z` and
      // `S`, `N`, `K` are the ones a reader of the plan or 13-02's sketch
      // would reach for, and every one of them is the library's now.
      // `R` is the one name an entry is MEANT to define (library.ts section
      // 5, the release convention), so the check is against the globals.
      for (const d of defined) {
        expect(
          LIBRARY_GLOBALS.includes(d),
          `${name} defines ${d}, which the library owns`,
        ).toBe(false);
      }
      expect(defined, `${name}: its own names`).toEqual([...own].sort());
      // The capital names it CALLS, minus its own, EQUAL the expected set -
      // and every one of them is exported. A call to a function the library
      // dropped (`F`) fails here by name.
      // NOT filtered by the emitter's own names: none of them is a function
      // it calls (`R` is defined for the library to call), so every capital
      // call site must be the library's. A first draft filtered them and was
      // blind to `F(` because `F` is also the inline form's last-sent table.
      const called = capitalCalls(text);
      expect(called, `${name}: the library names it calls`).toEqual(
        [...calls].sort(),
      );
      for (const c of called) {
        expect(
          exported.has(c),
          `${name} calls ${c}, which the library does not export`,
        ).toBe(true);
      }
    }
    // The split installs 13-15's entry after both pull-ins ran, and names
    // the runtime entry nowhere else.
    const split = emitSurface(PAGE3, { slots: 3 }).setup;
    expect(
      split.endsWith(
        PULL_IN_TIMER + PULL_IN_MAPMODE + `self.touch_cb=${RUNTIME_ENTRY}`,
      ),
    ).toBe(true);
    expect(
      emitSurface(PAGE3).setup.endsWith(
        PULL_IN_TIMER + `self.touch_cb=${RUNTIME_ENTRY}`,
      ),
    ).toBe(true);
    expect(emitSurface(PAGE3).setup).not.toContain(PULL_IN_MAPMODE);
  });

  it("6. the surface's brightness (change 5): every colour in J scaled by max(1, floor(v*b/255)), the runtime's Timer and 255/4 untouched, 255 and an absent field byte-identical, the meter the picker corner at full, the landing the scaled Setup, never longer", async () => {
    const dim = withBrightness(PAGE3, 128);
    expect(dim.brightness).toBe(128);
    expect(withBrightness(PAGE3, 255), "255 is the field's absence").toBe(
      PAGE3,
    );
    expect(withBrightness(dim, 255)).not.toHaveProperty("brightness");
    // The rows: the three colour columns scaled, everything else the same.
    for (const r of PAGE3.regions) {
      const full = regionRow(r);
      const half = regionRow(r, 128);
      expect(half.slice(0, 8)).toEqual(full.slice(0, 8));
      expect(half.slice(8, 11)).toEqual(
        r.colour.map((level) => scaleChannel(colourByte(level), 128)),
      );
      expect(half.slice(8, 11), "the corner at 128").toEqual([128, 128, 128]);
      expect(regionRow(r, 255)).toEqual(full);
    }
    const one = regionRow({ ...PAGE3.regions[0], colour: [1, 0, 15] }, 1);
    expect(one.slice(8, 11), "a lit level stays lit at 1; 0 stays 0").toEqual([
      1, 0, 1,
    ]);
    // The emitted strings: J moves, nothing else does.
    const full = emitSurface(PAGE3, { slots: 3 });
    const half = emitSurface(dim, { slots: 3 });
    expect(emitSurface(withBrightness(PAGE3, 255), { slots: 3 }).setup).toBe(
      full.setup,
    );
    expect(half.parts.regionTable).toBe(renderRegionTable(PAGE3.regions, 128));
    expect(half.parts.regionTable).not.toBe(full.parts.regionTable);
    expect(half.parts.cellMap).toBe(full.parts.cellMap);
    expect(half.parts.paint).toBe(full.parts.paint);
    expect(half.timer, "the runtime carries no colour").toBe(full.timer);
    expect(half.mapmode).toBe(full.mapmode);
    expect(half.setup.length).toBeLessThanOrEqual(full.setup.length);
    expect(
      half.setup.replace(half.parts.regionTable, full.parts.regionTable),
    ).toBe(full.setup);
    // The landing: the meter is the corner at full brightness (the bound), the strings are the surface's.
    const landed = await landSurface(dim, { slots: 3 });
    const landedFull = await landSurface(PAGE3, { slots: 3 });
    expect(
      landed.measured.setup.used,
      "the meter measures the corner at full",
    ).toBe(landedFull.measured.setup.used);
    expect(landed.config.setup).toBe((await canonical(half.setup)).text);
    expect(landed.config.setup).not.toBe(landedFull.config.setup);
    expect(landed.config.timer).toBe(landedFull.config.timer);
    expect(landed.config.systemUtility).toBe(landedFull.config.systemUtility);
    expect(landed.config.setup.length).toBeLessThanOrEqual(
      landedFull.config.setup.length,
    );
    expect(
      atPickerCorner(dim),
      "the corner drops the field",
    ).not.toHaveProperty("brightness");
    expect(GridScript.checkSyntax(half.setup)).toBe(true);
  });

  it("7. the blank kind (change 10A): paint only - its row is the colour alone, its cells negated in M, the paint's fallback added once; a finger on it sends nothing and draws nothing while a fader beside it still does; measured, canonical, and a surface without one byte-identical", async () => {
    // The same page 3 with a 2 x 2 blank in a free corner (cols 7-8, rows
    // 7-8) and a 1 x 1 in another (col 0, row 8).
    const blank = region("Wash", "blank", 7, 7, 2, 2, { cc: 0, channel: 1 });
    const dot = region("Dot", "blank", 0, 8, 1, 1, { cc: 0, channel: 1 });
    const withBlanks = surface("Page 3 and blanks", [
      ...PAGE3.regions,
      blank,
      dot,
    ]);
    const plain = emitSurface(PAGE3, { slots: 3 });
    const painted = emitSurface(withBlanks, { slots: 3 });

    // THE FORM. A blank's row carries the colour at columns nine to eleven
    // and nothing else; the other rows are exactly what they were; M carries
    // the blanks' indices negated (5 and 6 here) on their cells and nothing
    // else moved; the paint gained the one fallback; the runtime is untouched.
    expect(blankRow(blank)).toBe("{[9]=255,[10]=255,[11]=255}");
    expect(blankRow({ ...blank, colour: [1, 0, 15] }, 128)).toBe(
      `{[9]=${scaleChannel(17, 128)},[10]=${scaleChannel(0, 128)},[11]=${scaleChannel(255, 128)}}`,
    );
    expect(() => regionRow(blank)).toThrow(/paint/);
    expect(painted.parts.regionTable).toBe(
      `${plain.parts.regionTable.slice(0, -1)},${blankRow(blank)},${blankRow(dot)}}`,
    );
    expect([...blankIndices(withBlanks.regions)]).toEqual([5, 6]);
    const numbers = painted.parts.cellMap
      .replace(/^M=\{\[0\]=/, "")
      .replace(/\}$/, "")
      .split(",")
      .map((n) => Number.parseInt(n, 10));
    expect(numbers.length).toBe(SURFACE_CELLS);
    const blankCells = new Set([
      cellIndex(7, 7),
      cellIndex(8, 7),
      cellIndex(7, 8),
      cellIndex(8, 8),
    ]);
    numbers.forEach((n, cell) => {
      if (blankCells.has(cell)) expect(n, `cell ${cell}`).toBe(-5);
      else if (cell === cellIndex(0, 8)) expect(n).toBe(-6);
      else expect(n, `cell ${cell}`).toBe(painted.map[cell]);
    });
    expect(
      [...painted.map].every((n) => n >= 0),
      "the emitted map is still geometry.ts's, unsigned",
    ).toBe(true);
    expect(painted.parts.paint).toBe(
      plain.parts.paint.replace("J[M[n]]if", "J[M[n]]or J[-M[n]]if"),
    );
    expect(painted.parts.paint.length - plain.parts.paint.length).toBe(11);
    expect(painted.timer, "the runtime is untouched").toBe(plain.timer);
    expect(painted.mapmode).toBe(plain.mapmode);
    expect(painted.branches).toEqual(plain.branches);
    // A surface WITHOUT a blank emits byte for byte what it did: the
    // fallback is only rendered when a blank exists.
    expect(plain.parts.paint).not.toContain("J[-M[n]]");
    expect(renderCellMap(painted.map), "no blanks named: nothing negated").toBe(
      painted.parts.cellMap.replaceAll("-", ""),
    );

    // MEASURED, under the pinned minifier at the picker corner: canonical
    // on the first round, and the price of the two blanks is the two rows,
    // their two separators, the fallback, and one character - the minus
    // sign - for every cell the blanks cover (five here).
    const before = await costOf(PAGE3, { slots: 3 });
    const after = await costOf(withBlanks, { slots: 3 });
    expect((await canonical(painted.setup)).rounds).toBe(0);
    expect(GridScript.checkSyntax(painted.setup)).toBe(true);
    const price =
      blankRow(blank).length +
      1 +
      blankRow(dot).length +
      1 +
      "or J[-M[n]]".length +
      (blank.w * blank.h + dot.w * dot.h);
    expect(after.setup.used - before.setup.used).toBe(price);
    expect(after.timer.used).toBe(before.timer.used);
    expect(after.fits).toBe(true);
    console.log(
      `page 3 ${before.setup.used} -> with a 2 x 2 blank and a 1 x 1 blank ${after.setup.used} at three slots (+${price}: two rows of ${blankRow(blank).length}, two commas, the fallback 11, five minus signs in M); the Timer ${after.timer.used}`,
    );

    // IN THE VM: the rest frame paints the blank's cells in its colour on
    // layer 1; a finger on the blank sends nothing and the frame does not
    // move (nothing on layer 2); the same finger on Filter beside it sends
    // and moves the frame - the runtime is alive, it is the blank it ignores.
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: `self.tim=__hangar_timer ele={{map=function(s)${painted.mapmode} end}}${painted.setup}`,
      timer: painted.timer,
    });
    try {
      host.tick();
      const rest = Uint8Array.from(sim.frame);
      const px = (col: number, row: number) => {
        const i = cellIndex(col, row) * 3;
        return [rest[i], rest[i + 1], rest[i + 2]];
      };
      // The blank's four cells and the dot are lit alike (the same corner
      // colour at the rest phase); an empty cell is dark.
      expect(px(7, 7)).toEqual(px(8, 8));
      expect(px(0, 8)).toEqual(px(7, 7));
      expect(Math.max(...px(7, 7))).toBeGreaterThan(0);
      expect(px(6, 8)).toEqual([0, 0, 0]);
      // A finger on the blank: a press, a move inside it, a lift.
      host.touchDown(0, KX[7], KY[7]);
      host.tick();
      host.touchMove(0, KX[8], KY[8]);
      host.tick();
      expect(host.midi, "a blank sends nothing").toEqual([]);
      expect(
        Uint8Array.from(sim.frame),
        "a finger on a blank draws nothing",
      ).toEqual(rest);
      host.touchUp(0, KX[8], KY[8]);
      host.tick();
      expect(Uint8Array.from(sim.frame)).toEqual(rest);
      // The same finger on Filter: a value, and the frame moves.
      host.touchDown(1, KX[1], KY[1]);
      host.tick();
      expect(host.midi.length, "the fader beside it still sends").toBe(1);
      expect(Uint8Array.from(sim.frame)).not.toEqual(rest);
      host.touchUp(1, KX[1], KY[1]);
      host.run(25);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  });
});
