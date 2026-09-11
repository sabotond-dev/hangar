/**
 * IDENT-01, asserted as structure rather than promised in a comment.
 *
 * REWRITTEN BY PLAN 13-03 (2026-09-11), NOT AMENDED. This file shipped in
 * Phase 4 asserting eight tokens and two hexes, was widened to nine and three
 * in Phase 5 (X-27) and again in Phase 10 (G-01), and its central sentence was
 * "the only third hue is the over-budget alarm". That sentence is gone. The
 * Bible (bible/HANGAR-ZONA-GUI-design-specification.md §12, and all five
 * screens of bible/HANGAR for ZONA.pdf) renders every sentence in a
 * near-white, every secondary line in a warm grey, over four warm graphite
 * surfaces, and reserves the action colour for the primary action and the
 * current selection. The count moved from nine to eleven, and the IDEA moved
 * from "one hue at three alphas over black" to "graphite surfaces, near-white
 * text, one action colour". So the central sentence is now: THESE ELEVEN
 * VALUES AND NO TWELFTH.
 *
 * The house style is unchanged: read src/app.css, strip comments before
 * matching so a comment can never pass or fail a check, and prove a walk was
 * not empty before asserting anything about what it found.
 *
 * WHAT IS COMPUTED HERE AND WHY IT IS NOT PASTED. §12 publishes a contrast
 * table; this file recomputes every pair from the values in src/app.css
 * (WCAG 2.x relative luminance, sRGB) and asserts each to two decimals, so a
 * token edited by a tenth of a hex shows up as a ratio that moved. The table
 * was computed against #DCFF71, which is exactly the value D-16 fixed, so the
 * action row is the one the specification published. Two rules fall out of
 * the arithmetic and are gated rather than narrated:
 *
 *   1. --color-divider FAILS 3:1 on every surface (1.71 / 1.56 / 1.39). That
 *      is acceptable only while it is decorative, which is what WCAG 1.4.11
 *      exempts and what §12 calls it. So anything that bounds a control uses
 *      --color-boundary, and test 5 scans the sources for a divider on a
 *      control's border. A test that asserts a known failure (test 4) is how a
 *      decorative-only rule stays decorative.
 *   2. Raised-on-panel is 1.12:1 and panel-on-workspace is 1.09:1, so a
 *      selection distinguished by its fill alone is invisible. The PDF draws
 *      every selected rail row with THREE signals - a 3px action-colour left
 *      rule, the raised fill and an action-coloured label - and test 6 holds
 *      all three together so a later plan cannot drop the rule as decoration.
 *
 * THE TYPE SCALE is the PDF's measured 36 / 30 / 17 (page title, panel title,
 * group title), with §12's written 28-32 / 20 / 14 overridden by measurement
 * per D-17 - an override, not a reconciliation. Test 7 asserts the three
 * sizes and that 11px appears only as tracked uppercase.
 *
 * THREE TESTS ARE CARRIED FROM THE NINE-TOKEN FILE nearly or exactly
 * unchanged: the font stacks (8), every display @font-face named by
 * --font-display (9), and the favicon (11). The favicon is deliberately NOT
 * the wordmark: the site now has two marks with two jobs - the pad outline at
 * 1:1 for the icon, the wordmark at 8:1 for the header - which is what the PDF
 * shows. The focus ring (10) is carried with its token renamed.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT, blankComments, listSourceFiles } from "./radius-allowlist";

const root = (file: string) => new URL(`../../../${file}`, import.meta.url);
const text = (file: string) => readFileSync(root(file), "utf8");

/**
 * The one uniform comment stripper. Deliberately backslash-free so the same
 * expression can be quoted into a plan or a shell without an escape being
 * halved in transport.
 */
const strip = (t: string) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

/** Collapse whitespace and drop trailing zeros so `0.50` and `0.5` compare equal. */
const normalise = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/(\d)\.(\d*?)0+(?=\D|$)/g, (_m, whole: string, frac: string) =>
      frac.length > 0 ? `${whole}.${frac}` : whole,
    )
    .trim();

/**
 * The Bible's eleven (§12), in §12's own order, with --color-action at the
 * value D-16 fixed. Eleven, and no twelfth: --color-glow (one bloom) did not
 * survive - the bloom is --action-bloom outside @theme - and --color-over
 * became --color-error-ink.
 */
