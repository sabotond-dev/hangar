// THE NO-RADIUS GATE, LAYERS A AND B (plan 13-01, D-01, D-10, D-15).
//
// D-01 is the one standing override of the Bible: "never use rounded corners
// for anything." A convention erodes; a gate does not. This file is two of the
// gate's three layers, and it landed BEFORE the first component was re-skinned
// so that no plan of this phase could author a corner by habit:
//
//   A. THE SOURCE SCAN, below. Every border-radius declaration in every
//      .svelte and .css under src/ - the dev pages included, because a radius
//      authored there is still a radius - measured against the declared
//      allowlist in src/lib/ui/radius-allowlist.ts. Zero, 0px, inherit,
//      initial and unset pass. The literal 50% passes HERE and is handed to
//      layer C, with the count asserted at exactly THREE (six until change 16
//      took Knob.svelte's rail) and the file:line pairs matched against D-15
//      as a set, so a fourth circle anywhere is
//      red until D-15 names it. Every other value needs a row whose count
//      EQUALS the observed one. And any Tailwind `rounded*` token in a class
//      string is red with no allowlist at all.
//
//   B. THE BUILT-CSS SCAN, below. build/_app/immutable/assets/*.css, read
//      after `npm run build`, with the same value rule and NO allowlist except
//      the set of values the allowlisted source files actually declare -
//      because a built stylesheet has no file to attribute a rule to. This is
//      the layer that sees what the source cannot: on 2026-09-11 it found
//      `.rounded`, `.rounded-md` and `.rounded-full` in the shipped CSS, emitted
//      by Tailwind's scanner from the words "rounded-md" and "rounded-full" in
//      a PLANNING DOCUMENT. src/app.css now scopes the scanner to src/ and
//      refuses the rounded family at the compiler; this test is what proved it.
//      Absent build: RED, naming `npm run build`, unless HANGAR_SKIP_BUILT_CSS=1
//      - and then it is a real skip, which check-counts.mjs reports as one test
//      fewer, so a gated run cannot take the shortcut. A build older than the
//      newest source file is red for the same reason: a scan of a stale
//      artefact proves nothing.
//
//   C. THE COMPUTED-STYLE SWEEP, e2e/radius.e2e.ts, one @webkit title over
//      every route in both engines. The user-agent stylesheet - a search
//      field, a select, a button - carries radii no source scan can see, and
//      D-10's real rule (50% on a square box only) can only be measured by a
//      browser.
//
// THE ALLOWLIST CAN ONLY SHRINK. Four ways this file goes red, each with its
// own message so a plan sees which one it tripped: an unlisted file carries a
// declaration above zero; a listed file carries MORE than its row says; a
// listed file carries FEWER (a clearing plan forgot to shrink the row) or NONE
// (a stale row, which is how an allowlist becomes a permission); a class
// string carries a rounded utility. 13-20 asserts the list is empty, and that
// assertion - not a sentence in a document - is the phase's proof of D-01.
//
// app.css's pill (999px, :421 on the tree the plan read) was a rounded rectangle
// under D-10 and was removed by 13-03 on 2026-09-11, its row cleared in the same
// commit; it was a row until then, never an exception, and src/app.css now has
// no row because it carries no radius above zero.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALLOWLIST,
  CIRCLE_VALUE,
  CIRCLES,
  REPO_ROOT,
  allowlistedValues,
  classify,
  declarationsInText,
  listSourceFiles,
  scanClassTokens,
  scanSource,
  type Declaration,
} from "./radius-allowlist";

/** `13-NN`, optionally marked deleted. The phase that owns the debt. */
const PLAN_ID = /^13-[0-9]{2}( \(deleted\))?$/;

const BUILT_DIR = "build/_app/immutable/assets";

const at = (d: Declaration) => `${d.file}:${d.line}`;
const pair = (c: { file: string; line: number }) => `${c.file}:${c.line}`;

