// D-12: the production-build WASM proof.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev - the deployed bytes, not a dev server. The numbers are read
// from src/lib/fidelity/preset-baseline.json, the fixture BOTOR's own compiler
// produced, so this file never restates a length of its own.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const baseline = JSON.parse(
  readFileSync(
    new URL("../src/lib/fidelity/preset-baseline.json", import.meta.url),
    "utf8",
  ),
);
const aurora = baseline.presets.aurora;

test.describe("the Lua formatter WASM resolves from the production build", () => {
  test("the hidden probe compiles aurora in a real browser against build/", async ({
    page,
  }) => {
    const wasm: { url: string; status: number; type: string | null }[] = [];
    const consoleErrors: string[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith(".wasm")) {
        wasm.push({
          url: r.url(),
          status: r.status(),
          type: r.headers()["content-type"] ?? null,
        });
      }
    });
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });

    // trailingSlash: "always" (+layout.ts). Without the slash the static build
    // 404s and the failure looks like a broken route rather than a URL typo.
    await page.goto("/dev/fidelity/");
    const probe = page.getByTestId("fidelity-probe");
    // 628 KB of WASM over a cold wrangler; measured under a second including
    // page load, but the budget is generous because a timeout here should mean
    // "it never initialised", not "the machine was busy".
    await expect(probe).not.toHaveText("pending", { timeout: 30_000 });

    const out = JSON.parse((await probe.innerText()).trim());
    expect(out).toEqual({
      preset: "aurora",
      setupRawLength: aurora.setupRawLength,
      timerRawLength: aurora.timerRawLength,
      setupCompressedLength: aurora.setupCompressedLength,
      timerCompressedLength: aurora.timerCompressedLength,
      costSetupUsed: aurora.costSetupUsed,
      costTimerUsed: aurora.costTimerUsed,
    });

    expect(wasm.length, "no .wasm response was observed").toBeGreaterThan(0);
    expect(wasm[0].status).toBe(200);
    // A wrong MIME does not break the formatter: lua_fmt falls back from
    // instantiateStreaming to WebAssembly.instantiate with a console warning.
    // It just gets slower, silently, forever. So assert it.
    expect(wasm[0].type).toBe("application/wasm");
    expect(consoleErrors).toEqual([]);
  });

  test("the probe page is not linked from the site", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator('a[href*="/dev/"]').count()).toBe(0);
  });
});
