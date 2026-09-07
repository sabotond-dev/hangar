import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ROUTED } from "../src/lib/catalog/listing";

// AMENDMENT (D-07, plan 05.1-05). The image-serving test below looped
// FRONT_DOOR, which was right while the ROW WAS THE ROUTED SET - the other
// eight catalog entries had no page, so no <head> asked for their picture.
// D-07 made the catalog the routed set, and `ROUTED` in
// src/lib/catalog/listing.ts is the one declaration of it, read here, by
// src/routes/c/[id]/+page.ts, by scripts/gen-og.mjs and by
// src/lib/og/build.spec.ts. Left on FRONT_DOOR this test would have gone on
// passing over eight images while eight NEW pages served an og:image that
// 404s - the same blindness src/lib/og/build.spec.ts's header records, only
// over HTTP. The non-vacuity floor rises from >= 8 to >= 16 with it, so a
// quietly shortened set is red rather than merely cheaper.

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
// deployed artifact SERVES it, with the content type an unfurl needs. The
// routed set itself is imported rather than a list of ids, exactly as
// e2e/first-experience.e2e.ts does, so a widened catalog is covered here
// without anyone editing this file.
//
// The `request` fixture rather than `page.goto`: nothing about rendering
// belongs in a test about serving, and the config's top-level httpCredentials
// apply to it.
test("every configuration's link image is served by the built site", async ({
  request,
}) => {
  // Non-vacuous: a shortened routed set would otherwise make this test pass on
  // fewer images rather than fail on the ones that stopped being served.
  // A HUMAN-CHOSEN NON-VACUITY FLOOR, NOT A COUNT. It was 16 while the catalog
  // was sixteen and said nothing at all at thirty-six; plan 09-10 raised it. It
  // stays a literal on purpose - `toBeGreaterThanOrEqual(ROUTED.length)` is a
  // tautology, and the point of the line is a number somebody picked.
  expect(ROUTED.length, "there are images to check").toBeGreaterThanOrEqual(36);
  for (const entry of ROUTED) {
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
