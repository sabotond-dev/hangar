import { readFileSync } from "node:fs";
import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { PROTOCOL_PIN } from "./protocol-pin";

const PKG = "@intechstudio/grid-protocol";
const root = (file: string) => new URL(`../../${file}`, import.meta.url);
const json = (file: string) => JSON.parse(readFileSync(root(file), "utf8"));

describe("grid-protocol pin", () => {
  const declared: string | undefined = json("package.json").dependencies?.[PKG];
  const resolved: string | undefined =
    json("package-lock.json").packages?.[`node_modules/${PKG}`]?.version;

  it("is declared in package.json with no range operator", () => {
    expect(declared, `${PKG} is missing from dependencies`).toBeDefined();
    // ^ ~ > < = * x, hyphen ranges and || are all forbidden. Only a literal
    // version passes.
    expect(declared).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("declares exactly the pinned version", () => {
    expect(declared).toBe(PROTOCOL_PIN);
  });

  it("is installed at exactly the pinned version", () => {
    expect(
      resolved,
      "run `npm ci` — the lockfile has no entry for the package",
    ).toBeDefined();
    expect(resolved).toBe(PROTOCOL_PIN);
  });

  it("pins the version BOTOR measured its cost baseline against", () => {
    // Hard-coded on purpose. A bump must edit this literal, package.json and
    // the lockfile in one commit — the three assertions above would all agree
    // after a silent `npm update`, this one would not.
    expect(PROTOCOL_PIN).toBe("1.20260825.1135");
  });

  beforeAll(async () => {
    // compressScript THROWS until the WASM formatter has resolved. This spec
    // measures with GridScript directly rather than through the vendored
    // measure(), so the pin gate stays true even if the vendored copy is
    // mid-resync.
    await initLuaFormatter();
  });

  // The cost-baseline half of the bump gate (D-11). Proves that the compressed
  // lengths recorded in src/lib/fidelity/preset-baseline.json are still what
  // the minifier produces at PROTOCOL_PIN: bump the pin and any preset whose
  // Setup or Timer minifies to a different length turns this red.
  it("every catalog preset compressScript cost is byte-identical to the recorded baseline", () => {
    const baseline = json("src/lib/fidelity/preset-baseline.json");
    expect(baseline.source.protocolPin).toBe(PROTOCOL_PIN);
    const ids = Object.keys(baseline.presets);
    expect(ids).toHaveLength(9);
    for (const id of ids) {
      const p = baseline.presets[id];
      // compressScript length, NOT cost().used. cost().used is
      // max(compressed, raw) + reserved and raw wins for all nine presets, so a
      // minifier that spent five more characters would move this number and
      // leave cost().used untouched - exactly the drift this gate exists for.
      expect(GridScript.compressScript(p.setupLua).length, `${id} setup`).toBe(
        p.setupCompressedLength,
      );
      expect(GridScript.compressScript(p.timerLua).length, `${id} timer`).toBe(
        p.timerCompressedLength,
      );
    }
  });
});
