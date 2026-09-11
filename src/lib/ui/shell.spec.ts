/**
 * THE SHELL, SIX TESTS (plan 13-05; 13-CONTEXT.md D-01, D-03, D-05, D-14 Q9,
 * D-17; Bible sections 4, 7, 12, 13, 14, 15).
 *
 * One frame with six regions - a 76px header, a 59px context bar, a rail, a
 * centre, an inspector and a footer - mounted once in src/routes/+layout.svelte
 * and filled by the route through src/lib/ui/shell/shell.svelte.ts. Every
 * number the frame draws lives in src/lib/ui/shell/layout.ts, and EVERY
 * PROPORTION THIS FILE ASSERTS IS IMPORTED FROM THERE, never retyped: the
 * responsive table and the components cannot disagree because there is one
 * table.
 *
 * RENDERED, NOT ONLY SCANNED. The house style for src/lib/ui/ specs is a
 * comment-stripped source scan, and the CSS halves below keep it. But the
 * shell's rules are about what a route GETS - three zones, one of them never
 * empty; a current nav item; the announcer first in the document - and those
 * are properties of the rendered tree. svelte/server's render() runs in the
 * vitest server project (a probe on 2026-09-11 proved it), so the structural
 * halves render the real components with real props and read the markup,
 * which is what lets test 3 drive both shapes of the context bar and test 4
 * both shapes of the footer's pair.
 *
 * WHAT THE FRACTIONS TEST DOES AND DOES NOT GUARANTEE (test 5), said plainly
 * because the plan asked for it: the frame's resolved custom properties are
 * read off the rendered layout and compared to layout.ts, and every shell
 * component's style block is scanned for the layout's own numbers written
 * as px literals. A component that hard-codes `224px` in its <style> is
 * therefore caught. A component that hard-codes the same number some other
 * way - a bare `224` in a style: directive, say - and happens to match is
 * NOT caught by the resolved-value comparison, because a matching literal
 * resolves to the matching value. The literal scan narrows that hole to
 * non-px spellings; it does not close it.
 *
 * ORIENTATION is the one section 13 rule this file cannot reach: a unit
 * test has no viewport to rotate. It is recorded as untested in
 * 13-05-SUMMARY.md, and the e2e suite's viewport work is where it would go
 * if it is ever gated. No third layer is invented for it here.
 *
 * Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRawSnippet } from "svelte";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import Layout from "../../routes/+layout.svelte";
import ContextBar from "./shell/ContextBar.svelte";
import Footer from "./shell/Footer.svelte";
import Inspector from "./shell/Inspector.svelte";
import Nav from "./shell/Nav.svelte";
import Rail from "./shell/Rail.svelte";
import {
  BREAKPOINTS,
  CENTRE_PAD,
  COARSE_TARGET,
  CONNECTION_SLOT,
  CONTEXT_H,
  FOOTER_H,
  GRID_FITS_INSPECTOR,
  HEADER_H,
  INSPECTOR_COMPACT_MAX,
  INSPECTOR_COMPACT_MIN,
  INSPECTOR_FR,
  INSPECTOR_INSET,
  INSPECTOR_MAX,
  INSPECTOR_MIN,
  MEASURED_AT,
  NAV,
  NUMERIC_FIELD_W,
  NUMERIC_GRID_W,
  NUMERIC_GUTTER,
  RAIL_COMPACT_W,
  RAIL_W,
  SURFACE_MAX,
  bandOf,
  frameAt,
  inspectorAt,
  padCount,
} from "./shell/layout";
import { fillShell, SECTIONS } from "./shell/shell.svelte";
import { REPO_ROOT, blankComments } from "./radius-allowlist";

// ---------------------------------------------------------------------------
// Helpers: the source side.
// ---------------------------------------------------------------------------

const SHELL_DIR = "src/lib/ui/shell";
const LAYOUT = "src/routes/+layout.svelte";

const raw = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
const code = (rel: string) => blankComments(raw(rel));

/** The <style> block of a component, comments blanked. */
function styleOf(rel: string): string {
  const text = code(rel);
  const open = text.indexOf("<style");
  if (open < 0) return "";
  const start = text.indexOf(">", open) + 1;
  const end = text.indexOf("</style>", start);
  return text.slice(start, end);
}

interface Rule {
  selector: string;
  body: string;
  /** The @media prelude the rule sits under, or "" at the top level. */
  media: string;
}

/**
 * Every `selector { body }` in a style block, with the @media prelude each
 * sits under. One level of nesting is enough for these files and it is
 * asserted below rather than assumed.
 */
