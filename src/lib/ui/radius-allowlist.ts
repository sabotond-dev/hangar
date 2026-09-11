// D-01, THE ONE STANDING OVERRIDE, AS A GATE RATHER THAN A CONVENTION.
//
// 13-CONTEXT.md D-01, verbatim: "never use rounded corners for anything. The
// spec's own §12 geometry - control radius 6px, light cells 2-3px, dialogs 10px
// - is overridden to ZERO EVERYWHERE. This ships as a GATE: a test that fails
// on any border-radius above 0 in shipped CSS, so it cannot regress by habit."
//
// THIS MODULE IS THE ONE DECLARATION THE GATE'S THREE LAYERS SHARE. It is not a
// spec: src/lib/ui/radius.spec.ts (layer A, the source scan; layer B, the
// built-CSS scan) and e2e/radius.e2e.ts (layer C, the computed-style sweep in
// two browser engines) both import it, so the allowlist and the six circles are
// written once. Nothing in the site imports it - it reads the file system and
// would never survive a bundle - which is the same arrangement
// src/lib/catalog/divergence.ts has with presets.spec.ts and frames.spec.ts:
// a table moved out of a spec so a second reader can exist.
//
// D-10 HAS TWO HALVES AND THEY LIVE IN TWO LAYERS ON PURPOSE. "True circles
// are exempt; rounded rectangles are not." A source scan can see that a value
// is the literal 50% and CANNOT see the box it sits on: 50% on a 12x12 thumb is
// a circle and is permitted, 50% on a 40x24 chip is a pill wearing a circle's
// clothes and is forbidden. So layer A permits the literal 50% - and only at
// the six file:line pairs D-15 names - and layer C measures every element the
// browser computes a percentage radius on and fails it if width and height
// differ by more than one device pixel. Neither layer alone is D-10.
//
// D-15 NAMES SIX, BY FILE AND LINE, AND THE COUNT IS ASSERTED AT EXACTLY SIX.
// D-10 named the colour picker's three; the plan-check found Knob's three -
// genuine circles on square boxes, and the PDF draws the Movement rate slider
// with a round lime thumb and the Sandbox Knob as a circle - and the user
// extended the exemption to all six. A seventh 50% anywhere is red until it is
// added to D-15 by name and to CIRCLES below on the same day. A circle that
// moves file or line is red too: that is a deliberate amendment, not a drift.
// (D-15's own gloss calls :829 "the rail thumb" and :857/:872 "markers"; the
// source says :829 is the 2px tick, :857 the 12px thumb and :872 the 2px home
// mark. The PAIRS are the decision; the glosses here follow the source.)
//
// THE ALLOWLIST CAN ONLY SHRINK, AND 13-20 ASSERTS IT IS EMPTY. On 2026-09-11
// the tree carried 41 border-radius declarations (the planner's 43 counted two
// comment lines, app.css:391 and Knob.svelte:25), in src/app.css and fifteen
// components. Two are `inherit` and exempt - the focus ring in app.css (:292
// before 13-01, :428 since 13-03) and Knob.svelte:569, both of which inherit
// from a box that will be zero - six are the circles, and the remaining
// THIRTY-THREE were the debt below, one row per file with the plan that clears
// it. 13-03 cleared the first row the same day (the pill, see below), so the
// debt is THIRTY-TWO in fifteen files. The shape is presets.spec.ts's
// INTENDED_DIVERGENCE and vendored-diff.spec.ts's manifest rows: a declared
// exception with an owner, and a gate that fails when the list grows, when a
// row over-counts, when a row goes stale, or when a file with no row carries a
// radius. Every plan that re-skins a component removes its row in the same
// commit; the empty list at 13-20 is this phase's proof of D-01, not a promise
// in a document.
//
// THE PILL WAS NOT A ROW'S EXCUSE. app.css's pill radius (999px, at :421 on
// the tree the plan read and :442 after 13-01's header) was a rounded
// rectangle under D-10 and was REMOVED by 13-03 on 2026-09-11, not re-skinned;
// its row was cleared in the same commit. src/app.css now carries no
// border-radius above zero and has no row.
//
// ZERO, 0px, inherit, initial AND unset ARE NOT DECLARATIONS FOR THIS PURPOSE.
// `inherit` from a zero is zero, and the two focus rings inherit from whatever
// they wrap; `initial` and `unset` are zero by the property's definition.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** Values that are zero for this purpose and never counted. */
export const EXEMPT_VALUES: ReadonlySet<string> = new Set([
  "0",
  "0px",
  "inherit",
  "initial",
  "unset",
]);

/** The one value above zero any layer permits, and only on a square box. */
export const CIRCLE_VALUE = "50%";

export interface Circle {
  file: string;
  line: number;
  what: string;
  box: string;
}

