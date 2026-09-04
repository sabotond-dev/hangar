// ORDER MATTERS. Vitest isolates module state per file, so the formatter is
// uninitialised only until the first await of padReady(). Tests 1 and 2 observe
// the pre-init branch and MUST stay first. Do not reorder.
//
// FIVE entry points have a load-bearing gate: costOf, fitsIn, measureLua,
// validateCompiled and fitState. Only the FIRST of them to run in this file can
// be proved by the cold formatter, which is test 3's job and why test 3 builds
// with the vendored compile(). Test 6 arrived after the gate was already open,
// so it proves its own await on a fresh module graph with the gate held shut
// instead - see its comment. New tests go at the END, never before test 1.
//
// This is the FOUND-05 proof (ROADMAP criterion 5). It lives in its own file for
// the same reason: any file that has already awaited the gate can never see the
// un-initialised branch again, so a pre-init assertion sharing a file with a
// post-init one is a tautology waiting to happen.
//
// resetPadReadyForTests() is deliberately NOT called here. The point is to
// observe the natural cold state, and dropping HANGAR's memo would not reset the
// vendored module's own flag anyway - the formatter, once initialised, stays so.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  compile as vendorCompile,
  cost as vendorCost,
  presetById,
  EVENT_BUDGET,
  type PadPreset,
} from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import {
  compilePreset,
  costOf,
  measureLua,
  padReady,
  validateCompiled,
  type FitPlan,
} from "./index";

interface PresetBaseline {
  setupCompressedLength: number;
  costSetupUsed: number;
  costTimerUsed: number;
}

const baseline = JSON.parse(
  readFileSync(new URL("../fidelity/preset-baseline.json", import.meta.url), {
    encoding: "utf8",
  }),
) as { presets: Record<string, PresetBaseline> };

// presetById returns PadPreset | undefined; narrow once so every use below is
// typed rather than asserted.
function mustPreset(id: string): PadPreset {
  const preset = presetById(id);
  if (!preset) throw new Error(`presetById("${id}") returned undefined`);
  return preset;
}

describe("the Lua formatter gate (FOUND-05)", () => {
  it("the vendored cost path refuses before the gate resolves, and says so out loud", () => {
    // Deliberate pre-init probe against the VENDORED functions, not HANGAR's
    // surface. compile() needs no formatter, so the result is real; cost()
    // reaches assertPadCompilerReady() and throws rather than returning an
    // unmeasurable number.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const built = vendorCompile(mustPreset("aurora").state);
    expect(built.setupLua.length).toBeGreaterThan(0);
    expect(() => vendorCost(built)).toThrow(
      "The Lua formatter is not initialised.",
    );
    // isPadCompilerReady() falls back to checkSyntax, which returns false AND
    // logs. This assertion documents exactly why the gate has to exist: the
    // silent-false path is real and observable.
    expect(
      spy.mock.calls.some((args) => String(args[0]).includes("Lua formatter")),
    ).toBe(true);
    spy.mockRestore();
  });

  it("the simulator is not gated: PadSim renders with the formatter uninitialised", () => {
    const sim = new PadSim(mustPreset("aurora").state);
    sim.run(64);
    expect(sim.frame).toHaveLength(243);
    expect(sim.tickCount).toBe(64);
  });

  it("cost through HANGAR's surface awaits the gate and returns the recorded baseline", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Built with the VENDORED compile on purpose. compile() needs no formatter
    // (test 1 proves it), so costOf below is the first call in this file that
    // crosses the gate - which is what makes this test the one that fails if
    // costOf's own `await padReady()` is ever deleted. Reaching for
    // compilePreset here instead would open the gate first and quietly turn the
    // assertion into a tautology.
    const built = vendorCompile(mustPreset("aurora").state);
    const budget = await costOf(built);
    expect(budget.setup.used).toBe(baseline.presets.aurora.costSetupUsed);
    expect(budget.timer.used).toBe(baseline.presets.aurora.costTimerUsed);
    expect(await measureLua(built.setupLua)).toBe(
      baseline.presets.aurora.setupCompressedLength,
    );
    // HANGAR's surface never triggers the protocol package's warning: it waits
    // instead of probing.
    expect(
      spy.mock.calls.some((args) => String(args[0]).includes("Lua formatter")),
    ).toBe(false);
    spy.mockRestore();
  });

  it("validate through HANGAR's surface never reports not-ready and never invents a syntax error", async () => {
    // compilePreset's own await is belt-and-braces and cannot be observed by any
    // test: compile() never touches the formatter, so deleting that one await
    // changes no behaviour. The five entry points whose gate IS load-bearing are
    // costOf, fitsIn, measureLua, validateCompiled and fitState - measured by
    // test 3, by this one and by test 6.
    const built = await compilePreset("aurora");
    const codes = (await validateCompiled(built)).map((d) => d.code);
    expect(codes).not.toContain("not-ready");
    expect(codes).not.toContain("syntax");
  });

  it("the gate is memoised: every caller awaits one initialisation", async () => {
    const a = padReady();
    const b = padReady();
    expect(a).toBe(b);
    await expect(Promise.all([a, b])).resolves.toEqual([undefined, undefined]);
  });

  it("the fit ladder through HANGAR's surface awaits the gate before it measures", async () => {
    // The fifth load-bearing gate, and the one that cannot be proved the way
    // test 3 proves costOf: test 3 has already opened the real gate, so no
    // later test in this file can ever see the un-initialised branch again
    // (the trap 03-05 documented). What IS still observable, on a fresh module
    // graph with the gate replaced by a promise this test holds shut, is the
    // await itself - and that is exactly what the paired mutation deletes.
    vi.resetModules();
    let open = (): void => {};
    let awaited = false;
    const gate = new Promise<void>((resolve) => {
      open = resolve;
    });
    vi.doMock("./ready", () => ({
      padReady: (): Promise<void> => {
        awaited = true;
        return gate;
      },
      resetPadReadyForTests: (): void => {},
    }));
    const { fitState } = await import("./index");

    let plan: FitPlan | undefined;
    const pending = fitState(mustPreset("aurora").state).then((p) => {
      plan = p;
    });
    // Drain the microtask queue. Nothing may reach the vendored fit() while the
    // gate is shut, however many turns the loop is given.
    await new Promise((resolve) => setImmediate(resolve));
    expect(awaited, "fitState never asked for the gate at all").toBe(true);
    expect(
      plan,
      "fitState measured before the gate resolved: the ladder is reachable around FOUND-05",
    ).toBeUndefined();

    open();
    await pending;
    expect(plan?.fits, "a preset state must never need the ladder").toBe(true);
    expect(plan?.steps, "a fitting state proposes nothing").toEqual([]);
    expect(
      plan?.setup.limit,
      "the ladder measures Setup against the event budget",
    ).toBe(EVENT_BUDGET);
    expect(
      plan?.timer.limit,
      "the ladder measures Timer against the event budget",
    ).toBe(EVENT_BUDGET);

    vi.doUnmock("./ready");
    vi.resetModules();
  });
});