function rulesOf(style: string): Rule[] {
  const out: Rule[] = [];
  const walk = (text: string, media: string) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) break;
      const prelude = text.slice(i, open).trim();
      if (prelude.startsWith("@media")) {
        // Find the matching close for the block.
        let depth = 1;
        let j = open + 1;
        while (j < text.length && depth > 0) {
          if (text[j] === "{") depth += 1;
          else if (text[j] === "}") depth -= 1;
          j += 1;
        }
        walk(
          text.slice(open + 1, j - 1),
          prelude.slice("@media".length).trim(),
        );
        i = j;
        continue;
      }
      const close = text.indexOf("}", open);
      out.push({
        selector: prelude,
        body: text.slice(open + 1, close).trim(),
        media,
      });
      i = close + 1;
    }
  };
  walk(style, "");
  return out;
}

function declarationsOf(body: string): Array<[string, string]> {
  return body
    .split(";")
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0)
    .map((piece) => {
      const colon = piece.indexOf(":");
      return [piece.slice(0, colon).trim(), piece.slice(colon + 1).trim()] as [
        string,
        string,
      ];
    });
}

// ---------------------------------------------------------------------------
// Helpers: the rendered side.
// ---------------------------------------------------------------------------

const count = (text: string, needle: string) => text.split(needle).length - 1;

/** A snippet that renders one marked element, for slots under test. */
const marked = (testid: string, text = testid) =>
  createRawSnippet(() => ({
    render: () => `<span data-testid="${testid}">${text}</span>`,
  }));

/** The layout rendered around a marked page, with the shell filled or not. */
function renderLayout(fill?: Parameters<typeof fillShell>[0]) {
  const clear = fill ? fillShell(fill) : () => {};
  try {
    return render(Layout, {
      props: { children: marked("page", "the page") },
    }).body;
  } finally {
    clear();
  }
}