/**
 * D-15's six, by file and line. Order is the decision's own. A change here is
 * an amendment to 13-CONTEXT.md D-15 and is dated there first.
 */
export const CIRCLES: readonly Circle[] = [
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 829,
    what: "the tick, a 2px round mark on the cheap steps",
    box: "2x2",
  },
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 857,
    what: "the rail thumb",
    box: "12x12",
  },
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 872,
    what: "the home mark",
    box: "2x2",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    line: 598,
    what: "the dot rail's dot",
    box: "8x8",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    line: 653,
    what: "the slider thumb",
    box: "12x12",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    line: 674,
    what: "the home mark",
    box: "2x2",
  },
];

export interface AllowlistRow {
  /** Repository-relative, forward slashes. */
  file: string;
  /**
   * The number of border-radius declarations above zero in this file that
   * are NOT one of CIRCLES. Asserted EQUAL to the observed count: more is
   * growth, fewer is an over-count that a clearing plan forgot to reduce,
   * zero is a stale row. This is what must reach zero.
   */
  declarations: number;
  /** The plan that clears it, as `13-NN`, optionally ` (deleted)`. */
  clearedBy: string;
  /** Documentation only, cross-checked against CIRCLES for this file. */
  circles?: number;
  circleLines?: readonly number[];
  note?: string;
}

/**
 * The debt on 2026-09-11: thirty-three declarations in sixteen files as 13-01
 * left it, thirty-two in fifteen after 13-03 removed the pill, thirty in
 * fourteen after 13-04 cleared PadFrame's two on the same day (the frame's
 * 10px removed under D-01, and Layer S's 4px deleted with the CRT under D-09).
 * Rows are removed by the plan named, never edited to a smaller number by
 * anyone else.
 */
export const ALLOWLIST: readonly AllowlistRow[] = [
  {
    file: "src/lib/ui/ScreenToggle.svelte",
    declarations: 2,
    clearedBy: "13-04 (deleted)",
  },
  {
    file: "src/lib/ui/BrowseToolbar.svelte",
    declarations: 1,
    clearedBy: "13-08",
  },
  {
    file: "src/lib/ui/CatalogCard.svelte",
    declarations: 3,
    clearedBy: "13-08",
  },
  {
    file: "src/lib/ui/FacetRow.svelte",
    declarations: 1,
    clearedBy: "13-08",
  },
  {
    file: "src/lib/ui/TuningRegion.svelte",
    declarations: 1,
    clearedBy: "13-09",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    declarations: 5,
    clearedBy: "13-09",
    circles: 3,
    circleLines: [598, 653, 674],
    note: "dot rail, slider thumb, home mark - three 50% survive under D-15 and nothing here becomes a square; the five non-circle declarations (:635, :701, :761, :858, :911) are cleared. :569 is inherit and exempt. The planner's 'ten' counted the comment at :25 and the inherit.",
  },
  {
    file: "src/lib/ui/ColourPicker.svelte",
    declarations: 6,
    clearedBy: "13-09",
    circles: 3,
    circleLines: [829, 857, 872],
    note: "tick, rail thumb, home mark - three 50% survive under D-10 and D-15; the six non-circle declarations (:654, :688, :749, :787, :839, :878) are cleared.",
  },
  {
    file: "src/lib/ui/ChosenPanel.svelte",
    declarations: 2,
    clearedBy: "13-09 (deleted)",
  },
  {
    file: "src/lib/ui/NamePlate.svelte",
    declarations: 1,
    clearedBy: "13-09 (deleted)",
  },
  {
    file: "src/lib/ui/CopyLink.svelte",
    declarations: 1,
    clearedBy: "13-09",
  },
  {
    file: "src/lib/ui/BudgetMeter.svelte",
    declarations: 3,
    clearedBy: "13-10",
  },
  {
    file: "src/lib/ui/MixTwo.svelte",
    declarations: 2,
    clearedBy: "13-10 (deleted)",
  },
  {
    file: "src/lib/ui/DeviceDetails.svelte",
    declarations: 1,
    clearedBy: "13-11",
  },
  {
    file: "src/lib/ui/KeepConfirm.svelte",
    declarations: 1,
    clearedBy: "13-11",
  },
];

/** The repository root, resolved from this file rather than from cwd. */
export const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

/** Repository-relative path with forward slashes, whatever the platform. */
export function rel(path: string): string {
  return relative(REPO_ROOT, path).split("\\").join("/");
}