const TOKENS: ReadonlyArray<readonly [string, string, string]> = [
  ["--color-workspace", "#101210", "main background"],
  ["--color-panel", "#191c18", "rail and inspector"],
  ["--color-raised", "#22261f", "selected rows and secondary surfaces"],
  ["--color-divider", "#383e32", "decorative separation only"],
  ["--color-boundary", "#758168", "every control and every real boundary"],
  ["--color-ink", "#f0f1e9", "main labels and values"],
  ["--color-ink-quiet", "#acb3a2", "helper text and metadata"],
  ["--color-action", "#dcff71", "primary action, active outline, selection"],
  ["--color-on-action", "#19200d", "labels on the action colour"],
  ["--color-error-ink", "#ffc4ad", "validation and transfer errors"],
  ["--color-error-surface", "#35211d", "error message backgrounds"],
];

/** D-16, by name: the action colour is the Bible's, not Phase 4's #d6ff4e. */
const ACTION_BY_D16 = "#dcff71";

/**
 * §12's published contrast table, foreground on surface, two decimals. Every
 * cell is RECOMPUTED from src/app.css in test 3 and asserted equal to the
 * figure here - so this table is the claim and the file is the evidence, and
 * a value that drifts in either shows up as a moved ratio.
 */
const SURFACES = [
  "--color-workspace",
  "--color-panel",
  "--color-raised",
  "--color-error-surface",
] as const;
const CONTRAST_TABLE: ReadonlyArray<
  readonly [string, readonly [number, number, number, number]]
> = [
  ["--color-ink", [16.54, 15.13, 13.53, 13.32]],
  ["--color-ink-quiet", [8.71, 7.97, 7.12, 7.01]],
  ["--color-action", [16.65, 15.23, 13.62, 13.4]],
  ["--color-error-ink", [12.32, 11.27, 10.07, 9.92]],
  ["--color-boundary", [4.57, 4.18, 3.73, 3.68]],
  ["--color-divider", [1.71, 1.56, 1.39, 1.37]],
];
/** Text pairs: 4.5:1 on their surfaces. Error ink is text on the error surface. */
const TEXT_TOKENS = ["--color-ink", "--color-ink-quiet", "--color-action"];
/** Non-text: the boundary clears 3:1 on the three ordinary surfaces. */
const ORDINARY_SURFACES = 3;

/** The eight roles of the type scale, by class, with the size each declares. */
const TYPE_ROLES: ReadonlyArray<readonly [string, number, string]> = [
  [".type-display", 60, "display"],
  [".type-page-title", 36, "display"],
  [".type-panel-title", 30, "display"],
  [".type-group-title", 17, "sans"],
  [".type-base", 14, "sans"],
  [".type-helper", 13, "sans"],
  [".type-micro", 11, "display"],
  [".type-field", 15, "sans"],
];

const css = strip(text("src/app.css"));
const themeBlock = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

/** Read a custom property's value out of the stripped source. */
function declared(name: string): string | undefined {
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(css);
  return match ? normalise(match[1]) : undefined;
}

/** `#rrggbb` to channels 0-255, or null if it is not a six-digit hex. */
function channelsOf(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(
    hex.toLowerCase(),
  );
  if (!m) return null;
  return [
    Number.parseInt(m[1], 16),
    Number.parseInt(m[2], 16),
    Number.parseInt(m[3], 16),
  ];
}

/** WCAG 2.x relative luminance of an opaque sRGB colour. */
function luminance([r, g, b]: readonly [number, number, number]): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio of two opaque colours, either order. */
function contrast(a: string, b: string): number {
  const la = luminance(channelsOf(a) as [number, number, number]);
  const lb = luminance(channelsOf(b) as [number, number, number]);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The value of a token as declared in the file, asserted to be a hex. */
function tokenHex(name: string): string {
  const value = declared(name);
  expect(value, `${name} is declared in src/app.css`).toBeDefined();
  expect(
    channelsOf(value as string),
    `${name} is a six-digit hex, got ${value}`,
  ).not.toBeNull();
  return (value as string).toLowerCase();
}

// ---------------------------------------------------------------------------
// A small CSS reader shared by tests 5, 6 and 7. Rules are read with their
// nesting: an @media / @supports / @layer / @container prelude is descended
// into; @keyframes, @font-face and @theme are opaque. A rule is a selector
// and a body of declarations, with the line of its opening brace.
// ---------------------------------------------------------------------------
interface Rule {
  file: string;
  line: number;
  selector: string;
  body: string;
}

const DESCEND = /^@(media|supports|layer|container)\b/;

function rulesIn(cssText: string, file: string): Rule[] {
  const out: Rule[] = [];
  const lineOf = (index: number) => cssText.slice(0, index).split("\n").length;
  const walk = (from: number, to: number) => {
    let i = from;
    let preludeStart = from;
    while (i < to) {
      const ch = cssText[i];
      if (ch === ";") {
        preludeStart = i + 1;
        i += 1;
        continue;
      }
      if (ch === "{") {
        const prelude = cssText.slice(preludeStart, i).trim();
        // Find the matching brace.
        let depth = 1;
        let j = i + 1;
        while (j < to && depth > 0) {
          if (cssText[j] === "{") depth += 1;
          else if (cssText[j] === "}") depth -= 1;
          j += 1;
        }
        const bodyStart = i + 1;
        const bodyEnd = j - 1;
        if (DESCEND.test(prelude)) {
          walk(bodyStart, bodyEnd);
        } else if (!prelude.startsWith("@")) {
          // Declarations are the body text outside any nested block.
          let flat = "";
          let d = 0;
          for (let k = bodyStart; k < bodyEnd; k++) {
            const c = cssText[k];
            if (c === "{") d += 1;
            else if (c === "}") d -= 1;
            else if (d === 0) flat += c;
          }
          out.push({
            file,
            line: lineOf(i),
            selector: prelude.replace(/\s+/g, " "),
            body: flat,
          });
          // Nested rules inside an ordinary rule (CSS nesting) are read too.
          walk(bodyStart, bodyEnd);
        }
        i = j;
        preludeStart = j;
        continue;
      }
      i += 1;
    }
  };
  walk(0, cssText.length);
  return out;
}

/** `[property, value]` pairs of a body, property lowercased. */
function declarationsOf(body: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const piece of body.split(";")) {
    const t = piece.trim();
    const colon = t.indexOf(":");
    if (colon < 0) continue;
    out.push([
      t.slice(0, colon).trim().toLowerCase(),
      normalise(t.slice(colon + 1)),
    ]);
  }
  return out;
}