describe("D-01: never a rounded corner (src/lib/ui/radius.spec.ts)", () => {
  it("layer A: no border-radius above zero is authored outside the declared allowlist, the circles are exactly D-15's, and no rounded utility sits in a class string", () => {
    const { files, declarations } = scanSource();

    // Non-vacuous: the walk reached the stylesheet, a component and a dev
    // page. A glob that silently matched nothing would otherwise pass.
    expect(files.length, "files scanned under src/").toBeGreaterThan(40);
    for (const must of [
      "src/app.css",
      "src/lib/ui/Knob.svelte",
      "src/routes/dev/tune/+page.svelte",
    ]) {
      expect(files, `${must} is in the scan`).toContain(must);
    }

    // The rows themselves: unique, owned by a plan of this phase, and the
    // documentation fields agree with CIRCLES for that file.
    const rowFiles = ALLOWLIST.map((row) => row.file);
    expect(new Set(rowFiles).size, "no file has two rows").toBe(
      rowFiles.length,
    );
    for (const row of ALLOWLIST) {
      expect(
        row.clearedBy,
        `${row.file}: clearedBy names a Phase 13 plan`,
      ).toMatch(PLAN_ID);
      expect(
        row.declarations,
        `${row.file}: a row is a debt, never zero`,
      ).toBeGreaterThan(0);
      const circlesHere = CIRCLES.filter((c) => c.file === row.file).map(
        (c) => c.line,
      );
      expect(
        row.circles ?? 0,
        `${row.file}: the row's circles field must agree with CIRCLES (${circlesHere.length} there)`,
      ).toBe(circlesHere.length);
      expect(
        [...(row.circleLines ?? [])].sort((a, b) => a - b),
        `${row.file}: the row's circleLines must be D-15's for this file`,
      ).toEqual([...circlesHere].sort((a, b) => a - b));
    }

    // Classify every declaration.
    const circles = declarations.filter((d) => classify(d.value) === "circle");
    const aboveZero = declarations.filter(
      (d) => classify(d.value) === "above-zero",
    );

    // D-15: exactly three, and exactly these three, as a set.
    const wanted = new Set(CIRCLES.map(pair));
    const observed = new Set(circles.map(at));
    const seventh = circles.filter((d) => !wanted.has(at(d)));
    const missing = CIRCLES.filter((c) => !observed.has(pair(c)));
    expect(
      seventh.map((d) => `${at(d)} (${d.value})`),
      `a ${CIRCLE_VALUE} that D-15 does not name. True circles only, and only the three D-15 lists by file and line - a fourth is red until 13-CONTEXT.md D-15 and CIRCLES both name it`,
    ).toEqual([]);
    expect(
      missing.map((c) => `${pair(c)} (${c.what})`),
      `a D-15 circle is no longer at its named line. If it moved, amend D-15 and CIRCLES with the new line on the same day; if it was squared, D-15 says nothing in Knob.svelte or ColourPicker.svelte becomes a square`,
    ).toEqual([]);
    expect(
      circles.length,
      "the 50% count is exactly three (D-15 as change 16 amends it)",
    ).toBe(3);
    expect(CIRCLES.length, "D-15 names exactly three").toBe(3);

    // The four red paths, each its own assertion.
    const byFile = new Map<string, Declaration[]>();
    for (const d of aboveZero)
      byFile.set(d.file, [...(byFile.get(d.file) ?? []), d]);
    const rows = new Map(ALLOWLIST.map((row) => [row.file, row]));

    const unlisted: string[] = [];
    const grown: string[] = [];
    const overCounted: string[] = [];
    const stale: string[] = [];

    for (const [file, ds] of byFile) {
      const row = rows.get(file);
      if (!row) {
        unlisted.push(...ds.map((d) => `${at(d)} border-radius: ${d.value}`));
      } else if (ds.length > row.declarations) {
        grown.push(
          `${file}: ${ds.length} declarations above zero, row says ${row.declarations} (${ds.map((d) => `:${d.line} ${d.value}`).join(", ")})`,
        );
      } else if (ds.length < row.declarations) {
        overCounted.push(
          `${file}: row says ${row.declarations}, the file has ${ds.length} (${ds.map((d) => `:${d.line} ${d.value}`).join(", ")})`,
        );
      }
    }
    for (const row of ALLOWLIST) {
      if (!byFile.has(row.file)) {
        stale.push(
          `${row.file} (clearedBy ${row.clearedBy}): ${existsSync(join(REPO_ROOT, row.file)) ? "no declaration above zero remains" : "the file no longer exists"}`,
        );
      }
    }

    expect(
      unlisted,
      "a border-radius above zero in a file with NO allowlist row. D-01: never a rounded corner. There is no row to add - remove the radius",
    ).toEqual([]);
    expect(
      grown,
      "a file on the allowlist carries MORE declarations than its row says. The list only shrinks",
    ).toEqual([]);
    expect(
      overCounted,
      "a row over-counts its file: a declaration was cleared and the row was not reduced. Shrink the row in the same commit, or remove it",
    ).toEqual([]);
    expect(
      stale,
      "a stale row: the file carries no declaration above zero, or is gone. Remove the row - a cleared row that stays is how an allowlist becomes a permission",
    ).toEqual([]);

    // The door with no allowlist: Tailwind utilities.
    const tokens = scanClassTokens();
    expect(
      tokens.map((t) => `${t.file}:${t.line} ${t.where} carries "${t.token}"`),
      "a Tailwind rounded utility in a class string. There is no allowlist for this and never will be (D-01)",
    ).toEqual([]);

    const remaining = ALLOWLIST.reduce((n, row) => n + row.declarations, 0);
    console.log(
      `radius layer A: ${declarations.length} declarations in ${files.length} files scanned; ` +
        `${remaining} above zero remaining in ${ALLOWLIST.length} allowlisted files ` +
        `(${ALLOWLIST.map((r) => `${r.file.replace(/^src\/(lib\/ui\/)?/, "")} ${r.declarations} -> ${r.clearedBy}`).join("; ")}); ` +
        `${circles.length} circles (D-15): ${circles.map(at).join(", ")}; ` +
        `${declarations.length - aboveZero.length - circles.length} exempt`,
    );
  });

  it("layer B: the built CSS carries no radius above zero that the allowlisted sources did not declare, and it refuses to read a missing or stale build", (ctx) => {
    const built = join(REPO_ROOT, BUILT_DIR);
    if (!existsSync(built)) {
      if (process.env.HANGAR_SKIP_BUILT_CSS === "1") {
        console.log(
          `radius layer B: SKIPPED - ${BUILT_DIR} is absent and HANGAR_SKIP_BUILT_CSS=1. The built stylesheet was NOT checked; check-counts.mjs will see one test fewer, so a gated run cannot take this path`,
        );
        ctx.skip();
        return;
      }
      expect.fail(
        `${BUILT_DIR} does not exist. Layer B reads the built stylesheet and refuses to pass on nothing: run npm run build first. (HANGAR_SKIP_BUILT_CSS=1 skips this test, visibly, for a local loop only.)`,
      );
    }

    const cssFiles = readdirSync(built)
      .filter((name) => name.endsWith(".css"))
      .sort();
    expect(
      cssFiles.length,
      `${BUILT_DIR} holds at least one stylesheet`,
    ).toBeGreaterThan(0);

    // A stale build proves nothing. The oldest built stylesheet must be no
    // older than the newest source file the build compiles.
    const builtAt = Math.min(
      ...cssFiles.map((f) => statSync(join(built, f)).mtimeMs),
    );
    const sources = listSourceFiles(join(REPO_ROOT, "src"), [
      ".svelte",
      ".css",
    ]);
    let newest = { file: "", mtimeMs: 0 };
    for (const file of sources) {
      const { mtimeMs } = statSync(file);
      if (mtimeMs > newest.mtimeMs) newest = { file, mtimeMs };
    }
    expect(
      newest.mtimeMs <= builtAt,
      `${newest.file} was modified after ${BUILT_DIR} was written (source ${new Date(newest.mtimeMs).toISOString()}, build ${new Date(builtAt).toISOString()}): the build is stale and a scan of it proves nothing. Run npm run build first`,
    ).toBe(true);

    const tolerated = new Set(allowlistedValues(scanSource().declarations));

    const problems: string[] = [];
    let seen = 0;
    let circles = 0;
    for (const name of cssFiles) {
      const text = readFileSync(join(built, name), "utf8");
      for (const d of declarationsInText(text, `${BUILT_DIR}/${name}`)) {
        seen += 1;
        const kind = classify(d.value);
        if (kind === "exempt") continue;
        if (kind === "circle") {
          circles += 1;
          continue;
        }
        if (!tolerated.has(d.value)) {
          problems.push(`${d.file}: ${d.property}: ${d.value}`);
        }
      }
    }

    expect(
      problems,
      `a radius above zero in the BUILT stylesheet that no allowlisted source file declares (tolerated today: ${[...tolerated].join(", ") || "nothing - the allowlist is empty"}). Either a source scan missed it, a dependency shipped it, or Tailwind emitted a utility from a word somewhere - see src/app.css's @source lines`,
    ).toEqual([]);
    expect(
      circles,
      `more ${CIRCLE_VALUE} rules in the build than D-15 names (${CIRCLES.length}); a circle arrived from somewhere the source scan cannot see`,
    ).toBeLessThanOrEqual(CIRCLES.length);

    console.log(
      `radius layer B: ${seen} radius declarations in ${cssFiles.length} built stylesheets; ` +
        `${circles} of them ${CIRCLE_VALUE}; tolerated values from the allowlist: ${[...tolerated].join(", ") || "none"}; ` +
        `build ${new Date(builtAt).toISOString()}, newest source ${new Date(newest.mtimeMs).toISOString()}`,
    );
  });
});
