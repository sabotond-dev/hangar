import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ROUTED } from "../src/lib/catalog/listing";

// AMENDMENT (D-07, plan 05.1-05). The image-serving test below looped
// FRONT_DOOR, which was right while the ROW WAS THE ROUTED SET - the other
// eight catalog entries had no page, so no <head> asked for their picture.
// D-07 made the catalog the routed set, and `ROUTED` in
// src/lib/catalog/listing.ts is the one declaration of it, read here, by
// src/routes/playground/[id]/+page.ts, by scripts/gen-og.mjs and by
// src/lib/og/build.spec.ts. Left on FRONT_DOOR this test would have gone on
// passing over eight images while eight NEW pages served an og:image that
// 404s - the same blindness src/lib/og/build.spec.ts's header records, only
// over HTTP. The non-vacuity floor rises from >= 8 to >= 16 with it, so a
// quietly shortened set is red rather than merely cheaper.

// THIS FILE READS THE BUILD AND THEN COMPARES IT TO git, RATHER THAN NAMING A
// FILE OUT OF git AND ASKING WHETHER IT EXISTS (plan 11-08.1).
//
// The old shape ran `git rev-parse HEAD` at MODULE LOAD - in every worker - and
// asserted `build/source-<that sha>.tar.gz` existed. COMMITTING WHILE THE SUITE
// RUNS THEREFORE TURNED IT RED for a reason that had nothing to do with the
// code, and it reported that as "file missing", which is the one diagnosis that
// sends a reader looking in the wrong place. Moving the git read later makes it
// WORSE, not better: the archive is named for the sha the BUILD saw, so a later
// read is a fresher wrong answer.
//
// scripts/postbuild.mjs writes exactly one `source-<SHA>.tar.gz` into build/ and
// deletes every other one on its way, so the build itself is the authority.
// Glob it, assert there is exactly one, and hold ITS sha against HEAD with a
// message that names the two real causes. The assertion still bites in both
// directions - a missing archive is still red, a mismatched one is still red -
// and only its diagnosis improves.
//
// THE OTHER HALF OF THIS HAZARD IS NOT FIXABLE HERE AND IS RECORDED INSTEAD.
// playwright.config.ts carries `reuseExistingServer: !process.env.CI`, so a
// wrangler dev left over from an earlier run is reused and `npm run preview` -
// and with it `npm run build` - never re-runs. The whole suite can then silently
// test a stale build/. That config file is not edited in this phase, so the
// countermeasure is a RUN PROCEDURE: stop wrangler parents-first including both
// workerd children, run `npm run build` by hand, and only then start the suite.
// This test is what catches you when you forget.
const headSha = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

/** Every source archive the build left behind. postbuild.mjs writes one. */
function archives(): string[] {
  if (!existsSync("build")) return [];
  return readdirSync("build").filter(
    (name) => name.startsWith("source-") && name.endsWith(".tar.gz"),
  );
}

const found = archives();
const archive = `build/${found[0] ?? `source-${headSha}.tar.gz`}`;
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
  ]) {
    expect(existsSync(file), file).toBe(true);
  }

  // The archive, read off the build rather than named out of git.
  expect(
    found,
    "build/ holds exactly one source archive - postbuild.mjs writes one and deletes every other",
  ).toHaveLength(1);
  const built = found[0].slice("source-".length, -".tar.gz".length);
  expect(
    built,
    `the source archive is build/source-${built}.tar.gz and HEAD is ${headSha}: the build is stale, or HEAD moved during the run`,
  ).toBe(headSha);
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
  //
  // RE-CHOSEN IN PLAN 11-01. The nine bench removals took the routed set to 27,
  // so 36 stopped being a floor and became a permanent red. 27 is the whole
  // routed set today; what it guards from here is a set that shortens without
  // anybody editing this line.
  //
  // RE-CHOSEN IN PLAN 12-04. LATTICE, FORGE and SHUTTLE left on the user's
  // bench report, so 27 became a permanent red; 26 is the whole routed set.
  expect(ROUTED.length, "there are images to check").toBeGreaterThanOrEqual(26);
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
