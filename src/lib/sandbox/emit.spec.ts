// The emitter's tests (13-14 task 02; change 10B added the eighth and moved the figures, change 11 the ninth, change 18 the tenth): the
// costs at the picker corner under two, three and five slots, the dead-branch pair, the map and
// the rows, both class gates, the library's names, the brightness, the blank, and the change 10B
// tail with the five-slot pack and the cap floor, and Latch's channel-word bit. Each loops over its surfaces and names the
// surface in its message.
//
// EVERY FIGURE HERE IS MEASURED IN THIS TREE under the pinned `GridScript.compressScript` after
// `padReady()`, `max(compressed, raw)`, canonical, at the RGB444 picker corner (every region at
// `255,255,255`) - lua-entries.sweep.spec.ts test 1's rule through cost.ts; a minifier bump or an
// emitter edit that moves one moves the assertion. The five surfaces, controllers at three
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
  EQ,
  F,
  GT,
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
  representativeRegion,
} from "./cost";
import {
  MARKER,
  OWN_NAMES,
  PULL_IN_MAPMODE,
  PULL_IN_TIMER,
  RUNTIME_ENTRY,
  TAIL_DEFAULTS,
  type Emitted,
  blankIndices,
  blankRow,
  capitalCalls,
  capitalDefinitions,
  emitSurface,
  knobCentre,
  regionRow,
  regionTail,
  renderCellMap,
  renderRegionTable,
} from "./emit";
import { buildCellMap } from "./geometry";
import { LANDING_SLOTS, landSurface } from "./land";
import { TRIMMED_LIBRARY, TRIMMED_LIBRARY_TIMER } from "./library-trim";
import {
  BRANCH_TEXT,
  ENTRY,
  HAND_OVER_TEXT,
  MULTITOUCH_TEXT,
  RELEASE,
  SETUP_STATE,
  TAIL_DEFAULTS_LOOP,
  TAIL_DEFAULTS_LUA,
  packRuntime,
  receivePart,
  type SlotCount,
} from "./runtime";
import {
  BRANCHES,
  PICKER_CORNER,
  SURFACE_CELLS,
  TOUCHES_COLUMN_STEP,
  TOUCHES_MAX,
  ccCeiling,
  cellIndex,
  channelWord,
  colourByte,
  emptySurface,
  fingerController,
  flagsOf,
  HAND_OVER_BIT,
  hasMultitouch,
  maxOf,
  minOf,
  seventhOf,
  touchesOf,
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

/** Page 3 with every change 10B option on at its widest literal (test 8). */
const PAGE3_OPTIONS = surface("Page 3 options", [
  {
    ...PAGE3.regions[0],
    min: 127,
    max: 100,
    mode: "relative",
    speed: "full",
    spring: true,
    springValue: 100,
  },
  { ...PAGE3.regions[1], min: 127, max: 100, mode: "relative", speed: "full" },
  { ...PAGE3.regions[2], min: 127, max: 100, mode: "relative-sign" },
  {
    ...PAGE3.regions[3],
    min: 127,
    max: 100,
    latch: true,
    output: "note",
    group: 8,
  },
]);

/** Page 3 with its pad at three fingers (test 9, change 11): the multitouch variant's one page-3 shape that fits - without the knob. */
const PAGE3_TOUCHES = surface("Page 3 touches", [
  PAGE3.regions[0],
  { ...PAGE3.regions[1], touches: 3 },
  PAGE3.regions[3],
]);

const FIVE: readonly { surface: Surface; count: number; research?: number }[] =
  [
    { surface: ONE, count: 1 },
    { surface: PAGE3, count: 4, research: 366 },
    { surface: EIGHT, count: 8, research: 498 },
    { surface: TWELVE, count: 12, research: 652 },
    { surface: SIXTEEN, count: 16, research: 811 },
  ];

const SLOT_COUNTS: readonly SlotCount[] = [2, 3, 5];

/** The number strings of an emitted `M`. */
const mapNumbers = (cellMap: string): number[] =>
  cellMap
    .replace(/^M=\{\[0\]=/, "")
    .replace(/\}$/, "")
    .split(",")
    .map((n) => Number.parseInt(n, 10));

describe("the Sandbox emitter (BUILD-01, BUILD-02, BUILD-03, CONT-02)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("1. costs one, four, eight, twelve and sixteen elements at the picker corner under two, three and five slots: every Setup under 908, the dearest sixteen's finding still closed, the cap floor with every option on named", async () => {
    const lines: string[] = [];
    const setups: { name: string; two: number; five: number }[] = [];
    for (const { surface: s, count, research } of FIVE) {
      expect(s.regions.length, s.name).toBe(count);
      const two = await costOf(s, { slots: 2 });
      const three = await costOf(s, { slots: 3 });
      const five = await costOf(s, { slots: 5 });
      // Canonical on the first round: the emitter writes the fixed point.
      const first = await canonical(two.emitted.setup);
      expect(
        first.rounds,
        `${s.name}: the emitted Setup is not canonical`,
      ).toBe(0);
      expect(first.text).toBe(two.emitted.setup);
      setups.push({ name: s.name, two: two.setup.used, five: five.setup.used });
      // The Setup is the same text under three and five slots (both pull
      // 255/4 in) but for the contact tables, which five slots make in the
      // trimmed 255/0 (change 17), and unless five slots put runtime parts in
      // it (the Setup is the packer's last slot); the third pull-in's price is the second call.
      if (!five.emitted.runtime.placement.some((p) => p.slot === "setup"))
        expect(five.setup.used).toBe(three.setup.used - SETUP_STATE.length);
      expect(
        three.setup.used - two.setup.used,
        "the third pull-in's price",
      ).toBe(PULL_IN_MAPMODE.length);
      // The Timer is the runtime packed for the surface's own branches
      // beside the sweep, canonical, and it is measured in runtime.spec.ts.
      expect(two.emitted.timer, `${s.name}: the Timer`).toBe(
        packRuntime(two.emitted.branches, {
          slots: 2,
          receive: two.emitted.receive,
        }).timer,
      );
      expect(two.timer.used).toBe(two.emitted.timer.length);
      // The colour corner is the dearest: the surface's own colours never
      // cost more than the corner - across its five strings, since the
      // Setup may carry runtime parts (change 17) and a cheaper J leaves it
      // room for another.
      const own = await measureSurface(
        { ...s, regions: s.regions.map((r) => ({ ...r, colour: [0, 0, 0] })) },
        { slots: 5 },
      );
      const allFive = (m: typeof own) =>
        m.setup.used +
        m.timer.used +
        (m.mapmode?.used ?? 0) +
        (m.system?.used ?? 0) +
        (m.systemTimer?.used ?? 0);
      expect(allFive(own)).toBeLessThanOrEqual(allFive(five));
      lines.push(
        `${String(count).padStart(2)} elements: Setup ${two.setup.used} of ${EVENT_BUDGET} ` +
          `(${two.setup.free} free) at two slots, ${five.setup.used} at five; ` +
          `five slots ${five.fits ? "fit" : "do not fit"}, room for ${five.roomFor} more (${five.roomLimit})` +
          (research === undefined
            ? ""
            : `; the research's ${research} (${two.setup.used - research >= 0 ? "+" : ""}${two.setup.used - research})`),
      );
      expect(two.setup.used, `${s.name}: the pinned Setup moved`).toBe(
        PINNED.setups[count],
      );
      // Two slots carry no runtime at all since change 10B (runtime.spec.ts
      // test 7); five carry every surface here.
      expect(two.fits, `${s.name} on two slots`).toBe(false);
      expect(five.fits, `${s.name} on five slots`).toBe(true);
    }
    // The same sixteen with the literals a visitor most likely types: one-
    // and two-digit controllers on channel 1, still at the colour corner.
    const typed: Surface = {
      ...SIXTEEN,
      regions: SIXTEEN.regions.map((r, i) => ({ ...r, cc: i + 1, channel: 1 })),
    };
    const plain = await costOf(typed, { slots: 5 });
    lines.push(
      `16 elements at cc 1..16 on channel 1: Setup ${plain.setup.used} at five slots`,
    );
    for (const { name, two, five } of setups) {
      expect(two, `${name}: ${two} of ${EVENT_BUDGET}`).toBeLessThanOrEqual(
        EVENT_BUDGET,
      );
      expect(five, `${name}: ${five} of ${EVENT_BUDGET}`).toBeLessThanOrEqual(
        EVENT_BUDGET,
      );
    }
    // The dearest sixteen at their defaults still fit (the box columns are
    // narrower than the frame 13-15 carried, the tail is omitted at the
    // defaults); the cap at the dearest literals from twelve.
    const sixteen = setups.find((o) => o.name === SIXTEEN.name);
    expect(sixteen?.five, "the dearest sixteen at five slots").toBe(
      PINNED.sixteenFive,
    );
    const twelve = await costOf(TWELVE, { slots: 5 });
    lines.push(
      `the cap from twelve with the dearest option-laden fader: ${12 + twelve.roomFor} (${twelve.roomLimit})`,
    );
    expect(
      [12 + twelve.roomFor, twelve.roomLimit],
      "the cap floor from twelve, five slots",
    ).toEqual(PINNED.capFromTwelve);
    // THE FLOOR THE USER NO LONGER SEES: from an empty surface, how many of
    // the dearest fader - cc 127, channel 16, the corner, min 127, max 100,
    // relative at full with the spring at 100 - fit before a string is over.
    const floor = await costOf(emptySurface("floor", "Floor"), { slots: 5 });
    lines.push(
      `the cap floor with every option on, from empty: ${floor.roomFor} elements (${floor.roomLimit})`,
    );
    expect([floor.roomFor, floor.roomLimit]).toEqual(PINNED.floorFromEmpty);
    expect(representativeRegion(1, 0, 0, { w: 1, h: 1 })).toMatchObject({
      min: 127,
      max: 100,
      mode: "relative",
      speed: "full",
      spring: true,
      springValue: 100,
      output: "pressure",
      receive: false,
      latchTouch: false,
    });
    // Change 17: the dearest channel word, a channel pressure on 16 with Receive off (175); change
    // 18: and Latch Off, 512 more - three digits still.
    expect(regionRow(representativeRegion(1, 0, 0, { w: 1, h: 2 }))[7]).toBe(
      687,
    );
    expect(regionTail(representativeRegion(1, 0, 0, { w: 1, h: 2 }))).toEqual([
      127, 100, 7, 123,
    ]);
    // The parts the research measured alone: `M` at 165 and a four-row
    // table at 141.
    const four = emitSurface(PAGE3);
    const mAlone = await canonical(four.parts.cellMap);
    const jAlone = await canonical(four.parts.regionTable);
    lines.push(
      `M alone ${mAlone.cost} (the research's 165); J at four rows ${jAlone.cost} ` +
        `(the research's 141; 13-15's 155 with the frame); the paint ${four.parts.paint.length} (13-14's 101, plus layer 2's colour); ` +
        `the pull-in ${PULL_IN_TIMER.length} / ${PULL_IN_TIMER.length + PULL_IN_MAPMODE.length}; ` +
        `the callback ${four.parts.callback.length}; the marker ${MARKER.length}`,
    );
    console.log(
      ["The costs, measured at the picker corner (change 10B):", ...lines].join(
        "\n",
      ),
    );
    expect([mAlone.cost, jAlone.cost, four.parts.paint.length]).toEqual(
      PINNED.parts,
    );
  }, 120000);

  it("2. proves dead-branch elimination by a measured pair: four faders' runtime with the fader branch alone and with every branch, through the split; the inline contingency is retired", async () => {
    const lean = await measureSurface(atPickerCorner(FOUR_FADERS), {
      slots: 5,
    });
    const fat = await measureSurface(atPickerCorner(FOUR_FADERS), {
      slots: 5,
      branches: BRANCHES,
    });
    expect(lean.emitted.branches).toEqual(["fader-v"]);
    expect(fat.emitted.branches).toEqual(BRANCHES);
    // The runtime across the four runtime slots and, since change 17, the
    // Setup's share when it carries parts (the data half is the same text;
    // the lean surface carries none there).
    expect(lean.emitted.runtime.placement.some((p) => p.slot === "setup")).toBe(
      false,
    );
    const total = (m: typeof lean) =>
      (m.systemTimer?.used ?? 0) +
      (m.system?.used ?? 0) +
      (m.mapmode?.used ?? 0) +
      m.timer.used +
      (m.setup.used - lean.setup.used);
    const saving = total(fat) - total(lean);
    console.log(
      `Dead branches: four vertical faders' runtime at ${total(lean)} across the four runtime slots with the fader branch alone, ` +
        `${total(fat)} with every branch - a saving of ${saving}; the Setup's data half ${lean.setup.used} either way ` +
        `(the research's inline pair 697 / 1,166 / 469; 13-15's 805 / 1,333 / 528 - the inline contingency went with change 10B).`,
    );
    // The saving is the text of the branches that were not emitted: real,
    // and large. A negative check that emits every branch for a fader-only
    // surface collapses it to 0 and fails here by name.
    expect(saving, "eliminating dead branches saves nothing").toBeGreaterThan(
      200,
    );
    expect([total(lean), total(fat), saving]).toEqual(PINNED.deadBranches);
    expect(fat.emitted.parts.regionTable).toBe(lean.emitted.parts.regionTable);
    expect(fat.emitted.parts.paint).toBe(lean.emitted.parts.paint);
    expect(lean.fits).toBe(true);
    for (const text of [lean.emitted.setup, fat.emitted.setup]) {
      expect(GridScript.checkSyntax(text)).toBe(true);
      expect((await canonical(text)).rounds).toBe(0);
    }
    // No inline contingency: the emitter has one runtime, the split.
    expect(emitSurface(PAGE3).parts.callback).toBe(
      `self.touch_cb=${RUNTIME_ENTRY}`,
    );
  });

  it("3. renders M with exactly 81 entries, each 0 or a valid row index, equal to geometry.ts's map cell for cell, and every row as its box, kind, controllers, channel, colour and tail", () => {
    for (const { surface: s } of FIVE) {
      const emitted = emitSurface(s);
      const built = buildCellMap(s.regions);
      expect(built.ok).toBe(true);
      if (!built.ok) return;
      const numbers = mapNumbers(emitted.parts.cellMap);
      expect(numbers.length, s.name).toBe(SURFACE_CELLS);
      expect(numbers, `${s.name}: M is geometry.ts's map`).toEqual([
        ...built.map,
      ]);
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
      // One row per region, eleven numbers each at their defaults (a knob's
      // tail and centre make sixteen), at their exact width.
      expect(emitted.parts.regionTable).toBe(renderRegionTable(s.regions));
      expect(emitted.parts.cellMap).toBe(renderCellMap(built.map));
      for (const r of s.regions) {
        const row = regionRow(r);
        expect(row.length).toBe(r.kind === "knob" ? 16 : 11);
        expect(emitted.parts.regionTable).toContain(`{${row.join(",")}}`);
        expect(row.slice(0, 4), "the box").toEqual([r.col, r.row, r.w, r.h]);
        expect(row[7], "the wire channel").toBe(r.channel - 1);
        expect(row.slice(8, 11), "the corner's bytes").toEqual([255, 255, 255]);
      }
    }
    // The box (change 10B): a vertical fader's row opens with its cells and
    // its type code 1; horizontal is 2; the XY pad carries its second CC;
    // a button's seventh column is its radio group (0: none).
    const filter = regionRow(PAGE3.regions[0]);
    expect(filter.slice(0, 5)).toEqual([0, 0, 2, 6, 1]);
    expect(
      regionRow({ ...PAGE3.regions[0], orientation: "horizontal" })[4],
    ).toBe(2);
    expect(
      regionRow(PAGE3.regions[1]).slice(4, 7),
      "an XY pad carries its second CC",
    ).toEqual([4, 102, 103]);
    expect(regionRow(PAGE3.regions[3]).slice(4, 7)).toEqual([3, 102, 0]);
    expect(
      regionRow({ ...PAGE3.regions[3], group: 3 }).slice(4, 7),
      "a button's group",
    ).toEqual([3, 102, 3]);
    // A knob's centre is what the forward map gives for its middle LED.
    expect(regionRow(PAGE3.regions[2]).slice(14)).toEqual(
      knobCentre(PAGE3.regions[2]),
    );
    expect(knobCentre(PAGE3.regions[2])).toEqual([64, 83]);
    expect(
      knobCentre({ ...PAGE3.regions[2], w: 4, h: 4, col: 0, row: 0 }),
    ).toEqual([
      Math.floor((KX[1] + KX[2]) / 2),
      Math.floor((KY[1] + KY[2]) / 2),
    ]);
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
      for (const slots of SLOT_COUNTS) {
        const split = emitSurface(s, { slots });
        texts.push({ name: `${s.name} Setup (${slots})`, text: split.setup });
        texts.push({ name: `${s.name} Timer (${slots})`, text: split.timer });
        if (split.mapmode !== undefined)
          texts.push({
            name: `${s.name} 255/4 (${slots})`,
            text: split.mapmode,
          });
        if (split.system !== undefined)
          texts.push({ name: `${s.name} 255/0`, text: split.system });
        if (split.systemTimer !== undefined)
          texts.push({ name: `${s.name} 255/6`, text: split.systemTimer });
      }
    }
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
            `${name}: an ended opener that admits 9: ${branchTextOf(text, chain)}`,
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
      // a resting phase, and every picture is the runtime's plain `glp`.
      expect(text, `${name}: a decay appeared`).not.toContain(F("glp", "fs("));
    }
    expect(problems.join("\n\n")).toBe("");
    // NON-VACUITY: the data half carries no event-code test at all; the
    // runtime's entry carries one onset, once per surface and slot count -
    // wherever the packer put it.
    expect(ended, "the scan found no 'contact ended' opener to check").toBe(0);
    expect(started, "one onset per surface and slot count").toBe(
      FIVE.length * SLOT_COUNTS.length,
    );
    // Expiry on both paths: the end code hands the contact to E, and the
    // Timer's sweep X does the same for a lost lift; R is defined so both
    // release through it.
    const all = texts.map((t) => t.text).join("\n");
    expect(all).toContain("then E(s,i)return end");
    expect(all).toContain("R=function(s,i)");
    expect(all).toContain(F("if ", V, GT, "8 then E(s,i)end end"));
    for (const { text } of texts) expect(text).toMatch(/^--\[\[@cb\]\]/);
  });

  it("5. passes checkSyntax on every surface, defines no library name, calls only names the library exports, and installs the entry after both pull-ins", () => {
    // THE LIBRARY'S EXPORT LIST, AS 12.1-08b-SUMMARY.md RECORDS IT: twenty-one
    // names - untouched by change 10B (library.ts is refused; the Sandbox
    // trims what it LANDS, library-trim.ts).
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
    // The Setup's data half, under three slots: five may add runtime parts to
    // it (change 17), which the runtime's own names test holds (runtime.spec.ts test 6).
    for (const { surface: s } of FIVE) {
      const split = emitSurface(s, { slots: 3 });
      const text = split.setup;
      expect(
        GridScript.checkSyntax(text),
        `${s.name}: the pinned checker refuses the text`,
      ).toBe(true);
      const defined = capitalDefinitions(text);
      // Nothing this emitter defines is a library name: `J` and `M`, and under
      // fewer than five slots the contact tables `S F` (change 17).
      for (const d of defined) {
        expect(
          LIBRARY_GLOBALS.includes(d),
          `${s.name} defines ${d}, which the library owns`,
        ).toBe(false);
      }
      expect(defined, `${s.name}: its own names`).toEqual(
        [...OWN_NAMES, "S", "F"].sort(),
      );
      expect(emitSurface(s, { slots: 5 }).setup).not.toContain(SETUP_STATE);
      // The data half CALLS no capital name: the paint is glag/glc/glp.
      expect(capitalCalls(text), `${s.name}: capital calls`).toEqual([]);
    }
    // The split installs the entry after both pull-ins ran, and names the
    // runtime entry nowhere else; under two slots the Timer's alone.
    const five = emitSurface(PAGE3, { slots: 5 }).setup;
    expect(
      five.endsWith(
        PULL_IN_TIMER + PULL_IN_MAPMODE + `self.touch_cb=${RUNTIME_ENTRY}`,
      ),
    ).toBe(true);
    expect(emitSurface(PAGE3, { slots: 3 }).setup).toContain(SETUP_STATE);
    expect(
      emitSurface(PAGE3).setup.endsWith(
        PULL_IN_TIMER + `self.touch_cb=${RUNTIME_ENTRY}`,
      ),
    ).toBe(true);
    expect(emitSurface(PAGE3).setup).not.toContain(PULL_IN_MAPMODE);
  });

  it("6. the surface's brightness (change 5): every colour in J scaled by max(1, floor(v*b/255)), the runtime's slots untouched, 255 and an absent field byte-identical, the meter the picker corner at full, the landing the scaled Setup, never longer", async () => {
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
      expect(half.slice(11)).toEqual(full.slice(11));
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
    const full = emitSurface(PAGE3, { slots: 5 });
    const half = emitSurface(dim, { slots: 5 });
    expect(emitSurface(withBrightness(PAGE3, 255), { slots: 5 }).setup).toBe(
      full.setup,
    );
    expect(half.parts.regionTable).toBe(renderRegionTable(PAGE3.regions, 128));
    expect(half.parts.regionTable).not.toBe(full.parts.regionTable);
    expect(half.parts.cellMap).toBe(full.parts.cellMap);
    expect(half.parts.paint).toBe(full.parts.paint);
    expect(half.timer, "the runtime carries no colour").toBe(full.timer);
    expect(half.mapmode).toBe(full.mapmode);
    expect(half.system).toBe(full.system);
    expect(half.systemTimer).toBe(full.systemTimer);
    expect(half.setup.length).toBeLessThanOrEqual(full.setup.length);
    expect(
      half.setup.replace(half.parts.regionTable, full.parts.regionTable),
    ).toBe(full.setup);
    // The landing: the meter is the corner at full brightness (the bound), the strings are the surface's.
    const landed = await landSurface(dim);
    const landedFull = await landSurface(PAGE3);
    expect(
      landed.measured.setup.used,
      "the meter measures the corner at full",
    ).toBe(landedFull.measured.setup.used);
    expect(landed.config.setup).toBe((await canonical(half.setup)).text);
    expect(landed.config.setup).not.toBe(landedFull.config.setup);
    expect(landed.config.timer).toBe(landedFull.config.timer);
    expect(landed.config.systemUtility).toBe(landedFull.config.systemUtility);
    expect(landed.config.system).toBe(landedFull.config.system);
    expect(landed.config.systemTimer).toBe(landedFull.config.systemTimer);
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
    // Receive Off on page 3's four (change 17): with every element receiving,
    // page 3's five strings leave 73 characters between them (runtime.spec.ts
    // test 7) and two blanks cost 72 - over with the packing; the blank's own
    // price is the point here, and the runtime without the receive half packs
    // as it did.
    const QUIET = PAGE3.regions.map((r) => ({ ...r, receive: false }));
    const withBlanks = surface("Page 3 and blanks", [...QUIET, blank, dot]);
    const plain = emitSurface(surface("Page 3 quiet", QUIET), { slots: 5 });
    const painted = emitSurface(withBlanks, { slots: 5 });

    // THE FORM. A blank's row carries the colour at columns nine to eleven
    // and nothing else; the other rows are exactly what they were; M carries
    // the blanks' indices negated (5 and 6 here) on their cells and nothing
    // else moved; the paint gained the one fallback; the runtime is untouched.
    expect(blankRow(blank)).toBe("{[9]=255,[10]=255,[11]=255}");
    expect(blankRow({ ...blank, colour: [1, 0, 15] }, 128)).toBe(
      `{[9]=${scaleChannel(17, 128)},[10]=${scaleChannel(0, 128)},[11]=${scaleChannel(255, 128)}}`,
    );
    expect(() => regionRow(blank)).toThrow(/paint/);
    expect(regionTail(blank), "a blank has no tail").toEqual([]);
    expect(painted.parts.regionTable).toBe(
      `${plain.parts.regionTable.slice(0, -1)},${blankRow(blank)},${blankRow(dot)}}`,
    );
    expect([...blankIndices(withBlanks.regions)]).toEqual([5, 6]);
    const numbers = mapNumbers(painted.parts.cellMap);
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
    expect(painted.system).toBe(plain.system);
    expect(painted.systemTimer).toBe(plain.systemTimer);
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
    const before = await costOf(surface("Page 3 quiet", QUIET), { slots: 5 });
    const after = await costOf(withBlanks, { slots: 5 });
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
      `page 3 ${before.setup.used} -> with a 2 x 2 blank and a 1 x 1 blank ${after.setup.used} at five slots (+${price}: two rows of ${blankRow(blank).length}, two commas, the fallback 11, five minus signs in M); the Timer ${after.timer.used}`,
    );

    // IN THE VM, on the trimmed halves: the rest frame paints the blank's
    // cells in its colour on layer 1; a finger on the blank sends nothing
    // and the frame does not move (nothing on layer 2); the same finger on
    // Filter beside it sends and moves the frame - the runtime is alive, it
    // is the blank it ignores.
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: painted.system as string,
      systemTimer: painted.systemTimer as string,
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

  it("8. the change 10B tail and the five-slot pack: min, max, the flag word and a spring position or a knob's centre past the colour, trailing defaults omitted; the price of each option per region measured; the landing's five strings the trimmed halves with the runtime, in SLOTS' shape", async () => {
    // THE TAIL. Nothing at the defaults; min alone forces the max; a flag
    // alone forces both; the spring's position is fourth; a knob always
    // carries its centre.
    const fader = PAGE3.regions[0];
    expect(TAIL_DEFAULTS).toEqual([0, 127, 0]);
    expect(regionTail(fader)).toEqual([]);
    expect(
      regionTail({ ...fader, min: 5 }),
      "a default max is omitted too",
    ).toEqual([5]);
    expect(regionTail({ ...fader, max: 100 })).toEqual([0, 100]);
    expect(regionTail({ ...fader, mode: "relative" })).toEqual([0, 127, 1]);
    expect(regionTail({ ...fader, spring: true })).toEqual([0, 127, 4, 64]);
    expect(
      regionTail({
        ...fader,
        spring: true,
        springValue: 200,
        min: 10,
        max: 20,
      }),
      "the spring value clamped into min..max, as a position",
    ).toEqual([10, 20, 4, 127]);
    expect(regionTail(PAGE3.regions[2])).toEqual([0, 127, 0, 64, 83]);
    expect(regionTail({ ...PAGE3.regions[3], latch: true })).toEqual([
      0, 127, 1,
    ]);
    // THE FLAG WORD, kind by kind.
    expect(flagsOf(fader)).toBe(0);
    expect(
      flagsOf({ ...fader, mode: "relative", speed: "full", spring: true }),
    ).toBe(7);
    expect(flagsOf({ ...PAGE3.regions[1], mode: "relative" })).toBe(1);
    // The note output rides in the channel word since change 17, not the flag word.
    expect(flagsOf({ ...PAGE3.regions[3], latch: true, output: "note" })).toBe(
      1,
    );
    expect(flagsOf({ ...PAGE3.regions[2], mode: "relative-offset" })).toBe(2);
    expect(
      flagsOf({ ...PAGE3.regions[2], mode: "relative" }),
      "a knob refuses a fader's mode",
    ).toBe(0);
    // THE PRICE PER REGION, in the Setup at the corner: the deltas a fader
    // pays for each option on top of its default row.
    const price = async (extra: Partial<Region>) =>
      (
        await measureSurface(
          atPickerCorner(surface("p", [{ ...fader, ...extra }])),
          { slots: 5 },
        )
      ).setup.used;
    const base = await price({});
    const prices = {
      minOnly: (await price({ min: 100 })) - base,
      minMax: (await price({ min: 100, max: 120 })) - base,
      relative: (await price({ mode: "relative" })) - base,
      relativeFull: (await price({ mode: "relative", speed: "full" })) - base,
      spring: (await price({ spring: true })) - base,
      everything:
        (await price({
          min: 127,
          max: 100,
          mode: "relative",
          speed: "full",
          spring: true,
          springValue: 100,
        })) - base,
    };
    console.log(
      `the tail's price per region in the Setup: a min alone +${prices.minOnly}, min and max at three digits +${prices.minMax}, relative +${prices.relative}, relative at full +${prices.relativeFull}, spring +${prices.spring}, everything at the widest +${prices.everything} (a default region pays nothing)`,
    );
    expect(prices).toEqual({
      minOnly: ",100".length,
      minMax: ",100,120".length,
      relative: ",0,127,1".length,
      relativeFull: ",0,127,3".length,
      spring: ",0,127,4,64".length,
      everything: ",127,100,7,127".length,
    });
    // THE PACK. Page 3 with every option on carries the same parts as page 3
    // (the runtime is per KIND, not per option), and every option-laden string
    // fits; the placement names each part's slot. Where they land moves with
    // the Setup's size since change 17 (the Setup is the packer's last slot),
    // so the options' price is read off the data half.
    const options = await measureSurface(atPickerCorner(PAGE3_OPTIONS), {
      slots: 5,
    });
    const plain = await measureSurface(atPickerCorner(PAGE3), { slots: 5 });
    expect(options.fits).toBe(true);
    expect(options.emitted.runtime.parts).toEqual(plain.emitted.runtime.parts);
    expect(
      options.emitted.runtime.placement.map((p) => `${p.name}:${p.slot}`),
    ).toEqual(PINNED.page3Placement);
    expect(
      options.emitted.parts.regionTable.length -
        plain.emitted.parts.regionTable.length,
    ).toBe(PINNED.page3OptionsPrice);
    console.log(
      `page 3 with every option on: J ${plain.emitted.parts.regionTable.length} -> ${options.emitted.parts.regionTable.length} (+${options.emitted.parts.regionTable.length - plain.emitted.parts.regionTable.length}); the Setup ${plain.setup.used} -> ${options.setup.used}; the placement ${options.emitted.runtime.placement.map((p) => `${p.name}:${p.slot}`).join(" ")}`,
    );
    // THE LANDING: five strings in SLOTS' shape, the system halves the
    // trimmed library with the runtime parts (never the full library),
    // every one canonical and inside 908.
    expect(LANDING_SLOTS).toBe(5);
    const landed = await landSurface(PAGE3_OPTIONS);
    expect(Object.keys(landed.config)).toEqual([
      "systemTimer",
      "system",
      "systemUtility",
      "setup",
      "timer",
    ]);
    expect(landed.config.system.startsWith(TRIMMED_LIBRARY)).toBe(true);
    expect(landed.config.systemTimer.startsWith(TRIMMED_LIBRARY_TIMER)).toBe(
      true,
    );
    expect(landed.config.system).not.toBe(TOUCH_LIBRARY);
    expect(landed.config.systemTimer).not.toBe(TOUCH_LIBRARY_TIMER);
    expect(landed.config.system).not.toContain("function Q(s,i,e,x,y)");
    for (const [key, text] of Object.entries(landed.config)) {
      expect((await canonical(text)).rounds, key).toBe(0);
      expect(text.length, key).toBeLessThanOrEqual(EVENT_BUDGET);
    }
    expect(landed.refusal).toBeUndefined();
    // Under three slots the landing is the full library, as it was.
    const three = await landSurface(PAGE3, { slots: 3 });
    expect(three.config.system).toBe(TOUCH_LIBRARY);
    expect(three.config.systemTimer).toBe(TOUCH_LIBRARY_TIMER);
    expect(three.refusal?.word, "page 3 no longer fits three slots").toBe(
      "Timer",
    );
  }, 60000);

  it("9. the touch count (change 11): the seventh column carries it above the second controller and no tail is forced, a one-finger pad is byte-identical with the field present or absent, the variant's Setup paint reads the defaults once, the last finger's pair must stay inside 127, and page 3's pad at three fingers lands five strings without the knob and is refused with it", async () => {
    // THE COLUMN: cc2 + 128(touches - 1); the flag word untouched by it.
    const pad = PAGE3.regions[1];
    expect(TOUCHES_MAX).toBe(5);
    expect(TOUCHES_COLUMN_STEP).toBe(128);
    expect(touchesOf(pad)).toBe(1);
    expect(seventhOf(pad)).toBe(103);
    expect(seventhOf({ ...pad, touches: 1 })).toBe(103);
    expect(seventhOf({ ...pad, touches: 3 })).toBe(103 + 256);
    expect(seventhOf({ ...pad, touches: 5 })).toBe(103 + 512);
    expect(seventhOf(PAGE3.regions[3])).toBe(0);
    expect(seventhOf({ ...PAGE3.regions[3], group: 4 })).toBe(4);
    // The channel word 15 + 128: a pad with more than one touch does not receive (change 17).
    expect(regionRow({ ...pad, touches: 3 })).toEqual([
      3, 0, 3, 3, 4, 102, 359, 143, 255, 255, 255,
    ]);
    expect(regionTail({ ...pad, touches: 5 }), "no tail forced").toEqual([]);
    expect(flagsOf({ ...pad, touches: 5 })).toBe(0);
    expect(
      flagsOf({ ...pad, touches: 5, mode: "relative", speed: "full" }),
    ).toBe(3);
    // THE PAIRS: finger n on cc + 2(n - 1); the ceiling a count admits.
    expect([1, 2, 3, 4, 5].map((n) => fingerController(102, n))).toEqual([
      102, 104, 106, 108, 110,
    ]);
    expect([1, 2, 3, 4, 5].map(ccCeiling)).toEqual([127, 125, 123, 121, 119]);
    // BYTE-IDENTICAL: the field at 1 or absent, every string the same; the
    // variant's entry in none of them.
    const strings = (e: Emitted) =>
      [e.setup, e.timer, e.mapmode, e.system, e.systemTimer].join("\n");
    for (const slots of SLOT_COUNTS) {
      const was = emitSurface(PAGE3, { slots });
      const one = emitSurface(
        {
          ...PAGE3,
          regions: PAGE3.regions.map((r) =>
            r.kind === "xy" ? { ...r, touches: 1 } : r,
          ),
        },
        { slots },
      );
      expect(strings(one), `slots ${slots}`).toBe(strings(was));
      expect(was.multitouch).toBe(false);
      expect(strings(was)).not.toContain(MULTITOUCH_TEXT.entry);
      expect(was.parts.paint).not.toContain(TAIL_DEFAULTS_LUA);
    }
    expect(hasMultitouch(PAGE3.regions)).toBe(false);
    expect(hasMultitouch(PAGE3_TOUCHES.regions)).toBe(true);
    // THE VARIANT'S SETUP: since change 17 no paint reads the defaults (the
    // Timer does, for every surface); the price at the corner, measured.
    const multi = emitSurface(PAGE3_TOUCHES, { slots: 5 });
    expect(multi.multitouch).toBe(true);
    expect(multi.parts.paint).not.toContain(TAIL_DEFAULTS_LUA);
    expect(multi.timer).toContain(TAIL_DEFAULTS_LOOP);
    expect(strings(multi)).toContain(MULTITOUCH_TEXT.entry);
    expect(strings(multi)).toContain(MULTITOUCH_TEXT.release);
    expect(strings(multi)).toContain(MULTITOUCH_TEXT.xy);
    expect(strings(multi)).not.toContain(TAIL_DEFAULTS_LUA + " I[r[5]]");
    expect((await canonical(multi.setup)).rounds).toBe(0);
    const priced = await measureSurface(atPickerCorner(PAGE3_TOUCHES), {
      slots: 5,
    });
    const plain = await measureSurface(
      atPickerCorner({
        ...PAGE3_TOUCHES,
        regions: PAGE3_TOUCHES.regions.map((r) =>
          r.kind === "xy" ? { ...r, touches: 1 } : r,
        ),
      }),
      { slots: 5 },
    );
    console.log(
      `the touch count's price at the corner: Setup ${plain.setup.used} -> ${priced.setup.used} (+${priced.setup.used - plain.setup.used}: the pad's seventh column 103 -> 359 and its channel word 15 -> 143, a multitouch pad not receiving); page 3 without the knob and the pad at three fingers: 255/6 ${priced.systemTimer?.used} + 255/0 ${priced.system?.used} + 255/4 ${priced.mapmode?.used} + Timer ${priced.timer.used}, ${priced.fits ? "fits" : "over"}`,
    );
    expect(priced.setup.used - plain.setup.used).toBe(PINNED.touchesSetupPrice);
    expect(priced.fits).toBe(true);
    // THE LANDING: five strings, the halves the trimmed library with the
    // variant's parts, every one inside 908; with the knob back, refused on
    // the Timer (runtime.spec.ts test 16 measures the shape).
    const landed = await landSurface(PAGE3_TOUCHES);
    expect(landed.refusal).toBeUndefined();
    expect(landed.config.system.startsWith(TRIMMED_LIBRARY)).toBe(true);
    for (const [key, text] of Object.entries(landed.config)) {
      expect((await canonical(text)).rounds, key).toBe(0);
      expect(text.length, key).toBeLessThanOrEqual(EVENT_BUDGET);
    }
    const withKnob = await landSurface(
      surface("Page 3 touches and knob", [
        ...PAGE3_TOUCHES.regions,
        PAGE3.regions[2],
      ]),
    );
    expect(withKnob.refusal?.word).toBe("Timer");
    expect(withKnob.refusal?.over).toBe(PINNED.page3TouchesKnobOver);
  }, 60000);

  it("10. Latch (change 18): a Latch Off region's channel word is 512 higher - every Off word 480 and up, every On word under 192, the rest of the row as it was, nothing on a blank - and the hand-over variants of `O` and `Y` are swapped in only then; the bit measured against a keyed field and a bit in the flag word, rows and readers; five slots at the corner before and after", async () => {
    const lines: string[] = [];
    const off = (s: Surface, name: string): Surface =>
      surface(
        name,
        s.regions.map((r) => ({ ...r, latchTouch: false })),
      );
    // THE ROW: the eighth column 512 higher on an Off region, every other column as it was.
    for (const r of [...PAGE3_OPTIONS.regions, ...EIGHT.regions]) {
      const row = regionRow(r);
      expect(regionRow({ ...r, latchTouch: true }), r.name).toEqual(row);
      const offRow = regionRow({ ...r, latchTouch: false });
      expect(offRow[7] - row[7], r.name).toBe(HAND_OVER_BIT);
      expect([...offRow.slice(0, 7), ...offRow.slice(8)]).toEqual([
        ...row.slice(0, 7),
        ...row.slice(8),
      ]);
      expect(regionTail({ ...r, latchTouch: false })).toEqual(regionTail(r));
    }
    // Every word: On under 192, Off 480 and up - the entry's `J[g][8]>479` - and the readers'
    // `%16`, `%128` and `//16%4` read an Off word as its On word (Lua's floor, as JavaScript's here).
    const lua = (a: number, m: number): number => ((a % m) + m) % m;
    for (const kind of ["fader", "button", "knob", "xy"] as const) {
      for (const output of ["cc", "note", "pitchbend", "pressure"] as const) {
        for (const receive of [true, false]) {
          for (const channel of [1, 16]) {
            const r = region("W", kind, 0, 0, 3, 3, {
              output,
              receive,
              channel,
            });
            const on = channelWord(r);
            const w = channelWord({ ...r, latchTouch: false });
            expect(on).toBeLessThan(192);
            expect(w).toBeGreaterThan(479);
            expect([
              lua(w, 16),
              lua(w, 128),
              lua(Math.floor(w / 16), 4),
            ]).toEqual([
              lua(on, 16),
              lua(on, 128),
              lua(Math.floor(on / 16), 4),
            ]);
          }
        }
      }
    }
    const wash = region("Wash", "blank", 7, 7, 2, 2, { cc: 0, channel: 1 });
    expect(blankRow({ ...wash, latchTouch: false })).toBe(blankRow(wash));
    // The table stays a fixed point of the minifier with the bit in it.
    const marked = renderRegionTable(off(PAGE3, "p").regions);
    expect((await canonical(marked)).rounds).toBe(0);
    // THE SWAP: the entry and `Y`'s rows are the hand-over's exactly when an element is Off.
    for (const slots of SLOT_COUNTS) {
      const plain = emitSurface(PAGE3, { slots });
      const one = emitSurface(
        surface("One off", [
          PAGE3.regions[0],
          { ...PAGE3.regions[3], latchTouch: false },
        ]),
        { slots },
      );
      const all = (e: Emitted) =>
        [e.setup, e.timer, e.mapmode, e.system, e.systemTimer].join(" ");
      expect(plain.handOver).toBe(false);
      expect(all(plain)).not.toContain(HAND_OVER_TEXT.entry);
      expect(all(plain)).toContain(receivePart({ rows: true }));
      expect(one.handOver).toBe(true);
      expect(all(one)).toContain(HAND_OVER_TEXT.entry);
      expect(all(one)).not.toContain(ENTRY);
      expect(all(one)).toContain(receivePart({ rows: true }, true));
      expect(all(one)).not.toContain(receivePart({ rows: true }));
    }
    // THE ENCODINGS, MEASURED, every element Off: the price over the surface at On of (a) a keyed
    // field `,h=1` after the numbered columns - nothing else reads it, the entry's read `J[g].h`;
    // (b) a flag-word bit, 8 - the tail forced where it was omitted (`,0,127,8`), and two texts
    // every surface carries read column 14 whole (`R`'s spring test `f//4>0`, the knob's `m`), each
    // a variant of its own, the entry's read `J[g][14]>7`; (c) the channel-word bit, 512 (the one
    // shipped) - the word's digits, `Y`'s rows the variant, the entry's read `J[g][8]>479`.
    const keyedRow = (r: Region): string => `{${regionRow(r).join(",")},h=1}`;
    const flagRow = (r: Region): string => {
      const tail = regionTail(r);
      const extra = tail.length > 3 ? tail.slice(3) : [];
      return `{${[...regionRow(r).slice(0, 11), minOf(r), maxOf(r), flagsOf(r) + 8, ...extra].join(",")}}`;
    };
    const channelRow = (r: Region): string =>
      `{${regionRow({ ...r, latchTouch: false }).join(",")}}`;
    const rowPrice = (s: Surface, form: (r: Region) => string) =>
      s.regions
        .filter((r) => r.kind !== "blank")
        .reduce(
          (n, r) => n + form(r).length - `{${regionRow(r).join(",")}}`.length,
          0,
        );
    const costOfText = async (text: string) => (await canonical(text)).cost;
    const knobReader =
      (await costOfText(
        BRANCH_TEXT.knob.replace("local m,a=r[14]", "local m,a=r[14]%8"),
      )) - BRANCH_TEXT.knob.length;
    const receiveRows = receivePart({ rows: true });
    const readers = {
      keyed: 0,
      flag:
        (await costOfText(RELEASE.replace("f//4>0", "f//4%2>0"))) -
        RELEASE.length +
        knobReader,
      channel:
        (await costOfText(receivePart({ rows: true }, true))) -
        receiveRows.length,
    };
    const entryRead = {
      keyed: "J[g].h".length,
      flag: "J[g][14]>7".length,
      channel: `J[g][8]>${HAND_OVER_BIT - 33}`.length,
    };
    expect(HAND_OVER_TEXT.entry).toContain(`J[g][8]>${HAND_OVER_BIT - 33}`);
    const table: string[] = [];
    const totals: Record<string, [number, number, number]> = {};
    for (const s of [PAGE3, PAGE3_OPTIONS, EIGHT, SIXTEEN]) {
      const a = rowPrice(s, keyedRow) + readers.keyed + entryRead.keyed;
      const b =
        rowPrice(s, flagRow) +
        readers.flag +
        entryRead.flag -
        (s.regions.some((r) => r.kind === "knob") ? 0 : knobReader);
      const c = rowPrice(s, channelRow) + readers.channel + entryRead.channel;
      totals[s.name] = [a, b, c];
      table.push(`${s.name} ${a} / ${b} / ${c}`);
    }
    lines.push(
      `the encodings, every element Off, over the surface at On (keyed field / flag bit / channel bit - rows, readers and the entry's read): ${table.join("; ")}; the readers alone ${readers.keyed} / ${readers.flag} / ${readers.channel}`,
    );
    expect(readers).toEqual(PINNED.latchReaders);
    expect(totals).toEqual(PINNED.latchEncodings);
    // THE FIVE SLOTS AT THE CORNER, On -> every element Off.
    const slotsOf = async (s: Surface) => {
      const m = await measureSurface(atPickerCorner(s), { slots: 5 });
      return `${[m.systemTimer?.used, m.system?.used, m.mapmode?.used, m.timer.used, m.setup.used].join("/")} ${m.fits ? "fits" : "over"}`;
    };
    const five: string[] = [];
    for (const s of [FOUR_FADERS, EIGHT, TWELVE, SIXTEEN]) {
      five.push(
        `${s.name} ${await slotsOf(s)} -> ${await slotsOf(off(s, `${s.name} off`))}`,
      );
    }
    lines.push(
      `five slots at the corner (255/6, 255/0, 255/4, Timer, Setup), On -> every element Off: ${five.join("; ")}`,
    );
    expect(five).toEqual(PINNED.latchFive);
    console.log(["Latch, the encoding (change 18):", ...lines].join("\n"));
  }, 120000);
});

