/**
 * FOUND-02 / 10-UI-SPEC 17: the gate npm run licenses cannot be. The licence
 * checker inspects the npm tree and nothing else, so a hand-committed .woff2
 * would land in the GPLv3 section 6(d) source archive unseen. The walk is over
 * git ls-files (git archive HEAD ships the index): exactly one font-shaped
 * path, static/fonts/GRIFTER-Bold.woff2, with one allowlist row, and test 4
 * asserts it is export-ignored in .gitattributes. Test 6 (13-03) holds
 * src/lib/assets/wordmark.svg as the three-edit derivation of the supplied
 * bible/hangar-logo-w.svg (D-14 Q14): an asset's shape is this gate's subject.
 * Decided at 10-01 / 10-02-03 / 13-03; see .planning/phases/13-gui-overhaul/13-03-SUMMARY.md
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const read = (file: string) => readFileSync(REPO_ROOT + file, "utf8");

/**
 * A font binary, by extension. `.eot` is here even though nothing on this site
 * would ever serve one: the gate is about what may sit in the archive, and a
 * format nobody uses is exactly the kind of file that arrives by accident.
 */
const FONT_SHAPED = /\.(woff2?|ttf|otf|eot)$/i;

/** Everything git would put in `git archive HEAD`, one path per line. */
const tracked = execFileSync("git", ["ls-files"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
})
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

/**
 * One permitted font binary, with the record that permits it.
 *
 * A ROW IS NOT AN SPDX IDENTIFIER, and test 3 asserts that it is not.
 * D-13's mechanism records the FAMILY, the LICENSEE and the LICENCE NAME for a
 * font that is served from the site but is NOT redistributed with it, and the
 * archive exclusion in `.gitattributes` is what keeps it out of
 * `git archive HEAD`. An SPDX identifier here would be a claim of
 * redistribution rights we may not be in a position to make - which is the
 * whole reason this record exists beside `gen-licenses.mjs`'s SPDX allowlist
 * rather than inside it.
 */
interface FontRecord {
  /** Repository-relative, forward slashes, exactly as `git ls-files` prints it. */
  readonly path: string;
  /** The family the `@font-face` in `src/app.css` names. */
  readonly family: string;
  /** Who holds the licence. A person or a company, never "us". */
  readonly licensee: string;
  /** The licence's own name, as the foundry writes it. Never an SPDX id. */
  readonly licence: string;
}

/**
 * Every font binary permitted in the tracked tree, with the record that
 * permits it. A row is added deliberately, in a commit, with a reason - the
 * same contract `gen-licenses.mjs:41`'s SPDX allowlist carries.
 *
 * One row, added by 10-02-03: `static/fonts/GRIFTER-Bold.woff2`, which closes
 * test 4's vacuous branch.
 */
const ALLOWED_FONTS: readonly FontRecord[] = [
  {
    path: "static/fonts/GRIFTER-Bold.woff2",
    family: "Grifter Bold",
    licensee: "Botond Sandor / Intech Studio",
    licence: "Hanson Method commercial licence, held by the licensee",
    // NOT an SPDX id, NOT a redistributable file. D-13: the binary is served
    // from the site and export-ignored from `git archive HEAD`; the note at
    // static/fonts/README.md stands in the archive in its place.
    //
    // There is deliberately no `exportIgnored: true` field. The plan's draft
    // row carried one; it would be a second source of truth for a fact test 4
    // already reads out of `.gitattributes`, and a record that can disagree
    // with the file it describes is worse than no record. The exclusion is
    // asserted, not declared.
  },
];

/** SPDX short identifiers look like `OFL-1.1`, `GPL-3.0-or-later`, `BSD-2-Clause`. */
const SPDX_SHAPED = /^[A-Z][A-Za-z0-9.+-]*-[0-9]/;

const fontShaped = tracked.filter((path) => FONT_SHAPED.test(path));
const outsideLicenses = fontShaped.filter(
  (path) => !path.startsWith("licenses/"),
);

