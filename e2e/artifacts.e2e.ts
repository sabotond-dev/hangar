import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

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