/** Replace every character but the newlines, so line numbers stay absolute. */
const blank = (s: string) => s.replace(/[^\n]/g, " ");

/**
 * The stylesheet half of a source file: the <style> block with the markup
 * around it blanked (newlines kept, so a reported line is the FILE's line),
 * or all of a .css.
 */
function styleOf(file: string, source: string): string {
  if (file.endsWith(".css")) return source;
  const m = /<style[^>]*>([^]*?)<\/style>/.exec(source);
  if (!m || m.index === undefined) return blank(source);
  const start = m.index + m[0].indexOf(m[1]);
  return (
    blank(source.slice(0, start)) +
    m[1] +
    blank(source.slice(start + m[1].length))
  );
}

/** The markup half of a .svelte file, the <style> block blanked. */
function templateOf(file: string, source: string): string {
  if (file.endsWith(".css")) return "";
  return source.replace(/<style[^>]*>[^]*?<\/style>/, blank);
}

/**
 * Every source file under src/ with its style and template halves, comments
 * blanked so a declaration quoted in a comment is never counted. The walk is
 * the same one radius.spec.ts uses, so the two gates cannot disagree about
 * what "every stylesheet" means.
 */
function sources(): Array<{ file: string; style: string; template: string }> {
  return listSourceFiles(join(REPO_ROOT, "src"), [".svelte", ".css"]).map(
    (full) => {
      const file = full
        .slice(REPO_ROOT.length)
        .split("\\")
        .join("/")
        .replace(/^\/+/, "");
      const blanked = blankComments(readFileSync(full, "utf8"));
      return {
        file,
        style: styleOf(file, blanked),
        template: templateOf(file, blanked),
      };
    },
  );
}

// ---------------------------------------------------------------------------
// Test 5's classifier: does a selector bound a CONTROL?
//
// A scan can tell an element selector (input, button, select, textarea, a,
// [role=...], [tabindex...]) from a decorative one. It cannot tell `.tag`
// from `.chip` by the selector alone, so every class in the selector is
// looked up in the same file's MARKUP: a class that sits on a control tag,
// or on any element carrying role= or tabindex=, is a control's class. What
// this cannot see, said plainly: a class applied through a `{...}` expression
// or through a child component, and a <label> wrapping a hidden input (see
// TagChip.svelte:136, recorded in 13-03-SUMMARY.md as the one known divider
// on a control-shaped box, 13-08's to settle).
// ---------------------------------------------------------------------------
const CONTROL_TAGS = ["input", "button", "select", "textarea", "a"];
const BOUNDING_PROPERTY =
  /^(border(-(top|right|bottom|left|inline|block)(-(start|end))?)?(-color)?|outline(-color)?)$/;

