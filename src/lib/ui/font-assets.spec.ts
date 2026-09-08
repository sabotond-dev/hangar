/**
 * FOUND-02 / 10-UI-SPEC §17: the gate `npm run licenses` cannot be.
 *
 * `scripts/gen-licenses.mjs` runs `license-checker-rseidelsohn --production`,
 * which inspects the npm dependency tree and nothing else. It has no
 * visibility into `static/` or `src/lib/assets/`, so a hand-committed `.woff2`
 * sails through `npm run licenses`, `npm run build` and `npm run deploy` and
 * lands in the public source tarball that `scripts/postbuild.mjs` makes with
 * `git archive HEAD`. That tarball is HANGAR's GPLv3 section 6(d)
 * Corresponding Source: a font we may display but may not redistribute has no
 * business in it.
 *
 * THE WALK IS OVER `git ls-files`, NOT THE WORKING DIRECTORY. An untracked
 * font is not in the archive and is not this gate's business; a `.gitignore`d
 * one is not either. `git archive HEAD` ships the index, so the index is what
 * is scanned.
 *
 * THE CENSUS AS THIS FILE ARRIVES, verified in plan 10-01 on 2026-09-08:
 * `git ls-files | grep -Ei "\.(woff2?|ttf|otf)$"` prints NOTHING and exits 1.
 * The only font-shaped tracked path is
 * `licenses/@fontsource/quicksand@5.3.0-LICENSE.txt`, which is a `.txt` and is
 * inside `licenses/`. §17's phrasing - "`git ls-files` returns exactly one
 * font-shaped path" - reads as though that path were a binary; it is not, and
 * this note is the correction. The allowlist was therefore empty on arrival.
 *
 * THE CENSUS AS IT NOW STANDS, after plan 10-02-03 on 2026-09-08:
 * `git ls-files | grep -Ei "\.(woff2?|ttf|otf)$"` prints exactly one path,
 * `static/fonts/GRIFTER-Bold.woff2`, and the allowlist below carries exactly
 * one row for it. Quicksand was uninstalled in the same commit, so its licence
 * text is gone from `licenses/` and the `.txt` used below to prove FONT_SHAPED
 * does NOT fire on a licence path is Inter's. Test 4's vacuous branch is now
 * closed: it reads `.gitattributes` and asserts the path is `export-ignore`d.
 *
 * NO TEST HERE WAS EDITED TO ACCEPT THE ROW. All five were written in 10-01 to
 * take it unchanged, and they did; the two edits in 10-02-03 are this census
 * note and the one fixture string that named an uninstalled package.
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
});
