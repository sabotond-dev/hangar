// THE RACK ON ONE STRICT GRID (change 16b, 2026-09-21; BENCH-2026-09-16.txt section 16's tail).
// Every row of the tuning rack is one four-column grid - label | control | reset | lock - so on
// ARC's rack, measured with boundingBox() on the deployed bytes at 1440 x 900 and at 1280 x 720:
// every control's left edge and right edge are the same across rows (plus or minus 1px), every
// control is 44px tall, the reset boxes share one x, the lock cells share one x (an empty cell
// where a knob has no lock: 8px past the reset box), the rows of a section are one pitch apart,
// and nothing scrolls sideways. At 1440 the body is 385px and the rows are one line; at 1280 the
// body is under 380px and the label takes a line of its own - the same grid, the same edges.
//
// Chromium only: the geometry is CSS, and the phone width is tuning-webkit.e2e.ts's.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";

type Box = { x: number; y: number; w: number; h: number; r: number };

type Row = {
  id: string;
  row: Box;
  control: Box;
  reset: Box | null;
  lock: Box | null;
};

/** Every row of the rack, top to bottom, with the boxes of its parts. */
function rowsOf(page: Page): Promise<Row[]> {
  return page.evaluate(() => {
    const box = (el: Element): Box => {
      const b = el.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
        r: b.x + b.width,
      };
    };
    return Array.from(
      document.querySelectorAll("[data-testid='shell-inspector-body'] .row"),
    ).map((row) => {
      const control = row.querySelector(".control");
      const reset = row.querySelector(".reset");
      const lock = row.querySelector(".lock");
      if (!control) throw new Error("a row without a control");
      return {
        // A swatch row carries its test id; a knob, MIDI or brightness row's root does.
        id:
          row.getAttribute("data-testid") ??
          row.parentElement?.getAttribute("data-testid") ??
          "",
        row: box(row),
        control: box(control),
        reset: reset ? box(reset) : null,
        lock: lock ? box(lock) : null,
      };
    });
  });
}

/** The scroll and client widths of an element, by test id. */
function overflowOf(page: Page, testId: string) {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    return el
      ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
      : null;
  }, testId);
}

/** The rows in the order they sit inside each section's rows block, so a pitch is measured between neighbours only. */
function sectionsOf(page: Page): Promise<string[][]> {
  return page.evaluate(() =>
    Array.from(
      document.querySelectorAll("[data-testid='shell-inspector-body'] .rows"),
    ).map((rows) =>
      Array.from(rows.querySelectorAll(".row")).map(
        (row) =>
          row.getAttribute("data-testid") ??
          row.parentElement?.getAttribute("data-testid") ??
          "",
      ),
    ),
  );
}

async function openArc(page: Page): Promise<void> {
  await page.goto("/playground/arc/");
  await expect(page.getByTestId("tuning-region")).toBeVisible();
  await expect(page.getByTestId("knob-rack").first()).toBeVisible();
  await expect(page.getByTestId("tuning-region")).toHaveAttribute(
    "data-busy",
    "false",
    { timeout: 30_000 },
  );
}

const near = (a: number, b: number, by = 1) => Math.abs(a - b) <= by;

