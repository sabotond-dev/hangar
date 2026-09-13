// D-01, THE ONE STANDING OVERRIDE, AS A GATE RATHER THAN A CONVENTION: "never
// use rounded corners for anything ... overridden to ZERO EVERYWHERE". This
// module is the one declaration the gate's three layers share - radius.spec.ts
// (layer A the source scan, layer B the built CSS) and e2e/radius.e2e.ts
// (layer C, computed styles in two engines) import it; nothing in the site
// does. D-10's two halves live in two layers: layer A permits the literal 50%
// only at D-15's six file:line pairs (CIRCLES, asserted at exactly six -
// ColourPicker.svelte :840 the 2px tick, :867 the 12px thumb, :882 the 2px home
// mark; Knob.svelte :730, :785, :807); layer C fails any percentage radius on a
// box whose width and height differ. The allowlist can only shrink and is empty.
// Decided at 13-01 (D-01, D-10, D-15); see .planning/phases/13-gui-overhaul/13-01-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** Values that are zero for this purpose and never counted. */
const EXEMPT_VALUES: ReadonlySet<string> = new Set([
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
  // ColourPicker.svelte's three moved from :829 / :857 / :872 to :840 / :867
  // / :882 on 2026-09-11 when 13-09 cleared its six non-circle radii and put
  // the popover's prop above them; D-15 is amended with the same numbers.
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 840,
    what: "the tick, a 2px round mark on the cheap steps",
    box: "2x2",
  },
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 867,
    what: "the rail thumb",
    box: "12x12",
  },
  {
    file: "src/lib/ui/ColourPicker.svelte",
    line: 882,
    what: "the home mark",
    box: "2x2",
  },
  // Knob.svelte's three moved from :598 / :653 / :674 to :730 / :785 / :807
  // on 2026-09-11 when 13-09 re-skinned the file (the select branch, the
  // marker and the per-field reset landed above them); D-15 is amended with
  // the same three numbers on the same day.
  {
    file: "src/lib/ui/Knob.svelte",
    line: 730,
    what: "the dot rail's dot",
    box: "8x8",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    line: 785,
    what: "the slider thumb",
    box: "12x12",
  },
  {
    file: "src/lib/ui/Knob.svelte",
    line: 807,
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
 * The debt: thirty-three declarations in sixteen files as 13-01 left it, ZERO
 * after 13-11 - nine plans cleared their rows in the same commit that re-skinned
 * or deleted the file (the walk is 13-20-SUMMARY.md's). Rows are removed by the
 * plan named, never edited to a smaller number; a row added from here is a new
 * debt and needs a plan's name. THE LIST IS EMPTY, and 13-20 asserts it.
 */
export const ALLOWLIST: readonly AllowlistRow[] = [];

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
function normaliseValue(value: string): string {
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
function declarationsIn(file: string): Declaration[] {
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
