/**
 * IDENT-01, asserted as structure rather than promised in a comment.
 *
 * This is a structural spec over src/app.css in the house style of
 * src/lib/config-shape.spec.ts: read the file, strip comments before matching
 * so a comment can never pass or fail a check, and prove the walk was not empty
 * before asserting anything about what it found.
 *
 * The approved contract is .planning/phases/04-first-experience/04-UI-SPEC.md
 * (Color, Design System, Accessibility Contract). Every number below is quoted
 * from it. Values are compared after normalisation — collapsed whitespace and
 * canonical number formatting — because Prettier rewrites `0.50` to `0.5` in
 * CSS, and this file must encode the design contract rather than the
 * formatter's output.
 *
 * X-27 — A DELIBERATE AMENDMENT TO A SIGNED-OFF PHASE'S GATE. This file shipped
 * in Phase 4 asserting exactly EIGHT tokens and exactly TWO permitted hexes.
 * Phase 5 adds a ninth token, `--color-over: #ff3b30`, and this guard was
 * widened for it on purpose, in one commit, under `05-UI-SPEC.md` X-01/X-27 —
 * in the same class as Phase 4's own W-02 change to a Phase 1 licence gate. The
 * reason, in two lines: full-strength lime is the fill of an ENABLED
 * `TRY ON DEVICE`, which goes disabled and loses its lime exactly when a budget
 * is blown, so signalling the failure with more lime would put "go" and "stop"
 * in one hue in one column in one instant. `#ff3b30` is picked for arithmetic —
 * 5.92:1 on black (AA at 12px) and 3.09:1 against `--color-accent`, so the two
 * bar fills are told apart by luminance alone.
 *
 * What the amendment did NOT do, because a widened guard must still guard: the
 * ladder is now nine and a TENTH token still fails; the hex set is now three and
 * a FOURTH hue still fails; `alphaOf()` is not applied to the new token (it is a
 * flat hex, not an alpha of the accent over black), so the AA-on-black loop
 * keeps its existing four members; the `rgb()`-arguments assertion is unchanged;
 * and the favicon's own two-hue regex is untouched, so no red enters the mark.
 * Both directions were observed red before this note was written.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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

/** The approved ladder — 04-UI-SPEC.md Color plus 05-UI-SPEC X-27's alarm. Nine tokens, no tenth. */
const TOKENS: ReadonlyArray<readonly [string, string]> = [
  ["--color-ground", "#000000"],
  ["--color-ink", "rgb(214 255 78 / 0.72)"],
  ["--color-ink-quiet", "rgb(214 255 78 / 0.55)"],
  ["--color-ink-dim", "rgb(214 255 78 / 0.50)"],
  ["--color-line", "rgb(214 255 78 / 0.40)"],
  ["--color-line-soft", "rgb(214 255 78 / 0.20)"],
  ["--color-accent", "#d6ff4e"],
  ["--color-glow", "rgb(214 255 78 / 0.18)"],
  ["--color-over", "#ff3b30"],
];

/** The accent's sRGB channels, 0-255. Every alpha in the ladder sits over black. */
const ACCENT = [214, 255, 78] as const;

const css = strip(text("src/app.css"));
const themeBlock = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";

/** Read a custom property's value out of the stripped source. */
function declared(name: string): string | undefined {
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(css);
  return match ? normalise(match[1]) : undefined;
}

/**
 * Composite an alpha of the accent over #000000 and return the WCAG contrast
 * ratio. Compositing over black is a straight multiply per channel; the rest is
 * the standard relative-luminance formula against black's luminance of 0.
 */