describe("the shell: one frame, six regions, one set of numbers (src/lib/ui/shell.spec.ts)", () => {
  it("1. the frame declares its regions, each a landmark, with the announcer present exactly once and first in the document", () => {
    const body = renderLayout({
      variant: "app",
      section: "playground",
      breadcrumb: ["PLAYGROUND", "CONFIGURATIONS"],
      status: "Browse. Preview. Make it yours.",
    });

    // The announcer: exactly one, and before every region.
    expect(count(body, 'data-testid="session-live"'), "one announcer").toBe(1);
    const announcerAt = body.indexOf('data-testid="session-live"');
    for (const region of ["<header", "<nav", "<section", "<main", "<footer"]) {
      const at = body.indexOf(region);
      expect(at, `${region} is rendered`).toBeGreaterThan(-1);
      expect(
        announcerAt < at,
        `the announcer precedes ${region} in the document - "the session speaks first" is document order and nothing more`,
      ).toBe(true);
    }

    // Each region is a landmark: header, nav, a section named by its
    // breadcrumb (a region landmark), main, footer.
    expect(count(body, "<header"), "one header").toBe(1);
    expect(count(body, "<nav"), "one nav").toBe(1);
    expect(count(body, "<main"), "one main").toBe(1);
    expect(count(body, "<footer"), "one footer").toBe(1);
    const section = /<section[^>]*aria-labelledby="([^"]+)"/.exec(body);
    expect(
      section,
      "the context bar is a section with aria-labelledby",
    ).not.toBeNull();
    expect(
      body,
      "the breadcrumb element carries the id the section is named by",
    ).toContain(`id="${(section as RegExpExecArray)[1]}"`);

    // The page is inside main, and the header carries the reserved
    // connection box at the PDF's 218 x 37.
    const mainAt = body.indexOf("<main");
    const pageAt = body.indexOf('data-testid="page"');
    expect(pageAt, "the page renders inside main").toBeGreaterThan(mainAt);
    expect(body).toContain(`--connection-w: ${CONNECTION_SLOT.inline}px`);
    expect(body).toContain(`--connection-h: ${CONNECTION_SLOT.block}px`);
    expect(body).toContain(`--header-h: ${HEADER_H}px`);
    expect(body).toContain(`--context-h: ${CONTEXT_H}px`);

    // The intro shape: the header without the nav, no context bar.
    const intro = renderLayout({ variant: "intro" });
    expect(count(intro, "<header"), "the intro has a header").toBe(1);
    expect(count(intro, "<nav"), "the intro has no nav").toBe(0);
    expect(count(intro, "<section"), "the intro has no context bar").toBe(0);
    expect(count(intro, "<main"), "the intro has a main").toBe(1);
    expect(count(intro, 'data-testid="session-live"')).toBe(1);

    // Unfilled: the announcer, the page and the footer, and nothing above
    // the page - the shape the three old routes need until 13-07 and 13-09.
    const bare = renderLayout();
    expect(count(bare, 'data-testid="session-live"')).toBe(1);
    expect(count(bare, "<header"), "unfilled: no header").toBe(0);
    expect(count(bare, "<footer"), "unfilled: still the footer").toBe(1);
    expect(bare.indexOf('data-testid="session-live"')).toBeLessThan(
      bare.indexOf('data-testid="page"'),
    );
  });

  it("2. the nav renders three items, marks exactly one current, and the current one carries both the action colour and the 2px underline", () => {
    const body = render(Nav, { props: { section: "sandbox" } }).body;
    const items = [...body.matchAll(/<a\b[^>]*data-section="([^"]+)"[^>]*>/g)];
    expect(
      items.map((m) => m[1]),
      "three items in the PDF's order",
    ).toEqual(SECTIONS.map((s) => s.id));
    const current = items.filter((m) => /aria-current="page"/.test(m[0]));
    expect(current, "exactly one current item").toHaveLength(1);
    expect(current[0][1]).toBe("sandbox");
    for (const s of SECTIONS) expect(body).toContain(`>${s.label}</a>`);

    // Nothing current when no section is given.
    expect(
      count(render(Nav, { props: {} }).body, "aria-current"),
      "no section, nothing current",
    ).toBe(0);

    // The two signals, read off the CSS keyed to the same attribute.
    const rules = rulesOf(styleOf(`${SHELL_DIR}/Nav.svelte`));
    expect(rules.length, "Nav.svelte has rules").toBeGreaterThan(2);
    const currentRules = rules.filter((r) =>
      r.selector.includes("[aria-current]"),
    );
    expect(currentRules.length, "a rule keyed to aria-current").toBeGreaterThan(
      0,
    );
    const decls = currentRules.flatMap((r) => declarationsOf(r.body));
    expect(
      decls.some(([p, v]) => p === "color" && v === "var(--color-action)"),
      "signal one: the current item is the action colour",
    ).toBe(true);
    const underline = decls.find(
      ([p, v]) =>
        /^border-(block-end|bottom)$/.test(p) &&
        v.includes("solid var(--color-action)"),
    );
    expect(
      underline,
      "signal two: the current item carries a solid underline in the action colour (border-block-end)",
    ).toBeDefined();
    expect(
      body,
      `the underline's width comes from layout.ts (NAV.underline = ${NAV.underline})`,
    ).toContain(`--nav-underline: ${NAV.underline}px`);
    expect(body).toContain(`--nav-size: ${NAV.size}px`);
    expect(body).toContain(`--nav-tracking: ${NAV.tracking}em`);
    expect(
      (underline as [string, string])[1].startsWith("var(--nav-underline)"),
      "and the rule reads that variable rather than a literal",
    ).toBe(true);
  });

  it("3. the context bar renders three zones, and the third is a destination or the sentence - never absent", () => {
    const zones = (body: string) =>
      [...body.matchAll(/data-zone="([^"]+)"/g)].map((m) => m[1]);

    // Shape one: a destination is handed over.
    const withDestination = render(ContextBar, {
      props: {
        breadcrumb: ["SANDBOX", "CUSTOM SURFACE"],
        status: "Draft saved locally",
        destination: marked("destination", "Apply to ZONA"),
      },
    }).body;
    expect(zones(withDestination)).toEqual([
      "breadcrumb",
      "status",
      "destination",
    ]);
    expect(withDestination).toContain('data-testid="destination"');
    expect(withDestination).not.toContain("Preview without hardware");
    expect(withDestination).toContain("SANDBOX");
    expect(withDestination).toContain("CUSTOM SURFACE");
    expect(withDestination).toContain("Draft saved locally");

    // Shape two: nothing to apply - the sentence, in the same zone.
    const withSentence = render(ContextBar, {
      props: {
        breadcrumb: ["PLAYGROUND", "CONFIGURATIONS"],
        status: "Browse. Preview. Make it yours.",
      },
    }).body;
    expect(zones(withSentence)).toEqual([
      "breadcrumb",
      "status",
      "destination",
    ]);
    const third = /data-zone="destination"[^>]*>([^]*?)<\/div>/.exec(
      withSentence,
    );
    expect(third, "the third zone is rendered").not.toBeNull();
    expect(
      (third as RegExpExecArray)[1].replace(/<[^>]+>/g, "").trim(),
      "the third zone carries the PDF's sentence when there is no destination",
    ).toBe("Preview without hardware");

    // A status snippet renders too.
    const snippetStatus = render(ContextBar, {
      props: {
        breadcrumb: ["PLAYGROUND", "ARC"],
        status: marked(
          "status-line",
          "Draft saved locally · Changes not applied",
        ),
      },
    }).body;
    expect(snippetStatus).toContain('data-testid="status-line"');
  });

  it("4. the footer carries the GPLv3 block byte-identical to git's, and the Help & shortcuts · Device actions pair with the motion control under Help & shortcuts", () => {
    // The five lines as they stood in src/routes/+layout.svelte at 07d910f
    // (lines 60-64), the tree 13-05 started from. Read out of git on
    // 2026-09-11, not out of memory, and held here as the literal so the
    // test does not depend on history being reachable; when git can answer,
    // the literal is checked against it too.
    const GPL_BLOCK = [
      '  <a href="/LICENSE" rel="external">GPLv3</a>',
      '  <a href="/THIRD-PARTY.md" rel="external">Third-party notices</a>',
      '  <a href="/source-{__COMMIT_SHA__}.tar.gz" rel="external" download>Source</a>',
      '  <code data-testid="commit-sha">{__COMMIT_SHA__}</code>',
      "  {#if __BUILD_DIRTY__}<span>(built from uncommitted changes)</span>{/if}",
    ].join("\n");

    let fromGit: string | undefined;
    try {
      fromGit = execSync("git show 07d910f:src/routes/+layout.svelte", {
        cwd: REPO_ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split("\n")
        .slice(59, 64)
        .join("\n");
    } catch {
      fromGit = undefined;
    }
    if (fromGit !== undefined) {
      expect(fromGit, "the literal above IS what git holds at 07d910f").toBe(
        GPL_BLOCK,
      );
    } else {
      console.log(
        "shell test 4: git could not answer for 07d910f; the literal stands alone",
      );
    }

    // Byte-identical in the Footer's source, and absent from the layout's.
    expect(
      raw(`${SHELL_DIR}/Footer.svelte`),
      "Footer.svelte carries the five lines verbatim",
    ).toContain(GPL_BLOCK);
    expect(
      code(LAYOUT).includes('href="/LICENSE"'),
      "the layout no longer carries the block itself - it is in the footer, once",
    ).toBe(false);

    // Rendered: the three links, the sha, and the pair's two shapes.
    const alone = render(Footer, { props: {} }).body;
    expect(alone).toContain('href="/LICENSE"');
    expect(alone).toContain('href="/THIRD-PARTY.md"');
    expect(alone).toMatch(/href="\/source-[0-9a-f]+\.tar\.gz"/);
    expect(alone).toContain('data-testid="commit-sha"');
    expect(alone).toContain("HANGAR / by intech studio");
    expect(alone).toContain("Help &amp; shortcuts");
    expect(
      alone,
      "with the slot empty the second label is absent, not dead",
    ).not.toContain("Device actions");
    expect(count(alone, "·"), "and no middle dot without a second label").toBe(
      0,
    );

    const paired = render(Footer, {
      props: { deviceActions: marked("device-actions", "Device actions") },
    }).body;
    expect(paired).toContain("Help &amp; shortcuts");
    expect(paired).toContain("·");
    expect(paired).toContain('data-testid="device-actions"');
    expect(
      paired.indexOf("Help &amp; shortcuts") < paired.indexOf("Device actions"),
      "the PDF's order: Help & shortcuts, then Device actions",
    ).toBe(true);

    // The motion control is under Help & shortcuts: the disclosure button
    // controls the panel that renders it, closed by default.
    const help = /<button[^>]*data-testid="footer-help"[^>]*>/.exec(alone);
    expect(help, "Help & shortcuts is a disclosure button").not.toBeNull();
    const controls = /aria-controls="([^"]+)"/.exec(
      (help as RegExpExecArray)[0],
    );
    expect(controls).not.toBeNull();
    expect((help as RegExpExecArray)[0]).toContain('aria-expanded="false"');
    const panel = new RegExp(
      `<div[^>]*id="${(controls as RegExpExecArray)[1]}"[^>]*>`,
    ).exec(alone);
    expect(panel, "the panel the button controls exists").not.toBeNull();
    expect((panel as RegExpExecArray)[0]).toContain("hidden");
    const panelAt = alone.indexOf((panel as RegExpExecArray)[0]);
    const motionAt = alone.indexOf('data-testid="motion-control"');
    expect(motionAt, "the motion control is rendered").toBeGreaterThan(-1);
    expect(
      motionAt > panelAt,
      "and it sits inside the Help & shortcuts panel",
    ).toBe(true);
    expect(
      code(LAYOUT).includes("MotionControl"),
      "the layout no longer mounts the motion control itself",
    ).toBe(false);
  });

  it("5. the frame resolves section 13's re-derived table at four widths, read from layout.ts; the inspector stays inside its clamp; the surface never exceeds its maximum", () => {
    // The four rows of the table, at one width in each band plus the PDF's
    // own 1500, every expected value an import or arithmetic on imports.
    const wide = frameAt(MEASURED_AT);
    expect(wide.band).toBe("wide");
    expect(wide.rail).toBe(RAIL_W);
    expect(
      wide.inspector,
      "at the PDF's width the inspector is the PDF's",
    ).toBe(INSPECTOR_MAX);
    expect(
      wide.centre,
      "and the centre is the PDF's 820, which is what says the fractions are right",
    ).toBe(MEASURED_AT - RAIL_W - INSPECTOR_MAX);
    expect(wide.surface).toBe(SURFACE_MAX);

    // THE ONE ABSOLUTE ANCHOR, because everything else here trusts the
    // module: D-14 Q9 chose the PDF over the specification BECAUSE the 2 x 2
    // numeric grid (two 190px fields and a 22px gutter, 402px) does not fit
    // in 300. The arithmetic that decision actually rested on is that the
    // grid fits inside the PDF's own inspector at the PDF's own width, inset
    // included - so that is what is asserted, and a layout.ts that fixed
    // the inspector at 300 passes every relative check above and fails here
    // (the first negative check of 13-05-02 found exactly that hole).
    expect(NUMERIC_GRID_W).toBe(NUMERIC_FIELD_W * 2 + NUMERIC_GUTTER);
    expect(GRID_FITS_INSPECTOR).toBe(NUMERIC_GRID_W + INSPECTOR_INSET * 2);
    expect(
      inspectorAt(MEASURED_AT),
      `the inspector at the PDF's width holds the 402px numeric grid with its insets (D-14 Q9): ${inspectorAt(MEASURED_AT)} >= ${GRID_FITS_INSPECTOR}`,
    ).toBeGreaterThanOrEqual(GRID_FITS_INSPECTOR);
    expect(INSPECTOR_MAX).toBeGreaterThan(INSPECTOR_MIN);
    expect(
      Math.round(INSPECTOR_FR * MEASURED_AT),
      "the fraction is the PDF inspector over the PDF viewport",
    ).toBe(INSPECTOR_MAX);
    expect(INSPECTOR_COMPACT_MAX).toBeGreaterThan(INSPECTOR_COMPACT_MIN);

    // THE KNOWN SHORTFALL, ASSERTED SO IT IS NOT FORGOTTEN (the way
    // identity.spec.ts test 4 asserts the divider's known failure). The
    // plan's floor of 380 and the fraction at the 1440 breakpoint (438) do
    // NOT hold the grid; it fits only from about 1494px. When 13-09 narrows
    // the fields, reflows the grid, or the user raises the floor, this
    // assertion is the one that moves - by name, not by accident.
    expect(
      INSPECTOR_MIN < GRID_FITS_INSPECTOR,
      "the wide floor is below the grid's width - a recorded shortfall (layout.ts header); if this fails, the floor rose and the header must say so",
    ).toBe(true);
    expect(
      inspectorAt(BREAKPOINTS[0]) < GRID_FITS_INSPECTOR,
      "at the 1440 breakpoint the grid does not fit either - recorded",
    ).toBe(true);

    const at1440 = frameAt(BREAKPOINTS[0]);
    expect(at1440.band).toBe("wide");
    expect(at1440.rail).toBe(RAIL_W);
    expect(at1440.inspector).toBe(
      Math.round(
        Math.min(INSPECTOR_MAX, Math.max(INSPECTOR_MIN, INSPECTOR_FR * 1440)),
      ),
    );
    expect(at1440.inspector).toBeGreaterThanOrEqual(INSPECTOR_MIN);
    expect(at1440.inspector).toBeLessThanOrEqual(INSPECTOR_MAX);

    const compact = frameAt(1200);
    expect(compact.band).toBe("compact");
    expect(compact.rail).toBe(RAIL_COMPACT_W);
    expect(
      compact.inspector,
      "1024-1439 is section 13's own 268-300 (:363), and the fraction clamps to its top",
    ).toBe(INSPECTOR_COMPACT_MAX);
    expect(compact.inspector).toBeGreaterThanOrEqual(INSPECTOR_COMPACT_MIN);

    const stacked = frameAt(900);
    expect(stacked.band).toBe("stacked");
    expect(stacked.rail).toBe("collapsible");
    expect(stacked.inspector).toBe("below");
    expect(stacked.centre).toBe(900);

    const narrow = frameAt(600);
    expect(narrow.band).toBe("narrow");
    expect(narrow.rail).toBe("drawer");
    expect(narrow.inspector).toBe("sheet");
    expect(narrow.surface).toBe(600 - CENTRE_PAD * 2);

    // The clamp holds across the whole wide band and beyond it; the surface
    // never exceeds its maximum anywhere.
    for (let width = BREAKPOINTS[0]; width <= 3200; width += 40) {
      const f = frameAt(width);
      expect(f.inspector, `inspector at ${width}`).toBeGreaterThanOrEqual(
        INSPECTOR_MIN,
      );
      expect(f.inspector, `inspector at ${width}`).toBeLessThanOrEqual(
        INSPECTOR_MAX,
      );
    }
    for (let width = 320; width <= 3200; width += 40) {
      expect(frameAt(width).surface, `surface at ${width}`).toBeLessThanOrEqual(
        SURFACE_MAX,
      );
    }
    expect(bandOf(BREAKPOINTS[1] - 1)).toBe("stacked");
    expect(bandOf(BREAKPOINTS[2] - 1)).toBe("narrow");

    // THE RENDERED FRAME'S OWN RESOLVED VALUES against the module. The
    // custom properties the stylesheet reads are set from layout.ts; a
    // component that retyped one would have to retype it to the same value
    // to pass here, which is the guarantee this half does and does not give
    // (see the file header).
    const body = renderLayout({
      variant: "app",
      section: "playground",
      breadcrumb: ["PLAYGROUND", "ARC"],
      rail: marked("rail"),
      inspector: marked("inspector"),
    });
    const frame = /<div[^>]*data-testid="shell-frame"[^>]*>/.exec(body);
    expect(frame, "the frame is rendered").not.toBeNull();
    const style = (frame as RegExpExecArray)[0];
    for (const [name, value] of [
      ["--rail-w", `${RAIL_W}px`],
      ["--rail-compact-w", `${RAIL_COMPACT_W}px`],
      ["--inspector-fr", String(INSPECTOR_FR)],
      ["--inspector-min", `${INSPECTOR_MIN}px`],
      ["--inspector-max", `${INSPECTOR_MAX}px`],
      ["--inspector-compact-min", `${INSPECTOR_COMPACT_MIN}px`],
      ["--inspector-compact-max", `${INSPECTOR_COMPACT_MAX}px`],
      ["--surface-max", `${SURFACE_MAX}px`],
      ["--centre-pad", `${CENTRE_PAD}px`],
    ]) {
      expect(style, `${name} resolves to layout.ts's value`).toContain(
        `${name}: ${value}`,
      );
    }
    expect(body.indexOf('data-testid="rail"')).toBeLessThan(
      body.indexOf("<main"),
    );
    expect(body.indexOf('data-testid="inspector"')).toBeGreaterThan(
      body.indexOf("</main>"),
    );
    // Without an inspector the frame says so, and no column is rendered.
    const two = renderLayout({ variant: "app", rail: marked("rail") });
    expect(two).toContain("no-inspector");
    expect(two).not.toContain('data-testid="shell-inspector-column"');

    // The stylesheet reads the variables and writes none of the numbers: no
    // layout figure appears as a px literal in any shell file's style block
    // (the breakpoints are the one CSS-forced exception, held next).
    const figures = [
      HEADER_H,
      CONTEXT_H,
      FOOTER_H,
      RAIL_W,
      RAIL_COMPACT_W,
      INSPECTOR_MIN,
      INSPECTOR_MAX,
      INSPECTOR_COMPACT_MIN,
      INSPECTOR_COMPACT_MAX,
      SURFACE_MAX,
      CONNECTION_SLOT.inline,
      CONNECTION_SLOT.block,
    ];
    const shellFiles = [
      LAYOUT,
      ...["Header", "Nav", "ContextBar", "Footer", "Rail", "Inspector"].map(
        (n) => `${SHELL_DIR}/${n}.svelte`,
      ),
    ];
    const literals: string[] = [];
    for (const file of shellFiles) {
      const style = styleOf(file);
      for (const n of figures) {
        const re = new RegExp(`(?<![0-9.])${n}px`);
        if (re.test(style)) literals.push(`${file} writes ${n}px`);
      }
    }
    expect(
      literals,
      "a shell stylesheet writes one of layout.ts's numbers as a px literal instead of reading the variable",
    ).toEqual([]);
    const frameRules = rulesOf(styleOf(LAYOUT)).filter((r) =>
      r.selector.includes(".frame"),
    );
    expect(frameRules.length).toBeGreaterThan(0);
    expect(
      frameRules.some((r) => r.body.includes("var(--rail-w)")),
      "the grid reads --rail-w",
    ).toBe(true);
    expect(
      frameRules.some((r) => r.body.includes("var(--inspector-fr)")),
      "the inspector reads --inspector-fr",
    ).toBe(true);

    // The breakpoints: every max-width query in a shell file is one of
    // section 13's, written as the 0.02px-below form the site uses.
    const queries: string[] = [];
    for (const file of shellFiles) {
      for (const m of styleOf(file).matchAll(
        /@media[^{]*max-width:\s*([0-9.]+)px/g,
      )) {
        const px = Number.parseFloat(m[1]);
        const breakpoint = Math.round((px + 0.02) * 100) / 100;
        expect(
          [...BREAKPOINTS] as number[],
          `${file} queries max-width ${m[1]}px, which is not one of section 13's breakpoints`,
        ).toContain(breakpoint);
        queries.push(`${file}:${breakpoint}`);
      }
    }
    expect(queries.length, "the layout declares width queries").toBeGreaterThan(
      2,
    );
    for (const bp of BREAKPOINTS) {
      expect(
        queries.some((q) => q.startsWith(LAYOUT) && q.endsWith(`:${bp}`)),
        `the layout has a query at ${bp}`,
      ).toBe(true);
    }

    // The count formatter: two digits, and above 99 it stops padding.
    expect(padCount(36)).toBe("36");
    expect(padCount(8)).toBe("08");
    expect(padCount(0)).toBe("00");
    expect(padCount(99)).toBe("99");
    expect(padCount(100), "100 is not truncated to 00").toBe("100");
    expect(padCount(120)).toBe("120");
    expect(padCount(-1)).toBe("00");
    expect(padCount(Number.NaN)).toBe("00");
  });

  it("6. every interactive element in the shell resolves both 44px axes under (pointer: coarse), and the rule is keyed to pointer and not to a width", () => {
    // The rule, by its own text: exactly one @media block in the layout
    // declares the coarse floor, and its query names the pointer, not a
    // width - the only way a unit test can tell the two apart.
    const rules = rulesOf(styleOf(LAYOUT));
    const coarse = rules.filter(
      (r) =>
        r.media !== "" &&
        declarationsOf(r.body).some(
          ([p, v]) => p === "min-block-size" && v === "var(--coarse-target)",
        ) &&
        declarationsOf(r.body).some(
          ([p, v]) => p === "min-inline-size" && v === "var(--coarse-target)",
        ),
    );
    expect(coarse, "one rule declares the floor on both axes").toHaveLength(1);
    const query = coarse[0].media;
    expect(query, "the query's own text").toBe("(pointer: coarse)");
    expect(query).toMatch(/pointer/);
    expect(query, "and it names no width").not.toMatch(/width/);
    expect(
      rules.filter(
        (r) => r.media.includes("width") && r.body.includes("--coarse-target"),
      ),
      "no width query touches the target size",
    ).toEqual([]);

    // The variable resolves to layout.ts's value on the rendered site root.
    const body = renderLayout({
      variant: "app",
      section: "sandbox",
      breadcrumb: ["SANDBOX", "CUSTOM SURFACE"],
      rail: createRawSnippet(() => ({
        render: () =>
          render(Rail, {
            props: {
              sections: [
                {
                  title: "ADD AN ELEMENT",
                  rows: [{ id: "fader", label: "Fader", meta: "+" }],
                },
                {
                  title: "ON THIS SURFACE",
                  rows: [
                    { id: "filter", label: "Filter", meta: "Fader" },
                    {
                      id: "arc",
                      label: "Arc",
                      index: 1,
                      href: "/playground/arc/",
                    },
                  ],
                },
              ],
              selected: "filter",
            },
          }).body,
      })),
      inspector: createRawSnippet(() => ({
        render: () =>
          render(Inspector, {
            props: {
              eyebrow: "SELECTED ELEMENT / FADER",
              headline: marked("headline", "Filter"),
              sections: [
                { title: "Position & size", content: marked("position") },
              ],
              actions: createRawSnippet(() => ({
                render: () =>
                  '<button type="button">Duplicate</button><button type="button">Delete element</button>',
              })),
            },
          }).body,
      })),
      // The footer's Device actions is the layout's own since 13-11
      // (DeviceActions.svelte), so the rendered body carries its button
      // without the fill naming it; the walk below still reaches it.
    });
    expect(body).toContain(`--coarse-target: ${COARSE_TARGET}px`);
    expect(
      body,
      "the layout mounts the footer's Device actions itself (13-11)",
    ).toContain('data-testid="device-actions"');

    // Every interactive tag the shell renders is covered by the rule's
    // selector: the walk is over the rendered markup, so a slot's own
    // controls (the rail's rows, the inspector's pair, the footer's device
    // actions) are covered too, not only the shell's own. Non-vacuous.
    const tags = [
      ...body.matchAll(/<(a|button|input|select|textarea)\b([^>]*)>/g),
    ];
    expect(tags.length, "interactive elements were found").toBeGreaterThan(8);
    const selector = coarse[0].selector.replace(/\s+/g, " ");
    const uncovered = tags
      .filter((m) => {
        const tag = m[1];
        if (tag === "input" && /type="(checkbox|radio)"/.test(m[2]))
          return false;
        return !new RegExp(`(^|[^a-z-])${tag}([^a-z-]|$)`).test(selector);
      })
      .map((m) => m[0].slice(0, 60));
    expect(
      uncovered,
      "a rendered control the coarse rule does not name",
    ).toEqual([]);
    expect(selector).toContain("a");
    expect(selector).toContain("button");
    expect(selector).toContain("input");
    expect(selector).toContain("select");
    expect(
      count(body, "<a ") + count(body, "<button"),
      "links and buttons were rendered across header, nav, rail, inspector and footer",
    ).toBeGreaterThan(8);

    // And at every pointer the shell's own controls declare the site's
    // per-control floor themselves (the house rule browse-ui.spec.ts and
    // device-ui.spec.ts hold for their components), so the coarse rule is a
    // guarantee for a route's slot content, not a rescue for the shell's.
    for (const file of ["Header", "Nav", "Footer"]) {
      const style = styleOf(`${SHELL_DIR}/${file}.svelte`);
      expect(style, `${file}.svelte declares the block floor`).toContain(
        "min-block-size: 44px",
      );
      expect(style, `${file}.svelte declares the inline floor`).toContain(
        "min-inline-size: 44px",
      );
    }
    expect(
      styleOf(`${SHELL_DIR}/Rail.svelte`),
      "Rail.svelte declares the inline floor",
    ).toContain("min-inline-size: 44px");
    // The rail's row declares the PDF's height beneath that floor, via the
    // variable, and takes the larger.
    expect(styleOf(`${SHELL_DIR}/Rail.svelte`)).toContain(
      "max(var(--rail-row-h), 44px)",
    );

    // D-03's three signals on the rail's selected row, off the rendered
    // markup and the CSS keyed to the same attribute; identity.spec.ts test
    // 6 scans the file too, and this is its first real subject.
    expect(count(body, 'aria-current="true"'), "one selected row").toBe(1);
    const railRules = rulesOf(styleOf(`${SHELL_DIR}/Rail.svelte`)).filter((r) =>
      r.selector.includes("[aria-current]"),
    );
    const decls = railRules.flatMap((r) => declarationsOf(r.body));
    expect(decls).toContainEqual(["background", "var(--color-raised)"]);
    expect(decls).toContainEqual([
      "border-inline-start",
      "3px solid var(--color-action)",
    ]);
    expect(decls).toContainEqual(["color", "var(--color-action)"]);
    // The count formatter reaches the markup: index 1 renders as 01.
    expect(body).toContain(">01<");
    expect(body).toContain('aria-current="page"');
    // The inspector's body is its one scroll container.
    const inspectorRules = rulesOf(styleOf(`${SHELL_DIR}/Inspector.svelte`));
    const scrollers = inspectorRules.filter((r) =>
      declarationsOf(r.body).some(
        ([p, v]) => p === "overflow-y" && v === "auto",
      ),
    );
    expect(
      scrollers.map((r) => r.selector),
      "the body scrolls, alone",
    ).toEqual([".body"]);
    expect(body).toContain('data-testid="shell-inspector-body"');
    expect(body.indexOf('data-testid="headline"')).toBeLessThan(
      body.indexOf('data-testid="shell-inspector-body"'),
    );
  });
});
