// D-14: the production-build laziness proof.
//
// The whole argument for shipping a 271 KB Lua VM to a public playground is
// that a browse-only visitor never downloads it. An argument nobody tested is a
// hope, so this file tests it against the deployed bytes: build/ served by
// worker/index.js under wrangler dev, never a dev server and never `vite
// preview` (which boots the Node server from .svelte-kit/output/server and
// never reads build/ at all).
//
// The expected catalog size is read from src/lib/catalog/frames.json, the
// fixture every catalog gate is measured against, so this file and the catalog
// cannot drift apart.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const frames = JSON.parse(
  readFileSync(
    new URL("../src/lib/catalog/frames.json", import.meta.url),
    "utf8",
  ),
);
const ENTRY_COUNT = String(Object.keys(frames.entries).length);

/** The formatter's asset, which is a different gate (e2e/fidelity.e2e.ts). */
const FORMATTER = "lua_fmt_bg";

type WasmResponse = { url: string; status: number; type: string | null };

/**
 * Every .wasm response and every error-level console line, collected from the
 * moment the listener is attached. Discriminating the VM's asset by the ABSENCE
 * of the formatter's name rather than by its own filename keeps a Vite hashing
 * change from turning this red for the wrong reason.
 */
function watch(page: Page): {
  wasm: WasmResponse[];
  consoleErrors: string[];
  vmOnly: () => WasmResponse[];
} {
  const wasm: WasmResponse[] = [];
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
  return {
    wasm,
    consoleErrors,
    vmOnly: () => wasm.filter((w) => !w.url.includes(FORMATTER)),
  };
}

/**
 * trailingSlash: "always" (src/routes/+layout.ts). Without the slash the static
 * build 404s and the failure reads as a broken route rather than a URL typo.
 *
 * The settle is not decoration. A zero-assertion evaluated before the page has
 * finished loading passes for the wrong reason, so the count element is awaited
 * first and then the network is allowed to go idle.
 */
async function coldLoad(page: Page): Promise<void> {
  await page.goto("/dev/catalog/");
  await expect(page.getByTestId("catalog-count")).toHaveText(ENTRY_COUNT);
  await page.waitForLoadState("networkidle");
}

test.describe("the Lua VM arrives only when a Lua configuration is opened", () => {
  test("a cold catalog load fetches no WebAssembly at all", async ({
    page,
  }) => {
    // THIS is the assertion D-14 asks for: neither the VM nor the formatter is
    // fetched by a visitor who only browses. Not "not much" - none.
    const seen = watch(page);
    await coldLoad(page);

    expect(
      seen.wasm.map((w) => w.url),
      "a cold catalog load fetched WebAssembly",
    ).toEqual([]);
    expect(seen.consoleErrors).toEqual([]);
  });

  test("opening a Lua configuration is what fetches the VM", async ({
    page,
  }) => {
    const seen = watch(page);
    await coldLoad(page);
    expect(seen.wasm.map((w) => w.url)).toEqual([]);

    // The simulator route is not what brings the VM in.
    await page.getByTestId("start-padsim").click();
    const padsim = page.getByTestId("padsim-probe");
    await expect(padsim).not.toHaveText("pending", { timeout: 30_000 });
    expect(
      seen.vmOnly().map((w) => w.url),
      "the simulator path fetched the Lua VM",
    ).toEqual([]);

    // The Lua route is.
    await page.getByTestId("start-lua").click();
    const lua = page.getByTestId("lua-probe");
    await expect(lua).not.toHaveText("pending", { timeout: 30_000 });

    const vm = seen.vmOnly();
    expect(vm.length, "no VM .wasm response was observed").toBeGreaterThan(0);
    expect(vm[0].status).toBe(200);
    // A wrong MIME breaks nothing visibly - the loader falls back from
    // instantiateStreaming to WebAssembly.instantiate with a console warning
    // and then runs the slow path forever. So assert it.
    expect(vm[0].type).toBe("application/wasm");

    // The browser half of PREV-02: a real Lua engine, in a real browser,
    // against the real build, producing a real frame.
    const out = JSON.parse((await lua.innerText()).trim());
    expect(out.frameLength).toBe(243);
    expect(out.nonZeroBytes).toBeGreaterThan(0);
    expect(seen.consoleErrors).toEqual([]);
  });
});
