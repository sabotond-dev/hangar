// THE CENTRE FITS THE SCREEN (change 25, 2026-09-28; BENCH-2026-09-16.txt section 25). On the card
// workspace and in the Sandbox the centre column never scrolls: its rows keep their height and the
// plate takes what they leave, square - the smallest of the width it is given, the height left once
// its caption rows are taken, and its cap (layout.ts, THE CENTRE FITS THE SCREEN). Measured with
// getBoundingClientRect() on the deployed bytes at 1280 x 720 and 1920 x 1080: the centre's
// scrollHeight is its clientHeight and the document's is the viewport's; the plate is square, inside
// the column, and exactly the edge the rule gives for the region it sits in; the rows under and beside
// it do not overlap it or each other. ORBIT with its MIDI monitor shut and open, AURORA with none, the
// Sandbox in Edit and in Play with the monitor's lines beside the plate, and the plate's menu, which
// leaves the column for the top layer and stays inside the viewport. On the stacked page (below 1024)
// the page scrolls and the plate with its caption fits the viewport's height.
//
// CHANGE 25b (2026-09-28, section 25's tail: "Footer off the app pages, Drop the duplicate
// breadcrumb"): on those two routes there is no context bar - its status and right zones are a line
// of the header's, under Clear and the connection control, the row itself where the 76px band
// centres it - and the footer is one strip, every link on one line in 12px, the build id the part
// that gives way. Measured at 1280 x 720 and at 1024 x 768, the narrowest desktop. And on every
// page the licence, the notices and the source archive are on screen, one click away (GPLv3 6(d)).
//
// Chromium only: the geometry is CSS.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import {
  CENTRE_PAD,
  FOOTER_STRIP_H,
  HEADER_H,
  PLATE_ASIDE_GAP,
  PLATE_ASIDE_MIN,
  PLATE_CAPTION_H,
  SANDBOX_PLATE,
  SURFACE_MAX,
} from "../src/lib/ui/shell/layout";

type Box = { x: number; y: number; w: number; h: number; r: number; b: number };

/** The card's caption gap and the Sandbox editor's rows (SurfaceEditor.svelte's --editor-rows): 12 + 18 + 8 + two 13px lines at 1.45. */
const CARD_CAPTION = 16 + PLATE_CAPTION_H;
const EDITOR_ROWS = 12 + PLATE_CAPTION_H + 8 + 2 * 1.45 * 13;

interface Fit {
  centre: Box;
  scrollHeight: number;
  clientHeight: number;
  docScroll: number;
  docClient: number;
  plate: Box;
  /** The region the plate is sized from: the card's stage, the Sandbox's editor. */
  region: Box;
  /** The Sandbox's region holding the editor and its aside. */
  stage: Box | null;
  aside: Box | null;
  /** The route root's in-flow rows, top to bottom. */
  rows: { name: string; box: Box }[];
}

function fitOf(page: Page, plateId: string): Promise<Fit> {
  return page.evaluate((plateId) => {
    const box = (el: Element): Box => {
      const b = el.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
        r: b.x + b.width,
        b: b.y + b.height,
      };
    };
    const need = (selector: string): Element => {
      const el = document.querySelector(selector);
      if (el === null) throw new Error(`nothing matches ${selector}`);
      return el;
    };
    const centre = need('[data-testid="shell-centre"]') as HTMLElement;
    const plate = need(`[data-testid="${plateId}"]`);
    const card = document.querySelector('[data-testid="workspace"]');
    const root = card ?? need('[data-testid="sandbox"]');
    const region = card
      ? need('[data-testid="workspace"] .stage')
      : need('[data-testid="surface-editor"]');
    const stage = card ? null : region.parentElement;
    const aside =
      stage === null
        ? null
        : (Array.from(stage.children).find((c) => c !== region) ?? null);
    const rows: { name: string; box: Box }[] = [];
    const walk = (el: Element): void => {
      for (const c of Array.from(el.children)) {
        const style = getComputedStyle(c);
        if (style.display === "contents") walk(c);
        else if (style.position !== "absolute" && style.position !== "fixed")
          rows.push({
            name: `${c.tagName.toLowerCase()}.${c.classList[0] ?? ""}`,
            box: box(c),
          });
      }
    };
    walk(root);
    const doc = document.scrollingElement as HTMLElement;
    return {
      centre: box(centre),
      scrollHeight: centre.scrollHeight,
      clientHeight: centre.clientHeight,
      docScroll: doc.scrollHeight,
      docClient: doc.clientHeight,
      plate: box(plate),
      region: box(region),
      stage: stage === null ? null : box(stage),
      aside: aside === null ? null : box(aside),
      rows,
    };
  }, plateId);
}

