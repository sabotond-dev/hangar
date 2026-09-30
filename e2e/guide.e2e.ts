// THE QUICK GUIDE (change 26, BENCH-2026-09-16.txt section 26), on the deployed bytes: /guide/ is
// one h1 and eight h2 sections with their anchors, each reachable from the contents - the rail's
// from 1024 up, the article's below - and it stays light: no .wasm is fetched, as catalog.e2e.ts
// proves for a cold catalog load. The ways in land where they say: the intro's "Quick guide", the
// header's link on every app page (current on the guide), the Help & shortcuts panel, the Sandbox
// shortcut sheet's foot (/guide/#build, and the sheet's Tab now wraps between its two stops), and
// the connection control's drawer on a browser with no Web Serial (/guide/#connect). At 393 the
// page is one column with nothing wider than the viewport. The head is complete and its picture
// is served.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { expect, test, type Page } from "@playwright/test";
import {
  CONTENTS_NAME,
  DEVICE_GUIDE_CONNECT,
  GUIDE_HEADLINE,
  GUIDE_LINK,
  GUIDE_SECTIONS,
  GUIDE_TITLE,
  HELP_GUIDE_LINK,
  SHEET_GUIDE_LINK,
} from "../src/lib/guide/copy";

/** Every .wasm response and every page error, from the moment the listener is attached. */
function watch(page: Page): { wasm: string[]; errors: string[] } {
  const wasm: string[] = [];
  const errors: string[] = [];
  page.on("response", (r) => {
    if (r.url().endsWith(".wasm")) wasm.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return { wasm, errors };
}

/** Whether a section's title sits inside the viewport, near its top. */
async function landed(page: Page, id: string): Promise<boolean> {
  return page.evaluate((id) => {
    const title = document.getElementById(`${id}-title`);
    if (title === null) return false;
    const box = title.getBoundingClientRect();
    return box.top >= 0 && box.top < innerHeight / 2;
  }, id);
}

test.describe("the Quick guide", () => {
  test("renders one h1 and the eight sections, the rail's contents scroll to each, focus is visible, and no .wasm is fetched", async ({
    page,
  }) => {
    const seen = watch(page);
    await page.goto("/guide/");
    await expect(page).toHaveTitle(GUIDE_TITLE);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(GUIDE_HEADLINE);
    const sections = page.getByTestId("guide-section");
    await expect(sections).toHaveCount(8);
    for (const [i, s] of GUIDE_SECTIONS.entries()) {
      await expect(sections.nth(i)).toHaveAttribute("id", s.id);
      await expect(sections.nth(i).locator("h2")).toHaveText(s.title);
    }
    await expect(page.locator("main h2")).toHaveCount(8);
    await expect(page.getByTestId("guide-figure")).toHaveCount(4);

    // At the desktop project's 1280 the contents are the rail's; the article's are not drawn.
    const rail = page.getByTestId("guide-contents-rail");
    await expect(rail).toBeVisible();
    await expect(page.getByTestId("guide-contents")).toBeHidden();
    await expect(
      page.getByRole("navigation", { name: CONTENTS_NAME }),
    ).toHaveCount(1);
    for (const s of [...GUIDE_SECTIONS].reverse()) {
      await rail.locator(`a[data-section="${s.id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/guide/#${s.id}$`));
      await expect
        .poll(() => landed(page, s.id), `${s.id} scrolled into view`)
        .toBe(true);
    }

    // The header's link is current here, the nav marks nothing.
    const link = page.getByTestId("header-quick-guide");
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByTestId("shell-nav").locator("[aria-current]"),
    ).toHaveCount(0);

    // Keyboard focus is drawn: a contents row, reached by Tab, carries the focus ring.
    const first = rail.locator("a").first();
    await first.focus();
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        section: el.getAttribute("data-section"),
        width: style.outlineWidth,
        style: style.outlineStyle,
      };
    });
    expect(outline.section).toBe(GUIDE_SECTIONS[1].id);
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBe("2px");

    expect(seen.wasm, "the guide fetched a .wasm").toEqual([]);
    expect(seen.errors).toEqual([]);
  });

  test("a cold deep link lands on its section, and the head is complete with a picture that is served", async ({
    page,
    request,
  }) => {
    const seen = watch(page);
    await page.goto("/guide/#store");
    await expect(page.getByTestId("guide-contents-rail")).toBeVisible();
    await expect.poll(() => landed(page, "store")).toBe(true);

    const meta = (property: string) =>
      page.locator(`meta[property="${property}"]`).getAttribute("content");
    expect(await meta("og:title")).toBe(GUIDE_TITLE);
    expect(await meta("og:url")).toMatch(/\/guide\/$/);
    const image = (await meta("og:image")) as string;
    expect(image).toMatch(/\/og\/[a-z0-9-]+\.png$/);
    const served = await request.get(new URL(image).pathname);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toContain("image/png");
    expect(seen.wasm).toEqual([]);
  });

  test("at 393 the page is one column: the contents under the lede, the rail's not drawn, nothing wider than the viewport, and a contents link scrolls to its section", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    const seen = watch(page);
    await page.goto("/guide/");
    const contents = page.getByTestId("guide-contents");
    await expect(contents).toBeVisible();
    await expect(page.getByTestId("guide-contents-rail")).toBeHidden();
    const widths = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      view: document.documentElement.clientWidth,
    }));
    expect(widths.doc).toBeLessThanOrEqual(widths.view);
    // The lede sits above the contents, the contents above the first section.
    const lede = await page.locator(".guide header").boundingBox();
    const toc = await contents.boundingBox();
    const connect = await page.locator("#connect").boundingBox();
    expect(lede && toc && connect).toBeTruthy();
    expect((toc?.y ?? 0) > (lede?.y ?? 0)).toBe(true);
    expect((connect?.y ?? 0) > (toc?.y ?? 0)).toBe(true);
    await contents.locator('a[data-section="troubleshooting"]').click();
    await expect.poll(() => landed(page, "troubleshooting")).toBe(true);
    expect(seen.wasm).toEqual([]);
  });

  test("the ways in: the intro's link, the header's on an app page, and the Help panel's all reach /guide/", async ({
    page,
  }) => {
    await page.goto("/");
    const intro = page.getByTestId("quick-guide");
    await expect(intro).toHaveText(GUIDE_LINK);
    await expect(intro).toHaveAttribute("href", "/guide/");
    await intro.click();
    await expect(page).toHaveURL(/\/guide\/$/);
    await expect(page.locator("h1")).toHaveText(GUIDE_HEADLINE);

    await page.goto("/playground/");
    const header = page.getByTestId("header-quick-guide");
    await expect(header).toBeVisible();
    await expect(header).toHaveText(GUIDE_LINK);
    await expect(header).not.toHaveAttribute("aria-current", "page");
    await header.click();
    await expect(page).toHaveURL(/\/guide\/$/);

    await page.goto("/my-configs/");
    await expect(page.getByTestId("device-slot")).toHaveAttribute(
      "data-hydrated",
      "true",
    );
    await page.getByTestId("footer-help").click();
    const help = page.getByTestId("help-quick-guide");
    await expect(help).toBeVisible();
    await expect(help).toHaveText(HELP_GUIDE_LINK);
    await help.click();
    await expect(page).toHaveURL(/\/guide\/$/);
    await expect(page.getByTestId("guide-section")).toHaveCount(8);
  });

  test("the Sandbox's shortcut sheet: Tab wraps between Close and its foot's link, which lands on the Build section", async ({
    page,
  }) => {
    await page.goto("/sandbox/?new");
    await expect(page).toHaveURL(/\/sandbox\/[^/?#]+\/?$/);
    await expect(page.getByTestId("sandbox")).toBeVisible();
    await page.getByTestId("shortcuts-open").click();
    const close = page.getByTestId("shortcut-sheet-close");
    const link = page.getByTestId("shortcut-sheet-guide");
    await expect(close).toBeFocused();
    await expect(link).toHaveText(SHEET_GUIDE_LINK);
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(link).toBeFocused();
    await link.click();
    await expect(page).toHaveURL(/\/guide\/#build$/);
    await expect.poll(() => landed(page, "build")).toBe(true);
  });

  test("with no Web Serial, the connection control's drawer links the Connect section", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // An accessor on the prototype: deleting off the instance alone removes nothing (tuning-webkit.e2e.ts).
      const proto = Navigator.prototype as unknown as Record<string, unknown>;
      const instance = navigator as unknown as Record<string, unknown>;
      delete proto.serial;
      delete instance.serial;
    });
    await page.goto("/playground/");
    const slot = page.getByTestId("device-slot");
    await expect(slot).toHaveAttribute("data-hydrated", "true");
    await expect(slot).toHaveAttribute("data-slot", "S0a");
    await slot.click();
    const drawer = page.getByTestId("device-details");
    await expect(drawer).toBeVisible();
    const link = drawer.getByTestId("details-guide");
    await expect(link).toHaveText(DEVICE_GUIDE_CONNECT);
    await link.click();
    await expect(page).toHaveURL(/\/guide\/#connect$/);
    await expect.poll(() => landed(page, "connect")).toBe(true);
  });
});
