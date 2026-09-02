import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
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

  // The cost-baseline half of the bump gate (D-11) arrives with the vendored
  // compiler in Phase 3.
  it.todo(
    "every catalog preset compressScript cost is byte-identical to the recorded baseline",
  );
});
