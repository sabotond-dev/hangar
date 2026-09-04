// The browse grid's arithmetic: the column ladder and the roving-focus keys.
//
// This runs in node with no DOM, which is the whole reason the arithmetic was
// separated from BrowseGrid.svelte in the first place - the same move
// src/lib/coverflow/slots.ts made, for the same reason: this repository
// collects no .svelte.spec.ts in any Vitest project, so a keyboard model
// written inside a component would be untested and would look tested.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { columnsForWidth, columnsFromTemplate, nextIndex } from "./grid";

/** 05.1-UI-SPEC.md Screen 2b, verbatim: content width to column count. */
const LADDER = [
  { from: 1112, columns: 4 },
  { from: 828, columns: 3 },
  { from: 544, columns: 2 },
  { from: 0, columns: 1 },
] as const;

describe("the browse grid arithmetic (src/lib/browse/grid.ts)", () => {
  it("columnsForWidth is the approved ladder, at every boundary and one either side", () => {
    for (const { from, columns } of LADDER) {
      expect(columnsForWidth(from), `${from}px is ${columns} columns`).toBe(
        columns,
      );
      expect(
        columnsForWidth(from + 1),
        `one past ${from}px is still ${columns} columns`,
      ).toBe(columns);
    }
    // One BELOW each boundary drops exactly one column.
    expect(columnsForWidth(1111), "one below the four-column boundary").toBe(3);
    expect(columnsForWidth(827), "one below the three-column boundary").toBe(2);
    expect(columnsForWidth(543), "one below the two-column boundary").toBe(1);

    // The spec's example viewports, and the two ends of the range.
    expect(columnsForWidth(1216), "1280px viewport, 32px gutters").toBe(4);
    expect(columnsForWidth(960), "1024px viewport").toBe(3);
    expect(columnsForWidth(704), "768px viewport").toBe(2);
    expect(columnsForWidth(327), "375px viewport, 24px gutters").toBe(1);
    expect(columnsForWidth(1280), "the content column caps at 1280").toBe(4);
    expect(columnsForWidth(1920), "and there is never a fifth column").toBe(4);
    expect(columnsForWidth(0), "and never a zeroth").toBe(1);
  });

  it("ArrowRight and ArrowLeft move by one and clamp at both ends", () => {
    expect(nextIndex("ArrowRight", 0, 16, 4), "one card right").toBe(1);
    expect(nextIndex("ArrowLeft", 5, 16, 4), "one card left").toBe(4);
    expect(nextIndex("ArrowRight", 7, 16, 4), "across a row boundary").toBe(8);

    // The ends are the ends. A ring wraps; a grid does not, and ArrowRight off
    // the last card landing on the first is disorienting (ARIA APG).
    expect(
      nextIndex("ArrowRight", 15, 16, 4),
      "ArrowRight on the LAST card stays on the last card",
    ).toBe(15);
    expect(
      nextIndex("ArrowLeft", 0, 16, 4),
      "ArrowLeft on the FIRST card stays on the first card",
    ).toBe(0);
  });

  it("ArrowDown and ArrowUp move by the column count and clamp at both ends", () => {
    expect(
      nextIndex("ArrowDown", 0, 16, 4),
      "one row down at four columns",
    ).toBe(4);
    expect(nextIndex("ArrowUp", 9, 16, 4), "one row up at four columns").toBe(
      5,
    );
    expect(
      nextIndex("ArrowDown", 0, 16, 3),
      "the row is the column count",
    ).toBe(3);
    expect(
      nextIndex("ArrowDown", 0, 16, 1),
      "a one-column grid steps by one",
    ).toBe(1);

    // The ends are the ends, and they are the ends of the LIST: a row step that
    // would leave the grid clamps into range rather than wrapping to the far
    // side. On a filtered set with a short last row that is what keeps the last
    // card reachable with a Down press instead of stranding it.
    expect(
      nextIndex("ArrowDown", 13, 16, 4),
      "ArrowDown off the LAST row clamps to the last card",
    ).toBe(15);
    expect(
      nextIndex("ArrowDown", 15, 16, 4),
      "and on the last card it stays there - never a wrap to the top",
    ).toBe(15);
    expect(
      nextIndex("ArrowDown", 9, 13, 4),
      "a short last row is still reachable",
    ).toBe(12);
    expect(
      nextIndex("ArrowUp", 2, 16, 4),
      "ArrowUp off the FIRST row clamps to the first card",
    ).toBe(0);
    expect(
      nextIndex("ArrowUp", 0, 16, 4),
      "and on the first card it stays there - never a wrap to the bottom",
    ).toBe(0);
  });

  it("Home is the first card, End is the last, and any other key is not ours", () => {
    expect(nextIndex("Home", 9, 16, 4), "Home").toBe(0);
    expect(nextIndex("End", 0, 16, 4), "End").toBe(15);
    expect(nextIndex("Home", 0, 16, 4), "Home on the first card").toBe(0);

    // undefined means "the grid did not act", which is what keeps the component
    // from calling preventDefault on a key it does not own: Space must go on
    // scrolling the page and Alt+Left must go on meaning Back.
    for (const key of [
      " ",
      "Space",
      "Enter",
      "Tab",
      "Escape",
      "PageDown",
      "a",
      "ArrowRightX",
      "",
    ]) {
      expect(
        nextIndex(key, 5, 16, 4),
        `${JSON.stringify(key)} is not a key this grid handles`,
      ).toBeUndefined();
    }
  });

  it("an empty grid answers nothing, and a grid of one answers zero", () => {
    const handled = [
      "ArrowRight",
      "ArrowLeft",
      "ArrowDown",
      "ArrowUp",
      "Home",
      "End",
    ];

    for (const key of handled) {
      expect(
        nextIndex(key, 0, 0, 4),
        `${key} on an empty grid has no card to move to`,
      ).toBeUndefined();
    }
    for (const key of handled) {
      expect(
        nextIndex(key, 0, 1, 4),
        `${key} on a grid of one lands on the only card`,
      ).toBe(0);
    }
  });

  it("columnsFromTemplate reads a rendered template and clamps an unrendered one to one", () => {
    expect(
      columnsFromTemplate("286px 286px 286px 286px"),
      "a real four-track template",
    ).toBe(4);
    expect(columnsFromTemplate("304px 304px 304px"), "three tracks").toBe(3);
    expect(columnsFromTemplate("327px"), "one track").toBe(1);

    // THE CLAMP. A list that has not been rendered - hidden, detached, or
    // measured before first paint - reports "none"; an empty string means
    // nothing at all. Both must come back as one, because ArrowUp and ArrowDown
    // DIVIDE BY nothing and ADD this number: a 0 would freeze the roving focus
    // by row with nothing red anywhere. UI-SPEC Screen 3 states Math.max(1, ...)
    // as a requirement, not a nicety.
    expect(columnsFromTemplate("none"), "an unrendered grid").toBe(1);
    expect(columnsFromTemplate(""), "an empty computed value").toBe(1);
    expect(columnsFromTemplate(undefined), "no computed value at all").toBe(1);
    expect(columnsFromTemplate("   "), "whitespace only").toBe(1);

    // And the clamp must not be a lie: whatever it returns is usable as a row
    // step, so ArrowDown on an unrendered grid still moves by one.
    expect(
      nextIndex("ArrowDown", 0, 16, columnsFromTemplate(undefined)),
      "ArrowDown on a grid measured before first paint still moves",
    ).toBe(1);
  });
});
