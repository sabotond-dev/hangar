// THE RACK ON ONE STRICT GRID (change 16b, 2026-09-21; BENCH-2026-09-16.txt section 16's tail).
// Every row of the tuning rack is one four-column grid - label | control | reset | lock - so on
// ARC's rack, measured with boundingBox() on the deployed bytes at 1440 x 900 and at 1280 x 720:
// every control's left edge and right edge are the same across rows (plus or minus 1px), every
// control is 44px tall, the reset boxes share one x, the lock cells share one x (an empty cell
// where a knob has no lock: 8px past the reset box), the rows of a section are one pitch apart,
// and nothing scrolls sideways. At 1440 the body is 385px and the rows are one line; at 1280 the
// body is under 380px and the label takes a line of its own - the same grid, the same edges.
// The Sandbox's inspector is on the same grid since change 16c: two more titles measure it by label.
//
// Chromium only: the geometry is CSS, and the phone width is tuning-webkit.e2e.ts's.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";

type Box = { x: number; y: number; w: number; h: number; r: number };

type Row = {
  id: string;
  /** The row's label text, the Sandbox's key (its rows carry no test id of their own). */
  label: string;
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
        label: (row.querySelector(".label")?.textContent ?? "").trim(),
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

/** The rows in the order they sit inside each section's rows block, so a pitch is measured between neighbours only - a MIDI output's sub-head (change 17) starts a group of its own; by test id, or by label. */
function sectionsOf(page: Page, byLabel = false): Promise<string[][]> {
  return page.evaluate((labels) => {
    const name = (row: Element) =>
      labels
        ? (row.querySelector(".label")?.textContent ?? "").trim()
        : (row.getAttribute("data-testid") ??
          row.parentElement?.getAttribute("data-testid") ??
          "");
    const groups: string[][] = [];
    for (const rows of Array.from(
      document.querySelectorAll("[data-testid='shell-inspector-body'] .rows"),
    )) {
      let group: string[] = [];
      for (const child of Array.from(rows.children)) {
        if (child.classList.contains("subhead")) {
          groups.push(group);
          group = [];
          continue;
        }
        const own = child.classList.contains("row")
          ? [child]
          : Array.from(child.querySelectorAll(".row"));
        group.push(...own.map(name));
      }
      groups.push(group);
    }
    return groups.filter((g) => g.length > 0);
  }, byLabel);
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
      // ARC: two swatch rows, the brightness field, the arms, the wave shape; MIDI (change 17):
      // Same channel for all, then the LFO output's Type, Channel, Number and Receive.
      expect(rows.map((row) => row.id)).toEqual([
        "swatch-swirlColour",
        "swatch-heartColour",
        "brightness-field",
        "knob-arms",
        "knob-shape",
        "knob-midiSameChannel",
        "knob-midiType",
        "midi-field-channel",
        "midi-field-cc",
        "knob-midiReceive",
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

/** The Sandbox from its front door with one fader placed and selected (sandbox.e2e.ts's walk, in short). */
async function openFader(page: Page): Promise<void> {
  await page.goto("/sandbox/?new");
  await expect(page.getByTestId("sandbox")).toBeVisible();
  const plate = page.getByTestId("surface-plate");
  await plate.focus();
  await page.keyboard.press("f");
  const box = await plate.boundingBox();
  if (box === null) throw new Error("the plate has no box");
  const pitch = box.width / 9;
  await plate.click({ position: { x: 0.5 * pitch, y: 0.5 * pitch } });
  await page.keyboard.press("v");
  await expect(page.getByTestId("inspector-name")).toHaveText("Fader 1");
}

test.describe("the Sandbox inspector's grid", () => {
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
  ] as const) {
    test(`on the Sandbox's inspector with a fader selected at ${width} x ${height} every control shares one left edge and one right edge at 44px tall, the lock box sits on the name row alone and a reset box on the colour and brightness rows alone, each in its column, the rows of a section are one pitch apart, the two action cells are equal, and nothing scrolls sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await openFader(page);
      const rows = await rowsOf(page);
      // Identity: the name, the type, the orientation; Behavior: the mode, the spring, Latch (change
      // 18); MIDI output: the Type (change 17), the four typed fields, Receive; Appearance: the colour,
      // the brightness.
      expect(rows.map((row) => row.label)).toEqual([
        "Element name",
        "Type",
        "Orientation",
        "Mode",
        "Spring",
        "Latch",
        "Type",
        "CC number",
        "Channel",
        "Min",
        "Max",
        "Receive",
        "Color",
        "Brightness",
      ]);

      // THE CONTROL COLUMN: one left edge, one right edge, 44px tall, on every row - the text
      // field, the fact, the segmented control, the steppers, the chip and the brightness field.
      const first = rows[0];
      for (const row of rows) {
        expect(
          near(row.control.x, first.control.x),
          `${row.label}'s control starts at ${row.control.x}, the first row's at ${first.control.x}`,
        ).toBe(true);
        expect(
          near(row.control.r, first.control.r),
          `${row.label}'s control ends at ${row.control.r}, the first row's at ${first.control.r}`,
        ).toBe(true);
        expect(
          near(row.control.h, 44),
          `${row.label}'s control is ${row.control.h}px tall`,
        ).toBe(true);
      }

      // THE TWO BOX COLUMNS: the Sandbox has no per-field default, so the reset cell is empty on
      // every row but the two that had one - the colour (the palette's default) and the
      // brightness (255) - and those two share one x; the lock box is the element's Locked
      // toggle, on the name row.
      expect(
        rows.filter((row) => row.reset).map((row) => row.label),
        "the colour and brightness rows alone carry a reset box",
      ).toEqual(["Color", "Brightness"]);
      expect(
        near((rows[12].reset as Box).x, (rows[13].reset as Box).x),
        "the two reset boxes share one x",
      ).toBe(true);
      expect(
        rows.filter((row) => row.lock).map((row) => row.label),
        "the name row alone carries the lock box",
      ).toEqual(["Element name"]);
      const reset = rows[13].reset as Box;
      expect(
        near(reset.x, first.control.r + 8),
        `the reset box is at ${reset.x}`,
      ).toBe(true);
      expect(
        near(reset.w, 44) && near(reset.h, 44),
        "the reset box is 44 x 44",
      ).toBe(true);
      const lock = rows[0].lock as Box;
      expect(
        near(lock.x, first.control.r + 8 + 44 + 8),
        `the lock box is at ${lock.x}, the control ends at ${first.control.r}`,
      ).toBe(true);
      expect(
        near(lock.w, 44) && near(lock.h, 44),
        "the lock box is 44 x 44",
      ).toBe(true);
      expect(
        near(lock.r, rows[0].row.r),
        "the lock box does not end at the row's edge",
      ).toBe(true);

      // THE PITCH: inside a section, every neighbouring pair of controls is one distance apart.
      // By document order, not by label: Identity's Type and MIDI output's Type (change 17) share one.
      const pitches: number[] = [];
      let cursor = 0;
      for (const section of await sectionsOf(page, true)) {
        const own = rows.slice(cursor, cursor + section.length);
        expect(own.map((row) => row.label)).toEqual(section);
        cursor += section.length;
        for (let at = 1; at < own.length; at++) {
          pitches.push(own[at].control.y - own[at - 1].control.y);
        }
      }
      expect(pitches.length, "the sections' neighbouring pairs").toBe(10);
      for (const pitch of pitches) {
        expect(
          near(pitch, pitches[0]),
          `the pitches are ${pitches.join(", ")}`,
        ).toBe(true);
      }
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

      // THE PINNED PAIR: two equal cells, 44 tall.
      const actions = page.locator(
        "[data-testid='shell-inspector'] .actions > *",
      );
      const actionBoxes = await actions.evaluateAll((els) =>
        els.map((el) => {
          const b = el.getBoundingClientRect();
          return { w: b.width, h: b.height };
        }),
      );
      expect(actionBoxes.length).toBe(2);
      expect(
        near(actionBoxes[0].w, actionBoxes[1].w),
        `the action cells are ${actionBoxes.map((b) => b.w).join(", ")} wide`,
      ).toBe(true);
      for (const box of actionBoxes)
        expect(near(box.h, 44), `an action is ${box.h} tall`).toBe(true);

      // Nothing scrolls sideways (D-11).
      for (const id of ["sandbox", "shell-inspector", "shell-inspector-body"]) {
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