/** Every file with one of the extensions under a directory, sorted. */
export function listSourceFiles(
  dir: string,
  extensions: readonly string[] = [".svelte", ".css"],
): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    for (const name of readdirSync(at).sort()) {
      const full = join(at, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (extensions.some((ext) => name.endsWith(ext))) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * Replace the contents of block comments (slash-star and HTML) and of
 * whole-line // comments with spaces of the same length, so a declaration
 * quoted in a comment is never counted and line numbers never move. Two of
 * the tree's 43 grep hits on 2026-09-11 were comment lines; this is why the
 * scan counts 41.
 */
export function blankComments(text: string): string {
  const blank = (s: string) => s.replace(/[^\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/^[ \t]*\/\/[^\n]*/gm, blank);
}

export interface Declaration {
  file: string;
  line: number;
  property: string;
  value: string;
}

/** The longhand and shorthand radius properties, never a custom property. */
const RADIUS_PROPERTY =
  /(?<![-\w])(border-(?:(?:top|bottom)-(?:left|right)-|(?:start|end)-(?:start|end)-)?radius)\s*:\s*([^;}"'\n]+)/g;

/** Whitespace-normalised, lowercase, so source and minified values compare. */
export function normaliseValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s*!important$/, "")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ");
}

export type Kind = "exempt" | "circle" | "above-zero";

export function classify(value: string): Kind {
  const v = normaliseValue(value);
  if (EXEMPT_VALUES.has(v)) return "exempt";
  if (v === CIRCLE_VALUE) return "circle";
  return "above-zero";
}

/** Every radius declaration in a text, comments blanked, with its line. */
export function declarationsInText(text: string, file: string): Declaration[] {
  const blanked = blankComments(text);
  const out: Declaration[] = [];
  for (const match of blanked.matchAll(RADIUS_PROPERTY)) {
    const line = blanked.slice(0, match.index).split("\n").length;
    out.push({
      file,
      line,
      property: match[1],
      value: normaliseValue(match[2]),
    });
  }
  return out;
}

/** Every radius declaration in one file on disk. */
export function declarationsIn(file: string): Declaration[] {
  return declarationsInText(readFileSync(file, "utf8"), rel(file));
}

/** Layer A's whole input: every declaration under src/, in file order. */
export function scanSource(root = join(REPO_ROOT, "src")): {
  files: string[];
  declarations: Declaration[];
} {
  const files = listSourceFiles(root);
  return {
    files: files.map(rel),
    declarations: files.flatMap(declarationsIn),
  };
}

/**
 * The values above zero the allowlisted files declare today. Layer B tolerates
 * exactly these in the built CSS and layer C tolerates exactly these computed
 * from an author rule; when ALLOWLIST is empty this set is empty and both
 * layers become strict. Derived at run time, never typed.
 */
export function allowlistedValues(
  declarations: readonly Declaration[],
): string[] {
  const files = new Set(ALLOWLIST.map((row) => row.file));
  const values = new Set<string>();
  for (const d of declarations) {
    if (files.has(d.file) && classify(d.value) === "above-zero") {
      values.add(d.value);
    }
  }
  return [...values].sort();
}

export interface ClassToken {
  file: string;
  line: number;
  token: string;
  where: string;
}

/**
 * A Tailwind rounded utility, named or arbitrary, as a whole token. Never
 * hyphen-prefixed: "fully-rounded" in a sentence is a word, not a class.
 */
const ROUNDED = /(?<![\w-])rounded(?:-[a-z0-9]+)*(?:-\[[^\]]*\])?(?![\w-])/g;

/**
 * Every `rounded*` token inside a class attribute, a class: directive, an
 * @apply line, or (in .ts) a string literal, comments blanked first. The
 * door that would let a utility radius in, and it has no allowlist at all.
 */
export function scanClassTokens(root = join(REPO_ROOT, "src")): ClassToken[] {
  const out: ClassToken[] = [];
  // Specs and tests render no markup, and their failure messages are prose
  // that names the utility on purpose, so the .ts arm skips them by file name.
  const files = listSourceFiles(root, [".svelte", ".css", ".ts"]).filter(
    (file) => !/\.(spec|test)\.[jt]s$/.test(file),
  );
  for (const file of files) {
    const text = blankComments(readFileSync(file, "utf8"));
    const lineOf = (index: number) => text.slice(0, index).split("\n").length;
    const patterns: [RegExp, string][] = file.endsWith(".ts")
      ? [[/(["'`])((?:(?!\1)[^\n])*)\1/g, "string literal"]]
      : [
          [/\bclass\s*=\s*"([^"]*)"/g, 'class="..."'],
          [/\bclass\s*=\s*'([^']*)'/g, "class='...'"],
          [/\bclass\s*=\s*\{([^}]*)\}/g, "class={...}"],
          [/\bclass:([a-z0-9-]+)/g, "class: directive"],
          [/@apply([^;]*);/g, "@apply"],
        ];
    for (const [pattern, where] of patterns) {
      for (const match of text.matchAll(pattern)) {
        const chunk = file.endsWith(".ts") ? match[2] : match[1];
        for (const token of chunk.matchAll(ROUNDED)) {
          out.push({
            file: rel(file),
            line: lineOf(match.index),
            token: token[0],
            where,
          });
        }
      }
    }
  }
  return out;
}
