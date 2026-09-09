// D-12: the production-build WASM proof.
//
// Everything here runs against build/ served by worker/index.js under
// wrangler dev - the deployed bytes, not a dev server. The numbers are read
// from src/lib/fidelity/preset-baseline.json, the fixture BOTOR's own compiler
// produced, so this file never restates a length of its own.
//
// THE PROBED PRESET IS READ OUT OF THE PROBE AND CHECKED AGAINST THE DIVERGENCE
// RECORD (plan 11-06). The probe compiles through $lib/pad, which plan 11-05
// pointed at HANGAR's own nine, while this fixture is BOTOR's compiler's output
// over BOTOR's states. While the two shelves agreed the comparison was exact;
// the moment HANGAR changes a preset's state on purpose the two sides stop
// describing the same configuration, and the failure reads as a broken WASM
// build rather than as a catalog decision. It was MEASURED reading like that:
// with AURORA taking sends.kind = "xy" this test failed at
// "costSetupUsed: expected 250, received 415", which says nothing about the
// formatter. So the probe names its own preset, this file looks the baseline up
// by that name, and stateDiverges is asserted FIRST with a message that says
// which knob to turn.
//
// THERE IS A SECOND AXIS AND IT IS NOT MECHANISED HERE, so it is named instead.
// preset-baseline.json predates plan 11-04, whose class-B fast-tap guard moved
// PINWHEEL, RADAR, JOYSTICK and FADERS by +7 each. The fixture was never
// recaptured; src/lib/fidelity/preset-baseline.spec.ts stays green over those
// four only through its own intended-divergence substitution, which this file
// has no access to. So the probe must name a preset clean on BOTH axes, and
// RADAR - tried here first - is not: it failed at "expected 438, received 445".
// DIAL is untouched by 11-04 and by 11-06 alike, at 646 / 55 on both sides.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { stateDiverges } from "../src/lib/catalog/divergence";

const baseline = JSON.parse(
  readFileSync(
    new URL("../src/lib/fidelity/preset-baseline.json", import.meta.url),
    "utf8",
  ),
);

test.describe("the Lua formatter WASM resolves from the production build", () => {
  test("the hidden probe compiles a shelf preset in a real browser against build/", async ({
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
    expect(
      typeof out.preset,
      `the probe reported ${JSON.stringify(out)} instead of a compiled preset`,
    ).toBe("string");
    const probed: string = out.preset;
    expect(
      stateDiverges(probed),
      `the WASM probe compiles "${probed}" through $lib/pad, which resolves to ` +
        `HANGAR's own nine, and HANGAR declares a state divergence for that ` +
        `card in src/lib/catalog/divergence.ts. The lengths below would then ` +
        `disagree with preset-baseline.json for a CATALOG reason and this test ` +
        `would read as a broken WASM build. Point ` +
        `src/routes/dev/fidelity/+page.svelte at a preset HANGAR does not ` +
        `diverge on - the fixture is BOTOR's compiler's output and only means ` +
        `something over a state both sides share.`,
    ).toBe(false);
    const fixture = baseline.presets[probed];
    expect(
      fixture,
      `preset-baseline.json has no record for "${probed}"`,
    ).toBeDefined();
    expect(out).toEqual({
      preset: probed,
      setupRawLength: fixture.setupRawLength,
      timerRawLength: fixture.timerRawLength,
      setupCompressedLength: fixture.setupCompressedLength,
      timerCompressedLength: fixture.timerCompressedLength,
      costSetupUsed: fixture.costSetupUsed,
      costTimerUsed: fixture.costTimerUsed,
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
