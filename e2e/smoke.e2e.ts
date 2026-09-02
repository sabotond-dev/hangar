import { expect, test } from "@playwright/test";

test.describe("static build, no Web Serial", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      // `serial` is an accessor on Navigator.prototype — deleting it off the
      // instance returns true and removes nothing.
      delete (Navigator.prototype as unknown as Record<string, unknown>).serial;
    });
  });

  test("the page renders with the capability removed", async ({ page }) => {
    await page.goto("/");
    // Precondition, asserted. A degrade test that does not verify its own
    // precondition passes for the wrong reason.
    expect(await page.evaluate(() => "serial" in navigator)).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("licence, notices and source archive are served from the site root", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const sha = (await page.getByTestId("commit-sha").innerText()).trim();
    expect(sha).toMatch(/^[0-9a-f]{40}$/);

    const paths = ["/LICENSE", "/THIRD-PARTY.md", `/source-${sha}.tar.gz`];
    for (const path of paths) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
    expect(await (await request.get("/LICENSE")).text()).toContain(
      "GNU GENERAL PUBLIC LICENSE",
    );
    expect(await (await request.get("/THIRD-PARTY.md")).text()).toContain(
      "@intechstudio/grid-protocol",
    );
  });

  test("an unknown path returns a real 404", async ({ request }) => {
    // not_found_handling "404-page" plus adapter-static fallback "404.html".
    expect((await request.get("/this-path-does-not-exist")).status()).toBe(404);
  });
});

test.describe("the preview gate (D-07)", () => {
  // Node's own fetch, deliberately, because getting a genuinely
  // credential-free request out of Playwright turned out to be impossible
  // here. Two obvious routes were both observed returning 200 where a 401 was
  // expected: `test.use({ httpCredentials: undefined })` reads as "not
  // specified", so Playwright falls back to the value in defineConfig, and a
  // context built from the module-level `request` API picks the same
  // credentials up under the runner. fetch() inherits nothing, so this really
  // does send no Authorization header — which is the whole assertion.
  test("refuses a request with no credentials and asks robots to stay away", async ({
    baseURL,
  }) => {
    const res = await fetch(`${baseURL}/`);
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });
});