const near = (a: number, b: number, tolerance = 1): boolean =>
  Math.abs(a - b) <= tolerance;

/** What every fitting view shares: no scroll anywhere, a square plate inside the column, rows that do not overlap. */
function assertFits(fit: Fit, label: string): void {
  expect(
    fit.scrollHeight,
    `${label}: the centre is ${fit.scrollHeight} tall in ${fit.clientHeight}`,
  ).toBeLessThanOrEqual(fit.clientHeight);
  expect(
    fit.docScroll,
    `${label}: the document is ${fit.docScroll} tall in ${fit.docClient}`,
  ).toBeLessThanOrEqual(fit.docClient);
  const { plate, centre } = fit;
  expect(
    near(plate.w, plate.h),
    `${label}: the plate is ${plate.w} x ${plate.h}`,
  ).toBe(true);
  expect(plate.w, `${label}: the plate has an edge`).toBeGreaterThan(40);
  expect(
    plate.x >= centre.x - 0.5 &&
      plate.r <= centre.r + 0.5 &&
      plate.y >= centre.y - 0.5 &&
      plate.b <= centre.b + 0.5,
    `${label}: the plate ${JSON.stringify(plate)} is inside the column ${JSON.stringify(centre)}`,
  ).toBe(true);
  for (let i = 1; i < fit.rows.length; i++) {
    const above = fit.rows[i - 1];
    const below = fit.rows[i];
    expect(
      below.box.y,
      `${label}: ${below.name} starts at ${below.box.y}, over ${above.name} ending at ${above.box.b}`,
    ).toBeGreaterThanOrEqual(above.box.b - 0.5);
  }
  const last = fit.rows[fit.rows.length - 1];
  expect(
    last.box.b,
    `${label}: the last row ${last.name} ends at ${last.box.b}, the column's content at ${centre.b - CENTRE_PAD}`,
  ).toBeLessThanOrEqual(centre.b - CENTRE_PAD + 0.5);
}

/** The card's rule: the stage's width, its height less the caption, SURFACE_MAX. */
function assertCardEdge(fit: Fit, label: string): void {
  const edge = Math.min(fit.region.w, fit.region.h - CARD_CAPTION, SURFACE_MAX);
  expect(
    near(fit.plate.w, edge),
    `${label}: the plate is ${fit.plate.w}, the rule gives ${edge} from the stage ${JSON.stringify(fit.region)}`,
  ).toBe(true);
}

async function openCard(page: Page, id: string): Promise<void> {
  await page.goto(`/playground/${id}/`);
  await expect(page.getByTestId("workspace")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30_000 },
  );
  await expect(page.getByTestId("tuning-region")).toBeVisible();
}

