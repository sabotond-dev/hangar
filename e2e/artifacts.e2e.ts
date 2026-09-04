import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { FRONT_DOOR } from "../src/lib/catalog/front-door";

const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const archive = `build/source-${sha}.tar.gz`;
const entries = () =>
  execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);

test("the static build is complete", () => {
  for (const file of [
    "build/index.html",
    "build/404.html",
    "build/LICENSE",
    "build/THIRD-PARTY.md",
    "build/licenses",
    archive,
  ]) {
    expect(existsSync(file), file).toBe(true);
  }
});

test("the source archive is the Corresponding Source and nothing else", () => {
  const list = entries();
  // "Scripts to control those activities" (GPLv3 section 1) — package.json
  // alone does not reproduce a build; the lockfile does.
  expect(list.some((e) => e.endsWith("package-lock.json"))).toBe(true);
  expect(list.some((e) => e.endsWith("vite.config.ts"))).toBe(true);
  expect(list.some((e) => e.endsWith("LICENSE"))).toBe(true);
  // Internal planning material must never ship. export-ignore fails silently if
  // the .gitattributes is uncommitted, so this assertion is the real gate.
  expect(list.filter((e) => e.includes(".planning/"))).toEqual([]);
  expect(list.filter((e) => e.endsWith("CLAUDE.md"))).toEqual([]);
  expect(list.some((e) => e.includes("node_modules/"))).toBe(false);
});

// The picture is not merely on disk. `build/og/` is proven by
// src/lib/og/build.spec.ts; what only a real request can prove is that the
// deployed artifact SERVES it, with the content type an unfurl needs. The row
// itself is imported rather than a list of ids, exactly as
// e2e/first-experience.e2e.ts does, so a widened FRONT_DOOR is covered here
// without anyone editing this file.
//
// The `request` fixture rather than `page.goto`: nothing about rendering
// belongs in a test about serving, and the config's top-level httpCredentials
// apply to it.
test("every configuration's link image is served by the built site", async ({
  request,
}) => {
  // Non-vacuous: an empty row would otherwise make this test pass on nothing.
  expect(FRONT_DOOR.length, "there are images to check").toBeGreaterThanOrEqual(
    8,
  );
  for (const entry of FRONT_DOOR) {
    const path = `/og/${entry.id}.png`;
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    // A wrong content type is worse than a missing file: the asset is there,
    // the page looks fine, and the unfurl silently shows nothing.
    expect(response.headers()["content-type"], path).toBe("image/png");
    const body = await response.body();
    expect([...body.subarray(0, 8)], `${path} signature`).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  }
});