function controlClassesOf(template: string): Set<string> {
  const out = new Set<string>();
  for (const tag of template.matchAll(/<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    const name = tag[1].toLowerCase();
    const attrs = tag[2];
    const isControl =
      CONTROL_TAGS.includes(name) ||
      /\brole\s*=/.test(attrs) ||
      /\btabindex\s*=/.test(attrs);
    if (!isControl) continue;
    for (const m of attrs.matchAll(/\bclass\s*=\s*"([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/)) if (cls) out.add(cls);
    }
    for (const m of attrs.matchAll(/\bclass:([a-zA-Z0-9_-]+)/g)) out.add(m[1]);
  }
  return out;
}

function boundsAControl(
  selector: string,
  controlClasses: Set<string>,
): boolean {
  if (
    /(^|[\s>+~(,])(input|button|select|textarea|a)(?![a-zA-Z0-9_-])/.test(
      selector,
    )
  )
    return true;
  if (/\[(role|tabindex)\b/.test(selector)) return true;
  for (const m of selector.matchAll(/\.([a-zA-Z0-9_-]+)/g)) {
    if (controlClasses.has(m[1])) return true;
  }
  return false;
}

/** Divider-bordered controls in one file's style, as `file:line selector`. */
function dividerOnControls(file: string, style: string, template: string) {
  const controls = controlClassesOf(template);
  const hits: string[] = [];
  for (const rule of rulesIn(style, file)) {
    for (const [property, value] of declarationsOf(rule.body)) {
      if (!BOUNDING_PROPERTY.test(property)) continue;
      if (!value.includes("var(--color-divider)")) continue;
      if (boundsAControl(rule.selector, controls)) {
        hits.push(
          `${file}:${rule.line} ${rule.selector} { ${property}: ${value} }`,
        );
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Test 6's classifier: a SELECTED state painted in --color-raised.
//
// A selector is a selected state when it carries one of the markers below.
// For each such rule that paints --color-raised as its background, the three
// signals must be present in the file across the rules that share the same
// marker (the label's colour is usually on a descendant rule such as
// `.row[aria-selected="true"] .label`): a 3px action-colour left rule, and an
// action-coloured `color`.
// ---------------------------------------------------------------------------
const SELECTED_MARKER =
  /\[aria-(selected|current|pressed|checked)[^\]]*\]|:checked|\.(selected|is-selected|active|current|chosen)(?![a-zA-Z0-9_-])/;
const LEFT_RULE = /^border-(inline-start|left)$/;
const LEFT_RULE_VALUE = /^3px solid var\(--color-action\)$/;

function selectionProblems(
  file: string,
  style: string,
): {
  selectedFills: number;
  problems: string[];
} {
  const rules = rulesIn(style, file);
  const problems: string[] = [];
  let selectedFills = 0;
  for (const rule of rules) {
    const marker = SELECTED_MARKER.exec(rule.selector)?.[0];
    if (!marker) continue;
    const paintsRaised = declarationsOf(rule.body).some(
      ([p, v]) =>
        (p === "background" || p === "background-color") &&
        v.includes("var(--color-raised)"),
    );
    if (!paintsRaised) continue;
    selectedFills += 1;
    const family = rules.filter((r) => r.selector.includes(marker));
    const decls = family.flatMap((r) => declarationsOf(r.body));
    const hasLeftRule = decls.some(
      ([p, v]) => LEFT_RULE.test(p) && LEFT_RULE_VALUE.test(v),
    );
    const hasActionLabel = decls.some(
      ([p, v]) => p === "color" && v === "var(--color-action)",
    );
    if (!hasLeftRule || !hasActionLabel) {
      problems.push(
        `${file}:${rule.line} ${rule.selector} paints --color-raised as a selected state ${
          hasLeftRule
            ? ""
            : "WITHOUT a 3px solid var(--color-action) left rule "
        }${hasActionLabel ? "" : "WITHOUT an action-coloured label "}- selection is three signals, never a fill (raised-on-panel is 1.12:1)`,
      );
    }
  }
  return { selectedFills, problems };
}

describe("IDENT-01 identity tokens (src/app.css) - the Bible's eleven and no twelfth", () => {
  it("1. the token ladder is exactly these eleven names and no twelfth --color-* exists in the file", () => {
    // A twelfth is named BEFORE it is counted, so the red says which one.
    // Anywhere in the file: a twelfth declared in :root or in a rule is still
    // a twelfth. Declarations only - `var(--color-x)` is a use.
    const everywhere = [...css.matchAll(/(--color-[a-z-]+)\s*:/g)].map(
      (m) => m[1],
    );
    expect(
      everywhere.length,
      "src/app.css declares colour tokens to check",
    ).toBeGreaterThan(0);
    const twelfth = everywhere.filter(
      (name) => !TOKENS.some(([wanted]) => wanted === name),
    );
    expect(
      twelfth,
      "a --color-* declared in src/app.css that is not one of the Bible's eleven. The palette is these eleven values and no twelfth (§12); a bloom or a veil is declared outside @theme under another prefix",
    ).toEqual([]);
    expect(
      everywhere.length,
      "the eleven are declared once each and nowhere twice",
    ).toBe(TOKENS.length);

    // Inside @theme: exactly the eleven, as a set.
    const inTheme = [...themeBlock.matchAll(/(--color-[a-z-]+)\s*:/g)].map(
      (m) => m[1],
    );
    expect([...new Set(inTheme)].sort()).toEqual(
      TOKENS.map(([name]) => name).sort(),
    );
    expect(inTheme.length, "the @theme block declares the eleven").toBe(
      TOKENS.length,
    );

    // The retired names are gone as declarations, by name.
    for (const gone of [
      "--color-ground",
      "--color-line",
      "--color-line-soft",
      "--color-ink-dim",
      "--color-accent",
      "--color-glow",
      "--color-over",
    ]) {
      expect(declared(gone), `${gone} is no longer declared`).toBeUndefined();
    }
  });

  it("2. every one of the eleven parses as a colour and equals the Bible's value, --color-action equal to #DCFF71 by D-16 and to nothing else", () => {
    for (const [name, value, role] of TOKENS) {
      expect(tokenHex(name), `${name} (${role}) carries §12's value`).toBe(
        value,
      );
    }
    expect(tokenHex("--color-action"), "D-16: the Bible's action colour").toBe(
      ACTION_BY_D16,
    );
    expect(
      tokenHex("--color-action"),
      "D-16: not Phase 4's #d6ff4e - the retired value is recorded in 13-03-SUMMARY.md and IDENT-01's clause is amended by name at 13-20",
    ).not.toBe("#d6ff4e");

    // The one --action-bloom outside @theme is the action colour at an alpha
    // and nothing else, so no old accent survives as "a bloom".
    const bloom = declared("--action-bloom");
    expect(bloom, "--action-bloom is declared outside @theme").toBeDefined();
    const [r, g, b] = channelsOf(ACTION_BY_D16) as [number, number, number];
    expect(bloom).toMatch(new RegExp(`^rgb\\(${r} ${g} ${b} / 0\\.[0-9]+\\)$`));
    expect(themeBlock).not.toContain("--action-bloom");
  });

  it("3. the contrast table is computed from the file and every pair lands on §12's figure; text clears 4.5:1 and the boundary clears 3:1 on all three surfaces", () => {
    const surfaces = SURFACES.map(tokenHex);
    const lines: string[] = [];
    let cells = 0;
    for (const [name, expected] of CONTRAST_TABLE) {
      const fg = tokenHex(name);
      const row = surfaces.map((bg) => contrast(fg, bg));
      lines.push(
        `${name.padEnd(22)} ${row.map((r) => r.toFixed(2).padStart(6)).join(" ")}`,
      );
      row.forEach((ratio, i) => {
        cells += 1;
        expect(
          Number(ratio.toFixed(2)),
          `${name} on ${SURFACES[i]} computes ${ratio.toFixed(2)}:1; §12 says ${expected[i]}`,
        ).toBe(expected[i]);
      });
    }
    const onAction = contrast(
      tokenHex("--color-on-action"),
      tokenHex("--color-action"),
    );
    expect(
      Number(onAction.toFixed(2)),
      "--color-on-action on --color-action",
    ).toBe(14.82);
    expect(cells, "the table has 24 cells").toBe(24);

    // Text: 4.5:1 on every surface it can sit on.
    for (const name of TEXT_TOKENS) {
      for (const bg of surfaces) {
        expect(
          contrast(tokenHex(name), bg),
          `${name} is text and must clear 4.5:1 on every surface`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(
      contrast(
        tokenHex("--color-error-ink"),
        tokenHex("--color-error-surface"),
      ),
      "--color-error-ink is text on --color-error-surface",
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      onAction,
      "labels on the action colour are text",
    ).toBeGreaterThanOrEqual(4.5);

    // Non-text: the boundary clears 3:1 on the three ordinary surfaces.
    for (const bg of surfaces.slice(0, ORDINARY_SURFACES)) {
      expect(
        contrast(tokenHex("--color-boundary"), bg),
        "--color-boundary bounds controls and must clear 3:1 (WCAG 1.4.11)",
      ).toBeGreaterThanOrEqual(3);
    }

    // The two fills that cannot carry selection alone, printed for the record.
    const raisedOnPanel = contrast(
      tokenHex("--color-raised"),
      tokenHex("--color-panel"),
    );
    const panelOnWorkspace = contrast(
      tokenHex("--color-panel"),
      tokenHex("--color-workspace"),
    );
    expect(raisedOnPanel, "raised on panel is a whisper").toBeLessThan(1.5);
    expect(panelOnWorkspace, "panel on workspace is a whisper").toBeLessThan(
      1.5,
    );

    console.log(
      [
        `identity: contrast computed from src/app.css against --color-action ${tokenHex("--color-action")} (D-16)`,
        `${"foreground".padEnd(22)} ${SURFACES.map((s) => s.replace("--color-", "").padStart(6)).join(" ")}`,
        ...lines,
        `on-action on action ${onAction.toFixed(2)}; raised on panel ${raisedOnPanel.toFixed(2)}; panel on workspace ${panelOnWorkspace.toFixed(2)}`,
      ].join("\n"),
    );
  });

  it("4. --color-divider FAILS 3:1 on every surface, which is why it is decorative only (WCAG 1.4.11)", () => {
    // A test that asserts a known failure. WCAG 1.4.11 requires 3:1 for the
    // visual boundary of a user-interface component, and exempts a mark that
    // communicates nothing. The divider fails on all four surfaces - 1.71,
    // 1.56, 1.39 and 1.37 - so it may separate a table row from the next or
    // edge a panel where removing the line would change nothing but taste,
    // and it may NEVER bound a control. Test 5 holds the other half. If a
    // future value passes here, the token has stopped being a divider and
    // the rule below it needs re-reading, not just re-greening.
    const divider = tokenHex("--color-divider");
    for (const surface of SURFACES) {
      const ratio = contrast(divider, tokenHex(surface));
      expect(
        ratio,
        `--color-divider on ${surface} is ${ratio.toFixed(2)}:1 - it is expected to FAIL 3:1, and it is decorative only because it does`,
      ).toBeLessThan(3);
    }
  });

  it("5. the boundary rule: no rule in app.css or any component puts --color-divider on a property that bounds a control", () => {
    // The classifier is proved to fire before the tree is trusted. Three
    // fixtures: an element selector, a class that the markup puts on a
    // <button>, and a class on a plain <span> - which is the decorative case
    // and must NOT fire.
    const fixtureStyle = `
      input.field { border: 1px solid var(--color-divider); }
      .chip { border-color: var(--color-divider); }
      .tag { border: 1px solid var(--color-divider); }
      .rule { border-block-start: 1px solid var(--color-divider); }
    `;
    const fixtureTemplate = `
      <button class="chip">x</button>
      <span class="tag">y</span>
      <hr class="rule" />
    `;
    const fired = dividerOnControls(
      "fixture.svelte",
      fixtureStyle,
      fixtureTemplate,
    );
    expect(
      fired.map((f) => f.replace(/^fixture\.svelte:\d+ /, "")),
      "the classifier fires on an <input> selector and on a class the markup puts on a <button>, and not on a span or an hr",
    ).toEqual([
      "input.field { border: 1px solid var(--color-divider) }",
      ".chip { border-color: var(--color-divider) }",
    ]);

    const files = sources();
    expect(
      files.length,
      "the walk over src/ found source files",
    ).toBeGreaterThan(40);
    expect(
      files.map((f) => f.file),
      "the walk reached the stylesheet",
    ).toContain("src/app.css");

    let rules = 0;
    let dividerBorders = 0;
    const offenders: string[] = [];
    for (const { file, style, template } of files) {
      const parsed = rulesIn(style, file);
      rules += parsed.length;
      for (const rule of parsed) {
        for (const [p, v] of declarationsOf(rule.body)) {
          if (BOUNDING_PROPERTY.test(p) && v.includes("var(--color-divider)"))
            dividerBorders += 1;
        }
      }
      offenders.push(...dividerOnControls(file, style, template));
    }
    expect(rules, "rules were parsed across the tree").toBeGreaterThan(200);
    expect(
      dividerBorders,
      "the tree declares at least one divider-coloured border somewhere, so the scan had something to classify",
    ).toBeGreaterThan(0);
    expect(
      offenders,
      "--color-divider on a property that bounds a CONTROL. The divider fails 3:1 on every surface (test 4) and is decorative only; a control's boundary is --color-boundary (§12, WCAG 1.4.11)",
    ).toEqual([]);
    console.log(
      `identity: boundary rule scanned ${rules} rules in ${files.length} files; ${dividerBorders} divider-coloured border declarations, none on a control`,
    );
  });

  it("6. the selection rule: any selector painting --color-raised as a selected state also declares the 3px action left rule and an action-coloured label", () => {
    // Fixtures first, both directions: a row with all three signals passes;
    // the same row without its left rule fails; without its label, fails.
    const good = `
      .row[aria-selected="true"] { background: var(--color-raised); border-inline-start: 3px solid var(--color-action); }
      .row[aria-selected="true"] .label { color: var(--color-action); }
      .card { background: var(--color-raised); }
    `;
    const noRule = `
      .row.selected { background: var(--color-raised); }
      .row.selected .label { color: var(--color-action); }
    `;
    const noLabel = `
      li.active { background-color: var(--color-raised); border-left: 3px solid var(--color-action); }
    `;
    expect(selectionProblems("good.svelte", good)).toEqual({
      selectedFills: 1,
      problems: [],
    });
    expect(selectionProblems("no-rule.svelte", noRule).problems).toHaveLength(
      1,
    );
    expect(selectionProblems("no-rule.svelte", noRule).problems[0]).toContain(
      "WITHOUT a 3px solid var(--color-action) left rule",
    );
    expect(selectionProblems("no-label.svelte", noLabel).problems).toHaveLength(
      1,
    );
    expect(selectionProblems("no-label.svelte", noLabel).problems[0]).toContain(
      "WITHOUT an action-coloured label",
    );

    // Then the tree. On 2026-09-11 nothing paints --color-raised yet (the
    // rail lands at 13-05 and 13-08); the count is printed so the day the
    // first selected row ships, the scan is visibly no longer vacuous.
    const files = sources();
    let selectedFills = 0;
    const problems: string[] = [];
    for (const { file, style } of files) {
      const r = selectionProblems(file, style);
      selectedFills += r.selectedFills;
      problems.push(...r.problems);
    }
    expect(
      problems,
      "a selected state painted in --color-raised without all three signals. §14: never make selection depend only on colour; the PDF draws a 3px action left rule, the raised fill and an action-coloured label together",
    ).toEqual([]);
    console.log(
      `identity: selection rule scanned ${files.length} files; ${selectedFills} selected-state fills in --color-raised, all three-signal`,
    );
  });

  it("7. the type scale's eight roles are declared at 36 / 30 / 17 for the headings (D-17), and 11px appears only as tracked uppercase", () => {
    const rules = rulesIn(css, "src/app.css");
    const byClass = new Map<string, Rule[]>();
    for (const rule of rules) {
      byClass.set(rule.selector, [...(byClass.get(rule.selector) ?? []), rule]);
    }

    for (const [cls, size, face] of TYPE_ROLES) {
      const own = byClass.get(cls);
      expect(own, `${cls} is declared in src/app.css`).toBeDefined();
      const decls = new Map(declarationsOf((own as Rule[])[0].body));
      expect(decls.get("font-size"), `${cls} is ${size}px`).toBe(`${size}px`);
      expect(decls.get("font-family"), `${cls} uses the ${face} face`).toBe(
        `var(--font-${face})`,
      );
    }

    // D-17, by number: the PDF's measured sizes, §12's written figures
    // overridden by measurement. 28-32 / 20 / 14 are NOT what ships.
    const sizeOf = (cls: string) =>
      new Map(declarationsOf((byClass.get(cls) as Rule[])[0].body)).get(
        "font-size",
      );
    expect(sizeOf(".type-page-title"), "page title, D-17").toBe("36px");
    expect(sizeOf(".type-panel-title"), "panel title, D-17").toBe("30px");
    expect(sizeOf(".type-group-title"), "group title, D-17").toBe("17px");

    // The micro role is the only uppercase on the site, and 11px appears in
    // this file ONLY in a rule that also declares text-transform: uppercase
    // and a letter-spacing.
    const micro = new Map(
      declarationsOf((byClass.get(".type-micro") as Rule[])[0].body),
    );
    expect(micro.get("text-transform")).toBe("uppercase");
    expect(micro.get("letter-spacing")).toBe("0.12em");
    let elevens = 0;
    for (const rule of rules) {
      const decls = new Map(declarationsOf(rule.body));
      if (decls.get("font-size") !== "11px") continue;
      elevens += 1;
      expect(
        decls.get("text-transform"),
        `${rule.selector} sets 11px without text-transform: uppercase - 11px is the micro label and nothing else (§12, D-05)`,
      ).toBe("uppercase");
      expect(
        decls.get("letter-spacing"),
        `${rule.selector} sets 11px without tracking`,
      ).toBeDefined();
    }
    expect(
      elevens,
      "11px is declared at least once (the micro role)",
    ).toBeGreaterThan(0);
    for (const rule of rules) {
      const decls = new Map(declarationsOf(rule.body));
      if (decls.get("text-transform") === "uppercase") {
        expect(
          rule.selector,
          `${rule.selector} is uppercase and is not the micro role - uppercase is for short labels only (D-05)`,
        ).toBe(".type-micro");
      }
    }

    // The coarse-pointer field size: 16px under (pointer: coarse), §12's
    // iOS zoom floor.
    const coarse =
      /@media\s*\(pointer:\s*coarse\)\s*\{([^}]*\{[^}]*\})/.exec(css)?.[1] ??
      "";
    expect(coarse, "the (pointer: coarse) block exists").not.toBe("");
    expect(normalise(coarse)).toContain(".type-field { font-size: 16px; }");

    // Tabular numerals for values that change.
    const numerals = new Map(
      declarationsOf((byClass.get(".numerals") as Rule[])[0].body),
    );
    expect(numerals.get("font-variant-numeric")).toBe("tabular-nums");
    expect(numerals.get("font-family")).toBe("var(--font-mono)");
  });

  it("8. the font stacks are declared and Inter Variable leads the sans stack", () => {
    const sans = declared("--font-sans");
    const mono = declared("--font-mono");
    expect(sans, "--font-sans is declared").toBeDefined();
    expect(mono, "--font-mono is declared").toBeDefined();

    const sansFamilies = (sans as string).split(",").map((f) => f.trim());
    expect(sansFamilies[0]).toBe('"Inter Variable"');
    // The named fallbacks after Inter, so a bare generic cannot be the plan.
    expect(
      sansFamilies.length - 1,
      `--font-sans names its fallbacks: ${sansFamilies.slice(1).join(", ")}`,
    ).toBeGreaterThanOrEqual(4);

    const monoFamilies = (mono as string).split(",").map((f) => f.trim());
    expect(monoFamilies[0]).toBe("ui-monospace");
  });

  // Carried unchanged from G-01. EVERY display face, not "the second one" -
  // this is what makes the D-04 licence answer a two-line edit instead of a
  // hunt through components for a family name.
  it("9. --font-display names the family of every display @font-face in the file", () => {
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) =>
      normalise(/font-family\s*:\s*([^;]+);/.exec(m[1])?.[1] ?? ""),
    );
    expect(faces.length, "the file declares @font-face blocks").toBeGreaterThan(
      1,
    );

    const body = normalise((declared("--font-sans") as string).split(",")[0]);
    const display = normalise(
      (declared("--font-display") as string).split(",")[0],
    );
    const displayFaces = faces.filter((f) => f !== body);

    expect(
      displayFaces.length,
      "at least one face is a display face",
    ).toBeGreaterThan(0);
    for (const face of displayFaces) {
      expect(
        face,
        `every display @font-face is the family --font-display names, and ${face} is not ${display}`,
      ).toBe(display);
    }
    expect(faces, "the body face is declared too").toContain(body);
  });

  it("10. the focus ring is present and is the action colour at 2px", () => {
    const rule = /:focus-visible\s*\{([^}]*)\}/.exec(css)?.[1];
    expect(rule, "src/app.css declares a :focus-visible rule").toBeDefined();
    const body = normalise(rule as string);
    expect(body).toContain("outline: 2px solid var(--color-action)");
    expect(body).toContain("outline-offset: 4px");
    // Its border-radius: inherit is exempt from the no-radius gate by name
    // (radius-allowlist.ts EXEMPT_VALUES): it inherits from a zero.
    expect(body).toContain("border-radius: inherit");
  });

  it("11. the favicon is the 9x9 mark, not a framework logo", () => {
    // Carried unchanged. The favicon is NOT the wordmark: the wordmark is
    // 8:1 and cannot be an icon, so the site has two marks with two jobs -
    // the pad outline at 1:1 here, the wordmark at 8:1 in the header.
    const raw = text("src/lib/assets/favicon.svg");
    const svg = strip(raw);

    // The scaffold shipped a framework logo with <title>svelte-logo</title>.
    // IDENT-01 says the mark is the pad; this is what stops it coming back.
    expect(raw, "the favicon names no framework").not.toMatch(/svelte/i);
    expect(/<title>([^<]*)<\/title>/.exec(svg)?.[1]).toBe("HANGAR");
    expect(svg).toMatch(/viewBox="0 0 32 32"/);

    // 81 lattice dots plus the 5 lit cells of the diagonal. Counted, not
    // sampled: "some circles" would pass on half a pad.
    const circles = svg.match(/<circle/g) ?? [];
    expect(circles.length, `the mark draws ${circles.length} circles`).toBe(86);

    const hexes = [...svg.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) =>
      m[0].toLowerCase(),
    );
    expect(
      hexes.length,
      "the mark declares colour literals to check",
    ).toBeGreaterThan(0);
    for (const hex of hexes) {
      expect(hex, `${hex} is one of the two approved colours`).toMatch(
        /^(#000000|#d6ff4e)$/,
      );
    }
  });
});