for (const [width, height] of [
  [1280, 720],
  [1920, 1080],
] as const) {
  test(`at ${width} x ${height} the card workspace's centre never scrolls: ORBIT with its MIDI monitor shut and open and AURORA with none, each plate square, inside the column and the edge its stage leaves, no row over another`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await openCard(page, "orbit");
    const orbit = await fitOf(page, "workspace-surface");
    assertFits(orbit, "ORBIT");
    assertCardEdge(orbit, "ORBIT");

    await page.getByTestId("monitor-toggle").click();
    await expect(page.getByTestId("monitor-panel")).toBeVisible();
    const open = await fitOf(page, "workspace-surface");
    assertFits(open, "ORBIT, the monitor open");
    assertCardEdge(open, "ORBIT, the monitor open");
    expect(open.plate.w, "opening the monitor gives it height").toBeLessThan(
      orbit.plate.w,
    );

    await openCard(page, "aurora");
    const aurora = await fitOf(page, "workspace-surface");
    assertFits(aurora, "AURORA");
    assertCardEdge(aurora, "AURORA");
  });

  test(`at ${width} x ${height} the Sandbox's centre never scrolls: in Edit the plate is the edge its editor leaves, in Play the monitor stands beside the plate with its lines, and the plate's menu opens inside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/sandbox/?new");
    await expect(page.getByTestId("sandbox")).toBeVisible();
    // The empty surface: its instruction and starters are the aside.
    const empty = await fitOf(page, "surface-plate");
    assertFits(empty, "the empty surface");
    await page.getByTestId("starter-action").click();
    await expect(page.getByTestId("surface-count")).toHaveText("1 element");

    // EDIT: the editor alone fills the region; the plate is its width, its height less the rows, or 571.
    const edit = await fitOf(page, "surface-plate");
    assertFits(edit, "Edit");
    const editEdge = Math.min(
      edit.region.w,
      edit.region.h - EDITOR_ROWS,
      SANDBOX_PLATE,
    );
    expect(
      near(edit.plate.w, editEdge),
      `Edit: the plate is ${edit.plate.w}, the rule gives ${editEdge} from the editor ${JSON.stringify(edit.region)}`,
    ).toBe(true);

    // THE MENU leaves the column: whole inside the viewport, then Escape.
    const plate = page.getByTestId("surface-plate");
    await plate.click({
      position: { x: edit.plate.w * 0.1, y: edit.plate.h * 0.1 },
      button: "right",
    });
    const menu = page.getByTestId("surface-menu");
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    if (menuBox === null) throw new Error("the menu has no box");
    expect(
      menuBox.y >= 0 &&
        menuBox.y + menuBox.height <= height &&
        menuBox.x >= 0 &&
        menuBox.x + menuBox.width <= width,
      `the menu ${JSON.stringify(menuBox)} is inside ${width} x ${height}`,
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    // PLAY: presses on the fader write monitor lines; the monitor stands beside the plate.
    await page.getByTestId("segment-play").click();
    await expect(page.getByTestId("play-monitor")).toBeVisible();
    await page.waitForFunction(
      () => {
        const c = document.querySelector(
          '[data-testid="pad-canvas-sandbox-preview"]',
        ) as HTMLCanvasElement | null;
        return c !== null && c.width === 9;
      },
      undefined,
      { timeout: 30_000 },
    );
    const at = await plate.boundingBox();
    if (at === null) throw new Error("the plate has no box");
    const pitch = at.width / 9;
    for (const row of [0, 4, 0, 4]) {
      await page.mouse.move(at.x + 0.5 * pitch, at.y + (row + 0.5) * pitch);
      await page.mouse.down();
      await page.waitForTimeout(80);
      await page.mouse.up();
    }
    await expect(page.getByTestId("play-monitor-line").first()).toBeVisible({
      timeout: 10_000,
    });
    const play = await fitOf(page, "surface-plate");
    assertFits(play, "Play");
    const stage = play.stage;
    const aside = play.aside;
    if (stage === null || aside === null) throw new Error("no aside in Play");
    const playEdge = Math.min(
      stage.h - EDITOR_ROWS,
      SANDBOX_PLATE,
      stage.w - PLATE_ASIDE_MIN - PLATE_ASIDE_GAP,
    );
    expect(
      near(play.plate.w, playEdge),
      `Play: the plate is ${play.plate.w}, the rule gives ${playEdge} from the region ${JSON.stringify(stage)}`,
    ).toBe(true);
    expect(
      near(aside.x - play.region.r, PLATE_ASIDE_GAP),
      `Play: the monitor starts ${aside.x - play.region.r}px after the editor`,
    ).toBe(true);
    expect(aside.w).toBeGreaterThanOrEqual(PLATE_ASIDE_MIN - 0.5);
    expect(
      aside.b,
      `Play: the monitor ends at ${aside.b}, the region at ${stage.b}`,
    ).toBeLessThanOrEqual(stage.b + 0.5);
  });
}

test("on the stacked page (844 x 390) the page scrolls and each plate, with its caption, fits the viewport's height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openCard(page, "aurora");
  const card = await fitOf(page, "workspace-surface");
  expect(near(card.plate.w, card.plate.h)).toBe(true);
  expect(
    card.plate.h + CARD_CAPTION,
    `the card's plate ${card.plate.h} and its caption fit 390 less the centre's padding`,
  ).toBeLessThanOrEqual(390 - 2 * CENTRE_PAD + 0.5);
  expect(card.docScroll, "the stacked page scrolls").toBeGreaterThan(
    card.docClient,
  );

  await page.goto("/sandbox/?new");
  await expect(page.getByTestId("sandbox")).toBeVisible();
  const sandbox = await fitOf(page, "surface-plate");
  expect(near(sandbox.plate.w, sandbox.plate.h)).toBe(true);
  expect(
    sandbox.plate.h + EDITOR_ROWS,
    `the Sandbox's plate ${sandbox.plate.h} and its rows fit 390 less the centre's padding`,
  ).toBeLessThanOrEqual(390 - 2 * CENTRE_PAD + 0.5);
});

/** The app pages' chrome (change 25b), read off the page. */
function chromeOf(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element | null): Box | null => {
      if (el === null) return null;
      const b = el.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
        r: b.right,
        b: b.bottom,
      };
    };
    const one = (selector: string) => document.querySelector(selector);
    const footer = one('[data-testid="shell-footer"]') as HTMLElement;
    const lineItems = [
      one('[data-testid="shell-footer"] .brand'),
      one('[data-testid="footer-help"]'),
      one('[data-testid="device-actions"]'),
      one('[data-testid="shell-footer"] a[href="/LICENSE"]'),
      one('[data-testid="shell-footer"] a[href="/THIRD-PARTY.md"]'),
      one('[data-testid="shell-footer"] a[download]'),
      one('[data-testid="commit-sha"]'),
    ].map((el) => ({
      text: (el?.textContent ?? "").trim(),
      box: box(el),
      clipped: el === null || el.scrollWidth > el.clientWidth + 0.5,
      size: el === null ? 0 : parseFloat(getComputedStyle(el).fontSize),
    }));
    return {
      bars: document.querySelectorAll('[data-testid="shell-context"]').length,
      header: box(one('[data-testid="shell-header"]')),
      mark: box(one('[data-testid="shell-wordmark"]')),
      connection: box(one('[data-testid="shell-connection"]')),
      line: box(one('[data-testid="shell-header-context"]')),
      zone: box(one('[data-testid="shell-header"] [data-zone="destination"]')),
      footer: box(footer),
      shape: footer.dataset.shape,
      lineItems,
    };
  });
}

for (const [width, height] of [
  [1280, 720],
  [1024, 768],
] as const) {
  test(`at ${width} x ${height} the card workspace and the Sandbox have no context bar: its zones are the header's line under the connection zone, the row where the band centres it, and the footer is one strip with every link whole (change 25b)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const arrivals: [string, () => Promise<void>][] = [
      ["/playground/orbit/", () => openCard(page, "orbit")],
      [
        "/sandbox/?new",
        async () => {
          await page.goto("/sandbox/?new");
          await expect(page.getByTestId("sandbox")).toBeVisible();
        },
      ],
    ];
    for (const [route, arrived] of arrivals) {
      await arrived();
      await expect(page.getByTestId("shell-header-context")).toBeVisible();
      const c = await chromeOf(page);
      const { header, mark, connection, line, zone, footer } = c;
      if (!header || !mark || !connection || !line || !zone || !footer) {
        throw new Error(`${route}: a chrome region is missing`);
      }
      expect(c.bars, `${route}: no context bar`).toBe(0);
      // The row: the wordmark centred where the 76px band centres it.
      expect(
        Math.abs(mark.y + mark.h / 2 - HEADER_H / 2),
        `${route}: the wordmark's centre is at ${mark.y + mark.h / 2}`,
      ).toBeLessThanOrEqual(1);
      // The line: under the connection zone, inside the header, its right zone at the zone's right edge.
      expect(
        line.y,
        `${route}: the line starts at ${line.y}, the row ends at ${connection.b}`,
      ).toBeGreaterThanOrEqual(connection.b - 0.5);
      expect(line.b).toBeLessThanOrEqual(header.b + 0.5);
      expect(
        Math.abs(zone.r - connection.r),
        `${route}: the preview line ends at ${zone.r}, the connection zone at ${connection.r}`,
      ).toBeLessThanOrEqual(1);
      await expect(
        page.getByTestId("shell-header").locator('[data-zone="destination"]'),
      ).toHaveText("Preview without hardware");
      // The footer: the strip, at the viewport's foot, one line tall.
      expect(c.shape).toBe("strip");
      expect(Math.round(footer.b), `${route}: the strip's foot`).toBe(height);
      expect(
        footer.h,
        `${route}: the strip is ${footer.h} tall`,
      ).toBeLessThanOrEqual(FOOTER_STRIP_H + 1 + 0.5);
      // Every item on the one line, in order, none over the next, 12px, and whole but the build id.
      const items = c.lineItems;
      for (const item of items) {
        if (!item.box) throw new Error(`${route}: a footer item is missing`);
        expect(
          item.box.y,
          `${route}: ${item.text} is on the line`,
        ).toBeGreaterThanOrEqual(footer.y - 0.5);
        expect(item.box.b).toBeLessThanOrEqual(footer.b + 0.5);
        expect(
          item.box.r,
          `${route}: ${item.text} ends at ${item.box.r}`,
        ).toBeLessThanOrEqual(width + 0.5);
        expect(item.size, `${route}: ${item.text} at 12px`).toBe(12);
      }
      for (let i = 1; i < items.length; i++) {
        const a = items[i - 1].box;
        const b = items[i].box;
        if (!a || !b) continue;
        expect(
          b.x,
          `${route}: ${items[i].text} starts at ${b.x}, over ${items[i - 1].text} ending at ${a.r}`,
        ).toBeGreaterThanOrEqual(a.r - 0.5);
      }
      for (const item of items.slice(0, -1)) {
        expect(item.clipped, `${route}: ${item.text} is whole`).toBe(false);
      }
    }
  });
}

test("on every page the licence, the notices and the source archive are on screen and one click away (GPLv3 section 6(d)), the archive named by the build id", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const route of [
    "/",
    "/playground/",
    "/playground/orbit/",
    "/sandbox/?new",
    "/my-configs/",
  ]) {
    await page.goto(route);
    const footer = page.getByTestId("shell-footer");
    await expect(footer).toBeVisible();
    const sha = (await page.getByTestId("commit-sha").textContent())?.trim();
    expect(sha, `${route}: the build id`).toMatch(/^[0-9a-f]{7,40}$/);
    const links = [
      footer.getByRole("link", { name: "GPLv3" }),
      footer.getByRole("link", { name: "Third-party notices" }),
      footer.getByRole("link", { name: "Source" }),
    ];
    for (const link of links) {
      await expect(link, `${route}: on screen`).toBeInViewport();
    }
    await expect(links[0]).toHaveAttribute("href", "/LICENSE");
    await expect(links[1]).toHaveAttribute("href", "/THIRD-PARTY.md");
    await expect(links[2]).toHaveAttribute("href", `/source-${sha}.tar.gz`);
  }
});