test.describe("the rack's grid", () => {
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
  ] as const) {
    test(`on ARC's rack at ${width} x ${height} every control shares one left edge and one right edge at 44px tall, the reset boxes share one x, the lock cells share one x, the rows of a section are one pitch apart, and nothing scrolls sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openArc(page);
      const rows = await rowsOf(page);
      // ARC: two swatch rows, the brightness field, the arms, the wave shape, the CC number, the channel.
      expect(rows.map((row) => row.id)).toEqual([
        "swatch-swirlColour",
        "swatch-heartColour",
        "brightness-field",
        "knob-arms",
        "knob-shape",
        "midi-field-cc",
        "midi-field-channel",
      ]);

      // THE CONTROL COLUMN: one left edge, one right edge, 44px tall, on every row.
      const first = rows[0];
      for (const row of rows) {
        expect(
          near(row.control.x, first.control.x),
          `${row.id}'s control starts at ${row.control.x}, the first row's at ${first.control.x}`,
        ).toBe(true);
        expect(
          near(row.control.r, first.control.r),
          `${row.id}'s control ends at ${row.control.r}, the first row's at ${first.control.r}`,
        ).toBe(true);
        expect(
          near(row.control.h, 44),
          `${row.id}'s control is ${row.control.h}px tall`,
        ).toBe(true);
      }

      // THE TWO BOX COLUMNS: the reset boxes share one x and are 44 wide; a lock, where the row has
      // one, sits 8px past the reset box, and every lock shares that x; the right edge of the lock
      // column is the row's right edge.
      const resets = rows.map((row) => row.reset);
      expect(
        resets.every((box) => box !== null),
        "every row has a reset box",
      ).toBe(true);
      const resetX = (resets[0] as Box).x;
      for (const row of rows) {
        const reset = row.reset as Box;
        expect(
          near(reset.x, resetX),
          `${row.id}'s reset box is at ${reset.x}, not ${resetX}`,
        ).toBe(true);
        expect(
          near(reset.w, 44),
          `${row.id}'s reset box is ${reset.w} wide`,
        ).toBe(true);
        expect(
          near(reset.h, 44),
          `${row.id}'s reset box is ${reset.h} tall`,
        ).toBe(true);
        expect(
          near(reset.x, row.control.r + 8),
          `${row.id}'s reset box is not 8px past its control`,
        ).toBe(true);
        if (row.lock) {
          expect(
            near(row.lock.x, resetX + 44 + 8),
            `${row.id}'s lock is at ${row.lock.x}`,
          ).toBe(true);
          expect(
            near(row.lock.w, 44),
            `${row.id}'s lock is ${row.lock.w} wide`,
          ).toBe(true);
          expect(
            near(row.lock.r, row.row.r),
            `${row.id}'s lock does not end at the row's edge`,
          ).toBe(true);
        }
      }
      expect(
        rows.filter((row) => row.lock).map((row) => row.id),
        "the knob rows carry a lock, the brightness and MIDI rows an empty cell",
      ).toEqual([
        "swatch-swirlColour",
        "swatch-heartColour",
        "knob-arms",
        "knob-shape",
      ]);

      // THE PITCH: inside a section, every neighbouring pair of controls is the same distance
      // apart - measured on the controls, because the hairline between rows sits on the row
      // below it (inside a swatch row's box, on a knob row's root), so a row's own top moves by
      // the hairline while its control does not.
      const byId = new Map(rows.map((row) => [row.id, row]));
      const pitches: number[] = [];
      for (const section of await sectionsOf(page)) {
        for (let at = 1; at < section.length; at++) {
          const above = byId.get(section[at - 1]) as Row;
          const below = byId.get(section[at]) as Row;
          pitches.push(below.control.y - above.control.y);
        }
      }
      expect(
        pitches.length,
        "at least three neighbouring pairs were measured",
      ).toBeGreaterThanOrEqual(3);
      for (const pitch of pitches) {
        expect(
          near(pitch, pitches[0]),
          `the pitches are ${pitches.join(", ")}`,
        ).toBe(true);
      }
      // One line at 1440 (the body is 385 wide): the pitch is the control's 44 plus the hairline.
      // Stacked at 1280 (under 380): the label's line above the control on every row, so taller.
      if (width >= 1440) {
        expect(
          near(pitches[0], 45),
          `a one-line pitch is ${pitches[0]}px`,
        ).toBe(true);
      } else {
        expect(
          pitches[0],
          "a stacked pitch is taller than the control and its hairline",
        ).toBeGreaterThan(45);
      }

      // THE ACTION BUTTONS: equal cells, 44 tall.
      const actions = page.locator(
        "[data-testid='shell-inspector-body'] .actions > *",
      );
      const actionBoxes = await actions.evaluateAll((els) =>
        els.map((el) => {
          const b = el.getBoundingClientRect();
          return { w: b.width, h: b.height };
        }),
      );
      expect(actionBoxes.length).toBe(3);
      for (const box of actionBoxes) {
        expect(
          near(box.w, actionBoxes[0].w),
          `the action cells are ${actionBoxes.map((b) => b.w).join(", ")} wide`,
        ).toBe(true);
        expect(near(box.h, 44), `an action is ${box.h} tall`).toBe(true);
      }

      // Nothing scrolls sideways (D-11).
      for (const id of [
        "knob-rack",
        "tuning-region",
        "shell-inspector",
        "shell-inspector-body",
      ]) {
        const box = await overflowOf(page, id);
        expect(box, `${id} is on the page`).not.toBeNull();
        expect(
          (box as { scrollWidth: number }).scrollWidth,
          `${id} has something to scroll to sideways: ${JSON.stringify(box)}`,
        ).toBeLessThanOrEqual((box as { clientWidth: number }).clientWidth);
      }
    });
  }
});