/** The figures pinned above, this tree, 2026-09-18 (change 10B). */
const PINNED = {
  /** The Setups at the corner under two slots, by element count (change 17: the contact tables, eight, are the two-slot Setup's). */
  setups: { 1: 376, 4: 491, 8: 607, 12: 751, 16: 885 } as Record<
    number,
    number
  >,
  sixteenFive: 892,
  /** Change 17: 15 -> 14, the dearest channel word's third digit (a channel pressure on 16 with Receive off, 175); change 18: 14 -> 14 with Latch Off (687, three digits; the hand-over entry once). */
  capFromTwelve: [14, "budget"] as [number, string],
  /** Eleven of the dearest option-laden faders from an empty surface - the number the user no longer sees; change 18: eleven with Latch Off among the options. */
  floorFromEmpty: [11, "budget"] as [number, string],
  /** M 169 (the research's 165), J at four rows 151 (13-15's 155 with the frame), the paint 128 (13-14's 101 plus layer 2's colour). */
  parts: [169, 151, 128],
  /** Change 17: the receive half beside every branch, and the Setup's share of it. */
  deadBranches: [2402, 3970, 1568],
  /** Change 17: the Setup the fifth slot, the exact search placing what first fit could not. */
  page3Placement: [
    "R:timer",
    "O:systemTimer",
    "Q:setup",
    "D:mapmode",
    "A:setup",
    "K:setup",
    "I[1]:mapmode",
    "I[3]:mapmode",
    "I[4]:system",
    "I[5]:systemTimer",
    "Y:timer",
  ],
  /** J's price for every option on: 36 at change 10B; 38 since change 17 (the note button's channel word -17, where its flag bit was). */
  page3OptionsPrice: 38,
  /** Change 17: the pad's seventh column 103 -> 359 keeps its three digits; its channel word 15 -> 143 (a multitouch pad does not receive) is one more. */
  touchesSetupPrice: 1,
  /** Page 3 with the pad at three fingers AND the knob: the Timer over by this much (runtime.spec.ts test 16). */
  page3TouchesKnobOver: 168,
  /** Change 18: what each Latch encoding makes its readers pay - a keyed field nothing, a flag bit `R`'s spring test and the knob's mode (`%2`, `%8`), the channel bit `Y`'s rows (`%512` once, into a local). */
  latchReaders: { keyed: 0, flag: 5, channel: 6 },
  /** Change 18: every element Off, over the surface at On - keyed field / flag bit / channel bit, rows + readers + the entry's read. The channel bit is the cheapest on every one. */
  latchEncodings: {
    "Page 3": [22, 39, 21],
    "Page 3 options": [22, 18, 19],
    Eight: [38, 76, 25],
    Sixteen: [70, 140, 33],
  } as Record<string, [number, number, number]>,
  /** Change 18: 255/6, 255/0, 255/4, the Timer, the Setup at the corner, On -> every element Off (the hand-over entry, 121 more, and `Y`'s rows, 6). */
  latchFive: [
    "Four faders 830/903/558/111/482 fits -> 907/791/725/111/486 fits",
    "Eight 852/907/832/231/614 fits -> 858/907/824/365/622 fits",
    "Twelve 852/907/832/231/758 fits -> 858/907/824/365/770 fits",
    "Sixteen 852/907/832/231/892 fits -> 858/907/824/365/908 fits",
  ],
};
