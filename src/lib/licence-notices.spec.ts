import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = (file: string) => new URL(`../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");

describe("licence and notices (FOUND-04)", () => {
  const notices = text("THIRD-PARTY.md");

  it("ships the verbatim GPLv3 text with the project copyright notice", () => {
    const licence = text("LICENSE");
    expect(licence.split(/\r?\n/)[0]).toContain("GNU GENERAL PUBLIC LICENSE");
    expect(licence).toContain("Version 3, 29 June 2007");
    expect(licence).toContain("Copyright (C) 2026 Botond Sandor");
    // GPLv3 section 6(d) is the clause a private repo discharges by serving the
    // archive. The phrase wraps across two lines in the canonical text, so
    // collapse whitespace before matching — never unwrap LICENSE itself.
    expect(licence.replace(/\s+/g, " ")).toContain(
      "offer equivalent access to the Corresponding Source",
    );
  });

  it("names grid-protocol as GPLv3 — the package with no licence field", () => {
    expect(notices).toMatch(/@intechstudio\/grid-protocol[^\n]*GPL-3\.0/);
  });

  it("names the lua formatter and its StyLua provenance", () => {
    expect(notices).toMatch(/@wasm-fmt\/lua_fmt[^\n]*MIT/);
    expect(notices).toContain("StyLua");
  });

  it("is not stale: every production dependency appears in the notices", () => {
    const lock = JSON.parse(text("package-lock.json"));
    const production = Object.entries(
      lock.packages as Record<string, { dev?: boolean }>,
    )
      .filter(([path, meta]) => path.startsWith("node_modules/") && !meta.dev)
      .map(([path]) => path.replace(/^node_modules\//, ""));
    expect(production.length).toBeGreaterThan(0);
    for (const name of production) {
      expect(notices, `${name} is missing — run "npm run licenses"`).toContain(
        name,
      );
    }
  });

  it("materialises the full licence texts", () => {
    expect(existsSync(root("licenses"))).toBe(true);
  });

  it("keeps internal planning material out of the source archive", () => {
    // export-ignore is read from the COMMITTED tree; the archive-content
    // assertion itself lives in e2e/artifacts.e2e.ts, which runs against a real
    // build.
    const attrs = text(".gitattributes");
    expect(attrs).toMatch(/^\.planning\/ export-ignore$/m);
    expect(attrs).toMatch(/^CLAUDE\.md export-ignore$/m);
  });

  it("carries the licence artefacts into build/ when a build is present", () => {
    // Success criterion 4 says BOTH runners execute against the static build.
    // The heavy build/ assertions live in e2e/artifacts.e2e.ts, whose webServer
    // always builds first; this one gives Vitest a foot in build/ without making
    // the sub-second inner loop depend on a build having been run.
    // `requireAssertions` is on, so the no-build branch must assert too.
    if (!existsSync(root("build"))) {
      expect(existsSync(root("build"))).toBe(false);
      return;
    }
    expect(existsSync(root("build/LICENSE"))).toBe(true);
    expect(existsSync(root("build/THIRD-PARTY.md"))).toBe(true);
  });
});