describe("FOUND-02 tracked font binaries (the gate npm run licenses cannot be)", () => {
  it("every tracked font binary outside licenses/ carries an allowlist row", () => {
    // Non-vacuity first. "No offending path was found" means nothing at all
    // until the walk is proved to have read the tree.
    expect(tracked.length, "git ls-files was actually read").toBeGreaterThan(
      100,
    );

    // And the matcher is proved to fire, because an allowlist checked with a
    // regular expression that matches nothing is green forever. This is the
    // half that a planted .woff2 would otherwise be the only witness for.
    for (const shape of [
      "static/fonts/x.woff2",
      "static/fonts/x.woff",
      "src/lib/assets/x.ttf",
      "a/b/X.OTF",
      "vendor/x.eot",
    ]) {
      expect(FONT_SHAPED.test(shape), `${shape} is font-shaped`).toBe(true);
    }
    for (const shape of [
      "licenses/@fontsource-variable/inter@5.3.0-LICENSE.txt",
      "src/app.css",
      "docs/woff2.md",
    ]) {
      expect(FONT_SHAPED.test(shape), `${shape} is not font-shaped`).toBe(
        false,
      );
    }

    const permitted = new Set(ALLOWED_FONTS.map((row) => row.path));
    for (const path of outsideLicenses) {
      expect(
        permitted.has(path),
        `${path} is a tracked font binary outside licenses/ with no row in ALLOWED_FONTS. ` +
          "npm run licenses cannot see it, so it would reach the source archive unrecorded. " +
          "Add a row with its family, licensee and licence name, or do not track the file.",
      ).toBe(true);
    }
  });

  it("every allowlist row points at a path that is tracked and on disk", () => {
    // Both directions, the rule copy.spec.ts uses on KNOWN_TAGS: a retired row
    // is red too, because a record that outlives its file is a record nobody
    // will notice is wrong.
    const trackedSet = new Set(tracked);
    for (const row of ALLOWED_FONTS) {
      expect(
        trackedSet.has(row.path),
        `ALLOWED_FONTS names ${row.path}, which git ls-files does not track`,
      ).toBe(true);
      expect(
        existsSync(REPO_ROOT + row.path),
        `ALLOWED_FONTS names ${row.path}, which is not on disk`,
      ).toBe(true);
      expect(
        FONT_SHAPED.test(row.path),
        `ALLOWED_FONTS names ${row.path}, which is not a font binary`,
      ).toBe(true);
    }
    expect(
      ALLOWED_FONTS.length,
      "the allowlist is a list (empty is a legitimate state, and is today's)",
    ).toBeGreaterThanOrEqual(0);
  });

  it("every allowlist row carries a family, a licensee and a licence that is not an SPDX id", () => {
    // The matcher is proved to fire before it is trusted, and it has to be:
    // with an empty allowlist the loop below makes no assertion at all, and a
    // regular expression that matched nothing would pass this test forever.
    for (const spdx of ["OFL-1.1", "GPL-3.0-or-later", "BSD-2-Clause"]) {
      expect(SPDX_SHAPED.test(spdx), `${spdx} is SPDX-shaped`).toBe(true);
    }
    for (const name of [
      "HANSON METHOD personal use",
      "Grifter, licensed to Intech Studio",
      "SIL Open Font License",
    ]) {
      expect(SPDX_SHAPED.test(name), `"${name}" is not SPDX-shaped`).toBe(
        false,
      );
    }

    for (const row of ALLOWED_FONTS) {
      expect(row.family.trim(), `${row.path} names its family`).not.toBe("");
      expect(
        row.licensee.trim(),
        `${row.path} names who holds the licence`,
      ).not.toBe("");
      expect(row.licence.trim(), `${row.path} names its licence`).not.toBe("");
      expect(
        SPDX_SHAPED.test(row.licence.trim()),
        `${row.path} records "${row.licence}", which is SPDX-shaped. ` +
          "A font recorded here is one we serve and do NOT redistribute, so an " +
          "SPDX identifier would claim a permission D-13 says we may not have. " +
          "Write the licence's own name.",
      ).toBe(false);
    }
  });

  it("every allowlisted path is export-ignored in .gitattributes", () => {
    const gitattributes = read(".gitattributes");
    expect(
      gitattributes.length,
      ".gitattributes was actually read",
    ).toBeGreaterThan(0);
    expect(
      gitattributes,
      ".gitattributes still excludes the planning material, so the file this test reads is the real one",
    ).toContain("export-ignore");

    expect(
      ALLOWED_FONTS.length === 0 ||
        ALLOWED_FONTS.every((row) =>
          new RegExp(
            `^\\s*${row.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+export-ignore\\s*$`,
            "m",
          ).test(gitattributes),
        ),
      "every allowlisted font is export-ignored, so the record and the exclusion cannot drift apart. " +
        "Missing an `<path> export-ignore` line in .gitattributes for one of: " +
        ALLOWED_FONTS.map((row) => row.path).join(", ") +
        ". (This branch was vacuously true while ALLOWED_FONTS was empty; 10-02-03 closed it.)",
    ).toBe(true);
  });

  it("gen-licenses.mjs names every allowlisted family", () => {
    const script = read("scripts/gen-licenses.mjs");
    expect(
      script.length,
      "scripts/gen-licenses.mjs was actually read",
    ).toBeGreaterThan(0);
    expect(
      script,
      "gen-licenses.mjs is still the generator this test means",
    ).toContain("THIRD-PARTY.md");

    for (const row of ALLOWED_FONTS) {
      expect(
        script.includes(row.family),
        `gen-licenses.mjs does not name "${row.family}", so THIRD-PARTY.md would omit ` +
          `${row.path} while the file stays in the tree`,
      ).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // PLAN 13-03: THE WORDMARK ASSET, the one non-font file this gate holds.
  //
  // src/lib/assets/wordmark.svg is bible/hangar-logo-w.svg with exactly three
  // edits (D-14 Q14): the viewBox re-cropped to the ink box, width and height
  // stripped, and six #ffffff fills changed to currentColor. This test holds
  // all three, and it RE-MEASURES the ink box from the path data - absolute
  // M/L/C/Z, cubic extrema solved - rather than trusting the number the
  // research parsed or the number the asset carries, so an "optimisation" that
  // re-crops the box wrong, rounds a coordinate, or reintroduces a dimension
  // is red here.
  // -------------------------------------------------------------------------
  it("the wordmark asset has no dimensions, six currentColor fills, zero hex fills, and a viewBox equal to its re-measured ink box at 8.06:1", () => {
    const path = "src/lib/assets/wordmark.svg";
    expect(existsSync(REPO_ROOT + path), `${path} exists`).toBe(true);
    const svg = read(path);
    expect(svg.length, "the asset was actually read").toBeGreaterThan(1000);

    // No width, no height: the box is the CSS's to set.
    expect(/\swidth\s*=/.test(svg), "no width attribute").toBe(false);
    expect(/\sheight\s*=/.test(svg), "no height attribute").toBe(false);

    // Six paths, six currentColor fills, no hex anywhere, nothing added.
    const paths = [...svg.matchAll(/<path\b[^>]*\sd="([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(paths.length, "the mark is six paths").toBe(6);
    const fills = [...svg.matchAll(/\bfill="([^"]*)"/g)].map((m) => m[1]);
    expect(
      fills.filter((f) => f === "currentColor").length,
      `six currentColor fills (got ${fills.join(", ")})`,
    ).toBe(6);
    expect(
      (svg.match(/#[0-9a-fA-F]{3,8}/g) ?? []).length,
      "zero hex colours - a fill that is not currentColor cannot serve the header, a focus state and print from one asset",
    ).toBe(0);
    expect(/<(defs|style|text)\b/.test(svg), "nothing was added").toBe(false);

    // Re-measure the ink box from the path data.
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const grow = (x: number, y: number) => {
      box.x0 = Math.min(box.x0, x);
      box.y0 = Math.min(box.y0, y);
      box.x1 = Math.max(box.x1, x);
      box.y1 = Math.max(box.y1, y);
    };
    // Where a cubic's derivative is zero on one axis, inside (0, 1).
    const extrema = (p0: number, p1: number, p2: number, p3: number) => {
      const a = -p0 + 3 * p1 - 3 * p2 + p3;
      const b = 2 * (p0 - 2 * p1 + p2);
      const c = p1 - p0;
      const ts: number[] = [];
      if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) > 1e-12) ts.push(-c / b);
      } else {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          const s = Math.sqrt(disc);
          ts.push((-b + s) / (2 * a), (-b - s) / (2 * a));
        }
      }
      return ts
        .filter((t) => t > 0 && t < 1)
        .map(
          (t) =>
            (1 - t) ** 3 * p0 +
            3 * (1 - t) ** 2 * t * p1 +
            3 * (1 - t) * t * t * p2 +
            t ** 3 * p3,
        );
    };
    let segments = 0;
    for (const d of paths) {
      const tokens = d.match(/[A-Za-z]|-?[0-9.]+/g) ?? [];
      let i = 0;
      let cmd = "";
      let cx = 0;
      let cy = 0;
      const num = () => Number.parseFloat(tokens[i++]);
      while (i < tokens.length) {
        if (/[A-Za-z]/.test(tokens[i])) {
          cmd = tokens[i++];
          expect(
            "MLCZ".includes(cmd),
            `path command ${cmd} is one this measurement understands (absolute M, L, C, Z only)`,
          ).toBe(true);
          if (cmd === "Z") continue;
        }
        segments += 1;
        if (cmd === "M" || cmd === "L") {
          cx = num();
          cy = num();
          grow(cx, cy);
          if (cmd === "M") cmd = "L";
        } else {
          const x1 = num();
          const y1 = num();
          const x2 = num();
          const y2 = num();
          const x = num();
          const y = num();
          for (const ex of extrema(cx, x1, x2, x)) grow(ex, cy);
          for (const ey of extrema(cy, y1, y2, y)) grow(cx, ey);
          cx = x;
          cy = y;
          grow(cx, cy);
        }
      }
    }
    expect(segments, "the paths carried segments to measure").toBeGreaterThan(
      50,
    );

    // The viewBox IS the ink box, to a hundredth of a unit on each edge.
    const viewBox = /viewBox="([^"]*)"/.exec(svg)?.[1] ?? "";
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
    const measured = [box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0];
    for (const [i, name] of ["x", "y", "width", "height"].entries()) {
      expect(
        Math.abs([vx, vy, vw, vh][i] - measured[i]),
        `viewBox ${name} ${[vx, vy, vw, vh][i]} is the re-measured ink box's ${measured[i].toFixed(3)} within 0.01`,
      ).toBeLessThan(0.01);
    }
    // And the aspect ratio is the mark's own 8.06 : 1, within 0.01.
    const ratio = vw / vh;
    expect(
      Math.abs(ratio - 8.06),
      `the viewBox is ${ratio.toFixed(3)} : 1; the mark is 8.06 : 1 (698.586 x 86.711) and a re-crop that moves it by more than 0.01 is wrong`,
    ).toBeLessThan(0.01);
  });
});