function contrastOnBlack(alpha: number): number {
  const linear = (channel: number) => {
    const c = (channel / 255) * alpha;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linear(ACCENT[0]) +
    0.7152 * linear(ACCENT[1]) +
    0.0722 * linear(ACCENT[2]);
  return (luminance + 0.05) / 0.05;
}

/** The alpha declared for a token, read from the file rather than restated. */
function alphaOf(name: string): number {
  const value = declared(name);
  expect(value, `${name} is declared in src/app.css`).toBeDefined();
  const match = /rgb\(\s*214\s+255\s+78\s*\/\s*([0-9.]+)\s*\)/.exec(
    value as string,
  );
  expect(
    match,
    `${name} is an alpha of the accent over black, got ${value}`,
  ).not.toBeNull();
  return Number.parseFloat((match as RegExpExecArray)[1]);
}

describe("IDENT-01 identity tokens (src/app.css)", () => {
  it("the token ladder is exactly the nine tokens the specs approved", () => {
    for (const [name, value] of TOKENS) {
      expect(declared(name), `${name} carries its approved value`).toBe(
        normalise(value),
      );
    }

    // Nothing outside the nine. Extracted from the @theme block only, because
    // the global rules below it legitimately reference the same names in var().
    const found = [...themeBlock.matchAll(/(--color-[a-z-]+)\s*:/g)].map(
      (m) => m[1],
    );
    expect(
      found.length,
      "the @theme block declares colour tokens",
    ).toBeGreaterThan(0);
    const unique = [...new Set(found)].sort();
    expect(unique).toEqual(TOKENS.map(([name]) => name).sort());
  });

  it("every text token clears WCAG AA on black", () => {
    const ink = contrastOnBlack(alphaOf("--color-ink"));
    const quiet = contrastOnBlack(alphaOf("--color-ink-quiet"));
    const dim = contrastOnBlack(alphaOf("--color-ink-dim"));
    const line = contrastOnBlack(alphaOf("--color-line"));

    expect(
      ink,
      `--color-ink is ${ink.toFixed(2)}:1 on #000000`,
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      quiet,
      `--color-ink-quiet is ${quiet.toFixed(2)}:1 on #000000`,
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      dim,
      `--color-ink-dim is ${dim.toFixed(2)}:1 on #000000`,
    ).toBeGreaterThanOrEqual(4.5);
    // Non-text contrast: functional borders only have to clear 3:1.
    expect(
      line,
      `--color-line is ${line.toFixed(2)}:1 on #000000`,
    ).toBeGreaterThanOrEqual(3.0);
  });

  it("the two font stacks are declared and Quicksand leads the sans stack", () => {
    const sans = declared("--font-sans");
    const mono = declared("--font-mono");
    expect(sans, "--font-sans is declared").toBeDefined();
    expect(mono, "--font-mono is declared").toBeDefined();

    const sansFamilies = (sans as string).split(",").map((f) => f.trim());
    expect(sansFamilies[0]).toBe('"Quicksand"');
    // The named fallbacks after Quicksand, so a bare generic cannot be the plan.
    expect(
      sansFamilies.length - 1,
      `--font-sans names its fallbacks: ${sansFamilies.slice(1).join(", ")}`,
    ).toBeGreaterThanOrEqual(4);

    const monoFamilies = (mono as string).split(",").map((f) => f.trim());
    expect(monoFamilies[0]).toBe("ui-monospace");
  });

  it("the focus ring is present and is the accent at 2px", () => {
    const rule = /:focus-visible\s*\{([^}]*)\}/.exec(css)?.[1];
    expect(rule, "src/app.css declares a :focus-visible rule").toBeDefined();
    const body = normalise(rule as string);
    expect(body).toContain("outline: 2px solid var(--color-accent)");
    expect(body).toContain("outline-offset: 4px");
  });

  it("the ground is true black and the only third hue is the over-budget alarm", () => {
    expect(declared("--color-ground")).toBe("#000000");

    const hexes = [...css.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) =>
      m[0].toLowerCase(),
    );
    const functions = [
      ...css.matchAll(
        /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(([^)]*)\)/g,
      ),
    ];

    // Non-vacuity: the walk must have found literals before "they are all
    // permitted" means anything at all.
    expect(
      hexes.length + functions.length,
      "src/app.css declares colour literals to check",
    ).toBeGreaterThan(0);

    for (const hex of hexes) {
      expect(hex, `${hex} is one of the three approved colours`).toMatch(
        /^(#000000|#d6ff4e|#ff3b30)$/,
      );
    }
    for (const [whole, fn, args] of functions) {
      expect(fn, `${whole} uses rgb(), not another colour space`).toBe("rgb");
      expect(
        normalise(args),
        `${whole} is an alpha of the accent over black`,
      ).toMatch(/^214 255 78 \/ [0-9.]+$/);
    }
  });

  it("the favicon is the 9x9 mark, not a framework logo", () => {
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
