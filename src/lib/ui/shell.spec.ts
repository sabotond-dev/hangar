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
import Nav from "./shell/Nav.svelte";
import {
  BREAKPOINTS,
  COARSE_TARGET,
  CONNECTION_SLOT,
  CONTEXT_H,
  HEADER_H,
  NAV,
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
      raw(LAYOUT).includes('href="/LICENSE"'),
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
      raw(LAYOUT).includes("MotionControl"),
      "the layout no longer mounts the motion control itself",
    ).toBe(false);
  });

  it.todo("5. the fractions against the breakpoints - task 13-05-02");
  it.todo(
    "6. the coarse-pointer floor keyed to pointer, not width - task 13-05-02",
  );
});

// BREAKPOINTS and COARSE_TARGET are imported for tests 5 and 6 (task 02).
void BREAKPOINTS;
void COARSE_TARGET;
